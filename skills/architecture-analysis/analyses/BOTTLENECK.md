# Bottleneck Analysis Spec — Throughput Chokepoints and Capacity Headroom

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Bottleneck analysis. It identifies throughput chokepoints, connection saturation candidates, fan-in convergence points, and capacity headroom gaps — the components most likely to fail under load before other parts of the system.

**Output file**: `analysis/BOTTLENECK-<YYYY-MM-DD>.md`

---

## Classification Model

Every component in `docs/components/README.md` is evaluated against capacity and throughput data found in the architecture documentation. Components are classified into bottleneck severity tiers based on how close they operate to their documented limits.

### Bottleneck Severity Tiers

| Tier | Label | Criteria |
|------|-------|---------|
| **B1** | Critical Chokepoint | Component is the ONLY path for a high-volume flow AND cannot scale horizontally (stateful, singleton, connection-limited) |
| **B2** | High-Risk Chokepoint | Component has a documented throughput limit that will be reached at projected peak load, OR has a connection pool that can be exhausted |
| **B3** | Scaling Risk | Component scales horizontally but has a single-threaded or single-instance dependency upstream/downstream that caps effective throughput |
| **B4** | Fan-in Convergence | Component receives traffic from ≥3 upstream services without explicit backpressure, rate limiting, or circuit breakers |
| **Adequate** | No bottleneck detected | Component has horizontal scaling, documented headroom, or is not on the hot path |

### Key Metrics to Extract

For each component, extract from architecture docs:

| Metric | Where to find it | What to compute |
|--------|-----------------|-----------------|
| **Max RPS / throughput** | `docs/08-scalability-and-performance.md`, per-component `.md` | Documented limit |
| **HPA min/max replicas** | Per-component `.md` C4 metadata + `docs/08-scalability-and-performance.md` | Scale range |
| **Connection pool size** | `docs/06-technology-stack.md`, per-component `.md` | Max concurrent connections |
| **Queue depth / consumer lag SLO** | `docs/04-data-flow-patterns.md`, ADRs | Backpressure threshold |
| **SLO targets** | `docs/08-scalability-and-performance.md` | p95 latency, error rate |
| **Fan-in count** | `docs/05-integration-points.md`, `docs/04-data-flow-patterns.md` | Number of upstream callers |
| **Stateful vs. stateless** | Component type from `docs/components/README.md` | Horizontal-scale eligibility |

---

## Evidence Extraction

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Throughput targets | `docs/08-scalability-and-performance.md` | ARCHITECTURE.md Section 8 |
| HPA config | Per-component `docs/components/**/*.md` | `docs/08-scalability-and-performance.md` |
| Connection pools | `docs/06-technology-stack.md` | Per-component `.md` files |
| Queue depths / backpressure | `docs/04-data-flow-patterns.md` | ADRs referencing "throughput", "lag", "backpressure" |
| Fan-in topology | `docs/05-integration-points.md` | `docs/04-data-flow-patterns.md` |
| Cost-driven capacity constraints | ADRs referencing removed caches, reduced replicas, or tier downgrades | |
| SLO targets (p95 latency, RPS) | `docs/08-scalability-and-performance.md` | ARCHITECTURE.md Section 8 |

---

## Report Sections (in order)

1. **Executive Summary** — number of B1+B2 chokepoints, highest-risk component, whether the architecture has documented throughput limits, one-line verdict

2. **Top Chokepoints Table** — B1 and B2 components, ordered by severity (B1 first, then B2; within each tier, ordered by fan-in count descending)

   ```
   Tier | Component | Max RPS / Limit | Current HPA | Fan-in Count | Bottleneck Reason | ADR Reference
   ```
   - `Max RPS / Limit` = the documented throughput or connection ceiling, or `[NOT DOCUMENTED]`
   - `Current HPA` = `min–max replicas` or `stateful (no HPA)` or `[NOT DOCUMENTED]`
   - `Bottleneck Reason` = one sentence (e.g., "sole database connection pool — exhausted at 500 concurrent connections", "single-instance Redis removed, all reads now hit PostgreSQL")

3. **Scaling Risk Components Table** — B3 and B4 components

   ```
   Tier | Component | Scale Blocker | Fan-in Count | Recommendation
   ```

4. **Capacity Headroom Summary** — for each component where documented data allows, compute:
   - **Current load** (from SLO targets or observed RPS if documented)
   - **Max capacity** (from throughput limits or HPA max × per-instance RPS)
   - **Headroom %** = (max − current) / max × 100
   - Flag any component with headroom < 30% as a near-term risk

   ```
   Component | Current Load (est.) | Max Capacity | Headroom % | Risk Level
   ```
   Use `[NOT DOCUMENTED]` where data is absent.

5. **Fan-in Convergence Points** — components with fan-in ≥ 3 that lack backpressure:

   ```
   Component | Upstream Callers (count) | Backpressure Mechanism | Risk
   ```

6. **Top 5 Scaling Recommendations** — ordered by (severity × remediation complexity):
   - What to add (connection pool size, HPA max, queue depth limit, read replica, cache layer)
   - The trade-off (latency vs. cost, complexity vs. resilience)
   - Cite the finding ID (B1, B2, …) and source file

7. **ADR-Driven Bottlenecks** — a dedicated sub-section for bottlenecks introduced by architectural decisions (e.g., Redis removed for cost savings, replica count reduced):

   ```
   ADR | Decision | Bottleneck Introduced | Current Risk
   ```

8. **Summary Verdict** — overall capacity posture: does the architecture have documented throughput headroom? Are the documented SLOs achievable at projected peak load? What is the single component most likely to become a production bottleneck first?

9. **Documentation Gaps** — components with no HPA config, no throughput targets, no connection pool documentation; each gap prevents the bottleneck analysis from being definitive

---

## Key Patterns That Signal a Bottleneck

When reading architecture docs, flag these patterns:

| Pattern | Signal |
|---------|--------|
| `HPA min: 1` on a stateless service that receives all client traffic | B2 risk — startup time under spike load |
| "Redis removed" or "cache removed" in an ADR | B1 risk — every read now hits the primary DB |
| Single PostgreSQL primary with no read replicas | B1 risk — read + write contention on one instance |
| Connection pool size not documented | Documentation gap — unable to assess saturation risk |
| Queue with no backpressure / no consumer lag SLO | B4 risk — unbounded lag silently accumulates |
| `max replicas: 1` or `Deploys as: Singleton` on a service with multiple upstream callers | B1 risk — cannot scale out |
| External SaaS dependency with no rate-limit documentation | B2 risk — rate-limit breach triggers hard failure |
| `maxConnections` not set on database connection pool | B2 risk — default is often 10–20; insufficient at scale |

---

## Heat Map

For Bottleneck analysis, do NOT produce a 2D heat map. Instead, produce a **ranked capacity headroom bar chart** (ASCII):

```
Capacity Headroom by Component (estimated)
════════════════════════════════════════

PostgreSQL Primary    ████░░░░░░░░  32%  ⚠️ Near limit
Gatekeeper (HPA 3-15) ██████░░░░░░  54%
Kafka Consumer Group  ████████░░░░  67%
Auth0 (external)      [NOT DOCUMENTED]
Redis Cache           [REMOVED — ADR-013]

Note: bars based on documented throughput figures only.
████ = used capacity estimate  ░░░░ = available headroom
```

Build this from the Capacity Headroom Summary data. Components with no documented data show `[NOT DOCUMENTED]`. Removed components show `[REMOVED — ADR-NNN]`.
