#!/usr/bin/env bun
// Institution packs: what an organization adds to the base plugin without forking it — its design language standard, its brand skins, its
// architecture types, its capability frameworks (a licensed BIAN landscape among them), its defaults. A pack is any installed Claude Code plugin (any marketplace, usually a private
// one) whose root carries `sa-pack.json`:
//
//   { "name": "sa-pack-acme", "version": "1.0.0", "base": ">=9.1.0 <10.0.0",
//     "provides": { "designLanguage": "design-language", "skins": "skins", "architectureTypes": "architecture-types", "frameworks": "frameworks" },
//     "defaults": { "docLanguage": "es", "theme": "acme", "architectureType": "ACME", "framework": "BIAN", "adrCatalog": { "url": "https://…/adr-catalog.git", "ref": "main" } } }
//
// `provides` paths are relative to the pack. The base never names a pack: it finds them here, from Claude Code's install registry
// (the user scope, and the project or local scope whose project is this directory or an ancestor) and from SA_PACKS (paths, ':'
// separated — development and tests). A pack whose `base` range excludes this base is skipped with a warning. Precedence, most
// specific first: the project, a pack, the base's own bundled copy.
//
// A project outside the organization a user-scope pack belongs to (an open-source one, a client's, a demo) opts out in
// `.sa-skills/project.json`, the nearest one at or above the project: `"packs": []` — no pack applies; `"packs": ["<name>", …]` —
// only those; the key absent — every pack found. Every reader resolves through findPacks, so the choice holds for all of them.
//
//   bun packs.js [--project <dir>] [--json]               the packs found and what each provides
//   bun packs.js --declare none|all|<name,…> [--project <dir>]   record the project's packs in .sa-skills/project.json
//   bun packs.js --path <design-language|skins|architecture-types|frameworks> [--project <dir>]   the folder in force, or nothing (exit 1)
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = path.join(__dirname, '..', '..');                     // sa-skills' root
const BUNDLED = {                                                 // the base's own copies, used when no pack provides one
  'design-language': path.join(BASE, 'skills', 'architecture-docs', 'references', 'design-language'),
};
const KEY = { 'design-language': 'designLanguage', skins: 'skins', 'architecture-types': 'architectureTypes', frameworks: 'frameworks' };
// what proves a folder is the thing it claims to be
const PROBE = { 'design-language': 'llms-rules.txt', skins: null, 'architecture-types': null, frameworks: null };

const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const baseVersion = () => (read(path.join(BASE, '.claude-plugin', 'plugin.json')) || {}).version || '0.0.0';
const semver = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
// a range is space-separated comparators: >=9.1.0 <10.0.0 · ^9.1 · 9.x · * — every one must hold
function satisfies(v, range) {
  if (!range || range === '*') return true;
  return String(range).trim().split(/\s+/).every((c) => {
    const m = c.match(/^(>=|<=|>|<|=|\^)?\s*v?([\d.x*]+)$/); if (!m) return false;
    const op = m[1] || '=', r = m[2].replace(/\.?[x*]$/, '');
    if (op === '^') { const [maj] = semver(r); return cmp(v, r) >= 0 && semver(v)[0] === maj; }
    if (!m[1] && /[x*]/.test(m[2])) return String(v).startsWith(r + '.') || v === r;
    const d = cmp(v, r);
    return op === '>=' ? d >= 0 : op === '<=' ? d <= 0 : op === '>' ? d > 0 : op === '<' ? d < 0 : d === 0;
  });
}
const within = (dir, root) => { const d = path.resolve(dir), r = path.resolve(root); return d === r || d.startsWith(r.endsWith(path.sep) ? r : r + path.sep); };
const claudeDir = () => process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(os.homedir(), '.claude');

// the install paths of every plugin that applies to this project, from the registry
function registryDirs(project, registry) {
  const r = read(registry || path.join(claudeDir(), 'plugins', 'installed_plugins.json')); if (!r) return [];
  const out = [];
  Object.values(r.plugins || r).forEach((entries) => {
    if (!Array.isArray(entries)) return;
    const live = entries.filter((e) => e && e.installPath && fs.existsSync(e.installPath));
    const scoped = live.filter((e) => (e.scope === 'project' || e.scope === 'local') && e.projectPath && within(project, e.projectPath)).sort((a, b) => b.projectPath.length - a.projectPath.length);
    const hit = scoped[0] || live.find((e) => e.scope === 'user');
    if (hit) out.push(path.resolve(hit.installPath));
  });
  return out;
}

