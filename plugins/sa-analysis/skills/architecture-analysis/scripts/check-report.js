#!/usr/bin/env node
// Checks analysis reports against the findings contract (architecture-analysis SKILL.md § Finding
// IDs) — the format the command center's dossier reads. The analysis skill runs it over every
// report it has just written, and the agent runs it on its own report before returning. It uses
// the same parser the dossier uses (`findings.js`), so a report that passes here is one Alia can
// read: every findings table found, every finding labelled by its subject, every severity resolved.
//
// Usage: bun check-report.js <report.md|report.html> [...more] [--json]
//        bun check-report.js analysis/            # every *.md / *.html in the directory
// Exit 1 when any report carries an error; warnings never fail the run.
'use strict';
const fs = require('fs');
const path = require('path');
const { checkReport } = require(require('../../../scripts/sa-skills.js').fromSaSkills('scripts', 'shared', 'findings.js'));

const args = process.argv.slice(2);
const json = args.includes('--json');
const targets = args.filter(a => !a.startsWith('--'));
if (!targets.length) {
  console.error('Usage: bun check-report.js <report.md|report.html|analysis-dir> [...] [--json]');
  process.exit(2);
}
const files = [];
targets.forEach(t => {
  const p = path.resolve(t);
  if (!fs.existsSync(p)) { console.error(`✗ ${t}: no such file`); process.exitCode = 1; return; }
  if (fs.statSync(p).isDirectory()) fs.readdirSync(p).filter(f => /\.(md|html)$/i.test(f)).sort().forEach(f => files.push(path.join(p, f)));
  else files.push(p);
});

const results = files.map(f => checkReport(f, fs.readFileSync(f, "utf8").replace(/\r\n?/g, "\n")));
const rel = (f) => path.relative(process.cwd(), f).replace(/\\/g, '/') || f;
if (json) {
  console.log(JSON.stringify(results.map(r => Object.assign({}, r, { file: rel(r.file), items: r.items.map(i => ({ id: i.id, label: i.label, severity: i.severity || null })) })), null, 2));
} else {
  results.forEach(r => {
    const name = rel(r.file);
    if (r.skipped) { console.log(`– ${name}: skipped (${r.skipped})`); return; }
    const sev = {}; r.items.forEach(i => { const s = i.severity || 'unresolved'; sev[s] = (sev[s] || 0) + 1; });
    const tally = Object.entries(sev).map(([k, v]) => `${v} ${k}`).join(' · ') || 'no findings';
    console.log(`${r.errors.length ? '✗' : '✓'} ${name}: ${r.items.length} finding(s) — ${tally}` + (r.errors.length ? ` — ${r.errors.length} error(s)` : '') + (r.warnings.length ? `, ${r.warnings.length} warning(s)` : ''));
    r.errors.forEach(e => console.log(`    ✗ ${name}${e.line ? ':' + e.line : ''}: ${e.message}`));
    r.warnings.forEach(w => console.log(`    ⚠ ${name}${w.line ? ':' + w.line : ''}: ${w.message}`));
  });
  const bad = results.filter(r => r.errors.length).length;
  console.log(bad ? `\n${bad} of ${results.length} report(s) violate the findings contract — fix the rows named above; the command center cannot read what the check rejects.` : `\n${results.length} report(s) satisfy the findings contract.`);
}
if (results.some(r => r.errors.length)) process.exitCode = 1;
