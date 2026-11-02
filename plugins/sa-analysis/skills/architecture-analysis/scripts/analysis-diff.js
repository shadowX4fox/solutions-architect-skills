#!/usr/bin/env bun
'use strict';
// Did a change keep the architecture's risk where it was? For each lens, the newest report on disk against the newest one
// at a base revision, both read by the findings contract (scripts/shared/findings.js) — by code, no model. Finding ids are
// renumbered by every run, so findings are paired by what they name (the naming cell: a component, a threat, a store…):
// per name, a critical or high finding more than the base had is new; a name whose worst severity rose to critical or high
// is raised. Either one and the state was not kept: the pull request waits for the architect. Medium and low findings,
// and resolved ones, are reported and never hold.
//
//   bun analysis-diff.js <project> --base <git-ref> --lenses spof,stride,… [--judge agent|typesafe|clef] [--judge-answers <file>] [--json] [--md]
//
// Exit 0 kept · 3 worsened (the architect's) · 2 usage · 1 error.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');

const F = require(fromSaSkills('scripts', 'shared', 'findings.js'));
const RANK = { critical: 4, high: 3, medium: 2, low: 1 };
const HOLDS = (s) => s === 'critical' || s === 'high';
const git = (root, args) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return { ok: r.status === 0, out: String(r.stdout || '') }; };

const reportName = (lens) => new RegExp(`^${lens.toUpperCase()}-\\d{4}-\\d{2}-\\d{2}[^/]*\\.(md|html)$`, 'i');
const newest = (files, lens) => files.filter((f) => reportName(lens).test(f)).sort((a, b) => (F.dateOf(a) || '').localeCompare(F.dateOf(b) || '') || a.localeCompare(b)).pop() || null;

/** The newest report of a lens: on disk, or at a revision. { file, text } or null. */
function reportOnDisk(root, lens) {
  let files = [];
  try { files = fs.readdirSync(path.join(root, 'analysis')); } catch { return null; }
  const f = newest(files, lens);
  return f ? { file: `analysis/${f}`, text: fs.readFileSync(path.join(root, 'analysis', f), 'utf8') } : null;
}
function reportAt(root, ref, lens) {
  const ls = git(root, ['ls-tree', '--name-only', `${ref}:analysis`]);
  if (!ls.ok) return null;
  const f = newest(ls.out.split('\n').filter(Boolean), lens);
  if (!f) return null;
  const show = git(root, ['show', `${ref}:analysis/${f}`]);
  return show.ok ? { file: `analysis/${f}`, text: show.out } : null;
}

const itemsOf = (rep) => {
  if (!rep) return [];
  const r = /\.html$/i.test(rep.file) ? F.extractHtml(rep.text, rep.file) : F.extractMarkdown(rep.text.replace(/\r\n/g, '\n'), rep.file);
  return (r.items || []).filter((i) => RANK[i.severity]);
};
const keyOf = (i) => F.norm(F.plain(i.label || i.id || ''));

// Two findings with different words may be one finding — a threat reworded by a new run, a component renamed. Whether they
// are is a judgement: one question per pair the names left unpaired, through scripts/judge.js. A pair it does not confirm
// stays apart: the new finding holds the merge (never guessed).
const SAME_FINDING = {
  id: 'same-finding', type: 'noul', hi: 0.75,
  question: 'Do `item.before` and `item.after` describe the same risk finding of the architecture — the same weakness of the same element (component, interface, data store or threat) — even if the words, the id or the severity differ?',
  criteria: { yes: 'The same element and the same weakness or threat, reworded, refined or re-rated.', no: 'A different element, or a different weakness of the same element.' },
};
const MAX_PAIRS = 60;
const brief = (lens, i) => ({ lens, id: i.id, name: F.plain(i.label || ''), severity: i.severity,
  detail: Object.entries(i.fields || {}).map(([k, v]) => `${k}: ${F.plain(v)}`).join(' · ').slice(0, 400) });

/** One lens, by code: findings paired by name; what stays unpaired is new (critical, high) or gone. */
function pairLens(lens, before, after) {
  const A = itemsOf(before), B = itemsOf(after);
  const usedA = new Set(), pairs = [];
  for (const b of B) {
    const a = A.find((x) => !usedA.has(x) && keyOf(x) === keyOf(b) && x.severity === b.severity) || A.find((x) => !usedA.has(x) && keyOf(x) === keyOf(b));
    if (a) { usedA.add(a); pairs.push([a, b]); } else pairs.push([null, b]);
  }
  return { lens, before: before ? before.file : null, after: after ? after.file : null, A, B, pairs, loose: A.filter((x) => !usedA.has(x)), totals: { before: tally(A), after: tally(B) } };
}

