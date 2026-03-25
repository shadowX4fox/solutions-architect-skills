# Section Extraction Guide — Architecture Dev Handoff

This guide maps each handoff document section to the architecture source files from which data
is extracted, and defines the extraction rules for each field.

---

## How to Use This Guide

1. For each handoff section being populated, read the **Primary Source** file(s) first.
2. If the primary source lacks the data, check **Secondary Source** files.
3. If data is still not found, write `[NOT DOCUMENTED — add to <recommended-file>]` and record
   the gap in Section 15 (Open Questions & Assumptions).
4. Never infer, guess, or use industry-standard defaults as substitutes for missing values.
5. Always cite the source file in your extraction notes (for traceability).

---

## Section 0 — Metadata

| Field | Source | Extraction Rule |
|-------|--------|-----------------|
| Component Name | `docs/components/NN-*.md` | First `# Heading` |
| Component Number | Filename prefix `NN-` | Format as `5.N` (e.g., `01` → `5.1`) |
| Generation Date | System date | ISO format `YYYY-MM-DD` |
| Architect | `ARCHITECTURE.md` | Author field or document metadata; if absent, `Not specified` |
| Source Component Doc | Filename | Relative link `../components/NN-name.md` |

---

## Section 1 — Component Overview

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Purpose | `docs/components/NN-*.md` | — | First paragraph or `**Purpose:**` field |
| Type | `docs/components/NN-*.md` | — | `**Type:**` field value |
| Architecture Layer | `docs/components/NN-*.md` | `docs/03-architecture-layers.md` | `**Layer:**` field; if absent, infer from layer diagram only if explicit |
| Business Context | `docs/01-system-overview.md` | `docs/components/NN-*.md` | Use cases that reference this component by name |
| Key Responsibilities | `docs/components/NN-*.md` | — | `**Responsibilities:**` or `## Responsibilities` section; extract each bullet |

---

## Section 2 — Scope and Boundaries

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| In Scope | `docs/components/NN-*.md` | — | `**Responsibilities:**` list — what this component explicitly owns |
| Out of Scope | `docs/components/NN-*.md` | `docs/03-architecture-layers.md` | `**Dependencies:**` or `**Calls:**` fields reference other components → infer those components own those responsibilities |
| Upstream Consumers | `docs/05-integration-points.md` | `docs/components/NN-*.md` | Find all integration entries that show this component as the TARGET/receiver |
| Downstream Dependencies | `docs/components/NN-*.md` | `docs/05-integration-points.md` | `**Dependencies:**` or `**Calls:**` fields; find each named component |

---

## Section 3 — API Contract

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Endpoints / Public Interface | `docs/components/NN-*.md` | `docs/05-integration-points.md` | `**Endpoints:**`, `**Routes:**`, or `## API` section; extract method + path + description |
| Request/Response Schemas | `docs/components/NN-*.md` | — | JSON/YAML schema blocks or field lists in the component doc |
| Error Codes | `docs/components/NN-*.md` | `docs/05-integration-points.md` | `**Error Codes:**` or `**Errors:**` section |
| Versioning Strategy | `docs/05-integration-points.md` | `adr/` | Look for versioning notes in integration points; check ADRs for API versioning decisions |
| Authentication | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Auth mechanism per API or component; check both sources |

> If generating `openapi.yaml`, use all data extracted here as the primary input.
> See `ASSET_GENERATION_GUIDE.md § OpenAPI Spec`.

---

## Section 4 — Data Model

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Owned Entities | `docs/components/NN-*.md` | — | `**Schema:**`, `**Tables:**`, `**Collections:**`, or `## Data Model` section |
| Database Schema | `docs/components/NN-*.md` | `docs/04-data-flow-patterns.md` | Extract table/collection definitions; if not explicit, note as `NOT DOCUMENTED` |
| Relationships / FK | `docs/components/NN-*.md` | `docs/04-data-flow-patterns.md` | `**Relationships:**` field or ER description |
| Indexes | `docs/components/NN-*.md` | — | `**Indexes:**` or `**Performance Indexes:**` field |
| Validation Rules | `docs/components/NN-*.md` | `docs/07-security-architecture.md` | `**Validation:**` field; security constraints on fields |

> If generating `ddl.sql`, use all data extracted here as the primary input.
> See `ASSET_GENERATION_GUIDE.md § DDL Script`.

---

## Section 5 — Integration Requirements

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| External System Integrations | `docs/05-integration-points.md` | `docs/04-data-flow-patterns.md` | Filter all integration entries that mention this component; extract system name, direction, protocol, auth |
| Retry Policy | `docs/05-integration-points.md` | `docs/08-scalability-and-performance.md` | `**Retry:**` or `**Resilience:**` fields in integration entries |
| Circuit Breaker | `docs/08-scalability-and-performance.md` | `docs/05-integration-points.md` | Circuit breaker configuration for this component's outbound calls |
| Async Integrations | `docs/04-data-flow-patterns.md` | `docs/05-integration-points.md` | Event/message flows involving this component; extract topic name, role (producer/consumer), format |

> If generating `asyncapi.yaml`, use data from async integrations as the primary input.
> See `ASSET_GENERATION_GUIDE.md § AsyncAPI Spec`.

---

## Section 6 — Security Requirements

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Authentication | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Auth mechanism for this component's endpoints; check per-component overrides |
| Authorization / RBAC | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Role definitions and permissions that apply to this component |
| Encryption at Rest | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Storage encryption requirements for this component's data |
| Encryption in Transit | `docs/07-security-architecture.md` | `docs/05-integration-points.md` | TLS/mTLS requirements for this component's communications |
| Input Validation | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Validation rules for data entering this component |
| Sensitive Data Handling | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | PII/sensitive field handling policies |

