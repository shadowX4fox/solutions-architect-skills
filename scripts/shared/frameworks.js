#!/usr/bin/env bun
// Capability frameworks: the industry reference models a PO Spec is aligned against before an architecture is written
// (architecture-docs Workflow 1 Step 0.3, the alignment skill). Each is a corpus in one shape — areas › domains › units,
// one Markdown file per area, `**What it does.**` per unit — described by its `framework.json` (id, name, industry, the
// three level names, the report file, licence). The base ships two: BIAN (banking) and CROSS-INDUSTRY (Turbo EA
// Capabilities, CC BY 4.0). An institution pack adds its own under `provides.frameworks` (one folder per framework); a
// pack framework with a built-in's id replaces it — an organization's licensed BIAN Service Landscape replaces the open corpus.
//
// A project declares its framework once, in `.sa-skills/project.json` (`{ "framework": "BIAN" | "<id>" | "none" }`);
// otherwise an institution pack's `defaults.framework`; otherwise a BIAN_ALIGNMENT.md (or the older ENTERPRISE_ALIGNMENT.md) at the root means BIAN (the
// projects written before frameworks were pluggable); otherwise nothing is declared and Workflow 1 asks once.
//
//   bun frameworks.js [--project <dir>] [--json]       the frameworks available and the one declared
//   bun frameworks.js --declare <id|none> --project <dir>   record the project's choice
//   bun frameworks.js --dir <id> [--project <dir>]          the folder of a framework's corpus in force (a pack's, else the base's)
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', '..');
const CORPORA = path.join(BASE, 'plugins', 'sa-requirements', 'skills', 'architecture-capability-alignment', 'references');
const BUILTIN = { BIAN: path.join(CORPORA, 'bian-v14'), 'CROSS-INDUSTRY': path.join(CORPORA, 'cross-industry') };
const NONE = 'none';
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const packs = () => require('./packs.js');
const projectFile = (root) => path.join(path.resolve(root || process.cwd()), '.sa-skills', 'project.json');

// a framework folder: its descriptor, with the corpus folder (`dir`) and where it came from
function load(dir, descriptorDir, source) {
  const d = readJson(path.join(descriptorDir || dir, 'framework.json'));
  if (!d || !d.id || !d.index || !fs.existsSync(path.join(dir, d.index))) return null;
  return Object.assign({}, d, { id: String(d.id).toUpperCase(), dir, from: source });
}

// every framework available here: { id → descriptor + dir + from (base or the pack) }
function frameworks(opts = {}) {
  const out = {}, warnings = [];
  let dirs = [];
  Object.entries(BUILTIN).forEach(([id, dir]) => { const f = load(dir, null, 'base'); if (f) out[id] = f; });
  try { dirs = packs().findPacks(opts).packs.filter((p) => p.manifest.provides.frameworks).map((p) => ({ name: p.name, dir: path.resolve(p.dir, p.manifest.provides.frameworks) })).filter((x) => fs.existsSync(x.dir)); } catch (e) { dirs = []; }
  dirs.forEach(({ name, dir }) => fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).forEach((e) => {
    const f = load(path.join(dir, e.name), null, name);
    if (!f) { warnings.push(`${name}: ${e.name}/framework.json missing, or its index file absent — skipped`); return; }
    if (out[f.id] && out[f.id].from !== 'base') { warnings.push(`framework ${f.id}: provided by ${out[f.id].from} and ${name} — ${out[f.id].from} is used`); return; }
    out[f.id] = f;
  }));
  return { frameworks: out, warnings };
}
const normId = (v, opts) => { const k = String(v || '').trim().toUpperCase().replace(/[\s_]+/g, '-'); if (k === 'NONE') return NONE; return frameworks(opts).frameworks[k] ? k : null; };

// the project's framework: { id: <id> | 'none' | null, source: 'project' | 'pack' | 'legacy-report' | null }
function declared(root, opts = {}) {
  const o = Object.assign({ project: root }, opts), p = readJson(projectFile(root));
  if (p && p.framework) { const id = normId(p.framework, o); if (id) return { id, source: 'project' }; }
  try { const d = packs().defaults(o).framework; const id = d && normId(d, o); if (id) return { id, source: 'pack' }; } catch (e) { /* no packs */ }
  if (['BIAN_ALIGNMENT.md', 'ENTERPRISE_ALIGNMENT.md'].some((f) => fs.existsSync(path.join(path.resolve(root), f)))) return { id: 'BIAN', source: 'legacy-report' };
  return { id: null, source: null };
}
// record the project's choice; refuses an id no framework answers to
function declare(root, value, opts = {}) {
  const id = normId(value, Object.assign({ project: root }, opts));
  if (!id) throw new Error(`unknown framework "${value}" — one of ${Object.keys(frameworks(Object.assign({ project: root }, opts)).frameworks).join(', ')} or none`);
  const f = projectFile(root), cur = readJson(f) || {};
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(Object.assign(cur, { framework: id }), null, 2) + '\n');
  return id;
}
// the descriptor in force for a project, or null (none declared, or 'none')
function forProject(root, opts = {}) { const d = declared(root, opts); return d.id && d.id !== NONE ? frameworks(Object.assign({ project: root }, opts)).frameworks[d.id] || null : null; }

module.exports = { BUILTIN, NONE, frameworks, normId, declared, declare, forProject };

if (require.main === module) {
  const a = process.argv.slice(2), opt = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const root = opt('--project') || process.cwd(), opts = { project: root };
  if (a.includes('--dir')) { const id = normId(opt('--dir'), opts), f = id && frameworks(opts).frameworks[id]; if (!f) { console.error(`unknown framework ${opt('--dir')}`); process.exit(1); } console.log(f.dir); process.exit(0); }
  if (a.includes('--declare')) { try { console.log(declare(root, opt('--declare'), opts)); process.exit(0); } catch (e) { console.error(e.message); process.exit(2); } }
  const { frameworks: f, warnings } = frameworks(opts), d = declared(root, opts);
  if (a.includes('--json')) { console.log(JSON.stringify({ declared: d, frameworks: Object.values(f).map((x) => ({ id: x.id, name: x.name, industry: x.industry, report: x.report, from: x.from })), warnings }, null, 2)); process.exit(0); }
  Object.values(f).forEach((x, n) => console.log(`${n + 1}. ${x.id} — ${x.name} (${x.industry}) → ${x.report}${x.from !== 'base' ? ` [${x.from}]` : ''}`));
  console.log(`declared: ${d.id || 'nothing'}${d.source ? ` (${d.source})` : ''}`);
  warnings.forEach((w) => console.error('⚠ ' + w));
}
