#!/usr/bin/env bun
// export-index.js — the architecture index bundle (`sa-index/1`): what an MCP server loads to answer questions about one
// architecture and to hand a developer one component's build pack.
//
//   bun export-index.js <project> [--out <dir>] [--project-key <key>] [--server <mcp_url>] [--previous <bundle>] [--draft] [--no-kit-check] [--json]
//   bun export-index.js --check <bundle_dir> [--json]
//   bun export-index.js --diff <older_bundle> <newer_bundle> [--component <slug>] [--json]   what changed, per container
//
// Writes <out> (default <project>/.cache/sa-skills/index/<version>/, or …/index/draft/ for a draft):
//   manifest.json      schema, project, architecture markers, channel (released | draft), git, counts, every file and its sha256
//   chunks.jsonl       one chunk per unit of meaning: ARCHITECTURE.md, each H2 / H3 of a section file (a principle, a flow,
//                      a phase or an `I-nn` block wherever it sits), each component descriptor, each docs/05 row, each ADR /
//                      TDR (or its H2 sections when long). The text opens with a context line — the project and the heading
//                      path — so a chunk read alone says what it is about; HTML comments are dropped and a Mermaid block is
//                      named, not embedded. `id` is stable across versions (a UUID from the project, the file and the
//                      anchor path), `content_hash` is the text's, so a server re-embeds only what changed.
//   ledger.json        the facts ledger (arch-facts.js) as is — what the exact tools answer from
//   (manifest.support) RUN-team support: the mode `.sa-skills/project.json` declares, whether Tier 0 applies, the Tier 0 writes,
//                      the escalation triggers by id, the routes and the open escalations (escalations/ESC-NNN-*.md)
//   buildpacks/<slug>/ one per container the handoff kit covers: pack.json (parts, ordered build plan, flows and budgets,
//                      interfaces both ways, governing ADRs, open questions), the files byte for byte, and BUILD.md — the
//                      instructions an IDE agent follows, from templates/BUILD.md (`--server` puts the MCP URL in its binding)
//
// A build pack comes only from a kit that holds: `handoffs/.manifest.json` for this architecture version, the component's
// own entry for this version, and `kit-check.js` passing on the shared documents and on every file of the pack (render
// off — the kit's own run renders). A component that fails is listed under `skipped` with the reason, never packed from
// an outdated or failing kit. The channel is `released` when the tag `architecture-v<version>` exists, ARCHITECTURE.md,
// docs/, adr/ and tdr/ at HEAD are the tag's, and nothing there or in handoffs/ is uncommitted; anything else is `draft`.
// So a release publishes twice: at the tag (chunks and ledger), and when the regenerated kit is committed (with packs).
//
// Reads nothing compliance writes. Calls no model and no vector store: the bundle is data for the server.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-delivery reads the architecture through sa-skills
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));

// RUN-team support and escalations (sa-records, re-exported by sa-skills): the policy an MCP server applies and the open queue
const support = require(fromSaSkills('scripts', 'shared', 'support.js'));
const escalate = require(fromSaSkills('scripts', 'shared', 'escalate.js'));
const tier0 = require(fromSaSkills('scripts', 'shared', 'tier0.js'));
function supportOf(root) {
  const s = support.supportOf(root);
  // tier0_kinds and tdr_moves: what preview_tier0 checks before the issue is shown (tier0.js is the contract; the
  // architecture repository checks it again when it writes)
  return { mode: s.support, tier0: s.tier0, released: s.released, tier0_writes: s.tier0 ? support.TIER0 : [], triggers: escalate.TRIGGERS, routes: escalate.ROUTES,
    tier0_kinds: s.tier0 ? Object.fromEntries(Object.entries(tier0.KINDS).map(([k, v]) => [k, { label: support.TIER0_LABEL[k], required: v.required, evidence: v.evidence }])) : {},
    tdr_moves: s.tier0 ? tier0.TDR_MOVES : {}, tdr_statuses: s.tier0 ? tier0.TDR_STATUSES : [], tdr_drivers: s.tier0 ? tier0.TDR_DRIVERS : [], tier0_label: tier0.LABEL,
    // the kinds the architecture repository keys for a trusted unattended agent (support.js tier0.auto, 10.12.0; 10.13.0)
    tier0_auto: s.tier0 ? s.auto || [] : [],
    escalations_open: escalate.open(root).map((r) => ({ id: r.meta.id, status: r.meta.status, route: r.meta.route, triggers: r.meta.triggers || [], components: r.meta.components || [], title: r.title.replace(/^ESC-\d+\s+—\s+/, ''), issue: r.meta.issue || null })) };
}

const SCHEMA = 'sa-index/1';
const MAX_CHARS = 24000;                 // ~6K tokens: a unit above it is cut at paragraph boundaries
const RECORD_WHOLE = 6000;               // an ADR / TDR under this is one chunk
const KINDS = ['overview', 'section', 'principle', 'flow', 'phase', 'integration', 'component', 'adr', 'tdr'];
const SKIP_DIRS = new Set(['compliance-docs', 'node_modules', '.git', '.cache']);

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const uuidOf = (s) => { const h = sha(s); return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`; };
const plain = (s) => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/\s+/g, ' ').trim();
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const posix = (p) => p.split(path.sep).join('/');
const uniq = (a) => [...new Set(a.filter(Boolean))];
const adrIds = (s) => uniq((String(s).match(/\bADR-\d{3,}\b/g) || []));

// ---- git: the channel is derived, never stored. Released = the release tag exists, the architecture's files at HEAD are
// the tag's, and nothing under them or handoffs/ is uncommitted. The kit may land in a later commit than the tag (it is
// generated after the release, from the released version): the same version is then exported again, with its packs.
const ARCH_PATHS = ['ARCHITECTURE.md', 'docs', 'adr', 'tdr'];
function gitOf(root, version) {
  const env = { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(root)) };
  const run = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8', env });
  const git = (...a) => { const r = run(...a); return r.status === 0 ? r.stdout.trim() : null; };
  if (git('rev-parse', '--is-inside-work-tree') !== 'true') return null;
  const head = git('rev-parse', 'HEAD'); const tag = `architecture-v${version}`;
  const tagSha = git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`);
  const dirty = !!(git('status', '--porcelain', '--', ...ARCH_PATHS, 'handoffs') || '');
  const matches = !!tagSha && run('diff', '--quiet', tagSha, 'HEAD', '--', ...ARCH_PATHS).status === 0;
  return { sha: head, tag: tagSha ? tag : null, tag_sha: tagSha, at_tag: !!tagSha && tagSha === head, matches_tag: matches, dirty };
}

