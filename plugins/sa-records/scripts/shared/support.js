#!/usr/bin/env bun
// RUN-team support (Tier 0, the AI architect): a project maintained by a team with no architect budget declares
// `"support": "run"` in `.sa-skills/project.json`. Once its architecture has a release (an `architecture-v*` tag), four
// writes go ahead without the change-set approval when nothing is in doubt and no escalation trigger is crossed —
// a workaround recorded as a TDR, a TDR status move, a project ADR (101+) in Proposed, a doc fix that changes no fact.
// Every other write, and every write before the first release, is confirmed first. A crossed trigger writes nothing to
// the architecture: it becomes an escalation for a human architect (escalate.js).
//
//   bun support.js <project> [--json]          the project's support mode, whether Tier 0 applies, the triggers
//   bun support.js <project> --declare run|none
//   bun support.js <project> --declare-auto all|none|<kind,kind>   the Tier 0 kinds a trusted unattended agent may key
//                                                                 itself (`"tier0": { "auto": [...] }`, 10.12.0)
'use strict';
const fs = require('fs');
const path = require('path');

const TIER0 = ['tdr-workaround', 'tdr-status', 'adr-proposed', 'doc-fix'];
const TIER0_LABEL = {
  'tdr-workaround': 'a workaround recorded as a new TDR',
  'tdr-status': 'a TDR status move tdr-check.js --move accepts, with its dated History note',
  'adr-proposed': 'a project ADR (101+) written with status Proposed',
  'doc-fix': 'a wording, typo or link fix in docs/ that changes no fact — no value, name, id, integration, technology, decision or status',
};
const TRIGGERS = Object.values(require('./escalate.js').TRIGGERS);   // one list: escalate.js holds the ids
const projectFile = (root) => path.join(path.resolve(root), '.sa-skills', 'project.json');
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };

function releaseTag(root) {
  const r = require('child_process').spawnSync('git', ['-C', path.resolve(root), 'tag', '-l', 'architecture-v*', '--sort=-v:refname'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.split('\n').map((s) => s.trim()).filter(Boolean)[0] || null;
}

// the kinds a trusted unattended agent keys itself — architecture-tier0.yml accepts its label for these only; the policy
// lives here, in the architecture repository, so moving it is a reviewed change of its own (10.12.0)
function autoOf(p) {
  const a = ((p || {}).tier0 || {}).auto;
  if (a === 'all') return TIER0.slice();
  return (Array.isArray(a) ? a : []).map((k) => String(k).trim()).filter((k) => TIER0.includes(k));
}

// { support: 'run' | null, released: <tag> | null, tier0: bool, auto: [kind], reason }
function supportOf(root) {
  const p = readJson(projectFile(root)) || {};
  const support = String(p.support || '').toLowerCase() === 'run' ? 'run' : null;
  if (!support) return { support: null, released: null, tier0: false, reason: 'not a RUN-team project — every write is confirmed first' };
  const released = releaseTag(root);
  if (!released) return { support, released: null, tier0: false, auto: autoOf(p), reason: 'RUN team, but no architecture release yet (no architecture-v* tag) — every write is confirmed first, changes go to Tier 1' };
  return { support, released, tier0: true, auto: autoOf(p), reason: `RUN team, released ${released} — Tier 0 writes go ahead when nothing is in doubt and no trigger is crossed` };
}

function declareSupport(root, value) {
  const v = String(value || '').toLowerCase();
  if (v !== 'run' && v !== 'none') throw new Error(`support must be run or none, not "${value}"`);
  const f = projectFile(root), cur = readJson(f) || {};
  if (v === 'none') delete cur.support; else cur.support = 'run';
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(cur, null, 2) + '\n');
  return v;
}

function declareAuto(root, value) {
  const v = String(value || '').trim().toLowerCase();
  const kinds = v === 'all' ? TIER0.slice() : v === 'none' || v === '' ? [] : v.split(/[\s,]+/).filter(Boolean);
  const bad = kinds.filter((k) => !TIER0.includes(k));
  if (bad.length) throw new Error(`not a Tier 0 kind: ${bad.join(', ')} — one of ${TIER0.join(', ')}, all or none`);
  const f = projectFile(root), cur = readJson(f) || {};
  if (kinds.length) cur.tier0 = Object.assign({}, cur.tier0, { auto: kinds.length === TIER0.length ? 'all' : kinds });
  else if (cur.tier0) { delete cur.tier0.auto; if (!Object.keys(cur.tier0).length) delete cur.tier0; }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(cur, null, 2) + '\n');
  return kinds;
}

module.exports = { TIER0, TIER0_LABEL, TRIGGERS, supportOf, declareSupport, declareAuto, releaseTag };

if (require.main === module) {
  const a = process.argv.slice(2), root = a.find((x) => !x.startsWith('--')) || process.cwd();
  const j = a.indexOf('--declare-auto');
  if (j >= 0) { try { const k = declareAuto(root, a[j + 1]); console.log(k.length ? `tier0.auto: ${k.join(', ')} — a trusted agent (SA_TIER0_TRUSTED_AGENTS) keys these itself` : 'tier0.auto: none — a person applies architecture-tier0'); process.exit(0); } catch (e) { console.error(e.message); process.exit(2); } }
  const i = a.indexOf('--declare');
  if (i >= 0) { try { const v = declareSupport(root, a[i + 1]); console.log(v); if (v === 'run') console.log(`next: the repository's labels — escalate.js labels ${root} (--create adds the missing, after the user's yes)`); process.exit(0); } catch (e) { console.error(e.message); process.exit(2); } }
  const s = supportOf(root);
  if (a.includes('--json')) { console.log(JSON.stringify(Object.assign({}, s, { tier0_writes: s.tier0 ? TIER0 : [], triggers: TRIGGERS }), null, 2)); process.exit(0); }
  console.log(`support: ${s.support || 'standard'} · ${s.reason}`);
  if (s.tier0) {
    console.log('Tier 0 writes (no change-set approval when nothing is in doubt):');
    TIER0.forEach((k) => console.log(`  - ${TIER0_LABEL[k]}${s.auto.includes(k) ? ' — a trusted agent keys it itself' : ''}`));
    console.log('Escalation triggers (a crossed trigger writes nothing to the architecture — it becomes an escalation: escalate.js new):');
    TRIGGERS.forEach((t) => console.log(`  - ${t}`));
  }
}
