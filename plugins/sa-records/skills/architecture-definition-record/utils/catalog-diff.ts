/**
 * Institutional ADR catalog synchronisation — the deterministic half.
 *
 * The institutional catalog (ADR-001..100 plus one `COVERAGE_MAP.json` per
 * language edition) lives in a git repository the skill clones into
 * `.cache/sa-skills/adr-catalog/`. The project's `adr/` holds a *copy* of one
 * edition, and `adr/.institutional-catalog.json` (the **pin**) records which
 * commit that copy came from and the SHA-256 of every file it wrote.
 *
 * Workflow 6 (bootstrap) and Workflow 9 (sync) in `SKILL.md` call this module
 * through `catalog-diff-cli.ts` for the three operations that must never be
 * left to the model's interpretation of a diff:
 *
 *   - `diffCatalog`  — classify every institutional ADR as unchanged / added /
 *                      superseded / amended / status-only / cosmetic / removed,
 *                      detect renames, detect local hand-edits against the pin,
 *                      and diff the coverage map entry by entry.
 *   - `applyCatalog` — copy the edition into `adr/` with overwrite (the sync
 *                      case) or without (the bootstrap case); never delete an
 *                      ADR except the old filename of a rename.
 *   - `writePin`     — hash the copied files and write the pin.
 *
 * Institutional ADRs are **amended in place or superseded** — the catalog
 * never simply deletes one. A `removed` entry is therefore reported as a
 * finding, and `applyCatalog` leaves the local file alone.
 *
 * The functions here parse and compare only; the impact analysis (which
 * `docs/` and `handoffs/` passages cite a changed decision and what must be
 * rewritten) is the model's job in Workflow 9 Step 9.6, fed by this module's
 * output.
 *
 * @module catalog-diff
 */
import { createHash } from "crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { basename, join } from "path";
import { createRequire } from "module";

// the record section vocabulary in both editions — one copy, shared with prose-check and tdr-check
const { VOCAB: RECORD_VOCAB } = createRequire(import.meta.url)("../../../scripts/shared/record-structure.js");
/** Today in local time, YYYY-MM-DD — the pin's sync date (never toISOString, which is UTC and a day off west of it). */
const getLocalDateString = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Filename of the sync pin inside the project's `adr/`. */
export const PIN_FILENAME = ".institutional-catalog.json";

/** Coverage map filename — one per language edition, beside the ADRs. */
export const COVERAGE_MAP_FILENAME = "COVERAGE_MAP.json";

/** Default clone location, project-relative. Already granted under `.cache/sa-skills/**`. */
export const DEFAULT_CLONE_DIR = ".cache/sa-skills/adr-catalog";

export const PIN_SCHEMA_VERSION = "1";

/** Institutional range — the only range a catalog may contribute. */
const INSTITUTIONAL_MIN = 1;
const INSTITUTIONAL_MAX = 100;

/** `ADR-NNN-slug.md`. Only the canonical form — the ID Format Gate rejects the rest. */
const ADR_FILE_RE = /^ADR-(\d{3})-([A-Za-z0-9._-]+)\.md$/;

/** Sections whose text change makes an amendment substantive (not cosmetic). */
const SUBSTANTIVE_SECTIONS = ["Context", "Decision", "Consequences"] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdrStatus =
  | "Proposed"
  | "Accepted"
  | "Deprecated"
  | "Rejected"
  | "Superseded"
  | "Unknown";

export type AdrHeader = {
  /** `ADR-012` */
  id: string;
  /** Numeric part, 12 */
  number: number;
  /** H1 text with the `ADR-NNN:` prefix stripped; empty when no H1. */
  title: string;
  status: AdrStatus;
  /** Present when `status` is `Superseded` and the line names its successor. */
  superseded_by: string | null;
  /** IDs this ADR declares it supersedes (`Supersedes [ADR-005]`). */
  supersedes: string[];
  /** `**Date**:` value; null when absent. */
  date: string | null;
};

export type ChangeKind =
  | "unchanged"
  | "added"
  | "superseded"
  | "amended"
  | "status_only"
  | "cosmetic"
  | "removed";

