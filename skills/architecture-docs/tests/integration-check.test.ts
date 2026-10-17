/**
 * integration-check.js — docs/05 against the Mermaid HLD it was written from, and its Protocol cells against the label
 * grammar of the bundled design standard (8.93.0).
 */
import { describe, test, expect, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, parseHld, transcriptionOf } = require("../scripts/integration-check.js");
const { check: gates } = require("../scripts/gates-check.js");
const GOV = !!require("../../../scripts/shared/packs.js").designLanguageDir();   // a design language in force (an institution pack's): the governed tests run only then

const TMP = join(__dirname, ".temp-integration-check");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const HLD = [
  "flowchart TB",
  '  subgraph SYS["Sistema"]',
  '    APP["App Móvil"]',
  '    DB[("Base Local")]',
  '    SYNC["Servicio de Réplica"]',
  "  end",
  '  API["API Cuentas"]',
  '  APP -->|"TCP [Query]"| DB',
  '  SYNC -->|"WSS [Replication]"| DB',
  '  APP -->|"HTTPS/JSON [Config]"| API',
  "  class APP unit;",
].join("\n");

const D05 = [
  "# Integraciones",
  "",
  "| ID | From | To | Protocol |",
  "|---|---|---|---|",
  "| `I-01` | `App Móvil` | `API Cuentas` | HTTPS/JSON [Query] |",
  "| `I-02` | `Base Local` | `Servicio de Réplica` | WSS/Couchbase [Replication] |",
  "| `I-03` | `App Móvil` | `Servicio de Réplica` | HTTPS/JSON [Command] |",
  "",
].join("\n");

describe("integration-check", () => {
  test("the HLD parser reads nodes by display name and edges with their labels, not subgraphs", () => {
    const g = parseHld(HLD);
    expect(g.edges.map((e: { fromName: string; toName: string; label: string }) => `${e.fromName}>${e.toName}|${e.label}`)).toEqual([
      "App Móvil>Base Local|TCP [Query]",
      "Servicio de Réplica>Base Local|WSS [Replication]",
      "App Móvil>API Cuentas|HTTPS/JSON [Config]",
    ]);
  });

  test.if(GOV)("missing, reversed and action departures; a row the HLD does not draw; an unregistered Protocol cell blocks", () => {
    rmSync(TMP, { recursive: true, force: true });
    w("hld.mmd", HLD);
    w(".cache/sa-skills/collect.json", JSON.stringify({ doc_language: "es", hld: { path: "hld.mmd", format: "mermaid" } }));
    w("docs/05-integration-points.md", D05);
    const r = check(TMP);
    const kinds = r.findings.filter((f: { check: string }) => f.check === "hld").map((f: { kind: string; id: string | null }) => `${f.kind}:${f.id || "-"}`).sort();
    expect(kinds).toEqual(["action:I-01", "missing:-", "not-in-hld:I-03", "reversed:I-02"]);
    const proto = r.findings.filter((f: { check: string }) => f.check === "protocol");
    expect(proto.map((f: { id: string }) => f.id)).toEqual(["I-02"]);
    expect(proto[0].line).toBe(6);
    expect(r.status).toBe("FAIL");
  });

  test("a picture HLD without its transcription is a finding; with it, the transcription is read (8.93.1)", () => {
    rmSync(TMP, { recursive: true, force: true });
    w("hld.pdf", "%PDF");
    w(".cache/sa-skills/collect.json", JSON.stringify({ hld: { path: "hld.pdf", format: "pdf" } }));
    w("docs/05-integration-points.md", "| ID | From | To | Protocol |\n|---|---|---|---|\n| `I-01` | `A` | `B` | HTTPS/JSON [Query] |\n");
    let r = check(TMP);
    expect(r.findings.map((f: { kind: string }) => f.kind)).toEqual(["untranscribed"]);
    expect(r.status).toBe("PASS");
    expect(transcriptionOf(join(TMP, "hld.pdf"))).toBe(join(TMP, "hld.hld.mmd"));
    w("hld.hld.mmd", 'flowchart TB\n  A["A"] -->|"HTTPS/JSON [Query]"| B["B"]\n');
    r = check(TMP);
    expect(r.hld).toContain("hld.hld.mmd");
    expect(r.findings).toEqual([]);
  });

  test("the gate holds a picture HLD at TRANSCRIBE until its transcription states an edge (8.93.1)", () => {
    rmSync(TMP, { recursive: true, force: true });
    w("PRODUCT_OWNER_SPEC.md", "# Spec\n");
    w("BIAN_ALIGNMENT.md", "<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->\n# BIAN\n");
    w("HLD.png", "png");
    const hld = () => gates(TMP, { lang: "es", hld: "HLD.png" }).gates.find((g: { name: string }) => g.name === "hld");
    const h1 = hld();
    expect(h1.status).toBe("TRANSCRIBE");
    expect(h1.transcription).toBe("HLD.hld.mmd");
    w("HLD.hld.mmd", "flowchart TB\n  A[\"A\"]\n");
    expect(hld().status).toBe("TRANSCRIBE");
    w("HLD.hld.mmd", "flowchart TB\n  A[\"A\"] --> B[\"B\"]\n");
    expect(hld().status).toBe("PASS");
  });

  test("a name with \" y \" in it is one node, backticked or not (8.93.2)", () => {
    rmSync(TMP, { recursive: true, force: true });
    w("hld.mmd", 'flowchart TB\n  G["Gateway Data API"] -->|"HTTPS/JSON [Query]"| D["Data API Clientes y Pedidos"]\n  D -->|"JDBC/SQL [Query]"| B[("Base Clientes y Pedidos")]\n');
    w(".cache/sa-skills/collect.json", JSON.stringify({ hld: { path: "hld.mmd", format: "mermaid" } }));
    w("docs/05-integration-points.md", "| ID | From | To | Protocol |\n|---|---|---|---|\n| `I-28` | `Gateway Data API` | `Data API Clientes y Pedidos` | HTTPS/JSON [Query] |\n| `I-29` | `Data API Clientes y Pedidos` | Base Clientes y Pedidos | JDBC/SQL [Query] |\n");
    const r = check(TMP);
    expect(r.findings).toEqual([]);
  });

  test("a C4 HLD's elements and Rel() are read", () => {
    const g = parseHld('C4Container\n  Person(u, "Cliente")\n  Container(api, "API Cuentas", "Java")\n  Rel(u, api, "Consulta", "HTTPS/JSON")\n');
    expect(g.edges.map((e: { fromName: string; toName: string; label: string }) => `${e.fromName}>${e.toName}|${e.label}`)).toEqual(["Cliente>API Cuentas|HTTPS/JSON [Consulta]"]);
  });
});
