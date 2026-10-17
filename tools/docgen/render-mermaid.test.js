/**
 * Unit tests for the Mermaid pre-render pass.
 *
 * Nothing here spawns mermaid-cli: the tests cover block classification, the
 * geometry, the cache key, and — the part that matters most in the field — that
 * every degraded path leaves the Mermaid source in the document instead of
 * losing the diagram.
 *
 * Run: bun test tools/docgen/render-mermaid.test.js
 */

const { test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  renderMermaidBlocks, summarize, isMermaidBlock, pngSize, fitDimensions,
  cacheKey, resolveMmdc, INSTALL_HINT,
} = require('./render-mermaid.js');
const { imageContent, blocksToPdf } = require('./render-pdf.js');

// A real 1x1 PNG — pdfmake parses it, and it has a genuine IHDR to read.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sa-docgen-test-'));
const code = (lang, text) => ({ type: 'code', lang, text });

// ─── Block classification ─────────────────────────────────────────────────────

test('isMermaidBlock accepts the fences a real document carries', () => {
  expect(isMermaidBlock(code('mermaid', 'flowchart TB'))).toBe(true);
  expect(isMermaidBlock(code('Mermaid', 'flowchart TB'))).toBe(true);
  expect(isMermaidBlock(code('  mermaid  ', 'flowchart TB'))).toBe(true);
  expect(isMermaidBlock(code('mermaid title=Overview', 'flowchart TB'))).toBe(true);
});

test('isMermaidBlock rejects everything else', () => {
  expect(isMermaidBlock(code('json', '{}'))).toBe(false);
  expect(isMermaidBlock(code('', 'plain'))).toBe(false);
  expect(isMermaidBlock(code(undefined, 'plain'))).toBe(false);
  // A language that merely starts with the letters is not Mermaid.
  expect(isMermaidBlock(code('mermaidish', 'x'))).toBe(false);
  expect(isMermaidBlock({ type: 'paragraph', text: 'mermaid' })).toBe(false);
  expect(isMermaidBlock(null)).toBe(false);
});

// ─── PNG intrinsic size ───────────────────────────────────────────────────────

test('pngSize reads IHDR', () => {
  expect(pngSize(PNG_1x1)).toEqual({ width: 1, height: 1 });
});

test('pngSize refuses anything that is not a readable PNG', () => {
  expect(pngSize(null)).toBeNull();
  expect(pngSize(Buffer.alloc(10))).toBeNull();                    // too short
  expect(pngSize(Buffer.alloc(64))).toBeNull();                    // zeroed signature
  const truncatedSig = Buffer.from(PNG_1x1);
  truncatedSig.writeUInt32BE(0, 4);                                // corrupt the CRLF signature half
  expect(pngSize(truncatedSig)).toBeNull();
});

// ─── Geometry ─────────────────────────────────────────────────────────────────

test('fitDimensions scales down to the width constraint, keeping the ratio', () => {
  expect(fitDimensions(1000, 500, 648, 820)).toEqual({ width: 648, height: 324 });
});

test('fitDimensions scales down to the height constraint when that binds first', () => {
  expect(fitDimensions(500, 2000, 648, 820)).toEqual({ width: 205, height: 820 });
});

test('fitDimensions never upscales a small diagram', () => {
  expect(fitDimensions(200, 150, 648, 820)).toEqual({ width: 200, height: 150 });
});

test('fitDimensions returns null when a dimension is unknown', () => {
  expect(fitDimensions(0, 100, 648, 820)).toBeNull();
  expect(fitDimensions(undefined, undefined, 648, 820)).toBeNull();
});

// ─── Cache key ────────────────────────────────────────────────────────────────

const KEY_OPTS = { theme: 'default', background: 'white', scale: 2, width: 1400 };

test('cacheKey is stable for the same source and options', () => {
  expect(cacheKey('flowchart TB\n A-->B', KEY_OPTS))
    .toBe(cacheKey('flowchart TB\n A-->B', KEY_OPTS));
});

test('cacheKey changes with the source and with every option that changes pixels', () => {
  const base = cacheKey('flowchart TB\n A-->B', KEY_OPTS);
  expect(cacheKey('flowchart TB\n A-->C', KEY_OPTS)).not.toBe(base);
  expect(cacheKey('flowchart TB\n A-->B', { ...KEY_OPTS, theme: 'neutral' })).not.toBe(base);
  expect(cacheKey('flowchart TB\n A-->B', { ...KEY_OPTS, scale: 3 })).not.toBe(base);
  expect(cacheKey('flowchart TB\n A-->B', { ...KEY_OPTS, background: 'transparent' })).not.toBe(base);
});

// ─── Binary resolution ────────────────────────────────────────────────────────

test('resolveMmdc returns null for an explicit path that does not exist', () => {
  expect(resolveMmdc(path.join(os.tmpdir(), 'definitely-not-mmdc-xyz'))).toBeNull();
});

test('resolveMmdc honours an explicit path that does exist', () => {
  expect(resolveMmdc(__filename)).toBe(__filename);
});

// ─── The pass itself ──────────────────────────────────────────────────────────

test('a document with no Mermaid block is reported as such and left alone', async () => {
  const blocks = [code('json', '{}'), { type: 'paragraph', text: 'hi' }];
  const result = await renderMermaidBlocks(blocks, { binary: __filename });
  expect(result.status).toBe('none');
  expect(result.total).toBe(0);
  expect(blocks[0].type).toBe('code');
  expect(summarize(result)).toBeNull();
});

