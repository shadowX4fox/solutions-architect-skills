/**
 * flow-check.js — docs/04 states every flow twice (a phase list and a "complete" end-to-end sequence)
 * and the two must agree. The heading-level test is the important one: pinning the levels reported
 * three flows of a real project as having no sequence when the section was simply an H2.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check } = require("../scripts/flow-check.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { collect } = require("../../../scripts/shared/arch-facts.js");

const TMP = join(__dirname, ".temp-flow-check");
const seq = (...parts: string[]) => "```mermaid\nsequenceDiagram\n" + parts.map((p) => `  participant ${p.slice(0, 3).toUpperCase()} as ${p}`).join("\n") + "\n  A->>B: 1. does a thing\n```";

/** One docs/04 whose section and block heading levels are parameterised, so the same corpus can be written both ways. */
const doc = (o: { sec: string; blk: string; flows: string; phases: string; e2e: string }) => `# Flows

${o.sec} Flow Inventory <!-- SECTION: Flow Inventory -->

| Flow | Trigger | Use Case | Latency Target |
|---|---|---|---|
| 1. Open the desk | The user | UC-01 | ≤ 1 s |
| 2. Settle the order | A payment | UC-02 | ≤ 5 s |

${o.sec} Phase Catalog <!-- SECTION: Phase Catalog -->

| # | Phase | Owner |
|---|---|---|
| 1 | Authenticate | Web App |
| 2 | Read the ledger | Hub API |
| 3 | Never used | Reporter |

${o.blk} Phase 1 — Authenticate

${seq("Web App", "Auth Service")}

${o.blk} Phase 2 — Read the ledger

${seq("Web App", "Hub API")}

${o.blk} Phase 3 — Never used

${seq("Reporter")}

${o.sec} Use Case Resolutions <!-- SECTION: Use Case Resolutions -->

${o.blk} Flow 1 — Open the desk

**Use case**: UC-01.
${o.phases}

${o.blk} Flow 2 — Settle the order

**Use case**: UC-02.
${o.phases}

${o.sec} End-to-End Wire Sequences <!-- SECTION: End-to-End Wire Sequences -->

${o.e2e}
`;

const write = (name: string, body: string) => {
  const root = join(TMP, name);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "ARCHITECTURE.md"), "<!-- DOC_LANGUAGE: en -->\n\n# Desk — Architecture\n");
  writeFileSync(join(root, "docs", "04-data-flow-patterns.md"), body);
  return root;
};

const clean = { sec: "###", blk: "####", flows: "", phases: "**Phases**: 1 → 2 (synchronous).",
  e2e: `#### Flow 1 — Open the desk (full sequence)\n\n${seq("Web App", "Auth Service", "Hub API")}\n\n#### Flow 2 — Settle the order (full sequence)\n\n${seq("Web App", "Auth Service", "Hub API")}\n` };

