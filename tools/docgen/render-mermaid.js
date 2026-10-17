/**
 * Mermaid pre-render pass for the Solution Architecture document generator.
 *
 * Both renderers (docx and pdf) consume the same format-neutral block list. This
 * module runs between `parseMarkdown` and the renderers: every ```mermaid fenced
 * block it can render is replaced, in place, by an `image` block carrying a PNG
 * path and the source it came from. Anything it cannot render is left as a `code`
 * block, so the deliverable degrades to the pre-v6.2.0 behaviour (Mermaid source
 * in monospace) rather than failing.
 *
 * Rendering is delegated to mermaid-cli (`mmdc`), which is NOT a dependency of
 * this workspace: it pulls Puppeteer and a browser, which is far too heavy to
 * impose on an install that only wants Word output. It is auto-detected at
 * runtime — from MMDC_PATH, from the workspace `node_modules/.bin`, or from PATH.
 * Install it where the exports run:
 *
 *     bun install                                 # mermaid-cli is an optionalDependency of tools/docgen
 *     bun add -d @mermaid-js/mermaid-cli          # standalone; or: npm i -g @mermaid-js/mermaid-cli
 *
 * Puppeteer's browser download is skipped by Bun (post-install scripts are not
 * run for untrusted packages), so point mmdc at a browser already on the machine:
 *
 *     PUPPETEER_EXECUTABLE_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
 *
 * or pass --mermaid-puppeteer-config <file.json> with {"executablePath": "..."}.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

// Bumped whenever a change here would make a cached PNG wrong for the same source.
const RENDER_CONTRACT = 'v1';

const DEFAULTS = {
  mode:        'auto',   // auto | on | off
  theme:       'default',
  background:  'white',
  scale:       2,
  width:       1400,
  concurrency: 3,
  timeoutMs:   120000,
};

// ─── Block classification ─────────────────────────────────────────────────────
// The plugin writes its fences as ```mermaid, but a hand-authored doc may carry
// an info string ("mermaid title=…") or different casing, and both are still
// Mermaid to every renderer that reads them.
function isMermaidBlock(block) {
  return Boolean(
    block &&
    block.type === 'code' &&
    typeof block.lang === 'string' &&
    /^mermaid\b/i.test(block.lang.trim())
  );
}

// ─── PNG intrinsic size ───────────────────────────────────────────────────────
// IHDR is fixed at bytes 16–23 of every PNG. Read directly rather than adding an
// image library for two 32-bit integers.
function pngSize(buf) {
  if (!buf || buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  const width  = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return null;
  return { width, height };
}

// Scale to fit the printable box, preserving aspect ratio. Never upscales — a
// small diagram blown up to the page width is blurry, not legible.
function fitDimensions(width, height, maxWidth, maxHeight) {
  if (!width || !height) return null;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width:  Math.max(1, Math.round(width  * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

// ─── Cache ────────────────────────────────────────────────────────────────────
// Every render costs a browser launch, and the same four standard diagrams are
// re-exported on every run of the handoff kit. Key on the source plus everything
// that changes the pixels.
function cacheKey(source, opts) {
  const h = crypto.createHash('sha256');
  h.update(RENDER_CONTRACT);
  h.update('\0');
  h.update(String(source));
  h.update('\0');
  h.update(JSON.stringify([opts.theme, opts.background, opts.scale, opts.width, opts.puppeteerConfigHash || '']));
  return h.digest('hex').slice(0, 32);
}

function defaultCacheDir() {
  return process.env.SA_DOCGEN_MERMAID_CACHE ||
         path.join(os.tmpdir(), 'sa-docgen', 'mermaid');
}

// ─── Binary resolution ────────────────────────────────────────────────────────
// Bun writes `mmdc.exe` shims on Windows, npm writes `mmdc.cmd`; POSIX gets a
// plain `mmdc`. Look for all of them so an install by either package manager is
// found without configuration.
const BIN_NAMES = process.platform === 'win32'
  ? ['mmdc.exe', 'mmdc.cmd', 'mmdc.bat', 'mmdc']
  : ['mmdc'];

function binDirs() {
  const dirs = [];
  // tools/docgen/node_modules/.bin, then the workspace root's — a workspace
  // install hoists the shim to the root, a standalone install keeps it local.
  let dir = __dirname;
  for (let i = 0; i < 4; i++) {
    dirs.push(path.join(dir, 'node_modules', '.bin'));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const PATH = process.env.PATH || process.env.Path || '';
  for (const p of PATH.split(path.delimiter)) {
    if (p) dirs.push(p);
  }
  return dirs;
}

function resolveMmdc(explicit) {
  const fromEnv = explicit || process.env.MMDC_PATH;
  if (fromEnv) return fs.existsSync(fromEnv) ? fromEnv : null;
  for (const dir of binDirs()) {
    for (const name of BIN_NAMES) {
      const candidate = path.join(dir, name);
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
      } catch { /* unreadable PATH entry — keep looking */ }
    }
  }
  return null;
}

