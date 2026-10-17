#!/usr/bin/env node
// lifecycle.js — the lifecycle of an architecture as code: where it stands, whether it can be released, what changed
// since the last release, and the release itself.
//
//   bun lifecycle.js status    <project-root> [--json]
//   bun lifecycle.js check     <project-root> [--no-render] [--waive <gate>:<reason>]… [--json]
//   bun lifecycle.js plan      <project-root> [--increment <id>] [--no-render] [--waive <gate>:<reason>]… [--json]
//   bun lifecycle.js apply     <project-root> [--bump major|minor|patch] [--direct] [--no-push]
//                                             [--waive <gate>:<reason>]… [--json]
//   bun lifecycle.js recover   <project-root> [--no-push] [--json]
//   bun lifecycle.js deprecate <project-root> [--by <note>] [--json]
//   (every subcommand takes --today YYYY-MM-DD)
//
// A release is a git tag: the project must be in a git repository (`status` says `no-git` otherwise, and `plan` /
// `apply` refuse). The state is derived, never stored. The baseline of version N is the annotated tag
// `architecture-vN`; the facts ledger (`arch-facts.js`) is collected over the tag's tree and over the working tree, and
// the difference is the change list:
//   no-git      the project is not in a git repository — nothing can be released
//   draft       no release yet — ARCHITECTURE_STATUS is Draft and no tag exists
//   released    the working tree matches the baseline of the version it declares
//   changed     it differs, or `[Unreleased]` carries lines — a release is due
//   untagged    the document says Released, the repository is under git, and the tag is missing (`recover`)
//   deprecated  ARCHITECTURE_STATUS is Deprecated (`deprecate`)
// The version in ARCHITECTURE.md stays the last released one until the next release; edits write no marker.
//
// `check` runs every gate the architecture already has, once, and says which block. `plan` runs `check`, computes the
// change list with a recommended bump (BUMP_RULES below), and writes `.cache/sa-skills/lifecycle/plan.json` and
// `entry.md` — the changelog entry, which the session may polish (a description per line) before `apply`. `apply`
// refuses a plan the architecture has moved past, then writes the metadata, the changelog and the command-center
// refresh, and publishes: PR mode (default) on `release/architecture-v{version}`, `--direct` on the current branch;
// with no `origin` remote, direct and local. It commits only the architecture's paths, so the tag holds exactly
// what the change list describes. Downstream artifacts are reported stale by their own version stamps — compliance
// is never read (CLAUDE.md § Compliance is isolated).
//
// Delivered in pieces (8.139.0): the target design stays one; a `Delivery Increments` table in docs/01 assigns its use
// cases to increments and `scripts/shared/increments.js` derives each one's slice. `status` lists them with the release
// that carried each; `plan --increment <id>` adds the `increment` gate (every use case of the piece served by a flow,
// every flow with its phases) and writes the delivery scope into the entry and the tag.
// With `--increment`, a gate that says where its findings are (prose, headers, components, flows, integrations, budgets)
// blocks only on the ones inside the increment's slice (8.142.0, `scopeOf`); the rest print, as a warning.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const PLUGIN = path.resolve(__dirname, '..', '..', '..');
const P = (...p) => path.join(PLUGIN, ...p);
const { collect } = require(P('scripts', 'shared', 'arch-facts.js'));
const increments = require(P('scripts', 'shared', 'increments.js'));
const { readReview } = require(P('skills', 'architecture-docs', 'scripts', 'principle-check.js'));
const { rotate } = require(P('skills', 'architecture-docs', 'scripts', 'changelog-rotate.js'));
const escalate = require(P('scripts', 'shared', 'escalate.js'));

const ARCH_PATHS = ['ARCHITECTURE.md', 'docs', 'adr', 'tdr'];
const TAG = (v) => `architecture-v${v}`;
const RANK = { patch: 1, minor: 2, major: 3 };

