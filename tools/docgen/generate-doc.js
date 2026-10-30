#!/usr/bin/env bun
/**
 * Professional Word (.docx) and PDF Document Generator
 * For Solution Architecture outputs from Claude Code
 *
 * Usage:
 *   bun run generate-doc.js --type solution-architecture --input ARCHITECTURE.md --output exports/SA-project.docx
 *   bun run generate-doc.js --type adr                  --input ADR-001.md       --output exports/ADR-001.docx
 *   bun run generate-doc.js --type handoff              --input handoff.md        --output exports/HANDOFF-api.docx
 *   bun run generate-doc.js --type po-spec --format pdf --input PRODUCT_OWNER_SPEC.md --output exports/PO-SPEC-x.pdf
 *
 * `--format` selects the renderer and defaults to `docx`. Both formats share the Markdown
 * parse layer (extractDirectives → parseMarkdown → blocks); only the block→document stage
 * differs. The PDF renderer lives in ./render-pdf.js and is required lazily.
 */

const fs = require('fs');
const path = require('path');
const { fitDimensions, renderMermaidBlocks, summarize: summarizeMermaid } = require('./render-mermaid.js');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  ExternalHyperlink, ImageRun, HeightRule
} = (() => {
  // at tools/docgen's pin, never Bun's auto-install (scripts/shared/pinned.js); `bun install` runs at sa-skills' root, the workspace
  try { return require('../../scripts/shared/pinned.js').pinnedRequire(__dirname, 'docx', { installIn: path.join(__dirname, '..', '..') }); }
  catch (e) { if (!e.pin) throw e; console.error(`generate-doc: ${e.message}`); process.exit(1); }
})();

// ─── Palette ──────────────────────────────────────────────────────────────────
// The document theme fills it (./theme.js: --theme → an institution pack's docTheme → the base's `alia`); the values
// here are `classic`, what a caller that never applies a theme (a test, a fallback) renders with.
const COLORS = {
  primary:    '1F4E79',  // titles, H1
  secondary:  '2E75B6',  // H3, links, code-block caption
  accent:     '4472C4',  // blockquote bar
  headerBg:   'D6E4F0',  // table headers
  altRow:     'EBF3FA',  // alt table row
  text:       '1A1A1A',
  subtext:    '595959',
  white:      'FFFFFF',
  border:     'BDD7EE',
  codeBg:     'F4F6FB',  // code-block fill
  codeText:   '2E75B6',  // inline code
  codeFill:   'F0F4FA',  // inline code fill
};
let THEME = null;      // the resolved document theme, once main() applies one

// Fill COLORS and the document-type colours from a theme (./theme.js loadTheme). Statuses and priorities keep their
// own fills: they mean the same in every theme.
function applyTheme(theme) {
  THEME = theme;
  Object.assign(COLORS, theme.colors);
  for (const [t, c] of Object.entries(theme.docTypes || {})) if (DOC_TYPES[t]) DOC_TYPES[t].color = c;
}

// ─── Document type metadata ───────────────────────────────────────────────────
// Corporate blue is reserved for SA docs. ADR uses amber/gold. Handoff uses teal.
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
    color:   '8B6914',                // Amber/Gold — distinct from SA blue
    tagline: 'Solution Architecture · Architecture Decisions',
  },
  handoff: {
    label:   'Component Development Handoff',
    code:    'HANDOFF',
    color:   '0D7377',                // Teal — development phase, distinct from architecture
    tagline: 'Solution Architecture · Implementation Guide for Development Teams',
  },
  'po-spec': {
    label:   'Product Owner Specification',
    code:    'PO',
    color:   '2E6B3A',                // Forest green — distinct from blue/amber/teal/purple/crimson
    tagline: 'Solution Architecture · Business Requirements Specification',
  },
};

