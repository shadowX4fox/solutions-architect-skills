/**
 * traceability-prepare.js — the PO Spec's use cases against the architecture, by code and by judge. Rules under test:
 * the use cases and their fields are parsed in either language and each yields its requirements by the skill's table;
 * the evidence per requirement comes from the whole surface, never from an EXPLORER_HEADER, routed by type; the
 * requirement no judge has scored is Undecided — never classified by term overlap — and reported with its worksheet;
 * no step is dropped without an answer; the judge's Score picks the level, a flow step
 * judged pure navigation is not traced, the report carries the three levels, the largest-remainder percentages sum to
 * 100 and a Partial's gap is left as NOT DOCUMENTED, never composed.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const { parseSpec, requirementsOf, run, report, percents } = require("../scripts/traceability-prepare.js");
const TMP = join(import.meta.dir, ".temp-traceability");
const w = (rel: string, s: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), s); };
const HDR = (self: string) => `<!-- EXPLORER_HEADER\nkey_concepts: chat, historial, transferencias, contraparte, sincronizacion\ntechnologies: Couchbase\ncomponents: ${self}\ncomponent_self: ${self}\nscope: s\nrelated_adrs: ADR-101\n-->`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 3.2.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Chat\n");
  w("PRODUCT_OWNER_SPEC.md", [
    "# PO Spec", "", "## 4. Casos de Uso <!-- SECTION: Use Cases -->", "",
    "### UC-01: Consultar el historial con un contacto", "",
    "**Descripción**: El cliente revisa las transferencias con una contraparte.", "",
    "**Actores**: Cliente · Aplicación Tienda Móvil", "",
    "**Precondiciones**: El cliente está autenticado en la app; el dispositivo completó una sincronización inicial", "",
    "**Flujo principal**:", "", "1. El cliente abre la sección de transferencias.", "2. La aplicación consulta la base local filtrando por contraparte.", "3. El chat renderiza monto, fecha y cuenta de cada transferencia.", "",
    "**Flujos alternativos**:", "", "- **Sin movimientos**: el chat muestra un estado vacío.", "",
    "**Casos borde**:", "", "- Contraparte con volumen alto: la carga se mantiene bajo 1 segundo mediante paginación.", "",
    "**Postcondiciones**: El historial se sirvió desde la réplica local sin llamadas al backend.", "",
    "**Métricas de éxito**:", "", "- Tiempo de carga: < 1 s (P95)", "",
    "### UC-02: Borrado remoto", "", "**Flujo principal**:", "", "1. El banco ordena el borrado y la app destruye la base local.", "",
    "## 5. Historias", "",
  ].join("\n"));
  w("docs/01-system-overview.md", `# Overview\n\n${HDR("overview")}\n\n> Resumen.\n\n## 1. Resumen <!-- SECTION: Executive Summary -->\n\nEl chat de transferencias se sirve desde la réplica local en el dispositivo; la base local filtra por contraparte y renderiza monto, fecha y cuenta.\n`);
  w("docs/08-scalability-and-performance.md", `# Escala\n\n${HDR("scale")}\n\n## 10. Escalabilidad <!-- SECTION: Scalability and Performance -->\n\n### 10.1 SLO\n\n| SLO | Objetivo |\n|---|---|\n| Apertura del chat p95 | ≤ 1 s |\n\nLa paginación mantiene la carga de una contraparte de volumen alto bajo un segundo.\n`);
  w("docs/07-security-architecture.md", `# Seguridad\n\n${HDR("security")}\n\n## 9. Seguridad <!-- SECTION: Security Architecture -->\n\nEl cliente se autentica con JWT antes de abrir la base local.\n`);
  w("docs/components/README.md", "# Component Details\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n| 1 | Aplicación Tienda Móvil | [app.md](app.md) | App | React Native |\n");
  w("docs/components/app.md", `# Aplicación Tienda Móvil\n\n${HDR("app")}\n\n> La app.\n\n**Type:** App\n**Technology:** React Native\n**Description:** Aplicación Tienda Móvil — el chat.\n\n## Restricciones\n\nSin movimientos con la contraparte, el chat muestra un estado vacío que se distingue de una base sin sincronizar.\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("traceability-prepare", () => {
  test("the spec is parsed in Spanish and each use case yields its requirements by the skill's table", () => {
    const spec = parseSpec(readFileSync(join(TMP, "PRODUCT_OWNER_SPEC.md"), "utf8"));
    expect(spec.useCases.map((u: any) => u.id)).toEqual(["UC-01", "UC-02"]);
    expect(spec.useCases[0].fields.actor).toEqual(["Cliente · Aplicación Tienda Móvil"]);
    const reqs = requirementsOf(spec.useCases[0]);
    expect(reqs.map((r: any) => r.source)).toEqual(["Primary Flow", "Primary Flow", "Primary Flow", "Alternative Flow", "Edge Case", "Precondition", "Precondition", "Postcondition", "Success Metric"]);
    expect(reqs.find((r: any) => r.source === "Precondition" && /autenticado/.test(r.text)).type).toBe("auth");
    expect(reqs.find((r: any) => r.source === "Success Metric").type).toBe("performance");
  });
  test("unanswered requirements are Undecided and reported with the worksheet; evidence never comes from an EXPLORER_HEADER and metrics route to docs/08", async () => {
    const r = await run(TMP, { engine: "agent", cache: false, today: "2026-09-21" });
    expect(r.requirements.length).toBe(10); expect(r.judge.worksheets.length).toBe(2);
    expect(r.requirements.every((x: any) => !x.dropped && x.status === "Undecided" && x.by === "undecided")).toBe(true);
    expect(r.judge.undecided.length).toBe(10); expect(r.judge.navigation_undecided.length).toBe(4);
    r.requirements.forEach((x: any) => x.candidates.forEach((c: any) => expect(c.excerpt).not.toMatch(/EXPLORER_HEADER|key_concepts/)));
    const metric = r.requirements.find((x: any) => x.source === "Success Metric");
    expect(metric.candidates[0].file).toMatch(/docs\/08-/); expect(metric.candidates[0].routed).toBe(true);
    const md = report(r);
    expect(md).toContain("**Classified by**: agent — 10 requirement(s) undecided");
    expect(md).toContain("## UC-01: Consultar el historial con un contacto — Phase 1");
    expect(md).toContain("| ✅ Covered | 0 | 0% |"); expect(md).toContain("| ❔ Undecided | 10 | 100% |");
    expect(md).toContain("### ❔ Undecided (not judged)"); expect(md).toContain(r.judge.worksheets[0]);
    expect(md).not.toContain("term overlap");
  });
  test("the judge's Score picks the level, a navigation step is not traced, the gap of a Partial is NOT DOCUMENTED, the percentages sum to 100", async () => {
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); const answers: any = {};
      for (const [id, q] of Object.entries<any>(b.questions)) { const st = b.state.items[id];
        if (q.type === "noul") answers[id] = { type: "noul", noul: /abre la sección/.test(st.step) ? 0.9 : 0.05 };
        else { const s = /estado vacío/.test(st.requirement) ? 1.1 : /destruye la base/.test(st.requirement) ? 0.1 : 1.9; answers[id] = { type: "score", score: s, probabilities: {}, confidence: 0.8, legend: {} }; } }
      return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
    const r = await run(TMP, { engine: "typesafe", apiKey: "k", fetch, cache: false, today: "2026-09-21" });
    expect(r.judge.undecided.length).toBe(0); expect(r.judge.navigation_dropped.length).toBe(1);
    const live = r.requirements.filter((x: any) => !x.dropped);
    expect(live.length).toBe(9);
    expect(live.find((x: any) => /estado vacío/.test(x.text)).status).toBe("Partial");
    expect(live.find((x: any) => /destruye la base/.test(x.text)).status).toBe("Not Covered");
    expect(live.filter((x: any) => x.status === "Covered").length).toBe(7);
    const md = report(r);
    expect(md).toContain("| ✅ Covered | 7 | 78% |"); expect(md).toContain("| ⚠️ Partial | 1 | 11% |"); expect(md).toContain("| ❌ Not Covered | 1 | 11% |");   // 77.8 / 11.1 / 11.1 → 78 / 11 / 11 by largest remainder
    expect(md).toContain("[NOT DOCUMENTED: what is missing");
    expect(md).toContain("| UC-02 | El banco ordena el borrado y la app destruye la base local. | Primary Flow |");
    expect(md).toContain("### Flow steps read as navigation (not traced)");
    expect(md).toContain("<!-- jev-test 0.8 -->"); expect(md).not.toContain("Undecided");
  });
  test("largest-remainder percentages", () => {
    expect(percents([91, 14, 10])).toEqual([79, 12, 9]); expect(percents([1, 1, 1])).toEqual([34, 33, 33]); expect(percents([0, 0, 0])).toEqual([0, 0, 0]); expect(percents([2, 2, 2])).toEqual([34, 33, 33]);
  });
});

describe("traceability-prepare — one language on both sides of the judge", () => {
  test("an institutional catalog edition that differs from DOC_LANGUAGE is a warning; the same edition is silent", async () => {
    const { rmSync: rm } = require("fs");
    w("adr/.institutional-catalog.json", JSON.stringify({ schema_version: "1", edition: "en", files: {} }));
    const r = await run(TMP, { engine: "agent", cache: false, today: "2026-09-21" });
    expect(r.warnings.some((x: string) => /catalog is the 'en' edition while DOC_LANGUAGE is 'es'/.test(x))).toBe(true);
    w("adr/.institutional-catalog.json", JSON.stringify({ schema_version: "1", edition: "es", files: {} }));
    const s = await run(TMP, { engine: "agent", cache: false, today: "2026-09-21" });
    expect(s.warnings.some((x: string) => /edition/.test(x))).toBe(false);
    rm(join(TMP, "adr", ".institutional-catalog.json"), { force: true });
  });
});

describe("traceability — delivery increments (8.143.0)", () => {
  test("a use case's phase is its delivery increment, rows in the table's order, the rest Not assigned", async () => {
    const f = join(TMP, "docs/01-system-overview.md"), keep = readFileSync(f, "utf8");
    try {
      writeFileSync(f, keep + "\n### Incrementos de entrega <!-- LABEL: Delivery Increments -->\n\n| Increment | Use Cases | Target |\n|---|---|---|\n| 1 | UC-2 | 2026-12 |\n| 2 | UC-03 | 2027-03 |\n");
      const r = await run(TMP, { engine: "agent", cache: false, today: "2026-10-10" });
      expect([...new Set(r.requirements.map((x: any) => `${x.uc} ${x.phase}`))]).toEqual(["UC-01 Sin asignar", "UC-02 Incremento 1 · 2026-12"]);
      const md = report(r);
      const table = md.split("### Coverage by Phase")[1].split("\n---")[0];
      expect(table.indexOf("| Incremento 1 · 2026-12 |")).toBeGreaterThan(0);
      expect(table.indexOf("| Incremento 1 · 2026-12 |")).toBeLessThan(table.indexOf("| Sin asignar |"));
      expect(md).toContain("## UC-02: Borrado remoto — Incremento 1 · 2026-12");
    } finally { writeFileSync(f, keep); }
  });
});
