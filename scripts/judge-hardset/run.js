#!/usr/bin/env bun
// run.js — the judge's hard set through scripts/judge.js, graded.
//
//   bun scripts/judge-hardset/run.js [--engine agent,typesafe,clef] [--root <dir>] [--cache] [--json]
//
// One engine per column: items correct per site, and the wrong answers given at a confidence the site acts on
// (every site at its spec's `hi`; a noul's confident no is p ≤ 0.25) — the
// silent errors, the column that decides whether an engine may be the default. Items are shuffled by a fixed seed
// and carry opaque ids. No cache unless --cache: a measurement asks the model. `agent` (the default) is the
// worksheet-judge subagent: the first run writes one worksheet per site under --root (default <tmp>/judge-hardset)
// and lists them; dispatch `sa-skills:reviewers:worksheet-judge` on each, then run the same command again to grade.
'use strict';
const path = require('path'), os = require('os'), fs = require('fs');
const J = require(path.join(__dirname, '..', 'judge.js'));
const { SITES } = require('./cases.js');

/** The items one site sends: opaque ids h01…, order shuffled by a fixed seed, labels kept apart. */
function itemsOf() {
  let seed = 7, n = 0; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Object.fromEntries(Object.entries(SITES).map(([site, { spec, cases }]) => {
    const shuffled = cases.map((c) => [rnd(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const items = [], labels = {};
    shuffled.forEach((c) => { const id = 'h' + String(++n).padStart(2, '0'); items.push(c.options ? { id, state: c.state, options: c.options } : { id, state: c.state }); labels[id] = { label: c.label, mode: c.mode }; });
    return [site, { spec, items, labels }];
  }));
}
/** Grades one site's answers: correct, misses, and the misses at an acting confidence. */
function grade(site, spec, labels, answers) {
  const hi = spec.hi ?? J.DEFAULTS.hi, out = { ok: 0, n: 0, loud: 0, misses: [] };
  for (const [id, { label, mode }] of Object.entries(labels)) {
    out.n++; const a = answers[id];
    if (!a) { out.misses.push({ id, mode, want: label, got: 'unanswered' }); continue; }
    const got = spec.type === 'noul' ? (a.p >= 0.5 ? 1 : 0) : a.choice;
    if (got === label) { out.ok++; continue; }
    const loud = spec.type === 'noul' ? (label === 0 ? a.p >= hi : a.p <= 0.25) : (a.confidence ?? 1) >= hi;
    if (loud) out.loud++;
    out.misses.push({ id, mode, want: label, got, value: +J.value(a).toFixed(2), loud });
  }
  return out;
}
async function main() {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const engines = (opt('--engine') || 'agent').split(','), root = opt('--root') || path.join(os.tmpdir(), 'judge-hardset');
  const sets = itemsOf(), report = {}, pending = [];
  for (const engine of engines) {
    const t0 = Date.now();
    const runs = await Promise.all(Object.entries(sets).map(async ([site, { spec, items, labels }]) => {
      const res = await J.judge(spec, items, { engine, root, cache: args.includes('--cache') });
      if (res.pending) { pending.push(res.pending); return [site, null]; }
      const by = Object.values(res.answers).map((a) => a.by).find(Boolean);
      return [site, { ...grade(site, spec, labels, res.answers), model: res.model || by }];
    }));
    if (runs.some(([, r]) => !r)) continue;
    report[engine] = { sites: Object.fromEntries(runs), seconds: Math.round((Date.now() - t0) / 1000) };
  }
  if (pending.length) {
    console.log(`${pending.length} worksheet(s) to answer — dispatch ${J.WORKSHEET_JUDGE} on each, then run this command again:`);
    pending.forEach((p) => console.log(`  ${p}`));
    if (!Object.keys(report).length) return;
  }
  if (args.includes('--json')) { console.log(JSON.stringify(report, null, 1)); return; }
  const sites = Object.keys(sets), pad = (s, n) => String(s).padEnd(n);
  console.log(pad('engine', 10) + sites.map((s) => pad(s, 13)).join('') + pad('total', 8) + pad('loud', 6) + 'time');
  for (const [e, r] of Object.entries(report)) {
    const all = Object.values(r.sites), ok = all.reduce((n, x) => n + x.ok, 0), n = all.reduce((k, x) => k + x.n, 0), loud = all.reduce((k, x) => k + x.loud, 0);
    console.log(pad(e, 10) + sites.map((s) => pad(`${r.sites[s].ok}/${r.sites[s].n}`, 13)).join('') + pad(`${ok}/${n}`, 8) + pad(loud, 6) + `${r.seconds}s`);
  }
  for (const [e, r] of Object.entries(report)) for (const [s, x] of Object.entries(r.sites)) for (const m of x.misses)
    console.log(`  ${e} ${s} ${m.id} ${m.mode}: want ${m.want}, got ${m.got}${m.value != null ? ` (${m.value})` : ''}${m.loud ? '  ← at an acting confidence' : ''}`);
}
module.exports = { itemsOf, grade };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(2); });
