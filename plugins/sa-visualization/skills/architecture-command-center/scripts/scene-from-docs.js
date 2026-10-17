#!/usr/bin/env node
// The logical scene of the command center, generated from the architecture documents.
//
//   bun scene-from-docs.js <project-root> [--base <scene.json> | --no-base] [--overrides <json>] [--out <scene.json>] [--json] [--capacity-check]
//                         [--judge agent|typesafe|clef]   (else SA_JUDGE; the names, plurals and description pairs go through scripts/resolve-name.js)
//
// Deterministic extraction — one source per part of the scene, and nothing the files do not state:
//   project / version / status / type / language   ARCHITECTURE.md markers and H1
//   systems, internal containers                    component-cli's facts (docs/components/**) — canonical name, type, technology, internal name, header ADRs
//   external containers                             each external system descriptor's `## Containers` table
//   layers, a container's layer                     docs/03 § 4.1 layer table (layer number and name, the containers named on it, the boundary column)
//   edges                                           docs/05 `I-nn` rows (label = protocol · id), plus every descriptor's `## Communication` table
//   phases                                          docs/04 Phase Catalog table (owner chain → hops; a `**Hops**` line wins when the phase block has one), the
//                                                   phase block's `**Latency budget (p95)**` line; a participant that is a system is expanded through the
//                                                   edge graph; one that is neither is an actor
//   use cases                                       docs/04 Flow Inventory rows and each flow block's `**Phases**`, `**Governed by**`, `**Delta**` lines
//
// One scene per project (8.150.0): the default output is visualizations/architecture-command-center.scene.json, rewritten in
// place, and the previous scene is its base unless `--base` names another or `--no-base` is given. Writing it retires the dated
// pairs earlier versions left (`architecture-command-center-<date>.*`, `architecture-3d-view-<date>.*`): the newest dated scene is
// the base when no current one exists, then every dated scene and page is deleted and listed — git keeps the history.
//
// What the documents do not state comes from a base scene (`--base`, usually the previous scene: node ids
// are kept for the same canonical names so its `deployment` block still points at them; `thesis`,
// `allDescription`, route descriptions, phase kinds and node coordinates are carried over) and from an
// overrides file (`--overrides`, deep-merged last — the architect's word on a phase's color family, a
// jump, a thesis). A phase kind stated by neither is inferred from the protocols on its hops and reported
// as inferred. The report on stderr lists every inference, every synthesized edge, every actor created
// and every name it could not resolve, so the scene is reviewed against the docs, not written by hand.
//
// Runs under Bun (the plugin's runtime): it requires the component facts parser (TypeScript).
'use strict';
const fs = require('fs');
const path = require('path');
const SA = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-visualization reads the architecture through sa-skills

const args = process.argv.slice(2);
if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun scene-from-docs.js <project-root> [--base <scene.json>] [--overrides <json>] [--out <scene.json>] [--json] [--capacity-check]'); process.exit(2); }
const ROOT = path.resolve(args[0]);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const { listComponents } = require(SA.fromSaSkills('scripts', 'shared', 'component-facts.ts'));
const { parseDemand } = require(SA.fromSaSkills('scripts', 'shared', 'capacity.ts'));

// ---- text helpers (the dossier's conventions: plain text, accent- and case-insensitive names)
const plain = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/\s+/g, '-');
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
const docFile = (prefix) => { const dir = path.join(ROOT, 'docs'); if (!exists(dir)) return null; const f = fs.readdirSync(dir).find((n) => n.startsWith(prefix) && n.endsWith('.md')); return f ? path.join(dir, f) : null; };
const warnings = [], report = {};
const warn = (s) => warnings.push(s);

