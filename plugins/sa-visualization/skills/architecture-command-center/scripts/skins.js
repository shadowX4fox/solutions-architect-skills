#!/usr/bin/env bun
// The skin engine: every look of the command center is a folder — skins/<id>/skin.json (the palette in each mode it declares, its
// fonts, its 3D engine flags, its look, its name) and an optional skin.css (what a token cannot say: shapes, glow, stripes), every
// selector in it scoped to [data-skin="<id>"]. The plugin ships skins/; a project adds or overrides skins in its own folder
// (visualizations/skins/ beside the scene, or --skins <dir>), a project skin replacing a plugin skin of the same id. The palette is
// closed: skins/schema.json lists the tokens every skin defines in every mode; a skin may add private tokens its own skin.css uses.
// render.js inlines the result; the template holds no colour of its own.
//
// Usage: bun skins.js --check [<skins dir> ...]   validates the plugin's skins and any project folder given
const fs = require('fs');
const path = require('path');

const PLUGIN_SKINS = path.join(__dirname, '..', 'skins');
const SCHEMA = JSON.parse(fs.readFileSync(path.join(PLUGIN_SKINS, 'schema.json'), 'utf8'));
const REQUIRED = SCHEMA.groups.flatMap((g) => Object.keys(g.tokens));
const OPTIONAL = Object.keys(SCHEMA.optional);
const ID = /^[a-z][a-z0-9-]{0,31}$/;
const MODES = ['light', 'dark'];
const FONT_HOST = 'https://fonts.googleapis.com/';   // the only stylesheet host a published page may load

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const tokensUsed = (css) => new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
// a value or a rule may not leave its block or its <style>
const unsafe = (v) => /[{};<]|\/\*|\*\//.test(v);

// every top-level selector of a skin.css (and those inside an @media) must carry [data-skin="<id>"]
function unscoped(css, id) {
  const bad = [], tag = '[data-skin="' + id + '"]';
  const walk = (text) => {
    let i = 0;
    while (i < text.length) {
      if (text.startsWith('/*', i)) { i = text.indexOf('*/', i) + 2; continue; }
      if (/\s/.test(text[i])) { i++; continue; }
      const open = text.indexOf('{', i); if (open < 0) break;
      let depth = 0, k = open;
      for (; k < text.length; k++) { if (text[k] === '{') depth++; else if (text[k] === '}' && --depth === 0) break; }
      const sel = text.slice(i, open).trim(), body = text.slice(open + 1, k);
      if (sel.startsWith('@media') || sel.startsWith('@supports')) walk(body);
      else if (sel.startsWith('@keyframes')) { /* a keyframes block is named, not selected */ }
      else if (!sel.split(/,(?![^(]*\))/).every((s) => s.includes(tag))) bad.push(sel.slice(0, 80));
      i = k + 1;
    }
  };
  walk(css);
  return bad;
}

// One skin folder, read and checked. Returns { skin, errors }.
function readSkin(dir) {
  const errors = [], id = path.basename(dir), jf = path.join(dir, 'skin.json');
  if (!fs.existsSync(jf)) return { skin: null, errors: [id + ': no skin.json'] };
  let j; try { j = JSON.parse(read(jf)); } catch (e) { return { skin: null, errors: [id + ': skin.json is not JSON — ' + e.message] }; }
  const err = (m) => errors.push(id + ': ' + m);
  if (!ID.test(id)) err('the folder name is the id — lowercase letters, digits and hyphens');
  if (j.id !== id) err('"id" must equal the folder name ("' + id + '")');
  if (!['neon', 'flat'].includes(j.look)) err('"look" is neon or flat');
  if (!j.name || typeof j.name.en !== 'string') err('"name" needs at least { "en": … }');
  if (j.fonts != null && (!Array.isArray(j.fonts) || j.fonts.some((h) => typeof h !== 'string' || !h.startsWith(FONT_HOST)))) err('"fonts" are stylesheet links on ' + FONT_HOST);
  const css = fs.existsSync(path.join(dir, 'skin.css')) ? read(path.join(dir, 'skin.css')) : '';
  if (/<\/?style|@import/i.test(css)) err('skin.css may not close the page\'s <style> or @import');
  unscoped(css, id).forEach((s) => err('skin.css selector not scoped to [data-skin="' + id + '"]: ' + s));
  const usedByCss = tokensUsed(css);
  const modes = Object.keys(j.modes || {});
  if (!modes.length || modes.some((m) => !MODES.includes(m))) err('"modes" declares light, dark or both');
  modes.forEach((m) => {
    const t = j.modes[m] || {};
    const missing = REQUIRED.filter((k) => !(k in t));
    if (missing.length) err(m + ': missing ' + missing.join(' '));
    Object.entries(t).forEach(([k, v]) => {
      if (!/^--[a-z0-9-]+$/.test(k)) err(m + ': "' + k + '" is not a custom property name');
      else if (!REQUIRED.includes(k) && !OPTIONAL.includes(k) && !usedByCss.has(k)) err(m + ': "' + k + '" is not in the schema and its skin.css does not use it');
      if (typeof v !== 'string' || !v.trim() || unsafe(v)) err(m + ': ' + k + ' needs a CSS value with no { } ; < or comment');
    });
  });
  const e = j.engine || {};
  SCHEMA.engine.required.filter((k) => !(k in e)).forEach((k) => err('engine: missing ' + k));
  if (e.projector) modes.forEach((m) => ['--bg-core', '--bg-mid'].filter((k) => !((j.modes[m] || {})[k])).forEach((k) => err(m + ': engine.projector needs ' + k)));
  return { skin: { id, dir, json: j, css }, errors };
}