export type AdrChange = {
  id: string;
  kind: ChangeKind;
  /** Filename in the catalog edition; null for `removed`. */
  catalog_file: string | null;
  /** Filename in the project `adr/`; null for `added`. */
  local_file: string | null;
  /** True when both exist under different filenames (title/slug changed). */
  renamed: boolean;
  catalog: AdrHeader | null;
  local: AdrHeader | null;
  /** For `superseded`: the successor the catalog names. */
  superseded_by: string | null;
  /** For `added`: the predecessor(s) this new ADR declares it supersedes. */
  supersedes: string[];
  /** For `amended`: which substantive sections differ. `["(judged)"]` when `judgeCosmetic` promoted a cosmetic pair; `["(unreadable)"]` when no section heading could be read on one side. */
  changed_sections: string[];
  /** Set by `judgeCosmetic`: the judge's probability that the change is substantive, and who answered. */
  judged?: { p?: number; by: string };
  /**
   * True when the local file's hash differs from what the pin recorded — the
   * imported copy was hand-edited in the project, which the skill forbids.
   * Always false without a pin.
   */
  local_drift: boolean;
};

export type CoverageEntryChange = {
  adr: string;
  change: "added" | "removed" | "ratified" | "unratified" | "edited";
  /** Requirement codes on either side of the change. */
  codes: string[];
  /** Whether the change affects a contract right now (a ratified entry is involved). */
  effective: boolean;
};

export type CoverageDiff = {
  status: "absent" | "added" | "removed" | "unchanged" | "changed";
  entries: CoverageEntryChange[];
  /** Union of `codes` over `effective` entry changes. */
  affected_codes: string[];
};

export type CatalogDiff = {
  edition_dir: string;
  changes: AdrChange[];
  coverage: CoverageDiff;
  summary: Record<ChangeKind, number> & { renamed: number; local_drift: number };
  /** Non-fatal observations (files skipped, parse oddities). */
  warnings: string[];
};

export type Pin = {
  schema_version: string;
  /** Git URL the catalog is cloned from. User-editable — the skill re-clones when it changes. */
  remote: string;
  /** Branch or tag tracked. */
  ref: string;
  /** Language edition imported (`en` → catalog root, `es` → `es/`). */
  edition: string;
  /** Commit the local copy reflects. */
  commit: string;
  synced_on: string;
  /** Project-relative clone location. */
  clone_dir: string;
  /** `ADR-NNN-slug.md` → SHA-256 of the bytes written into `adr/`. */
  files: Record<string, string>;
  /** SHA-256 of `adr/COVERAGE_MAP.json` as written; null when the edition carries none. */
  coverage_map: string | null;
};

