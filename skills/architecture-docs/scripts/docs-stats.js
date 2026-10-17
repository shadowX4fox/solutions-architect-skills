#!/usr/bin/env node
// Size-budget report for a generated architecture corpus.
//
//   bun docs-stats.js <project-root> [--file <path>] [--json] [--strict] [--enforce]
//
// Reads ARCHITECTURE.md, docs/*.md, docs/components/**/*.md and docs/CHANGELOG.md and reports,
// per file, bytes against a soft budget, plus the shape findings that inflate a corpus: principle
// blocks over their bullet budget, per-phase sequence diagrams, long table cells in the risks
// file, integration blocks over their budget, an ADR index duplicated into the references file,
// oversized component descriptors, project ADRs (101+) and TDRs over their per-section budgets,
// oversized changelog entries and a component described in prose outside its own file.
//
// Two severities. The **shape budgets** — a principle over its budget, a risk-register cell over its
// column's budget, an I-nn integration block over its budget, a component descriptor over the dossier's
// page cut, an ADR or TDR section over its budget or a log entry over one line — carry a fix ("move it to the
// ADR / the linked document it cites", as P-BUDGET-01 does for the principles) and are BLOCKING when enforcing: `--enforce`, or ARCHITECTURE.md carries
// `<!-- PROSE_STYLE: v1 -->`. Everything else is WARNING in every mode: the section-file byte budgets,
// the changelog budgets, describe-once, the flow and references shapes. A record finding is fixed by its owning
// skill (architecture-definition-record writes adr/, technical-debt-records writes tdr/). There is still no file-length cap on a
// section file and there must never be one — a byte budget on docs/NN says where the bytes went, it
// never blocks. Without enforcing, every finding is reported and nothing blocks.
//
// `--strict` turns any finding into exit code 1 for a CI gate the project opts into. `--file` restricts
// the file rows to one path (the shape findings that concern that file still run).
//
// Zero dependencies. Runs under Bun (the plugin's runtime); plain Node also works.
'use strict';
const fs = require('fs');
const path = require('path');
const { integrationHead } = require(path.join(__dirname, 'integration-head.js'));
// the record budgets (project ADRs and TDRs) live in the layer shared across skills — the ADR and TDR skills read them too
const { ADR_BODY_WORDS, ADR_SECTION_WORDS, TDR_BODY_WORDS, TDR_SECTION_WORDS, LOG_ENTRY_WORDS, recordFindings, recordSections } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'record-budgets.js'));

