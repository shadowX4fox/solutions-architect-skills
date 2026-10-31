// The findings contract of the analysis reports (scripts/shared/: the analysis skill writes the reports, the command
// center reads them) — the one parser of what `analysis/*.md` and
// `analysis/*.html` say, shared by the report check (`check-report.js`, run by the analysis skill
// after every write) and by the command center's dossier (`architecture-command-center/scripts/
// dossier.js`, which bakes the findings into the scene for Alia). One module so the producer and
// the consumer cannot disagree: what the check accepts is exactly what the dossier reads.
//
// The contract (architecture-analysis SKILL.md § Finding IDs):
//   • A findings table is a Markdown pipe table whose first header is `#` (`ID` for the STRIDE
//     boundary inventory) followed by a separator row. Every other table is prose data.
//   • Each row's first cell opens with the finding id — 1–3 capitals, an optional tier digit, an
//     optional hyphen, 1–3 digits, and for STRIDE threats a hyphenated category letter (`C1`,
//     `B1-01`, `K2-01`, `T1-S`, `TB-01`, `OB-01`). A marker that applies to the row (`⚡ SPOF+Blast`)
//     follows the id in the same cell, never precedes it. Rows numbered `1`, `2`, `3` are an
//     inventory, not findings, and are skipped.
//   • The finding's label is the cell of the first column that names its subject — Component,
//     Technology, Data Store, Threat, Trust Boundary, Cycle Path, Title (English or Spanish). A
//     Tier, Severity, Risk, Gap, Hop, Flow, Category or Status column never labels a finding.
//   • Severity comes from an explicit Severity / Risk column, else a Tier column, else the id's
//     prefix through PREFIX_SEVERITY (the registry the SKILL.md table prints), else the section title.
//   • A finding that appears in a second table keeps its id: later rows add the columns the first
//     row did not carry, and never rename it.
//   • Column headers are English under every DOC_LANGUAGE; only cells localize.
//   • An HTML report embeds one `const data = { … };` literal; every array of objects carrying an
//     id and a label (or name / component / technology) is a findings list.
'use strict';

