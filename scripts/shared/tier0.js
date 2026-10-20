#!/usr/bin/env bun
// Tier 0 from the IDE. A RUN team's agent works in the service repository, so the four writes Tier 0 allows (support.js
// TIER0) cannot land where they belong — the architecture repository. The agent files a request instead: an issue
// `[T0-?] <title>` (the MCP server's preview_tier0 renders it; this file is the format's contract), and the architecture
// repository writes it: architecture-tier0.yml runs `prepare` on the labelled issue, the record is written (doc-fix by
// code here, the others by the TDR / ADR skills from the payload), `verify` holds the write to the request, and the pull
// request merges when the gates pass. The IDE's classification is a claim: prepare re-reads the policy here, and a request
// that is no Tier 0 write — or leaves anything in doubt — is refused with its reasons, never written.
//
//   bun tier0.js render  <request.json> [--auto <kinds>]    the issue: title, labels, body (what preview_tier0 returns); --auto
//                                                           the architecture's tier0.auto, which an unattended request keys itself
//   bun tier0.js prepare <project> <issue#|url> [--host h]  parse, validate, number; writes .cache/sa-skills/tier0/issue-<n>.json
//                        [--auto]                           keyed by a trusted agent: its kind must be in tier0.auto, and a move to
//                                                           Resolved must name a commit merged into its repository's default branch
//   bun tier0.js prepare <project> --from <issue.json>      the same from an issue saved as { title, body, url, labels }
//   bun tier0.js apply   <project> <payload.json>           doc-fix only: the replacement, by code
//   bun tier0.js verify  <project> <payload.json>           the write matches the request; outside its folder every change names
//                                                           the record, no institutional ADR moves, no other fact of the ledger moves
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
// an unattended build agent (`supervision: unattended` in the service's .architecture.json) files without the key: a person
// reviews the request and applies `architecture-tier0`, and that is the approval — a bot never authorizes itself (10.10.0).
// A kind the architecture lists in tier0.auto (support.js) is the exception: the agent keys it itself, and the architecture
// repository accepts that key from an account in SA_TIER0_TRUSTED_AGENTS on an issue it filed (10.12.0)
const unattended = (req) => req.supervision === 'unattended';
const autoKeyed = (req, auto = []) => unattended(req) && list(auto).includes(req.kind);
const labelsOf = (req, auto = []) => (unattended(req) && !autoKeyed(req, auto) ? [`tier0:${req.kind}`] : [LABEL, `tier0:${req.kind}`]);
function issueBody(req, auto = []) {
  const fields = JSON.stringify(req.fields || {}, null, 2), fj = fenceFor(fields), rq = String(req.request || '').replace(/\r\n?/g, '\n').trim(), fr = fenceFor(rq);
  const ev = (req.evidence || []).filter((e) => e && filled(e.where)).map((e) => `- ${e.where}${filled(e.note) ? ` — ${e.note}` : ''}`);
  const facts = [['Architecture', req.architecture || '—'], ['Kind', `\`${req.kind}\` — ${support.TIER0_LABEL[req.kind] || ''}`], ['Requested by', req.requested_by || '—'],
    ['Components', list(req.components).join(', ') || '—']];
  return ['| | |', '|---|---|', ...facts.map(([k, v]) => `| ${k} | ${cell(v)} |`), '', '## Request', '', `${fr}text`, rq, fr, '',
    '## Evidence', '', ...(ev.length ? ev : ['- None.']), '', '## Fields', '', `${fj}json`, fields, fj, '',
    autoKeyed(req, auto)
      ? `_Tier 0, filed and keyed by an unattended build agent: this architecture lets a trusted agent start \`${req.kind}\` itself (\`tier0.auto\`), so the architecture repository writes it now (architecture-tier0.yml) and a person reviews it after, in its pull request and the release; a request that is no Tier 0 write is refused there, with the reason._`
      : unattended(req)
      ? `_Tier 0, filed by an unattended build agent: a person reviews it and applies the label \`${LABEL}\` — that is the approval; the architecture repository then writes it (architecture-tier0.yml), and a request that is no Tier 0 write is refused there, with the reason._`
      : `_Tier 0: the architecture repository writes it once the issue carries the label \`${LABEL}\` (architecture-tier0.yml); a request that is no Tier 0 write is refused there, with the reason._`, '<!-- sa-tier0 -->', ''].join('\n');
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

// ---- the facts a Tier 0 write must leave as they were ---------------------------------------------------------------
// the ledger's structure — names, types, technologies, ids, statuses, integrations, flows, phases, figures — never its prose.
// A record's own part may move (OWN: a TDR the tdrs, an ADR the adrs and the related_adrs that link it); nothing else may
const PROSE = new Set(['description', 'scope', 'key_concepts', 'bytes', 'line', 'warnings', 'file', 'generated_at', 'project_root', 'last_updated', 'released']);
const OWN = { 'tdr-workaround': ['tdrs'], 'tdr-status': ['tdrs'], 'adr-proposed': ['adrs', 'related_adrs'], 'doc-fix': [] };
function factsHash(root, except = []) {
  const f = collect(path.resolve(root)), skip = new Set([...PROSE, ...except]);
  const strip = (v) => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().filter((k) => !skip.has(k)).map((k) => [k, strip(v[k])])) : v);
  const keep = ['architecture', 'systems', 'components', 'adrs', 'tdrs', 'layers', 'integrations', 'phases', 'flows', 'demand', 'increments'].filter((k) => !skip.has(k));
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
  // keyed by a trusted agent, no person read it: the kind is one the architecture lets an agent start, and "the code resolved
  // it" is held to the code that shipped — every commit the evidence names is on its repository's default branch
  if (opts.auto) {
    payload.auto = true;
    if (!s.auto || !s.auto.includes(req.kind)) reasons.push(`a trusted agent keyed this request, but \`${req.kind}\` is not in this architecture's tier0.auto (.sa-skills/project.json: ${s.auto && s.auto.length ? s.auto.join(', ') : 'none'}) — a person applies ${LABEL}`);
    else if (!reasons.length && req.kind === 'tdr-status' && f.to === 'Resolved') {
      const commits = commitsOf(req.evidence);
      if (!commits.length) reasons.push(`a move to Resolved keyed by an agent names the commit that resolved it — evidence \`owner/repo@sha\`; none is named`);
      const merged = opts.merged || mergedOnDefault;
      commits.forEach((c) => { const r = merged(c); if (!r.ok) reasons.push(`${c.repo}@${c.sha.slice(0, 12)} is not on ${c.repo}'s default branch${r.branch ? ` (${r.branch})` : ''}: ${r.reason} — merge the change, then key the request again`); });
    }
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
  if (!payload.facts) payload.facts = factsHash(root, OWN[req.kind]);
  const dir = path.join(root, '.cache', 'sa-skills', 'tier0'); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `issue-${issue.n || 'local'}.json`); fs.writeFileSync(out, JSON.stringify(payload, null, 1) + '\n');
  return Object.assign({ ok: true, payload_file: path.relative(root, out) }, payload);
}

