/**
 * judge.js — one judge, three providers. Rules under test: a spec is checked before anything runs;
 * a choice merges the item's own options over the spec's and refuses more than 255; the typesafe
 * provider batches by chunk, addresses each item by its path in the batch state, normalizes the
 * three answer shapes, caches by content so a re-run makes no request, and retries the statuses
 * the API documents; the agent provider writes a worksheet and applies answers without defaulting
 * an unanswered item; there is no fallback provider (8.119.0); verify separates a recall miss
 * from a judge miss.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const J = require(join(import.meta.dir, "judge.js"));
const { judge, verify, band, value, questionFor, JudgeError } = J;
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "judge-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const noul = { id: "claim", type: "noul", question: "Does `item.text` assert the claim?", criteria: { true: "It asserts it.", false: "Anything else." } };
const items = [
  { id: "b000", state: { text: "the only reader" } },
  { id: "b001", state: { text: "a second reader" } },
  { id: "b002", state: { text: "no reader at all" } },
];

/** A fake API: records every request, answers from `reply(id)`, optionally fails first with a status. */
function fakeFetch(reply: (id: string) => any, failFirst?: number) {
  const calls: any[] = []; let failed = false;
  const fetch = async (_url: string, init: any) => {
    const body = JSON.parse(init.body); calls.push(body);
    if (failFirst && !failed) { failed = true; return { ok: false, status: failFirst, text: async () => "slow down" }; }
    const answers: any = {};
    for (const id of Object.keys(body.questions)) answers[id] = reply(id);
    return { ok: true, json: async () => ({ model: "jev-1.13.0", answers, usage: { input_tokens: 10, output_tokens: 1 } }) };
  };
  return { fetch, calls };
}
const opts = (extra: any = {}) => ({ engine: "typesafe", apiKey: "k", root: dir, sleep: async () => {}, ...extra });

describe("spec and items", () => {
  test("a spec is checked before any provider runs", async () => {
    await expect(judge({ id: "x", type: "guess", question: "?" }, items, opts())).rejects.toBeInstanceOf(JudgeError);
    await expect(judge({ id: "x", type: "score", question: "?", criteria: ["one"] }, items, opts())).rejects.toThrow(/at least two levels/);
    await expect(judge(noul, [{ id: "a", state: 1 }, { id: "a", state: 2 }], opts())).rejects.toThrow(/duplicate/);
    await expect(judge(noul, items, opts({ engine: "oracle" }))).rejects.toThrow(/engine must be/);
  });
  test("a choice merges the item's options over the spec's and caps at 255", () => {
    const spec = { id: "r", type: "choice", question: "Which?", criteria: { none: "no candidate fits" } };
    const q = questionFor(spec, { id: "c1", state: {}, options: { "pay-service": null, "pay-gateway": "the edge" } });
    expect(Object.keys(q.criteria)).toEqual(["none", "pay-service", "pay-gateway"]);
    expect(q.instructions).toEqual({ item: "items.c1", question: "Which?" });
    const many = Object.fromEntries(Array.from({ length: 256 }, (_, i) => [`o${i}`, null]));
    expect(() => questionFor(spec, { id: "c2", state: {}, options: many })).toThrow(/255/);
  });
});

