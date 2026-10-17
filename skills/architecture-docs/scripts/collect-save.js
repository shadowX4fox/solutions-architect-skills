#!/usr/bin/env node
// collect-save.js — the collection record a create leaves behind before anything is written.
//
//   bun collect-save.js <project-root> --lang en|es --type <id from arch-types.js: ENTERPRISE|MICROSERVICES|3-TIER|N-LAYER|BIAN, or a pack's>
//                       [--po-spec <file>] [--po-score <n>] [--framework <id|none>] [--alignment <file>] [--bian <file> (= --framework BIAN --alignment <file>)] [--hld <file>] [--hld-format mermaid|pdf|svg|png]
//                       [--systems <json>] [--supplementary <file>] [--architect <name>] [--plugin-version <v>]
//                       [--checkpoints manual|auto] [--adr-status proposed|accepted|decided-accepted] [--adr-optional write|skip]
//                       [--diagrams none|A,B,C,D,E] [--json]
//   bun collect-save.js <project-root> --show
//
// Workflow 1 spends its first four steps collecting: the language, the PO Spec and its score, the BIAN
// alignment, the HLD and its format, the architecture type, the ADR Context Block, the user's answers
// (which systems are internal, which are dependencies). Through 8.30.0 all of that lived in the
// orchestrator's context and reached disk only when ARCHITECTURE.md was written — last — so a script that
// ran earlier (flow-compose.js) could not know the language, and a second session could not resume.
//
// This writes `.cache/sa-skills/collect.json`: everything a writer needs to author the documents without
// asking again. `architecture-docs` Step 4.9 writes it; the resume receipt and the segment runners read it
// in a fresh session. Paths are stored relative to the project.
// `--systems` is the C4 L1 answer as JSON: [{ "name", "role": "internal|external", "containers": [...] }].
// `--adr-status` / `--adr-optional` (8.118.6) are the Step 6 answer asked at Step 4.9: the status of the project ADRs
// (all Proposed, all Accepted, or Accepted for the candidates the collection decided) and whether candidates no section
// resolves are written too. Asked with the collection so the run needs no answer after it starts; Step 6 asks only when
// the record carries none. `--diagrams` (8.118.8) is the Step 7.2 answer, asked at Step 4.9 for the same reason: the
// optional diagrams to generate (`none`, or letters A–E of the 7.2 menu).
'use strict';
const fs = require('fs');
const path = require('path');

const archTypes = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'arch-types.js'));
const rel = (root, p) => (p ? path.relative(root, path.resolve(root, p)).replace(/\\/g, '/') : null);

