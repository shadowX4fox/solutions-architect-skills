#!/usr/bin/env node
// handoff-export.js — Workflow B (Export Handoff Kit) by code: the four-part kit to Word, no model tokens.
//
//   bun handoff-export.js <project_root> --list [--json]
//       the kit as found (shared parts, component packages with their seams, individual seams), numbered for the menu,
//       or the older layout it found instead
//   bun handoff-export.js <project_root> --select <all|shared|components|1,3-5> [--slug <s>] [--lang <en|es>]
//                         [--doc-lang <en|es>] [--json]
//       native (lang = doc-lang, the default): composes each component package, renders every selected item with
//       docgen, removes the composed files and reports. Translated: writes the parts to translate and stops
//   bun handoff-export.js <project_root> --render-translated [--json]
//       renders the translated parts the docs-export-generator wrote, with --translated-from
//
// Every step is verbatim carry or a fixed template: the two shared documents and each seam render as they are; a
// component package is a fixed cross-reference header, then the component's seams and its Component Specification
// pasted byte for byte. The only judgement in the workflow is a translation, and only when the export language differs
// from the document language — the agent translates the parts this script composed and this script renders them.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-delivery reads the architecture through sa-skills

const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const VALUED = new Set(['--select', '--slug', '--lang', '--doc-lang']);   // flags that take a value; the project root is the one bare argument
const root = path.resolve(args.find((a, i) => !a.startsWith('--') && !VALUED.has(args[i - 1])) || '.');
const json = args.includes('--json');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const exists = (p) => fs.existsSync(p);
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const WORK = path.join(root, '.cache', 'sa-skills', 'export', 'handoff');
const EXPORTS = path.join(root, 'exports');

