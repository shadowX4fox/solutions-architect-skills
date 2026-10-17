// judge.js — one judge, three providers.
//
// Every place the plugin needs a semantic verdict over candidates code already found — which
// component a prose name refers to, whether a mitigation is in place, whether an ADR changed in
// substance, whether a passage asserts a claim — has the same three stages. Stage 1 (code) cuts the
// candidates and the state each one needs. Stage 2 (this module) answers one typed question per
// item. Stage 3 (code) applies thresholds and writes the receipt. The provider is the only thing
// that changes between engines, and every answer says which one produced it:
//
//   agent     — the session judges. A worksheet is written under .cache/sa-skills/judge/ with the
//               question, the criteria and every item; the answers come back on a second call. The session
//               dispatches the worksheet-judge subagent (agents/reviewers/worksheet-judge.md, Haiku, Read + Write)
//               once per worksheet rather than answering it in its own context (8.133.0): Haiku 5.5 answered the
//               judge's hard set (scripts/judge-hardset/) 65 of 66 against Jev's and Clef's 63, with no wrong answer
//               at a confidence any site acts on.
//               No network, no key, no cost apart from the session's own.
//   typesafe  — Jev over the TypeSafe System One API. Opt-in: the key lives outside the repository
//               (TYPESAFE_API_KEY), the items leave the machine, and the answer is not deterministic
//               between runs, so every answer is cached by content and a re-run over the same
//               items costs nothing and reproduces.
//   clef      — Cloudflare's Clef (`@cf/cloudflare/clef`, Workers AI) over the account's REST endpoint. The same
//               protocol as typesafe — `{ state, model, questions }` in, one answer per question id out, the same
//               noul / choice / score shapes — so it is the same provider with another endpoint, token and model
//               (8.120.0, replacing the claude engine). Credentials from the environment, never a versioned file:
//               CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Workers AI permission). SA_JUDGE_CLEF_MODEL picks
//               the model (`clef`, the one Workers AI serves; `clef-flash` on a local Ollama — CLEF_ENDPOINT=
//               http://localhost:11434/v1/systemone, no token — for development); CLEF_ENDPOINT overrides the URL (a Worker in front, or a test's
//               fake API). CLOUDFLARE_AI_GATEWAY_ID routes the call through that AI Gateway (`cf-aig-gateway-id`
//               header — logs, rate limits, caching on the account's side). Cloudflare wraps the answer in
//               `{ result, success, errors }`, unwrapped here. The bands a
//               caller applies were tuned on Jev, so measure them with `verify` before trusting a cut on Clef.
//
// Question shapes (docs.typesafe.ai/primitives): `noul` returns the probability that a yes/no
// statement holds; `choice` picks one option from a closed set and reports confidence; `score`
// places the item on ordered levels. A choice's options may differ per item (the candidates code
// found for that item) — `item.options` merges over `spec.criteria`, so a resolver hands each cell
// its own candidate list plus the `none` hatch. What never goes to the judge: counts, arithmetic,
// dates, thresholds — those are Stage 3's.
//
// Usage (module):
//   const { judge, applyAnswers, band, verify } = require('<plugin>/scripts/judge.js');
//   const res = await judge(spec, items, { engine: 'typesafe', root });
//   // res.answers[id] → { type, p | choice + probabilities + confidence | score + …, by, cached }
//   // res.pending → worksheet path when engine is `agent` and no answers were supplied
//
// Usage (CLI, for a workflow step): bun scripts/judge.js --spec spec.json --items items.json
//   [--engine agent|typesafe|clef] [--answers answers.json] [--root <project>] [--model <model>]
//   [--chunk 25] [--no-cache]
//
// Which engine: the caller's `engine` option, else the environment's SA_JUDGE, else `agent` (8.71.0) —
// so a project (or a CI job) picks the judge once and every site follows. Unset, each site writes a
// worksheet the session can answer, and until it is answered every item is undecided (every caller handles
// `pending` and reports what it could not decide). There is no fallback provider (8.119.0): the `heuristic`
// engine — each caller's old rule standing in for a judge — is gone, because a rule's guess printed as an
// answer is the silent wrong the judge exists to remove. Code keeps only what is not a judgement: an exact
// name match, a count, a date, a threshold; `/setup` writes SA_JUDGE=agent into the project settings so the default is visible. SA_JUDGE_MODEL overrides the TypeSafe model the same way; the clef engine reads
// SA_JUDGE_CLEF_MODEL (default clef).
// `bun scripts/setup-judge.ts` reports what is in force; /setup runs it.
//
// spec  = { id, type: 'noul'|'choice'|'score', question, criteria?, hi?, lo? }
// item  = { id, state, options? }   — state is the JSON the question refers to; keep it small
// The spec's `question` may point into the item's state with a backticked path: `item.text`.

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const DEFAULTS = { engine: 'agent', model: 'jev-latest', clefModel: 'clef', chunk: 25, hi: 0.85, lo: 0.4, retries: 3, timeoutMs: 60000 };
const ENV = { engine: 'SA_JUDGE', model: 'SA_JUDGE_MODEL', key: 'TYPESAFE_API_KEY', endpoint: 'TYPESAFE_ENDPOINT', clefModel: 'SA_JUDGE_CLEF_MODEL', cfAccount: 'CLOUDFLARE_ACCOUNT_ID', cfToken: 'CLOUDFLARE_API_TOKEN', clefEndpoint: 'CLEF_ENDPOINT', cfGateway: 'CLOUDFLARE_AI_GATEWAY_ID' };   // endpoint: another deployment, or a test's fake API
// Workers AI serves `clef` only: `clef-flash` is refused with "Unsupported model 'clef-flash'. Use 'clef'." (measured 2026-10-02).
// `clef-flash` is the 9B model Ollama serves locally on the same protocol (`http://localhost:11434/v1/systemone`, no
// token) — for development: allowed only when CLEF_ENDPOINT points at a server that is not Cloudflare's.
const CLEF_MODELS = ['clef', 'clef-flash'];
/** Cloudflare's own routes (Workers AI, AI Gateway) need the API token; any other endpoint (a local Ollama) may not. */
const isCloudflare = (endpoint) => /(^|\/\/)([\w.-]+\.)?(api\.cloudflare\.com|gateway\.ai\.cloudflare\.com)(\/|$)/.test(String(endpoint || ''));
/** Why a Clef model cannot run on an endpoint, or null: Workers AI serves `clef` only. */
const clefModelProblem = (model, endpoint) => !CLEF_MODELS.includes(model) ? `must be one of ${CLEF_MODELS.join(' | ')}`
  : model !== 'clef' && (!endpoint || isCloudflare(endpoint)) ? `${model} runs locally (Ollama: CLEF_ENDPOINT=http://localhost:11434/v1/systemone); Workers AI serves clef only` : null;