// ---- segmentation: headings outside fences, units at H2 / H3 and at every classified block
function headingsOf(lines) {
  const out = []; let fence = false;
  lines.forEach((l, i) => { if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return; } if (fence) return; const m = l.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/); if (m) out.push({ i, level: m[1].length, raw: m[2] }); });
  return out;
}
const anchorOf = (raw) => { const m = raw.match(/<!--\s*(SECTION|LABEL|PRINCIPLE):\s*([^>]+?)\s*-->/); return m ? { type: m[1], value: m[2] } : null; };
function classify(h, file) {
  const t = plain(h.raw); const a = anchorOf(h.raw);
  if (a && a.type === 'PRINCIPLE') return { kind: 'principle', principle: a.value };
  let m = t.match(/^(?:Flow|Flujo)\s+(\d+[a-z]?)\s*[—–-]\s*(.*)$/i); if (m) return { kind: 'flow', code: m[1] };
  m = t.match(/^(?:Panel\s*[—–-]\s*)?(?:Phase|Fase)\s+(\d+[a-z]?)\b/i); if (m) return { kind: 'phase', n: m[1] };
  if (/^docs\/05-/.test(file)) { m = t.match(/^(I-\d+)\b/i); if (m) return { kind: 'integration', id: m[1].toUpperCase() }; }
  return null;
}
// opts.maxLevel: the deepest plain heading that opens a unit (3 for a section file, 2 for a long record)
function segment(src, file, opts = {}) {
  const lines = src.split('\n'); const hs = headingsOf(lines); const maxLevel = opts.maxLevel || 3;
  const h1 = hs.find((h) => h.level === 1); const title = h1 ? plain(h1.raw) : path.basename(file, '.md');
  const units = []; const stack = [];
  let cur = { level: 1, heading: title, anchor: null, kind: null, start: h1 ? h1.i + 1 : 0, crumbs: [] };
  const close = (end) => { cur.end = end; units.push(cur); };
  for (const h of hs) {
    if (h.level === 1) continue;
    const cls = classify(h, file);
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
    const crumbs = stack.map((s) => ({ text: s.text, anchor: s.anchor }));
    const boundary = h.level <= maxLevel || !!cls || (cur.kind && h.level <= cur.level);
    if (boundary) { close(h.i); const a = anchorOf(h.raw); cur = { level: h.level, heading: plain(h.raw), anchor: a ? a.value : null, kind: cls ? cls.kind : null, cls, start: h.i, crumbs }; }
    stack.push({ level: h.level, text: plain(h.raw), anchor: (anchorOf(h.raw) || {}).value || null });
  }
  close(lines.length);
  return { title, lines, units };
}
// the text of a unit: comments out, a Mermaid block named instead of embedded, blank runs collapsed
function bodyOf(lines, u, file) {
  const out = []; let fence = null;
  for (let i = u.start; i < u.end; i++) {
    const l = lines[i];
    if (fence) { if (/^\s*(```|~~~)\s*$/.test(l)) { if (fence.mermaid) out.push(`[Mermaid diagram — ${file}:${fence.line}]`); else out.push(l); fence = null; } else if (!fence.mermaid) out.push(l); continue; }
    const f = l.match(/^\s*(```|~~~)\s*(\w*)/); if (f) { fence = { mermaid: f[2] === 'mermaid', line: i + 1 }; if (!fence.mermaid) out.push(l); continue; }
    out.push(l);
  }
  return out.join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}
// a unit over the cap, cut at blank lines; a paragraph still over it (a long table) is cut by rows, each piece of a table
// repeating its header so a row read alone keeps its column names
function lineCut(p) {
  const lines = p.split('\n'); const isTable = lines.length > 2 && /^\s*\|/.test(lines[0]) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[1]);
  const head = isTable ? lines.slice(0, 2).join('\n') + '\n' : ''; const rows = isTable ? lines.slice(2) : lines; const out = []; let buf = '';
  for (const r of rows) { if (buf && head.length + buf.length + r.length + 1 > MAX_CHARS) { out.push(head + buf); buf = r; } else buf = buf ? buf + '\n' + r : r; }
  if (buf) out.push(head + buf);
  return out;
}
function parts(text) {
  if (text.length <= MAX_CHARS) return [text];
  const paras = text.split(/\n\n/).flatMap((p) => p.length > MAX_CHARS ? lineCut(p) : [p]); const out = []; let buf = '';
  for (const p of paras) { if (buf && buf.length + p.length + 2 > MAX_CHARS) { out.push(buf); buf = p; } else buf = buf ? buf + '\n\n' + p : p; }
  if (buf) out.push(buf);
  return out;
}

// ---- names → slugs, exactly: a canonical name, an internal name or a slug, nothing looser
function resolver(facts) {
  const by = new Map();
  (facts.components || []).forEach((c) => { [c.name, c.slug, c.internal_name].filter(Boolean).forEach((k) => by.set(String(k).trim(), c.slug)); });
  return (s) => by.get(plain(s)) || null;
}
const hopNames = (hops) => String(hops || '').split(/\s*(?:→|->|,|;)\s*/).map(plain).filter(Boolean);