// ─── Localized chrome strings ─────────────────────────────────────────────────
// Only the document *chrome* is localized here — cover page, footer, TOC title, Change Log
// header and the two editable-table notes. The document *body* is exported verbatim from the
// source Markdown, so it is already in the project's language.
//
// Everything absent from this map is absent on purpose: status values, requirement codes,
// table column headers inside the body, and filenames stay English in every language.
// See skills/architecture-docs/references/LANGUAGE_POLICY.md § 4.
const LABELS = {
  en: {
    dateLocale: 'en-US',
    tocTitle: 'Table of Contents',
    changeLogTitle: 'Change Log',
    changeLogHeaders: ['Version', 'Date', 'Author', 'Description'],
    untitled: 'Untitled Document',
    footerSuffix: 'Solution Architecture',
    pageWord: 'Page ',
    ofWord: ' of ',
    meta: {
      documentType: 'Document Type',
      version: 'Version',
      status: 'Status',
      author: 'Author',
      date: 'Date',
      complianceScore: 'Compliance Score',
      approvalAuthority: 'Approval Authority',
      translation: 'Translation',
    },
    langNames: { en: 'English', es: 'Spanish (LATAM)' },
    // Rendered on the cover whenever --translated-from is passed. A translated
    // deliverable that does not say so invites someone to cite it as the source of
    // record and act on a rendering rather than the architecture.
    translationNotice: function (src) {
      return 'Translated from ' + src + ' — the ' + src + ' document remains authoritative.';
    },
    questionsNote: '★ Fields highlighted in yellow (Owner, Action Required, Priority) are designed for stakeholder input.',
    docTypeLabels: {},
  },
  es: {
    // es-419 is the BCP-47 region code for Latin America. `es` in this plugin means
    // LATAM-neutral Spanish, never Peninsular — see LANGUAGE_POLICY.md § "es means
    // LATAM-neutral". Verified: Intl resolves es-419 exactly (not via fallback).
    dateLocale: 'es-419',
    tocTitle: 'Índice',
    changeLogTitle: 'Registro de Cambios',
    changeLogHeaders: ['Versión', 'Fecha', 'Autor', 'Descripción'],
    untitled: 'Documento sin título',
    footerSuffix: 'Arquitectura de Soluciones',
    pageWord: 'Página ',
    ofWord: ' de ',
    meta: {
      documentType: 'Tipo de Documento',
      version: 'Versión',
      status: 'Estado',
      author: 'Autor',
      date: 'Fecha',
      complianceScore: 'Puntaje de Cumplimiento',
      approvalAuthority: 'Autoridad de Aprobación',
      translation: 'Traducción',
    },
    langNames: { en: 'inglés', es: 'español (LATAM)' },
    translationNotice: function (src) {
      return 'Traducido del ' + src + ' — el documento en ' + src + ' es la versión autoritativa.';
    },
    questionsNote: '★ Los campos resaltados en amarillo (Owner, Action Required, Priority) están destinados a ser completados por los interesados.',
    docTypeLabels: {
      'solution-architecture': { label: 'Arquitectura de Solución', tagline: 'Arquitectura de Soluciones · Diseño Técnico' },
      adr:                     { label: 'Registro de Decisión de Arquitectura', tagline: 'Arquitectura de Soluciones · Decisiones de Arquitectura' },
      handoff:                 { label: 'Entrega de Componente a Desarrollo', tagline: 'Arquitectura de Soluciones · Guía de Implementación para Equipos de Desarrollo' },
      'po-spec':               { label: 'Especificación del Dueño de Producto', tagline: 'Arquitectura de Soluciones · Especificación de Requisitos de Negocio' },
    },
  },
};

// Resolved once in main() from --lang; `en` is the default and the fallback for any
// unrecognised value, matching the resolution protocol's own default.
let LANG = 'en';
const L = () => LABELS[LANG] || LABELS.en;

// Document-type label/tagline for the active language, falling back to the English entry.
const docTypeFor = (docType) => {
  const base = DOC_TYPES[docType];
  const over = L().docTypeLabels[docType];
  return over ? Object.assign({}, base, over) : base;
};

// Cover-page date in the active language. Requires a full-ICU runtime for non-English
// locales; falls back to en-US formatting if the locale is unavailable rather than throwing.
const localizedToday = () => {
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return new Date().toLocaleDateString(L().dateLocale, opts);
  } catch {
    return new Date().toLocaleDateString('en-US', opts);
  }
};

// ─── Page layout constants ────────────────────────────────────────────────────
const PAGE = {
  width:   12240,  // 8.5"
  height:  15840,  // 11"
  marginH: 1260,   // ~0.875" left/right
  marginV: 1080,   // 0.75" top/bottom
  content: 9720,   // 12240 - 2*1260
};

// Apply `transform` to the parts of `text` that sit OUTSIDE fenced code blocks,
// leaving fenced content byte-for-byte intact. Used so comment stripping cannot
// reach into a documented code sample.
function outsideFences(text, transform) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let buffer = [];
  let inFence = false;

  const flush = () => {
    if (buffer.length) { out.push(transform(buffer.join('\n'))); buffer = []; }
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (!inFence) flush();       // transform what preceded the fence
      else out.push(buffer.join('\n')), buffer = [];  // emit fence body verbatim
      out.push(line);
      inFence = !inFence;
      continue;
    }
    buffer.push(line);
  }
  // An unterminated fence keeps its content verbatim rather than being transformed.
  if (inFence) out.push(buffer.join('\n'));
  else flush();

  return out.join('\n');
}

