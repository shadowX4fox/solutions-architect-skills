/**
 * docs-stats.js — the size-budget report over a generated architecture corpus.
 * Builds a small project in a temp dir that trips every finding once, and one that trips none.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stats = require("../scripts/docs-stats.js");

const TMP = join(__dirname, ".temp-docs-stats");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };

const longCell = Array(45).fill("palabra").join(" ");
const sentence = "The Payment Service validates the token and forwards the call. It also retries on timeout.";

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", "# Demo\n\n| S1 | x |\n");
  w("docs/01-system-overview.md", `# Overview\n\n${sentence}\n\n${sentence}\n\n${sentence}\n`);
  w("docs/02-architecture-principles.md", [
    "## Architecture Principles (9 Core Principles) <!-- SECTION: Architecture Principles -->",
    "### 1. Separation of Concerns <!-- PRINCIPLE: Separation of Concerns -->",
    "**Description:** <!-- LABEL: Description -->", "One rule. And a second sentence that should not be here.",
    "**Implementation:** <!-- LABEL: Implementation -->", "- a", "- b", "- c", "- d", "- e", "- f",
    "**Trade-offs:** <!-- LABEL: Trade-offs -->", "- x", "- y", "- z", "- w",
    "### 2. High Availability <!-- PRINCIPLE: High Availability -->",
    "**Description:** <!-- LABEL: Description -->", "We accept 3x cost for 99.9 % availability.",
    "**Implementation:** <!-- LABEL: Implementation -->", "- one fact per ADR-101",
    "**Trade-offs:** <!-- LABEL: Trade-offs -->", "- cost",
  ].join("\n"));
  w("docs/04-data-flow-patterns.md", [
    "## Data Flow Patterns", "### Phase Catalog <!-- SECTION: Phase Catalog -->",
    "#### Phase 1 — Validate", "**Hops**: A → B", "```mermaid\nsequenceDiagram\n  A->>B: 1. validate\n```",
    "### End-to-End Wire Sequences <!-- SECTION: End-to-End Wire Sequences -->",
    "#### Flow 1 — Order (full wire sequence)", "```mermaid\nsequenceDiagram\n  A->>B: 1. order\n```",
  ].join("\n"));
  w("docs/10-risks-and-technical-debt.md", `## 13. Risks\n\n| Risk | Likelihood | Impact | Mitigation |\n|---|---|---|---|\n| ${longCell} | High | High | see ADR-101 |\n`);
  w("docs/11-references.md", "## References\n\n| ADR | Title |\n|---|---|\n| ADR-101 | One |\n| ADR-102 | Two |\n");
  w("docs/CHANGELOG.md", "# Changelog\n\n## [1.0.0] - 2026-01-01\n\n" + "- line\n".repeat(1200) + "\n## [0.9.0] - 2025-12-01\n\n- small\n");
  w("docs/components/01-payment-service.md", "# Payment Service\n\n" + "x".repeat(11 * 1024));
  w("docs/components/README.md", "# Index\n");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("docs-stats report", () => {
  const rep = () => stats.report(TMP);
  const rules = () => rep().findings.map((f: { rule: string }) => f.rule);

  test("lists every corpus file with its budget and flags the ones over it", () => {
    const r = rep();
    const comp = r.rows.find((x: { file: string }) => x.file === "docs/components/01-payment-service.md");
    expect(comp.budget).toBe(10 * 1024);
    expect(comp.over).toBe(true);
    expect(r.rows.find((x: { file: string }) => x.file === "ARCHITECTURE.md").over).toBe(false);
    expect(rules()).toContain("file-budget");
  });

  test("principle budgets: description sentences, implementation bullets, trade-off bullets", () => {
    const f = rep().findings.filter((x: { rule: string; where: string }) => x.where === "principle 1").map((x: { rule: string }) => x.rule);
    expect(f).toContain("principle-description");
    expect(f).toContain("principle-implementation");
    expect(f).toContain("principle-tradeoffs");
    expect(rep().findings.some((x: { where: string }) => x.where === "principle 2")).toBe(false);
  });

  test("a hand-drawn end-to-end sequence is reported (the section is flow-compose.js's), a phase panel is not", () => {
    expect(rules()).not.toContain("phase-diagrams");
    const f = rep().findings.find((x: { rule: string }) => x.rule === "hand-drawn-e2e");
    expect(f.detail).toMatch(/^1 end-to-end sequence\(s\) not derived by flow-compose\.js/);
    expect(rules()).not.toContain("phases-undrawn");                                     // the fixture's one phase carries its panel
  });

  test("risk cells over the word budget, duplicated ADR index, oversized changelog entry", () => {
    expect(rules()).toContain("risk-cell-length");
    expect(rules()).toContain("adr-index-duplicated");
    const cl = rep().findings.filter((x: { rule: string }) => x.rule === "changelog-entry");
    expect(cl.length).toBe(1);
    expect(cl[0].where).toContain("[1.0.0]");
  });

  test("a component described in three multi-sentence paragraphs outside its file", () => {
    const f = rep().findings.find((x: { rule: string }) => x.rule === "describe-once");
    expect(f.where).toBe("Payment Service");
  });

  test("--file keeps the rows to one file and its own findings", () => {
    const r = stats.report(TMP, { file: "docs/02-architecture-principles.md" });
    expect(r.rows.length).toBe(1);
    expect(r.findings.every((x: { file: string }) => x.file === "docs/02-architecture-principles.md" || x.file === "docs/*.md")).toBe(true);
  });

  test("render is a Markdown table plus a warning list, and a clean corpus says so", () => {
    expect(stats.render(rep())).toMatch(/^\| File \| KB \| Budget \|/);
    const clean = join(__dirname, ".temp-docs-stats-clean");
    rmSync(clean, { recursive: true, force: true }); mkdirSync(join(clean, "docs"), { recursive: true });
    writeFileSync(join(clean, "ARCHITECTURE.md"), "# A\n"); writeFileSync(join(clean, "docs", "01-system-overview.md"), "# O\n\nOne line.\n");
    const out = stats.render(stats.report(clean));
    expect(out).toContain("No budget findings.");
    rmSync(clean, { recursive: true, force: true });
  });
});

// ── shape budgets beyond the principles, enforcement, project-ADR report ──────────────────────────
describe("docs-stats shape budgets", () => {
  const T2 = join(__dirname, ".temp-docs-stats-shapes");
  const w2 = (rel: string, body: string) => { mkdirSync(join(T2, rel, ".."), { recursive: true }); writeFileSync(join(T2, rel), body, "utf-8"); };
  const words = (n: number) => Array(n).fill("palabra").join(" ");
  beforeAll(() => {
    rmSync(T2, { recursive: true, force: true });
    w2("ARCHITECTURE.md", "# Demo\n");
    w2("docs/10-risks-and-technical-debt.md", [
      "| Riesgo | Probabilidad | Impacto | Mitigación |", "|---|---|---|---|",
      `| ${words(25)} | Media | Alto | ${words(35)} |`,                 // within every column budget
      `| ${words(31)} | Media alta hoy | Alto | ${words(41)} |`,         // Riesgo and Mitigación over
    ].join("\n"));
    w2("docs/05-integration-points.md", [
      "### 7.1 Inventario", "| ID | From | To |", "|---|---|---|", `| I-01 | A | B |`, `| I-02 | A | ${words(20)} |`,
      "### 7.3 Salientes", `**I-02 — Detalle**`, "", words(140), "", `**I-01 — Corto**`, "", words(10),
    ].join("\n"));
    w2("docs/components/01-big.md", "# Big\n\n<!-- EXPLORER_HEADER\n" + "k".repeat(4 * 1024) + "\n-->\n" + "x".repeat(11 * 1024));
    w2("docs/components/02-huge.md", "# Huge\n\n" + "x".repeat(13 * 1024));
    w2("adr/ADR-101-long.md", `# ADR-101\n\n## Context\n\n${words(1000)}\n\n## Decision\n\n${words(600)}\n\n## Review History\n\n${words(3000)}\n`);
    w2("adr/ADR-102-short.md", `# ADR-102\n\n## Decision\n\n${words(800)}\n\n## Review History\n\n${words(3000)}\n`);
    w2("adr/ADR-050-institutional.md", `# ADR-050\n\n## Decision\n\n${words(5000)}\n`);
    w2("adr/ADR-103-es.md", `# ADR-103\n\n## Decisión <!-- SECTION: Decision -->\n\n${words(300)}\n\n### Detalle\n\n${words(100)}\n\n## Review History\n\n| Date | Author | Status | Change |\n|---|---|---|---|\n| 2026-09-20 | Arq | Amended | ${words(60)} |\n| 2026-09-21 | Arq | Amended | one line |\n`);
    w2("tdr/TDR-001-big.md", `# TDR-001\n\n## Status\n\nOpen\n\n## Description <!-- SECTION: Description -->\n\n${words(400)}\n\n## Impact <!-- SECTION: Impact -->\n\n${words(100)}\n\n## History <!-- SECTION: History -->\n\n- 2026-09-01 — ${words(50)}\n- 2026-09-02 — opened\n`);
    w2("tdr/TDR-002-fine.md", `# TDR-002\n\n## Description\n\n${words(150)}\n\n## History\n\n- 2026-09-01 — opened\n`);
  });
  afterAll(() => rmSync(T2, { recursive: true, force: true }));
  const rep = (opts = {}) => stats.report(T2, opts);
  const by = (r: any, rule: string) => r.findings.filter((f: any) => f.rule === rule);

  test("risk cells are held to their column's budget, and the finding names column and line", () => {
    const f = by(rep(), "risk-cell-length");
    expect(f.length).toBe(1);
    expect(f[0].where).toMatch(/^line 4/);
    expect(f[0].detail).toContain("Riesgo 31 words (≤ 30)");
    expect(f[0].detail).not.toContain("Probabilidad");                    // three words is within its budget
    expect(f[0].detail).toContain("Mitigación 41 words (≤ 40)");
  });

  test("an I-nn block counts its inventory row and its detail block together", () => {
    const f = by(rep(), "integration-block-length");
    expect(f.map((x: any) => x.where)).toEqual(["I-02"]);                   // 20 in the row + 140 in the block
  });

  test("a descriptor over 12 KB is capped, the EXPLORER_HEADER not counted", () => {
    const f = by(rep(), "descriptor-size");
    expect(f.map((x: any) => x.file)).toEqual(["docs/components/02-huge.md"]);
  });

  test("project ADRs: a budget per section, the body total without the log, one line per log entry; institutional ADRs never", () => {
    const r = rep();
    expect(by(r, "adr-section-length").map((x: any) => `${x.file}#${x.where}`)).toEqual(["adr/ADR-101-long.md#Context", "adr/ADR-101-long.md#Decision", "adr/ADR-102-short.md#Decision"]);
    expect(by(r, "adr-body-length").map((x: any) => x.file)).toEqual(["adr/ADR-101-long.md"]);         // 1,600 words; ADR-102's 800 are under 1,500
    expect(by(r, "adr-log-entry-length").map((x: any) => [x.file, x.line])).toEqual([["adr/ADR-103-es.md", 15]]);
    expect(r.findings.some((f: any) => /ADR-103/.test(f.file) && f.rule === "adr-section-length")).toBe(false);   // 400 words with its subsection, anchored in Spanish — under 500
    expect(r.findings.some((f: any) => /ADR-050/.test(f.file))).toBe(false);
  });

  test("TDRs: a budget per section and one line per History note", () => {
    const r = rep();
    expect(by(r, "tdr-section-length").map((x: any) => `${x.file}#${x.where}`)).toEqual(["tdr/TDR-001-big.md#Description"]);
    expect(by(r, "tdr-log-entry-length").map((x: any) => x.file)).toEqual(["tdr/TDR-001-big.md"]);
    expect(r.findings.some((f: any) => /TDR-002/.test(f.file))).toBe(false);
  });

  test("report-only by default: every finding is a WARNING and nothing blocks", () => {
    const r = rep();
    expect(r.mode).toBe("report-only");
    expect(r.blocking).toBe(0);
    expect(r.findings.every((f: any) => f.severity === "WARNING")).toBe(true);
  });

  test("enforcing (--enforce or the PROSE_STYLE stamp): shape budgets block, the rest stays WARNING", () => {
    const r = rep({ enforce: true });
    expect(r.mode).toBe("enforcing");
    for (const rule of ["risk-cell-length", "integration-block-length", "descriptor-size", "adr-section-length", "adr-body-length", "tdr-section-length", "tdr-log-entry-length"]) expect(by(r, rule)[0].severity).toBe("BLOCKING");
    expect(by(r, "file-budget").every((f: any) => f.severity === "WARNING")).toBe(true);
    w2("ARCHITECTURE.md", "# Demo\n<!-- PROSE_STYLE: v1 -->\n");
    expect(rep().mode).toBe("enforcing");
    expect(stats.render(rep())).toContain("✗ BLOCKING");
    w2("ARCHITECTURE.md", "# Demo\n");
  });
});
