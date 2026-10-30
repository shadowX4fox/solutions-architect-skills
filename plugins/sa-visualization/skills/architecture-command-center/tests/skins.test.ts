// The skin engine (scripts/skins.js): every plugin skin passes the schema, a project skin adds or replaces one by id, a skin that
// breaks the contract is refused with the reason, and the template carries no colour, token block or skin id of its own.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');
const SK = require(join(ROOT, 'scripts', 'skins.js'));
const RENDER = join(ROOT, 'scripts', 'render.js');
const SCENE = join(ROOT, 'examples', 'order-desk.scene.json');
const TEMPLATE = readFileSync(join(ROOT, 'VIEWER_TEMPLATE.html'), 'utf8');

// a valid skin to bend in each refusal test: the plugin's atlas, renamed
function fixture(id = 'acme', mutate?: (j: any) => void, css = '') {
  const dir = mkdtempSync(join(tmpdir(), 'skins-')), d = join(dir, id);
  mkdirSync(d);
  const j = JSON.parse(readFileSync(join(SK.PLUGIN_SKINS, 'atlas', 'skin.json'), 'utf8'));
  j.id = id; j.order = 9; j.name = { en: 'Acme', es: 'Acme' };
  if (mutate) mutate(j);
  writeFileSync(join(d, 'skin.json'), JSON.stringify(j));
  if (css) writeFileSync(join(d, 'skin.css'), css);
  return { root: dir, dir: d };
}

