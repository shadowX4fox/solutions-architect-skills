#!/usr/bin/env node
// adr-prepare.js — the payload of one project ADR, cut by code from the ADR Context Block and the architecture.
//
//   bun adr-prepare.js <project-root> --list                                   the candidates, their status, the next free ids
//   bun adr-prepare.js <project-root> --candidate <n> --id ADR-NNN --status <Accepted|Proposed> [--date YYYY-MM-DD] [--out <file>]
//
// Workflow 1 Step 6 used to hand each ADR to a writer that read the canonical template (11 KB) and ADR_GUIDE.md (22 KB)
// and then searched the documents and the PO Spec with sed and grep for what the decision rested on. On the 8.89.0
// control run three general-purpose sub-agents wrote 17 ADRs that way: ~190 KB read per batch of six, 1.58M
// price-weighted, ~93K per ADR. This cuts, per candidate:
//
//   target     the id (checked against the ADR ID format: ADR-NNN, 101 and up, free on disk) and the file name
//   template   the canonical template's body (without its usage guide), and the per-section word budgets docs-stats.js enforces
//   candidate  its row of .cache/sa-skills/adr-context.md — title, driver, impact, the decision and the section that resolved it
//   passages   the blocks of the resolving section (and of any doc citing the id) that carry the decision's terms, by score
//   PO Spec    what the driver names — UC-NN blocks, OBJ-N rows, the §N subsection by name
//   related    one decision line for each ADR the candidate or its passages cite
//
// Output: `.cache/sa-skills/payloads/adr-NNN.md` (or --out), a manifest of what went in and what was missing on top.
'use strict';
const fs = require('fs');
const path = require('path');

const SKILL = path.join(__dirname, '..');
// architecture-docs is optional to this skill: this script serves only its Workflow 1 Step 6 (an ADR from the ADR Context
// Block of a create), so the section map loads when a payload is cut, and a missing skill is a message, not a crash.
// This skill ships in sa-records and runs from sa-records's install; architecture-docs is sa-skills'. The caller passes
// `--sa-skills <dir>` (architecture-docs' own plugin_dir) or sets SA_SKILLS_DIR; in the repo, sa-skills is four levels up.
const docsCandidates = () => [
  process.argv.includes('--sa-skills') ? path.join(process.argv[process.argv.indexOf('--sa-skills') + 1] || '', 'skills', 'architecture-docs', 'scripts') : null,   // optional: architecture-docs, located by the caller
  path.join(SKILL, '..', 'architecture-docs', 'scripts'),                                    // optional: both skills in one plugin
  path.join(SKILL, '..', '..', '..', '..', 'skills', 'architecture-docs', 'scripts'),           // optional: the repo, plugins/sa-records inside sa-skills
  process.env.SA_SKILLS_DIR ? path.join(process.env.SA_SKILLS_DIR, 'skills', 'architecture-docs', 'scripts') : null,   // optional: architecture-docs
].filter(Boolean);
let docs = null;
const sectionPrepare = () => {
  if (docs) return docs;
  const dir = docsCandidates().find((d) => fs.existsSync(path.join(d, 'section-prepare.js')));
  if (!dir) throw new Error('adr-prepare cuts payloads from an architecture — it needs the architecture-docs skill (sa-skills): pass --sa-skills <its plugin dir>');
  docs = require(path.join(dir, 'section-prepare.js'));  // optional: architecture-docs
  return docs;
};
const { ADR_SECTION_WORDS, ADR_BODY_WORDS } = require(path.join(SKILL, '..', '..', 'scripts', 'shared', 'record-budgets.js'));

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const exists = (p) => fs.existsSync(p);
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STOP = new Set(['sobre', 'desde', 'hacia', 'entre', 'para', 'como', 'cuando', 'donde', 'nunca', 'siempre', 'with', 'from', 'into', 'over', 'that', 'this', 'their', 'there', 'section', 'seccion', 'decided', 'status', 'driver', 'impact']);

