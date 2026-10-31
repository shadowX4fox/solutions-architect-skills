// ci-text.js — what the architecture's CI says to people, in the architecture's language: the language resolved from
// ARCHITECTURE.md or the service's SA_DOC_LANGUAGE, the catalog complete in both languages, and every key a workflow
// template calls present in it. A synthetic architecture (Order Desk) in a temporary directory.
import { describe, test, expect, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const X = require("./shared/ci-text.js");
const ROOT = join(__dirname, "..");
const TMP = join(tmpdir(), `sa-ci-text-${process.pid}`);
const arch = (name: string, head: string) => { const d = join(TMP, name); mkdirSync(d, { recursive: true }); writeFileSync(join(d, "ARCHITECTURE.md"), head + "\n# Order Desk\n"); return d; };
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("the language", () => {
  test("DOC_LANGUAGE in ARCHITECTURE.md, the legacy LANGUAGE marker, then SA_DOC_LANGUAGE, then English", () => {
    expect(X.languageOf(arch("es", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->"), {})).toBe("es");
    expect(X.languageOf(arch("legacy", "<!-- LANGUAGE: es -->"), {})).toBe("es");
    // the file wins over the variable: an architecture repository speaks its own language
    expect(X.languageOf(arch("en", "<!-- DOC_LANGUAGE: en -->"), { SA_DOC_LANGUAGE: "es" })).toBe("en");
    // a service repository has no ARCHITECTURE.md: its variable
    expect(X.languageOf(join(TMP, "hub-api"), { SA_DOC_LANGUAGE: "es" })).toBe("es");
    expect(X.languageOf(join(TMP, "hub-api"), {})).toBe("en");
    expect(X.languageOf(arch("fr", "<!-- DOC_LANGUAGE: fr -->"), {})).toBe("en");
  });
});

describe("the catalog", () => {
  test("every message has both languages, with the same placeholders", () => {
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const [k, v] of Object.entries(X.T) as [string, any][]) {
      expect(typeof v.en, k).toBe("string");
      expect(typeof v.es, k).toBe("string");
      expect(holes(v.es), k).toBe(holes(v.en));
    }
  });

  test("a message filled in the architecture's language, from the CLI as a workflow calls it", () => {
    const d = arch("cli", "<!-- DOC_LANGUAGE: es -->");
    const r = spawnSync("bun", [join(ROOT, "scripts/shared/ci-text.js"), "handoff_title", "tag=architecture-v1.2.0", "--project", d], { encoding: "utf8" });
    expect(r.stdout).toBe("Kit de handoff de architecture-v1.2.0");
    expect(X.text("handoff_title", "en", { tag: "architecture-v1.2.0" })).toBe("Handoff kit for architecture-v1.2.0");
    expect(() => X.text("no_such_key", "en")).toThrow(/no message/);
  });

  test("every key a workflow template calls is in the catalog", () => {
    const files = ["architecture-gates.yml", "architecture-handoff.yml", "architecture-tier0.yml"].map((f) => join(ROOT, "skills/architecture-lifecycle/ci", f));
    const used = new Set<string>();
    for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/(?:\bt|\$T) ([a-z][a-z0-9_]+)\b/g)) used.add(m[1]);
    expect(used.size).toBeGreaterThan(20);
    for (const k of used) expect(X.T[k], `${k} is called and not in the catalog`).toBeDefined();
  });
});

describe("Alia's codec on what the CI says (11.3.0)", () => {
  const run = (args: string[], env: Record<string, string> = {}) => spawnSync("bun", [join(ROOT, "scripts/shared/ci-text.js"), ...args], { encoding: "utf8", env: { ...process.env, SA_PLUGIN_REF: "", SA_ALIA_IMAGES: "", ...env } });
  test("her face in the mood's ring, 64 px, from the public repository at the pinned release; the key's message beside her name", () => {
    const es = arch("codec-es", "<!-- DOC_LANGUAGE: es -->");
    const r = run(["--codec", "worried", "t0_refused", "--project", es], { SA_PLUGIN_REF: "v11.3.0" });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('### <img src="https://raw.githubusercontent.com/shadowx4fox/solutions-architect-skills/v11.3.0/brand/alia/github/codec-worried.png" width="64" height="64" align="middle" alt="Alia"> Alia · Tier 0 rechazado\n');
  });
  test("a branch pin falls back to this plugin's version; SA_ALIA_IMAGES moves the pictures or, none, writes her sparkle", () => {
    const v = JSON.parse(readFileSync(join(ROOT, ".claude-plugin/plugin.json"), "utf8")).version;
    expect(X.codec("calm", "", { SA_PLUGIN_REF: "main" })).toContain(`/v${v}/brand/alia/github/codec-calm.png`);
    expect(X.codec("calm", "x", { SA_ALIA_IMAGES: "https://ghe.acme.test/alia/" })).toContain('src="https://ghe.acme.test/alia/codec-calm.png"');
    expect(X.codec("stern", "Gates", { SA_ALIA_IMAGES: "none" })).toBe("### ✦ Alia · Gates");
    expect(() => X.codec("angry", "")).toThrow(/no mood/);
    expect(run(["--codec", "angry"]).status).toBe(2);
  });
  test("every mood has its picture, and every key a workflow puts beside her is in the catalog", () => {
    for (const m of X.MOODS) expect(readFileSync(join(ROOT, `brand/alia/github/codec-${m}.png`)).subarray(1, 4).toString()).toBe("PNG");
    const files = ["skills/architecture-lifecycle/ci/architecture-gates.yml", "skills/architecture-lifecycle/ci/architecture-tier0.yml", "skills/architecture-lifecycle/ci/architecture-handoff.yml"].map((f) => join(ROOT, f));
    const used = new Set<string>(), moods = new Set<string>();
    for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/--codec "?(?:\$\(.*?echo (\w+) \|\| echo (\w+)\)"?|(\w+))(?: ([a-z][a-z0-9_]+))?/g)) {
      [m[1], m[2], m[3]].filter(Boolean).forEach((x) => moods.add(x)); if (m[4]) used.add(m[4]);
    }
    expect(used.size).toBeGreaterThanOrEqual(5);
    for (const k of used) expect(X.T[k], `${k} is beside her and not in the catalog`).toBeDefined();
    for (const m of moods) expect(X.MOODS).toContain(m);
  });
});
