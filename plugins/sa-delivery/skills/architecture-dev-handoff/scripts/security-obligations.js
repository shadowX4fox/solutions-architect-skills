#!/usr/bin/env bun
// security-obligations.js — what a component must enforce, rendered by code (8.149.0).
//
//   bun security-obligations.js <project_root> [--components <slug,slug> | all] [--handoffs <dir>] [--lang en|es] [--write] [--json]
//
// Through 8.148 the Security by Design principle never reached a builder. handoff-prepare.js read docs/01 and 03–09
// (not the principles), and the analyses it read were latency, blast radius and coupling (never STRIDE or Data
// Sensitivity); the institutional ADRs reached the Cross-Cutting Standards only when the generator chose to cite them.
// A component that held the strongest credential of its architecture went out with an OpenAPI carrying no security
// scheme, a service-mesh ADR the security section cites left out of the kit, and a High STRIDE finding on it unread —
// and the build pack told the builder to implement the contract as written and leave gaps as TODOs.
//
// This file is the component's security obligations, every line from a structured source:
//   • Inbound — who may call: every docs/05 row whose To is the component (deny by default: any other caller is
//     rejected), with the authentication the STRIDE trust-boundary inventory states for that I-nn. A row with no
//     stated authentication is a gap, and the interface fails closed until the architecture states it.
//   • Outbound — the credentials it presents: the docs/05 rows whose From is the component, authenticated the same way.
//   • Decisions in force: the Security by Design principle of docs/02 verbatim (by its PRINCIPLE anchor), and every
//     institutional ADR (001–100) the security section (docs/07) or that principle cites.
//   • Threats: the STRIDE findings of the trust boundaries its integrations cross, and every finding that names it,
//     with the mitigation the report recommends.
//   • Data: the Data Sensitivity flow-map rows it sends or receives.
//   • Tests the build must pass, derived from the above.
// An endpoint cell resolves only when it is exactly the component's canonical name, internal name or slug — or one
// item of a list of names, or that name followed by a parenthetical; nothing looser. A value with no source is
// `[NOT DOCUMENTED — …]` naming where to state it, and is reported as a gap
// (`.cache/sa-skills/handoff-payloads/asset-gaps/<slug>.security.json`, the format kit-gaps-merge.js reads).
'use strict';
const fs = require('fs');
const path = require('path');

const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-delivery reads the architecture through sa-skills
const { collect } = require(fromSaSkills('scripts', 'shared', 'arch-facts.js'));

