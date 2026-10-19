#!/usr/bin/env bun
// kit-debt.js — each component's technical debt, written into its Component Specification § 7 Constraints (10.10.2).
//
//   bun kit-debt.js <project_root> [--components <slug,slug,…|all>] [--handoffs <dir>] [--dry-run] [--json]
//
// A component's descriptor names the TDRs that weigh on it (`**Technical Debt:** [TDR-NNN](…) · …`, read by the facts
// ledger as the component's `tdrs`). The developer who builds or changes the component needs them: the workaround the code
// keeps, and the one it may drop once the record is Resolved. Through 10.10.1 no part of the kit named them — the line
// reached the generator inside the raw descriptor, no template slot asked for it, and the specification went without.
//
// The table is code's, never the generator's: `### Technical debt <!-- LABEL: Technical Debt -->` at the end of § 7, one
// row per TDR (id linked to its record, title, status), replaced on every run and removed when the descriptor names none.
// It runs for every component of the kit — a kept specification gets its table too —, and handoff-prepare.js leaves the
// line out of the payload, so a release that only records debt sends no part to the model.
'use strict';
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));

const CONSTRAINTS = /^##\s.*<!--\s*SECTION:\s*Constraints\s*-->\s*$/;
const BLOCK = /^#{3,4}\s.*<!--\s*LABEL:\s*Technical Debt\s*-->\s*$/;
const HEADING = { en: 'Technical debt', es: 'Deuda técnica' };
const LEAD = {
  en: 'Recorded on this component. The code keeps each workaround until its record is `Resolved`.',
  es: 'Registrada en este componente. El código mantiene cada atajo hasta que su registro pase a `Resolved`.',
};
const cell = (s) => String(s == null || s === '' ? '—' : s).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();

function block(debt, lang, specFile, root) {
  if (!debt.length) return null;
  const L = HEADING[lang] ? lang : 'en';
  const link = (t) => (t.file ? `[${t.id}](${path.relative(path.dirname(specFile), path.join(root, t.file)).split(path.sep).join('/')})` : t.id);
  return [`### ${HEADING[L]} <!-- LABEL: Technical Debt -->`, '', LEAD[L], '', '| TDR | Title | Status |', '|---|---|---|',
    ...debt.map((t) => `| ${link(t)} | ${cell(t.title)} | ${cell(t.status)} |`)].join('\n');
}

// the § 7 block replaced in place, appended at the end of § 7, or removed — every other line kept
function apply(src, text) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const c = lines.findIndex((l) => CONSTRAINTS.test(l)); if (c < 0) return { out: src, error: 'no § 7 Constraints anchor' };
  let end = lines.findIndex((l, i) => i > c && /^##\s/.test(l)); if (end < 0) end = lines.length;
  let b = lines.findIndex((l, i) => i > c && i < end && BLOCK.test(l));
  if (b >= 0) { let e = lines.findIndex((l, i) => i > b && i < end && (/^#{2,4}\s/.test(l) || /^-{3,}$/.test(l.trim()))); if (e < 0) e = end; lines.splice(b, e - b); end -= e - b; }
  while (end > c + 1 && lines[end - 1].trim() === '') { lines.splice(end - 1, 1); end--; }   // the blank lines before the next section, re-made below
  // a section closed by a `---` rule keeps it last: the table goes inside the section, before the rule
  let rule = false;
  if (end > c + 1 && /^-{3,}$/.test(lines[end - 1].trim())) { lines.splice(end - 1, 1); end--; rule = true; while (end > c + 1 && lines[end - 1].trim() === '') { lines.splice(end - 1, 1); end--; } }
  if (text) { lines.splice(end, 0, '', text); end += 2; }
  if (rule) { lines.splice(end, 0, '', '---'); end += 2; }
  lines.splice(end, 0, '');
  return { out: lines.join('\n') };
}

function run(root, opts = {}) {
  root = path.resolve(root);
  const handoffs = path.resolve(root, opts.handoffs || 'handoffs');
  const facts = collect(root); const lang = (facts.architecture || {}).language || 'en';
  const byId = new Map((facts.tdrs || []).map((t) => [t.id, t]));
  const manifest = JSON.parse(fs.readFileSync(path.join(handoffs, '.manifest.json'), 'utf8'));
  const want = !opts.components || opts.components === 'all' ? null : new Set(opts.components.split(',').map((s) => s.trim()));
  const results = [];
  for (const [slug, e] of Object.entries(manifest.cut_sheets || {})) {
    if (want && !want.has(slug)) continue;
    const file = path.join(handoffs, e.cut_sheet_file); if (!fs.existsSync(file)) { results.push({ slug, file: e.cut_sheet_file, error: 'specification missing' }); continue; }
    const comp = (facts.components || []).find((c) => c.slug === slug) || {};
    const debt = (comp.tdrs || []).map((id) => ({ id, ...(byId.get(id) || {}) }));
    const src = fs.readFileSync(file, 'utf8'); const r = apply(src, block(debt, lang, file, root));
    if (r.error) { results.push({ slug, file: e.cut_sheet_file, error: r.error }); continue; }
    const changed = r.out !== src; if (changed && !opts.dryRun) fs.writeFileSync(file, r.out);
    results.push({ slug, file: e.cut_sheet_file, tdrs: debt.map((t) => t.id), changed });
  }
  return results;
}

module.exports = { run, apply, block };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun kit-debt.js <project_root> [--components <slug,…|all>] [--handoffs <dir>] [--dry-run] [--json]'); process.exit(2); }
  let r; try { r = run(args[0], { components: opt('--components'), handoffs: opt('--handoffs'), dryRun: args.includes('--dry-run') }); } catch (e) { console.error('kit-debt: ' + e.message); process.exit(2); }
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else r.forEach((x) => console.log(x.error ? `kit-debt: ${x.file} — ${x.error}` : `kit-debt: ${x.file} — ${x.tdrs.length ? x.tdrs.join(', ') : 'no debt'}${x.changed ? (args.includes('--dry-run') ? ' (would change)' : ' (written)') : ' (unchanged)'}`));
  process.exit(r.some((x) => x.error) ? 1 : 0);
}
