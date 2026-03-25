#!/usr/bin/env bun
/**
 * Professional Word Document Generator
 * For Solution Architecture outputs from Claude Code
 *
 * Usage:
 *   bun run generate-doc.js --type solution-architecture --input ARCHITECTURE.md --output exports/SA-project.docx
 *   bun run generate-doc.js --type adr                  --input ADR-001.md       --output exports/ADR-001.docx
 *   bun run generate-doc.js --type handoff              --input handoff.md        --output exports/HANDOFF-api.docx
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TableOfContents, ExternalHyperlink, ImageRun
} = require('docx');

// ─── Corporate Blue Palette (reserved for Solution Architecture docs) ─────────
const COLORS = {
  primary:    '1F4E79',  // Deep corporate blue
  secondary:  '2E75B6',  // Medium blue
  accent:     '4472C4',  // Light blue
  headerBg:   'D6E4F0',  // Very light blue (table headers)
  altRow:     'EBF3FA',  // Alt table row
  text:       '1A1A1A',  // Near black
  subtext:    '595959',  // Dark gray
  white:      'FFFFFF',
  border:     'BDD7EE',  // Blue-tinted border
};

// ─── Document type metadata ───────────────────────────────────────────────────
// Corporate blue is reserved for architecture docs (SA, ADR).
// Handoff uses teal — visually distinct from architecture artifacts.
const DOC_TYPES = {
  'solution-architecture': {
    label:   'Solution Architecture',
    code:    'SA',
    color:   COLORS.primary,          // Corporate blue
    tagline: 'Solution Architecture · Technical Design',
  },
  adr: {
    label:   'Architecture Decision Record',
    code:    'ADR',
    color:   COLORS.primary,          // Corporate blue — part of the architecture bundle
    tagline: 'Solution Architecture · Architecture Decisions',
  },
  handoff: {
    label:   'Component Development Handoff',
    code:    'HANDOFF',
    color:   '0D7377',                // Teal — development phase, distinct from architecture
    tagline: 'Solution Architecture · Implementation Guide for Development Teams',
  },
};

// ─── Page layout constants ────────────────────────────────────────────────────
const PAGE = {
  width:   12240,  // 8.5"
  height:  15840,  // 11"
  marginH: 1260,   // ~0.875" left/right
  marginV: 1080,   // 0.75" top/bottom
  content: 9720,   // 12240 - 2*1260
};

// ─── Markdown parser (lightweight) ───────────────────────────────────────────
function parseMarkdown(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      blocks.push({ type: 'heading', level: h[1].length, text: h[2].trim() });
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++; continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    // Bullet list
    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'bullet', items });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const lines2 = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        lines2.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', text: lines2.join(' ') });
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')
           && !lines[i].startsWith('|') && !/^[-*+]\s/.test(lines[i])
           && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith('```')
           && !/^[-*_]{3,}$/.test(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

// ─── Inline text runs (bold, italic, code, links) ────────────────────────────
function inlineRuns(text, baseSize, baseColor) {
  baseSize = baseSize || 22;
  baseColor = baseColor || COLORS.text;
  const runs = [];
  const re = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index), size: baseSize, color: baseColor, font: 'Arial' }));
    }
    if (m[2] || m[3]) {
      runs.push(new TextRun({ text: m[2] || m[3], bold: true, size: baseSize, color: baseColor, font: 'Arial' }));
    } else if (m[4] || m[5]) {
      runs.push(new TextRun({ text: m[4] || m[5], italics: true, size: baseSize, color: baseColor, font: 'Arial' }));
    } else if (m[6]) {
      runs.push(new TextRun({ text: m[6], font: 'Courier New', size: baseSize - 2, color: '2E75B6', shading: { fill: 'F0F4FA', type: ShadingType.CLEAR } }));
    } else if (m[7]) {
      runs.push(new TextRun({ text: m[7], size: baseSize, color: COLORS.secondary, underline: {}, font: 'Arial' }));
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), size: baseSize, color: baseColor, font: 'Arial' }));
  }

  return runs.length ? runs : [new TextRun({ text, size: baseSize, color: baseColor, font: 'Arial' })];
}

// ─── Change log table (for CHANGELOG directive in solution-architecture docs) ─
function makeChangeLog(entries) {
  const colWidths = [1200, 1400, 2360, 4760];
  const border = { style: BorderStyle.SINGLE, size: 4, color: COLORS.border };
  const borders = { top: border, bottom: border, left: border, right: border };
  const headers = ['Version', 'Date', 'Author', 'Description'];
  function makeCell(text, isHeader, idx) {
    isHeader = isHeader || false; idx = idx || 0;
    return new TableCell({
      borders, width: { size: colWidths[idx], type: WidthType.DXA },
      shading: { fill: isHeader ? COLORS.headerBg : COLORS.white, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({
        text: text, font: 'Arial', size: isHeader ? 19 : 18,
        bold: isHeader, color: isHeader ? COLORS.primary : COLORS.text,
      })] })],
    });
  }
  return new Table({
    width: { size: PAGE.content, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map(function(h, i) { return makeCell(h, true, i); }), tableHeader: true }),
      ...entries.map(function(e) { return new TableRow({
        children: [e.version, e.date, e.author, e.description].map(function(v, i) { return makeCell(v || '', false, i); }),
      }); }),
    ],
  });
}

// ─── Parse special directives embedded in Markdown ───────────────────────────
// <!-- CHANGELOG: 1.0|2024-01-10|Author|Initial draft;1.1|2024-02-01|Author|Updates -->
function extractDirectives(content) {
  const directives = {};
  const cl = content.match(/<!--\s*CHANGELOG:\s*([^-]+)-->/);
  if (cl) {
    directives.changelog = cl[1].trim().split(';').map(function(row) {
      const p = row.split('|');
      return { version: p[0], date: p[1], author: p[2], description: p[3] };
    });
  }
  directives.cleanContent = content
    .replace(/<!--\s*CHANGELOG:[^-]+-->/g, '');
  return directives;
}

// ─── Convert parsed blocks → docx paragraphs ─────────────────────────────────
function blocksToDocx(blocks) {
  const elements = [];

  for (const block of blocks) {
    switch (block.type) {

      case 'heading': {
        const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2,
                        HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
        elements.push(new Paragraph({
          heading: levels[Math.min(block.level - 1, 3)],
          children: [new TextRun({ text: block.text, font: 'Arial', bold: true })],
          spacing: { before: block.level === 1 ? 360 : 200, after: 120 },
        }));
        break;
      }

      case 'paragraph': {
        elements.push(new Paragraph({
          children: inlineRuns(block.text),
          spacing: { before: 60, after: 120 },
          alignment: AlignmentType.JUSTIFIED,
        }));
        break;
      }

      case 'bullet': {
        for (const item of block.items) {
          elements.push(new Paragraph({
            numbering: { reference: 'bullets', level: 0 },
            children: inlineRuns(item),
            spacing: { before: 40, after: 40 },
          }));
        }
        elements.push(new Paragraph({ text: '', spacing: { after: 80 } }));
        break;
      }

      case 'numbered': {
        for (const item of block.items) {
          elements.push(new Paragraph({
            numbering: { reference: 'numbers', level: 0 },
            children: inlineRuns(item),
            spacing: { before: 40, after: 40 },
          }));
        }
        elements.push(new Paragraph({ text: '', spacing: { after: 80 } }));
        break;
      }

      case 'code': {
        const codeLines = block.text.split('\n');
        elements.push(new Paragraph({
          children: [new TextRun({
            text: block.lang ? ` ${block.lang.toUpperCase()} ` : ' CODE ',
            size: 16, bold: true, color: COLORS.white, font: 'Arial',
            shading: { fill: COLORS.secondary, type: ShadingType.CLEAR },
          })],
          spacing: { before: 160, after: 0 },
        }));
        for (const cl of codeLines) {
          elements.push(new Paragraph({
            children: [new TextRun({ text: cl || ' ', font: 'Courier New', size: 18, color: '1A1A1A' })],
            spacing: { before: 0, after: 0 },
            shading: { fill: 'F4F6FB', type: ShadingType.CLEAR },
            indent: { left: 360 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.secondary },
            },
          }));
        }
        elements.push(new Paragraph({ text: '', spacing: { after: 160 } }));
        break;
      }

      case 'blockquote': {
        elements.push(new Paragraph({
          children: inlineRuns(block.text, 20, COLORS.subtext),
          spacing: { before: 120, after: 120 },
          indent: { left: 720 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.accent, space: 8 },
          },
        }));
        break;
      }

      case 'table': {
        const tbl = parseTable(block.lines);
        if (tbl) elements.push(tbl);
        break;
      }

      case 'hr': {
        elements.push(new Paragraph({
          text: '',
          spacing: { before: 120, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border } },
        }));
        break;
      }
    }
  }

  return elements;
}

// ─── Parse Markdown table ─────────────────────────────────────────────────────
function parseTable(lines) {
  const dataLines = lines.filter(l => !l.match(/^\|[\s\-:|]+\|$/));
  if (!dataLines.length) return null;

  const parseRow = (line) =>
    line.split('|').slice(1, -1).map(c => c.trim());

  const headers = parseRow(dataLines[0]);
  const rows    = dataLines.slice(1).map(parseRow);
  const colW    = Math.floor(PAGE.content / headers.length);

  const border = { style: BorderStyle.SINGLE, size: 4, color: COLORS.border };
  const borders = { top: border, bottom: border, left: border, right: border };

  const makeCell = (text, isHeader) => {
    isHeader = isHeader || false;
    return new TableCell({
      borders,
      width: { size: colW, type: WidthType.DXA },
      shading: { fill: isHeader ? COLORS.headerBg : COLORS.white, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 140, right: 140 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({
          text, font: 'Arial', size: isHeader ? 20 : 19,
          bold: isHeader, color: isHeader ? COLORS.primary : COLORS.text,
        })],
      })],
    });
  };

  return new Table({
    width: { size: PAGE.content, type: WidthType.DXA },
    columnWidths: headers.map(() => colW),
    rows: [
      new TableRow({ children: headers.map(h => makeCell(h, true)), tableHeader: true }),
      ...rows.map(row => new TableRow({
        children: row.map(c => makeCell(c, false)),
      })),
    ],
  });
}

// ─── Cover page ───────────────────────────────────────────────────────────────
function makeCoverPage(docType, title, meta) {
  const dt = DOC_TYPES[docType];
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return [
    // Top color bar
    new Paragraph({
      children: [new TextRun({ text: ' ', size: 4 })],
      spacing: { before: 0, after: 0 },
      shading: { fill: dt.color, type: ShadingType.CLEAR },
      border: { bottom: { style: BorderStyle.SINGLE, size: 40, color: dt.color } },
    }),

    new Paragraph({ text: '', spacing: { before: 720, after: 0 } }),

    // Document type badge
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({
        text: `  ${dt.code} · ${dt.label}  `,
        size: 20, bold: true, color: COLORS.white, font: 'Arial',
        shading: { fill: dt.color, type: ShadingType.CLEAR },
      })],
      spacing: { before: 0, after: 240 },
    }),

    // Main title
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({
        text: title, font: 'Arial', size: 56, bold: true, color: COLORS.primary,
      })],
      spacing: { before: 0, after: 240 },
    }),

    // Tagline
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({
        text: dt.tagline, font: 'Arial', size: 22, color: COLORS.subtext, italics: true,
      })],
      spacing: { before: 0, after: 960 },
    }),

    // Divider
    new Paragraph({
      text: '',
      spacing: { before: 0, after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: dt.color } },
    }),

    // Metadata table
    new Table({
      width: { size: 6000, type: WidthType.DXA },
      columnWidths: [2000, 4000],
      rows: Object.entries(meta).map(([k, v]) => new TableRow({
        children: [
          new TableCell({
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                       left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            width: { size: 2000, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 0, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: k, font: 'Arial', size: 18, bold: true, color: COLORS.subtext })] })],
          }),
          new TableCell({
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                       left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            width: { size: 4000, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 0, right: 0 },
            children: [new Paragraph({ children: [new TextRun({ text: v, font: 'Arial', size: 18, color: COLORS.text })] })],
          }),
        ],
      })),
    }),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── Header ───────────────────────────────────────────────────────────────────
function makeHeader(docType, title) {
  const dt = DOC_TYPES[docType];
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${dt.code}  `, font: 'Arial', size: 16, bold: true, color: dt.color }),
          new TextRun({ text: title, font: 'Arial', size: 16, color: COLORS.subtext }),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border, space: 4 } },
        spacing: { after: 0 },
      }),
    ],
  });
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function makeFooter(docType) {
  const dt = DOC_TYPES[docType];
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${dt.label}  ·  Solution Architecture  ·  Page `, font: 'Arial', size: 16, color: COLORS.subtext }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: COLORS.subtext }),
          new TextRun({ text: ' of ', font: 'Arial', size: 16, color: COLORS.subtext }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: COLORS.subtext }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border, space: 4 } },
        spacing: { before: 0 },
      }),
    ],
  });
}

// ─── Build full Document ──────────────────────────────────────────────────────
function buildDocument(docType, title, markdownContent, meta) {
  const directives = extractDirectives(markdownContent);
  const contentToParse = directives.cleanContent || markdownContent;
  const dt = DOC_TYPES[docType];

  const blocks   = parseMarkdown(contentToParse);
  let   bodyElms = blocksToDocx(blocks);
  const coverElms = makeCoverPage(docType, title, meta);

  // Prepend change log if CHANGELOG directive is present
  if (directives.changelog) {
    const clElms = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Change Log', font: 'Arial', bold: true })],
      }),
      makeChangeLog(directives.changelog),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ];
    bodyElms = [...clElms, ...bodyElms];
  }

  return new Document({
    features: {
      updateFields: true,  // auto-populates TOC (and all field codes) on open
    },
    numbering: {
      config: [
        { reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: 'numbers',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22, color: COLORS.text } },
      },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: COLORS.primary },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: dt.color },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Arial', color: COLORS.secondary },
          paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 22, bold: true, italics: true, font: 'Arial', color: COLORS.subtext },
          paragraph: { spacing: { before: 120, after: 60 }, outlineLevel: 3 } },
      ],
    },
    sections: [
      // Cover page (no header/footer)
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: PAGE.marginV, right: PAGE.marginH, bottom: PAGE.marginV, left: PAGE.marginH },
          },
        },
        children: coverElms,
      },
      // Body section (with header/footer + TOC)
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: 1080, right: PAGE.marginH, bottom: 1080, left: PAGE.marginH },
          },
        },
        headers: { default: makeHeader(docType, title) },
        footers: { default: makeFooter(docType) },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'Table of Contents', font: 'Arial', bold: true })],
          }),
          new TableOfContents('Table of Contents', {
            hyperlink: true,
            headingStyleRange: '1-3',
          }),
          new Paragraph({ children: [new PageBreak()] }),
          ...bodyElms,
        ],
      },
    ],
  });
}

// ─── Extract title from markdown ──────────────────────────────────────────────
function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Untitled Document';
}

// ─── CLI entry point ──────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const get  = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

  const docType  = (get('--type') || 'solution-architecture').toLowerCase();
  const input    = get('--input');
  const output   = get('--output') || 'output.docx';
  const titleArg = get('--title');
  const author   = get('--author') || 'Solution Architecture';
  const version  = get('--version') || '1.0';
  const status   = get('--status') || 'Draft';

  if (!input) {
    console.error('Usage: bun run generate-doc.js --type <solution-architecture|adr|handoff> --input <file.md> --output <file.docx>');
    process.exit(1);
  }

  if (!DOC_TYPES[docType]) {
    console.error(`Unknown type "${docType}". Use: solution-architecture, adr, handoff`);
    process.exit(1);
  }

  const content = fs.readFileSync(input, 'utf8');
  const title   = titleArg || extractTitle(content);

  const meta = {
    'Document Type': DOC_TYPES[docType].label,
    'Version':       version,
    'Status':        status,
    'Author':        author,
    'Date':          new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  console.log(`Generating ${DOC_TYPES[docType].label}: "${title}"...`);

  const doc    = buildDocument(docType, title, content, meta);
  const buffer = await Packer.toBuffer(doc);

  // Ensure output directory exists
  const outDir = path.dirname(output);
  if (outDir && outDir !== '.' && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(output, buffer);
  console.log(`✓ Written to: ${output}`);
}

main().catch(err => { console.error(err); process.exit(1); });
