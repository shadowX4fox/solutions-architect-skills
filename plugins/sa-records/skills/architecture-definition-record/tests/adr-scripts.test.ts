import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
const { prepare, candidates, slug, citations } = require("../scripts/adr-prepare.js");
const { link } = require("../scripts/adr-link.js");
const { entries, render } = require("../scripts/adr-index.js");
// a payload is cut from an architecture: architecture-docs is optional to this skill, and a copy without it skips that test
const DOCS = existsSync(join(__dirname, "..", "..", "..", "..", "..", "skills", "architecture-docs", "scripts", "section-prepare.js"))   // the repo: plugins/sa-records inside sa-skills
  || !!(process.env.SA_SKILLS_DIR && existsSync(join(process.env.SA_SKILLS_DIR, "skills", "architecture-docs", "scripts", "section-prepare.js")));   // an install

let root = "";
const w = (rel: string, body: string) => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body); };
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "adr-"));
  w(".cache/sa-skills/collect.json", JSON.stringify({ doc_language: "es" }));
  w(".cache/sa-skills/adr-context.md", [
    "ADR CONTEXT BLOCK",
    "[Candidate 1] Cascada de lectura con conmutación por lag | Driver: UC-04, OBJ-2 | Impact: High | Status: DECIDED: la cascada desciende a la ruta en línea si el lag supera el umbral — Section 3 (Resilience)",
    "[Candidate 2] Retención local de 12 meses | Driver: §7 Gobierno del dato | Impact: High | Status: PENDING",
  ].join("\n"));
  w("docs/02-architecture-principles.md", "# Principios\n\n## Principios\n\n### 6. Resiliencia <!-- PRINCIPLE: Resilience -->\n\nLa cascada conmuta a la ruta en línea cuando el lag supera el umbral, per ADR-019.\n\n### 7. Simplicidad\n\nOtra cosa.\n");
  w("PRODUCT_OWNER_SPEC.md", "# PO\n\n## 3. Objetivos\n\n| OBJ-2 | Frescura bajo 30 s |\n\n## 4. Casos de uso\n\n### UC-04: Lectura sin conexión\n\nEl cliente lee su historial sin red.\n");
  w("adr/ADR-019-redis-dedup.md", "# ADR-019: Redis SET NX\n\n| **Estado** | Accepted (aceptado) |\n| **Fecha** | 2026-05-01 |\n\n## Decision\n\n### Summary\n\nEl llamador deduplica con Redis SET NX.\n");
  w("adr/ADR-101-x.md", "# ADR-101: Primera\n\n**Status**: Superseded by [ADR-102](ADR-102-y.md)\n**Date**: 2026-09-01\n");
  w("adr/ADR-102-y.md", "# ADR-102 — Segunda\n\n**Status**: Accepted\n**Date**: 2026-09-02\n");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("adr-prepare", () => {
  test("reads the candidates of the ADR Context Block", () => {
    const cs = candidates(root);
    expect(cs.map((c: any) => [c.n, c.decided, c.section])).toEqual([[1, true, 3], [2, false, null]]);
    expect(slug("Cascada de lectura con conmutación")).toBe("cascada-de-lectura-con-conmutacion");
  });

  test.skipIf(!DOCS)("one payload: target, template, candidate, the resolving section's block, the PO Spec driver, the related ADR's decision", () => {
    const r = prepare(root, { candidate: 1, id: "ADR-103", status: "Accepted", date: "2026-09-29" });
    expect(r.file).toBe("adr/ADR-103-cascada-de-lectura-con-conmutacion-por-lag.md");
    expect(r.text).toContain("**Status**: Accepted");
    expect(r.text).toContain("Canonical template");
    expect(r.text).toContain("Passage — docs/02-architecture-principles.md");
    expect(r.text).toContain("La cascada conmuta");
    expect(r.text).toContain("UC-04: Lectura sin conexión");
    expect(r.text).toContain("| OBJ-2 | Frescura bajo 30 s |");
    expect(r.text).toContain("| ADR-019 | Redis SET NX | El llamador deduplica con Redis SET NX. | `[ADR-019](ADR-019-redis-dedup.md)` |");
    expect(r.text).not.toContain("| ADR-000 |");                     // the template's own id is not a related ADR (8.102.0)
  });

  test.skipIf(!DOCS)("without --date the header carries the local calendar day, not UTC's (8.102.0)", () => {
    const d = new Date(), local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(prepare(root, { candidate: 1, id: "ADR-103" }).text).toContain(`**Date**: ${local}`);
  });

  test("the ADR ID format gate", () => {
    expect(() => prepare(root, { candidate: 1, id: "ADR-042" })).toThrow(/101/);
    expect(() => prepare(root, { candidate: 1, id: "ADR-P1-001" })).toThrow(/ADR-NNN/);
  });
});