const KB = 1024;
// Soft budgets in bytes, by file. A component descriptor stays under the 12 KB page cut the
// command center's dossier applies when it hands a page to the brain.
const BUDGETS = [
  [/^ARCHITECTURE\.md$/, 8 * KB],
  [/^docs\/01-/, 20 * KB], [/^docs\/02-/, 24 * KB], [/^docs\/03-/, 40 * KB], [/^docs\/04-/, 40 * KB],
  [/^docs\/05-/, 30 * KB], [/^docs\/06-/, 12 * KB], [/^docs\/07-/, 30 * KB], [/^docs\/08-/, 24 * KB],
  [/^docs\/09-/, 30 * KB], [/^docs\/10-/, 12 * KB], [/^docs\/11-/, 12 * KB],
  [/^docs\/components\/.+\.md$/, 10 * KB],
];
const CHANGELOG_ENTRY_BUDGET = 6 * KB;
const PRINCIPLE = { descriptionSentences: 1, descriptionWords: 25, implementationBullets: 5, bulletWords: 25, tradeoffBullets: 3 };
// Risk register: a cell names, a linked ADR / TDR argues. Budget per column, keyed by the header in
// either language; a column not listed gets RISK_CELL_WORDS. Reference corpus (106 risk rows): the Risk
// cell ran median 60 / p90 120 words and Mitigation median 44 / p90 87 — the arguments the budget moves out.
const RISK_CELL_WORDS = 40;
const RISK_COLUMN_WORDS = {
  risk: 30, riesgo: 30, description: 30, descripción: 30, descripcion: 30, title: 15, título: 15, titulo: 15,
  mitigation: 40, mitigación: 40, mitigacion: 40, 'current mitigation': 40, 'mitigación actual': 40,
  likelihood: 3, probabilidad: 3, impact: 3, impacto: 3, severity: 3, severidad: 3, status: 3, estado: 3, id: 3,
  owner: 12, responsable: 12, dueño: 12,
};
// Integration points: the words belonging to one I-nn — its inventory row(s) plus the detail block led by
// `**I-nn …**` or a heading naming it. Reference corpus (30 I-nn): median 110, p75 313, p90 477 words;
// 150 is a row, one paragraph and the ADR link.
const INTEGRATION_BLOCK_WORDS = 150;
// Component descriptor: the dossier cuts a page at 12 KB when it hands it to the command center's brain,
// so a descriptor past it is served truncated. Measured without the EXPLORER_HEADER comment (metadata, not
// description). Reference corpus: 9 of 35 descriptors over it (largest 26 KB).
const DESCRIPTOR_CAP = 12 * KB;
const DESCRIBE_ONCE_PARAGRAPHS = 3;   // descriptive paragraphs about one component outside its file

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const exists = (p) => fs.existsSync(p);
const words = (s) => s.trim() ? s.trim().split(/\s+/).length : 0;
const sentences = (s) => (s.replace(/[`*_\[\]()]/g, '').match(/[^.!?]+[.!?]+(\s|$)/g) || []).length || (s.trim() ? 1 : 0);
const rel = (root, p) => path.relative(root, p).split(path.sep).join('/');

function walk(dir, out = []) {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const budgetFor = (r) => { for (const [rx, b] of BUDGETS) if (rx.test(r)) return b; return null; };
// A prose paragraph: not a table row, heading, comment, quote, fence, list item or label line
const isParagraph = (l) => l.trim() && !/^(\||#|<|>|```|[-*] |\d+[.)] |\*\*[^*]+\*\*:?\s*(<!--)?\s*$)/.test(l.trim());

// ---- principle blocks: one per `### N.` heading; labels resolved by anchor first, then by word
function principleFindings(text, file) {
  const out = [];
  const blocks = text.split(/^(?=### \d+\.)/m).filter(b => /^### \d+\./.test(b));
  const label = (b, anchor, wordsRx) => {
    const lines = b.split('\n');
    let i = lines.findIndex(l => l.includes('LABEL: ' + anchor) || (!/LABEL:/.test(l) && wordsRx.test(l)));
    if (i < 0) return null;
    const body = [];
    for (i = i + 1; i < lines.length; i++) { if (/^\*\*[^*]+\*\*:?/.test(lines[i]) || /^### /.test(lines[i])) break; body.push(lines[i]); }
    return body;
  };
  blocks.forEach(b => {
    const name = (b.match(/^### (\d+)\.\s*([^<\n]+)/) || [])[2] || '?';
    const n = (b.match(/^### (\d+)\./) || [])[1];
    const d = label(b, 'Description', /^\*\*(Description|Descripción)\*\*:?/);
    const im = label(b, 'Implementation', /^\*\*(Implementation|Implementación)\*\*:?/);
    const t = label(b, 'Trade-offs', /^\*\*(Trade-offs|Compromisos|Contrapartidas)\*\*:?/);
    if (d) { const s = d.join(' ').trim(); const sc = sentences(s), wc = words(s);
      if (sc > PRINCIPLE.descriptionSentences || wc > PRINCIPLE.descriptionWords) out.push({ file, rule: 'principle-description', shape: true, where: `principle ${n}`, detail: `${sc} sentence(s), ${wc} words — budget: one sentence, ≤ ${PRINCIPLE.descriptionWords} words, stating the decision rule` }); }
    const bullets = (body) => (body || []).filter(l => /^\s*[-*] /.test(l));
    const ib = bullets(im), tb = bullets(t);
    if (ib.length > PRINCIPLE.implementationBullets) out.push({ file, rule: 'principle-implementation', shape: true, where: `principle ${n}`, detail: `${ib.length} bullets — budget ≤ ${PRINCIPLE.implementationBullets}, one fact each, the ADR cited` });
    const long = ib.concat(tb).filter(l => words(l.replace(/^\s*[-*] /, '')) > PRINCIPLE.bulletWords).length;
    if (long) out.push({ file, rule: 'principle-bullet-length', shape: true, where: `principle ${n}`, detail: `${long} bullet(s) over ${PRINCIPLE.bulletWords} words — split, or move the detail to the ADR it cites` });
    if (tb.length > PRINCIPLE.tradeoffBullets) out.push({ file, rule: 'principle-tradeoffs', shape: true, where: `principle ${n}`, detail: `${tb.length} bullets — budget ≤ ${PRINCIPLE.tradeoffBullets}` });
    void name;
  });
  return out;
}

// ---- data flow (8.30.0, inverts 8.2.0): the phase panels are the source and are expected; a sequence under
// § End-to-End Wire Sequences that flow-compose.js did not derive is the shape that inflates — drawn by hand, it
// restates the panels and drifts from them. The DERIVED marker is the composer's signature.
function flowFindings(text, file) {
  const cut = text.search(/SECTION: End-to-End Wire Sequences|^##+ End-to-End Wire Sequences/m);
  const before = cut >= 0 ? text.slice(0, cut) : text, after = cut >= 0 ? text.slice(cut) : '';
  const phaseDiagrams = (before.match(/```mermaid/g) || []).length, ucDiagrams = (after.match(/```mermaid/g) || []).length;
  const out = [];
  if (cut >= 0 && ucDiagrams && !/<!--\s*DERIVED:\s*flow-compose\.js/.test(after)) out.push({ file, rule: 'hand-drawn-e2e', where: 'End-to-End Wire Sequences', detail: `${ucDiagrams} end-to-end sequence(s) not derived by flow-compose.js (${Math.round(after.length / KB)} KB) — run it: the section is the derivation of the Phase Catalog, and a hand-drawn one drifts from the panels` });
  if (cut >= 0 && !phaseDiagrams) out.push({ file, rule: 'phases-undrawn', where: 'Phase Catalog', detail: 'no phase carries a sequenceDiagram — the panels are the source every end-to-end sequence derives from (flow-check names each phase)' });
  return { findings: out, counts: { phaseDiagrams, ucDiagrams } };
}

// ---- tables: a cell that argues instead of naming — budget per column, header by header
const cellsOf = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
const cellWords = (c) => words(c.replace(/<!--[\s\S]*?-->/g, '').replace(/\]\([^)]*\)/g, ']').replace(/[*`]/g, ''));
function riskFindings(text, file) {
  const out = [];
  let header = null;
  text.split('\n').forEach((l, i) => {
    if (!l.trim().startsWith('|')) { header = null; return; }
    const cells = cellsOf(l);
    if (cells.every(c => /^:?-+:?$/.test(c))) return;
    if (!header) { header = cells; return; }
    const over = [];
    cells.forEach((c, k) => {
      const col = (header[k] || '').replace(/[*`]/g, '').trim();
      const budget = RISK_COLUMN_WORDS[col.toLowerCase()] ?? RISK_CELL_WORDS;
      const n = cellWords(c);
      if (n > budget) over.push(`${col || `column ${k + 1}`} ${n} words (≤ ${budget})`);
    });
    if (over.length) out.push({ file, rule: 'risk-cell-length', shape: true, line: i + 1, where: `line ${i + 1} · ${cells[0].replace(/[*`]/g, '').slice(0, 50)}`, detail: `${over.join(', ')} — a row names the risk; move the argument to the ADR or TDR it cites and link it` });
  });
  return out;
}

// ---- integration points: one block per I-nn — its inventory row(s) and the detail block it leads
// the head is integration-head.js's reading; a compound head (`**I-19 e I-20 — …**`) is one block under a joined key
function integrationFindings(text, file) {
  const blocks = {}; let cur = null;
  text.split('\n').forEach(l => {
    const head = integrationHead(l), heading = l.match(/^\s*#{2,6}\s+(I-\d+)\b/);
    if (head || heading) { cur = head ? head.ids.join(' + ') : heading[1]; (blocks[cur] ||= []).push(l.replace(/^\s*#+\s*/, '')); return; }
    if (/^#{1,6}\s/.test(l)) { cur = null; return; }
    const row = l.match(/^\|\s*(I-\d+)\s*\|/);
    if (row) { (blocks[row[1]] ||= []).push(l); return; }
    if (cur) blocks[cur].push(l);
  });
  return Object.entries(blocks).map(([id, ls]) => [id, cellWords(ls.join(' ').replace(/\|/g, ' '))])
    .filter(([, n]) => n > INTEGRATION_BLOCK_WORDS)
    .map(([id, n]) => ({ file, rule: 'integration-block-length', shape: true, where: id, detail: `${n} words (≤ ${INTEGRATION_BLOCK_WORDS}) — the row and one paragraph; move the rationale to the ADR the block cites and link it` }));
}

// ---- component descriptors: the dossier's 12 KB page cut, the EXPLORER_HEADER not counted
function descriptorFindings(text, file) {
  const bytes = Buffer.byteLength(text.replace(/<!--\s*EXPLORER_HEADER[\s\S]*?-->/g, ''), 'utf8');
  return bytes > DESCRIPTOR_CAP ? [{ file, rule: 'descriptor-size', shape: true, where: '', detail: `${(bytes / KB).toFixed(1)} KB without the header (cap ${DESCRIPTOR_CAP / KB} KB, the dossier's page cut) — keep what the container is and owns; move flow, integration and decision detail to docs/04, docs/05 and the ADRs, and link them` }] : [];
}
// ---- records: project ADRs (101+) and TDRs — the budgets and the per-record check are scripts/shared/record-budgets.js
function recordsFindings(root) {
  const out = [];
  const adr = path.join(root, 'adr');
  if (exists(adr)) fs.readdirSync(adr).filter(n => /^ADR-\d{3,}.*\.md$/.test(n) && Number(n.match(/^ADR-(\d+)/)[1]) > 100).sort()
    .forEach(n => out.push(...recordFindings(read(path.join(adr, n)), `adr/${n}`, 'adr')));
  const tdr = path.join(root, 'tdr');
  if (exists(tdr)) fs.readdirSync(tdr).filter(n => /^TDR-\d+.*\.md$/.test(n)).sort()
    .forEach(n => out.push(...recordFindings(read(path.join(tdr, n)), `tdr/${n}`, 'tdr')));
  return out;
}
function referencesFindings(text, file) {
  const adrRows = text.split('\n').filter(l => l.startsWith('|') && /\bADR-\d{3}\b/.test(l)).length;
  return adrRows ? [{ file, rule: 'adr-index-duplicated', where: 'ADR tables', detail: `${adrRows} ADR row(s) — adr/README.md is the derived ADR index; link it instead of restating it` }] : [];
}
function changelogFindings(text, file) {
  const entries = text.split(/^(?=## \[)/m).filter(e => /^## \[/.test(e));
  return entries.filter(e => e.length > CHANGELOG_ENTRY_BUDGET).map(e => ({ file, rule: /^## \[unreleased\]/i.test(e) ? 'changelog-unreleased' : 'changelog-entry', where: e.split('\n')[0].trim(), detail: /^## \[unreleased\]/i.test(e) ? `${Math.round(e.length / KB)} KB — a release is waiting: cut it (release my architecture) so the block drains into a versioned entry, and keep each item one line` : `${Math.round(e.length / KB)} KB — an entry lists fact deltas one line each; the architecture's content lives in the sections and the ADRs` }));
}

// ---- describe once: a component is described in its own file; elsewhere it is named and linked
function describeOnceFindings(root, sectionFiles, componentNames) {
  const out = [];
  const counts = {};
  sectionFiles.forEach(f => {
    const t = read(f);
    t.split('\n').forEach(l => {
      if (!isParagraph(l) || sentences(l) < 2) return;
      componentNames.forEach(n => { if (l.includes(n)) counts[n] = (counts[n] || 0) + 1; });
    });
  });
  Object.entries(counts).filter(([, c]) => c >= DESCRIBE_ONCE_PARAGRAPHS).sort((a, b) => b[1] - a[1]).forEach(([n, c]) => out.push({ file: 'docs/*.md', rule: 'describe-once', where: n, detail: `${c} multi-sentence paragraph(s) about this component outside its file — describe it once in docs/components/, name and link it elsewhere` }));
  return out;
}

function report(root, opts = {}) {
  const only = opts.file ? path.resolve(root, opts.file) : null;
  const files = [];
  const arch = path.join(root, 'ARCHITECTURE.md'); if (exists(arch)) files.push(arch);
  const docsDir = path.join(root, 'docs');
  const sectionFiles = exists(docsDir) ? fs.readdirSync(docsDir).filter(n => /^\d\d-.*\.md$/.test(n)).sort().map(n => path.join(docsDir, n)) : [];
  files.push(...sectionFiles);
  const componentFiles = walk(path.join(docsDir, 'components')).filter(p => path.basename(p) !== 'README.md');
  files.push(...componentFiles);
  const rows = [], findings = [];
  files.forEach(p => {
    const r = rel(root, p), bytes = fs.statSync(p).size, budget = budgetFor(r);
    if (!only || path.resolve(p) === only) rows.push({ file: r, bytes, budget, over: budget != null && bytes > budget });
  });
  sectionFiles.forEach(p => {
    const r = rel(root, p), t = read(p);
    if (/^docs\/02-/.test(r)) findings.push(...principleFindings(t, r));
    if (/^docs\/04-/.test(r)) findings.push(...flowFindings(t, r).findings);
    if (/^docs\/05-/.test(r)) findings.push(...integrationFindings(t, r));
    if (/^docs\/10-/.test(r)) findings.push(...riskFindings(t, r));
    if (/^docs\/11-/.test(r)) findings.push(...referencesFindings(t, r));
  });
  const changelog = path.join(docsDir, 'CHANGELOG.md');
  if (exists(changelog)) findings.push(...changelogFindings(read(changelog), 'docs/CHANGELOG.md'));
  componentFiles.forEach(p => findings.push(...descriptorFindings(read(p), rel(root, p))));
  findings.push(...recordsFindings(root));
  const names = componentFiles.map(p => (read(p).match(/^# (.+)$/m) || [])[1]).filter(Boolean).map(s => s.trim());
  findings.push(...describeOnceFindings(root, sectionFiles, names));
  rows.filter(x => x.over).forEach(x => findings.push({ file: x.file, rule: 'file-budget', where: '', detail: `${Math.round(x.bytes / KB)} KB over a ${Math.round(x.budget / KB)} KB budget` }));
  const total = rows.reduce((s, x) => s + x.bytes, 0);
  // Enforcing: the flag, or the prose contract stamped. A shape finding blocks then; nothing else ever does.
  const enforcing = !!opts.enforce || (exists(arch) && /<!--\s*PROSE_STYLE:\s*v1\s*-->/.test(read(arch)));
  findings.forEach(f => { f.severity = f.shape && enforcing ? 'BLOCKING' : 'WARNING'; delete f.shape; });
  const kept = only ? findings.filter(f => f.file === rel(root, only) || f.file === 'docs/*.md') : findings;
  return { root, mode: enforcing ? 'enforcing' : 'report-only', rows, findings: kept, blocking: kept.filter(f => f.severity === 'BLOCKING').length, total };
}

function render(rep) {
  const kb = (b) => (b / KB).toFixed(1);
  const lines = ['| File | KB | Budget | |', '|---|---:|---:|---|'];
  rep.rows.forEach(x => lines.push(`| ${x.file} | ${kb(x.bytes)} | ${x.budget != null ? kb(x.budget) : '—'} | ${x.over ? '⚠️ over' : ''} |`));
  lines.push(`| **total** | **${kb(rep.total)}** | | ≈ ${Math.round(rep.total / 3.6 / 1000)}K tokens |`);
  lines.push('');
  if (!rep.findings.length) lines.push('No budget findings.');
  else {
    const b = rep.findings.filter(f => f.severity === 'BLOCKING').length;
    lines.push(`${rep.findings.length} budget finding(s) · mode ${rep.mode || 'report-only'} · ${b} BLOCKING · ${rep.findings.length - b} WARNING${b ? '' : ' — nothing blocks'}:`);
    rep.findings.forEach(f => lines.push(`- ${f.severity === 'BLOCKING' ? '✗ BLOCKING' : '⚠ WARNING'} \`${f.file}\`${f.where ? ' · ' + f.where : ''} — **${f.rule}**: ${f.detail}`));
  }
  return lines.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const root = args.find(a => !a.startsWith('--'));
  if (!root) { console.error('Usage: bun docs-stats.js <project-root> [--file <path>] [--json] [--strict] [--enforce]'); process.exit(2); }
  const fileIdx = args.indexOf('--file');
  const rep = report(path.resolve(root), { file: fileIdx >= 0 ? args[fileIdx + 1] : null, enforce: args.includes('--enforce') });
  console.log(args.includes('--json') ? JSON.stringify(rep, null, 2) : render(rep));
  process.exit((args.includes('--strict') && rep.findings.length) || rep.blocking ? 1 : 0);
}

module.exports = { report, render, BUDGETS, PRINCIPLE, CHANGELOG_ENTRY_BUDGET, RISK_CELL_WORDS, RISK_COLUMN_WORDS, INTEGRATION_BLOCK_WORDS, DESCRIPTOR_CAP, ADR_BODY_WORDS, ADR_SECTION_WORDS, TDR_BODY_WORDS, TDR_SECTION_WORDS, LOG_ENTRY_WORDS, recordFindings, recordSections };
