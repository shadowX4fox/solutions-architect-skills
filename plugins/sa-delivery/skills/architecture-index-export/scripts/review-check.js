#!/usr/bin/env bun
// review-check.js — a service pull request held to its build pack (10.16.0): the code half of architecture-review.yml, and
// the verdict over the judgement half. An attended service is built by a person in an IDE; this is what holds the pull
// request to BUILD.md's rules whoever wrote it.
//
//   bun review-check.js <service_dir> --base <git-ref> [--findings <claude.json>] [--body-file <pr-body.md>]
//                       [--architecture <owner/repo>] [--server <mcp_url>] [--out <review.md>] [--status-out <status.txt>]
//                       [--lang en|es] [--run-url <url>] [--json]
//   bun review-check.js --recheck <owner/repo> [--lang en|es] [--run-url <url>] [--author <login>] [--dry-run] [--json]
//
// By code (no model), each against the pack the server serves for .architecture.json's version:
//   binding-missing   BLOCKING  .architecture.json lacks server, project, component, architecture_version or pack_revision
//   pack-unreadable   BLOCKING  the server does not answer get_build_pack — the check fails closed
//   asset-missing     BLOCKING  an asset of the pack is not at architecture/<file>, or a dependency contract is not at
//                               architecture/deps/<provider>/<file> (rule 1; dependencies 11.1.0)
//   asset-modified    BLOCKING  that copy differs from the pack's bytes (sha256)              (rule 1)
//   assets-mixed      BLOCKING  a commit changes architecture/ and other files together       (the update is committed alone)
//   asset-outside     BLOCKING  a contract copy outside architecture/ — a tracked file whose bytes equal a pack asset, or a
//                               file the pull request changes that was a byte copy of a contract at the base (rule 1: the
//                               copies live in architecture/ only, and code is generated from there) (11.0.0)
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
// then it stays as a warning naming it, and the verdict is HELD (10.19.0): nothing blocks, but the pull request waits for the
// architect — the commit status is pending, so a required check keeps the merge closed until the escalation is answered.
// No findings file, or one that is
// not { reviewed: true }, is a blocking review-missing: the required check fails closed. A code finding is never cleared by
// an escalation — the contract copies are the architecture's, whatever is being asked about them.
// The review speaks the architecture's language (10.17.0): --lang, else SA_DOC_LANGUAGE (the service repository's variable,
// set by ci-setup.js --settings), else English; --status-out writes the commit status's one-line description.
// Exit 1 on a blocking finding (FAIL), 3 when only open escalations clear the blocking findings (HELD), 0 otherwise (PASS).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const MARKER = '<!-- sa-architecture-review -->';
// who writes the review comment: architecture-review.yml posts it with the job's GITHUB_TOKEN (--author for another identity)
const REVIEW_BOT = 'github-actions[bot]';
const ESCALATIONS = '<!-- sa-review-escalations: ';
// Alia's codec heads the review (11.3.0): ci-text.js's, from the sa-skills checkout the workflow clones — her face in the
// verdict's ring; without that file, the plain heading
let codec = null;
try { ({ codec } = require(path.join(__dirname, '..', '..', '..', '..', '..', 'scripts', 'shared', 'ci-text.js'))); } catch (e) { /* sa-delivery alone */ }
const MOOD = { PASS: 'pleased', FAIL: 'stern', HELD: 'worried' };
const heading = (status, title) => (codec ? codec(MOOD[status], title) : `### ${title}`);
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const readJson = (f) => { try { return JSON.parse(read(f)); } catch (e) { return null; } };
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const LANGS = ['en', 'es'];
const langOf = (l) => (LANGS.includes(String(l || '').toLowerCase()) ? String(l).toLowerCase() : 'en');
// one message in the review's language: { en, es }
const say = (lang, en, es) => (lang === 'es' ? es : en);
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
function escalationOf(gh, ref, lang = 'en') {
  const L = (en, es) => say(lang, en, es);
  const [repo, n] = ref.split('#');
  const r = gh(['api', `repos/${repo}/issues/${n}`]);
  if (r.status !== 0) return { ref, ok: false, why: L('not found', 'no existe') };
  let i; try { i = JSON.parse(r.stdout); } catch (e) { return { ref, ok: false, why: L('unreadable', 'ilegible') }; }
  // a transferred issue answers from its new repository: it is no longer the architecture's escalation
  const at = String(i.repository_url || '').split('/repos/')[1];
  if (at && at.toLowerCase() !== repo.toLowerCase()) return { ref, ok: false, why: L(`transferred to ${at}`, `transferida a ${at}`) };
  if (!/^\[ESC-/.test(i.title || '')) return { ref, ok: false, why: L('not an escalation ([ESC-…] title)', 'no es una escalación (título [ESC-…])') };
  // closed as not planned is the architect's no: the departure is refused, and the code is what changes (10.19.1)
  if (i.state !== 'open' && i.state_reason === 'not_planned') return { ref, ok: false, rejected: true, why: L('rejected — the departure is not accepted; fix the code', 'rechazada — la desviación no se acepta; corrija el código') };
  if (i.state !== 'open') return { ref, ok: false, why: L('closed — the release that answered it is the one to build', 'cerrada — la release que la respondió es la que se construye') };
  return { ref, ok: true, title: i.title, url: i.html_url };
}

async function check(dir, opts = {}) {
  dir = path.resolve(dir);
  const lang = langOf(opts.lang || process.env.SA_DOC_LANGUAGE), L = (en, es) => say(lang, en, es);
  const findings = [], add = (severity, code, text, where) => findings.push({ severity, code, text, ...(where ? { where } : {}) });
  const b = readJson(path.join(dir, '.architecture.json')) || {};
  const server = opts.server || process.env.SA_INDEX_MCP_URL || b.server;
  const missing = ['project', 'component', 'architecture_version', 'pack_revision'].filter((k) => !b[k]).concat(server ? [] : ['server']);
  if (missing.length) add('blocking', 'binding-missing', L(`.architecture.json has no ${missing.join(', ')} — the pull request cannot be held to a pack`, `.architecture.json no tiene ${missing.join(', ')}: el pull request no se puede contrastar con un pack`), '.architecture.json');
  let pack = null, latest = null;
  if (!missing.length) {
    try {
      pack = await (opts.pack || ((a) => mcpCall(server, 'get_build_pack', a, process.env.SA_INDEX_TOKEN)))({ project: b.project, component: b.component, version: b.architecture_version });
      latest = await (opts.pack || ((a) => mcpCall(server, 'get_build_pack', a, process.env.SA_INDEX_TOKEN)))({ project: b.project, component: b.component });
    } catch (e) { add('blocking', 'pack-unreadable', L(`${server} does not serve the pack of ${b.component} ${b.architecture_version} (${e.message})`, `${server} no sirve el pack de ${b.component} ${b.architecture_version} (${e.message})`)); }
  }
  if (pack) {
    if (pack.pack_revision && pack.pack_revision !== b.pack_revision) add('warning', 'pack-revised', L(`the ${b.architecture_version} pack is at revision ${pack.pack_revision.slice(0, 12)}, the binding records ${String(b.pack_revision).slice(0, 12)} — what_changed with from_revision`, `el pack de ${b.architecture_version} está en la revisión ${pack.pack_revision.slice(0, 12)}, el binding registra ${String(b.pack_revision).slice(0, 12)}: what_changed con from_revision`), '.architecture.json');
    if (latest && latest.architecture_version && latest.architecture_version !== b.architecture_version) add('warning', 'binding-behind', L(`architecture ${latest.architecture_version} is released; this repository is bound to ${b.architecture_version} — what_changed, then rebind`, `la arquitectura ${latest.architecture_version} está publicada; este repositorio está atado a ${b.architecture_version}: what_changed y luego rebind`), '.architecture.json');
    // its own contracts at architecture/<file>; the contracts of the components it depends on at architecture/deps/<provider>/<file>
    const assets = (pack.parts || []).filter((p) => p.kind === 'asset' || p.kind === 'dependency')
      .map((p) => ({ ...p, rel: p.kind === 'dependency' ? `deps/${p.id.replace(/^dependency:/, '')}` : p.title }));
    const names = new Set(assets.filter((p) => p.kind === 'asset').map((p) => p.title));
    for (const p of assets) {
      const f = path.join(dir, 'architecture', p.rel);
      if (!fs.existsSync(f)) { add('blocking', 'asset-missing', L(`the pack's ${p.title} is not at architecture/${p.rel} (rule 1: kept byte for byte)`, `el ${p.title} del pack no está en architecture/${p.rel} (regla 1: se conserva byte a byte)`), `architecture/${p.rel}`); continue; }
      if (sha256(fs.readFileSync(f)) !== p.sha256) add('blocking', 'asset-modified', L(`architecture/${p.rel} differs from the pack's bytes (rule 1: a contract change is the architecture's — escalate it, never edit the copy)`, `architecture/${p.rel} difiere de los bytes del pack (regla 1: un cambio de contrato es de la arquitectura; se escala, nunca se edita la copia)`), `architecture/${p.rel}`);
    }
    // a copy kept anywhere else escapes both checks above, so it is not allowed at all: rule 1 keeps the copies in architecture/
    const bySha = new Map(assets.map((p) => [p.sha256, p.rel]));
    const outside = (f) => !f.startsWith('architecture/') && f !== '.architecture.json';
    let tracked = [];
    try { tracked = git(dir, 'ls-files', '-z').split('\0').filter(Boolean).filter(outside); } catch (e) { /* not a repository: nothing tracked to compare */ }
    const flagged = new Set();
    for (const f of tracked) {
      const fp = path.join(dir, f);
      let st; try { st = fs.statSync(fp); } catch (e) { continue; }
      if (!st.isFile() || st.size > 16 * 1024 * 1024) continue;
      const t = bySha.get(sha256(fs.readFileSync(fp)));
      if (t) { flagged.add(f); add('blocking', 'asset-outside', L(`${f} is a copy of the pack's ${t} outside architecture/ — keep the one copy at architecture/${t} and generate from it (rule 1)`, `${f} es una copia del ${t} del pack fuera de architecture/: se conserva una sola copia en architecture/${t} y se genera desde ella (regla 1)`), f); }
    }
    // a file that was a byte copy of a contract at the base and that the pull request changes — a copy drifting away
    if (opts.base) {
      let changed = [];
      try { changed = git(dir, 'diff', '--name-only', `${opts.base}...HEAD`).split('\n').filter(Boolean).filter(outside); } catch (e) { /* no diff */ }
      const atBase = (f) => { const r = spawnSync('git', ['-C', dir, 'show', `${opts.base}:${f}`], { maxBuffer: 64 * 1024 * 1024 }); return r.status === 0 ? sha256(r.stdout) : null; };
      const baseCopies = new Map(assets.map((p) => [atBase(`architecture/${p.rel}`), p.rel]).filter(([h]) => h));
      for (const f of changed) {
        if (flagged.has(f)) continue;
        const h = atBase(f), t = h && (baseCopies.get(h) || bySha.get(h));
        if (t) add('blocking', 'asset-outside', L(`${f} was a copy of ${t} and this pull request changes it outside architecture/ — the copies live in architecture/ only, read-only (rule 1)`, `${f} era una copia de ${t} y este pull request la cambia fuera de architecture/: las copias viven solo en architecture/, de solo lectura (regla 1)`), f);
      }
    }
    const adir = path.join(dir, 'architecture');
    const depPaths = new Set(assets.filter((p) => p.kind === 'dependency').map((p) => p.rel));
    const ddir = path.join(adir, 'deps');
    if (fs.existsSync(ddir)) for (const pv of fs.readdirSync(ddir)) for (const f of (fs.statSync(path.join(ddir, pv)).isDirectory() ? fs.readdirSync(path.join(ddir, pv)) : [''])) {
      const rel = f ? `deps/${pv}/${f}` : `deps/${pv}`;
      if (!depPaths.has(rel)) add('warning', 'asset-unknown', L(`architecture/${rel} is not a dependency contract of the ${b.architecture_version} pack`, `architecture/${rel} no es un contrato de dependencia del pack de ${b.architecture_version}`), `architecture/${rel}`);
    }
    if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (!names.has(f) && f !== 'deps') add('warning', 'asset-unknown', L(`architecture/${f} is not an asset of the ${b.architecture_version} pack`, `architecture/${f} no es un asset del pack de ${b.architecture_version}`), `architecture/${f}`);
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
      if (arch.length && other.length) add('blocking', 'assets-mixed', L(`${head} changes ${arch.join(', ')} together with ${other.length} other file(s) — the contracts are committed alone, so the diff shows what the contract changed`, `${head} cambia ${arch.join(', ')} junto con ${other.length} archivo(s) más: los contratos se comitean solos, para que el diff muestre qué cambió el contrato`), s.slice(0, 7));
      if (other.length && ver && !(msg.includes(ver) && rev && msg.includes(rev.slice(0, 8)))) add('warning', 'commit-unstamped', (msg.includes(ver) ? L(`${head} names no pack_revision (rule 8)`, `${head} no nombra el pack_revision (regla 8)`) : L(`${head} names neither architecture ${ver} nor the pack_revision (rule 8)`, `${head} no nombra ni la arquitectura ${ver} ni el pack_revision (regla 8)`)), s.slice(0, 7));
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
  let escalations = new Set();
  const rejected = new Set();   // escalations the architect refused that a still-blocking finding cites (10.19.2)
  if (!J || J.reviewed !== true || !Array.isArray(J.findings)) add('blocking', 'review-missing', L('the architecture review (Claude, against the pack) wrote no findings — the check fails closed; re-run it', 'la revisión de arquitectura (Claude, contra el pack) no escribió hallazgos: el control falla cerrado; vuelva a ejecutarla'));
  else {
    const cache = new Map(), esc = (ref) => { if (!cache.has(ref)) cache.set(ref, escalationOf(gh, ref, lang)); return cache.get(ref); };
    const declared = new Set(refsIn(body, arch).map((x) => x.toLowerCase()));
    escalations = new Set();
    for (const f of J.findings) {
      const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : undefined, cite = f.part ? `${f.part}${f.part_line ? `:${f.part_line}` : ''}` : null;
      const text = `${L('rule', 'regla')} ${f.rule || '?'} — ${String(f.finding || '').trim()}${cite ? ` (pack: ${cite})` : ''}`;
      if (String(f.severity) !== 'blocking') { add('warning', 'review', text, where); continue; }
      if (!f.part || (parts.size && !parts.has(f.part))) { add('warning', 'review-uncited', `${text} — ${L('cites no part of the pack, so it does not block', 'no cita ninguna parte del pack, así que no bloquea')}`, where); continue; }
      // cleared only by the escalation the review ties to this finding, which the pull request itself cites
      const own = refsIn(f.escalation || '', arch).map((ref) => (declared.has(ref.toLowerCase()) ? esc(ref) : { ref, ok: false, why: L('not cited in the pull request', 'no se cita en el pull request') }));
      const cover = own.find((e) => e.ok);
      if (cover) escalations.add(cover.ref);
      if (cover) add('warning', 'review-escalated', `${text} — ${L(`covered by ${cover.ref} (${cover.title}): the architect answers it`, `cubierto por ${cover.ref} (${cover.title}): lo responde el arquitecto`)}`, where);
      else own.filter((e) => e.rejected).forEach((e) => rejected.add(e.ref));
      if (!cover) add('blocking', 'review', `${text}${own.length ? ` — ${own.map((e) => `${e.ref} ${e.why}`).join('; ')}` : ''}`, where);
    }
  }
  const blocking = findings.filter((f) => f.severity === 'blocking').length, order = { blocking: 0, warning: 1, note: 2 };
  findings.sort((x, y) => order[x.severity] - order[y.severity]);
  let head = opts.head || null;
  if (!head) try { head = git(dir, 'rev-parse', 'HEAD').trim(); } catch (e) { head = null; }
  return { status: blocking ? 'FAIL' : escalations.size ? 'HELD' : 'PASS', lang, head, run: opts.runUrl || process.env.RUN_URL || null, escalations: [...escalations], rejected: [...rejected], binding: { project: b.project, component: b.component, version: b.architecture_version, pack_revision: b.pack_revision }, findings };
}

function counts(r) {
  const n = (x) => r.findings.filter((f) => f.severity === x).length, L = (en, es) => say(r.lang, en, es);
  return `${n('blocking')} ${L('blocking', 'bloqueante(s)')} · ${n('warning')} ${L('warning', 'advertencia(s)')} · ${n('note')} ${L('note', 'nota(s)')}`;
}
// the commit status's description — GitHub keeps 140 characters
const statusLine = (r) => (r.status === 'HELD'
  ? `${say(r.lang, `waiting for ${r.escalations.join(', ')}`, `en espera de ${r.escalations.join(', ')}`)} · ${counts(r)}` : counts(r)).slice(0, 140);
const VERDICT = { PASS: () => '✅ PASS', FAIL: () => '⛔ FAIL', HELD: (L) => L('⏸ HELD', '⏸ EN ESPERA') };

function render(r) {
  const L = (en, es) => say(r.lang, en, es);
  const sev = { blocking: L('⛔ blocking', '⛔ bloqueante'), warning: L('⚠ warning', '⚠ advertencia'), note: L('ℹ note', 'ℹ nota') };
  const rows = r.findings.map((f) => `| ${sev[f.severity]} | \`${f.code}\` | ${f.where ? `\`${f.where}\`` : '—'} | ${String(f.text).replace(/\|/g, '\\|')} |`);
  return [MARKER, heading(r.status, `${L('Architecture review', 'Revisión de arquitectura')} — ${VERDICT[r.status](L)}`), '',
    `${L('Held to', 'Contrastado con')} **${r.binding.component || '?'}** ${L('at architecture', 'en la arquitectura')} **${r.binding.version || '?'}** (pack_revision \`${String(r.binding.pack_revision || '?').slice(0, 12)}\`): ${counts(r)}.`, '',
    ...(rows.length ? [L('| | Check | Where | Finding |', '| | Control | Dónde | Hallazgo |'), '|---|---|---|---|', ...rows] : [L('Nothing to report: the pull request keeps the pack.', 'Nada que reportar: el pull request respeta el pack.')]), '',
    // what this PASS stands on: the escalations that cleared a finding — --recheck reads it when one of them closes (10.18.0)
    r.status === 'HELD' ? L(`Nothing blocks, but the departures above stand on ${r.escalations.map((x) => `\`${x}\``).join(', ')}: the pull request waits for the architect's answer, and the status stays pending until then. When the escalation closes, the review fails; rebuild on the release that answered it, or fix the code.`,
      `Nada bloquea, pero las desviaciones de arriba se apoyan en ${r.escalations.map((x) => `\`${x}\``).join(', ')}: el pull request espera la respuesta del arquitecto y el estado queda pendiente hasta entonces. Cuando la escalación se cierre, la revisión falla; reconstruya sobre la release que la respondió o corrija el código.`) : '',
    r.status === 'HELD' ? `${ESCALATIONS}${JSON.stringify({ head: r.head, refs: r.escalations, run: r.run })} -->` : '',
    // the architect refused a departure: the way out is the code, never the same question asked again
    r.status !== 'FAIL' ? '' : r.rejected && r.rejected.length ? L(`The architect rejected ${r.rejected.map((x) => `\`${x}\``).join(', ')}: the departure is not accepted. The findings that cite it are cleared only by code that keeps the architecture — not by a new escalation of the same question. A contract copy under \`architecture/\` is never edited here.`,
      `El arquitecto rechazó ${r.rejected.map((x) => `\`${x}\``).join(', ')}: la desviación no se acepta. Los hallazgos que la citan solo se resuelven con código que respete la arquitectura, no con una nueva escalación de la misma pregunta. Una copia de contrato bajo \`architecture/\` nunca se edita aquí.`) : L('A blocking finding is cleared by fixing the code, or — a real departure from the architecture — by an open `[ESC-…]` issue in the architecture repository, filed from the IDE with `preview_escalation` and cited in this pull request. A contract copy under `architecture/` is never edited here.',
      'Un hallazgo bloqueante se resuelve corrigiendo el código o —si es una desviación real de la arquitectura— con un issue `[ESC-…]` abierto en el repositorio de la arquitectura, presentado desde el IDE con `preview_escalation` y citado en este pull request. Una copia de contrato bajo `architecture/` nunca se edita aquí.')].join('\n');
}

