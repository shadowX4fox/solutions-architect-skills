/**
 * handoffs/.manifest.json read/write + skip-if-unchanged decision.
 *
 * The manifest is a per-project record of which component handoffs have been
 * generated and the SHA-256 of the payload that produced each one. On the
 * next orchestration, components whose payload hash + template version still
 * match (and whose handoff file still exists on disk) are skipped — the user's
 * 2.13.0→2.13.1 architecture-bump scenario observed 5/8 components unchanged
 * and wasted ~80% of the run regenerating them.
 *
 * Hash inputs:
 *   sha256( payload_file_bytes + "\n--TEMPLATE--\n" + template_version )
 *
 * The payload already incorporates the component file, sliced shared docs,
 * relevant ADRs, and architecture_version, so hashing the payload captures
 * every source change that affects sub-agent output. template_version is added
 * so a bundled-template change invalidates all entries.
 *
 * @module manifest
 */
import { createHash } from "crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { mkdirSync } from "fs";
import { getLocalDateString } from "../../architecture-compliance/utils/date-utils";

export const MANIFEST_VERSION = "1";

export type ManifestEntry = {
  payload_hash: string;
  template_version: string;
  schema_version: string;
  architecture_version: string | null;
  handoff_file: string;
  assets: string[];
  doc_language: string;
  generated: string;
};

export type Manifest = {
  version: string;
  generator: string;
  generator_version: string;
  components: Record<string, ManifestEntry>;
};

export function emptyManifest(generatorVersion: string): Manifest {
  return {
    version: MANIFEST_VERSION,
    generator: "sa-skills:architecture-dev-handoff",
    generator_version: generatorVersion,
    components: {},
  };
}

export function loadManifest(path: string, generatorVersion: string): Manifest {
  if (!existsSync(path)) return emptyManifest(generatorVersion);
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Manifest>;
    if (parsed.version !== MANIFEST_VERSION) {
      // Old/unknown schema → discard, force full regen
      return emptyManifest(generatorVersion);
    }
    return {
      version: parsed.version,
      generator: parsed.generator ?? "sa-skills:architecture-dev-handoff",
      generator_version: parsed.generator_version ?? generatorVersion,
      components: parsed.components ?? {},
    };
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

export function hashPayload(payloadPath: string, templateVersion: string): string {
  const bytes = readFileSync(payloadPath);
  const h = createHash("sha256");
  h.update(bytes);
  h.update(`\n--TEMPLATE--\n${templateVersion}`);
  return `sha256:${h.digest("hex")}`;
}

export type SkipDecision = {
  skip: boolean;
  reason: string;
};

export function shouldSkip(args: {
  manifest: Manifest;
  slug: string;
  payloadHash: string;
  templateVersion: string;
  schemaVersion: string;
  handoffFileAbsPath: string;
  force: boolean;
}): SkipDecision {
  if (args.force) return { skip: false, reason: "--force flag set" };
  const entry = args.manifest.components[args.slug];
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
  if (!existsSync(args.handoffFileAbsPath)) {
    return { skip: false, reason: "handoff file missing on disk" };
  }
  return { skip: true, reason: "unchanged since last generation" };
}

export function updateEntry(
  manifest: Manifest,
  slug: string,
  fields: Omit<ManifestEntry, "generated"> & { generated?: string },
): void {
  manifest.components[slug] = {
    ...fields,
    generated: fields.generated ?? new Date().toISOString(),
  };
}

export function manifestPath(handoffsDir: string): string {
  return join(handoffsDir, ".manifest.json");
}

export { getLocalDateString };
