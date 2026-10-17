/**
 * sync-design-language.ts — a drop of the standard is taken whole or refused: a missing file, a mixed stamp or a
 * registry of another version stops it; a write ships the set only, deletes the rest but the README, and leaves
 * every file 0644.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdtempSync, rmSync, cpSync, writeFileSync, readFileSync, existsSync, statSync, chmodSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { plan, write, stampOf } from "./sync-design-language";

// the standard in force — an institution pack's; the base carries none, so without a pack these tests have nothing to sync
const BUNDLE: string = require("./shared/packs.js").designLanguageDir() || "";
const ROOT = mkdtempSync(join(tmpdir(), "sa-sync-dl-"));
const SRC = join(ROOT, "drop"), DST = join(ROOT, "bundle");

beforeEach(() => {
  if (!BUNDLE) return;
  rmSync(SRC, { recursive: true, force: true }); rmSync(DST, { recursive: true, force: true });
  cpSync(BUNDLE, SRC, { recursive: true }); rmSync(join(SRC, "README.md"));
  writeFileSync(join(SRC, "_master.md"), "# sources\n");                  // the standard's own files never travel
  cpSync(BUNDLE, DST, { recursive: true }); writeFileSync(join(DST, "llms-rules-old.txt"), "stale\n");
});
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

describe.if(!!BUNDLE)("sync-design-language", () => {
  test("the bundled drop plans clean: one stamp, the registry of that stamp, no registry delta against itself", () => {
    const p = plan(SRC, DST);
    expect(p.problems).toEqual([]);
    expect(p.stamp).toBe(stampOf(readFileSync(join(BUNDLE, "llms.txt"), "utf-8")));
    expect(p.delta).toEqual([]);
    expect(p.files).toContain("rules-registry.json");
    expect(p.files).not.toContain("_master.md");
    expect(p.stale).toEqual(["llms-rules-old.txt"]);
  });

  test("a mixed-stamp drop, a missing registry or a registry of another version is refused", () => {
    const es = join(SRC, "es", "llms-mermaid.txt");
    writeFileSync(es, readFileSync(es, "utf-8").replace(/v\d+\.\d+ \([^)]*\)/, "v0.10 (draft)").replace(/\d{4}-\d{2}-\d{2}/, "2026-08-27"));
    expect(plan(SRC, DST).problems.join("\n")).toMatch(/es\/llms-mermaid\.txt: stamp v0\.10 \(draft\), 2026-08-27, llms\.txt says/);
    cpSync(join(BUNDLE, "es", "llms-mermaid.txt"), es);
    const reg = JSON.parse(readFileSync(join(SRC, "rules-registry.json"), "utf-8"));
    writeFileSync(join(SRC, "rules-registry.json"), JSON.stringify({ ...reg, built: "2026-01-01" }));
    expect(plan(SRC, DST).problems.join("\n")).toMatch(/rules-registry\.json: .*2026-01-01, llms\.txt says .*_registry\.ts/);
    rmSync(join(SRC, "rules-registry.json"));
    expect(plan(SRC, DST).problems).toContain("missing: rules-registry.json");
  });

  test("the registry delta names what each registry gained and lost", () => {
    const reg = JSON.parse(readFileSync(join(SRC, "rules-registry.json"), "utf-8"));
    reg.label.protocols = reg.label.protocols.filter((t: string) => t !== "AMQP").concat("MQTT");
    writeFileSync(join(SRC, "rules-registry.json"), JSON.stringify(reg));
    expect(plan(SRC, DST).delta).toEqual([{ registry: "PROTOCOL", added: ["MQTT"], removed: ["AMQP"] }]);
  });

  test("a new label slot is a delta: the form, the expression and the slots (RC5's Via)", () => {
    const reg = JSON.parse(readFileSync(join(SRC, "rules-registry.json"), "utf-8"));
    reg.label.form = reg.label.form + "[ · Over <name>]"; reg.label.expression = reg.label.expression.replace(/\$$/, "( · Over [^·]+)?$"); reg.label.over = { keyword: "Over" };
    writeFileSync(join(SRC, "rules-registry.json"), JSON.stringify(reg));
    expect(plan(SRC, DST).delta.map((d: any) => d.registry)).toEqual(["label form", "label expression", "label slots"]);
    expect(plan(SRC, DST).delta.find((d: any) => d.registry === "label slots")).toMatchObject({ added: ["over"], removed: [] });
  });

  test("a write ships the set only, deletes the rest but the README, and leaves every file 0644", () => {
    chmodSync(join(SRC, "llms.txt"), 0o700);
    write(SRC, plan(SRC, DST), DST);
    expect(existsSync(join(DST, "llms-rules-old.txt"))).toBe(false);
    expect(existsSync(join(DST, "_master.md"))).toBe(false);
    expect(existsSync(join(DST, "README.md"))).toBe(true);
    expect(statSync(join(DST, "llms.txt")).mode & 0o777).toBe(0o644);
    expect(readFileSync(join(DST, "rules-registry.json"), "utf-8")).toBe(readFileSync(join(BUNDLE, "rules-registry.json"), "utf-8"));
  });
});
