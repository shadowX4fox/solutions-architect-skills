#!/usr/bin/env node
// render-analysis.js — plan × fill → the analysis report, then the findings contract check (8.50.0).
//
//   bun render-analysis.js <fill.json> --project <root> [--format md|html] [--out <path>] [--today YYYY-MM-DD] [--json] [--judge agent|typesafe|clef]
//
// The agent writes a fill — rows per section, heat-map coordinates, cascade blocks, recommendations,
// verdict, gaps, citations (analyses/plans/README.md § Fill schema). This script owns the format:
// the plan (analyses/plans/<lens>.json) says which sections exist, in which order, with which
// columns, anchors and visible titles; the renderer prints them, draws the heat map or the bars from
// the rows, joins the SPOF cross-references into a Blast Radius report from the SPOF report on disk,
// and holds the result to `findings.js` before it counts as written. What a report typed by hand used
// to pay in output tokens — 10K to 49K per lens — is a few hundred lines of JSON now, and a report
// can no longer drift from its spec: a heading, an anchor or a column the plan does not declare is
// not something the fill can say.
//
// HTML mode fills templates/analysis-report-html-skeleton.html and inlines templates/viz/<lens>.html;
// the d3 `data` literal is derived from the rows where the rows carry it (spof, stride, bottleneck,
// cost-hotspots, vendor-lockin, latency-budget, tech-debt, coupling) and taken from `fill.viz`
// otherwise (blast-radius, data-sensitivity — the edges live nowhere else).
'use strict';
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');
const F = require(fromSaSkills('scripts', 'shared', 'findings.js'));
const { resolveNames } = require(fromSaSkills('scripts', 'resolve-name.js'));

const SKILL = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const fillPath = args.find((a) => !a.startsWith('--') && (args.indexOf(a) === 0 || !args[args.indexOf(a) - 1].startsWith('--')));
if (!fillPath) { console.error('Usage: bun render-analysis.js <fill.json> --project <root> [--format md|html] [--out <path>] [--today YYYY-MM-DD] [--json]'); process.exit(2); }
const root = path.resolve(opt('--project') || process.cwd());
const format = (opt('--format') || 'md').toLowerCase() === 'html' ? 'html' : 'md';
const jsonOut = args.includes('--json');

// ---------------------------------------------------------------- shared words
const WORDS = {
  en: { findings: 'Findings', date: 'Analysis Date', source: 'Architecture Source', analyst: 'Analyst', analystName: 'Architecture Analysis Skill', status: 'Status', citations: 'Source Citations', none: '_No findings in this run._', sourceLabel: 'Source', noGaps: '_No documentation gaps identified._', notDocumented: '[NOT DOCUMENTED]' },
  es: { findings: 'Hallazgos', date: 'Fecha de análisis', source: 'Fuente de arquitectura', analyst: 'Analista', analystName: 'Architecture Analysis Skill', status: 'Status', citations: 'Fuentes citadas', none: '_Sin hallazgos en esta corrida._', sourceLabel: 'Fuente', noGaps: '_Sin brechas de documentación identificadas._', notDocumented: '[NOT DOCUMENTED]' },
};
const cellText = (v) => String(v == null ? '' : v).replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (v) => { const m = String(v == null ? '' : v).replace(/,/g, '.').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };

function loadPlan(lens) {
  const p = path.join(SKILL, 'analyses', 'plans', `${lens}.json`);
  if (!fs.existsSync(p)) throw new Error(`no plan for lens "${lens}" (${path.relative(process.cwd(), p)})`);
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n"));
}

