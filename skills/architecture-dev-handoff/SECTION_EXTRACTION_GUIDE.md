# Section Extraction Guide — Architecture Dev Handoff (TEMPLATE_VERSION 2.0.0)

This guide maps each handoff document section to the architecture source files from which data is extracted, and defines the extraction rules for each field. The handoff structure is **audience-segmented** into three role tracks (Dev / QA / Ops) and is **self-contained** — extracted values are embedded in the handoff itself, never replaced with "see X" links, because readers may not have access to the source architecture documentation.

---

## How to Use This Guide

1. For each handoff section being populated, read the **Primary Source** file(s) first. If the primary source lacks the data, check **Secondary Source** files.
2. **Embed values verbatim** — endpoints, schemas, env vars, perf targets, alerts, etc. The architecture-doc citations in the template (`> Source: docs/...`) are **provenance only**, never load-bearing. Never replace an embedded value with "see docs/X for details".
3. If data is still not found, write `[NOT DOCUMENTED — add to <recommended-file>]` and record the gap in section **D1** (Open Questions & Assumptions).
4. Never infer, guess, or use industry-standard defaults as substitutes for missing values.
5. Honor the **per-section length budgets** below — they reflect that content is embedded, not linked. Target total handoff document length is ≤ 500 lines after fill-in.
6. **C4 Level scope**: This guide applies exclusively to C4 Level 2 (Container) component files. C4 Level 1 (System) descriptor files are never processed as handoff targets. If a file's `**C4 Level:**` metadata is not `Container (L2)`, the dev-handoff skill rejects it before extraction begins.

### Old → new section identifier mapping (v1 → v2)

The 16-section v1 template has been collapsed into 8 audience-grouped sections. When migrating extraction logic or reading legacy comments, use this map:

| v1 (TEMPLATE_VERSION 1.0.0) | v2 (TEMPLATE_VERSION 2.0.0) |
|----------------------------|------------------------------|
| §1 Component Overview      | A1 (Overview part)          |
| §2 Scope and Boundaries    | A1 (Scope/Boundaries parts) |
| §11 Technology Constraints | A1 (Tech part) **and** C1 (Runtime part) |
| §13 Relevant ADRs          | A1 (ADR table)              |
| §3 API Contract            | A2 (API parts)              |
| §4 Data Model              | A2 (Data parts)             |
| §5 Integration Requirements| A3 (Integrations)           |
| §10 Error Handling         | A3 (dev-facing) **and** C2 (ops runbook) |
| §6 Security Requirements   | B1 (Security Checks)        |
| §7 Performance Targets     | B1 (latency/throughput) **and** C1 (resources/scaling) |
| §12 Acceptance Criteria    | B1 (Functional + DoD)       |
| §8 Configuration & Environment | C1 (Config + Env parts) |
| §9 Observability           | C2 (Metrics/Logs/Health/Alerts) |
| §14 Deliverable Assets     | C3                           |
| §15 Open Questions         | D1                           |

---

## Section 0 — Metadata + Role Quick Index

**Length budget**: ≤ 35 lines (metadata table + role-index table).

| Field | Source | Extraction Rule |
|-------|--------|-----------------|
| Component Name | `docs/components/NN-*.md` | First `# Heading` |
| Component Number | Filename prefix `NN-` | Format as `5.N` (e.g., `01` → `5.1`) |
| Generation Date | Payload frontmatter `generation_date:` | Use as-is — orchestrator already captured it |
| Architecture Version | `ARCHITECTURE.md` | Value of `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` comment; if absent, `unversioned` |
| Component Version | `docs/components/NN-*.md` | `**Component Version:**` field; if absent, `1.0.0` |
| Architect | `ARCHITECTURE.md` | Author field or document metadata; if absent, `Not specified` |
| Source Component Doc | Filename | Relative link `../components/NN-name.md` |

The **Role Quick Index** table is fixed text — copy it verbatim from the template. Do not modify the audience names or section IDs.

---

# PART A — FOR DEVELOPERS

## A1 — Overview, Scope, Tech & ADRs  [DEV]