// ---- Text helpers: plain text without links, emphasis or code; names compared without accents or case
const plain = (s) => String(s || '')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  .replace(/`([^`]*)`/g, '$1')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => plain(c));
const isSeparator = (line) => /^\s*\|[\s:|-]+\|\s*$/.test(line || '');

// ---- The grammar
const FINDING_ID = /^[A-Z]{1,3}\d?-?\d{1,3}(?:-[A-Z]{1,2})?$/;
const INVENTORY_ROW = /^\d{1,3}$/;
const ID_HEADER = /^(#|id|ref|finding|hallazgo)$/i;
const NAME_COL = /^(component|componente|contenedor|container|technolog|tecnolog|data store|almacen|store|threat|amenaza|trust boundary|frontera|cycle path|ruta del ciclo|element|elemento|name|nombre|title|titulo)/;
const TIER_COL = /^(tier|nivel|tramo|severity|sev|severidad|risk|riesgo|gap|brecha|hop|salto|flow|flujo|category|categor|status|estado)\b/;
const SEVERITY_COL = /^(severity|sev|severidad|risk|riesgo|risk level|nivel de riesgo)$/;
const TIER_HEADER = /^(tier|nivel|tramo)$/;
// Header words a localized report uses instead of the spec's English spelling (LANGUAGE_POLICY §4);
// whole words, compared without accents, so `Category` and `Version` are not mistaken for Spanish
const LOCALIZED_HEADER = /^(componente|escenario|impacto|mitigacion|fuente|riesgo|severidad|nivel|consumidores|tipo|descripcion|recomendacion|amenaza|categoria|estado|proveedor|tecnologia|flujo|ruta)\b/;
const NAME_COL_LIST = 'Component, Technology, Data Store, Threat, Trust Boundary, Cycle Path, Title';

// ---- The registries. Finding-id prefix → severity per lens (the report filename's slug), the
// Tier column's values → severity, and the words a Severity / Risk cell may carry.
const PREFIX_SEVERITY = {
  'SPOF': { C: 'critical', D: 'medium', O: 'low' },
  'BLAST-RADIUS': { B: 'high' },
  'BOTTLENECK': { B1: 'critical', B2: 'high', B3: 'medium', B4: 'medium' },
  'COUPLING': { K1: 'high', K2: 'medium', K3: 'high', K4: 'high' },
  'COST-HOTSPOTS': { P: 'medium', O: 'low', Q: 'info' },
  'STRIDE': { TB: 'info' },
  'VENDOR-LOCKIN': { L1: 'high', L2: 'medium' },
  'TECH-DEBT': { T1: 'critical', T2: 'high', T3: 'medium', T4: 'info', T5: 'low', DEP: 'medium' },
  'DATA-SENSITIVITY': { G1: 'critical', G2: 'critical', G3: 'high', G4: 'high', G5: 'medium' },
};
const TIER_SEVERITY = { S1: 'critical', S2: 'high', S3: 'medium', S4: 'low', ISOLATED: 'low', B1: 'critical', B2: 'high', B3: 'medium', B4: 'medium', T1: 'critical', T2: 'high', T3: 'medium', T4: 'info', T5: 'low', L1: 'high', L2: 'medium', L3: 'info', K1: 'high', K2: 'medium', K3: 'high', K4: 'high', G1: 'critical', G2: 'critical', G3: 'high', G4: 'high', G5: 'medium' };
// The id scheme of each lens (SKILL.md § Finding IDs) with the forms it prints; an id outside the
// lens's scheme is a defect — a Bottleneck report numbering `B1`, `B2` is a Blast Radius scheme
const LENS_ID = {
  'SPOF': { re: /^[CDO]\d{1,3}$/, forms: 'C1, D1, O1' },
  'BLAST-RADIUS': { re: /^B\d{1,3}$/, forms: 'B1, B2' },
  'BOTTLENECK': { re: /^B[1-4]-\d{2,3}$/, forms: 'B1-01, B2-01, B3-01, B4-01' },
  'COST-HOTSPOTS': { re: /^[PQO]-\d{2,3}$/, forms: 'P-01, Q-01, O-01' },
  'STRIDE': { re: /^(TB-\d{2,3}|T\d{1,3}-[STRIDE])$/, forms: 'TB-01, T1-S, T2-R' },
  'VENDOR-LOCKIN': { re: /^L[1-3]-\d{2,3}$/, forms: 'L1-01, L2-01' },
  'LATENCY-BUDGET': { re: /^(OB|TL)-\d{2,3}$/, forms: 'OB-01, TL-01' },
  'TECH-DEBT': { re: /^(T[1-5]|DEP|AD)-\d{2,3}$/, forms: 'T1-01 … T5-01, DEP-01, AD-01' },
  'COUPLING': { re: /^K[1-4]-\d{2,3}$/, forms: 'K1-01, K2-01, K3-01, K4-01' },
  'DATA-SENSITIVITY': { re: /^G[1-5]-\d{2,3}$/, forms: 'G1-01 … G5-01' },
};
const LENSES = Object.keys(LENS_ID);
const SEV = (txt) => { const t = norm(txt); return /critical|critic|blocking|bloquea/.test(t) ? 'critical' : /high|alto|alta|severe|sever|chokepoint|cuello/.test(t) ? 'high' : /degradation|degradaci|medium|medio|media|moderate|convergence|convergen/.test(t) ? 'medium' : /operational|operacion|operativ|low|bajo|baja|isolated|aislad|minor|menor/.test(t) ? 'low' : /info|pass|ok|current|vigente/.test(t) ? 'info' : null; };
const idPrefix = (id) => { const m = String(id).match(/^([A-Z]{1,3})(\d?)/); return m ? m[1] + m[2] : ''; };
const prefixSeverity = (lens, id) => { const reg = PREFIX_SEVERITY[String(lens || '').toUpperCase()] || {}; const m = String(id).match(/^([A-Z]{1,3})(\d?)/); return m ? reg[m[1] + m[2]] || reg[m[1]] || null : null; };
const fieldNamed = (fields, re) => { const k = Object.keys(fields).find(h => re.test(norm(h))); return k ? fields[k] : null; };
const columnSeverity = (fields) => { const v = fieldNamed(fields, SEVERITY_COL); return v ? SEV(v) : null; };
const tierSeverity = (fields) => { const v = fieldNamed(fields, TIER_HEADER); if (!v) return null; const t = plain(v).split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, ''); return TIER_SEVERITY[t] || SEV(v); };

// The label column: the first naming column; `column` is null when the row fell back
const labelOf = (headers, r, id) => {
  const pick = (test) => { const k = headers.findIndex((h, i) => i > 0 && test(norm(h))); return k > 0 && r[k] ? { label: r[k], column: headers[k] } : null; };
  return pick(h => NAME_COL.test(h)) || Object.assign(pick(h => !TIER_COL.test(h)) || { label: r[1] || id }, { column: null });
};

// The report's lens and date from its filename: BOTTLENECK-2026-09-06.md → BOTTLENECK, 2026-09-06
const lensOf = (file) => String(file).replace(/^.*[\\/]/, '').replace(/-\d{4}-\d{2}-\d{2}.*$/, '').replace(/\.(md|html)$/i, '').toUpperCase();
const dateOf = (file) => (String(file).replace(/^.*[\\/]/, '').match(/\d{4}-\d{2}-\d{2}/) || [null])[0];

// One finding per id: a second table adds the columns the first did not carry and never renames
const collect = (items, entry) => {
  const sev = columnSeverity(entry.fields) || tierSeverity(entry.fields) || prefixSeverity(entry.lens, entry.id) || SEV(entry.sevHint || '')
    || (entry.extra && entry.extra.impact === 3 ? 'critical' : entry.extra && entry.extra.impact === 2 ? 'medium' : entry.extra && entry.extra.impact === 1 ? 'low' : null);
  const source = columnSeverity(entry.fields) ? 'column' : tierSeverity(entry.fields) ? 'tier' : prefixSeverity(entry.lens, entry.id) ? 'prefix' : sev ? 'section' : null;
  const prev = items.find(x => x.id === entry.id);
  if (prev) {
    Object.entries(entry.fields).forEach(([k, v]) => { if (!(k in prev.fields)) prev.fields[k] = v; });
    if (!prev.severity && sev) { prev.severity = sev; prev.severitySource = source; }
    // A later row may supply the subject the first row lacked (or replace a bare id reference such
    // as the `Trust Boundary` cell of the STRIDE High-Priority table); a different subject is a warning
    const isRef = (t) => FINDING_ID.test(String(t || '').split(/\s+/)[0].toUpperCase());
    if (entry.label && entry.labelColumn && (!prev.labelColumn || (isRef(prev.label) && !isRef(entry.label)))) { prev.label = entry.label; prev.labelColumn = entry.labelColumn; }
    else if (entry.label && entry.labelColumn && !isRef(entry.label) && norm(entry.label) !== norm(prev.label)) prev.otherLabels = (prev.otherLabels || []).concat(entry.label);
    prev.rows.push(entry.line);
    return prev;
  }
  const e = { id: entry.id, label: entry.label, fields: entry.fields, labelColumn: entry.labelColumn, severitySource: source, rows: [entry.line] };
  if (sev) e.severity = sev;
  if (entry.sevHint) e.tier = plain(entry.sevHint);
  items.push(e);
  return e;
};

// ---- Markdown: every `#` / `ID` table, its rows classified, the findings merged by id
function extractMarkdown(src, lens) {
  const lines = String(src).split('\n'), items = [], tables = [];
  let section = '';
  lines.forEach((l, i) => {
    const h = l.match(/^#{2,4}\s+(.+)$/); if (h) { section = plain(h[1]); return; }
    if (!/^\s*\|/.test(l) || !isSeparator(lines[i + 1])) return;
    const headers = cells(l);
    if (!ID_HEADER.test(headers[0] || '')) return;
    const table = { section, line: i + 1, headers, findings: 0, inventory: 0, unrecognized: [], localizedHeaders: headers.filter(hd => LOCALIZED_HEADER.test(norm(hd))), namingColumn: headers.find((hd, k) => k > 0 && NAME_COL.test(norm(hd))) || null };
    let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j])) {
      const r = cells(lines[j]), line = j + 1; j++;
      const tokens = (r[0] || '').split(/\s+/).filter(Boolean), id = (tokens[0] || '').toUpperCase();
      if (INVENTORY_ROW.test(id)) { table.inventory++; continue; }
      if (!id || /^[-—–]+$/.test(id)) continue;   // a pass row (the STRIDE matrix prints `—` where no threat was found)
      if (!FINDING_ID.test(id)) { table.unrecognized.push({ line, cell: r[0] || '' }); continue; }
      const fields = {}; if (tokens.length > 1) fields[headers[0]] = tokens.slice(1).join(' ');
      headers.forEach((hd, k) => { if (k > 0 && r[k]) fields[hd] = r[k]; });
      const lab = labelOf(headers, r, id);
      table.findings++;
      collect(items, { lens, id, label: lab.label, labelColumn: lab.column, fields, sevHint: section, line });
    }
    tables.push(table);
  });
  enrich(items, lens);
  return { items, tables };
}

