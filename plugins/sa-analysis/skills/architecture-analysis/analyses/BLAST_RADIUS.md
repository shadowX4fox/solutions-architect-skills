# Blast Radius Analysis Spec — Downstream Cascade Impact

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Blast Radius analysis. For each component, it maps which downstream components and flows are affected if that component fails, scores cascade severity, assesses whether bulkheads exist, and identifies which components are well-isolated vs. which are catastrophic single nodes.

**Output file**: `analysis/BLAST-RADIUS-<YYYY-MM-DD>.md`

---

## Classification Model

Every component returned by `component-cli.ts list` (`level: L2`) is evaluated as a **source node** (the component that fails) and its **downstream blast radius** is computed by tracing:
1. All components that directly consume it (from `docs/05-integration-points.md`, `docs/04-data-flow-patterns.md`, and per-component C4 metadata `Communicates via:`)
2. All components that indirectly depend on those consumers (one hop deeper)
3. Client-facing flows that are disrupted

### Blast Severity Tiers

| Tier | Label | Criteria |
|------|-------|---------|
| **S1** | Catastrophic | Failure disrupts ≥80% of user-facing flows OR causes a data loss scenario |
| **S2** | High | Failure disrupts 40–79% of user-facing flows OR causes complete feature unavailability for a major capability |
| **S3** | Medium | Failure disrupts 10–39% of user-facing flows OR causes SLO breach without full outage |
| **S4** | Low | Failure affects only background/batch jobs or internal admin tools; no user-facing impact |
| **Isolated** | Isolated | Failure is fully contained — bulkhead pattern, fallback, or circuit breaker prevents cascade |

### Fan-out Depth

For each source component, count:
- **Direct consumers** (1-hop) — components that directly call or depend on this source
- **Indirect consumers** (2-hop) — components that depend on the direct consumers
- **Total blast fan-out** = direct + indirect consumers

A fan-out > 3 is classified as a **High-Blast component** (appears in the primary table).

### Cascade Risk

Evaluate whether a bulkhead pattern (timeout, circuit breaker, queue, or retry with backoff) exists between the source and its consumers:

- **Cascading** — no bulkhead; failure propagates synchronously to all consumers
- **Bulkhead** — circuit breaker, queue, or async decoupling absorbs the failure; consumers degrade but don't fail
- **Fail-open** — consumer has an explicit fail-open policy (documented in architecture docs or ADR)
- **Fail-closed** — consumer fails entirely when source is unavailable

---

## Evidence Extraction

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Component list and types | `component-cli.ts list` → `name`, `type` | `docs/components/README.md`, then ARCHITECTURE.md Section 5 |
| Integration topology | `docs/05-integration-points.md` | ARCHITECTURE.md Section 5 |
| Data flow paths | `docs/04-data-flow-patterns.md` | ARCHITECTURE.md Section 4 |
| Circuit breakers / timeouts | `docs/08-scalability-and-performance.md` + per-component `.md` files | ARCHITECTURE.md Section 8 |
| Fail-open / fail-closed policies | ADRs (search for "fail-open", "timeout", "circuit") + `docs/07-security-architecture.md` | |
| MTTR estimates | `docs/09-operational-considerations.md` | ADRs referencing RTO |
| Queue / DLQ topology | `docs/04-data-flow-patterns.md` | ARCHITECTURE.md Section 4 |

---

## Report Sections (in order)

1. **Executive Summary** — number of High-Blast components, worst cascade path, whether bulkheads exist at critical hops, one-line verdict

2. **High-Blast Components Table** — components with fan-out > 3 (ordered by total blast fan-out descending)

   ```
   # | Component | Tier | Direct Consumers | Indirect Consumers | Total Blast Fan-out | Cascade Risk | Bulkhead Present
   ```
   - `#` = B1, B2, B3 … (B-prefix, sequential in fan-out order). The `⚡ SPOF+Blast` marker, when it applies, follows the id in the same cell — `B1 ⚡` — and the SPOF id follows the component name: `` `Ingestion` (SPOF D2) ``
   - `Tier` = S1 / S2 / S3 / S4 (Blast Severity Tiers above)
   - `Cascade Risk` = Cascading / Bulkhead / Fail-open / Fail-closed
   - `Bulkhead Present` = Yes (with mechanism name) / No

