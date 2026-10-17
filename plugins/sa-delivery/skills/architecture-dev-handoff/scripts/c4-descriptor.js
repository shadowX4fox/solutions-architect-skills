#!/usr/bin/env bun
// c4-descriptor.js — the C4 descriptor of a component, rendered by code (8.104.0).
//
//   bun c4-descriptor.js <project_root> [--components <slug,slug> | all] [--handoffs <dir>] [--lang en|es] [--write] [--json]
//
// The descriptor is the component's operational identity card for SRE, infrastructure and the CMDB: one table of
// facts and a link to its Component Specification, which carries everything else (responsibility, position,
// budgets, data ownership, ADRs). Through 8.103 a Haiku agent wrote it as a 4–9 KB page restating the
// specification in prose, and inferred what the docs did not say ("Operating System: Linux (AKS node)"), with ADR
// links at the wrong depth. Every value here is read from a structured source; a value with none is
// `[NOT DOCUMENTED — …]` naming the file and the row that would carry it, and is reported as a gap
// (`.cache/sa-skills/handoff-payloads/asset-gaps/<slug>.c4-descriptor.json`, the format kit-gaps-merge.js reads).
//
// Sources: the facts ledger (scripts/shared/arch-facts.js — name, index, type, internal name, component version, the
// Capacity table) and the component file's own metadata rows (`**Technology:**`, `**Owner:**`, `**Deploys as:**`,
// and in governed mode `**Capability:**` — its `CAP` code, `**Business Area:**` optional —, `**Lifecycle:**`). Governed mode — the SA Design
// Language Standard is bundled — adds the Model Identity rows: the codes are checked against BIAN_ALIGNMENT.md
// § Diagram ID Segments (closed registry; a project with one Business Domain gives its codes to every container),
// the CI class follows the altitude (a container is `cmdb_ci_sdlc_component`), `u_diagram_id` is the diagram
// register's and is never composed. Without `--write` it prints the descriptors.
'use strict';
const fs = require('fs');
const path = require('path');

const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-delivery reads the architecture through sa-skills
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));
const GOVERNED = !!require(fromSaSkills('scripts', 'shared', 'packs.js')).designLanguageDir();   // the folder in force — an institution pack's, else the base's own (scripts/shared/packs.js);  // optional: the Design Language Standard; absent, no Model Identity rows

const L = {
  en: { field: 'Field', value: 'Value', component: 'Component', type: 'Type', tech: 'Technology', versions: 'Versions', arch: 'architecture', comp: 'component', owner: 'Owner', runs: 'Runs on', capacity: 'Capacity', infra: 'Host · IP · OS · Domain', area: 'Business Area', cap: 'Capability', ci: 'CI class', life: 'Lifecycle', diag: '`u_diagram_id`', register: 'assigned by the diagram register', spec: 'Specification', specText: 'Component Specification', nd: 'NOT DOCUMENTED', add: 'add', to: 'to', replicas: 'replicas', perReplica: 'per replica', one: 'one of', run: 'run /sa-requirements:architecture-capability-alignment', blocks: { owner: 'escalation and CMDB ownership', version: 'release traceability of the component', runs: 'the platform team cannot place the workload', capacity: 'sizing and capacity planning', infra: 'CMDB registration and network rules', model: 'CMDB tagging under the design language', life: 'CMDB lifecycle state' } },
  es: { field: 'Campo', value: 'Valor', component: 'Componente', type: 'Tipo', tech: 'Tecnología', versions: 'Versiones', arch: 'arquitectura', comp: 'componente', owner: 'Responsable', runs: 'Se ejecuta en', capacity: 'Capacidad', infra: 'Host · IP · SO · Dominio', area: 'Business Area', cap: 'Capability', ci: 'CI class', life: 'Lifecycle', diag: '`u_diagram_id`', register: 'asignado por el registro de diagramas', spec: 'Especificación', specText: 'Especificación de Componente', nd: 'NO DOCUMENTADO', add: 'agregar', to: 'a', replicas: 'réplicas', perReplica: 'por réplica', one: 'uno de', run: 'ejecutar /sa-requirements:architecture-capability-alignment', blocks: { owner: 'escalamiento y propiedad en la CMDB', version: 'trazabilidad de versión del componente', runs: 'el equipo de plataforma no puede ubicar la carga', capacity: 'dimensionamiento y planificación de capacidad', infra: 'registro en la CMDB y reglas de red', model: 'etiquetado en la CMDB bajo el lenguaje de diseño', life: 'estado de ciclo de vida en la CMDB' } },
};