**Length budget**: ≤ 60 lines (overview + scope + boundaries + tech + ADR table combined).

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Purpose | `docs/components/NN-*.md` | `docs/01-system-overview.md` | First paragraph or `**Purpose:**` field; if only a long block exists in the system overview, summarize to one or two sentences focusing on the component's role |
| Type | `docs/components/NN-*.md` | — | `**Type:**` field value |
| Key Responsibilities | `docs/components/NN-*.md` | — | `**Responsibilities:**` or `## Responsibilities` section; extract each bullet verbatim |
| In Scope | `docs/components/NN-*.md` | — | What this component explicitly owns (Responsibilities + owned data/behavior) |
| Out of Scope | `docs/components/NN-*.md` | `docs/03-architecture-layers.md` | `**Dependencies:**` or `**Calls:**` references → state which other components handle the out-of-scope concerns. Do NOT infer scope boundaries — only state what is explicitly documented |
| Upstream Consumers | `docs/05-integration-points.md` | `docs/components/NN-*.md` | All integration entries that show this component as the TARGET / receiver |
| Downstream Dependencies | `docs/components/NN-*.md` | `docs/05-integration-points.md` | `**Dependencies:**` or `**Calls:**` fields — each named component |
| Language / Framework / Runtime requirement | `docs/06-technology-stack.md` | `docs/components/NN-*.md` | Technology stack entry for this component; `**Technology:**` field in component doc. The **runtime version** (e.g., `Node 20.x`, `Python 3.12`) goes here for Dev consumption AND in C1 for Ops; embed in both — they serve different audiences |
| Required libraries | `docs/components/NN-*.md` | `docs/06-technology-stack.md` | `**Dependencies:**` or `**Libraries:**` field |
| Prohibited tech | `adr/` | `docs/06-technology-stack.md` | ADRs that explicitly reject a technology for this component's domain |
| Coding standards | `docs/06-technology-stack.md` | — | Coding standards or style-guide reference |

### ADR scanning rule (for the A1 ADR table)

Read every file in `adr/` (or the ADR section of `ARCHITECTURE.md` if consolidated). Include an ADR row in A1's ADR table if it meets ANY of:

1. The ADR title or body explicitly names this component.
2. The ADR covers a technology used by this component (from the Tech table above).
3. The ADR covers a pattern used by this component (event-driven, saga, CQRS, circuit breaker, etc.).
4. The ADR affects this component's architectural layer.

For each included ADR, extract: ADR number, Title, one-sentence Decision summary, and the specific Implication for this component (what the developer must implement or avoid).

---

## A2 — API & Data Contract  [DEV] [QA-CONTRACT]

**Length budget**: ≤ 100 lines (largest section — owns the full contract).

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Endpoints / Public Interface | `docs/components/NN-*.md` | `docs/05-integration-points.md` | `**Endpoints:**`, `**Routes:**`, or `## API` section; extract method + path + purpose + auth per row |
| Versioning Strategy | `docs/05-integration-points.md` | `adr/` | Versioning notes in integration points; ADRs for API versioning decisions |
| Request/Response Schemas | `docs/components/NN-*.md` | — | JSON/YAML schema blocks or field lists — embed verbatim, do not summarize |
| Error Codes | `docs/components/NN-*.md` | `docs/05-integration-points.md` | `**Error Codes:**` or `**Errors:**` section — one row per code |
| Owned Entities | `docs/components/NN-*.md` | — | `**Schema:**`, `**Tables:**`, `**Collections:**`, or `## Data Model` section |
| Database / Collection Schema | `docs/components/NN-*.md` | `docs/04-data-flow-patterns.md` | Embed table/collection definitions verbatim. If not explicit, write `NOT DOCUMENTED` |
| Relationships / FKs | `docs/components/NN-*.md` | `docs/04-data-flow-patterns.md` | `**Relationships:**` field or ER description |
| Required Indexes | `docs/components/NN-*.md` | — | `**Indexes:**` or `**Performance Indexes:**` field |
| Validation Rules | `docs/components/NN-*.md` | `docs/07-security-architecture.md` | `**Validation:**` field; security constraints on fields |

> A2 feeds the `openapi.yaml` and `ddl.sql` assets in C3 — see `ASSET_GENERATION_GUIDE.md § OpenAPI Spec` and `§ DDL Script`.