// ---- HTML: the `const data = { … };` literal, every array of labelled objects a findings list
function extractHtml(src, lens) {
  const items = [];
  const m = String(src).match(/const data = (\{[\s\S]*?\n\};)/);
  if (!m) return { items, data: null, error: 'no `const data = { … };` literal' };
  let data = null;
  try { data = new Function('return ' + m[1].slice(0, -1))(); } catch (e) { return { items, data: null, error: `the data literal does not parse (${e.message})` }; }
  let lists = 0, unkeyed = 0;
  const nameOf = (x) => x.label || x.name || x.component || x.technology;
  const walk = (obj, key) => {
    if (Array.isArray(obj)) {
      const labelled = obj.filter(x => x && typeof x === 'object' && nameOf(x));
      if (labelled.length) lists++;
      labelled.forEach((x, k) => {
        const fields = {};
        Object.entries(x).forEach(([kk, v]) => { if (!['id', 'label', 'name'].includes(kk) && (typeof v === 'string' || typeof v === 'number')) fields[kk] = String(v); else if (Array.isArray(v) && v.every(t => typeof t === 'string') && v.length) fields[kk] = v.join(', '); });
        if (x.id == null) unkeyed++;
        const e = collect(items, { lens, id: x.id != null ? String(x.id).toUpperCase() : String(key).toUpperCase().slice(0, 3) + '-' + (k + 1), label: plain(nameOf(x)), labelColumn: 'label', fields, sevHint: x.tier || x.severity || key, extra: x, line: null });
        if (x.id == null) e.synthetic = true;   // numbered from the array's name — not held to the lens scheme
      });
    } else if (obj && typeof obj === 'object') Object.entries(obj).forEach(([k, v]) => walk(v, k));
  };
  walk(data, lens);
  enrich(items, lens);
  return { items, data, lists, unkeyed, error: null };
}