**Compliance enrichment** (if `compliance-docs/` exists):
- Read `compliance-docs/SECURITY_ARCHITECTURE_*.md` → extract rows from the Compliance Summary table where Status = `Non-Compliant` or `Unknown` AND the requirement relates to this component → add to Section 6 as **"Compliance Gaps to Address"**.

---

## Section 7 — Performance Targets

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Latency (p50/p95/p99) | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | Per-component latency targets; if only global targets exist, use global and note it |
| Peak / Sustained TPS | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | Throughput figures for this component |
| CPU/Memory Limits | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | `**Resources:**` or `**Resource Limits:**` field |
| Scaling Config | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | `**Scaling:**` field — min/max replicas, HPA trigger |

> If generating `deployment.yaml` or `cronjob.yaml`, resource limits and replica config feed into the manifest.
> See `ASSET_GENERATION_GUIDE.md § Kubernetes Deployment Manifest`.

---

## Section 8 — Configuration and Environment

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Configuration Parameters | `docs/components/NN-*.md` | — | `**Configuration:**` or `## Configuration` section; extract each param with description and default |
| Environment Variables | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Environment Variables:**` or `**Env Vars:**` field |
| Feature Flags | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Feature Flags:**` field; if absent, write `NOT DOCUMENTED` |
| Per-Environment Values | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | Environment-specific configuration table; if global, note it applies to this component |

> If generating `deployment.yaml`, env vars from this section populate the container `env:` block.
> See `ASSET_GENERATION_GUIDE.md § Kubernetes Deployment Manifest`.

---

## Section 9 — Observability

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Required Metrics | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Monitoring:**`, `**Metrics:**`, or `## Observability` section |
| Log Format | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | Logging standards section; per-component override if present |
| Health Check Endpoint | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Health Check:**` field; if absent, write `NOT DOCUMENTED` |
| Alert Conditions | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | Alerting rules that reference this component |
| Dashboard Requirements | `docs/09-operational-considerations.md` | — | Dashboard specifications for this component |

**Compliance enrichment** (if `compliance-docs/` exists):
- Read `compliance-docs/SRE_ARCHITECTURE_*.md` → extract observability-related Non-Compliant/Unknown rows → add as **"SRE Compliance Gaps"** in Section 9.

---

## Section 10 — Error Handling and Resilience

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Failure Modes | `docs/components/NN-*.md` | — | `**Failure Modes:**` or `**Error Handling:**` section |
| Retry Policy | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | Retry configuration for this component's outbound calls |
| Fallback Behavior | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | Degraded mode or fallback behavior description |
| Circuit Breaker | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | Circuit breaker thresholds and behavior |

---

## Section 11 — Technology Constraints

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Required Language/Framework | `docs/06-technology-stack.md` | `docs/components/NN-*.md` | Technology stack entry for this component; `**Technology:**` field in component doc |
| Required Libraries | `docs/components/NN-*.md` | `docs/06-technology-stack.md` | `**Dependencies:**` or `**Libraries:**` field |
| Prohibited Technologies | `adr/` | `docs/06-technology-stack.md` | ADRs that explicitly reject a technology for this component's domain |
| Coding Standards | `docs/06-technology-stack.md` | — | Coding standards or style guide references |

**ADR scanning rule**: Scan all files in `adr/` for mentions of this component's name, its technology, or its domain. Include any ADR that has implementation implications for the development team.

**Compliance enrichment** (if `compliance-docs/` exists):
- Read `compliance-docs/DEVELOPMENT_ARCHITECTURE_*.md` → extract technology/tooling Non-Compliant/Unknown rows → add as **"Development Compliance Gaps"** in Section 11.

---

## Section 12 — Acceptance Criteria

This section is **synthesized** — not extracted directly from a single source.

**Functional criteria** — derive from:
- Component responsibilities (Section 1)
- API contract endpoints (Section 3): one criterion per endpoint or behavior
- Use cases in `docs/01-system-overview.md` that involve this component

**Non-functional criteria** — derive directly from:
- Latency targets in Section 7
- Availability targets in `docs/08-scalability-and-performance.md`
- Security requirements in Section 6
- Observability requirements in Section 9

**Coverage target** — look in `docs/06-technology-stack.md` or `adr/` for a test coverage policy.

---

## Section 13 — Relevant ADRs

**Scan rule**: Read every file in `adr/` (or the ADR section of `ARCHITECTURE.md` if consolidated). Include an ADR in this section if it meets ANY of these criteria:

1. The ADR title or body explicitly names this component
2. The ADR covers a technology used by this component (from Section 11)
3. The ADR covers a pattern used by this component (e.g., event-driven, saga, CQRS, circuit breaker)
4. The ADR affects this component's architectural layer

For each included ADR, extract:
- ADR number (from filename or header)
- Title
- Decision summary (one sentence)
- Specific implication for this component (what the developer must implement or avoid)

---

## Section 14 — Deliverable Assets

This section lists the assets generated. Populate after running the asset generation step.

For each generated asset file, add a row:
```
| [Asset Type] | [assets/NN-component-name/filename] | [One-line description] |
```

If no assets were generated (component type matched no asset rules), write:
```
| — | — | No assets generated for this component type. |
```

---

## Section 15 — Open Questions and Assumptions

Accumulate gaps throughout generation. For each `[NOT DOCUMENTED — ...]` encountered in Sections 1–14, add an entry here:

```
- **Section N — [Section Name]**: [Field or value that is missing]
  → Recommended location: [docs/XX-file.md or adr/]
  → Impact: [Which aspect of implementation is blocked or undefined]
```

Sort by section number. This gives the development team and architects a clear remediation checklist.
