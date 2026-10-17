#!/usr/bin/env node
// superseded-claims.js — does the architecture still assert a decision an ADR retired?
//
//   bun superseded-claims.js <project-root> [--adr ADR-NNN] [--judge agent|typesafe|clef] [--answers <file>]
//                            [--json] [--strict] [--min-shared N]
//
// When an ADR is superseded, or amended so that part of its decision is withdrawn, the ADR itself is edited and
// the sections that restated the old decision are not — the reference project kept the "token derived by
// algorithm" wording in five files after ADR-122 absorbed ADR-123 and reverted ADR-120's fourth amendment.
// Searching for the pattern one just wrote proves only that the edit landed; the survivors say the same thing in
// other words. Same three stages as every judged site of the plugin:
//
// Stage 1 (code) — the retired decisions:
//   (a) an ADR whose Status is `Superseded by ADR-X`: the sentences of its Decision section that the successor's
//       Decision does not carry (a sentence the successor restates in substance is not retired);
//   (b) an ADR whose Review History has `Amended` rows: from git, every Decision-section sentence that an older
//       revision of the file carried and the current one does not carry in substance. Without git the project
//       gets (a) only, and the report says so.
//   A retired sentence keeps only its *distinctive* stems — those the current decision (the ADR's own now, or the
//   successor's) never uses — and is dropped when fewer than two remain. The corpus (ARCHITECTURE.md + docs/**, not
//   adr/, not CHANGELOG*) is cut into blocks — paragraph, list item, table row with its header — and a block is a
//   candidate for a retired sentence when it shares at least `--min-shared` (default 2) of those stems.
// Stage 2 (scripts/judge.js) — one Noul per (block, retired sentence): does the passage state the retired decision
//   as how the system works now, rather than the current decision or history? A pair no judge has answered (the
//   agent worksheet still open, an engine that failed) is undecided — listed with the worksheet, never asserting,
//   never dismissed; the overlap share does not stand in for the answer (8.119.0).
// Stage 3 (code) — per retired decision, the passages that still assert it (≥ 0.75), those to review (0.4–0.75),
//   the undecided, and exit 1 under `--strict` when one asserts it or any is still undecided.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const JUDGE = require(path.join(__dirname, '..', '..', '..', 'scripts', 'judge.js'));

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const HI = 0.75, LO = 0.4;

// ── text units ───────────────────────────────────────────────────────────────────────────────────────
const plain = (s) => String(s).replace(/<!--[\s\S]*?-->/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_>#]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(('para como pero porque cuando donde desde hasta entre sobre sino tambien solo este esta estos estas ese esa esos esas aquel cada todo toda todos todas otro otra otros otras mismo misma ' +
  'tiene tienen puede pueden debe deben hace hacen sera seran queda quedan ningun ninguna ninguno siempre nunca antes despues ademas mientras segun contra sobre dentro fuera parte forma modo ' +
  'with that this these those from into which where when while there their they them then than have has been being were would could should does will shall about over under after before ' +
  'other each such only also more most many much some same both either neither every never always because since until what whom whose').split(' '));
const deaccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Content stems: lower-cased, accent-free, words of five letters or more cut to six — "deriva", "derivado", "derivan" meet. */
function stems(text) {
  const out = new Set();
  for (const w of deaccent(plain(text).toLowerCase()).match(/[a-z0-9]{5,}/g) || []) { if (STOP.has(w) || /^\d+$/.test(w)) continue; out.add(w.slice(0, 6)); }
  return out;
}
/** Sentences of a section body: list items and table rows are units of their own, prose splits on terminal punctuation. */
function sentencesOf(body) {
  const out = [];
  for (const raw of body.split('\n')) {
    const l = raw.trim();
    if (!l || /^\|?[\s:|-]+\|?$/.test(l) || /^```/.test(l) || /^#{1,6}\s/.test(l)) continue;
    const t = plain(l.replace(/^([-*+]|\d+\.)\s+/, ''));
    if (!t) continue;
    if (l.startsWith('|')) { out.push(t.replace(/\s*\|\s*/g, ' · ').replace(/^· |· $/g, '')); continue; }
    t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡"«*`\[(])/).forEach((s) => { if (s.split(/\s+/).length >= 4) out.push(s); });
  }
  return out;
}
/** The Decision section of an ADR, whatever its heading level: from the heading (or its SECTION anchor) to the next heading of the same or a higher level. */
function decisionOf(text) {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => /^#{1,6}\s/.test(l) && (/<!--\s*SECTION:\s*Decision\s*-->/.test(l) || /^#{1,6}\s+(?:\d+\.\s*)?(Decision|Decisi[óo]n)\b/i.test(l)));
  if (i < 0) return '';
  const level = lines[i].match(/^(#+)/)[1].length, body = [];
  for (let j = i + 1; j < lines.length; j++) { const h = lines[j].match(/^(#{1,6})\s/); if (h && h[1].length <= level) break; body.push(lines[j]); }
  return body.join('\n');
}
const jaccard = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };
/** A sentence is carried in substance by a text when one of its sentences shares half its stems. */
const carried = (sentence, others) => { const s = stems(sentence); return others.some((o) => jaccard(s, o) >= 0.5); };

// ── the ADRs ─────────────────────────────────────────────────────────────────────────────────────────
function adrsOf(root) {
  const dir = path.join(root, 'adr');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => /^ADR-\d{3,}.*\.md$/.test(n)).sort().map((n) => {
    const file = path.join(dir, n), text = read(file), id = n.match(/^(ADR-\d{3,})/)[1];
    const status = ((text.match(/^\*\*(?:Status|Estado)\*\*:?\s*(.+)$/m) || [])[1] || '').trim();
    const by = /superseded|reemplazad|sustituid/i.test(status) ? ((status.match(/ADR-\d{3,}/) || [])[0] || null) : null;
    const amended = /^\|[^|\n]*\|[^|\n]*\|\s*(Amended|Enmendad[oa])\s*\|/mi.test(text);
    return { id, file, rel: path.relative(root, file).replace(/\\/g, '/'), text, status, supersededBy: by, amended, decision: decisionOf(text) };
  });
}
const git = (root, args) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return r.status === 0 ? r.stdout.replace(/\r\n?/g, '\n') : null; };
/** Every earlier revision of the file, oldest first, following renames: [{ rev, date, text }]. `null` when git is unavailable or the file is not tracked. */
function revisionsOf(root, rel) {
  if (git(root, ['rev-parse', '--is-inside-work-tree']) === null) return null;
  const log = git(root, ['log', '--follow', '--format=%H %cs', '--name-only', '--', rel]);
  if (!log || !log.trim()) return null;
  const revs = [];
  const chunks = log.trim().split(/\n(?=[0-9a-f]{40} )/);
  for (const c of chunks) { const [head, ...names] = c.split('\n').filter(Boolean); const [rev, date] = head.split(' '); const p = names[names.length - 1] || rel; const t = git(root, ['show', `${rev}:${p}`]); if (t !== null) revs.push({ rev: rev.slice(0, 7), date, text: t }); }
  return revs.reverse();
}

/** Retired decisions: [{ source, adr, kind, since, retired: [{ text, stems }], current }] */
function retiredDecisions(root, adrs, opts = {}) {
  const byId = new Map(adrs.map((a) => [a.id, a]));
  const out = [], notes = [];
  let gitOk = null;
  // A sentence another in-force ADR decides is not retired, whatever happened to the ADR that repeated it — a
  // superseded ADR restates the rules it built on ("that decision established that the detector evaluates and never
  // enforces"), and those rules stand.
  const inForce = adrs.filter((a) => !a.supersededBy && !/deprecated|withdrawn|retirad/i.test(a.status));
  const decidedElsewhere = (owner) => inForce.filter((a) => a.id !== owner).flatMap((a) => sentencesOf(a.decision).map(stems));
  const elsewhere = new Map();
  const keep = (sentences, currentText, curSentences, owner) => {
    const curStems = stems(currentText), seen = new Set();
    if (!elsewhere.has(owner)) elsewhere.set(owner, decidedElsewhere(owner));
    const other = elsewhere.get(owner);
    return sentences.filter((s) => !carried(s, curSentences) && !carried(s, other)).map((s) => ({ text: s, stems: [...stems(s)].filter((x) => !curStems.has(x)) }))
      .filter((r) => r.stems.length >= 2 && !seen.has(r.text) && seen.add(r.text));
  };
  for (const a of adrs) {
    if (opts.adr && a.id !== opts.adr && a.supersededBy !== opts.adr) continue;
    if (a.supersededBy) {
      const succ = byId.get(a.supersededBy);
      if (!succ) { notes.push(`${a.id} is superseded by ${a.supersededBy}, which is not in adr/ — skipped`); continue; }
      const cur = succ.decision, curS = sentencesOf(cur).map(stems);
      const retired = keep(sentencesOf(a.decision), cur, curS, a.id);
      if (retired.length) out.push({ source: `${a.id} → ${succ.id}`, adr: a.id, kind: 'superseded', since: succ.id, retired, current: sentencesOf(cur) });
    }
    if (a.amended && !a.supersededBy) {
      const revs = revisionsOf(root, a.rel);
      if (revs === null) { gitOk = gitOk === null ? false : gitOk; continue; }
      gitOk = true;
      const cur = a.decision, curS = sentencesOf(cur).map(stems);
      const older = new Map();
      revs.slice(0, -1).forEach((r) => sentencesOf(decisionOf(r.text)).forEach((s) => { if (!older.has(s)) older.set(s, r); }));
      // a revision identical to the working copy retires nothing; the last committed one is compared too when the file is edited
      const retired = keep([...older.keys()], cur, curS, a.id);
      if (retired.length) out.push({ source: `${a.id} (amended)`, adr: a.id, kind: 'amended', since: revs.length ? revs[revs.length - 1].rev : null, retired: retired.map((r) => Object.assign(r, { rev: older.get(r.text).rev, date: older.get(r.text).date })), current: sentencesOf(cur) });
    }
  }
  if (gitOk === false) notes.push('git history unavailable — amended ADRs skipped, superseded ADRs only');
  return { decisions: out, notes };
}

// ── the corpus, by block ─────────────────────────────────────────────────────────────────────────────
const walk = (dir) => (!fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.md') ? [path.join(dir, e.name)] : []))));
function blocksOf(text) {
  const lines = text.split('\n'), out = [];
  let i = 0, fence = false, comment = false;
  const isSep = (s) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(s);
  const isItem = (s) => /^\s*([-*+]|\d+\.)\s/.test(s);
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*```/.test(l)) { fence = !fence; i++; continue; }
    if (fence) { i++; continue; }
    if (comment) { if (/-->/.test(l)) comment = false; i++; continue; }
    if (/^\s*<!--/.test(l) && !/-->/.test(l)) { comment = true; i++; continue; }
    if (!l.trim() || /^#{1,6}\s/.test(l) || /^\s*<!--.*-->\s*$/.test(l)) { i++; continue; }
    if (l.trim().startsWith('|') && lines[i + 1] && isSep(lines[i + 1])) {
      const header = l.trim(); i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { out.push({ line: i + 1, text: `${header}\n${lines[i].trim()}`, excerpt: lines[i].trim() }); i++; }
      continue;
    }
    const start = i, buf = [l]; i++;
    while (i < lines.length && lines[i].trim() && !/^#{1,6}\s|^\s*```|^\s*\|/.test(lines[i]) && !(isItem(lines[i]))) { buf.push(lines[i]); i++; }
    out.push({ line: start + 1, text: buf.join('\n'), excerpt: buf.join(' ') });
  }
  return out;
}

async function check(root, opts = {}) {
  root = path.resolve(root);
  const adrs = adrsOf(root);
  const { decisions, notes } = retiredDecisions(root, adrs, opts);
  const minShared = opts.minShared || 2;
  const files = [path.join(root, 'ARCHITECTURE.md'), ...walk(path.join(root, 'docs'))].filter((f) => fs.existsSync(f) && !/CHANGELOG[^/\\]*\.md$/i.test(f));
  const blocks = files.flatMap((f) => blocksOf(read(f)).map((b) => Object.assign(b, { file: path.relative(root, f).replace(/\\/g, '/'), stems: stems(b.text) })));
  // A stem the corpus uses everywhere ("ahora", "consecuencia") is no evidence of anything: weight by inverse block
  // frequency, and drop from the retired sentences any stem carried by more than `common` of the blocks.
  const df = new Map(); blocks.forEach((b) => b.stems.forEach((x) => df.set(x, (df.get(x) || 0) + 1)));
  const N = Math.max(blocks.length, 1), common = opts.common || 0.02;
  const idf = (x) => Math.log((N + 1) / ((df.get(x) || 0) + 1));
  decisions.forEach((d) => { d.retired = d.retired.map((r) => Object.assign({}, r, { stems: r.stems.filter((x) => (df.get(x) || 0) / N <= common) })).filter((r) => r.stems.length >= minShared); });
  // Stage 1 — one candidate per (block, retired decision): the retired sentence the block shares most with, by weight
  const cands = [];
  decisions.forEach((d, di) => blocks.forEach((b) => {
    let best = null;
    for (const r of d.retired) {
      const shared = r.stems.filter((x) => b.stems.has(x)); if (shared.length < minShared) continue;
      const score = shared.reduce((n, x) => n + idf(x), 0) / r.stems.reduce((n, x) => n + idf(x), 0);
      if (!best || score > best.score) best = { r, shared, score };
    }
    if (best) cands.push({ di, block: b, retired: best.r, shared: best.shared, score: +best.score.toFixed(2) });
  }));
  let engine = opts.engine, engineError = null;
  if (!engine) try { engine = JUDGE.engineInForce(); } catch (e) { if (e.name !== 'JudgeError') throw e; engineError = e.message; }
  const judgeInfo = { engine: engine || null, asked: cands.length, pending: null, note: engineError };
  const answers = {};
  if (cands.length) {
    const spec = { id: 'superseded-claims', type: 'noul', hi: HI, lo: LO,
      question: 'Does `item.passage` state the retired decision in `item.retired` as how the system works now — rather than stating the current decision in `item.current`, or telling the history of how the retired decision was replaced?',
      criteria: { true: 'The passage asserts the retired decision as current design: a reader would believe the system still works the way `item.retired` says.', false: 'The passage states the current decision, says the retired one was replaced or reverted, quotes it as history, or is about something else that happens to share words.' } };
    // the current decision as the judge sees it: the three sentences of it closest to the passage, not its first lines
    const closest = (d, b) => d.current.map((t) => ({ t, j: jaccard(stems(t), b.stems) })).sort((x, y) => y.j - x.j).slice(0, 3).map((x) => x.t).join(' ').slice(0, 700);
    const items = cands.map((c, i) => ({ id: `sc-${i}`, state: { passage: plain(c.block.text).slice(0, 900), retired: c.retired.text.slice(0, 500), current: closest(decisions[c.di], c.block) } }));
    if (!engineError) try {
      const res = await JUDGE.judge(spec, items, { engine, root, answers: opts.answers, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache });
      if (res.pending) judgeInfo.pending = res.pending;
      judgeInfo.engine = res.engine || engine;
      Object.assign(answers, res.answers || {});
    } catch (e) { if (e.name !== 'JudgeError') throw e; judgeInfo.note = e.message; }
  }
  const results = decisions.map((d) => ({ source: d.source, adr: d.adr, kind: d.kind, since: d.since, retired: d.retired.length, asserting: [], review: [], undecided: [], dismissed: 0 }));
  cands.forEach((c, i) => {
    const a = answers[`sc-${i}`], r = results[c.di];
    const row = { file: c.block.file, line: c.block.line, p: a ? +(a.p ?? 0).toFixed(2) : null, by: a ? a.by || judgeInfo.engine : 'undecided', excerpt: plain(c.block.excerpt).slice(0, 180), retired: c.retired.text.slice(0, 160), shared: c.shared };
    if (!a) { r.undecided.push(row); return; }
    if (row.p >= HI) r.asserting.push(row); else if (row.p >= LO) r.review.push(row); else r.dismissed++;
  });
  results.forEach((r) => { r.asserting.sort((a, b) => b.p - a.p); r.review.sort((a, b) => b.p - a.p); r.undecided.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line); });
  const asserting = results.reduce((n, r) => n + r.asserting.length, 0), undecided = results.reduce((n, r) => n + r.undecided.length, 0);
  return { root, engine: judgeInfo.engine, decisions: results, asserting, undecided, candidates: cands.length, judge: judgeInfo, notes, status: asserting ? 'FAIL' : undecided ? 'UNDECIDED' : 'PASS' };
}

