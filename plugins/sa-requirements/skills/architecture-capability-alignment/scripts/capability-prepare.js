#!/usr/bin/env node
// capability-prepare.js — the PO Spec mapped onto the BIAN Service Landscape v14.0.0, cut by code and judged level by level.
//
//   bun capability-prepare.js <project-root> [--spec PRODUCT_OWNER_SPEC.md] [--judge agent|typesafe|clef] [--out BIAN_ALIGNMENT.md]
//                       [--today YYYY-MM-DD] [--json] [--dry-run] [--sa-skills <sa-skills plugin dir>]
//
// The alignment skill ran three nested classifications in session — 8 Business Areas, then the Business Domains of the
// impacted areas (of 43), then the Service Domains of the impacted domains (of 341), each 🟢 / 🟡 / ⚪ — reading one area
// file at a time so the context held. The corpus is bundled and identical for every project, which makes it the ideal
// shape for a typed question: a closed registry, a published role definition per Service Domain, and one initiative.
//
// Stage 1 (code): the initiative brief from the spec (problem statement, objectives, use cases, constraints — the
// business "what", cut to a few KB), the registry (bian-registry.json: DOM / CAP / BIAN ids) and every area file
// parsed for its Service Domains (name, id, "What it does.", example, API). Stage 2 (scripts/judge.js): three rounds,
// each over the survivors of the last — one Choice per Business Area {impacted, partial, not_applicable}, one per
// Business Domain of a 🟢 / 🟡 area, one per Service Domain of a 🟢 / 🟡 domain {realizes, consumes, not_claimed} with
// BIAN's role definition as the state and the claim test as the criteria (the definition, never the name). The brief
// travels once per request as shared state. A pair or a role the judge has not answered (a pending worksheet, an engine
// error, an unanswered item, no judge installed) is undecided: never a claim, never dismissed, counted in the report with
// the worksheet to answer. Stage 3 (code): BIAN_ALIGNMENT.md in the report v3.0 shape — the Summary, the Diagram ID Segments looked
// up in the registry (never composed), the per-area analysis with every roster and every definition verbatim, the API
// Surface, and the judge's reading on every line it decided. What is prose in the template — a rationale, an evidence
// quote chosen for its meaning — is not composed: the rationale prints the judgement and its confidence, the evidence
// prints the use cases whose claim the judge accepted.
'use strict';
const fs = require('fs');
const path = require('path');
const { parseSpec } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'po-spec.js'));

// This skill ships in sa-requirements; the judge (scripts/judge.js) and the Design Language Standard's registry are
// sa-skills'. sa-skills is found by `--sa-skills <dir>`, SA_SKILLS_DIR, the repo layout (plugins/sa-requirements inside
// sa-skills) or Claude Code's install registry. Without it the alignment still runs and writes the report shape, but
// every claim is undecided and the report says no judge was available — nothing is ranked in its place.
const MARKETPLACE = 'shadowx4fox-solution-architect-marketplace';
function saSkillsDir() {
  const holds = (d) => !!d && fs.existsSync(path.join(d, 'scripts', 'judge.js'));
  const flag = process.argv.includes('--sa-skills') ? process.argv[process.argv.indexOf('--sa-skills') + 1] : null;
  for (const d of [flag, process.env.SA_SKILLS_DIR, path.join(__dirname, '..', '..', '..', '..', '..')]) if (holds(d)) return path.resolve(d);
  const claude = process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(require('os').homedir(), '.claude');
  const resolver = path.join(claude, 'plugins', 'marketplaces', MARKETPLACE, 'scripts', 'plugin-root.ts');
  if (!fs.existsSync(resolver)) return null;
  const r = require('child_process').spawnSync(process.execPath, [resolver, '--quiet'], { encoding: 'utf8' });
  const out = (r.stdout || '').trim();
  return r.status === 0 && holds(out) ? out : null;
}
const SA_SKILLS = saSkillsDir();
// without sa-skills there is no judge: every claim is undecided and the report names why
const NO_JUDGE = 'no judge was available — the judge ships in sa-skills (scripts/judge.js), which is not installed; every claim is undecided — pass --sa-skills <dir> or set SA_SKILLS_DIR';
const JUDGE = SA_SKILLS ? require(path.join(SA_SKILLS, 'scripts', 'judge.js')) : null;

