#!/usr/bin/env node
// readiness-stamp.js — the evaluation's stamp on a PO Spec, its last line:
//
//   <!-- READINESS_CHECK: draft -->                                  a chat wrote it (CHAT_MODE.md) — never evaluated by code
//   <!-- READINESS_CHECK: verified <date> sha256:<12 hex> -->        both checks passed on exactly this text
//
//   bun readiness-stamp.js <PRODUCT_OWNER_SPEC.md> [--check] [--judge agent|typesafe|clef] [--json]
//
// `verified` is written only by this script, after workflow 4 steps 3 and 3b: the checkability rule answered in full with
// no Ready cap (po-spec-checkability.js) and the coherence gate PASS (po-spec-coherence.js). The judge answers those steps
// wrote are reused by fingerprint, so a run here asks nothing new — exit 10 sends back to workflow 4. The hash covers the
// file without the stamp line, CRLF normalized, trailing whitespace trimmed: any later edit voids it, and architecture-docs'
// PO Spec gate (gates-check.js, 0.2) blocks a draft or a stale stamp. The score (≥ 7.5) is the model's and is not stamped.
// `--check` reports the stamp and writes nothing. Exit 0 stamped / current · 1 the checks do not pass · 10 a check waits.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LINE_RE = /^<!--\s*READINESS_CHECK:/;
const STAMP_RE = /^<!--\s*READINESS_CHECK:\s*(draft|verified)(?:\s+(\d{4}-\d{2}-\d{2})\s+sha256:([0-9a-f]{12}))?\s*-->\s*$/m;
const unstamped = (src) => src.replace(/\r\n?/g, '\n').split('\n').filter((l) => !LINE_RE.test(l)).join('\n').replace(/\s+$/, '');
const specHash = (src) => crypto.createHash('sha256').update(unstamped(src)).digest('hex').slice(0, 12);

// { state: none | draft | current | stale, date, hash } of a spec's text
function stampOf(src) {
  const m = src.replace(/\r\n?/g, '\n').match(STAMP_RE);
  if (!m) return { state: 'none' };
  if (m[1] === 'draft' || !m[3]) return { state: 'draft' };
  return { state: m[3] === specHash(src) ? 'current' : 'stale', date: m[2], hash: m[3] };
}
const stamped = (src, date) => { const body = unstamped(src); return `${body}\n\n<!-- READINESS_CHECK: verified ${date} sha256:${specHash(body)} -->\n`; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Both checks, then the stamp when they pass. opts: engine, answers, saSkills, date, write (default true); checks (tests)
async function stamp(specPath, opts = {}) {
  const run = opts.checks || { checkability: require('./po-spec-checkability.js').check, coherence: require('./po-spec-coherence.js').check };
  const chk = await run.checkability(specPath, opts);
  const coh = await run.coherence(specPath, opts);
  const reasons = [];
  if (chk.status === 'PENDING') reasons.push('checkability: candidates no judge has answered — run workflow 4 step 3');
  if (chk.ready_cap) reasons.push(`checkability: Ready cap ${chk.ready_cap} — failing statements in ${chk.capped_by.join(', ')}`);
  if (coh.status === 'PENDING') reasons.push('coherence: work waiting — run workflow 4 step 3b');
  if (coh.status === 'FAIL') reasons.push(`coherence: ${coh.blocking} blocking finding(s)`);
  const pending = chk.status === 'PENDING' || coh.status === 'PENDING';
  const src = fs.readFileSync(specPath, 'utf8');
  if (reasons.length) return { spec: specPath, status: pending && !chk.ready_cap && coh.status !== 'FAIL' ? 'PENDING' : 'FAIL', reasons, stamp: stampOf(src) };
  const date = opts.date || today();
  if (opts.write !== false) fs.writeFileSync(specPath, stamped(src, date));
  return { spec: specPath, status: 'PASS', reasons, stamp: opts.write !== false ? stampOf(stamped(src, date)) : stampOf(src), written: opts.write !== false };
}

function render(r) {
  const s = r.stamp, now = s.state === 'current' || s.state === 'stale' ? `${s.state} (${s.date} sha256:${s.hash})` : s.state;
  const out = [`READINESS_CHECK: ${r.status} · stamp ${now}${r.written ? ' — written' : ''}`];
  for (const x of r.reasons) out.push(`  ✗ ${x}`);
  return out.join('\n');
}

module.exports = { STAMP_RE, unstamped, specHash, stampOf, stamped, stamp, render };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const spec = args.find((a, i) => !a.startsWith('--') && !['--judge', '--sa-skills'].includes(args[i - 1]));
  if (!spec) { console.error('usage: readiness-stamp.js <PRODUCT_OWNER_SPEC.md> [--check] [--judge agent|typesafe|clef] [--json]'); process.exit(2); }
  if (args.includes('--check')) {
    const s = stampOf(fs.readFileSync(spec, 'utf8'));
    console.log(args.includes('--json') ? JSON.stringify(s) : `READINESS_CHECK: ${s.state}${s.date ? ` (${s.date} sha256:${s.hash})` : ''}`);
    process.exit(s.state === 'current' ? 0 : 1);
  }
  stamp(spec, { engine: opt('--judge'), saSkills: opt('--sa-skills') }).then((r) => {
    console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    process.exit(r.status === 'PASS' ? 0 : r.status === 'PENDING' ? 10 : 1);
  }).catch((e) => { console.error(e.message); process.exit(2); });
}
