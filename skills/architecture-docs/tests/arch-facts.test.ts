/**
 * arch-facts.js — the facts ledger collected from a small project: every part comes from its one
 * source, the summary counts it, `--section` prints one part, and a project with nothing but an
 * ARCHITECTURE.md still yields a ledger with warnings rather than an error.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { collect, summary } = require("../scripts/arch-facts.js");
const SCRIPT = join(__dirname, "..", "scripts", "arch-facts.js");

const TMP = join(__dirname, ".temp-arch-facts");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
const header = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: orders, payments\ntechnologies: React\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: One line.\nrelated_adrs: ADR-101\n-->`;
const container = (name: string, self: string, ctype: string, type: string, tech: string) => `# ${name}\n\n${header(self, ctype)}\n\n**Type:** ${type}\n**Technology:** [${tech}]\n**Description:** ${name} does one thing.\n**Internal Name:** \`CHL-${self}\`\n**C4 Level:** Container (L2)\n\n**Component Version:** 1.3.0\n**Architecture Version:** 1.2.0\n**Last Updated:** 2026-09-01\n\n## Purpose\n\nDoes one thing.\n`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.2.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- ARCHITECTURE_RELEASED: 2026-09-01 -->\n<!-- DOC_LANGUAGE: en -->\n<!-- ARCHITECTURE_TYPE: Microservices -->\n<!-- PROSE_STYLE: v1 -->\n\n# Order Desk — Architecture\n\n**Version**: 1.2.0\n**Architect**: Platform Team\n**Supersedes**: v1.1.0\n`);
  w("docs/01-system-overview.md", `# System Overview\n\n<!-- EXPLORER_HEADER\nkey_concepts: overview\ntechnologies: React\ncomponents: web-app\nscope: The overview.\nrelated_adrs: ADR-101\n-->\n\nText.\n`);
  w("docs/03-architecture-layers.md", `# Layers\n\n<!-- EXPLORER_HEADER\nkey_concepts: layers\ntechnologies: React\ncomponents: web-app\nscope: The layers.\nrelated_adrs: ADR-101\n-->\n\n| Layer | Containers | Inside boundary |\n|---|---|---|\n| **L1 — Channel** | Web App | Yes |\n| **L2 — Partners** | Hub API | No |\n\n#### Diagram: Logical View\n\n#### Diagram: C4 Level 2 — Container\n`);
  w("docs/04-data-flow-patterns.md", `# Flows\n\n<!-- EXPLORER_HEADER\nkey_concepts: flows\ntechnologies: React\ncomponents: web-app\nscope: The flows.\nrelated_adrs: ADR-101\n-->\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Place an order | The user submits | UC-01 | ≤ 2 s |\n| 2. Orphan | Nothing | UC-02, UC-03 | ≤ 1 s |\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Submit | yes | Web App → Hub API | Rejected |\n| 2 | Settle | no — batch | Hub API → Web App | Late |\n\n#### Phase 1 — Submit\n\n**Hops**: Web App → Hub API\n**Latency budget (p95)**: ≤ 800 ms, at the edge\n\n#### Flow 1 — Place an order\n\n**Phases**: 1 → 2 (synchronous).\n**Governed by**: [ADR-101](../adr/ADR-101-x.md), ADR-102.\n**Delta**: Payment moves to the hub.\n`);
  w("docs/05-integration-points.md", `# Integrations\n\n<!-- EXPLORER_HEADER\nkey_concepts: integrations\ntechnologies: React\ncomponents: web-app\nscope: The integrations.\nrelated_adrs: ADR-101\n-->\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Web App\` | \`Hub API\` (Payments Hub) | HTTPS/JSON | Request-response | Partner |\n| ~~I-02~~ | ~~\`Web App\`~~ | ~~\`Hub Ledger\`~~ | — | — | **Retired** |\n`);
  w("docs/CHANGELOG.md", `# Changelog\n\n## [Unreleased]\n\n## [1.2.0] - 2026-09-01 (Released)\n\n- x\n\n## [1.1.0] - 2026-08-01\n`);
  w("docs/components/order-desk.md", `# Order Desk\n\n${header("order-desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", container("Web App", "web-app", "web-application", "Web Application", "React"));
  w("docs/components/payments-hub.md", `# Payments Hub\n\n${header("payments-hub", "external-system")}\n\n**C4 Level:** System (L1)\n**Type:** External System\n\n## Containers\n\n| Component | Type | Technology |\n|---|---|---|\n| Hub API | Gateway | [Azure APIM] |\n`);
  w("adr/ADR-101-x.md", `# ADR-101: Keep the desk\n\n**Status**: ✅ Accepted\n**Scope**: Project\n`);
  w("adr/ADR-102-y.md", `# ADR-102: Use the hub\n\n**Status**: Proposed\n**Scope**: Project\n`);
  w("tdr/TDR-001-debt.md", `# TDR-001: A debt\n\n## Status\n\nOpen — waiver pending.\n`);
  w("tdr/TDR-002-planned.md", `---\nstatus: Planned   # one of five\ntarget-date: 2026-12-01\ndriver: Process\naffected-components: ["Web App", Hub API]\n---\n\n# TDR-002: A planned debt\n\n## Status\n\n\`Open\`\n`);
  w("tdr/TDR-003-wont-fix.md", `---\nstatus: Won't Fix\naffected-components:\n  - Hub API\n---\n\n# TDR-003: A permanent debt\n\n## Status\n\n\`Won't Fix\`\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("arch-facts", () => {
  test("every part comes from its source", () => {
    const f = collect(TMP);
    expect(f.schema_version).toBe("1.0");
    expect(f.architecture).toEqual({ name: "Order Desk", version: "1.2.0", status: "Released", released: "2026-09-01", language: "en", type: "Microservices", prose_style: "v1", architect: "Platform Team", supersedes: "v1.1.0" });
    expect(f.docs.map((d: any) => d.file)).toEqual(["docs/01-system-overview.md", "docs/03-architecture-layers.md", "docs/04-data-flow-patterns.md", "docs/05-integration-points.md"]);
    expect(f.docs[0].key_concepts).toEqual(["overview"]);
    expect(f.docs[0].bytes).toBeGreaterThan(50);
    expect(f.systems.map((s: any) => [s.slug, s.owned, s.containers])).toEqual([["order-desk", true, ["web-app"]], ["payments-hub", false, ["hub-api"]]]);
    const hub = f.components.find((c: any) => c.slug === "hub-api");   // declared as a row of the external descriptor's Containers table
    expect(hub).toMatchObject({ name: "Hub API", level: "L2", system: "payments-hub", type: "Gateway", technology: ["Azure APIM"], file_backed: false, component_version: null, last_updated: null, bytes: 0 });
    expect(f.components.find((c: any) => c.slug === "web-app").file_backed).toBe(true);
    const web = f.components.find((c: any) => c.slug === "web-app");
    expect(web).toMatchObject({ name: "Web App", level: "L2", system: "order-desk", type: "Web Application", technology: ["React"], internal_name: "CHL-web-app", component_version: "1.3.0", last_updated: "2026-09-01", related_adrs: ["ADR-101"], tdrs: [] });
    expect(hub.tdrs).toEqual([]);
    expect(f.components.find((c: any) => c.slug === "payments-hub").level).toBe("L1");
    expect(f.adrs.map((a: any) => [a.id, a.status, a.scope])).toEqual([["ADR-101", "Accepted", "Project"], ["ADR-102", "Proposed", "Project"]]);
    expect(f.tdrs).toEqual([
      { id: "TDR-001", file: "tdr/TDR-001-debt.md", title: "A debt", status: "Open — waiver pending.", initiative: null, driver: null, capability: null, components: [] },
      // the frontmatter key wins over the body, and a trailing YAML comment is not part of the value
      { id: "TDR-002", file: "tdr/TDR-002-planned.md", title: "A planned debt", status: "Planned", initiative: null, driver: "Process", capability: null, components: ["Web App", "Hub API"] },
      // an apostrophe inside the value is not a quote
      { id: "TDR-003", file: "tdr/TDR-003-wont-fix.md", title: "A permanent debt", status: "Won't Fix", initiative: null, driver: null, capability: null, components: ["Hub API"] },
    ]);
    expect(f.layers).toEqual([{ n: 1, name: "Channel", containers: ["Web App"], owned: true }, { n: 2, name: "Partners", containers: ["Hub API"], owned: false }]);
    expect(f.integrations).toEqual([
      { id: "I-01", from: "Web App", to: "Hub API (Payments Hub)", protocol: "HTTPS/JSON", pattern: "Request-response", boundary: "Partner", retired: false, line: 11 },
      { id: "I-02", from: "Web App", to: "Hub Ledger", protocol: "—", pattern: "—", boundary: "Retired", retired: true, line: 11 },
    ]);
    expect(f.phases).toEqual([
      { n: "1", name: "Submit", critical: "yes", owner_chain: "Web App → Hub API", failure_mode: "Rejected", hops: "Web App → Hub API", latency_budget: "≤ 800 ms, at the edge", has_block: true },
      { n: "2", name: "Settle", critical: "no — batch", owner_chain: "Hub API → Web App", failure_mode: "Late", hops: null, latency_budget: null, has_block: false },
    ]);
    expect(f.flows).toEqual([
      { code: "1", name: "Place an order", trigger: "The user submits", use_cases: ["UC-01"], latency_target: "≤ 2 s", phases: ["1", "2"], governed_by: ["ADR-101", "ADR-102"], delta: "Payment moves to the hub.", has_block: true },
      { code: "2", name: "Orphan", trigger: "Nothing", use_cases: ["UC-02", "UC-03"], latency_target: "≤ 1 s", phases: [], governed_by: [], delta: null, has_block: false },
    ]);
    expect(f.diagrams).toEqual([{ file: "docs/03-architecture-layers.md", diagrams: ["Logical View", "C4 Level 2 — Container"] }]);
    expect(f.releases).toEqual([{ version: "1.2.0", date: "2026-09-01", note: "(Released)" }, { version: "1.1.0", date: "2026-08-01", note: null }]);
    expect(f.warnings).toEqual([]);
    expect(summary(f)).toBe("facts: 4 docs, 2 systems, 2 containers, 2 ADRs, 3 TDRs, 2 layers, 1 integrations (1 retired), 2 phases, 2 flows, 0 demand rows, 0 capacity tables, 2 diagrams, 2 releases");
  });

  test("a descriptor's Technical Debt line is the component's tdrs: ids, deduplicated, links and separators dropped (10.8.0)", () => {
    const f = join(TMP, "docs/components/order-desk/01-web-app.md");
    const src = readFileSync(f, "utf8");
    writeFileSync(f, src.replace("**Last Updated:** 2026-09-01\n", "**Last Updated:** 2026-09-01\n**Technical Debt:** [TDR-004](../../../tdr/TDR-004-x.md) · tdr-001 · [TDR-004](y)\n"));
    expect(collect(TMP).components.find((c: any) => c.name === "Web App").tdrs).toEqual(["TDR-004", "TDR-001"]);
    writeFileSync(f, src);
  });

  test("the CLI writes .cache/sa-skills/facts.json by default and prints one part with --section", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = join(TMP, ".cache", "sa-skills", "facts.json");
    expect(existsSync(out)).toBe(true);
    expect(JSON.parse(readFileSync(out, "utf-8")).architecture.version).toBe("1.2.0");
    expect(r.stderr.toString()).toMatch(/^Wrote .*facts\.json\nfacts: 4 docs/);
    const s = Bun.spawnSync(["bun", SCRIPT, TMP, "--section", "integrations"], { stdout: "pipe", stderr: "pipe" });
    expect(JSON.parse(s.stdout.toString()).map((i: any) => i.id)).toEqual(["I-01", "I-02"]);
    const bad = Bun.spawnSync(["bun", SCRIPT, TMP, "--section", "nope"], { stdout: "pipe", stderr: "pipe" });
    expect(bad.exitCode).toBe(2);
    expect(bad.stderr.toString()).toMatch(/no section "nope" — one of: schema_version, generated_at/);
  });

  test("demand comes from docs/08 § Demand by Use Case, normalized to rps, with an unknown use case as a warning; a descriptor's Capacity table rides on its component", () => {
    w("docs/08-scalability-and-performance.md", `# Scalability\n\n<!-- EXPLORER_HEADER\nkey_concepts: scale\ntechnologies: React\ncomponents: web-app\nscope: Scale.\nrelated_adrs: ADR-101\n-->\n\n### Demand by Use Case <!-- LABEL: Demand by Use Case -->\n\n| Use Case | Value | Unit | Peak factor | Source |\n|---|---|---|---|---|\n| UC-01 | 6000 | tpm | 3 | measured |\n| UC-07 | 1 | rps | 1 | |\n`);
    w("docs/components/order-desk/01-web-app.md", container("Web App", "web-app", "web-application", "Web Application", "React") + `\n## Capacity <!-- LABEL: Capacity -->\n\n| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | 250 | rps | load test |\n| replicas | 2 | count | |\n`);
    const f = collect(TMP);
    expect(f.demand).toEqual([expect.objectContaining({ use_case: "UC-01", rps: 100, peak_factor: 3, flags: ["not_documented"].slice(0, 0) }), expect.objectContaining({ use_case: "UC-07", rps: 1 })]);
    expect(f.warnings).toEqual([expect.stringMatching(/^docs\/08 demand-use-case-unknown: UC-07/)]);
    expect(f.components.find((c: any) => c.slug === "web-app").capacity).toMatchObject({ capacity_per_replica_rps: 250, replicas: 2 });
    expect(summary(f)).toMatch(/2 demand rows, 1 capacity tables/);
    rmSync(join(TMP, "docs", "08-scalability-and-performance.md"));
    w("docs/components/order-desk/01-web-app.md", container("Web App", "web-app", "web-application", "Web Application", "React"));
  });

  test("a bare project yields a ledger with warnings, not an error", () => {
    const bare = join(TMP, "bare"); mkdirSync(bare, { recursive: true });
    writeFileSync(join(bare, "ARCHITECTURE.md"), "# Bare\n");
    const f = collect(bare);
    expect(f.architecture.name).toBe("Bare");
    expect(f.architecture.version).toBeNull();
    expect([f.docs, f.systems, f.components, f.adrs, f.tdrs, f.layers, f.integrations, f.phases, f.flows, f.diagrams, f.releases]).toEqual([[], [], [], [], [], [], [], [], [], [], []]);
    expect(f.warnings).toEqual([]);
  });
});

describe("arch-facts before ARCHITECTURE.md exists (8.92.7)", () => {
  const T2 = join(__dirname, ".temp-arch-facts-partial");
  const w2 = (rel: string, body: string) => { mkdirSync(join(T2, rel, ".."), { recursive: true }); writeFileSync(join(T2, rel), body, "utf-8"); };
  afterAll(() => rmSync(T2, { recursive: true, force: true }));
  test("a create's segments 2–3: the docs and ADRs on disk, the language and type from the collection and docs/03", () => {
    rmSync(T2, { recursive: true, force: true });
    w2(".cache/sa-skills/collect.json", JSON.stringify({ doc_language: "es", architecture_type: "ENTERPRISE" }));
    w2("docs/01-system-overview.md", "# Visión General\n\n<!-- EXPLORER_HEADER\nkey_concepts: visión\ntechnologies: React\ncomponents: web-app\nscope: La visión.\nrelated_adrs: ADR-001\n-->\n\nTexto.\n");
    w2("adr/ADR-001-meta.md", "# ADR-001: Uso de ENTERPRISE\n\n**Status**: Accepted\n");
    const f = collect(T2);
    expect(f.architecture.language).toBe("es");
    expect(f.architecture.type).toBe("ENTERPRISE");
    expect(f.adrs.map((a: { id: string }) => a.id)).toEqual(["ADR-001"]);
    expect(f.docs.map((d: { file: string }) => d.file)).toEqual(["docs/01-system-overview.md"]);
    w2("docs/03-architecture-layers.md", "# Capas\n\n<!-- ARCHITECTURE_TYPE: BIAN -->\n");
    expect(collect(T2).architecture.type).toBe("BIAN");
  });
});