// the BIAN landscape and the design language's DOM / CAP registry: an institution pack's, else the base's own (scripts/shared/packs.js);
// without sa-skills, the corpus bundled beside this skill
const PACKS = SA_SKILLS ? require(path.join(SA_SKILLS, 'scripts', 'shared', 'packs.js')) : null;
const SKILL = path.join(__dirname, '..'), CORPUS = path.join(SKILL, 'references', 'bian-v14');   // BIAN's open corpus — the registry may name a pack's instead
// the capability framework (sa-skills' scripts/shared/frameworks.js): BIAN by default — the corpus above, its wording and
// its report unchanged — or another framework's corpus, described by its framework.json (levels, id label, report file)
const FRAMEWORKS = SA_SKILLS ? require(path.join(SA_SKILLS, 'scripts', 'shared', 'frameworks.js')) : null;
function frameworkOf(root, id) {
  const local = (dir) => { try { return Object.assign(JSON.parse(read(path.join(dir, 'framework.json'))), { dir }); } catch (e) { return null; } };
  const want = id ? String(id).toUpperCase() : (FRAMEWORKS && root ? (FRAMEWORKS.declared(root).id || 'BIAN') : 'BIAN');
  if (want === 'NONE') throw new Error('the project declares no capability framework — nothing to align (declare one with frameworks.js --declare <id>)');
  const all = FRAMEWORKS ? FRAMEWORKS.frameworks({ project: root }).frameworks : { BIAN: local(CORPUS), 'CROSS-INDUSTRY': local(path.join(SKILL, 'references', 'cross-industry')) };
  const F = all[want]; if (!F) throw new Error(`unknown framework ${want} — one of ${Object.keys(all).join(', ')}`);
  return Object.assign({ headings: { area: 'Business Area', domain: 'Business Domain', unit: 'Service Domain' }, id_label: 'BIAN id', noun: 'banking' }, F);
}
const DL = PACKS ? PACKS.designLanguageDir() : null;
const REGISTRY = DL ? path.join(DL, 'bian-registry.json') : null;  // optional: the Design Language Standard's DOM / CAP codes; absent, no Diagram ID Segments
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ── Stage 1a: the corpus ─────────────────────────────────────────────────────────────────────────
function loadCorpus(F) {
  F = F || frameworkOf(null, 'BIAN'); const DIR = F.dir, H = F.headings, esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!fs.existsSync(path.join(DIR, F.index || 'llms-bian.txt'))) throw new Error(`Bundled ${F.id || 'BIAN'} corpus missing from plugin. Reinstall sa-requirements.`);
  const codes = F.id === 'BIAN' && REGISTRY && fs.existsSync(REGISTRY) ? JSON.parse(read(REGISTRY)) : null;
  const areas = [], fileRe = new RegExp(F.files || '^BIAN-v14-\\d-.*\\.md$'), domRe = new RegExp('^##\\s+' + esc(H.domain) + ':\\s*(.+)$'), unitRe = new RegExp('^###\\s+' + esc(H.unit) + ':\\s*(.+)$'), idRe = new RegExp('\\*\\*' + esc(F.id_label) + ':\\*\\*\\s*`?([^`\\n]+)`?');
  fs.readdirSync(DIR).filter((f) => fileRe.test(f)).sort((a, b) => Number((a.match(/-(\d+)-/) || [])[1]) - Number((b.match(/-(\d+)-/) || [])[1])).forEach((f) => {
    const src = read(path.join(DIR, f)), lines = src.split('\n');
    const areaName = plain((src.match(/^#\s+(.+)$/m) || [])[1] || f).replace(new RegExp('^.*' + esc(H.area) + ':\\s*', 'i'), '').replace(/\s*\(BIAN.*$/, '').replace(/^BIAN.*?—\s*/, '').trim();
    const area = { name: areaName, file: f, n: Number((f.match(/-(\d+)-/) || [])[1]), domains: [] };
    let dom = null;
    for (let i = 0; i < lines.length; i++) {
      const d = lines[i].match(domRe); if (d) { dom = { name: plain(d[1]), services: [] }; area.domains.push(dom); continue; }
      const s = lines[i].match(unitRe); if (!s || !dom) continue;
      let j = i + 1; const body = []; while (j < lines.length && !/^###?\s/.test(lines[j])) { body.push(lines[j]); j++; }
      const b = body.join('\n');
      const sd = { name: plain(s[1]), bian_id: (b.match(idRe) || [])[1] || null, what: plain((b.match(/\*\*What it does\.\*\*\s*([^\n]+)/) || [])[1] || ''), example: plain((b.match(/\*\*Example of use\.\*\*\s*([^\n]+)/) || [])[1] || ''), api: (b.match(/\[Specification\]\(([^)]+)\)/) || [])[1] || null, api_file: (b.match(/\*\*API\.\*\*\s*Published as\s*`([^`]+)`/) || [])[1] || null };
      dom.services.push(sd); i = j - 1;
    }
    areas.push(area);
  });
  // the registry's codes onto the parsed areas, by name
  if (codes) (codes.areas || []).forEach((ca) => { const a = areas.find((x) => norm(x.name) === norm(ca.name)); if (!a) return; a.dom = ca.dom; a.bian_id = ca.bian_id; (ca.business_domains || []).forEach((cd) => { const d = a.domains.find((x) => norm(x.name) === norm(cd.name)); if (d) { d.cap = cd.cap; d.bian_id = cd.bian_id; } }); });
  return { areas, codes_available: !!codes, release: codes ? codes.release : F.id === 'BIAN' ? '14.0.0' : (F.commit || F.version || '').slice(0, 12), framework: F };
}

// ── Stage 1b: the initiative brief — the business "what", cut to a few KB ────────────────────────
function sectionText(text, anchor, headingRe, max = 2400) {
  const lines = text.split('\n'); let s = lines.findIndex((l) => new RegExp(`<!--\\s*SECTION:\\s*${anchor}\\s*-->`).test(l)); if (s < 0) s = lines.findIndex((l) => /^#{2,3}\s/.test(l) && headingRe.test(plain(l)));
  if (s < 0) return '';
  const level = (lines[s].match(/^#+/) || ['##'])[0].length; const out = [];
  for (let i = s + 1; i < lines.length; i++) { const h = lines[i].match(/^(#{1,6})\s/); if (h && h[1].length <= level) break; const t = plain(lines[i]); if (t && !/^\|/.test(lines[i].trim())) out.push(t); }
  return out.join(' ').slice(0, max);
}
function briefOf(text) {
  const spec = parseSpec(text);
  return {
    problem: sectionText(text, 'Problem Statement', /Problem Statement|Declaraci[óo]n del Problema/i, 2000),
    objectives: sectionText(text, 'Primary Business Goals', /Primary Business Goals|Objetivos Principales/i, 1600),
    use_cases: spec.useCases.map((u) => ({ id: u.id, name: u.name, description: plain((u.fields.description || []).join(' ')).slice(0, 320), actors: plain((u.fields.actor || []).join(' ')).slice(0, 160) })),
    regulatory_and_integration_constraints: [sectionText(text, 'Regulatory and Compliance Requirements', /Regulatory|Regulatori/i, 900), sectionText(text, 'Integration Constraints', /Integration Constraints|Restricciones de Integraci/i, 700)].filter(Boolean).join(' '),
    out_of_scope: sectionText(text, 'Out of Scope', /Out of Scope|Fuera de Alcance/i, 600),
  };
}
const briefText = (b) => [b.problem, b.objectives, ...b.use_cases.map((u) => `${u.name} ${u.description}`), b.regulatory_and_integration_constraints].join(' ');
// The definitions are English and Jev's primary language is English: a brief in another language is the one state this
// script sends that mixes languages, and it is where the judge separated worst on the reference (precision 0.17 → 0.42
// at the 0.5 cut with an English brief, same recall). The language is read from function words, not guessed from the
// project's DOC_LANGUAGE — the brief may be the session's English capability list on a Spanish project.
const FUNCTION_WORDS = { en: /\b(?:the|and|of|to|with|from|for|that|this|is|are|on|by|when|customer|bank)\b/gi, es: /\b(?:el|la|los|las|de|del|y|con|para|que|es|son|en|por|cuando|cliente|banco)\b/gi };
const briefLanguage = (b) => { const t = briefText(b); const n = { en: (t.match(FUNCTION_WORDS.en) || []).length, es: (t.match(FUNCTION_WORDS.es) || []).length }; return n.en + n.es < 8 ? 'unknown' : n.es > n.en ? 'es' : 'en'; };

// ── Stage 2: one use case against one definition, the hierarchy by code ────────────────────────
// A first cut asked three rounds of three-way Choices — area, domain, service — each against the whole brief (8 KB of
// Spanish) and BIAN's English definitions; the answers came back near-uniform (Cross Channel "partial" at 0.14,
// Customer Workbench "not claimed" at 0.34, Business Development "impacted" at 0.21). The decomposition was wrong: the
// smallest question that carries a claim is one use case against one published definition, and the levels above a
// Service Domain are the registry's, not a judgement. So: one Noul per (use case, Service Domain) — 341 × the use cases,
// a few dozen requests, cached — then one Choice {realizes, consumes} per claimed Service Domain, and the Business
// Domain and Business Area statuses derived bottom-up: 🟢 where a Service Domain is realized, 🟡 where one is only
// consumed, ⚪ otherwise. The skill's "what vs. how" filter is in the question: the initiative's own technology claims
// nothing. An unsettled claim (0.4 < p < 0.75) is printed, never counted.
const WHAT_NOT_HOW = 'Judge the banking capability the use case delivers to the customer or the bank (the "what"), never the technology it is built with: a device database, a replication gateway, a data pipeline, a monitoring tool or a deployment platform named in the use case is how it is built and claims nothing.';
const CLAIM_Q = { id: 'bian-claim', type: 'noul', hi: 0.75, lo: 0.4,
  question: `Does the use case \`item.use_case\` deliver, in whole or in a bounded part, the banking capability BIAN defines in \`item.definition\` — or depend on that capability to work? ${WHAT_NOT_HOW}`,
  criteria: { true: 'What the definition describes is something this use case provides to the customer or the bank, or something it calls on: the capability, not merely a word of its name, is at work in the use case.', false: 'The definition describes a capability this use case neither provides nor depends on; a shared word with the name, or the technology the use case is built with, is not a claim.' } };
const ROLE_Q = { id: 'bian-role', type: 'choice',
  question: `Given the use cases in \`item.use_cases\` that involve the capability BIAN defines in \`item.definition\`: does the initiative realize this Service Domain — build the capability the definition describes, in whole or in a bounded part — or only consume it, calling on a capability the bank or a third party already provides? ${WHAT_NOT_HOW}`,
  criteria: { realizes: 'The initiative builds what the definition describes and delivers it to the customer or the bank: for example, a facility on the customer\'s own device that gives local access to the bank\'s products realizes a definition about a client-device-resident facility.', consumes: 'The initiative depends on what the definition describes but does not build it: an existing account, an authentication service, a payment rail, a record kept elsewhere.' } };
// another framework asks the same two questions in its own words — BIAN keeps the wording it was measured with
function questionsOf(F) {
  if (!F || F.id === 'BIAN') return { claim: CLAIM_Q, role: ROLE_Q };
  const what = `Judge the ${F.noun || 'business'} capability the use case delivers to the customer or the organization (the "what"), never the technology it is built with: a device database, a replication gateway, a data pipeline, a monitoring tool or a deployment platform named in the use case is how it is built and claims nothing.`;
  const unit = F.headings.unit;
  return {
    claim: Object.assign({}, CLAIM_Q, { id: 'capability-claim', question: `Does the use case \`item.use_case\` deliver, in whole or in a bounded part, the ${F.noun || 'business'} capability ${F.name} defines in \`item.definition\` — or depend on that capability to work? ${what}`,
      criteria: { true: 'What the definition describes is something this use case provides to the customer or the organization, or something it calls on: the capability, not merely a word of its name, is at work in the use case.', false: CLAIM_Q.criteria.false } }),
    role: Object.assign({}, ROLE_Q, { id: 'capability-role', question: `Given the use cases in \`item.use_cases\` that involve the capability ${F.name} defines in \`item.definition\`: does the initiative realize this ${unit} — build the capability the definition describes, in whole or in a bounded part — or only consume it, calling on a capability the organization or a third party already provides? ${what}`,
      criteria: { realizes: 'The initiative builds what the definition describes and delivers it to the customer or the organization.', consumes: 'The initiative depends on what the definition describes but does not build it: an existing account, an authentication service, a payment rail, a record kept elsewhere.' } }),
  };
}
const plural = (x) => (/y$/.test(x) ? x.slice(0, -1) + 'ies' : x + 's');
const STATUS = { impacted: '🟢 Impacted', partial: '🟡 Partial', not_applicable: '⚪ Not Applicable', undecided: '❔ Undecided' };
const statusText = (c) => STATUS[c].replace(/^\S+\s/, '');

async function align(root, opts = {}) {
  root = path.resolve(root);
  const specPath = path.resolve(root, opts.spec || 'PRODUCT_OWNER_SPEC.md');
  if (!fs.existsSync(specPath)) throw new Error(`no PO Spec at ${path.relative(root, specPath)} — run /sa-requirements:architecture-readiness first`);
  // `--brief <json>`: the Step 3 capability list the session writes — in English, the definitions' language — instead of the
  // brief cut from the spec; shape { problem, objectives, use_cases: [{ id, name, description, actors? }] }. Jev's primary
  // language is English and a Spanish brief against English definitions is where it separates worst.
  const F = frameworkOf(root, opts.framework), Q = questionsOf(F), corpus = loadCorpus(F), text = read(specPath), brief = opts.brief ? JSON.parse(read(path.resolve(root, opts.brief))) : briefOf(text);
  // the pairs walk the use cases, and also the objectives and the constraints as two more units — the gold's Regulatory
  // Compliance (the 12-month retention obligation) and Payee Management (the contact list) live in those, not in a use case
  const ucs = [...brief.use_cases.filter((u) => u.name), ...(brief.objectives ? [{ id: 'OBJ', name: 'Business objectives', description: String(brief.objectives).slice(0, 900) }] : []), ...(brief.regulatory_and_integration_constraints ? [{ id: 'CONSTRAINTS', name: 'Regulatory and integration constraints', description: String(brief.regulatory_and_integration_constraints).slice(0, 900) }] : [])];
  // a Service Domain is judged against its definition, never its name: one with no definition in the landscape in force (the open
  // corpus carries only the published APIs' descriptions) is left out and counted, and the report says where the full text comes from
  const all = corpus.areas.flatMap((a) => a.domains.flatMap((d) => d.services.map((s) => ({ a, d, s }))));
  const sds = all.filter(({ s }) => s.what), undefinedSds = all.length - sds.length;
  const engine = !JUDGE ? 'none' : opts.engine || JUDGE.engineInForce();
  const common = { engine, root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache, chunk: opts.chunk || 40 };
  const judge = { engine, rounds: [], note: SA_SKILLS ? null : NO_JUDGE, unsettled: [], undecided: { pairs: 0, by_use_case: {}, roles: [] }, worksheets: [], brief_language: briefLanguage(brief), brief_source: opts.brief ? path.relative(root, path.resolve(root, opts.brief)) : 'cut from the spec', warnings: SA_SKILLS ? [] : [NO_JUDGE] };
  if (undefinedSds) judge.warnings.push(F.id === 'BIAN' ? `${undefinedSds} of ${all.length} Service Domains carry no definition in the BIAN landscape in force and were not judged — an institution pack's full Service Landscape supplies them (docs/INSTITUTION_PACKS.md)` : `${undefinedSds} of ${all.length} ${plural(F.headings.unit)} carry no definition in ${F.name} and were not judged`);
  if (judge.brief_language !== 'en' && JUDGE) judge.warnings.push(`the brief reads as ${judge.brief_language === 'es' ? 'Spanish' : 'not English'} against ${F.id === 'BIAN' ? 'BIAN\'s' : F.name + '\'s'} English definitions — the judge separates worst on a mixed-language state (precision 0.17 vs 0.42 at the 0.5 cut on the reference); write the Step 3 capability list in English and pass it as --brief`);
  // an unanswered item comes back absent from the answers: the caller marks it undecided, never fills it
  const ask = async (spec, items, extra = {}) => { if (!items.length || !JUDGE) return {}; const res = await JUDGE.judge(spec, items, { ...common, ...extra });
    if (res.pending) { judge.worksheets.push(res.pending); judge.rounds.push({ spec: spec.id, asked: items.length, pending: true }); return {}; }
    judge.engine = res.engine; judge.rounds.push({ spec: spec.id, asked: items.length, requests: res.requests || 0, cached: res.cached || 0, ...(res.unanswered && res.unanswered.length ? { unanswered: res.unanswered.length } : {}) }); return res.answers; };
  all.forEach(({ s }) => { s.claims = []; s.verdict = null; s.undecided = []; });   // every Service Domain, judged or not: the report walks them all
  try {
    // round 1 — every (use case, Service Domain) pair, the smallest state that carries a claim
    const pairs = ucs.flatMap((u) => sds.map((x) => ({ u, x })));
    const items = pairs.map(({ u, x }, i) => ({ id: `c${i}`, state: { use_case: { id: u.id, name: u.name, description: u.description }, definition: x.s.what, service_domain: x.s.name } }));
    const ans = await ask(Q.claim, items);
    pairs.forEach(({ u, x }, i) => { const a = ans[`c${i}`];
      if (!a) { x.s.undecided.push(u.id); judge.undecided.pairs++; judge.undecided.by_use_case[u.id] = (judge.undecided.by_use_case[u.id] || 0) + 1; return; }   // not judged: neither a claim nor a dismissal
      if (a.p >= Q.claim.hi) x.s.claims.push({ uc: u.id, p: +a.p.toFixed(2), by: a.by }); else if (a.p >= Q.claim.lo) judge.unsettled.push({ uc: u.id, service: x.s.name, p: +a.p.toFixed(2), what: x.s.what }); });
    // round 2 — realizes or consumes, only for the claimed Service Domains
    const claimed = sds.filter(({ s }) => s.claims.length);
    const rItems = claimed.map(({ s }, i) => ({ id: `r${i}`, state: { service_domain: s.name, definition: s.what, use_cases: s.claims.map((c) => { const u = ucs.find((x) => x.id === c.uc); return { id: u.id, name: u.name, description: u.description }; }) } }));
    const rAns = await ask(Q.role, rItems);
    claimed.forEach(({ s }, i) => { const a = rAns[`r${i}`];
      if (!a) { s.verdict = { choice: 'undecided', by: 'undecided', confidence: null, settled: true }; judge.undecided.roles.push(s.name); }   // claimed, role not judged
      else { s.verdict = { choice: a.choice, by: a.by, confidence: a.confidence != null ? +a.confidence.toFixed(2) : null, settled: a.confidence == null || a.confidence >= 0.4 }; if (!s.verdict.settled) { s.verdict.judged = s.verdict.choice; s.verdict.choice = 'consumes'; } }
      s.evidence = s.claims.map((c) => c.uc); });
  } catch (e) { if (e.name !== 'JudgeError') throw e; judge.note = e.message;
    sds.forEach(({ s }) => { if (!s.claims.length && !s.undecided.length) { s.undecided = ucs.map((u) => u.id); } });   // the round that threw answered nothing it could keep
    judge.undecided.pairs = sds.reduce((n, { s }) => n + s.undecided.length, 0); }
  if (judge.worksheets.length) judge.note = [judge.note, `answer the worksheet${judge.worksheets.length > 1 ? 's' : ''} ${judge.worksheets.join(', ')} and re-run`].filter(Boolean).join(' · ');
  // the levels above a Service Domain are the registry's: derived, never judged — a level with nothing claimed and a pair
  // still unanswered is undecided, not ⚪ (a claimed Service Domain whose role is undecided makes its domain at least 🟡)
  corpus.areas.forEach((a) => { a.domains.forEach((d) => { const v = d.services.map((s) => s.verdict && s.verdict.choice); d.verdict = { choice: v.includes('realizes') ? 'impacted' : v.some(Boolean) ? 'partial' : d.services.some((s) => s.undecided.length) ? 'undecided' : 'not_applicable', by: 'derived', confidence: null, settled: true }; }); const v = a.domains.map((d) => d.verdict.choice); a.verdict = { choice: v.includes('impacted') ? 'impacted' : v.includes('partial') ? 'partial' : v.includes('undecided') ? 'undecided' : 'not_applicable', by: 'derived', confidence: null, settled: true }; });
  return { root, spec: path.relative(root, specPath), specVersion: parseSpec(text).version, brief, corpus, judge, today: opts.today || new Date().toISOString().slice(0, 10), pluginVersion: (() => { try { return JSON.parse(read(path.join(SKILL, '..', '..', '.claude-plugin', 'plugin.json'))).version; } catch { return 'unknown'; } })() };
}

// ── Stage 3: the report, v3.0 ────────────────────────────────────────────────────────────────────
const undecidedNote = (r) => { const u = r.judge.undecided; if (!u.pairs && !u.roles.length) return ''; return r.judge.engine === 'none' ? ' **No judge was available: every claim is undecided — see § Undecided.**' : ` **${u.pairs} pair(s) and ${u.roles.length} role(s) are undecided — the judge has not answered them; see § Undecided.**`; };
const conf = (v) => (v.by !== 'undecided' && v.by !== 'inherited' && v.by !== 'derived' ? ` <!-- ${v.by}${v.confidence != null ? ` ${v.confidence}` : ''}${v.settled === false ? ` — unsettled, judged ${v.judged}` : ''} -->` : '');
const unsettledNote = (v) => (v.settled === false ? ` _(the realizes / consumes reading is unsettled: ${v.judged} at ${v.confidence}; recorded as consumes)_` : '');
function report(r) {
  const F = r.corpus.framework || { id: 'BIAN' };
  if (F.id !== 'BIAN') return relabel(reportBody(r), r);
  return reportBody(r);
}
function reportBody(r) {
  const touched = (x) => x.verdict.choice === 'impacted' || x.verdict.choice === 'partial';
  const A = r.corpus.areas, live = touched, domainsOf = (a) => a.domains.filter(touched), sdsOf = (d) => d.services.filter((s) => s.verdict && s.verdict.choice !== 'not_claimed');
  const count = (c) => A.filter((a) => a.verdict.choice === c).length, nd = A.flatMap(domainsOf).length, ns = A.flatMap((a) => a.domains).flatMap(sdsOf).length;
  const out = [`<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->`, `<!-- BIAN_RELEASE: ${r.corpus.release} -->`, `<!-- BIAN_SOURCE: bundled (sa-requirements v${r.pluginVersion}) -->`, `<!-- DESIGN_LANGUAGE_CODES: ${r.corpus.codes_available ? 'present' : 'absent'} -->`, `<!-- PO_SPEC_SOURCE: ${r.spec} -->`, `<!-- GENERATED: ${r.today} -->`, `<!-- CLASSIFIED_BY: ${r.judge.engine} -->`, '',
    `# BIAN Capability Alignment <!-- SECTION: BIAN Capability Alignment -->`, '', `**PO Spec**: ${r.spec}${r.specVersion ? ` (v${r.specVersion})` : ''}`, `**Capability model**: BIAN Service Landscape v${r.corpus.release}, as published — 8 Business Areas · 43 Business Domains · 341 Service Domains`, `**Generated**: ${r.today}`, `**Status**: Generated — review with the architecture team before design begins.${undecidedNote(r)}`, '',
    `> BIAN is reproduced unadapted: nothing renamed, merged, added or dropped. Every role definition below is quoted from the published landscape.`, '', '---', '',
    `## Summary <!-- SECTION: Summary -->`, '', `**Business Areas**: 8 · **🟢**: ${count('impacted')} · **🟡**: ${count('partial')} · **⚪**: ${count('not_applicable')}${count('undecided') ? ` · **❔**: ${count('undecided')}` : ''} · **Business Domains impacted**: ${nd} of 43 · **Service Domains impacted**: ${ns} of 341`, '',
    `| # | Business Area | \`DOM\` | Status | Business Domains Impacted | Service Domains Impacted |`, `|---|---|---|---|---|---|`];
  A.forEach((a) => out.push(`| ${a.n} | ${a.name} | ${a.dom ? `\`${a.dom}\`` : '—'} | ${STATUS[a.verdict.choice]}${conf(a.verdict)} | ${domainsOf(a).length}/${a.domains.length} | ${a.domains.flatMap(sdsOf).length} |`));
  const realized = A.flatMap((a) => a.domains.flatMap((d) => sdsOf(d).filter((s) => s.verdict.choice === 'realizes').map((s) => ({ a, d, s }))));
  out.push('', realized.length ? `The initiative **realizes** capability in ${[...new Set(realized.map((x) => x.a.name))].map((n) => `\`${n}\``).join(', ')}: ${realized.map((x) => `\`${x.s.name}\``).join(', ')}. Everything else it **consumes**.` : `The initiative **realizes** no Service Domain of the landscape as judged; every impacted Service Domain is **consumed**.`, '', '---', '');
  const ud = r.judge.undecided; if (ud.pairs || ud.roles.length) { out.push(`## Undecided <!-- SECTION: Undecided -->`, '', r.judge.engine === 'none' ? `${NO_JUDGE}.` : `The judge has not answered these yet — they are neither claims nor dismissals. ${r.judge.worksheets.length ? `Answer ${r.judge.worksheets.map((f) => `\`${f}\``).join(', ')} and re-run.` : r.judge.note || ''}`, '');
    if (ud.pairs) out.push(`- **${ud.pairs} use-case × Service Domain pair(s)** not judged — ${Object.entries(ud.by_use_case).map(([u, n]) => `${u}: ${n}`).join(' · ') || 'every pair'}`);
    if (ud.roles.length) out.push(`- **Realizes / consumes not judged** for ${ud.roles.length} claimed Service Domain(s): ${ud.roles.join(', ')}`);
    out.push('', '---', ''); }
  if (r.judge.unsettled.length) { const byArea = new Map(); r.judge.unsettled.forEach((u) => { const hit = A.flatMap((a) => a.domains.flatMap((d) => d.services.filter((s) => s.name === u.service).map((s) => ({ a, d, s })))).find(Boolean); if (!hit) return; const k = `${hit.a.name} › ${hit.d.name}`; (byArea.get(k) || byArea.set(k, []).get(k)).push(u); });
    out.push(`## Candidates Below the Cut <!-- SECTION: Candidates Below the Cut -->`, '', `The judge read these ${r.judge.unsettled.length} use-case × Service Domain pairs between 0.4 and 0.75: **not claimed**, printed for review against the definition. A row above the cut (≥ 0.75) would have been a claim; run \`--verify <a reviewed BIAN_ALIGNMENT.md>\` to measure the cut before lowering it.`, '');
    [...byArea].sort(([, x], [, y]) => Math.max(...y.map((u) => u.p)) - Math.max(...x.map((u) => u.p))).forEach(([k, us]) => { out.push(`- **${k}**`); us.sort((x, y) => y.p - x.p).forEach((u) => out.push(`  - ${u.service} ← ${u.uc} at ${u.p}: "${u.what.slice(0, 140)}"`)); });
    out.push('', '---', ''); }
  if (r.corpus.codes_available) { out.push(`## Diagram ID Segments <!-- SECTION: Diagram ID Segments -->`, '', 'For every impacted Business Domain, the `DOM` and `CAP` segments a C4 view will carry under the SA Design Language Standard — `<LSC>-<DOM>-<CAP>-<SUBJ>-<LVL>-<NNN>`:', '', `| Business Area | \`DOM\` | Business Domain | \`CAP\` | BIAN id | Status |`, `|---|---|---|---|---|---|`);
    A.forEach((a) => domainsOf(a).forEach((d) => out.push(`| ${a.name} | \`${a.dom || '?'}\` | ${d.name} | \`${d.cap || '?'}\` | \`${d.bian_id || '?'}\` | ${d.verdict.choice === 'impacted' ? '🟢' : '🟡'} |`)));
    out.push('', 'Every value is looked up in `bian-registry.json`, never composed. A `CAP` has four letters; a `DOM` has three.', '', '**Service Domains do not appear here.** Below the Business Domain, BIAN defines 341 Service Domains, and a Service Domain is a tag and a register column, never an ID segment (`llms-rules.txt` §1.3).', '', '`LSC` (the owning legal entity), `SUBJ` (the system code) and `NNN` are **assigned by the diagram register, never chosen here** — `SUBJ` is minted only when the CMDB business-application record is created.', '', '---', ''); }
  out.push(`## Per-Area Analysis <!-- SECTION: Per-Area Analysis -->`, '');
  A.forEach((a) => {
    const realizedHere = a.domains.flatMap(sdsOf).filter((s) => s.verdict.choice === 'realizes').length, consumedHere = a.domains.flatMap(sdsOf).length - realizedHere;
    out.push(`### ${a.n}. ${a.name} — ${STATUS[a.verdict.choice]}`, '', `**Rationale**: ${a.verdict.choice === 'undecided' ? `Undecided — no Service Domain of this area is claimed yet and ${a.domains.reduce((n, d) => n + d.services.reduce((m, s) => m + s.undecided.length, 0), 0)} use-case × Service Domain pair(s) are not judged (see § Undecided).` : a.verdict.choice === 'not_applicable' ? `No Service Domain of this area is claimed by any use case (${a.domains.reduce((n, d) => n + d.services.length, 0)} definitions judged).` : `${statusText(a.verdict.choice)} because ${realizedHere ? `${realizedHere} Service Domain(s) of this area ${realizedHere === 1 ? 'is' : 'are'} realized` : `${consumedHere} Service Domain(s) of this area ${consumedHere === 1 ? 'is' : 'are'} consumed and none realized`}; ${domainsOf(a).length} of ${a.domains.length} Business Domains touched. Every claim below names the use case that makes it and the judge's probability.`}`, '');
    const undecidedDs = a.domains.filter((d) => d.verdict.choice === 'undecided').map((d) => d.name);
    if (!live(a)) { out.push(`**Impacted Business Domains**: _None._`, '', ...(undecidedDs.length ? [`_(undecided: ${undecidedDs.join(', ')})_`, ''] : []), `_(not impacted: ${a.domains.filter((d) => d.verdict.choice === 'not_applicable').map((d) => d.name).join(', ') || 'none'})_`, '', '---', ''); return; }
    const ds = domainsOf(a);
    out.push(`**Impacted Business Domains** (${ds.length} of ${a.domains.length}):`, '');
    ds.forEach((d) => out.push(`- ${d.verdict.choice === 'impacted' ? '🟢' : '🟡'} **${d.name}**${d.cap ? ` \`${d.cap}\`` : ''} — derived from its Service Domains; ${sdsOf(d).length} claimed${sdsOf(d).length ? `: ${sdsOf(d).map((s) => s.name).join(', ')}` : ''}${unsettledNote(d.verdict)}`));
    out.push('', ...(undecidedDs.length ? [`_(undecided: ${undecidedDs.join(', ')})_`, ''] : []), `_(not impacted: ${a.domains.filter((d) => d.verdict.choice === 'not_applicable').map((d) => d.name).join(', ') || 'none'})_`, '');
    ds.forEach((d) => { const ss = sdsOf(d); if (!ss.length) return;
      out.push(`**Impacted Service Domains** (${ss.length}) — under \`Business Domain: ${d.name}\`:`, '', `| Service Domain | BIAN id | Realizes / Consumes | PO Spec § | Role definition (BIAN, verbatim) |`, `|---|---|---|---|---|`);
      ss.forEach((s) => out.push(`| ${s.name} | \`${s.bian_id || '?'}\` | ${s.verdict.choice === 'realizes' ? '**Realizes**' : s.verdict.choice === 'undecided' ? '❔ Undecided' : 'Consumes'}${conf(s.verdict)} | § 4 (${(s.claims || []).map((c) => `${c.uc} ${c.p}`).join(', ')}) | "${s.what.replace(/\|/g, '\\|')}" |`));
      const uns = r.judge.unsettled.filter((u) => d.services.some((s) => s.name === u.service)); if (uns.length) { out.push('', `**Unsettled claims** — between 0.4 and 0.75: printed, not counted; review against the definition:`, ''); uns.forEach((u) => out.push(`- ${u.service} ← ${u.uc} at ${u.p}: "${u.what.slice(0, 160)}"`)); }
      out.push(''); });
    out.push('---', '');
  });
  const withApi = A.flatMap((a) => a.domains.flatMap(sdsOf)).filter((s) => s.api);
  out.push(`## API Surface <!-- SECTION: API Surface -->`, '', withApi.length ? 'Published BIAN semantic APIs for the impacted Service Domains:' : '_No impacted Service Domain carries a published semantic API._', '');
  if (withApi.length) { out.push(`| Service Domain | BIAN id | Specification |`, `|---|---|---|`); withApi.forEach((s) => out.push(`| ${s.name} | \`${s.bian_id}\` | [${s.api_file || 'Specification'}](${s.api}) |`)); out.push(''); }
  out.push('---', '', `## Next Steps <!-- SECTION: Next Steps -->`, '', '1. Review the impacted Service Domains with the architecture team — confirm each claim matches the initiative\'s actual scope; every judged line carries the model and its confidence in a comment.', '2. Retrieve the published specifications listed in § API Surface before designing equivalent contracts.', '3. Run `/sa-skills:architecture-docs` to begin architecture design. Workflow 1 Step 0.3 (BIAN Alignment Gate) will pass, and this report\'s Summary and impacted-capability lists are lifted into `docs/01-system-overview.md` § 1.5.', '', 'Gate comment `architecture-docs` will embed:', '', '```markdown', `<!-- BIAN_ALIGNMENT_GATE: PASSED (ref: BIAN_ALIGNMENT.md, ${r.today}) -->`, `<!-- BIAN_ALIGNMENT_SOURCE: BIAN_ALIGNMENT.md -->`, '```', '', '---', '',
    `## How this Report Was Generated <!-- SECTION: How this Report Was Generated -->`, '', `| Input | Source |`, `|---|---|`, `| Business requirements | \`${r.spec}\` — the problem statement, objectives, use cases and constraints, cut by code into the initiative brief |`, `| Initiative brief | ${r.judge.brief_source} — read as ${r.judge.brief_language}${r.judge.warnings.length ? ' ⚠️ not the definitions\' language; see the run summary' : ''} |`, `| Capability model | BIAN Service Landscape v${r.corpus.release}, bundled at \`skills/architecture-capability-alignment/references/bian-v14/\` |`, `| Role definitions, examples of use, API links | The same corpus, quoted verbatim |`, `| \`DOM\` / \`CAP\` codes | ${r.corpus.codes_available ? '`skills/architecture-docs/references/design-language/bian-registry.json` — the SA Design Language Standard\'s closed registry' : 'absent — the standard is not installed; no code was minted'} |`, `| Classification | \`skills/architecture-capability-alignment/scripts/capability-prepare.js\` — three rounds through sa-skills' judge (\`scripts/judge.js\`): ${r.judge.rounds.map((x) => `${x.spec} ${x.asked}`).join(' · ') || 'none'}; engine ${r.judge.engine}${r.judge.note ? ` · ${r.judge.note}` : ''} |`, '',
    'No governance rules, cross-cutting findings or owner counterparts are reported: **BIAN publishes none**, and this skill does not invent any. Regenerate with `/sa-requirements:architecture-capability-alignment` after any PO Spec change.', '');
  return out.join('\n');
}
// a framework other than BIAN: its level names for BIAN's, its counts, its provenance — never inside a quoted definition
function relabel(md, r) {
  const F = r.corpus.framework, H = F.headings, A = r.corpus.areas, nD = A.reduce((n, a) => n + a.domains.length, 0), nU = A.reduce((n, a) => n + a.domains.reduce((m, d) => m + d.services.length, 0), 0);
  const words = (t) => t.replace(/Business Areas/g, plural(H.area)).replace(/Business Area/g, H.area).replace(/Business Domains/g, plural(H.domain)).replace(/Business Domain/g, H.domain).replace(/Service Domains/g, plural(H.unit)).replace(/Service Domain/g, H.unit).replace(/BIAN id/g, F.id_label).replace(/of 43\b/g, `of ${nD}`).replace(/of 341\b/g, `of ${nU}`).replace(/Role definition \(BIAN, verbatim\)/g, `Definition (${F.source}, verbatim)`);
  const outside = (line) => line.split(/("[^"]*")/).map((p, i) => (i % 2 ? p : words(p))).join('');
  const lines = md.split('\n');
  const head = [`<!-- ALIGNMENT_FRAMEWORK: ${F.id} -->`, `<!-- ALIGNMENT_VERSION: 1.0 -->`, `<!-- FRAMEWORK_SOURCE: ${F.source}${F.commit ? ` @ ${F.commit.slice(0, 12)}` : ''} (${F.license}) -->`];
  return lines.filter((l) => !/^<!-- (BIAN_ALIGNMENT_VERSION|BIAN_RELEASE|BIAN_SOURCE|DESIGN_LANGUAGE_CODES):/.test(l)).map((l) => {
    if (/^# BIAN Capability Alignment/.test(l)) return '# Capability Alignment <!-- SECTION: Capability Alignment -->';
    if (/^\*\*Capability model\*\*:/.test(l)) return `**Capability model**: ${F.name} — ${A.length} ${plural(H.area)} · ${nD} ${plural(H.domain)} · ${nU} ${plural(H.unit)}`;
    if (/^> BIAN is reproduced unadapted/.test(l)) return `> ${F.name} is reproduced unadapted from ${F.source}: nothing renamed, merged, added or dropped. Every definition below is quoted from it. ${F.attribution || ''}`.trim();
    if (/^\*\*Business Areas\*\*: 8 ·/.test(l)) return outside(l.replace(': 8 ·', `: ${A.length} ·`));
    if (/^<!-- BIAN_ALIGNMENT_GATE: PASSED/.test(l)) return `<!-- ALIGNMENT_GATE: PASSED (${F.id}, ref: ${F.report}, ${r.today}) -->`;
    if (/^<!-- BIAN_ALIGNMENT_SOURCE:/.test(l)) return `<!-- ALIGNMENT_SOURCE: ${F.report} -->`;
    if (/^## API Surface/.test(l)) return null;
    if (/^2\. Retrieve the published specifications listed in § API Surface/.test(l)) return null;
    if (/^3\. Run `\/sa-skills:architecture-docs`/.test(l)) l = l.replace(/^3\./, '2.');
    if (/^\| Capability model \| BIAN Service Landscape/.test(l)) return `| Capability model | ${F.name}, bundled at \`references/${path.basename(F.dir)}/\` (${F.license}) |`;
    if (/^\| `DOM` \/ `CAP` codes \|/.test(l)) return null;
    if (/^No governance rules, cross-cutting findings or owner counterparts are reported: \*\*BIAN publishes none\*\*/.test(l)) return `No governance rules, cross-cutting findings or owner counterparts are reported: **${F.source} publishes none**, and this skill does not invent any. Regenerate with \`/sa-requirements:architecture-capability-alignment --framework ${F.id}\` after any PO Spec change.`;
    return outside(l.replace(/Workflow 1 Step 0\.3 \(BIAN Alignment Gate\)/, 'Workflow 1 Step 0.3 (Capability Alignment Gate)').replace(/published landscape|the landscape as judged/g, (m) => m.replace('landscape', 'framework')));
  }).filter((l) => l !== null).join('\n').replace(/^_No impacted Service Domain carries a published semantic API\._\n\n|^_No impacted [^\n]* carries a published semantic API\._\n\n/m, '').replace(/^(<!-- PO_SPEC_SOURCE:)/m, `${head.join('\n')}\n$1`);
}

// ── --verify: the claims against an existing report's Service Domain rows, at several cuts ────────
// A BIAN_ALIGNMENT.md written by the session (or reviewed by the architect) is the fixture: every `| Name | \`id\` | Realizes / Consumes |`
// row is a claimed Service Domain. For each cut, recall (gold rows the pairs reach) and precision (distinct Service Domains
// at or above the cut that are gold) — the numbers that make a cut a measure instead of a guess.
function verifyAgainst(r, goldPath) {
  const gold = new Map(); read(goldPath).split('\n').forEach((l) => { const m = l.match(/^\|\s*([^|]+?)\s*\|\s*`?(\d+)`?\s*\|\s*\**(Realizes|Consumes)\**/); if (m) gold.set(m[1].trim(), m[3]); });
  const best = new Map(); r.corpus.areas.forEach((a) => a.domains.forEach((d) => d.services.forEach((s) => { const ps = [...(s.claims || []).map((c) => c.p), ...r.judge.unsettled.filter((u) => u.service === s.name).map((u) => u.p)]; if (ps.length) best.set(s.name, Math.max(...ps)); })));
  const rows = [0.4, 0.5, 0.6, 0.75].map((cut) => { const at = [...best].filter(([, p]) => p >= cut).map(([n]) => n); const hit = at.filter((n) => gold.has(n)); return { cut, claimed: at.length, gold_reached: hit.length, of: gold.size, precision: at.length ? +(hit.length / at.length).toFixed(2) : null, missed: [...gold.keys()].filter((n) => !at.includes(n)) }; });
  return { gold: [...gold.keys()], gold_file: goldPath, cuts: rows, best: [...best].sort((a, b) => b[1] - a[1]).slice(0, 40) };
}

module.exports = { frameworkOf, questionsOf, relabel, loadCorpus, briefOf, briefLanguage, align, report, verifyAgainst, CLAIM_Q, ROLE_Q, SA_SKILLS, REGISTRY, NO_JUDGE };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args.find((a, i) => !a.startsWith('--') && !['--spec', '--judge', '--out', '--today', '--verify', '--brief', '--sa-skills', '--framework'].includes(args[i - 1]));
  if (!root) { console.error('Usage: bun capability-prepare.js <project-root> [--spec PRODUCT_OWNER_SPEC.md] [--brief <capabilities.json, English>] [--judge agent|typesafe|clef] [--framework <BIAN|CROSS-INDUSTRY|a pack id>] [--out <report, default the framework report>] [--today YYYY-MM-DD] [--verify <reviewed BIAN_ALIGNMENT.md>] [--json] [--dry-run] [--sa-skills <dir>]'); process.exit(2); }
  let r; try { r = await align(root, { spec: opt('--spec'), brief: opt('--brief'), engine: opt('--judge'), today: opt('--today'), framework: opt('--framework') }); } catch (e) { console.error('capability-prepare: ' + (e.stack || e.message)); process.exit(2); }
  if (opt('--verify')) { const v = verifyAgainst(r, path.resolve(root, opt('--verify'))); console.error(`verify against ${path.relative(root, v.gold_file)} — ${v.gold.length} Service Domain(s) claimed there:`); v.cuts.forEach((c) => console.error(`   cut ${c.cut}: ${c.claimed} claimed · reaches ${c.gold_reached}/${c.of} of the gold · precision ${c.precision == null ? '—' : c.precision}${c.missed.length ? ` · missed: ${c.missed.join(', ')}` : ''}`)); console.error(`   top pairs: ${v.best.slice(0, 12).map(([n, p]) => `${n} ${p.toFixed(2)}`).join(' · ')}`); }
  const md = report(r), outPath = path.resolve(root, opt('--out') || (r.corpus.framework && r.corpus.framework.report) || 'BIAN_ALIGNMENT.md');
  if (!args.includes('--dry-run')) fs.writeFileSync(outPath, md);
  const A = r.corpus.areas, st = (c) => A.filter((a) => a.verdict.choice === c).map((a) => a.name);
  if (args.includes('--json')) console.log(JSON.stringify({ spec: r.spec, brief: r.brief, judge: r.judge, areas: A.map((a) => ({ name: a.name, dom: a.dom, verdict: a.verdict, domains: a.domains.map((d) => ({ name: d.name, cap: d.cap, verdict: d.verdict, services: d.services.filter((s) => s.verdict).map((s) => ({ name: s.name, bian_id: s.bian_id, verdict: s.verdict, evidence: s.evidence })) })) })), out: args.includes('--dry-run') ? null : outPath }, null, 1));
  else { console.log(`${(r.corpus.framework && r.corpus.framework.id) || 'BIAN'} alignment: ${r.spec} → ${r.corpus.framework && r.corpus.framework.id !== 'BIAN' ? '@' : 'v'}${r.corpus.release} · 🟢 ${st('impacted').join(', ') || '—'} · 🟡 ${st('partial').join(', ') || '—'} · ⚪ ${st('not_applicable').length}`);
    const nd = A.flatMap((a) => a.domains.filter((d) => d.verdict.choice !== 'not_applicable')), ns = A.flatMap((a) => a.domains.flatMap((d) => d.services.filter((s) => s.verdict && s.verdict.choice !== 'not_claimed')));
    const HH = (r.corpus.framework && r.corpus.framework.headings) || { domain: 'Business Domain', unit: 'Service Domain' };
    console.log(`  ${nd.length} ${HH.domain}(s): ${nd.map((d) => d.name).join(', ') || '—'}`); console.log(`  ${ns.length} ${HH.unit}(s): ${ns.map((s) => `${s.name} (${s.verdict.choice})`).join(', ') || '—'}`);
    r.judge.warnings.forEach((w) => console.log(`  ⚠️ ${w}`));
    const u = r.judge.undecided; if (u.pairs || u.roles.length) console.log(`  ❔ undecided: ${u.pairs} pair(s), ${u.roles.length} role(s) — not judged, not counted`);
    console.log(`  classified by ${r.judge.engine} — rounds: ${r.judge.rounds.map((x) => `${x.spec} ${x.asked}`).join(' · ') || 'none'}${r.judge.note ? ` · ${r.judge.note}` : ''}`);
    console.log(args.includes('--dry-run') ? '  (dry run — nothing written)' : `  Report: ${path.relative(root, outPath)}`); }
})();
