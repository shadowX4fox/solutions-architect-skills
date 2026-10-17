#!/usr/bin/env node
// resume-prepare.js — everything a resumed create segment needs, in one receipt.
//
//   bun resume-prepare.js <project-root> [--plugin-dir <dir>]
//
// The 8.87.0 control run stopped at four checkpoints as designed and halved the context per call (303K →
// 156K), but every resumed session then spent ~10 calls and ~50K tokens loading its bearings and ran about
// twenty `cd …; ls / grep / sed` commands (77–88 KB per segment) to rediscover a state that is on disk:
// what is done, what was collected, which decisions stand, which files exist. The run made 250 calls where
// the single session had made 113, and cost more. This prints that state once — the progress, the
// collection, the ADR Context Block whole, the facts in counts, the files written — and the command for the
// next item, so a segment starts writing on its second call.
'use strict';
const fs = require('fs');
const path = require('path');
const { status, ITEMS } = require(path.join(__dirname, 'create-progress.js'));
const { collect, summary } = require(path.join(__dirname, 'arch-facts.js'));

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const SECTION_OF = { s1: 1, s13: 13, s4: 4, s5: 5, s8: 8, s3: 3, s6: 6, s7: 7, s9: 9, s10: 10, s11: 11, s12: 12 };

function listDocs(root) {
  const out = [];
  const walk = (rel) => {
    let es; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const e of es) { const r = rel + '/' + e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.md')) out.push([r, fs.statSync(path.join(root, r)).size]); }
  };
  walk('docs');
  if (fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) out.unshift(['ARCHITECTURE.md', fs.statSync(path.join(root, 'ARCHITECTURE.md')).size]);
  return out;
}

function prepare(root, opts = {}) {
  root = path.resolve(root);
  const s = status(root);
  const lines = ['RESUME_PREPARE — this receipt is the project\'s state: do not ls / grep / cat the project to rediscover it', ''];

  // 1. progress
  lines.push(`## Progress`, `done: ${s.done.join(' · ') || 'nothing'}`);
  if (s.complete) { lines.push('The create is complete — nothing to resume.'); return lines.join('\n'); }
  lines.push(`next: ${s.next} — ${ITEMS[s.next].label} · segment ${s.segment.n}/${s.segment.of} (${s.segment.name})`, `segment items: ${s.segment_items.filter((i) => !s.done.includes(i)).join(' · ')} — the segment ends after the last of these`, `checkpoints: ${s.mode}`);
  if (s.unmarked.length) lines.push(`on disk but not marked: ${s.unmarked.join(' · ')} — re-run its gates (05-sections.md loop, item 3), then --done; rewrite only if they fail`);
  if (s.lost.length) lines.push(`marked but missing on disk: ${s.lost.join(' · ')} — write it again`);

  // 2. the collection
  const cpath = path.join(root, '.cache', 'sa-skills', 'collect.json');
  let c = null; try { c = JSON.parse(read(cpath)); } catch { /* reported below */ }
  lines.push('', '## Collection (Step 4.9 — never ask again)');
  if (!c) lines.push('collect.json missing — this is not a resumable create; start at Step 0.1');
  else {
    lines.push(`language ${c.doc_language} · type ${c.architecture_type} · architect ${c.architect || '—'}`);
    lines.push(`PO Spec ${c.po_spec ? c.po_spec.path : 'skipped'} · alignment ${c.alignment ? (c.alignment.framework === 'none' ? 'none' : `${c.alignment.framework} ${c.alignment.path || 'missing'}`) : c.bian ? `BIAN ${c.bian.path}` : 'skipped'} · HLD ${c.hld ? `${c.hld.path} (${c.hld.format})` : 'skipped'}`);
    lines.push(`Optional diagrams at Step 7.2: ${Array.isArray(c.optional_diagrams) ? `${c.optional_diagrams.join(', ') || 'none'} — do not ask` : 'not recorded — ask at Step 7.2'}`);
    lines.push(`ADRs at Step 6: ${c.adr ? `${c.adr.status} · optional candidates ${c.adr.optional} — do not ask` : 'not recorded — ask at Step 6'}`);
    (c.systems || []).forEach((sy) => lines.push(`- ${sy.name} (${sy.role})${sy.containers && sy.containers.length ? ': ' + sy.containers.join(', ') : ''}`));
  }

  // 3. the ADR Context Block, whole — it is small and every section reads it
  const adr = path.join(root, '.cache', 'sa-skills', 'adr-context.md');
  lines.push('', '## ADR Context Block (.cache/sa-skills/adr-context.md — update it with Edit as decisions are made)');
  lines.push(fs.existsSync(adr) ? read(adr).trim() : '(not saved)');

  // 4. the facts, in counts; the payloads carry them as tables
  lines.push('', '## Facts');
  try {
    const f = collect(root);
    if (fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) lines.push(summary(f));
    else {   // mid-create: ARCHITECTURE.md is written last, and the ledger's docs / ADR parts read through it
      const adrs = fs.existsSync(path.join(root, 'adr')) ? fs.readdirSync(path.join(root, 'adr')).filter((x) => /^ADR-\d{3}.*\.md$/.test(x)).length : 0;
      lines.push(`${f.systems.length} systems · ${f.components.filter((x) => x.level === 'L2').length} containers · ${f.layers.length} layers · ${f.integrations.length} integrations · ${f.flows.length} flows · ${adrs} ADR files · ${f.tdrs.length} TDRs (mid-create: the section payloads carry these as tables)`);
    }
  } catch (e) { lines.push('arch-facts: ' + e.message); }

  // 5. what is written
  lines.push('', '## Written');
  const docs = listDocs(root);
  lines.push(docs.length ? docs.map(([f, b]) => `${f} ${kb(b)}`).join(' · ') : '(nothing yet)');

  // 6. the next step, as commands
  const pd = opts.pluginDir || '[plugin_dir]';
  lines.push('', '## Next');
  lines.push(`Read (with Read, not cat): ${ITEMS[s.next].read.split(' + ').map((f) => `${pd}/skills/architecture-docs/${f}`).join(' and ')}`);
  const n = SECTION_OF[s.next];
  if (n && c) {
    const flags = [`--section ${n}`, `--type ${c.architecture_type}`, `--lang ${c.doc_language}`];
    if (c.po_spec) flags.push(`--po-spec "${c.po_spec.path}"`);
    if (c.hld) flags.push(`--hld "${c.hld.path}"`);
    if (fs.existsSync(adr)) flags.push('--adr-context .cache/sa-skills/adr-context.md');
    lines.push(`Payload: bun ${pd}/skills/architecture-docs/scripts/section-prepare.js ${root} ${flags.join(' ')}`);
    lines.push(`Then Read .cache/sa-skills/payloads/section-${String(n).padStart(2, '0')}.md once, write the file, run its gates, arch-facts.js, and create-progress.js --done ${s.next}.`);
  } else if (s.next === 'index') lines.push('Write ARCHITECTURE.md per 05-index.md, then create-progress.js --done index.');
  else lines.push(`Run the step the file describes, then create-progress.js --done ${s.next}.`);
  return lines.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun resume-prepare.js <project-root> [--plugin-dir <dir>]'); process.exit(2); }
  console.log(prepare(args[0], { pluginDir: opt('--plugin-dir') }));
}

module.exports = { prepare };
