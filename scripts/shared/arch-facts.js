#!/usr/bin/env node
// The facts ledger of an architecture — everything a workflow reopens documents to remember,
// collected once by code into `.cache/sa-skills/facts.json`.
//
//   bun arch-facts.js <project-root> [--out <file>] [--json] [--section <name>] [--summary]
//
// One source per part, and nothing the files do not state:
//   architecture   ARCHITECTURE.md markers (version, status, released, language, type, prose style) and H1
//   docs           every docs/NN-*.md — title, EXPLORER_HEADER fields, bytes (the explorer's manifest)
//   components     component-cli's facts — canonical name, slug, level, system, type, technology, internal
//                  name, header fields, component version, last updated
//   adrs           adr/ADR-*.md — id, title, status, scope (the explorer's manifest)
//   tdrs           tdr/TDR-*.md — id, title (the H1 without its `TDR-NNN:`, as an ADR's), status (frontmatter `status:` first, then `## Status`), the initiative line, the driver (McKinsey cause family), the BIAN capability (frontmatter `bian-capability` or `## Capability`)
//   layers         docs/03 § 4.1 table — number, name, containers, inside the boundary
//   integrations   docs/05 `I-nn` rows — from, to, protocol, pattern, boundary; a struck-through row is retired
//   phases         docs/04 Phase Catalog rows, the phase block's Hops and Latency budget lines
//   flows          docs/04 Flow Inventory rows, the flow block's Phases, Governed by and Delta lines
//   diagrams       every `#### Diagram:` heading, by file
//   releases       docs/CHANGELOG.md `## [version] - date` entries, plus docs/CHANGELOG-ARCHIVE.md's (flagged `archived`)
//
// `--section <name>` prints one part as JSON — a workflow that needs a name or an id reads that, not the
// documents. `--summary` prints the counts. Without `--json` the ledger is written to `--out` or to
// `.cache/sa-skills/facts.json` under the project. Runs under Bun (it requires the TypeScript parsers).
'use strict';
const fs = require('fs');
const path = require('path');

// the shared read layer: siblings in scripts/shared/
const { listComponents } = require(path.join(__dirname, 'component-facts.ts'));
const { manifest } = require(path.join(__dirname, 'explorer.ts'));
const { parseDemand } = require(path.join(__dirname, 'capacity.ts'));

