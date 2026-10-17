#!/usr/bin/env node
// qualifier-check.js — did a rewrite keep the qualifiers the text carried? Workflow 12's review gate before the stamp.
//
//   bun qualifier-check.js <project-root> [--base <git-ref>] [--file <path> …] [--judge agent|typesafe|clef] [--answers <answers.json>] [--json]
//
// A restyle shortens and splits, and the word it drops first is the one that made the claim honest: a decision
// still `Proposed` stated as in force, a `no verificado` gone, a severity gone, a target threshold stated as a
// measured one, a cost that stops carrying its number. A grep ledger over the result cannot see any of them — the
// qualifier is absent, not wrong. On the reference restyle the ledgers missed every softened cost (12 in the
// principles, about 25 elsewhere) and the Layer 2 reviewer, which read before and after, caught all of them.
//
// Stage 1 (code): `git diff -U0 <base>` over ARCHITECTURE.md, docs/**/*.md, adr/**/*.md and tdr/**/*.md; each hunk's removed text
// is paired with its added text (a pure deletion is paired with the added hunk of the same file it shares the most
// words with, so a paragraph moved within the file is compared with where it went; a removed line that reappears
// verbatim is not a change). A bilingual lexicon counts five qualifier categories — status, verification, severity,
// measurement, cost — on both sides; a category the removed text carries more often than the added text is a
// candidate. `status` also counts an ADR the ledger lists as Proposed cited beside a proposed marker.
// Stage 2 (scripts/judge.js): one Noul per candidate — does AFTER drop the qualifier, stating the thing as settled?
// A candidate no judge has answered (the agent worksheet still open, an engine that failed) is undecided: listed with the
// worksheet, never read as dropped or kept, and the run is UNDECIDED (exit 1) until it is answered. Stage 3 (code): a
// finding at p ≥ 0.6 stands and exits 1; 0.4–0.6 prints under "to confirm"; below 0.4 the rewrite kept the qualifier.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const JUDGE = require(path.join(__dirname, '..', '..', '..', 'scripts', 'judge.js'));

