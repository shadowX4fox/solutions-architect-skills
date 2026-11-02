#!/usr/bin/env bun
'use strict';
// The analyses as one picture, in the Alia Guide look — the one form for every request: the pull request comment of
// architecture-analysis.yml and any "show me the analyses" in a chat draw this same image, never one drawn by hand.
// With --base: each lens before → after (the base's newest report against the one on disk), the verdict analysis-diff.js
// reaches, and what rose. Without: the state of every lens this architecture analyses. Her blazon heads it, in the ring of the mood of
// the outcome (kept pleased, moved worried; a state with critical findings worried, else calm). By code, no model.
//
//   bun analysis-chart.js <project> [--base <git-ref> --lenses spof,stride,…] [--out <file.png|file.svg>] [--json]
//   bun analysis-chart.js <project> --lens <lens> [--focus <component | flow | finding id>] [--view <figure>] [--out …]   one lens's own figure
//   (stride: heatmap | matrix; data-sensitivity: flows | heatmap)
//
// PNG through headless Chrome (--chrome, SA_CHROME, PUPPETEER_EXECUTABLE_PATH, CHROME_PATH, Puppeteer's download, PATH);
// the .svg is always written beside it — the same drawing, for a surface that draws vector pictures (sa-alia on the desktop
// app). With no Chrome, the .svg alone. Prints the file written.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');

const F = require(fromSaSkills('scripts', 'shared', 'findings.js'));
const SEVS = ['critical', 'high', 'medium', 'low'];
const RANK_ = { critical: 4, high: 3, medium: 2, low: 1 };
const COLOR = { critical: '#ff3b4e', high: '#ffd23f', medium: '#2ee6e6', low: '#8ea3ad' };
const NIGHT = '#0d1418', NIGHT2 = '#15222a', LINE = '#2b4a55', AQUA = '#2ee6e6', SILVER = '#c9d1d9', MUTED = '#8ea3ad';
const W = 1200;
const T = {
  en: { kicker: 'ARCHITECTURE ANALYSIS', kept: 'The analyses keep the state', moved: 'The state moved — for the architect', state: 'Where the analyses stand',
    vs: (b, n) => `against ${b} · ${n} lens${n === 1 ? '' : 'es'} re-run`, of: (n) => `${n} lens${n === 1 ? '' : 'es'} · the newest report of each`,
    sev: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }, new: (n) => `▲ ${n} new`, raised: (n) => `▲ ${n} raised`, none: 'no report',
    newItem: 'new', raisedItem: 'raised', before: 'before', after: 'now', more: (n) => `+${n} more` },
  es: { kicker: 'ANÁLISIS DE LA ARQUITECTURA', kept: 'Los análisis mantienen el estado', moved: 'El estado cambió: decide el arquitecto', state: 'Cómo están los análisis',
    vs: (b, n) => `contra ${b} · ${n} lente${n === 1 ? '' : 's'} recorrida${n === 1 ? '' : 's'}`, of: (n) => `${n} lente${n === 1 ? '' : 's'} · el reporte más reciente de cada una`,
    sev: { critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo' }, new: (n) => `▲ ${n} nuevo${n === 1 ? '' : 's'}`, raised: (n) => `▲ ${n} subió`, none: 'sin reporte',
    newItem: 'nuevo', raisedItem: 'subió', before: 'antes', after: 'ahora', more: (n) => `+${n} más` },
};

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cut = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
const tally = (items) => Object.fromEntries(SEVS.map((s) => [s, items.filter((i) => i.severity === s).length]));

