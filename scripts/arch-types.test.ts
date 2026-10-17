// Architecture types (scripts/shared/arch-types.js): the base's five, ENTERPRISE the default; a pack adds a type as a folder
// with type.json and its four files, may make it the default, and its matrix rows reach the payload and the principle gate.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const T = require('./shared/arch-types.js');
const major = Number(JSON.parse(readFileSync(join(import.meta.dir, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version.split('.')[0]);

function pack(defaults: any = {}, type: any = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sa-pack-types-')), t = join(dir, 'architecture-types', 'ACME');
  mkdirSync(t, { recursive: true });
  writeFileSync(join(dir, 'sa-pack.json'), JSON.stringify({ name: 'sa-pack-acme', version: '1.0.0', base: `>=${major}.0.0 <${major + 1}.0.0`, provides: { architectureTypes: 'architecture-types' }, defaults }));
  writeFileSync(join(t, 'type.json'), JSON.stringify(Object.assign({ id: 'ACME', name: 'Acme 4-layer', summary: 'the Acme model', files: { section4: 'S4.md', section5: 'S5.md', reference: 'REF.md', c4: 'C4.md' }, matrix: { 1: ['acme layer'] } }, type)));
  ['S4', 'S5', 'REF', 'C4'].forEach((f) => writeFileSync(join(t, f + '.md'), `# ${f} for ACME\n\nAcme ${f} guidance.\n`));
  return dir;
}
const withPack = (dir: string | null, fn: () => void) => { const prev = process.env.SA_PACKS, cfg = process.env.CLAUDE_CONFIG_DIR; process.env.SA_PACKS = dir || ''; process.env.CLAUDE_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'sa-cfg-'));
  try { fn(); } finally { if (prev === undefined) delete process.env.SA_PACKS; else process.env.SA_PACKS = prev; if (cfg === undefined) delete process.env.CLAUDE_CONFIG_DIR; else process.env.CLAUDE_CONFIG_DIR = cfg; } };

describe('the base', () => {
  test('five built-in types, ENTERPRISE the default, every file on disk', () => withPack(null, () => {
    const { types } = T.types();
    expect(Object.keys(types)).toEqual(['ENTERPRISE', 'MICROSERVICES', '3-TIER', 'N-LAYER', 'BIAN']);
    expect(T.defaultType()).toBe('ENTERPRISE');
    Object.values(types).forEach((t: any) => Object.values(t.files).filter(Boolean).forEach((f: any) => expect(() => readFileSync(f)).not.toThrow()));
  }));
  test('what a user, a marker or a record wrote resolves to an id', () => withPack(null, () => {
    expect(T.normType('enterprise')).toBe('ENTERPRISE'); expect(T.normType('3tier')).toBe('3-TIER'); expect(T.normType('n layer')).toBe('N-LAYER');
    expect(T.normType('META')).toBeNull();
  }));
});

describe('a pack type', () => {
  test('is offered, can be the default, and an incomplete one is skipped with a warning', () => {
    const d = pack({ architectureType: 'acme' });
    withPack(d, () => { const { types } = T.types(); expect(types.ACME).toMatchObject({ source: 'sa-pack-acme', name: 'Acme 4-layer' }); expect(T.defaultType()).toBe('ACME'); expect(T.normType('Acme')).toBe('ACME'); });
    rmSync(join(d, 'architecture-types', 'ACME', 'REF.md'));
    withPack(d, () => { const r = T.types(); expect(r.types.ACME).toBeUndefined(); expect(r.warnings.join()).toMatch(/ACME is missing reference/); expect(T.defaultType()).toBe('ENTERPRISE'); });
    rmSync(d, { recursive: true });
  });
  test('its files reach the Section 4 payload and its matrix rows reach the payload and the principle gate', () => {
    const d = pack(), proj = mkdtempSync(join(tmpdir(), 'sa-proj-'));
    mkdirSync(join(proj, 'docs'), { recursive: true });
    writeFileSync(join(proj, 'ARCHITECTURE.md'), '<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk\n');
    writeFileSync(join(proj, 'docs', '03-architecture-layers.md'), '<!-- ARCHITECTURE_TYPE: ACME -->\n# Layers\n');
    withPack(d, () => {
      const { prepare } = require('../skills/architecture-docs/scripts/section-prepare.js');
      const r4 = prepare(proj, 4, { type: 'ACME' });
      expect(r4.text).toContain('Acme S4 guidance.'); expect(r4.text).toContain('Acme REF guidance.');
      const r3 = prepare(proj, 3, { type: 'ACME' });
      expect(r3.text).toMatch(/P-TYPE-MATRIX-01, ACME[\s\S]*\| 1\. Separation of Concerns \| `acme layer` \|/);
      writeFileSync(join(proj, 'docs', '02-architecture-principles.md'), '# Principles\n');
      const { check } = require('../skills/architecture-docs/scripts/principle-check.js');
      const c = check(proj, {});
      expect(c.arch_type).toBe('ACME'); expect(c.type_rows).toEqual({ 1: ['acme layer'] });
    });
    [d, proj].forEach((x) => rmSync(x, { recursive: true }));
  });
});