// ---- text helpers
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
const isSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
function tables(src) {
  const lines = src.split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\|/.test(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const headers = cells(lines[i]).map(plain), rows = []; let j = i + 2;
      while (j < lines.length && /^\s*\|/.test(lines[j])) { rows.push(cells(lines[j])); j++; }
      out.push({ headers, rows, line: i + 1 }); i = j - 1;
    }
  }
  return out;
}
const col = (headers, names) => headers.findIndex((h) => names.some((n) => norm(h) === norm(n) || norm(h).startsWith(norm(n))));
const sectionBody = (src, headingRe) => { const lines = src.split('\n'); const s = lines.findIndex((l) => headingRe.test(l)); if (s < 0) return null; const lvl = (lines[s].match(/^#+/) || [''])[0].length; const out = []; for (let i = s + 1; i < lines.length; i++) { const h = (lines[i].match(/^#+(?=\s)/) || [''])[0].length; if (h && h <= lvl) break; out.push(lines[i]); } return out.join('\n'); };
const labelLine = (body, labels) => { for (const l of labels) { const m = (body || '').match(new RegExp('^\\*\\*' + l + '\\*\\*\\s*:?\\s*(.+)$', 'mi')); if (m) return plain(m[1]); } return null; };
// A frontmatter scalar: `key: value`, `key: "value"   # comment` — the quotes and a trailing YAML comment stripped, the value kept whole (`Won't Fix`).
const fmScalar = (src, key) => { const fm = src.match(/^---\n([\s\S]*?)\n---/); if (!fm) return null; const m = fm[1].match(new RegExp('^' + key + ':[ \\t]*(.*)$', 'm')); if (!m) return null; let v = m[1].trim(); const q = v.match(/^(["'])(.*?)\1/); v = q ? q[2] : v.replace(/\s+#.*$/, ''); return v.trim() || null; };
const field = (src, labels) => { for (const l of labels) { const m = src.match(new RegExp('^\\*\\*' + l + ':?\\*\\*\\s*:?\\s*(.+)$', 'mi')); if (m) return plain(m[1]).replace(/^`|`$/g, ''); } return null; };
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const rel = (root, p) => path.relative(root, p).replace(/\\/g, '/');
// the § 4.1 layer table, by header: the containers column, the inside-boundary column, an external-systems column (either language; headers stay tolerant because both projects localized them)
const layerColumns = (headers) => { const f = (names) => headers.findIndex((h) => names.some((n) => norm(h).includes(n))); let iC = f(['containers', 'contenedores', 'components', 'componentes']); if (iC < 0) iC = 1; const fx = (names) => headers.findIndex((h, i) => i !== iC && names.some((n) => norm(h).includes(n))); return { iC, iB: fx(['inside', 'dentro', 'boundary', 'límite', 'limite']), iX: fx(['external', 'externo']) }; };
const splitNames = (cell) => plain(cell || '').split(/[;,]/).map((s) => s.trim()).filter((s) => s && s !== '—' && s !== '-');
const docFile = (root, prefix) => { const dir = path.join(root, 'docs'); if (!exists(dir)) return null; const f = fs.readdirSync(dir).find((n) => n.startsWith(prefix) && n.endsWith('.md')); return f ? path.join(dir, f) : null; };

// ---- the collection
function collect(root) {
  root = path.resolve(root);
  const warnings = [];
  const archPath = path.join(root, 'ARCHITECTURE.md');
  const archSrc = exists(archPath) ? read(archPath) : '';
  if (!archSrc) warnings.push('ARCHITECTURE.md not found — the architecture part is empty');
  const marker = (k) => (archSrc.match(new RegExp('<!--\\s*' + k + ':\\s*([^>]*?)\\s*-->')) || [])[1] || null;
  // 8.92.7: before the index step writes ARCHITECTURE.md (a create's segments 2–3), the language and the type come from what the
  // collection recorded (.cache/sa-skills/collect.json) and the type from docs/03's marker — the principle gate read `en` and `unknown`
  let collected = {}; try { collected = JSON.parse(read(path.join(root, '.cache', 'sa-skills', 'collect.json'))); } catch { /* no collection */ }
  const layersType = (() => { try { const d = fs.readdirSync(path.join(root, 'docs')).find((f) => /^03-.*\.md$/.test(f)); return d ? (read(path.join(root, 'docs', d)).match(/<!--\s*ARCHITECTURE_TYPE:\s*([^>]*?)\s*-->/) || [])[1] || null : null; } catch { return null; } })();
  const architecture = {
    name: plain((archSrc.match(/^#\s+(.+)$/m) || ['', ''])[1]).replace(/\s*[—–-]\s*(Arquitectura|Architecture)\s*$/i, '') || null,
    version: marker('ARCHITECTURE_VERSION'), status: marker('ARCHITECTURE_STATUS'), released: marker('ARCHITECTURE_RELEASED'),
    language: String(marker('DOC_LANGUAGE') || marker('LANGUAGE') || collected.doc_language || 'en').toLowerCase() === 'es' ? 'es' : 'en',
    type: marker('ARCHITECTURE_TYPE') || layersType || collected.architecture_type || null, prose_style: marker('PROSE_STYLE'),
    architect: field(archSrc, ['Architect', 'Arquitecto']), supersedes: field(archSrc, ['Supersedes', 'Reemplaza']),
  };

  // docs and ADRs — the explorer's manifest, one parser for the headers
  const m = manifest(root, { partial: true });
  if (m.status !== 'OK') warnings.push(`explorer manifest: ${m.reason || 'FAILED'}`);
  const docs = (m.docs || []).filter((d) => /^docs\/\d{2}-[^/]+\.md$/.test(d.file)).map((d) => ({   // the section files; components and the changelog have their own parts
    file: d.file, title: d.title, bytes: exists(path.join(root, d.file)) ? fs.statSync(path.join(root, d.file)).size : 0,
    has_header: d.has_header, key_concepts: d.key_concepts || [], technologies: d.technologies || [], components: d.components || [], scope: d.scope || null, related_adrs: d.related_adrs || [],
  }));
  const adrs = (m.adrs || []).map((a) => ({ id: a.id, file: a.file, title: a.title, status: String(a.status || '').replace(/^[^A-Za-z]+/, '').trim() || null, scope: a.scope || null }));
  if (!architecture.type) { const l = docFile(root, '03-'); if (l) architecture.type = (read(l).match(/<!--\s*ARCHITECTURE_TYPE:\s*([^>]*?)\s*-->/) || [])[1] || null; }

  // components — component-cli's facts
  const facts = exists(path.join(root, 'docs', 'components')) ? listComponents(root) : [];
  // an L1 descriptor at the components root is a system whatever altitude the parser guessed for it
  const isSystem = (f) => f.level === 'L1' || /system/i.test(f.type || '');
  const components = facts.map((f) => { const src = f.file_backed === false ? '' : read(path.join(root, f.path)); return {
    name: f.name, slug: f.slug, file: f.path, level: isSystem(f) ? 'L1' : 'L2', system: f.system, index: f.index, type: f.type, technology: f.technology || [],
    description: f.description || null, internal_name: f.internal_name || null, capacity: f.capacity || null, key_concepts: (f.header && f.header.key_concepts) || [], scope: (f.header && f.header.scope) || null, related_adrs: (f.header && f.header.related_adrs) || [],
    component_version: field(src, ['Component Version', 'Versión del Componente', 'Version del Componente']), last_updated: field(src, ['Last Updated', 'Última Actualización', 'Ultima Actualizacion']),
    delivery: field(src, ['Delivery Increments', 'Incrementos de Entrega']),   // a temporary container's window and TDR (increments.js, 8.140.0)
    tdrs: [...new Set((field(src, ['Technical Debt', 'Deuda Técnica', 'Deuda Tecnica']) || '').toUpperCase().match(/\bTDR-\d{3,}\b/g) || [])],   // the TDRs in force on it (10.8.0)
    bytes: src ? Buffer.byteLength(src) : 0, file_backed: f.file_backed !== false, warnings: f.warnings || [] }; });
  const systems = components.filter((c) => c.level === 'L1').map((c) => ({ name: c.name, slug: c.slug, file: c.file, type: c.type, owned: /internal/i.test(c.type) || (!/external/i.test(c.type) && components.some((x) => x.level === 'L2' && x.system === c.slug && x.file_backed)), containers: components.filter((x) => x.level === 'L2' && x.system === c.slug).map((x) => x.slug) }));

  // TDRs
  const tdrs = [];
  const tdrDir = path.join(root, 'tdr');
  if (exists(tdrDir)) fs.readdirSync(tdrDir).filter((n) => /^TDR-\d+.*\.md$/i.test(n)).sort().forEach((n) => {
    const src = read(path.join(tdrDir, n)); const body = sectionBody(src, /^##\s+(Status|Estado)\b/i);
    const statusFm = fmScalar(src, 'status');
    const status = statusFm || field(src, ['Status', 'Estado']) || (body ? plain(body.split('\n').map((l) => l.trim()).find((l) => l && !/^[#|>-]/.test(l)) || '') : null);
    const capBody = sectionBody(src, /^##\s+(Capability|Capacidad)\b/i); const capFm = (src.match(/^bian-capability:\s*["']?([^"'\n]*)["']?\s*$/m) || [])[1];
    const capRows = capBody ? tables(capBody).flatMap((tb) => tb.rows).filter((r) => r.length >= 3).map((r) => plain(r[1])).filter(Boolean) : [];
    const capability = (capFm && capFm.trim()) || (capRows.length ? capRows.join(' › ') : (capBody ? plain(capBody.split('\n').map((l) => l.trim()).find((l) => l && !/^[#|>*-]/.test(l)) || '') : '')) || null;
    tdrs.push({ id: (n.match(/^TDR-\d+/i) || [n])[0].toUpperCase(), file: 'tdr/' + n, title: plain((src.match(/^#\s+(.+)$/m) || ['', n])[1]).replace(/^TDR-\d+\s*[:—–-]\s*/i, ''), status: status || null, initiative: field(src, ['Initiative', 'Iniciativa']), driver: ((src.match(/^driver:\s*([A-Za-z]+)/m) || [])[1] || (field(src, ['Driver']) || '').split(/\s+[—–-]\s+/)[0] || null), capability });
  });

  // layers — docs/03 § 4.1
  const layers = [];
  const layersFile = docFile(root, '03-');
  if (layersFile) {
    const t = tables(read(layersFile)).find((tb) => tb.rows.length && tb.rows.every((r) => /^(\*\*)?[LTNC]?\d+\b/.test(plain(r[0]))) && tb.headers.length >= 2);
    if (t) { const { iC, iB, iX } = layerColumns(t.headers);
      t.rows.forEach((r) => { const head = plain(r[0]); const mm = head.match(/^[A-Za-z]?(\d+)\s*[—–:-]?\s*(.*)$/); if (!mm) return;
        const own = splitNames(r[iC]), ext = iX >= 0 ? splitNames(r[iX]) : [];
        layers.push({ n: +mm[1], name: mm[2] || head, containers: own.concat(ext), owned: iB >= 0 ? /^(sí|si|yes|✓|true)/i.test(plain(r[iB])) : own.length > 0 || ext.length === 0 }); }); }
    else warnings.push('docs/03 has no layer table (§ 4.1: a Layer column, a Containers column, an Inside-boundary or External-systems column)');
  }

  // integrations — docs/05
  const integrations = [];
  const intFile = docFile(root, '05-');
  if (intFile) tables(read(intFile)).forEach((tb) => {
    const iFrom = col(tb.headers, ['From', 'Desde', 'Source', 'Origen']), iTo = col(tb.headers, ['To', 'Hacia', 'Target', 'Destino']), iP = col(tb.headers, ['Protocol', 'Protocolo', 'Label', 'Etiqueta']), iPat = col(tb.headers, ['Pattern', 'Patrón', 'Patron', 'Style', 'Estilo']), iB = col(tb.headers, ['Boundary', 'Frontera', 'Límite', 'Limite']), iInc = col(tb.headers, ['Increments', 'Incrementos']);
    if (iFrom < 0 || iTo < 0) return;
    tb.rows.forEach((r) => { const raw = r[0] || ''; const retired = /~~/.test(raw); const id = (plain(raw.replace(/~~/g, '')).match(/^I-\d+/i) || [null])[0]; if (!id) return;
      integrations.push({ id: id.toUpperCase(), from: plain((r[iFrom] || '').replace(/~~/g, '')), to: plain((r[iTo] || '').replace(/~~/g, '')), protocol: iP >= 0 ? plain((r[iP] || '').replace(/~~/g, '')) : null, pattern: iPat >= 0 ? plain((r[iPat] || '').replace(/~~/g, '')) : null, boundary: iB >= 0 ? plain((r[iB] || '').replace(/~~/g, '')) : null, ...(iInc >= 0 ? { delivery: plain((r[iInc] || '').replace(/~~/g, '')) || null } : {}), retired, line: tb.line }); });
  });

  // phases and flows — docs/04
  const phases = [], flows = [];
  const flowsFile = docFile(root, '04-');
  if (flowsFile) {
    const src = read(flowsFile);
    const pt = tables(src).find((tb) => col(tb.headers, ['Phase', 'Fase']) >= 0 && col(tb.headers, ['Owner', 'Propietario', 'Responsable']) >= 0);
    if (pt) { const iName = col(pt.headers, ['Phase', 'Fase']), iCrit = col(pt.headers, ['On critical path', 'Crítico', 'Critico']), iOwner = col(pt.headers, ['Owner', 'Propietario', 'Responsable']), iFail = col(pt.headers, ['Failure mode', 'Modo de fallo', 'Fallo']);
      pt.rows.forEach((r) => { const num = plain(r[0]).replace(/\D+$/, ''); if (!/^\d+[a-z]?$/i.test(num)) return;
        const block = sectionBody(src, new RegExp('^#{2,6}\\s+(Phase|Fase)\\s+' + num + '\\b', 'i')   /* any level: the catalog sits at H2 in one project and H3 in another */) || '';
        phases.push({ n: num, name: plain(r[iName]), critical: iCrit >= 0 ? plain(r[iCrit]) : null, owner_chain: plain(r[iOwner] || ''), failure_mode: iFail >= 0 ? plain(r[iFail]) : null,
          hops: labelLine(block, ['Hops', 'Saltos']), latency_budget: labelLine(block, ['Latency budget \\(p95\\)', 'Presupuesto de latencia \\(p95\\)', 'Latency budget', 'Presupuesto de latencia']), has_block: !!block }); });
    } else warnings.push('docs/04 has no Phase Catalog table (# | Phase | On critical path? | Owner | Failure mode)');
    const ft = tables(src).find((tb) => col(tb.headers, ['Flow', 'Flujo']) >= 0 && col(tb.headers, ['Use Case', 'Caso de Uso']) >= 0);
    if (ft) { const iF = col(ft.headers, ['Flow', 'Flujo']), iT = col(ft.headers, ['Trigger', 'Disparador']), iUc = col(ft.headers, ['Use Case', 'Caso de Uso']), iLat = col(ft.headers, ['Latency Target', 'Objetivo de latencia', 'Latencia']);
      ft.rows.forEach((r) => { const mm = plain(r[iF]).match(/^(\d+[a-z]?)\.\s*(.+)$/); if (!mm) return;
        const block = sectionBody(src, new RegExp('^#{2,6}\\s+(Flow|Flujo)\\s+' + mm[1] + '\\s*[—–-]', 'i')   /* idem — a pinned level silently emptied every flow of a whole project */) || '';
        const phasesLine = labelLine(block, ['Phases', 'Fases']) || '';
        const gov = block.match(/\*\*(Governed by|Gobernado por)\*\*\s*:?\s*(.+)/i);
        flows.push({ code: mm[1], name: mm[2], trigger: iT >= 0 ? plain(r[iT]) : null, use_cases: (plain(r[iUc]).match(/UC-?\d+/gi) || []).map((u) => u.toUpperCase().replace(/^UC(\d)/, 'UC-$1')), latency_target: iLat >= 0 ? plain(r[iLat]) : null,
          phases: phasesLine ? (phasesLine.split(/\(/)[0].match(/\d+[a-z]?/g) || []) : [], governed_by: gov ? [...new Set(gov[2].match(/ADR-\d{3}/g) || [])] : [], delta: labelLine(block, ['Delta']), has_block: !!block }); });
    } else warnings.push('docs/04 has no Flow Inventory table (Flow | Trigger | Use Case | Latency Target)');
  }

  // demand — docs/08 § Demand by Use Case (8.33.0): what enters the load simulation, in rps (sessions stay a gauge)
  let demand = [];
  const perfFile = docFile(root, '08-');
  if (perfFile) { const known = {}; flows.forEach((f) => f.use_cases.concat(['FLOW-' + f.code]).forEach((id) => { known[id] = (known[id] || []).concat(f.phases); })); /* a flow with no single use case is FLOW-<code> in the scene; a use case in two flows declares both sets of phases */ const d = parseDemand(read(perfFile), Object.entries(known).map(([id, phases]) => ({ id, phases: [...new Set(phases)] }))); if (d) { demand = d.rows; d.warnings.forEach((w) => warnings.push(`docs/08 ${w}`)); } }

  // increments — the Delivery Increments table (8.139.0): the use cases each delivery piece ships; the slices are increments.js's
  const inc = require(path.join(__dirname, 'increments.js')).read(root);

  // diagrams — every `#### Diagram:` heading
  const diagrams = [];
  docs.forEach((d) => { const src = read(path.join(root, d.file)); const names = [...src.matchAll(/^####\s+(?:Diagram|Diagrama)\s*:\s*(.+)$/gm)].map((x) => plain(x[1])); if (names.length) diagrams.push({ file: d.file, diagrams: names }); });

  // releases — docs/CHANGELOG.md
  const releases = [];
  const cl = path.join(root, 'docs', 'CHANGELOG.md');
  const readReleases = (p, archived) => { if (exists(p)) [...read(p).matchAll(/^##[ \t]+\[([^\]]+)\][ \t]*(?:-[ \t]*(\d{4}-\d{2}-\d{2}))?(.*)$/gm)].forEach((x) => { if (!/unreleased/i.test(x[1])) releases.push(Object.assign({ version: x[1], date: x[2] || null, note: plain(x[3]) || null }, archived ? { archived: true } : {})); }); };
  readReleases(cl, false); readReleases(path.join(root, 'docs', 'CHANGELOG-ARCHIVE.md'), true);   // rotated entries (changelog-rotate.js) still count

  return { schema_version: '1.0', generated_at: new Date().toISOString(), project_root: root, architecture, docs, systems, components, adrs, tdrs, layers, integrations, phases, flows, demand, increments: inc.rows, increments_file: inc.file, diagrams, releases, warnings };
}

const summary = (f) => `facts: ${f.docs.length} docs, ${f.systems.length} systems, ${f.components.filter((c) => c.level === 'L2').length} containers, ${f.adrs.length} ADRs, ${f.tdrs.length} TDRs, ${f.layers.length} layers, ${f.integrations.filter((i) => !i.retired).length} integrations (${f.integrations.filter((i) => i.retired).length} retired), ${f.phases.length} phases, ${f.flows.length} flows, ${(f.demand || []).length} demand rows, ${(f.increments || []).length ? `${f.increments.length} increments, ` : ''}${f.components.filter((c) => c.capacity).length} capacity tables, ${f.diagrams.reduce((n, d) => n + d.diagrams.length, 0)} diagrams, ${f.releases.length} releases` + (f.warnings.length ? `\nwarnings (${f.warnings.length}):\n  - ${f.warnings.join('\n  - ')}` : '');

// the CLI, callable from the old path under architecture-docs/scripts/ as well
function main(args) {
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun arch-facts.js <project-root> [--out <file>] [--json] [--section <name>] [--summary]'); process.exit(2); }
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const facts = collect(args[0]);
  const section = opt('--section');
  if (section) { if (!(section in facts)) { console.error(`arch-facts: no section "${section}" — one of: ${Object.keys(facts).join(', ')}`); process.exit(2); } process.stdout.write(JSON.stringify(facts[section], null, 1) + '\n'); }
  else if (args.includes('--json')) process.stdout.write(JSON.stringify(facts, null, 1) + '\n');
  else if (!args.includes('--summary')) { const out = opt('--out') || path.join(facts.project_root, '.cache', 'sa-skills', 'facts.json'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(facts, null, 1) + '\n'); console.error(`Wrote ${out}`); }
  console.error(summary(facts));
}

module.exports = { collect, summary, main };

if (require.main === module) main(process.argv.slice(2));
