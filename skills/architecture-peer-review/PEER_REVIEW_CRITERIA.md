# Peer Review Criteria

## Overview

This document defines all review checks for the `architecture-peer-review` skill, organized by depth level. Checks are **cumulative**:
- **Light** → runs STRUCT, NAMING, SECTIONS checks only
- **Medium** → runs Light + COHERENCE, TECH, INTEG, METRICS checks
- **Hard** → runs Medium + SCALE, SECURITY, PERF, OPS, ADR, TRADEOFF checks

---

## Severity Definitions

| Severity | Symbol | Meaning |
|----------|--------|---------|
| **Critical** | 🔴 | Architectural flaw that will cause system failure, data loss, or security breach in production. Must fix before implementation. |
| **Major** | 🟠 | Significant gap causing operational issues, performance degradation, or maintainability problems. Should fix. |
| **Minor** | 🟡 | Suboptimal choice that increases technical debt or reduces clarity. Consider fixing. |
| **Suggestion** | 🔵 | Enhancement opportunity that would improve the architecture. Nice to have. |

---

## Scoring Weights

| Category | Code | Weight | Depth Level |
|----------|------|--------|-------------|
| Structural Completeness | STRUCT | 0.10 | Light |
| Naming & Conventions | NAMING | 0.05 | Light |
| Section Completeness | SECTIONS | 0.10 | Light |
| Content Coherence | COHERENCE | 0.10 | Medium |
| Technology Alignment | TECH | 0.10 | Medium |
| Integration Soundness | INTEG | 0.10 | Medium |
| Metric Realism | METRICS | 0.05 | Medium |
| Scalability Design | SCALE | 0.10 | Hard |
| Security Posture | SECURITY | 0.10 | Hard |
| Performance Design | PERF | 0.05 | Hard |
| Operational Readiness | OPS | 0.05 | Hard |
| ADR Quality | ADR | 0.05 | Hard |
| Trade-off Honesty | TRADEOFF | 0.05 | Hard |

**Note**: When running Light depth, weights are renormalized to sum to 1.0 across the 3 active categories (STRUCT 0.40, NAMING 0.20, SECTIONS 0.40). Similarly for Medium (7 categories renormalized). Hard uses all 13 categories as listed.

---

## Scorecard Rating Bands

| Score Range | Rating Label | Meaning |
|-------------|-------------|---------|
| 9.0 – 10.0 | Production-ready | Ready for implementation |
| 7.5 – 8.9 | Minor improvements recommended | Proceed with tracked improvements |
| 5.0 – 7.4 | Significant gaps — address before implementation | Hold until gaps resolved |
| 0.0 – 4.9 | Major rework needed | Document requires substantial revision |

---

## Category Score Calculation

For each category:

1. Start with a score of 10.0
2. For each failed check in the category, deduct:
   - Critical finding: −2.5
   - Major finding: −1.5
   - Minor finding: −0.5
   - Suggestion (informational only, no deduction)
3. Floor at 0.0 — scores cannot go negative

**Overall score** = weighted average across all active category scores.

---

## LIGHT DEPTH CHECKS

### STRUCT — Structural Completeness

Checks that the document has the correct top-level structure.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| STRUCT-01 | All 12 required sections present | Critical | Sections 1–12 must all exist: Executive Summary, System Overview, Architecture Principles, Architecture Layers, Component Details, Data Flow Patterns, Integration Points, Technology Stack, Security Architecture, Scalability & Performance, Operational Considerations, Architecture Decision Records |
| STRUCT-02 | Architecture type comment present in Section 4 | Major | HTML comment `<!-- ARCHITECTURE_TYPE: {TYPE} -->` at top of Section 4. Valid types: MICROSERVICES, META, 3-TIER, N-LAYER, BIAN |
| STRUCT-03 | Document Index or navigation present | Minor | For monolithic files: Document Index section with line range references. For multi-file: ARCHITECTURE.md serves as navigation index with links to docs/ files |
| STRUCT-04 | Multi-file structure follows convention | Minor | If multi-file detected: ARCHITECTURE.md as nav index, `docs/NN-section-name.md` numbered files, `docs/components/NN-component-name.md` per-component files (or `docs/components/<system>/NN-*.md` for multi-system) |
| STRUCT-05 | ADR directory or section exists | Major | Either `adr/` directory with at least one ADR file, OR Section 12 contains inline ADR content. Empty Section 12 with no content is a major gap |

