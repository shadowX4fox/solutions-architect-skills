import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const { prepare } = require("../scripts/resume-prepare.js");
const { markDone } = require("../scripts/create-progress.js");

let root = "";
const put = (rel: string, body = "x\n") => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body); };
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rp-"));
  put(".cache/sa-skills/collect.json", JSON.stringify({ schema: "collect/1", doc_language: "es", architecture_type: "ENTERPRISE", po_spec: { path: "PRODUCT_OWNER_SPEC.md" }, hld: { path: "hld.mmd", format: "mermaid" }, systems: [{ name: "Banca", role: "internal", containers: ["App"] }] }));
  put(".cache/sa-skills/adr-context.md", "ADR CONTEXT BLOCK\n[1] Pattern | Status: PENDING\n");
  put("PRODUCT_OWNER_SPEC.md"); put("hld.mmd", "flowchart TB\n");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("resume-prepare", () => {
  test("after the collection: the collection, the ADR block whole and the S1 payload command", () => {
    const r = prepare(root, { pluginDir: "/PD" });
    expect(r).toContain("do not ls / grep / cat the project");
    expect(r).toContain("next: s1");
    expect(r).toContain("language es · type ENTERPRISE");
    expect(r).toContain("- Banca (internal): App");
    expect(r).toContain("ADRs at Step 6: not recorded — ask at Step 6");
    expect(r).toContain("Optional diagrams at Step 7.2: not recorded — ask at Step 7.2");
    expect(r).toContain("[1] Pattern | Status: PENDING");
    expect(r).toContain("section-prepare.js");
    expect(r).toContain("--section 1 --type ENTERPRISE --lang es");
    expect(r).toContain("--adr-context .cache/sa-skills/adr-context.md");
  });

  test("the next item names its part: Section 5 reads 05-components.md, the index 05-index.md", () => {
    for (const f of ["docs/01-system-overview.md", "docs/10-risks-and-technical-debt.md", "docs/03-architecture-layers.md"]) put(f);
    for (const i of ["s1", "s13", "s4"]) markDone(root, i);
    expect(prepare(root, { pluginDir: "/PD" })).toContain("workflow1/05-components.md");
  });

  test("a file of a later item that predates the create is not reported as unmarked", () => {
    put("adr/README.md");
    expect(prepare(root)).not.toContain("on disk but not marked");
  });
});
