#!/usr/bin/env node
// analysis-prepare.js — the payload each analysis lens judges from, cut once by code (8.50.0).
//
//   bun analysis-prepare.js <project_root> --lens <a,b,…|all> [--today YYYY-MM-DD] [--format md|html] [--out <dir>] [--json]
//                           [--judge agent|typesafe|clef] [--judge-answers <answers.json>] [--verify <fixtures.json>]
//
// One judgement is asked, not computed: the direction a docs/05 row states (a call, or the data's
// direction). It goes through scripts/judge.js — `--judge` picks the engine, else SA_JUDGE, else
// `agent` (a worksheet the session answers); the answer and its provider print on every edge. A row
// the judge has not answered, or cannot settle, gets no direction: it stays out of the graph metrics
// and is named in the payload and the summary instead of read one way in silence (8.119.0). `--verify` measures the answers against a fixtures file: [{ "id": "I-14", "label": "call" }].
//
// Before 8.50.0 every analysis agent explored the corpus on its own — on the reference project ten
// agents spent 23 turns each, 163 Bash calls and 83 Reads, rebuilding by hand the tables the ledger
// already holds (the consumer graph, fan-in and fan-out, the hop budgets of every flow, the
// deployment inventory) before a single judgement was made. This script writes, per lens:
//
//   .cache/sa-skills/analysis/<lens>.payload.md   the plan (the report's shape), the spec (the
//                                                  classification rules), the ledger facts the lens
//                                                  cites, the metrics derived from them, what earlier
//                                                  reports already registered on each component, the
//                                                  explorer's excerpts for the lens's vocabulary, and
//                                                  the fill contract with the render command, and the
//                                                  Design Language extract its spec asks for
//   .cache/sa-skills/analysis/<lens>.docs.md      the prose documents the judgement needs, whole
//
// Both are written in parts of at most PART_BYTES (<lens>.payload-2.md, <lens>.docs-2.md, …), each one
// Read returns whole; part 1 of the payload carries the reading list (measured 2026-10-06: 100–180 KB
// files paged by hand, 4 of 10 agents hitting Read's 25,000-token limit and re-reading the same offset).
//   .cache/sa-skills/analysis/<lens>.facts.json   the same facts and metrics as data
//   .cache/sa-skills/analysis/_run.json           the manifest: bytes per part, what was missing
//
// The agent reads the payload (and the docs bundle), writes the fill, runs render-analysis.js.
// Everything here is verbatim carry or computation; nothing is judged.
'use strict';
const fs = require('fs');
const path = require('path');

const SKILL = path.join(__dirname, '..');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));
const { findings: explore } = require(fromSaSkills('scripts', 'shared', 'explorer.ts'));
const F = require(fromSaSkills('scripts', 'shared', 'findings.js'));
const JUDGE = require(fromSaSkills('scripts', 'judge.js'));
const { resolveNames } = require(fromSaSkills('scripts', 'resolve-name.js'));
let SIM = null; try { SIM = require(fromSaSkills('plugins', 'sa-visualization', 'skills', 'architecture-command-center', 'scripts', 'simulation.js')); } catch (e) { SIM = null; }  // optional: architecture-command-center (the load model)

const args = process.argv.slice(2);
const root = path.resolve(args.find((a) => !a.startsWith('--') && (args.indexOf(a) === 0 || !args[args.indexOf(a) - 1].startsWith('--'))) || '.');
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const ALL = ['spof', 'blast-radius', 'bottleneck', 'cost-hotspots', 'stride', 'vendor-lockin', 'latency-budget', 'tech-debt', 'coupling', 'data-sensitivity'];
const lensArg = opt('--lens') || 'all';
const lenses = lensArg === 'all' ? ALL : lensArg.split(',').map((s) => s.trim()).filter(Boolean);
const bad = lenses.filter((l) => !ALL.includes(l)); if (bad.length) { console.error(`unknown lens: ${bad.join(', ')} (one of ${ALL.join(', ')})`); process.exit(2); }
const today = opt('--today') || new Date().toISOString().slice(0, 10);
const format = (opt('--format') || 'md').toLowerCase() === 'html' ? 'html' : 'md';
const outDir = path.resolve(opt('--out') || path.join(root, '.cache', 'sa-skills', 'analysis'));
const jsonOut = args.includes('--json');

// The vocabulary each lens hands the explorer (moved here from SKILL.md Step 2.5 — this is the copy in force)
const VOCAB = {
  'spof': 'single point of failure|\\bSPOF\\b|punto .nico de fall, failover|conmutaci.n por error, redundan, high availability|alta disponibilidad, multi[- ]?region|multirregi|multi[- ]?AZ|availability zone|zona de disponibilidad, replica|r.plica, backup|respaldo, disaster recovery|recuperaci.n ante desastres|\\bDR\\b, \\bRTO\\b|\\bRPO\\b, health ?check|sonda de salud|liveness|readiness, circuit breaker|cortacircuitos|disyuntor, singleton|instancia .nica',
  'blast-radius': 'downstream|aguas abajo|consumidor, dependenc, cascad, fan[- ]?out|abanico, retry|retries|reintento, timeout|tiempo de espera|tiempo l.mite, bulkhead|mamparo|aislamiento, fail[- ]open|fail[- ]closed|falla abierta|falla cerrada, circuit breaker|cortacircuitos, fallback|alternativa|degradad, \\bMTTR\\b|tiempo medio de recuperaci.n, isolat|aisla',
  'bottleneck': 'throughput|rendimiento|caudal, capacit|capacidad, headroom|margen, queue|\\bcolas?\\b, backpressure|contrapresi.n, p9[59], saturat|saturaci, connection pool|pool de conexiones, \\bHPA\\b|autoscal|autoescal|r.plicas, rate limit|l.mite de tasa|cuota, fan[- ]?in, \\bRPS\\b|\\bTPS\\b|requests per second|solicitudes por segundo, lag|retraso, partition|partici.n',
  'cost-hotspots': '\\bcost|\\bcosto|\\bcoste, pricing|precio|tarifa, instance|instancia, GB[- ]month|GB[- ]mes, reserved|reservad, \\bspot\\b, FinOps, billing|facturaci, licen[cs]e|licencia, budget|presupuesto, tier|nivel de servicio, \\bSKU\\b, vCore|vCPU, egress|salida de datos, premium',
  'stride': 'trust boundary|l.mite de confianza|frontera de confianza|zona de confianza, authenticat|autenticaci, authoriz|autorizaci, mTLS|mutual TLS|TLS mutuo, encrypt|cifra|encripta, audit|auditor, secret|secreto|vault|key management|gesti.n de llaves|gesti.n de claves, \\bRBAC\\b|role[- ]based|basado en roles, rate limit|l.mite de tasa|throttl, token|JWT|OAuth|OIDC, spoof|suplanta, tamper|manipula, repudiat|repudio, disclos|divulga|fuga, denial of service|denegaci.n de servicio|DDoS, privilege|privilegio, non[- ]root|sin root, image scan|escaneo de im.genes',
  'vendor-lockin': 'vendor|proveedor, proprietar|propietari, portab, exit strateg|estrategia de salida, migrat|migraci, lock[- ]in|dependencia del proveedor, managed service|servicio gestionado|servicio administrado, \\bSaaS\\b|\\bPaaS\\b, open[- ]source|c.digo abierto, standard|est.ndar, multi[- ]?cloud|multinube, contract|contrato, licen[cs]e|licencia',
  'latency-budget': 'latenc, p9[59], \\bSLO\\b|service level objective|objetivo de nivel de servicio, \\bhops?\\b|salto, budget|presupuesto, end[- ]to[- ]end|extremo a extremo|punta a punta, timeout|tiempo de espera|tiempo l.mite, \\bms\\b|milisegundo, round[- ]?trip|ida y vuelta, serial|secuencial, parallel|paralelo, cache hit|acierto de cach, cold start|arranque en fr.o, tail|cola larga|percentil',
  'tech-debt': '\\bEOL\\b|end[- ]of[- ]life|fin de vida|fin de soporte, deprecat|obsolet, legacy|heredad, version|versi.n, sunset|retir, upgrade|actualizaci, technical debt|deuda t.cnica, TDR-\\d, unsupported|sin soporte, \\bLTS\\b, patch|parche, vulnerab, \\bCVE\\b, framework, runtime|entorno de ejecuci.n, \\bSDK\\b|librer.a|library|biblioteca',
  'coupling': 'coupling|acoplamiento, fan[- ]?in, fan[- ]?out, instabilit|inestabilidad, cycle|ciclo|circular, dependency direction|direcci.n de (la )?dependencia, shared (database|schema|library)|base de datos compartida|esquema compartido|librer.a compartida, hub|concentrador, god (object|service)|objeto dios|servicio dios, contract|contrato, interface|interfaz, \\bAPI\\b, event|evento, consumer|consumidor, producer|productor, depends on|depende de|consumed by|consumido por',
  'data-sensitivity': '\\bPII\\b|personal data|datos personales|informaci.n personal, encryption at rest|cifrado en reposo|encriptaci.n en reposo, encryption in transit|cifrado en tr.nsito|encriptaci.n en tr.nsito, classif|clasifica, retention|retenci.n, \\bGDPR\\b|\\bPCI\\b|\\bHIPAA\\b|LOPD|habeas data|protecci.n de datos, masking|enmascara|tokeniza|anonimiz|seudonimiz, \\bS[1-4]\\b, confidential|confidencial|sensitive|sensible, key management|gesti.n de llaves|gesti.n de claves|KMS|HSM, backup|respaldo, purge|borrado|delete|eliminaci.n',
};
const SEV_LENSES = { 'spof': 'SPOF', 'blast-radius': 'BLAST-RADIUS', 'bottleneck': 'BOTTLENECK', 'cost-hotspots': 'COST-HOTSPOTS', 'stride': 'STRIDE', 'vendor-lockin': 'VENDOR-LOCKIN', 'latency-budget': 'LATENCY-BUDGET', 'tech-debt': 'TECH-DEBT', 'coupling': 'COUPLING', 'data-sensitivity': 'DATA-SENSITIVITY' };

