/**
 * identifier-check.js — code identifiers in the architecture are English in every document language: the candidates are
 * code's, the verdict the judge's (a token it has not answered is undecided), and what is not an identifier never reaches the question.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, isCandidate, render } = require("./identifier-check.js");
const TMP = join(__dirname, ".temp-identifier-check");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Mesa — Arquitectura\n");
  w("docs/components/README.md", "# Componentes\n");
  w("docs/components/mesa/01-servicio-de-alta.md", "# Servicio de Alta\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ncomponent_self: servicio-de-alta\ncomponent_type: api-service\nscope: s\n-->\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n");
  w("docs/05-integration-points.md", [
    "# Puntos de Integración", "",
    "| Operación | Petición | Respuesta |", "|---|---|---|",
    "| `POST /v1/enrollments` | `deviceId`, `idDispositivo` | `status` (`habilitado`), `enabledAt` |",
    "| `GET /v1/clientes/{idCliente}` | — | `fechaOrigen` |", "",
    "El `Servicio de Alta` escribe en `servicio-de-alta`; productos `AHO` y `CTE`; motor `Couchbase`; per ADR-120, `I-27` y `ADR-120`; ver `components/x.md`.", "",
    "```json", '{ "montoMenor": 10, "accountToken": "x" }', "```", "",
    "<!-- `ultimaReplica` en un comentario -->",
  ].join("\n"));
  w("docs/CHANGELOG.md", "# Changelog\n\n- `idViejo` renombrado\n");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("identifier-check", () => {
  test("candidates: identifiers only — not ids, files, short codes, technologies or component names", () => {
    const names = new Set(["servicio de alta", "servicio-de-alta"]);
    ["deviceId", "idDispositivo", "/v1/clientes/{idCliente}", "habilitado", "mov::<tokenCuenta>::<idMovimiento>"].forEach((t) => expect(isCandidate(t, names)).toBe(true));
    ["I-27", "ADR-120", "AHO", "Couchbase", "servicio-de-alta", "components/x.md", "300ms", "ab"].forEach((t) => expect(isCandidate(t, names)).toBe(false));
  });

  test("the agent judge: a worksheet first, the session's answers second — Spanish identifiers in code spans and JSON keys, comments and changelogs never asked", async () => {
    const first = await check(TMP, { engine: "agent" });
    expect(first).toMatchObject({ status: "PENDING", findings: [] });
    const sheet = readFileSync(join(TMP, ".cache/sa-skills/judge/identifier-language.worksheet.md"), "utf8");
    // answer as the session would: every token is an item; yes for the Spanish ones
    const hash = sheet.match(/"worksheet": "([0-9a-f]+)"/)![1];
    const ids = [...sheet.matchAll(/^### (id-\d+)\n+```json\n([\s\S]*?)\n```/gm)].map((m) => [m[1], JSON.parse(m[2]).token]);
    const asked = ids.map(([, t]) => t);
    expect(asked).not.toContain("ultimaReplica");   // inside a comment
    expect(asked).not.toContain("idViejo");         // a changelog is history
    expect(asked).not.toContain("AHO"); expect(asked).not.toContain("servicio-de-alta");   // a code, a component slug
    const SPANISH = ["idDispositivo", "/v1/clientes/{idCliente}", "habilitado", "fechaOrigen", "montoMenor"];
    writeFileSync(join(TMP, ".cache/sa-skills/judge/identifier-language.answers.json"), JSON.stringify({ worksheet: hash, answers: Object.fromEntries(ids.map(([id, tok]) => [id, SPANISH.includes(tok) ? 1 : 0])) }));
    const r = await check(TMP, { engine: "agent", answers: true });
    expect(r.status).toBe("WARN");
    expect(r.findings.map((f: any) => f.token).sort()).toEqual([...SPANISH].sort());
    expect(r.findings[0]).toMatchObject({ rule: "identifier-language", severity: "WARNING", by: "agent" });
    expect(r.findings.find((f: any) => f.token === "montoMenor").occurrences).toEqual([{ file: "docs/05-integration-points.md", line: 11 }]);
    expect(r.dismissed).toBe(ids.length - SPANISH.length);   // deviceId, enabledAt, accountToken… judged English
  });

  test("a token the judge has not answered is undecided — neither a finding nor dismissed, and the run stays PENDING", async () => {
    rmSync(join(TMP, ".cache/sa-skills/judge"), { recursive: true, force: true });   // the previous case's answers would close the loop
    const first = await check(TMP, { engine: "agent" });
    expect(first.status).toBe("PENDING");
    expect(first.undecided.length).toBe(first.candidates);   // a pending worksheet: every token waits
    const sheet = readFileSync(join(TMP, ".cache/sa-skills/judge/identifier-language.worksheet.md"), "utf8");
    const hash = sheet.match(/"worksheet": "([0-9a-f]+)"/)![1];
    const ids = [...sheet.matchAll(/^### (id-\d+)\n+```json\n([\s\S]*?)\n```/gm)].map((m) => [m[1], JSON.parse(m[2]).token]);
    // the session answers two tokens only: one Spanish, one English
    const pick = ids.filter(([, t]) => t === "idDispositivo" || t === "deviceId");
    writeFileSync(join(TMP, ".cache/sa-skills/judge/identifier-language.answers.json"), JSON.stringify({ worksheet: hash, answers: Object.fromEntries(pick.map(([id, t]) => [id, t === "idDispositivo" ? 1 : 0])) }));
    const r = await check(TMP, { engine: "agent", answers: true });
    expect(r.status).toBe("PENDING");
    expect(r.findings.map((f: any) => f.token)).toEqual(["idDispositivo"]);
    expect(r.dismissed).toBe(1);
    expect(r.undecided.sort()).toEqual(ids.map(([, t]) => t).filter((t) => t !== "idDispositivo" && t !== "deviceId").sort());
    expect(r.judged).toBe(2);
    expect(r.note).toMatch(new RegExp(`${r.undecided.length} token\\(s\\) unanswered — answer them in \\.cache/sa-skills/judge/identifier-language\\.answers\\.json and re-run with --answers`));
    expect(render(r)).toMatch(/PENDING — \d+ file\(s\), \d+ candidate identifier\(s\), \d+ undecided — waiting for the judge; 1 in Spanish so far/);
  });

  test("every judge judge.js runs, and nothing else: no heuristic, no word list (8.120.3 — clef was refused)", async () => {
    await expect(check(TMP, { engine: "heuristic" })).rejects.toThrow(/runs on a judge \(agent, typesafe, clef\)/);
    await expect(check(TMP, { engine: "claude" })).rejects.toThrow(/runs on a judge/);
    const saved = { a: process.env.CLOUDFLARE_ACCOUNT_ID, t: process.env.CLOUDFLARE_API_TOKEN, e: process.env.CLEF_ENDPOINT };
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct"; process.env.CLOUDFLARE_API_TOKEN = "tok"; delete process.env.CLEF_ENDPOINT;
    try {
      const fetch = (async (_u: string, init: any) => { const b = JSON.parse(init.body); const answers: any = {}; for (const id of Object.keys(b.questions)) answers[id] = { type: "noul", noul: 0.05 };
        return { ok: true, json: async () => ({ result: { model: "clef", answers }, success: true, errors: [], messages: [] }) }; }) as any;
      const r = await check(TMP, { engine: "clef", fetch, cache: false });
      expect(r.engine).toBe("clef"); expect(r.undecided).toEqual([]); expect(r.status).toBe("PASS");
    } finally { for (const [k, v] of [["CLOUDFLARE_ACCOUNT_ID", saved.a], ["CLOUDFLARE_API_TOKEN", saved.t], ["CLEF_ENDPOINT", saved.e]] as const) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } }
  });
});
