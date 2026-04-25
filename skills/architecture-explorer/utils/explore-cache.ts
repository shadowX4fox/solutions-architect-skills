/**
 * /tmp/architecture-explorer/<project_hash>/<task_type>.json cache.
 *
 * The explorer is always-on, so cache hits are critical for keeping
 * latency invisible on no-op runs (re-running compliance after
 * generating it once, re-asking the same question, etc).
 *
 * Cache layout:
 *   /tmp/architecture-explorer/
 *     <sha256(realpath(project_root))>/
 *       compliance-sre.json
 *       analysis-spof.json
 *       ...
 *
 * Each cache file stores the last EXPLORE_RESULT for that task_type,
 * plus its inputs_hash. On a subsequent run we recompute inputs_hash
 * (mtimes of candidate_files + plugin_version + config_mtime); if it
 * matches the stored value, we return the cached result verbatim
 * with `cache_hit: true` and zero Haiku tokens.
 *
 * /tmp is intentional — explorer output is pure derivative state and
 * we'd rather rebuild than risk staleness across `git checkout`,
 * CI containers, or branch switches.
 *
 * @module explore-cache
 */
import { createHash } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, isAbsolute, join, relative, resolve } from "path";

export const CACHE_ROOT = "/tmp/architecture-explorer";
export const CACHE_SCHEMA_VERSION = 1;

export type CacheEntry = {
  schema_version: number;
  task_type: string;
  inputs_hash: string;
  generated_at: string;
  result_yaml: string;
};

export function projectHash(projectRoot: string): string {
  const real = realpathSync(projectRoot);
  return createHash("sha256").update(real).digest("hex").slice(0, 32);
}

export function cachePath(projectRoot: string, taskType: string): string {
  return join(CACHE_ROOT, projectHash(projectRoot), `${taskType}.json`);
}

export function readCache(projectRoot: string, taskType: string): CacheEntry | null {
  const path = cachePath(projectRoot, taskType);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (parsed.schema_version !== CACHE_SCHEMA_VERSION) return null;
    if (typeof parsed.inputs_hash !== "string" || !parsed.inputs_hash) return null;
    if (typeof parsed.result_yaml !== "string") return null;
    return {
      schema_version: parsed.schema_version,
      task_type: parsed.task_type ?? taskType,
      inputs_hash: parsed.inputs_hash,
      generated_at: parsed.generated_at ?? "",
      result_yaml: parsed.result_yaml,
    };
  } catch {
    return null;
  }
}

export function writeCache(
  projectRoot: string,
  taskType: string,
  inputsHash: string,
  resultYaml: string,
): string {
  const path = cachePath(projectRoot, taskType);
  mkdirSync(dirname(path), { recursive: true });
  const entry: CacheEntry = {
    schema_version: CACHE_SCHEMA_VERSION,
    task_type: taskType,
    inputs_hash: inputsHash,
    generated_at: new Date().toISOString(),
    result_yaml: resultYaml,
  };
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry, null, 2) + "\n", "utf-8");
  renameSync(tmp, path);
  return path;
}

export function checkCache(
  projectRoot: string,
  taskType: string,
  expectedInputsHash: string,
): { hit: boolean; path: string; entry: CacheEntry | null } {
  const path = cachePath(projectRoot, taskType);
  const entry = readCache(projectRoot, taskType);
  if (!entry) return { hit: false, path, entry: null };
  return { hit: entry.inputs_hash === expectedInputsHash, path, entry };
}

export function expandGlobs(projectRoot: string, patterns: string[]): string[] {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");

  const matches = new Set<string>();
  for (const pattern of patterns) {
    const abs = isAbsolute(pattern) ? pattern : resolve(projectRoot, pattern);
    walkPattern(abs, projectRoot, matches, fs, path);
  }
  return Array.from(matches).sort();
}

function walkPattern(
  pattern: string,
  projectRoot: string,
  out: Set<string>,
  fs: typeof import("fs"),
  path: typeof import("path"),
): void {
  const hasMagic = /[*?[]/.test(pattern);
  if (!hasMagic) {
    if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
      out.add(relative(projectRoot, pattern));
    }
    return;
  }

  const segments = pattern.split(path.sep);
  walkSegments(segments, 0, "/", projectRoot, out, fs, path);
}

function walkSegments(
  segments: string[],
  index: number,
  current: string,
  projectRoot: string,
  out: Set<string>,
  fs: typeof import("fs"),
  path: typeof import("path"),
): void {
  if (index >= segments.length) {
    if (fs.existsSync(current) && fs.statSync(current).isFile()) {
      out.add(relative(projectRoot, current));
    }
    return;
  }
  const seg = segments[index];

  if (seg === "**") {
    walkSegments(segments, index + 1, current, projectRoot, out, fs, path);
    if (!fs.existsSync(current)) return;
    let entries: string[];
    try {
      entries = fs.readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      const next = path.join(current, entry);
      let st: ReturnType<typeof fs.statSync>;
      try {
        st = fs.statSync(next);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walkSegments(segments, index, next, projectRoot, out, fs, path);
      }
    }
    return;
  }

  if (/[*?[]/.test(seg)) {
    if (!fs.existsSync(current)) return;
    let entries: string[];
    try {
      entries = fs.readdirSync(current);
    } catch {
      return;
    }
    const re = globToRegExp(seg);
    for (const entry of entries) {
      if (!re.test(entry)) continue;
      const next = path.join(current, entry);
      walkSegments(segments, index + 1, next, projectRoot, out, fs, path);
    }
    return;
  }

  walkSegments(segments, index + 1, path.join(current, seg), projectRoot, out, fs, path);
}

function globToRegExp(glob: string): RegExp {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === ".") re += "\\.";
    else if ("+()[]{}^$|\\".includes(c)) re += "\\" + c;
    else re += c;
  }
  return new RegExp(re + "$");
}

export function computeInputsHash(args: {
  projectRoot: string;
  taskType: string;
  configPath: string;
  pluginVersion: string;
  candidateFiles: string[];
}): string {
  const { projectRoot, taskType, configPath, pluginVersion, candidateFiles } = args;
  const lines: string[] = [];
  lines.push(`task:${taskType}`);
  lines.push(`plugin:${pluginVersion}`);

  if (existsSync(configPath)) {
    const st = statSync(configPath);
    lines.push(`config:${configPath}:${st.mtimeMs.toFixed(0)}`);
  } else {
    lines.push(`config:${configPath}:missing`);
  }

  const sorted = [...candidateFiles].sort();
  for (const rel of sorted) {
    const abs = isAbsolute(rel) ? rel : resolve(projectRoot, rel);
    if (existsSync(abs)) {
      const st = statSync(abs);
      lines.push(`file:${rel}:${st.mtimeMs.toFixed(0)}:${st.size}`);
    } else {
      lines.push(`file:${rel}:missing`);
    }
  }

  return "sha256:" + createHash("sha256").update(lines.join("\n")).digest("hex");
}
