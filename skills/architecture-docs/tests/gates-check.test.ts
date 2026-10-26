import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const { check, stepRanges } = require("../scripts/gates-check.js");
const RS = require("../../../plugins/sa-requirements/skills/architecture-readiness/scripts/readiness-stamp.js");
const verified = (body: string) => RS.stamped(body, "2026-10-25");

let root = "";
const put = (rel: string, body = "x\n") => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body); };
const gate = (r: any, name: string) => r.gates.find((g: any) => g.name === name);
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "gc-")); });
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("gates-check", () => {
  test("every Step 0.x block of 00-gates.md has a range", () => {
    const r = stepRanges();
    for (const s of ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.65"]) expect(r[s]?.from).toBeGreaterThan(0);
    expect(r["0.2"].to).toBeLessThan(r["0.3"].from);
  });

  test("empty project: language asks, PO Spec missing with its range, nothing blocks", () => {
    const r = check(root);
    expect(gate(r, "language").status).toBe("ASK");
    expect(gate(r, "po_spec").status).toBe("MISSING");
    expect(gate(r, "po_spec").read).toMatch(/^workflow1\/00-gates\.md:\d+-\d+$/);
    expect(r.blocked).toBe(false);
  });

  test("a PO Spec citing the architecture passes with a WARN naming the ids; a business-only spec passes", () => {
    put("PRODUCT_OWNER_SPEC.md", "# X - Product Owner Specification\n\nPer [ADR-117](adr/ADR-117-x.md), deuda TDR-002.\n");
    const w = gate(check(root), "po_spec");
    expect(w.status).toBe("WARN");
    expect(w.value).toBe("PRODUCT_OWNER_SPEC.md");
    expect(w.note).toMatch(/2 architecture reference\(s\) in the spec \(ADR-117, TDR-002\)/);
    expect(w.read).toBeUndefined();
    put("PRODUCT_OWNER_SPEC.md", verified("# X - Product Owner Specification\n\nEl cliente consulta sin conexión.\n"));
    expect(gate(check(root), "po_spec")).toMatchObject({ status: "PASS", readiness: "verified" });
  });

  test("the evaluation's stamp (10.24.0): a chat draft and a stale stamp block with their note, none warns, verified passes", () => {
    const spec = "# X - Product Owner Specification\n\nEl cliente consulta sin conexión.\n";
    put("PRODUCT_OWNER_SPEC.md", spec + "\n<!-- READINESS_CHECK: draft -->\n");
    let r = check(root), g = gate(r, "po_spec");
    expect(g).toMatchObject({ status: "BLOCK", readiness: "draft" });
    expect(g.note).toMatch(/chat mode.*evaluate PO spec/);
    expect(g.read).toBeUndefined();
    expect(r.blocked).toBe(true);
    put("PRODUCT_OWNER_SPEC.md", verified(spec).replace("sin conexión", "con conexión"));
    g = gate(check(root), "po_spec");
    expect(g).toMatchObject({ status: "BLOCK", readiness: "stale" });
    expect(g.note).toMatch(/edited after its evaluation \(2026-10-25\)/);
    put("PRODUCT_OWNER_SPEC.md", spec);
    g = gate(check(root), "po_spec");
    expect(g).toMatchObject({ status: "WARN", readiness: "none" });
    expect(g.note).toMatch(/not evaluated/);
    put("PRODUCT_OWNER_SPEC.md", verified(spec).replace(/\n/g, "\r\n"));
    expect(gate(check(root), "po_spec")).toMatchObject({ status: "PASS", readiness: "verified" });
  });

  test("common path: spec, BIAN v3.0, a Mermaid HLD — every gate passes and nothing is to read", () => {
    put("PRODUCT_OWNER_SPEC.md", verified("<!-- DOC_LANGUAGE: es -->\n# X - Product Owner Specification\n"));
    put("BIAN_ALIGNMENT.md", "<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->\n<!-- PO_SPEC_SOURCE: PRODUCT_OWNER_SPEC.md -->\n");
    put("design/hld.mmd", "flowchart TB\n  a-->b\n");
    put("adr/ADR-001-x.md");
    const r = check(root, { lang: "es", hld: "design/hld.mmd" });
    for (const g of r.gates) { expect(g.status).toBe("PASS"); expect(g.read).toBeUndefined(); }
  });

  test("the PO Spec's language is a default, never adopted", () => {
    put("PRODUCT_OWNER_SPEC.md", "<!-- DOC_LANGUAGE: es -->\n");
    const g = gate(check(root), "language");
    expect(g.status).toBe("ASK");
    expect(g.default).toBe("es");
  });

  test("a legacy alignment or a report below v3.0 blocks", () => {
    put("PRODUCT_OWNER_SPEC.md");
    put("ENTERPRISE_ALIGNMENT.md");
    expect(gate(check(root), "align").status).toBe("BLOCK");
    put("BIAN_ALIGNMENT.md", "<!-- BIAN_ALIGNMENT_VERSION: 2.1 -->\n");
    const r = check(root);
    expect(gate(r, "align").status).toBe("BLOCK");
    expect(r.blocked).toBe(true);
  });

  test("an HLD that is not Mermaid is transcribed first (8.93.1); a .md without a fence asks again", () => {
    put("PRODUCT_OWNER_SPEC.md");
    put("BIAN_ALIGNMENT.md", "<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->\n");
    put("hld.pdf");
    const g = gate(check(root, { hld: "hld.pdf" }), "hld");
    expect(g.status).toBe("TRANSCRIBE");
    expect(g.transcription).toBe("hld.hld.mmd");
    expect(g.read).toBeTruthy();
    put("hld.hld.mmd", 'flowchart TB\n  A["A"] --> B["B"]\n');
    const p = gate(check(root, { hld: "hld.pdf" }), "hld");
    expect(p.status).toBe("PASS");
    expect(p.read).toBeFalsy();
    put("design.md", "# no diagram\n");
    expect(gate(check(root, { hld: "design.md" }), "hld").status).toBe("ASK");
  });

  test("an institutional ADR cited and absent blocks", () => {
    put("PRODUCT_OWNER_SPEC.md", "per ADR-005\n");
    put("adr/ADR-001-x.md");
    const g = gate(check(root), "catalog");
    expect(g.status).toBe("BLOCK");
    expect(g.note).toContain("ADR-005");
  });
});

describe("gates-check — the capability framework (Step 0.3)", () => {
  const env = (fn: () => void) => { const p = process.env.SA_PACKS, c = process.env.CLAUDE_CONFIG_DIR; process.env.SA_PACKS = ""; process.env.CLAUDE_CONFIG_DIR = mkdtempSync(join(tmpdir(), "gc-cfg-"));
    try { fn(); } finally { if (p === undefined) delete process.env.SA_PACKS; else process.env.SA_PACKS = p; if (c === undefined) delete process.env.CLAUDE_CONFIG_DIR; else process.env.CLAUDE_CONFIG_DIR = c; } };
  test("nothing declared and no report: the gate asks once, naming the frameworks and none", () => env(() => {
    put("PRODUCT_OWNER_SPEC.md");
    const g = gate(check(root), "align");
    expect(g.status).toBe("ASK"); expect(g.note).toMatch(/BIAN · CROSS-INDUSTRY · none/); expect(g.note).toMatch(/--declare/);
  }));
  test("declared none passes; a declared framework needs its own report, at its version", () => env(() => {
    put("PRODUCT_OWNER_SPEC.md");
    put(".sa-skills/project.json", JSON.stringify({ framework: "none" }));
    expect(gate(check(root), "align")).toMatchObject({ status: "PASS", value: "none" });
    put(".sa-skills/project.json", JSON.stringify({ framework: "cross-industry" }));
    const b = gate(check(root), "align");
    expect(b.status).toBe("BLOCK"); expect(b.note).toMatch(/no CAPABILITY_ALIGNMENT\.md — run \/sa-requirements:architecture-capability-alignment --framework CROSS-INDUSTRY/);
    put("CAPABILITY_ALIGNMENT.md", "<!-- ALIGNMENT_FRAMEWORK: CROSS-INDUSTRY -->\n<!-- ALIGNMENT_VERSION: 1.0 -->\n");
    expect(gate(check(root), "align")).toMatchObject({ status: "PASS", framework: "CROSS-INDUSTRY", value: "CAPABILITY_ALIGNMENT.md" });
  }));
});
