#!/usr/bin/env bun
'use strict';
// Which analyses a change impacts — by code, no model. The facts ledger of a base revision (git archive of ARCHITECTURE.md,
// docs/, adr/, tdr/ at <base>) against the working tree's, each typed change mapped to the lenses that read it by one fixed
// table (IMPACT). Only the lenses this architecture already analyses — a report under analysis/ — are run: a lens never
// run here has no baseline to compare with, and starting one is the architect's call. A change of text alone impacts none.
//
//   bun analysis-impact.js <project> --base <git-ref> [--json]
//
// The verdict of the run is analysis-diff.js's; the CI workflow is architecture-analysis.yml (skills/architecture-lifecycle/ci).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');

const LENSES = ['spof', 'blast-radius', 'bottleneck', 'cost-hotspots', 'stride', 'vendor-lockin', 'latency-budget', 'tech-debt', 'coupling', 'data-sensitivity'];
const ALL = LENSES;
// what each kind of change impacts — the lenses that read it (their payloads: analysis-prepare.js)
const IMPACT = {
  'container-added': ALL, 'container-removed': ALL,
  'container-type': ['spof', 'blast-radius', 'bottleneck', 'coupling', 'cost-hotspots', 'stride', 'data-sensitivity'],
  'container-technology': ['vendor-lockin', 'tech-debt', 'cost-hotspots', 'stride'],
  'container-capacity': ['bottleneck', 'cost-hotspots', 'spof'],
  'system-added': ['stride', 'blast-radius', 'coupling', 'vendor-lockin', 'data-sensitivity'], 'system-removed': ['stride', 'blast-radius', 'coupling', 'vendor-lockin', 'data-sensitivity'],
  'integration-added': ['spof', 'blast-radius', 'coupling', 'bottleneck', 'latency-budget'], 'integration-removed': ['spof', 'blast-radius', 'coupling', 'bottleneck', 'latency-budget'],
  'integration-ends': ['spof', 'blast-radius', 'coupling', 'bottleneck', 'latency-budget'],
  'integration-protocol': ['coupling', 'latency-budget', 'bottleneck'],
  'integration-boundary': ['stride', 'data-sensitivity'],              // added on top when an end is outside the architecture
  'flow-added': ['latency-budget', 'bottleneck', 'blast-radius'], 'flow-removed': ['latency-budget', 'bottleneck', 'blast-radius'],
  'flow-phases': ['latency-budget', 'bottleneck', 'blast-radius'], 'flow-target': ['latency-budget'],
  'phase-hops': ['latency-budget', 'bottleneck', 'spof'], 'phase-budget': ['latency-budget'], 'phase-failure': ['spof', 'blast-radius'],
  'demand': ['bottleneck', 'cost-hotspots'],
  'tdr': ['tech-debt'],
  'section:Security Architecture': ['stride', 'data-sensitivity'],
  'section:Scalability & Performance': ['bottleneck', 'cost-hotspots', 'latency-budget'],
  'section:Operational Considerations': ['spof', 'cost-hotspots'],
  'section:Technology Stack': ['vendor-lockin', 'tech-debt', 'cost-hotspots'],
  'section:Risks and Technical Debt': ['tech-debt'],
  'section:Integration Points': ['coupling'],
};
const ARCH_PATHS = ['ARCHITECTURE.md', 'docs', 'adr', 'tdr'];