// ---- ARCHITECTURE.md
const archSrc = exists(path.join(ROOT, 'ARCHITECTURE.md')) ? read(path.join(ROOT, 'ARCHITECTURE.md')) : '';
const marker = (k) => (archSrc.match(new RegExp('<!--\\s*' + k + ':\\s*([^>]*?)\\s*-->')) || [])[1] || '';
const language = (marker('DOC_LANGUAGE') || marker('LANGUAGE') || 'en').toLowerCase() === 'es' ? 'es' : 'en';
const project = plain((archSrc.match(/^#\s+(.+)$/m) || ['', 'Architecture'])[1]).replace(/\s*[—–-]\s*(Arquitectura|Architecture)\s*$/i, '');
const T = language === 'es'
  ? { local: 'Lectura local', online: 'Ruta en línea', async: 'Eventos y replicación', control: 'Control y ciclo de vida', batch: 'Lotes fuera del camino crítico', neutral: 'Otras conexiones', phases: 'Fases', all: (n, s, u) => `${n} contenedores sobre las capas documentadas, ${s} sistema(s) externo(s) y ${u} caso(s) de uso. Elige un caso de uso o una ruta para seguir el recorrido del dato.` }
  : { local: 'Local read', online: 'Online request path', async: 'Events and replication', control: 'Control and lifecycle', batch: 'Batch, off the critical path', neutral: 'Other connections', phases: 'Phases', all: (n, s, u) => `${n} containers on the documented layers, ${s} external system(s) and ${u} use case(s). Pick a use case or a route to follow the data.` };

// ---- base and overrides
const VIZ = path.join(ROOT, 'visualizations');
const CURRENT = path.join(VIZ, 'architecture-command-center.scene.json');
const DATED = /^architecture-(?:command-center|3d-view)-.+\.(?:scene\.json|html)$/;
// a dated scene's own date (its name) decides which is the previous one, the file time only between two of one day: files written
// in the same millisecond (a copy, a checkout, a test) tie on the time, and the older date won as often as not
const sceneDate = (f) => (path.basename(f).match(/(\d{4}-\d{2}-\d{2})/) || [, ''])[1];
const dated = exists(VIZ) ? fs.readdirSync(VIZ).filter((n) => DATED.test(n)).map((n) => path.join(VIZ, n)) : [];
const basePath = opt('--base') || (args.includes('--no-base') ? null
  : exists(CURRENT) ? CURRENT : dated.filter((f) => f.endsWith('.scene.json')).sort((a, b) => sceneDate(b).localeCompare(sceneDate(a)) || fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || null);
if (basePath && !opt('--base')) console.error(`Base: ${rel(basePath)} (the previous scene; --no-base to start fresh)`);
const base = basePath ? JSON.parse(read(basePath)) : null;
const overrides = opt('--overrides') ? JSON.parse(read(opt('--overrides'))) : {};
const baseNodeByName = {}; (base ? base.nodes || [] : []).forEach((n) => { baseNodeByName[norm(n.name)] = n; });

// ---- systems and containers
const facts = exists(path.join(ROOT, 'docs', 'components')) ? listComponents(ROOT) : [];
const systemsFacts = facts.filter((f) => /system/i.test(f.type) || f.level === 'L1');
const systems = systemsFacts.map((f) => ({ id: f.slug, name: f.name, owned: /internal/i.test(f.type) || (!/external/i.test(f.type) && facts.some((c) => c.system === f.slug && c !== f && c.file_backed !== false)) })).sort((a, b) => (b.owned ? 1 : 0) - (a.owned ? 1 : 0));
const sysIdByName = {}; systems.forEach((s) => { sysIdByName[norm(s.name)] = s.id; });
const KIND = (type) => { const t = norm(type); return /database|store|cache|almac/.test(t) ? 'store' : /broker|topic|queue|topico|cola|kafka|event/.test(t) ? 'broker' : /gateway|proxy/.test(t) ? 'gateway' : /worker|consumer|job|connector|batch|etl/.test(t) ? 'worker' : /web|app|frontend|mobile|spa|mfa/.test(t) ? 'app' : 'service'; };
const usedIds = new Set();
const idFor = (name, preferred) => { let id = (baseNodeByName[norm(name)] || {}).id || preferred || slug(name); let k = id, n = 2; while (usedIds.has(k)) k = id + '-' + n++; usedIds.add(k); return k; };
const nodes = [], nodeByNorm = {};
const addNode = (n) => { nodes.push(n); nodeByNorm[norm(n.name)] = n; return n; };
facts.filter((f) => f.system && !/system/i.test(f.type) && f.level !== 'L1').forEach((f) => {
  const n = { id: idFor(f.name, f.slug), name: f.name, layer: null, system: f.system, kind: KIND(((f.header || {}).component_type || '') + ' ' + f.type), tech: (f.technology || []).join(', ') };
  if (f.internal_name) n.internal = f.internal_name;
  const adrs = (f.header && f.header.related_adrs) || []; if (adrs.length) n.adrs = adrs.map((a) => a.toUpperCase());
  const src = f.file_backed === false ? '' : read(path.join(ROOT, f.path));   // a table-declared container has no file of its own
  const purpose = sectionBody(src, /^##\s+(Purpose|Propósito|Proposito)\b/i);
  const para = (purpose || '').split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !/^[#|>*-]/.test(p) && !/^\*\*/.test(p));
  if (para) { const sents = plain(para).match(/[^.!?]+[.!?]+/g) || [plain(para)]; n.note = sents.slice(0, 2).join('').trim(); }
  addNode(n);
});
// external containers: each external system descriptor's `## Containers` table; a lone row named after the system is the system's one node
systemsFacts.filter((f) => !systems.find((s) => s.id === f.slug).owned).forEach((f) => {
  const src = read(path.join(ROOT, f.path));
  const t = tables(sectionBody(src, /^##\s+(Containers|Contenedores)\b/i) || '').find((tb) => col(tb.headers, ['Component', 'Componente']) >= 0);
  if (!t) { if (!nodeByNorm[norm(f.name)]) addNode({ id: idFor(f.name), name: f.name, layer: null, system: f.slug, kind: 'service', tech: '' }); return; }
  const iN = col(t.headers, ['Component', 'Componente']), iT = col(t.headers, ['Type', 'Tipo']), iTech = col(t.headers, ['Technology', 'Tecnología', 'Tecnologia']);
  t.rows.forEach((r) => { const name = plain(r[iN]); if (!name || nodeByNorm[norm(name)]) return;
    addNode({ id: idFor(name), name, layer: null, system: f.slug, kind: KIND(r[iT] || ''), tech: plain(r[iTech] || '').replace(/^\[|\]$/g, '') }); });
});

// ---- layers: docs/03 § 4.1
const layers = [];
const layersFile = docFile('03-');
if (layersFile) {
  const t = tables(read(layersFile)).find((tb) => tb.rows.length && tb.rows.every((r) => /^(\*\*)?[LTNC]?\d+\b/.test(plain(r[0]))) && tb.headers.length >= 2);
  if (t) { // columns by header: containers, inside-boundary, external systems (either language)
    const fcol = (names) => t.headers.findIndex((h) => names.some((x) => norm(h).includes(x)));
    let iC = fcol(['containers', 'contenedores', 'components', 'componentes']); if (iC < 0) iC = 1; const fx = (names) => t.headers.findIndex((h, i) => i !== iC && names.some((x) => norm(h).includes(x))); const iB = fx(['inside', 'dentro', 'boundary', 'limite']), iX = fx(['external', 'externo']);
    const split = (cell) => plain(cell || '').split(/[;,]/).map((s) => s.trim()).filter((s) => s && s !== '—' && s !== '-');
    t.rows.forEach((r) => {
      const head = plain(r[0]); const m = head.match(/^[A-Za-z]?(\d+)\s*[—–:-]?\s*(.*)$/); if (!m) return;
      const n = +m[1], name = m[2] || head;
      const own = split(r[iC]), ext = iX >= 0 ? split(r[iX]) : [];
      const owned = iB >= 0 ? /^(sí|si|yes|✓|true)/i.test(plain(r[iB])) : own.length > 0 || ext.length === 0;
      layers.push({ n, name, owned });
      own.concat(ext).forEach((nm) => { const node = nodeByNorm[norm(nm)]; if (node) node.layer = n; else if (sysIdByName[norm(nm)]) nodes.filter((x) => x.system === sysIdByName[norm(nm)] && x.layer == null).forEach((x) => { x.layer = n; }); else if (norm(nm)) warn(`docs/03 § 4.1 names "${nm}" on L${n} but no container or system of that name exists`); });
    }); }
}
if (!layers.length) warn('docs/03 has no layer table (§ 4.1 shape: layer | containers | inside boundary) — every container lands on one floor');
layers.sort((a, b) => a.n - b.n);
const lowest = layers.length ? layers[layers.length - 1].n : 1;
if (!layers.length) layers.push({ n: 1, name: language === 'es' ? 'Sistema' : 'System', owned: true });
nodes.forEach((n) => { if (n.layer == null) { n.layer = lowest; warn(`"${n.name}" is on no layer of docs/03 § 4.1 — placed on L${lowest}`); } });

// ---- edges: docs/05 rows and every descriptor's Communication table
const edges = [], edgeByKey = {};
const ekey = (a, b) => [a, b].sort().join('|');
// A name resolves exactly by code, else by the judge (below); prefix and containment only find the candidates a plural
// ("Topicos CDC") may cover, so a chain participant can open into a branch once the judge says which it covers
const singular = (k) => k.split(' ').map((w) => w.replace(/(?<=[a-z]{3})s$/, '')).join(' ');
const resolveManyRule = (raw) => { const k = norm(raw.replace(/\([^)]*\)/g, '')); if (!k) return []; if (nodeByNorm[k]) return [nodeByNorm[k]];
  for (const key of [k, singular(k)]) { const starts = nodes.filter((n) => norm(n.name).startsWith(key)); if (starts.length === 1) return starts; const contains = nodes.filter((n) => norm(n.name).includes(key) || key.includes(norm(n.name))); if (contains.length) return contains; } return []; };
const resolveName = (raw) => { const m = resolveMany(raw); return m.length === 1 ? m[0] : null; };
const resolvePrefix = (raw) => { const k = norm(raw.replace(/\([^)]*\)/g, '')); if (!k) return []; if (nodeByNorm[k]) return [nodeByNorm[k]]; for (const key of [k, singular(k)]) { const starts = nodes.filter((n) => norm(n.name).startsWith(key)); if (starts.length) return starts; } return []; };
// the containers of a system that a Description names — full canonical names, in order of mention; a system with one container is that container
// Named containers come back as groups: names joined only by "y" / "and" / "o" / "or" / a comma are parallel
// ("`MS A` y `MS B` consultan el `Gateway`"), consecutive groups are the hops the data takes in order
// the hits of a system's containers in a Description, in order of mention, each with the words between it and the previous hit
const hitsIn = (text, systemId) => { let hay = ' ' + norm(text) + ' '; const own = nodes.filter((n) => n.system === systemId); const hits = [];
  own.slice().sort((x, y) => y.name.length - x.name.length).forEach((n) => { const k = ' ' + norm(n.name) + ' ', i = hay.indexOf(k); if (i >= 0) { hits.push({ n, i, end: i + k.length - 1 }); hay = hay.slice(0, i + 1) + ' '.repeat(k.length - 2) + hay.slice(i + k.length - 1); } });   // longest names first, each match masked so a shorter name cannot fire inside it
  hits.sort((x, y) => x.i - y.i); hits.forEach((h, idx) => { h.between = idx ? hay.slice(hits[idx - 1].end, h.i).trim() : null; }); return hits; };
// parallel or in sequence: the judge's reading of the sentence (relationOf, defined with the batch below). A pair it has not
// answered is undecided: the second name opens a new group marked `cut`, and no inner edge is drawn into it (chainOf)
const groupsNamedIn = (text, systemId) => { const own = nodes.filter((n) => n.system === systemId); if (own.length === 1) return [own];
  const groups = []; hitsIn(text, systemId).forEach((h, idx, hits) => { const rel = idx ? relationOf(text, hits[idx - 1].n.name, h.n.name) : null; if (idx && rel === 'parallel') groups[groups.length - 1].push(h.n); else { const g = [h.n]; if (idx && !rel) g.cut = true; groups.push(g); } }); return groups; };
const sysOf = (raw) => { const k = norm(raw.replace(/\([^)]*\)/g, '')); return systems.find((s) => norm(s.name) === k || norm(s.name).startsWith(k) || k.startsWith(norm(s.name))) || null; };
const actors = [];
const actorFor = (name) => { let a = nodeByNorm[norm(name)]; if (a) return a; a = addNode({ id: idFor(name), name: plain(name), layer: layers[0].n, system: 'actor', kind: 'actor', tech: '' }); actors.push(a.name); return a; };
const addEdge = (a, b, label, source) => { if (!a || !b || a === b) return null; const k = ekey(a.id, b.id); if (edgeByKey[k]) { if (label && !edgeByKey[k].label) edgeByKey[k].label = label; return edgeByKey[k]; } const e = { a: a.id, b: b.id, routes: [], label: label || '' }; if (/^docs\/05/.test(source)) Object.defineProperty(e, 'fromDocs05', { value: true, enumerable: false }); if (/^phase /.test(source)) Object.defineProperty(e, 'synthesized', { value: true, enumerable: false }); edgeByKey[k] = e; edges.push(e); (report.edgeSources = report.edgeSources || []).push(`${a.name} → ${b.name} (${source})`); return e; };
// ---- names → nodes, judged once before the edge and phase passes. Which container a prose name refers to used to be
// containment in either direction with a naive singular, and a lone name that resolved to nothing became an actor —
// an external product and a misspelled container by the same path. Every name the two passes will need is collected
// here (docs/05 cells, Communication endpoints, phase chain participants), resolved in one batch through
// scripts/resolve-name.js — exact names by code, the rest by the judge over this scene's containers with their taglines
// — with two companion questions: which containers a plural covers, and whether two containers named in one
// Description act in parallel or in sequence. An item the judge has not answered is undecided (8.119.0): the name is
// neither a container nor an actor, the plural covers nothing, the pair draws no inner edge — and each is printed under
// Undecided with the worksheet, so the scene is completed by answering it and re-running, never by the old rule.
const { resolveNames, mentions, relations, COVERS } = require(SA.fromSaSkills('scripts', 'resolve-name.js'));
const judgeEngine = opt('--judge') || undefined;
const stripP = (s) => plain(String(s || '')).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
const nameKey = (s) => norm(stripP(s));
const nodeFacts = facts.filter((f) => nodeByNorm[norm(f.name)]);
const nodeOfFact = (f) => nodeByNorm[norm(f.name)] || null;
const factOfNode = (n) => nodeFacts.find((f) => norm(f.name) === norm(n.name)) || { name: n.name };
const sysExact = (s) => systems.find((x) => norm(x.name) === nameKey(s)) || null;
const wantNames = new Map();
const wantName = (raw, context, exclude) => { const key = nameKey(raw); if (!key || nodeByNorm[key] || sysExact(raw) || wantNames.has(key)) return; wantNames.set(key, { id: `n${wantNames.size}`, cell: stripP(raw), context, exclude: exclude || [] }); };
// a cell that is exactly one container's name is one part, whatever it contains ("Servicio de Riesgo y Detección" is not two)
const splitEndpoint = (cell) => { const clean = stripP(cell); if (nodeByNorm[norm(clean)]) return { parts: [clean], via: null }; const viaM = clean.match(/^(.*?)[,;]?\s*(?:v[ií]a|a trav[eé]s de|through)\s+(.+)$/i); const parts = (viaM ? viaM[1] : clean).split(/\s*(?:,|;|·|\|)\s*|\s+(?:y|and)\s+/).map((s) => s.trim()).filter(Boolean); return { parts, via: viaM ? viaM[2] : null }; };
const exactNodes = (cell) => splitEndpoint(cell).parts.map((p) => nodeByNorm[norm(p)]).filter(Boolean).map((n) => n.name);   // the other endpoint's containers, when the row names them exactly
const coversItems = [], relationItems = [];
const relKey = (desc, a, b) => norm(desc) + '|' + norm(a) + '|' + norm(b);
const int0 = docFile('05-');
if (int0) tables(read(int0)).forEach((tb) => { const iFrom = col(tb.headers, ['From', 'Desde', 'Source', 'Origen']), iTo = col(tb.headers, ['To', 'Hacia', 'Target', 'Destino']), iP = col(tb.headers, ['Protocol', 'Protocolo', 'Label', 'Etiqueta']); if (iFrom < 0 || iTo < 0) return;
  tb.rows.filter((r) => /^I-\d+/i.test(plain(r[0]))).forEach((r) => { const id = plain(r[0]).toUpperCase();
    [['from', iFrom, iTo], ['to', iTo, iFrom]].forEach(([side, i, j]) => { const { parts, via } = splitEndpoint(r[i]); const ctx = { integration: id, side, other: stripP(r[j]), protocol: iP >= 0 ? plain(r[iP]) : 'Not documented' }, ex = exactNodes(r[j]); parts.forEach((p) => wantName(p, ctx, ex)); if (via) wantName(via, { ...ctx, role: 'via' }, ex); }); }); });
facts.forEach((f) => { const src = read(path.join(ROOT, f.path));
  tables(sectionBody(src, /^##\s+(Communication|Comunicación|Comunicacion)\b/i) || '').forEach((tb) => { const iFrom = col(tb.headers, ['From', 'Desde']), iTo = col(tb.headers, ['To', 'Hacia']), iD = col(tb.headers, ['Description', 'Descripción', 'Descripcion']); if (iFrom < 0 || iTo < 0) return;
    tb.rows.forEach((r) => { const desc = iD >= 0 ? plain(r[iD]) : '', ctx = { file: rel(path.join(ROOT, f.path)) + ' Communication', description: desc };
      [iFrom, iTo].forEach((i, k) => { const cell = r[i], otherCell = r[k ? iFrom : iTo]; if (nodeByNorm[nameKey(cell)]) return; const sys = sysExact(cell) || sysOf(cell); if (sys) { const hits = hitsIn(desc, sys.id); hits.forEach((h, idx) => { if (!idx) return; const first = hits[idx - 1].n.name, second = h.n.name, key = relKey(desc, first, second); if (!relationItems.some((p) => p.key === key)) relationItems.push({ id: `r${relationItems.length}`, key, description: desc, first, second, between: h.between }); }); } else wantName(cell, ctx, exactNodes(otherCell)); }); }); }); });
{ const f04 = docFile('04-'); const flow0 = f04 ? read(f04) : '';
  const t = flow0 ? tables(flow0).find((tb) => col(tb.headers, ['Phase', 'Fase']) >= 0 && col(tb.headers, ['Owner', 'Propietario', 'Responsable']) >= 0) : null;
  if (t) { const iOwner = col(t.headers, ['Owner', 'Propietario', 'Responsable']);
    t.rows.forEach((r) => { const num = plain(r[0]).replace(/\D+$/, ''); if (!/^\d+[a-z]?$/i.test(num)) return;
      const block = sectionBody(flow0, new RegExp('^#{2,6}\\s+(Phase|Fase)\\s+' + num + '\\b', 'i')) || '', hopsLine = labelLine(block, ['Hops', 'Saltos']);
      (hopsLine || plain(r[iOwner] || '')).replace(/\([^)]*\)/g, '').split(/\s*(?:→|->|⇒)\s*/).map((s) => s.trim()).filter(Boolean).forEach((part) => part.split(/\s*[·|]\s*/).map((s) => s.trim()).filter(Boolean).forEach((alt) => {
        if (nodeByNorm[nameKey(alt)] || sysExact(alt) || alt.split(/\s+(?:y|and)\s+/).length > 1) return;   // exact, a system, or an explicit pair: code's
        const cands = resolveManyRule(alt);
        if (cands.length >= 2) { if (!coversItems.some((c) => nameKey(c.text) === nameKey(alt))) coversItems.push({ id: `c${coversItems.length}`, text: stripP(alt), candidates: cands.map(factOfNode) }); }
        else wantName(alt, { phase: num }); })); }); } }
const judgeCommon = { engine: judgeEngine, root: ROOT };
const emptyRes = () => { const m = new Map(); m.engine = judgeEngine || require(SA.fromSaSkills('scripts', 'judge.js')).engineInForce(); return m; };
let namesRes = emptyRes(), coversRes = emptyRes(), relRes = emptyRes(), judgeNote = null, judgePending = null;
try {
  [namesRes, coversRes, relRes] = await Promise.all([
    wantNames.size ? resolveNames([...wantNames.values()], nodeFacts, judgeCommon) : namesRes,
    coversItems.length ? mentions(coversItems, nodeFacts, { ...judgeCommon, spec: COVERS }) : coversRes,
    relationItems.length ? relations(relationItems, judgeCommon) : relRes]);
  judgePending = namesRes.pending || coversRes.pending || relRes.pending || null;
  if (judgePending) judgeNote = `agent worksheets under ${path.dirname(judgePending)} — judge them and re-run; until then every item listed under Undecided stays undecided`;
} catch (e) { if (e.name !== 'JudgeError') throw e; judgeNote = `${e.message} — every name, plural and pair the judge must read is undecided`; namesRes = emptyRes(); coversRes = emptyRes(); relRes = emptyRes(); }
const judgedName = (raw) => { const w = wantNames.get(nameKey(raw)); return w ? namesRes.get(w.id) : null; };
const coversByKey = new Map(coversItems.map((c) => [nameKey(c.text), coversRes.get(c.id)]));
const relByKey = new Map(relationItems.map((p) => [p.key, relRes.get(p.id)]));
// exact by code, else the judge's answer; a name nobody asked the judge (a system's name, an explicit pair) resolves to no container here
const resolveMany = (raw) => { const key = nameKey(raw); if (!key) return []; if (nodeByNorm[key]) return [nodeByNorm[key]];
  if (coversByKey.has(key)) { const c = coversByKey.get(key); return c ? c.facts.map(nodeOfFact).filter(Boolean) : []; }
  const j = judgedName(raw); return j && j.resolved ? [nodeOfFact(j.fact)].filter(Boolean) : []; };
// a name the judge has not answered: never a container, never an actor
const undecided = (raw) => { const key = nameKey(raw); if (!key || nodeByNorm[key]) return false;
  if (coversByKey.has(key)) { const c = coversByKey.get(key); return !c || (!c.names.length && (c.undecided || []).length > 0); }
  if (!wantNames.has(key)) return false; const j = judgedName(raw); return !j || !!j.undecided; };
const unsure = (raw) => { const j = judgedName(raw); return !!(j && !j.resolved && /^(possibly|resolved to)/.test(j.unresolved_reason || '')); };
const relationOf = (desc, a, b) => (relByKey.get(relKey(desc, a, b)) || {}).relation || null;
const undecidedReport = [];   // every item the judge has not answered, printed under Undecided
wantNames.forEach((w) => { const r = namesRes.get(w.id); if (r && !r.undecided) return;
  undecidedReport.push(`${w.context.integration ? `docs/05 ${w.context.integration} ${w.context.side}` : w.context.phase ? `phase ${w.context.phase}` : w.context.file || 'Communication'} "${w.cell}" — no container, no actor`); });
coversItems.forEach((c) => { const r = coversRes.get(c.id); if (r && !(r.undecided || []).length) return; undecidedReport.push(`plural "${c.text}" — ${r && r.names.length ? `covers ${r.names.map((n) => `\`${n}\``).join(', ')}; ` : 'covers nothing yet; '}${(r ? r.undecided : c.candidates.map((f) => f.name)).map((n) => `\`${n}\``).join(', ')} unanswered`); });
relationItems.forEach((p) => { const r = relRes.get(p.id); if (r && !(r.undecided && r.judged == null)) return; undecidedReport.push(`Communication "${p.first}" / "${p.second}" — parallel or sequence unanswered; no inner edge drawn`); });
const judgeReview = [];
wantNames.forEach((w) => { const r = namesRes.get(w.id); if (!r || r.undecided || r.by === 'undecided' || r.by === 'exact') return;
  const where = w.context.integration ? `docs/05 ${w.context.integration} ${w.context.side}` : w.context.phase ? `phase ${w.context.phase}` : w.context.file || 'Communication', who = `${r.by}${r.confidence != null ? ` ${r.confidence}` : ''}`;
  if (!r.resolved && /^(possibly|resolved to)/.test(r.unresolved_reason || '')) judgeReview.push(`${where} "${w.cell}" — ${r.unresolved_reason} (${who}); not made an actor`);
  else if (r.resolved && r.band === 'mid') judgeReview.push(`${where} "${w.cell}" resolved to \`${r.name}\` (${who}) — below the confident band; confirm it`);
  else if (r.resolved && norm(w.cell) !== norm(r.name)) judgeReview.push(`${where} "${w.cell}" → \`${r.name}\` (${who})`);
  if (r.also && r.also.length) judgeReview.push(`${where} "${w.cell}" also names ${r.also.map((n) => `\`${n}\``).join(', ')} (${who})`); });
coversItems.forEach((c) => { const r = coversRes.get(c.id); if (!r) return; const dropped = r.judged.filter((j) => j.p != null && j.p < COVERS.hi).map((j) => j.name); if (dropped.length) judgeReview.push(`"${c.text}" covers ${r.names.map((n) => `\`${n}\``).join(', ') || 'nothing'}; not ${dropped.map((n) => `\`${n}\``).join(', ')} (${r.by})`); });
relationItems.forEach((p) => { const r = relRes.get(p.id); if (!r || r.judged == null) return; if (r.relation === 'unrelated') judgeReview.push(`Communication "${p.first}" / "${p.second}": judged unrelated (${r.by} ${r.confidence}) — read as a new hop; no inner edge is implied by the sentence`); else if (!r.relation) judgeReview.push(`Communication "${p.first}" / "${p.second}": judged ${r.judged} at ${r.confidence}, below the band — undecided; no inner edge drawn`); });

const intFile = docFile('05-');
if (intFile) tables(read(intFile)).forEach((tb) => {
  const iFrom = col(tb.headers, ['From', 'Desde', 'Source', 'Origen']), iTo = col(tb.headers, ['To', 'Hacia', 'Target', 'Destino']), iP = col(tb.headers, ['Protocol', 'Protocolo', 'Label', 'Etiqueta']);
  if (iFrom < 0 || iTo < 0) return;
  tb.rows.filter((r) => /^I-\d+/i.test(plain(r[0]))).forEach((r) => {
    const id = plain(r[0]).toUpperCase(), label = [iP >= 0 ? plain(r[iP]) : '', id].filter(Boolean).join(' · ');
    const endpoints = (cell) => { // "`A` y `B` (APIM)" → [A, B]; "`X`, vía `Y`" → { targets: [X], via: Y }; an unresolved lone name → an actor
      const { parts, via } = splitEndpoint(cell);
      const targets = parts.map((s) => resolveName(s) || (parts.length === 1 && !unsure(s) && !undecided(s) && /^[\p{L}\p{N} .-]{2,}$/u.test(s) ? actorFor(s) : null)).filter(Boolean);   // a name the judge half-recognized, or has not answered, is neither a container nor an actor: it is reported
      return { targets, via: via ? resolveName(via) : null };
    };
    const from = endpoints(r[iFrom]), to = endpoints(r[iTo]);
    if (!from.targets.length || !to.targets.length) { warn(`docs/05 ${id}: "${plain(r[iFrom])}" → "${plain(r[iTo])}" — ${!from.targets.length ? 'source' : 'target'} names no container`); return; }
    from.targets.forEach((a) => to.targets.forEach((b) => { if (to.via) { addEdge(a, to.via, label, 'docs/05 ' + id); addEdge(to.via, b, label, 'docs/05 ' + id); } else addEdge(a, b, label, 'docs/05 ' + id); }));
  });
});
facts.forEach((f) => {
  const src = read(path.join(ROOT, f.path));
  tables(sectionBody(src, /^##\s+(Communication|Comunicación|Comunicacion)\b/i) || '').forEach((tb) => {
    const iFrom = col(tb.headers, ['From', 'Desde']), iTo = col(tb.headers, ['To', 'Hacia']), iP = col(tb.headers, ['Protocol', 'Protocolo']); if (iFrom < 0 || iTo < 0) return;
    const iD = col(tb.headers, ['Description', 'Descripción', 'Descripcion']);
    tb.rows.forEach((r) => {
      const desc = iD >= 0 ? plain(r[iD]) : '', src_ = rel(path.join(ROOT, f.path)) + ' Communication';
      const cited = (desc.match(/\bI-\d{1,3}\b/g) || []).map((x) => x.toUpperCase().replace(/I-(\d)$/, 'I-0$1'));
      if (cited.some((c) => edges.some((e) => (e.label || '').includes(c)))) return;   // docs/05 already carries this row under that id
      let a = resolveName(r[iFrom]), b = resolveName(r[iTo]);
      const sa = a ? null : sysOf(r[iFrom]), sb = b ? null : sysOf(r[iTo]);
      // an endpoint that is a system resolves to the container the Description names inside it — in order of mention, source first
      // (the containers of one system named in order form a chain: "a `Escritor`, que los escribe en el `Cache`" documents the inner hop too)
      const chainOf = (groups) => { for (let k = 0; k + 1 < groups.length; k++) { if (groups[k + 1].cut) continue; groups[k].forEach((x) => groups[k + 1].forEach((y) => addEdge(x, y, '', src_))); } };   // an undecided pair draws no inner edge
      let A = a ? [a] : [], B = b ? [b] : [];
      if (sa && sb && sa.id === sb.id) { const g = groupsNamedIn(desc, sa.id); if (g.length >= 2) { if (g[1].cut) return; A = g[0]; B = g[1]; chainOf(g.slice(1)); } }   // an undecided first pair may be parallel: no edge, reported under Undecided
      else { if (sa) { const g = groupsNamedIn(desc, sa.id); A = g.length ? g[g.length - 1] : []; chainOf(g); } if (sb) { const g = groupsNamedIn(desc, sb.id); B = g[0] || []; chainOf(g); } }
      a = A[0] || null; b = B[0] || null;
      // a row whose other end is a system, when docs/05 already draws an edge of the same protocol from this container into that system, is that edge's summary — docs/05 wins
      const proto = iP >= 0 ? norm(r[iP]) : '';
      const covered = (node, sys) => sys && node && edges.some((e) => e.fromDocs05 && norm((e.label || '').split(' · ')[0]) === proto && ((e.a === node.id && (nodes.find((n) => n.id === e.b) || {}).system === sys.id) || (e.b === node.id && (nodes.find((n) => n.id === e.a) || {}).system === sys.id)));
      if (covered(a, sb) || covered(b, sa)) return;
      if (a && b) A.forEach((x) => B.forEach((y) => addEdge(x, y, iP >= 0 ? plain(r[iP]) : '', src_)));
      else warn(`${src_}: "${plain(r[iFrom])}" → "${plain(r[iTo])}" — ${!a ? 'source' : 'target'} is a system and the Description does not name one of its containers by its canonical name; name it there, or add the edge in overrides`);
    });
  });
});
const layerOf = (id) => (nodes.find((n) => n.id === id) || {}).layer;
nodes.filter((n) => n.kind === 'actor').forEach((n) => { const e = edges.find((x) => x.a === n.id || x.b === n.id); if (e) n.layer = layerOf(e.a === n.id ? e.b : e.a); });
edges.forEach((e) => { if (Math.abs(layerOf(e.a) - layerOf(e.b)) >= 2) e.jump = true; });

// ---- phases: docs/04 Phase Catalog
const adj = {}; const link = (a, b) => { (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a); };
edges.forEach((e) => link(e.a, e.b));
const bfs = (from, to, allowed) => { if (from === to) return [from]; const prev = { [from]: null }, q = [from]; while (q.length) { const u = q.shift(); for (const v of adj[u] || []) { if (prev[v] !== undefined) continue; if (v !== to && allowed && !allowed(v)) continue; prev[v] = u; if (v === to) { const p = [to]; let c = to; while (prev[c] !== null) { c = prev[c]; p.unshift(c); } return p; } q.push(v); } } return null; };
const phases = {};
const flowsFile = docFile('04-');
const flowSrc = flowsFile ? read(flowsFile) : '';
const phaseBlock = (n) => sectionBody(flowSrc, new RegExp('^#{2,6}\\s+(Phase|Fase)\\s+' + n + '\\b', 'i'));   // any level — one project puts the catalog at H3/H4, another at H2/H3; a pinned `####` silently dropped every phase of the latter
const kindOf = (ph, hops, critical) => {
  const protos = hops.map(([a, b]) => (edgeByKey[ekey(a, b)] || {}).label || '').join(' ').toLowerCase();
  if (/\blote\b|batch|planificad|scheduled|nightly/.test(norm(critical)) || /\blote\b|batch/.test(protos)) return 'batch';
  if (/kafka|cdc|avro|wss|websocket|replic|sync|event|stream/.test(protos)) return 'async';
  if (hops.length && hops.every(([a, b]) => layerOf(a) === layers[0].n && layerOf(b) === layers[0].n)) return 'local';
  if (/integridad|integrity|sesi[oó]n|session|autentic|auth|borrad|delete|wipe|restitu|revoc|par[aá]metro|parameter|alta\b|onboard|registr/.test(norm(ph.name))) return 'control';
  return 'online';
};
const inferredKinds = [], synthesized = [];

// ---- the walk of a phase chain over the edge graph
// Each participant is a container, a name that covers several containers (the first travels, the rest light up
// as a branch), an explicit pair ("A y B" — both travel), a system (entered through the documented edge from
// the previous hop, crossed through its own containers to the next participant, or walked to its last
// container), or — none of those — an actor. A hop between two containers is the documented edge when there
// is one; when there is none: a store does not initiate, so the hop fans out from the last visited node that
// reaches the target; a single documented relay between the two is inserted; otherwise the edge is
// synthesized and reported.
const byId = (id) => nodes.find((n) => n.id === id);
const bfsAny = (from, isTarget, allowed) => { const prev = { [from]: null }, q = [from]; while (q.length) { const u = q.shift(); for (const v of adj[u] || []) { if (prev[v] !== undefined) continue; if (!isTarget(v) && !allowed(v)) continue; prev[v] = u; if (isTarget(v)) { const p = [v]; let c = v; while (prev[c] !== null) { c = prev[c]; p.unshift(c); } return p; } q.push(v); } } return null; };
const walkChain = (chain, num) => {
  const pathHops = [], extra = [], visited = [];
  const has = (a, b) => pathHops.concat(extra).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const push = (seq, a, b) => { if (a !== b && !has(a, b)) seq.push([a, b]); };
  const documented = (a, b) => { const e = edgeByKey[ekey(a.id, b.id)]; return !!e && !e.synthesized; };
  const synth = (a, b) => { if (!edgeByKey[ekey(a.id, b.id)]) { addEdge(a, b, '', 'phase ' + num); synthesized.push(`${a.name} → ${b.name} (phase ${num})`); } return [[a.id, b.id]]; };
  const hopsTo = (prev, node) => {
    if (documented(prev, node)) return [[prev.id, node.id]];
    if (prev.kind === 'store') { const v = [...visited].reverse().find((x) => documented(x, node)); if (v) return [[v.id, node.id]]; }
    const mids = nodes.filter((x) => x !== prev && x !== node && documented(prev, x) && documented(x, node));
    if (mids.length === 1) return [[prev.id, mids[0].id], [mids[0].id, node.id]];
    return synth(prev, node);
  };
  const walkInside = (from, sysId, seq) => { let cur = from; for (;;) { const next = [...(adj[cur.id] || [])].map(byId).filter((x) => x && x.system === sysId && !visited.includes(x) && !has(cur.id, x.id)); if (next.length !== 1) return cur; push(seq, cur.id, next[0].id); cur = next[0]; visited.push(cur); } };
  const parts = chain.map((part) => part.split(/\s*[·|]\s*/).map((s) => s.trim()).filter(Boolean).map((alt) => {
    if (nodeByNorm[norm(alt.replace(/\([^)]*\)/g, ''))]) return { nodes: [nodeByNorm[norm(alt.replace(/\([^)]*\)/g, ''))]], both: false };
    const pieces = alt.split(/\s+(?:y|and)\s+/); if (pieces.length > 1) { const r = pieces.map((pc) => resolvePrefix(pc)); if (r.every((x) => x.length)) return { nodes: r.flat(), both: true }; }   // "A y B": both travel
    const many = resolveMany(alt); if (many.length) return { nodes: many, both: false };
    const sys = sysOf(alt); if (sys) return { system: sys.id };
    if (undecided(alt) || unsure(alt)) return null;   // left out of the chain, reported under Undecided / Names to confirm
    return { nodes: [actorFor(alt)], both: false };
  }).filter(Boolean)).filter((alts) => alts.length);
  let prev = null, branches = [];
  parts.forEach((alts, pi) => {
    const nextAlts = parts[pi + 1] || null, nextNode = nextAlts && nextAlts[0].nodes ? nextAlts[0].nodes[0] : null;
    let mainEnd = null; const newBranches = [];
    alts.forEach((alt, i) => {
      if (alt.nodes) {
        alt.nodes.forEach((node, j) => {
          const seq = (i === 0 && j === 0) || alt.both || i > 0 ? pathHops : extra;
          if (prev) { hopsTo(prev, node).forEach(([a, b]) => push(seq, a, b)); branches.forEach((br) => { if (documented(br, node) || !documented(prev, node)) synth(br, node).forEach(([a, b]) => push(extra, a, b)); }); }
          if (node.kind === 'actor') node.layer = prev ? prev.layer : nextNode ? nextNode.layer : node.layer;
          if (i === 0 && j === 0) mainEnd = node; else newBranches.push(node);
        });
        return;
      }
      if (!prev) { warn(`phase ${num}: a chain cannot start at a system ("${alt.system}") — name its container`); return; }
      const sysId = alt.system, inside = (v) => (byId(v) || {}).system === sysId, through = prev.system;
      let cur = prev.system === sysId ? prev : null;
      if (!cur) {   // enter: from the previous hop (a fan-out alternative may start from any visited node), crossing only the system just left
        const starts = i === 0 ? [prev] : [prev].concat([...visited].reverse());
        let p = null; for (const s of starts) { p = bfsAny(s.id, inside, (v) => (byId(v) || {}).system === through); if (p) break; }
        if (!p) { warn(`phase ${num}: no documented edge path from "${prev.name}" into system "${sysId}"`); return; }
        for (let k = 0; k + 1 < p.length; k++) push(pathHops, p[k], p[k + 1]);
        cur = byId(p[p.length - 1]); visited.push(cur);
        if (i === 0) [...(adj[prev.id] || [])].map(byId).filter((x) => x && x.system === sysId && x !== cur).forEach((x) => { push(extra, prev.id, x.id); visited.push(x); walkInside(x, sysId, extra); });   // the other documented entries light up
      }
      if (nextNode && nextNode.system !== sysId) { const p = bfs(cur.id, nextNode.id, (v) => inside(v)); if (p && p.length > 2) { for (let k = 0; k + 2 < p.length; k++) push(pathHops, p[k], p[k + 1]); cur = byId(p[p.length - 2]); } }
      else cur = walkInside(cur, sysId, pathHops);
      if (i === 0) mainEnd = cur;
    });
    if (mainEnd) { prev = mainEnd; visited.push(mainEnd); } branches = newBranches;
  });
  return { path: pathHops, extra };
};
if (flowSrc) {
  const t = tables(flowSrc).find((tb) => col(tb.headers, ['Phase', 'Fase']) >= 0 && col(tb.headers, ['Owner', 'Propietario', 'Responsable']) >= 0);
  if (t) {
    const iN = 0, iName = col(t.headers, ['Phase', 'Fase']), iCrit = col(t.headers, ['On critical path', 'Crítico', 'Critico']), iOwner = col(t.headers, ['Owner', 'Propietario', 'Responsable']);
    t.rows.forEach((r) => {
      const num = plain(r[iN]).replace(/\D+$/, ''); if (!/^\d+[a-z]?$/i.test(num)) return;
      const block = phaseBlock(num) || '';
      const hopsLine = labelLine(block, ['Hops', 'Saltos']);
      const chain = (hopsLine || plain(r[iOwner] || '')).replace(/\([^)]*\)/g, '').split(/\s*(?:→|->|⇒)\s*/).map((s) => s.trim()).filter(Boolean);
      const { path: pathHops, extra } = walkChain(chain, num);
      const ph = { name: plain(r[iName]), budget: '', kind: null, path: pathHops, extra };
      const budget = labelLine(block, ['Latency budget \\(p95\\)', 'Presupuesto de latencia \\(p95\\)', 'Latency budget', 'Presupuesto de latencia']);
      if (budget) ph.budget = (budget.match(/[≤<]\s*[^,;]+/) || [budget.split(/[,;]/)[0]])[0].trim().replace(/\.$/, '');
      const baseKind = base && base.phases && base.phases[num] ? base.phases[num].kind : null, ovKind = overrides.phases && overrides.phases[num] ? overrides.phases[num].kind : null;
      ph.kind = ovKind || baseKind || kindOf(ph, ph.path, r[iCrit] || '');
      if (!ovKind && !baseKind) inferredKinds.push(`${num} ${ph.name} → ${ph.kind}`);
      phases[num] = ph;
    });
  } else warn('docs/04 has no Phase Catalog table (# | Phase | On critical path? | Owner | Failure mode) — no phases, no use cases');
}
// routes of an edge: the families of the phases that travel it
Object.values(phases).forEach((ph) => ph.path.concat(ph.extra).forEach(([a, b]) => { const e = edgeByKey[ekey(a, b)]; if (e && !e.routes.includes(ph.kind)) e.routes.push(ph.kind); }));
edges.forEach((e) => { if (!e.routes.length) e.routes = ['neutral']; if (e.routes.length === 1 && e.routes[0] === 'batch') e.dashed = true; });
const families = ['local', 'online', 'async', 'control', 'batch'].filter((f) => Object.values(phases).some((p) => p.kind === f));
const routes = families.map((f) => { const b = (base ? base.routes || [] : []).find((r) => r.color === f || r.id === f) || {}; return Object.assign({ id: f, name: T[f], color: f, desc: `${T.phases}: ${Object.entries(phases).filter(([, p]) => p.kind === f).map(([k, p]) => k + ' ' + p.name).join(' · ')}` }, b.budget ? { budget: b.budget } : {}, b.desc ? { desc: b.desc } : {}); });

