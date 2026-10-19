/**
 * kit-debt.js — a component's technical debt written by code into its Component Specification § 7: one row per TDR the
 * descriptor's **Technical Debt:** line names, replaced on every run, removed when none is named, inside the section.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { run, apply } = require("../scripts/kit-debt.js");
const D = mkdtempSync(join(tmpdir(), "sa-kit-debt-"));
afterAll(() => rmSync(D, { recursive: true, force: true }));
const w = (p: string, s: string) => { mkdirSync(join(D, p, ".."), { recursive: true }); writeFileSync(join(D, p), s); };
const rd = (p: string) => readFileSync(join(D, p), "utf8");

const SPEC = "# Component Specification — Hub API\n\n## 6. Data ownership <!-- SECTION: Data Ownership -->\n\nOrders.\n\n---\n\n## 7. Constraints <!-- SECTION: Constraints -->\n\n**Mandated:**\n\n- TLS.\n\n---\n\n## 8. Deliberately unspecified <!-- SECTION: Deliberately Unspecified -->\n\nThe team decides.\n";
const descriptor = (debt: string) => `# Hub API\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n**Component Version:** 1.0.0\n**Last Updated:** 2026-01-01\n${debt}\n## Purpose\n\nTakes orders.\n`;
const tdr = (id: string, title: string, status: string) => `---\nstatus: ${status}\n---\n\n# ${id}: ${title}\n\n## Status\n\n\`${status}\`\n`;

function project(debt: string) {
  w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk\n");
  w("docs/components/order-desk/01-hub-api.md", descriptor(debt));
  w("tdr/TDR-001-batch-settlement.md", tdr("TDR-001", "Batch settlement", "Open"));
  w("tdr/TDR-002-keys-never-purged.md", tdr("TDR-002", "Keys never purged", "In Progress"));
  w("handoffs/.manifest.json", JSON.stringify({ version: "4", cut_sheets: { "hub-api": { cut_sheet_file: "components/01-hub-api.md" } } }));
  w("handoffs/components/01-hub-api.md", SPEC);
}

describe("kit-debt", () => {
  test("the table goes at the end of § 7, inside the section, one row per named TDR with its link, title and status", () => {
    project("**Technical Debt:** [TDR-001](../../../tdr/TDR-001-batch-settlement.md) · [TDR-002](../../../tdr/TDR-002-keys-never-purged.md)\n");
    expect(run(D)).toEqual([{ slug: "hub-api", file: "components/01-hub-api.md", tdrs: ["TDR-001", "TDR-002"], changed: true }]);
    const out = rd("handoffs/components/01-hub-api.md");
    expect(out).toContain("- TLS.\n\n### Technical debt <!-- LABEL: Technical Debt -->\n");
    expect(out).toContain("| [TDR-001](../../tdr/TDR-001-batch-settlement.md) | Batch settlement | Open |");
    expect(out).toContain("| [TDR-002](../../tdr/TDR-002-keys-never-purged.md) | Keys never purged | In Progress |\n\n---\n\n## 8.");
    expect(run(D)[0].changed).toBe(false);   // idempotent
  });

  test("a TDR the descriptor stops naming leaves the table; with none named the specification is back to what it was", () => {
    project("**Technical Debt:** [TDR-001](../../../tdr/TDR-001-batch-settlement.md) · [TDR-002](../../../tdr/TDR-002-keys-never-purged.md)\n");
    run(D);
    w("docs/components/order-desk/01-hub-api.md", descriptor("**Technical Debt:** [TDR-001](../../../tdr/TDR-001-batch-settlement.md)\n"));
    run(D);
    expect(rd("handoffs/components/01-hub-api.md")).not.toContain("TDR-002");
    w("docs/components/order-desk/01-hub-api.md", descriptor(""));
    expect(run(D)[0]).toMatchObject({ tdrs: [], changed: true });
    expect(rd("handoffs/components/01-hub-api.md")).toBe(SPEC);
  });

  test("a specification without its § 7 anchor is reported, never written", () => {
    expect(apply("# Spec\n\n## 1. Responsibility <!-- SECTION: Responsibility -->\n", "### Technical debt <!-- LABEL: Technical Debt -->").error).toBe("no § 7 Constraints anchor");
  });
});
