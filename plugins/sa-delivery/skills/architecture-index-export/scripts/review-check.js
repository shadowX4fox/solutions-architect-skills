#!/usr/bin/env bun
// review-check.js — a service pull request held to its build pack (10.16.0): the code half of architecture-review.yml, and
// the verdict over the judgement half. An attended service is built by a person in an IDE; this is what holds the pull
// request to BUILD.md's rules whoever wrote it.
//
//   bun review-check.js <service_dir> --base <git-ref> [--findings <claude.json>] [--body-file <pr-body.md>]
//                       [--architecture <owner/repo>] [--server <mcp_url>] [--out <review.md>] [--json]
//
// By code (no model), each against the pack the server serves for .architecture.json's version:
//   binding-missing   BLOCKING  .architecture.json lacks server, project, component, architecture_version or pack_revision
//   pack-unreadable   BLOCKING  the server does not answer get_build_pack — the check fails closed
//   asset-missing     BLOCKING  an asset of the pack is not at architecture/<file>          (rule 1)
//   asset-modified    BLOCKING  architecture/<file> differs from the pack's bytes (sha256)    (rule 1)
//   assets-mixed      BLOCKING  a commit changes architecture/ and other files together       (the update is committed alone)
//   asset-unknown     WARNING   a file under architecture/ that the pack does not carry
//   commit-unstamped  WARNING   a commit names neither the version nor the pack_revision       (rule 8)
//   binding-behind    WARNING   a newer version is released than the one bound
//   pack-revised      WARNING   the bound version's pack has another revision than the one recorded
//   todo-added        NOTE      a TODO(architecture) the pull request adds to code or configuration — a question for the
//                               architect (rule 3); a document that mentions the convention is not one
// The judgement half — Claude's review (architecture-review.yml) — writes --findings:
//   { "reviewed": true, "findings": [ { "rule": 1-10, "severity": "blocking"|"warning", "file", "line", "part", "part_line",
//     "finding", "escalation": "owner/repo#N" | null } ] }
// and code decides what stands: a blocking finding must cite a part the pack carries (else it is a warning — a block the pack
// cannot back is not a block); it is cleared only by the escalation the review ties to it, when the pull request body cites
// that issue (owner/repo#N or its URL) and it is an open [ESC-…] issue of the architecture repository (verified with gh) —
// then it stays as a warning naming it. No findings file, or one that is
// not { reviewed: true }, is a blocking review-missing: the required check fails closed. A code finding is never cleared by
// an escalation — the contract copies are the architecture's, whatever is being asked about them.
// Exit 1 on a blocking finding, 0 otherwise.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const MARKER = '<!-- sa-architecture-review -->';
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const readJson = (f) => { try { return JSON.parse(read(f)); } catch (e) { return null; } };
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const git = (dir, ...a) => { const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); if (r.status !== 0) throw new Error(`git ${a[0]}: ${(r.stderr || '').trim()}`); return r.stdout; };

