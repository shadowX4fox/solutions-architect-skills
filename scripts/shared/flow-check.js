#!/usr/bin/env node
// flow-check.js — docs/04 states every flow twice, and the two statements must agree.
//
//   bun flow-check.js <project-root> [--json] [--warn-only] [--judge agent|typesafe|clef] [--undecided warn]
//
// --undecided warn (CI, where no one answers a worksheet): a phase-absent finding whose every absent name is undecided —
// another spelling the judge has not read yet — is a warning instead of a block. A finding code decides still blocks.
//
// A flow is written down in two places. Its block names the phases it runs (`**Phases:** 1 → 2 → 4`),
// and § End-to-End Wire Sequences draws the whole flow as one `sequenceDiagram` called the *complete*
// sequence. Nothing has ever held the two to each other: the phase list is prose, the sequence is a
// diagram, and no reader sees them side by side — the handoff kit's Runtime View carries the phase
// panels and only *links* to the sequence. On the reference project five of the six flows that have a
// sequence declare a phase the sequence does not contain, and three flows have no sequence at all.
//
// The test for "the sequence contains this phase" is its participants: a phase's `sequenceDiagram`
// names its counterparty (`AppDome`, `Servicio de Replicación de Pedidos`), and if that name is
// not a participant of the flow's end-to-end sequence, the phase is not in the picture. Both readings
// are live and the finding never presumes one: on the reference project F-02 declares phase 4 and its
// sequence stops before reading the history — the sequence is short; F-05 declares phase 1 and it is a
// deletion flow with no integrity check — the phase list is long. Same finding, opposite fixes.
//
// Rules:
//   flow-block-missing the inventory lists a flow with no block        (the ledger cannot pair them — everything downstream reads Not documented)
//   phases-undeclared a flow block carries no `**Phases**:` line       (nothing to hold the sequence to — the check is blind on that flow)
//   sequence-missing  a documented flow has no end-to-end sequence      (the diagram policy is one per documented flow)
//   phase-absent      a declared phase's counterparty is not in it      (the two statements contradict)
//   phase-undrawn     a phase block carries no sequenceDiagram          (finding since 8.30.0 — the panel is the source every sequence derives from)
//   phase-orphan      a phase no flow declares                          (warning — dead phase, or a flow forgot it)
//   sequence-declared-absent  the block is there and draws nothing      (warning — a recorded decision, not a silence)
//   phase-hops-missing  a phase block has no `**Hops**` line            (warning — the Runtime View's budget decomposition has nothing to decompose)
//
// `phases-undeclared` is the one that hides the others. `gift-cards-and-bundles` states the composition in
// prose — "Executes phases **1 → 2 → 3 → 4-5 → 7 → 8**" — instead of the `**Phases**:` line the ledger
// reads, so its flows arrive with an empty phase list, the Runtime View prints `Not documented`, and
// `phase-absent` can never fire. A check that cannot see is not a check that passes.
//
// Exit 1 on any finding, 0 with --warn-only. Flow facts come from arch-facts.js — the ledger is the one
// reader of the phase list; this script parses docs/04 only for the fences, which the ledger does not carry.
'use strict';
const PHASES_PAREN_WORDS = 8;   // "(asíncrono, dirigido por eventos)" fits; a sentence in parentheses does not
const fs = require('fs');
const path = require('path');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));
const { resolveNames } = require(path.join(__dirname, '..', 'resolve-name.js'));

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const docFile = (root, prefix) => { const dir = path.join(root, 'docs'); if (!fs.existsSync(dir)) return null; const f = fs.readdirSync(dir).find((n) => n.startsWith(prefix) && n.endsWith('.md')); return f ? path.join(dir, f) : null; };
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// A section by its SECTION anchor, else by visible heading in either language. **The heading level is
// not fixed**: docs/04 puts the Phase Catalog at H3 in one project and H2 in another, and the blocks
// under it one level deeper in each. Pinning the levels reported three flows of `gift-cards-and-bundles`
// as having no end-to-end sequence when the section was simply an H2 — a gate is worth less than
// nothing if it invents findings, so both walkers read the level from the document.
function sectionBody(src, anchor, headingRe) {
  const lines = src.split('\n');
  let start = -1, level = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,5})\s+(.+)$/);
    if (!h) continue;
    const a = (h[2].match(/<!--\s*SECTION:\s*([^>]*?)\s*-->/) || [])[1];
    if (a === anchor || (!a && headingRe.test(plain(h[2])))) { start = i; level = h[1].length; break; }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) { const h = lines[i].match(/^(#{1,6})\s/); if (h && h[1].length <= level) { end = i; break; } }
  return { body: lines.slice(start + 1, end).join('\n'), startLine: start + 1, level };
}

// `<kind> N — <name>` blocks at any level below the section, and the first mermaid fence under each.
// `Phase 4–5 — Payment` is one block covering two phases, so a range registers under every number in it.
function blocksIn(part, kindRe) {
  if (!part) return {};
  const lines = part.body.split('\n'), out = {};
  const head = new RegExp(`^(#{2,6})\\s+(?:${kindRe})\\s+(\\d+[a-z]?(?:\\s*[–—-]\\s*\\d+[a-z]?)?)\\s*[—–:-]\\s*(.+)$`, 'i');
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(head);
    if (!h || h[1].length <= part.level) continue;
    let end = lines.length;
    for (let k = i + 1; k < lines.length; k++) { const n = lines[k].match(/^(#{1,6})\s/); if (n && n[1].length <= h[1].length) { end = k; break; } }
    const body = lines.slice(i + 1, end).join('\n');
    const fence = (body.match(/```mermaid\n([\s\S]*?)\n```/) || [])[1] || null;
    const nums = h[2].split(/\s*[–—-]\s*/).filter(Boolean);
    const block = { n: h[2].replace(/\s+/g, ''), title: plain(h[3]), fence, body, line: part.startLine + i + 1 };
    nums.forEach((x) => { out[x.toLowerCase()] = block; });
    i = end - 1;
  }
  return out;
}
const participants = (fence) => (fence ? [...new Set((fence.match(/^\s*participant\s+\S+\s+as\s+(.+)$/gm) || []).map((l) => plain(l.replace(/^\s*participant\s+\S+\s+as\s+/, ''))))] : []);
const isSequence = (fence) => !!fence && /^\s*sequenceDiagram\b/m.test(fence.replace(/%%\{[\s\S]*?\}%%/g, ''));

async function check(root, opts = {}) {
  const file = docFile(root, '04-');
  const result = { status: 'PASS', file: file ? path.relative(root, file) : null, flows: [], warnings: [] };
  if (!file) { result.status = 'SKIP'; result.warnings.push({ rule: 'no-file', text: 'no docs/04-*.md in this project — nothing to check' }); return result; }

  const src = read(file);
  const facts = opts.facts || collect(root);
  const catalogPart = sectionBody(src, 'Phase Catalog', /^(Phase Catalog|Cat[aá]logo de Fases)/i);
  const e2ePart = sectionBody(src, 'End-to-End Wire Sequences', /(End-to-End|Extremo a Extremo)/i);
  // phase-absent compares participants by DISPLAY NAME, and panels are authored one at a time: the same component is `DGACP`
  // in one and `DR` in another, so a panel that spells the counterparty differently fired a false finding. Every display
  // name across the catalog and the sequences goes through scripts/resolve-name.js once (exact by code; an alias, an
  // internal name or a shortened form by the judge over the ledger's components with their taglines), and the comparison
  // runs over canonical names — a name the judge read and could not bind stays what it says. A name no judge has answered
  // (a pending worksheet, a judge error) is undecided (8.119.0): compared by display name as the check always did, and
  // listed under `undecided` with the worksheet, and beside every phase-absent finding it raises, so the user answers it.
  const displayNames = [...new Set([...participants(catalogPart ? catalogPart.body : ''), ...participants(e2ePart ? e2ePart.body : '')])];
  const canon = new Map(), undecided = new Set(); let worksheet = null;
  if (displayNames.length && (facts.components || []).length) {
    try { const res = await resolveNames(displayNames.map((n, i) => ({ id: `p${i}`, cell: n, context: { where: 'docs/04 participant' } })), facts.components, { engine: opts.judge, root });
      worksheet = res.pending || null;
      displayNames.forEach((n, i) => { const r = res.get(`p${i}`); if (r && r.undecided) undecided.add(n);
        if (r && r.resolved && r.by !== 'exact') result.warnings.push({ rule: 'participant-alias', text: `"${n}" read as \`${r.name}\` (${r.by}${r.confidence != null ? ` ${r.confidence}` : ''})` }); canon.set(n, r && r.resolved ? r.name : n); }); }
    catch (e) { if (e.name !== 'JudgeError') throw e; result.warnings.push({ rule: 'judge', text: `${e.message} — participants compared by display name` });
      displayNames.filter((n) => !facts.components.some((f) => norm(f.name) === norm(n))).forEach((n) => undecided.add(n)); }   // an exact name is code's even without a judge
  }
  result.undecided = [...undecided]; result.worksheet = worksheet;
  if (undecided.size) result.warnings.push({ rule: 'participant-undecided', text: `${undecided.size} participant name(s) undecided — not yet read as a canonical name, compared as written: ${[...undecided].map((n) => `"${n}"`).join(', ')}${worksheet ? ` — answer ${worksheet} and re-run` : ''}` });
  const canonOf = (n) => canon.get(n) || n;
  // an architecture written before the Flow Inventory / Phase Catalog layout states a flow once, as an
  // `## Flow N:` block — there is no second statement to disagree with, so there is nothing to check.
  // Saying PASS there would report a clean bill on a document this script never looked at.
  if (!catalogPart && !facts.flows.length) { result.status = 'SKIP'; result.warnings.push({ rule: 'legacy-layout', text: `${result.file} predates the Flow Inventory / Phase Catalog layout — no phase list to hold a sequence to` }); return result; }
  const catalog = blocksIn(catalogPart, 'Phase|Fase');
  const e2e = blocksIn(e2ePart, 'Flow|Flujo');

  const declared = new Set();
  for (const flow of facts.flows) {
    const num = String(flow.code).replace(/^F-?/i, '').replace(/^0+(?=\d)/, '').toLowerCase();
    const row = { code: `F-${String(flow.code).padStart(2, '0')}`, name: flow.name, phases: flow.phases, findings: [] };   // the id the Runtime View shows the reader
    flow.phases.forEach((p) => declared.add(String(p).toLowerCase()));
    if (!flow.has_block) row.findings.push({ rule: 'flow-block-missing', line: null,
      text: 'the Flow Inventory lists this flow and no block matches its name',
      why: 'The block\'s heading must carry the inventory\'s flow name so the ledger pairs them. Unpaired, the flow has no phases, no delta and no governing ADRs, and every artifact downstream prints `Not documented`.' });
    else if (!flow.phases.length) row.findings.push({ rule: 'phases-undeclared', line: null,
      text: 'the flow block declares no phases',
      why: 'The composition goes on a `**Phases**: 1 → 2 → 4` line, which the facts ledger reads. Written as prose it is invisible: the Runtime View prints `Not documented` and nothing can hold the end-to-end sequence to this flow.' });
    const seq = e2e[num];
    if (seq && !seq.fence) {
      // the block is there and says it carries no sequence — a decision someone recorded, not a silence
      result.warnings.push({ rule: 'sequence-declared-absent', line: seq.line, text: `${row.code} — the end-to-end block is present and draws nothing ("${seq.title}")` });
    } else if (!seq) {
      row.findings.push({ rule: 'sequence-missing', line: null, text: `no end-to-end sequence for this flow`,
        why: 'The diagram policy is one Data Flow sequence per documented flow. Run `/sa-skills:architecture-docs` — generate my architecture diagrams.' });
    } else {
      const have = participants(seq.fence).map(canonOf);
      for (const p of flow.phases) {
        const phase = catalog[String(p).toLowerCase()];
        if (!phase || !phase.fence) continue;                       // reported once, under phase-undrawn
        const absent = participants(phase.fence).filter((x) => !have.includes(canonOf(x)));
        if (absent.length && opts.undecided === 'warn' && absent.every((a) => undecided.has(a))) result.warnings.push({ rule: 'phase-absent-undecided', line: seq.line,
          text: `phase ${p}${phase.title ? ` (${phase.title})` : ''} — ${absent.map((a) => `"${a}"`).join(', ')} undecided, not found in the end-to-end sequence; kept as a warning (--undecided warn) — answer the judge locally and re-run` });
        else if (absent.length) row.findings.push({ rule: 'phase-absent', line: seq.line,
          text: `phase ${p}${phase.title ? ` (${phase.title})` : ''} is not in the end-to-end sequence — it names ${absent.map((a) => `"${a}"`).join(', ')}, which the sequence does not${absent.some((a) => undecided.has(a)) ? ` (undecided: ${absent.filter((a) => undecided.has(a)).map((a) => `"${a}"`).join(', ')} may be another spelling of a participant — answer the judge and re-run)` : ''}`,
          why: 'Either the flow does not run that phase and its phase list is long, or the sequence stops short of it. Both are live; the two statements cannot both be right.' });
      }
    }
    if (row.findings.length) result.status = 'FAIL';
    result.flows.push(row);
  }

  // phases-prose: the `**Phases**:` line carries the phase list and, at most, a short parenthetical mode ("(síncrono)").
  // Anything after it is prose the ledger drops and no reader looks for — the reference hid a history note there
  // ("La fase 10 no la dispara el cliente: …"). It belongs in the flow block's body, or in the changelog.
  src.split('\n').forEach((l, i) => {
    const m = l.match(/^\s*\*\*(?:Phases|Fases)(?::\*\*|\*\*:)\s*(.*)$/i); if (!m) return;
    const v = m[1].trim();
    const list = v.match(/^[\w.–—-]+(?:\s*(?:→|->|,)\s*[\w.–—-]+)*/u);
    let rest = list ? v.slice(list[0].length).trim() : v;
    const paren = rest.match(/^\(([^)]*)\)/);
    const tooLong = paren && paren[1].trim().split(/\s+/).length > PHASES_PAREN_WORDS;
    if (paren) rest = rest.slice(paren[0].length).trim();
    rest = rest.replace(/^[.;]\s*$/, '');
    if (!list || rest || tooLong) { result.status = 'FAIL'; (result.phaseFindings = result.phaseFindings || []).push({ rule: 'phases-prose', line: i + 1,
      text: `the **Phases** line carries prose after the phase list${tooLong ? ` (a ${paren[1].trim().split(/\s+/).length}-word parenthetical; ≤ ${PHASES_PAREN_WORDS})` : ''}: "${(rest || (paren ? paren[0] : v)).replace(/^[.;:\s]+/, "").slice(0, 120)}" — keep the line to the list and a short mode, and move the note into the flow block's body (history goes to docs/CHANGELOG.md)` }); }
  });

  // one warning per block, not per number a range covers; and an orphan means nothing when no flow
  // declares any phase at all — that is `phases-undeclared`, already reported once per flow
  const seen = new Set(); const noHops = [];
  Object.values(catalog).forEach((p) => {
    if (seen.has(p.line)) return; seen.add(p.line);
    if (!/^\*\*(Hops|Saltos)\*\*/mi.test(p.body || '')) noHops.push(p);
    if (!isSequence(p.fence)) { result.status = 'FAIL'; (result.phaseFindings = result.phaseFindings || []).push({ rule: 'phase-undrawn', line: p.line, text: `phase ${p.n} (${p.title}) carries no sequenceDiagram — the panel is the source of every derived end-to-end sequence; draw it (numbered steps in business intent, participants by canonical name)` }); }
    else if (declared.size && !p.n.split(/[–—-]/).some((x) => declared.has(x.toLowerCase()))) result.warnings.push({ rule: 'phase-orphan', line: p.line, text: `phase ${p.n} (${p.title}) is declared by no flow — a dead phase, or a flow that forgot it` });
  });
  // a corpus written before the Hops line has none anywhere — one line says so; a corpus that dropped a few names them
  if (noHops.length && noHops.length === seen.size) result.warnings.push({ rule: 'phase-hops-missing', line: noHops[0].line, text: `no phase in the catalog carries a **Hops** line (${noHops.length}/${seen.size}) — the per-phase diagram is the optional half of the contract, the Hops line is the mandatory one` });
  else noHops.forEach((p) => result.warnings.push({ rule: 'phase-hops-missing', line: p.line, text: `phase ${p.n} (${p.title}) has no **Hops** line — the per-phase diagram is the optional half of the contract, this is the mandatory one` }));
  return result;
}

function render(r) {
  if (r.status === 'SKIP') return `Flow check — ${r.warnings[0].text}`;
  const out = [`Flow check — ${r.file}: ${r.flows.length} documented flow(s)`];
  r.flows.forEach((f) => {
    out.push(`  ${f.code} — ${f.name}${f.phases.length ? ` (phases ${f.phases.join(' → ')})` : ''}: ${f.findings.length ? 'FAIL' : '✓'}`);
    f.findings.forEach((x) => { out.push(`    ✗ [${x.rule}]${x.line ? ` line ${x.line}` : ''}: ${x.text}`); out.push(`      ${x.why}`); });
  });
  (r.phaseFindings || []).forEach((x) => out.push(`  ✗ [${x.rule}] line ${x.line}: ${x.text}`));
  r.warnings.forEach((w) => out.push(`  ⚠ [${w.rule}]${w.line ? ` line ${w.line}` : ''}: ${w.text}`));
  const n = r.flows.reduce((a, f) => a + f.findings.length, 0) + (r.phaseFindings || []).length;
  out.push(r.status === 'PASS' ? 'PASS' : `FAIL — ${n} finding(s). A flow whose two statements disagree cannot carry numbered cuts, and its handoff kit inherits the disagreement.`);
  return out.join('\n');
}

// the CLI, callable from the old path under architecture-docs/scripts/ as well
async function main(args) {
  const root = args.find((a, i) => !a.startsWith('--') && !['--judge', '--undecided'].includes(args[i - 1]));
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!root) { console.error('Usage: bun flow-check.js <project-root> [--json] [--warn-only] [--judge agent|typesafe|clef] [--undecided warn]'); process.exit(2); }
  if (opt('--undecided') !== undefined && opt('--undecided') !== 'warn') { console.error('flow-check: --undecided takes warn'); process.exit(2); }
  let r; try { r = await check(path.resolve(root), { judge: opt('--judge'), undecided: opt('--undecided') }); } catch (e) { console.error('flow-check: ' + e.message); process.exit(2); }
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.status === 'FAIL' && !args.includes('--warn-only') ? 1 : 0);
}

module.exports = { check, render, sectionBody, blocksIn, participants, main };

if (require.main === module) main(process.argv.slice(2));
