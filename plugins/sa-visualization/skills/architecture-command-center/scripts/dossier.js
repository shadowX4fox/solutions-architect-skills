#!/usr/bin/env node
// Alia's dossier: bakes what the project's files say into the scene, so the command center answers
// a click offline and never invents. Deterministic extraction, one section per source:
//   adrs         adr/ADR-*.md            title, status, date, scope, amendment, Decision summary, consequences, related
//   tdrs         tdr/TDR-*.md            title, status, date, affected components (mapped to scene nodes), ADRs, tags, description, impact, owner
//   compliance   compliance-docs/        the manifest rows and every requirement row (code, status, evidence, owner) per contract
//   components   docs/components/**/*.md the descriptor of every scene container — meta fields and every H2 section as paragraphs, bullets, tables
//   integrations docs/05-*.md            the I-nn inventory rows, endpoints resolved to scene nodes
//   findings     analysis/*.md, *.html   every findings table (first column `#` / `ID`, rows opening with a finding id), severity, the containers and deployment nodes named
//   sections     docs/NN-*.md             every section file: title, the EXPLORER_HEADER fields (components resolved to scene nodes), the 30-second summary, an outline of H2 / H3 headings with each H2's first paragraph — Alia's page for a section, and the explorer manifest's row for it
// Anything a file does not state is left out, and every scene reference without a file is reported.
// Usage: bun dossier.js <project-root | adr-dir> <scene.json> [--write] [--out <scene.json>] [--judge agent|typesafe|clef]
'use strict';
const fs = require('fs');
const path = require('path');
const SA = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));   // sa-visualization reads the architecture through sa-skills

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: bun dossier.js <project-root | adr-dir> <scene.json> [--write] [--out <scene.json>]');
  process.exit(1);
}
const rootArg = path.resolve(args[0]), scenePath = args[1];
const ROOT = fs.existsSync(path.join(rootArg, 'adr')) || fs.existsSync(path.join(rootArg, 'docs')) ? rootArg : path.dirname(rootArg);
const write = args.includes('--write');
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : scenePath;
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };   // --judge agent|typesafe|clef (else SA_JUDGE): the mitigation cells
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n?/g, "\n");
const listMd = (dir, recursive) => {
  if (!exists(dir)) return [];
  const out = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory() && recursive) out.push(...listMd(p, true));
    else if (d.isFile() && /\.md$/i.test(d.name)) out.push(p);
  });
  return out;
};

const scene = JSON.parse(read(scenePath));
const NODES = (scene.nodes || []).filter(n => n.kind !== 'actor');

