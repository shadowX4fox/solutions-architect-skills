/**
 * capacity.ts — the one reader of the Capacity and Demand tables (8.33.0): closed registries, `Not documented`
 * as the only non-number, everything normalized to rps (tps/tpm through requests_per_transaction, flagged when
 * assumed), sessions kept as a gauge; a malformed table is a component-cli `check` defect, an absent one is not.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { parseCapacity, parseDemand, parseValue, toRps, toBytes, CAPACITY_METRICS, CAPACITY_UNITS } from "../utils/capacity";
import { listComponents } from "../utils/component-facts";

const CLI = join(__dirname, "..", "utils", "component-cli.ts");
let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "capacity-test-")); });
afterEach(() => { if (existsSync(root)) rmSync(root, { recursive: true, force: true }); });
const w = (rel: string, body: string) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), body, "utf-8"); };
const header = (self: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: Spring Boot\ncomponent_self: ${self}\ncomponent_type: api-service\nscope: One line.\nrelated_adrs: ADR-101\n-->`;
const descriptor = (table: string, heading = "## Capacidad <!-- LABEL: Capacity -->") => `# Gateway GraphQL Pedidos\n\n${header("gateway-graphql-pedidos")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n**Description:** Gateway GraphQL Pedidos compone la respuesta del historial.\n**C4 Level:** Container (L2)\n\n## Propósito <!-- LABEL: Purpose -->\n\nx\n\n${heading}\n\n${table}\n\n## Despliegue <!-- LABEL: Deployment -->\n\ny\n`;
const GOOD = `| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | 250 | rps | Prueba de carga 2026-08 · [ADR-117](../../adr/ADR-117-x.md) |\n| replicas | 3 | count | HPA \`minReplicas\` |\n| max_replicas | 10 | count | HPA \`maxReplicas\` |\n| requests_per_transaction | 2 | ratio | una consulta = dos llamadas |\n| documented_demand | 13.300 | tpm | Medición de la tribu, 2026-09-06 |`;

describe("values and units", () => {
  test("a Value is a number in any thousands convention, or the literal Not documented; anything else is invalid", () => {
    expect(parseValue("13300")).toEqual({ value: 13300, not_documented: false, invalid: false });
    expect(parseValue("13.300").value).toBe(13300); expect(parseValue("13,300").value).toBe(13300); expect(parseValue("0,19").value).toBe(0.19); expect(parseValue("1 300").value).toBe(1300); expect(parseValue("0.95").value).toBe(0.95);
    expect(parseValue("Not documented")).toEqual({ value: null, not_documented: true, invalid: false });
    expect(parseValue("≈ 760").invalid).toBe(true); expect(parseValue("500–800").invalid).toBe(true); expect(parseValue("sin declarar").invalid).toBe(true);
  });
  test("everything normalizes to rps: rpm and tpm over 60, tps and tpm through requests_per_transaction (flagged when assumed), sessions stay a gauge", () => {
    expect(toRps(120, "rpm", null)).toEqual({ rps: 2, sessions: null, flags: [] });
    expect(toRps(100, "tps", 2)).toEqual({ rps: 200, sessions: null, flags: [] });
    expect(toRps(13300, "tpm", null)).toEqual({ rps: 221.667, sessions: null, flags: ["assumed_rpt"] });
    expect(toRps(13300, "tpm", 2).rps).toBe(443.333);
    expect(toRps(10000, "sessions", 2)).toEqual({ rps: null, sessions: 10000, flags: [] });
    expect(toRps(3, "count", null)).toEqual({ rps: null, sessions: null, flags: [] });
    expect(CAPACITY_METRICS).toEqual(["capacity_per_replica", "replicas", "max_replicas", "requests_per_transaction", "documented_demand", "request_size", "response_size", "session_transfer"]);
    expect(CAPACITY_UNITS).toEqual(["rps", "rpm", "tps", "tpm", "sessions", "count", "ratio", "B", "KB", "MB", "KB/s", "MB/s"]);
  });
});

describe("the descriptor's Capacity table", () => {
  test("parses by the LABEL anchor whatever the visible heading, and normalizes", () => {
    const c = parseCapacity(descriptor(GOOD))!;
    expect(c.warnings).toEqual([]); expect(c.flags).toEqual([]);
    expect(c).toMatchObject({ capacity_per_replica_rps: 250, replicas: 3, max_replicas: 10, requests_per_transaction: 2, documented_demand_rps: 443.333, documented_demand_sessions: null });
    expect(c.rows.map((r) => r.metric)).toEqual(["capacity_per_replica", "replicas", "max_replicas", "requests_per_transaction", "documented_demand"]);
    expect(c.rows[0].source).toMatch(/ADR-117/); expect(c.rows[0].line).toBeGreaterThan(10);
    expect(parseCapacity(descriptor(GOOD, "## Capacity"))!.capacity_per_replica_rps).toBe(250);   // legacy visible heading, no anchor
  });
  test("Not documented rows are flags, not defects; a tps demand without requests_per_transaction is assumed ×1 and flagged", () => {
    const c = parseCapacity(descriptor(`| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | Not documented | rps | |\n| replicas | 3 | count | |\n| documented_demand | 76 | tps | docs/01 Key Metrics |`))!;
    expect(c.warnings).toEqual([]);
    expect(c.flags.sort()).toEqual(["assumed_rpt", "not_documented:capacity_per_replica"]);
    expect(c.capacity_per_replica_rps).toBeNull(); expect(c.documented_demand_rps).toBe(76); expect(c.max_replicas).toBeNull();
  });
  test("sizes (8.54.0): request_size / response_size in B, KB, MB and session_transfer in KB/s, MB/s normalize to bytes, decimal, case-insensitive; a size in a throughput unit is a mismatch", () => {
    expect(toBytes(1.5, "KB")).toBe(1500); expect(toBytes(2, "mb")).toBe(2000000); expect(toBytes(0.4, "KB/s")).toBe(400); expect(toBytes(3, "rps")).toBeNull(); expect(toBytes(null, "KB")).toBeNull();
    const c = parseCapacity(descriptor(`| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | 250 | rps | |\n| replicas | 3 | count | |\n| request_size | 1,2 | kb | contrato GraphQL |\n| response_size | 8 | KB | p50 de la respuesta |\n| session_transfer | Not documented | KB/s | |`))!;
    expect(c.warnings).toEqual([]);
    expect(c).toMatchObject({ request_size_bytes: 1200, response_size_bytes: 8000, session_transfer_bps: null });
    expect(c.flags).toEqual(["not_documented:session_transfer"]);
    const bad = parseCapacity(descriptor(`| Metric | Value | Unit | Source |\n|---|---|---|---|\n| request_size | 8 | rps | |\n| session_transfer | 8 | KB | |`))!;
    expect(bad.warnings.map((x) => x.split(":")[0])).toEqual(["capacity-unit-mismatch", "capacity-unit-mismatch"]);
    expect(bad.warnings[0]).toMatch(/expected B \| KB \| MB/); expect(bad.warnings[1]).toMatch(/expected KB\/s \| MB\/s/);
  });
  test("a malformed table is a defect that names the line: unknown metric, unknown or mismatched unit, invalid value, duplicate, missing columns", () => {
    const c = parseCapacity(descriptor(`| Metric | Value | Unit | Source |\n|---|---|---|---|\n| throughput | 250 | rps | |\n| replicas | 3 | pods | |\n| max_replicas | ≈ 10 | count | |\n| capacity_per_replica | 250 | count | |\n| replicas | 4 | count | |`))!;
    expect(c.warnings.map((x) => x.split(":")[0])).toEqual(["capacity-metric-unknown", "capacity-unit-unknown", "capacity-value-invalid", "capacity-unit-mismatch", "capacity-metric-duplicate"]);
    expect(c.warnings[2]).toMatch(/max_replicas = "≈ 10" at line \d+ — a number or the literal `Not documented`/);
    const cols = parseCapacity(descriptor(`| Métrica | Valor | Unidad | Fuente |\n|---|---|---|---|\n| replicas | 3 | count | |`))!;
    expect(cols.warnings[0]).toMatch(/^capacity-columns: .*column headers never localize/);
    expect(parseCapacity(descriptor("no table here"))!.warnings[0]).toMatch(/^capacity-table-missing/);
    expect(parseCapacity("# X\n\n## Purpose\n\nno capacity section\n")).toBeNull();
  });
  test("component-facts carries `capacity` on the fact; check fails on a malformed table and passes an absent one", () => {
    w("docs/components/tienda-movil.md", `# Tienda Movil\n\n${header("tienda-movil")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
    w("docs/components/tienda-movil/04-gateway-graphql-pedidos.md", descriptor(GOOD));
    w("docs/components/tienda-movil/05-other.md", `# Other\n\n${header("other")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n**Description:** Other serves nothing yet.\n**C4 Level:** Container (L2)\n`);
    w("docs/components/README.md", "# Components\n");
    const facts = listComponents(root);
    expect(facts.find((f) => f.slug === "gateway-graphql-pedidos")!.capacity).toMatchObject({ capacity_per_replica_rps: 250, replicas: 3 });
    expect(facts.find((f) => f.slug === "other")!.capacity).toBeNull();
    expect(facts.flatMap((f) => f.warnings).filter((x) => x.startsWith("capacity"))).toEqual([]);
    w("docs/components/tienda-movil/05-other.md", descriptor(`| Metric | Value | Unit | Source |\n|---|---|---|---|\n| throughput | 250 | rps | |`).replace("Gateway GraphQL Pedidos", "Other").replace("gateway-graphql-pedidos", "other"));
    const r = Bun.spawnSync(["bun", CLI, "check", root], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(1); expect(r.stderr.toString() + r.stdout.toString()).toMatch(/capacity-metric-unknown: "throughput"/);
  });
});

describe("docs/08's Demand table", () => {
  test("rows by use case, normalized, with the peak factor; unknown ids and units are warnings; absent section is null", () => {
    const doc = `# Scalability\n\n### Demanda por caso de uso <!-- LABEL: Demand by Use Case -->\n\n| Use Case | Value | Unit | Peak factor | Source |\n|---|---|---|---|---|\n| UC-01 | 76 | tps | 3 | Medición 2026-09-06 |\n| UC-04 | 10.000 | sessions | 1 | ADR-117 |\n| UC-09 | Not documented | rps | | |\n| UC-02 | 600 | rpm | 2 | |\n| UC-05 | 5 | pods | 1 | |\n| FLOW-7b | 3.8 | tps | | contingencia |\n`;
    const d = parseDemand(doc, ["UC-01", "UC-02", "UC-04", "UC-05", "FLOW-7b"])!;
    expect(d.rows.map((r) => [r.use_case, r.rps, r.sessions, r.peak_factor])).toEqual([["UC-01", 76, null, 3], ["UC-04", null, 10000, 1], ["UC-09", null, null, 1], ["UC-02", 10, null, 2], ["UC-05", null, null, 1], ["FLOW-7b", 3.8, null, 1]]);
    expect(d.rows[2].not_documented).toBe(true);
    expect(d.warnings).toEqual([expect.stringMatching(/^demand-use-case-unknown: UC-09 at line \d+/), expect.stringMatching(/^demand-unit-unknown: "pods"/)]);
    expect(parseDemand("# Scalability\n\nno demand table\n")).toBeNull();
    expect(parseDemand("# S\n\n### Demand by Use Case\n\nprose only\n")!.warnings[0]).toMatch(/^demand-table-missing/);
  });
  test("a phase-qualified row (UC-02 · F3, / fase 3, (phase 3), #3) is that phase's unit inside the use case; checked against the phases the flow declares; duplicates warn", () => {
    const doc = `# S\n\n### Demand by Use Case <!-- LABEL: Demand by Use Case -->\n\n| Use Case | Value | Unit | Peak factor | Source |\n|---|---|---|---|---|\n| UC-02 | 10000 | sessions | 5 | ADR-117 |\n| UC-02 · F3 | 20 | rps | | lecturas del cache por sesión |\n| UC-08 / fase 2 | 500 | sessions | | |\n| UC-02 (phase 9) | 1 | rps | | |\n| UC-08 #2 | 1 | sessions | | |\n| UC-01 Consulta | 76 | tps | | prose after the id is not a phase |\n`;
    const d = parseDemand(doc, [{ id: "UC-02", phases: [1, 2, 3, 4] }, { id: "UC-08", phases: ["9", "1", "2", "3"] }, "UC-01"])!;
    expect(d.rows.map((r) => [r.use_case, r.phase, r.key, r.rps, r.sessions])).toEqual([["UC-02", null, "UC-02", null, 10000], ["UC-02", "3", "UC-02/3", 20, null], ["UC-08", "2", "UC-08/2", null, 500], ["UC-02", "9", "UC-02/9", 1, null], ["UC-08", "2", "UC-08/2", null, 1], ["UC-01", null, "UC-01", 76, null]]);
    expect(d.warnings).toEqual([expect.stringMatching(/^demand-phase-unknown: UC-02 · F9 at line \d+ — phase 9 is not one UC-02 declares \(1, 2, 3, 4\)/), expect.stringMatching(/^demand-row-duplicate: UC-08 · F2 at line \d+/)]);
    expect(parseDemand(doc, ["UC-02", "UC-08", "UC-01"])!.warnings).toEqual([expect.stringMatching(/^demand-row-duplicate/)]);   // ids without phases: nothing to check the phase against
  });
});
