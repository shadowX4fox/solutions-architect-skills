/**
 * Unit tests for explore-cache.ts — covers cache read/write,
 * inputs-hash invalidation on mtime change / plugin upgrade,
 * project-hash collision impossibility, and glob expansion.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  cachePath,
  checkCache,
  computeInputsHash,
  expandGlobs,
  projectHash,
  readCache,
  writeCache,
} from "./explore-cache";

let projectRoot: string;
let cacheRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "explorer-test-proj-"));
  cacheRoot = join("/tmp/architecture-explorer", projectHash(projectRoot));
});

afterEach(() => {
  if (existsSync(projectRoot)) rmSync(projectRoot, { recursive: true, force: true });
  if (existsSync(cacheRoot)) rmSync(cacheRoot, { recursive: true, force: true });
});

describe("projectHash", () => {
  test("is deterministic for the same path", () => {
    const a = projectHash(projectRoot);
    const b = projectHash(projectRoot);
    expect(a).toBe(b);
  });

  test("is different for different paths", () => {
    const other = mkdtempSync(join(tmpdir(), "explorer-test-other-"));
    try {
      expect(projectHash(projectRoot)).not.toBe(projectHash(other));
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  test("returns a 32-char hex string", () => {
    const hash = projectHash(projectRoot);
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("cachePath", () => {
  test("places task_type files inside the project's cache dir", () => {
    const path = cachePath(projectRoot, "compliance-sre");
    expect(path).toContain("/tmp/architecture-explorer/");
    expect(path.endsWith("/compliance-sre.json")).toBe(true);
    expect(path).toContain(projectHash(projectRoot));
  });
});

describe("write/read/check cache", () => {
  test("readCache returns null when no cache exists", () => {
    expect(readCache(projectRoot, "compliance-sre")).toBeNull();
  });

  test("writeCache then readCache round-trips the YAML body", () => {
    const yaml = "schema_version: 1\nstatus: OK\n";
    const path = writeCache(projectRoot, "compliance-sre", "sha256:abc", yaml);
    expect(existsSync(path)).toBe(true);

    const entry = readCache(projectRoot, "compliance-sre");
    expect(entry).not.toBeNull();
    expect(entry?.result_yaml).toBe(yaml);
    expect(entry?.inputs_hash).toBe("sha256:abc");
    expect(entry?.task_type).toBe("compliance-sre");
  });

  test("checkCache returns hit when inputs_hash matches", () => {
    writeCache(projectRoot, "compliance-sre", "sha256:abc", "ok\n");
    const result = checkCache(projectRoot, "compliance-sre", "sha256:abc");
    expect(result.hit).toBe(true);
  });

  test("checkCache returns miss when inputs_hash differs", () => {
    writeCache(projectRoot, "compliance-sre", "sha256:abc", "ok\n");
    const result = checkCache(projectRoot, "compliance-sre", "sha256:xyz");
    expect(result.hit).toBe(false);
  });

  test("checkCache returns miss when no cache file exists", () => {
    const result = checkCache(projectRoot, "compliance-sre", "sha256:abc");
    expect(result.hit).toBe(false);
    expect(result.entry).toBeNull();
  });

  test("readCache returns null when schema_version mismatches", () => {
    const path = cachePath(projectRoot, "compliance-sre");
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(
      path,
      JSON.stringify({
        schema_version: 99,
        task_type: "compliance-sre",
        inputs_hash: "x",
        generated_at: "",
        result_yaml: "y",
      }),
    );
    expect(readCache(projectRoot, "compliance-sre")).toBeNull();
  });
});

describe("computeInputsHash", () => {
  function makeCandidate(path: string, body: string): string {
    const abs = join(projectRoot, path);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
    return path;
  }

  function makeConfig(): string {
    const path = join(projectRoot, "explorer-config.json");
    writeFileSync(path, JSON.stringify({ candidate_files: ["docs/*.md"] }));
    return path;
  }

  test("changes when a candidate file's mtime changes", () => {
    const config = makeConfig();
    const file = makeCandidate("docs/01-overview.md", "hello\n");

    const h1 = computeInputsHash({
      projectRoot,
      taskType: "compliance-sre",
      configPath: config,
      pluginVersion: "3.14.0",
      candidateFiles: [file],
    });

    const future = new Date(Date.now() + 60_000);
    utimesSync(join(projectRoot, file), future, future);

    const h2 = computeInputsHash({
      projectRoot,
      taskType: "compliance-sre",
      configPath: config,
      pluginVersion: "3.14.0",
      candidateFiles: [file],
    });

    expect(h1).not.toBe(h2);
  });

  test("changes when plugin_version changes", () => {
    const config = makeConfig();
    const file = makeCandidate("docs/01-overview.md", "hello\n");
    const args = {
      projectRoot,
      taskType: "compliance-sre",
      configPath: config,
      candidateFiles: [file],
    };
    const h1 = computeInputsHash({ ...args, pluginVersion: "3.14.0" });
    const h2 = computeInputsHash({ ...args, pluginVersion: "3.14.1" });
    expect(h1).not.toBe(h2);
  });

  test("changes when task_type changes", () => {
    const config = makeConfig();
    const file = makeCandidate("docs/01-overview.md", "hello\n");
    const args = {
      projectRoot,
      configPath: config,
      pluginVersion: "3.14.0",
      candidateFiles: [file],
    };
    const h1 = computeInputsHash({ ...args, taskType: "compliance-sre" });
    const h2 = computeInputsHash({ ...args, taskType: "compliance-security" });
    expect(h1).not.toBe(h2);
  });

  test("is stable across re-runs with no changes", () => {
    const config = makeConfig();
    const file = makeCandidate("docs/01-overview.md", "hello\n");
    const args = {
      projectRoot,
      taskType: "compliance-sre",
      configPath: config,
      pluginVersion: "3.14.0",
      candidateFiles: [file],
    };
    const h1 = computeInputsHash(args);
    const h2 = computeInputsHash(args);
    expect(h1).toBe(h2);
  });

  test("includes missing files as 'missing' rather than crashing", () => {
    const config = makeConfig();
    const hash = computeInputsHash({
      projectRoot,
      taskType: "compliance-sre",
      configPath: config,
      pluginVersion: "3.14.0",
      candidateFiles: ["docs/does-not-exist.md"],
    });
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("expandGlobs", () => {
  function touch(rel: string, body = "x\n"): void {
    const abs = join(projectRoot, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }

  test("expands simple star pattern", () => {
    touch("docs/01-overview.md");
    touch("docs/02-arch.md");
    touch("docs/notes.txt");

    const matches = expandGlobs(projectRoot, ["docs/*.md"]);
    expect(matches.sort()).toEqual(["docs/01-overview.md", "docs/02-arch.md"]);
  });

  test("expands ** double-star pattern recursively", () => {
    touch("docs/components/01-svc-a.md");
    touch("docs/components/sub-system/02-svc-b.md");
    touch("docs/components/README.md");

    const matches = expandGlobs(projectRoot, ["docs/components/**/*.md"]);
    expect(matches).toContain("docs/components/01-svc-a.md");
    expect(matches).toContain("docs/components/sub-system/02-svc-b.md");
    expect(matches).toContain("docs/components/README.md");
  });

  test("returns deduplicated and sorted results", () => {
    touch("ARCHITECTURE.md");
    touch("docs/01-overview.md");

    const matches = expandGlobs(projectRoot, ["ARCHITECTURE.md", "ARCHITECTURE.md", "docs/*.md"]);
    expect(matches).toEqual(["ARCHITECTURE.md", "docs/01-overview.md"]);
  });

  test("ignores patterns that match nothing", () => {
    touch("ARCHITECTURE.md");
    const matches = expandGlobs(projectRoot, ["adr/*.md", "ARCHITECTURE.md"]);
    expect(matches).toEqual(["ARCHITECTURE.md"]);
  });

  test("handles literal (non-glob) paths to non-existent files gracefully", () => {
    const matches = expandGlobs(projectRoot, ["does-not-exist.md"]);
    expect(matches).toEqual([]);
  });
});