const WIRE_ID = /^[A-Za-z0-9_.-]{1,100}$/;
/** Clef's REST endpoint: CLEF_ENDPOINT, else the account's Workers AI route; null without an account id. */
const clefEndpointOf = (env = process.env) => env[ENV.clefEndpoint] || (env[ENV.cfAccount] ? `https://api.cloudflare.com/client/v4/accounts/${env[ENV.cfAccount]}/ai/run/@cf/cloudflare/clef` : null);
/** The engine in force when a caller names none: SA_JUDGE, else agent. An unknown value is an error, never a silent fallback. */
const engineInForce = (env = process.env) => { const e = env[ENV.engine]; if (!e) return DEFAULTS.engine; if (REMOVED[e]) throw new JudgeError(`${ENV.engine}=${e} — ${REMOVED[e]}`, 'engine'); if (!ENGINES.includes(e)) throw new JudgeError(`${ENV.engine}=${e} — must be one of ${ENGINES.join(' | ')}`, 'engine'); return e; };
/** The model in force for an engine: typesafe → SA_JUDGE_MODEL or jev-latest; clef → SA_JUDGE_CLEF_MODEL or clef. */
const modelInForce = (env = process.env, engine = 'typesafe') => engine === 'clef' ? env[ENV.clefModel] || DEFAULTS.clefModel : env[ENV.model] || DEFAULTS.model;
const ENGINES = ['agent', 'typesafe', 'clef'];
const REMOVED = {
  heuristic: 'the heuristic engine was removed in 8.119.0 — an item no judge answered is undecided, never guessed; use agent (the default, no key), typesafe or clef',
  claude: 'the claude engine was replaced by clef in 8.120.0 — set SA_JUDGE=clef with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN, or use agent (the default, no key) or typesafe',
};
const TYPES = ['noul', 'choice', 'score'];

