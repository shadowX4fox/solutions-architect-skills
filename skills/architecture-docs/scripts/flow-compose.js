#!/usr/bin/env node
// flow-compose.js — the end-to-end sequence of every flow, derived from the phases it declares.
//
//   bun flow-compose.js <project-root> [--check] [--dry-run] [--json]
//
// docs/04 used to state each flow twice by hand: the phases its block names, and a "complete" sequence
// drawn separately under § End-to-End Wire Sequences. flow-check.js found the two disagreeing on five of
// six flows of the reference project — a phase declared and never drawn, a sequence that stopped short.
// This script makes the second statement a derivation of the first, so the disagreement cannot exist:
//
//   for each flow in the Flow Inventory, in order:
//     the phases its block declares (`**Phases**: 1 → 2 → 4`), each one's Phase Catalog sequenceDiagram,
//     concatenated — participants unioned in order of first appearance, every numbered step relabelled
//     `N.M` (phase N, the panel's own step M), every unnumbered return carried as it is, the §9 palette
//     directive copied verbatim from the first panel that carries one.
//
// Every message in the result traces to a step of a panel; nothing is composed by anyone. `4.2` in the
// main image of F-01 is the same step of the same panel as `4.2` in F-03 — one identity, the phase's own
// number, so the catalogue the reader jumps to is the Phase Catalog and not a second numbering. A
// non-monotonic run (`6.1 … 7.1 … 4.1`) is information, not an error: this flow ends on the phase others
// start with, and the flow block's Phases line right above says so.
//
// The section is written in place (created after Use Case Resolutions when absent) and marked DERIVED;
// `--check` writes nothing and exits 1 when the file's section differs from the derivation — the gate
// the release check (architecture-lifecycle) and CI run — and `--dry-run` prints the derivation. Parsing is flow-check.js's: the same
// level-agnostic walkers, so the composer cannot see a document differently from the check.
'use strict';
const fs = require('fs');
const path = require('path');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));
const { sectionBody, blocksIn } = require(path.join(__dirname, 'flow-check.js'));

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n") : '');
const docFile = (root, prefix) => { const dir = path.join(root, 'docs'); if (!fs.existsSync(dir)) return null; const f = fs.readdirSync(dir).find((n) => n.startsWith(prefix) && n.endsWith('.md')); return f ? path.join(dir, f) : null; };
const MARK = '<!-- DERIVED: flow-compose.js — each sequence below is the concatenation of the Phase Catalog panels its flow declares, steps relabelled N.M (phase N, step M). Do not hand-edit: change the panel or the flow\'s Phases line and re-run. -->';
const S = {
  en: { kept: { 'no-phases': '*Hand-authored — kept: the flow declares no phases to derive from (see flow-check).*', 'no-panels': '*Hand-authored — kept: the phases this flow declares carry no sequenceDiagram in the Phase Catalog, so nothing derives (see flow-check).*' }, heading: (n, name) => `Flow ${n} — ${name} (full wire sequence)`, from: (ph) => `*Derived from phases ${ph.join(' → ')} of the Phase Catalog.*`, none: 'the flow declares no phases — add a `**Phases**:` line to its block and re-run', nopanel: (n) => `phase ${n} has no sequenceDiagram in the Phase Catalog`, section: 'End-to-End Wire Sequences' },
  es: { kept: { 'no-phases': '*Dibujada a mano — conservada: el flujo no declara fases de las que derivar (ver flow-check).*', 'no-panels': '*Dibujada a mano — conservada: las fases que este flujo declara no tienen sequenceDiagram en el Catálogo de Fases, así que nada se deriva (ver flow-check).*' }, heading: (n, name) => `Flujo ${n} — ${name} (secuencia completa)`, from: (ph) => `*Derivada de las fases ${ph.join(' → ')} del Catálogo de Fases.*`, none: 'el flujo no declara fases — añade una línea `**Phases**:` a su bloque y vuelve a ejecutar', nopanel: (n) => `la fase ${n} no tiene sequenceDiagram en el Catálogo de Fases`, section: 'Secuencias Extremo a Extremo' },
};

