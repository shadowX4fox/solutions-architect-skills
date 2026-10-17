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

describe('import', () => {
  const filed = () => {   // an issue as the plugin renders it, the way the MCP server's port files it: `[ESC-?]`, no record yet
    const p = project(); E.create(p, REQ); const rec = E.records(p)[0];
    const body = E.issueBody({ ...rec, meta: { ...rec.meta, id: 'ESC-?' }, file: '—' });
    rmSync(p, { recursive: true });
    return { n: 41, title: `[ESC-?] ${REQ.title}`, body, url: 'https://github.com/org/arch/issues/41', created: '2026-10-18T09:00:00Z', labels: ['architecture-escalation', 'tier-1', 'trigger:security-iam', 'trigger:new-integration'] };
  };
  test('a server-filed issue says it is numbered on import', () => {
    expect(filed().body).toContain('escalate.js import <project> <this issue>');
  });
  test('reads the request back out of the body, field for field', () => {
    const r = E.requestOf(filed());
    expect(r).toMatchObject({ title: REQ.title, request: REQ.request, triggers: REQ.triggers, evidence: REQ.evidence, proposal: REQ.proposal, questions: REQ.questions,
      components: REQ.components, integrations: REQ.integrations, adrs: REQ.adrs, tdrs: [], requested_by: REQ.requested_by, route: 'tier-1', architecture: 'architecture-v1.4.0' });
  });
  test('numbers it here, links the issue, refuses it twice; keeps an issue\'s own free number', () => {
    const p = project(); E.create(p, { ...REQ, title: 'Local one' });
    const r = E.importIssue(p, filed());
    expect(r).toMatchObject({ id: 'ESC-002', renamed: true, title: `[ESC-002] ${REQ.title}` });
    const rec = E.records(p).find((x: any) => x.meta.id === 'ESC-002');
    expect(rec.meta).toMatchObject({ status: 'Open', date: '2026-10-18', issue: 'https://github.com/org/arch/issues/41', triggers: ['security-iam', 'new-integration'] });
    expect(readFileSync(join(p, rec.file), 'utf8')).toContain('| security-iam | docs/07-security-architecture.md:88 — mTLS between services; the change adds a shared secret |');
    expect(() => E.importIssue(p, filed())).toThrow(/already ESC-002/);
    const own = { ...filed(), title: `[ESC-007] ${REQ.title}`, url: 'https://github.com/org/arch/issues/42' };
    expect(E.importIssue(p, own)).toMatchObject({ id: 'ESC-007', renamed: false });
    rmSync(p, { recursive: true });
  });
  test('a body that is no escalation is refused', () => {
    const p = project();
    expect(() => E.importIssue(p, { ...filed(), body: 'Please fix the login page.', labels: ['architecture-escalation'] })).toThrow(/does not read as an escalation/);
    rmSync(p, { recursive: true });
  });
  test('the retitle is a plan per host until applied', () => {
    const p = project(); git(p, 'remote', 'add', 'origin', 'git@github.com:org/arch.git');
    expect(E.retitlePlan(p, 41, '[ESC-002] T').argv).toEqual(['gh', 'issue', 'edit', '41', '-R', 'org/arch', '--title', '[ESC-002] T']);
    expect(E.retitlePlan(p, 41, 'T', { host: 'gitlab' }).argv.slice(0, 4)).toEqual(['glab', 'issue', 'update', '41']);
    git(p, 'remote', 'set-url', 'origin', 'https://org@dev.azure.com/org/proj/_git/arch');
    expect(E.retitlePlan(p, 41, 'T').argv).toEqual(expect.arrayContaining(['az', 'work-item', 'update', '--id', '41']));
    git(p, 'remote', 'set-url', 'origin', 'https://gitea.example.org/team/arch.git');
    expect(E.retitlePlan(p, 41, 'T').request).toMatchObject({ method: 'PATCH', url: 'https://gitea.example.org/api/v1/repos/team/arch/issues/41' });
    rmSync(p, { recursive: true });
  });
});

