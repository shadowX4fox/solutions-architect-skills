// Unit tests for session-log.ts.
//
// Covers: append + read happy path, dedup-on-read, exempt-path no-ops,
// timestamp ordering, clear, retain, and sessionLogPath stability.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  SESSION_LOG_ROOT,
  appendEdit,
  clearSessionEdits,
  readSessionEdits,
  retainSessionEdits,
  sessionLogPath,
} from "./session-log";

let projectRoot: string;
let logPath: string;
const SESSION_ID = "test-session-fixed";

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "session-log-test-"));
  mkdirSync(join(projectRoot, "docs", "components"), { recursive: true });
  writeFileSync(join(projectRoot, "ARCHITECTURE.md"), "# X\n", "utf-8");
  writeFileSync(join(projectRoot, "docs", "README.md"), "# index\n", "utf-8");
  writeFileSync(join(projectRoot, "docs", "01-system-overview.md"), "# overview\n", "utf-8");
  writeFileSync(join(projectRoot, "docs", "components", "api-gateway.md"), "# api\n", "utf-8");
  writeFileSync(join(projectRoot, "docs", "components", "payment-service.md"), "# payments\n", "utf-8");
  logPath = sessionLogPath(projectRoot, SESSION_ID);
  if (existsSync(logPath)) rmSync(logPath);
});

afterEach(() => {
  if (existsSync(projectRoot)) rmSync(projectRoot, { recursive: true, force: true });
  if (existsSync(logPath)) rmSync(logPath);
});

describe("appendEdit + readSessionEdits", () => {
  test("creates editlog and writes one JSONL line for an in-tree doc", () => {
    appendEdit(join(projectRoot, "docs/01-system-overview.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T14:00:00Z",
    });
    expect(existsSync(logPath)).toBe(true);
    const raw = readFileSync(logPath, "utf-8");
    expect(raw.trim().split("\n")).toHaveLength(1);
    const entry = JSON.parse(raw.trim());
    expect(entry.path).toBe("docs/01-system-overview.md");
    expect(entry.ts).toBe("2026-04-25T14:00:00Z");
  });

  test("dedupes by path on read but keeps both raw lines for chronology", () => {
    appendEdit(join(projectRoot, "docs/components/api-gateway.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T14:00:00Z",
    });
    appendEdit(join(projectRoot, "docs/components/api-gateway.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T14:30:00Z",
    });
    const raw = readFileSync(logPath, "utf-8");
    expect(raw.trim().split("\n")).toHaveLength(2);
    const edits = readSessionEdits(projectRoot, SESSION_ID);
    expect(edits).toHaveLength(1);
    expect(edits[0].timestamp).toBe("2026-04-25T14:30:00Z");
    expect(edits[0].relativePath).toBe("docs/components/api-gateway.md");
  });

  test("appendEdit on ARCHITECTURE.md is a no-op", () => {
    appendEdit(join(projectRoot, "ARCHITECTURE.md"), projectRoot, { sessionId: SESSION_ID });
    expect(existsSync(logPath)).toBe(false);
    expect(readSessionEdits(projectRoot, SESSION_ID)).toHaveLength(0);
  });

  test("appendEdit on docs/README.md (component index) is a no-op", () => {
    appendEdit(join(projectRoot, "docs/README.md"), projectRoot, { sessionId: SESSION_ID });
    expect(existsSync(logPath)).toBe(false);
  });

  test("appendEdit on a path outside docs/ is a no-op", () => {
    writeFileSync(join(projectRoot, "outside.md"), "# x\n", "utf-8");
    appendEdit(join(projectRoot, "outside.md"), projectRoot, { sessionId: SESSION_ID });
    expect(existsSync(logPath)).toBe(false);
  });

  test("appendEdit on a non-.md file inside docs is a no-op", () => {
    writeFileSync(join(projectRoot, "docs", "notes.txt"), "x", "utf-8");
    appendEdit(join(projectRoot, "docs/notes.txt"), projectRoot, { sessionId: SESSION_ID });
    expect(existsSync(logPath)).toBe(false);
  });
});

describe("readSessionEdits", () => {
  test("returns latest-first when multiple distinct files were edited", () => {
    appendEdit(join(projectRoot, "docs/01-system-overview.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T13:00:00Z",
    });
    appendEdit(join(projectRoot, "docs/components/payment-service.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T14:00:00Z",
    });
    appendEdit(join(projectRoot, "docs/components/api-gateway.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T15:00:00Z",
    });
    const edits = readSessionEdits(projectRoot, SESSION_ID);
    expect(edits.map((e) => e.relativePath)).toEqual([
      "docs/components/api-gateway.md",
      "docs/components/payment-service.md",
      "docs/01-system-overview.md",
    ]);
  });

  test("ignores malformed JSONL lines but preserves valid ones", () => {
    mkdirSync(join(SESSION_LOG_ROOT), { recursive: true });
    writeFileSync(
      logPath,
      [
        '{"ts":"2026-04-25T14:00:00Z","path":"docs/01-system-overview.md","tool":"Write"}',
        "{not json",
        "",
        '{"ts":"2026-04-25T15:00:00Z","path":"docs/components/api-gateway.md","tool":"Edit"}',
      ].join("\n") + "\n",
      "utf-8",
    );
    const edits = readSessionEdits(projectRoot, SESSION_ID);
    expect(edits).toHaveLength(2);
    expect(edits[0].relativePath).toBe("docs/components/api-gateway.md");
  });
});

describe("clearSessionEdits", () => {
  test("truncates the editlog to zero bytes but leaves the file in place", () => {
    appendEdit(join(projectRoot, "docs/components/api-gateway.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T14:00:00Z",
    });
    expect(statSync(logPath).size).toBeGreaterThan(0);
    clearSessionEdits(projectRoot, SESSION_ID);
    expect(existsSync(logPath)).toBe(true);
    expect(statSync(logPath).size).toBe(0);
    expect(readSessionEdits(projectRoot, SESSION_ID)).toHaveLength(0);
  });

  test("is a no-op when the editlog does not exist", () => {
    clearSessionEdits(projectRoot, SESSION_ID);
    expect(existsSync(logPath)).toBe(false);
  });
});

describe("retainSessionEdits", () => {
  test("keeps only entries matching the predicate", () => {
    appendEdit(join(projectRoot, "docs/01-system-overview.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T13:00:00Z",
    });
    appendEdit(join(projectRoot, "docs/components/api-gateway.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T14:00:00Z",
    });
    appendEdit(join(projectRoot, "docs/components/payment-service.md"), projectRoot, {
      sessionId: SESSION_ID,
      timestamp: "2026-04-25T15:00:00Z",
    });
    retainSessionEdits(projectRoot, (rel) => rel.includes("api-gateway"), SESSION_ID);
    const edits = readSessionEdits(projectRoot, SESSION_ID);
    expect(edits).toHaveLength(1);
    expect(edits[0].relativePath).toBe("docs/components/api-gateway.md");
  });
});

describe("sessionLogPath", () => {
  test("uses the SESSION_LOG_ROOT prefix and a hash-session-id naming scheme", () => {
    const path = sessionLogPath(projectRoot, "session-abc-123");
    expect(path.startsWith(SESSION_LOG_ROOT + "/")).toBe(true);
    expect(path.endsWith("-session-abc-123.editlog")).toBe(true);
  });

  test("sanitizes unsafe characters in the session id", () => {
    const path = sessionLogPath(projectRoot, "weird/id with spaces");
    expect(path).not.toContain("/weird/id with spaces");
    expect(path).toContain("weird_id_with_spaces");
  });
});