test('--mermaid off leaves every diagram as source', async () => {
  const blocks = [code('mermaid', 'flowchart TB\n A-->B')];
  const result = await renderMermaidBlocks(blocks, { mode: 'off', binary: __filename });
  expect(result.status).toBe('off');
  expect(result.total).toBe(1);
  expect(result.rendered).toBe(0);
  expect(blocks[0]).toEqual(code('mermaid', 'flowchart TB\n A-->B'));
  expect(summarize(result)).toContain('source');
});

test('a missing mermaid-cli degrades to source under auto, and names the fix', async () => {
  const blocks = [code('mermaid', 'flowchart TB\n A-->B')];
  const result = await renderMermaidBlocks(blocks, {
    mode: 'auto',
    binary: path.join(os.tmpdir(), 'no-such-mmdc'),
  });
  expect(result.status).toBe('unavailable');
  expect(result.hint).toBe(INSTALL_HINT);
  expect(blocks[0].type).toBe('code');
});

test('a missing mermaid-cli is an error under --mermaid on', async () => {
  const blocks = [code('mermaid', 'flowchart TB\n A-->B')];
  await expect(renderMermaidBlocks(blocks, {
    mode: 'on',
    binary: path.join(os.tmpdir(), 'no-such-mmdc'),
  })).rejects.toThrow(/mermaid-cli is not installed/);
});

test('a cached PNG is reused, and the block becomes an image sized in CSS pixels', async () => {
  const cacheDir = tmpdir();
  const source = 'flowchart TB\n A-->B';
  const opts = { cacheDir, binary: __filename, scale: 2, theme: 'default', background: 'white', width: 1400 };

  // Seed the cache exactly where renderOne will look. `binary` points at a file
  // that exists but is never executed: a cache hit must not spawn anything.
  const png = Buffer.from(PNG_1x1);
  png.writeUInt32BE(800, 16);   // IHDR width  — device pixels
  png.writeUInt32BE(600, 20);   // IHDR height
  fs.writeFileSync(path.join(cacheDir, `${cacheKey(source, opts)}.png`), png);

  const blocks = [code('mermaid', source)];
  const result = await renderMermaidBlocks(blocks, opts);

  expect(result.status).toBe('rendered');
  expect(result.rendered).toBe(1);
  expect(result.cached).toBe(1);
  expect(result.failures).toEqual([]);

  const block = blocks[0];
  expect(block.type).toBe('image');
  // scale 2 means the PNG is twice the size the diagram was laid out at.
  expect(block.width).toBe(400);
  expect(block.height).toBe(300);
  expect(block.pixelWidth).toBe(800);
  expect(block.pixelHeight).toBe(600);
  expect(block.source).toBe(source);          // the fallback survives on the block
  expect(fs.existsSync(block.src)).toBe(true);

  fs.rmSync(cacheDir, { recursive: true, force: true });
});

test('summarize counts renders, cache hits and failures', () => {
  expect(summarize({ status: 'rendered', total: 4, rendered: 3, cached: 2, failures: [{ index: 1, message: 'x' }] }))
    .toBe('3/4 Mermaid diagram(s) rendered as images, 2 from cache, 1 failed — exported as source');
});

// ─── Renderer placement ───────────────────────────────────────────────────────

test('the PDF renderer places an image block in points, not pixels', () => {
  const dir = tmpdir();
  const src = path.join(dir, 'diagram.png');
  fs.writeFileSync(src, PNG_1x1);

  const [node] = imageContent({ type: 'image', src, width: 400, height: 300 });
  expect(node.image.startsWith('data:image/png;base64,')).toBe(true);
  // 400 CSS px at 1/96" is 300 pt at 1/72", inside the 496 x 620 pt box.
  expect(node.width).toBe(300);
  expect(node.height).toBe(225);
  expect(node.alignment).toBe('center');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('the PDF renderer caps an oversized diagram at the printable width', () => {
  const dir = tmpdir();
  const src = path.join(dir, 'wide.png');
  fs.writeFileSync(src, PNG_1x1);

  const [node] = imageContent({ type: 'image', src, width: 2000, height: 1000 });
  expect(node.width).toBe(496);
  expect(node.height).toBe(248);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('an image whose file has gone falls back to the Mermaid source', () => {
  const nodes = imageContent({
    type: 'image',
    src: path.join(os.tmpdir(), 'gone-missing.png'),
    width: 400, height: 300,
    source: 'flowchart TB\n A-->B',
    lang: 'mermaid',
  });
  // The code-block shape: a language chip, then the single-cell table holding the source.
  expect(nodes.some(n => n.text === ' MERMAID ')).toBe(true);
  const body = nodes.find(n => n.table);
  expect(body.table.body[0][0].text).toContain('flowchart TB');
});

test('blocksToPdf routes image blocks through the image branch', () => {
  const dir = tmpdir();
  const src = path.join(dir, 'd.png');
  fs.writeFileSync(src, PNG_1x1);

  const content = blocksToPdf([
    { type: 'heading', level: 2, text: 'Diagram' },
    { type: 'image', src, width: 400, height: 300, source: 'flowchart TB', lang: 'mermaid' },
  ], {});
  expect(content.some(n => typeof n.image === 'string')).toBe(true);

  fs.rmSync(dir, { recursive: true, force: true });
});