// ---------------------------------------------------------------- validation
function validate(plan, fill) {
  const errors = [];
  const sections = fill.sections || {};
  const declared = new Set(plan.sections.map((s) => s.key));
  Object.keys(sections).forEach((k) => { if (!declared.has(k)) errors.push(`section "${k}" is not in the ${plan.lens} plan — the plan's sections: ${[...declared].join(' · ')}`); });
  if (!Array.isArray(fill.summary) || !fill.summary.length) errors.push('summary: at least one paragraph');
  if (!fill.verdict) errors.push('verdict: one paragraph');
  const seen = new Map();   // id → section key
  const rowsOf = (s) => { const sec = sections[s.key] || {}; return s.kind === 'matrix' ? (sec.groups || []).flatMap((g) => g.rows || []) : sec.rows || []; };
  plan.sections.forEach((s) => {
    const sec = sections[s.key];
    if (!sec || sec.omit) return;
    if (s.kind === 'table' || s.kind === 'matrix') {
      const re = s.id ? new RegExp(s.id) : null;
      if (s.kind === 'matrix') (sec.groups || []).forEach((g, gi) => { if (!g.id || !g.title) errors.push(`${s.key}: group ${gi + 1} needs id and title`); });
      rowsOf(s).forEach((r, i) => {
        const id = String(r.id || '').trim();
        if (s.kind === 'matrix' && /^[—–-]$/.test(id)) { /* a pass row */ }
        else if (!id) errors.push(`${s.key} row ${i + 1}: no id`);
        else if (re && !re.test(id)) errors.push(`${s.key} row ${i + 1}: id "${id}" does not match ${s.id}`);
        else if (seen.has(id) && !s.repeatsIds) errors.push(`${s.key} row ${i + 1}: id "${id}" already used in "${seen.get(id)}" — one finding, one id`);
        else if (s.repeatsIds && !seen.has(id)) errors.push(`${s.key} row ${i + 1}: id "${id}" lists a finding that no earlier table carries`);
        else if (!seen.has(id)) seen.set(id, s.key);
        (s.columns || []).forEach((c) => { if (c === '#' || c === 'ID') return; if (!(c in (r.cells || {}))) errors.push(`${s.key} row ${i + 1} (${id}): missing column "${c}"`); });
      });
    }
    if (s.kind === 'inventory') (sec.rows || []).forEach((r, i) => (s.columns || []).forEach((c) => { if (!(c in (r.cells || {}))) errors.push(`${s.key} row ${i + 1}: missing column "${c}"`); }));
    if (s.kind === 'blocks') (sec.blocks || []).forEach((b, i) => { if (!b.title) errors.push(`${s.key} block ${i + 1}: no title`); });
  });
  (fill.heatmap || []).forEach((h) => {
    const hm = plan.sections.find((s) => s.kind === 'heatmap');
    if (!hm) { errors.push(`heatmap: the ${plan.lens} plan has no heat map`); return; }
    if (!seen.has(String(h.id))) errors.push(`heatmap: "${h.id}" is not a finding of this report`);
    const nx = hm.axes.x.n, ny = hm.axes.y.n;
    if (!(h.x >= 1 && h.x <= nx && h.y >= 1 && h.y <= ny)) errors.push(`heatmap: "${h.id}" at (${h.x}, ${h.y}) — cells run 1..${nx} × 1..${ny}`);
  });
  (fill.recommendations || []).forEach((r, i) => { if (r.id && !seen.has(String(r.id))) errors.push(`recommendation ${i + 1}: "${r.id}" is not a finding of this report`); if (!r.title || !r.body) errors.push(`recommendation ${i + 1}: title and body are required`); });
  return errors;
}

// ---------------------------------------------------------------- cross-references (blast radius ← SPOF)
function latestReport(dir, slug) {
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).filter((n) => new RegExp(`^${slug.replace('-', '[-_]')}-\\d{4}-\\d{2}-\\d{2}\\.md$`, 'i').test(n)).sort().pop();
  return f ? path.join(dir, f) : null;
}
// The Blast Radius rows that are the same component as a SPOF finding. Equality after normalization was the whole join,
// so a spelling drift between two separately written reports dropped the link and nothing said so; the labels now go
// through scripts/resolve-name.js — exact by code, a qualified or shortened label by the judge over the SPOF labels. A label
// the judge has not answered joins nothing and is listed as undecided with the worksheet, so the link is never lost in silence.
async function applyCrossRefs(plan, fill) {
  if (plan.lens !== 'blast-radius') return null;
  const spof = latestReport(path.join(root, 'analysis'), 'SPOF');
  if (!spof) return null;
  const { items } = F.extractMarkdown(fs.readFileSync(spof, "utf8").replace(/\r\n?/g, "\n"), 'SPOF');
  const byComponent = new Map();
  items.forEach((it) => { const k = F.norm(it.label); if (k) byComponent.set(k, (byComponent.get(k) || []).concat(it.id)); });
  const spofFacts = [...byComponent.keys()].map((k) => { const it = items.find((x) => F.norm(x.label) === k); return { name: it.label, description: [it.id, it.what].filter(Boolean).join(': '), file_backed: true }; });
  const rowsOf = (s) => ((fill.sections || {})[s.key] || {}).rows || [];
  const cells = []; plan.sections.filter((s) => s.kind === 'table').forEach((s) => rowsOf(s).forEach((r, i) => { const comp = r.cells && r.cells.Component; if (!comp) return; const label = String(comp).replace(/\(SPOF[^)]*\)/i, '').trim(); if (!byComponent.has(F.norm(label)) && !cells.some((c) => c.cell === label)) cells.push({ id: `b${cells.length}`, cell: label, context: { section: s.key } }); }));
  let resolved = new Map(); let note = null;
  if (cells.length && spofFacts.length) { try { resolved = await resolveNames(cells, spofFacts, { engine: opt('--judge'), root }); } catch (e) { if (e.name !== 'JudgeError') throw e; note = e.message; } }
  // a label with a candidate the judge has not answered (pending worksheet, or no engine reachable) is undecided, never dropped
  const undecided = !spofFacts.length ? [] : cells.filter((c) => { const r = resolved.get(c.id); return r ? r.undecided : !!note; }).map((c) => c.cell);
  const idsFor = (label) => { const k = F.norm(label); if (byComponent.has(k)) return { ids: byComponent.get(k), by: 'exact' }; const c = cells.find((x) => x.cell === label), r = c && resolved.get(c.id); return r && r.resolved ? { ids: byComponent.get(F.norm(r.name)), by: `${r.by}${r.confidence != null ? ` ${r.confidence}` : ''}` } : null; };
  let joined = 0; const judged = [];
  plan.sections.filter((s) => s.kind === 'table').forEach((s) => rowsOf(s).forEach((r) => {
    const comp = r.cells && r.cells.Component; if (!comp) return;
    const hit = idsFor(String(comp).replace(/\(SPOF[^)]*\)/i, '').trim()); if (!hit) return;
    if (!r.marker) r.marker = '⚡ SPOF+Blast';
    if (!/\(SPOF /i.test(comp)) r.cells.Component = `${comp} (SPOF ${hit.ids.join(', ')})`;
    if (hit.by !== 'exact') judged.push(`${comp} ↔ SPOF ${hit.ids.join(', ')} (${hit.by})`);
    joined++;
  }));
  return { file: path.relative(root, spof), joined, judged, undecided, pending: resolved.pending || null, engine: resolved.engine || null, note };
}

