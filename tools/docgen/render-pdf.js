/**
 * PDF renderer for the Solution Architecture document generator.
 *
 * Consumes the format-neutral block list produced by generate-doc.js
 * (extractDirectives → parseMarkdown) and emits a paginated PDF via pdfmake.
 * Required lazily by generate-doc.js only when `--format pdf` is passed, so an
 * install carrying just `docx` keeps a fully working Word path.
 *
 * Layout intentionally mirrors the .docx renderer: cover page in the document
 * type's colour, table of contents, running header, footer with "Page N of M".
 */

const fs = require('fs');
const { pinnedRequire } = require('../../scripts/shared/pinned.js');   // at tools/docgen's pin, never Bun's auto-install
const INSTALL_IN = { installIn: require('path').join(__dirname, '..', '..') };   // `bun install` runs at sa-skills' root, the workspace
const PdfPrinter = pinnedRequire(__dirname, 'pdfmake', INSTALL_IN);
const { fitDimensions } = require('./render-mermaid.js');

// ─── Fonts ────────────────────────────────────────────────────────────────────
// pdfmake ships the four Roboto faces as base64 in build/vfs_fonts. pdfkit's font()
// accepts a Buffer, so they are embedded directly — no vendored .ttf files and no
// dependency on a system font. The export shape moved between pdfmake 0.1 and 0.2,
// hence the three-way unwrap.
function loadFonts() {
  const mod = pinnedRequire(__dirname, 'pdfmake/build/vfs_fonts.js', INSTALL_IN);
  const vfs = mod.pdfMake ? mod.pdfMake.vfs : (mod.vfs || mod);
  const buf = (name) => {
    if (!vfs[name]) throw new Error(`pdfmake vfs is missing ${name}`);
    return Buffer.from(vfs[name], 'base64');
  };
  return {
    Roboto: {
      normal:      buf('Roboto-Regular.ttf'),
      bold:        buf('Roboto-Medium.ttf'),
      italics:     buf('Roboto-Italic.ttf'),
      bolditalics: buf('Roboto-MediumItalic.ttf'),
    },
  };
}

// ─── Glyph sanitizer ──────────────────────────────────────────────────────────
// Roboto covers Latin-1 and General Punctuation in full — every Spanish accent,
// the inverted marks, em/en dashes, ellipsis, middot, bullets and curly quotes all
// render. It does NOT cover arrows, dingbats, box drawing or emoji, and pdfkit
// silently drops what a font cannot map. Those characters are common in this
// plugin's own prose ("PO Spec → ARCHITECTURE.md", "✅ done", seam names written
// `<upstream>→<downstream>`), so they are transliterated to ASCII rather than lost.
//
// Verified with fontkit hasGlyphForCodePoint against the bundled Roboto-Regular:
// U+00E1 U+00F1 U+00BF U+2014 U+2013 U+00B7 U+2026 U+2022 U+201C U+20AC → present;
// U+2192 U+2713 U+2717 U+26D4 U+26A0 U+2611 U+2610 U+1F4C4 → absent.
const GLYPH_MAP = {
  '→': '->',  '←': '<-',  '↔': '<->', '⇒': '=>',  '⇐': '<=',  '⇔': '<=>',
  '↑': '^',   '↓': 'v',   '⟶': '->',  '➔': '->',  '►': '>',   '◄': '<',
  '✓': '[x]', '✔': '[x]', '☑': '[x]', '✅': '[x]',
  '✗': '[ ]', '✘': '[ ]', '☐': '[ ]', '❌': '[x]',
  '⛔': '[STOP]', '⚠': '[!]', '★': '*', '☆': '*', '●': '*', '◦': '-', '▪': '-',
  '≥': '>=',  '≤': '<=',  '≠': '!=',  '×': 'x',   '÷': '/',
  // U+2B00–U+2BFF (misc symbols and arrows) and U+2460–U+24FF (enclosed
  // alphanumerics). Roboto has no glyph anywhere in either block, and neither
  // was swept, so these used to reach pdfkit and be dropped without a trace —
  // note '←' was mapped while its heavy twin '⬅' was not.
  '⬅': '<-',  '⬆': '^',   '⬇': 'v',   '➡': '->',  '⬈': '/',   '⬉': '\\',
  '⭐': '*',  '⬛': '[#]', '⬜': '[ ]',
  '①': '(1)', '②': '(2)', '③': '(3)', '④': '(4)', '⑤': '(5)',
  '⑥': '(6)', '⑦': '(7)', '⑧': '(8)', '⑨': '(9)', '⑩': '(10)',
};

