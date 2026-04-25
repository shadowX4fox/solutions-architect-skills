/**
 * Parse + validate an EXPLORE_RESULT block emitted by the
 * architecture-explorer agent. The orchestrator runs the result
 * through this validator before passing it to any downstream agent.
 *
 * Two failure modes:
 *   1. Malformed YAML / missing required fields → REJECTED, orchestrator
 *      falls back to degraded mode (use the config's required_sections[]
 *      as the file list, skip optional_sections[]).
 *   2. required_sections[] entry from config missing from
 *      relevant_files[] → REJECTED for the same reason; this is the
 *      false-negative safeguard since explorer is always-on.
 *
 * Pure parsing — no I/O beyond reading the config to cross-check
 * required_sections[].
 *
 * @module parse-explore-result
 */
import { readFileSync } from "fs";

export type RelevantFile = {
  path: string;
  score: number;
  reason: string;
  matched_sections?: string[];
};

export type IrrelevantFile = {
  path: string;
  score: number;
  reason: string;
};

export type Gap = {
  file: string;
  marker: string;
  severity: "blocker" | "high" | "medium" | "desired";
  note?: string;
};

export type ExploreResult = {
  schema_version: number;
  status: "OK" | "PARTIAL" | "FAILED";
  task_type: string;
  task_family: string;
  generated_at: string;
  cache_key: string;
  inputs_hash: string;
  config_path: string;
  cache_hit: boolean;
  metadata: {
    architecture_version: string;
    architecture_status?: string;
    doc_language: string;
    doc_inventory: {
      architecture_md: boolean;
      docs_dir_files: number;
      components: number;
      adrs: number;
    };
  };
  relevant_files: RelevantFile[];
  irrelevant_files: IrrelevantFile[];
  gaps: Gap[];
  stats: {
    files_scanned: number;
    files_relevant: number;
    files_irrelevant: number;
    bytes_skipped_estimate: number;
  };
};

export type ParseFailure = {
  ok: false;
  reason: string;
  fallbackFiles: string[];
};

export type ParseSuccess = {
  ok: true;
  result: ExploreResult;
};

export type ParseOutcome = ParseFailure | ParseSuccess;

export function extractExploreResultBlock(text: string): string | null {
  const start = text.indexOf("EXPLORE_RESULT:");
  if (start === -1) return null;

  const fenceStart = text.indexOf("```yaml", start);
  if (fenceStart === -1) return null;
  const bodyStart = text.indexOf("\n", fenceStart) + 1;
  const fenceEnd = text.indexOf("```", bodyStart);
  if (fenceEnd === -1) return null;

  return text.slice(bodyStart, fenceEnd).trim();
}

export function parseExploreResult(
  agentOutput: string,
  configPath: string,
): ParseOutcome {
  const block = extractExploreResultBlock(agentOutput);
  if (!block) {
    return {
      ok: false,
      reason: "no EXPLORE_RESULT block found in agent output",
      fallbackFiles: requiredFilesFromConfig(configPath),
    };
  }

  let parsed: unknown;
  try {
    parsed = parseSimpleYaml(block);
  } catch (e) {
    return {
      ok: false,
      reason: `YAML parse error: ${(e as Error).message}`,
      fallbackFiles: requiredFilesFromConfig(configPath),
    };
  }

  const validation = validateShape(parsed);
  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
      fallbackFiles: requiredFilesFromConfig(configPath),
    };
  }

  const result = validation.result;
  const requiredFromConfig = requiredFilesFromConfig(configPath);
  const relevantPaths = new Set(result.relevant_files.map((f) => f.path));

  const missingRequired = requiredFromConfig.filter((f) => !relevantPaths.has(f));
  if (missingRequired.length > 0 && result.status === "OK") {
    return {
      ok: false,
      reason: `required_sections missing from relevant_files: ${missingRequired.join(", ")}`,
      fallbackFiles: requiredFromConfig,
    };
  }

  return { ok: true, result };
}

function requiredFilesFromConfig(configPath: string): string[] {
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as { required_sections?: Array<{ file: string }> };
    return (parsed.required_sections ?? []).map((entry) => entry.file);
  } catch {
    return [];
  }
}

