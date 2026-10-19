/**
 * handoffs/.manifest.json — v4 (handoff kit) schema.
 *
 * The manifest is a per-project record of which parts of the four-part
 * handoff kit (System Runtime View, Cross-Cutting Standards, per-edge Interface Contracts, per-component
 * Component Specifications) have been generated and the SHA-256 of the payload that
 * produced each one. Skip-if-unchanged uses payload_hash + template_version
 * per part so a single seam or Component Specification regenerates without touching the
 * shared docs. The section and field names keep the kit's internal vocabulary
 * (run.ekonte_hash / settei_hash, seams, cut_sheets); only the files on disk
 * carry the architecture names.
 *
 * v3 manifests (the 3.x kit — SYSTEM_EKONTE.md, SETTEI.md, seams/, cut-sheets/)
 * are auto-migrated on load: file paths move to the 4.0.0 layout and every
 * hash is marked stale, so the whole kit regenerates into the new files.
 * v1 (legacy dev-handoff, pre-v3.0.0) and v2 (unused, reserved) manifests
 * are auto-migrated by treating their per-slug entries as
 * `cut_sheets[<slug>]` and forcing REGEN on all of them.
 *
 * Hash inputs:
 *   sha256( payload_text_without_stamps + "\n--TEMPLATE--\n" + template_version )
 * The stamps — architecture_version, **Architecture Version:**, generation_date, architecture_md_path — are left out (10.8.2): a part
 * unchanged but for them is kept, its version row restamped by code.
 *
 * @module manifest
 */
import { createHash } from "crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { mkdirSync } from "fs";
// sa-skills' date helper, found through sa-delivery's locator: an installed sa-delivery is not inside sa-skills
const { fromSaSkills } = require("../../../scripts/sa-skills.js");
const { getLocalDateString } = require(fromSaSkills("scripts", "shared", "date-utils.ts")) as { getLocalDateString: (d?: Date) => string };

export const MANIFEST_VERSION = "4";
/** The 3.x kit's manifest version — same sections, Ekonte-named files on disk. */
const MANIFEST_VERSION_V3 = "3";
const stale = (hash: string | undefined) => `stale:${hash ?? "unknown"}`;

/** Section keys inside a v3 manifest that hold hashed content. */
export type ManifestSection = "run" | "seams" | "cut_sheets";

/** Component Specification entry — per-component. */
export type CutSheetEntry = {
  payload_hash: string;
  template_version: string;
  schema_version: string;
  architecture_version: string | null;
  cut_sheet_file: string; // e.g. "components/01-api-gateway.md"
  assets: string[];
  doc_language: string;
  generated: string;
};

/** Seam entry — per-edge, key is "<upstream>→<downstream>". */
export type SeamEntry = {
  payload_hash: string;
  template_version: string;
  schema_version: string;
  seam_file: string; // e.g. "interfaces/api-gateway→auth-service.md"
  related_adrs: string[];
  generated: string;
};

/**
 * Run-level entry — one per manifest. Holds hashes for the two shared
 * documents (SYSTEM_RUNTIME_VIEW.md and CROSS_CUTTING_STANDARDS.md) that are regenerated
 * atomically from the run-payload.
 */
export type RunEntry = {
  ekonte_hash: string;
  ekonte_template_version: string;
  settei_hash: string;
  settei_template_version: string;
  schema_version: string;
  architecture_version: string | null;
  generated: string;
};

export type Manifest = {
  version: string;
  generator: string;
  generator_version: string;
  run: RunEntry | null;
  seams: Record<string, SeamEntry>;
  cut_sheets: Record<string, CutSheetEntry>;
};

export function emptyManifest(generatorVersion: string): Manifest {
  return {
    version: MANIFEST_VERSION,
    generator: "sa-skills:architecture-dev-handoff",
    generator_version: generatorVersion,
    run: null,
    seams: {},
    cut_sheets: {},
  };
}

