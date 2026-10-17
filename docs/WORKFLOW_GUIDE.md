# Complete Workflow Guide

Comprehensive guide to the four-phase architecture documentation workflow using Solutions Architect Skills.

> **Prerequisites**: Ensure the `sa-skills` plugin is installed from the `shadowx4fox-solution-architect-marketplace` marketplace. It declares `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery` and `sa-visualization` as dependencies, so a fresh install brings all six plugins. See [Installation Guide](INSTALLATION.md).

This guide covers the complete four-phase architecture workflow provided by this Claude Code plugin.

For background on Claude Code plugins, see [official documentation](https://docs.anthropic.com/claude/docs/claude-code-plugins).

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Phase 1: Architecture Readiness](#phase-1-architecture-readiness)
3. [Phase 2: Architecture Documentation](#phase-2-architecture-documentation)
4. [Phase 3: Compliance Documentation](#phase-3-compliance-documentation)
5. [Phase 4: Development Handoff](#phase-4-development-handoff)
6. [Phase 5: Architecture Index](#phase-5-architecture-index)
7. [Integration Patterns](#integration-patterns)
8. [Best Practices](#best-practices)
9. [Advanced Usage](#advanced-usage)

---

## Workflow Overview

The Solutions Architect Skills workflow follows a sequential four-phase approach, each owned by a different role:

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Business Requirements (Product Owner)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-readiness skill (sa-requirements)      │   │
│  │ Output: PRODUCT_OWNER_SPEC.md                       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Technical Architecture (Architecture Team)        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-docs skill (sa-skills)                 │   │
│  │ Output: ARCHITECTURE.md                             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Compliance Documentation (Compliance Team)        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ the compliance plugin of an institution pack,       │   │
│  │ when the organization has one                       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Development Handoff (Dev Team)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-dev-handoff skill (sa-delivery)        │   │
│  │ Output: handoffs/ (handoff kit + assets)             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Architecture Index (CI → MCP server → IDEs)       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-index-export skill (sa-delivery)       │   │
│  │ Output: sa-index/1 bundle — chunks, ledger, packs   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

> **Gate between Phase 1 and Phase 2**: `architecture-capability-alignment` (`sa-requirements`) aligns the PO Spec to the project's
> declared capability framework (`BIAN_ALIGNMENT.md` or `CAPABILITY_ALIGNMENT.md`) and is **mandatory** before a new
> `ARCHITECTURE.md` is created, once a framework is declared.
> See Phase 2 for the full list of creation gates.

### Key Principles

1. **Sequential Flow:** Each phase builds on the previous phase's output
2. **Role Separation:** Clear ownership (PO → Architects → Compliance → Dev; Compliance when the organization has a compliance plugin)
3. **Single Source of Truth:** ARCHITECTURE.md drives every downstream artifact
4. **Traceability:** Full audit trail from requirements → architecture → handoff
5. **Automation:** Minimize manual work through skill automation

---

## Phase 1: Architecture Readiness

**Owner:** Product Owner
**Skill:** `architecture-readiness` (plugin `sa-requirements` — installable alone for a Product Owner with no architecture yet)
**Output:** `PRODUCT_OWNER_SPEC.md`

### Purpose

Document business requirements before technical architecture design. This phase ensures:
- Clear business justification
- Defined user needs
- Measurable success criteria
- Identified constraints and risks

### When to Use

- **New Projects:** Before architecture design begins
- **Feature Additions:** Major new functionality requiring architecture changes
- **System Redesign:** Modernization or re-platforming efforts
- **Stakeholder Alignment:** Clarifying business context for technical teams

### Workflow Steps

#### Step 1: Activate Skill

```
/skill sa-requirements:architecture-readiness
```

#### Step 2: Create New PO Spec

The skill guides you through 8 sections:

##### 1. Business Context
**Purpose:** Why this project exists

**What to document:**
- Problem statement
- Business drivers (cost reduction, revenue growth, compliance, etc.)
- Current state vs. desired state
- Strategic alignment

**Example:**
```markdown
## 1. Business Context

### Problem Statement
Manual job scheduling across 15 servers is error-prone and time-consuming.
Operations team spends 20 hours/week managing cron jobs.

### Business Drivers
- Reduce operational overhead by 80% (16 hours/week savings)
- Improve reliability from 95% to 99.9%
- Enable self-service for dev teams
- Compliance requirement: audit trail for all job executions
```

##### 2. Stakeholders & Users
**Purpose:** Who will use the system and who is affected by it

**What to document:**
- Primary users (roles, responsibilities, technical level)
- Secondary users
- Administrators
- Stakeholders
- User personas (demographics, goals, pain points)

**Example:**
```markdown
## 2. Stakeholders & Users

### Primary: DevOps Engineer
- **Role:** Manages batch jobs for applications
- **Technical Level:** High (Python, shell scripting, CI/CD)
- **Daily Tasks:** Schedule jobs, monitor executions, debug failures
- **Pain Points:** No centralized view, manual cron management

### Secondary: Application Developer
- **Role:** Creates batch scripts for data processing
- **Technical Level:** Medium (knows Python, unfamiliar with ops)
- **Needs:** Simple job submission, execution status visibility
```

##### 3. Use Cases
**Purpose:** What users need to accomplish

**What to document:**
- Primary use cases (most important workflows)
- Secondary use cases
- Edge cases or exceptions

**Example:**
```markdown
## 3. Use Cases

### UC-1: Schedule Recurring Job
**Actor:** DevOps Engineer
**Description:** Schedule a Python script to run daily at 2 AM
**Frequency:** 10-15 times/day
**Success Criteria:** Job runs within 1 minute of scheduled time

### UC-2: Monitor Job Execution
**Actor:** Application Developer
**Description:** View status of submitted jobs (running, success, failed)
**Frequency:** 50+ times/day
**Success Criteria:** Real-time status updates, <3 second page load
```

##### 4. User Stories
**Purpose:** Specific requirements in user voice

**Format:** As a [role], I want [capability], so that [benefit]

**Example:**
```markdown
## 4. User Stories

### Must Have (Priority 1)
- As a DevOps Engineer, I want to schedule jobs using cron syntax, so that I can migrate existing cron jobs easily
- As an Application Developer, I want to see job execution history, so that I can debug failures
- As a System Administrator, I want audit logs of all job submissions, so that I can meet compliance requirements

### Should Have (Priority 2)
- As a DevOps Engineer, I want to chain jobs with dependencies, so that I can orchestrate complex workflows
- As a Developer, I want email notifications on job failures, so that I can respond quickly to issues
```

##### 5. Success Criteria
**Purpose:** How to measure project success

**What to document:**
- Quantitative metrics (numbers, percentages, time)
- Qualitative goals
- Acceptance criteria

**Example:**
```markdown
## 5. Success Criteria

### Quantitative
- **Reliability:** 99.9% job execution success rate
- **Performance:** Job submission < 100ms, status query < 500ms
- **Adoption:** 80% of teams migrated within 3 months
- **Operational Savings:** Reduce manual work from 20h/week to 4h/week

### Qualitative
- Users rate system 4+ out of 5 for ease of use
- Zero compliance audit findings related to job scheduling
- Positive feedback from operations team on reduced cognitive load
```

##### 6. Constraints & Assumptions
**Purpose:** Known limitations and dependencies

**What to document:**
- Technical constraints (must use existing infrastructure)
- Business constraints (budget, timeline, resources)
- Regulatory constraints (compliance, security)
- Assumptions about users, systems, data

**Example:**
```markdown
## 6. Constraints & Assumptions

### Technical Constraints
- Must integrate with existing Active Directory for authentication
- Jobs must run on existing Kubernetes cluster (AKS)
- Python 3.9+ runtime only (no support for Python 2.x)

### Business Constraints
- Budget: $50K for development, $10K/year operational costs
- Timeline: MVP in 3 months, full rollout in 6 months
- Team: 2 developers, 1 QA, part-time architect

### Assumptions
- Users are familiar with cron syntax
- Job scripts are idempotent and can be retried
- Average job duration < 1 hour
```

##### 7. Risks
**Purpose:** Potential issues to mitigate

**What to document:**
- Technical risks (complexity, dependencies)
- Business risks (adoption, ROI)
- Operational risks (support, scalability)
- Mitigation strategies

**Example:**
```markdown
## 7. Risks

### Risk 1: Low Adoption
- **Probability:** Medium
- **Impact:** High (ROI depends on adoption)
- **Mitigation:** Onboarding support, migration automation, success stories

### Risk 2: Kubernetes Cluster Capacity
- **Probability:** Low
- **Impact:** High (job execution failures)
- **Mitigation:** Capacity planning, auto-scaling, priority queues
```

##### 8. Next Steps
**Purpose:** Handoff to architecture team

**What to document:**
- Ready for architecture phase (Yes/No)
- Open questions for architects
- Required decisions or approvals

**Example:**
```markdown
## 8. Next Steps

### Readiness Assessment
**Status:** Ready for architecture handoff (Score: 8.5/10)

### Open Questions for Architecture Team
1. Should we use off-the-shelf job scheduler (Airflow, Temporal) or build custom?
2. How to handle long-running jobs (>1 hour)?
3. Storage strategy for job execution logs?

### Required Approvals
- Budget approval: Pending (finance review)
- Security review: Scheduled for next week
```

#### Step 3: Review Readiness Score

The skill calculates a weighted score based on section completeness:

| Section | Weight (pts) | Priority |
|---------|-------------|----------|
| 4. Use Cases | 2.5 | HIGH |
| 7. Business Constraints | 2.0 | HIGH |
| 3. Business Objectives | 1.5 | HIGH |
| 1. Business Context | 1.0 | MEDIUM |
| 6. UX Requirements | 1.0 | MEDIUM |
| 8. Success Metrics & KPIs | 1.0 | MEDIUM |
| 2. Stakeholders & Users | 0.5 | LOW |
| 5. User Stories | 0.5 | LOW |
| **Total** | **10.0** | |

**Interpretation:**
- **9.0-10.0:** Excellent - Ready for architecture
- **7.5-8.9:** Good - Ready with minor clarifications
- **6.0-7.4:** Fair - Needs more detail in some areas
- **<6.0:** Poor - Not ready for architecture handoff

#### Step 4: Iterate if Needed

If score < 7.5, revisit sections with low scores and add more detail.

### Output: PRODUCT_OWNER_SPEC.md

**File size:** Typically 1,500-2,500 lines
**Format:** Markdown with 8 clearly labeled sections
**Usage:** Input to Phase 2 (architecture-docs skill)

---

## Phase 2: Architecture Documentation

**Owner:** Architecture Team
**Skill:** `architecture-docs`
**Input:** `PRODUCT_OWNER_SPEC.md` (optional but recommended)
**Output:** `ARCHITECTURE.md` + `docs/` (the 13 sections) + `adr/`

### Purpose

Translate business requirements into technical architecture design. This phase ensures:
- Clear technical design decisions
- Documented components and integration points
- Technology stack alignment with standards
- Architecture Decision Records (ADRs) for key choices

### When to Use

- **New Systems:** Initial architecture documentation
- **Major Changes:** Significant redesign or re-architecture
- **Maintenance:** Keep documentation current
- **Architecture Reviews:** Prepare for governance reviews

### Selecting Architecture Type

**Critical Decision**: Choose the architecture type that determines Section 4 and Section 5 structure.

**5 Supported Architecture Types**:

#### 1. ENTERPRISE (5-Layer Enterprise, default)
**Best for**: Large enterprise platforms, complex integrations
**Structure**: Channels → Experience → Process → Domain Services → Systems of Record & Data (cross-cutting: Integration, Identity & Security, Observability, Shared Platform Services)
**When to use**: 5+ external integrations, enterprise platforms; also the default when in doubt
**Template**: `templates/SECTION_4_ENTERPRISE.md`

#### 2. 3-Tier (Classic Web Application)
**Best for**: Web applications, REST APIs, standard CRUD systems
**Structure**: Presentation → Application/Business Logic → Data
**When to use**: Straightforward web apps, familiar patterns, low-to-moderate complexity
**Template**: `templates/SECTION_4_3TIER.md`

#### 3. Microservices (Cloud-Native)
**Best for**: Cloud-native distributed systems, event-driven architectures
**Structure**: API Gateway, Service Mesh, Event Bus, independent services
**When to use**: Independent scaling, multiple teams, polyglot environments, fault isolation
**Template**: `templates/SECTION_4_MICROSERVICES.md`

#### 4. N-Layer (DDD/Clean Architecture)
**Best for**: Domain-Driven Design, Hexagonal Architecture, testable systems
**Structure**: Flexible (4-Layer DDD, 5-Layer Extended, Clean Architecture concentric)
**When to use**: Complex domain logic, dependency inversion, framework-free core
**Template**: `templates/SECTION_4_NLAYER_PATTERNS.md`

#### 5. BIAN (Full BIAN v14.0.0)
**Best for**: Banking systems built on the BIAN Service Landscape
**Structure**: Channels → BIAN Business Scenarios → BIAN Business Capabilities → BIAN Service Domains → Core Systems
**When to use**: Full BIAN certification, service domains as the unit of design
**Template**: `templates/SECTION_4_BIAN.md`

**Decision Tree**:
```
Does your system have 5+ external integrations AND regulatory compliance?
  → YES: ENTERPRISE Architecture

Is your system a distributed cloud-native application with independent services?
  → YES: Microservices Architecture

Are you implementing Domain-Driven Design or Clean Architecture?
  → YES: N-Layer Architecture

Is your system a standard web application or API?
  → YES: 3-Tier Architecture

Is it a banking system that must certify against BIAN?
  → YES: BIAN Architecture
```

**Detailed Guide**: See `ARCHITECTURE_TYPE_SELECTOR.md` for comparison matrix and selection criteria.

---

### Workflow Steps

#### Step 1: Activate Skill

```
/skill sa-skills:architecture-docs
```

#### Step 2: Create ARCHITECTURE.md

Creation runs the four gates (language, PO Spec, capability alignment, HLD), asks for the
architecture type and the systems, then writes the 13 sections — one file each under
`docs/`, with `ARCHITECTURE.md` as the versioned index:

| # | Section | File |
|---|---------|------|
| 1–2 | Executive Summary, System Overview | `docs/01-system-overview.md` |
| 3 | Architecture Principles | `docs/02-architecture-principles.md` |
| 4 | Architecture Layers + the four standard diagrams | `docs/03-architecture-layers.md` |
| 5 | Components (C4 L1 systems, L2 containers) | `docs/components/` |
| 6 | Data Flow Patterns | `docs/04-data-flow-patterns.md` |
| 7 | Integration Points | `docs/05-integration-points.md` |
| 8 | Technology Stack | `docs/06-technology-stack.md` |
| 9 | Security Architecture | `docs/07-security-architecture.md` |
| 10 | Scalability & Performance | `docs/08-scalability-and-performance.md` |
| 11 | Operational Considerations | `docs/09-operational-considerations.md` |
| 12 | ADRs | `adr/` |
| 13 | Risks and Technical Debt | `docs/10-risks-and-technical-debt.md` |

Every file opens with an `<!-- EXPLORER_HEADER -->` block, and every structural heading carries
an English anchor (`<!-- SECTION: … -->`) so the gates read the document in either language.
Creation stops at four checkpoints; `continue the architecture` resumes it in a fresh session.

The examples below show what each section holds.

##### Section 1: Executive Summary

**Purpose:** High-level overview for executives and stakeholders

**Content:**
- 3-5 sentence summary
- Key metrics (SLA, capacity, scale)
- Design Drivers (Value Delivery %, Scale, Impacts)
- Architecture diagram (high-level)

**Example:**
```markdown
## Section 1: Executive Summary

Job Scheduling Platform enables 500 users to automate batch jobs with 99.9% reliability.
System handles 450 transactions/second (job submissions + status queries) with 3-second
latency target. Architecture follows microservices pattern deployed on Azure Kubernetes
Service with PostgreSQL (jobs) and Redis (caching).

### Design Drivers
- **Value Delivery:** 85% (high business value)
- **Scale:** 450 TPS peak, 38M transactions/month
- **Impacts:** 4 core components, 7 technologies, 3 external integrations
```

##### Section 2: System Overview

**Purpose:** Context and scope

**Content:**
- Problem statement
- Solution approach
- In-scope / out-of-scope
- Stakeholders
- Success criteria (from PO Spec)

##### Section 3: Architecture Principles

**Purpose:** Guiding principles for all design decisions

**Content (9 mandatory + 1 optional):**

1. **Separation of Concerns** - Modular design, single responsibility
2. **High Availability** - 99.9%+ uptime, redundancy
3. **Scalability First** - Horizontal scaling, stateless design
4. **Security by Design** - Zero trust, encryption, least privilege
5. **Observability** - Metrics, logs, traces (3 pillars)
6. **Resilience** - Circuit breakers, retries, graceful degradation
7. **Simplicity** - Favor simplicity over cleverness
8. **Cloud-Native** - Container-first, managed services
9. **Open Standards** - Industry standards over proprietary
10. **Event-Driven** (Optional) - Asynchronous communication

**Format for each:**
```markdown
### 3.1 Separation of Concerns
**Definition:** Each component has single, well-defined responsibility
**Rationale:** Improves maintainability, testability, team autonomy
**Implementation:**
- Scheduler Service: Only handles job scheduling logic
- Executor Service: Only executes jobs
- No cross-concern dependencies
**Trade-offs:** More services to manage vs simpler components
```

##### Section 4: Architecture Layers

**Purpose:** Define the layered architecture model with visual diagrams

**Content (Architecture-Type Specific)**:
- **ENTERPRISE**: 5 layers (Channels → Experience → Process → Domain Services → Systems of Record & Data) plus cross-cutting capabilities
- **3-Tier**: 3 tiers (Presentation → Application/Business Logic → Data)
- **Microservices**: Service mesh topology with infrastructure components
- **N-Layer**: Custom layers with dependency rules (4-Layer DDD, 5-Layer Extended, or Clean Architecture)

**Interactive Mermaid Diagram**:
- Color-coded components (Blue=Orchestrators, Orange=Workers, Green=Query, Purple=Events, Teal=Domain, Gray=Gateway)
- Data flow visualization (solid arrows=synchronous REST/gRPC, dashed arrows=asynchronous events)
- Security protocols (OAuth 2.0 + JWT, mTLS, TLS 1.2+, SASL)
- Renders automatically in GitHub/GitLab

**Templates**:
- ENTERPRISE: `templates/SECTION_4_ENTERPRISE.md`
- 3-Tier: `templates/SECTION_4_3TIER.md`
- Microservices: `templates/SECTION_4_MICROSERVICES.md`
- N-Layer: `templates/SECTION_4_NLAYER_PATTERNS.md`

**Comprehensive Guide**: See `MERMAID_DIAGRAMS_GUIDE.md` for diagram creation, color schemes, and update instructions.

##### Section 5: System Components

**Purpose:** Detailed component design

**Content (for each component):**
- Name and purpose
- Responsibilities
- Interfaces (APIs, events)
- Technology stack
- Data model
- Scalability approach

**Example:**
```markdown
### 5.1 Scheduler Service

**Purpose:** Manage job schedules and trigger executions

**Responsibilities:**
- Accept job submissions via REST API
- Store job definitions in PostgreSQL
- Evaluate cron expressions every minute
- Trigger Executor Service for due jobs
- Track job execution status

**Interfaces:**
- REST API: `/api/v1/jobs` (CRUD operations)
- Event Bus: Publishes `JobTriggered` events

**Technology:**
- Java 17, Spring Boot 3.2
- PostgreSQL 15 for job storage
- Redis for distributed locks

**Scalability:**
- Horizontal scaling: 3+ replicas behind load balancer
- Stateless design enables easy scaling
- Leader election for cron evaluation (only one active)
```

##### Section 6: Data Flow

**Purpose:** How data moves through the system

**Content:**
- Data flow diagrams
- Key workflows (happy path + error scenarios)
- Data transformations
- Message formats

##### Section 7: Integration Points

**Purpose:** External dependencies and APIs

**Content (for each integration):**
- External system name and purpose
- Integration pattern (REST, SOAP, messaging, batch)
- Authentication method
- Data exchanged
- SLA/dependencies
- Error handling

**Example:**
```markdown
### 7.1 Active Directory Integration

**Purpose:** User authentication and authorization

**Integration Pattern:** LDAP + REST API
- LDAP: User authentication (port 636, LDAPS)
- REST API: Group membership queries (Graph API)

**Authentication:** Service account with read-only permissions

**Data Exchange:**
- Input: Username, password
- Output: User DN, group memberships

**Dependencies:**
- Availability: 99.95% (AD SLA)
- Latency: <200ms for auth, <500ms for group queries

**Error Handling:**
- Cache group memberships for 1 hour
- Fallback to local admin account for emergencies
```

##### Section 8: Technology Stack

**Purpose:** All technologies used

**Content:**
- Languages and versions
- Frameworks and versions
- Databases
- Infrastructure (containers, orchestration)
- Tools (build, test, monitoring)
- Libraries (with versions)

**Example:**
```markdown
## Section 8: Technology Stack

### 8.1 Backend
- **Language:** Java 17 (LTS)
- **Framework:** Spring Boot 3.2.0
- **Build Tool:** Maven 3.9.5
- **Testing:** JUnit 5.10, Mockito 5.5, Spring Test
- **Code Quality:** SonarQube 10.2

### 8.2 Data Layer
- **Relational Database:** PostgreSQL 15.4 (Azure Database for PostgreSQL)
- **Caching:** Redis 7.2 (Azure Cache for Redis)
- **Migration Tool:** Flyway 9.22

### 8.3 Infrastructure
- **Container Runtime:** Docker 24.0+
- **Orchestration:** Azure Kubernetes Service (AKS) 1.28
- **Deployment:** Helm 3.13
- **Service Mesh:** Istio 1.19 (optional for advanced scenarios)

### 8.4 Observability
- **Metrics:** Prometheus 2.47, Grafana 10.1
- **Logging:** Azure Log Analytics
- **APM:** Application Insights
- **Distributed Tracing:** OpenTelemetry

### 8.5 CI/CD
- **Source Control:** Git, GitHub
- **CI Platform:** GitHub Actions
- **CD Platform:** Azure DevOps Pipelines
- **Artifact Repository:** Azure Container Registry

### 8.6 Libraries
1. Spring Boot Starter Web 3.2.0
2. Spring Boot Starter Data JPA 3.2.0
3. Spring Boot Starter Security 3.2.0
4. Spring Boot Starter Actuator 3.2.0
5. Micrometer Prometheus 1.12
6. Lombok 1.18.30
7. Apache Commons Lang 3.13
8. Jackson 2.15
9. HikariCP 5.0.1 (connection pooling)
10. Quartz Scheduler 2.3.2
```

**Note:** Section 8 is read by the Tech Debt/EOL, Vendor Lock-in and Cost Hotspots analyses; give every technology a version.

##### Section 9: Security

**Purpose:** Security architecture and controls

**Content:**
- Authentication methods
- Authorization model (RBAC, ABAC)
- Encryption (at rest, in transit)
- API security
- Secrets management
- Compliance requirements

##### Section 10: Performance

**Purpose:** Performance requirements and capacity planning

**Content:**
- SLAs (availability, latency, throughput)
- Capacity plan (current and projected)
- Scalability approach
- Performance testing results

**Example:**
```markdown
## Section 10: Performance Requirements

### 10.1 Service Level Agreement (SLA)

**Availability:** 99.9% uptime
- **Downtime Allowance:** 43.2 minutes/month
- **Measurement:** Rolling 30-day window
- **Exclusions:** Planned maintenance windows (notified 7 days in advance)

**Latency:**
- **Job Submission:** p95 < 100ms, p99 < 250ms
- **Status Query:** p95 < 50ms, p99 < 100ms
- **Job Execution Trigger:** <1 minute from scheduled time

**Throughput:**
- **Design Capacity:** 450 TPS (transactions per second)
  - Job submissions: 100 TPS
  - Status queries: 300 TPS
  - Job completions: 50 TPS
- **Peak Capacity:** 1,000 TPS (2.2x design capacity)

### 10.2 Capacity Planning

**Current State:**
- Users: 500
- Jobs/day: 10,000 (avg 115 per hour)
- Peak: 500 jobs/hour (8-9 AM)

**Projected Growth:**
- Year 1: 750 users, 15,000 jobs/day
- Year 2: 1,000 users, 25,000 jobs/day
- Year 3: 1,500 users, 40,000 jobs/day

**Scalability Approach:**
- Horizontal pod autoscaling (HPA) based on CPU/memory
- Scale scheduler from 3 to 10 replicas
- Database read replicas for query scaling
```

##### Section 11: Operations

**Purpose:** How to run and maintain the system

**Content:**
- Monitoring and alerting
- Logging strategy
- Backup and recovery (RTO/RPO)
- Disaster recovery
- Incident management
- Capacity planning

##### Section 12: Architecture Decision Records (ADRs)

**Purpose:** Document key architecture decisions

**Content:** Individual ADR documents for each major decision

**Writer:** the ADR files under `adr/` are written by `sa-records:architecture-definition-record` and the Technical Debt Records under `tdr/` by `sa-records:technical-debt-records` — both ship in the `sa-records` plugin.

**ADR Template:**
```markdown
### ADR-001: Use PostgreSQL for Job Storage

**Status:** Accepted
**Date:** 2025-11-15
**Deciders:** Architecture Team, DevOps Team

**Context:**
Need persistent storage for job definitions, schedules, and execution history.
Require ACID guarantees for job state transitions.

**Decision:**
Use PostgreSQL 15 as primary data store for all job-related data.

**Alternatives Considered:**
1. **MongoDB:** NoSQL flexibility but weaker ACID guarantees
2. **Azure SQL Database:** More expensive, lock-in to Azure
3. **MySQL:** Similar to PostgreSQL but weaker JSON support

**Rationale:**
- ACID transactions critical for job state consistency
- JSON column type for flexible job parameters
- Strong community support and operational expertise
- Cost-effective on Azure (PostgreSQL Flexible Server)
- pg_cron extension for native cron evaluation

**Consequences:**
✅ **Positive:**
- Strong data consistency guarantees
- Rich querying with JSON support
- Cost-effective (~$200/month for standard tier)

❌ **Negative:**
- Scaling reads requires read replicas (added complexity)
- Schema migrations need careful planning

**Compliance:**
- Aligns with organizational authorized database catalog
```

#### Step 3: Validate Architecture

Every write runs its gates by code:

- **Explorer headers** — `explorer-cli.ts check` (blocking)
- **Prose** — `prose-check.js` (blocking lexical rules; report-only until the project is stamped `PROSE_STYLE: v1`)
- **Principles** — `principle-check.js` (Layer 1) and the `principle-quality-reviewer` (Layer 2)
- **Diagrams** — `mermaid-check.js` and `label-check.js`; data flows — `flow-compose.js` and `flow-check.js`
- **Integrations** — `integration-check.js` holds `docs/05` to the label grammar and the HLD
- **Budgets** — `docs-stats.js` reports sizes and the shapes that inflate a corpus

A finding names a file and a line; the fix is an edit at that line.

#### Step 4: Edit and release

Edit through the skill (Workflow 2) so the gates run on what changed. `release my architecture`
(`architecture-lifecycle`) moves the version from Draft to Released, writes `docs/CHANGELOG.md` and tags
`architecture-v<version>`.

### Output

**Files:** `ARCHITECTURE.md` (index, version, `DOC_LANGUAGE`), `docs/` (13 sections + `components/`), `adr/`
**Usage:** Input to Phase 3 (an institution pack's compliance plugin, when present) and Phase 4 (handoff, export)

---

## Phase 3: Compliance Documentation

**Owner:** Compliance Team

Compliance contracts are organization-specific. The base ships no compliance skill, contracts or scoring: they come from the compliance plugin an [institution pack](INSTITUTION_PACKS.md) installs, when the organization has one. The phase keeps its place in the workflow; its commands are that plugin's.

---

## Integration Patterns

### Pattern 1: Sequential Waterfall

Traditional sequential approach where each phase completes before the next begins.

```
PO Spec (Complete) → ARCHITECTURE.md (Complete) → Handoff Kit (Generate)
```

**When to use:**
- New projects
- Well-defined requirements
- Formal governance process

**Benefits:**
- Clear phase boundaries
- Complete documentation before handoff
- Full traceability

### Pattern 2: Iterative Refinement

Iterate on ARCHITECTURE.md and regenerate the downstream artifacts as needed.

```
ARCHITECTURE.md v1 → Analyses v1 → Review Feedback
    ↓
ARCHITECTURE.md v2 → Analyses v2 → Improved Completeness
    ↓
ARCHITECTURE.md v3 → Analyses v3 → Final (>90% complete)
```

**When to use:**
- Complex systems
- Evolving requirements
- Continuous improvement

**Benefits:**
- Progressive refinement
- Early risk feedback
- Higher final quality

### Pattern 3: Presentation and Exploration

A communication layer over the Phase 2 output. None of these skills is a gate and none writes to `ARCHITECTURE.md`, `docs/` or `adr/`; each reads the architecture and produces an artifact for a specific audience.

```
ARCHITECTURE.md + docs/ (Phase 2 complete)
    ├─▶ architecture-command-center      → visualizations/*.html   (stakeholders: logical + physical views, boundary, use-case walkthroughs)
    └─▶ architecture-docs-export  → SA-<name>.docx          (committees: role-routed briefing + reference)
```

**When to use:**
- Presenting the architecture to a committee, a Product Owner or a new team
- After Workflow 8 (diagrams) or a release (`architecture-lifecycle`) — regenerate so the audience sees the current version
- When the Mermaid diagrams in `docs/03` and `docs/04` answer "what connects to what" but not "where does each container live" or "how does a use case travel the layers"

**Benefits:**
- Zero risk to the source of truth — read-only skills, regenerable output
- One artifact per audience instead of one document for everyone
- The release receipt (`architecture-lifecycle`) names these as stale after every version bump

---

## Best Practices

### 1. Start Early

- Create PO Spec before architecture work begins
- Ensures alignment between business and technical teams
- Reduces rework and misalignment

### 2. Maintain Single Source of Truth

- `ARCHITECTURE.md` + `docs/` are the authoritative source
- Handoffs, analyses and exports are generated from them
- Edit the architecture through the skill, then regenerate what depends on it

### 3. Run long workflows in a fresh session

- Creation and the handoff kit each carry a large working set
- Creation stops at checkpoints — `continue the architecture` resumes it
- The facts ledger (`arch-facts.js`) answers names and ids without reopening the documents

### 4. Iterate on Completeness

- A first generation leaves `[NOT DOCUMENTED]` markers where the architecture is silent
- Close them in the section they point at
- Regenerate the affected artifacts

### 5. Validate Stack Early

- The Tech Debt/EOL analysis flags versions past end of life
- Fix stack issues before the handoff kit
- Record exceptions as ADRs and the debt as TDRs (`sa-records`)

### 6. Version Control

- Track all three document types in Git
- Tag versions for audit trail
- Include generation dates in filenames

### 7. Automate Regeneration

- Set up CI/CD to republish the architecture index on each release
- Ensure documentation stays current
- Reduce manual maintenance

### 8. Leverage Interactive Diagrams

**Mermaid Advantages**:
- Use Mermaid diagrams in Section 4 instead of ASCII art
- Interactive visualization (zoom, pan) in GitHub/GitLab
- Maintainable text-based format (easy updates)
- Professional appearance with color-coding

**Standard Color Scheme**:
- Blue: Orchestrators and entry points
- Orange: Worker microservices and executors
- Green: Query services and CQRS read models
- Purple: Event streaming (Kafka topics, message queues)
- Teal: Domain services and business logic
- Gray: Infrastructure (API Gateway, load balancers)

**How to Update**:
1. Locate Mermaid diagram in Section 4
2. Update component definitions or data flows
3. Validate rendering in GitHub preview or https://mermaid.live/
4. Update legend to reflect changes

**Full Guide**: `MERMAID_DIAGRAMS_GUIDE.md` includes templates, examples, and step-by-step instructions for all architecture types.

---

## Advanced Usage

### Custom Workflow Variations

#### Variation 1: Skip PO Spec for Small Projects

For minor features or small projects, skip Phase 1 and start directly with ARCHITECTURE.md.

```
Business Context (informal) → ARCHITECTURE.md → Handoff Kit
```

### Integration with Other Tools

#### Git Workflow

```bash
# Feature branch for architecture work
git checkout -b feature/job-scheduler-arch

# Create/update documents
/skill sa-skills:architecture-docs
git add ARCHITECTURE.md
git commit -m "docs: Initial architecture for job scheduler"

# Create PR
git push origin feature/job-scheduler-arch
```

---

## Troubleshooting

### Common Issues

#### Issue: Low Completeness (<70%)

**Cause:** The architecture does not document what the requirements ask

**Solution:**
1. Run `architecture-traceability` and read the `Not Covered` and `Partial` rows
2. Find the section file each gap points at (`docs/NN-*.md`)
3. Add the content through `architecture-docs`
4. Regenerate the affected artifacts

#### Issue: Technology Past End of Life

**Cause:** One or more technology+version pairs in Section 8 (`docs/06-technology-stack.md`) are end-of-life

**Solution:**
1. Run the Tech Debt/EOL analysis (`architecture-analysis`)
2. Either:
   - Upgrade to a supported version
   - Record the exception as a project ADR (`adr/`, ADR-101+) and the debt as a TDR
3. Re-run the analysis

#### Issue: Metric Inconsistency

**Cause:** Metrics in Executive Summary don't match Section 10

**Solution:**
1. Skill will flag inconsistencies
2. Update either Executive Summary or Section 10 to match
3. Skill recalculates Design Drivers

---

## Phase 4: Development Handoff

The Dev Team receives implementable specifications. Phase 4 produces the **four-part Service Handoff Kit**
for the engineers who will build the system.

```
/skill sa-delivery:architecture-dev-handoff
```

### What it produces

| Artifact | Scope | Contents |
|---|---|---|
| `handoffs/SYSTEM_RUNTIME_VIEW.md` | One per run | Whole-system storyboard: flows with per-hop budget decomposition, edge rationale, failure posture |
| `handoffs/CROSS_CUTTING_STANDARDS.md` | One per run | Institution-wide rules synthesized from institutional ADRs — every rule cites its ADR |
| `handoffs/interfaces/<upstream>→<downstream>.md` | One per adjacent service pair | Interaction contract, entry/exit state, mutual assumptions, failure semantics, ownership |
| `handoffs/components/NN-<slug>.md` | One per C4 L2 component | Intent and constraint — deliberately **not** execution |
| `handoffs/assets/NN-<slug>/` | Per component | OpenAPI, AsyncAPI, GraphQL SDL, DDL, Avro / Protobuf schemas, Redis key schema, C4 descriptor — each validated by `contract-check.js` |

Each of the four documents opens with a fixed `### Role Quick Index`, and
`handoffs/README.md` renders a whole-kit reading order across Dev / QA / Ops / Architect.

### Scope

**C4 Level 2 (Container) components only.** L1 system descriptors describe boundaries, not
implementable units, and are excluded.

### Prerequisites

- **Hard block:** `docs/05-integration-points.md` must exist.
- **Warnings** (sections are marked `[NOT DOCUMENTED]` rather than blocking): missing
  `analysis/LATENCY_BUDGET-*.md` or `analysis/BLAST_RADIUS-*.md`.

Re-runs skip unchanged parts via `handoffs/.manifest.json`; `--force` regenerates all four.

---

## Phase 5: Architecture Index

Developers get the released architecture inside their IDE (VS Code, JetBrains or any MCP client): they ask it
questions while they work, and build one microservice from its spec. The plugin exports a bundle; a separate
MCP server, Alia (Spring AI, Qdrant or its `file` engine, Qwen3-Embedding 0.6B on Ollama), loads it.

```
/skill sa-delivery:architecture-index-export
```

### What it produces

| Part | Contents |
|---|---|
| `chunks.jsonl` | One chunk per unit of meaning, a context line first, ids stable across releases — what the server embeds for search |
| `ledger.json` | The facts ledger — what the exact tools answer from |
| `buildpacks/<slug>/` | Per container: spec, interface contracts, assets byte for byte, flows and budgets, governing ADRs, open questions, an ordered plan and `BUILD.md`, the IDE agent's instructions |
| `changes.json` | With `--previous`: what changed for each container since that bundle, `action_required` where code must move |

### The release sequence

1. **Release the architecture** (`/release-architecture`): the tag `architecture-v<version>`. CI publishes the chunks
   and the ledger; search goes live.
2. **Regenerate the handoff kit** (`generate dev handoff`) and commit `handoffs/`. CI publishes the same version
   again, now with its build packs.

A build pack needs a kit of exactly the architecture's version: until the kit is regenerated, the components are
listed as skipped (`kit-version <old>`), and `lifecycle.js status` lists the kit as stale. A run whose architecture
differs from its tag is a draft and is not published.

### CI

Copy one example from `plugins/sa-delivery/skills/architecture-index-export/ci/` into the architecture's repository —
`github-actions.yml`, `gitea-actions.yml` or `azure-pipelines.yml` — and set the project key, the server URL and a
token. Each runs `publish-index.sh` with the plugin pinned to a release tag.

### In the microservice repository

The agent writes `.architecture.json` (server, project, component, architecture version), follows `BUILD.md`, asks
about every open question rather than filling it, and calls `what_changed` when a new architecture version is released.

---

## Summary

The four-phase workflow provides a complete, traceable path from business requirements to
implementable specifications:

1. **Phase 1 (Readiness):** Product Owner documents business context and requirements
2. **Phase 1.5 (Capability Alignment):** Governance maps the spec onto the declared capability framework — BIAN Service Landscape v14.0.0 (8 Business Areas · 43 Business Domains · 341 Service Domains), the cross-industry map, or a pack's — a gate before Phase 2 once a framework is declared
3. **Phase 2 (Docs):** Architecture Team translates requirements into technical design
4. **Phase 3 (Compliance):** Compliance Team, with the compliance plugin of an institution pack when the organization has one
5. **Phase 4 (Handoff):** Dev Team receives the four-part handoff kit
6. **Phase 5 (Index):** CI publishes the release to the architecture MCP server; developers ask it and build from its packs

**Key Success Factors:**
- Sequential flow with clear handoffs
- Single source of truth (ARCHITECTURE.md)
- Automatic validation and gap detection
- Iterative refinement for high completeness (>90%)

For more information:
- [Quick Start Guide](QUICK_START.md) - 5-minute tutorial
- [Installation Guide](INSTALLATION.md) - Setup instructions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions