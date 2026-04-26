/**
 * EXPLORER_HEADER fast-path for handoff-component classification.
 *
 * When the dev-handoff orchestrator targets exactly one C4-L2 component
 * and that component file already carries an authoritative `<!-- EXPLORER_HEADER -->`
 * block (required since v3.14.0), the explorer agent can skip per-ADR LLM
 * scoring entirely. The header's `related_adrs:` list is the same answer the
 * scoring loop would produce — generated/curated by the architect, refreshed
 * by the architecture-explorer-headers skill.
 *
 * This module:
 *   1. Parses the EXPLORER_HEADER from the named component file (reusing the
 *      existing `parseHeader` from architecture-explorer-headers/utils).
 *   2. Resolves each `related_adrs` entry (e.g. "ADR-118") to its repo-relative
 *      path under `adr/` via filesystem glob.
 *   3. Reads `required_sections[]` from the handoff-component config.
 *   4. Synthesizes an EXPLORE_RESULT YAML block in the exact shape that
 *      `parse-explore-result.ts` validates (status: OK, cache_hit: false,
 *      `metadata.shortcut: header` for telemetry).
 *
 * The shortcut is invoked by the explorer agent only when the orchestrator
 * passes a `component_file` input parameter (single-component scope). When
 * absent, malformed, or any step fails, the agent falls through to the
 * normal per-candidate scoring path.
 *
 * @module handoff-shortcut
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, resolve } from "path";
import { parseHeader } from "../../architecture-explorer-headers/utils/header-detector";

export type ShortcutInput = {
  componentFile: string;       // absolute path to the single component .md
  configPath: string;          // absolute path to handoff-component.json
  projectRoot: string;         // absolute path to project root
  taskType: string;            // typically "handoff-component"
  inputsHash: string;          // computed by inputs-hash CLI
};

export type ShortcutOutcome =
  | { ok: true; resultYaml: string; resolvedAdrs: string[]; adrsRequested: string[] }
  | { ok: false; reason: string };

export function synthesizeHandoffShortcut(input: ShortcutInput): ShortcutOutcome {
  const { componentFile, configPath, projectRoot, taskType, inputsHash } = input;

  if (!existsSync(componentFile)) {
    return { ok: false, reason: `component file does not exist: ${componentFile}` };
  }

  const componentBytes = readFileSync(componentFile, "utf-8");
  const header = parseHeader(componentBytes);
  if (!header) {
    return { ok: false, reason: "component file has no EXPLORER_HEADER block" };
  }
  if (!header.related_adrs || header.related_adrs.length === 0) {
    return { ok: false, reason: "EXPLORER_HEADER has empty related_adrs[]" };
  }

  const config = readConfig(configPath);
  if (!config) {
    return { ok: false, reason: `config not found or unparseable: ${configPath}` };
  }

  const requiredSections = (config.required_sections ?? [])
    .map((s) => s.file)
    .filter((f) => existsSync(resolve(projectRoot, f)));

  const adrIndex = buildAdrIndex(projectRoot);
  const resolvedAdrs: string[] = [];
  const unresolvedAdrs: string[] = [];
  for (const id of header.related_adrs) {
    const path = adrIndex.get(normalizeAdrId(id));
    if (path) {
      resolvedAdrs.push(path);
    } else {
      unresolvedAdrs.push(id);
    }
  }

  // Add the component file itself to relevant_files (it's the target of the
  // handoff and the dev-handoff context-builder always slices it).
  const componentRel = relative(projectRoot, componentFile);

  // Build the relevant_files set: dedupe required sections + resolved ADRs +
  // the component file. Required sections always lead.
  const relevantPaths: string[] = [];
  const seen = new Set<string>();
  for (const path of [...requiredSections, ...resolvedAdrs, componentRel]) {
    if (!seen.has(path)) {
      seen.add(path);
      relevantPaths.push(path);
    }
  }

  const archMd = resolve(projectRoot, "ARCHITECTURE.md");
  const meta = extractArchitectureMetadata(archMd);
  const docInventory = inventoryDocs(projectRoot);

  const resultYaml = renderYaml({
    taskType,
    taskFamily: "handoff",
    inputsHash,
    configPath,
    componentRel,
    relevantPaths,
    requiredCount: requiredSections.length,
    resolvedAdrCount: resolvedAdrs.length,
    unresolvedAdrIds: unresolvedAdrs,
    headerKeyConcepts: header.key_concepts ?? [],
    headerTechnologies: header.technologies ?? [],
    headerScope: header.scope ?? "",
    metadata: meta,
    docInventory,
  });

  return {
    ok: true,
    resultYaml,
    resolvedAdrs,
    adrsRequested: header.related_adrs,
  };
}

type Config = {
  required_sections?: Array<{ file: string }>;
};

function readConfig(configPath: string): Config | null {
  try {
    return JSON.parse(readFileSync(configPath, "utf-8")) as Config;
  } catch {
    return null;
  }
}

function normalizeAdrId(raw: string): string {
  // "ADR-118" / "adr-118" / "ADR-0118" → "ADR-118"
  const m = raw.trim().match(/^[Aa][Dd][Rr]-0*(\d+)$/);
  if (!m) return raw.trim().toUpperCase();
  return `ADR-${m[1]}`;
}

function buildAdrIndex(projectRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  const adrDir = resolve(projectRoot, "adr");
  if (!existsSync(adrDir)) return out;
  let entries: string[];
  try {
    entries = readdirSync(adrDir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (!name.endsWith(".md")) continue;
    const m = name.match(/^[Aa][Dd][Rr]-0*(\d+)/);
    if (!m) continue;
    const id = `ADR-${m[1]}`;
    out.set(id, `adr/${name}`);
  }
  return out;
}

function extractArchitectureMetadata(archMdPath: string): {
  architecture_version: string;
  architecture_status: string | undefined;
  doc_language: string;
} {
  if (!existsSync(archMdPath)) {
    return { architecture_version: "unversioned", architecture_status: undefined, doc_language: "en" };
  }
  const head = readFileSync(archMdPath, "utf-8").slice(0, 4096);
  const ver = head.match(/<!--\s*ARCHITECTURE_VERSION:\s*(\S+)\s*-->/);
  const status = head.match(/<!--\s*ARCHITECTURE_STATUS:\s*(\S+)\s*-->/);
  const lang = head.match(/<!--\s*ARCHITECTURE_LANGUAGE:\s*(\S+)\s*-->/);
  return {
    architecture_version: ver ? ver[1]! : "unversioned",
    architecture_status: status ? status[1]! : undefined,
    doc_language: lang ? lang[1]! : "en",
  };
}

function inventoryDocs(projectRoot: string): {
  architecture_md: boolean;
  docs_dir_files: number;
  components: number;
  adrs: number;
} {
  const archMd = existsSync(resolve(projectRoot, "ARCHITECTURE.md"));
  const docsDirFiles = countMd(resolve(projectRoot, "docs"), false);
  const components = countMd(resolve(projectRoot, "docs/components"), true);
  const adrs = countMd(resolve(projectRoot, "adr"), false);
  return { architecture_md: archMd, docs_dir_files: docsDirFiles, components, adrs };
}

function countMd(dir: string, recursive: boolean): number {
  if (!existsSync(dir)) return 0;
  let n = 0;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return 0;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory() && recursive) {
      n += countMd(p, true);
    } else if (st.isFile() && name.endsWith(".md") && name !== "README.md") {
      n++;
    }
  }
  return n;
}

function renderYaml(args: {
  taskType: string;
  taskFamily: string;
  inputsHash: string;
  configPath: string;
  componentRel: string;
  relevantPaths: string[];
  requiredCount: number;
  resolvedAdrCount: number;
  unresolvedAdrIds: string[];
  headerKeyConcepts: string[];
  headerTechnologies: string[];
  headerScope: string;
  metadata: ReturnType<typeof extractArchitectureMetadata>;
  docInventory: ReturnType<typeof inventoryDocs>;
}): string {
  const filesScanned = args.requiredCount + args.resolvedAdrCount + 1; // +1 for component file
  const lines: string[] = [];
  lines.push("schema_version: 1");
  lines.push("status: OK");
  lines.push(`task_type: ${args.taskType}`);
  lines.push(`task_family: ${args.taskFamily}`);
  lines.push(`generated_at: ${new Date().toISOString()}`);
  lines.push(`cache_key: ${args.inputsHash}`);
  lines.push(`inputs_hash: ${args.inputsHash}`);
  lines.push(`config_path: ${args.configPath}`);
  lines.push("cache_hit: false");
  lines.push("");
  lines.push("metadata:");
  lines.push(`  architecture_version: ${args.metadata.architecture_version}`);
  if (args.metadata.architecture_status) {
    lines.push(`  architecture_status: ${args.metadata.architecture_status}`);
  }
  lines.push(`  doc_language: ${args.metadata.doc_language}`);
  lines.push(`  shortcut: header`);
  lines.push(`  shortcut_component: ${args.componentRel}`);
  if (args.unresolvedAdrIds.length > 0) {
    lines.push(`  shortcut_unresolved_adrs: [${args.unresolvedAdrIds.join(", ")}]`);
  }
  lines.push("  doc_inventory:");
  lines.push(`    architecture_md: ${args.docInventory.architecture_md}`);
  lines.push(`    docs_dir_files: ${args.docInventory.docs_dir_files}`);
  lines.push(`    components: ${args.docInventory.components}`);
  lines.push(`    adrs: ${args.docInventory.adrs}`);
  lines.push("");
  lines.push("relevant_files:");
  for (const path of args.relevantPaths) {
    const isComponent = path === args.componentRel;
    const reason = isComponent
      ? "component_target"
      : path.startsWith("adr/")
        ? "header_related_adr"
        : "required_section";
    lines.push(`  - path: ${path}`);
    lines.push(`    score: 1.00`);
    lines.push(`    reason: ${reason}`);
    lines.push(`    matched_sections: []`);
  }
  lines.push("");
  lines.push("irrelevant_files: []");
  lines.push("");
  lines.push("gaps: []");
  lines.push("");
  lines.push("stats:");
  lines.push(`  files_scanned: ${filesScanned}`);
  lines.push(`  files_relevant: ${args.relevantPaths.length}`);
  lines.push(`  files_irrelevant: 0`);
  lines.push(`  bytes_skipped_estimate: 0`);
  return lines.join("\n") + "\n";
}
