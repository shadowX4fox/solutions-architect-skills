/**
 * Structured reader for C4 component documentation under `docs/components/`.
 *
 * The component `.md` file is the source of truth for a component's canonical
 * name, C4 type, technology and slug. `docs/components/README.md` is a derived
 * index. Before this module existed, nine separate skill/agent files each
 * restated their own grep rules for those same four facts, and two of them
 * disagreed about which file was the source. This module is the single
 * sanctioned reader: skills call the CLI wrapper (`component-cli.ts`) rather
 * than re-parsing the markdown.
 *
 * Pure parsing plus a filesystem walk — never writes. The guardian skill
 * remains the only writer of `docs/components/README.md`.
 *
 * @module component-facts
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  extractH1,
  hasExplorerHeader,
  listDocFiles,
  parseHeader,
  toPosix,
  type HeaderFields,
} from "./header-detector";
import { parseCapacity, type Capacity } from "./capacity";

/**
 * The 8 canonical C4 L2 container types. Closed set — adding a value here
 * requires updating the Type table in
 * `skills/architecture-component-guardian/SKILL.md` first.
 */
export const CANONICAL_L2_TYPES = [
  "API Service",
  "Web Application",
  "Worker/Consumer",
  "Gateway",
  "Database",
  "Cache",
  "Message Broker",
  "Object Storage",
] as const;

/**
 * Cap on the `**Description:**` tagline, in characters (code points — an accent is one). The
 * tagline is the fixed-width slot every index, briefing table and viewer prints beside the name,
 * so the cap is a contract, not a budget.
 */
export const DESCRIPTION_MAX_CHARS = 120;

export type ComponentFact = {
  /** Repo-relative, POSIX-separated: `docs/components/payments/01-payment-service.md`. */
  path: string;
  /** System folder the component belongs to; null for a legacy flat component. */
  system: string | null;
  /** C4 altitude. L1 = system descriptor, L2 = container (the implementable unit). */
  level: "L1" | "L2";
  /** Index label for the README `#` column (`5.3`); null for L1 descriptors. */
  index: string | null;
  /** Canonical full name — the H1, verbatim. Never abbreviated downstream. */
  name: string;
  /** Kebab-case slug — `component_self` when present, else derived from the filename. */
  slug: string;
  /** `**Type:**` verbatim. Empty string when the field is absent. */
  type: string;
  /** Whether `type` is one of {@link CANONICAL_L2_TYPES}. Always false for L1. */
  type_canonical: boolean;
  /** `**Technology:**` split on commas, IcePanel brackets stripped. */
  technology: string[];
  /**
   * `**Description:**` verbatim — the one-line tagline. Required on every file-backed L2 container;
   * optional on an L1 descriptor. Wherever it is written it opens with the canonical name (the H1,
   * plain text) and stays within {@link DESCRIPTION_MAX_CHARS}; `check` reports the breach. Null
   * when absent, and always null for a container declared as a row of a `## Containers` table.
   */
  description: string | null;
  /**
   * `**Internal Name:**` verbatim — the repository / workload / product identifier
   * when it differs from the canonical name (`shp-spa-order-history`).
   * Falls back to the header's `internal_name`. Null when neither states one. A
   * second identifier shown beside the canonical name, never a substitute for it.
   */
  internal_name: string | null;
  /** the descriptor's Capacity table (8.33.0) — normalized to rps; null when the descriptor carries none */
  capacity: Capacity | null;
  component_version: string | null;
  architecture_version: string | null;
  last_updated: string | null;
  /** Parsed EXPLORER_HEADER, or null when the file has none (legacy). */
  header: HeaderFields | null;
  /** Per-file findings. Empty means the file is internally consistent. */
  warnings: string[];
  /**
   * True when the fact is a component file of its own. False for a container declared as a row
   * of an L1 descriptor's `## Containers` table (an external system's containers): it has a name,
   * a type, a technology and an owning system, but no file — consumers that need a file per
   * component (the index, the handoff kit, the header check) skip it; consumers that need the
   * tuple (the facts ledger, the scene, the export) resolve it.
   */
  file_backed: boolean;
};

