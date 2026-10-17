// Escalations: the record a crossed trigger writes instead of an architecture change, and the issue it becomes on the
// project's git host. No host is called here — the issue is checked as the plan `issue` shows before the user's yes.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const E = require('./escalate.js');
const git = (cwd: string, ...a: string[]) => Bun.spawnSync(['git', ...a], { cwd, env: { ...process.env, GIT_CEILING_DIRECTORIES: tmpdir(), GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
const REQ = {
  title: 'Hub API calls the partner ledger with a shared client secret',
  request: 'We need Hub API to post settlements to the partner ledger this sprint.',
  triggers: ['security-iam', 'new-integration'],
  evidence: [{ trigger: 'security-iam', where: 'docs/07-security-architecture.md:88', note: 'mTLS between services; the change adds a shared secret' },
    { trigger: 'new-integration', where: 'docs/05-integration-points.md', note: 'the partner ledger has no I-nn row' }],
  proposal: ['docs/05: a new I-15 Hub API → Partner Ledger, HTTPS/JSON'], questions: ['Is the partner ledger in ADR-012\'s scope?'],
  components: ['Hub API', 'Order Desk'], integrations: ['I-07'], adrs: ['ADR-012'], requested_by: 'run-team-payments',
};
const project = () => { const p = mkdtempSync(join(tmpdir(), 'sa-esc-')); git(p, 'init', '-q'); writeFileSync(join(p, 'ARCHITECTURE.md'), '# A\n'); git(p, 'add', '.'); git(p, 'commit', '-qm', 'x'); git(p, 'tag', 'architecture-v1.4.0'); return p; };

describe('the record', () => {
  test('validates the request: closed triggers, evidence per trigger, a route', () => {
    expect(E.validate(REQ)).toEqual([]);
    expect(E.validate({ ...REQ, triggers: ['urgent'] }).join('\n')).toMatch(/unknown trigger "urgent"/);
    expect(E.validate({ ...REQ, evidence: [] }).join('\n')).toMatch(/"security-iam" has no evidence/);
    expect(E.validate({ ...REQ, triggers: ['low-confidence'], evidence: [] })).toEqual([]);
    expect(E.validate({ ...REQ, route: 'tier-0' }).join('\n')).toMatch(/route must be/);
  });
  test('writes ESC-001 with its front matter, numbers the next, and parses back', () => {
    const p = project();
    const r = E.create(p, REQ, { today: '2026-10-17' });
    expect(r).toMatchObject({ id: 'ESC-001', file: 'escalations/ESC-001-hub-api-calls-the-partner-ledger-with-a-shared-client-secret.md' });
    const text = readFileSync(join(p, r.file), 'utf8');
    expect(text).toContain('status: Open\ndate: 2026-10-17\narchitecture: architecture-v1.4.0\nroute: tier-1\ntriggers: [security-iam, new-integration]');
    expect(text).toContain('| security-iam | docs/07-security-architecture.md:88 — mTLS between services; the change adds a shared secret |');
    expect(text).toContain('## What the AI would propose (not applied)');
    const rec = E.records(p)[0];
    expect(rec.meta).toMatchObject({ id: 'ESC-001', components: ['Hub API', 'Order Desk'], adrs: ['ADR-012'] });
    expect(E.create(p, { ...REQ, title: 'Second' }).id).toBe('ESC-002');
    rmSync(p, { recursive: true });
  });
  test('warns on a component the facts ledger does not know', () => {
    const p = project(); mkdirSync(join(p, '.cache', 'sa-skills'), { recursive: true });
    writeFileSync(join(p, '.cache', 'sa-skills', 'facts.json'), JSON.stringify({ components: [{ name: 'Hub API' }] }));
    expect(E.create(p, REQ).warnings).toEqual(['component "Order Desk" is not a canonical name in the facts ledger']);
    rmSync(p, { recursive: true });
  });
  test('status, close by what resolved it, reject with a reason; closed since a date', () => {
    const p = project(); E.create(p, REQ); E.create(p, { ...REQ, title: 'Two' });
    expect(E.setStatus(p, 'esc-001', 'in review').meta.status).toBe('In Review');
    expect(() => E.setStatus(p, 'ESC-001', 'Resolved')).toThrow(/go through close/);
    expect(() => E.close(p, 'ESC-001', { by: 'fixed' })).toThrow(/--by must name/);
    const c = E.close(p, 'ESC-001', { by: 'ADR-131', today: '2026-10-20' });
    expect(c.meta).toMatchObject({ status: 'Resolved', resolution: 'ADR-131', closed: '2026-10-20' });
    expect(readFileSync(join(p, c.file), 'utf8')).toContain('## Resolution\n\n- Resolved 2026-10-20 by ADR-131.\n');
    E.close(p, 'ESC-002', { rejected: 'not an architecture change', today: '2026-10-21' });
    expect(E.open(p)).toHaveLength(0);
    expect(E.closedSince(p, '2026-10-20').map((r: any) => r.meta.id)).toEqual(['ESC-002']);
    expect(E.closedSince(p, null)).toHaveLength(2);
    rmSync(p, { recursive: true });
  });
});

describe('the git host', () => {
  test('reads the host from origin', () => {
    expect(E.parseRemote('git@github.com:org/repo.git')).toMatchObject({ host: 'github', path: 'org/repo' });
    expect(E.parseRemote('https://github.com/org/repo')).toMatchObject({ host: 'github', path: 'org/repo' });
    expect(E.parseRemote('https://gitlab.com/group/sub/repo.git')).toMatchObject({ host: 'gitlab', owner: 'group/sub', repo: 'repo' });
    expect(E.parseRemote('ssh://git@gitea.example.org:2222/team/repo.git')).toMatchObject({ host: 'gitea', server: 'gitea.example.org', path: 'team/repo' });
    expect(E.parseRemote('https://org@dev.azure.com/org/My%20Project/_git/repo')).toMatchObject({ host: 'azure', org: 'org', project: 'My Project', repo: 'repo' });
    expect(E.parseRemote('git@ssh.dev.azure.com:v3/org/proj/repo')).toMatchObject({ host: 'azure', org: 'org', project: 'proj' });
    expect(E.parseRemote('https://org.visualstudio.com/proj/_git/repo')).toMatchObject({ host: 'azure', org: 'org', project: 'proj' });
    expect(E.parseRemote('https://git.internal.example/team/repo.git')).toMatchObject({ host: null, server: 'git.internal.example' });
  });
  test('the issue plan per host: title, labels, body, command — nothing opened', () => {
    const p = project(); E.create(p, REQ);
    const at = (url: string, host?: string) => { git(p, 'remote', 'remove', 'origin'); git(p, 'remote', 'add', 'origin', url); return E.issuePlan(p, 'ESC-001', { host }); };
    git(p, 'remote', 'add', 'origin', 'x');
    const gh = at('git@github.com:org/repo.git');
    expect(gh.title).toBe('[ESC-001] Hub API calls the partner ledger with a shared client secret');
    expect(gh.labels).toEqual(['architecture-escalation', 'tier-1', 'trigger:security-iam', 'trigger:new-integration']);
    expect(gh.body).toContain('| Architecture | architecture-v1.4.0 |');
    expect(gh.body).not.toContain('## Resolution');
    expect(gh.argv.slice(0, 5)).toEqual(['gh', 'issue', 'create', '-R', 'org/repo']);
    expect(at('https://ghe.corp.example/org/repo.git', 'github').argv[4]).toBe('ghe.corp.example/org/repo');
    expect(at('https://gitlab.com/group/repo.git').argv).toContain('--description-file');
    const az = at('https://org@dev.azure.com/org/proj/_git/repo');
    expect(az.argv).toEqual(expect.arrayContaining(['az', '--org', 'https://dev.azure.com/org', '--project', 'proj', '--type', 'Issue']));
    expect(at('https://gitea.example.org/team/repo.git').request.url).toBe('https://gitea.example.org/api/v1/repos/team/repo/issues');
    expect(() => at('https://git.internal.example/team/repo.git')).toThrow(/pass --host/);
    rmSync(p, { recursive: true });
  });
});