// Ranges Roboto cannot render, swept after the explicit map above has had its
// turn: arrows, math operators, misc technical, box drawing, block/geometric
// shapes, misc symbols, dingbats, enclosed alphanumerics, misc symbols and
// arrows, variation selectors, and the emoji planes.
const UNSUPPORTED_RE = new RegExp(
  '[\\u2190-\\u21FF\\u2200-\\u22FF\\u2300-\\u23FF\\u2460-\\u24FF\\u2500-\\u257F' +
  '\\u2580-\\u25FF\\u2600-\\u27BF\\u2B00-\\u2BFF\\uFE0F\\u200D]' +
  '|[\\u{1F000}-\\u{1FAFF}]',
  'gu'
);

// The sweep above is by range, but three of those ranges are not uniformly
// missing from Roboto. These characters DO render, and deleting them loses
// real content — "latency ≈ 5ms" became "latency 5ms", and a typographic
// minus vanished from a negative figure.
//
// Verified against the bundled Roboto-Regular cmap (format 4): within
// U+2200–U+22FF exactly twelve codepoints are present, within U+2580–U+25FF
// exactly four, and U+2190–U+21FF, U+2300–U+23FF, U+2460–U+24FF,
// U+2500–U+257F, U+2600–U+27BF and U+2B00–U+2BFF are empty in full.
// '●' is the fourth renderable glyph in U+2580–U+25FF but is deliberately NOT
// listed here: GLYPH_MAP has always transliterated it to '*' (checked first),
// so listing it would be dead code that misleadingly implies preservation.
const RENDERABLE_IN_SWEPT_RANGES = new Set([
  '∂', '∆', '∏', '∑', '−', '√', '∞', '∫', '≈', '≠', '≤', '≥',  // U+2200–U+22FF
  '■', '◊', '○',                                                 // U+2580–U+25FF
]);

function sanitize(text) {
  if (typeof text !== 'string' || text === '') return text;
  const SENTINEL = String.fromCharCode(1); // never occurs in Markdown source

  let out = '';
  for (const ch of text) {
    if (Object.prototype.hasOwnProperty.call(GLYPH_MAP, ch)) { out += GLYPH_MAP[ch]; continue; }
    // Checked before the sweep so a renderable glyph inside a swept range survives.
    if (RENDERABLE_IN_SWEPT_RANGES.has(ch)) { out += ch; continue; }
    UNSUPPORTED_RE.lastIndex = 0;
    out += UNSUPPORTED_RE.test(ch) ? SENTINEL : ch;
  }

  // Close the gap a dropped glyph leaves: "a 📄 b" → "a b", "Report📄" →
  // "Report". Marking removals with a sentinel first means only the whitespace
  // that actually touched a dropped glyph is affected — a blanket space
  // collapse here would destroy code-block indentation.
  return out.replace(new RegExp(' ?' + SENTINEL + '+ ?', 'g'), (mm) =>
    (mm.startsWith(' ') && mm.endsWith(' ') ? ' ' : ''));
}

// ─── Palette ──────────────────────────────────────────────────────────────────
// Mirrors the docx COLORS map. pdfmake wants CSS hex, the docx model wants bare hex,
// so these carry the leading '#'.
const C = {
  primary:   '#1F4E79',
  secondary: '#2E75B6',
  accent:    '#4472C4',
  headerBg:  '#D6E4F0',
  text:      '#1A1A1A',
  subtext:   '#595959',
  white:     '#FFFFFF',
  border:    '#BDD7EE',
  codeBg:    '#F4F6FB',
  codeText:  '#2E75B6',
  codeFill:  '#F0F4FA',
};

