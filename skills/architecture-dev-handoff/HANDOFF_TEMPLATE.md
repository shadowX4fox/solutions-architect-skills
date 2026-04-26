# Component Development Handoff — [COMPONENT_NAME]

<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->
<!-- TEMPLATE_VERSION: 2.0.0 -->

This handoff is **self-contained**. Every fact a Dev / QA / Ops reader needs to do their job is embedded below. Architecture-doc paths shown as `> Source: docs/...` are provenance citations only — you do not need access to those files to use this handoff.

---

## Section 0 — Metadata

| Field | Value |
|-------|-------|
| Component Name | [COMPONENT_NAME] |
| Component Number | [COMPONENT_NUMBER] |
| Handoff Version | 1.0 |
| Generated | [GENERATION_DATE] |
| Architecture Version | [ARCHITECTURE_VERSION] |
| Component Version | [COMPONENT_VERSION] |
| Status | Ready |
| Architect | [ARCHITECT_NAME or NOT DOCUMENTED] |
| Source Component Doc | [docs/components/NN-component-name.md](../components/[COMPONENT_FILE]) |
| Architecture Doc | [ARCHITECTURE.md](../../ARCHITECTURE.md) |

### Role Quick Index

| Audience | Read first |
|----------|-----------|
| **Dev** (build) | A1 → A2 → A3 |
| **QA** (test) | B1 (uses A2 for the contract) |
| **Ops** (deploy & run) | C1 → C2 → C3 |

---

# PART A — FOR DEVELOPERS  [DEV]

## A1 — Overview, Scope, Tech & ADRs  [DEV]

> Source: `docs/components/NN-*.md` + `docs/06-technology-stack.md` + `adr/`

**Purpose**: [One or two sentences describing what this component does and why it exists]

**Type**: [COMPONENT_TYPE — e.g., REST API Service, PostgreSQL Database, Kubernetes Deployment, Message Consumer]

**Key Responsibilities**:
- [RESPONSIBILITY_1]
- [RESPONSIBILITY_2]
- [RESPONSIBILITY_3 or NOT DOCUMENTED — add to docs/components/NN-component-name.md]

### Scope

| In Scope (this component owns) | Out of Scope (handled elsewhere) |
|--------------------------------|----------------------------------|
| [IN_SCOPE_1] | [OUT_OF_SCOPE_1 — handled by: COMPONENT_NAME] |
| [IN_SCOPE_2] | [OUT_OF_SCOPE_2 — handled by: COMPONENT_NAME] |

### Boundaries

| Direction | Counterpart | Protocol | Purpose |
|-----------|------------|----------|---------|
| Upstream consumer | [CONSUMER_NAME] | [PROTOCOL] | [PURPOSE] |
| Downstream dependency | [DEPENDENCY_NAME] | [PROTOCOL] | [PURPOSE] |

### Technology Constraints

| Category | Technology | Version Constraint |
|----------|-----------|-------------------|
| Language | [LANGUAGE] | [LANGUAGE_VERSION or NOT DOCUMENTED] |
| Framework | [FRAMEWORK] | [FRAMEWORK_VERSION or NOT DOCUMENTED] |
| Required libraries | [LIBRARIES or NOT DOCUMENTED] | — |
| Prohibited tech | [PROHIBITED_TECH or NONE] | — |
| Coding standards | [CODING_STANDARDS or NOT DOCUMENTED] | — |

### Relevant ADRs

| ADR # | Title | Decision | Implication for this component |
|-------|-------|----------|-------------------------------|
| [ADR_NUMBER] | [ADR_TITLE] | [DECISION_SUMMARY] | [IMPLICATION or NOT DOCUMENTED] |

*If no ADRs apply: "No ADRs directly reference this component."*

---

## A2 — API & Data Contract  [DEV] [QA-CONTRACT]

> Source: `docs/components/NN-*.md` + `docs/05-integration-points.md` + `docs/04-data-flow-patterns.md`

This section is the **canonical contract** Dev implements and QA validates. Reproduce values verbatim.

### Endpoints / Public Interface

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| [METHOD] | [PATH] | [PURPOSE] | [AUTH or NOT DOCUMENTED] |

**Versioning strategy**: [VERSIONING_STRATEGY or NOT DOCUMENTED — add to docs/05-integration-points.md]

### Request / Response Schemas

[REQUEST_RESPONSE_SCHEMAS or NOT DOCUMENTED — add to docs/components/NN-component-name.md]

### Error Codes

| Code | Meaning | When triggered |
|------|---------|----------------|
| [ERROR_CODE] | [MEANING] | [TRIGGER] |

