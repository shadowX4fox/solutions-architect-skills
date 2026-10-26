#!/usr/bin/env node
// The delta between an architecture and the PO Spec that last reflected it — collected by code, so a
// "update the PO Spec" never starts by re-reading the changelog in the main context.
//
//   bun po-spec-delta.js <project-root> [--po-spec <file>] [--out <file>] [--json] [--full]
//   bun po-spec-delta.js <project-root> --stamp            # after the sync is applied: marker, Version, Date
//   bun po-spec-delta.js <project-root> --check            # the spec is business only: no ADR / TDR / I-nn id, no link into the architecture
//
// The PO Spec carries `<!-- ARCHITECTURE_SYNC: <version> (<date>) -->` — the architecture version it last
// reflected. Without it the spec is "never synced" and the delta is everything since the spec's `**Date**`.
// The delta is: the sync state (spec version and date, architecture version, status and release date, how
// many releases behind), every `docs/CHANGELOG.md` entry after the synced version plus `[Unreleased]`
// (bodies verbatim — they are the narrative of what changed), the ADRs and TDRs those entries name (with
// status and title from the facts ledger), the containers whose `**Last Updated:**` is after the sync date,
// the use-case reconciliation (UC ids the architecture's flows serve vs the ids the spec defines), and the
// retired integrations. `--stamp` writes the marker for the current architecture version, bumps the spec's
// `**Version**` (minor) and sets `**Date**` to today — content changes are the workflow's, not the script's.
// Changelog bodies come as **headlines** — each bullet's bold lead sentence (or its first sentence) plus the ids
// it cites — so the delta does not grow with the changelog; `--full` keeps the bodies verbatim. When the sync
// predates the oldest entry of docs/CHANGELOG.md (or there is no sync), docs/CHANGELOG-ARCHIVE.md is read too.
'use strict';
const fs = require('fs');
const path = require('path');
// The facts ledger is sa-skills' (scripts/shared/arch-facts.js); this skill ships in sa-requirements, which runs without it.
// The sync compares the spec with an architecture, so it needs sa-skills: `--sa-skills <dir>`, SA_SKILLS_DIR, the repo
// layout (plugins/sa-requirements inside sa-skills) or Claude Code's install registry. Loaded when a delta is collected;
// missing, the message names the flag.
const archFactsCandidates = () => [
  process.argv.includes('--sa-skills') ? path.join(process.argv[process.argv.indexOf('--sa-skills') + 1] || '', 'scripts', 'shared', 'arch-facts.js') : null,
  process.env.SA_SKILLS_DIR ? path.join(process.env.SA_SKILLS_DIR, 'scripts', 'shared', 'arch-facts.js') : null,
  path.join(__dirname, '..', '..', '..', '..', '..', 'scripts', 'shared', 'arch-facts.js'),
].filter(Boolean);
// the installed sa-skills, as the marketplace's plugin-root.ts answers it — asked only when nothing above holds it
function registryArchFacts() {
  const claude = process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(require('os').homedir(), '.claude');
  const resolver = path.join(claude, 'plugins', 'marketplaces', 'shadowx4fox-solution-architect-marketplace', 'scripts', 'plugin-root.ts');
  if (!fs.existsSync(resolver)) return null;
  const r = require('child_process').spawnSync(process.execPath, [resolver, '--quiet'], { encoding: 'utf8' });
  const dir = (r.stdout || '').trim();
  return r.status === 0 && dir ? path.join(dir, 'scripts', 'shared', 'arch-facts.js') : null;
}
let archFacts = null;
const collect = (root) => {
  if (!archFacts) {
    const p = archFactsCandidates().find((f) => fs.existsSync(f)) || [registryArchFacts()].find((f) => f && fs.existsSync(f));
    if (!p) throw new Error('po-spec-delta reads the architecture through sa-skills (scripts/shared/arch-facts.js) — pass --sa-skills <its plugin dir>');
    archFacts = require(p);
  }
  return archFacts.collect(root);
};

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const semver = (v) => String(v || '0').replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);
const cmp = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const { suggestionsOf } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'po-spec.js'));
const field = (src, labels) => { for (const l of labels) { const m = src.match(new RegExp('^\\*\\*' + l + '\\*\\*\\s*:?\\s*(.+)$', 'mi')); if (m) return m[1].replace(/\*/g, '').trim(); } return null; };