---

### NAMING — Naming & Conventions

Checks that naming follows the established conventions.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| NAMING-01 | Section names match standard names exactly | Minor | Case-sensitive match: "Executive Summary", "System Overview", "Architecture Principles", "Architecture Layers", "Component Details", "Data Flow Patterns", "Integration Points", "Technology Stack", "Security Architecture", "Scalability & Performance", "Operational Considerations", "Architecture Decision Records" |
| NAMING-02 | Multi-file docs/ filenames follow convention | Minor | Files must follow `NN-kebab-case.md` pattern (e.g., `01-executive-summary.md`, `05-component-details.md`) |
| NAMING-03 | Component files follow naming convention | Minor | C4 L2 container files in `docs/components/` (or system subfolders) must follow `NN-kebab-case-name.md` pattern. C4 L1 system descriptor files at root use `kebab-case-name.md` (no NN- prefix, matching a subfolder name). |
| NAMING-04 | ADR files follow naming convention | Minor | ADR files must follow `NNN-kebab-case.md` pattern (e.g., `001-architecture-type-selection.md`) |
| NAMING-05 | Section numbering is sequential without gaps | Minor | Section numbers 1 through 12 must be present and sequential. No gaps, duplicates, or out-of-order numbers |

---

### SECTIONS — Section Completeness

Checks that each section contains the expected content fields.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| SECTIONS-01 | Executive Summary has Key Metrics subsection | Major | Must include quantified metrics: TPS, latency, availability (SLA %). Vague descriptive text without numbers is a major gap |
| SECTIONS-02 | Architecture Principles section exists and has principles | Major | Must define at least 5 architecture principles. Each principle must have a name |
| SECTIONS-03 | Each principle has Description, Implementation, Trade-offs subsections | Minor | For each principle: at minimum a description of the principle and its trade-offs. Missing trade-offs for any principle = Minor per occurrence |
| SECTIONS-04 | Component Details has at least one fully-documented component | Major | At least one component must document: Type, Technology, Version, Purpose, Responsibilities, Failure Modes. Missing Version or Failure Modes = Major |
| SECTIONS-05 | Data Flow Patterns has at least one Mermaid diagram | Major | Section must contain at least one `mermaid` code block showing data flow. Text-only descriptions without diagrams = Major |
| SECTIONS-06 | Integration Points lists at least one external integration | Minor | Section must document external systems the architecture integrates with. Completely empty or placeholder-only = Minor |
| SECTIONS-07 | Technology Stack section is populated | Major | Must list technologies used with versions. Completely empty or only comments = Major |
| SECTIONS-08 | Security Architecture has authentication subsection | Major | Must document how authentication is handled. Missing = Major |
| SECTIONS-09 | Security Architecture has authorization subsection | Major | Must document the authorization model (RBAC, ABAC, etc.). Missing = Major |
| SECTIONS-10 | Scalability & Performance has SLO definitions | Major | Must define at least one measurable SLO (e.g., "P99 response time < 200ms at 1000 TPS"). Vague goals without numbers = Major |
| SECTIONS-11 | Operational Considerations has monitoring section | Minor | Must describe how the system is monitored in production. Missing = Minor |
| SECTIONS-12 | Architecture Decision Records section references ADRs | Minor | Section 12 must either contain inline ADRs or reference the `adr/` directory. Completely empty = Minor |

---

## MEDIUM DEPTH CHECKS

*(Applied in addition to all Light checks)*

### COHERENCE — Content Coherence

