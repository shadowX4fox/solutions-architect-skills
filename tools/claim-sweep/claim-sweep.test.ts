/**
 * claim-sweep — the three stages over the synthetic example claim: Stage 1 cuts the corpus into blocks and keeps the ones
 * every recall group matches (the fixtures name blocks the stage sees); a block no judge answered is undecided — listed
 * with its worksheet, never a verdict, and --strict will not pass over it; a judge (a fake
 * TypeSafe endpoint here) decides, --verify measures the cut against the fixtures — every positive above it, every
 * control below. The corpus is written here with invented names; the example claim's fixtures point at these lines.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const TMP = join(import.meta.dir, ".temp-claim-sweep");
const CLI = join(import.meta.dir, "claim-sweep.js");
const CLAIM = join(import.meta.dir, "claims", "example-unico-lector.claim.json");
const w = (rel: string, s: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), s); };

const DOCS = [
  "# Cache de Saldos",
  "",
  "## Colecciones",
  "",
  "| Colección | Escritor único | Lector |",
  "|---|---|---|",
  "| cierres | `Servicio de Conciliación Nocturna` | **El propio `Servicio de Conciliación Nocturna`; ningún lector externo** |",
  "",
  "## Invariantes",
  "",
  "- **INV-02** El `Servicio de Conciliación Nocturna` es el escritor y lector único de la colección de cierres, per ADR-107.",
  "",
  "## Escritura",
  "",
  "El `Servicio de Conciliación Nocturna` es el escritor único de la colección de cierres; los canales son lectores de ella.",
  "",
].join("\n");
const ADR = [
  "# ADR-107 — Un escritor por colección",
  "",
  "## Decisión",
  "",
  "Cada colección del `Cache de Saldos` tiene un escritor único. La colección de cierres la escribe y la lee **solo** el `Servicio de Conciliación Nocturna`.",
  "",
  "## Enmienda (2026-09-20)",
  "",
  "El `Servicio de Conciliación Nocturna` dejó de ser el único lector de la colección de cierres: el `Tablero de Cierres` suma un segundo lector.",
  "",
].join("\n");

const run = async (args: string[], env: Record<string, string> = {}) => {
  const p = Bun.spawn(["bun", CLI, TMP, "--claim", CLAIM, ...args], { cwd: TMP, stdout: "pipe", stderr: "pipe", env: { ...process.env, SA_JUDGE: "", ...env } });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  return { out, err, code: p.exitCode };
};

beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); w("docs/06-cache-de-saldos.md", DOCS); w("adr/ADR-107-cierres.md", ADR); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("claim-sweep — the synthetic example", () => {
  test("the fixtures point at the lines the corpus has", () => {
    const claim = JSON.parse(require("fs").readFileSync(CLAIM, "utf8"));
    const at = (file: string, line: number) => (file.startsWith("docs") ? DOCS : ADR).split("\n")[line - 1];
    for (const f of claim.fixtures) expect(at(f.file, f.line)).toMatch(/Conciliación Nocturna/);
    expect(claim.fixtures.filter((f: any) => f.label === 0).map((f: any) => at(f.file, f.line))).toEqual([expect.stringMatching(/escritor único/), expect.stringMatching(/dejó de ser/)]);
  });
  test("agent (the default): every block undecided until the worksheet is answered; Stage 1 sees every fixture; --strict refuses", async () => {
    const r = await run(["--verify"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Hoja de juicio escrita en:"); expect(r.out).toContain("5 bloques SIN DECIDIR");
    expect(r.err).toContain("Etapa 1 contra los 3 fixtures");
    expect(r.err).not.toContain("NO LA VIO LA ETAPA 1");
    expect((r.err.match(/vista\s+\S+/g) || []).length).toBe(3);
    const s = await run(["--strict"]);
    expect(s.code).toBe(5); expect(s.err).toContain("5 bloques sin decidir");
    const h = await run([], { SA_JUDGE: "heuristic" });
    expect(h.code).toBe(2); expect(h.err).toContain("removed in 8.119.0");
  });
  test("answers for some blocks: the rest are listed SIN DECIDIR, never dropped, and --strict will not pass", async () => {
    w("answers.json", JSON.stringify({ answers: { b000: 1 } }));
    const r = await run(["--answers", join(TMP, "answers.json"), "--verify"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/INSTANCIA VIVA \(1\)/); expect(r.out).toMatch(/SIN DECIDIR \(4\)/); expect(r.out).toContain("0 descartados.");
    expect(r.err).toContain("sin decidir");
    const j = await run(["--answers", join(TMP, "answers.json"), "--json"]);
    expect(JSON.parse(j.out).undecided.length).toBe(4);
  });
  test("typesafe (fake endpoint): the judge separates the claim from its negation, --verify measures the cut, --strict gates", async () => {
    let calls = 0;
    const server = Bun.serve({ port: 0, fetch: async (req) => { calls++; const b: any = await req.json(); const answers: any = {};
      for (const [id, q] of Object.entries<any>(b.questions)) { const t = JSON.stringify(b.state.items[id]); const yes = /lector único|ningún lector externo|la lee \*\*solo\*\*/.test(t) && !/dejó de ser|segundo lector/.test(t); answers[id] = { type: q.type, noul: yes ? 0.94 : 0.06 }; }
      return Response.json({ model: "jev-test", answers }); } });
    try {
      const env = { TYPESAFE_API_KEY: "k", TYPESAFE_ENDPOINT: `http://localhost:${server.port}/v1/systemone` };
      const r = await run(["--engine", "typesafe", "--verify", "--no-cache"], env);
      expect(r.code).toBe(0); expect(calls).toBeGreaterThan(0);
      expect(r.out).toContain("juez: jev-test · corte 0.65 / piso 0.4");
      expect(r.out).toMatch(/INSTANCIA VIVA \(3\)/);
      expect(r.err).toContain("recuperadas 3/3 · falsos positivos 0");
      expect(r.err).not.toMatch(/por debajo del corte|NO LA VIO|falso positivo/);
      const s = await run(["--engine", "typesafe", "--strict", "--no-cache"], env);
      expect(s.code).toBe(1);                                                                          // a live instance: the gate closes
    } finally { server.stop(true); }
  });
});
