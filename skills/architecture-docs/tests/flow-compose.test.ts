/**
 * flow-compose.js — every flow's end-to-end sequence derived from the phases it declares: steps relabelled
 * `N.M`, participants unioned by display name across aliases, the palette directive once, a hand-authored
 * sequence the derivation cannot replace kept rather than overwritten, `--check` as the drift gate.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { derive, compose, MARK } = require("../scripts/flow-compose.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check } = require("../scripts/flow-check.js");

const TMP = join(__dirname, ".temp-flow-compose");
const DIR = "%%{\n  init: { 'theme': 'base' }\n}%%";
const panel = (parts: [string, string][], msgs: string[]) => "```mermaid\n" + DIR + "\nsequenceDiagram\n" + parts.map(([a, n]) => `  participant ${a} as ${n}`).join("\n") + "\n" + msgs.map((m) => "  " + m).join("\n") + "\n```";

const doc = (o: { phasesOf2: string; e2e?: string; tail?: string }) => `# Flows

### Flow Inventory <!-- SECTION: Flow Inventory -->

| Flow | Trigger | Use Case | Latency Target |
|---|---|---|---|
| 1. Open the desk | The user | UC-01 | ≤ 1 s |
| 2. Settle the order | A payment | UC-02 | ≤ 5 s |

### Phase Catalog <!-- SECTION: Phase Catalog -->

#### Phase 1 — Authenticate

${panel([["WEB", "Web App"], ["AUT", "Auth Service"]], ["WEB->>AUT: 1. Presents the token", "AUT-->>WEB: Session"])}

#### Phase 2 — Read the ledger

${panel([["APP", "Web App"], ["HUB", "Hub API"]], ["APP->>HUB: 1. Asks for the ledger", "HUB-->>APP: Rows", "APP->>APP: 2. Renders"])}

#### Phase 5 — Settle

${panel([["HUB", "Hub API"], ["PAY", "Payments"]], ["HUB->>PAY: 1. Debits", "PAY-->>HUB: Receipt"])}

### Use Case Resolutions <!-- SECTION: Use Case Resolutions -->

#### Flow 1 — Open the desk

**Phases**: 1 → 2 (synchronous).

#### Flow 2 — Settle the order

${o.phasesOf2}
${o.e2e === undefined ? "" : `
### End-to-End Wire Sequences <!-- SECTION: End-to-End Wire Sequences -->

${o.e2e}
`}${o.tail || ""}`;

const write = (name: string, body: string) => {
  const root = join(TMP, name);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: en -->\n\n# Desk — Architecture\n");
  writeFileSync(join(root, "docs", "04-data-flow-patterns.md"), body);
  return root;
};
const fenceOf = (md: string, flow: string) => (md.split(`Flow ${flow} —`)[1] || "").split("```mermaid\n")[1]?.split("\n```")[0] || "";

beforeAll(() => rmSync(TMP, { recursive: true, force: true }));
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("flow-compose", () => {
  test("a flow's sequence is its phases concatenated, steps `N.M`, returns carried as they are, the directive once", async () => {
    const r = derive(write("basic", doc({ phasesOf2: "**Phases**: 5 → 2 (synchronous)." })));
    const f1 = fenceOf(r.sectionMd, "1");
    expect(f1.split(DIR).length - 1).toBe(1);                                      // the palette directive, from the first panel, once
    expect(f1).toMatch(/WEB->>AUT: 1\.1 Presents the token\n {2}AUT-->>WEB: Session\n {2}WEB->>HUB: 2\.1 Asks for the ledger\n {2}HUB-->>WEB: Rows\n {2}WEB->>WEB: 2\.2 Renders$/);
    expect(r.flows[0]).toMatchObject({ code: "F-01", messages: 5, participants: 3 });
    // non-monotonic on purpose: F-02 runs phase 5 then phase 2, and the labels say so
    expect(fenceOf(r.sectionMd, "2")).toMatch(/HUB->>PAY: 5\.1 Debits[\s\S]*APP->>APP: 2\.2 Renders/);
    expect(r.sectionMd).toMatch(/^### End-to-End Wire Sequences <!-- SECTION: End-to-End Wire Sequences -->\n\n<!-- DERIVED: flow-compose\.js/m);
    expect(r.sectionMd).toMatch(/#### Flow 1 — Open the desk \(full wire sequence\)\n\n\*Derived from phases 1 → 2 of the Phase Catalog\.\*/);
  });

  test("participants are unioned by display name — `WEB` and `APP` are one Web App, and the later alias is rewritten in the messages", async () => {
    const r = derive(write("alias", doc({ phasesOf2: "**Phases**: 1 → 2." })));
    const f1 = fenceOf(r.sectionMd, "1");
    expect(f1.match(/participant \S+ as Web App/g)!.length).toBe(1);
    expect(f1).toMatch(/participant WEB as Web App/);
    expect(f1).not.toMatch(/\bAPP\b/);                                             // every APP became WEB
    expect(f1).toMatch(/WEB->>HUB: 2\.1 Asks for the ledger/);
  });

  test("a hand-authored sequence the derivation cannot replace is kept, never overwritten with a gap marker", async () => {
    const hand = "#### Flow 2 — Settle the order (full wire sequence)\n\n```mermaid\nsequenceDiagram\n  A->>B: drawn by a person\n```";
    const root = write("kept", doc({ phasesOf2: "Runs phases **5 → 2** — in prose, which the ledger cannot read.", e2e: hand }));
    const r = derive(root);
    expect(r.flows[1]).toMatchObject({ code: "F-02", gap: "no-phases", kept: true });
    expect(fenceOf(r.sectionMd, "2")).toBe("sequenceDiagram\n  A->>B: drawn by a person");
    expect(r.sectionMd).toMatch(/\*Hand-authored — kept: the flow declares no phases to derive from \(see flow-check\)\.\*/);
    // phases declared but none drawn — the other reason to keep, and the line must say THAT, not "no phases"
    const rp = derive(write("kept-nopanel", doc({ phasesOf2: "**Phases**: 9.", e2e: hand })));   // phase 9 is not in the catalog
    expect(rp.flows[1]).toMatchObject({ gap: "no-panels", kept: true });
    expect(rp.sectionMd).toMatch(/kept: the phases this flow declares carry no sequenceDiagram in the Phase Catalog/);
    expect(rp.sectionMd).not.toMatch(/Flow 2[^]*declares no phases to derive/);
    // and with nothing to keep, the gap is said, not invented around
    const r2 = derive(write("gap", doc({ phasesOf2: "Prose only." })));
    expect(r2.flows[1].gap).toBe("no-phases"); expect(r2.flows[1].kept).toBeUndefined();
    expect(r2.sectionMd).toMatch(/#### Flow 2 — Settle the order \(full wire sequence\)\n\n\[NOT DOCUMENTED — the flow declares no phases/);
  });

  test("the section is created after Use Case Resolutions when absent, replaced in place when present, and the file is then in sync with itself", async () => {
    const root = write("splice", doc({ phasesOf2: "**Phases**: 5.", tail: "\n### Validation\n\n- [ ] kept below\n" }));
    const r1 = derive(root);
    expect(r1.action).toBe("created"); expect(r1.changed).toBe(true);
    writeFileSync(join(root, "docs", "04-data-flow-patterns.md"), r1.next);
    const md = readFileSync(join(root, "docs", "04-data-flow-patterns.md"), "utf-8");
    expect(md.indexOf("### End-to-End Wire Sequences")).toBeGreaterThan(md.indexOf("### Use Case Resolutions"));
    expect(md.indexOf("### End-to-End Wire Sequences")).toBeLessThan(md.indexOf("### Validation"));   // the tail survives, after it
    expect(md).toMatch(/- \[ \] kept below/);
    const r2 = derive(root);
    expect(r2.action).toBe("replaced"); expect(r2.changed).toBe(false);                            // idempotent: the derivation of a derivation is itself
    expect((await check(root)).status).toBe("PASS");                                                       // and flow-check has nothing to disagree about
  });

  test("with no DOC_LANGUAGE marker yet, the language is docs/04's own, and an existing section keeps its visible heading", async () => {
    // Workflow 1 stamps ARCHITECTURE.md last; at compose time only docs/04 exists — a Spanish catalog heading means Spanish output
    const hand2 = "#### Flow 2 — Settle the order (full wire sequence)\n\n```mermaid\nsequenceDiagram\n  A->>B: old\n```";
    const es = doc({ phasesOf2: "**Phases**: 5.", e2e: hand2 }).replace("### Phase Catalog <!-- SECTION: Phase Catalog -->", "### Catálogo de Fases <!-- SECTION: Phase Catalog -->").replace("### End-to-End Wire Sequences <!-- SECTION: End-to-End Wire Sequences -->", "### Secuencias Extremo a Extremo <!-- SECTION: End-to-End Wire Sequences -->");
    const root = write("nomarker", es); rmSync(join(root, "ARCHITECTURE.md"));
    const r = derive(root);
    expect(r.lang).toBe("es");
    expect(r.sectionMd).toMatch(/^### Secuencias Extremo a Extremo <!-- SECTION: End-to-End Wire Sequences -->/);
    expect(r.sectionMd).toMatch(/#### Flujo 1 — Open the desk \(secuencia completa\)\n\n\*Derivada de las fases 1 → 2 del Catálogo de Fases\.\*/);
    // and once the marker lands, --check must not see drift for that reason
    writeFileSync(join(root, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: es -->\n\n# Mesa\n");
    writeFileSync(join(root, "docs", "04-data-flow-patterns.md"), r.next);
    expect(derive(root).changed).toBe(false);
  });

  test("compose() is the one rule: no phases → nothing, a phase with no panel is named, counts are exact", async () => {
    const catalog = { "1": { n: "1", fence: "sequenceDiagram\n  participant A as Alpha\n  A->>A: 1. x\n  A->>A: 2. y" }, "9": { n: "9", fence: null } };
    const c = compose(["1", "9"], catalog);
    expect(c).toMatchObject({ messages: 2, participants: 1, missing: ["9"] });
    expect(c.fence).toBe("sequenceDiagram\n  participant A as Alpha\n  A->>A: 1.1 x\n  A->>A: 1.2 y");
    expect(compose([], catalog).messages).toBe(0);
    expect(MARK).toMatch(/^<!-- DERIVED: flow-compose\.js/);
  });

  test("a docs/04 without a Phase Catalog is refused — there is nothing to derive from, and its one statement stands", async () => {
    expect(() => derive(write("legacy", "# Flows\n\n## Flow 1: Load\n\nprose\n"))).toThrow(/has no Phase Catalog — nothing to derive from/);
  });
});
