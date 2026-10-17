#!/usr/bin/env node
// Rotates docs/CHANGELOG.md: the newest N versioned entries stay, older ones move to docs/CHANGELOG-ARCHIVE.md.
//
//   bun changelog-rotate.js <project-root> [--keep 5] [--dry-run] [--json]
//
// A released entry is a record: it is archived whole, never shortened or summarized. `[Unreleased]` and the
// file header always stay. The archive keeps the same shape (header, entries newest first); rotated entries
// go above the ones already archived, so the archive stays in version order. The main file ends with one
// footer line naming the archive, written once. Nothing happens when there is nothing to rotate.
'use strict';
const fs = require('fs');
const path = require('path');

const FOOTER = (lang) => lang === 'es' ? '> Versiones anteriores: [CHANGELOG-ARCHIVE.md](CHANGELOG-ARCHIVE.md).' : '> Older releases: [CHANGELOG-ARCHIVE.md](CHANGELOG-ARCHIVE.md).';
const ARCHIVE_HEADER = (lang) => lang === 'es' ? '# Changelog — archivo\n\nEntradas rotadas desde `CHANGELOG.md`; cada una se conserva íntegra. Las más recientes están en [CHANGELOG.md](CHANGELOG.md).\n' : '# Changelog — archive\n\nEntries rotated out of `CHANGELOG.md`, each kept whole. The newest ones are in [CHANGELOG.md](CHANGELOG.md).\n';

// split a changelog into { header, entries[] } — an entry is `## [x]` up to the next `## [`, footer lines excluded
function parse(text) {
  const parts = text.split(/^(?=## \[)/m);
  const header = /^## \[/.test(parts[0]) ? '' : parts[0];
  const entries = parts.filter((p) => /^## \[/.test(p)).map((p) => { const version = (p.match(/^## \[([^\]]+)\]/) || [])[1]; return { version, text: p.replace(/\n> (Older releases|Versiones anteriores): \[CHANGELOG-ARCHIVE\.md\]\(CHANGELOG-ARCHIVE\.md\)\.\s*$/, '\n') }; });
  return { header: header.replace(/\n> (Older releases|Versiones anteriores): \[CHANGELOG-ARCHIVE\.md\]\(CHANGELOG-ARCHIVE\.md\)\.\s*$/, '\n'), entries };
}

function rotate(root, opts = {}) {
  root = path.resolve(root);
  const keep = Math.max(1, parseInt(opts.keep ?? 5, 10) || 5);
  const main = path.join(root, 'docs', 'CHANGELOG.md'), archive = path.join(root, 'docs', 'CHANGELOG-ARCHIVE.md');
  if (!fs.existsSync(main)) throw new Error('docs/CHANGELOG.md not found');
  const src = fs.readFileSync(main, "utf8").replace(/\r\n?/g, "\n");
  const lang = (fs.existsSync(path.join(root, 'ARCHITECTURE.md')) && (fs.readFileSync(path.join(root, 'ARCHITECTURE.md'), "utf8").replace(/\r\n?/g, "\n").match(/<!--\s*DOC_LANGUAGE:\s*(\w+)/) || [])[1]) === 'es' ? 'es' : 'en';
  const { header, entries } = parse(src);
  const unreleased = entries.filter((e) => /unreleased/i.test(e.version)), versioned = entries.filter((e) => !/unreleased/i.test(e.version));
  const stay = versioned.slice(0, keep), move = versioned.slice(keep);
  const result = { keep, kept: stay.map((e) => e.version), rotated: move.map((e) => e.version), archive: 'docs/CHANGELOG-ARCHIVE.md', dry_run: !!opts.dryRun };
  if (!move.length) return result;
  const trim = (s) => s.replace(/\s+$/, '') + '\n';
  const mainOut = trim(header) + '\n' + [...unreleased, ...stay].map((e) => trim(e.text)).join('\n') + '\n' + FOOTER(lang) + '\n';
  let archOut;
  if (fs.existsSync(archive)) { const a = parse(fs.readFileSync(archive, "utf8").replace(/\r\n?/g, "\n")); archOut = trim(a.header) + '\n' + [...move, ...a.entries].map((e) => trim(e.text)).join('\n'); }
  else archOut = ARCHIVE_HEADER(lang) + '\n' + move.map((e) => trim(e.text)).join('\n');
  if (!opts.dryRun) { fs.writeFileSync(main, mainOut); fs.writeFileSync(archive, archOut); }
  return result;
}

module.exports = { rotate, parse };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun changelog-rotate.js <project-root> [--keep 5] [--dry-run] [--json]'); process.exit(2); }
  try {
    const r = rotate(args[0], { keep: opt('--keep'), dryRun: args.includes('--dry-run') });
    if (args.includes('--json')) console.log(JSON.stringify(r, null, 1));
    else console.error(r.rotated.length ? `${r.dry_run ? 'Would rotate' : 'Rotated'} ${r.rotated.length} entr${r.rotated.length === 1 ? 'y' : 'ies'} to ${r.archive}: ${r.rotated.join(', ')} — kept ${r.kept.join(', ')}` : `Nothing to rotate — ${r.kept.length} versioned entr${r.kept.length === 1 ? 'y' : 'ies'}, keep ${r.keep}`);
  } catch (e) { console.error('changelog-rotate: ' + e.message); process.exit(2); }
}
