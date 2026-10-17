#!/usr/bin/env node
// The Connection Label Check as code — every connection label of every Mermaid block in a file, held to the
// protocol normal form of the SA Design Language Standard, with the registries read from the copy in force.
//
//   bun label-check.js <file.md> [<file.md> …] [--design-language <dir>] [--json]
//   bun label-check.js --registry | --expression [--design-language <dir>]
//
// Nothing here is transcribed from the standard: the PROTOCOL and STYLE tokens, the fifteen Action Types,
// the `Via` slot (v1.0 RC5, §5.9), the data-scope forms, the composition qualifiers and the expression are read at run time from
// `rules-registry.json` of the bundled design-language folder — the standard's machine registry, generated
// upstream by `_registry.ts` and verified there against both editions of `llms-rules.txt` §0.2 / §5.3–§5.4,
// so no prose is parsed here (a prose reader took the check id `C-11` for a STYLE and the twelve tokens §5.4
// only illustrates for registered ones). The registry's version stamp is printed with every receipt. When the
// folder is absent the check is skipped and says so (fallback mode — the prior, ungoverned diagram formats
// apply); a folder with `llms-rules.txt` and no registry is a partial drop and an error. `--expression` prints
// the anchored expression, which is what DIAGRAM-GENERATION-GUIDE.md cites and what a test holds that
// citation to, so a standard update cannot leave a stale transcription behind.
//
// Labels come from ```mermaid fences only: the `|"…"|` pipe text of a `flowchart` / `graph` edge, the
// `-- "…" -->` / `-. "…" .->` text, and the 4th `Rel()` parameter of a C4 block. `sequenceDiagram` blocks
// (the §12 business-intent regime), `%% Analysis exhibit` blocks and Diagram 1 (the Logical View — band-to-band edges whose
// labels are free prose by the guide's own rule) are not checked. Exit 1 on any label
// that does not match; 0 otherwise, including the skipped case.
'use strict';
const fs = require('fs');
const path = require('path');

const PACKS = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'packs.js'));
const DEFAULT_DL = PACKS.designLanguageDir() || PACKS.BUNDLED['design-language'];   // the folder in force — an institution pack's, else the base's own (scripts/shared/packs.js)

// ---- the registries, from the standard's machine registry
function registries(dlDir) {
  if (!fs.existsSync(path.join(dlDir, 'llms-rules.txt'))) return null;
  const regPath = path.join(dlDir, 'rules-registry.json');
  if (!fs.existsSync(regPath)) throw new Error(`label-check: ${dlDir} carries llms-rules.txt but no rules-registry.json — a partial or pre-v1.0 drop; re-drop the standard with scripts/sync-design-language.ts`);
  const j = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const l = j.label;
  const reg = { source: path.relative(process.cwd(), regPath), stamp: `${j.version}, built ${j.built}`, protocols: l.protocols, styles: l.styles, actions: l.actions.map((a) => a.token),
    dataScope: l.data_scope.map((d) => d.form), composition: l.composition, via: l.via ? l.via.keyword : null, illustrative: (l.illustrative_unregistered || {}).tokens || [], expression: l.expression };
  reg.regex = new RegExp(reg.expression);
  return reg;
}

// ---- the labels of a file
function labelsOf(src) {
  const out = []; const lines = src.split('\n'); let heading = null, inFence = false, inDirective = false, block = null, n = 0;
  const push = (label, line) => block.labels.push({ label: label.trim(), line });
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inFence) { const h = l.match(/^####\s+(?:Diagram|Diagrama)\s*:\s*(.+)$/); if (h) heading = h[1].replace(/<!--.*?-->/g, '').trim();
      if (/^```mermaid\b/.test(l)) { inFence = true; n++; block = { diagram: heading || `block ${n}`, startLine: i + 1, kind: null, labels: [], skipped: /^(Logical View|Vista L[oó]gica)\b/i.test(heading || '') ? 'Diagram 1 — band-to-band edges, labels are free prose (DIAGRAM-GENERATION-GUIDE.md § Logical View)' : null }; } continue; }
    if (/^```/.test(l)) { inFence = false; if (block) out.push(block); block = null; continue; }
    if (inDirective) { if (/\}%%/.test(l)) inDirective = false; continue; }   // a multi-line `%%{ init … }%%` directive is not the diagram's first line
    if (/^\s*%%\{/.test(l) && !/\}%%/.test(l)) { inDirective = true; continue; }
    if (!block.kind) { const t = l.trim(); if (t && !/^%%/.test(t)) block.kind = t.split(/\s/)[0]; if (/%%\s*Analysis exhibit/.test(t)) block.skipped = 'analysis exhibit'; }
    if (block.kind === 'sequenceDiagram') { block.skipped = 'sequenceDiagram (§12 regime)'; continue; }
    if (block.skipped) continue;
    for (const m of l.matchAll(/(?:-->|-\.->|==>|--[xo]|-\.-)\s*\|\s*"?([^"|]*?)"?\s*\|/g)) push(m[1], i + 1);           // A -->|"label"| B
    for (const m of l.matchAll(/--\s*"([^"]*)"\s*-->|-\.\s*"([^"]*)"\s*\.->|==\s*"([^"]*)"\s*==>/g)) push(m[1] ?? m[2] ?? m[3], i + 1);   // A -- "label" --> B
    for (const m of l.matchAll(/\bRel[_A-Za-z]*\(([^)]*)\)/g)) { const args = m[1].match(/"[^"]*"|[^,]+/g) || []; if (args.length >= 4) push(args[3].trim().replace(/^"|"$/g, ''), i + 1); }   // Rel(a, b, "x", "label")
  }
  return out;
}

