/**
 * section-prepare.js — the payload of one section: the guide by range, the type templates, the inputs the
 * section takes, its parents as outlines (whole on request), the facts it cites, and a manifest of what
 * went in and what was missing.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prepare, SECTIONS } = require("../scripts/section-prepare.js");
const GOV = !!require("../../../scripts/shared/packs.js").designLanguageDir();   // a design language in force (an institution pack's): the governed tests run only then
const SCRIPT = join(__dirname, "..", "scripts", "section-prepare.js");

const TMP = join(__dirname, ".temp-section-prepare");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
const header = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: orders\ntechnologies: React\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: One line.\nrelated_adrs: ADR-101\n-->`;
const doc = (title: string, summary: string, body: string) => `# ${title}\n\n<!-- EXPLORER_HEADER\nkey_concepts: a, b\ntechnologies: React\ncomponents: web-app\nscope: ${title}.\nrelated_adrs: ADR-101\n-->\n\n> ${summary}\n\n${body}\n`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- ARCHITECTURE_STATUS: Draft -->\n<!-- DOC_LANGUAGE: es -->\n<!-- ARCHITECTURE_TYPE: ENTERPRISE -->\n\n# Order Desk — Arquitectura\n`);
  w("PRODUCT_OWNER_SPEC.md", `# PO Spec\n\n## 1. Vision\n\nThe desk.\n\n## 7. Business Constraints\n\n- PCI in scope.\n- One region.\n\n## 8. Risks\n\nNone.\n`);
  w("BIAN_ALIGNMENT.md", `# BIAN Alignment\n\n<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->\n\n## Summary\n\nTwo domains.\n`);
  w("hld.mmd", `flowchart TB\n  A[Web App] --> B[Hub API]\n`);
  w("adr-context.md", `## ADR Context Block\n\n| Candidate | Status |\n|---|---|\n| Event bus | PENDING |\n`);
  w("docs/01-system-overview.md", doc("Descripción del Sistema", "The desk in thirty seconds.", `<!-- HLD_SOURCE: hld.mmd -->\n<!-- HLD_FORMAT: mermaid -->\n\n## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->\n\nText.\n\n### 1.1 Key Metrics\n\n| Metric | Value |\n|---|---|\n| TPS | 100 |\n\n## 2. Descripción <!-- SECTION: System Overview -->\n\nMore.`));
  w("docs/02-architecture-principles.md", doc("Principios", "Nine principles.", `## Principios de Arquitectura (9 Principios) <!-- SECTION: Architecture Principles -->\n\n### 1. Separación <!-- PRINCIPLE: Separation of Concerns -->\n\nOne.`));
  w("docs/03-architecture-layers.md", doc("Capas", "Six layers.", `| Layer | Containers | Inside boundary |\n|---|---|---|\n| **L1 — Canal** | Web App | Sí |\n| **L2 — Socios** | Hub API | No |\n`));
  w("docs/05-integration-points.md", doc("Integraciones", "One integration.", `| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Web App\` | \`Hub API\` | HTTPS/JSON | Request-response | Partner |\n`));
  w("docs/06-technology-stack.md", doc("Stack", "React and Kong.", `## 8. Stack\n\nText.`));
  w("docs/components/order-desk.md", `# Order Desk\n\n${header("order-desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", `# Web App\n\n${header("web-app", "web-application")}\n\n**Type:** Web Application\n**Technology:** [React]\n**Internal Name:** \`CHL-1\`\n**C4 Level:** Container (L2)\n\n## Purpose\n\nOne.\n`);
  w("adr/README.md", `# ADR Index\n\n| ADR | Title | Status |\n|---|---|---|\n| ADR-101 | Keep the desk | Accepted |\n`);
  w("adr/ADR-101-x.md", `# ADR-101: Keep the desk\n\n**Status**: Accepted\n**Scope**: Project\n\n## Context\n\nWhy.\n\n## Decision\n\n### Summary\n\nThe **desk** stays on \`Kong\`; orders queue for [one hour](x.md).\n\n### Detailed Decision\n\nMore.\n`);
  w("tdr/TDR-001-debt.md", `# TDR-001: A debt\n\n**Status**: Open\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const titles = (text: string) => [...text.matchAll(/^# ▸ (.+)$/gm)].map((m) => m[1]);

describe("section-prepare", () => {
  test("the section table covers the thirteen sections and their targets", () => {
    expect(Object.keys(SECTIONS).map(Number)).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(SECTIONS[9]).toMatchObject({ file: "docs/07-security-architecture.md", tier: 6, parents: ["01", "02", "05", "06"] });
    expect(SECTIONS[3]).toMatchObject({ tier: 4, parents: ["01", "03", "06"], facts: ["components", "layers", "adrs"] });   // after the layers and the stack its gate reads
    expect(SECTIONS[12].tier).toBe(8);                                                                                    // last: its header names components that must exist
    expect(Object.values(SECTIONS).map((s: any) => s.tier).sort((a: number, b: number) => a - b)).toEqual([0, 0, 1, 2, 3, 4, 4, 5, 6, 6, 7, 8]);
    const list = Bun.spawnSync(["bun", SCRIPT, "--list"], { stdout: "pipe" }).stdout.toString();
    expect(list).toMatch(/\| 13 — Risks and Technical Debt \| `docs\/10-risks-and-technical-debt.md` \| 0 \|/);
  });

  test("section 1 carries the guide's Sections 1 and 2 by range, the PO Spec and BIAN whole, the Mermaid HLD from the docs/01 marker", () => {
    const r = prepare(TMP, 1);
    const t = titles(r.text);
    expect(t.slice(0, 2)).toEqual(["Guide — Section 1", "Guide — Section 2"]);
    expect(t).toContain("Guide — Authoring budgets");
    expect(t).toContain("Guide — Explorer-Friendly Headers");
    expect(t).toContain("PO Spec");
    expect(t.find((x) => x.startsWith("Capability alignment — BIAN"))).toBeDefined();
    expect(t.find((x) => x.startsWith("HLD (Mermaid"))).toBeDefined();
    expect(r.text).toMatch(/A\[Web App\] --> B\[Hub API\]/);
    expect(r.text).toMatch(/^## Section 1: Executive Summary/m);
    expect(r.text).toMatch(/^## Section 2: System Overview/m);
    expect(r.text).not.toMatch(/^## Section 3:/m);
    expect(r.text).toMatch(/\| 1 \| `Executive Summary` \| Executive Summary \| Resumen Ejecutivo \|/);   // the registry row for the language
    expect(r.text).toMatch(/\| Document language \| es \|/);
    expect(r.missing).toEqual([]);
  });

  test("section 3 takes the PO Spec's constraints section, the ADR index, the ADR facts, and reports the missing ADR Context Block", () => {
    const r = prepare(TMP, 3);
    expect(titles(r.text)).toContain("PO Spec — business constraints");
    expect(r.text).toMatch(/## 7\. Business Constraints\n\n- PCI in scope\.\n- One region\./);
    expect(r.text).not.toMatch(/## 8\. Risks/);
    expect(titles(r.text)).toContain("ADR index");
    expect(r.text).toMatch(/\| ADR-101 \| Keep the desk \| Accepted \| Project \|/);
    expect(r.missing).toEqual(["ADR Context Block: not saved — pass --adr-context <file> when Step 0.6 produced one"]);
    const withCtx = prepare(TMP, 3, { adrContext: join(TMP, "adr-context.md") });
    expect(titles(withCtx.text)).toContain("ADR Context Block (Step 0.6)");
    expect(withCtx.missing).toEqual([]);
  });

  test("section 4 carries the type's Section 4 template and architecture rules, stripped of their metadata comments; section 5 the Section 5 template and the C4 translation", () => {
    const r4 = prepare(TMP, 4);
    expect(titles(r4.text)).toContain("ENTERPRISE — SECTION_4_ENTERPRISE.md");
    expect(titles(r4.text)).toContain("ENTERPRISE — ENTERPRISE-ARCHITECTURE.md");
    expect(r4.text).not.toMatch(/^<!-- ARCHITECTURE_TYPE: ENTERPRISE -->$/m);
    const r5 = prepare(TMP, 5, { type: "microservices" });
    expect(titles(r5.text)).toContain("MICROSERVICES — SECTION_5_MICROSERVICES.md");
    expect(titles(r5.text)).toContain("MICROSERVICES — MICROSERVICES-TO-C4-TRANSLATION.md");
    const rN = prepare(TMP, 5, { type: "N-LAYER" });
    expect(rN.missing).toContain("section5 for N-LAYER: this type has no such file (generic template applies)");
  });

  test("section 9 gets its parents as outlines (whole with --full), the PO Spec outline, and the components / integrations / ADR facts as tables", () => {
    const r = prepare(TMP, 9);
    const t = titles(r.text);
    expect(t.filter((x) => x.startsWith("Parent — ")).map((x) => x.replace(/ \(.*$/, ""))).toEqual(["Parent — docs/01-system-overview.md", "Parent — docs/02-architecture-principles.md", "Parent — docs/05-integration-points.md", "Parent — docs/06-technology-stack.md"]);
    expect(r.text).toMatch(/> The desk in thirty seconds\.\n\nHeadings \(line {2}heading\):\n {2}\d+ {2}## 1\. Resumen Ejecutivo/);
    expect(r.text).not.toMatch(/\| TPS \| 100 \|/);                                  // an outline carries no body
    expect(r.text).toMatch(/\| Web App \| web-app \| yes \| order-desk \| Web Application \| React \| CHL-1 \|/);
    expect(r.text).toMatch(/\| I-01 \| Web App \| Hub API \| HTTPS\/JSON \| Request-response \| Partner \|/);
    expect(r.text).toMatch(/PO Spec — outline/);
    const full = prepare(TMP, 9, { full: "01" });
    expect(titles(full.text)).toContain("Parent — docs/01-system-overview.md (whole)");
    expect(full.text).toMatch(/\| TPS \| 100 \|/);
    expect(full.bytes).toBeGreaterThan(r.bytes);
  });

  test("a parent not written yet and a missing PO Spec are reported, never invented; section 13 carries the TDR facts", () => {
    const r7 = prepare(TMP, 7);
    expect(r7.missing).toContain("parent docs/04: not written yet");
    expect(r7.text).toMatch(/\| 1 \| Canal \| Web App \| yes \|/);
    const r13 = prepare(TMP, 13);
    expect(r13.text).toMatch(/\| TDR-001 \| A debt \| Open \|/);
    expect(r13.missing).toEqual([]);
  });

  test("the CLI writes .cache/sa-skills/payloads/section-NN.md and rejects an unknown section", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--section", "9"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = join(TMP, ".cache", "sa-skills", "payloads", "section-09.md");
    expect(existsSync(out)).toBe(true);
    expect(readFileSync(out, "utf-8")).toMatch(/^# Section 9 payload — Security Architecture/);
    expect(r.stderr.toString()).toMatch(/^Wrote .*section-09\.md \(\d+\.\d KB\)\nIncluded \(\d+\):/);
    const bad = Bun.spawnSync(["bun", SCRIPT, TMP, "--section", "2"], { stdout: "pipe", stderr: "pipe" });
    expect(bad.exitCode).toBe(2);
    expect(bad.stderr.toString()).toMatch(/no section 2 — one of 1, 3, 4/);
  });

  test("the ADR facts carry each project ADR's decision in one line, from its Summary (8.88.1)", () => {
    const r = prepare(TMP, 3);
    expect(r.text).toContain("Decision (from its Summary");
    expect(r.text).toContain("| The desk stays on Kong; orders queue for one hour. |");
  });

  // 8.102.0 — from the three 2026-09-30 control runs: every rule below was missing from or wrong in a payload
  test("a heading inside a code fence does not end a guide rule: the header rule carries its field guidance and component_self", () => {
    const r = prepare(TMP, 7);
    const rule = r.text.split("# ▸ Guide — Explorer-Friendly Headers")[1].split("\n# ▸ ")[0];
    expect(rule).toContain("component_self");
    expect(rule).toMatch(/120/);
    expect(r.included.find((x: string) => x.startsWith("Guide — Explorer-Friendly Headers"))).not.toMatch(/lines 150–176/);
  });

  test("relative --po-spec, --hld and --adr-context resolve against the project root, whatever the cwd", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--section", "4", "--po-spec", "PRODUCT_OWNER_SPEC.md", "--hld", "hld.mmd", "--adr-context", "adr-context.md", "--json"], { stdout: "pipe", stderr: "pipe", cwd: "/" });
    expect(r.exitCode).toBe(0);
    const j = JSON.parse(r.stdout.toString());
    expect(j.missing.join("\n")).not.toMatch(/^HLD|ADR Context Block|not found \(|not saved/m);
    expect(j.included.join("\n")).toMatch(/HLD \(Mermaid/);
  });

  test("the manifest gives each part's line range in the payload, so a writer reads a part by offset (8.118.4)", () => {
    const { text } = prepare(TMP, 9, {});
    const lines = text.split("\n");
    const listed = [...text.matchAll(/^- L(\d+)–(\d+) · (.+)$/gm)];
    expect(listed.length).toBe(titles(text).length);
    for (const [, a, b, item] of listed) {
      expect(lines[Number(a) - 1]).toStartWith("# ▸ ");
      expect(item).toStartWith(lines[Number(a) - 1].slice(4) + " — ");
      expect(Number(b)).toBeGreaterThanOrEqual(Number(a));
      expect(lines[Number(b) - 1].trim()).not.toBe("");
    }
  });
  test("section 3 carries the Layer 1 principle rules and the type matrix for its architecture type", () => {
    const r = prepare(TMP, 3, { type: "ENTERPRISE" });
    const t = titles(r.text);
    expect(t.find((x) => x.startsWith("Principle rules — Layer 1"))).toBeDefined();
    expect(t.find((x) => x.startsWith("Principle rules — P-TYPE-MATRIX-01, ENTERPRISE"))).toBeDefined();
    expect(r.text).toContain("P-TRADEOFF-COUNT-01");
    expect(r.text).toContain("P-SPECIFIC-01");
  });

  test("the principle budget and P-TRADEOFF-COUNT-01 agree: exactly three Trade-offs", () => {
    const guide = readFileSync(join(__dirname, "..", "ARCHITECTURE_DOCUMENTATION_GUIDE.md"), "utf-8");
    expect(guide).toMatch(/\| Principle \(`docs\/02`\) \|[^\n]*exactly 3 Trade-offs/);
    expect(guide).not.toMatch(/≤ 3 Trade-offs/);
  });

  test.if(GOV)("section 7 carries the connection label grammar from the standard in force, and the guide's template is the inventory shape", () => {
    const r = prepare(TMP, 7);
    const t = titles(r.text);
    const g = t.find((x) => x.startsWith("Connection label grammar"));
    expect(g).toBeDefined();
    expect(r.text).toMatch(/Composition qualifiers: .*`publish`/);
    const s7 = r.text.split("# ▸ Guide — Section 7")[1].split("\n# ▸ ")[0];
    expect(s7).toContain("| # | From | To | Protocol | Pattern | Boundary |");
    expect(s7).toContain("**I-01 — ");
    expect(s7).not.toMatch(/\*\*Provider\*\*|Expected monthly cost/);
  });

  test("the components table marks which containers have their own file; a system's row-only container never reaches a header", () => {
    w("docs/components/payments-hub.md", `# Payments Hub\n\n${header("payments-hub", "external-system")}\n\n**C4 Level:** System (L1)\n**Type:** External System\n\n## Containers\n\n| Component | Type | Technology |\n|---|---|---|\n| Settlement Engine | Service | Java |\n`);
    const r = prepare(TMP, 7);
    expect(r.text).toContain("| Container (canonical name — write it exactly) | slug | own file |");
    expect(r.text).toMatch(/\| Web App \| web-app \| yes \|/);
    expect(r.text).toMatch(/\| Settlement Engine \| [a-z-]+ \| — row of its system \|/);
    expect(r.text).toContain("takes only the slugs whose **own file** is `yes`");
    rmSync(join(TMP, "docs/components/payments-hub.md"));
  });

  test("an ADR's decision is read in the Spanish edition too: `## 2. Decisión` → `### Resumen`", () => {
    const { adrDecision } = require("../scripts/section-prepare.js");
    w("adr/ADR-001-meta.md", "# ADR-001: ENTERPRISE\n\n## 1. Contexto\n\nPor qué.\n\n## 2. Decisión\n\n### Resumen\n\nAdoptar la **Arquitectura ENTERPRISE** de 6 capas.\n\n### Las 6 capas\n\nTabla.\n");
    expect(adrDecision(join(TMP, "adr/ADR-001-meta.md"))).toBe("Adoptar la Arquitectura ENTERPRISE de 6 capas.");
    rmSync(join(TMP, "adr/ADR-001-meta.md"));
  });
});
