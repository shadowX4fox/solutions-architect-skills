#!/usr/bin/env bun
'use strict';
// The cross-industry capability map the plugin bundles beside BIAN, in the same corpus shape. Source: Turbo EA Capabilities
// (github.com/vincentmakes/turbo-ea-capabilities) — its catalogue content is CC BY 4.0 (credit "Turbo EA Capabilities by
// Vincent Verdet — Turbo EA, https://github.com/vincentmakes/turbo-ea-capabilities, CC BY 4.0", indicate changes, retain
// NOTICE), its tooling MIT. Only the Cross-Industry layer is kept: the macro capabilities of catalogue/_macro-capabilities.yaml
// become Domains (one XI-<n>-<slug>.md each, in the catalogue's order), their L1s Capability Groups, the L1s' L2s Capabilities,
// and the L3 names under an L2 one **Includes.** line. Every name, id and description is the catalogue's own, whitespace
// normalised; a node without a description gets no description line. Writes llms-xi.txt (the index), framework.json, the
// licence (LICENSE-TURBO-EA, verbatim) and NOTICE (the project's, plus the commit bundled and the change made). The YAML is read
// with Bun's built-in parser (Bun.YAML) — no npm dependency; the repository commits no JSON build output.
//
// Usage: bun build-turbo-ea-corpus.js <turbo-ea checkout> --out <dir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const oi = process.argv.indexOf('--out');
const repo = process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--out');
const out = oi > 0 ? process.argv[oi + 1] : null;
if (!repo || !out) { console.error('Usage: bun build-turbo-ea-corpus.js <turbo-ea checkout> --out <dir>'); process.exit(2); }
if (typeof Bun === 'undefined' || !Bun.YAML) { console.error('Bun with Bun.YAML (1.2.21+) is required'); process.exit(2); }

