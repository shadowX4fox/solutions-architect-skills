import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const { prepare, block } = require("../scripts/diagram-prepare.js");
const GOV = !!require("../../../scripts/shared/packs.js").designLanguageDir();   // a design language in force (an institution pack's): the governed tests run only then

let root = "";
const w = (rel: string, body: string) => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body); };
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "dp-"));
  w(".cache/sa-skills/collect.json", JSON.stringify({ schema: "collect/1", doc_language: "es", architecture_type: "ENTERPRISE", hld: { path: "hld.mmd", format: "mermaid" } }));
  w("hld.mmd", "flowchart TB\n  A[Web] --> B[API]\n");
  w("docs/03-architecture-layers.md", "# Capas\n\n## 4. Capas <!-- SECTION: Architecture Layers -->\n\n## Architecture Diagrams\n");
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("diagram-prepare", () => {
  test("block() cuts a heading through the next of its level and drops named subsections", () => {
    const src = "## A\n\ntext\n\n### Keep\n\nk\n\n### Drop\n\nd\n\n## B\n\nb\n";
    const b = block(src, "## A", ["### Drop"]);
    expect(b).toContain("### Keep");
    expect(b).not.toContain("\nd\n");
    expect(b).toContain("Drop: left out of the payload");
    expect(b).not.toContain("## B");
  });

  test.if(GOV)("the payload carries the four diagrams' spec, the governed contract in the document's language, the label registry and the sources", () => {
    const r = prepare(root);
    const t = r.text;
    expect(t).toContain("Step 7.1 — the four standard diagrams");
    expect(t).toContain("Step 7.3 — the completeness audit");
    expect(t).toContain("Diagram 1 — Logical View");
    expect(t).toContain("Connection Naming Rule (L1 + L2): left out of the payload");
    expect(t).toContain("llms-mermaid.txt".replace("llms", "es/llms"));
    expect(t).toContain("Connection label registry");
    expect(t).toContain("A[Web] --> B[API]");
    expect(t).toMatch(/\d+ {2}## Architecture Diagrams/);
    expect(t).toContain("never their source");
    expect(r.bytes).toBeLessThan(120 * 1024);
  });
});
