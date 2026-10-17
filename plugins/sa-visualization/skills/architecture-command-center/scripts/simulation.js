// simulation.js — the load model behind the command center's Simulation mode (8.34.0).
//
// A deterministic flow model over the scene: the demand of each use case (docs/08 § Demand by Use Case,
// in rps — sessions stay a gauge) walks the phases the use case declares; every hop lands its rate on the
// receiving container (inbound, what ρ is judged on) and counts as the sender's outbound traffic; a container's rate splits evenly across its live instances (deployment.instances);
// utilization ρ = λ ÷ (replicas × capacity_per_replica). Above the threshold a container is at the limit,
// at 1.0 a chokepoint; the replicas that would bring it back under the threshold are the balancing figure,
// and when they exceed max_replicas the finding is a scale-out limit. A container whose capacity is
// `Not documented` receives its rate and is painted grey — never judged, never assumed.
//
// A flow has one unit — rps, or sessions for a connection-holding flow — and a phase inside it may run in the
// other (8.42.0): a demand row qualified by a phase (`UC-02 · F3` in docs/08, key `UC-02/3` in a scenario) gives
// that phase its own unit and figure; the other phases keep the flow's. A sized container that receives load
// only in the unit it is not sized in is grey with a `unit-mismatch` finding — never green with ρ = 0.
//
// Bytes ride the same hops (8.54.0): a container's Capacity table may state request_size and response_size (bytes per
// request it receives and returns) and session_transfer (bytes per second one held session moves toward its client).
// Every hop a → b then carries rate × request_size forward and rate × response_size back — the receiver's bytesIn /
// bytesOut, the sender's mirror — and `transit()` folds those per-hop bytes over the physical carrier the viewer hands
// in: what every path and every deployment node on the chain moves in bytes per second, which is the figure a
// traffic-billed node (a CDN, a WAF, an egress gateway — `metered` on the deployment node) is charged for. A hop whose
// receiver states no size is pending, never zero; a size is never assumed.
//
// One implementation for three readers: the viewer (inlined by render.js as window.Simulation), Alia's
// tools (run_simulation / set_load / set_capacity / set_instance / compare), and the tests. Pure: no DOM,
// no Three.js, no I/O. A scenario is data the viewer or Alia hands in; the scene's capacity block is the
// base every scenario starts from.
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Simulation = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const THRESHOLD_DEFAULT = 0.7;
  const r3 = (n) => Math.round(n * 1000) / 1000;

  // The model: what the scene states, in the shape the run reads. Instances are deployment.instances (id =
  // i.id || container@node); a container with no instance is modelled as one virtual instance so its load
  // still lands somewhere (the physical view will not draw it — render.js warns).
  function buildModel(scene) {
    const cap = scene.capacity || { unit: 'rps', threshold: THRESHOLD_DEFAULT, demand: [], instances: [], gaps: [] };
    const actors = new Set((scene.nodes || []).filter((n) => n.kind === 'actor').map((n) => n.id));
    const containers = (scene.nodes || []).filter((n) => n.kind !== 'actor').map((n) => n.id);
    const dep = scene.deployment || {};
    const instances = (dep.instances || []).filter((i) => containers.includes(i.container)).map((i) => ({ id: i.id || i.container + '@' + i.node, container: i.container, node: i.node }));
    containers.forEach((c) => { if (!instances.some((i) => i.container === c)) instances.push({ id: c + '@—', container: c, node: null, virtual: true }); });
    const capByContainer = {}; (cap.instances || []).forEach((r) => { capByContainer[r.container] = r; });
    const metered = {}; (dep.nodes || []).forEach((n) => { if (n.metered) metered[n.id] = Object.assign({ by: 'bytes', direction: 'out' }, n.metered); });   // what the provider counts on this node
    const demand = {}, phaseDemand = {};   // the flow's row, and the phase-qualified rows by use case then phase
    (cap.demand || []).forEach((d) => { if (d.phase != null && d.phase !== '') (phaseDemand[d.useCase] = phaseDemand[d.useCase] || {})[String(d.phase)] = d; else demand[d.useCase] = d; });
    return {
      threshold: cap.threshold || THRESHOLD_DEFAULT, unit: cap.unit || 'rps',
      useCases: (scene.useCases || []).map((u) => ({ id: u.id, name: u.name, target: u.target || '', phases: (u.phases || []).map(String) })),
      phases: Object.fromEntries(Object.entries(scene.phases || {}).map(([k, p]) => [String(k), { name: p.name, budget: p.budget || '', hops: [].concat(p.path || [], p.extra || []).filter(([a, b]) => !actors.has(b)) }])),
      containers, instances, capacity: capByContainer, demand, phaseDemand, actors: [...actors],
      names: Object.fromEntries((scene.nodes || []).map((n) => [n.id, n.name])),
      nodeNames: Object.fromEntries((dep.nodes || []).map((n) => [n.id, n.name])), metered, pricing: cap.pricing || {},
    };
  }

  // scenario: { scale, demand: { [uc | uc/phase]: number | { value, unit } | null }, off: [use cases switched off], isolate: one use case or null (only it contributes),
  //             threshold (overrides the model's), down: [instance ids], overrides: { [container]: { replicas, maxReplicas, capacityPerReplica, capacityPerReplicaSessions } } }
  // `metrics` (8.55.0) is the viewer's: which of rps · sessions · bytes the stage shows for this scenario, null for all three — the model ignores it
  function emptyScenario(name) { return { name: name || 'base', scale: 1, demand: {}, off: [], isolate: null, threshold: null, down: [], overrides: {}, metrics: null }; }

  function run(model, scenario) {
    const sc = Object.assign(emptyScenario(), scenario || {});
    const down = new Set(sc.down || []);
    const threshold = sc.threshold != null ? sc.threshold : (model.threshold || THRESHOLD_DEFAULT);
    const off = new Set(sc.off || []);
    // 1. demand per use case, in rps or sessions; a use case switched off, or outside the isolated one, contributes nothing (its value stays on the row)
    const unitOf = (row) => row && row.sessions != null && row.rps == null ? 'sessions' : 'rps';
    const valOf = (row) => row ? (unitOf(row) === 'sessions' ? row.sessions : row.rps) : null;
    const entry = (key) => {   // a scenario's demand entry: a number in the row's unit, or { value, unit } when it states one
      if (!Object.prototype.hasOwnProperty.call(sc.demand || {}, key)) return null;
      const d = sc.demand[key];
      return d != null && typeof d === 'object' ? { value: d.value == null ? null : +d.value, unit: d.unit === 'sessions' ? 'sessions' : d.unit ? 'rps' : null } : { value: d, unit: null };
    };
    const ucLoad = model.useCases.map((u) => {
      const base = model.demand[u.id] || null;
      const e = entry(u.id);
      const unit = unitOf(base);
      const baseVal = valOf(base);
      const val = e ? e.value : baseVal;
      const active = !off.has(u.id) && (!sc.isolate || sc.isolate === u.id);
      // the phases that run in their own unit: a phase-qualified row, or a scenario entry keyed uc/phase. A phase whose
      // own figure is null carries nothing and is a gap — it never falls back to the flow's figure in the wrong unit.
      const phaseLoad = {};
      u.phases.forEach((pid) => {
        const row = (model.phaseDemand[u.id] || {})[pid] || null, pe = entry(u.id + '/' + pid);
        if (!row && !pe) return;
        const pBase = valOf(row), pVal = pe ? pe.value : pBase;
        phaseLoad[pid] = { unit: (pe && pe.unit) || (row ? unitOf(row) : 'rps'), base: pBase, value: pVal == null ? null : pVal * (sc.scale || 1), documented: !!row && pBase != null, overridden: !!pe, peakFactor: row ? row.peakFactor || 1 : 1 };
      });
      return { id: u.id, name: u.name, target: u.target, phases: u.phases, unit, base: baseVal, value: val == null ? null : val * (sc.scale || 1), active, documented: !!base && baseVal != null, overridden: !!e, peakFactor: base ? base.peakFactor || 1 : 1, phaseLoad, mixed: Object.values(phaseLoad).some((p) => p.unit !== unit) };
    });
    // 2. walk the hops: every receiving container accumulates
    const lambda = {}, sessions = {}, out = {}, outSessions = {}, by = {}, ucPhaseHops = {}, cuts = {};
    const liveOf = (c) => model.instances.filter((x) => x.container === c && !down.has(x.id)).length;
    // bytes per hop (8.54.0): the receiver's sizes decide what the hop moves; the scenario may assume them
    const bytesIn = {}, bytesOut = {}, bytesPending = {}, hopBytes = [];
    const sizesOf = (c) => Object.assign({}, model.capacity[c] || {}, (sc.overrides || {})[c] || {});
    const addBytes = (m, c, v) => { if (model.containers.includes(c)) m[c] = (m[c] || 0) + v; };
    const hopTraffic = (a, b, uc, pid, unit, value, once) => {
      const s = sizesOf(b);
      let fwd = 0, back = 0, known = false, partial = false;
      if (unit === 'sessions') { if (once) { known = s.sessionTransfer != null; back = known ? value * s.sessionTransfer : 0; } else return; }   // a session is held once: its transfer is counted once per use case
      else { known = s.requestSize != null || s.responseSize != null; partial = known && (s.requestSize == null) !== (s.responseSize == null); fwd = value * (s.requestSize || 0); back = value * (s.responseSize || 0); }
      if (!known) (bytesPending[b] = bytesPending[b] || new Set()).add(uc);
      hopBytes.push({ a, b, useCase: uc, phase: pid, unit, rate: value, fwd: r3(fwd), back: r3(back), known, partial });
      addBytes(bytesIn, b, fwd); addBytes(bytesOut, b, back); addBytes(bytesOut, a, fwd); addBytes(bytesIn, a, back);
    };
    ucLoad.forEach((u) => {
      if (!u.active) return;
      const held = new Set(), sent = new Set();   // a session is one connection: a container holds it once per use case, however many phases cross it
      u.phases.some((pid) => {
        const ph = model.phases[pid]; if (!ph) return false;
        const pl = u.phaseLoad[pid], unit = pl ? pl.unit : u.unit, value = pl ? pl.value : u.value;   // the phase's own unit and figure, else the flow's
        if (value == null || value === 0) return false;
        return ph.hops.some(([a, b]) => {
          if (model.containers.includes(a)) { if (unit === 'sessions') { if (!sent.has(a)) { sent.add(a); outSessions[a] = (outSessions[a] || 0) + value; } } else out[a] = (out[a] || 0) + value; }   // the sender's outbound traffic — sent even when the receiver is down
          if (!model.containers.includes(b)) return false;
          if (liveOf(b) === 0) {   // every instance of the receiver is down: the use case is interrupted here and nothing beyond this hop receives its load
            u.blockedAt = { phase: pid, hop: [a, b] }; (cuts[b] = cuts[b] || []).push({ useCase: u.id, phase: pid, from: a, value, unit });
            return true;
          }
          const slot = (by[b] = by[b] || {})[u.id] = by[b][u.id] || { rps: 0, sessions: 0 };   // what each use case lands here, per unit
          hopTraffic(a, b, u.id, pid, unit, value, unit === 'sessions' && !held.has(b));
          if (unit === 'sessions') { if (!held.has(b)) { held.add(b); sessions[b] = (sessions[b] || 0) + value; slot.sessions += value; } } else { lambda[b] = (lambda[b] || 0) + value; slot.rps += value; }
          (ucPhaseHops[u.id] = ucPhaseHops[u.id] || []).push({ phase: pid, container: b });
          return false;
        });
      });
    });
    // 3. per instance
    const instances = model.instances.map((i) => {
      const cap = Object.assign({}, model.capacity[i.container] || {}, (sc.overrides || {})[i.container] || {}, (sc.overrides || {})[i.id] || {});
      const live = model.instances.filter((x) => x.container === i.container && !down.has(x.id));
      const k = Math.max(1, live.length);
      if (down.has(i.id)) return { id: i.id, container: i.container, node: i.node, down: true, lambda: 0, sessions: 0, out: 0, outSessions: 0, bytesIn: 0, bytesOut: 0, rho: null, status: 'down', cap };
      const lam = r3((lambda[i.container] || 0) / k), sess = r3((sessions[i.container] || 0) / k), o = r3((out[i.container] || 0) / k), oS = r3((outSessions[i.container] || 0) / k), bIn = r3((bytesIn[i.container] || 0) / k), bOut = r3((bytesOut[i.container] || 0) / k);
      const gauge = cap.capacityPerReplicaSessions != null && cap.capacityPerReplica == null ? 'sessions' : 'rps';
      const per = gauge === 'sessions' ? cap.capacityPerReplicaSessions : cap.capacityPerReplica;
      const reps = cap.replicas;
      const inGauge = gauge === 'sessions' ? sess : lam, inOther = gauge === 'sessions' ? lam : sess;
      let rho = null, status, breakAt = null, mismatch = null;
      if (per != null && reps != null && reps > 0) {
        if (inGauge === 0 && inOther > 0) { status = 'grey'; mismatch = gauge === 'sessions' ? 'rps' : 'sessions'; }   // sized in one unit, loaded only in the other: not judged, never green at ρ = 0
        else { rho = r3(inGauge / (per * reps)); status = rho >= 1 ? 'crit' : rho >= threshold ? 'warn' : 'ok'; breakAt = rho > 0 ? r3((sc.scale || 1) / rho) : Infinity; }
      } else status = (lam > 0 || sess > 0) ? 'grey' : 'idle';
      return { id: i.id, container: i.container, node: i.node, virtual: !!i.virtual, down: false, lambda: lam, sessions: sess, out: o, outSessions: oS, bytesIn: bIn, bytesOut: bOut, bytesPending: !!bytesPending[i.container], rho, status, breakAt, gauge, mismatch, cap, liveCount: k };
    });
    // 4. findings, per container (its instances share the verdict)
    const findings = [];
    const seen = new Set();
    instances.forEach((i) => {
      if (seen.has(i.container) || i.down) return; seen.add(i.container);
      const all = instances.filter((x) => x.container === i.container && !x.down);
      const worst = all.reduce((m, x) => ((x.rho || 0) > (m.rho || 0) ? x : m), all[0]);
      const total = i.gauge === 'sessions' ? all.reduce((s, x) => s + x.sessions, 0) : all.reduce((s, x) => s + x.lambda, 0);
      const cap = i.cap, per = i.gauge === 'sessions' ? cap.capacityPerReplicaSessions : cap.capacityPerReplica;
      if (worst.rho != null && worst.rho >= threshold) {
        const need = Math.ceil(total / (per * threshold)), maxTotal = cap.maxReplicas != null ? cap.maxReplicas * all.length : null;
        const limit = maxTotal != null && need > maxTotal;
        findings.push({ kind: worst.rho >= 1 ? 'chokepoint' : 'at-limit', severity: worst.rho >= 1 ? 'crit' : 'warn', container: i.container, nodes: all.map((x) => x.node).filter(Boolean), rho: worst.rho, load: r3(total), unit: i.gauge, replicas: cap.replicas, instances: all.length, needed: need, max: maxTotal, scaleLimit: limit, rhoAfter: r3(total / (per * need)) });
      } else if (i.status === 'grey' && i.mismatch) {
        // the container is sized in `gauge` and receives load only in `received`: a phase row in docs/08 in the gauge's unit, or a capacity row in the received unit, closes it
        findings.push({ kind: 'unit-mismatch', severity: 'grey', container: i.container, nodes: all.map((x) => x.node).filter(Boolean), gauge: i.gauge, received: i.mismatch, unit: i.mismatch, load: r3(i.mismatch === 'sessions' ? all.reduce((s, x) => s + x.sessions, 0) : all.reduce((s, x) => s + x.lambda, 0)), lambda: r3(all.reduce((s, x) => s + x.lambda, 0)), sessions: r3(all.reduce((s, x) => s + x.sessions, 0)), useCases: Object.keys(by[i.container] || {}) });
      } else if (i.status === 'grey') {
        const missing = []; if (per == null) missing.push(i.gauge === 'sessions' ? 'capacity_per_replica (sessions)' : 'capacity_per_replica'); if (cap.replicas == null) missing.push('replicas');
        findings.push({ kind: 'not-documented', severity: 'grey', container: i.container, nodes: all.map((x) => x.node).filter(Boolean), load: r3(i.gauge === 'sessions' ? all.reduce((s, x) => s + x.sessions, 0) : all.reduce((s, x) => s + x.lambda, 0)), lambda: r3(all.reduce((s, x) => s + x.lambda, 0)), sessions: r3(all.reduce((s, x) => s + x.sessions, 0)), unit: i.gauge, missing });
      }
    });
    // an interruption outranks a chokepoint: the use cases that reach a dead container never get served
    Object.entries(cuts).forEach(([c, list]) => findings.push({ kind: 'interrupted', severity: 'cut', container: c, nodes: model.instances.filter((x) => x.container === c).map((x) => x.node).filter(Boolean), useCases: list.map((x) => x.useCase), cuts: list, load: r3(list.filter((x) => x.unit !== 'sessions').reduce((s, x) => s + x.value, 0)), sessions: r3(list.filter((x) => x.unit === 'sessions').reduce((s, x) => s + x.value, 0)) }));
    ucLoad.filter((u) => !u.documented && !u.overridden).forEach((u) => findings.push({ kind: 'demand-gap', severity: 'grey', useCase: u.id, missing: ['demand'] }));
    ucLoad.forEach((u) => Object.entries(u.phaseLoad).forEach(([pid, p]) => { if (p.value == null) findings.push({ kind: 'demand-gap', severity: 'grey', useCase: u.id, phase: pid, unit: p.unit, missing: ['demand'] }); }));   // a phase row Not documented: that phase carries nothing
    // one finding for every container that receives load and states no size: the bytes on every path it loads are unknown, never zero
    const pendingList = Object.entries(bytesPending).map(([c, ucs]) => ({ container: c, useCases: [...ucs] }));
    if (pendingList.length) findings.push({ kind: 'bytes-pending', severity: 'grey', containers: pendingList.map((p) => p.container), items: pendingList, missing: ['request_size', 'response_size'] });
    sortFindings(findings);
    // 5. latency estimate per use case: the phase whose worst receiving instance is the most loaded stretches the budget by 1/(1−ρ) — an M/M/1 shape, labelled an estimate
    const latency = ucLoad.filter((u) => u.value).map((u) => {
      const phases = u.phases.map((pid) => { const ph = model.phases[pid]; if (!ph) return null; let worst = 0, at = null; ph.hops.forEach(([, b]) => instances.filter((x) => x.container === b && !x.down).forEach((x) => { if (x.rho != null && x.rho > worst) { worst = x.rho; at = b; } })); return { phase: pid, budget: ph.budget, worstRho: r3(worst), at, factor: worst >= 1 ? Infinity : r3(1 / (1 - worst)) }; }).filter(Boolean);
      const worst = phases.reduce((m, p) => (p.worstRho > (m ? m.worstRho : -1) ? p : m), null);
      return { useCase: u.id, target: u.target, phases, worst, saturated: phases.some((p) => p.factor === Infinity), blockedAt: u.blockedAt || null };
    });
    const sized = instances.filter((i) => !i.down && !i.virtual && i.rho != null).length, placed = instances.filter((i) => !i.down && !i.virtual).length;
    // the order the system fails in as the load grows: one row per sized container with load, by the scale that saturates it
    const breakpoints = []; const seenB = new Set();
    instances.forEach((i) => { if (i.down || i.breakAt == null || seenB.has(i.container)) return; seenB.add(i.container); const all = instances.filter((x) => x.container === i.container && !x.down); const worst = all.reduce((m, x) => (x.rho > m.rho ? x : m), all[0]); if (worst.breakAt !== Infinity) breakpoints.push({ container: i.container, rho: worst.rho, breakAt: worst.breakAt, status: worst.status }); });
    breakpoints.sort((a, b) => a.breakAt - b.breakAt);
    const bytes = {}; model.containers.forEach((c) => { if (bytesIn[c] || bytesOut[c] || bytesPending[c]) bytes[c] = { in: r3(bytesIn[c] || 0), out: r3(bytesOut[c] || 0), pending: bytesPending[c] ? [...bytesPending[c]] : [] }; });
    return { scenario: sc, threshold, useCases: ucLoad, instances, byContainer: by, cuts, findings, latency, breakpoints, hopBytes, bytes, summary: { interrupted: Object.keys(cuts).length, sized, placed, chokepoints: findings.filter((f) => f.kind === 'chokepoint').length, atLimit: findings.filter((f) => f.kind === 'at-limit').length, grey: findings.filter((f) => f.kind === 'not-documented').length, mismatched: findings.filter((f) => f.kind === 'unit-mismatch').length, demandGaps: findings.filter((f) => f.kind === 'demand-gap').length, down: instances.filter((i) => i.down).length } };
  }

  // Bytes on the wire (8.54.0): the per-hop bytes of a run folded over the physical carrier — `carrier(a, b)` is the viewer's
  // projection of a logical hop onto the chain of declared paths, `[{ link: { id, a, b }, dir }]` oriented a → b (dir 1 when
  // the hop runs link.a → link.b), or null when nothing carries it. Every path accumulates what it moves forward and back;
  // every deployment node that is an endpoint of a segment accumulates what enters and leaves it — an intermediate node of a
  // chain (a CDN between the device and the origin) is an endpoint of two segments, so it sees the request bytes and the
  // response bytes both ways. A metered node yields an `metered-transit` finding: bytes per second in the direction its
  // provider counts, the GB a month at this scale (2,629,800 s — a 365.25-day year over twelve) and, when the project's
  // overrides carry a price for the node, the cost a month — an assumption, marked as one.
  // the order a reader wants: an interruption, then chokepoints, at-limit, a traffic-billed figure (information the viewer asked for, above the pending repetitions), then the grey
  const ORDER = { cut: -1, crit: 0, warn: 1, info: 2, grey: 3 };
  const sortFindings = (findings) => findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || (b.rho || 0) - (a.rho || 0) || (b.bytesPerSec || 0) - (a.bytesPerSec || 0));
  const SECONDS_PER_MONTH = 2629800;
  function transit(model, result, carrier) {
    const paths = {}, nodes = {};
    const nodeOf = (x) => (model.nodeNames && model.nodeNames[x] != null ? x : null);
    const node = (id) => nodes[id] || (nodes[id] = { in: 0, out: 0, pending: new Set(), hops: 0 });
    (result.hopBytes || []).forEach((h) => {
      const segs = carrier(h.a, h.b); if (!segs || !segs.length) return;
      segs.forEach((s) => {
        const l = s.link, up = s.dir === 1 ? l.a : l.b, dn = s.dir === 1 ? l.b : l.a;
        const p = paths[l.id] || (paths[l.id] = { fwd: 0, back: 0, pending: 0 });
        if (h.known) { p.fwd += h.fwd; p.back += h.back; } else p.pending++;
        [up, dn].forEach((x) => { const id = nodeOf(x); if (!id) return; const n = node(id); n.hops++; if (!h.known) n.pending.add(h.b); else if (x === up) { n.out += h.fwd; n.in += h.back; } else { n.in += h.fwd; n.out += h.back; } });
      });
    });
    Object.values(paths).forEach((p) => { p.fwd = r3(p.fwd); p.back = r3(p.back); p.total = r3(p.fwd + p.back); });
    const findings = [];
    Object.entries(nodes).forEach(([id, n]) => {
      n.in = r3(n.in); n.out = r3(n.out); n.total = r3(n.in + n.out); n.pending = [...n.pending]; n.metered = model.metered[id] || null;
      if (!n.metered) return;
      const dir = n.metered.direction || 'out', bps = dir === 'in' ? n.in : dir === 'both' ? n.total : n.out;
      const price = (model.pricing || {})[id] || null, gbMonth = r3(bps * SECONDS_PER_MONTH / 1e9);
      findings.push({ kind: 'metered-transit', severity: 'info', node: id, direction: dir, by: n.metered.by || 'bytes', bytesPerSec: bps, gbMonth, cost: price && price.perGB != null ? r3(gbMonth * price.perGB) : null, currency: price ? price.currency || null : null, priceSource: price ? price.source || null : null, pending: n.pending, hops: n.hops, scale: result.scenario.scale || 1 });
    });
    findings.sort((a, b) => b.bytesPerSec - a.bytesPerSec);
    return { paths, nodes, findings };
  }

  // what changed between two results, per container — the answer to "compare"
  function compare(a, b) {
    const rows = [];
    const cont = [...new Set(a.instances.concat(b.instances).map((i) => i.container))];
    cont.forEach((c) => {
      const ra = Math.max(...a.instances.filter((i) => i.container === c).map((i) => i.rho == null ? -1 : i.rho)), rb = Math.max(...b.instances.filter((i) => i.container === c).map((i) => i.rho == null ? -1 : i.rho));
      const la = a.instances.filter((i) => i.container === c).reduce((s, i) => s + i.lambda + i.sessions, 0), lb = b.instances.filter((i) => i.container === c).reduce((s, i) => s + i.lambda + i.sessions, 0);
      if (ra !== rb || Math.abs(la - lb) > 1e-9) rows.push({ container: c, rhoA: ra < 0 ? null : ra, rhoB: rb < 0 ? null : rb, loadA: r3(la), loadB: r3(lb) });
    });
    rows.sort((x, y) => ((y.rhoB || 0) - (y.rhoA || 0)) - ((x.rhoB || 0) - (x.rhoA || 0)));
    return { rows, findingsA: a.findings.length, findingsB: b.findings.length };
  }

  // the rows a scenario's accepted assumptions would become — Markdown, copied for the architect, never written by the viewer
  function proposeRows(model, scenario, lang) {
    const es = lang === 'es';
    const out = [];
    const ov = scenario.overrides || {};
    Object.entries(ov).forEach(([c, o]) => {
      if (!model.containers.includes(c)) return;
      const rows = [];
      if (o.capacityPerReplica != null) rows.push(`| capacity_per_replica | ${o.capacityPerReplica} | rps | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} — ${es ? 'supuesto del usuario, sin medir' : 'user assumption, not measured'} |`);
      if (o.capacityPerReplicaSessions != null) rows.push(`| capacity_per_replica | ${o.capacityPerReplicaSessions} | sessions | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} |`);
      if (o.replicas != null) rows.push(`| replicas | ${o.replicas} | count | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} |`);
      if (o.maxReplicas != null) rows.push(`| max_replicas | ${o.maxReplicas} | count | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} |`);
      if (o.requestSize != null) rows.push(`| request_size | ${r3(o.requestSize / 1e3)} | KB | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} — ${es ? 'supuesto del usuario, sin medir' : 'user assumption, not measured'} |`);
      if (o.responseSize != null) rows.push(`| response_size | ${r3(o.responseSize / 1e3)} | KB | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} — ${es ? 'supuesto del usuario, sin medir' : 'user assumption, not measured'} |`);
      if (o.sessionTransfer != null) rows.push(`| session_transfer | ${r3(o.sessionTransfer / 1e3)} | KB/s | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} — ${es ? 'supuesto del usuario, sin medir' : 'user assumption, not measured'} |`);
      if (rows.length) out.push(`<!-- ${model.names[c] || c} — docs/components/**/*.md → ## ${es ? 'Capacidad' : 'Capacity'} <!-- LABEL: Capacity -->\n| Metric | Value | Unit | Source |\n|---|---|---|---|\n${rows.join('\n')}`);
    });
    // a demand entry is a number, or { value, unit }; a key `uc/phase` is a phase-qualified row (`UC-02 · F3`) in that phase's unit
    const dem = Object.entries(scenario.demand || {}).map(([k, d]) => [k, d != null && typeof d === 'object' ? d : { value: d, unit: null }]).filter(([, d]) => d.value != null);
    if (dem.length) out.push(`<!-- docs/08 → ### ${es ? 'Demanda por caso de uso' : 'Demand by Use Case'} <!-- LABEL: Demand by Use Case -->\n| Use Case | Value | Unit | Peak factor | Source |\n|---|---|---|---|---|\n${dem.map(([k, d]) => { const [uc, ph] = k.split('/'); const base = ph ? (model.phaseDemand[uc] || {})[ph] : model.demand[uc]; const unit = d.unit === 'sessions' ? 'sessions' : d.unit ? 'rps' : base && base.sessions != null && base.rps == null ? 'sessions' : 'rps'; return `| ${uc}${ph ? ' · F' + ph : ''} | ${d.value} | ${unit} | ${base ? base.peakFactor || 1 : 1} | ${es ? 'escenario' : 'scenario'} ${scenario.name || ''} |`; }).join('\n')}`);
    return out.join('\n\n');
  }

  return { THRESHOLD_DEFAULT, SECONDS_PER_MONTH, buildModel, emptyScenario, run, transit, sortFindings, compare, proposeRows };
});
