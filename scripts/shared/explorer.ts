/**
 * The architecture explorer as code.
 *
 * Two functions that used to be the two modes of the `architecture-explorer` sub-agent
 * (retired in 8.3.0 and deleted in 8.71.0):
 *
 *   manifest(root)   — every doc, component file and ADR of the canonical surface with the
 *                      EXPLORER_HEADER fields, the ADR status and scope, the document language.
 *   findings(root, q) — where a list of terms (or pre-built regex alternations) appears across
 *                      the surface: file, line, nearest heading, excerpt, with per-term coverage,
 *                      the zero-match relaxation and the caps the agent applied.
 *
 * The output shapes are the agent's `EXPLORE_MANIFEST` / `EXPLORE_FINDINGS` schemas (version 2),
 * unchanged, so every orchestrator that trimmed and pasted the agent's block keeps doing exactly
 * that — from a Bash call instead of a Haiku call, deterministic, with no malformed-output retry.
 *
 * Pure module: reads the project, writes nothing. `explorer-cli.ts` is the entrypoint.
 *
 * @module explorer
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative, resolve, sep } from "path";
import { extractH1, listDocFiles, parseHeader, HeaderFields } from "./header-detector";

export const SCHEMA_VERSION = 2;
export const MAX_FILES = 10;
export const MAX_CLUSTERS_PER_FILE = 5;
export const CLUSTER_SPAN = 10;      // lines within this distance collapse into one cluster
export const MAX_MATCHES_PER_TERM = 50;
export const EXCERPT_CHARS = 400;

const toPosix = (p: string) => p.split(sep).join("/");
const read = (p: string) => readFileSync(p, "utf-8").replace(/\r\n?/g, "\n");

// ---------------------------------------------------------------- shared

export type DocLanguage = { value: "en" | "es"; source: "marker" | "legacy_marker" | "inferred" | "default" };

const EN_INDICATORS = ["Executive Summary", "System Overview", "Problem Statement", "Business Value", "Architecture Principles", "Key Metrics", "Solution"];
const ES_INDICATORS = ["Resumen Ejecutivo", "Descripción del Sistema", "Planteamiento del Problema", "Valor de Negocio", "Principios de Arquitectura", "Métricas Clave", "Solución"];

/** LANGUAGE_POLICY.md §3 resolution, read-only: marker → legacy marker → §5.5 heading inference → `en`. */
export function docLanguage(root: string): DocLanguage {
  const archPath = join(root, "ARCHITECTURE.md");
  const arch = existsSync(archPath) ? read(archPath) : "";
  const m = arch.match(/<!--\s*DOC_LANGUAGE:\s*(en|es)\s*-->/i);
  if (m) return { value: m[1].toLowerCase() as "en" | "es", source: "marker" };
  const legacy = arch.match(/<!--\s*LANGUAGE:\s*(en|es)\s*-->/i);
  if (legacy) return { value: legacy[1].toLowerCase() as "en" | "es", source: "legacy_marker" };
  const overview = join(root, "docs", "01-system-overview.md");
  const sample = (existsSync(overview) ? read(overview) : arch).split("\n").slice(0, 30).join("\n");
  const hits = (list: string[]) => list.filter((k) => sample.includes(k)).length;
  const es = hits(ES_INDICATORS), en = hits(EN_INDICATORS);
  if (es >= 3 && es > en) return { value: "es", source: "inferred" };
  if (en >= 3 && en > es) return { value: "en", source: "inferred" };
  return { value: "en", source: "default" };
}

/** `**Label**: value` or a `| **Label** | value |` table row, first match wins. */
function field(src: string, labels: string[]): string | null {
  for (const l of labels) {
    const m = src.match(new RegExp(`^\\*\\*${l}\\*\\*\\s*:\\s*(.+)$`, "mi")) || src.match(new RegExp(`^\\|\\s*\\*\\*${l}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`, "mi"));
    if (m) return m[1].trim();
  }
  return null;
}

export type AdrEntry = { id: string; file: string; title: string; status: string; scope?: string };