class JudgeError extends Error { constructor(message, code) { super(message); this.name = 'JudgeError'; this.code = code; } }

// ─── spec and items ──────────────────────────────────────────────────────────
function checkSpec(spec) {
  if (!spec || typeof spec !== 'object') throw new JudgeError('spec must be an object', 'spec');
  if (!spec.id || !/^[a-z0-9][a-z0-9._-]*$/i.test(spec.id)) throw new JudgeError('spec.id must be a file-safe identifier', 'spec');
  if (!TYPES.includes(spec.type)) throw new JudgeError(`spec.type must be one of ${TYPES.join(' | ')}`, 'spec');
  if (!spec.question) throw new JudgeError('spec.question is required', 'spec');
  if (spec.type === 'score' && !(Array.isArray(spec.criteria) && spec.criteria.length >= 2)) throw new JudgeError('a score spec needs criteria: an ordered array of at least two levels', 'spec');
  return { hi: DEFAULTS.hi, lo: DEFAULTS.lo, ...spec };
}
function checkItems(items) {
  if (!Array.isArray(items) || !items.length) throw new JudgeError('items must be a non-empty array', 'items');
  const seen = new Set();
  for (const it of items) {
    if (!it || !it.id || !/^[a-z0-9][a-z0-9._:-]*$/i.test(String(it.id))) throw new JudgeError('every item needs a file-safe id', 'items');
    if (seen.has(it.id)) throw new JudgeError(`duplicate item id ${it.id}`, 'items');
    seen.add(it.id);
    if (it.state === undefined) throw new JudgeError(`item ${it.id} has no state`, 'items');
  }
  return items;
}
/** The criteria one item is judged against: the spec's, with the item's own options merged over for a choice. */
function criteriaFor(spec, item) {
  if (spec.type === 'choice') {
    const c = { ...(spec.criteria || {}), ...(item.options || {}) };
    if (!Object.keys(c).length) throw new JudgeError(`item ${item.id}: a choice needs criteria or item.options`, 'items');
    if (Object.keys(c).length > 255) throw new JudgeError(`item ${item.id}: a choice takes at most 255 options`, 'items');
    return c;
  }
  return spec.criteria;
}
/** One request-ready question per item; the item is addressed by its path inside the batch state. */
function questionFor(spec, item) {
  const q = { type: spec.type, instructions: { item: `items.${item.id}`, question: spec.question } };
  const c = criteriaFor(spec, item);
  if (c !== undefined && c !== null) q.criteria = c;
  return q;
}

// ─── cache ───────────────────────────────────────────────────────────────────
const stable = (v) => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x)) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x);
const cacheKey = (model, spec, item, shared) => crypto.createHash('sha256').update(stable({ model, type: spec.type, question: spec.question, criteria: criteriaFor(spec, item), state: item.state, shared: shared === undefined ? null : shared })).digest('hex');
const cacheDirOf = (opts) => opts.cacheDir || path.join(opts.root || process.cwd(), '.cache', 'sa-skills', 'judge');
function loadCache(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } }
function saveCache(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); }

