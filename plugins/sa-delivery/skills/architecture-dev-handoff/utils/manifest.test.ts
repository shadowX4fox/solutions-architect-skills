/**
 * Unit tests for skills/architecture-dev-handoff/utils/manifest.ts (v3, handoff kit).
 * Mirrors the architecture-compliance test convention (Bun test, .temp dir).
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
  emptyManifest,
  hashPayload,
  loadManifest,
  readTemplateVersion,
  saveManifest,
  shouldSkip,
  updateCutSheetEntry,
  updateSeamEntry,
  updateRunEntry,
  manifestPath,
  MANIFEST_VERSION,
} from "./manifest";

const TEMP_DIR = join(__dirname, ".temp-manifest-test");

beforeEach(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
  mkdirSync(TEMP_DIR, { recursive: true });
});

afterAll(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
});

const TEMPLATE_VERSION = "3.0.0";
const SCHEMA_VERSION = "3";
const { TEMPLATE_VERSION: KIT_TEMPLATE_VERSION } = require("../scripts/handoff-prepare.js");
const GEN_VERSION = KIT_TEMPLATE_VERSION;   // one constant: the templates, the manifest and the fixtures cannot drift apart

function writePayload(name: string, body: string): string {
  const p = join(TEMP_DIR, `${name}.md`);
  writeFileSync(p, body, "utf-8");
  return p;
}

describe("hashPayload", () => {
  test("identical payloads produce identical hashes", () => {
    const a = writePayload("a", "hello");
    const b = writePayload("b", "hello");
    expect(hashPayload(a, TEMPLATE_VERSION)).toBe(hashPayload(b, TEMPLATE_VERSION));
  });

  test("payload byte change invalidates hash", () => {
    const a = writePayload("a", "hello");
    const b = writePayload("b", "hello!");
    expect(hashPayload(a, TEMPLATE_VERSION)).not.toBe(hashPayload(b, TEMPLATE_VERSION));
  });

  test("template version change invalidates hash", () => {
    const a = writePayload("a", "hello");
    expect(hashPayload(a, "3.0.0")).not.toBe(hashPayload(a, "3.1.0"));
  });

  test("hash is sha256: prefixed hex", () => {
    const a = writePayload("a", "x");
    expect(hashPayload(a, TEMPLATE_VERSION)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("loadManifest / saveManifest round-trip (v3)", () => {
  test("loads empty v3 manifest when file missing", () => {
    const m = loadManifest(join(TEMP_DIR, "missing.json"), GEN_VERSION);
    expect(m.version).toBe(MANIFEST_VERSION);
    expect(m.cut_sheets).toEqual({});
    expect(m.seams).toEqual({});
    expect(m.run).toBeNull();
    expect(m.generator_version).toBe(GEN_VERSION);
  });

  test("save then load round-trips cut_sheets, seams, run", () => {
    const p = manifestPath(TEMP_DIR);
    const m = emptyManifest(GEN_VERSION);
    updateCutSheetEntry(m, "inbox-hub", {
      payload_hash: "sha256:abc",
      template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      architecture_version: "2.13.1",
      cut_sheet_file: "components/04-inbox-hub.md",
      assets: ["openapi.yaml", "ddl.sql"],
      doc_language: "en",
    });
    updateSeamEntry(m, "api-gateway→inbox-hub", {
      payload_hash: "sha256:def",
      template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      seam_file: "interfaces/api-gateway→inbox-hub.md",
      related_adrs: ["ADR-018"],
    });
    updateRunEntry(m, {
      ekonte_hash: "sha256:eee",
      ekonte_template_version: TEMPLATE_VERSION,
      settei_hash: "sha256:sss",
      settei_template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      architecture_version: "2.13.1",
    });
    saveManifest(p, m);
    expect(existsSync(p)).toBe(true);

    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.cut_sheets["inbox-hub"]?.payload_hash).toBe("sha256:abc");
    expect(loaded.cut_sheets["inbox-hub"]?.assets).toEqual([
      "openapi.yaml",
      "ddl.sql",
    ]);
    expect(loaded.seams["api-gateway→inbox-hub"]?.payload_hash).toBe("sha256:def");
    expect(loaded.run?.ekonte_hash).toBe("sha256:eee");
    expect(loaded.run?.settei_hash).toBe("sha256:sss");
  });

  test("corrupt JSON returns empty manifest (no crash)", () => {
    const p = manifestPath(TEMP_DIR);
    writeFileSync(p, "{not json}", "utf-8");
    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.cut_sheets).toEqual({});
    expect(loaded.seams).toEqual({});
    expect(loaded.run).toBeNull();
  });

  test("unknown manifest version returns empty manifest (forces full regen)", () => {
    const p = manifestPath(TEMP_DIR);
    writeFileSync(p, JSON.stringify({ version: "999", cut_sheets: { x: {} } }), "utf-8");
    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.cut_sheets).toEqual({});
  });

  test("save uses atomic rename (no .tmp left behind)", () => {
    const p = manifestPath(TEMP_DIR);
    saveManifest(p, emptyManifest(GEN_VERSION));
    expect(existsSync(`${p}.tmp`)).toBe(false);
  });
});

describe("legacy v1/v2 manifest migration", () => {
  test("legacy components map migrates into stale cut_sheets", () => {
    const p = manifestPath(TEMP_DIR);
    const legacy = {
      version: "1",
      generator: "sa-skills:architecture-dev-handoff",
      generator_version: "3.26.0",
      components: {
        "inbox-hub": {
          payload_hash: "sha256:legacy",
          template_version: "2.1.0",
          schema_version: "2",
          architecture_version: "2.13.1",
          handoff_file: "04-inbox-hub-handoff.md",
          assets: ["openapi.yaml"],
          doc_language: "en",
          generated: "2026-04-01T00:00:00Z",
        },
      },
    };
    writeFileSync(p, JSON.stringify(legacy), "utf-8");
    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.version).toBe(MANIFEST_VERSION);
    expect(loaded.cut_sheets["inbox-hub"]).toBeDefined();
    // Migration prefixes payload_hash with `stale:` so shouldSkip cannot match.
    expect(loaded.cut_sheets["inbox-hub"]?.payload_hash).toBe("stale:sha256:legacy");
    expect(loaded.cut_sheets["inbox-hub"]?.cut_sheet_file).toBe("04-inbox-hub-handoff.md");
    expect(loaded.seams).toEqual({});
    expect(loaded.run).toBeNull();
  });
});

describe("v3 manifest migration — the 3.x kit's Ekonte-named layout", () => {
  test("paths move to the 4.0.0 layout and every hash goes stale", () => {
    const p = manifestPath(TEMP_DIR);
    const v3 = {
      version: "3",
      generator: "sa-skills:architecture-dev-handoff",
      generator_version: "7.12.1",
      run: {
        ekonte_hash: "sha256:e",
        ekonte_template_version: "3.1.0",
        settei_hash: "sha256:s",
        settei_template_version: "3.1.0",
        schema_version: "3",
        architecture_version: "2.1.0",
        generated: "2026-09-01T00:00:00Z",
      },
      seams: {
        "api-gateway→inbox-hub": {
          payload_hash: "sha256:seam",
          template_version: "3.1.0",
          schema_version: "3",
          seam_file: "seams/api-gateway→inbox-hub.md",
          related_adrs: ["ADR-018"],
          generated: "2026-09-01T00:00:00Z",
        },
      },
      cut_sheets: {
        "inbox-hub": {
          payload_hash: "sha256:cut",
          template_version: "3.1.0",
          schema_version: "3",
          architecture_version: "2.1.0",
          cut_sheet_file: "cut-sheets/04-inbox-hub.md",
          assets: ["openapi.yaml"],
          doc_language: "es",
          generated: "2026-09-01T00:00:00Z",
        },
      },
    };
    writeFileSync(p, JSON.stringify(v3), "utf-8");
    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.version).toBe(MANIFEST_VERSION);
    expect(loaded.run?.ekonte_hash).toBe("stale:sha256:e");
    expect(loaded.run?.settei_hash).toBe("stale:sha256:s");
    expect(loaded.seams["api-gateway→inbox-hub"]?.seam_file).toBe("interfaces/api-gateway→inbox-hub.md");
    expect(loaded.seams["api-gateway→inbox-hub"]?.payload_hash).toBe("stale:sha256:seam");
    expect(loaded.seams["api-gateway→inbox-hub"]?.related_adrs).toEqual(["ADR-018"]);
    expect(loaded.cut_sheets["inbox-hub"]?.cut_sheet_file).toBe("components/04-inbox-hub.md");
    expect(loaded.cut_sheets["inbox-hub"]?.payload_hash).toBe("stale:sha256:cut");
    expect(loaded.cut_sheets["inbox-hub"]?.doc_language).toBe("es");
    // A stale entry never skips, whatever the payload hash on the next run
    const r = shouldSkip({
      manifest: loaded,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:cut",
      templateVersion: "3.1.0",
      schemaVersion: "3",
      outputFileAbsPath: join(TEMP_DIR, "components", "04-inbox-hub.md"),
      force: false,
    });
    expect(r.skip).toBe(false);
  });
});

describe("shouldSkip — cut_sheets section", () => {
  function setup() {
    const cutFile = join(TEMP_DIR, "cut.md");
    writeFileSync(cutFile, "<existing component specification>", "utf-8");
    const manifest = emptyManifest(GEN_VERSION);
    updateCutSheetEntry(manifest, "inbox-hub", {
      payload_hash: "sha256:abc",
      template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      architecture_version: "2.13.1",
      cut_sheet_file: cutFile,
      assets: ["openapi.yaml"],
      doc_language: "en",
    });
    return { cutFile, manifest };
  }

  test("skip when all match", () => {
    const { cutFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: cutFile,
      force: false,
    });
    expect(d.skip).toBe(true);
  });

  test("regen when no entry", () => {
    const { cutFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "unknown-component",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: cutFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("no manifest entry");
  });

  test("regen when payload hash differs", () => {
    const { cutFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:DIFFERENT",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: cutFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("payload hash");
  });

  test("regen when template version differs", () => {
    const { cutFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: "9.9.9",
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: cutFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("template");
  });

  test("regen when schema version differs", () => {
    const { cutFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: "999",
      outputFileAbsPath: cutFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("schema");
  });

  test("regen when component specification file missing on disk", () => {
    const { manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: join(TEMP_DIR, "does-not-exist.md"),
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("missing");
  });

  test("regen when force=true even if hash matches", () => {
    const { cutFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: cutFile,
      force: true,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("force");
  });
});

describe("shouldSkip — seams section", () => {
  test("skip vs regen for seam edge key", () => {
    const seamFile = join(TEMP_DIR, "seam.md");
    writeFileSync(seamFile, "<seam>", "utf-8");
    const manifest = emptyManifest(GEN_VERSION);
    updateSeamEntry(manifest, "a→b", {
      payload_hash: "sha256:seam",
      template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      seam_file: seamFile,
      related_adrs: [],
    });

    const skip = shouldSkip({
      manifest,
      section: "seams",
      edgeKey: "a→b",
      payloadHash: "sha256:seam",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: seamFile,
      force: false,
    });
    expect(skip.skip).toBe(true);

    const regen = shouldSkip({
      manifest,
      section: "seams",
      edgeKey: "a→b",
      payloadHash: "sha256:different",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: seamFile,
      force: false,
    });
    expect(regen.skip).toBe(false);
  });
});

describe("shouldSkip — run section (ekonte + settei parts)", () => {
  test("independent skip decisions per part", () => {
    const ekonteFile = join(TEMP_DIR, "SYSTEM_RUNTIME_VIEW.md");
    const setteiFile = join(TEMP_DIR, "CROSS_CUTTING_STANDARDS.md");
    writeFileSync(ekonteFile, "<ekonte>", "utf-8");
    writeFileSync(setteiFile, "<settei>", "utf-8");

    const manifest = emptyManifest(GEN_VERSION);
    updateRunEntry(manifest, {
      ekonte_hash: "sha256:e",
      ekonte_template_version: TEMPLATE_VERSION,
      settei_hash: "sha256:s",
      settei_template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      architecture_version: "1.0.0",
    });

    const skipE = shouldSkip({
      manifest,
      section: "run",
      part: "ekonte",
      payloadHash: "sha256:e",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: ekonteFile,
      force: false,
    });
    expect(skipE.skip).toBe(true);

    const regenS = shouldSkip({
      manifest,
      section: "run",
      part: "settei",
      payloadHash: "sha256:CHANGED",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      outputFileAbsPath: setteiFile,
      force: false,
    });
    expect(regenS.skip).toBe(false);
  });
});

describe("readTemplateVersion", () => {
  test("parses TEMPLATE_VERSION marker from a template file", () => {
    const t = join(TEMP_DIR, "tpl.md");
    writeFileSync(
      t,
      "# Title\n\n<!-- some other comment -->\n<!-- TEMPLATE_VERSION: 3.0.0 -->\n\nbody",
      "utf-8",
    );
    expect(readTemplateVersion(t)).toBe("3.0.0");
  });

  test("rejects file with no marker", () => {
    const t = join(TEMP_DIR, "tpl.md");
    writeFileSync(t, "# Title\n\nno marker here\n", "utf-8");
    expect(() => readTemplateVersion(t)).toThrow(/TEMPLATE_VERSION marker not found/);
  });

  test("only matches marker at start of line (anchored)", () => {
    const t = join(TEMP_DIR, "tpl.md");
    writeFileSync(t, "# Title\n\nprefix <!-- TEMPLATE_VERSION: 1.0.0 -->\n", "utf-8");
    expect(() => readTemplateVersion(t)).toThrow(/TEMPLATE_VERSION marker not found/);
  });
});

describe("handoff kit templates declare the TEMPLATE_VERSION handoff-prepare.js writes into the manifest", () => {
  // Tripwire test: every template in the kit must carry the same
  // TEMPLATE_VERSION. If any template's structure changes, the version
  // MUST be bumped in ALL FOUR templates together — mismatched versions
  // would let manifests skip regeneration against an updated template.
  const templates = [
    "SYSTEM_EKONTE_TEMPLATE.md",
    "SEAM_SPEC_TEMPLATE.md",
    "SETTEI_TEMPLATE.md",
    "CUT_SHEET_TEMPLATE.md",
  ];

  for (const filename of templates) {
    test(`${filename} declares TEMPLATE_VERSION ${KIT_TEMPLATE_VERSION}`, () => {
      const path = join(__dirname, "..", filename);
      expect(readTemplateVersion(path)).toBe(KIT_TEMPLATE_VERSION);
    });
  }
});

describe("manifest CLI integration smoke (v3)", () => {
  test("hash subcommand prints sha256 prefix", () => {
    const payload = writePayload("p", "abc");
    const proc = Bun.spawnSync({
      cmd: ["bun", join(__dirname, "manifest-cli.ts"), "hash", payload, "3.0.0"],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("template-version subcommand prints the marker value", () => {
    const t = join(TEMP_DIR, "tpl.md");
    writeFileSync(t, "# Title\n\n<!-- TEMPLATE_VERSION: 9.9.9 -->\n", "utf-8");
    const proc = Bun.spawnSync({
      cmd: ["bun", join(__dirname, "manifest-cli.ts"), "template-version", t],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toBe("9.9.9");
  });

  test("check-cut-sheet returns REGEN when no manifest exists", () => {
    const payload = writePayload("p", "abc");
    const cutFile = join(TEMP_DIR, "cut.md");
    writeFileSync(cutFile, "x", "utf-8");
    const m = manifestPath(TEMP_DIR);
    const hash = hashPayload(payload, TEMPLATE_VERSION);
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "manifest-cli.ts"),
        "check-cut-sheet",
        m,
        "inbox-hub",
        hash,
        TEMPLATE_VERSION,
        SCHEMA_VERSION,
        cutFile,
      ],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toContain("REGEN");
  });

  test("check-seam returns REGEN when no manifest exists", () => {
    const payload = writePayload("p", "abc");
    const seamFile = join(TEMP_DIR, "seam.md");
    writeFileSync(seamFile, "x", "utf-8");
    const m = manifestPath(TEMP_DIR);
    const hash = hashPayload(payload, TEMPLATE_VERSION);
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "manifest-cli.ts"),
        "check-seam",
        m,
        "a→b",
        hash,
        TEMPLATE_VERSION,
        SCHEMA_VERSION,
        seamFile,
      ],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toContain("REGEN");
  });

  test("check-run rejects unknown part", () => {
    const payload = writePayload("p", "abc");
    const outFile = join(TEMP_DIR, "out.md");
    writeFileSync(outFile, "x", "utf-8");
    const m = manifestPath(TEMP_DIR);
    const hash = hashPayload(payload, TEMPLATE_VERSION);
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "manifest-cli.ts"),
        "check-run",
        m,
        "not-a-part",
        hash,
        TEMPLATE_VERSION,
        SCHEMA_VERSION,
        outFile,
      ],
    });
    expect(proc.exitCode).toBe(2);
  });
});
