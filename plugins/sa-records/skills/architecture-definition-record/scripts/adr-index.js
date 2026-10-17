#!/usr/bin/env node
// adr-index.js — Workflow 7 (Sync ADR Index) as code: the whole `adr/README.md`, regenerated, never merged.
//
//   bun adr-index.js <project-root> [--write] [--json]
//
// Every workflow that writes an ADR ends by regenerating the index. The output contract — layout, sort, machine-layer
// English, never hand-edited — is SKILL.md Workflow 7; the extraction rules are these:
//   - enumerate `adr/ADR-NNN*.md` without the template (ADR-000); none, or no `adr/`, still writes the index at zero counts
//   - per file, its first 25 lines: the id from the file name; the H1 without its `ADR-NNN:` / `ADR-NNN —` prefix, verbatim
//     (the only doc_language text in the file); the `**Status**:` value, or a header-table row `| **Status** | … |`, read
//     as Proposed | Accepted | Deprecated | Rejected | Superseded, and the id a `Superseded by ADR-NNN` names; the
//     `**Date**:` value, else `—` — the translated institutional editions say Estado / Fecha
//   - scope by range: 001–100 Institutional, 101+ Project
//   - the catalog line from the pin (`catalog-diff-cli.ts show-pin`): remote, ref, edition, commit's first 7 characters,
//     synced_on; no pin, no line — never a placeholder
// Without `--write` it prints the file.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');

function entries(root) {
  const dir = path.join(root, 'adr');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^ADR-\d{3}\b.*\.md$/.test(f) && !/^ADR-000/.test(f)).map((f) => {
    const head = read(path.join(dir, f)).split('\n').slice(0, 25).join('\n');
    const id = f.slice(0, 7), n = Number(f.slice(4, 7));
    const title = ((head.match(/^#\s+(.+)$/m) || [])[1] || '').replace(/^ADR-\d{3}\s*[:—–-]\s*/, '').trim();
    // `**Status**: v` or a header table row `| **Status** | v |` — the translated institutional editions say Estado / Fecha
    const field = (names) => { const re = new RegExp('^\\|?\\s*\\*{0,2}(?:' + names + ')\\*{0,2}\\s*(?::|\\|)\\s*\\*{0,2}\\s*([^|\\n]+)', 'mi'); return ((head.match(re) || [])[1] || '').trim(); };
    const statusRaw = field('Status|Estado');
    const status = (statusRaw.match(/^(Proposed|Accepted|Deprecated|Rejected|Superseded)/i) || [])[1] || statusRaw || '—';
    const by = /superseded/i.test(statusRaw) ? (statusRaw.match(/ADR-\d{3}/) || [])[0] || '—' : '—';
    const date = field('Date|Fecha') || '—';
    return { id, n, title, status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(), scope: n <= 100 ? 'Institutional' : 'Project', date, by, file: f };
  }).sort((a, b) => a.n - b.n);
}

function pin(root) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'utils', 'catalog-diff-cli.ts'), 'show-pin', root], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const p = JSON.parse(out); return p && p.remote ? p : null;
  } catch { return null; }
}

function render(root, today = new Date().toISOString().slice(0, 10)) {
  const es = entries(root), p = pin(root);
  const inst = es.filter((e) => e.scope === 'Institutional').length;
  const cell = (s) => String(s).replace(/\|/g, '\\|');
  return [
    '# Architecture Decision Records',
    '',
    `**Total**: ${es.length} · **Institutional (001–100)**: ${inst} · **Project (101+)**: ${es.length - inst}`,
    ...(p ? [`**Institutional catalog**: \`${p.remote}\` @ \`${p.ref}\` · edition \`${p.edition || 'root'}\` · commit \`${String(p.commit || '').slice(0, 7)}\` · synced ${p.synced_on}`] : []),
    `**Last Synced**: ${today}`,
    '',
    '| ID | Title | Status | Scope | Date | Superseded By |',
    '|----|-------|--------|-------|------|---------------|',
    ...es.map((e) => `| ${e.id} | ${cell(e.title)} | ${e.status} | ${e.scope} | ${e.date} | ${e.by} |`),
    '',
  ].join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun adr-index.js <project-root> [--write] [--json]'); process.exit(2); }
  const root = path.resolve(args[0]);
  if (args.includes('--json')) { console.log(JSON.stringify(entries(root), null, 1)); process.exit(0); }
  const text = render(root);
  if (args.includes('--write')) { fs.mkdirSync(path.join(root, 'adr'), { recursive: true }); fs.writeFileSync(path.join(root, 'adr', 'README.md'), text); console.error(`Wrote adr/README.md (${entries(root).length} ADRs)`); }
  else process.stdout.write(text);
}

module.exports = { entries, render };