// ---- The check: what a report must satisfy before the skill accepts it
function checkReport(file, src) {
  const errors = [], warnings = [], lens = lensOf(file), date = dateOf(file), html = /\.html$/i.test(file);
  const base = String(file).replace(/^.*[\\/]/, '');
  if (/^SECURITY[-_]POSTURE/i.test(base)) return { file, lens, skipped: 'consolidation checklist — no findings tables by design', errors, warnings, items: [] };
  if (!LENSES.includes(lens)) errors.push({ message: `filename \`${base}\` does not open with a lens slug (${LENSES.join(', ')})` });
  if (!date) errors.push({ message: `filename \`${base}\` carries no YYYY-MM-DD date` });
  const scheme = LENS_ID[lens];
  let items = [];
  if (html) {
    const r = extractHtml(src, lens); items = r.items;
    if (r.error) errors.push({ message: `HTML report: ${r.error}` });
    else if (!r.lists) errors.push({ message: 'HTML report: the data literal holds no array of labelled objects (id + label / name / component / technology), so no finding can be read from it' });
    if (r.unkeyed) warnings.push({ message: `HTML report: ${r.unkeyed} labelled object(s) carry no id — the dossier will number them from their array's name` });
  } else {
    const r = extractMarkdown(src, lens); items = r.items;
    const findingTables = r.tables.filter(t => t.findings);
    if (!r.tables.length) errors.push({ message: 'no table opens with a `#` (or `ID`) column — the report has no findings table' });
    else if (!findingTables.length) errors.push({ message: 'every `#` table is an inventory (rows numbered 1, 2, 3 …) — no row opens with a finding id' });
    r.tables.forEach(t => {
      t.localizedHeaders.forEach(hd => errors.push({ line: t.line, message: `header \`${hd}\` is localized — headers are spelled as the spec spells them (English) under every DOC_LANGUAGE; only cells localize` }));
      t.unrecognized.forEach(u => errors.push({ line: u.line, message: `first cell \`${u.cell}\` is neither a finding id nor a row number — the id is the first token of the cell, a marker (⚡) follows it` }));
    });
  }
  items.forEach(it => {
    const line = it.rows[0];
    if (scheme && !it.synthetic && !scheme.re.test(it.id)) errors.push({ line, message: `${it.id}: not an id in the ${lens} scheme (${scheme.forms})` });
    if (!it.severity || it.severitySource === 'section') errors.push({ line, message: `${it.id}: no severity — no Severity / Risk column, no Tier column, and prefix \`${idPrefix(it.id)}\` is not in the ${lens} registry` });
    if (!html && !it.labelColumn) errors.push({ line, message: `${it.id}: labelled \`${it.label}\` by fallback — no naming column (${NAME_COL_LIST}) in any table that lists it` });
    if (!it.label) warnings.push({ line, message: `${it.id}: empty label cell` });
    if (it.otherLabels) warnings.push({ line, message: `${it.id}: named \`${it.label}\` in one table and \`${it.otherLabels.join('`, `')}\` in another — one finding, one subject` });
  });
  return { file, lens, date, errors, warnings, items };
}

