#!/usr/bin/env bun
// handoff-prepare.js — the handoff kit's three payload shapes, assembled by code.
//
// Replaces the `handoff-context-builder` agent (retired 8.23.0): bundling the corpus into the run payload,
// the per-edge payloads and the per-component payloads is verbatim routing — a table lifted whole, a
// block sliced by heading, an id matched by rule — and a model pass over it read 79 files in 134 turns
// (61 M cached tokens on the reference project) to do what this script does in under a second.
//
//   bun handoff-prepare.js <project_root> --components <all|slug,slug,…> [--force] [--date YYYY-MM-DD]
//       [--out <payload_dir>] [--handoffs <dir>] [--template-version 4.0.0] [--schema-version 4] [--json]
//       [--judge agent|typesafe|clef] [--judge-answers <which.json>] [--judge-also-answers <also.json>] [--verify <fixtures.json>]
//
// Reads: the facts ledger (arch-facts.js: architecture, components, ADRs, integrations, flows, phases),
// docs/04 (the flow anchors, the declared latency budgets), docs/05 (the `I-nn` blocks), the descriptors of
// the selected components and of every edge endpoint (their Communication tables), the latest
// analysis/LATENCY_BUDGET-*, BLAST_RADIUS-* (or BLAST-RADIUS-*), COUPLING-*, and every institutional ADR
// (001–100). Nothing compliance writes: the kit is independent of compliance.
// Writes: <payload_dir>/_run.md, <payload_dir>/seams/<up>→<down>.md, <payload_dir>/<slug>.md and
// <payload_dir>/context-result.json; prints the CONTEXT_RESULT block (YAML, or JSON under --json) on stdout
// and the review on stderr — gates, warnings, edge cross-checks, unresolved and undecided endpoints, decisions.
//
// Panels (8.24.0 — the storyboard's frames): every phase's `sequenceDiagram` of docs/04 verbatim into the run
// payload, and per seam / per component a cut of the docs/03 container diagram (the pair's two nodes and
// their edges; the component's one-hop neighbourhood) — parsed and re-emitted, never authored, linted by
// mermaid-check.js before it ships.
//
// Everything is verbatim or a rule. Absent is never empty: a missing source renders as
// `[NOT DOCUMENTED — …]` with the command that produces it. Section names are the ones the generators
// locate (PAYLOAD_SCHEMA.md); the component payload uses the schema's `## Component File (raw)` form.
'use strict';
const fs = require('fs');
const path = require('path');

const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-delivery reads the architecture through sa-skills
const { resolveNames, verifyResolutions } = require(fromSaSkills('scripts', 'resolve-name.js'));
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));
const { removeHeader } = require(fromSaSkills('scripts', 'shared', 'header-detector.ts'));
const { hashPayload, loadManifest, saveManifest, shouldSkip, restampVersion } = require(path.join(__dirname, '..', 'utils', 'manifest.ts'));
const { editBaselines } = require(path.join(__dirname, 'kit-edit.js'));

const TEMPLATE_VERSION = '4.3.1', SCHEMA_VERSION = '4';
const { blocksOf, lint } = require(fromSaSkills('scripts', 'shared', 'mermaid-check.js'));
const { integrationHead } = require(fromSaSkills('scripts', 'shared', 'integration-head.js'));
const rowLabels = require(path.join(__dirname, 'row-labels.js'));   // the closed EN↔ES row-label list each payload carries (8.111.0)
const GOVERNED = !!require(fromSaSkills('scripts', 'shared', 'packs.js')).designLanguageDir();   // the folder in force — an institution pack's, else the base's own (scripts/shared/packs.js);  // optional: the Design Language Standard; absent, fallback mode
const ND = (what, cmd) => `[NOT DOCUMENTED — ${what}${cmd ? '; run ' + cmd : ''}]`;

// ---------- text helpers
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const exists = (p) => { try { return fs.existsSync(p); } catch { return false; } };
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/~~/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const lines = (s) => String(s || '').split('\n');
const isRow = (l) => /^\s*\|/.test(l);
const isSep = (l) => /^\s*\|?\s*:?-{3,}/.test(l);
const cells = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
const anchor = (h) => plain(h).toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-');   // GitHub: one hyphen per space, punctuation dropped
const adrIds = (s) => [...new Set((String(s || '').match(/ADR-\d{3}/g) || []))];
const latest = (dir, re) => { if (!exists(dir)) return null; const f = fs.readdirSync(dir).filter((n) => re.test(n)).sort().reverse()[0]; return f ? path.join(dir, f) : null; };
const rel = (from, to) => path.relative(from, to).split(path.sep).join('/');
// relative while the payload is inside the project — however deep (a seam's folder is one level below the others, and its links
// came out absolute, so its hash held the checkout path); a payload written outside the project links absolutely
// the descriptor's **Technical Debt:** line stays out of the payload: § 7's debt table is code's (kit-debt.js), and a release that only
// records debt must not move the payload — the specification is kept, never sent to the model for it (10.10.2)
const DEBT_LINE = /^\*\*(?:Technical Debt|Deuda T[ée]cnica):\*\*.*\n?/gim;
const link = (from, to, root) => { const up = path.relative(root, from); return up.startsWith('..') || path.isAbsolute(up) ? to : rel(from, to); };

