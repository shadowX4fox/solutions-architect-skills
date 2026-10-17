/**
 * prose-check.js — PROSE_VALIDATION.md as code. Rules under test: the five blocklists fire on both language branches and
 * a proper noun the ledger names is suppressed, not flagged; the pro-drop ending flags a verb and suppresses a noun;
 * report-only never blocks and the PROSE_STYLE marker switches to enforcing; sentence and paragraph length, consecutive
 * prose, a waiver without a reason and an anchored section without a table are counted; a judgement candidate no judge
 * has answered (the agent worksheet still open) is undecided — reported, neither kept nor dismissed — and the judge keeps
 * or dismisses a candidate with the reading printed. `cand` reads Stage 1: the findings and the undecided of a rule.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const { check, render } = require("../scripts/prose-check.js");
const TMP = join(import.meta.dir, ".temp-prose-check");
const w = (rel: string, s: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), s); };
const rules = (r: any, id: string) => r.findings.filter((f: any) => f.ruleId === id);
const undecided = (r: any, id: string) => r.judge.undecided.filter((u: any) => u.ruleId === id);
const cand = (r: any, id: string) => [...rules(r, id), ...undecided(r, id)];

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Ledger\n\nIn order to be robust we believe the platform is world-class.\n");
  w("docs/components/README.md", "# Component Details\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n| 1 | Ledger API | [ledger-api.md](ledger-api.md) | Service | Robusta |\n");
  w("docs/components/ledger-api.md", "# Ledger API\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: Robusta\ncomponents: ledger-api\ncomponent_self: ledger-api\nscope: s\nrelated_adrs: ADR-101\n-->\n\n> Posts entries.\n\n**Type:** Service\n**Technology:** Robusta\n**Description:** Ledger API — posts entries.\n");
  w("docs/03-architecture-layers.md", [
    "# Capas", "",
    "## 4. Capas <!-- SECTION: Architecture Layers -->", "",
    "Aprovechamos el bus de Robusta en ambos extremos de la cadena.",                                            // pro-drop verb + the noun extremos + a proper noun
    "", "El token se valida antes de entrar; el gateway lo reenvía. Esto es importante mencionar.",             // agentless passive, filler (ES)
    "", "La cola será reemplazada por un tópico en la versión 2.3. El relay will retry cuando la cola se llene.",   // future with a version (passes) and a bare future, in separate sentences
    "", "El gateway es el corazón que late de la plataforma y la palanca que vale la pena mover.",            // mannered (seed phrases)
    "", "Una frase que enumera muchas cosas sin necesidad y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue y sigue.",   // > 25 words
    "", "### Flow Inventory <!-- SECTION: Flow Inventory -->", "", "Sin tabla aquí.", "",
    "<!-- PROSE_OK: -->", "Un párrafo eximido sin razón.", "",
  ].join("\n"));
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("prose-check", () => {
  test("the blocklists, both branches; a proper noun is suppressed; report-only never blocks; the marker enforces", async () => {
    const r = await check(TMP, { engine: "agent" });
    expect(r.mode).toBe("report-only"); expect(r.status).toBe("PASS"); expect(r.blockingFindings).toBe(0); expect(r.docLanguage).toBe("es");
    expect(rules(r, "S-BAN-01").map((f: any) => f.match)).toEqual(expect.arrayContaining(["In order to", "Esto es importante mencionar".slice(5)]));   // EN filler on ARCHITECTURE.md, ES filler in docs
    expect(rules(r, "S-BAN-02").map((f: any) => f.match)).toEqual(["we believe"]);
    expect(rules(r, "S-BAN-03").map((f: any) => f.match.toLowerCase())).toEqual(["world-class"]);                 // 'robust' → suppressed: Robusta is a technology the ledger names
    expect(r.suppressed.some((s: any) => s.ruleId === "S-BAN-03" && /robust/i.test(s.token))).toBe(true);
    expect(cand(r, "S-VOICE-01").every((f: any) => f.file.startsWith("docs/") && !/\bwe\b/i.test(f.excerpt))).toBe(true);   // 'we' in ARCHITECTURE.md is not docs/ — only docs/ lines count
    expect(undecided(r, "S-VOICE-01").some((f: any) => /Aprovechamos/.test(f.excerpt))).toBe(true);             // the pro-drop verb: a candidate, undecided until the worksheet is answered
    expect(r.suppressed.some((s: any) => s.ruleId === "S-VOICE-01" && s.token === "extremos")).toBe(true);        // the noun, code's
    expect(r.blockingByRule).toBeGreaterThan(0);
    w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE: v1 -->\n\n# Ledger\n\nIn order to be robust we believe the platform is world-class.\n");
    const e = await check(TMP, { engine: "agent" });
    expect(e.mode).toBe("enforcing"); expect(e.status).toBe("FAIL"); expect(e.blockingFindings).toBe(e.blockingByRule);
  });
  test("the scope map: edit runs Groups 1, 2, 6 and 8 only; release enforces without the marker; PROSE_STYLE_WAIVED exempts it with the reason printed", async () => {
    w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Ledger\n\nIn order to be robust we believe the platform is world-class.\n");
    const d = await check(TMP, { engine: "agent" });
    expect(d.scope).toBe("first-write"); expect(d.mode).toBe("report-only");
    const e = await check(TMP, { engine: "agent", scope: "edit", files: ["docs/03-architecture-layers.md"] });
    expect(e.groups).toEqual([1, 2, 6, 8]); expect(e.filesChecked).toBe(1);
    expect(new Set(e.findings.map((f: any) => f.ruleId.replace(/-\d+a?$/, "")))).toEqual(new Set(["S-BAN", "S-VOICE", "S-HIST"].filter((k) => e.findings.some((f: any) => f.ruleId.startsWith(k)))));
    expect(e.findings.some((f: any) => /^S-(LEN|FORM|DENSITY|WAIVER)/.test(f.ruleId))).toBe(false);
    expect(e.judge.asked).toBeGreaterThan(0);                                                                 // Group 6's candidates still go to the judge
    const r = await check(TMP, { engine: "agent", scope: "release" });
    expect(r.mode).toBe("enforcing"); expect(r.status).toBe("FAIL"); expect(r.waived).toBeNull();                // no marker, still enforcing
    w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE_WAIVED: legacy corpus, retrofit scheduled for 2.0 -->\n\n# Ledger\n\nIn order to be robust we believe the platform is world-class.\n");
    const v = await check(TMP, { engine: "agent", scope: "release" });
    expect(v.mode).toBe("report-only"); expect(v.status).toBe("PASS"); expect(v.waived).toBe("legacy corpus, retrofit scheduled for 2.0");
    expect(render(v)).toContain("PROSE_STYLE_WAIVED: legacy corpus");
    await expect(check(TMP, { engine: "agent", scope: "nope" })).rejects.toThrow(/unknown scope/);
    w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Ledger\n\nIn order to be robust we believe the platform is world-class.\n");
  });
  test("the mechanical warnings: length, consecutive prose, a waiver without reason, an anchored section without a table", async () => {
    const r = await check(TMP, { engine: "agent" });
    expect(rules(r, "S-LEN-01").some((f: any) => f.words > 25 && /sigue y sigue/.test(f.excerpt))).toBe(true);
    expect(rules(r, "S-FORM-02").length).toBeGreaterThan(0);
    expect(rules(r, "S-WAIVER-01").map((f: any) => f.excerpt)).toEqual(["<!-- PROSE_OK: -->"]);
    expect(rules(r, "S-FORM-01").map((f: any) => f.excerpt)).toEqual(["Flow Inventory"]);
    expect(r.waivers).toBe(1);
  });
  test("the judgement rules: an unanswered candidate is undecided and reported with its worksheet; the judge keeps the verb and the metaphor, dismisses the passive that has no actor, with the reading printed", async () => {
    const h = await check(TMP, { engine: "agent" });
    expect(h.judge.asked).toBeGreaterThanOrEqual(4); expect(h.judge.dismissed).toEqual([]); expect(h.judge.kept).toBe(0);
    expect(h.judge.undecided.length).toBe(h.judge.asked); expect(h.judge.pending.length).toBeGreaterThan(0);
    ["S-VOICE-01", "S-VOICE-02", "S-VOICE-03", "S-DENSITY-02"].forEach((id) => expect(rules(h, id)).toEqual([]));   // never a finding without an answer
    expect(undecided(h, "S-VOICE-02").map((f: any) => f.match)).toEqual(["will retry"]);                         // 'será reemplazada … versión 2.3' carries a version: never a candidate
    expect(undecided(h, "S-VOICE-03").length).toBe(1); expect(undecided(h, "S-DENSITY-02").length).toBe(2);   // two seed phrases in one sentence
    const txt = render(h);
    expect(txt).toContain(`undecided: ${h.judge.undecided.length} candidate(s)`); expect(txt).toContain(`worksheet: ${h.judge.pending[0]}`);
    expect(txt).toMatch(/\? S-VOICE-02 docs\/03-architecture-layers\.md:\d+/);
    const bad = await check(TMP, { engine: "heuristic" });                                                      // a removed engine: every candidate undecided, the reason printed
    expect(bad.judge.undecided.length).toBe(bad.judge.asked); expect(bad.judge.note).toMatch(/removed in 8\.119\.0/); expect(rules(bad, "S-VOICE-02")).toEqual([]);
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); const answers: any = {}; for (const [id, q] of Object.entries<any>(b.questions)) { const st = b.state.items[id]; answers[id] = { type: "noul", noul: /se valida/.test(st.match || "") ? 0.08 : 0.9 }; } return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
    const j = await check(TMP, { engine: "typesafe", apiKey: "k", fetch, cache: false });
    expect(j.judge.engine).toBe("typesafe");   // the engine; the model name is on each finding
    expect(cand(j, "S-VOICE-03")).toEqual([]);                                                                  // dismissed
    expect(j.judge.dismissed.some((d: string) => /S-VOICE-03 .*jev-test 0\.08/.test(d))).toBe(true);
    expect(cand(j, "S-DENSITY-02")[0].judged).toEqual({ by: "jev-test", p: 0.9 });
    expect(cand(j, "S-VOICE-01").some((f: any) => /Aprovechamos/.test(f.excerpt) && f.judged && f.judged.p === 0.9)).toBe(true);
  });

  test("S-VOICE-01 runs the document's language only, case-sensitively, never inside code spans or quotes; accented -amos nouns are dismissed by code", async () => {
    const T2 = join(TMP, "..", ".temp-prose-voice");
    rmSync(T2, { recursive: true, force: true });
    const w2 = (rel: string, s: string) => { mkdirSync(join(T2, rel, ".."), { recursive: true }); writeFileSync(join(T2, rel), s); };
    w2("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n\n# X\n");
    w2("docs/05-integration-points.md", [
      "# Integración", "",
      "Las VMs corren en Azure East US y el tenant en `us-east-1`.",           // country, code span
      "", "El proveedor dice \"we rotate your keys\" en su contrato.",          // quoted vendor text, and English in a Spanish doc
      "", "Los préstamos y los últimos movimientos legítimos quedan fuera.",     // accented nouns
      "", "Usamos nuestro gateway y ya lo usábamos antes.",                       // real first person: nuestro, Usamos, usábamos
    ].join("\n"));
    const r = await check(T2, { engine: "agent", scope: "release" });
    const v = cand(r, "S-VOICE-01").map((f: any) => f.match);
    expect(v.sort()).toEqual(["Usamos", "nuestro", "usábamos"].sort());
    expect(r.suppressed.filter((x: any) => x.ruleId === "S-VOICE-01").map((x: any) => x.token).sort()).toEqual(["legítimos", "préstamos", "últimos"]);
    w2("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: en -->\n\n# X\n");
    w2("docs/05-integration-points.md", "# Integration\n\nWe deploy in East US; `us` is a code span and the US is a country. Our gateway rotates keys.\n");
    const e = await check(T2, { engine: "agent", scope: "release" });
    expect(cand(e, "S-VOICE-01").map((f: any) => f.match)).toEqual(["We", "Our"]);
    rmSync(T2, { recursive: true, force: true });
  });

  test("changelogs: only [Unreleased] is checked, never for length; multi-line comments are not prose; edit markers and dated narration are history", async () => {
    const T3 = join(TMP, "..", ".temp-prose-hist");
    rmSync(T3, { recursive: true, force: true });
    const w3 = (rel: string, s: string) => { mkdirSync(join(T3, rel, ".."), { recursive: true }); writeFileSync(join(T3, rel), s); };
    w3("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE: v1 -->\n\n# X\n");
    w3("docs/CHANGELOG.md", "# Changelog\n\n## [Unreleased]\n\n- Un cambio muy pequeño.\n\n## [1.0.0] - 2026-01-01\n\n- Una entrada publicada muy larga " + "que sigue ".repeat(20) + "y es historia.\n");
    w3("docs/CHANGELOG-ARCHIVE.md", "# Archive\n\n## [0.9.0]\n\n- Algo muy viejo.\n");
    w3("docs/components/a.md", "# A\n\n<!-- EXPLORER_HEADER\nkey_concepts: " + "palabra ".repeat(40) + "\nscope: s\n-->\n\n**Disponibilidad**: alta <!-- corregido: antes decía media -->\n");
    w3("docs/09-operational-considerations.md", [
      "# Operación", "",
      "El gateway ya no valida el token en el borde.",                                   // strong history
      "", "La topología cambió desde la enmienda del 2026-09-03 a tres zonas.",          // weak + date → history
      "", "El flujo va desde el dispositivo hasta el gateway.",                            // weak, no anchor → current design
    ].join("\n"));
    const r = await check(T3, { engine: "agent", scope: "release" });
    const inLog = r.findings.filter((f: any) => /CHANGELOG/.test(f.file));
    expect(inLog.map((f: any) => [f.ruleId, f.line])).toEqual([["S-BAN-02", 5]]);         // the [Unreleased] hedge only; the released entry and the archive are history
    expect(r.findings.some((f: any) => f.file === "docs/components/a.md" && /^S-LEN/.test(f.ruleId))).toBe(false);
    expect(rules(r, "S-HIST-02").map((f: any) => [f.file, f.line, f.severity])).toEqual([["docs/components/a.md", 8, "BLOCKING"]]);
    expect(cand(r, "S-HIST-01").map((f: any) => f.line).sort()).toEqual([3, 5, 7]);                             // strong, weak + date, weak alone: all three asked
    expect(rules(r, "S-HIST-01")).toEqual([]);                                                                  // undecided until the worksheet is answered
    rmSync(T3, { recursive: true, force: true });
  });

  test("S-FORM-01 counts the tables of the section's subsections; S-DENSITY-01 reads an identifier as a token", async () => {
    const T4 = join(TMP, "..", ".temp-prose-form");
    rmSync(T4, { recursive: true, force: true });
    const w4 = (rel: string, s: string) => { mkdirSync(join(T4, rel, ".."), { recursive: true }); writeFileSync(join(T4, rel), s); };
    w4("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n\n# X\n");
    w4("docs/06-technology-stack.md", "# Stack\n\n## Stack <!-- SECTION: Technology Stack -->\n\nCómputo según ADR-101.\n\n### Cómputo\n\n| A | B |\n|---|---|\n| x | y |\n");
    w4("docs/05-integration-points.md", "# Integración\n\n**I-04 — Consulta de saldos.** La consulta pasa por la ruta sincrónica del canal.\n");
    const r = await check(T4, { engine: "agent", scope: "release" });
    expect(rules(r, "S-FORM-01")).toEqual([]);
    expect(cand(r, "S-DENSITY-01")).toEqual([]);
    rmSync(T4, { recursive: true, force: true });
  });

  test("--scope records: project ADRs and TDRs, their own log skipped, institutional ADRs never", async () => {
    const T5 = join(TMP, "..", ".temp-prose-records");
    rmSync(T5, { recursive: true, force: true });
    const w5 = (rel: string, s: string) => { mkdirSync(join(T5, rel, ".."), { recursive: true }); writeFileSync(join(T5, rel), s); };
    w5("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n\n# X\n");
    w5("adr/ADR-101-x.md", "# ADR-101: X\n\n## Decision\n\nEl gateway ya no valida el token. <!-- corregido 2026-09-15 -->\n\n## Review History\n\n| Date | Change |\n|---|---|\n| 2026-09-15 | Desde la enmienda del 2026-09-15 el gateway ya no valida |\n");
    w5("adr/ADR-050-inst.md", "# ADR-050\n\n## Decision\n\nEs muy importante.\n");
    w5("tdr/TDR-001-x.md", "# TDR-001\n\n## Description\n\nUna deuda muy visible.\n\n## History\n\n- 2026-09-01: ya no aplica el parche.\n");
    const r = await check(T5, { engine: "agent", scope: "records" });
    expect(r.filesChecked).toBe(2);
    expect([...r.findings, ...r.judge.undecided].map((f: any) => `${f.ruleId} ${f.file}:${f.line}`).sort()).toEqual(["S-BAN-02 tdr/TDR-001-x.md:5", "S-HIST-01 adr/ADR-101-x.md:5", "S-HIST-02 adr/ADR-101-x.md:5"]);
    rmSync(T5, { recursive: true, force: true });
  });

  test("--scope records: S-STRUCT-01 holds a project ADR's structure to English, never an institutional one", async () => {
    const T6 = join(TMP, "..", ".temp-prose-struct");
    rmSync(T6, { recursive: true, force: true });
    const w6 = (rel: string, s: string) => { mkdirSync(join(T6, rel, ".."), { recursive: true }); writeFileSync(join(T6, rel), s); };
    w6("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n\n# X\n");
    w6("adr/ADR-101-x.md", "# ADR-101: X\n\n## Contexto <!-- SECTION: Context -->\n\nEl canal consulta saldos.\n\n## Review History\n\n| Fecha | Revisor | Action | Notes |\n|---|---|---|---|\n| 2026-09-01 | Equipo | Created | Borrador |\n");
    w6("adr/ADR-050-inst.md", "# ADR-050\n\n## Decisión <!-- SECTION: Decision -->\n\nIstio.\n");
    let r = await check(T6, { engine: "agent", scope: "records" });
    expect(rules(r, "S-STRUCT-01").map((f: any) => [f.file, f.line, f.severity])).toEqual([["adr/ADR-101-x.md", 3, "WARNING"], ["adr/ADR-101-x.md", 9, "WARNING"]]);
    r = await check(T6, { engine: "agent", scope: "records", files: ["adr/ADR-050-inst.md"] });
    expect(rules(r, "S-STRUCT-01")).toEqual([]);
    w6("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE: v1 -->\n\n# X\n");
    r = await check(T6, { engine: "agent", scope: "records" });
    expect(r.status).toBe("FAIL");
    expect(rules(r, "S-STRUCT-01").every((f: any) => f.severity === "BLOCKING")).toBe(true);
    r = await check(T6, { engine: "agent", scope: "edit", files: ["adr/ADR-101-x.md"] });
    expect(rules(r, "S-STRUCT-01")).toEqual([]);
    rmSync(T6, { recursive: true, force: true });
  });
});

// 8.84.0 — detector artifacts measured on a Spanish corpus (53 files): S-DENSITY-01 kept ~39 false of 44, S-FORM-02 ~65 of 191
describe("S-DENSITY-01 and S-FORM-02 read structure as structure, in es and en", () => {
  const T = join(import.meta.dir, ".temp-prose-artifacts");
  const W = (rel: string, s: string) => { mkdirSync(join(T, rel, ".."), { recursive: true }); writeFileSync(join(T, rel), s); };
  const run = async (lang: string, body: string[]) => {
    rmSync(T, { recursive: true, force: true });
    W("ARCHITECTURE.md", `<!-- DOC_LANGUAGE: ${lang} -->\n\n# X\n`);
    W("docs/06-technology-stack.md", "# Stack\n\n| Capa | Tecnología | Versión |\n|---|---|---|\n| Datos locales | Couchbase Lite | 3.1 |\n| Nube | Azure Front Door | n/a |\n| Protección | AppDome | 2024 |\n");
    W("docs/07-security-architecture.md", ["# Seguridad", "", ...body, ""].join("\n"));
    const r = await check(T, { engine: "agent", scope: "release" });
    rmSync(T, { recursive: true, force: true });
    return (id: string) => cand(r, id).map((f: any) => f.line);
  };
  const para = (s: string) => [s, ""];

  test.each([
    ["es", "El almacenamiento local cifra los datos en Couchbase antes de sincronizarlos."],
    ["en", "Local storage encrypts the data in Couchbase before it syncs."],
    ["es", "El tráfico de entrada termina en Azure y nunca alcanza el origen directo."],
    ["es", "La protección en tiempo de ejecución se aplica según § 9.11 del mismo documento."],
    ["es", "La fase 14 cierra la sesión cuando el token expira sin renovación."],
    ["en", "Phase 3 closes the session when the token expires without renewal."],
    ["es", "Los registros se conservan 12 meses y luego se purgan del almacén."],
    ["es", "La carga esperada alcanza 500.000 usuarios en el primer trimestre."],
    ["es", "La rotación de claves ocurre una semana antes del vencimiento del certificado."],
    ["en", "Key rotation happens two weeks before the certificate expires."],
  ])("[%s] a density token: %s", async (lang, s) => {
    expect((await run(lang as string, para(s as string)))("S-DENSITY-01")).toEqual([]);
  });
  test.each([
    ["es", "La fase tiene cuatro disparadores que el canal evalúa en orden:"],
    ["en", "The phase has four triggers the channel evaluates in order:"],
  ])("[%s] a lead-in is not a claim: %s", async (lang, s) => {
    const at = await run(lang as string, [s as string, "", "- uno", "- dos", ""]);
    expect(at("S-DENSITY-01")).toEqual([]);
  });
  test("a claim with no token is still reported, es and en", async () => {
    expect((await run("es", para("El canal degrada con elegancia cuando el servicio remoto responde lento.")))("S-DENSITY-01")).toEqual([3]);
    expect((await run("en", para("The channel degrades gracefully when the remote service answers slowly.")))("S-DENSITY-01")).toEqual([3]);
  });

  const P1 = "El canal valida la sesión en cada pantalla del flujo.", P2 = "El gateway reenvía la solicitud al servicio de saldos.";
  const E1 = "The channel validates the session on every screen.", E2 = "The gateway forwards the request to the balance service.";
  test.each([["es", P1], ["en", E1]])("[%s] a descriptor's version block is fields, not prose", async (lang, p) => {
    const at = await run(lang as string, [p as string, "", "**Component Version:** 1.3.0", "**Architecture Version:** 1.2.0", "**Last Updated:** 2026-04-08", ""]);
    expect(at("S-FORM-02")).toEqual([]);
  });
  test.each([["es", P1, "Diferenciadores clave:"], ["en", E1, "Key differentiators:"], ["es", P1, "**Impacted Business Areas**:"]])("[%s] a lead-in before a list belongs to the list", async (lang, p, lead) => {
    const at = await run(lang as string, [p as string, "", lead as string, "", "- uno", "- dos", ""]);
    expect(at("S-FORM-02")).toEqual([]);
  });
  test.each([["es", P1, "**Deployment:** AKS, namespace canal-movil."], ["en", E1, "**Deployment:** AKS, namespace mobile-channel."]])("[%s] a single field line", async (lang, p, field) => {
    expect((await run(lang as string, [p as string, "", field as string, ""]))("S-FORM-02")).toEqual([]);
  });
  test.each([["es", P1, "→ Secuencia completa: ver [§ 6.2](04-data-flow-patterns.md)."], ["en", E1, "→ Full sequence: see [§ 6.2](04-data-flow-patterns.md)."]])("[%s] a pointer line", async (lang, p, ptr) => {
    expect((await run(lang as string, [p as string, "", ptr as string, ""]))("S-FORM-02")).toEqual([]);
  });
  test.each([["es", P1, P2], ["en", E1, E2]])("[%s] a thematic break resets the run", async (lang, a, b) => {
    expect((await run(lang as string, [a as string, "", "---", "", b as string, ""]))("S-FORM-02")).toEqual([]);
  });
  const LONG = "El canal evalúa la sesión. Luego consulta el perfil y decide la ruta.";
  test.each([["es", P1, P2, LONG], ["en", E1, E2, "The channel checks the session. Then it reads the profile and picks the route."]])("[%s] a list of prose items still resets the run", async (lang, a, b, item) => {
    expect((await run(lang as string, [a as string, "", `- ${item}`, `- ${item}`, "", b as string, ""]))("S-FORM-02")).toEqual([]);
  });
  test.each([["es", P1, P2, "### 9.5.1 La Interfaz de Administración"], ["en", E1, E2, "### 9.5.1 The Admin Interface"], ["es", P1, P2, "### 9. Seguridad"]])("[%s] a numbered heading is one sentence and resets the run", async (lang, a, b, h) => {
    expect((await run(lang as string, [a as string, "", h as string, "", b as string, ""]))("S-FORM-02")).toEqual([]);
    expect(require("../scripts/prose-check.js").blocksOf(`${h}\n`, "x.md")[0].sentences.length).toBe(1);
  });
  test.each([["es", "**I-04 — Consulta de saldos**", "**I-05 — Transferencia**"], ["en", "**I-04 — Balance query**", "**I-05 — Transfer**"]])("[%s] an I-nn title line is structure, blank line or not", async (lang, t1, t2) => {
    const at = await run(lang as string, [t1 as string, "", P1, "", P2.replace("El", "Luego el"), "", t2 as string, P1, "", t1 as string, "", P2, ""]);
    expect(at("S-FORM-02")).toEqual([7]);
    expect(require("../scripts/prose-check.js").blocksOf(`${t2}\n${P1}\n`, "x.md").map((b: any) => b.kind)).toEqual(["title", "paragraph"]);
  });
  test.each([["es", "**I-19 e I-20 — Atestación del dispositivo y petición de revocación**"], ["en", "**I-19 and I-20 — Device attestation and revocation request**"]])("[%s] a compound head is a title", async (lang, t) => {
    expect((await run(lang as string, [P1, "", t as string, "", P2, ""]))("S-FORM-02")).toEqual([]);
  });
  test.each([["es", "retirada", "el canal ya no consulta el servicio"], ["en", "retired", "the channel no longer calls the service"]])("[%s] retired one-line blocks in a row are not a run; a lead block starts one", async (lang, word, body) => {
    const ret = (n: number) => `**I-1${n} — ${word}**, per [ADR-120](../adr/ADR-120-x.md) ${body}.`;
    expect((await run(lang as string, [P1, "", ret(1), "", ret(2), "", ret(3), ""]))("S-FORM-02")).toEqual([]);
    expect((await run(lang as string, [`**I-14 — ${word}**, per ADR-120 ${body}.`, P1, "", P2, ""]))("S-FORM-02")).toEqual([6]);
  });
  test.each([
    ["**El control no es el borrado sino la llave.** Dejar de entregar la llave basta.", 2],
    ["**Control is the key, not the deletion.** Withholding the key is enough.", 2],
    ["*La sesión caduca.* El canal pide otra.", 2], ["El canal responde «sin saldo.» Luego reintenta.", 2], ["It returns \"no balance.\" Then it retries.", 2],
    ["La versión 2.3 **no cambia** el flujo.", 1],
  ])("closing emphasis or a quote after the mark is part of the boundary: %s", (text, n) => {
    expect(require("../scripts/prose-check.js").blocksOf(`${text}\n`, "x.md")[0].sentences.length).toBe(n);
  });
  test("a bold lead and a long sentence are measured apart (S-LEN-01)", async () => {
    const long = "Dejar de entregar la llave al dispositivo revocado impide descifrar la base local aunque el atacante conserve una copia completa del almacenamiento y de las credenciales del usuario final.";
    const at = await run("es", [`**El control no es el borrado sino la llave.** ${long}`, ""]);
    expect(at("S-LEN-01")).toEqual([3]);
    expect((await run("es", ["**El control no es el borrado sino la llave.** Dejar de entregar la llave al dispositivo revocado basta para cortar el acceso a la base local y a sus copias.", ""]))("S-LEN-01")).toEqual([]);
  });
  test.each([
    ["El gateway va a validar el token en cada llamada.", "va a validar"],
    ["Los equipos van a pedir saltárselo cuando el flujo falle.", "van a pedir"],
    ["Las colas se van a llenar si el consumidor se detiene.", "van a llenar"],
    ["El canal va a revisarlo antes de responder.", "va a revisarlo"],
  ])("S-VOICE-02: ir a + an infinitive is the future: %s", async (text, match) => {
    const T2 = join(import.meta.dir, ".temp-prose-future"); rmSync(T2, { recursive: true, force: true });
    mkdirSync(join(T2, "docs"), { recursive: true }); writeFileSync(join(T2, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: es -->\n\n# X\n");
    writeFileSync(join(T2, "docs/07-security-architecture.md"), `# Seguridad\n\n${text}\n`);
    const r = await check(T2, { engine: "agent", scope: "release" }); rmSync(T2, { recursive: true, force: true });
    expect(cand(r, "S-VOICE-02").map((f: any) => f.match)).toEqual([match]);
  });
  test.each([
    "Ningún campo descifrado, llave ni token va a log, telemetría, RUM ni reporte de fallos.",
    "La entrega va a Confluent Kafka por el tópico de eventos.",
    "Sin conmutación, va a la autoevaluación del nodo.",
    "Los eventos van a Microsoft Sentinel en tiempo real.",
    "La traza va a cluster de observabilidad compartido.",
  ])("S-VOICE-02: ir a + a noun or an article is motion, never a candidate: %s", async (text) => {
    const T2 = join(import.meta.dir, ".temp-prose-motion"); rmSync(T2, { recursive: true, force: true });
    mkdirSync(join(T2, "docs"), { recursive: true }); writeFileSync(join(T2, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: es -->\n\n# X\n");
    writeFileSync(join(T2, "docs/07-security-architecture.md"), `# Seguridad\n\n${text}\n`);
    const r = await check(T2, { engine: "agent", scope: "release" }); rmSync(T2, { recursive: true, force: true });
    expect(cand(r, "S-VOICE-02")).toEqual([]);
  });
  test.each([["es", P1, P2], ["en", E1, E2]])("[%s] two prose paragraphs are still reported", async (lang, a, b) => {
    expect((await run(lang as string, [a as string, "", b as string, ""]))("S-FORM-02")).toEqual([5]);
  });
});