// ---- Mitigation, residual severity and the "what" (8.63.0). Per lens, the column that states what is in place against the
// finding — read as none / present, never judged further: the text is shown and the reader judges — and the column that says what
// the finding is about beyond its subject (the subject is the block's own name on the stage, so it says nothing there). A present
// mitigation lowers the severity one step for ranking (critical → high → medium → low; info stays): the report's word is untouched.
const MITIGATION_COL = {
  'SPOF': /^current mitigation$/, 'BLAST-RADIUS': /^bulkhead present$/, 'BOTTLENECK': /^backpressure mechanism$/,
  'STRIDE': /^status$/, 'TECH-DEBT': /^replacement implemented/, 'VENDOR-LOCKIN': /^exit path$/,
};
const MITIGATION_ANY = /^(current )?mitigation$/;
const NONE_CELL = /^(none|no\b|n a\b|na\b|not documented|not declared|nothing|ninguna|ninguno|nada|sin\b|no aplica|pending|pendiente|finding|hallazgo|open|abierto|missing|falta|todo)/;
const WHAT_COL = {
  'SPOF': /^failure scenario$/, 'BLAST-RADIUS': /^cascade risk$/, 'BOTTLENECK': /^(bottleneck reason|scale blocker|backpressure mechanism)$/,
  'COUPLING': /^(risk narrative|classification|coupling type)$/, 'COST-HOTSPOTS': /^(category|recommended action|estimated monthly waste)$/,
  'STRIDE': /^(threat description|control gap)$/, 'VENDOR-LOCKIN': /^(proprietary surface|vendor extension|blocking factor)$/,
  'TECH-DEBT': /^replacement$/, 'DATA-SENSITIVITY': /^(missing control|overage|authorizing decision)$/,
  'LATENCY-BUDGET': /^flow$/,
};
const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const mitigationOf = (lens, fields) => { const re = MITIGATION_COL[String(lens || '').toUpperCase()] || MITIGATION_ANY; const k = Object.keys(fields || {}).find(h => re.test(norm(h))); if (!k) return null; const text = plain(fields[k]), n = norm(text); return { column: k, text, state: !n || NONE_CELL.test(n) ? 'none' : 'present' }; };
const residualSeverity = (sev, m) => { if (!sev || !m || m.state !== 'present' || sev === 'info') return sev || null; const i = SEV_ORDER.indexOf(sev); return i < 0 ? sev : SEV_ORDER[Math.min(i + 1, 3)]; };
const whatOf = (lens, fields) => { const re = WHAT_COL[String(lens || '').toUpperCase()]; if (!re) return null; const k = Object.keys(fields || {}).find(h => re.test(norm(h))); return k ? plain(fields[k]) : null; };
// the finishing pass of both extractors: every item carries what it is about, its mitigation and its residual severity
const enrich = (items, lens) => { items.forEach(it => { const m = mitigationOf(lens, it.fields); if (m) it.mitigation = m; const w = whatOf(lens, it.fields); if (w) it.what = w; const r = residualSeverity(it.severity, m); if (r) it.residual = r; }); return items; };