const hex = (c) => (c && c.startsWith('#') ? c : `#${c}`);

// ─── Conditional table fills ──────────────────────────────────────────────────
// Ported verbatim from the docx renderers so a table means the same thing in both
// formats. Do not re-derive these values.
const EDITABLE_FILL = '#FFF9E6';

const PRIORITY_FILL = {
  'Critical': '#FFE0E0', 'High': '#FFE8CC', 'Medium': '#FFF0CC', 'Low': '#E8F4E8',
};
const REGISTER_STATUS_FILL = {
  'Non-Compliant': '#FFE0E0', 'Unknown': '#FFF9E6', 'Not Applicable': '#F0F0F0',
};
const COMPLIANCE_STATUS_FILL = {
  'Compliant': '#E6F4EA', 'Non-Compliant': '#FFE0E0',
  'Not Applicable': '#F0F0F0', 'Unknown': '#FFF9E6',
};
const SEV_FILL  = { critical: '#FFE0E0', high: '#FFE0E0', medium: '#FFF0CC', low: '#E8F4E8' };
const TIER_FILL = { s1: '#FFE0E0', s2: '#FFF0CC', s3: '#EBF3FA', s4: '#F0F0F0' };

// ─── Inline tokens → pdfmake text runs ────────────────────────────────────────
// The tokenizer lives in generate-doc.js and is the single source of truth for
// inline syntax; requiring it here is safe because that module only runs its CLI
// under `require.main === module`.
const { tokenizeInline } = require('./generate-doc.js');

function runs(text, opts) {
  opts = opts || {};
  const base = { fontSize: opts.fontSize || 10, color: opts.color || C.text };
  return tokenizeInline(String(text == null ? '' : text)).map((t) => {
    const s = sanitize(t.text);
    switch (t.kind) {
      case 'bold':   return Object.assign({}, base, { text: s, bold: true });
      case 'italic': return Object.assign({}, base, { text: s, italics: true });
      case 'code':   return { text: s, fontSize: base.fontSize - 0.5, color: C.codeText, background: C.codeFill };
      case 'link':   return Object.assign({}, base, { text: s, color: C.secondary, decoration: 'underline', link: t.href });
      default:       return Object.assign({}, base, { text: s });
    }
  });
}

// ─── Markdown table helpers ───────────────────────────────────────────────────
// `\r?` guards the case where table lines reach here from a caller that split
// on '\n' alone; parseMarkdown itself now splits on /\r?\n/.
const isSeparatorRow = (l) => /^\|[\s\-:|]+\|\r?$/.test(l);
const parseRow = (line) => line.split('|').slice(1, -1).map((c) => c.trim());

function tableData(lines) {
  const dataLines = lines.filter((l) => !isSeparatorRow(l));
  if (!dataLines.length) return null;
  const headers = parseRow(dataLines[0]);
  if (!headers.length) return null;
  return { headers, rows: dataLines.slice(1).map(parseRow) };
}

function headerCell(text) {
  return {
    text: sanitize(text), bold: true, fontSize: 8.5,
    color: C.primary, fillColor: C.headerBg, margin: [3, 4, 3, 4],
  };
}

function bodyCell(text, fill, fontSize) {
  const cell = {
    text: sanitize(text), fontSize: fontSize || 8.5,
    color: C.text, margin: [3, 3, 3, 3],
  };
  if (fill && fill !== C.white) cell.fillColor = fill;
  return cell;
}

// Shared grid layout — thin blue-tinted rules, matching the docx border colour.
const GRID_LAYOUT = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => C.border,
  vLineColor: () => C.border,
  paddingLeft: () => 4, paddingRight: () => 4,
  paddingTop: () => 2, paddingBottom: () => 2,
};