// ─── Markdown parser (lightweight) ───────────────────────────────────────────
function parseMarkdown(text, docType) {
  // Split on either ending. Splitting on '\n' alone leaves a trailing '\r' on
  // every line of a CRLF file, which defeats every `...$`-anchored line test
  // below — most visibly the table separator filter, so `|---|---|` survives
  // as a data row in the rendered document. User project markdown on Windows
  // is routinely CRLF even though this repo's own files are LF.
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  let nextTableType = 'table'; // used to tag special tables

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      // `visible\u0000Anchor` when the source heading carried a SECTION anchor (see
      // extractDirectives). The anchor is the language-independent identity; the visible text
      // is what the reader sees and is all that reaches the document.
      const parts = h[2].split('\u0000');
      const headingText = parts[0].trim();
      const headingAnchor = parts.length > 1 ? parts[1].trim() : null;
      blocks.push({ type: 'heading', level: h[1].length, text: headingText });
      // Tag the next table based on heading context. Match the anchor when there is one, so a
      // Spanish document dispatches identically to an English one; fall back to the literal
      // English heading for documents written before anchors existed.
      const key = headingAnchor || headingText;
      if (key === 'Questions & Gaps Register') {
        nextTableType = 'questions-register';
      } else if (key === 'Compliance Summary') {
        nextTableType = 'compliance-summary';
      } else {
        nextTableType = 'table';
      }
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
      blocks.push({ type: nextTableType, lines: tableLines });
      nextTableType = 'table'; // reset after consuming
      continue;
    }

    // Bullet list (indent-aware — nested items keep their depth instead of
    // collapsing into the parent item's text). Depth = 2 spaces per level,
    // capped at 2 to match the numbering config below. A tab counts as one level.
    if (/^\s*[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) {
        const indent = lines[i].match(/^(\s*)/)[1].replace(/\t/g, '  ');
        items.push({
          text:  lines[i].replace(/^\s*[-*+]\s+/, '').trim(),
          level: Math.min(Math.floor(indent.length / 2), 2),
        });
        i++;
      }
      blocks.push({ type: 'bullet', items });
      continue;
    }

    // Numbered list (indent-aware, same depth rule as bullets)
    if (/^\s*\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        const indent = lines[i].match(/^(\s*)/)[1].replace(/\t/g, '  ');
        items.push({
          text:  lines[i].replace(/^\s*\d+\.\s+/, '').trim(),
          level: Math.min(Math.floor(indent.length / 2), 2),
        });
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
      if (i < lines.length) i++; // skip closing ``` (guard: unclosed fence at EOF)
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }

    // Blockquote. A bare `>` (no trailing space) is a valid blank quote line and
    // must be consumed here — otherwise it falls through to the paragraph branch
    // and renders as a literal `>` character.
    if (/^>(\s|$)/.test(line)) {
      const lines2 = [];
      while (i < lines.length && /^>(\s|$)/.test(lines[i])) {
        lines2.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: lines2.join(' ').trim() });
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')
           && !lines[i].startsWith('|') && !/^\s*[-*+]\s/.test(lines[i])
           && !/^\s*\d+\.\s/.test(lines[i]) && !lines[i].startsWith('```')
           && !/^[-*_]{3,}$/.test(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    } else {
      i++; // Skip unrecognized line to prevent infinite loop
    }
  }

  return blocks;
}

// ─── Inline markdown tokenizer (format-neutral) ──────────────────────────────
// The single source of truth for inline syntax. Both renderers consume it: the docx path
// via inlineRuns() below, the PDF path via render-pdf.js. Returns a flat token list —
// `kind` is one of 'text' | 'bold' | 'italic' | 'code' | 'link'.
const INLINE_RE = /(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;

function tokenizeInline(text) {
  const tokens = [];
  const re = new RegExp(INLINE_RE.source, 'g');
  let last = 0, m;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', text: text.slice(last, m.index) });
    if (m[2] || m[3])       tokens.push({ kind: 'bold',   text: m[2] || m[3] });
    else if (m[4] || m[5])  tokens.push({ kind: 'italic', text: m[4] || m[5] });
    else if (m[6])          tokens.push({ kind: 'code',   text: m[6] });
    else if (m[7])          tokens.push({ kind: 'link',   text: m[7], href: m[8] });
    last = m.index + m[0].length;
  }

  if (last < text.length) tokens.push({ kind: 'text', text: text.slice(last) });
  return tokens.length ? tokens : [{ kind: 'text', text }];
}

// ─── Inline text runs (bold, italic, code, links) ────────────────────────────
function inlineRuns(text, baseSize, baseColor) {
  baseSize = baseSize || 22;
  baseColor = baseColor || COLORS.text;

  const runs = tokenizeInline(text).map((t) => {
    switch (t.kind) {
      case 'bold':
        return new TextRun({ text: t.text, bold: true, size: baseSize, color: baseColor, font: 'Arial' });
      case 'italic':
        return new TextRun({ text: t.text, italics: true, size: baseSize, color: baseColor, font: 'Arial' });
      case 'code':
        return new TextRun({ text: t.text, font: 'Courier New', size: baseSize - 2, color: COLORS.codeText, shading: { fill: COLORS.codeFill, type: ShadingType.CLEAR } });
      case 'link':
        return new TextRun({ text: t.text, size: baseSize, color: COLORS.secondary, underline: {}, font: 'Arial' });
      default:
        return new TextRun({ text: t.text, size: baseSize, color: baseColor, font: 'Arial' });
    }
  });

  return runs.length ? runs : [new TextRun({ text, size: baseSize, color: baseColor, font: 'Arial' })];
}