function chunksOf(root, facts, key) {
  const name = (facts.architecture || {}).name || key; const lang = (facts.architecture || {}).language || 'en';
  const slugOf = resolver(facts); const out = [];
  const phaseComps = new Map((facts.phases || []).map((p) => [p.n, uniq(hopNames(p.hops).map(slugOf))]));
  const flowBy = new Map((facts.flows || []).map((f) => [f.code, f]));
  const phaseBy = new Map((facts.phases || []).map((p) => [p.n, p]));
  const intBy = new Map((facts.integrations || []).map((i) => [i.id, i]));
  const intRow = (i) => `${i.id} · ${i.from} → ${i.to}${i.protocol ? ` · ${i.protocol}` : ''}${i.pattern ? ` · ${i.pattern}` : ''}${i.boundary ? ` · ${i.boundary}` : ''}${i.retired ? ' · retired' : ''}`;
  const intMeta = (i) => ({ integration: i.id, from: i.from, to: i.to, protocol: i.protocol, retired: !!i.retired, components: uniq([slugOf(i.from), slugOf(i.to)]) });
  const seenInt = new Set(); const seenPath = new Map();
  // crumbs: [{ text, anchor }] — the context line reads the visible headings, the id and meta.anchor the anchors where they exist
  const push = (file, u, text, meta, crumbs) => {
    const visible = [...crumbs.map((c) => c.text), u.heading].filter(Boolean);
    const path_ = [...crumbs.map((c) => c.anchor || c.text), u.anchor || u.heading].filter(Boolean);
    // the same heading path twice in one file (two "Notes" under one parent): the second is told apart by its rank
    const pk = `${file}\0${path_.join(' › ')}`; const rank = (seenPath.get(pk) || 0) + 1; seenPath.set(pk, rank);
    const ps = parts(text);
    ps.forEach((p, k) => {
      const context = [name, ...visible].join(' › ');
      const body = `${context}${ps.length > 1 ? ` (${k + 1}/${ps.length})` : ''}\n\n${p}`;
      out.push({ id: uuidOf([key, file, path_.join(' › '), rank > 1 ? `#${rank}` : '', ps.length > 1 ? k : ''].join('\0')), content_hash: sha(body), text: body,
        meta: { kind: 'section', file, lines: [u.start + 1, u.end], title: u.heading, anchor: path_.join(' › '), doc_language: lang, components: [], adrs: adrIds(p), ...(ps.length > 1 ? { part: `${k + 1}/${ps.length}` } : {}), ...meta } });
    });
  };
  const fromFile = (rel, base, opts = {}) => {
    const src = read(path.join(root, rel)); const seg = segment(src, rel, opts);
    seg.units.forEach((u) => {
      let text = bodyOf(seg.lines, u, rel); if (!text || /^#+\s+[^\n]*$/.test(text)) return;   // a heading alone says nothing
      const crumbs = [{ text: seg.title }, ...u.crumbs];
      // a classified block (principle, flow, phase, integration) names its own components and ADRs; the file header's are the file's
      let meta = u.kind ? { ...base, components: [], adrs: adrIds(text) } : { ...base, components: base.components || [], adrs: uniq([...(base.adrs || []), ...adrIds(text)]) };
      if (u.kind === 'principle') meta = { ...meta, kind: 'principle', principle: u.cls.principle };
      if (u.kind === 'flow') { const f = flowBy.get(u.cls.code) || {}; meta = { ...meta, kind: 'flow', flow: u.cls.code, use_cases: f.use_cases || [], phases: f.phases || [], latency_target: f.latency_target || null,
        components: uniq([...meta.components, ...(f.phases || []).flatMap((n) => phaseComps.get(n) || [])]), adrs: uniq([...meta.adrs, ...(f.governed_by || [])]) }; }
      if (u.kind === 'phase') { const p = phaseBy.get(u.cls.n) || {}; meta = { ...meta, kind: 'phase', phase: u.cls.n, latency_budget: p.latency_budget || null, components: uniq([...meta.components, ...(phaseComps.get(u.cls.n) || [])]) }; }
      if (u.kind === 'integration') { const i = intBy.get(u.cls.id); if (i) { seenInt.add(i.id); text = `${intRow(i)}\n\n${text}`; meta = { ...meta, kind: 'integration', ...intMeta(i), components: uniq([...meta.components, ...intMeta(i).components]) }; } }
      push(rel, u, text, meta, crumbs);
    });
  };

  if (fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) fromFile('ARCHITECTURE.md', { kind: 'overview' }, { maxLevel: 2 });
  (facts.docs || []).forEach((d) => fromFile(d.file, { kind: 'section', components: uniq((d.components || []).map(slugOf)), adrs: d.related_adrs || [] }));
  // docs/05 rows without a block of their own
  const f05 = (facts.docs || []).find((d) => /^docs\/05-/.test(d.file));
  const lines05 = f05 ? read(path.join(root, f05.file)).split('\n') : [];
  (facts.integrations || []).filter((i) => !seenInt.has(i.id)).forEach((i) => {
    const at = lines05.findIndex((l) => new RegExp(`^\\s*\\|\\s*(~~)?${i.id}\\b`).test(l));
    push(f05 ? f05.file : 'docs/05', { start: at, end: at + 1, heading: i.id, anchor: i.id }, intRow(i), { kind: 'integration', ...intMeta(i) }, [{ text: 'Integrations' }]);
  });
  (facts.components || []).filter((c) => c.file_backed).forEach((c) => {
    const src = read(path.join(root, c.file)); const lines = src.split('\n');
    const head = `${c.name} — ${c.level === 'L1' ? 'System' : 'Container'}${c.type ? `, ${c.type}` : ''}${(c.technology || []).length ? `, ${c.technology.join(', ')}` : ''}${c.internal_name ? ` (${c.internal_name})` : ''}`;
    const u = { start: 0, end: lines.length, heading: c.name, anchor: `Component: ${c.slug}` };
    push(c.file, u, `${head}\n\n${bodyOf(lines, u, c.file)}`, { kind: 'component', component: c.slug, level: c.level, system: c.system || null, type: c.type || null, technology: c.technology || [], internal_name: c.internal_name || null, components: [c.slug], adrs: uniq([...(c.related_adrs || []), ...adrIds(src)]) }, []);
  });
  const records = (list, kind) => (list || []).forEach((r) => {
    const rel = r.file; if (!rel || !fs.existsSync(path.join(root, rel))) return; const src = read(path.join(root, rel));
    const meta = { kind, [kind]: r.id, status: r.status || null, ...(r.scope ? { scope: r.scope } : {}) };
    if (src.length <= RECORD_WHOLE) { const lines = src.split('\n'); const u = { start: 0, end: lines.length, heading: r.title || r.id, anchor: r.id }; push(rel, u, bodyOf(lines, u, rel), { ...meta, adrs: uniq([kind === 'adr' ? r.id : null, ...adrIds(src)]) }, []); }
    else fromFile(rel, { ...meta, adrs: kind === 'adr' ? [r.id] : [] }, { maxLevel: 2 });
  });
  records(facts.adrs, 'adr'); records(facts.tdrs, 'tdr');
  return out.map((c) => ({ ...c, meta: { project: key, ...c.meta } }));
}

// ---- build packs, from the handoff kit only when it holds
const ASSET_STEP = (f) => /^(openapi\.ya?ml|asyncapi\.ya?ml|schema\.graphql|schema\.proto|.*\.avsc)$/i.test(f) ? 'contracts' : /^(ddl\.sql|redis-key-schema\.md)$/i.test(f) ? 'data' : /^c4-descriptor\.md$/i.test(f) ? 'spec' : 'contracts';
const RETIRED_ADR = /^(superseded|deprecated|rejected)\b/i;   // ADR status values no longer in force (the ADR skill writes them in English)
const PLAN = [
  ['spec', 'Read the Component Specification: responsibility, invariants, budgets, data ownership'],
  ['security', 'Enforce the security obligations first: who may call, how each interface authenticates, the threats to mitigate'],
  ['contracts', 'Implement the API and message contracts exactly as written'],
  ['data', 'Implement the data model'],
  ['interfaces', 'Implement each interface: outbound calls, then inbound'],
  ['standards', 'Apply the cross-cutting standards and the governing ADRs'],
  ['flows', 'Meet the flows the component takes part in and their latency budgets'],
  ['acceptance', 'Prove the acceptance criteria of the Component Specification'],
];
function kitCheckDefault(hd) {
  const kc = require(path.join(__dirname, '..', '..', 'architecture-dev-handoff', 'scripts', 'kit-check.js'));
  const r = kc.check([hd], { render: false });
  return r.files.filter((f) => f.findings.length).map((f) => ({ file: path.resolve(f.file), findings: f.findings }));
}
// a Markdown part links the documents relative to where it lives in the architecture repository; in the pack those links
// lead nowhere. A link whose target travels in the same pack (an ADR, a TDR, an interface, the shared documents) is rewritten
// to the part's path in the pack, its #anchor kept; any other link stays as written (10.10.3)
function relinkParts(dir, parts) {
  const bySource = new Map(parts.filter((p) => p.source).map((p) => [p.source, p]));
  for (const p of parts) {
    if (!/\.md$/i.test(p.path) || !p.source || p.kind === 'asset') continue;
    const dst = path.join(dir, p.path), src = read(dst);
    const out = src.replace(/\]\(([^)\s#]+\.md)(#[^)\s]*)?\)/g, (m, target, anchor) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return m;
      const t = bySource.get(posix(path.normalize(path.join(path.dirname(p.source), target)))); if (!t) return m;
      return `](${posix(path.relative(path.dirname(p.path), t.path)) || path.basename(t.path)}${anchor || ''})`; });
    if (out !== src) { fs.writeFileSync(dst, out); const b = Buffer.from(out); p.bytes = b.length; p.sha256 = sha(b); }
  }
}
// the build instructions: templates/BUILD.md with the pack's facts filled in — the rules live in the template, the facts in the pack
const cell = (s) => String(s == null || s === '' ? '—' : s).replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const mdTable = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n')}`;
// rule 9: what only the architect can answer — an escalation on a RUN-team project (the server previews it, the developer files it), else the team's channel
// a label the repository lacks makes the host refuse the issue: refile without it, the title identifies the issue, the missing labels are reported
const missingLabels = (title, after) => ` If the host refuses the issue for a label the repository does not have, file it again without the labels it refused — the \`${title}\` title identifies it — and name the missing labels beside the issue's URL, to the user or, unattended, in your pull request${after}.`;
function escalationRule(project, mode) {
  if (mode === 'run') return '9. **A question that blocks the build is escalated, never kept in a local file.** A RUN team maintains this architecture. When an open question blocks the build — a contract with nothing to implement, an interface whose authentication is not documented, a decision still `Proposed` the code depends on — stop that part and call `preview_escalation(project: "' + project + '", …)`: `request`, what the developer asked you to build, in their words — the task that led here, never their answer to a question of yours; the questions, one per item; the components by canonical name and the `I-nn` integrations concerned; the trigger each one touches from `get_architecture`\'s `support.triggers` (an authentication or authorization gap is `security-iam`; a gap no other trigger names is `low-confidence`) with its evidence — the part and the line; route `tier-1`. Show the user the issue it returns; only after a yes follow `file_with.steps` with the developer\'s own access, then `record_escalation`. A pull request whose code departs from the pack while the escalation is open cites the issue in its description as `owner/repo#N` — an architecture review clears that departure only for the escalation the pull request cites. Unattended, nobody says yes: an escalation writes nothing, so follow `file_with.steps` with this build\'s own identity, then `record_escalation`, and list the issue in your pull request.' + missingLabels('[ESC-?]', '') + ' A change to the architecture you would make that crosses a trigger takes the same path. If the server files no escalations for this project, give the user — unattended, your pull request — the same questions, each with its part and line, for the architects.';
  return '9. **A question that blocks the build goes to the architect.** When an open question blocks the build — a contract with nothing to implement, an interface whose authentication is not documented — stop that part and give the user — unattended, your pull request — the questions, each with its part and line, for the architects through the team\'s channel; never settle it in code.';
}
// unattended, the key is never the build's: a person applies it — or, for a kind in tier0.auto, the architecture repository
// itself when this build's identity is one of its trusted agents (10.13.0; 10.12.0 had the build apply it, against the
// server's own instruction). The issue is filed as file_with gives it: Alia 0.5.0 files an auto kind with the label, and
// the architecture repository holds that label to its trusted agents and tier0.auto (10.13.1) — the rule never overrides
// the server's steps
function unattendedKey(auto) {
  const base = 'Unattended, pass `supervision: "unattended"` and file the issue with this build\'s own identity exactly as `file_with` gives it — its labels included, never one added or dropped — then call `record_tier0` and list it in your pull request; ';
  if (!auto.length) return base + 'it carries no `architecture-tier0`: a person applies the label, and that is the approval. Never apply `architecture-tier0` yourself.';
  return base + 'never apply `architecture-tier0` yourself. A kind in `support.tier0_auto` — on this architecture ' + auto.map((k) => '`' + k + '`').join(', ') + ' — the architecture repository keys itself when this build\'s identity is one of its trusted agents, whether `file_with` carries the label or not; any other kind waits for a person. A move to `Resolved` cites, beside the file and line, the pull request that carries the change as `owner/repo#N`: file it with that pull request, and the architecture repository writes it once the pull request is merged.';
}
function tier0Rule(project, mode, auto = []) {
  if (mode !== 'run') return '';
  return '\n10. **A Tier 0 write is requested, never made here.** Four writes on this architecture need no architect (`get_architecture`\'s `support.tier0_writes`): a workaround recorded as a TDR, a TDR status move, a project ADR in `Proposed`, a doc fix that changes no fact. They belong in the architecture repository, never in this one. When you take a shortcut this pack does not state — a cache, a retry, a stub, a relaxed budget — or your code resolves a TDR, call `preview_tier0(project: "' + project + '", kind, …)`: `request`, the developer\'s task in their words; the components by canonical name; the evidence — this repository, the commit, the file and line; the fields its kind needs (`support.tier0_kinds`; a status move only along `support.tdr_moves`). Show the user the issue it returns; only after a yes follow `file_with.steps`, then `record_tier0`. ' + unattendedKey(auto) + missingLabels('[T0-?]', ': without `architecture-tier0` in the repository nobody can apply the request') + ' Mark the code of a workaround with the issue\'s URL, and replace it with the TDR\'s id when `what_changed` brings it — never in a file that must not change once applied (a database migration): mark the code that keeps the workaround instead. Whatever crosses a trigger is rule 9, never Tier 0.';
}
function renderBuild(pack, projectName, server, mode, auto = []) {
  const c = pack.component; const part = new Map(pack.parts.map((p) => [p.id, p]));
  // the pack's revision is the sha256 of the pack.json listing this very file, so the export cannot write it: the agent records it from get_build_pack
  const binding = JSON.stringify({ ...(server ? { server } : {}), project: pack.project, component: c.slug, architecture_version: pack.architecture_version, pack_revision: '<pack_revision from get_build_pack>' }, null, 2);
  // an ADR the component's descriptor names is carried out here; one only an interface, a flow or the security section brings is context
  const viaName = (x) => { const i = pack.interfaces.find((y) => `interface:${y.key}` === x); if (i) return `the interface ${i.upstream_name} → ${i.downstream_name}`; const f = pack.flows.find((y) => `flow:${y.code}` === x); if (f) return `flow ${f.code}. ${f.name}`; return x === 'security' ? 'the security obligations' : x; };
  const adrNote = (p) => (p.kind !== 'adr' || !p.scope ? '' : p.scope === 'own' ? ' — **own**: this code carries it out' : ` — **context**, through ${p.via.map(viaName).join(', ')}: not an obligation of this code; read it for what the other side does`);
  const plan = pack.plan.map((s) => `### ${s.step}. ${s.title}\n\n${s.id === 'acceptance' ? '- `spec` — § Acceptance of the Component Specification: each criterion becomes an automated test' : s.parts.map((id) => `- \`${id}\` — ${part.get(id).title} (\`${part.get(id).path}\`)${adrNote(part.get(id))}`).join('\n')}${s.id === 'flows' && pack.flows.length ? '\n- the flows and budgets below' : ''}`).join('\n\n');
  const interfaces = pack.interfaces.length ? mdTable(['Direction', 'Interface', 'Part'], pack.interfaces.map((i) => [i.direction, `${i.upstream_name} → ${i.downstream_name}`, `\`${i.part}\``])) : 'None stated for this component.';
  const flows = pack.flows.length ? mdTable(['Flow', 'Use cases', 'Flow target', 'Phase', 'Hops', 'Phase budget'], pack.flows.flatMap((f) => f.phases.map((p) => [`${f.code}. ${f.name}`, f.use_cases.join(', '), f.latency_target, `${p.n}. ${p.name}`, p.hops, p.latency_budget]))) : 'None stated for this component.';
  // the Inbound section of the security part, verbatim: who may call and how, before anything is built
  const secPart = part.get('security'); const secSrc = secPart && pack.dir ? read(path.join(pack.dir, secPart.path)) : '';
  const inb = secSrc.match(/^##[^\n]*<!--\s*SECTION:\s*Inbound\s*-->\n([\s\S]*?)(?=^## )/m);
  const security = inb ? inb[1].trim() : 'None stated for this component.';
  const questions = pack.open_questions.length ? mdTable(['Part', 'Line', 'Question'], pack.open_questions.map((q) => [`\`${q.part}\``, q.line, q.text])) : 'None.';
  const v = { name: c.name, internal_name: c.internal_name ? ` (\`${c.internal_name}\`)` : '', internal_name_rule: c.internal_name ? `, with \`${c.internal_name}\` beside it where an identifier is needed (repository, workload, artifact)` : '',
    type: c.type || 'component', technology: (c.technology || []).join(', ') || 'technology not stated', project_name: projectName, project: pack.project, slug: c.slug, version: pack.architecture_version, binding, plan, security, interfaces, flows, questions,
    escalation_rule: escalationRule(pack.project, mode), tier0_rule: tier0Rule(pack.project, mode, auto) };
  return read(path.join(__dirname, '..', 'templates', 'BUILD.md')).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in v ? v[k] : m));
}
function buildPacks(root, facts, outDir, opts = {}) {
  const version = (facts.architecture || {}).version; const hd = path.join(root, 'handoffs'); const mp = path.join(hd, '.manifest.json');
  const comps = (facts.components || []).filter((c) => c.level === 'L2' && c.file_backed);
  const res = { packs: [], skipped: [], warnings: [] };
  if (!fs.existsSync(mp)) { res.warnings.push('no handoff kit (handoffs/.manifest.json) — no build packs; run architecture-dev-handoff'); comps.forEach((c) => res.skipped.push({ component: c.slug, reason: 'no-kit' })); return res; }
  const m = JSON.parse(read(mp)); const runV = (m.run || {}).architecture_version;
  if (runV !== version) { res.warnings.push(`handoff kit is for architecture ${runV || 'unknown'}, this is ${version} — regenerate the kit`); comps.forEach((c) => res.skipped.push({ component: c.slug, reason: `kit-version ${runV || 'unknown'}` })); return res; }
  const failing = opts.kitCheck === false ? [] : (typeof opts.kitCheck === 'function' ? opts.kitCheck(hd) : kitCheckDefault(hd));
  const failBy = new Map(failing.map((f) => [path.resolve(f.file), f.findings]));
  const shared = { 'runtime-view': path.join(hd, 'SYSTEM_RUNTIME_VIEW.md'), 'cross-cutting-standards': path.join(hd, 'CROSS_CUTTING_STANDARDS.md') };
  const sharedFail = Object.values(shared).filter((f) => !fs.existsSync(f) || failBy.has(f));
  if (sharedFail.length) { res.warnings.push(`kit-check: ${sharedFail.map((f) => posix(path.relative(root, f))).join(', ')} missing or failing — no build packs`); comps.forEach((c) => res.skipped.push({ component: c.slug, reason: 'kit-check shared' })); return res; }
  const slugOf = resolver(facts); const phaseComps = new Map((facts.phases || []).map((p) => [p.n, uniq(hopNames(p.hops).map(slugOf))]));
  const adrFile = new Map((facts.adrs || []).map((a) => [a.id, a.file]));
  const adrStatus = new Map((facts.adrs || []).map((a) => [a.id, a.status || '']));
  const adrTitle = new Map((facts.adrs || []).map((a) => [a.id, !a.title ? a.id : a.title.startsWith(a.id) ? a.title : `${a.id}: ${a.title}`]));
  const tdrById = new Map((facts.tdrs || []).map((t) => [t.id, t]));
  const nameOf = (sl) => ((facts.components || []).find((x) => x.slug === sl) || {}).name || sl;   // canonical names in every title a builder reads
  const covered = new Set(Object.keys(m.cut_sheets || {}));
  comps.filter((c) => !covered.has(c.slug)).forEach((c) => res.skipped.push({ component: c.slug, reason: 'not in the kit' }));
  for (const [slug, e] of Object.entries(m.cut_sheets || {})) {
    const c = comps.find((x) => x.slug === slug); if (!c) { res.skipped.push({ component: slug, reason: 'not an L2 container of this architecture' }); continue; }
    if (e.architecture_version !== version) { res.skipped.push({ component: slug, reason: `kit-version ${e.architecture_version || 'unknown'}` }); continue; }
    const spec = path.join(hd, e.cut_sheet_file); const nn = path.basename(e.cut_sheet_file, '.md'); const assetsDir = path.join(hd, 'assets', nn);
    const seams = Object.entries(m.seams || {}).map(([k, s]) => { const [u, d] = k.split('→'); return { key: k, upstream: u, downstream: d, file: path.join(hd, s.seam_file), related_adrs: s.related_adrs || [] }; }).filter((s) => s.upstream === slug || s.downstream === slug);
    const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir, { withFileTypes: true }).filter((d) => d.isFile() && d.name !== 'security.md').map((d) => d.name).sort() : [];
    const security = path.join(assetsDir, 'security.md');   // security-obligations.js, its own part — kit-check holds every component to it
    const files = [spec, security, ...seams.map((s) => s.file), ...assets.map((a) => path.join(assetsDir, a))];
    const missing = files.filter((f) => !fs.existsSync(f)); const bad = files.filter((f) => failBy.has(f));
    if (missing.length || bad.length) { res.skipped.push({ component: slug, reason: [missing.length ? `missing ${missing.map((f) => posix(path.relative(root, f))).join(', ')}` : '', bad.length ? `kit-check fails on ${bad.map((f) => posix(path.relative(root, f))).join(', ')}` : ''].filter(Boolean).join('; ') }); continue; }

    const flows = flowsOf(facts, slug);
    // the governing ADRs, and the institutional ones its security obligations name (the security section's decisions in force)
    const secAdrs = adrIds(read(security)).filter((id) => parseInt(id.slice(4), 10) <= 100);
    const cited = uniq([...(c.related_adrs || []), ...seams.flatMap((s) => s.related_adrs), ...flows.flatMap((f) => f.governed_by), ...secAdrs]).filter((id) => adrFile.has(id)).sort();
    // decisions in force only: a superseded, deprecated or rejected ADR is named, never packed — the builder would follow both
    const retired = cited.filter((id) => RETIRED_ADR.test(adrStatus.get(id) || ''));
    if (retired.length) res.warnings.push(`${slug}: ${retired.map((id) => `${id} (${adrStatus.get(id)})`).join(', ')} cited but not in force — left out of the build pack; drop the citation`);
    const adrs = cited.filter((id) => !retired.includes(id));
    // why each one is here (10.23.0): the component's descriptor names the decisions this code carries out (`own`); one only
    // an interface contract, a flow or the security section brings is `context` — read for what the other side does, not an
    // obligation of this code nor missing from it (the security obligations themselves bind through the `security` part)
    const via = (id) => [...((c.related_adrs || []).includes(id) ? ['component'] : []), ...(secAdrs.includes(id) ? ['security'] : []),
      ...seams.filter((s) => s.related_adrs.includes(id)).map((s) => `interface:${s.key}`), ...flows.filter((f) => (f.governed_by || []).includes(id)).map((f) => `flow:${f.code}`)];
    const adrScope = (v) => (v.includes('component') ? 'own' : 'context');

    const dir = path.join(outDir, 'buildpacks', slug); const partsOut = [];
    const add = (id, kind, title, src, rel, step) => { const dst = path.join(dir, rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); const b = fs.readFileSync(dst);
      partsOut.push({ id, kind, title, path: posix(rel), source: posix(path.relative(root, src)), bytes: b.length, sha256: sha(b), step }); };
    add('spec', 'specification', 'Component Specification', spec, 'spec.md', 'spec');
    add('security', 'security', 'Security Obligations', security, 'security.md', 'security');
    assets.forEach((a) => add(`asset:${a}`, 'asset', a, path.join(assetsDir, a), path.join('assets', a), ASSET_STEP(a)));
    seams.sort((a, b) => (a.upstream === slug ? 0 : 1) - (b.upstream === slug ? 0 : 1) || a.key.localeCompare(b.key))
      .forEach((s) => add(`interface:${s.key}`, 'interface', `Interface Contract: ${nameOf(s.upstream)} → ${nameOf(s.downstream)}`, s.file, path.join('interfaces', path.basename(s.file)), 'interfaces'));
    add('cross-cutting-standards', 'standards', 'Cross-Cutting Standards', shared['cross-cutting-standards'], 'cross-cutting-standards.md', 'standards');
    adrs.forEach((id) => { add(`adr:${id}`, 'adr', adrTitle.get(id), path.join(root, adrFile.get(id)), path.join('adrs', path.basename(adrFile.get(id))), 'standards'); const v = via(id); Object.assign(partsOut[partsOut.length - 1], { scope: adrScope(v), via: v }); });
    // its technical debt (10.10.3): the TDRs its descriptor's **Technical Debt:** line names, read with the specification whose § 7 lists them
    const tdrs = (c.tdrs || []).filter((id) => tdrById.has(id) && tdrById.get(id).file && fs.existsSync(path.join(root, tdrById.get(id).file)));
    tdrs.forEach((id) => { const t = tdrById.get(id); add(`tdr:${id}`, 'tdr', t.title ? `${id}: ${t.title}` : id, path.join(root, t.file), path.join('tdrs', path.basename(t.file)), 'spec'); });
    add('runtime-view', 'runtime-view', 'System Runtime View', shared['runtime-view'], 'runtime-view.md', 'flows');

    relinkParts(dir, partsOut);
    const plan = PLAN.map(([step, title], k) => ({ step: k + 1, id: step, title, parts: step === 'acceptance' ? ['spec'] : partsOut.filter((p) => p.step === step).map((p) => p.id) }))
      .filter((s) => s.parts.length || (s.id === 'flows' && flows.length)).map((s, k) => ({ ...s, step: k + 1 }));
    const open_questions = [];
    // the component's own gaps: its spec, its interfaces, its assets — the shared documents' gaps are the whole system's
    partsOut.forEach((p) => { if (!['specification', 'security', 'interface', 'asset'].includes(p.kind) || !/\.(md|ya?ml|sql|graphql|proto|avsc|json)$/i.test(p.path)) return; read(path.join(dir, p.path)).split('\n').forEach((l, i) => { if (/\[NOT DOCUMENTED\b/.test(l)) open_questions.push({ part: p.id, line: i + 1, text: l.trim().slice(0, 400) }); }); });
    const interfaces = seams.map((s) => ({ key: s.key, direction: s.upstream === slug ? 'outbound' : 'inbound', upstream: s.upstream, downstream: s.downstream, upstream_name: nameOf(s.upstream), downstream_name: nameOf(s.downstream), part: `interface:${s.key}` }));
    const pack = { schema: `${SCHEMA}#buildpack`, project: opts.key, architecture_version: version,
      component: { slug, name: c.name, internal_name: c.internal_name || null, type: c.type || null, technology: c.technology || [], system: c.system || null, component_version: c.component_version || null },
      parts: partsOut.map(({ step, ...p }) => p), plan, flows, interfaces, adrs, tdrs, open_questions, instructions: 'BUILD.md' };
    // BUILD.md — the instructions an IDE agent follows, rendered from the pack by code; a part like any other
    const b = Buffer.from(renderBuild({ ...pack, dir }, (facts.architecture || {}).name || opts.key, opts.server, ...(({ support: m, auto }) => [m, auto || []])(support.supportOf(root))));
    fs.writeFileSync(path.join(dir, 'BUILD.md'), b);
    pack.parts.unshift({ id: 'instructions', kind: 'instructions', title: 'Build instructions', path: 'BUILD.md', source: null, bytes: b.length, sha256: sha(b) });
    fs.writeFileSync(path.join(dir, 'pack.json'), JSON.stringify(pack, null, 1) + '\n');
    res.packs.push({ slug, parts: pack.parts.length, open_questions: open_questions.length });
  }
  return res;
}