describe("typesafe provider", () => {
  test("one item per request whatever the chunk (8.120.4 — a batched answer moved with its neighbours), addressed by path, a noul normalized", async () => {
    const api = fakeFetch((id) => ({ type: "noul", noul: id === "b000" ? 0.93 : 0.12 }));
    const res = await judge(noul, items, opts({ fetch: api.fetch, chunk: 2 }));
    expect(api.calls.length).toBe(3);
    expect(api.calls.every((c: any) => Object.keys(c.state.items).length === 1)).toBe(true);
    api.calls.sort((a: any, b: any) => Object.keys(a.questions)[0].localeCompare(Object.keys(b.questions)[0]));
    expect(api.calls[0].questions.b000).toEqual({ type: "noul", instructions: { item: "items.b000", question: noul.question }, criteria: noul.criteria });
    expect(api.calls[0].model).toBe("jev-latest");
    expect(res.answers.b000).toEqual({ type: "noul", by: "jev-1.13.0", p: 0.93 });
    expect(res.requests).toBe(3); expect(res.usage.input_tokens).toBe(30);
  });
  test("normalizes a choice and a score", async () => {
    const choice = { id: "c", type: "choice", question: "Which?", criteria: { a: null, b: null } };
    let api = fakeFetch(() => ({ type: "choice", choice: "b", probabilities: { a: 0.2, b: 0.8 }, confidence: 0.6 }));
    let res = await judge(choice, [items[0]], opts({ fetch: api.fetch }));
    expect(res.answers.b000).toMatchObject({ choice: "b", confidence: 0.6, probabilities: { a: 0.2, b: 0.8 } });
    const score = { id: "s", type: "score", question: "How?", criteria: ["different", "related", "same"] };
    api = fakeFetch(() => ({ type: "score", score: 1.9, probabilities: { "0": 0, "1": 0.1, "2": 0.9 }, confidence: 0.85, legend: { "0": "different", "1": "related", "2": "same" } }));
    res = await judge(score, [items[0]], opts({ fetch: api.fetch }));
    expect(res.answers.b000).toMatchObject({ score: 1.9, confidence: 0.85 });
    expect(value(res.answers.b000)).toBe(0.85);
  });
  test("caches by content: a re-run makes no request, a changed item makes one", async () => {
    const api = fakeFetch(() => ({ type: "noul", noul: 0.5 }));
    await judge(noul, items, opts({ fetch: api.fetch }));
    expect(existsSync(join(dir, ".cache", "sa-skills", "judge", "claim.cache.json"))).toBe(true);
    const again = await judge(noul, items, opts({ fetch: api.fetch }));
    expect(api.calls.length).toBe(3); expect(again.cached).toBe(3); expect(again.answers.b001.cached).toBe(true);
    const changed = [...items, { id: "b003", state: { text: "new passage" } }];
    const third = await judge(noul, changed, opts({ fetch: api.fetch }));
    expect(api.calls.length).toBe(4); expect(Object.keys(api.calls[3].state.items)).toEqual(["b003"]); expect(third.cached).toBe(3);
    const other = await judge({ ...noul, question: "A different question?" }, items, opts({ fetch: api.fetch }));
    expect(api.calls.length).toBe(7); expect(other.cached).toBe(0);
  });
  test("shared state travels with every request and is part of the cache key", async () => {
    const api = fakeFetch(() => ({ type: "noul", noul: 0.5 }));
    await judge(noul, items, opts({ fetch: api.fetch, shared: { brief: "an initiative" } }));
    expect(api.calls.every((c: any) => c.state.shared?.brief === "an initiative")).toBe(true); expect(api.calls.length).toBe(3);
    const again = await judge(noul, items, opts({ fetch: api.fetch, shared: { brief: "an initiative" } }));
    expect(api.calls.length).toBe(3); expect(again.cached).toBe(3);
    await judge(noul, items, opts({ fetch: api.fetch, shared: { brief: "another initiative" } }));
    expect(api.calls.length).toBe(6);                                                       // a different brief is a different question
  });
  test("retries a 429 and refuses without a key", async () => {
    const api = fakeFetch(() => ({ type: "noul", noul: 0.7 }), 429);
    const res = await judge(noul, [items[0]], opts({ fetch: api.fetch }));
    expect(api.calls.length).toBe(2); expect(res.answers.b000.p).toBe(0.7);
    const saved = process.env.TYPESAFE_API_KEY; delete process.env.TYPESAFE_API_KEY;
    try { await expect(judge(noul, items, { engine: "typesafe", root: dir })).rejects.toThrow(/TYPESAFE_API_KEY/); }
    finally { if (saved) process.env.TYPESAFE_API_KEY = saved; }
  });
});

