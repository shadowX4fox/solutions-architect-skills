#!/usr/bin/env node
// integration-check.js — docs/05 held to the HLD it was written from, and its Protocol cells to the label grammar.
//
//   bun integration-check.js <project-root> [--hld <file>] [--json]
//
// Two checks, both by code (8.93.0, from the 8.92.7 control run, whose report handed the user "three HLD connections are not in
// docs/05 and stayed out of the diagrams; I-01, I-12 and I-20 differ in type or direction; ten Protocol cells do not use the
// registered form" — found by reading, after the diagrams had been drawn from docs/05):
//
//   hld        every edge of a Mermaid HLD against the docs/05 inventory, by the nodes' display names (canonical names in both):
//              `missing` — the HLD connects A → B and no I-nn row does, either way;
//              `reversed` — a row connects them the other way;
//              `action` — the row's [Action Type] is not the HLD edge's;
//              `not-in-hld` — a row between two nodes the HLD draws, with no edge between them (information).
//              WARNING: the HLD is design input, not held to the house conventions, and an architecture may depart from it —
//              each finding is a departure to state or a row to add, never silent. A PDF / PNG / SVG HLD is skipped.
//   protocol   every Protocol cell of an I-nn row against §5.3–§5.4 of the design standard in force, the registries read
//              at run time by label-check.js from rules-registry.json (never transcribed). BLOCKING in governed mode; skipped in fallback mode.
//
// The HLD comes from --hld, else `.cache/sa-skills/collect.json` `hld.path`, else docs/01's `<!-- HLD_SOURCE: … -->`.
// Exit 1 on a BLOCKING finding.
'use strict';
const fs = require('fs');
const path = require('path');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));
const { registries, judge, DEFAULT_DL } = require(path.join(__dirname, 'label-check.js'));

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const norm = (v) => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[`*_]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// a docs/05 endpoint cell may name several nodes: `A` y `B`, `A` and `B`, `A`, `B`
const names = (cell) => {
  const ticks = [...String(cell || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  // backticked names are the names; bare text splits on commas and " + " only — " y " / " and " live inside names
  return (ticks.length ? ticks : String(cell || '').split(/\s*(?:,|\s\+\s)\s*/)).map((x) => x.trim()).filter(Boolean);
};
const actionOf = (label) => (String(label || '').match(/\[([^\]]+)\]/) || [])[1] || null;

function hldPath(root, opt) {
  const t = hldSource(root, opt); if (!t || isMermaid(t)) return t;
  const tr = transcriptionOf(t); return fs.existsSync(tr) ? tr : t;
}
function hldSource(root, opt) {
  if (opt) return path.resolve(root, opt);
  try { const c = JSON.parse(read(path.join(root, '.cache', 'sa-skills', 'collect.json'))); const h = c.hld && (c.hld.path || c.hld); if (typeof h === 'string') return path.resolve(root, h); } catch { /* no collection */ }
  try { const d = fs.readdirSync(path.join(root, 'docs')).find((f) => /^01-.*\.md$/.test(f)); const m = d && read(path.join(root, 'docs', d)).match(/<!--\s*HLD_SOURCE:\s*([^>]*?)\s*-->/); if (m) return path.resolve(root, m[1]); } catch { /* no docs/01 */ }
  return null;
}

// the nodes and edges of every flowchart / graph block of a Mermaid HLD (a .mmd, or the ```mermaid fences of a .md)
function parseHld(src) {
  const blocks = /```mermaid/.test(src) ? [...src.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]) : [src];
  const nodes = {}, edges = [];
  const NODE = /([A-Za-z_][\w-]*)\s*(?:\[\(|\(\[|\[\[|\(\(|\[|\(|\{\{|\{|>)\s*"?([^"\]\)\}]+?)"?\s*(?:\)\]|\]\)|\]\]|\)\)|\]|\)|\}\}|\})/g;
  const EDGE = /([A-Za-z_][\w-]*)(?:\s*(?:\[\(|\(\[|\[\[|\(\(|\[|\(|\{)[^\]\)\}]*(?:\)\]|\]\)|\]\]|\)\)|\]|\)|\}))?\s*(<?[-.=]{2,}>?|<?-\.->?)\s*(?:\|"?([^|"]*)"?\|\s*)?([A-Za-z_][\w-]*)/g;
  blocks.filter((b) => !/^\s*C4\w+/m.test(b)).forEach((b) => b.split('\n').forEach((raw, i) => {
    const l = raw.replace(/%%.*$/, '');
    if (/^\s*(classDef|class|style|linkStyle|click|subgraph|end\b|flowchart|graph|%%|\s*$)/.test(l) && !/-->|-\.->|==>/.test(l)) {
      const sg = l.match(/^\s*subgraph\s+([\w-]+)\s*\[\s*"?([^"\]]+)"?\s*\]/); if (sg) nodes[sg[1]] = { name: sg[2].trim(), subgraph: true };
      return;
    }
    for (const m of l.matchAll(NODE)) if (!nodes[m[1]] || nodes[m[1]].subgraph) nodes[m[1]] = { name: m[2].trim() };
    for (const m of l.matchAll(EDGE)) {
      const arrow = m[2]; if (!/>/.test(arrow)) continue;
      const back = arrow.startsWith('<') && !arrow.endsWith('>');
      edges.push({ from: back ? m[4] : m[1], to: back ? m[1] : m[4], label: (m[3] || '').trim(), line: i + 1, both: arrow.startsWith('<') && arrow.endsWith('>') });
    }
  }));
  blocks.filter((b) => /^\s*C4\w+/m.test(b)).forEach((b) => parseC4(b, nodes, edges));
  return { nodes, edges: edges.filter((e) => nodes[e.from] && nodes[e.to] && !nodes[e.from].subgraph && !nodes[e.to].subgraph).map((e) => ({ ...e, fromName: nodes[e.from].name, toName: nodes[e.to].name })) };
}

// C4 blocks: `Container(id, "Label", …)`, `System_Ext(id, "Label")`, `ContainerDb(…)`, `Person(…)` and `Rel(a, b, "label", …)`
function parseC4(src, nodes, edges) {
  src.split('\n').forEach((l, i) => {
    const el = l.match(/^\s*(?:Person|System|Container|Component)\w*\(\s*([\w-]+)\s*,\s*"([^"]+)"/); if (el) nodes[el[1]] = { name: el[2].trim() };
    const b = l.match(/^\s*\w*Boundary\(\s*([\w-]+)\s*,\s*"([^"]+)"/); if (b) nodes[b[1]] = { name: b[2].trim(), subgraph: true };
    const r = l.match(/^\s*(Bi)?Rel\w*\(\s*([\w-]+)\s*,\s*([\w-]+)\s*(?:,\s*"([^"]*)")?(?:\s*,\s*"([^"]*)")?/);
    if (r) edges.push({ from: r[2], to: r[3], label: [r[5], r[4] ? '[' + r[4] + ']' : ''].filter(Boolean).join(' ').trim(), line: i + 1, both: !!r[1] });
  });
}

// 8.93.1: a PDF / PNG / SVG HLD is transcribed at the gate into `<name>.hld.mmd` beside it — the one form every reader
// (this check, the section payloads) can take its edges from; a picture states nothing code can read
const transcriptionOf = (file) => file.replace(/\.[^./\\]+$/, '') + '.hld.mmd';
const isMermaid = (file) => /\.(mmd|mermaid|md)$/i.test(file);

function check(root, opts = {}) {
  root = path.resolve(root);
  const findings = [];
  const facts = collect(root);
  const d05 = (() => { try { const f = fs.readdirSync(path.join(root, 'docs')).find((x) => /^05-.*\.md$/.test(x)); return f ? 'docs/' + f : null; } catch { return null; } })();
  if (!d05) return { status: 'SKIPPED', reason: 'no docs/05', findings, rows: 0 };
  const d05src = read(path.join(root, d05)).split('\n');
  // the endpoints from the row as written — the ledger's cells are plain text, and a name with " y " in it
  // (`Data API Clientes y Pedidos`) then split in two (8.93.2: the 8.93.1 run's segment runner fought three false `missing`)
  const cellsOf = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const rows = facts.integrations.filter((r) => !r.retired).map((r) => {
    const idx = d05src.findIndex((l) => new RegExp('^\\|\\s*`?' + r.id + '`?\\s*\\|').test(l));
    let from = names(r.from), to = names(r.to);
    if (idx >= 0) {
      // up the table to its separator row (`|---|`); the header is the line above it
      let h = idx; while (h > 0 && /^\s*\|/.test(d05src[h]) && !/^\s*\|\s*:?-{3}/.test(d05src[h])) h--;
      const head = h > 0 && /^\s*\|\s*:?-{3}/.test(d05src[h]) ? cellsOf(d05src[h - 1]).map((c) => c.replace(/[`*]/g, '').toLowerCase()) : [];
      const cells = cellsOf(d05src[idx]), iF = head.findIndex((c) => /^(from|origen|desde)$/.test(c)), iT = head.findIndex((c) => /^(to|destino|hacia)$/.test(c));
      if (iF >= 0 && iT >= 0 && cells[iF] != null && cells[iT] != null) { from = names(cells[iF]); to = names(cells[iT]); }
    }
    return { ...r, line: idx + 1 || r.line, from, to };
  });
  const pairs = [];
  rows.forEach((r) => r.from.forEach((a) => r.to.forEach((b) => pairs.push({ a: norm(a), b: norm(b), row: r }))));

  // protocol cells against the registered grammar
  const reg = registries(opts.dl || DEFAULT_DL);
  let protocol = 'SKIPPED — fallback mode (no llms-rules.txt)';
  if (reg) {
    protocol = `registries from ${reg.source} (${reg.stamp})`;
    rows.forEach((r) => { if (!r.protocol) return; const why = judge(r.protocol, reg); if (why) findings.push({ check: 'protocol', level: 'BLOCKING', file: d05, line: r.line, id: r.id, message: `"${r.protocol}" — ${why}` }); });
  }

  // the HLD
  const hp = hldPath(root, opts.hld);
  let hld = 'none';
  if (hp && fs.existsSync(hp) && /\.(mmd|mermaid|md)$/i.test(hp)) {
    const g = parseHld(read(hp)), rel = path.relative(root, hp);
    hld = `${rel} — ${Object.values(g.nodes).filter((n) => !n.subgraph).length} nodes, ${g.edges.length} edges`;
    const drawn = new Set(Object.values(g.nodes).filter((n) => !n.subgraph).map((n) => norm(n.name)));
    const edgeKeys = new Set(g.edges.flatMap((e) => [norm(e.fromName) + '>' + norm(e.toName)].concat(e.both ? [norm(e.toName) + '>' + norm(e.fromName)] : [])));
    g.edges.forEach((e) => {
      const a = norm(e.fromName), b = norm(e.toName);
      const same = pairs.find((p) => p.a === a && p.b === b), rev = pairs.find((p) => p.a === b && p.b === a);
      if (same) {
        const ha = actionOf(e.label), ra = actionOf(same.row.protocol);
        if (ha && ra && ha !== ra) findings.push({ check: 'hld', kind: 'action', level: 'WARNING', file: d05, line: same.row.line, id: same.row.id, message: `${same.row.id} ${e.fromName} → ${e.toName} is [${ra}]; the HLD draws [${ha}] (${rel}:${e.line} "${e.label}")` });
      } else if (rev && !e.both) findings.push({ check: 'hld', kind: 'reversed', level: 'WARNING', file: d05, line: rev.row.line, id: rev.row.id, message: `${rev.row.id} runs ${e.toName} → ${e.fromName}; the HLD draws ${e.fromName} → ${e.toName} (${rel}:${e.line} "${e.label}") — state why, or turn the row` });
      else if (!rev) findings.push({ check: 'hld', kind: 'missing', level: 'WARNING', file: d05, line: 0, id: null, message: `${e.fromName} → ${e.toName} (${rel}:${e.line} "${e.label}") has no I-nn row — add it, or state why the architecture drops it` });
    });
    // a row `A y B → C y D` pairs in order (A → C, B → D); otherwise every source with every target
    const rowPairs = (r) => r.from.length > 1 && r.from.length === r.to.length ? r.from.map((x, i) => [x, r.to[i]]) : r.from.flatMap((x) => r.to.map((y) => [x, y]));
    rows.forEach((r) => rowPairs(r).forEach(([x, y]) => {
      const a = norm(x), b = norm(y);
      if (drawn.has(a) && drawn.has(b) && !edgeKeys.has(a + '>' + b) && !edgeKeys.has(b + '>' + a)) findings.push({ check: 'hld', kind: 'not-in-hld', level: 'INFO', file: d05, line: r.line, id: r.id, message: `${r.id} ${x} → ${y}: both are in the HLD, the edge is not` });
    }));
  } else if (hp && fs.existsSync(hp)) {
    hld = `${path.relative(root, hp)} — not Mermaid and not transcribed`;
    findings.push({ check: 'hld', kind: 'untranscribed', level: 'WARNING', file: path.relative(root, hp), line: 0, id: null, message: `the HLD is a picture and ${path.relative(root, transcriptionOf(hp))} does not exist — transcribe it (00-gates.md Step 0.4) so its connections can be checked` });
  }
  else if (hp) hld = `${path.relative(root, hp)} — not found`;

  const blocking = findings.filter((f) => f.level === 'BLOCKING').length;
  return { status: blocking ? 'FAIL' : 'PASS', rows: rows.length, hld, protocol, findings, blocking, warnings: findings.filter((f) => f.level === 'WARNING').length };
}

