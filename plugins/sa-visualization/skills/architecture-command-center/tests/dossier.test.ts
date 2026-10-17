// The findings extract of Alia's dossier — every finding-id form the analysis skill's specs
// prescribe (architecture-analysis/SKILL.md § Finding IDs) reaches the scene, inventories do not,
// and a finding listed twice is one finding.
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, '..', 'scripts', 'dossier.js');
let root = '';
let findings: any[] = [];
let dossier: any = {};

const REPORTS: Record<string, string> = {
  'SPOF-2026-01-01.md': `# SPOF
## 2. Findings
### 2.1 Critical SPOFs
| # | Component | Failure Scenario | Impact | Current Mitigation |
|---|---|---|---|---|
| **C1** | \`Transaction Cache\` | Bucket lost | 100% | None |
| C10 | Ingestion | Batch stops | 40% | None |
### 2.3 SPOF Operativos — Despliegue
| # | Componente | Escenario | Impacto |
|---|---|---|---|
| O1 | Azure DevOps | Pipeline caído | Sin despliegues |
`,
  'BLAST-RADIUS-2026-01-01.md': `# Blast Radius
## 2. Findings
### 2.1 High-Blast Components
| # | Component | Tier | Direct Consumers | Cascade Risk | Bulkhead Present |
|---|---|---|---|---|---|
| B1 ⚡ | \`Ingestion\` (SPOF C10) | **S2** | Transaction Cache | Cascading | No |
| B2 | Mobile App | S1 | — | Fail-closed | No |
### 2.2 Isolated Components
| Component | Type | Why Isolated |
|---|---|---|
| Reporting | Worker | Async queue |
`,
  'COUPLING-2026-01-01.md': `# Coupling
## 2. Coupling Metrics Table
| # | Component | Fan-in (Ca) | Fan-out (Ce) | Instability (I) | Classification | Source |
|---|---|---|---|---|---|---|
| 1 | Mobile App | 0 | 6 | 1.00 | K2 | docs/05 |
| 2 | Ingestion | 3 | 1 | 0.25 | — | docs/05 |
## 4. Volatile Leaves (K2)
| # | Component | Fan-out | Instability (I) | Dependencies (list) |
|---|---|---|---|---|
| K2-01 | Mobile App | 6 | 1.00 | Ingestion, Transaction Cache |
## 6. Cyclical Dependencies (K4)
| # | Cycle Path | Coupling Type | Source Citations |
|---|---|---|---|
| K4-01 | Mobile App → Ingestion → Mobile App | Synchronous call | docs/05 |
`,
  'STRIDE-2026-01-01.md': `# STRIDE
## 2. Trust Boundary Inventory
| ID | Name | From Zone | To Zone | Auth Mechanism | Data Classification | Source |
|---|---|---|---|---|---|---|
| TB-01 | Internet → Gateway | Internet | DMZ | OAuth2 | PII | docs/07 |
## 3. STRIDE Matrix
### TB-01 — Internet → Gateway
| # | Threat | Category | Severity | Status | Control / Gap |
|---|---|---|---|---|---|
| T1-S | Forged token reaches Ingestion | S Spoofing | High | ⚠️ Finding | No audience check |
| T1-I | I-01 declares no credential toward the gateway | I Info Disclosure | Medium | ⚠️ Finding | None |
| — | Payload altered | T Tampering | Low | ✅ Pass | TLS 1.3 |
### TB-02 — Mobile App ↔ Ingestion (I-01)
| # | Threat | Category | Severity | Status | Control / Gap |
|---|---|---|---|---|---|
| T2-T | A rooted device edits its own replica | T Tampering | Low | ⚠️ Finding | None declared |
## 4. High-Priority Threats
| # | Trust Boundary | STRIDE Category | Threat Description | Recommended Mitigation | ADR Reference |
|---|---|---|---|---|---|
| T1-S | TB-01 | Spoofing | Forged token reaches Ingestion | Validate aud | ADR-101 |
`,
  'TECH-DEBT-2026-01-01.md': `# Tech Debt
## 2. Technology Currency Table
| # | Tier | Technology | Documented Version | EOL Date | Runway (months) | Component(s) using it | Source | Validation |
|---|---|---|---|---|---|---|---|---|
| T1-01 | T1 | Node.js | 14 | 2023-04-30 | -32 | Ingestion | docs/06 | ✅ web-validated |
| T4-01 | T4 | PostgreSQL | 16 | 2028-11-09 | 34 | Transaction Cache | docs/06 | ✅ web-validated |
## 5. Architectural Debt
| # | ADR | Title | Status | Superseded By | Replacement Implemented? | Risk |
|---|---|---|---|---|---|---|
| AD-01 | ADR-013 | Redis removed | Superseded | ADR-020 | No | HIGH |
`,
  'BOTTLENECK-2026-01-01.md': `# Bottleneck
## 2. Findings
### 2.1 Top Chokepoints
| # | Tier | Component | Max RPS / Limit | Current HPA | Fan-in Count | Bottleneck Reason | ADR Reference |
|---|---|---|---|---|---|---|---|
| B1-01 | B1 | \`Transaction Cache\` | 760 TPS | stateful (no HPA) | 2 | Single source of every replica | ADR-103 |
| B2-01 | B2 | Ingestion | [NOT DOCUMENTED] | 10–30 | 1 | Only fallback path | ADR-113 |
### 2.4 Fan-in Convergence Points
| # | Component | Upstream Callers (count) | Backpressure Mechanism | Risk |
|---|---|---|---|---|
| B2-01 | Ingestion | 2 | None | High |
`,
  'LATENCY-BUDGET-2026-01-01.md': `# Latency
## 2. Per-Flow Budget Breakdown
| Hop # | Component | Role | p95 (ms) | % of SLO | Status |
|---|---|---|---|---|---|
| 1 | Gateway | gateway | 20 | 4% | Within Budget |
| TOTAL | — | — | 480 | 96% | PASS |
## 3. Hops Over Budget
| # | Flow | Hop # | Component | p95 (ms) | Proportional Share (ms) | Overage (ms) | Severity |
|---|---|---|---|---|---|---|---|
| OB-01 | Login | 3 | Ingestion | 300 | 125 | 175 | HIGH |
`,
};

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'sa-dossier-'));
  mkdirSync(join(root, 'docs'));
  mkdirSync(join(root, 'analysis'));
  writeFileSync(join(root, 'docs', '05-integration-points.md'), `# Integration Points
| ID | From | To | Protocol | Style |
|---|---|---|---|---|
| I-01 | Mobile App | Ingestion | HTTPS/JSON | Request-response |
| I-02 | Ingestion | Transaction Cache | SDK | Write |
`);
  writeFileSync(join(root, 'docs', '03-architecture-layers.md'), `# Capas de Arquitectura

<!-- EXPLORER_HEADER
key_concepts: capas, límite del sistema
technologies: Kafka, Couchbase
components: ingestion, mobile-app
scope: Distribución por capas
related_adrs: ADR-101, ADR-102
-->

> Cómo se reparten los contenedores sobre las capas. Segunda frase del resumen.

## 4. Capas de Arquitectura <!-- SECTION: Architecture Layers -->

El tipo de arquitectura es META.

### 4.1 Distribución por Capa

| Capa | Contenedores |
|---|---|
| L1 | Mobile App |

## Diagramas de Arquitectura <!-- SECTION: Architecture Diagrams -->
`);
  for (const [name, body] of Object.entries(REPORTS)) writeFileSync(join(root, 'analysis', name), body);
  mkdirSync(join(root, 'tdr'));
  writeFileSync(join(root, 'tdr', 'TDR-001-cache.md'), `---
status: Won't Fix   # the frontmatter key wins; the comment is not part of the value
date: 2026-09-15
affected-components:
  - transaction-cache
---

# TDR-001: The cache is not replicated

## Status

\`Open\`

## Description

The cache has one node.
`);
  writeFileSync(join(root, 'tdr', 'TDR-002-legacy.md'), `# TDR-002: No frontmatter

## Status

\`In Progress\` — capacity assigned.
`);
  const scene = {
    layers: [{ n: 1, name: 'Core', owned: true }],
    nodes: [
      { id: 'ingest', name: 'Ingestion', kind: 'container', layer: 1, system: 's' },
      { id: 'cache', name: 'Transaction Cache', kind: 'container', layer: 1, system: 's', adrs: ['ADR-013'] },
      { id: 'app', name: 'Mobile App', kind: 'container', layer: 1, system: 's' },
    ],
    edges: [{ a: 'app', b: 'ingest', routes: ['online'], label: 'HTTPS/JSON · I-01' }, { a: 'ingest', b: 'cache', routes: ['batch'], label: 'SDK · I-02' }],
    deployment: { tiers: [], nodes: [{ id: 'devops', name: 'Azure DevOps', tier: 't' }], instances: [], paths: [] },
  };
  writeFileSync(join(root, 'scene.json'), JSON.stringify(scene));
  const run = Bun.spawnSync(['bun', SCRIPT, root, join(root, 'scene.json')]);
  const out = run.stdout.toString();
  dossier = JSON.parse(out.slice(out.indexOf('{')));
  findings = dossier.findings;
});
afterAll(() => { if (root) rmSync(root, { recursive: true, force: true }); });