const HI = 0.6, LO = 0.4;
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).replace(/\r\n?/g, '\n');
const excerpt = (s, n = 180) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const w = (alts, flags = 'gu') => new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts})(?![\\p{L}\\p{N}])`, flags);

// ── the lexicon: both branches always; what a category means is in its `q` ─────────────────────────
const CATEGORIES = {
  status: { re: [w('Proposed|Propuest[oa]s?|propuest[oa]s?|Draft|Borrador|borrador|pendiente de aprobaci[óo]n|pending approval|en revisi[óo]n|under review|sin aprobar|not yet accepted|a[úu]n no aceptad[oa]')],
    q: 'that a decision is still proposed, draft or pending approval — not in force' },
  verification: { re: [w('no verificad[oa]s?|sin verificar|unverified|not verified|por confirmar|pendiente de confirmar|to be confirmed|TBC|supuest[oa]s?|assumption|assumed|asumid[oa]s?|hip[óo]tesis|hypothesis', 'giu')],
    q: 'that a claim is unverified, assumed or awaiting confirmation' },
  severity: { re: [w('Cr[íi]tic[ao]s?|Critical|Alt[ao]s?|High|Medi[ao]s?|Medium|Baj[ao]s?|Low|Sev-?\\d|P[0-4]|BLOCKING|bloqueante')],
    q: 'the severity or priority rating of a risk, gap or finding' },
  measurement: { re: [w('sin medir|no medid[oa]s?|unmeasured|not measured|not yet measured|objetivo|target|estimad[oa]s?|estimated|estimate|por validar|to be validated|pendiente de medici[óo]n|aproximad[oa]s?|approximately|approx\\.?|meta de dise[ñn]o|design target', 'giu'), /~\s?\d/g],
    q: 'that a number is a target, an estimate or not yet measured — not an observed, working value' },
  cost: { re: [/(?:cost[oe]s?|costs?|cuest[ae]n?|penalizaci[óo]n|penalty|overhead|sobrecosto|deuda|debt|latencia adicional|extra latency|consumo)[^.\n|]{0,60}?\d|\d[^.\n|]{0,40}?(?:cost[oe]s?|costs?|penalizaci[óo]n|penalty|overhead|sobrecosto|deuda|debt)/giu],
    q: 'a cost, penalty or debt together with its magnitude' },
};
const LIFECYCLE = /(?<![\p{L}])(?:Accepted|Aceptad[oa]|Superseded|Reemplazad[oa]|Sustituid[oa]|Deprecated|Obsolet[oa]|Rejected|Rechazad[oa]|Withdrawn|Retirad[oa])(?![\p{L}])/u;
const count = (text, cat) => CATEGORIES[cat].re.reduce((n, re) => n + [...String(text).matchAll(re)].length, 0);
const hits = (text, cat) => CATEGORIES[cat].re.flatMap((re) => [...String(text).matchAll(re)].map((m) => m[0]));

// ── the diff: hunks with removed and added text and the after-side line ─────────────────────────────
function hunksOf(diff) {
  const files = []; let cur = null, h = null;
  for (const l of diff.split('\n')) {
    if (l.startsWith('diff --git ')) { cur = { file: null, hunks: [] }; files.push(cur); h = null; continue; }
    if (!cur) continue;
    if (l.startsWith('+++ ')) { cur.file = l.slice(4).replace(/^b\//, ''); continue; }
    if (l.startsWith('--- ')) continue;
    const m = l.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (m) { h = { oldLine: +m[1], newLine: +m[3], removed: [], added: [] }; cur.hunks.push(h); continue; }
    if (!h) continue;
    if (l.startsWith('-')) h.removed.push(l.slice(1)); else if (l.startsWith('+')) h.added.push(l.slice(1));
  }
  return files.filter((f) => f.file && f.file !== '/dev/null');
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const wordsOf = (s) => new Set((s.toLowerCase().match(/\p{L}{4,}/gu) || []));
const overlap = (a, b) => { const A = wordsOf(a), B = wordsOf(b); if (!A.size || !B.size) return 0; let n = 0; A.forEach((x) => B.has(x) && n++); return n / Math.min(A.size, B.size); };

/** The ADRs the project lists as Proposed — from the files themselves, so the check needs no ledger. */
function proposedAdrs(root) {
  const dir = path.join(root, 'adr'), out = new Set();
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(ADR-\d{3})/); if (!m) continue;
    const head = read(path.join(dir, f)).split('\n').slice(0, 30).join('\n');
    const s = head.match(/^(?:\*\*(?:Status|Estado)\*\*:?|status:)\s*(.+)$/im);
    if (s && /propos|propuest/i.test(s[1])) out.add(m[1]);
  }
  return out;
}

async function check(root, opts = {}) {
  root = path.resolve(root);
  const base = opts.base || 'HEAD';
  try { git(root, ['rev-parse', '--verify', base + '^{commit}']); } catch { throw new Error(`'${base}' is not a commit in ${root} — qualifier-check compares against git history`); }
  const scope = opts.files && opts.files.length ? opts.files.map((f) => path.relative(root, path.resolve(root, f)).replace(/\\/g, '/')) : ['ARCHITECTURE.md', 'docs', 'adr', 'tdr'];
  const diff = git(root, ['diff', '-U0', '--no-color', '--no-renames', base, '--', ...scope]);
  const files = hunksOf(diff).filter((f) => /\.md$/.test(f.file));
  const proposed = proposedAdrs(root);
  const cands = []; let pureDeletions = 0;

  for (const f of files) {
    const addedAll = new Set(f.hunks.flatMap((h) => h.added.map(norm)).filter(Boolean));
    for (const h of f.hunks) {
      const removedLines = h.removed.filter((l) => l.trim() && !addedAll.has(norm(l)));   // a line that reappears verbatim moved, it did not change
      if (!removedLines.length) continue;
      const before = removedLines.join('\n');
      let after = h.added.join('\n'), line = h.newLine;
      if (!after.trim()) {
        const partner = f.hunks.filter((o) => o !== h && o.added.join('').trim()).map((o) => ({ o, s: overlap(before, o.added.join('\n')) })).sort((a, b) => b.s - a.s)[0];
        if (!partner || partner.s < 0.3) { pureDeletions++; continue; }                     // a deleted claim is fact-locate's question, not a softened one
        after = partner.o.added.join('\n'); line = partner.o.newLine;
      }
      for (const cat of Object.keys(CATEGORIES)) {
        let b = count(before, cat), a = count(after, cat);
        if (cat === 'status') {                                                              // a Proposed ADR cited beside its marker counts once more on the side that keeps the marker
          const ids = (s) => (s.match(/ADR-\d{3}/g) || []).filter((id) => proposed.has(id));
          if (ids(before).length && b) b++;
          if (ids(after).length && a) a++;
          if (ids(after).length && !a && ids(before).length && !b) continue;
          if (LIFECYCLE.test(after)) continue;                                               // Proposed → Accepted / Superseded is a lifecycle move, not a softening
        }
        if (b > a) cands.push({ file: f.file, line, category: cat, before, after, matched: [...new Set(hits(before, cat))].slice(0, 6) });
      }
    }
  }

  let engine = opts.engine, engineError = null;
  if (!engine) try { engine = JUDGE.engineInForce(); } catch (e) { if (e.name !== 'JudgeError') throw e; engineError = e.message; }
  const judge = { engine: engine || null, asked: cands.length, pending: null, note: engineError };
  let answers = {};
  if (cands.length) {
    const spec = { id: 'qualifier-preservation', type: 'noul',
      question: 'BEFORE carries a qualifier — `item.qualifier` (words: `item.matched`). Does AFTER drop or soften it, stating the same thing as settled, in force or measured without it?',
      criteria: { true: 'AFTER no longer says it: the decision reads as in force, the claim as verified, the risk without its severity, the target as a working value, the cost without its magnitude — or the qualified clause is gone while the claim stays.', false: 'AFTER still states the qualifier, in the same or other words (e.g. "Propuesto" → "pendiente de aceptación", "Alta" → a High column), or the qualified claim itself was removed or moved together with its qualifier.' } };
    const items = cands.map((c, i) => ({ id: `q-${i}`, state: { qualifier: CATEGORIES[c.category].q, matched: c.matched.join(', '), before: excerpt(c.before, 1200), after: excerpt(c.after, 1200) } }));
    if (!engineError) try {
      const res = await JUDGE.judge(spec, items, { engine, root, answers: opts.answers, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache });
      if (res.pending) judge.pending = res.pending; else judge.engine = res.engine;
      answers = res.answers || {};
    } catch (e) { if (e.name !== 'JudgeError') throw e; judge.note = e.message; }
  }
  const findings = [], toConfirm = [], kept = [], undecided = [];
  cands.forEach((c, i) => {
    const a = answers[`q-${i}`];
    const row = { file: c.file, line: c.line, category: c.category, matched: c.matched, before: excerpt(c.before), after: excerpt(c.after), p: a ? +Number(a.p).toFixed(2) : null, by: a ? a.by : 'undecided', fix: `Restore the ${c.category} qualifier (${c.matched.join(', ')}) in the rewritten text, or state why it no longer holds.` };
    if (!a) undecided.push(row); else if (a.p >= HI) findings.push(row); else if (a.p >= LO) toConfirm.push(row); else kept.push(row);
  });
  return { status: findings.length ? 'FAIL' : undecided.length ? 'UNDECIDED' : 'PASS', base, filesChanged: files.length, candidates: cands.length, pureDeletions, findings, toConfirm, kept, undecided, judge };
}

function render(r) {
  const out = [`QUALIFIER_CHECK: ${r.status} · base ${r.base} · ${r.filesChanged} file(s) changed · ${r.candidates} candidate(s) · ${r.findings.length} dropped · ${r.toConfirm.length} to confirm · ${r.kept.length} kept in other words · ${r.undecided.length} undecided · judge ${r.judge.engine || 'none'}${r.judge.note ? ` (${r.judge.note})` : ''}`];
  const row = (f, mark) => [`  ${mark} ${f.file}:${f.line} [${f.category}] ${f.p == null ? '' : `(${f.by} ${f.p}) `}— ${f.matched.join(', ')}`, `      before: ${f.before}`, `      after:  ${f.after || '(nothing)'}`].join('\n');
  r.findings.forEach((f) => out.push(row(f, '✗')));
  if (r.toConfirm.length) { out.push('  to confirm:'); r.toConfirm.forEach((f) => out.push(row(f, '?'))); }
  if (r.undecided.length) { out.push(`  undecided — no judge has answered ${r.undecided.length} candidate(s); ${r.judge.pending ? `answer the worksheet ${r.judge.pending} and re-run` : 'set a judge (--judge agent|typesafe|clef, or SA_JUDGE) and re-run'}:`); r.undecided.forEach((f) => out.push(row(f, '…'))); }
  if (r.pureDeletions) out.push(`  ${r.pureDeletions} deleted block(s) with no rewritten counterpart — check them with fact-locate.js --base ${r.base}`);
  return out.join('\n');
}

module.exports = { check, render, CATEGORIES, count, hunksOf };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args.find((a, i) => !a.startsWith('--') && !['--base', '--file', '--judge', '--answers'].includes(args[i - 1]));
  if (!root) { console.error('Usage: bun qualifier-check.js <project-root> [--base <git-ref>] [--file <path> …] [--judge agent|typesafe|clef] [--answers <answers.json>] [--json]'); process.exit(2); }
  const files = args.flatMap((a, i) => (a === '--file' ? [args[i + 1]] : []));
  let r; try { r = await check(root, { base: opt('--base'), files, engine: opt('--judge'), answers: opt('--answers') ? path.resolve(opt('--answers')) : undefined }); } catch (e) { console.error('qualifier-check: ' + e.message); process.exit(2); }
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.status === 'PASS' ? 0 : 1);
})();