// ─── answers ─────────────────────────────────────────────────────────────────
/** One shape whatever the provider: noul → p; choice → choice, probabilities, confidence; score → score, probabilities, confidence. */
function normalize(spec, raw, by) {
  const a = { type: spec.type, by };
  if (raw == null) return a;
  if (spec.type === 'noul') {
    const v = typeof raw === 'number' ? raw : typeof raw === 'object' ? (raw.noul ?? raw.p ?? raw.value ?? raw.probability) : /^(s[ií]|yes|true|1)$/i.test(String(raw).trim()) ? 1 : /^(no|false|0)$/i.test(String(raw).trim()) ? 0 : NaN;
    if (typeof v !== 'number' || Number.isNaN(v)) throw new JudgeError(`noul answer is not a number: ${JSON.stringify(raw)}`, 'answer');
    a.p = v > 1 ? v / 100 : v; return a;
  }
  if (spec.type === 'choice') {
    if (typeof raw === 'string') { a.choice = raw; return a; }
    a.choice = raw.choice; a.probabilities = raw.probabilities; a.confidence = raw.confidence;
    if (a.choice === undefined) throw new JudgeError(`choice answer carries no choice: ${JSON.stringify(raw)}`, 'answer');
    return a;
  }
  const s = typeof raw === 'number' ? raw : raw.score;
  if (typeof s !== 'number') throw new JudgeError(`score answer is not a number: ${JSON.stringify(raw)}`, 'answer');
  a.score = s; if (typeof raw === 'object') { a.probabilities = raw.probabilities; a.confidence = raw.confidence; a.legend = raw.legend; }
  return a;
}
/** The number Stage 3 thresholds: p for a noul, confidence for a choice or score. */
const value = (a) => a.p ?? a.confidence ?? (typeof a.score === 'number' ? a.score : NaN);
/** Three bands over one number. Callers name them (block / review / drop, act / confirm / hold). */
const band = (v, hi = DEFAULTS.hi, lo = DEFAULTS.lo) => (v >= hi ? 'high' : v >= lo ? 'mid' : 'low');

// ─── providers ───────────────────────────────────────────────────────────────
/** The subagent the session dispatches, one per worksheet, to answer it (8.133.0). */
const WORKSHEET_JUDGE = 'sa-skills:reviewers:worksheet-judge';
const worksheetPath = (spec, opts) => path.join(cacheDirOf(opts), `${spec.id}.worksheet.md`);
/** Where the session writes its answers: beside the worksheet. The agent engine reads it from there on a re-run; `opts.answers === true` also refuses a stale one. */
const answersPath = (spec, opts) => path.join(cacheDirOf(opts), `${spec.id}.answers.json`);
/** The worksheet's fingerprint — the spec and every item's id, options and state. Answers written for another fingerprint are stale. */
const itemsHash = (spec, items) => crypto.createHash('sha256').update(stable({ q: spec.question, t: spec.type, c: spec.criteria || null, items: items.map((it) => [it.id, it.options || null, it.state]) })).digest('hex').slice(0, 16);
function renderState(state) {
  if (typeof state === 'string') return '```md\n' + state + '\n```';
  if (state && typeof state === 'object' && typeof state.text === 'string') {
    const rest = Object.fromEntries(Object.entries(state).filter(([k]) => k !== 'text'));
    return (Object.keys(rest).length ? '`' + stable(rest) + '`\n\n' : '') + '```md\n' + state.text + '\n```';
  }
  return '```json\n' + JSON.stringify(state, null, 1) + '\n```';
}
function answerFormat(spec) {
  if (spec.type === 'noul') return 'Answer every id with `1` (yes) or `0` (no), or a probability between them: `"<id>": 1`.';
  if (spec.type === 'choice') return 'Answer every id with the key of the chosen option — `"<id>": "<option>"` — or, when you are not sure, with your confidence too: `"<id>": {"choice": "<option>", "confidence": 0.6}`. A bare key counts as confident.';
  return 'Answer every id with the level number (0 is the first level) — `"<id>": 0` — or `"<id>": {"score": 0, "confidence": 0.6}` when you are not sure. A bare number counts as confident.';
}
function runAgent(spec, items, opts) {
  const file = worksheetPath(spec, opts), hash = itemsHash(spec, items), out = answersPath(spec, opts);
  const crit = spec.type === 'noul' ? (spec.criteria ? [`- **Yes** means: ${spec.criteria.true}`, `- **No** means: ${spec.criteria.false}`] : [])
    : spec.type === 'choice' ? (spec.criteria ? Object.entries(spec.criteria).map(([k, v]) => `- \`${k}\`${v ? ` — ${typeof v === 'string' ? v : stable(v)}` : ''}`) : ['(each item lists its own options)'])
    : spec.criteria.map((l, i) => `- \`${i}\` — ${typeof l === 'string' ? l : stable(l)}`);
  const body = [
    `# Judgment worksheet — ${spec.id}`, '',
    `> Answered by the \`${WORKSHEET_JUDGE}\` subagent: the session dispatches one per worksheet (several in one message), giving it this file's path.`, '',
    `**Question, one per item:** ${spec.question}`, '',
    ...crit, '',
    answerFormat(spec), 'Judge only. Correct nothing here: this decides what gets looked at.', '',
    `Write the answers to \`${out}\` as JSON: \`{"worksheet": "${hash}", "answers": {"<id>": …}}\` — the fingerprint ties them to this worksheet; answers written for another one are refused.`, '',
    `${items.length} items.`, '', '---', '',
    ...items.map((it) => [
      `### ${it.id}`,
      it.options ? 'Options: ' + Object.entries(it.options).map(([k, v]) => `\`${k}\`${v ? ` (${typeof v === 'string' ? v : stable(v)})` : ''}`).join(' · ') : '',
      '', renderState(it.state), '',
    ].join('\n')),
  ].join('\n');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
  return { engine: 'agent', pending: file, answersFile: out, worksheet: hash, answers: {}, dispatch: WORKSHEET_JUDGE };
}
/**
 * The agent loop closes on a re-run without the caller's help (8.118.5): answers the session wrote beside the worksheet,
 * fingerprinted for exactly these items, are applied. A caller that passed no `answers` option re-ran its command and
 * got the same worksheet back, answers ignored (prose-check, principle-check, traceability, BIAN). Answers without the
 * fingerprint, for other items, or naming none of these ids are not applied — the worksheet is written again.
 */
function answersOnDisk(spec, items, opts) {
  const f = answersPath(spec, opts);
  if (!fs.existsSync(f)) return null;
  let raw; try { raw = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
  if (!raw || raw.worksheet !== itemsHash(spec, items)) return null;
  try { return applyAnswers(spec, items, raw); } catch (e) { if (e.name === 'JudgeError') return null; throw e; }
}
/** Closes the agent loop: the answers the session wrote, one per item id. Unanswered items are reported, never defaulted. */
function applyAnswers(spec, items, source) {
  const raw = typeof source === 'string' ? JSON.parse(fs.readFileSync(source, 'utf8')) : source;
  // stale answers — written for a worksheet whose items have since changed — are refused, never applied to the new items
  if (raw && raw.worksheet && raw.worksheet !== itemsHash(spec, items)) throw new JudgeError(`the answers were written for worksheet ${raw.worksheet}; these items are ${itemsHash(spec, items)} — judge the new worksheet`, 'stale');
  const map = raw.answers ?? raw;
  const answers = {}, unanswered = [];
  for (const it of items) {
    if (!(it.id in map)) { unanswered.push(it.id); continue; }
    const a = normalize(spec, map[it.id], 'agent');
    if ((spec.type === 'choice' || spec.type === 'score') && a.confidence == null) a.confidence = 1;   // a bare key is the session's deliberate choice
    if (spec.type === 'choice' && !Object.keys(criteriaFor(spec, it)).includes(a.choice)) { unanswered.push(it.id); continue; }   // an option the item does not offer is no answer
    answers[it.id] = a;
  }
  if (!Object.keys(answers).length) throw new JudgeError(`none of the ${items.length} item ids appears in the answers`, 'answers');
  return { engine: 'agent', answers, unanswered };
}

/** The two System One providers: the same request and answer, another endpoint, credential and model. */
function providerOf(engine, opts) {
  if (engine === 'clef') {
    const endpoint = opts.endpoint || clefEndpointOf(), key = opts.apiKey || process.env[ENV.cfToken], model = opts.model || modelInForce(process.env, 'clef');
    if (!endpoint || (!key && isCloudflare(endpoint))) throw new JudgeError(`the clef engine needs ${ENV.cfAccount} and ${ENV.cfToken} (set them in the environment, never in a versioned file), a local CLEF_ENDPOINT, or --engine agent`, 'key');
    const problem = clefModelProblem(model, endpoint);
    if (problem) throw new JudgeError(`${ENV.clefModel}=${model} — ${problem}`, 'engine');
    const gateway = opts.gateway ?? process.env[ENV.cfGateway];
    return { engine, label: 'Clef', endpoint, key, model, headers: gateway ? { 'cf-aig-gateway-id': gateway } : {} };
  }
  const key = opts.apiKey || process.env[ENV.key];
  if (!key) throw new JudgeError(`the typesafe engine needs ${ENV.key} (set it in the environment, never in a versioned file), or use --engine agent`, 'key');
  return { engine, label: 'TypeSafe', endpoint: opts.endpoint || process.env[ENV.endpoint] || ENDPOINT, key, model: opts.model || modelInForce() };
}
async function post(body, pv, opts, attempt = 0) {
  const doFetch = opts.fetch || globalThis.fetch;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), opts.timeoutMs || DEFAULTS.timeoutMs) : null;
  let r;
  try {
    r = await doFetch(pv.endpoint, { method: 'POST', headers: { ...(pv.key ? { Authorization: `Bearer ${pv.key}` } : {}), 'Content-Type': 'application/json', ...(pv.headers || {}) }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined });
  } catch (e) {
    if (attempt < (opts.retries ?? DEFAULTS.retries)) { await sleep(2 ** attempt * 1000, opts); return post(body, pv, opts, attempt + 1); }
    throw new JudgeError(`${pv.label} request failed: ${e.message}`, 'network');
  } finally { if (timer) clearTimeout(timer); }
  if (r.ok) {
    const j = await r.json();
    // Cloudflare's envelope: { result, success, errors, messages }
    if (j && typeof j === 'object' && 'success' in j && 'result' in j) {
      if (!j.success) throw new JudgeError(`${pv.label} error — ${(j.errors || []).map((e) => e.message || JSON.stringify(e)).join('; ').slice(0, 300)}`, 'http');
      return j.result;
    }
    return j;
  }
  if ([429, 500, 502, 503, 504, 529].includes(r.status) && attempt < (opts.retries ?? DEFAULTS.retries)) { await sleep(2 ** attempt * 1000, opts); return post(body, pv, opts, attempt + 1); }
  const text = await r.text().catch(() => '');
  throw new JudgeError(`${pv.label} HTTP ${r.status} — ${text.slice(0, 300)}`, 'http');
}
const sleep = (ms, opts) => (opts.sleep ? opts.sleep(ms) : new Promise((s) => setTimeout(s, ms)));

/**
 * Clef's own `confidence` on a choice or a score sits far below the probability it gives the option it chose (0.19 at
 * 0.58, 0.59 at 0.85 — measured 2026-10-02 against the reference fixtures), so cuts tuned on Jev's confidence left right
 * answers undecided. For clef the confidence Stage 3 reads is that probability; Clef's own figure stays as `clef_confidence`.
 */