// ─── Change log table (for CHANGELOG directive in solution-architecture docs) ─
function makeChangeLog(entries) {
  const colWidths = [1200, 1400, 2360, 4760];
  const border = { style: BorderStyle.SINGLE, size: 4, color: COLORS.border };
  const borders = { top: border, bottom: border, left: border, right: border };
  const headers = L().changeLogHeaders;
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
  // Non-greedy across every character: the payload carries ISO dates, so a `[^-]+`
  // body stops at the first hyphen of `2024-01-10` and the directive never matches.
  const cl = content.match(/<!--\s*CHANGELOG:\s*([\s\S]*?)-->/);
  if (cl) {
    directives.changelog = cl[1].trim().split(';').map(function(row) {
      const [version = '', date = '', author = '', description = ''] = row.split('|');
      return { version, date, author, description };
    });
  }
  // Strip ALL remaining HTML comments (the CHANGELOG directive was consumed above).
  // Managed-file markers (`<!-- managed by ... -->`), TEMPLATE_VERSION stamps,
  // EXPLORER_HEADER blocks and authoring-guidance blocks are editorial metadata:
  // they belong in the markdown source, never in a deliverable. Without this the
  // parser has no comment rule at all and renders them as literal body text.
  // `[\s\S]*?` spans newlines so multi-line guidance blocks are removed whole.
  //
  // Exception: a heading's English `<!-- SECTION: Name -->` anchor is *identity*, not editorial
  // metadata — it is how a localized heading is recognised (LANGUAGE_POLICY.md § 2). Fold it
  // onto the heading line behind a NUL separator so the block parser can read it, then strip
  // every remaining comment as before. NUL never occurs in Markdown source, and the parser
  // removes it before anything reaches the document.
  // Stripping runs only OUTSIDE fenced code blocks: an HTML comment inside a
  // documented sample is content, and deleting it corrupts the code the
  // deliverable exists to show.
  directives.cleanContent = outsideFences(content, (segment) => segment
    .replace(/<!--\s*CHANGELOG:[\s\S]*?-->/g, '')
    .replace(/^(#{1,6}[^\S\n]+)(.*?)[^\S\n]*<!--\s*SECTION:\s*(.*?)\s*-->[^\S\n]*$/gm,'$1$2\u0000$3')
    .replace(/<!--[\s\S]*?-->/g, ''));
  return directives;
}

// ─── Convert parsed blocks → docx paragraphs ─────────────────────────────────
// ─── Fenced code block ────────────────────────────────────────────────────────
// Its own function because the image branch falls back to it: a Mermaid diagram
// that could not be rendered must still reach the reader as source.
function codeElements(block) {
  const elements = [];
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
      children: [new TextRun({ text: cl || ' ', font: 'Courier New', size: 18, color: COLORS.text })],
      spacing: { before: 0, after: 0 },
      shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR },
      indent: { left: 360 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.secondary },
      },
    }));
  }
  elements.push(new Paragraph({ text: '', spacing: { after: 160 } }));
  return elements;
}

// Printable box for an embedded picture, in pixels at 96 dpi (the unit docx
// converts to EMU). Width is the full content column; height leaves the diagram
// short of a full page so a heading and its picture can share one.
const IMAGE_MAX = { width: 648, height: 820 };

