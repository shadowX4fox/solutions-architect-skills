#!/usr/bin/env bun
// kit-coherence.js — one fact, stated in three parts of the kit, held to itself (Step 5.2c, 8.153.0).
//
//   bun kit-coherence.js <project_root> [--judge agent|typesafe|clef] [--answers] [--strict] [--json]
//
// Who owns a data item an interaction touches is written three times: the Interface Contract's Ownership table, its Exit
// state, and § 6 Data ownership of each endpoint's Component Specification. Different generators write them from different
// payloads, and nothing compared them: an Ownership row drawn from a docs/05 block narrower than the descriptor left out a key
// blob that the Exit state and the upstream's § 6 both named, and a developer found it in the build pack.
//
// Stage 1 (code): per Interface Contract, its Ownership table, its Exit state and the § 6 of the two specifications (the
// endpoints from the file name `<upstream>→<downstream>.md`, each specification `components/NN-<slug>.md`). Stage 2 (the
// judge, scripts/judge.js): one noul per contract — do the parts disagree on who owns an item this interaction touches?
// Stage 3 (code): p ≥ 0.85 → `ownership-mismatch`, BLOCKING; 0.5 ≤ p < 0.85 → WARNING; unanswered → undecided, the run
// PENDING with the worksheet to answer (agent engine: the session dispatches worksheet-judge, then re-runs the command).
//
// Exit 1 on a blocking finding (and under --strict on a warning or a pending worksheet); 0 otherwise.
'use strict';
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));
const JUDGE = require(fromSaSkills('scripts', 'judge.js'));

