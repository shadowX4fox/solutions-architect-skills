// The document theme (./theme.js): the base's `alia` by default, `--theme` by id or folder, an institution pack's docTheme over
// the base, a partial theme merged key by key, and the PDF renderer painting a night cover only for a theme that asks for one.
const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadTheme } = require('./theme.js');

const NO_PACKS = { packOpts: { env: '', noRegistry: true } };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sa-doctheme-'));
const major = Number(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '.claude-plugin', 'plugin.json'), 'utf8')).version.split('.')[0]);

describe('resolution', () => {
  test('no argument, no pack: the base\'s alia, night cover with its figure, Nunito headings', () => {
    const t = loadTheme(NO_PACKS);
    expect(t.id).toBe('alia'); expect(t.from).toBe('base');
    expect(t.cover.style).toBe('night'); expect(fs.existsSync(t.cover.image)).toBe(true);
    expect(t.fonts.heading.family).toBe('Nunito'); expect(fs.existsSync(t.fonts.heading.bold)).toBe(true);
    expect(t.warnings).toEqual([]);
  });
  test('--theme classic: the old corporate blue, a light cover, no image, the body font', () => {
    const t = loadTheme({ theme: 'classic', ...NO_PACKS });
    expect(t.colors.primary).toBe('1F4E79'); expect(t.docTypes.adr).toBe('8B6914');
    expect(t.cover.style).toBe('light'); expect(t.cover.image).toBeNull(); expect(t.fonts).toBeNull();
  });
  test('--theme with an unknown id refuses, naming the bundled themes', () => {
    expect(() => loadTheme({ theme: 'nope', ...NO_PACKS })).toThrow(/alia, classic/);
  });
  test('a pack\'s docTheme wins over the base', () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, 'sa-pack.json'), JSON.stringify({ name: 'sa-pack-acme', version: '1.0.0', base: `>=${major}.0.0 <${major + 1}.0.0`, provides: { docTheme: 'theme' } }));
    fs.mkdirSync(path.join(d, 'theme'));
    fs.writeFileSync(path.join(d, 'theme', 'theme.json'), JSON.stringify({ id: 'acme', colors: { primary: '112233' } }));
    const t = loadTheme({ packOpts: { env: d, noRegistry: true } });
    expect(t.id).toBe('acme'); expect(t.from).toBe('sa-pack-acme'); expect(t.colors.primary).toBe('112233');
    fs.rmSync(d, { recursive: true });
  });
});

describe('a partial theme', () => {
  test('missing keys come from alia; a bad colour is dropped with a warning; no cover means a light one without Alia', () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, 'theme.json'), JSON.stringify({ id: 'mine', colors: { primary: 'abcdef', secondary: 'red' } }));
    const t = loadTheme({ theme: d, ...NO_PACKS });
    expect(t.colors.primary).toBe('ABCDEF'); expect(t.colors.secondary).toBe('0A7177');
    expect(t.warnings.join()).toMatch(/colors\.secondary/);
    expect(t.cover).toMatchObject({ style: 'light', image: null }); expect(t.fonts).toBeNull();
    fs.rmSync(d, { recursive: true });
  });
  test('a night cover whose image is missing renders without one and says so', () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, 'theme.json'), JSON.stringify({ id: 'n', cover: { style: 'night', image: 'gone.png' } }));
    const t = loadTheme({ theme: d, ...NO_PACKS });
    expect(t.cover.style).toBe('night'); expect(t.cover.image).toBeNull(); expect(t.warnings.join()).toMatch(/gone\.png/);
    fs.rmSync(d, { recursive: true });
  });
});

describe('the PDF renderer', () => {
  const { buildDocDefinition } = require('./render-pdf.js');
  const { DOC_TYPES, LABELS } = require('./generate-doc.js');
  const base = { title: 'Order Desk', blocks: [{ type: 'heading', level: 1, text: 'One' }], meta: { Version: '1.0' }, labels: LABELS.en, typeMeta: DOC_TYPES.adr, changelog: null };
  test('alia: page 1 painted night, headings in the theme font, the figure on the cover', () => {
    const t = loadTheme(NO_PACKS);
    const def = buildDocDefinition({ ...base, theme: t });
    const bg = def.background(1, { width: 612, height: 792 });
    expect(bg.canvas[0]).toMatchObject({ type: 'rect', w: 612, h: 792, color: '#0D1418' });
    expect(def.background(2, { width: 612, height: 792 })).toBeNull();
    expect(def.styles.h1.font).toBe('Heading'); expect(def.styles.h1.color).toBe('#1B1F24');
    expect(JSON.stringify(def.content[0])).toMatch(/data:image\/png;base64/);
  });
  test('no theme after a themed build: the classic palette again, no background — one build never leaks into the next', () => {
    buildDocDefinition({ ...base, theme: loadTheme(NO_PACKS) });
    const def = buildDocDefinition(base);
    expect(def.background).toBeUndefined(); expect(def.styles.h1.font).toBe('Roboto'); expect(def.styles.h1.color).toBe('#1F4E79');
  });
});
