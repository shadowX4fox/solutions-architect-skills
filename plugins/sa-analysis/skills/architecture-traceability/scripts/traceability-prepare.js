#!/usr/bin/env node
// traceability-prepare.js — the PO Spec's use cases against the architecture, cut by code and judged one requirement at a time.
//
//   bun traceability-prepare.js <project-root> [--spec PRODUCT_OWNER_SPEC.md] [--judge agent|typesafe|clef]
//                               [--out TRACEABILITY_REPORT.md] [--today YYYY-MM-DD] [--json] [--dry-run]
//
// The traceability skill had no script: the session read the PO Spec, turned every flow step, alternative, edge case,
// pre- and postcondition and metric into a requirement, searched the docs for each, and decided Covered / Partial /
// Not Covered 115 times over — the largest in-session judgement in the plugin, with no fixture and no `Unknown`.
//
// Stage 1 (code): the use cases are parsed from the spec (`### UC-NN: name` under the Use Cases section; the fields by
// their bold labels in either language), each yields its requirements by the skill's table, and for each requirement
// the explorer (`explorer-cli`'s `findings`) cuts the evidence: the docs passages that carry its key terms, the
// skill's routing table naming where the answer should live. Stage 2 (scripts/judge.js): one Score per requirement
// over its excerpts — the three levels are the three outcomes, so there is no threshold to fit — plus one Noul per
// flow step for "pure UI navigation, no system behaviour" (the skill skips those). A requirement the judge has not
// scored (a pending worksheet, an engine error, an unanswered item) is Undecided — never classified by term overlap —
// and listed with the worksheet to answer; an unanswered step stays traced. Stage 3 (code): the counts, the percentages by largest remainder, the report in the
// skill's format, and the summary. What the judge cannot write — the *gap* text of a Partial — is left as
// `[NOT DOCUMENTED]`, never composed.
//
// Phases (8.143.0): when the architecture declares Delivery Increments (docs/01, read by the facts ledger), a use case's
// phase is its increment — `Coverage by Phase` is then the coverage of each delivery piece, in the table's order, and a
// use case no increment carries is `Not assigned`. Without the table every use case is `Phase 1`, as before.
'use strict';
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');
const { findings: explore } = require(fromSaSkills('scripts', 'shared', 'explorer.ts'));
const JUDGE = require(fromSaSkills('scripts', 'judge.js'));

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const { parseSpec, plain } = require(fromSaSkills('scripts', 'shared', 'po-spec.js'));
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STOP = new Set('the a an and or of to in on at for with from by is are be as that this these those it its into over under without within el la los las un una unos unas y o de del al en con por para sin sobre entre hasta desde que se su sus lo le les es son ser está están como más menos cada todo toda todos todas otro otra este esta estos estas ese esa aquel cuando donde mientras según hacia tras ya no ni si the'.split(' '));
// the words worth searching for: 4+ letters outside the stoplist, numbers with their unit ("12 meses", "95%", "1 s"), longest first
const keyTerms = (s, n = 6) => { const seen = new Set(); const t = norm(s).replace(/[^a-z0-9%<>≤≥.,\- ]+/g, ' ');
  const nums = [...t.matchAll(/\b\d+(?:[.,]\d+)?\s*(?:%|ms|s|min|h|meses|mes|dias|d[íi]as|segundos?|minutos?|horas?)\b/g)].map((m) => m[0].replace(/\s+/g, ' ').trim());
  const words = t.split(/\s+/).filter((w) => /^[a-z]/.test(w) && (w.length >= 4 || /\d/.test(w)) && !STOP.has(w) && !seen.has(w) && seen.add(w)).sort((a, b) => b.length - a.length);   // p95, p99 stay
  return [...new Set([...nums.slice(0, 2), ...words])].slice(0, n); };

