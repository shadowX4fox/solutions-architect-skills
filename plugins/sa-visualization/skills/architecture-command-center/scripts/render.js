#!/usr/bin/env node
// Renders VIEWER_TEMPLATE.html with a scene JSON into a self-contained HTML file.
// Usage: bun render.js <scene.json> <output.html> [--lang es|en] [--theme <skin id>] [--skins <dir>] [--view logical|physical]
// No dependencies. Runs under Bun (the plugin's runtime); plain Node also works. The template
// ships in this script's parent directory.
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: bun render.js <scene.json> <output.html> [--lang es|en] [--theme <skin id>] [--skins <dir>] [--view logical|physical]');
  process.exit(1);
}
const [scenePath, outPath] = args;
const opt = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
// the skins: the plugin's skins/ and the project's (--skins <dir>, else a skins/ folder beside the scene), validated — see scripts/skins.js
const SKINS = require(path.join(__dirname, 'skins.js'));
const VIEWS = ['logical', 'physical'];     // the view the file opens with; physical needs scene.deployment
const PATH_CLASSES = ['Private Link', 'Peering', 'VPN', 'Service Mesh', 'Direct Connect', 'Public Internet'];
const templatePath = path.join(__dirname, '..', 'VIEWER_TEMPLATE.html');
const { identifierSegments } = require(path.join(__dirname, 'identifier.js'));

