// Session-scoped editlog for EXPLORER_HEADER staleness tracking.
//
// The PostToolUse hook calls `appendEdit` after every Write/Edit on a
// file under `docs/**`. The orchestrator and the
// `/regenerate-explorer-headers --session` slash command read the log
// to know which files were edited in the current session. The
// regen command clears the log on success.
//
// Storage: /tmp/architecture-explorer/sessions/<projectHash>-<sessionId>.editlog
// Format: JSONL, one line per edit event:
//   {"ts":"2026-04-25T14:20:05Z","path":"docs/components/api-gateway.md","tool":"Write"}
//
// Exemptions: ARCHITECTURE.md, README.md, paths outside docs/** are
// silent no-ops (the hook never blocks an edit, even on dropped paths).

import { createHash } from "crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  truncateSync,
  writeFileSync,
} from "fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "path";

export const SESSION_LOG_ROOT = "/tmp/architecture-explorer/sessions";

export type EditEntry = {
  timestamp: string;
  relativePath: string;
  tool?: string;
};

function projectHash(projectRoot: string): string {
  let real: string;
  try {
    real = realpathSync(projectRoot);
  } catch {
    real = resolve(projectRoot);
  }
  return createHash("sha256").update(real).digest("hex").slice(0, 32);
}

function effectiveSessionId(sessionId?: string): string {
  if (sessionId && sessionId.trim()) return sessionId.trim();
  const env = process.env.CLAUDE_SESSION_ID;
  if (env && env.trim()) return env.trim();
  // Stable per-day fallback so external-editor edits still aggregate.
  return new Date().toISOString().slice(0, 10);
}

export function sessionLogPath(projectRoot: string, sessionId?: string): string {
  const sid = effectiveSessionId(sessionId);
  const safeSid = sid.replace(/[^A-Za-z0-9._-]/g, "_");
  return join(SESSION_LOG_ROOT, `${projectHash(projectRoot)}-${safeSid}.editlog`);
}

// Returns the project-relative path if `filePath` lies under `docs/**`
// and is not in the exempt set, else null.
function eligibleRelativePath(filePath: string, projectRoot: string): string | null {
  const abs = isAbsolute(filePath) ? filePath : resolve(projectRoot, filePath);
  let rel: string;
  try {
    rel = relative(realpathSync(projectRoot), realpathSync(abs));
  } catch {
    rel = relative(resolve(projectRoot), resolve(abs));
  }
  if (!rel || rel.startsWith("..")) return null;
  const norm = rel.split(sep).join("/");
  if (!norm.startsWith("docs/")) return null;
  if (norm === "docs/README.md") return null;
  if (norm.endsWith("/README.md") && norm.startsWith("docs/components/") && norm.split("/").length === 3) {
    return null;
  }
  if (norm === "ARCHITECTURE.md") return null;
  if (!norm.endsWith(".md")) return null;
  return norm;
}

export function appendEdit(
  filePath: string,
  projectRoot: string,
  options: { sessionId?: string; tool?: string; timestamp?: string } = {},
): void {
  const rel = eligibleRelativePath(filePath, projectRoot);
  if (!rel) return;
  const path = sessionLogPath(projectRoot, options.sessionId);
  mkdirSync(dirname(path), { recursive: true });
  const entry = {
    ts: options.timestamp ?? new Date().toISOString(),
    path: rel,
    tool: options.tool ?? "Write",
  };
  appendFileSync(path, JSON.stringify(entry) + "\n", "utf-8");
}

export function readSessionEdits(projectRoot: string, sessionId?: string): EditEntry[] {
  const path = sessionLogPath(projectRoot, sessionId);
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf-8");
  const latestByPath = new Map<string, EditEntry>();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: { ts?: unknown; path?: unknown; tool?: unknown };
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof parsed.path !== "string" || !parsed.path) continue;
    const ts = typeof parsed.ts === "string" ? parsed.ts : "";
    const tool = typeof parsed.tool === "string" ? parsed.tool : undefined;
    const existing = latestByPath.get(parsed.path);
    if (!existing || existing.timestamp < ts) {
      latestByPath.set(parsed.path, { timestamp: ts, relativePath: parsed.path, tool });
    }
  }
  return Array.from(latestByPath.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function clearSessionEdits(projectRoot: string, sessionId?: string): void {
  const path = sessionLogPath(projectRoot, sessionId);
  if (!existsSync(path)) return;
  truncateSync(path, 0);
}

// Convenience: rewrite the editlog with a filtered subset, used by the
// regen command to remove only the successfully regenerated entries
// while leaving failures behind for a re-run.
export function retainSessionEdits(
  projectRoot: string,
  predicate: (relativePath: string) => boolean,
  sessionId?: string,
): void {
  const entries = readSessionEdits(projectRoot, sessionId);
  const path = sessionLogPath(projectRoot, sessionId);
  if (!existsSync(path)) return;
  const kept = entries.filter((e) => predicate(e.relativePath));
  if (kept.length === 0) {
    truncateSync(path, 0);
    return;
  }
  const lines = kept.map((e) => JSON.stringify({ ts: e.timestamp, path: e.relativePath, tool: e.tool ?? "Write" }));
  writeFileSync(path, lines.join("\n") + "\n", "utf-8");
}