// ---- use cases: Flow Inventory + flow blocks
const useCases = [], usedUc = new Set();
if (flowSrc) {
  const t = tables(flowSrc).find((tb) => col(tb.headers, ['Flow', 'Flujo']) >= 0 && col(tb.headers, ['Use Case', 'Caso de Uso']) >= 0);
  if (t) t.rows.forEach((r) => {
    const iF = col(t.headers, ['Flow', 'Flujo']), iUc = col(t.headers, ['Use Case', 'Caso de Uso']), iLat = col(t.headers, ['Latency Target', 'Objetivo de latencia', 'Latencia']);
    const m = plain(r[iF]).match(/^(\d+[a-z]?)\.\s*(.+)$/); if (!m) return;
    const code = m[1], name = m[2];
    const block = sectionBody(flowSrc, new RegExp('^#{2,6}\\s+(Flow|Flujo)\\s+' + code + '\\s*[—–-]', 'i')) || '';   // idem — every use case of that project was warned away as 'no **Phases** line'
    const phasesLine = labelLine(block, ['Phases', 'Fases']) || '';
    const ph = (phasesLine.split(/\(/)[0].match(/\d+[a-z]?/g) || []).map((x) => (phases[x] ? (/^\d+$/.test(x) ? +x : x) : null)).filter((x) => x != null);
    if (!ph.length) { warn(`flow ${code} "${name}": no **Phases** line resolving to catalogued phases — skipped`); return; }
    const ucIds = (plain(r[iUc]).match(/UC-?\d+/gi) || []).map((u) => u.toUpperCase().replace(/^UC(\d)/, 'UC-$1'));
    let id = ucIds.length === 1 && !usedUc.has(ucIds[0]) ? ucIds[0] : 'FLOW-' + code; usedUc.add(id);
    const uc = { id, code, name, target: iLat >= 0 ? (plain(r[iLat]).match(/[≤<]\s*[^,;(]+(\([^)]*\))?/) || [plain(r[iLat])])[0].trim() : '', phases: ph };
    const delta = labelLine(block, ['Delta']); if (delta) uc.desc = delta;
    const gov = block.match(/\*\*(Governed by|Gobernado por)\*\*\s*:?\s*(.+)/i); const adrs = gov ? [...new Set((gov[2].match(/ADR-\d{3}/g) || []))] : []; if (adrs.length) uc.adrs = adrs;
    useCases.push(uc);
  });
}

// ---- capacity (8.33.0): what Alia's load simulation reads — demand per use case from docs/08 § Demand by Use Case,
// capacity per container from the descriptors' Capacity tables (component-facts, normalized to rps), fan-out 1 per hop
// unless overridden, the instance's node from the base deployment. A missing number is a gap the view paints grey.
const capacityGaps = [];
const perfFile = docFile('08-');
const demandParsed = perfFile ? parseDemand(read(perfFile), useCases.map((u) => ({ id: u.id, phases: (u.phases || []).map(String) }))) : null;   // with the phases each declares, so a phase-qualified row (`UC-02 · F3`, 8.42.0) is checked against them
if (demandParsed) demandParsed.warnings.forEach((w) => warn(`docs/08 ${w}`));
const demand = (demandParsed ? demandParsed.rows : []).map((r) => ({ useCase: r.use_case, phase: r.phase || undefined, rps: r.rps, sessions: r.sessions, peakFactor: r.peak_factor, source: r.source || undefined, notDocumented: r.not_documented || undefined }));
useCases.forEach((u) => { if (!demand.some((d) => d.useCase === u.id && !d.phase)) capacityGaps.push({ useCase: u.id, field: 'demand', says: perfFile ? 'no row in docs/08 § Demand by Use Case' : 'docs/08 not found' }); });
demand.forEach((d) => { if (d.notDocumented) capacityGaps.push({ useCase: d.useCase, phase: d.phase, field: 'demand', says: 'Not documented' }); });
const baseInstances = base && base.deployment ? base.deployment.instances || [] : [];
const capInstances = nodes.filter((n) => n.layer != null && !actors.includes(n.name)).map((n) => {
  const f = facts.find((x) => x.file_backed !== false && norm(x.name) === norm(n.name)); const c = f && f.capacity;
  const inst = baseInstances.filter((i) => i.container === n.id);
  const row = { container: n.id, nodes: inst.map((i) => i.node), replicas: c ? c.replicas : null, maxReplicas: c ? c.max_replicas : null, capacityPerReplica: c ? c.capacity_per_replica_rps : null, capacityPerReplicaSessions: c ? c.capacity_per_replica_sessions : null, requestsPerTransaction: c ? c.requests_per_transaction : null, documentedDemand: c ? c.documented_demand_rps : null, documentedSessions: c ? c.documented_demand_sessions : null, requestSize: c ? c.request_size_bytes : null, responseSize: c ? c.response_size_bytes : null, sessionTransfer: c ? c.session_transfer_bps : null, flags: c ? c.flags : [], source: c ? (c.rows.find((r) => r.metric === 'capacity_per_replica') || {}).source || undefined : undefined };
  if (!c) capacityGaps.push({ container: n.id, field: 'capacity', says: 'no Capacity table in the descriptor' });
  else { if (row.capacityPerReplica == null && row.capacityPerReplicaSessions == null) capacityGaps.push({ container: n.id, field: 'capacity_per_replica', says: 'Not documented' }); if (row.replicas == null) capacityGaps.push({ container: n.id, field: 'replicas', says: 'Not documented' }); }
  Object.keys(row).forEach((k) => { if (row[k] === undefined) delete row[k]; }); return row;
});
const capacity = { unit: 'rps', threshold: 0.7, demand, fanout: [], instances: capInstances, gaps: capacityGaps, scenarios: [], pricing: {} };   // scenarios and pricing come from overrides.capacity — assumptions the architect wants on the page, never documentation

// ---- delivery increments (8.141.0): each increment's slice by sa-skills' increments.js, mapped onto the scene's node ids —
// the viewer's increment filter shows one piece of the target design; an edge is in it when the docs/05 id its label carries is
let increments;
try {
  const ledger = require(SA.fromSaSkills('scripts', 'shared', 'arch-facts.js')).collect(ROOT);
  const sl = require(SA.fromSaSkills('scripts', 'shared', 'increments.js')).slices(ledger);
  const nodeOf = (slug) => { const c = ledger.components.find((x) => x.slug === slug); const n = c && nodeByNorm[norm(c.name)]; return n ? n.id : null; };
  const ids = (slugs) => [...new Set(slugs.map(nodeOf).filter(Boolean))];
  if (sl.increments.length) increments = sl.increments.map((x) => ({ id: x.id, target: x.target || undefined, useCases: x.use_cases, cumulative: x.cumulative_use_cases,
    nodes: ids(x.containers.concat(x.systems)), newNodes: ids(x.new.containers), integrations: x.integrations,
    temporary: x.temporary.map((t) => Object.assign(t.kind === 'container' ? { node: nodeOf(t.key) } : { integration: t.key }, { until: t.until, tdr: t.tdr || undefined })).filter((t) => t.node !== null),
    retired: x.retired.containers.map((k) => (ledger.components.find((c) => c.slug === k) || { name: k }).name).concat(x.retired.integrations),
    gaps: x.gaps.length || undefined }));
} catch (e) { warn(`delivery increments not read: ${e.message}`); }

// ---- assemble, carry over, override, write
const internal = systems.filter((s) => s.owned).map((s) => s.id);
const scene = { project, version: marker('ARCHITECTURE_VERSION') || undefined, status: marker('ARCHITECTURE_STATUS') || undefined, architectureType: marker('ARCHITECTURE_TYPE') || (layersFile && (read(layersFile).match(/<!--\s*ARCHITECTURE_TYPE:\s*([^>]*?)\s*-->/) || [])[1]) || undefined, language,
  sources: [rel(path.join(ROOT, 'ARCHITECTURE.md')), layersFile && rel(layersFile), 'docs/components/**', flowsFile && rel(flowsFile), intFile && rel(intFile)].filter(Boolean).join(' · ') + ' — scene-from-docs.js',
  allDescription: T.all(nodes.filter((n) => internal.includes(n.system)).length, systems.filter((s) => !s.owned).length, useCases.length),
  layers, systems: systems.concat([]), nodes: nodes.map((n) => Object.assign({}, n, n.layer == null ? {} : {})), edges, routes, phases, useCases, capacity, increments };
const codeDropped = [];
if (base) { ['thesis', 'allDescription', 'theme', 'view', 'deployment'].forEach((k) => { if (base[k] !== undefined) scene[k] = base[k]; });
  // a base `code` is carried minus any internal identifier it hides: the derived `internal` is the identifier's only home
  const { identifierSegments, segments } = require(path.join(__dirname, 'identifier.js'));
  scene.nodes.forEach((n) => { const b = baseNodeByName[norm(n.name)]; if (b) { if (b.x != null) n.x = b.x; if (b.z != null) n.z = b.z;
    if (b.code && !n.code) { const ids = identifierSegments(b.code); const kept = segments(b.code).filter((s) => !ids.includes(s)); if (kept.length) n.code = kept.join(' · ');
      ids.forEach((id) => { if (n.internal && norm(id) === norm(n.internal)) codeDropped.push(`${n.name}: \`${id}\` (now \`internal\`, from the descriptor)`); else warn(`node "${n.name}": the base scene's code carried the identifier \`${id}\` that no descriptor declares — dropped; declare it in the descriptor (the **Internal Name:** row, or the Containers table column of the system's descriptor) and it returns as \`internal\``); }); } } });
  if (base.deployment) { const ids = new Set(scene.nodes.map((n) => n.id)); (base.deployment.instances || []).forEach((i) => { if (!ids.has(i.container)) warn(`base deployment places "${i.container}", which is no container of this scene — review deployment.instances`); }); } }
const merge = (dst, src) => { Object.entries(src || {}).forEach(([k, v]) => { if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) merge(dst[k], v); else dst[k] = v; }); return dst; };
if (overrides.nodes) Object.entries(overrides.nodes).forEach(([id, v]) => { const n = scene.nodes.find((x) => x.id === id || norm(x.name) === norm(id)); if (n) merge(n, v); else warn(`overrides.nodes["${id}"] names no node`); });
if (overrides.edges) overrides.edges.forEach((o) => { const e = scene.edges.find((x) => (x.a === o.a && x.b === o.b) || (x.a === o.b && x.b === o.a)); if (e) merge(e, o); else if (scene.nodes.some((n) => n.id === o.a) && scene.nodes.some((n) => n.id === o.b)) scene.edges.push(Object.assign({ routes: ['neutral'], label: '' }, o)); else warn(`overrides.edges ${o.a} → ${o.b} names an unknown node`); });
['thesis', 'allDescription', 'routes', 'useCases', 'layers', 'systems', 'theme', 'view', 'deployment', 'capacity'].forEach((k) => { if (overrides[k] !== undefined) scene[k] = overrides[k] && typeof overrides[k] === 'object' && !Array.isArray(overrides[k]) ? merge(scene[k] && typeof scene[k] === 'object' ? scene[k] : {}, overrides[k]) : overrides[k]; });
Object.entries(overrides.phases || {}).forEach(([k, v]) => { if (scene.phases[k]) merge(scene.phases[k], v); });
// a deployment node's fields by id or name (8.54.0) — `metered`, a note, a tech line — without rewriting the whole `deployment.nodes` array the base carries
if (overrides.deploymentNodes) Object.entries(overrides.deploymentNodes).forEach(([id, v]) => { const n = ((scene.deployment || {}).nodes || []).find((x) => x.id === id || norm(x.name) === norm(id)); if (n) merge(n, v); else warn(`overrides.deploymentNodes["${id}"] names no deployment node`); });
Object.keys(scene).forEach((k) => { if (scene[k] === undefined) delete scene[k]; });

