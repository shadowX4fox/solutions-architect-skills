/**
 * principle-gate-prepare.js — the Layer 2 gate's stable prefix: the header, the principles whole, the
 * overview / layers / tech stack as the extracts the checks read, the ADR ids, the diff, the marker.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prepare } = require("../scripts/principle-gate-prepare.js");
const SCRIPT = join(__dirname, "..", "scripts", "principle-gate-prepare.js");

const TMP = join(__dirname, ".temp-principle-gate");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
const hdr = `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponents: web-app\nscope: One line.\nrelated_adrs: ADR-101\n-->`;
const block = (text: string, tag: string) => (text.match(new RegExp(`<${tag}>\\n([\\s\\S]*?)\\n</${tag}>`)) || [])[1] || "";

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Order Desk — Arquitectura\n`);
  w("docs/01-system-overview.md", `# Descripción\n\n${hdr}\n\n> El desk en treinta segundos.\n\n## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->\n\n### Descripción del Sistema <!-- SECTION: System Overview -->\n\nProsa larga que el revisor no cita.\n\n**Métricas Clave:** <!-- LABEL: Key Metrics -->\n\n#### Read TPS\n\n- **Average Read TPS**: 100\n\n#### Write TPS\n\n- **Average Write TPS**: 10\n\n**Valor de Negocio:** <!-- LABEL: Business Value -->\n\n- Menos llamadas.\n\n## 2. Descripción del Sistema <!-- SECTION: System Overview -->\n\n### Planteamiento del Problema <!-- LABEL: Problem Statement -->\n\nEl chat falla.\n\n### Solución <!-- LABEL: Solution -->\n\nReplicar.\n\n### Casos de Uso\n\nUC-01.\n`);
  w("docs/02-architecture-principles.md", `# Principios\n\n${hdr}\n\n## Principios de Arquitectura (9 Principios) <!-- SECTION: Architecture Principles -->\n\n### 1. Separación <!-- PRINCIPLE: Separation of Concerns -->\n\n**Description:** Uno.\n`);
  w("docs/03-architecture-layers.md", `# Capas\n\n${hdr}\n\n> Seis capas.\n\n<!-- ARCHITECTURE_TYPE: ENTERPRISE -->\n\n## 4. Capas\n\n### 4.1 Tabla\n\n| Layer | Containers | Inside boundary |\n|---|---|---|\n| **L1 — Canal** | Web App | Sí |\n\n### 4.2 Prosa\n\nMucha prosa y diagramas que el revisor no lee.\n`);
  w("docs/06-technology-stack.md", `# Stack\n\n${hdr}\n\n> React y Kong.\n\n## 8. Stack\n\n### 8.1 Origen\n\n| Categoría | Tecnología | Origen |\n|---|---|---|\n| App | React Native | PO Spec |\n\nProsa entre tablas.\n\n### 8.3 Versiones\n\n| Tecnología | Versión |\n|---|---|\n| Spring Boot | 3.2 |\n`);
  w("docs/components/order-desk.md", `# Order Desk\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponent_self: order-desk\ncomponent_type: internal-system\nscope: s\nrelated_adrs: ADR-101\n-->\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", `# Web App\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React Native\ncomponent_self: web-app\ncomponent_type: web-application\nscope: s\nrelated_adrs: ADR-101\n-->\n\n**Type:** Web Application\n**Technology:** [React Native]\n**C4 Level:** Container (L2)\n`);
  w("adr/ADR-102-y.md", `# ADR-102: B\n\n**Status**: Proposed\n`);
  w("adr/ADR-101-x.md", `# ADR-101: A\n\n**Status**: Accepted\n`);
  w("deltas.md", `- Principle 2: Trade-offs rewritten\n- Principle 5: Implementation cites Dynatrace\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("principle-gate-prepare", () => {
  test("the header carries mode, round, arch_type from the marker, language and the paths; the prefix ends at the marker", () => {
    const r = prepare(TMP, { mode: "first-write", round: 2 });
    expect(r.text).toMatch(/^mode: first-write\nround: 2\narch_type: ENTERPRISE\ndoc_language: es\nprinciples_file: docs\/02-architecture-principles\.md\nsystem_overview_file: docs\/01-system-overview\.md\narch_layers_file: docs\/03-architecture-layers\.md\ntech_stack_file: docs\/06-technology-stack\.md\nadr_index_glob: adr\/\*\.md\n\n<principles>/);
    expect(r.text).toMatch(/\n# === Stable prefix ends here\. Only the line below differs per call\. ===\n$/);
    expect(r.arch_type).toBe("ENTERPRISE");
    expect(r.missing).toEqual([]);
  });

  test("<principles> is the file whole; <system_overview> carries header, summary, Key Metrics with its sub-headings, Business Value, Problem, Solution and the outline — not the prose", () => {
    const r = prepare(TMP, { mode: "first-write" });
    expect(block(r.text, "principles")).toBe(readFileSync(join(TMP, "docs/02-architecture-principles.md"), "utf-8"));
    const ov = block(r.text, "system_overview");
    expect(ov).toMatch(/^# Descripción\n\n<!-- EXPLORER_HEADER/);
    expect(ov).toMatch(/> El desk en treinta segundos\./);
    expect(ov).toMatch(/\*\*Métricas Clave:\*\* <!-- LABEL: Key Metrics -->\n\n#### Read TPS\n\n- \*\*Average Read TPS\*\*: 100\n\n#### Write TPS\n\n- \*\*Average Write TPS\*\*: 10/);
    expect(ov).toMatch(/\*\*Valor de Negocio:\*\* <!-- LABEL: Business Value -->\n\n- Menos llamadas\./);
    expect(ov).toMatch(/### Planteamiento del Problema <!-- LABEL: Problem Statement -->\n\nEl chat falla\./);
    expect(ov).toMatch(/### Solución <!-- LABEL: Solution -->\n\nReplicar\./);
    expect(ov).not.toMatch(/Prosa larga que el revisor no cita/);
    expect(ov).not.toMatch(/UC-01\./);
    expect(ov).toMatch(/Headings \(line {2}heading\):\n {2}\d+ {2}## 1\. Resumen Ejecutivo/);
  });

  test("<arch_layers> carries the type marker and the layer table, not the prose; <tech_stack> every table with its heading plus the descriptors' technologies; <adr_index> one line per ADR, id · title · status, sorted", () => {
    const r = prepare(TMP, { mode: "first-write" });
    const ly = block(r.text, "arch_layers");
    expect(ly).toMatch(/<!-- ARCHITECTURE_TYPE: ENTERPRISE -->\n\n\| Layer \| Name \| Containers \| Inside boundary \|\n\|---\|---\|---\|---\|\n\| 1 \| Canal \| Web App \| yes \|/);
    expect(ly).not.toMatch(/Mucha prosa/);
    const ts = block(r.text, "tech_stack");
    expect(ts).toMatch(/### 8\.1 Origen\n\n\| Categoría \| Tecnología \| Origen \|/);
    expect(ts).toMatch(/### 8\.3 Versiones\n\n\| Tecnología \| Versión \|\n\|---\|---\|\n\| Spring Boot \| 3\.2 \|/);
    expect(ts).not.toMatch(/Prosa entre tablas/);
    expect(ts).toMatch(/\| Container \| Technology \|\n\|---\|---\|\n\| Web App \| React Native \|/);
    expect(block(r.text, "adr_index")).toBe("ADR-101 · A · Accepted\nADR-102 · B · Proposed");
    expect(r.sizes[1]).toMatch(/^arch_layers: /);
  });

  test("edit-delta and downstream-impact indent the diff under principles_diff and report a missing one", () => {
    const r = prepare(TMP, { mode: "edit-delta", diff: join(TMP, "deltas.md") });
    expect(r.text).toMatch(/adr_index_glob: adr\/\*\.md\nprinciples_diff: \|\n {2}- Principle 2: Trade-offs rewritten\n {2}- Principle 5: Implementation cites Dynatrace\n/);
    expect(r.missing).toEqual([]);
    const noDiff = prepare(TMP, { mode: "downstream-impact" });
    expect(noDiff.missing).toEqual(["principles_diff: pass --diff <file> for edit-delta / downstream-impact"]);
    expect(() => prepare(TMP, { mode: "review" })).toThrow(/mode must be/);
  });

  test("a missing file or anchor is reported or marked, never invented", () => {
    const bare = join(TMP, "bare"); mkdirSync(join(bare, "docs"), { recursive: true });
    writeFileSync(join(bare, "ARCHITECTURE.md"), "# Bare\n");
    writeFileSync(join(bare, "docs/01-system-overview.md"), "# Overview\n\nNo anchors here.\n");
    const r = prepare(bare, { mode: "first-write" });
    expect(r.missing).toEqual(["docs/02 not found", "docs/03 not found", "docs/06 not found", "adr/ has no ADR files — the <adr_index> block is empty"]);
    expect(block(r.text, "system_overview")).toMatch(/\(no Key Metrics block — LABEL: Key Metrics absent\)/);
    expect(r.arch_type).toBe("unknown");
  });

  test("the CLI writes .cache/sa-skills/payloads/principle-gate.md and prints the sizes", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--mode", "first-write"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = join(TMP, ".cache", "sa-skills", "payloads", "principle-gate.md");
    expect(existsSync(out)).toBe(true);
    expect(readFileSync(out, "utf-8")).toMatch(/^mode: first-write/);
    expect(r.stderr.toString()).toMatch(/^Wrote .*principle-gate\.md \(\d+\.\d KB, mode first-write, arch_type ENTERPRISE\)\nBlocks as extracts:\n {2}- system_overview: \d+\.\d KB of \d+\.\d KB whole/);
  });

  test("a repair round: edit-delta diffs against the snapshot of the last review and carries the prior review (8.118.7)", () => {
    const snap = join(TMP, ".cache", "sa-skills", "payloads", "principles-reviewed.md");
    expect(readFileSync(snap, "utf-8")).toContain("**Description:** Uno.");                 // the first-write run saved it
    const p2 = join(TMP, "docs/02-architecture-principles.md");
    writeFileSync(p2, readFileSync(p2, "utf-8").replace("**Description:** Uno.", "**Description:** Dos."));
    w("review-1.md", "PRINCIPLE_REVIEW_RESULT:\n  status: FAIL\n  blockingFindings: 1\n");
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--mode", "edit-delta", "--round", "2", "--prior", join(TMP, "review-1.md")], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    expect(r.stderr.toString()).toContain("diff 2 line(s)");
    const text = readFileSync(join(TMP, ".cache", "sa-skills", "payloads", "principle-gate.md"), "utf-8");
    expect(text).toMatch(/principles_diff: \|\n {2}@@ line \d+ @@\n {2}- \*\*Description:\*\* Uno\.\n {2}\+ \*\*Description:\*\* Dos\./);
    expect(block(text, "prior_review")).toContain("blockingFindings: 1");
    expect(readFileSync(snap, "utf-8")).toContain("**Description:** Dos.");                 // the snapshot moves on
    const same = prepare(TMP, { mode: "edit-delta" });
    expect(same.text).toContain("(no change since the last review)");
  });
});
