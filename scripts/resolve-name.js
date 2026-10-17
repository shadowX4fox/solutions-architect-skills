// resolve-name.js — which documented component does a prose name refer to. One resolver for every
// script that used to answer with its own substring test.
//
// A docs/05 endpoint cell, a Communication row, a finding's label, a layer table's Containers cell:
// each names a component in words the ledger may or may not spell the same way, and eleven scripts
// answered with normalized containment — longest name first, earliest position wins, containment
// in either direction, a stopword bag. Three outcomes of that rule reached released documents in
// silence on the reference project: a cell naming two components collapsed to the first, a name
// the ledger carries twice (an L1 and an L2 "Core Contable") resolved to whichever came first, and
// a paraphrase resolved to nothing. Containment now only finds the candidates; a cell that is exactly one
// candidate's name is code's to answer, and the judge (scripts/judge.js) answers the two questions the rule
// cannot. A cell no judge has answered is `undecided` (8.119.0) — never resolved by the old rule:
//
//   which   one Choice per cell over the candidates code found — the containment hits, or every
//           file-backed component when nothing is contained — plus `none`, each option described
//           by its level, system, internal name and tagline (the 8.64.0 Description contract)
//   also    one Noul per remaining containment hit: does the cell name it as an endpoint too, not
//           as a via or a qualifier — so a collapse is reported instead of silent
//
// Stage 3 is the caller's: a high-confidence answer resolves, a mid one resolves with a review
// line, a low one or `none` is unresolved. Nothing here writes a document.
//
//   const { resolveNames } = require('<plugin>/scripts/resolve-name.js');
//   const res = await resolveNames(cells, facts, { engine, root, hi, lo, answers, alsoAnswers });
//   // cells: [{ id, cell, context? }]   facts: component-cli facts (name, slug, level, system, internal_name, description, file_backed)
//   // res.get(id) → { name, fact, by, confidence, also: [names], candidates: [names], resolved, band, unresolved_reason? }
'use strict';
const path = require('path');
const JUDGE = require(path.join(__dirname, 'judge.js'));