const plain = (s) => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim();
const cell = (s) => String(s).replace(/\|/g, '\\|');
const row = (src, labels) => { for (const l of labels) { const m = src.match(new RegExp(`^\\*\\*${l}\\s*:\\*\\*\\s*(.+)$`, 'im')); if (m && plain(m[1])) return plain(m[1]); } return null; };
// the bracketed list of `**Technology:**`, brackets balanced (link text nests them); prose after it is not technology
function technology(src) {
  const m = src.match(/^\*\*(?:Technology|Tecnolog[ií]a)\s*:\*\*\s*(.+)$/im); if (!m) return null;
  const t = m[1].trim(); if (!t.startsWith('[')) return plain(t);
  let depth = 0; for (let i = 0; i < t.length; i++) { if (t[i] === '[') depth++; else if (t[i] === ']' && --depth === 0) return plain(t.slice(1, i)); }
  return plain(t);
}
const fmtN = (n) => Number(n).toLocaleString('en-US');

// BIAN_ALIGNMENT.md § Diagram ID Segments → [{ dom, cap }]
function segments(root) {
  const f = path.join(root, 'BIAN_ALIGNMENT.md'); if (!fs.existsSync(f)) return null;
  const src = fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
  const at = src.search(/<!--\s*SECTION:\s*Diagram ID Segments\s*-->/); if (at < 0) return null;
  const body = src.slice(at).split('\n').slice(1); const out = [];
  for (const l of body) { if (/^#{1,3}\s/.test(l)) break; const m = l.match(/\|\s*`([A-Z]{3})`\s*\|[^|]*\|\s*`([A-Z]{4})`\s*\|/); if (m) out.push({ dom: m[1], cap: m[2] }); }
  return out;
}

function render(root, c, facts, lang, opts = {}) {
  const t = L[lang] || L.en, gaps = [], file = c.file;
  const src = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
  const nd = (where, field, blocks) => { gaps.push({ asset: 'c4-descriptor.md', field, where, impact: blocks }); return `[${t.nd} — ${where}]`; };
  const addRow = (rowLabel) => `${t.add} \`**${rowLabel}:**\` ${t.to} ${file}`;
  const nn = String(c.index || '').split('.').pop().padStart(2, '0');
  const rows = [];
  rows.push([t.component, `${c.index ? `${c.index} ` : ''}${c.name}${c.internal_name ? ` (\`${c.internal_name}\`)` : ''}`]);
  rows.push([t.type, `${c.type || nd(addRow('Type'), t.type, t.blocks.runs)} · C4 L2`]);
  rows.push([t.tech, technology(src) || nd(addRow('Technology'), t.tech, t.blocks.runs)]);
  const av = facts.architecture && facts.architecture.version;
  rows.push([t.versions, `${t.arch} ${av ? `v${av}` : nd(`ARCHITECTURE.md <!-- ARCHITECTURE_VERSION -->`, t.versions, t.blocks.version)} · ${t.comp} ${c.component_version ? `v${c.component_version}` : nd(addRow('Component Version'), `${t.comp} version`, t.blocks.version)}`]);
  rows.push([t.owner, row(src, ['Owner', 'Team Owner', 'Propietario', 'Responsable', 'Equipo']) || nd(addRow('Owner'), t.owner, t.blocks.owner)]);
  rows.push([t.runs, row(src, ['Deploys as', 'Se despliega como', 'Despliegue']) || nd(addRow('Deploys as'), t.runs, t.blocks.runs)]);
  const k = c.capacity; let capText = null;
  if (k) {
    const parts = [];
    if (k.replicas != null || k.max_replicas != null) parts.push(`${k.replicas != null ? fmtN(k.replicas) : '?'}${k.max_replicas != null && k.max_replicas !== k.replicas ? `–${fmtN(k.max_replicas)}` : ''} ${t.replicas}`);
    if (k.capacity_per_replica_rps != null) parts.push(`${fmtN(k.capacity_per_replica_rps)} rps ${t.perReplica}`);
    if (k.capacity_per_replica_sessions != null) parts.push(`${fmtN(k.capacity_per_replica_sessions)} sessions ${t.perReplica}`);
    if (parts.length) capText = parts.join(' · ');
  }
  rows.push([t.capacity, capText || nd(`${file} § Capacity <!-- LABEL: Capacity -->`, t.capacity, t.blocks.capacity)]);
  rows.push([t.infra, nd('docs/09-operational-considerations.md', t.infra, t.blocks.infra)]);
  if (opts.governed) {
    const segs = opts.segments, codes = (segs || []).map((s) => `${s.dom}/${s.cap}`);
    const area = row(src, ['Business Area']), cap = row(src, ['Capability']);
    const single = segs && segs.length === 1 ? segs[0] : null;
    // one decision, one row, one gap: the component's Business Domain, as its `DOM` · `CAP` pair from the alignment
    const seg = cap ? (segs || []).find((s) => s.cap === cap && (!area || s.dom === area)) : single;
    const how = segs === null ? t.run : `${addRow('Capability')} — ${t.one} ${codes.join(', ')}`;
    rows.push([`${t.area} · ${t.cap}`, seg ? `\`${seg.dom}\` · \`${seg.cap}\`` : nd(how, `${t.area} · ${t.cap}`, t.blocks.model)], [t.ci, '`cmdb_ci_sdlc_component`']);
    const life = row(src, ['Lifecycle', 'Ciclo de vida']);
    rows.push([t.life, life && /^(Future|Live|Deprecated|Removed)$/.test(life) ? `\`${life}\`` : nd(`${addRow('Lifecycle')} — Future | Live | Deprecated | Removed`, t.life, t.blocks.life)]);
    rows.push([t.diag, t.register]);
  }
  const md = `# ${c.name}

<!-- managed by sa-skills:architecture-dev-handoff — rendered by c4-descriptor.js from the architecture docs; fix a value there and re-run, never here -->

| ${t.field} | ${t.value} |
|---|---|
${rows.map(([a, b]) => `| ${a} | ${cell(b)} |`).join('\n')}

**${t.spec}**: [${t.specText}](../../components/${nn}-${c.slug}.md)
`;
  return { slug: c.slug, nn, md, gaps };
}

function run(root, opts = {}) {
  root = path.resolve(root);
  const facts = collect(root);
  const lang = opts.lang || (facts.architecture && facts.architecture.language) || 'en';
  const l2 = (facts.components || []).filter((c) => c.level === 'L2' && c.file_backed !== false);
  const want = !opts.components || opts.components === 'all' ? null : new Set(String(opts.components).split(',').map((s) => s.trim()).filter(Boolean));
  const picked = want ? l2.filter((c) => want.has(c.slug)) : l2;
  const unknown = want ? [...want].filter((s) => !l2.some((c) => c.slug === s)) : [];
  const governed = opts.governed !== undefined ? opts.governed : GOVERNED;
  const segs = governed ? segments(root) : null;
  const out = picked.map((c) => render(root, c, facts, lang, { governed, segments: segs }));
  if (opts.write) {
    const hd = path.resolve(root, opts.handoffs || 'handoffs'), gd = path.join(root, '.cache', 'sa-skills', 'handoff-payloads', 'asset-gaps');
    fs.mkdirSync(gd, { recursive: true });
    out.forEach((d) => {
      const dir = path.join(hd, 'assets', `${d.nn}-${d.slug}`); fs.mkdirSync(dir, { recursive: true });
      d.path = path.join(dir, 'c4-descriptor.md'); fs.writeFileSync(d.path, d.md);
      d.gaps_path = path.join(gd, `${d.slug}.c4-descriptor.json`); fs.writeFileSync(d.gaps_path, JSON.stringify({ gaps: d.gaps }, null, 1) + '\n');
    });
  }
  return { lang, governed, unknown, descriptors: out };
}

module.exports = { run, render, technology, segments };

if (require.main === module) {
  const a = process.argv.slice(2), val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const flagged = new Set(['--components', '--handoffs', '--lang'].flatMap((k) => { const i = a.indexOf(k); return i >= 0 ? [i + 1] : []; }));
  const root = a.find((x, i) => !x.startsWith('--') && !flagged.has(i));
  if (!root || !fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) { console.error('Usage: bun c4-descriptor.js <project_root> [--components <slug,slug> | all] [--handoffs <dir>] [--lang en|es] [--write] [--json]'); process.exit(2); }
  const r = run(root, { components: val('--components'), handoffs: val('--handoffs'), lang: val('--lang'), write: a.includes('--write') });
  if (a.includes('--json')) console.log(JSON.stringify({ lang: r.lang, governed: r.governed, unknown: r.unknown, descriptors: r.descriptors.map((d) => ({ slug: d.slug, path: d.path || null, gaps: d.gaps.length, gaps_path: d.gaps_path || null })) }, null, 1));
  else if (a.includes('--write')) { r.descriptors.forEach((d) => console.log(`${path.relative(process.cwd(), d.path)} — ${d.md.length} bytes, ${d.gaps.length} gap(s)`)); console.log(`${r.descriptors.length} descriptor(s) · ${r.lang} · ${r.governed ? 'governed' : 'fallback'}`); }
  else r.descriptors.forEach((d) => console.log(d.md));
  if (r.unknown.length) { console.error(`c4-descriptor: no C4 L2 component with slug ${r.unknown.join(', ')}`); process.exit(1); }
}
