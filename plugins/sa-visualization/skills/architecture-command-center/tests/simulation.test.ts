/**
 * simulation.js — the load model behind the Simulation mode (8.34.0): demand walks the phases onto the receiving
 * containers, splits over live instances, ρ = λ ÷ (replicas × capacity); chokepoint / at-limit / scale-out limit /
 * not-documented findings; a downed instance moves its load; compare and proposeRows are data, never writes.
 */
import { describe, expect, test } from "bun:test";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const S = require("../scripts/simulation.js");

const scene = {
  nodes: [{ id: "app", name: "App", kind: "app" }, { id: "gw", name: "Gateway", kind: "gateway" }, { id: "svc", name: "Service", kind: "service" }, { id: "db", name: "DB", kind: "store" }, { id: "sgw", name: "Sync", kind: "service" }, { id: "guard", name: "Guard", kind: "actor" }],
  phases: { 1: { name: "check", budget: "≤ 200 ms", path: [["app", "guard"]] }, 2: { name: "read", budget: "≤ 1 s", path: [["app", "gw"], ["gw", "svc"], ["svc", "db"]] }, 3: { name: "sync", budget: "≤ 60 s", path: [["app", "sgw"]], extra: [["sgw", "db"]] } },
  useCases: [{ id: "UC-01", name: "Read", target: "≤ 1 s", phases: [1, 2] }, { id: "UC-02", name: "Sync", target: "≤ 60 s", phases: [3, 3] }, { id: "UC-03", name: "Orphan", target: "", phases: [2] }],   // UC-02 crosses the sync hop twice: a session is held once
  deployment: { tiers: [{ n: 1, name: "T1" }], nodes: [{ id: "aks", name: "AKS", tier: 1 }, { id: "z1", name: "Zone 1", tier: 1 }, { id: "z2", name: "Zone 2", tier: 1 }],
    instances: [{ container: "app", node: "aks" }, { container: "gw", node: "aks" }, { container: "svc", node: "aks" }, { container: "db", node: "z1" }, { container: "sgw", node: "z1" }, { container: "sgw", node: "z2" }] },
  capacity: { unit: "rps", threshold: 0.7,
    demand: [{ useCase: "UC-01", rps: 100, sessions: null, peakFactor: 3 }, { useCase: "UC-02", rps: null, sessions: 8000, peakFactor: 1 }],
    instances: [{ container: "gw", replicas: 2, maxReplicas: 4, capacityPerReplica: 60 }, { container: "svc", replicas: 4, maxReplicas: 10, capacityPerReplica: 50 }, { container: "db", replicas: 1, maxReplicas: 1, capacityPerReplica: null }, { container: "sgw", replicas: 1, maxReplicas: 1, capacityPerReplicaSessions: 5000 }, { container: "app", replicas: null, capacityPerReplica: null }] },
};