const SOURCE_URL = 'https://github.com/vincentmakes/turbo-ea-capabilities';
const ATTRIBUTION = 'Turbo EA Capabilities by Vincent Verdet — Turbo EA, https://github.com/vincentmakes/turbo-ea-capabilities, CC BY 4.0';
const INDUSTRY = 'Cross-Industry';
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const yaml = (f) => Bun.YAML.parse(read(f));
const one = (s) => (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
const slug = (s) => one(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const list = (a) => a.join('; '); // names carry commas ("Quality, Innovation & Knowledge")
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

let commit;
try { commit = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { console.error('not a git checkout: ' + repo); process.exit(1); }
const cat = path.join(repo, 'catalogue');

// ── read: macros in order, each L1 by id, the L1 tree as the catalogue gives it ──
const macros = (yaml(path.join(cat, '_macro-capabilities.yaml')).macros || []).filter((m) => m.industry === INDUSTRY);
const l1ById = {};
(yaml(path.join(cat, '_index.yaml')).files || []).forEach((f) => { const n = yaml(path.join(cat, f)); if (n && n.industry === INDUSTRY) l1ById[n.id] = { ...n, file: f }; });
const placed = new Set();
const problems = [];
const domains = macros.map((m, i) => {
  const groups = (m.capability_ids || []).map((id) => {
    const l1 = l1ById[id]; if (!l1) { problems.push(`${m.id} names ${id}, which is not a Cross-Industry L1`); return null; }
    placed.add(id);
    return l1;
  }).filter(Boolean);
  return { n: i + 1, id: m.id, name: one(m.name), description: one(m.description), groups };
});
Object.keys(l1ById).filter((id) => !placed.has(id)).forEach((id) => problems.push(`Cross-Industry L1 ${id} belongs to no macro`));
if (problems.length) { problems.forEach((p) => console.error(p)); process.exit(1); }

// ── write ──
fs.mkdirSync(out, { recursive: true });
fs.readdirSync(out).filter((f) => /^XI-\d+-.*\.md$/.test(f)).forEach((f) => fs.unlinkSync(path.join(out, f)));
const kids = (n) => (Array.isArray(n.children) ? n.children : []);
let nGroups = 0, nCaps = 0, nIncluded = 0;
const undescribed = { domain: [], group: [], capability: [], included: [] };
const PROVENANCE = `Source: Turbo EA Capabilities (${SOURCE_URL}), commit \`${commit}\`, Cross-Industry layer — CC BY 4.0. ${ATTRIBUTION}. Converted from the catalogue's YAML to this Markdown shape; names, ids and descriptions are unchanged (whitespace normalised).`;
const allNames = domains.map((d) => d.name);
const indexAreas = [], indexGroups = [], indexCaps = [];

domains.forEach((d) => {
  d.file = `XI-${d.n}-${slug(d.name)}.md`;
  if (!d.description) undescribed.domain.push(d.id);
  const caps = d.groups.reduce((s, g) => s + kids(g).length, 0);
  const L = [];
  L.push(`# Cross-Industry Capability Map — Domain: ${d.name}`, '');
  L.push(`This document covers **one** of the ${domains.length} cross-industry Domains: **${d.name}** (id \`${d.id}\`). It contains ${plural(d.groups.length, 'Capability Group', 'Capability Groups')} and ${plural(caps, 'Capability', 'Capabilities')}.`, '');
  if (d.description) L.push(d.description, '');
  L.push(`The ${domains.length} Domains are: ${list(allNames)}. Capabilities belonging to the other ${domains.length - 1} Domains are documented in their own files.`, '');
  L.push('Each Capability below states its path, catalogue id, **What it does.** (the catalogue\'s own description) and, where the catalogue decomposes it further, the names of the capabilities it **Includes.**', '');
  L.push(PROVENANCE, '', '---', '');
  d.groups.forEach((g) => {
    nGroups++;
    const gname = one(g.name), gdesc = one(g.description), l2s = kids(g);
    if (!gdesc) undescribed.group.push(g.id);
    L.push(`## Capability Group: ${gname}`, '');
    L.push(`\`${g.id}\` — part of the ${d.name} Domain. Contains ${plural(l2s.length, 'Capability', 'Capabilities')}: ${l2s.map((c) => one(c.name)).join(', ')}.`, '');
    if (gdesc) L.push(gdesc, '');
    indexGroups.push(`- [${gname}](${d.file}#capability-group-${slug(gname)}): ${d.name} · \`${g.id}\` · ${plural(l2s.length, 'Capability', 'Capabilities')}: ${l2s.map((c) => one(c.name)).join('; ')}.`);
    l2s.forEach((c) => {
      nCaps++;
      const cname = one(c.name), cdesc = one(c.description), l3 = kids(c);
      if (!cdesc) undescribed.capability.push(c.id);
      const walk = (n) => kids(n).forEach((k) => { nIncluded++; if (!one(k.description)) undescribed.included.push(k.id); walk(k); });
      walk(c);
      L.push(`### Capability: ${cname}`, '');
      L.push(`**Path:** ${d.name} › ${gname} › ${cname}  `, `**Id:** \`${c.id}\`  `, `**Domain:** ${d.name}  `, `**Capability Group:** ${gname}`, '');
      if (cdesc) L.push(`**What it does.** ${cdesc}`, '');
      if (l3.length) L.push(`**Includes.** ${l3.map((k) => one(k.name)).join(' · ')}`, '');
      indexCaps.push(`- [${cname}](${d.file}#capability-${slug(cname)}): ${d.name} > ${gname} · \`${c.id}\``);
    });
  });
  fs.writeFileSync(path.join(out, d.file), L.join('\n').replace(/\n+$/, '\n'));
  indexAreas.push(`- [${d.name}](${d.file}): id \`${d.id}\` · ${plural(d.groups.length, 'Capability Group', 'Capability Groups')} · ${plural(caps, 'Capability', 'Capabilities')}. Capability Groups: ${d.groups.map((g) => one(g.name)).join('; ')}.`);
});

const X = [];
X.push('# Cross-Industry Capability Map', '');
X.push(`> Complete index of the ${nCaps} cross-industry Capabilities of Turbo EA Capabilities, arranged under ${nGroups} Capability Groups and ${domains.length} Domains. This file is the index: use it to answer questions that need a *complete* answer — every Capability in a Domain or Capability Group, or where a named Capability sits in the hierarchy. Descriptions and the finer capabilities each one includes live in the ${domains.length} per-Domain files linked below.`, '');
X.push('The map organises business capability that any enterprise has, whatever its industry, as a three-level chain: a Domain (the catalogue\'s macro capability, an executive grouping) contains Capability Groups (its L1 capabilities), which contain Capabilities (L2). A Capability is the unit an initiative is aligned to; the L3 capabilities beneath it are listed by name on its **Includes.** line.', '');
X.push(`Counts: ${domains.length} Domains, ${nGroups} Capability Groups, ${nCaps} Capabilities, ${nIncluded} included (L3) capabilities.`, '');
X.push('Entry format in the Capabilities section below: `[Capability](file#anchor): Domain > Capability Group · catalogue id`.', '');
X.push(`Every name, id and description is as published by Turbo EA Capabilities at commit \`${commit}\`, converted from YAML to Markdown. Licence: CC BY 4.0 (LICENSE-TURBO-EA); attribution and third-party notices in NOTICE. Credit: ${ATTRIBUTION}.`, '');
X.push('## Domains', '', ...indexAreas, '');
X.push('## Capability Groups', '', 'Each entry lists its complete set of Capabilities.', '', ...indexGroups, '');
X.push('## Capabilities', '', ...indexCaps, '');
X.push('## Optional', '', `- [Turbo EA Capabilities](${SOURCE_URL}): the source catalogue — capability YAML under \`catalogue/\`, the industry-specific capability maps, value streams and business processes not bundled here.`, '');
fs.writeFileSync(path.join(out, 'llms-xi.txt'), X.join('\n').replace(/\n+$/, '\n'));

const framework = {
  id: 'CROSS-INDUSTRY', name: 'Cross-Industry Capability Map', industry: 'cross-industry', source: 'Turbo EA Capabilities', source_url: SOURCE_URL, commit,
  license: 'CC BY 4.0', attribution: ATTRIBUTION, index: 'llms-xi.txt', files: '^XI-\\d+-.*\\.md$',
  levels: { area: 'Domain', domain: 'Capability Group', unit: 'Capability' }, headings: { area: 'Domain', domain: 'Capability Group', unit: 'Capability' },
  id_label: 'Id', noun: 'business', report: 'CAPABILITY_ALIGNMENT.md', counts: { areas: domains.length, domains: nGroups, units: nCaps },
};
fs.writeFileSync(path.join(out, 'framework.json'), JSON.stringify(framework, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'LICENSE-TURBO-EA'), read(path.join(repo, 'LICENSE')));
const notice = read(path.join(repo, 'NOTICE')).replace(/\n+$/, '\n');
fs.writeFileSync(path.join(out, 'NOTICE'), [
  notice,
  '================================================================================',
  'This bundle',
  '================================================================================',
  '',
  `Bundled from ${SOURCE_URL} at commit ${commit}: the Cross-Industry`,
  'layer of the capability catalogue only (catalogue/_macro-capabilities.yaml and the',
  'Cross-Industry L1 files). Changes made: the YAML was converted to Markdown (one file',
  'per macro capability, an index llms-xi.txt and framework.json); macro capabilities are',
  'titled "Domain", L1 "Capability Group", L2 "Capability", and L3 capabilities are listed',
  'by name only. Names, ids and descriptions are unchanged apart from whitespace. Value',
  'streams, business processes, industry-specific capabilities and translations are not',
  'included. Converted by build-turbo-ea-corpus.js (sa-requirements).',
  '',
].join('\n'));

const nUnd = Object.values(undescribed).reduce((s, a) => s + a.length, 0);
console.log(JSON.stringify({ commit, out, counts: { areas: domains.length, domains: nGroups, units: nCaps, included: nIncluded }, undescribed: Object.fromEntries(Object.entries(undescribed).map(([k, v]) => [k, v.length])), undescribed_total: nUnd }, null, 2));
