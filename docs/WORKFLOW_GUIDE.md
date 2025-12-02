# Complete Workflow Guide

Comprehensive guide to the three-phase architecture documentation workflow using Solutions Architect Skills.

> **Prerequisites**: Ensure the solutions-architect-skills plugin is installed. See [Installation Guide](INSTALLATION.md).

This guide covers the complete three-phase architecture workflow provided by this Claude Code plugin.

For background on Claude Code plugins, see [official documentation](https://docs.anthropic.com/claude/docs/claude-code-plugins).

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Phase 1: Architecture Readiness](#phase-1-architecture-readiness)
3. [Phase 2: Architecture Documentation](#phase-2-architecture-documentation)
4. [Phase 3: Compliance Generation](#phase-3-compliance-generation)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)
7. [Advanced Usage](#advanced-usage)

---

## Workflow Overview

The Solutions Architect Skills workflow follows a sequential three-phase approach, each owned by a different role:

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Business Requirements (Product Owner)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-readiness skill                        │   │
│  │ Output: PRODUCT_OWNER_SPEC.md                       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Technical Architecture (Architecture Team)        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-docs skill                             │   │
│  │ Output: ARCHITECTURE.md                             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Compliance Documentation (Compliance Team)        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ architecture-compliance skill                       │   │
│  │ Output: compliance-docs/ (11 contracts)             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Sequential Flow:** Each phase builds on the previous phase's output
2. **Role Separation:** Clear ownership (PO → Architects → Compliance)
3. **Single Source of Truth:** ARCHITECTURE.md drives compliance generation
4. **Traceability:** Full audit trail from requirements → architecture → compliance
5. **Automation:** Minimize manual work through skill automation

---

## Phase 1: Architecture Readiness

**Owner:** Product Owner
**Skill:** `architecture-readiness`
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
/skill architecture-readiness
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

##### 2. User Personas
**Purpose:** Who will use the system

**What to document:**
- Primary users (roles, responsibilities, technical level)
- Secondary users
- Administrators
- Stakeholders

**Example:**
```markdown
## 2. User Personas

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

| Section | Weight | Points |
|---------|--------|--------|
| Business Context | 20% | 0-2.0 |
| User Personas | 10% | 0-1.0 |
| Use Cases | 15% | 0-1.5 |
| User Stories | 20% | 0-2.0 |
| Success Criteria | 15% | 0-1.5 |
| Constraints | 10% | 0-1.0 |
| Risks | 5% | 0-0.5 |
| Next Steps | 5% | 0-0.5 |
| **Total** | **100%** | **0-10** |

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
**Output:** `ARCHITECTURE.md`

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

### Workflow Steps

#### Step 1: Activate Skill

```
/skill architecture-docs
```

#### Step 2: Create ARCHITECTURE.md

The skill creates a 12-section document following enterprise standards.

##### Document Index (Lines 1-50)

The skill automatically creates an index showing section boundaries:

```markdown
# Document Index

## Section 1: Executive Summary (lines 51-150)
## Section 2: System Overview (lines 151-300)
## Section 3: Architecture Principles (lines 301-450)
## Section 4: Meta Architecture (lines 451-650)
## Section 5: System Components (lines 651-950)
## Section 6: Data Flow (lines 951-1100)
## Section 7: Integration Points (lines 1101-1300)
## Section 8: Technology Stack (lines 1301-1450)
## Section 9: Security (lines 1451-1650)
## Section 10: Performance (lines 1651-1800)
## Section 11: Operations (lines 1801-2000)
## Section 12: ADRs (lines 2001-2100)
```

**Benefits:**
- Context-efficient editing (load only needed sections)
- Easy navigation in large documents
- Auto-updated after significant changes

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

##### Section 4: Meta Architecture

**Purpose:** Deployment layers and patterns

**Content:**
- Architectural style (microservices, monolith, serverless, etc.)
- Deployment architecture (diagram)
- Environments (dev, staging, production)
- Network architecture

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

**Purpose:** All technologies used (for compliance validation)

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

**Note:** Section 8 is critical for Phase 3 compliance generation. The Development Architecture contract will automatically validate this against a 26-item checklist.

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
- Approved in stack validation (LADES1)
```

#### Step 3: Validate Architecture

The skill provides automatic validation:

**Metric Consistency Check:**
Ensures metrics in Executive Summary match those in Section 10

**Design Drivers Calculation:**
- **Value Delivery:** Extracted from business value statements
- **Scale:** Calculated from TPS, data volumes
- **Impacts:** Count of components (Section 5) + technologies (Section 8)

**Example:**
```
Design Drivers Validation:
✓ Value Delivery: 85% (calculated from business context)
✓ Scale: 450 TPS peak (from Section 10.1)
✓ Impacts: 4 components + 7 core technologies = 11 total
```

#### Step 4: Maintain Document Index

After significant edits, the skill updates the Document Index (lines 1-50) with new line ranges.

### Output: ARCHITECTURE.md

**File size:** 2,000-3,000 lines typically
**Format:** 12 sections with Document Index
**Usage:** Input to Phase 3 (architecture-compliance skill)

---

## Phase 3: Compliance Generation

**Owner:** Compliance Team
**Skill:** `architecture-compliance`
**Input:** `ARCHITECTURE.md` (required)
**Output:** `/compliance-docs/` (11 contracts + manifest)

### Purpose

Generate organizational compliance contracts from technical architecture. This phase ensures:
- Adherence to enterprise standards
- Full traceability from architecture to compliance
- Automatic validation (Development Architecture)
- Gap identification and remediation guidance

### When to Use

- **Post-Architecture:** After ARCHITECTURE.md is complete
- **Compliance Reviews:** Prepare for organizational audits
- **Re-Generation:** After ARCHITECTURE.md updates
- **Selective Generation:** Generate specific contracts on demand

### Workflow Steps

#### Step 1: Activate Skill

```
/skill architecture-compliance
```

#### Step 2: Select Contracts to Generate

**Options:**

**A. Generate All 11 Contracts (Recommended)**
```
Which contracts do you want to generate?
> All

Generating 11 compliance contracts...
```

**B. Generate Specific Contract**
```
Which contracts?
> Arquitectura SRE

Generating 1 contract...
```

**C. Generate by Category**
```
Which contracts?
> Security

Generating 2 contracts: Arquitectura Seguridad, Risk Management
```

**Category Mappings:**
- `security` → Security Architecture, Risk Management
- `cloud` → Cloud Architecture, IT Platforms
- `SRE` → Arquitectura SRE, Business Continuity
- `development` → Development Architecture
- `data` → Data & Analytics/AI
- `integration` → Integration Architecture
- `enterprise` → Enterprise Architecture

#### Step 3: Automatic Generation

The skill performs context-efficient extraction:

**Phase 3.1: Load Document Index**
```
Reading ARCHITECTURE.md index (lines 1-50)...
✓ Document structure validated (12 sections)
```

**Phase 3.2: Extract Data per Contract**

For each contract, load only required sections:

**Example: Arquitectura SRE**
- Primary: Sections 10, 11 (Performance, Operations)
- Secondary: Section 5 (Components)
- Context: 400 lines loaded vs 2,100 total (81% reduction)

**Phase 3.3: Automatic Stack Validation** (Development Architecture only)

When generating Development Architecture contract, the skill automatically validates Section 8 against a 26-item checklist:

```
Performing automatic stack validation...
Analyzing technology stack (Section 8)...

Stack Detection:
✓ Backend: Java 17 + Spring Boot 3.2
✓ Frontend: None (backend-only architecture)
✓ Databases: PostgreSQL 15, Redis 7

Evaluating 26 checklist items...

Results:
✓ Java Backend: 5 PASS, 1 UNKNOWN
  ✓ Java 17 LTS (supported version)
  ✓ Spring Boot 3.2 (supported version)
  ✓ Maven, JUnit, SonarQube (official tools)
  ✓ Docker + AKS (authorized containers)
  ✓ All libraries approved
  ? Naming conventions (not documented)

✓ .NET Backend: All N/A (no .NET detected)
✓ Frontend: All N/A (backend-only architecture)
✓ Other Stacks: 4 PASS, 1 UNKNOWN
  ✓ PostgreSQL, Redis (authorized databases)
  ✓ Helm, Azure DevOps Pipelines (authorized IaC)
  ✓ GitHub Actions (authorized CI/CD)
  ? OpenAPI version (not explicitly specified)

✓ Exceptions: 1 PASS, 2 N/A
  ✓ No stack deviations detected

Overall Status: PASS (11 PASS, 0 FAIL, 12 N/A, 3 UNKNOWN)
Approval: UNBLOCKED (validation passed)
```

**Validation States:**
- ✅ **PASS**: Complies with authorized catalog
- ❌ **FAIL**: Deprecated, unapproved, or missing
- ❓ **UNKNOWN**: Insufficient documentation
- ⚪ **N/A**: Not applicable to architecture

**Phase 3.4: Generate Documents**

```
Generating contracts...
✓ CONTINUIDAD_NEGOCIO_JobScheduling_2025-11-28.md (85% complete, 3 placeholders)
✓ ARQUITECTURA_SRE_JobScheduling_2025-11-28.md (90% complete, 2 placeholders)
✓ CLOUD_ARCHITECTURE_JobScheduling_2025-11-28.md (80% complete, 4 placeholders)
✓ ARQUITECTURA_DATOS_IA_JobScheduling_2025-11-28.md (75% complete, 5 placeholders)
✓ DEVELOPMENT_ARCHITECTURE_JobScheduling_2025-11-28.md (95% complete, PASS validation)
✓ TRANSFORMACION_PROCESOS_JobScheduling_2025-11-28.md (70% complete, 6 placeholders)
✓ ARQUITECTURA_SEGURIDAD_JobScheduling_2025-11-28.md (92% complete, 1 placeholder)
✓ PLATFORM_IT_INFRASTRUCTURE_JobScheduling_2025-11-28.md (88% complete, 2 placeholders)
✓ ARQUITECTURA_EMPRESARIAL_JobScheduling_2025-11-28.md (78% complete, 4 placeholders)
✓ ARQUITECTURA_INTEGRACION_JobScheduling_2025-11-28.md (82% complete, 3 placeholders)
✓ RISK_MANAGEMENT_JobScheduling_2025-11-28.md (65% complete, 7 placeholders)

Generated 11 contracts in /compliance-docs/
Average completeness: 81%
Total placeholders: 37
```

**Phase 3.5: Generate Manifest**

```
Creating COMPLIANCE_MANIFEST.md...
✓ Manifest generated with summary and file index
```

#### Step 4: Review Generated Contracts

**Manifest File:** `compliance-docs/COMPLIANCE_MANIFEST.md`

```markdown
# Compliance Documentation Manifest

**Project:** Job Scheduling Platform
**Source:** ARCHITECTURE.md
**Generated:** 2025-11-28

## Generated Documents

| Contract Type | Filename | Completeness | Placeholders |
|---------------|----------|--------------|--------------|
| Business Continuity | CONTINUIDAD_NEGOCIO_...md | 85% | 3 |
| Arquitectura SRE | ARQUITECTURA_SRE_...md | 90% | 2 |
| Development Architecture | DEVELOPMENT_ARCHITECTURE_...md | 95% | 0 (PASS) |
| ... | ... | ... | ... |

## Summary
- Total Contracts: 11
- Average Completeness: 81%
- Total Placeholders: 37
```

**Individual Contract Example:** `DEVELOPMENT_ARCHITECTURE_JobScheduling_2025-11-28.md`

```markdown
# Compliance Contract: Development Architecture

**Project:** Job Scheduling Platform
**Generation Date:** 2025-11-28
**Source:** ARCHITECTURE.md (Sections 3, 5, 8, 12)

## Document Control

| Field | Value |
|-------|-------|
| **Status** | In Review (ready for approval) |
| **Stack Validation Status** | PASS - MANDATORY for approval |
| **Validation Date** | 2025-11-28 |
| **Validation Evaluator** | Claude Code (Automated) |

## LADES1.6: Stack Validation Results

**Validation Status:** ✅ PASS (Compliant)
**Overall Results:** 11 PASS, 0 FAIL, 12 N/A, 3 UNKNOWN

### Java Backend (6 items): 5 PASS, 1 UNKNOWN
- ✅ Java 17 LTS (supported version)
- ✅ Spring Boot 3.2 (supported version)
- ✅ Official tools (Maven, JUnit, SonarQube)
- ✅ Authorized containers (Docker 24+, AKS 1.28)
- ✅ Approved libraries (all 10 libraries authorized)
- ❓ Naming conventions (not documented in Section 8)

### .NET Backend: All N/A (no .NET detected)

### Frontend: All N/A (backend-only architecture)

### Other Stacks (5 items): 4 PASS, 1 UNKNOWN
- ✅ Databases (PostgreSQL, Redis - authorized)
- ✅ IaC (Helm, Azure DevOps Pipelines - authorized)
- ✅ CI/CD (GitHub Actions - authorized)
- ❓ OpenAPI version (not explicitly documented)

**Recommendations:**
1. Document naming conventions in Section 8
2. Specify OpenAPI/Swagger version

**Source:** ARCHITECTURE.md Section 8, lines 1301-1450
```

#### Step 5: Address Placeholders

If completeness < 90%, review placeholders and update ARCHITECTURE.md:

```markdown
[PLACEHOLDER: RTO (Recovery Time Objective) not specified in ARCHITECTURE.md]
[Recommendation: Add RTO/RPO to Section 11.3 (Backup and Recovery)]
```

**After updating ARCHITECTURE.md:**
1. Regenerate affected contracts
2. Verify higher completeness percentage
3. Iterate until >90% complete

### Output Structure

```
compliance-docs/
├── COMPLIANCE_MANIFEST.md                                    # Index
├── CONTINUIDAD_NEGOCIO_JobScheduling_2025-11-28.md
├── ARQUITECTURA_SRE_JobScheduling_2025-11-28.md
├── CLOUD_ARCHITECTURE_JobScheduling_2025-11-28.md
├── ARQUITECTURA_DATOS_IA_JobScheduling_2025-11-28.md
├── DEVELOPMENT_ARCHITECTURE_JobScheduling_2025-11-28.md     # With stack validation
├── TRANSFORMACION_PROCESOS_JobScheduling_2025-11-28.md
├── ARQUITECTURA_SEGURIDAD_JobScheduling_2025-11-28.md
├── PLATFORM_IT_INFRASTRUCTURE_JobScheduling_2025-11-28.md
├── ARQUITECTURA_EMPRESARIAL_JobScheduling_2025-11-28.md
├── ARQUITECTURA_INTEGRACION_JobScheduling_2025-11-28.md
└── RISK_MANAGEMENT_JobScheduling_2025-11-28.md
```

---

## Integration Patterns

### Pattern 1: Sequential Waterfall

Traditional sequential approach where each phase completes before the next begins.

```
PO Spec (Complete) → ARCHITECTURE.md (Complete) → Compliance Docs (Generate)
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

Iterate on ARCHITECTURE.md and regenerate compliance docs as needed.

```
ARCHITECTURE.md v1 → Compliance Docs v1 → Review Feedback
    ↓
ARCHITECTURE.md v2 → Compliance Docs v2 → Improved Completeness
    ↓
ARCHITECTURE.md v3 → Compliance Docs v3 → Final (>90% complete)
```

**When to use:**
- Complex systems
- Evolving requirements
- Continuous improvement

**Benefits:**
- Progressive refinement
- Early compliance feedback
- Higher final quality

### Pattern 3: Selective Generation

Generate only needed contracts, not all 11.

```
ARCHITECTURE.md → Generate SRE + Security contracts only
```

**When to use:**
- Specific compliance reviews
- Targeted governance checkpoints
- Focused audits

**Benefits:**
- Faster generation
- Reduced overhead
- Focus on relevant domains

---

## Best Practices

### 1. Start Early

- Create PO Spec before architecture work begins
- Ensures alignment between business and technical teams
- Reduces rework and misalignment

### 2. Maintain Single Source of Truth

- ARCHITECTURE.md is the authoritative source
- All compliance docs generated from it
- Update ARCHITECTURE.md, regenerate compliance docs

### 3. Use Document Index

- Lines 1-50 of ARCHITECTURE.md provide structure
- Load only needed sections for context efficiency
- Update index after major edits

### 4. Iterate on Completeness

- First generation: 70-80% complete typical
- Address placeholders, update ARCHITECTURE.md
- Regenerate to achieve >90% completeness

### 5. Validate Stack Early

- Development Architecture contract validates automatically
- Fix stack issues before broader compliance generation
- Use LADES2 for documented exceptions

### 6. Version Control

- Track all three document types in Git
- Tag versions for audit trail
- Include generation dates in filenames

### 7. Automate Regeneration

- Set up CI/CD to regenerate compliance docs on ARCHITECTURE.md changes
- Ensure documentation stays current
- Reduce manual maintenance

---

## Advanced Usage

### Custom Workflow Variations

#### Variation 1: Skip PO Spec for Small Projects

For minor features or small projects, skip Phase 1 and start directly with ARCHITECTURE.md.

```
Business Context (informal) → ARCHITECTURE.md → Compliance Docs
```

#### Variation 2: Parallel Compliance Generation

Generate compliance docs in parallel while still working on ARCHITECTURE.md.

```
ARCHITECTURE.md (Section 8 complete) → Development Architecture contract
ARCHITECTURE.md (Section 9 complete) → Security Architecture contract
```

#### Variation 3: Compliance-Driven Architecture

Use compliance requirements to drive architecture decisions.

```
Review Contract Templates → Identify Required Sections → Create ARCHITECTURE.md
```

### Integration with Other Tools

#### Git Workflow

```bash
# Feature branch for architecture work
git checkout -b feature/job-scheduler-arch

# Create/update documents
/skill architecture-docs
git add ARCHITECTURE.md
git commit -m "docs: Initial architecture for job scheduler"

# Generate compliance
/skill architecture-compliance
git add compliance-docs/
git commit -m "docs: Generate compliance contracts"

# Create PR
git push origin feature/job-scheduler-arch
```

#### CI/CD Automation

```yaml
# .github/workflows/compliance-docs.yml
name: Regenerate Compliance Docs

on:
  push:
    paths:
      - 'ARCHITECTURE.md'

jobs:
  regenerate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Regenerate compliance docs
        run: |
          claude-code --skill architecture-compliance --auto
      - name: Commit updated docs
        run: |
          git add compliance-docs/
          git commit -m "docs: Regenerate compliance docs"
          git push
```

---

## Troubleshooting

### Common Issues

#### Issue: Low Completeness (<70%)

**Cause:** Missing data in ARCHITECTURE.md

**Solution:**
1. Review placeholders in generated contracts
2. Identify missing sections in ARCHITECTURE.md
3. Add required content to ARCHITECTURE.md
4. Regenerate contracts

#### Issue: Stack Validation FAIL

**Cause:** Deprecated or unapproved technologies in Section 8

**Solution:**
1. Review LADES1.6 validation results in Development Architecture contract
2. Identify failed items (Java 8, deprecated frameworks, etc.)
3. Either:
   - Upgrade to approved versions
   - Document exception in LADES2 (with ADR in Section 12)
4. Regenerate Development Architecture contract

#### Issue: Metric Inconsistency

**Cause:** Metrics in Executive Summary don't match Section 10

**Solution:**
1. Skill will flag inconsistencies
2. Update either Executive Summary or Section 10 to match
3. Skill recalculates Design Drivers

---

## Summary

The three-phase workflow provides a complete, traceable path from business requirements to compliance documentation:

1. **Phase 1 (Readiness):** Product Owner documents business context and requirements
2. **Phase 2 (Docs):** Architecture Team translates requirements into technical design
3. **Phase 3 (Compliance):** Compliance Team generates 11 organizational contracts

**Key Success Factors:**
- Sequential flow with clear handoffs
- Single source of truth (ARCHITECTURE.md)
- Automatic validation and gap detection
- Iterative refinement for high completeness (>90%)

For more information:
- [Quick Start Guide](QUICK_START.md) - 5-minute tutorial
- [Installation Guide](INSTALLATION.md) - Setup instructions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions