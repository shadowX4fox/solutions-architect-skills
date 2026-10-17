#!/usr/bin/env bun
// po-spec-coherence.js — can the gathered requirements be built as they stand? The coherence gate of a PO Spec.
//
//   bun po-spec-coherence.js <PRODUCT_OWNER_SPEC.md> [--judge agent|typesafe|clef] [--answers] [--sa-skills <dir>] [--json]
//
// The checkability rule (po-spec-checkability.js) reads one statement at a time. These evals read the spec against
// itself, and each blocking finding blocks Ready whatever the score:
//
//   label        a solution label the spec claims ("agentic", "real-time", "omnichannel" … — references/
//                solution-labels.json) that no use case exercises. The judge asks, per (label, use case), whether the use
//                case requires the label's defining capability. Blocking: drop the claim, or add the use case.
//   trace        the triangle objectives ↔ use cases ↔ metrics. The judge asks whether each use case serves each objective
//                and whether each metric measures each objective. Blocking: an objective no use case serves, an objective
//                no metric measures. Warning: a use case that serves no objective (scope creep), a metric that measures
//                none.
//   acceptance   one Given / When / Then test per use case, written by the acceptance-test-writer subagent from the use
//                case's own words, with the facts it would have had to invent listed apart; the judge then checks every
//                clause against the use case, and every fact the writer lists as missing against all the use cases (one
//                writer pass is noisy — a dismissed one becomes a question), then each confirmed one alone: a business
//                fact, or a detail a test takes as given (a clock, a polling interval, where data lives) — a detail
//                becomes a question too. Blocking: a use case whose test needs a confirmed missing business fact.
//                Warning: a clause the use case does not state (the test assumes it).
//   closure      every state a use case names and every trigger, against all the use cases. The judge asks, per state,
//                whether the sentences naming it read its records from another system and whether a step puts an item
//                into it (either closes it) and, per trigger, whether it can happen as they stand. Blocking: a state no use case sets, a trigger no use case produces
//                — on a confident no; an uncertain answer warns.
//   conflict     every use case against every other use case, every business constraint and every out-of-scope item.
//                The judge asks, per pair, whether both can hold as written. Blocking: a pair where meeting one makes
//                the other impossible — on a confident no; an uncertain answer warns.
//   sizing       the numbers, by code: an objective's baseline / target (or its ratio — halve, double, by N%) against
//                the metric that measures it; a use case's acceptance limit against the target of the objective it
//                serves, in the same unit, once the judge confirms both measure the same quantity. Warnings only —
//                a Product Owner's figures are often estimates.
//
// Every judgement is one question through sa-skills' judge (scripts/judge.js): code finds the candidates and decides;
// an answer under 0.6 is never applied; an unanswered item is undecided and the gate stays open (PENDING).
// Exit: 0 PASS (warnings allowed) · 1 FAIL (a blocking finding) · 10 PENDING (a worksheet or the test request waits).
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { parseSpec, plain } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'po-spec.js'));
const CK = require('./po-spec-checkability.js');
const LABELS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'references', 'solution-labels.json'), 'utf8')).labels;
const HI = 0.6, LO = 0.4;
const TEST_WRITER = 'sa-requirements:generators:acceptance-test-writer';