// ---------------------------------------------------------------- discovery (Steps B.1–B.2)
const kebab = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function docLanguage() {
  const a = path.join(root, 'ARCHITECTURE.md'); if (!exists(a)) return 'en';
  const m = read(a).match(/<!--\s*(?:DOC_LANGUAGE|LANGUAGE):\s*(en|es)\s*-->/); return m ? m[1] : 'en';
}
function solutionSlug() {
  if (opt('--slug')) return kebab(opt('--slug'));
  const d = path.join(root, 'docs', '01-system-overview.md'); if (!exists(d)) return '';
  const h1 = (read(d).match(/^#\s+(.+)$/m) || [])[1]; return h1 ? kebab(h1.replace(/<!--.*?-->/g, '')) : '';
}
function canonicalNames() {
  try { const { listComponents } = require(fromSaSkills('scripts', 'shared', 'component-facts.ts')); return new Map(listComponents(root).map((c) => [c.slug, c.name])); }
  catch { return new Map(); }   // the README / file H1 below stand in
}
const mdIn = (d) => exists(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).sort() : [];

function discover() {
  const h = path.join(root, 'handoffs');
  const shared = [['system-runtime-view', 'System Runtime View', 'SYSTEM_RUNTIME_VIEW.md', 'KIT-01-runtime-view'], ['cross-cutting-standards', 'Cross-Cutting Standards', 'CROSS_CUTTING_STANDARDS.md', 'KIT-02-standards']]
    .map(([part, label, file, out]) => ({ kind: 'shared', part, label, path: path.join(h, file), out, present: exists(path.join(h, file)) }));
  const seams = mdIn(path.join(h, 'interfaces')).map((f) => { const edge = f.replace(/\.md$/, ''); const [up, down] = edge.split('→'); return { kind: 'seam', edge, up, down, path: path.join(h, 'interfaces', f) }; });
  const names = canonicalNames();
  const components = mdIn(path.join(h, 'components')).map((f) => {
    const slug = f.replace(/\.md$/, '').replace(/^\d+-/, ''), file = path.join(h, 'components', f);
    const h1 = (read(file).match(/^#\s+(.+)$/m) || [])[1] || '';
    const name = names.get(slug) || h1.replace(/^Component Specification\s*[—–-]\s*/i, '').replace(/<!--.*?-->/g, '').trim() || slug;
    return { kind: 'component', slug, name, cut_sheet: file, seams: seams.filter((s) => s.up === slug || s.down === slug).map((s) => s.path) };
  });
  // the older layouts, named so the orchestrator can say why nothing exports
  let legacy = null;
  if (!shared.some((s) => s.present) && !seams.length && !components.length) {
    if (exists(path.join(h, 'SYSTEM_EKONTE.md')) || exists(path.join(h, 'SETTEI.md')) || exists(path.join(h, 'seams')) || exists(path.join(h, 'cut-sheets'))) legacy = '3.x';
    else if (mdIn(h).some((f) => /-handoff\.md$/.test(f))) legacy = 'v2';
    else legacy = 'none';
  }
  // the menu: present shared parts first, then component packages, then individual seams — one number each
  const menu = [...shared.filter((s) => s.present), ...components, ...seams].map((it, i) => ({ n: i + 1, ...it }));
  return { shared, components, seams, menu, legacy, missing: shared.filter((s) => !s.present).map((s) => s.path) };
}

function select(kit, sel) {
  const s = String(sel || 'all').trim().toLowerCase();
  if (s === 'all') return kit.menu.filter((m) => m.kind !== 'seam');
  if (s === 'shared') return kit.menu.filter((m) => m.kind === 'shared');
  if (s === 'components') return kit.menu.filter((m) => m.kind === 'component');
  const want = new Set();
  for (const part of s.split(',').map((x) => x.trim()).filter(Boolean)) {
    const r = part.match(/^(\d+)(?:-(\d+))?$/); if (!r) { console.error(`handoff-export: "${part}" is not a number or a range`); process.exit(2); }
    for (let n = +r[1]; n <= +(r[2] || r[1]); n++) want.add(n);
  }
  const bad = [...want].filter((n) => !kit.menu.some((m) => m.n === n)); if (bad.length) { console.error(`handoff-export: no item ${bad.join(', ')} in the menu (1–${kit.menu.length})`); process.exit(2); }
  return kit.menu.filter((m) => want.has(m.n));
}

// ---------------------------------------------------------------- compose (Step HO.3) and outputs
const outName = (it, slug, suffix) => it.kind === 'shared' ? `${it.out}${slug ? '-' + slug : ''}${suffix}.docx`
  : it.kind === 'seam' ? `INTERFACE-${it.up}-to-${it.down}${suffix}.docx` : `HANDOFF-${it.slug}${suffix}.docx`;

function packageMd(it, slug, suffix) {
  const kit = (base) => `${base}${slug ? '-' + slug : ''}${suffix}.docx`;
  const seams = it.seams.length ? it.seams.map((p) => read(p).replace(/\s+$/, '')).join('\n\n---\n\n')
    : `[NOT DOCUMENTED — no Interface Contract in handoffs/interfaces/ names ${it.slug} on either side]`;
  // a fixed literal: only the component's name and the two file names are substituted. The table stays outside the
  // blockquote — docgen joins quoted lines into one paragraph, and a quoted table renders as a line of pipes
  return `# Handoff Package — ${it.name}

> **Part of a four-part handoff kit — this document is not self-contained.** It contains only what is specific to ${it.name}: the Interface Contracts for every edge it participates in, and its Component Specification. Read it alongside the two shared documents delivered with it.

| Document | Covers |
|----------|--------|
| \`${kit('KIT-01-runtime-view')}\` | Whole-system storyboard — flows, per-hop budget decomposition, edge rationale, failure posture |
| \`${kit('KIT-02-standards')}\` | Institution-wide rules — error semantics, versioning, identity, idempotency, observability, data, resilience defaults |

---

# Interface Contracts

${seams}

---

# Component Specification

${read(it.cut_sheet).replace(/\s+$/, '')}
`;
}

// ---------------------------------------------------------------- render
function docgen(input, output, lang, from) {
  const gen = fromSaSkills('tools', 'docgen', 'generate-doc.js');
  const a = [gen, '--type', 'handoff', '--lang', lang, ...(from ? ['--translated-from', from] : []), '--input', input, '--output', output, '--author', 'Solution Architecture', '--version', '1.0', '--status', 'Draft'];
  const r = spawnSync(process.execPath, a, { cwd: root, encoding: 'utf8' });
  return { ok: r.status === 0, error: r.status === 0 ? null : ((r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' ') || `exit ${r.status}`) };
}
function renderAll(jobs, lang, from) {
  fs.mkdirSync(EXPORTS, { recursive: true });
  return jobs.map((j) => ({ ...j, ...docgen(j.input, path.join(EXPORTS, j.output), lang, from) }));
}
function report(results, kit, extra) {
  const res = { status: results.every((r) => r.ok) ? 'OK' : 'PARTIAL', outputs: results.map((r) => ({ item: r.label, output: `exports/${r.output}`, ok: r.ok, error: r.error })),
    missing: kit ? kit.missing.map(rel) : [], ...extra };
  if (json) { console.log(JSON.stringify(res, null, 2)); return res; }
  const line = (r) => `     ${r.ok ? '' : '❌ '}exports/${r.output}    (${r.label})${r.ok ? '' : ' — ' + r.error}`;
  const shared = results.filter((r) => r.kind === 'shared'), comps = results.filter((r) => r.kind === 'component'), seams = results.filter((r) => r.kind === 'seam');
  console.log(`${res.status === 'OK' ? '✅' : '⚠️ '} Handoff Kit Export ${res.status === 'OK' ? 'Complete' : 'finished with errors'}`);
  if (shared.length) console.log('\n   Shared documents (deliver these with every component package):\n' + shared.map(line).join('\n'));
  if (comps.length) console.log('\n   Component packages (Interface Contracts + Component Specification):\n' + comps.map(line).join('\n'));
  if (seams.length) console.log('\n   Individual Interface Contracts:\n' + seams.map(line).join('\n'));
  res.missing.forEach((m) => console.log(`\n⚠️  ${m} absent — not exported.`));
  if (comps.length) console.log('\n📎 Component packages are NOT self-contained — each cross-references the two KIT-* documents. Deliver them together.');
  return res;
}
const labelOf = (it) => it.kind === 'shared' ? it.label : it.kind === 'seam' ? `${it.edge}` : `${it.name} — ${it.seams.length} seam(s) + component specification`;

// ---------------------------------------------------------------- main
if (args.includes('--render-translated')) {
  const manifest = path.join(WORK, 'render.json');
  if (!exists(manifest)) { console.error('handoff-export: no translated export pending — run --select with --lang first'); process.exit(2); }
  const m = JSON.parse(read(manifest)), dir = path.join(WORK, `parts-${m.lang}`);
  const gone = m.jobs.filter((j) => !exists(path.join(dir, j.part))); if (gone.length) { console.error(`handoff-export: not translated yet: ${gone.map((j) => j.part).join(', ')} (expected in ${rel(dir)})`); process.exit(2); }
  const results = renderAll(m.jobs.map((j) => ({ ...j, input: path.join(dir, j.part) })), m.lang, m.from);
  report(results, null, { missing: m.missing });
  fs.rmSync(WORK, { recursive: true, force: true });
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

const kit = discover();
if (args.includes('--list')) {
  if (json) { console.log(JSON.stringify({ legacy: kit.legacy, missing: kit.missing.map(rel), menu: kit.menu.map((m) => ({ n: m.n, kind: m.kind, label: labelOf(m), path: rel(m.path || m.cut_sheet), seams: (m.seams || []).map(rel) })) }, null, 2)); process.exit(0); }
  if (kit.legacy) { console.log(kit.legacy === 'none' ? '❌ No handoff kit found in handoffs/.' : `⚠️  Found a ${kit.legacy === '3.x' ? '3.x kit (SYSTEM_EKONTE.md / SETTEI.md / seams/ / cut-sheets/)' : 'v2 layout (handoffs/*-handoff.md)'} — not exportable.`); process.exit(0); }
  const by = (k) => kit.menu.filter((m) => m.kind === k);
  const row = (m) => `    ${String(m.n).padStart(2)}. ${labelOf(m)}`;
  console.log('handoff kit — what would you like to export?');
  if (by('shared').length) console.log('\n  Shared documents (exported once, delivered with every package):\n' + by('shared').map(row).join('\n'));
  if (by('component').length) console.log('\n  Component packages (that component\'s Interface Contracts + Component Specification):\n' + by('component').map(row).join('\n'));
  if (by('seam').length) console.log('\n  Individual Interface Contracts:\n' + by('seam').map(row).join('\n'));
  kit.missing.forEach((m) => console.log(`\n  ⚠️  ${rel(m)} absent`));
  console.log('\nSelect: "all" (shared + every component package) · "shared" · "components" · numbers / ranges (1, 3-5)');
  process.exit(0);
}

if (kit.legacy) { console.error(`handoff-export: ${kit.legacy === 'none' ? 'no handoff kit in handoffs/ — generate it with architecture-dev-handoff' : `the handoff kit is in the ${kit.legacy} layout — re-run architecture-dev-handoff to migrate it, then export`}`); process.exit(2); }
const items = select(kit, opt('--select'));
if (!items.length) { console.error('handoff-export: nothing selected'); process.exit(2); }
const from = opt('--doc-lang') || docLanguage(), lang = opt('--lang') || from, suffix = lang === from ? '' : `-${lang}`, slug = solutionSlug();
fs.rmSync(WORK, { recursive: true, force: true }); fs.mkdirSync(WORK, { recursive: true });
const jobs = items.map((it) => {
  const output = outName(it, slug, suffix), label = labelOf(it);
  if (it.kind !== 'component') return { kind: it.kind, label, output, part: path.basename(it.path), input: it.path };
  const file = path.join(WORK, `handoff-package-${it.slug}.md`); fs.writeFileSync(file, packageMd(it, slug, suffix));
  return { kind: it.kind, label, output, part: path.basename(file), input: file };
});

if (lang !== from) {
  // translated: lay every part out for the agent, the render waits for --render-translated
  const src = path.join(WORK, 'parts'); fs.mkdirSync(src, { recursive: true });
  jobs.forEach((j) => fs.copyFileSync(j.input, path.join(src, j.part)));
  fs.writeFileSync(path.join(WORK, 'render.json'), JSON.stringify({ lang, from, missing: kit.missing.map(rel), jobs: jobs.map(({ input, ...j }) => j) }, null, 2));
  const out = { status: 'TRANSLATE', from, lang, parts: rel(src), translate_to: rel(path.join(WORK, `parts-${lang}`)), files: jobs.map((j) => j.part), then: `bun ${rel(__filename)} <project_root> --render-translated` };
  console.log(json ? JSON.stringify(out, null, 2) : `Translation needed (${from} → ${lang}): translate each file of ${out.parts}/ into ${out.translate_to}/ under the same name, then run --render-translated.\n  ${out.files.join('\n  ')}`);
  process.exit(0);
}
const results = renderAll(jobs, lang, null);
report(results, kit);
fs.rmSync(WORK, { recursive: true, force: true });
process.exit(results.every((r) => r.ok) ? 0 : 1);