// ---- the pack, from the architecture MCP server (streamable HTTP) ----------------------------------------------------
async function mcpCall(url, tool, args, token) {
  let sid = '', id = 0;
  const rpc = async (method, params, notify) => {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream',
      ...(sid ? { 'mcp-session-id': sid } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, ...(notify ? {} : { id: ++id }) }) });
    sid = r.headers.get('mcp-session-id') || sid;
    if (!r.ok && r.status !== 202) throw new Error(`${method}: HTTP ${r.status}`);
    const t = await r.text();
    const d = t.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).join('') || t;
    return d ? JSON.parse(d) : null;
  };
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'sa-review-check', version: '1' } });
  await rpc('notifications/initialized', {}, true);
  const res = await rpc('tools/call', { name: tool, arguments: args });
  if (!res || res.error) throw new Error(`${tool}: ${res && res.error ? res.error.message : 'no answer'}`);
  const text = (res.result.content || []).map((c) => c.text || '').join('');
  if (res.result.isError) throw new Error(`${tool}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

// ---- escalations the pull request cites ---------------------------------------------------------------------------------
// owner/repo#N or an issue URL — only the architecture repository's count; a bare #N is this repository's own issue
function refsIn(text, arch) {
  const out = new Set(), t = String(text || '');
  for (const m of t.matchAll(/https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)/g)) if (!arch || m[1].toLowerCase() === arch.toLowerCase()) out.add(`${m[1]}#${m[2]}`);
  for (const m of t.matchAll(/(?<![\w/])([\w.-]+\/[\w.-]+)#(\d+)\b/g)) if (!arch || m[1].toLowerCase() === arch.toLowerCase()) out.add(`${m[1]}#${m[2]}`);
  return [...out];
}
const ghDefault = (args) => spawnSync('gh', args, { encoding: 'utf8' });
function escalationOf(gh, ref) {
  const [repo, n] = ref.split('#');
  const r = gh(['api', `repos/${repo}/issues/${n}`]);
  if (r.status !== 0) return { ref, ok: false, why: 'not found' };
  let i; try { i = JSON.parse(r.stdout); } catch (e) { return { ref, ok: false, why: 'unreadable' }; }
  if (!/^\[ESC-/.test(i.title || '')) return { ref, ok: false, why: 'not an escalation ([ESC-…] title)' };
  if (i.state !== 'open') return { ref, ok: false, why: 'closed — the release that answered it is the one to build' };
  return { ref, ok: true, title: i.title, url: i.html_url };
}

async function check(dir, opts = {}) {
  dir = path.resolve(dir);
  const findings = [], add = (severity, code, text, where) => findings.push({ severity, code, text, ...(where ? { where } : {}) });
  const b = readJson(path.join(dir, '.architecture.json')) || {};
  const server = opts.server || process.env.SA_INDEX_MCP_URL || b.server;
  const missing = ['project', 'component', 'architecture_version', 'pack_revision'].filter((k) => !b[k]).concat(server ? [] : ['server']);
  if (missing.length) add('blocking', 'binding-missing', `.architecture.json has no ${missing.join(', ')} — the pull request cannot be held to a pack`, '.architecture.json');
  let pack = null, latest = null;
  if (!missing.length) {
    try {
      pack = await (opts.pack || ((a) => mcpCall(server, 'get_build_pack', a, process.env.SA_INDEX_TOKEN)))({ project: b.project, component: b.component, version: b.architecture_version });
      latest = await (opts.pack || ((a) => mcpCall(server, 'get_build_pack', a, process.env.SA_INDEX_TOKEN)))({ project: b.project, component: b.component });
    } catch (e) { add('blocking', 'pack-unreadable', `${server} does not serve the pack of ${b.component} ${b.architecture_version} (${e.message})`); }
  }
  if (pack) {
    if (pack.pack_revision && pack.pack_revision !== b.pack_revision) add('warning', 'pack-revised', `the ${b.architecture_version} pack is at revision ${pack.pack_revision.slice(0, 12)}, the binding records ${String(b.pack_revision).slice(0, 12)} — what_changed with from_revision`, '.architecture.json');
    if (latest && latest.architecture_version && latest.architecture_version !== b.architecture_version) add('warning', 'binding-behind', `architecture ${latest.architecture_version} is released; this repository is bound to ${b.architecture_version} — what_changed, then rebind`, '.architecture.json');
    const assets = (pack.parts || []).filter((p) => p.kind === 'asset');
    const names = new Set(assets.map((p) => p.title));
    for (const p of assets) {
      const f = path.join(dir, 'architecture', p.title);
      if (!fs.existsSync(f)) { add('blocking', 'asset-missing', `the pack's ${p.title} is not at architecture/${p.title} (rule 1: kept byte for byte)`, `architecture/${p.title}`); continue; }
      if (sha256(fs.readFileSync(f)) !== p.sha256) add('blocking', 'asset-modified', `architecture/${p.title} differs from the pack's bytes (rule 1: a contract change is the architecture's — escalate it, never edit the copy)`, `architecture/${p.title}`);
    }
    const adir = path.join(dir, 'architecture');
    if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (!names.has(f)) add('warning', 'asset-unknown', `architecture/${f} is not an asset of the ${b.architecture_version} pack`, `architecture/${f}`);
  }
  // the commits the pull request adds
  if (opts.base) {
    let shas = [];
    try { shas = git(dir, 'rev-list', '--no-merges', `${opts.base}..HEAD`).split('\n').filter(Boolean); } catch (e) { add('warning', 'commits-unread', e.message); }
    const rev = String(b.pack_revision || ''), ver = String(b.architecture_version || '');
    for (const s of shas) {
      const files = git(dir, 'show', '--name-only', '--format=', s).split('\n').filter(Boolean), msg = git(dir, 'show', '-s', '--format=%B', s);
      // the repository's CI (.github/) implements nothing of the pack: it neither mixes with the contracts nor needs the stamp
      const arch = files.filter((f) => f.startsWith('architecture/')), other = files.filter((f) => !f.startsWith('architecture/') && f !== '.architecture.json' && !f.startsWith('.github/'));
      const head = `${s.slice(0, 7)} "${msg.split('\n')[0].slice(0, 70)}"`;
      if (arch.length && other.length) add('blocking', 'assets-mixed', `${head} changes ${arch.join(', ')} together with ${other.length} other file(s) — the contracts are committed alone, so the diff shows what the contract changed`, s.slice(0, 7));
      if (other.length && ver && !(msg.includes(ver) && rev && msg.includes(rev.slice(0, 8)))) add('warning', 'commit-unstamped', `${head} names ${msg.includes(ver) ? 'no pack_revision' : `neither architecture ${ver} nor the pack_revision`} (rule 8)`, s.slice(0, 7));
    }
    try {
      const diff = git(dir, 'diff', '-U0', `${opts.base}...HEAD`);
      let file = '';
      for (const l of diff.split('\n')) {
        if (l.startsWith('+++ b/')) file = l.slice(6);
        // a marker in code or configuration; a document that mentions the convention (.md) is prose, and CI is not the service
        else if (l.startsWith('+') && !l.startsWith('+++') && !file.startsWith('.github/') && !/\.(md|mdx|rst|txt)$/i.test(file) && /TODO\(architecture\)/.test(l)) add('note', 'todo-added', l.slice(1).trim().slice(0, 160), file);
      }
    } catch (e) { /* no diff, no notes */ }
  }
  // the judgement half: Claude's findings, decided by code
  const arch = opts.architecture || process.env.SA_ARCHITECTURE_REPO || '';
  const gh = opts.gh || ghDefault, body = opts.body || '';
  const parts = new Set(((pack && pack.parts) || []).map((p) => p.id));
  const J = opts.findings === undefined ? null : opts.findings;
  if (!J || J.reviewed !== true || !Array.isArray(J.findings)) add('blocking', 'review-missing', 'the architecture review (Claude, against the pack) wrote no findings — the check fails closed; re-run it');
  else {
    const cache = new Map(), esc = (ref) => { if (!cache.has(ref)) cache.set(ref, escalationOf(gh, ref)); return cache.get(ref); };
    const declared = new Set(refsIn(body, arch).map((x) => x.toLowerCase()));
    for (const f of J.findings) {
      const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : undefined, cite = f.part ? `${f.part}${f.part_line ? `:${f.part_line}` : ''}` : null;
      const text = `rule ${f.rule || '?'} — ${String(f.finding || '').trim()}${cite ? ` (pack: ${cite})` : ''}`;
      if (String(f.severity) !== 'blocking') { add('warning', 'review', text, where); continue; }
      if (!f.part || (parts.size && !parts.has(f.part))) { add('warning', 'review-uncited', `${text} — cites no part of the pack, so it does not block`, where); continue; }
      // cleared only by the escalation the review ties to this finding, which the pull request itself cites
      const own = refsIn(f.escalation || '', arch).map((ref) => (declared.has(ref.toLowerCase()) ? esc(ref) : { ref, ok: false, why: 'not cited in the pull request' }));
      const cover = own.find((e) => e.ok);
      if (cover) add('warning', 'review-escalated', `${text} — covered by ${cover.ref} (${cover.title}): the architect answers it`, where);
      else add('blocking', 'review', `${text}${own.length ? ` — ${own.map((e) => `${e.ref} ${e.why}`).join('; ')}` : ''}`, where);
    }
  }
  const blocking = findings.filter((f) => f.severity === 'blocking').length, order = { blocking: 0, warning: 1, note: 2 };
  findings.sort((x, y) => order[x.severity] - order[y.severity]);
  return { status: blocking ? 'FAIL' : 'PASS', binding: { project: b.project, component: b.component, version: b.architecture_version, pack_revision: b.pack_revision }, findings };
}

function render(r) {
  const sev = { blocking: '⛔ blocking', warning: '⚠ warning', note: 'ℹ note' };
  const rows = r.findings.map((f) => `| ${sev[f.severity]} | \`${f.code}\` | ${f.where ? `\`${f.where}\`` : '—'} | ${String(f.text).replace(/\|/g, '\\|')} |`);
  const n = (s) => r.findings.filter((f) => f.severity === s).length;
  return [MARKER, `### Architecture review — ${r.status === 'PASS' ? '✅ PASS' : '⛔ FAIL'}`, '',
    `Held to **${r.binding.component || '?'}** at architecture **${r.binding.version || '?'}** (pack_revision \`${String(r.binding.pack_revision || '?').slice(0, 12)}\`): ${n('blocking')} blocking · ${n('warning')} warning · ${n('note')} note.`, '',
    ...(rows.length ? ['| | Check | Where | Finding |', '|---|---|---|---|', ...rows] : ['Nothing to report: the pull request keeps the pack.']), '',
    r.status === 'PASS' ? '' : 'A blocking finding is cleared by fixing the code, or — a real departure from the architecture — by an open `[ESC-…]` issue in the architecture repository, filed from the IDE with `preview_escalation` and cited in this pull request. A contract copy under `architecture/` is never edited here.'].join('\n');
}

module.exports = { check, render, refsIn, MARKER };

if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2), opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
    const dir = a[0] && !a[0].startsWith('--') ? a[0] : '.';
    const fj = opt('--findings');
    const r = await check(dir, { base: opt('--base'), architecture: opt('--architecture'), server: opt('--server'),
      findings: fj ? (readJson(fj) || { reviewed: false }) : undefined, body: opt('--body-file') ? read(opt('--body-file')) : '' });
    const md = render(r);
    if (opt('--out')) fs.writeFileSync(opt('--out'), md + '\n');
    console.log(a.includes('--json') ? JSON.stringify(r, null, 1) : md);
    process.exit(r.status === 'FAIL' ? 1 : 0);
  })().catch((e) => { console.error(`review-check: ${e.message}`); process.exit(2); });
}
