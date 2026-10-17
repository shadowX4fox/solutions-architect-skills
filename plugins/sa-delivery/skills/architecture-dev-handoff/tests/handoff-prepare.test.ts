/**
 * handoff-prepare.js — the three payload shapes assembled by code: the docs/05 gate, the run payload's
 * sections, edge resolution and style, seams for the edges incident on a selection, the component
 * payload's derived sections and asset resolution, the boundary cross-check, the skip decisions
 * against the manifest, and the CLI's CONTEXT_RESULT block.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prepare, parseFlowchart, emitFlowchart, TEMPLATE_VERSION, SCHEMA_VERSION } = require("../scripts/handoff-prepare.js");
const GOV = !!require("../../../../../scripts/shared/packs.js").designLanguageDir();   // a design language in force (an institution pack's): the governed tests run only then
const SCRIPT = join(__dirname, "..", "scripts", "handoff-prepare.js");
const TMP = join(__dirname, ".temp-handoff-prepare");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };
const hdr = (self: string, type: string, adrs = "ADR-101") => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ${adrs}\n-->`;

function fixture() {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.2.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk — Architecture\n\n**Architect**: Desk Team\n\n## Out of scope\n\n- Refunds — decided by the PO\n`);
  w("docs/01-system-overview.md", `# Overview\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponents: web-app\nscope: s\nrelated_adrs: ADR-101\n-->\n\n## 1. Executive Summary <!-- SECTION: Executive Summary -->\n\nProse.\n`);
  w("docs/04-data-flow-patterns.md", `# Flows\n\n<!-- EXPLORER_HEADER\nkey_concepts: flows\ntechnologies: React\ncomponents: web-app\nscope: s\nrelated_adrs: ADR-101\n-->\n\n## 6. Data Flow Patterns <!-- SECTION: Data Flow Patterns -->\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Place an order | The user submits | UC-01 | ≤ 2 s |\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Submit | yes | Web App → Hub API | Rejected |\n| 2 | Settle | no — batch | Hub API → Order DB | Late |\n| 3 | Audit | no | Order DB → Ledger | Lost |\n\n#### Phase 1 — Submit\n\n**Hops**: Web App → Hub API\n\n\`\`\`mermaid\nsequenceDiagram\n  participant W as Web App\n  participant H as Hub API\n  W->>H: 1. Submit the order\n\`\`\`\n\n#### Phase 2 — Settle\n\nNo diagram here.\n\n#### Flow 1 — Place an order (full sequence)\n\n**Phases**: 1 → 2 (synchronous).\n**Governed by**: [ADR-101](../adr/ADR-101-x.md).\n\n#### Latency budget breakdown\n\n| Hop | Budget |\n|---|---|\n| Web App → Hub API | ≤ 800 ms |\n| Hub API → Order DB | ≤ 200 ms |\n`);
  w("docs/05-integration-points.md", `# Integrations\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponents: web-app\nscope: s\nrelated_adrs: ADR-101\n-->\n\n## 7. Integration Points <!-- SECTION: Integration Points -->\n\n### 7.1 Inventory\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Web App\` | \`Hub API\` | HTTPS/JSON | Request-response | Internal |\n| I-02 | \`Hub API\` | \`Order DB\` | JDBC | Request-response | Internal |\n| I-03 | \`Order Events\` topic | \`Hub API\` | Kafka | Event | Internal |\n| I-04 | \`Hub API\` | Fraud Screen | HTTPS | Request-response | Partner |\n| ~~I-05~~ | ~~\`Web App\`~~ | ~~\`Order DB\`~~ | — | — | **Retired** |\n\n### 7.3 Outbound\n\n**I-01 — Order submission**\n\nThe web app submits an order, per [ADR-102](../adr/ADR-102-b.md).\n\n| Aspect | Definition |\n|---|---|\n| Contract | Order payload |\n\n**I-02 — Persist the order**\n\nThe hub writes the order.\n\n**I-03 e I-04 — Events and fraud screening**\n\nThe hub consumes order events and screens each order.\n\n**I-05 — retired**, per ADR-102 the web app no longer writes the order store.\n`);
  w("docs/03-architecture-layers.md", `# Layers\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponents: web-app\nscope: s\nrelated_adrs: ADR-101\n-->\n\n## 4. Architecture Layers <!-- SECTION: Architecture Layers -->\n\n#### Diagram: Logical View\n\n\`\`\`mermaid\nflowchart TB\n  classDef zone fill:none;\n  subgraph L1["Channel"]\n  end\n  class L1 zone;\n\`\`\`\n\n#### Diagram: C4 Level 2 — Container View\n\n\`\`\`mermaid\n%%{\n  init: { 'theme': 'base' }\n}%%\n%% BP-CNL-XCHN-<SUBJ>-CNT-<NNN>\nflowchart TB\n  classDef unit fill:#d6ecff,stroke:#2a78d6;\n  classDef store fill:#ffe0cf,stroke:#dd5c00;\n  classDef oos fill:#e7e6e3,stroke:#7e7d7b;\n  subgraph SYS["Order Desk"]\n    WEB["Web App<br/>React"]\n    HUB["Hub API"]\n    DB[("Order DB")]\n  end\n  subgraph EXT["Outside"]\n    FRAUD["Fraud Screen"]\n  end\n  WEB -->|"HTTPS/JSON [Command]"| HUB\n  HUB -->|"JDBC/SQL [Query]"| DB\n  HUB -->|"HTTPS/JSON [Query]"| FRAUD\n  style FRAUD stroke-dasharray:5 5\n  linkStyle 0 stroke:#f00\n  class WEB,HUB unit;\n  class DB store;\n  class FRAUD oos;\n\`\`\`\n`);
  w("docs/components/README.md", `# Components\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n`);
  w("docs/components/order-desk.md", `# Order Desk\n\n${hdr("order-desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", `# Web App\n\n${hdr("web-app", "web-application", "ADR-101")}\n\n**Type:** Web Application\n**Technology:** [React]\n**Component Version:** 1.1.0\n**Owner:** Channels squad\n\n## Communication Patterns <!-- LABEL: Communication Patterns -->\n\n**Inbound:** <!-- LABEL: Inbound -->\n\n| Source | Protocol | Content |\n|---|---|---|\n| The user | HTTPS | Clicks |\n\n**Outbound:** <!-- LABEL: Outbound -->\n\n| Target | Protocol | Content |\n|---|---|---|\n| [Hub API](02-hub-api.md) | HTTPS/JSON | Order submission (I-01), per ADR-103 |\n\n## Deployment\n\nHelm on AKS.\n`);
  w("docs/components/order-desk/02-hub-api.md", `# Hub API\n\n${hdr("hub-api", "api-service", "ADR-101, ADR-102")}\n\n**Type:** API Service\n**Technology:** [Spring Boot, Kafka]\n**Asset Hints:** [openapi, asyncapi, cronjob]\n\n## Communication Patterns <!-- LABEL: Communication Patterns -->\n\n**Inbound:** <!-- LABEL: Inbound -->\n\n| Source | Protocol | Content |\n|---|---|---|\n| [Web App](01-web-app.md) | HTTPS/JSON | Orders |\n\n**Outbound:** <!-- LABEL: Outbound -->\n\n| Target | Protocol | Content |\n|---|---|---|\n| Fraud Screen | HTTPS | Screening |\n\n## Data ownership\n\n- orders (owner)\n`);
  w("docs/components/order-desk/03-order-db.md", `# Order DB\n\n${hdr("order-db", "database", "ADR-101")}\n\n**Type:** Database\n**Technology:** [PostgreSQL]\n`);
  w("docs/components/order-desk/04-graph-bff.md", `# Graph BFF\n\n${hdr("graph-bff", "api-service", "ADR-101")}\n\n**Type:** API Service\n**Technology:** [GraphQL, Node.js]\n**Communicates via:** GraphQL over HTTPS\n`);
  w("adr/ADR-001-a.md", `# ADR-001: Six layers\n\n**Status**: Accepted\n**Scope**: Institutional\n\n## 1. Context\n\nWhy.\n\n## 2. Decision\n\n### Summary\n\nAdopt six layers as the mandatory pattern.\n\n| Layer | Role |\n|---|---|\n| L1 | Channels |\n\nSecond paragraph of the decision.\n`);
  w("adr/ADR-101-x.md", `# ADR-101: Keep the desk\n\n**Status**: Accepted\n**Scope**: Project\n\n## Decision\n\nKeep the desk as one system.\n`);
  w("adr/ADR-102-b.md", `# ADR-102: Use the hub\n\n**Status**: Proposed\n**Scope**: Project\n\n## Decision\n\nRoute every order through the hub.\n`);
  w("analysis/BLAST_RADIUS-2026-09-01.md", `# Blast\n\n## Findings\n\n### High-Blast Components\n\n| # | Component | Tier | Direct Consumers | Cascade Risk |\n|---|---|---|---|---|\n| B1 | \`Hub API\` | S2 | \`Order DB\` (I-02) | Fail-closed |\n| B2 | \`Web App\` | S1 | None | Terminal |\n`);
  w("analysis/COUPLING-2026-09-01.md", `# Coupling\n\n## 2. Findings\n\n### 2.2 Metrics\n\n| C4 Index | Component | Fan-in (Ca) | Fan-out (Ce) | Instability (I) |\n|---|---|---|---|---|\n| 5.1 | Web App | 0 | 1 | 1.00 |\n| 5.2 | Hub API | 2 | 2 | 0.50 |\n`);
  w("compliance-docs/CC-010-sre-architecture_Desk_2026-09-01.md", `# SRE\n\n## Compliance Summary <!-- SECTION: Compliance Summary -->\n\n| Code | Requirement | Category | Status | Evidence | Criticality |\n|---|---|---|---|---|---|\n| SRE01 | Is a log format stated? | Logging | Non-Compliant | — | Blocker |\n| SRE05 | Is the configuration store named? | Configuration | Compliant | docs/09 § 11.4 | Desired |\n\n## Requirements <!-- SECTION: Requirements -->\n\n### Configuration (SRE05)\n\n**Requirement**: Is the configuration store named?\n\n**Status**: Compliant · judge 0.93\n\n**Met when**: All configurations must be stored in official repositories.\n`);
}

beforeAll(fixture);
afterAll(() => rmSync(TMP, { recursive: true, force: true }));
const rd = (p: string) => readFileSync(p, "utf8");

describe("handoff-prepare", () => {
  test("the docs/05 gate fails the run before any payload is written", async () => {
    const r = await prepare(TMP, { components: "all", out: ".cache/x", date: "2026-09-08" });
    expect(r.report.status).toBe("OK");
    rmSync(join(TMP, "docs/05-integration-points.md"));
    const f = await prepare(TMP, { components: "all", out: ".cache/gate", date: "2026-09-08" });
    expect(f.report.status).toBe("FAILED");
    expect(f.report.abort_reason).toMatch(/docs\/05-integration-points\.md missing or empty/);
    expect(existsSync(join(TMP, ".cache/gate/_run.md"))).toBe(false);
    fixture();
  });

  test("the run payload: scope, flows from the ledger, edges resolved by canonical name with their style, verbatim analysis tables, institutional ADR excerpts — and nothing compliance writes", async () => {
    const r = await prepare(TMP, { components: "all", date: "2026-09-08" });
    const run = rd(r.result.run.ekonte_payload_path);
    expect(run).toMatch(/^---\nproject_name: Order Desk\narchitect: Desk Team\narchitecture_version: 1\.2\.0\n/);
    expect(run).toMatch(/- In scope:\n  - Web App\n  - Hub API\n  - Order DB\n  - Graph BFF\n- Out of scope:\n  - Refunds — decided by the PO/);
    expect(run).toMatch(/### F-01 — Place an order\n- Trigger: The user submits\n- Path: Web App → Hub API → Order DB\n- Phases: 1 \(Submit\) → 2 \(Settle\)\n- Sequence: \[docs\/04-data-flow-patterns\.md#flow-1--place-an-order-full-sequence\]\(\.\.\/\.\.\/\.\.\/docs\/04-data-flow-patterns\.md#flow-1--place-an-order-full-sequence\)\n- Global budget: ≤ 2 s\n- Governed by: ADR-101\n- Failure posture: phase 1: Rejected · phase 2: Late\n- Main image:\n\n\[NOT DOCUMENTED — the flow's end-to-end block draws nothing/);   // this fixture's "(full sequence)" block carries no fence — the gap is said, with the command that fills it
    expect(run).toMatch(/## Phase Catalog <!-- SECTION: Phase Catalog -->\n\n### Phase 1 — Submit\n- Used by: F-01\n\n```mermaid\nsequenceDiagram/);   // every phase once, with the flows that declare it
    expect(run).not.toMatch(/- Panels:|### Panel — /);
    expect(r.result.panels).toMatchObject({ phases: 1, phases_without: ["2"], diagram: "docs/03-architecture-layers.md § Diagram: C4 Level 2 — Container View", unmatched_nodes: ["Graph BFF"], rejected: [] });   // the GraphQL fixture component has no node in the container diagram — reported, as it should be
    // edges: canonical names, sync / async by protocol or pattern, the docs/05 block's title as purpose, ADRs from the row and its block; the retired row is a note, the partner endpoint stays on the edge
    expect(run).toMatch(/\| E-01 \| Web App \| Hub API \| sync \| HTTPS\/JSON \| Order submission \(I-01\) \| ADR-102 \|\n\| E-02 \| Hub API \| Order DB \| sync \| JDBC \| Persist the order \(I-02\) \| — \|\n\| E-03 \| Order Events topic \| Hub API \| async \| Kafka \| Events and fraud screening \(I-03\) \| — \|\n\| E-04 \| Hub API \| Fraud Screen \| sync \| HTTPS \| Events and fraud screening \(I-04\) \| — \|/);
    expect(run).toMatch(/\*\*Retired edges\*\*.*I-05 \(Web App → Order DB\)/);
    // a cell that is not exactly a canonical name waits for the judge (the default engine writes a worksheet): undecided, never
    // resolved by containment and never dismissed as "no component" — listed with the worksheet to answer, and no seam until then
    expect(r.report.unresolved_endpoints).toEqual([]);
    expect(r.report.undecided_endpoints).toHaveLength(2);
    expect(r.report.undecided_endpoints[0]).toMatch(/^I-03 upstream "Order Events topic" — undecided — the judge's worksheet is pending .* — answer .*resolve-name\.worksheet\.md and re-run$/);
    expect(r.report.undecided_endpoints[1]).toMatch(/^I-04 downstream "Fraud Screen" — undecided/);
    expect(r.result.undecided_endpoints).toEqual(r.report.undecided_endpoints);
    expect(r.result.panels.undecided_labels).toEqual(['"Fraud Screen"']);   // the external node's label names no component exactly — the judge's, pending
    expect(r.result.panels.worksheet).toMatch(/resolve-name\.worksheet\.md$/);
    // no latency analysis: the docs/04 budget tables stand in, flagged as documented targets
    expect(run).toMatch(/## Latency Budget <!-- SECTION: Latency Budget -->\n\n\[NOT DOCUMENTED — no analysis\/LATENCY_BUDGET-\*\.md; run \/sa-analysis:architecture-analysis latency-budget\]\n\nBudgets declared in `docs\/04-data-flow-patterns\.md` § Latency budget breakdown[^\n]*\n\n\| Hop \| Budget \|/);
    expect(run).toMatch(/## Blast Radius <!-- SECTION: Blast Radius -->\n\nSource: `analysis\/BLAST_RADIUS-2026-09-01\.md`\.\n\n### High-Blast Components\n\n\| # \| Component \| Tier \| Direct Consumers \| Cascade Risk \|\n\|[-|]+\n\| B1 \| `Hub API`/);
    expect(run).toMatch(/## Coupling <!-- SECTION: Coupling -->\n\nSource: `analysis\/COUPLING-2026-09-01\.md`\./);
    // the kit is independent of compliance: a contract on disk is never read, cited or warned about
    expect(run).not.toMatch(/Compliance Rules|SRE05|compliance-docs|sa-compliance/);
    // institutional ADRs only, the Decision's prose (no sub-heading, no table), capped
    expect(run).toMatch(/## Institutional ADRs <!-- SECTION: Institutional ADRs -->\n\n- ADR-001 — Six layers — Accepted — \[adr\/ADR-001-a\.md\]\(\.\.\/\.\.\/\.\.\/adr\/ADR-001-a\.md\)\n  Adopt six layers as the mandatory pattern\.\n  \n  Second paragraph of the decision\.\n/);
    expect(run).not.toMatch(/ADR-101 — Keep the desk/);
    expect(r.report.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/Latency Budget analysis not found/)]));
    expect(r.report.warnings.some((w: string) => /[Cc]ompliance/.test(w))).toBe(false);
    expect(r.report.warnings.some((x: string) => /Blast Radius analysis not found/.test(x))).toBe(false);
  });

  test.if(GOV)("seams: one per edge incident on the selection with both endpoints documented; the row, its block, the boundary rows that name the other endpoint, the analysis rows, the ADRs", async () => {
    const r = await prepare(TMP, { components: "hub-api", date: "2026-09-08" });
    expect(r.result.seams.map((s: any) => s.edge_key)).toEqual(["web-app→hub-api", "hub-api→order-db"]);   // I-03 / I-04 have an undocumented endpoint
    const s = rd(r.result.seams[0].payload_path);
    const s2 = rd(r.result.seams[1].payload_path);   // I-02's block stops at the compound head and the retired line (8.83.4)
    expect(s2).toContain("The hub writes the order.");
    expect(s2).not.toContain("fraud screening"); expect(s2).not.toContain("retired");
    // the mode and the Interaction label are the payload's (8.110.0): the container diagram's label on the edge, verbatim
    expect(s).toMatch(/^---\nupstream: web-app\ndownstream: hub-api\nupstream_name: "Web App"\ndownstream_name: "Hub API"\nedge_id_in_ekonte: E-01\ndoc_language: en\ngeneration_date: 2026-09-08\ndesign_language: governed\ninteraction_label: "HTTPS\/JSON \[Command\]"\n---/);
    expect(s2).toContain('\ninteraction_label: "JDBC/SQL [Query]"\n');
    expect(s).toMatch(/## Integration Row <!-- SECTION: Integration Row -->\n\n\| # \| From \| To \| Protocol \| Pattern \| Boundary \|\n\|[-|]+\n\| I-01 \| `Web App` \| `Hub API` \| HTTPS\/JSON \| Request-response \| Internal \|\n\n\*\*I-01 — Order submission\*\*\n\nThe web app submits an order, per \[ADR-102\]/);
    expect(s).toMatch(/## Boundaries Upstream <!-- SECTION: Boundaries Upstream -->\n\nFrom `docs\/components\/order-desk\/01-web-app\.md` § Communication Patterns \(Outbound\):\n\n\| Target \| Protocol \| Content \|\n\|[-|]+\n\| \[Hub API\]\(02-hub-api\.md\) \| HTTPS\/JSON \| Order submission \(I-01\), per ADR-103 \|\n/);
    expect(s).toMatch(/## Boundaries Downstream <!-- SECTION: Boundaries Downstream -->\n\nFrom `docs\/components\/order-desk\/02-hub-api\.md` § Communication Patterns \(Inbound\):\n\n\| Source \| Protocol \| Content \|\n\|[-|]+\n\| \[Web App\]\(01-web-app\.md\) \| HTTPS\/JSON \| Orders \|/);
    expect(s).toMatch(/## Blast Radius Row <!-- SECTION: Blast Radius Row -->\n\n_High-Blast Components_\n\n\| # \| Component[^\n]*\n\|[-|]+\n\| B2 \| `Web App` \| S1 \| None \| Terminal \|\n\n_High-Blast Components_\n\n[^\n]*\n\|[-|]+\n\| B1 \| `Hub API`/);
    expect(s).toMatch(/## Coupling Row <!-- SECTION: Coupling Row -->\n\n\| C4 Index[^\n]*\n\|[-|]+\n\| 5\.1 \| Web App \|[^\n]*\n\n\| C4 Index[^\n]*\n\|[-|]+\n\| 5\.2 \| Hub API/);
    // provenance first, number never: the row's block cites ADR-102 and the boundary row ADR-103 (edge); under three, the
    // descriptors' headers complete the list (endpoint) — so the Interface Contract's Decision is ADR-102, not ADR-101 because it sorts first
    expect(r.result.seams[0].related_adrs).toEqual(["ADR-102", "ADR-103", "ADR-101"]);
    expect(s).toMatch(/## Related ADRs <!-- SECTION: Related ADRs -->\n\n- ADR-102 \(edge\) — Use the hub — Proposed[\s\S]*- ADR-103 \(edge\) — \[NOT DOCUMENTED[\s\S]*- ADR-101 \(endpoint\) — Keep the desk — Accepted — \[adr\/ADR-101-x\.md\]\([^)]*\)\n  Keep the desk as one system\./);
    // the second seam's downstream has no communication section
    expect(rd(r.result.seams[1].payload_path)).toMatch(/## Boundaries Downstream <!-- SECTION: Boundaries Downstream -->\n\n\[NOT DOCUMENTED — docs\/components\/order-desk\/03-order-db\.md has no Inbound communication table\]/);
    // cross-check: the hub's Outbound table does not name Order DB
    expect(r.report.edge_cross_check_warnings).toEqual(["⚠ blast-radius stale: docs/05 has edge web-app→hub-api (I-01) but analysis/BLAST_RADIUS-2026-09-01.md fan-out for Web App does not list Hub API. Rerun /sa-analysis:architecture-analysis blast-radius.", "⚠ boundary mismatch: docs/05 has edge hub-api→order-db (I-02) but docs/components/order-desk/02-hub-api.md does not list Order DB in its Outbound table."]);
  });

  test("component payloads: frontmatter from the descriptor, asset types by keyword or by the Asset Hints override, the raw file, the derived sections, only L2 descriptors are accepted", async () => {
    const r = await prepare(TMP, { components: "hub-api,web-app,order-desk,nope", date: "2026-09-08" });
    expect(r.report.warnings).toEqual(expect.arrayContaining(["component skipped — order-desk: not a C4 L2 container (L1)", "component skipped — nope: no such component"]));
    expect(r.result.cut_sheets.map((c: any) => c.slug)).toEqual(["web-app", "hub-api"]);   // index order
    const hub = rd(r.result.cut_sheets[1].payload_path), web = rd(r.result.cut_sheets[0].payload_path);
    expect(hub).toMatch(/^---\ncomponent_slug: hub-api\ncomponent_file: docs\/components\/order-desk\/02-hub-api\.md\ncomponent_type: api-service\ncomponent_index_position: "5\.2"\ncomponent_version: 1\.0\.0\ncomponent_owner: Not specified\nasset_types: \[openapi, asyncapi, c4-descriptor\]\n/);
    expect(r.result.cut_sheets[1]).toMatchObject({ asset_hints_override: true, cut_sheet_file_rel: "components/02-hub-api.md", seams_incident: 2 });
    expect(r.report.warnings).toEqual(expect.arrayContaining(["Hub API: **Asset Hints:** names `cronjob` — Kubernetes manifest assets were removed in 8.104.0 and the hint is ignored"]));   // and dropped from asset_types above
    expect(web).toMatch(/component_version: 1\.1\.0\ncomponent_owner: Channels squad\nasset_types: \[c4-descriptor\]\n/);   // "Helm on AKS" in the Deployment section: a k8s workload, which carries no manifest asset since 8.104.0
    expect(web).toMatch(/component_type: web-application\n/);
    // a GraphQL service is not a REST one: `graphql-sdl`, and no OpenAPI skeleton with empty paths
    const g = await prepare(TMP, { components: "graph-bff", date: "2026-09-08" }); const gb = rd(g.result.cut_sheets[0].payload_path);
    expect(gb).toMatch(/asset_types: \[graphql-sdl, c4-descriptor\]\n/);
    expect(gb).not.toMatch(/openapi/);
    expect(hub).toMatch(/## Component File \(raw\) <!-- SECTION: Component File -->\n\n<!-- docs\/components\/order-desk\/02-hub-api\.md, verbatim \(explorer header removed\) -->\n\n# Hub API\n\n\*\*Type:\*\* API Service/);
    expect(hub).not.toMatch(/EXPLORER_HEADER/);
    expect(hub).toMatch(/## Owned Entities <!-- SECTION: Owned Entities -->\n\nFrom `docs\/components\/order-desk\/02-hub-api\.md` § Data ownership:\n\n- orders \(owner\)/);
    expect(hub).toMatch(/## Budgets \(from Runtime View\) <!-- SECTION: Budgets -->\n\nSource: `docs\/04-data-flow-patterns\.md` § latency budget[^\n]*\n\n_Latency budget breakdown_\n\n\| Hop \| Budget \|\n\|[-|]+\n\| Web App → Hub API \| ≤ 800 ms \|\n\| Hub API → Order DB \| ≤ 200 ms \|/);
    expect(hub).toMatch(/## Seams incident on this component <!-- SECTION: Seams -->\n\n- \.\.\/interfaces\/web-app→hub-api\.md   ← inbound \(I-01, E-01\)\n- \.\.\/interfaces\/hub-api→order-db\.md   ← outbound \(I-02, E-02\)/);
    // an edge whose other end has no seam is still the component's: listed for § 2, so the specification names every I-nn its
    // security obligations list (kit-check interface-missing); an undecided end says the judge's worksheet is pending
    expect(hub).toMatch(/\*\*Interfaces without an Interface Contract\*\*[^\n]*\n\n- I-03   ← inbound, from Order Events topic · Kafka — the other end is undecided[^\n]*\n- I-04   ← outbound, to Fraud Screen · HTTPS — the other end is undecided/);
    expect(web).not.toMatch(/Interfaces without an Interface Contract/);
    expect(hub).toMatch(/## Flows referencing this component <!-- SECTION: Flows Referencing -->\n\n- F-01 phase 1 \(Submit\)\n- F-01 phase 2 \(Settle\)\n/);
    expect(rd(r.result.cut_sheets[0].payload_path)).toMatch(/## Flows referencing this component[^\n]*\n\n- F-01 phase 1 \(Submit\)\n\n## Applicable/);
    expect(hub).toMatch(/## Applicable Cross-Cutting Standards Rules <!-- SECTION: Applicable Rules -->\n\n- ADR-101, ADR-102\n/);
    expect(hub).toMatch(/## Relevant ADRs <!-- SECTION: Relevant ADRs -->\n\n- ADR-101 — Keep the desk[\s\S]*\n- ADR-102 — Use the hub/);
  });

  test("panels: a seam is cut to its two nodes (or the route through an intermediary), a component to its one-hop neighbourhood — head, subgraphs, edges and class lines of the source diagram, linkStyle dropped", async () => {
    const r = await prepare(TMP, { components: "hub-api,web-app", date: "2026-09-08" });
    const s = rd(r.result.seams.find((x: any) => x.edge_key === "web-app→hub-api").payload_path);
    expect(s).toMatch(/## Panel <!-- SECTION: Panel -->\n\nCut of `docs\/03-architecture-layers\.md` § Diagram: C4 Level 2 — Container View — Web App → Hub API \(generated, never hand-edited\):\n\n```mermaid\n%%\{\n  init: \{ 'theme': 'base' \}\n\}%%\n%% BP-CNL-XCHN-<SUBJ>-CNT-<NNN>\nflowchart TB\n  classDef unit[^\n]*\n  classDef store[^\n]*\n  classDef oos[^\n]*\n%% Cut of C4 Level 2 — Container View — Web App → Hub API — generated by handoff-prepare\.js, never hand-edited\n  subgraph SYS\["Order Desk"\]\n    WEB\["Web App<br\/>React"\]\n    HUB\["Hub API"\]\n  end\n  WEB -->\|"HTTPS\/JSON \[Command\]"\| HUB\n  class WEB,HUB unit;\n```/);
    expect(s.split("## Panel")[1].split("## Boundaries Upstream")[0]).not.toMatch(/linkStyle|FRAUD|Order DB/);
    const hub = rd(r.result.cut_sheets.find((x: any) => x.slug === "hub-api").payload_path);
    expect(hub).toMatch(/## Panel <!-- SECTION: Panel -->\n\nCut of [^\n]* — Hub API and its neighbours \(generated, never hand-edited\):\n\n```mermaid[\s\S]*  subgraph SYS\["Order Desk"\]\n    WEB\["Web App<br\/>React"\]\n    HUB\["Hub API"\]\n    DB\[\("Order DB"\)\]\n  end\n  subgraph EXT\["Outside"\]\n    FRAUD\["Fraud Screen"\]\n  end\n  WEB -->[^\n]*\| HUB\n  HUB -->[^\n]*\| DB\n  HUB -->[^\n]*\| FRAUD\n  style FRAUD stroke-dasharray:5 5\n  class WEB,HUB unit;\n  class DB store;\n  class FRAUD oos;\n```/);
    expect(r.result.panels.cuts).toBe(4);   // two seams (web-app→hub-api, hub-api→order-db), two components
    // the cutter alone: a pair joined only through an intermediary is cut along the route
    const g = parseFlowchart("flowchart LR\n  A[\"a\"]\n  B[\"b\"]\n  C[\"c\"]\n  A --> B\n  B --> C\n  class A,B,C unit;");
    expect(emitFlowchart(g, new Set(["A", "C"]), "x")).toBe("flowchart LR\n%% x\n  A[\"a\"]\n  C[\"c\"]\n  class A,C unit;");
    expect(emitFlowchart(g, new Set(["A", "B", "C"]), null)).toBe("flowchart LR\n  A[\"a\"]\n  B[\"b\"]\n  C[\"c\"]\n  A --> B\n  B --> C\n  class A,B,C unit;");
  });

  test("decisions follow the manifest: REGEN with none, SKIP when the hash and the output file match, REGEN under --force", async () => {
    const r1 = await prepare(TMP, { components: "hub-api", date: "2026-09-08" });
    expect(r1.result.run).toMatchObject({ ekonte_decision: "REGEN", settei_decision: "REGEN", ekonte_reason: "no manifest entry" });
    expect(r1.result.seams.every((s: any) => s.decision === "REGEN")).toBe(true);
    const seam = r1.result.seams[0], cut = r1.result.cut_sheets[0];
    mkdirSync(join(TMP, "handoffs/interfaces"), { recursive: true }); mkdirSync(join(TMP, "handoffs/components"), { recursive: true });
    writeFileSync(join(TMP, "handoffs", seam.seam_file_rel), "x"); writeFileSync(join(TMP, "handoffs", cut.cut_sheet_file_rel), "x"); writeFileSync(join(TMP, "handoffs/SYSTEM_RUNTIME_VIEW.md"), "x");
    writeFileSync(join(TMP, "handoffs/.manifest.json"), JSON.stringify({ version: "4", generator: "sa-skills:architecture-dev-handoff", generator_version: "8.23.0",
      run: { ekonte_hash: r1.result.run.ekonte_payload_hash, ekonte_template_version: TEMPLATE_VERSION, settei_hash: "sha256:other", settei_template_version: TEMPLATE_VERSION, schema_version: SCHEMA_VERSION, architecture_version: "1.2.0", generated: "2026-09-08" },
      seams: { [seam.edge_key]: { payload_hash: seam.payload_hash, template_version: TEMPLATE_VERSION, schema_version: SCHEMA_VERSION, seam_file: seam.seam_file_rel, related_adrs: [], generated: "2026-09-08" } },
      cut_sheets: { "hub-api": { payload_hash: cut.payload_hash, template_version: TEMPLATE_VERSION, schema_version: SCHEMA_VERSION, architecture_version: "1.2.0", cut_sheet_file: cut.cut_sheet_file_rel, assets: [], doc_language: "en", generated: "2026-09-08" } } }));
    const r2 = await prepare(TMP, { components: "hub-api", date: "2026-09-08" });
    expect(r2.result.run).toMatchObject({ ekonte_decision: "SKIP", settei_decision: "REGEN", settei_reason: "payload hash changed" });
    expect(r2.result.seams.map((s: any) => s.decision)).toEqual(["SKIP", "REGEN"]);
    expect(r2.result.cut_sheets[0]).toMatchObject({ decision: "SKIP", reason: "unchanged since last generation" });
    const r3 = await prepare(TMP, { components: "hub-api", date: "2026-09-08", force: true });
    expect(r3.result.cut_sheets[0]).toMatchObject({ decision: "REGEN", reason: "--force flag set" });
    rmSync(join(TMP, "handoffs"), { recursive: true, force: true });
  });

  test("the CLI prints the CONTEXT_RESULT block on stdout and the review on stderr; --json prints the result object", async () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--components", "hub-api", "--date", "2026-09-08"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = r.stdout.toString();
    expect(out).toMatch(/^CONTEXT_RESULT:\n  status: OK\n  payload_dir: [^\n]*handoff-payloads\n  shared_docs_read: 4\n  analyses_read: 2\n  institutional_adrs_read: 1\n  warnings:\n    - "Latency Budget/);
    expect(out).toMatch(/\n  run:\n    ekonte_payload_path: [^\n]*_run\.md\n[\s\S]*ekonte_decision: REGEN\n/);
    expect(out).toMatch(/\n  seams:\n    - edge_key: web-app→hub-api\n      payload_path: [^\n]*\n      payload_hash: sha256:[0-9a-f]{64}\n      decision: REGEN\n      reason: no manifest entry\n      seam_file_rel: interfaces\/web-app→hub-api\.md\n      related_adrs: \[ADR-102, ADR-103, ADR-101\]\n/);   // edge provenance first
    expect(out).toMatch(/\n  cut_sheets:\n    - slug: hub-api\n[\s\S]*      asset_types: \[openapi, asyncapi, c4-descriptor\]\n      asset_hints_override: true\n      doc_language: en\n      cut_sheet_file_rel: components\/02-hub-api\.md\n      component_version: 1\.0\.0/);
    const err = r.stderr.toString();
    expect(err).toMatch(/^Payloads: [^\n]*_run\.md \(\d+ KB\), 2 seam\(s\), 1 component payload\(s\); 4 shared docs, 2 analyses, 1 institutional ADRs, 3 descriptors read\nEdges: 4 active \(1 async\) — 2 endpoint\(s\) UNDECIDED \(no seam until the judge answers\): I-03 upstream "Order Events topic"/);
    expect(err).toMatch(/\nPanels: [^\n]* — 1 node label\(s\) UNDECIDED \("Fraud Screen"; answer [^\n]*resolve-name\.worksheet\.md and re-run\)\n/);
    expect(out).toMatch(/\n  unresolved_endpoints: \[\]\n  undecided_endpoints:\n    - "I-03 upstream/);
    expect(err).toMatch(/\nDecisions: Runtime View REGEN/);
    expect(err).not.toMatch(/[Cc]ompliance/);
    const j = Bun.spawnSync(["bun", SCRIPT, TMP, "--components", "hub-api", "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(JSON.parse(j.stdout.toString()).cut_sheets[0].slug).toBe("hub-api");
    expect(JSON.parse(rd(join(TMP, ".cache/sa-skills/handoff-payloads/context-result.json"))).seams.length).toBe(2);
  });
});