describe('import keeps the text whole', () => {
  const round = (req: any) => { const p = project(); E.create(p, req); const rec = E.records(p)[0]; rmSync(p, { recursive: true });
    return E.requestOf({ title: `[ESC-?] ${req.title}`, body: E.issueBody({ ...rec, meta: { ...rec.meta, id: 'ESC-?' }, file: '—' }) + '\n<!-- sa-escalation-preview: 3f2a -->\n', labels: ['architecture-escalation'] }); };
  test('a request with a heading, an underscore line and a fence comes back verbatim', () => {
    const request = 'We need:\n\n## Context\nThe ledger posts at night.\n_Note_: urgent.\n```js\nx()\n```\n## Why it needs an architect\nnot a marker here';
    expect(round({ ...REQ, request }).request).toBe(request);
  });
  test('a proposal or question item with a line break is one bullet, flattened', () => {
    const r = round({ ...REQ, proposal: ['step one\nstep two'], questions: ['first\n## second'] });
    expect(r.proposal).toEqual(['step one step two']);
    expect(r.questions).toEqual(['first ## second']);
  });
  test('the server\'s fingerprint comment after the body is not read as text', () => {
    expect(round(REQ).questions).toEqual(REQ.questions);
  });
  test('an Azure DevOps description is read back by unhtml()', () => {
    const p = project(); E.create(p, REQ); const rec = E.records(p)[0]; rmSync(p, { recursive: true });
    const md = E.issueBody({ ...rec, meta: { ...rec.meta, id: 'ESC-?' }, file: '—' });
    const html = '<pre>' + md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
    expect(E.unhtml(html)).toBe(md);
    expect(E.requestOf({ title: 'x', body: E.unhtml(html), labels: [] }).evidence).toEqual(REQ.evidence);
  });
  test('an issue with neither the label nor an [ESC-…] title is refused unless forced', () => {
    const p = project(); const rec0 = (() => { const q = project(); E.create(q, REQ); const r = E.records(q)[0]; rmSync(q, { recursive: true }); return r; })();
    const issue = { title: REQ.title, body: E.issueBody({ ...rec0, meta: { ...rec0.meta, id: 'ESC-?' }, file: '—' }), url: 'https://github.com/org/arch/issues/9', labels: [] };
    expect(() => E.importIssue(p, issue)).toThrow(/not an escalation issue/);
    expect(E.importIssue(p, issue, { force: true }).id).toBe('ESC-001');
    rmSync(p, { recursive: true });
  });
});

describe('the record path keeps the text whole', () => {
  const rec = (req: any) => { const p = project(); E.create(p, req); const r = E.records(p)[0]; return { p, r }; };
  test('a request line `## Resolution` does not cut the issue body', () => {
    const request = 'a\n## Resolution\nb';
    const { p, r } = rec({ ...REQ, request });
    const body = E.issueBody({ ...r, meta: { ...r.meta, id: 'ESC-?' }, file: '—' });
    expect(body).not.toContain('- Pending.');
    expect(E.requestOf({ title: '[ESC-?] x', body, labels: [] })).toMatchObject({ request, questions: REQ.questions });
    E.close(p, r.meta.id, { by: 'ADR-101' });
    const closed = E.records(p)[0];
    expect(closed.body).toContain('a\n## Resolution\nb');
    expect(closed.body.match(/\n## Resolution\n/g)!.length).toBe(2);
    rmSync(p, { recursive: true });
  });
  test('a `#` in a scalar and a comma in a list item survive the front matter', () => {
    const { p, r } = rec({ ...REQ, requested_by: 'team #42', components: ['A, B', 'C'] });
    expect(r.meta.requested_by).toBe('team #42');
    expect(r.meta.components).toEqual(['A, B', 'C']);
    rmSync(p, { recursive: true });
  });
  test('an unquoted front matter from an older record still reads, its ` #` a comment', () => {
    const m = E.parse('---\nid: ESC-001 # first\ncomponents: [A, B]\nrequested_by: ops\n---\n# T\n').meta;
    expect(m).toMatchObject({ id: 'ESC-001', components: ['A', 'B'], requested_by: 'ops' });
  });
});