function validateShape(
  parsed: unknown,
): { ok: true; result: ExploreResult } | { ok: false; reason: string } {
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "result is not an object" };
  }
  const r = parsed as Record<string, unknown>;

  for (const field of [
    "schema_version",
    "status",
    "task_type",
    "task_family",
    "relevant_files",
    "irrelevant_files",
  ] as const) {
    if (!(field in r)) {
      return { ok: false, reason: `missing required field: ${field}` };
    }
  }

  if (r.schema_version !== 1) {
    return { ok: false, reason: `unsupported schema_version: ${String(r.schema_version)}` };
  }
  if (!["OK", "PARTIAL", "FAILED"].includes(String(r.status))) {
    return { ok: false, reason: `invalid status: ${String(r.status)}` };
  }
  if (!Array.isArray(r.relevant_files)) {
    return { ok: false, reason: "relevant_files is not an array" };
  }
  if (!Array.isArray(r.irrelevant_files)) {
    return { ok: false, reason: "irrelevant_files is not an array" };
  }

  const result: ExploreResult = {
    schema_version: 1,
    status: r.status as "OK" | "PARTIAL" | "FAILED",
    task_type: String(r.task_type),
    task_family: String(r.task_family),
    generated_at: String(r.generated_at ?? ""),
    cache_key: String(r.cache_key ?? ""),
    inputs_hash: String(r.inputs_hash ?? r.cache_key ?? ""),
    config_path: String(r.config_path ?? ""),
    cache_hit: r.cache_hit === true,
    metadata: normalizeMetadata(r.metadata),
    relevant_files: (r.relevant_files as Array<Record<string, unknown>>).map((f) => ({
      path: String(f.path ?? ""),
      score: Number(f.score ?? 0),
      reason: String(f.reason ?? ""),
      matched_sections: Array.isArray(f.matched_sections)
        ? (f.matched_sections as unknown[]).map(String)
        : undefined,
    })),
    irrelevant_files: (r.irrelevant_files as Array<Record<string, unknown>>).map((f) => ({
      path: String(f.path ?? ""),
      score: Number(f.score ?? 0),
      reason: String(f.reason ?? ""),
    })),
    gaps: Array.isArray(r.gaps)
      ? (r.gaps as Array<Record<string, unknown>>).map((g) => ({
          file: String(g.file ?? ""),
          marker: String(g.marker ?? ""),
          severity: (["blocker", "high", "medium", "desired"].includes(String(g.severity))
            ? String(g.severity)
            : "medium") as Gap["severity"],
          note: g.note !== undefined ? String(g.note) : undefined,
        }))
      : [],
    stats: normalizeStats(r.stats),
  };

  return { ok: true, result };
}

function normalizeMetadata(raw: unknown): ExploreResult["metadata"] {
  const m = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const inv = (m.doc_inventory && typeof m.doc_inventory === "object"
    ? m.doc_inventory
    : {}) as Record<string, unknown>;
  return {
    architecture_version: String(m.architecture_version ?? "unversioned"),
    architecture_status: m.architecture_status !== undefined ? String(m.architecture_status) : undefined,
    doc_language: String(m.doc_language ?? "en"),
    doc_inventory: {
      architecture_md: inv.architecture_md === true,
      docs_dir_files: Number(inv.docs_dir_files ?? 0),
      components: Number(inv.components ?? 0),
      adrs: Number(inv.adrs ?? 0),
    },
  };
}

function normalizeStats(raw: unknown): ExploreResult["stats"] {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    files_scanned: Number(s.files_scanned ?? 0),
    files_relevant: Number(s.files_relevant ?? 0),
    files_irrelevant: Number(s.files_irrelevant ?? 0),
    bytes_skipped_estimate: Number(s.bytes_skipped_estimate ?? 0),
  };
}

/**
 * Tiny YAML subset parser for the EXPLORE_RESULT shape. Handles:
 *   - top-level scalars (key: value)
 *   - nested mappings (2-space indent)
 *   - sequences of mappings (- key: value)
 *   - flow-style mappings on one line ({ a: 1, b: 2 })
 *   - flow-style sequences ([a, b, c])
 *   - quoted strings
 *   - booleans, numbers
 *
 * Not a full YAML implementation — but the explorer's output shape is
 * fixed by the agent prompt, so we don't need one. Keeps zero dependencies.
 */
