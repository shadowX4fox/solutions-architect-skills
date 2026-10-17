/**
 * Detection + insertion helpers for `<!-- EXPLORER_HEADER ... -->` blocks
 * in architecture documentation files.
 *
 * Pure module — no I/O beyond the listing helper that reads from disk.
 * The skill orchestrator does the actual Edit-tool insertion; this module
 * provides the mechanics (detect, find insertion point, validate fields).
 *
 * @module header-detector
 */
import { existsSync, readFileSync, statSync } from "fs";
import { isAbsolute, relative, resolve, sep } from "path";

export const HEADER_OPEN = "<!-- EXPLORER_HEADER";
export const HEADER_CLOSE = "-->";

export const REQUIRED_FIELDS_DOC = ["key_concepts", "technologies", "scope"] as const;
export const REQUIRED_FIELDS_COMPONENT = ["key_concepts", "technologies", "scope", "component_self"] as const;
/** The closed set of header keys. `parseHeader` drops any other key silently; `checkHeaders` (explorer.ts) reports it. */
export const ALLOWED_FIELDS = new Set([
  "key_concepts",
  "technologies",
  "components",
  "component_self",
  "component_type",
  "internal_name",
  "scope",
  "related_adrs",
]);

export type DocEntry = {
  /**
   * Repo-relative path, always POSIX-separated (`docs/components/x.md`) on
   * every platform. `path.relative()` returns the host separator, so on
   * Windows it yields `docs\components\x.md`; this value is emitted as JSON
   * for skills and agents to consume and is compared against literals like
   * `"docs/components/x.md"`, so it is normalized at construction. Use
   * `toPosix()` for anything added here later.
   */
  path: string;
  has_header: boolean;
  h1: string;
  byte_size: number;
};

/**
 * Host-separator path → POSIX. No-op on Linux/macOS, where sep is already "/".
 *
 * Exported because `component-facts.ts` already imports this module for
 * `listDocFiles` / `parseHeader` / `extractH1`; it kept a byte-identical private
 * copy of this function until the two were unified here.
 */
export function toPosix(p: string): string {
  return p.split(sep).join("/");
}

