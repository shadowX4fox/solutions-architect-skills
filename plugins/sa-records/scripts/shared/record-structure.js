#!/usr/bin/env node
// record-structure.js — the structure of an ADR or a TDR is English in every doc_language (LANGUAGE_POLICY.md §4
// *Records*): headings, `**labels**`, table header rows and the TDR Capability level names, with no anchor comment.
// Only prose translates. `structureFindings(src, kind)` returns one finding per line that breaks it:
//
//   - a localized heading, at any level (`## Contexto`, `### Consecuencias Negativas`, `## Estado`)
//   - a localized label (`**Estado**:`, `**Severidad**`, `**Iniciativa**`, `**Técnico**`)
//   - a localized table header row (`| Riesgo | Probabilidad | … |`, `| Nivel | Nombre | … |`)
//   - a localized level name in the first column of a TDR Capability table (`Área de Negocio`)
//   - an anchor comment on a heading (`## Contexto <!-- SECTION: Context -->`) — records carry none
//
// Accents and case are ignored when matching, and a trailing number is dropped (`Alternativa 1`). Body cells and
// prose are never read. Consumers: `prose-check.js --scope records` (ADRs, rule S-STRUCT-01) and `tdr-check.js`
// (TDRs, rule structure-localized). An imported institutional ADR (001–100) is exempt; the caller decides that.
'use strict';

const VOCAB = {
  adr: {
    heading: {
      Context: ['Contexto'], 'Problem Statement': ['Planteamiento del Problema', 'Enunciado del Problema', 'Problema'],
      Requirements: ['Requisitos', 'Requerimientos'], 'Business Drivers': ['Impulsores de Negocio', 'Motivadores de Negocio', 'Impulsores del Negocio'],
      Decision: ['Decisión'], Summary: ['Resumen'], 'Detailed Decision': ['Decisión Detallada'], Scope: ['Alcance'],
      Rationale: ['Justificación', 'Fundamento', 'Fundamentación'], 'Primary Drivers': ['Impulsores Principales', 'Motivadores Principales'],
      'Comparison Summary': ['Resumen Comparativo', 'Resumen de Comparación'], Consequences: ['Consecuencias'],
      'Positive Consequences': ['Consecuencias Positivas'], 'Negative Consequences': ['Consecuencias Negativas'],
      'Trade-offs': ['Compensaciones', 'Concesiones', 'Contrapartidas', 'Compromisos'], 'Alternatives Considered': ['Alternativas Consideradas', 'Alternativas'],
      'Implementation Plan': ['Plan de Implementación'], Phases: ['Fases'], Dependencies: ['Dependencias'], Risks: ['Riesgos'],
      'Success Metrics': ['Métricas de Éxito'], 'Quantitative Metrics': ['Métricas Cuantitativas'], 'Qualitative Metrics': ['Métricas Cualitativas'],
      'Review Timeline': ['Cronograma de Revisión', 'Calendario de Revisión'], References: ['Referencias'], Documentation: ['Documentación'],
      'Research & Analysis': ['Investigación y Análisis'], 'Related ADRs': ['ADRs Relacionados', 'ADR Relacionados'], 'External Resources': ['Recursos Externos'],
      'Review History': ['Historial de Revisión', 'Historial de Revisiones', 'Historial'], Notes: ['Notas'],
    },
    label: {
      Status: ['Estado'], Scope: ['Alcance'], Date: ['Fecha'], Authors: ['Autores', 'Autor'], Related: ['Relacionados', 'Relacionado'],
      Severity: ['Severidad', 'Gravedad'], Mitigation: ['Mitigación'], 'Success Criteria': ['Criterios de Éxito'], Owner: ['Responsable', 'Propietario'],
      'Initial Review': ['Revisión Inicial'], 'Final Review': ['Revisión Final'],
    },
    header: {
      Criteria: ['Criterios', 'Criterio'], 'Selected Option': ['Opción Seleccionada', 'Opción Elegida'], Alternative: ['Alternativa'],
      'Why rejected': ['Por qué se descartó', 'Por qué se rechazó', 'Motivo del rechazo', 'Motivo de descarte'],
      'When it would have been the better choice': ['Cuándo habría sido la mejor opción', 'Cuándo sería la mejor opción'],
      Risk: ['Riesgo'], Probability: ['Probabilidad'], Impact: ['Impacto'], Mitigation: ['Mitigación'],
      Date: ['Fecha'], Reviewer: ['Revisor'], Action: ['Acción'], Notes: ['Notas'], Change: ['Cambio'],
    },
    level: {},
  },
  tdr: {
    heading: {
      Status: ['Estado'], Description: ['Descripción'], Impact: ['Impacto'], 'Possible Solutions': ['Posibles Soluciones', 'Soluciones Posibles', 'Soluciones'],
      Capability: ['Capacidad'], Owner: ['Responsable', 'Propietario', 'Dueño'], History: ['Historial', 'Historia'],
    },
    label: {
      Initiative: ['Iniciativa'], Driver: ['Impulsor', 'Causa', 'Motor', 'Detonante'], Technical: ['Técnico'], 'Business (P&L)': ['Negocio (P&L)', 'Negocio'],
    },
    header: { Level: ['Nivel'], Name: ['Nombre'], 'Code / BIAN id': ['Código / id BIAN', 'Código / BIAN id', 'Código'] },
    level: { 'Business Area': ['Área de Negocio'], 'Business Domain': ['Dominio de Negocio'], 'Service Domain': ['Dominio de Servicio'] },
  },
};

