// The logical scene generated from the documents — every rule of `scene-from-docs.js` against a
// small project: systems and containers from the descriptors, layers from docs/03, edges from
// docs/05 and the Communication tables, phases walked over the edge graph, use cases from docs/04,
// the base scene carried over, the overrides applied last, and the report on stderr.
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, '..', 'scripts', 'scene-from-docs.js');
const RENDER = join(import.meta.dir, '..', 'scripts', 'render.js');
let root = '';

import { FILES, container } from './order-desk.fixture';

const run = (args: string[], env?: Record<string, string | undefined>) => {
  const r = Bun.spawnSync(['bun', SCRIPT, root, ...args], { stdout: 'pipe', stderr: 'pipe', env: env || process.env });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};
const generate = (args: string[] = []) => { const r = run(['--json', ...args]); expect(r.code).toBe(0); const scene = JSON.parse(r.out); if (process.env.DEBUG_SCENE) console.log(JSON.stringify(scene.nodes.map((n: any) => [n.id, n.name])), JSON.stringify(scene.edges), JSON.stringify(scene.phases), r.err); return { scene, err: r.err }; };
const byName = (scene: any, name: string) => scene.nodes.find((n: any) => n.name === name);
const edge = (scene: any, a: string, b: string) => { const A = byName(scene, a).id, B = byName(scene, b).id; return scene.edges.find((e: any) => (e.a === A && e.b === B) || (e.a === B && e.b === A)); };
const hops = (scene: any, seq: [string, string][]) => seq.map(([a, b]) => [byName(scene, a).id, byName(scene, b).id]);

// Every name, plural and description pair the scene needs goes to the judge, and an unanswered one is undecided (8.119.0).
// The tests answer through a fake TypeSafe API run in its own process — `run` is spawnSync, which would block a server
// served from this one. The oracle answers a synthetic fixture: a cell names the one option it contains or prefixes
// (else `none`), a plural covers every candidate, no cell names a second endpoint, and two names joined by "and" / "y" /
// "or" / "o" act in parallel, otherwise in sequence.
const ORACLE = `
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const singular = (k) => k.split(' ').map((w) => w.replace(/(?<=[a-z]{3})s$/, '')).join(' ');
const pick = (cell, opts) => { const k = norm(String(cell).replace(/\\([^)]*\\)/g, '')); for (const key of [k, singular(k)]) {
  const starts = opts.filter((o) => norm(o).startsWith(key)); if (starts.length === 1) return starts[0];
  const has = opts.filter((o) => norm(o).includes(key) || key.includes(norm(o))); if (has.length === 1) return has[0]; if (has.length) return 'none'; } return 'none'; };
const server = Bun.serve({ port: 0, fetch: async (req) => {
  const body = await req.json(); const answers = {};
  for (const [id, q] of Object.entries(body.questions)) { const st = body.state.items[id];
    if (q.type === 'noul') answers[id] = { type: 'noul', noul: /^Besides/.test(q.instructions.question) ? 0.05 : 0.95 };
    else if (q.criteria.parallel) { const d = norm(st.description), a = norm(st.first), b = norm(st.second), i = d.indexOf(a) + a.length, j = d.indexOf(b, i);
      answers[id] = { type: 'choice', choice: /^(y|and|o|or|)$/.test(d.slice(i, j).trim()) ? 'parallel' : 'sequence', probabilities: {}, confidence: 0.95 }; }
    else answers[id] = { type: 'choice', choice: pick(st.cell, Object.keys(q.criteria).filter((k) => k !== 'none')), probabilities: {}, confidence: 0.95 };
  }
  return Response.json({ model: 'oracle', answers, usage: { input_tokens: 1, output_tokens: 1 } });
} });
console.log(server.port);
`;
let oracle: any = null; const ORACLE_KEYS = ['SA_JUDGE', 'TYPESAFE_API_KEY', 'TYPESAFE_ENDPOINT'];
const NO_JUDGE = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !ORACLE_KEYS.includes(k)));   // the default engine, agent, with nobody answering
beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'scene-from-docs-'));
  for (const [rel, body] of Object.entries(FILES)) { mkdirSync(join(root, rel, '..'), { recursive: true }); writeFileSync(join(root, rel), body); }
  const script = join(root, '..', `oracle-${process.pid}.ts`); writeFileSync(script, ORACLE);
  oracle = Bun.spawn(['bun', script], { stdout: 'pipe', stderr: 'inherit' });
  const reader = oracle.stdout.getReader(); const { value } = await reader.read(); reader.releaseLock();
  const port = String(new TextDecoder().decode(value)).trim();
  Object.assign(process.env, { SA_JUDGE: 'typesafe', TYPESAFE_API_KEY: 'k', TYPESAFE_ENDPOINT: `http://127.0.0.1:${port}/` });   // run() and build-example.ts inherit it
});
afterAll(() => { if (oracle) oracle.kill(); ORACLE_KEYS.forEach((k) => delete process.env[k]); rmSync(root, { recursive: true, force: true }); rmSync(join(root, '..', `oracle-${process.pid}.ts`), { force: true }); });

