#!/usr/bin/env bun
// po-spec-checkability.js — the checkability rule, applied to every requirement of a Product Owner Specification.
//
//   bun po-spec-checkability.js <PRODUCT_OWNER_SPEC.md> [--judge agent|typesafe|clef] [--answers [<file>]]
//                               [--sa-skills <dir>] [--json] [--verify <fixtures.json>]
//
// The rule: every statement that asks something of the system must be checkable by someone who was not in the room.
// Five tests decide it, the same in every section:
//   named       every system, channel, actor or data item is named ("other systems" is not)
//   closed      a list is finished — no "etc.", "among others", "such as", "y otros", "and future channels"
//   dated       anything "later" carries a release or a date
//   observable  it says what can be seen when it is met — a value, a state, a message, a record
//   measurable  a quality word (scalable, extensible, fast, secure, easy …) comes with its trigger, cases and number
// A statement that fails is an aspiration, not a requirement: it moves to `Aspirations` (no penalty, no commitment) or
// is made concrete. Statements under `Aspirations`, `Out of Scope`, the context and the appendix are not requirements.
//
// Three stages, as every judgement in the plugin (scripts/judge.js):
//   1. code splits the requirement sections into statements — a use case into its parts: description, actor, trigger,
//      each step, each alternative flow and edge case, the outcome, the acceptance criteria — and flags a candidate
//      where a word or shape suggests a failing test (the lists below only find candidates; they never decide). A use
//      case missing a part (no actor, no steps, no outcome, nothing to check it by, no trigger) fails by code.
//   2. the judge answers one choice per candidate: `ok`, or the first test it fails. Below 0.6 the answer is unsure —
//      reported, never applied; an unanswered item is undecided — the score is provisional until none is left.
//   3. code scores: a section multiplier the evaluator applies to the section's holistic score — Use Cases: complete
//      use cases ÷ use cases; every other requirement section: 1 − 0.25 × failing statements, at least 0 — and the
//      Ready cap: any failing statement in Business Objectives, Use Cases, Business Constraints or Success Metrics
//      caps the total at 7.4 until it is fixed or moved.
//
// Beside the rule (10.25.0), one more question that never scores: does a requirement prescribe how the system is built — a
// product, a technology, a design? A candidate (a technology word or a product-shaped name) goes to the judge; a confident
// yes is reported as an implementation suggestion — the statement moves to Appendix › Implementation Suggestions, the need
// behind it stays in its section. Unanswered, it keeps the result PENDING like any other candidate.
//
// Exit: 0 PASS · 1 FAIL · 10 PENDING (a worksheet waits for the worksheet-judge subagent; nothing failed by code).
'use strict';
const fs = require('fs'), path = require('path');
const { parseSpec, plain } = require('../../../scripts/shared/po-spec.js');

// ---- the judge (sa-skills'), found as capability-prepare.js finds it -------------------------------------------------------
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