Checks that different sections are internally consistent with each other.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| COHERENCE-01 | Executive Summary accurately reflects rest of document | Major | Technology names, component count, architecture type in Executive Summary must match what is documented in detail sections. Contradictions = Major per contradiction |
| COHERENCE-02 | Components in Data Flow diagrams are defined in Component Details | Major | Every component node referenced in Mermaid diagrams must have a corresponding entry in Component Details. Orphaned references = Major per missing component |
| COHERENCE-03 | Technologies in Technology Stack are actually used by documented components | Minor | Technologies listed in the stack should map to at least one component that uses them. Unused technology entries = Minor per entry |
| COHERENCE-04 | Integration points reference defined components | Major | External systems referenced in Integration Points section must connect to components that exist in Component Details |
| COHERENCE-05 | Security patterns are applied to relevant components | Major | If Security Architecture defines auth/authz mechanisms, at least some components in Component Details should reference these patterns. Completely disconnected security section = Major |
| COHERENCE-06 | Accepted ADR decisions are visible in architecture | Minor | Decisions in accepted ADRs (e.g., "Use PostgreSQL for primary data store") should be reflected in the technology stack and component definitions |
| COHERENCE-07 | Architecture type comment matches actual structure | Major | The declared type (MICROSERVICES, META, 3-TIER, N-LAYER, BIAN) must match the Section 4 layer structure. Declaring MICROSERVICES but having a monolith design = Major |

---

### TECH — Technology Alignment

Checks that technology choices are sound and consistent.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| TECH-01 | No EOL or deprecated technologies | Critical | Technologies must not be past end-of-life (e.g., Java 8 EOL, Python 2, Node.js LTS expired versions, deprecated cloud services). EOL technology in a core role = Critical |
| TECH-02 | Technology choices are compatible with each other | Major | No obvious incompatibilities (e.g., mixing frameworks that conflict, or using JVM-based services with non-JVM-native containers without justification) |
| TECH-03 | Technology stack aligns with architecture type | Major | Microservices should have container orchestration (Kubernetes/ECS) and service discovery. META should define integration layer tooling. 3-Tier should define the web server/app server/DB explicitly |
| TECH-04 | Database technology matches data access patterns | Major | If data flow shows complex joins and transactions, a NoSQL database would be a mismatch. If data flow shows high-volume event streams, a relational DB as primary store = Major |
| TECH-05 | Messaging/event infrastructure matches async patterns | Major | If async patterns (event-driven, pub/sub) are documented in data flow, a matching messaging technology (Kafka, RabbitMQ, SQS) must be present in the technology stack |

---

### INTEG — Integration Soundness

Checks that integration points are properly designed.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| INTEG-01 | Each integration documents protocol and authentication | Major | Every external integration must specify: protocol (REST, SOAP, gRPC, GraphQL), authentication mechanism (API Key, OAuth, mTLS). Missing protocol or auth = Major per integration |
| INTEG-02 | Integration patterns are appropriate for use case | Major | Synchronous integrations for real-time queries (acceptable), synchronous integrations for fire-and-forget bulk operations (Major — should be async) |
| INTEG-03 | Error handling defined for external integrations | Major | At least one of: circuit breaker pattern, retry strategy with backoff, timeout configuration must be mentioned for each external integration. Missing all three = Major |
| INTEG-04 | Data transformation documented for cross-system integrations | Minor | When two systems with different data models integrate, the mapping or transformation layer should be documented |
| INTEG-05 | Integration SLAs compatible with overall system SLA | Major | If system SLA is 99.9% uptime and an external dependency has 99.5% SLA without a fallback, the overall SLA is mathematically unachievable. Flag this inconsistency |

---

### METRICS — Metric Realism

Checks that the performance and capacity numbers are realistic and consistent.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| METRICS-01 | TPS values are realistic for described technology | Major | A single REST API instance serving 50,000 TPS without caching or horizontal scaling claims = Major. A typical single instance handles ~500-2,000 TPS depending on complexity |
| METRICS-02 | Latency targets achievable given data flow complexity | Major | Count the database calls, service hops, and external API calls in a single request path from the data flow diagrams. P99 < 50ms with 3 synchronous external API calls is unrealistic = Major |
| METRICS-03 | Availability SLA achievable with described infrastructure | Critical | 99.99% availability with a single-instance database = Critical. Calculate theoretical availability from described redundancy. Single points of failure must not exceed the claimed SLA |
| METRICS-04 | Metrics are consistent across all sections | Minor | TPS/latency/availability numbers in Executive Summary, Scalability section, and Operational section should agree. Inconsistencies = Minor per inconsistency |
| METRICS-05 | Growth projections have a stated basis | Minor | "10x traffic in year 2" should state a basis (user growth model, historical data, market assumptions). Round numbers without basis = Minor |

