// The analyses a pull request re-runs and the verdict on them (11.7.0): analysis-impact.js maps the change to lenses,
// analysis-diff.js decides whether the state was kept. A synthetic architecture (Order Desk) in a git repository outside
// this one.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { FILES } from '../../../../sa-visualization/skills/architecture-command-center/tests/order-desk.fixture';

const SCRIPTS = join(import.meta.dir, '..', 'scripts');
const { impact, IMPACT, LENSES } = require(join(SCRIPTS, 'analysis-impact.js'));
const { diff, markdown, recordAccepted } = require(join(SCRIPTS, 'analysis-diff.js'));

const TMP = mkdtempSync(join(tmpdir(), 'sa-analysis-ci-'));
const ROOT = join(TMP, 'order-desk');
const git = (...a: string[]) => { const r = spawnSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: TMP } }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim(); };
const put = (rel: string, text: string) => { mkdirSync(dirname(join(ROOT, rel)), { recursive: true }); writeFileSync(join(ROOT, rel), text); };
// the SPOF plan's sections: a C row is critical under the first, a D row medium under the second
const SPOF_HEAD = '| # | Component | Failure Scenario | Impact | Current Mitigation |\n|---|---|---|---|---|\n';
const spof = (rows: string) => {
  const lines = rows.split('\n'), c = lines.filter((l) => /^\| C/.test(l)), d = lines.filter((l) => /^\| D/.test(l));
  return `# SPOF\n### 2.1 Critical SPOFs — Full Outage\n${SPOF_HEAD}${c.join('\n')}\n\n### 2.2 Degradation SPOFs — Partial / Silent Failures\n${SPOF_HEAD}${d.join('\n')}\n`;
};
const stride = '# STRIDE\n### 2.1 High Priority\n| # | Threat | Category | Severity | Status |\n|---|---|---|---|---|\n| T1-S | Token replay against `API Gateway` | Spoofing | Medium | Open |\n';