const listDirs = (root) => fs.existsSync(root) ? fs.readdirSync(root).map((n) => path.join(root, n)).filter((d) => fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, 'skin.json'))) : [];

// The skins a page carries: the plugin's, then the project's (which add or replace by id), ordered by "order" then id.
// An institution pack's skins come between the plugin's and the project's (scripts/shared/packs.js, sa-skills'); without sa-skills, none.
function packSkinDirs(projectRoot) {
  try { const { fromSaSkills } = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));
    const PACKS = require(fromSaSkills('scripts', 'shared', 'packs.js'));
    return PACKS.skinDirs({ project: projectRoot || process.cwd() }).map((s) => [s.dir, 'pack ' + s.name]);
  } catch (e) { return []; }
}
function loadSkins(projectDir, projectRoot) {
  const byId = new Map(), errors = [], from = {};
  [[PLUGIN_SKINS, 'plugin']].concat(packSkinDirs(projectRoot), [[projectDir, 'project']]).forEach(([root, src]) => {
    if (!root) return;
    listDirs(root).forEach((d) => { const { skin, errors: e } = readSkin(d); errors.push(...e.map((m) => src + ' skin ' + m)); if (skin && !e.length) { byId.set(skin.id, skin); from[skin.id] = src.startsWith('pack ') ? 'pack' : src; } });
  });
  const skins = [...byId.values()].sort((a, b) => (a.json.order ?? 99) - (b.json.order ?? 99) || a.id.localeCompare(b.id));
  return { skins, errors, from };
}

const decls = (t) => Object.entries(t).map(([k, v]) => k + ': ' + v + ';').join(' ');
// The palette as CSS: each skin's first mode under :root[data-skin], its dark mode under the OS preference and the explicit choice;
// a bare :root carries the default skin's first mode for the instant before the head script picks the skin
function tokensCss(skins, defaultId) {
  const out = [], first = (s) => s.json.modes[Object.keys(s.json.modes)[0]], scheme = (s) => Object.keys(s.json.modes)[0];
  const def = skins.find((s) => s.id === defaultId) || skins[0];
  // the core tokens only: an optional or private token here would reach every skin that does not set it (holo's dark label plate
  // under atlas when the file opens in holo and the viewer switches)
  if (def) out.push(':root { ' + decls(Object.fromEntries(REQUIRED.map((k) => [k, first(def)[k]]))) + ' color-scheme: ' + scheme(def) + '; }');
  skins.forEach((s) => {
    const m = s.json.modes, sel = ':root[data-skin="' + s.id + '"]';
    out.push(sel + ' { ' + decls(first(s)) + ' color-scheme: ' + scheme(s) + '; }');
    if (m.light && m.dark) {
      out.push('@media (prefers-color-scheme: dark) { ' + sel + ':not([data-theme="light"]) { ' + decls(m.dark) + ' color-scheme: dark; } }');
      out.push(sel + '[data-theme="dark"] { ' + decls(m.dark) + ' color-scheme: dark; }');
    }
  });
  return out.join('\n  ');
}
const rulesCss = (skins) => skins.filter((s) => s.css.trim()).map((s) => '/* skin: ' + s.id + ' */\n' + s.css.trim()).join('\n');
const fontLinks = (skins) => [...new Set(skins.flatMap((s) => s.json.fonts || []))].map((h) => '<link rel="stylesheet" href="' + h.replace(/"/g, '&quot;') + '">').join('\n');
// what the page's script reads: per skin its look, engine flags, name, hint and the modes it declares
const pageSkins = (skins) => Object.fromEntries(skins.map((s) => [s.id, Object.assign({}, s.json.engine, { look: s.json.look, name: s.json.name, hint: s.json.hint || {}, modes: Object.keys(s.json.modes) })]));

module.exports = { PLUGIN_SKINS, SCHEMA, REQUIRED, readSkin, loadSkins, tokensCss, rulesCss, fontLinks, pageSkins, unscoped };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] !== '--check') { console.error('Usage: bun skins.js --check [<skins dir> ...]'); process.exit(2); }
  const roots = [PLUGIN_SKINS].concat(args.slice(1));
  let bad = 0;
  roots.forEach((r) => listDirs(r).forEach((d) => { const { errors } = readSkin(d); errors.forEach((e) => console.error('✗ ' + e)); bad += errors.length; if (!errors.length) console.log('✓ ' + path.relative(process.cwd(), d)); }));
  process.exit(bad ? 1 : 0);
}
