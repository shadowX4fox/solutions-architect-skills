/**
 * kit-edit.js check — a part edited in place against its previous text, section by section: dates and the Architecture
 * Version row are not a change, a changed section the generator did not declare is named and, with --restore, put back.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, sections } = require("../scripts/kit-edit.js");
const D = mkdtempSync(join(tmpdir(), "sa-kit-edit-check-"));
afterAll(() => rmSync(D, { recursive: true, force: true }));

const doc = (v: string, date: string, resp: string, cons: string) =>
  `# Component Specification — Hub API\n\n| Field | Value |\n|---|---|\n| Architecture Version | ${v} |\n| Generated | ${date} |\n\n## 1. Responsibility <!-- SECTION: Responsibility -->\n\n${resp}\n\n## 7. Constraints <!-- SECTION: Constraints -->\n\n${cons}\n\n*Generated on ${date}*\n`;

describe("kit-edit check", () => {
  test("sections split at their anchors, the text before the first one is the preamble", () => {
    expect(sections(doc("1.0.0", "2026-01-01", "a", "b")).map((s: any) => s.key)).toEqual(["(preamble)", "Responsibility", "Constraints"]);
  });

  test("a new version and date change nothing; a declared section may change", () => {
    const prev = join(D, "p1.md"), now = join(D, "n1.md");
    writeFileSync(prev, doc("1.0.0", "2026-01-01", "Takes orders.", "None."));
    writeFileSync(now, doc("1.1.0", "2026-02-02", "Takes orders.", "- Debt: TDR-001."));
    expect(check(now, prev, ["Constraints"])).toMatchObject({ changed: ["Constraints"], undeclared: [] });
  });

  test("an undeclared change is named, and --restore puts the previous text back, keeping the new version", () => {
    const prev = join(D, "p2.md"), now = join(D, "n2.md");
    writeFileSync(prev, doc("1.0.0", "2026-01-01", "Takes orders.", "None."));
    writeFileSync(now, doc("1.1.0", "2026-02-02", "Accepts and validates incoming orders.", "- Debt: TDR-001."));
    expect(check(now, prev, ["Constraints"])).toMatchObject({ undeclared: ["Responsibility"], restored: [] });
    const r = check(now, prev, ["Constraints"], { restore: true });
    expect(r.restored).toEqual(["Responsibility"]);
    const out = readFileSync(now, "utf8");
    expect(out).toContain("Takes orders.");
    expect(out).toContain("- Debt: TDR-001.");
    expect(out).toContain("| Architecture Version | 1.1.0 |");
  });
});
