#!/usr/bin/env bun
// Tier 0 from the IDE. A RUN team's agent works in the service repository, so the four writes Tier 0 allows (support.js
// TIER0) cannot land where they belong — the architecture repository. The agent files a request instead: an issue
// `[T0-?] <title>` (the MCP server's preview_tier0 renders it; this file is the format's contract), and the architecture
// repository writes it: architecture-tier0.yml runs `prepare` on the labelled issue, the record is written (doc-fix by
// code here, the others by the TDR / ADR skills from the payload), `verify` holds the write to the request, and the pull
// request merges when the gates pass. The IDE's classification is a claim: prepare re-reads the policy here, and a request
// that is no Tier 0 write — or leaves anything in doubt — is refused with its reasons, never written.
//
//   bun tier0.js render  <request.json>                     the issue: title, labels, body (what preview_tier0 returns)
//   bun tier0.js prepare <project> <issue#|url> [--host h]  parse, validate, number; writes .cache/sa-skills/tier0/issue-<n>.json
//   bun tier0.js prepare <project> --from <issue.json>      the same from an issue saved as { title, body, url, labels }
//   bun tier0.js apply   <project> <payload.json>           doc-fix only: the replacement, by code
//   bun tier0.js verify  <project> <payload.json>           the write matches the request and touches nothing else
//
// request.json: { kind, title, request, components: [canonical name], requested_by, architecture, evidence: [{ where, note }],
//   fields } — fields per kind:
//   tdr-workaround  { description, impact, solutions: [line], driver?, owner_technical, owner_business?, adrs?: [ADR-NNN] }
//   tdr-status      { tdr: TDR-NNN, to: <status>, note, target_date? }   — evidence: the commit or change that moved it
//   adr-proposed    { context, decision, consequences: [line], alternatives?: [line] }
//   doc-fix         { file: docs/…, line, before, after }                 — a wording, typo or link that changes no fact
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const support = require('./support.js');
const escalate = require('./escalate.js');
const { collect } = require('./arch-facts.js');
const tdr = require(path.join(__dirname, '..', '..', 'plugins', 'sa-records', 'skills', 'technical-debt-records', 'scripts', 'tdr-check.js'));