function render(r) {
  if (r.status === 'SKIPPED') return `integration-check: skipped — ${r.reason}`;
  const out = [`integration-check — ${r.rows} I-nn row(s) · HLD: ${r.hld} · protocol: ${r.protocol}`];
  const by = (c) => r.findings.filter((f) => f.check === c);
  const p = by('protocol'); out.push(`  protocol: ${p.length ? p.length + ' cell(s) off the registered form' : 'every cell registered ✓'}`);
  p.forEach((f) => out.push(`    ✗ ${f.file}:${f.line} ${f.id} ${f.message}`));
  const h = by('hld'); out.push(`  hld: ${h.filter((f) => f.level === 'WARNING').length} departure(s), ${h.filter((f) => f.level === 'INFO').length} row(s) the HLD does not draw`);
  h.forEach((f) => out.push(`    ${f.level === 'WARNING' ? '!' : '·'} [${f.kind}] ${f.line ? f.file + ':' + f.line + ' ' : ''}${f.message}`));
  out.push(r.status);
  return out.join('\n');
}

module.exports = { check, parseHld, render, transcriptionOf, isMermaid };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun integration-check.js <project-root> [--hld <file>] [--json]'); process.exit(2); }
  const r = check(args[0], { hld: opt('--hld') });
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.status === 'FAIL' ? 1 : 0);
}