### Owned Entities

[OWNED_ENTITIES or NOT DOCUMENTED — add to docs/components/NN-component-name.md]

### Database / Collection Schema

[SCHEMA_DESCRIPTION or NOT DOCUMENTED]

### Relationships, Indexes, Validation

| Aspect | Detail |
|--------|--------|
| Foreign keys / relationships | [RELATIONSHIPS or NOT DOCUMENTED] |
| Required indexes | [INDEXES or NOT DOCUMENTED] |
| Validation rules | [VALIDATION_RULES or NOT DOCUMENTED] |

> The `openapi.yaml` and `ddl.sql` assets in C3 are scaffolds derived from this section.

---

## A3 — Integrations & Failure Modes  [DEV] [OPS-CONTRIBUTES]

> Source: `docs/05-integration-points.md` + `docs/04-data-flow-patterns.md` + component file failure modes

### External System Integrations

| System | Direction | Protocol | Auth | Retry Policy | Circuit Breaker |
|--------|-----------|----------|------|--------------|-----------------|
| [SYSTEM_NAME] | [in/out] | [PROTOCOL] | [AUTH] | [RETRY] | [CIRCUIT_BREAKER or NOT DOCUMENTED] |

### Async / Event-Driven Integrations

| Topic / Queue | Role | Message Format | Schema |
|---------------|------|---------------|--------|
| [TOPIC_NAME] | [producer/consumer] | [FORMAT] | [SCHEMA_FILE or NOT DOCUMENTED] |

### Failure Modes (developer view)

What the code must handle gracefully:

| Failure Mode | Expected behavior in code | Fallback / degraded mode |
|--------------|--------------------------|------------------------|
| [FAILURE_MODE] | [BEHAVIOR] | [FALLBACK or NOT DOCUMENTED] |

**Retry policy (this component → others)**: [RETRY_POLICY or NOT DOCUMENTED]

> Operational recovery actions (alerts, on-call runbook) live in C2.

---

# PART B — FOR QA  [QA]

## B1 — Acceptance, Performance & Security Tests  [QA] [DEV-VERIFIES]

> Source: synthesized from A1/A2/A3 + `docs/07-security-architecture.md` + `docs/08-scalability-and-performance.md`

This is the QA work plan. Every check derives from a documented architecture value. Use A2 as the reference for API/data contract details.

### Functional Acceptance Criteria

- [ ] [FUNCTIONAL_CRITERIA_1]
- [ ] [FUNCTIONAL_CRITERIA_2]
- [ ] [FUNCTIONAL_CRITERIA_3]

### Performance Targets to Validate

| Metric | Target | Test type |
|--------|--------|-----------|
| Latency p50 | [P50_TARGET or NOT DOCUMENTED] | Load test |
| Latency p95 | [P95_TARGET or NOT DOCUMENTED] | Load test |
| Latency p99 | [P99_TARGET or NOT DOCUMENTED] | Load test |
| Peak TPS | [PEAK_TPS or NOT DOCUMENTED] | Stress test |
| Sustained TPS | [SUSTAINED_TPS or NOT DOCUMENTED] | Soak test |
| Availability | [AVAILABILITY_TARGET or NOT DOCUMENTED] | SLO measurement |

### Security Checks

| Area | Requirement | Verify by |
|------|------------|-----------|
| Authentication | [AUTH_REQUIREMENTS or NOT DOCUMENTED] | Reject unauthenticated requests |
| Authorization / RBAC | [RBAC_RULES or NOT DOCUMENTED] | Per-role permission matrix |
| Encryption at rest | [AT_REST_ENCRYPTION] | Storage configuration inspection |
| Encryption in transit | [IN_TRANSIT_ENCRYPTION] | TLS / mTLS handshake check |
| Input validation | [INPUT_VALIDATION or NOT DOCUMENTED] | Negative-path test cases |
| Sensitive data handling | [SENSITIVE_DATA_RULES or NOT DOCUMENTED] | PII redaction in logs |

### Error & Resilience Scenarios

- [ ] All error codes from A2 return correct status code + payload structure
- [ ] Each failure mode in A3 produces the documented fallback behaviour
- [ ] Retry policy fires under transient downstream failures (verify via fault injection)
- [ ] Circuit breaker opens at the documented threshold (if A3 specifies one)

### Definition of Done

- [ ] All functional acceptance criteria pass
- [ ] All performance targets met under load
- [ ] All security checks pass
- [ ] Unit-test coverage ≥ [COVERAGE_TARGET or NOT DOCUMENTED]
- [ ] Integration tests pass against real dependencies (no mocks at the integration layer)
- [ ] Observability verified per C2: metrics emitting, logs structured, health check green
- [ ] All deliverable assets in C3 reviewed and committed
- [ ] PR reviewed and approved

