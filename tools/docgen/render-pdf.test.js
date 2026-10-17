/**
 * PDF renderer unit tests.
 *
 * Covers the two layers this repo owns: the glyph sanitizer (Roboto cannot render
 * arrows, dingbats or emoji, and pdfkit drops what it cannot map) and the
 * block → pdfmake docDefinition mapping. Rendering itself is pdfmake's concern;
 * the last test asserts only that a real PDF is produced end to end.
 *
 * @module render-pdf.test
 */

import { describe, test, expect, afterAll } from 'bun:test';
import { existsSync, rmSync, statSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const renderPdf = require('./render-pdf.js');
const { buildDocDefinition, sanitize, blocksToPdf } = renderPdf;
const { parseMarkdown, extractDirectives, DOC_TYPES, LABELS } = require('./generate-doc.js');

const LABELS_EN = LABELS.en;
const PO_TYPE = DOC_TYPES['po-spec'];

const tmp = mkdtempSync(join(tmpdir(), 'docgen-pdf-'));
afterAll(() => { try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

const defOf = (markdown, docType = 'po-spec') => {
  const d = extractDirectives(markdown);
  return buildDocDefinition({
    docType,
    title: 'Test Document',
    blocks: parseMarkdown(d.cleanContent || markdown, docType),
    meta: { Version: '1.0', Status: 'Draft' },
    labels: LABELS_EN,
    typeMeta: DOC_TYPES[docType],
    changelog: d.changelog || null,
  });
};

// Depth-first search for the first node satisfying `pred`.
const find = (node, pred) => {
  if (node == null || typeof node !== 'object') return null;
  if (pred(node)) return node;
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const hit = find(v, pred);
    if (hit) return hit;
  }
  return null;
};

const allText = (node) => JSON.stringify(node);

// ============================================================================
// Glyph sanitizer
// ============================================================================

describe('sanitize', () => {
  test('transliterates arrows Roboto cannot render', () => {
    expect(sanitize('PO Spec → ARCHITECTURE.md')).toBe('PO Spec -> ARCHITECTURE.md');
    expect(sanitize('a ← b ↔ c ⇒ d')).toBe('a <- b <-> c => d');
  });

  test('transliterates check and cross marks to ASCII boxes', () => {
    expect(sanitize('✓ done')).toBe('[x] done');
    expect(sanitize('✅ done')).toBe('[x] done');
    expect(sanitize('☐ todo')).toBe('[ ] todo');
  });

  test('maps comparison operators', () => {
    expect(sanitize('score ≥ 7.5')).toBe('score >= 7.5');
    expect(sanitize('n ≤ 3 and x ≠ y')).toBe('n <= 3 and x != y');
  });

  test('preserves every character Roboto does cover', () => {
    // Verified against the bundled Roboto-Regular with fontkit.
    const keep = 'áéíóú ñ ¿Qué? ¡Sí! Üü — – · … • “curly” €100 °C';
    expect(sanitize(keep)).toBe(keep);
  });

  test('strips emoji and leaves no double spaces', () => {
    expect(sanitize('Report 📄 ready')).toBe('Report ready');
    expect(sanitize('a ⛔ b')).toBe('a [STOP] b');
  });

  test('passes through empty and non-string input untouched', () => {
    expect(sanitize('')).toBe('');
    expect(sanitize(null)).toBe(null);
    expect(sanitize(undefined)).toBe(undefined);
  });
});

// ============================================================================
// Block mapping
// ============================================================================

describe('blocksToPdf', () => {
  test('headings become styled nodes and H1-H3 reach the TOC', () => {
    const content = blocksToPdf(parseMarkdown('# One\n\n## Two\n\n### Three\n\n#### Four\n', 'po-spec'), LABELS_EN);
    const heads = content.filter((c) => c.style && c.style.startsWith('h'));
    expect(heads.map((h) => h.style)).toEqual(['h1', 'h2', 'h3', 'h4']);
    expect(heads.slice(0, 3).every((h) => h.tocItem === 'mainToc')).toBe(true);
    expect(heads[3].tocItem).toBeUndefined();
  });

  test('inline markdown becomes discrete runs', () => {
    const [para] = blocksToPdf(parseMarkdown('Plain **bold** and *italic* and `code`.\n', 'po-spec'), LABELS_EN);
    const kinds = para.text.map((r) => (r.bold ? 'bold' : r.italics ? 'italic' : r.background ? 'code' : 'text'));
    expect(kinds).toContain('bold');
    expect(kinds).toContain('italic');
    expect(kinds).toContain('code');
  });

  test('links keep their href', () => {
    const [para] = blocksToPdf(parseMarkdown('See [the guide](https://example.com/g).\n', 'po-spec'), LABELS_EN);
    const link = para.text.find((r) => r.link);
    expect(link.link).toBe('https://example.com/g');
    expect(link.text).toBe('the guide');
  });

  test('nested bullets keep their depth instead of flattening', () => {
    const md = '- top\n  - child\n    - grandchild\n- second\n';
    const [list] = blocksToPdf(parseMarkdown(md, 'po-spec'), LABELS_EN);
    expect(list.ul).toBeDefined();
    // Two top-level items, and a nested ul hanging off the first.
    const nested = list.ul.find((i) => i.ul);
    expect(nested).toBeDefined();
    expect(allText(list)).toContain('grandchild');
    expect(allText(list)).toContain('second');
  });

  test('numbered lists use ol', () => {
    const [list] = blocksToPdf(parseMarkdown('1. first\n2. second\n', 'po-spec'), LABELS_EN);
    expect(list.ol).toBeDefined();
    expect(list.ol.length).toBe(2);
  });

  test('tables carry a header row and one body row per source row', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n';
    const [tbl] = blocksToPdf(parseMarkdown(md, 'po-spec'), LABELS_EN);
    expect(tbl.table.headerRows).toBe(1);
    expect(tbl.table.body.length).toBe(3);
    expect(tbl.table.body[0][0].text).toBe('A');
    expect(tbl.table.body[2][1].text).toBe('4');
  });

  test('ragged table rows are padded rather than throwing', () => {
    const md = '| A | B | C |\n|---|---|---|\n| 1 |\n';
    const [tbl] = blocksToPdf(parseMarkdown(md, 'po-spec'), LABELS_EN);
    expect(tbl.table.body[1].length).toBe(3);
    expect(tbl.table.body[1][2].text).toBe('');
  });

  test('code blocks preserve leading whitespace', () => {
    const md = '```js\nconst a = 1;\n  indented\n```\n';
    const content = blocksToPdf(parseMarkdown(md, 'po-spec'), LABELS_EN);
    const cell = find(content, (n) => n.preserveLeadingSpaces);
    expect(cell.text).toContain('  indented');
  });

  test('sanitizes glyphs inside table cells and headings', () => {
    const md = '# Flow →\n\n| Step | Note |\n|---|---|\n| A → B | ✓ |\n';
    const content = blocksToPdf(parseMarkdown(md, 'po-spec'), LABELS_EN);
    const dumped = allText(content);
    expect(dumped).not.toContain('→');
    expect(dumped).not.toContain('✓');
    expect(dumped).toContain('A -> B');
  });
});

// ============================================================================
// Document assembly
// ============================================================================

describe('buildDocDefinition', () => {
  test('emits a cover page, a TOC placeholder and the body', () => {
    const def = defOf('# Title\n\nBody text.\n');
    expect(def.pageSize).toBe('LETTER');
    expect(find(def.content, (n) => n.toc)).toBeTruthy();
    expect(allText(def.content)).toContain('Product Owner Specification');
    expect(allText(def.content)).toContain('Body text.');
  });

  test('suppresses header and footer on the cover page only', () => {
    const def = defOf('# Title\n\nBody.\n');
    expect(def.header(1)).toBeNull();
    expect(def.footer(1, 9)).toBeNull();
    expect(def.header(2)).toBeTruthy();
    expect(def.footer(2, 9).text).toContain('Page 2 of 9');
  });

  test('localizes chrome but not the body', () => {
    const d = extractDirectives('# Título\n\nCuerpo.\n');
    const def = buildDocDefinition({
      docType: 'po-spec', title: 'Título',
      blocks: parseMarkdown(d.cleanContent, 'po-spec'),
      meta: {}, labels: LABELS.es,
      typeMeta: Object.assign({}, PO_TYPE, LABELS.es.docTypeLabels['po-spec']),
      changelog: null,
    });
    expect(allText(def.content)).toContain('Índice');
    expect(def.footer(2, 3).text).toContain('Página 2 de 3');
    expect(allText(def.content)).toContain('Cuerpo.');
  });

  test('prepends a change log when the CHANGELOG directive is present', () => {
    const def = defOf('<!-- CHANGELOG: 1.0|2026-01-01|Ana|Initial -->\n# T\n\nBody.\n');
    const dumped = allText(def.content);
    expect(dumped).toContain('Change Log');
    expect(dumped).toContain('Initial');
  });

  test('strips HTML comments but keeps the visible heading of a SECTION anchor', () => {
    const def = defOf('# T\n\n## Resumen <!-- SECTION: Executive Summary -->\n\nBody.\n');
    const dumped = allText(def.content);
    expect(dumped).toContain('Resumen');
    expect(dumped).not.toContain('SECTION:');
    expect(dumped).not.toContain('Executive Summary');
  });

  test('carries the document type colour through to the cover badge', () => {
    const def = defOf('# T\n\nBody.\n');
    expect(allText(def.content)).toContain('#2E6B3A');
  });
});

// ============================================================================
// End-to-end
// ============================================================================

describe('renderPdf', () => {
  test('writes a real PDF file', async () => {
    const out = join(tmp, 'e2e.pdf');
    const md = [
      '# End To End', '', 'Intro paragraph with **bold** and → arrow.', '',
      '## Table', '', '| A | B |', '|---|---|', '| 1 | 2 |', '',
      '- bullet', '  - nested', '', '```js', 'const x = 1;', '```', '',
      '> A quote.', '', '---', '', 'Closing with áéíóú ñ ¿Qué?',
    ].join('\n');
    const d = extractDirectives(md);
    await renderPdf({
      docType: 'po-spec', title: 'End To End',
      blocks: parseMarkdown(d.cleanContent || md, 'po-spec'),
      meta: { Version: '1.0' }, output: out,
      labels: LABELS_EN, typeMeta: PO_TYPE, changelog: null,
    });
    expect(existsSync(out)).toBe(true);
    // A PDF carrying an embedded font subset is comfortably over 10KB.
    expect(statSync(out).size).toBeGreaterThan(10000);
  });
});

// ─── Glyph coverage ───────────────────────────────────────────────────────────
// The sanitizer exists so nothing vanishes silently. It previously failed in
// both directions: it swept whole ranges Roboto partly covers (deleting a
// renderable glyph), and left two ranges Roboto covers nowhere unswept (so
// pdfkit dropped them without a trace). Codepoints below were verified against
// the bundled Roboto-Regular cmap.

describe('sanitize — glyphs Roboto can render are preserved', () => {
  // Present in Roboto despite living inside the swept U+2200–U+22FF block.
  for (const ch of ['∂', '∆', '∏', '∑', '−', '√', '∞', '∫', '≈']) {
    test(`keeps ${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase()})`, () => {
      expect(sanitize(`a ${ch} b`)).toBe(`a ${ch} b`);
    });
  }

  // Present in Roboto despite living inside the swept U+2580–U+25FF block.
  for (const ch of ['■', '◊', '○']) {
    test(`keeps ${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase()})`, () => {
      expect(sanitize(`a ${ch} b`)).toBe(`a ${ch} b`);
    });
  }

  test('a latency figure keeps its approximation sign', () => {
    expect(sanitize('p99 ≈ 250ms')).toBe('p99 ≈ 250ms');
  });

  test('a typographic minus is not deleted', () => {
    expect(sanitize('delta −12%')).toBe('delta −12%');
  });
});

describe('sanitize — glyphs Roboto cannot render are transliterated, never dropped', () => {
  const cases = [
    ['⬅', '<-'], ['⬆', '^'], ['⬇', 'v'], ['➡', '->'], ['⭐', '*'],
    ['①', '(1)'], ['②', '(2)'], ['⑩', '(10)'],
  ];
  for (const [ch, expected] of cases) {
    test(`${ch} → ${expected}`, () => {
      expect(sanitize(`a ${ch} b`)).toBe(`a ${expected} b`);
    });
  }

  test('heavy and light arrows agree', () => {
    expect(sanitize('⬅')).toBe(sanitize('←'));
  });

  test('an unmapped emoji is still removed with its adjacent space', () => {
    expect(sanitize('a 📄 b')).toBe('a b');
  });

  test('no swept-range character survives untranslated', () => {
    // Every codepoint in the fully-absent ranges must leave as ASCII or vanish,
    // never pass through as itself.
    const absentRanges = [[0x2190, 0x21ff], [0x2300, 0x23ff], [0x2460, 0x24ff],
                          [0x2500, 0x257f], [0x2600, 0x27bf], [0x2b00, 0x2bff]];
    for (const [lo, hi] of absentRanges) {
      for (let cp = lo; cp <= hi; cp++) {
        const ch = String.fromCodePoint(cp);
        expect(sanitize(ch)).not.toContain(ch);
      }
    }
  });
});

// ─── Comment stripping vs fenced code ─────────────────────────────────────────

describe('extractDirectives — fenced code is not stripped', () => {
  const source = [
    '# Title',
    '',
    '## Section <!-- SECTION: Executive Summary -->',
    '',
    '<!-- editorial comment, must be removed -->',
    'Body text.',
    '',
    '```html',
    '<!-- documented sample, must survive -->',
    '<div>x</div>',
    '```',
    '',
    'Tail.',
  ].join('\n');

  const clean = () => extractDirectives(source).cleanContent;

  test('removes an editorial comment outside a fence', () => {
    expect(clean()).not.toContain('editorial comment');
  });

  test('preserves an HTML comment inside a fence', () => {
    // Stripping used to run over the whole document, silently deleting comments
    // from the code samples a deliverable exists to show.
    expect(clean()).toContain('documented sample, must survive');
  });

  test('the code block reaches the renderer intact', () => {
    const code = parseMarkdown(clean(), 'po-spec').find(b => b.type === 'code');
    expect(code.text).toContain('<!-- documented sample, must survive -->');
    expect(code.text).toContain('<div>x</div>');
  });

  test('still folds the SECTION anchor onto its heading', () => {
    const c = clean();
    expect(c).not.toContain('SECTION:');
    expect(c).toContain('## Section');
  });

  test('an anchor name containing ">" still folds', () => {
    const md = '# T\n\n## Flow <!-- SECTION: A -> B -->\n\nbody\n';
    expect(extractDirectives(md).cleanContent).not.toContain('SECTION:');
  });

  test('an unterminated fence keeps its content verbatim', () => {
    const md = '# T\n\n```js\n<!-- kept -->\nconst x = 1;\n';
    expect(extractDirectives(md).cleanContent).toContain('<!-- kept -->');
  });
});

// ─── CRLF input ───────────────────────────────────────────────────────────────
// docgen runs against user project markdown, which on Windows is routinely
// CRLF. Splitting on '\n' alone left a trailing '\r' on every line, which broke
// every `$`-anchored line test — most visibly the table separator filter, so
// `|---|---|` rendered as a data row in every exported table.

describe('CRLF input parity', () => {
  const SOURCE = [
    '# Title', '', '## Section', '',
    '| A | B |', '|---|---|', '| 1 | 2 |', '',
    'Line one', 'continued', '',
    '- bullet one', '- bullet two', '',
    '> quoted line', '',
  ].join('\n');

  const parse = (text) => parseMarkdown(text, 'po-spec');
  const crlf = SOURCE.replace(/\n/g, '\r\n');

  test('produces identical blocks for LF and CRLF', () => {
    expect(parse(crlf)).toEqual(parse(SOURCE));
  });

  test('table keeps its separator row parseable (not turned into data)', () => {
    const table = parse(crlf).find((b) => b.type === 'table');
    expect(table).toBeDefined();
    expect(table.lines).toEqual(['| A | B |', '|---|---|', '| 1 | 2 |']);
    // The filter both renderers use must drop exactly the separator.
    const dataLines = table.lines.filter((l) => !/^\|[\s\-:|]+\|\r?$/.test(l));
    expect(dataLines).toEqual(['| A | B |', '| 1 | 2 |']);
  });

  test('paragraph text carries no embedded carriage return', () => {
    const para = parse(crlf).find((b) => b.type === 'paragraph');
    expect(para.text).toBe('Line one continued');
    expect(para.text).not.toContain('\r');
  });

  test('no block of any type retains a carriage return', () => {
    const asText = JSON.stringify(parse(crlf));
    expect(asText).not.toContain('\\r');
  });

  test('a CRLF document renders to a real PDF', async () => {
    const out = join(tmp, 'crlf.pdf');
    await renderPdf({
      docType: 'po-spec', title: 'CRLF',
      blocks: parse(crlf),
      meta: { Version: '1.0' }, output: out,
      labels: LABELS_EN, typeMeta: PO_TYPE, changelog: null,
    });
    expect(existsSync(out)).toBe(true);
    expect(statSync(out).size).toBeGreaterThan(10000);
  });
});