const git = (root, args, buffer) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: buffer ? null : 'utf8', maxBuffer: 256 * 1024 * 1024 }); return { ok: r.status === 0, out: buffer ? r.stdout : String(r.stdout || '').trim(), err: String(r.stderr || '').trim() }; };
const read = (p) => { try { return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n'); } catch { return null; } };

/** The base revision's architecture files, extracted outside the repository; null when the ref has none. */
function extractBase(root, ref) {
  if (!git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).ok) throw Object.assign(new Error(`no revision ${ref}`), { code: 2 });
  const prefix = git(root, ['rev-parse', '--show-prefix']).out.replace(/\/$/, '');
  const tree = prefix ? `${ref}:${prefix}` : `${ref}^{tree}`;
  const present = git(root, ['ls-tree', '--name-only', tree]).out.split('\n').filter((n) => ARCH_PATHS.includes(n));
  if (!present.includes('ARCHITECTURE.md')) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-impact-'));
  const ar = git(root, ['archive', '--format=tar', tree, '--', ...present], true);
  if (!ar.ok) throw new Error(`git archive ${ref}: ${ar.err}`);
  const x = spawnSync('tar', ['-x', '-C', dir], { input: ar.out });
  if (x.status !== 0) throw new Error(`tar: ${String(x.stderr || '')}`);
  return dir;
}

/** The section a docs file opens with: its first `<!-- SECTION: … -->` anchor. */
const sectionOf = (text) => ((text || '').match(/<!--\s*SECTION:\s*([^>]*?)\s*-->/) || [])[1] || null;
const by = (arr, k) => new Map((arr || []).map((x) => [x[k], x]));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Every typed change between two ledgers (and the docs files of two trees): [{ kind, what }]. */
function changesOf(base, cur, baseDir, root) {
  const out = [], add = (kind, what) => out.push({ kind, what });
  for (const lvl of ['L1', 'L2']) {
    const B = by(base.components.filter((c) => c.level === lvl), 'slug'), C = by(cur.components.filter((c) => c.level === lvl), 'slug');
    const noun = lvl === 'L1' ? 'system' : 'container';
    for (const [s, c] of C) {
      const b = B.get(s);
      if (!b) { add(`${noun}-added`, c.name); continue; }
      if (lvl === 'L2') {
        if (!same(b.type, c.type)) add('container-type', `${c.name}: ${b.type} → ${c.type}`);
        if (!same(b.technology, c.technology)) add('container-technology', `${c.name}: ${[].concat(b.technology || []).join(', ')} → ${[].concat(c.technology || []).join(', ')}`);
        if (!same(b.capacity, c.capacity)) add('container-capacity', c.name);
      }
    }
    for (const [s, b] of B) if (!C.has(s)) add(`${noun}-removed`, b.name);
  }
  const live = (l) => (l || []).filter((i) => !i.retired);
  const BI = by(live(base.integrations), 'id'), CI = by(live(cur.integrations), 'id');
  const outside = (i) => !!(i && i.boundary && !/^internal$/i.test(String(i.boundary).trim()));   // the cell as the document writes it
  for (const [id, c] of CI) {
    const b = BI.get(id), label = `${id} ${c.from} → ${c.to}`;
    if (!b) { add('integration-added', label); if (outside(c)) add('integration-boundary', label); continue; }
    let moved = false;
    if (b.from !== c.from || b.to !== c.to) { add('integration-ends', `${id}: ${b.from} → ${b.to} ⇒ ${c.from} → ${c.to}`); moved = true; }
    if (b.protocol !== c.protocol || b.pattern !== c.pattern) { add('integration-protocol', `${label}: ${b.protocol} → ${c.protocol}`); moved = true; }
    if (outside(b) !== outside(c)) moved = true;
    if (moved && (outside(b) || outside(c))) add('integration-boundary', label);
  }
  for (const [id, b] of BI) if (!CI.has(id)) { add('integration-removed', `${id} ${b.from} → ${b.to}`); if (outside(b)) add('integration-boundary', `${id} ${b.from} → ${b.to}`); }

  const BF = by(base.flows, 'code'), CF = by(cur.flows, 'code');
  for (const [k, c] of CF) {
    const b = BF.get(k);
    if (!b) { add('flow-added', `${k} ${c.name}`); continue; }
    if (!same(b.phases, c.phases)) add('flow-phases', `${k} ${c.name}`);
    if (!same(b.latency_target, c.latency_target)) add('flow-target', `${k} ${c.name}: ${b.latency_target} → ${c.latency_target}`);
  }
  for (const [k, b] of BF) if (!CF.has(k)) add('flow-removed', `${k} ${b.name}`);
  const BP = by(base.phases, 'n'), CP = by(cur.phases, 'n');
  for (const [k, c] of CP) {
    const b = BP.get(k);
    if (!b) continue;                                                           // a new phase moves a flow's phases
    if (!same(b.hops, c.hops) || !same(b.owner_chain, c.owner_chain)) add('phase-hops', `${k} ${c.name}`);
    if (!same(b.latency_budget, c.latency_budget)) add('phase-budget', `${k} ${c.name}: ${b.latency_budget} → ${c.latency_budget}`);
    if (!same(b.failure_mode, c.failure_mode)) add('phase-failure', `${k} ${c.name}`);
  }
  if (!same(base.demand, cur.demand)) add('demand', 'docs/08 demand by use case');
  const BT = by(base.tdrs, 'id'), CT = by(cur.tdrs, 'id');
  for (const [id, c] of CT) { const b = BT.get(id); if (!b || b.status !== c.status) add('tdr', `${id}${b ? `: ${b.status} → ${c.status}` : ' added'}`); }
  for (const [id] of BT) if (!CT.has(id)) add('tdr', `${id} removed`);

  // a section file whose text moved: its section anchor names the lenses that read it
  const docs = (dir) => { try { return fs.readdirSync(path.join(dir, 'docs')).filter((f) => /^\d\d-.*\.md$/.test(f)); } catch { return []; } };
  for (const f of new Set([...docs(baseDir), ...docs(root)])) {
    const a = read(path.join(baseDir, 'docs', f)), b = read(path.join(root, 'docs', f));
    if (a === b) continue;
    const s = sectionOf(b) || sectionOf(a);
    if (s && IMPACT[`section:${s}`]) add(`section:${s}`, `docs/${f}`);
  }
  return out;
}

/** The lenses this architecture analyses: one report or more under analysis/ (archive/ left out). */
function analysed(root) {
  let files = [];
  try { files = fs.readdirSync(path.join(root, 'analysis')).filter((f) => /\.(md|html)$/i.test(f)); } catch { return []; }
  const have = new Set(files.map((f) => f.replace(/-\d{4}-\d{2}-\d{2}.*$/, '').replace(/\.(md|html)$/i, '').toLowerCase()));
  return LENSES.filter((l) => have.has(l));
}

/** The impact of the working tree against `ref`: the changes, each lens with its reasons, what runs and what is skipped. */
function impact(root, ref) {
  root = path.resolve(root);
  const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));
  const baseDir = extractBase(root, ref);
  try {
    const cur = collect(root);
    const base = baseDir ? collect(baseDir) : { components: [], integrations: [], flows: [], phases: [], tdrs: [], demand: null };
    const changes = baseDir ? changesOf(base, cur, baseDir, root) : [{ kind: 'container-added', what: 'the whole architecture (no ARCHITECTURE.md at the base)' }];
    const reasons = {};
    for (const c of changes) for (const l of IMPACT[c.kind] || []) (reasons[l] = reasons[l] || []).push(`${c.kind}: ${c.what}`);
    const impacted = LENSES.filter((l) => reasons[l]), have = analysed(root);
    return { base: ref, changes, impacted, run: impacted.filter((l) => have.includes(l)), skipped: impacted.filter((l) => !have.includes(l)), reasons };
  } finally { if (baseDir) fs.rmSync(baseDir, { recursive: true, force: true }); }
}

module.exports = { impact, changesOf, analysed, sectionOf, IMPACT, LENSES };

if (require.main === module) {
  const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const root = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--base'), ref = opt('--base');
  if (!root || !ref) { console.error('usage: bun analysis-impact.js <project> --base <git-ref> [--json]'); process.exit(2); }
  try {
    const r = impact(root, ref);
    if (argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
    console.log(`analysis impact against ${ref}: ${r.changes.length} change(s)`);
    r.changes.forEach((c) => console.log(`  ${c.kind} — ${c.what}`));
    console.log(r.run.length ? `run: ${r.run.join(', ')}` : 'run: none — no analysis of this architecture reads what changed');
    for (const l of r.run) console.log(`  ${l}: ${r.reasons[l].slice(0, 3).join(' · ')}${r.reasons[l].length > 3 ? ` · +${r.reasons[l].length - 3}` : ''}`);
    if (r.skipped.length) console.log(`impacted, not analysed here (no report under analysis/): ${r.skipped.join(', ')}`);
  } catch (e) { console.error(`analysis-impact: ${e.message}`); process.exit(e.code || 1); }
}
