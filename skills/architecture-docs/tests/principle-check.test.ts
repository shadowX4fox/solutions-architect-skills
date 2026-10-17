/**
 * principle-check.js — the Section 3 Enforcement Gate, Layer 1, as code. One rule at a time on a fixture that
 * passes clean, in Spanish with anchors (what the plugin writes), plus a legacy English document without anchors
 * (what it must still read). Every finding names a line so the fix is an edit, not a rewrite.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, parse, CANON } = require("../scripts/principle-check.js");
const SCRIPT = join(__dirname, "..", "scripts", "principle-check.js");
const TMP = join(__dirname, ".temp-principle-check");

const ES = ["Separación de Responsabilidades", "Alta Disponibilidad", "Escalabilidad Primero", "Seguridad por Diseño", "Observabilidad", "Resiliencia", "Simplicidad", "Nativo de Nube", "Estándares Abiertos", "Desacoplamiento por Eventos"];
type P = { desc: string; impl: string[]; trade: string[] };
const base = (n: number): P => ({
  desc: `El equipo acepta el costo de ${ES[n - 1].toLowerCase()} y prefiere la ruta documentada.`,
  impl: [
    `- El \`Servicio ${n}\` aplica TLS 1.3 en la ${n === 1 ? "capa de canal (L1)" : "frontera"}, per [ADR-117](../adr/ADR-117-base.md).`,
    `- ${n === 4 ? "El registro de auditoría cubre cumplimiento AML" : n === 9 ? "El contrato se publica en OpenAPI 3.1" : n === 6 ? "Cada orden es idempotente por su clave de 2 campos" : "La réplica se limita a 2 nodos"}, per ADR-001.`,
  ],
  trade: ["- La deuda de la ruta manual crece con cada versión.", "- Un salto más de 20 ms por frontera.", "- La guardia asume un contrato más que operar."],
});
function doc(n = 9, mutate: (ps: P[]) => void = () => {}, header?: string): string {
  const ps = Array.from({ length: n }, (_, i) => base(i + 1)); mutate(ps);
  const out = [`# Principios <!-- SECTION: Architecture Principles -->`, "", header ?? `## Principios de Arquitectura (${ps.length} Principios Fundamentales) <!-- SECTION: Architecture Principles -->`, ""];
  ps.forEach((p, i) => out.push(`### ${i + 1}. ${ES[i] ?? "Cosa"} <!-- PRINCIPLE: ${CANON[i] ?? "Cosa"} -->`, "", "**Descripción:** <!-- LABEL: Description -->", p.desc, "", "**Implementación:** <!-- LABEL: Implementation -->", ...p.impl, "", "**Compromisos:** <!-- LABEL: Trade-offs -->", ...p.trade, ""));
  return out.join("\n");
}
const run = (text: string, opts: any = {}) => { writeFileSync(join(TMP, "docs", "02-architecture-principles.md"), text); return check(TMP, opts); };
const rules = (r: any, sev = "BLOCKING") => r.findings.filter((f: any) => f.severity === sev).map((f: any) => f.rule);

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(join(TMP, "docs"), { recursive: true }); mkdirSync(join(TMP, "adr"));
  writeFileSync(join(TMP, "docs", "01-system-overview.md"), "# Overview\n\nLos movimientos llegan por Kafka.\n");
  writeFileSync(join(TMP, "docs", "03-architecture-layers.md"), "<!-- ARCHITECTURE_TYPE: ENTERPRISE -->\n# Capas\n");
  writeFileSync(join(TMP, "adr", "ADR-001-meta.md"), "# ADR-001\n"); writeFileSync(join(TMP, "adr", "ADR-117-base.md"), "# ADR-117\n");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("principle-check — clean pass", () => {
  test("a nine-principle Spanish document with anchors passes every rule; the type comes from the docs/03 marker", () => {
    const r = run(doc());
    expect(r.status).toBe("PASS"); expect(r.blocking).toBe(0); expect(r.warnings).toBe(0);
    expect(r.arch_type).toBe("ENTERPRISE"); expect(r.type_source).toBe("docs/03 marker");
    expect(r.results.map((x: any) => x.rule)).toEqual(["P-STRUCT-01", "P-STRUCT-02", "P-STRUCT-03", "P-STRUCT-04", "P-PLACEHOLDER-01", "P-CUSTOM-01", "P-PLATITUDE-01", "P-SPECIFIC-01", "P-TRADEOFF-QUANT-01", "P-TRADEOFF-COUNT-01", "P-TRADEOFF-GAP-01", "P-TRADEOFF-NEG-01", "P-QA-CONFLATION-01", "P-ADR-REF-01", "P-ADR-REF-01a", "P-CROSS-CONTRA-01", "P-BUDGET-01", "P-TYPE-MATRIX-01"]);
    expect(r.principles.map((p: any) => p.anchor)).toEqual(CANON.slice(0, 9));
  });
  test("ten principles pass when docs/01 documents an async pattern; the CLI exits 0 and prints the LAYER1 line", () => {
    expect(run(doc(10)).status).toBe("PASS");
    const p = Bun.spawnSync(["bun", SCRIPT, TMP], { stdout: "pipe", stderr: "pipe" });
    expect(p.exitCode).toBe(0); expect(p.stdout.toString()).toMatch(/LAYER1: PASS — 0 blocking finding\(s\), 0 warning\(s\)/);
  });
});

describe("principle-check — one rule at a time, each finding at a line", () => {
  test("P-STRUCT-01 order · P-STRUCT-02 missing subsection · P-STRUCT-03 header count", () => {
    const swapped = doc().replace("PRINCIPLE: High Availability", "PRINCIPLE: @@").replace("PRINCIPLE: Scalability First", "PRINCIPLE: High Availability").replace("PRINCIPLE: @@", "PRINCIPLE: Scalability First");
    expect(rules(run(swapped))).toContain("P-STRUCT-01");
    const r2 = run(doc().replace("**Compromisos:** <!-- LABEL: Trade-offs -->\n", ""));   // the first principle loses its Trade-offs label
    expect(r2.findings.find((f: any) => f.rule === "P-STRUCT-02")).toMatchObject({ principle: 1, subsection: "Trade-offs", line: 5 });
    const r3 = run(doc(9, () => {}, "## Principios de Arquitectura (8 Principios Fundamentales) <!-- SECTION: Architecture Principles -->"));
    expect(r3.findings.find((f: any) => f.rule === "P-STRUCT-03")).toMatchObject({ severity: "BLOCKING", line: 3 });
    expect(r3.findings.find((f: any) => f.rule === "P-STRUCT-03").message).toMatch(/found 9 principles but the header says 8/);
  });
  test("P-STRUCT-04 — P10 needs an async pattern in docs/01 or the components", () => {
    writeFileSync(join(TMP, "docs", "01-system-overview.md"), "# Overview\n\nSolo lectura síncrona.\n");
    const r = run(doc(10)); expect(rules(r)).toEqual(["P-STRUCT-04"]); expect(r.findings[0]).toMatchObject({ principle: 10, line: expect.any(Number) });
    writeFileSync(join(TMP, "docs", "01-system-overview.md"), "# Overview\n\nLos movimientos llegan por Kafka.\n");
  });
  test("P-TRADEOFF-GAP-01 — an open item in Trade-offs blocks; a gap that drives a stated cost does not (8.118.7)", () => {
    const r = run(doc(9, (ps) => {
      ps[2].trade[2] = "- El dimensionamiento del `Servicio 3` no está declarado y bloquea la primera oleada.";
      ps[4].trade[1] = "- El reparto del lag de 30 s entre los 5 saltos sigue sin derivar.";
      ps[5].trade[0] = "- The retry budget is not yet defined.";
      ps[1].trade[0] = "- El nivel de servicio sin clasificar implica un sobrecosto de USD 60K por año.";   // a cost, kept
      ps[6].trade[1] = "- Training en la base local y el diseño de canales: la dotación aprobada no se ha contrastado con esas brechas.";   // 8.118.9
      ps[7].trade[1] = "- Licensing per node: the approved budget has not been checked against the forecast.";
      ps[8].trade[1] = "- Training en la base local: dos ingenieros por 3 semanas.";                       // label + a cost, kept
    }));
    const gap = r.findings.filter((f: any) => f.rule === "P-TRADEOFF-GAP-01");
    expect(gap.map((f: any) => f.principle)).toEqual([3, 5, 6, 7, 8]);
    expect(gap.every((f: any) => f.severity === "BLOCKING" && f.line > 0)).toBe(true);
    expect(run(doc(9)).findings.filter((f: any) => f.rule === "P-TRADEOFF-GAP-01")).toEqual([]);
  });
  test("P-PLACEHOLDER-01 · P-CUSTOM-01 (a custom principle, an unanchored heading)", () => {
    const r = run(doc(9, (ps) => { ps[2].impl.push("- [Por definir] el límite."); }));
    expect(r.findings.find((f: any) => f.rule === "P-PLACEHOLDER-01")).toMatchObject({ principle: 3, line: expect.any(Number) });
    expect(rules(run(doc(9) + "\n### 10. Cosa <!-- PRINCIPLE: Cosa -->\n\n**Descripción:** <!-- LABEL: Description -->\nx\n"))).toContain("P-CUSTOM-01");
    expect(rules(run(doc(9) + "\n### 10. Otra cosa\n\ntexto\n"))).toContain("P-CUSTOM-01");
  });
  test("P-PLATITUDE-01 fires in Implementation / Trade-offs, in either language, and not in Description", () => {
    const r = run(doc(9, (ps) => { ps[1].impl.push("- Seguimos las mejores prácticas de la industria, per ADR-001."); ps[4].trade.push("- We follow industry best practices."); }));
    expect(r.findings.filter((f: any) => f.rule === "P-PLATITUDE-01").map((f: any) => [f.principle, f.subsection])).toEqual([[2, "Implementation"], [5, "Trade-offs"]]);
    expect(rules(run(doc(9, (ps) => { ps[1].desc = "El equipo acepta las mejores prácticas de la industria."; })))).toEqual([]);
  });
  test("P-SPECIFIC-01 — two system-specific tokens per Implementation; ADR ids are citations, not tokens; a tech name docs/06 declares counts", () => {
    const r = run(doc(9, (ps) => { ps[6].impl = ["- La replicación es de solo lectura, per [ADR-117](../adr/ADR-117-base.md).", "- Un documento por movimiento en Couchbase, per ADR-001."]; }));
    expect(r.findings.find((f: any) => f.rule === "P-SPECIFIC-01")).toMatchObject({ principle: 7, subsection: "Implementation" });
    expect(r.findings.find((f: any) => f.rule === "P-SPECIFIC-01").message).toMatch(/has 0 system-specific token\(s\)/);
    writeFileSync(join(TMP, "docs", "06-technology-stack.md"), "# Stack\n\n| Technology | Version |\n|---|---|\n| Couchbase | 7.6 |\n| Couchbase Lite | 3.2 |\n");
    const r2 = run(doc(9, (ps) => { ps[6].impl = ["- Un documento por movimiento en Couchbase, per ADR-001.", "- La réplica local usa Couchbase Lite, per ADR-001."]; }));
    expect(rules(r2)).toEqual([]);
    rmSync(join(TMP, "docs", "06-technology-stack.md"));
  });
  test("P-TRADEOFF-QUANT-01 accepts a number with a unit or a cost noun in either language · COUNT-01 needs three bullets · NEG-01 rejects 'Ninguno'", () => {
    const r = run(doc(9, (ps) => { ps[8].trade = ["- Cambiar de motor reescribe el borde.", "- Elecciones de producto, no de estándar.", "- Sin punto donde cifrar el payload."]; }));
    expect(rules(r)).toEqual([]);                                                          // "reescribe" is the rewrite cost
    const r3 = run(doc(9, (ps) => { ps[8].trade = ["- Cambiar de motor es difícil.", "- Elecciones de producto.", "- Sin punto donde cifrar."]; }));
    expect(r3.findings.find((f: any) => f.rule === "P-TRADEOFF-QUANT-01")).toMatchObject({ principle: 9, subsection: "Trade-offs" });
    expect(rules(run(doc(9, (ps) => { ps[3].trade = ["- La deuda crece.", "- 20 ms más."]; })))).toEqual(["P-TRADEOFF-COUNT-01"]);
    expect(rules(run(doc(9, (ps) => { ps[3].trade[0] = "- Ninguno."; })))).toEqual(["P-TRADEOFF-NEG-01"]);
    expect(rules(run(doc(9, (ps) => { ps[3].trade[0] = "- Impacto mínimo en la latencia p95, 3 ms por salto, y deuda en la ruta manual."; })))).toEqual([]);   // a real bullet that happens to start with a negation word is not a claim of none
  });
  test("P-QA-CONFLATION-01 — an outcome in the Description needs a decision verb (Spanish verbs count)", () => {
    expect(rules(run(doc(9, (ps) => { ps[1].desc = "El sistema alcanza 99.9 % de disponibilidad."; })))).toEqual(["P-QA-CONFLATION-01"]);
    expect(rules(run(doc(9, (ps) => { ps[1].desc = "El equipo asume el costo de 99.9 % de disponibilidad."; })))).toEqual([]);
  });
  test("P-ADR-REF-01 — every principle cites an ADR that exists (or the sentinel); 01a names a broken id at its line", () => {
    const r = run(doc(9, (ps) => { ps[5].impl = ["- La réplica se limita a 2 nodos con TLS 1.3.", "- El `Servicio 6` reintenta 3 veces."]; }));
    expect(r.findings.find((f: any) => f.rule === "P-ADR-REF-01")).toMatchObject({ principle: 6 });
    expect(rules(run(doc(9, (ps) => { ps[5].impl = ["- La réplica se limita a 2 nodos con TLS 1.3.", "- El `Servicio 6` reintenta 3 veces. <!-- NO_ADR_GOVERNS -->"]; })))).toEqual([]);
    const r2 = run(doc(9, (ps) => { ps[5].impl[0] = ps[5].impl[0].replace("ADR-117](../adr/ADR-117-base.md)", "ADR-999](../adr/ADR-999-nada.md)"); }));
    expect(rules(r2)).toEqual(["P-ADR-REF-01a"]); expect(r2.findings[0].message).toMatch(/ADR-999 is cited at line \d+ but no adr\/ADR-999-\*\.md exists/);
  });
  test("P-TYPE-MATRIX-01 — the ENTERPRISE rows, the waiver sentinel, and unknown type as a WARNING", () => {
    const r = run(doc(9, (ps) => { ps[0].impl = ["- El `Servicio 1` aplica TLS 1.3 en la frontera, per ADR-001.", "- La réplica se limita a 2 nodos, per ADR-001."]; }));
    expect(r.findings.find((f: any) => f.rule === "P-TYPE-MATRIX-01")).toMatchObject({ severity: "BLOCKING", principle: 1 });
    expect(rules(run(doc(9, (ps) => { ps[0].impl = ["- El `Servicio 1` aplica TLS 1.3, per ADR-001. <!-- TYPE_MATRIX_WAIVED: P-1: capa única -->", "- 2 nodos, per ADR-001."]; })))).toEqual([]);
    expect(run(doc(), { type: "MICROSERVICES" }).findings.filter((f: any) => f.rule === "P-TYPE-MATRIX-01").map((f: any) => f.principle)).toEqual([1, 3, 5, 6, 8]);
    rmSync(join(TMP, "docs", "03-architecture-layers.md"));
    const u = run(doc()); expect(u.arch_type).toBe("unknown"); expect(u.status).toBe("PASS"); expect(rules(u, "WARNING")).toEqual(["P-TYPE-MATRIX-01"]);
    mkdirSync(join(TMP, ".cache", "sa-skills"), { recursive: true }); writeFileSync(join(TMP, ".cache", "sa-skills", "collect.json"), JSON.stringify({ schema: "collect/1", architecture_type: "ENTERPRISE" }));
    expect(run(doc()).type_source).toBe("collect.json");
    rmSync(join(TMP, ".cache"), { recursive: true });
    writeFileSync(join(TMP, "docs", "03-architecture-layers.md"), "<!-- ARCHITECTURE_TYPE: ENTERPRISE -->\n# Capas\n");
  });
  test("P-CROSS-CONTRA-01 and P-BUDGET-01 warn and never block", () => {
    const r = run(doc(9, (ps) => { ps[6].impl.push("- Un monolito único, per ADR-001."); ps[2].impl.push("- Microservicios por dominio, per ADR-001."); for (let i = 0; i < 4; i++) ps[0].impl.push(`- Bullet ${i} per ADR-001.`); }));
    expect(r.status).toBe("PASS"); expect(rules(r, "WARNING")).toEqual(["P-CROSS-CONTRA-01", "P-BUDGET-01"]);
    expect(r.findings.find((f: any) => f.rule === "P-BUDGET-01").message).toMatch(/Implementation 6 bullets \(≤ 5\)/);
    const p = Bun.spawnSync(["bun", SCRIPT, TMP], { stdout: "pipe", stderr: "pipe" }); expect(p.exitCode).toBe(0);
  });
  test("the CLI exits 1 on a blocking finding and --json carries results and findings", () => {
    writeFileSync(join(TMP, "docs", "02-architecture-principles.md"), doc(9, (ps) => { ps[3].trade[0] = "- Ninguno."; }));
    const p = Bun.spawnSync(["bun", SCRIPT, TMP, "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(p.exitCode).toBe(1); const j = JSON.parse(p.stdout.toString());
    expect(j.status).toBe("FAIL"); expect(j.findings[0]).toMatchObject({ rule: "P-TRADEOFF-NEG-01", principle: 4, subsection: "Trade-offs" }); expect(j.results.length).toBe(18);
  });
});

describe("principle-check — legacy English document without anchors", () => {
  test("visible names and **Description:** labels are the fallback; canonical and legacy numbering must not mix", () => {
    const en = (nums: string[]) => ["## Architecture Principles (9 Core Principles)", "", ...CANON.slice(0, 9).map((n: string, i: number) => [`### ${nums[i]} ${n}`, "", "**Description:** The team accepts the cost of the documented route.", "", "**Implementation:**", "- `svc` runs TLS 1.3 at the channel layer with audit log compliance, retry and OpenAPI, per ADR-001.", "- Replicas are capped at 2 nodes, per [ADR-117](../adr/ADR-117-base.md).", "", "**Trade-offs:**", "- Debt grows with each release.", "- 20 ms more per hop.", "- On-call owns one more contract.", ""].join("\n"))].join("\n");
    const r = run(en(["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9."]));
    expect(r.status).toBe("PASS"); expect(parse(en(["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9."])).principles.every((p: any) => p.noAnchor)).toBe(true);
    const mixed = run(en(["1.", "3.2", "3.", "4.", "5.", "6.", "7.", "8.", "9."]));
    expect(mixed.findings.find((f: any) => f.rule === "P-STRUCT-01").message).toMatch(/numbering are mixed/);
  });
});

describe("principle-check — Layer 1.5, the lexicon's semantic findings re-read", () => {
  test("a cost named in words the lexicon lacks, and a concept expressed without the listed phrases, are downgraded by the judge and stand, not re-read, while undecided", async () => {
    const { judgeFindings } = require("../scripts/principle-check.js");
    const text = doc(9, (ps) => {
      ps[6].trade = ["- Cada integrante nuevo necesita dos semanas antes de tocar la tabla de ruteo.", "- Toda excepción pasa por revisión del comité.", "- La segunda opinión tarda un sprint."];   // no digit, no cost noun
      ps[0].impl = ["- La app de pedidos solo habla con el `gateway`; el gateway reparte hacia las capacidades de negocio y nada cruza hacia el núcleo sin pasar por integración, per [ADR-001](../adr/ADR-001-meta.md).", "- `shp-msa-gk-order` v2.1 es la única puerta."];   // ENTERPRISE concept, none of the phrases; the citation and the tokens the structural rules want stay
    });
    const r = run(text);
    expect(rules(r)).toEqual(["P-TYPE-MATRIX-01", "P-TRADEOFF-QUANT-01"].sort()); expect(r.blocking).toBe(2);
    const h = await judgeFindings(run(text), TMP, { engine: "agent" });                            // the worksheet is open: nothing re-read, Layer 1 stands
    expect(h.blocking).toBe(2); expect(h.judge.asked).toBe(2); expect(h.judge.downgraded).toEqual([]);
    expect(h.judge.notReRead.length).toBe(2); expect(h.judge.pending.length).toBe(2);
    const { layer15 } = require("../scripts/principle-check.js");
    expect(layer15(h.judge)).toContain("not re-read (undecided) — 2 finding(s) stand"); expect(layer15(h.judge)).toContain(h.judge.pending[0]);
    const x = await judgeFindings(run(text), TMP, { engine: "heuristic" });                        // a removed engine: the findings stand, the reason printed
    expect(x.blocking).toBe(2); expect(x.judge.notReRead.length).toBe(2); expect(x.judge.note).toMatch(/removed in 8\.119\.0/);
    const seen: any[] = [];
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); seen.push(b); const answers: any = {}; for (const id of Object.keys(b.questions)) answers[id] = { type: "noul", noul: 0.93 }; return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
    const j = await judgeFindings(run(text), TMP, { engine: "typesafe", apiKey: "k", fetch, cache: false });
    expect(seen.length).toBe(2);                                                                     // one request per rule, in parallel
    expect(Object.values(seen.flatMap((b) => Object.values(b.state.items))).some((s: any) => /dos semanas/.test(s.tradeoffs || ""))).toBe(true);
    expect(j.blocking).toBe(0); expect(j.status).toBe("PASS"); expect(j.warnings).toBe(2);
    expect(j.judge.downgraded.length).toBe(2);
    const f = j.findings.find((x: any) => x.rule === "P-TRADEOFF-QUANT-01");
    expect(f.severity).toBe("WARNING"); expect(f.judged).toEqual({ by: "jev-test", reading: "0.93" }); expect(f.message).toContain("judged otherwise by jev-test");
    expect(j.results.find((x: any) => x.rule === "P-TRADEOFF-QUANT-01").result).toBe("WARN");
  });
});

describe("principle-check — the Layer 2 stamp", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { readReview, stampReview, principlesHash } = require("../scripts/principle-check.js");
  const F = join(TMP, "stamp", "docs", "02-architecture-principles.md");
  test("stamped once at the end, current while the principles hold, stale after an edit, the hash blind to the stamp", () => {
    mkdirSync(join(F, ".."), { recursive: true });
    writeFileSync(F, "# Principles\r\n\r\nOne principle.\r\n");
    expect(readReview(F).state).toBe("unstamped");
    stampReview(F, "PASS", "2026-10-10");
    stampReview(F, "WARNING", "2026-10-11");   // a second stamp replaces the first
    const src = require("fs").readFileSync(F, "utf8");
    expect(src.match(/PRINCIPLE_REVIEW/g)).toHaveLength(1);
    expect(principlesHash(src)).toBe(principlesHash("# Principles\n\nOne principle.\n"));
    expect(readReview(F)).toMatchObject({ state: "current", layer2: "WARNING", date: "2026-10-11" });
    writeFileSync(F, src.replace("One principle.", "One principle, edited."));
    expect(readReview(F).state).toBe("stale");
  });
});