function render(r) {
  const out = [`SUPERSEDED_CLAIMS: ${r.status} · ${r.decisions.length} retired decision(s) · ${r.candidates} candidate passage(s) · judged by ${r.engine || 'no engine'} · ${r.asserting} still asserting · ${r.undecided} undecided`];
  r.notes.forEach((n) => out.push(`  note: ${n}`));
  if (r.undecided) out.push(`  undecided: ${r.undecided} passage(s) no judge has answered — neither asserting nor dismissed; ${r.judge.pending ? `answer the worksheet ${r.judge.pending} and re-run` : 'set a judge (--judge agent|typesafe|clef, or SA_JUDGE) and re-run'}`);
  if (r.judge.note) out.push(`  judge: ${r.judge.note}`);
  const files = new Set();
  r.decisions.forEach((d) => {
    if (!d.asserting.length && !d.review.length && !d.undecided.length) return;
    out.push(`\n  ${d.source} — ${d.kind}${d.since ? ` (since ${d.since})` : ''}, ${d.retired} retired sentence(s)`);
    d.asserting.forEach((x) => { files.add(x.file); out.push(`    ✗ ${x.file}:${x.line} [${x.by} ${x.p}] — ${x.excerpt}\n        retired: ${x.retired}`); });
    d.review.slice(0, 50).forEach((x) => out.push(`    ? ${x.file}:${x.line} [${x.by} ${x.p}] — ${x.excerpt}`));
    d.undecided.slice(0, 30).forEach((x) => out.push(`    … ${x.file}:${x.line} [undecided] — ${x.excerpt}\n        retired: ${x.retired}`));
    if (d.undecided.length > 30) out.push(`    … ${d.undecided.length - 30} more undecided`);
    if (d.dismissed) out.push(`    ${d.dismissed} passage(s) dismissed by the judge`);
  });
  out.push(`\n  ${r.asserting} passage(s) in ${files.size} file(s) still assert a retired decision${r.undecided ? ` · ${r.undecided} undecided` : ''}`);
  return out.join('\n');
}