// the project's choice: { file, packs: null (the key absent) | string[] } from the nearest .sa-skills/project.json at or above it
function projectChoice(project) {
  for (let d = path.resolve(project); ; d = path.dirname(d)) {
    const f = path.join(d, '.sa-skills', 'project.json');
    if (fs.existsSync(f)) { const j = read(f) || {}; return { file: f, packs: Array.isArray(j.packs) ? j.packs.map(String) : null }; }
    if (path.dirname(d) === d) return { file: null, packs: null };
  }
}

// The packs that apply here: { name, version, dir, manifest, source }[]; `warnings` for the ones skipped, `excluded` for the ones
// the project's `packs` key leaves out
function findPacks(opts = {}) {
  const project = path.resolve(opts.project || process.cwd()), warnings = [], seen = new Set(), packs = [], excluded = [], bv = baseVersion();
  const choice = projectChoice(project);
  const env = (opts.env !== undefined ? opts.env : process.env.SA_PACKS || '').split(path.delimiter).filter(Boolean).map((d) => [path.resolve(d), 'env:SA_PACKS']);
  const reg = opts.noRegistry ? [] : registryDirs(project, opts.registry).map((d) => [d, 'registry']);
  env.concat(reg).forEach(([dir, source]) => {
    const mf = path.join(dir, 'sa-pack.json'); if (!fs.existsSync(mf) || seen.has(dir)) return; seen.add(dir);
    const m = read(mf);
    if (!m || !m.name || !m.provides) { warnings.push(`${dir}: sa-pack.json needs "name" and "provides"`); return; }
    if (!satisfies(bv, m.base)) { warnings.push(`${m.name} ${m.version || ''} wants base ${m.base}; this base is ${bv} — skipped`); return; }
    if (choice.packs && !choice.packs.includes(m.name)) { if (!excluded.includes(m.name)) excluded.push(m.name); return; }
    if (packs.some((p) => p.name === m.name)) { warnings.push(`${m.name}: installed twice — the first found is used (${packs.find((p) => p.name === m.name).dir})`); return; }
    packs.push({ name: m.name, version: m.version || '', dir, manifest: m, source });
  });
  if (choice.packs) choice.packs.filter((n) => !packs.some((p) => p.name === n)).forEach((n) => warnings.push(`${n}: named in ${choice.file} and not installed for this project`));
  return { packs, warnings, excluded, declared: choice.packs, base: bv };
}

// record the project's packs: 'none' → [], 'all' → the key removed, else the names; the file's other keys are kept
function declarePacks(project, value) {
  const dir = path.join(path.resolve(project || process.cwd()), '.sa-skills'), f = path.join(dir, 'project.json'), j = read(f) || {};
  const v = String(value || '').trim();
  if (!v) throw new Error('--declare takes none, all or pack names separated by commas');
  if (v === 'all') delete j.packs; else j.packs = v === 'none' ? [] : v.split(',').map((x) => x.trim()).filter(Boolean);
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
  return { file: f, packs: j.packs === undefined ? null : j.packs };
}