/** The architecture's name, version and language, from ARCHITECTURE.md. */
function about(root) {
  let a = '';
  try { a = fs.readFileSync(path.join(root, 'ARCHITECTURE.md'), 'utf8'); } catch { /* none */ }
  return { name: ((a.match(/^#\s+(.+)$/m) || [])[1] || path.basename(root)).trim(), version: (a.match(/ARCHITECTURE_VERSION:\s*([\d.]+)/) || [])[1] || null,
    lang: /<!--\s*(?:DOC_)?LANGUAGE:\s*es\b/i.test(a) ? 'es' : 'en' };
}

/** The state: every lens with a report on disk, its newest report's findings by severity. */
function stateModel(root) {
  let files = [];
  try { files = fs.readdirSync(path.join(root, 'analysis')).filter((f) => /\.(md|html)$/i.test(f)); } catch { files = []; }
  const newest = new Map();
  for (const f of files) { const l = F.lensOf(f); if (!F.LENSES.includes(l)) continue; const d = F.dateOf(f) || ''; if (!newest.has(l) || d > (F.dateOf(newest.get(l)) || '')) newest.set(l, f); }
  const lenses = [...newest].sort((a, b) => F.LENSES.indexOf(a[0]) - F.LENSES.indexOf(b[0])).map(([l, f]) => {
    const text = fs.readFileSync(path.join(root, 'analysis', f), 'utf8');
    const r = /\.html$/i.test(f) ? F.extractHtml(text, f) : F.extractMarkdown(text.replace(/\r\n/g, '\n'), f);
    return { lens: l.toLowerCase(), before: null, after: tally(r.items || []), file: `analysis/${f}`, held: 0, raised: 0 };
  });
  return { kind: 'state', verdict: null, lenses, items: [] };
}

/** The change: analysis-diff.js's verdict, drawn. */
async function diffModel(root, base, lenses, opts = {}) {
  const { diff } = require('./analysis-diff.js');
  const r = await diff(root, base, lenses, opts);
  const rows = r.lenses.map((p) => ({ lens: p.lens, before: p.totals.before, after: p.totals.after, file: p.after, held: p.held.length, raised: p.raised.length }));
  for (const l of r.missing) rows.push({ lens: l, before: null, after: null, missing: true, held: 0, raised: 0 });
  const items = [...r.held.map((h) => ({ kind: 'new', severity: h.severity, lens: h.lens, id: h.id, name: h.name })),
    ...r.raised.map((h) => ({ kind: 'raised', severity: h.to, lens: h.lens, id: h.id, name: h.name }))];
  return { kind: 'diff', verdict: r.verdict, base: String(base).slice(0, 12), lenses: rows, items };
}

/** Her escudo, inlined. The picture carries her blazon, never her face: the comment it opens on (and the reply beside
 *  it in a chat) already carries her codec, and her face appears once in a piece. */
function blazonUri() {
  try { return `data:image/svg+xml;base64,${fs.readFileSync(fromSaSkills('brand', 'alia', 'blazon', 'escudo.svg')).toString('base64')}`; } catch { return null; }
}
/** Her mark on a picture: the blazon in the ring of the outcome's mood. */
function mark(ring, embed) {
  const b = embed ? blazonUri() : null;
  return `<circle cx="108" cy="104" r="58" fill="${NIGHT2}" stroke="${ring}" stroke-width="5"/>` + (b ? `<image href="${b}" x="70" y="66" width="76" height="76"/>` : '');
}
function fontFaces() {
  const face = (file, weight) => { try { return `@font-face{font-family:'Nunito';font-weight:${weight};src:url(data:font/ttf;base64,${fs.readFileSync(fromSaSkills('tools', 'docgen', 'themes', 'alia', 'fonts', file)).toString('base64')}) format('truetype');}`; } catch { return ''; } };
  return face('Nunito-Regular.ttf', 400) + face('Nunito-ExtraBold.ttf', 800);
}

/** The picture as SVG — pure over the model; `embed` false leaves out the blazon and fonts (tests). */
function chartSvg(m, info, { embed = true, fonts = embed, date = '' } = {}) {
  const t = T[info.lang] || T.en;
  const mood = m.kind === 'diff' ? (m.verdict === 'kept' ? 'pleased' : 'worried') : (m.lenses.some((l) => l.after && l.after.critical) ? 'worried' : 'calm');
  const ring = { pleased: '#4dffa0', worried: '#ffd23f', calm: AQUA }[mood];
  const diff = m.kind === 'diff', rowH = diff ? 70 : 50, top = 236;
  const shown = m.items.slice(0, 5), listH = shown.length ? 40 + shown.length * 34 + (m.items.length > 5 ? 30 : 0) : 0;
  const H = top + m.lenses.length * rowH + 30 + listH + 90;
  const max = Math.max(1, ...m.lenses.flatMap((l) => [l.before, l.after].filter(Boolean).map((x) => SEVS.reduce((n, s) => n + x[s], 0))));
  const BX = 300, BW = 600;
  const bar = (x, y, h, counts, opacity) => {
    let at = x; const parts = [];
    for (const s of SEVS) { const w = (counts[s] / max) * BW; if (w > 0) { parts.push(`<rect x="${at.toFixed(1)}" y="${y}" width="${Math.max(2, w).toFixed(1)}" height="${h}" rx="3" fill="${COLOR[s]}" opacity="${opacity}"/>`); at += w + 2; } }
    return parts.join('') || `<rect x="${x}" y="${y}" width="2" height="${h}" fill="${LINE}"/>`;
  };
  const rows = m.lenses.map((l, i) => {
    const y = top + i * rowH, mid = y + rowH / 2;
    const name = `<text x="56" y="${mid + 7}" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="20" letter-spacing="1" fill="${SILVER}">${esc(l.lens.toUpperCase())}</text>`;
    const sep = `<line x1="48" y1="${y + rowH}" x2="${W - 48}" y2="${y + rowH}" stroke="${LINE}" stroke-width="1"/>`;
    if (l.missing || !l.after) return `${name}<text x="${BX}" y="${mid + 7}" font-family="Nunito, sans-serif" font-size="18" fill="${MUTED}">${esc(t.none)}</text>${sep}`;
    const count = (s) => (diff && l.before ? `${l.before[s]}→${l.after[s]}` : String(l.after[s]));
    const worse = (s) => diff && l.before && l.after[s] > l.before[s];
    const nums = ['critical', 'high'].map((s, k) => `<tspan x="${930 + k * 120}" fill="${worse(s) ? COLOR[s] : SILVER}" font-weight="${worse(s) ? 800 : 400}">${esc(t.sev[s][0])} ${esc(count(s))}</tspan>`).join('');
    const badge = l.held || l.raised ? `<text x="${W - 56}" y="${mid - 14}" text-anchor="end" font-family="Nunito, sans-serif" font-weight="800" font-size="15" fill="${COLOR.critical}">${esc([l.held && t.new(l.held), l.raised && t.raised(l.raised)].filter(Boolean).join(' · '))}</text>` : '';
    const bars = diff && l.before ? bar(BX, mid - 14, 9, l.before, 0.35) + bar(BX, mid - 1, 16, l.after, 1) : bar(BX, mid - 9, 18, l.after, 1);
    return `${name}${bars}<text y="${mid + 7}" font-family="IBM Plex Mono, monospace" font-size="18">${nums}</text>${badge}${sep}`;
  }).join('\n');
  const listTop = top + m.lenses.length * rowH + 40;
  const list = shown.map((it, i) => {
    const y = listTop + 30 + i * 34;
    return `<circle cx="64" cy="${y - 6}" r="7" fill="${COLOR[it.severity] || MUTED}"/><text x="84" y="${y}" font-family="Nunito, sans-serif" font-size="20" fill="#fff"><tspan font-family="IBM Plex Mono, monospace" font-weight="600" fill="${AQUA}">${esc(it.lens.toUpperCase())} ${esc(it.id || '')}</tspan>  ${esc(cut(it.name, 70))} <tspan fill="${MUTED}">· ${esc(it.kind === 'new' ? t.newItem : t.raisedItem)} ${esc(t.sev[it.severity] || it.severity).toLowerCase()}</tspan></text>`;
  }).join('\n') + (m.items.length > 5 ? `<text x="84" y="${listTop + 30 + 5 * 34}" font-family="Nunito, sans-serif" font-size="18" fill="${MUTED}">${esc(t.more(m.items.length - 5))}</text>` : '');
  const legendY = H - 46;
  const legend = SEVS.map((s, k) => `<rect x="${56 + k * 150}" y="${legendY - 13}" width="16" height="16" rx="3" fill="${COLOR[s]}"/><text x="${80 + k * 150}" y="${legendY}" font-family="Nunito, sans-serif" font-size="17" fill="${SILVER}">${esc(t.sev[s])}</text>`).join('')
    + (diff ? `<rect x="${56 + 4 * 150}" y="${legendY - 9}" width="30" height="7" rx="2" fill="${SILVER}" opacity="0.35"/><text x="${94 + 4 * 150}" y="${legendY}" font-family="Nunito, sans-serif" font-size="17" fill="${SILVER}">${esc(t.before)}</text>` : '');
  const title = diff ? (m.verdict === 'kept' ? t.kept : t.moved) : t.state;
  const sub = diff ? t.vs(m.base, m.lenses.length) : t.of(m.lenses.length);
  const kicker = [t.kicker, info.name.toUpperCase(), info.version && `V${info.version}`].filter(Boolean).join(' · ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><style>${fonts ? fontFaces() : ''}</style>
<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(46,230,230,0.06)" stroke-width="1"/></pattern></defs>
<rect width="${W}" height="${H}" fill="${NIGHT}"/><rect width="${W}" height="${H}" fill="url(#grid)"/>
<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="24" fill="none" stroke="${ring}" stroke-opacity="0.55" stroke-width="2"/>
${mark(ring, embed)}
<text x="196" y="82" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="16" letter-spacing="2" fill="${AQUA}">${esc(cut(kicker, 64))}</text>
<text x="196" y="128" font-family="Nunito, sans-serif" font-weight="800" font-size="40" fill="#fff">${esc(title)}</text>
<text x="196" y="164" font-family="Nunito, sans-serif" font-size="20" fill="${SILVER}">${esc(sub)}</text>
<line x1="48" y1="${top - 14}" x2="${W - 48}" y2="${top - 14}" stroke="${LINE}" stroke-width="1"/>
${rows}
${list}
${legend}
<text x="${W - 56}" y="${legendY}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="15" fill="${MUTED}">${esc(['Alia', date].filter(Boolean).join(' · '))}</text>
</svg>
`;
}

// ---------------------------------------------------------------- one lens's own figure (--lens, --focus)
// The figure its report already states, redrawn: a heat map (the plan's axes, every finding in its cell), the blast radius of
// one component (its direct and indirect consumers), a flow's latency waterfall (each hop's p95 against the flow's target).
// Read from the newest Markdown report of the lens, by code; --focus narrows it to a component, a flow or a finding id.
const FIGURE = { spof: 'heatmap', stride: 'heatmap', 'vendor-lockin': 'heatmap', 'tech-debt': 'heatmap', 'data-sensitivity': 'flows', 'blast-radius': 'graph', 'latency-budget': 'waterfall',
  bottleneck: 'headroom', coupling: 'coupling', 'cost-hotspots': 'pareto' };
// a lens with more than one figure: its first is the default, --view names another
const VIEWS = { stride: ['heatmap', 'matrix'], 'data-sensitivity': ['flows', 'heatmap'] };
const LENS_TITLE = { bottleneck: ['Capacity headroom', 'Holgura de capacidad'], coupling: ['Coupling', 'Acoplamiento'], 'cost-hotspots': ['Cost hotspots', 'Focos de costo'], spof: ['Single points of failure', 'Puntos únicos de falla'], stride: ['STRIDE threats', 'Amenazas STRIDE'], 'vendor-lockin': ['Vendor lock-in', 'Dependencia de proveedor'],
  'tech-debt': ['Technology debt', 'Deuda tecnológica'], 'data-sensitivity': ['Data sensitivity', 'Sensibilidad de datos'], 'blast-radius': ['Blast radius', 'Radio de impacto'], 'latency-budget': ['Latency budget', 'Presupuesto de latencia'] };
const FT = {
  en: { heat: 'heat map', findings: (n) => `${n} finding${n === 1 ? '' : 's'} placed`, report: 'report', focus: 'focus', direct: 'direct consumers', indirect: 'indirect consumers',
    fanout: 'fan-out', cascade: 'cascade', bulkhead: 'bulkhead', target: 'target', documented: 'documented', untracked: (n) => `${n} hop${n === 1 ? '' : 's'} without a figure`, over: 'over', tight: 'tight', within: 'within', none: 'not documented', noFlow: 'no flow',
    headroom: 'headroom', undocumented: (n, k) => `${n} of ${k} without a capacity figure`, components: (n) => `${n} component${n === 1 ? '' : 's'}`, fanin: 'fan-in', fanoutC: 'fan-out', instab: 'I',
    monthly: 'monthly cost', cumulative: 'cumulative', noCost: 'No monthly cost is documented — what the documents say of cost:', mentions: (n) => `${n} cost mention${n === 1 ? '' : 's'}`,
    flows: 'sensitive data flows', steps: (n) => `${n} step${n === 1 ? '' : 's'}`, gap: 'gap', gaps: (n) => `${n} gap${n === 1 ? '' : 's'}`, enc: 'encrypted in transit', encNo: 'encryption not documented', matrix: 'STRIDE matrix', boundaries: (n) => `${n} trust boundar${n === 1 ? 'y' : 'ies'}`, pass: 'pass' },
  es: { heat: 'mapa de calor', findings: (n) => `${n} hallazgo${n === 1 ? '' : 's'} ubicado${n === 1 ? '' : 's'}`, report: 'reporte', focus: 'foco', direct: 'consumidores directos', indirect: 'consumidores indirectos',
    fanout: 'alcance', cascade: 'cascada', bulkhead: 'aislamiento', target: 'objetivo', documented: 'documentado', untracked: (n) => `${n} salto${n === 1 ? '' : 's'} sin cifra`, over: 'excede', tight: 'justo', within: 'dentro', none: 'sin documentar', noFlow: 'sin flujo',
    headroom: 'holgura', undocumented: (n, k) => `${n} de ${k} sin cifra de capacidad`, components: (n) => `${n} componente${n === 1 ? '' : 's'}`, fanin: 'entrantes', fanoutC: 'salientes', instab: 'I',
    monthly: 'costo mensual', cumulative: 'acumulado', noCost: 'No hay costo mensual documentado. Lo que dicen los documentos del costo:', mentions: (n) => `${n} ${n === 1 ? 'mención' : 'menciones'} de costo`,
    flows: 'flujos de datos sensibles', steps: (n) => `${n} paso${n === 1 ? '' : 's'}`, gap: 'brecha', gaps: (n) => `${n} brecha${n === 1 ? '' : 's'}`, enc: 'cifrado en tránsito', encNo: 'cifrado sin documentar', matrix: 'matriz STRIDE', boundaries: (n) => `${n} frontera${n === 1 ? '' : 's'} de confianza`, pass: 'pasa' },
};
const strip = (s) => String(s || '').replace(/`/g, '').replace(/\*\*/g, '').trim();
const normName = (s) => F.norm(strip(s));

/** The newest Markdown report of a lens: { file, md } or null. */
function lensReport(root, lens) {
  let files = [];
  try { files = fs.readdirSync(path.join(root, 'analysis')); } catch { return null; }
  const re = new RegExp(`^${lens.toUpperCase()}-(\\d{4}-\\d{2}-\\d{2})[^/]*\\.md$`, 'i');
  const f = files.filter((x) => re.test(x)).sort().pop();
  return f ? { file: `analysis/${f}`, date: F.dateOf(f), md: fs.readFileSync(path.join(root, 'analysis', f), 'utf8').replace(/\r\n/g, '\n') } : null;
}
/** A section's lines: from its `<!-- SECTION: key -->` heading to the next heading of its level or above. */
function section(md, key) {
  const lines = md.split('\n'), at = lines.findIndex((l) => new RegExp(`<!--\\s*SECTION:\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-->`).test(l));
  if (at < 0) return [];
  const lvl = (lines[at].match(/^(#+)/) || ['', '##'])[1].length, out = [];
  for (let k = at + 1; k < lines.length; k++) { const m = lines[k].match(/^(#+)\s/); if (m && (m[1].length < lvl || (m[1].length === lvl && /<!--\s*SECTION:/.test(lines[k])))) break; out.push(lines[k]); }
  return out;
}
const tableOf = (lines) => {
  const t = lines.filter((l) => /^\s*\|/.test(l)); if (t.length < 2) return null;
  const split = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  return { columns: split(t[0]), rows: t.slice(2).map(split) };
};
const col = (tbl, re) => tbl.columns.findIndex((c) => re.test(c));

/** The heat map: the plan's grid as the report draws it, every [id] in its cell. */
function parseHeat(md) {
  const sec = section(md, 'Heat Map'), a = sec.indexOf(sec.find((l) => /^```/.test(l))), b = sec.findIndex((l, k) => k > a && /^```/.test(l));
  if (a < 0 || b < 0) return null;
  const g = sec.slice(a + 1, b), rows = [];
  let ylabel = '', xlabels = [], xlabel = '', bottom = false;
  for (const l of g) {
    if (/^\s*└/.test(l)) { bottom = true; continue; }
    if (bottom) { if (/→/.test(l)) xlabel = l.replace('→', '').trim(); else xlabels = l.trim().split(/\s{2,}/); continue; }
    if (/^\s*├/.test(l) || !l.includes('│')) continue;
    const parts = l.split('│'), label = parts[0].trim(), cells = parts.slice(1);
    if (!cells.some((c) => c.trim()) && label && !rows.length) { ylabel = label; continue; }
    const ids = cells.map((c) => [...c.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim()));
    if (!label && rows.length) ids.forEach((x, k) => rows[rows.length - 1].cells[k].push(...x)); else rows.push({ label, cells: ids });
  }
  return rows.length ? { ylabel, xlabel, xlabels, rows } : null;
}

/** The lens's figure model. */
function lensModel(root, lens, focus, view) {
  if (view && !(VIEWS[lens] || [FIGURE[lens]]).includes(view)) throw Object.assign(new Error(`${lens} has no ${view} view — views: ${(VIEWS[lens] || [FIGURE[lens]]).join(', ')}`), { code: 2 });
  const kind = view || FIGURE[lens];
  if (!kind) throw Object.assign(new Error(`no figure for ${lens} yet — figures: ${Object.keys(FIGURE).join(', ')}`), { code: 2 });
  const rep = lensReport(root, lens);
  if (!rep) throw Object.assign(new Error(`no Markdown report of ${lens} under analysis/`), { code: 1 });
  const items = (F.extractMarkdown(rep.md, rep.file).items || []);
  const byId = new Map(items.map((i) => [String(i.id).replace(/\s*⚡$/, ''), i]));
  const f = focus ? normName(focus) : null;
  if (kind === 'heatmap') {
    const heat = parseHeat(rep.md);
    if (!heat) throw Object.assign(new Error(`${rep.file} has no heat map`), { code: 1 });
    const hit = (id) => !f || normName(id) === f || normName((byId.get(id) || {}).label) === f || normName((byId.get(id) || {}).label).includes(f);
    return { kind, lens, file: rep.file, date: rep.date, heat, items: byId, focus, hit };
  }
  const num = (x) => { const m = String(x).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return m && !/not documented|sin documentar|n\/a/i.test(x) ? parseFloat(m[0]) : null; };
  const hitName = (n) => !f || normName(n) === f || normName(n).includes(f);
  if (kind === 'headroom') {
    const tbl = tableOf(section(rep.md, 'Capacity Headroom Summary'));
    if (!tbl) throw Object.assign(new Error(`${rep.file} has no Capacity Headroom Summary`), { code: 1 });
    // the load and the capacity the percentage comes from, as the report writes them; a cell it does not state stays out
    const cell = (r, re) => { const v = strip(r[col(tbl, re)] || ''); return !v || /not documented|sin documentar/i.test(v) ? '' : v; };
    const rows = tbl.rows.map((r) => ({ name: strip(r[col(tbl, /^Component/i)]), pct: num(r[col(tbl, /Headroom/i)] || ''), risk: strip(r[col(tbl, /Risk/i)] || ''),
      load: cell(r, /Current Load|Carga/i), max: cell(r, /Max Capacity|Capacidad/i) }));
    return { kind, lens, file: rep.file, date: rep.date, rows, focus, hit: hitName };
  }
  if (kind === 'coupling') {
    const tbl = tableOf(section(rep.md, 'Coupling Metrics'));
    if (!tbl) throw Object.assign(new Error(`${rep.file} has no Coupling Metrics`), { code: 1 });
    const rows = tbl.rows.map((r) => ({ name: strip(r[col(tbl, /^Component/i)]), fanin: num(r[col(tbl, /Fan-in/i)] || '') || 0, fanout: num(r[col(tbl, /Fan-out/i)] || '') || 0,
      inst: num(r[col(tbl, /Instability/i)] || ''), klass: (strip(r[col(tbl, /Classification/i)] || '').match(/K[1-4]/g) || []) }));
    return { kind, lens, file: rep.file, date: rep.date, rows, focus, hit: hitName };
  }
  if (kind === 'pareto') {
    const tbl = tableOf(section(rep.md, 'Pareto Cost Table')), q = tableOf(section(rep.md, 'Qualitative Cost Mentions'));
    const rows = tbl ? tbl.rows.map((r) => ({ id: strip(r[0]), name: strip(r[col(tbl, /Component/i)]), cost: num(r[col(tbl, /Monthly Cost/i)] || ''), vendor: strip(r[col(tbl, /Vendor/i)] || '') })).filter((r) => r.cost != null).sort((a, b) => b.cost - a.cost) : [];
    const mentions = q ? q.rows.map((r) => ({ id: strip(r[0]), name: strip(r[col(q, /^Component/i)]), text: strip(r[col(q, /Cost Mention/i)] || '') })) : [];
    return { kind, lens, file: rep.file, date: rep.date, rows, mentions, focus, hit: hitName };
  }
  if (kind === 'flows') {
    const tbl = tableOf(section(rep.md, 'Sensitive Data Flow Map')), inv = tableOf(section(rep.md, 'Data Inventory'));
    if (!tbl) throw Object.assign(new Error(`${rep.file} has no Sensitive Data Flow Map`), { code: 1 });
    const tiers = inv ? inv.rows.map((r) => ({ name: normName(r[col(inv, /^Store/i)]), tier: (strip(r[col(inv, /Tier/i)] || '').match(/S[1-4]/) || [''])[0] })) : [];
    const tierOf = (n) => (tiers.find((x) => x.name === normName(n) || x.name.includes(normName(n))) || {}).tier || '';
    let steps = tbl.rows.map((r) => { const g = (re) => strip(r[col(tbl, re)] || ''); return { flow: g(/^Flow/i), from: g(/^From/i), to: g(/^To$/i), sensitive: !/^(no|not documented)/i.test(g(/Sensitive/i)),
      enc: /^documented/i.test(g(/Encryption/i)) ? 'yes' : /^none|sin tramo/i.test(g(/Encryption/i)) ? 'local' : 'no', gap: g(/^Gap/i) && !/^(none|—|-|ninguna?)$/i.test(g(/^Gap/i)) ? g(/^Gap/i) : '' }; });
    if (f) { const only = steps.filter((x) => normName(x.flow).includes(f) || new RegExp(`\\b${f.replace(/\D/g, '') || '\\0'}\\b`).test(x.flow.replace(/\D+/g, ' ')) || normName(x.from) === f || normName(x.to) === f); if (only.length) steps = only; }
    return { kind, lens, file: rep.file, date: rep.date, steps, tierOf, focus };
  }
  if (kind === 'matrix') {
    const sec = section(rep.md, 'STRIDE Matrix'), groups = [];
    let g = null;
    for (const l of sec) {
      const h = l.match(/^#{2,5}\s+(TB-\d+)\s*—\s*(.*)$/);
      if (h) { g = { id: h[1], title: strip(h[2].replace(/^TB-\d+\s*—\s*/, '')), rows: [] }; groups.push(g); continue; }
      if (g && /^\s*\|/.test(l)) { const c = l.trim().replace(/^\||\|$/g, '').split('|').map((x) => strip(x)); if (c.length >= 5 && /^[STRIDE]$/.test(c[2])) g.rows.push({ id: c[0], threat: c[1], cat: c[2], sev: F.SEV(c[3]) || null, pass: /pass/i.test(c[4]) }); }
    }
    if (!groups.length) throw Object.assign(new Error(`${rep.file} has no STRIDE matrix`), { code: 1 });
    return { kind, lens, file: rep.file, date: rep.date, groups: f ? groups.filter((x) => normName(x.id) === f || normName(x.title).includes(f)).concat([]).filter(Boolean) : groups, focus };
  }
  if (kind === 'graph') {
    const tbl = tableOf(section(rep.md, 'High-Blast Components'));
    if (!tbl || !tbl.rows.length) throw Object.assign(new Error(`${rep.file} has no High-Blast Components table`), { code: 1 });
    const c = (r, re) => strip(r[col(tbl, re)] || ''), list = (x) => x.split(/\s*[,;·]\s*/).map(strip).filter((n) => n && !/^(none|ninguno|—|-|not documented)$/i.test(n));
    const rows = tbl.rows.map((r) => ({ id: c(r, /^#$/), name: c(r, /^Component/i), tier: c(r, /^Tier/i), direct: list(c(r, /Direct/i)), indirect: list(c(r, /Indirect/i)),
      fanout: c(r, /Fan-out/i), cascade: c(r, /Cascade/i), bulkhead: c(r, /Bulkhead/i) }));
    const pick = (f && rows.find((r) => normName(r.name) === f || normName(r.id) === f)) || (f && rows.find((r) => normName(r.name).includes(f)))
      || rows.slice().sort((x, y) => (parseInt(y.fanout, 10) || 0) - (parseInt(x.fanout, 10) || 0))[0];
    let links = [];
    try { links = JSON.parse(fs.readFileSync(path.join(root, '.cache', 'sa-skills', 'facts.json'), 'utf8')).integrations || []; } catch { links = []; }
    return { kind, lens, file: rep.file, date: rep.date, row: pick, rows, links, focus, found: !f || !!rows.find((r) => r === pick && (normName(r.name).includes(f) || normName(r.id) === f)) };
  }
  // waterfall: one flow's block
  const sec = section(rep.md, 'Per-Flow Budget Breakdown'), blocks = [];
  let cur = null;
  for (const l of sec) { const h = l.match(/^#{3,5}\s+(.*)$/); if (h) { cur = { title: strip(h[1]), lines: [] }; blocks.push(cur); } else if (cur) cur.lines.push(l); }
  const flows = blocks.map((b) => {
    const tbl = tableOf(b.lines), text = [b.title, ...b.lines.filter((l) => !/^\s*\|/.test(l))].join(' ');
    const ms = (x) => { const m = String(x).match(/([\d.,]+)\s*(ms|s)\b/i); return m ? parseFloat(m[1].replace(',', '.')) * (/^s$/i.test(m[2]) ? 1000 : 1) : null; };
    const hops = tbl ? tbl.rows.map((r) => { const g = (re) => strip(r[col(tbl, re)] || ''), v = parseFloat(g(/p95|budget|ms/i)); const st = F.norm(g(/status|estado/i));
      return { n: g(/^Hop|^#|Salto/i), name: g(/Component|Componente/i), ms: Number.isFinite(v) ? v : null,
        status: /over|exced|fuera/.test(st) ? 'over' : /tight|justo|ajust/.test(st) ? 'tight' : /untracked|sin medir|not documented|sin documentar/.test(st) || !Number.isFinite(v) ? 'untracked' : 'within' }; }) : [];
    return { title: b.title, target: ms((text.match(/[≤<]=?\s*[\d.,]+\s*(?:ms|s)\b/) || [''])[0]) || ms(text), hops };
  }).filter((x) => x.hops.length);
  if (!flows.length) throw Object.assign(new Error(`${rep.file} has no per-flow budget breakdown`), { code: 1 });
  const pick = (f && (flows.find((x) => new RegExp(`\\b(flow|flujo)\\s*${f.replace(/\D/g, '') || '\\0'}\\b`, 'i').test(x.title) && /^\d+$/.test(f))
    || flows.find((x) => normName(x.title).includes(f)))) || flows.find((x) => x.hops.some((h) => h.status === 'over')) || flows[0];
  return { kind, lens, file: rep.file, date: rep.date, flow: pick, flows, focus };
}

/** The frame every picture shares: night ground, her blazon in the mood's ring, kicker, title, subtitle, a footer. */
function frame({ W: w = W, H, mood, kicker, title, sub, body, footer, embed, fonts }) {
  const ring = { pleased: '#4dffa0', worried: '#ffd23f', calm: AQUA, thinking: AQUA }[mood] || AQUA;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">
<defs><style>${fonts ? fontFaces() : ''}</style>
<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(46,230,230,0.06)" stroke-width="1"/></pattern></defs>
<rect width="${w}" height="${H}" fill="${NIGHT}"/><rect width="${w}" height="${H}" fill="url(#grid)"/>
<rect x="24" y="24" width="${w - 48}" height="${H - 48}" rx="24" fill="none" stroke="${ring}" stroke-opacity="0.55" stroke-width="2"/>
${mark(ring, embed)}
<text x="196" y="82" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="16" letter-spacing="2" fill="${AQUA}">${esc(cut(kicker, 64))}</text>
<text x="196" y="128" font-family="Nunito, sans-serif" font-weight="800" font-size="40" fill="#fff">${esc(cut(title, 46))}</text>
<text x="196" y="164" font-family="Nunito, sans-serif" font-size="20" fill="${SILVER}">${esc(cut(sub, 90))}</text>
${body}
<text x="${w - 56}" y="${H - 46}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="15" fill="${MUTED}">${esc(footer)}</text>
</svg>
`;
}
const txt = (x, y, s, { size = 18, fill = SILVER, weight = 400, anchor = 'start', mono = false } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${mono ? 'IBM Plex Mono, monospace' : 'Nunito, sans-serif'}" font-weight="${weight}" font-size="${size}" fill="${fill}">${esc(s)}</text>`;

/** One lens's figure as SVG. */
function lensSvg(m, info, { embed = true, fonts = embed, date = '' } = {}) {
  const es = info.lang === 'es', t = { ...FT[es ? 'es' : 'en'], sev: T[es ? 'es' : 'en'].sev }, lt = (LENS_TITLE[m.lens] || [m.lens, m.lens])[es ? 1 : 0];
  const kicker = [es ? 'ANÁLISIS DE LA ARQUITECTURA' : 'ARCHITECTURE ANALYSIS', info.name.toUpperCase(), info.version && `V${info.version}`].filter(Boolean).join(' · ');
  const footer = ['Alia', `${t.report} ${m.date || ''}`.trim(), date].filter(Boolean).join(' · ');
  if (m.kind === 'heatmap') {
    const h = m.heat, ny = h.rows.length, nx = Math.max(...h.rows.map((r) => r.cells.length)), gx = 230, gy = 236, cw = Math.min(170, Math.floor(620 / nx)), ch = 96;
    const placed = h.rows.flatMap((r) => r.cells.flat());
    const sevOf = (id) => (m.items.get(id) || {}).severity;
    let body = txt(gx, gy - 16, `${h.ylabel || ''} ↑`, { size: 15, mono: true, fill: MUTED });
    h.rows.forEach((r, yi) => {
      body += txt(gx - 14, gy + yi * ch + ch / 2 + 5, r.label, { size: 14, mono: true, anchor: 'end', fill: SILVER });
      for (let xi = 0; xi < nx; xi++) {
        const heat = (xi + (ny - 1 - yi)) / Math.max(1, nx - 1 + ny - 1), x = gx + xi * cw, y = gy + yi * ch;
        body += `<rect x="${x}" y="${y}" width="${cw - 4}" height="${ch - 4}" rx="10" fill="${COLOR.critical}" fill-opacity="${(0.04 + heat * 0.26).toFixed(2)}" stroke="${LINE}"/>`;
        (r.cells[xi] || []).forEach((id, k) => {
          const px = x + 10 + (k % 3) * 52, py = y + 12 + Math.floor(k / 3) * 30, on = m.hit(id);
          body += `<rect x="${px}" y="${py}" width="48" height="24" rx="12" fill="${COLOR[sevOf(id)] || MUTED}" opacity="${on ? 1 : 0.22}"/>`
            + txt(px + 24, py + 17, cut(id, 6), { size: 13, mono: true, weight: 600, anchor: 'middle', fill: NIGHT });
        });
      }
    });
    h.xlabels.slice(0, nx).forEach((l, xi) => { body += txt(gx + xi * cw + cw / 2, gy + ny * ch + 22, l, { size: 13, mono: true, anchor: 'middle', fill: SILVER }); });
    body += txt(gx + (nx * cw) / 2, gy + ny * ch + 48, `${h.xlabel || ''} →`, { size: 15, mono: true, anchor: 'middle', fill: MUTED });
    const lx = gx + nx * cw + 30, shown = placed.filter(m.hit).slice(0, 14);
    shown.forEach((id, k) => { const it = m.items.get(id) || {}; body += `<circle cx="${lx + 7}" cy="${gy + 14 + k * 30}" r="7" fill="${COLOR[it.severity] || MUTED}"/>`
      + `<text x="${lx + 22}" y="${gy + 20 + k * 30}" font-family="Nunito, sans-serif" font-size="17" fill="#fff"><tspan font-family="IBM Plex Mono, monospace" font-weight="600" fill="${AQUA}">${esc(id)}</tspan> ${esc(cut(strip(it.label || ''), 30))}</text>`; });
    const H = Math.max(gy + ny * ch + 120, gy + shown.length * 30 + 90);
    const crit = placed.some((id) => sevOf(id) === 'critical');
    return frame({ H, mood: crit ? 'worried' : 'thinking', kicker, title: `${lt} — ${t.heat}`, sub: [t.findings(placed.length), m.focus && `${t.focus}: ${m.focus}`].filter(Boolean).join(' · '), body, footer, embed, fonts });
  }
  const dim = (on) => (on ? 1 : 0.25);
  if (m.kind === 'headroom') {
    const top = 236, rh = 66, bx = 420, bw = 460, rows = m.rows, nd = rows.filter((r) => r.pct == null).length;
    let body = txt(bx, top - 14, `${t.headroom} %`, { size: 14, mono: true, fill: MUTED });
    rows.forEach((r, i) => {
      const y = top + i * rh, on = m.hit(r.name), tone = r.pct == null ? MUTED : r.pct < 20 ? COLOR.critical : r.pct < 40 ? COLOR.high : COLOR.medium;
      const of = r.load && r.max ? (r.load === r.max ? r.load : `${r.load} / ${r.max}`) : r.max ? `max ${r.max}` : '';
      body += `<g opacity="${dim(on)}">` + txt(56, of ? y + 26 : y + 31, cut(r.name, 30), { size: 18, fill: '#fff', weight: 800 }) + (of ? txt(56, y + 50, cut(of, 38), { size: 14, mono: true, fill: MUTED }) : '');
      body += r.pct == null ? `<rect x="${bx}" y="${y + 14}" width="${bw}" height="24" rx="6" fill="none" stroke="${MUTED}" stroke-dasharray="6 6"/>` + txt(bx + bw / 2, y + 31, t.none, { size: 14, anchor: 'middle', fill: MUTED, mono: true })
        : `<rect x="${bx}" y="${y + 14}" width="${bw}" height="24" rx="6" fill="${NIGHT2}"/><rect x="${bx}" y="${y + 14}" width="${Math.max(3, (Math.min(100, Math.max(0, r.pct)) / 100) * bw).toFixed(1)}" height="24" rx="6" fill="${tone}"/>` + txt(bx + bw + 14, y + 31, `${r.pct}%`, { size: 16, mono: true, fill: SILVER });
      body += txt(bx + bw + 80, y + 31, cut(r.risk, 20), { size: 15, fill: MUTED }) + `<line x1="48" y1="${y + rh - 2}" x2="${W - 48}" y2="${y + rh - 2}" stroke="${LINE}"/></g>`;
    });
    return frame({ H: top + rows.length * rh + 110, mood: rows.some((r) => r.pct != null && r.pct < 20) ? 'worried' : nd ? 'thinking' : 'pleased', kicker, title: lt,
      sub: [t.components(rows.length), nd && t.undocumented(nd, rows.length)].filter(Boolean).join(' · '), body, footer, embed, fonts });
  }
  if (m.kind === 'coupling') {
    const top = 250, rh = 50, axis = 640, half = 300, rows = m.rows.slice().sort((a, b) => b.fanin + b.fanout - (a.fanin + a.fanout)).slice(0, 14), mx = Math.max(1, ...rows.flatMap((r) => [r.fanin, r.fanout]));
    let body = txt(axis - 12, top - 18, `← ${t.fanin}`, { size: 14, mono: true, anchor: 'end', fill: COLOR.medium }) + txt(axis + 12, top - 18, `${t.fanoutC} →`, { size: 14, mono: true, fill: COLOR.high })
      + `<line x1="${axis}" y1="${top - 8}" x2="${axis}" y2="${top + rows.length * rh}" stroke="${LINE}" stroke-width="2"/>`;
    rows.forEach((r, i) => {
      const y = top + i * rh, wi = (r.fanin / mx) * half, wo = (r.fanout / mx) * half;
      body += `<g opacity="${dim(m.hit(r.name))}">` + txt(56, y + 28, cut(r.name, 22), { size: 17, fill: '#fff', weight: 800 })
        + `<rect x="${(axis - wi).toFixed(1)}" y="${y + 12}" width="${Math.max(2, wi).toFixed(1)}" height="22" rx="5" fill="${COLOR.medium}"/>` + txt(axis - wi - 8, y + 28, String(r.fanin), { size: 14, mono: true, anchor: 'end', fill: SILVER })
        + `<rect x="${axis}" y="${y + 12}" width="${Math.max(2, wo).toFixed(1)}" height="22" rx="5" fill="${COLOR.high}"/>` + txt(axis + wo + 8, y + 28, String(r.fanout), { size: 14, mono: true, fill: SILVER })
        + txt(1010, y + 28, `${t.instab} ${r.inst == null ? '—' : r.inst.toFixed(2)}`, { size: 15, mono: true, fill: SILVER }) + txt(1090, y + 28, r.klass.join(' '), { size: 15, mono: true, weight: 600, fill: r.klass.length ? COLOR.critical : MUTED }) + '</g>';
    });
    return frame({ H: top + rows.length * rh + 100, mood: rows.some((r) => r.klass.length) ? 'worried' : 'thinking', kicker, title: lt, sub: t.components(m.rows.length), body, footer, embed, fonts });
  }
  if (m.kind === 'pareto') {
    const top = 240;
    if (!m.rows.length) {
      let body = txt(56, top, t.noCost, { size: 19, fill: SILVER, weight: 800 });
      m.mentions.slice(0, 8).forEach((q, i) => { const y = top + 46 + i * 64; body += `<g opacity="${dim(m.hit(q.name))}">` + txt(56, y, `${q.id}  ${cut(q.name, 40)}`, { size: 17, mono: true, weight: 600, fill: AQUA }) + txt(56, y + 26, cut(q.text, 110), { size: 17, fill: '#fff' }) + '</g>'; });
      return frame({ H: top + 46 + Math.min(8, m.mentions.length) * 64 + 90, mood: 'thinking', kicker, title: lt, sub: t.mentions(m.mentions.length), body, footer, embed, fonts });
    }
    const rows = m.rows.slice(0, 12), total = m.rows.reduce((n, r) => n + r.cost, 0), mx = rows[0].cost, bx = 400, bw = 520, rh = 50;
    let acc = 0, body = '', pts = [];
    rows.forEach((r, i) => {
      const y = top + i * rh; acc += r.cost; const cum = (acc / total) * 100;
      body += `<g opacity="${dim(m.hit(r.name))}">` + txt(56, y + 28, cut(r.name, 28), { size: 17, fill: '#fff', weight: 800 }) + `<rect x="${bx}" y="${y + 12}" width="${Math.max(2, (r.cost / mx) * bw).toFixed(1)}" height="22" rx="5" fill="${cum <= 80 ? COLOR.high : COLOR.medium}"/>`
        + txt(bx + (r.cost / mx) * bw + 10, y + 28, `$${Math.round(r.cost).toLocaleString('en-US')}`, { size: 14, mono: true, fill: SILVER }) + '</g>';
      pts.push([1060 + (cum / 100) * 0, y + 23, cum]);
    });
    body += pts.map(([, y, c]) => txt(1080, y + 5, `${c.toFixed(0)}%`, { size: 14, mono: true, anchor: 'end', fill: c <= 80 ? COLOR.high : MUTED })).join('') + txt(1080, top - 14, t.cumulative, { size: 13, mono: true, anchor: 'end', fill: MUTED });
    return frame({ H: top + rows.length * rh + 100, mood: 'thinking', kicker, title: lt, sub: `${t.monthly}: $${Math.round(total).toLocaleString('en-US')} · ${t.components(m.rows.length)}`, body, footer, embed, fonts });
  }
  if (m.kind === 'flows') {
    // columns by depth from the sources: a node's column is one past the deepest of its callers (cycles cut)
    const nodes = [...new Set(m.steps.flatMap((x) => [x.from, x.to]))], depth = new Map(nodes.map((n) => [n, 0]));
    for (let k = 0; k < nodes.length; k++) for (const x of m.steps) if (x.from !== x.to) depth.set(x.to, Math.max(depth.get(x.to), Math.min(depth.get(x.from) + 1, 3)));
    const cols = Math.max(...depth.values()) + 1, cw = Math.min(330, Math.floor((W - 150 - (cols - 1) * 40) / cols)), top = 250, byCol = new Map();
    nodes.forEach((n) => { const d = depth.get(n); byCol.set(d, [...(byCol.get(d) || []), n]); });
    const pos = new Map(), nh = 54;
    for (const [d, list] of byCol) list.forEach((n, i) => pos.set(n, { x: 70 + d * (cw + 40), y: top + i * (nh + 26) }));
    const tierC = { S1: COLOR.critical, S2: COLOR.high, S3: COLOR.medium, S4: MUTED };
    let body = '';
    const seen = new Set(), gapTags = [];
    m.steps.forEach((x) => {
      const a = pos.get(x.from), b = pos.get(x.to), key = `${x.from}→${x.to}`; if (!a || !b || seen.has(key)) return; seen.add(key);
      const tone = x.gap ? COLOR.critical : x.enc === 'yes' ? AQUA : x.enc === 'local' ? MUTED : COLOR.high;
      const x1 = a.x + cw, y1 = a.y + nh / 2, x2 = b.x, y2 = b.y + nh / 2, back = x2 <= x1;
      const d = back ? `M${a.x + cw / 2},${a.y + nh} C${a.x + cw / 2},${a.y + nh + 60} ${b.x + cw / 2},${b.y + nh + 60} ${b.x + cw / 2},${b.y + nh}` : `M${x1},${y1} C${x1 + 30},${y1} ${x2 - 30},${y2} ${x2},${y2}`;
      body += `<path d="${d}" fill="none" stroke="${tone}" stroke-width="${x.sensitive ? 3 : 1.5}" ${x.enc === 'no' && !x.gap ? 'stroke-dasharray="6 5"' : ''} opacity="0.9"/>`;
      if (x.gap) gapTags.push([b.x + 12, b.y - 8, `${x.gap} ←`, 'start']);
    });
    // the gaps after the boxes, so none hides behind one: beside the end each one reaches
    const gapLayer = () => gapTags.map(([gx, gy, g, anchor]) => txt(gx, gy, g, { size: 13, mono: true, weight: 600, anchor, fill: COLOR.critical })).join('');
    for (const [n, p] of pos) { const tier = m.tierOf(n), c = tierC[tier] || LINE; body += `<rect x="${p.x}" y="${p.y}" width="${cw}" height="${nh}" rx="12" fill="${NIGHT2}" stroke="${c}" stroke-width="2"/>` + txt(p.x + 14, p.y + 33, cut(n, Math.floor(cw / 10)), { size: 15, fill: '#fff', weight: 800 }) + (tier ? txt(p.x + cw - 12, p.y + 33, tier, { size: 13, mono: true, anchor: 'end', fill: c, weight: 600 }) : ''); }
    body += gapLayer();
    const H = top + Math.max(...[...byCol.values()].map((l) => l.length)) * (nh + 26) + 150, ly = H - 80;
    body += [[AQUA, t.enc, ''], [COLOR.high, t.encNo, 'stroke-dasharray="6 5"'], [COLOR.critical, t.gap, '']].map(([c, l, dash], i) => `<line x1="${56 + i * 300}" y1="${ly}" x2="${96 + i * 300}" y2="${ly}" stroke="${c}" stroke-width="3" ${dash}/>` + txt(106 + i * 300, ly + 6, l, { size: 16 })).join('');
    const gaps = m.steps.filter((x) => x.gap).length;
    return frame({ H, mood: gaps ? 'worried' : 'pleased', kicker, title: lt, sub: [t.flows, t.steps(m.steps.length), gaps && t.gaps(gaps), m.focus && `${t.focus}: ${m.focus}`].filter(Boolean).join(' · '), body, footer, embed, fonts });
  }
  if (m.kind === 'matrix') {
    const cats = ['S', 'T', 'R', 'I', 'D', 'E'], top = 260, rh = 66, cx0 = 560, cw = 96;
    let body = cats.map((c, k) => txt(cx0 + k * cw + cw / 2, top - 16, c, { size: 20, mono: true, weight: 600, anchor: 'middle', fill: AQUA })).join('');
    m.groups.forEach((g, i) => {
      const y = top + i * rh;
      body += txt(56, y + 28, g.id, { size: 15, mono: true, weight: 600, fill: AQUA }) + txt(56, y + 50, cut(g.title, 46), { size: 15, fill: '#fff' });
      cats.forEach((c, k) => {
        const rows = g.rows.filter((r) => r.cat === c), found = rows.filter((r) => !r.pass), worst = found.map((r) => r.sev).sort((a, b) => (RANK_[b] || 0) - (RANK_[a] || 0))[0];
        const x = cx0 + k * cw, fill = found.length ? COLOR[worst] || MUTED : rows.length ? NIGHT2 : 'none';
        body += `<rect x="${x + 4}" y="${y + 6}" width="${cw - 8}" height="${rh - 12}" rx="10" fill="${fill}" ${found.length ? '' : `stroke="${rows.length ? '#4dffa0' : LINE}" stroke-width="${rows.length ? 2 : 1}"`}/>`
          + txt(x + cw / 2, y + rh / 2 + 6, found.length ? String(found.length) : rows.length ? '✓' : '—', { size: 18, mono: true, weight: 800, anchor: 'middle', fill: found.length ? NIGHT : rows.length ? '#4dffa0' : MUTED });
      });
    });
    const ly = top + m.groups.length * rh + 40;
    body += SEVS.map((sv, k) => `<rect x="${56 + k * 150}" y="${ly - 13}" width="16" height="16" rx="3" fill="${COLOR[sv]}"/>` + txt(80 + k * 150, ly, t.sev ? t.sev[sv] : sv, { size: 16 })).join('') + txt(56 + 4 * 150, ly, `✓ ${t.pass}`, { size: 16, fill: '#4dffa0' });
    const crit = m.groups.some((g) => g.rows.some((r) => !r.pass && (r.sev === 'critical' || r.sev === 'high')));
    return frame({ H: ly + 90, mood: crit ? 'worried' : 'thinking', kicker, title: `${lt} — ${t.matrix}`, sub: t.boundaries(m.groups.length), body, footer, embed, fonts });
  }
  if (m.kind === 'graph') {
    const r = m.row, cx = 520, cy = 480, r1 = 165, r2 = 290;
    const tone = /cascad/i.test(r.cascade) ? COLOR.critical : /partial|parcial/i.test(r.cascade) ? COLOR.high : COLOR.medium;
    const pos = (list, rad, off) => list.map((n, k) => { const a = -Math.PI / 2 + off + (2 * Math.PI * k) / Math.max(1, list.length); return { n, x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }; });
    const P1 = pos(r.direct, r1, 0), P2 = pos(r.indirect, r2, Math.PI / Math.max(2, r.indirect.length));
    const linked = (a, b) => m.links.some((l) => !l.retired && ((normName(l.from) === normName(a) && normName(l.to) === normName(b)) || (normName(l.from) === normName(b) && normName(l.to) === normName(a))));
    let body = `<circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${LINE}" stroke-dasharray="4 8"/><circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${LINE}" stroke-dasharray="4 8"/>`;
    P2.forEach((q) => { const via = P1.find((p) => linked(p.n, q.n)); body += via ? `<line x1="${via.x}" y1="${via.y}" x2="${q.x}" y2="${q.y}" stroke="${COLOR.high}" stroke-width="2" opacity="0.7"/>` : `<line x1="${cx}" y1="${cy}" x2="${q.x}" y2="${q.y}" stroke="${COLOR.high}" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.5"/>`; });
    P1.forEach((p) => { body += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${tone}" stroke-width="3"/>`; });
    const node = (x, y, name, fill, stroke, w = 190) => `<rect x="${x - w / 2}" y="${y - 22}" width="${w}" height="44" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` + txt(x, y + 6, cut(name, 22), { size: 15, anchor: 'middle', fill: '#fff', weight: 800 });
    P2.forEach((q) => { body += node(q.x, q.y, q.n, NIGHT2, COLOR.high); });
    P1.forEach((p) => { body += node(p.x, p.y, p.n, NIGHT2, tone); });
    body += `<circle cx="${cx}" cy="${cy}" r="72" fill="${NIGHT}"/><circle cx="${cx}" cy="${cy}" r="70" fill="${tone}" fill-opacity="0.18" stroke="${tone}" stroke-width="3"/>` + txt(cx, cy - 4, cut(r.name, 18), { size: 18, anchor: 'middle', fill: '#fff', weight: 800 })
      + txt(cx, cy + 22, `${r.id} · ${r.tier}`, { size: 14, mono: true, anchor: 'middle', fill: SILVER });
    const lx = 930, facts = [[t.fanout, r.fanout], [t.cascade, r.cascade], [t.bulkhead, r.bulkhead], [t.direct, String(r.direct.length)], [t.indirect, String(r.indirect.length)]];
    facts.forEach(([k, v], i) => { body += txt(lx, 270 + i * 54, k.toUpperCase(), { size: 13, mono: true, fill: MUTED }) + txt(lx, 294 + i * 54, cut(v || t.none, 18), { size: 19, fill: '#fff', weight: 800 }); });
    return frame({ H: 820, mood: /cascad/i.test(r.cascade) ? 'worried' : 'thinking', kicker, title: `${lt} — ${r.name}`, sub: `${r.direct.length} ${t.direct} · ${r.indirect.length} ${t.indirect}`, body, footer, embed, fonts });
  }
  // waterfall
  const fl = m.flow, known = fl.hops.filter((h) => h.ms != null), total = known.reduce((n, h) => n + h.ms, 0), scaleMax = Math.max(total, fl.target || 0, 1) * 1.08;
  const bx = 330, bw = 720, top = 236, rh = 58, sc = (v) => (v / scaleMax) * bw, stc = { over: COLOR.critical, tight: COLOR.high, within: COLOR.medium, untracked: MUTED };
  let at = 0, body = '';
  fl.hops.forEach((h, i) => {
    const y = top + i * rh;
    body += txt(56, y + 30, `${h.n || i + 1}`, { size: 16, mono: true, fill: MUTED }) + txt(96, y + 30, cut(h.name, 24), { size: 18, fill: '#fff', weight: 800 });
    if (h.ms == null) body += `<rect x="${bx + sc(at)}" y="${y + 12}" width="46" height="26" rx="6" fill="none" stroke="${MUTED}" stroke-dasharray="4 4"/>` + txt(bx + sc(at) + 23, y + 31, '?', { size: 16, anchor: 'middle', fill: MUTED, weight: 800 });
    else { body += `<rect x="${(bx + sc(at)).toFixed(1)}" y="${y + 12}" width="${Math.max(3, sc(h.ms)).toFixed(1)}" height="26" rx="6" fill="${stc[h.status]}"/>` + txt(bx + sc(at + h.ms) + 10, y + 31, `${h.ms} ms`, { size: 15, mono: true, fill: SILVER }); at += h.ms; }
    body += `<line x1="48" y1="${y + rh - 4}" x2="${W - 48}" y2="${y + rh - 4}" stroke="${LINE}"/>`;
  });
  const endY = top + fl.hops.length * rh;
  if (fl.target) body += `<line x1="${bx + sc(fl.target)}" y1="${top - 6}" x2="${bx + sc(fl.target)}" y2="${endY + 6}" stroke="${COLOR.critical}" stroke-width="2" stroke-dasharray="8 6"/>` + txt(bx + sc(fl.target), top - 12, `${t.target} ${fl.target} ms`, { size: 14, mono: true, anchor: 'middle', fill: COLOR.critical });
  const untracked = fl.hops.filter((h) => h.ms == null).length;
  body += txt(bx, endY + 40, `${t.documented}: ${total} ms${fl.target ? ` / ${t.target} ${fl.target} ms` : ''}${untracked ? ` · ${t.untracked(untracked)}` : ''}`, { size: 18, fill: total > (fl.target || Infinity) ? COLOR.critical : SILVER, weight: 800 });
  ['within', 'tight', 'over'].forEach((k, i) => { body += `<rect x="${56 + i * 150}" y="${endY + 76}" width="16" height="16" rx="3" fill="${stc[k]}"/>` + txt(80 + i * 150, endY + 89, t[k], { size: 16 }); });
  const over = fl.hops.some((h) => h.status === 'over') || (fl.target && total > fl.target);
  return frame({ H: endY + 150, mood: over ? 'worried' : 'pleased', kicker, title: `${lt} — ${cut(fl.title.replace(/\s*\(.*\)\s*$/, ''), 30)}`, sub: fl.title, body, footer, embed, fonts });
}

function findChrome(given) {
  for (const c of [given, process.env.SA_CHROME, process.env.PUPPETEER_EXECUTABLE_PATH, process.env.CHROME_PATH].filter(Boolean)) if (fs.existsSync(c)) return c;
  const cache = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  const sub = { linux: 'chrome-linux64/chrome', darwin: 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', win32: 'chrome-win64/chrome.exe' }[process.platform];
  if (sub && fs.existsSync(cache)) {
    const hit = fs.readdirSync(cache).sort((x, y) => y.localeCompare(x, undefined, { numeric: true })).map((v) => path.join(cache, v, sub)).find((f) => fs.existsSync(f));
    if (hit) return hit;
  }
  for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) { const w = Bun.which(n); if (w) return w; }
  return null;
}

/** The SVG as a PNG at twice its size, through headless Chrome over the DevTools protocol (snapshot.js's way: Chrome's own
 *  --screenshot never exits under --headless=new); false when there is no Chrome. */
async function toPng(svg, out, chromeGiven) {
  const chrome = findChrome(chromeGiven);
  if (!chrome) return false;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-chart-'));
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const page = path.join(dir, 'chart.html');
  fs.writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${NIGHT}}svg{display:block}</style></head><body>${svg}</body></html>`);
  const proc = Bun.spawn([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, '--remote-debugging-port=0',
    `--user-data-dir=${path.join(dir, 'profile')}`, 'about:blank'], { stdout: 'ignore', stderr: 'pipe' });
  try {
    let buf = '', ws = null; const rd = proc.stderr.getReader(), dec = new TextDecoder(), t0 = Date.now();
    while (!ws) { const { value, done } = await rd.read(); if (done || Date.now() - t0 > 30000) return false; buf += dec.decode(value); ws = (buf.match(/ws:\/\/\S+/) || [])[0]; }
    const sock = new WebSocket(ws); await new Promise((r) => { sock.onopen = r; });
    let id = 0; const pend = new Map();
    sock.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
    const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params, sessionId })); });
    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
    const { result: { sessionId: s } } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, s);
    await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: false }, s);
    await send('Page.navigate', { url: `file://${page}` }, s);
    await Bun.sleep(1200);                                                     // the embedded fonts and the blazon decode
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: +w, height: +h, scale: 1 } }, s);
    if (!shot.result || !shot.result.data) return false;
    fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
    try { sock.close(); } catch { /* closed */ }
    return true;
  } finally { try { proc.kill(); } catch { /* gone */ } try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* busy */ } }
}

module.exports = { chartSvg, stateModel, diffModel, about, toPng, lensModel, lensSvg, parseHeat, FIGURE, VIEWS };

if (require.main === module) {
  const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const root = argv.find((a, i) => !a.startsWith('--') && !['--base', '--lenses', '--out', '--chrome', '--judge-answers', '--lens', '--focus', '--view'].includes(argv[i - 1]));
  if (!root) { console.error('usage: bun analysis-chart.js <project> [--base <git-ref> --lenses spof,stride,…] [--out <file.png|file.svg>] [--json]'); process.exit(2); }
  (async () => {
    const info = about(root), base = opt('--base');
    const lenses = (opt('--lenses') || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (base && !lenses.length) { console.error('analysis-chart: --base needs --lenses'); process.exit(2); }
    const lens = (opt('--lens') || '').toLowerCase(), today = new Date().toISOString().slice(0, 10);
    let m, draw;
    if (lens) { m = lensModel(root, lens, opt('--focus'), opt('--view')); draw = (o) => lensSvg(m, info, o); }
    else {
      m = base ? await diffModel(root, base, lenses, { answers: opt('--judge-answers') }) : stateModel(root);
      if (!m.lenses.length) { console.error('analysis-chart: no analysis report under analysis/'); process.exit(1); }
      draw = (o) => chartSvg(m, info, o);
    }
    if (argv.includes('--json')) { console.log(JSON.stringify(m, (k, v) => (v instanceof Map ? Object.fromEntries(v) : typeof v === 'function' ? undefined : v), 2)); return; }
    const svg = draw({ date: today });
    let out = opt('--out') || path.join(root, '.cache', 'sa-skills', 'analysis', 'analysis-chart.png');
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    // the SVG always, beside the picture: the same drawing a surface that draws vector pictures shows natively (sa-alia, desktop)
    // lean: her blazon inlined, the fonts by name — a surface's vector element takes 128 KB at most (sa-alia's Svg)
    const svgOut = out.replace(/\.(png|svg)$/i, '') + '.svg';
    fs.writeFileSync(svgOut, draw({ fonts: false, date: today }));
    if (!/\.svg$/i.test(out) && !(await toPng(svg, out, opt('--chrome')))) { console.error('analysis-chart: no Chrome — the SVG only'); out = svgOut; }
    console.log(out);
  })().catch((e) => { console.error(`analysis-chart: ${e.message}`); process.exit(e.code || 1); });
}
