#!/usr/bin/env bun
// identifier-check.js — code identifiers in the architecture are English, in every document language.
//
//   bun scripts/shared/identifier-check.js <project_root> [--file <path> …] [--judge agent|typesafe|clef] [--answers]
//       [--strict] [--json]
//
// The handoff assets copy every identifier from the docs verbatim — a path, a field, a schema, an enum value, a topic, a
// table, a key prefix — and contract-check.js fails one the docs do not name. So the language of an asset's identifiers
// is the language the docs wrote them in. Under DOC_LANGUAGE: es the prose is Spanish and the identifiers stay English
// (LANGUAGE_POLICY.md, never localized); this check finds the ones that did not. On 2026-10-01 an operations table in
// docs/05 named 47 identifiers in Spanish under English paths (`idDispositivo` under `/v1/enrollments`), and the
// OpenAPI generated from it had to be regenerated after the table was renamed by hand.
//
// Stage 1 (code): the candidates — every inline code span and every JSON key in a ```json block of docs/**/*.md
// (every CHANGELOG*.md excluded — history, not the contract — and comments skipped) that has the shape of an identifier:
// no space, a letter, not an ADR / TDR / I-nn / UC / F / E id, not a file name or a relative path, not a short all-caps
// code (`AHO`), not a single capitalised word (`Couchbase`), not a component's canonical name, slug or internal name.
// One question per distinct token.
// Stage 2 (scripts/judge.js): one Noul per token — "a code identifier written in Spanish?" — with the line it sits on,
// answered by the session (`agent`, the default: a worksheet, then `--answers`) or by Jev (`typesafe`). There is no
// heuristic and no word list: whether a word is Spanish is the judge's call in every domain the plugin documents, and a
// list in the plugin knows one domain (8.114.1). Jev unavailable (no key) → the agent worksheet, said so.
// Stage 3: p ≥ 0.5 is a finding (WARNING). A token the judge has not answered (a pending worksheet, answers that skip
// it) is undecided — neither a finding nor dismissed, listed under `undecided` and the status is PENDING (8.119.0).
//
// Exit 0 — PASS, WARN or PENDING (the worksheet waits for its answers); under --strict, 1 on a finding or a pending
// worksheet; 2 on a usage error or an engine other than agent / typesafe.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const JUDGE = require(path.join(ROOT, 'scripts', 'judge.js'));
const { collect } = require(path.join(__dirname, 'arch-facts.js'));

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.md$/.test(e.name) ? [path.join(d, e.name)] : [])) : []);

const words = (t) => t.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/).filter((w) => w.length >= 2).map((w) => w.toLowerCase());
const ENGINES = JUDGE.ENGINES;   // every judge judge.js runs (8.120.3 — clef was refused here and the gate fell back to a hand-answered worksheet)