// ── Stage 1a: the spec ───────────────────────────────────────────────────────────────────────────
// the spec parser is shared with architecture-capability-alignment (scripts/shared/po-spec.js, a re-export of sa-requirements')
// the requirements a use case yields (SKILL.md § Step 3): each flow step, alternative, edge case, pre- and postcondition item, metric
const bulletText = (s) => plain(s.replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
const splitItems = (items) => items.flatMap((s) => bulletText(s).split(/\s*;\s*/)).map((s) => s.trim()).filter((s) => s.length > 3);
// a use case's phase: its delivery increment when the architecture declares them (`UC-1` and `UC-01` are one id)
function phasesOf(root, lang) {
  let rows = [];
  try { rows = require(fromSaSkills('scripts', 'shared', 'arch-facts.js')).collect(root).increments || []; } catch { rows = []; }
  if (!rows.length) return Object.assign(() => 'Phase 1', { order: [] });
  const key = (id) => { const m = String(id || '').match(/UC-?0*(\d+)/i); return m ? m[1] : String(id); };
  const at = {}; rows.forEach((r) => r.use_cases.forEach((u) => { at[key(u)] = at[key(u)] || r; }));
  const word = lang === 'es' ? 'Incremento' : 'Increment', none = lang === 'es' ? 'Sin asignar' : 'Not assigned';
  const label = (r) => `${word} ${r.id}${r.target ? ` · ${r.target}` : ''}`;
  return Object.assign((uc) => { const r = at[key(uc)]; return r ? label(r) : none; }, { order: rows.map(label).concat(none) });
}

function requirementsOf(uc) {
  const out = [], add = (source, type, text, opts = {}) => { if (text && text.length > 3) out.push(Object.assign({ uc: uc.id, source, type, text }, opts)); };
  (uc.fields.primaryFlow || []).filter((s) => /^\s*\d+\./.test(s)).forEach((s) => add('Primary Flow', 'functional', bulletText(s), { step: true }));
  (uc.fields.alternativeFlows || []).filter((s) => /^\s*[-*+]/.test(s)).forEach((s) => add('Alternative Flow', 'error', bulletText(s)));
  (uc.fields.edgeCases || []).filter((s) => /^\s*[-*+]/.test(s)).forEach((s) => add('Edge Case', 'error', bulletText(s)));
  splitItems(uc.fields.preconditions || []).forEach((s) => add('Precondition', /autentic|authentic|rol\b|role|permis|autoriz|authoriz|sesi[óo]n|session/i.test(s) ? 'auth' : 'functional', s));
  splitItems(uc.fields.postconditions || []).forEach((s) => add('Postcondition', 'data', s));
  (uc.fields.successMetrics || []).filter((s) => /^\s*[-*+]/.test(s)).forEach((s) => add('Success Metric', 'performance', bulletText(s)));
  return out;
}
// the routing table (SKILL.md § Step 4) and the section numbers the report cites
const ROUTE = { functional: ['docs/01-', 'docs/components/', 'docs/04-'], data: ['docs/04-', 'docs/components/'], integration: ['docs/05-'], auth: ['docs/07-'], performance: ['docs/08-', 'docs/01-'], error: ['docs/components/', 'docs/09-', 'docs/04-'], operations: ['docs/09-'] };
const SUGGEST = { functional: 'S5 (Components) / S1+S2 (System Overview)', data: 'S6 (Data Flow Patterns)', integration: 'S7 (Integration Points)', auth: 'S9 (Security Architecture)', performance: 'S10 (Scalability and Performance)', error: 'S5 (Components) / S11 (Operational Considerations)', operations: 'S11 (Operational Considerations)' };
const SNUM = (f) => (/docs\/01-/.test(f) ? 'S1+S2' : /docs\/03-/.test(f) ? 'S4' : /docs\/components\//.test(f) ? 'S5' : /docs\/04-/.test(f) ? 'S6' : /docs\/05-/.test(f) ? 'S7' : /docs\/06-/.test(f) ? 'S8' : /docs\/07-/.test(f) ? 'S9' : /docs\/08-/.test(f) ? 'S10' : /docs\/09-/.test(f) ? 'S11' : /^ARCHITECTURE/.test(f) ? 'ARCHITECTURE.md' : f);
const typeOf = (r) => (/integra|api\b|servicio externo|third[- ]party|gateway|external/i.test(r.text) && r.type === 'functional' ? 'integration' : /monitor|alert|observab|dynatrace|log\b|runbook|operaci/i.test(r.text) && r.type !== 'performance' ? 'operations' : r.type);

// ── Stage 1b: the evidence per requirement ───────────────────────────────────────────────────────
// A first cut searched `docs/` only and ranked by the explorer's term count: the best excerpt was routinely a file's
// EXPLORER_HEADER comment — its key_concepts list matches many terms and states nothing — and the ADRs the gold report
// cites on every other row were never searched. The judge answered honestly on that evidence: 32 covered of 120 against
// the session's 91. Evidence is Stage 1's job: the whole surface, no header or heading-only excerpts, ranked by overlap.
const isHeaderNoise = (m) => /EXPLORER_HEADER|^\s*<!--|^key_concepts:|^component_self:|^related_adrs:/i.test(m.excerpt || '') || /^#+\s*[^\n]*$/.test(String(m.excerpt || '').trim());
function evidenceFor(root, r) {
  const terms = keyTerms(r.text); if (!terms.length) return { terms, candidates: [] };
  // a wide file cap: a term like "sesiones" lives in thirty files, and the SLO table of docs/08 must not fall behind them
  let res; try { res = explore(root, { query: terms.join(','), surface: 'all', maxFiles: 40, maxClusters: 4 }); } catch (e) { return { terms, candidates: [], error: e.message }; }
  if (res.status !== 'OK') return { terms, candidates: [], error: res.reason };
  const routes = ROUTE[typeOf(r)] || [];
  const cands = (res.files || []).flatMap((f) => (f.matches || []).filter((m) => !isHeaderNoise(m)).map((m) => ({ file: f.file, section: SNUM(f.file), heading: plain(m.heading), line: m.line, excerpt: plain(m.excerpt).slice(0, 400), routed: routes.some((p) => f.file.startsWith(p)) })));
  // rank: term overlap, the route the skill's table names (a metric's answer lives in docs/08, whatever else says "carga"),
  // then the project's own documents before its ADRs and its ADRs before the institutional catalog (ADR-001…100 match
  // generic words — "servicios", "backend" — on every requirement)
  cands.forEach((c) => { c.overlap = overlap(r, c); c.rank = c.overlap + (c.routed ? 0.6 : 0) + (/^docs\//.test(c.file) ? 0.2 : /^adr\/ADR-(?:1\d\d|[2-9]\d\d)/.test(c.file) ? 0.1 : 0); });
  cands.sort((a, b) => (b.rank - a.rank) || a.file.localeCompare(b.file) || a.line - b.line);
  return { terms, candidates: cands.slice(0, 6) };
}
const overlap = (r, c) => { const t = keyTerms(r.text, 8); if (!t.length) return 0; const e = norm(c.excerpt); return t.filter((w) => e.includes(w.slice(0, Math.min(w.length, 6)))).length / t.length; };

// ── Stage 2: the judgement ───────────────────────────────────────────────────────────────────────
const LEVELS = ['Not Covered', 'Partial', 'Covered'];
const COVERAGE = {
  id: 'traceability-coverage', type: 'score',
  question: 'Do the architecture excerpts in `item.evidence` cover the business requirement `item.requirement` (from use case `item.use_case`, stated as a `item.source`)? Judge the capability the requirement names, not the path it imagined: a different component, technology or integration that achieves the same outcome covers it.',
  criteria: [
    'Not covered: no excerpt addresses the capability; nothing in the evidence handles what the requirement names.',
    'Partial: the excerpts touch the capability or part of it, but a part of what the requirement names — a control, a threshold, a behaviour, a state — is not addressed by any of them.',
    'Covered: an excerpt states that the capability is provided, by any component or path, even one different from what the requirement expected.',
  ],
};
const NAVIGATION = { id: 'traceability-navigation', type: 'noul', hi: 0.75, question: 'Is the flow step `item.step` (use case `item.use_case`) pure user-interface navigation — the user opening a screen, tapping, scrolling, selecting — with no behaviour the system must provide behind it?', criteria: { true: 'The step only moves the user through the interface; nothing has to be computed, fetched, stored, validated or sent.', false: 'The step implies system behaviour: a query, a validation, a rendering of data, a call, a state change, a rule.' } };

async function run(root, opts = {}) {
  root = path.resolve(root);
  const specPath = path.resolve(root, opts.spec || 'PRODUCT_OWNER_SPEC.md');
  if (!fs.existsSync(specPath)) throw new Error(`no PO Spec at ${path.relative(root, specPath)} — run /sa-requirements:architecture-readiness first`);
  if (!fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) throw new Error('No ARCHITECTURE.md found. Use /skill architecture-docs to create one first.');
  const arch = read(path.join(root, 'ARCHITECTURE.md')), archVersion = (arch.match(/<!--\s*ARCHITECTURE_VERSION:\s*([^>]*?)\s*-->/) || [])[1] || 'unversioned';
  const lang = ((arch.match(/<!--\s*(?:DOC_LANGUAGE|LANGUAGE):\s*(\w+)\s*-->/) || [])[1] || 'en').toLowerCase();
  const spec = parseSpec(read(specPath));
  // The evidence and the requirement must be in one language: the judge separates worst on a mixed-language state (the
  // BIAN alignment measured it). The project's own documents follow DOC_LANGUAGE; the institutional ADRs follow the
  // edition Workflow 6 imported, recorded in the pin — a mismatch is named, never fixed here.
  const pinPath = path.join(root, 'adr', '.institutional-catalog.json');
  if (fs.existsSync(pinPath)) { try { const edition = String(JSON.parse(read(pinPath)).edition || '').toLowerCase(); if (edition && edition !== lang) spec.warnings.push(`the institutional ADR catalog is the '${edition}' edition while DOC_LANGUAGE is '${lang}': evidence from ADR-001…100 is in another language than the requirements, and the judge separates worst on a mixed-language state — import the '${lang}' edition (architecture-definition-record Workflow 6)`); } catch { /* an unreadable pin is the ADR skill's finding */ } }
  const reqs = spec.useCases.flatMap(requirementsOf);
  const phaseOf = phasesOf(root, lang);
  reqs.forEach((r, i) => { r.id = `R${String(i + 1).padStart(3, '0')}`; r.phase = phaseOf(r.uc); Object.assign(r, evidenceFor(root, r)); });
  const engine = opts.engine || JUDGE.engineInForce();
  const judge = { engine, asked: 0, navigation_dropped: [], navigation_undecided: [], undecided: [], worksheets: [], note: null };
  const pend = (res) => { if (res.pending && !judge.worksheets.includes(res.pending)) judge.worksheets.push(res.pending); };
  const common = { engine, root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache };
  // the flow steps that are pure navigation — the skill skips them; a step the judge has not answered stays traced, noted
  const steps = reqs.filter((r) => r.step);
  let nav = { answers: {} };
  if (steps.length) { try { nav = await JUDGE.judge(NAVIGATION, steps.map((r) => ({ id: r.id, state: { step: r.text, use_case: r.uc } })), common); pend(nav); }
    catch (e) { if (e.name !== 'JudgeError') throw e; judge.note = e.message; } }
  steps.forEach((r) => { const a = nav.answers[r.id]; if (!a) judge.navigation_undecided.push(r.id); else if (a.p >= NAVIGATION.hi) { r.dropped = `navigation (${a.by} ${a.p.toFixed(2)})`; judge.navigation_dropped.push(`${r.uc} "${r.text.slice(0, 70)}" (${a.p.toFixed(2)})`); } });
  const live = reqs.filter((r) => !r.dropped);
  judge.asked = live.length;
  const items = live.map((r) => ({ id: r.id, state: { requirement: r.text, use_case: `${r.uc} ${spec.useCases.find((u) => u.id === r.uc)?.name || ''}`.trim(), source: r.source, evidence: r.candidates.length ? r.candidates.map((c) => ({ where: `${c.section} ${c.file} § ${c.heading}`, excerpt: c.excerpt })) : 'no passage of the architecture carries this requirement\'s key terms' } }));
  let res = { engine, answers: {} };
  if (items.length) { try { res = await JUDGE.judge(COVERAGE, items, common); pend(res); } catch (e) { if (e.name !== 'JudgeError') throw e; judge.note = e.message; } }
  judge.engine = res.engine || engine;
  if (judge.worksheets.length) judge.note = [judge.note, `answer the worksheet${judge.worksheets.length > 1 ? 's' : ''} ${judge.worksheets.join(', ')} and re-run`].filter(Boolean).join(' · ');
  live.forEach((r) => { const a = res.answers[r.id];
    if (!a) { r.status = 'Undecided'; r.by = 'undecided'; r.evidence = r.candidates[0] ? `${r.candidates[0].section} § ${plain(r.candidates[0].heading)} — "${r.candidates[0].excerpt.slice(0, 100)}"` : '—'; r.gap = null; r.suggested = null; judge.undecided.push(r.id); return; }   // no judge answer: not classified, reported
    const s = a.score, level = Math.min(2, Math.max(0, Math.round(s)));
    r.status = LEVELS[level]; r.score = +Number(s).toFixed(2); r.by = a.by; if (a.confidence != null) r.confidence = +a.confidence.toFixed(2);
    const best = r.candidates[0];   // the top-ranked candidate: overlap, the route, the project's own documents first
    r.evidence = level > 0 && best ? `${best.section} § ${plain(best.heading)} — "${best.excerpt.slice(0, 100)}"` : '—';
    r.gap = level === 1 ? '[NOT DOCUMENTED: what is missing — judged Partial; state it after reading the evidence]' : null; r.suggested = level === 0 ? SUGGEST[typeOf(r)] : null; });
  return { root, spec: path.relative(root, specPath), specVersion: spec.version, archVersion, lang, useCases: spec.useCases, requirements: reqs, judge, warnings: spec.warnings, phaseOrder: phaseOf.order, today: opts.today || new Date().toISOString().slice(0, 10) };
}

// ── Stage 3: the numbers and the report ──────────────────────────────────────────────────────────
/** integer percentages that sum to 100 — largest remainder (Hamilton), ties by larger count then row order */
function percents(counts) { const total = counts.reduce((a, b) => a + b, 0); if (!total) return counts.map(() => 0); const exact = counts.map((c) => (100 * c) / total), floors = exact.map(Math.floor); let deficit = 100 - floors.reduce((a, b) => a + b, 0); const order = exact.map((p, i) => ({ i, r: p - floors[i], c: counts[i] })).sort((a, b) => (b.r - a.r) || (b.c - a.c) || (a.i - b.i)); for (const o of order) { if (deficit <= 0) break; floors[o.i]++; deficit--; } return floors; }
const MARK = { 'Covered': '✅ Covered', 'Partial': '⚠️ Partial', 'Not Covered': '❌ Not Covered', 'Undecided': '❔ Undecided' };
const cell = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
function report(r) {
  const live = r.requirements.filter((x) => !x.dropped), by = (st) => live.filter((x) => x.status === st);
  const counts = [by('Covered').length, by('Partial').length, by('Not Covered').length, by('Undecided').length], pct = percents(counts);
  const out = [`# PO Spec Use Cases vs Architecture Coverage`, '', `**PO Spec**: ${r.spec}${r.specVersion ? ` (v${r.specVersion})` : ''}`, `**Architecture**: ARCHITECTURE.md`, `**Architecture Version**: ${r.archVersion}`, `**Date**: ${r.today}`, `**Classified by**: ${r.judge.engine}${counts[3] ? ` — ${counts[3]} requirement(s) undecided (no judge answer yet)` : ''}`, '',
    `## Summary <!-- SECTION: Summary -->`, '', `| Metric | Count | % |`, `|--------|-------|---|`, `| Total Requirements | ${live.length} | — |`, `| ✅ Covered | ${counts[0]} | ${pct[0]}% |`, `| ⚠️ Partial | ${counts[1]} | ${pct[1]}% |`, `| ❌ Not Covered | ${counts[2]} | ${pct[2]}% |`, ...(counts[3] ? [`| ❔ Undecided | ${counts[3]} | ${pct[3]}% |`] : []), '',
    `### Coverage by Phase <!-- SECTION: Coverage by Phase -->`, '', `| Phase | Requirements | Covered | Partial | Gaps | Coverage |`, `|-------|-------------|---------|---------|------|----------|`];
  const order = r.phaseOrder || [], rank = (ph) => { const i = order.indexOf(ph); return i < 0 ? order.length : i; };
  const phases = [...new Set(live.map((x) => x.phase))].sort((a, b) => rank(a) - rank(b)); phases.forEach((ph) => { const p = live.filter((x) => x.phase === ph), c = p.filter((x) => x.status === 'Covered').length; out.push(`| ${ph} | ${p.length} | ${c} | ${p.filter((x) => x.status === 'Partial').length} | ${p.filter((x) => x.status === 'Not Covered').length} | ${p.length ? Math.round((100 * c) / p.length) : 0}% |`); });
  out.push('', '---');
  r.useCases.forEach((uc) => { const rs = live.filter((x) => x.uc === uc.id), c = rs.filter((x) => x.status === 'Covered').length;
    out.push('', `## ${uc.id}: ${uc.name} — ${rs[0] ? rs[0].phase : 'Phase 1'}`, '', `**Actor**: ${(uc.fields.actor || ['—']).join(' ')}`, `**Coverage**: ${c}/${rs.length} requirements (${rs.length ? Math.round((100 * c) / rs.length) : 0}%)`, '', `| PO Spec Requirement | Architecture Coverage | Status |`, `|---------------------|----------------------|--------|`);
    rs.forEach((x) => out.push(`| ${cell(x.text)} | ${cell(x.evidence)} | ${MARK[x.status]}${x.by !== 'undecided' && x.confidence != null ? ` <!-- ${x.by} ${x.confidence} -->` : ''} |`));
    out.push('', '---'); });
  out.push('', `## Gap Report <!-- SECTION: Gap Report -->`, '', 'Requirements that need architecture documentation attention:', '', `### ❌ Not Covered`, '', `| UC | Requirement | Source | Suggested Section |`, `|----|-------------|--------|-------------------|`);
  by('Not Covered').forEach((x) => out.push(`| ${x.uc} | ${cell(x.text)} | ${x.source} | ${x.suggested} |`));
  out.push('', `### ⚠️ Partial`, '', `| UC | Requirement | Evidence | Gap |`, `|----|-------------|----------|-----|`);
  by('Partial').forEach((x) => out.push(`| ${x.uc} | ${cell(x.text)} | ${cell(x.evidence)} | ${x.gap} |`));
  if (counts[3] || r.judge.navigation_undecided.length) { out.push('', `### ❔ Undecided (not judged)`, '', `The judge has not answered these — they are neither covered nor gaps. ${r.judge.worksheets.length ? `Answer ${r.judge.worksheets.map((f) => `\`${f}\``).join(', ')} and re-run.` : (r.judge.note || 'Run with --judge agent, typesafe or clef.')}`, '');
    if (counts[3]) { out.push(`| UC | Requirement | Source |`, `|----|-------------|--------|`); by('Undecided').forEach((x) => out.push(`| ${x.uc} | ${cell(x.text)} | ${x.source} |`)); }
    if (r.judge.navigation_undecided.length) out.push('', `Flow steps not yet judged for navigation (kept and traced): ${r.judge.navigation_undecided.join(', ')}.`); }
  const dropped = r.requirements.filter((x) => x.dropped); if (dropped.length) { out.push('', `### Flow steps read as navigation (not traced)`, '', dropped.map((x) => `- ${x.uc}: ${x.text} — ${x.dropped}`).join('\n')); }
  return out.join('\n') + '\n';
}

module.exports = { parseSpec, requirementsOf, evidenceFor, run, report, percents, COVERAGE, NAVIGATION };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args.find((a, i) => !a.startsWith('--') && !['--spec', '--judge', '--out', '--today'].includes(args[i - 1]));
  if (!root) { console.error('Usage: bun traceability-prepare.js <project-root> [--spec PRODUCT_OWNER_SPEC.md] [--judge agent|typesafe|clef] [--out TRACEABILITY_REPORT.md] [--today YYYY-MM-DD] [--json] [--dry-run]'); process.exit(2); }
  let r; try { r = await run(root, { spec: opt('--spec'), engine: opt('--judge'), today: opt('--today') }); } catch (e) { console.error('traceability-prepare: ' + e.message); process.exit(2); }
  const md = report(r), outPath = path.resolve(root, opt('--out') || 'TRACEABILITY_REPORT.md');
  if (!args.includes('--dry-run')) fs.writeFileSync(outPath, md);
  const live = r.requirements.filter((x) => !x.dropped), n = (s) => live.filter((x) => x.status === s).length;
  if (args.includes('--json')) console.log(JSON.stringify({ spec: r.spec, archVersion: r.archVersion, useCases: r.useCases.length, requirements: r.requirements, judge: r.judge, warnings: r.warnings, out: args.includes('--dry-run') ? null : outPath }, null, 1));
  else { console.log(`Traceability: ${r.spec} → ARCHITECTURE.md v${r.archVersion} · ${r.useCases.length} use case(s) · ${live.length} requirement(s)${r.requirements.length !== live.length ? ` (${r.requirements.length - live.length} navigation step(s) not traced)` : ''}`);
    console.log(`  ✅ ${n('Covered')} covered · ⚠️ ${n('Partial')} partial · ❌ ${n('Not Covered')} gaps${n('Undecided') ? ` · ❔ ${n('Undecided')} undecided` : ''} — classified by ${r.judge.engine}${r.judge.note ? ` · ${r.judge.note}` : ''}`);
    if (r.warnings.length) console.log(`  warnings: ${r.warnings.join('; ')}`);
    console.log(args.includes('--dry-run') ? `  (dry run — nothing written)` : `  Report: ${path.relative(root, outPath)}`); }
})();