export function listAdrs(root: string): AdrEntry[] {
  const dir = join(root, "adr");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^ADR-\d{3}.*\.md$/i.test(f))
    .sort()
    .map((f) => {
      const src = read(join(dir, f));
      const id = f.match(/^(ADR-\d{3})/i)![1].toUpperCase();
      const h1 = extractH1(src) || id;
      const title = h1.replace(new RegExp(`^${id}\\s*[:—-]\\s*`, "i"), "").trim();
      const status = (field(src, ["Status", "Estado"]) || "unknown").replace(/\s*\(.*?\)\s*$/, "");
      const scope = field(src, ["Scope", "Alcance"]);
      const e: AdrEntry = { id, file: `adr/${f}`, title, status };
      if (scope) e.scope = scope;
      return e;
    });
}

// ---------------------------------------------------------------- manifest

export type FocusComponent = { file: string; related_adrs: string[]; has_header: boolean };
export type ManifestDoc = { file: string; title: string; has_header: boolean; key_concepts: string[]; technologies: string[]; components: string[]; related_adrs: string[]; scope: string };
export type ManifestComponent = { file: string; title: string; has_header: boolean; component_self: string; component_type: string; technologies: string[]; related_adrs: string[] };
export type Manifest = {
  schema_version: number;
  status: "OK" | "FAILED";
  reason?: string;
  project_root: string;
  doc_language?: "en" | "es";
  metadata?: { cache_hit: false; shortcut: "none" | "header"; doc_language_source: DocLanguage["source"] };
  architecture?: { file: "ARCHITECTURE.md"; version: string; status: string };
  docs?: ManifestDoc[];
  components?: { index_file?: string; files: ManifestComponent[] };
  adrs?: AdrEntry[];
  focus_component?: FocusComponent;
};

function focusFor(root: string, componentFile: string): FocusComponent {
  const abs = resolve(root, componentFile);
  const src = existsSync(abs) ? read(abs) : "";
  const h = parseHeader(src);
  return { file: toPosix(relative(root, abs)), related_adrs: (h && h.related_adrs) || [], has_header: h != null };
}

// `partial` (8.92.7): a create writes docs/ and has adr/ before ARCHITECTURE.md exists (the index step closes segment 4);
// the facts ledger lists what is there instead of reporting nothing. Every other caller keeps the FAILED contract.
export function manifest(root: string, opts: { componentFile?: string; partial?: boolean } = {}): Manifest {
  root = resolve(root);
  const archPath = join(root, "ARCHITECTURE.md");
  const hasArch = existsSync(archPath);
  if (!hasArch && !opts.partial) return { schema_version: SCHEMA_VERSION, status: "FAILED", reason: `ARCHITECTURE.md not found at ${root}`, project_root: root, docs: [], components: { files: [] }, adrs: [] };
  const arch = hasArch ? read(archPath) : "";
  const lang = docLanguage(root);
  const docs: ManifestDoc[] = [], components: ManifestComponent[] = [];
  for (const d of listDocFiles(root)) {
    const src = read(join(root, d.path));
    const h: HeaderFields = parseHeader(src) || {};
    if (d.path.startsWith("docs/components/")) {
      components.push({ file: d.path, title: d.h1, has_header: d.has_header, component_self: h.component_self || "", component_type: h.component_type || "", technologies: h.technologies || [], related_adrs: h.related_adrs || [] });
    } else {
      docs.push({ file: d.path, title: d.h1, has_header: d.has_header, key_concepts: h.key_concepts || [], technologies: h.technologies || [], components: h.components || [], related_adrs: h.related_adrs || [], scope: h.scope || "" });
    }
  }
  const out: Manifest = {
    schema_version: SCHEMA_VERSION,
    status: "OK",
    project_root: root,
    doc_language: lang.value,
    metadata: { cache_hit: false, shortcut: "none", doc_language_source: lang.source },
    architecture: { file: "ARCHITECTURE.md", version: (arch.match(/<!--\s*ARCHITECTURE_VERSION:\s*([^\s]+)\s*-->/) || [])[1] || "unversioned", status: (arch.match(/<!--\s*ARCHITECTURE_STATUS:\s*([^\s]+)\s*-->/) || [])[1] || "unknown" },
    docs,
    components: { files: components },
    adrs: listAdrs(root),
  };
  if (existsSync(join(root, "docs", "components", "README.md"))) out.components!.index_file = "docs/components/README.md";
  if (opts.componentFile) {
    out.focus_component = focusFor(root, opts.componentFile);
    if (out.focus_component.has_header && out.focus_component.related_adrs.length) out.metadata!.shortcut = "header";
  }
  return out;
}