const plain = (s) => String(s || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_~]/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();
const norm = (s) => plain(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const WHICH = {
  id: 'resolve-name', type: 'choice', hi: 0.6, lo: 0.35,
  question: 'Which option is the documented component that `item.cell` names as the endpoint of the integration described in `item.context`? When the cell names more than one component, pick the one it names first. A word that qualifies the component (a collection, a region, a version in parentheses) still names that component. Every option is a documented component of this architecture, a topic, a queue or a store included; pick the option the cell names even when its description reads "Not documented".',
  criteria: { none: 'The cell names something that is not among the options: an external party without a descriptor, a team or a person, a protocol (HTTPS, gRPC, JDBC) named in place of a component, or a phrase too generic to be one of them. Never `none` when an option carries the name the cell uses.' },
};
const ALSO = {
  id: 'resolve-name-also', type: 'noul', hi: 0.6,
  question: 'Besides the component it names first, does `item.cell` also name `item.candidate` as an endpoint of the integration described in `item.context`?',
  criteria: { true: 'The cell names the candidate as a second endpoint: joined by "and", "y", a comma or a slash, both receive or both send.', false: 'The candidate is not named, or is named only as the transport ("via", "through", "a través de"), as the owner of the endpoint, or as a qualifier of another name.' },
};

/** The option key the model sees: the canonical name, with the level appended only where two facts share a name. */
function optionKeys(facts) {
  const count = new Map(); facts.forEach((f) => count.set(f.name, (count.get(f.name) || 0) + 1));
  return new Map(facts.map((f) => [f, count.get(f.name) > 1 ? `${f.name} (${f.level || '?'})` : f.name]));
}
const describe = (f) => ({ level: f.level || 'Not documented', system: f.system || 'Not documented', internal_name: f.internal_name || 'Not documented', description: f.description || 'Not documented' });

/** Stage 1: every name contained in the cell, longest first, earliest position wins — the candidates, never the answer. */
function containmentHits(cell, facts) {
  const t = ' ' + norm(cell) + ' ';
  return facts.map((f) => ({ f, n: norm(f.name) })).filter((x) => x.n && t.includes(x.n))
    .map((x) => ({ f: x.f, at: t.indexOf(x.n), len: x.n.length })).sort((a, b) => a.at - b.at || b.len - a.len);
}

/**
 * resolveNames(cells, facts, opts) → Map<id, resolution>
 * opts: engine · root · hi · lo · answers / alsoAnswers (close the agent loop) · apiKey · fetch · cache
 */
async function resolveNames(cells, facts, opts = {}) {
  const hi = opts.hi ?? WHICH.hi, lo = opts.lo ?? WHICH.lo;
  const keyOf = optionKeys(facts), byKey = new Map([...keyOf].map(([f, k]) => [k, f]));
  const fileBacked = facts.filter((f) => f.file_backed !== false);
  const prepared = cells.map((c) => {
    // `exclude`: names the cell cannot mean — the other endpoint of its own row. Offered the whole ledger for "AppDome",
    // the judge picked the row's other end (the mobile app) at 0.76; the row is what says it is not that.
    const excluded = new Set((c.exclude || []).map(norm));
    const allowed = excluded.size ? facts.filter((f) => !excluded.has(norm(f.name))) : facts;
    const hits = containmentHits(c.cell, allowed);
    // a cell that is exactly one candidate's name is code's to answer — whatever shorter names it happens to contain
    // ("Captura CDC del Core Contable" contains "Core Contable"): the judge sees only a cell with a qualifier, two names,
    // a tie between facts of the same name, or no name at all
    const whole = hits.filter((h) => norm(h.f.name) === norm(c.cell));
    const exact = whole.length === 1 ? whole[0].f : null;
    const pool = hits.length ? hits.map((h) => h.f) : fileBacked.filter((f) => !excluded.has(norm(f.name)));
    const options = Object.fromEntries(pool.map((f) => [keyOf.get(f), describe(f)]));
    return { c, hits, pool, options, exact };
  });
  const whichItems = prepared.filter((p) => p.pool.length && !p.exact).map((p) => ({ id: p.c.id, state: { cell: plain(p.c.cell), context: p.c.context || {} }, options: p.options }));
  // an item id must be file-safe, so the also-items are keyed by the candidate's position in the cell's hit list, never by its name
  const alsoId = (cid, k) => `${cid}::${k}`;
  const alsoItems = prepared.flatMap((p) => p.hits.length > 1 && !p.exact ? p.hits.map((h, k) => ({ id: alsoId(p.c.id, k), state: { cell: plain(p.c.cell), candidate: keyOf.get(h.f), context: p.c.context || {} } })) : []);
  const engine = opts.engine || JUDGE.engineInForce();
  const common = { engine, root: opts.root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache, model: opts.model };
  const [which, also] = await Promise.all([
    whichItems.length ? JUDGE.judge(WHICH, whichItems, { ...common, answers: opts.answers }) : { engine, answers: {} },
    alsoItems.length ? JUDGE.judge(ALSO, alsoItems, { ...common, answers: opts.alsoAnswers }) : { engine, answers: {} },
  ]);
  const out = new Map();
  out.pending = which.pending || also.pending || null;
  out.engine = which.engine;
  for (const p of prepared) {
    if (p.exact) { out.set(p.c.id, { id: p.c.id, cell: p.c.cell, name: p.exact.name, fact: p.exact, by: 'exact', confidence: null, also: [], candidates: [keyOf.get(p.exact)], resolved: true, band: 'high' }); continue; }
    const a = which.answers[p.c.id];
    const r = { id: p.c.id, cell: p.c.cell, name: null, fact: null, by: a ? a.by : 'undecided', confidence: a && a.confidence != null ? +a.confidence.toFixed(2) : null, also: [], candidates: p.pool.map((f) => keyOf.get(f)), resolved: false, band: 'low' };
    if (!a) { r.undecided = p.pool.length > 0; r.unresolved_reason = !p.pool.length ? 'no component to choose from' : which.pending ? `undecided — the judge's worksheet is pending (${path.basename(which.pending)})` : 'undecided — no judge answered'; out.set(p.c.id, r); continue; }
    r.band = a.confidence == null ? 'high' : JUDGE.band(a.confidence, hi, lo);
    const fact = a.choice !== 'none' ? byKey.get(a.choice) : null;
    // a cell that contains no documented name was offered the whole ledger: only a confident pick resolves it, since the
    // prior there is "none" — on the reference "AppDome" (an SDK with no descriptor) came back as the mobile app at 0.54
    const enough = r.band === 'high' || (r.band === 'mid' && p.hits.length > 0);
    if (fact && enough) { r.name = fact.name; r.fact = fact; r.resolved = true; }
    else r.unresolved_reason = a.choice === 'none' ? 'names no documented component' : r.band === 'mid' ? `possibly ${a.choice} (${r.confidence}) — the cell carries no documented name; confirm before a contract is written` : `resolved to ${a.choice} below the floor (${r.confidence})`;
    p.hits.forEach((h, k) => { if (keyOf.get(h.f) === a.choice) return; const n = also.answers[alsoId(p.c.id, k)]; if (n && n.p >= ALSO.hi) r.also.push(h.f.name); });
    out.set(p.c.id, r);
  }
  return out;
}

// ─── the set shape: which components is this text about ─────────────────────
// A finding's row, a boundary table's row, a paragraph: the question is not "which one" but "which
// ones is it about", and a component merely named in a Recommendation cell or as the far end of a
// path is not one of them. Candidates by containment (canonical names, plus the caller's aliases —
// a descriptor's filename slug, an old name), one Noul each. A candidate no judge answered is undecided:
// not kept, and listed under `undecided` so the caller reports it (8.119.0 — the old rule kept every hit).
const ABOUT = {
  id: 'mentions', type: 'noul', hi: 0.6,
  question: 'Is `item.text` about `item.candidate` — is the candidate a component the text concerns (the subject of a finding, an endpoint of the interaction, a row about it), rather than one merely named in passing?',
  criteria: { true: 'The candidate is what the text is about, or one of the components it is about: its subject, an endpoint it describes, a component it reports on.', false: 'The candidate is only named in passing: in a recommendation or mitigation, as the far end of a path the text is not about, as an example, or not named at all.' },
};
/** Candidates for a text: every fact whose canonical name (or one of its aliases) the text contains; `looseWords` also admits a multi-word name all of whose significant words appear. */
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'the', 'of', 'and', 'a', 'en', 'in', 'on']);
const words = (t) => norm(t).split(' ').filter((w) => w && !STOP.has(w));
function mentionCandidates(text, facts, { aliases = new Map(), looseWords = false } = {}) {
  const k = ' ' + norm(text) + ' ', ws = new Set(words(text));
  const named = (f) => k.includes(' ' + norm(f.name) + ' ') || [...aliases].some(([alias, ff]) => ff === f && k.includes(' ' + norm(alias) + ' ')) || (looseWords && words(f.name).length >= 2 && words(f.name).every((w) => ws.has(w)));
  return facts.filter((f) => norm(f.name) && named(f));
}
// A phrase that covers several components — a plural ("Tópicos CDC"), a family name — is the same set shape with a
// different question; the caller hands the candidates its own rule found.
const COVERS = {
  id: 'covers', type: 'noul', hi: 0.6,
  question: 'Does the phrase `item.text` refer to `item.candidate` — is the candidate one of the components the phrase names or covers, as a plural, a family name or a shortened form of it?',
  criteria: { true: 'The phrase names the candidate, or is a plural or family name that covers it (the phrase "CDC topics" covers each CDC topic).', false: 'The candidate merely shares a word with the phrase, or the phrase names something else.' },
};
/**
 * mentions(cells, facts, opts) → Map<id, { names: [canonical], facts, by, judged: [{ name, p }] }>
 * cells: [{ id, text, candidates? }]   opts: engine · root · aliases (Map alias → fact) · looseWords · hi · answers · apiKey · fetch · cache
 *        · spec (ABOUT by default; COVERS for a plural) · candidates (fn(text) → facts, when the caller's own rule finds them)
 */