// ---- Text helpers: plain text, no links, no emphasis; names compared without accents or case
const plain = (s) => String(s || '')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  .replace(/`([^`]*)`/g, '$1')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/\s+/g, '-');
const nodeByName = (name) => { const k = norm(name); return NODES.find(n => norm(n.name) === k) || null; };
const nodesMentioned = (cell) => { const k = ' ' + norm(cell) + ' '; return NODES.filter(n => k.includes(' ' + norm(n.name) + ' ')).map(n => n.id); };
let descriptorSlugToName = {};   // filled once the descriptors are read
const nodeBySlug = (s) => { const k = slug(s); return NODES.find(n => slug(n.name) === k) || (descriptorSlugToName[k] ? nodeByName(descriptorSlugToName[k]) : null); };

// ---- Markdown structure: sections, paragraphs, bullets, tables
const headingLevel = (l) => (l.match(/^(#+)\s/) || [null, ''])[1].length;
const sectionBody = (src, headingRe) => {
  const lines = src.split('\n');
  const start = lines.findIndex(l => headingRe.test(l));
  if (start < 0) return null;
  const level = headingLevel(lines[start]);
  const out = [];
  for (let i = start + 1; i < lines.length; i++) { const h = headingLevel(lines[i]); if (h && h <= level) break; out.push(lines[i]); }
  return out.join('\n');
};
const paragraphs = (body, max) => (body || '').split(/\n\s*\n/).map(p => p.trim())
  .filter(p => p && !/^#/.test(p) && !/^\|/.test(p) && !/^[-*]\s/.test(p) && !/^>/.test(p) && !/^\*\*[^*]+\*\*\s*:?\s*(<!--.*-->)?$/.test(p))
  .map(plain).filter(Boolean).slice(0, max);
const bullets = (body, max) => (body || '').split('\n').filter(l => /^\s*[-*]\s+/.test(l)).map(l => plain(l.replace(/^\s*[-*]\s+/, ''))).filter(Boolean).slice(0, max);
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => plain(c));
function tables(body, maxRows) {
  const lines = (body || '').split('\n'), out = [];
  let label = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const lm = l.match(/^\*\*([^*]+)\*\*\s*:?\s*(<!--\s*LABEL:\s*([^-]+?)\s*-->)?\s*$/);
    if (lm) { label = plain(lm[3] || lm[1]); continue; }
    if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const headers = cells(l); const rows = [];
      let j = i + 2;
      while (j < lines.length && /^\s*\|/.test(lines[j])) { rows.push(cells(lines[j])); j++; }
      out.push(Object.assign(label ? { label } : {}, { headers, rows: rows.slice(0, maxRows) }));
      label = null; i = j - 1;
    }
  }
  return out;
}
const field = (src, labels) => {
  for (const l of labels) {
    let m = src.match(new RegExp('^\\*\\*' + l + '\\s*:?\\*\\*\\s*:?\\s*(.+)$', 'mi'));
    if (!m) m = src.match(new RegExp('^\\|\\s*\\*\\*' + l + '\\*\\*\\s*\\|\\s*(.+?)\\s*\\|', 'mi'));
    if (m) return plain(m[1]);
  }
  return null;
};
const h1 = (src) => { const m = src.match(/^#\s+(.+)$/m); return m ? plain(m[1]) : null; };
const col = (headers, names) => headers.findIndex(h => names.some(n => norm(h) === norm(n) || norm(h).startsWith(norm(n))));

// ================= ADRs =================
const adrDir = path.join(ROOT, 'adr');
const cited = new Set();
(scene.nodes || []).forEach(n => (n.adrs || []).forEach(a => cited.add(a)));
(scene.useCases || []).forEach(u => (u.adrs || []).forEach(a => cited.add(a)));
((scene.deployment || {}).nodes || []).forEach(n => (n.adrs || []).forEach(a => cited.add(a)));
const adrFiles = exists(adrDir) ? fs.readdirSync(adrDir).filter(f => /^ADR-\d{3}.*\.md$/i.test(f)) : [];
const adrFileFor = (id) => adrFiles.find(f => f.toUpperCase().startsWith(id.toUpperCase() + '-') || f.toUpperCase() === id.toUpperCase() + '.MD');
const DECISION = /^##\s*(\d+\.\s*)?(Decision|Decisión)\b/i, SUMMARY = /^###\s*(\d+(\.\d+)*\.?\s*)?(Summary|Resumen)\b/i;
const CONTEXT = /^##\s*(\d+\.\s*)?(Context|Contexto)\b/i, CONSEQ = /^##\s*(\d+\.\s*)?(Consequences|Consecuencias)\b/i;
const POS = /^###\s*(\d+(\.\d+)*\.?\s*)?(Positive|Positivas|Consecuencias positivas|Positive Consequences)/i, NEG = /^###\s*(\d+(\.\d+)*\.?\s*)?(Negative|Negativas|Consecuencias negativas|Negative Consequences)/i;
function extractAdr(id, file) {
  const src = read(path.join(adrDir, file));
  const title = (h1(src) || id).replace(new RegExp('^' + id + '\\s*[:—-]\\s*', 'i'), '');
  const decision = sectionBody(src, DECISION);
  const summaryBody = decision ? sectionBody(decision, SUMMARY) : null;
  const summary = paragraphs(summaryBody, 1)[0] || paragraphs(decision, 1)[0] || paragraphs(sectionBody(src, CONTEXT), 1)[0];
  const conseq = sectionBody(src, CONSEQ);
  const positive = conseq ? bullets(sectionBody(conseq, POS), 3) : [], negative = conseq ? bullets(sectionBody(conseq, NEG), 3) : [];
  const general = conseq && !positive.length && !negative.length ? bullets(conseq, 4) : [];
  const relatedSrc = (src.match(/^\*\*(Related|Relacionados)\*\*\s*:\s*(.+)$/mi) || src.match(/^\|\s*\*\*(Related|Relacionados)\*\*\s*\|\s*(.+?)\s*\|/mi) || [])[2] || '';
  const related = [...new Set((relatedSrc.match(/ADR-\d{3}/g) || []).map(a => a.toUpperCase()))].filter(a => a !== id);
  const e = { id, title, file: rel(path.join(adrDir, file)) };
  const status = field(src, ['Status', 'Estado']), date = field(src, ['Date', 'Fecha']), scope = field(src, ['Scope', 'Alcance']), amended = field(src, ['Amended', 'Enmendado']);
  if (status) e.status = status.replace(/\s*\(.*?\)\s*$/, '');
  if (date) e.date = date; if (scope) e.scope = scope; if (amended) e.amended = amended;
  if (summary) e.summary = summary;
  if (positive.length || negative.length || general.length) e.consequences = Object.assign({}, positive.length ? { positive } : {}, negative.length ? { negative } : {}, general.length ? { general } : {});
  if (related.length) e.related = related;
  return e;
}
const adrs = {}, adrMissing = [];
[...cited].sort().forEach(id => { const f = adrFileFor(id); if (f) adrs[id] = extractAdr(id, f); else adrMissing.push(id); });

// ================= Compliance =================
const ccDir = path.join(ROOT, 'compliance-docs');
const compliance = { contracts: [] };
const manifestPath = path.join(ccDir, 'COMPLIANCE_MANIFEST.md');
if (exists(manifestPath)) {
  const t = tables(read(manifestPath), 50).find(tb => col(tb.headers, ['Filename', 'Archivo']) >= 0 && col(tb.headers, ['Score', 'Puntaje']) >= 0);
  if (t) {
    const iType = col(t.headers, ['Contract Type', 'Tipo']), iFile = col(t.headers, ['Filename', 'Archivo']), iScore = col(t.headers, ['Score', 'Puntaje']), iStatus = col(t.headers, ['Status', 'Estado']), iComp = col(t.headers, ['Completeness', 'Completitud']), iGen = col(t.headers, ['Generated', 'Generado']);
    t.rows.forEach(r => {
      const file = r[iFile]; if (!file) return;
      const c = { type: r[iType] || file, file: 'compliance-docs/' + file };
      if (iScore >= 0) c.score = r[iScore]; if (iStatus >= 0) c.status = r[iStatus]; if (iComp >= 0) c.completeness = r[iComp]; if (iGen >= 0) c.generated = r[iGen];
      const p = path.join(ccDir, file);
      if (exists(p)) {
        const reqs = [];
        const all = tables(read(p), 200).filter(tb => col(tb.headers, ['Status', 'Estado']) >= 0);
        const preferred = all.filter(tb => col(tb.headers, ['Requirement', 'Requisito', 'Sub-item', 'Subítem']) >= 0);
        (preferred.length ? preferred : all).forEach(tb => {
          const iCode = 0, iSt = col(tb.headers, ['Status', 'Estado']);
          const rows = tb.rows.filter(r => /^[A-Z]{2,6}-?\d+[A-Za-z0-9.-]*$/.test(r[0] || ''));
          if (!rows.length) return;
          const iName = 1, iEv = col(tb.headers, ['Source Section', 'Evidence', 'Sección', 'Evidencia', 'Source']), iOwner = col(tb.headers, ['Responsible', 'Owner', 'Responsable']), iCat = col(tb.headers, ['Category', 'Categoría']);
          rows.forEach(r => { const q = { code: r[iCode], name: r[iName] || '', status: r[iSt] || '' };
            if (iCat >= 0 && r[iCat]) q.category = r[iCat]; if (iEv >= 0 && r[iEv]) q.evidence = r[iEv]; if (iOwner >= 0 && r[iOwner]) q.owner = r[iOwner];
            if (!reqs.some(x => x.code === q.code)) reqs.push(q); });
        });
        if (reqs.length) c.requirements = reqs;
      } else c.missing = true;
      compliance.contracts.push(c);
    });
  }
}

// ================= Components (descriptors) =================
const compDir = path.join(ROOT, 'docs', 'components');
const descriptorFiles = listMd(compDir, true).filter(f => !/README\.md$/i.test(f));
const descriptorByName = {};
descriptorFiles.forEach(f => { const src = read(f); const t = h1(src); if (t) { descriptorByName[norm(t)] = { file: f, src }; descriptorSlugToName[slug(path.basename(f, '.md').replace(/^\d+-/, ''))] = t; } });
const components = {}, compMissing = [];
const META_FIELDS = [['type', 'Type'], ['technology', 'Technology'], ['internalName', 'Internal Name'], ['c4', 'C4 Level'], ['deploysAs', 'Deploys as'], ['communicatesVia', 'Communicates via'], ['description', 'Description'], ['componentVersion', 'Component Version'], ['lastUpdated', 'Last Updated']];
NODES.forEach(n => {
  const d = descriptorByName[norm(n.name)];
  if (!d) { compMissing.push(n.name); return; }
  const src = d.src, e = { name: n.name, file: rel(d.file), sections: [] };
  META_FIELDS.forEach(([k, label]) => { const v = field(src, [label]); if (v) e[k] = v; });
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    const m = l.match(/^##\s+(.+?)\s*(<!--\s*LABEL:\s*([^-]+?)\s*-->)?\s*$/);
    if (!m) return;
    const body = sectionBody(lines.slice(i).join('\n'), /^##\s+/);
    const sec = { title: plain(m[1]) };
    if (m[3]) sec.label = plain(m[3]);
    const ps = paragraphs(body, 3), bs = bullets(body, 10), ts = tables(body, 12);
    if (ps.length) sec.paragraphs = ps; if (bs.length) sec.bullets = bs; if (ts.length) sec.tables = ts;
    if (ps.length || bs.length || ts.length) e.sections.push(sec);
  });
  components[n.id] = e;
});

// ================= TDRs =================
const tdrDir = path.join(ROOT, 'tdr');
const tdrs = {};
const frontmatter = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---/); if (!m) return {};
  const out = {}; let key = null;
  m[1].split('\n').forEach(l => {
    const item = key && l.match(/^\s+-\s+(.*)$/); // a block list under the last key (`affected-components:` then `  - slug`, the template's shape)
    if (item) { if (!Array.isArray(out[key])) out[key] = out[key] ? [out[key]] : []; out[key].push(item[1].trim().replace(/^["']|["']$/g, '')); return; }
    const kv = l.match(/^([\w-]+):\s*(.*)$/); if (!kv) return; let v = kv[2].trim(); key = kv[1];
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else { const q = v.match(/^(["'])(.*?)\1/); v = q ? q[2] : v.replace(/\s+#.*$/, '').trim(); } // a quoted scalar, or a bare one with its YAML comment stripped (`Won't Fix` keeps its apostrophe)
    out[key] = v; });
  return out;
};
listMd(tdrDir, false).filter(f => /TDR-\d+/i.test(path.basename(f))).forEach(f => {
  const src = read(f), fm = frontmatter(src);
  const id = ((path.basename(f).match(/TDR-\d+/i) || [''])[0]).toUpperCase();
  const e = { id, title: (h1(src) || id).replace(new RegExp('^' + id + '\\s*[:—-]\\s*', 'i'), ''), file: rel(f) };
  const statusBody = sectionBody(src, /^##\s*(Status|Estado)\b/i);
  const st = (typeof fm.status === 'string' && fm.status.trim()) || (statusBody ? (statusBody.match(/`([^`]+)`/) || [null, paragraphs(statusBody, 1)[0]])[1] : null);
  if (st) e.status = plain(st);
  if (fm.date) e.date = fm.date;
  const comps = Array.isArray(fm['affected-components']) ? fm['affected-components'] : fm['affected-components'] ? [fm['affected-components']] : [];
  e.components = comps.map(s => { const n = nodeBySlug(s); return Object.assign({ slug: s }, n ? { node: n.id } : {}); });
  const rel_ = Array.isArray(fm['related-adrs']) ? fm['related-adrs'] : fm['related-adrs'] ? [fm['related-adrs']] : [];
  if (rel_.length) e.adrs = rel_.map(a => a.toUpperCase());
  if (Array.isArray(fm.tags) && fm.tags.length) e.tags = fm.tags;
  const desc = paragraphs(sectionBody(src, /^##\s*(Description|Descripción)\b/i), 1)[0]; if (desc) e.summary = desc;
  const impact = paragraphs(sectionBody(src, /^##\s*(Impact|Impacto)\b/i), 1)[0]; if (impact) e.impact = impact;
  const owner = paragraphs(sectionBody(src, /^##\s*(Owner|Responsable|Propietario)\b/i), 1)[0]; if (owner) e.owner = owner;
  tdrs[id] = e;
});

// ================= Integrations =================
const intFile = listMd(path.join(ROOT, 'docs'), false).find(f => /^05-/.test(path.basename(f)));
const integrations = [];
if (intFile) {
  tables(read(intFile), 200).forEach(tb => {
    const rows = tb.rows.filter(r => /^I-\d+/i.test(r[0] || ''));
    if (!rows.length) return;
    const iFrom = col(tb.headers, ['From', 'Desde', 'Source', 'Origen']), iTo = col(tb.headers, ['To', 'Hacia', 'Target', 'Destino']), iProto = col(tb.headers, ['Protocol', 'Protocolo']), iStyle = col(tb.headers, ['Style', 'Estilo']), iOwner = col(tb.headers, ['Owner', 'Propietario', 'Counterpart']);
    rows.forEach(r => {
      const e = { id: r[0].toUpperCase(), from: r[iFrom] || '', to: r[iTo] || '', fromNodes: nodesMentioned(r[iFrom] || ''), toNodes: nodesMentioned(r[iTo] || '') };
      if (iProto >= 0 && r[iProto]) e.protocol = r[iProto]; if (iStyle >= 0 && r[iStyle]) e.style = r[iStyle]; if (iOwner >= 0 && r[iOwner]) e.owner = r[iOwner];
      if (!integrations.some(x => x.id === e.id)) integrations.push(e);
    });
  });
}

// ================= Findings (analysis/) =================
// One entry per report in analysis/, read through the analysis skill's findings contract —
// `scripts/shared/findings.js`, the parser its report check enforces — so what the
// skill accepts is exactly what Alia reads: every `#` / `ID` table whose rows open with a finding
// id (Markdown) or the `const data` literal (HTML); id, label (the first naming column, never a
// Tier or Flow cell), every column, a severity from the Severity / Risk column, the Tier column, the
// prefix registry or the section title; labels resolved to scene containers and deployment nodes.
const findingsContract = require(SA.fromSaSkills('scripts', 'shared', 'findings.js'));
const anaDir = path.join(ROOT, 'analysis');
const PHYS = ((scene.deployment || {}).nodes || []);
// A label names a container by its canonical name, by the descriptor's filename slug (the name a
// report used before a rename), or — for deployment nodes — by every significant word of the name
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'the', 'of', 'and', 'a', 'en', 'in', 'on']);
const words = (t) => norm(t).split(' ').filter(w => w && !STOP.has(w));
const nodesLoose = (cell) => { const k = ' ' + norm(cell) + ' ';
  return NODES.filter(n => k.includes(' ' + norm(n.name) + ' ') || Object.entries(descriptorSlugToName).some(([sl, nm]) => norm(nm) === norm(n.name) && k.includes(' ' + sl.replace(/-/g, ' ') + ' '))).map(n => n.id); };
const physMentioned = (cell) => { const k = ' ' + norm(cell) + ' ', ws = new Set(words(cell));
  return PHYS.filter(n => k.includes(' ' + norm(n.name) + ' ') || (words(n.name).length >= 2 && words(n.name).every(w => ws.has(w)))).map(n => n.id); };
const uniq = (a) => [...new Set(a)];
// A finding about an integration lights the edge, not only the blocks: the `I-nn` ids it cites,
// through the docs/05 inventory, and the `X → Y` pairs it writes (a STRIDE boundary, a coupling
// cycle, a hop) resolve to the scene edges between those containers, in either direction; the
// integration ids on those edges' labels come along so the page shows the rows
const EDGE_KEYS = new Set((scene.edges || []).map(e => [e.a, e.b].sort().join('|')));
const edgeBetween = (a, b) => EDGE_KEYS.has([a, b].sort().join('|')) ? [a, b].sort() : null;
const intsInText = (t) => uniq((String(t).toUpperCase().match(/\bI-\d{1,3}\b/g) || []).map(x => x.replace(/I-(\d)$/, 'I-0$1')));
const edgesOf = (text) => {
  const found = [], ints = intsInText(text);
  const add = (pair) => { if (pair && !found.some(p => p[0] === pair[0] && p[1] === pair[1])) found.push(pair); };
  ints.forEach(id => {
    const row = integrations.find(i => i.id === id);
    if (row) row.fromNodes.forEach(a => row.toNodes.forEach(b => add(edgeBetween(a, b))));
    (scene.edges || []).forEach(e => { if (intsInText(e.label || '').includes(id)) add(edgeBetween(e.a, e.b)); });
  });
  String(text).split(/\s*(?:→|->|⇒|↔|<->)\s*/).reduce((prev, part) => {
    const here = nodesLoose(part);
    if (prev && prev.length === 1 && here.length === 1) add(edgeBetween(prev[0], here[0]));
    return here;
  }, null);
  const onEdges = found.flatMap(([a, b]) => (scene.edges || []).filter(e => (e.a === a && e.b === b) || (e.a === b && e.b === a)).flatMap(e => intsInText(e.label || '')));
  return { edges: found, ints: uniq(ints.filter(id => integrations.some(i => i.id === id)).concat(onEdges)) };
};
const findings = [];
// one report per lens, the latest by the date in its name (the later file name on a tie): a re-run writes a new dated
// report beside the old one, and both used to reach the viewer as two lenses of the same name (STRIDE 09-20 and 09-27)
const anaFiles = exists(anaDir) ? fs.readdirSync(anaDir).filter(f => /\.(md|html)$/i.test(f) && !/SECURITY[-_]POSTURE/i.test(f)).sort() : [];
const latestOf = {};
anaFiles.forEach(f => { const k = findingsContract.lensOf(f), cur = latestOf[k]; if (!cur || (findingsContract.dateOf(f) || '') >= (findingsContract.dateOf(cur) || '')) latestOf[k] = f; });
const superseded = anaFiles.filter(f => latestOf[findingsContract.lensOf(f)] !== f);
if (superseded.length) console.error(`  analysis: ${superseded.length} older report(s) left out — ${superseded.join(', ')}`);
const extracted = anaFiles.filter(f => !superseded.includes(f)).map(f => {
  const file = path.join(anaDir, f), src = read(file), lens = findingsContract.lensOf(f);
  const r = /\.md$/i.test(f) ? findingsContract.extractMarkdown(src, lens) : findingsContract.extractHtml(src, lens);
  if (r.error) console.warn(`  ${f}: ${r.error}`);
  return { f, file, lens, r };
});
// whether each mitigation cell describes a control in place today — the contract parses the column, the judge
// (scripts/judge.js, `--judge` else SA_JUDGE) re-reads the cell; the residual severity Alia ranks by follows. A cell the
// judge has not answered keeps the contract's reading and is reported as not re-read (undecided), with the worksheet
const mit = await findingsContract.judgeMitigations(extracted.flatMap(x => x.r.items.map(it => ({ it, lens: x.lens }))), { engine: opt('--judge'), root: ROOT });
if (mit.asked) console.error(`  mitigations: ${mit.asked} cell(s) read by ${mit.engine}${mit.flipped.length ? ` · ${mit.flipped.length} state(s) changed:\n${mit.flipped.map(w => '    - ' + w).join('\n')}` : ''}${(mit.unsure || []).length ? `\n  mitigations to confirm (the contract's reading kept):\n${mit.unsure.map(w => '    - ' + w).join('\n')}` : ''}${mit.note ? ` · ${mit.note}` : ''}${(mit.undecided || []).length ? `\n  mitigations not re-read (undecided, ${mit.undecided.length})${mit.pending ? ` — answer ${mit.pending} and re-run` : ''}:\n${mit.undecided.map(w => '    - ' + w).join('\n')}` : ''}`);
extracted.forEach(({ f, file, lens, r }) => {
  const items = r.items.map(x => {
    const text = [x.label].concat(Object.values(x.fields)).join(' ');
    const e = { id: x.id, label: x.label, fields: x.fields };
    if (x.severity) e.severity = x.severity; if (x.tier) e.tier = x.tier;
    if (x.what) e.what = x.what; if (x.mitigation) e.mitigation = x.mitigation; if (x.residual && x.residual !== x.severity) e.residual = x.residual;   // 8.63.0: the "what", the mitigation column and the residual severity from the contract
    e._text = text;   // the nodes and deployment nodes the finding is about are judged in one batch below, after every file is read
    const rel = edgesOf(text); if (rel.edges.length) e.edges = rel.edges; if (rel.ints.length) e.ints = rel.ints;
    return e;
  });
  if (items.length) findings.push(Object.assign({ analysis: lens, file: rel(file) }, findingsContract.dateOf(f) ? { date: findingsContract.dateOf(f) } : {}, { items }));
});
// Which containers and deployment nodes a finding is about: every one its row names, through scripts/resolve-name.js
// `mentionCandidates` (canonical names, the descriptors' filename slugs as aliases, every significant word for a
// deployment node) — read over the row WITHOUT its mitigation and recommendation cells. Through 8.64.0 the whole row was the
// haystack, so a container named only under "Recommended action" lit up on the stage as if the finding were about it. This
// is a column rule, not a judgement: a first cut asked Jev whether each named component was "what the finding is about" and
// it dropped members of a Blast Radius fan-out list at random (kept `Cache de Pedidos`, dropped `Escritor del Cache`
// from the same "16 —" cell), because a blast radius is about every component it reaches. Code owns this one.
{
  const { mentionCandidates } = require(SA.fromSaSkills('scripts', 'resolve-name.js'));
  const PASSING = /recommend|recomend|remediat|mitigaci|mitigation|exit path|bulkhead present|backpressure|replacement implemented|acci[oó]n recomendada|next step|siguiente paso/i;
  const aliases = new Map(); Object.entries(descriptorSlugToName).forEach(([sl, nm]) => { const n = NODES.find(x => norm(x.name) === norm(nm)); if (n) aliases.set(sl.replace(/-/g, ' '), n); });
  let total = 0, passing = 0;
  findings.forEach(f => f.items.forEach(e => {
    const about = [e.label].concat(Object.entries(e.fields).filter(([h]) => !PASSING.test(h)).map(([, v]) => v)).join(' ');
    const lit = mentionCandidates(about, NODES, { aliases }).map(n => n.id);
    const everywhere = mentionCandidates(e._text, NODES, { aliases }).map(n => n.id);
    e.nodes = uniq(lit); e.phys = uniq(mentionCandidates(about, PHYS, { looseWords: true }).map(n => n.id));
    // A row that names nothing drawn still has a subject (8.69.0 — 18 of 182 findings lit nothing on the reference):
    // 1. the section it sits under — a STRIDE trust boundary names the pair it guards ("TB-05 — Aplicación Tienda Móvil ↔
    //    Base Local de Pedidos (I-18)"), or the deployment nodes of a crossing ("AKS triburetail → EKS …");
    // 2. an ADR-only row (architectural debt: an ADR and its status) — the containers that ADR governs, from the scene.
    // Either is marked `via`, so the viewer can say how the finding reached the stage. A tool outside the model stays unlit.
    if (!e.nodes.length && !e.phys.length && e.tier) {
      const rel = edgesOf(e.tier);
      e.nodes = uniq(mentionCandidates(e.tier, NODES, { aliases }).map(n => n.id).concat(rel.edges.flat()));
      e.phys = uniq(mentionCandidates(e.tier, PHYS, { looseWords: true }).map(n => n.id));
      if (rel.edges.length && !e.edges) e.edges = rel.edges; if (rel.ints.length && !e.ints) e.ints = rel.ints;
      if (e.nodes.length || e.phys.length) e.via = 'section';
    }
    if (!e.nodes.length && !e.phys.length) {
      const cited = uniq(about.match(/\bADR-\d{3}\b/g) || []);
      if (cited.length) { e.nodes = NODES.filter(n => (n.adrs || []).some(a => cited.includes(a))).map(n => n.id); if (e.nodes.length) e.via = 'adr'; }
    }
    total++; passing += everywhere.filter(id => !lit.includes(id)).length; delete e._text;
  }));
  const unlit = findings.flatMap(f => f.items.filter(e => !e.nodes.length && !e.phys.length).map(e => f.analysis + ' ' + e.id));
  if (total) console.error(`  findings → nodes: ${total} finding(s)${passing ? ` · ${passing} mention(s) only in a recommendation or mitigation cell, not lit` : ''}${unlit.length ? ` · ${unlit.length} name nothing drawn: ${unlit.join(', ')}` : ''}`);
}

// ================= Sections (docs/NN-*.md) =================
// The section files as pages: the same EXPLORER_HEADER the explorer manifest reads, the summary
// blockquote, and an outline — enough to answer "what does the architecture say about X" and to
// point at the one heading to open, without carrying the section's body into the scene.
// One parser for the header, shared with the explorer CLI, the component facts and the backfill
// skill: `header-detector.ts` (Bun transpiles the TypeScript on require). A key the parser does
// not know never reaches the page — `explorer-cli.ts check` is where it gets reported.
const headerFields = require(SA.fromSaSkills('scripts', 'shared', 'header-detector.ts')).parseHeader;
const sections = [];
listMd(path.join(ROOT, 'docs'), false).filter(f => /^\d\d-.*\.md$/.test(path.basename(f))).sort().forEach(f => {
  const src = read(f), lines = src.split('\n');
  const e = { id: path.basename(f, '.md'), title: h1(src) || path.basename(f, '.md'), file: rel(f) };
  const hf = headerFields(src);
  if (hf) { if (hf.scope) e.scope = hf.scope; if (hf.key_concepts) e.concepts = hf.key_concepts; if (hf.technologies) e.technologies = hf.technologies;
    if (hf.related_adrs) e.adrs = hf.related_adrs.map(a => a.toUpperCase());
    if (hf.components) { const ids = hf.components.map(s => nodeBySlug(s)).filter(Boolean).map(n => n.id); if (ids.length) e.nodes = uniq(ids); } }
  const body = src.replace(/<!--[\s\S]*?-->/g, '');
  const quote = (body.match(/^>\s*(.+(?:\n>\s*.+)*)/m) || [null, ''])[1];
  if (quote) e.summary = plain(quote.replace(/^>\s*/gm, ' '));
  e.outline = [];
  lines.forEach((l, i) => {
    const m = l.match(/^(##|###)\s+(.+?)\s*(<!--\s*(?:SECTION|LABEL):\s*([^-]+?)\s*-->)?\s*$/); if (!m) return;
    const o = { level: m[1].length, title: plain(m[2]) }; if (m[4]) o.anchor = plain(m[4]);
    if (m[1] === '##') { const p = paragraphs(sectionBody(lines.slice(i).join('\n'), /^##\s+/), 1)[0]; if (p) o.summary = p.length > 320 ? p.slice(0, 319) + '…' : p; }
    e.outline.push(o);
  });
  e.bytes = Buffer.byteLength(src, 'utf8');
  sections.push(e);
});

// ================= Report and write =================
const dossier = { adrs };
if (Object.keys(tdrs).length) dossier.tdrs = tdrs;
if (compliance.contracts.length) dossier.compliance = compliance;
if (Object.keys(components).length) dossier.components = components;
if (integrations.length) dossier.integrations = integrations;
if (findings.length) dossier.findings = findings;
if (sections.length) dossier.sections = sections;
console.log(`ADRs: ${Object.keys(adrs).length} of ${cited.size} cited found in ${rel(adrDir) || 'adr'}`);
if (adrMissing.length) console.warn(`  no ADR file for: ${adrMissing.join(', ')} — Alia will say so when they are clicked`);
console.log(`TDRs: ${Object.keys(tdrs).length} on file` + (Object.keys(tdrs).length ? ` (${Object.values(tdrs).filter(t => t.components.some(c => c.node)).length} touch a scene container)` : ''));
console.log(`Compliance: ${compliance.contracts.length} contracts in the manifest, ${compliance.contracts.reduce((s, c) => s + (c.requirements || []).length, 0)} requirement rows` + (compliance.contracts.some(c => c.missing) ? ` — missing files: ${compliance.contracts.filter(c => c.missing).map(c => c.file).join(', ')}` : ''));
console.log(`Components: ${Object.keys(components).length} of ${NODES.length} containers have a descriptor`);
if (compMissing.length) console.warn(`  no descriptor whose H1 matches: ${compMissing.join(', ')}`);
console.log(`Findings: ${findings.length} analyses, ${findings.reduce((s, a) => s + a.items.length, 0)} findings` + (findings.length ? ` (${findings.map(a => a.analysis + ' ' + a.items.length + ', ' + a.items.filter(x => x.nodes.length || x.phys.length).length + ' resolved' + (a.items.some(x => x.edges) ? ', ' + a.items.filter(x => x.edges).length + ' on an edge' : '')).join(' · ')})` : ''));
console.log(`Sections: ${sections.length} docs/NN files` + (sections.length ? ` (${sections.filter(s => s.summary).length} with a summary, ${sections.reduce((n, s) => n + s.outline.length, 0)} headings)` : ''));
console.log(`Integrations: ${integrations.length} rows` + (integrations.length ? ` (${integrations.filter(i => i.fromNodes.length && i.toNodes.length).length} resolved to scene nodes on both ends)` : ''));
if (write) {
  scene.dossier = Object.assign({}, dossier, { generated: new Date().toISOString().slice(0, 10) });
  fs.writeFileSync(outPath, JSON.stringify(scene, null, 1) + '\n');
  console.log(`Wrote dossier into ${outPath}`);
} else {
  process.stdout.write(JSON.stringify(dossier, null, 2) + '\n');
}
