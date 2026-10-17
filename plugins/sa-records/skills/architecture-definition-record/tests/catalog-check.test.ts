/**
 * catalog-check.js — the size gate of an institutional catalog (workflows/catalog-mode.md), and the record reader it
 * shares with docs-stats.js and tdr-check.js (scripts/shared/record-budgets.js).
 */
import { describe, test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, measure, readCatalog } = require("../scripts/catalog-check.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { recordSections } = require("../../../scripts/shared/record-budgets.js");

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
const adr = (decision: number, extra = "") =>
  `# ADR-001: T\n\n| Field | Value |\n|---|---|\n| Status | Accepted |\n\n## 1. Context\n\n${words(10)}\n\n## 2. Decision\n\n${words(decision)}\n\n## 9. Review History\n\n| Date | Reviewer | Action | Change |\n|---|---|---|---|\n| 2026-09-01 | Board | Amended | ${extra || words(5)} |\n`;

function catalog(files: Record<string, string>, size: object = {}): string {
  const root = mkdtempSync(join(tmpdir(), "adr-catalog-"));
  mkdirSync(join(root, ".sa-skills"));
  mkdirSync(join(root, "es"));
  writeFileSync(join(root, ".sa-skills", "adr-catalog.json"), JSON.stringify({
    schema: "adr-catalog/1", role: "institutional-catalog",
    editions: [{ lang: "en", dir: ".", normative: true }, { lang: "es", dir: "es" }], size,
  }));
  for (const [p, body] of Object.entries(files)) writeFileSync(join(root, p), body);
  return root;
}

describe("the shared record reader", () => {
  test("a numbered heading is read by its name: `## 2. Decision` is the Decision", () => {
    expect(recordSections(adr(20)).map((s: any) => s.key)).toEqual(["context", "decision", "log"]);
  });
  test("a multi-line comment is not counted, and line numbers survive it", () => {
    const s = recordSections("## Context\n<!--\none two three\n-->\nfour\n## Decision\nfive\n");
    expect(s[0].words).toBe(1);
    expect(s[1].line).toBe(6);
  });
  test("the log table's header row is not an entry; a Retained vocabulary declaration is not counted", () => {
    const long = `${words(20)} Retained vocabulary: "${words(30)}"`;
    const log = recordSections(adr(20, long)).find((s: any) => s.key === "log");
    expect(log.entries.length).toBe(1);
    expect(log.entries[0].words).toBeLessThan(38);
  });
});

describe("catalog-check", () => {
  test("no marker is not a catalog", () => {
    expect(readCatalog(mkdtempSync(join(tmpdir(), "no-catalog-")))).toBeNull();
  });
  test("a marker needs exactly one normative edition", () => {
    const root = catalog({});
    writeFileSync(join(root, ".sa-skills", "adr-catalog.json"), JSON.stringify({ role: "institutional-catalog", editions: [{ lang: "en", dir: "." }] }));
    expect(() => readCatalog(root)).toThrow("exactly one edition is normative");
  });
  test("every institutional ADR is gated on the normative edition; a translation over budget is reported only", () => {
    const r = check(catalog({ "ADR-001-a.md": adr(600), "ADR-002-b.md": adr(100), "es/ADR-002-b.md": adr(900) }));
    expect(r.fail).toEqual(["ADR-001: Decision: 600 words (≤ 500)"]);
    expect(r.ok).toBe(1);
    expect(r.reported).toEqual([{ lang: "es", dir: "es", over: 1 }]);
  });
  test("an exception's ceiling gates the section; a stale exception or pending entry fails", () => {
    const files = { "ADR-001-a.md": adr(600), "ADR-002-b.md": adr(100), "ADR-003-c.md": adr(100) };
    const r = check(catalog(files, {
      pending: ["ADR-003"],
      exceptions: { "ADR-001": { ceilings: { decision: 620 }, reason: "rule tables" }, "ADR-002": { ceilings: {}, reason: "x" } },
    }));
    expect(r.excepted).toEqual(["ADR-001"]);
    expect(r.fail).toEqual([
      "ADR-002: within budget but still in exceptions — remove it from the list",
      "ADR-003: within budget but still in pending — remove it from the list",
    ]);
  });
  test("a section grown past its ceiling fails with the ceiling named", () => {
    const r = check(catalog({ "ADR-001-a.md": adr(700) }, { exceptions: { "ADR-001": { ceilings: { decision: 620 }, reason: "r" } } }));
    expect(r.fail).toEqual(["ADR-001: Decision: 700 words (≤ 620 ceiling)"]);
  });
  test("project ADRs (101+) in a catalog root are not the catalog's", () => {
    expect(check(catalog({ "ADR-101-p.md": adr(900) })).ok).toBe(0);
    expect(measure(adr(900)).findings.length).toBeGreaterThan(0);
  });
});
