#!/usr/bin/env bun
// Architecture types: the reference models Workflow 1 offers at type selection, each four Markdown files the Section 4 and
// Section 5 writers read (section-prepare.js) and, for the principle gate, the phrases each principle must name
// (principle-check.js P-TYPE-MATRIX-01). The base ships five built-in types; an institution pack adds its own under
// `provides.architectureTypes` — one folder per type holding `type.json` and its four files:
//
//   { "id": "ACME", "name": "ACME 6-layer model", "summary": "one line for the selection menu",
//     "files": { "section4": "SECTION_4_ACME.md", "section5": "SECTION_5_ACME.md", "reference": "ACME-ARCHITECTURE.md", "c4": "ACME-TO-C4-TRANSLATION.md" },
//     "matrix": { "1": ["channel layer", "capa de canal"], "9": ["OpenAPI"] } }
//
// `section5` may be null (the type has no Section 5 template). A pack type with a built-in's id replaces it (project → pack →
// base). The default type is the first pack's `defaults.architectureType` that names a type found, else ENTERPRISE.
//
//   bun arch-types.js [--project <dir>] [--json]      the types available here, the default marked
'use strict';
const fs = require('fs');
const path = require('path');

const SKILL = path.join(__dirname, '..', '..', 'skills', 'architecture-docs');
const T = (f) => (f ? path.join(SKILL, 'templates', f) : null), R = (f) => path.join(SKILL, 'references', f);
const BUILTIN = {
  ENTERPRISE: { name: 'Enterprise (5 layers)', summary: 'Channels, Experience, Process, Domain Services, Systems of Record — the domain-neutral default for an enterprise platform',
    files: { section4: T('SECTION_4_ENTERPRISE.md'), section5: T('SECTION_5_ENTERPRISE.md'), reference: R('ENTERPRISE-ARCHITECTURE.md'), c4: R('ENTERPRISE-TO-C4-TRANSLATION.md') } },
  MICROSERVICES: { name: 'Microservices', summary: 'Independently deployable services, each owning its data, behind a gateway and an event backbone',
    files: { section4: T('SECTION_4_MICROSERVICES.md'), section5: T('SECTION_5_MICROSERVICES.md'), reference: R('MICROSERVICES-ARCHITECTURE.md'), c4: R('MICROSERVICES-TO-C4-TRANSLATION.md') } },
  '3-TIER': { name: '3-Tier', summary: 'Presentation, application and data tiers — a web application with one database',
    files: { section4: T('SECTION_4_3TIER.md'), section5: T('SECTION_5_3TIER.md'), reference: R('3-TIER-ARCHITECTURE.md'), c4: R('3-TIER-TO-C4-TRANSLATION.md') } },
  'N-LAYER': { name: 'N-Layer', summary: 'Domain, application and infrastructure layers inside one deployable (clean / hexagonal)',
    files: { section4: T('SECTION_4_NLAYER_PATTERNS.md'), section5: null, reference: R('N-LAYER-ARCHITECTURE.md'), c4: R('N-LAYER-TO-C4-TRANSLATION.md') } },
  BIAN: { name: 'BIAN', summary: 'Banking services modelled on BIAN v14 Service Domains, control records and service operations',
    files: { section4: T('SECTION_4_BIAN.md'), section5: T('SECTION_5_BIAN.md'), reference: R('BIAN-ARCHITECTURE.md'), c4: R('BIAN-TO-C4-TRANSLATION.md') } },
};
const DEFAULT = 'ENTERPRISE';
const ALIAS = { '3TIER': '3-TIER', NLAYER: 'N-LAYER' };

const packs = () => require('./packs.js');
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };

// every type available here: { id → { id, name, summary, source, files: { section4, section5, reference, c4 } (absolute), matrix } }
function types(opts = {}) {
  const out = {}, warnings = [];
  Object.entries(BUILTIN).forEach(([id, t]) => { out[id] = Object.assign({ id, source: 'base', matrix: null }, t); });
  let dirs = [];
  try { dirs = packs().typeDirs(opts); } catch (e) { dirs = []; }
  dirs.forEach(({ name, dir }) => {
    fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).forEach((d) => {
      const folder = path.join(dir, d.name), m = readJson(path.join(folder, 'type.json'));
      if (!m || !m.id || !m.files) { warnings.push(`${name}: ${path.join(d.name, 'type.json')} needs "id" and "files" — skipped`); return; }
      const id = String(m.id).toUpperCase();
      const files = {}; let bad = null;
      ['section4', 'section5', 'reference', 'c4'].forEach((k) => { const f = m.files[k]; if (f == null) { files[k] = null; if (k !== 'section5') bad = bad || k; return; } const p = path.join(folder, f); if (!fs.existsSync(p)) bad = bad || `${k} (${f})`; files[k] = p; });
      if (bad) { warnings.push(`${name}: type ${id} is missing ${bad} — skipped`); return; }
      if (out[id] && out[id].source !== 'base') { warnings.push(`type ${id}: provided by ${out[id].source} and ${name} — ${out[id].source} is used`); return; }
      if (out[id]) warnings.push(`type ${id}: ${name} replaces the base's`);
      out[id] = { id, name: m.name || id, summary: m.summary || '', source: name, files, matrix: m.matrix || null };
    });
  });
  return { types: out, warnings };
}
const ids = (opts) => Object.keys(types(opts).types);
// the type the selection offers first: a pack's default when it names a type found here, else ENTERPRISE
function defaultType(opts = {}) {
  const t = types(opts).types; let d = null;
  try { d = String(packs().defaults(opts).architectureType || '').toUpperCase() || null; } catch (e) { d = null; }
  return d && t[d] ? d : DEFAULT;
}
// a type id from what a user, a marker or a record wrote — `3tier`, `n layer`, `Enterprise` — or null when none matches
function normType(v, opts = {}) {
  const k = String(v || '').trim().toUpperCase().replace(/\s+/g, '-'), key = ALIAS[k.replace(/-/g, '')] || k;
  return types(opts).types[key] ? key : null;
}

module.exports = { BUILTIN, DEFAULT, types, ids, defaultType, normType };

if (require.main === module) {
  const a = process.argv.slice(2), i = a.indexOf('--project'), opts = { project: i >= 0 ? a[i + 1] : undefined };
  const { types: t, warnings } = types(opts), d = defaultType(opts);
  if (a.includes('--json')) { console.log(JSON.stringify({ default: d, types: Object.values(t).map((x) => ({ id: x.id, name: x.name, summary: x.summary, source: x.source })), warnings }, null, 2)); process.exit(0); }
  const list = [t[d]].concat(Object.values(t).filter((x) => x.id !== d));
  list.forEach((x, n) => console.log(`${n + 1}. ${x.id}${x.id === d ? ' (default)' : ''} — ${x.name}: ${x.summary}${x.source !== 'base' ? ` [${x.source}]` : ''}`));
  warnings.forEach((w) => console.error('⚠ ' + w));
}