---

## A3 — Integrations & Failure Modes  [DEV] [OPS-CONTRIBUTES]

**Length budget**: ≤ 70 lines (integrations table + async table + failure-mode table).

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| External System Integrations | `docs/05-integration-points.md` | `docs/04-data-flow-patterns.md` | Filter all integration entries that mention this component; extract system, direction, protocol, auth, retry, circuit breaker |
| Retry Policy (this component → others) | `docs/05-integration-points.md` | `docs/08-scalability-and-performance.md` | `**Retry:**` or `**Resilience:**` fields in integration entries |
| Circuit Breaker (in failure-mode rows) | `docs/08-scalability-and-performance.md` | `docs/05-integration-points.md` | Circuit-breaker configuration for this component's outbound calls |
| Async Integrations | `docs/04-data-flow-patterns.md` | `docs/05-integration-points.md` | Event/message flows involving this component — topic, role (producer/consumer), format, schema |
| Failure Modes (developer view) | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | `**Failure Modes:**` or `**Error Handling:**` section. Extract code-level expected behavior + fallback. Operational recovery actions go in C2 instead |

> The async-integrations table feeds the `asyncapi.yaml` asset in C3 — see `ASSET_GENERATION_GUIDE.md § AsyncAPI Spec`.

---

# PART B — FOR QA

## B1 — Acceptance, Performance & Security Tests  [QA] [DEV-VERIFIES]

**Length budget**: ≤ 80 lines (functional checklist + perf table + security table + scenarios + DoD).

This section is **synthesized** from values already extracted in A1/A2/A3 and the security/perf architecture docs. Every check MUST derive from a documented value — never compose criteria from assumptions or industry standards.

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Functional Acceptance Criteria | `docs/components/NN-*.md` (Responsibilities) + A2 (endpoints) | `docs/01-system-overview.md` (use cases) | One bullet per responsibility, plus one per endpoint/behavior |
| Latency p50/p95/p99 | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | Per-component targets; if only global targets exist, use them and annotate `[GLOBAL — sourced from docs/08...]` |
| Peak / Sustained TPS | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | Throughput figures for this component |
| Availability target | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | SLO / uptime % |
| Authentication | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Auth mechanism (Bearer JWT, mTLS, API Key, etc.) — embed verbatim, do not summarize as "see security docs" |
| Authorization / RBAC | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Per-role permission rules that apply to this component |
| Encryption at rest | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Storage encryption requirement (e.g., `AES-256`, `KMS-managed`) |
| Encryption in transit | `docs/07-security-architecture.md` | `docs/05-integration-points.md` | TLS / mTLS policy for this component's communications |
| Input validation | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | Validation rules for data entering this component |
| Sensitive data handling | `docs/07-security-architecture.md` | `docs/components/NN-*.md` | PII / sensitive-field handling policy |
| Test coverage target | `docs/06-technology-stack.md` | `adr/` | Coverage policy. If not documented, write `NOT DOCUMENTED` |

The **Error & Resilience Scenarios** checklist and **Definition of Done** checklist are fixed-shape lists that reference A2 / A3 / C2 — copy them verbatim from the template; only the `[COVERAGE_TARGET]` placeholder needs filling.

---

# PART C — FOR OPS

## C1 — Deployment, Config & Resources  [OPS] [DEV-CONTRIBUTES]

**Length budget**: ≤ 70 lines (runtime + resources + scaling + config + env-vars + per-env values).

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Runtime / image | `docs/06-technology-stack.md` | `docs/components/NN-*.md` | Container image / runtime entry for this component |
| Runtime version | `docs/06-technology-stack.md` | `docs/components/NN-*.md` | Version constraint (e.g., `Node 20.x`, `OpenJDK 17`). Same value also embedded in A1 for Dev's reference |
| Base image constraints | `docs/09-operational-considerations.md` | `docs/06-technology-stack.md` | Base-image policy (e.g., `distroless`, `alpine`, organization-approved registry) |
| CPU / Memory request and limit | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | `**Resources:**` or `**Resource Limits:**` field |
| Min / Max replicas, Scale trigger | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | `**Scaling:**` field — replicas and HPA trigger |
| Configuration Parameters | `docs/components/NN-*.md` | — | `**Configuration:**` or `## Configuration` section; one row per param with description, default, required flag |
| Environment Variables | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Environment Variables:**` or `**Env Vars:**` field |
| Feature Flags | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Feature Flags:**` field; if absent, `NOT DOCUMENTED` |
| Per-Environment Values | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | Environment-specific configuration table; if global only, use the global value with annotation |

