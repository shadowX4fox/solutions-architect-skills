/**
 * fact-locate.js — the check that lets Workflow 12 delete a passage: the fact it carried must be stated where the kept
 * link points. Rules under test: salient tokens (numbers with units, identifiers, backticked names, ledger names); a
 * target resolved to the section an anchor names, at whatever heading level; located vs missing by the judge's answer, with
 * the missing tokens, and undecided — reported, never read from coverage — while the judge has not answered;
 * --base pairs a removal with the links of its rewrite, calls a restatement in place `rewritten`, and reports a removal
 * with no link near it as `unlinked`. Synthetic temp git repositories only.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

const { locate, fromBase, tokensOf, resolveTarget, render } = require("../scripts/fact-locate.js");
const TMP = join(import.meta.dir, ".temp-fact-locate");
const w = (rel: string, s: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), s); };
const git = (...a: string[]) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: TMP, encoding: "utf8" });

const ADR = [
  "# ADR-104: Rotación de llaves", "", "**Status**: Accepted", "",
  "## Contexto <!-- SECTION: Context -->", "", "Texto de contexto.", "",
  "## Decisión <!-- SECTION: Decision -->", "",
  "Las llaves del `Servicio de Llaves` rotan cada 30 días con un solapamiento de 48 h.", "",
  "### Detalle", "", "El TTL de caché es 5 min.", "",
  "## Consecuencias <!-- SECTION: Consequences -->", "", "Una ventana de 48 h de doble validación.", "",
].join("\n");

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
  git("init", "-q");
  w("ARCHITECTURE.md", "# A\n");
  w("adr/ADR-104-rotacion.md", ADR);
  w("docs/02-principles.md", [
    "# Principios", "", "### 1. Llaves rotadas", "",
    "- Las llaves rotan per [ADR-104](../adr/ADR-104-rotacion.md#decision). Rotan cada 30 días con 48 h de solapamiento en el `Servicio de Llaves`.",
    "- Otra viñeta sin enlace: el lote nocturno procesa 1200 archivos.", "",
  ].join("\n"));
  git("add", "-A"); git("commit", "-qm", "base");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("fact-locate", () => {
  test("salient tokens: numbers with units, identifiers, backticked names, multi-digit numbers", () => {
    const t = tokensOf("Rotan cada 30 días con 48 h per ADR-104 e I-07 en el `Servicio de Llaves`; 1200 archivos.", TMP);
    expect(t).toEqual(expect.arrayContaining(["30 días", "48 h", "ADR-104", "I-07", "Servicio de Llaves", "1200"]));
  });

  test("an anchor resolves to its section, which runs to the next heading of the same level", () => {
    const r = resolveTarget(TMP, "adr/ADR-104-rotacion.md#decision");
    expect(r.section).toBe("Decisión");
    expect(r.text).toContain("5 min");            // the ### under it belongs to the section
    expect(r.text).not.toContain("doble validación");
  });

  test("undecided until the judge answers, whatever the coverage; then located or missing, with what the target lacks", async () => {
    const OK = [{ removed: "Rotan cada 30 días con 48 h de solapamiento en el `Servicio de Llaves`.", target: "adr/ADR-104-rotacion.md#decision" }];
    const open = await locate(TMP, OK, { engine: "agent" });
    expect(open.status).toBe("UNDECIDED"); expect(open.pairs[0].status).toBe("undecided"); expect(open.pairs[0].coverage).toBe(1); expect(open.pairs[0].by).toBe("undecided");
    expect(open.judge.pending).toBeTruthy(); expect(render(open)).toContain(`undecided: 1 pair(s) no judge has answered`); expect(render(open)).toContain(open.judge.pending);
    const gone = await locate(TMP, OK, { engine: "heuristic" });                      // a removed engine: undecided, the reason printed
    expect(gone.pairs[0].status).toBe("undecided"); expect(gone.judge.note).toMatch(/removed in 8\.119\.0/);
    const ok = await locate(TMP, OK, { engine: "agent", answers: { "f-0": 0.9 } });
    expect(ok.status).toBe("PASS"); expect(ok.pairs[0].status).toBe("located"); expect(ok.pairs[0].by).toBe("agent");
    const bad = await locate(TMP, [{ removed: "Rotan cada 30 días y el HSM guarda 3 réplicas.", target: "adr/ADR-104-rotacion.md#consequences" }], { engine: "agent", answers: { "f-0": 0.1 } });
    expect(bad.status).toBe("FAIL"); expect(bad.pairs[0].missing).toEqual(expect.arrayContaining(["30 días", "3 réplicas"]));
    const nofile = await locate(TMP, [{ removed: "30 días", target: "adr/nope.md" }], { engine: "agent" });
    expect(nofile.pairs[0].status).toBe("missing"); expect(nofile.pairs[0].note).toMatch(/not found/);
  });

  test("--base: a removal whose rewrite keeps the link is checked at the link; an unlinked removal is reported", async () => {
    w("docs/02-principles.md", [
      "# Principios", "", "### 1. Llaves rotadas", "",
      "- Las llaves rotan per [ADR-104](../adr/ADR-104-rotacion.md#decision).",
      "", "",
    ].join("\n"));
    const u = await fromBase(TMP, { base: "HEAD", engine: "agent" });
    expect(u.linked.length).toBe(1); expect(u.linked[0].status).toBe("undecided"); expect(render(u)).toContain("undecided: 1 pair(s)");
    const r = await fromBase(TMP, { base: "HEAD", engine: "agent", answers: { "f-0": 0.9 } });
    expect(r.linked.length).toBe(1);
    expect(r.linked[0].status).toBe("located");
    expect(r.unlinked.map((u: any) => u.status)).toEqual(["missing"]);   // the 1200-archivos bullet went nowhere
    expect(r.status).toBe("FAIL");
    expect(render(r)).toContain("no link kept");
  });

  test("--base: a restatement in place needs no link", async () => {
    w("docs/02-principles.md", [
      "# Principios", "", "### 1. Llaves rotadas", "",
      "- Las llaves rotan per [ADR-104](../adr/ADR-104-rotacion.md#decision) cada 30 días, 48 h de solapamiento, `Servicio de Llaves`.",
      "- El lote nocturno procesa 1200 archivos.", "",
    ].join("\n"));
    const r = await fromBase(TMP, { base: "HEAD", engine: "agent" });
    expect(r.status).toBe("PASS"); expect(r.rewritten.length).toBeGreaterThan(0);
  });
});
