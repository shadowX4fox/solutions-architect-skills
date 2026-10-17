// The findings contract — what `check-report.js` enforces on every analysis report and what the
// command center's dossier reads through the same module (architecture-analysis SKILL.md § Finding IDs).
import { describe, expect, test } from 'bun:test';
import { join } from 'path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SCRIPTS = join(import.meta.dir, '..', 'scripts');
const { checkReport, extractMarkdown, extractHtml, LENSES, PREFIX_SEVERITY, residualSeverity } = require(join(SCRIPTS, 'findings.js'));

const check = (name: string, body: string) => checkReport(`analysis/${name}`, body);
const messages = (r: any) => r.errors.map((e: any) => e.message);

const BOTTLENECK = `# Bottleneck
## 2. Findings
### 2.1 Top Chokepoints
| # | Tier | Component | Max RPS / Limit | Current HPA | Fan-in Count | Bottleneck Reason | ADR Reference |
|---|---|---|---|---|---|---|---|
| B1-01 | B1 | \`Transaction Cache\` | 760 TPS | stateful (no HPA) | 2 | Single source | ADR-103 |
| B2-01 | B2 | Ingestion | [NOT DOCUMENTED] | 10–30 | 1 | Only fallback path | ADR-113 |
### 2.4 Fan-in Convergence Points
| # | Component | Upstream Callers (count) | Backpressure Mechanism | Risk |
|---|---|---|---|---|
| B2-01 | Ingestion | 2 | None | High |
`;

