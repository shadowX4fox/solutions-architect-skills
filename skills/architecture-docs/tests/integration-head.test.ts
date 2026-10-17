/**
 * integration-head.js — the one reading of a docs/05 block head, shared by docs-stats.js, prose-check.js and
 * handoff-prepare.js (8.83.4).
 */
import { describe, test, expect } from "bun:test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { integrationHead } = require("../scripts/integration-head.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { report } = require("../scripts/docs-stats.js");
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

describe("integrationHead", () => {
  test("a title line", () => expect(integrationHead("**I-04 — Consulta de saldos**")).toEqual({ ids: ["I-04"], title: "Consulta de saldos", inline: "", titleOnly: true }));
  test.each(["**I-19 e I-20 — Atestación del dispositivo y petición de revocación**", "**I-19 y I-20 — X**", "**I-19 and I-20 — X**", "**I-19, I-20 — X**", "**I-19 & I-20 — X**", "**I-19/I-20 — X**"])("a compound head: %s", (l) => {
    expect(integrationHead(l).ids).toEqual(["I-19", "I-20"]);
    expect(integrationHead(l).titleOnly).toBe(true);
  });
  test("a retired head with its body inline", () => {
    const h = integrationHead("**I-11 — retirada**, per [ADR-120] el canal ya no llama al servicio.");
    expect(h).toEqual({ ids: ["I-11"], title: "retirada", inline: "per [ADR-120] el canal ya no llama al servicio.", titleOnly: false });
  });
  test("bold on the ids only", () => expect(integrationHead("**I-07** — Validación local del SDK en el dispositivo.")).toMatchObject({ ids: ["I-07"], titleOnly: false }));
  test.each(["El flujo usa **I-04 — Consulta** como referencia.", "| I-04 | A | B |", "**Nota**: I-04 — x", "## I-04 — Consulta"])("not a head: %s", (l) => expect(integrationHead(l)).toBeNull());
});

describe("docs-stats reads the same heads", () => {
  test("a compound head is its own block; a retired line does not merge into the previous block", () => {
    const T = join(import.meta.dir, ".temp-integration-head");
    rmSync(T, { recursive: true, force: true }); mkdirSync(join(T, "docs"), { recursive: true });
    const words = (n: number) => Array.from({ length: n }, (_, k) => `w${k}`).join(" ");
    writeFileSync(join(T, "ARCHITECTURE.md"), "# X\n");
    writeFileSync(join(T, "docs/05-integration-points.md"), ["# Integraciones", "", "**I-10 — Consulta**", "", words(100), "",
      "**I-11 — retirada**, per ADR-120 " + words(40), "**I-12 — retirada**, per ADR-120 " + words(40), "",
      "**I-19 e I-20 — Atestación**", "", words(160), ""].join("\n"));
    const f = report(T).findings.filter((x: any) => x.rule === "integration-block-length");
    rmSync(T, { recursive: true, force: true });
    expect(f.map((x: any) => x.where)).toEqual(["I-19 + I-20"]);
  });
});
