/**
 * row-labels.js + ROW_LABELS.json (8.111.0) — the closed EN↔ES list of the kit's row labels. The registry and the four
 * templates cannot drift: every label of a template label table has a Spanish entry, and every entry is a template label.
 */
import { describe, test, expect } from "bun:test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rl = require("../scripts/row-labels.js");
const all = rl.labelsOf(Object.keys(rl.TEMPLATES));

describe("row labels", () => {
  test("the registry covers exactly the templates' label tables", () => {
    expect(all.length).toBeGreaterThan(30);
    expect(all.filter((l: string) => !rl.REGISTRY.es[l])).toEqual([]);   // a template label with no Spanish entry
    expect(Object.keys(rl.REGISTRY.es).filter((k) => !all.includes(k))).toEqual([]);   // an entry no template carries
  });

  test("label tables: literal first cells only, keyed by anchor and header", () => {
    const seam = rl.labelTables().seam;
    expect(seam.find((t: any) => t.anchor === "Failure semantics").labels).toEqual(["timeout", "downstream unavailable", "poison message", "partial failure", "version mismatch"]);
    expect(seam.find((t: any) => t.key === "audience|read first in this document").labels).toEqual(["Dev", "QA", "Ops / SRE"]);   // bold role names, unbolded
    expect(rl.labelTables().ekonte.some((t: any) => t.key.startsWith("hop|"))).toBe(false);   // numbered rows are data, not labels
    expect(rl.labelTables().cutsheet.some((t: any) => t.key.startsWith("section|"))).toBe(false);   // `§ [Anchor]` rows are data
  });

  test("technical terms stay English — registered as themselves", () => {
    ["timeout", "poison message", "Error budget", "Dev", "QA", "Ops / SRE"].forEach((t) => expect(rl.translate(t, "es")).toBe(t));
    expect(rl.translate("Owned by upstream", "es")).toBe("Propiedad del upstream");
    expect(rl.translate("Decision", "en")).toBe("Decision");
  });

  test("a payload carries its template's labels under es, nothing under en", () => {
    const s = rl.payloadSection(["seam"], "es");
    expect(s).toContain("## Row Labels <!-- SECTION: Row Labels -->");
    expect(s).toContain("| poison message | poison message |");
    expect(s).toContain("| Owned by downstream | Propiedad del downstream |");
    expect(s).not.toContain("p99 latency");   // the Component Specification's, not the Interface Contract's
    expect(rl.payloadSection(["ekonte", "settei"], "es")).toContain("| Applies to | Aplica a |");
    expect(rl.payloadSection(["seam"], "en")).toBe("");
  });
});
