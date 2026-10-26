#!/usr/bin/env node
// po-spec.js — the Product Owner Specification's Use Cases, parsed once: every UC heading (`### UC-01: …`, `### Use Case 1`,
// `### Caso de Uso 1`) with its labelled fields (Description, Actors, Preconditions, Postconditions, Primary Flow,
// Alternative Flows, Edge Cases, Success Metrics, and since 8.134.0 Trigger and Acceptance Criteria — English or
// Spanish), and the spec's version; since 10.25.0 the Appendix's Implementation Suggestions table (`suggestionsOf`).
//
// Shared across skills: architecture-traceability measures the architecture against it, architecture-capability-alignment
// maps it onto BIAN. Ships in sa-requirements with BIAN alignment; sa-skills re-exports it at scripts/shared/po-spec.js,
// and traceability-prepare.js re-exports parseSpec. Zero dependencies.
'use strict';
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();

const LABEL = (names) => new RegExp(`^\\*\\*(?:${names})\\*\\*\\s*:?\\s*(.*)$`, 'i');
const FIELDS = {
  description: LABEL('Descripci[óo]n|Description'), actor: LABEL('Actores?|Actors?'), preconditions: LABEL('Precondiciones|Preconditions'), postconditions: LABEL('Postcondiciones|Postconditions'),
  primaryFlow: LABEL('Flujo principal|Primary Flow|Main Flow'), alternativeFlows: LABEL('Flujos alternativos|Alternative Flows'), edgeCases: LABEL('Casos borde|Casos l[íi]mite|Edge Cases'), successMetrics: LABEL('M[ée]tricas de [ée]xito|Success Metrics'),
  trigger: LABEL('Disparador|Desencadenante|Trigger'), acceptanceCriteria: LABEL('Criterios de aceptaci[óo]n|Acceptance Criteria'),
};
const ANY_LABEL = /^\*\*[^*]+\*\*\s*:?/;
function parseSpec(text) {
  const lines = text.split('\n');
  let start = lines.findIndex((l) => /<!--\s*SECTION:\s*Use Cases\s*-->/.test(l)); if (start < 0) start = lines.findIndex((l) => /^##\s+(?:\d+\.\s*)?(?:Use Cases|Casos de Uso)\b/i.test(l));
  if (start < 0) return { useCases: [], version: null, warnings: ['no Use Cases section (anchor `SECTION: Use Cases` or heading `## N. Use Cases` / `Casos de Uso`)'] };
  const level = (lines[start].match(/^#+/) || ['##'])[0].length;
  let end = lines.length; for (let i = start + 1; i < lines.length; i++) { const h = lines[i].match(/^(#{1,6})\s/); if (h && h[1].length <= level) { end = i; break; } }
  const ucs = [], warnings = [];
  for (let i = start + 1; i < end; i++) {
    const h = lines[i].match(/^###\s+(?:\d+(?:\.\d+)*\s+)?(?:(UC-?\d+)\s*[:—–-]\s*)?(.+)$/i); if (!h) continue;
    if (!h[1] && !/^(?:Use Case|Caso de Uso)\s*\d+/i.test(h[2])) continue;
    const id = (h[1] || (h[2].match(/\d+/) || ['0'])[0]).toUpperCase().replace(/^UC-?/, 'UC-').replace(/^UC-(\d)$/, 'UC-0$1'), name = plain(h[2].replace(/^(?:Use Case|Caso de Uso)\s*\d+\s*[:—–-]?\s*/i, ''));
    let j = i + 1; const body = []; while (j < end && !/^###\s/.test(lines[j])) { body.push(lines[j]); j++; }
    const uc = { id, name, line: i + 1, fields: {} };
    for (let k = 0; k < body.length; k++) {
      const l = body[k]; let hit = null; for (const [f, re] of Object.entries(FIELDS)) { const m = l.match(re); if (m) { hit = [f, m[1]]; break; } } if (!hit) continue;
      const [f, inline] = hit; const items = [];
      if (inline.trim()) items.push(inline.trim());
      let t = k + 1; while (t < body.length && !ANY_LABEL.test(body[t]) && !/^---/.test(body[t])) { const s = body[t].trim(); if (s) items.push(s); t++; }
      uc.fields[f] = items;
    }
    ucs.push(uc); i = j - 1;
  }
  const version = (text.match(/<!--\s*(?:PO_SPEC_VERSION|VERSION):\s*([^>]*?)\s*-->/) || text.match(/\*\*Versi[óo]n\*\*:?\s*\*?\*?v?([\d.]+)/i) || [])[1] || null;
  return { useCases: ucs, version, warnings };
}

// The Appendix's Implementation Suggestions (10.25.0): how someone proposed to build the system — not a requirement, the
// architecture's to answer. The table `# | Suggestion | Need | Proposed by | Status | Answer` (column headers English in
// every language, Status `Open` · `Adopted` · `Not adopted`), under the `SECTION: Implementation Suggestions` anchor or its
// heading. A row with an empty or unknown Status is Open; a placeholder row ([…]) is no suggestion.
const SUGGESTION_STATUS = ['Open', 'Adopted', 'Not adopted'];
function suggestionsOf(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  let start = lines.findIndex((l) => /<!--\s*SECTION:\s*Implementation Suggestions\s*-->/.test(l));
  if (start < 0) start = lines.findIndex((l) => /^#{2,4}\s+(?:Implementation Suggestions|Sugerencias de Implementaci[óo]n)\b/i.test(l));
  if (start < 0) return [];
  const level = (lines[start].match(/^#+/) || ['###'])[0].length, out = [];
  let cols = null;
  for (let i = start + 1; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s/); if (h && h[1].length <= level) break;
    const l = lines[i].trim(); if (!l.startsWith('|')) continue;
    const cells = l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => plain(c));
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
    if (!cols) { cols = cells.map((c) => c.toLowerCase()); continue; }
    const at = (name) => { const k = cols.indexOf(name); return k >= 0 ? cells[k] || '' : ''; };
    const suggestion = at('suggestion'); if (!suggestion || /^\[.*\]$/.test(suggestion)) continue;
    const st = SUGGESTION_STATUS.find((x) => x.toLowerCase() === at('status').toLowerCase()) || 'Open';
    out.push({ id: at('#') || `IS-${String(out.length + 1).padStart(2, '0')}`, suggestion, need: at('need'), by: at('proposed by'), status: st, answer: at('answer'), line: i + 1 });
  }
  return out;
}

module.exports = { parseSpec, plain, FIELDS, suggestionsOf, SUGGESTION_STATUS };
