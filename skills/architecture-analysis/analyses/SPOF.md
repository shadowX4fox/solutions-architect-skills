# SPOF Analysis Spec — Single Points of Failure

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Single Point of Failure (SPOF) analysis. It classifies every component in the architecture by failure severity, builds a heat map, and generates prioritized remediation recommendations.

**Output file**: `analysis/SPOF-<YYYY-MM-DD>.md`

---

## Classification Model

Every component (from `docs/components/README.md` and `docs/components/**/*.md`) is evaluated against the classification rules below and assigned to exactly ONE category. If a component passes all checks for a category, it is NOT a SPOF in that category and is omitted from the findings table.

### Category C — Critical SPOF (Full Outage)

A component is **Critical** when ALL of the following are true:
1. It lies on the **only entry path** for one or more client-facing flows (no parallel path exists)
2. Its failure causes **100% service unavailability** for the affected flows
3. There is **no automatic failover** in under 60 seconds OR no failover at all

**Evidence to look for:**
- `docs/05-integration-points.md` — is this the sole ingress/egress?
- `docs/08-scalability-and-performance.md` — HPA min=1 with no alternative instance?
- `docs/09-operational-considerations.md` — RTO, failover, DR strategy
- ADRs — decisions that accepted SPOF risk (e.g., "no multi-region", "Redis removed")
- `docs/07-security-architecture.md` — external IdP with no local fallback?

**Table columns** (one row per Critical SPOF):
```
# | Component | Failure Scenario | Impact | Current Mitigation
```
- `#` = C1, C2, C3 … (C-prefix, sequential)
- `Failure Scenario` = specific failure mode (pod crash loop, regional outage, IdP degradation)
- `Impact` = percentage of affected traffic + reason
- `Current Mitigation` = what architecture docs say is in place; "None" if nothing

### Category D — Degradation SPOF (Partial / Silent Failure)

A component is **Degradation** when its failure causes:
- Partial feature loss (a subset of capabilities breaks but core still works), OR
- Silent failure (the system appears functional but produces incorrect results), OR
- SLO breach (latency, error rate, or availability falls below the committed target)

**Evidence to look for:**
- Components removed for cost savings without a fallback (check ADRs — "Redis removed")
- Services that do not have a graceful degradation mode (fail-open vs. fail-closed)
- Background jobs whose lag or failure is invisible to users (DLQ without alerting)
- Read replicas or caches whose loss forces every read to hit the primary

**Table columns** (one row per Degradation SPOF):
```
# | Component | Failure Scenario | Impact | Current Mitigation
```
- `#` = D1, D2, D3 … (D-prefix, sequential)

### Category O — Operational SPOF (Deployment / Observability)

A component is **Operational** when its failure does not affect live traffic but:
- Blocks all deployments and rollbacks
- Makes the system unobservable (blind to state)
- Makes infrastructure recovery manual or impossible

**Evidence to look for:**
- `docs/09-operational-considerations.md` — CI/CD pipeline dependencies, monitoring tools
- Single observability platform with no backup telemetry
- Terraform or IaC state backend with no replication/backup

**Table columns** (one row per Operational SPOF):
```
# | Component | Failure Scenario | Impact
```
(No mitigation column — operational SPOFs rarely have documented mitigations)

---

## Heat Map

Build a **3×3 ASCII heat map** using axes:
- **Y-axis (vertical)**: Impact — LOW (bottom) to HIGH (top)
- **X-axis (horizontal)**: Likelihood — LOW (left) to HIGH (right)

**Scoring rules:**
- **Impact**: HIGH = full outage (C) or major feature loss (D); MEDIUM = partial degradation; LOW = operational only (O)
- **Likelihood**: HIGH = external SaaS dependency, single region; MEDIUM = managed service with SLA but past outages; LOW = zone-redundant within single vendor

Plot finding IDs (C1, D2, O1, …) at their coordinates. Multiple IDs can share a cell.

```
                HIGH IMPACT
                    │
  [...]  ───────────┼─────────── [...]
                    │
  [...]  ───────────┼─────────── [...]
                    │
  [...]  ───────────┼─────────── [...]
                    │
               LOW IMPACT
        LOW ────────┼──────────── HIGH
                LIKELIHOOD
```

---

## Report Sections (in order)

1. **Executive Summary** — total SPOF count by category, highest-severity finding, one-line verdict
2. **Critical SPOFs — Full Outage** — table (C-prefix findings)
3. **Degradation SPOFs — Partial / Silent Failures** — table (D-prefix findings)
4. **Operational SPOFs — Deployment / Observability** — table (O-prefix findings)
5. **Risk Heat Map** — ASCII grid
6. **Top 5 Remediation Recommendations** — ordered by (severity × feasibility); each cites finding ID + source file
7. **Summary Verdict** — architecture's resilience posture: what the zone/HA strategy covers vs. what it does not
8. **Documentation Gaps** — components where failover, RTO, or fallback data was absent from docs

---

## Gold-Standard Report Structure

The worked example below (Notification Inbox Platform v1.2.0) is the reference quality target. Every SPOF report should reach this level of specificity and citation.