// Whether a mitigation cell describes a control that is in place TODAY is a judgement, not a start-anchored none-lexicon:
// "planned for Q3", "partial — TLS only on the public edge" and "Sí — pending rollout" all read as `present` to NONE_CELL,
// and a present mitigation lowers the residual severity the command center ranks by. `enrich` stays synchronous — it is
// the contract every gate runs — and this pass re-judges the state afterwards, through scripts/judge.js, for the
// consumers that rank by residual (the dossier). The column's parse is the contract and the judge only re-reads it: a cell
// the judge has not answered keeps the contract's reading, is "not re-read (undecided)", and is listed in `undecided` with
// the worksheet (`pending`) so the caller reports it. entries: [{ it, lens }] — every item with mitigation text is asked once.
// What "mitigation present" means is the column's, per lens (the 8.63.0 contract): a bulkhead for Blast Radius, a
// backpressure mechanism for Bottleneck, a documented exit path for Vendor Lock-in, an implemented replacement for Tech
// Debt, a status for STRIDE. A first cut asked for "a control operating today" and flipped every vendor exit path and
// every bare "Partial" to none — the model answered the question as written; the question was wrong.
const MITIGATION_PRESENT = {
  id: 'mitigation-present', type: 'noul', hi: 0.6,
  question: 'Does `item.cell` — the `item.column` cell of the finding `item.finding` (lens `item.lens`) — state that the mitigation that column asks for exists now, in whole or in part?',
  criteria: {
    true: 'The mitigation exists now, wholly or partly ("Partial" / "Parcial" alone counts): an implemented mechanism, a running process, a configured limit, a deployed safeguard, a fallback that takes over; for a Vendor Lock-in "Exit path" cell, a named alternative and what migrating to it takes; for a Tech Debt "Replacement implemented" cell, a replacement that is in place; for a STRIDE "Status" cell, mitigated or accepted; for a Blast Radius "Bulkhead present" cell, a bulkhead, a fallback or an isolation that exists.',
    false: 'Nothing exists now: the cell says none, N/A, not documented, nothing, open, pending; or it reads "Finding" / "Hallazgo" (with or without ⚠️), which marks an open finding, not a mitigation; or the mitigation is planned, proposed, recommended, under evaluation, or "to be" implemented; or the cell only describes the failure\'s effect, a risk or a limitation, and names no mechanism, fallback, exit path or replacement.',
  },
};
async function judgeMitigations(entries, opts = {}) {
  const JUDGE = require(require('path').join(__dirname, '..', 'judge.js'));
  const ask = entries.filter(({ it }) => it.mitigation && it.mitigation.text);
  const out = { engine: opts.engine || JUDGE.engineInForce(), asked: ask.length, flipped: [], undecided: [], pending: null, note: null };
  const notReread = (it) => `${it.id}: reads ${it.mitigation.state}, not re-read (undecided) — "${it.mitigation.text.slice(0, 80)}"`;
  if (!ask.length) return out;
  const items = ask.map(({ it, lens }, i) => ({ id: `m${i}`, state: { cell: it.mitigation.text, column: it.mitigation.column, finding: `${it.id} ${it.label || ''}`.trim(), lens: lens || '', what: it.what || undefined } }));
  let res;
  try { res = await JUDGE.judge(MITIGATION_PRESENT, items, { engine: opts.engine, root: opts.root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache, answers: opts.answers }); }
  catch (e) { if (e.name !== 'JudgeError') throw e; out.note = e.message; out.undecided = ask.map(({ it }) => notReread(it)); return out; }
  if (res.pending) { out.pending = res.pending; out.note = `agent worksheet at ${res.pending}`; out.undecided = ask.map(({ it }) => notReread(it)); return out; }
  out.engine = res.engine; out.unsure = [];
  // a state changes only on a confident answer either way (≥ 0.75 present, ≤ 0.25 none); in between the contract's reading
  // stays and the cell is reported — on the reference three cells sat within 0.03 of the cut, one on each side of it
  ask.forEach(({ it }, i) => { const a = res.answers[`m${i}`]; if (!a) { out.undecided.push(notReread(it)); return; }
    const state = a.p >= 0.75 ? 'present' : a.p <= 0.25 ? 'none' : it.mitigation.state;
    if (state === it.mitigation.state && a.p > 0.25 && a.p < 0.75 && (a.p >= 0.5) !== (it.mitigation.state === 'present')) out.unsure.push(`${it.id}: reads ${it.mitigation.state}, judged ${a.p.toFixed(2)} (${a.by}) — "${it.mitigation.text.slice(0, 80)}"`);
    if (state !== it.mitigation.state) out.flipped.push(`${it.id}: ${it.mitigation.state} → ${state} (${a.by} ${a.p.toFixed(2)}) — "${it.mitigation.text.slice(0, 80)}"`);
    it.mitigation.state = state; it.mitigation.by = a.by; it.mitigation.p = +a.p.toFixed(2);
    const r = residualSeverity(it.severity, it.mitigation); if (r) it.residual = r; else delete it.residual; });
  return out;
}

