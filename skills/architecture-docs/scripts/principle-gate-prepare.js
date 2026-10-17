#!/usr/bin/env node
// The Layer 2 principle gate's prompt prefix — the five blocks `principle-quality-reviewer` consumes, built
// from extracts instead of four whole files.
//
//   bun principle-gate-prepare.js <project-root> --mode first-write|edit-delta|downstream-impact
//                                 [--round N] [--diff <file>] [--prior <review file>] [--out <file>] [--json]
//
// Repair rounds (8.118.7): every payload written also saves the principles it carries to
// `.cache/sa-skills/payloads/principles-reviewed.md`. `--mode edit-delta` without `--diff` diffs the file against that
// snapshot — the changes since the last review, by line — and `--prior` carries the last review's result as
// `<prior_review>`, so a round-2 review judges what changed and whether the blocking findings were resolved, instead
// of a full first-write review that finds new warnings on untouched text every round.
//
// The reviewer needs: the principles (whole — they are what is judged); from the system overview only the
// Key Metrics (QA-conflation check), the Business Value and the Problem / Solution statements (type
// sanity); from the layers only the architecture type and the layer table; from the tech stack its tables
// (the tech names and versions the specificity check greps for) plus the technologies the component
// descriptors declare; and the ADR ids that exist. Everything else in those files is prose the reviewer
// never cites. This script cuts exactly that, by anchor (`<!-- LABEL: Key Metrics -->` …) with a fallback
// to the heading text, and prints the stable prefix — mode, round, arch_type, doc_language, the paths, the
// diff, the five blocks — ending at the marker after which the orchestrator appends the per-call line
// (`downstream_file`) or nothing. Sizes against the whole files go to stderr. Runs under Bun.
'use strict';
const fs = require('fs');
const path = require('path');
const { collect } = require(path.join(__dirname, 'arch-facts.js'));

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';
const docByPrefix = (root, nn) => { const dir = path.join(root, 'docs'); if (!exists(dir)) return null; const f = fs.readdirSync(dir).find((x) => x.startsWith(nn + '-') && x.endsWith('.md')); return f ? path.join(dir, f) : null; };