// ---- the bundle
function pluginVersion() { try { return JSON.parse(read(path.join(__dirname, '..', '..', '..', '.claude-plugin', 'plugin.json'))).version; } catch { return null; } }
function safeClear(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir); if (!entries.length) return;
  const mf = path.join(dir, 'manifest.json'); let ours = false; try { ours = JSON.parse(read(mf)).schema === SCHEMA; } catch { /* not a bundle */ }
  if (!ours) throw new Error(`${dir} is not empty and holds no ${SCHEMA} bundle — refusing to overwrite it`);
  fs.rmSync(dir, { recursive: true, force: true });
}
function listFiles(dir, base = dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => { const p = path.join(dir, e.name); return e.isDirectory() ? listFiles(p, base) : [posix(path.relative(base, p))]; }).sort(); }

function exportIndex(root, opts = {}) {
  root = path.resolve(root);
  if (!fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) throw new Error(`${root}: no ARCHITECTURE.md`);
  const facts = collect(root); const a = facts.architecture || {};
  if (!a.version) throw new Error('ARCHITECTURE.md carries no <!-- ARCHITECTURE_VERSION: --> marker');
  const key = opts.projectKey || slugify(a.name) || slugify(path.basename(root));
  const git = gitOf(root, a.version);
  // --draft: a local test publish never touches the released version, even from a tree that equals its tag
  const released = !opts.draft && !!(git && !git.dirty && git.matches_tag && /^released$/i.test(a.status || ''));
  const channel = released ? 'released' : 'draft';
  const out = path.resolve(opts.out || path.join(root, '.cache', 'sa-skills', 'index', released ? a.version : 'draft'));
  safeClear(out); fs.mkdirSync(out, { recursive: true });

  const chunks = chunksOf(root, facts, key).map((c) => ({ ...c, meta: { ...c.meta, architecture_version: a.version, channel } }))
    .sort((x, y) => x.meta.file.localeCompare(y.meta.file) || x.meta.lines[0] - y.meta.lines[0]);
  fs.writeFileSync(path.join(out, 'chunks.jsonl'), chunks.map((c) => JSON.stringify(c)).join('\n') + '\n');
  // the absolute path of a laptop is not data, and the run's clock is not either: the same commit gives the same ledger, byte for byte,
  // so a server holding a released version compares the ledger of a second publish exactly
  const { project_root, generated_at, ...ledger } = facts;
  fs.writeFileSync(path.join(out, 'ledger.json'), JSON.stringify(ledger, null, 1) + '\n');
  const packs = buildPacks(root, facts, out, { kitCheck: opts.kitCheck, key, server: opts.server });

  const byKind = {}; chunks.forEach((c) => { byKind[c.meta.kind] = (byKind[c.meta.kind] || 0) + 1; });
  const manifest = { schema: SCHEMA, generator: 'sa-delivery:architecture-index-export', generator_version: pluginVersion(), generated_at: new Date().toISOString(),
    project: { key, name: a.name || key }, architecture: { version: a.version, status: a.status || null, released: a.released || null, language: a.language || 'en', type: a.type || null },
    channel, git, support: supportOf(root),
    embedding: { unit: 'chunk', max_chars: MAX_CHARS, text_field: 'text', id_field: 'id', hash_field: 'content_hash' },
    counts: { chunks: chunks.length, by_kind: byKind, buildpacks: packs.packs.length, skipped: packs.skipped.length },
    buildpacks: packs.packs.map((p) => ({ component: p.slug, path: `buildpacks/${p.slug}/pack.json`, parts: p.parts, open_questions: p.open_questions })),
    skipped: packs.skipped, warnings: uniq([...(facts.warnings || []), ...packs.warnings]),
    files: listFiles(out).map((f) => { const b = fs.readFileSync(path.join(out, f)); return { path: f, bytes: b.length, sha256: sha(b) }; }) };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
  // --previous <bundle>: what changed for each container since that bundle, shipped as changes.json (a server answers
  // what_changed for that pair from it, and for any other pair with the same comparison, diffBundles)
  if (opts.previous) {
    const d = diffBundles(path.resolve(opts.previous), out);
    fs.writeFileSync(path.join(out, 'changes.json'), JSON.stringify(d, null, 1) + '\n');
    manifest.changes = { from: d.from, to: d.to, path: 'changes.json', components: d.components.length, action_required: d.components.filter((c) => c.action_required).map((c) => c.component) };
    manifest.files = listFiles(out).filter((f) => f !== 'manifest.json').map((f) => { const b = fs.readFileSync(path.join(out, f)); return { path: f, bytes: b.length, sha256: sha(b) }; });
    fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
  }
  return { out, manifest };
}

