/**
 * po-spec-coherence.js — can the gathered requirements be built as they stand? Rules under test: the claims are found
 * outside the appendix, aspirations and out-of-scope; a label no use case exercises is a blocking mismatch, one any use
 * case exercises is supported, an unanswered one is undecided; an objective no use case serves or no metric measures
 * blocks, a use case or a metric tied to no objective warns; the acceptance tests are requested from the writer under a
 * fingerprint of the use cases, refused when stale; a missing fact the judge confirms blocks, an invented clause warns;
 * every seeded defect applies to its clean spec.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const COH = require("../scripts/po-spec-coherence.js");
const EVAL = require("../scripts/coherence-eval.js");
const CLEAN_EN = readFileSync(join(__dirname, "fixtures", "coherence", "clean-en.md"), "utf-8");
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "coherence-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

/** A judge stand-in: `decide(specId, item)` returns p, or undefined for unanswered. */
const fakeJudge = (decide: (spec: string, it: any) => number | undefined) => ({
  engineInForce: () => "agent",
  judge: async (spec: any, items: any[]) => {
    const answers: any = {};
    for (const it of items) { const p = decide(spec.id, it); if (p !== undefined) answers[it.id] = { type: "noul", by: "agent", p }; }
    return { engine: "agent", answers };
  },
});
const write = (s = CLEAN_EN) => { const p = join(dir, "PRODUCT_OWNER_SPEC.md"); writeFileSync(p, s); return p; };
const allYes = fakeJudge(() => 0.95);
const writeTests = (tests: any) => { const d = join(dir, ".cache", "sa-skills", "coherence"); mkdirSync(d, { recursive: true }); writeFileSync(join(d, "acceptance-tests.json"), JSON.stringify(tests)); };
const fp = () => COH.fingerprintOf(COH.extract(CLEAN_EN).useCases);
const testsFor = (over: any = {}) => ({ fingerprint: fp(), tests: Object.fromEntries(["UC-01", "UC-02", "UC-03", "UC-04", "UC-05"].map((u) => [u, { given: [`${u} given`], when: [`${u} when`], then: [`${u} then`], missing: [], ...(over[u] || {}) }])) });

describe("stage 1", () => {
  test("use cases, objectives, metrics and claims are read; out-of-scope text claims nothing", () => {
    const ex = COH.extract(CLEAN_EN);
    expect(ex.useCases.map((u: any) => u.id)).toEqual(["UC-01", "UC-02", "UC-03", "UC-04", "UC-05"]);
    expect(ex.objectives.length).toBe(3); expect(ex.metrics.length).toBe(3);
    expect(ex.claims.map((c: any) => c.id).sort()).toEqual(["real-time", "self-service"]);
    expect(COH.extract(CLEAN_EN.replace("- Online ordering by customers.", "- An agentic assistant.")).claims.some((c: any) => c.id === "agentic")).toBe(false);
  });
  test("every seeded defect applies to its clean spec and names a finding the gate reports", () => {
    const v = EVAL.variants();
    expect(v.filter((x: any) => x.clean).length).toBe(2);
    expect(new Set(v.map((x: any) => x.id)).size).toBe(v.length);
    for (const x of v.filter((x: any) => !x.clean)) expect(["label-mismatch", "objective-unserved", "objective-unmeasured", "untestable", "use-case-unanchored", "state-unset", "trigger-unproduced", "contradiction", "numbers-disagree", "use-case-misses-target"]).toContain(x.expect);
  });
});

