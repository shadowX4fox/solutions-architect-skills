/**
 * sa-export-assemble.js — the two Solution Architecture export documents assembled by code: every block
 * routed once (briefing or reference, never both), the fixed reader guide, the Decisions Pending rules,
 * the fallback lines when a source is absent, and the parts for a translated export.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { assemble } = require("../scripts/sa-export-assemble.js");
const SCRIPT = join(__dirname, "..", "scripts", "sa-export-assemble.js");

const TMP = join(__dirname, ".temp-sa-export");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
const hdr = `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponents: web-app\nscope: s\nrelated_adrs: ADR-101\n-->`;
const MERMAID = (t: string) => "```mermaid\nflowchart TB\n  A[" + t + "] --> B\n```";

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.2.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk — Architecture\n`);
  w("docs/01-system-overview.md", `[Architecture](../ARCHITECTURE.md) > Overview\n\n# Order Desk — Architecture\n\n${hdr}\n\n> The desk.\n\n## 1. Executive Summary <!-- SECTION: Executive Summary -->\n\n**Key Metrics:** <!-- LABEL: Key Metrics -->\n\n- **Read TPS**: 100\n\n**Business Value:** <!-- LABEL: Business Value -->\n\n- Fewer calls.\n\n### 1.5 BIAN Capability Alignment\n\n| # | Business Area |\n|---|---|\n| 1 | Products |\n\n## 2. System Overview <!-- SECTION: System Overview -->\n\n### Problem Statement <!-- LABEL: Problem Statement -->\n\nThe desk fails.\n\n### Solution <!-- LABEL: Solution -->\n\nReplicate.\n\n### Design Drivers\n\n| Driver | Measures |\n|---|---|\n| Scale | TPS |\n`);
  w("docs/02-architecture-principles.md", `# Principles\n\n${hdr}\n\n## Architecture Principles (9 Core Principles) <!-- SECTION: Architecture Principles -->\n\n### 1. Separation <!-- PRINCIPLE: Separation of Concerns -->\n\n**Description:** One.\n`);
  w("docs/03-architecture-layers.md", `# Layers\n\n${hdr}\n\n## 4. Architecture Layers <!-- SECTION: Architecture Layers -->\n\n### 4.1 Layer table\n\n| Layer | Containers | Inside boundary |\n|---|---|---|\n| **L1 — Channel** | Web App | Yes |\n\n### 4.2 Layer 1\n\nProse.\n\n## Architecture Diagrams <!-- SECTION: Architecture Diagrams -->\n\n#### Diagram: Logical View\n\n${MERMAID("LV")}\n\n#### Diagram: C4 Level 1 — System Context\n\n${MERMAID("L1")}\n\n#### Diagram: C4 Level 2 — Container\n\n${MERMAID("L2")}\n\n#### Diagram: Detailed View\n\n${MERMAID("DV")}\n`);
  w("docs/04-data-flow-patterns.md", `# Flows\n\n${hdr}\n\n## 6. Data Flow Patterns <!-- SECTION: Data Flow Patterns -->\n\n### Flow Inventory <!-- SECTION: Flow Inventory -->\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Place | The user | UC-01 | ≤ 2 s |\n\n### Phase Catalog <!-- SECTION: Phase Catalog -->\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Submit | yes | Web App → Hub API | Rejected |\n\n#### Phase 1 — Submit\n\n${MERMAID("P1")}\n\n### Use Case Resolutions <!-- SECTION: Use Case Resolutions -->\n\n| Phase | UC-01 Place |\n|---|---|\n| 1 | ✓ |\n\n### End-to-End Wire Sequences <!-- SECTION: End-to-End Wire Sequences -->\n\n#### Flow 1 — Place (full sequence)\n\n**Phases**: 1\n\n${MERMAID("E2E1")}\n`);
  w("docs/05-integration-points.md", `# Integrations\n\n${hdr}\n\n## 7. Integration Points <!-- SECTION: Integration Points -->\n\n### 7.1 Inventory\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Web App\` | \`Hub API\` | HTTPS/JSON | RR | Partner |\n\n### 7.2 Outbound\n\nDetail of I-01. [NOT DOCUMENTED — contract owner]\n`);
  w("docs/06-technology-stack.md", `# Stack\n\n${hdr}\n\n## 8. Technology Stack <!-- SECTION: Technology Stack -->\n\n### 8.1 Origin\n\n| Category | Technology | Origin |\n|---|---|---|\n| App | React | PO Spec |\n\n### 8.3 Versions\n\n| Technology | Version |\n|---|---|\n| React | 18.3 |\n\n### 8.4 Excluded\n\nWhy not X.\n`);
  w("docs/08-scalability-and-performance.md", `# Scale\n\n${hdr}\n\n## 10. Scalability <!-- SECTION: Scalability and Performance -->\n\n### 10.1 Service Level Objectives\n\n| SLO | Target |\n|---|---|\n| p95 | ≤ 1 s |\n\n### 10.3 Strategy\n\n| Component | Unit |\n|---|---|\n| Web App | pod |\n`);
  w("docs/09-operational-considerations.md", `# Ops\n\n${hdr}\n\n## 11. Operations <!-- SECTION: Operational Considerations -->\n\n### 11.1 Deployment\n\n| Component | Mechanism |\n|---|---|\n| Web App | Helm |\n\n| Backup | Cadence |\n|---|---|\n| Nightly | 24 h |\n\n### 11.2 Deployment asymmetry\n\nProse.\n\n| Speed | Lives there |\n|---|---|\n| Backend | Services |\n\n### 11.6 Runbooks\n\n| Runbook | Trigger |\n|---|---|\n| R1 | Alert |\n`);
  w("docs/10-risks-and-technical-debt.md", `# Risks\n\n${hdr}\n\n## 13. Risks and Technical Debt <!-- SECTION: Risks and Technical Debt -->\n\n### 13.1 Risks <!-- LABEL: Risks -->\n\n| Risk | Likelihood | Impact | Mitigation |\n|---|---|---|---|\n| Hub outage | High | High | Retry |\n| Data drift | Low | High | |\n| Typo risk | Low | Low | Fix |\n| Ledger loss | Medium | Critical | Backup per [ADR-101](../adr/ADR-101-a.md) and [\`Web App\` (\`CHL0001\`)](components/order-desk/01-web-app.md), see [docs](https://example.org/x) |\n| Hub lock-in | High | High | Decided in [ADR-102](../adr/ADR-102-b.md) |\n| Desk drift | Low | Critical | Per ADR-101 |\n\n### 13.2 Technical Debt <!-- LABEL: Technical Debt -->\n\n| ID | Title | Status | Owner |\n|---|---|---|---|\n| TDR-001 | Debt | Open | Team |\n`);
  w("docs/components/README.md", `# Component Details\n\n### [Order Desk](order-desk.md)\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n| 5.1 | Web App | [01-web-app.md](order-desk/01-web-app.md) | Web Application | [React] |\n`);
  w("docs/components/order-desk.md", `# Order Desk\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponent_self: order-desk\ncomponent_type: internal-system\nscope: s\nrelated_adrs: ADR-101\n-->\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", `# Web App\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponent_self: web-app\ncomponent_type: web-application\nscope: s\nrelated_adrs: ADR-101\n-->\n\n**Type:** Web Application\n**Technology:** [React]\n**C4 Level:** Container (L2)\n`);
  w("TRACEABILITY_REPORT.md", `# Traceability\n\n## Summary <!-- SECTION: Summary -->\n\n| Metric | Count | % |\n|---|---|---|\n| Total Requirements | 10 | — |\n| ✅ Covered | 8 | 80% |\n| ⚠️ Partial | 1 | 10% |\n| ❌ Not Covered | 1 | 10% |\n\n## UC-01: Place — Phase 1\n\n| PO Spec Requirement | Architecture Coverage | Status |\n|---|---|---|\n| Submit an order | docs/04 | ✅ Covered |\n| Cancel an order | — | ❌ Not Covered |\n\n## Gap Report <!-- SECTION: Gap Report -->\n\n### ❌ Not Covered\n\n- Cancel an order\n`);
  w("BIAN_ALIGNMENT.md", `# BIAN\n\n<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->\n\n## Summary <!-- SECTION: Summary -->\n\n| # | Business Area | DOM | Status | Domains |\n|---|---|---|---|---|\n| 1 | Business Management | BMG | ⚪ Not Applicable | 0 |\n| 4 | Operations | OPS | 🟡 Partial | 1 |\n| 5 | Products | PRD | 🟢 Impacted | 1 |\n\n## Diagram ID Segments <!-- SECTION: Diagram ID Segments -->\n\n| Business Area | DOM | Business Domain | CAP | Status |\n|---|---|---|---|---|\n| Operations | OPS | Accounting | ACCT | 🟡 |\n| Products | PRD | Consumer Banking | CNSB | 🟢 |\n\n## Per-Area Analysis\n\n### 5. Products — 🟢 Impacted\n\n| Service Domain | BIAN id | Realizes / Consumes | PO Spec § |\n|---|---|---|---|\n| Payment Order Initiation | 42933 | Realizes | § 4 |\n| Current Account | 36217 | Consumes | § 4 |\n\n## API Surface <!-- SECTION: API Surface -->\n\n| Service Domain | API |\n|---|---|\n| Payment Order Initiation | PaymentOrderInitiation.yaml |\n| Current Account | CurrentAccount.yaml |\n`);
  w("analysis/TECH-DEBT-2026-09-01.md", `# Tech debt\n\n## 2. Technology Currency Table <!-- SECTION: Technology Currency Table -->\n\n| # | Tier | Technology | EOL |\n|---|---|---|---|\n| T1-01 | T1 | Node 16 | 2023-09 |\n| T2-01 | T2 | Spring Boot 3.2 | 2026-12 |\n| T3-01 | T3 | WCAG | n/a |\n`);
  w("compliance-docs/COMPLIANCE_MANIFEST.md", `# Manifest\n\n## Generated Documents\n\n| Contract Type | Filename | Score | Status | Completeness | Generated |\n|---|---|---|---|---|---|\n| Security | CC-sec.md | 8.2 | Approved | 90% | 2026-09-01 |\n| SRE | CC-sre.md | 6.0 | Draft | 70% | 2026-09-01 |\n`);
  w("adr/ADR-101-a.md", `# ADR-101: Keep the desk\n\n**Status**: Accepted\n**Scope**: Project\n`);
  w("adr/ADR-102-b.md", `# ADR-102: Use the hub\n\n**Status**: Proposed\n**Scope**: Project\n`);
  w("adr/ADR-050-inst.md", `# ADR-050: Institutional runtime\n\n**Status**: Proposed\n**Scope**: Institutional\n`);
});
afterAll(() => { if (!process.env.KEEP_TMP) rmSync(TMP, { recursive: true, force: true }); });

describe("sa-export-assemble", () => {
  test("the briefing is role-routed with every extraction in place, and the reference carries what the briefing left — nothing in both", async () => {
    const r = await assemble(TMP, { today: "2026-09-08" });
    expect([r.name, r.slug, r.lang, r.version, r.status]).toEqual(["Order Desk", "order-desk", "en", "1.2.0", "Released"]);
    const b = r.briefing, f = r.reference;
    expect(b).toMatch(/^# Order Desk — Architecture Briefing\n\n\*\*Architecture Version\*\*: 1\.2\.0\n\*\*Status\*\*: Released\n\*\*Date\*\*: 2026-09-08\n\*\*Full detail\*\*: `SA-order-desk-reference\.docx`/);
    expect(b.match(/^## .+<!-- SECTION: (.+?) -->/gm)!.map((h: string) => h.replace(/.*SECTION: (.+?) -->/, "$1"))).toEqual(["In One Page", "Reader Guide", "Product Owner Briefing", "Chapter Lead Briefing", "Technical Owner Briefing", "Decisions Pending"]);
    // In One Page opens the briefing: the C4 L1 picture alone — no diagram heading, no commentary — and, with no composed summary, the Problem Statement in its place
    expect(b).toMatch(/## In One Page <!-- SECTION: In One Page -->\n\n```mermaid\nflowchart TB\n {2}A\[L1\] --> B\n```\n\n#{4} Problem Statement\n\nThe desk fails\./);
    expect(b).not.toMatch(/Diagram: C4 Level 1/);
    // the overview prose the briefing used to paste is the reference's: only the composed summary stands in for it
    expect(b).not.toMatch(/Replicate\.|Fewer calls\.|Read TPS/);
    expect(b).toMatch(/\*\*Coverage\*\*: 10 requirements · 8 covered · 1 partial · 1 not covered\./);
    expect(b).not.toMatch(/\| Total Requirements \| 10 \| — \|/);   // the counts are one line; the summary tables stay in the reference
    expect(b).toMatch(/### Critical Risks <!-- LABEL: Open Risks -->\n\n\| Risk \|[^\n]*\n\|[-|]+\n\| Hub outage \| High \| High \| Retry \|\n\| Ledger loss \| Medium \| Critical \| Backup per `ADR-101` and `Web App` \(`CHL0001`\), see \[docs\]\(https:\/\/example\.org\/x\) \|\n\| Desk drift \| Low \| Critical \| Per ADR-101 \|\n\n1 critical risk\(s\) omitted — each is carried by a proposed ADR, listed under Decisions Pending/);   // critical impact, or high impact with high likelihood; a risk a Proposed ADR carries is omitted (ADR-102), one an Accepted ADR carries stays (ADR-101)
    expect(b.split("### Critical Risks")[1].split("## For Chapter Leads")[0]).not.toMatch(/Data drift|Typo risk|Hub lock-in/);
    expect(r.report.routed.find((x: string) => /Risks table/.test(x))).toMatch(/3 critical of 6 \(1 carried by a proposed ADR, omitted\)/);
    // the briefing is read, not navigated: no relative link survives, the reader guide says so, the reference keeps its links
    expect(b.match(/\]\((?!https?:)[^)]*\)/g)).toBeNull();
    expect(b).toMatch(/## Read This If You Are… <!-- SECTION: Reader Guide -->\n\n\| Your role[\s\S]*?\n\nReferences are highlighted \(`ADR-117`, `Servicio X`\) rather than linked/);
    expect(r.reference).toMatch(/Backup per \[ADR-101\]\(\.\.\/adr\/ADR-101-a\.md\)/);
    // CL: ONE stack table derived from the descriptors (version from docs/06 when it has a versions table), T1/T2 rows with the exposure line, the manifest stats
    expect(b).toMatch(/### Technology Stack <!-- LABEL: Technology Stack -->\n\n\| Technology \| Version \| Used by \|\n\|---\|---\|---\|\n\| React \| 18\.3 \| Web App \|\n/);
    expect(b).not.toMatch(/8\.1 Origin|Components by Type|\| Type \| Count \|/);
    expect(b).toMatch(/\*\*Exposure\*\*: 1 already EOL · 1 within 12 months\.\n\n\| # \| Tier[^\n]*\n\|[-|]+\n\| T1-01[^\n]*\n\| T2-01[^\n]*\n/);
    expect(b).not.toMatch(/T3-01/);
    expect(b).not.toMatch(/Standards Conformance|Overall\*\*|CC-sec\.md/);   // compliance contracts are regenerated by their own skill and are not exported
    // TO: BIAN realized only (🟢 rows, the APIs of realized Service Domains), ONE components-by-layer table, flow inventory + matrix + the end-to-end diagram, the I-nn table, SLO + deployment tables
    expect(b).toMatch(/\*Realized capabilities only[^\n]*\n\n\*\*Summary\*\*\n\n\| # \| Business Area[^\n]*\n\|[-|]+\n\| 5 \| Products/);
    expect(b).not.toMatch(/Business Management|\| 4 \| Operations|\| Operations \| OPS \| Accounting|CurrentAccount\.yaml/);
    expect(b).toMatch(/\| Payment Order Initiation \| PaymentOrderInitiation\.yaml \|/);
    expect(b).toMatch(/### Systems and Components Touched <!-- LABEL: Systems and Components Touched -->\n\n\| Layer \| Systems \| Components \|\n\|[-|]+\n\| L1 — Channel \| Order Desk \| Web App \(1\) \|\n/);   // one row per layer, not one per container
    expect(b).not.toMatch(/\| 5\.1 \| Web App \|/);
    expect(b).toMatch(/### Data Flows <!-- LABEL: Data Flows -->\n\n\| Flow \| Trigger \| Use Case[\s\S]*\| 1\. Place \|/);
    expect(b).not.toMatch(/A\[P1\]|A\[E2E1\]|\| Phase \| UC-01 Place \|/);   // the phase diagrams, the wire sequences and the resolution matrix are implementer detail and stay in the reference
    // one storyboard per use case, composed from the ledger: trigger → phases by name → target (8.51.0)
    expect(b).toMatch(/Each use case as the phases it runs, in order[^\n]*\n\n\*\*UC-01 — Place\*\*\n\n```mermaid\nflowchart TB\n  %% Briefing exhibit[^\n]*\n  T\(\["The user"\]\)\n  F1\["F1 · Submit"\]\n  R\(\["≤ 2 s"\]\)\n  T --> F1\n  F1 --> R\n```/);
    expect(b).toMatch(/### Integration Contracts <!-- LABEL: Integration Contracts -->\n\n\| # \| From \| To \|[\s\S]*\| I-01 \|/);
    expect(b).toMatch(/### Operational Commitments <!-- LABEL: Operational Commitments -->\n\n\*\*10\.1 Service Level Objectives\*\*\n\n\| SLO \| Target \|[\s\S]*\*\*11\.1 Deployment\*\*\n\n\| Component \| Mechanism \|\n\|[-|]+\n\| Web App \| Helm \|\n\n\| Backup \| Cadence \|\n\|[-|]+\n\| Nightly \| 24 h \|\n\n\*\*11\.2 Deployment asymmetry\*\*\n\n\| Speed \| Lives there \|/);   // each table under its own label, one label per heading
    expect(b).not.toMatch(/\| R1 \| Alert \|/);                           // runbooks are not deployment / DR / monitoring
    expect(b).not.toMatch(/\| Web App \| pod \|/);                        // the scaling strategy table stays in the reference
    expect(b.trim()).toMatch(/Structural diagrams, full principles and the decision index: `SA-order-desk-reference\.docx`\.$/);
    // reference: source-ordered, the moved blocks replaced by pointers, the diagrams section, the ADR index
    expect(f.match(/^## .+<!-- SECTION: (.+?) -->/gm)!.map((h: string) => h.replace(/.*SECTION: (.+?) -->/, "$1"))).toEqual(["System Overview", "Architecture Principles", "Architecture Layers", "Architecture Diagrams", "Data Flow Patterns", "Integration Points", "Technology Stack", "Security Architecture", "Scalability and Performance", "Operational Considerations", "Risks and Technical Debt", "Requirements Traceability", "Architecture Decision Records", "BIAN Capability Alignment"].filter((s) => s !== "Security Architecture"));
    // the reference keeps docs/06 whole, the full risks table and the full BIAN alignment
    expect(f).toMatch(/### 8\.1 Origin\n\n\| Category \| Technology \| Origin \|[\s\S]*### 8\.4 Excluded/);
    expect(f).toMatch(/\| Data drift \| Low \| High \| \|/);
    expect(f).toMatch(/## BIAN Capability Alignment <!-- SECTION: BIAN Capability Alignment -->[\s\S]*Business Management[\s\S]*CurrentAccount\.yaml/);
    expect(f).toMatch(/### 2\. System Overview\n[\s\S]*Design Drivers/);
    ["Replicate\\.", "Fewer calls\\.", "Read TPS"].forEach((x) => expect(f).toMatch(new RegExp(x)));   // the overview blocks the briefing summarises instead of pasting
    expect(f).not.toMatch(/The desk fails\.|1\.5 BIAN/);                 // the Problem Statement moved to the briefing when no summary was composed
    expect(f).toMatch(/## Architecture Diagrams <!-- SECTION: Architecture Diagrams -->\n\n#{3,5} Diagram: C4 Level 1 — System Context\n\n\*The diagram itself is in the briefing — § In One Page\.\*\n\n#{3,5} Diagram: Logical View[\s\S]*A\[LV\][\s\S]*A\[L2\][\s\S]*A\[DV\]/);
    expect(f).not.toMatch(/A\[L1\]/);
    expect(f).toMatch(/\*Table in the briefing — Data Flows\.\*/);
    expect(f).toMatch(/A\[P1\][\s\S]*\| Phase \| UC-01 Place \|[\s\S]*A\[E2E1\]/);
    expect(f).toMatch(/\| Total Requirements \| 10 \| — \|/);
    expect(f).toMatch(/\| Web App \| pod \|/);
    expect(f).toMatch(/\| R1 \| Alert \|/);
    expect(f).toMatch(/## UC-01|### UC-01: Place/);
    expect(f).toMatch(/Gap Report/);
    expect(f).toMatch(/\| # \| Title \| Status \| File \|\n\|[-|]+\n\| ADR-101 \| Keep the desk \| Accepted \| ADR-101-a\.md \|\n\| ADR-102 \| Use the hub \| Proposed \| ADR-102-b\.md \|\n\n1 institutional ADR\(s\) also apply — see `adr\/README\.md`\./);
    expect(f).not.toMatch(/\| ADR-050 \|/);
    expect(f).not.toMatch(/EXPLORER_HEADER|\]\(\.\.\/ARCHITECTURE\.md\) >/);
    // a source's own HTML comments are notes to whoever edits the file, not export content; the SECTION / LABEL anchors stay
    expect(f).not.toMatch(/BIAN_ALIGNMENT_VERSION|<!-- (?!SECTION|LABEL)/);
    expect(b).not.toMatch(/<!-- (?!SECTION|LABEL)/);
    expect(f).toMatch(/<!-- SECTION: BIAN Capability Alignment -->/);
  });

  test("risk summaries: the receipt requests one per critical row; a valid one replaces Risk and Mitigation, a broken one is refused and the row stays", async () => {
    const r0 = await assemble(TMP);
    const rq = r0.report.risk_summaries;
    expect(rq.max_chars).toBe(200); expect(rq.applied).toBe(0);
    expect(rq.requested.map((x: any) => x.risk)).toEqual(["Hub outage", "Ledger loss", "Desk drift"]);
    expect(rq.requested[1]).toMatchObject({ likelihood: "Medium", impact: "Critical", mitigation: "Backup per ADR-101 and Web App (CHL0001), see docs" });   // plain text: no link, no code span
    const k = (i: number) => rq.requested[i].key;
    const r = await assemble(TMP, { riskSummaries: { rows: [
      { key: k(0), risk_plain: "The hub can go down and orders stop.", mitigation_plain: "Retry automatically; the team owns the hub contract." },
      { key: k(1), risk_plain: "x".repeat(201), mitigation_plain: "Nightly backup." },
      { key: "nope", risk_plain: "Drift.", mitigation_plain: "Fix." },
    ] } });
    const s = r.report.risk_summaries;
    expect(s.applied).toBe(1);
    expect(s.issues).toEqual(["row 2: risk_plain 201 chars > 200 — original kept", `row 3: no summary with key ${k(2)} — original kept`]);
    const sec = r.briefing.split("### Critical Risks")[1].split("## For Chapter Leads")[0];
    expect(sec).toMatch(/\n\| The hub can go down and orders stop\. \| High \| High \| Retry automatically; the team owns the hub contract\. \|\n\| Ledger loss \| Medium \| Critical \| Backup per `ADR-101`/);
    expect(r.reference).toMatch(/\| Hub outage \| High \| High \| Retry \|/);   // the reference keeps the source row
  });

  test("Decisions Pending closes the briefing on counts by kind, then the decisions someone has to take", async () => {
    const r = await assemble(TMP);
    const sec = r.briefing.split("## Decisions Pending")[1];
    expect(r.report.pending).toBe(4);   // the five rules run unchanged: project Proposed ADR, Not Covered / Partial, a risk with no mitigation, [NOT DOCUMENTED] markers
    expect(sec).toMatch(/\| What is open \| Count \| Where \|\n\|[-|]+\n\| Decisions proposed and not taken \| 1 \| adr\/ \|\n\| Requirements not covered or partial \| 1 \| TRACEABILITY_REPORT\.md \|\n\| Risks with no mitigation recorded \| 1 \| docs\/10 § 13\.1 \|\n\| Documentation gaps \| 1 \| docs\/05-integration-points\.md \|\n/);
    expect(sec).toMatch(/\| Decision \| Owner role \| Source \| Status \|\n\|[-|]+\n\| ADR-102 — Use the hub \| Architect \| adr\/ADR-102-b\.md \| Proposed \|\n/);
    expect(sec).not.toMatch(/Data drift \||Cancel an order \||NOT DOCUMENTED\] marker/);   // the other kinds are counted, not listed row by row
    expect(sec).not.toMatch(/Hub outage|Security \||SRE|ADR-101|ADR-050/);   // an institutional Proposed ADR is not this project's decision; the compliance manifest is not a source
  });

  test("the composed layer: the receipt requests every plain-language slot; valid ones open their section, broken ones are refused and the heading still stands", async () => {
    const r0 = await assemble(TMP);
    const q = r0.report.plain;
    expect(q.applied).toBe(0);
    expect(q.max_chars).toMatchObject({ statement: 240, lead: 160, metric: 90, metricLabel: 40, metricRows: 6 });
    expect(q.requested.one_page.slots).toEqual(["what", "why", "how", "decide"]);
    expect(q.requested.one_page.source.solution).toMatch(/Replicate\./);
    expect(q.requested.metrics.source).toMatch(/Read TPS/);
    expect(q.requested.leads.map((l: any) => l.key)).toEqual(["po.coverage", "po.risks", "cl.stack", "cl.currency", "to.capability", "to.components", "to.flows", "to.integrations", "to.operations", "pending"]);

    const r = await assemble(TMP, { plain: {
      one_page: { what: "A desk that takes orders.", why: "It falls over.", how: "Orders are replicated.", decide: "Whether the pilot ships." },
      metrics: [{ label: "Reads per second", value: "100" }, { label: "x".repeat(41), value: "dropped for a label over budget" }],
      leads: [{ key: "po.risks", text: "The risks nobody has closed yet." }, { key: "cl.stack", text: "y".repeat(161) }, { key: "to.components", text: "The system by layer." }],
    } });
    expect(r.report.plain.applied).toBe(4 + 1 + 2);
    expect(r.report.plain.issues).toEqual(["metrics row 2: 41 chars > 40 — omitted", "lead cl.stack: 161 chars > 160 — omitted"]);
    expect(r.briefing).toMatch(/## In One Page <!-- SECTION: In One Page -->\n\n```mermaid[\s\S]*?```\n\n\*\*What it is\*\*: A desk that takes orders\.\n\n\*\*Why\*\*: It falls over\.\n\n\*\*How it works\*\*: Orders are replicated\.\n\n\*\*What this briefing decides\*\*: Whether the pilot ships\./);
    expect(r.briefing).not.toMatch(/The desk fails\./);                  // the summary was composed, so the Problem Statement stays in the reference
    expect(r.reference).toMatch(/The desk fails\./);
    expect(r.briefing).toMatch(/### Numbers That Matter <!-- LABEL: Numbers That Matter -->\n\n\| Measure \| Target \|\n\|[-|]+\n\| Reads per second \| 100 \|\n/);
    expect(r.briefing).toMatch(/### Critical Risks <!-- LABEL: Open Risks -->\n\nThe risks nobody has closed yet\.\n/);
    expect(r.briefing).toMatch(/### Technology Stack <!-- LABEL: Technology Stack -->\n\n\| Technology \|/);   // refused lead: the heading still stands and the table follows it
    expect(r.briefing).toMatch(/### Systems and Components Touched <!-- LABEL: Systems and Components Touched -->\n\nThe system by layer\.\n/);
  });

  test("an absent source writes its fallback line in the briefing and no section in the reference; Spanish strings follow the language", async () => {
    const bare = join(TMP, "bare"); mkdirSync(join(bare, "docs"), { recursive: true });
    writeFileSync(join(bare, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: es -->\n\n# Mesa — Arquitectura\n");
    writeFileSync(join(bare, "docs/01-system-overview.md"), "# Mesa — Arquitectura\n\n## 2. Descripción <!-- SECTION: System Overview -->\n\n### Planteamiento del Problema <!-- LABEL: Problem Statement -->\n\nFalla.\n");
    const r = await assemble(bare);
    expect(r.lang).toBe("es");
    expect(r.briefing).toMatch(/^# Mesa — Briefing de Arquitectura/);
    expect(r.briefing).toMatch(/## En una página <!-- SECTION: In One Page -->/);
    expect(r.briefing).toMatch(/## Lee esto si eres… <!-- SECTION: Reader Guide -->/);
    expect(r.briefing).toMatch(/`docs\/03-architecture-layers\.md` no existe en esta arquitectura/);
    expect(r.briefing).toMatch(/La cobertura de requisitos no se ha verificado/);
    expect(r.briefing).toMatch(/No hay alineación BIAN/);
    expect(r.briefing).toMatch(/No hay decisiones abiertas en los artefactos fuente listados arriba\./);
    expect(r.briefing).toMatch(/Falla\./);
    expect(r.reference.match(/^## /gm)!.length).toBe(2);   // System Overview (what is left) + the ADR index
    await expect(assemble(join(TMP, "nothing"))).rejects.toThrow(/docs\/01-system-overview\.md not found/);
  });

  test("the CLI writes both files under .cache/sa-skills/export and, with --parts, one bounded file per composed section", async () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--parts", "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = join(TMP, ".cache", "sa-skills", "export");
    expect(existsSync(join(out, "sa-briefing.md"))).toBe(true);
    expect(existsSync(join(out, "sa-reference.md"))).toBe(true);
    const parts = readdirSync(join(out, "parts")).sort();
    expect(parts.filter((p: string) => p.startsWith("briefing-")).length).toBe(8);
    expect(parts.slice(0, 3)).toEqual(["briefing-00.md", "briefing-01.md", "briefing-02.md"]);
    expect(parts.filter((p) => p.startsWith("reference-")).length).toBe(14);
    const j = JSON.parse(r.stdout.toString());
    expect(j.slug).toBe("order-desk");
    expect(j.report.sources["docs/07"]).toBeNull();
    expect(j.report.sources).not.toHaveProperty("compliance-docs/COMPLIANCE_MANIFEST.md");
    expect(j.report.coverage).toEqual({ containers: 1, on_a_layer: 1, not_on_any_layer: [], with_internal_name: 0, without_internal_name: ["Web App"], systems_without_containers: [] });
    expect(r.stderr.toString()).toMatch(/Coverage: 1\/1 containers on a layer; 0\/1 with an internal name — not documented: Web App/);
    expect(r.stderr.toString()).toMatch(/^Wrote .*sa-briefing\.md \(\d+\.\d KB\) and sa-reference\.md/);
    expect(r.stderr.toString()).toMatch(/Decisions Pending: 4/);
    expect(r.stderr.toString()).toMatch(/Plain language: 0 of ~14 slot\(s\) composed/);
    expect(existsSync(join(out, "plain-language.request.json"))).toBe(true);
  });
  test("a layer cell no judge has answered is undecided — printed as written, bound to no component, reported with the worksheet", async () => {
    const d03 = join(TMP, "docs/03-architecture-layers.md"), orig = readFileSync(d03, "utf-8");
    try {
      // "Web App (SPA)" is not exactly a canonical name: binding it to the Web App is the judge's, and the default engine writes a worksheet
      writeFileSync(d03, orig.replace("| **L1 — Channel** | Web App | Yes |", "| **L1 — Channel** | Web App (SPA) | Yes |"));
      const r = await assemble(TMP, { judge: "agent" });
      expect(r.report.layer_names_undecided).toEqual(["Web App (SPA)"]);
      expect(r.report.layer_names_worksheet).toMatch(/resolve-name\.worksheet\.md$/);
      expect(r.report.layer_names_judged).toEqual([]);
      expect(r.report.coverage.not_on_any_layer).toEqual(["Web App"]);   // never placed by containment
      const cli = Bun.spawnSync(["bun", SCRIPT, TMP, "--judge", "agent"], { stdout: "pipe", stderr: "pipe" });
      expect(cli.stderr.toString()).toMatch(/Layer names UNDECIDED \(1\) — printed as written, bound to no component: "Web App \(SPA\)" — answer .*resolve-name\.worksheet\.md and re-run/);
      // the session answers beside the worksheet: the cell is the Web App, which is now on its layer
      const ws = readFileSync(r.report.layer_names_worksheet, "utf-8"); const out = ws.match(/Write the answers to `([^`]+)`/)![1], hash = ws.match(/"worksheet": "([^"]+)"/)![1];
      writeFileSync(out, JSON.stringify({ worksheet: hash, answers: { l0: "Web App" } }));
      const a = await assemble(TMP, { judge: "agent" });
      expect(a.report.layer_names_undecided).toEqual([]);
      expect(a.report.layer_names_judged).toEqual(["\"Web App (SPA)\" → `Web App` (agent 1)"]);
      expect(a.report.coverage.on_a_layer).toBe(1);
    } finally { writeFileSync(d03, orig); rmSync(join(TMP, ".cache", "sa-skills", "judge"), { recursive: true, force: true }); }
  });
  test("the parts joined in name order are the whole document — title, metadata and closing line included — and --suffix names the translated files", async () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--parts", "--suffix", "-es"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = join(TMP, ".cache", "sa-skills", "export"), pd = join(out, "parts");
    const join_ = (kind: string) => readdirSync(pd).filter((p) => p.startsWith(kind + "-")).sort().map((p) => readFileSync(join(pd, p), "utf-8")).join("");
    const briefing = join_("briefing"), reference = join_("reference");
    expect(briefing.startsWith("# Order Desk — ")).toBe(true);
    expect(briefing).toMatch(/\*\*Architecture Version\*\*: 1\.2\.0/);
    expect(briefing.trimEnd().endsWith("`SA-order-desk-reference-es.docx`.")).toBe(true);
    expect(briefing).not.toMatch(/SA-order-desk-reference\.docx/);
    expect(reference.startsWith("# Order Desk — ")).toBe(true);
    expect(reference).toMatch(/`SA-order-desk-es\.docx`/);
    const whole = readFileSync(join(out, "sa-briefing.md"), "utf-8");
    expect(whole.split("\n").filter((l) => /^#{1,2} /.test(l))).toEqual(briefing.split("\n").filter((l) => /^#{1,2} /.test(l)));
  });
});