const out = opt('--out');
if (args.includes('--json')) process.stdout.write(JSON.stringify(scene, null, 1) + '\n');
else { const target = path.resolve(out || CURRENT); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, JSON.stringify(scene, null, 1) + '\n'); console.error(`Wrote ${target}`);
  // the current scene replaces the dated pairs earlier versions accumulated
  if (target === CURRENT && dated.length) { dated.forEach((f) => fs.rmSync(f, { force: true })); console.error(`Retired ${dated.length} dated file(s): ${dated.map(rel).join(', ')}`); } }
const say = (s) => console.error(s);
say(`Scene: ${layers.length} layers, ${systems.length} systems (${internal.length} internal), ${nodes.length} nodes (${actors.length} actors), ${edges.length} edges, ${Object.keys(phases).length} phases, ${useCases.length} use cases, capacity: ${capInstances.filter((i) => i.capacityPerReplica != null || i.capacityPerReplicaSessions != null).length}/${capInstances.length} containers sized, ${demand.length} demand rows, ${capacityGaps.length} gaps`);
if (args.includes('--capacity-check')) {
  say('Capacity (rps) — what the load simulation reads; a grey cell in the view is a row below:');
  say(`  ${'container'.padEnd(28)} ${'cap/replica'.padStart(11)} ${'replicas'.padStart(8)} ${'max'.padStart(5)} ${'demand'.padStart(8)} ${'req B'.padStart(7)} ${'resp B'.padStart(7)} ${'ses B/s'.padStart(7)}  flags`);
  capInstances.forEach((i) => say(`  ${i.container.padEnd(28)} ${String(i.capacityPerReplica == null ? (i.capacityPerReplicaSessions != null ? i.capacityPerReplicaSessions + ' sess' : '—') : i.capacityPerReplica).padStart(11)} ${String(i.replicas == null ? '—' : i.replicas).padStart(8)} ${String(i.maxReplicas == null ? '—' : i.maxReplicas).padStart(5)} ${String(i.documentedDemand == null ? (i.documentedSessions != null ? i.documentedSessions + ' sess' : '—') : i.documentedDemand).padStart(8)} ${String(i.requestSize == null ? '—' : i.requestSize).padStart(7)} ${String(i.responseSize == null ? '—' : i.responseSize).padStart(7)} ${String(i.sessionTransfer == null ? '—' : i.sessionTransfer).padStart(7)}  ${(i.flags || []).join(', ')}`));
  say(`  demand: ${demand.length ? demand.map((d) => `${d.useCase}${d.phase ? ' · F' + d.phase : ''} ${d.rps != null ? d.rps + ' rps' : d.sessions != null ? d.sessions + ' sessions' : '—'} ×${d.peakFactor}`).join(' · ') : 'none'}`);
  if (capacityGaps.length) { say(`  gaps (${capacityGaps.length}) — each closes with one row (descriptor § Capacity, or docs/08 § Demand by Use Case):`); capacityGaps.forEach((g) => say(`    - ${g.container || (g.useCase + (g.phase ? ' · F' + g.phase : ''))}: ${g.field} — ${g.says}`)); }
}
if (actors.length) say(`Actors (chain participants that are no container): ${actors.join(', ')}`);
if (wantNames.size || coversItems.length || relationItems.length) say(`Names: ${wantNames.size} resolved by ${namesRes.engine}${coversItems.length ? ` · ${coversItems.length} plural(s)` : ''}${relationItems.length ? ` · ${relationItems.length} description pair(s)` : ''}`);
if (judgeNote) say(`  ${judgeNote}`);
if (undecidedReport.length) { say(`Undecided (${undecidedReport.length}) — the judge has not answered${judgePending ? `; answer the worksheets under ${path.dirname(judgePending)} and re-run` : ''}:`); undecidedReport.forEach((w) => say('  - ' + w)); }
if (judgeReview.length) { say(`Names to confirm (${judgeReview.length}):`); judgeReview.forEach((w) => say('  - ' + w)); }
if (synthesized.length) say(`Edges synthesized for phase hops with no docs/05 row or Communication row (${synthesized.length}): ${synthesized.join('; ')}`);
if (inferredKinds.length) say(`Phase kinds inferred from the hops' protocols (no base, no override — review): ${inferredKinds.join(' · ')}`);
if (codeDropped.length) say(`Identifiers moved out of the base scene's code (${codeDropped.length}): ${codeDropped.join('; ')}`);
if (warnings.length) { say(`Warnings (${warnings.length}):`); warnings.forEach((w) => say('  - ' + w)); }
