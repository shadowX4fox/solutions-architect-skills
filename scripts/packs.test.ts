// Institution packs (scripts/shared/packs.js): a pack is found from SA_PACKS or the install registry, skipped when its base range
// excludes this base, provides the design language / BIAN landscape / skins / defaults, and wins over the base's own copies.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, cpSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const P = require('./shared/packs.js');
const BASE_VERSION = JSON.parse(readFileSync(join(import.meta.dir, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
const major = Number(BASE_VERSION.split('.')[0]);

function makePack(name: string, manifest: any, files: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sa-pack-'));
  writeFileSync(join(dir, 'sa-pack.json'), JSON.stringify(Object.assign({ name, version: '1.0.0', base: `>=${major}.0.0 <${major + 1}.0.0`, provides: {} }, manifest)));
  Object.entries(files).forEach(([f, c]) => { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), c); });
  return dir;
}
const opts = (dirs: string[]) => ({ env: dirs.join(':'), noRegistry: true });

describe('discovery', () => {
  test('no pack: the base\'s own copies, when it carries them', () => {
    const { packs, warnings } = P.findPacks(opts([]));
    expect(packs).toEqual([]); expect(warnings).toEqual([]);
    const dl = P.assetPath('design-language', opts([]));
    expect(dl.from === 'base' || dl.from === null).toBe(true);
  });
  test('a pack in SA_PACKS is found, with what it provides', () => {
    const d = makePack('sa-pack-acme', { provides: { designLanguage: 'dl' } }, { 'dl/llms-rules.txt': 'x' });
    const { packs } = P.findPacks(opts([d]));
    expect(packs.map((p: any) => p.name)).toEqual(['sa-pack-acme']);
    expect(P.assetPath('design-language', opts([d]))).toMatchObject({ path: resolve(d, 'dl'), from: 'sa-pack-acme' });
    rmSync(d, { recursive: true });
  });
  test('a pack whose base range excludes this base is skipped, and says why', () => {
    const d = makePack('sa-pack-old', { base: `<${major}.0.0`, provides: { designLanguage: 'dl' } }, { 'dl/llms-rules.txt': 'x' });
    const r = P.findPacks(opts([d]));
    expect(r.packs).toEqual([]); expect(r.warnings.join()).toMatch(/wants base .* skipped/);
    rmSync(d, { recursive: true });
  });
  test('a folder that does not prove its kind is not used (a design language with no llms-rules.txt)', () => {
    const d = makePack('sa-pack-half', { provides: { designLanguage: 'dl' } }, { 'dl/README.md': 'x' });
    expect(P.assetPath('design-language', opts([d])).from).not.toBe('sa-pack-half');
    rmSync(d, { recursive: true });
  });
  test('two packs providing one kind: the first wins, with a warning', () => {
    const a = makePack('sa-pack-a', { provides: { bianLandscape: 'b' } }, { 'b/llms-bian.txt': 'x' }), b = makePack('sa-pack-b', { provides: { bianLandscape: 'b' } }, { 'b/llms-bian.txt': 'x' });
    const r = P.assetPath('bian-landscape', opts([a, b]));
    expect(r.from).toBe('sa-pack-a'); expect(r.warnings.join()).toMatch(/provided by sa-pack-a and sa-pack-b/);
    [a, b].forEach((d) => rmSync(d, { recursive: true }));
  });
  test('the install registry: a user-scope pack, and a project-scope one only inside its project', () => {
    const user = makePack('sa-pack-user', { provides: {} }), proj = makePack('sa-pack-proj', { provides: {} });
    const cfg = mkdtempSync(join(tmpdir(), 'sa-cfg-')), project = mkdtempSync(join(tmpdir(), 'sa-proj-'));
    const reg = join(cfg, 'installed_plugins.json');
    writeFileSync(reg, JSON.stringify({ version: 2, plugins: { 'sa-pack-user@m': [{ scope: 'user', installPath: user }], 'sa-pack-proj@m': [{ scope: 'project', projectPath: project, installPath: proj }] } }));
    expect(P.findPacks({ env: '', registry: reg, project }).packs.map((p: any) => p.name).sort()).toEqual(['sa-pack-proj', 'sa-pack-user']);
    expect(P.findPacks({ env: '', registry: reg, project: tmpdir() }).packs.map((p: any) => p.name)).toEqual(['sa-pack-user']);
    [user, proj, cfg, project].forEach((d) => rmSync(d, { recursive: true }));
  });
});

describe('what a pack provides', () => {
  test('skins folders, in the order found, and defaults (the first pack stating a key)', () => {
    const a = makePack('sa-pack-a', { provides: { skins: 'skins' }, defaults: { theme: 'acme', docLanguage: 'es' } }, { 'skins/.keep': '' });
    const b = makePack('sa-pack-b', { provides: {}, defaults: { theme: 'other', adrCatalog: { url: 'https://example.invalid/adr.git' } } });
    expect(P.skinDirs(opts([a, b])).map((s: any) => s.name)).toEqual(['sa-pack-a']);
    expect(P.defaults(opts([a, b]))).toEqual({ theme: 'acme', docLanguage: 'es', adrCatalog: { url: 'https://example.invalid/adr.git' } });
    [a, b].forEach((d) => rmSync(d, { recursive: true }));
  });
  test('version ranges', () => {
    expect(P.satisfies('9.1.0', '>=9.1.0 <10.0.0')).toBe(true);
    expect(P.satisfies('10.0.0', '>=9.1.0 <10.0.0')).toBe(false);
    expect(P.satisfies('9.4.2', '^9.1')).toBe(true);
    expect(P.satisfies('9.4.2', '9.x')).toBe(true);
    expect(P.satisfies('8.9.0', '9.x')).toBe(false);
    expect(P.satisfies('9.0.0', '*')).toBe(true);
  });
  test('the command center renders with a pack\'s skin and opens in the pack\'s default theme', () => {
    const skin = join(import.meta.dir, '..', 'plugins', 'sa-visualization', 'skills', 'architecture-command-center', 'skins', 'atlas');
    const pack = makePack('sa-pack-acme', { provides: { skins: 'skins' }, defaults: { theme: 'acme' } });
    cpSync(skin, join(pack, 'skins', 'acme'), { recursive: true });
    const j = JSON.parse(readFileSync(join(pack, 'skins', 'acme', 'skin.json'), 'utf8')); j.id = 'acme'; j.order = 9; writeFileSync(join(pack, 'skins', 'acme', 'skin.json'), JSON.stringify(j));
    const out = mkdtempSync(join(tmpdir(), 'sa-out-')), cfg = mkdtempSync(join(tmpdir(), 'sa-cfg-'));
    const render = join(import.meta.dir, '..', 'plugins', 'sa-visualization', 'skills', 'architecture-command-center', 'scripts', 'render.js');
    const scene = join(import.meta.dir, '..', 'plugins', 'sa-visualization', 'skills', 'architecture-command-center', 'examples', 'order-desk.scene.json');
    const r = Bun.spawnSync(['bun', render, scene, join(out, 'o.html')], { stdout: 'pipe', stderr: 'pipe', env: Object.assign({}, process.env, { SA_PACKS: pack, CLAUDE_CONFIG_DIR: cfg }) });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toMatch(/theme=acme/); expect(r.stdout.toString()).toMatch(/pack skins: acme/);
    [pack, out, cfg].forEach((d) => rmSync(d, { recursive: true }));
  });
});