let ok: string, shallow: string, absent: string, missing: string, undeclared: string, legacy: string;
beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  ok = write("ok", doc(clean));
  // the same corpus with every heading one level up — the shape a second real project uses
  shallow = write("shallow", doc({ ...clean, sec: "##", blk: "###", e2e: clean.e2e.replace(/^#### /gm, "### ") }));
  // flow 2's sequence never reaches the Hub API, but flow 2 declares phase 2
  absent = write("absent", doc({ ...clean, e2e: clean.e2e.replace(new RegExp(`(Flow 2[^]*?)${"Hub API"}`), "$1Auth Service") }));
  missing = write("missing", doc({ ...clean, e2e: clean.e2e.split("#### Flow 2")[0] }));
  undeclared = write("undeclared", doc({ ...clean, phases: "The flow runs phases **1 → 2** in prose, with no labelled line." }));
  legacy = write("legacy", "# Flows\n\n## Flow 1: Load\n\nProse only, no inventory and no catalog.\n");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const rules = (r: any) => r.flows.flatMap((f: any) => f.findings.map((x: any) => `${f.code}/${x.rule}`));

describe("flow-check", () => {
  test("a docs/04 whose two statements agree passes, and names the flows by the id the Runtime View shows", async () => {
    const r = await check(ok);
    expect(r.status).toBe("PASS");
    expect(r.flows.map((f: any) => f.code)).toEqual(["F-01", "F-02"]);
    expect(r.flows[0].phases).toEqual(["1", "2"]);
    expect(rules(r)).toEqual([]);
  });

  test("the heading level is read from the document, never pinned — the same corpus one level up gives the same verdict", async () => {
    const deep = await check(ok), up = await check(shallow);
    expect(up.status).toBe(deep.status);
    expect(rules(up)).toEqual(rules(deep));
    expect(up.flows.map((f: any) => f.phases)).toEqual(deep.flows.map((f: any) => f.phases));
  });

  test("a phase the sequence does not contain is a finding that names the missing participant and refuses to pick a side", async () => {
    const r = await check(absent);
    expect(rules(r)).toEqual(["F-02/phase-absent"]);
    const f = r.flows[1].findings[0];
    expect(f.text).toMatch(/phase 2 \(Read the ledger\) is not in the end-to-end sequence — it names "Hub API"/);
    expect(f.why).toMatch(/Either the flow does not run that phase.*or the sequence stops short/);
  });

  test("a flow with no end-to-end sequence at all is a finding; a block that says it draws none is a warning", async () => {
    expect(rules(await check(missing))).toEqual(["F-02/sequence-missing"]);
    const declared = write("declared", doc({ ...clean, e2e: clean.e2e.replace(/#### Flow 2 — Settle the order \(full sequence\)[^]*/, "#### Flow 2 — Settle the order (no wire sequence in this domain)\n") }));
    const r = await check(declared);
    expect(rules(r)).toEqual([]);
    expect(r.warnings.map((w: any) => w.rule)).toContain("sequence-declared-absent");
  });

  test("a flow whose composition is prose is reported — an unreadable phase list makes the check blind, not clean", async () => {
    const r = await check(undeclared);
    expect(rules(r)).toEqual(["F-01/phases-undeclared", "F-02/phases-undeclared"]);   // the label is what the ledger reads; prose holding the same digits is not
    expect(r.flows[1].findings[0].why).toMatch(/`\*\*Phases\*\*: 1 → 2 → 4` line/);
  });

  test("prose after the phase list on a **Phases** line is a finding — a short mode in parentheses is not", async () => {
    const hidden = write("hidden", doc({ ...clean, phases: "**Phases**: 1 → 2 (synchronous). Until 2026-09-11 this flow ran a third phase." }));
    const r = await check(hidden);
    expect(r.status).toBe("FAIL");
    expect((r.phaseFindings || []).map((x: any) => x.rule)).toEqual(["phases-prose", "phases-prose"]);   // the line appears in both flow blocks
    expect(r.phaseFindings[0].text).toMatch(/"Until 2026-09-11 this flow ran a third phase\."/);
    const long = write("longparen", doc({ ...clean, phases: "**Phases**: 1 → 2 (phase 1 runs days earlier and the data team runs it by hand every month)." }));
    expect(((await check(long)).phaseFindings || []).map((x: any) => x.rule)).toContain("phases-prose");
    expect(((await check(ok)).phaseFindings || []).filter((x: any) => x.rule === "phases-prose")).toEqual([]);
  });

  test("a phase no flow declares and a phase with no diagram are warnings, once each", async () => {
    const r = await check(ok);
    expect(r.warnings.filter((w: any) => w.rule === "phase-orphan").map((w: any) => w.text)).toEqual([
      expect.stringMatching(/phase 3 \(Never used\) is declared by no flow/),
    ]);
  });

  test("a phase with no sequenceDiagram is a finding — the panel is what every sequence derives from", async () => {
    const root = write("undrawn", doc(clean).replace("#### Phase 3 — Never used\n\n" + seq("Reporter"), "#### Phase 3 — Never used\n\n**Hops**: Reporter\n\nNo panel here."));
    const r = await check(root);
    expect(r.status).toBe("FAIL");
    expect(rules(r)).toEqual([]);                                                                 // no flow-level finding: the flows' own phases are drawn
    expect(r.phaseFindings.map((x: any) => x.rule)).toEqual(["phase-undrawn"]);
    expect(r.phaseFindings[0].text).toMatch(/phase 3 \(Never used\) carries no sequenceDiagram — the panel is the source/);
  });

  test("a participant name no judge has answered is undecided — compared as written, listed with the worksheet, never read as an alias", async () => {
    // phase 2's panel spells the Hub API "Hub"; only the judge may read it as the component — until it answers, the name is undecided
    const root = write("alias", doc({ ...clean }).replace("#### Phase 2 — Read the ledger\n\n" + seq("Web App", "Hub API"), "#### Phase 2 — Read the ledger\n\n" + seq("Web App", "Hub")));
    const comps = ["Web App", "Auth Service", "Hub API"].map((name) => ({ name, level: "L2", file_backed: true, description: `${name} of the desk` }));
    const facts = () => ({ ...collect(root), components: comps });
    const r = await check(root, { facts: facts(), judge: "agent" });
    expect(r.undecided).toEqual(["Hub", "Reporter"]);
    expect(r.worksheet).toMatch(/resolve-name\.worksheet\.md$/);
    expect(r.warnings.find((w: any) => w.rule === "participant-undecided").text).toMatch(/2 participant name\(s\) undecided[^]*"Hub", "Reporter" — answer .*resolve-name\.worksheet\.md and re-run/);
    expect(rules(r)).toEqual(["F-01/phase-absent", "F-02/phase-absent"]);   // the display-name comparison stands, flagged as undecided
    expect(r.flows[0].findings[0].text).toMatch(/it names "Hub", which the sequence does not \(undecided: "Hub" may be another spelling/);
    expect(r.warnings.map((w: any) => w.rule)).not.toContain("participant-alias");
    const ci = await check(root, { facts: facts(), judge: "agent", undecided: "warn" });   // CI: nobody answers — a finding that stands only on undecided names warns
    expect(rules(ci)).toEqual([]); expect(ci.status).not.toBe("FAIL");
    expect(ci.warnings.filter((w: any) => w.rule === "phase-absent-undecided").length).toBe(2);
    // the session answers beside the worksheet: "Hub" is the Hub API, the phase is in the sequence
    const ws = readFileSync(r.worksheet, "utf8"); const out = ws.match(/Write the answers to `([^`]+)`/)![1], hash = ws.match(/"worksheet": "([^"]+)"/)![1];
    const idOf = (cell: string) => ws.split("\n### ").find((b) => b.includes(`"cell": "${cell}"`))!.split("\n")[0].trim();
    writeFileSync(out, JSON.stringify({ worksheet: hash, answers: { [idOf("Hub")]: "Hub API", [idOf("Reporter")]: "none" } }));
    const a = await check(root, { facts: facts(), judge: "agent" });
    expect(a.undecided).toEqual([]);
    expect(rules(a)).toEqual([]);
    expect(a.warnings.find((w: any) => w.rule === "participant-alias").text).toMatch(/"Hub" read as `Hub API` \(agent/);
  });

  test("a docs/04 written before the Flow Inventory / Phase Catalog layout is skipped, never passed", async () => {
    const r = await check(legacy);
    expect(r.status).toBe("SKIP");
    expect(r.warnings[0].rule).toBe("legacy-layout");
    expect(r.flows).toEqual([]);
  });
});