async function mentions(cells, facts, opts = {}) {
  const spec = opts.spec || ABOUT, hi = opts.hi ?? spec.hi;
  const find = opts.candidates || ((text) => mentionCandidates(text, facts, opts));
  const prepared = cells.map((c) => ({ c, cands: c.candidates || find(c.text) }));
  const items = prepared.flatMap((p) => p.cands.map((f, k) => ({ id: `${p.c.id}::${k}`, state: { text: plain(p.c.text), candidate: f.name, candidate_description: f.description || undefined } })));
  const engine = opts.engine || JUDGE.engineInForce();
  const res = items.length ? await JUDGE.judge(spec, items, { engine, root: opts.root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache, model: opts.model, answers: opts.answers }) : { engine, answers: {} };
  const out = new Map(); out.pending = res.pending || null; out.engine = res.engine;
  for (const p of prepared) {
    const judged = p.cands.map((f, k) => { const a = res.answers[`${p.c.id}::${k}`]; return { name: f.name, fact: f, p: a ? a.p : null, by: a ? a.by : 'undecided' }; });
    const kept = judged.filter((j) => j.p != null && j.p >= hi);
    out.set(p.c.id, { id: p.c.id, names: kept.map((j) => j.name), facts: kept.map((j) => j.fact), undecided: judged.filter((j) => j.p == null).map((j) => j.name), by: judged[0] ? judged[0].by : 'undecided', judged });
  }
  return out;
}

