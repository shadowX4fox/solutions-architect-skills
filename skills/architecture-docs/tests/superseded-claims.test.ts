// superseded-claims.js — a retired decision the sections still assert. Synthetic corpus only.
import { describe, test, expect, afterAll } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const SC = require('../scripts/superseded-claims.js');
const SCRIPT = join(import.meta.dir, '..', 'scripts', 'superseded-claims.js');
const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

const OLD = `# ADR-201: Parcel label printed by the depot

**Status**: 🔄 Superseded by [ADR-202](ADR-202-label-printed-by-sorter.md)

## Context

Labels were a bottleneck.

## Decision

The depot terminal prints every parcel label from a thermal printer attached to the loading dock.
Printed labels carry a handwritten courier initials field checked at dispatch.
Parcels travel in crates of twenty units.

## Consequences

None recorded.
`;
const NEW = `# ADR-202: Label printed by the sorter

**Status**: Accepted

## Decision <!-- SECTION: Decision -->

### Summary

The sorting machine prints each label inline, keyed by the barcode it reads on intake.
Parcels travel in crates of twenty units.
`;
const docs = {
  'docs/03-flows.md': `# Flows

## Dispatch

The depot terminal prints the parcel label on the thermal printer at the loading dock before dispatch.

The sorting machine prints each label inline from the barcode read on intake.

| Step | Owner | Detail |
|------|-------|--------|
| 4 | Dock | Courier initials handwritten on the printed label and checked at dispatch |
`,
};

function project(opts: { crlf?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sc-'));
  dirs.push(root);
  mkdirSync(join(root, 'adr'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  const w = (p: string, t: string) => writeFileSync(join(root, p), opts.crlf ? t.replace(/\n/g, '\r\n') : t);
  w('adr/ADR-201-label-printed-by-depot.md', OLD);
  w('adr/ADR-202-label-printed-by-sorter.md', NEW);
  w('ARCHITECTURE.md', '# Parcel Hub\n\nSee docs.\n');
  for (const [p, t] of Object.entries(docs)) w(p, t);
  // padding blocks, so the inverse block frequency has a corpus to measure against
  w('docs/09-ops.md', '# Ops\n\n' + Array.from({ length: 60 }, (_, i) => `Runbook step ${i} restarts service number ${i} after the nightly window closes.`).join('\n\n') + '\n');
  return root;
}
const git = (root: string, ...args: string[]) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });

describe('retired decisions', () => {
  test('a superseded ADR retires the sentences its successor does not carry', () => {
    const root = project();
    const { decisions } = SC.retiredDecisions(root, SC.adrsOf(root));
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ source: 'ADR-201 → ADR-202', kind: 'superseded', since: 'ADR-202' });
    const texts = decisions[0].retired.map((r: any) => r.text);
    expect(texts.some((t: string) => /thermal printer/.test(t))).toBe(true);
    expect(texts.some((t: string) => /crates of twenty/.test(t))).toBe(false);   // the successor restates it: not retired
  });

  test('the Decision section is found at any heading level and by its anchor', () => {
    expect(SC.decisionOf(NEW)).toContain('sorting machine');
    expect(SC.decisionOf(OLD.replace('## Decision', '#### Decisión'))).toContain('thermal printer');
    expect(SC.decisionOf(OLD)).not.toContain('None recorded');
  });

  test('a rule another in-force ADR decides is never retired, whatever happened to the ADR that repeated it', () => {
    const root = project();
    writeFileSync(join(root, 'adr/ADR-203-dock-hardware.md'), '# ADR-203\n\n**Status**: Accepted\n\n## Decision\n\nThe depot terminal prints every parcel label from a thermal printer attached to the loading dock.\n');
    const texts = SC.retiredDecisions(root, SC.adrsOf(root)).decisions[0].retired.map((r: any) => r.text);
    expect(texts.some((t: string) => /thermal printer/.test(t))).toBe(false);
  });
});