// ---- the rule ---------------------------------------------------------------------------------------------------------
const TESTS = ['named', 'closed', 'dated', 'observable', 'measurable'];
const SPEC = {
  id: 'po-spec-checkability', type: 'choice', hi: 0.6,
  question: 'Could someone who was not in the room check that the requirement `item.text` (from `item.where`) is met? Answer `ok` when it passes all five tests; otherwise the first test it fails, in the order listed. Judge the statement as a requirement of this initiative: a plain user action in a use-case step ("the customer selects an account") is checkable.',
  criteria: {
    ok: 'Checkable as written: what it names is named, any list is closed, anything future is dated, it says what is observed when met, and any quality word carries its number.',
    named: 'It leaves unnamed a system, channel, actor or data item it depends on: "other systems", "third parties", "the relevant areas", "any platform", "otros sistemas", "terceros", "las áreas correspondientes".',
    closed: 'It gives an open-ended list: "etc.", "among others", "such as", "and more", "and future channels", "entre otros", "tales como", "y otros", "y demás".',
    dated: 'It asks for something later without a release or a date: "in the future", "eventually", "later on", "should allow extending", "a futuro", "más adelante", "eventualmente", "en una fase posterior" with no fase named.',
    observable: 'It states no observable result: "handles errors appropriately", "processes the request", "integrates well", "as needed", "maneja los errores adecuadamente", "procesa la solicitud", "según corresponda".',
    measurable: 'It uses a quality word with no trigger, case or number: "scalable", "extensible", "flexible", "fast", "secure", "easy to use", "highly available", "escalable", "rápido", "seguro", "fácil de usar", "alta disponibilidad".',
  },
};
const LADDER = {
  named: 'Which one(s), by name? Name the first one or two.',
  closed: 'Close the list: which ones, exactly? Anything else goes to Aspirations.',
  dated: 'When? Give a release or a date — or move it to Aspirations.',
  observable: 'What will someone see when it works: a value, a state, a message, a record?',
  measurable: 'What number makes it true? State the trigger, the cases it covers and the measure.',
  'missing-part': 'Add the missing part.',
};
// candidate finders, bilingual — they only decide what the judge is asked, never the answer
const CUE = {
  named: /\b(other|external|third[- ]party|any|all (?:the )?(?:other )?)\s+(systems?|platforms?|channels?|applications?|apps|providers?|partners?|areas?|entities)\b|\bthird parties\b|\b(?:the )?relevant (?:areas?|teams?|systems?)\b|\botr[oa]s\s+(sistemas?|plataformas?|canales?|aplicaciones?|proveedores?|entidades?|áreas)\b|\bterceros\b|\b(?:las|los)\s+(?:áreas|sistemas|equipos)\s+correspondientes\b|\bcualquier\s+(?:sistema|plataforma|canal)\b|\bdemás\s+(?:sistemas|canales|áreas)\b/i,
  closed: /\betc\.?(?=\W|$)|\bamong others\b|\bsuch as\b|\band (?:so on|more|others)\b|\bentre otr[oa]s\b|\btales como\b|\by (?:otr[oa]s|demás|más)\b|\bpor ejemplo\b|\be\.g\.|\bincluding but not limited\b/i,
  dated: /\b(?:in the future|future(?:-proof)?|eventually|later(?: on)?|at some point|down the road|someday|should allow (?:extending|adding)|could be extended|a futuro|en el futuro|más adelante|posteriormente|eventualmente|en algún momento|en una (?:fase|etapa) posterior|podría extenderse|que se pueda extender)\b/i,
  observable: /\b(?:appropriately|properly|as needed|as required|correctly|seamlessly|handles? (?:all )?(?:the )?errors?|process(?:es)? the request|integrates? (?:well|properly)|adecuadamente|correctamente|según corresponda|de forma adecuada|maneja(?:r)? (?:los )?errores|procesa(?:r)? la solicitud|se integra(?:rá)? bien|sin problemas)\b/i,
  measurable: /\b(?:scalab\w*|extensib\w*|extendable|flexib\w*|robust\w*|fast|quick\w*|rapid\w*|performant|efficient\w*|secure\w*|reliab\w*|user[- ]friendly|intuitive|easy|simple|modern|high(?:ly)? availab\w*|escalab\w*|extensib\w*|flexib\w*|robust\w*|rápid\w*|ágil|eficien\w*|segur[oa]s?|confiab\w*|amigable|intuitiv\w*|fácil(?:es)?|sencill\w*|modern\w*|alta disponibilidad|buen(?:as)? prácticas)\b/i,
};
// implementation candidates: a technology word, bilingual, or a product name — an inner capital (PostgreSQL, DynamoDB) or a
// product that is also a plain word, matched by its case (React, REST)
const IMPL_WORD = /\b(?:micro-?servic\w*|microservicios?|monolit\w*|monolith\w*|serverless|kubernetes|docker|containeri[sz]ed|contenedores|cloud-native|nube|databases?|bases? de datos|message (?:queue|broker|bus)|event bus|bus de eventos|colas? de mensajes|kafka|rabbitmq|frameworks?|librer[íi]as?|blockchain|cach[eé]|redis|data lake|mainframe|webhooks?|graphql|grpc|postgres\w*|mysql|mongo\w*|low-?code|no-?code|chatbot)\b/i;
const IMPL_NAME = /\b(?:React|Vue|Angular|Java|Python|REST|SOAP|SAP|AWS|GCP|Azure|Lambda|Oracle|Node\.js|\.NET|Salesforce|Tableau|Power ?BI|LLM|GPT|SQL|NoSQL|JSON|XML|ETL|SDK|APIs?|K8s)\b|\b[A-Z][a-z]+[A-Z][A-Za-z]*\b/;
const implCue = (t) => IMPL_WORD.test(t) || IMPL_NAME.test(t);
const IMPL = {
  id: 'po-spec-implementation', type: 'noul', hi: 0.6,
  question: 'Does the requirement `item.statement` (from `item.where`) prescribe how the system is to be built — a product, technology, vendor, framework, data store, protocol, architecture style or internal component of the system — rather than what it must do?',
  criteria: {
    true: 'It chooses the means: "use Kafka for orders", "built as microservices", "the app in React", "store it in PostgreSQL", "expose a REST API", "usar una base de datos NoSQL".',
    false: 'It states a need, an existing system the initiative must work with ("read balances from the bank\'s SAP ledger"), a channel users reach it through, or a technology the organization imposes as a constraint (an existing contract, a mandated platform, a regulation).',
  },
};
const HAS_NUMBER = /\d/;
const HAS_DATE = /\b(?:20\d\d|Q[1-4]|H[12]|release\s*\d|r\d|fase\s*\d|phase\s*\d|v\d|sprint\s*\d|(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december))\b/i;
function cues(text) {
  const t = text, hit = [];
  if (CUE.named.test(t)) hit.push('named');
  if (CUE.closed.test(t)) hit.push('closed');
  if (CUE.dated.test(t) && !HAS_DATE.test(t)) hit.push('dated');
  if (CUE.observable.test(t)) hit.push('observable');
  if (CUE.measurable.test(t) && !HAS_NUMBER.test(t)) hit.push('measurable');
  return hit;
}