// ---------------------------------------------------------------- findings

export type Surface = "all" | "docs";
export type FindingsOptions = { query: string; surface?: Surface; componentFile?: string; maxFiles?: number; maxClusters?: number };
export type Match = { line: number; heading: string; excerpt: string };
export type FileFindings = { file: string; matched_terms: string[]; matches: Match[] };
export type TermCoverage = { term: string; files_matched: number; total_matches: number; relaxed: boolean };
export type Findings = {
  schema_version: number;
  status: "OK" | "FAILED";
  reason?: string;
  project_root: string;
  query: string;
  search_terms: string[];
  total_files_matched: number;
  total_matches: number;
  truncated: boolean;
  truncation_note?: string;
  monolingual_query_warning?: string;
  term_coverage: TermCoverage[];
  files: FileFindings[];
  focus_component?: FocusComponent;
};

type Term = { text: string; rx: RegExp; prebuilt: boolean };

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isIdentifier = (s: string) => /^ADR-\d{3}$/i.test(s) || /^[A-Z]{2,5}$/.test(s);

/** Query → terms. A comma-separated list where any item carries `|` is a curated regex list (F2, pre-built pattern rule). */
export function planTerms(query: string): { terms: Term[]; prebuilt: boolean } {
  const items = query.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  const prebuilt = items.some((i) => i.includes("|"));
  const terms = items.map((text) => {
    if (prebuilt) { try { return { text, rx: new RegExp(text, "i"), prebuilt }; } catch { return { text, rx: new RegExp(escapeRx(text), "i"), prebuilt }; } }
    return { text, rx: new RegExp(escapeRx(text), isIdentifier(text) ? "" : "i"), prebuilt };
  });
  return { terms, prebuilt };
}

/** F3.5: the longest alphanumeric word across the term's alternatives, cut to its first 6 characters (never fewer than 4). */
export function relaxedStem(text: string): string | null {
  const words = text.replace(/\\[bBdDwWsS]/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  if (words.length === 1 && words[0].length <= 5 && words[0] === words[0].toUpperCase()) return null;   // an acronym is already minimal
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));
  if (longest.length < 4) return null;
  return longest.slice(0, 6).toLowerCase();
}

function surfaceFiles(root: string, surface: Surface): string[] {
  const out: string[] = [];
  if (existsSync(join(root, "ARCHITECTURE.md"))) out.push("ARCHITECTURE.md");
  const walk = (dir: string) => {
    const abs = join(root, dir);
    if (!existsSync(abs)) return;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!e.name.startsWith(".") && e.name !== "node_modules") walk(`${dir}/${e.name}`); }
      else if (e.name.endsWith(".md")) out.push(`${dir}/${e.name}`);
    }
  };
  walk("docs");
  if (surface !== "docs") { const adr = join(root, "adr"); if (existsSync(adr)) readdirSync(adr).filter((f) => f.endsWith(".md")).sort().forEach((f) => out.push(`adr/${f}`)); }
  return out.sort();
}

