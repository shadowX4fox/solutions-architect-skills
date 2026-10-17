#!/usr/bin/env node
// The payload of one architecture section — what its writer needs, and nothing more, assembled by code.
//
//   bun section-prepare.js <project-root> --section <N> [--type <ARCH_TYPE>] [--lang en|es]
//                          [--po-spec <file>] [--bian <file>] [--hld <file>] [--adr-context <file>]
//                          [--full <NN,NN>] [--out <file>] [--json] [--list]
//
// Workflow 1 wrote every section with the whole documentation guide (90 KB), the type templates and the
// corpus so far in the main context. This script cuts, per section, the payload the writer reads instead:
//
//   guide         the section's own block of ARCHITECTURE_DOCUMENTATION_GUIDE.md (`## Section N:` … next section),
//                 plus the two rules every section obeys (authoring budgets, explorer headers) and the
//                 section's visible-name registry row for the document language
//   templates     S4: templates/SECTION_4_<TYPE>.md + references/<TYPE>-ARCHITECTURE.md;
//                 S5: templates/SECTION_5_<TYPE>.md + references/<TYPE>-TO-C4-TRANSLATION.md
//   inputs        S1+2: the PO Spec cut by anchor to the sections `SECTION_MAP.json` (beside this script) names
//                 (8.88.0, from the CLI; `--po-spec-whole` restores the whole spec) and BIAN_ALIGNMENT.md whole;
//                 S3: the PO Spec's business-constraints section; every other section: the PO Spec outline. The HLD when
//                 it is Mermaid (verbatim) or its path. The ADR Context Block when the orchestrator saved it
//   parents       the section's parents per the Foundational Context Anchor Protocol — as outlines
//                 (H1, EXPLORER_HEADER, 30-second summary, headings) unless named in --full, then whole
//   facts         the parts of the facts ledger (arch-facts.js) the section cites — components,
//                 integrations, layers, ADR ids and statuses (with the decision in one line for project ADRs and
//                 the institutional ones the ADR Context Block names), TDRs — compact, by code
//
// Output: `.cache/sa-skills/payloads/section-NN.md` (or --out), a manifest of what went in and what was
// missing at the top, and the same list on stderr. `--list` prints the section table. Runs under Bun.
'use strict';
const fs = require('fs');
const path = require('path');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));