const scene = JSON.parse(fs.readFileSync(scenePath, "utf8").replace(/\r\n?/g, "\n"));
const projectSkins = opt('--skins') || (fs.existsSync(path.join(path.dirname(path.resolve(scenePath)), 'skins')) ? path.join(path.dirname(path.resolve(scenePath)), 'skins') : null);
// the architecture project: the folder above visualizations/ when the scene sits there, else the working directory — an institution
// pack installed for it adds skins and defaults
const sceneDir = path.dirname(path.resolve(scenePath)), projectRoot = path.basename(sceneDir) === 'visualizations' ? path.dirname(sceneDir) : process.cwd();
const loaded = SKINS.loadSkins(projectSkins, projectRoot);
const packTheme = (() => { try { const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js')); return require(fromSaSkills('scripts', 'shared', 'packs.js')).defaults({ project: projectRoot }).theme; } catch (e) { return null; } })();
if (loaded.errors.length) { console.error('Skins that do not pass the schema (skins/schema.json):\n  - ' + loaded.errors.join('\n  - ')); process.exit(1); }
const THEMES = loaded.skins.map((s) => s.id);   // ordered by "order"; the first is the default
const lang = opt('--lang') || scene.language || 'en';
const theme = opt('--theme') || scene.theme || (packTheme && THEMES.includes(packTheme) ? packTheme : THEMES[0]);
const view = opt('--view') || scene.view || VIEWS[0];
if (!THEMES.includes(theme)) { console.error(`Unknown theme "${theme}". Available: ${THEMES.join(', ')}`); process.exit(1); }
if (!VIEWS.includes(view)) { console.error(`Unknown view "${view}". Available: ${VIEWS.join(', ')}`); process.exit(1); }

// ---- Minimal validation: fail loudly on the mistakes that render as an empty scene ----
const errors = [], warnings = [];
if (!Array.isArray(scene.layers) || !scene.layers.length) errors.push('scene.layers must be a non-empty array');
if (!Array.isArray(scene.nodes) || !scene.nodes.length) errors.push('scene.nodes must be a non-empty array');
const ids = new Set((scene.nodes || []).map(n => n.id));
const layerNums = new Set((scene.layers || []).map(l => l.n));
const sysIds = new Set((scene.systems || []).map(s => s.id));
(scene.nodes || []).forEach(n => {
  if (!layerNums.has(n.layer)) errors.push(`node "${n.id}" references unknown layer ${n.layer}`);
  if (n.kind !== 'actor' && !sysIds.has(n.system)) errors.push(`node "${n.id}" references unknown system "${n.system}"`);
  if (n.internal != null && (typeof n.internal !== 'string' || !n.internal.trim())) errors.push(`node "${n.id}": internal must be a non-empty string (the container's internal name)`);
  if (n.internal && n.internal === n.name) warnings.push(`node "${n.id}": internal equals the canonical name — omit it when they do not differ`);
  // `code` is the BIAN eyebrow; an internal identifier written there survives every regeneration unvalidated and hides from the docs
  const ids = identifierSegments(n.code); if (ids.length) errors.push(`node "${n.id}": code carries an internal identifier (${ids.map((s) => '`' + s + '`').join(', ')}) — it belongs in \`internal\`, taken from the descriptor's **Internal Name:** row or its Containers table column; code keeps only the BIAN reference`);
});
(scene.edges || []).forEach(e => {
  if (!ids.has(e.a) || !ids.has(e.b)) errors.push(`edge ${e.a} -> ${e.b} references an unknown node`);
});
const edgeKeys = new Set((scene.edges || []).map(e => [e.a, e.b].sort().join('|')));
Object.entries(scene.phases || {}).forEach(([pid, ph]) => {
  [...(ph.path || []), ...(ph.extra || [])].forEach(([a, b]) => {
    if (!edgeKeys.has([a, b].sort().join('|'))) errors.push(`phase ${pid} hop ${a} -> ${b} has no matching edge`);
  });
});
(scene.useCases || []).forEach(u => {
  (u.phases || []).forEach(p => { if (!(scene.phases || {})[p]) errors.push(`use case ${u.id} references unknown phase ${p}`); });
});
// delivery increments (8.141.0): every node an increment names is a node of the scene
(scene.increments || []).forEach(x => {
  [...(x.nodes || []), ...(x.newNodes || []), ...(x.temporary || []).map(t => t.node).filter(Boolean)].forEach(id => { if (!ids.has(id)) errors.push(`increment ${x.id} references unknown node "${id}"`); });
});

// ---- Physical view: scene.deployment — tiers, nested nodes, container instances, undirected paths ----
const dep = scene.deployment;
if (view === 'physical' && !dep) errors.push('--view physical needs scene.deployment (tiers, nodes, instances, paths)');
if (dep) {
  if (!Array.isArray(dep.tiers) || !dep.tiers.length) errors.push('deployment.tiers must be a non-empty array');
  if (!Array.isArray(dep.nodes) || !dep.nodes.length) errors.push('deployment.nodes must be a non-empty array');
  const tierNums = new Set((dep.tiers || []).map(t => t.n));
  const nodes = dep.nodes || [], nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const instances = dep.instances || [];
  const instIds = new Set(instances.map(i => i.id || (i.container + '@' + i.node)));
  const hasChildren = new Set(nodes.filter(n => n.parent).map(n => n.parent));
  nodes.forEach(n => {
    if (!n.id) errors.push('every deployment node needs an id');
    if (n.parent && !nodeById[n.parent]) errors.push(`deployment node "${n.id}" references unknown parent "${n.parent}"`);
    if (n.tier != null && !tierNums.has(n.tier)) errors.push(`deployment node "${n.id}" references unknown tier ${n.tier}`);
    // a node that carries blocks (a leaf, or one with instances) needs a tier of its own or from an
    // ancestor; a node that only contains other nodes (a region) may span whatever tiers they sit on
    let c = n; const seen = new Set();
    while (c && c.tier == null && c.parent && nodeById[c.parent] && !seen.has(c.id)) { seen.add(c.id); c = nodeById[c.parent]; }
    if (seen.has(c && c.id)) errors.push(`deployment node "${n.id}" is inside a parent cycle`);
    else if ((!c || c.tier == null) && (!hasChildren.has(n.id) || instances.some(i => i.node === n.id))) errors.push(`deployment node "${n.id}" has no tier and no ancestor with one`);
    if (instIds.has(n.id)) errors.push(`deployment node "${n.id}" collides with an instance id`);
    // metered (8.54.0): what the node's provider bills — `by` bytes (the only meter the simulation computes today) or requests, `direction` in | out | both
    if (n.metered != null) { if (typeof n.metered !== 'object') errors.push(`deployment node "${n.id}": metered must be { by: "bytes" | "requests", direction?: "in" | "out" | "both", source? }`); else { if (n.metered.by != null && !['bytes', 'requests'].includes(n.metered.by)) warnings.push(`deployment node "${n.id}": metered.by "${n.metered.by}" is not bytes | requests`); if (n.metered.direction != null && !['in', 'out', 'both'].includes(n.metered.direction)) warnings.push(`deployment node "${n.id}": metered.direction "${n.metered.direction}" is not in | out | both — out is assumed`); } }
  });
  instances.forEach(i => {
    if (!ids.has(i.container)) errors.push(`instance of "${i.container}" references an unknown container`);
    else if ((scene.nodes.find(n => n.id === i.container) || {}).kind === 'actor') errors.push(`instance of "${i.container}": actors are not containers and are not placed on nodes`);
    if (!nodeById[i.node]) errors.push(`instance of "${i.container}" references unknown node "${i.node}"`);
  });
  (dep.paths || []).forEach((p, k) => {
    const label = `path ${k + 1} (${p.a} — ${p.b})`;
    [p.a, p.b].forEach(x => { if (!nodeById[x] && !instIds.has(x)) errors.push(`${label} references "${x}", which is neither a node nor an instance`); });
    if (!p.transport) warnings.push(`${label} has no transport form (e.g. "TLS:443")`);
    else if (!/^[A-Za-z0-9+.\/-]+(:\d+)?$/.test(p.transport)) warnings.push(`${label}: transport "${p.transport}" is not <TRANSPORT>[:<port>] — no Action Type, no qualifiers on a deployment path`);
    if (!p.pathClass) warnings.push(`${label} has no pathClass — "Public Internet" is stated, never left blank`);
    else if (!PATH_CLASSES.includes(p.pathClass)) warnings.push(`${label}: pathClass "${p.pathClass}" is not registered (${PATH_CLASSES.join(' · ')}); drawn unclassified`);
  });
  // containers of the internal system(s) that no instance places: the physical view will not draw them
  const owned = new Set((scene.systems || []).filter(s => s.owned).map(s => s.id));
  const placed = new Set(instances.map(i => i.container));
  const missing = (scene.nodes || []).filter(n => owned.has(n.system) && n.kind !== 'actor' && !placed.has(n.id)).map(n => n.id);
  if (missing.length) warnings.push(`no instance places these internal containers on a node: ${missing.join(', ')}`);
}
const instIdsAll = new Set(((scene.deployment || {}).instances || []).map(i => i.id || (i.container + '@' + i.node)));
// ---- Capacity (8.34.0): the load simulation's base — every instance names a scene container, every demand row a use case
if (scene.capacity) {
  const c = scene.capacity;
  if (!Array.isArray(c.instances)) errors.push('capacity.instances must be an array (scene-from-docs.js writes it)');
  else c.instances.forEach(i => { if (!ids.has(i.container)) errors.push(`capacity.instances: "${i.container}" is no container of this scene`); });
  if (!Array.isArray(c.demand)) errors.push('capacity.demand must be an array');
  else { const ucs = new Set((scene.useCases || []).map(u => u.id)); c.demand.forEach(d => { if (!ucs.has(d.useCase)) warnings.push(`capacity.demand names ${d.useCase}, which is no use case of this scene`); }); }
  if (c.threshold != null && !(c.threshold > 0 && c.threshold <= 1)) errors.push('capacity.threshold must be in (0, 1]');
  if (c.scenarios != null) { if (!Array.isArray(c.scenarios)) errors.push('capacity.scenarios must be an array of { name, scale?, demand?, down?, overrides? }');
    else c.scenarios.forEach((sc, k) => { if (!sc || !sc.name) errors.push(`capacity.scenarios[${k}] needs a name`); Object.keys((sc && sc.overrides) || {}).forEach(id => { if (!ids.has(id)) errors.push(`capacity.scenarios[${k}] "${sc.name}" overrides "${id}", which is no container of this scene`); }); (sc && sc.down || []).forEach(d => { if (!instIdsAll.has(d)) warnings.push(`capacity.scenarios[${k}] "${sc.name}" marks down "${d}", which is no instance (container@node) of this scene`); }); if (sc && sc.metrics != null) { if (!Array.isArray(sc.metrics)) errors.push(`capacity.scenarios[${k}] "${sc.name}": metrics must be an array of rps | sessions | bytes`); else sc.metrics.forEach(m => { if (!['rps', 'sessions', 'bytes'].includes(m)) warnings.push(`capacity.scenarios[${k}] "${sc.name}": metric "${m}" is not rps | sessions | bytes — ignored`); }); } }); }
  // pricing (8.54.0): a price per GB for a metered deployment node, from the overrides — an assumption the finding names as one
  if (c.pricing != null) { if (typeof c.pricing !== 'object' || Array.isArray(c.pricing)) errors.push('capacity.pricing must be a map { <deployment node id>: { perGB, currency?, source? } }'); else { const depNodes = new Set((((scene.deployment || {}).nodes) || []).map(n => n.id)); Object.entries(c.pricing).forEach(([id, p]) => { if (!depNodes.has(id)) warnings.push(`capacity.pricing names "${id}", which is no deployment node`); else if (!p || typeof p.perGB !== 'number') errors.push(`capacity.pricing["${id}"] needs a numeric perGB`); else if (!((scene.deployment.nodes.find(n => n.id === id) || {}).metered)) warnings.push(`capacity.pricing["${id}"] prices a node that is not metered — the price is never applied`); }); } }
  const sized = (c.instances || []).filter(i => i.capacityPerReplica != null || i.capacityPerReplicaSessions != null).length;
  if ((c.instances || []).length && !sized) warnings.push('capacity: no container states capacity_per_replica — the Simulation mode will paint every instance grey until the descriptors carry their Capacity tables');
}
// ---- Alia's dossier: what the ADR files say, keyed by ADR id
if (scene.dossier) {
  const adrs = scene.dossier.adrs;
  if (!adrs || typeof adrs !== 'object') errors.push('dossier.adrs must be an object keyed by ADR id');
  else Object.entries(adrs).forEach(([id, e]) => {
    if (!/^ADR-\d{3}$/.test(id)) errors.push(`dossier entry "${id}" is not an ADR id`);
    if (!e || !e.title) errors.push(`dossier entry ${id} needs a title`);
  });
  const d = scene.dossier;
  if (d.tdrs && typeof d.tdrs !== 'object') errors.push('dossier.tdrs must be an object keyed by TDR id');
  if (d.compliance && !Array.isArray((d.compliance || {}).contracts)) errors.push('dossier.compliance.contracts must be an array');
  if (d.components) Object.keys(d.components).forEach(id => { if (!(scene.nodes || []).some(n => n.id === id)) errors.push(`dossier.components["${id}"] is not a scene node`); });
  if (d.integrations && !Array.isArray(d.integrations)) errors.push('dossier.integrations must be an array');
  if (d.sections) { if (!Array.isArray(d.sections)) errors.push('dossier.sections must be an array'); else d.sections.forEach((s, i) => { if (!s.id || !s.title || !Array.isArray(s.outline)) errors.push(`dossier.sections[${i}] needs id, title and outline[]`); }); }
  if (d.findings) { if (!Array.isArray(d.findings)) errors.push('dossier.findings must be an array'); else d.findings.forEach((a, i) => { if (!a.analysis || !Array.isArray(a.items)) errors.push(`dossier.findings[${i}] needs analysis and items[]`); }); }
  const cited = new Set([...(scene.nodes || []), ...(scene.useCases || []), ...((scene.deployment || {}).nodes || [])].flatMap(x => x.adrs || []));
  const missing = [...cited].filter(id => !(adrs || {})[id]);
  if (missing.length) warnings.push(`dossier has no entry for cited ${missing.join(', ')} — Alia will say so when they are clicked`);
}
if (errors.length) {
  console.error('Scene validation failed:\n  - ' + errors.join('\n  - '));
  process.exit(2);
}
if (warnings.length) console.warn('Warnings:\n  - ' + warnings.join('\n  - '));

let html = fs.readFileSync(templatePath, "utf8").replace(/\r\n?/g, "\n");
const simulationJs = fs.readFileSync(path.join(__dirname, 'simulation.js'), "utf8").replace(/\r\n?/g, "\n").replace(/<\/script/gi, '<\\/script');   // the load model, one file for the viewer, Alia and the tests
const simExportJs = fs.readFileSync(path.join(__dirname, 'sim-export.js'), "utf8").replace(/\r\n?/g, "\n").replace(/<\/script/gi, '<\\/script');   // the scenarios as an Excel workbook, built in the page (8.56.0)
const json = JSON.stringify(scene).replace(/<\/script/gi, '<\\/script');
html = html
  .replace('/*__SCENE_DATA__*/{}', json)
  .replace('/*__SIMULATION_JS__*/', () => simulationJs)
  .replace('/*__SIM_EXPORT_JS__*/', () => simExportJs)
  .replace('__DOC_LANGUAGE__', lang)
  .replace('__THEME__', theme)
  .replace('/*__SKIN_TOKENS__*/', () => SKINS.tokensCss(loaded.skins, theme))
  .replace('/*__SKIN_RULES__*/', () => SKINS.rulesCss(loaded.skins))
  .replace('<!--__SKIN_FONTS__-->', () => SKINS.fontLinks(loaded.skins))
  .replace('__SKINS__', () => JSON.stringify(SKINS.pageSkins(loaded.skins)).replace(/<\//g, '<\\/'))
  .replace('__SKIN_IDS__', () => JSON.stringify(THEMES))
  .replace('__SKIN_LOOKS__', () => JSON.stringify(Object.fromEntries(loaded.skins.map((s) => [s.id, s.json.look]))))
  .replace('__VIEW__', view)
  .replace('__PROJECT_NAME__', String(scene.project || 'Architecture').replace(/[<>&]/g, ''));
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, html);
const phys = dep ? `, physical: ${(dep.nodes || []).length} nodes / ${(dep.instances || []).length} instances / ${(dep.paths || []).length} paths` : '';
// the viewer shows one report per lens, the latest (8.92.2) — the receipt counts what it shows
const latestFindings = (all) => { const k = (a) => String(a.analysis || a.file), m = {}; all.forEach(a => { if (!m[k(a)] || String(a.date || '') >= String(m[k(a)].date || '')) m[k(a)] = a; }); return all.filter(a => m[k(a)] === a); };
const doss = scene.dossier && scene.dossier.adrs ? `, dossier: ${Object.keys(scene.dossier.adrs).length} ADRs` + (scene.dossier.tdrs ? ` / ${Object.keys(scene.dossier.tdrs).length} TDRs` : '') + (scene.dossier.compliance ? ` / ${scene.dossier.compliance.contracts.length} contracts` : '') + (scene.dossier.components ? ` / ${Object.keys(scene.dossier.components).length} descriptors` : '') + (scene.dossier.integrations ? ` / ${scene.dossier.integrations.length} integrations` : '') + (scene.dossier.findings ? ` / ${latestFindings(scene.dossier.findings).reduce((n, a) => n + a.items.length, 0)} findings in ${latestFindings(scene.dossier.findings).length} analyses` : '') : '';
console.log(`Wrote ${outPath} (${scene.nodes.length} nodes, ${(scene.edges || []).length} edges, ${(scene.useCases || []).length} use cases${phys}${doss}, lang=${lang}, theme=${theme}, view=${view}${['pack', 'project'].map((w) => Object.values(loaded.from).includes(w) ? `, ${w} skins: ` + Object.keys(loaded.from).filter((k) => loaded.from[k] === w).join(' ') : '').join('')})`);