// Walks docs/*.md and docs/components recursively under projectRoot, skipping
// ARCHITECTURE.md (navigation index — exempt) and every README.md at any depth.
// That includes `docs/README.md` as well as `docs/components/README.md`: both
// are derived indexes rather than authored docs, and neither carries an
// EXPLORER_HEADER.
export function listDocFiles(projectRoot: string): DocEntry[] {
  const out: DocEntry[] = [];
  const patterns = [
    { dir: "docs", recursive: false },
    { dir: "docs/components", recursive: true },
  ];
  for (const { dir, recursive } of patterns) {
    const abs = resolve(projectRoot, dir);
    if (!existsSync(abs)) continue;
    walkDir(abs, projectRoot, recursive, out);
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function walkDir(
  abs: string,
  projectRoot: string,
  recursive: boolean,
  out: DocEntry[],
): void {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");
  let entries: import("fs").Dirent[];
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const childAbs = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      if (!recursive) continue;
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      walkDir(childAbs, projectRoot, recursive, out);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    if (entry.name === "README.md") continue;
    const rel = relative(projectRoot, childAbs);
    if (rel === "ARCHITECTURE.md") continue;
    out.push(entryFor(childAbs, rel));
  }
}

function entryFor(abs: string, rel: string): DocEntry {
  const content = readFileSync(abs, "utf-8").replace(/\r\n?/g, "\n");
  return {
    path: toPosix(rel),
    has_header: hasExplorerHeader(content),
    h1: extractH1(content),
    byte_size: statSync(abs).size,
  };
}

export function extractH1(content: string): string {
  // `[^\S\n]` not `\s`: `\s` matches the newline, so a bare "#" line lets the
  // pattern reach into the following line and return the body's first line as
  // the H1. That value propagates into ComponentFact.name and from there into
  // the rendered component index.
  const match = content.match(/^#[^\S\n]+(.+?)[^\S\n]*$/m);
  return match ? match[1].trim() : "";
}

export function hasExplorerHeader(content: string): boolean {
  return content.includes(HEADER_OPEN);
}

/**
 * Returns the byte offset where a new EXPLORER_HEADER block should be
 * inserted: after the H1 line and the blank line that should follow it.
 *
 * If no H1 exists, returns 0 (insert at start of file). If H1 has no
 * trailing blank line, the caller should prefix the header with one.
 */
export function findInsertionPoint(content: string): {
  offset: number;
  needsLeadingBlank: boolean;
} {
  // `[^\S\n]` for the same reason as extractH1: keep the match on one line.
  const h1Match = content.match(/^#[^\S\n]+.+$/m);
  if (!h1Match || h1Match.index === undefined) {
    return { offset: 0, needsLeadingBlank: false };
  }
  const afterH1 = h1Match.index + h1Match[0].length;
  const tail = content.slice(afterH1);
  const blankMatch = tail.match(/^\n(\s*\n)?/);
  const blankLen = blankMatch ? blankMatch[0].length : 0;
  const needsLeadingBlank = blankLen < 2;
  return { offset: afterH1 + blankLen, needsLeadingBlank };
}

export type HeaderFields = {
  key_concepts?: string[];
  technologies?: string[];
  components?: string[];
  component_self?: string;
  component_type?: string;
  /** Repository / workload / product identifier when it differs from the canonical name (component files only). */
  internal_name?: string;
  scope?: string;
  related_adrs?: string[];
};

/**
 * Parses the body of a single `<!-- EXPLORER_HEADER ... -->` block into
 * a structured object. Each line of the form `key: value` becomes a
 * field; comma-separated values become arrays. Returns null if the
 * input does not contain a recognizable EXPLORER_HEADER block.
 */
export function parseHeader(content: string): HeaderFields | null {
  const startIdx = content.indexOf(HEADER_OPEN);
  if (startIdx === -1) return null;
  const bodyStart = startIdx + HEADER_OPEN.length;
  const closeIdx = content.indexOf(HEADER_CLOSE, bodyStart);
  if (closeIdx === -1) return null;

  const body = content.slice(bodyStart, closeIdx);
  const fields: HeaderFields = {};
  const arrayKeys = new Set(["key_concepts", "technologies", "components", "related_adrs"]);

  for (const line of body.split("\n")) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) continue;
    const colon = stripped.indexOf(":");
    if (colon === -1) continue;
    const key = stripped.slice(0, colon).trim();
    const value = stripped.slice(colon + 1).trim();
    if (!ALLOWED_FIELDS.has(key)) continue;
    if (arrayKeys.has(key)) {
      const arr = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      (fields as Record<string, unknown>)[key] = arr;
    } else {
      (fields as Record<string, unknown>)[key] = value;
    }
  }
  return fields;
}

/** Every `key: value` key inside the first EXPLORER_HEADER block, known or not — what a writer actually emitted. */
export function rawHeaderKeys(content: string): string[] {
  const startIdx = content.indexOf(HEADER_OPEN);
  if (startIdx === -1) return [];
  const bodyStart = startIdx + HEADER_OPEN.length;
  const closeIdx = content.indexOf(HEADER_CLOSE, bodyStart);
  if (closeIdx === -1) return [];
  return content
    .slice(bodyStart, closeIdx)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => (l.includes(":") ? l.slice(0, l.indexOf(":")) : l).trim())
    .filter(Boolean);
}