// the changelog: every `## [version] - date` entry with its body, in file order
function changelogFile(p, archived) {
  if (!exists(p)) return [];
  const lines = read(p).split('\n'), out = []; let cur = null;
  for (const l of lines) { const m = l.match(/^##[ \t]+\[([^\]]+)\][ \t]*(?:-[ \t]*(\d{4}-\d{2}-\d{2}))?/); if (m) { cur = { version: m[1], date: m[2] || null, body: [], archived }; out.push(cur); continue; } if (cur && !/^> (Older releases|Versiones anteriores): \[CHANGELOG-ARCHIVE/.test(l)) cur.body.push(l); }
  out.forEach((e) => { e.body = e.body.join('\n').trim(); });
  return out;
}
function changelog(root) { return changelogFile(path.join(root, 'docs', 'CHANGELOG.md'), false); }
function changelogArchive(root) { return changelogFile(path.join(root, 'docs', 'CHANGELOG-ARCHIVE.md'), true); }
// the headline of an entry: the `### Added/Changed…` lines, and per bullet its bold lead (or first sentence) plus the ids it cites
const IDS = /\b(?:ADR|TDR)-\d{3}\b|\bI-\d{2}\b|\bUC-\d{2}\b/g;
function headlines(body) {
  const out = []; let cur = null;
  const flush = () => { if (!cur) return; const lead = (cur.match(/\*\*([^*]+)\*\*/) || [])[1] || (cur.replace(/^-\s*/, '').match(/^[^.!?]*[.!?]?/) || [''])[0]; const ids = [...new Set(cur.match(IDS) || [])].filter((id) => !lead.includes(id)); out.push('- ' + lead.trim() + (ids.length ? ' [' + ids.join(', ') + ']' : '')); cur = null; };
  for (const l of body.split('\n')) { if (/^###\s/.test(l)) { flush(); out.push(l.trim()); } else if (/^\s*[-*]\s/.test(l)) { flush(); cur = l.trim(); } else if (cur && l.trim()) cur += ' ' + l.trim(); }
  flush(); return out.join('\n');
}

function delta(root, opts = {}) {
  root = path.resolve(root);
  const specPath = opts.poSpec || path.join(root, 'PRODUCT_OWNER_SPEC.md');
  if (!exists(specPath)) throw new Error(`PO Spec not found: ${specPath}`);
  const spec = read(specPath);
  const facts = collect(root);
  const sync = spec.match(/<!--\s*ARCHITECTURE_SYNC:\s*v?([0-9][^\s(]*)\s*(?:\((\d{4}-\d{2}-\d{2})\))?\s*-->/);
  const state = { spec_file: path.relative(root, specPath), spec_version: field(spec, ['Version', 'Versión', 'Version del documento']), spec_date: field(spec, ['Date', 'Fecha']),
    synced_version: sync ? sync[1] : null, synced_date: sync ? sync[2] || null : null,
    architecture_version: facts.architecture.version, architecture_status: facts.architecture.status, architecture_released: facts.architecture.released, language: (spec.match(/<!--\s*DOC_LANGUAGE:\s*(\w+)/) || [])[1] || facts.architecture.language };
  const since = state.synced_date || state.spec_date || '0000-00-00';
  let entries = changelog(root);
  const oldest = entries.filter((e) => !/unreleased/i.test(e.version)).slice(-1)[0];
  if (!oldest || !state.synced_version || cmp(state.synced_version, oldest.version) < 0) entries = entries.concat(changelogArchive(root));   // the sync predates the main file: the archive is part of the delta
  const releasesSince = entries.filter((e) => /unreleased/i.test(e.version) || (state.synced_version ? cmp(e.version, state.synced_version) > 0 : (e.date || '9999') > since));
  state.releases_behind = releasesSince.filter((e) => !/unreleased/i.test(e.version)).length;
  state.unreleased_changes = releasesSince.some((e) => /unreleased/i.test(e.version) && e.body.replace(/\s/g, '').length > 0);
  state.sync_state = !state.synced_version ? 'never synced' : cmp(state.synced_version, state.architecture_version || '0') < 0 ? `behind by ${state.releases_behind} release(s)` : state.unreleased_changes ? 'in sync with the last release; unreleased changes pending' : 'in sync';
  const named = (re) => [...new Set(releasesSince.flatMap((e) => e.body.match(re) || []))].sort();
  const adrIds = named(/\bADR-\d{3}\b/g), tdrIds = named(/\bTDR-\d{3}\b/g);
  const adrs = adrIds.map((id) => facts.adrs.find((a) => a.id === id) || { id, title: '(no file under adr/)', status: null, scope: null });
  const tdrs = facts.tdrs.map((t) => ({ ...t, named_by_changes: tdrIds.includes(t.id) }));
  const components = facts.components.filter((c) => c.level === 'L2' && c.last_updated && c.last_updated > since).map((c) => ({ name: c.name, slug: c.slug, system: c.system, component_version: c.component_version, last_updated: c.last_updated }));
  // use cases: what the spec defines vs what the architecture's flows serve
  const specUcs = [...new Set((spec.match(/^###\s+(UC-?\d+)\b.*$/gim) || []).map((h) => h.match(/UC-?(\d+)/i)[1].padStart(2, '0')).map((n) => 'UC-' + n))].sort();
  const archUcs = [...new Set(facts.flows.flatMap((f) => f.use_cases))].sort();
  const useCases = { in_spec: specUcs, in_architecture: archUcs, architecture_only: archUcs.filter((u) => !specUcs.includes(u)), spec_only: specUcs.filter((u) => !archUcs.includes(u)),
    flows: facts.flows.map((f) => ({ code: f.code, name: f.name, use_cases: f.use_cases, latency_target: f.latency_target })) };
  const retired = facts.integrations.filter((i) => i.retired);
  const releases = releasesSince.map((e) => ({ ...e, full: e.body, body: opts.full ? e.body : headlines(e.body) }));
  const suggestions = suggestionsOf(spec);
  return { state, full: !!opts.full, releases, adrs, tdrs, components, useCases, retired_integrations: retired, suggestions, layers: facts.layers.length, systems: facts.systems.map((s) => ({ name: s.name, owned: s.owned })) };
}

const MAPPING = `| What changed in the architecture | Where it lands in the PO Spec | Written as |
|---|---|---|
| A use case or flow added, renamed, split or retired (docs/04, flows' UC ids) | § 4 Use Cases · § 5 User Stories | the business behavior and its trigger — never the containers that implement it |
| A latency, availability, freshness or scale target changed (docs/01 Key Metrics, docs/08) | § 8 Success Metrics & KPIs · § 6 UX Requirements | the target as the customer experiences it, with the number |
| A new external system, vendor, regulatory or institutional decision (docs/05, docs/07, an ADR the changes name) | § 7 Business Constraints | the constraint and who imposes it, in business words — the technology only when the constraint is the technology |
| Scope moved: containers or phases added or removed, a deferred capability (docs/03, a CHANGELOG Removed / Deprecated) | § 1 Business Context (Desired Future State) · § 3 Business Objectives | what the customer gets or no longer gets, and when |
| A new owner, operator or approver (component owners, integration owners, a TDR's approver) | § 2 Stakeholders & Users | the role, its responsibility in this initiative |
| Technical debt accepted with a business effect (a TDR the changes name, a Deprecated entry) | § 7 Business Constraints · Appendix (Risks) | the risk in business terms and its owner |
| An implementation suggestion the architecture answered (an ADR, the technology stack, a container's technology) | Appendix › Implementation Suggestions — its Status and Answer | \`Adopted\` or \`Not adopted\`, with what the business gets instead and the architecture version — never the ADR id |

The PO Spec is business only: an ADR, TDR or integration id (\`ADR-nnn\`, \`TDR-nnn\`, \`I-nn\`) or a link into \`adr/\`, \`tdr/\` or \`docs/\` never enters its text — the Source column carries the id for the Product Owner's review, and \`--check\` refuses a spec that carries one.`;

function render(d) {
  const s = d.state;
  const out = [`# PO Spec delta — ${s.spec_file}`, '',
    '| | |', '|---|---|', `| Spec | v${s.spec_version || '?'} (${s.spec_date || 'no date'}) |`, `| Last synced with architecture | ${s.synced_version ? 'v' + s.synced_version + (s.synced_date ? ' (' + s.synced_date + ')' : '') : '**never** — no `<!-- ARCHITECTURE_SYNC -->` marker; delta measured from the spec date'} |`,
    `| Architecture now | v${s.architecture_version || '?'} · ${s.architecture_status || '?'} · released ${s.architecture_released || '?'} |`, `| State | **${s.sync_state}** |`, '',
    '## Section mapping (fixed)', '', MAPPING, '',
    `## Releases since the sync (${d.releases.length}, newest first, ${d.full ? 'bodies verbatim' : 'headlines — each bullet\'s lead sentence and the ids it cites; `--full` for the bodies'})`, ''];
  if (!d.releases.length) out.push('(no changelog entries after the synced version)');
  d.releases.forEach((e) => { out.push(`### [${e.version}]${e.date ? ' — ' + e.date : ''}${e.archived ? ' (archived — docs/CHANGELOG-ARCHIVE.md)' : ''}`, '', e.body || '(empty)', ''); });
  out.push(`## ADRs the changes name (${d.adrs.length})`, '', d.adrs.length ? '| ADR | Title | Status | Scope |\n|---|---|---|---|\n' + d.adrs.map((a) => `| ${a.id} | ${a.title} | ${a.status || ''} | ${a.scope || ''} |`).join('\n') : '(none)', '');
  out.push(`## Technical debt (${d.tdrs.length}; ★ = named by the changes)`, '', d.tdrs.length ? '| TDR | Title | Status |\n|---|---|---|\n' + d.tdrs.map((t) => `| ${t.named_by_changes ? '★ ' : ''}${t.id} | ${t.title} | ${t.status || ''} |`).join('\n') : '(none)', '');
  out.push(`## Containers updated since the sync (${d.components.length})`, '', d.components.length ? '| Container | System | Version | Last updated |\n|---|---|---|---|\n' + d.components.map((c) => `| ${c.name} | ${c.system} | ${c.component_version || ''} | ${c.last_updated} |`).join('\n') : '(none)', '');
  const u = d.useCases;
  out.push('## Use cases — the spec vs the architecture', '', `- In the spec: ${u.in_spec.join(', ') || 'none found (headings `### UC-nn:` expected in § 4)'}`, `- Served by the architecture's flows: ${u.in_architecture.join(', ') || 'none'}`,
    `- **In the architecture only** (a flow serves a use case the spec does not define): ${u.architecture_only.join(', ') || 'none'}`, `- **In the spec only** (no flow serves it): ${u.spec_only.join(', ') || 'none'}`, '',
    u.flows.length ? '| Flow | Use cases | Latency target |\n|---|---|---|\n' + u.flows.map((f) => `| ${f.code}. ${f.name} | ${f.use_cases.join(', ')} | ${f.latency_target || ''} |`).join('\n') : '', '');
  const open = (d.suggestions || []).filter((x) => x.status === 'Open');
  out.push(`## Implementation suggestions (${(d.suggestions || []).length}, ${open.length} open — answer each from the architecture: does it adopt it, and if not, how is the need met?)`, '', (d.suggestions || []).length ? '| # | Suggestion | Need | Status | Answer |\n|---|---|---|---|---|\n' + d.suggestions.map((x) => `| ${x.id} | ${x.suggestion} | ${x.need} | ${x.status} | ${x.answer} |`).join('\n') : '(none)', '');
  out.push(`## Retired integrations (${d.retired_integrations.length})`, '', d.retired_integrations.length ? d.retired_integrations.map((i) => `- ${i.id}: ${i.from} → ${i.to} — ${i.boundary || ''}`).join('\n') : '(none)', '');
  return out.join('\n');
}

function stamp(root, opts = {}) {
  root = path.resolve(root);
  const specPath = opts.poSpec || path.join(root, 'PRODUCT_OWNER_SPEC.md');
  if (!exists(specPath)) throw new Error(`PO Spec not found: ${specPath}`);
  const facts = collect(root); const ver = facts.architecture.version; if (!ver) throw new Error('ARCHITECTURE.md carries no ARCHITECTURE_VERSION marker — nothing to stamp');
  const today = (opts.today || new Date().toISOString().slice(0, 10));
  let spec = read(specPath); const marker = `<!-- ARCHITECTURE_SYNC: ${ver} (${today}) -->`;
  if (/<!--\s*ARCHITECTURE_SYNC:[^>]*-->/.test(spec)) spec = spec.replace(/<!--\s*ARCHITECTURE_SYNC:[^>]*-->/, marker);
  else if (/<!--\s*DOC_LANGUAGE:[^>]*-->/.test(spec)) spec = spec.replace(/(<!--\s*DOC_LANGUAGE:[^>]*-->)/, `$1\n${marker}`);
  else spec = marker + '\n' + spec;
  const old = field(spec, ['Version', 'Versión']); let next = old;
  if (old) { const parts = old.split('.'); parts[parts.length - 1] = String((parseInt(parts[parts.length - 1], 10) || 0) + 1); next = parts.join('.'); spec = spec.replace(/^(\*\*(?:Version|Versión)\*\*\s*:?\s*).+$/mi, `$1${next}`); }
  spec = spec.replace(/^(\*\*(?:Date|Fecha)\*\*\s*:?\s*).+$/mi, `$1${today}`);
  fs.writeFileSync(specPath, spec);
  return { file: path.relative(root, specPath), marker, version: { from: old, to: next }, date: today };
}

// The spec is the Product Owner's document: it states what the business needs, never which architecture decision
// answers it. An id or a link into the architecture is a finding — outside HTML comments and fenced code.
const ARCH_REF = /\b(?:ADR|TDR)-\d{3}\b|\bI-\d{2}\b|\]\((?:\.\.?\/)*(?:adr|tdr|docs)\/[^)]*\)/g;
function check(root, opts = {}) {
  root = path.resolve(root);
  const specPath = opts.poSpec || path.join(root, 'PRODUCT_OWNER_SPEC.md');
  if (!exists(specPath)) throw new Error(`PO Spec not found: ${specPath}`);
  const findings = []; let fence = false, comment = false;
  read(specPath).split('\n').forEach((raw, i) => {
    if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; return; }
    if (fence) return;
    let l = raw;
    if (comment) { const e = l.indexOf('-->'); if (e < 0) return; l = l.slice(e + 3); comment = false; }
    l = l.replace(/<!--[\s\S]*?-->/g, '');
    const o = l.indexOf('<!--'); if (o >= 0) { l = l.slice(0, o); comment = true; }
    // `[ADR-117](adr/ADR-117-….md)` is one reference: the link joins the id its file names
    const refs = [];
    for (const m of l.matchAll(ARCH_REF)) {
      if (!m[0].startsWith('](')) { refs.push({ line: i + 1, ref: m[0] }); continue; }
      const target = m[0].slice(2, -1), id = (path.basename(target).match(/^(?:ADR|TDR)-\d{3}/) || [])[0];
      const same = id && refs.find((r) => r.ref === id && !r.link);
      if (same) same.link = target; else refs.push({ line: i + 1, ref: target, link: target });
    }
    findings.push(...refs);
  });
  return { file: path.relative(root, specPath), findings };
}

module.exports = { delta, render, stamp, check, ARCH_REF, changelog, changelogArchive, headlines, MAPPING };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (!args[0] || args[0].startsWith('--')) { console.error('Usage: bun po-spec-delta.js <project-root> [--po-spec <file>] [--out <file>] [--json] [--full] | --stamp | --check'); process.exit(2); }
  try {
    if (args.includes('--check')) {
      const r = check(args[0], { poSpec: opt('--po-spec') });
      if (args.includes('--json')) process.stdout.write(JSON.stringify(r, null, 1) + '\n');
      else for (const f of r.findings) console.log(`${r.file}:${f.line}  architecture reference in the PO Spec: ${f.ref}${f.link && f.link !== f.ref ? ` (${f.link})` : ''}`);
      console.error(r.findings.length ? `${r.findings.length} architecture reference(s) in ${r.file} — the PO Spec is business only: say what the decision means for the customer or the business, without its id or link` : `${r.file}: business only — no architecture references`);
      process.exit(r.findings.length ? 1 : 0);
    }
    if (args.includes('--stamp')) { const r = stamp(args[0], { poSpec: opt('--po-spec') }); console.error(`Stamped ${r.file}: ${r.marker}; Version ${r.version.from} → ${r.version.to}; Date ${r.date}`); process.exit(0); }
    const d = delta(args[0], { poSpec: opt('--po-spec'), full: args.includes('--full') });
    if (args.includes('--json')) process.stdout.write(JSON.stringify(d, null, 1) + '\n');
    else { const out = opt('--out') || path.join(path.resolve(args[0]), '.cache', 'sa-skills', 'po-spec-delta.md'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, render(d) + '\n'); console.error(`Wrote ${out}`); }
    const s = d.state; console.error(`PO Spec v${s.spec_version} (${s.spec_date}) — ${s.sync_state}; architecture v${s.architecture_version}; ${d.releases.length} changelog entries since, ${d.adrs.length} ADRs named, ${d.components.length} containers updated, use cases architecture-only [${d.useCases.architecture_only.join(', ')}] spec-only [${d.useCases.spec_only.join(', ')}]`);
  } catch (e) { console.error('po-spec-delta: ' + e.message); process.exit(2); }
}