export type StaleRow = {
  /** Component file path the row points at. */
  path: string;
  /** Which of the 5 columns disagrees. */
  column: "#" | "Component" | "Type" | "Technology";
  /** Value currently written in `docs/components/README.md`. */
  index_value: string;
  /** Value in the component file — the source of truth. */
  file_value: string;
};

export type IndexDiff = {
  /** Component files with no row in the index. */
  missing_rows: string[];
  /** Index rows whose file does not exist. */
  orphan_rows: string[];
  /** Rows present in both, disagreeing on at least one column. */
  stale_rows: StaleRow[];
};

/** `**Field:** value` -> `value`. Returns null when the field is absent. */
function field(content: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*(.*?)\\s*$`, "m"));
  if (!match) return null;
  const value = match[1].trim();
  return value === "" ? null : value;
}

/**
 * Holds a `**Description:**` value to its contract and returns the findings, in the `check`
 * vocabulary. Absent on an L2 container is `missing-field`; absent on an L1 descriptor is nothing
 * (the L1 templates carry no tagline — the 30-second summary is its one-liner). Present, it must
 * open with the canonical name as plain text — the name, then the end of the line or a character
 * that is not a letter or digit, so `Payment Services …` does not pass for `Payment Service` — and
 * count at most {@link DESCRIPTION_MAX_CHARS} characters, code points, markup included: backticks
 * around the name would spend the slot and break the prefix at once.
 */
export function checkDescription(
  name: string,
  description: string | null,
  level: "L1" | "L2",
): string[] {
  if (description === null) return level === "L2" ? ["missing-field: **Description:**"] : [];
  const findings: string[] = [];
  const chars = [...description].length;
  if (chars > DESCRIPTION_MAX_CHARS) {
    findings.push(
      `description-too-long: ${chars} characters (cap ${DESCRIPTION_MAX_CHARS}) — a fixed-width slot; move the detail to Purpose`,
    );
  }
  if (name && !opensWithName(description, name)) {
    const shown = [...description].slice(0, 48).join("");
    findings.push(
      `description-name-prefix: must open with the canonical name "${name}" as plain text — reads "${shown}${chars > 48 ? "…" : ""}"`,
    );
  }
  return findings;
}

/** `Payment Service handles …` opens with `Payment Service`; `Payment Services …` and `` `Payment Service` … `` do not. */
function opensWithName(description: string, name: string): boolean {
  if (!description.startsWith(name)) return false;
  const next = [...description.slice(name.length)][0] ?? "";
  return next === "" || !/[\p{L}\p{N}]/u.test(next);
}

/**
 * `[Spring Boot 3.2, PostgreSQL 16]` -> `["Spring Boot 3.2", "PostgreSQL 16"]`.
 * Handles the bracketed IcePanel form, the bare form, and per-item brackets.
 */
export function parseTechnology(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim().replace(/^\[+/, "").replace(/\]+$/, "").trim())
    .filter(Boolean);
}

/** Renders a technology list back into the README's IcePanel bracket form. */
export function formatTechnology(tech: string[]): string {
  return tech.length ? `[${tech.join(", ")}]` : "";
}

/** `03-payment-service.md` -> `payment-service`; `payments.md` -> `payments`. */
export function slugFromFilename(basename: string): string {
  return basename.replace(/\.md$/, "").replace(/^\d+-/, "");
}

function basenameOf(posixPath: string): string {
  const parts = posixPath.split("/");
  return parts[parts.length - 1];
}

/**
 * Reads every component file under `docs/components/` and returns one fact
 * per file, sorted by path. Returns an empty array when the directory is
 * absent — callers fail open rather than aborting.
 */
export function listComponents(projectRoot: string): ComponentFact[] {
  const componentDocs = listDocFiles(projectRoot).filter((d) =>
    d.path.startsWith("docs/components/"),
  );
  const systemFolders = new Set(
    componentDocs
      .map((d) => d.path.slice("docs/components/".length).split("/"))
      .filter((segments) => segments.length > 1)
      .map((segments) => segments[0]),
  );

  const facts = componentDocs.map((doc) => factFor(projectRoot, doc.path, systemFolders));
  // an L1 descriptor's `## Containers` table declares the containers of a system that has no folder —
  // one fact per row, owned by the descriptor's system, not file-backed
  // a row that restates a file-backed container (an internal system's descriptor lists its own files) adds nothing
  const known = new Set(facts.filter((f) => f.level === "L2").map((f) => normName(f.name)));
  for (const fact of facts.filter((f) => f.level === "L1")) {
    const content = readFileSync(resolve(projectRoot, fact.path), "utf-8").replace(/\r\n?/g, "\n");
    for (const row of tableContainers(content)) {
      if (known.has(normName(row.name))) continue;
      known.add(normName(row.name));
      facts.push({
        path: fact.path, system: fact.system, level: "L2", index: null, name: row.name, slug: slugOfName(row.name),
        type: row.type, type_canonical: (CANONICAL_L2_TYPES as readonly string[]).includes(row.type), technology: parseTechnology(row.technology), description: null,
        internal_name: row.internal_name, capacity: null, component_version: null, architecture_version: null, last_updated: null, header: null, warnings: [], file_backed: false,
      });
    }
  }
  return facts;
}