/** How many EXPLORER_HEADER blocks the content carries (one is right; two is a paste). */
export function countHeaders(content: string): number {
  return content.split(HEADER_OPEN).length - 1;
}

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateHeader(content: string, filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fields = parseHeader(content);
  if (!fields) {
    return { valid: false, errors: ["no EXPLORER_HEADER block found"], warnings };
  }

  // Normalize first: callers pass host-separated paths (the CLI passes an
  // absolute one straight from argv), so on Windows a component file arrives
  // as `...\components\x.md` and neither literal below would match. The file
  // would then be validated against the doc field set, silently skipping the
  // `component_self` requirement.
  const relPath = toPosix(filePath);
  // Anchor on `docs/components/`, not a bare `/components/` substring. The CLI
  // passes an absolute path straight from argv, so a project living under a
  // directory that happens to be named `components`
  // (`C:\work\components\myproject\docs\08-scalability.md`) had every one of
  // its docs classified as a component file and required to carry
  // `component_self`. The second arm keeps callers that pass a path relative to
  // `docs/` working.
  const isComponent =
    /(?:^|\/)docs\/components\//.test(relPath) || relPath.startsWith("components/");
  const required = isComponent ? REQUIRED_FIELDS_COMPONENT : REQUIRED_FIELDS_DOC;
  for (const f of required) {
    const v = (fields as Record<string, unknown>)[f];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
      errors.push(`required field missing or empty: ${f}`);
    }
  }

  if (fields.scope && fields.scope.length > 120) {
    warnings.push(`scope is ${fields.scope.length} chars (recommend ≤120)`);
  }
  if (fields.key_concepts && fields.key_concepts.length < 3) {
    warnings.push(`key_concepts has only ${fields.key_concepts.length} entries (recommend 5–15)`);
  }
  if (fields.key_concepts && fields.key_concepts.length > 20) {
    warnings.push(`key_concepts has ${fields.key_concepts.length} entries (recommend 5–15; trim less-load-bearing terms)`);
  }
  if (fields.related_adrs) {
    for (const adr of fields.related_adrs) {
      if (!/^ADR-\d{3,}$/i.test(adr)) {
        warnings.push(`related_adrs entry malformed: ${adr} (expected ADR-NNN)`);
      }
    }
  }
  if (isComponent && fields.components && fields.components.length > 0) {
    warnings.push("component files should use 'component_self', not 'components'");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Inserts a fully-formed EXPLORER_HEADER block (and the trailing
 * 30-second summary blockquote, if provided) into a doc body.
 * Caller supplies the assembled header text without any leading or
 * trailing blank lines — this function handles whitespace.
 *
 * Returns the new content. Throws if the body already contains an
 * EXPLORER_HEADER block (caller should pass --force semantics by
 * stripping the existing block first).
 */
export function insertHeader(
  content: string,
  headerBlock: string,
  options: { force?: boolean } = {},
): string {
  if (hasExplorerHeader(content)) {
    if (!options.force) {
      throw new Error("EXPLORER_HEADER already present; pass force:true to replace");
    }
    content = removeHeader(content);
  }

  const { offset, needsLeadingBlank } = findInsertionPoint(content);
  const before = content.slice(0, offset);
  const after = content.slice(offset);

  const leadingBlank = needsLeadingBlank ? "\n" : "";
  const block = headerBlock.replace(/^\n+|\n+$/g, "");
  const trailingBlank = after.startsWith("\n") ? "" : "\n";

  return `${before}${leadingBlank}${block}\n${trailingBlank}${after}`;
}

/**
 * Removes an existing EXPLORER_HEADER block (and one trailing blank
 * line, if present) from content. Used by insertHeader when force=true.
 */
export function removeHeader(content: string): string {
  const startIdx = content.indexOf(HEADER_OPEN);
  if (startIdx === -1) return content;
  const closeIdx = content.indexOf(HEADER_CLOSE, startIdx + HEADER_OPEN.length);
  if (closeIdx === -1) return content;
  let endIdx = closeIdx + HEADER_CLOSE.length;
  // Consume the newline that terminates the `-->` line plus the blank line
  // separating the block from the body. The newlines *preceding* the block
  // stay: they terminate the H1 line and separate it from what follows, so
  // eating them splices the body onto the H1 line.
  const trailing = content.slice(endIdx).match(/^(?:\r?\n){1,2}/);
  if (trailing) endIdx += trailing[0].length;
  return content.slice(0, startIdx) + content.slice(endIdx);
}

/**
 * Builds the EXPLORER_HEADER text from structured fields. Used both by
 * the skill orchestrator (when generating headers from doc content)
 * and by tests.
 */
export function buildHeader(fields: HeaderFields, summary?: string): string {
  const lines: string[] = [HEADER_OPEN];
  if (fields.key_concepts?.length) {
    lines.push(`key_concepts: ${fields.key_concepts.join(", ")}`);
  }
  if (fields.technologies?.length) {
    lines.push(`technologies: ${fields.technologies.join(", ")}`);
  }
  if (fields.component_self) {
    lines.push(`component_self: ${fields.component_self}`);
    if (fields.component_type) lines.push(`component_type: ${fields.component_type}`);
  } else if (fields.components?.length) {
    lines.push(`components: ${fields.components.join(", ")}`);
  }
  if (fields.scope) lines.push(`scope: ${fields.scope}`);
  if (fields.related_adrs?.length) {
    lines.push(`related_adrs: ${fields.related_adrs.join(", ")}`);
  }
  lines.push(HEADER_CLOSE);
  let block = lines.join("\n");
  if (summary && summary.trim()) {
    block += `\n\n> ${summary.trim()}`;
  }
  return block;
}