let BASE = '';
beforeAll(() => {
  mkdirSync(ROOT, { recursive: true });
  for (const [rel, text] of Object.entries(FILES)) put(rel, text);
  put('analysis/SPOF-2026-01-01.md', spof('| C1 | `Order DB` | Primary lost | All orders | None |\n| D1 | `Outbox Relay` | Lag | Late events | Retry |'));
  put('analysis/STRIDE-2026-01-01.md', stride);
  git('init', '-q', '-b', 'main'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  BASE = git('rev-parse', 'HEAD');
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe('analysis-impact.js — the lenses a change impacts', () => {
  test('the table names only real lenses, and a container added or removed impacts all of them', () => {
    for (const ls of Object.values(IMPACT) as string[][]) for (const l of ls) expect(LENSES).toContain(l);
    expect(IMPACT['container-added']).toEqual(LENSES);
  });

  test('nothing changed: no lens runs', () => {
    const r = impact(ROOT, BASE);
    expect(r.changes).toEqual([]);
    expect(r.run).toEqual([]);
  });

  test('a technology swapped: the lenses that read it, run only where this architecture already analyses', () => {
    const f = 'docs/components/order-desk/03-order-service.md', was = readFileSync(join(ROOT, f), 'utf8');
    put(f, was.replace('**Technology:** [Spring Boot]', '**Technology:** [Quarkus]'));
    try {
      const r = impact(ROOT, BASE);
      expect(r.changes.map((c: any) => c.kind)).toEqual(['container-technology']);
      expect(r.impacted).toEqual(['cost-hotspots', 'stride', 'vendor-lockin', 'tech-debt']);
      expect(r.run).toEqual(['stride']);                                   // the one of them with a report under analysis/
      expect(r.skipped).toEqual(['cost-hotspots', 'vendor-lockin', 'tech-debt']);
      expect(r.reasons.stride[0]).toMatch(/Order Service: Spring Boot → Quarkus/);
    } finally { put(f, was); }
  });

  test('an integration added: the graph lenses; the purpose of a container reworded: none', () => {
    const f = 'docs/05-integration-points.md', was = readFileSync(join(ROOT, f), 'utf8');
    const c = 'docs/components/order-desk/04-order-db.md', cwas = readFileSync(join(ROOT, c), 'utf8');
    put(f, was.replace(/(\| I-03 \|[^\n]*\n)/, '$1| I-09 | `Outbox Relay` | `Order DB` | JDBC | Request-response | Internal |\n'));
    put(c, cwas.replace('does one thing', 'does a single thing'));
    try {
      const r = impact(ROOT, BASE);
      expect(r.changes.map((x: any) => x.kind)).toContain('integration-added');
      expect(r.run).toEqual(['spof']);
      expect(r.changes.every((x: any) => x.kind !== 'container-technology')).toBe(true);
      expect([...r.touched.spof].sort()).toEqual(['I-09', 'Order DB', 'Outbox Relay']);   // what the change touches, by name (11.9.0)
    } finally { put(f, was); put(c, cwas); }
  });
});

test('an integration whose target moved touches the moved end and the integration, not the end that stayed (11.9.0)', () => {
  const { changesOf } = require(join(SCRIPTS, 'analysis-impact.js'));
  const comp = (name: string) => ({ name, slug: name.toLowerCase().replace(/ /g, '-'), level: 'L2' });
  const led = (to: string) => ({ components: [comp('Web App'), comp('Old Vault'), comp('New Vault')], integrations: [{ id: 'I-07', from: 'Web App', to, protocol: 'HTTPS', pattern: 'rr', boundary: 'internal' }], flows: [], phases: [], tdrs: [], demand: null });
  const ch = changesOf(led('Old Vault'), led('New Vault'), join(TMP, 'none'), join(TMP, 'none'));
  expect(ch).toEqual([expect.objectContaining({ kind: 'integration-ends', names: ['I-07', 'Old Vault', 'New Vault'] })]);
});

describe('analysis-diff.js — was the state kept?', () => {
  const write = (rows: string) => { rmSync(join(ROOT, 'analysis', 'SPOF-2026-01-01.md'), { force: true }); put('analysis/SPOF-2026-02-01.md', spof(rows)); };
  const restore = () => { rmSync(join(ROOT, 'analysis', 'SPOF-2026-02-01.md'), { force: true }); git('checkout', '-q', '--', 'analysis'); };

  test('the same findings renumbered: kept', async () => {
    write('| C1 | `Order DB` | Primary lost, again | All orders | None |\n| D1 | `Outbox Relay` | Lag | Late events | Retry |');
    try {
      const r = await diff(ROOT, BASE, ['spof']);
      expect(r.verdict).toBe('kept');
      expect(r.lenses[0]).toMatchObject({ before: 'analysis/SPOF-2026-01-01.md', after: 'analysis/SPOF-2026-02-01.md', held: [], raised: [] });
      expect(markdown(r, false)).toMatch(/keep the state/);
    } finally { restore(); }
  });

  test('a finding raised to critical: worsened, named as raised', async () => {
    write('| C1 | `Order DB` | Primary lost | All orders | None |\n| C2 | `Outbox Relay` | Lag stops all orders | All orders | None |');
    try {
      const r = await diff(ROOT, BASE, ['spof']);
      expect(r.verdict).toBe('worsened');
      expect(r.raised).toEqual([expect.objectContaining({ lens: 'spof', name: 'Outbox Relay', from: 'medium', to: 'critical' })]);
      expect(r.resolved).toEqual([]);
    } finally { restore(); }
  });

  test('a new critical finding the judge has not paired: it holds, never guessed; a medium one alone never holds', async () => {
    write('| C1 | `Order DB` | Primary lost | All orders | None |\n| C2 | `API Gateway` | Gateway down | All traffic | None |\n| D1 | `Outbox Relay` | Lag | Late events | Retry |\n| D2 | `Web App` | CDN lost | Slow pages | None |');
    try {
      const r = await diff(ROOT, BASE, ['spof'], { engine: 'agent' });
      expect(r.verdict).toBe('worsened');
      expect(r.held).toEqual([expect.objectContaining({ id: 'C2', name: 'API Gateway', severity: 'critical' })]);
      expect(r.judge.pairs).toBe(0);                                       // every base finding is paired by name: no candidate
      expect(r.lenses[0].minor).toBe(1);
      expect(markdown(r, true)).toMatch(/El estado cambió[\s\S]*API Gateway/);
    } finally { restore(); }
  });

  test('a lens asked for but not re-run — its newest report still the base\'s own — holds the merge, never a verdict', async () => {
    const r = await diff(ROOT, BASE, ['spof', 'stride']);
    expect(r.missing).toEqual(['spof', 'stride']);
    expect(r.verdict).toBe('worsened');
  });

  test('severity by the lens\'s prefix registry when no column states it: a new G1 data-sensitivity gap holds (#28)', async () => {
    const HEAD = '| # | Gap | Data Store / Flow | Sensitivity | Protocol / Storage | Missing Control | Source |\n|---|---|---|---|---|---|---|\n';
    const ds = (rows: string) => `# DS\n### 2.3 Gaps <!-- SECTION: Gaps -->\n${HEAD}${rows}\n`;
    put('analysis/DATA-SENSITIVITY-2026-01-01.md', ds('| G2-01 | G2 | `Order DB` | S1 | JDBC | Encryption at rest | docs/07 |'));
    git('add', '-A'); git('commit', '-q', '-m', 'ds base'); const ref = git('rev-parse', 'HEAD');
    put('analysis/DATA-SENSITIVITY-2026-02-01.md', ds('| G1-01 | G1 | `API Gateway` → `Order Service` | S1 | HTTP | TLS | docs/05 |\n| G2-01 | G2 | `Order DB` | S1 | JDBC | Encryption at rest | docs/07 |'));
    try {
      const r = await diff(ROOT, ref, ['data-sensitivity'], { engine: 'agent' });
      expect(r.lenses[0].totals).toMatchObject({ before: { critical: 1 }, after: { critical: 2 } });
      expect(r.verdict).toBe('worsened');
    } finally { git('reset', '-q', '--hard', BASE); rmSync(join(ROOT, 'analysis', 'DATA-SENSITIVITY-2026-02-01.md'), { force: true }); }
  });

  test('attribution: a new critical on an element the change left alone does not hold; on a touched one it does; on no known element it does (11.9.0)', async () => {
    write('| C1 | `Order DB` | Primary lost | All orders | None |\n| C2 | `API Gateway` | Gateway down | All traffic | None |\n| C3 | Shared secret store | Lost | All | None |\n| D1 | `Outbox Relay` | Lag | Late events | Retry |');
    try {
      const known = ['Order DB', 'API Gateway', 'Outbox Relay', 'Order Service'];
      const left = await diff(ROOT, BASE, ['spof'], { engine: 'agent', impact: { touched: { spof: ['Order Service'] }, known } });
      expect(left.preexisting.map((h: any) => h.id)).toEqual(['C2']);          // API Gateway: untouched, known — reported, not held
      expect(left.held.map((h: any) => h.id)).toEqual(['C3']);                  // names no known element: cannot be placed, holds
      expect(markdown(left, true)).toMatch(/No los causó este cambio[\s\S]*API Gateway/);
      const touched = await diff(ROOT, BASE, ['spof'], { engine: 'agent', impact: { touched: { spof: ['API Gateway'] }, known } });
      expect(touched.held.map((h: any) => h.id).sort()).toEqual(['C2', 'C3']);
      const all = await diff(ROOT, BASE, ['spof'], { engine: 'agent', impact: { touched: { spof: '*' }, known } });
      expect(all.held.map((h: any) => h.id).sort()).toEqual(['C2', 'C3']);    // a change that names no element touches them all
    } finally { restore(); }
  });

  test('a finding the architect accepted never holds again at that severity; recorded by --record-accepted (11.9.0)', async () => {
    write('| C1 | `Order DB` | Primary lost | All orders | None |\n| C2 | `API Gateway` | Gateway down | All traffic | None |\n| D1 | `Outbox Relay` | Lag | Late events | Retry |');
    try {
      const first = await diff(ROOT, BASE, ['spof'], { engine: 'agent', accepted: [] });
      expect(first.verdict).toBe('worsened');
      expect(recordAccepted(ROOT, first, 'architect', 7)).toBe(1);
      const kept = await diff(ROOT, BASE, ['spof'], { engine: 'agent' });
      expect(kept.verdict).toBe('kept');
      expect(kept.resolved).toEqual([]);                                        // an accepted finding is never 'resolved'
      expect(JSON.parse(readFileSync(join(ROOT, 'analysis', 'accepted.json'), 'utf8')).findings[0]).toMatchObject({ lens: 'spof', name: 'API Gateway', severity: 'critical', by: 'architect', pr: 7 });
      expect(recordAccepted(ROOT, first, 'architect', 7)).toBe(0);             // recorded once
    } finally { rmSync(join(ROOT, 'analysis', 'accepted.json'), { force: true }); restore(); }
  });

  test('a lens that produced no report holds the merge', async () => {
    const r = await diff(ROOT, BASE, ['spof', 'coupling']);
    expect(r.missing).toEqual(['spof', 'coupling']);          // spof's newest is still the base's own: not re-run
    expect(r.verdict).toBe('worsened');
  });
});

describe('analysis-chart.js — one picture of the analyses', () => {
  const { chartSvg, stateModel } = require(join(SCRIPTS, 'analysis-chart.js'));
  const info = { name: 'Order Desk', version: '1.2.0', lang: 'es' };
  const diffModel = { kind: 'diff', verdict: 'worsened', base: 'abc123', items: [{ kind: 'new', severity: 'critical', lens: 'spof', id: 'C2', name: 'API Gateway' }],
    lenses: [{ lens: 'spof', before: { critical: 1, high: 0, medium: 1, low: 0 }, after: { critical: 2, high: 0, medium: 1, low: 0 }, held: 1, raised: 0 },
      { lens: 'coupling', missing: true, before: null, after: null, held: 0, raised: 0 }] };

  test('a diff: the verdict, each lens before → after, what rose, in the document language', () => {
    const svg = chartSvg(diffModel, info, { embed: false });
    expect(svg).toStartWith('<svg');
    expect(svg).toContain('El estado cambió: decide el arquitecto');
    expect(svg).toContain('contra abc123');
    expect(svg).toMatch(/C 1→2/);
    expect(svg).toContain('▲ 1 nuevo');
    expect(svg).toContain('API Gateway');
    expect(svg).toContain('sin reporte');
    expect(chartSvg({ ...diffModel, verdict: 'kept', items: [] }, { ...info, lang: 'en' }, { embed: false })).toContain('The analyses keep the state');
  });

  test('the state: every lens analysed here, from its newest report', () => {
    const m = stateModel(ROOT);
    expect(m.lenses.map((l: any) => l.lens)).toEqual(['spof', 'stride']);
    expect(m.lenses[0].after.critical).toBe(1);
    expect(chartSvg(m, info, { embed: false })).toContain('Cómo están los análisis');
  });

  test('her blazon inlined, never her face, and the fonts by name: the lean SVG fits a surface\'s vector element (128 KB)', () => {
    const lean = chartSvg(diffModel, info, { fonts: false });
    expect(lean).toContain('data:image/svg+xml;base64,');
    expect(lean).not.toContain('data:image/png;base64,');
    expect(lean).not.toContain('@font-face');
    expect(lean.length).toBeLessThan(131072);
  });
});

describe('analysis-chart.js --lens — one lens\'s own figure', () => {
  const { parseHeat, lensModel, lensSvg } = require(join(SCRIPTS, 'analysis-chart.js'));
  const info = { name: 'Order Desk', version: '1.2.0', lang: 'en' };
  const HEAT = '## 3. Heat Map <!-- SECTION: Heat Map -->\n\n```\nIMPACT │\nHIGH   │       │ [C1]  │ [C2]  \n       ├───────┼───────┼───────\nLOW    │ [D1]  │       │       \n       └───────┴───────┴───────\n         LOW     MID     HIGH  \n         LIKELIHOOD →\n```\n\n## 4. Next <!-- SECTION: Top Recommendations -->\n';

  test('the heat map grid as the report draws it: rows, columns, every id in its cell', () => {
    const h = parseHeat(HEAT);
    expect(h.ylabel).toBe('IMPACT');
    expect(h.xlabel).toBe('LIKELIHOOD');
    expect(h.xlabels).toEqual(['LOW', 'MID', 'HIGH']);
    expect(h.rows.map((r: any) => [r.label, r.cells])).toEqual([['HIGH', [[], ['C1'], ['C2']]], ['LOW', [['D1'], [], []]]]);
  });

  const BLAST = '# Blast\n### 2.1 High-Blast Components <!-- SECTION: High-Blast Components -->\n\n| # | Component | Tier | Direct Consumers | Indirect Consumers | Total Blast Fan-out | Cascade Risk | Bulkhead Present |\n|---|---|---|---|---|---|---|---|\n| B1 | `Order DB` | S1 | `Order Service`, `Outbox Relay` | `API Gateway` | 3 | Cascading | No |\n| B2 | `Order Service` | S2 | `API Gateway` | None | 1 | Partial | Timeouts |\n';
  const LAT = '# Latency\n### 2.1 Per-Flow Budget Breakdown <!-- SECTION: Per-Flow Budget Breakdown -->\n\n#### Flow 1 — Place order (≤ 800 ms p95)\n\n| Hop # | Component | Role | p95 (ms) | Status |\n|---|---|---|---|---|\n| 1 | `Web App` | Client | 150 | within |\n| 2 | `Order Service` | Core | 700 | over |\n\n#### Flow 2 — Track order (≤ 300 ms p95)\n\n| Hop # | Component | Role | p95 (ms) | Status |\n|---|---|---|---|---|\n| 1 | `Order Service` | Core | Not documented | untracked |\n';

  test('blast radius: the focused component with its direct and indirect consumers; no focus, the widest', () => {
    put('analysis/BLAST-RADIUS-2026-03-01.md', BLAST);
    try {
      const m = lensModel(ROOT, 'blast-radius', 'order service');
      expect(m.row).toMatchObject({ name: 'Order Service', direct: ['API Gateway'], indirect: [] });
      expect(lensModel(ROOT, 'blast-radius').row.name).toBe('Order DB');
      expect(lensSvg(lensModel(ROOT, 'blast-radius'), info, { embed: false })).toContain('Blast radius — Order DB');
    } finally { rmSync(join(ROOT, 'analysis', 'BLAST-RADIUS-2026-03-01.md')); }
  });

  test('latency: a flow by its number, its hops against the target; no focus, the flow over budget', () => {
    put('analysis/LATENCY-BUDGET-2026-03-01.md', LAT);
    try {
      const m = lensModel(ROOT, 'latency-budget', '2');
      expect(m.flow.title).toMatch(/^Flow 2/);
      expect(m.flow.hops[0]).toMatchObject({ name: 'Order Service', ms: null, status: 'untracked' });
      const f1 = lensModel(ROOT, 'latency-budget').flow;
      expect(f1).toMatchObject({ target: 800 });
      expect(f1.hops.map((h: any) => h.status)).toEqual(['within', 'over']);
      expect(lensSvg(lensModel(ROOT, 'latency-budget'), info, { embed: false })).toContain('documented: 850 ms / target 800 ms');
    } finally { rmSync(join(ROOT, 'analysis', 'LATENCY-BUDGET-2026-03-01.md')); }
  });

  test('latency: the TOTAL footer and the ASCII bar under the table are not hops', () => at('analysis/LATENCY-BUDGET-2026-03-02.md',
    '# L\n### 2.1 Desglose <!-- SECTION: Per-Flow Budget Breakdown -->\n\n#### Flujo 1 — Reservar sala (≤ 500 ms p95)\n\n| Salto # | Componente | Rol | p95 (ms) | % del SLO | Estado |\n|---|---|---|---|---|---|\n| 1 | `Web App` | client | Not documented | — | Untracked |\n| 2 | `Order Service` | service | Not documented | — | Untracked |\n| **TOTAL** | — | — | — | — | — |\n\n|──────────────────────────| 500ms\nWeb App   [░░░░]  —\n\n```\n|──────| 500ms\n```\n', () => {
      const f = lensModel(ROOT, 'latency-budget').flow;
      expect(f.hops.map((h: any) => h.name)).toEqual(['Web App', 'Order Service']);
      expect(f.hops.every((h: any) => h.status === 'untracked')).toBe(true);
      expect(f.target).toBe(500);
    }));

  test('latency: the bar the renderer writes above the table is passed over (11.8.6)', () => at('analysis/LATENCY-BUDGET-2026-03-03.md',
    '# L\n### 2.1 Desglose <!-- SECTION: Per-Flow Budget Breakdown -->\n\n#### Flujo 1 — Reservar sala (≤ 500 ms p95)\n\n|──────────────| 500ms\nWeb App [░░] —\n\n| Salto # | Componente | Rol | p95 (ms) | Estado |\n|---|---|---|---|---|\n| 1 | `Web App` | client | Not documented | Untracked |\n| TOTAL | — | — | — | — |\n', () => {
      expect(lensModel(ROOT, 'latency-budget').flow.hops.map((h: any) => h.name)).toEqual(['Web App']);
    }));

  test('a heat map is read under its plan\'s own section — Tech Debt\'s "Debt Heat Map" (11.8.6)', () => at('analysis/TECH-DEBT-2026-03-01.md',
    '# T\n## 4. Debt Heat Map <!-- SECTION: Debt Heat Map -->\n\n```\nSEVERITY   │\nT1         │            │ [T1-01]    │            │\n           ├────────────┼────────────┼────────────┤\nT3         │            │            │            │\n           └────────────┴────────────┴────────────┘\n                LOW          MID          HIGH\n                  EFFORT →\n```\n', () => {
      const m = lensModel(ROOT, 'tech-debt');
      expect(m.heat.rows[0].cells[1]).toEqual(['T1-01']);
    }));

  test('blast radius with no high-blast component is an empty figure, not an error (11.8.6)', () => at('analysis/BLAST-RADIUS-2026-03-01.md',
    '# B\n### 2.1 High-Blast Components <!-- SECTION: High-Blast Components -->\n\n_Sin hallazgos en esta corrida._\n', () => {
      const m = lensModel(ROOT, 'blast-radius');
      expect(m).toMatchObject({ kind: 'graph', row: null, empty: true });
      expect(lensSvg(m, info, { embed: false })).toContain('No high-blast component');
    }));

  test('a blast radius report without its section is named, never drawn as empty (11.9.1)', () => at('analysis/BLAST-RADIUS-2026-03-01.md',
    '# B\n### 2.1 High-Blast Components\n| # | Component | Tier |\n|---|---|---|\n| B1 | `Desk Store` | S1 |\n', () => {
      expect(() => lensModel(ROOT, 'blast-radius')).toThrow(/has no High-Blast Components section/);
    }));

  test('a lens without its report, or a view it does not have, is named', () => {
    expect(() => lensModel(ROOT, 'tech-debt')).toThrow(/no Markdown report of tech-debt/);
    expect(() => lensModel(ROOT, 'spof', null, 'matrix')).toThrow(/spof has no matrix view/);
  });

  const at = (rel: string, md: string, fn: () => void) => { put(rel, md); try { fn(); } finally { rmSync(join(ROOT, rel)); } };
  test('bottleneck: headroom per component, an undocumented figure drawn as such', () => at('analysis/BOTTLENECK-2026-03-01.md',
    '# B\n### 2.3 Capacity Headroom Summary <!-- SECTION: Capacity Headroom Summary -->\n\n| # | Component | Current Load (est.) | Max Capacity | Headroom % | Risk Level |\n|---|---|---|---|---|---|\n| 1 | `Order Service` | 300 rps | 400 rps | 25% | B2 |\n| 2 | `Order DB` | [NOT DOCUMENTED] | [NOT DOCUMENTED] | [NOT DOCUMENTED] | B1 |\n', () => {
      const m = lensModel(ROOT, 'bottleneck');
      expect(m.rows).toEqual([{ name: 'Order Service', pct: 25, risk: 'B2', load: '300 rps', max: '400 rps' }, { name: 'Order DB', pct: null, risk: 'B1', load: '', max: '' }]);
      expect(lensSvg(m, info, { embed: false })).toContain('300 rps / 400 rps');
      expect(lensSvg(m, info, { embed: false })).toContain('1 of 2 without a capacity figure');
    }));

  test('coupling: fan-in and fan-out per component, its classes', () => at('analysis/COUPLING-2026-03-01.md',
    '# C\n### 2.1 Coupling Metrics <!-- SECTION: Coupling Metrics -->\n\n| # | Component | Scope | Fan-in (Ca) | Fan-out (Ce) | Instability (I) | Classification |\n|---|---|---|---|---|---|---|\n| 1 | `Order Service` | in | 3 | 4 | 0.57 | K3 god object |\n| 2 | `Web App` | in | 0 | 1 | 1.00 | — |\n', () => {
      const m = lensModel(ROOT, 'coupling');
      expect(m.rows[0]).toMatchObject({ name: 'Order Service', fanin: 3, fanout: 4, inst: 0.57, klass: ['K3'] });
      expect(lensSvg(m, info, { embed: false })).toContain('K3');
    }));

  test('cost: the Pareto when a monthly cost is documented, the mentions when none is', () => at('analysis/COST-HOTSPOTS-2026-03-01.md',
    '# K\n### 2.1 Pareto Cost Table <!-- SECTION: Pareto Cost Table -->\n\n_No findings._\n\n### 2.2 Qualitative Cost Mentions <!-- SECTION: Qualitative Cost Mentions -->\n\n| # | Component | Cost Mention | Source | Recommended Action |\n|---|---|---|---|---|\n| Q-01 | `Order Service` | Two replicas always on | docs/09 | Document it |\n', () => {
      const m = lensModel(ROOT, 'cost-hotspots');
      expect(m.rows).toEqual([]);
      expect(m.mentions[0]).toMatchObject({ id: 'Q-01', name: 'Order Service' });
      expect(lensSvg(m, info, { embed: false })).toContain('No monthly cost is documented');
    }));

  test('data sensitivity: the flows by default, each step encrypted, undocumented or a gap; the heat map as a view', () => at('analysis/DATA-SENSITIVITY-2026-03-01.md',
    '# D\n### 2.1 Data Inventory <!-- SECTION: Data Inventory -->\n\n| # | Store / Queue / Cache | Type | Sensitivity Tier | Tags |\n|---|---|---|---|---|\n| 1 | `Order DB` | db | S1 | — |\n\n### 2.2 Sensitive Data Flow Map <!-- SECTION: Sensitive Data Flow Map -->\n\n| # | Flow | Step | From | To | Protocol | Carries Sensitive Data? | Encryption in Transit | Gap |\n|---|---|---|---|---|---|---|---|---|\n| 1 | Flow 1 — Place | 1 | `Web App` | `Order Service` | HTTPS | Yes | Documented (TLS) | None |\n| 2 | Flow 1 — Place | 2 | `Order Service` | `Order DB` | JDBC | Yes | Not documented | G1 |\n', () => {
      const m = lensModel(ROOT, 'data-sensitivity');
      expect(m.kind).toBe('flows');
      expect(m.steps.map((x: any) => [x.enc, x.gap])).toEqual([['yes', ''], ['no', 'G1']]);
      expect(m.tierOf('Order DB')).toBe('S1');
      expect(lensSvg(m, info, { embed: false })).toContain('1 gap');
      expect(() => lensModel(ROOT, 'data-sensitivity', null, 'heatmap')).toThrow(/has no heat map/);
    }));

  test('STRIDE as a matrix: each boundary × category, its findings counted, a pass checked', () => at('analysis/STRIDE-2026-03-01.md',
    '# S\n### 2.2 STRIDE Matrix <!-- SECTION: STRIDE Matrix -->\n\n### TB-01 — TB-01 — Internet → `API Gateway`\n\n| # | Threat | Category | Severity | Status | Control / Gap |\n|---|---|---|---|---|---|\n| — | Token forgery | S | — | ✅ Pass | JWT |\n| T1-D | Flood | D | High | ⚠️ Finding | No rate limit |\n\n### 2.3 High-Priority Threats <!-- SECTION: High-Priority Threats -->\n', () => {
      const m = lensModel(ROOT, 'stride', null, 'matrix');
      expect(m.groups).toHaveLength(1);
      expect(m.groups[0].rows.map((r: any) => [r.cat, r.sev, r.pass])).toEqual([['S', null, true], ['D', 'high', false]]);
      expect(lensSvg(m, info, { embed: false })).toContain('1 trust boundary');
    }));
  // 11.10.0 — every lens asked for one element: a finding by its id on any lens, a STRIDE boundary by its TB-nn
  const STRIDE_FULL = '# S\n## 2. Trust Boundary Inventory <!-- SECTION: Trust Boundary Inventory -->\n\n| # | Name | From Zone | To Zone | Auth Mechanism | Data Classification | Source |\n|---|---|---|---|---|---|---|\n| TB-01 | Web App → API Gateway (I-01) | Internet | DMZ | OAuth2 JWT, mTLS | Order PII | docs/07 § 9 |\n\n'
    + '## 3. STRIDE Matrix <!-- SECTION: STRIDE Matrix -->\n\n### TB-01 — TB-01 — Web App → API Gateway (I-01)\n\n| # | Threat | Category | Severity | Status | Control / Gap |\n|---|---|---|---|---|---|\n| — | Token forgery | Spoofing | — | ✅ Pass | JWT signed |\n| — | Payload altered | Tampering | — | ✅ Pass | TLS |\n| T1-D | Flood of orders | DoS | High | ⚠️ Finding | No rate limit |\n| — | Role escalation | Elevation of Privilege | — | ✅ Pass | Scopes |\n\n'
    + '## 4. High-Priority Threats <!-- SECTION: High-Priority Threats -->\n\n| # | Trust Boundary | STRIDE Category | Threat Description | Recommended Mitigation | ADR Reference |\n|---|---|---|---|---|---|\n| T1-D | TB-01 | DoS | Flood | Rate limit per client | ADR-101 |\n';

  test('STRIDE as a matrix reads the category as the renderer writes it — the word, English or Spanish (11.10.0)', () => at('analysis/STRIDE-2026-03-02.md',
    STRIDE_FULL.replace('| Elevation of Privilege |', '| Elevación de privilegios |'), () => {
      const g = lensModel(ROOT, 'stride', null, 'matrix').groups[0];
      expect(g.rows.map((r: any) => [r.cat, r.pass])).toEqual([['S', true], ['T', true], ['D', false], ['E', true]]);
    }));

  test('a STRIDE boundary: its zones, what guards it, what crosses it, its categories and the mitigation the report recommends (11.10.0)', () => at('analysis/STRIDE-2026-03-02.md', STRIDE_FULL, () => {
    const m = lensModel(ROOT, 'stride', 'TB-01');
    expect(m).toMatchObject({ kind: 'boundary', id: 'TB-01', from: 'Internet', to: 'DMZ', auth: 'OAuth2 JWT, mTLS', data: 'Order PII', fix: { 'T1-D': 'Rate limit per client' } });
    expect(m.rows).toHaveLength(4);
    const svg = lensSvg(m, info, { embed: false });
    for (const s of ['STRIDE threats — TB-01', 'Internet', 'DMZ', 'OAuth2 JWT, mTLS', 'Order PII', 'T1-D · High', '→ Rate limit per client', 'Repudiation', '1 open finding']) expect(svg).toContain(s);
    expect(() => lensModel(ROOT, 'stride', 'TB-09')).toThrow(/TB-09 is not in .* boundaries: TB-01/);
  }));

  test('one finding on any lens: its row, severity, residual and where it sits — a heat-map cell or a boundary (11.10.0)', () => {
    put('analysis/SPOF-2026-03-02.md', '# SPOF\n### 2.1 Critical SPOFs — Full Outage <!-- SECTION: Critical SPOFs -->\n| # | Component | Failure Scenario | Impact | Current Mitigation |\n|---|---|---|---|---|\n| C1 | `Order DB` | Primary lost | All orders | Nightly backup |\n| C2 | `Hub API` | Down | Payments | None |\n\n' + HEAT);
    put('analysis/STRIDE-2026-03-02.md', STRIDE_FULL);
    try {
      const c = lensModel(ROOT, 'spof', 'c1');
      expect(c).toMatchObject({ kind: 'finding', id: 'C1', severity: 'critical', label: 'Order DB', at: { y: 'HIGH', x: 'MID', ylabel: 'IMPACT', xlabel: 'LIKELIHOOD' } });
      expect(c.fields).toContainEqual(['Failure Scenario', 'Primary lost']);
      const svg = lensSvg(c, info, { embed: false });
      for (const s of ['Single points of failure — C1', 'C1 · Critical', 'heat map cell: IMPACT HIGH · LIKELIHOOD MID', 'Primary lost']) expect(svg).toContain(s);
      const t = lensModel(ROOT, 'stride', 'T1-D');
      expect(t).toMatchObject({ kind: 'finding', id: 'T1-D', severity: 'high', at: { boundary: 'TB-01 — Web App → API Gateway (I-01)' } });
      expect(lensModel(ROOT, 'spof', 'Order DB').kind).toBe('heatmap');    // a component keeps the lens's figure, centred on it
    } finally { rmSync(join(ROOT, 'analysis', 'SPOF-2026-03-02.md')); rmSync(join(ROOT, 'analysis', 'STRIDE-2026-03-02.md')); }
  });

  test('a focus the report does not name is an error listing what it does, never a dimmed figure (11.10.0)', () => at('analysis/BOTTLENECK-2026-03-02.md',
    '# B\n### 2.3 Capacity Headroom Summary <!-- SECTION: Capacity Headroom Summary -->\n\n| # | Component | Current Load (est.) | Max Capacity | Headroom % | Risk Level |\n|---|---|---|---|---|---|\n| 1 | `Order Service` | 300 rps | 400 rps | 25% | B2 |\n', () => {
      expect(() => lensModel(ROOT, 'bottleneck', 'Ledger')).toThrow(/Ledger is not in analysis\/BOTTLENECK-2026-03-02.md — findings: .* components: Order Service/);
    }));

  test('a blast radius focus by id reads the id as the cell\'s first token — the ⚡ marker follows it (11.10.0)', () => at('analysis/BLAST-RADIUS-2026-03-02.md', BLAST.replace('| B2 |', '| B2 ⚡ SPOF+Blast |'), () => {
    expect(lensModel(ROOT, 'blast-radius', 'B2')).toMatchObject({ found: true, row: { id: 'B2', name: 'Order Service' } });
  }));

  test('a blast radius focus outside the high-blast components says so (11.10.0)', () => at('analysis/BLAST-RADIUS-2026-03-02.md', BLAST, () => {
    expect(lensSvg(lensModel(ROOT, 'blast-radius', 'Web App'), info, { embed: false })).toContain('Web App is not a high-blast component in this run');
  }));

  test('the rule reaches every session: the CLAUDE.md block /setup writes names the script, the focus, the export scale — and keeps the chat\'s native drawing apart from the Alia export (11.10.0)', () => {
    const block = readFileSync(join(SCRIPTS, '..', '..', '..', '..', '..', 'scripts', 'setup-claude-md.ts'), 'utf8');
    for (const s of ['analysis-chart.js', '--focus', 'TB-nn', '--scale', 'never improvised', '--json', "chat's own look", 'Alia Guide look']) expect(block).toContain(s);
  });
});
