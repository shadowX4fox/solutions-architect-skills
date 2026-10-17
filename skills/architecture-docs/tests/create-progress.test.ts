import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const { status, markDone, ORDER } = require("../scripts/create-progress.js");

let root = "";
const put = (rel: string) => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), "x\n"); };
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "cp-")); });
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("create-progress", () => {
  test("nothing collected: the next item is the collection", () => {
    const s = status(root);
    expect(s.next).toBe("collect");
    expect(s.read).toBe("workflow1/01-type-selection.md");
  });

  test("collect.json counts as the collection, and marking it prints checkpoint 1", () => {
    put(".cache/sa-skills/collect.json");
    expect(status(root).next).toBe("s1");
    const r = markDone(root, "collect");
    expect(r.checkpoint?.n).toBe(1);
  });

  test("refuses an item whose file is not on disk", () => {
    put(".cache/sa-skills/collect.json");
    expect(markDone(root, "s1").error).toContain("docs/01-system-overview.md");
  });

  test("Section 5 needs the index and a component file", () => {
    put(".cache/sa-skills/collect.json");
    put("docs/components/README.md");
    expect(markDone(root, "s5").error).toBeTruthy();
    put("docs/components/sys/01-a.md");
    expect(markDone(root, "s5").error).toBeUndefined();
  });

  test("a checkpoint only when a segment closes", () => {
    put(".cache/sa-skills/collect.json");
    for (const f of ["docs/01-system-overview.md", "docs/10-risks-and-technical-debt.md", "docs/03-architecture-layers.md", "docs/components/README.md", "docs/components/sys/01-a.md"]) put(f);
    expect(markDone(root, "s1").checkpoint).toBeNull();
    expect(markDone(root, "s13").checkpoint).toBeNull();
    expect(markDone(root, "s4").checkpoint).toBeNull();
    const r = markDone(root, "s5");
    expect(r.checkpoint?.n).toBe(2);
    expect(r.next).toBe("s8");
  });

  test("a file written but not marked is reported; the closing reads its own part", () => {
    put(".cache/sa-skills/collect.json");
    put("docs/01-system-overview.md");
    expect(status(root).unmarked).toEqual(["s1"]);
    expect(ORDER.slice(-3)).toEqual(["5.7", "6", "7"]);
  });

  test("automatic checkpoints: the receipt says go on, never stop (8.89.0)", () => {
    put(".cache/sa-skills/collect.json");
    writeFileSync(join(root, ".cache/sa-skills/collect.json"), JSON.stringify({ checkpoints: "auto" }));
    const { receipt } = require("../scripts/create-progress.js");
    const r = markDone(root, "collect");
    expect(r.mode).toBe("auto");
    expect(r.segment_items).toEqual(["s1", "s13", "s4", "s5"]);
    const text = receipt(r);
    expect(text).toContain("⏩ CHECKPOINT 1 of 4");
    expect(text).not.toContain("STOP");
  });

  test("automatic checkpoints need the systems at the collection", () => {
    const { build } = require("../scripts/collect-save.js");
    expect(build(root, { lang: "es", type: "ENTERPRISE", checkpoints: "auto" }).errors.join()).toContain("--systems");
    expect(build(root, { lang: "es", type: "ENTERPRISE", checkpoints: "auto", systems: '[{"name":"A","role":"internal"}]' }).errors).toEqual([]);
    expect(build(root, { lang: "es", type: "ENTERPRISE" }).record.checkpoints).toBe("manual");
  });

  test("the ADR status is recorded at the collection, so Step 6 asks nothing (8.118.6)", () => {
    const { build } = require("../scripts/collect-save.js");
    expect(build(root, { lang: "es", type: "ENTERPRISE" }).record.adr).toBeNull();                  // not asked → Step 6 asks
    expect(build(root, { lang: "es", type: "ENTERPRISE", adrStatus: "decided-accepted" }).record.adr).toEqual({ status: "decided-accepted", optional: "skip" });
    expect(build(root, { lang: "es", type: "ENTERPRISE", adrStatus: "proposed", adrOptional: "write" }).record.adr).toEqual({ status: "proposed", optional: "write" });
    expect(build(root, { lang: "es", type: "ENTERPRISE", adrStatus: "maybe" }).errors.join()).toContain("--adr-status");
    expect(build(root, { lang: "es", type: "ENTERPRISE", adrOptional: "write" }).errors.join()).toContain("needs --adr-status");
  });

  test("the optional diagrams are recorded at the collection, so Step 7.2 asks nothing (8.118.8)", () => {
    const { build } = require("../scripts/collect-save.js");
    expect(build(root, { lang: "es", type: "ENTERPRISE" }).record.optional_diagrams).toBeNull();             // not asked → 7.2 asks
    expect(build(root, { lang: "es", type: "ENTERPRISE", diagrams: "none" }).record.optional_diagrams).toEqual([]);
    expect(build(root, { lang: "es", type: "ENTERPRISE", diagrams: "a, C" }).record.optional_diagrams).toEqual(["A", "C"]);
    expect(build(root, { lang: "es", type: "ENTERPRISE", diagrams: "A,F" }).errors.join()).toContain("--diagrams");
  });
});