function buildTable(headers, rows, fillFor, fontSize) {
  const body = [headers.map(headerCell)];
  for (const row of rows) {
    // Pad short rows so pdfmake does not throw on a ragged body.
    const padded = headers.map((_, ci) => (row[ci] == null ? '' : row[ci]));
    body.push(padded.map((cell, ci) => bodyCell(cell, fillFor ? fillFor(cell, ci) : null, fontSize)));
  }
  return {
    table: { headerRows: 1, dontBreakRows: true, widths: headers.map(() => '*'), body },
    layout: GRID_LAYOUT,
    margin: [0, 4, 0, 10],
  };
}

// ─── Specialised tables ───────────────────────────────────────────────────────
function questionsRegisterTable(lines) {
  const d = tableData(lines);
  if (!d) return null;
  const EDITABLE = new Set([4, 6, 7]); // Owner, Action Required, Priority
  return buildTable(d.headers, d.rows, (text, ci) => {
    if (ci === 3) return REGISTER_STATUS_FILL[text] || null;
    if (ci === 7) return PRIORITY_FILL[text] || EDITABLE_FILL;
    if (EDITABLE.has(ci)) return EDITABLE_FILL;
    return null;
  }, 7.5);
}

function complianceSummaryTable(lines) {
  const d = tableData(lines);
  if (!d) return null;
  const STATUS_COL = 3;
  return buildTable(d.headers, d.rows, (text, ci) =>
    (ci === STATUS_COL ? COMPLIANCE_STATUS_FILL[text] || null : null));
}

function changeLogTable(entries, labels) {
  const headers = labels.changeLogHeaders;
  const rows = entries.map((e) => [e.version || '', e.date || '', e.author || '', e.description || '']);
  const body = [headers.map(headerCell)];
  for (const r of rows) body.push(r.map((c) => bodyCell(c)));
  return {
    table: { headerRows: 1, widths: ['auto', 'auto', 'auto', '*'], body },
    layout: GRID_LAYOUT,
    margin: [0, 4, 0, 10],
  };
}

// ─── Blocks → pdfmake content ─────────────────────────────────────────────────
// ─── Fenced code block ────────────────────────────────────────────────────────
// Its own function because the image branch falls back to it.
function codeContent(block) {
  const nodes = [];
  if (block.lang) {
    nodes.push({
      text: ` ${sanitize(block.lang).toUpperCase()} `,
      fontSize: 7, bold: true, color: C.white, background: C.secondary,
      margin: [0, 6, 0, 0],
    });
  }
  // A single-cell table gives the block its left rule and tinted ground; pdfmake
  // has no paragraph-level border primitive.
  nodes.push({
    table: {
      widths: ['*'],
      body: [[{
        text: sanitize(block.text) || ' ',
        // Courier is a PDF standard-14 face and needs no embedding.
        font: 'Roboto', fontSize: 8, color: C.text,
        preserveLeadingSpaces: true, margin: [6, 4, 4, 4],
      }]],
    },
    layout: {
      hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 2 : 0),
      vLineColor: () => C.secondary,
      fillColor: () => C.codeBg,
      paddingLeft: () => 0, paddingRight: () => 0,
      paddingTop: () => 0, paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 8],
  });
  return nodes;
}

// Printable box for an embedded picture, in PDF points: LETTER (612 x 792) less
// the page margins, with the height held short of a full page so a heading and
// its picture can share one.
const IMAGE_MAX = { width: 496, height: 620 };

function imageContent(block) {
  try {
    // The block carries CSS pixels (1/96"); pdfmake wants PDF points (1/72").
    const dims = fitDimensions(block.width * 0.75, block.height * 0.75,
                               IMAGE_MAX.width, IMAGE_MAX.height);
    if (!dims) throw new Error(`no intrinsic size for ${block.src}`);
    // A data URI rather than a path: pdfmake resolves paths against the process
    // cwd, which is the caller's, not this file's.
    const data = fs.readFileSync(block.src).toString('base64');
    return [{
      image: `data:image/png;base64,${data}`,
      width: dims.width, height: dims.height,
      alignment: 'center', margin: [0, 6, 0, 10],
    }];
  } catch (e) {
    console.warn(`Diagram not embedded (${e.message}) — exporting its source instead.`);
    return codeContent({ type: 'code', lang: block.lang || 'mermaid', text: block.source || '' });
  }
}