describe('the findings contract — reports that satisfy it', () => {
  test('Bottleneck: `# | Tier | Component` labels with the component, severity from the tier, one finding across two tables', () => {
    const r = check('BOTTLENECK-2026-09-06.md', BOTTLENECK);
    expect(r.errors).toEqual([]);
    expect(r.items.map((x: any) => [x.id, x.label, x.severity])).toEqual([['B1-01', 'Transaction Cache', 'critical'], ['B2-01', 'Ingestion', 'high']]);
    expect(r.items[1].fields['Backpressure Mechanism']).toBe('None');
    expect(r.items[1].labelColumn).toBe('Component');
  });

  test('SPOF: bold ids, Spanish cells under English headers, prefix severity', () => {
    const r = check('SPOF-2026-01-01.md', `# SPOF
### 2.1 Critical SPOFs
| # | Component | Failure Scenario | Impact | Current Mitigation |
|---|---|---|---|---|
| **C1** | \`Cache de Pedidos\` | Bucket perdido | 100 % | Ninguna |
| O1 | Azure DevOps | Pipeline caído | Sin despliegues | — |
`);
    expect(r.errors).toEqual([]);
    expect(r.items.map((x: any) => [x.id, x.label, x.severity])).toEqual([['C1', 'Cache de Pedidos', 'critical'], ['O1', 'Azure DevOps', 'low']]);
  });

  test('STRIDE: the ID inventory, `—` pass rows, the Severity column, and the High-Priority row merging without renaming', () => {
    const r = check('STRIDE-2026-01-01.md', `# STRIDE
## 2. Trust Boundary Inventory
| ID | Name | From Zone | To Zone | Auth Mechanism | Data Classification | Source |
|---|---|---|---|---|---|---|
| TB-01 | Internet → Gateway | Internet | DMZ | OAuth2 | PII | docs/07 |
## 3. STRIDE Matrix
### TB-01 — Internet → Gateway
| # | Threat | Category | Severity | Status | Control / Gap |
|---|---|---|---|---|---|
| T1-S | Forged token reaches Ingestion | S Spoofing | High | ⚠️ Finding | No audience check |
| — | Payload altered | T Tampering | Low | ✅ Pass | TLS 1.3 |
## 4. High-Priority Threats
| # | Trust Boundary | STRIDE Category | Threat Description | Recommended Mitigation | ADR Reference |
|---|---|---|---|---|---|
| T1-S | TB-01 | Spoofing | Forged token reaches Ingestion | Validate aud | ADR-101 |
`);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    const t = r.items.find((x: any) => x.id === 'T1-S');
    expect(t.label).toBe('Forged token reaches Ingestion');
    expect(t.severity).toBe('high');
    expect(t.fields['Recommended Mitigation']).toBe('Validate aud');
    expect(r.items.find((x: any) => x.id === 'TB-01').severity).toBe('info');
  });

  test('Blast Radius: the ⚡ marker after the id, the Tier column sets severity, an Isolated table without # is not read', () => {
    const r = check('BLAST-RADIUS-2026-01-01.md', `# Blast
### 2.1 High-Blast Components
| # | Component | Tier | Direct Consumers | Cascade Risk | Bulkhead Present |
|---|---|---|---|---|---|
| B1 ⚡ | \`Ingestion\` (SPOF C10) | **S2** | Transaction Cache | Cascading | No |
### 2.2 Isolated Components
| Component | Type | Why Isolated |
|---|---|---|
| Reporting | Worker | Async queue |
`);
    expect(r.errors).toEqual([]);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].fields['#']).toBe('⚡');
    expect(r.items[0].severity).toBe('high');
  });

  test('Latency Budget: the Hop # table is not a findings table; OB-01 is labelled by its Component, not its Flow', () => {
    const r = check('LATENCY-BUDGET-2026-01-01.md', `# Latency
| Hop # | Component | Role | p95 (ms) | % of SLO | Status |
|---|---|---|---|---|---|
| 1 | Gateway | gateway | 20 | 4% | Within Budget |
| TOTAL | — | — | 480 | 96% | PASS |
## 3. Hops Over Budget
| # | Flow | Hop # | Component | p95 (ms) | Proportional Share (ms) | Overage (ms) | Severity |
|---|---|---|---|---|---|---|---|
| OB-01 | Login | 3 | Ingestion | 300 | 125 | 175 | HIGH |
`);
    expect(r.errors).toEqual([]);
    expect(r.items.map((x: any) => [x.id, x.label, x.severity])).toEqual([['OB-01', 'Ingestion', 'high']]);
  });

  test('Tech Debt and Coupling: `# | Tier | Technology`, `# | ADR | Title`, the numbered metrics table is an inventory', () => {
    const td = check('TECH-DEBT-2026-01-01.md', `# Tech Debt
| # | Tier | Technology | Documented Version | EOL Date | Runway (months) | Component(s) using it | Source | Validation |
|---|---|---|---|---|---|---|---|---|
| T1-01 | T1 | Node.js | 14 | 2023-04-30 | -32 | Ingestion | docs/06 | ✅ |
## 5. Architectural Debt
| # | ADR | Title | Status | Superseded By | Replacement Implemented? | Risk |
|---|---|---|---|---|---|---|
| AD-01 | ADR-013 | Redis removed | Superseded | ADR-020 | No | HIGH |
`);
    expect(td.errors).toEqual([]);
    expect(td.items.map((x: any) => [x.id, x.label, x.severity])).toEqual([['T1-01', 'Node.js', 'critical'], ['AD-01', 'Redis removed', 'high']]);
    const k = check('COUPLING-2026-01-01.md', `# Coupling
| # | Component | Fan-in (Ca) | Fan-out (Ce) | Instability (I) | Classification | Source |
|---|---|---|---|---|---|---|
| 1 | Mobile App | 0 | 6 | 1.00 | K2 | docs/05 |
## 6. Cyclical Dependencies (K4)
| # | Cycle Path | Coupling Type | Source Citations |
|---|---|---|---|
| K4-01 | Mobile App → Ingestion → Mobile App | Synchronous call | docs/05 |
`);
    expect(k.errors).toEqual([]);
    expect(k.items.map((x: any) => [x.id, x.label, x.severity])).toEqual([['K4-01', 'Mobile App → Ingestion → Mobile App', 'high']]);
  });

  test('HTML: the `const data` literal, objects keyed by component or technology count as findings', () => {
    const r = check('BOTTLENECK-2026-01-01.html', `<html><script>
const data = {
  headroom: [{ component: "Transaction Cache", headroom_pct: 12, tier: "B1", note: "single writer" }]
};
</script></html>`);
    expect(r.errors).toEqual([]);
    expect(r.items[0].label).toBe('Transaction Cache');
    expect(r.items[0].severity).toBe('critical');
    expect(r.warnings[0].message).toMatch(/carry no id/);
  });

  test('Security Posture is skipped by design; the registry lists every lens', () => {
    expect(check('SECURITY-POSTURE-2026-01-01.md', '# Posture').skipped).toBeTruthy();
    expect(LENSES.sort()).toEqual(['BLAST-RADIUS', 'BOTTLENECK', 'COST-HOTSPOTS', 'COUPLING', 'DATA-SENSITIVITY', 'LATENCY-BUDGET', 'SPOF', 'STRIDE', 'TECH-DEBT', 'VENDOR-LOCKIN']);
    expect(PREFIX_SEVERITY.BOTTLENECK).toEqual({ B1: 'critical', B2: 'high', B3: 'medium', B4: 'medium' });
  });
});