// ---- helpers
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const marker = (src, k) => (src.match(new RegExp('<!--\\s*' + k + ':\\s*([^>]*?)\\s*-->')) || [])[1] || null;
const cmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
const bumpVersion = (v, kind) => { const [a, b, c] = String(v).split('.').map(Number); return kind === 'major' ? `${a + 1}.0.0` : kind === 'minor' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`; };
function git(root, args, opts = {}) {
  const r = spawnSync('git', ['-C', root, ...args], { encoding: opts.buffer ? 'buffer' : 'utf8', input: opts.input, maxBuffer: 512 * 1024 * 1024 });
  return { ok: r.status === 0, out: opts.buffer ? r.stdout : String(r.stdout || '').trim(), err: String(r.stderr || '').trim() };
}
const isGit = (root) => git(root, ['rev-parse', '--is-inside-work-tree']).ok;
const origin = (root) => { const r = git(root, ['remote', 'get-url', 'origin']); return r.ok ? r.out : null; };
const walk = (dir) => !exists(dir) ? [] : fs.statSync(dir).isFile() ? [dir] : fs.readdirSync(dir).sort().flatMap((n) => walk(path.join(dir, n)));
const mdFiles = (root) => ARCH_PATHS.flatMap((p) => walk(path.join(root, p))).filter((f) => f.endsWith('.md')).map((f) => path.relative(root, f).split(path.sep).join('/'));
const hashes = (root) => Object.fromEntries(mdFiles(root).map((f) => [f, sha(read(path.join(root, f)))]));
const fingerprint = (root) => sha(Object.entries(hashes(root)).map(([f, h]) => `${f} ${h}`).join('\n')).slice(0, 16);

// ---- the changelog
function changelog(root) {
  const file = path.join(root, 'docs', 'CHANGELOG.md');
  const src = exists(file) ? read(file) : '';
  const parts = src.split(/^(?=## \[)/m);
  const header = /^## \[/.test(parts[0] || '') ? '' : parts[0] || '';
  const entries = parts.filter((p) => /^## \[/.test(p)).map((text) => ({ version: (text.match(/^## \[([^\]]+)\]/) || [])[1], heading: text.split('\n')[0], body: text.split('\n').slice(1).join('\n').trim(), text }));
  const unreleased = entries.find((e) => /^unreleased$/i.test(e.version));
  return { file, src, header, entries, unreleased, lines: unreleased ? (unreleased.body.match(/^- .+$/gm) || []) : [] };
}
// `### Added` blocks of an entry body → { Added: [lines] }
function sectionsOf(body) {
  const out = {}; let cur = null;
  for (const l of String(body || '').split('\n')) { const h = l.match(/^###\s+(.+?)\s*$/); if (h) { cur = h[1]; out[cur] = out[cur] || []; continue; } if (cur && /^- /.test(l)) out[cur].push(l); }
  return out;
}
const ORDER = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
const renderSections = (s) => Object.keys(s).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99)).filter((k) => s[k].length).map((k) => `### ${k}\n${s[k].join('\n')}`).join('\n\n');

// ---- the baseline: the facts ledger of the released version, read from its tag's tree
function baseline(root, version) {
  if (!version || !isGit(root)) return { kind: 'none' };
  const tag = TAG(version);
  if (!git(root, ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`]).ok) return { kind: 'none', tag };
  const dir = path.join(root, '.cache', 'sa-skills', 'lifecycle', 'baseline', version);
  if (!exists(path.join(dir, '.done'))) {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const prefix = git(root, ['rev-parse', '--show-prefix']).out.replace(/\/$/, '');
    const tree = prefix ? `${tag}:${prefix}` : `${tag}^{tree}`;
    const present = git(root, ['ls-tree', '--name-only', tree]).out.split('\n').filter((n) => ARCH_PATHS.includes(n));
    if (present.length) {
      const ar = git(root, ['archive', '--format=tar', tree, '--', ...present], { buffer: true });
      if (!ar.ok) return { kind: 'none', tag, error: ar.err };
      const x = spawnSync('tar', ['-x', '-C', dir], { input: ar.out });
      if (x.status !== 0) return { kind: 'none', tag, error: String(x.stderr || 'tar failed') };
    }
    fs.writeFileSync(path.join(dir, '.done'), tag + '\n');
  }
  return { kind: 'tag', ref: tag, dir };
}

// ---- the change list
const WORDS = {
  en: { system: 'System', container: 'Container', adr: 'ADR', tdr: 'TDR', integration: 'Integration', flow: 'Flow', phase: 'Phase', layer: 'Layer', section: 'Section', type: 'Architecture type', content: 'content', status: 'status', technology: 'technology', ctype: 'C4 type', name: 'name', retired: 'retired', phases: 'phases', route: 'route', protocol: 'protocol', increment: 'Delivery increment', window: 'delivery window', use_cases: 'use cases', target: 'target', scope: 'Delivery scope', inc: 'increment', containers: 'containers', integrations: 'integrations', new_: 'new' },
  es: { system: 'Sistema', container: 'Contenedor', adr: 'ADR', tdr: 'TDR', integration: 'Integración', flow: 'Flujo', phase: 'Fase', layer: 'Capa', section: 'Sección', type: 'Tipo de arquitectura', content: 'contenido', status: 'estado', technology: 'tecnología', ctype: 'tipo C4', name: 'nombre', retired: 'retirada', phases: 'fases', route: 'ruta', protocol: 'protocolo', increment: 'Incremento de entrega', window: 'ventana de entrega', use_cases: 'casos de uso', target: 'objetivo', scope: 'Alcance de entrega', inc: 'incremento', containers: 'contenedores', integrations: 'integraciones', new_: 'nuevos' },
};
// BUMP_RULES — MAJOR: something a consumer relied on is gone or the structure changed (a system added or removed, a
// container, integration or flow removed, the architecture type changed). MINOR: something new or a decision moved
// (anything added, a container's name / type / technology, an integration's route, a flow's phases, an ADR's status).
// PATCH: the text changed and the structure did not.
function delta(base, cur, baseDir, root) {
  const w = WORDS[cur.architecture.language] || WORDS.en; const items = [];
  const add = (section, bump, text) => items.push({ section, bump, text });
  const by = (arr, k) => Object.fromEntries((arr || []).map((x) => [x[k], x]));
  const fileChanged = (rel) => rel && exists(path.join(baseDir, rel)) && exists(path.join(root, rel)) && sha(read(path.join(baseDir, rel))) !== sha(read(path.join(root, rel)));
  const diffs = (a, b, keys) => keys.filter(([k]) => JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null)).map(([k, label]) => `${label}: ${fmt(a[k])} → ${fmt(b[k])}`);
  const fmt = (v) => Array.isArray(v) ? (v.join(', ') || '—') : (v == null || v === '' ? '—' : String(v));

  if (base.architecture.type && cur.architecture.type && base.architecture.type !== cur.architecture.type) add('Changed', 'major', `${w.type}: ${base.architecture.type} → ${cur.architecture.type}`);

  const comps = (f, lvl) => by(f.components.filter((c) => c.level === lvl), 'slug');
  for (const [lvl, label, addBump, delBump] of [['L1', w.system, 'major', 'major'], ['L2', w.container, 'minor', 'major']]) {
    const B = comps(base, lvl), C = comps(cur, lvl);
    for (const [s, c] of Object.entries(C)) {
      const b = B[s];
      if (!b) { add('Added', addBump, `${label}: ${c.name} (\`${s}\`)`); continue; }
      const d = diffs(b, c, [['name', w.name], ['type', w.ctype], ['technology', w.technology], ['delivery', w.window]]);
      if (d.length) add('Changed', 'minor', `${label}: ${c.name} — ${d.join('; ')}`);
      else if (c.file_backed && fileChanged(c.file)) add('Changed', 'patch', `${label}: ${c.name} — ${w.content}`);
    }
    for (const [s, b] of Object.entries(B)) if (!C[s]) add('Removed', delBump, `${label}: ${b.name} (\`${s}\`)`);
  }

  const BA = by(base.adrs, 'id'), CA = by(cur.adrs, 'id');
  for (const [id, a] of Object.entries(CA)) {
    const b = BA[id];
    if (!b) add('Added', 'minor', `${w.adr}: ${id} — ${a.title}${a.status ? ` (${a.status})` : ''}`);
    else if ((b.status || '') !== (a.status || '')) add(/deprecat/i.test(a.status || '') ? 'Deprecated' : 'Changed', 'minor', `${w.adr}: ${id} — ${w.status}: ${fmt(b.status)} → ${fmt(a.status)}`);
    else if (fileChanged(a.file)) add('Changed', 'patch', `${w.adr}: ${id} — ${w.content}`);
  }
  for (const [id, b] of Object.entries(BA)) if (!CA[id]) add('Removed', 'minor', `${w.adr}: ${id} — ${b.title}`);

  const BT = by(base.tdrs, 'id'), CT = by(cur.tdrs, 'id');
  for (const [id, t] of Object.entries(CT)) {
    const b = BT[id];
    if (!b) add('Added', 'minor', `${w.tdr}: ${id} — ${t.title}${t.status ? ` (${t.status})` : ''}`);
    else if ((b.status || '') !== (t.status || '')) add('Changed', 'patch', `${w.tdr}: ${id} — ${w.status}: ${fmt(b.status)} → ${fmt(t.status)}`);
  }
  for (const [id, b] of Object.entries(BT)) if (!CT[id]) add('Removed', 'patch', `${w.tdr}: ${id} — ${b.title}`);

  const BI = by(base.integrations, 'id'), CI = by(cur.integrations, 'id');
  for (const [id, i] of Object.entries(CI)) {
    const b = BI[id]; const route = `${i.from} → ${i.to}`;
    if (!b) { if (!i.retired) add('Added', 'minor', `${w.integration}: ${id} — ${route}`); continue; }
    if (i.retired && !b.retired) { add('Removed', 'major', `${w.integration}: ${id} — ${route} (${w.retired})`); continue; }
    const d = diffs(b, i, [['from', w.route], ['to', w.route], ['protocol', w.protocol], ['pattern', 'pattern'], ['delivery', w.window]]);
    if (d.length) add('Changed', 'minor', `${w.integration}: ${id} — ${[...new Set(d)].join('; ')}`);
  }
  for (const [id, b] of Object.entries(BI)) if (!CI[id] && !b.retired) add('Removed', 'major', `${w.integration}: ${id} — ${b.from} → ${b.to}`);

  const BF = by(base.flows, 'code'), CF = by(cur.flows, 'code');
  for (const [code, f] of Object.entries(CF)) {
    const b = BF[code];
    if (!b) { add('Added', 'minor', `${w.flow}: ${code}. ${f.name}`); continue; }
    const d = diffs(b, f, [['name', w.name], ['phases', w.phases]]);
    if (d.length) add('Changed', 'minor', `${w.flow}: ${code}. ${f.name} — ${d.join('; ')}`);
  }
  for (const [code, b] of Object.entries(BF)) if (!CF[code]) add('Removed', 'major', `${w.flow}: ${code}. ${b.name}`);

  const BP = by(base.phases, 'n'), CP = by(cur.phases, 'n');
  for (const [n, p] of Object.entries(CP)) if (!BP[n]) add('Added', 'minor', `${w.phase}: ${n}. ${p.name}`);
  for (const [n, b] of Object.entries(BP)) if (!CP[n]) add('Removed', 'minor', `${w.phase}: ${n}. ${b.name}`);

  // delivery increments: a piece added or its use cases moved is a decision (MINOR); a new target date is text
  const BN = by(base.increments, 'id'), CN = by(cur.increments, 'id');
  for (const [id, n] of Object.entries(CN)) {
    const b = BN[id];
    if (!b) { add('Added', 'minor', `${w.increment} ${id}: ${n.use_cases.join(', ')}`); continue; }
    if (JSON.stringify(b.use_cases) !== JSON.stringify(n.use_cases)) add('Changed', 'minor', `${w.increment} ${id} — ${w.use_cases}: ${fmt(b.use_cases)} → ${fmt(n.use_cases)}`);
    else if ((b.target || '') !== (n.target || '')) add('Changed', 'patch', `${w.increment} ${id} — ${w.target}: ${fmt(b.target)} → ${fmt(n.target)}`);
  }
  for (const [id, b] of Object.entries(BN)) if (!CN[id]) add('Removed', 'minor', `${w.increment} ${id}: ${b.use_cases.join(', ')}`);

  const BL = by(base.layers, 'name'), CL = by(cur.layers, 'name');
  for (const n of Object.keys(CL)) if (!BL[n]) add('Added', 'minor', `${w.layer}: ${n}`);
  for (const n of Object.keys(BL)) if (!CL[n]) add('Removed', 'minor', `${w.layer}: ${n}`);

  const BD = by(base.docs, 'file'), CD = by(cur.docs, 'file');
  for (const [f, d] of Object.entries(CD)) {
    if (!BD[f]) add('Added', 'minor', `${w.section}: ${d.title} (\`${f}\`)`);
    else if (fileChanged(f)) add('Changed', 'patch', `${w.section}: ${d.title} (\`${f}\`)`);
  }
  for (const [f, d] of Object.entries(BD)) if (!CD[f]) add('Removed', 'major', `${w.section}: ${d.title} (\`${f}\`)`);
  if (fileChanged('ARCHITECTURE.md') && !items.length) add('Changed', 'patch', `ARCHITECTURE.md — ${w.content}`);
  return items;
}
const recommend = (items) => items.reduce((m, i) => (RANK[i.bump] > RANK[m] ? i.bump : m), 'patch');

