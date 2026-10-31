#!/usr/bin/env bun
'use strict';
// The storyboard of the architecture video, cut by code from the facts ledger: which scenes the architecture has material
// for, what each one shows (systems, layers, flows with their phases and budgets, decisions, debt), and the slots Alia's
// lines fill — each with its limit and the passages it may be written from. The session writes only those lines
// (lines.json); video-build.js turns storyboard + lines into the HyperFrames project.
//
//   bun video-prepare.js <project> [--out <dir>] [--flows N] [--json]
//
// Writes <out>/storyboard.json and <out>/lines.request.md (default <project>/.cache/sa-skills/video/).
const fs = require('fs');
const path = require('path');
const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));

const MAX_FLOWS = 5, MAX_ADRS = 6, MAX_TDRS = 5, MAX_PHASES = 7;
// every slot Alia fills: its limit in characters and what it is for
const SLOT = {
  'title.tagline':     { max: 110, what: 'What the system is, in one sentence a newcomer understands.' },
  'what.problem':      { max: 200, what: 'The problem the architecture answers.' },
  'what.solution':     { max: 200, what: 'How the architecture answers it, without technology names unless the sources lead with them.' },
  'chapter.context':   { max: 220, what: 'Alia introduces the system context: who the system talks to and why.' },
  'chapter.layers':    { max: 220, what: 'Alia introduces the layers: how the containers are organized.' },
  'chapter.flows':     { max: 220, what: 'Alia introduces the use cases: how a request moves through the system.' },
  'chapter.decisions': { max: 220, what: 'Alia introduces the decisions that shape the architecture.' },
  'chapter.risks':     { max: 220, what: 'Alia introduces what the architecture declares open: its technical debt.' },
  'end.closing':       { max: 160, what: 'Alia closes: what the viewer now knows and where to read more.' },
};
const FLOW_TIP = { max: 120, what: 'Optional. One tip on this flow — what to notice — from the flow block.' };

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const docByPrefix = (root, nn) => { const dir = path.join(root, 'docs'); if (!exists(dir)) return null; const f = fs.readdirSync(dir).find((x) => x.startsWith(nn + '-') && x.endsWith('.md')); return f ? path.join(dir, f) : null; };
const plain = (s) => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

