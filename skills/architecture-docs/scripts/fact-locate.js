#!/usr/bin/env node
// fact-locate.js — is the fact a rewrite removed still stated where the kept link points?
//
//   bun fact-locate.js <project-root> --removed "<text>" --target <path[#anchor-or-heading]> [--judge …] [--json]
//   bun fact-locate.js <project-root> --pairs <pairs.json> [--judge …] [--json]        # [{ removed, target, file?, line? }]
//   bun fact-locate.js <project-root> --base <git-ref> [--file <path> …] [--judge …] [--json]
//
// Workflow 12's rule is "never drop a fact from the corpus": a restyle may delete a passage from a section when the
// fact it carried is stated where the surviving text links to — the ADR a principle cites, the descriptor a table row
// names. This is the check that makes the deletion allowed. Without it the only safe rewrite was a split, and a split
// never makes a file shorter.
//
// Stage 1 (code): the salient tokens of the removed text — numbers with a unit or a percentage, multi-digit numbers,
// identifiers (ADR-NNN, TDR-NNN, UC-n, I-nn, LA*nn), backticked names, the canonical component and system names and the
// technologies the facts ledger carries; the target resolved to a file and, with an anchor, to its section (a heading
// whose slug or text matches, or a `<!-- SECTION: -->` / `<!-- LABEL: -->` anchor; the section runs to the next heading
// of the same or a higher level). Coverage = the share of tokens the section states. With no salient token, the share of
// content words stands in. Stage 2 (scripts/judge.js): one Noul per pair — does TARGET state the fact of REMOVED? A pair
// no judge has answered (the agent worksheet still open, an engine that failed) is `undecided`: coverage is printed
// beside it, never read as the answer (8.119.0). Stage 3 (code): `located` at p ≥ 0.75, else `missing` with the tokens
// the target lacks (a target that does not resolve is `missing` without asking); exit 1 when a pair is missing or undecided.
//
// --base mode builds the pairs from `git diff -U0 <base>`: for every hunk that removed text carrying salient tokens,
// each removed line (a paragraph, a bullet, a row) is paired with the added line of its hunk it shares the most words
// with, and the targets are that line's relative links. A rewrite that restates every token in its own added text is `rewritten` (no link needed); a removal with no link
// near it is `unlinked` — located anywhere in the corpus or missing from it, reported apart.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const JUDGE = require(path.join(__dirname, '..', '..', '..', 'scripts', 'judge.js'));