describe('the check', () => {
  test('unanswered: every candidate undecided and reported with the worksheet — nothing asserts, nothing is dismissed', async () => {
    const r = await SC.check(project(), { engine: 'agent' });
    expect(r.asserting).toBe(0); expect(r.status).toBe('UNDECIDED');
    expect(r.undecided).toBe(r.candidates); expect(r.decisions[0].review).toEqual([]); expect(r.decisions[0].dismissed).toBe(0);
    expect(r.judge.pending).toBeTruthy();
    const txt = SC.render(r);
    expect(txt).toContain(`${r.undecided} passage(s) no judge has answered`); expect(txt).toContain(r.judge.pending);
    const rows = r.decisions[0].undecided;
    expect(rows.every((x: any) => x.by === 'undecided' && x.p === null)).toBe(true);
    expect(rows[0]).toMatchObject({ file: 'docs/03-flows.md', line: 5 });
    expect(rows.some((x: any) => x.line === 7)).toBe(false);   // the current decision shares no retired stem
    expect(rows.some((x: any) => x.line === 11 && /Courier initials/.test(x.excerpt))).toBe(true);   // table row, read with its header
  });

  test('judged: bands by p, and the survivor fails the check', async () => {
    const root = project();
    const first = await SC.check(root, { engine: 'agent' });
    const n = first.candidates;
    const answers: Record<string, number> = {};
    for (let i = 0; i < n; i++) answers[`sc-${i}`] = 0.1;
    answers['sc-0'] = 0.9;
    if (n > 1) answers['sc-1'] = 0.5;
    const r = await SC.check(root, { engine: 'agent', answers });
    expect(r.undecided).toBe(0);
    expect(r.asserting).toBe(1);
    expect(r.status).toBe('FAIL');
    const d = r.decisions[0];
    expect(d.asserting[0].p).toBe(0.9);
    if (n > 1) expect(d.review[0].p).toBe(0.5);
    expect(SC.render(r)).toContain('still assert a retired decision');
  });

  test('CRLF corpus reads the same', async () => {
    const a = await SC.check(project(), { engine: 'agent' });
    const b = await SC.check(project({ crlf: true }), { engine: 'agent' });
    expect(b.candidates).toBe(a.candidates);
    expect(b.decisions[0].undecided.map((x: any) => x.line)).toEqual(a.decisions[0].undecided.map((x: any) => x.line));
  });

  test('without git, amended ADRs are skipped and the report says so', async () => {
    const root = project();
    writeFileSync(join(root, 'adr/ADR-204-routing.md'), '# ADR-204\n\n**Status**: Accepted\n\n## Decision\n\nRoutes are planned nightly.\n\n## Review History\n\n| Date | Reviewer | Action | Notes |\n|---|---|---|---|\n| 2026-01-02 | Team | Amended | changed |\n');
    const r = await SC.check(root, { engine: 'agent' });
    expect(r.notes.join(' ')).toMatch(/git history unavailable/);
  });
});

describe('amended ADRs, from git', () => {
  test('a sentence an older revision carried and the current one does not is retired, and its survivor found', async () => {
    const root = project();
    const adr = (decision: string, history: string) => `# ADR-205: Route planning\n\n**Status**: Accepted\n\n## Decision\n\n${decision}\n\n## Review History\n\n| Date | Reviewer | Action | Notes |\n|------|----------|--------|-------|\n${history}`;
    const p = join(root, 'adr/ADR-205-route-planning.md');
    writeFileSync(p, adr('Routes are recomputed by the overnight batch planner running on the mainframe scheduler.\nDrivers receive routes on the handheld.', '| 2026-01-01 | Team | Created | first |\n'));
    writeFileSync(join(root, 'docs/05-routing.md'), '# Routing\n\nThe overnight batch planner on the mainframe scheduler recomputes every route.\n');
    expect(git(root, 'init', '-q').status).toBe(0);
    git(root, 'config', 'user.email', 't@example.com'); git(root, 'config', 'user.name', 't');
    git(root, 'add', '-A'); git(root, 'commit', '-q', '-m', 'first');
    writeFileSync(p, adr('Routes are recomputed continuously by the streaming dispatcher as orders arrive.\nDrivers receive routes on the handheld.', '| 2026-01-01 | Team | Created | first |\n| 2026-02-01 | Team | Amended | Planning becomes continuous |\n'));
    git(root, 'commit', '-q', '-am', 'amend');
    const { decisions } = SC.retiredDecisions(root, SC.adrsOf(root));
    const amended = decisions.find((d: any) => d.kind === 'amended');
    expect(amended).toBeDefined();
    expect(amended.retired.map((r: any) => r.text).join(' ')).toMatch(/overnight batch planner/);
    expect(amended.retired.map((r: any) => r.text).join(' ')).not.toMatch(/handheld/);
    const r = await SC.check(root, { engine: 'agent', adr: 'ADR-205' });
    expect(r.decisions[0].undecided.some((x: any) => x.file === 'docs/05-routing.md')).toBe(true);
  });
});

describe('CLI', () => {
  test('the removed heuristic engine is refused', () => {
    const r = spawnSync('bun', [SCRIPT, project(), '--strict', '--judge', 'heuristic'], { encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/must be one of agent/);
  });
  test('undecided exits 0, and 1 under --strict', () => {
    const root = project();
    const r = spawnSync('bun', [SCRIPT, root, '--judge', 'agent'], { encoding: 'utf8', env: { ...process.env, SA_JUDGE: '' } });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SUPERSEDED_CLAIMS: UNDECIDED/);
    expect(spawnSync('bun', [SCRIPT, root, '--judge', 'agent', '--strict'], { encoding: 'utf8' }).status).toBe(1);
  });
});
