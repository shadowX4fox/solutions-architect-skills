/**
 * The judge's hard set — rules under test: every site's spec is its code's, verbatim (a site that rewords its question
 * or criteria makes the set stale, and the measurement would then be of a question no site asks); every
 * label is an answer the item offers; the state the judge sees carries no label; ids are unique and opaque.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");
const { SITES } = require("./cases.js");
const { itemsOf, grade } = require("./run.js");
/** Source text with JS string escapes undone, so a spec string compares to what the code says. */
const source = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\\'/g, "'").replace(/\\"/g, '"');
const SOURCES: Record<string, string> = {
  direction: "plugins/sa-analysis/skills/architecture-analysis/scripts/analysis-prepare.js",
  resolve: "scripts/resolve-name.js",
  mitigation: "scripts/shared/findings.js",
  superseded: "skills/architecture-docs/scripts/superseded-claims.js",
};

describe("judge hard set", () => {
  test("every site's question and criteria are its code's, verbatim", () => {
    for (const [site, { spec, cases }] of Object.entries(SITES) as any) {
      const src = source(SOURCES[site]);
      expect(src).toContain(spec.question);
      expect(src).toContain(`id: '${spec.id}'`);
      for (const text of Object.values(spec.criteria || {})) expect(src).toContain(text as string);
      if (site === "resolve") for (const c of cases) expect(src).toContain(c.options.none);
    }
  });
  test("every label is an answer the item offers; the state carries no label; ids are unique and opaque", () => {
    const sets = itemsOf(); const ids = new Set<string>(); let n = 0;
    for (const [site, { spec, items, labels }] of Object.entries(sets) as any) {
      for (const it of items) {
        expect(ids.has(it.id)).toBe(false); ids.add(it.id); n++;
        expect(it.id).toMatch(/^h\d{2}$/);
        expect(JSON.stringify(it.state)).not.toMatch(/"(label|mode)"/);
        const { label } = labels[it.id];
        if (spec.type === "noul") expect([0, 1]).toContain(label);
        else expect(Object.keys({ ...(spec.criteria || {}), ...(it.options || {}) })).toContain(label);
      }
    }
    expect(n).toBe(48);
  });
  test("grading: a confident wrong answer is counted apart from a timid one", () => {
    const spec = SITES.superseded.spec, labels = { a: { label: 0, mode: "history" }, b: { label: 1, mode: "asserts" }, c: { label: 0, mode: "x" } };
    const g = grade("superseded", spec, labels, { a: { p: 0.9 }, b: { p: 0.3 }, c: { p: 0.1 } });
    expect(g.ok).toBe(1); expect(g.loud).toBe(1); expect(g.misses.map((m: any) => m.id)).toEqual(["a", "b"]);
  });
});