const LABEL = 'architecture-tier0';
const KINDS = {
  'tdr-workaround': { required: ['description', 'impact', 'solutions', 'owner_technical'], evidence: true, paths: ['tdr/'] },
  'tdr-status': { required: ['tdr', 'to', 'note'], evidence: true, paths: ['tdr/'] },
  'adr-proposed': { required: ['context', 'decision', 'consequences'], evidence: false, paths: ['adr/'] },
  'doc-fix': { required: ['file', 'line', 'before', 'after'], evidence: false, paths: [] },
};
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const list = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]).map((x) => String(x).trim()).filter(Boolean);
const filled = (v) => (Array.isArray(v) ? list(v).length > 0 : v != null && String(v).trim() !== '');
const cell = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const fenceFor = (t, min = 3) => '`'.repeat(Math.max(min, ...(String(t).match(/`+/g) || []).map((x) => x.length + 1)));
const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'record';

function validate(req) {
  const errors = [], k = KINDS[req.kind];
  if (!k) return [`kind "${req.kind || ''}" is not a Tier 0 write — one of ${Object.keys(KINDS).join(', ')}`];
  if (!filled(req.title)) errors.push('title is required');
  if (!filled(req.request)) errors.push('request (what the developer asked for, in their words) is required');
  const f = req.fields || {};
  k.required.filter((x) => !filled(f[x])).forEach((x) => errors.push(`fields.${x} is required for ${req.kind}`));
  if (k.evidence && !(req.evidence || []).some((e) => filled(e && e.where))) errors.push(`${req.kind} needs evidence: where it shows in the service (repository, commit, file:line)`);
  if (req.kind === 'tdr-status') {
    if (f.tdr && !/^TDR-\d{3,}$/.test(f.tdr)) errors.push(`fields.tdr "${f.tdr}" is not a TDR id`);
    if (f.to && !tdr.STATUSES.includes(f.to)) errors.push(`fields.to "${f.to}" is not a status — one of ${tdr.STATUSES.join(' · ')}`);
    if (f.to === 'Planned' && !/^\d{4}-\d{2}-\d{2}$/.test(String(f.target_date || ''))) errors.push('a move to Planned needs fields.target_date (YYYY-MM-DD)');
    if (f.to === "Won't Fix") errors.push("a move to Won't Fix is a decision, not a Tier 0 write — the architect makes it");
  }
  if (req.kind === 'tdr-workaround' && f.driver && !tdr.DRIVERS.includes(f.driver)) errors.push(`fields.driver "${f.driver}" is not one of ${tdr.DRIVERS.join(' · ')}`);
  if (req.kind === 'doc-fix') {
    if (f.file && (!/^docs\//.test(f.file) || f.file.split('/').includes('..'))) errors.push(`fields.file "${f.file}" is not under docs/`);
    if (f.line != null && !(Number.isInteger(Number(f.line)) && Number(f.line) >= 1)) errors.push('fields.line is a line number');
    if (filled(f.before) && f.before === f.after) errors.push('fields.before and fields.after are the same text');
    if (/\n/.test(String(f.before || '') + String(f.after || ''))) errors.push('a doc-fix replaces text inside one line');
  }
  return errors;
}

// ---- the issue -----------------------------------------------------------------------------------------------------
const issueTitle = (req) => `[T0-?] ${String(req.title).trim()}`;
const labelsOf = (req) => [LABEL, `tier0:${req.kind}`];
function issueBody(req) {
  const fields = JSON.stringify(req.fields || {}, null, 2), fj = fenceFor(fields), rq = String(req.request || '').replace(/\r\n?/g, '\n').trim(), fr = fenceFor(rq);
  const ev = (req.evidence || []).filter((e) => e && filled(e.where)).map((e) => `- ${e.where}${filled(e.note) ? ` — ${e.note}` : ''}`);
  const facts = [['Architecture', req.architecture || '—'], ['Kind', `\`${req.kind}\` — ${support.TIER0_LABEL[req.kind] || ''}`], ['Requested by', req.requested_by || '—'],
    ['Components', list(req.components).join(', ') || '—']];
  return ['| | |', '|---|---|', ...facts.map(([k, v]) => `| ${k} | ${cell(v)} |`), '', '## Request', '', `${fr}text`, rq, fr, '',
    '## Evidence', '', ...(ev.length ? ev : ['- None.']), '', '## Fields', '', `${fj}json`, fields, fj, '',
    `_Tier 0: the architecture repository writes it once the issue carries the label \`${LABEL}\` (architecture-tier0.yml); a request that is no Tier 0 write is refused there, with the reason._`, '<!-- sa-tier0 -->', ''].join('\n');
}
// the request back out of an issue body issueBody() wrote (by the plugin or the server's port of it)
function requestOf(issue) {
  const body = '\n' + String(issue.body || '').replace(/\r\n?/g, '\n');
  const row = (k) => { const m = body.match(new RegExp(`^\\| ${k} \\| (.*) \\|$`, 'm')); return m && m[1].trim() !== '—' ? m[1].trim().replace(/\\\|/g, '|') : ''; };
  const fenced = (h, lang) => { const i = body.indexOf(`\n## ${h}\n`); if (i < 0) return null;
    const m = body.slice(i + h.length + 5).replace(/^\n+/, '').match(new RegExp(`^(\`{3,})${lang}\\n([\\s\\S]*?)\\n\\1(?:\\n|$)`)); return m ? m[2] : null; };
  const evStart = body.indexOf('\n## Evidence\n'), evEnd = body.indexOf('\n## Fields\n');
  const evidence = evStart < 0 ? [] : body.slice(evStart + 13, evEnd < 0 ? body.length : evEnd).split('\n').filter((l) => /^- /.test(l) && l !== '- None.')
    .map((l) => { const t = l.slice(2), i = t.indexOf(' — '); return i >= 0 ? { where: t.slice(0, i), note: t.slice(i + 3) } : { where: t }; });
  let fields = {}, fieldsError = null;
  const fj = fenced('Fields', 'json'); try { fields = fj == null ? {} : JSON.parse(fj); } catch (e) { fieldsError = `the Fields block is not JSON: ${e.message}`; }
  const kind = (row('Kind').match(/^`([a-z0-9-]+)`/) || [])[1] || ((issue.labels || []).find((l) => /^tier0:/.test(l)) || '').slice(6);
  return { kind, title: String(issue.title || '').replace(/^\[(?:T0-\?|T0|TDR-\d+|ADR-\d+)\]\s*/, '').trim(), request: fenced('Request', 'text') || '', components: row('Components').split(',').map((x) => x.trim()).filter(Boolean),
    requested_by: row('Requested by'), architecture: row('Architecture'), evidence, fields, ...(fieldsError ? { fieldsError } : {}) };
}

// ---- the facts a doc-fix must leave as they were -------------------------------------------------------------------
// the ledger's structure — names, types, technologies, ids, statuses, integrations, flows, phases, figures — never its prose
const PROSE = new Set(['description', 'scope', 'key_concepts', 'bytes', 'line', 'warnings', 'file', 'generated_at', 'project_root', 'last_updated', 'released']);
function factsHash(root) {
  const f = collect(path.resolve(root));
  const strip = (v) => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().filter((k) => !PROSE.has(k)).map((k) => [k, strip(v[k])])) : v);
  const keep = ['architecture', 'systems', 'components', 'adrs', 'tdrs', 'layers', 'integrations', 'phases', 'flows', 'demand', 'increments'];
  return crypto.createHash('sha256').update(JSON.stringify(strip(Object.fromEntries(keep.map((k) => [k, f[k]]))))).digest('hex');
}