// ---- the bundle held to its schema: what a server may assume
function checkBundle(dir) {
  dir = path.resolve(dir); const findings = []; const f = (where, text) => findings.push({ where, text });
  let m; try { m = JSON.parse(read(path.join(dir, 'manifest.json'))); } catch (e) { return { status: 'FAIL', findings: [{ where: 'manifest.json', text: `unreadable: ${e.message}` }] }; }
  if (m.schema !== SCHEMA) f('manifest.json', `schema ${m.schema}, expected ${SCHEMA}`);
  ['project', 'architecture', 'channel', 'files', 'counts'].forEach((k) => { if (m[k] == null) f('manifest.json', `missing ${k}`); });
  if (!['released', 'draft'].includes(m.channel)) f('manifest.json', `channel ${m.channel}`);
  (m.files || []).forEach((x) => { const p = path.join(dir, x.path); if (!fs.existsSync(p)) f(x.path, 'listed, not on disk'); else if (sha(fs.readFileSync(p)) !== x.sha256) f(x.path, 'sha256 differs from the manifest'); });
  const listed = new Set((m.files || []).map((x) => x.path)); fs.existsSync(dir) && listFiles(dir).filter((p) => p !== 'manifest.json' && !listed.has(p)).forEach((p) => f(p, 'on disk, not in the manifest'));
  const ids = new Set(); let n = 0;
  if (fs.existsSync(path.join(dir, 'chunks.jsonl'))) read(path.join(dir, 'chunks.jsonl')).split('\n').forEach((l, i) => { if (!l.trim()) return; n++; const w = `chunks.jsonl:${i + 1}`; let c; try { c = JSON.parse(l); } catch { f(w, 'not JSON'); return; }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(c.id || '')) f(w, 'id is not a UUID'); else if (ids.has(c.id)) f(w, `duplicate id ${c.id}`); else ids.add(c.id);
    if (!c.text) f(w, 'empty text'); else if (sha(c.text) !== c.content_hash) f(w, 'content_hash is not the text\'s');
    const mm = c.meta || {}; if (!KINDS.includes(mm.kind)) f(w, `kind ${mm.kind}`); if (mm.project !== (m.project || {}).key) f(w, `project ${mm.project}`);
    if (mm.architecture_version !== (m.architecture || {}).version) f(w, `architecture_version ${mm.architecture_version}`); if (!mm.file || !Array.isArray(mm.lines)) f(w, 'no file / lines');
    if (!Array.isArray(mm.components) || !Array.isArray(mm.adrs)) f(w, 'components / adrs not arrays'); });
  else f('chunks.jsonl', 'missing');
  if (m.counts && m.counts.chunks !== n) f('manifest.json', `counts.chunks ${m.counts.chunks}, chunks.jsonl has ${n}`);
  try { JSON.parse(read(path.join(dir, 'ledger.json'))); } catch { f('ledger.json', 'missing or not JSON'); }
  (m.buildpacks || []).forEach((b) => { let p; try { p = JSON.parse(read(path.join(dir, b.path))); } catch { f(b.path, 'missing or not JSON'); return; }
    const pd = path.dirname(path.join(dir, b.path)); const pids = new Set((p.parts || []).map((x) => x.id));
    (p.parts || []).forEach((x) => { const q = path.join(pd, x.path); if (!fs.existsSync(q)) f(b.path, `part ${x.id}: ${x.path} not on disk`); else if (sha(fs.readFileSync(q)) !== x.sha256) f(b.path, `part ${x.id}: sha256 differs`); });
    (p.plan || []).forEach((s) => s.parts.forEach((id) => { if (!pids.has(id)) f(b.path, `plan step ${s.step} names part ${id}, not in the pack`); }));
    if (!pids.has('spec')) f(b.path, 'no spec part'); if (!pids.has('security')) f(b.path, 'no security part'); if (p.architecture_version !== (m.architecture || {}).version) f(b.path, `architecture_version ${p.architecture_version}`); });
  return { status: findings.length ? 'FAIL' : 'PASS', chunks: n, buildpacks: (m.buildpacks || []).length, findings };
}


