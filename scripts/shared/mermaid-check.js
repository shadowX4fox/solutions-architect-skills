#!/usr/bin/env node
// The diagram gate as code — every Mermaid block of a file held to the Pre-Write Validation checklist of
// DIAGRAM-GENERATION-GUIDE.md, then rendered through mermaid-cli when it is installed.
//
//   bun mermaid-check.js <file.md> [<file.md> …] [--no-render] [--render] [--json]
//
// Two layers, in order:
//   lint    the forbidden patterns, deterministic and instant — HTML tags; a `;` inside a sequence message,
//           a Note, a node label, an edge label or a C4 Rel() string (`;` ends a statement, so Mermaid reads
//           what follows as a new one); emoji; a `|` inside node text; unbalanced double quotes; and, by
//           diagram, the Detailed View's subgraph-id edges, the Logical View's node-to-node edges, an
//           unclassed element and the retired layer-role palette on Diagrams 1 and 4. In governed mode (the
//           design-language folder present) a data-flow sequenceDiagram carrying Note / loop / alt / opt /
//           par / rect / activate / classDef is reported as a WARNING (llms-mermaid.txt §12).
//   render  each block that passed the lint is rendered with mmdc (resolved as docgen resolves it: MMDC_PATH,
//           the workspace's node_modules/.bin, PATH); a parse error fails the block with mermaid-cli's own
//           message. Without mmdc the layer is skipped and the receipt says so — `--render` makes that an
//           error, `--no-render` skips it on purpose.
//
// Exit 1 on any failing block; 0 otherwise. The receipt names the file, the diagram heading, the line and
// the rule, so the fix is one edit — never a regenerated diagram. Connection-label vocabulary is
// `label-check.js`'s job and is not repeated here.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKS = require(path.join(__dirname, 'packs.js'));
const DL_DIR = PACKS.designLanguageDir() || PACKS.BUNDLED['design-language'];   // the folder in force — an institution pack's, else the base's own (scripts/shared/packs.js);  // optional: the Design Language Standard; absent, the checks run in fallback mode
const RETIRED_CLASSES = ['channel', 'ux', 'scenario', 'business', 'domain', 'core', 'messaging', 'datastore', 'presentation', 'logic', 'data', 'ui', 'application', 'infrastructure', 'gateway', 'service', 'worker', 'external'];
const RETIRED_HEXES = ['#4A90E2', '#F5A623', '#7ED321', '#D0021B', '#BD10E0', '#417505', '#50E3C2', '#438DD5', '#9B9B9B'];

// ---- the blocks of a file, with the diagram heading above each
function blocksOf(src) {
  const lines = src.split('\n'), out = []; let heading = null, inFence = false, block = null, n = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inFence) { const h = l.match(/^####\s+(?:Diagram|Diagrama)\s*:\s*(.+)$/); if (h) heading = h[1].replace(/<!--.*?-->/g, '').trim(); else if (/^#{1,3}\s/.test(l)) heading = null;
      if (/^```mermaid\b/.test(l)) { inFence = true; n++; block = { diagram: heading || `block ${n}`, startLine: i + 1, lines: [] }; } continue; }
    if (/^```/.test(l)) { inFence = false; block.source = block.lines.join('\n'); out.push(block); block = null; continue; }
    block.lines.push(l);
  }
  return out;
}
const kindOf = (lines) => { let inDir = false; for (const raw of lines) { const l = raw.trim(); if (inDir) { if (/\}%%/.test(l)) inDir = false; continue; } if (/^%%\{/.test(l) && !/\}%%/.test(l)) { inDir = true; continue; } if (!l || /^%%/.test(l)) continue; return l.split(/\s/)[0]; } return ''; };
const which = (diagram) => /^(Logical View|Vista L[oó]gica)/i.test(diagram) ? 'D1' : /C4\s*Level\s*1|C4\s*Nivel\s*1/i.test(diagram) ? 'D2' : /C4\s*Level\s*2|C4\s*Nivel\s*2/i.test(diagram) ? 'D3' : /^(Detailed View|Vista Detallada)/i.test(diagram) ? 'D4' : null;