describe('the findings contract — reports it rejects', () => {
  test('a Bottleneck table without a naming column labels by fallback', () => {
    const r = check('BOTTLENECK-2026-01-01.md', `# B
| # | Tier | Max RPS / Limit | Fan-in Count |
|---|---|---|---|
| B1-01 | B1 | 760 TPS | 2 |
`);
    expect(messages(r)).toEqual([expect.stringMatching(/B1-01: labelled `760 TPS` by fallback — no naming column \(Component, Technology/)]);
  });

  test('a marker before the id, a localized header, and an id from another lens\'s scheme', () => {
    const r = check('BOTTLENECK-2026-01-01.md', `# B
| # | Tier | Componente | Max RPS / Limit |
|---|---|---|---|
| ⚡ B1-01 | B1 | Cache | 760 TPS |
| B2 | B2 | Ingestion | 10 |
`);
    expect(messages(r)).toEqual([
      expect.stringMatching(/header `Componente` is localized/),
      expect.stringMatching(/first cell `⚡ B1-01` is neither a finding id nor a row number/),
      expect.stringMatching(/B2: not an id in the BOTTLENECK scheme \(B1-01, B2-01, B3-01, B4-01\)/),
    ]);
    expect(r.errors[1].line).toBe(4);
  });

  test('a finding with no severity source, a report with no findings table, an inventory-only report, an unknown lens', () => {
    const noSev = check('LATENCY-BUDGET-2026-01-01.md', `# L
| # | Flow | Component | p95 (ms) |
|---|---|---|---|
| OB-01 | Login | Ingestion | 300 |
`);
    expect(messages(noSev)).toEqual([expect.stringMatching(/OB-01: no severity — no Severity \/ Risk column, no Tier column/)]);
    expect(messages(check('SPOF-2026-01-01.md', '# S\n\nProse only.\n'))).toEqual([expect.stringMatching(/no table opens with a `#`/)]);
    expect(messages(check('COUPLING-2026-01-01.md', `# C
| # | Component | Fan-in |
|---|---|---|
| 1 | App | 3 |
`))).toEqual([expect.stringMatching(/every `#` table is an inventory/)]);
    const unknown = check('RISKS-2026-01-01.md', '# R\n| # | Component |\n|---|---|\n| C1 | App |\n');
    expect(messages(unknown)[0]).toMatch(/does not open with a lens slug/);
    expect(messages(check('SPOF.md', '# S'))[0]).toMatch(/carries no YYYY-MM-DD date/);
  });

  test('HTML without a data literal, or with one that does not parse', () => {
    expect(messages(check('SPOF-2026-01-01.html', '<html></html>'))).toEqual([expect.stringMatching(/no `const data = \{ … \};` literal/)]);
    expect(messages(check('SPOF-2026-01-01.html', '<script>\nconst data = {\n  heatmap: [ { id: 1 ,\n};\n</script>'))[0]).toMatch(/does not parse/);
  });

  test('mitigation, residual severity and the "what" column (8.63.0): SPOF Current Mitigation none / present, STRIDE Status, Blast Bulkhead', () => {
    const spof = extractMarkdown(`# S
| # | Component | Failure Scenario | Impact | Current Mitigation |
|---|---|---|---|---|
| C1 | \`Cache\` | The **cluster** is lost | 100 % | None — nothing declared |
| C2 | Gateway | The region falls | 100 % | Fallback to the secondary region per [ADR-012](../adr/ADR-012.md) |
| C3 | Vault | Signing stops | Sign-ups stop | ⚠️ pendiente de confirmar |
`, 'SPOF').items;
    expect(spof[0].what).toBe('The cluster is lost'); expect(spof[0].mitigation).toEqual({ column: 'Current Mitigation', text: 'None — nothing declared', state: 'none' }); expect(spof[0].residual).toBe('critical');
    expect(spof[1].mitigation.state).toBe('present'); expect(spof[1].mitigation.text).toBe('Fallback to the secondary region per ADR-012'); expect(spof[1].residual).toBe('high');
    expect(spof[2].mitigation.state).toBe('none'); expect(spof[2].residual).toBe('critical');
    const stride = extractMarkdown(`# T
| # | Threat | Category | Severity | Status | Control / Gap |
|---|---|---|---|---|---|
| T1-I | Body crosses the boundary in clear | I — Information Disclosure | Medium | ⚠️ Finding | No JWE on I-06 |
| T2-D | Reconnection storm | D — DoS | High | ✅ Mitigated | Rate limiting per session (ADR-020) |
`, 'STRIDE').items;
    expect(stride[0].mitigation.state).toBe('none'); expect(stride[0].residual).toBe('medium'); expect(stride[0].what).toBe('No JWE on I-06');
    expect(stride[1].mitigation).toEqual({ column: 'Status', text: '✅ Mitigated', state: 'present' }); expect(stride[1].residual).toBe('medium');
    const blast = extractMarkdown(`# B
| # | Component | Tier | Direct Consumers | Indirect Consumers | Total Blast Fan-out | Cascade Risk | Bulkhead Present |
|---|---|---|---|---|---|---|---|
| B1 | Core | S2 | 1 | 22 | 23 | The whole ingest chain stops | Bulkhead — ingest pauses without loss |
| B2 | Topic | S1 | 2 | 20 | 22 | Both branches | No |
`, 'BLAST-RADIUS').items;
    expect(blast[0].what).toBe('The whole ingest chain stops'); expect(blast[0].residual).toBe('medium'); expect(blast[1].residual).toBe('critical');
    expect(extractMarkdown('# K\n| # | Component | Fan-in | Instability (I) | Dependents (list) |\n|---|---|---|---|---|\n| K1-01 | Hub | 7 | 0.1 | A, B |\n', 'COUPLING').items[0]).not.toHaveProperty('mitigation');   // no mitigation column in the lens: nothing is invented
    expect(residualSeverity('info', { state: 'present' })).toBe('info'); expect(residualSeverity('low', { state: 'present' })).toBe('low');
  });

  test('the same finding named differently in two tables is a warning, not an error', () => {
    const r = check('SPOF-2026-01-01.md', `# S
| # | Component | Failure Scenario | Impact |
|---|---|---|---|
| C1 | Cache | Lost | 100% |
### Hotlist
| # | Component | Impact |
|---|---|---|
| C1 | Cache Cluster | 100% |
`);
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w: any) => w.message)).toEqual([expect.stringMatching(/C1: named `Cache` in one table and `Cache Cluster` in another/)]);
  });
});