// the text under an anchored heading or label, to the next heading of the same or higher rank (heading level read, never pinned)
function anchored(src, anchor, fallbackRe) {
  const lines = src.split('\n');
  let s = lines.findIndex((l) => new RegExp('<!--\\s*(SECTION|LABEL):\\s*' + anchor + '\\s*-->').test(l));
  if (s < 0 && fallbackRe) s = lines.findIndex((l) => /^(#{1,6}\s|\*\*)/.test(l) && fallbackRe.test(l));
  if (s < 0) return null;
  const lvl = /^#/.test(lines[s]) ? lines[s].match(/^#+/)[0].length : 99;
  const out = [];
  for (let i = s + 1; i < lines.length; i++) {
    const h = lines[i].match(/^(#+)\s/);
    if (h && h[1].length <= lvl) break;
    if (lvl === 99 && /^\*\*[^*]+\*\*/.test(lines[i]) && out.length) break;
    out.push(lines[i]);
  }
  const t = plain(out.join('\n'));
  return t ? t.slice(0, 1200) : null;
}

function prepare(root, opts = {}) {
  root = path.resolve(root);
  if (!exists(path.join(root, 'ARCHITECTURE.md'))) throw new Error(`no ARCHITECTURE.md in ${root}`);
  const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));
  const f = collect(root);
  const a = f.architecture;
  const lang = a.language === 'es' ? 'es' : 'en';
  const byName = new Map(f.components.map((c) => [c.name, c]));
  const sysName = new Map(f.systems.map((s) => [s.slug, s.name]));
  const systemOfExact = (name) => { const c = byName.get(name); if (!c) return null; return c.level === 'L1' ? c.name : (sysName.get(c.system) || null); };
  // a docs/05 cell may qualify its name — "Hub API (Payments Hub)", "X and Y, via Z": the qualifiers are dropped and each part
  // must then be a component's exact canonical name; anything else is not resolved here (a judgement, not this scene's)
  const systemsOf = (cell) => [...new Set(String(cell || '').replace(/\([^)]*\)/g, '').replace(/,?\s+(via|vía)\s+.*$/i, '').split(/\s+(?:and|y)\s+|\s*,\s*/).map((x) => systemOfExact(x.trim())).filter(Boolean))];
  const sources = {}, missing = [], scenes = [];

  // what it is: the executive summary and docs/01's Problem Statement and Solution, as the sources of three lines
  const archSrc = read(path.join(root, 'ARCHITECTURE.md'));
  const ov = docByPrefix(root, '01'); const ovSrc = ov ? read(ov) : '';
  sources.executive_summary = anchored(archSrc, 'Executive Summary', /Executive Summary|Resumen Ejecutivo/i) || anchored(ovSrc, 'Executive Summary', /Executive Summary|Resumen Ejecutivo/i);
  sources.problem = ovSrc ? anchored(ovSrc, 'Problem Statement', /Problem Statement|Planteamiento del Problema/i) : null;
  sources.solution = ovSrc ? anchored(ovSrc, 'Solution', /^(#{1,6}\s+|\*\*)(Solution|Soluci[oó]n)\b/i) : null;
  sources.business_value = ovSrc ? anchored(ovSrc, 'Business Value', /Business Value|Valor de Negocio/i) : null;
  if (!ov) missing.push('docs/01 not found — the overview scene needs its Problem Statement and Solution');

  scenes.push({ id: 'title', kind: 'title' });
  if (sources.problem || sources.solution || sources.executive_summary) scenes.push({ id: 'what', kind: 'overview' });

  // context: the systems and the integrations that cross a system boundary, counted per pair
  const owned = f.systems.filter((s) => s.owned), external = f.systems.filter((s) => !s.owned);
  const containersOf = (s) => f.components.filter((c) => c.level === 'L2' && c.system === s.slug).length;
  const pairs = new Map();
  for (const i of f.integrations.filter((x) => !x.retired)) {
    for (const sa of systemsOf(i.from)) for (const sb of systemsOf(i.to)) {
      if (sa === sb) continue;
      const k = [sa, sb].join('→');
      const p = pairs.get(k) || { from: sa, to: sb, count: 0, protocols: [] };
      p.count++; if (i.protocol && !p.protocols.includes(i.protocol)) p.protocols.push(i.protocol);
      pairs.set(k, p);
    }
  }
  if (f.systems.length) scenes.push({ id: 'context', kind: 'context', chapter: 'context', mood: 'calm',
    owned: owned.map((s) => ({ name: s.name, containers: containersOf(s) })),
    external: external.map((s) => ({ name: s.name, containers: containersOf(s) })),
    links: [...pairs.values()] });
  else missing.push('no system descriptors — the context scene is left out');

  if (f.layers.length) scenes.push({ id: 'layers', kind: 'layers', chapter: 'layers', mood: 'calm',
    type: a.type || null, layers: f.layers.map((l) => ({ n: l.n, name: l.name, owned: l.owned, containers: l.containers })) });
  else missing.push('no layer table in docs/03 § 4.1 — the layers scene is left out');

  // flows: each with its phases in order, their owner chains and budgets, against the flow's target
  const phase = new Map(f.phases.map((p) => [String(p.n), p]));
  const flows = f.flows.filter((fl) => fl.phases.length && fl.phases.every((n) => phase.has(String(n)))).slice(0, opts.flows || MAX_FLOWS);
  flows.forEach((fl, k) => scenes.push({ id: `flow-${fl.code}`, kind: 'flow', chapter: k === 0 ? 'flows' : null, mood: 'thinking',
    code: fl.code, name: fl.name, trigger: fl.trigger || null, target: fl.latency_target || null, use_cases: fl.use_cases, governed_by: fl.governed_by,
    phases: fl.phases.slice(0, MAX_PHASES).map((n) => { const p = phase.get(String(n)); return { n: String(n), name: p.name, owner_chain: p.owner_chain || null, budget: p.latency_budget || null }; }),
    more_phases: Math.max(0, fl.phases.length - MAX_PHASES) }));
  if (!flows.length) missing.push('no flow whose phases resolve in the Phase Catalog — no use-case scene');
  f.flows.filter((fl) => !flows.includes(fl)).forEach((fl) => sources[`flow_skipped_${fl.code}`] = `${fl.name}: ${fl.phases.length ? 'beyond the first ' + (opts.flows || MAX_FLOWS) + ' flows or a phase not in the catalog' : 'no **Phases** line'}`);
  flows.forEach((fl) => { sources[`flow_${fl.code}`] = [fl.name, fl.trigger && `trigger: ${fl.trigger}`, fl.latency_target && `target: ${fl.latency_target}`, fl.delta && `delta: ${fl.delta}`, `phases: ${fl.phases.map((n) => phase.get(String(n)).name).join(' → ')}`].filter(Boolean).join(' · '); });

  // decisions: the project's ADRs in force (101+, Accepted); none, the institutional ones in force
  const inForce = f.adrs.filter((d) => /^accepted$/i.test(d.status || ''));
  const project = inForce.filter((d) => Number((d.id.match(/\d+/) || [0])[0]) > 100);
  const shown = (project.length ? project : inForce).sort((x, y) => x.id.localeCompare(y.id)).slice(0, MAX_ADRS);
  if (shown.length) scenes.push({ id: 'decisions', kind: 'decisions', chapter: 'decisions', mood: 'pleased', scope: project.length ? 'project' : 'institutional',
    total: (project.length ? project : inForce).length, adrs: shown.map((d) => ({ id: d.id, title: plain(d.title), status: d.status })) });
  else missing.push('no ADR in status Accepted — the decisions scene is left out');

  // debt: the TDRs still open, by status; Resolved and Won't Fix are not debt the viewer carries
  const open = f.tdrs.filter((t) => !/^(resolved|won't fix)$/i.test(t.status || ''));
  if (open.length) {
    const by = {}; open.forEach((t) => { by[t.status || 'Open'] = (by[t.status || 'Open'] || 0) + 1; });
    scenes.push({ id: 'risks', kind: 'risks', chapter: 'risks', mood: 'worried', total: open.length, by_status: by,
      tdrs: open.slice(0, MAX_TDRS).map((t) => ({ id: t.id, title: plain(t.title), status: t.status || 'Open' })) });
  }

  scenes.push({ id: 'end', kind: 'end' });

  // the slots this storyboard needs
  const slots = {};
  const want = (k, s) => { slots[k] = s; };
  want('title.tagline', SLOT['title.tagline']);
  if (scenes.some((s) => s.kind === 'overview')) { want('what.problem', SLOT['what.problem']); want('what.solution', SLOT['what.solution']); }
  scenes.filter((s) => s.chapter).forEach((s) => want(`chapter.${s.chapter}`, SLOT[`chapter.${s.chapter}`]));
  scenes.filter((s) => s.kind === 'flow').forEach((s) => want(`flow.${s.code}.tip`, { ...FLOW_TIP, optional: true }));
  want('end.closing', SLOT['end.closing']);

  return { schema: 'sa-video/1', generated_at: new Date().toISOString(), project_root: root,
    architecture: { name: a.name, version: a.version, status: a.status, released: a.released, type: a.type, language: lang },
    scenes, slots, sources, missing };
}

function request(sb) {
  const L = [`# Alia's lines — ${sb.architecture.name} v${sb.architecture.version}`, '',
    `Write \`lines.json\` beside this file: one key per slot below, a plain-text string in **${sb.architecture.language === 'es' ? 'Spanish' : 'English'}**.`,
    'Rules — video-build.js refuses a line that breaks one and the scene renders without it:',
    '- From the sources below only: no fact, figure or name they do not state. Components by their canonical full name.',
    '- Plain text, one line: no Markdown, no line break, within the limit. Alia speaks in the first person to the viewer, present tense.', '',
    '| Slot | Max | Purpose |', '|---|---|---|',
    ...Object.entries(sb.slots).map(([k, s]) => `| \`${k}\` | ${s.max} | ${s.what} |`), '',
    '## Sources', ''];
  for (const [k, v] of Object.entries(sb.sources)) if (v) L.push(`**${k}**: ${v}`, '');
  const sc = (kind) => sb.scenes.filter((s) => s.kind === kind);
  if (sc('context').length) { const c = sc('context')[0]; L.push(`**context**: owned ${c.owned.map((s) => `${s.name} (${s.containers} containers)`).join(', ') || 'none'}; external ${c.external.map((s) => s.name).join(', ') || 'none'}; ${c.links.length} cross-system links.`, ''); }
  if (sc('layers').length) L.push(`**layers**: ${sc('layers')[0].layers.map((l) => `${l.n} ${l.name} (${l.containers.join(', ') || 'no containers'})`).join(' · ')}`, '');
  if (sc('decisions').length) L.push(`**decisions**: ${sc('decisions')[0].adrs.map((d) => `${d.id} ${d.title}`).join(' · ')}`, '');
  if (sc('risks').length) L.push(`**debt**: ${sc('risks')[0].total} open — ${sc('risks')[0].tdrs.map((t) => `${t.id} ${t.title} (${t.status})`).join(' · ')}`, '');
  if (sb.missing.length) L.push('## Left out', '', ...sb.missing.map((m) => `- ${m}`), '');
  return L.join('\n');
}

module.exports = { prepare, request, anchored, SLOT, FLOW_TIP };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const root = argv.find((x, i) => !x.startsWith('--') && !['--out', '--flows', '--sa-skills'].includes(argv[i - 1]));
  if (!root) { console.error('usage: bun video-prepare.js <project> [--out <dir>] [--flows N] [--json]'); process.exit(2); }
  try {
    const sb = prepare(root, { flows: opt('--flows') ? Number(opt('--flows')) : undefined });
    const out = path.resolve(opt('--out') || path.join(sb.project_root, '.cache', 'sa-skills', 'video'));
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'storyboard.json'), JSON.stringify(sb, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'lines.request.md'), request(sb) + '\n');
    if (argv.includes('--json')) console.log(JSON.stringify(sb, null, 2));
    else {
      console.log(`storyboard: ${sb.scenes.map((s) => s.id).join(' · ')}`);
      console.log(`slots: ${Object.keys(sb.slots).length} — write ${path.join(out, 'lines.json')} from ${path.join(out, 'lines.request.md')}`);
      sb.missing.forEach((m) => console.log(`left out: ${m}`));
    }
  } catch (e) { console.error(`video-prepare: ${e.message}`); process.exit(1); }
}