export function parseSimpleYaml(text: string): unknown {
  const lines = text.split("\n");
  const cleanLines: { indent: number; content: string }[] = [];
  for (const line of lines) {
    const stripped = line.replace(/\s+$/, "");
    if (!stripped.trim() || stripped.trim().startsWith("#")) continue;
    const indent = stripped.length - stripped.trimStart().length;
    cleanLines.push({ indent, content: stripped.trimStart() });
  }
  const [value] = parseBlock(cleanLines, 0, 0);
  return value;
}

function parseBlock(
  lines: { indent: number; content: string }[],
  start: number,
  baseIndent: number,
): [unknown, number] {
  if (start >= lines.length) return [{}, start];
  const first = lines[start];
  if (first.content.startsWith("- ")) {
    return parseList(lines, start, baseIndent);
  }
  return parseMapping(lines, start, baseIndent);
}

function parseMapping(
  lines: { indent: number; content: string }[],
  start: number,
  baseIndent: number,
): [Record<string, unknown>, number] {
  const out: Record<string, unknown> = {};
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.indent < baseIndent) break;
    if (line.indent > baseIndent) {
      i++;
      continue;
    }
    const colonIdx = findKeyColon(line.content);
    if (colonIdx === -1) break;
    const key = line.content.slice(0, colonIdx).trim();
    const rest = line.content.slice(colonIdx + 1).trim();
    if (rest === "") {
      const next = lines[i + 1];
      if (next && next.indent > baseIndent) {
        const [child, after] = parseBlock(lines, i + 1, next.indent);
        out[key] = child;
        i = after;
      } else {
        out[key] = null;
        i++;
      }
    } else {
      out[key] = parseScalar(rest);
      i++;
    }
  }
  return [out, i];
}

function parseList(
  lines: { indent: number; content: string }[],
  start: number,
  baseIndent: number,
): [unknown[], number] {
  const out: unknown[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.indent < baseIndent) break;
    if (line.indent > baseIndent) {
      i++;
      continue;
    }
    if (!line.content.startsWith("- ")) break;
    const after = line.content.slice(2);
    if (after.includes(":") && findKeyColon(after) !== -1) {
      const reInjected: { indent: number; content: string }[] = [
        { indent: baseIndent + 2, content: after },
        ...lines.slice(i + 1),
      ];
      const [item, consumedRel] = parseMapping(reInjected, 0, baseIndent + 2);
      out.push(item);
      i += consumedRel;
    } else {
      out.push(parseScalar(after));
      i++;
    }
  }
  return [out, i];
}

function findKeyColon(content: string): number {
  let inFlow = 0;
  let inQuote: string | null = null;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuote) {
      if (c === inQuote && content[i - 1] !== "\\") inQuote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      inQuote = c;
      continue;
    }
    if (c === "{" || c === "[") inFlow++;
    else if (c === "}" || c === "]") inFlow--;
    else if (c === ":" && inFlow === 0) {
      if (content[i + 1] === undefined || content[i + 1] === " " || i === content.length - 1) {
        return i;
      }
    }
  }
  return -1;
}

function parseScalar(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed === "true" || trimmed === "True") return true;
  if (trimmed === "false" || trimmed === "False") return false;
  if (trimmed === "null" || trimmed === "~") return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return parseFlowMapping(trimmed);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return parseFlowSequence(trimmed);
  }
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  return trimmed;
}

function parseFlowMapping(text: string): Record<string, unknown> {
  const inner = text.slice(1, -1).trim();
  if (inner === "") return {};
  const out: Record<string, unknown> = {};
  for (const part of splitFlow(inner)) {
    const colonIdx = findKeyColon(part);
    if (colonIdx === -1) continue;
    const k = part.slice(0, colonIdx).trim();
    const v = part.slice(colonIdx + 1).trim();
    out[k] = parseScalar(v);
  }
  return out;
}

function parseFlowSequence(text: string): unknown[] {
  const inner = text.slice(1, -1).trim();
  if (inner === "") return [];
  return splitFlow(inner).map((p) => parseScalar(p));
}

function splitFlow(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inQuote: string | null = null;
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      buf += c;
      if (c === inQuote && text[i - 1] !== "\\") inQuote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      inQuote = c;
      buf += c;
      continue;
    }
    if (c === "{" || c === "[") depth++;
    if (c === "}" || c === "]") depth--;
    if (c === "," && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf.trim() !== "") out.push(buf);
  return out;
}