// ---- the re-check: a PASS an escalation cleared, held to that escalation again when its state changes (10.18.0) ----------
// A HELD review (10.19.0) is pending while its escalations are open; this is what turns it into a failure when one closes.
// The review reads an escalation's state only when it runs, and it runs on the pull request's own events. When an [ESC-…]
// issue closes (or is transferred, deleted or retitled) the architecture repository dispatches architecture-escalation-closed
// and a schedule sweeps as a fallback: every open pull request whose review comment records the escalations its PASS stood
// on, for the head it still has, is checked again — by code, no model. One that no longer covers gets the commit status
// "Architecture review" failed and a line in the comment; re-running the review, a push or an edit of the body decides anew.
async function recheck(repo, opts = {}) {
  const lang = langOf(opts.lang || process.env.SA_DOC_LANGUAGE), L = (en, es) => say(lang, en, es);
  const gh = opts.gh || ghDefault, out = [];
  // the comment is Alia's when her App's token is there (ALIA_TOKEN); the status stays the job's, the source the required check names
  const ghSay = opts.ghSay || (opts.gh || !process.env.ALIA_TOKEN ? gh
    : (args) => spawnSync('gh', args, { encoding: 'utf8', env: { ...process.env, GH_TOKEN: process.env.ALIA_TOKEN } }));
  const author = opts.author || REVIEW_BOT;
  const lines = (r) => String(r.stdout || '').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const prs = gh(['api', '--paginate', `repos/${repo}/pulls?state=open&per_page=100`, '--jq', '.[] | {number, head: .head.sha}']);
  if (prs.status !== 0) throw new Error(`the open pull requests of ${repo}: ${(prs.stderr || '').trim()}`);
  const cache = new Map(), esc = (ref) => { if (!cache.has(ref)) cache.set(ref, escalationOf(gh, ref, lang)); return cache.get(ref); };
  for (const pr of lines(prs)) {
    // the review's own comment: the marker and this workflow's identity — a comment anyone else starts with the marker is
    // neither read nor patched (#19)
    const cs = gh(['api', '--paginate', `repos/${repo}/issues/${pr.number}/comments?per_page=100`, '--jq', '.[] | {id, body, author: .user.login}']);
    const c = cs.status === 0 ? lines(cs).find((x) => x.author === author && String(x.body || '').startsWith(MARKER)) : null;
    const at = c ? c.body.indexOf(ESCALATIONS) : -1;
    if (at < 0) continue;
    let rec; try { rec = JSON.parse(c.body.slice(at + ESCALATIONS.length, c.body.indexOf(' -->', at))); } catch (e) { continue; }
    // a newer head is reviewed by its own run
    if (!rec || rec.head !== pr.head || !Array.isArray(rec.refs)) { out.push({ pr: pr.number, state: 'skipped', why: 'another head' }); continue; }
    const gone = rec.refs.map(esc).filter((e) => !e.ok);
    if (!gone.length) { out.push({ pr: pr.number, state: 'covered', refs: rec.refs }); continue; }
    const what = gone.map((e) => `${e.ref} ${e.why}`).join('; ');
    const desc = what.slice(0, 140);
    if (!opts.dryRun) {
      gh(['api', `repos/${repo}/statuses/${pr.head}`, '-f', 'state=failure', '-f', 'context=Architecture review', '-f', `description=${desc}`, ...(rec.run || opts.runUrl ? ['-f', `target_url=${rec.run || opts.runUrl}`] : [])]);
      // a rejection leaves one way out — the code; any other loss may also be met by another open escalation or a rebuild
      const line = `> ⛔ ${gone.every((e) => e.rejected)
        ? L(`**The architect rejected the departure this review stood on** — ${what}. The findings it cleared block again until the code keeps the architecture.`,
          `**El arquitecto rechazó la desviación en la que se apoyaba esta revisión** — ${what}. Los hallazgos que resolvía vuelven a bloquear hasta que el código respete la arquitectura.`)
        : L(`**The escalation this review stood on no longer covers it** — ${what}. The findings it cleared block again: fix the code, cite an open \`[ESC-…]\` issue, or re-run the review.`,
          `**La escalación en la que se apoyaba esta revisión ya no la cubre** — ${what}. Los hallazgos que resolvía vuelven a bloquear: corrija el código, cite un issue \`[ESC-…]\` abierto o vuelva a ejecutar la revisión.`)}`;
      // the record goes with it: the next sweep has nothing to re-check until a review writes one again
      const body = c.body.replace(/\n?<!-- sa-review-escalations: .*? -->/, '').replace(/ — ⏸ (?:HELD|EN ESPERA)$/m, ' — ⛔ FAIL').replace(/codec-worried\.png/, 'codec-stern.png').replace(/^(?:Nothing blocks, but|Nada bloquea, pero) .*\n?/m, '').replace(MARKER, `${MARKER}\n${line}\n`);
      ghSay(['api', '-X', 'PATCH', `repos/${repo}/issues/comments/${c.id}`, '-f', `body=${body}`]);
    }
    out.push({ pr: pr.number, state: 'failed', refs: rec.refs, why: what });
  }
  return out;
}

module.exports = { check, render, statusLine, refsIn, recheck, escalationOf, MARKER, ESCALATIONS, REVIEW_BOT };

if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2), opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
    if (opt('--recheck')) {
      const res = await recheck(opt('--recheck'), { lang: opt('--lang'), runUrl: opt('--run-url'), author: opt('--author'), dryRun: a.includes('--dry-run') });
      if (a.includes('--json')) console.log(JSON.stringify(res, null, 1));
      else { for (const x of res) console.log(`#${x.pr} ${x.state}${x.why ? ` — ${x.why}` : x.refs ? ` — ${x.refs.join(', ')}` : ''}`); if (!res.length) console.log('no open pull request stands on an escalation'); }
      process.exit(0);
    }
    const dir = a[0] && !a[0].startsWith('--') ? a[0] : '.';
    const fj = opt('--findings');
    const r = await check(dir, { base: opt('--base'), architecture: opt('--architecture'), server: opt('--server'), lang: opt('--lang'),
      runUrl: opt('--run-url'), findings: fj ? (readJson(fj) || { reviewed: false }) : undefined, body: opt('--body-file') ? read(opt('--body-file')) : '' });
    const md = render(r);
    if (opt('--out')) fs.writeFileSync(opt('--out'), md + '\n');
    if (opt('--status-out')) fs.writeFileSync(opt('--status-out'), statusLine(r) + '\n');
    console.log(a.includes('--json') ? JSON.stringify(r, null, 1) : md);
    process.exit(r.status === 'FAIL' ? 1 : r.status === 'HELD' ? 3 : 0);
  })().catch((e) => { console.error(`review-check: ${e.message}`); process.exit(2); });
}
