/**
 * record-structure.js — an ADR's or a TDR's structure is English, with no anchor comment (LANGUAGE_POLICY §4 Records).
 */
import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { structureFindings } = require("./record-structure.js");
const TEMPLATE = join(__dirname, "..", "..", "skills", "architecture-definition-record", "adr", "ADR-000-template.md");
const TDR_TEMPLATE = join(__dirname, "..", "..", "skills", "technical-debt-records", "templates", "tdr-template.md");

describe("the templates are clean", () => {
  // the templates belong to the records skills; a copy of the shared layer without them skips these two
  test.skipIf(!existsSync(TEMPLATE))("ADR-000-template.md", () => expect(structureFindings(readFileSync(TEMPLATE, "utf8"), "adr")).toEqual([]));
  test.skipIf(!existsSync(TDR_TEMPLATE))("tdr-template.md", () => expect(structureFindings(readFileSync(TDR_TEMPLATE, "utf8"), "tdr")).toEqual([]));
});

describe("an ADR", () => {
  const adr = [
    "# ADR-101: Caché distribuida para saldos", "",
    "**Estado**: Accepted", "**Alcance**: User", "",
    "## Contexto <!-- SECTION: Context -->", "", "El canal consulta el saldo en cada pantalla.", "",
    "## Decision <!-- SECTION: Decision -->", "", "Redis con TTL de 30 s.", "",
    "### Consecuencias Negativas", "", "- **Arranque en frío** — **Severidad**: Low. **Mitigación**: precarga.", "",
    "## Alternatives Considered", "", "| Alternativa | Por qué se descartó | When it would have been the better choice |", "|---|---|---|", "| Riesgo | Mitigación | Fecha |", "",
    "### Riesgos", "", "| Risk | Probabilidad | Impact | Mitigation |", "|---|---|---|---|", "| Pérdida del nodo | Low | High | réplica |", "",
    "## Historial de Revisión", "", "| Fecha | Revisor | Acción | Notas |", "|---|---|---|---|", "| 2026-09-01 | Equipo | Created | Borrador |", "",
  ].join("\n");
  const f = structureFindings(adr, "adr");
  const L = adr.split("\n");
  const ln = (start: string) => L.findIndex((l) => l.startsWith(start)) + 1;
  const at = (start: string) => f.filter((x: any) => x.line === ln(start)).map((x: any) => x.message).join(" ");
  test("labels, every one on the line, bold prose words never", () => {
    expect(at("**Estado**")).toContain("`**Status**`"); expect(at("**Alcance**")).toContain("`**Scope**`");
    const b = at("- **Arranque"); expect(b).toContain("`**Severity**`"); expect(b).toContain("`**Mitigation**`"); expect(b).not.toContain("Arranque");
  });
  test("a localized heading with an anchor: both named", () => { expect(at("## Contexto")).toContain("`## Context`"); expect(at("## Contexto")).toContain("no anchor comment"); });
  test("an English heading with an anchor: the anchor alone", () => { expect(at("## Decision")).toContain("no anchor comment"); expect(at("## Decision")).not.toContain("headings stay English"); });
  test("any level", () => expect(at("### Consecuencias")).toContain("`### Negative Consequences`"));
  test("header rows only — body cells are prose", () => {
    expect(at("| Alternativa")).toContain("`Alternativa` → `Alternative`"); expect(at("| Alternativa")).toContain("`Por qué se descartó` → `Why rejected`");
    expect(at("| Riesgo | Mitigación")).toBe("");
    expect(at("| Risk |")).toBe("table header `Probabilidad` → `Probability` — column headers stay English");
    expect(at("| Pérdida")).toBe("");
    expect(at("| Fecha | Revisor")).toContain("`Revisor` → `Reviewer`"); expect(at("| 2026-09-01")).toBe("");
  });
  test("the Review History heading", () => expect(at("## Historial")).toContain("`## Review History`"));
  test("accents are ignored", () => expect(structureFindings("## Decision\n\n## Justificacion\n", "adr").map((x: any) => x.english)).toEqual(["## Rationale"]));
  test("fences and frontmatter are not read", () => expect(structureFindings("---\nEstado: x\n---\n\n```\n## Contexto\n```\n", "adr")).toEqual([]));
});

describe("a TDR", () => {
  test("the Capability level names, in the first column only", () => {
    const f = structureFindings(["## Capability", "", "| Level | Name | Code / BIAN id |", "|---|---|---|", "| Área de Negocio | Dominio de Negocio | `CUS` |", ""].join("\n"), "tdr");
    expect(f.map((x: any) => x.message)).toEqual(["Capability level `Área de Negocio` → `Business Area` — level names stay English"]);
  });
  test("an anchor on an English heading", () => expect(structureFindings("## Status <!-- SECTION: Status -->\n", "tdr").map((x: any) => x.kind)).toEqual(["heading"]));
});