// `[Candidate N] Title | Driver: … | Impact: … | Status: DECIDED: … — Section X` (also `[N] …`)
// the project's calendar day, not UTC's: a run at 19:00 in UTC−5 dated its ADRs tomorrow and spent two calls re-dating (8.102.0)
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function candidates(root) {
  const f = path.join(root, '.cache', 'sa-skills', 'adr-context.md');
  if (!exists(f)) return [];
  return read(f).split('\n').map((l) => {
    const m = l.match(/^\s*\[(?:Candidate\s+)?(\d+)\]\s*(.+)$/i); if (!m) return null;
    const cells = m[2].split('|').map((c) => c.trim());
    const get = (k) => { const c = cells.find((x) => new RegExp('^' + k + '\\s*:', 'i').test(x)); return c ? c.replace(new RegExp('^' + k + '\\s*:\\s*', 'i'), '') : ''; };
    const status = get('Status');
    const section = (status.match(/(?:Section|Sección)\s+(\d+)/i) || [])[1] || null;
    return { n: Number(m[1]), title: cells[0], driver: get('Driver'), impact: get('Impact'), status, decided: /^DECIDED/i.test(status), section: section ? Number(section) : null, line: l.trim() };
  }).filter(Boolean);
}

// Where the documents cite a candidate: `ADR Candidate N`, `ADR Candidates N and M`, `candidato(s) (de ADR) N y M` (8.91.0), and the
// bracketed form the Context Block's own `[N]` invites — `Candidato ADR [10]`, `candidatos ADR [7] y [11]` — with the status note a writer
// may add after it, `(DECIDED, Sección 4)` / `(PENDING)`, which the link replaces (8.92.6: the 8.90.0 run cited 16 times that way and
// neither --list nor adr-link saw one). One capture group: the list.
const CITE = /\b(?:ADR [Cc]andidates?|[Cc]andidat[oe]s?(?: (?:de )?ADR)?) (\[?\d+\]?(?:\s*(?:,|and|y|e)\s*\[?\d+\]?)*)(?:\s*\((?:DECIDED|PENDING)[^)]*\))?/g;
function docFiles(root) {
  const out = []; const walk = (rel) => { let es; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; } for (const e of es) { const r = rel + '/' + e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.md') && e.name !== 'CHANGELOG.md') out.push(r); } };
  walk('docs'); return out;
}
function citations(root) {
  const by = new Map();
  for (const f of docFiles(root)) { const t = read(path.join(root, f)); for (const m of t.matchAll(CITE)) for (const n of m[1].match(/\d+/g)) { const k = Number(n); if (!by.has(k)) by.set(k, new Set()); by.get(k).add(f); } }
  return by;
}
const idsPath = (root) => path.join(root, '.cache', 'sa-skills', 'adr-ids.json');
function loadIds(root) { try { return JSON.parse(read(idsPath(root))); } catch { return {}; } }

function projectIds(root) {
  const d = path.join(root, 'adr');
  return exists(d) ? fs.readdirSync(d).map((f) => Number((f.match(/^ADR-(\d{3})\b/) || [])[1])).filter((n) => n > 100) : [];
}
const slug = (t) => fold(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 8).join('-').slice(0, 60).replace(/-$/, '');

// heading blocks of a markdown file (#{2,4}), each with its text
function blocks(src) {
  const lines = src.split('\n'), out = []; let cur = null;
  lines.forEach((l, i) => { if (/^#{2,4}\s/.test(l)) { if (cur) out.push(cur); cur = { heading: l, line: i + 1, text: [l] }; } else if (cur) cur.text.push(l); });
  if (cur) out.push(cur);
  return out.map((b) => ({ heading: b.heading, line: b.line, text: b.text.join('\n').trim() }));
}
const terms = (s) => [...new Set(fold(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w)))];
const score = (text, ts) => { const t = fold(text); return ts.reduce((n, w) => n + (t.split(w).length - 1), 0); };
const cap = (s, n) => (s.length > n ? s.slice(0, n).replace(/\n[^\n]*$/, '') + '\n…' : s);

function prepare(root, opts) {
  root = path.resolve(root);
  const parts = [], included = [], missing = [];
  const add = (title, text, src) => { if (!text) return missing.push(title); parts.push(`\n\n---\n\n# ▸ ${title}${src ? `\n\n<!-- source: ${src} -->` : ''}\n\n${text.trim()}`); included.push(`${title} (${(Buffer.byteLength(text) / 1024).toFixed(1)} KB)`); };
  const c = candidates(root).find((x) => x.n === Number(opts.candidate));
  if (!c) throw new Error(`candidate ${opts.candidate} not found in .cache/sa-skills/adr-context.md`);
  const id = String(opts.id || '');
  if (!/^ADR-\d{3}$/.test(id) || Number(id.slice(4)) <= 100) throw new Error(`--id ${id || '(none)'}: a project ADR is ADR-NNN with NNN ≥ 101 (ADR ID Format Gate)`);
  const taken = fs.readdirSync(path.join(root, 'adr')).find((f) => f.startsWith(id + '-'));
  const file = taken ? `adr/${taken}` : `adr/${id}-${slug(c.title)}.md`;
  let lang = 'en'; try { lang = JSON.parse(read(path.join(root, '.cache', 'sa-skills', 'collect.json'))).doc_language || 'en'; } catch { const a = path.join(root, 'ARCHITECTURE.md'); if (exists(a)) lang = (read(a).match(/DOC_LANGUAGE:\s*(en|es)/) || [])[1] || 'en'; }

  // target and rules
  add('Target', [
    `**File**: \`${file}\`${taken ? ' (exists — this is a rewrite of it)' : ''}`,
    `**Header**: \`# ${id}: <title in ${lang}>\` · **Status**: ${opts.status || 'Proposed'} · **Scope**: User · **Date**: ${opts.date || localDate()} · **Authors**: Architecture Team`,
    `**Language**: prose in \`${lang}\`; every heading, label and table header of the template stays English, with no anchor comment (LANGUAGE_POLICY §4 *Records*).`,
    `**Budgets (words, BLOCKING once PROSE_STYLE is stamped)**: ${Object.entries(ADR_SECTION_WORDS).map(([k, v]) => `${k} ${v}`).join(' · ')} · decision body ≤ ${ADR_BODY_WORDS}. One line per Review History entry.`,
    '**Within the budgets (8.91.0 — 8 of 14 ADRs of the 8.90.0 run came back over Context)**: Context = Problem Statement 2–3 sentences + Requirements ≤ 5 table rows + Business Drivers ≤ 3 bullets, all three ≤ 250 words together · Decision = Summary 2–3 sentences + Detailed Decision ≤ 6 bullets + Scope ≤ 4 rows · Rationale ≤ 4 drivers + a comparison of ≤ 3 rows · Consequences ≤ 3 positive, ≤ 3 negative, ≤ 3 trade-offs · Alternatives ≤ 3, one row each. Count before you write.',
    '**Never**: an ID with a phase / version prefix or suffix, an invented fact, a placeholder left in a section the passages below can fill — write `Not documented` where they cannot.',
  ].join('\n'));
  const tpl = read(path.join(SKILL, 'adr', 'ADR-000-template.md'));
  add('Canonical template (all ten sections, in this order)', tpl.split(/\n## ADR Template Usage Guide/)[0], 'adr/ADR-000-template.md');

  // the candidate
  add('Candidate (ADR Context Block)', c.line, '.cache/sa-skills/adr-context.md');

  // passages: the resolving section, and any doc already citing the id
  const ts = terms(c.title + ' ' + c.status.replace(/—\s*(Section|Sección).*$/i, ''));
  const sources = [];
  if (c.section && sectionPrepare().SECTIONS[c.section]) sources.push({ file: sectionPrepare().SECTIONS[c.section].file, why: `Section ${c.section} resolved it` });
  // a candidate the Context Block still calls PENDING but the documents cite: its decision is in the citing blocks
  for (const f of citations(root).get(c.n) || []) if (!sources.some((s) => s.file === f)) sources.push({ file: f, why: `cites candidate ${c.n}` });
  const citeRe = new RegExp('\\b(?:ADR Candidates?|[Cc]andidat[oe]s?(?: de ADR)?) (?:\\d+\\s*(?:,|and|y)\\s*)*' + c.n + '\\b');
  const docsDir = path.join(root, 'docs');
  if (exists(docsDir)) for (const f of fs.readdirSync(docsDir).filter((x) => /^\d\d-.*\.md$/.test(x))) if (read(path.join(docsDir, f)).includes(id + ']') || read(path.join(docsDir, f)).includes(id + ' ') || read(path.join(docsDir, f)).includes(id + ')')) sources.push({ file: 'docs/' + f, why: `cites ${id}` });
  const seen = new Set(); let budget = 12000;
  for (const s of sources) {
    const abs = path.join(root, s.file); if (!exists(abs) || s.file.includes('*')) continue;
    const bs = blocks(read(abs)).map((b) => ({ ...b, s: score(b.text, ts) + (b.text.includes(id) ? 5 : 0) + (citeRe.test(b.text) ? 10 : 0) })).filter((b) => b.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    for (const b of bs) { const key = s.file + b.line; if (seen.has(key) || budget <= 0) continue; seen.add(key); const t = cap(b.text, 4000); budget -= t.length; add(`Passage — ${s.file}:${b.line} (${s.why})`, t, s.file); }
  }
  if (!seen.size) missing.push('passages: no block of the resolving section carries the decision\'s terms — write from the candidate and mark the rest Not documented');

  // the PO Spec, as the driver names it
  const po = path.join(root, 'PRODUCT_OWNER_SPEC.md');
  if (exists(po) && c.driver) {
    const src = read(po), pb = blocks(src); let poBudget = 8000; const got = new Set();
    const take = (b, why) => { if (!b || got.has(b.line) || poBudget <= 0) return; got.add(b.line); const t = cap(b.text, 3000); poBudget -= t.length; add(`PO Spec — ${b.heading.replace(/^#+\s*/, '').replace(/<!--.*?-->/g, '').trim()} (${why})`, t, 'PRODUCT_OWNER_SPEC.md'); };
    for (const uc of c.driver.match(/UC-\d+/g) || []) take(pb.find((b) => b.heading.includes(uc)) || pb.find((b) => b.text.includes(uc)), uc);
    for (const ob of c.driver.match(/OBJ-\d+/g) || []) { const b = pb.find((x) => x.text.includes(ob)); if (b) { const rows = b.text.split('\n').filter((l) => l.includes(ob)); poBudget -= rows.join('\n').length; add(`PO Spec — ${ob}`, `${b.heading}\n\n${rows.join('\n')}`, 'PRODUCT_OWNER_SPEC.md'); } }
    for (const m of c.driver.matchAll(/§\s*(\d+)\s*([^,;|§]*)/g)) { const name = terms(m[2]); const b = name.length ? pb.filter((x) => /^###/.test(x.heading)).map((x) => ({ x, s: score(x.heading, name) })).sort((a, b) => b.s - a.s)[0] : null; if (b && b.s > 0) take(b.x, `§${m[1]}`); }
  }

  // related ADRs, one line each — never the template's own ADR-000, which the payload's template block names (8.102.0)
  const ids = new Set((c.line.match(/ADR-\d{3}/g) || []).filter((x) => x !== id && x !== 'ADR-000'));
  for (const p of parts) for (const x of p.match(/ADR-\d{3}/g) || []) if (x !== id && x !== 'ADR-000') ids.add(x);
  const adrDir = path.join(root, 'adr');
  const rel = [...ids].sort().slice(0, 12).map((x) => { const f = exists(adrDir) && fs.readdirSync(adrDir).find((y) => y.startsWith(x + '-')); if (!f) return `| ${x} | (not on disk) | — | — |`; const t = (read(path.join(adrDir, f)).match(/^#\s+(.+)$/m) || [])[1] || ''; return `| ${x} | ${t.replace(/^ADR-\d{3}[:\s—-]*/, '')} | ${sectionPrepare().adrDecision(path.join(adrDir, f)) || '—'} | \`[${x}](${f})\` |`; });
  // the link column is the citation to paste: writers invented `ADR-001-title.md` targets no gate caught (8.102.0)
  if (rel.length) add('Related ADRs (cite them in References → Related ADRs — paste the Link cell, never compose a filename)', `| ADR | Title | Decision | Link |\n|---|---|---|---|\n${rel.join('\n')}`, 'adr/');

  const manifest = `# ADR payload — ${id} (candidate ${c.n})\n\n| | |\n|---|---|\n| Target | \`${file}\` |\n| Language | ${lang} |\n| Included | ${included.length} blocks |\n| Missing | ${missing.length ? missing.join('; ') : 'none'} |\n\nWrite the ADR from this payload alone. Do not read the documents, the PO Spec or ADR_GUIDE.md — what they hold for this decision is below. A fact that is not here is \`Not documented\`, never invented.`;
  const text = manifest + parts.join('') + '\n';
  return { text, file, id, included, missing, bytes: Buffer.byteLength(text) };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args[0];
  if (!root || root.startsWith('--')) { console.error('Usage: bun adr-prepare.js <project-root> --list | --candidate <n> --id ADR-NNN [--status Accepted|Proposed] [--date YYYY-MM-DD] [--out <file>]'); process.exit(2); }
  if (args.includes('--list')) {
    const R = path.resolve(root), cs = candidates(R), cited = citations(R), ids = loadIds(R); let next = Math.max(100, ...projectIds(R)) + 1;
    const rows = cs.map((c) => {
      const where = [...(cited.get(c.n) || [])].map((f) => f.replace(/^docs\//, '')).join(', ');
      const state = ids[c.n] ? `written (${ids[c.n].id})` : c.decided ? `DECIDED${c.section ? ` (Section ${c.section})` : ''}` : where ? 'PENDING — resolved in the documents' : 'PENDING — not cited';
      const gets = ids[c.n] ? ids[c.n].id : (c.decided || where) ? `ADR-${next++}` : null;
      return { c, line: (g) => `| ${c.n} | ${c.title.slice(0, 70)} | ${state} | ${where || '—'} | ${g} |`, gets };
    });
    // 8.92.8: a candidate no section resolved is still a decision the collection named (the 8.92.7 run left 9, 10 and 12 — retention,
    // corrections, service tier — without an ADR and reported them as the user's to decide). It takes an id after the rest, so the
    // main set numbers the same either way, and Step 1 asks whether to write it as Proposed.
    const optional = rows.filter((r) => !r.gets).map((r) => { r.gets = `ADR-${next++} (optional)`; return r.c.n; });
    rows.forEach((r, i) => { rows[i] = r.line(r.gets); });
    console.log('| # | Candidate | State | Cited in | Id |\n|---|---|---|---|---|\n' + rows.join('\n'));
    const resolvable = cs.filter((c) => !c.decided && cited.has(c.n) && !ids[c.n]).length;
    console.log(`\nGenerate: every DECIDED candidate and every PENDING one the documents cite${resolvable ? ` (${resolvable} of them — the sections resolved them; the Context Block was not updated)` : ''}. A candidate cited nowhere is optional.`);
    if (optional.length) console.log(`Optional: ${optional.length} candidate(s) no section resolved (${optional.join(', ')}) — ask whether to write them too, as Proposed, with the ids shown; their payload carries the candidate's row and the PO Spec driver, no resolving passage.`);
    process.exit(0);
  }
  let r; try { r = prepare(root, { candidate: opt('--candidate'), id: opt('--id'), status: opt('--status'), date: opt('--date') }); } catch (e) { console.error('adr-prepare: ' + e.message); process.exit(2); }
  const out = opt('--out') || path.join(path.resolve(root), '.cache', 'sa-skills', 'payloads', `${r.id.toLowerCase()}.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, r.text);
  const ids = loadIds(path.resolve(root)); ids[opt('--candidate')] = { id: r.id, file: r.file }; fs.mkdirSync(path.dirname(idsPath(path.resolve(root))), { recursive: true }); fs.writeFileSync(idsPath(path.resolve(root)), JSON.stringify(ids, null, 2) + '\n');
  console.log(`Wrote ${out} (${(r.bytes / 1024).toFixed(1)} KB) → ${r.file}`);
  if (r.missing.length) console.log('Missing: ' + r.missing.join('; '));
}

module.exports = { prepare, candidates, slug, citations, loadIds, CITE, docFiles };
