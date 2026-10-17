/**
 * The PO Spec is a standard document and its anchors are a closed registry. Three copies must agree —
 * the template every new spec is written from, the registry (EN/ES visible names), and architecture-docs'
 * section map that cuts by them — and a spec written before the template carried anchors is still cut,
 * by its heading text, with the receipt saying so.
 */
import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// the template belongs to architecture-readiness; a copy of the authoring skills without it skips the template check
const TPL = join(__dirname, "..", "..", "..", "plugins", "sa-requirements", "skills", "architecture-readiness", "templates", "PO_SPEC_TEMPLATE.md");
const T = existsSync(TPL) ? readFileSync(TPL, "utf-8") : "";
const REG = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "scripts", "shared", "po-spec-anchors.json"), "utf-8")).anchors;
const MAP = JSON.parse(readFileSync(join(__dirname, "..", "scripts", "SECTION_MAP.json"), "utf-8"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { anchorBlock } = require("../scripts/section-prepare.js");

const templateAnchors = () => [...T.matchAll(/^(#{2,3}) .*<!--\s*SECTION:\s*([^>]+?)\s*-->/gm)].map((m) => ({ level: m[1].length, anchor: m[2] }));

describe("PO Spec anchors", () => {
  test.skipIf(!T)("every H2/H3 of the template carries an anchor, and the anchors are exactly the registry", () => {
    const heads = T.split("\n").filter((l) => /^#{2,3} /.test(l));
    const unanchored = heads.filter((l) => !/<!--\s*SECTION:/.test(l) && !/\[.*\]/.test(l));   // `### Use Case 1: [Name]` / `### Epic: [Name]` are instances, not sections
    expect(unanchored).toEqual([]);
    expect(templateAnchors().map((a) => a.anchor).sort()).toEqual(Object.keys(REG).sort());
    for (const a of templateAnchors()) expect({ anchor: a.anchor, level: a.level }).toEqual({ anchor: a.anchor, level: REG[a.anchor].level });
  });
  test("architecture-docs' section map names only registered anchors, and its own anchor list is the registry", () => {
    expect([...MAP.anchors].sort()).toEqual(Object.keys(REG).sort());
    for (const [n, e] of Object.entries<any>(MAP.sections)) for (const x of e.po_spec) { const a = typeof x === 'string' ? x : x.anchor; expect({ section: n, anchor: a, known: a in REG }).toEqual({ section: n, anchor: a, known: true }); }
  });
  test("a spec written before the anchored template is cut by its heading text — English or Spanish — and says so", () => {
    const legacyEs = "# Spec\n\n## 7. Restricciones de Negocio\n\n### Restricciones Tecnológicas\n\nTECH\n\n### Requisitos Regulatorios y de Cumplimiento\n\nREG\n\n## 8. Métricas de Éxito y KPIs\n\nKPI\n";
    const b = anchorBlock(legacyEs, "Technology Constraints");
    expect(b).toMatchObject({ fallback: "text" }); expect(b.text).toMatch(/^### Restricciones Tecnológicas\n\nTECH\n?$/);
    expect(anchorBlock(legacyEs, "Business Constraints").text).toMatch(/TECH[\s\S]*REG/);
    const legacyEn = "# Spec\n\n## 8. Success Metrics & KPIs\n\nKPI-EN\n";
    expect(anchorBlock(legacyEn, "Success Metrics and KPIs")).toMatchObject({ fallback: "text" });   // the template's `&` spelling matches the `and` anchor
    expect(anchorBlock(legacyEs, "Use Cases")).toBeNull();
    // an anchored spec is never matched by text — the anchor wins even when the visible text is something else
    expect(anchorBlock("## Whatever <!-- SECTION: Use Cases -->\n\nUC\n", "Use Cases")).toMatchObject({ fallback: null });
  });
});