export type ApplyResult = {
  written: string[];
  skipped_existing: string[];
  renamed_from: string[];
  coverage_map_written: boolean;
  /** `removed` ADRs are never deleted; they are listed here for the skill to mark. */
  left_in_place: string[];
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Strip a UTF-8 BOM and normalise line endings — the catalog may be edited on Windows. */
function normalizeText(s: string): string {
  return s.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

/** True for `ADR-NNN-slug.md` with NNN in the institutional range. */
export function isInstitutionalFile(file: string): boolean {
  const m = basename(file).match(ADR_FILE_RE);
  if (!m) return false;
  const n = Number(m[1]);
  return n >= INSTITUTIONAL_MIN && n <= INSTITUTIONAL_MAX;
}

export function idFromFilename(file: string): string | null {
  const m = basename(file).match(ADR_FILE_RE);
  return m ? `ADR-${m[1]}` : null;
}

function parseStatus(raw: string): { status: AdrStatus; superseded_by: string | null } {
  const value = raw.trim();
  const sup = value.match(/Superseded\s+by\s+\[?(ADR-\d{3})/i);
  if (sup) return { status: "Superseded", superseded_by: sup[1] };
  if (/^Superseded/i.test(value)) return { status: "Superseded", superseded_by: null };
  for (const s of ["Proposed", "Accepted", "Deprecated", "Rejected"] as const) {
    if (new RegExp(`^${s}\\b`, "i").test(value)) return { status: s, superseded_by: null };
  }
  return { status: "Unknown", superseded_by: null };
}

/**
 * Read the header fields an ADR declares in its first lines. Tolerates the
 * `**Status**:` / `Status:` / `| **Status** | value |` forms the catalog and
 * the template both produce.
 */
export function parseAdrHeader(content: string, filename: string): AdrHeader {
  const text = normalizeText(content);
  const head = text.split("\n").slice(0, 40);

  const id = idFromFilename(filename) ?? "ADR-000";
  const number = Number(id.slice(4));

  let title = "";
  let status: AdrStatus = "Unknown";
  let superseded_by: string | null = null;
  let date: string | null = null;
  const supersedes = new Set<string>();

  for (const line of head) {
    if (!title) {
      const h1 = line.match(/^#\s+(.+?)\s*$/);
      if (h1) {
        title = h1[1].replace(/^ADR-\d{3}\s*[:—–-]\s*/, "").trim();
        continue;
      }
    }
    const field = line.match(/^\|?\s*\*{0,2}([A-Za-z ]+?)\*{0,2}\s*[:|]\s*(.+?)\s*\|?\s*$/);
    if (field) {
      const key = field[1].trim().toLowerCase();
      const value = field[2].trim();
      if (key === "status" && status === "Unknown") {
        ({ status, superseded_by } = parseStatus(value));
      } else if (key === "date" && date === null) {
        date = value;
      }
    }
    for (const m of line.matchAll(/Supersedes\s+\[?(ADR-\d{3})/gi)) supersedes.add(m[1]);
  }

  return { id, number, title, status, superseded_by, supersedes: [...supersedes], date };
}

/** `##` or `###` heading: level and visible text. */
const HEADING_RE = /^(#{2,3})\s+(.*?)\s*$/;
/** Ordinal prefixes a catalog may put on a section heading: `1.`, `1)`, `1.2`, `A.`, `IV.`. */
const ORDINAL_RE = /^(?:\d+(?:\.\d+)*[.)]?|[A-Za-z][.)]|[IVXLCivxlc]+[.)])\s+/;

/** Accent- and case-blind key of a heading's text. */
const headingKey = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
/** A section's names in every edition: the English name and its localized forms (record-structure.js `VOCAB`). */
const namesOf = (name: string): Set<string> =>
  new Set([name, ...((RECORD_VOCAB.adr.heading as Record<string, string[]>)[name] ?? [])].map(headingKey));

/**
 * Extract one section body by its canonical English name. Matches the heading
 * regardless of numbering style — `## Context`, `## 1. Context`, `## 1) Context`,
 * `### Context` — in the English edition or as a localized edition writes it
 * (`## 1. Contexto`, `## 2. Decisión` — the record vocabulary of
 * `scripts/shared/record-structure.js`), or by a `<!-- SECTION: Name -->` anchor.
 * Measured: a Spanish edition without anchors left every pair of a sync
 * unrecognised, so the amended / cosmetic split was unreliable for the whole
 * catalog. The body runs to the next heading of the same or a shallower level,
 * so `###` sub-headings stay inside a `##` section.
 */
function findSection(lines: string[], name: string): { start: number; end: number } | null {
  const anchor = new RegExp(`<!--\\s*SECTION:\\s*${name}\\s*-->`, "i");
  const names = namesOf(name);
  const english = { test: (t: string) => names.has(headingKey(t)) };
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING_RE.exec(lines[i]);
    if (!m) continue;
    const text = m[2]
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim()
      .replace(ORDINAL_RE, "")
      .replace(/[:.]\s*$/, "")
      .trim();
    if (anchor.test(lines[i]) || english.test(text)) {
      start = i + 1;
      level = m[1].length;
      break;
    }
  }
  if (start < 0) return null;
  const boundary = new RegExp(`^#{1,${level}}\\s+`);
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (boundary.test(lines[i])) { end = i; break; }
  }
  return { start, end };
}

export function extractSection(content: string, name: string): string {
  const lines = normalizeText(content).split("\n");
  const hit = findSection(lines, name);
  return hit ? lines.slice(hit.start, hit.end).join("\n") : "";
}

/** True when at least one substantive section heading is recognised in the file. */
export function hasSubstantiveSections(content: string): boolean {
  const lines = normalizeText(content).split("\n");
  return SUBSTANTIVE_SECTIONS.some((s) => findSection(lines, s) !== null);
}

/** Whitespace- and comment-insensitive form for "did the meaning change" comparisons. */
function canon(s: string): string {
  return s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Enumeration
// ---------------------------------------------------------------------------

type FileEntry = { file: string; content: string; header: AdrHeader };

function listInstitutional(dir: string, warnings: string[], label: string): Map<string, FileEntry> {
  const out = new Map<string, FileEntry>();
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir).sort()) {
    if (!isInstitutionalFile(file)) continue;
    const content = readFileSync(join(dir, file), "utf-8").replace(/\r\n?/g, "\n");
    const header = parseAdrHeader(content, file);
    if (out.has(header.id)) {
      warnings.push(`${label}: duplicate id ${header.id} — "${out.get(header.id)!.file}" and "${file}"; keeping the first`);
      continue;
    }
    out.set(header.id, { file, content, header });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function classifyPair(c: FileEntry, l: FileEntry): { kind: ChangeKind; changed_sections: string[] } {
  if (normalizeText(c.content) === normalizeText(l.content)) return { kind: "unchanged", changed_sections: [] };

  if (c.header.status === "Superseded" && l.header.status !== "Superseded") {
    return { kind: "superseded", changed_sections: [] };
  }

  const changed = SUBSTANTIVE_SECTIONS.filter(
    (s) => canon(extractSection(c.content, s)) !== canon(extractSection(l.content, s)),
  );
  if (changed.length > 0) return { kind: "amended", changed_sections: changed };

  if (c.header.status !== l.header.status || c.header.superseded_by !== l.header.superseded_by) {
    return { kind: "status_only", changed_sections: [] };
  }

  return { kind: "cosmetic", changed_sections: [] };
}

// ---------------------------------------------------------------------------
// Coverage map diff
// ---------------------------------------------------------------------------

type CoverageEntry = {
  adr: string;
  claim?: string;
  predicate?: string;
  breaks_when?: unknown;
  satisfies?: Array<{ code: string; [k: string]: unknown }>;
  ratified_by?: string;
  ratified_on?: string;
  [k: string]: unknown;
};

function readCoverage(path: string, warnings: string[]): Map<string, CoverageEntry> | null {
  if (!existsSync(path)) return null;
  try {
    const map = JSON.parse(readFileSync(path, "utf-8").replace(/\r\n?/g, "\n"));
    const out = new Map<string, CoverageEntry>();
    for (const e of map.entries ?? []) if (e?.adr) out.set(e.adr, e);
    return out;
  } catch (err) {
    warnings.push(`coverage map unreadable at ${path}: ${(err as Error).message}`);
    return null;
  }
}

const isRatified = (e: CoverageEntry | undefined): boolean => !!(e && e.ratified_by && e.ratified_on);
const codesOf = (e: CoverageEntry | undefined): string[] => (e?.satisfies ?? []).map((s) => s.code);
const substance = (e: CoverageEntry): string =>
  JSON.stringify([e.claim ?? "", e.predicate ?? "", e.breaks_when ?? null, e.satisfies ?? []]);

export function diffCoverage(catalogPath: string, localPath: string, warnings: string[]): CoverageDiff {
  const cat = readCoverage(catalogPath, warnings);
  const loc = readCoverage(localPath, warnings);

  if (!cat && !loc) return { status: "absent", entries: [], affected_codes: [] };
  if (cat && !loc) {
    const entries = [...cat.values()].map<CoverageEntryChange>((e) => ({
      adr: e.adr, change: "added", codes: codesOf(e), effective: isRatified(e),
    }));
    return finishCoverage("added", entries);
  }
  if (!cat && loc) {
    const entries = [...loc.values()].map<CoverageEntryChange>((e) => ({
      adr: e.adr, change: "removed", codes: codesOf(e), effective: isRatified(e),
    }));
    return finishCoverage("removed", entries);
  }

  const entries: CoverageEntryChange[] = [];
  const ids = new Set([...cat!.keys(), ...loc!.keys()]);
  for (const id of [...ids].sort()) {
    const c = cat!.get(id);
    const l = loc!.get(id);
    const codes = [...new Set([...codesOf(c), ...codesOf(l)])].sort();
    if (c && !l) { entries.push({ adr: id, change: "added", codes, effective: isRatified(c) }); continue; }
    if (!c && l) { entries.push({ adr: id, change: "removed", codes, effective: isRatified(l) }); continue; }
    const rc = isRatified(c), rl = isRatified(l);
    if (substance(c!) !== substance(l!)) {
      entries.push({ adr: id, change: "edited", codes, effective: rc || rl });
    } else if (rc && !rl) {
      entries.push({ adr: id, change: "ratified", codes, effective: true });
    } else if (!rc && rl) {
      entries.push({ adr: id, change: "unratified", codes, effective: true });
    }
  }
  return finishCoverage(entries.length ? "changed" : "unchanged", entries);
}

function finishCoverage(status: CoverageDiff["status"], entries: CoverageEntryChange[]): CoverageDiff {
  const affected = new Set<string>();
  for (const e of entries) if (e.effective) for (const c of e.codes) affected.add(c);
  return { status, entries, affected_codes: [...affected].sort() };
}

// ---------------------------------------------------------------------------
// Pin
// ---------------------------------------------------------------------------

export function readPin(projectRoot: string): Pin | null {
  const p = join(projectRoot, "adr", PIN_FILENAME);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8").replace(/\r\n?/g, "\n")) as Pin;
  } catch {
    return null;
  }
}

/** Hash every institutional file currently in `adr/` plus the coverage map. */
function hashLocal(adrDir: string): { files: Record<string, string>; coverage_map: string | null } {
  const files: Record<string, string> = {};
  if (existsSync(adrDir)) {
    for (const file of readdirSync(adrDir).sort()) {
      if (isInstitutionalFile(file)) files[file] = sha256(readFileSync(join(adrDir, file)));
    }
  }
  const cm = join(adrDir, COVERAGE_MAP_FILENAME);
  return { files, coverage_map: existsSync(cm) ? sha256(readFileSync(cm)) : null };
}

export function writePin(
  projectRoot: string,
  meta: Pick<Pin, "remote" | "ref" | "edition" | "commit"> & Partial<Pick<Pin, "clone_dir">>,
): Pin {
  const adrDir = join(projectRoot, "adr");
  mkdirSync(adrDir, { recursive: true });
  const hashed = hashLocal(adrDir);
  const pin: Pin = {
    schema_version: PIN_SCHEMA_VERSION,
    remote: meta.remote,
    ref: meta.ref,
    edition: meta.edition,
    commit: meta.commit,
    synced_on: getLocalDateString(),
    clone_dir: meta.clone_dir ?? DEFAULT_CLONE_DIR,
    files: hashed.files,
    coverage_map: hashed.coverage_map,
  };
  writeFileSync(join(adrDir, PIN_FILENAME), JSON.stringify(pin, null, 2) + "\n");
  return pin;
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

/**
 * Compare one catalog edition directory against the project's `adr/`.
 *
 * @param editionDir  The resolved edition inside the clone (root for `en`, `es/` for `es`).
 * @param projectRoot The consuming project.
 */
export function diffCatalog(editionDir: string, projectRoot: string): CatalogDiff {
  const warnings: string[] = [];
  const adrDir = join(projectRoot, "adr");
  const pin = readPin(projectRoot);

  const catalog = listInstitutional(editionDir, warnings, "catalog");
  const local = listInstitutional(adrDir, warnings, "adr/");

  const changes: AdrChange[] = [];
  const ids = [...new Set([...catalog.keys(), ...local.keys()])].sort();

  for (const id of ids) {
    const c = catalog.get(id);
    const l = local.get(id);

    let local_drift = false;
    if (l && pin) {
      const recorded = pin.files[l.file];
      if (recorded && recorded !== sha256(readFileSync(join(adrDir, l.file)))) local_drift = true;
    }

    if (c && !l) {
      changes.push({
        id, kind: "added", catalog_file: c.file, local_file: null, renamed: false,
        catalog: c.header, local: null, superseded_by: null, supersedes: c.header.supersedes,
        changed_sections: [], local_drift: false,
      });
      continue;
    }
    if (!c && l) {
      changes.push({
        id, kind: "removed", catalog_file: null, local_file: l.file, renamed: false,
        catalog: null, local: l.header, superseded_by: null, supersedes: [],
        changed_sections: [], local_drift,
      });
      continue;
    }

    let { kind, changed_sections } = classifyPair(c!, l!);
    if (kind === "amended" || kind === "cosmetic" || kind === "status_only") {
      const blind = [
        !hasSubstantiveSections(c!.content) ? `catalog "${c!.file}"` : null,
        !hasSubstantiveSections(l!.content) ? `adr/ "${l!.file}"` : null,
      ].filter(Boolean);
      if (blind.length > 0) {
        // A pair whose sections cannot be read is never cosmetic: the split is blind, so the change is treated as an
        // amendment and its citations are checked (Workflow 9). Measured: when this was an instruction beside a
        // `cosmetic` verdict, a sync followed the verdict and left 34 amended decisions unpropagated.
        if (kind === "cosmetic") { kind = "amended"; changed_sections = ["(unreadable)"]; }
        warnings.push(
          `${id}: no Context / Decision / Consequences heading recognised in ${blind.join(" and ")} — ` +
          `classified amended (sections unreadable); check the heading style`,
        );
      }
    }
    const renamed = c!.file !== l!.file;
    changes.push({
      id,
      kind: kind === "unchanged" && renamed ? "cosmetic" : kind,
      catalog_file: c!.file, local_file: l!.file, renamed,
      catalog: c!.header, local: l!.header,
      superseded_by: kind === "superseded" ? c!.header.superseded_by : null,
      supersedes: c!.header.supersedes,
      changed_sections, local_drift,
    });
  }

  const coverage = diffCoverage(
    join(editionDir, COVERAGE_MAP_FILENAME),
    join(adrDir, COVERAGE_MAP_FILENAME),
    warnings,
  );

  const summary = {
    unchanged: 0, added: 0, superseded: 0, amended: 0, status_only: 0, cosmetic: 0, removed: 0,
    renamed: 0, local_drift: 0,
  };
  for (const ch of changes) {
    summary[ch.kind]++;
    if (ch.renamed) summary.renamed++;
    if (ch.local_drift) summary.local_drift++;
  }

  return { edition_dir: editionDir, changes, coverage, summary, warnings };
}

// ---------------------------------------------------------------------------
// The cosmetic / amended split, judged
// ---------------------------------------------------------------------------

/** The lines only one side has, after `canon` — the smallest state that carries the change. */
function changedLines(a: string, b: string): { removed: string[]; added: string[] } {
  const A = canon(a).split("\n"), B = canon(b).split("\n");
  const inB = new Set(B), inA = new Set(A);
  return { removed: A.filter((l) => l.trim() && !inB.has(l)), added: B.filter((l) => l.trim() && !inA.has(l)) };
}

/**
 * Re-judge every `cosmetic` pair: does the change alter what the ADR decides, why, or what follows, in
 * substance? `classifyPair` answers by comparing the three substantive sections, and when a heading style
 * it does not recognise hides them (the 6.14.4 case, and the blind warning above) every real amendment lands
 * in `cosmetic`. The judge (sa-skills' scripts/judge.js) reads the removed and added lines. Its default engine is
 * `agent`: a worksheet the session answers, applied on a second run with `answers` (the CLI's `--answers`). The
 * structural classification is the documented check and the judge only re-reads it, so a pair the judge has not
 * answered (no judge, a pending worksheet, an engine error, an unanswered item) stays `cosmetic`, is marked
 * `judged: { by: "undecided" }` — not judged — and is listed under `undecided`. A promoted pair becomes `amended`
 * with `changed_sections: ["(judged)"]` and `judged: { p, by }`; the summary is recounted.
 */
/**
 * The judge is sa-skills' (scripts/judge.js), not this plugin's: sa-records runs without it. Found through
 * `--sa-skills <dir>` / SA_SKILLS_DIR (an install), or in the repo, where plugins/sa-records sits inside sa-skills.
 */
function findJudge(saSkills?: string): string | null {
  const candidates = [
    saSkills ? join(saSkills, "scripts", "judge.js") : null,
    process.env.SA_SKILLS_DIR ? join(process.env.SA_SKILLS_DIR, "scripts", "judge.js") : null,
    join(import.meta.dir, "..", "..", "..", "..", "..", "scripts", "judge.js"),
  ].filter((p): p is string => !!p);
  return candidates.find((p) => existsSync(p)) ?? null;
}

export async function judgeCosmetic(
  diff: CatalogDiff, editionDir: string, projectRoot: string,
  opts: { engine?: string; root?: string; apiKey?: string; fetch?: unknown; cache?: boolean; hi?: number; saSkills?: string; answers?: boolean | string } = {},
): Promise<{ engine: string; asked: number; promoted: string[]; undecided: string[]; note: string | null }> {
  const cosmetic = diff.changes.filter((c) => c.kind === "cosmetic" && c.catalog_file && c.local_file);
  // a pair no judge answered keeps the structural classification and says it was not judged
  const leave = (cs: AdrChange[]) => cs.map((c) => { c.judged = { by: "undecided" }; return c.id; });
  const judgePath = findJudge(opts.saSkills);
  if (!judgePath) {
    return { engine: "none", asked: 0, promoted: [], undecided: leave(cosmetic), note: "no judge — sa-skills not found (pass --sa-skills <dir>): the pairs classified cosmetic stay cosmetic, not judged (undecided); with sa-skills the agent judge reviews them" };
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const JUDGE = require(judgePath);
  const SPEC = {
    id: "adr-substance", type: "noul", hi: opts.hi ?? 0.6,
    question: "Do the lines removed (`item.removed`) and added (`item.added`) between two versions of `item.adr` change what the record decides, why it decides it (its context) or what follows from it (its consequences), in substance?",
    criteria: {
      true: "The decision, a constraint, a scope, a rationale, a consequence, a named technology, a threshold or an obligation is different afterwards.",
      false: "Only wording, formatting, punctuation, headings, dates, names of people, links, typos or ordering changed; what is decided and why reads the same.",
    },
  };
  const cands = cosmetic;
  const out = { engine: opts.engine || JUDGE.engineInForce(), asked: 0, promoted: [] as string[], undecided: [] as string[], note: null as string | null };
  const items = cands.map((c, i) => {
    const catalogText = readFileSync(join(editionDir, c.catalog_file!), "utf8").replace(/\r\n?/g, "\n");
    const localText = readFileSync(join(projectRoot, "adr", c.local_file!), "utf8").replace(/\r\n?/g, "\n");
    const { removed, added } = changedLines(localText, catalogText);
    return { id: `a${i}`, state: { adr: c.id, removed, added }, empty: !removed.length && !added.length };
  }).filter((it) => !it.empty);
  out.asked = items.length;
  if (!items.length) return out;
  let res: any;
  const pairOf = (it: { id: string }) => cands[Number(it.id.slice(1))];
  try { res = await JUDGE.judge(SPEC, items, { engine: opts.engine, root: opts.root ?? projectRoot, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache, answers: opts.answers }); }
  catch (e: any) { if (e.name !== "JudgeError") throw e; out.undecided = leave(items.map(pairOf)); out.note = `${e.message} — ${out.undecided.length} cosmetic pair(s) not judged (undecided)`; return out; }
  if (res.pending) { out.undecided = leave(items.map(pairOf)); out.note = `agent worksheet at ${res.pending} — answer it (answers to ${res.answersFile}) and run diff again with --answers; until then ${out.undecided.length} cosmetic pair(s) are not judged (undecided)`; return out; }
  out.engine = res.engine;
  items.forEach((it) => {
    const a = res.answers[it.id];
    const c = pairOf(it);
    if (!a) { out.undecided.push(...leave([c])); return; }
    c.judged = { p: +a.p.toFixed(2), by: a.by };
    if (a.p >= SPEC.hi) { c.kind = "amended"; c.changed_sections = ["(judged)"]; out.promoted.push(`${c.id} (${a.by} ${a.p.toFixed(2)})`); }
  });
  if (out.promoted.length) { diff.summary.cosmetic -= out.promoted.length; diff.summary.amended += out.promoted.length; }
  if (out.undecided.length) out.note = `${out.undecided.length} cosmetic pair(s) not judged (undecided): ${out.undecided.join(", ")}`;
  return out;
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

/**
 * Copy the edition's institutional range (and its coverage map) into `adr/`.
 *
 * `overwrite: false` is the Workflow 6 bootstrap contract (no-clobber);
 * `overwrite: true` is the Workflow 9 sync contract. A rename deletes the old
 * local filename after the new one is written. `removed` ADRs are never
 * deleted here — the skill marks them and the user decides.
 */
export function applyCatalog(
  editionDir: string,
  projectRoot: string,
  opts: { overwrite: boolean },
): ApplyResult {
  const diff = diffCatalog(editionDir, projectRoot);
  const adrDir = join(projectRoot, "adr");
  mkdirSync(adrDir, { recursive: true });

  const result: ApplyResult = {
    written: [], skipped_existing: [], renamed_from: [], coverage_map_written: false, left_in_place: [],
  };

  for (const ch of diff.changes) {
    if (ch.kind === "removed") { result.left_in_place.push(ch.local_file!); continue; }
    if (ch.kind === "unchanged" && !ch.renamed) continue;

    const target = join(adrDir, ch.catalog_file!);
    if (ch.kind !== "added" && !opts.overwrite && !ch.renamed) {
      result.skipped_existing.push(ch.catalog_file!);
      continue;
    }
    if (ch.renamed && existsSync(target) && !opts.overwrite) {
      result.skipped_existing.push(ch.catalog_file!);
      continue;
    }

    copyFileSync(join(editionDir, ch.catalog_file!), target);
    result.written.push(ch.catalog_file!);
    if (ch.renamed && ch.local_file && ch.local_file !== ch.catalog_file) {
      unlinkSync(join(adrDir, ch.local_file));
      result.renamed_from.push(ch.local_file);
    }
  }

  const cmSrc = join(editionDir, COVERAGE_MAP_FILENAME);
  const cmDst = join(adrDir, COVERAGE_MAP_FILENAME);
  if (existsSync(cmSrc) && (opts.overwrite || !existsSync(cmDst))) {
    copyFileSync(cmSrc, cmDst);
    result.coverage_map_written = true;
  }

  return result;
}

/** `en` → edition root; anything else → `<root>/<edition>/` when that directory exists. */
export function resolveEditionDir(cloneDir: string, edition: string): string {
  if (edition === "en") return cloneDir;
  const sub = join(cloneDir, edition);
  return existsSync(sub) ? sub : cloneDir;
}

// ---------------------------------------------------------------------------
// The citation checklist (Workflow 9 Step 9.6)
// ---------------------------------------------------------------------------

export interface Citation { id: string; file: string; line: number; text: string }

/** Kinds whose citations Step 9.6 must check: the decision text changed, or the decision moved. */
export const PROPAGATING_KINDS: ReadonlySet<ChangeKind> = new Set(["amended", "superseded", "status_only"]);

/**
 * Every line of the architecture that cites one of `ids` — `ARCHITECTURE.md`, `docs/**\/*.md` (the changelog excluded:
 * it is history) and the project's own ADRs (101+) — by the literal id, never by topic. Measured on a real sync:
 * citations found by subject reached the passages that used the decision's vocabulary and missed two that quoted it,
 * so a propagation is held to this list — every row edited or stated unaffected.
 */
export function citationChecklist(projectRoot: string, ids: string[]): Citation[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (name.name.endsWith(".md")) files.push(p);
    }
  };
  if (existsSync(join(projectRoot, "ARCHITECTURE.md"))) files.push(join(projectRoot, "ARCHITECTURE.md"));
  walk(join(projectRoot, "docs"));
  const adrDir = join(projectRoot, "adr");
  if (existsSync(adrDir)) {
    for (const f of readdirSync(adrDir)) {
      const m = /^ADR-(\d+)/.exec(f);
      if (m && Number(m[1]) >= 101 && f.endsWith(".md")) files.push(join(adrDir, f));
    }
  }
  const out: Citation[] = [];
  const res = ids.map((id) => ({ id, re: new RegExp(`\\b${id}(?!\\d)`) }));
  for (const file of files.sort()) {
    const rel = file.slice(projectRoot.length + 1);
    if (/^docs\/CHANGELOG(-ARCHIVE)?\.md$/i.test(rel)) continue;
    normalizeText(readFileSync(file, "utf8")).split("\n").forEach((text, i) => {
      for (const { id, re } of res) if (re.test(text)) out.push({ id, file: rel, line: i + 1, text: text.trim().slice(0, 200) });
    });
  }
  return out;
}

/** The checklist as Markdown, one section per ADR, one unchecked row per citing line. */
export function renderChecklist(cites: Citation[], ids: string[]): string {
  const out = ["# Citation checklist — Workflow 9 Step 9.6", "", "Every row is edited (a restated fact changed) or stated unaffected in the sync report.", ""];
  for (const id of ids) {
    const rows = cites.filter((c) => c.id === id);
    out.push(`## ${id} — ${rows.length} citing line(s)`, "");
    if (!rows.length) out.push("- none", "");
    else out.push(...rows.map((c) => `- [ ] \`${c.file}:${c.line}\` — ${c.text.replace(/`/g, "'")}`), "");
  }
  return out.join("\n");
}
