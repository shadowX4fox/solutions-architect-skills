# Component Development Handoff — [COMPONENT_NAME]

<!-- managed by solutions-architect-skills:architecture-dev-handoff — do not edit manually -->

---

## Section 0 — Metadata

| Field | Value |
|-------|-------|
| Component Name | [COMPONENT_NAME] |
| Component Number | [COMPONENT_NUMBER] |
| Handoff Version | 1.0 |
| Generated | [GENERATION_DATE] |
| Status | Ready |
| Architect | [ARCHITECT_NAME or "Not specified"] |
| Source Component Doc | [docs/components/NN-component-name.md](../components/[COMPONENT_FILE]) |
| Architecture Doc | [ARCHITECTURE.md](../../ARCHITECTURE.md) |

---

## Section 1 — Component Overview

**Purpose**: [One or two sentences describing what this component does, written for a developer]

**Type**: [COMPONENT_TYPE — e.g., REST API Service, PostgreSQL Database, Kubernetes Deployment, Message Consumer]

**Architecture Layer**: [ARCHITECTURE_LAYER — e.g., Presentation, Business Logic, Data, Integration]

**Business Context**: [Which business use cases or user flows this component serves]

**Key Responsibilities**:
- [RESPONSIBILITY_1]
- [RESPONSIBILITY_2]
- [RESPONSIBILITY_3 or NOT DOCUMENTED — add to docs/components/NN-component-name.md]

---

## Section 2 — Scope and Boundaries

### In Scope (this component owns)
- [IN_SCOPE_1]
- [IN_SCOPE_2]

### Out of Scope (handled by other components)
- [OUT_OF_SCOPE_1 — handled by: COMPONENT_NAME]
- [OUT_OF_SCOPE_2 — handled by: COMPONENT_NAME]

### Upstream Consumers (who calls this component)
| Consumer | Protocol | Purpose |
|----------|----------|---------|
| [CONSUMER_NAME] | [PROTOCOL] | [PURPOSE] |

### Downstream Dependencies (what this component calls)
| Dependency | Protocol | Purpose |
|------------|----------|---------|
| [DEPENDENCY_NAME] | [PROTOCOL] | [PURPOSE] |

---

## Section 3 — API Contract

> Source: `docs/components/NN-*.md` (Endpoints section) + `docs/05-integration-points.md`

### Endpoints / Public Interface

[ENDPOINTS_TABLE_OR_DESCRIPTION or NOT DOCUMENTED — add to docs/components/NN-component-name.md]

### Request / Response Schemas

[REQUEST_RESPONSE_SCHEMAS or NOT DOCUMENTED]

### Error Codes

| HTTP Code / Error Code | Meaning | When Triggered |
|-----------------------|---------|----------------|
| [ERROR_CODE] | [MEANING] | [TRIGGER] |

### Versioning Strategy

[VERSIONING_STRATEGY or NOT DOCUMENTED — add to docs/05-integration-points.md]

### Authentication

[AUTH_MECHANISM — e.g., Bearer JWT, API Key, mTLS, None]

---

## Section 4 — Data Model

> Source: `docs/components/NN-*.md` (Schema section) + `docs/04-data-flow-patterns.md`

### Owned Entities

[OWNED_ENTITIES or NOT DOCUMENTED — add to docs/components/NN-component-name.md]

### Database / Collection Schema

[SCHEMA_DESCRIPTION or NOT DOCUMENTED]

### Relationships and Foreign Keys

[RELATIONSHIPS or NOT DOCUMENTED]

### Required Indexes

[INDEXES or NOT DOCUMENTED]

### Data Validation Rules

[VALIDATION_RULES or NOT DOCUMENTED]

> **Note**: The `ddl.sql` asset (if generated) provides the canonical DDL scaffold for this component.

---

## Section 5 — Integration Requirements

> Source: `docs/05-integration-points.md` + `docs/04-data-flow-patterns.md`

### External System Integrations

| System | Direction | Protocol | Auth | Retry Policy | Circuit Breaker |
|--------|-----------|----------|------|--------------|-----------------|
| [SYSTEM_NAME] | [inbound/outbound] | [PROTOCOL] | [AUTH] | [RETRY] | [CIRCUIT_BREAKER or NOT DOCUMENTED] |