// ---------------------------------------------------------------- Markdown
function heatmapAscii(section, entries) {
  const { x, y } = section.axes;
  const grid = Array.from({ length: y.n }, () => Array.from({ length: x.n }, () => []));
  entries.forEach((e) => { grid[e.y - 1][e.x - 1].push(`[${e.id}]`); });
  const w = Math.max(12, ...grid.flat().map((c) => c.join(' ').length + 2));
  const labelsY = y.n === 3 ? [y.hi, 'MID', y.lo] : y.n === 4 ? [y.hi, 'HIGH-MID', 'LOW-MID', y.lo] : Array.from({ length: y.n }, (_, i) => (i === 0 ? y.hi : i === y.n - 1 ? y.lo : ''));
  const labelsX = x.n === 3 ? [x.lo, 'MID', x.hi] : x.n === 4 ? [x.lo, 'LOW-MID', 'HIGH-MID', x.hi] : Array.from({ length: x.n }, (_, i) => (i === 0 ? x.lo : i === x.n - 1 ? x.hi : ''));
  const L = Math.max(...labelsY.map((s) => s.length), y.label.length) + 1;
  const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
  const lines = [pad(y.label, L) + '│'];
  for (let r = y.n - 1; r >= 0; r--) {
    lines.push(pad(labelsY[y.n - 1 - r], L) + '│ ' + grid[r].map((c) => pad(c.join(' '), w)).join('│ '));
    lines.push(' '.repeat(L) + (r === 0 ? '└' : '├') + grid[r].map(() => '─'.repeat(w + 1)).join(r === 0 ? '┴' : '┼'));
  }
  lines.push(' '.repeat(L + 2) + labelsX.map((s) => pad(s, w + 1)).join(''));
  lines.push(' '.repeat(L + 2) + `${x.label} →`);
  return '```\n' + lines.join('\n') + '\n```';
}
function chartAscii(section, fromRows) {
  const { label, value, unit } = section.chart;
  const rows = fromRows.map((r) => ({ label: F.plain(r.cells[label] || ''), raw: String(r.cells[value] == null ? '' : r.cells[value]), n: num(r.cells[value]) }));
  const L = Math.max(10, ...rows.map((r) => r.label.length));
  const lines = [section.chart.title || `${value} by ${label}`, '═'.repeat(Math.max(24, (section.chart.title || '').length))];
  rows.forEach((r) => {
    const l = r.label + ' '.repeat(L - r.label.length);
    if (r.n == null) { lines.push(`${l}  ${F.plain(r.raw) || '[NOT DOCUMENTED]'}`); return; }
    const pct = Math.max(0, Math.min(100, unit === '%' ? r.n : r.n)); const filled = Math.round(pct / 100 * 12);
    lines.push(`${l}  ${'█'.repeat(filled)}${'░'.repeat(12 - filled)}  ${r.raw.trim()}`);
  });
  return '```\n' + lines.join('\n') + '\n```';
}
const tableMd = (columns, rows) => ['| ' + columns.join(' | ') + ' |', '|' + columns.map(() => '---').join('|') + '|', ...rows.map((r) => '| ' + r.join(' | ') + ' |')].join('\n');