3. **Isolated Components Table** — components whose failure is fully contained (fan-out = 0 or Isolated tier)

   ```
   Component | Type | Why Isolated
   ```

4. **Cascade Paths — Top 3 Worst Scenarios** — for the top 3 highest-severity source nodes, draw a Mermaid flowchart showing the cascade:

   ```mermaid
   flowchart TB
     A[Component A fails] --> B[Consumer B — cascading]:::cascading
     B --> C[Consumer C — cascading]:::cascading
     B --> D[Consumer D — fail-open, contained]:::contained
     A --> E[Consumer E — bulkhead, contained]:::contained
     classDef cascading fill:#e57373,stroke:#c62828,color:#000,stroke-width:2px
     classDef contained fill:#81c784,stroke:#2e7d32,color:#000,stroke-width:2px
   ```
   Apply `:::cascading` to nodes whose failure propagates (no bulkhead / fail-closed consumers) and `:::contained` to nodes whose failure is absorbed (bulkhead, fail-open, circuit breaker). The `classDef` palette is theme-agnostic — the explicit `color:#000` keeps labels readable in both light and dark Mermaid renderers.

   **Design Language governed mode** (when `[design_language_dir]/llms-mermaid.txt` exists): the contract's **syntax layer** binds this block — `flowchart` never `graph`, direction `TB` never `TD` (`M-01`/`M-02`), quoting per `M-05`/`M-06`, spaced `-->` operators (`M-08`/`M-10`), the 200-character ceiling (`M-15`) — and the block opens with the comment `%% Analysis exhibit — not a registered view; no Diagram ID`. The **view-conformance layer does not**: this is an analysis exhibit, not a registered view, and its cascading/contained colour encoding is the finding itself — do not replace it with the four-role palette (`M-07`/`M-14` govern topology views, not exhibits).

5. **MTTR Estimate by Component** — if `docs/09-operational-considerations.md` or ADRs document RTO/MTTR, surface them per component. If not documented, mark `[NOT DOCUMENTED]`.

   ```
   Component | Failure Type | Estimated MTTR | Source
   ```

6. **Bulkhead Recommendations** — for each High-Blast component that lacks a bulkhead: recommended pattern (circuit breaker, async queue, timeout + fallback), the trade-off, and the ADR reference (if an ADR accepted the current state)

7. **Summary Verdict** — overall blast radius posture: are the most critical components (SPOF crossreference: C-prefix from SPOF analysis if available) also the highest blast-radius nodes? That intersection is the most dangerous combination.

8. **Documentation Gaps** — missing integration edges, missing MTTR data, components with no Communicates via metadata

---

## SPOF Cross-Reference

If `analysis/SPOF-<today>.md` or `analysis/SPOF-*.md` (any date) exists, read it and cross-reference:
- Any SPOF Critical (C-prefix) or Degradation (D-prefix) component that is ALSO a High-Blast node should be marked `⚡ SPOF+Blast` in the High-Blast Components table — the marker after the id in the `#` cell (`B1 ⚡`), the SPOF id after the component name (`` `Ingestion` (SPOF D2) ``)
- Add a note in the Executive Summary if any C-prefix SPOF has fan-out > 3 (the intersection of "single point of failure" and "high blast radius" represents maximum risk concentration)

This cross-reference is optional enrichment — if no SPOF report exists, proceed without it.

---

## Heat Map

Build an **ASCII 4×4 heat map** using axes:
- **Y-axis (vertical)**: Fan-out (1-hop) — LOW = fan-out 0–1 (bottom), HIGH = fan-out ≥ 5 (top)
- **X-axis (horizontal)**: Cascade Risk — LOW = fully bulkheaded (left), HIGH = fully cascading (right)

Components plotted by their ID (`index` from `component-cli.ts list`).

```
          HIGH FAN-OUT
               │
  [bulkheaded] ┼──────────── [cascading+high fan-out]
               │              ← most dangerous zone
  [bulkheaded] ┼──────────── [cascading+medium fan-out]
               │
  [isolated]   ┼──────────── [cascading+low fan-out]
               │
          LOW FAN-OUT
      BULKHEADED ─────────── CASCADING
               cascade risk →
```
