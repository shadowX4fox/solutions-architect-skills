#!/usr/bin/env bun
// coherence-eval.js — the coherence gate measured on seeded defects.
//
//   bun coherence-eval.js <out_dir> [--judge agent|typesafe|clef] [--fixtures <dir>]
//
// Writes every clean spec and every seeded variant (tests/fixtures/coherence/defects.json: one exact patch per variant
// and the finding it must produce) into <out_dir>/<id>/PRODUCT_OWNER_SPEC.md, runs po-spec-coherence.js on each and
// grades: a variant is detected when its expected finding is reported; a clean spec raises a false alarm when it blocks.
// Pending work (judge worksheets, acceptance-test requests) is listed — dispatch it and run again; the directories keep
// their caches, so a re-run only asks what is still open.
'use strict';
const fs = require('fs'), path = require('path');
const COH = require('./po-spec-coherence.js');
const FIX = path.join(__dirname, '..', 'tests', 'fixtures', 'coherence');

function variants(fixDir = FIX) {
  const defects = JSON.parse(fs.readFileSync(path.join(fixDir, 'defects.json'), 'utf8'));
  const bases = [...new Set(defects.map((d) => d.base))];
  const out = bases.map((b) => ({ id: b.replace(/\.md$/, ''), clean: true, expect: null, text: fs.readFileSync(path.join(fixDir, b), 'utf8') }));
  for (const d of defects) {
    let t = fs.readFileSync(path.join(fixDir, d.base), 'utf8');
    if (d.cut) { const a = t.indexOf(d.cut), b = t.indexOf(d.until); if (a < 0 || b < a) throw new Error(`${d.id}: cut markers not found`); t = t.slice(0, a) + t.slice(b); }
    else { if (!t.includes(d.find)) throw new Error(`${d.id}: patch text not found in ${d.base}`); t = t.replace(d.find, d.replace); }
    out.push({ id: d.id, clean: false, expect: d.expect, text: t });
  }
  return out;
}

async function run(outDir, opts = {}) {
  const rows = [], pending = [];
  for (const v of variants(opts.fixtures)) {
    const dir = path.join(outDir, v.id); fs.mkdirSync(dir, { recursive: true });
    const spec = path.join(dir, 'PRODUCT_OWNER_SPEC.md'); fs.writeFileSync(spec, v.text);
    const r = await COH.check(spec, { engine: opts.engine, root: dir });
    const tests = new Set(r.findings.map((f) => f.test));
    pending.push(...r.pending.map((p) => ({ variant: v.id, ...p })));
    rows.push({ id: v.id, clean: v.clean, expect: v.expect, status: r.status, found: [...tests],
      detected: v.clean ? null : tests.has(v.expect), false_alarm: v.clean ? r.blocking > 0 : null, undecided: r.undecided.length });
  }
  const seeded = rows.filter((r) => !r.clean), clean = rows.filter((r) => r.clean);
  return { engine: opts.engine || 'default', detected: seeded.filter((r) => r.detected).length, seeded: seeded.length,
    false_alarms: clean.filter((r) => r.false_alarm).length, clean: clean.length, complete: !pending.length, rows, pending };
}

module.exports = { variants, run };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const out = args.find((a, i) => !a.startsWith('--') && !['--judge', '--fixtures'].includes(args[i - 1]));
  if (!out) { console.error('usage: coherence-eval.js <out_dir> [--judge agent|typesafe|clef] [--fixtures <dir>]'); process.exit(2); }
  run(path.resolve(out), { engine: opt('--judge'), fixtures: opt('--fixtures') }).then((r) => {
    console.log(`COHERENCE EVAL · judge ${r.engine} · detected ${r.detected}/${r.seeded} seeded defects · false alarms ${r.false_alarms}/${r.clean} clean specs${r.complete ? '' : ' · INCOMPLETE'}`);
    for (const x of r.rows) console.log(`  ${x.id.padEnd(26)} ${x.clean ? 'clean   ' : `expect ${x.expect}`.padEnd(28)} → ${x.status.padEnd(7)} ${x.found.join(', ') || '—'}${x.clean ? (x.false_alarm ? '  ✗ false alarm' : '') : x.detected ? '  ✓' : '  ✗ missed'}${x.undecided ? `  (${x.undecided} undecided)` : ''}`);
    for (const p of r.pending) console.log(`  pending ${p.variant}: ${p.dispatch} ← ${p.path}`);
    process.exit(r.complete ? 0 : 10);
  }).catch((e) => { console.error(e.message); process.exit(2); });
}
