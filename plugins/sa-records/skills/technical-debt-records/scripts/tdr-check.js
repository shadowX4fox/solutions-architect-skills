#!/usr/bin/env node
// tdr-check.js — the TDR status contract (SKILL.md § Status vocabulary) as code.
//
//   bun tdr-check.js <project-root> [--json]                       every record in tdr/ and the index
//   bun tdr-check.js <project-root> --move TDR-NNN "<status>"      is this transition one of the arrows?
//   bun tdr-check.js <project-root> --pending [--json]             the TDRs the documents cite that have no record (8.92.7)
//
// What is checked, per record: the status is one of the five and only one, identical under `## Status` and in
// the `status:` frontmatter key (a retired board tag or a Jira spelling is named with its destination);
// `Planned` carries `target-date:`; `In Progress` names its technical owner; `Resolved` links what resolved it
// in a History note; `Won't Fix` records the decision in a History note; the Driver is one of the four families
// and matches `driver:`; the Initiative line exists; the sections come in the template's order. Then the index:
// every record has a row, every row's status is the record's.
//
// Structure is English in every doc_language (LANGUAGE_POLICY.md §4): a localized heading, label, Capability
// table header or level name (`## Estado`, `**Iniciativa**`, `**Técnico**`, `| Nivel |`), or an anchor comment on a
// heading, is read — every other rule still runs on it — and reported `structure-localized` with its English form
// (`scripts/shared/record-structure.js`, the vocabulary `prose-check.js` holds ADRs to). WARNING, BLOCKING once
// ARCHITECTURE.md carries `<!-- PROSE_STYLE: v1 -->`.
//
// Size (8.68.0): each section against its budget and each History note to one line — the same budgets
// `docs-stats.js` reports, from the one implementation in `scripts/shared/record-budgets.js`. WARNING, BLOCKING once ARCHITECTURE.md carries
// `<!-- PROSE_STYLE: v1 -->`: a stamped project states each compromise as it stands, and its history one line a note.
//
// `--move` prints the arrow the move takes, or the one it must take. Exit 1 on a blocking finding or a refused
// move; warnings never block. What code cannot judge — whether Description and Impact justify a `Won't Fix` —
// is not judged here.
'use strict';
const fs = require('fs');
const path = require('path');
const { recordFindings } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'record-budgets.js'));
const { structureFindings, labelsFor } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'record-structure.js'));