describe("the gate", () => {
  test("a claim no use case exercises blocks; one any use case exercises is supported", async () => {
    writeTests(testsFor());
    const agentic = CLEAN_EN.replace("Order Desk gives clerks a screen", "Order Desk is an agentic assistant that gives clerks a screen");
    const j = fakeJudge((s, it) => (s === "coherence-label" ? (/planning several steps/.test(it.state.capability) ? 0.05 : 0.9) : 0.95));
    const r = await COH.check(write(agentic), { judge: j, saSkills: null });
    expect(r.findings.filter((f: any) => f.test === "label-mismatch").map((f: any) => f.text)).toEqual([expect.stringMatching(/Agentic/)]);
    expect(r.labels.find((l: any) => l.label === "Real-time").supported_by.length).toBe(5);
    expect(r.status).toBe("FAIL");
  });
  test("an objective nothing serves or measures blocks; a use case serving no objective only warns", async () => {
    writeTests(testsFor());
    const j = fakeJudge((s, it) => {
      if (s === "coherence-serves") return /^3\./.test(it.state.objective) || /Halve/.test(it.state.objective) ? 0.1 : /UC-04/.test(it.state.use_case) ? 0.1 : 0.9;
      if (s === "coherence-measures") return /Reduce orders with errors/.test(it.state.objective) ? 0.1 : 0.9;
      return 0.95;
    });
    const r = await COH.check(write(), { judge: j, saSkills: null });
    const tests = r.findings.map((f: any) => `${f.test}:${f.blocking}`);
    expect(tests).toContain("objective-unserved:true"); expect(tests).toContain("objective-unmeasured:true");
    expect(tests).toContain("use-case-unanchored:false");
  });
  test("without tests on disk the writer is requested under a fingerprint; a stale answer is refused", async () => {
    const r = await COH.check(write(), { judge: allYes, saSkills: null });
    expect(r.status).toBe("PENDING");
    expect(r.pending.find((p: any) => p.kind === "tests").dispatch).toBe(COH.TEST_WRITER);
    expect(readFileSync(join(dir, ".cache", "sa-skills", "coherence", "acceptance-request.md"), "utf-8")).toContain(`"fingerprint": "${fp()}"`);
    writeTests({ ...testsFor(), fingerprint: "stale" });
    const again = await COH.check(write(), { judge: allYes, saSkills: null });
    expect(again.notes.join(" ")).toMatch(/other use cases/); expect(again.status).toBe("PENDING");
  });
  test("a confirmed missing fact blocks, an invented clause warns; a clean set passes", async () => {
    writeTests(testsFor({ "UC-02": { missing: ["which validation rules apply"] } }));
    const r = await COH.check(write(), { judge: fakeJudge((s, it) => (s === "coherence-clause" && /UC-03 then/.test(it.state.clause) ? 0.1 : 0.95)), saSkills: null });
    expect(r.findings.filter((f: any) => f.test === "untestable").map((f: any) => f.where)).toEqual(["UC-02"]);
    expect(r.findings.filter((f: any) => f.test === "test-assumes").map((f: any) => `${f.where}:${f.blocking}`)).toEqual(["UC-03:false"]);
    writeTests(testsFor());
    const ok = await COH.check(write(), { judge: allYes, saSkills: null });
    expect(ok.status).toBe("PASS"); expect(ok.blocking).toBe(0);
  });
  test("a missing fact the judge dismisses becomes a question, never a blocker", async () => {
    writeTests(testsFor({ "UC-02": { missing: ["where invoices are stored"] } }));
    const r = await COH.check(write(), { judge: fakeJudge((s) => (s === "coherence-missing" ? 0.1 : 0.95)), saSkills: null });
    expect(r.findings.some((f: any) => f.test === "untestable")).toBe(false);
    expect(r.acceptance.find((a: any) => a.use_case === "UC-02").questions).toContain("where invoices are stored");
    const open = await COH.check(write(), { judge: fakeJudge((s) => (s === "coherence-missing" ? undefined : 0.95)), saSkills: null });
    expect(open.status).toBe("PENDING");
  });
  test("a confirmed missing fact blocks only as a business fact; a detail becomes a question; the kind is asked alone", async () => {
    writeTests(testsFor({ "UC-02": { missing: ["how often the system checks the invoices", "the rule for an unknown product code"] } }));
    const kinds: any[] = [];
    const j = fakeJudge((s, it) => { if (s === "coherence-missing-kind") { kinds.push(it.state); return /how often/.test(it.state.missing) ? 0.2 : 0.9; } return 0.95; });
    const r = await COH.check(write(), { judge: j, saSkills: null });
    expect(kinds.every((k) => Object.keys(k).join() === "missing")).toBe(true);
    const f = r.findings.find((x: any) => x.test === "untestable");
    expect(f.text).toContain("unknown product code"); expect(f.text).not.toContain("how often");
    expect(r.acceptance.find((a: any) => a.use_case === "UC-02").questions).toContain("how often the system checks the invoices");
    const open = await COH.check(write(), { judge: fakeJudge((s) => (s === "coherence-missing-kind" ? undefined : 0.95)), saSkills: null });
    expect(open.status).toBe("PENDING");
  });
  test("closure: a state whose records come from another system is closed; one nothing sets and nothing supplies is unset", async () => {
    writeTests(testsFor());
    const seen: Record<string, string> = {};
    const j = fakeJudge((s, it) => {
      if (s === "coherence-state-origin") { seen[it.state.state] = it.state.mentions; return it.state.state === "Unpaid" ? 0.95 : 0.1; }
      if (s === "coherence-state-setter") return it.state.state === "Unpaid" || it.state.state === "Delivered" ? 0.1 : 0.95;
      return 0.95;
    });
    const r = await COH.check(write(), { judge: j, saSkills: null });
    expect(seen.Unpaid).toContain("from the billing system");
    const unset = r.findings.filter((f: any) => f.test === "state-unset").map((f: any) => f.text);
    expect(unset.some((t: string) => t.includes('"Delivered"'))).toBe(true);
    expect(unset.some((t: string) => t.includes('"Unpaid"'))).toBe(false);
  });
  test("closure: the states a use case names and every trigger are found; quoted text names no state", () => {
    const ex = COH.extract(CLEAN_EN);
    expect(ex.states.map((x: any) => x.state)).toEqual(["Captured", "Unpaid", "Accepted", "Dispatched", "Delivered", "Cancelled"]);
    expect(ex.useCases.every((u: any) => u.trigger.length > 0)).toBe(true);
    expect(COH.statesOf('con su estado: Reservada o Cancelada; muestra "Order Desk status Open"')).toEqual(["Reservada", "Cancelada"]);
  });
  test("closure: a state nothing sets and a trigger nothing produces block on a confident no; an uncertain one warns", async () => {
    writeTests(testsFor());
    const j = fakeJudge((s, it) => (s === "coherence-state-origin" ? 0.1 : s === "coherence-state-setter" ? (it.state.state === "Delivered" ? 0.1 : it.state.state === "Dispatched" ? 0.5 : 0.95) : s === "coherence-trigger" ? (/tracking link/.test(it.state.trigger) ? 0.1 : 0.95) : 0.95));
    const r = await COH.check(write(), { judge: j, saSkills: null });
    const t = r.findings.map((f: any) => `${f.test}:${f.blocking}`);
    expect(t).toContain("state-unset:true"); expect(t).toContain("state-unclear:false"); expect(t).toContain("trigger-unproduced:true");
    expect(r.findings.find((f: any) => f.test === "trigger-unproduced").where).toBe("UC-03");
  });
  test("conflict: every use case is paired with every other, each constraint and each out-of-scope item; a confident no blocks", async () => {
    writeTests(testsFor());
    const seen: string[] = [];
    const j = fakeJudge((s, it) => { if (s === "coherence-conflict") { seen.push(it.id); return /Out of scope/.test(it.state.b) && /SMS/.test(it.state.a) ? 0.05 : /tracking page works/.test(it.state.b) ? 0.5 : 0.95; } return 0.95; });
    const spec = CLEAN_EN.replace("- Online ordering by customers.", "- Online ordering by customers.\n- SMS messages to customers.");
    const r = await COH.check(write(spec), { judge: j, saSkills: null });
    expect(seen.length).toBe(10 + 5 * 2 + 5 * 2);
    const t = r.findings.filter((f: any) => f.eval === "conflict").map((f: any) => `${f.test}:${f.where.split(" ")[0]}`);
    expect(t).toContain("contradiction:UC-01"); expect(t).toContain("contradiction:UC-03"); expect(t).toContain("possible-contradiction:UC-03");
    expect(r.status).toBe("FAIL");
  });
  test("sizing: objective numbers read by code, ratios included; a KPI or a use-case limit that disagrees warns, never blocks", () => {
    expect(COH.goalOf("Reduce capture time from 12 minutes to 4 minutes by Q2 2027.")).toEqual({ baseline: 12, target: 4, unit: "min" });
    expect(COH.goalOf("Reducir las llamadas de 300 a 120 antes de 2027.")).toEqual({ baseline: 300, target: 120, unit: "" });
    expect(COH.goalOf("Halve the calls by Q4 2027.")).toEqual({ factor: 0.5 });
    expect(COH.goalOf("Reduce returns by 30% by 2027.").factor).toBeCloseTo(0.7);
    expect(COH.rowOf("Order status calls per week · 400 · 200")).toEqual({ baseline: 400, target: 200, unit: "" });
    expect(COH.limitOf("captured in under 6 minutes")).toEqual({ v: 6, unit: "min" });
    expect(COH.limitOf("entre 24 y 23 horas antes")).toBe(null);
  });
  test("sizing: a KPI that breaks its objective's figures and a use case that accepts less than the target both warn", async () => {
    writeTests(testsFor());
    const spec = CLEAN_EN.replace("| Order status calls per week | 400 | 200 |", "| Order status calls per week | 400 | 300 |").replace("captured in under 4 minutes", "captured in under 6 minutes");
    const j = fakeJudge((s, it) => s === "coherence-measures" ? (it.id === "M-O1-M1" || it.id === "M-O2-M2" || it.id === "M-O3-M3" ? 0.95 : 0.1) : s === "coherence-serves" ? (it.id === "S-O1-UC-01" ? 0.95 : 0.5) : 0.95);
    const r = await COH.check(write(spec), { judge: j, saSkills: null });
    const t = r.findings.filter((f: any) => f.eval === "sizing").map((f: any) => `${f.test}:${f.where}:${f.blocking}`);
    expect(t).toContain("numbers-disagree:O3 × M3:false");
    expect(t).toContain("use-case-misses-target:UC-01 × O1:false");
    expect(t.some((x: string) => x.startsWith("numbers-disagree:O1"))).toBe(false);
  });
  test("an unanswered question leaves the gate PENDING, never passed", async () => {
    writeTests(testsFor());
    const r = await COH.check(write(), { judge: fakeJudge((s) => (s === "coherence-label" ? undefined : 0.95)), saSkills: null });
    expect(r.status).toBe("PENDING"); expect(r.undecided.some((u: any) => u.eval === "label")).toBe(true);
  });
});
