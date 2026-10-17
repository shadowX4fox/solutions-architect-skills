#!/usr/bin/env node
// diagram-prepare.js — the payload of Workflow 1 Step 7.1: what the four standard diagrams are written from.
//
//   bun diagram-prepare.js <project-root> [--lang en|es] [--out <file>] [--json]
//
// Step 7.1 told its writer to load DIAGRAM-GENERATION-GUIDE.md (83 KB) and MERMAID_DIAGRAMS_GUIDE.md, and to read
// docs/03, docs/04 and docs/05 in full. On the 8.89.0 control run the sub-agent that drew the diagrams read the guide
// in six chunks (~65 KB), 07-diagrams.md (17 KB), the design standard (~50 KB), the SOURCE of mermaid-check.js and
// label-check.js (23 KB, to learn what they check) and the documents with cat / sed (~50 KB): 37 calls, the most
// expensive sub-agent of the run. This cuts, by code:
//
//   spec       07-diagrams.md: the four diagrams' requirements (Step 7.1) and the completeness audit (Step 7.3)
//   guide      DIAGRAM-GENERATION-GUIDE.md by heading: Design Language Governance, Architecture Type Adaptation, each
//              diagram's structure, template, palette and data sources, the pre-write checklist (with the Connection
//              Label Check). Not the 18 KB Connection Naming Rule — the label registry below is what label-check.js enforces.
//              Governed mode drops the C4 colour conventions and the theme sections; fallback mode keeps them.
//   standard   governed mode: llms-mermaid.txt of the document's language — the skeleton, the canonical block (the
//              palette directive, pasted verbatim) and the self-check — and the rule titles M-01…M-21
//   labels     `label-check.js --registry` and `--expression`: the protocols, styles and Action Types a label may use
//   facts      the type; systems; containers with system, layer, type, technology; layers; integrations — by code
//   sources    the HLD verbatim when it is Mermaid; docs/03's outline with line numbers (where the diagrams go)
//   after      the commands that check the write — run them, never read their source
//
// Output: `.cache/sa-skills/payloads/diagrams.md` (or --out) with a manifest of what went in and what was missing.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));

const SKILL = path.join(__dirname, '..');
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const kb = (n) => (Buffer.byteLength(n) / 1024).toFixed(1) + ' KB';

