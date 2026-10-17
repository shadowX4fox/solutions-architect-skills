#!/usr/bin/env bun
// Escalations: what a RUN-team request becomes when it crosses an escalation trigger (support.js). The architecture is
// not touched; the request, the triggers with their evidence, the change the AI would have proposed and the questions
// for the architect go into one structured record, `escalations/ESC-NNN-<slug>.md` in the project repository, and from
// it into an issue on the project's git host — GitHub, GitLab, Gitea or Azure DevOps, read from `origin` — once the user
// has seen the issue and said yes. The architect resolves it with an ADR, a TDR or a release; `close` records which, and
// the release (`lifecycle.js plan`) lists the escalations closed since the last tag.
//
//   bun escalate.js new <project> --from <request.json>            write the record; prints its path and id
//   bun escalate.js issue <project> ESC-NNN [--host <h>] [--type <t>]   the issue it would open — title, labels, body, command
//   bun escalate.js issue <project> ESC-NNN --create               open it, and write its URL into the record
//   bun escalate.js status <project> ESC-NNN "In Review"
//   bun escalate.js close <project> ESC-NNN --by <ADR-NNN|TDR-NNN|architecture-vX.Y.Z> [--rejected "<reason>"]
//   bun escalate.js list <project> [--all] [--json]
//
// request.json: { title, request, triggers: [id], evidence: [{ trigger, where, note }], proposal: [line], questions: [line],
//   components: [canonical name], integrations: [I-nn], adrs: [ADR-NNN], tdrs: [TDR-NNN], requested_by, route: tier-1|tier-2 }
// Hosts: GitHub `gh`, GitLab `glab`, Azure DevOps `az boards` — logged in already; Gitea its REST API with GITEA_TOKEN.
// A self-hosted GitLab, Gitea or GitHub Enterprise is named with --host (or SA_GIT_HOST) when the URL does not say it.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TRIGGERS = {
  'new-integration': 'a new external integration',
  'data-classification': 'a data classification change',
  'cross-domain': 'cross-domain impact',
  'security-iam': 'a security or IAM change',
  'regulatory': 'regulatory or audit scope',
  'new-technology': 'a new technology or vendor',
  'low-confidence': 'low AI confidence',
};
const ROUTES = { 'tier-1': 'Tier 1 — SA office hours', 'tier-2': 'Tier 2 — design authority (CHANGE work)' };
const STATUSES = ['Open', 'In Review', 'Resolved', 'Rejected'];
const HOSTS = ['github', 'gitlab', 'gitea', 'azure'];
const DIR = 'escalations';

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'escalation';
const git = (root, args) => { const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x).trim()).filter(Boolean);
const yamlList = (v) => `[${list(v).join(', ')}]`;
const cell = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

