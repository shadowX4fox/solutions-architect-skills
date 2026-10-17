#!/usr/bin/env node
// gates-check.js — Workflow 1's entry gates (Steps 0.1–0.4 and 0.65) checked by code, one receipt.
//
//   bun gates-check.js <project-root> [--lang en|es] [--hld <file>] [--json]
//
// Through 8.85.0 a create read `workflow1/00-gates.md` whole (38 KB) at Step 0.1 and kept it in context
// for the rest of the run, although on the common path — a PO Spec, a capability alignment and an HLD already
// in the project — every gate passes and only a few lines of it matter. This checks what the gates check
// from disk and prints one line per gate. A gate that passes needs nothing more; a gate that does not
// names the line range of `00-gates.md` that handles it, and only that range is read.
//
// Status per gate: PASS · ASK (the user must answer — the language, the HLD path, a choice among several
// files) · WARN (passes with a warning to show) · BLOCK (stop — the range says what to display) ·
// MISSING (the gate's own menu runs — the PO Spec). Exit 0 unless a gate is BLOCK. A `read:` line appears
// only where the receipt cannot carry the handling — MISSING, BLOCK, and an HLD that is not Mermaid.
'use strict';
const fs = require('fs');
const path = require('path');

const GATES_DOC = path.join(__dirname, '..', 'workflow1', '00-gates.md');
const SKIP_DIRS = new Set(['node_modules', '.git', '.cache', 'archive', 'exports', 'dist', 'build']);
const HLD_EXT = { '.mmd': 'mermaid', '.mermaid': 'mermaid', '.md': 'mermaid', '.pdf': 'pdf', '.svg': 'svg', '.png': 'png' };

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const marker = (text, name) => { const m = text.match(new RegExp('<!--\\s*' + name + ':\\s*([^>]*?)\\s*-->')); return m ? m[1].trim() : null; };

// Files under the project, three levels deep, outside generated and vendored trees
function walk(root, depth = 3, out = [], rel = '') {
  if (depth < 0) return out;
  let entries; try { entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) walk(root, depth - 1, out, r); }
    else out.push(r);
  }
  return out;
}