describe('check-report.js', () => {
  test('exits 1 on a violation, 0 on a clean directory, and reports per file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sa-findings-'));
    try {
      writeFileSync(join(dir, 'BOTTLENECK-2026-09-06.md'), BOTTLENECK);
      writeFileSync(join(dir, 'SECURITY-POSTURE-2026-09-06.md'), '# Posture\n');
      const ok = Bun.spawnSync(['bun', join(SCRIPTS, 'check-report.js'), dir]);
      expect(ok.exitCode).toBe(0);
      expect(ok.stdout.toString()).toMatch(/✓ .*BOTTLENECK-2026-09-06\.md: 2 finding\(s\) — 1 critical · 1 high/);
      expect(ok.stdout.toString()).toMatch(/SECURITY-POSTURE-2026-09-06\.md: skipped/);
      writeFileSync(join(dir, 'SPOF-2026-09-06.md'), '# S\n| # | Tier |\n|---|---|\n| C1 | high |\n');
      const bad = Bun.spawnSync(['bun', join(SCRIPTS, 'check-report.js'), dir, '--json']);
      expect(bad.exitCode).toBe(1);
      const out = JSON.parse(bad.stdout.toString());
      expect(out.find((r: any) => r.lens === 'SPOF').errors).toHaveLength(1);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('judgeMitigations — is the control in place today', () => {
  test("unanswered, the contract's reading stands and every cell is reported undecided; the judge flips a planned control to none and the residual follows", async () => {
    const { judgeMitigations } = require(join(SCRIPTS, 'findings.js'));
    const md = `# SPOF\n\n## Findings\n\n| # | Component | Failure Scenario | Current Mitigation | Severity |\n|---|---|---|---|---|\n| C1 | Ledger DB | Disk fails | Multi-AZ replica planned for Q3 | Critical |\n| C2 | Ledger API | Pod dies | Three replicas behind the LB | Critical |\n| C3 | Topic Entries | Broker down | None | Critical |\n`;
    const { items } = extractMarkdown(md, 'SPOF');
    expect(items.map((it: any) => `${it.id}:${it.mitigation.state}:${it.residual}`)).toEqual(['C1:present:high', 'C2:present:high', 'C3:none:critical']);   // the lexicon reads "planned" as present
    const root = mkdtempSync(join(tmpdir(), 'mitigations-'));
    try {
      const h = await judgeMitigations(items.map((it: any) => ({ it, lens: 'SPOF' })), { engine: 'agent', root });
      expect(h.asked).toBe(3); expect(h.flipped).toEqual([]);
      expect(h.pending).toMatch(/mitigation-present/);
      expect(h.undecided).toHaveLength(3); expect(h.undecided[0]).toContain('C1: reads present, not re-read (undecided)');
      expect(items.map((it: any) => `${it.id}:${it.mitigation.state}:${it.residual}`)).toEqual(['C1:present:high', 'C2:present:high', 'C3:none:critical']);   // nothing changed
      const gone = await judgeMitigations(items.map((it: any) => ({ it, lens: 'SPOF' })), { engine: 'heuristic' });   // the engine is gone: a note, every cell undecided
      expect(gone.note).toMatch(/removed in 8\.119\.0/); expect(gone.undecided).toHaveLength(3);
    } finally { rmSync(root, { recursive: true, force: true }); }
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); const answers: any = {}; for (const [id, q] of Object.entries<any>(b.questions)) answers[id] = { type: 'noul', noul: /planned/i.test(b.state.items[id].cell) ? 0.06 : /replicas/i.test(b.state.items[id].cell) ? 0.94 : 0.02 }; return { ok: true, json: async () => ({ model: 'jev-test', answers }) }; };
    const j = await judgeMitigations(items.map((it: any) => ({ it, lens: 'SPOF' })), { engine: 'typesafe', apiKey: 'k', fetch, cache: false });
    expect(j.flipped.length).toBe(1); expect(j.flipped[0]).toContain('C1: present → none (jev-test 0.06)');
    expect(items.map((it: any) => `${it.id}:${it.mitigation.state}:${it.residual}`)).toEqual(['C1:none:critical', 'C2:present:high', 'C3:none:critical']);
    expect(items[1].mitigation).toMatchObject({ by: 'jev-test', p: 0.94 });
  });
});