// The folder in force for one kind of asset: the first pack that provides it (and whose folder proves it), else the base's own copy,
// else null. Skins are additive — see skinDirs.
function assetPath(kind, opts = {}) {
  const { packs, warnings } = findPacks(opts), probe = PROBE[kind];
  const hits = packs.map((p) => p.manifest.provides[KEY[kind]] ? { p, dir: path.resolve(p.dir, p.manifest.provides[KEY[kind]]) } : null).filter(Boolean)
    .filter(({ dir }) => fs.existsSync(probe ? path.join(dir, probe) : dir));
  if (hits.length > 1) warnings.push(`${kind}: provided by ${hits.map((h) => h.p.name).join(' and ')} — ${hits[0].p.name} is used`);
  if (hits.length) return { path: hits[0].dir, from: hits[0].p.name, warnings };
  const b = BUNDLED[kind];
  return b && fs.existsSync(probe ? path.join(b, probe) : b) ? { path: b, from: 'base', warnings } : { path: null, from: null, warnings };
}
const designLanguageDir = (opts) => assetPath('design-language', opts).path;
// every pack's skins folder, in the order found — the skin engine reads them between the plugin's and the project's
const additive = (key) => (opts = {}) => findPacks(opts).packs.filter((p) => p.manifest.provides[key]).map((p) => ({ name: p.name, dir: path.resolve(p.dir, p.manifest.provides[key]) })).filter((s) => fs.existsSync(s.dir));
const skinDirs = additive('skins');
// every pack's architecture-types folder, in the order found — arch-types.js reads one type per subfolder
const typeDirs = additive('architectureTypes');
// every pack's frameworks folder — frameworks.js reads one framework per subfolder; a pack's BIAN replaces the base's open corpus
const frameworkDirs = additive('frameworks');
// a pack's defaults, the first pack that states each key
const defaults = (opts = {}) => findPacks(opts).packs.reduce((d, p) => Object.assign({}, p.manifest.defaults || {}, d), {});

module.exports = { findPacks, declarePacks, assetPath, designLanguageDir, skinDirs, typeDirs, frameworkDirs, defaults, satisfies, BUNDLED };

if (require.main === module) {
  const a = process.argv.slice(2), opt = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const opts = { project: opt('--project') };
  if (a.includes('--declare')) {
    try { const r = declarePacks(opts.project, opt('--declare')); console.log(`${r.file}: packs ${r.packs === null ? 'every pack found' : r.packs.length ? r.packs.join(', ') : 'none'}`); process.exit(0); }
    catch (e) { console.error(e.message); process.exit(2); }
  }
  if (a.includes('--path')) {
    const kind = opt('--path');
    if (kind === 'skins' || kind === 'architecture-types' || kind === 'frameworks') { const s = ({ skins: skinDirs, 'architecture-types': typeDirs, frameworks: frameworkDirs })[kind](opts); s.forEach((x) => console.log(x.dir)); process.exit(s.length ? 0 : 1); }
    if (!KEY[kind]) { console.error('--path takes design-language, skins, architecture-types or frameworks'); process.exit(2); }
    const r = assetPath(kind, opts); r.warnings.forEach((w) => console.error('⚠ ' + w));
    if (r.path) { console.log(r.path); process.exit(0); } process.exit(1);
  }
  const f = findPacks(opts), view = { base: f.base, declared: f.declared, excluded: f.excluded, packs: f.packs.map((p) => ({ name: p.name, version: p.version, source: p.source, dir: p.dir, provides: Object.keys(p.manifest.provides), defaults: p.manifest.defaults || {} })), designLanguage: assetPath('design-language', opts), skins: skinDirs(opts), warnings: f.warnings };
  if (a.includes('--json')) { console.log(JSON.stringify(view, null, 2)); process.exit(0); }
  console.log(`sa-skills ${f.base} · ${f.packs.length ? f.packs.length + ' institution pack(s)' : 'no institution pack'}`);
  f.packs.forEach((p) => console.log(`  ${p.name} ${p.version} (${p.source}) — provides ${Object.keys(p.manifest.provides).join(', ')}`));
  if (f.declared) console.log(`  project packs:   ${f.declared.length ? f.declared.join(', ') : 'none'} (.sa-skills/project.json)${f.excluded.length ? ' — left out: ' + f.excluded.join(', ') : ''}`);
  console.log(`  design language: ${view.designLanguage.path ? view.designLanguage.from + ' — ' + view.designLanguage.path : 'none (fallback mode)'}`);
  const fw = frameworkDirs(opts); if (fw.length) console.log(`  frameworks: ${fw.map((s) => s.name).join(', ')}`);
  const td = typeDirs(opts); if (td.length) console.log(`  architecture types: ${td.map((s) => s.name).join(', ')}`);
  if (view.skins.length) console.log(`  skins:           ${view.skins.map((s) => s.name).join(', ')}`);
  f.warnings.forEach((w) => console.log('  ⚠ ' + w));
}
