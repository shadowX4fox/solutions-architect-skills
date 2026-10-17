#!/usr/bin/env node
// increments.js — an architecture delivered in pieces. One target design; the pieces are declared as one table of use
// cases, and what each piece needs is derived by code from the facts ledger, never assigned by hand.
//
//   bun increments.js <project-root> [--increment <id>] [--slugs [--new]] [--json]
//
// The table (any docs/*.md, docs/01 by convention), under a heading anchored `<!-- LABEL: Delivery Increments -->`:
//
//   | Increment | Use Cases | Target |
//   |---|---|---|
//   | 1 | UC-01, UC-03 | 2026-12 |
//
// The slice of an increment is cumulative — what is in production once it ships: the use cases of every increment up
// to it (table order), the flows that serve them (docs/04 Flow Inventory), the phases those flows declare, the
// components the phases' Hops / owner chain name (name, internal name or slug, whole tokens), and the docs/05
// integrations whose both ends are in it. `new` is the slice minus the previous increment's. An architecture without
// the table is delivered whole: `increments` is empty and nothing changes.
//
// Temporary elements (8.140.0) — a piece of a transition state that a later increment replaces — declare the
// increments they live in and the TDR that records the compromise: a container by `**Delivery Increments:** 1–2 ·
// TDR-004` in its descriptor, an integration by an `Increments` column in docs/05. Inside its window the element is in
// the slice whether or not a flow names it; after it, it is out even when a flow still does, and the slice lists it as
// `retired`. While an element whose window has closed is still documented as live (descriptor on disk, docs/05 row not
// struck), the increment after the window carries a `retire-pending` gap: releasing it retires the element, and the
// change list shows the removal.
//
// `--slugs` prints the comma-separated L2 slugs of the increment (file-backed, `--new` for the new ones only) — the
// `--components` value of the dev-handoff kit.
'use strict';
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
const ucIds = (s) => [...new Set((plain(s).match(/UC-?\d+/gi) || []).map((u) => u.toUpperCase().replace(/^UC(\d)/, 'UC-$1')))];