const SKILL = path.join(__dirname, '..');
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
// which PO Spec sections each architecture section is written from — bundled beside this script; a missing map is a
// packaging defect, so it throws here rather than silently widening every payload to the per-kind inputs
const SECTION_MAP = JSON.parse(read(path.join(__dirname, 'SECTION_MAP.json')));
// One line of an ADR's decision: the paragraph under `## Decision` → `### Summary` (the template's shape), else the first
// paragraph under `## Decision`; markup stripped, cut at a word under 240 characters. '' when the file cannot say.
function adrDecision(file) {
  let src; try { src = read(file); } catch { return ''; }
  const lines = src.split('\n'); const at = (re, from = 0) => { for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i; return -1; };
  // an institutional ADR of the Spanish edition numbers and localizes its headings (`## 2. Decisión` → `### Resumen`) — 8.102.0
  const d = at(/^##\s+(?:\d+\.\s*)?(?:Decision|Decisión)\b/); if (d < 0) return '';
  const sum = at(/^###\s+(?:\d+(?:\.\d+)*\.?\s*)?(?:Summary|Resumen)\b/, d + 1), start = sum > d && sum < (at(/^##\s/, d + 1) >>> 0) ? sum + 1 : d + 1;
  const para = []; for (let i = start; i < lines.length; i++) { const l = lines[i].trim(); if (/^#{1,6}\s/.test(l)) break; if (!l) { if (para.length) break; continue; } para.push(l); }
  let t = para.join(' ').replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
  if (t.length > 240) t = t.slice(0, t.lastIndexOf(' ', 237)) + '…';
  return t;
}
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';

// ---- the section table: file, tier, parents (docs/NN prefixes), what the payload carries
// Tiers follow the real dependency graph (8.32.0): content parents, the facts tables `arch-facts.js` reads from files other
// sections write (`components` ← S5, `layers` ← S4, `integrations` ← S7), and what each section's gate opens after the Write.
// T0 1, 13 · T1 4 · T2 5 · T3 8 · T4 3, 6 · T5 7 · T6 9, 10 · T7 11 · T8 12. Section 3 moved from T0 to T4 because
// principle-check.js and the Layer 2 reviewer check it against docs/03 and docs/06 — written first, the writer guessed
// their vocabulary and the gate could not verify it (the 28-minute Section 3 loop of the first editor run).
const SECTIONS = {
  1:  { file: 'docs/01-system-overview.md', name: 'Executive Summary + System Overview', tier: 0, parents: [], guide: [1, 2], inputs: ['po-spec-full', 'bian', 'hld'], facts: [] },
  3:  { file: 'docs/02-architecture-principles.md', name: 'Architecture Principles', tier: 4, parents: ['01', '03', '06'], guide: [3], inputs: ['po-spec-constraints', 'adr-index', 'adr-context', 'principle-rules'], facts: ['components', 'layers', 'adrs'] },   // after S4, S5, S8 — its gate reads the layer vocabulary and the tech names
  4:  { file: 'docs/03-architecture-layers.md', name: 'Architecture Layers', tier: 1, parents: ['01'], guide: [4], inputs: ['hld', 'adr-index', 'adr-context', 'po-spec-outline'], facts: ['adrs'], templates: ['section4', 'rules'] },
  5:  { file: 'docs/components/**', name: 'Component Details (one file per container)', tier: 2, parents: ['01', '03'], guide: [5], inputs: ['hld', 'po-spec-outline'], facts: ['adrs'], templates: ['section5', 'c4'] },
  6:  { file: 'docs/04-data-flow-patterns.md', name: 'Data Flow Patterns', tier: 4, parents: ['01', '03'], guide: [6], inputs: ['po-spec-outline'], facts: ['components', 'layers', 'adrs'] },
  7:  { file: 'docs/05-integration-points.md', name: 'Integration Points', tier: 5, parents: ['01', '03', '04'], guide: [7], inputs: ['hld', 'po-spec-outline', 'label-registry'], facts: ['components', 'layers', 'adrs'] },
  8:  { file: 'docs/06-technology-stack.md', name: 'Technology Stack', tier: 3, parents: ['01', '03'], guide: [8], inputs: ['adr-context', 'po-spec-outline'], facts: ['components', 'adrs'] },
  9:  { file: 'docs/07-security-architecture.md', name: 'Security Architecture', tier: 6, parents: ['01', '02', '05', '06'], guide: [9], inputs: ['adr-context', 'po-spec-outline'], facts: ['components', 'integrations', 'adrs'] },
  10: { file: 'docs/08-scalability-and-performance.md', name: 'Scalability & Performance', tier: 6, parents: ['01', '02', '05', '06'], guide: [10], inputs: ['po-spec-outline'], facts: ['components', 'integrations', 'layers', 'adrs'] },
  11: { file: 'docs/09-operational-considerations.md', name: 'Operational Considerations', tier: 7, parents: ['01', '02', '06', '08'], guide: [11], inputs: ['po-spec-outline'], facts: ['components', 'adrs'] },
  12: { file: 'adr/README.md (via architecture-definition-record) + docs/11-references.md', name: 'Architecture Decision Records', tier: 8, parents: [], guide: [12], inputs: ['adr-index', 'adr-context'], facts: ['components', 'adrs'] },   // last — its header names components that must exist, and it indexes the ADRs every section resolved
  13: { file: 'docs/10-risks-and-technical-debt.md', name: 'Risks and Technical Debt', tier: 0, parents: [], guide: [13], inputs: ['po-spec-outline'], facts: ['tdrs', 'adrs'] },
};
// the architecture types — the base's five and any an institution pack adds (scripts/shared/arch-types.js)
const archTypes = require(path.join(SKILL, '..', '..', 'scripts', 'shared', 'arch-types.js'));

// ---- extractors
// a heading block: from the line matching `startRe` to the next line matching `endRe` (exclusive)
// a heading inside a code fence is example text, never the end of a block: the Explorer-Friendly Headers rule
// carries an example whose `## 8.1` cut the rule at its example, and every payload lost the field guidance (8.102.0)
const block = (src, startRe, endRe) => { const lines = src.split('\n'); const s = lines.findIndex((l) => startRe.test(l)); if (s < 0) return null; let e = lines.length, fence = false; for (let i = s + 1; i < lines.length; i++) { if (/^\s*(```|~~~)/.test(lines[i])) { fence = !fence; continue; } if (!fence && endRe.test(lines[i])) { e = i; break; } } return { text: lines.slice(s, e).join('\n').trim(), from: s + 1, to: e }; };
const guideSection = (guide, n) => block(guide, new RegExp('^## Section ' + n + ':'), /^## Section \d+:|^## References\s*$/);
const guideRule = (guide, title) => block(guide, new RegExp('^## ' + title), /^## /);
// an outline: H1, the EXPLORER_HEADER block, the 30-second summary (first blockquote or paragraph), the headings with line numbers
const outline = (src) => { const lines = src.split('\n'); const h1 = lines.find((l) => /^#\s/.test(l)) || ''; const hm = src.match(/<!-- EXPLORER_HEADER[\s\S]*?-->/); const header = hm ? hm[0] : '(no EXPLORER_HEADER)';
  const after = hm ? src.slice(src.indexOf(hm[0]) + hm[0].length) : src; const para = after.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !/^#/.test(p) && !/^\*\*[A-Z][^*]*\*\*:?\s/.test(p) && !/^\[/.test(p) && !/^<!--/.test(p)) || '';
  const heads = lines.map((l, i) => ({ l, i })).filter((x) => /^#{2,4}\s/.test(x.l)).map((x) => `${String(x.i + 1).padStart(4)}  ${x.l.replace(/<!--.*?-->/g, '').trim()}`);
  return `${h1}\n\n${header}\n\n${para}\n\nHeadings (line  heading):\n${heads.join('\n')}`; };
const docByPrefix = (root, nn) => { const dir = path.join(root, 'docs'); if (!exists(dir)) return null; const f = fs.readdirSync(dir).find((x) => x.startsWith(nn + '-') && x.endsWith('.md')); return f ? path.join(dir, f) : null; };
const findSection = (src, re) => block(src, re, /^#{1,2}\s/);
// an anchored block: the heading carrying `<!-- SECTION: <anchor> -->` through the next heading of the same or a higher level.
// The PO Spec is a standard document and every one of its sections carries an English anchor; a payload cut by anchor
// carries exactly the sections a writer needs (SECTION_MAP.json), not the whole 90 KB or an outline of it.
// Ten of the twelve PO Specs on this machine were written from a template that carried no anchors (fixed in 8.31.0),
// so a spec without them is cut by the heading's visible text — the English or Spanish name the registry
// `scripts/shared/po-spec-anchors.json` gives the anchor — and the cut says so (`fallback: text`).
const PO_ANCHORS = (() => { try { return JSON.parse(read(path.join(SKILL, '..', '..', 'scripts', 'shared', 'po-spec-anchors.json'))).anchors; } catch { return {}; } })();
const headingText = (l) => l.replace(/^#+\s+/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\d+(\.\d+)*\.?\s+/, '').replace(/\s+/g, ' ').trim().toLowerCase();
// an outline of a block: its heading, then every subheading with the first paragraph under it — what an overview needs
// of the Use Cases (name and one line each) without the 300 lines the data-flow section is written from
const outlineOf = (text) => { const lines = text.split('\n'); const out = [lines[0]]; let i = 1; while (i < lines.length) { const l = lines[i]; if (/^#{2,6}\s/.test(l)) { out.push('', l); let j = i + 1; while (j < lines.length && !lines[j].trim()) j++; const para = []; while (j < lines.length && lines[j].trim() && !/^#{1,6}\s/.test(lines[j])) { para.push(lines[j]); j++; } if (para.length) out.push('', para.join(' ').replace(/\s+/g, ' ')); i = j; } else i++; } return out.join('\n'); };
const anchorBlock = (src, anchor) => { const lines = src.split('\n'); const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp('<!--\\s*SECTION:\\s*' + esc + '\\s*-->');
  let s = lines.findIndex((l) => /^#{1,6}\s/.test(l) && re.test(l)), fallback = null;
  if (s < 0) { const names = PO_ANCHORS[anchor]; if (names) { const want = [names.en, names.es, anchor].filter(Boolean).map((x) => x.replace(/\s+/g, ' ').trim().toLowerCase()); s = lines.findIndex((l) => /^#{1,6}\s/.test(l) && !/<!--\s*SECTION:/.test(l) && want.includes(headingText(l))); if (s >= 0) fallback = 'text'; } }
  if (s < 0) return null; const lvl = (lines[s].match(/^#+/) || [''])[0].length; let e = lines.length; for (let i = s + 1; i < lines.length; i++) { const m = lines[i].match(/^(#{1,6})\s/); if (m && m[1].length <= lvl) { e = i; break; } } return { text: lines.slice(s, e).join('\n'), from: s + 1, to: e, fallback }; };
const strip = (src) => src.replace(/^<!--\s*(ARCHITECTURE_TYPE|TEMPLATE_VERSION)[^>]*-->\s*$/gm, '').trim();   // template metadata comments

// ---- assembly
// the collection Step 4.9 saved, or {}
const collected = (root) => { try { return JSON.parse(read(path.join(root, '.cache', 'sa-skills', 'collect.json'))); } catch { return {}; } };
// the gate markers of 00-gates.md, from the values the collection kept
function traceability(root) {
  const c = collected(root); if (!c.doc_language && !c.gates) return null;
  const day = String(c.generated_at || new Date().toISOString()).slice(0, 10), g = c.gates || {}, out = [];
  if (c.doc_language) out.push(`<!-- DOC_LANGUAGE_GATE: PASSED (${c.doc_language}, ${day}) -->`);
  if (g.po_spec === 'skipped') out.push(`<!-- PO_SPEC_GATE: SKIPPED (user override at ${day}) -->`);
  else if (c.po_spec && c.po_spec.path) out.push(`<!-- PO_SPEC_SOURCE: ${c.po_spec.path} (loaded ${day}) -->`);
  // the alignment gate: BIAN keeps the markers architectures before 10.1 carry; another framework, or none, the generic ones
  const al = c.alignment || (c.bian ? { framework: 'BIAN', path: c.bian.path } : null), skipped = g.alignment === 'skipped' || g.bian === 'skipped';
  if (skipped) out.push(`<!-- ${al && al.framework !== 'BIAN' ? 'ALIGNMENT_GATE' : 'BIAN_ALIGNMENT_GATE'}: SKIPPED (cascading from PO_SPEC_GATE: SKIPPED, ${day}) -->`);
  else if (al && al.framework === 'none') out.push(`<!-- ALIGNMENT_GATE: NONE (no capability framework declared, ${day}) -->`);
  else if (al && al.path && al.framework === 'BIAN') out.push(`<!-- BIAN_ALIGNMENT_GATE: PASSED (ref: ${al.path}, ${day}) -->`, `<!-- BIAN_ALIGNMENT_SOURCE: ${al.path} -->`);
  else if (al && al.path) out.push(`<!-- ALIGNMENT_GATE: PASSED (${al.framework}, ref: ${al.path}, ${day}) -->`, `<!-- ALIGNMENT_SOURCE: ${al.path} -->`);
  if (g.hld === 'skipped') out.push(`<!-- HLD_GATE: SKIPPED (cascading from upstream gate skip, ${day}) -->`);
  else if (c.hld && c.hld.path) out.push(`<!-- HLD_GATE: PASSED (ref: ${c.hld.path}, ${day}) -->`, `<!-- HLD_SOURCE: ${c.hld.path} -->`, `<!-- HLD_FORMAT: ${c.hld.format || 'mermaid'} -->`, ...(c.hld.mermaid ? [`<!-- HLD_MERMAID: ${c.hld.mermaid} -->`] : []));
  return out.length ? out.join('\n') : null;
}

function prepare(root, n, opts = {}) {
  root = path.resolve(root);
  // input paths are the project's: the receipt prints them relative to the root, and the command runs from the plugin dir (8.102.0)
  opts = { ...opts }; ['poSpec', 'bian', 'hld', 'adrContext'].forEach((k) => { if (opts[k]) opts[k] = path.resolve(root, opts[k]); });
  const spec = SECTIONS[n]; if (!spec) throw new Error(`no section ${n} — one of ${Object.keys(SECTIONS).join(', ')}`);
  const facts = collect(root);
  const lang = opts.lang || facts.architecture.language || 'en';
  const typeOpts = { project: root }, type = archTypes.normType(opts.type || facts.architecture.type, typeOpts), typeDef = type ? archTypes.types(typeOpts).types[type] : null;
  const guide = read(path.join(SKILL, 'ARCHITECTURE_DOCUMENTATION_GUIDE.md'));
  const parts = [], included = [], missing = [];
  const add = (title, text, source) => { if (!text) return; parts.push(`\n\n---\n\n# ▸ ${title}\n\n<!-- source: ${source} -->\n\n${text.trim()}`); included.push(`${title} — ${source} (${kb(text)})`); };
  const miss = (what, why) => missing.push(`${what}: ${why}`);

  // 1. the guide, by range
  spec.guide.forEach((g) => { const b = guideSection(guide, g); if (b) add(`Guide — Section ${g}`, b.text, `ARCHITECTURE_DOCUMENTATION_GUIDE.md lines ${b.from}–${b.to}`); else miss(`guide section ${g}`, 'heading `## Section N:` not found'); });
  ['Authoring budgets', 'Explorer-Friendly Headers'].forEach((t) => { const b = guideRule(guide, t); if (b) add(`Guide — ${t}`, b.text, `ARCHITECTURE_DOCUMENTATION_GUIDE.md lines ${b.from}–${b.to}`); });
  // the visible-name registry rows for this section's anchors
  const policy = path.join(SKILL, 'references', 'LANGUAGE_POLICY.md');
  if (exists(policy)) { const rows = read(policy).split('\n').filter((l) => spec.guide.some((g) => new RegExp('^\\|\\s*' + g + '\\s*\\|').test(l))); if (rows.length) add('Visible names (LANGUAGE_POLICY §5.1)', `Document language: **${lang}**. Headings carry the English anchor; the visible text is the \`${lang}\` column.\n\n| # | Anchor | en | es |\n|---|---|---|---|\n${rows.join('\n')}`, 'references/LANGUAGE_POLICY.md §5.1'); }

  // 2. type templates and references
  if (spec.templates) {
    if (!type) miss('architecture type', 'no --type and no ARCHITECTURE_TYPE marker — templates skipped');
    else { const want = { section4: typeDef.files.section4, section5: typeDef.files.section5, rules: typeDef.files.reference, c4: typeDef.files.c4 };
      const src = (p) => typeDef.source === 'base' ? path.relative(SKILL, p).replace(/\\/g, '/') : `${typeDef.source}:${path.basename(p)}`;
      spec.templates.forEach((k) => { const p = want[k]; if (!p) { miss(`${k} for ${type}`, 'this type has no such file (generic template applies)'); return; } const f = path.basename(p); if (exists(p)) add(`${type} — ${f}`, strip(read(p)), src(p)); else miss(f, `not found (${typeDef.source})`); });
    }
  }

  // 3. inputs
  const poSpec = opts.poSpec || path.join(root, 'PRODUCT_OWNER_SPEC.md');
  const poSrc = exists(poSpec) ? read(poSpec) : null;
  // the editor's route: the PO Spec cut by anchor replaces every po-spec-* kind
  if (Array.isArray(opts.poSpecAnchors)) {
    if (!poSrc) miss('PO Spec', `${path.relative(root, poSpec)} not found`);
    else { let byText = 0; opts.poSpecAnchors.forEach((entry) => { const a = typeof entry === 'string' ? entry : entry.anchor, mode = typeof entry === 'string' ? 'whole' : (entry.mode || 'whole'); const b = anchorBlock(poSrc, a); if (b) { if (b.fallback) byText++; const text = mode === 'outline' ? outlineOf(b.text) : b.text; add(`PO Spec § ${a}${mode === 'outline' ? ' (outline — headings and their first paragraph; the whole section feeds another document)' : ''}`, text, `${path.relative(root, poSpec)} lines ${b.from}–${b.to}${b.fallback ? ' — matched by heading text, no anchor' : ''}`); } else miss(`PO Spec § ${a}`, 'no heading carries that SECTION anchor, and none matches its registered name'); });
      if (byText) miss('PO Spec anchors', `${byText} section(s) matched by heading text — this spec predates the anchored template; run \`sync PO spec\` (architecture-readiness Workflow 6) to anchor it`); }
  }
  spec.inputs.filter((k) => !(Array.isArray(opts.poSpecAnchors) && k.startsWith('po-spec'))).forEach((k) => {
    if (k === 'po-spec-full') { if (poSrc) add('PO Spec', poSrc, path.relative(root, poSpec)); else miss('PO Spec', `${path.relative(root, poSpec)} not found (gate skipped?)`); }
    if (k === 'po-spec-constraints') { if (!poSrc) return miss('PO Spec constraints', 'no PO Spec'); const b = findSection(poSrc, /^#{1,3}\s.*(Constraint|Restricci)/i); if (b) add('PO Spec — business constraints', b.text, `${path.relative(root, poSpec)} lines ${b.from}–${b.to}`); else add('PO Spec — outline', outline(poSrc), path.relative(root, poSpec)); }
    if (k === 'po-spec-outline') { if (poSrc) add('PO Spec — outline (open the file for a section you cite)', outline(poSrc), path.relative(root, poSpec)); }
    if (k === 'bian') { const c = collected(root), al = c.alignment || (c.bian ? { framework: 'BIAN', path: c.bian.path } : null);
      if (al && al.framework === 'none') miss('capability alignment', 'the project declares no capability framework — Section 1.5 is omitted');
      else { const b = opts.bian || (al && al.path ? path.join(root, al.path) : ['BIAN_ALIGNMENT.md', 'CAPABILITY_ALIGNMENT.md'].map((x) => path.join(root, x)).find(exists)), fw = al ? al.framework : 'BIAN';
        if (b && exists(b)) add(`Capability alignment — ${fw} (lift Summary, impacted areas and domains${fw === 'BIAN' ? ', Diagram ID Segments, API Surface' : ''} into 1.5)`, read(b), path.relative(root, b)); else miss('capability alignment report', 'not found (gate skipped?)'); } }
    if (k === 'hld') { let h = opts.hld; if (!h) { const d = docByPrefix(root, '01'); const m = d && read(d).match(/<!--\s*HLD_SOURCE:\s*([^>]*?)\s*-->/); if (m) h = path.join(root, m[1]); }
      if (!h) { const c = collected(root); if (c.hld && c.hld.path) h = path.join(root, c.hld.path); }
      // a picture reaches the payload as its transcription (8.93.1) — the section writers never read the picture
      if (h && !/\.(mmd|mermaid|md)$/i.test(h)) { const t = h.replace(/\.[^./\\]+$/, '') + '.hld.mmd'; if (exists(t)) h = t; else miss('HLD transcription', `${path.relative(root, t)} not written (00-gates.md Step 0.4, item 2b) — the picture is not carried`); }
      if (h && exists(h)) { const src = read(h); if (/\.(mmd|mermaid)$/i.test(h) || /```mermaid/.test(src)) add('HLD (Mermaid — components, groupings and connections are stated, never inferred)', src, path.relative(root, h)); else add('HLD', `Non-Mermaid HLD at \`${path.relative(root, h)}\` — read it with the Read tool (${kb(src)}).`, path.relative(root, h)); }
      else miss('HLD', h ? `${h} not found` : 'no --hld and no HLD_SOURCE marker in docs/01'); }
    // the Layer 1 rules principle-check.js holds the section to, by range — every first write of S3 failed them in the three
    // 2026-09-30 control runs (19, 8 and 11 BLOCKING) because the payload carried the budgets and not the rules (8.102.0)
    if (k === 'principle-rules') { const pv = read(path.join(SKILL, 'PRINCIPLE_VALIDATION.md'));
      const g = block(pv, /^### Group 3 /, /^### Group 5 /); if (g) add('Principle rules — Layer 1, Groups 3–4 (principle-check.js blocks on these)', g.text, `PRINCIPLE_VALIDATION.md lines ${g.from}–${g.to}`); else miss('Principle rules', 'PRINCIPLE_VALIDATION.md § Group 3 not found');
      // a pack type states its rows in its type.json (arch-types.js); a built-in's live in PRINCIPLE_VALIDATION.md
      if (typeDef && typeDef.matrix) { const CANON = require(path.join(__dirname, 'principle-check.js')).CANON;
        add(`Principle rules — P-TYPE-MATRIX-01, ${type} (each row: Implementation or Trade-offs names one term)`, `### ${type}\n\n| Principle | Required-any-of |\n|---|---|\n${Object.entries(typeDef.matrix).map(([n, ph]) => `| ${n}. ${CANON[n - 1] || ''} | ${ph.map((x) => '\`' + x + '\`').join(', ')} |`).join('\n')}`, `${typeDef.source}: type.json matrix`); } else {
      const m = type && block(pv, new RegExp('^### ' + type.replace(/[-]/g, '\\-') + '\\s*$'), /^#{2,3} /); if (m) add(`Principle rules — P-TYPE-MATRIX-01, ${type} (each row: Implementation or Trade-offs names one term)`, m.text, `PRINCIPLE_VALIDATION.md lines ${m.from}–${m.to}`); else miss('Type matrix', type ? `no ${type} row set in PRINCIPLE_VALIDATION.md` : 'architecture type unknown — pass --type'); } }
    // the Protocol cell grammar integration-check.js holds docs/05 to, read from the standard in force by label-check.js —
    // never transcribed; the 2026-09-30 runs copied HLD wording into a qualifier the closed grammar rejects (8.102.0)
    if (k === 'label-registry') { let reg = null; try { const lc = require(path.join(__dirname, 'label-check.js')); reg = lc.registries(lc.DEFAULT_DL); } catch { reg = null; }
      if (!reg) miss('Connection label grammar', 'design language not bundled — fallback mode, the Protocol cell is free text');
      else add(`Connection label grammar — the Protocol cell (${reg.stamp})`, [
        `\`<PROTOCOL>[/<STYLE>] [<Action Type>]\` then${reg.via ? ` at most one \`${reg.via} <name>\` (the gateway, proxy, load balancer or broker the connection passes through — never a component of its own),` : ''} at most one data-scope qualifier and at most one composition qualifier, each after \` · \`. Nothing else follows the bracket: a note belongs in the detail block, not the cell.`,
        `- Protocols: ${reg.protocols.join(', ')}`, `- Styles: ${reg.styles.join(', ')}`, `- Action Types: ${reg.actions.join(', ')}`,
        `- Data-scope forms: ${reg.dataScope.map((x) => '`' + x + '`').join(', ')}`, `- Composition qualifiers: ${reg.composition.map((x) => '`' + x + '`').join(', ')}`,
        `Example: \`HTTPS/JSON [Query] · schema movements (movement)\` · \`TLS/AVRO [Event] · publish\`${reg.via ? ` · \`HTTPS/JSON [Command] · ${reg.via} api-gateway\`` : ''}.`].join('\n'), `label-check.js — design-language/rules-registry.json (llms-rules.txt §5.3–§5.5)`); }
    if (k === 'adr-index') { const p = path.join(root, 'adr', 'README.md'); if (exists(p)) add('ADR index', read(p), 'adr/README.md'); else miss('adr/README.md', 'not found — the ADR facts below are the index'); }
    if (k === 'adr-context') { if (opts.adrContext && exists(opts.adrContext)) add('ADR Context Block (Step 0.6)', read(opts.adrContext), path.relative(root, opts.adrContext)); else miss('ADR Context Block', 'not saved — pass --adr-context <file> when Step 0.6 produced one'); }
  });

  // 8.93.0: the gates' traceability markers, written verbatim into docs/01 — 00-gates-run.md step 4 asked for them and no
  // payload carried them, so the 8.92.7 run's docs/01 had none (and nothing downstream could find the HLD from the document)
  if (n === 1) { const t = traceability(root); if (t) add('Gate traceability — write these lines verbatim right after the EXPLORER_HEADER of docs/01', t, '.cache/sa-skills/collect.json'); }

  // 4. parents — outlines, or whole when named in --full
  const full = new Set((opts.full || '').split(',').map((s) => s.trim()).filter(Boolean));
  spec.parents.forEach((nn) => { const p = docByPrefix(root, nn); if (!p) return miss(`parent docs/${nn}`, 'not written yet'); const src = read(p); const relp = path.relative(root, p);
    if (full.has(nn)) add(`Parent — ${relp} (whole)`, src, relp); else add(`Parent — ${relp} (outline; cite by heading, open the file only to quote)`, outline(src), relp); });

  // 5. facts — compact tables from the ledger
  const table = (headers, rows) => rows.length ? `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map((c) => String(c == null ? '' : c).replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}` : null;
  const factBlocks = {
    components: () => { const sys = facts.systems.map((s) => [s.name, s.slug, s.owned ? 'internal' : 'external', s.containers.join(', ')]); const cs = facts.components.filter((c) => c.level === 'L2').map((c) => [c.name, c.slug, c.file_backed === false ? '— row of its system' : 'yes', c.system, c.type, c.technology.join(', '), c.internal_name || '']);
      // a container declared only as a row of its system's descriptor has no file: explorer-cli check rejects its slug in a
      // header's `components:` — every 2026-09-30 control run wrote those slugs into docs/05 and docs/06 (8.102.0)
      const note = cs.some((c) => c[2] !== 'yes') ? '`components:` in an EXPLORER_HEADER takes only the slugs whose **own file** is `yes`; a container marked `— row of its system` is named in prose and tables, and its header entry is its system\'s slug.' : null;
      return [table(['System', 'slug', 'owned', 'containers'], sys), table(['Container (canonical name — write it exactly)', 'slug', 'own file', 'system', 'type', 'technology', 'internal name'], cs), note].filter(Boolean).join('\n\n'); },
    integrations: () => table(['#', 'From', 'To', 'Protocol', 'Pattern', 'Boundary'], facts.integrations.filter((i) => !i.retired).map((i) => [i.id, i.from, i.to, i.protocol, i.pattern, i.boundary])),
    layers: () => table(['Layer', 'Name', 'Containers', 'Inside boundary'], facts.layers.map((l) => [l.n, l.name, l.containers.join(', '), l.owned ? 'yes' : 'no'])),
    // 8.88.1: the decision itself, one line, for the ADRs a section is likely to cite — every project ADR (101+) and the
    // institutional ones the ADR Context Block names. Without it the writer read ADR bodies with sed / grep (the
    // 8.88.0 control run: ADR-113, 114, 115 decisions, technology versions and scale figures, 11 commands in one segment).
    adrs: () => { const ctx = opts.adrContext && exists(opts.adrContext) ? read(opts.adrContext) : '';
      const wants = (a) => !/^superseded/i.test(a.status || '') && (Number((a.id.match(/\d+/) || [0])[0]) > 100 || ctx.includes(a.id));   // a superseded decision no longer governs
      const rows = facts.adrs.map((a) => [a.id, a.title, a.status, a.scope, wants(a) ? adrDecision(path.join(root, a.file)) : '']);
      return rows.some((r) => r[4]) ? table(['ADR', 'Title', 'Status', 'Scope', 'Decision (from its Summary — open the ADR only to quote it)'], rows) : table(['ADR', 'Title', 'Status', 'Scope'], rows.map((r) => r.slice(0, 4))); },
    tdrs: () => table(['TDR', 'Title', 'Status'], facts.tdrs.map((t) => [t.id, t.title, t.status])),
  };
  spec.facts.forEach((k) => { const t = factBlocks[k](); if (t) add(`Facts — ${k}`, t, 'arch-facts.js (docs/components, docs/03, docs/05, adr/, tdr/)'); else miss(`facts ${k}`, 'nothing on disk yet'); });

  // Each part's line range in this payload (8.118.4): a writer `Read`s a part by offset and limit instead of searching an
  // 80 KB file for its `# ▸` headings. Ranges do not change the manifest's line count, so they are measured once.
  const draft = (ranges) => `# Section ${n} payload — ${spec.name}\n\n| | |\n|---|---|\n| Target | \`${spec.file}\` |\n| Tier | ${spec.tier} (parents: ${spec.parents.length ? spec.parents.map((p) => 'docs/' + p).join(', ') : 'none'}) |\n| Document language | ${lang} |\n| Architecture type | ${type || facts.architecture.type || 'not set'} |\n| Architecture | ${facts.architecture.name || '—'} ${facts.architecture.version ? 'v' + facts.architecture.version : ''} |\n| Prose | \`references/PROSE_STYLE.md\` governs (form ladder: table → bullets → diagram → one labelled line → prose only in its slots); \`PROSE_VALIDATION.md\` gates it at Step 5.7 |\n\n**Included** (payload lines)\n${included.map((s, i) => '- ' + (ranges ? `L${ranges[i][0]}–${ranges[i][1]} · ` : '') + s).join('\n')}\n\n**Missing**\n${missing.length ? missing.map((s) => '- ' + s).join('\n') : '- nothing'}`;
  const lines = (draft(null) + parts.join('') + '\n').split('\n');
  const starts = lines.map((l, i) => (l.startsWith('# ▸ ') ? i + 1 : 0)).filter(Boolean);
  const ranges = starts.map((st, i) => [st, i + 1 < starts.length ? starts[i + 1] - 4 : lines.length - 1]);
  const text = draft(ranges) + parts.join('') + '\n';
  return { text, included, missing, section: n, target: spec.file, bytes: Buffer.byteLength(text) };
}

module.exports = { prepare, SECTIONS, SECTION_MAP, anchorBlock, outlineOf, adrDecision };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes('--list')) { console.log('| Section | Target | Tier | Parents | Templates | Facts |\n|---|---|---|---|---|---|\n' + Object.entries(SECTIONS).map(([k, s]) => `| ${k} — ${s.name} | \`${s.file}\` | ${s.tier} | ${s.parents.map((p) => 'docs/' + p).join(', ') || '—'} | ${(s.templates || []).join(', ') || '—'} | ${s.facts.join(', ') || '—'} |`).join('\n')); process.exit(0); }
  if (!args[0] || args[0].startsWith('--') || !opt('--section')) { console.error('Usage: bun section-prepare.js <project-root> --section <N> [--type <ARCH_TYPE>] [--lang en|es] [--po-spec <file>] [--bian <file>] [--hld <file>] [--adr-context <file>] [--full <NN,NN>] [--po-spec-whole] [--out <file>] [--json] | --list'); process.exit(2); }
  const n = parseInt(opt('--section'), 10);
  // 8.88.0: the in-session route cuts the PO Spec by anchor — the whole 88 KB spec in the S1 payload
  // made it 146 KB, read in five chunks on the 8.87.0 control run.
  // 8.92.7: every section the map names, not only S1+2. The outline the others took was cheaper on paper and dearer in the run:
  // its note says "open the file for a section you cite", and on the 8.92.6 control run the segment runners read the PO Spec
  // seven times (73K characters — Use Cases for S5 and S6, Business Constraints for S4 and S8), each read then re-sent on
  // every turn the runner had left. A section whose map entry is empty keeps its per-kind inputs.
  let poSpecAnchors;
  if (!args.includes('--po-spec-whole') && SECTIONS[n] && SECTIONS[n].inputs.some((k) => k.startsWith('po-spec'))) { const e = SECTION_MAP.sections[String(n)]; if (e && Array.isArray(e.po_spec) && e.po_spec.length) poSpecAnchors = e.po_spec; }
  let r; try { r = prepare(args[0], n, { type: opt('--type'), lang: opt('--lang'), poSpec: opt('--po-spec'), bian: opt('--bian'), hld: opt('--hld'), adrContext: opt('--adr-context'), full: opt('--full'), poSpecAnchors }); } catch (e) { console.error('section-prepare: ' + e.message); process.exit(2); }
  if (args.includes('--json')) process.stdout.write(JSON.stringify(r, null, 1) + '\n');
  else { const out = opt('--out') || path.join(path.resolve(args[0]), '.cache', 'sa-skills', 'payloads', `section-${String(n).padStart(2, '0')}.md`); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, r.text); console.error(`Wrote ${out} (${kb(r.text)})`); }
  console.error(`Included (${r.included.length}):\n  - ${r.included.join('\n  - ')}`);
  if (r.missing.length) console.error(`Missing (${r.missing.length}):\n  - ${r.missing.join('\n  - ')}`);
}