describe("agent provider", () => {
  test("writes a worksheet, then applies the session's answers without defaulting a missing one", async () => {
    const res = await judge(noul, items, { engine: "agent", root: dir });
    expect(res.pending).toBe(join(dir, ".cache", "sa-skills", "judge", "claim.worksheet.md"));
    const sheet = readFileSync(res.pending, "utf8");
    expect(sheet).toContain("### b002"); expect(sheet).toContain("the only reader"); expect(sheet).toContain("**Yes** means: It asserts it.");
    const answers = join(dir, "answers.json"); writeFileSync(answers, JSON.stringify({ b000: 1, b001: "no" }));
    const applied = await judge(noul, items, { engine: "agent", root: dir, answers });
    expect(applied.answers.b000).toEqual({ type: "noul", by: "agent", p: 1 });
    expect(applied.answers.b001.p).toBe(0);
    expect(applied.unanswered).toEqual(["b002"]);
    await expect(judge(noul, items, { engine: "agent", root: dir, answers: { zzz: 1 } })).rejects.toThrow(/none of the 3/);
  });
});

describe("the engine in force", () => {
  test("SA_JUDGE picks the engine when the caller names none; a bad value is an error, not a fallback", async () => {
    const saved = process.env.SA_JUDGE;
    try {
      delete process.env.SA_JUDGE;
      expect(J.engineInForce()).toBe("agent");
      process.env.SA_JUDGE = "agent";
      const res = await judge(noul, items, { root: dir });
      expect(res.engine).toBe("agent"); expect(res.pending).toContain("claim.worksheet.md");
      process.env.SA_JUDGE = "heuristic";                                               // removed in 8.119.0: an error, never a fallback
      expect(() => J.engineInForce()).toThrow(/removed in 8\.119\.0/);
      process.env.SA_JUDGE = "oracle";
      await expect(judge(noul, items, { root: dir })).rejects.toThrow(/SA_JUDGE=oracle/);
    } finally { if (saved === undefined) delete process.env.SA_JUDGE; else process.env.SA_JUDGE = saved; }
  });
});

describe("no fallback provider, and stage 3", () => {
  test("the heuristic engine is gone: asking for it is an error that names the replacement (8.119.0)", async () => {
    expect(J.ENGINES).toEqual(["agent", "typesafe", "clef"]);
    await expect(judge(noul, items, { engine: "claude" })).rejects.toThrow(/replaced by clef in 8\.120\.0/);
    await expect(judge(noul, items, { engine: "heuristic" })).rejects.toThrow(/removed in 8\.119\.0.*undecided/);
  });
  test("band and verify: a judge miss is not a recall miss", () => {
    expect([band(0.9), band(0.5), band(0.1)]).toEqual(["high", "mid", "low"]);
    const answers = { b000: { type: "noul", p: 0.95 }, b001: { type: "noul", p: 0.3 }, b002: { type: "noul", p: 0.9 } };
    const r = verify(noul, [{ id: "b000", label: 1 }, { id: "b001", label: 1 }, { id: "b009", label: 1 }, { id: "b002", label: 0 }], answers);
    expect(r.total).toBe(3); expect(r.tp).toBe(1);
    expect(r.fn.map((f: any) => f.id)).toEqual(["b001"]);
    expect(r.unseen.map((f: any) => f.id)).toEqual(["b009"]);
    expect(r.fp.map((f: any) => f.id)).toEqual(["b002"]);
    const choice = { id: "c", type: "choice", question: "?", criteria: { a: null } };
    const c = verify(choice, [{ id: "x", label: "a" }, { id: "y", label: "b" }], { x: { type: "choice", choice: "a" }, y: { type: "choice", choice: "a" } });
    expect(c.tp).toBe(1); expect(c.fn[0].got).toBe("a");
  });
});