// ---- prepare: the labelled issue becomes a payload, or a refusal with its reasons ----------------------------------
const nextAdr = (root) => { const d = path.join(root, 'adr'); const n = fs.existsSync(d) ? fs.readdirSync(d).map((x) => Number((x.match(/^ADR-(\d{3,})/i) || [])[1] || 0)) : [];
  return 'ADR-' + String(Math.max(100, ...n) + 1).padStart(3, '0'); };
function prepare(root, issue, opts = {}) {
  root = path.resolve(root);
  if (!opts.force && !(issue.labels || []).includes(LABEL) && !/^\[T0-\?\]/.test(String(issue.title))) return { ok: false, reasons: [`not a Tier 0 request: no ${LABEL} label and no [T0-?] title`] };
  const req = requestOf(issue), reasons = [];
  if (req.fieldsError) reasons.push(req.fieldsError);
  reasons.push(...validate(req));
  const s = support.supportOf(root);
  if (!s.tier0) reasons.push(`Tier 0 does not apply here: ${s.reason}`);
  const facts = collect(root), names = new Set((facts.components || []).map((c) => c.name));
  list(req.components).filter((c) => !names.has(c)).forEach((c) => reasons.push(`component "${c}" is not a canonical name of this architecture — a name in doubt is no Tier 0 write`));
  const f = req.fields || {}, payload = { kind: req.kind, issue: { n: issue.n || null, url: issue.url || null }, today: opts.today || today(), request: req };
  if (!reasons.length && req.kind === 'tdr-workaround') {
    const adrs = new Set((facts.adrs || []).map((a) => a.id));
    list(f.adrs).filter((a) => !adrs.has(a)).forEach((a) => reasons.push(`fields.adrs: ${a} does not exist`));
    payload.id = tdr.pending(root).next; payload.file = `tdr/${payload.id}-${slugify(req.title)}.md`;
  }
  if (!reasons.length && req.kind === 'tdr-status') {
    const rec = tdr.check(root).records.find((r) => r.id === f.tdr);
    if (!rec) reasons.push(`${f.tdr} has no record under tdr/`);
    else { const m = tdr.move(rec.status, f.to); if (!m.ok) reasons.push(`${f.tdr}: ${rec.status} → ${f.to} is refused — ${m.reason}`); else Object.assign(payload, { id: f.tdr, file: rec.file, from: rec.status, arrow: m.arrow }); }
  }
  if (!reasons.length && req.kind === 'adr-proposed') { payload.id = nextAdr(root); payload.file = `adr/${payload.id}-${slugify(req.title)}.md`; }
  if (!reasons.length && req.kind === 'doc-fix') {
    const file = path.join(root, f.file);
    if (!fs.existsSync(file)) reasons.push(`${f.file} does not exist`);
    else {
      const lines = read(file).split('\n'), at = lines[Number(f.line) - 1] || '';
      const where = at.includes(f.before) ? Number(f.line) : (() => { const hits = lines.map((l, i) => (l.includes(f.before) ? i + 1 : 0)).filter(Boolean); return hits.length === 1 ? hits[0] : 0; })();
      if (!where) reasons.push(`${f.file}:${f.line} does not carry the text to replace, and it is not once elsewhere in the file`);
      else Object.assign(payload, { file: f.file, line: where, facts: factsHash(root) });
    }
  }
  if (reasons.length) return { ok: false, kind: req.kind, reasons };
  const dir = path.join(root, '.cache', 'sa-skills', 'tier0'); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `issue-${issue.n || 'local'}.json`); fs.writeFileSync(out, JSON.stringify(payload, null, 1) + '\n');
  return Object.assign({ ok: true, payload_file: path.relative(root, out) }, payload);
}