const L = {
  en: { title: 'Security Obligations', rule: '**Rule**: deny by default. Only the callers listed under Inbound reach this component; an interface whose authentication is not documented fails closed — it rejects every call — until the architecture states it. Never weaken a control below to make the code easier.', inbound: 'Inbound — who may call', outbound: 'Outbound — credentials it presents', decisions: 'Decisions in force', principle: 'Principle', adrs: 'Institutional ADRs the security architecture cites', threats: 'Threats (STRIDE)', data: 'Data it handles', tests: 'Tests the build must pass',
    cols: { int: 'Integration', caller: 'Caller', target: 'Target', protocol: 'Protocol', auth: 'Authentication', source: 'Source' }, tcols: { id: '#', tb: 'Boundary', threat: 'Threat', cat: 'Category', sev: 'Severity', status: 'Status', mit: 'Mitigation' },
    others: 'Any other caller is rejected.', none: 'None documented.', noInbound: 'No documented caller: every inbound call is rejected.', nd: 'NOT DOCUMENTED', failsClosed: 'fails closed until stated',
    tNoAuth: (i) => `A call to ${i} without credentials is rejected.`, tOther: (i) => `A call to ${i} from a caller not listed under Inbound is rejected.`, tClosed: (i) => `${i} rejects every call until its authentication is documented.`, tThreat: (id, t) => `${id} — ${t}: the mitigation holds, or a \`TODO(architecture)\` quotes this finding.`,
    blocks: { auth: 'the interface fails closed: it cannot be opened without its authentication', stride: 'the threats the build must mitigate are unknown', principle: 'the builder cannot read the security principle the architecture holds', ds: 'the data classification of what the component handles is unknown' } },
  es: { title: 'Obligaciones de Seguridad', rule: '**Regla**: denegar por defecto. Solo los llamadores de Entrada alcanzan este componente; una interfaz cuya autenticación no está documentada falla cerrada —rechaza toda llamada— hasta que la arquitectura la declare. Ningún control de abajo se relaja para simplificar el código.', inbound: 'Entrada — quién puede llamar', outbound: 'Salida — credenciales que presenta', decisions: 'Decisiones vigentes', principle: 'Principio', adrs: 'ADR institucionales que cita la arquitectura de seguridad', threats: 'Amenazas (STRIDE)', data: 'Datos que maneja', tests: 'Pruebas que la construcción debe pasar',
    cols: { int: 'Integration', caller: 'Caller', target: 'Target', protocol: 'Protocol', auth: 'Authentication', source: 'Source' }, tcols: { id: '#', tb: 'Boundary', threat: 'Threat', cat: 'Category', sev: 'Severity', status: 'Status', mit: 'Mitigation' },
    others: 'Cualquier otro llamador se rechaza.', none: 'Nada documentado.', noInbound: 'Ningún llamador documentado: toda llamada entrante se rechaza.', nd: 'NOT DOCUMENTED', failsClosed: 'falla cerrada hasta que se declare',
    tNoAuth: (i) => `Una llamada a ${i} sin credenciales se rechaza.`, tOther: (i) => `Una llamada a ${i} desde un llamador que no figura en Entrada se rechaza.`, tClosed: (i) => `${i} rechaza toda llamada hasta que su autenticación esté documentada.`, tThreat: (id, t) => `${id} — ${t}: la mitigación se cumple, o un \`TODO(architecture)\` cita este hallazgo.`,
    blocks: { auth: 'la interfaz falla cerrada: no se abre sin su autenticación', stride: 'se desconocen las amenazas que la construcción debe mitigar', principle: 'quien construye no puede leer el principio de seguridad de la arquitectura', ds: 'se desconoce la clasificación de los datos que maneja el componente' } },
};

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const plain = (s) => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim();
const cell = (s) => String(s).replace(/\|/g, '\\|');
const cellsOf = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split(/(?<!\\)\|/).map((c) => c.trim());
const isSep = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l || '');
const ints = (s) => [...new Set(String(s || '').match(/\bI-\d{1,3}\b/g) || [])];
const adrIds = (s) => [...new Set(String(s || '').match(/\bADR-\d{3}\b/g) || [])];

// every pipe table of a Markdown file: its nearest heading, its headers and its rows (raw cells)
function tables(src) {
  const ls = src.split('\n'), out = []; let heading = null;
  for (let i = 0; i < ls.length; i++) {
    const h = ls[i].match(/^(#{1,6})\s+(.*)$/); if (h) { heading = plain(h[2]); continue; }
    if (/^\s*\|/.test(ls[i]) && isSep(ls[i + 1]) && !/^\s*\|/.test(ls[i - 1] || '')) {
      const headers = cellsOf(ls[i]).map(plain), rows = []; let j = i + 2;
      for (; j < ls.length && /^\s*\|/.test(ls[j]); j++) rows.push({ cells: cellsOf(ls[j]), line: j + 1 });
      out.push({ heading, headers, rows, line: i + 1 }); i = j - 1;
    }
  }
  return out;
}
const col = (t, re) => t.headers.findIndex((h) => re.test(h));

// the newest report of a lens in analysis/ (top level; archive/ holds superseded ones)
function latest(root, re) {
  const d = path.join(root, 'analysis'); if (!fs.existsSync(d)) return null;
  const f = fs.readdirSync(d).filter((n) => re.test(n)).sort().pop(); return f ? path.join(d, f) : null;
}

// a docs/05 endpoint cell names the component when it is exactly one of its names, one item of a list of names,
// or that name followed by a parenthetical qualifier — nothing looser
function namesOf(c) { return [c.name, c.internal_name, c.slug].filter(Boolean).map((n) => plain(n).toLowerCase()); }
function cellNames(cellText, c) {
  const want = new Set(namesOf(c)); const t = plain(cellText).toLowerCase();
  const items = [t, t.replace(/\s*\([^)]*\)\s*$/, ''), ...t.split(/\s*(?:,|;|\by\b|\band\b|\be\b)\s*/).map((x) => x.replace(/\s*\([^)]*\)\s*$/, '').trim())];
  return items.some((x) => want.has(x));
}