// ---------------------------------------------------------------- helpers
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const cellText = (v) => String(v == null ? '' : v).replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();
const table = (columns, rows) => rows.length ? ['| ' + columns.join(' | ') + ' |', '|' + columns.map(() => '---').join('|') + '|', ...rows.map((r) => '| ' + r.map(cellText).join(' | ') + ' |')].join('\n') : '_none_';
const ND = 'Not documented';
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const norm = F.norm;
const ms = (s) => { const m = String(s || '').replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(ms|s|seg|segundos?|min)\b/i); if (!m) return null; const v = parseFloat(m[1]); return /^ms$/i.test(m[2]) ? v : /^min/i.test(m[2]) ? v * 60000 : v * 1000; };

// ---------------------------------------------------------------- facts + graph
const facts = collect(root);
const missing = [];
const comps = (facts.components || []).filter((c) => c.level !== 'L1');
const systems = (facts.components || []).filter((c) => c.level === 'L1');
const byNorm = new Map(); comps.forEach((c) => byNorm.set(norm(c.name), c));
// canon(name) — the canonical component name a docs/05 cell or a descriptor's dependency line refers to; defined below, once
// every name the graph will use has gone through scripts/resolve-name.js in one batch (exact names by code, the rest judged).
let canon = null;

// dependency lines the descriptors carry, both languages
const DEP_KEYS = [[/^\*\*(Depends On|Depende de|Dependencias?)\s*:?\*\*:?\s*(.+)$/i, 'out'], [/^\*\*(Consumed By|Consumido por|Consumidores)\s*:?\*\*:?\s*(.+)$/i, 'in'], [/^\*\*(Calls|Llama a|Invoca)\s*:?\*\*:?\s*(.+)$/i, 'out']];
// the lines are prose: only a Markdown link `[Name](file.md)` or a backticked `Name` names a component; everything else is the sentence around them
const splitNames = (s) => { const names = []; String(s).replace(/\[([^\]]+)\]\([^)]*\)/g, (m, n) => { names.push(n.trim()); return ''; }).replace(/`([^`]+)`/g, (m, n) => { names.push(n.trim()); return ''; }); return [...new Set(names)].filter((x) => x && !/^(none|ninguno|—|-|n\/a|not documented|no documentado)$/i.test(x) && !/^(ADR|TDR|UC|I|F|TB|CC)-?\d/i.test(x)); };   // an id in backticks is a citation, not a component
// ---- names → components. `canon` used to be a normalized lookup that returned the raw string when the ledger did not carry
// the name, so a misspelled or paraphrased docs/05 endpoint became a phantom graph node ("edge only" in the metrics table)
// with nothing said. Every name is now resolved once through scripts/resolve-name.js: an exact name by code, a qualified,
// compound or paraphrased one by the judge (containment hits, or the whole ledger, plus `none`); an unresolved name still
// enters the graph as its raw string — that is what the document says — and is reported in the manifest and the summary.
const harvestDepNames = () => { const out = new Map(); const add = (n, source) => { if (!out.has(n)) out.set(n, source); };
  comps.filter((c) => c.file_backed !== false).concat(systems).forEach((c) => { const f = path.join(root, c.file || ''); if (!c.file || !exists(f)) return;
    read(f).split('\n').forEach((line) => DEP_KEYS.forEach(([re]) => { const m = line.match(re); if (m) splitNames(m[2]).forEach((n) => add(n, c.file)); })); });
  return out; };
const nameCells = []; const seenName = new Map();
const addName = (raw, context, exclude) => { const key = String(raw || '').replace(/^`|`$/g, '').trim(); if (!key || seenName.has(key)) return; seenName.set(key, `n${nameCells.length}`); nameCells.push({ id: `n${nameCells.length}`, cell: key, context, exclude: exclude || [] }); };
const exactComp = (cell) => { const c = byNorm.get(norm(String(cell || '').replace(/^`|`$/g, ''))); return c ? [c.name] : []; };   // a cell never means the other end of its own row
(facts.integrations || []).filter((i) => !i.retired).forEach((i) => { addName(i.from, { integration: i.id, side: 'from', other: i.to, protocol: i.protocol || ND, pattern: i.pattern || ND }, exactComp(i.to)); addName(i.to, { integration: i.id, side: 'to', other: i.from, protocol: i.protocol || ND, pattern: i.pattern || ND }, exactComp(i.from)); });
harvestDepNames().forEach((source, n) => addName(n, { dependency_line_in: source }));
let named = new Map(); named.engine = JUDGE.engineInForce(); let nameNote = null;
if (nameCells.length) {
  // the whole ledger, systems included: a system's dependency line names other systems, and an exact L1 name is code's to
  // answer — offered only the containers, the judge picked "Base Despachos Nacionales" at 0.32 for "Motor de Despachos Nacionales"
  try { named = await resolveNames(nameCells, facts.components || [], { engine: opt('--judge') || JUDGE.engineInForce(), root, answers: opt('--judge-names') });
    if (named.pending) nameNote = `names: the agent worksheet is at ${named.pending} — judge it and re-run with --judge-names <answers.json>; until then every name the judge must read is undecided (kept as the document writes it, never guessed)`; }
  catch (e) { if (!(e instanceof JUDGE.JudgeError)) throw e; nameNote = `names: ${e.message} — every name the judge must read is undecided (kept as the document writes it, never guessed)`; }
}
// an exact name is code's; anything else the judge has not resolved stays the raw string the document writes
const fallbackCanon = (name) => { const c = byNorm.get(norm(String(name || '').replace(/^`|`$/g, ''))); return c ? c.name : String(name || '').replace(/^`|`$/g, '').trim(); };
canon = (name) => { const key = String(name || '').replace(/^`|`$/g, '').trim(); const r = named.get(seenName.get(key)); return r && r.resolved ? r.name : fallbackCanon(name); };
const nameReport = { engine: named.engine, names: nameCells.length, unresolved: [], undecided: [], review: [] };
nameCells.forEach((c) => { const r = named.get(c.id); if (!r) return;
  const where = c.context.integration ? `${c.context.integration} ${c.context.side}` : `dependency line in ${c.context.dependency_line_in}`, who = r.by !== 'undecided' && r.by !== 'exact' ? ` (${r.by}${r.confidence != null ? ` ${r.confidence}` : ''})` : '';
  if (!r.resolved) { if (byNorm.has(norm(c.cell))) return; if (r.undecided) nameReport.undecided.push(`${where} "${c.cell}"`); else nameReport.unresolved.push(`${where} "${c.cell}" — ${r.unresolved_reason + who}`); return; }
  if (r.band === 'mid') nameReport.review.push(`${where} "${c.cell}" resolved to \`${r.name}\`${who} — below the confident band; confirm it`);
  if (r.also.length) nameReport.review.push(`${where} "${c.cell}" also names ${r.also.map((n) => `\`${n}\``).join(', ')}${who} — the graph edge goes to \`${r.name}\``); });
