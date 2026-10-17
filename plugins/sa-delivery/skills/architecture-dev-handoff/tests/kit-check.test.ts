/**
 * kit-check.js — the gate over a written kit: markers, leftover placeholders outside comments and links,
 * authoring-rule comments, the Mermaid fences through mermaid-check, the CLI's exit code.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, checkFile, lexicon, seamPayloadOf } = require("../scripts/kit-check.js");
const SCRIPT = join(__dirname, "..", "scripts", "kit-check.js");
const TMP = join(__dirname, ".temp-kit-check");
const head = (v = "4.1.0") => `# Interface Contract: Web App → Hub API\n\n<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n<!-- TEMPLATE_VERSION: ${v} -->\n\n`;

beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); mkdirSync(join(TMP, "interfaces"), { recursive: true }); mkdirSync(join(TMP, "assets", "01-x"), { recursive: true });
  writeFileSync(join(TMP, "interfaces", "good.md"), head() + "| Decision | [ADR-101](../../adr/ADR-101-x.md) |\n\nSee [CROSS_CUTTING_STANDARDS § Versioning](../CROSS_CUTTING_STANDARDS.md#versioning), per [ADR-120] and I-10 [I-10].\n\n<!-- [UPSTREAM_COMPONENT] inside a comment is fine -->\n\n| 2026-09-08 | Initial interface contract | — |\n\n```mermaid\nflowchart TB\n  A[\"a\"] --> B[\"b\"]\n```\n\n[NOT DOCUMENTED — add contract reference]\n");
  writeFileSync(join(TMP, "interfaces", "bad.md"), head() + "COMPONENT NAMING FIDELITY (authoring rule for seam-generator — do not render)\n\nBoth [UPSTREAM_COMPONENT] and [DOWNSTREAM_COMPONENT] MUST be named.\n\n| [YYYY-MM-DD] | Initial interface contract | [ADR-NNN or —] |\n\n| 1 | x | [N]ms | [P]% |\n\n```mermaid\nsequenceDiagram\n  A->>B: 1. hola; adios\n```\n");
  writeFileSync(join(TMP, "README.md"), "<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n\n# Service Handoff Kit — Desk\n");
  writeFileSync(join(TMP, "nomarker.md"), "# X\n\nplain\n");
  writeFileSync(join(TMP, "assets", "01-x", "c4-descriptor.md"), "[ASSET_PLACEHOLDER] assets are not checked\n");
  // anchors — the shape every deliverable carries from TEMPLATE_VERSION 4.2.0, and the shape two of the four agents used to emit
  writeFileSync(join(TMP, "interfaces", "anchored.md"), head() + "### Índice rápido por rol <!-- SECTION: Role Quick Index -->\n\n| a | b |\n\n## Interacción <!-- SECTION: Interaction -->\n\nprose\n\n## Estado de entrada <!-- SECTION: Entry state -->\n\nprose\n");
  writeFileSync(join(TMP, "interfaces", "unanchored.md"), head() + "### Role Quick Index\n\n| a | b |\n\n## Interaction\n\nprose\n\n## Entry state\n\nprose\n");
  // phase panels — the storyboard repeats them by design; two copies that differ is drift the Mermaid gate cannot see
  const panel = (n: number, body: string) => `### Panel — Phase ${n}: Something\n\n\`\`\`mermaid\n${body}\n\`\`\`\n\n`;
  const seq = 'sequenceDiagram\n  A->>B: 1. request';
  writeFileSync(join(TMP, "storyboard.md"), head() + panel(1, seq) + panel(4, seq + '\n  B->>C: 2. read') + panel(1, seq));
  writeFileSync(join(TMP, "drifted.md"), head() + panel(1, seq) + panel(4, seq) + panel(1, seq + '\n  B->>C: 2. added here only'));
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("kit-check", () => {
  test("a clean file passes: citations, link text, comments and the NOT DOCUMENTED marker are not placeholders", () => {
    expect(checkFile(join(TMP, "interfaces", "good.md")).findings).toEqual([]);
    expect(checkFile(join(TMP, "README.md")).findings).toEqual([]);   // the README carries no template version
  });

  test("a leaked authoring rule, a placeholder, an unfilled change-log row, a missing marker and a broken fence are named with their line", () => {
    const r = check([TMP], { render: false });
    expect(r.status).toBe("FAIL");
    const bad = r.files.find((f: any) => /bad\.md$/.test(f.file));
    expect(bad.findings.map((x: any) => `${x.line} ${x.rule}: ${x.text}`)).toEqual([
      "6 authoring-rule: COMPONENT NAMING FIDELITY (authoring rule for seam-generator — do not render)",
      "8 placeholder: [UPSTREAM_COMPONENT] [DOWNSTREAM_COMPONENT]",
      "10 placeholder: [YYYY-MM-DD] [ADR-NNN or —]",
      "12 placeholder: [N]ms [P]%",
      "6 vocabulary: internal name in a delivered document: seam — say Interface Contract / interface, System Runtime View, Cross-Cutting Standards, Component Specification",   // the leaked authoring rule names the seam-generator: two findings for one line, both right
      "16 mermaid/semicolon: A->>B: 1. hola; adios",
    ]);
    expect(r.files.find((f: any) => /nomarker\.md$/.test(f.file)).findings.map((x: any) => x.rule)).toEqual(["managed-marker", "template-version"]);
    expect(r.files.some((f: any) => /assets/.test(f.file))).toBe(false);
    expect(r.files.find((f: any) => /good\.md$/.test(f.file)).findings).toEqual([]);
  });

  test("every H2 and the Role Quick Index carry a SECTION anchor, in either language edition", () => {
    expect(checkFile(join(TMP, "interfaces", "anchored.md")).findings).toEqual([]);   // visible text localized, anchor English
    const f = checkFile(join(TMP, "interfaces", "unanchored.md")).findings;
    expect(f.map((x: any) => x.rule)).toEqual(["anchor", "anchor", "anchor"]);
    expect(f[0].text).toMatch(/Role Quick Index without its/);
    expect(f.slice(1).map((x: any) => x.text)).toEqual(["H2 without a SECTION anchor: Interaction", "H2 without a SECTION anchor: Entry state"]);
    expect(checkFile(join(TMP, "README.md")).findings).toEqual([]);   // the README is rendered by kit-readme.js and carries none
  });

  test("a phase is drawn once — in the catalog — and a second heading for it is the finding, identical or not", () => {
    const catalog = head() + "## Phase Catalog <!-- SECTION: Phase Catalog -->\n\n### Phase 1 — Something\n- Used by: F-01, F-04\n\n```mermaid\nsequenceDiagram\n  A->>B: 1. request\n```\n\n### Phase 4 — Other\n- Used by: F-01\n\n```mermaid\nsequenceDiagram\n  A->>B: 1. request\n  B->>C: 2. read\n```\n";
    writeFileSync(join(TMP, "catalog.md"), catalog);
    expect(checkFile(join(TMP, "catalog.md")).findings).toEqual([]);
    const same = checkFile(join(TMP, "storyboard.md")).findings;                    // phase 1 twice, byte-identical — still twice
    expect(same.map((x: any) => x.rule)).toEqual(["panel-repeated"]);
    expect(same[0].text).toMatch(/^phase 1 is drawn again — already at line \d+\. A phase is drawn once/);
    const diff = checkFile(join(TMP, "drifted.md")).findings;
    expect(diff[0].text).toMatch(/already at line \d+, and differently\./);
  });

  test("the internal vocabulary never reaches a delivered document — prose and cells are scanned, comments, fences and link targets are not", () => {
    writeFileSync(join(TMP, "vocab.md"), head() + "Changing one is a seam change.\n\n| Direction | Fields |\n|---|---|\n| Reads-only (via this seam) | x |\n\n<!-- the seam-generator wrote this: fine in a comment -->\n\n```mermaid\nflowchart TB\n  A[\"seam\"] --> B\n```\n\nSee [the contract](../interfaces/a→b.md) and the cut sheet, per the Ekonte.\n");
    const f = checkFile(join(TMP, "vocab.md")).findings.filter((x: any) => x.rule === "vocabulary");
    expect(f.map((x: any) => x.line)).toEqual([6, 10, 19]);
    expect(f[0].text).toMatch(/internal name in a delivered document: seam — say Interface Contract/);
    expect(f[2].text).toMatch(/cut sheet, ekonte/);
    writeFileSync(join(TMP, "clean.md"), head() + "Changing one is an interface change.\n\n| Reads-only (via this interface) | x |\n");
    expect(checkFile(join(TMP, "clean.md")).findings.filter((x: any) => x.rule === "vocabulary")).toEqual([]);
  });

  test("under a non-English kit, every label row is the registered label: English left behind, a free translation, a casing variant", () => {
    const es = join(TMP, "es"); mkdirSync(join(es, "handoffs", "interfaces"), { recursive: true });
    writeFileSync(join(es, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: es -->\n\n# Mesa — Arquitectura\n");
    const body = head() + "| Field | Value |\n|---|---|\n| Related edge | E-01 |\n| Arista relacionada | E-02 |\n| versión de la vista de ejecución | 4.3.1 |\n\n"
      + "## Semántica de fallos <!-- SECTION: Failure semantics -->\n\n| Condition | Upstream behaviour | Downstream behaviour |\n|---|---|---|\n| timeout | x | y |\n| tiempo de espera agotado | x | y |\n\n"
      + "## Observabilidad <!-- SECTION: Observability at the interface -->\n\n| Signal | Requirement |\n|---|---|\n| Correlation | x |\n| Correlación | x |\n";
    const file = join(es, "handoffs", "interfaces", "a→b.md"); writeFileSync(file, body);
    const f = checkFile(file).findings.filter((x: any) => /^row-label/.test(x.rule)).map((x: any) => `${x.rule} ${x.line}`);
    // `timeout` is a technical term kept English — registered as itself, no finding
    expect(f).toEqual(["row-label-language 8", "row-label-unregistered 10", "row-label-unregistered 17", "row-label-language 23"]);
    expect(checkFile(file).findings.find((x: any) => x.line === 17).text).toContain("one of: timeout · downstream no disponible · poison message");
    // --fix writes the registered label for an English label and a casing variant; a free translation stays a finding
    const r = check([file], { render: false, fix: true });
    expect(r.fixed).toEqual([{ file, labels: 3 }]);
    expect(readFileSync(file, "utf8")).toContain("| Arista relacionada | E-01 |\n| Arista relacionada | E-02 |\n| Versión de la Vista de Ejecución | 4.3.1 |");
    expect(r.files[0].findings.filter((x: any) => /^row-label/.test(x.rule)).map((x: any) => x.line)).toEqual([17]);
    // English: the template label itself; a Spanish label in an English kit is the finding
    expect(checkFile(file, { lang: "en" }).findings.filter((x: any) => x.rule === "row-label-unregistered").length).toBeGreaterThan(0);
    writeFileSync(join(TMP, "en.md"), body);   // no kit part (not under interfaces/ …) and no ARCHITECTURE.md above TMP → English → exempt
    expect(checkFile(join(TMP, "en.md")).findings.filter((x: any) => /^row-label/.test(x.rule))).toEqual([]);
    expect([...lexicon()]).toEqual(expect.arrayContaining(["Related edge", "Correlation", "Owned by upstream", "Architecture Version"]));
    expect([...lexicon()].some((l: string) => /^\*\*|^\[/.test(l))).toBe(false);   // role names and placeholders are not labels
  });

  test("the CLI exits 1 on a failing kit and 0 on a clean file", () => {
    const b = Bun.spawnSync(["bun", SCRIPT, TMP, "--no-render"], { stdout: "pipe", stderr: "pipe" });
    expect(b.exitCode).toBe(1);
    expect(b.stdout.toString()).toMatch(/bad\.md: FAIL\n {4}✗ line 6 \[authoring-rule\]/);
    expect(b.stdout.toString().trim()).toMatch(/\nmermaid: (skipped — mermaid-cli not installed|mmdc)\nFAIL$/);
    const g = Bun.spawnSync(["bun", SCRIPT, join(TMP, "interfaces", "good.md"), "--no-render"], { stdout: "pipe", stderr: "pipe" });
    expect(g.exitCode).toBe(0);
    expect(g.stdout.toString()).toMatch(/good\.md: ok\n/);
  });
});

describe("interaction label — an Interface Contract against its seam payload", () => {
  const P = join(TMP, "proj");
  const contract = (name: string, rows: string, style = "Style") => { const f = join(P, "handoffs", "interfaces", name); writeFileSync(f, head() + `## Interaction <!-- SECTION: Interaction -->\n\n| Aspect | Value |\n|--------|-------|\n| ${style} | sync |\n${rows}`); return f; };
  const rulesEs = (f: string) => checkFile(f, { lang: "es" }).findings.map((x: any) => x.rule);
  const payload = (name: string, fm: string) => writeFileSync(join(P, ".cache", "sa-skills", "handoff-payloads", "seams", name), `---\nupstream: a\ndownstream: b\n${fm}---\n\n## Integration Row\n`);
  const rules = (f: string) => checkFile(f, { lang: "en" }).findings.map((x: any) => x.rule);
  beforeAll(() => { mkdirSync(join(P, "handoffs", "interfaces"), { recursive: true }); mkdirSync(join(P, ".cache", "sa-skills", "handoff-payloads", "seams"), { recursive: true }); writeFileSync(join(P, "ARCHITECTURE.md"), "# X\n"); });

  test("governed: the row carries the payload's label verbatim — missing or different fails", () => {
    payload("a→b.md", 'design_language: governed\ninteraction_label: "HTTPS/JSON [Command]"\n');
    expect(seamPayloadOf(join(P, "handoffs", "interfaces", "a→b.md"))).toMatchObject({ mode: "governed", label: "HTTPS/JSON [Command]" });
    expect(rules(contract("a→b.md", "| Interaction label | HTTPS/JSON [Command] |\n"))).toEqual([]);
    expect(rulesEs(contract("a→b.md", "| Etiqueta de interacción | `HTTPS/JSON [Command]` |\n", "Estilo"))).toEqual([]);   // the Spanish row, the value in a code span
    expect(rules(contract("a→b.md", "| Transport | HTTPS |\n"))).toEqual(["interaction-label-missing"]);
    expect(rules(contract("a→b.md", "| Interaction label | HTTPS/JSON [Query] |\n"))).toEqual(["interaction-label-drift"]);
  });

  test("names: the H1 and visible text carry the canonical names, never the slugs; --fix writes them, code and links keep the slug", () => {
    writeFileSync(join(P, ".cache", "sa-skills", "handoff-payloads", "seams", "web-app→hub-api.md"), '---\nupstream: web-app\ndownstream: hub-api\nupstream_name: "Web App"\ndownstream_name: "Hub API"\n---\n');
    const f = join(P, "handoffs", "interfaces", "web-app→hub-api.md");
    writeFileSync(f, "# Interface Contract: web-app → hub-api\n\n<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n<!-- TEMPLATE_VERSION: 4.3.1 -->\n\nThe web-app calls the hub-api; see `hub-api`, [hub-api](../components/02-hub-api.md) and web-app→hub-api.md.\n");
    expect(rules(f)).toEqual(["title-names", "component-slug", "component-slug"]);
    const r = check([f], { render: false, fix: true, lang: "en" });
    expect(r.fixed).toEqual([{ file: f, labels: 0, names: 3 }]);
    const out = readFileSync(f, "utf8");
    expect(out.split("\n")[0]).toBe("# Interface Contract: Web App → Hub API");
    expect(out).toContain("The Web App calls the Hub API; see `hub-api`, [hub-api](../components/02-hub-api.md) and web-app→hub-api.md.");
    expect(rules(f)).toEqual([]);
  });

  test("fallback: no row; a payload from before 8.110.0 or none at all: not checked", () => {
    payload("c→d.md", "design_language: fallback\n");
    expect(rules(contract("c→d.md", "| Interaction label | HTTPS/JSON [Command] |\n"))).toEqual(["interaction-label-ungoverned"]);
    expect(rules(contract("c→d.md", "| Transport | HTTPS |\n"))).toEqual([]);
    payload("e→f.md", "doc_language: en\n");
    expect(rules(contract("e→f.md", "| Transport | HTTPS |\n"))).toEqual([]);
    expect(rules(contract("g→h.md", "| Transport | HTTPS |\n"))).toEqual([]);
  });
});

describe("version-stale and interface-missing — a part held to its architecture and to its security obligations", () => {
  const { tmpdir } = require("os");
  const { mkdtempSync } = require("fs");
  let root = "";
  const spec = (version: string, position: string) => `# Component Specification — Hub API\n\n<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n<!-- TEMPLATE_VERSION: 4.3.1 -->\n| Field | Value |\n|-------|-------|\n| Component | Hub API |\n| Architecture Version | ${version} |\n\n## 2. Position <!-- SECTION: Position -->\n\n${position}\n\n## 3. Contracts owned <!-- SECTION: Contracts Owned -->\n\nNone.\n`;
  const security = `# Hub API — Security Obligations\n\n<!-- managed by sa-skills:architecture-dev-handoff — rendered by security-obligations.js from the architecture docs and the security analyses; fix a value there and re-run, never here -->\n\n## Inbound — who may call <!-- SECTION: Inbound -->\n\n| Interface | Caller | Protocol | Authentication | Source |\n|---|---|---|---|---|\n| I-01 | Web App | HTTPS/JSON | OAuth 2.0 | STRIDE TB-01 |\n| I-07 | Operations Desk | HTTPS | [NOT DOCUMENTED] | docs/05 |\n\n## Outbound — credentials it presents <!-- SECTION: Outbound -->\n\n| Interface | Target | Protocol | Authentication | Source |\n|---|---|---|---|---|\n| I-02 | Order DB | JDBC | mTLS | STRIDE TB-02 |\n\n## Threats (STRIDE) <!-- SECTION: Threats -->\n\nNone. I-99 in prose is not an interface of the component.\n`;
  const contract = (id: string) => `# Interface Contract: Web App → Hub API\n\n<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n<!-- TEMPLATE_VERSION: 4.3.1 -->\n\n| Integration | ${id} |\n`;
  const kit = (version: string, position: string) => {
    root = mkdtempSync(join(tmpdir(), "kit-check-"));
    mkdirSync(join(root, "handoffs", "components"), { recursive: true }); mkdirSync(join(root, "handoffs", "interfaces"), { recursive: true }); mkdirSync(join(root, "handoffs", "assets", "02-hub-api"), { recursive: true });
    writeFileSync(join(root, "ARCHITECTURE.md"), "<!-- ARCHITECTURE_VERSION: 2.0.0 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk\n");
    writeFileSync(join(root, "handoffs", "components", "02-hub-api.md"), spec(version, position));
    writeFileSync(join(root, "handoffs", "interfaces", "web-app→hub-api.md"), contract("I-01"));
    writeFileSync(join(root, "handoffs", "assets", "02-hub-api", "security.md"), security);
    return join(root, "handoffs");
  };
  const findingsOf = (dir: string) => check([dir], { render: false }).files.find((f: any) => /02-hub-api\.md$/.test(f.file)).findings;
  afterAll(() => { if (root) rmSync(root, { recursive: true, force: true }); });

  test("a specification cut before the release carries the old version: version-stale, at its row", () => {
    const dir = kit("1.9.0", "- [web-app→hub-api](../interfaces/web-app→hub-api.md)\n- I-02 to Order DB\n- I-07 — inbound from Operations Desk · HTTPS — no Interface Contract; pending, it fails closed");
    const f = findingsOf(dir);
    expect(f.map((x: any) => x.rule)).toEqual(["version-stale"]);
    expect(f[0]).toMatchObject({ line: 8 });
    expect(f[0].text).toMatch(/^Architecture Version 1\.9\.0 — the architecture is 2\.0\.0; cut the payloads after the release/);
    rmSync(root, { recursive: true, force: true });
  });

  test("an interface the security obligations list and § 2 drops: interface-missing; a linked contract that names its I-nn covers it", () => {
    const dir = kit("2.0.0", "- [web-app→hub-api](../interfaces/web-app→hub-api.md)\n- I-02 to Order DB");
    const f = findingsOf(dir);
    expect(f.map((x: any) => x.rule)).toEqual(["interface-missing"]);   // I-01 is the linked contract's, I-02 is named; I-99 is prose outside the tables
    expect(f[0].text).toMatch(/^I-07 \(inbound, from Operations Desk\) — the security obligations list it; § 2 Position names neither it nor an Interface Contract carrying it/);
    expect(f[0].line).toBe(10);
    rmSync(root, { recursive: true, force: true });
  });

  test("a Spanish version row and a version written with a v; a part outside a project is not version-checked", () => {
    const dir = kit("2.0.0", "I-01, I-02, I-07");
    const p = join(dir, "components", "02-hub-api.md");
    writeFileSync(join(root, "ARCHITECTURE.md"), "<!-- ARCHITECTURE_VERSION: 2.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Order Desk\n");
    writeFileSync(p, readFileSync(p, "utf8").replace("| Architecture Version | 2.0.0 |", "| Versión de la arquitectura | v2.0.0 |").replace("| Component | Hub API |", "| Componente | Hub API |"));
    expect(findingsOf(dir)).toEqual([]);
    writeFileSync(p, readFileSync(p, "utf8").replace("v2.0.0", "1.0.0"));
    expect(findingsOf(dir).map((x: any) => x.rule)).toEqual(["version-stale"]);
    rmSync(join(root, "ARCHITECTURE.md"));
    expect(findingsOf(dir).map((x: any) => x.rule)).not.toContain("version-stale");
    rmSync(root, { recursive: true, force: true });
  });
});