```markdown
# Single Point of Failure Analysis — Notification Inbox Platform v1.2.0

**Analysis Date**: 2026-04-16
**Architecture Source**: ARCHITECTURE.md v1.2.0 (Status: Released)
**Analyst**: Architecture Analysis Skill

---

## Executive Summary
The architecture is zone-redundant within East US (3 AZs, AKS + PostgreSQL HA), but carries
6 critical SPOFs — failures that would cause full service outage — and 5 degradation SPOFs
that would produce partial or invisible failures. The most severe risk is the single-region
deployment with no failover region (C1, ADR-006).

## Critical SPOFs — Full Outage

| # | Component | Failure Scenario | Impact | Current Mitigation |
|---|-----------|-----------------|--------|-------------------|
| C1 | Azure East US Region | Regional outage | 100% — no failover region | None. ADR-006 accepted this as Tier 3 risk |
| C2 | Gatekeeper (5.1) | Pod crash loop / misconfigured HPA | All client traffic blocked — only entry point | HPA 3–15 pods, zone-spread, but no secondary entry path |
| C3 | Auth0 | Auth0 service degradation or network cut | All JWT validation fails → 100% of authenticated requests blocked | No fallback issuer, no offline JWT validation cache |
| C4 | PostgreSQL Flexible Server (5.5) | Primary instance failure | All reads and writes fail — sole data store (Redis removed in ADR-013) | Zone-redundant HA with <60s automatic failover — window is a hard outage |
| C5 | Confluent Kafka | Broker outage or topic failure | No new notifications can be ingested; Materializer starved | Multi-zone managed, but external dependency — no local fallback queue |
| C6 | AKS Control Plane | Azure AKS control plane failure | No new pod scheduling, autoscaling disabled, rolling deployments frozen | Azure SLA covers this but no self-managed fallback |

## Degradation SPOFs — Partial / Silent Failures

| # | Component | Failure Scenario | Impact | Current Mitigation |
|---|-----------|-----------------|--------|-------------------|
| D1 | No Caching Layer | PostgreSQL latency spike under read pressure | P95 read SLO breach (>2s) — no fallback layer; every request hits DB directly | ADR-013 removed Redis. Read replicas help but don't protect against connection saturation |
| D2 | Badge Service (5.8) | Pod failure or counter corruption | Unread count incorrect/unavailable; WebSocket push stops for all users | Daily reconciliation job corrects drift — but gap window is unknown and there's no fallback count source |
| D3 | WebSocket (Badge Service) | Badge Service overwhelmed by connections | Real-time badge updates stop — no SSE or polling fallback for clients | HPA scales on connection count, but no graceful degradation path to polling |
| D4 | Azure APIM | APIM outage | Notification Preferences Service unreachable externally | Preferences Service has 300ms timeout + fail-open (ADR-017) — preferences silently default, notifications still delivered |
| D5 | Inbox Materializer (5.3) | Consumer group lag or crash | Notification writes stop; inbox goes stale silently | DLQ (notifications.dlq) captures events, but there's no alerting SLO defined for consumer lag >5s beyond the metric itself |

## Operational SPOFs — Deployment / Observability

| # | Component | Failure Scenario | Impact |
|---|-----------|-----------------|--------|
| O1 | Azure DevOps | Pipeline outage | All deployments and rollbacks blocked |
| O2 | Dynatrace | Agent failure | Blind to system state — sole observability platform (ADR-012), no secondary telemetry |
| O3 | Terraform State Backend | Azure Storage account corruption | IaC state lost — manual infrastructure recovery required |

## Risk Heat Map

[... ASCII grid ...]

## Top 5 Remediation Recommendations

1. **Multi-region or warm standby (C1)** — Even a passive read replica in West US + Azure Traffic Manager would reduce RTO from "indefinite" to minutes.
2. **Auth0 circuit breaker with token caching (C3)** — Cache validated JWT claims in Gatekeeper (in-memory with short TTL). A 60-second token cache survives transient Auth0 blips.
3. **Reintroduce read cache for PostgreSQL (D1)** — ADR-013 removed Redis to save $14–21K/year, but this introduced a latency SPOF. A lightweight read-through cache on Inbox Hub would protect the <2s SLO under load spikes.
4. **Badge Service degraded-mode fallback (D2/D3)** — If Badge Service is unavailable, Inbox UX should fall back to a client-side unread count and switch from WebSocket to polling.
5. **Materializer consumer lag alert with SLO (D5)** — Define a formal SLO for Kafka lag (<5s) with an alerting threshold and runbook. DLQ alone is not a recovery plan.

## Summary Verdict

The architecture is resilient within a zone failure (the intended design for Tier 3 Secondary),
but not resilient to region-level or external dependency failures. The removal of Redis (ADR-013)
and the single-region commitment (ADR-006) are the two architectural decisions that carry the
most concentrated SPOF risk going forward.
```

---

## Evidence Extraction Priority

When reading architecture docs, look in this priority order for SPOF-relevant data:

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Component list | `docs/components/README.md` | ARCHITECTURE.md Section 5 |
| Failover / HA strategy | `docs/09-operational-considerations.md` | ARCHITECTURE.md Section 9 |
| HPA config / replicas | `docs/components/**/*.md` C4 metadata block | `docs/08-scalability-and-performance.md` |
| External dependency risk | `docs/05-integration-points.md` | ARCHITECTURE.md Section 5 |
| Removed-for-cost decisions | `adr/ADR-*.md` — look for "removed", "deprecated", "cost" | ARCHITECTURE.md Section 12 |
| DR / RTO targets | `docs/09-operational-considerations.md` | ARCHITECTURE.md Section 9 |
| Auth / IdP decisions | `docs/07-security-architecture.md` + `adr/` | ARCHITECTURE.md Section 7 |
| Observability tools | `docs/09-operational-considerations.md` | ARCHITECTURE.md Section 9 |