const Q = {
  label: { id: 'coherence-label', type: 'noul', hi: HI, question: 'Does the use case `item.use_case` require the system to do this: `item.capability`?',
    criteria: { true: 'A step, the trigger or the outcome of the use case needs this capability; the use case cannot be carried out as written without it.', false: 'The use case can be carried out as written without this capability — it is not asked for, or only a weaker version is.' } },
  serves: { id: 'coherence-serves', type: 'noul', hi: HI, question: 'Does carrying out the use case `item.use_case` contribute directly to the objective `item.objective`?',
    criteria: { true: 'The use case delivers part of what the objective asks: without it the objective is not reached, or is reached worse.', false: 'The use case is unrelated to the objective, or helps it only incidentally.' } },
  measures: { id: 'coherence-measures', type: 'noul', hi: HI, question: 'Does the metric `item.metric` measure progress toward the objective `item.objective`?',
    criteria: { true: 'The metric moves when the objective is being achieved — the same outcome, its rate, its time or its cost.', false: 'The metric measures something else.' } },
  clause: { id: 'coherence-clause', type: 'noul', hi: HI, question: 'Is the test clause `item.clause` stated in, or directly implied by, the use case `item.use_case`?',
    criteria: { true: 'Every name, value, rule and result in the clause appears in the use case or follows from it without a guess.', false: 'The clause adds a value, a rule, a system, a limit or a result the use case does not give.' } },
  missing: { id: 'coherence-missing', type: 'noul', hi: HI, question: 'Does the use case `item.use_case` depend on this fact that no use case in `item.use_cases` gives: `item.missing`?',
    criteria: { true: 'The use case names or relies on this fact — a rule, a value, a list, an actor, a result — no use case states it, and the behaviour the use case states cannot be checked without it.', false: 'A use case states it, possibly in other words or in another use case; or it is an edge case the use case never mentions; or it is a design detail a test can take as given — where or how data is stored, linked or looked up, which component does a step, how a measure is timed.' } },
  // a missing fact blocks only when it is also a business fact: asked alone, a detail (a clock, a polling interval, where
  // a time limit starts) came back confirmed on every Spanish clean run for both API judges
  kind: { id: 'coherence-missing-kind', type: 'noul', hi: HI, question: 'Is `item.missing` a business fact the Product Owner must decide?',
    criteria: { true: 'A rule the system applies, a value or a list of options it uses, a message or result the user gets, or what happens in a case the use case names.', false: 'An operating or design detail a test can take as given: where or how data is stored, linked or looked up; who maintains reference data; which component or actor performs a step; how often the system checks; which clock, time zone or day boundary applies; where a measured time starts or ends.' } },
  // a state is closed when its records come from another system (asked over the sentences that name it) or a step sets it
  origin: { id: 'coherence-state-origin', type: 'noul', hi: HI, question: 'Do these sentences read the records that carry the state `item.state` from another system, rather than create them: `item.mentions`?',
    criteria: { true: 'The use cases read, fetch or receive these records from a system they name as outside the one being specified; that system keeps the state.', false: "The records are the system's own: a use case creates them, or nothing says where they come from." } },
  setter: { id: 'coherence-state-setter', type: 'noul', hi: HI, question: 'Does a step of the use cases `item.use_cases` put an item into the state `item.state`?',
    criteria: { true: 'A step, a postcondition or an outcome creates the item in this state or changes it to this state — by an actor action or by the system.', false: 'No step, postcondition or outcome leaves an item in this state; the use cases only show, check or list it — a list of the states an item can have sets none of them.' } },
  trigger: { id: 'coherence-trigger', type: 'noul', hi: HI, question: 'Can the trigger `item.trigger` of `item.use_case` happen as the use cases `item.use_cases` stand?',
    criteria: { true: "It is something a person or an outside party does (a customer, an employee, another organization — whether or not the use case lists them as its actor), a time or a schedule, or something one of the use cases produces.", false: 'It depends on something the system itself must produce — a message it sends, a link, a record or a state — that no use case produces.' } },
  conflict: { id: 'coherence-conflict', type: 'noul', hi: HI, question: 'Can `item.a` and `item.b` both hold as written?',
    criteria: { true: 'One system can meet both at the same time, exactly as each is written: they concern different things, or they agree.', false: 'Meeting one breaks the other as written: one requires, allows or promises what the other forbids, refuses, limits or puts out of scope.' } },
  same: { id: 'coherence-same-measure', type: 'noul', hi: HI, question: 'Does the acceptance criterion `item.criterion` of `item.use_case` measure the same quantity as the objective `item.objective`?',
    criteria: { true: 'Both put a number on the same thing — the same activity, the same outcome — so one can be compared with the other.', false: 'They measure different things that happen to share a unit.' } },
};

