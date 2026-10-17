#!/usr/bin/env bun
// The BIAN landscape the open base may ship. BIAN publishes its semantic APIs under the Apache License 2.0
// (github.com/bian-official/public); the Service Landscape's role definitions and examples of use (bian.org) are © BIAN, all
// rights reserved. This keeps the taxonomy — every Business Area, Business Domain and Service Domain with its path, BIAN id and
// API file — and replaces each Service Domain's "What it does." with the one-line `info.description` of its published API
// (Apache 2.0); a Service Domain with no API keeps no description, and every "Example of use." is dropped. The full text stays
// with an organization's institution pack (docs/INSTITUTION_PACKS.md), which architecture-capability-alignment prefers when present.
//
// Usage: bun build-open-landscape.js <full landscape dir> <bian-official/public checkout> --out <dir>
const fs = require('fs');
const path = require('path');

const [full, repo] = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--out');
const out = process.argv[process.argv.indexOf('--out') + 1];
if (!full || !repo || !out || process.argv.indexOf('--out') < 0) { console.error('Usage: bun build-open-landscape.js <full landscape dir> <bian-official/public checkout> --out <dir>'); process.exit(2); }
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const release = (read(path.join(full, 'llms-bian.txt')).match(/Service Landscape v([\d.]+)/) || [])[1] || '14.0.0';
const yamlDir = fs.readdirSync(path.join(repo, 'release' + release, 'semantic-apis')).map((d) => path.join(repo, 'release' + release, 'semantic-apis', d, 'yamls')).find((d) => d.includes('oas3') && fs.existsSync(d));
if (!yamlDir) { console.error('no release' + release + '/semantic-apis/oas3*/yamls under ' + repo); process.exit(1); }

// info.description of each API file: a plain scalar, a quoted one, or a folded / literal block
function apiDescription(file) {
  const y = read(file), info = y.slice(y.indexOf('\ninfo:'));
  const m = info.match(/\n {2}description:[ \t]*(.*)\n((?: {4}.*\n)*)/); if (!m) return null;
  let v = m[1].trim();
  if (/^[>|][-+]?$/.test(v)) v = m[2].split('\n').map((l) => l.trim()).filter(Boolean).join(' ');
  else if (m[2]) v = (v + ' ' + m[2].split('\n').map((l) => l.trim()).filter(Boolean).join(' ')).trim();
  return v.replace(/^(['"])([\s\S]*)\1$/, '$2').replace(/''/g, "'").replace(/\s+/g, ' ').trim() || null;
}
const desc = {};
fs.readdirSync(yamlDir).filter((f) => f.endsWith('.yaml')).forEach((f) => { desc[f] = apiDescription(path.join(yamlDir, f)); });

fs.mkdirSync(out, { recursive: true });
let withApi = 0, without = 0, missing = [], empty = [];
const NOTE = 'Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API\'s own one-line description, from BIAN\'s semantic API repository (Apache License 2.0). The Service Landscape\'s role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).';
fs.readdirSync(full).filter((f) => /^BIAN-v14-\d.*\.md$/.test(f)).forEach((f) => {
  const lines = read(path.join(full, f)).split('\n'), res = [];
  let sd = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^Every entry below states its full path/.test(l)) { res.push(NOTE); continue; }
    if (/^Source: BIAN Service Landscape/.test(l)) { res.push('Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).'); continue; }
    if (/^###\s+Service Domain:/.test(l)) { sd = { at: res.length }; res.push(l); continue; }
    if (/^\*\*Example of use\.\*\*/.test(l)) { if (res[res.length - 1] === '') { /* keep one blank */ } continue; }
    if (/^\*\*What it does\.\*\*/.test(l)) {
      // the API line follows within the entry: find its file name
      let api = null; for (let j = i + 1; j < lines.length && !/^###?\s/.test(lines[j]); j++) { const m = lines[j].match(/Published as `([^`]+\.yaml)`/); if (m) { api = m[1]; break; } }
      if (api && desc[api]) { res.push('**What it does.** ' + desc[api]); withApi++; }
      else { if (api && !(api in desc)) missing.push(api); else if (api) empty.push(api); without++; if (res[res.length - 1] === '') res.pop(); }
      continue;
    }
    res.push(l);
  }
  fs.writeFileSync(path.join(out, f), res.join('\n').replace(/\n{3,}/g, '\n\n'));
});
// the index carries names, ids and links only; its provenance line changes
const idx = read(path.join(full, 'llms-bian.txt')).replace(/^Every name, identifier and description is as published by BIAN[^\n]*$/m,
  'Every name and identifier is as published by BIAN — the taxonomy only. Descriptions in the area files are the semantic APIs\' own (Apache License 2.0); the Service Landscape\'s role definitions are © BIAN and come with an institution pack.');
fs.writeFileSync(path.join(out, 'llms-bian.txt'), idx);
fs.copyFileSync(path.join(repo, 'LICENSE'), path.join(out, 'LICENSE-BIAN-APIS'));
console.log(`open landscape → ${out}: ${withApi} Service Domains described from their API, ${without} without a description${empty.length ? ', ' + empty.length + ' whose API BIAN publishes with an empty description (' + empty.join(' ') + ')' : ''}${missing.length ? ', ' + missing.length + ' API files not found: ' + missing.slice(0, 5).join(' ') : ''}`);