function nearestHeading(lines: string[], idx: number): string {
  for (let i = idx; i >= 0; i--) if (/^#{1,4}\s/.test(lines[i])) return lines[i].trim();
  return "(no heading above match)";
}

export function findings(root: string, opts: FindingsOptions): Findings {
  root = resolve(root);
  const query = opts.query || "";
  const base: Findings = { schema_version: SCHEMA_VERSION, status: "OK", project_root: root, query, search_terms: [], total_files_matched: 0, total_matches: 0, truncated: false, term_coverage: [], files: [] };
  if (!existsSync(join(root, "ARCHITECTURE.md"))) return { ...base, status: "FAILED", reason: `ARCHITECTURE.md not found at ${root}` };
  const { terms, prebuilt } = planTerms(query);
  base.search_terms = terms.map((t) => t.text);
  if (!prebuilt && docLanguage(root).value === "es") base.monolingual_query_warning = "corpus is DOC_LANGUAGE: es; query carries no en|es alternations — pass pre-built patterns (Step F2)";
  const files = surfaceFiles(root, opts.surface || "all");
  const contents = new Map<string, string[]>();
  files.forEach((f) => contents.set(f, read(join(root, f)).split("\n")));

  // per term: (file, line) hits, capped like the agent's head_limit
  type Hit = { file: string; line: number };
  const hitsByTerm = new Map<string, { hits: Hit[]; relaxed: boolean }>();
  const scan = (rx: RegExp): Hit[] => {
    const hits: Hit[] = [];
    for (const f of files) { const lines = contents.get(f)!; for (let i = 0; i < lines.length && hits.length < MAX_MATCHES_PER_TERM; i++) if (rx.test(lines[i])) hits.push({ file: f, line: i + 1 }); if (hits.length >= MAX_MATCHES_PER_TERM) break; }
    return hits;
  };
  for (const t of terms) {
    let hits = scan(t.rx), relaxed = false;
    if (!hits.length) { const stem = relaxedStem(t.text); if (stem) { hits = scan(new RegExp(escapeRx(stem), "i")); relaxed = hits.length > 0; } }
    hitsByTerm.set(t.text, { hits, relaxed });
  }

  // aggregate by file
  type Agg = { file: string; terms: Set<string>; lines: Map<number, Set<string>> };
  const byFile = new Map<string, Agg>();
  for (const [term, { hits }] of hitsByTerm) for (const h of hits) {
    const a = byFile.get(h.file) || { file: h.file, terms: new Set<string>(), lines: new Map() };
    a.terms.add(term); (a.lines.get(h.line) || a.lines.set(h.line, new Set()).get(h.line)!).add(term);
    byFile.set(h.file, a);
  }
  const ranked = [...byFile.values()].sort((a, b) => b.terms.size - a.terms.size || b.lines.size - a.lines.size || a.file.localeCompare(b.file));
  // term-coverage guarantee: the file with most matches of each term survives the cap
  const reserved = new Set<string>();
  for (const [term, { hits }] of hitsByTerm) {
    if (!hits.length) continue;
    const count = new Map<string, number>(); hits.forEach((h) => count.set(h.file, (count.get(h.file) || 0) + 1));
    reserved.add([...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]);
  }
  const maxFiles = opts.maxFiles ?? MAX_FILES, maxClusters = opts.maxClusters ?? MAX_CLUSTERS_PER_FILE;
  const kept = ranked.filter((a, i) => i < maxFiles || reserved.has(a.file));
  let truncated = kept.length < ranked.length;

  const out: FileFindings[] = kept.map((a) => {
    const lines = contents.get(a.file)!;
    const sorted = [...a.lines.keys()].sort((x, y) => x - y);
    const clusters: number[][] = [];
    for (const l of sorted) { const c = clusters[clusters.length - 1]; if (c && l - c[c.length - 1] <= CLUSTER_SPAN) c.push(l); else clusters.push([l]); }
    if (clusters.length > maxClusters) truncated = true;
    const matches: Match[] = clusters.slice(0, maxClusters).map((c) => {
      const first = c[0], last = Math.min(c[c.length - 1], first + 4);
      const from = Math.max(1, first - 2), to = Math.min(lines.length, Math.max(last, first + 2));
      let excerpt = lines.slice(from - 1, to).join("\n");
      if (excerpt.length > EXCERPT_CHARS) excerpt = excerpt.slice(0, EXCERPT_CHARS - 1) + "…";
      return { line: first, heading: nearestHeading(lines, first - 1), excerpt };
    });
    return { file: a.file, matched_terms: [...a.terms], matches };
  });

  const result: Findings = {
    ...base,
    total_files_matched: byFile.size,
    total_matches: [...byFile.values()].reduce((n, a) => n + a.lines.size, 0),
    truncated,
    term_coverage: terms.map((t) => { const { hits, relaxed } = hitsByTerm.get(t.text)!; return { term: t.text, files_matched: new Set(hits.map((h) => h.file)).size, total_matches: hits.length, relaxed }; }),
    files: out,
  };
  if (truncated) result.truncation_note = `capped to ${maxFiles} files and ${maxClusters} match clusters per file — re-run with a more specific query for the rest`;
  if (opts.componentFile) result.focus_component = focusFor(root, opts.componentFile);
  return result;
}

// ---------------------------------------------------------------- YAML (the agent's fenced block, byte-compatible in shape)

const scalar = (v: unknown): string => {
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const s = String(v);
  return /^[A-Za-z0-9_./-]+$/.test(s) && !/^(true|false|null|yes|no)$/i.test(s) ? s : JSON.stringify(s);
};
const inlineList = (a: unknown[]) => `[${a.map(scalar).join(", ")}]`;

export function toYaml(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return `${pad}[]`;
    if (value.every((v) => typeof v !== "object" || v === null)) return `${pad}${inlineList(value)}`;
    return value.map((v) => { const body = toYaml(v, indent + 2).replace(/^\s+/, ""); return `${pad}- ${body}`; }).join("\n");
  }
  if (value && typeof value === "object") {
    const lines: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) { if (!v.length || v.every((x) => typeof x !== "object" || x === null)) lines.push(`${pad}${k}: ${v.length ? inlineList(v) : "[]"}`); else lines.push(`${pad}${k}:\n${toYaml(v, indent + 2)}`); }
      else if (v && typeof v === "object") lines.push(`${pad}${k}:\n${toYaml(v, indent + 2)}`);
      else if (typeof v === "string" && v.includes("\n")) lines.push(`${pad}${k}: |\n${v.split("\n").map((l) => `${pad}  ${l}`).join("\n")}`);
      else lines.push(`${pad}${k}: ${scalar(v)}`);
    }
    return lines.join("\n");
  }
  return `${pad}${scalar(value)}`;
}