function imageElements(block) {
  try {
    const data = fs.readFileSync(block.src);
    const dims = fitDimensions(block.width, block.height, IMAGE_MAX.width, IMAGE_MAX.height);
    if (!dims) throw new Error(`no intrinsic size for ${block.src}`);
    return [new Paragraph({
      // `type` is what docx names the media part by; without it the part lands as
      // `image.undefined`, which no [Content_Types] entry covers and Word will not draw.
      children: [new ImageRun({ data, type: 'png', transformation: dims })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 160 },
    })];
  } catch (e) {
    console.warn(`Diagram not embedded (${e.message}) — exporting its source instead.`);
    return codeElements({ type: 'code', lang: block.lang || 'mermaid', text: block.source || '' });
  }
}

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
            numbering: { reference: 'bullets', level: item.level || 0 },
            children: inlineRuns(item.text),
            spacing: { before: 40, after: 40 },
          }));
        }
        elements.push(new Paragraph({ text: '', spacing: { after: 80 } }));
        break;
      }

      case 'numbered': {
        for (const item of block.items) {
          elements.push(new Paragraph({
            numbering: { reference: 'numbers', level: item.level || 0 },
            children: inlineRuns(item.text),
            spacing: { before: 40, after: 40 },
          }));
        }
        elements.push(new Paragraph({ text: '', spacing: { after: 80 } }));
        break;
      }

      case 'code':
        elements.push(...codeElements(block));
        break;

      // A ```mermaid block the pre-render pass turned into a PNG. `source` is
      // carried on the block so a cache file that vanished between the render and
      // this point degrades to the monospace source instead of losing the diagram.
      case 'image':
        elements.push(...imageElements(block));
        break;

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

      case 'questions-register': {
        const tbl = parseQuestionsRegisterTable(block.lines);
        if (tbl) {
          elements.push(tbl);
          // Note below the table explaining editable fields
          elements.push(new Paragraph({
            children: [new TextRun({
              text: L().questionsNote,
              font: 'Arial', size: 18, italics: true, color: COLORS.subtext,
            })],
            spacing: { before: 60, after: 120 },
            indent: { left: 360 },
          }));
        }
        break;
      }

      case 'compliance-summary': {
        const tbl = parseComplianceSummaryTableDoc(block.lines);
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

// ─── Shared markdown table parsing ────────────────────────────────────────────
// One separator filter and one row splitter for all four docx table builders.
// Each used to restate these lines, which is why a single bug in the separator
// pattern (CRLF input rendering `|---|---|` as a data row) had to be fixed in
// four places. render-pdf.js factors the same thing as `tableData`.
const isSeparatorRow = (l) => /^\|[\s\-:|]+\|\r?$/.test(l);
const parseRow = (line) => line.split('|').slice(1, -1).map(c => c.trim());

function tableData(lines) {
  const dataLines = lines.filter(l => !isSeparatorRow(l));
  if (!dataLines.length) return null;
  const headers = parseRow(dataLines[0]);
  // guard: an empty header row would cause division by zero downstream
  if (!headers.length) return null;
  return { headers, rows: dataLines.slice(1).map(parseRow) };
}

// ─── Parse Markdown table ─────────────────────────────────────────────────────
function parseTable(lines) {
  const d = tableData(lines);
  if (!d) return null;
  const { headers, rows } = d;
  const colW = Math.floor(PAGE.content / headers.length);

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

// ─── Questions & Gaps Register table (editable fields highlighted) ───────────
function parseQuestionsRegisterTable(lines) {
  const d = tableData(lines);
  if (!d) return null;
  const { headers, rows } = d;

  // Column widths for 8-column register (twips, must sum to PAGE.content = 9720)
  // Code=900, Requirement=1600, Type=900, Status=900, Owner=1080, Section=1340, Action=2000, Priority=1000
  const colWidths = [900, 1600, 900, 900, 1080, 1340, 2000, 1000];
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  // Scale to fit content width
  const scale = PAGE.content / totalW;
  const scaledWidths = colWidths.map(w => Math.round(w * scale));

  const border = { style: BorderStyle.SINGLE, size: 4, color: COLORS.border };
  const borders = { top: border, bottom: border, left: border, right: border };

  // Editable column indices (0-based): Owner=4, Action Required=6, Priority=7
  const EDITABLE_COLS = new Set([4, 6, 7]);
  const EDITABLE_FILL = 'FFF9E6'; // light yellow

  // Priority coloring
  const PRIORITY_COLORS = {
    'Critical': 'FFE0E0',
    'High':     'FFE8CC',
    'Medium':   'FFF0CC',
    'Low':      'E8F4E8',
  };

  // Status coloring (for Status column = index 3)
  const STATUS_COLORS = {
    'Non-Compliant': 'FFE0E0',
    'Unknown':       'FFF9E6',
    'Not Applicable':'F0F0F0',
  };

  const makeCell = (text, colIdx, isHeader) => {
    let fill = isHeader ? COLORS.headerBg : COLORS.white;

    if (!isHeader) {
      if (colIdx === 3) {
        // Status column
        fill = STATUS_COLORS[text] || COLORS.white;
      } else if (colIdx === 7) {
        // Priority column. Column 7 is in EDITABLE_COLS, so an unrecognised or
        // empty value falls back to the editable tint rather than to white —
        // that cell is one a reviewer still has to fill in, and it should look
        // like the other editable cells. render-pdf.js has always done this;
        // white here made the same document differ between .docx and .pdf.
        fill = PRIORITY_COLORS[text] || EDITABLE_FILL;
      } else if (EDITABLE_COLS.has(colIdx)) {
        fill = EDITABLE_FILL;
      }
    }

    const dashedBorder = { style: BorderStyle.DASHED, size: 4, color: '999900' };
    const useEditable = EDITABLE_COLS.has(colIdx) && !isHeader;

    const cellBorders = {
      top: border,
      bottom: border,
      left: useEditable ? dashedBorder : border,
      right: useEditable ? dashedBorder : border,
    };

    return new TableCell({
      borders: cellBorders,
      width: { size: scaledWidths[colIdx] || scaledWidths[scaledWidths.length - 1], type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({
          text, font: 'Arial', size: isHeader ? 18 : 17,
          bold: isHeader,
          color: isHeader ? COLORS.primary : COLORS.text,
        })],
      })],
    });
  };

  return new Table({
    width: { size: PAGE.content, type: WidthType.DXA },
    columnWidths: scaledWidths,
    rows: [
      new TableRow({ children: headers.map((h, ci) => makeCell(h, ci, true)), tableHeader: true }),
      ...rows.map(row => new TableRow({
        children: row.map((c, ci) => makeCell(c, ci, false)),
      })),
    ],
  });
}

// ─── Compliance Summary table (status-conditional cell coloring) ──────────────
function parseComplianceSummaryTableDoc(lines) {
  const d = tableData(lines);
  if (!d) return null;
  const { headers, rows } = d;
  const colW = Math.floor(PAGE.content / headers.length);

  const border = { style: BorderStyle.SINGLE, size: 4, color: COLORS.border };
  const borders = { top: border, bottom: border, left: border, right: border };

  // Status column index in Compliance Summary (0-based) — Status is at index 3
  const STATUS_COL = 3;
  const STATUS_FILL = {
    'Compliant':     'E6F4EA',
    'Non-Compliant': 'FFE0E0',
    'Not Applicable':'F0F0F0',
    'Unknown':       'FFF9E6',
  };

  const makeCell = (text, colIdx, isHeader) => {
    let fill = isHeader ? COLORS.headerBg : COLORS.white;
    if (!isHeader && colIdx === STATUS_COL) {
      fill = STATUS_FILL[text] || COLORS.white;
    }

    return new TableCell({
      borders,
      width: { size: colW, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({
          text, font: 'Arial', size: isHeader ? 20 : 19,
          bold: isHeader,
          color: isHeader ? COLORS.primary : COLORS.text,
        })],
      })],
    });
  };

  return new Table({
    width: { size: PAGE.content, type: WidthType.DXA },
    columnWidths: headers.map(() => colW),
    rows: [
      new TableRow({ children: headers.map((h, ci) => makeCell(h, ci, true)), tableHeader: true }),
      ...rows.map(row => new TableRow({
        children: row.map((c, ci) => makeCell(c, ci, false)),
      })),
    ],
  });
}