describe('the findings CLI (8.116.0) — what a dashboard reads instead of parsing reports', () => {
  test('the newest report of each lens, counted by severity; an older report of the same lens is not read', () => {
    const dir = mkdtempSync(join(tmpdir(), 'findings-cli-'));
    try {
      writeFileSync(join(dir, 'BOTTLENECK-2026-09-06.md'), BOTTLENECK);
      writeFileSync(join(dir, 'BOTTLENECK-2026-08-01.md'), BOTTLENECK.replace('| B2-01 | B2 |', '| B1-02 | B1 |'));
      writeFileSync(join(dir, 'notes.md'), '# not a report');
      const CLI = require(join(import.meta.dir, '..', '..', '..', 'scripts', 'sa-skills.js')).fromSaSkills('scripts', 'shared', 'findings.js');   // the CLI is the shared module's
      const p = Bun.spawnSync(['bun', CLI, dir, '--json']);
      expect(p.exitCode).toBe(0);
      const rows = JSON.parse(p.stdout.toString());
      expect(rows).toEqual([{ lens: 'BOTTLENECK', date: '2026-09-06', file: 'BOTTLENECK-2026-09-06.md', total: 2, severity: { critical: 1, high: 1 }, residual: expect.any(Object), errors: 0 }]);
      expect(Bun.spawnSync(['bun', CLI]).exitCode).toBe(2);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('one report per lens (8.117.0) — archiveOlder and the --archive CLI', () => {
  const { archiveOlder } = require(require(join(import.meta.dir, '..', '..', '..', 'scripts', 'sa-skills.js')).fromSaSkills('scripts', 'shared', 'findings.js'));
  const CLI = require(join(import.meta.dir, '..', '..', '..', 'scripts', 'sa-skills.js')).fromSaSkills('scripts', 'shared', 'findings.js');
  const { existsSync, readdirSync, mkdirSync } = require('node:fs');
  test('the earlier reports of the lens move to archive/ — never a later one, never another lens; a taken name is numbered', () => {
    const dir = mkdtempSync(join(tmpdir(), 'archive-'));
    try {
      ['BLAST-RADIUS-2026-09-20.md', 'BLAST-RADIUS-2026-09-27.html', 'BLAST-RADIUS-2026-10-05.md', 'SPOF-2026-09-20.md', 'BLAST-RADIUS-2026-10-01.md'].forEach((n) => writeFileSync(join(dir, n), '#'));
      mkdirSync(join(dir, 'archive')); writeFileSync(join(dir, 'archive', 'BLAST-RADIUS-2026-09-20.md'), 'older copy');
      expect(archiveOlder(join(dir, 'BLAST-RADIUS-2026-10-01.md')).sort()).toEqual(['archive/BLAST-RADIUS-2026-09-20-1.md', 'archive/BLAST-RADIUS-2026-09-27.html']);
      expect(readdirSync(dir).filter((n: string) => n !== 'archive').sort()).toEqual(['BLAST-RADIUS-2026-10-01.md', 'BLAST-RADIUS-2026-10-05.md', 'SPOF-2026-09-20.md']);
      // the CLI over a folder: the newest of each lens stays
      expect(Bun.spawnSync(['bun', CLI, dir, '--archive']).stdout.toString()).toContain('archived 1: archive/BLAST-RADIUS-2026-10-01.md');
      expect(existsSync(join(dir, 'BLAST-RADIUS-2026-10-05.md'))).toBe(true);
      expect(Bun.spawnSync(['bun', CLI, dir, '--archive']).stdout.toString()).toContain('nothing to archive');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