describe('tdrs', () => {
  test('status comes from the frontmatter key first, then the backticked word of ## Status', () => {
    expect(dossier.tdrs['TDR-001'].status).toBe("Won't Fix");
    expect(dossier.tdrs['TDR-001'].components).toEqual([{ slug: 'transaction-cache', node: 'cache' }]);
    expect(dossier.tdrs['TDR-002'].status).toBe('In Progress');
  });
});

const report = (lens: string) => findings.find((a) => a.analysis === lens);
const item = (lens: string, id: string) => report(lens).items.find((x: any) => x.id === id);

describe('dossier.js findings', () => {
  test('one entry per report, dated from the filename', () => {
    expect(findings.map((a) => a.analysis).sort()).toEqual(['BLAST-RADIUS', 'BOTTLENECK', 'COUPLING', 'LATENCY-BUDGET', 'SPOF', 'STRIDE', 'TECH-DEBT']);
    expect(report('SPOF').date).toBe('2026-01-01');
    expect(report('SPOF').file).toBe('analysis/SPOF-2026-01-01.md');
  });

  test('SPOF: C / D / O ids, bold stripped, severity from the prefix registry', () => {
    expect(report('SPOF').items.map((x: any) => x.id)).toEqual(['C1', 'C10', 'O1']);
    expect(item('SPOF', 'C1').severity).toBe('critical');
    expect(item('SPOF', 'C1').label).toBe('Transaction Cache');
    expect(item('SPOF', 'C1').nodes).toEqual(['cache']);
    expect(item('SPOF', 'O1').severity).toBe('low');
    expect(item('SPOF', 'O1').phys).toEqual(['devops']);
  });

  test('Blast Radius: the ⚡ marker after the id is kept under the # column, the Tier column sets severity', () => {
    const b1 = item('BLAST-RADIUS', 'B1');
    expect(b1.fields['#']).toBe('⚡');
    expect(b1.label).toBe('Ingestion (SPOF C10)');
    expect(b1.severity).toBe('high');          // S2
    expect(b1.nodes.sort()).toEqual(['cache', 'ingest']);
    expect(item('BLAST-RADIUS', 'B2').severity).toBe('critical');   // S1
    expect(report('BLAST-RADIUS').items).toHaveLength(2);           // the Isolated table has no # column
  });

  test('a finding that cites I-nn or writes X → Y resolves to the scene edge and the integration row', () => {
    const t = item('STRIDE', 'T1-I');
    expect(t.ints).toEqual(['I-01']);
    expect(t.edges).toEqual([['app', 'ingest']]);
    const k4 = item('COUPLING', 'K4-01');              // Mobile App → Ingestion → Mobile App
    expect(k4.edges).toEqual([['app', 'ingest']]);
    expect(k4.ints).toEqual(['I-01']);                 // read off the edge's label
    expect(item('SPOF', 'C1').edges).toBeUndefined();
  });

  test('Coupling: K2-01 / K4-01 are findings, the numbered metrics table is an inventory', () => {
    expect(report('COUPLING').items.map((x: any) => x.id)).toEqual(['K2-01', 'K4-01']);
    expect(item('COUPLING', 'K2-01').severity).toBe('medium');
    expect(item('COUPLING', 'K4-01').severity).toBe('high');
    expect(item('COUPLING', 'K4-01').nodes.sort()).toEqual(['app', 'ingest']);
  });

  test('STRIDE: TB-01 from an ID column, T1-S from the matrix, the High-Priority row merges into it', () => {
    expect(report('STRIDE').items.map((x: any) => x.id)).toEqual(['TB-01', 'T1-S', 'T1-I', 'T2-T']);
    expect(item('STRIDE', 'TB-01').severity).toBe('info');
    const t = item('STRIDE', 'T1-S');
    expect(t.severity).toBe('high');
    expect(t.label).toBe('Forged token reaches Ingestion');
    expect(t.fields['Control / Gap']).toBe('No audience check');
    expect(t.fields['Recommended Mitigation']).toBe('Validate aud');
    expect(t.nodes).toEqual(['ingest']);
  });

  test('a row that names nothing drawn lights its section (a trust boundary and its I-nn edge), or the containers its ADR governs', () => {
    const t = item('STRIDE', 'T2-T');
    expect(t.via).toBe('section');
    expect([...t.nodes].sort()).toEqual(['app', 'ingest']);
    expect(t.ints).toEqual(['I-01']);
    const ad = item('TECH-DEBT', 'AD-01');
    expect(ad.via).toBe('adr');
    expect(ad.nodes).toEqual(['cache']);
    expect(item('STRIDE', 'T1-S').via).toBeUndefined();          // a row that names its component keeps its own reading
  });

  test('Bottleneck: `# | Tier | Component` labels with the component, not the tier; the fan-in row merges', () => {
    expect(report('BOTTLENECK').items.map((x: any) => x.id)).toEqual(['B1-01', 'B2-01']);
    const b1 = item('BOTTLENECK', 'B1-01');
    expect(b1.label).toBe('Transaction Cache');
    expect(b1.severity).toBe('critical');
    expect(b1.nodes).toEqual(['cache']);
    const b2 = item('BOTTLENECK', 'B2-01');
    expect(b2.label).toBe('Ingestion');
    expect(b2.severity).toBe('high');
    expect(b2.fields['Backpressure Mechanism']).toBe('None');
  });

  test('Tech Debt: T1-01 / T4-01 tiered ids, AD-01 with the ADR in its own column, Risk column wins', () => {
    expect(report('TECH-DEBT').items.map((x: any) => x.id)).toEqual(['T1-01', 'T4-01', 'AD-01']);
    expect(item('TECH-DEBT', 'T1-01').label).toBe('Node.js');
    expect(item('TECH-DEBT', 'AD-01').label).toBe('Redis removed');
    expect(item('TECH-DEBT', 'T1-01').severity).toBe('critical');
    expect(item('TECH-DEBT', 'T4-01').severity).toBe('info');
    expect(item('TECH-DEBT', 'AD-01').severity).toBe('high');
    expect(item('TECH-DEBT', 'AD-01').fields['ADR']).toBe('ADR-013');
  });

  test('Latency Budget: the Hop # table and its TOTAL row are not findings, OB-01 is, labelled by its component', () => {
    expect(report('LATENCY-BUDGET').items.map((x: any) => x.id)).toEqual(['OB-01']);
    expect(item('LATENCY-BUDGET', 'OB-01').severity).toBe('high');
    expect(item('LATENCY-BUDGET', 'OB-01').label).toBe('Ingestion');
    expect(item('LATENCY-BUDGET', 'OB-01').fields['Flow']).toBe('Login');
  });
});

