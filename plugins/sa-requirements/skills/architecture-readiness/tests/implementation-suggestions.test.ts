/**
 * Implementation suggestions (10.25.0) — how someone proposed to build the system, kept apart from the requirements.
 * Rules under test: the Appendix table parses under its anchor or its Spanish heading, a placeholder row is no suggestion
 * and an unknown Status is Open; the finder flags every labelled prescription (it only decides what the judge is asked);
 * a confident yes is reported as a suggestion and never scores — no multiplier, no Ready cap; an unanswered candidate
 * keeps the result PENDING.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const C = require("../scripts/po-spec-checkability.js");
const { suggestionsOf } = require("../../../scripts/shared/po-spec.js");
const FX = require("./fixtures/implementation-fixtures.json");
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "impl-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const SPEC = `# Order Desk - Product Owner Specification

## 3. Business Objectives <!-- SECTION: Business Objectives -->

1. Reduce order capture time from 12 minutes to 4 minutes by Q2 2027.

## 7. Business Constraints <!-- SECTION: Business Constraints -->

- Orders must be published to Kafka so no order is lost.
- Balances are read from the bank's SAP ledger, which stays the system of record.

## Appendix <!-- SECTION: Appendix -->

### Sugerencias de Implementación

| # | Suggestion | Need | Proposed by | Status | Answer |
|---|---|---|---|---|---|
| IS-01 | Build it as **microservices** | UC-02 scales on its own | Sales | Not adopted | One service per area meets the peak |
| IS-02 | The app in React | UC-01 | IT | pending | |
| IS-03 | [as stated, verbatim] | [need] | [role] | Open | |
`;
const write = (s = SPEC) => { const p = join(dir, "PRODUCT_OWNER_SPEC.md"); writeFileSync(p, s); return p; };
/** answers the checkability rule `ok` and the implementation question from `impl` by statement; anything else unanswered */
const fakeJudge = (impl: Record<string, number>) => ({
  engineInForce: () => "agent",
  judge: async (spec: any, items: any[]) => {
    const answers: any = {};
    for (const it of items) {
      if (spec.id === C.IMPL.id) { const p = impl[it.state.statement]; if (p !== undefined) answers[it.id] = { type: "noul", by: "agent", p, confidence: p }; }
      else answers[it.id] = { type: "choice", by: "agent", choice: "ok", confidence: 1 };
    }
    return { engine: "agent", answers };
  },
});

describe("implementation suggestions", () => {
  test("the Appendix table: Spanish heading, placeholder skipped, Status normalized, an unknown one Open", () => {
    const s = suggestionsOf(SPEC);
    expect(s.map((x: any) => [x.id, x.status])).toEqual([["IS-01", "Not adopted"], ["IS-02", "Open"]]);
    expect(s[0]).toMatchObject({ suggestion: "Build it as microservices", need: "UC-02 scales on its own", by: "Sales", answer: "One service per area meets the peak" });
    expect(suggestionsOf(readFileSync(join(__dirname, "..", "templates", "PO_SPEC_TEMPLATE.md"), "utf8"))).toEqual([]);
  });

  test("the finder flags every labelled prescription; a statement with no technology word is never asked", () => {
    for (const f of FX) if (f.label) expect([f.id, C.implCue(f.text)]).toEqual([f.id, true]);
    expect(C.implCue("The customer opens the mobile app and selects an order.")).toBe(false);
    expect(C.implCue("Users react within a minute and rest after the shift.")).toBe(false);
  });

  test("a confident yes is a suggestion and costs nothing; an imposed system is not one", async () => {
    const r = await C.check(write(), { judge: fakeJudge({ "Orders must be published to Kafka so no order is lost.": 0.95, "Balances are read from the bank's SAP ledger, which stays the system of record.": 0.05 }), saSkills: null });
    expect(r.status).toBe("PASS");
    expect(r.suggestions.map((x: any) => x.text)).toEqual(["Orders must be published to Kafka so no order is lost."]);
    expect(r.ready_cap).toBeNull();
    expect(r.sections.find((s: any) => s.section === "Business Constraints").multiplier).toBe(1);
    expect(C.render(r)).toMatch(/→ Business Constraints · implementation suggestion .*Appendix › Implementation Suggestions/);
  });

  test("an unanswered implementation question keeps the result PENDING", async () => {
    const r = await C.check(write(), { judge: fakeJudge({}), saSkills: null });
    expect(r.status).toBe("PENDING");
    expect(r.undecided.filter((u: any) => u.question === "implementation")).toHaveLength(2);
  });
});
