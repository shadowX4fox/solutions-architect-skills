/**
 * qualifier-check.js — Workflow 12's qualifier-preservation review. Rules under test: a severity, a "no verificado", a
 * target threshold and a Proposed ADR dropped by a rewrite are candidates, undecided and reported until the judge answers; a rewrite that
 * keeps the qualifier, a paragraph moved verbatim and a pure deletion are not; the judge's reading decides the band.
 * Synthetic temp git repositories only.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

const { check, render, count } = require("../scripts/qualifier-check.js");
const TMP = join(import.meta.dir, ".temp-qualifier-check");
const w = (rel: string, s: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), s); };
const git = (...a: string[]) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: TMP, encoding: "utf8" });

const BEFORE = [
  "# Riesgos", "",
  "| ID | Riesgo | Severidad |", "|---|---|---|",
  "| R-1 | Pérdida de la réplica | Alta |", "",
  "El failover de la región tarda 90 s, dato no verificado en carga.", "",
  "La latencia p95 de 200 ms es un objetivo de diseño sin medir.", "",
  "Las llaves rotan cada 30 días per ADR-101 (Propuesto).", "",
  "El índice secundario cuesta 12 GB por nodo.", "",
  "Párrafo que se moverá tal cual al final del archivo.", "",
].join("\n");

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
  git("init", "-q");
  w("ARCHITECTURE.md", "# A\n");
  w("adr/ADR-101-rotacion.md", "# ADR-101: Rotación\n\n**Status**: Proposed\n");
  w("docs/10-risks.md", BEFORE);
  git("add", "-A"); git("commit", "-qm", "base");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("qualifier-check", () => {
  test("the lexicon counts both branches", () => {
    expect(count("dato no verificado; unverified", "verification")).toBe(2);
    expect(count("Severidad Alta · High", "severity")).toBe(2);
    expect(count("un objetivo sin medir, ~5 ms", "measurement")).toBe(3);
    expect(count("cuesta 12 GB", "cost")).toBe(1);
  });

  test("a softened severity, a dropped 'no verificado', an unmeasured target stated as working and a Proposed ADR in force all stand", async () => {
    w("docs/10-risks.md", [
      "# Riesgos", "",
      "| ID | Riesgo | Severidad |", "|---|---|---|",
      "| R-1 | Pérdida de la réplica | — |", "",
      "El failover de la región tarda 90 s.", "",
      "La latencia p95 es de 200 ms.", "",
      "Las llaves rotan cada 30 días per ADR-101.", "",
      "El índice secundario cuesta 12 GB por nodo.", "",
      "Párrafo que se moverá tal cual al final del archivo.", "",
    ].join("\n"));
    const r = await check(TMP, { engine: "agent" });                                 // the worksheet is open: every candidate undecided, none a finding
    const cats = r.undecided.map((f: any) => f.category).sort();
    expect(cats).toEqual(["measurement", "severity", "status", "verification"]);
    expect(r.findings).toEqual([]); expect(r.kept).toEqual([]); expect(r.status).toBe("UNDECIDED");
    const sev = r.undecided.find((f: any) => f.category === "severity");
    expect(sev.file).toBe("docs/10-risks.md"); expect(sev.line).toBe(5); expect(sev.by).toBe("undecided");
    const txt = render(r);
    expect(txt).toContain("[verification]"); expect(txt).toContain("4 undecided"); expect(txt).toContain(`answer the worksheet ${r.judge.pending}`);
  });

  test("a rewrite that keeps each qualifier, a verbatim move and an unrelated edit raise nothing", async () => {
    w("docs/10-risks.md", BEFORE.replace("El failover de la región tarda 90 s, dato no verificado en carga.", "Dato no verificado en carga: el failover de la región tarda 90 s.")
      .replace("Párrafo que se moverá tal cual al final del archivo.\n", "") + "\nPárrafo que se moverá tal cual al final del archivo.\n");
    const r = await check(TMP, { engine: "agent" });
    expect(r.candidates).toBe(0); expect(r.findings).toEqual([]); expect(r.status).toBe("PASS");
  });

  test("a pure deletion is not a softened qualifier — it is counted for fact-locate", async () => {
    w("docs/10-risks.md", BEFORE.replace("El failover de la región tarda 90 s, dato no verificado en carga.\n", ""));
    const r = await check(TMP, { engine: "agent" });
    expect(r.candidates).toBe(0); expect(r.pureDeletions).toBe(1);
  });

  test("the judge's reading decides the band: dropped, to confirm, kept in other words", async () => {
    w("docs/10-risks.md", BEFORE.replace("| Alta |", "| — |").replace(", dato no verificado en carga", "").replace(" sin medir", ""));
    const pending = await check(TMP, { engine: "agent" });
    expect(pending.judge.pending).toMatch(/worksheet|\.json$/); expect(pending.undecided.length).toBe(3); expect(pending.status).toBe("UNDECIDED");
    const part = await check(TMP, { engine: "agent", answers: { "q-0": 0.9 } });     // an item left unanswered stays undecided beside the answered one
    expect(part.findings.length).toBe(1); expect(part.undecided.length).toBe(2);
    const gone = await check(TMP, { engine: "heuristic" });                           // a removed engine: undecided, the reason printed
    expect(gone.undecided.length).toBe(3); expect(gone.judge.note).toMatch(/removed in 8\.119\.0/);
    const r = await check(TMP, { engine: "agent", answers: { "q-0": 0.9, "q-1": 0.5, "q-2": 0.1 } });
    expect(r.candidates).toBe(3);
    expect(r.findings.map((f: any) => f.category)).toEqual(["severity"]);
    expect(r.toConfirm.map((f: any) => f.category)).toEqual(["verification"]);
    expect(r.kept.map((f: any) => f.category)).toEqual(["measurement"]);
    expect(r.findings[0].by).toBe("agent");
  });

  test("a base that is not a commit is an error", async () => {
    await expect(check(TMP, { base: "no-such-ref" })).rejects.toThrow(/not a commit/);
  });
});