---

# PART C — FOR OPS  [OPS]

## C1 — Deployment, Config & Resources  [OPS] [DEV-CONTRIBUTES]

> Source: `docs/components/NN-*.md` + `docs/08-scalability-and-performance.md` + `docs/09-operational-considerations.md` + `docs/06-technology-stack.md`

### Runtime

| Aspect | Value |
|--------|-------|
| Runtime / image | [RUNTIME or NOT DOCUMENTED] |
| Runtime version | [RUNTIME_VERSION or NOT DOCUMENTED] |
| Base image constraints | [BASE_IMAGE or NOT DOCUMENTED] |

### Resources & Scaling

| Resource | Request | Limit |
|----------|---------|-------|
| CPU | [CPU_REQUEST or NOT DOCUMENTED] | [CPU_LIMIT or NOT DOCUMENTED] |
| Memory | [MEMORY_REQUEST or NOT DOCUMENTED] | [MEMORY_LIMIT or NOT DOCUMENTED] |

| Scaling parameter | Value |
|-------------------|-------|
| Min replicas | [MIN_REPLICAS or NOT DOCUMENTED] |
| Max replicas | [MAX_REPLICAS or NOT DOCUMENTED] |
| Scale trigger | [SCALE_TRIGGER or NOT DOCUMENTED] |

### Configuration Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| [PARAM_NAME] | [DESCRIPTION] | [DEFAULT or —] | [Yes/No] |

### Environment Variables

| Variable | Description | Example value |
|----------|-------------|---------------|
| [ENV_VAR] | [DESCRIPTION] | [EXAMPLE] |

### Feature Flags

[FEATURE_FLAGS or NOT DOCUMENTED]

### Per-Environment Values

| Parameter | Dev | Staging | Production |
|-----------|-----|---------|------------|
| [PARAM] | [DEV_VALUE] | [STAGING_VALUE] | [PROD_VALUE or NOT DOCUMENTED] |

> The `deployment.yaml` / `cronjob.yaml` assets in C3 are scaffolds derived from this section.

---

## C2 — Observability & Runbook  [OPS] [DEV-ALERTS]

> Source: `docs/components/NN-*.md` + `docs/09-operational-considerations.md`

### Required Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| [METRIC_NAME] | [counter/gauge/histogram] | [DESCRIPTION] | [LABELS or NOT DOCUMENTED] |

### Logging

**Format**: [LOG_FORMAT or NOT DOCUMENTED — add to docs/09-operational-considerations.md]

**Required fields**: [LOG_FIELDS or NOT DOCUMENTED]

### Health Check

**Endpoint**: [HEALTH_CHECK_SPEC or NOT DOCUMENTED — add to docs/09-operational-considerations.md]

### Alerts

| Alert | Condition | Severity | Action / Runbook |
|-------|-----------|----------|------------------|
| [ALERT_NAME] | [CONDITION] | [critical/warning] | [ACTION or NOT DOCUMENTED] |

### Dashboards

[DASHBOARD_REQUIREMENTS or NOT DOCUMENTED]

### Failure Recovery (operational runbook)

What on-call must do when a failure mode from A3 fires:

| Failure mode | Detection (alert) | Recovery action |
|--------------|-------------------|-----------------|
| [FAILURE_MODE] | [ALERT_NAME or NOT DOCUMENTED] | [RECOVERY or NOT DOCUMENTED] |

**Circuit breaker config**: [CIRCUIT_BREAKER_CONFIG or NOT DOCUMENTED]

---

## C3 — Deliverable Assets  [OPS] [DEV]

Assets generated alongside this handoff. Each is a scaffold derived from architecture documentation; fields marked `# TODO:` require developer or ops input.

| Asset | File | Description |
|-------|------|-------------|
[ASSETS_TABLE_ROWS or "| — | — | No assets generated for this component type. |"]

> Assets live in `handoffs/assets/[COMPONENT_FOLDER]/`.

---

# APPENDIX

## D1 — Open Questions and Assumptions

> Gaps detected during handoff generation — values not found in the architecture documentation.

[OPEN_QUESTIONS_LIST or "No gaps detected — all sections fully documented."]

**Format for each gap:**
- **Section [ID] — [Section Name]**: [What is missing] → [Which architecture doc file to update]

---

*Generated by `sa-skills:architecture-dev-handoff` on [GENERATION_DATE]*
*Source: [ARCHITECTURE_FILE_PATH]*
