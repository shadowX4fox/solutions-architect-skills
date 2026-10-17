/**
 * SECTION_MAP.json — every architecture section has an entry, every anchor it names is a known PO Spec
 * anchor, and section-prepare.js cuts the PO Spec by it.
 */
import { describe, test, expect } from "bun:test";
import { join } from "path";
import { readFileSync } from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SECTIONS } = require("../scripts/section-prepare.js");
const MAP = JSON.parse(readFileSync(join(__dirname, "..", "scripts", "SECTION_MAP.json"), "utf-8"));

describe("section map", () => {
  test("every section section-prepare knows has a map entry, and no entry names a section it does not know", () => {
    expect(Object.keys(MAP.sections).sort((a, b) => +a - +b)).toEqual(Object.keys(SECTIONS).sort((a, b) => +a - +b));
  });
  test("every anchor a section names is a known PO Spec anchor — a typo would become a silent gap in every payload", () => {
    const known = new Set(MAP.anchors);
    for (const [n, e] of Object.entries<any>(MAP.sections)) for (const x of e.po_spec) { const a = typeof x === 'string' ? x : x.anchor; expect({ section: n, anchor: a, known: known.has(a) }).toEqual({ section: n, anchor: a, known: true }); }
  });
  test("the sections that write the system's shape carry the use cases; the decision record carries no PO Spec at all", () => {
    expect(MAP.sections["6"].po_spec).toContain("Use Cases");
    expect(MAP.sections["1"].po_spec).toContain("Business Context");
    expect(MAP.sections["1"].po_spec).toContainEqual({ anchor: "Use Cases", mode: "outline" });   // the overview names them; S6 gets them whole
    expect(MAP.sections["12"].po_spec).toEqual([]);
  });
});
