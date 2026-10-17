#!/usr/bin/env bun
// kit-readme.js — `handoffs/README.md`, the kit's managed index, rendered by code (Step 6.2).
//
//   bun kit-readme.js <project_root> [--date YYYY-MM-DD] [--handoffs <dir>] [--json]
//
// Reads `handoffs/.manifest.json` (what exists and when it was generated), the facts ledger (the
// project name, the language, the canonical component names) and the payload builder's
// `context-result.json` (the edge endpoints' names). Writes the index in the document language:
// the shared documents, the reading order by role, the interface contracts with their ADRs, the
// Component Specifications with `Ready` / `Outdated` (the descriptor is newer than the
// specification) and their assets, the related documentation. Idempotent — run after every kit.
'use strict';
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-delivery reads the architecture through sa-skills
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));

const T = {
  en: { title: (p) => `Service Handoff Kit — ${p}`, intro: 'Four-part handoff kit. Read the shared documents alongside your Component Specification.', shared: 'Shared documents', doc: 'Document', gen: 'Generated', order: 'Quick reference — reading order by role', you: "If you're...", read: 'Read in this order',
    rows: (c, nn, contract) => [[`**Dev** (building ${c})`, '1) your Component Specification §§ 1–4, 7, 8 · 2) each Interface Contract listed in Component Specification § 2 · 3) Cross-Cutting Standards § Error semantics, Idempotency, Resilience defaults · 4) System Runtime View § Flows for the flows in Component Specification § 2'], [`**QA** (testing ${c})`, `1) your Component Specification §§ 3, 4, 5, 9 · 2) each Interface Contract § Failure semantics + Entry/Exit state · 3) Cross-Cutting Standards § Idempotency, Observability · 4) ${contract}`], [`**Ops / SRE** (deploying + running ${c})`, '1) System Runtime View § Budget Decomposition + § Failure Posture · 2) each Interface Contract § Failure semantics + § Observability · 3) Cross-Cutting Standards § Observability conventions, Resilience defaults, Data · 4) your Component Specification §§ 5, 7, 10 (Assets)'], ['**Architect** (validating the kit)', '1) System Runtime View (whole) · 2) Cross-Cutting Standards (rule inventory + Deviations table) · 3) every Interface Contract (continuity check) · 4) `handoffs/.manifest.json` for what regenerated this run']],
    seams: 'Interface contracts', edge: 'Edge', seam: 'Interface Contract', adrs: 'Related ADRs', cuts: 'Component Specifications', comp: 'Component', cut: 'Component Specification', status: 'Status', assets: 'Assets', related: 'Related Documentation',
    rel: ['— the architecture navigation index', '— the C4 L2 component index', '— the `I-nn` integration inventory', '— the architecture decisions the kit cites'], none: 'None this run.', noContract: 'no contract asset — the component exposes no documented API or message', anyContract: (nn) => `the contract assets under \`assets/${nn}/\` (\`openapi.yaml\`, \`asyncapi.yaml\`, \`schema.graphql\`, …)`, every: 'every component' },
  es: { title: (p) => `Kit de Entrega a Desarrollo — ${p}`, intro: 'Kit de cuatro partes. Lee los documentos compartidos junto con tu Especificación de Componente.', shared: 'Documentos compartidos', doc: 'Documento', gen: 'Generado', order: 'Referencia rápida — orden de lectura por rol', you: 'Si eres…', read: 'Lee en este orden',
    rows: (c, nn, contract) => [[`**Dev** (construyes ${c})`, '1) tu Especificación de Componente §§ 1–4, 7, 8 · 2) cada Contrato de Interfaz listado en § 2 · 3) Estándares Transversales § Semántica de errores, Idempotencia, Resiliencia · 4) Vista de Ejecución § Flujos, para los flujos que cita § 2'], [`**QA** (pruebas ${c})`, `1) tu Especificación de Componente §§ 3, 4, 5, 9 · 2) cada Contrato de Interfaz § Semántica de fallos + Estado de entrada/salida · 3) Estándares Transversales § Idempotencia, Observabilidad · 4) ${contract}`], [`**Ops / SRE** (despliegas y operas ${c})`, '1) Vista de Ejecución § Descomposición del presupuesto + § Postura ante fallos · 2) cada Contrato de Interfaz § Semántica de fallos + § Observabilidad · 3) Estándares Transversales § Observabilidad, Resiliencia, Datos · 4) tu Especificación de Componente §§ 5, 7, 10 (Assets)'], ['**Arquitecto** (validas el kit)', '1) Vista de Ejecución completa · 2) Estándares Transversales (inventario de reglas + tabla de Desviaciones) · 3) cada Contrato de Interfaz (continuidad) · 4) `handoffs/.manifest.json` para saber qué se regeneró en esta corrida']],
    seams: 'Contratos de interfaz', edge: 'Arista', seam: 'Contrato de Interfaz', adrs: 'ADR relacionados', cuts: 'Especificaciones de Componente', comp: 'Componente', cut: 'Especificación de Componente', status: 'Estado', assets: 'Assets', related: 'Documentación relacionada',
    rel: ['— índice de navegación de la arquitectura', '— índice de componentes C4 L2', '— inventario de integraciones `I-nn`', '— decisiones de arquitectura citadas a lo largo del kit'], none: 'Ninguno en esta corrida.', noContract: 'sin asset de contrato — el componente no expone una API ni un mensaje documentados', anyContract: (nn) => `los assets de contrato de \`assets/${nn}/\` (\`openapi.yaml\`, \`asyncapi.yaml\`, \`schema.graphql\`, …)`, every: 'cada componente' } };