/**
 * Load and migrate a manifest file.
 *
 * v3 shape is returned as-is. v1/v2 shapes are auto-migrated: legacy
 * `components: { <slug>: {...} }` maps become `cut_sheets: { <slug>: {...} }`
 * with all entries marked stale (payload_hash prefixed with `stale:`) so
 * every component regenerates on the next run — the v2→v3 layout change
 * (components/ subdirectory + new template) means old cache entries are
 * never reusable.
 */
export function loadManifest(path: string, generatorVersion: string): Manifest {
  if (!existsSync(path)) return emptyManifest(generatorVersion);
  try {
    const raw = readFileSync(path, "utf-8").replace(/\r\n?/g, "\n");
    const parsed = JSON.parse(raw) as {
      version?: string;
      generator?: string;
      generator_version?: string;
      run?: RunEntry | null;
      seams?: Record<string, SeamEntry>;
      cut_sheets?: Record<string, CutSheetEntry>;
      components?: Record<
        string,
        Omit<CutSheetEntry, "cut_sheet_file"> & { handoff_file?: string }
      >;
    };

    if (parsed.version === MANIFEST_VERSION) {
      return {
        version: parsed.version,
        generator: parsed.generator ?? "sa-skills:architecture-dev-handoff",
        generator_version: parsed.generator_version ?? generatorVersion,
        run: parsed.run ?? null,
        seams: parsed.seams ?? {},
        cut_sheets: parsed.cut_sheets ?? {},
      };
    }

    // v3 — the 3.x kit. Same sections; the files moved (SYSTEM_EKONTE.md →
    // SYSTEM_RUNTIME_VIEW.md, SETTEI.md → CROSS_CUTTING_STANDARDS.md, seams/ →
    // interfaces/, cut-sheets/ → components/). Point every entry at the new
    // path and mark it stale so each part regenerates there; the orchestrator
    // removes the old file once its counterpart is written.
    if (parsed.version === MANIFEST_VERSION_V3) {
      const seams: Record<string, SeamEntry> = {};
      for (const [key, entry] of Object.entries(parsed.seams ?? {})) {
        seams[key] = {
          ...entry,
          payload_hash: stale(entry.payload_hash),
          seam_file: (entry.seam_file ?? `seams/${key}.md`).replace(/^seams\//, "interfaces/"),
        };
      }
      const cut_sheets: Record<string, CutSheetEntry> = {};
      for (const [slug, entry] of Object.entries(parsed.cut_sheets ?? {})) {
        cut_sheets[slug] = {
          ...entry,
          payload_hash: stale(entry.payload_hash),
          cut_sheet_file: (entry.cut_sheet_file ?? `cut-sheets/${slug}.md`).replace(/^cut-sheets\//, "components/"),
        };
      }
      const run = parsed.run
        ? { ...parsed.run, ekonte_hash: stale(parsed.run.ekonte_hash), settei_hash: stale(parsed.run.settei_hash) }
        : null;
      return {
        version: MANIFEST_VERSION,
        generator: parsed.generator ?? "sa-skills:architecture-dev-handoff",
        generator_version: generatorVersion,
        run,
        seams,
        cut_sheets,
      };
    }

    // Legacy v1/v2 — migrate `components[]` into stale `cut_sheets[]`.
    if (parsed.components) {
      const migrated: Record<string, CutSheetEntry> = {};
      for (const [slug, entry] of Object.entries(parsed.components)) {
        migrated[slug] = {
          payload_hash: stale(entry.payload_hash),
          template_version: entry.template_version ?? "unknown",
          schema_version: entry.schema_version ?? "unknown",
          architecture_version: entry.architecture_version ?? null,
          cut_sheet_file: entry.handoff_file ?? `components/${slug}.md`,
          assets: entry.assets ?? [],
          doc_language: entry.doc_language ?? "en",
          generated: entry.generated ?? new Date().toISOString(),
        };
      }
      return {
        version: MANIFEST_VERSION,
        generator: "sa-skills:architecture-dev-handoff",
        generator_version: generatorVersion,
        run: null,
        seams: {},
        cut_sheets: migrated,
      };
    }

    // Unknown shape — fresh empty manifest, forces full regen.
    return emptyManifest(generatorVersion);
  } catch {
    // Corrupt or unparseable — start fresh rather than crash.
    return emptyManifest(generatorVersion);
  }
}

export function saveManifest(path: string, manifest: Manifest): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  renameSync(tmp, path);
}

export function readTemplateVersion(templatePath: string): string {
  const bytes = readFileSync(templatePath, "utf-8").replace(/\r\n?/g, "\n");
  const match = bytes.match(/^<!--\s*TEMPLATE_VERSION:\s*(\S+)\s*-->/m);
  if (!match) {
    throw new Error(
      `TEMPLATE_VERSION marker not found in ${templatePath}. ` +
        "Add `<!-- TEMPLATE_VERSION: X.Y.Z -->` near the top of the template " +
        "and bump it whenever the template's structure or section list changes.",
    );
  }
  return match[1]!;
}

/**
 * The payload's stamps — the architecture version and the date it was cut. A release moves the version in every payload
 * a run on another day moves the date and another checkout the path, while the part's content is the same: hashed, they made every part REGEN, and
 * the model rewrote a whole kit in other words for a release that added one record (10.8.2). The hash leaves them out;
 * a part kept on SKIP gets its Architecture Version row by code (`restampVersion`).
 */
const STAMPS: Array<[RegExp, string]> = [
  [/^architecture_version:.*$/gm, "architecture_version:"],
  [/^\*\*Architecture Version:\*\*.*$/gm, "**Architecture Version:**"],
  [/^generation_date:.*$/gm, "generation_date:"],
  [/^architecture_md_path:.*$/gm, "architecture_md_path:"],   // where the project is checked out, not what it says
];
/** A payload's text without its stamps — what the hash reads, and what an edit's delta compares. */
export function stampFree(text: string): string {
  for (const [re, keep] of STAMPS) text = text.replace(re, keep);
  return text;
}

export function hashPayload(payloadPath: string, templateVersion: string): string {
  const text = stampFree(readFileSync(payloadPath, "utf-8"));
  return `sha256:${createHash("sha256").update(text).update(`\n--TEMPLATE--\n${templateVersion}`).digest("hex")}`;
}

const VERSION_ROW = /^\|\s*(?:\*\*)?(?:Architecture Version|Versi[oó]n de la arquitectura)(?:\*\*)?\s*\|\s*v?\d+\.\d+\.\d+\s*\|/i;
/** A kept part's Architecture Version row moved to the version it is now part of; the text is otherwise unchanged. */
export function restampVersion(src: string, version: string): string {
  return src
    .split("\n")
    .map((l) => (VERSION_ROW.test(l) ? l.replace(/(\|[^|]*\|\s*v?)\d+\.\d+\.\d+/, `$1${version}`) : l))
    .join("\n");
}

export type SkipDecision = {
  skip: boolean;
  reason: string;
};

type ShouldSkipCommon = {
  manifest: Manifest;
  section: ManifestSection;
  payloadHash: string;
  templateVersion: string;
  schemaVersion: string;
  outputFileAbsPath: string;
  force: boolean;
};

type ShouldSkipCutSheet = ShouldSkipCommon & {
  section: "cut_sheets";
  slug: string;
};

type ShouldSkipSeam = ShouldSkipCommon & {
  section: "seams";
  edgeKey: string;
};

type ShouldSkipRun = ShouldSkipCommon & {
  section: "run";
  part: "ekonte" | "settei";
};

export type ShouldSkipArgs = ShouldSkipCutSheet | ShouldSkipSeam | ShouldSkipRun;

export function shouldSkip(args: ShouldSkipArgs): SkipDecision {
  if (args.force) return { skip: false, reason: "--force flag set" };

  if (args.section === "cut_sheets") {
    const entry = args.manifest.cut_sheets[args.slug];
    if (!entry) return { skip: false, reason: "no manifest entry" };
    if (entry.payload_hash !== args.payloadHash) {
      return { skip: false, reason: "payload hash changed" };
    }
    if (entry.template_version !== args.templateVersion) {
      return { skip: false, reason: "template version changed" };
    }
    if (entry.schema_version !== args.schemaVersion) {
      return { skip: false, reason: "payload schema version changed" };
    }
    if (!existsSync(args.outputFileAbsPath)) {
      return { skip: false, reason: "component specification file missing on disk" };
    }
    return { skip: true, reason: "unchanged since last generation" };
  }

  if (args.section === "seams") {
    const entry = args.manifest.seams[args.edgeKey];
    if (!entry) return { skip: false, reason: "no manifest entry" };
    if (entry.payload_hash !== args.payloadHash) {
      return { skip: false, reason: "payload hash changed" };
    }
    if (entry.template_version !== args.templateVersion) {
      return { skip: false, reason: "template version changed" };
    }
    if (entry.schema_version !== args.schemaVersion) {
      return { skip: false, reason: "payload schema version changed" };
    }
    if (!existsSync(args.outputFileAbsPath)) {
      return { skip: false, reason: "seam file missing on disk" };
    }
    return { skip: true, reason: "unchanged since last generation" };
  }

  // section === "run"
  const entry = args.manifest.run;
  if (!entry) return { skip: false, reason: "no manifest entry" };
  const hashField = args.part === "ekonte" ? entry.ekonte_hash : entry.settei_hash;
  const versionField =
    args.part === "ekonte" ? entry.ekonte_template_version : entry.settei_template_version;
  if (hashField !== args.payloadHash) {
    return { skip: false, reason: "payload hash changed" };
  }
  if (versionField !== args.templateVersion) {
    return { skip: false, reason: "template version changed" };
  }
  if (entry.schema_version !== args.schemaVersion) {
    return { skip: false, reason: "payload schema version changed" };
  }
  if (!existsSync(args.outputFileAbsPath)) {
    return { skip: false, reason: `${args.part} file missing on disk` };
  }
  return { skip: true, reason: "unchanged since last generation" };
}

export function updateCutSheetEntry(
  manifest: Manifest,
  slug: string,
  fields: Omit<CutSheetEntry, "generated"> & { generated?: string },
): void {
  manifest.cut_sheets[slug] = {
    ...fields,
    generated: fields.generated ?? new Date().toISOString(),
  };
}

export function updateSeamEntry(
  manifest: Manifest,
  edgeKey: string,
  fields: Omit<SeamEntry, "generated"> & { generated?: string },
): void {
  manifest.seams[edgeKey] = {
    ...fields,
    generated: fields.generated ?? new Date().toISOString(),
  };
}

/**
 * Update the run-level entry (Runtime View + Cross-Cutting Standards atomic pair). Either side
 * may be omitted from `fields` — the current value is preserved.
 */
export function updateRunEntry(
  manifest: Manifest,
  fields: Partial<Omit<RunEntry, "generated">> & { generated?: string },
): void {
  const existing = manifest.run ?? {
    ekonte_hash: "",
    ekonte_template_version: "",
    settei_hash: "",
    settei_template_version: "",
    schema_version: "",
    architecture_version: null,
    generated: new Date().toISOString(),
  };
  manifest.run = {
    ekonte_hash: fields.ekonte_hash ?? existing.ekonte_hash,
    ekonte_template_version:
      fields.ekonte_template_version ?? existing.ekonte_template_version,
    settei_hash: fields.settei_hash ?? existing.settei_hash,
    settei_template_version:
      fields.settei_template_version ?? existing.settei_template_version,
    schema_version: fields.schema_version ?? existing.schema_version,
    architecture_version:
      fields.architecture_version !== undefined
        ? fields.architecture_version
        : existing.architecture_version,
    generated: fields.generated ?? new Date().toISOString(),
  };
}

export function manifestPath(handoffsDir: string): string {
  return join(handoffsDir, ".manifest.json");
}

export { getLocalDateString };
