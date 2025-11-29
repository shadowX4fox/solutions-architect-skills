# Section Mapping Guide

## Purpose

This guide provides detailed mapping between ARCHITECTURE.md sections and compliance contract types, including extraction patterns, transformation rules, and examples for each of the 11 compliance documents.

---

## ARCHITECTURE.md Structure Overview

### Standard 12-Section Structure

1. **Section 1: System Overview** - High-level description, purpose, scope
2. **Section 2: Business Context** - Business drivers, stakeholders, constraints
3. **Section 3: Architecture Patterns** - Design patterns, architectural style
4. **Section 4: Deployment Architecture** - Environments, infrastructure, cloud
5. **Section 5: System Components** - Components, services, interfaces
6. **Section 6: Data Flow** - Data movement, transformations, pipelines
7. **Section 7: Integration Points** - External systems, APIs, protocols
8. **Section 8: Technology Stack** - Technologies, versions, frameworks
9. **Section 9: Security Considerations** - Security controls, compliance
10. **Section 10: Performance Requirements** - SLAs, latency, throughput
11. **Section 11: Operational Considerations** - Monitoring, backup, incidents
12. **Section 12: Architecture Decision Records** - ADRs, trade-offs

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

---

## Contract Summary Matrix

| Contract Type | Primary Sections | Secondary | Complexity | Templates Priority |
|---------------|------------------|-----------|------------|-------------------|
| **1. Continuidad de Negocio** | 11 | 10 | Medium | High (#2) |
| **2. Arquitectura SRE** | 10, 11 | 5 | High | High (#1) |
| **3. Cloud Architecture** | 4, 8, 11 | 9, 10 | High | Medium (#3) |
| **4. Arquitectura Datos/IA** | 5, 6, 7 | 8, 10 | High | Medium (#4) |
| **5. Arquitectura Desarrollo** | 3, 5, 8, 12 | 11 | Medium | Medium (#5) |
| **6. Transformación Procesos** | 1, 2, 6 | 5, 7 | Low | Low (#6) |
| **7. Arquitectura Seguridad** | 9 | 7, 11 | High | High (#3) |
| **8. Plataformas Infraestructura** | 4, 8, 11 | 10 | Medium | Medium (#8) |
| **9. Arquitectura Empresarial** | 1, 2, 3, 4 | 12 | Medium | Medium (#9) |
| **10. Arquitectura Integración** | 7 | 5, 6, 8 | High | Medium (#10) |
| **11. Risk Management** | 9, 10, 11, 12 | 1, 5 | High | High (#4) |

---

## Detailed Contract Mappings

### Contract 1: Continuidad de Negocio (Business Continuity)

#### Document Purpose
Ensure business continuity through disaster recovery, backup strategies, and resilience measures.

#### Required Content Sections
1. Recovery Objectives (RTO/RPO)
2. Backup Strategy
3. Disaster Recovery Procedures
4. Business Impact Analysis
5. Resilience Measures
6. DR Testing Schedule

#### ARCHITECTURE.md Section Mapping

**Primary Source: Section 11 (Operational Considerations) - 80%**

##### Subsection 11.3: Backup & Recovery
**Extract**: Backup frequency, retention, RTO, RPO, storage location
**Transform to**: Contract Sections 1 (Recovery Objectives) & 2 (Backup Strategy)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 11.3, line 1823):
"Backup Strategy:
- Incremental backups: Daily at 2 AM UTC
- Full backups: Weekly on Sunday
- Retention: 30 days (incremental), 12 months (full)
- Storage: AWS S3 (primary), Glacier (long-term)
- RTO: 4 hours
- RPO: 1 hour"

Contract Output:
## 1. Recovery Objectives
**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 1 hour
**Business Criticality**: Tier 1 (inferred from RTO)
**Source**: ARCHITECTURE.md Section 11.3, lines 1823-1828

## 2. Backup Strategy
| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Incremental | Daily (2 AM UTC) | 30 days | AWS S3 |
| Full | Weekly (Sunday) | 12 months | AWS S3 + Glacier |

**Backup Testing**: [PLACEHOLDER: Add backup restoration test schedule]
**Source**: ARCHITECTURE.md Section 11.3, lines 1823-1826
```

##### Subsection 11.4: Disaster Recovery
**Extract**: DR procedures, failover mechanisms, geographic redundancy
**Transform to**: Contract Section 3 (DR Procedures)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 11.4, line 1850):
"Disaster Recovery:
- DR Site: AWS us-west-2 (primary: us-east-1)
- Failover: Automated via Route 53 health checks
- RTO Target: 4 hours
- DR Drills: Quarterly"

Contract Output:
## 3. Disaster Recovery
**Primary Site**: AWS us-east-1
**DR Site**: AWS us-west-2
**Failover Mechanism**: Automated via Route 53 health checks
**RTO Target**: 4 hours
**DR Testing**: Quarterly drills
**Last DR Test**: [PLACEHOLDER: Add last DR drill date and results]
**Source**: ARCHITECTURE.md Section 11.4, lines 1850-1854
```

**Secondary Source: Section 10 (Performance Requirements) - 20%**

##### Subsection 10.2: Availability SLA
**Extract**: Availability requirements, downtime tolerance
**Transform to**: Contract Section 4 (Business Impact)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 10.2, line 1576):
"Availability SLA: 99.99% uptime"

Contract Output:
## 4. Business Impact Analysis
**Availability Requirement**: 99.99% uptime
**Allowable Downtime**: 43.2 minutes/month
**Business Criticality**: Tier 1 (Mission Critical - inferred)
**Estimated Downtime Cost**: [PLACEHOLDER: Add hourly revenue impact]
**Source**: ARCHITECTURE.md Section 10.2, line 1576
```

#### Extraction Logic (Pseudo-code)
```python
def extract_business_continuity(architecture_md):
    # Load Section 11.3 (Backup & Recovery)
    backup_section = load_section(architecture_md, section=11.3)

    # Extract RTO/RPO (Direct)
    rto = extract_value(backup_section, pattern="RTO:? ([0-9]+ hours?)")
    rpo = extract_value(backup_section, pattern="RPO:? ([0-9]+ hours?)")

    # Extract backup details (Direct)
    backup_frequency = extract_value(backup_section, pattern="Incremental.*: (.+)")
    retention = extract_value(backup_section, pattern="Retention: (.+)")

    # Load Section 11.4 (DR)
    dr_section = load_section(architecture_md, section=11.4)

    # Extract DR details (Direct)
    dr_site = extract_value(dr_section, pattern="DR Site: (.+)")
    failover = extract_value(dr_section, pattern="Failover: (.+)")

    # Load Section 10.2 (Availability)
    perf_section = load_section(architecture_md, section=10.2)

    # Extract SLA (Direct + Transformation)
    sla = extract_value(perf_section, pattern="SLA:? ([0-9.]+%)")
    downtime = calculate_downtime(sla)  # Transformation
    criticality = infer_criticality(sla)  # Inference

    return {
        "rto": rto,
        "rpo": rpo,
        "backup": backup_frequency,
        "retention": retention,
        "dr_site": dr_site,
        "failover": failover,
        "sla": sla,
        "downtime": downtime,
        "criticality": criticality
    }
```

#### Missing Data Handling
```
Scenario 1: RTO/RPO not specified
Action: [PLACEHOLDER: Define RTO/RPO based on business criticality.
        Recommended: Tier 1 = RTO 4hr/RPO 1hr, Tier 2 = RTO 8hr/RPO 4hr]

Scenario 2: DR testing schedule missing
Action: [PLACEHOLDER: Define DR testing schedule.
        Recommended: Quarterly for Tier 1, Semi-annual for Tier 2]

Scenario 3: Backup restoration testing not mentioned
Action: [PLACEHOLDER: Implement backup restoration testing.
        Recommended: Monthly sample restorations, quarterly full restoration]
```

---

### Contract 2: Arquitectura SRE (Site Reliability Engineering)

#### Document Purpose
Define site reliability practices including SLOs, monitoring, incident management, and operational excellence.

#### Required Content Sections
1. Service Level Objectives (SLOs)
2. Service Level Indicators (SLIs)
3. Error Budgets
4. Monitoring & Observability
5. Incident Management
6. Capacity Planning
7. On-Call Management

#### ARCHITECTURE.md Section Mapping

**Primary Source: Section 10 (Performance Requirements) - 50%**

##### Subsection 10.1: Performance Metrics
**Extract**: Latency targets (p50, p95, p99), throughput (TPS), response times
**Transform to**: Contract Section 1 (SLOs - Latency)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 10.1, lines 1558-1564):
"Performance Targets:
- p50 latency: < 50ms
- p95 latency: < 100ms
- p99 latency: < 200ms
- Throughput: 450 TPS (design capacity)
- Peak capacity: 1000 TPS"

Contract Output:
## 1. Service Level Objectives (SLOs)

### 1.1 Latency SLOs
| Percentile | Target | Measurement Method | Source |
|------------|--------|-------------------|--------|
| p50 | < 50ms | API response time | Section 10.1, line 1558 |
| p95 | < 100ms | API response time | Section 10.1, line 1559 |
| p99 | < 200ms | API response time | Section 10.1, line 1560 |

**Monitoring Tool**: [PLACEHOLDER: Specify monitoring tool]
**Alert Threshold**: p95 > 110ms (10% over target)

### 1.2 Throughput SLOs
**Design Capacity**: 450 TPS
**Peak Capacity**: 1,000 TPS (2.2× design)
**Headroom**: 550 TPS (122% over design)
**Source**: ARCHITECTURE.md Section 10.1, lines 1562-1564
```

##### Subsection 10.2: Availability SLA
**Extract**: Uptime requirements
**Transform to**: Contract Sections 1.3 (Availability SLO) & 3 (Error Budget)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 10.2, line 1576):
"Availability SLA: 99.99% uptime"

Contract Output:
### 1.3 Availability SLO
**Target**: 99.99% uptime
**Measurement Window**: Monthly
**Measurement Method**: Uptime monitoring (synthetic checks every 60s)
**Source**: ARCHITECTURE.md Section 10.2, line 1576

## 3. Error Budgets

### 3.1 Monthly Error Budget
**SLA**: 99.99%
**Error Budget**: 43.2 minutes/month
**Calculation**: (100% - 99.99%) × 43,200 min = 43.2 min/month

### 3.2 Error Budget Breakdown
| Period | Allowed Downtime | Current Usage | Remaining |
|--------|-----------------|---------------|-----------|
| This Month | 43.2 min | [PLACEHOLDER: Add from monitoring] | [PLACEHOLDER] |
| Last Month | 43.2 min | [PLACEHOLDER: Add historical] | [PLACEHOLDER] |

**Error Budget Policy**: [PLACEHOLDER: Define policy when budget exhausted]
**Source**: Calculated from Section 10.2, line 1576
```

**Primary Source: Section 11 (Operational Considerations) - 40%**

##### Subsection 11.1: Monitoring and Logging
**Extract**: Monitoring tools, metrics, dashboards, alerting
**Transform to**: Contract Section 4 (Monitoring & Observability)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 11.1, lines 1780-1785):
"Monitoring:
- Metrics: Prometheus
- Visualization: Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
- Tracing: Jaeger
- Alerting: PagerDuty"

Contract Output:
## 4. Monitoring & Observability

### 4.1 Observability Stack
**Metrics Collection**: Prometheus
**Visualization**: Grafana
**Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)
**Distributed Tracing**: Jaeger
**Alerting Platform**: PagerDuty

### 4.2 Key Metrics Monitored
- Latency (p50, p95, p99)
- Throughput (requests/sec)
- Error rate (%)
- Availability (uptime %)
- Resource utilization (CPU, memory, disk)

**Dashboard Links**: [PLACEHOLDER: Add Grafana dashboard URLs]
**Source**: ARCHITECTURE.md Section 11.1, lines 1780-1785
```

##### Subsection 11.2: Incident Management
**Extract**: Incident response procedures, escalation paths
**Transform to**: Contract Section 5 (Incident Management)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 11.2, lines 1810-1820):
"Incident Management:
- Alerting: PagerDuty
- Response SLA: P1 < 15 min, P2 < 1 hour, P3 < 4 hours
- Escalation: L1 (5 min) → L2 (15 min) → L3 (30 min)
- Postmortems: Required for all P1/P2 incidents
- Incident Commander: On-call SRE"

Contract Output:
## 5. Incident Management

### 5.1 Incident Classification
| Priority | Description | Response Time SLA | Escalation |
|----------|-------------|-------------------|------------|
| P1 | Service down, revenue impact | < 15 minutes | Immediate to L2 |
| P2 | Major functionality impaired | < 1 hour | 15 min to L2 |
| P3 | Minor issues, workaround exists | < 4 hours | 30 min to L2 |

### 5.2 Incident Response
**Alerting Platform**: PagerDuty
**Incident Commander**: On-call SRE
**Communication Channel**: [PLACEHOLDER: Add Slack channel or tool]

### 5.3 Escalation Path
1. **L1** (0-5 min): On-call engineer triages
2. **L2** (5-15 min): Senior SRE engaged
3. **L3** (15-30 min): Engineering manager + architect

### 5.4 Postmortem Requirements
**Required For**: All P1 and P2 incidents
**Timeline**: Within 48 hours of resolution
**Distribution**: Engineering team, stakeholders
**Template**: [PLACEHOLDER: Link to postmortem template]

**Source**: ARCHITECTURE.md Section 11.2, lines 1810-1820
```

**Secondary Source: Section 5 (System Components) - 10%**

##### Component-Level Reliability
**Extract**: Component redundancy, failover
**Transform to**: Contract Section 2 (SLIs)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 5.2, line 720):
"API Gateway: NGINX (3 instances, load balanced)"

Contract Output:
## 2. Service Level Indicators (SLIs)

### 2.1 Component Availability
| Component | Redundancy | Monitoring Method | Target |
|-----------|------------|-------------------|--------|
| API Gateway | 3 instances (NGINX) | Health checks | 99.99% |
| [Other components...] | [...] | [...] | [...] |

**Source**: ARCHITECTURE.md Section 5.2, line 720
```

#### Extraction Logic (Pseudo-code)
```python
def extract_sre_architecture(architecture_md):
    # Load Section 10.1 (Performance Metrics)
    perf_section = load_section(architecture_md, section=10.1)

    # Extract latency SLOs (Direct)
    p50 = extract_value(perf_section, pattern="p50.*: < ([0-9]+ms)")
    p95 = extract_value(perf_section, pattern="p95.*: < ([0-9]+ms)")
    p99 = extract_value(perf_section, pattern="p99.*: < ([0-9]+ms)")
    throughput = extract_value(perf_section, pattern="Throughput: ([0-9]+ TPS)")

    # Load Section 10.2 (Availability)
    avail_section = load_section(architecture_md, section=10.2)

    # Extract SLA (Direct + Transformation)
    sla = extract_value(avail_section, pattern="SLA:? ([0-9.]+%)")
    error_budget = calculate_error_budget(sla)  # Transformation

    # Load Section 11.1 (Monitoring)
    monitor_section = load_section(architecture_md, section=11.1)

    # Extract monitoring tools (Aggregation)
    metrics_tool = extract_value(monitor_section, pattern="Metrics: (.+)")
    viz_tool = extract_value(monitor_section, pattern="Visualization: (.+)")
    logging_tool = extract_value(monitor_section, pattern="Logging: (.+)")

    # Load Section 11.2 (Incidents)
    incident_section = load_section(architecture_md, section=11.2)

    # Extract incident SLAs (Direct)
    p1_response = extract_value(incident_section, pattern="P1.*< ([0-9]+ min)")

    return {
        "latency_slos": {"p50": p50, "p95": p95, "p99": p99},
        "throughput": throughput,
        "availability_slo": sla,
        "error_budget": error_budget,
        "monitoring": {
            "metrics": metrics_tool,
            "visualization": viz_tool,
            "logging": logging_tool
        },
        "incident_response": {"p1": p1_response}
    }
```

#### Missing Data Handling
```
Scenario 1: On-call rotation not specified
Action: [PLACEHOLDER: Define on-call rotation schedule.
        Recommended: 7-day rotation, 24/7 coverage, primary + secondary]

Scenario 2: Runbooks not mentioned
Action: [PLACEHOLDER: Create and maintain operational runbooks.
        Location: [Specify repository]
        Required runbooks: Deployment, rollback, incident response]

Scenario 3: Error budget policy undefined
Action: [PLACEHOLDER: Define error budget policy.
        Recommended: If budget exhausted, freeze feature releases until next period]
```

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

### Contract 4: Arquitectura Datos y Analítica - IA

#### Section Mapping Summary
**Primary**: Sections 5, 6, 7 (80%)
**Secondary**: Sections 8, 10 (20%)

**Key Extractions**:
- Section 5: Data storage components, ML models, data processing
- Section 6: Data pipelines, ETL flows, transformations
- Section 7: Data sources, data sinks, integration points
- Section 8: Data technologies (databases, data warehouses, ML frameworks)
- Section 10: Data processing SLAs, query performance

---

### Contract 5: Arquitectura Desarrollo

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
           "evidence": "Java 17 (LTS) (Section 8.1, line 952)",
           "reasoning": "Java 17 is LTS and supported (Java 11, Java 17 approved)"
         },
         "item_2": {
           "status": "PASS",
           "question": "Is Spring Boot in a supported version?",
           "evidence": "Spring Boot 3.2 (Section 8.1, line 953)",
           "reasoning": "Spring Boot 3.2 is current and supported"
         },
         "item_3": {
           "status": "PASS",
           "question": "Are official tools used?",
           "evidence": "Maven 3.9, JUnit 5, Mockito, SonarQube (Section 8.1, lines 954-956)",
           "reasoning": "All tools are in approved list (Maven, JUnit, SonarQube)"
         },
         "item_4": {
           "status": "PASS",
           "question": "Is deployment in authorized containers?",
           "evidence": "Docker 24+, AKS 1.28+, Helm 3.13+ (Section 8.2, lines 960-962)",
           "reasoning": "Docker and AKS are in approved container catalog"
         },
         "item_5": {
           "status": "PASS",
           "question": "Are only approved libraries used?",
           "evidence": "10 Spring libraries documented (Section 8.1, line 957)",
           "reasoning": "All Spring libraries are in approved catalog"
         },
         "item_6": {
           "status": "UNKNOWN",
           "question": "Does naming follow standards?",
           "evidence": "Not documented in Section 8",
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
           "evidence": "Helm 3.13+, Azure DevOps Pipelines (Section 8.3, lines 965-966)",
           "reasoning": "Both Helm and Azure DevOps Pipelines are approved IaC tools"
         },
         "item_3": {
           "status": "PASS",
           "question": "Are databases authorized?",
           "evidence": "Azure SQL Database, Azure Managed Redis (Section 8.4, lines 969-970)",
           "reasoning": "Both SQL Server (Azure SQL) and Redis are in authorized catalog"
         },
         "item_4": {
           "status": "UNKNOWN",
           "question": "Do APIs comply with OpenAPI 3.0?",
           "evidence": "Not explicitly documented in Section 8",
           "reasoning": "OpenAPI/Swagger not mentioned; inferred from Spring Boot but not confirmed"
         },
         "item_5": {
           "status": "PASS",
           "question": "Is CI/CD authorized?",
           "evidence": "Azure DevOps Pipelines, GitHub Actions (Section 8.3, line 966)",
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

## LADES1.6: Validación del Stack Tecnológico

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
1. **Document Naming Conventions**: Add repository and resource naming conventions to Section 8 (Java Backend Item 6)
2. **Document OpenAPI Version**: Explicitly specify OpenAPI/Swagger version in Section 8 (Other Stacks Item 4)

**Source**: ARCHITECTURE.md Section 8 (Technology Stack), lines 949-1035

**Legend**:
- ✅ PASS: Complies with authorized technology catalog
- ❌ FAIL: Non-compliant (deprecated version, unapproved technology, or missing documentation)
- ❓ UNKNOWN: Insufficient data in Section 8 to validate
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
def extract_development_architecture(architecture_md):
    # Load Section 8 (Technology Stack)
    tech_stack_section = load_section(architecture_md, section=8)

    # Step 3.5: Automatic Stack Validation
    validation_results = perform_stack_validation(tech_stack_section)

    # Cache validation results
    contract_data_cache["validation_results"] = validation_results

    # Load Section 3 (Architecture Patterns)
    patterns_section = load_section(architecture_md, section=3)

    # Extract design patterns (Direct)
    architectural_style = extract_value(patterns_section, pattern="Architectural Style: (.+)")
    design_patterns = extract_list(patterns_section, pattern="Pattern: (.+)")

    # Load Section 5 (System Components)
    components_section = load_section(architecture_md, section=5)

    # Extract components (Aggregation)
    components = extract_components(components_section)

    # Load Section 12 (ADRs)
    adr_section = load_section(architecture_md, section=12)

    # Extract technology ADRs (Filter)
    tech_adrs = filter_adrs(adr_section, category="technology")

    # Load Section 11 (Operational)
    ops_section = load_section(architecture_md, section=11)

    # Extract CI/CD (Direct)
    cicd_tools = extract_value(ops_section, pattern="CI/CD: (.+)")

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
Scenario 1: Section 8 missing or empty
Action: [PLACEHOLDER: Section 8 (Technology Stack) not found or empty.
        Cannot perform automatic stack validation.
        Add technology stack details to ARCHITECTURE.md Section 8]

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

### Contract 6: Transformación de Procesos y Automatización

#### Section Mapping Summary
**Primary**: Sections 1, 2, 6 (75%)
**Secondary**: Sections 5, 7 (25%)

**Key Extractions**:
- Section 1: Automation scope, objectives, benefits
- Section 2: Business process context, efficiency gains
- Section 6: Automated workflows, process flows
- Section 5: Automation components (RPA, workflow engines)
- Section 7: Process integrations

---

### Contract 7: Arquitectura Seguridad

#### Section Mapping Summary
**Primary**: Section 9 (70%)
**Secondary**: Sections 7, 11 (30%)

**Key Extractions**:
- Section 9.1: API security (authentication, authorization, rate limiting)
- Section 9.2: Authentication methods (OAuth, SAML, JWT, MFA)
- Section 9.3: Encryption (at rest, in transit, key management)
- Section 9.4: Network security (firewalls, VPCs, security groups)
- Section 7: Integration security (API keys, mutual TLS)
- Section 11: Security monitoring (SIEM, audit logs)

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

### Validation Checklist

When reviewing generated compliance documents, verify:

- [ ] No references to "Section 9.1", "Section 9.2", "Section 9.3", "Section 9.4" (numbered subsections)
- [ ] All Section 9 references include subsection path after "Security Architecture →"
- [ ] Line numbers accurately point to referenced content
- [ ] Subsection path matches the actual content being referenced

### Template Compliance

All templates with Section 9 references must use this standard:

| Template | Section 9 Usage | Compliance Status |
|----------|----------------|-------------------|
| TEMPLATE_CLOUD_ARCHITECTURE.md | 5 references (LAC3) | ✅ Updated (2025-11-27) |
| TEMPLATE_ARQUITECTURA_SEGURIDAD.md | 8 references (primary) | ⚠️ Needs review |
| TEMPLATE_ARQUITECTURA_DATOS_IA.md | 2 references | ⚠️ Needs review |
| TEMPLATE_ARQUITECTURA_INTEGRACION.md | 2 references | ⚠️ Needs review |
| TEMPLATE_RISK_MANAGEMENT.md | Implicit references | ⚠️ Needs review |

**Action Required**: Review and update templates marked ⚠️ to ensure compliance with this standard.

---

### Contract 8: Plataformas e Infraestructura TI

#### Section Mapping Summary
**Primary**: Sections 4, 8, 11 (90%)
**Secondary**: Section 10 (10%)

**Key Extractions**:
- Section 4: Environments (dev, staging, prod), isolation
- Section 8: Infrastructure technologies (OS, containers, orchestration)
- Section 11: Infrastructure operations, capacity planning
- Section 10: Infrastructure capacity requirements

---

### Contract 9: Arquitectura Empresarial

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

### Contract 10: Arquitectura de Integración

#### Section Mapping Summary
**Primary**: Section 7 (50%)
**Secondary**: Sections 5, 6, 8 (50%)

**Key Extractions**:
- Section 7: Integration catalog (all external systems, APIs, protocols)
- Section 5: Integration components (API gateway, message brokers)
- Section 6: Integration flows, data exchange patterns
- Section 8: Integration technologies (REST, SOAP, messaging)

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

### Contract 11: Risk Management

#### Section Mapping Summary
**Primary**: Sections 9, 10, 11, 12 (80%)
**Secondary**: Sections 1, 5 (20%)

**Key Extractions**:
- Section 9: Security risks (vulnerabilities, threats, controls)
- Section 10: Performance risks (capacity, latency, availability)
- Section 11: Operational risks (DR, backup failures, incidents)
- Section 12: Architectural decision risks and trade-offs
- Section 1: Business context risks
- Section 5: Technical/component risks

**Detailed Example**:
```
ARCHITECTURE.md Input:
Section 9.3 (line 1480): "Encryption: TLS 1.3, AES-256. Key rotation: manual (quarterly)"
Section 10.2 (line 1576): "SLA: 99.99% uptime"
Section 11.4 (line 1850): "DR Site: Single region (us-west-2)"

Contract Output:
## Risk Register

### RISK-001: Manual Key Rotation
**Category**: Security
**Description**: Encryption keys rotated manually on quarterly basis
**Likelihood**: Medium (3/5) - Manual process prone to delays
**Impact**: High (4/5) - Key compromise could expose all encrypted data
**Risk Score**: 12 (Medium-High)
**Source**: Section 9.3, line 1480

**Mitigation Strategies**:
1. Automate key rotation using AWS KMS or similar service
2. Implement key rotation monitoring and alerts
3. Document key rotation procedures in runbook

**Residual Risk**: Low (2/5) after automation
**Owner**: [PLACEHOLDER: Assign security team owner]
**Target Date**: [PLACEHOLDER: Define implementation timeline]

---

### RISK-002: Single Region DR
**Category**: Availability
**Description**: DR site in single region (us-west-2); risk of regional outage
**Likelihood**: Low (2/5) - Regional outages rare but possible
**Impact**: Critical (5/5) - Complete service outage, violates 99.99% SLA
**Risk Score**: 10 (Medium)
**Source**: Section 11.4, line 1850; Section 10.2, line 1576

**Mitigation Strategies**:
1. Implement multi-region DR (add us-east-1 as secondary DR)
2. Active-active deployment across regions
3. Automated failover between regions

**Residual Risk**: Very Low (1/5) with multi-region
**Cost Impact**: +25% infrastructure costs
**Owner**: [PLACEHOLDER: Assign infrastructure team owner]
**Target Date**: [PLACEHOLDER: Define implementation timeline]
```

---

## Cross-Contract Data Reuse

### Common Data Points

Many data points appear in multiple contracts. Extract once, cache, and reuse:

**1. Availability SLA (appears in 6 contracts)**
```
Source: Section 10.2
Used in:
- Continuidad de Negocio (RTO/RPO justification)
- Arquitectura SRE (SLO, error budget)
- Cloud Architecture (cloud SLA requirements)
- Plataformas Infraestructura (infrastructure availability)
- Arquitectura Empresarial (business criticality)
- Risk Management (availability risks)

Extract once: "99.99% SLA"
Cache with source: "Section 10.2, line 1576"
Reuse in all 6 contracts with appropriate transformations
```

**2. Technology Stack (appears in 5 contracts)**
```
Source: Section 8
Used in:
- Arquitectura Desarrollo (technology choices)
- Cloud Architecture (cloud services)
- Plataformas Infraestructura (infrastructure tech)
- Arquitectura Integración (integration tech)
- Arquitectura Seguridad (security tools)

Extract once: Full technology inventory
Cache as structured data
Apply different filters per contract
```

**3. Integration Catalog (appears in 3 contracts)**
```
Source: Section 7
Used in:
- Arquitectura Integración (full catalog)
- Arquitectura Seguridad (integration security)
- Arquitectura Datos/IA (data sources/sinks)

Extract once: All integrations with details
Cache as structured list
Filter by contract focus
```

### Caching Strategy

```python
# Global cache for cross-contract data
contract_data_cache = {}

def extract_with_caching(architecture_md, section, pattern, cache_key):
    """Extract data with caching for reuse across contracts"""

    # Check cache first
    if cache_key in contract_data_cache:
        return contract_data_cache[cache_key]

    # Extract if not cached
    section_content = load_section(architecture_md, section)
    value = extract_value(section_content, pattern)

    # Cache with metadata
    contract_data_cache[cache_key] = {
        "value": value,
        "source": f"Section {section}, line {get_line_number(value)}",
        "extracted_at": current_timestamp()
    }

    return contract_data_cache[cache_key]

# Usage across contracts
sla_data = extract_with_caching(arch_md, 10.2, r"SLA: ([0-9.]+%)", "availability_sla")

# Reuse in Contract 1 (Continuidad de Negocio)
continuidad_contract["sla"] = sla_data["value"]

# Reuse in Contract 2 (Arquitectura SRE) with transformation
sre_contract["error_budget"] = calculate_error_budget(sla_data["value"])

# Reuse in Contract 11 (Risk Management)
risk_contract["availability_risk"] = assess_risk(sla_data["value"])
```

---

## Handling Missing Data

### Common Missing Data Scenarios

**Scenario 1: Section Exists but Incomplete**
```
ARCHITECTURE.md has Section 11.3 (Backup) but missing RTO/RPO

Action:
1. Extract available data (backup frequency, retention)
2. Flag missing: [PLACEHOLDER: RTO/RPO not specified]
3. Provide guidance based on SLA
4. Include in completion report

Example:
RTO: [PLACEHOLDER: Define based on 99.99% SLA. Recommended: 4 hours for Tier 1]
```

**Scenario 2: Entire Section Missing**
```
ARCHITECTURE.md missing Section 11.2 (Incident Management)

Action:
1. Flag entire contract section as placeholder
2. Provide template structure
3. Reference industry standards
4. Include in completion report with high priority

Example:
## Incident Management
[PLACEHOLDER: Section 11.2 (Incident Management) not found in ARCHITECTURE.md.

Add the following to ARCHITECTURE.md:
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

Action:
1. Attempt interpretation with confidence score
2. Flag as [INFERRED] rather than [EXTRACTED]
3. Request clarification in completion report

Example:
RTO: [INFERRED: ~4 hours (interpreted from "half a business day")]
Confidence: Medium
Recommendation: Update ARCHITECTURE.md Section 11.3 with explicit RTO value
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
- [ ] Every value includes section and line number
- [ ] Transformation logic is documented
- [ ] Inference rationale is explained
- [ ] Cache hits are properly attributed

**Consistency**:
- [ ] Same data point identical across contracts
- [ ] Transformations are consistent (e.g., all error budgets calculated same way)
- [ ] Terminology is consistent
- [ ] Formatting is uniform

---

## Conclusion

This mapping guide provides the foundation for extracting compliance data from ARCHITECTURE.md efficiently and accurately. By following these patterns and using context-efficient loading strategies, you can generate comprehensive compliance documents with minimal manual effort and high traceability.

For complete contract structures and additional examples, refer to:
- **COMPLIANCE_GENERATION_GUIDE.md**: Full methodology and contract descriptions
- **templates/**: Template files for each contract type
- **contracts/CONTRACT_TYPES_REFERENCE.md**: Organizational standards and requirements