describe('sections — every docs/NN file as a page', () => {
  test('title, header fields with components resolved to scene nodes, summary and outline', () => {
    const s = dossier.sections.find((x: any) => x.id === '03-architecture-layers');
    expect(s.title).toBe('Capas de Arquitectura');
    expect(s.file).toBe('docs/03-architecture-layers.md');
    expect(s.scope).toBe('Distribución por capas');
    expect(s.concepts).toEqual(['capas', 'límite del sistema']);
    expect(s.adrs).toEqual(['ADR-101', 'ADR-102']);
    expect(s.nodes).toEqual(['ingest', 'app']);
    expect(s.summary).toBe('Cómo se reparten los contenedores sobre las capas. Segunda frase del resumen.');
    expect(s.outline.map((o: any) => [o.level, o.title, o.anchor])).toEqual([
      [2, '4. Capas de Arquitectura', 'Architecture Layers'], [3, '4.1 Distribución por Capa', undefined], [2, 'Diagramas de Arquitectura', 'Architecture Diagrams'],
    ]);
    expect(s.outline[0].summary).toBe('El tipo de arquitectura es META.');
    expect(s.bytes).toBeGreaterThan(300);
  });
  test('docs/05 is a section too; the integration inventory stays its own kind', () => {
    expect(dossier.sections.map((x: any) => x.id)).toEqual(['03-architecture-layers', '05-integration-points']);
    expect(dossier.integrations.length).toBe(2);
  });
});
