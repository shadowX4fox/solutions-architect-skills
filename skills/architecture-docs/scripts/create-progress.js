#!/usr/bin/env node
// create-progress.js — where a Workflow 1 create stands, and where it stops to free the context.
//
//   bun create-progress.js <project-root> [--json]          status: what is done, what is next, what to read
//   bun create-progress.js <project-root> --done <item>     mark an item done once its gates passed
//   bun create-progress.js <project-root> --reset           forget the progress (a create that starts over)
//
// A create written in one session carries every document it wrote in its context until the end: the
// 8.29.0 control run went from 50K tokens on its first call to 479K on its last, 243K on average, and
// every call re-sent all of it. Nothing after a section is written needs its text in context — the next
// payload reads it from disk as an outline — so the run is cut into five segments and stops between
// them. The user clears the session and says "continue the architecture"; the resume reads this file,
// `collect.json` and the ADR Context Block from disk and goes on at the next item.
//
// Items are the steps whose output is on disk: the collection, each section file in the dependency order
// of `workflow1/05-sections.md`, the index, and the closing steps. `--done` refuses an item whose file does
// not exist. Progress lives in `.cache/sa-skills/create-progress.json`.
'use strict';
const fs = require('fs');
const path = require('path');

const ITEMS = {
  collect: { label: 'Collection (Steps 0.1–4.9)', file: '.cache/sa-skills/collect.json', read: 'workflow1/01-type-selection.md' },
  s1: { label: 'Sections 1+2', file: 'docs/01-system-overview.md', read: 'workflow1/05-sections.md' },
  s13: { label: 'Section 13', file: 'docs/10-risks-and-technical-debt.md', read: 'workflow1/05-sections.md' },
  s4: { label: 'Section 4', file: 'docs/03-architecture-layers.md', read: 'workflow1/05-sections.md' },
  s5: { label: 'Section 5 (component files + index)', file: 'docs/components/README.md', read: 'workflow1/05-sections.md + workflow1/05-components.md' },
  s8: { label: 'Section 8', file: 'docs/06-technology-stack.md', read: 'workflow1/05-sections.md' },
  s3: { label: 'Section 3', file: 'docs/02-architecture-principles.md', read: 'workflow1/05-sections.md' },
  s6: { label: 'Section 6', file: 'docs/04-data-flow-patterns.md', read: 'workflow1/05-sections.md' },
  s7: { label: 'Section 7', file: 'docs/05-integration-points.md', read: 'workflow1/05-sections.md' },
  s9: { label: 'Section 9', file: 'docs/07-security-architecture.md', read: 'workflow1/05-sections.md' },
  s10: { label: 'Section 10', file: 'docs/08-scalability-and-performance.md', read: 'workflow1/05-sections.md' },
  s11: { label: 'Section 11', file: 'docs/09-operational-considerations.md', read: 'workflow1/05-sections.md' },
  s12: { label: 'References', file: 'docs/11-references.md', read: 'workflow1/05-sections.md' },
  index: { label: 'ARCHITECTURE.md index', file: 'ARCHITECTURE.md', read: 'workflow1/05-sections.md + workflow1/05-index.md' },
  '5.7': { label: 'Step 5.7 Content Hygiene Gate', file: null, read: 'workflow1/05.7-hygiene-gate.md' },
  6: { label: 'Step 6 ADRs', file: 'adr/README.md', read: 'workflow1/06-adrs.md' },
  7: { label: 'Step 7 diagrams', file: null, read: 'workflow1/07-diagrams.md' },
};
// The segments: a checkpoint follows the last item of every segment but the final one
const SEGMENTS = [
  { n: 1, name: 'collection', items: ['collect'] },
  { n: 2, name: 'foundation', items: ['s1', 's13', 's4', 's5'] },
  { n: 3, name: 'structure', items: ['s8', 's3', 's6'] },
  { n: 4, name: 'remaining sections', items: ['s7', 's9', 's10', 's11', 's12', 'index'] },
  { n: 5, name: 'closing', items: ['5.7', '6', '7'] },
];
const ORDER = SEGMENTS.flatMap(s => s.items);
const segOf = (item) => SEGMENTS.find(s => s.items.includes(item));

const progressPath = (root) => path.join(root, '.cache', 'sa-skills', 'create-progress.json');
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

function load(root) {
  try { return JSON.parse(fs.readFileSync(progressPath(root), 'utf8').replace(/\r\n?/g, '\n')); }
  catch { return { schema: 'create-progress/1', started_at: null, done: {} }; }
}
function save(root, p) { fs.mkdirSync(path.dirname(progressPath(root)), { recursive: true }); fs.writeFileSync(progressPath(root), JSON.stringify(p, null, 2) + '\n'); }

