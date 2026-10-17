/**
 * sim-export.js — the scenarios of the load simulation as one Excel workbook (8.56.0): a stored ZIP with a
 * correct CRC, XLSX parts Excel and unzip accept, sheet names Excel accepts, and a composition — summary,
 * inputs, comparison, one sheet per scenario — that carries the model's figures in the document's language.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const X = require("../scripts/sim-export.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const S = require("../scripts/simulation.js");

const scene = {
  project: "Chat de Movimientos", version: "5.2.2",
  nodes: [{ id: "app", name: "App", kind: "app" }, { id: "gw", name: "Gateway GraphQL", kind: "gateway" }, { id: "svc", name: "Service", kind: "service" }, { id: "db", name: "DB", kind: "store" }, { id: "sgw", name: "Sync", kind: "service" }],
  phases: { 1: { name: "read", budget: "≤ 1 s", path: [["app", "gw"], ["gw", "svc"], ["svc", "db"]] }, 2: { name: "sync", budget: "≤ 60 s", path: [["app", "sgw"]] } },
  useCases: [{ id: "UC-01", name: "Read", target: "≤ 1 s", phases: [1] }, { id: "UC-02", name: "Sync", target: "≤ 60 s", phases: [2] }],
  deployment: { tiers: [{ n: 1, name: "T1" }], nodes: [{ id: "aks", name: "AKS", tier: 1 }, { id: "cdn", name: "CDN / WAF", kind: "managed", tier: 1, metered: { by: "bytes", direction: "out", source: "contract" } }],
    instances: [{ container: "app", node: "aks" }, { container: "gw", node: "aks" }, { container: "svc", node: "aks" }, { container: "db", node: "aks" }, { container: "sgw", node: "aks" }] },
  capacity: { unit: "rps", threshold: 0.7,
    demand: [{ useCase: "UC-01", rps: 100, sessions: null, peakFactor: 3, source: "measured" }, { useCase: "UC-02", rps: null, sessions: 8000, peakFactor: 1 }],
    instances: [{ container: "gw", nodes: ["aks"], replicas: 2, maxReplicas: 4, capacityPerReplica: 60, requestSize: 1000, responseSize: 8000, source: "load test" }, { container: "svc", nodes: ["aks"], replicas: 4, maxReplicas: 10, capacityPerReplica: 50 }, { container: "sgw", nodes: ["aks"], replicas: 1, maxReplicas: 1, capacityPerReplicaSessions: 5000, sessionTransfer: 200 }],
    pricing: { cdn: { perGB: 0.1, currency: "USD", source: "assumption" } } },
};
const L1 = { id: "l1", a: "aks", b: "cdn" };
const carrier = (a: string, b: string) => (a === "app" && b === "gw" ? [{ link: L1, dir: 1 }] : null);
const model = S.buildModel(scene);
const run = (sc: any) => { const result = S.run(model, sc); const transit = S.transit(model, result, carrier); result.findings.push(...transit.findings); S.sortFindings(result.findings); return { result, transit }; };
const scenarios = [
  { name: "base", scenario: S.emptyScenario("base"), source: "base" },
  { name: "Traffic ×3", scenario: Object.assign(S.emptyScenario("Traffic ×3"), { scale: 3, metrics: ["bytes"], overrides: { svc: { requestSize: 500 } } }), source: "project", note: "assumed sizes" },
];
const ctx = { lang: "en", project: "Chat de Movimientos", version: "5.2.2", date: "2026-09-17", model, scenarios, run };
const unxml = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const cellText = (sheetXml: string) => [...sheetXml.matchAll(/<c r="([A-Z]+\d+)"[^>]*>(?:<v>([^<]*)<\/v>|<is><t[^>]*>([^<]*)<\/t><\/is>)<\/c>/g)].reduce((m: Record<string, string>, x) => { m[x[1]] = unxml(x[2] ?? x[3]); return m; }, {});

describe("zip and xlsx", () => {
  test("crc32 and a stored zip unzip verifies; names, sizes and offsets are right", async () => {
    expect(X.crc32(new TextEncoder().encode("123456789"))).toBe(0xCBF43926);   // the reference check value of CRC-32
    const bytes = X.zip([{ name: "a.txt", data: "hello" }, { name: "dir/b.xml", data: "<x/>" }]);
    expect(bytes[0]).toBe(0x50); expect(bytes[1]).toBe(0x4b);
    const dir = mkdtempSync(join(tmpdir(), "sim-export-")); const f = join(dir, "t.zip"); writeFileSync(f, bytes);
    const out = await Bun.$`unzip -t ${f}`.text(); expect(out).toMatch(/No errors detected/);
    expect((await Bun.$`unzip -p ${f} dir/b.xml`.text())).toBe("<x/>");
  });
  test("sheet names: Excel's forbidden characters replaced, 31 characters, unique", () => {
    const taken = new Set<string>();
    expect(X.sheetName("Prueba · tamaños supuestos (MB/s)", taken)).toBe("Prueba · tamaños supuestos (MB");
    expect(X.sheetName("Prueba · tamaños supuestos (MB/s) bis", taken)).toBe("Prueba · tamaños supuestos (2)");
    expect(X.sheetName("a[b]:c*d?e", taken)).toBe("a b c d e"); expect(X.sheetName("", taken)).toBe("Sheet");
    expect(X.colName(0)).toBe("A"); expect(X.colName(25)).toBe("Z"); expect(X.colName(26)).toBe("AA"); expect(X.colName(701)).toBe("ZZ");
  });
  test("a workbook: every part present, numbers as values, strings inline and escaped, the heading bold, a frozen pane", async () => {
    const bytes = X.workbook([{ name: "S1", rows: [[{ v: "Name", bold: true }, "Value"], ["a<b&\"c\"", 1.5], [null, true]], freeze: 1 }, { name: "S1", rows: [["x"]] }]);
    const dir = mkdtempSync(join(tmpdir(), "sim-export-")); const f = join(dir, "t.xlsx"); writeFileSync(f, bytes);
    expect(await Bun.$`unzip -t ${f}`.text()).toMatch(/No errors detected/);
    const list = await Bun.$`unzip -Z1 ${f}`.text();
    expect(list.trim().split("\n").sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]);
    const wb = await Bun.$`unzip -p ${f} xl/workbook.xml`.text(); expect(wb).toContain('<sheet name="S1" sheetId="1" r:id="rId1"/><sheet name="S1 (2)" sheetId="2" r:id="rId2"/>');
    const s1 = await Bun.$`unzip -p ${f} xl/worksheets/sheet1.xml`.text();
    expect(s1).toContain('<c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Name</t></is></c>');
    expect(s1).toContain('<c r="A2" t="inlineStr"><is><t xml:space="preserve">a&lt;b&amp;&quot;c&quot;</t></is></c><c r="B2"><v>1.5</v></c>');
    expect(s1).toContain('<c r="B3" t="b"><v>1</v></c>'); expect(s1).toContain('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>');
    expect(s1).toMatch(/<cols><col min="1" max="1" width="\d+" customWidth="1"\/>/);
  });
});

describe("the workbook of a simulation, written for a reader", () => {
  test("compose: a reading first, then the summary, the comparison, the documented data and one sheet per scenario — sentences, labels, painted states, percentages, figures with their unit, in the document's language", () => {
    const sheets = X.compose(ctx);
    expect(sheets.map((s: any) => s.name)).toEqual(["Reading", "Summary", "Comparison", "Documented data", "base", "Traffic ×3"]);
    // the reading: a title, then per scenario its name, what it is, the paragraph and the findings as sentences
    const rd = sheets[0].rows; expect(sheets[0].widths).toEqual([120]);
    expect(rd[0][0]).toEqual({ v: "Chat de Movimientos · v5.2.2 · 2026-09-17", bold: true });
    expect(rd[2]).toEqual([{ v: "base", bold: true }]); expect(rd[3]).toEqual([{ v: "the documented base, no assumption", fmt: "wrap" }]);
    const para = rd[4][0].v;
    expect(para).toContain('Scenario "base" at ×1 of the documented demand, threshold 0.7.'); expect(para).toContain("1 saturated: Sync (160 %)."); expect(para).toContain("1 at limit: Gateway GraphQL (83 %)."); expect(para).toContain("1 receive load and are not sized: DB.");
    expect(para).toContain("The first to break as the load grows is Sync, at ×0.63."); expect(para).toContain("Traffic-billed: CDN / WAF 0.8 MB/s ≈ 2,104 GB/month ≈ 210 USD."); expect(para).toContain("2 receiver(s) state no size, so the traffic figures are a floor.");
    expect(rd[5][0].v).toBe("• Sync is saturated (utilization 160 %): it receives 8,000 sessions with 1 replica(s). It would need 3 replicas, above its maximum of 1.");
    expect(rd.find((r: any) => r[0] && /^• Gateway GraphQL is at limit/.test(r[0].v))[0].v).toBe("• Gateway GraphQL is at limit (utilization 83 %, threshold 0.7): it receives 100 rps with 2 replica(s). 3 replicas would bring it to 56 %.");
    expect(rd.find((r: any) => r[0] && /^• DB receives/.test(r[0].v))[0].v).toBe("• DB receives 100 rps and is not evaluated: its Capacity table lacks capacity per replica + replicas. Add the row to its descriptor, or assume a figure in the scenario.");
    expect(rd.find((r: any) => r[0] && /^• CDN/.test(r[0].v))[0].v).toBe("• CDN / WAF sends 0.8 MB/s, about 2,104 GB a month at ×1. At 0.1 USD/GB that is about 210 USD a month (assumption; an assumption, not documentation).");
    // the summary: the overall state painted, the load entering, counts and money
    const sum = sheets[1].rows; expect(sheets[1].freeze).toBe(3);
    expect(sum[2].map((c: any) => c.v)).toEqual(["Scenario", "Overall state", "What it is", "Scale", "Load entering the system", "Saturated", "At limit", "Capacity pending", "Interrupted", "Breaks first", "At scale", "Metered traffic (GB / month)", "Metered cost / month", "Metrics shown", "Note"]);
    expect(sum[4]).toEqual(["Traffic ×3", { v: "Saturated", fmt: "crit" }, "a scenario of the project (overrides file)", { v: 3, fmt: "n2" }, "300 rps · 24,000 sessions", { v: 3, fmt: "int" }, { v: 0, fmt: "int" }, { v: 1, fmt: "int" }, { v: 0, fmt: "int" }, "Sync", { v: 0.63, fmt: "n2" }, { v: 6312, fmt: "int" }, "631 USD", "bytes", "assumed sizes"]);
    // the comparison: utilization as a painted percentage, traffic in MB/s
    const cmp = sheets[2].rows;
    expect(cmp[1].map((c: any) => c.v)).toEqual(["Container", "base", "Traffic ×3"]);
    expect(cmp.find((r: any) => r[0] === "Gateway GraphQL")).toEqual(["Gateway GraphQL", { v: 0.833, fmt: "pctwarn" }, { v: 2.5, fmt: "pctcrit" }]);
    const bytesBlock = cmp.findIndex((r: any) => r[0] && r[0].v === "Traffic out per scenario (MB/s)");
    expect(cmp.slice(bytesBlock).find((r: any) => r[0] === "Gateway GraphQL")).toEqual(["Gateway GraphQL", { v: 0.8, fmt: "n2" }, { v: 2.55, fmt: "n2" }]);
    // the documented data: figures with their unit, replicas as a range, sizes in KB
    const inputs = sheets[3].rows;
    expect(inputs[1].map((c: any) => c.v)).toEqual(["Use case", "Documented", "Peak factor", "Source"]);
    expect(inputs[2]).toEqual(["UC-01", "100 rps", { v: 3, fmt: "n2" }, "measured"]); expect(inputs[3]).toEqual(["UC-02", "8,000 sessions", { v: 1, fmt: "n2" }, null]);
    expect(inputs.find((r: any) => r[0] === "Gateway GraphQL")).toEqual(["Gateway GraphQL", "AKS", "60 rps", "2–4", { v: 1, fmt: "n2" }, { v: 8, fmt: "n2" }, null, "load test"]);
    expect(inputs.find((r: any) => r[0] === "DB")).toEqual(["DB", "AKS", "Not documented", "Not documented", null, null, null, null]);
    expect(inputs[inputs.length - 1]).toEqual(["CDN / WAF", "what leaves it", "0.1 USD/GB", "contract · assumption"]);
    // the scenario sheet: paragraphs merged across the table with a height, a glance block, then the tables with words and painted states
    const t3s = sheets[5], t3 = t3s.rows;
    expect(t3s.widths.length).toBe(10); expect(t3s.merges).toEqual([[1, 0, 9], [2, 0, 9]]); expect(Object.keys(t3s.heights)).toEqual(["1", "2"]); expect(t3s.heights[1]).toBeGreaterThan(15);
    expect(t3[0]).toEqual([{ v: "Traffic ×3", bold: true }, "a scenario of the project (overrides file)"]); expect(t3[1][0].fmt).toBe("wrap"); expect(t3[1][0].v).toContain('Scenario "Traffic ×3" at ×3'); expect(t3[2]).toEqual([{ v: "assumed sizes", fmt: "wrap" }]);
    const g = t3.findIndex((r: any) => r[0] && r[0].v === "At a glance");
    expect(t3[g + 1].map((c: any) => c.v)).toEqual(["What to look at", "Figure", "State"]);
    expect(t3[g + 2]).toEqual(["Overall state", "Saturated", { v: "Saturated", fmt: "crit" }]);
    // assumptions: one row per container, one column per figure assumed somewhere in the scenario — Traffic ×3 assumes one size on one container
    const asm = t3.findIndex((r: any) => r[0] && r[0].v === "Assumptions of this scenario");
    expect(t3[asm + 1].map((c: any) => c.v)).toEqual(["Container", "Request size (KB)"]);
    expect(t3[asm + 2]).toEqual(["Service", { v: 0.5, fmt: "n2" }]); expect(t3[asm + 3]).toEqual([]);
    expect(t3[g + 3]).toEqual(["Load entering the system", "300 rps · 24,000 sessions", null]);
    expect(t3[g + 4]).toEqual(["Most loaded container", "Sync · 480 %", { v: "Saturated", fmt: "crit" }]);
    expect(t3[g + 5]).toEqual(["First to break as the load grows", "Sync · ×0.63", null]);
    expect(t3[g + 6]).toEqual(["Traffic through CDN / WAF", "2.4 MB/s ≈ 6,312 GB/month ≈ 631 USD/month", { v: "Information", fmt: "info" }]);
    expect(t3[g + 7]).toEqual(["Containers not yet sized", "1 receive load and are not evaluated", { v: "Capacity pending", fmt: "pending" }]);
    expect(t3.find((r: any) => r[0] === "UC-01")).toEqual(["UC-01", "300 rps", "100 rps", "no", "yes"]);
    expect(t3.find((r: any) => r[0] === "Gateway GraphQL" && r[1] === "AKS")).toEqual(["Gateway GraphQL", "AKS", { v: "Saturated", fmt: "crit" }, { v: 2.5, fmt: "pct" }, "300 rps", "300 rps", "0.3 MB/s", "2.55 MB/s", "2 × 60 rps", "×1.2"]);
    expect(t3.find((r: any) => r[0] === "DB" && r[1] === "AKS")).toEqual(["DB", "AKS", { v: "Capacity pending", fmt: "pending" }, null, "300 rps", "—", "pending", "pending", "Not documented", null]);   // it receives and states no size: its traffic, in and out, is pending
    const fi = t3.findIndex((r: any) => r[0] && r[0].v === "Findings");
    expect(t3[fi + 1].map((c: any) => c.v)).toEqual(["Level", "What happens", "Where", "Figure", "What to do"]);
    expect(t3[fi + 2]).toEqual([{ v: "Critical", fmt: "crit" }, { v: "Sync is saturated (utilization 480 %): it receives 24,000 sessions with 1 replica(s).", fmt: "wrap" }, "AKS", "480 %", { v: "It would need 7 replicas, above its maximum of 1.", fmt: "wrap" }]);
    expect(t3.find((r: any) => r[1] && /^CDN \/ WAF sends/.test(r[1].v))).toEqual([{ v: "Information", fmt: "info" }, { v: "CDN / WAF sends 2.4 MB/s, about 6,312 GB a month at ×3.", fmt: "wrap" }, null, "6,312 GB/month", { v: "At 0.1 USD/GB that is about 631 USD a month (assumption; an assumption, not documentation).", fmt: "wrap" }]);   // the carrier maps the sized hop only, so nothing on the CDN's chain is pending
    expect(t3.find((r: any) => r[0] === "CDN / WAF" && r[3] === "what leaves it")).toEqual(["CDN / WAF", "0.3 MB/s", "2.4 MB/s", "what leaves it", { v: 6312, fmt: "int" }, "631 USD", null]);
    expect(t3[t3.length - 1]).toEqual(["UC-02", "≤ 60 s", "2 · sync", { v: 4.8, fmt: "pct" }, "∞", "yes"]);   // the phase by its name; an infinite stretch reads ∞
    const es = X.compose(Object.assign({}, ctx, { lang: "es" }));
    expect(es.map((s: any) => s.name).slice(0, 4)).toEqual(["Lectura", "Resumen", "Comparación", "Datos documentados"]); expect(es[1].rows[3][2]).toBe("la base documentada, sin supuestos"); expect(es[1].rows[3][1]).toEqual({ v: "Saturado", fmt: "crit" });
    expect(es[0].rows[5][0].v).toBe("• Sync está saturado (utilización 160 %): recibe 8.000 sesiones con 1 réplica(s). Necesitaría 3 réplicas, por encima de su máximo de 1.");
    expect(es[5].rows.find((r: any) => r[0] === "Estado general")).toEqual(["Estado general", "Saturado", { v: "Saturado", fmt: "crit" }]);
  });
  test("the whole file opens: workbook(compose()) is a valid zip; the styles carry percent, decimals, wrapped and painted cells; the paragraphs are merged with a height; the file name is a slug", async () => {
    const bytes = X.workbook(X.compose(ctx));
    const dir = mkdtempSync(join(tmpdir(), "sim-export-")); const f = join(dir, X.fileName("Chat de Movimientos", "2026-09-17", "es")); expect(f).toMatch(/chat-de-movimientos-simulacion-2026-09-17\.xlsx$/);
    writeFileSync(f, bytes);
    expect(await Bun.$`unzip -t ${f}`.text()).toMatch(/No errors detected/);
    const s6 = await Bun.$`unzip -p ${f} xl/worksheets/sheet6.xml`.text(); const c = cellText(s6);
    expect(c.A1).toBe("Traffic ×3"); expect(c.A2).toContain('Scenario "Traffic ×3" at ×3');
    expect(s6).toMatch(/<row r="2" ht="\d+" customHeight="1"><c r="A2" t="inlineStr" s="6">/); expect(s6).toContain('<mergeCells count="2"><mergeCell ref="A2:J2"/><mergeCell ref="A3:J3"/></mergeCells>');
    expect(s6).toMatch(/<c r="D\d+" s="4"><v>2.5<\/v>/); expect(s6).toMatch(/<c r="C\d+" t="inlineStr" s="9"><is><t xml:space="preserve">Saturated/);   // utilization a percent cell; a saturated state painted red
    const st = await Bun.$`unzip -p ${f} xl/styles.xml`.text(); expect(st).toContain('<cellXfs count="16">'); expect(st).toContain('<fills count="8">'); expect(st).toContain('fgColor rgb="FFFFC7CE"'); expect(st).toContain('<alignment wrapText="1" vertical="top"/>');
    expect(X.fileName("Ñandú  Pagos!", "2026-01-02", "en")).toBe("nandu-pagos-simulation-2026-01-02.xlsx");
  });
});

describe("a metered node with nothing sized on its chain", () => {
  test("reads as a missing figure, never as a bill of nothing — in the reading, the glance block and the summary", () => {
    const sc = JSON.parse(JSON.stringify(scene)); Object.assign(sc.capacity.instances.find((i: any) => i.container === "gw"), { requestSize: null, responseSize: null });
    const m = S.buildModel(sc); const sheets = X.compose(Object.assign({}, ctx, { model: m, scenarios: [scenarios[0]], run: (s: any) => { const result = S.run(m, s); const transit = S.transit(m, result, carrier); result.findings.push(...transit.findings); S.sortFindings(result.findings); return { result, transit }; } }));
    expect(sheets[0].rows.find((r: any) => r[0] && /^• CDN/.test(r[0].v))[0].v).toBe("• CDN / WAF has no traffic figure yet: 1 receiver(s) on its chain state no request or response size (Gateway GraphQL). Add request_size and response_size to those Capacity tables, or assume them in the scenario.");
    expect(sheets[0].rows[4][0].v).not.toContain("Traffic-billed");
    expect(sheets[1].rows[3].slice(11, 13)).toEqual([null, null]);
    expect(sheets[4].rows.find((r: any) => r[0] === "Traffic through CDN / WAF")).toEqual(["Traffic through CDN / WAF", "no figure yet — 1 receiver(s) on its chain state no size", { v: "Capacity pending", fmt: "pending" }]);
  });
});

describe("a phase in its own unit (8.42.0) in the workbook", () => {
  test("a phase-qualified demand row reads as docs/08 writes it — UC-01 · F1 in the use-case cell", () => {
    const sc = JSON.parse(JSON.stringify(scene)); sc.capacity.demand.push({ useCase: "UC-01", phase: "1", rps: 20, sessions: null, peakFactor: 1, source: "cache reads" });
    const m = S.buildModel(sc); const sheets = X.compose(Object.assign({}, ctx, { model: m, scenarios: [scenarios[0]], run: (s: any) => ({ result: S.run(m, s), transit: null }) }));
    expect(sheets[3].rows.find((r: any) => r[0] === "UC-01 · F1")).toEqual(["UC-01 · F1", "20 rps", { v: 1, fmt: "n2" }, "cache reads"]);
    expect(sheets[4].rows.find((r: any) => r[0] === "UC-01 · F1")).toEqual(["UC-01 · F1", "20 rps", "20 rps", "no", "yes"]);
  });
});
