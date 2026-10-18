#!/usr/bin/env bun
// kit-check.js — the gate every written handoff-kit part passes (Step 5.2b).
//
//   bun kit-check.js <handoffs_dir | file.md …> [--fix] [--no-render] [--render] [--json] [--lang en|es]
//
// A directory argument is a kit: it must carry SYSTEM_RUNTIME_VIEW.md, CROSS_CUTTING_STANDARDS.md and a components/NN-<slug>.md
// for every assets/NN-<slug>/ (`kit-incomplete`). It also holds every assets/*/openapi.yaml and asyncapi.yaml to contract-check.js (parse, structure,
// fidelity to the descriptor in the cut-sheet payload, Redocly); its BLOCKING findings fail the kit like any other.
//
// Per file: an H1; the managed marker and a TEMPLATE_VERSION marker; no template placeholder left outside
// an HTML comment (`[UPSTREAM_COMPONENT]`, `[N]ms`, `[FLOW_PANELS …]` — `[NOT DOCUMENTED — …]` is the
// sanctioned gap marker, never a placeholder); no authoring-rule comment carried into a deliverable
// ("do not render"); a `<!-- SECTION: … -->` anchor on every H2 and on the Role Quick Index; every
// phase drawn once — in § Phase Catalog, never again under a flow; and every ```mermaid fence held to
// mermaid-check.js (the panels and the main images are cut by handoff-prepare.js and carried verbatim —
// a fence that fails here was edited by a generator).
//
// vocabulary — the internal names (Ekonte, Settei, seam, cut sheet) never reach a delivered document, in any
// language. Through 8.27.0 the templates themselves carried `seam` on their delivered surface ("Reads-only
// (via this seam)", "a seam change") and a generator prescribed `[NOT DOCUMENTED — add per-seam metrics …]`,
// while the preservation policy said "preserve all other text exactly": two rules no agent could satisfy
// at once, and one cohort's three Interface Contracts resolved it three ways. The templates are clean since
// 4.3.1; this rule keeps them so. Comments and fences are not scanned — the words are legal there.
//
// interaction-label-missing / -drift / -ungoverned — an Interface Contract against its seam payload (8.110.0): under
// `design_language: governed` the Interaction label row carries the payload's `interaction_label` (the container
// diagram's edge label) verbatim; under `fallback` the row is absent. On 2026-10-01 an orchestrator stripped the row from
// five governed contracts because it looked for the standard in the project; the mode is the payload's, never a guess.
//
// row-label-language / row-label-unregistered — every label row of a kit part against its template's label table and
// ROW_LABELS.json (8.111.0, row-labels.js): under `es` the cell is the registered Spanish label (a technical term kept in
// English is registered as itself), under `en` the template label. `--fix` rewrites an English label, or the registered
// one up to case / accents / spacing, in place; a free translation stays a finding naming the allowed labels.
//
// (before 8.111.0, and still for a file that is no kit part) row-label-language — when the kit's language is not English, a first-column cell that is one of the
// templates' English row labels verbatim was not localized. The lexicon is read from the four templates at
// run time (their label/value tables' literal first cells), never transcribed here; bold role names of the
// Role Quick Index and placeholders are not labels. Column headers are exempt — they are on the
// do-not-localize registry; a row label is a cell. The language comes from `--lang` or the project's
// `<!-- DOC_LANGUAGE: -->` marker, found by walking up from the checked path to ARCHITECTURE.md.
//
// The anchor rule is what makes the language contract checkable. Each generator is told to localize
// visible headings and to emit the English anchor beside them; through 4.1.0 the templates carried no
// anchors, so two of the four agents added them and two did not — `CROSS_CUTTING_STANDARDS.md` came out
// with nine English headings in a Spanish kit and not one anchor, and nothing noticed. The templates
// carry the anchors from 4.2.0 and this rule holds the output to them.
//
// The panel rule is one heading per phase. Through 4.2.0 a flow's panels were re-drawn under every flow
// that used them, by design, and the rule only refused two copies that differed. Since 4.3.0 the flow shows
// its derived end-to-end sequence (steps `N.M` point into the catalog) and every phase is drawn once in
// § Phase Catalog — so a second `### Phase N` is the regression, identical or not.
'use strict';
const fs = require('fs');
const path = require('path');
const { check: mermaidCheck } = require(require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js')).fromSaSkills('scripts', 'shared', 'mermaid-check.js'));
const contractCheck = require(path.join(__dirname, 'contract-check.js'));
const rowLabels = require(path.join(__dirname, 'row-labels.js'));

const PLACEHOLDER = /\[(?!NOT DOCUMENTED\b)(?!(?:ADR|TDR|UC|I|F|E|B|C|K|T|S|D)-\d)[A-Z][A-Z0-9_]{2,}(?:[ —–-][^\]\n]*)?\]|\[(?:N|P|TOTAL|G|H|NN)\](?:ms|%)?/g;   // an id in brackets (`[ADR-120]`, `[I-10]`) is a citation, not a placeholder
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));   // keep line numbers
const stripFences = (s) => s.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '));
const stripLinks = (s) => s.replace(/\[[^\]\n]*\]\([^)\n]*\)/g, (m) => ' '.repeat(m.length));   // link text is prose, not a placeholder
const VOCAB = /\b(seams?|ekonte|settei|cut[ -]sheets?)\b/gi;
const TEMPLATES = ['SEAM_SPEC_TEMPLATE.md', 'SETTEI_TEMPLATE.md', 'SYSTEM_EKONTE_TEMPLATE.md', 'CUT_SHEET_TEMPLATE.md'];
// the English row labels of the templates' label/value tables — read from the files in force, so a template edit moves the rule with it
let LEXICON = null;
function lexicon() {
  if (LEXICON) return LEXICON; LEXICON = new Set();
  for (const t of TEMPLATES) { const f = path.join(__dirname, '..', t); if (!fs.existsSync(f)) continue;
    fs.readFileSync(f, "utf8").replace(/\r\n?/g, "\n").split('\n').forEach((l, i, ls) => {
      if (!/^\|/.test(l) || /^\|[-\s|:]*$/.test(l)) return;
      if (!/^\|/.test(ls[i - 1] || '')) return;   // the first row of a table is its header, not a label
      const cell = l.split('|')[1].trim();
      if (!cell || /^\[/.test(cell) || /^\*\*/.test(cell) || /^[\d§#]/.test(cell) || cell.length < 3) return;
      LEXICON.add(cell); }); }
  return LEXICON;
}
// the kit's language: --lang, else the DOC_LANGUAGE marker of the ARCHITECTURE.md found walking up from the checked path
function langOf(file, explicit) {
  if (explicit) return explicit;
  let d = path.dirname(path.resolve(file));
  for (let i = 0; i < 6; i++) { const a = path.join(d, 'ARCHITECTURE.md'); if (fs.existsSync(a)) { const m = fs.readFileSync(a, "utf8").replace(/\r\n?/g, "\n").match(/<!--\s*(?:DOC_)?LANGUAGE:\s*([a-z]{2})/i); return m ? m[1].toLowerCase() : 'en'; } const up = path.dirname(d); if (up === d) break; d = up; }
  return 'en';
}

// the architecture version a part must carry: the `<!-- ARCHITECTURE_VERSION: -->` marker of the ARCHITECTURE.md found walking
// up from the checked path (null outside a project: not checked)
function archVersionOf(file) {
  let d = path.dirname(path.resolve(file));
  for (let i = 0; i < 6; i++) { const a = path.join(d, 'ARCHITECTURE.md'); if (fs.existsSync(a)) { const m = fs.readFileSync(a, 'utf8').match(/<!--\s*ARCHITECTURE_VERSION:\s*v?(\d+\.\d+\.\d+)\s*-->/); return m ? m[1] : null; } const up = path.dirname(d); if (up === d) break; d = up; }
  return null;
}
const VERSION_ROW = /^(architecture version|versi[oó]n de la arquitectura)$/i;
// version-stale — a part's Architecture Version row against the architecture it was cut from (8.152.0). A payload cut before a
// release wrote the old version into the Component Specification while the manifest said the new one, and the build pack
// shipped both: the developer read "8.1.1" in the 8.1.2 pack.
function versionFindings(src, file) {
  const want = archVersionOf(file); if (!want) return [];
  const out = []; stripFences(stripComments(src)).split('\n').forEach((l, i) => {
    if (!/^\|/.test(l)) return; const cells = l.split('|'); if (!VERSION_ROW.test(plainCell((cells[1] || '').replace(/\*\*/g, '')))) return;
    const v = ((cells[2] || '').match(/\d+\.\d+\.\d+/) || [])[0];
    if (v !== want) out.push({ rule: 'version-stale', line: i + 1, text: `Architecture Version ${v || `"${plainCell(cells[2] || '')}"`} — the architecture is ${want}; cut the payloads after the release and regenerate this part` }); });
  return out;
}
// interface-missing — every interface the component's security obligations list (security-obligations.js, from docs/05 by code:
// each live I-nn the component sends or receives) is named in § 2 Position of its Component Specification, or by an Interface
// Contract § 2 links (8.152.0). An I-nn whose other end is no component of the architecture has no Interface Contract, and the
// specification dropped it while the security part still listed it: the builder read two different lists of inputs.
const INT_ID = /\bI-\d+[a-z]?\b/g;
const idRe = (id) => new RegExp(`(^|[^\\w-])${id}(?![\\w])`);
function securityInterfaces(sec) {
  const out = []; let dir = null;
  sec.replace(/\r\n?/g, '\n').split('\n').forEach((l) => {
    const h = l.match(/^##\s.*<!--\s*SECTION:\s*(Inbound|Outbound)\s*-->/); if (h) { dir = h[1].toLowerCase(); return; } if (/^##\s/.test(l)) { dir = null; return; }
    if (!dir || !/^\|/.test(l)) return; const c = plainCell(l.split('|')[1] || ''); if (/^I-\d+[a-z]?$/.test(c)) out.push({ id: c, dir, other: plainCell(l.split('|')[2] || '') }); });
  return out;
}
function interfaceFindings(specFile, src, sec) {
  const lines = src.split('\n'); const at = lines.findIndex((l) => /^##\s.*<!--\s*SECTION:\s*Position\s*-->/.test(l));
  if (at < 0) return [];
  let end = lines.findIndex((l, i) => i > at && /^##\s/.test(l)); if (end < 0) end = lines.length;
  const body = stripComments(lines.slice(at, end).join('\n'));
  const linked = [...body.matchAll(/\]\(([^)\s]*interfaces\/[^)\s]+\.md)\)/g)].map((m) => { try { return path.resolve(path.dirname(specFile), decodeURI(m[1])); } catch { return path.resolve(path.dirname(specFile), m[1]); } })
    .filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8'));
  const named = (id) => idRe(id).test(body) || linked.some((t) => idRe(id).test(t));
  return securityInterfaces(sec).filter((x) => !named(x.id)).map((x) => ({ rule: 'interface-missing', line: at + 1,
    text: `${x.id} (${x.dir === 'inbound' ? 'inbound, from' : 'outbound, to'} ${x.other}) — the security obligations list it; § 2 Position names neither it nor an Interface Contract carrying it. An interface without a contract is listed there as such, pending, and fails closed` }));
}

// the seam payload behind an Interface Contract: <root>/.cache/sa-skills/handoff-payloads/seams/<same name>, root = the
// directory holding ARCHITECTURE.md above the file; its `design_language` and `interaction_label` frontmatter keys
const INTERACTION_ROW = /^(interaction label|etiqueta de interacci[oó]n)$/i;
const plainCell = (c) => String(c).trim().replace(/^`(.*)`$/, '$1').trim();
function seamPayloadOf(file) {
  const abs = path.resolve(file); if (path.basename(path.dirname(abs)) !== 'interfaces') return null;
  let d = path.dirname(abs);
  for (let i = 0; i < 8; i++) { if (fs.existsSync(path.join(d, 'ARCHITECTURE.md'))) break; const up = path.dirname(d); if (up === d) return null; d = up; }
  const p = path.join(d, '.cache', 'sa-skills', 'handoff-payloads', 'seams', path.basename(abs)); if (!fs.existsSync(p)) return null;
  const fm = (fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const key = (k) => { const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); if (!m) return null; const v = m[1].trim(); try { return /^"/.test(v) ? JSON.parse(v) : v; } catch { return v; } };
  const mode = key('design_language'), up = key('upstream_name'), down = key('downstream_name');
  return mode || up ? { mode, label: key('interaction_label'), path: p, upstream: key('upstream'), downstream: key('downstream'), upstreamName: up, downstreamName: down } : null;
}

const titleOf = (sp, lang) => `${lang === 'es' ? 'Contrato de Interfaz' : 'Interface Contract'}: ${sp.upstreamName} → ${sp.downstreamName}`;
// a line's protected spans — code, links, comments, file names and paths — kept verbatim; the rest is visible text
const PROTECT = /`[^`]*`|!?\[[^\]\n]*\]\([^)\n]*\)|<!--.*?-->|[^\s|()[\]]*\/[^\s|()[\]]*|[^\s|()[\]]+\.(?:md|ya?ml|json|sql|proto|graphql|avsc)\b|[^\s|()[\]]+→[^\s|()[\]]+/g;
const slugRe = (slug) => new RegExp(`(^|[^\\w-])(${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w-])`, 'g');
/** Visible-text segments of each line (fences and multi-line comments skipped), with a rewrite of the slugs to names. */
function slugPass(src, sp, rewrite) {
  const pairs = [[sp.upstream, sp.upstreamName], [sp.downstream, sp.downstreamName]].filter(([s, n]) => s && n && s !== n);
  const ls = src.split('\n'); let fence = false, comment = false; const hits = [];
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]; if (/^```/.test(l)) { fence = !fence; continue; } if (fence) continue;
    if (comment) { if (/-->/.test(l)) comment = false; continue; } if (/<!--(?![\s\S]*-->)/.test(l)) { comment = true; continue; }
    if (i === 0 || /^#\s/.test(l)) continue;   // the H1 is its own rule
    let out = '', last = 0; const segs = [];
    for (const m of l.matchAll(PROTECT)) { segs.push([l.slice(last, m.index), true]); segs.push([m[0], false]); last = m.index + m[0].length; } segs.push([l.slice(last), true]);
    out = segs.map(([t, vis]) => { if (!vis) return t; let r = t; pairs.forEach(([slug, name]) => { r = r.replace(slugRe(slug), (all, pre, s) => { hits.push({ line: i + 1, slug: s, name }); return `${pre}${name}`; }); }); return r; }).join('');
    if (rewrite) ls[i] = out;
  }
  return { hits, text: ls.join('\n') };
}
function slugFindings(src, sp, lang) {
  const out = []; const h1 = src.match(/^#\s+(.+?)\s*$/m); const want = titleOf(sp, lang);
  if (h1 && h1[1] !== want) out.push({ rule: 'title-names', line: src.slice(0, h1.index).split('\n').length, text: `H1 "${h1[1]}" — an Interface Contract is titled by the canonical names: "${want}" (kit-check --fix writes it)` });
  slugPass(src, sp, false).hits.forEach((h) => out.push({ rule: 'component-slug', line: h.line, text: `\`${h.slug}\` in visible text — the canonical name is "${h.name}" (kit-check --fix writes it; file names and links keep the slug)` }));
  return out;
}
/** --fix for the names: the H1 and every slug in visible text. */
function fixNames(file, src, lang) {
  const sp = seamPayloadOf(file); if (!sp || !sp.upstreamName || !sp.downstreamName) return { text: src, n: 0 };
  let n = 0; let text = src.replace(/^#\s+(.+?)\s*$/m, (all, t) => { const w = titleOf(sp, lang); if (t === w) return all; n++; return `# ${w}`; });
  const r = slugPass(text, sp, true); n += r.hits.length; return { text: r.text, n };
}

function checkFile(file, opts = {}) {
  const src = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n"); const findings = [];
  if (!/^#\s+\S/m.test(src)) findings.push({ rule: 'h1', line: 1, text: 'no H1' });
  if (!/<!--\s*managed by sa-skills:architecture-dev-handoff/.test(src)) findings.push({ rule: 'managed-marker', line: 1, text: 'no `managed by sa-skills:architecture-dev-handoff` marker' });
  if (!/<!--\s*TEMPLATE_VERSION:\s*\d+\.\d+\.\d+\s*-->/.test(src) && !/README\.md$/.test(file)) findings.push({ rule: 'template-version', line: 1, text: 'no TEMPLATE_VERSION marker' });
  src.split('\n').forEach((l, i) => { if (/do not render|authoring rule for/i.test(l)) findings.push({ rule: 'authoring-rule', line: i + 1, text: l.trim() }); });
  const body = stripLinks(stripFences(stripComments(src)));
  body.split('\n').forEach((l, i) => { const m = l.match(PLACEHOLDER); if (m) findings.push({ rule: 'placeholder', line: i + 1, text: m.join(' ') }); });

  // vocabulary — the delivered surface only: comments and fences stripped, link targets kept out (a path is not prose)
  stripLinks(stripFences(stripComments(src))).split('\n').forEach((l, i) => { const hits = l.match(VOCAB); if (hits) findings.push({ rule: 'vocabulary', line: i + 1, text: `internal name in a delivered document: ${[...new Set(hits.map((h) => h.toLowerCase()))].join(', ')} — say Interface Contract / interface, System Runtime View, Cross-Cutting Standards, Component Specification` }); });

  // row labels — under a non-English kit, a first-column cell that is a template's English label verbatim
  // A kit part is held to its template's label tables and ROW_LABELS.json (8.111.0); any other file keeps the lexicon test.
  const lang = langOf(file, opts.lang);
  const labels = rowLabels.review(file, src, lang);
  if (labels.kind) labels.findings.forEach((x) => findings.push(x));
  else if (lang !== 'en' && !/README\.md$/.test(file)) {
    const lex = lexicon(); const lines = stripFences(src).split('\n');
    lines.forEach((l, i) => { if (!/^\|/.test(l) || /^\|[-\s|:]*$/.test(l)) return; const prev = lines[i - 1] || ''; if (!/^\|/.test(prev)) return;   // the first row of a table is its header: exempt
      const cell = l.split('|')[1].trim(); if (lex.has(cell) && rowLabels.translate(cell, lang) !== cell) findings.push({ rule: 'row-label-language', line: i + 1, text: `row label left in English under doc_language ${lang}: "${cell}"` }); });
  }

  // interaction label — an Interface Contract against its own payload: under `design_language: governed` the row carries
  // the payload's `interaction_label` verbatim; under `fallback` there is no row. A payload without the key (before
  // 8.110.0) or no payload on disk: not checked.
  const sp = seamPayloadOf(file);
  if (sp) {
    const lines = stripFences(stripComments(src)).split('\n');
    const at = lines.findIndex((l) => /^\|/.test(l) && INTERACTION_ROW.test(l.split('|')[1].trim()));
    const value = at >= 0 ? plainCell(lines[at].split('|')[2] || '') : null;
    if (!sp.mode) { /* names only — a payload carrying the canonical names, not the mode */ }
    else if (sp.mode === 'governed') {
      if (at < 0) findings.push({ rule: 'interaction-label-missing', line: 1, text: `no Interaction label row — design_language is governed; carry the payload's interaction_label: ${sp.label}` });
      else if (sp.label && value !== sp.label) findings.push({ rule: 'interaction-label-drift', line: at + 1, text: `Interaction label "${value}" — the payload's interaction_label (the container diagram's edge label) is "${sp.label}"` });
    } else if (sp.mode === 'fallback' && at >= 0) findings.push({ rule: 'interaction-label-ungoverned', line: at + 1, text: 'Interaction label row under design_language: fallback — the row exists only in governed mode; remove it' });
  }

  // canonical names — an Interface Contract names its endpoints by the component file's H1, never by slug (8.112.0). The
  // H1 is `Interface Contract: <upstream> → <downstream>` (`Contrato de Interfaz:` under es); a slug in visible text —
  // outside code spans, links, comments, fences and file names — is the slug where the name belongs. `--fix` writes both.
  if (sp && sp.upstreamName && sp.downstreamName) slugFindings(src, sp, langOf(file, opts.lang)).forEach((x) => findings.push(x));

  versionFindings(src, file).forEach((x) => findings.push(x));

  // anchors — every H2, and the Role Quick Index wherever it sits. README.md is rendered by kit-readme.js and has none.
  if (!/README\.md$/.test(file)) {
    const lines = stripFences(src).split('\n');
    lines.forEach((l, i) => {
      const h2 = l.match(/^##\s+(?!#)(.+)$/);
      if (h2 && !/<!--\s*SECTION:\s*[^>]+-->/.test(l)) findings.push({ rule: 'anchor', line: i + 1, text: `H2 without a SECTION anchor: ${h2[1].trim()}` });
      const idx = l.match(/^###\s+(.+)$/);
      if (idx && /^(role quick index|[ií]ndice r[aá]pido por rol)$/i.test(idx[1].replace(/\s*<!--[\s\S]*$/, '').trim()) && !/<!--\s*SECTION:\s*Role Quick Index\s*-->/.test(l)) {
        findings.push({ rule: 'anchor', line: i + 1, text: 'Role Quick Index without its `<!-- SECTION: Role Quick Index -->` anchor' });
      }
    });
  }

  // phase panels — drawn once, in § Phase Catalog. Through 4.2.0 the storyboard re-drew a phase under every flow
  // that used it (25 panels for 10 phases on the reference project); since 4.3.0 the flow carries its derived
  // end-to-end sequence and the phases live once in the catalog, so a second heading for the same phase is the finding.
  const seen = new Map();
  const panelRe = /^###\s+(?:Panel\s*[—–-]\s*)?(?:Phase|Fase)\s+(\d+[a-z]?)\b[^\n]*\n+(?:[^\n#][^\n]*\n+)*?```mermaid\n([\s\S]*?)\n```/gm;
  for (let m; (m = panelRe.exec(src)) !== null; ) {
    const n = m[1], fence = m[2], line = src.slice(0, m.index).split('\n').length;
    const first = seen.get(n);
    if (!first) seen.set(n, { fence, line });
    else findings.push({ rule: 'panel-repeated', line, text: `phase ${n} is drawn again — already at line ${first.line}${first.fence !== fence ? ', and differently' : ''}. A phase is drawn once, in § Phase Catalog; a flow shows its own end-to-end sequence` });
  }
  return { file, findings };
}

function check(targets, opts = {}) {
  const files = targets.flatMap((t) => fs.statSync(t).isDirectory() ? walk(t) : [t]).filter((f) => /\.md$/.test(f));
  // --fix: a label row whose cell is the English label, or the registered one up to case / accents / spacing, is rewritten
  // to the registered label before the check — a fixed table, never a re-dispatch. Anything else stays a finding.
  const fixed = [];
  if (opts.fix) files.forEach((f) => { const src = fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n'); const r = rowLabels.review(f, src, langOf(f, opts.lang));
    let text = r.fixes.length ? rowLabels.applyFixes(src, r.fixes) : src; const names = fixNames(f, text, langOf(f, opts.lang)); text = names.text;
    if (r.fixes.length || names.n) { fs.writeFileSync(f, text); fixed.push({ file: f, labels: r.fixes.length, ...(names.n ? { names: names.n } : {}) }); } });
  const result = { status: 'PASS', files: files.map((f) => checkFile(f, { lang: opts.lang })), mermaid: null, fixed };
  const mm = mermaidCheck(files, { render: opts.render }); result.mermaid = { status: mm.status, render: mm.render, files: mm.files };
  mm.files.forEach((f) => { const r = result.files.find((x) => x.file === f.file); f.blocks.forEach((b) => { b.findings.forEach((x) => r.findings.push({ rule: `mermaid/${x.rule}`, line: x.line, text: x.text })); if (b.renderError) r.findings.push({ rule: 'mermaid/render', line: b.startLine, text: String(b.renderError).slice(0, 160) }); }); });
  // assets/*/openapi.yaml and asyncapi.yaml — held to contract-check.js (parse, structure, fidelity to the cut-sheet payload, Redocly)
  const dirs = targets.filter((t) => fs.statSync(t).isDirectory());
  if (dirs.length) { const cc = contractCheck.check(dirs, opts.redoclyLint ? { redoclyLint: opts.redoclyLint } : {}); result.contracts = { files: cc.files.length, redocly: [...new Set(cc.files.map((f) => f.engine || f.redocly).filter(Boolean))].join(' · ') || 'no contract' };
    cc.files.forEach((f) => result.files.push({ file: f.file, findings: f.findings.map((x) => ({ rule: `${f.kind}/${x.rule}`, line: x.line || 1, text: x.text })), warnings: f.warnings.map((x) => ({ rule: `${f.kind}/${x.rule}`, line: x.line || 1, text: x.text })) }));
    // security-missing — every Component Specification has its security obligations beside its assets, rendered by
    // security-obligations.js (8.149.0): who may call it, how each interface authenticates, its threats. A kit without
    // them hands a builder contracts with no security scheme and nothing that says the interface must fail closed.
    dirs.forEach((d) => { const cd = path.join(d, 'components'); if (!fs.existsSync(cd)) return;
      fs.readdirSync(cd).filter((n) => /^\d+-.+\.md$/.test(n)).forEach((n) => { const sec = path.join(d, 'assets', n.replace(/\.md$/, ''), 'security.md');
        const ok = fs.existsSync(sec) && /<!--\s*managed by sa-skills:architecture-dev-handoff — rendered by security-obligations\.js/.test(fs.readFileSync(sec, 'utf8'));
        if (!ok) { const r = result.files.find((x) => x.file === path.join(cd, n)) || (result.files.push({ file: path.join(cd, n), findings: [] }), result.files[result.files.length - 1]);
          r.findings.push({ rule: 'security-missing', line: 1, text: `no ${path.relative(d, sec)} rendered by security-obligations.js — run it for this component` }); }
        else { const spec = path.join(cd, n); const miss = interfaceFindings(spec, fs.readFileSync(spec, 'utf8').replace(/\r\n?/g, '\n'), fs.readFileSync(sec, 'utf8'));
          if (miss.length) { const r = result.files.find((x) => x.file === spec) || (result.files.push({ file: spec, findings: [] }), result.files[result.files.length - 1]); miss.forEach((x) => r.findings.push(x)); } } }); }); }
  // kit-incomplete — a kit root (a directory with assets/) carries the two shared parts and one Component Specification per
  // component whose assets code rendered (c4-descriptor.js writes assets/NN-<slug>/ for every component in scope). Every
  // check above holds the files that exist; a run whose generators never wrote (a headless session that ended while its
  // sub-agents ran) left a kit of descriptors alone, and it passed.
  dirs.filter((d) => fs.existsSync(path.join(d, 'assets'))).forEach((d) => {
    const miss = ['SYSTEM_RUNTIME_VIEW.md', 'CROSS_CUTTING_STANDARDS.md'].filter((n) => !fs.existsSync(path.join(d, n)))
      .concat(fs.readdirSync(path.join(d, 'assets'), { withFileTypes: true }).filter((e) => e.isDirectory() && /^\d+-/.test(e.name)).map((e) => path.join('components', `${e.name}.md`)).sort().filter((n) => !fs.existsSync(path.join(d, n))));
    if (miss.length) result.files.push({ file: d, findings: miss.map((n) => ({ rule: 'kit-incomplete', line: 1, text: `${n} is missing — the kit has assets for it but the part was never written; regenerate it (generate dev handoff)` })) });
  });
  if (result.files.some((f) => f.findings.length)) result.status = 'FAIL';
  return result;
}
function walk(dir) { const out = []; fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { const p = path.join(dir, e.name); if (e.isDirectory()) { if (e.name !== 'assets') out.push(...walk(p)); } else out.push(p); }); return out; }
const render = (r) => (r.fixed && r.fixed.length ? r.fixed.map((x) => `${x.file}: fixed ${[x.labels ? `${x.labels} row label(s)` : '', x.names ? `${x.names} name(s)` : ''].filter(Boolean).join(', ')}`).join('\n') + '\n' : '') + r.files.map((f) => `${f.file}: ${f.findings.length ? 'FAIL\n' + f.findings.map((x) => `    ✗ line ${x.line} [${x.rule}]: ${x.text}`).join('\n') : 'ok'}${(f.warnings || []).length ? `  (${f.warnings.length} warning(s) — contract-check.js <file> lists them)` : ''}`).join('\n') + `\nmermaid: ${r.mermaid.render}${r.contracts && r.contracts.files ? `\ncontracts: ${r.contracts.files} file(s) · ${r.contracts.redocly}` : ''}\n${r.status}`;

module.exports = { check, checkFile, PLACEHOLDER, lexicon, langOf, seamPayloadOf, versionFindings, interfaceFindings, securityInterfaces };

if (require.main === module) {
  const args = process.argv.slice(2); const li = args.indexOf('--lang'); const lang = li >= 0 ? args[li + 1] : undefined; const targets = args.filter((a, i) => !a.startsWith('--') && !(li >= 0 && i === li + 1));
  if (!targets.length) { console.error('Usage: bun kit-check.js <handoffs_dir | file.md …> [--fix] [--no-render] [--render] [--json] [--lang en|es]'); process.exit(2); }
  const missing = targets.filter((t) => !fs.existsSync(t)); if (missing.length) { console.error(`kit-check: not found: ${missing.join(', ')}`); process.exit(2); }
  const r = check(targets, { lang, fix: args.includes('--fix'), render: args.includes('--no-render') ? false : args.includes('--render') ? true : undefined });
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.status === 'FAIL' ? 1 : 0);
}
