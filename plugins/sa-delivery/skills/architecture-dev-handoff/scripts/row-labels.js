// row-labels.js — the handoff kit's row labels: which tables of the four templates are label tables, the closed EN↔ES
// list in ROW_LABELS.json, the `## Row Labels` section a payload carries, and the reading kit-check.js holds the kit to.
//
// A label table is a template table whose every body row opens with a literal cell — `| timeout | … |`,
// `| **Dev** | … |` — never a placeholder (`[component-a]`), a number or a `§` reference. It is keyed by the
// `<!-- SECTION: … -->` anchor of the H2 above it (none for the metadata table before the first H2) and its header,
// which stays English in every language. Through 8.110.0 each generator translated the labels on its own: one
// 2026-10-01 kit carried "Versión de Arquitectura", "Versión de arquitectura" and "Versión de la arquitectura" in three
// documents, and every run the orchestrator translated leftover English labels by hand.
'use strict';
const fs = require('fs');
const path = require('path');

const SKILL = path.join(__dirname, '..');
const REGISTRY = JSON.parse(fs.readFileSync(path.join(SKILL, 'ROW_LABELS.json'), 'utf8'));
const TEMPLATES = { seam: 'SEAM_SPEC_TEMPLATE.md', settei: 'SETTEI_TEMPLATE.md', ekonte: 'SYSTEM_EKONTE_TEMPLATE.md', cutsheet: 'CUT_SHEET_TEMPLATE.md' };

const isRow = (l) => /^\|/.test(l) && !/^\|[-\s|:]*$/.test(l);
const isSep = (l) => /^\|[-\s|:]+\|?\s*$/.test(l) && /-/.test(l);
const firstCell = (l) => (l.split('|')[1] || '').trim();
const bare = (c) => c.replace(/^\*\*(.*)\*\*$/, '$1').trim();
const headerKey = (l) => l.split('|').slice(1, -1).map((c) => c.trim().toLowerCase()).join('|');
const literal = (c) => !!c && !/^\[/.test(c) && !/^[\d§#]/.test(c) && !/[[\]]/.test(c);

/** Every table of a Markdown source with its anchor: { anchor, header, key, rows: [{ line, cell }] } (line 0-based). */
function tablesOf(src) {
  const ls = src.split('\n'); const out = []; let anchor = null; let fence = false;
  for (let i = 0; i < ls.length; i++) {
    if (/^```/.test(ls[i])) { fence = !fence; continue; } if (fence) continue;
    const h2 = ls[i].match(/^##\s+(?!#).*?<!--\s*SECTION:\s*([^>]+?)\s*-->/); if (h2) { anchor = h2[1]; continue; } if (/^##\s+(?!#)/.test(ls[i])) { anchor = null; continue; }
    if (isRow(ls[i]) && ls[i + 1] && isSep(ls[i + 1])) { const rows = []; let j = i + 2; while (j < ls.length && isRow(ls[j])) { rows.push({ line: j, cell: firstCell(ls[j]) }); j++; }
      out.push({ anchor, header: ls[i], key: headerKey(ls[i]), rows }); i = j - 1; }
  }
  return out;
}

let CACHE = null;
/** The label tables of each template: { seam: [{ anchor, key, labels: [English, …] }], … } — read from the files in force. */
function labelTables() {
  if (CACHE) return CACHE; CACHE = {};
  for (const [kind, t] of Object.entries(TEMPLATES)) { const f = path.join(SKILL, t);
    CACHE[kind] = !fs.existsSync(f) ? [] : tablesOf(fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n'))
      .filter((tb) => tb.rows.length && tb.rows.every((r) => literal(bare(r.cell))))
      .map((tb) => ({ anchor: tb.anchor, key: tb.key, labels: tb.rows.map((r) => bare(r.cell)) })); }
  return CACHE;
}
/** Which template a kit file renders, by its place in the kit. */
function kindOf(file) {
  const b = path.basename(file), d = path.basename(path.dirname(path.resolve(file)));
  if (d === 'interfaces') return 'seam'; if (d === 'components') return 'cutsheet';
  if (b === 'SYSTEM_RUNTIME_VIEW.md') return 'ekonte'; if (b === 'CROSS_CUTTING_STANDARDS.md') return 'settei';
  return null;
}
/** A template label in `lang`; English is the label itself. Undefined when the registry has no entry. */
const translate = (label, lang) => (!lang || lang === 'en' ? label : (REGISTRY[lang] || {})[label]);
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Every template label of the given kinds, in order, without repeats. */
const labelsOf = (kinds) => [...new Set(kinds.flatMap((k) => (labelTables()[k] || []).flatMap((t) => t.labels)))];

/** The `## Row Labels` section of a payload under a non-English language — '' under English. */
function payloadSection(kinds, lang) {
  if (!lang || lang === 'en') return '';
  const rows = labelsOf(kinds).map((l) => `| ${l} | ${translate(l, lang) || `[NOT REGISTERED — add to ROW_LABELS.json]`} |`);
  return `## Row Labels <!-- SECTION: Row Labels -->\n\nEvery first-column label of a template table, in \`${lang}\` — copy the value verbatim; never translate a row label yourself. A value equal to its English key is a technical term kept in English. Column headers stay English.\n\n| English (template) | ${lang} |\n|---|---|\n${rows.join('\n')}\n`;
}

/**
 * The label rows of a written kit file against the registry: findings and the fixes `--fix` applies.
 *   unregistered — a label row whose cell is not the template label in `lang` (an English label under `es`, or a
 *                  free translation); fix — the registered label, when the cell is the English label or the registered
 *                  one up to case, accents and spacing; otherwise no fix, the finding names the labels allowed.
 */
function review(file, src, lang) {
  const kind = kindOf(file); if (!kind) return { kind: null, findings: [], fixes: [] };
  const findings = [], fixes = []; const tpl = labelTables()[kind];
  tablesOf(src).forEach((tb) => {
    const t = tpl.find((x) => x.anchor === tb.anchor && x.key === tb.key); if (!t) return;
    const allowed = t.labels.map((l) => translate(l, lang) || l);
    tb.rows.forEach((r) => {
      const cell = bare(r.cell); if (allowed.includes(cell)) return;
      const bold = /^\*\*.*\*\*$/.test(r.cell);
      const at = t.labels.indexOf(cell) >= 0 ? t.labels.indexOf(cell) : allowed.findIndex((a) => fold(a) === fold(cell));
      const want = at >= 0 ? allowed[at] : null;
      findings.push({ rule: lang !== 'en' && t.labels.includes(cell) ? 'row-label-language' : 'row-label-unregistered', line: r.line + 1,
        text: want ? `row label "${cell}" — the registered label under ${lang} is "${want}" (ROW_LABELS.json; kit-check --fix writes it)` : `row label "${cell}" is not a registered label of this table under ${lang} — one of: ${allowed.join(' · ')}` });
      if (want) fixes.push({ line: r.line, from: r.cell, to: bold ? `**${want}**` : want });
    });
  });
  return { kind, findings, fixes };
}
/** Apply review() fixes to the source: the first cell of each fixed line, nothing else. */
function applyFixes(src, fixes) {
  const ls = src.split('\n');
  fixes.forEach((f) => { const parts = ls[f.line].split('|'); parts[1] = parts[1].replace(f.from, f.to); ls[f.line] = parts.join('|'); });
  return ls.join('\n');
}

module.exports = { REGISTRY, TEMPLATES, labelTables, labelsOf, kindOf, translate, payloadSection, review, applyFixes, tablesOf };