function blocksToPdf(blocks, labels) {
  const content = [];

  for (const block of blocks) {
    switch (block.type) {

      case 'heading': {
        const level = Math.min(block.level, 4);
        content.push({
          text: sanitize(block.text),
          style: `h${level}`,
          // Only H1-H3 reach the table of contents, matching buildManualToc().
          tocItem: block.level <= 3 ? 'mainToc' : undefined,
          tocStyle: { fontSize: level === 1 ? 11 : level === 2 ? 10 : 9, bold: level <= 2 },
          tocMargin: [(level - 1) * 14, 1, 0, 1],
        });
        break;
      }

      case 'paragraph':
        content.push({ text: runs(block.text), alignment: 'justify', margin: [0, 2, 0, 5] });
        break;

      case 'bullet':
      case 'numbered': {
        // The parser emits a flat list with a `level` per item; rebuild the nesting
        // so pdfmake renders real sub-lists instead of a flattened run of items.
        const key = block.type === 'bullet' ? 'ul' : 'ol';
        const root = [];
        const stack = [root];
        for (const item of block.items) {
          const depth = Math.min(item.level || 0, 2);
          while (stack.length > depth + 1) stack.pop();
          while (stack.length < depth + 1) {
            const nested = [];
            // The sub-list is pushed as a sibling of the preceding item, not as
            // a child of it. pdfmake indents a nested ul/ol that appears in a
            // list's item array, so this renders as real nesting either way —
            // the two branches that used to stand here were byte-identical.
            stack[stack.length - 1].push({ [key]: nested, margin: [0, 1, 0, 1] });
            stack.push(nested);
          }
          stack[stack.length - 1].push({ text: runs(item.text) });
        }
        content.push({ [key]: root, margin: [0, 2, 0, 6] });
        break;
      }

      case 'code':
        content.push(...codeContent(block));
        break;

      // A ```mermaid block the pre-render pass turned into a PNG. The source rides
      // along on the block, so an unreadable cache file degrades to monospace
      // source instead of losing the diagram.
      case 'image':
        content.push(...imageContent(block));
        break;

      case 'blockquote':
        content.push({
          table: {
            widths: ['*'],
            body: [[{ text: runs(block.text, { color: C.subtext }), italics: true, margin: [8, 4, 4, 4] }]],
          },
          layout: {
            hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 3 : 0),
            vLineColor: () => C.accent, fillColor: () => null,
            paddingLeft: () => 0, paddingRight: () => 0,
            paddingTop: () => 0, paddingBottom: () => 0,
          },
          margin: [0, 4, 0, 8],
        });
        break;

      case 'table': {
        const d = tableData(block.lines);
        if (d) content.push(buildTable(d.headers, d.rows));
        break;
      }

      case 'questions-register': {
        const t = questionsRegisterTable(block.lines);
        if (t) {
          content.push(t);
          content.push({ text: sanitize(labels.questionsNote), italics: true, fontSize: 8, color: C.subtext, margin: [10, 0, 0, 8] });
        }
        break;
      }

      case 'compliance-summary': {
        const t = complianceSummaryTable(block.lines);
        if (t) content.push(t);
        break;
      }

      case 'hr':
        content.push({
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: C.border }],
          margin: [0, 5, 0, 8],
        });
        break;
    }
  }

  return content;
}

// ─── Cover page ───────────────────────────────────────────────────────────────
function coverPage(typeMeta, title, meta) {
  const color = hex(typeMeta.color);
  return [
    { canvas: [{ type: 'rect', x: 0, y: 0, w: 495, h: 6, color }], margin: [0, 0, 0, 60] },
    {
      text: `  ${typeMeta.code} · ${sanitize(typeMeta.label)}  `,
      fontSize: 10, bold: true, color: C.white, background: color,
      margin: [0, 0, 0, 14],
    },
    { text: sanitize(title), fontSize: 28, bold: true, color: C.primary, margin: [0, 0, 0, 12] },
    { text: sanitize(typeMeta.tagline), fontSize: 11, italics: true, color: C.subtext, margin: [0, 0, 0, 50] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: color }], margin: [0, 0, 0, 16] },
    {
      table: {
        widths: [110, '*'],
        body: Object.entries(meta).map(([k, v]) => ([
          { text: sanitize(k), bold: true, fontSize: 9, color: C.subtext, margin: [0, 3, 6, 3] },
          { text: sanitize(String(v)), fontSize: 9, color: C.text, margin: [0, 3, 0, 3] },
        ])),
      },
      layout: 'noBorders',
    },
    { text: '', pageBreak: 'after' },
  ];
}