/** Accent- and case-insensitive name key, for matching a table row against a file-backed fact. */
function normName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** `API Order Account` -> `api-order-account`. */
export function slugOfName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** The rows of the first table under `## Containers` / `## Contenedores` — component, type, technology, internal name. */
/**
 * An internal name as stated, or null when the cell is empty or a placeholder: an HTML comment is
 * an authoring note, never part of the value, and "Sin declarar" / "Not declared" / "Not documented"
 * say there is none (the reference project's `**Internal Name:** Sin declarar <!-- TODO … -->` was
 * printed verbatim by the command center).
 */
export function internalValue(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const v = String(raw).replace(/<!--[\s\S]*?-->/g, "").trim().replace(/^`+|`+$/g, "").trim();
  if (!v || /^(sin declarar|no declarado|not declared|not documented|no documentado|n\/a|tbd|—|-)$/i.test(v)) return null;
  return v;
}

export function tableContainers(content: string): { name: string; type: string; technology: string; internal_name: string | null }[] {
  const lines = content.split("\n");
  const start = lines.findIndex((l) => /^##\s+(Containers|Contenedores)\b/i.test(l));
  if (start < 0) return [];
  const out: { name: string; type: string; technology: string; internal_name: string | null }[] = [];
  let headers: string[] | null = null;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^##\s/.test(l)) break;
    if (!/^\|/.test(l)) { if (headers && out.length) break; continue; }
    const cells = l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (!headers) { headers = cells.map((c) => c.toLowerCase()); continue; }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const col = (names: string[]) => headers!.findIndex((h) => names.some((n) => h.startsWith(n)));
    const iN = col(["component", "componente", "container", "contenedor"]), iT = col(["type", "tipo"]), iTech = col(["technology", "tecnolog"]), iI = col(["internal name", "nombre interno", "internal"]);
    const name = (cells[iN >= 0 ? iN : 0] ?? "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^`|`$/g, "").replace(/\*\*/g, "").trim();   // a link to the container's file is the name, not a name of its own
    if (!name) continue;
    out.push({ name, type: (iT >= 0 ? cells[iT] : "") ?? "", technology: (iTech >= 0 ? cells[iTech] : "") ?? "", internal_name: iI >= 0 ? internalValue(cells[iI]) : null });
  }
  return out;
}

function factFor(
  projectRoot: string,
  relPath: string,
  systemFolders: Set<string>,
): ComponentFact {
  const content = readFileSync(resolve(projectRoot, relPath), "utf-8").replace(/\r\n?/g, "\n");
  const basename = basenameOf(relPath);
  const segments = relPath.slice("docs/components/".length).split("/");
  const inFolder = segments.length > 1;
  const warnings: string[] = [];

  const looksL2 = /^\d+-/.test(basename);
  const declaredLevel = field(content, "C4 Level");
  let level: "L1" | "L2" = looksL2 ? "L2" : "L1";
  if (declaredLevel) {
    const declared: "L1" | "L2" = /\bL1\b|System/i.test(declaredLevel) ? "L1" : "L2";
    if (declared !== level) {
      warnings.push(
        `level-conflict: filename implies ${level} but **C4 Level:** says "${declaredLevel}" — filename wins`,
      );
    }
  }
  // A non-prefixed file at the components/ root is only an L1 descriptor when a
  // matching system folder exists. Without one it is a legacy flat container.
  if (!looksL2 && !inFolder && !systemFolders.has(slugFromFilename(basename))) {
    level = "L2";
  }
  // a descriptor typed as a System (`**Type:** External System`) is a system wherever it sits — never a container
  if (!looksL2 && /\bsystem\b/i.test(field(content, "Type") ?? "")) level = "L1";

  const system = inFolder ? segments[0] : level === "L1" ? slugFromFilename(basename) : null;
  const indexMatch = basename.match(/^(\d+)-/);
  const index = level === "L2" && indexMatch ? `5.${parseInt(indexMatch[1], 10)}` : null;
  if (level === "L2" && !indexMatch) {
    warnings.push("missing-index-prefix: filename has no NN- prefix, so the index number is positional");
  }

  const header = hasExplorerHeader(content) ? parseHeader(content) : null;
  if (!header) warnings.push("missing-header: no EXPLORER_HEADER block");

  const name = extractH1(content);
  if (!name) warnings.push("missing-field: H1 (canonical component name)");

  const type = field(content, "Type") ?? "";
  if (!type) warnings.push("missing-field: **Type:**");
  const type_canonical =
    level === "L2" && (CANONICAL_L2_TYPES as readonly string[]).includes(type);
  if (level === "L2" && type && !type_canonical) {
    warnings.push(`non-canonical-type: "${type}" is not one of the 8 C4 L2 types`);
  }
  // Known conflict with the SA Design Language Standard (nightly check C-14):
  // API gateways belong at Deployment altitude, never Container. Report it and
  // let the architect rule — never reclassify silently.
  if (level === "L2" && type === "Gateway") {
    warnings.push(
      "gateway-at-l2: SA Design Language Standard places API gateways at Deployment altitude only, named in the `Via` of each connection they front (§5.9, check C-14); a layer whose own code composes or orchestrates is a Container — retype it",
    );
  }

  const technology = parseTechnology(field(content, "Technology"));
  if (level === "L2" && technology.length === 0) {
    warnings.push("missing-field: **Technology:**");
  }

  // the tagline — the name first, 120 characters at most, on every container (8.64.0)
  const description = field(content, "Description");
  checkDescription(name, description, level).forEach((w) => warnings.push(w));

  const bodyInternal = internalValue(field(content, "Internal Name"));
  const headerInternal = internalValue(header?.internal_name);
  const internal_name = bodyInternal ?? headerInternal;
  if (bodyInternal && headerInternal && bodyInternal !== headerInternal) {
    warnings.push(
      `internal-name-mismatch: header "${headerInternal}" vs **Internal Name:** "${bodyInternal}"`,
    );
  }

  // the Capacity table — absent is not a defect (pre-8.33.0 descriptors); a malformed one is
  const capacity = parseCapacity(content);
  if (capacity) capacity.warnings.forEach((w) => warnings.push(w));

  const filenameSlug = slugFromFilename(basename);
  const slug = header?.component_self ?? filenameSlug;
  if (header?.component_self && header.component_self !== filenameSlug) {
    warnings.push(
      `slug-mismatch: component_self "${header.component_self}" vs filename slug "${filenameSlug}"`,
    );
  }

  if (header?.technologies?.length && technology.length) {
    const headerTech = header.technologies.map((t) => t.toLowerCase()).sort().join("|");
    const bodyTech = technology.map((t) => t.toLowerCase()).sort().join("|");
    if (headerTech !== bodyTech) {
      warnings.push(
        `technology-mismatch: header "${header.technologies.join(", ")}" vs **Technology:** "${technology.join(", ")}"`,
      );
    }
  }

  return {
    path: relPath,
    system,
    level,
    index,
    name,
    slug,
    type,
    type_canonical,
    technology,
    description,
    internal_name,
    capacity,
    component_version: field(content, "Component Version"),
    architecture_version: field(content, "Architecture Version"),
    last_updated: field(content, "Last Updated"),
    header,
    warnings,
    file_backed: true,
  };
}

type IndexRow = {
  index: string;
  component: string;
  file: string;
  type: string;
  technology: string;
};

/**
 * Parses the 5-column table rows out of `docs/components/README.md`.
 * Tolerant of grouped system headers and of surrounding prose.
 */
export function parseIndexRows(readmeContent: string): IndexRow[] {
  const rows: IndexRow[] = [];
  for (const line of readmeContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) continue;
    const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
    if (cells.length !== 5) continue;
    // Skip the header row and the `|---|---|` separator; keep everything else,
    // including a row whose `#` cell is malformed — that is a finding, not noise.
    if (cells[0] === "#" || /^:?-{2,}:?$/.test(cells[0])) continue;
    if (cells[1] === "Component" || cells[1] === "") continue;
    rows.push({
      index: cells[0],
      component: cells[1],
      file: cells[2],
      type: cells[3],
      technology: cells[4],
    });
  }
  return rows;
}