// accent- and case-blind, whitespace collapsed, a trailing number dropped
const key = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+\d+$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
const index = (map) => { const m = new Map(); Object.entries(map).forEach(([en, xs]) => xs.forEach((x) => m.set(key(x), en))); return m; };
const INDEX = Object.fromEntries(Object.entries(VOCAB).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([part, map]) => [part, index(map)]))]));
// the English form itself never counts (accent-blind, `Decisión` and `Decision` share a key)
const localized = (map, found) => { const en = map.get(key(found)); return en && String(found).trim().toLowerCase() !== en.toLowerCase() ? en : null; };
const cellsOf = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.replace(/[`*]/g, '').trim());
const SEP = /^\s*\|?\s*:?-{2,}/;

function structureFindings(src, kind) {
  const I = INDEX[kind]; if (!I) throw new Error(`unknown record kind '${kind}' — adr | tdr`);
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let fence = false, inFront = lines[0] === '---', table = null;
  lines.forEach((l, i) => {
    if (inFront) { if (i > 0 && l === '---') inFront = false; return; }
    if (/^\s*```/.test(l)) { fence = !fence; return; }
    if (fence) return;
    const n = i + 1;
    const h = l.match(/^(#{2,6})\s+(.*)$/);
    if (h) {
      table = null;
      const anchor = h[2].match(/<!--\s*SECTION:\s*([^>]*?)\s*-->/);
      const visible = h[2].replace(/<!--[\s\S]*?-->/g, '').replace(/^\d+[.)]?\s+/, '').trim();
      const en = localized(I.heading, visible);
      if (en || anchor) out.push({ line: n, kind: 'heading', found: h[2].trim(), english: `${h[1]} ${en || visible}`,
        message: `\`${h[1]} ${h[2].trim()}\` — ${en ? `headings stay English: \`${h[1]} ${en}\`` : ''}${en && anchor ? '; ' : ''}${anchor ? 'records carry no anchor comment: drop it' : ''}` });
      return;
    }
    // a label is bold text with its colon (`**Estado**:`, `**Severidad:**`); bold words in prose are prose
    for (const m of l.matchAll(/\*\*([^*]+?)(:?)\*\*(\s*:)?/g)) { if (!m[2] && !m[3]) continue; const en = localized(I.label, m[1]); if (en) out.push({ line: n, kind: 'label', found: m[1], english: en, message: `\`**${m[1]}**\` — labels stay English: \`**${en}**\`` }); }
    if (!/^\s*\|/.test(l)) { table = null; return; }
    if (SEP.test(l)) return;
    const isHeader = !table && SEP.test(lines[i + 1] || '');
    const cells = cellsOf(l);
    if (isHeader) {
      table = { capability: cells.some((c) => ['Level', ...VOCAB.tdr.header.Level].some((x) => key(x) === key(c))) };
      const bad = cells.map((c) => [c, localized(I.header, c)]).filter(([, en]) => en);
      if (bad.length) out.push({ line: n, kind: 'header', found: bad.map(([c]) => c).join(' | '), english: bad.map(([, en]) => en).join(' | '),
        message: `table header ${bad.map(([c, en]) => `\`${c}\` → \`${en}\``).join(', ')} — column headers stay English` });
      return;
    }
    table = table || { capability: false };
    if (table.capability && cells.length) { const en = localized(I.level, cells[0]); if (en) out.push({ line: n, kind: 'level', found: cells[0], english: en, message: `Capability level \`${cells[0]}\` → \`${en}\` — level names stay English` }); }
  });
  return out;
}

// the localized spellings of one label, for a reader that must still find the line (tdr-check reads a translated Driver)
const labelsFor = (kind, en) => [en, ...((VOCAB[kind].label || {})[en] || [])];

// the CLI, callable from the old path under architecture-docs/scripts/ as well
function main(argv) {
  const fs = require('fs');
  const [file, kind] = argv;
  if (!file) { console.error('Usage: bun record-structure.js <record.md> [adr|tdr]'); process.exit(2); }
  const k = kind || (/TDR-/i.test(file) ? 'tdr' : 'adr');
  const f = structureFindings(fs.readFileSync(file, 'utf8'), k);
  f.forEach((x) => console.log(`${file}:${x.line} ${x.message}`));
  process.exit(f.length ? 1 : 0);
}

module.exports = { structureFindings, labelsFor, VOCAB, main };

if (require.main === module) main(process.argv.slice(2));