describe('plugin skins', () => {
  test('every plugin skin passes the schema in every mode it declares', () => {
    const { skins, errors, from } = SK.loadSkins(null);
    expect(errors).toEqual([]);
    // the plugin's own — an installed institution pack may add more (its skins load between the plugin's and the project's)
    expect(skins.filter((s: any) => from[s.id] === 'plugin').map((s: any) => s.id)).toEqual(['alia', 'holo', 'atlas', 'corporate']);
    skins.forEach((s: any) => Object.values(s.json.modes).forEach((t: any) => SK.REQUIRED.forEach((k: string) => expect(t[k]).toBeTruthy())));
  });
  test('alia is the default: the first by order, so render.js opens a file in it when no --theme, scene or pack names one; holo stays available', () => {
    const { skins } = SK.loadSkins(null);
    expect(skins[0].id).toBe('alia');
    expect(skins.map((s: any) => s.id)).toContain('holo');
  });
  test('alia shows Alia in person: each face embedded once, picked by the page\'s mood and by the codec\'s own', () => {
    const css = SK.loadSkins(null).skins.find((s: any) => s.id === 'alia').css;
    expect((css.match(/data:image\/webp;base64,/g) || []).length).toBe(4);
    ['thinking', 'pleased', 'worried', 'stern'].forEach((m) => {
      expect(css).toContain('[data-alia-mood="' + m + '"]');
      expect(css).toContain('[data-mood="' + m + '"]');
    });
    expect(css).toContain('.codec .cface svg { display: none; }');
  });
  test('the palette CSS: a block per skin, the dark mode under the OS preference and the explicit choice, a default bare :root', () => {
    const { skins } = SK.loadSkins(null), css = SK.tokensCss(skins, 'holo');
    expect(css).toContain(':root[data-skin="holo"] {');
    expect(css).toContain('@media (prefers-color-scheme: dark) { :root[data-skin="atlas"]:not([data-theme="light"])');
    expect(css).toContain(':root[data-skin="atlas"][data-theme="dark"]');
    expect(css).not.toContain(':root[data-skin="holo"][data-theme="dark"]');   // one mode: no dark override
    expect(css.startsWith(':root { ')).toBe(true);
  });
  test('no skin\'s optional or private token leaks to another: the bare :root carries the core tokens only', () => {
    const { skins } = SK.loadSkins(null), bare = SK.tokensCss(skins, 'holo').split('\n')[0];
    expect(bare).not.toContain('--label-plate'); expect(bare).not.toContain('--floor-line'); expect(bare).not.toContain('--dot');
    SK.REQUIRED.forEach((k: string) => expect(bare).toContain(k + ':'));
  });
  test('the plugin ships no brand: the corporate skin is neutral', () => {
    const j = JSON.parse(readFileSync(join(SK.PLUGIN_SKINS, 'corporate', 'skin.json'), 'utf8'));
    expect(JSON.stringify(j)).not.toMatch(/#ffdd00|#0f265c/i);   // no brand yellow or brand navy: an organization's brand is a project or pack skin
  });
});

describe('project skins', () => {
  test('a project skin is added, and one with a plugin id replaces it', () => {
    const add = fixture('acme'), rep = fixture('atlas', (j) => { j.modes.light['--bg'] = '#123456'; });
    cpSync(rep.dir, join(add.root, 'atlas'), { recursive: true });
    const { skins, errors, from } = SK.loadSkins(add.root);
    expect(errors).toEqual([]);
    expect(from.acme).toBe('project'); expect(from.atlas).toBe('project'); expect(from.holo).toBe('plugin');
    expect(skins.find((s: any) => s.id === 'atlas').json.modes.light['--bg']).toBe('#123456');
    rmSync(add.root, { recursive: true }); rmSync(rep.root, { recursive: true });
  });
  const refuse = (what: string, f: any, re: RegExp) => test('refused: ' + what, () => {
    const { errors } = SK.readSkin(f.dir);
    expect(errors.join('\n')).toMatch(re);
    rmSync(f.root, { recursive: true });
  });
  refuse('a missing core token', fixture('acme', (j) => { delete j.modes.dark['--sev-critical']; }), /dark: missing --sev-critical/);
  refuse('a token outside the schema its CSS does not use', fixture('acme', (j) => { j.modes.light['--made-up'] = '#fff'; }), /--made-up/);
  refuse('a value that leaves its block', fixture('acme', (j) => { j.modes.light['--bg'] = 'red; } body { display: none'; }), /--bg needs a CSS value/);
  refuse('a selector not scoped to the skin', fixture('acme', undefined, '.card { color: red; }'), /not scoped/);
  refuse('a font off Google Fonts', fixture('acme', (j) => { j.fonts = ['https://example.com/f.css']; }), /fonts/);
  refuse('an id that is not the folder name', fixture('acme', (j) => { j.id = 'other'; }), /"id" must equal/);
  refuse('a projector without its backdrop tokens', fixture('acme', (j) => { j.engine.projector = true; }), /engine.projector needs --bg-core/);

  test('render.js picks up the skins folder beside the scene and refuses an invalid one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skinproj-')), viz = join(dir, 'visualizations');
    mkdirSync(join(viz, 'skins'), { recursive: true }); cpSync(SCENE, join(viz, 'scene.json'));
    const ok = fixture('acme'); cpSync(ok.dir, join(viz, 'skins', 'acme'), { recursive: true });
    const r = Bun.spawnSync(['bun', RENDER, join(viz, 'scene.json'), join(dir, 'out.html'), '--theme', 'acme'], { stdout: 'pipe', stderr: 'pipe' });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toContain('project skins: acme');
    const html = readFileSync(join(dir, 'out.html'), 'utf8');
    expect(html).toContain(':root[data-skin="acme"]'); expect(html).toContain('"acme":{');
    const bad = fixture('broken', (j) => { delete j.modes.light['--ink']; }); cpSync(bad.dir, join(viz, 'skins', 'broken'), { recursive: true });
    const r2 = Bun.spawnSync(['bun', RENDER, join(viz, 'scene.json'), join(dir, 'out2.html')], { stdout: 'pipe', stderr: 'pipe' });
    expect(r2.exitCode).toBe(1);
    expect(r2.stderr.toString()).toMatch(/broken: light: missing --ink/);
    [dir, ok.root, bad.root].forEach((d) => rmSync(d, { recursive: true }));
  });
});

describe('the template only consumes the palette', () => {
  const style = TEMPLATE.slice(TEMPLATE.indexOf('<style>'), TEMPLATE.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g, '');
  const script = TEMPLATE.slice(TEMPLATE.indexOf('</style>'));
  test('no palette token is given a value in the template (aliasing one token to another, as high contrast does, is allowed)', () => {
    SK.REQUIRED.forEach((k: string) => expect(style).not.toMatch(new RegExp('(^|[\\s;{])' + k + '\\s*:(?!\\s*var\\()')));
  });
  test('no skin rule and no skin id: the skins carry their own', () => {
    expect(style).not.toMatch(/data-skin="/);
    expect(script).not.toMatch(/['"](holo|atlas|corporate)['"]/);
  });
  test('colour literals only where colour is not a choice: alpha masks and the photo flash and frame', () => {
    const lines = style.split('\n').filter((l) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(l));
    lines.forEach((l) => expect(/mask-image|#photofx/.test(l)).toBe(true));
  });
});