// a principle block of docs/02 by its PRINCIPLE anchor, comments out
function principleBlock(root, anchor) {
  const dir = path.join(root, 'docs'); if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((n) => /^02-.*\.md$/.test(n)); if (!f) return null;
  const ls = read(path.join(dir, f)).split('\n');
  const at = ls.findIndex((l) => /^#{2,6}\s/.test(l) && new RegExp(`<!--\\s*PRINCIPLE:\\s*${anchor}\\s*-->`).test(l)); if (at < 0) return null;
  const level = ls[at].match(/^#+/)[0].length; let end = ls.length;
  for (let j = at + 1; j < ls.length; j++) { const m = ls[j].match(/^(#{1,6})\s/); if ((m && m[1].length <= level) || /^---\s*$/.test(ls[j])) { end = j; break; } }
  const body = ls.slice(at + 1, end).join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).filter((l, i, a) => !(l === '' && /^\s*$/.test(a[i - 1] || ''))).join('\n').trim();
  return { file: `docs/${f}`, dir, heading: plain(ls[at].replace(/^#+\s*/, '')), body, line: at + 1 };
}

// relative links of a block written under fromDir, re-pointed for a file under toDir
const relink = (md, fromDir, toDir) => md.replace(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g, (all, href) => { const [p, h] = href.split('#'); const abs = path.resolve(fromDir, p); return `](${path.relative(toDir, abs).split(path.sep).join('/')}${h ? `#${h}` : ''})`; });

// the security section's file (docs/07, by its SECTION anchor first)
function securityDoc(root) {
  const dir = path.join(root, 'docs'); if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((n) => /\.md$/.test(n));
  const f = files.find((n) => /<!--\s*SECTION:\s*Security Architecture\s*-->/.test(read(path.join(dir, n)))) || files.find((n) => /^07-/.test(n));
  return f ? `docs/${f}` : null;
}

// STRIDE: the trust-boundary inventory (ID | Name | … | Auth Mechanism), the per-boundary matrices (### TB-nn …),
// the high-priority table (# | Trust Boundary | … | Recommended Mitigation)
function stride(file) {
  const ts = tables(read(file));
  const inv = ts.find((t) => /^ID$/i.test(t.headers[0]) && col(t, /auth/i) >= 0);
  const boundaries = inv ? inv.rows.map((r) => ({ id: plain(r.cells[0]), name: plain(r.cells[col(inv, /^name$/i)] || ''), auth: plain(r.cells[col(inv, /auth/i)] || '') })).filter((b) => /^TB-\d+/.test(b.id)) : [];
  const threats = [];
  ts.filter((t) => col(t, /^threat$/i) >= 0 && col(t, /^category$/i) >= 0 && col(t, /^status$/i) >= 0).forEach((t) => {
    const tb = (String(t.heading || '').match(/\bTB-\d+\b/) || [])[0] || null;
    t.rows.forEach((r) => { const id = plain(r.cells[0]); if (!/^[A-Z]{1,3}\d{0,3}-?\d{0,3}(?:-[A-Z]{1,2})?$/.test(id) || !/\d/.test(id)) return;
      threats.push({ id, tb, threat: plain(r.cells[col(t, /^threat$/i)]), category: plain(r.cells[col(t, /^category$/i)]), severity: plain(r.cells[col(t, /^severity$/i)] || ''), status: plain(r.cells[col(t, /^status$/i)]), gap: plain(r.cells[col(t, /control|gap/i)] || ''), row: plain(r.cells.join(' ')) }); });
  });
  const mitigation = new Map();
  ts.filter((t) => col(t, /mitigation/i) >= 0 && /^#$/.test(t.headers[0])).forEach((t) => t.rows.forEach((r) => mitigation.set(plain(r.cells[0]), plain(r.cells[col(t, /mitigation/i)]))));
  return { boundaries, threats, mitigation };
}

// Data Sensitivity: the sensitive-flow map rows (From | To | … ) the component sends or receives
function sensitivity(file, c) {
  const t = tables(read(file)).find((x) => col(x, /^from$/i) >= 0 && col(x, /^to$/i) >= 0 && col(x, /sensitive/i) >= 0); if (!t) return [];
  const pick = (r, re) => plain(r.cells[col(t, re)] || '');
  return t.rows.filter((r) => cellNames(r.cells[col(t, /^from$/i)], c) || cellNames(r.cells[col(t, /^to$/i)], c))
    .map((r) => ({ flow: pick(r, /^flow$/i), step: pick(r, /^step$/i), from: pick(r, /^from$/i), to: pick(r, /^to$/i), carries: pick(r, /sensitive/i), transit: pick(r, /transit/i), gap: pick(r, /^gap$/i) }));
}

function render(root, c, facts, lang, ctx) {
  const t = L[lang] || L.en, gaps = [];
  const nd = (where, field, blocks) => { gaps.push({ asset: 'security.md', field, where, impact: blocks }); return `[${t.nd} — ${where}]`; };
  const nn = String(c.index || '').split('.').pop().padStart(2, '0');
  const live = (facts.integrations || []).filter((i) => !i.retired);
  const inbound = live.filter((i) => cellNames(i.to, c)), outbound = live.filter((i) => cellNames(i.from, c));
  const mine = new Set([...inbound, ...outbound].map((i) => i.id));
  const tbOf = (id) => (ctx.stride ? ctx.stride.boundaries.find((b) => ints(b.name).includes(id)) : null);
  const authOf = (i, dir) => {
    const b = tbOf(i.id);
    if (b && b.auth && !/^\[?NOT DOCUMENTED/i.test(b.auth) && !/^none\b/i.test(b.auth)) return { text: b.auth, source: `STRIDE ${b.id}`, ok: true };
    if (b && /^none\b/i.test(b.auth)) return { text: b.auth, source: `STRIDE ${b.id}`, ok: dir === 'out' };
    const why = b ? `${b.auth || ''}`.replace(/^\[?NOT DOCUMENTED\]?\s*—?\s*/i, '') : '';
    return { text: `${nd(`authentication of ${i.id}: state it in ${ctx.secDoc || 'docs/07'}`, `${t.cols.auth} ${i.id}`, t.blocks.auth)}${why ? ` ${why}` : ''}${dir === 'in' ? ` — ${t.failsClosed}` : ''}`, source: b ? `STRIDE ${b.id}` : 'docs/05', ok: false };
  };
  const inRows = inbound.map((i) => ({ i, a: authOf(i, 'in') })), outRows = outbound.map((i) => ({ i, a: authOf(i, 'out') }));

  const out = [];
  out.push(`# ${c.name} — ${t.title}`, '', '<!-- managed by sa-skills:architecture-dev-handoff — rendered by security-obligations.js from the architecture docs and the security analyses; fix a value there and re-run, never here -->', '', t.rule, '');
  out.push(`## ${t.inbound} <!-- SECTION: Inbound -->`, '');
  if (inRows.length) { out.push(`| ${t.cols.int} | ${t.cols.caller} | ${t.cols.protocol} | ${t.cols.auth} | ${t.cols.source} |`, '|---|---|---|---|---|', ...inRows.map(({ i, a }) => `| ${i.id} | ${cell(plain(i.from))} | ${cell(plain(i.protocol || '—'))} | ${cell(a.text)} | ${a.source} |`), '', t.others, ''); }
  else out.push(t.noInbound, '');
  out.push(`## ${t.outbound} <!-- SECTION: Outbound -->`, '');
  out.push(...(outRows.length ? [`| ${t.cols.int} | ${t.cols.target} | ${t.cols.protocol} | ${t.cols.auth} | ${t.cols.source} |`, '|---|---|---|---|---|', ...outRows.map(({ i, a }) => `| ${i.id} | ${cell(plain(i.to))} | ${cell(plain(i.protocol || '—'))} | ${cell(a.text)} | ${a.source} |`)] : [t.none]), '');

  out.push(`## ${t.decisions} <!-- SECTION: Decisions in Force -->`, '');
  const p = ctx.principle;
  out.push(`### ${t.principle}: ${p ? p.heading.replace(/\s*$/, '') : 'Security by Design'}`, '', p ? `${relink(p.body, p.dir, path.join(ctx.handoffs, 'assets', `${nn}-${c.slug}`))}\n\n_${p.file}:${p.line}_` : nd('docs/02 — <!-- PRINCIPLE: Security by Design -->', `${t.principle} Security by Design`, t.blocks.principle), '');
  out.push(`### ${t.adrs}`, '');
  out.push(...(ctx.adrs.length ? ctx.adrs.map((a) => `- [${a.id}](../../../${a.file}) — ${plain(a.title).replace(new RegExp(`^${a.id}:?\\s*`), '')}`) : [t.none]), '');

  out.push(`## ${t.threats} <!-- SECTION: Threats -->`, '');
  let threats = [];
  if (!ctx.stride) out.push(nd('analysis/STRIDE-*.md — run /sa-analysis:architecture-analysis stride', 'STRIDE', t.blocks.stride), '');
  else {
    // a boundary is the component's when one of its sides names it — the threats against it, or against what it presents;
    // a boundary it shares only through an I-nn (many clients → one store) is the store's, and gives the authentication above
    const tbs = new Set(ctx.stride.boundaries.filter((b) => b.name.split('→').some((side) => cellNames(side.replace(/\s*\((?:I-\d+[^)]*)\)\s*$/, ''), c))).map((b) => b.id));
    const want = namesOf(c);
    threats = ctx.stride.threats.filter((x) => (x.tb && tbs.has(x.tb)) || want.some((n) => x.row.toLowerCase().includes(n)));
    const seen = new Set(); threats = threats.filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
    out.push(...(threats.length ? [`| ${Object.values(t.tcols).join(' | ')} |`, `|${Object.keys(t.tcols).map(() => '---').join('|')}|`, ...threats.map((x) => `| ${x.id} | ${x.tb || '—'} | ${cell(x.threat)} | ${cell(x.category)} | ${cell(x.severity || '—')} | ${cell(x.status)} | ${cell(ctx.stride.mitigation.get(x.id) || x.gap || '—')} |`)] : [t.none]), '', `_${path.relative(root, ctx.strideFile)}_`, '');
  }

  out.push(`## ${t.data} <!-- SECTION: Data -->`, '');
  if (!ctx.dsFile) out.push(nd('analysis/DATA-SENSITIVITY-*.md — run /sa-analysis:architecture-analysis data-sensitivity', 'Data Sensitivity', t.blocks.ds), '');
  else { const rows = sensitivity(ctx.dsFile, c);
    out.push(...(rows.length ? ['| Flow | Step | From | To | Carries Sensitive Data? | Encryption in Transit | Gap |', '|---|---|---|---|---|---|---|', ...rows.map((r) => `| ${[r.flow, r.step, r.from, r.to, r.carries, r.transit, r.gap].map((x) => cell(x || '—')).join(' | ')} |`)] : [t.none]), '', `_${path.relative(root, ctx.dsFile)}_`, ''); }

  out.push(`## ${t.tests} <!-- SECTION: Security Tests -->`, '');
  const tests = [];
  inRows.forEach(({ i, a }) => { if (a.ok) tests.push(t.tNoAuth(i.id), t.tOther(i.id)); else tests.push(t.tClosed(i.id)); });
  threats.filter((x) => !/pass/i.test(x.status)).forEach((x) => tests.push(t.tThreat(x.id, x.threat)));
  out.push(...(tests.length ? tests.map((x) => `- [ ] ${x}`) : [t.none]), '');
  return { slug: c.slug, nn, md: out.join('\n').replace(/\n{3,}/g, '\n\n'), gaps, inbound: inRows.map(({ i, a }) => ({ id: i.id, caller: plain(i.from), authenticated: a.ok })), threats: threats.map((x) => x.id) };
}

function run(root, opts = {}) {
  root = path.resolve(root);
  const facts = collect(root);
  const lang = opts.lang || (facts.architecture && facts.architecture.language) || 'en';
  const l2 = (facts.components || []).filter((c) => c.level === 'L2' && c.file_backed !== false);
  const want = !opts.components || opts.components === 'all' ? null : new Set(String(opts.components).split(',').map((s) => s.trim()).filter(Boolean));
  const picked = want ? l2.filter((c) => want.has(c.slug)) : l2;
  const unknown = want ? [...want].filter((s) => !l2.some((c) => c.slug === s)) : [];
  const strideFile = latest(root, /^STRIDE-.*\.md$/i), dsFile = latest(root, /^DATA[_-]SENSITIVITY-.*\.md$/i);
  const principle = principleBlock(root, 'Security by Design'), secDoc = securityDoc(root);
  // the institutional ADRs (001–100) the security section or the security principle cites, that exist on disk
  const cited = new Set([...(secDoc ? adrIds(read(path.join(root, secDoc))) : []), ...(principle ? adrIds(principle.body) : [])]);
  const adrs = (facts.adrs || []).filter((a) => cited.has(a.id) && parseInt(a.id.slice(4), 10) <= 100).sort((a, b) => a.id.localeCompare(b.id));
  const ctx = { handoffs: path.resolve(root, opts.handoffs || 'handoffs'), stride: strideFile ? stride(strideFile) : null, strideFile, dsFile, principle, secDoc, adrs };
  const out = picked.map((c) => render(root, c, facts, lang, ctx));
  if (opts.write) {
    const hd = path.resolve(root, opts.handoffs || 'handoffs'), gd = path.join(root, '.cache', 'sa-skills', 'handoff-payloads', 'asset-gaps');
    fs.mkdirSync(gd, { recursive: true });
    out.forEach((d) => {
      const dir = path.join(hd, 'assets', `${d.nn}-${d.slug}`); fs.mkdirSync(dir, { recursive: true });
      d.path = path.join(dir, 'security.md'); fs.writeFileSync(d.path, d.md);
      d.gaps_path = path.join(gd, `${d.slug}.security.json`); fs.writeFileSync(d.gaps_path, JSON.stringify({ gaps: d.gaps, assets: ['security.md'] }, null, 1) + '\n');
    });
  }
  return { lang, unknown, stride: strideFile ? path.relative(root, strideFile) : null, data_sensitivity: dsFile ? path.relative(root, dsFile) : null, adrs: adrs.map((a) => a.id), obligations: out };
}

module.exports = { run, render, cellNames, stride, sensitivity, principleBlock, tables };

if (require.main === module) {
  const a = process.argv.slice(2), val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const flagged = new Set(['--components', '--handoffs', '--lang'].flatMap((k) => { const i = a.indexOf(k); return i >= 0 ? [i + 1] : []; }));
  const root = a.find((x, i) => !x.startsWith('--') && !flagged.has(i));
  if (!root || !fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) { console.error('Usage: bun security-obligations.js <project_root> [--components <slug,slug> | all] [--handoffs <dir>] [--lang en|es] [--write] [--json]'); process.exit(2); }
  const r = run(root, { components: val('--components'), handoffs: val('--handoffs'), lang: val('--lang'), write: a.includes('--write') });
  if (a.includes('--json')) console.log(JSON.stringify({ lang: r.lang, unknown: r.unknown, stride: r.stride, data_sensitivity: r.data_sensitivity, adrs: r.adrs, obligations: r.obligations.map((d) => ({ slug: d.slug, path: d.path || null, inbound: d.inbound, threats: d.threats, gaps: d.gaps.length, gaps_path: d.gaps_path || null })) }, null, 1));
  else if (a.includes('--write')) { r.obligations.forEach((d) => console.log(`${path.relative(process.cwd(), d.path)} — ${d.inbound.length} caller(s), ${d.inbound.filter((x) => !x.authenticated).length} failing closed, ${d.threats.length} threat(s), ${d.gaps.length} gap(s)`)); console.log(`${r.obligations.length} component(s) · ${r.lang} · STRIDE ${r.stride || 'absent'} · Data Sensitivity ${r.data_sensitivity || 'absent'} · ${r.adrs.length} institutional ADR(s)`); }
  else r.obligations.forEach((d) => console.log(d.md));
  if (r.unknown.length) { console.error(`security-obligations: no C4 L2 component with slug ${r.unknown.join(', ')}`); process.exit(1); }
}