const edges = [];   // { from, to, kind: 'call'|'data', via, source, by, confidence? } — directed edges only
// The direction a docs/05 row states. Most rows run caller → callee; an event, a replication, a pull or push, a stream or a
// CDC row runs producer → consumer (the data's direction), and the dependency is the reverse. docs/05 declares no column
// for this, so it is a judgement — one Choice per row through scripts/judge.js. The keyword lexicon this script used to
// answer with read "Sync Gateway" in a Protocol cell as a data flow and reversed a request-response row in silence; it is
// gone (8.119.0). A row the judge has not answered is undecided, and one it answered `unclear` or below the band is not
// stated: neither gets a direction, neither enters the graph metrics, and both are named — the second as a docs/05 gap.
const EDGE_DIRECTION = {
  id: 'edge-direction', type: 'choice', hi: 0.6,
  question: 'In which direction does the integration row `item` run? `item.from` and `item.to` are the two components; `item.protocol` and `item.pattern` describe the interaction between them.',
  criteria: {
    call: 'From invokes To and waits for the answer: a request-response, a query, a command, an RPC, a synchronous API call over any transport. From depends on To. A product name in the Protocol cell (a "Sync Gateway", an "Event Hub", a "Stream Manager") does not make the row an event or a replication; the Pattern cell decides.',
    data: 'From produces what To consumes: an event published to a topic, a message on a queue, a replication or CDC feed, a stream, a webhook delivered to To, or a pull in which To fetches data that From holds. To depends on From.',
    unclear: 'The Pattern and Protocol cells do not say which of the two it is.',
  },
};
const rowsToJudge = (facts.integrations || []).filter((i) => !i.retired);
const judgeItems = rowsToJudge.map((i) => ({ id: i.id, state: { id: i.id, from: canon(i.from), to: canon(i.to), protocol: i.protocol || 'Not documented', pattern: i.pattern || 'Not documented', boundary: i.boundary || 'Not documented' } }));
let judged = { engine: JUDGE.engineInForce(), answers: {} }, judgeNote = null;
if (judgeItems.length) {
  const engine = opt('--judge') || JUDGE.engineInForce();
  try {
    judged = await JUDGE.judge(EDGE_DIRECTION, judgeItems, { engine, root, answers: opt('--judge-answers') });
    if (judged.pending) judgeNote = `edge direction: the agent worksheet is at ${judged.pending} — judge it and re-run with --judge-answers <answers.json>; until then every row is undecided and left out of the graph`;
  } catch (e) { if (!(e instanceof JUDGE.JudgeError)) throw e; judgeNote = `edge direction: ${e.message} — every row is undecided and left out of the graph`; judged = { engine, answers: {} }; }
}
const rowReadings = [];   // every docs/05 row: directed (an edge), uncertain (judged, not settled) or undecided (unanswered)
rowsToJudge.forEach((i) => {
  const a = judged.answers[i.id];
  const settled = a && (a.choice === 'call' || a.choice === 'data') && (a.confidence == null || a.confidence >= EDGE_DIRECTION.hi);
  const e = { from: canon(i.from), to: canon(i.to), kind: settled ? a.choice : null, via: `${i.id} (${i.protocol || '?'}, ${i.pattern || '?'})`, source: 'docs/05', by: a ? a.by : 'undecided' };
  if (a && a.confidence != null) e.confidence = +a.confidence.toFixed(2);
  if (a && !settled) { e.uncertain = true; e.judged = a.choice; }
  if (!a) e.undecided = true;
  rowReadings.push(e);
  if (settled) edges.push(e);
});
const dirById = new Map(rowReadings.map((e) => [e.via.split(' ')[0], e]));
const readingOf = (e) => { if (!e) return ND; const who = e.by + (e.confidence != null ? ` ${e.confidence}` : '');
  if (e.undecided) return 'undecided — the judge has not answered; no direction, left out of the graph';
  if (e.uncertain) return `not stated — the judge (${who}) answered ${e.judged}; no direction, left out of the graph: a docs/05 gap`;
  return `${e.kind === 'data' ? 'data (To depends on From)' : 'call (From depends on To)'} · ${who}`; };
const uncertainRows = rowReadings.filter((e) => e.uncertain), undecidedRows = rowReadings.filter((e) => e.undecided);
const rowId = (e) => e.via.split(' ')[0];
if (opt('--verify')) {
  const fx = JSON.parse(fs.readFileSync(path.resolve(opt('--verify')), 'utf8'));
  const v = JUDGE.verify(EDGE_DIRECTION, fx, judged.answers);
  console.error(`edge direction · ${judged.engine}${judged.pending ? ' (worksheet pending)' : ''} · ${v.tp}/${v.total} fixtures answered as labelled`);
  v.fn.forEach((f) => console.error(`   ✗ ${f.id}: labelled ${f.label}, answered ${f.got}${Number.isFinite(f.value) ? ` (${f.value.toFixed(2)})` : ''}${f.note ? ` — ${f.note}` : ''}`));
  v.unseen.forEach((f) => console.error(`   ✗✗ ${f.id}: not a docs/05 row of this project — fix the fixture, not the judge`));
}
// A container declared only as a row of a system descriptor's Containers table shares that file (file_backed: false): the
// descriptor's Depends on / Consumed by lines are the system's, and attributing them to each of its containers fabricated
// two-node cycles on the reference. Only a component's own file feeds the container graph; a system's lines are listed apart.
const systemDeps = [];
comps.filter((c) => c.file_backed !== false).forEach((c) => {
  const f = path.join(root, c.file || ''); if (!c.file || !exists(f)) return;
  read(f).split('\n').forEach((line) => DEP_KEYS.forEach(([re, dir]) => { const m = line.match(re); if (!m) return; splitNames(m[2]).forEach((n) => { const other = canon(n); const e = dir === 'out' ? { from: c.name, to: other } : { from: other, to: c.name }; if (!edges.some((x) => x.from === e.from && x.to === e.to)) edges.push(Object.assign(e, { kind: 'call', via: `descriptor ${m[1]}`, source: rel(f) })); }); }));
});
systems.forEach((sys) => { const f = path.join(root, sys.file || ''); if (!sys.file || !exists(f)) return; read(f).split('\n').forEach((line) => DEP_KEYS.forEach(([re, dir]) => { const m = line.match(re); if (!m) return; splitNames(m[2]).forEach((n) => systemDeps.push({ system: sys.name, relation: dir === 'out' ? 'depends on' : 'consumed by', other: canon(n), source: rel(f) })); })); });
const nodes = [...new Set([...comps.map((c) => c.name), ...edges.flatMap((e) => [e.from, e.to])])];
const out = new Map(nodes.map((n) => [n, []])), inn = new Map(nodes.map((n) => [n, []]));
edges.forEach((e) => { out.get(e.from).push(e); inn.get(e.to).push(e); });
// who depends on X: sync callers of X, and the consumers downstream of X on async edges
const dependents = (x) => { const s = new Set(); inn.get(x).filter((e) => e.kind === 'call').forEach((e) => s.add(e.from)); out.get(x).filter((e) => e.kind === 'data').forEach((e) => s.add(e.to)); return [...s]; };
const transitive = (x) => { const seen = new Set([x]), depth = new Map([[x, 0]]); const q = [x]; while (q.length) { const c = q.shift(); dependents(c).forEach((d) => { if (!seen.has(d)) { seen.add(d); depth.set(d, depth.get(c) + 1); q.push(d); } }); } seen.delete(x); return { all: [...seen], depth: Math.max(0, ...[...depth.values()]) }; };
const metrics = nodes.map((n) => { const direct = dependents(n), tr = transitive(n); const fanIn = inn.get(n).length, fanOut = out.get(n).length; return { component: n, documented: byNorm.has(norm(n)), fanIn, fanOut, instability: fanIn + fanOut ? +(fanOut / (fanIn + fanOut)).toFixed(2) : null, directDependents: direct, indirectDependents: tr.all.filter((d) => !direct.includes(d)), blastFanOut: tr.all.length, depth: tr.depth }; }).sort((a, b) => b.blastFanOut - a.blastFanOut || b.fanIn - a.fanIn);
// cycles over the dependency direction (a → b when a calls b, or a produces what b consumes)
const cycles = []; { const adj = new Map(nodes.map((n) => [n, out.get(n).map((e) => e.to)])); const color = new Map(), stack = []; const dfs = (n) => { color.set(n, 1); stack.push(n); for (const m of adj.get(n) || []) { if (color.get(m) === 1) { const i = stack.indexOf(m); const cyc = stack.slice(i).concat(m); const key = cyc.slice(0, -1).sort().join('|'); if (!cycles.some((c) => c.key === key) && cycles.length < 20) cycles.push({ key, path: cyc }); } else if (!color.has(m)) dfs(m); } stack.pop(); color.set(n, 2); }; nodes.forEach((n) => { if (!color.has(n)) dfs(n); }); }