function fileOk(root, item) {
  const f = ITEMS[item].file;
  if (!f) return true;
  if (item === 's5') {   // the index and at least one component file under a system folder
    const dir = path.join(root, 'docs', 'components');
    if (!exists(path.join(dir, 'README.md'))) return false;
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).some(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') && e.name !== 'README.md');
    try { return walk(dir); } catch { return false; }
  }
  return exists(path.join(root, f));
}

function status(root) {
  root = path.resolve(root);
  const p = load(root);
  const done = new Set(Object.keys(p.done).filter(k => ITEMS[k]));
  if (fileOk(root, 'collect')) done.add('collect');   // the record itself is the proof
  const next = ORDER.find(i => !done.has(i)) || null;
  // written but not marked: the item in progress or an earlier one — a later item's file may predate the create (adr/README.md)
  const upTo = next ? ORDER.indexOf(next) + 1 : ORDER.length;
  const unmarked = ORDER.slice(0, upTo).filter(i => !done.has(i) && ITEMS[i].file && i !== 'collect' && fileOk(root, i));
  const lost = [...done].filter(i => !fileOk(root, i));
  const seg = next ? segOf(next) : null;
  let mode = 'manual'; try { mode = JSON.parse(fs.readFileSync(path.join(root, '.cache', 'sa-skills', 'collect.json'), 'utf8')).checkpoints || 'manual'; } catch { /* no record yet */ }
  return {
    mode, segment_items: seg ? seg.items : [],
    project_root: root, started_at: p.started_at, done: ORDER.filter(i => done.has(i)), next,
    segment: seg ? { n: seg.n, of: SEGMENTS.length, name: seg.name } : null,
    read: next ? ITEMS[next].read : null, unmarked, lost, complete: !next,
  };
}

function markDone(root, item) {
  root = path.resolve(root);
  if (!ITEMS[item]) return { error: `unknown item "${item}" — one of ${ORDER.join(', ')}` };
  if (!fileOk(root, item)) return { error: `${item}: ${ITEMS[item].file} is not on disk — write it and pass its gates first` };
  const p = load(root);
  if (!p.started_at) p.started_at = new Date().toISOString();
  p.done[item] = new Date().toISOString();
  save(root, p);
  const s = status(root), seg = segOf(item);
  const closes = seg.items.every(i => s.done.includes(i)) && seg.n < SEGMENTS.length && s.next && segOf(s.next).n > seg.n;
  return Object.assign(s, { marked: item, checkpoint: closes ? { n: seg.n, of: SEGMENTS.length - 1, segment: seg.name, items: seg.items.map(i => ITEMS[i].label) } : null });
}

function receipt(s) {
  const out = ['CREATE_PROGRESS'];
  if (s.error) return out.concat('ERROR: ' + s.error).join('\n');
  if (s.marked) out.push(`marked: ${s.marked} (${ITEMS[s.marked].label})`);
  out.push(`done: ${s.done.length ? s.done.join(' · ') : 'nothing yet'}`);
  if (s.complete) out.push('next: — the create is complete');
  else out.push(`next: ${s.next} — ${ITEMS[s.next].label} · segment ${s.segment.n}/${s.segment.of} (${s.segment.name}: ${s.segment_items.join(' · ')}) · read ${s.read}`);
  if (s.unmarked.length) out.push(`on disk but not marked: ${s.unmarked.join(' · ')} — re-run its gates, then --done (or rewrite it if they fail)`);
  if (s.lost.length) out.push(`marked but missing on disk: ${s.lost.join(' · ')} — write it again`);
  if (s.checkpoint) {
    const c = s.checkpoint;
    if (s.mode === 'auto') out.push('', `⏩ CHECKPOINT ${c.n} of ${c.of} — ${c.items.join(', ')}: written and through their gates.`,
      '   Automatic checkpoints: do not stop. The orchestrator dispatches the next segment-runner',
      `   (workflow1/05-auto.md) for ${s.segment_items.join(' · ')}.`);
    else out.push('', `⏸  CHECKPOINT ${c.n} of ${c.of} — ${c.items.join(', ')}: written and through their gates.`,
      '   Display this to the user and STOP. Nothing written so far needs to stay in this session:',
      '   the next step reads it from disk. Run /clear, then say "continue the architecture"',
      '   ("continúa la arquitectura"). Saying it without /clear also works, but keeps the context.');
  }
  return out.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun create-progress.js <project-root> [--done <item> | --reset] [--json]'); process.exit(2); }
  let r;
  if (args.includes('--reset')) { try { fs.unlinkSync(progressPath(path.resolve(args[0]))); } catch { /* nothing to forget */ } r = status(args[0]); }
  else if (opt('--done')) r = markDone(args[0], opt('--done'));
  else r = status(args[0]);
  console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : receipt(r));
  process.exit(r.error ? 1 : 0);
}

module.exports = { status, markDone, receipt, ITEMS, SEGMENTS, ORDER };