function calibrate(engine, a) {
  if (engine !== 'clef' || !a || !a.probabilities || (a.type !== 'choice' && a.type !== 'score')) return a;
  const key = a.type === 'choice' ? a.choice : String(Math.round(a.score));
  const p = a.probabilities[key];
  return typeof p === 'number' ? { ...a, clef_confidence: a.confidence, confidence: p } : a;
}
/**
 * One item per request, for both model judges (8.120.4). Batched, an answer moved with the other items in the request:
 * Clef read a fixture UNKNOWN alone and FAIL at 0.48 in a batch of five; Jev answered the same UNKNOWN fixture at ≥ 0.95
 * alone and at 0.39–0.71 batched, varying run to run — and an unchanged question fell under the band when an edit
 * elsewhere in its domain reshuffled its batch (measured 2026-10-03 on the compliance rubric's fixtures: alone, Jev 92/92
 * and stable). One item per request makes an answer a property of its item; the requests run CONCURRENCY at a time.
 * `opts.chunk` is ignored for that reason.
 */
const CONCURRENCY = 6;
async function runSystemOne(engine, spec, items, opts) {
  const pv = providerOf(engine, opts), model = pv.model, chunk = 1;
  const cacheFile = path.join(cacheDirOf(opts), `${spec.id}.cache.json`);
  const cache = opts.cache === false ? {} : loadCache(cacheFile);
  const answers = {}, todo = [];
  let hits = 0, requests = 0, usage = { input_tokens: 0, output_tokens: 0 };
  for (const it of items) {
    const k = cacheKey(model, spec, it, opts.shared);
    if (cache[k]) { answers[it.id] = { ...calibrate(engine, normalize(spec, cache[k].answer, cache[k].model || model)), cached: true }; hits++; }
    else todo.push({ it, k });
  }
  const lots = []; for (let i = 0; i < todo.length; i += chunk) lots.push(todo.slice(i, i + chunk));
  const ask = async (lot) => {
    // `shared`: state every item of the batch reads (an initiative brief, a policy) — sent once per request, referenced
    // from a question as `shared.<field>`, part of every cache key
    const state = Object.assign(opts.shared !== undefined ? { shared: opts.shared } : {}, { items: {} }), questions = {};
    // the id on the wire: Clef validates question ids against ^[A-Za-z0-9_.-]{1,100}$ and a resolver's ids carry `:`
    // ("I-06:to::1"), so an id outside that set travels as a positional alias and is mapped back (8.120.1)
    const wire = new Map(lot.map(({ it }, n) => [it.id, pv.engine !== 'clef' || (WIRE_ID.test(it.id) && !lot.some((o, m) => m !== n && `q${m}` === it.id)) ? it.id : `q${n}`]));
    for (const { it } of lot) { const w = wire.get(it.id); state.items[w] = it.state; questions[w] = questionFor(spec, { ...it, id: w }); }
    const res = await post({ state, model, questions }, pv, opts); requests++;
    const got = res.answers ?? res;
    if (res.usage) { usage.input_tokens += res.usage.input_tokens || 0; usage.output_tokens += res.usage.output_tokens || 0; }
    for (const { it, k } of lot) {
      const w = wire.get(it.id);
      if (!(w in got)) throw new JudgeError(`${pv.label} answered without item ${it.id}`, 'answer');
      answers[it.id] = calibrate(engine, normalize(spec, got[w], res.model || model));
      if (opts.cache !== false) cache[k] = { model: res.model || model, answer: got[w], at: new Date().toISOString() };
    }
  };
  const width = opts.concurrency || CONCURRENCY;
  for (let i = 0; i < lots.length; i += width) {
    await Promise.all(lots.slice(i, i + width).map(ask));
    if (opts.cache !== false) saveCache(cacheFile, cache);
  }
  return { engine, model, answers, cached: hits, requests, usage };
}

// ─── the judge ───────────────────────────────────────────────────────────────
/**
 * judge(spec, items, opts) → { engine, answers, ranked?, pending?, unanswered?, cached?, requests?, usage? }
 * opts: engine · root · cacheDir · model · chunk · apiKey · answers (path or object, closes the agent loop) · fetch · cache:false
 */