// the lines from an anchored heading / label to the next heading or label of the same or higher rank
const anchored = (src, anchor, fallbackRe) => {
  const lines = src.split('\n');
  let s = lines.findIndex((l) => new RegExp('<!--\\s*(SECTION|LABEL):\\s*' + anchor + '\\s*-->').test(l));
  if (s < 0 && fallbackRe) s = lines.findIndex((l) => /^(#{1,4}\s|\*\*)/.test(l) && fallbackRe.test(l));
  if (s < 0) return null;
  const isHead = /^#/.test(lines[s]); const lvl = isHead ? (lines[s].match(/^#+/) || [''])[0].length : 99;
  const out = [lines[s]];
  for (let i = s + 1; i < lines.length; i++) { const l = lines[i]; const h = (l.match(/^#+(?=\s)/) || [''])[0].length; if (isHead && h && h <= lvl) break; if (!isHead && /^\*\*[^*]+:?\*\*:?\s*(<!--|$)/.test(l)) break; if (!isHead && h && h <= 3) break; out.push(l); }
  return out.join('\n').trim();
};
const snapshotPath = (root) => path.join(root, '.cache', 'sa-skills', 'payloads', 'principles-reviewed.md');
// a line diff by longest common subsequence: `-` / `+` lines under an `@@ line N @@` header (N in the new file); '' when equal
function lineDiff(a, b) {
  const A = a.split('\n'), B = b.split('\n'), n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0, hunk = null;
  const open = () => { if (!hunk) { hunk = []; out.push(`@@ line ${j + 1} @@`); } };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { hunk = null; i++; j++; }
    else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) { open(); out.push('- ' + A[i]); i++; }
    else { open(); out.push('+ ' + B[j]); j++; }
  }
  return out.join('\n');
}
const headerOf = (src) => { const h1 = (src.match(/^#\s.+$/m) || [''])[0]; const hm = src.match(/<!-- EXPLORER_HEADER[\s\S]*?-->/); const after = hm ? src.slice(src.indexOf(hm[0]) + hm[0].length) : src; const quote = (after.match(/^>\s.+$/m) || [''])[0]; return [h1, hm ? hm[0] : '', quote].filter(Boolean).join('\n\n'); };
const headings = (src) => src.split('\n').map((l, i) => ({ l, i })).filter((x) => /^#{2,4}\s/.test(x.l)).map((x) => `${String(x.i + 1).padStart(4)}  ${x.l.replace(/<!--.*?-->/g, '').trim()}`).join('\n');
// every table with the nearest heading above it
const tablesWithHeadings = (src) => { const lines = src.split('\n'); const out = []; let head = ''; for (let i = 0; i < lines.length; i++) { if (/^#{1,4}\s/.test(lines[i])) head = lines[i].replace(/<!--.*?-->/g, '').trim(); if (/^\s*\|/.test(lines[i]) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) { const t = []; let j = i; while (j < lines.length && /^\s*\|/.test(lines[j])) { t.push(lines[j]); j++; } out.push((head ? head + '\n\n' : '') + t.join('\n')); i = j - 1; } } return out.join('\n\n'); };
const table = (headers, rows) => rows.length ? `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map((c) => String(c == null ? '' : c).replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}` : '';

function prepare(root, opts = {}) {
  root = path.resolve(root);
  const mode = opts.mode || 'first-write';
  if (!['first-write', 'edit-delta', 'downstream-impact'].includes(mode)) throw new Error(`mode must be first-write, edit-delta or downstream-impact (got ${mode})`);
  const facts = collect(root);
  const files = { principles: docByPrefix(root, '02'), overview: docByPrefix(root, '01'), layers: docByPrefix(root, '03'), tech: docByPrefix(root, '06') };
  const missing = [], sizes = [];
  const src = {}; Object.entries(files).forEach(([k, p]) => { src[k] = p ? read(p) : ''; if (!p) missing.push(`docs/${{ principles: '02', overview: '01', layers: '03', tech: '06' }[k]} not found`); });
  const relf = (p) => (p ? path.relative(root, p) : null);

  // the five blocks
  const principles = src.principles;
  const ov = src.overview;
  const overviewParts = ov ? [headerOf(ov),
    anchored(ov, 'Key Metrics', /Key Metrics|M[ée]tricas Clave/i) || '(no Key Metrics block — LABEL: Key Metrics absent)',
    anchored(ov, 'Business Value', /Business Value|Valor de Negocio/i) || '',
    anchored(ov, 'Problem Statement', /Problem Statement|Planteamiento del Problema/i) || '',
    anchored(ov, 'Solution', /^#{1,4}\s+(Solution|Soluci[oó]n)\b/i) || '',
    'Headings (line  heading):\n' + headings(ov)].filter(Boolean).join('\n\n') : '';
  const archType = (src.layers.match(/<!--\s*ARCHITECTURE_TYPE:\s*([^>]*?)\s*-->/) || [])[1] || facts.architecture.type || 'unknown';
  const layersParts = src.layers ? [headerOf(src.layers), `<!-- ARCHITECTURE_TYPE: ${archType} -->`,
    table(['Layer', 'Name', 'Containers', 'Inside boundary'], facts.layers.map((l) => [l.n, l.name, l.containers.join(', '), l.owned ? 'yes' : 'no'])) || '(no layer table in docs/03 § 4.1)',
    'Headings (line  heading):\n' + headings(src.layers)].filter(Boolean).join('\n\n') : '';
  const techParts = src.tech ? [headerOf(src.tech), tablesWithHeadings(src.tech) || '(docs/06 has no tables)',
    'Technologies declared by the component descriptors (canonical container name → technology):\n\n' + (table(['Container', 'Technology'], facts.components.filter((c) => c.level === 'L2').map((c) => [c.name, c.technology.join(', ')])) || '(no containers yet)'),
    'Headings (line  heading):\n' + headings(src.tech)].filter(Boolean).join('\n\n') : '';
  // id · title · status: the reviewer's ADR-alignment check needs the titles, and adr/README.md may not exist yet (8.102.0)
  const adrIds = facts.adrs.slice().sort((a, b) => a.id.localeCompare(b.id)).map((a) => [a.id, a.title, a.status].filter(Boolean).join(' · ')).join('\n');
  if (!facts.adrs.length) missing.push('adr/ has no ADR files — the <adr_index> block is empty');

  const whole = (k) => Buffer.byteLength(src[k] || '');
  [['system_overview', overviewParts, whole('overview')], ['arch_layers', layersParts, whole('layers')], ['tech_stack', techParts, whole('tech')]].forEach(([k, t, w]) => sizes.push(`${k}: ${kb(t)} of ${kb(String(' ').repeat(w))} whole`));

  let diff = opts.diff && exists(opts.diff) ? read(opts.diff) : null;
  if (!diff && mode === 'edit-delta' && principles && exists(snapshotPath(root))) diff = lineDiff(read(snapshotPath(root)), principles) || '(no change since the last review)';
  const prior = opts.prior && exists(opts.prior) ? read(opts.prior).trim() : null;
  if (opts.prior && !prior) missing.push(`prior_review: ${opts.prior} not found`);
  if ((mode === 'edit-delta' || mode === 'downstream-impact') && !diff) missing.push('principles_diff: pass --diff <file> for edit-delta / downstream-impact');
  const head = [`mode: ${mode}`, `round: ${opts.round || 1}`, `arch_type: ${archType}`, `doc_language: ${facts.architecture.language}`,
    `principles_file: ${relf(files.principles) || 'docs/02-architecture-principles.md'}`, `system_overview_file: ${relf(files.overview) || 'docs/01-system-overview.md'}`, `arch_layers_file: ${relf(files.layers) || 'docs/03-architecture-layers.md'}`, `tech_stack_file: ${relf(files.tech) || 'docs/06-technology-stack.md'}`, 'adr_index_glob: adr/*.md',
    diff ? `principles_diff: |\n${diff.split('\n').map((l) => '  ' + l).join('\n')}` : null].filter(Boolean).join('\n');
  const priorBlock = prior ? `\n\n<prior_review>\n${prior}\n</prior_review>` : '';
  const text = `${head}${priorBlock}\n\n<principles>\n${principles}\n</principles>\n\n<system_overview>\n${overviewParts}\n</system_overview>\n\n<arch_layers>\n${layersParts}\n</arch_layers>\n\n<tech_stack>\n${techParts}\n</tech_stack>\n\n<adr_index>\n${adrIds}\n</adr_index>\n\n# === Stable prefix ends here. Only the line below differs per call. ===\n`;
  return { text, mode, arch_type: archType, missing, sizes, bytes: Buffer.byteLength(text), principles, diff };
}

module.exports = { prepare, lineDiff, snapshotPath };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun principle-gate-prepare.js <project-root> --mode first-write|edit-delta|downstream-impact [--round N] [--diff <file>] [--prior <review file>] [--out <file>] [--json]'); process.exit(2); }
  let r; try { r = prepare(args[0], { mode: opt('--mode'), round: opt('--round'), diff: opt('--diff'), prior: opt('--prior') }); } catch (e) { console.error('principle-gate-prepare: ' + e.message); process.exit(2); }
  if (args.includes('--json')) process.stdout.write(JSON.stringify(r, null, 1) + '\n');
  else { const out = opt('--out') || path.join(path.resolve(args[0]), '.cache', 'sa-skills', 'payloads', 'principle-gate.md'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, r.text); if (r.principles) fs.writeFileSync(snapshotPath(path.resolve(args[0])), r.principles); console.error(`Wrote ${out} (${kb(r.text)}, mode ${r.mode}, arch_type ${r.arch_type}${r.diff ? `, diff ${r.diff.split('\n').filter((l) => /^[-+] /.test(l)).length} line(s)` : ''})`); }
  console.error(`Blocks as extracts:\n  - ${r.sizes.join('\n  - ')}`);
  if (r.missing.length) console.error(`Missing (${r.missing.length}):\n  - ${r.missing.join('\n  - ')}`);
}
