#!/usr/bin/env node
// record-budgets.js — the size standard of a project ADR (101+) and a TDR: a word budget per section, the body total,
// and one line per entry of the record's own log. `recordFindings(text, file, kind)` checks one record.
//
// Shared across skills: architecture-docs/scripts/docs-stats.js reports it over a project (and re-exports it),
// technical-debt-records/scripts/tdr-check.js checks each TDR with it, architecture-definition-record/scripts/
// adr-prepare.js prints the ADR budgets into the writer's payload. Zero dependencies.
'use strict';
const words = (s) => s.trim() ? s.trim().split(/\s+/).length : 0;

// Records — project ADRs (101+) and TDRs. A budget per section, so the finding names the section to cut, plus a
// one-line cap on each entry of the record's own log (an ADR's `## Review History` row, a TDR's `## History` note):
// the log is where history goes, and one line per change is what keeps it from becoming the body again. Reference
// corpus: 37 project ADRs, median Decision 1,266 words, Consequences 662, Rationale 589, Alternatives 465, Context 365
// (4.5k words an ADR); 7 TDRs, median 1,189 words, a Description of 902. Each budget is what one decision or one debt
// needs when the argument lives once — in the ADR it belongs to, the section it describes — and is linked elsewhere.
const ADR_BODY_WORDS = 1500;
const ADR_SECTION_WORDS = { context: 250, decision: 500, rationale: 250, consequences: 300, alternatives: 250, references: 150, notes: 100 };
const TDR_BODY_WORDS = 600;
const TDR_SECTION_WORDS = { description: 200, impact: 150, solutions: 150, capability: 100, owner: 60 };
const LOG_ENTRY_WORDS = 30;
const RECORD_SECTION = [
  ['context', /^(context|contexto)\b/i], ['decision', /^(decision|decisi[óo]n)\b/i], ['rationale', /^(rationale|justificaci[óo]n|fundamento)\b/i],
  ['consequences', /^(consequences|consecuencias)\b/i], ['alternatives', /^(alternatives|alternativas)\b/i], ['references', /^(references|referencias)\b/i],
  ['notes', /^(notes|notas)\b/i], ['log', /^(review history|historial de revisi[óo]n|history|historial)\b/i],
  ['description', /^(description|descripci[óo]n)\b/i], ['impact', /^(impact|impacto)\b/i], ['solutions', /^(possible solutions|soluciones posibles|posibles soluciones)\b/i],
  ['capability', /^(capability|capacidad)\b/i], ['owner', /^(owner|responsable|due[ñn]o)\b/i],
];

