#!/usr/bin/env node
// principle-check.js — the Section 3 Enforcement Gate, Layer 1, as code.
//
//   bun principle-check.js <project-root> [--file docs/02-architecture-principles.md] [--type <architecture type id>] [--json]
//                          [--judge agent|typesafe|clef]   Layer 1.5: every BLOCKING finding of a lexicon-shaped rule re-read by the judge (else SA_JUDGE)
//                          [--stamp-review PASS|WARNING]   after Layer 2: record its outcome in the file, held to the principles' hash
//
// The stamp (8.139.0) is `<!-- PRINCIPLE_REVIEW: <layer2> <date> sha256:<12 hex> -->`, the file's last line. It is written only
// when Layer 1 passes, and the hash covers the file without the stamp, so any later edit of the principles voids it. The
// release (`architecture-lifecycle`) reads it: a review is known to have run on the principles being released, not on an
// earlier version of them.
//
// PRINCIPLE_VALIDATION.md carried sixteen `P-*` rules as grep commands "executed by the model". Every run then
// transcribed them again: the first editor run (8.31.0) wrote a 139-line script into its scratchpad to run
// Layer 1, and a rule that is rewritten per run is not the same rule twice. This is the one implementation;
// PRINCIPLE_VALIDATION.md documents what it enforces and stays the reference for the fix text.
//
// What is read: the principles file (blocks by `PRINCIPLE:` anchor, subsections by `LABEL:` anchor — the English
// visible forms are the fallback for a legacy document), `docs/03` for `ARCHITECTURE_TYPE` (else `--type`, else
// `.cache/sa-skills/collect.json`, else unknown), `docs/01` + `docs/components/` for the async evidence P10 needs,
// `adr/` for the ids the citations must resolve to. Lexicons carry both languages: the document is authored in
// `doc_language`, and a Spanish Trade-offs that says "deuda" or "guardia" names a cost as plainly as "debt".
//
// Every finding names the principle, the subsection and a line, so a fix is an edit at that line — never a
// rewrite of the file. Exit 1 on a BLOCKING finding; WARNINGs report and never block.
'use strict';
const fs = require('fs');
const path = require('path');

const CANON = ['Separation of Concerns', 'High Availability', 'Scalability First', 'Security by Design', 'Observability', 'Resilience', 'Simplicity', 'Cloud-Native', 'Open Standards', 'Decouple Through Events'];
const archTypes = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'arch-types.js'));
const LABELS = ['Description', 'Implementation', 'Trade-offs'];
const VISIBLE = { Description: /^\*\*(Description|Descripción):\*\*/, Implementation: /^\*\*(Implementation|Implementación):\*\*/, 'Trade-offs': /^\*\*(Trade-offs|Compromisos|Contrapartidas):\*\*/ };

// unicode-aware word boundaries — JS `\b` is ASCII and misses "días" / "cómputo"
const word = (alts, flags = 'iu') => new RegExp(`(?<!\\p{L})(?:${alts})(?!\\p{L})`, flags);