// ---- the verdict on one label
function judge(label, reg) {
  const m = label.match(/^(\S+?)(?:\/(\S+))? \[([^\]]+)\](.*)$/);
  if (!m) return `not in the protocol normal form \`<PROTOCOL>/<STYLE> [Action Type]\``;
  const [, proto, style, action, rest] = m;
  const shown = (t) => (reg.illustrative.includes(t) ? ' — §5.4 shows it as an illustration only, it is not registered (RFC-011)' : '');
  if (!reg.protocols.includes(proto)) return `PROTOCOL \`${proto}\` is not registered (§5.3)${shown(proto)}`;
  if (style !== undefined && !reg.styles.includes(style)) return `STYLE \`${style}\` is not registered (§5.3)${shown(style)}`;
  if (!reg.actions.includes(action)) return `Action Type \`[${action}]\` is not one of the fifteen registered values (§5.4)`;
  const quals = rest ? rest.split(/ · /).slice(1) : [];
  if (rest && !/^( · [^·]+)+$/.test(rest)) return `qualifier text \`${rest.trim()}\` is not separated by \` · \``;
  let scopes = 0, comps = 0, vias = 0;
  for (const q of quals) {
    // `· Via <name>`: the gateway, proxy, load balancer or broker the connection passes through — at most one, right after the protocol form
    if (reg.via && q.startsWith(reg.via + ' ')) { if (vias++) return `more than one \`· ${reg.via}\` (§5.3: at most one)`; if (scopes || comps) return `\`· ${q}\` comes right after the protocol form, before any qualifier (§5.3)`; continue; }
    if (reg.composition.includes(q)) { comps++; continue; }
    if (reg.dataScope.some((f) => { const kw = f.split('<')[0].trim(); return kw.endsWith('/') ? q.startsWith(kw) : q.startsWith(kw + ' '); })) { scopes++; continue; }
    return `qualifier \`· ${q}\` is neither ${reg.via ? `a \`${reg.via} <name>\`, ` : ''}a data-scope form (${reg.dataScope.map((f) => f.split(/[ <]/)[0]).join(', ')}) nor a composition qualifier (${reg.composition.join(', ')}) — the label grammar is closed (§5.3)`;
  }
  if (scopes > 1) return 'more than one data-scope qualifier (§5.3: at most one)';
  if (comps > 1) return 'more than one composition qualifier (§5.3: at most one)';
  return reg.regex.test(label) ? null : 'does not match the registered expression';
}

function check(files, dlDir) {
  const reg = registries(dlDir);
  if (!reg) return { status: 'SKIPPED', reason: `${dlDir === DEFAULT_DL && !PACKS.designLanguageDir() ? 'no design language in force (an institution pack provides one)' : 'no llms-rules.txt under ' + dlDir} — fallback mode, the label rule does not apply`, files: [] };
  const result = { status: 'PASS', stamp: reg.stamp, source: reg.source, files: [] };
  files.forEach((f) => { const blocks = labelsOf(fs.readFileSync(f, "utf8").replace(/\r\n?/g, "\n")).map((b) => { const failures = b.skipped ? [] : b.labels.map((x) => ({ ...x, why: judge(x.label, reg) })).filter((x) => x.why); if (failures.length) result.status = 'FAIL'; return { diagram: b.diagram, startLine: b.startLine, skipped: b.skipped, labels: b.labels.length, failures }; }); result.files.push({ file: f, blocks }); });
  return result;
}

function render(r) {
  if (r.status === 'SKIPPED') return `Connection Label Check: skipped — ${r.reason}`;
  const lines = [`Connection Label Check — registries from ${r.source} (${r.stamp})`];
  r.files.forEach((f) => { lines.push(f.file); if (!f.blocks.length) lines.push('  (no mermaid block)'); f.blocks.forEach((b) => {
    if (b.skipped) { lines.push(`  ${b.diagram} (line ${b.startLine}): not checked — ${b.skipped}`); return; }
    lines.push(`  ${b.diagram} (line ${b.startLine}): ${b.labels - b.failures.length}/${b.labels} labels registered${b.failures.length ? '' : ' ✓'}`);
    b.failures.forEach((x) => lines.push(`    ✗ line ${x.line}: "${x.label}" — ${x.why}`)); }); });
  lines.push(r.status === 'PASS' ? 'PASS' : 'FAIL — fix every label above and re-run; never write a block that fails');
  return lines.join('\n');
}

module.exports = { registries, labelsOf, judge, check, render, DEFAULT_DL };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const dl = opt('--design-language') ? path.resolve(opt('--design-language')) : DEFAULT_DL;
  if (args.includes('--registry') || args.includes('--expression')) { const reg = registries(dl); if (!reg) { console.error(dl === DEFAULT_DL && !PACKS.designLanguageDir() ? 'label-check: no design language in force — install an institution pack (docs/INSTITUTION_PACKS.md) or pass --design-language <dir>' : `label-check: no llms-rules.txt under ${dl}`); process.exit(2); }
    if (args.includes('--expression')) console.log(reg.expression); else { const { regex, ...rest } = reg; console.log(JSON.stringify(rest, null, 1)); } process.exit(0); }
  const files = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--design-language');
  if (!files.length) { console.error('Usage: bun label-check.js <file.md> [<file.md> …] [--design-language <dir>] [--json] | --registry | --expression'); process.exit(2); }
  const missing = files.filter((f) => !fs.existsSync(f)); if (missing.length) { console.error(`label-check: not found: ${missing.join(', ')}`); process.exit(2); }
  const r = check(files, dl);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1)); else console.log(render(r));
  process.exit(r.status === 'FAIL' ? 1 : 0);
}