// ─── Document definition ──────────────────────────────────────────────────────
// Split from the writer so the whole block→document mapping is assertable without
// producing a PDF. See render-pdf.test.js.
function buildDocDefinition(opts) {
  const { title, blocks, meta, labels, typeMeta, changelog } = opts;
  const color = hex(typeMeta.color);

  const body = [];
  if (changelog) {
    // tocItem/tocStyle so the Change Log appears in the table of contents like
    // every other H1. Without them the document opened with a section its own
    // TOC did not list.
    body.push({
      text: sanitize(labels.changeLogTitle),
      style: 'h1',
      tocItem: 'mainToc',
      tocStyle: { fontSize: 11, bold: true },
      tocMargin: [0, 1, 0, 1],
    });
    body.push(changeLogTable(changelog, labels));
  }
  body.push(...blocksToPdf(blocks, labels));

  const docDefinition = {
    pageSize: 'LETTER',
    pageMargins: [58, 54, 58, 54],
    info: {
      title: sanitize(title),
      author: sanitize(String(meta[labels.meta.author] || 'Solution Architecture')),
      subject: sanitize(typeMeta.label),
    },
    content: [
      ...coverPage(typeMeta, title, meta),
      { text: sanitize(labels.tocTitle), style: 'h1' },
      { toc: { id: 'mainToc' } },
      { text: '', pageBreak: 'after' },
      ...body,
    ],
    // The cover page is page 1 and carries no chrome, matching the .docx two-section layout.
    header: (currentPage) => (currentPage === 1 ? null : {
      margin: [58, 24, 58, 0],
      columns: [
        { text: [
          { text: `${typeMeta.code}  `, bold: true, color },
          { text: sanitize(title), color: C.subtext },
        ], fontSize: 8 },
      ],
    }),
    footer: (currentPage, pageCount) => (currentPage === 1 ? null : {
      margin: [58, 8, 58, 0],
      text: `${sanitize(typeMeta.label)}  ·  ${sanitize(labels.footerSuffix)}  ·  ` +
            `${sanitize(labels.pageWord)}${currentPage}${sanitize(labels.ofWord)}${pageCount}`,
      alignment: 'center', fontSize: 8, color: C.subtext,
    }),
    styles: {
      h1: { fontSize: 17, bold: true, color: C.primary,   margin: [0, 16, 0, 6] },
      h2: { fontSize: 13, bold: true, color,              margin: [0, 12, 0, 5] },
      h3: { fontSize: 11, bold: true, color: C.secondary, margin: [0, 9, 0, 4] },
      h4: { fontSize: 10, bold: true, italics: true, color: C.subtext, margin: [0, 7, 0, 3] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: C.text, lineHeight: 1.15 },
  };

  return docDefinition;
}

// ─── Entry point ──────────────────────────────────────────────────────────────
// Resolves once the file stream has flushed, so the caller can rely on the file
// existing when the promise settles.
function renderPdf(opts) {
  const docDefinition = buildDocDefinition(opts);
  const printer = new PdfPrinter(loadFonts());
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(opts.output);
    stream.on('finish', () => resolve(opts.output));
    stream.on('error', reject);
    pdfDoc.on('error', reject);
    pdfDoc.pipe(stream);
    pdfDoc.end();
  });
}

module.exports = renderPdf;
module.exports.buildDocDefinition = buildDocDefinition;
module.exports.sanitize = sanitize;
module.exports.blocksToPdf = blocksToPdf;
module.exports.imageContent = imageContent;