// ---- an increment's scope (8.142.0): where a gate's finding sits, and whether the increment ships it. A component file is
// its component's; a docs/05 line or I-nn id its integration's; a docs/04 line the Flow / Phase heading above it; a
// flow-check flow its own. Everything else — section files, principles, ADRs, TDRs, the indexes — is the whole design's,
// in every increment's scope. A finding in an element no increment up to this one needs never blocks its release.
function scopeOf(root, facts, piece) {
  const inC = new Set(piece.containers.concat(piece.systems)), inI = new Set(piece.integrations), inP = new Set(piece.phases);
  const inF = new Set(facts.flows.filter((f) => f.use_cases.some((u) => piece.cumulative_use_cases.includes(u))).map((f) => f.code));
  const known = new Set(facts.integrations.map((i) => i.id)), cache = {};
  const lines = (file) => cache[file] || (cache[file] = exists(path.join(root, file)) ? read(path.join(root, file)).split('\n') : []);
  const headingAbove = (file, line) => { const L = lines(file); for (let i = Math.min(line, L.length) - 1; i >= 0; i--) if (/^#{1,6}\s/.test(L[i])) return L[i]; return ''; };
  return (f) => {
    if (f.flow) return inF.has(f.flow) || !facts.flows.some((x) => x.code === f.flow);
    const c = f.file && facts.components.find((x) => x.file === f.file);
    if (c) return inC.has(c.slug);
    if (/^docs\/05-/.test(f.file || '')) {
      const at = f.line ? (lines(f.file)[f.line - 1] || '') : '';
      const own = `${f.id || ''} ${f.where || ''} ${(at.match(/^\s*\|\s*~*(I-\d+)/i) || [])[1] || (f.line ? (headingAbove(f.file, f.line).match(/^#{2,6}\s+(I-\d+)/i) || [])[1] || '' : '')}`;
      const ids = (own.match(/I-\d+/gi) || []).map((x) => x.toUpperCase()).filter((x) => known.has(x));
      return !ids.length || ids.some((x) => inI.has(x));
    }
    if (/^docs\/04-/.test(f.file || '') && f.line) {
      const m = headingAbove(f.file, f.line).match(/^#{2,6}\s+(Flow|Flujo|Phase|Fase)\s+(\d+[a-z]?)\b/i);
      return !m || (/^(flow|flujo)$/i.test(m[1]) ? inF.has(m[2]) : inP.has(m[2]));
    }
    return true;
  };
}
// the blocking findings of a failed gate, each with where it sits — only for the gates that say where
const LOCATE = {
  prose: { json: true, list: (j) => (j.findings || []).filter((f) => f.severity === 'BLOCKING').map((f) => ({ file: f.file, line: f.line, text: `${f.ruleId} ${f.file}:${f.line}` })) },
  headers: { json: true, list: (j) => (j.findings || []).filter((f) => f.severity === 'error').map((f) => ({ file: f.file, text: `${f.rule} ${f.file}` })) },
  components: { list: (out) => out.split('\n').map((l) => l.match(/^\s+(\S+?\.md):\s+(.+)$/)).filter(Boolean).map((m) => ({ file: m[1], text: `${m[1]}: ${m[2]}` })) },
  flows: { json: true, list: (j) => (j.flows || []).flatMap((fl) => (fl.findings || []).map((f) => ({ flow: String(fl.code).replace(/^F-?0*(?=\d)/i, ''), text: `flow ${fl.code} ${f.rule}` }))).concat((j.phaseFindings || []).map((f) => ({ file: j.file, line: f.line, text: `${f.rule} ${j.file}:${f.line}` }))) },
  integrations: { json: true, list: (j) => (j.findings || []).filter((f) => f.level === 'BLOCKING').map((f) => ({ file: f.file, line: f.line, id: f.id, text: `${f.check} ${f.id || f.file}` })) },
  budgets: { json: true, list: (j) => (j.findings || []).filter((f) => f.severity === 'BLOCKING').map((f) => ({ file: f.file, where: f.where, text: `${f.rule} ${f.file}${f.where ? ' · ' + f.where : ''}` })) },
};

// ---- the gates: every check the architecture already has, run once
function gates(root, facts, opts = {}) {
  const docs = (p) => { try { const f = fs.readdirSync(path.join(root, 'docs')).find((n) => n.startsWith(p) && n.endsWith('.md')); return f ? path.join(root, 'docs', f) : null; } catch { return null; } };
  const d02 = docs('02-'), d03 = docs('03-'), d04 = docs('04-'), d05 = docs('05-');
  const diagramFiles = [d03, d04].filter(Boolean);
  const tdrCheck = P('plugins', 'sa-records', 'skills', 'technical-debt-records', 'scripts', 'tdr-check.js');
  const adrIndex = P('plugins', 'sa-records', 'skills', 'architecture-definition-record', 'scripts', 'adr-index.js');
  const sl = opts.increment ? increments.slices(facts) : null;
  const piece = sl ? sl.increments.find((x) => x.id === String(opts.increment)) : null;
  const inScope = piece ? scopeOf(root, facts, piece) : null;
  const list = [
    { id: 'increment', when: !!opts.increment, fn: () => {   // the piece being delivered: every use case served, every flow composed
      const s = sl.increments.find((x) => x.id === String(opts.increment));
      if (!s) return { status: 'fail', summary: sl.increments.length ? `no increment "${opts.increment}" — declared: ${sl.increments.map((x) => x.id).join(', ')}` : 'no Delivery Increments table in docs/', fix: 'declare it: docs/01 § Delivery Increments (`<!-- LABEL: Delivery Increments -->`, Increment | Use Cases | Target)' };
      const errs = s.gaps.filter((g) => g.severity !== 'warning').concat(sl.duplicates.map((d) => ({ text: d })), sl.temporary_gaps);
      if (errs.length) return { status: 'fail', summary: errs.map((g) => g.text).join(' · ').slice(0, 400), fix: errs.some((g) => g.rule === 'retire-pending') ? 'retire the temporary elements named (strike the docs/05 row; remove component via architecture-component-guardian) and resolve their TDRs' : errs.some((g) => /window-unknown|temporary-no-tdr/.test(g.rule || '')) ? 'fix the temporary element\'s window (`**Delivery Increments:** 1–2 · TDR-NNN`, or the docs/05 Increments cell) and cite an existing TDR' : 'complete docs/04 for the increment\'s use cases (Flow Inventory row, **Phases** line, Phase Catalog), or move the use case to a later increment' };
      return { status: s.gaps.length ? 'warn' : 'pass', summary: `increment ${s.id}: ${s.use_cases.join(', ')} · ${s.containers.length} containers (${s.new.containers.length} new) · ${s.integrations.length} integrations (${s.new.integrations.length} new)${s.gaps.length ? ' · ' + s.gaps.map((g) => g.text).join(' · ') : ''}` };
    } },
    { id: 'principles', when: !!d02, cmd: [P('skills', 'architecture-docs', 'scripts', 'principle-check.js'), root] },
    { id: 'principle-review', when: !!d02, fn: () => {
      const r = readReview(d02);
      if (r.state === 'current') return { status: r.layer2 === 'PASS' ? 'pass' : 'warn', summary: `Layer 2 ${r.layer2} on ${r.date}, principles unchanged since` };
      return { status: 'fail', summary: r.state === 'stale' ? `Layer 2 stamp of ${r.date} no longer matches the principles — they changed after the review` : 'no Layer 2 stamp — the semantic review was never recorded', fix: 'run the Section 3 Enforcement Gate (EDIT_WORKFLOW.md), then principle-check.js --stamp-review PASS|WARNING' };
    } },
    { id: 'prose', cmd: [P('skills', 'architecture-docs', 'scripts', 'prose-check.js'), root, '--scope', 'release'], fix: '/restyle-architecture, or <!-- PROSE_STYLE_WAIVED: <reason> --> in ARCHITECTURE.md' },
    { id: 'headers', cmd: [P('scripts', 'shared', 'explorer-cli.ts'), 'check', root] },
    { id: 'components', when: exists(path.join(root, 'docs', 'components')), cmd: [P('skills', 'architecture-component-guardian', 'utils', 'component-cli.ts'), 'check', root], fix: 'sync component index (architecture-component-guardian)' },
    { id: 'sequences', when: !!d04, cmd: [P('skills', 'architecture-docs', 'scripts', 'flow-compose.js'), root, '--check'], passIf: /nothing to derive/, fix: 'bun flow-compose.js <root> (derives § End-to-End Wire Sequences)' },   // a docs/04 in the single-flow layout has nothing to derive: not a defect
    { id: 'flows', when: !!d04, cmd: [P('scripts', 'shared', 'flow-check.js'), root] },
    { id: 'diagrams', when: diagramFiles.length > 0, cmd: [P('scripts', 'shared', 'mermaid-check.js'), ...diagramFiles, ...(opts.noRender ? ['--no-render'] : [])] },
    { id: 'labels', when: diagramFiles.length > 0, cmd: [P('skills', 'architecture-docs', 'scripts', 'label-check.js'), ...diagramFiles] },
    { id: 'integrations', when: !!d05, cmd: [P('skills', 'architecture-docs', 'scripts', 'integration-check.js'), root] },
    { id: 'budgets', cmd: [P('skills', 'architecture-docs', 'scripts', 'docs-stats.js'), root] },
    { id: 'tdrs', when: exists(path.join(root, 'tdr')) && exists(tdrCheck), cmd: [tdrCheck, root] },   // optional: technical-debt-records
    { id: 'adr-index', when: exists(path.join(root, 'adr')) && exists(adrIndex), fn: () => {   // optional: architecture-definition-record
      const r = spawnSync('bun', [adrIndex, root], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const disk = exists(path.join(root, 'adr', 'README.md')) ? read(path.join(root, 'adr', 'README.md')) : '';
      if (r.status !== 0) return { status: 'fail', summary: (r.stderr || '').trim().split('\n').pop() };
      return String(r.stdout).trim() === disk.trim() ? { status: 'pass', summary: 'adr/README.md matches the records' } : { status: 'fail', summary: 'adr/README.md is not the index of the records on disk', fix: 'sync ADR index (architecture-definition-record Workflow 7)' };
    } },
  ];
  const waived = Object.fromEntries((opts.waive || []).map((x) => { const i = x.indexOf(':'); return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : [x.trim(), '']; }));
  return list.filter((g) => g.when !== false).map((g) => {
    let r;
    if (g.fn) r = g.fn();
    else {
      const x = spawnSync('bun', g.cmd, { cwd: root, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
      const out = `${x.stdout || ''}\n${x.stderr || ''}`;
      const tail = out.split('\n').map((l) => l.trim()).filter(Boolean).slice(-3).join(' · ').slice(0, 400);
      const pending = /\.worksheet\.md/.test(out) && /(pending|undecided|answer)/i.test(out);
      r = { status: x.status === 0 || (g.passIf && g.passIf.test(out)) ? 'pass' : 'fail', summary: tail, exit: x.status, pending, command: `bun ${g.cmd.join(' ')}` };
      // an increment's release: a failure whose every blocking finding sits outside the increment is a warning
      const loc = LOCATE[g.id];
      if (r.status === 'fail' && inScope && loc && !pending) {
        let list = null;
        try { list = loc.json ? loc.list(JSON.parse(spawnSync('bun', [...g.cmd, '--json'], { cwd: root, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 }).stdout)) : loc.list(out); } catch { list = null; }
        if (list && list.length) {
          const inn = list.filter(inScope), outside = list.length - inn.length, few = (xs) => xs.slice(0, 3).map((f) => f.text).join(' · ') + (xs.length > 3 ? ` · +${xs.length - 3}` : '');
          if (!inn.length) Object.assign(r, { status: 'warn', summary: `${outside} blocking finding(s), none in increment ${piece.id} — ${few(list)}`, outside });
          else if (outside) Object.assign(r, { summary: `${inn.length} in increment ${piece.id} (${outside} outside it, not blocking) — ${few(inn)}`, outside });
        }
      }
    }
    r = Object.assign({ id: g.id, fix: g.fix }, r);
    if (r.status === 'fail' && waived[g.id] !== undefined) Object.assign(r, { status: 'waived', reason: waived[g.id] || 'no reason given' });
    return r;
  });
}
const blocking = (gs) => gs.filter((g) => g.status === 'fail');

// ---- downstream: every artifact that carries the version it was built from (compliance is never read)
function downstream(root, version, released) {
  const out = []; const push = (artifact, file, v, command) => { if (file) out.push({ artifact, file, version: v || null, stale: !v || cmp(v, version) < 0, command }); };
  const spec = path.join(root, 'PRODUCT_OWNER_SPEC.md');
  if (exists(spec)) push('PO Spec', 'PRODUCT_OWNER_SPEC.md', (read(spec).match(/<!--\s*ARCHITECTURE_SYNC:\s*v?([0-9][^\s(]*)/) || [])[1], 'update the PO spec');
  const man = path.join(root, 'handoffs', '.manifest.json');
  if (exists(man)) { try { const m = JSON.parse(read(man)); const vs = Object.values(m.cut_sheets || {}).map((e) => e.architecture_version).filter(Boolean).sort(cmp); push('Handoff kit', 'handoffs/', vs[0], 'generate dev handoff, then commit handoffs/ — an architecture index publishes build packs only for a kit of this version'); } catch { /* unreadable manifest */ } }
  const tr = path.join(root, 'TRACEABILITY_REPORT.md');
  if (exists(tr)) push('Traceability report', 'TRACEABILITY_REPORT.md', (read(tr).match(/\*\*Architecture Version\*\*:\s*v?([0-9][\w.]*)/) || [])[1], 'check requirements coverage');
  const an = path.join(root, 'analysis');
  if (exists(an)) {
    const newest = {};
    fs.readdirSync(an).filter((n) => /^[A-Z][A-Z0-9-]+-\d{4}-\d{2}-\d{2}\.(md|html)$/.test(n)).sort().forEach((n) => { newest[n.replace(/-\d{4}-\d{2}-\d{2}\.(md|html)$/, '')] = n; });
    Object.entries(newest).forEach(([lens, n]) => push(`Analysis ${lens}`, `analysis/${n}`, (read(path.join(an, n)).match(/ARCHITECTURE\.md`?\s+v([0-9][\w.]*)/) || [])[1], 'run architecture analysis'));
  }
  const viz = path.join(root, 'visualizations');
  if (exists(viz)) { const s = fs.readdirSync(viz).filter((n) => n.endsWith('.scene.json')).sort().pop(); if (s) { let v = null; try { v = JSON.parse(read(path.join(viz, s))).version; } catch { /* unreadable */ } push('Command center', `visualizations/${s}`, v, 'command center'); } }
  const ex = path.join(root, 'exports');
  if (exists(ex) && released) fs.readdirSync(ex).filter((n) => /^SA-.*\.docx$/.test(n) && !/-reference\.docx$/.test(n)).forEach((n) => {
    const d = fs.statSync(path.join(ex, n)).mtime; const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ artifact: 'Word export', file: `exports/${n}`, version: null, built: day, stale: day < released, command: 'export architecture to Word' });
  });
  return out;
}

// the release whose changelog entry carried the increment's delivery scope (the oldest one)
const deliveredIn = (cl, id) => { const e = cl.entries.filter((x) => !/^unreleased$/i.test(x.version) && marker(x.body, 'DELIVERY_INCREMENT') === String(id)).pop(); return e ? e.version : null; };
const scopeLine = (s, lang) => { const w = WORDS[lang] || WORDS.en; return `**${w.scope}**: ${w.inc} ${s.id} — ${s.use_cases.join(', ')} · ${s.containers.length} ${w.containers} (${s.new.containers.length} ${w.new_}) · ${s.integrations.length} ${w.integrations} (${s.new.integrations.length} ${w.new_}) <!-- DELIVERY_INCREMENT: ${s.id} -->`; };

// ---- status
function status(root, opts = {}) {
  root = path.resolve(root);
  const archFile = path.join(root, 'ARCHITECTURE.md');
  if (!exists(archFile)) return { state: 'absent', next: 'create the architecture (architecture-docs Workflow 1)' };
  const arch = read(archFile);
  const version = marker(arch, 'ARCHITECTURE_VERSION'), declared = marker(arch, 'ARCHITECTURE_STATUS'), released = marker(arch, 'ARCHITECTURE_RELEASED');
  const r = { state: null, version, declared_status: declared, released: released || null, git: isGit(root), baseline: null, tag: null, changes: [], recommended: null, unreleased: [], downstream: [], next: null };
  if (!version) return Object.assign(r, { state: 'unversioned', next: 'add the ARCHITECTURE_VERSION block (architecture-docs Workflow 1 Step 5, ARCHITECTURE.md item)' });
  const cl = changelog(root); r.unreleased = cl.lines;
  if (!r.git) return Object.assign(r, { state: /deprecated/i.test(declared || '') ? 'deprecated' : 'no-git', next: 'put the project under git — a release is the tag architecture-v{version}' });
  const tag = TAG(version), o = origin(root);
  r.tag = { name: tag, local: git(root, ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`]).ok, remote: o ? git(root, ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]).out.length > 0 : null, origin: o };
  const base = baseline(root, version);
  r.baseline = base.kind === 'none' ? null : { kind: base.kind, ref: base.ref };
  const cur = collect(root);
  if (base.kind !== 'none') { r.changes = delta(collect(base.dir), cur, base.dir, root); r.recommended = r.changes.length ? recommend(r.changes) : null; }
  if (/deprecated/i.test(declared || '')) r.state = 'deprecated';
  else if (/released/i.test(declared || '') && !r.tag.local) r.state = 'untagged';
  else if (base.kind === 'none') r.state = 'draft';
  else r.state = r.changes.length || r.unreleased.length ? 'changed' : 'released';
  r.downstream = r.state === 'draft' ? [] : downstream(root, version, released);
  const sl = increments.slices(cur);
  if (sl.increments.length) r.increments = { file: sl.file, list: sl.increments.map((x) => ({ id: x.id, target: x.target, use_cases: x.use_cases, flows: x.flows, containers: x.containers.length, new_containers: x.new.containers, integrations: x.integrations.length, new_integrations: x.new.integrations.length, gaps: x.gaps, released_in: deliveredIn(cl, x.id) })), unassigned: sl.unassigned, duplicates: sl.duplicates, temporary: sl.temporary, temporary_gaps: sl.temporary_gaps };
  r.next = { draft: `release my architecture — first release, v${version}`, changed: `release my architecture — ${r.changes.length} change(s) since v${version}, recommended ${r.recommended || 'patch'}`,
    untagged: `recover the tag ${TAG(version)} (lifecycle.js recover)`, released: r.downstream.some((d) => d.stale) ? 'refresh the stale downstream artifacts listed' : 'nothing due', deprecated: 'nothing — the architecture is deprecated' }[r.state];
  // the last status on disk, for readers that cannot run git (sa-ux's next steps)
  try { const d = path.join(root, '.cache', 'sa-skills', 'lifecycle'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'status.json'), JSON.stringify({ state: r.state, version, changes: r.changes.length, recommended: r.recommended, at: new Date().toISOString() }) + '\n'); } catch { /* read-only project */ }
  return r;
}

// ---- plan
function plan(root, opts = {}) {
  root = path.resolve(root);
  const st = status(root);
  if (['absent', 'unversioned', 'deprecated', 'no-git'].includes(st.state)) return { ok: false, reason: `state ${st.state} — ${st.next}`, status: st };
  if (st.state === 'untagged') return { ok: false, reason: `v${st.version} is marked Released but ${TAG(st.version)} is missing — run recover first`, status: st };
  const cl = changelog(root);
  const first = st.state === 'draft';
  if (!first && !st.changes.length && !cl.lines.length) return { ok: false, reason: `nothing changed since v${st.version} — no release is due`, status: st };
  const facts = collect(root);
  const g = opts.skipGates ? [] : gates(root, facts, opts);   // skipGates: the tests' switch, never a CLI flag
  // the entry: hand-written [Unreleased] lines first (they carry the why), then the change list by code; a first release keeps its Draft entry
  let sections = {};
  const draftEntry = first ? cl.entries.find((e) => e.version === st.version) : null;
  if (draftEntry) sections = sectionsOf(draftEntry.body);
  if (cl.unreleased) Object.entries(sectionsOf(cl.unreleased.body)).forEach(([k, ls]) => { sections[k] = (sections[k] || []).concat(ls); });
  st.changes.forEach((i) => { sections[i.section] = sections[i.section] || []; if (!sections[i.section].some((l) => l.includes(i.text))) sections[i.section].push(`- ${i.text}`); });
  // escalations (RUN teams, escalate.js): the ones closed since the last release go into the entry, the open ones are reported
  const since = first ? null : (git(root, ['log', '-1', '--format=%cs', TAG(st.version)]).out || null);
  const closedEsc = escalate.closedSince(root, since), openEsc = escalate.open(root);
  closedEsc.forEach((r) => { sections.Changed = sections.Changed || []; sections.Changed.push(`- ${r.meta.id} ${r.meta.status === 'Rejected' ? 'rejected' : `resolved by ${r.meta.resolution}`}: ${r.title.replace(/^ESC-\d+\s+—\s+/, '')}`); });
  let entry = renderSections(sections) || (facts.architecture.language === 'es' ? '### Changed\n- Versión inicial.' : '### Changed\n- Initial release.');
  const piece = opts.increment ? increments.slices(facts).increments.find((x) => x.id === String(opts.increment)) : null;
  if (piece) entry = `${scopeLine(piece, facts.architecture.language)}\n\n${entry}`;
  const p = { ok: true, project_root: root, created: opts.today || localToday(), from: st.version, first, recommended: first ? null : (st.recommended || 'patch'), baseline: st.baseline,
    fingerprint: fingerprint(root), increment: piece ? { id: piece.id, use_cases: piece.use_cases, containers: piece.containers, new_containers: piece.new.containers, integrations: piece.integrations } : null, changes: st.changes, unreleased: cl.lines, gates: g, blocking: blocking(g).map((x) => x.id), waived: g.filter((x) => x.status === 'waived').map((x) => ({ gate: x.id, reason: x.reason })),
    escalations: { closed: closedEsc.map((r) => r.meta.id), open: openEsc.map((r) => ({ id: r.meta.id, status: r.meta.status, route: r.meta.route, issue: r.meta.issue || null })) } };
  const dir = path.join(root, '.cache', 'sa-skills', 'lifecycle'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify(p, null, 1) + '\n');
  fs.writeFileSync(path.join(dir, 'entry.md'), entry + '\n');
  return Object.assign(p, { entry_file: path.relative(root, path.join(dir, 'entry.md')), plan_file: path.relative(root, path.join(dir, 'plan.json')) });
}

// ---- the writes
function setMetadata(root, { version, status: stat, released, supersedes, note }) {
  const f = path.join(root, 'ARCHITECTURE.md'); let s = read(f);
  const setMarker = (k, v) => { if (v == null) return; const re = new RegExp('<!--\\s*' + k + ':[^>]*-->'); s = re.test(s) ? s.replace(re, `<!-- ${k}: ${v} -->`) : s; };
  const setField = (labels, v) => { if (v == null) return; const re = new RegExp(`^(\\*\\*(?:${labels})\\*\\*\\s*:\\s*).*$`, 'm'); if (re.test(s)) s = s.replace(re, `$1${v}`); };
  setMarker('ARCHITECTURE_VERSION', version); setMarker('ARCHITECTURE_STATUS', stat); setMarker('ARCHITECTURE_RELEASED', released);
  setField('Version|Versión', version); setField('Status|Estado', stat); setField('Released|Liberada|Publicada', released); setField('Supersedes|Reemplaza', supersedes);
  if (note) { if (/^\*\*Deprecation Note\*\*\s*:/m.test(s)) s = s.replace(/^(\*\*Deprecation Note\*\*\s*:\s*).*$/m, `$1${note}`); else s = s.replace(/^(\*\*(?:Status|Estado)\*\*\s*:.*)$/m, `$1\n**Deprecation Note**: ${note}`); }
  fs.writeFileSync(f, s);
}
function setComponentVersions(root, version) {
  let n = 0;
  walk(path.join(root, 'docs', 'components')).filter((f) => f.endsWith('.md')).forEach((f) => {
    const s = read(f); const t = s.replace(/^(\*\*(?:Architecture Version|Versión de Arquitectura|Version de Arquitectura):\*\*\s*).*$/m, `$1${version}`);
    if (t !== s) { fs.writeFileSync(f, t); n++; }
  });
  return n;
}
function writeChangelog(root, version, today, entry, first) {
  const cl = changelog(root);
  const heading = `## [${version}] - ${today}`;
  const block = `${heading}\n\n${entry.trim()}\n`;
  let entries = cl.entries.filter((e) => !/^unreleased$/i.test(e.version) && !(first && e.version === version));
  const head = (cl.header || '# Changelog\n\n').replace(/\s*$/, '\n\n');
  const text = head + '## [Unreleased]\n\n' + [block, ...entries.map((e) => e.text.replace(/\s*$/, '\n'))].join('\n');
  fs.mkdirSync(path.dirname(cl.file), { recursive: true });
  fs.writeFileSync(cl.file, text);
}
function refreshCommandCenter(root) {   // optional: architecture-command-center
  const viz = path.join(root, 'visualizations'); if (!exists(viz)) return [];
  const s = fs.readdirSync(viz).filter((n) => /^architecture-command-center(-.*)?\.scene\.json$/.test(n)).map((n) => path.join(viz, n)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  const dir = P('plugins', 'sa-visualization', 'skills', 'architecture-command-center', 'scripts');
  if (!s || !exists(path.join(dir, 'dossier.js'))) return [];
  const html = s.replace(/\.scene\.json$/, '.html');
  const a = spawnSync('bun', [path.join(dir, 'dossier.js'), root, s, '--write'], { cwd: root, encoding: 'utf8' });
  const b = a.status === 0 ? spawnSync('bun', [path.join(dir, 'render.js'), s, html], { cwd: root, encoding: 'utf8' }) : a;
  return a.status === 0 && b.status === 0 ? [path.relative(root, s), path.relative(root, html)] : [];
}
const githubCompare = (url, base, branch) => { const m = String(url).match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/); return m ? `https://github.com/${m[1]}/${m[2]}/compare/${base}...${branch}?expand=1` : null; };
function publishTag(root, tag, message, push) {
  const t = git(root, ['tag', '-a', tag, '-F', '-'], { input: message });
  if (!t.ok) return { tag: false, error: t.err };
  if (!push || !origin(root)) return { tag: true, pushed: false, reason: push ? 'no origin remote' : '--no-push' };
  let p; for (let i = 0; i < 3; i++) { p = git(root, ['push', 'origin', tag]); if (p.ok) break; }
  return { tag: true, pushed: p.ok, error: p.ok ? undefined : p.err };
}

// ---- apply
function apply(root, opts = {}) {
  root = path.resolve(root);
  const today = opts.today || localToday();
  const dir = path.join(root, '.cache', 'sa-skills', 'lifecycle');
  if (!exists(path.join(dir, 'plan.json'))) return { ok: false, reason: 'no plan — run `lifecycle.js plan` first' };
  const p = JSON.parse(read(path.join(dir, 'plan.json')));
  if (fingerprint(root) !== p.fingerprint) return { ok: false, reason: 'the architecture changed after the plan — run `lifecycle.js plan` again' };
  const waive = Object.fromEntries((opts.waive || []).map((x) => { const i = x.indexOf(':'); return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : [x.trim(), 'no reason given']; }));
  p.gates.forEach((g) => { if (g.status === 'fail' && waive[g.id] !== undefined) Object.assign(g, { status: 'waived', reason: waive[g.id] }); });
  const stillBlocking = blocking(p.gates);
  if (stillBlocking.length) return { ok: false, reason: `blocked by ${stillBlocking.map((g) => g.id).join(', ')} — fix, or --waive <gate>:<reason>`, gates: stillBlocking };
  const bump = opts.bump || p.recommended;
  if (bump && !RANK[bump]) return { ok: false, reason: `--bump takes major, minor or patch, not ${bump}` };
  const version = p.first && !opts.bump ? p.from : bumpVersion(p.from, bump || 'patch');
  const tag = TAG(version);
  if (!isGit(root)) return { ok: false, reason: 'not a git repository — a release is the tag architecture-v{version}' };
  let channel = opts.direct ? 'direct' : 'pr';
  const notes = [];
  if (channel === 'pr' && !origin(root)) { channel = 'direct'; notes.push('no origin remote — direct mode (a PR needs a remote)'); }
  if (git(root, ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`]).ok) return { ok: false, reason: `tag ${tag} already exists` };
  const branch = `release/${tag}`;
  const baseBranch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).out;
  if (channel === 'pr') {
    if (git(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).ok || git(root, ['ls-remote', '--heads', 'origin', branch]).out) return { ok: false, reason: `branch ${branch} already exists (local or origin)` };
    const c = git(root, ['checkout', '-b', branch]); if (!c.ok) return { ok: false, reason: `git checkout -b ${branch}: ${c.err}` };
  }
  // the entry: entry.md as the session left it, plus the waivers
  let entry = exists(path.join(dir, 'entry.md')) ? read(path.join(dir, 'entry.md')).trim() : '';
  const waived = p.gates.filter((g) => g.status === 'waived');
  if (waived.length) entry += `\n\n${waived.map((g) => `> Release gate waived — ${g.id}: ${g.reason}`).join('\n')}`;
  setMetadata(root, { version, status: 'Released', released: today, supersedes: p.first ? '—' : `v${p.from}` });
  const components = setComponentVersions(root, version);
  writeChangelog(root, version, today, entry, p.first);
  const rotated = rotate(root, { keep: 5 }).rotated || [];
  const refreshed = refreshCommandCenter(root);
  const result = { ok: true, version, from: p.from, first: p.first, bump: p.first && !opts.bump ? null : (bump || 'patch'), date: today, channel, components, rotated, refreshed, waived: waived.map((g) => ({ gate: g.id, reason: g.reason })), notes };
  const paths = ARCH_PATHS.filter((x) => exists(path.join(root, x)) || git(root, ['ls-files', '--', x]).out).concat(refreshed);
  const message = `Architecture v${version} — Released ${today}\n\n${entry}\n`;
  const a = git(root, ['add', '-A', '--', ...paths]); if (!a.ok) return Object.assign(result, { ok: false, reason: `git add: ${a.err}` });
  const c = git(root, ['commit', '-F', '-', '--', ...paths], { input: message });
  if (!c.ok) return Object.assign(result, { ok: false, reason: `git commit failed (files are written, nothing is tagged): ${c.err}` });
  result.commit = git(root, ['rev-parse', '--short', 'HEAD']).out;
  const push = !opts.noPush;
  if (channel === 'pr' && push) { const b = git(root, ['push', '-u', 'origin', branch]); result.branch = { name: branch, pushed: b.ok, error: b.ok ? undefined : b.err }; }
  else if (channel === 'pr') result.branch = { name: branch, pushed: false };
  result.tag = Object.assign({ name: tag }, publishTag(root, tag, message, push));
  if (channel === 'pr') { result.base = baseBranch; result.compare = githubCompare(origin(root), baseBranch, branch); }
  if (!result.tag.tag) result.ok = false;
  fs.writeFileSync(path.join(dir, 'release.json'), JSON.stringify(result, null, 1) + '\n');
  fs.rmSync(path.join(dir, 'plan.json'), { force: true });
  result.downstream = downstream(root, version, today).filter((d) => d.stale);
  return result;
}

// ---- recover: the document says Released and the tag is missing
function recover(root, opts = {}) {
  root = path.resolve(root);
  const st = status(root);
  if (st.state !== 'untagged' && !(st.tag && st.tag.local && st.tag.origin && st.tag.remote === false)) return { ok: false, reason: `nothing to recover — state ${st.state}` };
  const tag = TAG(st.version);
  if (st.tag.local) { const p = git(root, ['push', 'origin', tag]); return { ok: p.ok, action: 'push', tag, error: p.ok ? undefined : p.err }; }
  if (st.tag.remote) { const f = git(root, ['fetch', 'origin', 'tag', tag, '--no-tags']); return { ok: f.ok, action: 'fetch', tag, error: f.ok ? undefined : f.err }; }
  const dirty = git(root, ['status', '--porcelain', '--', ...ARCH_PATHS.filter((x) => exists(path.join(root, x)))]).out;
  if (dirty) return { ok: false, reason: 'the architecture has uncommitted changes — the tag would not hold what the document declares; commit or stash them first' };
  const entry = changelog(root).entries.find((e) => e.version === st.version);
  const message = `Architecture v${st.version} — Released ${st.released || ''}\n\n${entry ? entry.body : ''}\n\n(Tag recovered on ${opts.today || localToday()}.)\n`;
  return Object.assign({ ok: true, action: 'tag', head: git(root, ['log', '-1', '--format=%h %s']).out }, publishTag(root, tag, message, !opts.noPush), { tag_name: tag });
}

// ---- deprecate
function deprecate(root, opts = {}) {
  root = path.resolve(root);
  if (!exists(path.join(root, 'ARCHITECTURE.md'))) return { ok: false, reason: 'ARCHITECTURE.md not found' };
  setMetadata(root, { status: 'Deprecated', note: opts.by || null });
  return { ok: true, status: 'Deprecated', note: opts.by || null };
}

// ---- the receipts
function renderStatus(r) {
  const o = [`LIFECYCLE: ${r.state}${r.version ? ` · v${r.version}` : ''}${r.declared_status ? ` (${r.declared_status}${r.released ? `, ${r.released}` : ''})` : ''}${r.baseline ? ` · baseline ${r.baseline.ref}` : ''}`];
  if (r.tag) o.push(`tag ${r.tag.name}: local ${r.tag.local ? 'yes' : 'no'} · origin ${r.tag.origin ? (r.tag.remote ? 'yes' : 'no') : 'none'}`);
  if (r.changes && r.changes.length) { o.push(`changes since v${r.version} (${r.changes.length}, recommended ${r.recommended}):`); r.changes.forEach((c) => o.push(`  ${c.section.padEnd(10)} ${c.bump.padEnd(5)} ${c.text}`)); }
  if (r.unreleased && r.unreleased.length) o.push(`[Unreleased]: ${r.unreleased.length} line(s)`);
  if (r.note) o.push(`note: ${r.note}`);
  if (r.increments) { o.push(`delivery increments (${r.increments.file}):`); r.increments.list.forEach((x) => o.push(`  ${x.released_in ? `✓ v${x.released_in}` : '·      '} ${x.id}${x.target ? ` · ${x.target}` : ''} — ${x.use_cases.join(', ')} · ${x.containers} containers (${x.new_containers.length} new) · ${x.integrations} integrations (${x.new_integrations} new)${x.gaps.length ? ` · ${x.gaps.length} gap(s): ${x.gaps.map((g) => g.rule).join(', ')}` : ''}`)); if (r.increments.unassigned.use_cases.length) o.push(`  unassigned use cases: ${r.increments.unassigned.use_cases.join(', ')}`); if (r.increments.unassigned.containers.length) o.push(`  containers no increment needs: ${r.increments.unassigned.containers.join(', ')}`); r.increments.temporary.forEach((t) => o.push(`  temporary ${t.kind} ${t.name}: increments ${t.from || '?'}–${t.until || '?'}${t.tdr ? ` · ${t.tdr}` : ''} · ${t.live ? 'live' : 'retired'}`)); r.increments.temporary_gaps.forEach((g) => o.push(`  ✗ ${g.rule}: ${g.text}`)); }
  if (r.downstream && r.downstream.length) { o.push('downstream:'); r.downstream.forEach((d) => o.push(`  ${d.stale ? '⚠ stale' : '✓      '} ${d.artifact} — ${d.file} ${d.version ? `v${d.version}` : d.built ? `built ${d.built}` : 'no version'}${d.stale ? ` → "${d.command}"` : ''}`)); o.push('  · compliance contracts are not read — re-run "generate compliance contracts" after a release'); }
  o.push(`next: ${r.next}`);
  return o.join('\n');
}
const renderGates = (gs) => gs.map((g) => `  ${{ pass: '✓', warn: '!', fail: '✗', waived: '~' }[g.status] || '?'} ${g.id.padEnd(17)} ${g.status}${g.pending ? ' (judge worksheet pending)' : ''} — ${g.summary || ''}${g.status === 'fail' && g.fix ? `\n      fix: ${g.fix}` : ''}${g.status === 'waived' ? `\n      waived: ${g.reason}` : ''}`).join('\n');
function renderPlan(p) {
  if (!p.ok) return `RELEASE PLAN: none — ${p.reason}`;
  const o = [`RELEASE PLAN: v${p.from} → ${p.first ? `v${p.from} (first release)` : `recommended ${p.recommended} (v${bumpVersion(p.from, p.recommended)})`}${p.baseline ? ` · against ${p.baseline.ref}` : ''}`];
  if (p.increment) o.push(`delivery scope: increment ${p.increment.id} — ${p.increment.use_cases.join(', ')} · ${p.increment.containers.length} containers (${p.increment.new_containers.length} new: ${p.increment.new_containers.join(', ') || '—'}) · ${p.increment.integrations.length} integrations`);
  o.push(`gates (${p.blocking.length ? `BLOCKED by ${p.blocking.join(', ')}` : 'clear'}):`, renderGates(p.gates));
  if (p.changes.length) { o.push(`changes (${p.changes.length}):`); p.changes.forEach((c) => o.push(`  ${c.section.padEnd(10)} ${c.bump.padEnd(5)} ${c.text}`)); }
  if (p.unreleased.length) o.push(`[Unreleased]: ${p.unreleased.length} hand-written line(s) carried into the entry`);
  if (p.escalations && p.escalations.closed.length) o.push(`escalations closed since the last release, in the entry: ${p.escalations.closed.join(', ')}`);
  if (p.escalations && p.escalations.open.length) o.push(`escalations still open (not blocking): ${p.escalations.open.map((e) => `${e.id} ${e.status} ${e.route}`).join(', ')}`);
  o.push(`entry: ${p.entry_file} — polish the lines if needed, then: lifecycle.js apply <root> [--bump major|minor|patch] [--direct]`);
  return o.join('\n');
}
function renderApply(r) {
  if (!r.ok && !r.version) return `RELEASE: refused — ${r.reason}${r.gates ? '\n' + renderGates(r.gates) : ''}`;
  const o = [`RELEASE: ${r.ok ? '✅' : '⚠️'} v${r.version}${r.first ? ' (first release)' : ` (${r.bump} from v${r.from})`} · ${r.date} · ${r.channel} mode`];
  if (r.reason) o.push(`  stopped: ${r.reason}`);
  o.push(`  ARCHITECTURE.md metadata · ${r.components} component file(s) · docs/CHANGELOG.md${r.rotated.length ? ` (rotated ${r.rotated.join(', ')})` : ''}${r.refreshed.length ? ' · command center refreshed' : ''}`);
  if (r.commit) o.push(`  commit ${r.commit}`);
  if (r.branch) o.push(`  branch ${r.branch.name}: ${r.branch.pushed ? 'pushed' : `not pushed${r.branch.error ? ` — ${r.branch.error}` : ''}`}`);
  if (r.tag) o.push(`  tag ${r.tag.name}: ${r.tag.tag ? (r.tag.pushed ? 'pushed to origin' : `local only${r.tag.reason ? ` (${r.tag.reason})` : ''}${r.tag.error ? ` — push failed: ${r.tag.error}; run git push origin ${r.tag.name}` : ''}`) : `NOT created — ${r.tag.error}`}`);
  if (r.channel === 'pr') o.push(`  open the pull request into ${r.base}: ${r.compare || `from ${r.branch && r.branch.name} in your git host`}`);
  r.waived.forEach((w) => o.push(`  waived ${w.gate}: ${w.reason}`));
  r.notes.forEach((n) => o.push(`  note: ${n}`));
  if (r.downstream && r.downstream.length) { o.push('  now stale:'); r.downstream.forEach((d) => o.push(`    ${d.artifact} (${d.file}) → "${d.command}"`)); }
  o.push('  compliance contracts: re-run "generate compliance contracts" against the release');
  return o.join('\n');
}

module.exports = { status, plan, apply, recover, deprecate, gates, scopeOf, delta, baseline, downstream, changelog, bumpVersion, recommend, fingerprint, TAG };

if (require.main === module) {
  const args = process.argv.slice(2);
  const [cmd, rootArg] = args;
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const many = (f) => args.flatMap((a, i) => (a === f && args[i + 1] ? [args[i + 1]] : []));
  if (!cmd || !rootArg || rootArg.startsWith('--')) { console.error('Usage: bun lifecycle.js status|check|plan|apply|recover|deprecate <project-root> [options] — see the header'); process.exit(2); }
  const opts = { today: opt('--today'), noRender: args.includes('--no-render'), waive: many('--waive'), bump: opt('--bump'), direct: args.includes('--direct'),noPush: args.includes('--no-push'), by: opt('--by'), increment: opt('--increment') };
  const json = args.includes('--json');
  const root = path.resolve(rootArg);
  let r, text, code = 0;
  if (cmd === 'status') { r = status(root, opts); text = renderStatus(r); }
  else if (cmd === 'check') { r = gates(root, collect(root), opts); text = `RELEASE GATES (${blocking(r).length ? `BLOCKED by ${blocking(r).map((g) => g.id).join(', ')}` : 'clear'}):\n${renderGates(r)}`; code = blocking(r).length ? 1 : 0; }
  else if (cmd === 'plan') { r = plan(root, opts); text = renderPlan(r); code = r.ok && !r.blocking.length ? 0 : 1; }
  else if (cmd === 'apply') { r = apply(root, opts); text = renderApply(r); code = r.ok ? 0 : 1; }
  else if (cmd === 'recover') { r = recover(root, opts); text = r.ok ? `RECOVER: ${r.action} ${r.tag_name || r.tag}${r.head ? ` at ${r.head}` : ''}${r.pushed === false ? ` — local only${r.error ? `: ${r.error}` : ''}` : ''}` : `RECOVER: ${r.reason || r.error}`; code = r.ok ? 0 : 1; }
  else if (cmd === 'deprecate') { r = deprecate(root, opts); text = r.ok ? `DEPRECATED${r.note ? ` — ${r.note}` : ''} (no tag: a deprecation is metadata)` : r.reason; code = r.ok ? 0 : 1; }
  else { console.error(`lifecycle.js: unknown subcommand ${cmd}`); process.exit(2); }
  console.log(json ? JSON.stringify(r, null, 1) : text);
  process.exit(code);
}