const STATUSES = ['Open', 'Planned', 'In Progress', 'Resolved', "Won't Fix"];
const JIRA = { Open: 'ACEPTADA', Planned: 'PROYECTADA', 'In Progress': 'EN CURSO', Resolved: 'PAGADA', "Won't Fix": 'BANCA ROTA' };
const RETIRED = { 'Deuda Pendiente': 'Open', TRANSITORIA: 'Open', 'Ya esta, en local': 'In Progress', 'Ya está, en local': 'In Progress', REALIZADA: 'Resolved', Terminado: 'Resolved', DEPRECADO: 'Resolved' };
const MOVES = { Planned: ['In Progress', 'Open'], Open: ['In Progress', "Won't Fix"], 'In Progress': ['Resolved'], Resolved: [], "Won't Fix": [] };
const DRIVERS = ['Strategy', 'Architecture', 'Talent', 'Process'];
const ORDER = [
  ['Status', /^##\s+(Status|Estado)\b/i],
  ['Description', /^##\s+(Description|Descripción)\b/i],
  ['Impact', /^##\s+(Impact|Impacto)\b/i],
  ['Possible Solutions', /^##\s+(Possible Solutions|Posibles Soluciones|Soluciones Posibles)\b/i],
  ['Capability', /^##\s+(Capability|Capacidad)\b/i],
  ['Owner', /^##\s+(Owner|Responsable|Propietario)\b/i],
  ['History', /^##\s+(History|Historial)\b/i],
];
const OPTIONAL = new Set(['Capability', 'History']);

const norm = (s) => String(s || '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const lower = (s) => norm(s).toLowerCase();
const canon = (s) => STATUSES.find((x) => lower(x) === lower(s)) || null;
const fromJira = (s) => Object.keys(JIRA).find((k) => lower(JIRA[k]) === lower(s)) || null;
const fromRetired = (s) => { const k = Object.keys(RETIRED).find((x) => lower(x) === lower(s)); return k ? { tag: k, to: RETIRED[k] } : null; };

const frontmatter = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---/); if (!m) return { keys: {}, end: 0 };
  const keys = {};
  m[1].split('\n').forEach((l) => { const kv = l.match(/^([\w-]+):[ \t]*(.*)$/); if (!kv) return; let v = kv[2].trim(); const q = v.match(/^(["'])(.*?)\1/); v = q ? q[2] : v.replace(/\s+#.*$/, '').trim(); keys[kv[1]] = v; });
  return { keys, end: m[0].split('\n').length };
};
const sectionBody = (lines, re) => { const s = lines.findIndex((l) => re.test(l)); if (s < 0) return null; const out = []; for (let i = s + 1; i < lines.length; i++) { if (/^##\s/.test(lines[i])) break; out.push({ n: i + 1, t: lines[i] }); } return { line: s + 1, lines: out }; };
const field = (lines, labels) => { const re = new RegExp('^(?:[-*]\\s+)?\\*\\*(' + labels.join('|') + '):?\\*\\*\\s*:?\\s*(.+)$', 'i'); /* a bare line or a list item */ for (const l of lines) { const m = l.t.match(re); if (m) return { n: l.n, v: m[2].trim() }; } return null; };
const LINK = /https?:\/\/|\bADR-\d{3}\b|\bPR\s*#?\d+|#\d{2,}|\b[0-9a-f]{7,40}\b|\bcommit\b/i;

// ── one record ──
function checkRecord(file, src) {
  const findings = [];
  const F = (rule, line, msg, level = 'BLOCKING') => findings.push({ rule, level, file, line, message: msg });
  const lines = src.split('\n');
  const { keys } = frontmatter(src);
  const status = sectionBody(lines, ORDER[0][1]);
  if (!status) { F('status-section-missing', 1, 'no `## Status` section'); return { findings, status: null }; }

  // the body's word: the first backticked token, else the first non-empty line that is not a field
  const first = status.lines.find((l) => l.t.trim() && !/^\*\*/.test(l.t) && !/^<!--/.test(l.t));
  const bodyRaw = first ? ((first.t.match(/`([^`]+)`/) || [])[1] || first.t.trim().split(/\s+[—–-]\s+/)[0]) : '';
  const bodyLine = first ? first.n : status.line;
  const resolveWord = (raw, where, line) => {
    const c = canon(raw); if (c) return c;
    const r = fromRetired(raw); if (r) { F('status-retired-tag', line, `${where} carries the retired tag \`${r.tag}\` — migrate to \`${r.to}\` (\`${JIRA[r.to]}\`) with a dated History note naming the old tag`); return r.to; }
    const j = fromJira(raw); if (j) { F('status-jira-spelling', line, `${where} carries the Jira tag \`${raw}\` — the file carries \`${j}\`; the tag lives on the board`); return j; }
    F('status-invalid', line, `${where} is \`${raw || '(empty)'}\` — one of ${STATUSES.map((s) => '`' + s + '`').join(' · ')}`);
    return null;
  };
  const body = resolveWord(bodyRaw, '`## Status`', bodyLine);
  const fm = keys.status === undefined ? null : resolveWord(keys.status, '`status:`', 1);
  if (keys.status === undefined) F('status-key-missing', 1, 'no `status:` frontmatter key — required, the same word as `## Status`');
  else if (body && fm && body !== fm) F('status-mismatch', 1, `\`status: ${keys.status}\` but \`## Status\` says \`${bodyRaw}\` — they move together`);
  const st = body || fm;

  if (st === 'Planned' && !/^\d{4}-\d{2}-\d{2}$/.test(keys['target-date'] || '')) F('planned-target-date', 1, '`Planned` needs `target-date: YYYY-MM-DD` in the frontmatter');
  const owner = sectionBody(lines, ORDER[5][1]);
  const tech = owner ? field(owner.lines, ['Technical', 'Técnico', 'Tecnico']) : null;
  if (st === 'In Progress' && (!tech || !tech.v || /\b(tbd|por definir|pendiente)\b/i.test(tech.v) || /^<.*>$/.test(tech.v))) F('in-progress-owner', tech ? tech.n : (owner ? owner.line : 1), '`In Progress` needs a named technical owner on the `**Technical**` line');
  const history = sectionBody(lines, ORDER[6][1]);
  const notes = history ? history.lines.filter((l) => /^\s*[-*]\s+\d{4}-\d{2}-\d{2}/.test(l.t)) : [];
  const noteOn = (s) => notes.filter((l) => new RegExp('`' + s.replace(/'/g, "['’]") + '`|\\b' + JIRA[s] + '\\b', 'i').test(l.t));
  if (st === 'Resolved') { const n = noteOn('Resolved'); if (!n.length) F('resolved-history', history ? history.line : 1, '`Resolved` needs a dated History note naming the move'); else if (!n.some((l) => LINK.test(l.t))) F('resolved-link', n[n.length - 1].n, 'the `Resolved` note links nothing — the commit / PR / ADR that resolved it'); }
  if (st === "Won't Fix") { const n = noteOn("Won't Fix"); if (!n.length) F('wont-fix-decision', history ? history.line : 1, "`Won't Fix` needs a dated History note recording the investment decision — who took it and when"); }

  // driver + initiative
  const drv = field(status.lines, labelsFor('tdr', 'Driver'));
  const drvWord = drv ? drv.v.split(/\s+[—–-]\s+/)[0].trim() : null;
  if (!drv) F('driver-missing', status.line, 'no `**Driver**` line under `## Status`');
  else if (!DRIVERS.includes(drvWord)) F('driver-invalid', drv.n, `Driver \`${drvWord}\` — one of ${DRIVERS.join(' · ')}`);
  else if (keys.driver !== undefined && keys.driver !== drvWord) F('driver-mismatch', 1, `\`driver: ${keys.driver}\` but the Driver line says \`${drvWord}\``);
  if (!field(status.lines, labelsFor('tdr', 'Initiative'))) F('initiative-missing', status.line, 'no `**Initiative**` line under `## Status`');

  // section order
  const seen = ORDER.map(([name, re]) => ({ name, at: lines.findIndex((l) => re.test(l)) })).filter((s) => s.at >= 0 || !OPTIONAL.has(s.name));
  seen.filter((s) => s.at < 0).forEach((s) => F('section-missing', 1, `no \`## ${s.name}\` section`));
  const present = seen.filter((s) => s.at >= 0);
  for (let i = 1; i < present.length; i++) if (present[i].at < present[i - 1].at) { F('section-order', present[i].at + 1, `\`## ${present[i].name}\` comes before \`## ${present[i - 1].name}\` — the order is ${ORDER.map((o) => o[0]).join(' · ')}`); break; }
  if (keys['bian-capability'] && !present.some((s) => s.name === 'Capability')) F('capability-key-without-section', 1, '`bian-capability:` without a `## Capability` section', 'WARNING');

  // structure stays English, with no anchor comment (record-structure.js)
  structureFindings(src, 'tdr').forEach((x) => F('structure-localized', x.line, x.message, 'WARNING'));

  return { findings, status: st };
}

// ── the index ──
// ── the link back (10.8.0): a component's descriptor names the TDRs in force on it ──
// `**Technical Debt:** [TDR-001](…) · [TDR-004](…)` after `**Last Updated:**`; the record names the component in
// `affected-components`. Both directions are held here — WARNING, never blocking: a project adopts the line on its next edit.
const listOf = (v) => String(v || '').replace(/^\[|\]$/g, '').split(',').map((x) => x.trim().replace(/^(["'])(.*)\1$/, '$2').trim()).filter(Boolean);
const DEBT_LINE = /^\*\*(?:Technical Debt|Deuda Técnica|Deuda Tecnica):\*\*\s*(.*)$/im;
function descriptors(root) {
  const out = [], walk = (rel) => { let es; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; }
    es.forEach((e) => { const r = rel + '/' + e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.md') && e.name !== 'README.md') {
      const src = read(path.join(root, r)), h1 = (src.match(/^# (.+)$/m) || [])[1], m = src.match(DEBT_LINE);
      if (h1) out.push({ file: r, name: h1.replace(/<!--[\s\S]*?-->/g, '').trim(), ids: m ? [...new Set(m[1].toUpperCase().match(/\bTDR-\d{3,}\b/g) || [])] : [], line: m ? src.slice(0, src.indexOf(m[0])).split('\n').length : 1 }); } }); };
  walk('docs/components');
  return out;
}
function checkLinks(root, records) {
  const findings = [], ds = descriptors(root), byId = new Map(records.map((r) => [r.id, r]));
  const W = (rule, file, line, message) => findings.push({ rule, level: 'WARNING', file, line, message });
  records.filter((r) => r.status && r.status !== 'Resolved').forEach((r) => r.affected.forEach((name) => {
    const d = ds.find((x) => x.name === name);
    if (d && !d.ids.includes(r.id)) W('component-link-missing', d.file, d.line, `${r.id} names ${name} in affected-components; its descriptor does not name ${r.id} — \`**Technical Debt:** [${r.id}](…)\` after \`**Last Updated:**\``);
  }));
  ds.forEach((d) => d.ids.forEach((id) => {
    const r = byId.get(id);
    if (!r) W('component-link-unknown', d.file, d.line, `${id} has no record under tdr/`);
    else if (r.status === 'Resolved') W('component-link-resolved', d.file, d.line, `${id} is Resolved — drop it from the Technical Debt line`);
    else if (!r.affected.includes(d.name)) W('component-link-unmatched', d.file, d.line, `${id} does not name ${d.name} in affected-components`);
  }));
  return findings;
}

function checkIndex(root, records) {
  const findings = [];
  const p = path.join(root, 'tdr', 'README.md');
  if (!fs.existsSync(p)) { findings.push({ rule: 'index-missing', level: 'BLOCKING', file: 'tdr/README.md', line: 1, message: 'no `tdr/README.md` — seed it from the skill\'s `references/index-template.md`' }); return findings; }
  const lines = read(p).split('\n');
  const rows = {};
  // the id plain or linked, `[TDR-001](TDR-001-x.md)` (8.92.8)
  lines.forEach((l, i) => { const m = l.match(/^\|\s*\[?(TDR-\d+)\]?(?:\([^)]*\))?\s*\|(.*)$/i); if (!m) return; const cells = m[2].split('|').map((c) => c.trim()); rows[m[1].toUpperCase()] = { line: i + 1, status: cells[1] || '' }; });
  records.forEach((r) => {
    const row = rows[r.id];
    if (!row) { findings.push({ rule: 'index-row-missing', level: 'BLOCKING', file: 'tdr/README.md', line: 1, message: `${r.id} has no row in the index` }); return; }
    if (r.status && canon(row.status) !== r.status) findings.push({ rule: 'index-drift', level: 'BLOCKING', file: 'tdr/README.md', line: row.line, message: `${r.id} row says \`${row.status}\`, the record says \`${r.status}\`` });
  });
  Object.keys(rows).filter((id) => !records.some((r) => r.id === id) && !/example|replace or remove|ejemplo/i.test(lines[rows[id].line - 1])).forEach((id) => findings.push({ rule: 'index-row-orphan', level: 'WARNING', file: 'tdr/README.md', line: rows[id].line, message: `${id} is in the index but not in tdr/` }));
  return findings;
}

function check(root) {
  const dir = path.join(root, 'tdr');
  const records = [];
  let findings = [];
  if (!fs.existsSync(dir)) return { records, findings, blocking: 0, warnings: 0 };
  const arch = path.join(root, 'ARCHITECTURE.md');
  const stamped = fs.existsSync(arch) && /<!--\s*PROSE_STYLE:\s*v1\s*-->/.test(read(arch));
  fs.readdirSync(dir).filter((n) => /^TDR-\d+.*\.md$/i.test(n)).sort().forEach((n) => {
    const file = 'tdr/' + n;
    const r = checkRecord(file, read(path.join(dir, n)));
    const src = read(path.join(dir, n));
    records.push({ id: n.match(/^TDR-\d+/i)[0].toUpperCase(), file, status: r.status, affected: listOf(frontmatter(src).keys['affected-components']) });
    findings = findings.concat(r.findings.map((f) => (f.rule === 'structure-localized' && stamped ? { ...f, level: 'BLOCKING' } : f)));
    recordFindings(read(path.join(dir, n)), file, 'tdr').forEach((f) => findings.push({ rule: f.rule, level: stamped ? 'BLOCKING' : 'WARNING', file, line: f.line || 1, message: `${f.where ? f.where + ' — ' : ''}${f.detail}` }));
  });
  findings = findings.concat(checkIndex(root, records), checkLinks(root, records));
  return { records, findings, blocking: findings.filter((f) => f.level === 'BLOCKING').length, warnings: findings.filter((f) => f.level === 'WARNING').length };
}

// ── the TDRs the documents owe (8.92.7) ──
// A create writes `TDR-001` into a principle or an ADR ("the waiver is pending, TDR-001") before any record exists, and nothing
// asked for it: on the 8.92.6 control run three documents cited TDR-001 and tdr/ did not exist. Pending = an id cited in
// ARCHITECTURE.md, docs/** or adr/** with no file in tdr/, each with the lines that cite it (what the record is written from);
// `unnumbered` = a sentence that promises a TDR without an id ("se registra como TDR", "recorded as a TDR").
const PROMISE = /\b(?:se\s+registra(?:rá)?\s+(?:como|en)\s+(?:un\s+)?TDR|queda\s+(?:como\s+deuda\s+)?en\s+(?:un\s+)?TDR|(?:recorded|tracked|logged)\s+(?:as|in)\s+a\s+TDR|TDR\s+pendiente|pending\s+TDR)\b/i;
function pending(root) {
  root = path.resolve(root);
  const have = new Set(fs.existsSync(path.join(root, 'tdr')) ? fs.readdirSync(path.join(root, 'tdr')).map((n) => (n.match(/^TDR-\d+/i) || [''])[0].toUpperCase()).filter(Boolean) : []);
  const files = [];
  const walk = (rel) => { let es; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; } es.forEach((e) => { const r = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.md') && e.name !== 'CHANGELOG.md') files.push(r); }); };
  if (fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) files.push('ARCHITECTURE.md');
  walk('docs'); walk('adr');
  const ids = new Map(), unnumbered = [];
  files.forEach((f) => read(path.join(root, f)).split('\n').forEach((l, i) => {
    if (/^\s*(<!--|[a-z_]+:\s)/.test(l)) return;   // header keys and comments
    const found = [...l.matchAll(/\bTDR-(\d{3,})\b/gi)].map((m) => 'TDR-' + m[1]).filter((id) => !have.has(id.toUpperCase()) && !/TDR-N+/i.test(id));
    found.forEach((id) => { if (!ids.has(id)) ids.set(id, []); ids.get(id).push({ file: f, line: i + 1, text: l.trim().slice(0, 240) }); });
    if (!/\bTDR-\d{3,}\b/i.test(l) && PROMISE.test(l)) unnumbered.push({ file: f, line: i + 1, text: l.trim().slice(0, 240) });
  }));
  const next = Math.max(0, ...[...have, ...ids.keys()].map((x) => Number(x.slice(4)))) + 1;
  return { pending: [...ids].map(([id, cites]) => ({ id, cites })).sort((a, b) => a.id.localeCompare(b.id)), unnumbered, next: 'TDR-' + String(next).padStart(3, '0') };
}

// ── a transition ──
function move(from, to) {
  const f = canon(from) || (fromRetired(from) || {}).to || fromJira(from);
  const t = canon(to) || fromJira(to);
  if (!f) return { ok: false, reason: `\`${from}\` is not a status` };
  if (!t) return { ok: false, reason: `\`${to}\` is not a status — one of ${STATUSES.join(' · ')}` };
  if (f === t) return { ok: false, from: f, to: t, reason: `already \`${t}\`` };
  if (MOVES[f].includes(t)) return { ok: true, from: f, to: t, arrow: `${f} ──► ${t}`, note: `a dated \`## History\` note; \`## Status\` and \`status:\` change together` };
  const via = MOVES[f].find((x) => MOVES[x].includes(t));
  return { ok: false, from: f, to: t, reason: via ? `never straight to \`${t}\` — the arrow is ${f} ──► ${via} ──► ${t}` : `no arrow from \`${f}\` to \`${t}\` — from \`${f}\` the moves are ${MOVES[f].length ? MOVES[f].map((x) => '`' + x + '`').join(', ') : 'none (terminal)'}` };
}

const render = (r) => {
  const out = [`tdr-check: ${r.records.length} record(s) — ${r.blocking} blocking, ${r.warnings} warning(s)`];
  r.findings.forEach((f) => out.push(`  ${f.level === 'BLOCKING' ? '✗' : '!'} ${f.file}:${f.line} [${f.rule}] ${f.message}`));
  if (!r.findings.length) out.push('  every record carries one of the five statuses, identical in `## Status` and `status:`; the index matches');
  return out.join('\n');
};

module.exports = { check, checkRecord, checkLinks, descriptors, move, pending, STATUSES, JIRA, RETIRED, MOVES, DRIVERS };

if (require.main === module) {
  const args = process.argv.slice(2);
  const root = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--move' && args[args.indexOf(a) - 2] !== '--move');
  if (!root) { console.error('usage: bun tdr-check.js <project-root> [--json] | --move TDR-NNN "<status>"'); process.exit(2); }
  const mi = args.indexOf('--move');
  if (mi >= 0) {
    const id = (args[mi + 1] || '').toUpperCase(), to = args[mi + 2] || '';
    const dir = path.join(root, 'tdr');
    const n = fs.existsSync(dir) ? fs.readdirSync(dir).find((x) => x.toUpperCase().startsWith(id + '-') || x.toUpperCase() === id + '.MD') : null;
    if (!n) { console.error(`${id}: no record in tdr/`); process.exit(2); }
    const cur = checkRecord('tdr/' + n, read(path.join(dir, n))).status;
    const m = move(cur || '', to);
    if (args.includes('--json')) console.log(JSON.stringify(Object.assign({ id, current: cur }, m), null, 1));
    else console.log(m.ok ? `${id}: ${m.arrow} — allowed. ${m.note}.` : `${id}: \`${cur}\` → \`${to}\` refused — ${m.reason}.`);
    process.exit(m.ok ? 0 : 1);
  }
  if (args.includes('--pending')) {
    const p = pending(root);
    if (args.includes('--json')) { console.log(JSON.stringify(p, null, 1)); process.exit(0); }
    console.log(`TDR_PENDING: ${p.pending.length} cited without a record, ${p.unnumbered.length} promised without an id · next free id ${p.next}`);
    p.pending.forEach((x) => { console.log(`  ${x.id}`); x.cites.forEach((c) => console.log(`    ${c.file}:${c.line}  ${c.text}`)); });
    if (p.unnumbered.length) { console.log('  promised without an id'); p.unnumbered.forEach((c) => console.log(`    ${c.file}:${c.line}  ${c.text}`)); }
    process.exit(0);
  }
  const r = check(root);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1)); else console.log(render(r));
  process.exit(r.blocking ? 1 : 0);
}