// ---- what changed for each component between two bundles: hashes, the ledger and the pack parts compared, nothing judged
function loadBundle(dir) {
  const m = JSON.parse(read(path.join(dir, 'manifest.json'))); const ledger = JSON.parse(read(path.join(dir, 'ledger.json')));
  const chunks = read(path.join(dir, 'chunks.jsonl')).split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const packs = Object.fromEntries((m.buildpacks || []).map((b) => [b.component, JSON.parse(read(path.join(dir, b.path)))]));
  const packDirs = Object.fromEntries((m.buildpacks || []).map((b) => [b.component, path.join(dir, path.dirname(b.path))]));
  return { m, ledger, chunks, packs, packDirs };
}
const revisionOf = (b, slug) => { const f = (b.m.files || []).find((x) => x.path === `buildpacks/${slug}/pack.json`); return f ? f.sha256 : null; };
const setDiff = (a, b, key, same) => { const A = new Map(a.map((x) => [key(x), x])), B = new Map(b.map((x) => [key(x), x]));
  return { added: [...B.keys()].filter((k) => !A.has(k)), removed: [...A.keys()].filter((k) => !B.has(k)), changed: [...B.keys()].filter((k) => A.has(k) && !same(A.get(k), B.get(k))) }; };
const anyOf = (d) => d.added.length + d.removed.length + d.changed.length > 0;
// the flows a container takes part in, from a ledger: the phases whose Hops name it, the flows that run those phases
function flowsOf(ledger, slug) {
  const slugOf = resolver(ledger); const mine = (ledger.phases || []).filter((p) => hopNames(p.hops).map(slugOf).includes(slug));
  return (ledger.flows || []).filter((f) => (f.phases || []).some((n) => mine.some((p) => p.n === n))).map((f) => ({ code: f.code, name: f.name, use_cases: f.use_cases, latency_target: f.latency_target, governed_by: f.governed_by || [],
    phases: (f.phases || []).map((n) => mine.find((p) => p.n === n)).filter(Boolean).map((p) => ({ n: p.n, name: p.name, hops: p.hops, latency_budget: p.latency_budget })) }));
}
// a part's substance: its text with every link target and the architecture's own version masked, and the specification's technical
// debt table out — a release restamps every part, a pack relinks to where its parts are packed (10.10.3), and the debt table is code's
// from the descriptor, reported as technical_debt; none is a change the developer acts on. Read from the bundle on disk; a bundle held
// in memory compares bytes alone
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DEBT_BLOCK = /^#{3,4}\s.*<!--\s*LABEL:\s*Technical Debt\s*-->[\s\S]*?(?=^#{2,4}\s|^-{3,}[ \t]*$|$(?![\s\S]))/m;
const substance = (t, v) => { t = String(t).replace(/\r\n?/g, '\n').replace(DEBT_BLOCK, '').replace(/\]\([^)\s]*\)/g, '](·)'); return v ? t.replace(new RegExp(`\\bv?${escRe(v)}\\b`, 'g'), '·') : t; };
const partText = (b, slug, p) => { const d = (b.packDirs || {})[slug]; if (!d || !p.path) return null; const f = path.join(d, p.path); return fs.existsSync(f) ? read(f) : null; };
const anyDebt = (d) => !!d && (d.added.length + d.removed.length + d.status.length) > 0;
function componentChanges(o, n, slug) {
  const oc = (o.ledger.components || []).find((c) => c.slug === slug), nc = (n.ledger.components || []).find((c) => c.slug === slug);
  const r = { component: slug, name: (nc || oc).name, status: !oc ? 'added' : !nc ? 'removed' : 'present', facts: [], contracts: null, interfaces: null, adrs: null, documents: [], flows: [], integrations: null, sections: null, open_questions: null, technical_debt: null };
  if (oc && nc) for (const k of ['name', 'type', 'technology', 'internal_name', 'component_version', 'system']) if (JSON.stringify(oc[k] ?? null) !== JSON.stringify(nc[k] ?? null)) r.facts.push({ field: k, from: oc[k] ?? null, to: nc[k] ?? null });
  const op = o.packs[slug], np = n.packs[slug];
  // a pack's revision is the sha256 of its pack.json in the manifest — pack.json lists every part's hash, so any part moving moves it
  r.pack_revision = { from: op ? revisionOf(o, slug) : null, to: np ? revisionOf(n, slug) : null };
  r.pack = op && np ? 'present' : np ? 'added' : op ? 'removed' : 'absent';
  r.pack_revised = r.pack === 'present' && r.pack_revision.from !== r.pack_revision.to;
  if (op || np) {
    const parts = (p, kind) => (p ? p.parts.filter((x) => x.kind === kind) : []);
    const ov = o.m.architecture.version, nv = n.m.architecture.version; r.restamped = [];
    // bytes moved, substance did not: restamped, listed and never an action
    const byHash = (a, b) => { if (a.sha256 === b.sha256) return true; const ta = partText(o, slug, a), tb = partText(n, slug, b);
      const same = ta != null && tb != null && substance(ta, ov) === substance(tb, nv); if (same && !r.restamped.includes(b.title)) r.restamped.push(b.title); return same; };
    r.contracts = setDiff(parts(op, 'asset'), parts(np, 'asset'), (x) => x.title, byHash);
    r.interfaces = setDiff(parts(op, 'interface'), parts(np, 'interface'), (x) => x.id.replace(/^interface:/, ''), byHash);
    r.adrs = setDiff(parts(op, 'adr'), parts(np, 'adr'), (x) => x.id.replace(/^adr:/, ''), byHash);
    for (const [id, label] of [['spec', 'Component Specification'], ['security', 'Security Obligations'], ['cross-cutting-standards', 'Cross-Cutting Standards'], ['runtime-view', 'System Runtime View'], ['instructions', 'Build instructions']]) {
      const a = op && op.parts.find((x) => x.id === id), b = np && np.parts.find((x) => x.id === id); if (a && b && !byHash(a, b)) r.documents.push(label); }
    const q = (p, v) => (p ? p.open_questions.map((x) => ({ ...x, key: `${x.part}\u0000${substance(x.text, v)}` })) : []);
    const oq = q(op, ov), nq = q(np, nv); r.open_questions = { new: nq.filter((x) => !oq.some((y) => y.key === x.key)).map(({ key, ...x }) => x), resolved: oq.filter((x) => !nq.some((y) => y.key === x.key)).map(({ key, ...x }) => x) };
  }
  // the flows it takes part in, from each version's ledger — a budget moves with or without a build pack
  const fl = (p) => (p === 'old' ? flowsOf(o.ledger, slug) : flowsOf(n.ledger, slug));
  const of = new Map(fl('old').map((f) => [f.code, f]));
  fl('new').forEach((f) => { const b = of.get(f.code); if (!b) { r.flows.push({ flow: f.code, name: f.name, change: 'joined' }); return; }
    const d = []; if (b.latency_target !== f.latency_target) d.push({ field: 'latency_target', from: b.latency_target, to: f.latency_target });
    const bp = new Map(b.phases.map((p) => [p.n, p])); f.phases.forEach((p) => { const q = bp.get(p.n); if (!q) d.push({ field: `phase ${p.n}`, from: null, to: p.name }); else { if (q.latency_budget !== p.latency_budget) d.push({ field: `phase ${p.n} latency_budget`, from: q.latency_budget, to: p.latency_budget }); if (q.hops !== p.hops) d.push({ field: `phase ${p.n} hops`, from: q.hops, to: p.hops }); } });
    b.phases.filter((q) => !f.phases.some((p) => p.n === q.n)).forEach((q) => d.push({ field: `phase ${q.n}`, from: q.name, to: null }));
    if (d.length) r.flows.push({ flow: f.code, name: f.name, change: 'changed', fields: d }); });
  fl('old').filter((f) => !fl('new').some((x) => x.code === f.code)).forEach((f) => r.flows.push({ flow: f.code, name: f.name, change: 'left' }));
  const names = new Set([oc && oc.name, nc && nc.name].filter(Boolean));
  const ints = (l) => (l.integrations || []).filter((i) => names.has(i.from) || names.has(i.to));
  const IF = ['from', 'to', 'protocol', 'pattern', 'boundary', 'retired'];
  r.integrations = setDiff(ints(o.ledger), ints(n.ledger), (i) => i.id, (a, b) => IF.every((k) => JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null)));
  const oi = new Map(ints(o.ledger).map((i) => [i.id, i])), ni = new Map(ints(n.ledger).map((i) => [i.id, i]));
  r.integrations.fields = r.integrations.changed.flatMap((id) => IF.filter((k) => JSON.stringify(oi.get(id)[k] ?? null) !== JSON.stringify(ni.get(id)[k] ?? null)).map((k) => ({ integration: id, field: k, from: oi.get(id)[k] ?? null, to: ni.get(id)[k] ?? null })));
  // its technical debt (10.9.2): the TDRs its descriptor's **Technical Debt:** line names, with their status — the workaround the code
  // keeps, or the one it may now drop; a bundle written before 10.8.0 carries no `tdrs` and reads as none. And the records that name it
  // in affected-components (10.10.13): a resolved one leaves the line, so a TDR opened and closed between the two releases, or one
  // resolved since, reads as added or as a status move rather than not at all; a ledger without `components` reads the line alone
  const debt = (l, c) => { if (!c) return []; const st = new Map((l.tdrs || []).map((t) => [t.id, t]));
    const ids = [...new Set([...(c.tdrs || []), ...(l.tdrs || []).filter((t) => (t.components || []).some((x) => x === c.name || x === c.slug)).map((t) => t.id)])];
    return ids.map((id) => ({ id, title: (st.get(id) || {}).title || null, status: (st.get(id) || {}).status || null })); };
  const od = debt(o.ledger, oc), nd = debt(n.ledger, nc);
  r.technical_debt = { added: nd.filter((t) => !od.some((x) => x.id === t.id)), removed: od.filter((t) => !nd.some((x) => x.id === t.id)),
    status: nd.flatMap((t) => { const x = od.find((y) => y.id === t.id); return x && x.status !== t.status ? [{ id: t.id, title: t.title, from: x.status, to: t.status }] : []; }) };
  const ch = (b) => b.chunks.filter((c) => (c.meta.components || []).includes(slug));
  const sd = setDiff(ch(o), ch(n), (c) => c.id, (a, b) => a.content_hash === b.content_hash);
  const where = (b, id) => { const c = b.chunks.find((x) => x.id === id); return { file: c.meta.file, title: c.meta.title, kind: c.meta.kind }; };
  r.sections = { added: sd.added.map((id) => where(n, id)), removed: sd.removed.map((id) => where(o, id)), changed: sd.changed.map((id) => where(n, id)) };
  r.changed = r.status !== 'present' || r.facts.length > 0 || [r.contracts, r.interfaces, r.adrs, r.integrations, r.sections].some((d) => d && anyOf(d)) || r.documents.length > 0 || r.flows.length > 0 || anyDebt(r.technical_debt) || ['added', 'removed'].includes(r.pack) || r.pack_revised || !!(r.open_questions && (r.open_questions.new.length || r.open_questions.resolved.length));
  // what the developer must act on: the code-facing parts moved — the contracts, an interface or an integration row naming it, its name / type / technology /
  // internal name, a budget, its spec. A component version alone is listed, not an action: it moves with any edit of the descriptor
  r.action_required = r.status === 'removed' || r.facts.some((f) => ['name', 'type', 'technology', 'internal_name'].includes(f.field)) || !!(r.contracts && anyOf(r.contracts)) || !!(r.interfaces && anyOf(r.interfaces)) || anyOf(r.integrations) || r.flows.length > 0 || r.documents.includes('Component Specification') || r.documents.includes('Security Obligations');
  return r;
}
function diffBundles(oldDir, newDir, opts = {}) {
  const o = typeof oldDir === 'string' ? loadBundle(oldDir) : oldDir, n = typeof newDir === 'string' ? loadBundle(newDir) : newDir;
  if (o.m.project.key !== n.m.project.key) throw new Error(`bundles of two projects: ${o.m.project.key} and ${n.m.project.key}`);
  const slugs = uniq([...(o.ledger.components || []), ...(n.ledger.components || [])].filter((c) => c.level === 'L2').map((c) => c.slug)).sort();
  if (opts.component && !slugs.includes(opts.component)) throw new Error(`${opts.component} is a container of neither version`);
  const components = (opts.component ? [opts.component] : slugs).map((s) => componentChanges(o, n, s));
  // the same version twice: the server holds a released version and a second publish replaced packs — only the packs can differ
  return { schema: `${SCHEMA}#changes`, project: n.m.project.key, from: o.m.architecture.version, to: n.m.architecture.version, same_version: o.m.architecture.version === n.m.architecture.version, components: opts.all ? components : components.filter((c) => c.changed || opts.component) };
}
function renderChanges(d) {
  const L = [d.same_version ? `# What changed — ${d.project} ${d.to}, build packs revised` : `# What changed — ${d.project} ${d.from} → ${d.to}`, ''];
  if (!d.components.length) L.push('No container changed.');
  const list = (label, x) => { if (x && anyOf(x)) L.push(`- ${label}: ${[x.added.length ? `added ${x.added.join(', ')}` : '', x.removed.length ? `removed ${x.removed.join(', ')}` : '', x.changed.length ? `changed ${x.changed.join(', ')}` : ''].filter(Boolean).join(' · ')}`); };
  d.components.forEach((c) => {
    L.push(`## ${c.name} (\`${c.component}\`)${c.action_required ? ' — action required' : ''}`, '');
    if (c.status !== 'present') L.push(`- the container was ${c.status}`);
    c.facts.forEach((f) => L.push(`- ${f.field}: ${JSON.stringify(f.from)} → ${JSON.stringify(f.to)}`));
    if (c.pack === 'added' || c.pack === 'removed') L.push(`- build pack ${c.pack}`);
    if (c.pack_revised && d.same_version) L.push(`- build pack replaced: revision ${c.pack_revision.from.slice(0, 12)} → ${c.pack_revision.to.slice(0, 12)}`);
    list('contracts', c.contracts); list('interfaces', c.interfaces); list('ADRs', c.adrs); list('integrations', c.integrations);
    ((c.integrations || {}).fields || []).forEach((f) => L.push(`  - ${f.integration} ${f.field}: ${f.from ?? '—'} → ${f.to ?? '—'}`));
    if (c.documents.length) L.push(`- documents: ${c.documents.join(', ')}`);
    if (c.restamped && c.restamped.length) L.push(`- restamped — version, links or the debt table only: ${c.restamped.join(', ')}`);
    const td = c.technical_debt; if (anyDebt(td)) L.push(`- technical debt: ${[...td.added.map((t) => `added ${t.id}${t.title ? ` — ${t.title}` : ''}${t.status ? ` (${t.status})` : ''}`), ...td.status.map((t) => `${t.id} ${t.from} → ${t.to}`), ...td.removed.map((t) => `no longer names ${t.id}`)].join(' · ')}`);
    c.flows.forEach((f) => L.push(`- flow ${f.flow}. ${f.name}: ${f.change}${f.fields ? ` — ${f.fields.map((x) => `${x.field} ${x.from ?? '—'} → ${x.to ?? '—'}`).join('; ')}` : ''}`));
    if (c.sections && anyOf(c.sections)) L.push(`- sections naming it: ${c.sections.added.length} added, ${c.sections.changed.length} changed, ${c.sections.removed.length} removed — ${[...c.sections.added, ...c.sections.changed].map((x) => x.title).slice(0, 8).join('; ')}`);
    if (c.open_questions) { if (c.open_questions.new.length) L.push(`- new open questions: ${c.open_questions.new.length}`); if (c.open_questions.resolved.length) L.push(`- open questions resolved: ${c.open_questions.resolved.length}`); }
    L.push('');
  });
  return L.join('\n').trimEnd() + '\n';
}