// ---- sizing: numbers by code ------------------------------------------------------------------------------------------
const UNIT = [[/^(?:min|mins|minute|minutes|minuto|minutos)$/i, 'min'], [/^(?:s|sec|secs|second|seconds|segundo|segundos)$/i, 's'], [/^(?:h|hr|hrs|hour|hours|hora|horas)$/i, 'h'], [/^(?:day|days|día|días|dia|dias)$/i, 'd'], [/^%$/, '%']];
const unitOf = (u) => { for (const [re, n] of UNIT) if (re.test(u || '')) return n; return ''; };
const num = (x) => Number(String(x).replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
const QTY = String.raw`(\d+(?:[.,]\d+)?)\s*(%|[\p{L}]+)?`;
/** An objective's numbers: from X to Y (de X a Y), or a ratio of the baseline. */
function goalOf(text) {
  const t = plain(text), m = t.match(new RegExp(String.raw`\b(?:from|de|del)\s+` + QTY + String.raw`\s+(?:to|a|al)\s+` + QTY, 'iu'));
  if (m) { const u = unitOf(m[2]) || unitOf(m[4]); return { baseline: num(m[1]), target: num(m[3]), unit: u }; }
  if (/\b(?:halve|half|a la mitad)\b/i.test(t)) return { factor: 0.5 };
  if (/\b(?:double|duplicar|duplicate)\b/i.test(t)) return { factor: 2 };
  const p = t.match(/\b(reduce|cut|lower|decrease|reducir|disminuir|bajar|increase|grow|raise|aumentar|incrementar|crecer)\b[^.]*?\b(?:by|en)\s+(?:un\s+)?(\d+(?:[.,]\d+)?)\s*%/i);
  if (p) return { factor: /^(?:reduce|cut|lower|decrease|reducir|disminuir|bajar)$/i.test(p[1]) ? 1 - num(p[2]) / 100 : 1 + num(p[2]) / 100 };
  return null;
}
/** A KPI row's numbers: the first and the last cell that start with a number. */
function rowOf(text) {
  const cells = String(text).split(/\s+·\s+|\s*\|\s*/).map((c) => c.trim()).filter(Boolean), q = [];
  for (const c of cells.slice(1)) { const m = c.match(new RegExp('^' + QTY, 'u')); if (m) q.push({ v: num(m[1]), unit: unitOf(m[2]) }); }
  return q.length >= 2 ? { baseline: q[0].v, target: q[q.length - 1].v, unit: q[0].unit || q[q.length - 1].unit } : null;
}
/** An acceptance limit: under / within / less than N unit. */
function limitOf(text) {
  const m = plain(text).match(new RegExp(String.raw`\b(?:under|within|less than|in less than|at most|menos de|en menos de|como máximo|hasta)\s+` + QTY, 'iu'));
  return m && unitOf(m[2]) ? { v: num(m[1]), unit: unitOf(m[2]) } : null;
}
const near = (a, b) => Math.abs(a - b) <= Math.max(1e-9, 0.01 * Math.max(Math.abs(a), Math.abs(b)));

// ---- stage 1: what the spec states ------------------------------------------------------------------------------------
const NOT_CLAIMS = /<!--\s*SECTION:\s*(?:Aspirations|Out of Scope|Appendix|Open Questions|Risks|Assumptions|References|Sync Log)\s*-->|^#{2,4}\s+(?:Aspirations|Aspiraciones|Out of Scope|Fuera de Alcance|Appendix|Ap[ée]ndice)\b/i;
const UC_LABELS = { en: ['Description', 'Actors', 'Trigger', 'Preconditions', 'Primary flow', 'Alternative flows', 'Edge cases', 'Postconditions', 'Acceptance criteria', 'Success metrics'],
  es: ['Descripción', 'Actores', 'Disparador', 'Precondiciones', 'Flujo principal', 'Flujos alternativos', 'Casos límite', 'Postcondiciones', 'Criterios de aceptación', 'Métricas de éxito'] };
// the judge reads a use case labelled in the spec's own language — a mixed-language state moves its answers
function ucText(uc, lang = 'en') {
  const L = UC_LABELS[lang] || UC_LABELS.en, f = uc.fields, part = (k, l) => (f[k] || []).filter((x) => !/^\[.*\]$/.test(plain(x))).map((x) => plain(x.replace(/^(?:[-*+]|\d+[.)])\s+/, ''))).filter(Boolean);
  const bits = ['description', 'actor', 'trigger', 'preconditions', 'primaryFlow', 'alternativeFlows', 'edgeCases', 'postconditions', 'acceptanceCriteria', 'successMetrics']
    .map((k, i) => [L[i], k]).map(([l, k]) => { const v = part(k); return v.length ? `${l}: ${v.join(' | ')}` : null; }).filter(Boolean);
  return `${uc.id} ${uc.name}. ${bits.join('. ')}`;
}
/** The statements of a requirement section's H3 blocks, by anchor or visible name, skipping the named ones. */
function blockStatements(lines, sectionAnchor, { only = null, skip = [] } = {}) {
  const sec = CK.SECTIONS.find((s) => s.anchor === sectionAnchor); const r = sec && CK.sectionLines(lines, sec); if (!r) return [];
  const body = lines.slice(r.start + 1, r.end), out = []; let cur = null, buf = [], bufStart = r.start + 1;
  const flush = () => { const keep = only ? only.test(cur || '') : !skip.some((re) => re.test(cur || '')); if (keep) out.push(...CK.statementsOf(buf, bufStart)); };
  body.forEach((l, k) => { if (/^###\s/.test(l)) { flush(); cur = l; buf = []; bufStart = r.start + 1 + k + 1; } else buf.push(l); });
  flush();
  return out;
}
// the states a use case names: capitalized values right after "status" / "estado", quoted text removed
const STATE_RE = /\b(?:status|state|estado)(?:\s*:|\s+changes\s+(?:from|to)|\s+(?:cambia|pasa)\s+(?:de|a))?\s+(\p{Lu}[\p{L}-]*(?:(?:\s*,\s*|\s+(?:or|and|to|o|y|a)\s+)\p{Lu}[\p{L}-]*)*)/gu;
function statesOf(text) {
  const out = [];
  for (const m of text.replace(/"[^"]*"|“[^”]*”|«[^»]*»/g, ' ').matchAll(STATE_RE)) for (const w of m[1].split(/\s*,\s*|\s+(?:or|and|to|o|y|a)\s+/u)) if (w) out.push(w);
  return out;
}
/** The bullet items under the Out of Scope heading (anchor or visible name, any level). */
function outOfScope(lines) {
  const i = lines.findIndex((l) => /^#{2,4}\s/.test(l) && (/<!--\s*SECTION:\s*Out of Scope\s*-->/.test(l) || /^#{2,4}\s+(?:\d+(?:\.\d+)*\.?\s+)?(?:Out of Scope|Fuera de Alcance)\b/i.test(l)));
  if (i < 0) return [];
  const out = [];
  for (let k = i + 1; k < lines.length && !/^#{1,4}\s/.test(lines[k]); k++) { const m = lines[k].match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/); if (m && plain(m[1]).trim()) out.push({ text: plain(m[1]).trim(), line: k + 1 }); }
  return out;
}
function extract(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const { useCases } = parseSpec(lines.join('\n'));
  const goals = /Primary Business Goals|Objetivos Principales/i;
  let objectives = blockStatements(lines, 'Business Objectives', { only: goals });
  if (!objectives.length) objectives = blockStatements(lines, 'Business Objectives', { skip: [/Success Criteria|Criterios de [ÉE]xito/i, /ROI|Retorno/i, /Timeline|Cronograma/i] });
  const metrics = [...blockStatements(lines, 'Business Objectives', { only: /Success Criteria|Criterios de [ÉE]xito/i }), ...blockStatements(lines, 'Success Metrics and KPIs', { skip: [/Measurement Approach|Enfoque de Medici[óo]n/i] })];
  // the claims: every line outside the appendix, aspirations and out-of-scope, comments removed
  const claims = []; let h2Off = false, h3Off = false;
  lines.forEach((l, i) => {
    if (/^#{1,2}\s/.test(l)) { h2Off = NOT_CLAIMS.test(l); h3Off = false; }   // a new H1/H2 resets both levels
    else if (/^#{3,4}\s/.test(l)) h3Off = NOT_CLAIMS.test(l);
    if (h2Off || h3Off) return;
    const t = l.replace(/<!--[\s\S]*?-->/g, '');
    for (const lab of LABELS) { const m = t.match(new RegExp(lab.find, 'i')); if (m) { const c = claims.find((x) => x.id === lab.id); if (c) c.count++; else claims.push({ id: lab.id, name: lab.name, capability: lab.capability, line: i + 1, quote: plain(t).slice(0, 160), count: 1 }); } }
  });
  const lang = /<!--\s*SECTION:\s*Use Cases\s*-->/.test(text) && /^##\s+\d*\.?\s*Casos de Uso\b/m.test(text) ? 'es' : 'en';
  const ucs = useCases.map((u) => ({ id: u.id, name: u.name, text: ucText(u), judgeText: ucText(u, lang), trigger: (u.fields.trigger || []).map((x) => plain(x)).join(' ').trim(), acceptance: (u.fields.acceptanceCriteria || []).map((x) => plain(x.replace(/^(?:[-*+]|\d+[.)])\s+/, ''))).filter(Boolean) }));
  const states = [];
  for (const u of ucs) for (const st of statesOf(u.text)) { const k = st.toLowerCase(), s0 = states.find((x) => x.key === k); if (s0) { if (!s0.use_cases.includes(u.id)) s0.use_cases.push(u.id); } else states.push({ key: k, state: st, use_cases: [u.id] }); }
  const constraints = blockStatements(lines, 'Business Constraints').map((c, i) => ({ id: `C${i + 1}`, ...c }));
  const scope = outOfScope(lines).map((o, i) => ({ id: `X${i + 1}`, ...o }));
  return { useCases: ucs, states, constraints, scope, objectives: objectives.map((o, i) => ({ id: `O${i + 1}`, ...o })), metrics: metrics.map((m, i) => ({ id: `M${i + 1}`, ...m })), claims };
}

// ---- the acceptance tests: a request for the writer, its answer verified clause by clause ------------------------------
const fingerprintOf = (ucs) => crypto.createHash('sha256').update(JSON.stringify(ucs.map((u) => u.text))).digest('hex').slice(0, 16);
function testRequest(ucs, outPath, fp) {
  return [`# Acceptance test request`, '', `Write one Given / When / Then test per use case below, from its own words only. List under \`missing\` only the facts a use case refers to but leaves undefined; edge cases it never mentions go under \`questions\`. Write the answer to \`${outPath}\` as JSON with \`"fingerprint": "${fp}"\` — see your instructions for the shape.`, '',
    `${ucs.length} use case(s).`, '', ...ucs.flatMap((u) => [`### ${u.id}`, '', u.text, ''])].join('\n');
}

// ---- stage 2 + 3 ------------------------------------------------------------------------------------------------------
async function check(specPath, opts = {}) {
  const text = fs.readFileSync(specPath, 'utf8'), ex = extract(text);
  const root = opts.root || path.dirname(path.resolve(specPath)), dir = path.join(root, '.cache', 'sa-skills', 'coherence');
  const SA = opts.saSkills !== undefined ? opts.saSkills : CK.saSkillsDir();
  const J = opts.judge || (SA ? require(path.join(SA, 'scripts', 'judge.js')) : null);
  const engine = J ? opts.engine || J.engineInForce() : 'none';
  const pending = [], notes = J ? [] : ['no judge — the judge ships in sa-skills (scripts/judge.js), which was not found; every question is undecided — pass --sa-skills <dir> or set SA_SKILLS_DIR'];
  const ask = async (spec, items) => {
    if (!items.length || !J) return {};
    try { const res = await J.judge(spec, items, { engine, root, answers: opts.answers, cache: opts.cache, fetch: opts.fetch, apiKey: opts.apiKey });
      if (res.pending) pending.push({ kind: 'worksheet', path: res.pending, dispatch: res.dispatch || J.WORKSHEET_JUDGE || 'the worksheet-judge subagent' });
      return res.answers || {};
    } catch (e) { if (e.name !== 'JudgeError') throw e; notes.push(e.message); return {}; }
  };
  const p = (a) => (a ? (a.p ?? a.confidence ?? 0) : null);
  const findings = [], undecided = [];

  // label vs substance
  const labelItems = ex.claims.flatMap((c) => ex.useCases.map((u) => ({ id: `L-${c.id}-${u.id}`, state: { use_case: u.judgeText, capability: c.capability } })));
  const la = await ask(Q.label, labelItems);
  const labels = ex.claims.map((c) => {
    const ans = ex.useCases.map((u) => ({ uc: u.id, p: p(la[`L-${c.id}-${u.id}`]) }));
    const supported = ans.filter((a) => a.p != null && a.p >= HI).map((a) => a.uc), open = ans.filter((a) => a.p == null).length;
    if (!supported.length && !open && ex.useCases.length) findings.push({ eval: 'label', blocking: true, test: 'label-mismatch', where: `line ${c.line}`, text: `"${c.name}" is claimed — "${c.quote}" — but no use case requires it: ${c.capability}`, ask: 'Drop the claim, or add the use case that needs it — with the steps that exercise it.' });
    if (open) undecided.push({ eval: 'label', what: c.name, open });
    return { label: c.name, line: c.line, supported_by: supported, open };
  });

  // traceability triangle
  const sa = await ask(Q.serves, ex.objectives.flatMap((o) => ex.useCases.map((u) => ({ id: `S-${o.id}-${u.id}`, state: { objective: o.text, use_case: u.judgeText } }))));
  const ma = await ask(Q.measures, ex.objectives.flatMap((o) => ex.metrics.map((m) => ({ id: `M-${o.id}-${m.id}`, state: { objective: o.text, metric: m.text } }))));
  const served = (o) => ex.useCases.map((u) => ({ uc: u.id, p: p(sa[`S-${o.id}-${u.id}`]) }));
  const measured = (o) => ex.metrics.map((m) => ({ m: m.id, p: p(ma[`M-${o.id}-${m.id}`]) }));
  const trace = ex.objectives.map((o) => {
    const s = served(o), m = measured(o), sOpen = s.filter((x) => x.p == null).length, mOpen = m.filter((x) => x.p == null).length;
    const by = s.filter((x) => x.p != null && x.p >= HI).map((x) => x.uc), mby = m.filter((x) => x.p != null && x.p >= HI).map((x) => x.m);
    if (!by.length && !sOpen && ex.useCases.length) findings.push({ eval: 'trace', blocking: true, test: 'objective-unserved', where: `${o.id} (line ${o.line})`, text: `no use case delivers "${o.text.slice(0, 140)}"`, ask: 'Which use case delivers this objective? Add it, or move the objective to Aspirations.' });
    if (!mby.length && !mOpen) findings.push({ eval: 'trace', blocking: true, test: 'objective-unmeasured', where: `${o.id} (line ${o.line})`, text: `no metric measures "${o.text.slice(0, 140)}"`, ask: 'Which number shows this objective is being reached — its baseline and its target?' });
    if (sOpen || mOpen) undecided.push({ eval: 'trace', what: o.id, open: sOpen + mOpen });
    return { objective: o.id, served_by: by, measured_by: mby };
  });
  if (ex.objectives.length) {
    for (const u of ex.useCases) { const a = ex.objectives.map((o) => p(sa[`S-${o.id}-${u.id}`])); if (a.every((x) => x != null && x < HI)) findings.push({ eval: 'trace', blocking: false, test: 'use-case-unanchored', where: u.id, text: `${u.id} ${u.name} serves no stated objective`, ask: 'Which objective does it serve? Name it, or drop the use case from this release.' }); }
    for (const m of ex.metrics) { const a = ex.objectives.map((o) => p(ma[`M-${o.id}-${m.id}`])); if (a.every((x) => x != null && x < HI)) findings.push({ eval: 'trace', blocking: false, test: 'metric-unanchored', where: `${m.id} (line ${m.line})`, text: `"${m.text.slice(0, 120)}" measures no stated objective`, ask: 'Which objective does it measure?' }); }
  }

  // acceptance tests
  const fp = fingerprintOf(ex.useCases), testsPath = path.join(dir, 'acceptance-tests.json'), reqPath = path.join(dir, 'acceptance-request.md');
  let tests = null;
  if (fs.existsSync(testsPath)) { try { const t = JSON.parse(fs.readFileSync(testsPath, 'utf8')); if (t.fingerprint === fp) tests = t.tests || {}; else notes.push('acceptance tests on disk were written for other use cases — requested again'); } catch { notes.push('acceptance tests on disk do not parse — requested again'); } }
  const acceptance = [];
  if (ex.useCases.length && !tests) {
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(reqPath, testRequest(ex.useCases, testsPath, fp));
    pending.push({ kind: 'tests', path: reqPath, dispatch: TEST_WRITER });
    undecided.push({ eval: 'acceptance', what: 'every use case', open: ex.useCases.length });
  } else if (tests) {
    const clauses = ex.useCases.flatMap((u) => { const t = tests[u.id] || {}; return ['given', 'when', 'then'].flatMap((k) => (t[k] || []).map((c, i) => ({ id: `C-${u.id}-${k}${i + 1}`, uc: u.id, clause: String(c), state: { clause: String(c), use_case: u.judgeText } }))); });
    // a clause the use case states word for word is code's, never a question
    const norm = (x) => x.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, ' ').trim();
    const verbatim = new Set(clauses.filter((c) => { const n = norm(c.clause); return n.length > 0 && norm(ex.useCases.find((u) => u.id === c.uc).text).includes(n); }).map((c) => c.id));
    const ca = { ...(await ask(Q.clause, clauses.filter((c) => !verbatim.has(c.id)).map(({ id, state }) => ({ id, state })))), ...Object.fromEntries([...verbatim].map((id) => [id, { p: 1, by: 'code' }])) };
    // a fact the writer lists as missing blocks only when the judge confirms no use case gives it — one writer pass is noisy
    const all = ex.useCases.map((u) => u.judgeText).join('\n');
    const gaps = ex.useCases.flatMap((u) => ((tests[u.id] || {}).missing || []).map(String).filter(Boolean).map((m, i) => ({ id: `G-${u.id}-${i + 1}`, state: { missing: m, use_case: u.judgeText, use_cases: all } })));
    const ma1 = await ask(Q.missing, gaps);
    // a confirmed gap is then asked alone whether it is a business fact; a detail goes to the questions
    const ka = await ask(Q.kind, gaps.filter((g) => p(ma1[g.id]) >= HI).map((g) => ({ id: g.id, state: { missing: g.state.missing } })));
    const ma2 = Object.fromEntries(gaps.map((g) => { const x = p(ma1[g.id]); return [g.id, x == null ? undefined : x < HI ? ma1[g.id] : ka[g.id] == null ? undefined : { p: Math.min(x, p(ka[g.id])) }]; }).filter(([, a]) => a));
    for (const u of ex.useCases) {
      const t = tests[u.id];
      if (!t) { undecided.push({ eval: 'acceptance', what: u.id, open: 1 }); continue; }
      const mine = clauses.filter((c) => c.uc === u.id), open = mine.filter((c) => ca[c.id] == null).length;
      const invented = mine.filter((c) => { const x = p(ca[c.id]); return x != null && x <= LO; }).map((c) => c.clause);
      const claimed = (t.missing || []).map(String).filter(Boolean), mOpen = claimed.filter((_, i) => ma2[`G-${u.id}-${i + 1}`] == null).length;
      const missing = claimed.filter((_, i) => { const x = p(ma2[`G-${u.id}-${i + 1}`]); return x != null && x >= HI; });
      const questions = [...(t.questions || []).map(String).filter(Boolean), ...claimed.filter((_, i) => { const x = p(ma2[`G-${u.id}-${i + 1}`]); return x != null && x < HI; })];
      if (questions.length) findings.push({ eval: 'acceptance', blocking: false, test: 'open-questions', where: u.id, text: `${u.id} ${u.name} is silent on: ${questions.join('; ')}`, ask: 'Worth asking the Product Owner; not a blocker.' });
      if (missing.length) findings.push({ eval: 'acceptance', blocking: true, test: 'untestable', where: u.id, text: `${u.id} ${u.name} cannot be tested as written — ${missing.map((m) => `missing: ${m}`).join('; ')}`, ask: 'State each missing fact in the use case — its number, its rule, its result.' });
      // a clause the judge cannot find in the use case is the writer's assumption — often harmless setup — so it warns
      if (invented.length) findings.push({ eval: 'acceptance', blocking: false, test: 'test-assumes', where: u.id, text: `${u.id} ${u.name}: the test assumes ${invented.map((c) => `"${c}"`).join('; ')}`, ask: 'Confirm each assumption, or state it in the use case.' });
      if (open + mOpen) undecided.push({ eval: 'acceptance', what: u.id, open: open + mOpen });
      acceptance.push({ use_case: u.id, given: t.given || [], when: t.when || [], then: t.then || [], missing, invented, questions, open: open + mOpen });
    }
  }

  // closure: every state has a setter, every trigger can happen
  const allUc = ex.useCases.map((u) => u.judgeText).join('\n');
  const sentences = allUc.split(/\n|(?<=\.)\s+/);
  const named = (st) => sentences.filter((s) => new RegExp(`(?<![\\p{L}\\p{N}])${st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(s)).join(' … ');
  const oa = await ask(Q.origin, ex.states.map((st, i) => ({ id: `ST-${i + 1}`, state: { state: st.state, mentions: named(st.state) } })));
  const sa1 = await ask(Q.setter, ex.states.map((st, i) => ({ id: `ST-${i + 1}`, state: { state: st.state, use_cases: allUc } })));
  // closed on either confident yes; unset only when both say no; an unanswered half leaves it undecided unless the other closes it
  const sa2 = Object.fromEntries(ex.states.map((_, i) => { const id = `ST-${i + 1}`, o = p(oa[id]), s = p(sa1[id]);
    return [id, (o != null && o >= HI) || (s != null && s >= HI) ? { p: Math.max(o ?? 0, s ?? 0) } : o == null || s == null ? undefined : { p: Math.max(o, s) }]; }).filter(([, a]) => a));
  const trigUcs = ex.useCases.filter((u) => u.trigger);
  const ta = await ask(Q.trigger, trigUcs.map((u) => ({ id: `T-${u.id}`, state: { trigger: u.trigger, use_case: `${u.id} ${u.name}`, use_cases: allUc } })));
  const closure = [];
  ex.states.forEach((st, i) => {
    const x = p(sa2[`ST-${i + 1}`]);
    if (x == null) undecided.push({ eval: 'closure', what: `state ${st.state}`, open: 1 });
    else if (x <= LO) findings.push({ eval: 'closure', blocking: true, test: 'state-unset', where: st.use_cases.join(', '), text: `the state "${st.state}" is shown or checked, but no use case says what sets it`, ask: 'Which use case, actor or system sets it? Add the step, or drop the state.' });
    else if (x < HI) findings.push({ eval: 'closure', blocking: false, test: 'state-unclear', where: st.use_cases.join(', '), text: `what sets the state "${st.state}" is not clear`, ask: 'Name the step, actor or system that sets it.' });
    closure.push({ kind: 'state', what: st.state, use_cases: st.use_cases, p: x });
  });
  for (const u of trigUcs) {
    const x = p(ta[`T-${u.id}`]);
    if (x == null) undecided.push({ eval: 'closure', what: `trigger ${u.id}`, open: 1 });
    else if (x <= LO) findings.push({ eval: 'closure', blocking: true, test: 'trigger-unproduced', where: u.id, text: `${u.id} ${u.name} starts on "${u.trigger}", which no use case produces`, ask: 'Which use case sends or creates it? Add that step, or change the trigger.' });
    else if (x < HI) findings.push({ eval: 'closure', blocking: false, test: 'trigger-unclear', where: u.id, text: `whether "${u.trigger}" can happen as the use cases stand is not clear`, ask: 'Say what produces the trigger.' });
    closure.push({ kind: 'trigger', what: u.id, use_cases: [u.id], p: x });
  }

  // conflict: use case × use case, × constraint, × out-of-scope item — can both hold?
  const pairs = [];
  ex.useCases.forEach((u, i) => {
    for (const v of ex.useCases.slice(i + 1)) pairs.push({ id: `K-${u.id}-${v.id}`, where: `${u.id} × ${v.id}`, what: `${u.id} ${u.name} and ${v.id} ${v.name}`, a: u.judgeText, b: v.judgeText });
    for (const c of ex.constraints) pairs.push({ id: `K-${u.id}-${c.id}`, where: `${u.id} × constraint (line ${c.line})`, what: `${u.id} ${u.name} and the constraint "${c.text.slice(0, 120)}"`, a: u.judgeText, b: `Business constraint: ${c.text}` });
    for (const o of ex.scope) pairs.push({ id: `K-${u.id}-${o.id}`, where: `${u.id} × out of scope (line ${o.line})`, what: `${u.id} ${u.name} and the out-of-scope item "${o.text.slice(0, 120)}"`, a: u.judgeText, b: `Out of scope for this release: ${o.text}` });
  });
  const ka = await ask(Q.conflict, pairs.map((k) => ({ id: k.id, state: { a: k.a, b: k.b } })));
  const conflicts = [];
  for (const k of pairs) {
    const x = p(ka[k.id]);
    if (x == null) { undecided.push({ eval: 'conflict', what: k.where, open: 1 }); continue; }
    if (x <= LO) findings.push({ eval: 'conflict', blocking: true, test: 'contradiction', where: k.where, text: `${k.what} cannot both hold as written`, ask: 'Which one wins? Change the other, or narrow both so they no longer collide.' });
    else if (x < HI) findings.push({ eval: 'conflict', blocking: false, test: 'possible-contradiction', where: k.where, text: `${k.what} may collide`, ask: 'Confirm both can hold, or say which one wins.' });
    if (x < HI) conflicts.push({ where: k.where, p: x });
  }

  // sizing: objective ↔ metric numbers (code), use-case limit ↔ objective target (judge: same quantity; code: arithmetic)
  const sizing = [];
  for (const o of ex.objectives) {
    const g = goalOf(o.text); if (!g) continue;
    for (const m of ex.metrics) {
      const x = p(ma[`M-${o.id}-${m.id}`]); if (x == null || x < HI) continue;
      const row = rowOf(m.text); if (!row) continue;
      const want = g.factor != null ? { baseline: row.baseline, target: row.baseline * g.factor } : g;
      const unitClash = g.unit && row.unit && g.unit !== row.unit;
      if (unitClash || !near(want.baseline, row.baseline) || !near(want.target, row.target)) {
        const said = g.factor != null ? `×${+g.factor.toFixed(2)} of ${row.baseline} = ${+want.target.toFixed(2)}` : `${g.baseline} → ${g.target}${g.unit ? ' ' + g.unit : ''}`;
        findings.push({ eval: 'sizing', blocking: false, test: 'numbers-disagree', where: `${o.id} × ${m.id}`, text: `the objective says ${said}, its metric "${m.text.slice(0, 80)}" says ${row.baseline} → ${row.target}${row.unit ? ' ' + row.unit : ''}`, ask: 'Which figures are right? Make the objective and its metric say the same baseline and target.' });
        sizing.push({ where: `${o.id} × ${m.id}`, kind: 'objective-metric' });
      }
    }
  }
  const limitItems = [];
  for (const o of ex.objectives) {
    const g = goalOf(o.text); if (!g || g.factor != null || !g.unit) continue;
    for (const u of ex.useCases) {
      const x = p(sa[`S-${o.id}-${u.id}`]); if (x == null || x < HI) continue;
      u.acceptance.forEach((c, i) => { const l = limitOf(c); if (l && l.unit === g.unit) limitItems.push({ id: `Z-${o.id}-${u.id}-${i + 1}`, o, u, c, l, g, state: { criterion: c, use_case: `${u.id} ${u.name}`, objective: o.text } }); });
    }
  }
  const za = await ask(Q.same, limitItems.map(({ id, state }) => ({ id, state })));
  for (const z of limitItems) {
    const x = p(za[z.id]);
    if (x == null) { undecided.push({ eval: 'sizing', what: z.id, open: 1 }); continue; }
    if (x < HI) continue;
    const lower = z.g.target <= z.g.baseline, misses = lower ? z.l.v > z.g.target : z.l.v < z.g.target;
    if (misses) {
      findings.push({ eval: 'sizing', blocking: false, test: 'use-case-misses-target', where: `${z.u.id} × ${z.o.id}`, text: `${z.u.id} ${z.u.name} accepts ${z.l.v} ${z.l.unit} ("${z.c.slice(0, 80)}"), but ${z.o.id} targets ${z.g.target} ${z.g.unit}`, ask: 'Tighten the acceptance criterion to the target, or correct the objective.' });
      sizing.push({ where: `${z.u.id} × ${z.o.id}`, kind: 'use-case-target' });
    }
  }

  const blocking = findings.filter((f) => f.blocking);
  const status = blocking.length ? 'FAIL' : pending.length || undecided.length ? 'PENDING' : 'PASS';
  return { spec: specPath, status, engine, counts: { use_cases: ex.useCases.length, objectives: ex.objectives.length, metrics: ex.metrics.length, claims: ex.claims.length },
    findings, blocking: blocking.length, warnings: findings.length - blocking.length, labels, trace, acceptance, closure, conflicts, sizing, undecided, pending, notes };
}

function render(r) {
  const c = r.counts, out = [`COHERENCE: ${r.status} · ${r.blocking} blocking · ${r.warnings} warning(s) · ${c.use_cases} use case(s), ${c.objectives} objective(s), ${c.metrics} metric(s), ${c.claims} label(s) claimed · judge ${r.engine}`];
  for (const l of r.labels) out.push(`  label   "${l.label}" (line ${l.line}) → ${l.supported_by.length ? `exercised by ${l.supported_by.join(', ')}` : l.open ? 'undecided' : 'no use case'}`);
  for (const t of r.trace) out.push(`  trace   ${t.objective} → use cases: ${t.served_by.join(', ') || '—'} · metrics: ${t.measured_by.join(', ') || '—'}`);
  for (const c of r.closure || []) out.push(`  closure ${c.kind === 'state' ? `state "${c.what}" (${c.use_cases.join(', ')})` : `trigger ${c.what}`} → ${c.p == null ? 'undecided' : c.p >= HI ? 'closed' : c.p <= LO ? 'open' : 'unclear'}`);
  if (r.conflicts) out.push(`  conflict ${r.conflicts.length ? r.conflicts.map((c) => `${c.where} (${c.p})`).join('; ') : 'none found'}`);
  for (const a of r.acceptance) out.push(`  test    ${a.use_case} → ${a.missing.length ? 'not testable as written' : a.open ? 'undecided' : 'testable'}`);
  for (const f of r.findings) out.push(`  ${f.blocking ? '✗' : '!'} [${f.test}] ${f.where} — ${f.text} → ${f.ask}`);
  for (const p of r.pending) out.push(p.kind === 'tests' ? `  pending: dispatch ${p.dispatch} with ${p.path}, then run again` : `  pending: dispatch ${p.dispatch} on ${p.path}, then run again`);
  for (const n of r.notes) out.push(`  note: ${n}`);
  return out.join('\n');
}

module.exports = { check, extract, render, statesOf, goalOf, rowOf, limitOf, Q, LABELS, TEST_WRITER, fingerprintOf };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const spec = args.find((a, i) => !a.startsWith('--') && !['--judge', '--sa-skills'].includes(args[i - 1]));
  if (!spec) { console.error('usage: po-spec-coherence.js <PRODUCT_OWNER_SPEC.md> [--judge agent|typesafe|clef] [--answers] [--sa-skills <dir>] [--json]'); process.exit(2); }
  check(spec, { engine: opt('--judge'), answers: args.includes('--answers') ? true : undefined }).then((r) => {
    console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    process.exit(r.status === 'FAIL' ? 1 : r.status === 'PENDING' ? 10 : 0);
  }).catch((e) => { console.error(e.message); process.exit(2); });
}
