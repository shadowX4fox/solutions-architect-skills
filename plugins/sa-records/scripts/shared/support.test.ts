// RUN-team support: Tier 0 applies only to a project that declares "support": "run" and has an architecture release.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const S = require('./support.js');
const git = (cwd: string, ...a: string[]) => Bun.spawnSync(['git', ...a], { cwd, env: { ...process.env, GIT_CEILING_DIRECTORIES: tmpdir(), GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });

describe('support', () => {
  test('standard until declared; RUN without a release is not Tier 0; a release tag opens it', () => {
    const p = mkdtempSync(join(tmpdir(), 'sa-support-'));
    expect(S.supportOf(p)).toMatchObject({ support: null, tier0: false });
    mkdirSync(join(p, '.sa-skills')); writeFileSync(join(p, '.sa-skills', 'project.json'), JSON.stringify({ framework: 'BIAN' }));
    expect(S.declareSupport(p, 'run')).toBe('run');
    expect(JSON.parse(readFileSync(join(p, '.sa-skills', 'project.json'), 'utf8'))).toEqual({ framework: 'BIAN', support: 'run' });
    expect(S.supportOf(p)).toMatchObject({ support: 'run', released: null, tier0: false });
    git(p, 'init', '-q'); writeFileSync(join(p, 'ARCHITECTURE.md'), '# A\n'); git(p, 'add', '.'); git(p, 'commit', '-qm', 'x'); git(p, 'tag', 'architecture-v1.0.0');
    expect(S.supportOf(p)).toMatchObject({ support: 'run', released: 'architecture-v1.0.0', tier0: true });
    S.declareSupport(p, 'none');
    expect(S.supportOf(p).tier0).toBe(false);
    expect(() => S.declareSupport(p, 'maybe')).toThrow(/run or none/);
    rmSync(p, { recursive: true });
  });
  test('four Tier 0 writes and seven triggers, low confidence among them', () => {
    expect(S.TIER0).toEqual(['tdr-workaround', 'tdr-status', 'adr-proposed', 'doc-fix']);
    expect(S.TRIGGERS).toHaveLength(7);
    expect(S.TRIGGERS.some((t: string) => /low AI confidence/.test(t))).toBe(true);
  });
  test('tier0.auto: the kinds a trusted agent keys itself — declared here, a subset of the four, none by default', () => {
    const p = mkdtempSync(join(tmpdir(), 'sa-support-auto-'));
    S.declareSupport(p, 'run');
    git(p, 'init', '-q'); writeFileSync(join(p, 'ARCHITECTURE.md'), '# A\n'); git(p, 'add', '.'); git(p, 'commit', '-qm', 'x'); git(p, 'tag', 'architecture-v1.0.0');
    expect(S.supportOf(p).auto).toEqual([]);
    expect(S.declareAuto(p, 'tdr-status, doc-fix')).toEqual(['tdr-status', 'doc-fix']);
    expect(S.supportOf(p).auto).toEqual(['tdr-status', 'doc-fix']);
    expect(S.declareAuto(p, 'all')).toEqual(S.TIER0);
    expect(JSON.parse(readFileSync(join(p, '.sa-skills', 'project.json'), 'utf8')).tier0).toEqual({ auto: 'all' });
    expect(S.supportOf(p).auto).toEqual(S.TIER0);
    expect(() => S.declareAuto(p, 'tdr-status,escalation')).toThrow(/not a Tier 0 kind: escalation/);
    S.declareAuto(p, 'none');
    expect(JSON.parse(readFileSync(join(p, '.sa-skills', 'project.json'), 'utf8'))).toEqual({ support: 'run' });
    // a hand-written unknown kind is dropped, never trusted
    writeFileSync(join(p, '.sa-skills', 'project.json'), JSON.stringify({ support: 'run', tier0: { auto: ['doc-fix', 'merge-anything'] } }));
    expect(S.supportOf(p).auto).toEqual(['doc-fix']);
    rmSync(p, { recursive: true });
  });
});
