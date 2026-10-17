#!/usr/bin/env node
// prose-check.js — the Content Hygiene Gate's prose rules (PROSE_VALIDATION.md) as code, with the judgement rules judged.
//
//   bun prose-check.js <project-root> [--scope first-write|edit|release|records] [--file <path> …] [--judge agent|typesafe|clef]
//                      [--deep] [--json] [--warn-only]
//
// PROSE_VALIDATION.md said "this file is executed by the model": five BLOCKING blocklists as rg commands, and ten
// WARNING rules of which seven are judgement — mannered prose, future tense for designed behaviour, agentless passive
// where an actor exists, a claim without a token, two consecutive prose paragraphs, a pro-drop verb behind a regex
// hit, a hedge that carries no number. Every run re-typed the rg commands and read every paragraph in session.
//
// This is the one implementation. Stage 1 (code): the corpus is cut into blocks after § Text Normalization; the
// BLOCKING blocklists run as the regexes the rulebook prints, both language branches always; the mechanical WARNINGs
// (sentence and paragraph length, waivers, tables under anchored sections, consecutive prose) count; the proper-noun
// guard of S-BAN-03 and the noun exclusions of S-VOICE-01's pro-drop rule are code (the technology and component names
// the ledger carries). Stage 2 (scripts/judge.js): every candidate of a judgement rule — the regex hits of S-DENSITY-02,
// S-VOICE-02, S-VOICE-03 and the pro-drop rule, every token-less paragraph of S-DENSITY-01, and under --deep every prose
// paragraph for S-DENSITY-02 — is one Noul; a candidate no judge has answered (the agent worksheet still open, an engine
// that failed, an item left unanswered) is undecided — neither a finding nor dismissed — and the report lists it with the
// worksheet to answer before the re-run (8.119.0: the regex's reading no longer stands in). Stage 3 (code): mode from the PROSE_STYLE marker (report-only never
// blocks), the report in the rulebook's shape, exit 1 only when enforcing and a BLOCKING finding stands.
//
// Scope (Appendix A of the rulebook): `first-write` and `release` run all eight groups over ARCHITECTURE.md + docs/**;
// `edit` runs Groups 1, 2, 6 and 8 over the files named with --file; `release` is enforcing whatever the PROSE_STYLE marker
// says, exempted only by `<!-- PROSE_STYLE_WAIVED: <reason> -->`, which the report prints. The judge is the same in
// every scope: the session (agent, the default), Jev or Claude under SA_JUDGE / --judge.
//
// What this never does: count lines in a file, or drop a finding the judge disagreed with — it prints the reading.
'use strict';
const fs = require('fs');
const path = require('path');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));
const { structureFindings } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'record-structure.js'));
const { integrationHead } = require(path.join(__dirname, 'integration-head.js'));
const JUDGE = require(path.join(__dirname, '..', '..', '..', 'scripts', 'judge.js'));