export const fence = (label: "EXPLORE_MANIFEST" | "EXPLORE_FINDINGS", value: unknown) => `${label}:\n\`\`\`yaml\n${toYaml(value)}\n\`\`\``;

// ---------------------------------------------------------------- check: the header contract, cross-file

import { countHeaders, rawHeaderKeys, validateHeader, ALLOWED_FIELDS } from "./header-detector";

export type HeaderFinding = { file: string; severity: "error" | "warning"; rule: string; message: string };
export type HeaderCheck = { root: string; files: number; with_header: number; errors: number; warnings: number; findings: HeaderFinding[] };

const slugOf = (file: string) => file.replace(/^.*\//, "").replace(/\.md$/, "").replace(/^\d+-/, "");

/**
 * Every rule a writer can break and the parser would swallow: a missing header on a section or
 * component file, a key outside the closed set (a localized or invented key is dropped silently by
 * `parseHeader`), a second header block, a header placed after the first `##`, `component_self`
 * that is not the file's slug, a `components` entry that names no component file, a `related_adrs`
 * id with no file under `adr/`, an `internal_name` that disagrees with the `**Internal Name:**` row,
 * plus `validateHeader`'s own required-field errors and advisory warnings. Section files and
 * component files only — `ARCHITECTURE.md`, every `README.md`, `docs/CHANGELOG.md` and the archive the release rotates its old
 * entries into (`docs/CHANGELOG-ARCHIVE.md`, changelog-rotate.js) are exempt.
 */
export function checkHeaders(root: string, opts: { file?: string } = {}): HeaderCheck {
  root = resolve(root);
  const findings: HeaderFinding[] = [];
  const docs = listDocFiles(root).filter((d) => !/(^|\/)CHANGELOG(-ARCHIVE)?\.md$/.test(d.path));
  const componentSlugs = new Set(docs.filter((d) => d.path.startsWith("docs/components/")).map((d) => slugOf(d.path)));
  const adrDir = join(root, "adr");
  const adrIds = existsSync(adrDir) ? new Set(readdirSync(adrDir).map((f) => (f.match(/^(ADR-\d{3,})/i) || [])[1]).filter(Boolean).map((s) => s!.toUpperCase())) : null;
  let withHeader = 0;
  for (const d of docs) {
    const src = read(join(root, d.path));
    const isComponent = d.path.startsWith("docs/components/");
    const add = (severity: HeaderFinding["severity"], rule: string, message: string) => findings.push({ file: d.path, severity, rule, message });
    if (!d.has_header) { add("error", "missing-header", "no <!-- EXPLORER_HEADER --> block — every docs/NN-*.md and docs/components/**/*.md carries one right after the H1"); continue; }
    withHeader++;
    const n = countHeaders(src);
    if (n > 1) add("error", "duplicate-header", `${n} EXPLORER_HEADER blocks — keep one`);
    const headerAt = src.indexOf("<!-- EXPLORER_HEADER"), firstH2 = src.search(/^##\s/m);
    if (firstH2 >= 0 && headerAt > firstH2) add("error", "header-position", "the header sits after the first `##` heading — it goes immediately after the H1");
    const unknown = rawHeaderKeys(src).filter((k) => !ALLOWED_FIELDS.has(k));
    if (unknown.length) add("error", "unknown-key", `key(s) the parser drops silently: ${unknown.join(", ")} — allowed: ${[...ALLOWED_FIELDS].join(", ")} (keys are English machine identifiers in every language)`);
    const v = validateHeader(src, d.path);
    v.errors.forEach((e) => add("error", "required-field", e));
    v.warnings.forEach((w) => add("warning", "advisory", w));
    const h = parseHeader(src) || {};
    if (isComponent) {
      const slug = slugOf(d.path);
      if (h.component_self && h.component_self !== slug) add("error", "component-self-slug", `component_self "${h.component_self}" is not the file's slug "${slug}"`);
      const row = src.match(/^\*\*Internal Name:\*\*\s*`?([^`\n]+?)`?\s*$/m);
      if (h.internal_name && row && row[1].trim() !== h.internal_name) add("warning", "internal-name-drift", `internal_name "${h.internal_name}" differs from the **Internal Name:** row "${row[1].trim()}"`);
    } else {
      (h.components || []).forEach((c) => { if (!componentSlugs.has(c)) add("error", "unknown-component", `components names "${c}" but no docs/components/**/NN-${c}.md exists`); });
    }
    if (adrIds) (h.related_adrs || []).forEach((a) => { if (!adrIds.has(a.toUpperCase())) add("error", "unknown-adr", `related_adrs names ${a} but adr/ has no ${a.toUpperCase()}-*.md`); });
    const afterHeader = src.slice(src.indexOf("-->", headerAt) + 3).replace(/^\s+/, "");
    if (!afterHeader.startsWith(">")) add("warning", "no-summary", "no 30-second summary blockquote right after the header");
  }
  const kept = opts.file ? findings.filter((f) => f.file === toPosix(relative(root, resolve(root, opts.file!)))) : findings;
  return { root, files: docs.length, with_header: withHeader, errors: kept.filter((f) => f.severity === "error").length, warnings: kept.filter((f) => f.severity === "warning").length, findings: kept };
}

export function renderCheck(c: HeaderCheck): string {
  const lines = [`EXPLORER_HEADER check — ${c.files} file(s), ${c.with_header} with a header, ${c.errors} error(s), ${c.warnings} warning(s)`];
  c.findings.forEach((f) => lines.push(`${f.severity === "error" ? "✗" : "△"} ${f.file} — ${f.rule}: ${f.message}`));
  if (!c.findings.length) lines.push("✓ every header parses, sits after its H1, uses only the closed key set, and points at files that exist");
  return lines.join("\n");
}