const INSTALL_HINT =
  'mermaid-cli is not installed, so every diagram exported as source instead of a picture.\n' +
  'It is an optionalDependency of tools/docgen — install it where the export runs:\n' +
  '  bun install                           (from the repository root)\n' +
  '  bun add -d @mermaid-js/mermaid-cli    (standalone; or: npm i -g @mermaid-js/mermaid-cli)\n' +
  'and, if Puppeteer has no bundled browser, point it at one:\n' +
  '  PUPPETEER_EXECUTABLE_PATH="<path to chrome.exe>"   or   --mermaid-puppeteer-config <file.json>\n' +
  'Report the whole chain with: bun scripts/setup-docgen.ts';

// mmdc reports a bad diagram as the Mermaid parse error followed by a long
// Puppeteer stack. The message is in the first few non-frame lines; the frames
// name only mermaid-cli's own internals and say nothing about the diagram.
function firstUsefulError(stderr, stdout) {
  const useful = String(stderr || stdout || '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() && !/^\s*at\s/.test(l));
  return useful.slice(0, 6).join('\n').trim();
}

// ─── mmdc invocation ──────────────────────────────────────────────────────────
function runMmdc(bin, args, timeoutMs) {
  // A .cmd/.bat shim is not an executable image on Windows and must go through
  // the shell; a real .exe must not, so that arguments are passed verbatim.
  const needsShell = /\.(cmd|bat)$/i.test(bin);
  const file = needsShell ? `"${bin}"` : bin;
  const argv = needsShell ? args.map(a => (/[\s"&|<>^]/.test(a) ? `"${a}"` : a)) : args;

  return new Promise((resolve, reject) => {
    execFile(file, argv, {
      shell: needsShell,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
      env: process.env,
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(firstUsefulError(stderr, stdout) || err.message));
        return;
      }
      resolve(String(stdout || ''));
    });
  });
}

async function renderOne(bin, source, opts) {
  const key   = cacheKey(source, opts);
  const out   = path.join(opts.cacheDir, `${key}.png`);

  // Cache hit: a previous export already paid for this diagram.
  try {
    const cached = fs.readFileSync(out);
    const size = pngSize(cached);
    if (size) return { file: out, ...size, cached: true };
  } catch { /* miss — render it */ }

  fs.mkdirSync(opts.cacheDir, { recursive: true });
  const input = path.join(opts.cacheDir, `${key}.mmd`);
  fs.writeFileSync(input, source.endsWith('\n') ? source : `${source}\n`, 'utf8');

  const args = [
    '-i', input,
    '-o', out,
    '-e', 'png',
    '-t', String(opts.theme),
    '-b', String(opts.background),
    '-s', String(opts.scale),
    '-w', String(opts.width),
    '-q',
  ];
  if (opts.puppeteerConfig) args.push('-p', opts.puppeteerConfig);

  try {
    await runMmdc(bin, args, opts.timeoutMs);
  } finally {
    try { fs.unlinkSync(input); } catch { /* best effort */ }
  }

  const buf = fs.readFileSync(out);
  const size = pngSize(buf);
  if (!size) {
    try { fs.unlinkSync(out); } catch { /* best effort */ }
    throw new Error('mmdc produced a file that is not a readable PNG');
  }
  return { file: out, ...size, cached: false };
}

// Bounded parallelism: each render is a separate browser launch, so the win from
// running them together is real, and the memory cost of running all of them is too.
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * Replace every renderable ```mermaid block in `blocks` with an `image` block.
 * Mutates `blocks` in place and returns a summary the caller can report.
 *
 * status: 'none' | 'off' | 'unavailable' | 'rendered'
 */
async function renderMermaidBlocks(blocks, options = {}) {
  const opts = {
    ...DEFAULTS,
    ...options,
    cacheDir: options.cacheDir || defaultCacheDir(),
  };
  if (opts.puppeteerConfig) {
    opts.puppeteerConfigHash = crypto.createHash('sha256')
      .update(path.resolve(opts.puppeteerConfig))
      .digest('hex').slice(0, 12);
  }

  const targets = [];
  blocks.forEach((block, index) => { if (isMermaidBlock(block)) targets.push(index); });

  const base = { total: targets.length, rendered: 0, cached: 0, failures: [] };
  if (targets.length === 0) return { ...base, status: 'none' };
  if (opts.mode === 'off')  return { ...base, status: 'off' };

  const bin = resolveMmdc(opts.binary);
  if (!bin) {
    if (opts.mode === 'on') throw new Error(INSTALL_HINT);
    return { ...base, status: 'unavailable', hint: INSTALL_HINT };
  }

  const outcomes = await mapLimit(targets, opts.concurrency, async (index) => {
    const block = blocks[index];
    try {
      const png = await renderOne(bin, block.text, opts);
      return { index, png };
    } catch (e) {
      return { index, error: e.message };
    }
  });

  for (const outcome of outcomes) {
    if (outcome.error) {
      base.failures.push({ index: outcome.index, message: outcome.error });
      continue;
    }
    const { png } = outcome;
    // mmdc renders at `scale` device pixels per CSS pixel, so the PNG is
    // `scale` times its intended size. Dividing back out is what makes --mermaid-scale
    // a resolution knob and not a layout knob: the diagram lands at the size Mermaid
    // laid it out for, at scale x the dots per inch.
    const displayScale = Number(opts.scale) > 0 ? Number(opts.scale) : 1;
    blocks[outcome.index] = {
      type:   'image',
      src:    png.file,
      // CSS pixels — the unit both renderers place the picture in.
      width:  Math.max(1, Math.round(png.width  / displayScale)),
      height: Math.max(1, Math.round(png.height / displayScale)),
      // Device pixels, kept so a caller can reason about the actual resolution.
      pixelWidth:  png.width,
      pixelHeight: png.height,
      scale:  displayScale,
      // Kept so a renderer that cannot place the picture can still fall back to
      // the source, and so nothing is lost if the cache file disappears mid-run.
      source: blocks[outcome.index].text,
      lang:   blocks[outcome.index].lang,
    };
    base.rendered++;
    if (png.cached) base.cached++;
  }

  return { ...base, status: 'rendered', binary: bin };
}

// One line for the CLI to print. The caller decides where it goes; this keeps the
// wording in one place for both formats.
function summarize(result, labels) {
  const L = labels || {};
  switch (result.status) {
    case 'none': return null;
    case 'off':
      return `${result.total} ${L.diagramsWord || 'Mermaid diagram(s)'}: ${L.mermaidOff || 'rendered as source (--mermaid off)'}`;
    case 'unavailable':
      return `${result.total} ${L.diagramsWord || 'Mermaid diagram(s)'}: ${L.mermaidUnavailable || 'rendered as source — mermaid-cli not found'}`;
    default: {
      const parts = [`${result.rendered}/${result.total} ${L.diagramsWord || 'Mermaid diagram(s)'} ${L.mermaidRendered || 'rendered as images'}`];
      if (result.cached) parts.push(`${result.cached} ${L.mermaidCached || 'from cache'}`);
      if (result.failures.length) parts.push(`${result.failures.length} ${L.mermaidFailed || 'failed — exported as source'}`);
      return parts.join(', ');
    }
  }
}

module.exports = {
  renderMermaidBlocks,
  summarize,
  // Exported for the unit tests and for reuse by the renderers.
  isMermaidBlock,
  pngSize,
  fitDimensions,
  cacheKey,
  resolveMmdc,
  defaultCacheDir,
  DEFAULTS,
  INSTALL_HINT,
};
