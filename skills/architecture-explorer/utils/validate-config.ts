/**
 * Validates an explorer config (agents/configs/explorer/<task>.json)
 * against the structural rules expressed in _schema.json. Pure JS —
 * no runtime AJV dependency, since the rule set is small and stable.
 *
 * Returns a list of error strings; empty array means valid.
 *
 * @module validate-config
 */
import { existsSync, readFileSync } from "fs";

const FAMILIES = ["compliance", "analysis", "peer-review", "handoff", "question", "adr"] as const;
const SEVERITIES = ["blocker", "high", "medium", "desired"] as const;
const FORMATS = ["v1"] as const;

export type ConfigErrors = string[];

export function validateConfigFile(path: string): ConfigErrors {
  if (!existsSync(path)) return [`config file does not exist: ${path}`];
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (e) {
    return [`unreadable: ${(e as Error).message}`];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return [`invalid JSON: ${(e as Error).message}`];
  }
  return validateConfig(parsed);
}

export function validateConfig(parsed: unknown): ConfigErrors {
  const errors: string[] = [];

  if (!parsed || typeof parsed !== "object") {
    return ["config is not an object"];
  }
  const c = parsed as Record<string, unknown>;

  for (const field of [
    "task_type",
    "task_family",
    "downstream_agent",
    "required_sections",
    "optional_sections",
    "candidate_files",
    "relevance_keywords",
    "score_threshold",
    "output_format",
  ]) {
    if (!(field in c)) errors.push(`missing required field: ${field}`);
  }

  if (typeof c.task_type === "string" && !/^[a-z][a-z0-9-]*$/.test(c.task_type)) {
    errors.push(`task_type must be lowercase kebab-case: ${c.task_type}`);
  }
  if (typeof c.task_family === "string" && !FAMILIES.includes(c.task_family as never)) {
    errors.push(`task_family must be one of ${FAMILIES.join("|")}: ${c.task_family}`);
  }
  if (typeof c.output_format === "string" && !FORMATS.includes(c.output_format as never)) {
    errors.push(`output_format must be 'v1': ${c.output_format}`);
  }
  if (typeof c.score_threshold === "number") {
    if (c.score_threshold < 0 || c.score_threshold > 1) {
      errors.push(`score_threshold out of range [0,1]: ${c.score_threshold}`);
    }
  } else if ("score_threshold" in c) {
    errors.push("score_threshold must be a number");
  }

  if (Array.isArray(c.candidate_files)) {
    if (c.candidate_files.length === 0) errors.push("candidate_files must not be empty");
    for (const p of c.candidate_files) {
      if (typeof p !== "string") errors.push(`candidate_files entry not a string: ${String(p)}`);
    }
  } else if ("candidate_files" in c) {
    errors.push("candidate_files must be an array");
  }

  errors.push(...validateSections(c.required_sections, "required_sections"));
  errors.push(...validateSections(c.optional_sections, "optional_sections"));
  errors.push(...validateRelevance(c.relevance_keywords));
  errors.push(...validateGaps(c.gap_markers));

  const allowed = new Set([
    "task_type",
    "task_family",
    "downstream_agent",
    "required_sections",
    "optional_sections",
    "candidate_files",
    "relevance_keywords",
    "gap_markers",
    "score_threshold",
    "max_irrelevant_files",
    "output_format",
    "notes",
  ]);
  for (const key of Object.keys(c)) {
    if (!allowed.has(key)) errors.push(`unexpected field: ${key}`);
  }

  return errors;
}

function validateSections(raw: unknown, field: string): ConfigErrors {
  if (!Array.isArray(raw)) {
    if (raw === undefined) return [`missing field: ${field}`];
    return [`${field} must be an array`];
  }
  const errors: string[] = [];
  for (const [i, item] of raw.entries()) {
    if (!item || typeof item !== "object") {
      errors.push(`${field}[${i}] is not an object`);
      continue;
    }
    const e = item as Record<string, unknown>;
    if (typeof e.file !== "string" || e.file === "") {
      errors.push(`${field}[${i}].file must be a non-empty string`);
    }
    if ("anchor_hints" in e && !Array.isArray(e.anchor_hints)) {
      errors.push(`${field}[${i}].anchor_hints must be an array`);
    }
    if (
      "include_when" in e &&
      !["any_of_keywords", "all_of_keywords", "anchor_only"].includes(String(e.include_when))
    ) {
      errors.push(`${field}[${i}].include_when invalid: ${String(e.include_when)}`);
    }
  }
  return errors;
}

function validateRelevance(raw: unknown): ConfigErrors {
  if (!raw || typeof raw !== "object") return ["relevance_keywords must be an object"];
  const r = raw as Record<string, unknown>;
  const errors: string[] = [];
  if (!Array.isArray(r.boost)) {
    errors.push("relevance_keywords.boost must be an array");
  } else {
    for (const [i, item] of r.boost.entries()) {
      if (!item || typeof item !== "object") {
        errors.push(`relevance_keywords.boost[${i}] is not an object`);
        continue;
      }
      const b = item as Record<string, unknown>;
      if (typeof b.term !== "string" || b.term === "") {
        errors.push(`relevance_keywords.boost[${i}].term must be non-empty string`);
      }
      if (typeof b.weight !== "number" || b.weight < 1 || b.weight > 5) {
        errors.push(`relevance_keywords.boost[${i}].weight must be 1..5`);
      }
    }
  }
  if ("negative" in r && !Array.isArray(r.negative)) {
    errors.push("relevance_keywords.negative must be an array");
  }
  if ("must" in r && !Array.isArray(r.must)) {
    errors.push("relevance_keywords.must must be an array");
  }
  return errors;
}

function validateGaps(raw: unknown): ConfigErrors {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return ["gap_markers must be an array"];
  const errors: string[] = [];
  for (const [i, item] of raw.entries()) {
    if (!item || typeof item !== "object") {
      errors.push(`gap_markers[${i}] is not an object`);
      continue;
    }
    const g = item as Record<string, unknown>;
    if (typeof g.name !== "string" || g.name === "") {
      errors.push(`gap_markers[${i}].name must be non-empty string`);
    }
    const hasAbsent = typeof g.absent_pattern === "string" && g.absent_pattern !== "";
    const hasPresent = typeof g.present_pattern === "string" && g.present_pattern !== "";
    if (!hasAbsent && !hasPresent) {
      errors.push(`gap_markers[${i}] requires absent_pattern or present_pattern`);
    }
    if (hasAbsent && hasPresent) {
      errors.push(`gap_markers[${i}] cannot have both absent_pattern and present_pattern`);
    }
    if (typeof g.severity !== "string" || !SEVERITIES.includes(g.severity as never)) {
      errors.push(`gap_markers[${i}].severity invalid: ${String(g.severity)}`);
    }
    if ("case_insensitive" in g && typeof g.case_insensitive !== "boolean") {
      errors.push(`gap_markers[${i}].case_insensitive must be boolean`);
    }
    const flags = g.case_insensitive === true ? "i" : "";
    if (hasAbsent) {
      try {
        new RegExp(String(g.absent_pattern), flags);
      } catch (e) {
        errors.push(`gap_markers[${i}].absent_pattern not a valid regex: ${(e as Error).message}`);
      }
    }
    if (hasPresent) {
      try {
        new RegExp(String(g.present_pattern), flags);
      } catch (e) {
        errors.push(`gap_markers[${i}].present_pattern not a valid regex: ${(e as Error).message}`);
      }
    }
  }
  return errors;
}