// ─── the relation shape: two components named in one description ─────────────
// A descriptor's Communication row names the containers of a system in its Description, and the words between
// two names decide whether they act together ("`MS A` y `MS B` consultan el `Gateway`") or in sequence ("a
// `Escritor`, que los escribe en el `Cache`") — the scene builder turns a sequence into an inner edge. The judge reads
// the sentence; a pair it has not answered, or answered below the band, is `relation: null` — undecided (8.119.0).
const RELATION = {
  id: 'relation', type: 'choice', hi: 0.6,
  question: 'In `item.description`, how do `item.first` and `item.second` relate as participants of the interaction described?',
  criteria: {
    parallel: 'They act together in the same step — both send, both receive, or both are consulted — joined by "and", "y", a comma or a slash, neither acting on the other.',
    sequence: 'Data or control moves from the first to the second: the first calls, writes to, publishes to, hands over to, or is followed by the second.',
    unrelated: 'The two are named for different reasons and no step of the interaction joins them.',
  },
};
/**
 * relations(pairs, opts) → Map<id, { relation: 'parallel'|'sequence'|'unrelated', by, confidence, band }>
 * pairs: [{ id, description, first, second, between? }]   opts: engine · root · hi · answers · apiKey · fetch · cache
 * A pair with no answer, or a pick below the confident band, is `relation: null` with `undecided: true` — never a guess.
 */
async function relations(pairs, opts = {}) {
  const hi = opts.hi ?? RELATION.hi;
  const items = pairs.map((p) => ({ id: p.id, state: { description: plain(p.description), first: p.first, second: p.second } }));
  const engine = opts.engine || JUDGE.engineInForce();
  const res = items.length ? await JUDGE.judge(RELATION, items, { engine, root: opts.root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache, model: opts.model, answers: opts.answers }) : { engine, answers: {} };
  const out = new Map(); out.pending = res.pending || null; out.engine = res.engine;
  for (const it of items) {
    const a = res.answers[it.id];
    if (!a) { out.set(it.id, { relation: null, undecided: true, by: 'undecided', confidence: null, band: 'low' }); continue; }
    const band = a.confidence == null ? 'high' : JUDGE.band(a.confidence, hi, hi);
    const ok = band === 'high' && ['parallel', 'sequence', 'unrelated'].includes(a.choice);
    out.set(it.id, { relation: ok ? a.choice : null, undecided: !ok, judged: a.choice, by: a.by, confidence: a.confidence != null ? +a.confidence.toFixed(2) : null, band });
  }
  return out;
}

/**
 * verifyResolutions(fixtures, results) → { tp, fn, unseen, total, also_missed }
 * fixtures: [{ id, label: '<canonical name>' | 'none', also?: [names], note? }]
 */
function verifyResolutions(fixtures, results) {
  const v = { tp: 0, fn: [], unseen: [], also_missed: [], total: 0 };
  for (const f of fixtures || []) {
    v.total++;
    const r = results.get(f.id);
    if (!r) { v.unseen.push(f); continue; }
    const got = r.resolved ? r.name : 'none';
    if (got === f.label) v.tp++; else v.fn.push({ ...f, got, confidence: r.confidence });
    (f.also || []).forEach((n) => { if (!r.also.includes(n)) v.also_missed.push({ id: f.id, name: n, got: r.also }); });
  }
  return v;
}

module.exports = { resolveNames, mentions, mentionCandidates, relations, verifyResolutions, containmentHits, optionKeys, norm, plain, WHICH, ALSO, ABOUT, COVERS, RELATION };