// latency: every flow's declared phases, the hop count and budget per phase, the sum against the target
const phases = facts.phases || [], flows = facts.flows || [];
const phaseByN = new Map(phases.map((p) => [String(p.n), p]));
// No arithmetic over the phase budgets: on the reference the serial sum of phases 1 + 2 + 4 read 1,700 ms against a 1 s
// target, while the flow's own breakdown sums to exactly 1,000 ms — phases overlap, and a phase's budget line may say it runs
// outside the flow's budget. The document states the accounting; the payload carries it verbatim — the flow's block from
// docs/04 (its breakdown, delta and governed-by lines) and every phase's budget line — and the agent reads it.
const d04 = (() => { const f = (facts.docs || []).find((d) => /^docs\/04-/.test(d.file)); return f && exists(path.join(root, f.file)) ? read(path.join(root, f.file)) : ''; })();
const flowBlock = (code) => { const lines = d04.split('\n'); const i = lines.findIndex((l) => new RegExp('^#{2,6}\\s+(Flow|Flujo)\\s+' + code + '\\s*[—–-]', 'i').test(l)); if (i < 0) return null; const level = lines[i].match(/^#+/)[0].length; let j = i + 1; while (j < lines.length && !(/^#{1,6}\s/.test(lines[j]) && lines[j].match(/^#+/)[0].length <= level)) j++; return lines.slice(i, j).join('\n').trim().slice(0, 6000); };
const budgetSections = (() => { const lines = d04.split('\n'); const out = []; for (let i = 0; i < lines.length; i++) { const h = lines[i].match(/^(#{2,6})\s+(.+)$/); if (!h) continue; if (/^(Flow|Flujo|Phase|Fase)\s+\d/i.test(h[2])) continue; if (!/presupuesto|budget|latenc|desglose|breakdown|\bp9[59]\b|\bSLO\b/i.test(h[2])) continue; const level = h[1].length; let j = i + 1; while (j < lines.length && !(/^#{1,6}\s/.test(lines[j]) && lines[j].match(/^#+/)[0].length <= level)) j++; out.push(lines.slice(i, j).join('\n').trim().slice(0, 8000)); i = j - 1; } return out; })();
const latency = flows.map((f) => { const ph = (f.phases || []).map((n) => phaseByN.get(String(n))).filter(Boolean); return { code: f.code, name: f.name, useCases: f.use_cases || [], target: f.latency_target || ND, phases: ph.map((p) => ({ n: p.n, name: p.name, hops: p.hops ? p.hops.split(/\s*(?:→|->)\s*/).length - 1 : null, hopsText: p.hops || ND, budgetText: p.latency_budget || ND })), block: flowBlock(f.code) }; });

// deployment and the load model from the newest scene (the current `architecture-command-center.scene.json` since 8.150.0), when one exists
const vizDir = path.join(root, 'visualizations');
const sceneFile = exists(vizDir) ? fs.readdirSync(vizDir).filter((n) => /\.scene\.json$/.test(n)).sort((a, b) => fs.statSync(path.join(vizDir, b)).mtimeMs - fs.statSync(path.join(vizDir, a)).mtimeMs)[0] || null : null;
let scene = null, deployment = null, sim = null;
if (sceneFile) {
  try { scene = JSON.parse(read(path.join(vizDir, sceneFile))); } catch (e) { missing.push(`scene ${sceneFile}: ${e.message}`); }
  if (scene && scene.deployment) {
    const d = scene.deployment, nodeById = new Map((d.nodes || []).map((n) => [n.id, n])), nameOf = new Map((scene.nodes || []).map((n) => [n.id, n.name]));
    const chain = (id) => { const c = []; let n = nodeById.get(id); while (n) { c.unshift(n); n = n.parent ? nodeById.get(n.parent) : null; } return c; };
    const zoneOf = (id) => { const c = chain(id); for (let i = c.length - 1; i >= 0; i--) if (c[i].trustZone) return c[i].trustZone; return null; };
    const tierOf = (id) => { const c = chain(id); for (let i = c.length - 1; i >= 0; i--) if (c[i].tier != null) return c[i].tier; return null; };
    const perContainer = new Map();
    (d.instances || []).forEach((i) => { const name = nameOf.get(i.container) || i.container; const e = perContainer.get(name) || { component: name, instances: 0, nodes: [], zones: new Set(), replicas: [] }; e.instances++; const n = nodeById.get(i.node); e.nodes.push(n ? n.name : i.node); e.zones.add(zoneOf(i.node) || '?'); if (i.replicas != null) e.replicas.push(String(i.replicas)); perContainer.set(name, e); });
    deployment = { file: `visualizations/${sceneFile}`, tiers: d.tiers || [], nodes: (d.nodes || []).map((n) => ({ id: n.id, name: n.name, kind: n.kind || null, parent: n.parent ? (nodeById.get(n.parent) || {}).name || n.parent : null, tier: tierOf(n.id), trustZone: zoneOf(n.id), tech: n.tech || null })), containers: [...perContainer.values()].map((e) => Object.assign(e, { zones: [...e.zones] })), paths: (d.paths || []).map((p) => ({ a: (nodeById.get(p.a) || nameOf.get(p.a) ? (nodeById.get(p.a) || {}).name || nameOf.get(p.a) : p.a), b: (nodeById.get(p.b) || {}).name || nameOf.get(p.b) || p.b, transport: p.transport || null, pathClass: p.pathClass || null, auth: p.auth || null })) };
  }
  if (scene && scene.capacity && SIM) {
    try { const model = SIM.buildModel(scene); const R = SIM.run(model, SIM.emptyScenario ? SIM.emptyScenario() : { scale: 1, demand: {}, down: [], overrides: {} }); const nameOf = new Map((scene.nodes || []).map((n) => [n.id, n.name]));
      sim = { threshold: R.threshold, instances: (R.instances || []).map((i) => ({ component: nameOf.get(i.container) || i.container, node: i.node, status: i.status, rho: i.rho, lambda: i.lambda, out: i.out, sessions: i.sessions, replicas: i.replicas, capacityPerReplica: i.capacityPerReplica })), findings: (R.findings || []).map((x) => Object.assign({}, x, { component: nameOf.get(x.container) || x.container })), breakpoints: (R.breakpoints || []).map((b) => Object.assign({}, b, { component: nameOf.get(b.container) || b.container })), summary: R.summary || null }; }
    catch (e) { missing.push(`simulation: ${e.message}`); }
  }
} else missing.push('no visualizations/*.scene.json — deployment inventory and load model not available (run the command center once)');

// what the other lenses already registered on each component (latest report per lens on disk)
const aDir = path.join(root, 'analysis');
const priorFindings = {};
if (exists(aDir)) Object.values(SEV_LENSES).forEach((slug) => { const f = fs.readdirSync(aDir).filter((n) => new RegExp(`^${slug}-\\d{4}-\\d{2}-\\d{2}\\.md$`, 'i').test(n)).sort().pop(); if (!f) return; try { const r = F.extractMarkdown(read(path.join(aDir, f)), slug); priorFindings[slug] = { file: `analysis/${f}`, items: r.items.map((it) => ({ id: it.id, label: it.label, severity: it.severity || null })) }; } catch (e) { /* unreadable report: not a finding source */ } });

// stores, vendors, versions
const isStore = (c) => /database|db\b|cache|cach.|store|storage|almac|bucket|broker|topic|t.pico|queue|cola|kafka|redis|couchbase|postgres|mongo|blob|s3\b/i.test(`${c.type || ''} ${(c.technology || []).join(' ')} ${c.name}`);
const VENDORS = [[/azure|aks|apim|front door|key vault|cosmos|entra|microsoft|\.net|sql server|power bi|sentinel|devops/i, 'Microsoft Azure'], [/\baws\b|amazon|eks|\bs3\b|lambda|dynamo|kinesis|cloudfront/i, 'AWS'], [/confluent/i, 'Confluent'], [/kafka/i, 'Apache Kafka (open source)'], [/couchbase/i, 'Couchbase'], [/auth0|okta/i, 'Okta (Auth0)'], [/oracle/i, 'Oracle'], [/\bibm\b|datapower|db2|websphere/i, 'IBM'], [/openshift|red ?hat|rhel/i, 'Red Hat'], [/stratio/i, 'Stratio'], [/dynatrace/i, 'Dynatrace'], [/akamai/i, 'Akamai'], [/appdome/i, 'Appdome'], [/google|gcp|firebase|android/i, 'Google'], [/apple|ios|swift/i, 'Apple'], [/salesforce/i, 'Salesforce'], [/\bsap\b/i, 'SAP'], [/mongodb|atlas/i, 'MongoDB'], [/postgres|redis|nginx|node\.?js|java\b|spring|kotlin|python|react|angular|linux|kubernetes|helm|terraform|flink|graphql|apollo/i, 'Open source / community']];
const vendorOf = (t) => (VENDORS.find(([re]) => re.test(t)) || [null, 'Unknown / not documented'])[1];
const techRows = []; comps.forEach((c) => (c.technology || []).forEach((t) => techRows.push({ component: c.name, technology: t, vendor: vendorOf(t), version: (String(t).match(/\d+(?:\.\d+)+|\b(?:v|version )\d+\b/i) || [null])[0] })));
const vendors = {}; techRows.forEach((r) => { vendors[r.vendor] = vendors[r.vendor] || { technologies: new Set(), components: new Set() }; vendors[r.vendor].technologies.add(r.technology); vendors[r.vendor].components.add(r.component); });
const vendorTable = Object.entries(vendors).map(([v, e]) => ({ vendor: v, technologies: [...e.technologies], components: [...e.components], share: comps.length ? +(e.components.size / comps.length * 100).toFixed(0) : 0 })).sort((a, b) => b.components.length - a.components.length);

// ---------------------------------------------------------------- per-lens payload
const lang = (facts.architecture || {}).language || 'en';
const adrs = facts.adrs || [], tdrs = facts.tdrs || [], layers = facts.layers || [], demand = facts.demand || [];
const factsMd = {
  components: () => table(['#', 'Component', 'Level', 'Type', 'System', 'Technology', 'Version', 'Capacity', 'File'], comps.map((c, i) => [i + 1, `\`${c.name}\``, c.level || '', c.type || '', c.system || '', (c.technology || []).join(', ') || ND, c.component_version || c.version || ND, c.capacity ? `replicas ${c.capacity.replicas ?? ND} · max ${c.capacity.max_replicas ?? ND} · per replica ${c.capacity.capacity_per_replica_rps ?? c.capacity.capacity_per_replica_sessions ?? ND}` : 'no Capacity table', c.file || ''])),
  systems: () => table(['System', 'Type', 'File'], systems.map((s) => [`\`${s.name}\``, s.type || '', s.file || ''])),
  layers: () => table(['Layer', 'Containers', 'Owned'], layers.map((l) => [l.name || l.id || '', Array.isArray(l.containers) ? l.containers.join(', ') : l.containers || '', l.owned == null ? '' : l.owned ? 'Yes' : 'No'])),
  integrations: () => table(['ID', 'From', 'To', 'Protocol', 'Pattern', 'Direction read as', 'Boundary', 'Retired'], (facts.integrations || []).map((i) => [i.id, `\`${canon(i.from)}\``, `\`${canon(i.to)}\``, i.protocol || ND, i.pattern || ND, i.retired ? '' : readingOf(dirById.get(i.id)), i.boundary || '', i.retired ? 'yes' : '']))
    + (uncertainRows.length ? `\n\n**Direction not stated** — ${uncertainRows.length} row${uncertainRows.length === 1 ? '' : 's'} the judge could not settle from the Pattern and Protocol cells; ${uncertainRows.length === 1 ? 'it has' : 'they have'} no direction, ${uncertainRows.length === 1 ? 'is' : 'are'} left out of the edges, metrics and cycles below, and the report names each as a docs/05 gap: ${uncertainRows.map(rowId).join(', ')}` : '')
    + (undecidedRows.length ? `\n\n**Direction undecided** — ${undecidedRows.length} row${undecidedRows.length === 1 ? '' : 's'} the judge has not answered${judged.pending ? ` (worksheet: ${judged.pending})` : ''}; ${undecidedRows.length === 1 ? 'it has' : 'they have'} no direction and ${undecidedRows.length === 1 ? 'is' : 'are'} left out of the edges, metrics and cycles below — the graph is incomplete until the judge answers and this payload is cut again: ${undecidedRows.map(rowId).join(', ')}` : ''),
  edges: () => table(['From', 'To', 'Read as', 'By', 'Via', 'Source'], edges.map((e) => [`\`${e.from}\``, `\`${e.to}\``, (e.kind === 'data' ? 'data: To depends on From' : 'call: From depends on To'), e.source === 'docs/05' ? e.by + (e.confidence != null ? ` ${e.confidence}` : '') : 'descriptor line', e.via, e.source])),
  metrics: () => table(['Component', 'In corpus', 'Fan-in', 'Fan-out', 'Instability', 'Direct dependents', 'Indirect dependents', 'Blast fan-out', 'Depth'], metrics.map((m) => [`\`${m.component}\``, m.documented ? 'yes' : 'edge only', m.fanIn, m.fanOut, m.instability == null ? ND : m.instability, m.directDependents.map((d) => `\`${d}\``).join(', ') || '—', m.indirectDependents.map((d) => `\`${d}\``).join(', ') || '—', m.blastFanOut, m.depth])),
  cycles: () => (cycles.length ? cycles.map((c, i) => `${i + 1}. ${c.path.map((n) => `\`${n}\``).join(' → ')}`).join('\n') : '_none detected over the documented edges_') + (systemDeps.length ? '\n\n**System-level dependency lines** (from the L1 descriptors — the system\'s, never its containers\')\n\n' + table(['System', 'Relation', 'Other', 'Source'], systemDeps.map((d) => [`\`${d.system}\``, d.relation, `\`${d.other}\``, d.source])) : ''),
  flows: () => [table(['Flow', 'Name', 'Use cases', 'Phases', 'Target', 'Governed by'], flows.map((f) => [f.code, f.name, (f.use_cases || []).join(', '), (f.phases || []).join(', '), f.latency_target || ND, (f.governed_by || []).join(', ')])), '', '**Each flow\'s own block from docs/04** — its breakdown of the target, its delta and its governing decisions; the phase budgets of the Phases table below are the other half of the accounting, and a phase\'s budget line can declare that it runs outside the flow\'s budget. Never add phase budgets as if they were serial: the block states the accounting.', '', ...latency.map((l) => l.block ? `<!-- flow ${l.code} block -->\n${l.block}\n` : `_Flow ${l.code} (${l.name}): no block in docs/04 — flow-check names this gap._\n`), ...(budgetSections.length ? ['**Budget and latency sections of docs/04** — the accounting the flows point at, whole', '', ...budgetSections.map((b) => b + '\n')] : [])].join('\n'),
  phases: () => table(['Phase', 'Name', 'Critical', 'Hops', 'Hop count', 'Budget', 'Failure mode'], phases.map((p) => [p.n, p.name, p.critical || '', p.hops || ND, p.hops ? p.hops.split(/\s*(?:→|->)\s*/).length - 1 : ND, p.latency_budget || ND, p.failure_mode || ''])),
  demand: () => table(['Use case', 'Phase', 'Value', 'Unit', 'rps', 'Peak factor', 'Source'], demand.map((d) => [d.use_case, d.phase || '', d.value ?? ND, d.unit || '', d.rps ?? '', d.peak_factor ?? '', d.source || ''])),
  tdrs: () => table(['TDR', 'Title', 'Status', 'File'], tdrs.map((t) => [t.id, t.title, t.status || '', t.file])),
  adrs: () => table(['ADR', 'Title', 'Status', 'Scope'], adrs.map((a) => [a.id, a.title || '', a.status || '', a.scope || ''])),
  deployment: () => !deployment ? `_${ND} — no scene with a deployment block_` : [`Source: \`${deployment.file}\`\n`, '**Containers on nodes**\n', table(['Component', 'Instances', 'Nodes', 'Trust zones', 'Replicas (declared)'], deployment.containers.map((c) => [`\`${c.component}\``, c.instances, c.nodes.join(', '), c.zones.join(', '), c.replicas.join(', ') || ND])), '\n**Nodes**\n', table(['Node', 'Kind', 'Inside', 'Tier', 'Trust zone', 'Technology'], deployment.nodes.map((n) => [n.name, n.kind || '', n.parent || '—', n.tier ?? '', n.trustZone || ND, n.tech || ''])), '\n**Paths**\n', table(['A', 'B', 'Transport', 'Path class', 'Auth'], deployment.paths.map((p) => [p.a, p.b, p.transport || ND, p.pathClass || ND, p.auth || ND]))].join('\n'),
  sim: () => !sim ? `_${ND} — ${scene ? (SIM ? 'the scene has no capacity block' : 'simulation.js not available') : 'no scene'}_` : [`Threshold ρ ≥ ${sim.threshold} is at the limit; ρ ≥ 1 a chokepoint; \`grey\` receives load with no documented capacity (pending); \`idle\` receives nothing.\n`, table(['Component', 'Node', 'Status', 'ρ', 'λ in (rps)', 'out (rps)', 'Replicas', 'Capacity / replica'], sim.instances.map((i) => [`\`${i.component}\``, i.node || '—', i.status, i.rho ?? '', i.lambda ?? '', i.out ?? '', i.replicas ?? ND, i.capacityPerReplica ?? ND])), '\n**Model findings**\n', table(['Kind', 'Component', 'Detail'], sim.findings.map((x) => [x.kind, `\`${x.component}\``, x.kind === 'chokepoint' || x.kind === 'at-limit' ? `ρ ${x.rho} · λ ${x.load} · ${x.replicas} replicas · needs ${x.needed}${x.scaleLimit ? ` (over max ${x.max})` : ''}` : x.kind === 'not-documented' ? `receives λ ${x.lambda ?? ''} — missing ${(x.missing || []).join(' + ')}` : x.kind === 'demand-gap' ? `${x.useCase}${x.phase ? ' · F' + x.phase : ''}: no demand row` : JSON.stringify(x)])), '\n**Breakpoints** (the scale at which each sized container saturates)\n', table(['Component', 'Breaks at ×', 'ρ now'], sim.breakpoints.map((b) => [`\`${b.component}\``, b.breakAt ?? b.scale ?? '', b.rho ?? '']))].join('\n'),
  stores: () => table(['#', 'Component', 'Type', 'Technology', 'System'], comps.filter(isStore).map((c, i) => [i + 1, `\`${c.name}\``, c.type || '', (c.technology || []).join(', '), c.system || ''])),
  vendors: () => [table(['Vendor', 'Components', 'Share of containers', 'Technologies'], vendorTable.map((v) => [v.vendor, v.components.map((c) => `\`${c}\``).join(', '), `${v.share} %`, v.technologies.join(', ')])), '\n**Technology per component**\n', table(['Component', 'Technology', 'Vendor', 'Version in the name'], techRows.map((r) => [`\`${r.component}\``, r.technology, r.vendor, r.version || ND]))].join('\n'),
  prior: (lens) => { const ents = Object.entries(priorFindings).filter(([slug]) => slug !== SEV_LENSES[lens]); if (!ents.length) return '_no earlier report on disk_'; const byComp = new Map(); ents.forEach(([slug, r]) => r.items.forEach((it) => { const k = it.label; const e = byComp.get(k) || []; e.push(`${it.id} (${slug}${it.severity ? ', ' + it.severity : ''})`); byComp.set(k, e); })); return [ents.map(([slug, r]) => `- ${slug}: \`${r.file}\` (${r.items.length} findings)`).join('\n'), '', table(['Component', 'Findings already registered'], [...byComp.entries()].map(([c, ids]) => [`\`${c}\``, ids.join(', ')]))].join('\n'); },
};
// what each lens gets from the ledger and the derived metrics
const PARTS = {
  'spof': ['components', 'systems', 'layers', 'integrations', 'deployment', 'sim', 'metrics', 'tdrs', 'adrs', 'prior'],
  'blast-radius': ['components', 'integrations', 'edges', 'metrics', 'cycles', 'flows', 'phases', 'deployment', 'tdrs', 'adrs', 'prior'],
  'bottleneck': ['components', 'integrations', 'metrics', 'demand', 'sim', 'flows', 'adrs', 'prior'],
  'cost-hotspots': ['components', 'systems', 'vendors', 'deployment', 'adrs', 'prior'],
  'stride': ['components', 'systems', 'integrations', 'deployment', 'stores', 'adrs', 'prior'],
  'vendor-lockin': ['components', 'systems', 'vendors', 'integrations', 'adrs', 'prior'],
  'latency-budget': ['components', 'flows', 'phases', 'demand', 'sim', 'adrs', 'prior'],
  'tech-debt': ['components', 'vendors', 'tdrs', 'adrs', 'prior'],
  'coupling': ['components', 'systems', 'integrations', 'edges', 'metrics', 'cycles', 'layers', 'prior'],
  'data-sensitivity': ['components', 'stores', 'integrations', 'flows', 'deployment', 'adrs', 'prior'],
};
const PART_TITLES = { components: 'Components (component-cli facts; the canonical names)', systems: 'Systems (L1)', layers: 'Layers (docs/03 § 4.1)', integrations: 'Integrations (docs/05 I-nn rows)', edges: 'Dependency edges (docs/05 rows + the file-backed descriptors\' Depends on / Consumed by / Calls lines) with the direction each was read in — docs/05 declares no direction column, so a row whose From/To is the data\'s direction (an event, a replication, a pull) is read as such by its Pattern text; a wrong reading is a docs/05 gap worth reporting', metrics: 'Graph metrics — a first reading, computed over the edges as read (dependents of X are the callers of its call edges and the receivers of its data edges; blast fan-out counts them transitively). An edge read in the wrong direction inverts a row: confirm the direction of every edge you cite from the documents', cycles: 'Dependency cycles (computed)', flows: 'Flows (docs/04 Flow Inventory) and each flow\'s own block — the accounting of its target is stated there, never summed from the phases', phases: 'Phases (docs/04 Phase Catalog)', demand: 'Demand by use case (docs/08)', tdrs: 'Technical debt records (tdr/)', adrs: 'Architecture decision records (adr/)', deployment: 'Deployment inventory (the command center scene)', sim: 'Load model (simulation.js over the scene\'s capacity block — the documented base, scale ×1)', stores: 'Data stores, caches and brokers (by component type and technology)', vendors: 'Technologies by vendor (vendor registry built into this script — a guess to confirm, never a finding)', prior: 'What the other lenses already registered (latest report per lens on disk)' };

// Claude Code's Read returns at most 25,000 tokens per call; these files run ~2.1 bytes a token (UTF-8 Spanish, tables),
// so a payload or documents bundle is cut into parts of at most PART_BYTES — each read whole, in one call, in order.
// A part ends at a heading or a blank line outside a code fence where one exists in its second half.
const PART_BYTES = 38000;
const bytes = (t) => Buffer.byteLength(t, 'utf8');
function splitParts(text, cap = PART_BYTES) {
  const total = bytes(text);
  if (total <= cap) return [text];
  // balanced parts, so the last one is not a scrap; a cut that lands late spills into one more part at most
  const target = Math.min(cap, Math.ceil((total / Math.ceil(total / cap)) * 1.1));
  const lines = text.split('\n'), parts = [];
  let start = 0, size = 0, lastBreak = -1, breakSize = 0, fence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], add = bytes(l) + 1;
    if (size + add > target && i > start) {
      // cut before the last heading / blank line past the part's half, by bytes; else right here
      const cut = lastBreak > start && breakSize > target / 2 ? lastBreak : i;
      parts.push(lines.slice(start, cut).join('\n'));
      size = lines.slice(cut, i).reduce((n, x) => n + bytes(x) + 1, 0); start = cut; lastBreak = -1;
    }
    if (!fence && i > start && (/^#{1,4} /.test(l) || l === '')) { lastBreak = i; breakSize = size; }
    if (/^\s*```/.test(l)) fence = !fence;
    size += add;
  }
  parts.push(lines.slice(start).join('\n'));
  // a scrap left by a late cut joins the part before it when the two fit
  if (parts.length > 1 && bytes(parts[parts.length - 2]) + bytes(parts[parts.length - 1]) + 1 <= cap) parts.splice(-2, 2, parts.slice(-2).join('\n'));
  return parts;
}
// writes <base>.md (part 1) and <base>-2.md … ; removes parts a larger earlier run left behind
function writeParts(dir, base, chunks, label) {
  const name = (i) => (i ? `${base}-${i + 1}.md` : `${base}.md`);
  fs.readdirSync(dir).filter((f) => new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+\\.md$`).test(f)).forEach((f) => fs.rmSync(path.join(dir, f)));
  return chunks.map((c, i) => {
    const p = path.join(dir, name(i));
    const head = chunks.length > 1 ? `<!-- ${label} — part ${i + 1} of ${chunks.length}: read it whole, in one Read call with no offset or limit -->\n\n` : '';
    const tail = i < chunks.length - 1 ? `\n\n<!-- continues in ${path.join(dir, name(i + 1))} -->\n` : '';
    fs.writeFileSync(p, head + c + tail);
    return { path: p, bytes: bytes(head + c + tail) };
  });
}
// The Design Language Standard the specs refer to, cut from the edition of doc_language — the agent never opens it
const PACKS = require(fromSaSkills('scripts', 'shared', 'packs.js'));
const DESIGN_LANGUAGE = PACKS.designLanguageDir() || PACKS.BUNDLED['design-language'];   // the folder in force — an institution pack's, else the base's own (scripts/shared/packs.js);   // optional: the Design Language Standard; absent, the payload says fallback mode
function designLanguageMd(spec, lang) {
  if (!/design-language|llms-(rules|mermaid)/.test(spec)) return '';
  const ed = lang === 'es' && exists(path.join(DESIGN_LANGUAGE, 'es', 'llms-rules.txt')) ? path.join(DESIGN_LANGUAGE, 'es') : DESIGN_LANGUAGE;
  const rules = path.join(ed, 'llms-rules.txt');
  if (!exists(rules)) return ['## Design Language Standard', '', '**Mode: fallback** — the standard is not bundled with this install. Every spec instruction conditioned on `llms-rules.txt` or `llms-mermaid.txt` existing does not apply; do not look for the files.', ''].join('\n');
  const src = read(rules), version = (src.match(/Versi[oó]n (v[\d.]+)/) || [])[1] || 'version not stamped';
  const out = ['## Design Language Standard', '', `**Mode: governed** — ${version}, edition \`${path.basename(ed) === 'es' ? 'es' : 'en'}\`. Every spec instruction conditioned on \`llms-rules.txt\` or \`llms-mermaid.txt\` existing applies. Where the spec says to read the standard, the extract below is that text — do not open files in the plugin directories.`, ''];
  if (/llms-rules\.txt[^\n]*§6|§6 tag taxonomy/.test(spec)) { const m = src.match(/^## 6[. ][\s\S]*?(?=^## 7[. ])/m); if (m) out.push('### §6 of `llms-rules.txt`, verbatim', '', m[0].replace(/^(#+) /gm, '#$1 ').trim(), ''); }
  return out.join('\n');
}

function stripSections(spec, titles) { const lines = spec.split('\n'); const outL = []; let skip = false; lines.forEach((l) => { const h = l.match(/^## (.+)$/); if (h) skip = titles.some((t) => t.test(h[1])); if (!skip) outL.push(l); }); return outL.join('\n'); }

const manifest = { generated_at: new Date().toISOString(), project_root: root, today, format, lenses: {}, missing,
  judge: { engine: judged.engine, rows: rowsToJudge.length, uncertain: uncertainRows.map(rowId), undecided: undecidedRows.map(rowId), pending: judged.pending || null, note: judgeNote, names: { ...nameReport, note: nameNote } } };
fs.mkdirSync(outDir, { recursive: true });
lenses.forEach((lens) => {
  const plan = JSON.parse(read(path.join(SKILL, 'analyses', 'plans', `${lens}.json`)));
  const specPath = path.join(SKILL, 'analyses', plan.specFile);
  // the spec's path to the bundled standard becomes a pointer into this payload's own Design Language section
  const spec = stripSections(read(specPath), [/^Report Sections/i, /^Gold-Standard Report Structure/i])
    .replace(/`\[(?:(?:sa_skills_dir|plugin_dir)\]\/skills\/architecture-docs\/references\/design-language|design_language_dir\])\/(llms-[a-z]+\.txt)`/g, '`$1` (its text is in § Design Language Standard below)');
  // explorer excerpts
  let excerpts = '_explorer unavailable_', exStats = null;
  try { const r = explore(root, { query: VOCAB[lens], surface: 'docs' }); exStats = { status: r.status, files: r.total_files_matched, matches: r.total_matches }; if (r.status === 'OK') excerpts = (r.files || []).map((f) => `**${f.file}** — ${f.matched_terms.length} term(s)\n` + f.matches.slice(0, 5).map((m) => `- L${m.line} · ${m.heading}: ${String(m.excerpt).replace(/\s+/g, ' ').trim().slice(0, 220)}`).join('\n')).slice(0, 16).join('\n\n') || '_no match_'; else excerpts = `_explorer FAILED: ${r.reason || ''}_`; } catch (e) { excerpts = `_explorer error: ${e.message}_`; }
  // docs bundle
  const docFiles = ['ARCHITECTURE.md'].concat(plan.docs || []);
  const docParts = [], docMissing = [];
  docFiles.forEach((d) => { const p = path.join(root, d); if (exists(p)) docParts.push(`<!-- FILE: ${d} -->\n\n${read(p).trim()}\n`); else docMissing.push(d); });
  const docsMd = `# Documents for the ${plan.slug} analysis\n\n${docFiles.map((d) => `- \`${d}\`${docMissing.includes(d) ? ' — **missing**' : ''}`).join('\n')}\n\n---\n\n${docParts.join('\n---\n\n')}`;
  const docFilesOut = writeParts(outDir, `${lens}.docs`, splitParts(docsMd), `${plan.slug} documents`);
  const docsPath = docFilesOut[0].path;
  const docLines = docsMd.split('\n').length;
  // plan as a table
  const planMd = table(['Order', 'Section', 'Anchor', 'Kind', 'Columns', 'Id', 'Omit when empty', 'Note'], plan.sections.map((s, i) => [i + 1, (s.title && (s.title[lang] || s.title.en)) || s.kind, s.key, s.kind, (s.columns || []).join(' · ') || (s.kind === 'heatmap' ? `${s.axes.y.label} × ${s.axes.x.label} (${s.axes.y.n}×${s.axes.x.n})` : s.kind === 'chart' ? `from ${s.from}` : ''), s.id || '', s.omitWhenEmpty ? 'yes' : '', s.note || '']));
  const fillPath = path.join(outDir, `${lens}.fill.json`);
  const renderCmd = `bun ${path.join(SKILL, 'scripts', 'render-analysis.js')} ${fillPath} --project ${root} --format ${format} --today ${today}`;
  const A = facts.architecture || {};
  const header = [
    `# ${plan.slug} analysis — payload`, '',
    `| Field | Value |`, `|---|---|`, `| Project | ${A.name || ND} |`, `| Version | ${A.version || ND} |`, `| Status | ${A.status || ND} |`, `| Architecture type | ${A.type || ND} |`, `| doc_language | ${lang} |`, `| Today | ${today} |`, `| Output | \`analysis/${plan.slug}-${today}.${format}\` |`, `| Fill | \`${fillPath}\` |`, '', '{{PARTS}}', '',
    '## Contract', '',
    `Read the payload parts, then the documents parts, in the order of the reading list above — each whole, in one Read call with no offset or limit. Judge, then write the fill at the path above. The skeleton below and the plan table are the whole fill format; everything the judgement needs is in these files — never open a file in the plugin directories. Do not write the report: run`, '', '```bash', renderCmd, '```', '',
    'The fill is one JSON object with exactly these top-level keys:', '', '```json', JSON.stringify({ lens, language: lang, today, project: { name: A.name || '', version: A.version || '', status: A.status || '', source: 'ARCHITECTURE.md' }, summary: ['<paragraph 1>', '<paragraph 2>'], sections: { '<anchor of a table section>': { rows: [{ id: '<id in the section scheme>', cells: { '<every column of the section>': '<text>' } }] }, '<anchor of an inventory>': { rows: [{ cells: {} }] }, '<anchor of a matrix>': { groups: [{ id: 'TB-01', title: '<boundary>', header: { 'Auth Mechanism': '', Data: '' }, rows: [{ id: 'T1-S', cells: {} }, { id: '—', cells: { Status: '✅ Pass' } }] }] }, '<anchor of blocks>': { blocks: [{ title: '', text: '', mermaid: '', table: { columns: [], rows: [] } }] }, '<anchor of a text section>': { text: '' }, '<anchor of strengths>': { items: [] }, '<anchor to omit>': { omit: true } }, heatmap: [{ id: '<id>', x: 1, y: 1 }], recommendations: [{ id: '<id>', title: '', body: '', source: '' }], verdict: '<one paragraph>', gaps: [{ subject: '', missing: '', where: '' }], citations: ['ARCHITECTURE.md'], viz: '<HTML mode, blast-radius and data-sensitivity only>' }, null, 2), '```', '',
    'Keep `lens`, `language`, `today` and `project` as printed. `summary` is an array of paragraphs. Only the anchors of the plan table below may appear under `sections`, each in the shape its kind takes. The renderer prints the report path and the findings-contract check; on `✗` fix the fill it names and run again (cap 2). Then return the SECTION summary. Rules: canonical component names as the Components table spells them; `Not documented` where the corpus is silent — never an assumption; every row cites its source (`docs/NN § x.y`, `adr/ADR-NNN`, the ledger table); rows in the language `doc_language` says, column names and ids never localized.', '',
    '## Plan — the report\'s shape', '', `Ids: ${plan.idForms}. Top ${plan.topN} recommendations.`, '', planMd, '',
    '## Spec — the classification rules', '', spec.trim(), '',
    designLanguageMd(spec, lang),
    '## Facts and derived metrics', '',
    ...PARTS[lens].flatMap((part) => [`### ${PART_TITLES[part]}`, '', part === 'prior' ? factsMd.prior(lens) : factsMd[part](), '']),
    missing.length ? `### Inputs not available\n\n${missing.map((m) => `- ${m}`).join('\n')}\n` : '',
    '## Explorer excerpts — where the lens\'s vocabulary appears in the documents', '', `Query terms: \`${VOCAB[lens]}\``, '', excerpts, '',
    '## Next: the documents parts of the reading list', '',
  ].join('\n');
  // the reading list goes into part 1; reserve its room before cutting
  const chunks = splitParts(header.replace('{{PARTS}}', 'x'.repeat(1500)));
  const payloadNames = chunks.map((_, i) => path.join(outDir, i ? `${lens}.payload-${i + 1}.md` : `${lens}.payload.md`));
  const readingList = ['**Reading list** — each file whole, one Read call each, no offset or limit, in this order:', '', ...payloadNames.map((p, i) => `${i + 1}. \`${p}\` — payload${chunks.length > 1 ? ` part ${i + 1} of ${chunks.length}` : ''}`), ...docFilesOut.map((d, i) => `${payloadNames.length + i + 1}. \`${d.path}\` — documents${docFilesOut.length > 1 ? ` part ${i + 1} of ${docFilesOut.length}` : ''}, ${kb(d.bytes)}`)].join('\n');
  chunks[0] = chunks[0].replace('x'.repeat(1500), readingList);
  const payloadFilesOut = writeParts(outDir, `${lens}.payload`, chunks, `${plan.slug} payload`);
  const payloadPath = payloadFilesOut[0].path;
  fs.writeFileSync(path.join(outDir, `${lens}.facts.json`), JSON.stringify({ lens, today, project: { name: A.name, version: A.version, status: A.status, language: lang }, components: comps, edges, undirected: rowReadings.filter((e) => !e.kind), systemDeps, metrics, cycles, latency, budgetSections, deployment, sim, vendors: vendorTable, techRows, prior: priorFindings, docs: docFiles, docMissing }, null, 2));
  manifest.lenses[lens] = { payload: rel(payloadPath), payloadBytes: bytes(header), payloadParts: payloadFilesOut.map((f) => rel(f.path)), docs: rel(docsPath), docsBytes: bytes(docsMd), docsParts: docFilesOut.map((f) => rel(f.path)), maxPartBytes: Math.max(...payloadFilesOut.concat(docFilesOut).map((f) => f.bytes)), docLines, docMissing, explorer: exStats, fill: rel(fillPath), output: `analysis/${plan.slug}-${today}.${format}` };
});
fs.writeFileSync(path.join(outDir, '_run.json'), JSON.stringify(manifest, null, 2));
if (jsonOut) console.log(JSON.stringify(manifest, null, 2));
else {
  console.log(`analysis-prepare: ${lenses.length} lens(es) · ${comps.length} components · ${edges.length} edges · ${flows.length} flows · ${deployment ? deployment.containers.length + ' placed containers' : 'no deployment'} · ${sim ? sim.findings.length + ' load-model findings' : 'no load model'}`);
  console.log(`  ${'lens'.padEnd(18)} ${'payload'.padStart(9)} ${'docs'.padStart(9)} ${'lines'.padStart(6)}  explorer`);
  Object.entries(manifest.lenses).forEach(([l, m]) => console.log(`  ${l.padEnd(18)} ${kb(m.payloadBytes).padStart(9)} ${kb(m.docsBytes).padStart(9)} ${String(m.docLines).padStart(6)}  ${m.explorer ? `${m.explorer.status} · ${m.explorer.files} files · ${m.explorer.matches} matches` : '—'}${m.docMissing.length ? ` · missing ${m.docMissing.join(', ')}` : ''}`));
  if (missing.length) console.log(`  not available: ${missing.join('; ')}`);
  if (rowsToJudge.length) console.log(`  edge direction: ${rowsToJudge.length} docs/05 rows · ${judged.engine}${uncertainRows.length ? ` · ${uncertainRows.length} not stated (${uncertainRows.map(rowId).join(', ')})` : ''}${undecidedRows.length ? ` · ${undecidedRows.length} undecided, left out of the graph (${undecidedRows.map(rowId).join(', ')})` : ''}`);
  if (judgeNote) console.log(`  ${judgeNote}`);
  if (nameCells.length) console.log(`  names: ${nameCells.length} resolved by ${nameReport.engine}${nameReport.undecided.length ? ` · ${nameReport.undecided.length} undecided (kept as written): ${nameReport.undecided.join('; ')}` : ''}${nameReport.unresolved.length ? ` · ${nameReport.unresolved.length} not a documented component: ${nameReport.unresolved.join('; ')}` : ''}${nameReport.review.length ? `\n  names to confirm:\n${nameReport.review.map((w) => '    - ' + w).join('\n')}` : ''}`);
  if (nameNote) console.log(`  ${nameNote}`);
}