// Line ranges of every `#### Step 0.x` block of 00-gates.md, so a failing gate reads its block only
function stepRanges(doc = GATES_DOC) {
  const lines = read(doc).split('\n'), heads = [];
  lines.forEach((l, i) => { const m = l.match(/^#{2,6}\s+Step\s+(0\.\d+)\b/); if (m) heads.push({ step: m[1], line: i + 1 }); });
  const out = {};
  heads.forEach((h, i) => { out[h.step] = { from: h.line, to: i + 1 < heads.length ? heads[i + 1].line - 1 : lines.length }; });
  return out;
}

function checkLanguage(root, opts) {
  if (opts.lang) return { gate: '0.1', name: 'language', status: 'PASS', value: opts.lang, note: 'given' };
  const arch = path.join(root, 'ARCHITECTURE.md');
  if (exists(arch)) {
    const t = read(arch), v = marker(t, 'DOC_LANGUAGE') || marker(t, 'LANGUAGE');
    if (v) return { gate: '0.1', name: 'language', status: 'PASS', value: v, note: marker(t, 'DOC_LANGUAGE') ? 'ARCHITECTURE.md' : 'legacy LANGUAGE marker — rewrite as DOC_LANGUAGE' };
  }
  const collect = path.join(root, '.cache', 'sa-skills', 'collect.json');
  if (exists(collect)) { try { const c = JSON.parse(read(collect)); if (c.doc_language) return { gate: '0.1', name: 'language', status: 'PASS', value: c.doc_language, note: 'collect.json' }; } catch { /* fall through */ } }
  const po = path.join(root, 'PRODUCT_OWNER_SPEC.md');
  const def = exists(po) ? marker(read(po), 'DOC_LANGUAGE') : null;
  return { gate: '0.1', name: 'language', status: 'ASK', value: null, default: def, note: def ? `PO Spec suggests ${def}; the architect confirms` : 'ask en / es' };
}

// The PO Spec is business only (sa-requirements' po-spec-delta.js --check, shipped inside this plugin's root): an ADR, TDR
// or integration id in it is a WARN — the architecture about to be written does not take it as a decision already made.
function archRefs(root, f) {
  // optional: architecture-readiness (sa-requirements) — without it the gate passes without the reference count
  let poSpecDelta = null;
  try { poSpecDelta = require(path.join(__dirname, '..', '..', '..', 'plugins', 'sa-requirements', 'skills', 'architecture-readiness', 'scripts', 'po-spec-delta.js')); } catch { return null; } // optional:
  try { return poSpecDelta.check(root, { poSpec: path.join(root, f) }).findings; } catch { return null; }
}
function poSpecPass(root, f) {
  const refs = archRefs(root, f);
  if (!refs || !refs.length) return { gate: '0.2', name: 'po_spec', status: 'PASS', value: f };
  const ids = [...new Set(refs.map(r => r.ref.replace(/^.*\//, '').replace(/^((?:ADR|TDR)-\d{3}).*$/, '$1')))];
  return { gate: '0.2', name: 'po_spec', status: 'WARN', value: f, note: `${refs.length} architecture reference(s) in the spec (${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ', …' : ''}) — the PO Spec is business only; none is a decision of this architecture` };
}

function checkPoSpec(root, files) {
  for (const f of ['PRODUCT_OWNER_SPEC.md', 'PO_SPEC.md']) if (exists(path.join(root, f))) return poSpecPass(root, f);
  let hits = files.filter(f => /(^|\/)(PRODUCT_OWNER_SPEC|PO_SPEC)[^/]*\.md$/i.test(f));
  if (!hits.length) hits = files.filter(f => f.endsWith('.md') && /^# .* - Product Owner Specification/m.test(read(path.join(root, f)).slice(0, 4000)));
  if (hits.length === 1) return poSpecPass(root, hits[0]);
  if (hits.length > 1) return { gate: '0.2', name: 'po_spec', status: 'ASK', value: null, candidates: hits, note: 'several specs — the user picks one' };
  return { gate: '0.2', name: 'po_spec', status: 'MISSING', value: null, note: 'no PO Spec — run the gate menu (elicit, intake, inline, SKIP PO SPEC)' };
}

// Step 0.3 — the capability alignment of the framework the project declares (scripts/shared/frameworks.js): BIAN for a bank,
// the cross-industry map, a pack's own. Declared `none`, the gate passes; nothing declared, it asks once; declared, the
// framework's report must exist at the report version it states.
const FRAMEWORKS = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'frameworks.js'));
function checkAlignment(root, files, po) {
  if (po.status === 'MISSING') return { gate: '0.3', name: 'align', status: 'ASK', value: null, note: 'decided after the PO Spec gate (a skip cascades)' };
  const d = FRAMEWORKS.declared(root);
  if (d.id === FRAMEWORKS.NONE) return { gate: '0.3', name: 'align', status: 'PASS', value: 'none', framework: 'none', note: 'the project declares no capability framework' };
  if (!d.id) {
    const ids = Object.keys(FRAMEWORKS.frameworks({ project: root }).frameworks);
    return { gate: '0.3', name: 'align', status: 'ASK', value: null, note: `no capability framework declared — ask once: ${ids.join(' · ')} · none; record it with \`bun [plugin_dir]/scripts/shared/frameworks.js --declare <id|none> --project <root>\`` };
  }
  const f = FRAMEWORKS.frameworks({ project: root }).frameworks[d.id];
  const re = new RegExp('(^|/)' + f.report.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
  const file = exists(path.join(root, f.report)) ? f.report : files.find((x) => re.test(x));
  const run = `run /sa-requirements:architecture-capability-alignment${f.id === 'BIAN' ? '' : ` --framework ${f.id}`}`;
  if (!file) {
    const legacy = f.id === 'BIAN' && files.find((x) => /(^|\/)ENTERPRISE_ALIGNMENT\.md$/.test(x));
    return { gate: '0.3', name: 'align', status: 'BLOCK', value: legacy || null, framework: f.id, note: legacy ? `legacy ENTERPRISE_ALIGNMENT.md only — regenerate: ${run}` : `${f.id} declared (${d.source}), no ${f.report} — ${run}` };
  }
  const t = read(path.join(root, file)), vm = f.version_marker || (f.id === 'BIAN' ? 'BIAN_ALIGNMENT_VERSION' : 'ALIGNMENT_VERSION'), min = Number(f.min_version || (f.id === 'BIAN' ? 3 : 1)), ver = marker(t, vm);
  if (!ver || Number(ver) < min) return { gate: '0.3', name: 'align', status: 'BLOCK', value: file, framework: f.id, note: `report version ${ver || 'unstated'} is below ${min.toFixed(1)} — regenerate: ${run}` };
  const r = { gate: '0.3', name: 'align', status: 'PASS', value: file, framework: f.id, version: ver };
  // staleness: written against another spec, or older than the spec it maps
  if (po.value) {
    const src = marker(t, 'PO_SPEC_SOURCE'), gen = marker(t, 'GENERATED');
    const specTime = fs.statSync(path.join(root, po.value)).mtime;
    const reasons = [];
    if (src && path.basename(src) !== path.basename(po.value)) reasons.push(`written against ${src}`);
    if (gen && !isNaN(Date.parse(gen)) && new Date(gen) < new Date(specTime.toISOString().slice(0, 10))) reasons.push(`generated ${gen}, spec modified ${specTime.toISOString().slice(0, 10)}`);
    if (reasons.length) Object.assign(r, { status: 'WARN', note: 'may be stale — ' + reasons.join('; ') + ' (ask: continue anyway?)' });
  }
  return r;
}

function checkHld(root, files, opts, po, align) {
  if (po.status === 'MISSING' || align.status === 'BLOCK') return { gate: '0.4', name: 'hld', status: 'ASK', value: null, note: 'after the PO Spec and alignment gates' };
  const validate = (f) => {
    const ext = path.extname(f).toLowerCase(), format = HLD_EXT[ext];
    if (!format) return `unsupported extension ${ext || '(none)'} — accepted: .mmd .mermaid .md .pdf .svg .png`;
    if (!exists(path.resolve(root, f))) return `${f} not found`;
    if (ext === '.md' && !/^```mermaid\b/m.test(read(path.resolve(root, f)))) return `${f} has no \`\`\`mermaid fence`;
    return null;
  };
  if (opts.hld) {
    const err = validate(opts.hld), f = path.relative(root, path.resolve(root, opts.hld)).replace(/\\/g, '/');
    if (err) return { gate: '0.4', name: 'hld', status: 'ASK', value: null, note: err };
    const format = HLD_EXT[path.extname(f).toLowerCase()];
    if (format === 'mermaid') return { gate: '0.4', name: 'hld', status: 'PASS', value: f, format, note: 'the section payloads carry it verbatim — do not read it here' };
    // 8.93.1: a picture is transcribed once, here, into `<name>.hld.mmd` beside it — integration-check.js and the section payloads
    // read the connections from it; the gate holds until the transcription exists and states at least one edge
    const { transcriptionOf, parseHld } = require(path.join(__dirname, 'integration-check.js'));
    const t = path.relative(root, transcriptionOf(path.resolve(root, f))).replace(/\\/g, '/');
    const g = exists(path.join(root, t)) ? parseHld(read(path.join(root, t))) : null;
    if (!g || !g.edges.length) return { gate: '0.4', name: 'hld', status: 'TRANSCRIBE', value: f, format, transcription: t, note: g ? `${t} states no edge I can read — every connection is \`A -->|"label"| B\`` : `read ${f} once and write ${t} (00-gates.md Step 0.4, item 2b), then re-run with --hld ${f}` };
    return { gate: '0.4', name: 'hld', status: 'PASS', value: f, format, transcription: t, note: `transcribed in ${t} (${Object.values(g.nodes).filter((n) => !n.subgraph).length} nodes, ${g.edges.length} edges) — the payloads carry the transcription; do not read the picture again` };
  }
  const cands = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    if (ext === '.mmd' || ext === '.mermaid') return true;
    if (/^(docs|adr|handoffs|compliance-docs|analysis|visualizations)\//.test(f)) return false;
    if (/(^|\/)(PRODUCT_OWNER_SPEC|PO_SPEC|BIAN_ALIGNMENT|CAPABILITY_ALIGNMENT|ARCHITECTURE|README|CLAUDE)[^/]*\.md$/i.test(f)) return false;
    if (ext === '.md') { try { return /^```mermaid\b/m.test(read(path.join(root, f))); } catch { return false; } }
    return (ext === '.pdf' || ext === '.svg' || ext === '.png') && /hld|design|arquitect|architecture|diagram/i.test(f);
  });
  return { gate: '0.4', name: 'hld', status: 'ASK', value: null, candidates: cands, note: 'ask the architect for the HLD path (no skip), then re-run with --hld <file>' };
}

function checkCatalog(root, po) {
  const dir = path.join(root, 'adr');
  const ids = fs.existsSync(dir) ? fs.readdirSync(dir).map(f => (f.match(/^ADR-(\d{3})\b.*\.md$/) || [])[1]).filter(Boolean).map(Number) : [];
  const inst = new Set(ids.filter(n => n <= 100)), project = ids.filter(n => n > 100).length;
  const cited = new Set();
  if (po.value) for (const m of read(path.join(root, po.value)).matchAll(/\bADR-(\d{3})\b/g)) { const n = Number(m[1]); if (n >= 1 && n <= 100) cited.add(n); }
  const dangling = [...cited].filter(n => !inst.has(n)).sort((a, b) => a - b);
  const pad = (n) => 'ADR-' + String(n).padStart(3, '0');
  if (dangling.length) return { gate: '0.65', name: 'catalog', status: 'BLOCK', value: null, note: `cited, no file in adr/: ${dangling.map(pad).join(', ')} — import the catalog (architecture-definition-record Workflow 6)` };
  if (!inst.size) return { gate: '0.65', name: 'catalog', status: 'WARN', value: null, note: 'no institutional ADRs in adr/ — ask once whether the organization keeps a catalog' };
  return { gate: '0.65', name: 'catalog', status: 'PASS', value: `${inst.size} institutional · ${project} project` };
}

function check(root, opts = {}) {
  root = path.resolve(root);
  const files = walk(root);
  const lang = checkLanguage(root, opts);
  const po = checkPoSpec(root, files);
  const align = checkAlignment(root, files, po);
  const hld = checkHld(root, files, opts, po, align);
  const catalog = checkCatalog(root, po);
  const ranges = stepRanges();
  // a range is read only when the receipt cannot carry the handling: the PO Spec menu, a blocking message, the
  // transcription rules of an HLD that is not Mermaid. An ASK or a WARN is resolved from its note.
  const needsRange = (g) => g.status === 'MISSING' || g.status === 'BLOCK' || (g.name === 'hld' && g.status === 'TRANSCRIBE');
  const gates = [lang, po, align, hld, catalog].map(g => (needsRange(g) && ranges[g.gate] ? Object.assign(g, { read: `workflow1/00-gates.md:${ranges[g.gate].from}-${ranges[g.gate].to}` }) : g));
  return { project_root: root, gates, blocked: gates.some(g => g.status === 'BLOCK') };
}

function receipt(r) {
  const icon = { PASS: '✅', WARN: '⚠️ ', ASK: '❓', MISSING: '🚫', BLOCK: '⛔', TRANSCRIBE: '✍️ ' };
  const lines = ['GATES_CHECK'];
  for (const g of r.gates) {
    let l = `${icon[g.status]} ${g.gate.padEnd(4)} ${g.name.padEnd(8)} ${g.status.padEnd(7)}`;
    if (g.value) l += ` ${g.value}`;
    if (g.format) l += ` (${g.format})`;
    if (g.framework && g.framework !== 'none') l += ` [${g.framework}]`;
    if (g.version) l += ` (v${g.version})`;
    if (g.default) l += ` default ${g.default}`;
    if (g.note) l += ` — ${g.note}`;
    lines.push(l);
    if (g.candidates && g.candidates.length) lines.push('       candidates: ' + g.candidates.slice(0, 8).join(' · ') + (g.candidates.length > 8 ? ` · +${g.candidates.length - 8}` : ''));
    if (g.read) lines.push(`       read: ${g.read}`);
  }
  lines.push(r.blocked ? 'RESULT: BLOCKED — display what the named range says and stop' : 'RESULT: continue — resolve every ASK / MISSING / WARN / TRANSCRIBE line, reading only its range');
  return lines.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun gates-check.js <project-root> [--lang en|es] [--hld <file>] [--json]'); process.exit(2); }
  const r = check(args[0], { lang: opt('--lang'), hld: opt('--hld') });
  console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : receipt(r));
  process.exit(r.blocked ? 1 : 0);
}

module.exports = { check, receipt, stepRanges };