### Async / Event-Driven Integrations

| Topic / Queue | Role | Message Format | Schema Location |
|---------------|------|---------------|-----------------|
| [TOPIC_NAME] | [producer/consumer] | [FORMAT] | [SCHEMA_FILE or NOT DOCUMENTED] |

---

## Section 6 — Security Requirements

> Source: `docs/07-security-architecture.md` + `compliance-docs/` (security contract, if present)

### Authentication

[AUTH_REQUIREMENTS or NOT DOCUMENTED — add to docs/07-security-architecture.md]

### Authorization / RBAC

| Role | Allowed Operations | Denied Operations |
|------|--------------------|-------------------|
| [ROLE] | [ALLOWED] | [DENIED or NOT DOCUMENTED] |

### Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| [DATA_TYPE] | [AT_REST_ENCRYPTION] | [IN_TRANSIT_ENCRYPTION] |

### Input Validation Requirements

[INPUT_VALIDATION or NOT DOCUMENTED]

### Sensitive Data Handling

[SENSITIVE_DATA_RULES or NOT DOCUMENTED]

---

## Section 7 — Performance Targets

> Source: `docs/08-scalability-and-performance.md` + `docs/components/NN-*.md` (Scaling section)

### Latency Targets

| Percentile | Target |
|------------|--------|
| p50 | [P50_TARGET or NOT DOCUMENTED] |
| p95 | [P95_TARGET or NOT DOCUMENTED] |
| p99 | [P99_TARGET or NOT DOCUMENTED] |

### Throughput

| Metric | Value |
|--------|-------|
| Peak TPS | [PEAK_TPS or NOT DOCUMENTED] |
| Sustained TPS | [SUSTAINED_TPS or NOT DOCUMENTED] |

### Resource Limits

| Resource | Request | Limit |
|----------|---------|-------|
| CPU | [CPU_REQUEST or NOT DOCUMENTED] | [CPU_LIMIT or NOT DOCUMENTED] |
| Memory | [MEMORY_REQUEST or NOT DOCUMENTED] | [MEMORY_LIMIT or NOT DOCUMENTED] |

### Scaling Configuration

| Parameter | Value |
|-----------|-------|
| Min Replicas | [MIN_REPLICAS or NOT DOCUMENTED] |
| Max Replicas | [MAX_REPLICAS or NOT DOCUMENTED] |
| Scale Trigger | [SCALE_TRIGGER or NOT DOCUMENTED] |

---

## Section 8 — Configuration and Environment

> Source: `docs/components/NN-*.md` (Configuration section) + `docs/09-operational-considerations.md`

### Configuration Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| [PARAM_NAME] | [DESCRIPTION] | [DEFAULT or —] | [Yes/No] |

### Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| [ENV_VAR] | [DESCRIPTION] | [EXAMPLE] |

### Feature Flags

[FEATURE_FLAGS or NOT DOCUMENTED]

### Per-Environment Values

| Parameter | Dev | Staging | Production |
|-----------|-----|---------|------------|
| [PARAM] | [DEV_VALUE] | [STAGING_VALUE] | [PROD_VALUE or NOT DOCUMENTED] |

---

## Section 9 — Observability

> Source: `docs/components/NN-*.md` (Monitoring section) + `docs/09-operational-considerations.md`

### Required Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| [METRIC_NAME] | [counter/gauge/histogram] | [DESCRIPTION] | [LABELS or NOT DOCUMENTED] |

### Log Format and Required Fields

[LOG_FORMAT or NOT DOCUMENTED — add to docs/09-operational-considerations.md]

**Required log fields**: [LOG_FIELDS or NOT DOCUMENTED]

### Health Check Endpoint

[HEALTH_CHECK_SPEC or NOT DOCUMENTED — e.g., GET /health → 200 OK with {"status": "ok"}]

### Alert Conditions

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| [ALERT_NAME] | [CONDITION] | [critical/warning] | [ACTION or NOT DOCUMENTED] |

### Dashboard Requirements

[DASHBOARD_REQUIREMENTS or NOT DOCUMENTED]

---

## Section 10 — Error Handling and Resilience