// ---- the record ------------------------------------------------------------------------------------------------
const FIELDS = ['id', 'status', 'date', 'architecture', 'route', 'triggers', 'components', 'integrations', 'adrs', 'tdrs', 'requested_by', 'issue', 'resolution', 'closed'];
function parse(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (m) m[1].split('\n').forEach((l) => {
    const k = l.match(/^([a-z_]+):\s*(.*?)\s*(?:#.*)?$/); if (!k) return;
    const v = k[2];
    meta[k[1]] = /^\[.*\]$/.test(v) ? v.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean) : v;
  });
  const title = (text.match(/^# (.+)$/m) || [])[1] || '';
  return { meta, title, body: m ? text.slice(m[0].length) : text };
}
function frontmatter(meta) {
  return '---\n' + FIELDS.map((k) => `${k}: ${Array.isArray(meta[k]) ? yamlList(meta[k]) : meta[k] == null ? '' : meta[k]}`.replace(/\s+$/, '')).join('\n') + '\n---\n';
}
function records(root) {
  const d = path.join(path.resolve(root), DIR);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => /^ESC-\d{3,}.*\.md$/.test(f)).sort().map((f) => Object.assign(parse(read(path.join(d, f))), { file: path.join(DIR, f) }));
}
const find = (root, id) => { const r = records(root).find((x) => x.meta.id === String(id).toUpperCase()); if (!r) throw new Error(`${id}: no record under ${DIR}/`); return r; };
const nextId = (root) => `ESC-${String(records(root).reduce((m, r) => Math.max(m, Number(String(r.meta.id).slice(4)) || 0), 0) + 1).padStart(3, '0')}`;

function validate(req) {
  const errors = [];
  if (!req.title) errors.push('title is required');
  if (!req.request) errors.push('request (the RUN team\'s words, verbatim) is required');
  const t = list(req.triggers);
  if (!t.length) errors.push('at least one trigger is required');
  t.filter((x) => !TRIGGERS[x]).forEach((x) => errors.push(`unknown trigger "${x}" — one of ${Object.keys(TRIGGERS).join(', ')}`));
  (req.evidence || []).filter((e) => e.trigger && !t.includes(e.trigger)).forEach((e) => errors.push(`evidence for "${e.trigger}", which is not among the triggers`));
  t.filter((x) => x !== 'low-confidence' && !(req.evidence || []).some((e) => e.trigger === x)).forEach((x) => errors.push(`trigger "${x}" has no evidence — a file and line, or the request's own words`));
  if (req.route && !ROUTES[req.route]) errors.push(`route must be ${Object.keys(ROUTES).join(' or ')}`);
  return errors;
}
// canonical names, when the facts ledger is there (sa-skills writes it); a name it does not know is a warning
function nameWarnings(root, req) {
  const f = path.join(path.resolve(root), '.cache', 'sa-skills', 'facts.json');
  let facts; try { facts = JSON.parse(read(f)); } catch (e) { return []; }
  const names = new Set((facts.components || []).map((c) => c.name));
  return list(req.components).filter((c) => !names.has(c)).map((c) => `component "${c}" is not a canonical name in the facts ledger`);
}

function render(meta, req) {
  const w = [];
  w.push(`# ${meta.id} — ${req.title}`, '', '## Request', '', String(req.request).trim(), '');
  w.push('## Why it needs an architect', '', '| Trigger | Evidence |', '|---|---|');
  list(req.triggers).forEach((t) => {
    const ev = (req.evidence || []).filter((e) => e.trigger === t);
    if (!ev.length) w.push(`| ${t} | ${cell(TRIGGERS[t])} |`);
    ev.forEach((e) => w.push(`| ${t} | ${cell([e.where, e.note].filter(Boolean).join(' — '))} |`));
  });
  w.push('', `**Route**: ${ROUTES[meta.route]}.`, '');
  w.push('## What the AI would propose (not applied)', '', ...(list(req.proposal).length ? list(req.proposal).map((l) => `- ${l}`) : ['- Nothing proposed.']), '');
  w.push('## Open questions for the architect', '', ...(list(req.questions).length ? list(req.questions).map((l) => `- ${l}`) : ['- None.']), '');
  w.push('## Resolution', '', '- Pending.', '');
  return w.join('\n');
}

function create(root, req, opts = {}) {
  root = path.resolve(root);
  const errors = validate(req);
  if (errors.length) { const e = new Error(errors.join('\n')); e.errors = errors; throw e; }
  const id = nextId(root);
  const tag = (git(root, ['tag', '-l', 'architecture-v*', '--sort=-v:refname']) || '').split('\n').filter(Boolean)[0] || '';
  const meta = { id, status: 'Open', date: opts.today || today(), architecture: tag, route: req.route || 'tier-1', triggers: list(req.triggers),
    components: list(req.components), integrations: list(req.integrations), adrs: list(req.adrs), tdrs: list(req.tdrs), requested_by: req.requested_by || '', issue: '', resolution: '', closed: '' };
  const file = path.join(DIR, `${id}-${slugify(req.title)}.md`);
  fs.mkdirSync(path.join(root, DIR), { recursive: true });
  fs.writeFileSync(path.join(root, file), frontmatter(meta) + render(meta, req));
  return { id, file, warnings: nameWarnings(root, req) };
}

function update(root, id, change, resolutionLine) {
  const r = find(root, id), f = path.join(path.resolve(root), r.file);
  const meta = Object.assign({}, r.meta, change);
  let body = r.body;
  if (resolutionLine) body = body.replace(/## Resolution\n\n[\s\S]*$/, `## Resolution\n\n- ${resolutionLine}\n`);
  fs.writeFileSync(f, frontmatter(meta) + body);
  return Object.assign({}, r, { meta });
}
function setStatus(root, id, status) {
  const s = STATUSES.find((x) => x.toLowerCase() === String(status).toLowerCase());
  if (!s || s === 'Resolved' || s === 'Rejected') throw new Error(`status must be Open or In Review — Resolved and Rejected go through close`);
  return update(root, id, { status: s });
}
function close(root, id, opts = {}) {
  const by = String(opts.by || '').trim();
  if (opts.rejected == null && !/^(ADR-\d{3}|TDR-\d{3}|architecture-v\d+\.\d+\.\d+)$/.test(by)) throw new Error('--by must name what resolved it: ADR-NNN, TDR-NNN or architecture-vX.Y.Z');
  const date = opts.today || today();
  if (opts.rejected != null) return update(root, id, { status: 'Rejected', resolution: by, closed: date }, `Rejected ${date}${by ? ` (${by})` : ''}: ${opts.rejected || 'no reason given'}.`);
  return update(root, id, { status: 'Resolved', resolution: by, closed: date }, `Resolved ${date} by ${by}.`);
}
const open = (root) => records(root).filter((r) => r.meta.status === 'Open' || r.meta.status === 'In Review');
// closed after a date (the previous release's), for the release entry
const closedSince = (root, date) => records(root).filter((r) => (r.meta.status === 'Resolved' || r.meta.status === 'Rejected') && r.meta.closed && (!date || r.meta.closed > date));

// ---- the git host ----------------------------------------------------------------------------------------------
function parseRemote(url) {
  url = String(url || '').trim();
  let m;
  if ((m = url.match(/^git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/))) return { host: 'azure', server: 'dev.azure.com', org: m[1], project: decodeURIComponent(m[2]), repo: m[3] };
  if ((m = url.match(/^https?:\/\/(?:[^@/]+@)?dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/]+?)(?:\.git)?$/))) return { host: 'azure', server: 'dev.azure.com', org: m[1], project: decodeURIComponent(m[2]), repo: m[3] };
  if ((m = url.match(/^https?:\/\/(?:[^@/]+@)?([^./]+)\.visualstudio\.com\/(?:DefaultCollection\/)?([^/]+)\/_git\/([^/]+?)(?:\.git)?$/))) return { host: 'azure', server: 'dev.azure.com', org: m[1], project: decodeURIComponent(m[2]), repo: m[3] };
  if ((m = url.match(/^(?:ssh:\/\/)?[^@/]+@([^:/]+)(?::\d+)?[:/](.+?)(?:\.git)?\/?$/)) || (m = url.match(/^https?:\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/))) {
    const server = m[1].replace(/:\d+$/, ''), full = m[2], parts = full.split('/');
    const host = server === 'github.com' ? 'github' : /gitlab/i.test(server) ? 'gitlab' : /gitea|forgejo|codeberg/i.test(server) ? 'gitea' : null;
    return { host, server, owner: parts.slice(0, -1).join('/'), repo: parts[parts.length - 1], path: full, web: `https://${server}/${full}` };
  }
  return null;
}
function remoteOf(root, hostOverride) {
  const url = git(path.resolve(root), ['remote', 'get-url', 'origin']);
  if (!url) throw new Error('no origin remote — the record stays in the repository; open the issue by hand');
  const r = parseRemote(url);
  if (!r) throw new Error(`origin "${url}" is not a URL this script reads`);
  const h = hostOverride || process.env.SA_GIT_HOST;
  if (h) { if (!HOSTS.includes(h)) throw new Error(`--host must be one of ${HOSTS.join(', ')}`); r.host = h; }
  if (!r.host) throw new Error(`cannot tell which host ${r.server} runs — pass --host ${HOSTS.join('|')}`);
  return Object.assign(r, { url });
}
const labelsOf = (rec) => ['architecture-escalation', rec.meta.route, ...list(rec.meta.triggers).map((t) => `trigger:${t}`)];
const issueTitle = (rec) => `[${rec.meta.id}] ${rec.title.replace(/^ESC-\d+\s+—\s+/, '')}`;
function issueBody(rec) {
  const facts = [['Architecture', rec.meta.architecture || '—'], ['Route', ROUTES[rec.meta.route] || rec.meta.route], ['Requested by', rec.meta.requested_by || '—'],
    ['Components', list(rec.meta.components).join(', ') || '—'], ['Integrations', list(rec.meta.integrations).join(', ') || '—'], ['ADRs / TDRs', [...list(rec.meta.adrs), ...list(rec.meta.tdrs)].join(', ') || '—'],
    ['Record', rec.file]];
  const body = rec.body.replace(/^# .*\n+/, '').replace(/\n## Resolution\n[\s\S]*$/, '\n');
  return ['| | |', '|---|---|', ...facts.map(([k, v]) => `| ${k} | ${cell(v)} |`), '', body.trim(), '', `_Close it with \`escalate.js close <project> ${rec.meta.id} --by <ADR-NNN|TDR-NNN|architecture-vX.Y.Z>\`._`, ''].join('\n');
}
const htmlOf = (md) => `<pre>${md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;

// what `issue` would run — one plan per host, the body in a file beside the cache
function issuePlan(root, id, opts = {}) {
  root = path.resolve(root);
  const rec = find(root, id), r = remoteOf(root, opts.host), title = issueTitle(rec), labels = labelsOf(rec), body = issueBody(rec);
  const bodyFile = path.join(root, '.cache', 'sa-skills', 'escalations', `${rec.meta.id}.issue.md`);
  const p = { id: rec.meta.id, host: r.host, remote: r.url, title, labels, body, body_file: path.relative(root, bodyFile), already: rec.meta.issue || null };
  if (r.host === 'github') p.argv = ['gh', 'issue', 'create', '-R', `${r.server === 'github.com' ? '' : r.server + '/'}${r.path}`, '--title', title, '--body-file', bodyFile, ...labels.flatMap((l) => ['--label', l])];
  if (r.host === 'gitlab') p.argv = ['glab', 'issue', 'create', '-R', r.web, '--title', title, '--description-file', bodyFile, '--label', labels.join(','), '--yes'];
  if (r.host === 'azure') p.argv = ['az', 'boards', 'work-item', 'create', '--org', `https://dev.azure.com/${r.org}`, '--project', r.project, '--type', opts.type || 'Issue', '--title', title,
    '--description', '<the body, as HTML>', '--fields', `System.Tags=${labels.join('; ')}`, '--output', 'json'];
  if (r.host === 'gitea') p.request = { method: 'POST', url: `https://${r.server}/api/v1/repos/${r.path}/issues`, token: 'GITEA_TOKEN', labels: 'matched by name against the repository\'s labels; a missing one is skipped' };
  return Object.assign(p, { _rec: rec, _remote: r, _bodyFile: bodyFile });
}
const run = (argv) => spawnSync(argv[0], argv.slice(1), { encoding: 'utf8' });
async function createIssue(root, id, opts = {}) {
  const p = issuePlan(root, id, opts);
  if (p.already && !opts.again) throw new Error(`${p.id} already has an issue: ${p.already}`);
  fs.mkdirSync(path.dirname(p._bodyFile), { recursive: true });
  fs.writeFileSync(p._bodyFile, p.body);
  let url = null, note = null;
  if (p.host === 'github' || p.host === 'gitlab') {
    let r = run(p.argv);
    if (r.status !== 0 && /label/i.test(r.stderr || '')) {   // labels the repository does not have: open it without them
      r = run(p.argv.filter((x, i, a) => x !== '--label' && a[i - 1] !== '--label')); note = 'opened without labels — the repository does not have them';
    }
    if (r.status !== 0) throw new Error(`${p.argv[0]}: ${(r.stderr || r.stdout || '').trim() || 'failed'}${r.error ? ` (${r.error.code === 'ENOENT' ? `${p.argv[0]} is not installed` : r.error.message})` : ''}`);
    url = (r.stdout.match(/https?:\/\/\S+/) || [])[0] || r.stdout.trim();
  } else if (p.host === 'azure') {
    const argv = p.argv.map((x) => (x === '<the body, as HTML>' ? htmlOf(p.body) : x));
    const r = run(argv);
    if (r.status !== 0) throw new Error(`az: ${(r.stderr || '').trim() || (r.error && r.error.code === 'ENOENT' ? 'az is not installed' : 'failed')}`);
    const j = JSON.parse(r.stdout); url = (j._links && j._links.html && j._links.html.href) || `https://dev.azure.com/${p._remote.org}/${encodeURIComponent(p._remote.project)}/_workitems/edit/${j.id}`;
  } else {
    const token = process.env.GITEA_TOKEN;
    if (!token) throw new Error('GITEA_TOKEN is not set — create a token with issue write access and export it in the shell profile');
    const base = `https://${p._remote.server}/api/v1/repos/${p._remote.path}`, H = { Authorization: `token ${token}`, 'Content-Type': 'application/json' };
    let ids = [];
    try { const ls = await (await fetch(`${base}/labels?limit=200`, { headers: H })).json(); ids = p.labels.map((l) => (ls.find((x) => x.name === l) || {}).id).filter(Boolean); } catch (e) { /* labels are optional */ }
    if (ids.length < p.labels.length) note = `${p.labels.length - ids.length} label(s) skipped — the repository does not have them`;
    const res = await fetch(`${base}/issues`, { method: 'POST', headers: H, body: JSON.stringify({ title: p.title, body: p.body, labels: ids }) });
    if (!res.ok) throw new Error(`gitea: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    url = (await res.json()).html_url;
  }
  update(root, p.id, { issue: url });
  return { id: p.id, host: p.host, url, note };
}

module.exports = { TRIGGERS, ROUTES, STATUSES, HOSTS, DIR, parse, records, nextId, validate, create, setStatus, close, open, closedSince, parseRemote, remoteOf, labelsOf, issueTitle, issueBody, issuePlan, createIssue };

// ---- CLI ---------------------------------------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2), cmd = a[0], root = a[1] || process.cwd();
    const opt = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
    const pos = a.slice(2).filter((x, i, arr) => !x.startsWith('--') && !(arr[i - 1] || '').startsWith('--'));
    try {
      if (cmd === 'new') {
        const from = opt('--from'); if (!from) throw new Error('--from <request.json> is required');
        const r = create(root, JSON.parse(read(from)));
        console.log(`${r.id} written: ${r.file}`); r.warnings.forEach((w) => console.error('⚠ ' + w));
        console.log(`next: show the issue (escalate.js issue ${root} ${r.id}) and ask before opening it (--create)`);
      } else if (cmd === 'issue') {
        if (a.includes('--create')) { const r = await createIssue(root, pos[0], { host: opt('--host'), type: opt('--type'), again: a.includes('--again') }); console.log(`${r.id} → ${r.url}`); if (r.note) console.error('⚠ ' + r.note); }
        else {
          const p = issuePlan(root, pos[0], { host: opt('--host'), type: opt('--type') });
          if (a.includes('--json')) { const { _rec, _remote, _bodyFile, ...out } = p; console.log(JSON.stringify(out, null, 2)); return; }
          console.log(`ISSUE PREVIEW — ${p.id} on ${p.host} (${p.remote})${p.already ? `\n⚠ already opened: ${p.already}` : ''}`);
          console.log(`title:  ${p.title}\nlabels: ${p.labels.join(', ')}\n\n${p.body}`);
          console.log(p.argv ? `command: ${p.argv.map((x) => (/\s/.test(x) ? JSON.stringify(x) : x)).join(' ')}` : `request: ${p.request.method} ${p.request.url} (token ${p.request.token})`);
          console.log(`nothing was opened — after the user's yes: escalate.js issue ${root} ${p.id} --create`);
        }
      } else if (cmd === 'status') { const r = setStatus(root, pos[0], pos[1]); console.log(`${r.meta.id}: ${r.meta.status}`); }
      else if (cmd === 'close') { const r = close(root, pos[0], { by: opt('--by'), rejected: a.includes('--rejected') ? (opt('--rejected') || '') : undefined }); console.log(`${r.meta.id}: ${r.meta.status}${r.meta.resolution ? ` by ${r.meta.resolution}` : ''}${r.meta.issue ? ` — close the issue too: ${r.meta.issue}` : ''}`); }
      else if (cmd === 'list') {
        const rs = a.includes('--all') ? records(root) : open(root);
        if (a.includes('--json')) { console.log(JSON.stringify(rs.map((r) => Object.assign({ title: r.title, file: r.file }, r.meta)), null, 2)); return; }
        if (!rs.length) { console.log(a.includes('--all') ? 'no escalations' : 'no open escalations'); return; }
        rs.forEach((r) => console.log(`${r.meta.id}  ${String(r.meta.status).padEnd(9)} ${String(r.meta.route).padEnd(6)} ${r.meta.date}  ${list(r.meta.triggers).join(',')}  ${r.title.replace(/^ESC-\d+\s+—\s+/, '')}${r.meta.issue ? `  ${r.meta.issue}` : ''}`));
      } else { console.error('usage: escalate.js new|issue|status|close|list <project> …'); process.exit(2); }
    } catch (e) { console.error(e.message); process.exit(1); }
  })();
}