// A heading's block: the heading through the next heading of the same or a higher level; `drop` removes named subsections
function block(src, heading, drop = []) {
  const lines = src.split('\n');
  const s = lines.findIndex((l) => l.startsWith(heading));
  if (s < 0) return null;
  const lvl = lines[s].match(/^#+/)[0].length;
  let e = lines.length;
  for (let i = s + 1; i < lines.length; i++) { const m = lines[i].match(/^(#+)\s/); if (m && m[1].length <= lvl) { e = i; break; } }
  let out = lines.slice(s, e);
  for (const d of drop) {
    const i = out.findIndex((l) => l.startsWith(d)); if (i < 0) continue;
    const dl = out[i].match(/^#+/)[0].length; let j = out.length;
    for (let k = i + 1; k < out.length; k++) { const m = out[k].match(/^(#+)\s/); if (m && m[1].length <= dl) { j = k; break; } }
    out = out.slice(0, i).concat([`<!-- ${out[i].replace(/^#+\s*/, '')}: left out of the payload -->`], out.slice(j));
  }
  return out.join('\n').trim();
}
const between = (src, from, to) => { const a = src.indexOf(from); if (a < 0) return null; const b = to ? src.indexOf(to, a + from.length) : -1; return src.slice(a, b < 0 ? undefined : b).trim(); };

function prepare(root, opts = {}) {
  root = path.resolve(root);
  const parts = [], included = [], missing = [];
  const add = (title, text, src) => { if (!text) return missing.push(title); parts.push(`\n\n---\n\n# ▸ ${title}${src ? `\n\n<!-- source: ${src} -->` : ''}\n\n${text}`); included.push(`${title} (${kb(text)})`); };
  const facts = collect(root);
  let collectRec = {}; try { collectRec = JSON.parse(read(path.join(root, '.cache', 'sa-skills', 'collect.json'))); } catch { /* optional */ }
  const lang = opts.lang || collectRec.doc_language || (facts.architecture && facts.architecture.doc_language) || 'en';
  const type = collectRec.architecture_type || (facts.architecture && facts.architecture.type) || 'Not documented';
  const PACKS = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'packs.js'));
  const dl = PACKS.designLanguageDir({ project: root }) || PACKS.BUNDLED['design-language'];   // the folder in force — an institution pack's, else the base's own (scripts/shared/packs.js)
  const governed = exists(path.join(dl, 'llms-rules.txt'));

  // 1. the spec — what Step 7 asks of the four diagrams, and the audit the write must pass
  const w = read(path.join(SKILL, 'workflow1', '07-diagrams.md'));
  add('Step 7.1 — the four standard diagrams', between(w, '**Generate all 4 standard diagrams**', '**Generate Data Flow Diagrams**'), 'workflow1/07-diagrams.md');
  add('Step 7.3 — the completeness audit the write must pass', block(w, '##### Step 7.3'), 'workflow1/07-diagrams.md');

  // 2. the generation guide, by heading
  const g = read(path.join(SKILL, 'references', 'DIAGRAM-GENERATION-GUIDE.md'));
  const colour = governed ? ['### Color Conventions'] : [];
  if (governed) add('Design Language Governance (governed mode — supersedes the per-diagram formats below)', block(g, '## Design Language Governance'), 'references/DIAGRAM-GENERATION-GUIDE.md');
  add('Architecture Type Adaptation', block(g, '## Architecture Type Adaptation'), 'references/DIAGRAM-GENERATION-GUIDE.md');
  add('Diagram 1 — Logical View', block(g, '## Diagram 1 — Logical View'), 'references/DIAGRAM-GENERATION-GUIDE.md');
  add('Diagram 2 — C4 Level 1 System Context', block(g, '## Diagram 2 — C4 Level 1', colour), 'references/DIAGRAM-GENERATION-GUIDE.md');
  add('Diagram 3 — C4 Level 2 Container', block(g, '## Diagram 3 — C4 Level 2', ['### Connection Naming Rule'].concat(colour)), 'references/DIAGRAM-GENERATION-GUIDE.md');
  add('Diagram 4 — Detailed View', block(g, '## Diagram 4 — Detailed View'), 'references/DIAGRAM-GENERATION-GUIDE.md');
  add('Pre-Write Validation', block(g, '## Pre-Write Validation'), 'references/DIAGRAM-GENERATION-GUIDE.md');
  if (!governed) add('Theme (fallback mode)', block(g, '## Theme Preference Detection'), 'references/DIAGRAM-GENERATION-GUIDE.md');

  // 3. the design standard's Mermaid contract, in the document's language — one edition, never both
  if (governed) {
    const f = path.join(dl, lang === 'es' ? 'es' : '', 'llms-mermaid.txt');
    if (exists(f)) {
      const m = read(f);
      const secs = m.split('\n').filter((l) => /^## \d+\./.test(l));
      const pick = (n) => { const h = secs.find((l) => l.startsWith(`## ${n}.`)); return h ? block(m, h) : null; };
      const rules = m.split('\n').filter((l) => /^### M-\d+/.test(l)).map((l) => '- ' + l.replace(/^###\s*/, '')).join('\n');
      add('Mermaid contract — skeleton (§3)', pick(3), path.relative(SKILL, f));
      add('Mermaid contract — the canonical block to paste (§9): the palette directive is copied verbatim, never typed', pick(9), path.relative(SKILL, f));
      add('Mermaid contract — self-check before emitting (§10)', pick(10), path.relative(SKILL, f));
      add('Mermaid contract — the rules, by title (mermaid-check.js enforces them)', rules, path.relative(SKILL, f));
    } else missing.push('llms-mermaid.txt for ' + lang);
  }

  // 4. the label registry label-check.js enforces
  try {
    const run = (flag) => execFileSync(process.execPath, [path.join(__dirname, 'label-check.js'), flag], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    add('Connection label registry (label-check.js --registry and --expression)', '```json\n' + run('--registry') + '\n```\n\nExpression:\n\n```\n' + run('--expression') + '\n```', 'scripts/label-check.js');
  } catch (e) { missing.push('label registry: ' + String(e.message).split('\n')[0]); }

  // 5. facts, by code
  const table = (headers, rows) => rows.length ? `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map((c) => String(c == null || c === '' ? '—' : c).replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}` : null;
  const layerOf = new Map(); facts.layers.forEach((l) => l.containers.forEach((c) => layerOf.set(c, `${l.n} — ${l.name}`)));
  const sysName = new Map(facts.systems.map((s) => [s.slug, s.name]));
  add('Architecture', `**Type**: ${type}\n**Document language**: ${lang} (node labels, participants and notes in it; the four \`#### Diagram:\` headings, Mermaid keywords and classDef role names in English)\n**Mode**: ${governed ? 'governed — the design standard is bundled' : 'fallback — no design-language folder'}`);
  add('Facts — systems', table(['System', 'Owned', 'Type', 'Containers'], facts.systems.map((s) => [s.name, s.owned ? 'internal' : 'external', s.type, s.containers.length])), 'arch-facts.js');
  add('Facts — containers (canonical names — write them exactly)', table(['Container', 'System', 'Layer', 'C4 type', 'Technology', 'Internal name'], facts.components.filter((c) => c.level === 'L2').map((c) => [c.name, sysName.get(c.system) || c.system, layerOf.get(c.name) || '', c.type, (c.technology || []).join(', '), c.internal_name || ''])), 'component-cli.ts list via arch-facts.js');
  add('Facts — layers (docs/03 § 4.1)', table(['#', 'Layer', 'Containers', 'Inside the boundary'], facts.layers.map((l) => [l.n, l.name, l.containers.join(', '), l.owned ? 'yes' : 'no'])), 'arch-facts.js');
  add('Facts — integrations (docs/05) — edges and their labels', table(['#', 'From', 'To', 'Protocol', 'Pattern', 'Boundary'], facts.integrations.filter((i) => !i.retired).map((i) => [i.id, i.from, i.to, i.protocol, i.pattern, i.boundary])), 'arch-facts.js');

  // 6. sources
  const hld = collectRec.hld && collectRec.hld.path ? path.join(root, collectRec.hld.path) : null;
  if (hld && exists(hld) && (collectRec.hld.format === 'mermaid')) add('HLD — the architect\'s Mermaid (a reference for wiring and grouping; the house rules above govern the output)', '```\n' + read(hld).trim() + '\n```', collectRec.hld.path);
  const d03 = path.join(root, 'docs', '03-architecture-layers.md');
  if (exists(d03)) add('docs/03-architecture-layers.md — outline (the diagrams go under `## Architecture Diagrams`; insert, never rewrite the file)', read(d03).split('\n').map((l, i) => (/^#{1,4}\s/.test(l) ? `${String(i + 1).padStart(4)}  ${l}` : null)).filter(Boolean).join('\n'), 'docs/03-architecture-layers.md');
  else missing.push('docs/03-architecture-layers.md');

  // 7. after the write
  add('After the write — run these; read their output, never their source', [
    '```bash',
    `bun [plugin_dir]/skills/architecture-docs/scripts/mermaid-check.js ${root}/docs/03-architecture-layers.md`,
    `bun [plugin_dir]/skills/architecture-docs/scripts/label-check.js ${root}/docs/03-architecture-layers.md`,
    `bun [plugin_dir]/skills/architecture-docs/scripts/flow-compose.js ${root}`,
    `bun [plugin_dir]/skills/architecture-docs/scripts/flow-check.js ${root}`,
    `bun [plugin_dir]/skills/architecture-docs/scripts/mermaid-check.js ${root}/docs/04-data-flow-patterns.md`,
    '```',
    'A finding names the block and the line: fix it with Edit at that line and run the check again.',
  ].join('\n'));

  const manifest = `# Diagrams payload — Workflow 1 Step 7.1\n\n| | |\n|---|---|\n| Target | \`docs/03-architecture-layers.md\` → \`## Architecture Diagrams\` (the four standard diagrams) |\n| Type · language · mode | ${type} · ${lang} · ${governed ? 'governed' : 'fallback'} |\n| Included | ${included.length} blocks |\n| Missing | ${missing.length ? missing.join('; ') : 'none'} |\n\nWrite from this payload. Do not read DIAGRAM-GENERATION-GUIDE.md, MERMAID_DIAGRAMS_GUIDE.md, the design standard, the scripts or the documents whole — what they hold for this step is below. A fact that is not here is a gap to report, never to invent.`;
  const text = manifest + parts.join('') + '\n';
  return { text, included, missing, bytes: Buffer.byteLength(text) };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun diagram-prepare.js <project-root> [--lang en|es] [--out <file>] [--json]'); process.exit(2); }
  let r; try { r = prepare(args[0], { lang: opt('--lang') }); } catch (e) { console.error('diagram-prepare: ' + e.message); process.exit(2); }
  if (args.includes('--json')) { process.stdout.write(JSON.stringify(r, null, 1) + '\n'); process.exit(0); }
  const out = opt('--out') || path.join(path.resolve(args[0]), '.cache', 'sa-skills', 'payloads', 'diagrams.md');
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, r.text);
  console.error(`Wrote ${out} (${(r.bytes / 1024).toFixed(1)} KB)\nIncluded (${r.included.length}):\n  - ${r.included.join('\n  - ')}` + (r.missing.length ? `\nMissing (${r.missing.length}):\n  - ${r.missing.join('\n  - ')}` : ''));
}

module.exports = { prepare, block };
