// The document theme every export renders with: colours, the document-type colours, the cover, the blazon, the PDF heading font.
// One resolver, in this order: the --theme argument (a bundled id or a folder holding theme.json) → an institution
// pack's `provides.docTheme` (scripts/shared/packs.js) → the base's own `alia`. A theme states only what it changes:
// every missing key falls back to `alia`, so a pack can recolour without redrawing the cover.
//
//   bun theme.js [--theme <id|dir>] [--project <dir>] [--json]     the theme in force and where it came from
'use strict';
const fs = require('fs');
const path = require('path');

const THEMES = path.join(__dirname, 'themes');
const DEFAULT_ID = 'alia';
const HEX = /^[0-9A-Fa-f]{6}$/;

const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const bundled = () => fs.readdirSync(THEMES).filter((d) => fs.existsSync(path.join(THEMES, d, 'theme.json')));

function packTheme(project, packOpts) {
  try {
    const packs = require('../../scripts/shared/packs.js');
    const hit = packs.assetPath('doc-theme', Object.assign({ project }, packOpts));
    return hit.from && hit.from !== 'base' ? { dir: hit.path, from: hit.from } : null;
  } catch (e) { return null; }   // a docgen copied without the plugin around it still renders with the base theme
}

// The folder the theme comes from, and who chose it.
function locate({ theme, project, packOpts } = {}) {
  if (theme) {
    if (bundled().includes(theme)) return { dir: path.join(THEMES, theme), from: `--theme ${theme}` };
    const dir = path.resolve(theme);
    if (fs.existsSync(path.join(dir, 'theme.json'))) return { dir, from: `--theme ${dir}` };
    throw new Error(`--theme ${theme}: neither a bundled theme (${bundled().join(', ')}) nor a folder holding theme.json`);
  }
  return packTheme(project, packOpts) || { dir: path.join(THEMES, DEFAULT_ID), from: 'base' };
}

// Merge a theme over the base one, key by key; a value that is not a 6-digit hex is dropped with a warning.
function loadTheme(opts = {}) {
  const { dir, from } = locate(opts);
  const base = read(path.join(THEMES, DEFAULT_ID, 'theme.json'));
  const own = read(path.join(dir, 'theme.json'));
  const warnings = [];
  const colours = (section, b = {}, o = {}) => {
    const out = Object.assign({}, b);
    for (const [k, v] of Object.entries(o || {})) {
      if (typeof v === 'string' && HEX.test(v)) out[k] = v.toUpperCase();
      else if (k !== 'style' && k !== 'image') warnings.push(`${section}.${k}: "${v}" is not a 6-digit hex colour — the base value is kept`);
    }
    return out;
  };
  // the cover and the heading font are the theme's own: a theme that states none gets a light cover with no image and
  // the body font, never Alia's — an organization's brand does not borrow the base's character
  const coverOwn = own.cover || { style: 'light' };
  const cover = Object.assign(colours('cover', base.cover, coverOwn), { style: coverOwn.style === 'night' ? 'night' : 'light' });
  cover.image = coverOwn.image && fs.existsSync(path.join(dir, coverOwn.image)) ? path.join(dir, coverOwn.image) : null;
  if (coverOwn.image && !cover.image) warnings.push(`cover.image: ${coverOwn.image} not found in ${dir} — the cover has no image`);

  // the blazon is the theme's own mark (cover + every page header): a theme that names none has none, never Alia's escudo
  const blazon = own.blazon && fs.existsSync(path.join(dir, own.blazon)) ? path.join(dir, own.blazon) : null;
  if (own.blazon && !blazon) warnings.push(`blazon: ${own.blazon} not found in ${dir} — the documents carry no blazon`);

  let fonts = null;
  const f = own.fonts && own.fonts.heading, fDir = dir;
  if (f && f.family) {
    const files = {};
    for (const k of ['normal', 'bold', 'italics', 'bolditalics']) {
      const p = path.join(fDir, f[k] || f.normal || '');
      if (f[k] && fs.existsSync(p)) files[k] = p;
    }
    if (files.normal) fonts = { heading: Object.assign({ family: f.family }, { normal: files.normal, bold: files.bold || files.normal, italics: files.italics || files.normal, bolditalics: files.bolditalics || files.bold || files.normal }) };
    else warnings.push(`fonts.heading: ${f.normal} not found in ${fDir} — headings use the body font`);
  }

  return {
    id: own.id || path.basename(dir), name: own.name || own.id || path.basename(dir), dir, from,
    colors: colours('colors', base.colors, own.colors),
    docTypes: colours('docTypes', base.docTypes, own.docTypes),
    cover, blazon, fonts, warnings,
  };
}

module.exports = { loadTheme, bundled, DEFAULT_ID };

if (require.main === module) {
  const a = process.argv.slice(2), opt = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  try {
    const t = loadTheme({ theme: opt('--theme'), project: opt('--project') || process.cwd() });
    if (a.includes('--json')) { console.log(JSON.stringify(t, null, 2)); process.exit(0); }
    console.log(`document theme: ${t.name} (${t.id}) — from ${t.from}`);
    console.log(`  folder: ${t.dir}`);
    console.log(`  cover:  ${t.cover.style}${t.cover.image ? ' · ' + path.basename(t.cover.image) : ''}`);
    console.log(`  blazon: ${t.blazon ? path.basename(t.blazon) + ' (cover and page headers)' : 'none'}`);
    console.log(`  fonts:  ${t.fonts ? t.fonts.heading.family + ' (PDF headings)' : 'the body font'}`);
    t.warnings.forEach((w) => console.log(`  ! ${w}`));
  } catch (e) { console.error(e.message); process.exit(2); }
}
