# Section Mapping Guide

## Purpose

This guide provides detailed mapping between ARCHITECTURE.md sections and compliance contract types, including extraction patterns, transformation rules, and examples for each of the 10 compliance documents.

---

## ARCHITECTURE.md Structure Overview

### Standard 12-Section Structure

> **WARNING — Internal section numbers ≠ file prefix numbers.**
> S9 (Security) = `docs/07-security-architecture.md` — NOT `docs/09-*`.
> `docs/09-operational-considerations.md` = S11. Use the mapping table below; never assume prefix NN = section N.

1. **S1+S2: Executive Summary + System Overview** (`docs/01-system-overview.md`) - High-level description, purpose, scope, business context
2. **S3: Architecture Principles** (`docs/02-architecture-principles.md`) - Design patterns, architectural style
3. **S4: Architecture Layers** (`docs/03-architecture-layers.md`) - Environments, infrastructure, cloud
4. **S5: Component Details** (`docs/components/`) - Components, services, interfaces
5. **S6: Data Flow Patterns** (`docs/04-data-flow-patterns.md`) - Data movement, transformations, pipelines
6. **S7: Integration Points** (`docs/05-integration-points.md`) - External systems, APIs, protocols
7. **S8: Technology Stack** (`docs/06-technology-stack.md`) - Technologies, versions, frameworks
8. **S9: Security Architecture** (`docs/07-security-architecture.md`) - Security controls, compliance
9. **S10: Scalability & Performance** (`docs/08-scalability-and-performance.md`) - SLAs, latency, throughput
10. **S11: Operational Considerations** (`docs/09-operational-considerations.md`) - Monitoring, backup, incidents
11. **S12: Architecture Decision Records** (`adr/`) - ADRs, trade-offs

---

## Mapping Methodology

### Mapping Types

**Primary Source**: 80%+ of contract content comes from these sections
**Secondary Source**: 15-30% of contract content
**Tertiary Source**: <15% of contract content (supplementary)

### Extraction Patterns

1. **Direct Mapping**: Extract exact values (e.g., "RTO: 4 hours")
2. **Aggregation**: Collect related items (e.g., all integrations)
3. **Transformation**: Calculate or reformat (e.g., SLA → error budget)
4. **Inference**: Derive from context (e.g., 99.99% → Tier 1)

### Navigation Index-Based File Loading

#### Overview

Architecture documentation now uses a **multi-file structure** where `ARCHITECTURE.md` is a navigation index (~130 lines) and section content lives in separate `docs/` files. This eliminates the need for line-offset based reads — each section is an independent file that can be read directly.

#### ARCHITECTURE.md as Navigation Index

`ARCHITECTURE.md` (~130 lines) contains the project name, overview, and links to the `docs/` files. Read the full file to extract the project name:

```
Read file: ARCHITECTURE.md
Extract project name from first H1 (line starting with "# ")
Note: ARCHITECTURE.md is a navigation index only — section content lives in docs/ files
```

#### Section-to-File Mapping

Each logical section now maps to a specific file in the `docs/` directory:

| Section | Content | File |
|---------|---------|------|
| S1+S2 (Executive Summary + System Overview) | Business context, system purpose, scope | `docs/01-system-overview.md` |
| S3 (Architecture Principles) | Design principles, patterns, constraints | `docs/02-architecture-principles.md` |
| S4 (Architecture Layers) | Deployment architecture, environment design | `docs/03-architecture-layers.md` |
| S5 (Component Details) | Components, services, interfaces | `docs/components/README.md` |
| S6 (Data Flow Patterns) | Data movement, pipelines, transformations | `docs/04-data-flow-patterns.md` |
| S7 (Integration Points) | External systems, APIs, protocols | `docs/05-integration-points.md` |
| S8 (Technology Stack) | Technologies, versions, frameworks | `docs/06-technology-stack.md` |
| S9 (Security Architecture) | Security controls, compliance | `docs/07-security-architecture.md` |
| S10 (Scalability & Performance) | SLAs, latency, throughput, SLOs | `docs/08-scalability-and-performance.md` |
| S11 (Operational Considerations) | Monitoring, backup, incidents, DR | `docs/09-operational-considerations.md` |
| S12 (ADRs) | Architecture Decision Records | `adr/README.md` |
| References | External references | `docs/10-references.md` |

> **NEVER use section numbers as file lookups.** S9 ≠ `docs/09-*`. Always use the file paths in the table above.

#### Two-Step File Loading Workflow

##### Step 1: Read ARCHITECTURE.md to Get Project Name

```
Read file: ARCHITECTURE.md
Extract: project name from H1 header
```

##### Step 2: Read Specific docs/ Files Directly

For each section needed, read the corresponding file in full (no offset needed):

```
Read file: docs/09-operational-considerations.md
Read file: docs/08-scalability-and-performance.md
Read file: docs/07-security-architecture.md
# etc.
```

**Benefits of multi-file structure:**
- No line-offset calculations required
- Each file can be read in full without context waste
- Clear 1:1 mapping between section and file
- Source references use file paths instead of line numbers

#### Source Reference Format

Source references now use file paths instead of section numbers:

- **Old format**: `ARCHITECTURE.md Section 11.2`
- **New format**: `docs/09-operational-considerations.md`

**Examples:**
- RTO/RPO/DR data → `docs/09-operational-considerations.md`
- SLO/SLI/latency data → `docs/08-scalability-and-performance.md`
- Security controls → `docs/07-security-architecture.md`
- Integration patterns → `docs/05-integration-points.md`
- Technology stack → `docs/06-technology-stack.md`
- Data flow patterns → `docs/04-data-flow-patterns.md`
- Component details → `docs/components/README.md`
- ADR decisions → `adr/README.md`
- Business context → `docs/01-system-overview.md`

#### Context-Efficient Loading Strategy

With multi-file structure, loading is straightforward:

1. **Read ARCHITECTURE.md** (navigation index, ~130 lines): Get project name
2. **Read required docs/ files** (each file): Full content, no offsets needed
3. **Apply Grep patterns** against the specific docs/ file for targeted extraction

**Example for SRE contract:**
```
Read file: ARCHITECTURE.md                          # ~130 lines - get project name
Read file: docs/08-scalability-and-performance.md   # SLOs, SLIs, latency targets
Read file: docs/09-operational-considerations.md    # Monitoring, DR, runbooks
Read file: docs/components/README.md                # Infrastructure resilience
```

---

## Contract Summary Matrix