/** Pulls the link target out of `[01-x.md](payments/01-x.md)`; bare text passes through. */
function linkTarget(cell: string): string {
  const match = cell.match(/\]\(([^)]+)\)/);
  return (match ? match[1] : cell).trim();
}

/**
 * Compares `docs/components/README.md` against the component files it indexes.
 * L1 descriptors are excluded by design — they are linked from the system
 * headers, never indexed as rows.
 */
export function diffIndex(projectRoot: string): IndexDiff {
  const facts = listComponents(projectRoot).filter((f) => f.level === "L2" && f.file_backed);
  const readmeAbs = resolve(projectRoot, "docs", "components", "README.md");
  if (!existsSync(readmeAbs)) {
    return { missing_rows: facts.map((f) => f.path), orphan_rows: [], stale_rows: [] };
  }

  const rows = parseIndexRows(readFileSync(readmeAbs, "utf-8").replace(/\r\n?/g, "\n"));
  const byPath = new Map(facts.map((f) => [f.path, f]));
  const matched = new Set<string>();
  const orphan_rows: string[] = [];
  const stale_rows: StaleRow[] = [];

  for (const row of rows) {
    const target = toPosix(linkTarget(row.file)).replace(/^\.\//, "");
    const fullPath = `docs/components/${target}`;
    const fact = byPath.get(fullPath);
    if (!fact) {
      orphan_rows.push(row.file);
      continue;
    }
    matched.add(fullPath);
    const columns: Array<[StaleRow["column"], string, string]> = [
      ["Component", row.component, fact.name],
      ["Type", row.type, fact.type],
      ["Technology", row.technology, formatTechnology(fact.technology)],
    ];
    // A file with no NN- prefix has no authoritative index number — the row's
    // value is positional, so there is nothing to compare it against.
    if (fact.index !== null) columns.unshift(["#", row.index, fact.index]);
    for (const [column, index_value, file_value] of columns) {
      if (index_value !== file_value) {
        stale_rows.push({ path: fact.path, column, index_value, file_value });
      }
    }
  }

  return {
    missing_rows: facts.filter((f) => !matched.has(f.path)).map((f) => f.path),
    orphan_rows,
    stale_rows,
  };
}

/**
 * Renders the component index body — the exact markdown the guardian writes
 * between the intro paragraph and `## Key Relationships`. Grouped by system,
 * with a `### [Name](system.md)` header per group per the fixed format spec.
 */
export function renderIndex(projectRoot: string): string {
  const all = listComponents(projectRoot);
  const containers = all.filter((f) => f.level === "L2" && f.file_backed);
  const descriptors = new Map(
    all.filter((f) => f.level === "L1").map((f) => [f.system ?? "", f]),
  );

  const head =
    "| # | Component | File | Type | Technology |\n|---|-----------|------|------|------------|";
  const groups = new Map<string | null, ComponentFact[]>();
  for (const fact of containers) {
    const bucket = groups.get(fact.system);
    if (bucket) bucket.push(fact);
    else groups.set(fact.system, [fact]);
  }

  const ordered = [...groups.keys()].sort((a, b) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return a.localeCompare(b);
  });

  const blocks: string[] = [];
  // Positional numbers start past the highest explicit NN- prefix so a legacy
  // unprefixed file never collides with a prefixed one.
  let positional = containers.reduce((max, fact) => {
    const n = fact.index ? parseInt(fact.index.split(".")[1], 10) : 0;
    return n > max ? n : max;
  }, 0);
  for (const system of ordered) {
    const rows = (groups.get(system) ?? []).map((fact) => {
      const base = basenameOf(fact.path);
      const file = system ? `[${base}](${system}/${base})` : `[${base}](${base})`;
      // A file with no NN- prefix still needs a `#` cell — the column is fixed
      // by the format spec — so fall back to the next free number.
      const num = fact.index ?? `5.${++positional}`;
      return `| ${num} | ${fact.name} | ${file} | ${fact.type} | ${formatTechnology(fact.technology)} |`;
    });
    if (system) {
      const display = descriptors.get(system)?.name || system;
      blocks.push(`### [${display}](${system}.md)\n\n${head}\n${rows.join("\n")}`);
    } else {
      blocks.push(`${head}\n${rows.join("\n")}`);
    }
  }

  return blocks.join("\n\n");
}