// One report per lens in analysis/ (8.117.0): the newest is the architecture's reading of that lens, every earlier one is
// history and moves to analysis/archive/ — the dossier, the payloads and the dashboards read "the newest", and a folder
// holding three Blast Radius reports kept two stale ones beside it. Moves every report of `file`'s lens in its directory
// dated on or before it (another format of the same day too), never one dated after it; a name already archived gets a
// numbered suffix. Returns the paths moved, relative to the directory.
function archiveOlder(file) {
  const fs = require('fs'), path = require('path');
  const dir = path.dirname(path.resolve(file)), name = path.basename(file), lens = lensOf(name), date = dateOf(name);
  if (!lens || !date) return [];
  const moved = [];
  for (const n of fs.readdirSync(dir)) {
    if (n === name || !/\.(md|html)$/i.test(n) || lensOf(n) !== lens) continue;
    const d = dateOf(n); if (!d || d > date) continue;
    const archive = path.join(dir, 'archive'); fs.mkdirSync(archive, { recursive: true });
    let to = path.join(archive, n);
    for (let k = 1; fs.existsSync(to); k++) to = path.join(archive, n.replace(/(\.[a-z]+)$/i, `-${k}$1`));
    fs.renameSync(path.join(dir, n), to); moved.push(path.relative(dir, to).replace(/\\/g, '/'));
  }
  return moved;
}

