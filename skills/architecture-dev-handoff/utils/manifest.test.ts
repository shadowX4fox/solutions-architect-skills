/**
 * Unit tests for skills/architecture-dev-handoff/utils/manifest.ts.
 * Mirrors the architecture-compliance test convention (Bun test, .temp dir).
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  emptyManifest,
  hashPayload,
  loadManifest,
  saveManifest,
  shouldSkip,
  updateEntry,
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

const TEMPLATE_VERSION = "3.13.0";
const SCHEMA_VERSION = "1";
const GEN_VERSION = "3.13.0";

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
    expect(hashPayload(a, "3.13.0")).not.toBe(hashPayload(a, "3.14.0"));
  });

  test("hash is sha256: prefixed hex", () => {
    const a = writePayload("a", "x");
    expect(hashPayload(a, TEMPLATE_VERSION)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("loadManifest / saveManifest round-trip", () => {
  test("loads empty manifest when file missing", () => {
    const m = loadManifest(join(TEMP_DIR, "missing.json"), GEN_VERSION);
    expect(m.version).toBe(MANIFEST_VERSION);
    expect(m.components).toEqual({});
    expect(m.generator_version).toBe(GEN_VERSION);
  });

  test("save then load returns equivalent manifest", () => {
    const p = manifestPath(TEMP_DIR);
    const m = emptyManifest(GEN_VERSION);
    updateEntry(m, "inbox-hub", {
      payload_hash: "sha256:abc",
      template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      architecture_version: "2.13.1",
      handoff_file: "handoffs/04-inbox-hub-handoff.md",
      assets: ["openapi.yaml", "deployment.yaml"],
      doc_language: "en",
    });
    saveManifest(p, m);
    expect(existsSync(p)).toBe(true);

    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.components["inbox-hub"]?.payload_hash).toBe("sha256:abc");
    expect(loaded.components["inbox-hub"]?.assets).toEqual(["openapi.yaml", "deployment.yaml"]);
  });

  test("corrupt JSON returns empty manifest (no crash)", () => {
    const p = manifestPath(TEMP_DIR);
    writeFileSync(p, "{not json}", "utf-8");
    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.components).toEqual({});
  });

  test("unknown manifest version returns empty manifest (forces full regen)", () => {
    const p = manifestPath(TEMP_DIR);
    writeFileSync(p, JSON.stringify({ version: "999", components: { x: {} } }), "utf-8");
    const loaded = loadManifest(p, GEN_VERSION);
    expect(loaded.components).toEqual({});
  });

  test("save uses atomic rename (no .tmp left behind)", () => {
    const p = manifestPath(TEMP_DIR);
    saveManifest(p, emptyManifest(GEN_VERSION));
    expect(existsSync(`${p}.tmp`)).toBe(false);
  });
});

describe("shouldSkip", () => {
  function setup() {
    const handoffFile = join(TEMP_DIR, "handoff.md");
    writeFileSync(handoffFile, "<existing handoff>", "utf-8");
    const manifest = emptyManifest(GEN_VERSION);
    updateEntry(manifest, "inbox-hub", {
      payload_hash: "sha256:abc",
      template_version: TEMPLATE_VERSION,
      schema_version: SCHEMA_VERSION,
      architecture_version: "2.13.1",
      handoff_file: handoffFile,
      assets: ["openapi.yaml"],
      doc_language: "en",
    });
    return { handoffFile, manifest };
  }

  test("skip when all match", () => {
    const { handoffFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      handoffFileAbsPath: handoffFile,
      force: false,
    });
    expect(d.skip).toBe(true);
  });

  test("regen when no entry", () => {
    const { handoffFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "unknown-component",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      handoffFileAbsPath: handoffFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("no manifest entry");
  });

  test("regen when payload hash differs", () => {
    const { handoffFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "inbox-hub",
      payloadHash: "sha256:DIFFERENT",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      handoffFileAbsPath: handoffFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("payload hash");
  });

  test("regen when template version differs", () => {
    const { handoffFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: "9.9.9",
      schemaVersion: SCHEMA_VERSION,
      handoffFileAbsPath: handoffFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("template");
  });

  test("regen when schema version differs", () => {
    const { handoffFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: "999",
      handoffFileAbsPath: handoffFile,
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("schema");
  });

  test("regen when handoff file missing on disk", () => {
    const { manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      handoffFileAbsPath: join(TEMP_DIR, "does-not-exist.md"),
      force: false,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("missing");
  });

  test("regen when force=true even if hash matches", () => {
    const { handoffFile, manifest } = setup();
    const d = shouldSkip({
      manifest,
      slug: "inbox-hub",
      payloadHash: "sha256:abc",
      templateVersion: TEMPLATE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      handoffFileAbsPath: handoffFile,
      force: true,
    });
    expect(d.skip).toBe(false);
    expect(d.reason).toContain("force");
  });
});

describe("manifest CLI integration smoke", () => {
  test("hash subcommand prints sha256 prefix", async () => {
    const payload = writePayload("p", "abc");
    const proc = Bun.spawnSync({
      cmd: ["bun", join(__dirname, "manifest-cli.ts"), "hash", payload, "3.13.0"],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString().trim()).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("check subcommand returns REGEN when no manifest exists", async () => {
    const payload = writePayload("p", "abc");
    const handoff = join(TEMP_DIR, "h.md");
    writeFileSync(handoff, "x", "utf-8");
    const m = manifestPath(TEMP_DIR);
    const hash = hashPayload(payload, "3.13.0");
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "manifest-cli.ts"),
        "check",
        m,
        "inbox-hub",
        hash,
        "3.13.0",
        "1",
        handoff,
      ],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toContain("REGEN");
  });
});