describe("simulation model", () => {
  test("buildModel: containers, hops without actors, instances by id, a container without an instance gets a virtual one", () => {
    const m = S.buildModel(scene);
    expect(m.containers).toEqual(["app", "gw", "svc", "db", "sgw"]);
    expect(m.phases["1"].hops).toEqual([]);                                     // the guard is an actor — no load lands on it
    expect(m.instances.map((i: any) => i.id)).toEqual(["app@aks", "gw@aks", "svc@aks", "db@z1", "sgw@z1", "sgw@z2"]);
    expect(m.demand["UC-02"].sessions).toBe(8000); expect(m.threshold).toBe(0.7);
  });
  test("base run: demand lands on the receivers, ρ per instance, findings ordered crit → warn → grey, a demand gap per use case without a row", () => {
    const R = S.run(S.buildModel(scene), S.emptyScenario("base"));
    const by = Object.fromEntries(R.instances.map((i: any) => [i.id, i]));
    expect(by["gw@aks"]).toMatchObject({ lambda: 100, rho: 0.833, status: "warn" });        // 100 / (2 × 60)
    expect(by["svc@aks"]).toMatchObject({ lambda: 100, rho: 0.5, status: "ok" });
    expect(by["db@z1"]).toMatchObject({ lambda: 100, sessions: 8000, status: "grey", rho: null });   // read rps + every sync session (one instance), capacity not documented
    expect(by["sgw@z1"]).toMatchObject({ sessions: 4000, rho: 0.8, status: "warn", gauge: "sessions" });
    expect(by["app@aks"].status).toBe("idle");                                                       // nothing lands on the app; nobody sized it
    expect(by["app@aks"]).toMatchObject({ out: 100, outSessions: 8000 });                              // but it sends: the read requests and the sync sessions
    expect(by["gw@aks"]).toMatchObject({ out: 100 }); expect(by["db@z1"]).toMatchObject({ out: 0, outSessions: 0 });
    expect(R.findings.map((f: any) => [f.kind, f.container || f.useCase || f.containers])).toEqual([["at-limit", "gw"], ["at-limit", "sgw"], ["not-documented", "db"], ["demand-gap", "UC-03"], ["bytes-pending", ["gw", "svc", "db", "sgw"]]]);   // nobody states a size: every receiver's bytes are pending
    const gw = R.findings[0]; expect(gw).toMatchObject({ rho: 0.833, load: 100, needed: 3, max: 4, scaleLimit: false, rhoAfter: 0.556 });
    expect(R.findings[2]).toMatchObject({ lambda: 100, sessions: 8000, missing: ["capacity_per_replica"] });
    expect(R.summary).toMatchObject({ sized: 4, placed: 6, chokepoints: 0, atLimit: 2, grey: 1, demandGaps: 1, down: 0 });
    expect(R.latency.find((l: any) => l.useCase === "UC-01").worst).toMatchObject({ phase: "2", worstRho: 0.833, at: "gw", factor: 5.988 });
  });
  test("scale ×3: the gateway chokes and cannot scale out enough — a balancing candidate; latency saturates", () => {
    const R = S.run(S.buildModel(scene), { scale: 3 });
    const gw = R.findings.find((f: any) => f.container === "gw");
    expect(gw).toMatchObject({ kind: "chokepoint", severity: "crit", rho: 2.5, needed: 8, max: 4, scaleLimit: true });
    expect(R.latency.find((l: any) => l.useCase === "UC-01").saturated).toBe(true);
    expect(R.useCases.find((u: any) => u.id === "UC-01").value).toBe(300);
  });
  test("a downed zone moves its sessions to the survivor; an override sizes a grey container; a demand override includes an orphan use case", () => {
    const R = S.run(S.buildModel(scene), { scale: 1, down: ["sgw@z2"], overrides: { db: { capacityPerReplica: 500 } }, demand: { "UC-03": 50 } });
    const by = Object.fromEntries(R.instances.map((i: any) => [i.id, i]));
    expect(by["sgw@z2"]).toMatchObject({ down: true, status: "down" });
    expect(by["sgw@z1"]).toMatchObject({ sessions: 8000, rho: 1.6, status: "crit" });
    expect(by["db@z1"]).toMatchObject({ lambda: 150, rho: 0.3, status: "ok" });                       // 100 + 50 over 500 × 1
    expect(R.findings.some((f: any) => f.kind === "demand-gap")).toBe(false);
    expect(R.summary.down).toBe(1);
  });
  test("isolate, off, threshold and the breakpoint scale", () => {
    const m = S.buildModel(scene);
    const iso = S.run(m, { isolate: "UC-02" });
    const by = Object.fromEntries(iso.instances.map((i: any) => [i.id, i]));
    expect(by["gw@aks"].lambda).toBe(0); expect(by["sgw@z1"].sessions).toBe(4000);                 // only the sync flow contributes
    expect(iso.useCases.find((u: any) => u.id === "UC-01")).toMatchObject({ active: false, value: 100 });   // its value stays on the row
    const offR = S.run(m, { off: ["UC-01"] }); expect(Object.fromEntries(offR.instances.map((i: any) => [i.id, i]))["gw@aks"].lambda).toBe(0);
    expect(S.run(m, { threshold: 0.9 }).findings.some((f: any) => f.container === "gw")).toBe(false);        // 0.833 is under 0.9
    const base = S.run(m, S.emptyScenario());
    expect(base.breakpoints.map((b: any) => [b.container, b.breakAt])).toEqual([["gw", 1.2], ["sgw", 1.25], ["svc", 2]]);   // capacity ÷ load: the order the system fails in
    expect(S.run(m, { scale: 3 }).breakpoints[0]).toMatchObject({ container: "gw", breakAt: 1.2, rho: 2.5 });               // the same absolute scale whatever the current one
  });
  test("a container with every instance down interrupts the use cases that reach it: nothing beyond receives their load, the sender still sends, the finding outranks a chokepoint", () => {
    const R = S.run(S.buildModel(scene), { scale: 3, down: ["sgw@z1", "sgw@z2"] });
    const by = Object.fromEntries(R.instances.map((i: any) => [i.id, i]));
    expect(by["db@z1"].sessions).toBe(0);                                                    // UC-02's sync hop sgw → db is never reached
    expect(by["db@z1"].lambda).toBe(300);                                                    // UC-01's reads still arrive
    expect(by["app@aks"].outSessions).toBe(24000);                                           // the app still opens the sessions towards the dead sync (×3)
    expect(R.useCases.find((u: any) => u.id === "UC-02").blockedAt).toEqual({ phase: "3", hop: ["app", "sgw"] });
    expect(R.cuts.sgw).toEqual([{ useCase: "UC-02", phase: "3", from: "app", value: 24000, unit: "sessions" }]);
    expect(R.findings[0]).toMatchObject({ kind: "interrupted", severity: "cut", container: "sgw", useCases: ["UC-02"], sessions: 24000, load: 0 });
    expect(R.findings[1].kind).toBe("chokepoint");                                          // the gateway at ×3, after the interruption
    expect(R.summary).toMatchObject({ interrupted: 1, down: 2 });
    expect(R.latency.find((l: any) => l.useCase === "UC-02").blockedAt.phase).toBe("3");
  });
  test("a phase runs in its own unit (8.42.0): a session flow's request-shaped phase lands rps, a request flow's session-shaped phase holds sessions; the scenario key is uc/phase", () => {
    // UC-02 (8000 sessions) reads the DB in phase 3 at 20 rps — a phase row; UC-01 (100 rps) opens a session on the sync in phase 3 — a scenario entry with a unit
    const sc = JSON.parse(JSON.stringify(scene));
    sc.capacity.demand.push({ useCase: "UC-02", phase: "3", rps: 20, sessions: null, peakFactor: 1 });
    sc.useCases[0].phases = [1, 2, 3]; sc.useCases[1].phases = [3];   // one crossing each (rps count per hop; the fixture's double phase 3 is the sessions-held-once case)
    sc.capacity.instances.find((i: any) => i.container === "db").capacityPerReplica = 200;
    const m = S.buildModel(sc);
    expect(m.phaseDemand["UC-02"]["3"].rps).toBe(20);
    const R = S.run(m, { demand: { "UC-01/3": { value: 300, unit: "sessions" } } });
    const by = Object.fromEntries(R.instances.map((i: any) => [i.id, i]));
    const uc2 = R.useCases.find((u: any) => u.id === "UC-02"); expect(uc2).toMatchObject({ unit: "sessions", value: 8000, mixed: true }); expect(uc2.phaseLoad["3"]).toMatchObject({ unit: "rps", value: 20, documented: true, overridden: false });
    expect(R.useCases.find((u: any) => u.id === "UC-01").phaseLoad["3"]).toMatchObject({ unit: "sessions", value: 300, documented: false, overridden: true });
    expect(by["sgw@z1"]).toMatchObject({ sessions: 150, lambda: 10, rho: 0.03, status: "ok" });                      // UC-01's 300 sessions split over two instances; UC-02's phase 3 now crosses it as 20 rps, not as sessions
    expect(by["db@z1"]).toMatchObject({ lambda: 120, sessions: 300, rho: 0.6, status: "ok", gauge: "rps" });       // 100 read + 20 from the sync's phase 3, judged in rps; UC-01's phase-3 sessions reach it through sgw → db and are shown beside
    expect(by["app@aks"]).toMatchObject({ out: 120, outSessions: 300 });                                             // the app sends UC-01's reads + UC-02's phase-3 reads as rps, UC-01's phase 3 as sessions
    expect(R.byContainer.db).toEqual({ "UC-01": { rps: 100, sessions: 300 }, "UC-02": { rps: 20, sessions: 0 } });
    expect(R.findings.some((f: any) => f.kind === "unit-mismatch")).toBe(false);
    // a phase row without a figure carries nothing and is a gap; it never inherits the flow's sessions
    const R2 = S.run(m, { isolate: "UC-02", demand: { "UC-02/3": null } });
    expect(Object.fromEntries(R2.instances.map((i: any) => [i.id, i]))["db@z1"]).toMatchObject({ lambda: 0, sessions: 0 });   // not its 8000 sessions either
    expect(R2.findings.find((f: any) => f.kind === "demand-gap" && f.phase)).toMatchObject({ useCase: "UC-02", phase: "3", unit: "rps" });
    // proposeRows writes the phase row in its unit
    expect(S.proposeRows(m, { name: "mix", demand: { "UC-01/3": { value: 300, unit: "sessions" }, "UC-02/3": 25 } }, "en")).toMatch(/\| UC-01 · F3 \| 300 \| sessions \| 1 \| scenario mix \|\n\| UC-02 · F3 \| 25 \| rps \| 1 \| scenario mix \|/);
  });
  test("a container sized in one unit that receives load only in the other is grey with a unit-mismatch finding — never green at ρ = 0", () => {
    const sc = JSON.parse(JSON.stringify(scene));
    sc.capacity.instances.find((i: any) => i.container === "db").capacityPerReplica = 200;   // the DB is sized in rps
    const R = S.run(S.buildModel(sc), { isolate: "UC-02" });                                // and only the sync's sessions reach it
    const db = R.instances.find((i: any) => i.id === "db@z1");
    expect(db).toMatchObject({ lambda: 0, sessions: 8000, rho: null, status: "grey", gauge: "rps", mismatch: "sessions", breakAt: null });
    const f = R.findings.find((x: any) => x.kind === "unit-mismatch");
    expect(f).toMatchObject({ severity: "grey", container: "db", gauge: "rps", received: "sessions", unit: "sessions", load: 8000, lambda: 0, sessions: 8000, useCases: ["UC-02"] });
    expect(R.summary.mismatched).toBe(1); expect(R.summary.grey).toBe(0);
    expect(R.breakpoints.some((b: any) => b.container === "db")).toBe(false);
    // with UC-01's reads back, the DB is judged on its rps and the sessions are shown beside
    const both = S.run(S.buildModel(sc), {}).instances.find((i: any) => i.id === "db@z1");
    expect(both).toMatchObject({ lambda: 100, sessions: 8000, rho: 0.5, status: "ok", mismatch: null });
  });
  test("bytes ride the hops (8.54.0): rate × request_size forward, rate × response_size back, a session's transfer once per use case; a receiver without sizes is pending, never zero; instances split the bytes", () => {
    const sc = JSON.parse(JSON.stringify(scene));
    Object.assign(sc.capacity.instances.find((i: any) => i.container === "gw"), { requestSize: 1000, responseSize: 8000 });
    Object.assign(sc.capacity.instances.find((i: any) => i.container === "sgw"), { sessionTransfer: 200 });
    const R = S.run(S.buildModel(sc), S.emptyScenario());
    expect(R.bytes.gw).toEqual({ in: 100000, out: 800000, pending: [] });                       // 100 rps × 1 KB in, × 8 KB back
    expect(R.bytes.app).toEqual({ in: 2400000, out: 100000, pending: [] });                    // the responses (800 KB/s) plus 8 000 sessions × 200 B/s from the sync
    expect(R.bytes.sgw).toEqual({ in: 0, out: 1600000, pending: [] });
    expect(R.bytes.svc.pending).toEqual(["UC-01"]); expect(R.bytes.db.pending).toEqual(["UC-01", "UC-02"]);   // no size stated: pending, and 0 bytes never claimed
    const by = Object.fromEntries(R.instances.map((i: any) => [i.id, i]));
    expect(by["sgw@z1"]).toMatchObject({ bytesOut: 800000, bytesIn: 0, bytesPending: false }); expect(by["svc@aks"].bytesPending).toBe(true);
    expect(R.hopBytes.map((h: any) => [h.a, h.b, h.known])).toEqual([["app", "gw", true], ["gw", "svc", false], ["svc", "db", false], ["app", "sgw", true], ["sgw", "db", false]]);   // the sync hop crossed twice is counted once
    expect(R.findings.find((f: any) => f.kind === "bytes-pending")).toMatchObject({ severity: "grey", containers: ["svc", "db"] });
    // a scenario assumes a size — the rows it would become
    const R2 = S.run(S.buildModel(sc), { overrides: { svc: { requestSize: 500, responseSize: 20000 } } });
    expect(R2.bytes.svc).toEqual({ in: 50000, out: 2000000, pending: [] }); expect(R2.bytes.gw.out).toBe(850000);
    expect(S.proposeRows(S.buildModel(sc), { name: "t", overrides: { svc: { requestSize: 500, responseSize: 20000 } } }, "en")).toMatch(/\| request_size \| 0\.5 \| KB \| scenario t[^\n]*\n\| response_size \| 20 \| KB \|/);
  });
  test("transit (8.54.0): the per-hop bytes folded over the viewer's carrier — every path and every node on the chain, a metered node's GB a month and its cost when the overrides price it, pending hops named", () => {
    const sc = JSON.parse(JSON.stringify(scene));
    Object.assign(sc.capacity.instances.find((i: any) => i.container === "gw"), { requestSize: 1000, responseSize: 8000 });
    sc.deployment.nodes.push({ id: "cdn", name: "CDN", kind: "managed", tier: 1, metered: { by: "bytes", direction: "out" } });
    sc.capacity.pricing = { cdn: { perGB: 0.1, currency: "USD", source: "assumption" } };
    const m = S.buildModel(sc); expect(m.metered.cdn).toEqual({ by: "bytes", direction: "out" });
    const R = S.run(m, S.emptyScenario());
    const L1 = { id: "l1", a: "aks", b: "cdn" }, L2 = { id: "l2", a: "z1", b: "cdn" }, L3 = { id: "l3", a: "aks", b: "cdn" };
    const carrier = (a: string, b: string) => a === "app" && b === "gw" ? [{ link: L1, dir: 1 }, { link: L2, dir: -1 }] : a === "gw" && b === "svc" ? [{ link: L3, dir: 1 }] : null;   // the read enters through the CDN and comes back; l2 is declared z1 — cdn, ridden against its declaration
    const T = S.transit(m, R, carrier);
    expect(T.paths.l1).toEqual({ fwd: 100000, back: 800000, pending: 0, total: 900000 });
    expect(T.paths.l2).toEqual({ fwd: 100000, back: 800000, pending: 0, total: 900000 });
    expect(T.paths.l3).toEqual({ fwd: 0, back: 0, pending: 1, total: 0 });
    expect(T.nodes.cdn).toMatchObject({ in: 900000, out: 900000, total: 1800000, pending: ["svc"], hops: 3 });   // an endpoint of both segments: request bytes and response bytes, both ways
    expect(T.nodes.aks).toMatchObject({ in: 800000, out: 100000 }); expect(T.nodes.z1).toMatchObject({ in: 100000, out: 800000 });
    expect(T.findings).toEqual([{ kind: "metered-transit", severity: "info", node: "cdn", direction: "out", by: "bytes", bytesPerSec: 900000, gbMonth: 2366.82, cost: 236.682, currency: "USD", priceSource: "assumption", pending: ["svc"], hops: 3, scale: 1 }]);
    const T3 = S.transit(m, S.run(m, { scale: 3 }), carrier); expect(T3.findings[0]).toMatchObject({ bytesPerSec: 2700000, gbMonth: 7100.46, scale: 3 });
    expect(S.transit(m, R, () => null)).toEqual({ paths: {}, nodes: {}, findings: [] });
  });
  test("compare and proposeRows", () => {
    const m = S.buildModel(scene);
    const d = S.compare(S.run(m, S.emptyScenario("a")), S.run(m, { scale: 2 }));
    expect(d.rows.find((r: any) => r.container === "gw")).toMatchObject({ rhoA: 0.833, rhoB: 1.667, loadA: 100, loadB: 200 });
    const md = S.proposeRows(m, { name: "pico", overrides: { db: { capacityPerReplica: 500, replicas: 2 } }, demand: { "UC-03": 50 } }, "es");
    expect(md).toMatch(/DB — docs\/components[\s\S]*\| capacity_per_replica \| 500 \| rps \| escenario pico/);
    expect(md).toMatch(/\| replicas \| 2 \| count \|/); expect(md).toMatch(/Demanda por caso de uso[\s\S]*\| UC-03 \| 50 \| rps \| 1 \|/);
    expect(S.proposeRows(m, S.emptyScenario(), "en")).toBe("");
  });
});