// ─── Cover page ───────────────────────────────────────────────────────────────
// The figure cover of a theme with a night cover: on Word it stays on white (a dark panel prints heavy and fights the
// page) — the badge, the title after the theme's accent bar and the tagline, the theme's figure on the right, the
// metadata under them. The PDF paints its cover night (render-pdf.js nightCover).
function makeFigureCover(dt, title, meta, cover) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: none, bottom: none, left: none, right: none };
  const textW = cover.image ? 6120 : PAGE.content, imgW = PAGE.content - textW;
  const cells = [new TableCell({
    borders: noBorders, width: { size: textW, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 240, bottom: 240, left: 0, right: 240 },
    children: [
      new Paragraph({ children: [new TextRun({ text: `${dt.code} · ${dt.label}`.toUpperCase(), font: 'Arial', size: 17, bold: true, color: dt.color, characterSpacing: 40 })], spacing: { after: 280 } }),
      new Paragraph({
        children: [new TextRun({ text: title, font: 'Arial', size: 52, bold: true, color: COLORS.primary })],
        border: { left: { style: BorderStyle.SINGLE, size: 36, color: COLORS.accent, space: 12 } }, spacing: { after: 240 },
      }),
      new Paragraph({ children: [new TextRun({ text: dt.tagline, font: 'Arial', size: 22, color: COLORS.subtext })] }),
    ],
  })];
  if (cover.image) {
    cells.push(new TableCell({
      borders: noBorders, width: { size: imgW, type: WidthType.DXA }, verticalAlign: VerticalAlign.BOTTOM,
      margins: { top: 240, bottom: 240, left: 120, right: 0 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: fs.readFileSync(cover.image), type: 'png', transformation: { width: 210, height: 210 } })] })],
    }));
  }
  return [
    new Paragraph({ text: '', spacing: { before: 0, after: 0 }, border: { top: { style: BorderStyle.SINGLE, size: 24, color: COLORS.accent, space: 1 } } }),
    new Paragraph({ text: '', spacing: { before: 960, after: 0 } }),
    new Table({
      width: { size: PAGE.content, type: WidthType.DXA }, columnWidths: cover.image ? [textW, imgW] : [PAGE.content],
      rows: [new TableRow({ height: { value: 5400, rule: HeightRule.ATLEAST }, children: cells })],
    }),
    new Paragraph({ text: '', spacing: { before: 480, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: dt.color, space: 1 } } }),
    new Paragraph({ text: '', spacing: { after: 160 } }),
    metaTable(meta),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// Label → value rows, borderless, under the cover's title.
function metaTable(meta) {
  const none = { style: BorderStyle.NONE };
  return new Table({
    width: { size: 6000, type: WidthType.DXA },
    columnWidths: [2000, 4000],
    rows: Object.entries(meta).map(([k, v]) => new TableRow({
      children: [
        new TableCell({ borders: { top: none, bottom: none, left: none, right: none }, width: { size: 2000, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 0, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: k, font: 'Arial', size: 18, bold: true, color: COLORS.subtext })] })] }),
        new TableCell({ borders: { top: none, bottom: none, left: none, right: none }, width: { size: 4000, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: v, font: 'Arial', size: 18, color: COLORS.text })] })] }),
      ],
    })),
  });
}