---

## HARD DEPTH CHECKS

*(Applied in addition to all Light and Medium checks)*

### SCALE — Scalability Design

Checks that the architecture can scale to meet its stated requirements.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| SCALE-01 | Horizontal scaling strategy defined | Major | Stateless components should document how they scale out. Stateful components should document their scaling limits and approach (read replicas, sharding, etc.) |
| SCALE-02 | Database scaling strategy documented | Major | For each database: read scaling (replicas), write scaling (sharding/partitioning strategy or stated single-master limit), connection pool sizing |
| SCALE-03 | Caching strategy exists with invalidation approach | Major | If system targets >100 TPS or <200ms latency, a caching strategy should exist. If caching is documented, cache invalidation must also be addressed |
| SCALE-04 | Auto-scaling triggers and thresholds defined | Minor | For cloud deployments: CPU%, memory%, queue depth, or custom metrics that trigger scale-out/scale-in. Missing = Minor |
| SCALE-05 | Data retention and archival strategy documented | Minor | For systems retaining event/transaction data: at what volume or age does data get archived? Missing for data-heavy systems = Minor |
| SCALE-06 | Multi-region or multi-AZ strategy matches SLA | Major | If availability SLA > 99.9%, a multi-AZ or multi-region strategy must be documented. Single-AZ deployment targeting 99.99% = Major |
| SCALE-07 | Backpressure mechanisms for event-driven components | Major | For Kafka/SQS/event-driven components: what happens when consumers fall behind? Dead letter queues, consumer group lag alerting, backpressure signals must be addressed |

---

### SECURITY — Security Posture

Checks the architecture's security design for completeness and soundness.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| SECURITY-01 | Authentication covers all entry points | Critical | Every API gateway, service endpoint, and admin interface must have an authentication mechanism. Unauthenticated endpoints without explicit justification = Critical |
| SECURITY-02 | Authorization model defined with role examples | Major | RBAC, ABAC, or equivalent must be defined. Role definitions with at least 2-3 example roles should exist. "Authorization handled by the application" with no details = Major |
| SECURITY-03 | Data encryption at rest specified | Major | Each data store must specify encryption at rest approach (AES-256, TDE, managed encryption). Unspecified = Major per data store |
| SECURITY-04 | Data encryption in transit specified | Critical | All service-to-service communication and client-facing APIs must specify TLS version. HTTP endpoints without TLS for anything other than local dev = Critical |
| SECURITY-05 | Secrets management strategy defined | Critical | How are API keys, database passwords, and certificates managed? Plain text config files or hardcoded credentials in architecture = Critical. No mention of secrets management = Major |
| SECURITY-06 | Audit logging strategy for sensitive operations | Major | Create/update/delete on sensitive data (PII, financial, access control changes) must be logged. No mention of audit logging = Major |
| SECURITY-07 | Network segmentation documented | Major | For cloud deployments: VPCs, subnets, security groups, private vs public placement of components. No network topology = Major |
| SECURITY-08 | Input validation addressed | Major | Where does user input get validated? SQL injection, XSS, command injection mitigations at minimum. "Handled by framework" is acceptable with framework named |
| SECURITY-09 | Dependency vulnerability management | Minor | Strategy for scanning dependencies for CVEs (Dependabot, Snyk, OWASP Dependency-Check). No mention = Minor |

---

### PERF — Performance Design

Checks that the architecture has specific performance optimizations for its stated load targets.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| PERF-01 | N+1 query patterns addressed | Major | In ORM-heavy data access layers: batch loading, eager loading, or pagination strategy must be documented. Unchecked N+1 is the most common performance issue |
| PERF-02 | Connection pooling configured | Major | Database and external service connections should use connection pools with documented min/max pool sizes. New connection per request at scale = Major |
| PERF-03 | CDN or edge caching for static content | Minor | If architecture serves any static assets or cacheable API responses to external clients, CDN should be present or a reason for its absence stated |
| PERF-04 | Bulk operation support for batch scenarios | Minor | If the system will handle bulk imports, exports, or batch jobs, a bulk API or batch processing component should exist |
| PERF-05 | Async processing identified for non-blocking operations | Major | Long-running operations (email sending, report generation, data exports >1s) should be handled asynchronously. Synchronous long-running calls = Major |

