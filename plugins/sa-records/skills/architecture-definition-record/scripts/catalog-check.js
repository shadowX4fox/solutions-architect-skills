#!/usr/bin/env node
// catalog-check.js — the institutional catalog's size gate, from the side that publishes it.
//
//   bun catalog-check.js <catalog_root> [-v] [--json]
//
// A repository is the institutional catalog when it carries `.sa-skills/adr-catalog.json` (`role:
// "institutional-catalog"`; workflows/catalog-mode.md). There every ADR is measured — not only 101+ as in a
// consuming project — with the budgets and the reader of scripts/shared/record-budgets.js, on the normative
// edition; the other editions are reported, never failed, because a translation runs longer word for word.
//
// The marker's `size` block carries what the budgets alone cannot:
//   pending     ADRs over budget when the rule was adopted, reported until compacted (Workflow 10). One back
//               within budget fails until it leaves the list, so the list never goes stale.
//   exceptions  { "ADR-NNN": { "ceilings": { "<section key>|body": words }, "reason": "…" } } — a compacted
//               section still over budget because what remains is normative. The ceiling is gated like a budget;
//               an exception no longer needed fails until it is removed.
//
// Exit 1 on a gated ADR over budget, a stale pending entry or a stale exception; 2 on a missing or invalid marker.
'use strict';
const fs = require('fs');
const path = require('path');
const { ADR_SECTION_WORDS, ADR_BODY_WORDS, LOG_ENTRY_WORDS, recordSections } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'record-budgets.js'));

const MARKER = path.join('.sa-skills', 'adr-catalog.json');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');

// the marker, validated; null when the repository is not a catalog
function readCatalog(root) {
  const p = path.join(root, MARKER);
  if (!fs.existsSync(p)) return null;
  const m = JSON.parse(read(p));
  const errors = [];
  if (m.role !== 'institutional-catalog') errors.push(`role must be "institutional-catalog", got ${JSON.stringify(m.role)}`);
  if (!Array.isArray(m.editions) || !m.editions.length) errors.push('editions must list at least one edition');
  else if (m.editions.filter((e) => e.normative).length !== 1) errors.push('exactly one edition is normative');
  for (const e of m.editions || []) if (!e.lang || typeof e.dir !== 'string') errors.push(`edition ${JSON.stringify(e)} needs lang and dir`);
  if (errors.length) { const err = new Error(`${MARKER}: ${errors.join('; ')}`); err.code = 'MARKER'; throw err; }
  m.size = { pending: [], exceptions: {}, ...(m.size || {}) };
  return m;
}

// an edition's ADR files, institutional range only
const adrFiles = (root, dir) => {
  const d = path.join(root, dir);
  return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => /^ADR-(\d{3,})-.*\.md$/.test(n) && Number(n.match(/^ADR-(\d+)/)[1]) <= 100).sort().map((n) => path.join(d, n)) : [];
};

// one ADR against the budgets, or against its ceilings where an exception names them
function measure(text, ceilings = {}) {
  const secs = recordSections(text);
  const out = [];
  for (const x of secs) {
    const limit = ceilings[x.key] ?? ADR_SECTION_WORDS[x.key];
    if (limit && x.words > limit) out.push({ where: x.name.replace(/^\d+(\.\d+)*\.?\s+/, ''), line: x.line, words: x.words, limit, ceiling: x.key in ceilings });
  }
  const body = secs.filter((x) => x.key !== 'log' && x.key !== 'notes').reduce((n, x) => n + x.words, 0);
  const limit = ceilings.body ?? ADR_BODY_WORDS;
  if (body > limit) out.push({ where: 'body', words: body, limit, ceiling: 'body' in ceilings });
  const log = secs.find((x) => x.key === 'log');
  const long = log ? log.entries.filter((e) => e.words > LOG_ENTRY_WORDS + 8) : [];
  if (long.length) out.push({ where: 'Review History', line: long[0].line, rows: long.length, limit: LOG_ENTRY_WORDS });
  return { body, findings: out };
}
const say = (f) => f.rows
  ? `${f.where}: ${f.rows} row(s) over one line (≤ ${f.limit} words)`
  : `${f.where}: ${f.words} words (≤ ${f.limit}${f.ceiling ? ' ceiling' : ''}${f.where === 'body' ? ', Review History and Notes excluded' : ''})`;

function check(root) {
  const cat = readCatalog(root);
  if (!cat) { const err = new Error(`no ${MARKER} — not an institutional catalog (a consuming project keeps its copy under adr/)`); err.code = 'MARKER'; throw err; }
  const normative = cat.editions.find((e) => e.normative);
  const { pending, exceptions } = cat.size;
  const fail = [], pendingOver = [], excepted = [];
  let ok = 0;
  for (const file of adrFiles(root, normative.dir)) {
    const adr = path.basename(file).slice(0, 7);
    const text = read(file);
    let { body, findings } = measure(text);
    if (exceptions[adr] && !pending.includes(adr)) {
      if (!findings.length) { fail.push(`${adr}: within budget but still in exceptions — remove it from the list`); continue; }
      ({ body, findings } = measure(text, exceptions[adr].ceilings || {}));
      if (findings.length) fail.push(...findings.map((f) => `${adr}: ${say(f)}`)); else excepted.push(adr);
      continue;
    }
    if (pending.includes(adr)) {
      if (findings.length) pendingOver.push({ adr, body, findings: findings.map(say) });
      else fail.push(`${adr}: within budget but still in pending — remove it from the list`);
    } else if (findings.length) fail.push(...findings.map((f) => `${adr}: ${say(f)}`));
    else ok++;
  }
  const reported = cat.editions.filter((e) => !e.normative).map((e) => ({
    lang: e.lang, dir: e.dir, over: adrFiles(root, e.dir).filter((f) => measure(read(f)).findings.length).length,
  }));
  return { fail, pendingOver, excepted, ok, reported, exceptions };
}

module.exports = { readCatalog, measure, check, say, MARKER };

if (require.main === module) {
  const args = process.argv.slice(2);
  const root = args.find((a) => !a.startsWith('-'));
  if (!root) { console.error('Usage: bun catalog-check.js <catalog_root> [-v] [--json]'); process.exit(2); }
  let r;
  try { r = check(path.resolve(root)); } catch (e) { console.error(`catalog-check: ${e.message}`); process.exit(2); }
  if (args.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(r.fail.length ? 1 : 0); }
  r.fail.forEach((l) => console.log(l));
  if (args.includes('-v')) {
    r.pendingOver.forEach((p) => console.log(`pending ${p.adr} (${p.body} words): ${p.findings.join('; ')}`));
    r.excepted.forEach((a) => console.log(`exception ${a}: ${r.exceptions[a].reason}`));
  }
  const rep = r.reported.map((e) => `${e.dir}/: ${e.over} over the normative budget (report only)`).join('; ');
  console.log(`${r.ok} ADR(s) gated and within budget; ${r.excepted.length} at an exception ceiling; ${r.pendingOver.length} pending Workflow 10 (report only)${rep ? `; ${rep}` : ''}`);
  process.exit(r.fail.length ? 1 : 0);
}