// ---- stage 1: statements ----------------------------------------------------------------------------------------------
// The requirement sections, their points in PO_SPEC_SCORING_GUIDE.md, and whether a failure caps the spec below Ready.
const SECTIONS = [
  { anchor: 'Business Objectives', en: 'Business Objectives', es: 'Objetivos de Negocio', points: 1.5, critical: true },
  { anchor: 'Use Cases', en: 'Use Cases', es: 'Casos de Uso', points: 2.5, critical: true },
  { anchor: 'User Stories', en: 'User Stories', es: 'Historias de Usuario', points: 0.5, critical: false },
  { anchor: 'User Experience Requirements', en: 'User Experience Requirements', es: 'Requisitos de Experiencia de Usuario', points: 1.0, critical: false },
  { anchor: 'Business Constraints', en: 'Business Constraints', es: 'Restricciones de Negocio', points: 2.0, critical: true },
  { anchor: 'Success Metrics and KPIs', en: 'Success Metrics & KPIs', es: 'Métricas de Éxito y KPIs', points: 1.0, critical: true },
];
const READY_CAP = 7.4;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A section's lines — by its anchor comment, else by its visible heading (EN/ES) — until the next heading of its level. */
function sectionLines(lines, sec) {
  let start = lines.findIndex((l) => new RegExp(`<!--\\s*SECTION:\\s*${esc(sec.anchor)}\\s*-->`).test(l));
  if (start < 0) start = lines.findIndex((l) => new RegExp(`^##\\s+(?:\\d+\\.\\s*)?(?:${esc(sec.en)}|${esc(sec.es)}|${esc(sec.anchor)})\\b`, 'i').test(l));
  if (start < 0) return null;
  const level = (lines[start].match(/^#+/) || ['##'])[0].length;
  let end = lines.length; for (let i = start + 1; i < lines.length; i++) { const h = lines[i].match(/^(#{1,6})\s/); if (h && h[1].length <= level) { end = i; break; } }
  return { start, end };
}
// sub-sections inside a requirement section that hold no requirement
const NOT_REQUIREMENTS = /<!--\s*SECTION:\s*(?:Out of Scope|Aspirations)\s*-->|^#{3,4}\s+(?:Out of Scope|Fuera de Alcance|Aspirations|Aspiraciones)\b/i;
const PLACEHOLDER = /^\[[^\]]*\]$|^\[[^\]]*\]\s*[:—-]/;
/** One statement per bullet, numbered item, table row (cells joined) or paragraph line; labels, headings and placeholders are not statements. */
function statementsOf(body, startLine) {
  const out = []; let skip = false;
  body.forEach((raw, k) => {
    const l = raw.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (/^#{3,6}\s/.test(raw)) { skip = NOT_REQUIREMENTS.test(raw); return; }
    if (skip || !l || /^---+$/.test(l) || /^\|?\s*:?-{3,}/.test(l)) return;
    let text = l;
    if (l.startsWith('|')) {   // a row; the header is the row a separator follows
      if (/^\|?\s*:?-{3,}/.test(String(body[k + 1] || '').trim())) return;
      const cells = l.split('|').map((c) => plain(c)).filter(Boolean); if (!cells.length) return; text = cells.join(' · ');
    }
    text = plain(text.replace(/^(?:[-*+]|\d+[.)])\s+/, '').replace(/^\[[ x]\]\s*/i, ''));
    if (!text || PLACEHOLDER.test(text) || /^\*\*[^*]+\*\*:?$/.test(l) || text.length < 4) return;
    out.push({ text, line: startLine + k + 1 });
  });
  return out;
}
const UC_PARTS = [
  ['description', 'description'], ['actor', 'actor'], ['trigger', 'trigger'], ['preconditions', 'trigger'], ['primaryFlow', 'step'],
  ['alternativeFlows', 'alternative flow'], ['edgeCases', 'edge case'], ['postconditions', 'outcome'], ['acceptanceCriteria', 'acceptance'], ['successMetrics', 'acceptance'],
];
const REQUIRED = [['actor', ['actor'], 'the actor — who starts it, by role'], ['trigger', ['trigger', 'preconditions'], 'the trigger — the event that starts it'],
  ['step', ['primaryFlow'], 'the main flow — what the system does at each step'], ['outcome', ['postconditions'], 'the outcome — the end state that proves success'],
  ['acceptance', ['acceptanceCriteria', 'successMetrics'], 'a check that can pass or fail — acceptance criteria or a success metric with its number']];
const filled = (items) => (items || []).map((x) => plain(x.replace(/^(?:[-*+]|\d+[.)])\s+/, ''))).filter((x) => x && !PLACEHOLDER.test(x) && !/^\[.*\]$/.test(x));

function extract(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const statements = [], structural = [], sections = [];
  for (const sec of SECTIONS) {
    const r = sectionLines(lines, sec);
    if (!r) { sections.push({ ...sec, present: false }); continue; }
    sections.push({ ...sec, present: true, line: r.start + 1 });
    if (sec.anchor === 'Use Cases') {
      const { useCases } = parseSpec(lines.slice(r.start, r.end).join('\n'));
      sections[sections.length - 1].use_cases = useCases.map((u) => u.id);
      for (const uc of useCases) {
        for (const [f, label, needs] of REQUIRED.map(([p, fs2, need]) => [fs2, p, need])) {
          if (!f.some((x) => filled(uc.fields[x]).length)) structural.push({ section: sec.anchor, use_case: uc.id, part: label, where: `${uc.id} ${uc.name} › ${label}`, test: 'missing-part', text: `missing: ${needs}`, line: r.start + uc.line, by: 'code' });
        }
        for (const [field, part] of UC_PARTS) filled(uc.fields[field]).forEach((t, i) =>
          statements.push({ section: sec.anchor, use_case: uc.id, part, where: `${uc.id} ${uc.name} › ${part}${['step', 'alternative flow', 'edge case', 'acceptance'].includes(part) ? ` ${i + 1}` : ''}`, text: t, line: r.start + uc.line }));
      }
      continue;
    }
    let body = lines.slice(r.start + 1, r.end);
    if (sec.anchor === 'User Stories') {   // a story's requirement is its goal and its acceptance criteria — priority, value and notes are not
      const keep = []; let inAc = false;
      body.forEach((l) => { if (/^\*\*(?:Acceptance Criteria|Criterios de Aceptaci[óo]n)\*\*/i.test(l)) { inAc = true; return; } if (/^\*\*[^*]+\*\*/.test(l) || /^#{3,6}\s/.test(l)) inAc = false;
        keep.push(inAc || /^(?:I want|Quiero)\b/i.test(l.trim()) ? l : ''); });
      body = keep;
    }
    statementsOf(body, r.start + 1).forEach((s) => statements.push({ section: sec.anchor, part: null, where: sec.anchor, ...s }));
  }
  statements.forEach((s, i) => { s.id = `s${i + 1}`; s.cues = cues(s.text); s.impl = implCue(s.text); });
  return { statements, structural, sections };
}

// ---- stage 3: score ---------------------------------------------------------------------------------------------------
function score(ex, answers, implAnswers = {}) {
  const findings = [...ex.structural], unsure = [], undecided = [], suggestions = [];
  for (const s of ex.statements.filter((x) => x.impl)) {
    const a = implAnswers[s.id];
    if (!a) { undecided.push({ ...s, question: 'implementation' }); continue; }
    if ((a.p ?? a.confidence ?? 0) >= IMPL.hi) suggestions.push({ section: s.section, use_case: s.use_case, where: s.where, text: s.text, line: s.line, by: a.by, confidence: a.p ?? a.confidence,
      ask: 'This chooses how to build it — the architecture team\'s call. What does it give you? Write that need here as a requirement and move the statement to Appendix › Implementation Suggestions.' });
  }
  for (const s of ex.statements.filter((x) => x.cues.length)) {
    const a = answers[s.id];
    if (!a) { undecided.push(s); continue; }
    const conf = a.confidence ?? 1;
    if (conf < SPEC.hi) { unsure.push({ ...s, judged: a.choice, confidence: conf, by: a.by }); continue; }
    if (a.choice !== 'ok') findings.push({ section: s.section, use_case: s.use_case, part: s.part, where: s.where, test: a.choice, text: s.text, line: s.line, by: a.by, confidence: conf });
  }
  const sections = ex.sections.filter((x) => x.present).map((sec) => {
    const f = findings.filter((x) => x.section === sec.anchor);
    if (sec.anchor === 'Use Cases') {
      const total = (sec.use_cases || []).length, failingUcs = new Set(f.map((x) => x.use_case));
      const complete = total - failingUcs.size, multiplier = total ? complete / total : 1;
      return { section: sec.anchor, points: sec.points, critical: sec.critical, failing: f.length, use_cases: total, complete, failing_use_cases: [...failingUcs], multiplier: +multiplier.toFixed(3), max_points: +(sec.points * multiplier).toFixed(2) };
    }
    const multiplier = Math.max(0, 1 - 0.25 * f.length);
    return { section: sec.anchor, points: sec.points, critical: sec.critical, failing: f.length, multiplier, max_points: +(sec.points * multiplier).toFixed(2) };
  });
  const capped = sections.filter((s) => s.critical && s.failing).map((s) => s.section);
  const status = findings.length ? 'FAIL' : undecided.length || unsure.length ? 'PENDING' : 'PASS';
  return { status, findings: findings.map((f) => ({ ...f, ask: LADDER[f.test] })), unsure, undecided, suggestions, sections, ready_cap: capped.length ? READY_CAP : null, capped_by: capped };
}

// ---- run --------------------------------------------------------------------------------------------------------------
async function check(specPath, opts = {}) {
  const text = fs.readFileSync(specPath, 'utf8');
  const ex = extract(text);
  const candidates = ex.statements.filter((s) => s.cues.length);
  const SA = opts.saSkills !== undefined ? opts.saSkills : saSkillsDir();
  const J = opts.judge || (SA ? require(path.join(SA, 'scripts', 'judge.js')) : null);
  const judgeInfo = { engine: J ? opts.engine || J.engineInForce() : 'none', pending: null, note: J ? null : 'no judge — the judge ships in sa-skills (scripts/judge.js), which was not found; every candidate is undecided — pass --sa-skills <dir> or set SA_SKILLS_DIR' };
  const ask = async (spec, items) => {
    if (!items.length || !J) return {};
    try {
      const res = await J.judge(spec, items, { engine: judgeInfo.engine, root: opts.root || path.dirname(path.resolve(specPath)), answers: opts.answers, cache: opts.cache, fetch: opts.fetch, apiKey: opts.apiKey });
      if (res.pending) { judgeInfo.pending = judgeInfo.pending ? `${judgeInfo.pending} and ${res.pending}` : res.pending; judgeInfo.dispatch = res.dispatch || J.WORKSHEET_JUDGE || null; }
      judgeInfo.engine = res.engine || judgeInfo.engine; return res.answers || {};
    } catch (e) { if (e.name !== 'JudgeError') throw e; judgeInfo.note = e.message; return {}; }
  };
  const answers = await ask(SPEC, candidates.map((s) => ({ id: s.id, state: { text: s.text, where: s.where } })));
  const implItems = ex.statements.filter((s) => s.impl);
  const implAnswers = await ask(IMPL, implItems.map((s) => ({ id: s.id, state: { statement: s.text, where: s.where } })));
  return { spec: specPath, statements: ex.statements.length, candidates: candidates.length + implItems.length, judge: judgeInfo, ...score(ex, answers, implAnswers) };
}

function render(r) {
  const out = [`CHECKABILITY: ${r.status} · ${r.statements} statement(s) · ${r.candidates} asked · ${r.findings.length} failing · ${(r.suggestions || []).length} implementation suggestion(s), not scored · ${r.unsure.length} unsure · ${r.undecided.length} undecided · judge ${r.judge.engine}`];
  for (const s of r.sections) out.push(s.section === 'Use Cases'
    ? `  ${s.section}: ${s.complete} of ${s.use_cases} use case(s) complete → ×${s.multiplier} (at most ${s.max_points} of ${s.points})${s.failing_use_cases.length ? ` · failing: ${s.failing_use_cases.join(', ')}` : ''}`
    : `  ${s.section}: ${s.failing} failing → ×${s.multiplier} (at most ${s.max_points} of ${s.points})`);
  out.push(r.ready_cap ? `  Ready cap: total at most ${r.ready_cap} — failing statements in ${r.capped_by.join(', ')}` : '  Ready cap: none');
  for (const f of r.findings) out.push(`  ✗ ${f.where} · ${f.test}${f.by !== 'code' ? ` (${f.by}${f.confidence != null ? ` ${(+f.confidence).toFixed(2)}` : ''})` : ''} — "${f.text.slice(0, 140)}" → ${f.ask}`);
  for (const g of r.suggestions || []) out.push(`  → ${g.where} · implementation suggestion${g.by ? ` (${g.by}${g.confidence != null ? ` ${(+g.confidence).toFixed(2)}` : ''})` : ''} — "${g.text.slice(0, 140)}" → ${g.ask}`);
  for (const u of r.unsure) out.push(`  ? ${u.where} · judged ${u.judged} at ${(+u.confidence).toFixed(2)}, under 0.6 — not applied: "${u.text.slice(0, 140)}"`);
  if (r.undecided.length) out.push(`  undecided: ${r.undecided.length} candidate(s) no judge has answered${r.judge.pending ? ` — dispatch ${r.judge.dispatch || 'the worksheet-judge subagent'} on ${r.judge.pending}, then run again` : r.judge.note ? ` — ${r.judge.note}` : ''}`);
  return out.join('\n');
}

/** --verify: the judge measured against labelled statements [{ id, text, where?, label }] — label `ok` or a test. */
async function verify(fixturesPath, opts = {}) {
  const fx = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  const SA = opts.saSkills !== undefined ? opts.saSkills : saSkillsDir(); const J = opts.judge || (SA ? require(path.join(SA, 'scripts', 'judge.js')) : null);
  if (!J) throw new Error('no judge: pass --sa-skills <dir>');
  const res = await J.judge({ ...SPEC, id: `${SPEC.id}.verify` }, fx.map((f) => ({ id: f.id, state: { text: f.text, where: f.where || 'requirement' } })), { engine: opts.engine || J.engineInForce(), root: opts.root || path.dirname(path.resolve(fixturesPath)), answers: opts.answers, cache: opts.cache });
  if (res.pending) return { pending: res.pending, dispatch: res.dispatch };
  // what the score cares about: the verdict (ok vs fails), and whether a wrong verdict was confident enough to be applied
  const rows = fx.map((f) => { const a = res.answers[f.id]; const got = a ? a.choice : null, conf = a ? a.confidence ?? 1 : null;
    return { id: f.id, label: f.label, got, confidence: conf, verdict_ok: got != null && (got === 'ok') === (f.label === 'ok'), exact: got === f.label, applied_wrong: got != null && (got === 'ok') !== (f.label === 'ok') && conf >= SPEC.hi }; });
  return { engine: res.engine, total: rows.length, verdict_correct: rows.filter((r) => r.verdict_ok).length, test_exact: rows.filter((r) => r.exact).length, applied_wrong: rows.filter((r) => r.applied_wrong).length, rows };
}

module.exports = { check, verify, extract, score, cues, implCue, render, sectionLines, statementsOf, saSkillsDir, SPEC, IMPL, TESTS, LADDER, SECTIONS, READY_CAP };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const answersArg = args.includes('--answers') ? (opt('--answers') && !opt('--answers').startsWith('--') ? path.resolve(opt('--answers')) : true) : undefined;
  (async () => {
    if (args.includes('--verify')) { const v = await verify(opt('--verify'), { engine: opt('--judge'), answers: answersArg }); console.log(JSON.stringify(v, null, 1)); process.exit(v.pending ? 10 : 0); }
    const spec = args.find((a, i) => !a.startsWith('--') && !['--judge', '--answers', '--sa-skills', '--verify'].includes(args[i - 1]));
    if (!spec) { console.error('usage: po-spec-checkability.js <PRODUCT_OWNER_SPEC.md> [--judge agent|typesafe|clef] [--answers [<file>]] [--sa-skills <dir>] [--json] [--verify <fixtures.json>]'); process.exit(2); }
    const r = await check(spec, { engine: opt('--judge'), answers: answersArg });
    console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    process.exit(r.status === 'FAIL' ? 1 : r.status === 'PENDING' ? 10 : 0);
  })().catch((e) => { console.error(e.message); process.exit(2); });
}