| Contract Type | Primary Files | Secondary Files | Complexity | Templates Priority |
|---------------|---------------|-----------------|------------|-------------------|
| **1. Business Continuity v2.0** | docs/01-system-overview.md, docs/02-architecture-principles.md, docs/03-architecture-layers.md, docs/components/README.md, docs/05-integration-points.md, docs/06-technology-stack.md, docs/08-scalability-and-performance.md, docs/09-operational-considerations.md | - | High | High (#2) |
| **2. SRE Architecture** | docs/08-scalability-and-performance.md, docs/09-operational-considerations.md | docs/components/README.md | High | High (#1) |
| **3. Cloud Architecture** | docs/03-architecture-layers.md, docs/06-technology-stack.md, docs/09-operational-considerations.md | docs/07-security-architecture.md, docs/08-scalability-and-performance.md | High | Medium (#3) |
| **4. Data & Analytics - AI Architecture** | docs/components/README.md, docs/04-data-flow-patterns.md, docs/05-integration-points.md | docs/06-technology-stack.md, docs/08-scalability-and-performance.md | High | Medium (#4) |
| **5. Development Architecture** | docs/02-architecture-principles.md, docs/components/README.md, docs/06-technology-stack.md, adr/README.md | docs/09-operational-considerations.md | Medium | Medium (#5) |
| **6. Process Transformation** | docs/01-system-overview.md, docs/04-data-flow-patterns.md | docs/components/README.md, docs/05-integration-points.md | Low | Low (#6) |
| **7. Security Architecture v2.0** | docs/03-architecture-layers.md, docs/components/README.md, docs/05-integration-points.md, docs/07-security-architecture.md, docs/09-operational-considerations.md | - | High | High (#7) |
| **8. Platform & IT Infrastructure** | docs/03-architecture-layers.md, docs/06-technology-stack.md, docs/09-operational-considerations.md | docs/08-scalability-and-performance.md | Medium | Medium (#8) |
| **9. Enterprise Architecture** | docs/01-system-overview.md, docs/02-architecture-principles.md, docs/03-architecture-layers.md | adr/README.md | Medium | Medium (#9) |
| **10. Integration Architecture v2.0** | docs/components/README.md, docs/04-data-flow-patterns.md, docs/05-integration-points.md, docs/07-security-architecture.md | - | High | High (#10) |

---

## Detailed Contract Mappings

### Contract 1: Business Continuity v2.0

#### Document Purpose
Ensure comprehensive business continuity planning through disaster recovery, high availability, backup strategies, cloud resilience patterns, and SPOF analysis.

#### Template Characteristics
- **Version**: 2.0
- **Total Requirements**: 43 (LACN001-LACN043)
- **Requirement Prefix**: LACN (replaced LABC from v1.0)
- **Format**: 6-column compliance summary table
- **Categories**: 6 (BC-GEN, BC-RTO, BC-DR, BC-BACKUP, BC-AUTO, BC-CLOUD)
- **Template Priority**: High (#2)

#### Template Format Structure

**Compliance Summary Table (6 columns)**:
```
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LACN001 | Document the official name... | BC-GEN | [Status] | Section 1 or 2 | [Role] |
| LACN002 | Specify the architectural pattern... | BC-GEN | [Status] | Section 3 or 4 | [Role] |
...
| LACN043 | Identify all potential single points... | BC-CLOUD | [Status] | Section 3 or 11 | [Role] |
```

Status values: `Compliant`, `Non-Compliant`, `Not Applicable`, `Unknown`

#### ARCHITECTURE.md Section Mapping by Category

##### Category 1: BC-GEN (General Information) - 5 Requirements

**LACN001: Application or Initiative Name**
- **Source**: Section 1 (Business Context) or Section 2 (System Overview)
- **Extract**: Official application name, acronyms, alternative names
- **Pattern**: Look for project name, system name in Section 1 or 2 header
- **Example**: "Payment Processing Platform (PPP)" → Compliant

**LACN002: Architecture Type and Deployment Model**
- **Source**: Section 3 (Architecture Overview) or Section 4 (Deployment Architecture)
- **Extract**: Architecture pattern (monolithic, microservices, serverless), deployment (on-prem, cloud, hybrid)
- **Pattern**: Search for "architecture pattern", "deployment model", "microservices", "cloud"
- **Example**: "Microservices on AWS EKS" → Compliant

**LACN003: Number of Architecture Layers**
- **Source**: Section 4 (Architecture Layers) - Primary; Section 3 (Architecture Overview) - Fallback for non-typed architectures
- **Extract**: Layer count and layer names based on architecture type
- **Architecture-Type-Aware Extraction**:
  - **Step 1**: Detect architecture type from `<!-- ARCHITECTURE_TYPE: [TYPE] -->` comment in `docs/03-architecture-layers.md`
  - **Step 2**: Read `docs/03-architecture-layers.md` in full (no offset needed)
  - **Step 3**: Apply type-specific extraction pattern:

  **META Architecture** (Section 4):
  - **Pattern**: Search for "## Layers Overview" table, extract "Layer 1:", "Layer 2:", etc.
  - **Expected**: 6 layers - Channels, User Experience, Business Scenarios, Business, Domain, Core
  - **Example**: "6 layers: Channels, User Experience, Business Scenarios, Business, Domain, Core" → Compliant

  **BIAN Architecture** (Section 4):
  - **Pattern**: Search for "## Layers Overview" table, extract "Layer 1:", "Layer 2:", etc.
  - **Expected**: 5 layers - Channels, BIAN Business Scenarios, BIAN Business Capabilities, BIAN Service Domains, Core
  - **Example**: "5 layers: Channels, BIAN Business Scenarios, BIAN Business Capabilities, BIAN Service Domains, Core" → Compliant

  **3-Tier Architecture** (Section 4):
  - **Pattern**: Search for "## Tiers Overview" table, extract "Tier 1:", "Tier 2:", "Tier 3:"
  - **Expected**: 3 tiers - Presentation, Application/Business Logic, Data
  - **Example**: "3 tiers: Presentation, Application/Business Logic, Data" → Compliant

  **Microservices Architecture** (Section 4):
  - **Pattern**: Count independent services in service catalog or API Gateway topology
  - **Expected**: Variable (count bounded contexts)
  - **Example**: "8 microservices: Auth, Payment, Order, Inventory, Shipping, Notification, Analytics, Gateway" → Compliant

  **N-Layer Architecture** (Section 4):
  - **Pattern**: Search for "Layer 1:", "Layer 2:", etc. or custom layer definitions
  - **Expected**: 4-7 layers (variable)
  - **Example**: "4 layers: Presentation, Application, Domain, Infrastructure" → Compliant

  **UNKNOWN (Fallback)** (Section 3):
  - **Pattern**: Generic search for "tier", "layer", numbered architecture levels
  - **Example**: "4-tier: Presentation, API, Business Logic, Data" → Compliant
  - **Note**: This fallback maintains backward compatibility with architectures that don't use the ARCHITECTURE_TYPE comment

- **Extraction Workflow**:
  1. Read `docs/03-architecture-layers.md` in full
  2. Search for `<!-- ARCHITECTURE_TYPE: META -->` or similar comment
  3. If architecture type detected:
     - Apply type-specific pattern to extract layer names from "## Layers Overview" or "## Tiers Overview" table
     - Count layers and extract exact names
     - Store: layer_count, layer_names[], architecture_type, source_file="docs/03-architecture-layers.md"
  4. If architecture type NOT detected (UNKNOWN):
     - Fall back to `docs/02-architecture-principles.md`
     - Use generic "tier", "layer" pattern
     - Store: layer_count, layer_names[], architecture_type="UNKNOWN", source_file="docs/02-architecture-principles.md"
  5. Return structured data with architecture type metadata

- **Key Distinction**:
  - **Logical Architecture Layers** (`docs/03-architecture-layers.md`): Enterprise layers organizing system components by responsibility (META, BIAN, 3-Tier)
  - **Deployment Infrastructure Layers** (avoid): Technical deployment topology (API Gateway, Execution, Data layers)
  - This extraction targets **logical architecture layers only**

**LACN004: Infrastructure Type**
- **Source**: Section 4 (Deployment Architecture) or Section 11 (Operational → Infrastructure)
- **Extract**: Physical servers, VMs, containers, serverless, hybrid
- **Pattern**: Search for "infrastructure", "deployment", "Kubernetes", "EKS", "containers"
- **Example**: "Kubernetes containers on AWS EKS" → Compliant

**LACN005: Critical System Dependencies**
- **Source**: Section 1 (Business Context → Dependencies) or Section 5 (System Integrations)
- **Extract**: Internal systems, external APIs, databases, infrastructure components
- **Pattern**: Search for "dependencies", "integrations", "external systems", dependency diagrams
- **Example**: "Auth0 (SSO), Stripe (payments), PostgreSQL (database), Redis (cache)" → Compliant

##### Category 2: BC-RTO (Recovery Time Objectives) - 2 Requirements

**LACN012: Recovery Time Objective (RTO) Definition**
- **Source**: Section 10 (Non-Functional Requirements) or Section 11 (Operational → DR)
- **Extract**: Maximum acceptable downtime
- **Pattern**: `RTO:?\s*([0-9]+\s*(hours?|minutes?|days?))`
- **Example**: "RTO: 4 hours" → Compliant

**LACN024: RPO Validation with Business Stakeholders**
- **Source**: Section 10 (Non-Functional Requirements) or Section 11 (Operational → Backup & DR)
- **Extract**: Maximum acceptable data loss, business approval
- **Pattern**: `RPO:?\s*([0-9]+\s*(hours?|minutes?))`, look for "approved by", "validated with"
- **Example**: "RPO: 1 hour, validated with CFO on 2024-11-15" → Compliant

##### Category 3: BC-DR (Disaster Recovery) - 11 Requirements

**LACN006: High Availability Requirement**
- **Source**: Section 10 (Non-Functional Requirements → Availability)
- **Extract**: HA required (Yes/No), target availability %
- **Pattern**: Search for "high availability", "HA", "99.9%", "uptime"
- **Example**: "HA Required: Yes, 99.95% availability" → Compliant

**LACN007: High Availability Component Scope**
- **Source**: Section 11 (Operational → High Availability)
- **Extract**: Which components have HA, deployment pattern
- **Pattern**: Search for "active-active", "active-passive", "redundant", component names
- **Example**: "API servers: active-active across 3 AZs, Database: primary-replica with auto-failover" → Compliant

**LACN008: Local Contingency Requirement**
- **Source**: Section 11 (Operational → High Availability)
- **Extract**: Within-AZ/datacenter failover capabilities
- **Pattern**: Search for "local failover", "same AZ", "component redundancy"
- **Example**: "Auto-scaling with health checks, instance replacement within 5 min" → Compliant

**LACN009: Disaster Recovery Requirement**
- **Source**: Section 11 (Operational → Disaster Recovery)
- **Extract**: DR needed (Yes/No), scenarios addressed
- **Pattern**: Search for "disaster recovery", "DR required", "regional outage"
- **Example**: "DR Required: Yes, addresses regional outages" → Compliant

**LACN010: Disaster Recovery Architecture Pattern**
- **Source**: Section 11 (Operational → Disaster Recovery)
- **Extract**: Cold/warm/hot/active-active, primary/DR sites
- **Pattern**: Search for "cold standby", "warm standby", "hot standby", "active-active", site names
- **Example**: "Warm standby: Primary us-east-1, DR us-west-2" → Compliant

**LACN011: Data Replication Method for DR**
- **Source**: Section 11 (Operational → Disaster Recovery → Data Replication)
- **Extract**: Synchronous/asynchronous/snapshot/backup-restore
- **Pattern**: Search for "replication", "sync", "async", "snapshot"
- **Example**: "Asynchronous replication with 5-minute lag" → Compliant

**LACN013: Contingency and DR Testing Requirement**
- **Source**: Section 11 (Operational → Disaster Recovery → Testing)
- **Extract**: Testing frequency, test types
- **Pattern**: Search for "DR drill", "quarterly", "testing", "failover test"
- **Example**: "Quarterly DR drills, annual full failover" → Compliant

**LACN014: Resilience to Transient Component Failures**
- **Source**: Section 11 (Operational → Resilience) or Section 7 (Application Architecture → Resilience Patterns)
- **Extract**: Resilience patterns implemented
- **Pattern**: Search for "circuit breaker", "retry", "resilience patterns"
- **Example**: "Circuit breakers and retry logic on all external calls" → Compliant

**LACN015: Batch Processing Requirement**
- **Source**: Section 7 (Application Architecture → Batch Processing) or Section 11 (Operational)
- **Extract**: Batch jobs inventory
- **Pattern**: Search for "batch", "scheduled jobs", "ETL", "data pipeline"
- **Example**: "Daily report generation at 2 AM UTC" → Compliant

**LACN016: Batch Execution Type**
- **Source**: Section 7 (Application Architecture → Batch Processing)
- **Extract**: Scheduled/event-triggered/manual/on-demand
- **Pattern**: Search for "cron", "scheduled", "event-driven", "trigger"
- **Example**: "Scheduled (cron), event-triggered on S3 upload" → Compliant

**LACN017: Batch Job Reprocessing on Failure**
- **Source**: Section 7 (Application Architecture → Batch Processing → Error Handling)
- **Extract**: Idempotency, retry, checkpoint/resume
- **Pattern**: Search for "idempotent", "retry", "checkpoint", "reprocessing"
- **Example**: "Idempotent design, checkpoint every 1000 records" → Compliant

##### Category 4: BC-BACKUP (Backup and Recovery) - 13 Requirements

**LACN018: Periodic Data Backup Requirement**
- **Source**: Section 11 (Operational → Backup & Restore)
- **Extract**: Backup required (Yes/No), scope
- **Pattern**: Search for "backup", "data backup", database names
- **Example**: "Backups required for PostgreSQL, S3, configs" → Compliant

**LACN019: Backup Frequency**
- **Source**: Section 11 (Operational → Backup & Restore → Schedule)
- **Extract**: Full/incremental backup schedule
- **Pattern**: `(daily|hourly|weekly).*backup`, `([0-9]+\s*(AM|PM|UTC))`
- **Example**: "Full daily at 2 AM UTC, incremental every 6 hours" → Compliant

**LACN020: Backup Retention Period**
- **Source**: Section 11 (Operational → Backup & Restore → Retention)
- **Extract**: Retention policy by type
- **Pattern**: `([0-9]+\s*(days?|months?|years?)).*retention`
- **Example**: "30 days online, 90 days warm, 7 years archival" → Compliant

**LACN021: Backup Versioning Strategy**
- **Source**: Section 11 (Operational → Backup & Restore → Versioning)
- **Extract**: Overwrite vs. historical versioning
- **Pattern**: Search for "versioning", "historical", "point-in-time"
- **Example**: "Historical: 30 daily, 12 monthly, 7 yearly" → Compliant

**LACN022: Data Recreation Difficulty Assessment**
- **Source**: Section 11 (Operational → Backup & Restore) or Section 1 (Business Context)
- **Extract**: Impossible/difficult/moderate/easy to recreate
- **Pattern**: Search for "data recreation", "recreate", "impossible to recreate"
- **Example**: "Transaction data: impossible to recreate" → Compliant

**LACN023: Business Impact of Data Loss**
- **Source**: Section 1 (Business Context → Business Impact Analysis)
- **Extract**: Revenue, operational, compliance, reputation impact
- **Pattern**: `\$[0-9,]+.*loss`, "regulatory fine", "business impact"
- **Example**: "$500K/hour revenue loss, $2M regulatory fines" → Compliant

**LACN025: Geographic Backup Distribution**
- **Source**: Section 11 (Operational → Backup & Restore → Geographic Distribution)
- **Extract**: Offsite location, distance
- **Pattern**: Search for "cross-region", "geographic", "offsite", region names
- **Example**: "Cross-region replication to us-west-2" → Compliant

**LACN026: Infrastructure Configuration Backup**
- **Source**: Section 11 (Operational → Backup & Restore → Infrastructure)
- **Extract**: OS configs, app configs, IaC
- **Pattern**: Search for "infrastructure backup", "IaC", "Terraform", "AMI"
- **Example**: "Terraform state in S3, Kubernetes manifests in Git" → Compliant

**LACN027: Infrastructure Change Log Backup**
- **Source**: Section 11 (Operational → Logging & Monitoring or Backup & Restore)
- **Extract**: Audit log retention
- **Pattern**: Search for "audit log", "CloudTrail", "log retention"
- **Example**: "CloudTrail logs: 90 days operational, 7 years archive" → Compliant

**LACN028: Full Application Restore Capability**
- **Source**: Section 11 (Operational → Backup & Restore → Testing)
- **Extract**: Restore testing frequency, RTO
- **Pattern**: Search for "restore test", "DR drill", "restoration"
- **Example**: "Quarterly restore tests to staging, RTO 4 hours" → Compliant

**LACN029: Sensitive Data Classification**
- **Source**: Section 8 (Security Architecture → Data Classification) or Section 11 (Operational)
- **Extract**: PII, financial, health data handling
- **Pattern**: Search for "PII", "sensitive data", "PCI-DSS", "data classification"
- **Example**: "Customer PII (encrypted), Payment data (PCI-DSS)" → Compliant

**LACN030: Backup Responsibility Assignment**
- **Source**: Section 11 (Operational → Backup & Restore → Responsibilities)
- **Extract**: Team/role responsible for backups
- **Pattern**: Search for "backup responsibility", "owned by", "RACI"
- **Example**: "Infrastructure team: backup execution, DBA: validation" → Compliant

**LACN031: Backup Download to Local/On-Premises**
- **Source**: Section 11 (Operational → Backup & Restore → Hybrid Strategy)
- **Extract**: Cloud-to-on-prem backup capability
- **Pattern**: Search for "hybrid", "download", "on-premises", "air-gap"
- **Example**: "Weekly download to on-prem tape (air-gap)" → Compliant

##### Category 5: BC-AUTO (DR Automation) - 2 Requirements

**LACN032: DR Activation Automation Capability**
- **Source**: Section 11 (Operational → Disaster Recovery → Automation)
- **Extract**: Fully automated/semi-automated/manual
- **Pattern**: Search for "automated failover", "manual DR", "semi-automated"
- **Example**: "Semi-automated: health checks alert, manual approval for failover" → Compliant

**LACN033: Automatable DR Components**
- **Source**: Section 11 (Operational → Disaster Recovery → Automation)
- **Extract**: Which components can be automated
- **Pattern**: Search for "automated", component names, "manual", "runbook"
- **Example**: "Automated: DNS (Route53), DB promotion. Manual: validation" → Compliant

##### Category 6: BC-CLOUD (Cloud Resilience) - 10 Requirements

**LACN034: Circuit Breaker Pattern Requirement**
- **Source**: Section 7 (Application Architecture → Resilience Patterns)
- **Extract**: Circuit breaker implementation
- **Pattern**: Search for "circuit breaker", library names (Hystrix, Resilience4j)
- **Example**: "Resilience4j circuit breaker, 50% threshold, 60s timeout" → Compliant

**LACN035: Retry with Exponential Backoff Pattern**
- **Source**: Section 7 (Application Architecture → Resilience Patterns)
- **Extract**: Retry policy details
- **Pattern**: `([0-9]+).*retr`, "exponential backoff", "backoff"
- **Example**: "Max 3 retries, 1s initial, 2x backoff, 30s max" → Compliant

**LACN036: Timeout Configuration for External Services**
- **Source**: Section 7 (Application Architecture → Resilience Patterns) or Section 5 (Integrations)
- **Extract**: Timeout values per service
- **Pattern**: `timeout:?\s*([0-9]+\s*s)`, "connection timeout", "read timeout"
- **Example**: "Stripe: connection 5s, read 30s" → Compliant

**LACN037: Timeboxing for Automated Contingency/DRP**
- **Source**: Section 11 (Operational → Disaster Recovery → Automation)
- **Extract**: Time-bound failover triggers
- **Pattern**: `> ([0-9]+\s*min).*failover`, "time window", "timeout"
- **Example**: "If primary unreachable > 5 min, trigger failover" → Compliant

**LACN038: Fallback Response Pattern**
- **Source**: Section 7 (Application Architecture → Resilience Patterns)
- **Extract**: Degraded functionality strategies
- **Pattern**: Search for "fallback", "cached response", "degraded mode"
- **Example**: "Return cached catalog if DB down" → Compliant

**LACN039: Bulkhead Isolation Pattern**
- **Source**: Section 7 (Application Architecture → Resilience Patterns)
- **Extract**: Resource isolation (thread pools, connection pools)
- **Pattern**: Search for "bulkhead", "thread pool", "isolation"
- **Example**: "Separate thread pools: checkout (20), search (50)" → Compliant

**LACN040: Auto-Scaling with Health-Based Instance Replacement**
- **Source**: Section 11 (Operational → Auto-Scaling) or Section 4 (Deployment Architecture)
- **Extract**: Auto-scaling config, health checks
- **Pattern**: Search for "auto-scaling", "min/max instances", "health check"
- **Example**: "Min 2, max 20, health check /health every 30s" → Compliant

**LACN041: Load Balancing for Traffic Distribution**
- **Source**: Section 4 (Deployment Architecture → Load Balancing) or Section 11 (Operational)
- **Extract**: Load balancer type, algorithm
- **Pattern**: Search for "load balancer", "ALB", "NLB", algorithm names
- **Example**: "ALB with least-outstanding-requests, cross-zone" → Compliant

**LACN042: Queue-Based Load Leveling Pattern**
- **Source**: Section 7 (Application Architecture → Asynchronous Processing)
- **Extract**: Message queue usage for traffic absorption
- **Pattern**: Search for "queue", "SQS", "Kafka", "asynchronous"
- **Example**: "SQS for orders, workers scale on queue depth" → Compliant

**LACN043: Single Points of Failure (SPOF) Identification**
- **Source**: Section 3 (Architecture Overview) or Section 11 (Operational → High Availability)
- **Extract**: SPOF analysis and mitigations
- **Pattern**: Search for "SPOF", "single point", "no redundancy"
- **Example**: "SPOF: Single DB. Mitigation: Primary-replica in 3 AZs" → Compliant

#### Extraction Workflow

**Step 1: Read Navigation Index**
```
Read ARCHITECTURE.md (full file, ~130 lines)
Extract project name from H1 header
```

**Step 2: Read Required docs/ Files**

For each LACN category, read the relevant docs/ file:
```
Read docs/01-system-overview.md         # BC-GEN: project name, dependencies
Read docs/02-architecture-principles.md  # BC-GEN: architecture type
Read docs/03-architecture-layers.md      # BC-GEN: layers, infrastructure
Read docs/05-integration-points.md       # BC-GEN: critical dependencies
Read docs/06-technology-stack.md         # BC-BACKUP: sensitive data
Read docs/08-scalability-and-performance.md  # BC-RTO: RTO/RPO, HA
Read docs/09-operational-considerations.md   # BC-DR, BC-BACKUP, BC-AUTO: DR, backup, automation
```

**Step 3: Extract by Category (43 iterations)**

For each LACN requirement:
1. Identify source file from mapping above
2. Apply extraction pattern (Grep or string search) against docs/ file
3. Determine status (Compliant/Non-Compliant/Not Applicable/Unknown)
4. Populate table row

**Step 4: Generate Compliance Summary**

Transform extracted data → 6-column table:
```
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LACN001 | Application Name | BC-GEN | Compliant | docs/01-system-overview.md | Business Team |
| LACN012 | RTO Definition | BC-RTO | Compliant | docs/08-scalability-and-performance.md | Infrastructure |
...
```

#### File-Based Extraction Example

**LACN012 (RTO)** extraction:
```
1. Read docs/08-scalability-and-performance.md (full file)
2. Grep in file: "RTO:?\s*([0-9]+\s*(hours?|minutes?))"
3. Match found
4. Source reference: "docs/08-scalability-and-performance.md"
5. Value: "4 hours"
6. Status: Compliant (RTO documented)
```

#### Cross-Contract Data Sharing

**Shared with SRE Architecture**:
- RTO/RPO (LACN012, LACN024) → SRE error budget calculation
- Availability SLA (LACN006) → SRE SLO definition
- DR automation (LACN032-033) → SRE operational procedures

**Shared with Cloud Architecture**:
- Infrastructure type (LACN004) → Cloud deployment model
- Auto-scaling (LACN040) → Cloud capacity planning
- Load balancing (LACN041) → Cloud traffic management

**Shared with Security Architecture**:
- Sensitive data (LACN029) → Security data classification
- Audit logs (LACN027) → Security compliance logging

**Transformation Example** (RTO → Error Budget):
```
LACN012 RTO: 4 hours
Section 10 Availability: 99.95%
→ Error Budget = (1 - 0.9995) × 30 days × 24 hours = 21.6 minutes/month
Used in SRE contract for operational targets
```

#### Migration Notes (v1.0 → v2.0)

**Removed**:
- ❌ Section-based narrative format (5 sections: RTO/RPO, Backup, DR, BIA, Resilience, Testing)
- ❌ LABC prefix (10 requirements)
- ❌ Medium complexity rating
- ❌ Single source section (Section 11 only)

**Added**:
- ✅ 6-column compliance table format
- ✅ LACN prefix (43 requirements, 330% increase)
- ✅ 6 technical categories with weighted scoring
- ✅ 8 distributed source sections
- ✅ Cloud resilience patterns (circuit breaker, retry, bulkhead, fallback)
- ✅ Auto-scaling and load balancing requirements
- ✅ SPOF analysis
- ✅ Batch processing continuity
- ✅ Enhanced backup requirements (13 vs. 2 in v1.0)
- ✅ DR automation requirements

**Changed**:
- 🔄 Complexity: Medium → High
- 🔄 Source sections: 2 (Sections 10, 11) → 8 (Sections 1, 3, 4, 5, 7, 8, 10, 11)
- 🔄 Format: Narrative → Structured table
- 🔄 Validation: Basic presence → Category-weighted scoring
- 🔄 Priority: Implicitly Medium → Explicitly High (#2)

**Version History**:

v2.0 (Current - December 2024):
- Data source: Compliance_Questionnaire_LACN.xlsx
- Total validation points: 43
- All requirements use presence-check validation (no complex rule logic)
- Approval threshold: 8.0 (auto), 7.0 (manual review)
- Scoring: Completeness 40%, Compliance 50%, Quality 10%

v1.0 (Previous):
- Data source: Manual questionnaire
- Total validation points: 10
- Limited to operational sections only
- No cloud resilience coverage

---

### Contract 2: SRE Architecture (Site Reliability Engineering) v2.0

#### Document Purpose
Define site reliability, observability, automation, and resilience practices through 57 LASRE requirements to ensure production-ready solutions.

#### Template Version
**v2.0** - Requirement-based compliance with two-tier scoring (Blocker/Desired)

#### Required Content Sections
**3 Main Sections (57 LASRE Requirements)**:

1. **Practice Requirements** (LASRE01-16): 16 Blocker
2. **Observability Requirements** (LASRE17-42): 20 Blocker + 6 Desired
3. **Automation Requirements** (LASRE43-57): 15 Desired

#### Two-Tier Scoring System
- **36 Blocker Requirements**: MANDATORY - All must pass (ANY failure blocks approval)
- **21 Desired Requirements**: OPTIONAL - Enhancement recommendations
- **Final Score** = (Blocker Score × 0.7) + (Desired Score × 0.3)
- **Approval**: Score ≥ 7.0 requires 100% Blocker compliance
- **Auto-Approval**: Score ≥ 8.0 requires all Blocker + 60% Desired

#### ARCHITECTURE.md Section Mapping

**Primary Sources (80% of content)**:

##### Section 11 (Operational Considerations) - 50%
**Maps to**: LASRE01-06, LASRE13-16, LASRE20-42, LASRE46-57

**Subsections**:
- **11.1 Monitoring and Logging**: LASRE01-03 (log management), LASRE13 (observability requests), LASRE20-26 (monitoring), LASRE29-32 (infrastructure monitoring), LASRE37-38 (log centralization)
- **11.2 Incident Management, DR**: LASRE12 (DRP), LASRE15 (escalation), LASRE34-35 (DR automation), LASRE44-45 (resilience testing)
- **11.3 Deployment, CI/CD**: LASRE04 (rollback), LASRE33 (deployment consistency), LASRE36 (service management), LASRE40-41 (deployment strategies), LASRE46 (operational tasks)
- **11.4 Configuration, Documentation**: LASRE05 (config repos), LASRE06 (SOP documentation), LASRE39 (version control), LASRE55-56 (operational automation)

**Extraction Pattern**:
```markdown
docs/09-operational-considerations.md:
"Logging:
- Format: JSON structured logs
- Levels: DEBUG, INFO, WARN, ERROR
- Storage: Splunk centralized logging
- Access: Self-service dashboard"

Maps to Contract:
- LASRE01 (Blocker): Structured logging ✓ Compliant
- LASRE02 (Blocker): Log levels ✓ Compliant
- LASRE03 (Blocker): Log accessibility ✓ Compliant
- LASRE37 (Desired): Centralized logging (Splunk) ✓ Compliant
```

##### docs/08-scalability-and-performance.md (Scalability & Performance) - 30%
**Maps to**: LASRE07-11, LASRE17-19, LASRE42-44

**Subsections**:
- **Performance Metrics, Resilience**: LASRE07 (readiness probes), LASRE08 (health checks), LASRE10 (load testing), LASRE11 (auto-scaling), LASRE42-44 (resilience patterns)
- **Availability, SLAs**: LASRE09 (HA), LASRE17-18 (availability/performance measurement), LASRE19 (thresholds)

**Extraction Pattern**:
```markdown
docs/08-scalability-and-performance.md:
"Resilience:
- Readiness probe: /health/ready (HTTP 200)
- Liveness probe: /health/live (HTTP 200)
- Health check interval: 10s
- Replicas: 3 (min), 10 (max)
- Auto-scaling: CPU > 70%
- Load tested: 5000 TPS peak"

Maps to Contract:
- LASRE07 (Blocker): Readiness probes ✓ Compliant
- LASRE08 (Blocker): Health checks ✓ Compliant
- LASRE09 (Blocker): HA (3 replicas) ✓ Compliant
- LASRE10 (Blocker): Load testing ✓ Compliant
- LASRE11 (Blocker): Auto-scaling ✓ Compliant
```

**Secondary Sources (20% of content)**:

##### Section 5 (Infrastructure) - 10%
**Maps to**: LASRE29-31, LASRE33, LASRE52-54

**Extraction**: Infrastructure monitoring agents, container platforms, cloud tagging

##### Section 4 (System Architecture) - 5%
**Maps to**: LASRE13, LASRE46-47

**Extraction**: C2 diagrams, critical journey identification

##### Section 2 (Project Context) - 5%
**Maps to**: LASRE14, LASRE27-28

**Extraction**: Portfolio registration, cost estimation

#### LASRE Requirement Categories

**Log Management** (LASRE01-03, 37-38):
- Source: `docs/09-operational-considerations.md` (Monitoring and Logging subsection)
- Blocker: Structured format, log levels, accessibility
- Desired: Centralization, verbosity control

**Application Deployment** (LASRE04, 33):
- Source: `docs/09-operational-considerations.md` (Deployment subsection)
- Blocker: Rollback mechanisms, deployment consistency

**Configuration Management** (LASRE05, 15, 39):
- Source: `docs/09-operational-considerations.md` (Configuration subsection)
- Blocker: Secure repositories
- Desired: Version control

**Operational Documentation** (LASRE06):
- Source: `docs/09-operational-considerations.md` (Documentation subsection)
- Blocker: SOP in official repositories

**Operational Resilience** (LASRE07-11, 42-44):
- Source: `docs/08-scalability-and-performance.md`
- Blocker: Readiness, health checks, HA, load testing, auto-scaling
- Desired: 7x24 maintenance, circuit breakers, retries

**Recovery and Resilience Testing** (LASRE12, 45):
- Source: `docs/09-operational-considerations.md` (DR subsection)
- Blocker: Documented DRP
- Desired: Chaos testing

**Information and Architecture** (LASRE13-16, 46-47):
- Source: `docs/01-system-overview.md`, `docs/03-architecture-layers.md`
- Blocker: C2 diagrams, portfolio registration, escalation matrix, observability requests
- Desired: Critical journey identification

**Key Metrics** (LASRE17-19):
- Source: `docs/08-scalability-and-performance.md`
- Blocker: Availability measurement, performance measurement, threshold configuration

**Backend Application** (LASRE20-22, 48-51):
- Source: `docs/09-operational-considerations.md` (Monitoring subsection)
- Blocker: Dynatrace instrumentation, API monitoring, exception handling
- Desired: Labels, external API validation, advanced monitoring, log ingestion

**Frontend Application** (LASRE23, 52):
- Source: `docs/09-operational-considerations.md` (Monitoring subsection)
- Blocker: Synthetic validation
- Desired: MFA-free testing

**User Experience** (LASRE24-26):
- Source: `docs/09-operational-considerations.md` (Monitoring subsection)
- Blocker: RUM injection, security compatibility, UX monitoring

**Cost Estimation** (LASRE27-28):
- Source: `docs/01-system-overview.md`
- Blocker: Dynatrace cost estimation, budget prerequisites

**Infrastructure** (LASRE29-31, 53-54):
- Source: `docs/components/README.md`
- Blocker: OneAgent installation, container monitoring, dependency monitoring
- Desired: Cloud tagging, process health detection

**Batch Processing** (LASRE32):
- Source: `docs/09-operational-considerations.md` (Monitoring subsection)
- Blocker: Non-Control-M batch monitoring

**Disaster Recovery** (LASRE34-35):
- Source: `docs/09-operational-considerations.md` (DR subsection)
- Blocker: DR automation, DR validation automation

**Application Operational Tasks** (LASRE36, 55-56):
- Source: `docs/09-operational-considerations.md` (Deployment subsection)
- Blocker: Service management automation
- Desired: Reporting, data sanitization

**Integration, Deployment and Delivery** (LASRE40-41):
- Source: `docs/09-operational-considerations.md` (Deployment subsection)
- Desired: Canary releases, traffic management

**Auto-remediation** (LASRE57):
- Source: `docs/09-operational-considerations.md` (Deployment subsection)
- Desired: Automated failure remediation

#### Extraction Logic (v2.0)

```python
def extract_sre_architecture_v2(docs_dir):
    """
    Extract 57 LASRE requirements from docs/ files
    Returns contract with compliance status for each requirement
    """

    # Initialize contract with 57 requirements
    contract = {
        "version": "2.0",
        "template": "SRE Architecture",
        "requirements": []
    }

    # Read docs/ files directly (no offset/limit needed)
    ops_content = Read(file_path=f"{docs_dir}/09-operational-considerations.md")
    perf_content = Read(file_path=f"{docs_dir}/08-scalability-and-performance.md")

    # LASRE01-03: Log Management from docs/09-operational-considerations.md
    logging_data = extract_subsection(ops_content, "Monitoring")
    contract["requirements"].extend([
        assess_requirement("LASRE01", "Structured logging", logging_data, "blocker"),
        assess_requirement("LASRE02", "Log levels", logging_data, "blocker"),
        assess_requirement("LASRE03", "Log accessibility", logging_data, "blocker"),
    ])

    # LASRE04: Deployment from docs/09-operational-considerations.md
    deployment_data = extract_subsection(ops_content, "Deployment")
    contract["requirements"].append(
        assess_requirement("LASRE04", "Rollback mechanisms", deployment_data, "blocker")
    )

    # LASRE07-11: Resilience from docs/08-scalability-and-performance.md
    resilience_data = extract_subsection(perf_content, "Resilience")
    contract["requirements"].extend([
        assess_requirement("LASRE07", "Readiness probes", resilience_data, "blocker"),
        assess_requirement("LASRE08", "Health checks", resilience_data, "blocker"),
        assess_requirement("LASRE09", "High availability", resilience_data, "blocker"),
        assess_requirement("LASRE10", "Load testing", resilience_data, "blocker"),
        assess_requirement("LASRE11", "Auto-scaling", resilience_data, "blocker"),
    ])
    
    # Calculate compliance scores
    blocker_reqs = [r for r in contract["requirements"] if r["criticality"] == "blocker"]
    desired_reqs = [r for r in contract["requirements"] if r["criticality"] == "desired"]
    
    blocker_pass = sum(1 for r in blocker_reqs if r["status"] in ["Compliant", "Not Applicable"])
    blocker_score = (blocker_pass / 36) * 10
    
    desired_pass = sum(1 for r in desired_reqs if r["status"] in ["Compliant", "Not Applicable"])
    desired_score = (desired_pass / 21) * 10
    
    final_score = (blocker_score * 0.7) + (desired_score * 0.3)
    
    # Apply blocking logic
    if blocker_pass < 36:
        final_score = min(final_score, 4.9)  # Cap at FAIL threshold
    
    contract["validation"] = {
        "blocker_score": blocker_score,
        "desired_score": desired_score,
        "final_score": final_score,
        "status": "PASS" if final_score >= 7.0 else "FAIL"
    }
    
    return contract

def assess_requirement(code, name, source_data, criticality):
    """Assess single LASRE requirement"""
    # Search for evidence in source data
    evidence = search_evidence(source_data, name)
    
    if evidence["found"]:
        status = "Compliant"
        explanation = f"{name} implemented and documented"
    elif evidence["partial"]:
        status = "Non-Compliant"
        explanation = f"{name} partially implemented"
    else:
        status = "Unknown"
        explanation = f"{name} not documented"
    
    return {
        "code": code,
        "name": name,
        "criticality": criticality,
        "status": status,
        "explanation": explanation,
        "source": evidence["source_reference"],
        "blocks_approval": criticality == "blocker" and status in ["Non-Compliant", "Unknown"]
    }
```

#### Contract Output Format (v2.0)

```markdown
## 1. Practice Requirements (LASRE01-LASRE16)

### 1.1 Log Management (LASRE01 - Blocker)
**Requirement**: Operational and audit logs must be recorded in a structured format...
**Status**: Compliant
**Responsible Role**: SRE Engineer
**Criticality**: **BLOCKER** (Blocking - Must Pass)

#### 1.1.1 Implementation
**Implementation Status**: JSON structured logging
- Status: Compliant
- Explanation: Implemented with consistent field schema
- Source: docs/09-operational-considerations.md
- Note: N/A

#### 1.1.2 Validation
**Validation Evidence**: Log parser validates JSON schema
- Status: Compliant
- Explanation: Automated validation in logging pipeline
- Source: docs/09-operational-considerations.md

**Source References**: docs/09-operational-considerations.md (Monitoring and Logging)

---

### 1.13 Log Centralization (LASRE37 - Desired)
**Requirement**: Generated logs must be centralized in an analysis or monitoring tool...
**Status**: Compliant
**Responsible Role**: SRE Engineer
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: Splunk centralized logging
- Status: Compliant
- Explanation: All logs aggregated to Splunk with 90-day retention
- Source: docs/09-operational-considerations.md
- Note: N/A

**Source References**: docs/09-operational-considerations.md

---
```

#### Placeholder Recommendations

**Common Placeholders in Generated Contracts**:

1. **Missing monitoring data in docs/09-operational-considerations.md**:
   - LASRE20-26, 29-32: Dynatrace instrumentation, monitoring coverage
   - Recommendation: Add observability tool configuration to docs/09-operational-considerations.md

2. **Missing incident management data in docs/09-operational-considerations.md**:
   - LASRE12, 15, 34-35: DRP, escalation matrix, DR automation
   - Recommendation: Document DR procedures and escalation paths in docs/09-operational-considerations.md

3. **Missing deployment data in docs/09-operational-considerations.md**:
   - LASRE04, 33, 36: Rollback, deployment consistency, service automation
   - Recommendation: Add CI/CD pipeline and deployment automation to docs/09-operational-considerations.md

4. **Missing resilience data in docs/08-scalability-and-performance.md**:
   - LASRE07-11: Readiness, health checks, HA, load testing, auto-scaling
   - Recommendation: Document resilience patterns and performance testing in docs/08-scalability-and-performance.md

5. **Missing architecture diagrams in docs/03-architecture-layers.md**:
   - LASRE13, 46-47: C2 diagrams, critical journeys
   - Recommendation: Add C2 diagrams and architecture documentation to docs/03-architecture-layers.md

---


### Contract 3: Cloud Architecture

#### Section Mapping Summary
**Primary**: Sections 4, 8, 11 (85%)
**Secondary**: Sections 9, 10 (15%)

**Key Extractions**:
- Section 4: Cloud provider, regions, deployment model (IaaS/PaaS/SaaS)
- Section 8: Cloud services used (RDS, S3, Lambda, etc.)
- Section 11: Cloud monitoring, backup strategies
- Section 9: Cloud security (IAM, encryption, network)
- Section 10: Performance considerations (latency, availability)

---

### Contract 4: Data & Analytics - AI Architecture

#### Section Mapping Summary (Version 2.0)
**Primary**: Sections 5, 6, 11 (65%)
**Secondary**: Sections 4, 7, 8, 9, 10, 12 (35%)

**11 Requirements: 8 LAD (Data) + 3 LAIA (AI)**:

**LAD1: Data Quality**
- Section 6 (Data Model): Quality control mechanisms, validation frameworks, accuracy metrics, data completeness
- Section 11 (Operational Considerations): Data quality monitoring, quality assurance processes

**LAD2: Data Fabric Reuse**
- Section 6 (Data Model): Data asset catalog, shared data services, reusability analysis
- Section 5 (Component Model): Reusable data components, data product architecture

**LAD3: Data Recovery**
- Section 11 (Operational Considerations): Backup strategy, disaster recovery, RTO/RPO for data
- Section 6 (Data Model): Data retention policies, recovery testing

**LAD4: Data Decoupling**
- Section 5 (Component Model): Storage decoupling, processing decoupling, API abstraction
- Section 4 (Meta Architecture): Microservices architecture, data architecture patterns
- Section 6 (Data Model): Decoupled data storage design

**LAD5: Data Scalability**
- Section 6 (Data Model): Partitioning strategy, horizontal/vertical scalability
- Section 10 (Non-Functional Requirements): Data volume growth projections, scalability requirements
- Section 8 (Technology Stack): Scalable data technologies

**LAD6: Data Integration**
- Section 7 (Integration View): Integration patterns, ETL/ELT pipelines, data sources/sinks
- Section 6 (Data Model): Data synchronization, integration testing
- Section 5 (Component Model): Data integration components

**LAD7: Regulatory Compliance**
- Section 6 (Data Model): GDPR compliance, data residency, retention policies
- Section 9 (Security Architecture): Data privacy, PII handling, compliance controls
- Section 11 (Operational Considerations): Compliance reporting, audit trails

**LAD8: Data Architecture Standards**
- Section 6 (Data Model): Naming conventions, data modeling standards, metadata standards
- Section 12 (ADRs): Data architecture decisions, standards justification
- Section 8 (Technology Stack): Technology standards for data platforms

**LAIA1: AI Model Governance**
- Section 5 (Component Model): ML models, model registry, AI services
- Section 11 (Operational Considerations): Model lifecycle, retraining schedules, deployment approvals
- Section 8 (Technology Stack): ML frameworks, model versioning tools

**LAIA2: AI Security and Reputation**
- Section 5 (Component Model): Model security architecture, adversarial attack prevention
- Section 9 (Security Architecture): AI security controls, bias detection, fairness metrics
- Section 11 (Operational Considerations): Model monitoring, reputation risk management

**LAIA3: AI Hallucination Control**
- Section 5 (Component Model): Hallucination detection mechanisms, grounding systems
- Section 11 (Operational Considerations): Fact verification, human oversight, confidence thresholds
- Section 6 (Data Model): Data quality for AI training, validation datasets

**Key Extractions**:
- Section 6: Data quality (LAD1), data catalog (LAD2), retention (LAD3), scalability (LAD5), compliance (LAD7), standards (LAD8), training data (LAIA3)
- Section 5: Data components (LAD2, LAD4), ML models (LAIA1), AI security (LAIA2), hallucination detection (LAIA3)
- Section 11: Backup/recovery (LAD3), monitoring (LAD1), model lifecycle (LAIA1), AI oversight (LAIA3)
- Section 7: ETL pipelines (LAD6), data sources/sinks (LAD6)
- Section 8: Data technologies (LAD5), ML frameworks (LAIA1), standards (LAD8)
- Section 9: Data privacy (LAD7), AI security (LAIA2)
- Section 10: Scalability requirements (LAD5)
- Section 4: Data architecture patterns (LAD4)
- Section 12: Architecture decisions (LAD8, LAIA1)

---

### Contract 5: Development Architecture

#### Document Purpose
Define development architecture standards including design patterns, technology stack validation, component design, and development best practices.

#### Required Content Sections
1. Design Patterns and Architectural Style
2. Component Architecture
3. Technology Stack Alignment (LADES1)
4. Development Best Practices (LADES2)
5. CI/CD and Deployment
6. Coding Standards and Quality
7. Architectural Decision Records

#### Section Mapping Summary
**Primary**: Sections 3, 5, 8, 12 (90%)
**Secondary**: Section 11 (10%)

**Key Extractions**:
- Section 3: Design patterns, architectural style, coding standards
- Section 5: Component design, interfaces, modularity
- Section 8: Technology stack (languages, frameworks, versions) + **Automatic Stack Validation**
- Section 12: Technology decision ADRs, trade-offs
- Section 11: CI/CD pipelines, deployment processes

**Special Feature**: This contract includes **automatic stack validation** against a 26-item checklist during document generation (Step 3.5 in Phase 3). Validation evaluates technology stack compliance and generates PASS/FAIL status with detailed evidence.

#### ARCHITECTURE.md Section Mapping

**Primary Source: Section 8 (Technology Stack) - 60%**

##### Automatic Stack Validation (Step 3.5)

**Extract**: Full technology stack inventory
**Transform to**: Contract Section LADES1.6 (Stack Validation Results)

**Validation Process** (LLM-Assisted):
1. Load Section 8 (Technology Stack) from cache
2. Load STACK_VALIDATION_CHECKLIST.md (26 items)
3. Detect stack type (Java, .NET, both, neither)
4. Detect frontend presence (React, Angular, Vue, none)
5. Evaluate each of 26 checklist items against Section 8 content
6. Collect evidence with source references (line numbers)
7. Determine overall status (PASS or FAIL)
8. Cache validation results for template population

**Pattern Example**:

```
ARCHITECTURE.md Input (Section 8, lines 949-1035):
"## Section 8: Technology Stack

### 8.1 Backend Stack
- **Language**: Java 17 (LTS)
- **Framework**: Spring Boot 3.2
- **Build Tool**: Maven 3.9
- **Testing**: JUnit 5, Mockito, Spring Test
- **Code Quality**: SonarQube
- **Dependencies**: (10 Spring libraries listed)

### 8.2 Containerization
- **Container Runtime**: Docker 24+
- **Orchestration**: Azure Kubernetes Service (AKS) 1.28+
- **Deployment**: Helm 3.13+

### 8.3 Infrastructure as Code
- **IaC Tool**: Helm Charts
- **CI/CD**: Azure DevOps Pipelines, GitHub Actions

### 8.4 Data Tier
- **Relational Database**: Azure SQL Database (PaaS)
- **Caching**: Azure Managed Redis

### 8.5 Observability
- **Monitoring**: Azure Monitor
- **Logging**: Azure Log Analytics
- **APM**: Application Insights"

Step 3.5 Validation Process:

1. Load STACK_VALIDATION_CHECKLIST.md:
   - Java Backend (6 items)
   - .NET Backend (6 items)
   - Frontend (6 items)
   - Other Stacks (5 items)
   - Exceptions (3 items)

2. Detect Stack Type (LLM Analysis):
   Prompt: "Analyze Section 8 (lines 949-1035). Detect:
   - Backend language(s): Java, .NET, or both?
   - Backend framework(s): Spring Boot, ASP.NET Core, or other?
   - Frontend framework: React, Angular, Vue, or none?"

   LLM Response:
   {
     "backend_type": "java",
     "backend_framework": "Spring Boot 3.2",
     "backend_version": "Java 17 LTS",
     "frontend_type": "none",
     "architecture_pattern": "backend-only"
   }

3. Evaluate 26 Checklist Items (LLM Analysis):

   Prompt: "Evaluate the following checklist items against Section 8:

   Java Backend (6 items):
   1. Is Java in a supported version? (Java 11, Java 17)
   2. Is Spring Boot in a supported version?
   3. Are official tools used? (Maven, Gradle, SonarQube, JUnit, OpenAPI/Swagger)
   4. Is deployment in authorized containers? (Docker, Kubernetes: AKS/EKS/GKE/OpenShift)
   5. Are only approved libraries used?
   6. Does naming follow standards?

   .NET Backend (6 items): [All N/A - no .NET detected]

   Frontend (6 items): [All N/A - no frontend detected]

   Other Stacks (5 items):
   1. Is automation (Python, Shell, RPA) aligned with stack?
   2. Is IaC (Terraform, Ansible, Azure DevOps Pipelines) approved?
   3. Are databases authorized? (PostgreSQL, SQL Server, Oracle, MongoDB)
   4. Do APIs comply? (OpenAPI 3.0, REST, gRPC)
   5. Is CI/CD authorized? (Azure DevOps, Jenkins, GitHub Actions)

   Exceptions (3 items):
   1. Are there stack deviations?
   2. Are exceptions documented?
   3. Is there an action plan?

   For each item, respond with:
   - Status: PASS, FAIL, N/A, or UNKNOWN
   - Evidence: Quote from Section 8 with line number
   - Reasoning: Brief explanation"

   LLM Response (Structured JSON):
   {
     "overall_status": "PASS",
     "validation_date": "2025-11-27",
     "validation_evaluator": "Claude Code (Automated)",
     "total_items": 26,
     "pass_count": 11,
     "fail_count": 0,
     "na_count": 12,
     "unknown_count": 3,
     "sections": {
       "java_backend": {
         "item_1": {
           "status": "PASS",
           "question": "Is Java in a supported version?",
           "evidence": "Java 17 (LTS) (docs/06-technology-stack.md)",
           "reasoning": "Java 17 is LTS and supported (Java 11, Java 17 approved)"
         },
         "item_2": {
           "status": "PASS",
           "question": "Is Spring Boot in a supported version?",
           "evidence": "Spring Boot 3.2 (docs/06-technology-stack.md)",
           "reasoning": "Spring Boot 3.2 is current and supported"
         },
         "item_3": {
           "status": "PASS",
           "question": "Are official tools used?",
           "evidence": "Maven 3.9, JUnit 5, Mockito, SonarQube (docs/06-technology-stack.md)",
           "reasoning": "All tools are in approved list (Maven, JUnit, SonarQube)"
         },
         "item_4": {
           "status": "PASS",
           "question": "Is deployment in authorized containers?",
           "evidence": "Docker 24+, AKS 1.28+, Helm 3.13+ (docs/06-technology-stack.md)",
           "reasoning": "Docker and AKS are in approved container catalog"
         },
         "item_5": {
           "status": "PASS",
           "question": "Are only approved libraries used?",
           "evidence": "10 Spring libraries documented (docs/06-technology-stack.md)",
           "reasoning": "All Spring libraries are in approved catalog"
         },
         "item_6": {
           "status": "UNKNOWN",
           "question": "Does naming follow standards?",
           "evidence": "Not documented in docs/06-technology-stack.md",
           "reasoning": "Repository naming conventions not explicitly specified"
         }
       },
       "dotnet_backend": {
         "item_1": {"status": "N/A", "reasoning": "No .NET detected"},
         "item_2": {"status": "N/A", "reasoning": "No .NET detected"},
         "item_3": {"status": "N/A", "reasoning": "No .NET detected"},
         "item_4": {"status": "N/A", "reasoning": "No .NET detected"},
         "item_5": {"status": "N/A", "reasoning": "No .NET detected"},
         "item_6": {"status": "N/A", "reasoning": "No .NET detected"}
       },
       "frontend": {
         "item_1": {"status": "N/A", "reasoning": "No frontend (backend-only)"},
         "item_2": {"status": "N/A", "reasoning": "No frontend (backend-only)"},
         "item_3": {"status": "N/A", "reasoning": "No frontend (backend-only)"},
         "item_4": {"status": "N/A", "reasoning": "No frontend (backend-only)"},
         "item_5": {"status": "N/A", "reasoning": "No frontend (backend-only)"},
         "item_6": {"status": "N/A", "reasoning": "No frontend (backend-only)"}
       },
       "other_stacks": {
         "item_1": {
           "status": "N/A",
           "question": "Is automation aligned with stack?",
           "evidence": "No Python/Shell/RPA documented",
           "reasoning": "Automation not applicable to this architecture"
         },
         "item_2": {
           "status": "PASS",
           "question": "Is IaC approved?",
           "evidence": "Helm 3.13+, Azure DevOps Pipelines (docs/06-technology-stack.md)",
           "reasoning": "Both Helm and Azure DevOps Pipelines are approved IaC tools"
         },
         "item_3": {
           "status": "PASS",
           "question": "Are databases authorized?",
           "evidence": "Azure SQL Database, Azure Managed Redis (docs/06-technology-stack.md)",
           "reasoning": "Both SQL Server (Azure SQL) and Redis are in authorized catalog"
         },
         "item_4": {
           "status": "UNKNOWN",
           "question": "Do APIs comply with OpenAPI 3.0?",
           "evidence": "Not explicitly documented in docs/06-technology-stack.md",
           "reasoning": "OpenAPI/Swagger not mentioned; inferred from Spring Boot but not confirmed"
         },
         "item_5": {
           "status": "PASS",
           "question": "Is CI/CD authorized?",
           "evidence": "Azure DevOps Pipelines, GitHub Actions (docs/06-technology-stack.md)",
           "reasoning": "Both CI/CD platforms are in approved catalog"
         }
       },
       "exceptions": {
         "item_1": {
           "status": "PASS",
           "question": "Are there stack deviations?",
           "evidence": "No deviations detected",
           "reasoning": "All technologies are in approved catalog"
         },
         "item_2": {
           "status": "N/A",
           "question": "Are exceptions documented?",
           "evidence": "No exceptions requiring documentation",
           "reasoning": "No deviations detected"
         },
         "item_3": {
           "status": "N/A",
           "question": "Is there an action plan?",
           "evidence": "No action plans needed",
           "reasoning": "No deviations detected"
         }
       }
     },
     "failures": [],
     "deviations": [],
     "unknowns": [
       {
         "item": "Java Backend Item 6",
         "question": "Does naming follow standards?",
         "recommendation": "Document repository and resource naming conventions in Section 8"
       },
       {
         "item": "Other Stacks Item 4",
         "question": "Do APIs comply with OpenAPI 3.0?",
         "recommendation": "Explicitly document OpenAPI/Swagger version in Section 8"
       }
     ]
   }

4. Cache Validation Results:
   contract_data_cache["validation_results"] = { ... (JSON above) ... }

Contract Output (LADES1.6 Validation Summary):

## LADES1.6: Technology Stack Validation

**Validation Status**: ✅ **PASS** (Compliant)
**Validation Date**: 2025-11-27
**Validation Evaluator**: Claude Code (Automated)

**Overall Results**:
- **Total Items**: 26
- **PASS**: 11 (42%)
- **FAIL**: 0 (0%)
- **N/A**: 12 (46%)
- **UNKNOWN**: 3 (12%)

**Validation Summary**:
- **Java Backend** (6 items): 5 PASS, 1 UNKNOWN (naming conventions)
  - ✅ Java 17 LTS (supported version)
  - ✅ Spring Boot 3.2 (supported version)
  - ✅ Official tools (Maven, SonarQube, JUnit)
  - ✅ Authorized containers (Docker 24+, AKS 1.28+)
  - ✅ Approved libraries (all 10 Spring libraries authorized)
  - ❓ Naming conventions (not explicitly documented in Section 8)

- **.NET Backend** (6 items): All N/A (no .NET in stack - Java backend only)

- **Frontend** (6 items): All N/A (no frontend - backend-only architecture)

- **Other Stacks** (5 items): 4 PASS, 1 UNKNOWN
  - ⚪ Automation (N/A - no Python/Shell/RPA documented)
  - ✅ IaC (Helm 3.13+, Azure DevOps Pipelines - both approved)
  - ✅ Databases (Azure SQL Database, Azure Managed Redis - both authorized)
  - ❓ OpenAPI 3.0 (not explicitly documented, inferred from Spring Boot)
  - ✅ CI/CD (Azure DevOps Pipelines, GitHub Actions - both authorized)

- **Exceptions** (3 items): 1 PASS, 2 N/A
  - ✅ No deviations detected
  - ⚪ No exceptions requiring documentation (N/A)
  - ⚪ No action plans needed (N/A)

**Stack Deviations**: None detected

**Recommendations**:
1. **Document Naming Conventions**: Add repository and resource naming conventions to docs/06-technology-stack.md (Java Backend Item 6)
2. **Document OpenAPI Version**: Explicitly specify OpenAPI/Swagger version in docs/06-technology-stack.md (Other Stacks Item 4)

**Source**: docs/06-technology-stack.md

**Legend**:
- ✅ PASS: Complies with authorized technology catalog
- ❌ FAIL: Non-compliant (deprecated version, unapproved technology, or missing documentation)
- ❓ UNKNOWN: Insufficient data in docs/06-technology-stack.md to validate
- ⚪ N/A: Not applicable to this architecture
```

**Primary Source: Section 3 (Architecture Patterns) - 15%**

##### Design Patterns
**Extract**: Architectural style, design patterns, modularity approach
**Transform to**: Contract Sections 1 (Design Patterns) & LADES2

**Primary Source: Section 5 (System Components) - 10%**

##### Component Design
**Extract**: Component structure, interfaces, modularity
**Transform to**: Contract Section 2 (Component Architecture)

**Primary Source: Section 12 (Architecture Decision Records) - 5%**

##### Technology Decisions
**Extract**: Technology choice ADRs, trade-offs
**Transform to**: Contract Section 7 (ADRs)

**Secondary Source: Section 11 (Operational Considerations) - 10%**

##### CI/CD and Deployment
**Extract**: CI/CD pipelines, deployment automation
**Transform to**: Contract Section 5 (CI/CD)

#### Extraction Logic (Pseudo-code)

```python
def extract_development_architecture(docs_dir):
    # Read docs/06-technology-stack.md directly
    tech_stack_content = Read(file_path=f"{docs_dir}/06-technology-stack.md")

    # Step 3.5: Automatic Stack Validation
    validation_results = perform_stack_validation(tech_stack_content)

    # Cache validation results
    contract_data_cache["validation_results"] = validation_results

    # Read docs/02-architecture-principles.md directly
    principles_content = Read(file_path=f"{docs_dir}/02-architecture-principles.md")

    # Extract design patterns (Direct)
    architectural_style = extract_value(principles_content, pattern="Architectural Style: (.+)")
    design_patterns = extract_list(principles_content, pattern="Pattern: (.+)")

    # Read docs/components/README.md directly
    components_content = Read(file_path=f"{docs_dir}/components/README.md")

    # Extract components (Aggregation)
    components = extract_components(components_content)

    # Read adr/README.md directly
    adr_content = Read(file_path="adr/README.md")

    # Extract technology ADRs (Filter)
    tech_adrs = filter_adrs(adr_content, category="technology")

    # Read docs/09-operational-considerations.md directly
    ops_content = Read(file_path=f"{docs_dir}/09-operational-considerations.md")

    # Extract CI/CD (Direct)
    cicd_tools = extract_value(ops_content, pattern="CI/CD: (.+)")

    return {
        "validation_results": validation_results,
        "architectural_style": architectural_style,
        "design_patterns": design_patterns,
        "components": components,
        "tech_adrs": tech_adrs,
        "cicd_tools": cicd_tools
    }

def perform_stack_validation(tech_stack_section):
    """LLM-assisted stack validation against 26-item checklist"""

    # Load validation checklist
    checklist = load_file("STACK_VALIDATION_CHECKLIST.md")

    # Detect stack type (LLM prompt)
    stack_detection_prompt = f"""
    Analyze the following technology stack section and detect:
    - Backend language(s): Java, .NET, or both?
    - Backend framework(s): Spring Boot, ASP.NET Core, or other?
    - Frontend framework: React, Angular, Vue, or none?

    Technology Stack:
    {tech_stack_section}

    Respond in JSON format.
    """

    stack_type = llm_call(stack_detection_prompt)

    # Evaluate checklist items (LLM prompt)
    validation_prompt = f"""
    Evaluate the following {checklist.total_items} checklist items against the technology stack.

    For each item, determine:
    - Status: PASS, FAIL, N/A, or UNKNOWN
    - Evidence: Quote from technology stack with line number
    - Reasoning: Brief explanation

    Checklist:
    {checklist.items}

    Technology Stack:
    {tech_stack_section}

    Respond in structured JSON format.
    """

    validation_results = llm_call(validation_prompt)

    # Calculate overall status
    validation_results["overall_status"] = (
        "PASS" if validation_results["fail_count"] == 0 and validation_results["unknown_count"] <= 3
        else "FAIL"
    )

    return validation_results
```

#### Missing Data Handling

```
Scenario 1: docs/06-technology-stack.md missing or empty
Action: [PLACEHOLDER: docs/06-technology-stack.md not found or empty.
        Cannot perform automatic stack validation.
        Add technology stack details to docs/06-technology-stack.md]

Scenario 2: Partial Section 8 (incomplete data)
Action: Perform validation with available data
        Flag items as UNKNOWN where data is missing
        Provide recommendations in validation summary

Scenario 3: Deprecated technology versions detected
Action: Mark items as FAIL
        Include detailed failure report with recommended versions
        Block approval until resolved

Scenario 4: Unapproved technology detected
Action: Mark items as FAIL
        Flag as stack deviation requiring exception
        Include exception documentation guidance
```

---

### Contract 6: Process Transformation and Automation

#### Section Mapping Summary (Version 2.0)
**Primary**: Sections 3, 10, 11 (70%)
**Secondary**: Sections 5, 6, 7, 8, 12 (30%)

**4 LAA Requirements**:

**LAA1: Feasibility and Impact Analysis**
- Section 3 (Business Context): Manual effort (FTE hours/week), process complexity, ROI justification, use cases, workflow changes
- Section 5 (Component Model): Automation components, integration touchpoints
- Section 6 (Data Model): Data sources, quality requirements, transformation logic, sensitivity classification
- Section 7 (Integration View): Integration points, data flows, API dependencies
- Section 11 (Operational Considerations): ROI analysis, training requirements, change management

**LAA2: Automation Factors**
- Section 10 (Non-Functional Requirements): Execution schedule (real-time/batch/event-driven), time-critical requirements, scalability, peak load
- Section 11 (Operational Considerations): Run frequency, monitoring metrics, error handling/alerting, support model, maintenance windows, cost analysis
- Section 8 (Technology Stack): Automation platforms, license costs
- Section 4 (Meta Architecture): Infrastructure costs

**LAA3: Efficient License Usage**
- Section 8 (Technology Stack): License consumption model, automation platform licenses, license quantity
- Section 7 (Integration View): Third-party integration licenses, connector licensing
- Section 6 (Data Model): Database access licensing
- Section 11 (Operational Considerations): License pooling strategy, compliance monitoring
- Section 12 (ADRs): License cost optimization strategies

**LAA4: Document Management Alignment**
- Section 6 (Data Model): Document lifecycle scope, version control, archival/retention policies, storage licensing
- Section 8 (Technology Stack): DMS licensing (SharePoint, Documentum)
- Section 7 (Integration View): DMS integration points
- Section 9 (Security Architecture): DMS authentication, document security classification
- Section 11 (Operational Considerations): Document retention policies

**Key Extractions**:
- Section 3: Manual effort quantification (LAA1.1), ROI justification (LAA1.1), workflow changes (LAA1.3)
- Section 5: Integration points (LAA1.2), automation components (LAA1.4)
- Section 6: Data sources (LAA1.4), data quality (LAA1.4), document lifecycle (LAA4.1)
- Section 7: API dependencies (LAA1.2), third-party licenses (LAA3.2), DMS integration (LAA4.3)
- Section 8: License model (LAA3.1), DMS licensing (LAA4.2), automation platform licenses (LAA2.3)
- Section 10: Execution timing (LAA2.1), peak load (LAA2.2)
- Section 11: Run frequency (LAA2.2), monitoring (LAA2.4), support model (LAA2.4), cost analysis (LAA2.3)

---

### Contract 7: Security Architecture (Version 2.0)

#### Section Mapping Summary
**Primary**: Sections 4, 5, 7, 9, 11 (95%)
**Secondary**: None (5%)

**Template Version**: 2.0
**Requirement Count**: 8 LAS requirements
**Validation Items**: 24 items

#### LAS Requirement Mappings

**LAS1: API Exposure**
- Section 5 (Component Model): API Gateway implementation, gateway configuration, API catalog
- Section 9 (Security Architecture): API authentication (OAuth 2.0, OIDC, JWT), authorization (RBAC, ABAC), rate limiting, API security policies
- Section 7 (Integration View): External API exposure patterns, API versioning

**LAS2: Intra-Microservices Communication**
- Section 5 (Component Model): Service mesh implementation (Istio, Linkerd, Consul Connect), service catalog, service dependencies
- Section 9 (Security Architecture): mTLS configuration, service-to-service authentication, service identity, authorization policies
- Section 4 (Architecture Diagrams): Microservices topology, communication patterns

**LAS3: Inter-Cluster Kubernetes Communication**
- Section 4 (Architecture Diagrams): Multi-cluster architecture, cluster topology, cross-cluster networking
- Section 9 (Security Architecture): Inter-cluster security (VPN/TLS), network policies, cluster federation security
- Section 11 (Operational Considerations): Multi-cluster management, cluster failover

**LAS4: Domain API Communication**
- Section 7 (Integration View): Domain API design, bounded contexts, domain events, API contracts
- Section 9 (Security Architecture): Domain API authentication, authorization, API security boundaries
- Section 5 (Component Model): Domain services, API components

**LAS5: Third-Party API Consumption**
- Section 7 (Integration View): Third-party API inventory, vendor list, API dependencies, integration patterns
- Section 9 (Security Architecture): API credential storage (Azure Key Vault, HashiCorp Vault), credential rotation, API key management
- Section 11 (Operational Considerations): Vendor risk assessment, SLA monitoring, vendor security reviews

**LAS6: Data Lake Communication**
- Section 7 (Integration View): Data lake integration points, data ingestion patterns, data lake connectivity
- Section 9 (Security Architecture): Data lake access security (RBAC, Azure AD, IAM), encryption (TLS 1.2+, at-rest), data governance, data classification
- Section 5 (Component Model): Data lake components, data pipeline architecture

**LAS7: Internal Application Authentication**
- Section 9 (Security Architecture): Authentication strategy (SSO, Azure AD, Okta, SAML 2.0, OIDC), MFA enforcement, session management (timeout, revocation)
- Section 5 (Component Model): Identity provider integration, authentication flows
- Section 11 (Operational Considerations): User provisioning, identity lifecycle

**LAS8: HTTP Encryption Scheme**
- Section 9 (Security Architecture): TLS configuration (1.2/1.3 enforcement), HTTP security headers (HSTS, CSP, X-Frame-Options), cipher suites
- Section 11 (Operational Considerations): Certificate management automation, certificate renewal, certificate authority
- Section 5 (Component Model): Load balancer TLS termination, CDN TLS configuration

**Key Extractions**:
- Section 4: Multi-cluster topology (LAS3), deployment architecture
- Section 5: API Gateway (LAS1), service mesh (LAS2), service catalog, identity provider, data lake components (LAS6)
- Section 7: Domain APIs (LAS4), third-party API inventory (LAS5), data lake integration (LAS6)
- Section 9: All 8 LAS security requirements - authentication, encryption, mTLS, authorization, credential management, TLS configuration, security headers
- Section 11: Certificate management (LAS8), vendor risk (LAS5), multi-cluster operations (LAS3)

---

## Section 9 Reference Standard (All Contracts)

### Purpose
Establishes standardized format for referencing Section 9 (Security Architecture) content across all compliance documents to prevent ambiguous or incorrect subsection references.

### The Problem
ARCHITECTURE.md files often use unnumbered subsections under Section 9 (e.g., "Authentication & Authorization", "Network Security") rather than numbered subsections (9.1, 9.2, 9.3). Generic "Section 9" references lack context and may be incorrectly interpreted as numbered subsections.

### Standard Reference Format

**Required Format:**
```
Section 9 (Security Architecture → [Subsection Path])
```

**Examples:**
- `Section 9 (Security Architecture → Authentication & Authorization), lines 1079-1101`
- `Section 9 (Security Architecture → Network Security), lines 1104-1159`
- `Section 9 (Security Architecture → Data Security → Encryption in Transit), lines 1168-1172`
- `Section 9 (Security Architecture → Compliance), lines 1237-1256`

**When to Use:**
- Any compliance template referencing Section 9 content
- All LAC3 (Security and Regulatory Compliance) data points
- Security-related extractions across all 11 contract types

### Common Section 9 Subsection Paths

Based on standard ARCHITECTURE.md templates, Section 9 typically contains:

1. **Security Principles** (lines ~1038-1045)
   - Reference: `Section 9 (Security Architecture → Security Principles)`

2. **Threat Model** (lines ~1047-1073)
   - Reference: `Section 9 (Security Architecture → Threat Model)`

3. **Security Controls** (umbrella section, lines ~1075-1232)
   - **Authentication & Authorization** (lines ~1077-1101)
     - Reference: `Section 9 (Security Architecture → Authentication & Authorization)`
   - **Network Security** (lines ~1102-1159)
     - Reference: `Section 9 (Security Architecture → Network Security)`
   - **Data Security** (lines ~1161-1232)
     - Reference: `Section 9 (Security Architecture → Data Security)`
     - Subsections: Encryption at Rest, Encryption in Transit, PII Handling, Backup Encryption
   - **Application Security** (lines ~1183-1207)
     - Reference: `Section 9 (Security Architecture → Application Security)`
   - **Secrets Management** (lines ~1208-1232)
     - Reference: `Section 9 (Security Architecture → Secrets Management)`

4. **Compliance** (lines ~1235-1256)
   - Reference: `Section 9 (Security Architecture → Compliance)`

5. **Security Monitoring** (lines ~1259-1281)
   - Reference: `Section 9 (Security Architecture → Security Monitoring)`

### Dynamic Security Architecture Subsection Discovery (File-Based)

To dynamically find security subsections in `docs/07-security-architecture.md`:

#### Step 1: Read Security Architecture File Directly

```python
# Read docs/07-security-architecture.md in full (no offset needed)
security_content = Read(file_path="docs/07-security-architecture.md")
```

#### Step 2: Detect All Subsections Within the File

```python
import re

# Find all level-3 headers (###) in the file
subsection_pattern = r'^###\s+(.+)$'
subsections = []

for match in re.finditer(subsection_pattern, security_content, re.MULTILINE):
    subsection_name = match.group(1).strip()
    subsections.append({
        "name": subsection_name
    })

# Example result:
# [
#   {"name": "Security Principles"},
#   {"name": "Threat Model"},
#   {"name": "Authentication & Authorization"},
#   {"name": "Network Security"},
#   ...
# ]
```

#### Step 3: Generate Security Architecture References Dynamically

```python
def generate_security_reference(subsection_name):
    """Generate standardized security reference with file path"""
    return f"docs/07-security-architecture.md (→ {subsection_name})"

# Usage examples:
auth_ref = generate_security_reference("Authentication & Authorization")
# Returns: "docs/07-security-architecture.md (→ Authentication & Authorization)"

network_ref = generate_security_reference("Network Security")
# Returns: "docs/07-security-architecture.md (→ Network Security)"
```

#### Step 4: Nested Subsection Support

For nested subsections (e.g., "Data Security → Encryption in Transit"):

```python
def generate_nested_security_reference(parent_name, nested_name):
    """Generate nested security reference"""
    return f"docs/07-security-architecture.md (→ {parent_name} → {nested_name})"

# Example:
encryption_ref = generate_nested_security_reference("Data Security", "Encryption in Transit")
# Returns: "docs/07-security-architecture.md (→ Data Security → Encryption in Transit)"
```

#### Complete Workflow Example

```python
def extract_security_subsections(docs_dir):
    """Complete workflow: Extract all security subsections from docs/ file"""

    # Step 1: Read docs/07-security-architecture.md directly
    security_content = Read(file_path=f"{docs_dir}/07-security-architecture.md")

    # Step 2: Extract all subsections
    subsections = []
    for match in re.finditer(r'^###\s+(.+)$', security_content, re.MULTILINE):
        name = match.group(1).strip()
        subsections.append({"name": name})

    # Step 3: Return structured data
    return {
        "source_file": "docs/07-security-architecture.md",
        "subsections": subsections
    }

# Usage:
security_data = extract_security_subsections("docs")

# Generate references dynamically:
for subsection in security_data["subsections"]:
    ref = generate_security_reference(subsection["name"])
    print(ref)
```

**Benefits of Direct File Reading:**
- **Simplicity**: No Document Index or line-offset calculations needed
- **Accuracy**: Read the full file — no missed content from offset limits
- **No Hardcoding**: No section line numbers to maintain
- **Full Traceability**: Every reference includes file path and subsection name

### Validation Checklist

When reviewing generated compliance documents, verify:

- [ ] No references to "Section 9.1", "Section 9.2", "Section 9.3", "Section 9.4" (numbered subsections)
- [ ] All security references point to `docs/07-security-architecture.md`
- [ ] Subsection references include path within file (e.g., `→ Authentication & Authorization`)
- [ ] Subsection path matches the actual content being referenced

### Template Compliance

All templates with Section 9 references must use this standard:

| Template | Section 9 Usage | Compliance Status |
|----------|----------------|-------------------|
| TEMPLATE_CLOUD_ARCHITECTURE.md | 5 references (LAC3) | ✅ Updated (2025-11-27) |
| TEMPLATE_SECURITY_ARCHITECTURE.md | 8 references (primary) | ⚠️ Needs review |
| TEMPLATE_DATA_AI_ARCHITECTURE.md | 2 references | ⚠️ Needs review |
| TEMPLATE_INTEGRATION_ARCHITECTURE.md | 2 references | ⚠️ Needs review |

**Action Required**: Review and update templates marked ⚠️ to ensure compliance with this standard.

---

### Contract 8: Platform & IT Infrastructure

#### Section Mapping Summary (Version 1.0)
**Primary**: Sections 4, 8, 11 (85%)
**Secondary**: Sections 7, 10 (15%)

**9 LAPI Requirements**:

**LAPI01: Unique Production Environments**
- Section 4 (Meta Architecture): Deployment environments, network isolation, environment topology
- Section 11 (Operational Considerations): Environment access controls, configuration management

**LAPI02: Server Operating Systems**
- Section 8 (Technology Stack): Operating system selection, versions, patch management
- Section 11 (Operational Considerations): Security hardening, OS maintenance

**LAPI03: Database Storage Capacity**
- Section 8 (Technology Stack): Database platforms, storage sizing
- Section 10 (Non-Functional Requirements): Data volume projections, growth rates
- Section 11 (Operational Considerations): Retention policies, archival strategy

**LAPI04: Database Version Authorization**
- Section 8 (Technology Stack): Database platform selection, version specifications, compatibility

**LAPI05: Database Backup and Retention**
- Section 11 (Operational Considerations): Backup frequency, retention periods, recovery testing, RTO/RPO alignment

**LAPI06: Infrastructure Capacity**
- Section 4 (Meta Architecture): Infrastructure topology, resource allocation
- Section 8 (Technology Stack): Compute resources, memory, network
- Section 10 (Non-Functional Requirements): Scalability requirements, peak load
- Section 11 (Operational Considerations): Capacity planning, scaling strategy

**LAPI07: Naming Conventions**
- Section 8 (Technology Stack): Resource naming standards
- Section 11 (Operational Considerations): Environment prefixes, component identification patterns

**LAPI08: Transaction Volume Dimensioning**
- Section 10 (Non-Functional Requirements): TPS capacity, concurrent users, throughput limits, performance benchmarks

**LAPI09: Legacy Platform Transaction Capacity**
- Section 7 (Integration View): Legacy system integrations, transaction limits
- Section 10 (Non-Functional Requirements): Integration capacity constraints, throttling requirements

**Key Extractions**:
- Section 4: Environments (dev/staging/prod), isolation topology (LAPI01), infrastructure layout (LAPI06)
- Section 8: Operating systems (LAPI02), databases (LAPI03, LAPI04), infrastructure tools (LAPI06), naming conventions (LAPI07)
- Section 11: Backup/recovery (LAPI05), capacity planning (LAPI06), operations (LAPI01, LAPI02), retention policies (LAPI03)
- Section 10: Performance requirements (LAPI06, LAPI08), capacity limits (LAPI03, LAPI09)
- Section 7: Legacy integrations (LAPI09)

---

### Contract 9: Enterprise Architecture

#### Section Mapping Summary
**Primary**: Sections 1, 2, 3, 4 (85%)
**Secondary**: Section 12 (15%)

**Key Extractions**:
- Section 1: System purpose, strategic alignment
- Section 2: Business drivers, stakeholder needs
- Section 3: Architectural approach (modularity, patterns)
- Section 4: Deployment strategy (cloud-first)
- Section 12: Strategic decision ADRs

---

### Contract 10: Integration Architecture (Version 2.0)

#### Section Mapping Summary
**Primary**: Sections 5, 6, 7, 9 (90%)
**Secondary**: None (10%)

**Template Version**: 2.0
**Requirement Count**: 7 LAI requirements
**Validation Items**: 25 items

#### LAI Requirement Mappings

**LAI1: Best Practices Adoption**
- Section 7 (Integration View): Domain API accessibility, API catalog, REST API design standards, API versioning strategy, error handling standards, API documentation (OpenAPI/Swagger)
- Section 5 (Component Model): Microservice architecture, API components, domain services
- Requirement: All domain microservices accessible via domain APIs with complete catalog

**LAI2: Secure Integrations**
- Section 9 (Security Architecture): API authentication (OAuth 2.0, JWT, mTLS), API authorization (RBAC, ABAC), TLS 1.2+ encryption, secrets management (vault storage), integration security logging
- Section 7 (Integration View): Integration authentication patterns, security protocols
- Requirement: Secure authentication and TLS 1.2+ for all integrations

**LAI3: No Obsolete Integration Technologies**
- Section 7 (Integration View): REST protocol version (HTTP/1.1, HTTP/2), SOAP version check, message broker technology, event streaming platform, ESB/integration platform currency
- Section 5 (Component Model): Message brokers (Kafka, RabbitMQ), integration middleware
- Requirement: No deprecated technologies (SOAP 1.0, WebSphere MQ, legacy ESB)

**LAI4: Integration Governance Standards**
- Section 7 (Integration View): API naming conventions, endpoint standardization, API lifecycle governance, API change control, governance playbook reference, API review process
- Requirement: All APIs follow integration governance playbook

**LAI5: Third-Party Documentation**
- Section 7 (Integration View): Third-party API catalog, external service dependencies, API specification availability (OpenAPI), integration guides, third-party SLAs, support contact information
- Requirement: All third-party APIs provide documentation, SLAs, and support contacts

**LAI6: Traceability and Audit**
- Section 7 (Integration View): Distributed tracing implementation (OpenTelemetry, Jaeger, Zipkin), trace context propagation (W3C Trace Context), structured logging format (JSON), log correlation IDs, centralized logging platform, trace-log integration
- Section 5 (Component Model): Observability infrastructure, tracing systems, logging platforms
- Requirement: Distributed tracing and structured logging with correlation IDs

**LAI7: Event-Driven Integration Compliance**
- Section 6 (Data Model): Event schema definition (JSON Schema, Avro), CloudEvents compliance, event versioning strategy, schema registry implementation, event catalog, consumer contracts, event delivery semantics, Dead Letter Queue (DLQ) handling
- Section 7 (Integration View): Event-driven patterns, event catalog, messaging guarantees
- Section 5 (Component Model): Schema registry, event bus, message brokers
- Requirement: CloudEvents specification with schema registry for async event decoupling integrations

**Key Extractions**:
- Section 5: API Gateway (LAI1), message brokers (LAI3, LAI7), schema registry (LAI7), observability infrastructure (LAI6)
- Section 6: Event schemas (LAI7), CloudEvents format, event catalog, DLQ configuration
- Section 7: Domain APIs (LAI1), API catalog, REST/SOAP protocols (LAI3), governance standards (LAI4), third-party APIs (LAI5), distributed tracing (LAI6), event patterns (LAI7)
- Section 9: API authentication/authorization (LAI2), TLS encryption, secrets management, security logging

**Detailed Example**:
```
ARCHITECTURE.md Input (Section 7.1, lines 1005-1014):
"### Integration 1: Corporate User Directory
System: Active Directory
Purpose: User authentication and authorization
Pattern: REST API + LDAP
Direction: Bi-directional
Protocols: HTTPS (REST), LDAPS
Authentication: OAuth 2.0 (REST), Service Account (LDAP)
SLA: 99.9% availability, < 200ms response time
Data Exchange: User profiles, roles, group memberships"

Contract Output:
## Integration Catalog

### INT-EXT-001: Corporate User Directory

| Attribute | Value |
|-----------|-------|
| System Name | Active Directory |
| Purpose | User authentication and authorization |
| Integration Pattern | REST API + LDAP |
| Direction | Bi-directional |
| Protocols | HTTPS (REST), LDAPS |
| Authentication | OAuth 2.0 (REST), Service Account (LDAP) |
| SLA | 99.9% availability, < 200ms |
| Data Exchanged | User profiles, roles, group memberships |
| Security | OAuth 2.0 tokens, TLS 1.3 |
| Source | Section 7.1, lines 1005-1014 |

**Data Flow**:
```
[Application] --HTTPS/OAuth--> [Active Directory] : Auth Request
[Active Directory] --HTTPS--> [Application] : User Profile + Roles
```

**Best Practices Compliance**:
- ✓ Uses standard protocol (REST + LDAP)
- ✓ Secure authentication (OAuth 2.0)
- ✓ Encrypted transport (TLS 1.3)
- ✓ SLA defined
- ✓ Bi-directional traceability
```

---

## Cross-Contract Data Reuse

### Common Data Points

Many data points appear in multiple contracts. Extract once, cache, and reuse:

**1. Availability SLA (appears in 5 contracts)**
```
Source: docs/08-scalability-and-performance.md
Used in:
- Business Continuity (RTO/RPO justification)
- SRE Architecture (SLO, error budget)
- Cloud Architecture (cloud SLA requirements)
- Platform & IT Infrastructure (infrastructure availability)
- Enterprise Architecture (business criticality)

Extract once: "99.99% SLA"
Cache with source: "docs/08-scalability-and-performance.md"
Reuse in all 5 contracts with appropriate transformations
```

**2. Technology Stack (appears in 5 contracts)**
```
Source: docs/06-technology-stack.md
Used in:
- Development Architecture (technology choices)
- Cloud Architecture (cloud services)
- Platform & IT Infrastructure (infrastructure tech)
- Integration Architecture (integration tech)
- Security Architecture (security tools)

Extract once: Full technology inventory
Cache as structured data
Apply different filters per contract
```

**3. Integration Catalog (appears in 3 contracts)**
```
Source: docs/05-integration-points.md
Used in:
- Integration Architecture (full catalog)
- Security Architecture (integration security)
- Data & Analytics - AI Architecture (data sources/sinks)

Extract once: All integrations with details
Cache as structured list
Filter by contract focus
```

### Caching Strategy (File-Based)

```python
# Global cache for cross-contract data with full traceability
contract_data_cache = {}

def extract_with_caching(docs_dir, file_name, pattern, cache_key):
    """Extract data with file-based caching for reuse across contracts"""

    # Check cache first
    if cache_key in contract_data_cache:
        return contract_data_cache[cache_key]

    # Check if file already cached
    file_cache_key = f"file:{file_name}"
    if file_cache_key not in contract_data_cache:
        # Read the docs/ file in full (no offset/limit needed)
        file_content = Read(file_path=f"{docs_dir}/{file_name}")
        contract_data_cache[file_cache_key] = file_content

    file_content = contract_data_cache[file_cache_key]

    # Extract value from file content
    match = re.search(pattern, file_content)
    if not match:
        return None

    # Cache with metadata including file-based traceability
    contract_data_cache[cache_key] = {
        "value": match.group(1),
        "source": {
            "file": f"docs/{file_name}"
        },
        "extraction_method": "direct_file_read",
        "extracted_at": current_timestamp(),
        "raw_source_string": f"docs/{file_name}"
    }

    return contract_data_cache[cache_key]

# Usage across contracts with file-based extraction
sla_data = extract_with_caching(
    docs_dir="docs",
    file_name="08-scalability-and-performance.md",
    pattern=r"SLA:?\s*([0-9.]+%)",
    cache_key="availability_sla"
)

# Reuse in Contract 1 (Business Continuity)
continuidad_contract["sla"] = sla_data["value"]

# Reuse in Contract 2 (SRE Architecture) with transformation
sre_contract["error_budget"] = calculate_error_budget(sla_data["value"])
```

---

## Handling Missing Data

### Common Missing Data Scenarios

**Scenario 1: File Exists but Incomplete**
```
docs/09-operational-considerations.md has backup section but missing RTO/RPO

Action:
1. Extract available data (backup frequency, retention)
2. Flag missing: [PLACEHOLDER: RTO/RPO not specified]
3. Provide guidance based on SLA
4. Include in completion report

Example:
RTO: [PLACEHOLDER: Define based on 99.99% SLA. Recommended: 4 hours for Tier 1]
```

**Scenario 2: Entire File Missing**
```
docs/09-operational-considerations.md missing incident management section

Action:
1. Flag entire contract section as placeholder
2. Provide template structure
3. Reference industry standards
4. Include in completion report with high priority

Example:
## Incident Management
[PLACEHOLDER: Incident Management not found in docs/09-operational-considerations.md.

Add the following to docs/09-operational-considerations.md:
- Incident classification (P1, P2, P3)
- Response time SLAs
- Escalation procedures
- On-call rotation
- Postmortem requirements

Reference: ITIL Incident Management framework]
```

**Scenario 3: Data Format Doesn't Match Pattern**
```
Expected: "RTO: 4 hours"
Found: "Recovery time is generally within half a business day"

Action (Strict Source Traceability):
1. DO NOT attempt interpretation or inference
2. Flag as [PLACEHOLDER] - data format too ambiguous
3. Request explicit value in completion report

Example:
RTO: [PLACEHOLDER: Not specified in docs/09-operational-considerations.md]
Optional Reference: Industry standard for Tier 1 applications: 4 hours RTO (NIST SP 800-34)
Note: Update docs/09-operational-considerations.md with explicit RTO value (e.g., "RTO: 4 hours").
Current text "generally within half a business day" is too ambiguous for compliance documentation.
Source: docs/09-operational-considerations.md (ambiguous format)
```

---

## Validation Checklist

After extracting data for each contract:

**Data Quality**:
- [ ] All extracted values have source references
- [ ] Calculations are correct (error budgets, conversions)
- [ ] Inferences are reasonable and documented
- [ ] Aggregated data is complete (no missing items)

**Completeness**:
- [ ] All required contract sections have data
- [ ] Placeholders include guidance
- [ ] Missing data tracked in completion report
- [ ] Recommendations provided for gaps

**Traceability**:
- [ ] Every value includes source file path (docs/NN-name.md)
- [ ] Transformation logic is documented
- [ ] Inference rationale is explained
- [ ] Cache hits are properly attributed

**Consistency**:
- [ ] Same data point identical across contracts
- [ ] Transformations are consistent (e.g., all error budgets calculated same way)
- [ ] Terminology is consistent
- [ ] Formatting is uniform

---

## Multi-File Mapping Validation Checklist

This checklist ensures full compliance with the navigation index-based file loading methodology documented in this guide. Use this before generating any compliance documents.

### Navigation Index Validation

**ARCHITECTURE.md as Navigation Index**:
- [ ] ARCHITECTURE.md exists and is readable (~130 lines)
- [ ] ARCHITECTURE.md contains project name in first H1 header
- [ ] ARCHITECTURE.md contains links/references to docs/ files
- [ ] docs/ directory exists alongside ARCHITECTURE.md
- [ ] adr/ directory exists (for ADR content)

**docs/ File Availability**:
- [ ] `docs/01-system-overview.md` exists
- [ ] `docs/02-architecture-principles.md` exists
- [ ] `docs/03-architecture-layers.md` exists
- [ ] `docs/components/README.md` exists
- [ ] `docs/04-data-flow-patterns.md` exists
- [ ] `docs/05-integration-points.md` exists
- [ ] `docs/06-technology-stack.md` exists
- [ ] `docs/07-security-architecture.md` exists
- [ ] `docs/08-scalability-and-performance.md` exists
- [ ] `docs/09-operational-considerations.md` exists
- [ ] `adr/README.md` exists (for architecture decision records)
- [ ] `docs/10-references.md` exists (if references section is needed)

### File Loading Validation

**Two-Step Loading Workflow**:
- [ ] Step 1: Read ARCHITECTURE.md (full file, ~130 lines) to extract project name
- [ ] Step 2: Read each required docs/ file directly (no offset needed)
- [ ] No line-offset calculations performed
- [ ] No Document Index parsing required

**File Read Format**:
- [ ] Each docs/ file read in full: `Read(file_path="docs/NN-name.md")`
- [ ] ARCHITECTURE.md read in full: `Read(file_path="ARCHITECTURE.md")`
- [ ] No partial reads (no `offset=X, limit=Y`) for docs/ files

### Source Reference Format Validation

**Source Reference Format**:
- [ ] All sources follow format: `"docs/NN-name.md"` (file path)
- [ ] No `"Section N.M, line X"` format references
- [ ] No `"Section N (Name), lines X-Y"` format references
- [ ] Source references use file paths not section numbers

**Correct Format Examples**:
- [ ] RTO/RPO data: `docs/09-operational-considerations.md`
- [ ] SLO/latency data: `docs/08-scalability-and-performance.md`
- [ ] Security controls: `docs/07-security-architecture.md`
- [ ] Integration patterns: `docs/05-integration-points.md`
- [ ] Technology stack: `docs/06-technology-stack.md`
- [ ] Data flow patterns: `docs/04-data-flow-patterns.md`
- [ ] Component details: `docs/components/README.md`
- [ ] ADR decisions: `adr/README.md`
- [ ] Business context: `docs/01-system-overview.md`

### Context Efficiency Validation

**Token Usage Optimization**:
- [ ] ARCHITECTURE.md read once per generation run to get project name
- [ ] Only required docs/ files are read (not all files for every contract)
- [ ] Each agent reads only the docs/ files relevant to its contract type
- [ ] Efficiency target: Read 3-5 files per contract (not all 12)

**Loading Strategy**:
- [ ] Level 1: ARCHITECTURE.md (always first — get project name)
- [ ] Level 2: Primary docs/ files for the contract type
- [ ] Level 3: Secondary docs/ files (if additional context needed)
- [ ] Apply Grep patterns against specific docs/ files for targeted extraction

### Cross-Contract Consistency Validation

**Shared Data Points**:
- [ ] Availability SLA: Same value in all 6 contracts (Business Continuity v2.0, SRE, Cloud, Platform, Enterprise, Risk)
  - Business Continuity v2.0: Referenced in LACN006 (HA Requirement), extracted from `docs/08-scalability-and-performance.md`
  - SRE Architecture: Used for SLO and error budget calculation
  - Cloud Architecture: Cloud SLA requirements
  - All contracts must show identical value and source file
- [ ] Technology Stack: Same inventory in 5 contracts (Development, Cloud, Platform, Integration, Security)
- [ ] Integration Catalog: Same list in 3 contracts (Integration, Security, Data/AI)

**Transformation Consistency**:
- [ ] Error budget calculation: Same formula in SRE and Business Continuity v2.0
  - Formula: Error Budget = (1 - SLA%) × Time Period
  - Example: 99.95% SLA → 0.05% × 30 days × 24 hours = 21.6 minutes/month
  - Business Continuity: Validates RTO aligns with error budget
  - SRE Architecture: Uses for operational targets and alerting thresholds
- [ ] Downtime calculation: Same formula across all contracts
- [ ] Criticality inference: Same rules (99.99% → Tier 1)
- [ ] All transformations documented and replicable

### Security Architecture Special Handling

**Dynamic Discovery**:
- [ ] Security subsections discovered via Grep in `docs/07-security-architecture.md`
- [ ] Nested subsections (level 4) detected when present
- [ ] No hardcoded subsection names or line numbers
- [ ] Reference format: `docs/07-security-architecture.md (→ Subsection Name)`

**Validation**:
- [ ] All security references point to `docs/07-security-architecture.md`
- [ ] Subsection references include path within file
- [ ] Nested subsections formatted as: `Parent → Child`

### Implementation Checklist

Before generating compliance documents:

**Preparation**:
- [ ] ARCHITECTURE.md exists as navigation index (~130 lines)
- [ ] All required docs/ files exist for the contract being generated
- [ ] adr/README.md exists if contract requires ADR content
- [ ] Grep tool available for subsection detection within files

**Execution**:
- [ ] Read ARCHITECTURE.md first to extract project name
- [ ] Read each required docs/ file in full (no offsets)
- [ ] Apply Grep patterns against specific docs/ files
- [ ] Cache project name and common data across contracts

**Validation**:
- [ ] All source references use file paths (not section numbers)
- [ ] Source file paths are accurate and the files exist
- [ ] Cross-contract data references same source files
- [ ] No assumptions about section line numbers

**Output Quality**:
- [ ] Every contract section has source traceability
- [ ] Source file paths are accurate and verifiable
- [ ] Extraction method documented (direct-file-read)
- [ ] Project name matches H1 in ARCHITECTURE.md

---

## Conclusion

This mapping guide provides the foundation for extracting compliance data from ARCHITECTURE.md efficiently and accurately. By following these patterns and using context-efficient loading strategies, you can generate comprehensive compliance documents with minimal manual effort and high traceability.

For complete contract structures and additional examples, refer to:
- **COMPLIANCE_GENERATION_GUIDE.md**: Full methodology and contract descriptions
- **templates/**: Template files for each contract type
- **contracts/CONTRACT_TYPES_REFERENCE.md**: Organizational standards and requirements