/** The candidates the judge reads: each unpaired critical or high of the new report against each unpaired finding of the base. */
function candidates(p) {
  const out = [];
  p.pairs.forEach(([a, b], k) => { if (!a && HOLDS(b.severity)) p.loose.forEach((x, m) => out.push({ id: `${p.lens}:${k}:${m}`, state: { before: brief(p.lens, x), after: brief(p.lens, b) } })); });
  return out.slice(0, MAX_PAIRS);
}

/** The lens's verdict once the judge's confirmations are in: what holds, what rose, what was resolved. */
function settle(p, yes) {
  const taken = new Set();
  for (const [key, conf] of [...yes].sort((x, y) => y[1] - x[1])) {
    const [, k, m] = key.split(':').map(Number), x = p.loose[m];
    if (p.pairs[k][0] || taken.has(m)) continue;
    p.pairs[k][0] = x; taken.add(m);
  }
  const loose = p.loose.filter((_, m) => !taken.has(m));
  const held = [], raised = [];
  for (const [a, b] of p.pairs) {
    if (!a) { if (HOLDS(b.severity)) held.push({ lens: p.lens, id: b.id, name: b.label, severity: b.severity, what: whatOf(p.lens, b) }); continue; }
    if (RANK[b.severity] > RANK[a.severity] && HOLDS(b.severity)) raised.push({ lens: p.lens, id: b.id, name: b.label, from: a.severity, to: b.severity });
  }
  const resolved = loose.filter((x) => HOLDS(x.severity)).map((x) => ({ lens: p.lens, name: x.label, severity: x.severity }));
  const minor = ['medium', 'low'].reduce((n, s) => n + p.totals.after[s], 0) - ['medium', 'low'].reduce((n, s) => n + p.totals.before[s], 0);
  return { lens: p.lens, before: p.before, after: p.after, totals: p.totals, held, raised, resolved, minor: Math.max(0, minor) };
}
const sevName = (r) => Object.keys(RANK).find((k) => RANK[k] === r) || 'none';
const tally = (xs) => Object.fromEntries(Object.keys(RANK).map((s) => [s, xs.filter((i) => i.severity === s).length]));
function whatOf(lens, i) { try { const w = F.whatOf(lens, i.fields); return w ? F.plain(w.text || w).slice(0, 160) : ''; } catch { return ''; } }

/** Every lens asked: the verdict — kept unless a critical or high finding is new or raised. */
async function diff(root, ref, lenses, opts = {}) {
  root = path.resolve(root);
  if (!git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).ok) throw Object.assign(new Error(`no revision ${ref}`), { code: 2 });
  const missing = [], paired = [];
  for (const l of lenses) { const after = reportOnDisk(root, l); if (!after) missing.push(l); else paired.push(pairLens(l, reportAt(root, ref, l), after)); }
  const items = paired.flatMap(candidates);
  let yes = new Map(), pending = null, judgeNote = null, engine = null;
  if (items.length) {
    const JUDGE = require(fromSaSkills('scripts', 'judge.js'));
    engine = opts.engine || JUDGE.engineInForce();
    try {
      const r = await JUDGE.judge(SAME_FINDING, items, { engine, root, answers: opts.answers === undefined ? true : opts.answers });
      if (r.pending) pending = r.pending;
      for (const [id, a] of Object.entries(r.answers || {})) { const v = JUDGE.value(a); if (v != null && v >= SAME_FINDING.hi) yes.set(id, v); }
    } catch (e) { if (!(e instanceof JUDGE.JudgeError)) throw e; judgeNote = e.message; }
  }
  const per = paired.map((p) => settle(p, [...yes].filter(([id]) => id.startsWith(`${p.lens}:`))));
  const held = per.flatMap((p) => p.held), raised = per.flatMap((p) => p.raised);
  return { base: ref, verdict: held.length || raised.length || missing.length ? 'worsened' : 'kept', lenses: per, held, raised, missing,
    resolved: per.flatMap((p) => p.resolved), judge: { engine, pairs: items.length, confirmed: yes.size, pending, note: judgeNote } };
}

/** The verdict in Markdown, for the pull request's comment. */
function markdown(r, es) {
  const L = [], t = (en, s) => (es ? s : en);
  L.push(r.verdict === 'kept' ? t('**The analyses keep the state**: no critical or high finding is new or raised.', '**Los análisis mantienen el estado**: ningún hallazgo crítico o alto es nuevo ni subió.')
    : t('**The state moved**: the architect decides before this merges.', '**El estado cambió**: el arquitecto decide antes de fusionar.'));
  L.push('', `| ${t('Lens', 'Lente')} | ${t('Critical', 'Críticos')} | ${t('High', 'Altos')} | ${t('Report', 'Reporte')} |`, '|---|---|---|---|');
  for (const p of r.lenses) {
    const c = (s) => `${p.totals.before[s]} → ${p.totals.after[s]}`;
    L.push(`| ${p.lens} | ${c('critical')} | ${c('high')} | \`${p.after}\` |`);
  }
  for (const l of r.missing) L.push(`| ${l} | — | — | ${t('not produced', 'no se generó')} |`);
  if (r.held.length) { L.push('', t('**New**', '**Nuevos**')); r.held.forEach((h) => L.push(`- ${h.severity === 'critical' ? '🔴' : '🟠'} ${h.lens} \`${h.id}\` — ${h.name}${h.what ? `: ${h.what}` : ''}`)); }
  if (r.raised.length) { L.push('', t('**Raised**', '**Subieron**')); r.raised.forEach((h) => L.push(`- ${h.lens} — ${h.name}: ${h.from} → ${h.to}`)); }
  if (r.missing.length) L.push('', t(`**Not produced**: ${r.missing.join(', ')} — the run's log says why.`, `**No se generaron**: ${r.missing.join(', ')}; el registro del run dice por qué.`));
  if (r.resolved.length) { L.push('', t('**Resolved**', '**Resueltos**')); r.resolved.forEach((h) => L.push(`- ${h.lens} — ${h.name} (${h.severity})`)); }
  const minor = r.lenses.filter((p) => p.minor > 0);
  if (minor.length) L.push('', t(`More medium or low findings — they do not hold: ${minor.map((p) => `${p.lens} +${p.minor}`).join(' · ')}`, `Más hallazgos medios o bajos, no frenan: ${minor.map((p) => `${p.lens} +${p.minor}`).join(' · ')}`));
  if (r.judge && r.judge.pairs) L.push('', t(`Reworded findings: ${r.judge.pairs} pair(s) read by the judge (${r.judge.engine}), ${r.judge.confirmed} confirmed as the same finding${r.judge.pending ? '; the rest unanswered, so they hold' : ''}.`,
    `Hallazgos reescritos: ${r.judge.pairs} par(es) leídos por el juez (${r.judge.engine}), ${r.judge.confirmed} confirmados como el mismo hallazgo${r.judge.pending ? '; el resto sin respuesta, así que frenan' : ''}.`));
  return L.join('\n');
}

module.exports = { diff, pairLens, candidates, settle, markdown, SAME_FINDING };

if (require.main === module) {
  const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const root = argv.find((a, i) => !a.startsWith('--') && !['--base', '--lenses', '--judge', '--judge-answers'].includes(argv[i - 1])), ref = opt('--base');
  const lenses = (opt('--lenses') || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!root || !ref || !lenses.length) { console.error('usage: bun analysis-diff.js <project> --base <git-ref> --lenses spof,stride,… [--json] [--md]'); process.exit(2); }
  (async () => {
    const r = await diff(root, ref, lenses, { engine: opt('--judge'), answers: opt('--judge-answers') });
    const es = /<!--\s*(?:DOC_)?LANGUAGE:\s*es\b/i.test((() => { try { return fs.readFileSync(path.join(root, 'ARCHITECTURE.md'), 'utf8'); } catch { return ''; } })());
    if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else if (argv.includes('--md')) console.log(markdown(r, es));
    else {
      console.log(`analysis diff against ${ref}: ${r.verdict.toUpperCase()}`);
      for (const p of r.lenses) console.log(`  ${p.lens}: critical ${p.totals.before.critical} → ${p.totals.after.critical} · high ${p.totals.before.high} → ${p.totals.after.high}`);
      r.missing.forEach((l) => console.log(`  ${l}: no report produced`));
      r.held.forEach((h) => console.log(`  new ${h.severity}: ${h.lens} ${h.id} — ${h.name}`));
      r.raised.forEach((h) => console.log(`  raised: ${h.lens} — ${h.name} ${h.from} → ${h.to}`));
      if (r.judge.pairs) console.log(`  judge (${r.judge.engine}): ${r.judge.pairs} pair(s), ${r.judge.confirmed} the same finding${r.judge.pending ? ` — worksheet pending at ${r.judge.pending}: judge it and run again` : ''}${r.judge.note ? ` — ${r.judge.note}` : ''}`);
    }
    process.exit(r.verdict === 'kept' ? 0 : 3);
  })().catch((e) => { console.error(`analysis-diff: ${e.message}`); process.exit(e.code || 1); });
}
