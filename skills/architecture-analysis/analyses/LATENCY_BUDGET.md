# Latency Budget Analysis Spec

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Latency Budget analysis. It decomposes the documented end-to-end SLO into per-hop allocations for every user-facing flow, identifies hops that are over budget or untracked, and generates recommendations to protect the committed latency targets.

**Output file**: `analysis/LATENCY-BUDGET-<YYYY-MM-DD>.md`

---

## Inputs

Collect the following before applying the classification model:

| Input | Primary source | Fallback |
|-------|---------------|---------|
| End-to-end p95 / p99 SLO (ms) | `docs/08-scalability-and-performance.md` — SLO/SLA section | ARCHITECTURE.md Section 8 |
| User-facing flows | `docs/04-data-flow-patterns.md` — named flows | ARCHITECTURE.md Section 4 |
| Per-component p95 latency | `docs/components/**/*.md` — "Performance Targets" or "SLO" section | `docs/08-scalability-and-performance.md` component tables |
| Integration / external API latency | `docs/05-integration-points.md` — "Latency" or "SLA" columns | Component `.md` files for the calling service |
| DB query p95 latency | `docs/components/**/*.md` for DB components | `docs/08-scalability-and-performance.md` |
| Network/gateway overhead | `docs/03-architecture-layers.md` or `docs/09-operational-considerations.md` | ARCHITECTURE.md Section 3 |

If no end-to-end SLO is documented, the entire report defers to the Documentation Gaps section — do not invent a budget.

---

## Flow Decomposition

For each user-facing flow identified in the inputs:

1. **List the hops** in request order: client → gateway → service A → (DB / cache / queue) → service B → external API → response
2. **Assign a p95 ms value** to each hop from the documented sources above
3. **Sum the hop values** to get the documented end-to-end p95
4. **Compare to the SLO ceiling** — flag over-budget flows

### Hop Classification

Classify each hop in each flow:

| Class | Definition |
|-------|-----------|
| **Within Budget** | Hop p95 ≤ its proportional SLO share (SLO ÷ hop count is a reasonable default share) |
| **Tight** | Hop p95 is within 20% above its proportional share but total flow still ≤ SLO |
| **Over Budget** | Hop p95 alone exceeds its proportional share AND the total flow sum exceeds the SLO |
| **Untracked** | No p95 value is documented for this hop — must appear in Documentation Gaps |

**Proportional share default**: if the architecture does not specify per-hop budgets, divide the SLO evenly across documented hops. Note this assumption explicitly in the report.

### Tail-Latency Variance Flag

For any hop where both p95 and p99 are documented: if p99/p95 > 3×, flag it as a **Tail-Latency Hotspot** — high variance indicates instability under load.

---

## Per-Flow Budget Table

For each flow, produce a table:

```
Flow: <Flow Name> — SLO: <p95 ms> end-to-end

Hop # | Component | Role | p95 (ms) | % of SLO | Status
```

- `Role` = gateway / service / database / cache / external-API / queue
- `Status` = Within Budget / Tight / Over Budget / Untracked
- Footer row: `TOTAL | — | — | <sum ms> | <sum%> | <PASS / OVER BUDGET>`

### ASCII Budget Bar

Below each flow table, render an ASCII Gantt-style budget bar showing the SLO ceiling and each hop's contribution:

```
<Flow Name> (SLO: 500ms)
|──────────────────────────────────────────────────| 500ms

Gateway   [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20ms  (4%)
Service A [████████████░░░░░░░░░░░░░░░░░░░░░░░░░]  80ms  (16%)
Postgres  [████████████████████░░░░░░░░░░░░░░░░░] 180ms  (36%)
Service B [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  60ms  (12%)
Auth0     [████████████████░░░░░░░░░░░░░░░░░░░░░] 140ms  (28%)
─────────────────────────────────────────────────
TOTAL                                              480ms  (96%) ✅ within SLO
```

If any hop is Over Budget, mark it with ❌ and the total row with ❌.

---

## Hops Over Budget Summary Table

Across all flows, collect all hops classified as **Over Budget**:

```
Flow | Hop # | Component | p95 (ms) | Proportional Share (ms) | Overage (ms) | Severity
```

- `Severity` = HIGH (overage > 50% of share), MEDIUM (20–50%), LOW (<20%)

---

## Tail-Latency Hotspots Table

```
Component | Flow(s) | p95 (ms) | p99 (ms) | p99/p95 Ratio | Risk
```

- `Risk` = HIGH (ratio > 5×), MEDIUM (3–5×)

---

## Report Sections (in order)

1. **Executive Summary** — number of flows analyzed, flows within SLO vs. over budget, worst offending hop, one-line verdict
2. **Per-Flow Budget Breakdown** — one sub-section per flow: budget table + ASCII bar
3. **Hops Over Budget** — consolidated summary table across all flows
4. **Tail-Latency Hotspots** — variance table (omit section if no p99 data documented)
5. **Top 5 Latency Recommendations** — ordered by (overage severity × user impact); each cites finding + source file
6. **Summary Verdict** — SLO posture: which flows are protected, which are at risk, which lack measurement
7. **Documentation Gaps** — hops with no documented p95 (Untracked), flows with no end-to-end SLO, missing p99 figures

---

## Evidence Extraction Priority

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| End-to-end SLO | `docs/08-scalability-and-performance.md` SLO table | ARCHITECTURE.md Section 8 |
| Named user flows | `docs/04-data-flow-patterns.md` | ARCHITECTURE.md Section 4 |
| Per-service p95 | Each `docs/components/**/*.md` perf section | `docs/08-scalability-and-performance.md` |
| External API latency SLA | `docs/05-integration-points.md` | Component `.md` files for calling service |
| DB / cache query latency | DB and cache component `.md` files | `docs/08-scalability-and-performance.md` |
| Gateway / ingress overhead | `docs/03-architecture-layers.md` | ARCHITECTURE.md Section 3 |
| p99 latency (for variance) | `docs/08-scalability-and-performance.md` | Component `.md` perf tables |