// ---- records: project ADRs (101+) and TDRs — per-section budgets, the body total, one line per log entry
// Not counted in a log entry: what a broadening amendment's row must carry — the vocabulary it keeps on purpose and
// the titles it retired (workflows/catalog-mode.md § Broadening an amendment).
const LOG_EXEMPT = /(Retained vocabulary|Vocabulario conservado):.*?(?=\||$)|(retitled|retitulado)\*{0,2}\s+(from|desde)\s+\*[^*]+\*|en español desde\s+\*[^*]+\*/gi;
function recordSections(text) {
  const raw = text.split('\n');
  // comments go before anything is read, a multi-line one included, keeping the line numbers
  const lines = text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, '')).split('\n');
  const levels = lines.map(l => (l.match(/^(#{2,6})\s/) || [])[1]).filter(Boolean).map(h => h.length);
  const top = levels.length ? Math.min(...levels) : 2;                   // the record's section level, read from the file
  const out = []; let cur = null, fence = false;
  lines.forEach((l, i) => {
    if (/^\s*```/.test(l)) fence = !fence;
    const h = !fence && l.match(/^(#{2,6})\s+(.*)$/);
    if (h && h[1].length === top) {
      const anchor = (raw[i].match(/<!--\s*SECTION:\s*([^>]+?)\s*-->/) || [])[1];
      const name = (anchor || h[2]).trim();
      const bare = name.replace(/^\d+(\.\d+)*\.?\s+/, '');             // a catalog numbers its sections: `## 2. Decision`
      const key = (RECORD_SECTION.find(([, rx]) => rx.test(bare)) || [])[0] || null;
      cur = { key, name, line: i + 1, words: 0, entries: [], rows: 0 }; out.push(cur); return;
    }
    if (!cur || fence) return;
    cur.words += words(l.replace(/^\|?\s*[-:| ]+\|?\s*$/, ''));
    if (cur.key !== 'log') return;
    const row = /^\s*\|/.test(l) && !/^\s*\|\s*[-:]/.test(l);
    if (row && cur.rows++ === 0) return;                                   // the log table's header row is not an entry
    if (row || /^\s*[-*] /.test(l)) cur.entries.push({ line: i + 1, words: words(l.replace(LOG_EXEMPT, '').replace(/[|*`]/g, ' ')) });
  });
  return out;
}
function recordFindings(text, file, kind) {
  const budgets = kind === 'adr' ? ADR_SECTION_WORDS : TDR_SECTION_WORDS, total = kind === 'adr' ? ADR_BODY_WORDS : TDR_BODY_WORDS;
  const secs = recordSections(text), out = [];
  const body = secs.filter(x => x.key !== 'log' && x.key !== 'notes').reduce((n, x) => n + x.words, 0);
  const where = kind === 'adr' ? 'architecture-definition-record writes adr/' : 'technical-debt-records writes tdr/';
  secs.forEach(x => { const b = budgets[x.key]; if (b && x.words > b) out.push({ file, rule: `${kind}-section-length`, shape: true, line: x.line, where: x.name, detail: `${x.words} words (≤ ${b}) — state the ${kind === 'adr' ? 'decision in force' : 'compromise as it stands'}; move history to the log, link what another record or section already argues (${where})` }); });
  if (body > total) out.push({ file, rule: `${kind}-body-length`, shape: true, where: '', detail: `${body} words in the body (≤ ${total}, the log${kind === 'adr' ? ' and Notes' : ''} excluded)` });
  const log = secs.find(x => x.key === 'log');
  const long = log ? log.entries.filter(e => e.words > LOG_ENTRY_WORDS + (kind === 'adr' ? 8 : 0)) : [];   // an ADR row also carries date, author and status cells
  if (long.length) out.push({ file, rule: `${kind}-log-entry-length`, shape: true, line: long[0].line, where: log.name, detail: `${long.length} entr${long.length === 1 ? 'y' : 'ies'} over one line (≤ ${LOG_ENTRY_WORDS} words) — a log entry says what changed and links it; the substance goes into the body, rewritten in place` });
  return out;
}

module.exports = { ADR_BODY_WORDS, ADR_SECTION_WORDS, TDR_BODY_WORDS, TDR_SECTION_WORDS, LOG_ENTRY_WORDS, RECORD_SECTION, recordSections, recordFindings };

// The CLI: one or more records, each measured as an ADR or a TDR by its filename. Without `--enforce` it reports
// and exits 0 — the findings are BLOCKING only once the project stamps PROSE_STYLE: v1, which the caller passes.
//   bun record-budgets.js <record.md>… [--enforce] [--json]
if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) { console.error('Usage: bun record-budgets.js <record.md>… [--enforce] [--json]'); process.exit(2); }
  const out = [];
  for (const f of files) {
    const kind = /TDR-/i.test(f.split(/[\\/]/).pop()) ? 'tdr' : 'adr';
    out.push(...recordFindings(fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n'), f, kind));
  }
  if (args.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else out.forEach((x) => console.log(`${x.file}${x.line ? ':' + x.line : ''} [${x.rule}] ${x.where ? x.where + ' — ' : ''}${x.detail}`));
  if (!args.includes('--json')) console.log(`record-budgets: ${files.length} record(s), ${out.length} finding(s)${args.includes('--enforce') ? ' (enforcing)' : ' (report only)'}`);
  process.exit(out.length && args.includes('--enforce') ? 1 : 0);
}
