#!/usr/bin/env node
// adr-link.js — once the ADRs exist, the documents' candidate citations become links, by code.
//
//   bun adr-link.js <project-root> [--write]
//
// A create writes its sections before the ADRs have ids, so a section cites the decision it resolves as
// `ADR Candidate N` (or `ADR Candidates N y M`, `candidatos N y M`). On the 8.90.0 control run the session replaced
// them afterwards as a Workflow 2 edit — plan mode, a second load of the architecture-docs skill, 15 calls at
// ~350K context. The mapping is on disk (`.cache/sa-skills/adr-ids.json`, written by adr-prepare.js), so this:
//
//   - replaces every citation of a mapped candidate in docs/**/*.md with `[ADR-NNN](<relative path>)`; a citation
//     naming an unmapped candidate is left as it is and reported
//   - adds the ids a file now cites to its EXPLORER_HEADER `related_adrs`
//   - marks each mapped candidate's line of `.cache/sa-skills/adr-context.md` with its id
//
// Without --write it prints what it would change.
'use strict';
const fs = require('fs');
const path = require('path');
const { CITE, docFiles, loadIds } = require(path.join(__dirname, 'adr-prepare.js'));

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');

function link(root, opts = {}) {
  root = path.resolve(root);
  const ids = loadIds(root);
  const changes = [], unmapped = new Set();
  for (const f of docFiles(root)) {
    const abs = path.join(root, f), src = read(abs);
    const rel = (file) => path.relative(path.dirname(abs), path.join(root, file)).replace(/\\/g, '/');
    let n = 0;
    let out = src.replace(new RegExp(CITE.source, 'g'), (whole, list) => {
      const nums = list.match(/\d+/g);
      if (!nums.every((x) => ids[x])) { nums.filter((x) => !ids[x]).forEach((x) => unmapped.add(Number(x))); return whole; }
      n += nums.length;
      return list.replace(/\[?(\d+)\]?/g, (_, x) => `[${ids[x].id}](${rel(ids[x].file)})`);
    });
    if (!n) continue;
    // the ids the body now cites, into the header's related_adrs
    const hm = out.match(/<!-- EXPLORER_HEADER\n([\s\S]*?)-->/);
    if (hm) {
      const body = out.slice(hm.index + hm[0].length);
      const cited = new Set(body.match(/ADR-\d{3}/g) || []);
      const rm = hm[1].match(/^related_adrs:\s*(.*)$/m);
      const cur = new Set(rm ? rm[1].split(',').map((x) => x.trim()).filter(Boolean) : []);
      const merged = [...new Set([...cur, ...cited])].sort();
      const header = rm ? hm[1].replace(/^related_adrs:.*$/m, `related_adrs: ${merged.join(', ')}`) : hm[1] + `related_adrs: ${merged.join(', ')}\n`;
      out = out.replace(hm[1], header);
    }
    changes.push({ file: f, links: n });
    if (opts.write) fs.writeFileSync(abs, out);
  }
  // the Context Block: each mapped candidate carries its id
  const ctx = path.join(root, '.cache', 'sa-skills', 'adr-context.md');
  let marked = 0;
  if (fs.existsSync(ctx)) {
    const lines = read(ctx).split('\n').map((l) => {
      const m = l.match(/^\s*\[(?:Candidate\s+)?(\d+)\]/i); if (!m || !ids[m[1]] || l.includes(ids[m[1]].id)) return l;
      marked++;
      return l.replace(/Status:\s*PENDING\b/i, `Status: DECIDED — ${ids[m[1]].id}`).replace(/$/, l.match(/Status:\s*PENDING\b/i) ? '' : ` → ${ids[m[1]].id}`);
    });
    if (opts.write) fs.writeFileSync(ctx, lines.join('\n'));
  }
  return { changes, unmapped: [...unmapped].sort((a, b) => a - b), marked };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun adr-link.js <project-root> [--write]'); process.exit(2); }
  const r = link(args[0], { write: args.includes('--write') });
  console.log(`ADR_LINK ${args.includes('--write') ? 'written' : 'dry run'}: ${r.changes.reduce((n, c) => n + c.links, 0)} citation(s) linked in ${r.changes.length} file(s); ${r.marked} candidate line(s) marked in adr-context.md`);
  for (const c of r.changes) console.log(`  ${c.file}: ${c.links}`);
  if (r.unmapped.length) console.log(`  not linked — candidates with no ADR: ${r.unmapped.join(', ')}`);
}

module.exports = { link };
