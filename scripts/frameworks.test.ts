// Capability frameworks (scripts/shared/frameworks.js): the base's BIAN and CROSS-INDUSTRY, a pack's own, and the one a project
// declares — its .sa-skills/project.json, else a pack's default, else a BIAN report already there, else nothing.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const F = require('./shared/frameworks.js');
const major = Number(JSON.parse(readFileSync(join(import.meta.dir, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version.split('.')[0]);
const withPacks = (dirs: string[], fn: () => void) => { const p = process.env.SA_PACKS, c = process.env.CLAUDE_CONFIG_DIR; process.env.SA_PACKS = dirs.join(':'); process.env.CLAUDE_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'sa-cfg-'));
  try { fn(); } finally { if (p === undefined) delete process.env.SA_PACKS; else process.env.SA_PACKS = p; if (c === undefined) delete process.env.CLAUDE_CONFIG_DIR; else process.env.CLAUDE_CONFIG_DIR = c; } };
const project = () => mkdtempSync(join(tmpdir(), 'sa-fw-'));

describe('the base', () => {
  test('two frameworks, each with its report and its three levels', () => withPacks([], () => {
    const { frameworks } = F.frameworks();
    expect(Object.keys(frameworks)).toEqual(['BIAN', 'CROSS-INDUSTRY']);
    expect(frameworks.BIAN).toMatchObject({ industry: 'banking', report: 'BIAN_ALIGNMENT.md', from: 'base' });
    expect(frameworks['CROSS-INDUSTRY']).toMatchObject({ report: 'CAPABILITY_ALIGNMENT.md', license: 'CC BY 4.0', levels: { area: 'Domain', domain: 'Capability Group', unit: 'Capability' } });
    expect(existsSync(join(frameworks['CROSS-INDUSTRY'].dir, 'NOTICE'))).toBe(true);
  }));
  test('a project declares one or none; an existing BIAN report means BIAN; otherwise nothing', () => withPacks([], () => {
    const p = project();
    expect(F.declared(p)).toEqual({ id: null, source: null });
    writeFileSync(join(p, 'BIAN_ALIGNMENT.md'), 'x'); expect(F.declared(p)).toEqual({ id: 'BIAN', source: 'legacy-report' });
    expect(F.declare(p, 'cross industry')).toBe('CROSS-INDUSTRY'); expect(F.declared(p)).toEqual({ id: 'CROSS-INDUSTRY', source: 'project' });
    expect(F.declare(p, 'none')).toBe('none'); expect(F.forProject(p)).toBeNull();
    expect(() => F.declare(p, 'TOGAF')).toThrow(/unknown framework/);
    rmSync(p, { recursive: true });
  }));
});

describe('a pack', () => {
  test('adds a framework, and its default is the project\'s until the project declares its own', () => {
    const d = mkdtempSync(join(tmpdir(), 'sa-pack-fw-')), t = join(d, 'frameworks', 'telco');
    mkdirSync(t, { recursive: true });
    writeFileSync(join(d, 'sa-pack.json'), JSON.stringify({ name: 'sa-pack-acme', version: '1.0.0', base: `>=${major}.0.0 <${major + 1}.0.0`, provides: { frameworks: 'frameworks' }, defaults: { framework: 'TELCO' } }));
    writeFileSync(join(t, 'framework.json'), JSON.stringify({ id: 'TELCO', name: 'Telco map', industry: 'telecommunications', index: 'llms-telco.txt', files: '^T-\\d+-.*\\.md$', levels: { area: 'Area', domain: 'Domain', unit: 'Function' }, headings: { area: 'Area', domain: 'Domain', unit: 'Function' }, id_label: 'Id', report: 'TELCO_ALIGNMENT.md' }));
    writeFileSync(join(t, 'llms-telco.txt'), 'index');
    const p = project();
    withPacks([d], () => {
      expect(F.frameworks().frameworks.TELCO).toMatchObject({ from: 'sa-pack-acme', report: 'TELCO_ALIGNMENT.md' });
      expect(F.declared(p)).toEqual({ id: 'TELCO', source: 'pack' });
      F.declare(p, 'BIAN'); expect(F.declared(p)).toEqual({ id: 'BIAN', source: 'project' });
    });
    [d, p].forEach((x) => rmSync(x, { recursive: true }));
  });
});

describe('a pack\'s BIAN', () => {
  test('replaces the open corpus by id — the registry, --dir and the alignment loader all read the pack\'s', () => {
    const d = mkdtempSync(join(tmpdir(), 'sa-pack-bian-')), b = join(d, 'frameworks', 'BIAN');
    mkdirSync(b, { recursive: true });
    writeFileSync(join(d, 'sa-pack.json'), JSON.stringify({ name: 'sa-pack-acme', version: '1.0.0', base: `>=${major}.0.0 <${major + 1}.0.0`, provides: { frameworks: 'frameworks' }, defaults: { framework: 'BIAN' } }));
    const base = F.frameworks({ env: '', noRegistry: true }).frameworks.BIAN;
    writeFileSync(join(b, 'framework.json'), readFileSync(join(base.dir, 'framework.json'), 'utf8'));
    writeFileSync(join(b, 'llms-bian.txt'), 'index');
    writeFileSync(join(b, 'BIAN-v14-1-customers.md'), '# BIAN Service Landscape v14.0.0 — Business Area: Customers\n\n## Business Domain: Sales\n\n### Service Domain: Customer Offer\n\n**BIAN id:** `1`\n\n**What it does.** The full licensed role definition.\n');
    withPacks([d], () => {
      const f = F.frameworks().frameworks.BIAN;
      expect(f).toMatchObject({ from: 'sa-pack-acme', dir: b });
      const r = Bun.spawnSync(['bun', join(import.meta.dir, 'shared', 'frameworks.js'), '--dir', 'bian'], { stdout: 'pipe', env: process.env });
      expect(r.stdout.toString().trim()).toBe(b);
      const cp = require('../plugins/sa-requirements/skills/architecture-capability-alignment/scripts/capability-prepare.js');
      const c = cp.loadCorpus(cp.frameworkOf(tmpdir(), 'BIAN'));
      expect(c.areas[0].domains[0].services[0].what).toBe('The full licensed role definition.');
    });
    rmSync(d, { recursive: true });
  });
});
