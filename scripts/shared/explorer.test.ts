/**
 * Unit tests for explorer.ts — the manifest and findings modes of the retired
 * architecture-explorer agent, as code. A temp project carries every surface
 * element the schemas name; assertions follow the agent's contract.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { checkHeaders, docLanguage, fence, findings, manifest, planTerms, relaxedStem, renderCheck, toYaml } from "./explorer";

let root: string;
const w = (rel: string, body: string) => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body, "utf-8"); };

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "explorer-test-"));
  w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 2.1.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: es -->\n# Demo — Arquitectura\n");
  w("docs/01-system-overview.md", "# Visión\n\n<!-- EXPLORER_HEADER\nkey_concepts: SLO, latencia\ntechnologies: Kafka, PostgreSQL 16\ncomponents: payment-service\nscope: Resumen del sistema\nrelated_adrs: ADR-001\n-->\n\n## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->\n\nEl SLO de disponibilidad es 99.9 %.\n");
  w("docs/08-scalability-and-performance.md", "# Escalabilidad\n\n## 8.3 Objetivos SLO\n\nEl sistema mantiene un SLO de 99.9 % con un presupuesto de error mensual de 43 minutos.\n\n## 8.4 Política\n\nOtra línea con SLO.\n");
  w("docs/components/README.md", "# Índice\n");
  w("docs/components/pagos/01-payment-service.md", "# Payment Service\n\n<!-- EXPLORER_HEADER\nkey_concepts: pagos\ntechnologies: Kafka\ncomponent_self: payment-service\ncomponent_type: Service\nscope: Servicio de pagos\nrelated_adrs: ADR-001, ADR-002\n-->\n\nPublica en Kafka.\n");
  w("adr/ADR-001-circuit-breaker.md", "# ADR-001: Circuit breaker en el gateway\n\n**Status**: Accepted (2026-01-01)\n**Scope**: Institutional\n\n## Decision\n\nUsamos circuit breaker con SLO por servicio.\n");
  w("adr/ADR-002-kafka.md", "# ADR-002 — Kafka como bus\n\n| **Estado** | Proposed |\n|---|---|\n");
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("manifest", () => {
  test("lists docs, components and ADRs with header fields, status and scope", () => {
    const m = manifest(root);
    expect(m.status).toBe("OK");
    expect(m.architecture).toEqual({ file: "ARCHITECTURE.md", version: "2.1.0", status: "Released" });
    expect(m.doc_language).toBe("es");
    expect(m.metadata!.doc_language_source).toBe("marker");
    const doc = m.docs!.find((d) => d.file === "docs/01-system-overview.md")!;
    expect(doc.title).toBe("Visión");
    expect(doc.key_concepts).toEqual(["SLO", "latencia"]);
    expect(doc.related_adrs).toEqual(["ADR-001"]);
    expect(m.docs!.find((d) => d.file === "docs/08-scalability-and-performance.md")!.has_header).toBe(false);
    expect(m.components!.index_file).toBe("docs/components/README.md");
    const c = m.components!.files[0];
    expect(c.file).toBe("docs/components/pagos/01-payment-service.md");
    expect(c.component_self).toBe("payment-service");
    expect(c.related_adrs).toEqual(["ADR-001", "ADR-002"]);
    expect(m.adrs).toEqual([
      { id: "ADR-001", file: "adr/ADR-001-circuit-breaker.md", title: "Circuit breaker en el gateway", status: "Accepted", scope: "Institutional" },
      { id: "ADR-002", file: "adr/ADR-002-kafka.md", title: "Kafka como bus", status: "Proposed" },
    ]);
  });

  test("focus_component carries the header's ADRs and sets the header shortcut", () => {
    const m = manifest(root, { componentFile: join(root, "docs/components/pagos/01-payment-service.md") });
    expect(m.focus_component).toEqual({ file: "docs/components/pagos/01-payment-service.md", related_adrs: ["ADR-001", "ADR-002"], has_header: true });
    expect(m.metadata!.shortcut).toBe("header");
  });

  test("FAILED without ARCHITECTURE.md", () => {
    rmSync(join(root, "ARCHITECTURE.md"));
    const m = manifest(root);
    expect(m.status).toBe("FAILED");
    expect(m.reason).toContain("ARCHITECTURE.md not found");
  });

  test("language: legacy marker, inference, default", () => {
    w("ARCHITECTURE.md", "<!-- LANGUAGE: en -->\n# X\n");
    expect(docLanguage(root)).toEqual({ value: "en", source: "legacy_marker" });
    w("ARCHITECTURE.md", "# X\n");
    w("docs/01-system-overview.md", "# X\n## Resumen Ejecutivo\n## Descripción del Sistema\n## Valor de Negocio\n");
    expect(docLanguage(root)).toEqual({ value: "es", source: "inferred" });
    w("docs/01-system-overview.md", "# X\nnothing\n");
    expect(docLanguage(root)).toEqual({ value: "en", source: "default" });
  });
});

describe("findings", () => {
  test("pre-built regex list: coverage per term, files ranked, heading and excerpt per cluster", () => {
    const f = findings(root, { query: "SLO|service level objective|objetivo de nivel de servicio, error budget|presupuesto de error", surface: "docs" });
    expect(f.status).toBe("OK");
    expect(f.search_terms.length).toBe(2);
    expect(f.monolingual_query_warning).toBeUndefined();
    const slo = f.term_coverage[0], eb = f.term_coverage[1];
    expect(slo.files_matched).toBe(2);
    expect(eb.total_matches).toBe(1);
    expect(f.files[0].file).toBe("docs/08-scalability-and-performance.md");   // two terms matched → first
    expect(f.files[0].matched_terms.sort()).toEqual([eb.term, slo.term].sort());
    const m = f.files[0].matches[0];
    expect(m.line).toBe(3);   // the heading itself carries the term
    expect(m.heading).toBe("## 8.3 Objetivos SLO");
    expect(m.excerpt).toContain("presupuesto de error");
    expect(f.files.some((x) => x.file.startsWith("adr/"))).toBe(false);   // surface: docs
  });

  test("surface all includes ADRs; plain terms are literal and case-insensitive; identifiers keep case", () => {
    const f = findings(root, { query: "circuit breaker, ADR-001" });
    expect(f.files.some((x) => x.file === "adr/ADR-001-circuit-breaker.md")).toBe(true);
    expect(f.monolingual_query_warning).toContain("DOC_LANGUAGE: es");
    expect(planTerms("ADR-001").terms[0].rx.flags).toBe("");
    expect(planTerms("Kafka").terms[0].rx.flags).toBe("i");
  });

  test("zero-match term is relaxed to a 6-char stem and marked; a still-empty term stays in coverage", () => {
    const f = findings(root, { query: "escalabilidades, zzzz-nothing-here" });
    const [esc, none] = f.term_coverage;
    expect(esc.relaxed).toBe(true);
    expect(esc.files_matched).toBeGreaterThan(0);
    expect(none.files_matched).toBe(0);
    expect(none.relaxed).toBe(false);
    expect(relaxedStem("Vulnerability remediation SLAs")).toBe("vulner");
    expect(relaxedStem("presupuesto de error")).toBe("presup");
    expect(relaxedStem("MTBF")).toBeNull();
    expect(relaxedStem("single point of failure|\\bSPOF\\b")).toBe("failur");
  });

  test("caps: files beyond the limit are dropped except a term's best file; clusters capped and flagged", () => {
    for (let i = 0; i < 14; i++) w(`docs/${20 + i}-filler.md`, `# F${i}\n\nlínea con SLO\n`);
    w("docs/30-only.md", "# Only\n\n" + Array(12).fill("").map((_, i) => `${"\n".repeat(12)}único término aquí ${i}`).join("\n"));
    const f = findings(root, { query: "SLO, único término", surface: "docs", maxFiles: 3 });
    expect(f.truncated).toBe(true);
    expect(f.files.some((x) => x.file === "docs/30-only.md")).toBe(true);   // reserved: the only file with the second term
    expect(f.files.find((x) => x.file === "docs/30-only.md")!.matches.length).toBe(5);
    expect(f.truncation_note).toContain("capped");
  });

  test("focus_component and FAILED", () => {
    const f = findings(root, { query: "Kafka", componentFile: join(root, "docs/components/pagos/01-payment-service.md") });
    expect(f.focus_component!.related_adrs).toEqual(["ADR-001", "ADR-002"]);
    rmSync(join(root, "ARCHITECTURE.md"));
    expect(findings(root, { query: "x" }).status).toBe("FAILED");
  });
});

describe("yaml block", () => {
  test("fence starts with the label, excerpts are block scalars, lists inline, empty lists []", () => {
    const f = findings(root, { query: "SLO", surface: "docs" });
    const y = fence("EXPLORE_FINDINGS", f);
    expect(y.startsWith("EXPLORE_FINDINGS:\n```yaml\nschema_version: 2\nstatus: OK\n")).toBe(true);
    expect(y).toContain("excerpt: |\n");
    expect(y).toContain("matched_terms: [SLO]");
    expect(toYaml({ a: [], b: "needs: quoting", c: 3 })).toBe('a: []\nb: "needs: quoting"\nc: 3');
  });
});

describe("check — the header contract across files", () => {
  test("a clean project reports no findings", () => {
    const c = checkHeaders(root);
    expect(c.files).toBe(3);
    expect(c.with_header).toBe(2);
    // docs/08 has no header at all → the one error; the fixtures carry no summary blockquote → warnings only
    expect(c.errors).toBe(1);
    expect(c.findings.filter((f) => f.severity === "error").map((f) => f.rule)).toEqual(["missing-header"]);
    expect(c.findings.filter((f) => f.severity === "warning").every((f) => f.rule === "no-summary" || f.rule === "advisory")).toBe(true);
  });

  test("every rule fires once", () => {
    w("docs/08-scalability-and-performance.md", "# Escalabilidad\n\n## 8.3 Objetivos SLO\n\n<!-- EXPLORER_HEADER\nkey_concepts: a, b, c, d, e\ntechnologies: x\nconceptos_clave: traducido\ncomponents: payment-service, nope-service\nscope: s\nrelated_adrs: ADR-001, ADR-999\n-->\n\n<!-- EXPLORER_HEADER\nkey_concepts: dup\n-->\n");
    w("docs/components/pagos/01-payment-service.md", "# Payment Service\n\n<!-- EXPLORER_HEADER\nkey_concepts: pagos, a, b, c, d\ntechnologies: Kafka\ncomponent_self: pago-servicio\ncomponent_type: Service\ninternal_name: pay-a\nscope: Servicio de pagos\nrelated_adrs: ADR-001\n-->\n\n**Internal Name:** `pay-b`\n\nBody.\n");
    const c = checkHeaders(root);
    const rules = (file: string) => c.findings.filter((f) => f.file === file).map((f) => f.rule);
    expect(rules("docs/08-scalability-and-performance.md")).toEqual(["duplicate-header", "header-position", "unknown-key", "unknown-component", "unknown-adr", "no-summary"]);
    expect(rules("docs/components/pagos/01-payment-service.md")).toEqual(["component-self-slug", "internal-name-drift", "no-summary"]);
    expect(c.errors).toBe(6);
    expect(c.warnings).toBe(5);   // no-summary ×3 (docs/01, docs/08, the component), internal-name-drift, and docs/01's short key_concepts advisory
    expect(checkHeaders(root, { file: "docs/components/pagos/01-payment-service.md" }).findings.length).toBe(3);
    expect(renderCheck(c)).toContain("✗ docs/08-scalability-and-performance.md — unknown-key");
  });

  test("no adr/ directory: related_adrs are not checked against disk", () => {
    rmSync(join(root, "adr"), { recursive: true, force: true });
    expect(checkHeaders(root).findings.some((f) => f.rule === "unknown-adr")).toBe(false);
  });
});
