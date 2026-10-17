/**
 * mermaid-check.js — the diagram gate as code: the forbidden-pattern lint per block and per diagram, the
 * governed-mode warning, the render layer's skip when mermaid-cli is absent, the CLI's exit codes.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { blocksOf, lint, check } = require("../scripts/mermaid-check.js");
const SCRIPT = join(__dirname, "..", "scripts", "mermaid-check.js");

const TMP = join(__dirname, ".temp-mermaid-check");
const fence = (body: string) => "```mermaid\n" + body + "\n```";
const one = (heading: string, body: string) => `#### Diagram: ${heading}\n\n${fence(body)}\n`;
const lintOf = (heading: string, body: string, governed = false) => lint(blocksOf(one(heading, body))[0], { governed });
const rules = (r: any) => r.findings.map((f: any) => f.rule);

beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true }); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("mermaid-check", () => {
  test("blocks carry their diagram heading, line and kind — a multi-line %%{ init }%% directive is not the first statement", () => {
    const src = `# Doc\n\n#### Diagram: Logical View\n\n${fence("%%{\n  init: { 'theme': 'base' }\n}%%\nflowchart TB\n  A --> B")}\n\n## Other\n\n${fence("sequenceDiagram\n  A->>B: 1. x")}\n`;
    const b = blocksOf(src);
    expect(b.map((x: any) => [x.diagram, x.startLine])).toEqual([["Logical View", 5], ["block 2", 15]]);
    expect(lint(b[0], {}).kind).toBe("flowchart");
    expect(lint(b[1], {}).kind).toBe("sequenceDiagram");
  });

  test("a `;` inside a sequence message or Note fails; a `;` closing a flowchart class line does not", () => {
    expect(rules(lintOf("Flujo 7", "sequenceDiagram\n  participant A\n  A->>B: 1. hola\n  Note over A,B: Tronco compartido con la fase 6; aqui se bifurca"))).toEqual(["semicolon"]);
    expect(rules(lintOf("Flujo 7", "sequenceDiagram\n  A->>B: 1. paso; otro"))).toEqual(["semicolon"]);
    expect(rules(lintOf("Flujo 7", "sequenceDiagram\n  A->>B: 1. paso, otro\n  Note over A,B: sin punto y coma"))).toEqual([]);
    expect(rules(lintOf("Detailed View", "flowchart TB\n  classDef unit fill:#d6ecff;\n  A[\"x\"]\n  class A unit;"))).toEqual([]);
    expect(rules(lintOf("Detailed View", "flowchart TB\n  classDef unit fill:#d6ecff;\n  A[\"x; y\"]\n  class A unit;"))).toEqual(["semicolon"]);
    expect(rules(lintOf("Detailed View", "flowchart TB\n  classDef unit fill:#fff;\n  A[\"x\"] -->|\"a; b\"| B[\"y\"]\n  class A,B unit;"))).toEqual(["semicolon"]);
    expect(rules(lintOf("C4", "C4Container\n  Rel(a, b, \"Uses; reads\", \"HTTPS/JSON [Query]\")"))).toEqual(["semicolon"]);
  });

  test("HTML tags fail, <br/> only warns; emoji, a pipe in node text and an odd quote fail", () => {
    const r = lintOf("Detailed View", "flowchart TB\n  classDef unit fill:#fff;\n  A[\"Web <b>App</b>\"]\n  B[\"Base<br/>Local\"]\n  C[\"Cache 🔴\"]\n  D[\"a | b\"]\n  E[\"unbalanced]\n  class A,B,C,D,E unit;");
    expect(rules(r).sort()).toEqual(["emoji", "html-tag", "pipe-in-node", "quotes"].sort());
    expect(r.warnings.map((w: any) => w.rule)).toEqual(["br-tag"]);
  });

  test("Diagram 1 and 4 rules: unclassed elements, the retired palette, subgraph-id edges on D4, node-to-node edges on D1", () => {
    const d4 = lintOf("Detailed View", "flowchart TB\n  classDef unit fill:#d6ecff;\n  classDef channel fill:#4A90E2;\n  subgraph L1[\"Canales\"]\n    APP[\"App\"]\n  end\n  DB[(\"Store\")]\n  L1 --> DB\n  class APP unit;");
    expect(rules(d4).sort()).toEqual(["retired-palette", "subgraph-edge", "unclassed", "unclassed"].sort());
    expect(d4.findings.filter((f: any) => f.rule === "unclassed").map((f: any) => f.text).sort()).toEqual(["DB", "L1"]);
    const d1 = lintOf("Logical View", "flowchart TB\n  classDef zone fill:none;\n  classDef unit fill:#fff;\n  subgraph L1[\"Canales\"]\n    APP[\"App\"]\n  end\n  subgraph L2[\"Exp\"]\n    MFA[\"MFA\"]\n  end\n  L1 -->|\"HTTPS\"| L2\n  APP --> MFA\n  class L1,L2 zone;\n  class APP,MFA unit;");
    expect(rules(d1)).toEqual(["node-edge"]);
    expect(rules(lintOf("Logical View", "flowchart TB\n  classDef zone fill:none;\n  subgraph L1[\"Canales\"]\n  end\n  subgraph L2[\"Exp\"]\n  end\n  L1 -->|\"HTTPS\"| L2\n  class L1,L2 zone;"))).toEqual([]);
    // a name inside a quoted label is not a node
    expect(rules(lintOf("Detailed View", "flowchart TB\n  classDef unit fill:#fff;\n  GG[\"Captura CDC (Core)\"]\n  class GG unit;"))).toEqual([]);
    // other diagrams do not carry the D1 / D4 rules
    expect(rules(lintOf("Infrastructure", "flowchart TB\n  classDef channel fill:#4A90E2;\n  A[\"x\"]"))).toEqual([]);
  });

  test("governed mode warns on §12 constructs in a sequence, never fails on them", () => {
    const r = lintOf("Flujo 1", "sequenceDiagram\n  A->>B: 1. paso\n  Note over A,B: nota\n  loop cada 5 s\n    A->>B: 2. otro\n  end", true);
    expect(rules(r)).toEqual([]);
    expect(r.warnings.map((w: any) => w.rule)).toEqual(["governed-sequence", "governed-sequence"]);
    expect(lintOf("Flujo 1", "sequenceDiagram\n  Note over A,B: nota", false).warnings).toEqual([]);
  });

  test("check() fails the file on any finding and reports the render layer as skipped without mermaid-cli; the CLI exits 1 / 0 / 2", () => {
    const bad = join(TMP, "bad.md"), good = join(TMP, "good.md");
    writeFileSync(bad, one("Flujo 7", "sequenceDiagram\n  Note over A,B: uno; dos"));
    writeFileSync(good, one("Flujo 1", "sequenceDiagram\n  A->>B: 1. uno"));
    const r = check([bad, good], { render: false, governed: false });
    expect(r.status).toBe("FAIL");
    expect(r.files[0].blocks[0].findings[0]).toMatchObject({ rule: "semicolon", line: 5 });
    expect(r.files[1].blocks[0].findings).toEqual([]);
    const skipped = check([good], { governed: false, render: undefined });
    expect(["skipped — mermaid-cli not installed", "mmdc"]).toContain(skipped.render);
    const b = Bun.spawnSync(["bun", SCRIPT, bad, "--no-render"], { stdout: "pipe", stderr: "pipe" });
    expect(b.exitCode).toBe(1);
    expect(b.stdout.toString()).toMatch(/Flujo 7 \(sequenceDiagram, line 3\): FAIL\n {4}✗ line 5 \[semicolon\]: Note over A,B: uno; dos/);
    expect(b.stdout.toString()).toMatch(/\nFAIL — fix every block above/);
    const g = Bun.spawnSync(["bun", SCRIPT, good, "--no-render"], { stdout: "pipe", stderr: "pipe" });
    expect(g.exitCode).toBe(0);
    expect(g.stdout.toString().trim()).toMatch(/lint ✓\nPASS$/);
    expect(Bun.spawnSync(["bun", SCRIPT, join(TMP, "nope.md")], { stdout: "pipe", stderr: "pipe" }).exitCode).toBe(2);
  });

  test("a directory argument expands to the Markdown files under it instead of crashing (8.102.0)", () => {
    const dir = join(TMP, "proj");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "a.md"), "# A\n\n```mermaid\nflowchart TB\n  A --> B\n```\n");
    const r = check([dir], { render: false, governed: false });
    expect(r.files.map((f: any) => f.file || f.path || f)).toHaveLength(1);
    expect(r.status).toBe("PASS");
  });
});
