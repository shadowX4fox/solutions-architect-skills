#!/usr/bin/env node
// security-posture.js — the Security Posture validation checklist, consolidated by code (8.50.0).
//
//   bun security-posture.js <project_root> [--today YYYY-MM-DD] [--out <path>] [--json] [--judge agent|typesafe|clef]
//
// The spec (analyses/SECURITY_POSTURE.md) is a merge: every cell of every per-boundary STRIDE
// matrix and every row of the High-Priority Threats table becomes one check; every S1 / S2 store of
// the Data Inventory yields one check per control its tier requires, marked from the inventory's
// own columns and the G1–G5 gap tables. Nothing is judged and nothing is invented — a control the
// source report never assessed prints `[NOT DOCUMENTED]` and goes to the gaps — so an agent was the
// wrong tool for it. Reads the newest `analysis/STRIDE-*.md` and `analysis/DATA-SENSITIVITY-*.md`
// with the findings parser's helpers, writes `analysis/SECURITY-POSTURE-<date>.md` in the
// architecture's language, with the reviewer columns (`Status`, `Owner`, `Evidence`) empty — the
// Word exporter renders those as editable cells and colours `Sev` / `Tier` by value.
'use strict';
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');
const F = require(fromSaSkills('scripts', 'shared', 'findings.js'));
const { resolveNames } = require(fromSaSkills('scripts', 'resolve-name.js'));
let bindNote = null, bindEngine = null, bindPending = null; const bindReview = [], bindUndecided = [];   // the gap-row → store binding (below), reported at the end

const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const root = path.resolve(args.find((a) => !a.startsWith('--') && (args.indexOf(a) === 0 || !args[args.indexOf(a) - 1].startsWith('--'))) || '.');
const today = opt('--today') || new Date().toISOString().slice(0, 10);
const jsonOut = args.includes('--json');
const aDir = path.join(root, 'analysis');

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const latest = (slug) => { if (!exists(aDir)) return null; const f = fs.readdirSync(aDir).filter((n) => new RegExp(`^${slug}-\\d{4}-\\d{2}-\\d{2}\\.md$`, 'i').test(n)).sort().pop(); return f ? path.join(aDir, f) : null; };
const cellText = (v) => String(v == null ? '' : v).replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();
const table = (columns, rows) => ['| ' + columns.join(' | ') + ' |', '|' + columns.map(() => '---').join('|') + '|', ...rows.map((r) => '| ' + r.map(cellText).join(' | ') + ' |')].join('\n');