// ---- lint
function lint(block, opts) {
  const findings = [], warnings = [], kind = kindOf(block.lines), d = which(block.diagram);
  const isSeq = kind === 'sequenceDiagram', isFlow = /^(flowchart|graph)\b/.test(kind), isC4 = /^C4/.test(kind);
  const nodeIds = new Set(), subgraphIds = new Set(), classed = new Set(), classDefs = [], edges = [];
  const fail = (rule, i, why) => findings.push({ rule, line: block.startLine + 1 + i, text: block.lines[i].trim(), why });
  block.lines.forEach((raw, i) => {
    const l = raw.replace(/%%.*$/, '').trimEnd(); if (!l.trim()) return;
    const code = l.trim();
    // 1. HTML tags anywhere in a label
    if (/<\/?[a-zA-Z][^<>]*>/.test(code.replace(/<br\s*\/?>/gi, ''))) fail('html-tag', i, 'HTML tags do not render: remove them');
    else if (/<br\s*\/?>/i.test(code)) warnings.push({ rule: 'br-tag', line: block.startLine + 1 + i, text: code, why: 'the guide prefers `\\n` to `<br/>` in labels; Mermaid renders both' });
    // 2. semicolons — `;` ends a Mermaid statement
    if (isSeq && /^\s*(\S+\s*-+>>?\+?-?\s*\S+\s*:|Note (over|left of|right of) [^:]+:).*;/.test(code)) fail('semicolon', i, '`;` ends a sequenceDiagram statement — Mermaid reads what follows as a new statement with no arrow; write `,`, `—` or `.` instead');
    if (isFlow) { const body = code.replace(/;\s*$/, ''); const labels = [...body.matchAll(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|\|[^|]*\|/g)].map((m) => m[0]); if (labels.some((s) => s.includes(';'))) fail('semicolon', i, '`;` inside a node or edge label ends the statement — write `,`, `—` or `.`'); }
    if (isC4 && /"[^"]*;[^"]*"/.test(code)) fail('semicolon', i, '`;` inside a C4 string ends the statement — write `,`, `—` or `.`');
    // 3. emoji
    if (/\p{Extended_Pictographic}/u.test(code)) fail('emoji', i, 'emoji render differently per platform — remove it');
    // 4. a pipe inside node text
    if (isFlow && /\[[^\]]*\|[^\]]*\]/.test(code.replace(/-->\s*\|[^|]*\|/g, ''))) fail('pipe-in-node', i, '`|` inside a node label is read as an edge label delimiter — write `/`');
    // 5. unbalanced double quotes
    if (((code.match(/"/g) || []).length % 2) === 1) fail('quotes', i, 'an odd number of `"` on the line — an inner quote must be `\'`');
    // structure for the diagram-specific rules
    if (isFlow) {
      const sg = code.match(/^subgraph\s+([A-Za-z0-9_-]+)/); if (sg) subgraphIds.add(sg[1]);
      const bare = code.replace(/"[^"]*"/g, '""');   // node ids are read outside quoted labels, so `Captura CDC (…)` inside a label is not a node
      for (const m of bare.matchAll(/(^|[\s>|&])([A-Za-z0-9_-]+)\s*(\[|\(|\{)/g)) if (!/^(subgraph|class|classDef|style|linkStyle|direction|flowchart|graph|end)$/.test(m[2])) nodeIds.add(m[2]);
      for (const m of code.matchAll(/([A-Za-z0-9_-]+)\s*(?:-->|-\.->|==>|--[xo]|-\.-|--)/g)) { const rest = code.slice(m.index + m[0].length); const to = rest.match(/(?:\|[^|]*\|\s*|"[^"]*"\s*-->\s*|[^-]*-->\s*)?([A-Za-z0-9_-]+)/); if (to) edges.push([m[1], to[1]]); }
      const cl = code.match(/^class\s+([^\s]+)\s+([A-Za-z0-9_-]+)/); if (cl) cl[1].split(',').forEach((x) => classed.add(x.trim()));
      for (const m of code.matchAll(/([A-Za-z0-9_-]+):::([A-Za-z0-9_-]+)/g)) classed.add(m[1]);
      const cd = code.match(/^classDef\s+([A-Za-z0-9_-]+)\s+(.*)$/); if (cd) classDefs.push({ name: cd[1], body: cd[2], i });
    }
    // governed mode: §12 constructs in a data-flow sequence
    if (isSeq && opts.governed && /^(Note\b|loop\b|alt\b|opt\b|par\b|rect\b|activate\b|deactivate\b|classDef\b)/.test(code)) warnings.push({ rule: 'governed-sequence', line: block.startLine + 1 + i, text: code, why: 'llms-mermaid.txt §12: a Dynamic view carries numbered business-intent steps only — no Note / loop / alt / opt / par / rect / activation / classDef' });
  });
  if (isFlow && (d === 'D1' || d === 'D4')) {
    classDefs.forEach((c) => { if (RETIRED_CLASSES.includes(c.name) || RETIRED_HEXES.some((h) => c.body.toUpperCase().includes(h))) fail('retired-palette', c.i, `classDef \`${c.name}\` is the retired layer-role palette — the four-role \`zone\` / \`unit\` / \`store\` / \`ext\` palette is the only one on Diagrams 1 and 4`); });
    [...new Set([...nodeIds, ...subgraphIds])].filter((id) => !classed.has(id)).forEach((id) => findings.push({ rule: 'unclassed', line: block.startLine, text: id, why: `\`${id}\` is in no \`class …\` line — assign \`unit\`, \`store\`, \`ext\` or \`zone\`` }));
  }
  if (isFlow && d === 'D4') edges.filter(([a, b]) => subgraphIds.has(a) || subgraphIds.has(b)).forEach(([a, b]) => findings.push({ rule: 'subgraph-edge', line: block.startLine, text: `${a} --> ${b}`, why: 'an edge on a subgraph id in the Detailed View — connect the nodes inside the band instead' }));
  if (isFlow && d === 'D1') edges.filter(([a, b]) => !subgraphIds.has(a) && !subgraphIds.has(b) && (nodeIds.has(a) || nodeIds.has(b))).forEach(([a, b]) => findings.push({ rule: 'node-edge', line: block.startLine, text: `${a} --> ${b}`, why: 'a node-to-node edge in the Logical View — its edges join bands; move the detail to Diagram 4' }));
  return { kind, findings, warnings };
}

// ---- render with mermaid-cli, resolved as docgen resolves it
function resolveMmdc() { try { return require(path.join(__dirname, '..', '..', 'tools', 'docgen', 'render-mermaid.js')).resolveMmdc(); } catch { return null; } }
function renderCheck(bin, block, tmpDir) {
  const input = path.join(tmpDir, `check-${block.startLine}.mmd`), out = path.join(tmpDir, `check-${block.startLine}.svg`);
  fs.writeFileSync(input, block.source + '\n');
  const args = ['-i', input, '-o', out, '-e', 'svg', '-q']; if (process.env.PUPPETEER_CONFIG) args.push('-p', process.env.PUPPETEER_CONFIG);
  const r = /\.(cmd|bat)$/i.test(bin) ? spawnSync('cmd.exe', ['/c', bin, ...args], { encoding: 'utf8', timeout: 90000 }) : spawnSync(bin, args, { encoding: 'utf8', timeout: 90000 });
  try { fs.unlinkSync(input); fs.unlinkSync(out); } catch { /* best effort */ }
  if (r.status === 0) return null;
  const useful = String(r.stderr || r.stdout || r.error || '').split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim() && !/^\s*at\s/.test(l)).slice(0, 6).join('\n').trim();
  return useful || `mmdc exited ${r.status}`;
}

// a directory argument (a project root, `docs/`) expands to the Markdown under it — `mermaid-check.js .` crashed on
// readFileSync(EISDIR) with a stack trace in the 2026-09-30 control runs (8.102.0)
function expandFiles(args) {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.md$/i.test(e.name)) out.push(p); } };
  for (const a of args) { let st = null; try { st = fs.statSync(a); } catch { st = null; } if (st && st.isDirectory()) walk(a); else out.push(a); }
  return out;
}

function check(files, opts = {}) {
  files = expandFiles(files);
  const governed = opts.governed !== undefined ? opts.governed : fs.existsSync(path.join(DL_DIR, 'llms-rules.txt'));
  const bin = opts.render === false ? null : resolveMmdc();
  const result = { status: 'PASS', governed, render: bin ? 'mmdc' : (opts.render === true ? 'REQUIRED-BUT-ABSENT' : 'skipped — mermaid-cli not installed'), files: [] };
  if (opts.render === true && !bin) result.status = 'FAIL';
  const tmpDir = path.join(process.env.TMPDIR || require('os').tmpdir(), 'sa-mermaid-check'); if (bin) fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of files) {
    const blocks = blocksOf(fs.readFileSync(f, "utf8").replace(/\r\n?/g, "\n")).map((b) => { const { kind, findings, warnings } = lint(b, { governed }); let renderError = null; if (bin && !findings.length) renderError = renderCheck(bin, b, tmpDir); if (findings.length || renderError) result.status = 'FAIL'; return { diagram: b.diagram, kind, startLine: b.startLine, findings, warnings, renderError }; });
    result.files.push({ file: f, blocks });
  }
  return result;
}

function render(r) {
  const out = [`Mermaid check — lint${r.governed ? ' (governed mode)' : ''} + render: ${r.render}`];
  r.files.forEach((f) => { out.push(f.file); if (!f.blocks.length) out.push('  (no mermaid block)'); f.blocks.forEach((b) => {
    const ok = !b.findings.length && !b.renderError;
    out.push(`  ${b.diagram} (${b.kind || '?'}, line ${b.startLine}): ${ok ? (r.render === 'mmdc' ? 'lint ✓ render ✓' : 'lint ✓') : 'FAIL'}`);
    b.findings.forEach((x) => out.push(`    ✗ line ${x.line} [${x.rule}]: ${x.text.slice(0, 100)}\n      ${x.why}`));
    if (b.renderError) out.push(`    ✗ mermaid-cli: ${b.renderError.split('\n').join('\n      ')}`);
    b.warnings.forEach((x) => out.push(`    ⚠ line ${x.line} [${x.rule}]: ${x.text.slice(0, 80)}\n      ${x.why}`)); }); });
  out.push(r.status === 'PASS' ? 'PASS' : 'FAIL — fix every block above at the line named and re-run; a block that fails here exports as source, not as a picture');
  return out.join('\n');
}

// the CLI, callable from the old path under architecture-docs/scripts/ as well
function main(args) {
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) { console.error('Usage: bun mermaid-check.js <file.md> [<file.md> …] [--no-render] [--render] [--json]'); process.exit(2); }
  const missing = files.filter((f) => !fs.existsSync(f)); if (missing.length) { console.error(`mermaid-check: not found: ${missing.join(', ')}`); process.exit(2); }
  const r = check(files, { render: args.includes('--no-render') ? false : args.includes('--render') ? true : undefined });
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1)); else console.log(render(r));
  process.exit(r.status === 'FAIL' ? 1 : 0);
}

module.exports = { blocksOf, lint, check, render, resolveMmdc, main };

if (require.main === module) main(process.argv.slice(2));