module.exports = { archiveOlder, MITIGATION_COL, WHAT_COL, NONE_CELL, MITIGATION_PRESENT, mitigationOf, residualSeverity, whatOf, enrich, judgeMitigations, plain, norm, cells, FINDING_ID, INVENTORY_ROW, ID_HEADER, NAME_COL, TIER_COL, SEVERITY_COL, TIER_HEADER, LOCALIZED_HEADER, PREFIX_SEVERITY, TIER_SEVERITY, LENS_ID, LENSES, SEV, idPrefix, prefixSeverity, columnSeverity, tierSeverity, labelOf, lensOf, dateOf, collect, extractMarkdown, extractHtml, checkReport };

// CLI (8.116.0): the findings of the newest report of each lens, counted by severity and by residual severity — what a
// dashboard (sa-alia's risk radar) reads instead of parsing reports itself, so the contract stays this file's alone.
//   bun scripts/shared/findings.js <analysis-dir> [--json]
//   bun scripts/shared/findings.js <analysis-dir> --archive   — every earlier report of each lens to archive/ (8.117.0)
// One row per lens: { lens, date, file, total, severity: { critical, high, medium, low }, residual: { … } }; a report
// this parser cannot read is listed with its error count and no figures. Exit 0; 2 on a usage error.
if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const args = process.argv.slice(2), dir = args.find((a) => !a.startsWith('--'));
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) { console.error('Usage: bun findings.js <analysis-dir> [--json]'); process.exit(2); }
  if (args.includes('--archive')) {   // one report per lens: every earlier report of each lens to archive/
    const moved = [];
    const keep = new Map();
    fs.readdirSync(dir).filter((n) => /\.(md|html)$/i.test(n) && dateOf(n)).forEach((n) => { const l = lensOf(n); if (!keep.has(l) || dateOf(n) > dateOf(keep.get(l))) keep.set(l, n); });
    keep.forEach((n) => archiveOlder(path.join(dir, n)).forEach((m) => moved.push(m)));
    console.log(moved.length ? `archived ${moved.length}: ${moved.join(', ')}` : 'nothing to archive — one report per lens');
    process.exit(0);
  }
  const newest = new Map();
  fs.readdirSync(dir).filter((n) => /\.(md|html)$/i.test(n) && dateOf(n) && LENSES.includes(lensOf(n))).forEach((n) => { const l = lensOf(n); if (!newest.has(l) || dateOf(n) > dateOf(newest.get(l))) newest.set(l, n); });
  const count = (items, key) => items.reduce((o, it) => { const s = it[key]; if (s) o[s] = (o[s] || 0) + 1; return o; }, {});
  const rows = [...newest.values()].sort().map((n) => { const file = path.join(dir, n); const r = checkReport(file, fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n'));
    const items = enrich(r.items || [], r.lens);
    return { lens: r.lens, date: r.date, file: n, total: items.length, severity: count(items, 'severity'), residual: count(items, 'residual'), errors: (r.errors || []).length }; });
  if (args.includes('--json')) console.log(JSON.stringify(rows, null, 1));
  else rows.forEach((x) => console.log(`${x.lens.padEnd(16)} ${x.date}  ${String(x.total).padStart(3)} finding(s)  ${['critical', 'high', 'medium', 'low'].map((s) => `${s} ${x.severity[s] || 0}`).join(' · ')}${x.errors ? `  (${x.errors} contract error(s))` : ''}`));
}