// ── lexicons (PRINCIPLE_VALIDATION.md § Rule Reference, with the Spanish forms the same rule needs) ──
const LEX = {
  placeholder: /\[(to be defined|tbd|placeholder|fixme|your [a-z]+|describe [a-z]+|por definir|pendiente)\]|<TODO>|TODO:|XXX/i,
  platitude: word('industry best practices?|industry standard|we follow best practices|we will be (?:scalable|secure|reliable|maintainable|observable)|as needed|enterprise-grade|world-class|state of the art|where applicable|as appropriate|robust solution|cutting edge|battle[- ]tested|future[- ]proof|mejores prácticas|estándar(?:es)? de la industria|de clase mundial|según corresponda|cuando aplique|según (?:se )?requiera|solución robusta|a prueba de futuro|de última generación'),
  // P-SPECIFIC-01 tokens 2–6: version, percentage, integer with unit, acronym, backtick path. ADR / TDR ids are citations, not system tokens.
  specific: /\b\d+\.\d+(?:\.\d+)?\b|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:ms|s|min|hr|h|GB|TB|MB|KB|RPS|TPS|QPS|nodes?|cores?|pods?|replicas?|MAU|DAU)\b|\b(?!ADR\b|TDR\b|TBD\b|TODO\b|XXX\b)[A-Z]{3,}\b|`[^`]+`/g,
  quant: word('\\d+(?:[.,]\\d+)?\\s*(?:%|x|ms|s|min|hr|h|days?|weeks?|months?|years?|días?|semanas?|mes(?:es)?|años?|RPS|TPS|QPS|GB|TB|MB|KB|req|nodes?|cores?|pods?|replicas?|engineers?|nines?|9s|FTE|ingenieros?)'),
  cost: word('infrastructure cost|licensing|licen[sc]e|on[- ]call|paging|RTO|RPO|cold start|warm[- ]up|vendor lock[- ]?in|debt|maintenance burden|operational burden|migration cost|training|head[- ]?count|capex|opex|egress fee|data transfer|storage cost|compute cost|costos?|costes?|licencias?|licenciad[oa]|guardia|deuda|carga operativa|carga de mantenimiento|costo de migración|migraci[oó]n|reescri\\w+|lock[- ]?in|dependencia del? proveedor|capacitación|egreso|transferencia de datos|almacenamiento|cómputo|consumo|sobrecost[oe]s?|overhead'),
  // P-TRADEOFF-GAP-01 (8.118.7): a bullet that says something is missing — not derived, not declared, not documented —
  // reports an open item, not a cost of the decision. It belongs in the writer's gaps and the risk register.
  gap: word('(?:has|have) not (?:yet )?been (?:derived|declared|documented|instrumented|defined|specified|sized|measured|classified|decided|agreed|quantified|checked|validated|verified|confirmed|reconciled|compared|assessed|estimated)|(?:is|are) not (?:yet )?(?:derived|declared|documented|instrumented|defined|specified|sized|measured|classified|decided|agreed|quantified)|not (?:yet )?documented|to be (?:defined|decided|determined|confirmed)|no (?:está|están|es|son) (?:aún |todavía )?(?:derivad|declarad|documentad|instrumentad|definid|especificad|dimensionad|medid|clasificad|decidid|acordad|cuantificad)[oa]s?|no se (?:ha|han) (?:aún |todavía )?(?:derivad|declarad|documentad|instrumentad|definid|especificad|dimensionad|medid|clasificad|decidid|acordad|cuantificad|contrastad|validad|verificad|confirmad|conciliad|comparad|evaluad|estimad)o|(?:aún|todavía) no se (?:conoce|define|mide|declara|deriva)|sin (?:clasificar|definir|dimensionar|documentar|derivar|medir|decidir|cuantificar|instrumentar)|por (?:definir|decidir|determinar|confirmar)|pendiente de (?:definir|definición|decisión|decidir|dimensionar|clasificar)'),
  negation: word('none|minimal|n/?a|no significant|negligible|not applicable|ninguno|ninguna|mínimos?|mínimas?|no aplica|insignificante|sin impacto'),
  outcome: word('\\d+(?:[.,]\\d+)?\\s*(?:%|nines?|9s|ms|s|RPS|TPS|QPS|RTO|RPO|SLA|SLO)'),
  decisionVerb: word('accept\\w*|prefer\\w*|prioriti[sz]\\w*|trade\\w*|choos\\w*|chose|defer\\w*|delegat\\w*|refus\\w*|favou?r\\w*|reject\\w*|requir\\w*|enforc\\w*|mandat\\w*|acept\\w*|prefier\\w*|prefer\\w*|prioriz\\w*|elig\\w*|elij\\w*|difier\\w*|deleg\\w*|rechaz\\w*|exig\\w*|oblig\\w*|requier\\w*|impon\\w*|sacrific\\w*|renunci\\w*|asum\\w*'),
  async: /kafka|rabbitmq|sqs|sns|eventbridge|pulsar|nats|kinesis|\bevent[- ]driven\b|\bqueue\b|\btopic\b|\bpubsub\b|\basync\b|\bsaga\b|\bcola\b|\bevento\b|\bas[ií]ncron/i,
  adrRef: /\[ADR-\d{3}|\(\.\.\/adr\/ADR-|per [Aa]DR-\d|<!--\s*NO_ADR_GOVERNS\s*-->|^> No ADR governs this aspect yet/m,
};

// P-CROSS-CONTRA-01 — curated pairs (principle numbers, Implementation blocks)
const CONTRA = [
  { a: 7, aRe: word('monolith\\w*|single binary|single service|single deployable|monolito|binario único'), b: 3, bRe: word('horizontal scaling per service|microservices?|service-per|database-per-service|microservicios?'), label: 'Principle 7 (Simplicity) ↔ Principle 3 (Scalability First)' },
  { a: 7, aRe: word('single binary|single deployment unit|binario único|unidad de despliegue única'), b: 8, bRe: word('serverless|FaaS|Lambda|Cloud Functions|microservices?|microservicios?'), label: 'Principle 7 (Simplicity) ↔ Principle 8 (Cloud-Native)' },
  { a: 9, aRe: word('vendor[- ]neutral|portable|cloud[- ]agnostic|agnóstic\\w*|portabilidad|neutral al proveedor'), b: 8, bRe: word('proprietary|vendor[- ]specific|managed-only|propietari\\w*|específic\\w* del proveedor'), label: 'Principle 9 (Open Standards) ↔ Principle 8 (Cloud-Native)' },
];

// P-TYPE-MATRIX-01 — PRINCIPLE_VALIDATION.md § Architecture-Type Matrix, plus the Spanish forms of the same concepts
const MATRIX = {
  MICROSERVICES: { 1: ['bounded context', 'service boundary', 'database-per-service', 'domain-driven', 'single responsibility per service', 'contexto acotado', 'frontera de servicio', 'base de datos por servicio'], 3: ['horizontal scaling per service', 'auto-scaling', 'Kubernetes HPA', 'KEDA', 'service replicas', 'stateless service', 'autoescalado', 'escalado horizontal', 'réplicas', 'sin estado'], 5: ['distributed trace', 'correlation id', 'OpenTelemetry', 'Jaeger', 'Zipkin', 'Tempo', 'service mesh telemetry', 'traza distribuida', 'id de correlación'], 6: ['circuit breaker', 'bulkhead', 'retry with backoff', 'timeout', 'dead-letter', 'DLQ', 'Resilience4j', 'Polly', 'Hystrix', 'Istio retry policy', 'reintento', 'tiempo de espera', 'cortacircuito'], 8: ['Kubernetes', 'service mesh', 'Istio', 'Linkerd', 'container', 'Helm', 'Ingress', 'contenedor'] },
  BIAN: { 1: ['service domain', 'BIAN', 'control record', 'service operation', 'business area', 'business domain', 'dominio de servicio', 'área de negocio', 'dominio de negocio'], 4: ['regulatory', 'compliance', 'audit log', 'PCI', 'SOX', 'GDPR', 'AML', 'KYC', 'PSD2', 'regulatori', 'cumplimiento', 'auditoría'], 5: ['regulatory reporting', 'audit trail', 'transaction log', 'compliance log', 'reporte regulatorio', 'pista de auditoría', 'registro de transacciones'], 9: ['BIAN v14.0.0', 'BIAN service landscape', 'ISO 20022', 'SWIFT', 'OpenAPI', 'Swagger'] },
  '3-TIER': { 1: ['presentation tier', 'application tier', 'data tier', 'no direct database access from presentation', 'tier boundary', 'capa de presentación', 'capa de aplicación', 'capa de datos', 'frontera de capa'], 3: ['stateless', 'session externalized', 'load balancer', 'tier independence', 'horizontal scaling', 'sin estado', 'balanceador', 'escalado horizontal'], 6: ['database failover', 'session affinity', 'connection pool', 'health check', 'tier-level circuit breaker', 'conmutación', 'afinidad de sesión', 'pool de conexiones'] },
  'N-LAYER': { 1: ['domain layer', 'application layer', 'infrastructure layer', 'ports and adapters', 'dependency inversion', 'clean architecture', 'hexagonal', 'capa de dominio', 'capa de aplicación', 'capa de infraestructura', 'puertos y adaptadores', 'inversión de dependencias'], 7: ['framework-free domain', 'pure domain', 'no infrastructure leak', 'single layer responsibility', 'dominio puro', 'dominio sin framework'], 9: ['dependency injection', 'interface segregation', 'solid principles', 'aggregate boundary', 'inyección de dependencias', 'principios SOLID'] },
  ENTERPRISE: { 1: ['channel layer', 'experience layer', 'process layer', 'domain service', 'system of record', 'bounded context', 'backend for frontend', 'BFF', 'capa de canal', 'capa de experiencia', 'capa de procesos', 'servicio de dominio', 'servicios de dominio', 'sistema de registro', 'sistemas de registro', 'contexto acotado'], 6: ['circuit breaker', 'retry', 'timeout', 'saga', 'compensat', 'idempoten', 'dead-letter', 'DLQ', 'reintent', 'tiempo de espera', 'compensaci', 'cortacircuito'], 9: ['OpenAPI', 'AsyncAPI', 'OAuth 2', 'OpenID Connect', 'CloudEvents', 'JSON Schema'] },
};

// ── parsing ──
function parse(text) {
  const lines = text.split('\n');
  const heads = [];
  lines.forEach((l, i) => {
    let m = l.match(/^###\s+(?:(\d+)\.|3\.(\d+))\s+(.*?)\s*<!--\s*PRINCIPLE:\s*([^>]*?)\s*-->\s*$/);
    if (m) { heads.push({ line: i + 1, num: parseInt(m[1] || m[2], 10), form: m[1] ? 'canonical' : 'legacy', anchor: m[4], visible: m[3] }); return; }
    m = l.match(new RegExp(`^###\\s+(?:(\\d+)\\.|3\\.(\\d+))\\s+(${CANON.join('|')})\\s*$`));
    if (m) heads.push({ line: i + 1, num: parseInt(m[1] || m[2], 10), form: m[1] ? 'canonical' : 'legacy', anchor: m[3], visible: m[3], noAnchor: true });
  });
  const principles = heads.map((h, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].line - 1 : lines.length;
    const body = lines.slice(h.line, end);   // lines after the heading, 0-based index j ↔ file line h.line + 1 + j
    const subs = { Description: [], Implementation: [], 'Trade-offs': [] }; const counts = { Description: 0, Implementation: 0, 'Trade-offs': 0 };
    let cur = null;
    body.forEach((l, j) => {
      const lab = l.match(/<!--\s*LABEL:\s*(Description|Implementation|Trade-offs)\s*-->/);
      const key = lab ? lab[1] : LABELS.find((L) => VISIBLE[L].test(l));
      if (key) { counts[key]++; cur = key; subs[key].push({ line: h.line + 1 + j, text: l }); return; }
      if (/^\s*<!--\s*LABEL:/.test(l) || /^\*\*[^*]+:\*\*/.test(l)) cur = null;   // another label ends the block
      if (cur) subs[cur].push({ line: h.line + 1 + j, text: l });
    });
    return Object.assign({}, h, { end, subs, counts });
  });
  let header = null;
  lines.forEach((l, i) => {
    if (header) return;
    let m = l.match(/^##\s+.*?\((\d+)\s+[^)]*\)\s*<!--\s*SECTION:\s*Architecture Principles\s*-->/) || l.match(/^## Architecture Principles \((\d+) Core Principles\)/);
    if (m) { header = { line: i + 1, count: parseInt(m[1], 10), form: 'canonical' }; return; }
    if (/^## 3\. Architecture Principles\s*$/.test(l) || /^##\s+.*<!--\s*SECTION:\s*Architecture Principles\s*-->/.test(l)) header = { line: i + 1, count: null, form: 'legacy' };
  });
  return { lines, principles, header };
}

const joined = (p, ...labs) => labs.flatMap((L) => p.subs[L]).map((x) => x.text).join('\n');
const bullets = (p, L) => p.subs[L].filter((x) => /^\s*[-*+]\s+/.test(x.text));
const pname = (p) => `Principle ${p.num} (${p.anchor})`;

// ── the rules ──
function check(root, opts = {}) {
  const file = path.resolve(root, opts.file || 'docs/02-architecture-principles.md');
  if (!fs.existsSync(file)) return { file: path.relative(root, file), status: 'FAIL', arch_type: 'unknown', findings: [{ rule: 'FILE', severity: 'BLOCKING', line: 0, message: `${path.relative(root, file)} not found` }], results: [], blocking: 1, warnings: 0 };
  const text = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
  const { lines, principles, header } = parse(text);
  const findings = []; const results = [];
  const F = (rule, severity, p, subsection, line, message, fix) => findings.push({ rule, severity, principle: p ? p.num : null, name: p ? p.anchor : null, subsection: subsection || null, line, message, fix: fix || null });
  const R = (rule, severity, ok, detail) => results.push({ rule, severity, result: ok ? 'PASS' : (severity === 'WARNING' ? 'WARN' : 'FAIL'), detail });
  const anchors = principles.map((p) => p.anchor);

  // arch type: --type › docs/03 marker › collect.json › unknown
  let archType = opts.type ? String(opts.type).toUpperCase() : null; let typeSource = '--type';
  const d03 = path.join(root, 'docs', '03-architecture-layers.md');
  if (!archType && fs.existsSync(d03)) { const m = fs.readFileSync(d03, "utf8").replace(/\r\n?/g, "\n").match(/<!--\s*ARCHITECTURE_TYPE:\s*([^>]*?)\s*-->/); if (m) { archType = m[1].toUpperCase(); typeSource = 'docs/03 marker'; } }
  const collect = path.join(root, '.cache', 'sa-skills', 'collect.json');
  if (!archType && fs.existsSync(collect)) { try { const c = JSON.parse(fs.readFileSync(collect, "utf8").replace(/\r\n?/g, "\n")); if (c.architecture_type) { archType = c.architecture_type; typeSource = 'collect.json'; } } catch (e) { /* unreadable — unknown */ } }
  const typeOpts = { project: root }; archType = archType ? archTypes.normType(archType, typeOpts) : null;
  if (!archType) { archType = 'unknown'; typeSource = 'none'; }
  // the rows: a pack type states them in its type.json, a built-in here (MATRIX)
  const typeDef = archType === 'unknown' ? null : archTypes.types(typeOpts).types[archType];
  const typeRows = (typeDef && typeDef.source !== 'base' && typeDef.matrix) || MATRIX[archType] || {};

  // Group 1 — structural
  const orderOk = anchors.every((a, i) => a === CANON[i]) && [9, 10].includes(anchors.length);
  const forms = new Set(principles.map((p) => p.form));
  const okStruct1 = orderOk && forms.size <= 1;
  R('P-STRUCT-01', 'BLOCKING', okStruct1, `${anchors.length} principles · order ${anchors.every((a, i) => a === CANON[i]) ? 'exact' : 'WRONG'} · numbering ${[...forms].join('+') || 'none'}`);
  if (!okStruct1) F('P-STRUCT-01', 'BLOCKING', null, null, principles[0] ? principles[0].line : 1, `Missing or out-of-order principle(s): found [${anchors.join(', ')}] — expected 1. ${CANON.slice(0, 9).join(' → ')} [→ 10. Decouple Through Events]${forms.size > 1 ? '; canonical (### N.) and legacy (### 3.N) numbering are mixed' : ''}`, 'Write the nine headings in the canonical order with their PRINCIPLE: anchors; one numbering form');
  const bad2 = [];
  principles.forEach((p) => LABELS.forEach((L) => { if (p.counts[L] !== 1) { bad2.push(`P${p.num} ${L}=${p.counts[L]}`); F('P-STRUCT-02', 'BLOCKING', p, L, p.line, `${pname(p)} has ${p.counts[L]} ${L} subsection(s) — exactly one required`, `Add \`**${L}:** <!-- LABEL: ${L} -->\` (visible label in doc_language)`); } }));
  R('P-STRUCT-02', 'BLOCKING', !bad2.length, bad2.join('; ') || 'every principle has one Description / Implementation / Trade-offs');
  if (!header) { R('P-STRUCT-03', 'BLOCKING', false, 'no Section 3 header'); F('P-STRUCT-03', 'BLOCKING', null, null, 1, 'No Section 3 header found', "Use `## Architecture Principles (N Core Principles) <!-- SECTION: Architecture Principles -->` (visible text in doc_language)"); }
  else if (header.form === 'legacy') { R('P-STRUCT-03', 'WARNING', false, 'legacy header — no count to check'); F('P-STRUCT-03', 'WARNING', null, null, header.line, 'Legacy header format — the count is delegated to P-STRUCT-01', 'Migrate to `## Architecture Principles (N Core Principles) <!-- SECTION: Architecture Principles -->`'); }
  else { const ok = header.count === anchors.length; R('P-STRUCT-03', 'BLOCKING', ok, `header says ${header.count}, found ${anchors.length}`); if (!ok) F('P-STRUCT-03', 'BLOCKING', null, null, header.line, `Header count mismatch: found ${anchors.length} principles but the header says ${header.count}`, `Update the header to (${anchors.length} Core Principles)`); }
  const p10 = principles.find((p) => p.anchor === 'Decouple Through Events');
  if (p10) {
    const d01 = path.join(root, 'docs', '01-system-overview.md'); const comp = path.join(root, 'docs', 'components');
    const files = [d01, ...walk(comp)].filter((f) => fs.existsSync(f));
    if (!fs.existsSync(d01)) { R('P-STRUCT-04', 'BLOCKING', false, 'INDETERMINATE — docs/01 missing'); F('P-STRUCT-04', 'BLOCKING', p10, null, p10.line, 'P10 is present but docs/01-system-overview.md is missing — async evidence INDETERMINATE', 'Write docs/01 first, or remove P10'); }
    else { const ev = files.filter((f) => LEX.async.test(fs.readFileSync(f, "utf8").replace(/\r\n?/g, "\n"))); R('P-STRUCT-04', 'BLOCKING', ev.length > 0, ev.length ? `async evidence in ${ev.map((f) => path.relative(root, f)).join(', ')}` : 'P10 present, no async pattern in docs/01 or docs/components/'); if (!ev.length) F('P-STRUCT-04', 'BLOCKING', p10, null, p10.line, 'Principle 10 (Decouple Through Events) is included but no async pattern is documented in docs/01-system-overview.md or docs/components/', 'Remove P10 or document the async pattern that justifies it'); }
  } else R('P-STRUCT-04', 'BLOCKING', true, 'P10 absent — no constraint');

  // Group 2 — hygiene
  const ph = []; lines.forEach((l, i) => { if (LEX.placeholder.test(l)) { ph.push(i + 1); F('P-PLACEHOLDER-01', 'BLOCKING', principles.find((p) => i + 1 > p.line && i + 1 <= p.end) || null, null, i + 1, `Placeholder text at line ${i + 1}: ${l.trim().slice(0, 80)}`, 'Replace with concrete content'); } });
  R('P-PLACEHOLDER-01', 'BLOCKING', !ph.length, ph.length ? `lines ${ph.join(', ')}` : '0 matches');
  const custom = principles.filter((p) => !CANON.includes(p.anchor));
  const known = new Set(principles.map((p) => p.line));
  const extraHeads = lines.map((l, i) => ({ l, i })).filter(({ l, i }) => /^###\s+(?:\d+\.|3\.\d+)\s+/.test(l) && !known.has(i + 1));
  const okCustom = !custom.length && !extraHeads.length && [9, 10].includes(anchors.length);
  R('P-CUSTOM-01', 'BLOCKING', okCustom, `count ${anchors.length}${custom.length ? ` · non-canonical ${custom.map((p) => p.anchor).join(', ')}` : ''}${extraHeads.length ? ` · unanchored ### headings at ${extraHeads.map((x) => x.i + 1).join(', ')}` : ''}`);
  custom.forEach((p) => F('P-CUSTOM-01', 'BLOCKING', p, null, p.line, `Custom principle '${p.anchor}' (line ${p.line})`, 'Map its content into one of the canonical 9–10 or remove it'));
  extraHeads.forEach(({ l, i }) => F('P-CUSTOM-01', 'BLOCKING', null, null, i + 1, `A '### N.' heading without a PRINCIPLE: anchor at line ${i + 1}: ${l.trim().slice(0, 60)}`, 'Every principle heading carries `<!-- PRINCIPLE: <canonical name> -->`'));
  if (!custom.length && !extraHeads.length && ![9, 10].includes(anchors.length)) F('P-CUSTOM-01', 'BLOCKING', null, null, 1, `${anchors.length} principles — 9 or 10 required`, null);

  // Group 3 — semantic-lite. P-SPECIFIC-01 token kind 1: a tech name docs/06 or a component descriptor declares — read when they exist (S6 and S5 are written after S3, so at first-write the other five kinds carry the rule)
  const techNames = new Set(); [path.join(root, 'docs', '06-technology-stack.md'), ...walk(path.join(root, 'docs', 'components'))].filter((f) => fs.existsSync(f)).forEach((f) => { const t = fs.readFileSync(f, "utf8").replace(/\r\n?/g, "\n"); (t.match(/^\*\*Technology:\*\*\s*(.+)$/gm) || []).forEach((l) => l.replace(/^\*\*Technology:\*\*\s*/, '').split(/[,;/+]| and | y /).map((x) => x.replace(/\(.*?\)/g, '').trim()).filter((x) => x.length > 2).forEach((x) => techNames.add(x))); (t.match(/^\|\s*\*?\*?([A-Z][\w .-]{2,40}?)\*?\*?\s*\|/gm) || []).forEach((l) => { const n = l.replace(/[|*]/g, '').trim(); if (!/^(Technology|Component|Category|Layer|Name|Type|Version|Purpose|Tecnolog[ií]a|Componente|Categor[ií]a|Capa|Nombre|Tipo|Versi[oó]n|Prop[oó]sito)$/i.test(n)) techNames.add(n); }); });
  const techIn = (t) => [...techNames].filter((n) => t.includes(n));
  const plat = [];
  principles.forEach((p) => ['Implementation', 'Trade-offs'].forEach((L) => p.subs[L].forEach((x) => { const m = x.text.match(LEX.platitude); if (m) { plat.push(`P${p.num}/${L} L${x.line}`); F('P-PLATITUDE-01', 'BLOCKING', p, L, x.line, `Platitude phrase '${m[0]}' at line ${x.line} in ${L} of ${pname(p)}`, 'Replace with a concrete protocol, tool or configuration'); } })));
  R('P-PLATITUDE-01', 'BLOCKING', !plat.length, plat.join('; ') || '0 matches in Implementation / Trade-offs');
  const spec = [];
  principles.forEach((p) => { const impl = joined(p, 'Implementation').replace(/<!--[\s\S]*?-->/g, ''); const toks = new Set([...(impl.match(LEX.specific) || []).map((t) => t.trim()), ...techIn(impl)]); if (toks.size < 2) { spec.push(`P${p.num}=${toks.size}`); F('P-SPECIFIC-01', 'BLOCKING', p, 'Implementation', (p.subs.Implementation[0] || p).line, `${pname(p)} Implementation has ${toks.size} system-specific token(s) — need ≥ 2`, 'Add a version, a percentage, a number with a unit, an acronym or a backtick-quoted name from this system'); } });
  R('P-SPECIFIC-01', 'BLOCKING', !spec.length, spec.join('; ') || 'every Implementation carries ≥ 2 system-specific tokens');
  const tq = [];
  principles.forEach((p) => { const t = joined(p, 'Trade-offs'); if (!LEX.quant.test(t) && !LEX.cost.test(t)) { tq.push(`P${p.num}`); F('P-TRADEOFF-QUANT-01', 'BLOCKING', p, 'Trade-offs', (p.subs['Trade-offs'][0] || p).line, `${pname(p)} Trade-offs has no quantified cost or recognized cost noun`, "Add a number with a unit ('3x infrastructure cost', '10-min RTO') or a cost noun (debt, on-call, licensing / deuda, guardia, licencia)"); } });
  R('P-TRADEOFF-QUANT-01', 'BLOCKING', !tq.length, tq.join('; ') || 'every Trade-offs carries a quantification or a cost noun');
  const tc = [];
  principles.forEach((p) => { const n = bullets(p, 'Trade-offs').length; if (n < 3) { tc.push(`P${p.num}=${n}`); F('P-TRADEOFF-COUNT-01', 'BLOCKING', p, 'Trade-offs', (p.subs['Trade-offs'][0] || p).line, `${pname(p)} Trade-offs has ${n} bullet(s) — need ≥ 3`, 'Cost / complexity / operational burden / migration risk — pick at least three real costs; an open item is never one (P-TRADEOFF-GAP-01)'); } });
  R('P-TRADEOFF-COUNT-01', 'BLOCKING', !tc.length, tc.join('; ') || 'every Trade-offs has ≥ 3 bullets');
  const tg = [];
  principles.forEach((p) => p.subs['Trade-offs'].forEach((x) => { const st = x.text.replace(/^\*\*[^*]+:\*\*\s*(<!--[^>]*-->)?\s*/, '').replace(/^\s*[-*+]\s*/, '').trim(); const colon = st.indexOf(': '); const clause = colon > 0 ? st.slice(colon + 2) : st; const m = clause.match(LEX.gap); if (m && !LEX.cost.test(clause)) { tg.push(`P${p.num} L${x.line}`); F('P-TRADEOFF-GAP-01', 'BLOCKING', p, 'Trade-offs', x.line, `${pname(p)} Trade-offs states an open item ('${m[0]}'), not a cost`, "A gap is not a trade-off: report it in the writer's gaps and the risk register (docs/10), and write a cost the decision carries in its place — never a TODO, never a filler bullet"); } }));
  R('P-TRADEOFF-GAP-01', 'BLOCKING', !tg.length, tg.join('; ') || 'no Trade-offs bullet states an open item instead of a cost');
  const tn = [];
  principles.forEach((p) => p.subs['Trade-offs'].forEach((x) => { const st = x.text.replace(/^\*\*[^*]+:\*\*\s*(<!--[^>]*-->)?\s*/, '').replace(/^\s*[-*+]\s*/, '').trim(); if (st && LEX.negation.test(st.split(/\s+/).slice(0, 3).join(' ')) && st.split(/\s+/).length <= 6) { tn.push(`P${p.num} L${x.line}`); F('P-TRADEOFF-NEG-01', 'BLOCKING', p, 'Trade-offs', x.line, `${pname(p)} Trade-offs claims '${st.slice(0, 40)}'`, 'Every architectural choice has a cost — surface at least one real one'); } }));
  R('P-TRADEOFF-NEG-01', 'BLOCKING', !tn.length, tn.join('; ') || "no Trade-offs claims 'None' / 'Minimal' / 'N/A'");
  const qa = [];
  principles.forEach((p) => { const d = joined(p, 'Description'); const m = d.match(LEX.outcome); if (m && !LEX.decisionVerb.test(d)) { qa.push(`P${p.num}`); F('P-QA-CONFLATION-01', 'BLOCKING', p, 'Description', (p.subs.Description[0] || p).line, `${pname(p)} Description states an outcome ('${m[0]}') with no decision verb`, "Restate as a decision rule — 'the team accepts X to achieve Y'"); } });
  R('P-QA-CONFLATION-01', 'BLOCKING', !qa.length, qa.join('; ') || 'no Description states a bare numeric outcome');

  // Group 4 — cross-reference
  const adrDir = path.join(root, 'adr'); const adrFiles = fs.existsSync(adrDir) ? fs.readdirSync(adrDir) : [];
  const exists = (id) => adrFiles.some((f) => f.startsWith(`${id}-`) || f === `${id}.md`);
  const cited = [...new Set(text.match(/ADR-\d{3}/g) || [])]; const broken = cited.filter((id) => !exists(id));
  const noRef = [];
  principles.forEach((p) => { const t = joined(p, 'Implementation', 'Trade-offs'); const ids = (t.match(/ADR-\d{3}/g) || []).filter(exists); if (!ids.length && !LEX.adrRef.test(t.replace(/ADR-\d{3}/g, (id) => (exists(id) ? id : 'ADR-xxx')))) { noRef.push(`P${p.num}`); F('P-ADR-REF-01', 'BLOCKING', p, 'Implementation+Trade-offs', (p.subs.Implementation[0] || p).line, `${pname(p)} has no ADR reference that resolves in adr/`, "Cite the governing ADR ('per [ADR-NNN](../adr/ADR-NNN-….md)') or insert `<!-- NO_ADR_GOVERNS -->`"); } });
  R('P-ADR-REF-01', 'BLOCKING', !noRef.length, noRef.join('; ') || `every principle cites an ADR that exists${text.includes('NO_ADR_GOVERNS') ? ' (or carries the NO_ADR_GOVERNS sentinel)' : ''}`);
  R('P-ADR-REF-01a', 'BLOCKING', !broken.length, broken.length ? `broken: ${broken.join(', ')}` : `all ${cited.length} cited ADR id(s) resolve to a file in adr/`);
  broken.forEach((id) => { const i = lines.findIndex((l) => l.includes(id)); F('P-ADR-REF-01a', 'BLOCKING', principles.find((p) => i + 1 > p.line && i + 1 <= p.end) || null, null, i + 1, `${id} is cited at line ${i + 1} but no adr/${id}-*.md exists`, 'Cite an ADR that exists, or create it through architecture-definition-record first'); });

  // Group 5 — cross-principle (WARNING)
  const impl = (n) => { const p = principles.find((x) => x.num === n); return p ? joined(p, 'Implementation') : ''; };
  const fired = CONTRA.filter((c) => c.aRe.test(impl(c.a)) && c.bRe.test(impl(c.b)));
  R('P-CROSS-CONTRA-01', 'WARNING', !fired.length, fired.map((c) => c.label).join('; ') || 'no curated contradiction pair fired');
  fired.forEach((c) => { const p = principles.find((x) => x.num === c.a); F('P-CROSS-CONTRA-01', 'WARNING', p, 'Implementation', p ? p.line : 1, `Potential contradiction: ${c.label}`, 'Layer 2 assesses whether the two are compatible'); });
  const over = [];
  principles.forEach((p) => { const ib = bullets(p, 'Implementation').length, tb = bullets(p, 'Trade-offs').length; const desc = p.subs.Description.map((x) => x.text.replace(/^\*\*[^*]+:\*\*\s*(<!--[^>]*-->)?/, '')).join(' ').trim(); const words = desc.split(/\s+/).filter(Boolean).length; const sentences = (desc.match(/[.!?](\s|$)/g) || []).length; const what = []; if (ib > 5) what.push(`Implementation ${ib} bullets (≤ 5)`); if (tb > 3) what.push(`Trade-offs ${tb} bullets (≤ 3)`); if (words > 25 || sentences > 1) what.push(`Description ${words} words / ${Math.max(sentences, 1)} sentence(s) (one sentence ≤ 25 words)`); if (what.length) { over.push(`P${p.num}: ${what.join(', ')}`); F('P-BUDGET-01', 'WARNING', p, null, p.line, `${pname(p)} over budget — ${what.join('; ')}`, 'Move the argument to the ADR the bullet cites, or split the bullet — never drop a fact'); } });
  R('P-BUDGET-01', 'WARNING', !over.length, over.join('; ') || 'every principle within budget');

  // Group 6 — type matrix
  if (archType === 'unknown') { R('P-TYPE-MATRIX-01', 'WARNING', false, 'skipped — architecture type unknown (no docs/03 marker, no --type, no collect.json)'); F('P-TYPE-MATRIX-01', 'WARNING', null, null, 1, 'Architecture type unknown — the type matrix was not checked', 'Pass --type, or write docs/03 with its ARCHITECTURE_TYPE marker'); }
  else {
    const rows = typeRows; const miss = [];
    Object.entries(rows).forEach(([n, phrases]) => { const p = principles.find((x) => x.num === Number(n)); if (!p) return; const t = joined(p, 'Implementation', 'Trade-offs').toLowerCase(); const waived = new RegExp(`<!--\\s*TYPE_MATRIX_WAIVED:\\s*P-?${n}\\b`).test(text); if (!waived && !phrases.some((ph) => t.includes(ph.toLowerCase()))) { miss.push(`P${n}`); F('P-TYPE-MATRIX-01', 'BLOCKING', p, 'Implementation+Trade-offs', (p.subs.Implementation[0] || p).line, `Architecture type is ${archType}: ${pname(p)} Implementation / Trade-offs mentions none of: ${phrases.slice(0, 7).join(', ')}…`, `Add one, or waive with \`<!-- TYPE_MATRIX_WAIVED: P-${n}: <reason> -->\` (Layer 2 flags every waiver)`); } });
    R('P-TYPE-MATRIX-01', 'BLOCKING', !miss.length, miss.length ? `${archType}: ${miss.join(', ')} missing required-any-of` : `${archType} rows (P${Object.keys(rows).join(', P')}) satisfied`);
  }

  const blocking = findings.filter((f) => f.severity === 'BLOCKING').length, warnings = findings.filter((f) => f.severity === 'WARNING').length;
  return { file: path.relative(root, file), arch_type: archType, type_source: typeSource, type_rows: typeRows, principles: principles.map((p) => ({ num: p.num, anchor: p.anchor, line: p.line })), results, findings, blocking, warnings, status: blocking ? 'FAIL' : 'PASS' };
}

function walk(dir) { if (!fs.existsSync(dir)) return []; return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.md') ? [path.join(dir, e.name)] : []))); }

function render(r) {
  const out = [`Principle check — ${r.file} · type ${r.arch_type} (${r.type_source}) · ${r.principles.length} principle(s)`, '', `  ${'RULE'.padEnd(22)} ${'SEV'.padEnd(9)} ${'RESULT'.padEnd(6)} DETAIL`];
  r.results.forEach((x) => out.push(`  ${x.rule.padEnd(22)} ${x.severity.padEnd(9)} ${x.result.padEnd(6)} ${x.detail}`));
  if (r.findings.length) { out.push('', '  findings (fix at the line — an edit, not a rewrite):'); r.findings.forEach((f) => out.push(`    ${f.severity === 'BLOCKING' ? '✗' : '⚠'} ${f.rule} L${f.line}${f.principle ? ` P${f.principle}` : ''}${f.subsection ? ` ${f.subsection}` : ''} — ${f.message}${f.fix ? `\n        fix: ${f.fix}` : ''}`)); }
  out.push('', `LAYER1: ${r.status} — ${r.blocking} blocking finding(s), ${r.warnings} warning(s)`);
  return out.join('\n');
}

// ---- Layer 1.5: the lexicon's semantic findings, re-read by the judge (scripts/judge.js)
// Five of the sixteen rules stand in for a judgement with a word list: a Trade-offs "names no cost" when none of ~40
// cost nouns appears, a principle "misses the type's concept" when none of a phrase list is a substring, a phrase is a
// platitude when it is on the list, a bullet denies a cost when it opens with a negation, a Description is an outcome
// when it carries a number and no verb from a 30-stem list. Each of those is BLOCKING, and a false block costs a
// rewrite round (the 8.31.0 run spent six on Section 3). This pass asks the judge the question the lexicon
// approximates, for every BLOCKING finding of those rules; a confident answer against the lexicon downgrades the
// finding to WARNING with the judge's reading — never drops it. A finding the judge has not answered (the agent
// worksheet still open, an engine that failed, an item left unanswered) is not re-read: the Layer 1 finding stands as
// BLOCKING and the report names it with the worksheet; a lexicon PASS is never re-judged here (Layer 2 reads the section).
const SEMANTIC = {
  'P-TRADEOFF-QUANT-01': { type: 'noul', downgradeWhen: (a) => a.p >= 0.75,
    question: 'Does `item.tradeoffs` (the Trade-offs of principle `item.principle`) name a concrete cost the principle imposes on this system — money, time, latency, capacity, operational burden, complexity, risk, staffing, lock-in, a limit accepted — rather than restating the principle or its benefits?',
    criteria: { true: 'At least one bullet states what the principle costs, in any words: a price, a delay, a burden someone carries, a capability given up, a risk taken on.', false: 'The bullets restate the principle, list benefits, or describe the design without naming what it costs.' },
    state: (p, f) => ({ principle: pname(p), tradeoffs: joined(p, 'Trade-offs') }) },
  'P-TYPE-MATRIX-01': { type: 'noul', downgradeWhen: (a) => a.p >= 0.75,
    question: 'Does `item.text` (the Implementation and Trade-offs of principle `item.principle`, in an architecture of type `item.type`) express the concept described in `item.concept`, in any words?',
    criteria: { true: 'The text speaks about that concept — the layers, boundaries, records or controls the concept names — even without the listed phrases.', false: 'The text does not touch the concept; it speaks about something else.' },
    state: (p, f, r) => ({ principle: pname(p), type: r.arch_type, concept: `one of: ${((r.type_rows || MATRIX[r.arch_type] || {})[p.num] || []).join(' · ')}`, text: joined(p, 'Implementation', 'Trade-offs') }) },
  'P-PLATITUDE-01': { type: 'noul', downgradeWhen: (a) => a.p <= 0.25,
    question: 'Is `item.phrase`, as used in `item.line`, a platitude — a generic claim any architecture could make — rather than a statement specific to this system?',
    criteria: { true: 'The phrase asserts quality in general terms ("industry best practices", "enterprise-grade") and the line would read the same in any other architecture.', false: 'The phrase is part of a statement tied to this system: a named component, technology, number, decision or constraint gives it specific content.' },
    state: (p, f) => ({ phrase: (f.message.match(/'([^']+)'/) || [])[1] || '', line: (p.subs[f.subsection] || []).map((x) => x).find((x) => x.line === f.line)?.text || '' }) },
  'P-TRADEOFF-NEG-01': { type: 'noul', downgradeWhen: (a) => a.p <= 0.25,
    question: 'Does `item.bullet` (a Trade-offs bullet of principle `item.principle`) deny that the principle costs anything — none, minimal, negligible, not applicable — rather than name a cost?',
    criteria: { true: 'The bullet says there is no cost, or a negligible one, and names nothing that is paid.', false: 'The bullet names a cost, even a small or bounded one ("minimal latency: +20 ms per hop" names 20 ms).' },
    state: (p, f) => ({ principle: pname(p), bullet: (p.subs['Trade-offs'] || []).find((x) => x.line === f.line)?.text || '' }) },
  'P-QA-CONFLATION-01': { type: 'choice', downgradeWhen: (a) => (a.choice === 'decision_rule' || a.choice === 'both') && (a.confidence == null || a.confidence >= 0.6),
    question: 'Is `item.description` (the Description of principle `item.principle`) a decision rule the architecture follows, an outcome it promises, or both?',
    criteria: { decision_rule: 'It states what the architecture does or refuses to do — a rule that decides designs ("every service owns its data", "no synchronous call crosses the boundary").', outcome_statement: 'It states a result or a quality target with no rule that produces it ("99.9% availability", "sub-second responses").', both: 'It states the rule and the outcome the rule buys.' },
    state: (p, f) => ({ principle: pname(p), description: joined(p, 'Description') }) },
};
async function judgeFindings(r, root, opts = {}) {
  const JUDGE = require(path.join(__dirname, '..', '..', '..', 'scripts', 'judge.js'));
  let engine = opts.engine, engineError = null;
  if (!engine) try { engine = JUDGE.engineInForce(); } catch (e) { if (e.name !== 'JudgeError') throw e; engineError = e.message; }
  const out = { engine: engine || null, asked: 0, downgraded: [], notReRead: [], pending: [], note: engineError };
  const standing = (rule, f) => out.notReRead.push(`${rule} P${f.principle} L${f.line}`);
  const file = path.resolve(root, r.file || 'docs/02-architecture-principles.md');
  if (!fs.existsSync(file)) return Object.assign(r, { judge: out });
  const { principles } = parse(fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n"));
  const byRule = new Map();
  r.findings.forEach((f) => { const S = SEMANTIC[f.rule]; if (!S || f.severity !== 'BLOCKING' || f.principle == null) return; const p = principles.find((x) => x.num === f.principle); if (!p) return; (byRule.get(f.rule) || byRule.set(f.rule, []).get(f.rule)).push({ f, p }); });
  const calls = [...byRule].map(async ([rule, list]) => {
    const S = SEMANTIC[rule];
    const spec = { id: `principle-${rule.toLowerCase()}`, type: S.type, question: S.question, criteria: S.criteria };
    const items = list.map(({ f, p }, i) => ({ id: `${rule}-${i}`, state: S.state(p, f, r) }));
    out.asked += items.length;
    if (engineError) { list.forEach(({ f }) => standing(rule, f)); return; }
    let res; try { res = await JUDGE.judge(spec, items, { engine, root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache }); }
    catch (e) { if (e.name !== 'JudgeError') throw e; out.note = e.message; list.forEach(({ f }) => standing(rule, f)); return; }
    if (res.pending) out.pending.push(res.pending); else out.engine = res.engine;
    list.forEach(({ f }, i) => { const a = res.answers[`${rule}-${i}`]; if (!a) { standing(rule, f); return; }
      const reading = S.type === 'noul' ? `${a.p.toFixed(2)}` : `${a.choice}${a.confidence != null ? ` ${a.confidence.toFixed(2)}` : ''}`;
      f.judged = { by: a.by, reading };
      if (S.downgradeWhen(a)) { f.severity = 'WARNING'; f.message += ` — judged otherwise by ${a.by} (${reading}): kept as a warning, not a block`; out.downgraded.push(`${rule} P${f.principle} L${f.line} (${reading})`); } });
  });
  await Promise.all(calls);
  r.results.forEach((x) => { if (x.result === 'FAIL' && SEMANTIC[x.rule] && !r.findings.some((f) => f.rule === x.rule && f.severity === 'BLOCKING')) { x.result = 'WARN'; x.detail += ` — every finding judged otherwise by ${out.engine}`; } });
  r.blocking = r.findings.filter((f) => f.severity === 'BLOCKING').length; r.warnings = r.findings.filter((f) => f.severity === 'WARNING').length; r.status = r.blocking ? 'FAIL' : 'PASS';
  return Object.assign(r, { judge: out });
}

// the Layer 1.5 receipt line: what the judge re-read, what it downgraded, and what it has not answered (standing, not re-read)
const layer15 = (j) => {
  const read = j.asked - j.notReRead.length;
  let s = `LAYER1.5: ${j.asked} finding(s) asked of ${j.engine || 'no engine'} · ${read} re-read${j.downgraded.length ? ` — downgraded to WARNING: ${j.downgraded.join('; ')}` : read ? ' — every re-read finding stands' : ''}`;
  if (j.notReRead.length) s += `\n  not re-read (undecided) — ${j.notReRead.length} finding(s) stand as Layer 1 reported them: ${j.notReRead.join('; ')}${j.pending.length ? `\n  answer the worksheet(s) and re-run: ${j.pending.join(' · ')}` : ''}`;
  return s + (j.note ? `\n  note: ${j.note}` : '');
};

// the Layer 2 stamp — the hash covers the file without its stamp line, CRLF normalized, trailing whitespace trimmed
const crypto = require('crypto');
const STAMP_RE = /^<!--\s*PRINCIPLE_REVIEW:\s*(\w+)\s+(\d{4}-\d{2}-\d{2})\s+sha256:([0-9a-f]{12})\s*-->\s*$/m;
const unstamped = (src) => src.replace(/\r\n?/g, '\n').split('\n').filter((l) => !/^<!--\s*PRINCIPLE_REVIEW:/.test(l)).join('\n').replace(/\s+$/, '');
const principlesHash = (src) => crypto.createHash('sha256').update(unstamped(src)).digest('hex').slice(0, 12);
function readReview(file) {
  if (!fs.existsSync(file)) return { state: 'missing-file' };
  const src = fs.readFileSync(file, 'utf8'); const m = src.match(STAMP_RE);
  if (!m) return { state: 'unstamped' };
  return { state: m[3] === principlesHash(src) ? 'current' : 'stale', layer2: m[1], date: m[2], hash: m[3] };
}
function stampReview(file, layer2, today) {
  const body = unstamped(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, `${body}\n\n<!-- PRINCIPLE_REVIEW: ${layer2} ${today} sha256:${principlesHash(body)} -->\n`);
}

module.exports = { check, judgeFindings, parse, render, layer15, principlesHash, readReview, stampReview, CANON, MATRIX, LEX, SEMANTIC };

if (require.main === module) (async () => {
  const args = process.argv.slice(2); const root = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--file', '--type', '--judge', '--stamp-review'].includes(args[i - 1])) || '.');
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  let r = check(root, { file: opt('--file'), type: opt('--type') });
  if (r.blocking) r = await judgeFindings(r, root, { engine: opt('--judge') });   // Layer 1.5: every blocking semantic finding re-read; --judge, else SA_JUDGE; an unanswered one stands, not re-read
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1)); else { console.log(render(r)); if (r.judge && r.judge.asked) console.log(layer15(r.judge)); }
  const stamp = opt('--stamp-review');
  if (stamp) {
    if (!['PASS', 'WARNING'].includes(stamp)) { console.error('--stamp-review takes PASS or WARNING — a SUPPRESSED, FAIL or NOT_REACHED review is not stamped'); process.exit(2); }
    if (r.blocking) console.error('PRINCIPLE_REVIEW not stamped — Layer 1 has blocking findings');
    else { const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; stampReview(path.resolve(root, r.file), stamp, today); console.error(`PRINCIPLE_REVIEW: ${stamp} ${today} stamped in ${r.file}`); }
  }
  process.exit(r.blocking ? 1 : 0);
})();