const HI = 0.85, LO = 0.5;
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const cap = (s, n) => (s.length > n ? `${s.slice(0, n)} …[cut]` : s);
/** The body of the H2 carrying `<!-- SECTION: <anchor> -->`, comments and fences out; null when the part has no such section. */
function sectionOf(md, anchor) {
  const lines = md.split('\n'); const re = new RegExp(`^##\\s.*<!--\\s*SECTION:\\s*${anchor}\\s*-->`, 'i');
  const at = lines.findIndex((l) => re.test(l)); if (at < 0) return null;
  let end = lines.findIndex((l, i) => i > at && /^##\s/.test(l)); if (end < 0) end = lines.length;
  return lines.slice(at + 1, end).join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '').replace(/^---\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}
const specOf = (hd, slug) => { const d = path.join(hd, 'components'); if (!fs.existsSync(d)) return null; const n = fs.readdirSync(d).find((x) => x.endsWith(`-${slug}.md`) && /^\d+-/.test(x)); return n ? path.join(d, n) : null; };

/** Stage 1: one item per Interface Contract that has an Ownership table and an Exit state. */
function candidates(root) {
  const hd = path.join(root, 'handoffs'), id = path.join(hd, 'interfaces'); const items = [], skipped = [];
  if (!fs.existsSync(id)) return { items, skipped };
  fs.readdirSync(id).filter((n) => /\.md$/.test(n) && n.includes('→')).sort().forEach((n, k) => {
    const md = read(path.join(id, n)); const [up, down] = n.replace(/\.md$/, '').split('→');
    const ownership = sectionOf(md, 'Ownership'), exit = sectionOf(md, 'Exit state');
    if (!ownership || !exit) { skipped.push(`${n}: no ${!ownership ? 'Ownership' : 'Exit state'} section`); return; }
    const own = (slug) => { const f = specOf(hd, slug); const s = f ? sectionOf(read(f), 'Data Ownership') : null; return s ? { file: path.relative(root, f), text: s } : null; };
    const u = own(up), d = own(down);
    items.push({ id: `if-${k}`, file: path.join('handoffs', 'interfaces', n), state: {
      interface: n.replace(/\.md$/, ''), upstream: up, downstream: down,
      exit_state: cap(exit, 2500), ownership: cap(ownership, 1500),
      upstream_owns: u ? cap(u.text, 2000) : 'no Component Specification § 6 for the upstream in this kit',
      downstream_owns: d ? cap(d.text, 2000) : 'no Component Specification § 6 for the downstream in this kit' } });
  });
  return { items, skipped };
}

const SPEC = { id: 'kit-ownership-coherence', type: 'noul',
  question: 'Do the parts of this handoff kit disagree about who owns a data item the interaction `item.interface` touches? Compare the Interface Contract\'s Ownership table (`item.ownership`) with its Exit state (`item.exit_state`) and with the data ownership of the two Component Specifications (`item.upstream_owns`, `item.downstream_owns`).',
  criteria: {
    true: 'They disagree: the Exit state says one side writes, creates, deletes or holds an item that the Ownership table does not list for that side, or lists for the other side; or a specification gives a side an item this interaction writes or carries that the Ownership table leaves out or gives to the other side. Example: the Exit state and the upstream\'s § 6 say the upstream stores a wrapped key blob, and the Ownership row of the upstream lists only a flag and a timestamp.',
    false: 'They agree: every item the Exit state and the specifications attribute to a side for this interaction is in that side\'s row — named in other words, or inside a group that contains it, counts — and items a specification owns that this interaction never touches are not expected in the table.' },
  hi: HI, lo: LO };

async function check(root, opts = {}) {
  root = path.resolve(root);
  const { items, skipped } = candidates(root);
  let engine = opts.engine || JUDGE.engineInForce(); let res = { engine, answers: {} }, note = null;
  if (items.length) {
    const judgeItems = items.map(({ id, state }) => ({ id, state }));
    const run = (eng) => JUDGE.judge(SPEC, judgeItems, { engine: eng, root, answers: eng === 'agent' && opts.answers ? true : undefined, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache });
    try { res = await run(engine); }
    catch (e) { if (e.name !== 'JudgeError' || engine === 'agent') throw e; note = `${engine} unavailable (${e.message}) — the agent worksheet stands in`; engine = 'agent'; res = await run('agent'); }
    if (res.pending) note = `${note ? note + '; ' : ''}judge worksheet at ${path.relative(root, res.pending)} — dispatch worksheet-judge on it, then re-run`;
  }
  const findings = [], undecided = []; let agreed = 0;
  items.forEach((it) => { const a = res.answers[it.id]; if (!a) { undecided.push(it.file); return; } const p = JUDGE.value(a);
    if (p >= HI) findings.push({ rule: 'ownership-mismatch', severity: 'BLOCKING', file: it.file, p: +p.toFixed(2), by: a.by });
    else if (p >= LO) findings.push({ rule: 'ownership-mismatch', severity: 'WARNING', file: it.file, p: +p.toFixed(2), by: a.by });
    else agreed++; });
  const status = findings.some((f) => f.severity === 'BLOCKING') ? 'FAIL' : res.pending || undecided.length ? 'PENDING' : findings.length ? 'WARN' : 'PASS';
  return { status, engine: res.engine || engine, contracts: items.length, agreed, findings, undecided, skipped, note };
}

function render(r) {
  const out = [`KIT_COHERENCE: ${r.status} — ${r.contracts} Interface Contract(s), ${r.agreed} agree${r.findings.length ? `, ${r.findings.length} disagree` : ''}${r.undecided.length ? `, ${r.undecided.length} undecided` : ''} (judge: ${r.engine})`];
  r.findings.forEach((f) => out.push(`  ${f.severity === 'BLOCKING' ? '✗' : '⚠'} ownership-mismatch ${f.file} [${f.by} ${f.p}] — its Ownership table, its Exit state and the specifications' § 6 disagree on who owns an item. Fix the source the narrower part was drawn from (often the docs/05 block), regenerate the contract — or the specification — and re-run`));
  r.skipped.forEach((s) => out.push(`  · skipped ${s}`));
  if (r.note) out.push(`  note: ${r.note}`);
  return out.join('\n');
}

module.exports = { check, candidates, sectionOf, render, SPEC };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2); const ji = args.indexOf('--judge'); const root = args.find((a, i) => !a.startsWith('--') && !(ji >= 0 && i === ji + 1));
    if (!root || !fs.existsSync(root)) { console.error('Usage: bun kit-coherence.js <project_root> [--judge agent|typesafe|clef] [--answers] [--strict] [--json]'); process.exit(2); }
    const r = await check(root, { engine: ji >= 0 ? args[ji + 1] : undefined, answers: args.includes('--answers') });
    console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    process.exit(r.status === 'FAIL' || (args.includes('--strict') && r.status !== 'PASS') ? 1 : 0);
  })().catch((e) => { console.error(`kit-coherence: ${e.message}`); process.exit(2); });
}
