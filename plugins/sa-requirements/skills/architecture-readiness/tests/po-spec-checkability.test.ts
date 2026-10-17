/**
 * po-spec-checkability.js — the checkability rule over every requirement of a PO Spec. Rules under test: the
 * requirement sections split into statements (a use case into its parts; Out of Scope and Aspirations are not
 * requirements; a story counts its goal and its acceptance criteria); a use case missing a part fails by code; only a
 * candidate a finder flags goes to the judge, and the finders never decide; a judged failure costs its section — a use
 * case stops counting as complete, any other statement 25% — and a failure in a critical section caps the spec at 7.4;
 * an unsure answer (< 0.6) is reported and never applied; an unanswered candidate leaves the result PENDING.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const C = require("../scripts/po-spec-checkability.js");
const FIXTURES = require("./fixtures/checkability-fixtures.json");
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "checkability-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const SPEC = `# Product Owner Specification: Order Desk

## 3. Business Objectives <!-- SECTION: Business Objectives -->

### Primary Business Goals <!-- SECTION: Primary Business Goals -->

1. Reduce order capture time from 12 minutes to 4 minutes by Q2 2027.
2. The solution must be scalable and extensible to other systems in the future.

## 4. Use Cases <!-- SECTION: Use Cases -->

### UC-01: Capture an order

**Description**: A clerk captures a customer order from the Order Desk.

**Actors**: Clerk

**Trigger**: The clerk opens a new order.

**Primary Flow**:
1. The clerk selects the customer.
2. The system sends a confirmation by SMS, email, etc.

**Postconditions**: The order is stored with status Captured.

**Acceptance Criteria**:
- An order with three lines is captured in under 4 minutes.

### UC-02: Track an order

**Description**: The customer follows the order.

**Primary Flow**:
1. The system processes the request appropriately.

### UC-03: Cancel an order

**Description**: A supervisor cancels an order before dispatch.

**Actors**: Supervisor

**Preconditions**: The order has status Captured.

**Primary Flow**:
1. The supervisor cancels the order.

**Postconditions**: The order has status Cancelled.

**Success Metrics**:
- Cancellations complete in under 30 seconds.

### Out of Scope <!-- SECTION: Out of Scope -->

- Integration with other systems, etc.

## 7. Business Constraints <!-- SECTION: Business Constraints -->

| Constraint | Detail |
|---|---|
| Budget | USD 250,000 for release 1 |
| Integration | Must integrate with the payments core and other platforms |

## Appendix <!-- SECTION: Appendix -->

### Aspirations <!-- SECTION: Aspirations -->

- In the future, connect to other systems.
`;
const write = (s = SPEC) => { const p = join(dir, "PRODUCT_OWNER_SPEC.md"); writeFileSync(p, s); return p; };
/** A judge stand-in: the answers by statement text, the rest unanswered (the agent engine before its worksheet is answered). */
const fakeJudge = (byText: Record<string, { choice: string; confidence?: number }>, pending = false) => ({
  engineInForce: () => "agent",
  judge: async (_spec: any, items: any[]) => {
    const answers: any = {};
    for (const it of items) { const a = byText[it.state.text]; if (a) answers[it.id] = { type: "choice", by: "agent", confidence: 1, ...a }; }
    return pending ? { engine: "agent", answers: {}, pending: join(dir, "w.md"), dispatch: "sa-skills:reviewers:worksheet-judge" } : { engine: "agent", answers };
  },
});