describe("adr-index", () => {
  test("the index by code: fields from both header forms, scope by range, superseded-by, sorted", () => {
    const es = entries(root);
    expect(es.map((e: any) => [e.id, e.status, e.scope, e.date, e.by])).toEqual([
      ["ADR-019", "Accepted", "Institutional", "2026-05-01", "—"],
      ["ADR-101", "Superseded", "Project", "2026-09-01", "ADR-102"],
      ["ADR-102", "Accepted", "Project", "2026-09-02", "—"],
    ]);
    const t = render(root, "2026-09-29");
    expect(t).toContain("**Total**: 3 · **Institutional (001–100)**: 1 · **Project (101+)**: 2");
    expect(t).toContain("| ADR-102 | Segunda | Accepted | Project | 2026-09-02 | — |");
  });
});


describe("adr-link (8.91.0)", () => {
  test("a PENDING candidate the documents cite is found, and every citation becomes a link once mapped", () => {
    w("docs/07-security-architecture.md", "# Seguridad\n\n<!-- EXPLORER_HEADER\nscope: s\nrelated_adrs: ADR-005\n-->\n\n## 9. Seguridad\n\nLa retención es de 12 meses (ADR Candidate 2). Ver candidatos 1 y 2.\n");
    expect([...(citations(root).get(2) || [])]).toEqual(["docs/07-security-architecture.md"]);
    w(".cache/sa-skills/adr-ids.json", JSON.stringify({ "1": { id: "ADR-103", file: "adr/ADR-103-a.md" }, "2": { id: "ADR-104", file: "adr/ADR-104-b.md" } }));
    const r = link(root, { write: true });
    expect(r.changes[0].links).toBe(3);
    const t = readFileSync(join(root, "docs/07-security-architecture.md"), "utf8");
    expect(t).toContain("(ADR Candidate 2)".replace("ADR Candidate 2", "[ADR-104](../adr/ADR-104-b.md)"));
    expect(t).toContain("Ver [ADR-103](../adr/ADR-103-a.md) y [ADR-104](../adr/ADR-104-b.md).");
    expect(t).toContain("related_adrs: ADR-005, ADR-103, ADR-104");
    expect(readFileSync(join(root, ".cache/sa-skills/adr-context.md"), "utf8")).toContain("Status: DECIDED — ADR-104");
  });

  test("a principles file whose Layer 2 stamp was current keeps its review through the relink; a stale stamp stays stale (10.5.1)", () => {
    const { stamped, readReview } = require("../../../scripts/shared/principle-stamp.js");
    const F = join(root, "docs/02-architecture-principles.md");
    writeFileSync(F, stamped(readFileSync(F, "utf8").replace("per ADR-019.", "per ADR-019 y ADR Candidate 1."), "PASS", "2026-10-10"));
    w("docs/03-architecture-layers.md", "# Capas\n\nVer ADR Candidate 1.\n\n<!-- PRINCIPLE_REVIEW: PASS 2026-10-01 sha256:000000000000 -->\n");
    w(".cache/sa-skills/adr-ids.json", JSON.stringify({ "1": { id: "ADR-103", file: "adr/ADR-103-a.md" } }));
    expect(readReview(F).state).toBe("current");
    link(root, { write: true });
    expect(readFileSync(F, "utf8")).toContain("per ADR-019 y [ADR-103](../adr/ADR-103-a.md).");
    expect(readReview(F)).toMatchObject({ state: "current", layer2: "PASS", date: "2026-10-10" });
    expect(readReview(join(root, "docs/03-architecture-layers.md")).state).toBe("stale");
  });

  test("the bracketed form — Candidato ADR [N], candidatos ADR [N] y [M] — with its status note (8.92.6)", () => {
    w("docs/06-technology-stack.md", "# Stack\n\n| Decisión | ADR |\n|---|---|\n| Réplica | Candidato ADR [1] (DECIDED, Sección 4) |\n| Cifrado | candidatos ADR [1] y [2] |\n| WSS | Candidato ADR [2] (PENDING) |\n");
    expect([...(citations(root).get(2) || [])]).toContain("docs/06-technology-stack.md");
    w(".cache/sa-skills/adr-ids.json", JSON.stringify({ "1": { id: "ADR-103", file: "adr/ADR-103-a.md" }, "2": { id: "ADR-104", file: "adr/ADR-104-b.md" } }));
    link(root, { write: true });
    const t = readFileSync(join(root, "docs/06-technology-stack.md"), "utf8");
    expect(t).toContain("| Réplica | [ADR-103](../adr/ADR-103-a.md) |");
    expect(t).toContain("| Cifrado | [ADR-103](../adr/ADR-103-a.md) y [ADR-104](../adr/ADR-104-b.md) |");
    expect(t).toContain("| WSS | [ADR-104](../adr/ADR-104-b.md) |");
    expect(t).not.toMatch(/[Cc]andidat/);
  });
});