// the table under the anchored heading, in one file's source → [{ id, use_cases, target, line }] or null
function parse(src) {
  const lines = String(src || '').split('\n');
  const h = lines.findIndex((l) => /^#{2,6}\s.*<!--\s*LABEL:\s*Delivery Increments\s*-->/.test(l));
  if (h < 0) return null;
  const lvl = lines[h].match(/^#+/)[0].length;
  for (let i = h + 1; i < lines.length; i++) {
    const hh = (lines[i].match(/^#+(?=\s)/) || [''])[0].length; if (hh && hh <= lvl) break;
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) continue;
    const head = cells(lines[i]).map(norm);
    const iI = head.findIndex((x) => x.startsWith('increment')), iU = head.findIndex((x) => x.startsWith('use case')), iT = head.findIndex((x) => x.startsWith('target'));
    if (iI < 0 || iU < 0) return [];
    const rows = [];
    for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
      const r = cells(lines[j]); const id = plain(r[iI]); if (!id) continue;
      rows.push({ id, use_cases: ucIds(r[iU]), target: iT >= 0 ? plain(r[iT]) || null : null, line: j + 1 });
    }
    return rows;
  }
  return [];
}
// the table of a project: the first docs/*.md that carries the anchor (docs/01 sorts first)
function read_(root) {
  const dir = path.join(root, 'docs'); if (!fs.existsSync(dir)) return { file: null, rows: [] };
  for (const n of fs.readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) { const rows = parse(read(path.join(dir, n))); if (rows) return { file: `docs/${n}`, rows }; }
  return { file: null, rows: [] };
}

// a component named by a token of a Hops line / owner chain / docs/05 endpoint
function resolver(components) {
  const idx = new Map();
  components.forEach((c) => [c.name, c.internal_name, c.slug].filter(Boolean).forEach((k) => { const n = norm(k); if (n && !idx.has(n)) idx.set(n, c); }));
  return (token) => idx.get(norm(token)) || null;
}
const tokens = (s) => plain(s).split(/\s*(?:→|->|·|,|;)\s*/).map((t) => t.replace(/\s*\([^)]*\)\s*$/, '').trim()).filter(Boolean);

// `1–2 · TDR-004` → { from, to, tdr } by table position; null when the cell names no increment
function windowOf(cell, ids) {
  const t = plain(cell); if (!t) return null;
  const tdr = (t.match(/TDR-\d+/i) || [null])[0];
  const m = t.replace(/TDR-\d+/ig, '').match(/^\s*([\w.]+)\s*(?:(?:–|—|-|to|a|\.\.)\s*([\w.]+))?/i);
  if (!m) return { from: -1, to: -1, tdr: tdr && tdr.toUpperCase(), raw: t };
  const from = ids.indexOf(m[1]), to = m[2] ? ids.indexOf(m[2]) : from;
  return { from, to, tdr: tdr && tdr.toUpperCase(), raw: t };
}

// facts (arch-facts.js collect) → { file, increments: [slice], unassigned: { use_cases, containers }, temporary }
function slices(facts) {
  const rows = facts.increments || [];
  const comps = facts.components || [];
  const find = resolver(comps);
  const ids = rows.map((r) => r.id);
  const tdrs = Object.fromEntries((facts.tdrs || []).map((t) => [t.id, t]));
  // the temporary elements: a window on a descriptor or on a docs/05 row (a struck row is already retired)
  const temporary = [];
  comps.filter((c) => c.delivery).forEach((c) => temporary.push({ kind: 'container', key: c.slug, name: c.name, level: c.level, live: c.file_backed !== false, window: windowOf(c.delivery, ids) }));
  (facts.integrations || []).filter((i) => i.delivery).forEach((i) => temporary.push({ kind: 'integration', key: i.id, name: `${i.id} ${i.from} → ${i.to}`, live: !i.retired, window: windowOf(i.delivery, ids) }));
  const tempGaps = [];
  temporary.forEach((t) => {
    const w = t.window;
    if (!w || w.from < 0 || w.to < 0 || w.to < w.from) tempGaps.push({ rule: 'window-unknown', text: `${t.name}: "${w ? w.raw : ''}" names no increment range of the table (${ids.join(', ')})` });
    if (!w || !w.tdr) tempGaps.push({ rule: 'temporary-no-tdr', text: `${t.name} is temporary and cites no TDR — record the compromise (create TDR) and cite it beside the window` });
    else if (!tdrs[w.tdr]) tempGaps.push({ rule: 'temporary-no-tdr', text: `${t.name} cites ${w.tdr}, which is not in tdr/` });
  });
  const inWindow = (t, i) => t.window && t.window.from >= 0 && i >= t.window.from && i <= t.window.to;
  const closed = (t, i) => t.window && t.window.to >= 0 && i > t.window.to;
  const phaseBy = Object.fromEntries((facts.phases || []).map((p) => [p.n, p]));
  const flowsOf = (ucs) => (facts.flows || []).filter((f) => f.use_cases.some((u) => ucs.includes(u)));
  const out = []; let prev = null; const cum = new Set();
  rows.forEach((row, idx) => {
    row.use_cases.forEach((u) => cum.add(u));
    const ucs = [...cum];
    const flows = flowsOf(ucs);
    const phases = [...new Set(flows.flatMap((f) => f.phases))];
    const named = new Map(), unresolved = new Set();
    phases.forEach((n) => { const p = phaseBy[n]; if (!p) return; tokens(`${p.hops || ''} → ${p.owner_chain || ''}`).forEach((t) => { const c = find(t); if (c) named.set(c.slug, c); else unresolved.add(t); }); });
    // temporary containers: in inside their window, out after it
    temporary.filter((t) => t.kind === 'container').forEach((t) => { const c = comps.find((x) => x.slug === t.key); if (inWindow(t, idx) && c) named.set(c.slug, c); else if (closed(t, idx) || (t.window && idx < t.window.from)) named.delete(t.key); });
    // a container named in scope brings its system; a system's containers are not implied
    [...named.values()].filter((c) => c.level === 'L2' && c.system).forEach((c) => { const s = comps.find((x) => x.level === 'L1' && x.slug === c.system); if (s) named.set(s.slug, s); });
    const inScope = (end) => { const c = find(end); return c && named.has(c.slug); };
    const tempI = Object.fromEntries(temporary.filter((t) => t.kind === 'integration').map((t) => [t.key, t]));
    const integrations = (facts.integrations || []).filter((i) => { const t = tempI[i.id]; if (t) return inWindow(t, idx); return !i.retired && inScope(i.from) && inScope(i.to); }).map((i) => i.id);
    const containers = [...named.values()].filter((c) => c.level === 'L2').map((c) => c.slug).sort();
    const systems = [...named.values()].filter((c) => c.level === 'L1').map((c) => c.slug).sort();
    const own = flowsOf(row.use_cases);
    const s = { id: row.id, target: row.target, use_cases: row.use_cases, cumulative_use_cases: ucs,
      flows: own.map((f) => f.code), phases, containers, systems, integrations,
      new: { containers: containers.filter((x) => !prev || !prev.containers.includes(x)), integrations: integrations.filter((x) => !prev || !prev.integrations.includes(x)) },
      retired: { containers: prev ? prev.containers.filter((x) => !containers.includes(x)) : [], integrations: prev ? prev.integrations.filter((x) => !integrations.includes(x)) : [] },
      temporary: temporary.filter((t) => inWindow(t, idx)).map((t) => ({ kind: t.kind, key: t.key, until: ids[t.window.to], tdr: t.window.tdr })),
      file_backed: containers.filter((x) => (comps.find((c) => c.slug === x) || {}).file_backed !== false),
      gaps: [] };
    row.use_cases.filter((u) => !own.some((f) => f.use_cases.includes(u))).forEach((u) => s.gaps.push({ rule: 'use-case-no-flow', text: `${u} is served by no flow of the docs/04 Flow Inventory` }));
    own.filter((f) => !f.phases.length).forEach((f) => s.gaps.push({ rule: 'flow-no-phases', text: `flow ${f.code}. ${f.name} declares no **Phases** line — its components cannot be derived` }));
    phases.filter((n) => !phaseBy[n]).forEach((n) => s.gaps.push({ rule: 'phase-absent', text: `phase ${n} is declared by a flow and absent from the Phase Catalog` }));
    if (own.length && prev && !s.new.containers.length && !s.new.integrations.length && !s.retired.containers.length && !s.retired.integrations.length) s.gaps.push({ rule: 'nothing-new', severity: 'warning', text: `increment ${row.id} adds or retires no container and no integration against increment ${prev.id} — only use cases` });
    // the element whose window closed before this increment must be retired by its release
    temporary.filter((t) => closed(t, idx) && t.live).forEach((t) => s.gaps.push({ rule: 'retire-pending', text: `${t.name} lives until increment ${ids[t.window.to]} — retire it before releasing increment ${row.id} (${t.kind === 'integration' ? 'strike its docs/05 row' : 'remove component, architecture-component-guardian'}${t.window.tdr ? `; resolve ${t.window.tdr}` : ''})` }));
    temporary.filter((t) => closed(t, idx) && !t.live && t.window.tdr && tdrs[t.window.tdr] && !/resolved|won't fix/i.test(tdrs[t.window.tdr].status || '')).forEach((t) => s.gaps.push({ rule: 'tdr-open', severity: 'warning', text: `${t.name} is retired and ${t.window.tdr} is still ${tdrs[t.window.tdr].status || 'open'} — move it to Resolved` }));
    s.unresolved = [...unresolved].filter((t) => !/^(external|externo)$/i.test(t)).sort();
    out.push(s); prev = s;
  });
  const assigned = new Set(rows.flatMap((r) => r.use_cases));
  const allUcs = [...new Set((facts.flows || []).flatMap((f) => f.use_cases))].sort();
  const needed = new Set(out.flatMap((x) => x.containers));
  const unassigned = !rows.length ? { use_cases: [], containers: [] } : {
    use_cases: allUcs.filter((u) => !assigned.has(u)),
    containers: comps.filter((c) => c.level === 'L2' && c.file_backed !== false && !needed.has(c.slug)).map((c) => c.slug).sort(),
  };
  const dup = rows.flatMap((r, i) => r.use_cases.filter((u) => rows.slice(0, i).some((q) => q.use_cases.includes(u))).map((u) => `${u} is assigned to increment ${r.id} and to an earlier one`));
  return { file: facts.increments_file || null, increments: out, unassigned, duplicates: dup, temporary: temporary.map((t) => ({ kind: t.kind, key: t.key, name: t.name, live: t.live, from: t.window && ids[t.window.from] || null, until: t.window && ids[t.window.to] || null, tdr: t.window && t.window.tdr })), temporary_gaps: rows.length ? tempGaps : [] };
}

function render(r, only) {
  if (!r.increments.length) return 'INCREMENTS: none declared — the architecture is delivered whole (add a `<!-- LABEL: Delivery Increments -->` table to docs/01 to deliver it in pieces)';
  const o = [`INCREMENTS: ${r.increments.length} (${r.file})`];
  r.increments.filter((s) => !only || s.id === only).forEach((s) => {
    o.push(`  ${s.id}${s.target ? ` · ${s.target}` : ''} — ${s.use_cases.join(', ') || 'no use case'} · flows ${s.flows.join(', ') || '—'} · ${s.containers.length} containers (${s.new.containers.length} new), ${s.integrations.length} integrations (${s.new.integrations.length} new)`);
    if (s.new.containers.length) o.push(`      new: ${s.new.containers.join(', ')}`);
    if (s.retired.containers.length || s.retired.integrations.length) o.push(`      retired: ${s.retired.containers.concat(s.retired.integrations).join(', ')}`);
    if (s.temporary.length) o.push(`      temporary: ${s.temporary.map((t) => `${t.key} until ${t.until}${t.tdr ? ` (${t.tdr})` : ''}`).join(', ')}`);
    s.gaps.forEach((g) => o.push(`      ${g.severity === 'warning' ? '!' : '✗'} ${g.rule}: ${g.text}`));
  });
  if (!only) {
    if (r.unassigned.use_cases.length) o.push(`  unassigned use cases: ${r.unassigned.use_cases.join(', ')}`);
    if (r.unassigned.containers.length) o.push(`  containers no increment needs: ${r.unassigned.containers.join(', ')}`);
    r.duplicates.forEach((d) => o.push(`  ✗ ${d}`));
    r.temporary_gaps.forEach((g) => o.push(`  ✗ ${g.rule}: ${g.text}`));
  }
  return o.join('\n');
}

module.exports = { parse, read: read_, slices, render };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args[0];
  if (!root || root.startsWith('--')) { console.error('Usage: bun increments.js <project-root> [--increment <id>] [--slugs [--new]] [--json]'); process.exit(2); }
  const { collect } = require(path.join(__dirname, 'arch-facts.js'));
  const r = slices(collect(path.resolve(root)));
  const only = opt('--increment');
  const s = only ? r.increments.find((x) => x.id === only) : null;
  if (only && !s) { console.error(`increments.js: no increment "${only}" — declared: ${r.increments.map((x) => x.id).join(', ') || 'none'}`); process.exit(1); }
  if (args.includes('--slugs')) { if (!s) { console.error('increments.js: --slugs needs --increment <id>'); process.exit(2); } const list = args.includes('--new') ? s.new.containers : s.containers; console.log(list.filter((x) => s.file_backed.includes(x)).join(',')); process.exit(0); }
  console.log(args.includes('--json') ? JSON.stringify(s || r, null, 1) : render(r, only));
}