describe("stage 1 — statements", () => {
  test("a use case splits into its parts; Out of Scope, Aspirations and the appendix hold no requirement", () => {
    const ex = C.extract(SPEC);
    const where = ex.statements.map((s: any) => s.where);
    expect(where).toContain("UC-01 Capture an order › step 2");
    expect(where).toContain("UC-01 Capture an order › acceptance 1");
    expect(where).toContain("UC-03 Cancel an order › trigger");   // Preconditions stand for the trigger
    expect(ex.statements.some((s: any) => /Integration with other systems/.test(s.text))).toBe(false);
    expect(ex.statements.some((s: any) => /connect to other systems/.test(s.text))).toBe(false);
    expect(ex.statements.find((s: any) => s.section === "Business Constraints" && /Budget/.test(s.text)).text).toBe("Budget · USD 250,000 for release 1");
    expect(ex.statements.some((s: any) => s.text === "Constraint · Detail")).toBe(false);   // a table header is not a requirement
  });
  test("a use case missing a part fails by code; one written to the earlier template (Preconditions, Success Metrics) passes", () => {
    const ex = C.extract(SPEC);
    expect(ex.structural.filter((f: any) => f.use_case === "UC-02").map((f: any) => f.part).sort()).toEqual(["acceptance", "actor", "outcome", "trigger"]);
    expect(ex.structural.filter((f: any) => f.use_case === "UC-03")).toEqual([]);
    expect(ex.structural.filter((f: any) => f.use_case === "UC-01")).toEqual([]);
  });
  test("the finders flag candidates in English and Spanish; a date or a number clears a dated or a quality cue", () => {
    expect(C.cues("Notify by SMS, email, etc.")).toEqual(["closed"]);
    expect(C.cues("Debe integrarse con otros sistemas")).toEqual(["named"]);
    expect(C.cues("Más adelante se podrá extender")).toEqual(["dated"]);
    expect(C.cues("Later, in release 2 (Q3 2027), add WhatsApp")).toEqual([]);
    expect(C.cues("La aplicación debe ser rápida")).toEqual(["measurable"]);
    expect(C.cues("Searches must be fast: under 1 second")).toEqual([]);
    expect(C.cues("El sistema maneja los errores adecuadamente")).toEqual(["observable"]);
  });
  test("the labelled set: every failing statement is a candidate, no checkable one is", () => {
    for (const f of FIXTURES) expect({ id: f.id, asked: C.cues(f.text).length > 0 }).toEqual({ id: f.id, asked: f.label !== "ok" });
    expect(new Set(FIXTURES.map((f: any) => f.id)).size).toBe(FIXTURES.length);
    for (const f of FIXTURES) expect(["ok", ...C.TESTS]).toContain(f.label);
  });
  test("a spec without anchors is read by its Spanish headings", () => {
    const es = "# Spec\n\n## 7. Restricciones de Negocio\n\n- Debe integrarse con terceros.\n";
    const ex = C.extract(es);
    expect(ex.statements.map((s: any) => [s.section, s.cues])).toEqual([["Business Constraints", ["named"]]]);
  });
});

describe("stage 3 — the score", () => {
  const ALL = {
    "The solution must be scalable and extensible to other systems in the future.": { choice: "named" },
    "The system sends a confirmation by SMS, email, etc.": { choice: "closed" },
    "The system processes the request appropriately.": { choice: "observable" },
    "Integration · Must integrate with the payments core and other platforms": { choice: "named" },
  };
  test("use cases count complete over total; other sections lose 25% per failure; a critical failure caps at 7.4", async () => {
    const r = await C.check(write(), { judge: fakeJudge(ALL), saSkills: null });
    expect(r.status).toBe("FAIL");
    const sec = Object.fromEntries(r.sections.map((s: any) => [s.section, s]));
    expect(sec["Use Cases"]).toMatchObject({ use_cases: 3, complete: 1, multiplier: 0.333 });
    expect(sec["Business Objectives"]).toMatchObject({ failing: 1, multiplier: 0.75, max_points: 1.13 });
    expect(sec["Business Constraints"]).toMatchObject({ failing: 1, multiplier: 0.75, max_points: 1.5 });
    expect(r.ready_cap).toBe(7.4);
    expect(r.capped_by).toEqual(["Business Objectives", "Use Cases", "Business Constraints"]);
    expect(r.findings.find((f: any) => f.test === "closed").ask).toMatch(/Close the list/);
  });
  test("ok answers cost nothing; an unsure answer is reported, never applied", async () => {
    const answers: Record<string, { choice: string; confidence?: number }> = Object.fromEntries(Object.keys(ALL).map((k) => [k, { choice: "ok" }]));
    answers["The system sends a confirmation by SMS, email, etc."] = { choice: "closed", confidence: 0.55 };
    const r = await C.check(write(), { judge: fakeJudge(answers), saSkills: null });
    expect(r.unsure.map((u: any) => u.where)).toEqual(["UC-01 Capture an order › step 2"]);
    expect(r.findings.every((f: any) => f.test === "missing-part")).toBe(true);   // only UC-02's missing parts remain
    expect(r.sections.find((s: any) => s.section === "Business Objectives").multiplier).toBe(1);
  });
  test("an unanswered worksheet leaves every candidate undecided and names the subagent to dispatch", async () => {
    const clean = SPEC.replace(/### UC-02[\s\S]*?(?=### UC-03)/, "");
    const r = await C.check(write(clean), { judge: fakeJudge({}, true), saSkills: null });
    expect(r.status).toBe("PENDING");
    expect(r.undecided.length).toBe(3);
    expect(C.render(r)).toMatch(/dispatch sa-skills:reviewers:worksheet-judge/);
  });
  test("no judge at all: candidates are undecided and the report says why — nothing is guessed", async () => {
    const r = await C.check(write(), { saSkills: null });
    expect(r.judge.engine).toBe("none"); expect(r.undecided.length).toBe(4);
    expect(r.findings.every((f: any) => f.by === "code")).toBe(true);
  });
});