function makeCoverPage(docType, title, meta) {
  const dt = docTypeFor(docType);
  if (THEME && THEME.cover && THEME.cover.style === 'night') return makeFigureCover(dt, title, meta, THEME.cover);

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
    metaTable(meta),

    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── Header ───────────────────────────────────────────────────────────────────
function makeHeader(docType, title) {
  const dt = docTypeFor(docType);
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
  const dt = docTypeFor(docType);
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${dt.label}  ·  ${L().footerSuffix}  ·  ${L().pageWord}`, font: 'Arial', size: 16, color: COLORS.subtext }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: COLORS.subtext }),
          new TextRun({ text: L().ofWord, font: 'Arial', size: 16, color: COLORS.subtext }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: COLORS.subtext }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border, space: 4 } },
        spacing: { before: 0 },
      }),
    ],
  });
}

// ─── Pre-rendered TOC from heading blocks ────────────────────────────────────
function buildManualToc(blocks, docType, hasChangeLog) {
  const dt = docTypeFor(docType);
  const entries = [];

  // The Change Log is prepended to the body AFTER `blocks` is parsed, so it is
  // not among them. Without this the document opened with a section its own
  // table of contents did not list.
  if (hasChangeLog) {
    entries.push(new Paragraph({
      children: [new TextRun({
        text: L().changeLogTitle, font: 'Arial', size: 22, bold: true, color: dt.color,
      })],
      spacing: { before: 120, after: 40 },
      indent: { left: 0 },
    }));
  }

  for (const block of blocks) {
    if (block.type !== 'heading' || block.level > 3) continue;

    // H1 = no indent, H2 = 360 twips, H3 = 720 twips
    const indent    = (block.level - 1) * 360;
    const fontSize  = block.level === 1 ? 22 : block.level === 2 ? 20 : 18;
    const isBold    = block.level <= 2;
    const color     = block.level === 1 ? dt.color : COLORS.subtext;

    entries.push(new Paragraph({
      children: [new TextRun({ text: block.text, font: 'Arial', size: fontSize, bold: isBold, color })],
      spacing:  { before: block.level === 1 ? 120 : 40, after: 40 },
      indent:   { left: indent },
    }));
  }

  return entries;
}

// ─── Build full Document ──────────────────────────────────────────────────────
// `preparsed` carries the block list main() already produced, so the Mermaid
// pre-render pass is not thrown away by a second parse here. Absent, this parses
// the markdown itself exactly as before.
function buildDocument(docType, title, markdownContent, meta, preparsed) {
  const directives = preparsed ? preparsed.directives : extractDirectives(markdownContent);
  const contentToParse = directives.cleanContent || markdownContent;
  const dt = docTypeFor(docType);

  const blocks   = preparsed ? preparsed.blocks : parseMarkdown(contentToParse, docType);
  let   bodyElms = blocksToDocx(blocks);
  const coverElms = makeCoverPage(docType, title, meta);

  // Prepend change log if CHANGELOG directive is present
  if (directives.changelog) {
    const clElms = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: L().changeLogTitle, font: 'Arial', bold: true })],
      }),
      makeChangeLog(directives.changelog),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ];
    bodyElms = [...clElms, ...bodyElms];
  }

  return new Document({
    numbering: {
      config: [
        // Three levels each — nested markdown lists (2 spaces per level) keep
        // their depth. Without levels 1–2 the docx numbering silently falls back
        // to level 0 and the hierarchy is lost.
        { reference: 'bullets',
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ] },
        { reference: 'numbers',
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: LevelFormat.LOWER_ROMAN, text: '%3.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ] },
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
            children: [new TextRun({ text: L().tocTitle, font: 'Arial', bold: true })],
          }),
          ...buildManualToc(blocks, docType, Boolean(directives.changelog)),
          new Paragraph({ children: [new PageBreak()] }),
          ...bodyElms,
        ],
      },
    ],
  });
}

// ─── Extract title from markdown ──────────────────────────────────────────────
function extractTitle(content) {
  // `[^\S\n]` not `\s`: `\s` spans the newline, so a bare "#" line would make
  // the document's first body line become its title.
  const m = content.match(/^#[^\S\n]+(.+)$/m);
  return m ? m[1].trim() : L().untitled;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  // The value must not itself look like a flag: `--output --lang es` otherwise
  // wrote a file literally named "--lang" and silently dropped the language.
  const get  = (flag) => {
    const i = args.indexOf(flag);
    if (i === -1 || i + 1 >= args.length) return null;
    const value = args[i + 1];
    if (value.startsWith('--')) {
      console.error(`Missing value for ${flag} (next token is "${value}").`);
      process.exit(1);
    }
    return value;
  };

  const docType  = (get('--type') || 'solution-architecture').toLowerCase();
  const format   = (get('--format') || 'docx').toLowerCase();
  // Accept the regional spellings a caller will plausibly type and fold them onto the
  // two registry values. `es-419`, `es-mx`, `es-la` and friends all mean the same thing
  // here: LATAM-neutral Spanish. Anything unrecognised falls back to `en` rather than
  // failing the render — a deliverable in the wrong chrome language beats no deliverable.
  const langArg  = (get('--lang') || 'en').toLowerCase();
  const LANG_ALIASES = {
    'es-419': 'es', 'es-la': 'es', 'es-latam': 'es', 'es-mx': 'es', 'es-co': 'es',
    'es-ar': 'es', 'es-cl': 'es', 'es-pe': 'es', 'es-ec': 'es', 'es-es': 'es',
    'en-us': 'en', 'en-gb': 'en',
  };
  LANG = LABELS[langArg] ? langArg : (LANG_ALIASES[langArg] || 'en');
  // Set when the body was rendered into a language other than the one it was authored
  // in. Normalized through the same aliases; ignored when it equals the target language,
  // since "translated from English into English" is a caller bug, not a fact to print.
  const tfArg = (get('--translated-from') || '').toLowerCase();
  const tfNorm = tfArg ? (LABELS[tfArg] ? tfArg : (LANG_ALIASES[tfArg] || '')) : '';
  const translatedFrom = tfNorm && tfNorm !== LANG ? tfNorm : '';
  const input    = get('--input');
  const output   = get('--output') || (format === 'pdf' ? 'output.pdf' : 'output.docx');
  const titleArg = get('--title');
  const author            = get('--author') || 'Solution Architecture';
  const version           = get('--version') || '1.0';
  const status            = get('--status') || 'Draft';
  const score             = get('--score');
  const approvalAuthority = get('--approval-authority');

  // Mermaid diagrams. `auto` embeds them as pictures when mermaid-cli is on the
  // machine and falls back to source when it is not; `on` makes a missing
  // mermaid-cli an error, for a pipeline whose deliverable must carry the drawings;
  // `off` keeps the pre-v6.2.0 behaviour unconditionally.
  // The document theme: --theme <id|folder>, else an institution pack's docTheme, else the base's `alia` (./theme.js)
  try {
    const theme = require('./theme.js').loadTheme({ theme: get('--theme'), project: process.cwd() });
    theme.warnings.forEach((w) => console.warn(`theme: ${w}`));
    applyTheme(theme);
  } catch (e) { console.error(e.message); process.exit(1); }
  const mermaidMode = (get('--mermaid') || 'auto').toLowerCase();
  const mermaidOpts = {
    mode:            mermaidMode,
    theme:           get('--mermaid-theme'),
    background:      get('--mermaid-background'),
    scale:           get('--mermaid-scale'),
    puppeteerConfig: get('--mermaid-puppeteer-config'),
  };
  for (const k of Object.keys(mermaidOpts)) if (mermaidOpts[k] == null) delete mermaidOpts[k];

  const TYPE_LIST = Object.keys(DOC_TYPES).join(', ');

  if (!input) {
    console.error(`Usage: bun run generate-doc.js --type <${Object.keys(DOC_TYPES).join('|')}> --input <file.md> --output <file.docx|file.pdf> [--format <docx|pdf>] [--lang <en|es>] [--translated-from <en|es>]
       [--theme <alia|classic|folder>] [--mermaid <auto|on|off>] [--mermaid-theme <name>] [--mermaid-scale <n>] [--mermaid-background <color>] [--mermaid-puppeteer-config <file.json>]`);
    process.exit(1);
  }

  if (!DOC_TYPES[docType]) {
    console.error(`Unknown type "${docType}". Use: ${TYPE_LIST}`);
    process.exit(1);
  }

  if (format !== 'docx' && format !== 'pdf') {
    console.error(`Unknown format "${format}". Use: docx, pdf`);
    process.exit(1);
  }

  if (!['auto', 'on', 'off'].includes(mermaidMode)) {
    console.error(`Unknown --mermaid "${mermaidMode}". Use: auto, on, off`);
    process.exit(1);
  }

  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    process.exit(1);
  }

  const content = fs.readFileSync(input, 'utf8');
  const title   = titleArg || extractTitle(content);

  const meta = {
    [L().meta.documentType]: docTypeFor(docType).label,
    [L().meta.version]:       version,
    [L().meta.status]:        status,
    [L().meta.author]:        author,
    [L().meta.date]:          localizedToday(),
    ...(score             ? { [L().meta.complianceScore]:   score }             : {}),
    ...(approvalAuthority ? { [L().meta.approvalAuthority]: approvalAuthority } : {}),
    ...(translatedFrom    ? { [L().meta.translation]:
          L().translationNotice(L().langNames[translatedFrom] || translatedFrom) } : {}),
  };

  console.log(`Generating ${docTypeFor(docType).label} [${LANG}] as ${format}: "${title}"...`);

  // Ensure output directory exists (both renderers write through this path)
  const outDir = path.dirname(output);
  if (outDir && outDir !== '.' && !fs.existsSync(outDir)) {
    try {
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {
      console.error(`Cannot create output directory: ${outDir}\n${e.message}`);
      process.exit(1);
    }
  }

  // Parsed once here rather than inside each renderer: the Mermaid pre-render pass
  // rewrites blocks in place, and a second parse downstream would discard its work.
  const directives = extractDirectives(content);
  const blocks     = parseMarkdown(directives.cleanContent || content, docType);

  let mermaid;
  try {
    mermaid = await renderMermaidBlocks(blocks, mermaidOpts);
  } catch (e) {
    // Only reachable with --mermaid on: auto returns a status instead of throwing.
    console.error(e.message);
    process.exit(1);
  }
  const mermaidLine = summarizeMermaid(mermaid);
  if (mermaidLine) console.log(mermaidLine);
  for (const f of mermaid.failures) console.warn(`  mmdc failed on a diagram: ${f.message}`);
  if (mermaid.status === 'unavailable') console.warn(mermaid.hint);

  if (format === 'pdf') {
    // Required lazily so the .docx path keeps working for an install that has only `docx`,
    // and so a missing pdfmake surfaces as an actionable message rather than a load-time crash.
    let renderPdf;
    try {
      renderPdf = require('./render-pdf.js');
    } catch (e) {
      console.error(
        `PDF rendering is unavailable — could not load ./render-pdf.js or its "pdfmake" dependency:\n` +
        `  ${e.message}\n` +
        `pdfmake is an optionalDependency. Install it from the repo root:  cd <plugin_dir> && bun install\n` +
        `The Word (.docx) path does not need it — re-run without --format pdf if you only need Word.`
      );
      process.exit(1);
    }

    try {
      await renderPdf({
        docType, title, blocks, meta, output,
        lang:      LANG,
        labels:    L(),
        typeMeta:  docTypeFor(docType),
        changelog: directives.changelog || null,
        theme:     THEME,
      });
    } catch (e) {
      console.error(`Cannot write output file: ${output}\n${e.message}`);
      process.exit(1);
    }
    console.log(`Written to: ${output}`);
    return;
  }

  const doc    = buildDocument(docType, title, content, meta, { blocks, directives });
  const buffer = await Packer.toBuffer(doc);

  try {
    fs.writeFileSync(output, buffer);
  } catch (e) {
    console.error(`Cannot write output file: ${output}\n${e.message}`);
    process.exit(1);
  }
  console.log(`✓ Written to: ${output}`);
}

// ─── Shared layer, consumed by render-pdf.js and by tests ────────────────────
// render-pdf.js DOES `require('./generate-doc.js')` at module scope, so this is a
// genuine cycle. It resolves only because this assignment runs before main() calls
// into the PDF path: by the time render-pdf.js is first required, module.exports here
// is already populated. Keep this assignment at module scope and above any code that
// requires render-pdf.js — moving it inside a function reintroduces the cycle for real.
module.exports = {
  parseMarkdown, extractDirectives, extractTitle, tokenizeInline,
  DOC_TYPES, LABELS, COLORS, PAGE, applyTheme,
};

// Only run the CLI when invoked directly, so the exports above can be required
// (by render-pdf.js fallbacks or tests) without executing main() as a side effect.
if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}