// ─── clef ────────────────────────────────────────────────────────────────────
/** Cloudflare's REST shape: the System One answer inside { result, success, errors, messages }. */
function fakeClef(reply: (id: string, q: any) => any, opts: { success?: boolean; errors?: any[] } = {}) {
  const calls: any[] = [];
  const fetch = async (url: string, init: any) => {
    const body = JSON.parse(init.body); calls.push({ url, auth: init.headers.Authorization, gateway: init.headers["cf-aig-gateway-id"], body });
    const answers: any = {}; for (const [id, q] of Object.entries(body.questions)) answers[id] = reply(id, q);
    return { ok: true, json: async () => ({ result: { model: body.model, answers, usage: { input_tokens: 40, output_tokens: 0 } }, success: opts.success ?? true, errors: opts.errors ?? [], messages: [] }) };
  };
  return { fetch, calls };
}
describe("clef provider (8.120.0)", () => {
  const env = { CLOUDFLARE_ACCOUNT_ID: "acct123", CLOUDFLARE_API_TOKEN: "tok" };
  const withEnv = async (vars: Record<string, string | undefined>, fn: () => Promise<void>) => {
    const saved: Record<string, string | undefined> = {}; for (const k of Object.keys(vars)) { saved[k] = process.env[k]; if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; }
    try { await fn(); } finally { for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
  };
  test("the System One request to the account's Workers AI route, the envelope unwrapped, answers stamped clef", async () => withEnv({ ...env, CLEF_ENDPOINT: undefined, SA_JUDGE_CLEF_MODEL: undefined, CLOUDFLARE_AI_GATEWAY_ID: undefined }, async () => {
    const f = fakeClef((id) => ({ type: "noul", noul: id === "b000" ? 0.93 : 0.08 }));
    const r = await judge(noul, items, { engine: "clef", root: dir, fetch: f.fetch, cache: false, chunk: 2 });
    expect(f.calls[0].url).toBe("https://api.cloudflare.com/client/v4/accounts/acct123/ai/run/@cf/cloudflare/clef");
    expect(f.calls[0].auth).toBe("Bearer tok");
    expect(f.calls[0].body.model).toBe("clef");
    expect(f.calls.every((c: any) => Object.keys(c.body.questions).length === 1)).toBe(true);   // one item per request (8.120.4)
    expect(f.calls.length).toBe(items.length);
    expect(f.calls.find((c: any) => c.body.state.items.b000).body.state.items.b000).toEqual(items[0].state);
    expect(r).toMatchObject({ engine: "clef", model: "clef", requests: f.calls.length });
    expect(r.answers.b000).toMatchObject({ type: "noul", p: 0.93, by: "clef" });
    expect(f.calls[0].gateway).toBeUndefined();                                             // no gateway unless one is named
  }));
  test("CLOUDFLARE_AI_GATEWAY_ID routes the call through that AI Gateway (cf-aig-gateway-id header)", async () => withEnv({ ...env, CLEF_ENDPOINT: undefined, SA_JUDGE_CLEF_MODEL: undefined, CLOUDFLARE_AI_GATEWAY_ID: "lab-gw" }, async () => {
    const f = fakeClef(() => ({ type: "noul", noul: 0.5 }));
    await judge(noul, items, { engine: "clef", root: dir, fetch: f.fetch, cache: false });
    expect(f.calls.every((c: any) => c.gateway === "lab-gw")).toBe(true);
  }));
  test("choice answers keep their probabilities and confidence; CLEF_ENDPOINT is honoured; clef-flash runs on a local endpoint only", async () => withEnv({ ...env, SA_JUDGE_CLEF_MODEL: undefined, CLEF_ENDPOINT: "http://127.0.0.1:9/clef" }, async () => {
    const choice = { id: "pick", type: "choice", question: "Which?", criteria: { a: "A", b: "B" } };
    const f = fakeClef(() => ({ type: "choice", choice: "b", probabilities: { a: 0.1, b: 0.9 }, confidence: 0.85 }));
    const r = await judge(choice, [{ id: "c1", state: "x" }], { engine: "clef", root: dir, fetch: f.fetch, cache: false });
    expect(f.calls[0].url).toBe("http://127.0.0.1:9/clef"); expect(f.calls[0].body.model).toBe("clef");
    expect(r.answers.c1).toMatchObject({ choice: "b", confidence: 0.9, clef_confidence: 0.85, by: "clef" });   // the chosen option's probability (8.120.1)
    // on a local endpoint (Ollama) clef-flash runs, with no token sent
    const local = await judge(choice, [{ id: "c1", state: "x" }], { engine: "clef", model: "clef-flash", root: dir, fetch: f.fetch, cache: false, apiKey: "" });
    expect(local.model).toBe("clef-flash");
    // on Cloudflare's route Workers AI serves clef only
    await expect(judge(choice, [{ id: "c1", state: "x" }], { engine: "clef", model: "clef-flash", endpoint: "https://api.cloudflare.com/client/v4/accounts/a/ai/run/@cf/cloudflare/clef", root: dir, fetch: f.fetch, cache: false })).rejects.toThrow(/Workers AI serves clef only/);
  }));
  test("calibration: a clef choice or score reads the chosen option's probability; noul and other engines are untouched", () => {
    expect(J.calibrate("clef", { type: "choice", choice: "a", confidence: 0.19, probabilities: { a: 0.58, b: 0.42 } })).toMatchObject({ confidence: 0.58, clef_confidence: 0.19 });
    expect(J.calibrate("clef", { type: "score", score: 1.9, confidence: 0.79, probabilities: { "0": 0.02, "1": 0.05, "2": 0.93 } })).toMatchObject({ confidence: 0.93 });
    expect(J.calibrate("clef", { type: "noul", p: 0.4 })).toEqual({ type: "noul", p: 0.4 });
    expect(J.calibrate("typesafe", { type: "choice", choice: "a", confidence: 0.6, probabilities: { a: 0.74 } }).confidence).toBe(0.6);
  });
  test("an id outside Clef's question-id set travels as an alias and comes back under its own id (8.120.1)", async () => withEnv({ ...env, CLEF_ENDPOINT: undefined, SA_JUDGE_CLEF_MODEL: undefined }, async () => {
    const calls: any[] = [];
    const fetch = (async (_u: string, init: any) => { const b = JSON.parse(init.body); calls.push(b); const answers: any = {};
      for (const id of Object.keys(b.questions)) answers[id] = { type: "noul", noul: b.state.items[id] === "b" ? 0.9 : 0.1 };
      return { ok: true, json: async () => ({ result: { model: "clef", answers }, success: true, errors: [], messages: [] }) }; }) as any;
    const its = [{ id: "I-06:to", state: "a" }, { id: "I-06:to::1", state: "b" }, { id: "plain_id", state: "c" }];
    const r = await judge(noul, its, { engine: "clef", root: dir, fetch, cache: false });
    const sent = calls.flatMap((c) => Object.keys(c.questions));
    expect(sent.every((k: string) => /^[A-Za-z0-9_.-]{1,100}$/.test(k))).toBe(true);
    expect(sent.sort()).toEqual(["plain_id", "q0", "q0"]);                                  // one item per request: each alias is q0
    expect(calls.find((c) => c.questions.q0 && c.state.items.q0 === "b").questions.q0.instructions.item).toBe("items.q0");   // the question points at the aliased state
    expect(r.answers["I-06:to::1"].p).toBe(0.9); expect(r.answers["I-06:to"].p).toBe(0.1); expect(r.answers.plain_id.p).toBe(0.1);
  }));
  test("missing credentials, an unknown model and success:false are errors that say what to fix", async () => {
    await withEnv({ CLOUDFLARE_ACCOUNT_ID: undefined, CLOUDFLARE_API_TOKEN: undefined, CLEF_ENDPOINT: undefined }, async () => {
      await expect(judge(noul, items, { engine: "clef", root: dir, cache: false })).rejects.toThrow(/CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN/);
    });
    await withEnv({ ...env, SA_JUDGE_CLEF_MODEL: "clef-xl" }, async () => {
      await expect(judge(noul, items, { engine: "clef", root: dir, cache: false })).rejects.toThrow(/SA_JUDGE_CLEF_MODEL=clef-xl/);
    });
    await withEnv({ ...env, SA_JUDGE_CLEF_MODEL: undefined }, async () => {
      const f = fakeClef(() => ({}), { success: false, errors: [{ code: 7000, message: "No route for that URI" }] });
      await expect(judge(noul, items, { engine: "clef", root: dir, fetch: f.fetch, cache: false })).rejects.toThrow(/Clef error — No route for that URI/);
    });
    expect(J.engineInForce({ SA_JUDGE: "clef" })).toBe("clef");
    expect(J.modelInForce({}, "clef")).toBe("clef");
  });
});

describe("agent engine — the loop closes on a re-run without an answers option (8.118.5)", () => {
  const spec = { id: "rerun", type: "noul" as const, question: "Is it a claim?" };
  const its = [{ id: "a", state: "The cache holds 10 GB." }, { id: "b", state: "See section 4." }];
  const fs = require("fs"), path = require("path"), os = require("os");
  test("the first run writes the worksheet; a re-run applies the fingerprinted answers; changed items get a new worksheet", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "judge-rerun-"));
    const first = await judge(spec, its, { engine: "agent", root: dir });
    expect(first.pending).toContain("rerun.worksheet.md");
    fs.writeFileSync(first.answersFile, JSON.stringify({ worksheet: first.worksheet, answers: { a: 1, b: 0 } }));
    const second = await judge(spec, its, { engine: "agent", root: dir });
    expect(second.pending).toBeUndefined();
    expect(second.answers.a).toMatchObject({ p: 1, by: "agent" });
    expect(second.answers.b).toMatchObject({ p: 0, by: "agent" });
    const changed = await judge(spec, [...its, { id: "c", state: "New." }], { engine: "agent", root: dir });
    expect(changed.pending).toContain("rerun.worksheet.md");                 // stale answers are not applied, never thrown
    fs.writeFileSync(first.answersFile, JSON.stringify({ answers: { a: 1, b: 0 } }));
    expect((await judge(spec, its, { engine: "agent", root: dir })).pending).toBeDefined();   // no fingerprint, no implicit apply
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("agent engine — the worksheet loop", () => {
  const choice = { id: "status", type: "choice", question: "Which status does `item.value` support?", criteria: { Compliant: "Conforms.", Unknown: "Open." } };
  const its = [{ id: "s1", state: { value: "TLS 1.3" } }, { id: "s2", state: { value: "?" } }, { id: "s3", state: { value: "x" } }];
  test("answers:true writes the worksheet with its fingerprint, then reads the answers written beside it", async () => {
    const first = await judge(choice, its, { engine: "agent", root: dir, answers: true });
    expect(first.pending).toMatch(/status\.worksheet\.md$/);
    expect(first.answersFile).toMatch(/status\.answers\.json$/);
    expect(readFileSync(first.pending, "utf8")).toContain(`"worksheet": "${first.worksheet}"`);
    writeFileSync(first.answersFile, JSON.stringify({ worksheet: first.worksheet, answers: { s1: "Compliant", s2: { choice: "Unknown", confidence: 0.55 }, s3: "Partial" } }));
    const second = await judge(choice, its, { engine: "agent", root: dir, answers: true });
    expect(second.answers.s1).toMatchObject({ choice: "Compliant", confidence: 1, by: "agent" });   // a bare key is confident
    expect(second.answers.s2.confidence).toBe(0.55);
    expect(second.unanswered).toEqual(["s3"]);                                                        // not an option it offers
  });
  test("answers written for another worksheet are refused, never applied to changed items", async () => {
    const first = await judge(choice, its, { engine: "agent", root: dir, answers: true });
    writeFileSync(first.answersFile, JSON.stringify({ worksheet: first.worksheet, answers: { s1: "Compliant" } }));
    const changed = [{ id: "s1", state: { value: "TLS 1.2" } }, ...its.slice(1)];
    await expect(judge(choice, changed, { engine: "agent", root: dir, answers: true })).rejects.toThrow(/judge the new worksheet/);
  });
});