const readFile = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const read = readFile;
const walk = (dir) => (!fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.md') ? [path.join(dir, e.name)] : []))));
const word = (alts, flags = 'giu') => new RegExp(`(?<!\\p{L})(?:${alts})(?!\\p{L})`, flags);

// ── the blocklists, as PROSE_VALIDATION.md prints them (both branches) ───────────────────────────────
const RULES = {
  'S-BOILER-01': { severity: 'BLOCKING', re: /this section provides a visual representation|how to read this file|a uc is resolved by composing phases|design drivers can be automatically calculated|the diagrams below are the canonical wire-level|esta secci[óo]n (?:proporciona|presenta) una representaci[óo]n visual|c[óo]mo leer este archivo/giu,
    fix: (m) => `Template boilerplate '${m}'. This sentence is authoring instruction, not architecture content — delete it. The heading above it already carries the meaning.` },
  'S-BAN-01': { severity: 'BLOCKING', re: word('it is important to note|it should be noted|this (?:section|document) (?:provides|describes|covers|presents)|in order to|as mentioned (?:above|previously)|the following table (?:shows|illustrates)|this document aims to|in this section we will|the remainder of this document|as we will see|deliberately at the end|read these only when|cabe destacar|es importante mencionar|esta secci[óo]n (?:proporciona|describe|presenta)|a continuaci[óo]n se (?:muestra|presenta)|con el fin de|en esta secci[óo]n veremos|el resto de este documento'),
    fix: (m) => `Filler or meta-narration '${m}'. The document must not describe its own layout or reading order — section anchors already do. Delete the clause; keep any fact it carried.` },
  'S-BAN-02': { severity: 'BLOCKING', re: word('may potentially|could possibly|generally speaking|in general|typically|somewhat|fairly|quite|arguably|we believe|very|extremely|highly|dramatically|generalmente|en general|posiblemente|podr[íi]a llegar a|bastante|muy|altamente|considerablemente'),
    fix: (m) => `Hedge '${m}'. Either the claim holds or it does not. Replace with the measured value, or delete the qualifier.` },
  'S-BAN-03': { severity: 'BLOCKING', re: word('industry best practice|industry standard|we follow best practices|enterprise-grade|world-class|state of the art|where applicable|as appropriate|robust solution|cutting edge|battle[- ]tested|future[- ]proof|seamless|robust|powerful|holistic|best-in-class|next-generation|unlock|empower|ensure a smooth|leverag(?:e|es|ing)|de clase mundial|sin fisuras|robusto|potente|de [úu]ltima generaci[óo]n|garantizar una experiencia fluida|aprovechar'),
    fix: (m) => `Marketing register '${m}'. Replace with the concrete mechanism, protocol, or measurement it is standing in for.` },
  // The pronouns run in the document's language only, and case-sensitively: an English pronoun in a Spanish document is
  // always quoted text or a name ("East US", "us-east-1"), and an all-caps "US" is a country. On the reference corpus the
  // bilingual, case-blind list raised 76 false blocks of 77 and made PROSE_STYLE impossible to stamp.
  'S-VOICE-01': { severity: 'BLOCKING', docsOnly: true, lang: { en: word('[Ww]e|[Oo]ur|[Oo]urs|us|[Yy]ou|[Yy]our|[Yy]ours', 'gu'), es: word('[Nn]osotr[oa]s|[Nn]uestr[oa]s?|[Uu]sted|[Uu]stedes', 'gu') },
    fix: (m) => `First/second person '${m}'. Architecture documentation describes the system, not its authors. Rewrite with the system or component as subject.` },
};
// the nouns the pro-drop ending catches: the rulebook names tramos and ramos; the reference corpus added extremos ("en ambos extremos", ten hits the judge dismissed at 0.02)
const PRODROP = /(?<!\p{L})([a-záéíóúñ]{2,}(?:amos|emos|imos))(?!\p{L})/giu, PRODROP_NOUNS = /^(tramos|ramos|extremos|supremos|lemos|remos|gramos|kilogramos|programos|mismos|primos|racimos|centavos|anexos)$/i;
// A first-person-plural verb carries no written accent except in the imperfect, conditional and subjunctive endings
// ("usábamos", "haríamos", "fuéramos"); an accented -amos/-emos/-imos word outside them is a noun or an adjective
// ("préstamos", "últimos", "legítimos", "mínimos") — code's to dismiss, never a question for the judge.
const PRODROP_VERB_ACCENT = /(?:ábamos|íamos|éramos|áramos|iéramos|ásemos|iésemos|ísemos)$/i;
const prodropNoun = (w) => PRODROP_NOUNS.test(w) || (/[áéíóú]/i.test(w) && !PRODROP_VERB_ACCENT.test(w));
// S-HIST-01 — dated narration: what the design or the document used to say, or when it changed. Strong markers are history
// by themselves; weak ones ("desde el", "hasta el", "since", "until") are also ranges and origins in the current design
// ("desde el dispositivo", "hasta el límite de 30 réplicas"), so a weak marker is `strong` only beside a date, a version, an
// ADR or the word for an amendment — the judge reads every one; a dismissal is printed only for a strong one.
const HIST_STRONG = word('dej[óo] de|dejaron de|ya no|pasó de|antes (?:era|eran|dec[íi]a|dec[íi]an|se)|originalmente|inicialmente|en su versi[óo]n anterior|no longer|used to|previously|formerly|originally|was (?:changed|replaced|renamed)|now (?:uses|is|goes)');
const HIST_WEAK = word('desde (?:el|la|los|las)|hasta (?:el|la|los|las)|a partir de (?:el|la)|since|until|as of');
// the weak marker is history when what it points at is a moment: a date, a version, an amendment, a release — within three
// words ("desde la enmienda del 2026-09-03", "hasta la versión 3", "since v2.1"); an ADR cited elsewhere in the sentence is not
const HIST_ANCHOR = /^\s*(?:\S+\s+){0,3}?(?:20\d{2}(?:-\d{2}){0,2}\b|v?\d+\.\d+|enmiendas?\b|amendments?\b|versi[óo]n|version|release|lanzamiento|cambio|change|migraci[óo]n|migration)/i;
// S-HIST-02 — an edit-marker comment: a note about the edit, left in the document ("<!-- corregido: … -->")
const HIST_MARKER = /<!--\s*(?:a[ñn]adid[oa]s?|agregad[oa]s?|precisad[oa]s?|corregid[oa]s?|correcci[óo]n|partid[oa]s?|actualizad[oa]s?|cambiad[oa]s?|modificad[oa]s?|reescrit[oa]s?|movid[oa]s?|ampliad[oa]s?|eliminad[oa]s?|retirad[oa]s?|revisad[oa]s?|added|clarified|corrected|correction|split|updated|changed|modified|rewritten|moved|expanded|removed|fixed|revised|edited|was:|antes:)\b[\s\S]*?(?:-->|$)/giu;
// A changelog is history by nature: only its [Unreleased] block is checked, and never for length, form or density
const isChangelog = (f) => /(?:^|[\\/])CHANGELOG[^\\/]*\.md$|ARCHIVE[^\\/]*\.md$/i.test(f);
const unreleasedOnly = (text) => { let keep = false; return text.split('\n').map((l) => { const h = l.match(/^##\s+\[([^\]]+)\]/); if (h) keep = /unreleased|sin publicar/i.test(h[1]); else if (/^#\s/.test(l)) keep = false; return keep ? l : ''; }).join('\n'); };
// A comment that spans lines (an EXPLORER_HEADER block, an authoring note) is not prose: blank it, keeping line numbers
const blankMultilineComments = (text) => text.replace(/<!--[\s\S]*?-->/g, (m) => (m.includes('\n') ? m.replace(/[^\n]/g, '') : m));
// Inline code spans and quoted text are names and quotations, not the document's own voice
const stripQuoted = (l) => l.replace(/`[^`]*`/g, ' ').replace(/"[^"\n]*"|“[^”\n]*”|«[^»\n]*»/g, ' ');
const SIGNIF = word('significantly|significativamente'), NUMBER = /\b\d+(?:[.,]\d+)?\s*%?|\b\d+\s*%/;
const DENSITY_TOKEN = /\b\d+(?:\.\d+)?\s*(?:%|ms|s|min|hr|GB|TB|MB|KB|RPS|TPS|QPS|node|core|pod|replica|MAU|DAU)\b|\b[A-Z]{3,}\b|\b[A-Z]{1,6}-\d{1,4}\b|\bLA[A-Z]*\d+\b|`[^`]+`|\]\([^)]+\)|\[[^\]]+\]/;
// Token 1 in any language: a number and the noun it counts ("12 meses", "500.000 usuarios", "3 réplicas"), or a spelled
// count of a time unit ("una semana", "two days") — an es corpus writes its quantities in Spanish nouns
const QUANTITY = /\b\d+(?:[.,]\d+)*\s*(?:%|\p{L}{2,})|\b(?:un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|quince|veinte|treinta|cien|mil|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|a hundred|a thousand)\s+(?:milisegundos?|segundos?|minutos?|horas?|d[íi]as?|semanas?|mes(?:es)?|a[ñn]os?|milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?|years?)\b/iu;
// Token 5, the in-file form: a section or phase reference names its source as a link does ("§ 9.11", "la fase 14", "Phase 3")
const SECTION_REF = /§\s*\d+(?:\.\d+)*|\b(?:fase|phase|secci[óo]n|section|paso|step|anexo|appendix)\s+\d+(?:\.\d+)*\b/iu;
// A lead-in: the line that introduces the list or table after it ("La fase tiene cuatro disparadores:") — structure, not a claim
const isLeadIn = (b) => /:\s*(?:\*\*)?$/.test(b.norm);
// Token 2: a technology the architecture names — docs/06's tables (first column and any technology / product column) and
// every component's technology and name from the ledger; a multi-word name also counts by its first word ("Azure")
const GENERIC = new Set(['service', 'services', 'servicio', 'servicios', 'gateway', 'server', 'servidor', 'database', 'base', 'cache', 'queue', 'cola', 'platform', 'plataforma', 'cloud', 'nube', 'manager', 'app', 'mobile', 'web', 'api', 'sdk', 'the', 'el', 'la', 'los', 'las', 'de', 'del', 'core', 'data', 'datos', 'native', 'nativo', 'store', 'storage', 'engine', 'motor', 'framework', 'library', 'librería', 'tool', 'herramienta', 'custom', 'propio', 'internal', 'interno', 'external', 'externo', 'standard', 'estándar', 'alta', 'baja', 'media', 'high', 'low', 'medium', 'yes', 'no', 'sí', 'n/a']);
function techNames(root, facts) {
  const raw = [...(facts ? facts.components || [] : []).flatMap((c) => [c.name, ...(c.technology || [])]), ...(facts ? facts.systems || [] : []).map((x) => x.name)];
  const f06 = path.join(root, 'docs', '06-technology-stack.md');
  if (fs.existsSync(f06)) { let cols = null; read(f06).split('\n').forEach((l) => {
    if (!/^\s*\|/.test(l)) { cols = null; return; } if (/^\s*\|?\s*:?-{2,}/.test(l)) return;
    const cells = l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.replace(/[`*]/g, '').trim());
    if (!cols) { cols = cells.map((c, k) => k === 0 || /tecnolog|technolog|product|herramienta|tool|framework|librer|library|vendor|proveedor|motor|engine/i.test(c)); return; }
    cells.forEach((c, k) => { if (cols[k] && c && c.split(/\s+/).length <= 5) raw.push(c); }); }); }
  const names = new Set();
  raw.forEach((t) => { const n = String(t || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+v?\d+(?:\.[\dx]+)*\+?\s*$/i, '').trim(); if (n.length < 3 || GENERIC.has(n.toLowerCase())) return; names.add(n);
    const first = n.split(/[\s/]+/)[0]; if (first !== n && first.length >= 4 && /^\p{Lu}/u.test(first) && !GENERIC.has(first.toLowerCase())) names.add(first); });
  const list = [...names].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return list.length ? new RegExp('(?<![\\p{L}\\d])(?:' + list.join('|') + ')(?![\\p{L}\\d])', 'u') : null;
}
const MANNERED = word('dial worth turning|earns its keep|beating heart|north star|heavy lifting|the glue between|lives and breathes|at the end of the day|palanca que vale|se gana su lugar|coraz[óo]n que late|estrella polar|pegamento entre|a fin de cuentas|vive y respira');
// The periphrastic future is ir a + an infinitive, every person of ir ("va a validar", "se van a llenar", "van a pedir
// saltárselo"); ir a + a noun or an article is motion in the present ("ningún token va a log", "la entrega va a Confluent
// Kafka", "va a la autoevaluación"). Case-sensitive, so a capitalized product is never an infinitive, and the tech nouns that
// end like one (cluster, broker, server …) are named.
const TECH_ER = 'cluster|server|servidor|router|broker|buffer|docker|container|logger|header|folder|worker|controller|scheduler|driver|provider|layer|ledger|user|manager|reader|writer|consumer|producer|poller|listener|handler|trigger|timer|tracker|lugar|hogar|radar|nadir';
const FUTURE = word(`[Ww]ill [a-z]+|(?:[Vv]oy|[Vv]as|[Vv]a|[Vv]amos|[Vv]an) a (?!(?:${TECH_ER})(?!\\p{L}))[a-záéíóúñ]+(?:[aá]r|[eé]r|[ií]r)(?:se|me|te|nos)?(?:lo|la|los|las|le|les)?|[Ss]er[áa]n? [a-z]+|[Ss]e implementar[áa]`, 'gu');
const VERSION_OR_DATE = /\bv?\d+\.\d+(?:\.\d+)?\b|\b20\d{2}(?:-\d{2}){0,2}\b|\bQ[1-4]\b|\b(?:phase|fase|sprint|release|versi[óo]n|version)\s*\d/i;
const PASSIVE_EN = /\b(?:is|are|was|were|be|been)\s+(?:validated|processed|handled|stored|sent|received|encrypted|routed|cached|logged|persisted)\b(?!\s+by\b)/giu, PASSIVE_ES = /\bse (?:valida|procesa|maneja|almacena|env[íi]a|recibe|cifra|enruta|registra|persiste)\b/giu;
const NAMED_PATTERNS = /circuit breaker|dead[- ]letter|bulkhead|saga|cortacircuito/i;

// A sentence ends at . ! ? followed by a space or the end — closing emphasis or a closing quote after the mark belongs to
// the boundary (a bold lead sentence "**El control no es el borrado.** Dejar de…" is two); a leading section number
// ("9.5.1 La Interfaz", "9. Seguridad") and a dot inside a number ("versión 2.3", "500.000") are not boundaries
const sentencesOf = (norm) => norm.replace(/^\d+(?:\.\d+)*\.?\s+/, '').split(/(?<=[.!?](?:\*{1,2}|_{1,2}|`|»|"|”|’|')*)\s+/).map((x) => x.trim()).filter(Boolean);
// An integration block's head (integration-head.js, the reading docs-stats.js and handoff-prepare.js share): a title-only
// line (`**I-04 — Consulta de saldos**`, `**I-19 e I-20 — …**`) is a heading, structurally; a head with its body inline
// (`**I-11 — retirada**, per [ADR-120] …`) opens a new block, so it starts the run afresh
const isHead = (l) => !!integrationHead(l);
const FIELD_LINE = /^\s*\*\*[^*]{1,60}?(?::\*\*|\*\*\s*:)/;
const POINTER_LINE = /^\s*(?:→|⟶|➜|↳|⇒|->)\s*/;
// ── § Text Normalization: blocks with their first line, the PROSE_OK waivers, the structural markers ──
function blocksOf(text, file) {
  const lines = text.split('\n'), out = []; let fence = false, front = /^---\s*$/.test(lines[0]) ? 1 : 0, waiver = null, i = 0;
  const push = (kind, start, raw) => { const norm = raw.map((l) => l.replace(/<!--[\s\S]*?-->/g, '').replace(/\]\([^)]*\)/g, ']').replace(/`[^`]*`/g, 'X')).join(' ').replace(/\s+/g, ' ').trim(); out.push({ file, kind, line: start + 1, raw: raw.join('\n'), norm, waived: waiver, words: norm ? norm.split(/\s+/).length : 0, sentences: norm ? sentencesOf(norm) : [] }); };
  if (front) { i = 1; while (i < lines.length && !/^---\s*$/.test(lines[i])) i++; i++; }
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) { fence = !fence; if (fence) out.push({ file, kind: 'fence', line: i + 1, norm: '', words: 0, sentences: [] }); waiver = null; continue; }
    if (fence) continue;
    const w = l.match(/<!--\s*PROSE_OK:\s*([^>]*?)\s*-->/); if (w) { waiver = { line: i + 1, reason: w[1].trim() }; if (!l.replace(/<!--[\s\S]*?-->/g, '').trim()) continue; }
    if (/^\s*<!--/.test(l) && /-->\s*$/.test(l)) continue;
    if (!l.trim()) { continue; }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { out.push({ file, kind: 'rule', line: i + 1, norm: '', words: 0, sentences: [] }); waiver = null; continue; }
    if (/^#{1,6}\s/.test(l)) { push('heading', i, [l.replace(/^#+\s*/, '')]); out[out.length - 1].level = l.match(/^#+/)[0].length; out[out.length - 1].raw = l; waiver = null; continue; }
    if (/^\s*\|/.test(l)) { const start = i; while (i + 1 < lines.length && /^\s*\|/.test(lines[i + 1])) i++; out.push({ file, kind: 'table', line: start + 1, norm: '', words: 0, sentences: [] }); waiver = null; continue; }
    if (/^\s*(?:[-*+]|\d+\.)\s+/.test(l)) { const start = i, raw = [l]; while (i + 1 < lines.length && lines[i + 1].trim() && !/^\s*(?:[-*+]|\d+\.)\s+/.test(lines[i + 1]) && !/^#{1,6}\s|^\s*\||^\s*```/.test(lines[i + 1])) { i++; raw.push(lines[i]); } push('list', start, raw); continue; }
    if (/^\s*>/.test(l)) { const start = i, raw = [l]; while (i + 1 < lines.length && /^\s*>/.test(lines[i + 1])) { i++; raw.push(lines[i]); } push('quote', start, raw.map((x) => x.replace(/^\s*>\s?/, ''))); continue; }
    const head = integrationHead(l); if (head && head.titleOnly) { push('title', i, [l]); waiver = null; continue; }
    const start = i, raw = [l]; while (i + 1 < lines.length && lines[i + 1].trim() && !/^#{1,6}\s|^\s*\||^\s*```|^\s*(?:[-*+]|\d+\.)\s+|^\s*>|^\s*<!--/.test(lines[i + 1]) && !isHead(lines[i + 1])) { i++; raw.push(lines[i]); }
    // a block of `**Label:** value` lines (a descriptor's version block, a `**Deployment:**` line) is a field set, and a
    // line opening with an arrow is a pointer to where the content lives — structure, not prose
    const kind = head ? 'paragraph' : raw.every((x) => FIELD_LINE.test(x)) ? 'fields' : raw.length === 1 && POINTER_LINE.test(raw[0]) ? 'pointer' : 'paragraph';
    push(kind, start, raw); if (head) out[out.length - 1].blockHead = raw.length === 1 ? 'one-line' : 'lead'; waiver = null;
  }
  // a heading, a bullet or a blockquote counts as prose only when it carries ≥2 sentences or ≥25 words
  out.forEach((b) => { b.prose = b.kind === 'paragraph' || (['heading', 'list', 'quote'].includes(b.kind) && (b.sentences.length >= 2 || b.words >= 25)); });
  return out;
}
const rawLines = (text) => { const out = []; let fence = false; text.split('\n').forEach((l, i) => { if (/^\s*```/.test(l)) { fence = !fence; return; } if (fence) return; const s = l.replace(/<!--[\s\S]*?-->/g, ''); if (s.trim()) out.push({ line: i + 1, text: s }); }); return out; };
const excerpt = (s, n = 160) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const sentenceAround = (text, idx) => { const s = Math.max(text.lastIndexOf('. ', idx), text.lastIndexOf('! ', idx), text.lastIndexOf('? ', idx)); const e = text.slice(idx).search(/[.!?](\s|$)/); return text.slice(s < 0 ? 0 : s + 2, e < 0 ? text.length : idx + e + 1).trim(); };

// ── Appendix A — the scope map: which groups run where; `edit` never re-litigates length, form or density ───────
// Group 8 (history) runs in every scope: an edit is exactly where a dated note or an edit marker is left behind
// `records` (8.68.0): project ADRs (101+) and TDRs — boilerplate, banned words, length, voice and history; no form or
// density (a record has its own template), and each record's own log is skipped: history belongs there.
// Group 9 (records only): an ADR's structure is English with no anchor comment — S-STRUCT-01, from record-structure.js;
// a TDR's is tdr-check.js's (the same module), and an institutional ADR (001–100) is its catalog's.
const SCOPES = { 'first-write': { groups: [1, 2, 3, 4, 5, 6, 7, 8] }, edit: { groups: [1, 2, 6, 8] }, release: { groups: [1, 2, 3, 4, 5, 6, 7, 8] }, records: { groups: [1, 2, 3, 6, 8, 9] } };
const RECORD_LOG = /^(review history|historial de revisi[óo]n|history|historial|notes|notas)\b/i;
const recordFiles = (root) => [
  ...(fs.existsSync(path.join(root, 'adr')) ? fs.readdirSync(path.join(root, 'adr')).filter((n) => /^ADR-\d{3,}.*\.md$/.test(n) && Number(n.match(/^ADR-(\d+)/)[1]) > 100).sort().map((n) => path.join(root, 'adr', n)) : []),
  ...(fs.existsSync(path.join(root, 'tdr')) ? fs.readdirSync(path.join(root, 'tdr')).filter((n) => /^TDR-\d+.*\.md$/.test(n)).sort().map((n) => path.join(root, 'tdr', n)) : []),
];
// blank a record's log sections (Review History, History, Notes), keeping line numbers; the level is read from the file
const blankRecordLog = (text) => { const lines = text.split('\n'); const lv = lines.map((l) => (l.match(/^(#{2,6})\s/) || [])[1]).filter(Boolean).map((h) => h.length); const top = lv.length ? Math.min(...lv) : 2; let skip = false;
  return lines.map((l) => { const h = l.match(/^(#{2,6})\s+(.*)$/); if (h && h[1].length <= top) { const name = ((h[2].match(/<!--\s*SECTION:\s*([^>]+?)\s*-->/) || [])[1] || h[2].replace(/<!--[\s\S]*?-->/g, '')).trim(); skip = RECORD_LOG.test(name); return l; } return skip ? '' : l; }).join('\n'); };
const GROUP_OF = { 'S-BOILER-01': 1, 'S-HIST-02': 1, 'S-BAN-01': 2, 'S-BAN-02': 2, 'S-BAN-02a': 2, 'S-BAN-03': 2, 'S-VOICE-01': 2, 'S-VOICE-02': 6, 'S-VOICE-03': 6, 'S-LEN-01': 3, 'S-LEN-02': 3, 'S-FORM-01': 4, 'S-FORM-02': 4, 'S-DENSITY-01': 5, 'S-DENSITY-02': 5, 'S-WAIVER-01': 7, 'S-HIST-01': 8, 'S-STRUCT-01': 9 };

// ── the check ─────────────────────────────────────────────────────────────────────────────────────
async function check(root, opts = {}) {
  root = path.resolve(root);
  const archPath = path.join(root, 'ARCHITECTURE.md'), arch = fs.existsSync(archPath) ? read(archPath) : '';
  const scope = opts.scope || 'first-write';
  if (!SCOPES[scope]) throw new Error(`unknown scope '${scope}' — one of ${Object.keys(SCOPES).join(' | ')}`);
  // Appendix A: `release` enforces whatever the marker says — a legacy architecture pays at release; the one exemption
  // is an explicit PROSE_STYLE_WAIVED with a reason, surfaced in the report (and by the release in its changelog entry).
  const waived = (arch.match(/<!--\s*PROSE_STYLE_WAIVED:\s*([^>]*?)\s*-->/) || [])[1];
  const stamped = /<!--\s*PROSE_STYLE:\s*v1\s*-->/.test(arch);
  const mode = scope === 'release' ? (waived !== undefined ? 'report-only' : 'enforcing') : (stamped ? 'enforcing' : 'report-only');   // `records` follows the stamp
  const lang = ((arch.match(/<!--\s*(?:DOC_LANGUAGE|LANGUAGE):\s*(\w+)\s*-->/) || [])[1] || 'en').toLowerCase();
  // opts.groups narrows the scope's groups (the write-time hook runs the lexical and length groups only); opts.texts maps
  // an absolute path to the content about to be written, read instead of the file on disk (8.115.0)
  const groups = opts.groups ? SCOPES[scope].groups.filter((g) => opts.groups.includes(g)) : SCOPES[scope].groups, runs = (g) => groups.includes(g);
  const texts = opts.texts || {}; const readSrc = (f) => (Object.prototype.hasOwnProperty.call(texts, f) ? String(texts[f]).replace(/\r\n?/g, '\n') : readFile(f));
  const files = (opts.files && opts.files.length ? opts.files.map((f) => path.resolve(root, f)) : scope === 'records' ? recordFiles(root) : [archPath, ...walk(path.join(root, 'docs'))]).filter((f) => (fs.existsSync(f) || Object.prototype.hasOwnProperty.call(texts, f)) && !/examples[\\/]ARCHITECTURE_example/.test(f));
  const rel = (f) => path.relative(root, f).replace(/\\/g, '/');
  const findings = [], suppressed = [], fallbacks = [];
  const F = (ruleId, severity, file, line, excerptText, fix, extra) => runs(GROUP_OF[ruleId]) && findings.push(Object.assign({ ruleId, severity: mode === 'report-only' ? 'WARNING' : severity, blockingByRule: severity === 'BLOCKING', file: rel(file), line, excerpt: excerpt(excerptText), fix }, extra || {}));

  // the proper-noun allowlist and the actors: technology and component names the ledger carries
  let facts = null; try { facts = opts.facts || collect(root); } catch (e) { fallbacks.push(`facts ledger unavailable (${e.message}) — proper-noun guard and actor list skipped`); }
  const properNouns = new Set([...(facts ? facts.components || [] : []).flatMap((c) => [c.name, ...(c.technology || [])]), ...(facts ? facts.systems || [] : []).map((s) => s.name)].map((s) => String(s).toLowerCase()));
  const components = (facts ? facts.components || [] : []).map((c) => c.name);
  const TECH = techNames(root, facts);
  const dense = (b) => DENSITY_TOKEN.test(b.raw) || QUANTITY.test(b.norm) || SECTION_REF.test(b.norm) || (TECH && TECH.test(b.norm));
  const isProper = (token) => [...properNouns].some((n) => n.includes(String(token).toLowerCase()));

  const cands = { 'S-DENSITY-02': [], 'S-VOICE-02': [], 'S-VOICE-03': [], 'S-VOICE-01': [], 'S-DENSITY-01': [], 'S-HIST-01': [] };
  const perFile = [];
  for (const file of files) {
    const source = readSrc(file), log = isChangelog(file), isDocs = /[\\/]docs[\\/]/.test(file), isRecord = /[\\/](adr|tdr)[\\/]/.test(file);
    const scoped = log ? unreleasedOnly(source) : isRecord ? blankRecordLog(source) : source;
    const text = blankMultilineComments(scoped), lines = rawLines(text), blocks = log ? [] : blocksOf(text, file);
    perFile.push({ file, blocks });
    // S-STRUCT-01 — a project ADR's headings, labels and table headers stay English, with no anchor (Group 9)
    const adrNo = (path.basename(file).match(/^ADR-(\d+)/) || [])[1];
    if (/[\\/]adr[\\/]/.test(file) && adrNo && Number(adrNo) > 100) structureFindings(source, 'adr').forEach((x) => F('S-STRUCT-01', 'BLOCKING', file, x.line, x.found, `${x.message} (LANGUAGE_POLICY.md §4 Records)`, { match: x.found }));
    // S-HIST-02 — edit-marker comments, read before the comments are stripped
    scoped.split('\n').forEach((l, i) => { for (const m of l.matchAll(HIST_MARKER)) F('S-HIST-02', 'BLOCKING', file, i + 1, m[0], `Edit-marker comment '${excerpt(m[0], 60)}'. A note about the edit is history, not architecture: delete it. The change belongs in docs/CHANGELOG.md, the decision in its ADR.`, { match: excerpt(m[0], 60) }); });
    // Groups 1–2 — the blocklists, over the raw lines minus fences and comments (a table cell can carry a hedge too)
    for (const { line, text: raw } of lines) {
      const l = raw.replace(/`[^`]*`/g, ' ');                    // an inline code span is a name, never the document's voice
      for (const [ruleId, R] of Object.entries(RULES)) {
        if (R.docsOnly && !isDocs) continue;
        const re = R.lang ? R.lang[lang] : R.re; if (!re) continue;
        for (const m of (R.lang ? stripQuoted(raw) : l).matchAll(re)) {
          if (ruleId === 'S-BAN-03' && isProper(m[0])) { suppressed.push({ ruleId, token: m[0], file: rel(file), line, reason: 'proper noun — a technology or component the ledger names' }); continue; }
          F(ruleId, R.severity, file, line, raw, R.fix(m[0]), { match: m[0] });
        }
      }
      const hl = stripQuoted(raw);                                    // a quoted vendor sentence is not the document narrating
      for (const m of hl.matchAll(HIST_STRONG)) cands['S-HIST-01'].push({ file, line, match: m[0], sentence: sentenceAround(hl, m.index), strong: true });
      for (const m of hl.matchAll(HIST_WEAK)) { const s = sentenceAround(hl, m.index); if (!cands['S-HIST-01'].some((c) => c.file === file && c.line === line && c.sentence === s)) cands['S-HIST-01'].push({ file, line, match: m[0], sentence: s, strong: HIST_ANCHOR.test(hl.slice(m.index + m[0].length, m.index + m[0].length + 60)) }); }
      if (isDocs && lang === 'es') for (const m of stripQuoted(raw).matchAll(PRODROP)) { if (prodropNoun(m[1])) { suppressed.push({ ruleId: 'S-VOICE-01', token: m[1], file: rel(file), line, reason: 'common noun, not a verb' }); continue; } cands['S-VOICE-01'].push({ file, line, word: m[1], sentence: sentenceAround(l, m.index) }); }
      for (const m of l.matchAll(SIGNIF)) { if (!NUMBER.test(sentenceAround(l, m.index))) F('S-BAN-02a', 'WARNING', file, line, l, `'${m[0]}' carries no number. State the measured change, e.g. 'reduces p95 latency by 40%'.`); }
      for (const m of l.matchAll(FUTURE)) { const s = sentenceAround(l, m.index); if (!VERSION_OR_DATE.test(s)) cands['S-VOICE-02'].push({ file, line, match: m[0], sentence: s }); }
      if (isDocs) for (const re of [PASSIVE_EN, PASSIVE_ES]) for (const m of l.matchAll(re)) cands['S-VOICE-03'].push({ file, line, match: m[0], sentence: sentenceAround(l, m.index) });
      for (const m of l.matchAll(MANNERED)) cands['S-DENSITY-02'].push({ file, line, match: m[0], sentence: sentenceAround(l, m.index), seed: true });
    }
    // Groups 3–5 — over the normalized blocks
    let run = 0;
    for (const b of blocks) {
      // a structural element resets the run whether or not its own text counts as prose for S-LEN (a list of long items)
      if (['heading', 'title', 'table', 'fence', 'list', 'rule', 'fields', 'pointer'].includes(b.kind)) run = 0;
      if (!b.prose) continue;
      if (!b.waived) {
        b.sentences.forEach((s) => { const n = s.split(/\s+/).length; if (n > 25) F('S-LEN-01', 'WARNING', file, b.line, s, `Sentence is ${n} words (target ≤25). Split it or convert to a table. Do NOT shorten by dropping a fact — a 20-word sentence missing a constraint is worse than a 30-word one that keeps it.`, { words: n }); });
        if (b.words > 70 || b.sentences.length > 4) F('S-LEN-02', 'WARNING', file, b.line, b.norm, `Paragraph is ${b.words} words / ${b.sentences.length} sentences (target ≤70 / ≤4). Convert to a table or bullets if it enumerates; split it if it argues. Do NOT drop facts to fit.`, { words: b.words, sentences: b.sentences.length });
      }
      if (b.blockHead) run = b.blockHead === 'one-line' ? 0 : 1;          // a new integration block: a one-line block (a retirement) is not a run
      else if (b.kind === 'paragraph' && isLeadIn(b)) run = 0;                 // a lead-in belongs to the list or table it introduces
      else if (b.kind === 'paragraph') { run++; if (run === 2 && !b.waived) F('S-FORM-02', 'WARNING', file, b.line, b.norm, `2 consecutive prose paragraphs. Convert the enumerable part to a table or bullets, or mark the block '<!-- PROSE_OK: reason -->' if the argument genuinely needs continuous prose.`); }
      if (b.kind === 'paragraph' && /[\\/]docs[\\/]0[3-9]-/.test(file) && !isLeadIn(b) && !dense(b) && !b.waived) cands['S-DENSITY-01'].push({ file, line: b.line, paragraph: b.norm });
      if (opts.deep && b.kind === 'paragraph' && !b.waived) b.sentences.forEach((s) => { if (!NAMED_PATTERNS.test(s) && !cands['S-DENSITY-02'].some((c) => c.file === file && c.line === b.line)) cands['S-DENSITY-02'].push({ file, line: b.line, sentence: s, seed: false }); });
    }
    // Group 7 — waivers
    const waivers = blocks.filter((b) => b.waived).map((b) => b.waived); const seen = new Set();
    waivers.forEach((w) => { if (seen.has(w.line)) return; seen.add(w.line); if (!w.reason) F('S-WAIVER-01', 'WARNING', file, w.line, '<!-- PROSE_OK: -->', 'A waiver with no reason. State why the block needs continuous prose, or remove the waiver.'); });
    if (seen.size > 3) F('S-WAIVER-01', 'WARNING', file, [...seen][3], `${seen.size} waivers`, `${seen.size} prose waivers in this file. More than three is a signal the template is wrong, not the author — raise it rather than waiving it.`);
    // Group 4 — S-FORM-01: a table under each anchored section
    ['Flow Inventory', 'Phase Catalog', 'Use Case Resolutions', 'Technology Stack', 'Key Metrics'].forEach((s) => { const i = blocks.findIndex((b) => b.kind === 'heading' && (b.raw || '').includes(`<!-- SECTION: ${s} -->`)); if (i < 0) return; let j = i + 1, rows = 0; while (j < blocks.length && !(blocks[j].kind === 'heading' && (blocks[j].level || 1) <= (blocks[i].level || 6))) { if (blocks[j].kind === 'table') rows++; j++; } if (!rows) F('S-FORM-01', 'WARNING', file, blocks[i].line, s, `Section '${s}' has no table. Its content is ≥2 items with ≥2 attributes — that is a table by the form ladder (PROSE_STYLE.md §2).`); });
  }

  // Stage 2 — the judgement rules: one Noul per candidate; an unanswered candidate is undecided and reported, never kept
  // or dismissed. `judge: false` (the write-time hook) skips it: no worksheet, no network — the rules stay with the gates.
  // `listed` says whether a dismissal is printed: a regex hit, not a paragraph --deep swept in or a bare weak marker.
  if (opts.judge === false) Object.keys(cands).forEach((k) => { cands[k] = []; });
  let engine = opts.engine, engineError = null;
  if (!engine) try { engine = JUDGE.engineInForce(); } catch (e) { if (e.name !== 'JudgeError') throw e; engineError = e.message; }
  const SPECS = {
    'S-VOICE-01': { q: 'In `item.sentence`, is the word `item.word` a verb in the first person plural (nosotros: "aprovechamos", "usamos") rather than a noun or another form?', t: 'A first-person-plural verb: the sentence speaks as "we".', f: 'A noun ("tramos", "ramos", "ambos"), an adjective, or a verb form that is not first person plural.', keep: (a) => a.p >= 0.5, severity: 'BLOCKING', fix: (c) => `First/second person '${c.word}'. Architecture documentation describes the system, not its authors. Rewrite with the system or component as subject.`, listed: () => true },
    'S-VOICE-02': { q: 'Does `item.sentence` use the future ("`item.match`") for behaviour the architecture is designed to have now, rather than for work deferred to a later version or date?', t: 'Designed behaviour stated in the future: "the gateway will validate the token", "el gateway validará el token", for what the design does today.', f: 'Ir a + a noun or an article is motion, not the future ("el evento va a Kafka", "ningún token va a log"). Deferred work, a roadmap item, a condition ("if the queue fills, the relay will retry"), or a quoted requirement.', keep: (a) => a.p >= 0.5, severity: 'WARNING', fix: (c) => `Future tense '${c.match}' describes designed behavior. Use present tense — 'validates', not 'will validate'. Future tense is reserved for deferred work and must carry a version or date.`, listed: () => true },
    'S-VOICE-03': { q: 'In `item.sentence` the action is stated without an actor ("`item.match`"). Is one of the documented components in `item.components` the component that performs it?', t: 'A named component of this architecture performs the action; the sentence could name it as the subject.', f: 'No documented component performs it — the actor is outside the architecture, unknown, or the sentence is a definition or a requirement rather than a behaviour.', keep: (a) => a.p >= 0.5, severity: 'WARNING', fix: (c) => `Agentless passive '${c.match}'. Name the component that acts: 'the gateway validates the token', not 'the token is validated'. Spanish: 'el gateway valida el token', not 'se valida el token'.`, listed: () => true, extra: () => ({ components: components.slice(0, 80) }) },
    'S-DENSITY-02': { q: 'Is the meaning of `item.sentence` carried by a figure of speech — a metaphor or a flourish — where a literal phrase (the number, the component, the decision) exists?', t: 'A metaphor or flourish stands in for the literal claim ("the gateway is the beating heart", "a dial worth turning", "el corazón que late", "una palanca que vale la pena mover", "se gana su lugar").', f: 'Literal technical prose; a named pattern (circuit breaker, bulkhead, saga, dead-letter queue) is a literal name.', keep: (a) => a.p >= 0.6, severity: 'WARNING', fix: (c) => `Mannered prose: "${excerpt(c.sentence, 80)}". Say what you mean — replace the figure of speech with the literal phrase (the number, the component, the decision).`, listed: (c) => c.seed },
    'S-HIST-01': { q: 'Does `item.sentence` narrate history — what the design or the document used to be, or when and how it changed ("`item.match`") — rather than state the current design?', t: 'History: "desde la enmienda del 2026-09-03 la topología…", "el gateway ya no valida…", "the relay no longer retries", "pasó de cuatro saltos a cinco".', f: 'The current design: a range or an origin ("desde el dispositivo hasta el gateway", "hasta el límite de 30 réplicas", "since the token expires, the app refreshes it"), a condition, or a requirement.', keep: (a) => a.p >= 0.5, severity: 'WARNING', fix: (c) => `Dated narration '${c.match}'. State the design as it is now; the history belongs in docs/CHANGELOG.md and the decision's ADR (its Review History).`, listed: (c) => c.strong },
    'S-DENSITY-01': { q: 'Does `item.paragraph` make a claim about behaviour, capacity, cost or risk — something that could be measured, named or cited — rather than define a term, give context, or point elsewhere?', t: 'It asserts how the system behaves, what it can carry, what it costs or what it risks, and carries no number, component name, technology, identifier or link to back it.', f: 'It defines, introduces, summarizes or transitions; nothing in it calls for a measurement or a source.', keep: (a) => a.p >= 0.5, severity: 'WARNING', fix: () => 'Paragraph makes a claim with no number, component name, technology, identifier, or cross-reference. Add the measurement or link the source section — a cross-reference satisfies this rule and is not counted against sentence length.', listed: () => true },
  };
  const judge = { engine: engine || null, asked: 0, kept: 0, dismissed: [], undecided: [], pending: [], note: null };
  const undecide = (ruleId, c) => judge.undecided.push({ ruleId, file: rel(c.file), line: c.line, match: c.match || c.word || null, excerpt: excerpt(c.sentence || c.paragraph, 70) });
  const calls = Object.entries(SPECS).map(async ([ruleId, S]) => {
    const list = runs(GROUP_OF[ruleId]) ? cands[ruleId] : []; if (!list.length) return;
    const spec = { id: `prose-${ruleId.toLowerCase()}`, type: 'noul', question: S.q, criteria: { true: S.t, false: S.f } };
    const items = list.map((c, i) => ({ id: `${ruleId}-${i}`, state: Object.assign({ sentence: c.sentence, paragraph: c.paragraph, word: c.word, match: c.match }, S.extra ? S.extra(c) : {}) }));
    judge.asked += items.length;
    if (engineError) { judge.note = engineError; list.forEach((c) => undecide(ruleId, c)); return; }
    let res; try { res = await JUDGE.judge(spec, items, { engine, root, apiKey: opts.apiKey, fetch: opts.fetch, cache: opts.cache }); }
    catch (e) { if (e.name !== 'JudgeError') throw e; judge.note = e.message; list.forEach((c) => undecide(ruleId, c)); return; }
    if (res.pending) judge.pending.push(res.pending); else judge.engine = res.engine;
    list.forEach((c, i) => { const a = res.answers[`${ruleId}-${i}`]; if (!a) { undecide(ruleId, c); return; }
      if (S.keep(a)) { judge.kept++; F(ruleId, S.severity, c.file, c.line, c.sentence || c.paragraph, S.fix(c), { match: c.match || c.word, judged: { by: a.by, p: +a.p.toFixed(2) } }); }
      else if (S.listed(c)) judge.dismissed.push(`${ruleId} ${rel(c.file)}:${c.line} (${a.by} ${a.p.toFixed(2)}) — "${excerpt(c.sentence || c.paragraph, 70)}"`); });
  });
  await Promise.all(calls);
  judge.undecided.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId));

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId));
  const blocking = mode === 'enforcing' ? findings.filter((f) => f.severity === 'BLOCKING').length : 0;
  return { status: blocking ? 'FAIL' : 'PASS', scope, groups, mode, waived: waived === undefined ? null : (waived || '(no reason)'), contractVersion: 'v1', docLanguage: lang, bilingualPatternsRun: true, filesChecked: files.length, totalChecks: Object.keys(RULES).length + 10, blockingFindings: blocking, blockingByRule: findings.filter((f) => f.blockingByRule).length, warningFindings: findings.length - blocking, waivers: perFile.reduce((n, p) => n + new Set(p.blocks.filter((b) => b.waived).map((b) => b.waived.line)).size, 0), findings, suppressed, fallbacks, judge };
}

function render(r) {
  const out = [`PROSE_VALIDATION_REPORT: ${r.status} · scope ${r.scope} (groups ${r.groups.join(',')}) · mode ${r.mode}${r.scope === 'release' && r.waived !== null ? ` — PROSE_STYLE_WAIVED: ${r.waived}` : ''} · ${r.docLanguage} · ${r.filesChecked} file(s) · ${r.blockingFindings} blocking (${r.blockingByRule} by rule${r.mode === 'report-only' ? ', none blocks in report-only' : ''}) · ${r.warningFindings} warning(s) · ${r.waivers} waiver(s)`];
  const byRule = {}; r.findings.forEach((f) => { byRule[f.ruleId] = (byRule[f.ruleId] || 0) + 1; });
  out.push(`  rules: ${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(' · ') || 'no findings'}`);
  r.findings.slice(0, 200).forEach((f) => out.push(`  ${f.blockingByRule && r.mode === 'enforcing' ? '✗' : '⚠'} ${f.ruleId} ${f.file}:${f.line}${f.judged ? ` [${f.judged.by} ${f.judged.p}]` : ''} — ${f.excerpt}`));
  if (r.findings.length > 200) out.push(`  … ${r.findings.length - 200} more`);
  if (r.suppressed.length) out.push(`  suppressed (${r.suppressed.length}): ${r.suppressed.slice(0, 12).map((s) => `${s.ruleId} '${s.token}' ${s.file}:${s.line} — ${s.reason}`).join('; ')}${r.suppressed.length > 12 ? ' …' : ''}`);
  if (r.judge.asked) out.push(`  judge: ${r.judge.asked} candidate(s) asked of ${r.judge.engine || 'no engine'} · ${r.judge.kept} kept${r.judge.dismissed.length ? ` · ${r.judge.dismissed.length} dismissed:\n${r.judge.dismissed.map((d) => '    - ' + d).join('\n')}` : ''}${r.judge.note ? ` · ${r.judge.note}` : ''}`);
  const u = r.judge.undecided || [];
  if (u.length) {
    out.push(`  undecided: ${u.length} candidate(s) no judge has answered — neither a finding nor dismissed; ${r.judge.pending.length ? `answer the worksheet(s) and re-run:\n${r.judge.pending.map((p) => '    worksheet: ' + p).join('\n')}` : 'set a judge (--judge agent|typesafe|clef, or SA_JUDGE) and re-run'}`);
    u.slice(0, 50).forEach((x) => out.push(`    ? ${x.ruleId} ${x.file}:${x.line} — ${x.excerpt}`));
    if (u.length > 50) out.push(`    … ${u.length - 50} more`);
  }
  if (r.fallbacks.length) out.push(`  fallbacks: ${r.fallbacks.join('; ')}`);
  return out.join('\n');
}

module.exports = { check, render, blocksOf, RULES };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const root = args.find((a, i) => !a.startsWith('--') && !['--scope', '--file', '--judge'].includes(args[i - 1]));
  if (!root) { console.error('Usage: bun prose-check.js <project-root> [--scope first-write|edit|release|records] [--file <path> …] [--judge agent|typesafe|clef] [--deep] [--json] [--warn-only]'); process.exit(2); }
  const files = args.flatMap((a, i) => (a === '--file' ? [args[i + 1]] : []));
  let r; try { r = await check(root, { scope: opt('--scope'), files, engine: opt('--judge'), deep: args.includes('--deep') }); } catch (e) { console.error('prose-check: ' + (e.stack || e.message)); process.exit(2); }
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.status === 'FAIL' && !args.includes('--warn-only') ? 1 : 0);
})();