function renderMarkdown(plan, fill) {
  const lang = fill.language === 'es' ? 'es' : 'en', W = WORDS[lang], P = fill.project || {}, S = fill.sections || {};
  const t = (obj) => (obj && (obj[lang] || obj.en)) || '';
  const out = [];
  out.push(`# ${t(plan.title)} — ${P.name || 'Architecture'} v${P.version || '?'}`, '');
  out.push(`**${W.date}**: ${fill.today || ''}  `, `**${W.source}**: \`${P.source || 'ARCHITECTURE.md'}\` v${P.version || '?'} (${W.status}: ${P.status || 'Draft'})  `, `**${W.analyst}**: ${W.analystName}`, '', '---', '');
  let n = 0, sub = 0, inFindings = false;
  const h2 = (title, key) => { n++; sub = 0; out.push(`## ${n}. ${title} <!-- SECTION: ${key} -->`, ''); };
  const h3 = (title, key) => { if (!inFindings) { inFindings = true; h2(W.findings, 'Findings'); } sub++; out.push(`### ${n}.${sub} ${title} <!-- SECTION: ${key} -->`, ''); };
  const heading = (s) => { if (s.level === 3) h3(t(s.title), s.key); else { inFindings = false; h2(t(s.title), s.key); } };
  const rowsMd = (s, rows, numbered) => {
    const cols = numbered ? ['#'].concat(s.columns) : s.columns;
    const body = rows.map((r, i) => {
      const cells = s.columns.map((c) => c === '#' || c === 'ID' ? cellText(r.id) + (r.marker ? ' ' + cellText(r.marker) : '') : cellText((r.cells || {})[c]));
      return numbered ? [String(i + 1)].concat(cells) : cells;
    });
    return tableMd(cols, body);
  };
  plan.sections.forEach((s) => {
    const sec = S[s.key] || {};
    switch (s.kind) {
      case 'summary': h2(t(s.title) || (lang === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary'), 'Executive Summary'); out.push(...(fill.summary || []).map((p) => p + '\n')); out.push('---', ''); break;
      case 'table': case 'inventory': {
        const rows = sec.rows || [];
        if (!rows.length && (s.omitWhenEmpty || sec.omit)) return;
        heading(s); if (sec.text) out.push(sec.text, '');
        out.push(rows.length ? rowsMd(s, rows, s.kind === 'inventory') : W.none, ''); break; }
      case 'matrix': {
        const groups = sec.groups || [];
        if (!groups.length && (s.omitWhenEmpty || sec.omit)) return;
        heading(s); if (sec.text) out.push(sec.text, '');
        const gh = s.level === 3 ? '####' : '###';
        groups.forEach((g) => {
          out.push(`${gh} ${g.id} — ${g.title}`, '');
          if (s.matrixHeader && g.header) { const hs = s.matrixHeader.map((k) => `${k}: ${cellText(g.header[k])}`); out.push(tableMd(hs, []), ''); }
          out.push(rowsMd(s, g.rows || [], false), '');
        });
        if (!groups.length) out.push(W.none, ''); break; }
      case 'blocks': {
        const blocks = sec.blocks || [];
        if (!blocks.length && (s.omitWhenEmpty || sec.omit)) return;
        heading(s); if (sec.text) out.push(sec.text, '');
        const bh = s.level === 3 ? '####' : '###';
        blocks.forEach((b) => {
          out.push(`${bh} ${b.title}`, '');
          if (b.text) out.push(b.text, '');
          if (b.table && b.table.columns) out.push(tableMd(b.table.columns, (b.table.rows || []).map((r) => b.table.columns.map((c) => cellText(Array.isArray(r) ? r[b.table.columns.indexOf(c)] : (r.cells || r)[c])))), '');
          if (b.mermaid) out.push('```mermaid', b.mermaid.trim(), '```', '');
        });
        if (!blocks.length) out.push(W.none, ''); break; }
      case 'heatmap': { const entries = fill.heatmap || []; if (!entries.length && (s.omitWhenEmpty || sec.omit)) return; heading(s); out.push(entries.length ? heatmapAscii(s, entries) : W.none, ''); break; }
      case 'chart': { const from = plan.sections.find((x) => x.key === s.from); const rows = from ? ((S[s.from] || {}).rows || []) : []; if (!rows.length && (s.omitWhenEmpty || sec.omit)) return; heading(s); out.push(rows.length ? chartAscii(s, rows) : W.none, ''); break; }
      case 'text': { if (!sec.text && (s.omitWhenEmpty || sec.omit)) return; heading(s); out.push(sec.text || W.none, ''); break; }
      case 'strengths': { const items = sec.items || []; if (!items.length && (s.omitWhenEmpty || sec.omit)) return; heading(s); out.push(...items.map((i) => `- ${i}`), ''); break; }
      case 'recommendations': {
        inFindings = false; h2(t(s.title), s.key);
        (fill.recommendations || []).slice(0, plan.topN || 5).forEach((r, i) => { out.push(`**${i + 1}. ${r.title}${r.id ? ` (${r.id})` : ''}**`, r.body, r.source ? `_${W.sourceLabel}: ${r.source}_` : '', ''); });
        out.push('---', ''); break; }
      case 'verdict': inFindings = false; h2(t(s.title), s.key); out.push(fill.verdict || '', '', '---', ''); break;
      case 'gaps': {
        const gaps = fill.gaps || []; if (!gaps.length && s.omitWhenEmpty) return;
        inFindings = false; h2(t(s.title), s.key);
        out.push(...(gaps.length ? gaps.map((g) => `- [ ] \`${W.notDocumented}\` ${g.subject} — ${g.missing}${g.where ? ` (${g.where})` : ''}`) : [W.noGaps]), ''); break; }
      default: break;
    }
  });
  out.push('---', '', `**${W.citations}**: ${(fill.citations || []).map((c) => `\`${c}\``).join(', ')}`);
  out.push('');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------------------------------------------------------------- HTML
function deriveViz(plan, fill) {
  const S = fill.sections || {}; const rows = (k) => ((S[k] || {}).rows || []); const c = (r, k) => F.plain((r.cells || {})[k] || '');
  const sevWord = (s) => { const t = F.norm(s); return /critical|critic|high|alto|alta/.test(t) ? 'high' : /medium|medio|media/.test(t) ? 'medium' : /low|bajo|baja/.test(t) ? 'low' : 'pass'; };
  switch (plan.lens) {
    case 'spof': { const tierOf = { C: 'critical', D: 'degradation', O: 'operational' }; const coords = new Map((fill.heatmap || []).map((h) => [String(h.id), h])); const list = [];
      plan.sections.filter((s) => s.kind === 'table').forEach((s) => rows(s.key).forEach((r) => { const h = coords.get(String(r.id)) || {}; list.push({ id: r.id, label: c(r, 'Component'), impact: h.y || 2, likelihood: h.x || 2, tier: tierOf[String(r.id)[0]] || 'operational', scenario: c(r, 'Failure Scenario') || c(r, 'Scenario') }); }));
      return { heatmap: list }; }
    case 'stride': { const g = (S['STRIDE Matrix'] || {}).groups || []; const cells = []; g.forEach((grp) => (grp.rows || []).forEach((r) => { if (/^[—–-]$/.test(String(r.id))) return; cells.push({ boundary_id: grp.id, category: (c(r, 'Category') || '').trim()[0] || 'S', severity: sevWord(c(r, 'Severity')), threat_id: r.id, threat_desc: c(r, 'Threat') }); }));
      return { matrix: { boundaries: g.map((grp) => ({ id: grp.id, name: grp.title })), categories: ['S', 'T', 'R', 'I', 'D', 'E'], cells } }; }
    case 'bottleneck': { const tierOf = (r) => { const m = String(r.id).match(/^B[1-4]/); return m ? m[0] : 'undocumented'; }; const list = rows('Capacity Headroom Summary').map((r) => ({ component: c(r, 'Component'), headroom_pct: num(c(r, 'Headroom %')), tier: (() => { const rl = F.norm(c(r, 'Risk Level')); return /critical|critic/.test(rl) ? 'B1' : /high|alto/.test(rl) ? 'B2' : /medium|medio/.test(rl) ? 'B3' : num(c(r, 'Headroom %')) == null ? 'undocumented' : 'adequate'; })(), note: c(r, 'Risk Level') }));
      plan.sections.filter((s) => s.kind === 'table').forEach((s) => rows(s.key).forEach((r) => { if (!list.some((x) => F.norm(x.component) === F.norm(c(r, 'Component')))) list.push({ component: c(r, 'Component'), headroom_pct: null, tier: tierOf(r), note: c(r, 'Bottleneck Reason') || c(r, 'Scale Blocker') }); }));
      return { headroom: list }; }
    case 'cost-hotspots': return { pareto: rows('Pareto Cost Table').map((r) => ({ id: r.id, component: c(r, 'Component / Service'), monthly_cost_usd: num(c(r, 'Monthly Cost')) || 0, vendor: c(r, 'Vendor'), category: (c(r, 'Category') || 'P').trim()[0] })) };
    case 'vendor-lockin': { const byVendor = {}; const add = (r, tier) => { const v = c(r, 'Vendor') || 'Unknown'; byVendor[v] = byVendor[v] || { L1: [], L2: [], L3: [] }; byVendor[v][tier].push({ id: r.id || '', label: c(r, 'Component') || c(r, 'Capability') || c(r, 'Technology') }); };
      rows('Locked Capabilities').forEach((r) => add(r, 'L1')); rows('Lock-prone Capabilities').forEach((r) => add(r, 'L2')); rows('Portable Components').forEach((r) => add(r, 'L3'));
      return { treemap: { name: 'All', children: Object.entries(byVendor).map(([name, t]) => ({ name, severity: t.L1.length ? 'high' : t.L2.length ? 'medium' : 'low', children: [{ name: 'L1 Locked', tier: 'L1', value: t.L1.length, items: t.L1 }, { name: 'L2 Lock-prone', tier: 'L2', value: t.L2.length, items: t.L2 }, { name: 'L3 Portable', severity: 'low', value: t.L3.length, items: t.L3 }].filter((x) => x.value) })) } }; }
    case 'latency-budget': { const blocks = (S['Per-Flow Budget Breakdown'] || {}).blocks || []; return { flows: blocks.map((b) => { const cols = (b.table || {}).columns || []; const hops = ((b.table || {}).rows || []).map((r) => { const g = (k) => { const i = cols.findIndex((h) => new RegExp(k, 'i').test(h)); const v = Array.isArray(r) ? r[i] : (r.cells || r)[cols[i]]; return F.plain(v || ''); }; const st = F.norm(g('status')); return { component: g('hop|component'), role: g('role'), p95_ms: num(g('p95|budget')), status: /over|excede|fuera/.test(st) ? 'over' : /tight|ajust/.test(st) ? 'tight' : /untracked|sin medir|not documented/.test(st) ? 'untracked' : 'within' }; }); const worst = hops.some((h) => h.status === 'over') ? 'high' : hops.some((h) => h.status === 'tight') ? 'medium' : 'low'; return { name: b.title, severity: worst, slo_ms: num(b.slo || b.text), hops: hops.map((h) => Object.assign(h, { severity: h.status === 'over' ? 'high' : h.status === 'tight' ? 'medium' : 'low' })) }; }) }; }
    case 'tech-debt': return { timeline: { today: fill.today, window_months: 36, items: rows('Technology Currency Table').map((r) => ({ technology: c(r, 'Technology'), eol_date: (c(r, 'EOL Date') || '').slice(0, 10), runway_months: num(c(r, 'Runway')), tier: (String(r.id).match(/^T[1-5]/) || ['T5'])[0], components_using: c(r, 'Components Using') ? c(r, 'Components Using').split(/,\s*/) : [] })) } };
    case 'coupling': { const inv = rows('Coupling Metrics'); const names = inv.map((r) => c(r, 'Component')); const idx = new Map(names.map((n, i) => [F.norm(n), i])); const matrix = names.map(() => names.map(() => 0));
      const edges = (fill.viz && fill.viz.edges) || []; edges.forEach(([a, b]) => { const i = idx.get(F.norm(a)), j = idx.get(F.norm(b)); if (i != null && j != null) matrix[i][j] = 1; });
      return { coupling: { components: inv.map((r) => { const klass = (c(r, 'Classification') || c(r, 'Flags') || '').match(/K[1-4]/g) || []; return { name: c(r, 'Component'), fanin: num(c(r, 'Fan-in')) || 0, fanout: num(c(r, 'Fan-out')) || 0, instability: num(c(r, 'Instability')) || 0, klass, severity: klass.some((k) => k !== 'K2') ? 'high' : klass.length ? 'medium' : 'low' }; }), matrix } }; }
    default: return null;
  }
}
// the contract reads every labelled object of the literal as a finding and needs a severity on it; a viz object the fill
// supplies (a graph node, a sankey link) carries a tier or an encrypted flag instead — stamp the word the parser resolves
function stampSeverity(v) {
  if (!v || typeof v !== 'object') return v;
  const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if ((o.label || o.name || o.component || o.technology) && !o.severity && !o.tier) o.severity = o.encrypted === false ? 'high' : o.cascade === 'Cascading' ? 'high' : 'low'; Object.values(o).forEach(walk); } };
  walk(v); return v;
}
function renderHtml(plan, fill) {
  const lang = fill.language === 'es' ? 'es' : 'en', W = WORDS[lang], P = fill.project || {}, S = fill.sections || {};
  const t = (obj) => (obj && (obj[lang] || obj.en)) || '';
  // the shell opens on an authoring comment that lists the tokens by name — dropped, or the literal `{{TOKEN}}` in it would read as a leftover
  const shell = fs.readFileSync(path.join(SKILL, 'templates', 'analysis-report-html-skeleton.html'), "utf8").replace(/\r\n?/g, "\n").replace(/^\s*<!--[\s\S]*?-->\s*/, '');
  const vizPath = path.join(SKILL, 'templates', 'viz', `${plan.lens}.html`);
  const viz = fs.existsSync(vizPath) ? fs.readFileSync(vizPath, "utf8").replace(/\r\n?/g, "\n") : '';
  const data = deriveViz(plan, fill) || stampSeverity(fill.viz) || {};   // derived from the rows where they carry it; the fill's own `viz` for the lenses whose edges live nowhere else
  const sevClass = (r, s) => { const v = (r.cells || {}).Severity || (r.cells || {}).Tier || (r.cells || {})['Risk Level'] || r.id; const w = F.SEV(String(v)); return w ? ` class="row-${w}"` : ''; };
  const tableHtml = (s, rows, numbered) => { const cols = numbered ? ['#'].concat(s.columns) : s.columns; return `<table class="data"><thead><tr>${cols.map((cn) => `<th>${esc(cn)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${numbered ? '' : sevClass(r, s)}>${(numbered ? [String(i + 1)] : []).concat(s.columns.map((cn) => cn === '#' || cn === 'ID' ? esc(F.plain(r.id)) + (r.marker ? ' ' + esc(r.marker) : '') : esc(F.plain((r.cells || {})[cn] || '')))).map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`; };
  const blocksHtml = (blocks) => blocks.map((b) => `<h4>${esc(b.title)}</h4>${b.text ? `<p>${esc(F.plain(b.text))}</p>` : ''}${b.table && b.table.columns ? `<table class="data"><thead><tr>${b.table.columns.map((cn) => `<th>${esc(cn)}</th>`).join('')}</tr></thead><tbody>${(b.table.rows || []).map((r) => `<tr>${b.table.columns.map((cn, i) => `<td>${esc(F.plain(Array.isArray(r) ? r[i] : (r.cells || r)[cn] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}`).join('');
  const findingsHtml = [];
  plan.sections.forEach((s) => {
    if (['summary', 'recommendations', 'verdict', 'gaps'].includes(s.kind) || s.htmlOmit) return;
    const sec = S[s.key] || {}; let body = '';
    if (s.kind === 'table' || s.kind === 'inventory') { const rows = sec.rows || []; if (!rows.length && (s.omitWhenEmpty || sec.omit)) return; body = rows.length ? tableHtml(s, rows, s.kind === 'inventory') : `<p>${esc(F.plain(W.none))}</p>`; }
    else if (s.kind === 'matrix') { const groups = sec.groups || []; if (!groups.length && (s.omitWhenEmpty || sec.omit)) return; body = groups.map((g) => `<h4>${esc(g.id)} — ${esc(g.title)}</h4>${s.matrixHeader && g.header ? `<p>${s.matrixHeader.map((k) => `<strong>${esc(k)}:</strong> ${esc(F.plain(g.header[k] || ''))}`).join(' · ')}</p>` : ''}${tableHtml(s, g.rows || [], false)}`).join(''); }
    else if (s.kind === 'blocks') { const blocks = sec.blocks || []; if (!blocks.length && (s.omitWhenEmpty || sec.omit)) return; body = blocksHtml(blocks); }
    else if (s.kind === 'text') { if (!sec.text && (s.omitWhenEmpty || sec.omit)) return; body = `<p>${esc(F.plain(sec.text || W.none))}</p>`; }
    else if (s.kind === 'strengths') { const items = sec.items || []; if (!items.length && (s.omitWhenEmpty || sec.omit)) return; body = `<ul>${items.map((i) => `<li>${esc(F.plain(i))}</li>`).join('')}</ul>`; }
    else return;
    findingsHtml.push(`<section class="findings-block"><h3>${esc(t(s.title))}</h3>${sec.text && s.kind !== 'text' ? `<p>${esc(F.plain(sec.text))}</p>` : ''}${body}</section>`);
  });
  const recs = (fill.recommendations || []).slice(0, plan.topN || 5).map((r, i) => `<div class="recommendation"><div class="rec-head"><span class="rec-num">${i + 1}.</span><span class="rec-title">${esc(r.title)}${r.id ? ` (${esc(r.id)})` : ''}</span></div><p class="rec-body">${esc(F.plain(r.body))}</p>${r.source ? `<p class="rec-citation">source: ${esc(r.source)}</p>` : ''}</div>`).join('');
  const gaps = (fill.gaps || []).length ? `<ul class="gaps">${fill.gaps.map((g) => `<li><code>[NOT DOCUMENTED]</code> ${esc(F.plain(g.subject))} — ${esc(F.plain(g.missing))}${g.where ? ` (${esc(g.where)})` : ''}</li>`).join('')}</ul>` : `<p style="color:var(--text-muted);font-style:italic;">${esc(F.plain(W.noGaps))}</p>`;
  const tokens = {
    TITLE: `${t(plan.title)} — ${P.name || ''} v${P.version || ''}`, ANALYSIS_TYPE_LABEL: plan.typeLabel || plan.slug, PROJECT_NAME: P.name || '', ARCH_VERSION: P.version || '', ARCH_STATUS: P.status || '', ANALYSIS_DATE: fill.today || '',
    HEADER_META_HTML: [[W.date, fill.today], [W.source, `${P.source || 'ARCHITECTURE.md'} v${P.version || ''} (${P.status || ''})`], [W.analyst, W.analystName]].map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join(''),
    EXEC_SUMMARY_HTML: (fill.summary || []).map((p) => `<p>${esc(F.plain(p))}</p>`).join(''), FINDINGS_HTML: findingsHtml.join('\n'), VIZ_TITLE: plan.vizTitle || '', VIZ_BLOCK: viz,
    RECOMMENDATIONS_HTML: recs, VERDICT_HTML: `<p>${esc(F.plain(fill.verdict || ''))}</p>`, GAPS_HTML: gaps,
    CITATIONS_HTML: `<p class="citations"><strong>Source files:</strong> ${(fill.citations || []).map(esc).join(', ')}</p>`,
    ANALYSIS_DATA_JSON: `const data = ${JSON.stringify(data, null, 2)};`,   // pretty: the parser reads the literal up to a `}` on its own line
  };
  let html = shell.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
  const problems = [];
  const left = html.match(/\{\{[A-Z_]+\}\}/g); if (left) problems.push(`leftover placeholder(s): ${[...new Set(left)].join(', ')}`);
  const vizCount = (html.match(/<section class="report-section" id="visualization">/g) || []).length; if (vizCount !== 1) problems.push(`${vizCount} visualization section(s) — exactly one expected`);
  if (/<script[\s\S]*?window\._/.test(html)) problems.push('`window._` inside a script block');
  return { html, problems };
}

// ---------------------------------------------------------------- main
const fill = JSON.parse(fs.readFileSync(path.resolve(fillPath), "utf8").replace(/\r\n?/g, "\n"));
const plan = loadPlan(fill.lens);
fill.today = opt('--today') || fill.today || new Date().toISOString().slice(0, 10);
const errors = validate(plan, fill);
if (errors.length) {
  if (jsonOut) console.log(JSON.stringify({ ok: false, errors }, null, 2));
  else { console.error(`✗ ${fill.lens} fill: ${errors.length} problem(s)`); errors.forEach((e) => console.error(`    ✗ ${e}`)); }
  process.exit(1);
}
const xref = await applyCrossRefs(plan, fill);
const outPath = path.resolve(opt('--out') || path.join(root, 'analysis', `${plan.slug}-${fill.today}.${format}`));
let content, htmlProblems = [];
if (format === 'html') { const r = renderHtml(plan, fill); content = r.html; htmlProblems = r.problems; } else content = renderMarkdown(plan, fill);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content);
const check = F.checkReport(outPath, content);
const rel = path.relative(process.cwd(), outPath).replace(/\\/g, '/');
const ok = !check.errors.length && !htmlProblems.length;
// one report per lens (8.117.0): a report that passes its check sends the earlier ones of its lens to analysis/archive/
const archived = ok ? F.archiveOlder(outPath) : [];
if (jsonOut) console.log(JSON.stringify({ ok, file: rel, bytes: content.length, findings: check.items.length, errors: check.errors, warnings: check.warnings, html: htmlProblems, crossRefs: xref, archived }, null, 2));
else {
  const sev = {}; check.items.forEach((i) => { const s = i.severity || 'unresolved'; sev[s] = (sev[s] || 0) + 1; });
  console.log(`${ok ? '✓' : '✗'} ${rel}: ${(content.length / 1024).toFixed(1)} KB, ${check.items.length} finding(s) — ${Object.entries(sev).map(([k, v]) => `${v} ${k}`).join(' · ') || 'no findings'}${xref ? ` · ${xref.joined} SPOF cross-reference(s) from ${xref.file}` : ''}`);
  if (xref && xref.judged && xref.judged.length) console.log(`  SPOF cross-references bound by ${xref.engine} (${xref.judged.length}): ${xref.judged.join('; ')}`);
  if (xref && xref.note) console.log(`  SPOF cross-references: ${xref.note} — exact labels only`);
  if (xref && xref.undecided && xref.undecided.length) console.log(`  SPOF cross-references undecided (${xref.undecided.length}), joined to nothing: ${xref.undecided.join('; ')}${xref.pending ? ` — the judge's worksheet is at ${xref.pending}; answer it and re-run` : ''}`);
  if (archived.length) console.log(`  archived (one report per lens): ${archived.join(', ')}`);
  check.errors.forEach((e) => console.log(`    ✗ ${rel}${e.line ? ':' + e.line : ''}: ${e.message}`));
  htmlProblems.forEach((e) => console.log(`    ✗ ${rel}: ${e}`));
  check.warnings.forEach((w) => console.log(`    ⚠ ${rel}${w.line ? ':' + w.line : ''}: ${w.message}`));
}
process.exit(ok ? 0 : 1);
