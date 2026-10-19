#!/usr/bin/env bun
// Edit mode for the handoff kit (10.9.0) — a part whose sources changed is edited in place, not rewritten.
//
// A regenerated part came back in the model's other words: a release that added one record rewrote the whole kit, and the
// pull request hid the release's change in hundreds of lines. Two halves, both code:
//
//   baseline  handoff-prepare.js calls `editBaselines`: for each REGEN part that exists and whose payload hash changed, the
//             payload is cut again — same plugin, same judge answers — from the tree of the release the part was written
//             at (`architecture-v<manifest version>`, git archive), and the two are compared without their stamps. No
//             change: the part is SKIP (the hash was in an older form, or only a stamp moved). A change: an edit file —
//             the delta, the previous document — goes beside the payload, and the generator edits only what it reaches.
//   check     `bun kit-edit.js check <part.md> --previous <copy> --sections "<anchors>" [--restore] [--json]` — the part
//             against its previous text, section by section (`<!-- SECTION: … -->`, the text before the first one is the
//             preamble), dates and the Architecture Version row masked. A section that changed and is not among the
//             sections the generator declared is named; `--restore` puts its previous text back.
//
// No tag, no previous file, a template change, or a delta that reaches more than half the payload: the part is written
// whole, as before.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { stampFree, restampVersion } = require(path.join(__dirname, '..', 'utils', 'manifest.ts'));

const git = (cwd, args, opts = {}) => spawnSync('git', args, Object.assign({ cwd, encoding: 'utf8', maxBuffer: 64 << 20 }, opts));
const tagOf = (v) => `architecture-v${v}`;
const hasTag = (root, tag) => git(root, ['rev-parse', '-q', '--verify', `refs/tags/${tag}`]).status === 0;

// the delta of two payloads, stamps out — the hunks only, no file header
function delta(dir, name, before, after) {
  const a = path.join(dir, `${name}.before.md`), b = path.join(dir, `${name}.after.md`);
  fs.writeFileSync(a, stampFree(before)); fs.writeFileSync(b, stampFree(after));
  const r = git(dir, ['diff', '--no-index', '--no-color', '-U2', a, b]);
  fs.rmSync(a); fs.rmSync(b);
  const lines = (r.stdout || '').split('\n'); const at = lines.findIndex((l) => l.startsWith('@@'));
  return at < 0 ? '' : lines.slice(at).join('\n').trimEnd();
}
const changedLines = (d) => d.split('\n').filter((l) => /^[+-]/.test(l)).length;

// parts: [{ key, payload_path, output, version, set(edit_path|null, skipReason?) }]
async function editBaselines(root, { prepare, opts, payloadDir, parts }) {
  const edits = [], skipped = [];
  if (!parts.length || git(root, ['rev-parse', '--git-dir']).status !== 0) return { edits, skipped };
  const editDir = path.join(payloadDir, 'edit'); fs.mkdirSync(editDir, { recursive: true });
  const byVersion = new Map();
  for (const p of parts) if (p.version && fs.existsSync(p.output)) (byVersion.get(p.version) || byVersion.set(p.version, []).get(p.version)).push(p);
  for (const [v, group] of byVersion) {
    if (!hasTag(root, tagOf(v))) continue;
    const base = path.join(editDir, `baseline-${v}`), tree = path.join(base, 'tree');
    fs.rmSync(base, { recursive: true, force: true }); fs.mkdirSync(tree, { recursive: true });
    const tar = path.join(base, 'tree.tar');
    if (git(root, ['archive', '--format=tar', '-o', tar, tagOf(v)]).status !== 0 || spawnSync('tar', ['-xf', tar, '-C', tree]).status !== 0) continue;
    fs.rmSync(tar);
    const judge = path.join(root, '.cache', 'sa-skills', 'judge');   // the same answers: an endpoint the judge resolved resolves the same way
    if (fs.existsSync(judge)) fs.cpSync(judge, path.join(tree, '.cache', 'sa-skills', 'judge'), { recursive: true });
    // cut at the same place inside the tree: the payload links to the documents relative to its own folder
    const rel = path.relative(root, payloadDir), out = rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? path.join(tree, rel) : path.join(tree, '.cache', 'sa-skills', 'handoff-payloads');
    let b; try { b = await prepare(tree, Object.assign({}, opts, { out, handoffs: path.join(base, 'handoffs'), baseline: true })); } catch { continue; }
    if (!b || b.report.status === 'FAILED') continue;
    const was = { run: b.result.run.ekonte_payload_path };
    for (const s of b.result.seams) was[`seam:${s.edge_key}`] = s.payload_path;
    for (const c of b.result.cut_sheets) was[`cut-sheet:${c.slug}`] = c.payload_path;
    for (const p of group) {
      const before = was[p.key.startsWith('run:') ? 'run' : p.key]; if (!before || !fs.existsSync(before)) continue;
      const after = fs.readFileSync(p.payload_path, 'utf8'), name = p.key.replace(/[:/→]/g, '-');
      const d = delta(editDir, name, fs.readFileSync(before, 'utf8'), after);
      if (!d) { p.set(null, `unchanged against ${tagOf(v)} — the payload re-cut from that tree is the same`); skipped.push(p.key); continue; }
      if (changedLines(d) > after.split('\n').length / 2) continue;   // most of it moved: written whole
      const prev = path.join(editDir, `${name}.previous.md`); fs.copyFileSync(p.output, prev);
      const file = path.join(editDir, `${name}.md`);
      fs.writeFileSync(file, `# Edit mode — ${path.basename(p.output)}

This part exists and its sources changed since ${tagOf(v)}. Edit it in place: change only the sections the delta below
reaches, leave every other section as it is — same words, same order — and list the anchors you changed
(\`<!-- SECTION: … -->\`) in your result as \`edited_sections\`. The payload stays the reference for what you write.

- Document: ${p.output}
- Previous text: ${prev}
- Baseline: ${tagOf(v)}

## What changed in the payload since ${tagOf(v)}

\`\`\`diff
${d}
\`\`\`
`);
      p.set(file); edits.push(p.key);
    }
  }
  return { edits, skipped };
}