async function judge(spec, items, opts = {}) {
  spec = checkSpec(spec); checkItems(items);
  const engine = opts.engine || engineInForce();
  if (REMOVED[engine]) throw new JudgeError(REMOVED[engine], 'engine');
  if (!ENGINES.includes(engine)) throw new JudgeError(`engine must be one of ${ENGINES.join(' | ')}`, 'engine');
  if (opts.answers === true) {   // read the answers the session wrote beside the worksheet, or write the worksheet when there are none yet
    const f = answersPath(spec, opts);
    if (!fs.existsSync(f)) return runAgent(spec, items, opts);
    return applyAnswers(spec, items, f);
  }
  if (opts.answers) return applyAnswers(spec, items, opts.answers);
  if (engine === 'agent') return answersOnDisk(spec, items, opts) || runAgent(spec, items, opts);
  return runSystemOne(engine, spec, items, opts);
}

/**
 * Measures answers against fixtures: [{ id, label: 1|0, note? }] keyed by item id (the caller maps
 * file:line to ids). `unseen` is a Stage 1 failure — the item never reached the judge — and is
 * reported apart from the judge's own misses, because it is fixed in the recall, never in the judge.
 * For a choice, label is the expected option; for a score, the expected level.
 */
function verify(spec, fixtures, answers, { hi = spec.hi ?? DEFAULTS.hi } = {}) {
  const r = { tp: 0, fn: [], fp: [], unseen: [], total: 0 };
  const positive = (a) => (spec.type === 'noul' ? value(a) >= hi : true);
  const expected = (f, a) => (spec.type === 'noul' ? Number(f.label) === 1 : spec.type === 'choice' ? a.choice === f.label : Math.round(a.score) === Number(f.label));
  for (const f of fixtures || []) {
    const a = answers[f.id];
    if (spec.type === 'noul' && Number(f.label) !== 1) { if (a && positive(a)) r.fp.push({ ...f, value: value(a) }); continue; }
    r.total++;
    if (!a) { r.unseen.push(f); continue; }
    if (spec.type === 'noul' ? positive(a) : expected(f, a)) r.tp++; else r.fn.push({ ...f, value: value(a), got: a.choice ?? a.score ?? a.p });
  }
  return r;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
function cli(argv) {
  const o = { engine: engineInForce(), root: process.cwd(), cache: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === '--spec') o.spec = next(); else if (a === '--items') o.items = next(); else if (a === '--engine') o.engine = next();
    else if (a === '--answers') o.answers = next(); else if (a === '--root') o.root = next(); else if (a === '--model') o.model = next();
    else if (a === '--chunk') o.chunk = +next(); else if (a === '--no-cache') o.cache = false;
    else throw new JudgeError(`unknown argument ${a}`, 'cli');
  }
  if (!o.spec || !o.items) throw new JudgeError('usage: judge.js --spec <spec.json> --items <items.json> [--engine agent|typesafe|clef] [--answers <answers.json>] [--root <project>] [--model] [--chunk] [--no-cache]', 'cli');
  return o;
}
async function main() {
  const o = cli(process.argv.slice(2));
  const spec = JSON.parse(fs.readFileSync(o.spec, 'utf8')), items = JSON.parse(fs.readFileSync(o.items, 'utf8'));
  const res = await judge(spec, items, o);
  process.stdout.write(JSON.stringify(res, null, 1) + '\n');
  if (res.pending) process.stderr.write(`Worksheet written to ${res.pending}\nDispatch the ${WORKSHEET_JUDGE} subagent with that path, then run again with --answers ${res.answersFile}.\n`);
}

module.exports = { judge, calibrate, applyAnswers, verify, band, value, normalize, questionFor, criteriaFor, cacheKey, worksheetPath, answersPath, itemsHash, engineInForce, modelInForce, clefEndpointOf, clefModelProblem, isCloudflare, providerOf, WORKSHEET_JUDGE, JudgeError, ENGINES, CLEF_MODELS, TYPES, DEFAULTS, ENV, ENDPOINT };

if (require.main === module) main().catch((e) => { process.stderr.write(`${e.message}\n`); process.exit(e.code === 'key' || e.code === 'sdk' ? 3 : e.code === 'http' || e.code === 'network' ? 4 : 2); });