function build(root, o) {
  const errors = [];
  const lang = String(o.lang || '').toLowerCase(); if (!['en', 'es'].includes(lang)) errors.push(`--lang must be en or es (got ${o.lang || 'nothing'})`);
  if (o.checkpoints && !['manual', 'auto'].includes(o.checkpoints)) errors.push(`--checkpoints must be manual or auto (got ${o.checkpoints})`);
  if (o.checkpoints === 'auto' && !o.systems) errors.push('--checkpoints auto needs --systems: the segment runners cannot ask the user to confirm them');
  const ADR_STATUS = ['proposed', 'accepted', 'decided-accepted'], ADR_OPTIONAL = ['write', 'skip'];
  if (o.adrStatus && !ADR_STATUS.includes(o.adrStatus)) errors.push(`--adr-status must be one of ${ADR_STATUS.join(', ')} (got ${o.adrStatus})`);
  if (o.adrOptional && !ADR_OPTIONAL.includes(o.adrOptional)) errors.push(`--adr-optional must be write or skip (got ${o.adrOptional})`);
  if (o.adrOptional && !o.adrStatus) errors.push('--adr-optional needs --adr-status');
  let diagrams = null;
  if (o.diagrams != null) { const v = String(o.diagrams).trim(); diagrams = /^(none|ninguno)$/i.test(v) ? [] : [...new Set(v.toUpperCase().split(/[\s,]+/).filter(Boolean))]; const bad = diagrams.filter((d) => !/^[A-E]$/.test(d)); if (bad.length) errors.push(`--diagrams takes none or letters A–E (got ${bad.join(', ')})`); }
  const type = archTypes.normType(o.type, { project: root }) || String(o.type || '').toUpperCase(); if (!archTypes.normType(o.type, { project: root })) errors.push(`--type must be one of ${archTypes.ids({ project: root }).join(', ')} (got ${o.type || 'nothing'})`);
  const file = (flag, p) => { if (!p) return null; const abs = path.resolve(root, p); if (!fs.existsSync(abs)) errors.push(`${flag}: ${p} not found`); return rel(root, p); };
  const FW = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'frameworks.js'));
  const fwIn = o.framework || (o.bian ? 'BIAN' : null), framework = fwIn ? FW.normId(fwIn, { project: root }) : null;
  if (fwIn && !framework) errors.push(`--framework must be one of ${Object.keys(FW.frameworks({ project: root }).frameworks).join(', ')} or none (got ${fwIn})`);
  const po = file('--po-spec', o.poSpec), alignment = file(o.bian ? '--bian' : '--alignment', o.alignment || o.bian), hld = file('--hld', o.hld), sup = file('--supplementary', o.supplementary);
  let systems = null; if (o.systems) { try { systems = typeof o.systems === 'string' ? JSON.parse(fs.existsSync(path.resolve(root, o.systems)) ? fs.readFileSync(path.resolve(root, o.systems), "utf8").replace(/\r\n?/g, "\n") : o.systems) : o.systems; if (!Array.isArray(systems)) throw new Error('not an array'); systems.forEach((s, i) => { if (!s || !s.name || !['internal', 'external'].includes(s.role)) errors.push(`--systems[${i}]: needs name and role internal|external`); }); } catch (e) { errors.push(`--systems: ${e.message}`); } }
  const hldFormat = o.hldFormat || (hld ? ({ '.mmd': 'mermaid', '.mermaid': 'mermaid', '.md': 'mermaid', '.pdf': 'pdf', '.svg': 'svg', '.png': 'png' }[path.extname(hld).toLowerCase()] || null) : null);
  // 8.93.1: a picture HLD must have its transcription (00-gates.md Step 0.4 item 2b) — the payloads and integration-check read it
  let hldMermaid = null;
  if (hld && hldFormat && hldFormat !== 'mermaid') {
    const t = rel(root, require(path.join(__dirname, 'integration-check.js')).transcriptionOf(path.resolve(root, hld)));
    if (fs.existsSync(path.resolve(root, t))) hldMermaid = t; else errors.push(`--hld ${hld} is a ${hldFormat}: write its transcription ${t} first (00-gates.md Step 0.4, item 2b)`);
  }
  const adrContext = fs.existsSync(path.join(root, '.cache', 'sa-skills', 'adr-context.md')) ? '.cache/sa-skills/adr-context.md' : null;
  const pin = fs.existsSync(path.join(root, 'adr', '.institutional-catalog.json')) ? 'adr/.institutional-catalog.json' : null;
  const record = {
    schema: 'collect/1', generated_at: new Date().toISOString(), plugin_version: o.pluginVersion || null,
    doc_language: lang, architecture_type: type, architect: o.architect || null,
    po_spec: po ? { path: po, score: o.poScore != null ? Number(o.poScore) : null } : null,
    // the capability alignment: the framework the project declared and its report (scripts/shared/frameworks.js); `bian` kept for BIAN, the shape readers before 10.1 know
    alignment: framework ? { framework, path: framework === FW.NONE ? null : alignment } : null,
    bian: framework === 'BIAN' && alignment ? { path: alignment } : null,
    hld: hld ? Object.assign({ path: hld, format: hldFormat }, hldMermaid ? { mermaid: hldMermaid } : {}) : null,
    systems, adr_context: adrContext, institutional_catalog: pin, supplementary_context: sup,
    // 8.89.0: manual — the create stops at each checkpoint for /clear; auto — the orchestrator runs each segment in a
    // segment-runner sub-agent, in series (workflow1/05-auto.md). Auto needs the systems confirmed here.
    checkpoints: o.checkpoints || 'manual',
    adr: o.adrStatus ? { status: o.adrStatus, optional: o.adrOptional || 'skip' } : null,
    optional_diagrams: diagrams,
    gates: { po_spec: po ? 'passed' : 'skipped', alignment: !po ? 'skipped' : framework === FW.NONE ? 'none' : alignment ? 'passed' : 'missing', hld: hld ? 'passed' : (po ? 'missing' : 'skipped') },
  };
  return { record, errors };
}

module.exports = { build };

if (require.main === module) {
  const args = process.argv.slice(2); const root = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const out = path.join(root, '.cache', 'sa-skills', 'collect.json');
  if (args.includes('--show')) { if (!fs.existsSync(out)) { console.error(`collect-save: no ${path.relative(root, out)} — Workflow 1 Step 4.9 has not run in this project`); process.exit(1); } console.log(fs.readFileSync(out, "utf8").replace(/\r\n?/g, "\n")); process.exit(0); }
  const { record, errors } = build(root, { checkpoints: opt('--checkpoints'), lang: opt('--lang'), type: opt('--type'), poSpec: opt('--po-spec'), poScore: opt('--po-score'), bian: opt('--bian'), framework: opt('--framework'), alignment: opt('--alignment'), hld: opt('--hld'), hldFormat: opt('--hld-format'), systems: opt('--systems'), supplementary: opt('--supplementary'), architect: opt('--architect'), pluginVersion: opt('--plugin-version'), adrStatus: opt('--adr-status'), adrOptional: opt('--adr-optional'), diagrams: opt('--diagrams') });
  if (errors.length) { console.error('collect-save: refused —\n  ' + errors.join('\n  ')); process.exit(2); }
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(record, null, 2) + '\n');
  if (args.includes('--json')) console.log(JSON.stringify(record));
  console.error(`Wrote ${path.relative(root, out)} — ${record.doc_language} · ${record.architecture_type} · PO Spec ${record.po_spec ? record.po_spec.path + (record.po_spec.score != null ? ` (${record.po_spec.score})` : '') : 'none'} · BIAN ${record.bian ? 'yes' : 'no'} · HLD ${record.hld ? record.hld.format : 'no'} · systems ${systemsCount(record)} · ADR context ${record.adr_context ? 'yes' : 'no'} · ADRs ${record.adr ? `${record.adr.status}, optional ${record.adr.optional}` : 'ask at Step 6'} · optional diagrams ${record.optional_diagrams ? (record.optional_diagrams.join(', ') || 'none') : 'ask at Step 7.2'}`);
}
function systemsCount(r) { return r.systems ? `${r.systems.filter((s) => s.role === 'internal').length} internal / ${r.systems.filter((s) => s.role === 'external').length} external` : 'not recorded'; }