> C1 feeds `deployment.yaml` and `cronjob.yaml` assets — see `ASSET_GENERATION_GUIDE.md § Kubernetes Deployment Manifest`.

---

## C2 — Observability & Runbook  [OPS] [DEV-ALERTS]

**Length budget**: ≤ 70 lines (metrics + logging + health + alerts + dashboards + runbook table).

| Field | Primary Source | Secondary Source | Extraction Rule |
|-------|---------------|-----------------|-----------------|
| Required Metrics | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Monitoring:**`, `**Metrics:**`, or `## Observability` section — one row per metric (name, type, description, labels) |
| Log Format | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | Logging standard (e.g., JSON Lines with mandatory fields). Embed the format spec verbatim |
| Log Required Fields | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | List of mandatory fields (timestamp, level, request_id, etc.) |
| Health Check Endpoint | `docs/components/NN-*.md` | `docs/09-operational-considerations.md` | `**Health Check:**` field; if absent, `NOT DOCUMENTED` |
| Alerts | `docs/09-operational-considerations.md` | `docs/components/NN-*.md` | Alerting rules for this component — one row per alert (name, condition, severity, action) |
| Dashboards | `docs/09-operational-considerations.md` | — | Dashboard specifications |
| Failure Recovery (operational runbook) | `docs/components/NN-*.md` | `docs/08-scalability-and-performance.md` | For each failure mode listed in A3, embed the operational recovery action: which alert detects it, what on-call must do |
| Circuit Breaker config | `docs/08-scalability-and-performance.md` | `docs/components/NN-*.md` | Thresholds, half-open behavior, reset window |

The runbook table in C2 must align row-for-row with the failure-mode table in A3 — every failure mode in A3 needs a recovery row in C2 (mark `[NOT DOCUMENTED]` if recovery is not defined).

---

## C3 — Deliverable Assets  [OPS] [DEV]

**Length budget**: ≤ 25 lines (asset rows only).

This section lists the assets that the parallel `handoff-asset-generator` agent will produce in Stage 5B of the orchestration. Fill it deterministically from the payload's `asset_types[]` array — one row per token, using the filename map embedded in the agent's PHASE 1 system prompt under "Section C3 filename map".

Row format:
```
| [Display label] | assets/[component_index_position]-[component_slug]/[filename] | [One-line description] |
```

If `asset_types[]` is empty (skip-list component), write:
```
| — | — | No assets generated for this component type. |
```

The asset *content* is generated by `handoff-asset-generator`, not by the handoff-document agent. C3 only lists the filenames; the actual asset files are written in Stage 5B and may carry their own `# TODO: [NOT DOCUMENTED]` markers — those gaps are appended to D1 by the orchestrator in Stage 5C, after the handoff document is already written.

> Asset-content extraction rules (per `asset_type`) live in `ASSET_GENERATION_GUIDE.md`, bundled into `agents/generators/handoff-asset-generator.md`.

---

# APPENDIX

## D1 — Open Questions and Assumptions

**Length budget**: ≤ 30 lines (gap-list bullets).

Accumulate gaps throughout generation. For each `[NOT DOCUMENTED — ...]` encountered in A1–C2, add an entry here:

```
- **Section [ID] — [Section Name]**: [Field or value that is missing]
  → Recommended location: [docs/XX-file.md or adr/]
  → Impact: [Which aspect of implementation, testing, or deployment is blocked or undefined]
```

Sort by section ID order: A1, A2, A3, B1, C1, C2. C3 is deterministic and produces no gaps directly; asset-level gaps (`# TODO:` markers inside generated asset files) are appended by the orchestrator in Stage 5C, after this handoff document is already written.