module.exports = { check, render, retiredDecisions, adrsOf, decisionOf, sentencesOf, stems, blocksOf };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args.find((a, i) => !a.startsWith('--') && !['--adr', '--judge', '--answers', '--min-shared'].includes(args[i - 1]));
  if (!root) { console.error('Usage: bun superseded-claims.js <project-root> [--adr ADR-NNN] [--judge agent|typesafe|clef] [--answers <file>] [--json] [--strict] [--min-shared N]'); process.exit(2); }
  let engine; try { engine = opt('--judge') || JUDGE.engineInForce(); } catch (e) { console.error(`superseded-claims: ${e.message}`); process.exit(2); }
  if (!JUDGE.ENGINES.includes(engine)) { console.error(`superseded-claims: --judge ${engine} — must be one of ${JUDGE.ENGINES.join(' | ')}`); process.exit(2); }
  let answers; if (opt('--answers')) answers = JSON.parse(read(opt('--answers')));
  let r; try { r = await check(root, { adr: opt('--adr'), engine, answers, minShared: opt('--min-shared') ? Number(opt('--min-shared')) : undefined }); } catch (e) { console.error('superseded-claims: ' + (e.stack || e.message)); process.exit(2); }
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(args.includes('--strict') && (r.asserting || r.undecided) ? 1 : 0);
})();