const ASSET_FILES = { openapi: 'openapi.yaml', ddl: 'ddl.sql', 'graphql-sdl': 'schema.graphql', asyncapi: 'asyncapi.yaml', avro: '*.avsc (one per message)', protobuf: 'schema.proto', redis: 'redis-key-schema.md', 'c4-descriptor': 'c4-descriptor.md' };
const table = (h, rows) => `| ${h.join(' | ')} |\n|${h.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}`;
const day = (s) => String(s || '').slice(0, 10);

function readme(root, opts = {}) {
  root = path.resolve(root); const hd = path.resolve(root, opts.handoffs || 'handoffs'); const mp = path.join(hd, '.manifest.json');
  if (!fs.existsSync(mp)) throw new Error(`${path.relative(root, mp)} not found — the kit has not been generated`);
  const m = JSON.parse(fs.readFileSync(mp, "utf8").replace(/\r\n?/g, "\n")); const facts = collect(root); const lang = (facts.architecture || {}).language === 'es' ? 'es' : 'en'; const t = T[lang];
  const name = (facts.architecture || {}).name || path.basename(root);
  const bySlug = Object.fromEntries((facts.components || []).map((c) => [c.slug, c]));
  const cr = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, '.cache', 'sa-skills', 'handoff-payloads', 'context-result.json'), "utf8").replace(/\r\n?/g, "\n")); } catch { return null; } })();
  const seamName = (key) => { const [u, d] = key.split('→'); const n = (s) => (bySlug[s] || {}).name || (cr && (cr.cut_sheets || []).find((c) => c.slug === s) || {}).name || s; return `${n(u)} → ${n(d)}`; };
  const cuts = Object.entries(m.cut_sheets || {}).map(([slug, e]) => { const c = bySlug[slug] || {}; const file = path.join(hd, e.cut_sheet_file); const src = c.file ? path.join(root, c.file) : null; const outdated = src && fs.existsSync(src) && fs.existsSync(file) && fs.statSync(src).mtimeMs > fs.statSync(file).mtimeMs; const nn = path.basename(e.cut_sheet_file, '.md');
    return { slug, index: c.index || '', name: c.name || slug, file: e.cut_sheet_file, nn, status: fs.existsSync(file) ? (outdated ? 'Outdated' : 'Ready') : 'Missing', assets: (e.assets || []).map((a) => { const f = ASSET_FILES[a] || a; return `[${f}](assets/${nn}/${f})`; }), generated: day(e.generated) }; }).sort((a, b) => (parseFloat(a.index.split('.').pop()) || 0) - (parseFloat(b.index.split('.').pop()) || 0));
  const seams = Object.entries(m.seams || {}).map(([key, e]) => ({ key, name: seamName(key), file: e.seam_file, adrs: (e.related_adrs || []).join(', ') || '—', generated: day(e.generated) })).sort((a, b) => a.key.localeCompare(b.key));
  const focus = cuts.length === 1 ? `\`${cuts[0].name}\`` : t.every; const nn = cuts.length === 1 ? cuts[0].nn : 'NN-<slug>';
  // the QA row names the focused component's own contract assets (8.112.0) — it said `openapi.yaml` whatever the component had
  const contract = (() => { if (cuts.length !== 1) return t.anyContract(nn); const e = (m.cut_sheets || {})[cuts[0].slug] || {}; const fs_ = (e.assets || []).map((a) => ASSET_FILES[a] || a).filter((f) => f !== 'c4-descriptor.md');   // a manifest names types or files
    return fs_.length ? fs_.map((f) => `\`assets/${nn}/${f}\``).join(' · ') : t.noContract; })();
  const run = m.run || {};
  const md = `<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->
[Architecture](../ARCHITECTURE.md) > Development Handoffs

# ${t.title(name)}

${t.intro}

## ${t.shared}

${table([t.doc, t.gen], [['[SYSTEM_RUNTIME_VIEW.md](SYSTEM_RUNTIME_VIEW.md)', day(run.generated) || '—'], ['[CROSS_CUTTING_STANDARDS.md](CROSS_CUTTING_STANDARDS.md)', day(run.generated) || '—']])}

## ${t.order}

${table([t.you, t.read], t.rows(focus, nn, contract))}

## ${t.seams}

${seams.length ? table(['#', t.edge, t.seam, t.adrs, t.gen], seams.map((s, i) => [i + 1, s.name, `[${path.basename(s.file)}](${s.file})`, s.adrs, s.generated])) : t.none}

## ${t.cuts}

${cuts.length ? table(['#', t.comp, t.cut, t.status, t.assets, t.gen], cuts.map((c) => [c.index, c.name, `[${path.basename(c.file)}](${c.file})`, c.status, c.assets.join(', ') || '—', c.generated])) : t.none}

## ${t.related}

- [ARCHITECTURE.md](../ARCHITECTURE.md) ${t.rel[0]}
- [docs/components/README.md](../docs/components/README.md) ${t.rel[1]}
- [docs/05-integration-points.md](../docs/05-integration-points.md) ${t.rel[2]}
- [adr/](../adr/) ${t.rel[3]}
`;
  fs.writeFileSync(path.join(hd, 'README.md'), md);
  return { path: path.join(hd, 'README.md'), lang, seams: seams.length, cut_sheets: cuts.length, outdated: cuts.filter((c) => c.status === 'Outdated').map((c) => c.slug), missing: cuts.filter((c) => c.status === 'Missing').map((c) => c.slug) };
}

module.exports = { readme };

if (require.main === module) {
  const args = process.argv.slice(2); const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun kit-readme.js <project_root> [--handoffs <dir>] [--json]'); process.exit(2); }
  let r; try { r = readme(args[0], { handoffs: opt('--handoffs') }); } catch (e) { console.error('kit-readme: ' + e.message); process.exit(2); }
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1)); else console.log(`Wrote ${r.path} (${r.lang}) — ${r.seams} interface contract(s), ${r.cut_sheets} component specification(s)${r.outdated.length ? `; Outdated: ${r.outdated.join(', ')}` : ''}${r.missing.length ? `; Missing on disk: ${r.missing.join(', ')}` : ''}`);
}