// ---- the architecture's header and language
const archPath = path.join(root, 'ARCHITECTURE.md');
const arch = exists(archPath) ? read(archPath) : '';
const marker = (k) => (arch.match(new RegExp('<!--\\s*' + k + ':\\s*([^>]*?)\\s*-->')) || [])[1] || null;
const lang = (marker('DOC_LANGUAGE') || marker('LANGUAGE') || 'en').toLowerCase() === 'es' ? 'es' : 'en';
const project = { name: F.plain((arch.match(/^#\s+(.+)$/m) || ['', 'Architecture'])[1]).replace(/\s*[—–-]\s*(Arquitectura|Architecture)\s*$/i, ''), version: marker('ARCHITECTURE_VERSION') || '?', status: marker('ARCHITECTURE_STATUS') || 'Draft' };

const W = {
  en: { title: 'Security Posture Validation', date: 'Analysis Date', source: 'Architecture Source', analyst: 'Analyst', analystName: 'Architecture Analysis Skill', sum: 'Executive Summary', scope: 'Scope and Sources', stride: 'STRIDE Controls', data: 'Data Protection Controls', vsum: 'Validation Summary', prio: 'Top Validation Priorities', verdict: 'Summary Verdict', gaps: 'Documentation Gaps', citations: 'Source Citations',
    instr: 'Mark each control Pass / Fail / N/A in the Status column; assign an Owner and link Evidence during the review.', missing: (r) => `[NOT GENERATED — run the ${r} analysis first]`, documented: '✅ Documented', gap: '⚠️ Gap', notAssessed: '[NOT DOCUMENTED]',
    exec: (s) => `${s.total} checks consolidated from ${s.sources.join(' and ') || 'no source report'}: ${s.documented} documented, ${s.gap} gaps (${s.high} high or critical), ${s.unassessed} not assessed by the source reports. S3 / S4 stores summarized, not enumerated: ${s.s34}.${s.missing.length ? ` Missing source: ${s.missing.join(', ')}.` : ''}`,
    verdictText: (s) => `${s.strideDoc} of ${s.strideTotal} STRIDE controls and ${s.dataDoc} of ${s.dataTotal} data-protection controls are documented. The systematically gapped family is ${s.worstFamily || 'none'}; the first control to validate before release is ${s.first || 'none'}.`,
    ctrl: { transit: 'Encryption in transit (TLS 1.2+)', rest: 'Encryption at rest (TDE / envelope)', logging: 'Access logging', retention: 'Retention ceiling', deletion: 'Deletion guarantee', access: 'Access control' } },
  es: { title: 'Validación de Postura de Seguridad', date: 'Fecha de análisis', source: 'Fuente de arquitectura', analyst: 'Analista', analystName: 'Architecture Analysis Skill', sum: 'Resumen Ejecutivo', scope: 'Alcance y Fuentes', stride: 'Controles STRIDE', data: 'Controles de Protección de Datos', vsum: 'Resumen de Validación', prio: 'Prioridades de Validación', verdict: 'Veredicto', gaps: 'Brechas de Documentación', citations: 'Fuentes citadas',
    instr: 'Marque cada control como Pass / Fail / N/A en la columna Status; asigne un Owner y enlace la Evidence durante la revisión.', missing: (r) => `[NOT GENERATED — ejecute primero el análisis ${r}]`, documented: '✅ Documented', gap: '⚠️ Gap', notAssessed: '[NOT DOCUMENTED]',
    exec: (s) => `${s.total} controles consolidados desde ${s.sources.join(' y ') || 'ningún reporte fuente'}: ${s.documented} documentados, ${s.gap} brechas (${s.high} altas o críticas), ${s.unassessed} sin evaluar por los reportes fuente. Almacenes S3 / S4 resumidos, no enumerados: ${s.s34}.${s.missing.length ? ` Fuente ausente: ${s.missing.join(', ')}.` : ''}`,
    verdictText: (s) => `${s.strideDoc} de ${s.strideTotal} controles STRIDE y ${s.dataDoc} de ${s.dataTotal} controles de protección de datos están documentados. La familia con brechas sistemáticas es ${s.worstFamily || 'ninguna'}; el primer control a validar antes de la liberación es ${s.first || 'ninguno'}.`,
    ctrl: { transit: 'Cifrado en tránsito (TLS 1.2+)', rest: 'Cifrado en reposo (TDE / sobre)', logging: 'Registro de accesos', retention: 'Techo de retención', deletion: 'Garantía de borrado', access: 'Control de acceso' } },
}[lang];

// ---- Markdown readers: every pipe table with its section and the heading it sits under
function tablesOf(src) {
  const lines = src.split('\n'), out = []; let h2 = '', h3 = '';
  for (let i = 0; i < lines.length; i++) {
    const m2 = lines[i].match(/^##\s+(.+)$/), m3 = lines[i].match(/^###\s+(.+)$/);
    if (m2) { h2 = F.plain(m2[1].replace(/<!--.*?-->/, '')); h3 = ''; continue; } if (m3) { h3 = F.plain(m3[1].replace(/<!--.*?-->/, '')); continue; }
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) continue;
    const headers = F.cells(lines[i]); const rows = []; let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j])) { const c = F.cells(lines[j]); rows.push(Object.fromEntries(headers.map((h, k) => [h, c[k] || '']))); j++; }
    out.push({ h2, h3, headers, rows, line: i + 1 }); i = j - 1;
  }
  return out;
}
const col = (row, re) => { const k = Object.keys(row).find((h) => re.test(F.norm(h))); return k ? row[k] : ''; };
/** `**1. Title (T1-I)**` blocks of a Recommendations section → { id: body } */
function recommendationsOf(src) {
  const out = {}; const re = /\*\*\d+\.\s+([^*]+?)\s*\(([A-Z]{1,3}\d?-?\d{1,3}(?:-[A-Z])?)\)\*\*\s*\n+([\s\S]*?)(?=\n\*\*\d+\.|\n---|\n## |$)/g; let m;
  while ((m = re.exec(src))) out[m[2].toUpperCase()] = { title: F.plain(m[1]), body: F.plain(m[3].split('\n').filter((l) => !/^_?(Source|Fuente)/i.test(l.trim())).join(' ')).trim() };
  return out;
}
const isPresent = (v) => { const t = F.norm(v); return !!t && !/not documented|no documentado|^no$|^none$|^—$|^-$|ausente|sin cifrado|unencrypted|plain/.test(t); };

// ---- STRIDE → checks
const strideFile = latest('STRIDE'), dsFile = latest('DATA-SENSITIVITY');
const missing = []; if (!strideFile) missing.push('STRIDE'); if (!dsFile) missing.push('Data Sensitivity');
if (!strideFile && !dsFile) { console.error('ANALYSIS ABORTED: Security Posture requires analysis/STRIDE-*.md and analysis/DATA-SENSITIVITY-*.md. Run analyses 5 and 10 first.'); process.exit(1); }
const strideChecks = [], dataChecks = [], gaps = [], citations = [];
const sevWord = (s) => { const t = F.norm(s); return /critical|critic/.test(t) ? 'Critical' : /high|alto|alta/.test(t) ? 'High' : /medium|medio|media/.test(t) ? 'Medium' : /low|bajo|baja/.test(t) ? 'Low' : s ? F.plain(s) : '—'; };
let strideRecs = {}, highPriority = new Map();
if (strideFile) {
  const src = read(strideFile); citations.push(path.relative(root, strideFile)); strideRecs = recommendationsOf(src);
  const tabs = tablesOf(src);
  tabs.filter((t) => /trust boundary|frontera/i.test(t.headers.join(' ')) && /recommended mitigation|mitigaci/i.test(t.headers.join(' '))).forEach((t) => t.rows.forEach((r) => { const id = (String(Object.values(r)[0] || '') || '').split(/\s+/)[0].toUpperCase(); if (id) highPriority.set(id, { mitigation: col(r, /mitigation|mitigaci/), boundary: col(r, /trust boundary|frontera/) }); }));
  let n = 0;
  tabs.filter((t) => /^TB-\d+/i.test(t.h3) && /category|categor/i.test(t.headers.join(' '))).forEach((t) => {
    const boundary = F.plain(t.h3).replace(/^TB-\d+\s*[—–-]\s*/i, '');
    t.rows.forEach((r) => {
      const id = (String(Object.values(r)[0] || '') || '').split(/\s+/)[0].toUpperCase(), pass = /pass|✅/i.test(col(r, /status|estado/)) || /^[—–-]$/.test(id);
      const control = pass ? col(r, /control|gap|brecha/) : ((highPriority.get(id) || {}).mitigation || col(r, /control|gap|brecha/));
      n++; strideChecks.push({ id: `S-${String(n).padStart(2, '0')}`, boundary, category: col(r, /category|categor/), control: control || W.notAssessed, sev: pass && !col(r, /severity|severidad/) ? '—' : sevWord(col(r, /severity|severidad/)), finding: pass ? W.documented : `${W.gap}${F.FINDING_ID.test(id) ? ` (${id})` : ''}`, threat: F.FINDING_ID.test(id) ? id : null, gap: !pass });
    });
  });
  if (!strideChecks.length) gaps.push({ subject: 'STRIDE', missing: lang === 'es' ? 'el reporte no tiene matrices por frontera (`### TB-nn`) — ningún control STRIDE pudo consolidarse' : 'the report carries no per-boundary matrices (`### TB-nn`) — no STRIDE control could be consolidated', where: path.relative(root, strideFile) });
}
// ---- Data Sensitivity → checks
let dsRecs = {}, s34 = 0;
if (dsFile) {
  const src = read(dsFile); citations.push(path.relative(root, dsFile)); dsRecs = recommendationsOf(src);
  const tabs = tablesOf(src);
  const inv = tabs.find((t) => /sensitivity tier|nivel de sensibilidad/i.test(t.headers.join(' ')) && /store|almac|data store/i.test(t.headers.join(' ')));
  const gapRows = []; tabs.filter((t) => /^(#|id)$/i.test(t.headers[0] || '')).forEach((t) => t.rows.forEach((r) => { const id = (r[t.headers[0]] || '').split(/\s+/)[0].toUpperCase(); if (/^G[1-5]-\d/.test(id)) gapRows.push({ id, kind: id[1], subject: F.norm(col(r, /data store|store|flow|almac|flujo/)), missing: col(r, /missing control|control faltante|gap|brecha/) }); }));
  // Which data store a G-row is about — a judgement through scripts/resolve-name.js over the inventory's store names. The
  // three-way fuzzy rule this script had (subject contains the store, or the store contains the subject's first word, or
  // the subject's first three words all appear in the store) marked the wrong store gapped and the right one documented,
  // in silence, and drove the Validation Summary and the Top-5 priorities; it is gone (8.119.0). A subject that is exactly
  // a store's name binds by code; one the judge has not answered binds to no store and is listed as a documentation gap.
  const storeNames = inv ? [...new Set(inv.rows.map((r) => F.plain(col(r, /store|almac/))).filter(Boolean))] : [];
  let bound = new Map();
  if (gapRows.length && storeNames.length) { try { bound = await resolveNames(gapRows.map((g, i) => ({ id: `g${i}`, cell: g.subject, context: { gap: g.id } })), storeNames.map((n) => ({ name: n, file_backed: true })), { engine: opt('--judge'), root }); } catch (e) { if (e.name !== 'JudgeError') throw e; bindNote = `${e.message} — every gap row that is not exactly a store's name is undecided`; } }
  bindEngine = bound.engine || null; bindPending = bound.pending || null;
  gapRows.forEach((g, i) => { let r = bound.get(`g${i}`);
    if (!r && storeNames.length) { const exact = storeNames.find((n) => F.norm(n) === F.norm(g.subject)); r = exact ? { resolved: true, name: exact, by: 'exact' } : { resolved: false, undecided: true, by: 'undecided' }; }   // the judge failed: exact names are still code's
    g.store = r && r.resolved ? r.name : null; g.by = r ? r.by : 'undecided';
    if (r && r.undecided) { if (storeNames.length) { bindUndecided.push(g); gaps.push({ subject: `${g.id} \`${g.subject}\``, missing: lang === 'es' ? 'fila de brecha sin almacén asignado — el juez no respondió; no marca ningún control' : 'gap row bound to no store — the judge has not answered; it marks no control', where: path.relative(root, dsFile) }); } }
    else if (!r.resolved) bindReview.push(`${g.id} "${g.subject}" — ${r.unresolved_reason} (${r.by})`);
    else if (r.band === 'mid') bindReview.push(`${g.id} "${g.subject}" → ${r.name} (${r.by} ${r.confidence}) — confirm`); });
  const gapFor = (store, kinds) => gapRows.find((g) => kinds.includes(g.kind) && g.store && F.norm(g.store) === F.norm(store));
  const REQUIRED = { S1: ['transit', 'rest', 'logging', 'retention', 'deletion'], S2: ['transit', 'rest', 'access'] };
  let n = 0;
  if (inv) inv.rows.forEach((r) => {
    const tier = (F.plain(col(r, /sensitivity tier|nivel/)).match(/S[1-4]/) || [''])[0]; const store = F.plain(col(r, /store|almac/)); if (!tier || !store) return;
    if (!REQUIRED[tier]) { s34++; return; }
    REQUIRED[tier].forEach((c) => {
      let finding, gapped = false, assessed = true;
      if (c === 'transit' || c === 'rest') { const v = col(r, c === 'transit' ? /in transit|tr.nsito/ : /at rest|reposo/); const g = gapFor(F.norm(store), c === 'transit' ? ['1'] : ['2']); if (g) { finding = `${W.gap} (${g.id})`; gapped = true; } else if (isPresent(v)) finding = W.documented; else if (F.norm(v)) { finding = W.gap; gapped = true; } else { finding = W.notAssessed; assessed = false; } }
      else if (c === 'retention') { const v = col(r, /retention|retenci/); const g = gapFor(F.norm(store), ['3']); if (g) { finding = `${W.gap} (${g.id})`; gapped = true; } else if (isPresent(v)) finding = W.documented; else { finding = W.notAssessed; assessed = false; } }
      else { const g = gapFor(F.norm(store), ['4', '5']); if (g) { finding = `${W.gap} (${g.id})`; gapped = true; } else { finding = W.notAssessed; assessed = false; } }
      n++; dataChecks.push({ id: `D-${String(n).padStart(2, '0')}`, store, control: W.ctrl[c], tier, finding, gap: gapped, assessed, gapId: (finding.match(/\((G[1-5]-\d+)\)/) || [])[1] || null });
      if (!assessed) gaps.push({ subject: `\`${store}\``, missing: `${W.ctrl[c]} — ${lang === 'es' ? 'el reporte de sensibilidad no lo evaluó' : 'not assessed by the data-sensitivity report'}`, where: path.relative(root, dsFile) });
    });
  });
  else gaps.push({ subject: 'Data Sensitivity', missing: lang === 'es' ? 'el reporte no tiene tabla de inventario con columna Sensitivity Tier' : 'the report carries no inventory table with a Sensitivity Tier column', where: path.relative(root, dsFile) });
}
// the source reports' own gaps are carried forward, never re-derived
[strideFile, dsFile].filter(Boolean).forEach((f) => { const sec = read(f).split(/\n## [^\n]*(?:Documentation Gaps|Brechas de Documentaci)/i)[1] || ''; (sec.match(/^- \[ \] .+$/gm) || []).forEach((l) => gaps.push({ raw: l.replace(/^- \[ \] /, '') })); });
missing.forEach((m) => gaps.push({ subject: m, missing: lang === 'es' ? 'reporte fuente ausente' : 'source report absent', where: `analysis/${m === 'STRIDE' ? 'STRIDE' : 'DATA-SENSITIVITY'}-<date>.md` }));

// ---- summary, priorities, verdict
const rank = (s) => (/critical/i.test(s) ? 4 : /high/i.test(s) ? 3 : /medium/i.test(s) ? 2 : /low/i.test(s) ? 1 : 0);
const sGaps = strideChecks.filter((c) => c.gap), dGaps = dataChecks.filter((c) => c.gap);
const stats = { total: strideChecks.length + dataChecks.length, documented: strideChecks.filter((c) => !c.gap).length + dataChecks.filter((c) => c.finding === W.documented).length, gap: sGaps.length + dGaps.length, high: sGaps.filter((c) => rank(c.sev) >= 3).length + dGaps.filter((c) => c.tier === 'S1').length, unassessed: dataChecks.filter((c) => !c.assessed).length, s34, sources: citations.map((c) => `\`${c}\``), missing, strideDoc: strideChecks.filter((c) => !c.gap).length, strideTotal: strideChecks.length, dataDoc: dataChecks.filter((c) => c.finding === W.documented).length, dataTotal: dataChecks.length };
const byFamily = {}; sGaps.forEach((c) => { const k = (c.category || '?').trim()[0]; byFamily[k] = (byFamily[k] || 0) + 1; }); dGaps.forEach((c) => { byFamily[c.control] = (byFamily[c.control] || 0) + 1; });
stats.worstFamily = Object.entries(byFamily).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`)[0] || null;
const priorities = [...sGaps.map((c) => ({ id: c.id, what: c.control, source: c.threat, sev: rank(c.sev), tier: '', boundary: c.boundary, rec: c.threat && strideRecs[c.threat] })), ...dGaps.map((c) => ({ id: c.id, what: `${c.control} — \`${c.store}\``, source: c.gapId, sev: c.tier === 'S1' ? 4 : 3, tier: c.tier, rec: c.gapId && dsRecs[c.gapId] }))].sort((a, b) => b.sev - a.sev).slice(0, 5);
stats.first = priorities[0] ? `${priorities[0].id} (${priorities[0].what})` : null;

// ---- render
const out = [];
out.push(`# ${W.title} — ${project.name} v${project.version}`, '', `**${W.date}**: ${today}  `, `**${W.source}**: \`ARCHITECTURE.md\` v${project.version} (Status: ${project.status})  `, `**${W.analyst}**: ${W.analystName}`, '', '---', '');
out.push(`## 1. ${W.sum} <!-- SECTION: Executive Summary -->`, '', W.exec(stats), '', '---', '');
out.push(`## 2. ${W.scope} <!-- SECTION: Scope and Sources -->`, '', table(['Source', 'File', 'Date'], [['STRIDE', strideFile ? `\`${path.relative(root, strideFile)}\`` : W.missing('STRIDE'), strideFile ? F.dateOf(strideFile) : '—'], ['Data Sensitivity', dsFile ? `\`${path.relative(root, dsFile)}\`` : W.missing('Data Sensitivity'), dsFile ? F.dateOf(dsFile) : '—'], ['Architecture', `\`ARCHITECTURE.md\` v${project.version}`, today]]), '', W.instr, '', '---', '');
out.push(`## 3. ${W.stride} <!-- SECTION: STRIDE Controls -->`, '', strideChecks.length ? table(['ID', 'Trust Boundary', 'Control to Validate', 'Sev', 'Finding', 'Status', 'Owner', 'Evidence'], strideChecks.map((c) => [c.id, c.boundary, c.control, c.sev, c.finding, '', '', ''])) : table(['ID', 'Trust Boundary', 'Control to Validate', 'Sev', 'Finding', 'Status', 'Owner', 'Evidence'], [[W.missing('STRIDE'), '', '', '', '', '', '', '']]), '', '---', '');
out.push(`## 4. ${W.data} <!-- SECTION: Data Protection Controls -->`, '', dataChecks.length ? table(['ID', 'Data Store / Flow', 'Required Control', 'Tier', 'Finding', 'Status', 'Owner', 'Evidence'], dataChecks.map((c) => [c.id, `\`${c.store}\``, c.control, c.tier, c.finding, '', '', ''])) : table(['ID', 'Data Store / Flow', 'Required Control', 'Tier', 'Finding', 'Status', 'Owner', 'Evidence'], [[W.missing('Data Sensitivity'), '', '', '', '', '', '', '']]), '', '---', '');
out.push(`## 5. ${W.vsum} <!-- SECTION: Validation Summary -->`, '', table(['Source', 'Total Checks', '✅ Documented', '⚠️ Gap', 'High/Critical Gaps'], [['STRIDE', strideChecks.length, stats.strideDoc, sGaps.length, sGaps.filter((c) => rank(c.sev) >= 3).length], ['Data Protection', dataChecks.length, stats.dataDoc, dGaps.length, dGaps.filter((c) => c.tier === 'S1').length], ['Total', stats.total, stats.documented, stats.gap, stats.high]]), '', '---', '');
out.push(`## 6. ${W.prio} <!-- SECTION: Top Validation Priorities -->`, '');
priorities.forEach((p, i) => { out.push(`**${i + 1}. ${p.id} — ${p.what}**`, `${p.source ? `${lang === 'es' ? 'Hallazgo fuente' : 'Source finding'}: ${p.source}. ` : ''}${p.rec ? p.rec.body : (lang === 'es' ? 'Validar el control tal como lo describe el reporte fuente.' : 'Validate the control as the source report describes it.')}`, ''); });
if (!priorities.length) out.push(lang === 'es' ? '_Sin brechas que priorizar._' : '_No gaps to prioritize._', '');
out.push('---', '', `## 7. ${W.verdict} <!-- SECTION: Summary Verdict -->`, '', W.verdictText(stats), '', '---', '');
out.push(`## 8. ${W.gaps} <!-- SECTION: Documentation Gaps -->`, '', ...(gaps.length ? gaps.map((g) => g.raw ? `- [ ] ${g.raw}` : `- [ ] \`[NOT DOCUMENTED]\` ${g.subject} — ${g.missing} (${g.where})`) : [lang === 'es' ? '_Sin brechas de documentación._' : '_No documentation gaps._']), '', '---', '', `**${W.citations}**: ${citations.concat(['ARCHITECTURE.md']).map((c) => `\`${c}\``).join(', ')}`, '');
const outPath = path.resolve(opt('--out') || path.join(aDir, `SECURITY-POSTURE-${today}.md`));
fs.mkdirSync(path.dirname(outPath), { recursive: true }); fs.writeFileSync(outPath, out.join('\n'));
const archived = F.archiveOlder(outPath);   // one checklist in analysis/ (8.117.0): the earlier ones to analysis/archive/
const relOut = path.relative(process.cwd(), outPath).replace(/\\/g, '/');
if (jsonOut) console.log(JSON.stringify({ file: relOut, language: lang, stats, stride: strideChecks.length, data: dataChecks.length, gaps: gaps.length, missing, archived, binding: { engine: bindEngine, undecided: bindUndecided.map((g) => g.id), pending: bindPending, note: bindNote } }, null, 2));
else console.log(`✓ ${relOut}: ${stats.total} checks — ${stats.documented} documented · ${stats.gap} gaps (${stats.high} high/critical) · ${stats.unassessed} not assessed${missing.length ? ` · missing source: ${missing.join(', ')}` : ''}`);
if (archived.length && !jsonOut) console.log(`  archived (one checklist): ${archived.join(', ')}`);
if (bindNote) console.error(`  gap rows → stores: ${bindNote}`);
if (bindUndecided.length) console.error(`  gap rows → stores: ${bindUndecided.length} undecided, bound to no store (${bindUndecided.map((g) => g.id).join(', ')})${bindPending ? ` — the judge's worksheet is at ${bindPending}; answer it and re-run` : ''}`);
if (bindReview.length) console.error(`  gap rows → stores (${bindEngine}) — to confirm (${bindReview.length}):\n${bindReview.map((w) => '    - ' + w).join('\n')}`);