---

### OPS — Operational Readiness

Checks that the architecture supports real-world operations after deployment.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| OPS-01 | Deployment strategy defined | Major | Blue/green, canary, rolling, or recreate deployment strategy must be documented. "Deploy to production" with no strategy = Major |
| OPS-02 | Rollback procedure documented | Major | How is a bad deployment rolled back? Database migration rollback strategy especially important. No mention = Major |
| OPS-03 | Health check endpoints defined | Major | Each service/component should have health check endpoints (liveness + readiness for Kubernetes, or equivalent). Missing for critical components = Major |
| OPS-04 | Structured logging with correlation IDs | Major | Logs should be structured (JSON) and include correlation/trace IDs for distributed tracing. "We use logging" with no structure = Major |
| OPS-05 | Alerting thresholds defined | Major | Specific alert thresholds (e.g., "alert if P99 > 500ms for 5 minutes") not just "we will monitor". Monitoring without alerting thresholds = Major |
| OPS-06 | Incident response playbooks referenced | Minor | Runbooks or links to incident response procedures for the most common failure scenarios. Missing = Minor |
| OPS-07 | Disaster recovery with RTO/RPO targets | Major | RTO (Recovery Time Objective) and RPO (Recovery Point Objective) must be defined for the overall system. Missing both = Major |

---

### ADR — Architectural Decision Record Quality

Checks that ADRs are present and of sufficient quality to be useful.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| ADR-01 | Key decisions have corresponding ADRs | Major | At minimum, the following decisions should have ADRs: architecture type choice, primary database selection, authentication approach, deployment platform. Missing any of these = Major per missing ADR |
| ADR-02 | ADRs include alternatives considered | Major | Each ADR must document at least 2 alternatives that were evaluated, not just the chosen option. "We chose X" without alternatives = Major |
| ADR-03 | ADRs include consequences with downsides | Major | Consequences section must include specific downsides or risks of the chosen option. "No downsides identified" or empty consequences = Major |
| ADR-04 | ADR statuses are current | Minor | ADRs for implemented decisions must have status "Accepted" or "Deprecated". "Proposed" status for decisions that are clearly in production = Minor per stale ADR |
| ADR-05 | ADRs reference motivating constraints | Minor | Each ADR should reference the requirement or constraint that drove the decision. Rationale-free ADRs = Minor per occurrence |

---

### TRADEOFF — Trade-off Honesty

Checks that architectural trade-offs are acknowledged honestly and specifically.

| ID | Check | Severity | What to Look For |
|----|-------|----------|-----------------|
| TRADEOFF-01 | Each principle has specific, quantified trade-offs | Major | Trade-offs like "increased complexity" or "higher cost" without specifics = Major per vague trade-off. Good example: "Active-Active adds $8,000/month in infrastructure costs and requires 24/7 ops coverage" |
| TRADEOFF-02 | CAP theorem trade-off stated for distributed data stores | Major | For systems with multiple data stores or distributed databases: Consistency vs. Availability vs. Partition Tolerance choice must be explicit. Missing = Major |
| TRADEOFF-03 | Build vs. buy decisions documented | Minor | For significant components: why was this built rather than bought (or vice versa)? Unexplained custom implementations where SaaS options exist = Minor |
| TRADEOFF-04 | Complexity overhead of chosen patterns acknowledged | Major | Microservices: service mesh, distributed tracing, and network overhead must be acknowledged. Event sourcing: replay complexity and storage overhead. Missing = Major for high-complexity patterns |
| TRADEOFF-05 | Vendor lock-in risks identified | Minor | For cloud-specific services (AWS Lambda, Azure Cognitive Services, GCP Spanner): vendor lock-in acknowledged with or without a stated mitigation strategy |
