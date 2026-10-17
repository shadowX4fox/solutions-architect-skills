#!/usr/bin/env bun
// kit-drift.js — a regenerated kit against the kit committed before it (Step 5.2c, 8.153.0).
//
//   bun kit-drift.js <project_root> [--base <git-ref>] [--judge agent|typesafe|clef] [--answers] [--strict] [--json]
//
// A value the architecture does not pin is decided again by every regeneration. Over three releases one kit moved its
// contract version (v1, then none), renamed an operation and dropped an invariant — the re-wrap rule of a key — while the
// docs behind them said the same thing; a developer found each change in the build pack. This compares the kit on disk with
// the kit at `--base` (git HEAD by default — run it before the regenerated kit is committed):
//
//   OpenAPI / AsyncAPI assets  an operation removed, an operationId renamed, the contract's `info.version` moved. When the
//                              docs still state the old name or path, or do not state the new version, it is a `regression`
//                              (BLOCKING): the asset dropped or re-decided what the architecture says. When neither name is
//                              in the docs it is a WARNING — pin it there (contract-check.js warns on the same names).
//   Component Specifications   an invariant of § 4 whose text no longer appears. The judge says whether the new list still
//                              states it, reworded, split or merged; one it does not is `invariant-dropped`, a WARNING the
//                              orchestrator settles against the docs: restored (the part re-spawned with the finding) or
//                              reported as removed by the architecture.
//
// No git, no kit at the base: SKIPPED. Exit 1 on a BLOCKING finding (and under --strict on a warning or a pending worksheet).
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));
const JUDGE = require(fromSaSkills('scripts', 'judge.js'));

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const git = (root, args) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return r.status === 0 ? r.stdout : null; };
const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whether the docs state a name: whole, not inside a longer identifier; `lead` admits a prefix such as the `v` of `v1.0.0`. */
const named = (text, x, lead = '') => new RegExp(`(^|[^\\w.-]|${lead || '(?!)'})${esc(x)}(?![\\w])`).test(text);

/** The architecture's text on disk — ARCHITECTURE.md, docs/ and adr/ — the source every asset is held to. */
function docsText(root) {
  const out = []; const walk = (d) => { if (!fs.existsSync(d)) return; fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.md$/.test(e.name)) out.push(read(p)); }); };
  const a = path.join(root, 'ARCHITECTURE.md'); if (fs.existsSync(a)) out.push(read(a)); walk(path.join(root, 'docs')); walk(path.join(root, 'adr'));
  return out.join('\n');
}

function contractFacts(raw) {
  let doc; try { doc = Bun.YAML.parse(raw); } catch { return null; } if (!doc || typeof doc !== 'object') return null;
  const version = doc.info && doc.info.version != null ? String(doc.info.version) : null; const ops = new Map();
  if (doc.paths && typeof doc.paths === 'object') Object.entries(doc.paths).forEach(([p, item]) => { if (!item || typeof item !== 'object') return;
    Object.entries(item).forEach(([m, op]) => { if (METHODS.includes(m)) ops.set(`${m.toUpperCase()} ${p}`, { path: p, operationId: op && typeof op.operationId === 'string' ? op.operationId : null }); }); });
  if (doc.operations && typeof doc.operations === 'object') Object.keys(doc.operations).forEach((k) => ops.set(`operation ${k}`, { path: null, operationId: k }));
  return { version, ops };
}

