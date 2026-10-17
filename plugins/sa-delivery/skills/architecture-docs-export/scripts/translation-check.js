#!/usr/bin/env bun
// translation-check.js — hold a translated export to its source, part by part.
//
//   bun translation-check.js <parts-dir> <translated-parts-dir> --from <es|en> --to <es|en> [--json]
//
// A translation changes the words and nothing else. For every part of the source directory the
// translated directory must hold the same file, and the two must agree on everything a translation
// never touches: the headings and their anchors, every table row, every fence and Mermaid block,
// every identifier (ADR / TDR / UC / I-nn / F-nn), every link target, and every number's value.
// Numbers take the target language's separators (LANGUAGE_POLICY §5.10: `es` 4.000.000 / 0,1 ↔ `en`
// 4,000,000 / 0.1), so each is read in its own language's convention and compared by value; a token
// that is not a quantity in that convention (7.1.0, § 11.3) is compared as written. Inline code spans are
// compared too, as warnings only: most carry a name, a filename or a code that never localizes, but
// a section citation, a formula or a placeholder in backticks is text the translation must carry
// over. The check exists because the translator is a model: on the reference project one run of the
// same prompt kept every row and the next dropped the one row whose first cell was a sentence, taking
// ADR-134 and I-25 with it. Exit 1 on any blocking difference.
'use strict';
const fs = require('fs');
const path = require('path');

const WARN_ONLY = new Set(['code']);
// A quantity in each language's convention: thousands grouped in threes, and/or a decimal part.
const NUMBER = {
  es: { re: /^(?:\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+)$/, group: /\./g, dec: ',' },
  en: { re: /^(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+)$/, group: /,/g, dec: '.' },
};
/** A number token as its value when it is a quantity in `lang`'s convention, else as written. */
function valueOf(tok, lang) {
  const c = NUMBER[lang];
  if (!c || !c.re.test(tok)) return tok;
  return tok.replace(c.group, '').replace(c.dec, '.');   // digits kept exactly — `2.0` stays `2.0`, never `2`
}
const stripFences = (t) => t.replace(/^```[\s\S]*?^```/gm, '');
const multiset = (arr) => arr.reduce((m, x) => (m.set(x, (m.get(x) || 0) + 1), m), new Map());
function diffMulti(a, b) {
  const ma = multiset(a), mb = multiset(b), missing = [], extra = [];
  for (const [k, n] of ma) for (let i = (mb.get(k) || 0); i < n; i++) missing.push(k);
  for (const [k, n] of mb) for (let i = (ma.get(k) || 0); i < n; i++) extra.push(k);
  return { missing, extra };
}

/** What a translation must leave as it found it. */
function invariants(text, lang) {
  const t = text.replace(/\r\n?/g, '\n'), lines = t.split('\n');
  const prose = stripFences(t);
  return {
    headings: lines.filter((l) => /^#{1,6} /.test(l)).map((l) => l.match(/^#+/)[0]),
    anchors: (t.match(/<!-- (?:SECTION|LABEL|PRINCIPLE): [^>]*-->/g) || []),
    table_rows: [String(lines.filter((l) => /^\s*\|/.test(l)).length)],
    fences: lines.filter((l) => /^```/.test(l)).map((l) => l.trim()),
    ids: (t.match(/\b(?:ADR|TDR|UC|I|F)-\d{1,3}\b/g) || []),
    code: (prose.match(/`[^`\n]+`/g) || []),
    links: (prose.match(/\]\(([^)\s]+)\)/g) || []),
    numbers: (prose.replace(/`[^`\n]+`/g, '').replace(/\b(?:ADR|TDR|UC|I|F)-\d{1,3}\b/g, '').match(/\d[\d.,]*\d|\d/g) || []).map((n) => valueOf(n, lang)),
  };
}

function check(srcDir, dstDir, from, to) {
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.md')).sort();
  const results = [];
  for (const f of files) {
    const dst = path.join(dstDir, f);
    if (!fs.existsSync(dst)) { results.push({ file: f, ok: false, problems: ['not translated (file missing)'] }); continue; }
    const a = invariants(fs.readFileSync(path.join(srcDir, f), 'utf8'), from), b = invariants(fs.readFileSync(dst, 'utf8'), to);
    const problems = [], warnings = [];
    for (const k of Object.keys(a)) {
      const { missing, extra } = diffMulti(a[k], b[k]);
      if (!missing.length && !extra.length) continue;
      if (k === 'table_rows') { problems.push(`table rows ${a[k][0]} → ${b[k][0]}`); continue; }
      const show = (xs) => xs.slice(0, 6).join(' ') + (xs.length > 6 ? ` … (+${xs.length - 6})` : '');
      (WARN_ONLY.has(k) ? warnings : problems).push(`${k}:${missing.length ? ` missing ${show(missing)}` : ''}${extra.length ? ` extra ${show(extra)}` : ''}`);
    }
    results.push({ file: f, ok: !problems.length, problems, warnings });
  }
  const extra = fs.existsSync(dstDir) ? fs.readdirSync(dstDir).filter((f) => f.endsWith('.md') && !files.includes(f)) : [];
  extra.forEach((f) => results.push({ file: f, ok: false, problems: ['no source part of that name'] }));
  return { ok: results.every((r) => r.ok), results };
}

module.exports = { check, invariants, valueOf };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const [src, dst] = args.filter((a, i) => !a.startsWith('--') && !['--from', '--to'].includes(args[i - 1]));
  const from = opt('--from'), to = opt('--to');
  if (!src || !dst || !NUMBER[from] || !NUMBER[to]) { console.error('Usage: bun translation-check.js <parts-dir> <translated-parts-dir> --from <es|en> --to <es|en> [--json]'); process.exit(2); }
  const r = check(src, dst, from, to);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else {
    for (const x of r.results) {
      console.log(`${x.ok ? '✓' : '✗'} ${x.file}${x.ok ? '' : ' — ' + x.problems.join('; ')}`);
      if (x.warnings && x.warnings.length) console.log(`    ⚠ ${x.warnings.join('; ')} — confirm each is a translated citation or placeholder, not a renamed component`);
    }
    console.log(r.ok ? `translation holds its source: ${r.results.length} part(s)` : `translation differs from its source in ${r.results.filter((x) => !x.ok).length} part(s) — re-translate each ✗ part from its source, then run the check again`);
  }
  process.exit(r.ok ? 0 : 1);
}