/** Every table in a markdown source: { heading, headers, rows (raw lines), start } — heading = nearest heading above. */
function tables(src) {
  const ls = lines(src), out = []; let heading = null;
  for (let i = 0; i < ls.length; i++) {
    const h = ls[i].match(/^#{1,6}\s+(.+)$/); if (h) { heading = plain(h[1]); continue; }
    if (isRow(ls[i]) && ls[i + 1] && isSep(ls[i + 1])) { const rows = []; let j = i + 2; while (j < ls.length && isRow(ls[j])) rows.push(ls[j++]); out.push({ heading, header: ls[i], sep: ls[i + 1], headers: cells(ls[i]).map(plain), rows, start: i }); i = j - 1; }
  }
  return out;
}
/** Body of the first section whose heading matches `re`, up to the next heading of the same or higher level. */
function section(src, re) {
  const ls = lines(src);
  for (let i = 0; i < ls.length; i++) { const h = ls[i].match(/^(#{1,6})\s+(.+)$/); if (!h || !re.test(plain(h[2]))) continue; const lvl = h[1].length; const body = []; for (let j = i + 1; j < ls.length; j++) { const hh = ls[j].match(/^(#{1,6})\s+/); if (hh && hh[1].length <= lvl) break; body.push(ls[j]); } return { heading: plain(h[2]), body: body.join('\n').trim() }; }
  return null;
}
/** A label block — `**Label:**` … up to the next `**Label:**` or heading — e.g. the Inbound / Outbound halves of a Communication section. */
function labelBlock(body, re) {
  const ls = lines(body); let on = false; const out = [];
  for (const l of ls) { const m = l.match(/^\*\*([^*]+?)\*\*\s*:?\s*(<!--.*-->)?\s*$/) || l.match(/^\*\*([^*]+?):\*\*/); if (m) { if (on) break; on = re.test(plain(m[1])); continue; } if (/^#{1,6}\s/.test(l)) { if (on) break; continue; } if (on) out.push(l); }
  return on ? out.join('\n').trim() : null;
}
const tableOf = (text) => { const t = tables(text); return t.length ? t[0] : null; };
const rowsWith = (tb, names) => tb ? tb.rows.filter((r) => names.some((n) => norm(r).includes(norm(n)))) : [];
const renderRows = (tb, rows) => `${tb.header}\n${tb.sep}\n${rows.join('\n')}`;

// ---------- panels: mermaid fences and the flowchart cutter
const fences = (text) => [...String(text || '').matchAll(/```mermaid[^\n]*\n([\s\S]*?)\n```/g)].map((m) => m[1]);
/** Parse a flowchart: head lines (init, comments, keyword, classDefs), a subgraph tree of node declarations, edges, class lines. */
function parseFlowchart(src) {
  const ls = lines(src); const root = { id: null, open: null, items: [] }; const stack = [root]; const nodes = {}; const edges = []; const classLines = []; const head = []; let inInit = false, started = false;
  const ID = '[A-Za-z0-9_]+';
  for (const raw of ls) { const l = raw.trim();
    if (inInit) { head.push(raw); if (/\}%%/.test(l)) inInit = false; continue; }
    if (/^%%\{/.test(l) && !/\}%%/.test(l)) { inInit = true; head.push(raw); continue; }
    if (!l) continue;
    if (/^%%/.test(l) || /^(flowchart|graph)\b/.test(l) || /^classDef\b/.test(l)) { head.push(raw); continue; }
    if (/^linkStyle\b/.test(l)) continue;   // indices change in a cut
    const sg = l.match(new RegExp('^subgraph\\s+(' + ID + ')(.*)$')); if (sg) { const node = { id: sg[1], open: l, items: [] }; stack[stack.length - 1].items.push(node); stack.push(node); started = true; continue; }
    if (/^end$/.test(l)) { if (stack.length > 1) stack.pop(); continue; }
    const cl = l.match(/^class\s+([^\s]+)\s+([^\s;]+);?$/); if (cl) { classLines.push({ ids: cl[1].split(','), cls: cl[2] }); continue; }
    const st = l.match(new RegExp('^style\\s+(' + ID + ')\\s')); if (st) { (nodes[st[1]] || (nodes[st[1]] = { id: st[1], styles: [] })).styles = [...((nodes[st[1]] || {}).styles || []), l]; continue; }
    const ed = l.match(new RegExp('^(' + ID + ')\\s*((?:<)?(?:-{2,}|={2,}|-\\.+-?)(?:>|x|o)?(?:\\|[^|]*\\|)?|-{2}\\s*"[^"]*"\\s*-{2,}>?|={2}\\s*"[^"]*"\\s*={2,}>?|-\\.\\s*"[^"]*"\\s*\\.->?)\\s*(' + ID + ')\\s*$')); if (ed) { edges.push({ a: ed[1], b: ed[3], line: l }); started = true; continue; }
    const nd = l.match(new RegExp('^(' + ID + ')\\s*([\\[\\(\\{>].*)$')); if (nd) { const q = nd[2].match(/"([^"]*)"/); const label = plain((q ? q[1] : nd[2].replace(/^[\[\(\{>]+|[\]\)\}]+$/g, '')).split(/<br\s*\/?>/i)[0]); const n = nodes[nd[1]] || (nodes[nd[1]] = { id: nd[1], styles: [] }); n.decl = l; n.label = label; stack[stack.length - 1].items.push(n); started = true; continue; }
    if (!started) head.push(raw);   // anything else before the first element rides along
  }
  return { head, root, nodes, edges, classLines };
}
/** Re-emit a parsed flowchart keeping only `keep` node ids: subgraphs that hold one, edges between two, class lines filtered. */
function emitFlowchart(g, keep, note) {
  const out = [...g.head]; if (note) out.push(`%% ${note}`);
  const walk = (node, depth) => { const kids = node.items.filter((it) => it.items ? holds(it) : keep.has(it.id)); if (!kids.length) return;
    const pad = '  '.repeat(depth); if (node.id) out.push(`${pad}${node.open}`);
    kids.forEach((it) => { if (it.items) walk(it, depth + 1); else out.push(`${pad}  ${it.decl}`); });
    if (node.id) out.push(`${pad}end`); };
  const holds = (sg) => sg.items.some((it) => it.items ? holds(it) : keep.has(it.id));
  walk(g.root, 0);
  g.edges.filter((e) => keep.has(e.a) && keep.has(e.b)).forEach((e) => out.push(`  ${e.line}`));
  Object.values(g.nodes).filter((n) => keep.has(n.id) && n.styles && n.styles.length).forEach((n) => n.styles.forEach((s) => out.push(`  ${s}`)));
  g.classLines.forEach((c) => { const ids = c.ids.filter((id) => keep.has(id)); if (ids.length) out.push(`  class ${ids.join(',')} ${c.cls};`); });
  return out.join('\n');
}
/** Lint a cut with the diagram gate; null when clean, else the first finding. */
const lintCut = (src) => { const b = blocksOf('#### Diagram: Panel\n\n```mermaid\n' + src + '\n```\n')[0]; const r = lint(b, { governed: GOVERNED }); return r.findings.length ? `${r.findings[0].rule}: ${r.findings[0].text}` : null; };

// ---------- main
async function prepare(root, opts = {}) {
  root = path.resolve(root);
  const today = opts.date || new Date().toISOString().slice(0, 10);
  const templateVersion = opts.templateVersion || TEMPLATE_VERSION, schemaVersion = opts.schemaVersion || SCHEMA_VERSION;
  const payloadDir = path.resolve(root, opts.out || path.join('.cache', 'sa-skills', 'handoff-payloads'));
  const handoffsDir = path.resolve(root, opts.handoffs || 'handoffs');
  const manifestPath = path.join(handoffsDir, '.manifest.json');
  const report = { status: 'OK', warnings: [], edge_cross_check_warnings: [], unresolved_endpoints: [], undecided_endpoints: [], endpoint_review: [], read: { shared_docs: [], analyses: [], institutional_adrs: 0, component_files: 0 }, notes: [] };
  const warn = (m) => report.warnings.push(m);

  // ---- facts
  const facts = collect(root);
  const arch = facts.architecture || {};
  const archPath = path.join(root, 'ARCHITECTURE.md');
  const projectName = arch.name || path.basename(root), architect = arch.architect || 'Not specified', archVersion = arch.version || 'unversioned', lang = arch.language || 'en';
  const comps = facts.components || [];
  const l2 = comps.filter((c) => c.level === 'L2');
  const bySlug = Object.fromEntries(comps.map((c) => [c.slug, c]));
  const compFile = (c) => (c && c.file_backed && c.file) ? path.join(root, c.file) : null;
  const fileCache = {}; const compSrc = (c) => { const p = compFile(c); if (!p) return ''; if (!(p in fileCache)) { fileCache[p] = exists(p) ? read(p) : ''; report.read.component_files++; } return fileCache[p]; };

  // ---- selection
  const wanted = opts.components === 'all' || !opts.components ? l2.filter((c) => c.file_backed).map((c) => c.slug) : String(opts.components).split(',').map((s) => s.trim()).filter(Boolean);
  const selected = [], rejected = [];
  wanted.forEach((s) => { const c = bySlug[s]; if (!c) rejected.push(`${s}: no such component`); else if (c.level !== 'L2') rejected.push(`${s}: not a C4 L2 container (${c.level})`); else if (!c.file_backed) rejected.push(`${s}: declared only in a Containers table — no descriptor file to hand off`); else selected.push(c); });
  rejected.forEach((r) => warn(`component skipped — ${r}`));
  const idxNum = (c) => (c.index || '').split('.').map(Number);
  selected.sort((a, b) => { const x = idxNum(a), y = idxNum(b); return (x[0] || 0) - (y[0] || 0) || (x[1] || 0) - (y[1] || 0) || a.slug.localeCompare(b.slug); });

  // ---- gates
  const d05 = path.join(root, 'docs', '05-integration-points.md');
  const integrations = (facts.integrations || []).filter((i) => !i.retired), retired = (facts.integrations || []).filter((i) => i.retired);
  if (!exists(d05) || !integrations.length) { report.status = 'FAILED'; report.abort_reason = 'docs/05-integration-points.md missing or empty. Interface Contracts require an edge list. Run /sa-skills:architecture-docs to generate. Aborting.'; return { report, payload_dir: payloadDir }; }
  const aDir = path.join(root, 'analysis');
  const latencyFile = latest(aDir, /^LATENCY[_-]BUDGET-.*\.md$/i), blastFile = latest(aDir, /^BLAST[_-]RADIUS-.*\.md$/i), couplingFile = latest(aDir, /^COUPLING-.*\.md$/i);
  if (!latencyFile) warn('Latency Budget analysis not found — Runtime View will render budget rows as [NOT DOCUMENTED]. Recommend: /sa-analysis:architecture-analysis latency-budget');
  if (!blastFile) warn('Blast Radius analysis not found — seam failure semantics will render as [NOT DOCUMENTED]. Recommend: /sa-analysis:architecture-analysis blast-radius');

  // ---- shared docs
  const docFile = (prefix) => { const d = path.join(root, 'docs'); if (!exists(d)) return null; const f = fs.readdirSync(d).find((n) => n.startsWith(prefix) && n.endsWith('.md')); return f ? path.join(d, f) : null; };
  const d04 = docFile('04-'); const src04 = d04 ? read(d04) : ''; const src05 = read(d05);
  ['01-', '03-', '04-', '05-', '06-', '07-', '08-', '09-'].forEach((p) => { const f = docFile(p); if (f) report.read.shared_docs.push(rel(root, f)); });
  const latencySrc = latencyFile ? read(latencyFile) : '', blastSrc = blastFile ? read(blastFile) : '', couplingSrc = couplingFile ? read(couplingFile) : '';
  [latencyFile, blastFile, couplingFile].forEach((f) => { if (f) report.read.analyses.push(rel(root, f)); });

  // ---- institutional ADRs (001–100): title, status, file, Decision excerpt
  const adrExcerpt = (a, cap) => { const p = path.join(root, a.file); if (!exists(p)) return null; const s = section(read(p), /^(\d+\.\s*)?(decisi[oó]n|decision)\b/i); if (!s) return null;
    const paras = s.body.split(/\n\s*\n/).map((x) => x.trim()).filter((x) => x && !/^#{1,6}\s/.test(x) && !isRow(x) && !/^<!--/.test(x));   // prose only: no sub-heading, no table, no comment
    let out = ''; for (const q of paras) { if (out && (out + q).length > cap) break; out += (out ? '\n\n' : '') + q; if (out.length >= cap) break; } if (out.length > cap) out = out.slice(0, cap).replace(/\s+\S*$/, '') + ' …'; return out || null; };
  const adrNum = (id) => parseInt(id.replace(/\D/g, ''), 10);
  const allAdrs = facts.adrs || [];
  const institutional = allAdrs.filter((a) => adrNum(a.id) <= 100).sort((a, b) => adrNum(a.id) - adrNum(b.id));
  report.read.institutional_adrs = institutional.length;
  const adrById = Object.fromEntries(allAdrs.map((a) => [a.id, a]));
  const adrEntry = (id, cap, from) => { const a = adrById[id]; if (!a) return `- ${id} — ${ND('not on disk under adr/')}`; const ex = adrExcerpt(a, cap); return `- ${id} — ${a.title} — ${a.status || 'Not documented'} — [${a.file}](${link(from, path.join(root, a.file), root)})\n  ${ex ? ex.replace(/\n/g, '\n  ') : ND('no Decision section in the ADR')}`; };

  // ---- docs/05 blocks: a head (integration-head.js — `**I-nn — title**`, a compound `**I-19 e I-20 — …**`, a retired
  // `**I-11 — retirada**, …` with its body inline) … until the next head / heading; a compound block is registered under each id
  const blocks05 = {}; { const ls = lines(src05); let cur = null, buf = []; const flush = () => { if (cur) cur.ids.forEach((id) => { blocks05[id] = { title: cur.title, text: buf.join('\n').trim() }; }); };
    ls.forEach((l) => { const h = integrationHead(l); if (h) { flush(); cur = { ids: h.ids, title: plain(h.title) }; buf = [l]; return; } if (/^#{1,6}\s/.test(l)) { flush(); cur = null; buf = []; return; } if (cur) buf.push(l); }); flush(); }
  const inv = tables(src05).find((t) => t.headers.some((h) => /^(#|id)$/i.test(h)) && t.rows.some((r) => /\|\s*~*I-\d+/i.test(r)));
  const invRow = (id) => inv ? inv.rows.find((r) => new RegExp('^\\s*\\|\\s*~*' + id + '\\b', 'i').test(r)) : null;

  // ---- endpoint resolution: a docs/05 cell names one or more components. Which one is a judgement through scripts/resolve-name.js —
  // containment only finds the candidates and an exact name is code's; the judge picks among the candidates and says whether the
  // cell names a second component too, so a cell like "App y Base Local" no longer collapses to the first name in silence: the
  // contract is still written for the first, the second lands in endpoint_review. A cell no judge has answered is undecided
  // (8.119.0): never resolved by containment, no seam, listed under undecided_endpoints with the worksheet to answer.
  const exactComp = (cell) => { const n = norm(cell); const c = comps.find((x) => norm(x.name) === n); return c ? [c.name] : []; };   // the other endpoint, when the row names it exactly: a cell never means the other end of its own row
  const endpointCells = integrations.flatMap((i) => [['from', i.from], ['to', i.to]].map(([side, cell]) => ({ id: `${i.id}:${side}`, cell, exclude: exactComp(side === 'from' ? i.to : i.from), context: { integration: i.id, side, other: side === 'from' ? i.to : i.from, protocol: i.protocol || 'Not documented', pattern: i.pattern || 'Not documented' } })));
  const resolved = await resolveNames(endpointCells, comps, { engine: opts.judge, root, answers: opts.judgeAnswers, alsoAnswers: opts.judgeAlsoAnswers });
  if (resolved.pending) warn(`endpoint resolution: the agent worksheet is at ${resolved.pending} — judge it and re-run; until then every cell that is not exactly a canonical name is undecided (no seam)`);
  const undecidedSides = new Set();   // an endpoint the judge has not answered: no seam yet, and the specification says so
  const resolve = (i, side) => { const r = resolved.get(`${i.id}:${side}`); const label = side === 'from' ? 'upstream' : 'downstream', who = r && r.by !== 'undecided' ? ` (${r.by}${r.confidence != null ? ` ${r.confidence}` : ''})` : '';
    if (r && r.undecided) { undecidedSides.add(`${i.id}:${side}`); report.undecided_endpoints.push(`${i.id} ${label} "${i[side]}" — ${r.unresolved_reason}${resolved.pending ? ` — answer ${resolved.pending} and re-run` : ''}`); return null; }
    if (!r || !r.resolved) { report.unresolved_endpoints.push(`${i.id} ${label} "${i[side]}" — ${r ? r.unresolved_reason + who : 'no component with that canonical name'}`); return null; }
    if (r.band === 'mid') report.endpoint_review.push(`${i.id} ${label} "${i[side]}" resolved to \`${r.name}\`${who} — below the confident band; confirm it`);
    if (r.also.length) report.endpoint_review.push(`${i.id} ${label} "${i[side]}" also names ${r.also.map((n) => `\`${n}\``).join(', ')}${who} — the contract is written for \`${r.name}\``);
    return r.fact; };
  if (opts.verify) { const v = verifyResolutions(JSON.parse(fs.readFileSync(path.resolve(root, opts.verify), 'utf8')), resolved);
    console.error(`endpoint resolution · ${resolved.engine} · ${v.tp}/${v.total} fixtures resolved as labelled${v.also_missed.length ? ` · ${v.also_missed.length} second name(s) missed` : ''}`);
    v.fn.forEach((f) => console.error(`   ✗ ${f.id}: labelled ${f.label}, resolved ${f.got}${f.confidence != null ? ` (${f.confidence})` : ''}${f.note ? ` — ${f.note}` : ''}`));
    v.also_missed.forEach((f) => console.error(`   ✗ ${f.id}: also names ${f.name}, not reported${f.got.length ? ` (reported: ${f.got.join(', ')})` : ''}`));
    v.unseen.forEach((f) => console.error(`   ✗✗ ${f.id}: not a docs/05 cell of this project — fix the fixture, not the judge`)); }
  const slugOf = (cell) => norm(cell).replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const style = (i) => /kafka|amqp|\bmq\b|event|evento|topic|t[oó]pico|queue|cola|pub|stream|cdc|async|as[ií]ncron|lote|batch|webhook/i.test(`${i.protocol || ''} ${i.pattern || ''}`) ? 'async' : 'sync';
  const edges = integrations.map((i, k) => { const up = resolve(i, 'from'), down = resolve(i, 'to'); const b = blocks05[i.id] || { title: null, text: '' };
    return { id: `E-${String(k + 1).padStart(2, '0')}`, int: i, up, down, upSlug: up ? up.slug : slugOf(i.from), downSlug: down ? down.slug : slugOf(i.to), style: style(i), purpose: b.title || i.pattern || 'Not documented', adrs: adrIds(`${invRow(i.id) || ''}\n${b.text}`), block: b.text }; });

  // ---- component communication tables (Inbound / Outbound)
  const comm = (c) => { const src = compSrc(c); if (!src) return { inbound: null, outbound: null }; const s = section(src, /communication|comunicaci/i); if (!s) return { inbound: null, outbound: null }; return { inbound: tableOf(labelBlock(s.body, /inbound|entrante/i) || ''), outbound: tableOf(labelBlock(s.body, /outbound|saliente/i) || '') }; };
  const commCache = {}; const commOf = (c) => { if (!c) return { inbound: null, outbound: null }; return commCache[c.slug] || (commCache[c.slug] = comm(c)); };
  // cross-checks (warnings, never removals)
  const blastTables = tables(blastSrc), couplingTables = tables(couplingSrc);
  const blastRow = (c) => { for (const t of blastTables) { const iC = t.headers.findIndex((h) => /component|componente/i.test(h)); if (iC < 0) continue; const r = t.rows.find((r) => norm(cells(r)[iC] || '') === norm(c.name)); if (r) return { t, r }; } return null; };
  edges.forEach((e) => { if (e.up && e.down) {
    const o = commOf(e.up).outbound; if (o && !rowsWith(o, [e.down.name]).length) report.edge_cross_check_warnings.push(`⚠ boundary mismatch: docs/05 has edge ${e.upSlug}→${e.downSlug} (${e.int.id}) but ${e.up.file} does not list ${e.down.name} in its Outbound table.`);
    const inb = commOf(e.down).inbound; if (inb && !rowsWith(inb, [e.up.name]).length) report.edge_cross_check_warnings.push(`⚠ boundary mismatch: docs/05 has edge ${e.upSlug}→${e.downSlug} (${e.int.id}) but ${e.down.file} does not list ${e.up.name} in its Inbound table.`);
    if (blastFile) { const b = blastRow(e.up); if (b && !norm(b.r).includes(norm(e.down.name))) report.edge_cross_check_warnings.push(`⚠ blast-radius stale: docs/05 has edge ${e.upSlug}→${e.downSlug} (${e.int.id}) but ${rel(root, blastFile)} fan-out for ${e.up.name} does not list ${e.down.name}. Rerun /sa-analysis:architecture-analysis blast-radius.`); } } });


  // ---- flows: trigger, path (the phases' owner chains), sequence anchor, budget, failure posture (the phases' failure modes)
  const phaseByN = Object.fromEntries((facts.phases || []).map((p) => [p.n, p]));
  // ---- panels: the phases' sequence diagrams (docs/04) and the container diagram to cut (docs/03)
  const panels = (facts.phases || []).map((p) => { const s = section(src04, new RegExp('^(Phase|Fase)\\s+' + p.n + '\\b', 'i')); const f = s ? fences(s.body)[0] : null; return f ? { n: p.n, name: p.name, fence: f, usedBy: (facts.flows || []).filter((fl) => fl.phases.includes(String(p.n))).map((fl) => `F-${String(fl.code).padStart(2, '0')}`) } : null; }).filter(Boolean);
  const panelByN = Object.fromEntries(panels.map((p) => [p.n, p]));
  // the flow's MAIN IMAGE: its end-to-end sequence in docs/04 — derived there by flow-compose.js from the same panels, so it
  // contains exactly the phases the flow declares, steps labelled N.M. Cut verbatim; a flow with none says so (flow-check names why).
  const mainImage = (f) => { const s = section(src04, new RegExp('^(Flow|Flujo)\\s+' + f.code + '\\s*[—–-].*\\([^)]*(sequence|secuencia)[^)]*\\)', 'i')   /* `(full wire sequence)`, `(secuencia completa)`, `(full sequence)` — the parenthetical is what tells the end-to-end block from the flow block */); const fence = s ? fences(s.body)[0] : null; return fence ? '```mermaid\n' + fence + '\n```' : ND(s ? 'the flow\'s end-to-end block draws nothing' : 'docs/04 has no end-to-end sequence for this flow', 'bun skills/architecture-docs/scripts/flow-compose.js <project> — then flow-check.js'); };
  const d03 = docFile('03-'); const src03 = d03 ? read(d03) : '';
  const diagramBlock = (re) => { const m = [...src03.matchAll(/^####\s+(?:Diagram|Diagrama)\s*:\s*(.+)$/gm)].find((x) => re.test(plain(x[1]))); if (!m) return null; const after = src03.slice(m.index); const f = fences(after)[0]; return f && /^(flowchart|graph)\b/m.test(f) ? { name: plain(m[1]), src: f } : null; };
  const container = diagramBlock(/C4\s*Level\s*2|C4\s*Nivel\s*2|Container|Contenedor/i) || diagramBlock(/Detailed View|Vista Detallada/i);
  const graph = container ? parseFlowchart(container.src) : null;
  // which component each diagram node labels — a judgement through scripts/resolve-name.js (exact by code; a label that
  // qualifies or shortens the name by the judge). Every node the judge bound is listed under report.panels.judged; a label
  // no judge has answered is undecided (8.119.0) — it labels no component until answered, listed under undecided_labels
  const labelCells = graph ? Object.values(graph.nodes).filter((x) => x.label).map((x, i) => ({ id: `d${i}`, cell: x.label, node: x })) : [];
  const labelRes = labelCells.length ? await resolveNames(labelCells.map(({ id, cell }) => ({ id, cell, context: { diagram: container.name } })), comps, { engine: opts.judge, root }) : new Map();
  const nodeOf = (c) => { if (!graph || !c) return null; const hit = labelCells.find((lc) => { const r = labelRes.get(lc.id); return r && r.resolved && r.fact === c; }); return hit ? hit.node : null; };
  const judgedLabels = labelCells.map((lc) => ({ lc, r: labelRes.get(lc.id) })).filter(({ r }) => r && r.by !== 'undecided' && r.by !== 'exact').map(({ lc, r }) => `"${lc.cell}" → ${r.resolved ? `\`${r.name}\`` : 'no component'} (${r.by}${r.confidence != null ? ` ${r.confidence}` : ''})`);
  report.panels = { phases: panels.length, phases_without: (facts.phases || []).filter((p) => p.has_block && !panelByN[p.n]).map((p) => p.n), diagram: container ? `${rel(root, d03)} § Diagram: ${container.name}` : null, cuts: 0, unmatched_nodes: [], rejected: [], judged: judgedLabels,
    undecided_labels: labelCells.filter((lc) => { const r = labelRes.get(lc.id); return r && r.undecided; }).map((lc) => `"${lc.cell}"`), worksheet: labelRes.pending || null };
  if (!container) warn('docs/03 has no container diagram (C4 Level 2 / Detailed View) — the seams and Component Specifications render their Panel as [NOT DOCUMENTED]. Recommend: /sa-skills:architecture-docs — generate my architecture diagrams');
  const cut = (keepIds, what) => { if (!graph) return ND('no container diagram in docs/03', '/sa-skills:architecture-docs — generate my architecture diagrams'); const src = emitFlowchart(graph, new Set(keepIds), `Cut of ${container.name} — ${what} — generated by handoff-prepare.js, never hand-edited`); const bad = lintCut(src); if (bad) { report.panels.rejected.push(`${what}: ${bad}`); return ND(`the cut failed the diagram gate (${bad})`); } report.panels.cuts++; return `Cut of \`${rel(root, d03)}\` § Diagram: ${container.name} — ${what} (generated, never hand-edited):\n\n\`\`\`mermaid\n${src}\n\`\`\``; };
  const neighbours = (id) => { const s = new Set([id]); graph.edges.forEach((e) => { if (e.a === id) s.add(e.b); if (e.b === id) s.add(e.a); }); return [...s]; };
  // a pair the diagram joins only through intermediaries (docs/05 "via the gateway") is cut along the shortest undirected route, three hops at most
  const route = (a, b) => { if (graph.edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return [a, b]; const prev = { [a]: null }; const q = [a]; while (q.length) { const x = q.shift(); for (const e of graph.edges) { const y = e.a === x ? e.b : e.b === x ? e.a : null; if (y && !(y in prev)) { prev[y] = x; if (y === b) { const p = [b]; while (p[0] !== a) p.unshift(prev[p[0]]); return p.length <= 4 ? p : null; } q.push(y); } } } return null; };

  const flowHeading = (f) => { const m = src04.match(new RegExp('^(#{1,6})\\s+((?:Flow|Flujo)\\s+' + f.code + '\\s*[—–-].*)$', 'im')); return m ? plain(m[2]) : null; };
  const chain = (f) => { const out = []; f.phases.forEach((n) => { const p = phaseByN[n]; if (!p) return; (p.hops ? plain(p.hops) : p.owner_chain).split(/\s*→\s*/).forEach((x) => { if (x && norm(out[out.length - 1] || '') !== norm(x)) out.push(x); }); }); return out; };
  const flowsMd = (facts.flows || []).map((f) => { const h = flowHeading(f); const ph = f.phases.map((n) => phaseByN[n]).filter(Boolean);
    return `### F-${String(f.code).padStart(2, '0')} — ${f.name}\n- Trigger: ${f.trigger || 'Not documented'}\n- Path: ${chain(f).join(' → ') || ND('no phases resolve for this flow')}\n- Phases: ${f.phases.length ? f.phases.map((n) => `${n}${phaseByN[n] ? ' (' + phaseByN[n].name + ')' : ''}`).join(' → ') : 'Not documented'}\n- Sequence: ${h && d04 ? `[${rel(root, d04)}#${anchor(h)}](${link(payloadDir, d04, root)}#${anchor(h)})` : ND('no flow block in docs/04')}\n- Global budget: ${f.latency_target || 'Not documented'}\n- Governed by: ${f.governed_by.length ? f.governed_by.join(', ') : '—'}\n- Failure posture: ${ph.filter((p) => p.failure_mode).map((p) => `phase ${p.n}: ${p.failure_mode}`).join(' · ') || 'Not documented'}${f.delta ? `\n- Delta: ${f.delta}` : ''}\n- Main image:\n\n${mainImage(f)}`; });

  // ---- verbatim table blocks of an analysis report, each under its heading
  const tablesMd = (src, filter) => { const out = []; let last = null; tables(src).filter(filter || (() => true)).forEach((t) => { if (t.heading && t.heading !== last) { out.push(`### ${t.heading}`); last = t.heading; } out.push(renderRows(t, t.rows)); }); return out.join('\n\n'); };
  const latencyMd = latencyFile ? `Source: \`${rel(root, latencyFile)}\`.\n\n${tablesMd(latencySrc)}` : (() => { const s = section(src04, /latency budget|presupuesto de latencia/i); return `${ND('no analysis/LATENCY_BUDGET-*.md', '/sa-analysis:architecture-analysis latency-budget')}${s ? `\n\nBudgets declared in \`${rel(root, d04)}\` § ${s.heading} (documented targets, not a latency-budget analysis):\n\n${s.body}` : ''}`; })();
  const blastMd = blastFile ? `Source: \`${rel(root, blastFile)}\`.\n\n${tablesMd(blastSrc)}` : ND('no analysis/BLAST_RADIUS-*.md', '/sa-analysis:architecture-analysis blast-radius');
  const couplingMd = couplingFile ? `Source: \`${rel(root, couplingFile)}\`.\n\n${tablesMd(couplingSrc, (t) => t.headers.some((h) => /fan-in|fan-out|instability|component/i.test(h)))}` : null;
  const outOfScope = (() => { if (!exists(archPath)) return null; const s = section(read(archPath), /out of scope|fuera de(l)? alcance|no incluye/i); const b = s ? lines(s.body).filter((l) => /^\s*[-*]\s/.test(l)) : []; return b.length ? b.map((l) => '  ' + l.trim()).join('\n') : null; })();

  // ---- _run.md
  fs.mkdirSync(path.join(payloadDir, 'seams'), { recursive: true });
  // the Interface Contract's Interaction label (8.110.0): in governed mode, the label the container diagram draws on the
  // upstream → downstream edge — already held to §5.3–§5.4 by label-check.js — carried verbatim, so neither the generator
  // nor the orchestrator decides the mode or composes the label. A 2026-10-01 run stripped the row from five contracts
  // because the orchestrator looked for the standard in the project, where it never is.
  const edgeLabelOf = (line) => { const m = line.match(/\|\s*"?([^|"]*?)"?\s*\|/) || line.match(/(?:--|==|-\.)\s*"([^"]*)"/); return m ? m[1].trim() : null; };
  const interactionLabel = (e) => { if (!graph) return ND('no container diagram in docs/03'); const a = nodeOf(e.up), b = nodeOf(e.down);
    if (!a || !b) return ND(`the container diagram has no node labelled ${!a ? e.up.name : e.down.name}`);
    const hit = graph.edges.find((x) => x.a === a.id && x.b === b.id && edgeLabelOf(x.line)); return hit ? edgeLabelOf(hit.line) : ND(`the container diagram draws no labelled edge ${e.up.name} → ${e.down.name}`); };
  const fm = (o) => `---\n${Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? '[' + v.join(', ') + ']' : v}`).join('\n')}\n---\n`;
  const runMd = fm({ project_name: projectName, architect, architecture_version: archVersion, architecture_md_path: archPath, doc_language: lang, generation_date: today }) + `
## Scope <!-- SECTION: Scope -->

- In scope:
${l2.filter((c) => c.file_backed).map((c) => `  - ${c.name}`).join('\n') || '  - ' + ND('no C4 L2 container with a descriptor file')}
- Out of scope:
${outOfScope || '  - Not documented'}

## Flows <!-- SECTION: Flows -->

${flowsMd.join('\n\n') || ND('docs/04 has no Flow Inventory', '/sa-skills:architecture-docs')}

## Phase Catalog <!-- SECTION: Phase Catalog -->

${panels.length ? panels.map((p) => `### Phase ${p.n} — ${p.name}\n- Used by: ${p.usedBy.length ? p.usedBy.join(', ') : 'no flow declares this phase'}\n\n\`\`\`mermaid\n${p.fence}\n\`\`\``).join('\n\n') : ND('docs/04 has no sequenceDiagram under its phase blocks', '/sa-skills:architecture-docs — generate my architecture diagrams')}

## Edges <!-- SECTION: Edges -->

| # | Upstream | Downstream | Style | Protocol | Purpose | Related ADRs |
|--:|----------|------------|-------|----------|---------|--------------|
${edges.map((e) => `| ${e.id} | ${e.up ? e.up.name : plain(e.int.from)} | ${e.down ? e.down.name : plain(e.int.to)} | ${e.style} | ${e.int.protocol || '—'} | ${e.purpose} (${e.int.id}) | ${e.adrs.join(', ') || '—'} |`).join('\n')}
${retired.length ? `\n**Retired edges** (excluded from the active inventory, per docs/05): ${retired.map((i) => `${i.id} (${plain(i.from)} → ${plain(i.to)})`).join('; ')}.` : ''}
## Latency Budget <!-- SECTION: Latency Budget -->

${latencyMd}

## Blast Radius <!-- SECTION: Blast Radius -->

${blastMd}
${couplingMd ? `\n## Coupling <!-- SECTION: Coupling -->\n\n${couplingMd}\n` : ''}
## Institutional ADRs <!-- SECTION: Institutional ADRs -->

${institutional.length ? institutional.map((a) => adrEntry(a.id, 900, payloadDir)).join('\n\n') : ND('no institutional ADR (001–100) under adr/', '/sa-records:architecture-definition-record — import institutional ADRs')}
`;
  const runPath = path.join(payloadDir, '_run.md'); fs.writeFileSync(runPath, (runMd + rowLabels.payloadSection(['ekonte', 'settei'], lang)).replace(/\n{3,}/g, '\n\n'));

  // ---- seams: edges incident on a selected component, both endpoints resolved
  const selectedSlugs = new Set(selected.map((c) => c.slug));
  const seamDir = path.join(payloadDir, 'seams');
  // each component's own data-ownership section — the one source the Interface Contract's Ownership row and the Component
  // Specification's § 6 both read (8.153.0): the row had been drawn from the docs/05 block alone, narrower than the descriptor,
  // and the two parts disagreed on what the upstream owns
  const OWNED_RE = /owned entit|entidades|data ownership|propiedad de(l)? dato|modelo de datos|data model|datos propios/i;
  const ownedOf = (c) => { const src = c && compSrc(c); return src ? section(src, OWNED_RE) : null; };
  const seamEdges = edges.filter((e) => e.up && e.down && (selectedSlugs.has(e.upSlug) || selectedSlugs.has(e.downSlug)));
  const couplingRows = (c) => { for (const t of couplingTables) { const iC = t.headers.findIndex((h) => /component|componente/i.test(h)); if (iC < 0) continue; const rs = t.rows.filter((r) => norm(cells(r)[iC] || '') === norm(c.name)); if (rs.length) return { t, rs }; } return null; };
  const boundary = (c, dir, other) => { if (!c.file_backed) return `_${c.name} is declared in its system's Containers table only — no descriptor file._ ${ND('no boundary rows')}`; const tb = commOf(c)[dir]; if (!tb) return ND(`${c.file} has no ${dir === 'outbound' ? 'Outbound' : 'Inbound'} communication table`); const rs = rowsWith(tb, [other.name]); return `From \`${c.file}\` § Communication Patterns (${dir === 'outbound' ? 'Outbound' : 'Inbound'}):\n\n${renderRows(tb, rs.length ? rs : tb.rows)}${rs.length ? '' : `\n\n_No row names ${other.name}; the whole table is shown._`}`; };
  const seams = seamEdges.map((e) => { const key = `${e.upSlug}→${e.downSlug}`; const p = path.join(seamDir, `${key}.md`);
    const blastRows = [e.up, e.down].map((c) => blastRow(c)).filter(Boolean); const cRows = [e.up, e.down].map((c) => couplingRows(c)).filter(Boolean);
    // Two provenances, and the order between them is the point. `edge`: the docs/05 row's own Related ADRs
    // (in the row's order — the author put the governing decision first) and the boundary rows' citations.
    // `endpoint`: the descriptors' header ADRs, filler for a thin list. The Interface Contract's Decision cell
    // is the FIRST edge ADR; through 8.27.0 the list was merged and sorted by number, so an interface created
    // by ADR-120 cited ADR-004 (the deployment framework) as its decision.
    const edgeAdrs = [...new Set([...e.adrs, ...adrIds(boundary(e.up, 'outbound', e.down)), ...adrIds(boundary(e.down, 'inbound', e.up))])];
    const endpointAdrs = edgeAdrs.length < 3 ? [...new Set([...(e.up.related_adrs || []), ...(e.down.related_adrs || [])])].filter((id) => !edgeAdrs.includes(id)).sort((a, b) => adrNum(a) - adrNum(b)) : [];
    const relAdrs = [...edgeAdrs, ...endpointAdrs]; const provenance = (id) => (edgeAdrs.includes(id) ? 'edge' : 'endpoint');
    const md = fm({ upstream: e.upSlug, downstream: e.downSlug, upstream_name: JSON.stringify(e.up.name), downstream_name: JSON.stringify(e.down.name), edge_id_in_ekonte: e.id, doc_language: lang, generation_date: today, design_language: GOVERNED ? 'governed' : 'fallback', ...(GOVERNED ? { interaction_label: JSON.stringify(interactionLabel(e)) } : {}) }) + `
## Integration Row <!-- SECTION: Integration Row -->

${inv && invRow(e.int.id) ? renderRows(inv, [invRow(e.int.id)]) : ND(`no ${e.int.id} row in docs/05`)}
${e.block ? `\n${e.block}\n` : ''}
## Panel <!-- SECTION: Panel -->

${(() => { const a = nodeOf(e.up), b = nodeOf(e.down); [[e.up, a], [e.down, b]].forEach(([c, n]) => { if (graph && !n && !report.panels.unmatched_nodes.includes(c.name)) report.panels.unmatched_nodes.push(c.name); }); if (graph && a && b) { const r = route(a.id, b.id); return r ? cut(r, `${e.up.name} → ${e.down.name}${r.length > 2 ? ' (via ' + r.slice(1, -1).map((id) => graph.nodes[id].label).join(', ') + ')' : ''}`) : cut([a.id, b.id], `${e.up.name} → ${e.down.name} (no route drawn between them)`); } return graph ? ND(`the container diagram has no node labelled ${!a ? e.up.name : e.down.name}`) : cut([], ''); })()}

## Boundaries Upstream <!-- SECTION: Boundaries Upstream -->

${boundary(e.up, 'outbound', e.down)}

## Boundaries Downstream <!-- SECTION: Boundaries Downstream -->

${boundary(e.down, 'inbound', e.up)}

## Data Ownership <!-- SECTION: Data Ownership -->

${[e.up, e.down].map((c) => { const o = ownedOf(c); return `### ${c.name}\n\n${o ? `From \`${c.file}\` § ${o.heading}:\n\n${o.body}` : ND(`${c.file} has no data-ownership section`)}`; }).join('\n\n')}

## Blast Radius Row <!-- SECTION: Blast Radius Row -->

${blastFile ? (blastRows.length ? blastRows.map(({ t, r }) => `${t.heading ? `_${t.heading}_\n\n` : ''}${renderRows(t, [r])}`).join('\n\n') : ND(`no row for ${e.up.name} or ${e.down.name} in ${rel(root, blastFile)}`)) : ND('no analysis/BLAST_RADIUS-*.md', '/sa-analysis:architecture-analysis blast-radius')}
${couplingFile ? `\n## Coupling Row <!-- SECTION: Coupling Row -->\n\n${cRows.length ? cRows.map(({ t, rs }) => renderRows(t, rs)).join('\n\n') : ND(`no row for either endpoint in ${rel(root, couplingFile)}`)}\n` : ''}
## Related ADRs <!-- SECTION: Related ADRs -->

${relAdrs.length ? relAdrs.map((id) => adrEntry(id, 500, seamDir).replace(/^- (\S+) — /, `- $1 (${provenance(id)}) — `)).join('\n\n') : ND('no ADR cited by the docs/05 row, the boundary rows or the descriptors')}
`; fs.writeFileSync(p, (md + rowLabels.payloadSection(['seam'], lang)).replace(/\n{3,}/g, '\n\n')); return { edge_key: key, edge: e, payload_path: p, related_adrs: relAdrs }; });

  // ---- component payloads
  const ASSETS = [[/graphql/i, 'api-service', ['graphql-sdl']], [/\bgrpc\b|protobuf|proto3/i, 'api-service', ['protobuf']], [/\bapi\b|\brest\b|service|endpoint|backend|bff/i, 'api-service', ['openapi']], [/gateway|edge|ingress|reverse proxy/i, 'api-service', ['openapi']], [/database|\bdb\b|data store|postgres|mysql|mongodb|cassandra|dynamodb|couchbase server|oracle|sql server/i, 'database', ['ddl']], [/redis|cache|elasticache|memcached|valkey|keydb/i, 'cache', ['redis']], [/kubernetes|k8s|deployment|\bpod\b|\baks\b|\beks\b|\bgke\b|openshift|\becs\b|fargate|container|docker/i, 'k8s-workload', []], [/consumer|producer|queue|topic|event|message|kafka|rabbitmq|\bsqs\b|\bsns\b|eventbridge|pub\/sub|\bnats\b/i, 'message-consumer', ['asyncapi']], [/cronjob|\bcron\b|scheduled|batch|scheduler/i, 'scheduled-job', []], [/library|\bsdk\b|utility|config|documentation|schema-only/i, 'skip', []]];
  // a data store gets ddl.sql only when it is relational (8.106.0): a SQL script means nothing to MongoDB, Cassandra, DynamoDB,
  // Couchbase or Cosmos DB. The engine named is the dialect the DDL is written in and the grammar it is checked against.
  const SQL_ENGINES = [[/postgres|postgresql|aurora postgres|cockroach|yugabyte|timescale/i, 'postgresql'], [/mariadb/i, 'mariadb'], [/mysql|aurora mysql/i, 'mysql'], [/sql server|mssql|azure sql|t-sql|transact-sql/i, 'transactsql'], [/oracle/i, 'oracle'], [/\bdb2\b/i, 'db2'], [/sqlite/i, 'sqlite'], [/snowflake/i, 'snowflake'], [/redshift/i, 'redshift'], [/bigquery/i, 'bigquery']];
  const NOSQL = /mongo|cassandra|scylla|dynamodb|couchbase|cosmos ?db|elasticsearch|opensearch|neo4j|firestore|bigtable|hbase/i;
  const sqlEngine = (sig) => (SQL_ENGINES.find(([re]) => re.test(sig)) || [null, null])[1];
  const resolveAssets = (c, src) => { const hint = (src.match(/^\*\*Asset Hints:\*\*\s*(.+)$/im) || [])[1]; if (hint) { const h = plain(hint); if (/^skip$/i.test(h)) return { type: 'skip', assets: [] }; const list = (h.match(/[a-z0-9-]+/gi) || []).filter((x) => !/^(c4-descriptor|deployment|cronjob)$/i.test(x)); (h.match(/(?:^|[^a-z0-9-])(deployment|cronjob)(?=[^a-z0-9-]|$)/gi) || []).forEach((m) => report.warnings.push(`${c.name}: **Asset Hints:** names \`${m.replace(/^[^a-z]+/i, '').toLowerCase()}\` — Kubernetes manifest assets were removed in 8.104.0 and the hint is ignored`)); return { type: null, assets: [...list, 'c4-descriptor'], hint: true }; }
    // another component's name is not a signal of this one: a gateway named after GraphQL in the deployment section made
    // a REST service a GraphQL one (2026-10-01). The longest names go first so a name inside a longer one is not left half.
    const others = (facts.components || []).map((x) => x.name).filter((n) => n && n !== c.name).sort((a, b) => b.length - a.length);
    const unname = (t) => others.reduce((acc, n) => acc.split(n).join(' '), t);
    const signals = unname([c.type, ...(c.technology || []), (src.match(/^\*\*Deploys as:\*\*\s*(.+)$/im) || [])[1] || '', (src.match(/^\*\*Communicates via:\*\*\s*(.+)$/im) || [])[1] || '', (section(src, /deployment|despliegue/i) || { body: '' }).body.slice(0, 600)].join(' '));
    const typeOnly = `${c.type} ${(c.technology || []).join(' ')}`; let type = null; const assets = []; let avroDefault = false;
    ASSETS.forEach(([re, t, a]) => { if (re.test(signals)) { if (!type && re.test(typeOnly)) type = t; a.forEach((x) => { if (!assets.includes(x)) assets.push(x); }); } });
    if (!type) type = c.type ? c.type.toLowerCase().replace(/\s+/g, '-') : (ASSETS.find(([re]) => re.test(signals))?.[1] || 'api-service');   // the descriptor's own Type, normalized, when no keyword names a family
    if (type === 'skip' && assets.length) type = ASSETS.find(([re, t]) => t !== 'skip' && re.test(typeOnly))?.[1] || 'api-service';
    if (/avro|avsc|schema registry/i.test(signals) && assets.includes('asyncapi')) assets.push('avro'); if (/protobuf|proto3|\.proto\b|grpc/i.test(signals) && assets.includes('asyncapi')) assets.push('protobuf'); if (assets.includes('asyncapi') && /kafka/i.test(signals) && !assets.includes('avro') && !assets.includes('protobuf')) { assets.push('avro'); avroDefault = true; }
    // The API a component exposes is what its inbound synchronous integrations carry (8.113.0): the docs/05 Protocol cell of
    // each `I-nn` it receives decides the API contracts — GraphQL → schema.graphql, gRPC → schema.proto, any other HTTP surface
    // (REST, HTTPS/JSON, OpenAPI) → openapi.yaml — and a keyword API contract none of them carries is dropped. Through 8.112.0
    // "HTTPS/JSON" did not count as REST, so a service with a GraphQL hop lost its OpenAPI for its REST one. A data-store
    // protocol (JDBC, an SDK, TLS) names no API. No inbound API edge, or a data store / cache: the keywords stand.
    const API = ['openapi', 'graphql-sdl', 'protobuf'];
    const apiOf = (proto) => (/graphql/i.test(proto) ? 'graphql-sdl' : /\bgrpc\b|protobuf/i.test(proto) ? 'protobuf' : /\brest\b|openapi|swagger|\bhttps?\b|json/i.test(proto) ? 'openapi' : null);
    const inbound = edges.filter((e) => e.downSlug === c.slug && !ASYNC.test(`${e.int.protocol || ''} ${e.int.pattern || ''}`)).map((e) => ({ id: e.int.id, api: apiOf(e.int.protocol || '') })).filter((x) => x.api);
    const apiCapable = type === 'api-service' || assets.some((x) => API.includes(x)) || !assets.some((x) => ['ddl', 'redis'].includes(x));
    let basis = null;
    if (inbound.length && apiCapable) {
      const want = [...new Set(inbound.map((x) => x.api))];
      for (let i = assets.length - 1; i >= 0; i--) if (API.includes(assets[i]) && !want.includes(assets[i])) assets.splice(i, 1);
      want.forEach((x) => { if (!assets.includes(x)) assets.push(x); });
      basis = `docs/05 inbound ${inbound.map((x) => `${x.id} → ${x.api}`).join(', ')}`;
    } else if (['database', 'cache'].includes(type) && assets.some((x) => API.includes(x))) {
      // a data store or a cache exposes an API only through a documented inbound edge: a `service` or `endpoint` in its
      // descriptor gave a Couchbase database an openapi.yaml (2026-10-01)
      for (let i = assets.length - 1; i >= 0; i--) if (API.includes(assets[i])) assets.splice(i, 1);
    } else if ((assets.includes('graphql-sdl') || assets.includes('protobuf')) && assets.includes('openapi') && !/\brest\b|openapi|swagger/i.test(signals)) {
      // keywords only: a GraphQL or gRPC service matched `api` too and collected `openapi` — a REST spec for a non-REST surface
      // is a skeleton nobody can use. It stays only when the descriptor names REST / OpenAPI / Swagger itself.
      assets.splice(assets.indexOf('openapi'), 1);
    }
    const engine = sqlEngine(signals); if (assets.includes('ddl') && !engine && NOSQL.test(signals)) assets.splice(assets.indexOf('ddl'), 1);
    return { type, assets: type === 'skip' ? [] : [...assets, 'c4-descriptor'], avro_default: avroDefault, sql_engine: assets.includes('ddl') ? engine || 'unknown' : null, basis: basis || (type === 'skip' ? null : 'descriptor keywords') }; };
  const latencyTables = latencyFile ? tables(latencySrc) : (() => { const s = section(src04, /latency budget|presupuesto de latencia/i); return s ? tables(s.body).map((x) => Object.assign(x, { heading: x.heading || s.heading })) : []; })();
  const budgets = (c) => { const out = []; latencyTables.forEach((t) => { const rs = rowsWith(t, [c.name]); if (rs.length) out.push(`${t.heading ? `_${t.heading}_\n\n` : ''}${renderRows(t, rs)}`); }); return out; };
  // ---- message definitions (8.105.0): what a component's async messages carry, cut from where the docs define them. A consumer's
  // schema repeats its producer's message, and the producer documents it — its descriptor, the docs/05 block — so the
  // consumer's payload carried no field to write: the generator could leave `fields: []` or invent. Collected for every
  // component with a message asset: the docs/05 block of each async integration it is on, and the message sections of the
  // descriptor at the other end — and, when that end is a broker (a topic, a bus), of the producers and consumers behind it.
  const ASYNC = /kafka|event|topic|queue|async|amqp|pub\/?sub|stream|message|cdc|evento|t[oó]pico|cola|mensaje|grpc|protobuf/i;   // gRPC too: a .proto carries the messages its calls exchange
  const BROKER = /kafka|topic|t[oó]pico|queue|cola|broker|event ?hub|service bus|rabbitmq|pub\/?sub/i;
  const MSG_HEAD = /event|message|schema|payload|record|evento|mensaje|esquema|registro/i;
  const FIELDS_LINE = /^\s*[-*]?\s*\*\*[^*]*(schema fields|event fields|message fields|campos)[^*]*\*\*/i;
  const asyncEdges = (slug) => edges.filter((e) => (e.upSlug === slug || e.downSlug === slug) && ASYNC.test(`${e.int.protocol || ''} ${e.int.pattern || ''} ${e.purpose || ''}`));
  const isBroker = (c) => !!c && BROKER.test(`${c.type || ''} ${c.name || ''} ${(c.technology || []).join(' ')}`);
  const msgSections = (src) => { const ls = lines(src); const out = []; const taken = new Set();
    for (let i = 0; i < ls.length; i++) { const h = ls[i].match(/^(#{2,6})\s+(.+)$/); if (!h || !MSG_HEAD.test(plain(h[2]))) continue;   // H2 and deeper — the H1 is the whole file
      const body = []; for (let j = i + 1; j < ls.length; j++) { const hh = ls[j].match(/^(#{1,6})\s+/); if (hh && hh[1].length <= h[1].length) break; body.push(ls[j]); taken.add(j); }
      const text = body.join('\n').trim(); if (/```|^\|.*\|\s*$/m.test(text) || FIELDS_LINE.test(text)) out.push({ heading: plain(h[2]), text }); }
    let heading = ''; ls.forEach((l, i) => { const h = l.match(/^#{1,6}\s+(.+)$/); if (h) heading = plain(h[1]); else if (!taken.has(i) && FIELDS_LINE.test(l)) out.push({ heading, text: l.trim() }); });
    return out; };
  const cap = (t, n) => (t.length > n ? `${t.slice(0, n)}\n\n_[… cut at ${n} characters — the rest is in the source]_` : t);
  const messageDefs = (c) => {
    const es = asyncEdges(c.slug); if (!es.length) return null;
    const parts = []; const others = new Map();
    es.forEach((e) => { const b = blocks05[e.int.id]; if (b && b.text) parts.push(`### docs/05 § ${e.int.id}${b.title ? ` — ${b.title}` : ''}\n\n${cap(b.text, 3000)}`);
      const o = e.upSlug === c.slug ? e.down : e.up; if (o && o.slug !== c.slug) others.set(o.slug, o);
      if (isBroker(o)) asyncEdges(o.slug).forEach((e2) => { const o2 = e2.upSlug === o.slug ? e2.down : e2.up; if (o2 && o2.slug !== c.slug) others.set(o2.slug, o2); }); });
    others.forEach((o) => { const src = compSrc(o); if (!src) return; msgSections(src).forEach((m) => parts.push(`### ${o.name} (\`${o.file}\`)${m.heading ? ` § ${m.heading}` : ''}\n\n${cap(m.text, 4000)}`)); });
    const uniq = [...new Set(parts)]; return uniq.length ? cap(uniq.join('\n\n'), 20000) : null; };
  // ---- operation definitions (8.109.0): what a component's API operations carry — method, path, request and response
  // fields — cut from docs/05, where an interface's contract is documented. Message Definitions served only async edges, so
  // an OpenAPI generator read the descriptor alone: the operations went into the descriptor (past its size cap) or the
  // generator left `paths: {}`, and a docs/05 operations table never reached it. Collected for every component with an
  // `openapi` or `graphql-sdl` asset: the docs/05 block of each synchronous integration it receives, and every other docs/05
  // table row that cites one of those `I-nn` ids — under its heading, with the prose that opens its section; the inventory
  // contributes the rows of those ids only.
  const ids05 = (r, ids) => ids.some((id) => new RegExp(`(^|[^A-Za-z0-9-])${id}(?![0-9])`).test(r));
  const lines05 = lines(src05);
  const intro05 = (t) => { const out = []; for (let i = t.start - 1; i >= 0 && !/^#{1,6}\s/.test(lines05[i]); i--) out.unshift(lines05[i]); return out.join('\n').trim(); };
  const operationDefs = (c) => {
    const es = edges.filter((e) => e.downSlug === c.slug && !ASYNC.test(`${e.int.protocol || ''} ${e.int.pattern || ''}`)); if (!es.length) return null;
    const ids = [...new Set(es.map((e) => e.int.id))]; const parts = [];
    ids.forEach((id) => { const b = blocks05[id]; if (b && b.text) parts.push(`### docs/05 § ${id}${b.title ? ` — ${b.title}` : ''}\n\n${cap(b.text, 3000)}`); });
    // the inventory gives each id its own row (the Protocol cell); any other table, every row that cites one of the ids
    tables(src05).forEach((t) => { const isInv = inv && t.start === inv.start; const rs = isInv ? ids.map(invRow).filter(Boolean) : t.rows.filter((r) => ids05(r, ids)); if (!rs.length) return;
      const lead = intro05(t); parts.push(`### docs/05${t.heading ? ` § ${t.heading}` : ''}\n\n${lead ? `${cap(lead, 1500)}\n\n` : ''}${renderRows(t, rs)}`); });
    return parts.length ? cap(parts.join('\n\n'), 20000) : null; };
  // a docs/05 edge with one end on the component and the other on nothing the architecture models (a team, a person, an
  // unmodelled system) has no Interface Contract; the Component Specification still lists it (8.152.0, kit-check interface-missing)
  const uncontracted = (c) => edges.filter((e) => (e.down && e.down.slug === c.slug && !e.up) || (e.up && e.up.slug === c.slug && !e.down));
  const cutSheets = selected.map((c) => { const src = compSrc(c); const raw = removeHeader(src).trim().replace(DEBT_LINE, ''); const a = resolveAssets(c, src);
    const owner = (src.match(/^\*\*(Owner|Propietario|Equipo)\s*:\*\*\s*(.+)$/im) || [])[2]; const owned = section(src, OWNED_RE);
    const incident = seams.filter((s) => s.edge.upSlug === c.slug || s.edge.downSlug === c.slug);
    const names_ = (p) => norm(`${p.owner_chain} ${p.hops || ''}`).includes(norm(c.name)); const inFlows = new Set();
    const flowsRef = (facts.flows || []).flatMap((f) => f.phases.map((n) => phaseByN[n]).filter((p) => p && names_(p)).map((p) => { inFlows.add(p.n); return `- F-${String(f.code).padStart(2, '0')} phase ${p.n} (${p.name})`; }));
    (facts.phases || []).filter((p) => names_(p) && !inFlows.has(p.n)).forEach((p) => flowsRef.push(`- phase ${p.n} (${p.name}) — in no catalogued flow`));
    const relAdrs = [...new Set([...(c.related_adrs || []), ...adrIds(src)])].sort((x, y) => adrNum(x) - adrNum(y)); const b = budgets(c);
    const p = path.join(payloadDir, `${c.slug}.md`);
    const md = fm({ component_slug: c.slug, component_file: c.file, component_type: a.type || c.type.toLowerCase().replace(/\s+/g, '-'), component_index_position: `"${c.index || ''}"`, component_version: c.component_version || '1.0.0', component_owner: owner ? plain(owner) : 'Not specified', asset_types: a.assets, ...(a.basis && !a.hint ? { asset_basis: JSON.stringify(a.basis) } : {}), ...(a.avro_default ? { serialization_default: 'avro' } : {}), ...(a.sql_engine ? { sql_engine: a.sql_engine } : {}), architecture_version: archVersion, architecture_md_path: archPath, project_name: projectName, architect, generation_date: today, doc_language: lang }) + `
## Component File (raw) <!-- SECTION: Component File -->

<!-- ${c.file}, verbatim (explorer header removed) -->

${raw}

## Owned Entities <!-- SECTION: Owned Entities -->

${owned ? `From \`${c.file}\` § ${owned.heading}:\n\n${owned.body}` : ND('the descriptor has no data-ownership section — add one, or leave the Component Specification § 6 to state it')}

## Budgets (from Runtime View) <!-- SECTION: Budgets -->

${b.length ? `${latencyFile ? `Source: \`${rel(root, latencyFile)}\`` : `Source: \`${rel(root, d04)}\` § latency budget (documented targets, not a latency-budget analysis)`}.\n\n${b.join('\n\n')}` : ND(`no budget row names ${c.name}`, latencyFile ? '' : '/sa-analysis:architecture-analysis latency-budget')}

## Seams incident on this component <!-- SECTION: Seams -->

${incident.length ? incident.map((s) => `- ../interfaces/${s.edge_key}.md   ← ${s.edge.downSlug === c.slug ? 'inbound' : 'outbound'} (${s.edge.int.id}, ${s.edge.id})`).join('\n') : uncontracted(c).length ? '' : ND('no docs/05 edge has this component as an endpoint')}
${uncontracted(c).length ? `\n**Interfaces without an Interface Contract** — the other end is no component of this architecture, so no contract is written; § 2 lists each one, pending, and it fails closed:\n\n${uncontracted(c).map((e) => { const inb = !!(e.down && e.down.slug === c.slug); const pending = undecidedSides.has(`${e.int.id}:${inb ? 'from' : 'to'}`);
  return `- ${e.int.id}   ← ${inb ? `inbound, from ${plain(e.int.from)}` : `outbound, to ${plain(e.int.to)}`} · ${plain(e.int.protocol || 'Not documented')}${pending ? ' — the other end is undecided: the judge\'s worksheet is pending, and a contract may follow once it is answered' : ''}`; }).join('\n')}\n` : ''}
## Panel <!-- SECTION: Panel -->

${(() => { const n = nodeOf(c); if (graph && !n && !report.panels.unmatched_nodes.includes(c.name)) report.panels.unmatched_nodes.push(c.name); return graph && n ? cut(neighbours(n.id), `${c.name} and its neighbours`) : graph ? ND(`the container diagram has no node labelled ${c.name}`) : cut([], ''); })()}

${/\b(avro|protobuf|asyncapi)\b/.test(a.assets.join(' ')) ? `## Message Definitions <!-- SECTION: Message Definitions -->

${messageDefs(c) || (msgSections(src).length ? `Defined in this component's own file — § ${msgSections(src).map((m) => m.heading || '(no heading)').join(', § ')} under Component File above. No async integration in docs/05 carries more.` : ND('no async integration of this component points at a documented message, and its own file defines none — add the message fields to the producer\'s component file or the docs/05 block'))}

` : ''}${/\b(openapi|graphql-sdl)\b/.test(a.assets.join(' ')) ? `## Operation Definitions <!-- SECTION: Operation Definitions -->

${operationDefs(c) || ND('no synchronous integration in docs/05 reaches this component, or none documents its operations — add the method, path and fields of each operation to the docs/05 block of the integration, or to this component\'s file')}

` : ''}## Flows referencing this component <!-- SECTION: Flows Referencing -->

${flowsRef.join('\n') || ND('no phase owner chain names this component')}

## Applicable Cross-Cutting Standards Rules <!-- SECTION: Applicable Rules -->

- ${relAdrs.join(', ') || 'Not documented'}

## Relevant ADRs <!-- SECTION: Relevant ADRs -->

${relAdrs.length ? relAdrs.map((id) => adrEntry(id, 500, payloadDir)).join('\n\n') : ND('the descriptor cites no ADR (header related_adrs or body)')}
`; fs.writeFileSync(p, (md + rowLabels.payloadSection(['cutsheet'], lang)).replace(/\n{3,}/g, '\n\n')); return { c, payload_path: p, asset_types: a.assets, hint: !!a.hint, incident: incident.length }; });

  // ---- fingerprints + skip decisions (manifest.ts, the same module manifest-cli.ts runs)
  const manifest = loadManifest(manifestPath, '0.0.0');
  const decide = (args) => { const d = shouldSkip(Object.assign({ manifest, templateVersion, schemaVersion, force: !!opts.force }, args)); return { decision: d.skip ? 'SKIP' : 'REGEN', reason: d.reason }; };
  const runHash = hashPayload(runPath, templateVersion);
  const ek = decide({ section: 'run', part: 'ekonte', payloadHash: runHash, outputFileAbsPath: path.join(handoffsDir, 'SYSTEM_RUNTIME_VIEW.md') }), st = decide({ section: 'run', part: 'settei', payloadHash: runHash, outputFileAbsPath: path.join(handoffsDir, 'CROSS_CUTTING_STANDARDS.md') });
  const result = { status: report.status, payload_dir: payloadDir, generation_date: today, doc_language: lang, shared_docs_read: report.read.shared_docs.length, analyses_read: report.read.analyses.length, institutional_adrs_read: report.read.institutional_adrs, warnings: report.warnings, edge_cross_check_warnings: report.edge_cross_check_warnings, unresolved_endpoints: report.unresolved_endpoints, undecided_endpoints: report.undecided_endpoints, endpoint_review: report.endpoint_review,
    panels: report.panels,
    run: { ekonte_payload_path: runPath, settei_payload_path: runPath, ekonte_payload_hash: runHash, settei_payload_hash: runHash, ekonte_decision: ek.decision, settei_decision: st.decision, ekonte_reason: ek.reason, settei_reason: st.reason },
    seams: seams.map((s) => { const h = hashPayload(s.payload_path, templateVersion); const d = decide({ section: 'seams', edgeKey: s.edge_key, payloadHash: h, outputFileAbsPath: path.join(handoffsDir, 'interfaces', `${s.edge_key}.md`) }); return { edge_key: s.edge_key, edge_id: s.edge.id, integration: s.edge.int.id, payload_path: s.payload_path, payload_hash: h, decision: d.decision, reason: d.reason, seam_file_rel: `interfaces/${s.edge_key}.md`, related_adrs: s.related_adrs }; }),
    cut_sheets: cutSheets.map((x) => { const h = hashPayload(x.payload_path, templateVersion); const nn = String(x.c.index || '').split('.').pop().padStart(2, '0'); const f = `components/${nn}-${x.c.slug}.md`; const d = decide({ section: 'cut_sheets', slug: x.c.slug, payloadHash: h, outputFileAbsPath: path.join(handoffsDir, f) }); return { slug: x.c.slug, name: x.c.name, component_index_position: x.c.index, payload_path: x.payload_path, payload_hash: h, decision: d.decision, reason: d.reason, asset_types: x.asset_types, asset_hints_override: x.hint, doc_language: lang, cut_sheet_file_rel: f, component_version: x.c.component_version || '1.0.0', seams_incident: x.incident }; }) };
  // edit mode (kit-edit.js, 10.9.0): a REGEN part that exists is edited against the delta of its sources since the release it
  // was written at — never rewritten in other words; a part whose re-cut payload did not move is kept
  if (!opts.baseline && !opts.force) {
    const runV = manifest.run && manifest.run.architecture_version, parts = [], hashMoved = (d) => d.decision === 'REGEN' && d.reason === 'payload hash changed';
    const runPart = (part, d, file) => { if (hashMoved(d)) parts.push({ key: `run:${part}`, payload_path: runPath, output: path.join(handoffsDir, file), version: runV,
      set: (e, why) => { if (why) { d.decision = 'SKIP'; d.reason = why; result.run[`${part}_decision`] = 'SKIP'; result.run[`${part}_reason`] = why; } else result.run[`${part}_edit_path`] = e; } }); };
    runPart('ekonte', ek, 'SYSTEM_RUNTIME_VIEW.md'); runPart('settei', st, 'CROSS_CUTTING_STANDARDS.md');
    const entryPart = (key, x, file, version) => { if (hashMoved(x)) parts.push({ key, payload_path: x.payload_path, output: path.join(handoffsDir, file), version,
      set: (e, why) => { if (why) { x.decision = 'SKIP'; x.reason = why; } else x.edit_path = e; } }); };
    for (const x of result.seams) entryPart(`seam:${x.edge_key}`, x, x.seam_file_rel, runV);
    for (const x of result.cut_sheets) entryPart(`cut-sheet:${x.slug}`, x, x.cut_sheet_file_rel, (manifest.cut_sheets[x.slug] || {}).architecture_version);
    const e = await editBaselines(root, { prepare, opts, payloadDir, parts });
    result.edits = e.edits; result.kept_on_recut = e.skipped;
  }
  // a kept part is the architecture's at this version too: its Architecture Version row and its manifest entry move by code,
  // with the hash in the stamp-free form — the model rewrites nothing that did not change (10.8.2)
  const restamped = [], keep = (file, entry, hashKeys, hash) => {
    const f = path.join(handoffsDir, file); if (/^\d+\.\d+\.\d+$/.test(archVersion) && fs.existsSync(f)) { const src = fs.readFileSync(f, 'utf8'), out = restampVersion(src, archVersion); if (out !== src) { fs.writeFileSync(f, out); restamped.push(file); } }
    for (const k of hashKeys) entry[k] = hash; if ('architecture_version' in entry && /^\d+\.\d+\.\d+$/.test(archVersion)) entry.architecture_version = archVersion; };
  if (opts.baseline) return { report, result, edges, payload_dir: payloadDir };
  if (ek.decision === 'SKIP') keep('SYSTEM_RUNTIME_VIEW.md', manifest.run, ['ekonte_hash'], runHash);
  if (st.decision === 'SKIP') keep('CROSS_CUTTING_STANDARDS.md', manifest.run, ['settei_hash'], runHash);
  for (const s of result.seams) if (s.decision === 'SKIP') keep(s.seam_file_rel, manifest.seams[s.edge_key], ['payload_hash'], s.payload_hash);
  for (const x of result.cut_sheets) if (x.decision === 'SKIP') keep(x.cut_sheet_file_rel, manifest.cut_sheets[x.slug], ['payload_hash'], x.payload_hash);
  if ([ek, st, ...result.seams, ...result.cut_sheets].some((d) => d.decision === 'SKIP')) saveManifest(manifestPath, manifest);
  result.restamped = restamped;
  fs.writeFileSync(path.join(payloadDir, 'context-result.json'), JSON.stringify(result, null, 1));
  return { report, result, edges, payload_dir: payloadDir };
}

// ---------- CONTEXT_RESULT as the orchestrator reads it
const yaml = (r) => { const list = (k, items, fields) => items.length ? `  ${k}:\n${items.map((it) => '    - ' + fields.filter((f) => it[f] !== undefined).map((f, i) => `${i ? '      ' : ''}${f}: ${Array.isArray(it[f]) ? '[' + it[f].join(', ') + ']' : it[f]}`).join('\n')).join('\n')}` : `  ${k}: []`;
  const strs = (k, a) => a.length ? `  ${k}:\n${a.map((w) => `    - "${String(w).replace(/"/g, '\\"')}"`).join('\n')}` : `  ${k}: []`;
  return `CONTEXT_RESULT:\n  status: ${r.status}\n  payload_dir: ${r.payload_dir}\n  shared_docs_read: ${r.shared_docs_read}\n  analyses_read: ${r.analyses_read}\n  institutional_adrs_read: ${r.institutional_adrs_read}\n${strs('warnings', r.warnings)}\n${strs('edge_cross_check_warnings', r.edge_cross_check_warnings)}\n${strs('unresolved_endpoints', r.unresolved_endpoints)}\n${strs('undecided_endpoints', r.undecided_endpoints)}\n${strs('endpoint_review', r.endpoint_review)}\n  run:\n${Object.entries(r.run).map(([k, v]) => `    ${k}: ${v}`).join('\n')}\n${list('seams', r.seams, ['edge_key', 'payload_path', 'payload_hash', 'decision', 'reason', 'edit_path', 'seam_file_rel', 'related_adrs'])}\n${list('cut_sheets', r.cut_sheets, ['slug', 'payload_path', 'payload_hash', 'decision', 'reason', 'edit_path', 'asset_types', 'asset_hints_override', 'doc_language', 'cut_sheet_file_rel', 'component_version'])}`; };

module.exports = { prepare, tables, section, labelBlock, parseFlowchart, emitFlowchart, TEMPLATE_VERSION, SCHEMA_VERSION };   // exported so a fixture pins the constant, never a literal that a template bump silently invalidates

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun handoff-prepare.js <project_root> --components <all|slug,slug,…> [--force] [--date YYYY-MM-DD] [--out <payload_dir>] [--handoffs <dir>] [--template-version 4.0.0] [--schema-version 4] [--json]'); process.exit(2); }
  let r; try { r = await prepare(args[0], { components: opt('--components') || 'all', force: args.includes('--force'), date: opt('--date'), out: opt('--out'), handoffs: opt('--handoffs'), templateVersion: opt('--template-version'), schemaVersion: opt('--schema-version'), judge: opt('--judge'), judgeAnswers: opt('--judge-answers'), judgeAlsoAnswers: opt('--judge-also-answers'), verify: opt('--verify') }); } catch (e) { console.error('handoff-prepare: ' + (e.stack || e.message)); process.exit(2); }
  if (r.report.status === 'FAILED') { console.log(`CONTEXT_RESULT:\n  status: FAILED\n  abort_reason: "${r.report.abort_reason}"`); console.error('handoff-prepare: ' + r.report.abort_reason); process.exit(1); }
  const R = r.result, rp = r.report;
  console.error(`Payloads: ${R.payload_dir} — _run.md (${Math.round(fs.statSync(R.run.ekonte_payload_path).size / 1024)} KB), ${R.seams.length} seam(s), ${R.cut_sheets.length} component payload(s); ${rp.read.shared_docs.length} shared docs, ${rp.read.analyses.length} analyses, ${rp.read.institutional_adrs} institutional ADRs, ${rp.read.component_files} descriptors read`);
  console.error(`Edges: ${r.edges.length} active (${r.edges.filter((e) => e.style === 'async').length} async)${rp.unresolved_endpoints.length ? ` — ${rp.unresolved_endpoints.length} endpoint(s) not a documented component (edge kept, no seam): ${rp.unresolved_endpoints.join('; ')}` : ''}${rp.undecided_endpoints.length ? ` — ${rp.undecided_endpoints.length} endpoint(s) UNDECIDED (no seam until the judge answers): ${rp.undecided_endpoints.join('; ')}` : ''}`);
  const pn = rp.panels; console.error(`Panels: ${pn.phases} phase sequence diagram(s)${pn.phases_without.length ? ` (phases without one: ${pn.phases_without.join(', ')})` : ''}; ${pn.cuts} cut(s) of ${pn.diagram || 'no container diagram'}${pn.unmatched_nodes.length ? ` — no node labelled: ${pn.unmatched_nodes.join(', ')}` : ''}${pn.undecided_labels.length ? ` — ${pn.undecided_labels.length} node label(s) UNDECIDED (${pn.undecided_labels.join(', ')}; answer ${pn.worksheet || 'the judge worksheet'} and re-run)` : ''}${pn.rejected.length ? ` — REJECTED by the diagram gate: ${pn.rejected.join('; ')}` : ''}`);
  console.error(`Decisions: Runtime View ${R.run.ekonte_decision} (${R.run.ekonte_reason}); Cross-Cutting ${R.run.settei_decision} (${R.run.settei_reason}); seams ${R.seams.filter((s) => s.decision === 'REGEN').length} REGEN / ${R.seams.filter((s) => s.decision === 'SKIP').length} SKIP; components ${R.cut_sheets.filter((s) => s.decision === 'REGEN').length} REGEN / ${R.cut_sheets.filter((s) => s.decision === 'SKIP').length} SKIP`);
  if ((R.edits || []).length) console.error(`Edit mode — edited in place against the delta since their release: ${R.edits.join(', ')}`);
  if ((R.kept_on_recut || []).length) console.error(`Kept — the payload re-cut from their release is the same: ${R.kept_on_recut.join(', ')}`);
  if (R.restamped.length) console.error(`Kept, the Architecture Version row restamped by code: ${R.restamped.join(', ')}`);
  if (rp.endpoint_review.length) console.error(`Endpoint review (${rp.endpoint_review.length}):\n${rp.endpoint_review.map((w) => '  - ' + w).join('\n')}`);
  if (rp.warnings.length) console.error(`Warnings (${rp.warnings.length}):\n${rp.warnings.map((w) => '  - ' + w).join('\n')}`);
  if (rp.edge_cross_check_warnings.length) console.error(`Edge cross-check (${rp.edge_cross_check_warnings.length}):\n${rp.edge_cross_check_warnings.map((w) => '  - ' + w).join('\n')}`);
  console.log(args.includes('--json') ? JSON.stringify(R, null, 1) : yaml(R));
})();