/**
 * The whole `docs/components/README.md`, by code (8.90.0) — the Format Specification's lines in order:
 * the managed-by line, the breadcrumb, `# Component Details`, one intro line, a `## <System> Components`
 * section per internal system holding its `renderIndex` block, the external systems as links to their L1
 * descriptors, `## Key Relationships` from the integrations of docs/05 (From → To · protocol, retired rows
 * left out), and `## Related Documentation` from the H1 of the section files that exist. No sentence here
 * needs judgement, so no model writes it: the guardian's `sync` and a Workflow 1 segment-runner call
 * `component-cli.ts readme <root> --write`, and the guardian skill no longer has to be loaded to write it.
 */
export function renderReadme(projectRoot: string, lang: "en" | "es" = "en"): string {
  const all = listComponents(projectRoot);
  const l1 = all.filter((f) => f.level === "L1");
  const external = (f: ComponentFact) => /external/i.test(f.type);
  const internal = l1.filter((f) => !external(f));
  const outside = l1.filter(external);
  const es = lang === "es";
  const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${es ? "y" : "and"} ${xs[xs.length - 1]}`);

  // renderIndex's blocks, keyed by the system slug their `### [Name](slug.md)` header links to
  const blocks = new Map<string, string>();
  for (const b of renderIndex(projectRoot).split(/\n\n(?=### \[)/)) {
    const m = b.match(/^### \[[^\]]*\]\(([^)]+)\.md\)/);
    blocks.set(m ? m[1] : "", b);
  }

  const out = [
    "<!-- managed by sa-skills:architecture-component-guardian — do not edit manually -->",
    "[Architecture](../../ARCHITECTURE.md) > Components",
    "",
    "# Component Details",
    "",
    es
      ? `Índice de los contenedores C4 de nivel 2 de ${list(internal.map((f) => f.name)) || "la arquitectura"}.${outside.length ? " Los sistemas externos se documentan como descriptores de nivel 1, enlazados abajo." : ""}`
      : `Index of the C4 Level 2 containers of ${list(internal.map((f) => f.name)) || "the architecture"}.${outside.length ? " External systems are documented as Level 1 descriptors, linked below." : ""}`,
  ];
  const seen = new Set<string>();
  for (const sys of internal) {
    const slug = sys.system ?? "";
    const block = blocks.get(slug);
    if (!block) continue;
    seen.add(slug);
    out.push("", `## ${sys.name} Components`, "", block);
  }
  for (const [slug, block] of blocks) if (!seen.has(slug) && slug !== "" && !outside.some((f) => f.system === slug)) out.push("", block);
  if (blocks.has("")) out.push("", blocks.get("")!);   // flat, pre-C4 files
  if (outside.length) {
    out.push("", es ? "### Sistemas externos" : "### External Systems", "");
    for (const f of outside) out.push(`- [${f.name}](${basenameOf(f.path)})`);
  }

  const rel = relationships(projectRoot);
  out.push("", "## Key Relationships", "");
  out.push(...(rel.length ? rel.map((r) => `- ${r.from} → ${r.to} · ${r.protocol}`) : [es ? "- Sin integraciones documentadas en docs/05." : "- No integrations documented in docs/05."]));

  out.push("", "## Related Documentation", "");
  const docsDir = resolve(projectRoot, "docs");
  const related = ["01", "03", "05", "10"].map((nn) => {
    try {
      const f = require("fs").readdirSync(docsDir).find((x: string) => x.startsWith(nn + "-") && x.endsWith(".md"));
      if (!f) return null;
      const h1 = (readFileSync(resolve(docsDir, f), "utf8").match(/^#\s+(.+)$/m) || [])[1];
      return `- [${(h1 || f).replace(/<!--.*?-->/g, "").trim()}](../${f})`;
    } catch { return null; }
  }).filter(Boolean) as string[];
  out.push(...related);
  return out.join("\n") + "\n";
}

/** The integrations of docs/05 as From / To / Protocol, by the table's own header; retired rows left out. */
function relationships(projectRoot: string): { from: string; to: string; protocol: string }[] {
  const file = resolve(projectRoot, "docs", "05-integration-points.md");
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").replace(/\r\n?/g, "\n").split("\n");
  const out: { from: string; to: string; protocol: string }[] = [];
  let cols: string[] | null = null;
  const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const clean = (c: string) => c.replace(/`/g, "").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
  for (const l of lines) {
    if (!l.trim().startsWith("|")) { cols = null; continue; }
    const c = cells(l);
    if (!cols) { cols = c.map((x) => x.toLowerCase()); continue; }
    if (/^:?-{2,}/.test(c[0] || "")) continue;
    const at = (name: RegExp) => cols!.findIndex((x) => name.test(x));
    const iId = at(/^#$|^id$/), iF = at(/^from$|^origen$|^desde$/), iT = at(/^to$|^destino$|^hacia$/), iP = at(/^protocol|^protocolo/);
    if (iF < 0 || iT < 0) continue;
    if (iId >= 0 && !/^I-\d+/.test(clean(c[iId] || ""))) continue;
    if (/~~|retired|retirad/i.test(l)) continue;
    out.push({ from: clean(c[iF] || ""), to: clean(c[iT] || ""), protocol: iP >= 0 ? clean(c[iP] || "") : "" });
  }
  return out;
}

/**
 * The read CLI — the component tuple as JSON, for a skill outside the component guardian's category:
 *   bun scripts/shared/component-facts.ts list <project_root>
 * Same output as `component-cli.ts list`; a project without docs/components/ is an empty list, not an error.
 * The guardian's `component-cli.ts` keeps `index`, `readme` and `check`.
 */
if (import.meta.main) {
  const [, , sub, root] = process.argv;
  if (sub !== "list" || !root) { console.error("usage: bun component-facts.ts list <project_root>"); process.exit(2); }
  if (!existsSync(root)) { console.error(`component-facts: project_root does not exist: ${root}`); process.exit(2); }
  console.log(JSON.stringify(existsSync(resolve(root, "docs", "components")) ? listComponents(root) : [], null, 2));
}