/** § 4 Invariants: `- **INV-NN** statement` bullets, the statement in plain text. */
function invariantsOf(md) {
  const lines = md.split('\n'); const at = lines.findIndex((l) => /^##\s.*<!--\s*SECTION:\s*Invariants\s*-->/i.test(l)); if (at < 0) return [];
  let end = lines.findIndex((l, i) => i > at && /^##\s/.test(l)); if (end < 0) end = lines.length;
  return lines.slice(at + 1, end).map((l) => l.match(/^\s*[-*]\s+\*\*(INV-\d+[a-z]?)\*\*\s*[:—–-]?\s*(.+)$/)).filter(Boolean)
    .map((m) => ({ id: m[1], text: m[2].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim() }));
}
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const SPEC = { id: 'kit-invariant-kept', type: 'noul',
  question: 'Does the new invariant list of this Component Specification (`item.now`) still state the rule `item.before` — reworded, split into several invariants or merged into another counts?',
  criteria: { true: 'The rule is still there: the same obligation in other words, part of a broader invariant, or split across two.', false: 'The rule is gone: no invariant of the new list states that obligation, or one states a weaker or different one.' } };

async function check(root, opts = {}) {
  root = path.resolve(root); const base = opts.base || 'HEAD';
  if (git(root, ['rev-parse', '--verify', `${base}^{commit}`]) === null) return { status: 'SKIPPED', base, reason: `no git commit ${base} in ${root}`, findings: [], undecided: [] };
  const listed = (git(root, ['ls-tree', '-r', '--name-only', base, '--', 'handoffs']) || '').split('\n').filter(Boolean);
  if (!listed.length) return { status: 'SKIPPED', base, reason: `no handoffs/ kit at ${base} — nothing to compare`, findings: [], undecided: [] };
  const atBase = (rel) => git(root, ['show', `${base}:${rel}`]);
  const docs = docsText(root); const findings = []; const asked = [];

  // contracts
  listed.filter((rel) => /^handoffs\/assets\/[^/]+\/(openapi|asyncapi)\.ya?ml$/.test(rel)).forEach((rel) => {
    const now = path.join(root, rel); if (!fs.existsSync(now)) { findings.push({ rule: 'asset-removed', severity: 'WARNING', file: rel, text: 'the contract existed at the base and is gone — confirm the component no longer exposes it' }); return; }
    const b = contractFacts(atBase(rel) || ''), n = contractFacts(read(now)); if (!b || !n) return;
    if (b.version && n.version && b.version !== n.version && !named(docs, n.version, '[vV]'))
      findings.push({ rule: 'regression', severity: 'BLOCKING', file: rel, text: `info.version ${b.version} → ${n.version} — the docs do not state ${n.version}; pin the contract version in the docs (or restore ${b.version})` });
    b.ops.forEach((op, key) => {
      const cur = n.ops.get(key);
      if (!cur) { const said = (op.path && docs.includes(op.path)) || (op.operationId && named(docs, op.operationId));
        findings.push({ rule: said ? 'regression' : 'operation-removed', severity: said ? 'BLOCKING' : 'WARNING', file: rel, text: `${key}${op.operationId ? ` (${op.operationId})` : ''} is gone${said ? ' — the docs still state it' : ' — confirm the architecture removed it'}` }); return; }
      if (op.operationId && cur.operationId !== op.operationId && !(cur.operationId && named(docs, cur.operationId))) {
        const said = named(docs, op.operationId);
        findings.push({ rule: said ? 'regression' : 'operation-renamed', severity: said ? 'BLOCKING' : 'WARNING', file: rel, text: `${key}: operationId ${op.operationId} → ${cur.operationId || 'none'}${said ? ` — the docs name ${op.operationId}` : ' — neither name is in the docs; pin the operation names there'}` }); }
    });
  });

  // invariants
  listed.filter((rel) => /^handoffs\/components\/\d+-[^/]+\.md$/.test(rel)).forEach((rel) => {
    const now = path.join(root, rel); if (!fs.existsSync(now)) return;
    const before = invariantsOf(atBase(rel) || ''), cur = invariantsOf(read(now)); if (!before.length) return;
    const kept = new Set(cur.map((x) => norm(x.text)));
    before.filter((x) => !kept.has(norm(x.text))).forEach((x) => asked.push({ file: rel, inv: x, id: `inv-${asked.length}`, state: { component: rel, before: `${x.id} ${x.text}`, now: cur.length ? cur.map((y) => `${y.id} ${y.text}`).join('\n') : '(no invariants)' } }));
  });

  let engine = opts.engine || JUDGE.engineInForce(); let res = { engine, answers: {} }, note = null;
  if (asked.length) {
    const items = asked.map(({ id, state }) => ({ id, state }));
    const run = (eng) => JUDGE.judge(SPEC, items, { engine: eng, root, answers: eng === 'agent' && opts.answers ? true : undefined, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache });
    try { res = await run(engine); }
    catch (e) { if (e.name !== 'JudgeError' || engine === 'agent') throw e; note = `${engine} unavailable (${e.message}) — the agent worksheet stands in`; engine = 'agent'; res = await run('agent'); }
    if (res.pending) note = `${note ? note + '; ' : ''}judge worksheet at ${path.relative(root, res.pending)} — dispatch worksheet-judge on it, then re-run`;
  }
  const undecided = [];
  asked.forEach((a) => { const ans = res.answers[a.id]; if (!ans) { undecided.push(`${a.file} ${a.inv.id}`); return; }
    if (JUDGE.value(ans) < 0.5) findings.push({ rule: 'invariant-dropped', severity: 'WARNING', file: a.file, text: `${a.inv.id} "${a.inv.text.slice(0, 200)}" — no invariant of the new list states it [${ans.by} ${(+JUDGE.value(ans)).toFixed(2)}]; restore it, or confirm the architecture dropped the rule` }); });
  const status = findings.some((f) => f.severity === 'BLOCKING') ? 'FAIL' : res.pending || undecided.length ? 'PENDING' : findings.length ? 'WARN' : 'PASS';
  return { status, base, engine: res.engine || engine, compared: listed.length, invariants_asked: asked.length, findings, undecided, note };
}

function render(r) {
  if (r.status === 'SKIPPED') return `KIT_DRIFT: SKIPPED — ${r.reason}`;
  const out = [`KIT_DRIFT: ${r.status} — against ${r.base}: ${r.findings.length} change(s) to review${r.undecided.length ? `, ${r.undecided.length} invariant(s) undecided` : ''}`];
  r.findings.forEach((f) => out.push(`  ${f.severity === 'BLOCKING' ? '✗' : '⚠'} ${f.rule} ${f.file} — ${f.text}`));
  if (r.note) out.push(`  note: ${r.note}`);
  return out.join('\n');
}

module.exports = { check, render, contractFacts, invariantsOf, named, SPEC };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2); const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
    const root = args.find((a, i) => !a.startsWith('--') && !['--base', '--judge'].includes(args[i - 1]));
    if (!root || !fs.existsSync(root)) { console.error('Usage: bun kit-drift.js <project_root> [--base <git-ref>] [--judge agent|typesafe|clef] [--answers] [--strict] [--json]'); process.exit(2); }
    const r = await check(root, { base: val('--base'), engine: val('--judge'), answers: args.includes('--answers') });
    console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    process.exit(r.status === 'FAIL' || (args.includes('--strict') && !['PASS', 'SKIPPED'].includes(r.status)) ? 1 : 0);
  })().catch((e) => { console.error(`kit-drift: ${e.message}`); process.exit(2); });
}