describe('scene-from-docs', () => {
  test('the scene validates in render.js and carries the ARCHITECTURE.md markers', () => {
    const out = join(root, 'gen.scene.json');
    const r = run(['--out', out]);
    expect(r.code).toBe(0);
    const scene = JSON.parse(readFileSync(out, 'utf8'));
    expect(scene.project).toBe('Order Desk');
    expect(scene.version).toBe('1.2.0');
    expect(scene.status).toBe('Released');
    expect(scene.architectureType).toBe('Microservices');
    expect(scene.language).toBe('en');
    const render = Bun.spawnSync(['bun', RENDER, out, join(root, 'gen.html')], { stdout: 'pipe', stderr: 'pipe' });
    expect({ code: render.exitCode, err: render.stderr.toString() }).toEqual({ code: 0, err: render.stderr.toString() });
    expect(render.stderr.toString()).not.toMatch(/error|invalid/i);
  });

  test('systems, containers, kinds, layers and the boundary come from the descriptors and docs/03', () => {
    const { scene } = generate();
    expect(scene.systems.map((s: any) => [s.id, s.owned])).toEqual([['order-desk', true], ['fraud-screen', false], ['payments-hub', false]]);
    expect(scene.layers.map((l: any) => [l.n, l.name, l.owned])).toEqual([[1, 'Channel', true], [2, 'Edge', true], [3, 'Services', true], [4, 'Data', true], [5, 'Partners', false]]);
    const kinds = Object.fromEntries(scene.nodes.map((n: any) => [n.name, [n.kind, n.layer, n.system]]));
    expect(kinds['Web App']).toEqual(['app', 1, 'order-desk']);
    expect(kinds['API Gateway']).toEqual(['gateway', 2, 'order-desk']);
    expect(kinds['Order Service']).toEqual(['service', 3, 'order-desk']);
    expect(kinds['Outbox Relay']).toEqual(['worker', 3, 'order-desk']);
    expect(kinds['Order DB']).toEqual(['store', 4, 'order-desk']);
    expect(kinds['Hub API']).toEqual(['gateway', 5, 'payments-hub']);     // from the external descriptor's Containers table
    expect(kinds['Hub Ledger']).toEqual(['store', 5, 'payments-hub']);
    expect(kinds['Fraud Screen']).toEqual(['service', 5, 'fraud-screen']); // an external system with no Containers table is one node
    expect(kinds['Device Guard']).toEqual(['actor', 1, 'actor']);         // a docs/05 endpoint that is no container; the layer of its neighbour
    const web = byName(scene, 'Web App');
    expect(web.internal).toBe('CHL0001');
    expect(web.tech).toBe('React');
    expect(web.adrs).toEqual(['ADR-101']);
    expect(web.note).toBe('Web App does one thing. It does it for the desk.');
    expect(byName(scene, 'Hub API').tech).toBe('Azure APIM');
  });

  test('edges: docs/05 rows (label = protocol · id, compound targets, via, an actor endpoint, retired rows skipped) and Communication rows resolved through their Description', () => {
    const { scene, err } = generate();
    expect(edge(scene, 'Web App', 'API Gateway').label).toBe('HTTPS/JSON · I-01');
    expect(edge(scene, 'Order Service', 'Hub API').label).toBe('HTTPS/JSON · I-03');       // "(Payments Hub)" stripped
    expect(edge(scene, 'Web App', 'Device Guard').label).toBe('Embedded SDK · I-05');
    expect(edge(scene, 'API Gateway', 'Fraud Screen').label).toBe('HTTPS · I-06');          // "A and B, via C": C → A and C → B
    expect(edge(scene, 'API Gateway', 'Fraud Screen').jump).toBe(true);                     // L2 → L5
    expect(edge(scene, 'Web App', 'Hub Ledger')).toBeUndefined();                          // ~~I-07~~ is retired
    // Communication rows of the external descriptor
    expect(edge(scene, 'Hub API', 'Hub Ledger').label).toBe('JDBC');                        // same-system row: the two containers the Description names
    expect(edge(scene, 'Hub API', 'Outbox Relay').label).toBe('Kafka');                     // "A and B" on the target side are parallel targets
    expect(edge(scene, 'Hub API', 'Order Service').label).toBe('HTTPS/JSON · I-03');       // the pair already had a docs/05 row: that label stays
    expect(edge(scene, 'Outbox Relay', 'Order DB')).toBeDefined();                          // "..., which store them in `Order DB`" is the next hop of the chain
    expect(edge(scene, 'Order Service', 'Order DB').label).toBe('JDBC · I-04');             // docs/05 named it first; the chain does not relabel it
    expect(err).toMatch(/payments-hub\.md Communication: "Payments Hub" → "Order Desk" — source is a system/); // the SFTP row names no container
    expect(err).not.toMatch(/\(I-03\)/);                                                    // the row citing I-03 is docs/05's, silently
  });

  test('phases walk the edge graph: hops, a system entered and walked, a store that fans out, a relay inserted, a plural that branches, a synthesized hop reported', () => {
    const { scene, err } = generate();
    const p = scene.phases;
    expect(p['1'].path).toEqual(hops(scene, [['Device Guard', 'Web App']]));
    expect(p['1'].kind).toBe('local');
    expect(p['2'].path).toEqual(hops(scene, [['Web App', 'API Gateway'], ['API Gateway', 'Order Service'], ['Order Service', 'Order DB']]));
    expect(p['2'].budget).toBe('≤ 800 ms');
    expect(p['2'].kind).toBe('online');
    expect(p['3'].path).toEqual(hops(scene, [['Order Service', 'Hub API'], ['Hub API', 'Hub Ledger']]));   // the system is entered through I-03 and walked to its last container
    expect(p['3'].budget).toBe('≤ 1.5 s');
    expect(p['3'].kind).toBe('control');                                                        // inferred from the phase name (authorization)
    expect(p['4'].path).toEqual(hops(scene, [['Hub API', 'Outbox Relay'], ['Hub API', 'Order Service'], ['Outbox Relay', 'Order DB']]));
    expect(p['4'].extra).toEqual(hops(scene, [['Order Service', 'Order DB']]));               // the second of "A and B" continues as a branch
    expect(p['4'].kind).toBe('async');
    expect(p['5'].path).toEqual(hops(scene, [['Order DB', 'Hub Ledger']]));
    expect(p['5'].kind).toBe('batch');
    expect(edge(scene, 'Order DB', 'Hub Ledger').dashed).toBe(true);
    expect(err).toMatch(/synthesized[^\n]*Order DB → Hub Ledger \(phase 5\)/);
    expect(p['6'].path).toEqual(hops(scene, [['Order Service', 'Order DB'], ['Order Service', 'Hub API']]));  // a store does not initiate: the hop fans out from the service
    expect(p['7'].path).toEqual(hops(scene, [['Web App', 'API Gateway'], ['API Gateway', 'Order Service']]));  // the one documented relay is inserted
    expect(p['8'].path).toEqual(hops(scene, [['Hub API', 'Hub Ledger']]));                     // "Hub Ledgers" → Hub Ledger
    expect(err).toMatch(/kinds inferred[^\n]*1 Device check → local/);
    expect(scene.routes.map((r: any) => r.id)).toEqual(['local', 'online', 'async', 'control', 'batch']);
    expect(edge(scene, 'Web App', 'API Gateway').routes).toEqual(['online']);
  });

  test('use cases come from the Flow Inventory and the flow blocks; a flow without a block is reported and skipped', () => {
    const { scene, err } = generate();
    expect(scene.useCases.map((u: any) => [u.id, u.code, u.phases, u.target])).toEqual([
      ['UC-01', '1', [1, 2, 3], '≤ 2 s end to end'],
      ['FLOW-2', '2', [4, 2], '≤ 30 s end to end'],      // two use cases share the flow: the flow keeps its own id
    ]);
    expect(scene.useCases[0].adrs).toEqual(['ADR-101', 'ADR-102']);
    expect(scene.useCases[0].desc).toBe('Payment moves to the hub.');
    expect(err).toMatch(/flow 3 "Orphan": no \*\*Phases\*\* line/);
    expect(scene.allDescription).toBe('5 containers on the documented layers, 2 external system(s) and 2 use case(s). Pick a use case or a route to follow the data.');
  });

  test('--base keeps node ids for the same names, carries positions, thesis, deployment and phase kinds, and flags a deployment instance of an unknown container', () => {
    const base = join(root, 'base.scene.json');
    writeFileSync(base, JSON.stringify({
      thesis: 'The thesis stays.', theme: 'atlas',
      nodes: [{ id: 'web', name: 'Web App', x: 3, z: -1, code: 'CHL0001 · BIAN Current Account · 36217' }, { id: 'db', name: 'Order DB', code: 'pg-orders-db-main' }, { id: 'hub', name: 'Hub API', code: 'BIAN Payment Order Initiation · 42933' }],
      routes: [{ id: 'online', color: 'online', budget: '≤ 2 s' }],
      phases: { 2: { kind: 'control' } },
      deployment: { tiers: [], nodes: [], instances: [{ container: 'web' }, { container: 'ghost' }], paths: [] },
    }));
    const { scene, err } = generate(['--base', base]);
    expect(byName(scene, 'Web App').id).toBe('web');
    expect(byName(scene, 'Order DB').id).toBe('db');
    expect([byName(scene, 'Web App').x, byName(scene, 'Web App').z]).toEqual([3, -1]);
    expect(scene.thesis).toBe('The thesis stays.');
    expect(scene.theme).toBe('atlas');
    expect(scene.deployment.instances.length).toBe(2);
    expect(scene.phases['2'].kind).toBe('control');
    expect(scene.routes.find((r: any) => r.id === 'online').budget).toBe('≤ 2 s');
    expect(err).not.toMatch(/2 Submit order → /);
    expect(err).toMatch(/base deployment places "ghost"/);
    // a base code carries its BIAN eyebrow only: an identifier equal to the derived internal is dropped silently, an undeclared one is dropped and reported
    expect(byName(scene, 'Web App').code).toBe('BIAN Current Account · 36217');
    expect(byName(scene, 'Order DB').code).toBeUndefined();
    expect(byName(scene, 'Hub API').code).toBe('BIAN Payment Order Initiation · 42933');
    expect(err).toMatch(/Identifiers moved out of the base scene's code \(1\): Web App: `CHL0001` \(now `internal`/);
    expect(err).toMatch(/node "Order DB": the base scene's code carried the identifier `pg-orders-db-main` that no descriptor declares — dropped/);
  });

  test('render.js rejects a code that carries an internal identifier', () => {
    const bad = join(root, 'bad.scene.json');
    const r0 = run(['--json']); const scene = JSON.parse(r0.out); byName(scene, 'Web App').code = 'Kong-CAS · BIAN Cross Channel · 146482';
    writeFileSync(bad, JSON.stringify(scene));
    const r = Bun.spawnSync(['bun', RENDER, bad, join(root, 'bad.html')], { stdout: 'pipe', stderr: 'pipe' });
    expect(r.exitCode).toBe(2);
    expect(r.stderr.toString()).toMatch(/node "web-app": code carries an internal identifier \(`Kong-CAS`\) — it belongs in `internal`/);
  });

  test('--overrides is applied last: a node field, a new edge, a phase kind, the thesis', () => {
    const ov = join(root, 'overrides.json');
    writeFileSync(ov, JSON.stringify({
      thesis: 'Override thesis.',
      nodes: { 'Order DB': { code: 'DB1' }, nobody: { code: 'X' } },
      edges: [{ a: 'web-app', b: 'order-db', label: 'local cache' }, { a: 'web-app', b: 'nowhere' }],
      phases: { 5: { kind: 'control' } },
      deployment: { tiers: [{ n: 1, name: 'Edge' }], nodes: [{ id: 'cdn', name: 'CDN', kind: 'managed', tier: 1 }], instances: [] },
      deploymentNodes: { CDN: { metered: { by: 'bytes', direction: 'out' } }, ghost: { metered: { by: 'bytes' } } },
      capacity: { pricing: { cdn: { perGB: 0.08, currency: 'USD', source: 'assumption' } } },
    }));
    const { scene, err } = generate(['--overrides', ov]);
    expect(scene.deployment.nodes[0].metered).toEqual({ by: 'bytes', direction: 'out' });   // a deployment node's field by name, the array kept (8.54.0)
    expect(scene.capacity.pricing.cdn.perGB).toBe(0.08);
    expect(err).toMatch(/overrides\.deploymentNodes\["ghost"\] names no deployment node/);
    expect(scene.thesis).toBe('Override thesis.');
    expect(byName(scene, 'Order DB').code).toBe('DB1');
    expect(edge(scene, 'Web App', 'Order DB')).toEqual({ a: 'web-app', b: 'order-db', label: 'local cache', routes: ['neutral'] });
    expect(scene.phases['5'].kind).toBe('control');
    expect(err).toMatch(/overrides\.nodes\["nobody"\] names no node/);
    expect(err).toMatch(/overrides\.edges web-app → nowhere names an unknown node/);
  });
});

describe('capacity block (8.33.0)', () => {
  test('demand from docs/08, capacity from the descriptors normalized to rps, a gap per missing number, --capacity-check prints the table', () => {
    writeFileSync(join(root, 'docs', '08-scalability-and-performance.md'), `# Scalability\n\n### Demand by Use Case <!-- LABEL: Demand by Use Case -->\n\n| Use Case | Value | Unit | Peak factor | Source |\n|---|---|---|---|---|\n| UC-01 | 120 | rpm | 4 | measured |\n| UC-04 | Not documented | rps | | |\n| UC-01 · F2 | 30 | rps | | phase 2 in its own unit |\n| UC-01 / fase 7 | 1 | rps | | a phase the flow does not declare |\n`);
    writeFileSync(join(root, 'docs/components/order-desk/03-order-service.md'), container('Order Service', 'order-service', 'api-service', 'API Service', 'Spring Boot') + `\n## Capacity <!-- LABEL: Capacity -->\n\n| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | 300 | tps | load test |\n| replicas | 3 | count | HPA min |\n| max_replicas | 9 | count | HPA max |\n| requests_per_transaction | 2 | ratio | |\n`);
    const { scene } = generate();
    expect(scene.capacity.unit).toBe('rps'); expect(scene.capacity.threshold).toBe(0.7);
    expect(scene.capacity.demand).toEqual([{ useCase: 'UC-01', rps: 2, sessions: null, peakFactor: 4, source: 'measured' }, { useCase: 'UC-04', rps: null, sessions: null, peakFactor: 1, notDocumented: true }, { useCase: 'UC-01', phase: '2', rps: 30, sessions: null, peakFactor: 1, source: 'phase 2 in its own unit' }, { useCase: 'UC-01', phase: '7', rps: 1, sessions: null, peakFactor: 1, source: 'a phase the flow does not declare' }]);
    const svc = scene.capacity.instances.find((i: any) => i.container === byName(scene, 'Order Service').id);
    expect(svc).toMatchObject({ replicas: 3, maxReplicas: 9, capacityPerReplica: 600, requestsPerTransaction: 2, flags: [] });
    const web = scene.capacity.instances.find((i: any) => i.container === byName(scene, 'Web App').id);
    expect(web).toMatchObject({ replicas: null, capacityPerReplica: null });
    expect(scene.capacity.gaps).toEqual(expect.arrayContaining([{ container: web.container, field: 'capacity', says: 'no Capacity table in the descriptor' }, { useCase: 'UC-04', field: 'demand', says: 'Not documented' }]));
    const r = run(['--json', '--capacity-check']);
    expect(r.err).toMatch(/Capacity \(rps\)/); expect(r.err).toMatch(/gaps \(\d+\)/); expect(r.err).toMatch(/capacity: 1\/\d+ containers sized, 4 demand rows/); expect(r.err).toMatch(/demand-phase-unknown: UC-01 · F7 at line \d+ — phase 7 is not one UC-01 declares \(1, 2, 3\)/); expect(r.err).toMatch(/UC-01 · F2 30 rps ×1/);
  });
});

describe('capacity.scenarios (8.35.0)', () => {
  test('scenarios ride in overrides.capacity.scenarios and reach the scene untouched; instances and demand stay derived', () => {
    const ov = join(root, 'ov-scen.json');
    writeFileSync(ov, JSON.stringify({ capacity: { scenarios: [{ name: 'Prueba', scale: 3, demand: { 'UC-01': 40 }, down: [], overrides: { 'order-service': { capacityPerReplica: 900 } }, source: 'assumption for the test' }] } }));
    const { scene, err } = generate(['--overrides', ov]);
    expect(scene.capacity.scenarios).toEqual([{ name: 'Prueba', scale: 3, demand: { 'UC-01': 40 }, down: [], overrides: { 'order-service': { capacityPerReplica: 900 } }, source: 'assumption for the test' }]);
    expect(scene.capacity.instances.length).toBeGreaterThan(3);                       // the derived list is not replaced by the overrides
    expect(scene.capacity.demand.length).toBe(4);   // the docs/08 written by the test above: two flow rows, two phase rows
    const bad = join(root, 'ov-bad.json'); writeFileSync(bad, JSON.stringify({ capacity: { scenarios: [{ name: 'X', overrides: { nope: { replicas: 1 } } }] } }));
    const r = run(['--overrides', bad, '--out', join(root, 'bad-scen.scene.json')]); expect(r.code).toBe(0);
    const rr = Bun.spawnSync(['bun', RENDER, join(root, 'bad-scen.scene.json'), join(root, 'bad-scen.html')], { stdout: 'pipe', stderr: 'pipe' });
    expect(rr.exitCode).toBe(2); expect(rr.stderr.toString()).toMatch(/capacity\.scenarios\[0\] "X" overrides "nope", which is no container/);
  });
});


describe('scene-from-docs names through the judge', () => {
  // A fake TypeSafe API: a misspelled container resolves to its component; an external product is `none`; the
  // Communication description's pairs read as the connector rule would; every "also" question is a no.
  test('a typo resolves instead of becoming an actor, an unknown product still does, and the review names what was judged', async () => {
    const seen: any[] = [];
    const server = Bun.serve({ port: 0, fetch: async (req) => {
      const body = (await req.json()) as { state: any; questions: Record<string, any> }; seen.push(body); const answers: any = {};
      for (const [id, q] of Object.entries(body.questions)) {
        const st = body.state.items[id];
        if (q.type === 'noul') answers[id] = { type: 'noul', noul: 0.05 };
        else if (q.criteria.parallel) answers[id] = { type: 'choice', choice: st.first === 'Outbox Relay' && st.second === 'Order Service' ? 'parallel' : 'sequence', probabilities: {}, confidence: 0.9 };
        else if (/servce/i.test(st.cell)) answers[id] = { type: 'choice', choice: 'Order Service', probabilities: {}, confidence: 0.92 };
        else { const contained = Object.keys(q.criteria).find((k) => k !== 'none' && st.cell.toLowerCase().includes(k.toLowerCase()));   // "Hub Ledgers" names Hub Ledger
          answers[id] = { type: 'choice', choice: contained || 'none', probabilities: {}, confidence: 0.95 }; }
      }
      return Response.json({ model: 'jev-test', answers, usage: { input_tokens: 1, output_tokens: 1 } });
    } });
    rmSync(join(root, '.cache'), { recursive: true, force: true });   // the oracle's answers are cached per item: this server must be asked
    const f05 = join(root, 'docs', '05-integration-points.md'); const original = readFileSync(f05, 'utf8');
    writeFileSync(f05, original + '| I-08 | `Web App` | Order Servce | HTTPS/JSON | Request-response | Internal |\n');
    try {
      const p = Bun.spawn(['bun', SCRIPT, root, '--json', '--out', join(root, 'judged.scene.json')], { stdout: 'pipe', stderr: 'pipe', env: { ...process.env, SA_JUDGE: 'typesafe', TYPESAFE_API_KEY: 'k', TYPESAFE_ENDPOINT: `http://127.0.0.1:${server.port}/` } });
      const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
      expect(code).toBe(0);
      const scene = JSON.parse(out);
      expect(byName(scene, 'Order Servce')).toBeUndefined();                                   // not an actor
      expect(edge(scene, 'Web App', 'Order Service').label).toBe('HTTPS/JSON · I-08');         // the typo's edge lands on the component
      expect(byName(scene, 'Device Guard').kind).toBe('actor');                                // `none` at high confidence keeps the actor path
      expect(edge(scene, 'Hub API', 'Outbox Relay')).toBeDefined(); expect(edge(scene, 'Outbox Relay', 'Order DB')).toBeDefined();   // the pairs read as before
      expect(err).toMatch(/Names: \d+ resolved by typesafe/);
      expect(byName(scene, 'Hub Ledgers')).toBeUndefined();                                    // the plural resolves to its container, as the rule did
      expect(err).toContain('docs/05 I-08 to "Order Servce" → `Order Service` (jev-test 0.92)');
      expect(seen.some((b) => Object.values(b.questions).some((q: any) => q.criteria && q.criteria.parallel))).toBe(true);   // the description pairs were asked
      expect(seen.every((b) => !Object.keys(b.state.items).some((id) => /Order Service$/.test(b.state.items[id].cell || '')))).toBe(true);   // an exact name never reaches the judge
    } finally { server.stop(true); writeFileSync(f05, original); }
  });
});

describe('scene-from-docs with nobody answering the judge (8.119.0)', () => {
  test('an unanswered name is no container and no actor, an unanswered plural covers nothing, an unanswered pair draws no inner edge — each reported as undecided', () => {
    const cache = join(root, '.cache', 'sa-skills', 'judge'); rmSync(cache, { recursive: true, force: true });
    const r = run(['--json'], NO_JUDGE());
    expect(r.code).toBe(0);
    const scene = JSON.parse(r.out);
    expect(byName(scene, 'Device Guard')).toBeUndefined();                                    // never an actor by the old rule
    expect(scene.nodes.some((n: any) => n.kind === 'actor')).toBe(false);
    expect(edge(scene, 'Web App', 'API Gateway').label).toBe('HTTPS/JSON · I-01');             // exact names are code's
    expect(edge(scene, 'Hub API', 'Hub Ledger')).toBeUndefined();                              // a same-system pair left undecided: no edge
    expect(r.err).toContain('phase 8 "Hub Ledgers" — no container, no actor');
    expect(r.err).toMatch(/Undecided \(\d+\) — the judge has not answered; answer the worksheets under .*\.cache\/sa-skills\/judge and re-run:/);
    expect(r.err).toContain('docs/05 I-05 to "Device Guard" — no container, no actor');
    expect(r.err).toMatch(/Communication "[^"]+" \/ "[^"]+" — parallel or sequence unanswered; no inner edge drawn/);
    expect(r.err).not.toMatch(/containment rule|heuristic/);
    rmSync(cache, { recursive: true, force: true });
  });
});

describe('the example scene (8.118.1) — synthetic, generated, never a real project', () => {
  test('examples/order-desk.scene.json is what build-example.ts yields, and renders in both views', () => {
    const r = Bun.spawnSync(['bun', join(import.meta.dir, '..', 'examples', 'build-example.ts'), '--check'], { env: process.env });   // the oracle answers its judge questions
    expect(r.stdout.toString() + r.stderr.toString()).toContain('✓');
    expect(r.exitCode).toBe(0);
  });
});

describe('delivery increments (8.141.0)', () => {
  test('each increment becomes a slice of scene node ids, with the new blocks, the temporary ones and what retires; render.js accepts it', () => {
    const o1 = join(root, 'docs/01-system-overview.md'), relay = join(root, 'docs/components/order-desk/05-outbox-relay.md');
    const keep = [o1, relay].map((f) => { try { return readFileSync(f, 'utf8'); } catch { return null; } });
    try {
      writeFileSync(o1, (keep[0] || '# System Overview\n') + '\n### Delivery Increments <!-- LABEL: Delivery Increments -->\n\n| Increment | Use Cases | Target |\n|---|---|---|\n| 1 | UC-01 | 2026-12 |\n| 2 | UC-02 | 2027-03 |\n');
      writeFileSync(relay, container('Outbox Relay', 'outbox-relay', 'worker-consumer', 'Worker/Consumer', 'Kafka Connect', '**Delivery Increments:** 1 · TDR-001\n'));
      mkdirSync(join(root, 'tdr'), { recursive: true }); writeFileSync(join(root, 'tdr/TDR-001-relay.md'), '---\nstatus: Planned\n---\n# TDR-001: Relay until the hub pushes\n');
      const { scene } = generate();
      const id = (n: string) => byName(scene, n).id;
      const [a, b] = scene.increments;
      expect(a).toMatchObject({ id: '1', target: '2026-12', useCases: ['UC-01'] });
      expect(a.nodes).toEqual(expect.arrayContaining([id('Web App'), id('API Gateway'), id('Order Service'), id('Order DB'), id('Outbox Relay')]));
      expect(a.temporary).toEqual([{ node: id('Outbox Relay'), until: '1', tdr: 'TDR-001' }]);
      expect(b.nodes).not.toContain(id('Outbox Relay'));
      expect(b.retired).toEqual(['Outbox Relay']);
      expect(b.cumulative).toEqual(['UC-01', 'UC-02']);
      const out = join(root, 'inc.scene.json'); writeFileSync(out, JSON.stringify(scene));
      const r = Bun.spawnSync(['bun', RENDER, out, join(root, 'inc.html')], { stdout: 'pipe', stderr: 'pipe' });
      expect(r.exitCode).toBe(0);
      expect(readFileSync(join(root, 'inc.html'), 'utf8')).toContain('"increments":[');
    } finally {
      if (keep[0] != null) writeFileSync(o1, keep[0]); else rmSync(o1, { force: true });
      if (keep[1] != null) writeFileSync(relay, keep[1]);
      rmSync(join(root, 'tdr'), { recursive: true, force: true });
    }
  });
  test('one scene per project: the current scene is rewritten in place, its base, and the dated pairs are retired (8.150.0)', () => {
    const viz = join(root, 'visualizations');
    mkdirSync(viz, { recursive: true });
    try {
      const old = generate().scene; old.thesis = 'Carried from the dated scene';
      writeFileSync(join(viz, 'architecture-command-center-2026-09-01.scene.json'), JSON.stringify(old));
      ['architecture-command-center-2026-09-01.html', 'architecture-3d-view-2026-08-01.scene.json', 'architecture-3d-view-2026-08-01.html', 'notes.html'].forEach((n) => writeFileSync(join(viz, n), n.endsWith('.json') ? '{}' : 'x'));
      const r = run([]); expect(r.code).toBe(0);
      expect(r.err).toMatch(/Base: visualizations\/architecture-command-center-2026-09-01\.scene\.json/);
      expect(r.err).toMatch(/Retired 4 dated file/);
      expect(readdirSync(viz).sort()).toEqual(['architecture-command-center.scene.json', 'notes.html']);
      const cur = JSON.parse(readFileSync(join(viz, 'architecture-command-center.scene.json'), 'utf8'));
      expect(cur.thesis).toBe('Carried from the dated scene');
      // the next run takes the current scene as base and writes the same file
      cur.thesis = 'Edited'; writeFileSync(join(viz, 'architecture-command-center.scene.json'), JSON.stringify(cur));
      const r2 = run([]); expect(r2.code).toBe(0); expect(r2.err).not.toMatch(/Retired/);
      expect(readdirSync(viz).sort()).toEqual(['architecture-command-center.scene.json', 'notes.html']);
      expect(JSON.parse(readFileSync(join(viz, 'architecture-command-center.scene.json'), 'utf8')).thesis).toBe('Edited');
      expect(run(['--no-base', '--json']).err).not.toMatch(/Base:/);
    } finally { rmSync(viz, { recursive: true, force: true }); }
  });
});
