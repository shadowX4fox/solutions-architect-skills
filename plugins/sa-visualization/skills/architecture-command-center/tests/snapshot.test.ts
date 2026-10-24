// snapshot.js: the viewer's photo mode as a PNG, from headless Chrome — the evidence picture a release PR carries.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { tmpdir, homedir } from 'os';
import { join } from 'path';

const DIR = join(import.meta.dir, '..');
const SNAP = join(DIR, 'scripts', 'snapshot.js'), RENDER = join(DIR, 'scripts', 'render.js'), SCENE = join(DIR, 'examples', 'order-desk.scene.json');
const cache = join(homedir(), '.cache', 'puppeteer', 'chrome');
const chrome = process.env.SA_CHROME || process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync(cache) && readdirSync(cache).length ? 'cache' : null)
  || ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].map((n) => Bun.which(n)).find(Boolean);

describe('snapshot.js', () => {
  test('usage: a viewer and a PNG path, or exit 2', () => {
    const r = Bun.spawnSync(['bun', SNAP], { stderr: 'pipe' });
    expect(r.exitCode).toBe(2); expect(r.stderr.toString()).toMatch(/Usage/);
  });
  test.skipIf(!chrome)('the photo-mode PNG of a rendered viewer, its caption naming the project and the version', () => {
    const out = mkdtempSync(join(tmpdir(), 'sa-snap-')), cfg = mkdtempSync(join(tmpdir(), 'sa-cfg-'));
    const env = Object.assign({}, process.env, { CLAUDE_CONFIG_DIR: cfg, SA_PACKS: '' });
    expect(Bun.spawnSync(['bun', RENDER, SCENE, join(out, 'v.html'), '--lang', 'en'], { env, stdout: 'pipe', stderr: 'pipe' }).exitCode).toBe(0);
    const r = Bun.spawnSync(['bun', SNAP, join(out, 'v.html'), join(out, 'p.png'), '--width', '1200', '--height', '800', '--wait', '3000'], { env, stdout: 'pipe', stderr: 'pipe' });
    expect(r.exitCode).toBe(0);
    const scene = JSON.parse(readFileSync(SCENE, 'utf8'));
    expect(r.stdout.toString()).toContain(scene.project);
    if (scene.version) expect(r.stdout.toString()).toContain('v' + scene.version);
    expect(readFileSync(join(out, 'p.png')).subarray(1, 4).toString()).toBe('PNG');
    [out, cfg].forEach((d) => rmSync(d, { recursive: true }));
  }, 60000);
  test.skipIf(!chrome)('--plan: the plan page of the component\'s floor, the caption naming the floor and the component (10.21.0)', () => {
    const out = mkdtempSync(join(tmpdir(), 'sa-snap-')), cfg = mkdtempSync(join(tmpdir(), 'sa-cfg-'));
    const env = Object.assign({}, process.env, { CLAUDE_CONFIG_DIR: cfg, SA_PACKS: '' });
    expect(Bun.spawnSync(['bun', RENDER, SCENE, join(out, 'v.html'), '--lang', 'en'], { env, stdout: 'pipe', stderr: 'pipe' }).exitCode).toBe(0);
    const shot = (plan: string) => Bun.spawnSync(['bun', SNAP, join(out, 'v.html'), join(out, plan + '.png'), '--plan', plan, '--width', '1200', '--height', '800', '--wait', '3000'], { env, stdout: 'pipe', stderr: 'pipe' });
    const r = shot('order-service'), scene = JSON.parse(readFileSync(SCENE, 'utf8'));
    const node = scene.nodes.find((n: any) => n.id === 'order-service'), floor = scene.layers.find((l: any) => l.n === node.layer);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toContain(floor.name);
    expect(r.stdout.toString()).toContain(node.name);
    // an id the scene lacks: the default view, no floor in the caption
    const x = shot('no-such-component');
    expect(x.exitCode).toBe(0);
    expect(x.stdout.toString()).not.toContain(floor.name);
    [out, cfg].forEach((d) => rmSync(d, { recursive: true }));
  }, 90000);
});