// ---- one fence from many: the directive once, participants unioned, steps relabelled by phase
const DIRECTIVE = /^%%\{[\s\S]*?\}%%\s*\n/;
const MSG = /^(\s*)(\S+?)\s*(-{1,2}>>|-{1,2}>|-{1,2}x|-{1,2}\))\s*(\S+?)\s*:\s*(?:(\d+)\.\s+)?(.*)$/;
function compose(phaseNums, catalog) {
  // Panels are authored one at a time, so the same component is `DGACP` in one and `DR` in another. The
  // union is by display name — the canonical component name — and every later alias for a name already
  // declared is rewritten to the first, in the messages too. A participant is one lifeline, however many
  // spellings its panels gave it.
  const byName = new Map(), decl = [], body = [], missing = [];
  let directive = null, count = 0;
  for (const n of phaseNums) {
    const p = catalog[String(n).toLowerCase()];
    if (!p || !p.fence) { missing.push(n); continue; }
    let f = p.fence;
    const d = f.match(DIRECTIVE); if (d) { if (!directive) directive = d[0].trimEnd(); f = f.slice(d[0].length); }
    const alias = {};   // this panel's alias → the alias the composition uses
    const canon = (a) => alias[a] || a;
    for (const raw of f.split('\n')) {
      const l = raw.replace(/\s+$/, '');
      if (!l.trim() || /^\s*sequenceDiagram\b/.test(l) || /^\s*%%/.test(l) || /^\s*autonumber\b/.test(l)) continue;
      const pm = l.match(/^\s*(participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/);
      if (pm) { const name = (pm[3] || pm[2]).trim(); const seen = byName.get(name); if (seen) alias[pm[2]] = seen; else { byName.set(name, pm[2]); decl.push(l.trim()); } continue; }
      const m = l.match(MSG);
      if (m) { const [, , a, arrow, b, num, txt] = m; body.push(`  ${canon(a)}${arrow}${canon(b)}: ${num ? `${p.n}.${num} ` : ''}${txt}`); count++; continue; }
      body.push('  ' + l.trim());   // loop / alt / else / end and anything else the panel carries, verbatim
    }
  }
  const parts = { size: byName.size, values: () => decl };
  const lines = [];
  if (directive) lines.push(directive);
  lines.push('sequenceDiagram', ...[...parts.values()].map((x) => '  ' + x), ...body);
  return { fence: lines.join('\n'), messages: count, participants: parts.size, missing };
}

function derive(root, opts = {}) {
  const file = docFile(root, '04-');
  if (!file) throw new Error('docs/04-*.md not found');
  const src = read(file);
  const facts = opts.facts || collect(root);
  // The language: ARCHITECTURE.md's DOC_LANGUAGE marker when it exists — but Workflow 1 stamps that file LAST,
  // and this script runs the moment docs/04 is written, so on a fresh architecture the marker is not there yet.
  // The controlled run on 8.30.0 composed seven Spanish flows under English headings that way, and --check
  // reported DRIFT once the marker landed. Absent the marker, docs/04 says its own language: its Phase Catalog
  // heading is either "Phase Catalog" or "Catálogo de Fases".
  const catalogPart = sectionBody(src, 'Phase Catalog', /^(Phase Catalog|Cat[aá]logo de Fases)/i);
  const marker = (read(path.join(root, 'ARCHITECTURE.md')).match(/<!--\s*(?:DOC_)?LANGUAGE:\s*([a-z]{2})/i) || [])[1];
  const lang = marker ? marker.toLowerCase() : (catalogPart && /Cat[aá]logo de Fases|Fases/i.test(src.split('\n')[catalogPart.startLine - 1] || '') ? 'es' : (facts.architecture.language || 'en')), T = S[lang] || S.en;
  if (!catalogPart) throw new Error(`${path.relative(root, file)} has no Phase Catalog — nothing to derive from (a docs/04 in the single-flow layout states each flow once, and that statement stands)`);
  const catalog = blocksIn(catalogPart, 'Phase|Fase');
  const level = catalogPart.level, H = '#'.repeat(level), h = '#'.repeat(level + 1);

  // what the section holds today, per flow — a hand-authored sequence the derivation cannot replace is KEPT,
  // never overwritten with a gap marker: a flow whose Phases line is prose (flow-check: phases-undeclared)
  // still has a valid diagram, and destroying it to say "not documented" would be the tool making the
  // document worse. The receipt names every kept block; the finding that unlocks its derivation is flow-check's.
  const existingPart = sectionBody(src, 'End-to-End Wire Sequences', /(End-to-End|Extremo a Extremo)/i);
  const existingBlocks = blocksIn(existingPart, 'Flow|Flujo');
  const flows = [];
  const blocks = (facts.flows || []).map((f) => {
    const row = { code: `F-${String(f.code).padStart(2, '0')}`, name: f.name, phases: f.phases, messages: 0, participants: 0, missing: [] };
    const num = String(f.code).toLowerCase();
    const prior = existingBlocks[num];
    const c = f.phases.length ? compose(f.phases, catalog) : null;
    let out = `${h} ${T.heading(f.code, f.name)}\n\n`;
    if (!c || !c.messages) {
      row.gap = !c ? 'no-phases' : 'no-panels';
      if (prior && prior.fence) { row.kept = true; out += T.kept[row.gap] + '\n\n```mermaid\n' + prior.fence + '\n```\n'; }   // the line says which of the two it was — on a fresh corpus it is always the panels
      else out += `[NOT DOCUMENTED — ${!c ? T.none : T.nopanel(f.phases.join(', '))}]\n`;
    } else {
      Object.assign(row, { messages: c.messages, participants: c.participants, missing: c.missing });
      out += `${T.from(f.phases)}\n\n`;
      if (c.missing.length) out += c.missing.map((n) => `[NOT DOCUMENTED — ${T.nopanel(n)}]`).join('\n') + '\n\n';
      out += '```mermaid\n' + c.fence + '\n```\n';
    }
    flows.push(row);
    return out.trimEnd();
  });
  const existingHeading = existingPart ? (src.split('\n')[existingPart.startLine - 1] || '').replace(/^#+\s+/, '').replace(/\s*<!--[\s\S]*$/, '').trim() : null;
  const sectionMd = `${H} ${existingHeading || T.section} <!-- SECTION: End-to-End Wire Sequences -->\n\n${MARK}\n\n${blocks.join('\n\n')}\n`;   // an existing section keeps its visible heading — the anchor is the identity, the text is the author's

  // splice: replace the existing section's whole extent, or create it right after the Phase Catalog
  const lines = src.split('\n');
  const existing = sectionBody(src, 'End-to-End Wire Sequences', /(End-to-End|Extremo a Extremo)/i);
  let next, action;
  if (existing) {
    const start = existing.startLine - 1;
    let end = lines.length; for (let i = start + 1; i < lines.length; i++) { const m = lines[i].match(/^(#{1,6})\s/); if (m && m[1].length <= existing.level) { end = i; break; } }
    next = lines.slice(0, start).join('\n').replace(/\s+$/, '') + '\n\n' + sectionMd + (end < lines.length ? '\n' + lines.slice(end).join('\n') : '');
    action = 'replaced';
  } else {
    // where the guide puts it: after Use Case Resolutions (the last of the flow family), else straight after the catalog
    const anchorPart = sectionBody(src, 'Use Case Resolutions', /Use Case Resolution|Resoluci[oó]n de Casos de Uso/i) || catalogPart;
    const start = anchorPart.startLine - 1;
    let end = lines.length; for (let i = start + 1; i < lines.length; i++) { const m = lines[i].match(/^(#{1,6})\s/); if (m && m[1].length <= anchorPart.level) { end = i; break; } }
    next = lines.slice(0, end).join('\n').replace(/\s+$/, '') + '\n\n' + sectionMd + (end < lines.length ? '\n' + lines.slice(end).join('\n') : '');
    action = 'created';
  }
  if (!next.endsWith('\n')) next += '\n';
  return { file, rel: path.relative(root, file), lang, action, changed: next !== src, sectionMd, next, flows, phasesWithPanel: Object.values(catalog).filter((p) => p.fence).length };
}

function receipt(r) {
  const out = [`Flow compose — ${r.rel} (${r.lang}): § End-to-End Wire Sequences ${r.action}, ${r.flows.length} flow(s) from ${r.phasesWithPanel} phase panel(s)`];
  r.flows.forEach((f) => out.push(`  ${f.code} — ${f.name}: ${f.kept ? `KEPT hand-authored — ${f.gap === 'no-phases' ? 'no phases declared' : 'declared phases carry no panel'}, nothing to derive from` : f.gap === 'no-phases' ? 'no phases declared → [NOT DOCUMENTED]' : f.gap === 'no-panels' ? 'declared phases carry no panel → [NOT DOCUMENTED]' : `${f.phases.join(' → ')} → ${f.messages} messages, ${f.participants} participants`}${f.missing.length ? ` (no panel for phase ${f.missing.join(', ')})` : ''}`));
  return out.join('\n');
}

module.exports = { derive, compose, MARK };

if (require.main === module) {
  const args = process.argv.slice(2);
  const root = args.find((a) => !a.startsWith('--'));
  if (!root) { console.error('Usage: bun flow-compose.js <project-root> [--check] [--dry-run] [--json]'); process.exit(2); }
  let r; try { r = derive(path.resolve(root)); } catch (e) { console.error('flow-compose: ' + e.message); process.exit(2); }
  if (args.includes('--json')) { console.log(JSON.stringify({ file: r.rel, lang: r.lang, action: r.action, changed: r.changed, flows: r.flows }, null, 1)); }
  if (args.includes('--dry-run')) { console.log(r.sectionMd); console.error(receipt(r)); process.exit(0); }
  if (args.includes('--check')) { console.error(receipt(r)); console.error(r.changed ? `DRIFT — the section in ${r.rel} is not the derivation of its Phase Catalog. Run flow-compose.js without --check to rewrite it.` : 'IN SYNC — the section is the derivation of its Phase Catalog.'); process.exit(r.changed ? 1 : 0); }
  if (r.changed) fs.writeFileSync(r.file, r.next);
  console.error(receipt(r)); console.error(r.changed ? `Wrote ${r.rel}` : `${r.rel} unchanged — already the derivation`);
}