const ID_LIKE = /^(ADR|TDR|I|UC|F|E|B|C|K|T|S|D|BC|CLD|DAI|DEV|ENT|INT|PLT|PRC|SEC|SRE|LASRE|LAI|LAS)-?\d/i;
function isCandidate(tok, names) {
  if (tok.length < 3 || /\s/.test(tok) || !/[A-Za-z]/.test(tok)) return false;
  if (ID_LIKE.test(tok) || /^\d/.test(tok)) return false;
  if (/\.(md|ya?ml|json|sql|proto|graphql|avsc|js|ts|txt|png|svg|pdf|docx)$/i.test(tok) || /(^|\/)\.\.?\//.test(tok)) return false;
  if (/^[A-Z0-9_]{1,6}$/.test(tok)) return false;                  // a short code: AHO, CTE, HSM, P99
  if (/^[A-Z][a-záéíóúñü]+$/.test(tok)) return false;              // one capitalised word: a technology or a proper noun
  if (names.has(tok.toLowerCase())) return false;
  return true;
}

/** Stage 1: the candidates of each file — { token, file, line, text } per occurrence. */
function candidates(root, files) {
  const facts = collect(root); const names = new Set();
  (facts.components || []).forEach((c) => [c.name, c.slug, c.internal_name].filter(Boolean).forEach((n) => names.add(String(n).toLowerCase())));
  const out = [];
  files.forEach((f) => { const ls = read(f).split('\n'); let fence = null, comment = false;
    ls.forEach((l, i) => {
      const fm = l.match(/^```\s*(\w*)/); if (fm) { fence = fence === null ? fm[1].toLowerCase() : null; return; }
      if (fence !== null) { if (fence === 'json') for (const m of l.matchAll(/"([^"\s]+)"\s*:/g)) if (isCandidate(m[1], names)) out.push({ token: m[1], file: f, line: i + 1, text: l.trim() }); return; }
      if (comment) { if (/-->/.test(l)) comment = false; return; } if (/<!--(?![\s\S]*-->)/.test(l)) { comment = true; return; }
      const vis = l.replace(/<!--.*?-->/g, '');
      for (const m of vis.matchAll(/`([^`\n]+)`/g)) { let tok = m[1].trim().replace(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/, ''); tok = tok.replace(/^https?:\/\/[^/]+/, '');
        if (isCandidate(tok, names)) out.push({ token: tok, file: f, line: i + 1, text: vis.trim() }); }
    }); });
  return out;
}

async function check(root, opts = {}) {
  root = path.resolve(root);
  const files = (opts.files && opts.files.length ? opts.files.map((f) => path.resolve(root, f)) : walk(path.join(root, 'docs'))).filter((f) => fs.existsSync(f) && !/CHANGELOG[^/]*\.md$/.test(f));
  const occ = candidates(root, files);
  const byToken = new Map(); occ.forEach((o) => { if (!byToken.has(o.token)) byToken.set(o.token, []); byToken.get(o.token).push(o); });
  const tokens = [...byToken.keys()];
  let engine = opts.engine || JUDGE.engineInForce();
  if (!ENGINES.includes(engine)) { const e = new Error(`identifier-check runs on a judge (${ENGINES.join(', ')}), not \`${engine}\` — pass --judge ${ENGINES.join('|')}`); e.code = 'ENGINE'; throw e; }
  const spec = { id: 'identifier-language', type: 'noul',
    question: 'Is `item.token` a code identifier — a name a developer types in code: an API path or path segment, a field, a schema or message name, an enum value, a topic, a table, a column or a key — written in Spanish? `item.line` is where it appears.',
    criteria: { true: 'A Spanish code identifier: `idDispositivo`, `/v1/clientes/{idCliente}`, `ultimaReplica`, `recibo`, `motivo`, `habilitado` as a status value.', false: 'An English identifier (`deviceId`, `lastReplicationAt`), a proper noun or product name, a data value the architecture defines as data (a product code, a channel naming pattern a document prescribes), a component name, or not an identifier at all.' } };
  const items = tokens.map((t, i) => ({ id: `id-${i}`, state: { token: t, line: byToken.get(t)[0].text.slice(0, 240) } }));
  let res = { engine, answers: {} }, note = null;
  if (items.length) {
    const run = (eng) => JUDGE.judge(spec, items, { engine: eng, root, answers: eng === 'agent' && opts.answers ? true : undefined, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache });
    try { res = await run(engine); }
    catch (e) { if (e.name !== 'JudgeError') throw e;
      if (engine === 'agent') throw e;
      note = `${engine} unavailable (${e.message}) — the agent worksheet stands in`; engine = 'agent'; res = await run('agent'); }
    if (res.pending) note = `${note ? note + '; ' : ''}agent worksheet at ${path.relative(root, res.pending)} — answer it into ${path.relative(root, res.answersFile)} and re-run with --answers`;
  }
  const findings = [], dismissed = [], undecided = [];
  tokens.forEach((t, i) => { const a = res.answers[`id-${i}`]; if (!a) { undecided.push(t); return; } const p = JUDGE.value(a); const o = byToken.get(t);
    if (p >= 0.5) findings.push({ rule: 'identifier-language', severity: 'WARNING', token: t, p: +p.toFixed(2), by: a.by, occurrences: o.map((x) => ({ file: path.relative(root, x.file), line: x.line })) });
    else dismissed.push(t); });
  if (undecided.length && !res.pending) note = `${note ? note + '; ' : ''}${undecided.length} token(s) unanswered — answer them in ${path.relative(root, res.answersFile || JUDGE.answersPath(spec, { root }))} and re-run with --answers`;
  const status = res.pending || undecided.length ? 'PENDING' : findings.length ? 'WARN' : 'PASS';
  return { status, engine: res.engine || engine, files: files.length, candidates: tokens.length, findings, judged: tokens.length - undecided.length, dismissed: dismissed.length, undecided, note };
}

function render(r) {
  const out = [`IDENTIFIER_CHECK: ${r.status} — ${r.files} file(s), ${r.candidates} candidate identifier(s)${r.status === 'PENDING' ? `, ${r.undecided.length} undecided — waiting for the judge${r.findings.length ? `; ${r.findings.length} in Spanish so far` : ''}` : `, ${r.findings.length} in Spanish (judge: ${r.engine})`}`];
  r.findings.forEach((f) => out.push(`  ⚠ identifier-language \`${f.token}\` [${f.by} ${f.p}] — ${f.occurrences.slice(0, 4).map((o) => `${o.file}:${o.line}`).join(', ')}${f.occurrences.length > 4 ? ` +${f.occurrences.length - 4}` : ''}`));
  if (r.findings.length) out.push('  → write the identifier in English in the docs (prose stays in the document language); the handoff assets copy it verbatim');
  if (r.note) out.push(`  note: ${r.note}`);
  return out.join('\n');
}

module.exports = { check, candidates, isCandidate, render, ENGINES };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2); const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
    const files = args.flatMap((a, i) => (args[i - 1] === '--file' ? [a] : []));
    const root = args.find((a, i) => !a.startsWith('--') && !['--file', '--judge'].includes(args[i - 1]));
    if (!root) { console.error('Usage: bun identifier-check.js <project_root> [--file <path> …] [--judge agent|typesafe|clef] [--answers] [--strict] [--json]'); process.exit(2); }
    let r; try { r = await check(root, { files, engine: opt('--judge'), answers: args.includes('--answers') }); } catch (e) { if (e.code === 'ENGINE') { console.error(e.message); process.exit(2); } throw e; }
    console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    if (args.includes('--strict')) process.exit(r.findings.length || r.status === 'PENDING' ? 1 : 0);
  })().catch((e) => { console.error('identifier-check: ' + (e.stack || e.message)); process.exit(2); });
}