// ---------- check
const ANCHOR = /^#{1,6}\s.*<!--\s*SECTION:\s*([^>]+?)\s*-->/;
function sections(src) {
  const out = [], push = (key) => out.push({ key, lines: [] }); push('(preamble)');
  for (const l of src.replace(/\r\n?/g, '\n').split('\n')) { const m = l.match(ANCHOR); if (m) push(m[1]); out[out.length - 1].lines.push(l); }
  return out.map((s) => ({ key: s.key, text: s.lines.join('\n') }));
}
const mask = (t) => restampVersion(t, '0.0.0').replace(/\b\d{4}-\d{2}-\d{2}\b/g, 'YYYY-MM-DD').replace(/[ \t]+$/gm, '').trimEnd();
const versionOf = (src) => { const m = src.match(/^\|\s*(?:\*\*)?(?:Architecture Version|Versi[oó]n de la arquitectura)(?:\*\*)?\s*\|\s*v?(\d+\.\d+\.\d+)/im); return m ? m[1] : null; };

function check(file, previous, declared, { restore = false } = {}) {
  const now = fs.readFileSync(file, 'utf8'), was = fs.readFileSync(previous, 'utf8');
  const A = sections(was), B = sections(now), prev = new Map(A.map((s) => [s.key, s.text]));
  const want = new Set(declared.map((s) => s.trim()).filter(Boolean));
  const changed = [], undeclared = [];
  for (const s of B) if (!prev.has(s.key) || mask(prev.get(s.key)) !== mask(s.text)) { changed.push(s.key); if (!want.has(s.key)) undeclared.push(s.key); }
  const removed = A.filter((s) => !B.some((x) => x.key === s.key)).map((s) => s.key);
  for (const k of removed) { changed.push(k); if (!want.has(k)) undeclared.push(k); }
  const restored = [];
  if (restore && undeclared.length) {
    const v = versionOf(now);
    let out = B.map((s) => (undeclared.includes(s.key) && prev.has(s.key) ? (restored.push(s.key), prev.get(s.key)) : s.text)).join('\n');
    if (v) out = restampVersion(out, v);
    if (out !== now) fs.writeFileSync(file, out);
  }
  return { file, changed, declared: [...want], undeclared, restored, removed };
}

module.exports = { editBaselines, check, sections, delta };

if (require.main === module) {
  const args = process.argv.slice(2), opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  if (args[0] !== 'check' || !args[1] || !opt('--previous')) { console.error('Usage: bun kit-edit.js check <part.md> --previous <previous.md> --sections "<anchor,anchor>" [--restore] [--json]'); process.exit(2); }
  const r = check(args[1], opt('--previous'), (opt('--sections') || '').split(','), { restore: args.includes('--restore') });
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else console.log(`edit-check: ${path.basename(r.file)} — changed: ${r.changed.join(', ') || 'none'}${r.undeclared.length ? ` · not declared: ${r.undeclared.join(', ')}${r.restored.length ? ` (restored: ${r.restored.join(', ')})` : ''}` : ''}`);
  process.exit(r.undeclared.length && r.restored.length < r.undeclared.length ? 1 : 0);
}