> Source: `docs/components/NN-*.md` (Failure Modes section) + `docs/08-scalability-and-performance.md`

### Failure Modes and Expected Behavior

| Failure Mode | Expected Behavior | Recovery |
|--------------|-------------------|---------|
| [FAILURE_MODE] | [BEHAVIOR] | [RECOVERY or NOT DOCUMENTED] |

### Retry Policy

[RETRY_POLICY or NOT DOCUMENTED]

### Fallback / Degraded Mode

[FALLBACK_BEHAVIOR or NOT DOCUMENTED]

### Circuit Breaker Configuration

[CIRCUIT_BREAKER_CONFIG or NOT DOCUMENTED]

---

## Section 11 — Technology Constraints

> Source: `docs/06-technology-stack.md` + `adr/` directory

### Required Technology

| Category | Technology | Version Constraint |
|----------|-----------|-------------------|
| Language | [LANGUAGE] | [VERSION or any] |
| Framework | [FRAMEWORK] | [VERSION or any] |
| Runtime | [RUNTIME] | [VERSION or any] |

### Required Libraries / Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| [LIBRARY] | [VERSION or NOT DOCUMENTED] | [PURPOSE] |

### Prohibited Technologies

[PROHIBITED_TECH or None documented]

### Coding Standards Reference

[CODING_STANDARDS or NOT DOCUMENTED — add to docs/06-technology-stack.md]

---

## Section 12 — Acceptance Criteria

> Synthesized from §3, §6, §7, §9, §10 + `docs/01-system-overview.md`

### Functional Acceptance Criteria

- [ ] [FUNCTIONAL_CRITERIA_1]
- [ ] [FUNCTIONAL_CRITERIA_2]
- [ ] [FUNCTIONAL_CRITERIA_3]

### Non-Functional Acceptance Criteria

- [ ] Latency: p95 ≤ [P95_TARGET or TBD]
- [ ] Availability: ≥ [AVAILABILITY_TARGET or NOT DOCUMENTED]
- [ ] All endpoints authenticated per §6 requirements
- [ ] All required metrics emitted per §9
- [ ] Health check endpoint responds within 200ms
- [ ] [ADDITIONAL_NFR or NOT DOCUMENTED]

### Definition of Done

- [ ] All functional acceptance criteria pass
- [ ] All non-functional acceptance criteria verified
- [ ] Unit test coverage ≥ [COVERAGE_TARGET or NOT DOCUMENTED]
- [ ] Integration tests pass against real dependencies (no mocks at integration layer)
- [ ] Security requirements validated (§6)
- [ ] Performance targets validated under load (§7)
- [ ] All deliverable assets committed and reviewed
- [ ] Observability verified: metrics emitting, logs structured, health check green
- [ ] PR reviewed and approved by architecture team
- [ ] Documentation updated if implementation deviates from this handoff

---

## Section 13 — Relevant ADRs

> Source: `adr/*.md` — entries that reference this component or its technology choices

| ADR # | Title | Decision | Implication for This Component |
|-------|-------|----------|-------------------------------|
| [ADR_NUMBER] | [ADR_TITLE] | [DECISION_SUMMARY] | [IMPLICATION or NOT DOCUMENTED] |

*If no ADRs reference this component: "No ADRs directly reference this component."*

---

## Section 14 — Deliverable Assets

Assets generated alongside this handoff document, scaffolded from architecture documentation.

| Asset | File | Description |
|-------|------|-------------|
[ASSETS_TABLE_ROWS or "| — | — | No assets generated for this component type. |"]

> Assets are located in `docs/handoffs/assets/[COMPONENT_FOLDER]/`
>
> Fields marked `# TODO:` require developer input. Fields populated from architecture docs are pre-filled.

---

## Section 15 — Open Questions and Assumptions

> Gaps detected during handoff generation — values not found in the architecture documentation.

[OPEN_QUESTIONS_LIST or "No gaps detected — all sections fully documented."]

**Format for each gap:**
- **Section N — [Section Name]**: [What is missing] → [Which architecture doc file to update]

---

*Generated by `solutions-architect-skills:architecture-dev-handoff` on [GENERATION_DATE]*
*Source: [ARCHITECTURE_FILE_PATH]*
