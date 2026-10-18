#!/usr/bin/env node
// principle-stamp.js — the Layer 2 review stamp of the principles file: `<!-- PRINCIPLE_REVIEW: <layer2> <date>
// sha256:<12 hex> -->`, its last line. The hash covers the file without the stamp line, CRLF normalized, trailing
// whitespace trimmed, so any later edit of the principles voids it and the release (`lifecycle.js check`) blocks.
//
// Two writers: `principle-check.js --stamp-review` after the review, and `adr-link.js` — which turns `ADR Candidate N`
// into `[ADR-NNN](…)` after the ADRs exist, a citation the review already read under its candidate number. A file
// whose stamp was current before that relink keeps its review (`restamp`); a stale one stays stale.
// sa-records ships it so adr-link.js can reach it; sa-skills reaches it through plugins/ in its own root.
'use strict';
const fs = require('fs');
const crypto = require('crypto');

const STAMP_RE = /^<!--\s*PRINCIPLE_REVIEW:\s*(\w+)\s+(\d{4}-\d{2}-\d{2})\s+sha256:([0-9a-f]{12})\s*-->\s*$/m;
const unstamped = (src) => src.replace(/\r\n?/g, '\n').split('\n').filter((l) => !/^<!--\s*PRINCIPLE_REVIEW:/.test(l)).join('\n').replace(/\s+$/, '');
const principlesHash = (src) => crypto.createHash('sha256').update(unstamped(src)).digest('hex').slice(0, 12);
// { state: unstamped | current | stale, layer2, date, hash } of a file's text
function reviewOf(src) {
  const m = src.match(STAMP_RE);
  if (!m) return { state: 'unstamped' };
  return { state: m[3] === principlesHash(src) ? 'current' : 'stale', layer2: m[1], date: m[2], hash: m[3] };
}
// the text with its stamp replaced by one over its own content
const stamped = (src, layer2, date) => { const body = unstamped(src); return `${body}\n\n<!-- PRINCIPLE_REVIEW: ${layer2} ${date} sha256:${principlesHash(body)} -->\n`; };
// `after` keeps the review `before` carried, when it was current: the same outcome and date over the new text
function restamp(before, after) {
  const r = reviewOf(before);
  return r.state === 'current' ? stamped(after, r.layer2, r.date) : after;
}
function readReview(file) { return fs.existsSync(file) ? reviewOf(fs.readFileSync(file, 'utf8')) : { state: 'missing-file' }; }
function stampReview(file, layer2, today) { fs.writeFileSync(file, stamped(fs.readFileSync(file, 'utf8'), layer2, today)); }

module.exports = { STAMP_RE, unstamped, principlesHash, reviewOf, stamped, restamp, readReview, stampReview };