// ---- apply (doc-fix) and verify -----------------------------------------------------------------------------------
function apply(root, payload) {
  if (payload.kind !== 'doc-fix') throw new Error(`apply writes a doc-fix; a ${payload.kind} is written by its skill from the payload`);
  const file = path.join(path.resolve(root), payload.file), lines = read(file).split('\n'), f = payload.request.fields;
  lines[payload.line - 1] = lines[payload.line - 1].replace(f.before, () => f.after);
  fs.writeFileSync(file, lines.join('\n'));
  return { file: payload.file, line: payload.line };
}
function changedPaths(root) {
  const r = spawnSync('git', ['-C', root, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' });
  return String(r.stdout || '').split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop()).filter((p) => !p.startsWith('.cache/'));
}
function verify(root, payload) {
  root = path.resolve(root);
  const problems = [], f = payload.request.fields || {};
  const allowed = (p) => (payload.kind === 'doc-fix' ? p === payload.file : KINDS[payload.kind].paths.some((d) => p.startsWith(d)));
  const changed = changedPaths(root);
  changed.filter((p) => !allowed(p)).forEach((p) => problems.push(`${p} changed — a ${payload.kind} writes ${payload.kind === 'doc-fix' ? payload.file : KINDS[payload.kind].paths.join(', ')} only`));
  if (!changed.length) problems.push('nothing was written');
  if (payload.kind === 'tdr-workaround' || payload.kind === 'tdr-status') {
    const c = tdr.check(root), rec = c.records.find((r) => r.id === payload.id);
    if (!rec) problems.push(`${payload.id} has no record under tdr/`);
    else {
      const want = payload.kind === 'tdr-status' ? f.to : 'Open';
      if (rec.status !== want) problems.push(`${payload.id} is ${rec.status}, the request says ${want}`);
      c.findings.filter((x) => x.level === 'BLOCKING' && (x.file === rec.file || x.file === 'tdr/README.md')).forEach((x) => problems.push(`${x.file}:${x.line} ${x.rule} — ${x.message}`));
    }
  }
  if (payload.kind === 'adr-proposed') {
    const d = path.join(root, 'adr'), hit = fs.existsSync(d) && fs.readdirSync(d).find((n) => n.toUpperCase().startsWith(payload.id + '-'));
    if (!hit) problems.push(`${payload.id} has no file under adr/`);
    else { const src = read(path.join(d, hit)); if (!/^(?:status:\s*Proposed|\*\*Status\*\*:?\s*`?Proposed)/im.test(src)) problems.push(`${payload.id} is not Proposed`); }
    if (!fs.existsSync(path.join(d, 'README.md')) || !read(path.join(d, 'README.md')).includes(payload.id)) problems.push(`adr/README.md does not list ${payload.id}`);
  }
  if (payload.kind === 'doc-fix' && factsHash(root) !== payload.facts) problems.push('the fix changed a fact of the architecture — no Tier 0 write; it goes through the architect');
  return { ok: !problems.length, problems, changed };
}

const TDR_MOVES = tdr.MOVES;   // the arrows a status move may take, for readers outside the records category
module.exports = { LABEL, KINDS, TDR_MOVES, validate, issueTitle, labelsOf, issueBody, requestOf, factsHash, prepare, apply, verify };

if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2), cmd = a[0];
    const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
    try {
      if (cmd === 'render') { const req = JSON.parse(read(a[1])); const e = validate(req); if (e.length) { console.error(e.join('\n')); process.exit(1); }
        console.log(JSON.stringify({ title: issueTitle(req), labels: labelsOf(req), body: issueBody(req) }, null, 2)); return; }
      const root = path.resolve(a[1] || '.');
      if (cmd === 'prepare') {
        const issue = opt('--from') ? JSON.parse(read(opt('--from'))) : await escalate.fetchIssue(root, a[2], { host: opt('--host') });
        const r = prepare(root, issue, { force: a.includes('--force') });
        if (a.includes('--json')) console.log(JSON.stringify(r, null, 1));
        else console.log(r.ok ? `TIER 0: ${r.kind} → ${r.id || r.file}${r.id && r.file ? ` (${r.file})` : ''}${r.arrow ? ` · ${r.arrow}` : ''} · payload ${r.payload_file}` : `TIER 0 refused${r.kind ? ` (${r.kind})` : ''}:\n${r.reasons.map((x) => `- ${x}`).join('\n')}`);
        process.exit(r.ok ? 0 : 1);
      }
      if (cmd === 'apply') { const r = apply(root, JSON.parse(read(a[2]))); console.log(`doc-fix applied: ${r.file}:${r.line}`); return; }
      if (cmd === 'verify') { const r = verify(root, JSON.parse(read(a[2])));
        console.log(r.ok ? `TIER 0 verified: ${r.changed.join(', ')}` : `TIER 0 write refused:\n${r.problems.map((x) => `- ${x}`).join('\n')}`); process.exit(r.ok ? 0 : 1); }
      console.error('Usage: bun tier0.js render <request.json> | prepare <project> <issue#|url>|--from <issue.json> | apply|verify <project> <payload.json>'); process.exit(2);
    } catch (e) { console.error(`tier0.js: ${e.message}`); process.exit(2); }
  })();
}