const LOCATED = 0.75, COVERAGE_OK = 0.8;
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).replace(/\r\n?/g, '\n');
const excerpt = (s, n = 160) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const walk = (dir) => (!fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.md') ? [path.join(dir, e.name)] : []))));

// a comparable form: case, accents, backticks and bold off; decimal comma to point; no space before a unit or %
const canon = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[`*]/g, '').replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)\s+(%|ms\b|s\b|min\b|h\b|gb\b|mb\b|kb\b|tb\b)/g, '$1$2').replace(/\s+/g, ' ');
const slug = (s) => canon(s).replace(/<!--[\s\S]*?-->/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

let NAMES = null;
function namesOf(root) {
  if (NAMES && NAMES.root === root) return NAMES.list;
  let list = [];
  try {
    const { collect } = require(path.join(__dirname, 'arch-facts.js'));
    const f = collect(root);
    list = [...(f.components || []).flatMap((c) => [c.name, ...(c.technology || [])]), ...(f.systems || []).map((s) => s.name)].filter((s) => s && String(s).length >= 3);
  } catch { list = []; }
  NAMES = { root, list: [...new Set(list.map(String))] };
  return NAMES.list;
}

/** The salient tokens of a passage — what a statement of the same fact elsewhere has to contain. */
function tokensOf(text, root) {
  const t = String(text), out = new Set();
  for (const m of t.matchAll(/`([^`]+)`/g)) out.add(m[1].trim());
  for (const m of t.matchAll(/\b(?:ADR|TDR)-\d{3}\b|\bUC-\d+\b|\bI-\d{2,}\b|\bLA[A-Z]*\d+\b/g)) out.add(m[0]);
  for (const m of t.matchAll(/\d+(?:[.,]\d+)?\s*(?:%|ms|min|h|s|GB|MB|KB|TB|rps|tps|rpm|d[íi]as|days|horas|hours|r[ée]plicas|replicas|x)\b|\d+(?:[.,]\d+)?\s*%/giu)) out.add(m[0].trim());
  for (const m of t.replace(/`[^`]*`/g, ' ').matchAll(/(?<![\p{L}\p{N}.,-])\d{2,}(?:[.,]\d+)?(?![\p{L}\p{N}%])/gu)) out.add(m[0]);
  const low = canon(t);
  for (const n of namesOf(root)) if (low.includes(canon(n))) out.add(n);
  return [...out].filter((x) => x.length >= 2);
}
const contentWords = (s) => [...new Set((canon(s).match(/\p{L}{6,}/gu) || []))];

/** The target's text: the file, or the section an anchor names. Levels are read from the document, never pinned. */
function resolveTarget(root, target, fromFile) {
  const [p, anchor] = String(target).split('#');
  const candidates = [fromFile ? path.resolve(path.dirname(path.resolve(root, fromFile)), p) : null, path.resolve(root, p)].filter(Boolean);
  const file = candidates.find((c) => p && fs.existsSync(c) && fs.statSync(c).isFile());
  if (!file) return { file: null, text: '', note: `target not found: ${target}` };
  const text = read(file);
  if (!anchor) return { file, text, section: null };
  const lines = text.split('\n'), want = slug(decodeURIComponent(anchor));
  const at = lines.findIndex((l) => { const h = l.match(/^(#{1,6})\s+(.*)$/); if (!h) return false; const a = (h[2].match(/<!--\s*(?:SECTION|LABEL):\s*([^>]*?)\s*-->/) || [])[1]; return slug(h[2]) === want || (a && slug(a) === want) || slug(h[2]).includes(want); });
  if (at < 0) return { file, text, section: null, note: `anchor #${anchor} not found — the whole file is searched` };
  const level = lines[at].match(/^(#{1,6})/)[1].length;
  let end = at + 1; while (end < lines.length && !(lines[end].match(/^(#{1,6})\s/) && lines[end].match(/^(#{1,6})/)[1].length <= level)) end++;
  return { file, text: lines.slice(at, end).join('\n'), section: lines[at].replace(/^#+\s*/, '').replace(/<!--[\s\S]*?-->/g, '').trim() };
}
/** What the judge reads of a long target: the blocks that state a token, in document order, under a budget — the head of a
 *  4,500-word ADR rarely holds the fact a principle bullet cited it for, and a judge reading only the head answers `missing`. */
function windowsOf(text, tokens, budget = 3500) {
  const blocks = String(text).split(/\n\s*\n/), keys = tokens.map(canon);
  const scored = blocks.map((b, i) => ({ b, i, n: keys.filter((k) => canon(b).includes(k)).length })).filter((x) => x.n);
  scored.sort((a, b) => b.n - a.n || a.i - b.i);
  const pick = []; let used = 0;
  for (const x of scored) { if (used + x.b.length > budget && pick.length) continue; pick.push(x); used += x.b.length; }
  return pick.length ? pick.sort((a, b) => a.i - b.i).map((x) => x.b.trim()).join('\n\n…\n\n').slice(0, budget) : excerpt(text, budget);
}
function coverage(tokens, words, text) {
  const t = canon(text);
  if (tokens.length) { const missing = tokens.filter((k) => !t.includes(canon(k))); return { coverage: 1 - missing.length / tokens.length, missing, basis: 'tokens' }; }
  if (!words.length) return { coverage: 0, missing: [], basis: 'none' };
  const missing = words.filter((k) => !t.includes(k)); return { coverage: 1 - missing.length / words.length, missing: missing.slice(0, 8), basis: 'words' };
}

async function locate(root, pairs, opts = {}) {
  root = path.resolve(root);
  const rows = pairs.map((p) => {
    const tokens = tokensOf(p.removed, root), words = tokens.length ? [] : contentWords(p.removed);
    const tgt = resolveTarget(root, p.target, p.file);
    const cov = coverage(tokens, words, tgt.text);
    return { ...p, tokens, targetFile: tgt.file ? path.relative(root, tgt.file).replace(/\\/g, '/') : null, section: tgt.section || null, note: tgt.note || null, targetText: tgt.text, ...cov };
  });
  // The judge in force answers (--judge, else SA_JUDGE, else the agent worksheet). Measured on a real restyle, Jev answered
  // `missing` for all 88 linked removals — 78 of which code located token by token — because a restyled bullet merges
  // several facts and the question asks for every one of them: coverage and the missing tokens print beside every answer
  // so the reviewer sees a disagreement, but coverage never answers in the judge's place.
  let engine = opts.engine, engineError = null;
  if (!engine) try { engine = JUDGE.engineInForce(); } catch (e) { if (e.name !== 'JudgeError') throw e; engineError = e.message; }
  const judge = { engine: engine || null, asked: 0, pending: null, note: engineError };
  let answers = {};
  const ask = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.targetFile);
  if (ask.length) {
    judge.asked = ask.length;
    const spec = { id: 'fact-locate', type: 'noul', question: 'Does `item.target` state the fact that `item.removed` states — the same values, names and conditions, in any wording?',
      criteria: { true: 'Every value, name and condition of REMOVED is stated in TARGET (it may say more).', false: 'TARGET omits or contradicts part of REMOVED — a number, a name, a condition or a qualifier.' } };
    const items = ask.map(({ r, i }) => ({ id: `f-${i}`, state: { removed: excerpt(r.removed, 1500), target: windowsOf(r.targetText, r.tokens.length ? r.tokens : contentWords(r.removed)) } }));
    if (!engineError) try {
      const res = await JUDGE.judge(spec, items, { engine, root, chunk: opts.chunk || 4, answers: opts.answers, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache });
      if (res.pending) judge.pending = res.pending; else judge.engine = res.engine;
      answers = res.answers || {};
    } catch (e) { if (e.name !== 'JudgeError') throw e; judge.note = e.message; }
  }
  const out = rows.map((r, i) => { const a = answers[`f-${i}`]; const { targetText, ...rest } = r;
    const status = !r.targetFile ? 'missing' : !a ? 'undecided' : a.p >= LOCATED ? 'located' : 'missing';
    return { ...rest, removed: excerpt(r.removed), coverage: +r.coverage.toFixed(2), p: a ? +Number(a.p).toFixed(2) : null, by: a ? a.by : r.targetFile ? 'undecided' : null, status }; });
  return { status: statusOf(out), pairs: out, judge };
}

const statusOf = (rows) => (rows.some((r) => r.status === 'missing') ? 'FAIL' : rows.some((r) => r.status === 'undecided') ? 'UNDECIDED' : 'PASS');
const MARK = { located: '✓', missing: '✗', undecided: '…' };
const undecidedLine = (r, rows) => { const n = rows.filter((p) => p.status === 'undecided').length; return n ? `  undecided: ${n} pair(s) no judge has answered — neither located nor missing; ${r.judge.pending ? `answer the worksheet ${r.judge.pending} and re-run` : 'set a judge (--judge agent|typesafe|clef, or SA_JUDGE) and re-run'}` : null; };

// ── --base: the pairs a rewrite implies ────────────────────────────────────────────────────────────
function hunksOf(diff) {
  const files = []; let cur = null, h = null;
  for (const l of diff.split('\n')) {
    if (l.startsWith('diff --git ')) { cur = { file: null, hunks: [] }; files.push(cur); h = null; continue; }
    if (!cur) continue;
    if (l.startsWith('+++ ')) { cur.file = l.slice(4).replace(/^b\//, ''); continue; }
    if (l.startsWith('--- ')) continue;
    const m = l.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (m) { h = { oldLine: +m[1], newLine: +m[3], newCount: m[4] === undefined ? 1 : +m[4], removed: [], added: [] }; cur.hunks.push(h); continue; }
    if (!h) continue;
    if (l.startsWith('-')) h.removed.push(l.slice(1)); else if (l.startsWith('+')) h.added.push(l.slice(1));
  }
  return files.filter((f) => f.file && f.file !== '/dev/null');
}
const linksOf = (s) => [...String(s).matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]).filter((u) => !/^[a-z]+:/i.test(u) && !u.startsWith('#'));

async function fromBase(root, opts = {}) {
  root = path.resolve(root);
  const base = opts.base;
  try { git(root, ['rev-parse', '--verify', base + '^{commit}']); } catch { throw new Error(`'${base}' is not a commit in ${root}`); }
  const scope = opts.files && opts.files.length ? opts.files.map((f) => path.relative(root, path.resolve(root, f)).replace(/\\/g, '/')) : ['ARCHITECTURE.md', 'docs'];
  const files = hunksOf(git(root, ['diff', '-U0', '--no-color', '--no-renames', base, '--', ...scope])).filter((f) => /\.md$/.test(f.file));
  const pairs = [], rewritten = [], unlinked = [];
  let corpus = null;
  const corpusText = () => corpus || (corpus = [path.join(root, 'ARCHITECTURE.md'), ...walk(path.join(root, 'docs')), ...walk(path.join(root, 'adr'))].filter((p) => fs.existsSync(p)).map(read).join('\n'));
  const wordsOf = (x) => new Set((canon(x).match(/\p{L}{4,}/gu) || []));
  const overlap = (x, y) => { const A = wordsOf(x), B = wordsOf(y); if (!A.size || !B.size) return 0; let n = 0; A.forEach((k) => B.has(k) && n++); return n / Math.min(A.size, B.size); };
  for (const f of files) {
    for (const h of f.hunks) {
      const added = h.added.filter((l) => l.trim());
      for (const removed of h.removed.map((l) => l.trim()).filter(Boolean)) {                 // one block per line: a paragraph, a bullet, a row
        const tokens = tokensOf(removed, root); if (!tokens.length) continue;               // prose with no value, name or id: a split, not a fact move
        if (coverage(tokens, [], added.join('\n')).coverage >= COVERAGE_OK) { rewritten.push({ file: f.file, line: h.newLine, removed: excerpt(removed) }); continue; }
        // its surviving counterpart: the added block of the hunk it shares the most words with
        const partner = added.map((l, i) => ({ l, i, s: overlap(removed, l) })).sort((x, y) => y.s - x.s)[0];
        const links = partner && partner.s >= 0.3 ? [...new Set(linksOf(partner.l))] : [];
        const line = partner && partner.s >= 0.3 ? h.newLine + h.added.indexOf(partner.l) : h.newLine;
        if (!links.length) { const c = coverage(tokens, [], corpusText()); unlinked.push({ file: f.file, line, removed: excerpt(removed), coverage: +c.coverage.toFixed(2), missing: c.missing, status: c.coverage >= COVERAGE_OK ? 'located-elsewhere' : 'missing' }); continue; }
        links.forEach((target) => pairs.push({ removed, target, file: f.file, line }));
      }
    }
  }
  // a removal counts as located when any one of its links states it
  // a removal counts as located when any one of its links states it, undecided while one is unanswered and none located
  const res = pairs.length ? await locate(root, pairs, opts) : { status: 'PASS', pairs: [], judge: { engine: opts.engine || null, asked: 0, pending: null, note: null } };
  const RANK = { located: 2, undecided: 1, missing: 0 };
  const byRemoval = new Map();
  res.pairs.forEach((p) => { const k = `${p.file}:${p.line}`; const prev = byRemoval.get(k); if (!prev || RANK[p.status] > RANK[prev.status] || (p.status === prev.status && (p.p ?? 0) > (prev.p ?? 0))) byRemoval.set(k, p); });
  const linked = [...byRemoval.values()];
  const status = statusOf([...linked, ...unlinked]);
  return { status, base, linked, rewritten, unlinked, judge: res.judge };
}

function render(r) {
  if (r.base !== undefined) {
    const out = [`FACT_LOCATE: ${r.status} · base ${r.base} · ${r.linked.length} linked removal(s) · ${r.rewritten.length} rewritten in place · ${r.unlinked.length} unlinked · judge ${r.judge.engine || 'none'}${r.judge.note ? ` (${r.judge.note})` : ''}`];
    const u = undecidedLine(r, r.linked); if (u) out.push(u);
    r.linked.forEach((p) => out.push(`  ${MARK[p.status]} ${p.file}:${p.line} → ${p.target}${p.section ? ` (§ ${p.section})` : ''} · coverage ${p.coverage}${p.p != null ? ` · ${p.by} ${p.p}` : p.status === 'undecided' ? ' · undecided' : ''}${p.status === 'missing' && p.missing.length ? ` · missing: ${p.missing.slice(0, 8).join(', ')}` : ''}${p.note ? ` · ${p.note}` : ''}\n      removed: ${p.removed}`));
    r.unlinked.forEach((u) => out.push(`  ${u.status === 'missing' ? '✗' : '·'} ${u.file}:${u.line} (no link kept) ${u.status}${u.missing.length ? ` · missing: ${u.missing.slice(0, 8).join(', ')}` : ''}\n      removed: ${u.removed}`));
    return out.join('\n');
  }
  const out = [`FACT_LOCATE: ${r.status} · ${r.pairs.length} pair(s) · judge ${r.judge.engine || 'none'}${r.judge.note ? ` (${r.judge.note})` : ''}`];
  const u = undecidedLine(r, r.pairs); if (u) out.push(u);
  r.pairs.forEach((p) => out.push(`  ${MARK[p.status]} → ${p.target}${p.section ? ` (§ ${p.section})` : ''} · coverage ${p.coverage} (${p.basis})${p.p != null ? ` · ${p.by} ${p.p}` : p.status === 'undecided' ? ' · undecided' : ''}${p.status === 'missing' && p.missing.length ? ` · missing: ${p.missing.slice(0, 8).join(', ')}` : ''}${p.note ? ` · ${p.note}` : ''}\n      removed: ${p.removed}`));
  return out.join('\n');
}

module.exports = { locate, fromBase, render, tokensOf, resolveTarget, canon };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args.find((a, i) => !a.startsWith('--') && !['--removed', '--target', '--pairs', '--base', '--file', '--judge', '--answers'].includes(args[i - 1]));
  const usage = 'Usage: bun fact-locate.js <project-root> (--removed "<text>" --target <path[#anchor]> | --pairs <pairs.json> | --base <git-ref> [--file <path> …]) [--judge agent|typesafe|clef] [--answers <answers.json>] [--json]';
  if (!root) { console.error(usage); process.exit(2); }
  let r;
  try {
    if (opt('--base')) r = await fromBase(root, { base: opt('--base'), files: args.flatMap((a, i) => (a === '--file' ? [args[i + 1]] : [])), engine: opt('--judge'), answers: opt('--answers') ? path.resolve(opt('--answers')) : undefined });
    else {
      const pairs = opt('--pairs') ? JSON.parse(read(path.resolve(opt('--pairs')))) : (opt('--removed') && opt('--target') ? [{ removed: opt('--removed'), target: opt('--target') }] : null);
      if (!pairs) { console.error(usage); process.exit(2); }
      r = await locate(root, pairs, { engine: opt('--judge'), answers: opt('--answers') ? path.resolve(opt('--answers')) : undefined });
    }
  } catch (e) { console.error('fact-locate: ' + e.message); process.exit(2); }
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.status === 'PASS' ? 0 : 1);
})();