// the commits an evidence list names: `owner/repo@sha` (the form preview_tier0 renders), 7 to 40 hex digits
function commitsOf(evidence) {
  const seen = new Set();
  return (evidence || []).flatMap((e) => [...String(e.where || '').matchAll(/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)@([0-9a-f]{7,40})\b/g)])
    .map((m) => ({ repo: m[1], sha: m[2] })).filter((c) => { const k = `${c.repo}@${c.sha}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
// is the commit on the repository's default branch? GitHub's compare: <default>...<sha> is `behind` or `identical` when it is.
// A private service repository needs a token that reads it (SA_TIER0_EVIDENCE_TOKEN in the workflow)
const ghRead = (args) => spawnSync('gh', args, { encoding: 'utf8',
  env: process.env.SA_TIER0_EVIDENCE_TOKEN ? { ...process.env, GH_TOKEN: process.env.SA_TIER0_EVIDENCE_TOKEN } : process.env });
function mergedOnDefault(c, run = ghRead) {
  const repo = run(['api', `repos/${c.repo}`, '--jq', '.default_branch']);
  if (repo.status !== 0) return { ok: false, reason: `the repository could not be read (${(repo.stderr || '').trim().split('\n')[0] || 'gh api failed'})` };
  const branch = repo.stdout.trim();
  const cmp = run(['api', `repos/${c.repo}/compare/${branch}...${c.sha}`, '--jq', '.status']);
  if (cmp.status !== 0) return { ok: false, branch, reason: `the commit could not be compared (${(cmp.stderr || '').trim().split('\n')[0] || 'gh api failed'})` };
  const st = cmp.stdout.trim();
  return st === 'behind' || st === 'identical' ? { ok: true, branch } : { ok: false, branch, reason: `${branch} does not contain it (compare: ${st})` };
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
// the section that carries the TDR summary table (the TDR skill appends its row there): found by its anchor, never by file name
function debtSection(root) {
  const d = path.join(root, 'docs'); if (!fs.existsSync(d)) return null;
  const hit = fs.readdirSync(d).filter((n) => n.endsWith('.md')).find((n) => /<!--\s*SECTION:\s*Risks and Technical Debt\s*-->/.test(read(path.join(d, n))));
  return hit ? `docs/${hit}` : null;
}
// the hunks of a write in one file, each the lines it added and removed; an untracked file is one hunk
function hunks(root, file) {
  const tracked = spawnSync('git', ['-C', root, 'ls-files', '--error-unmatch', '--', file], { encoding: 'utf8' }).status === 0;
  if (!tracked) return fs.existsSync(path.join(root, file)) ? [read(path.join(root, file)).split('\n').map((l) => '+' + l)] : [];
  const out = String(spawnSync('git', ['-C', root, 'diff', '--unified=0', '--', file], { encoding: 'utf8' }).stdout || '').split('\n');
  const hs = []; out.forEach((l) => { if (l.startsWith('@@')) hs.push([]); else if (hs.length && /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l)) hs[hs.length - 1].push(l); });   // the sign kept: an excerpt shows what was added
  return hs.filter((h) => h.some((l) => l.slice(1).trim()));
}
const institutional = (p) => { const m = p.match(/^adr\/ADR-(\d{3,})/i); return m && Number(m[1]) <= 100; };
// A record propagates over the documentation surface (the TDR skill links both ways — TDR ↔ affected components, TDR ↔ ADR —
// and adds its Section 13 row; the ADR skill indexes and links): outside its own folder every hunk names the record's id,
// no institutional ADR is touched, and the facts ledger moves in the record's own part only
function verify(root, payload) {
  root = path.resolve(root);
  const problems = [], notes = [], f = payload.request.fields || {}, id = payload.id;
  const home = payload.kind === 'doc-fix' ? null : KINDS[payload.kind].paths[0];
  const changed = changedPaths(root);
  if (!changed.length) problems.push('nothing was written');
  changed.forEach((p) => {
    if (payload.kind === 'doc-fix') { if (p !== payload.file) problems.push(`${p} changed — a doc-fix writes ${payload.file} only`); return; }
    if (institutional(p)) { problems.push(`${p} changed — an institutional ADR is never edited by a Tier 0 write`); return; }
    if (p.startsWith(home)) return;
    if (!/^(docs|adr)\//.test(p)) { problems.push(`${p} changed — a ${payload.kind} writes ${home}, and docs/ or a project ADR where it links ${id}`); return; }
    hunks(root, p).filter((h) => !h.some((l) => l.includes(id))).forEach((h) => problems.push(`${p}: a change that does not name ${id} — ${(h.find((l) => l[0] === '+' && l.slice(1).trim()) || h.find((l) => l.slice(1).trim()) || '').slice(1).trim().slice(0, 120)}`));
  });
  const debt = payload.kind === 'tdr-workaround' ? debtSection(root) : null;
  if (debt && !read(path.join(root, debt)).includes(id)) problems.push(`${debt} has no summary row for ${id} — the TDR skill appends one to the Risks and Technical Debt section`);
  // and the link back: every affected component with a descriptor names it (`**Technical Debt:**`, 10.8.0)
  if (payload.kind === 'tdr-workaround') tdr.descriptors(root).filter((d) => list(payload.request.components).includes(d.name) && !d.ids.includes(id))
    .forEach((d) => problems.push(`${d.file} does not name ${id} — the affected component's descriptor carries \`**Technical Debt:** [${id}](…)\` after \`**Last Updated:**\``));
  if (payload.kind === 'tdr-workaround' || payload.kind === 'tdr-status') {
    const c = tdr.check(root), rec = c.records.find((r) => r.id === id);
    if (!rec) problems.push(`${id} has no record under tdr/`);
    else {
      const want = payload.kind === 'tdr-status' ? f.to : 'Open';
      if (rec.status !== want) problems.push(`${id} is ${rec.status}, the request says ${want}`);
      c.findings.filter((x) => x.level === 'BLOCKING' && (x.file === rec.file || x.file === 'tdr/README.md')).forEach((x) => problems.push(`${x.file}:${x.line} ${x.rule} — ${x.message}`));
      // a sentence that still states the old status is a line naming the id — the write fixes it (10.10.10); the other
      // mentions of a closed record are listed on the pull request for a person
      const m = tdr.mentions(root, c.records);
      m.stale.filter((x) => x.id === id).forEach((x) => problems.push(`${x.file}:${x.line} states ${id} as \`${x.stated}\`, the record is \`${x.status}\` — ${x.text.slice(0, 120)}`));
      m.open.filter((x) => x.id === id).forEach((x) => notes.push(`${x.file}:${x.line} cites ${id} (${x.status}) — ${x.text.slice(0, 160)}`));
    }
  }
  if (payload.kind === 'adr-proposed') {
    const d = path.join(root, 'adr'), hit = fs.existsSync(d) && fs.readdirSync(d).find((n) => n.toUpperCase().startsWith(id + '-'));
    if (!hit) problems.push(`${id} has no file under adr/`);
    else { const src = read(path.join(d, hit)); if (!/^(?:status:\s*Proposed|\*\*Status\*\*:?\s*`?Proposed)/im.test(src)) problems.push(`${id} is not Proposed`); }
    if (!fs.existsSync(path.join(d, 'README.md')) || !read(path.join(d, 'README.md')).includes(id)) problems.push(`adr/README.md does not list ${id}`);
  }
  if (payload.facts && factsHash(root, OWN[payload.kind]) !== payload.facts) problems.push(payload.kind === 'doc-fix' ? 'the fix changed a fact of the architecture — no Tier 0 write; it goes through the architect'
    : `a fact of the architecture outside ${id}'s own record moved — a name, type, technology, integration, flow, figure or another record's status; that goes through the architect`);
  return { ok: !problems.length, problems, changed, notes };
}

// the TDR vocabulary for readers outside the records category (the bundle, so the MCP server keeps no copy)
const TDR_MOVES = tdr.MOVES, TDR_STATUSES = tdr.STATUSES, TDR_DRIVERS = tdr.DRIVERS;
module.exports = { LABEL, KINDS, TDR_MOVES, TDR_STATUSES, TDR_DRIVERS, validate, issueTitle, labelsOf, issueBody, requestOf, factsHash, prepare, apply, verify, commitsOf, mergedOnDefault };

if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2), cmd = a[0];
    const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
    try {
      if (cmd === 'render') { const req = JSON.parse(read(a[1])); const e = validate(req); if (e.length) { console.error(e.join('\n')); process.exit(1); }
        const auto = String(opt('--auto') || '').split(/[\s,]+/).filter(Boolean);
        console.log(JSON.stringify({ title: issueTitle(req), labels: labelsOf(req, auto), body: issueBody(req, auto) }, null, 2)); return; }
      const root = path.resolve(a[1] || '.');
      if (cmd === 'prepare') {
        const issue = opt('--from') ? JSON.parse(read(opt('--from'))) : await escalate.fetchIssue(root, a[2], { host: opt('--host') });
        const r = prepare(root, issue, { force: a.includes('--force'), auto: a.includes('--auto') });
        if (a.includes('--json')) console.log(JSON.stringify(r, null, 1));
        else console.log(r.ok ? `TIER 0: ${r.kind} → ${r.id || r.file}${r.id && r.file ? ` (${r.file})` : ''}${r.arrow ? ` · ${r.arrow}` : ''}${r.auto ? ' · keyed by a trusted agent' : ''} · payload ${r.payload_file}` : `TIER 0 refused${r.kind ? ` (${r.kind})` : ''}:\n${r.reasons.map((x) => `- ${x}`).join('\n')}`);
        process.exit(r.ok ? 0 : 1);
      }
      if (cmd === 'apply') { const r = apply(root, JSON.parse(read(a[2]))); console.log(`doc-fix applied: ${r.file}:${r.line}`); return; }
      if (cmd === 'verify') { const r = verify(root, JSON.parse(read(a[2])));
        console.log(r.ok ? `TIER 0 verified: ${r.changed.join(', ')}${r.notes.length ? `\n${r.notes.map((x) => `- ${x}`).join('\n')}` : ''}` : `TIER 0 write refused:\n${r.problems.map((x) => `- ${x}`).join('\n')}`); process.exit(r.ok ? 0 : 1); }
      console.error('Usage: bun tier0.js render <request.json> [--auto <kinds>] | prepare <project> <issue#|url>|--from <issue.json> [--auto] | apply|verify <project> <payload.json>'); process.exit(2);
    } catch (e) { console.error(`tier0.js: ${e.message}`); process.exit(2); }
  })();
}
