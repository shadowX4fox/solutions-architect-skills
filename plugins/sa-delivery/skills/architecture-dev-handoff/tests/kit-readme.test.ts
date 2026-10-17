/**
 * kit-readme.js — the managed index from the manifest, the ledger and context-result.json: shared
 * documents, reading order, interface contracts with ADRs, Component Specifications with status and assets.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, utimesSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { readme } = require("../scripts/kit-readme.js");
const TMP = join(__dirname, ".temp-kit-readme");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };
const hdr = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ADR-101\n-->`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.2.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: es -->\n\n# Mesa de Pedidos — Arquitectura\n`);
  w("docs/components/README.md", `# Components\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n`);
  w("docs/components/desk.md", `# Desk\n\n${hdr("desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/desk/01-web-app.md", `# Web App\n\n${hdr("web-app", "web-application")}\n\n**Type:** Web Application\n**Technology:** [React]\n`);
  w("docs/components/desk/02-hub-api.md", `# Hub API\n\n${hdr("hub-api", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n`);
  w("adr/ADR-101-x.md", `# ADR-101: Keep\n\n**Status**: Accepted\n**Scope**: Project\n`);
  w("handoffs/SYSTEM_RUNTIME_VIEW.md", "# x\n"); w("handoffs/CROSS_CUTTING_STANDARDS.md", "# x\n");
  w("handoffs/interfaces/web-app→hub-api.md", "# x\n"); w("handoffs/components/01-web-app.md", "# x\n"); w("handoffs/components/02-hub-api.md", "# x\n");
  w("handoffs/.manifest.json", JSON.stringify({ version: "4", generator: "sa-skills:architecture-dev-handoff", generator_version: "8.25.0",
    run: { ekonte_hash: "sha256:a", ekonte_template_version: "4.1.0", settei_hash: "sha256:a", settei_template_version: "4.1.0", schema_version: "4", architecture_version: "1.2.0", generated: "2026-09-08T14:00:00Z" },
    seams: { "web-app→hub-api": { payload_hash: "sha256:b", template_version: "4.1.0", schema_version: "4", seam_file: "interfaces/web-app→hub-api.md", related_adrs: ["ADR-101", "ADR-102"], generated: "2026-09-08T14:01:00Z" } },
    cut_sheets: { "hub-api": { payload_hash: "sha256:c", template_version: "4.1.0", schema_version: "4", architecture_version: "1.2.0", cut_sheet_file: "components/02-hub-api.md", assets: ["openapi", "c4-descriptor"], doc_language: "es", generated: "2026-09-08T14:02:00Z" },
      "web-app": { payload_hash: "sha256:d", template_version: "4.1.0", schema_version: "4", architecture_version: "1.2.0", cut_sheet_file: "components/01-web-app.md", assets: [], doc_language: "es", generated: "2026-09-07T10:00:00Z" } } }));
  // the web-app descriptor is newer than its specification → Outdated
  const old = new Date("2026-09-07T10:00:00Z"); utimesSync(join(TMP, "handoffs/components/01-web-app.md"), old, old);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("kit-readme", () => {
  test("renders the index in the document language with the manifest's dates, the ADRs, the status and the assets", () => {
    const r = readme(TMP);
    expect(r).toMatchObject({ lang: "es", seams: 1, cut_sheets: 2, outdated: ["web-app"], missing: [] });
    const md = readFileSync(join(TMP, "handoffs/README.md"), "utf8");
    expect(md).toMatch(/^<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n\[Architecture\]\(\.\.\/ARCHITECTURE\.md\) > Development Handoffs\n\n# Kit de Entrega a Desarrollo — Mesa de Pedidos\n\nKit de cuatro partes\./);
    expect(md).toMatch(/## Documentos compartidos\n\n\| Documento \| Generado \|\n\|---\|---\|\n\| \[SYSTEM_RUNTIME_VIEW\.md\]\(SYSTEM_RUNTIME_VIEW\.md\) \| 2026-09-08 \|\n\| \[CROSS_CUTTING_STANDARDS\.md\]\(CROSS_CUTTING_STANDARDS\.md\) \| 2026-09-08 \|/);
    expect(md).toMatch(/\| \*\*Dev\*\* \(construyes cada componente\) \|/);   // more than one component: no single focus
    expect(md).toMatch(/## Contratos de interfaz\n\n\| # \| Arista \| Contrato de Interfaz \| ADR relacionados \| Generado \|\n\|[-|]+\n\| 1 \| Web App → Hub API \| \[web-app→hub-api\.md\]\(interfaces\/web-app→hub-api\.md\) \| ADR-101, ADR-102 \| 2026-09-08 \|/);
    expect(md).toMatch(/## Especificaciones de Componente\n\n\| # \| Componente \| Especificación de Componente \| Estado \| Assets \| Generado \|\n\|[-|]+\n\| 5\.1 \| Web App \| \[01-web-app\.md\]\(components\/01-web-app\.md\) \| Outdated \| — \| 2026-09-07 \|\n\| 5\.2 \| Hub API \| \[02-hub-api\.md\]\(components\/02-hub-api\.md\) \| Ready \| \[openapi\.yaml\]\(assets\/02-hub-api\/openapi\.yaml\), \[c4-descriptor\.md\]\(assets\/02-hub-api\/c4-descriptor\.md\) \| 2026-09-08 \|/);
    expect(md).toMatch(/## Documentación relacionada\n\n- \[ARCHITECTURE\.md\]/);
  });

  test("one Component Specification names the focus component in the reading order; no manifest is an error", () => {
    const m = JSON.parse(readFileSync(join(TMP, "handoffs/.manifest.json"), "utf8")); delete m.cut_sheets["web-app"]; writeFileSync(join(TMP, "handoffs/.manifest.json"), JSON.stringify(m));
    readme(TMP);
    expect(readFileSync(join(TMP, "handoffs/README.md"), "utf8")).toMatch(/\| \*\*QA\*\* \(pruebas `Hub API`\) \| [^\n]*4\) `assets\/02-hub-api\/openapi\.yaml` \|/);
    // the QA row names the component's own contract assets (8.112.0), never `openapi.yaml` by default
    m.cut_sheets["hub-api"].assets = ["graphql-sdl", "asyncapi", "c4-descriptor"]; writeFileSync(join(TMP, "handoffs/.manifest.json"), JSON.stringify(m)); readme(TMP);
    let md = readFileSync(join(TMP, "handoffs/README.md"), "utf8");
    expect(md).toMatch(/\| \*\*QA\*\* \(pruebas `Hub API`\) \| [^\n]*4\) `assets\/02-hub-api\/schema\.graphql` · `assets\/02-hub-api\/asyncapi\.yaml` \|/);
    expect(md).not.toContain("openapi.yaml");
    m.cut_sheets["hub-api"].assets = ["c4-descriptor"]; writeFileSync(join(TMP, "handoffs/.manifest.json"), JSON.stringify(m)); readme(TMP);
    md = readFileSync(join(TMP, "handoffs/README.md"), "utf8");
    expect(md).toMatch(/4\) sin asset de contrato — el componente no expone una API ni un mensaje documentados \|/);
    rmSync(join(TMP, "handoffs/.manifest.json"));
    expect(() => readme(TMP)).toThrow(/\.manifest\.json not found/);
  });
});