module.exports = { exportIndex, checkBundle, diffBundles, renderChanges, loadBundle, segment, chunksOf, buildPacks, uuidOf, SCHEMA, MAX_CHARS };

if (require.main === module) {
  const args = process.argv.slice(2); const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  if (args.includes('--diff')) {
    const i = args.indexOf('--diff'); const [a, b] = [args[i + 1], args[i + 2]]; if (!a || !b) { console.error('Usage: bun export-index.js --diff <older_bundle> <newer_bundle> [--component <slug>] [--json]'); process.exit(2); }
    try { const d = diffBundles(a, b, { component: val('--component') }); console.log(json ? JSON.stringify(d, null, 1) : renderChanges(d)); process.exit(0); } catch (e) { console.error(`export-index: ${e.message}`); process.exit(2); }
  }
  if (args.includes('--check')) {
    const dir = val('--check'); if (!dir) { console.error('Usage: bun export-index.js --check <bundle_dir> [--json]'); process.exit(2); }
    const r = checkBundle(dir); console.log(json ? JSON.stringify(r, null, 1) : `${r.findings.map((x) => `  ✗ ${x.where}: ${x.text}`).join('\n')}${r.findings.length ? '\n' : ''}bundle: ${r.chunks} chunks, ${r.buildpacks} build packs — ${r.status}`);
    process.exit(r.status === 'PASS' ? 0 : 1);
  }
  const flagged = new Set(['--out', '--project-key', '--server', '--previous', '--sa-skills']); const root = args.find((x, i) => !x.startsWith('--') && !flagged.has(args[i - 1]));
  if (!root) { console.error('Usage: bun export-index.js <project> [--out <dir>] [--project-key <key>] [--server <mcp_url>] [--previous <bundle>] [--no-kit-check] [--json]'); process.exit(2); }
  try {
    const { out, manifest: m } = exportIndex(root, { out: val('--out'), projectKey: val('--project-key'), server: val('--server'), previous: val('--previous'), draft: args.includes('--draft'), kitCheck: args.includes('--no-kit-check') ? false : undefined });
    const chk = checkBundle(out);
    if (json) console.log(JSON.stringify({ out, manifest: { ...m, files: m.files.length }, check: chk.status }, null, 1));
    else {
      console.log(`index: ${m.project.key} ${m.architecture.version} (${m.channel}) → ${path.relative(process.cwd(), out) || out}`);
      console.log(`  chunks: ${m.counts.chunks} (${Object.entries(m.counts.by_kind).map(([k, v]) => `${k} ${v}`).join(', ')})`);
      console.log(`  build packs: ${m.counts.buildpacks}${m.buildpacks.length ? ` — ${m.buildpacks.map((b) => `${b.component} (${b.parts} parts${b.open_questions ? `, ${b.open_questions} open questions` : ''})`).join(', ')}` : ''}`);
      m.skipped.forEach((s) => console.log(`  skipped ${s.component}: ${s.reason}`));
      m.warnings.forEach((w) => console.log(`  warning: ${w}`));
      console.log(`  check: ${chk.status}${chk.findings.length ? '\n' + chk.findings.map((x) => `  ✗ ${x.where}: ${x.text}`).join('\n') : ''}`);
    }
    process.exit(chk.status === 'PASS' ? 0 : 1);
  } catch (e) { console.error(`export-index: ${e.message}`); process.exit(2); }
}
