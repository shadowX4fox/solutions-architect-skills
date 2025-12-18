# Section Mapping Guide

## Purpose

This guide provides detailed mapping between ARCHITECTURE.md sections and compliance contract types, including extraction patterns, transformation rules, and examples for each of the 10 compliance documents.

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

### Document Index-Based Section Loading

#### Overview

All section references and data extractions use the **Document Index** from ARCHITECTURE.md (typically lines 5-21) to determine exact line ranges. This enables context-efficient loading and precise source traceability, minimizing token usage while maintaining accuracy.

The Document Index is a standardized navigation structure maintained in all ARCHITECTURE.md files following the architecture-docs skill template. It maps each of the 12 standard sections to their exact line ranges within the document.

#### Document Index Structure

The Document Index appears at the beginning of ARCHITECTURE.md (lines 5-21) with this format:

```markdown
## Document Index

**Quick Navigation:**
- [Section 1: Executive Summary](#1-executive-summary) → Lines 25-53
- [Section 2: System Overview](#2-system-overview) → Lines 54-146
- [Section 3: Architecture Principles](#3-architecture-principles) → Lines 147-300
- [Section 4: Deployment Architecture](#4-deployment-architecture) → Lines 301-450
- [Section 5: System Components](#5-system-components) → Lines 451-600
- [Section 6: Data Flow](#6-data-flow) → Lines 601-750
- [Section 7: Integration Points](#7-integration-points) → Lines 751-900
- [Section 8: Technology Stack](#8-technology-stack) → Lines 901-1050
- [Section 9: Security Considerations](#9-security-considerations) → Lines 1051-1250
- [Section 10: Performance Requirements](#10-performance-requirements) → Lines 1251-1400
- [Section 11: Operational Considerations](#11-operational-considerations) → Lines 1401-1650
- [Section 12: Architecture Decision Records](#12-architecture-decision-records) → Lines 1651-EOF

**Index Last Updated:** YYYY-MM-DD
```

**Key Elements:**
- **Section names**: Clickable markdown anchors for navigation
- **Line ranges**: Exact start and end line numbers (`Lines X-Y`)
- **Timestamp**: Last update date for tracking index freshness

#### Three-Step Section Loading Workflow

##### Step 1: Load Document Index

First, read the Document Index to extract section line ranges:

```python
# Load Document Index (first 50 lines typically contain it)
index_content = Read(file_path="ARCHITECTURE.md", offset=1, limit=50)

# Parse to extract section ranges
doc_index = parse_document_index(index_content)
# Returns: {
#   "1": {"start": 25, "end": 53, "name": "Executive Summary"},
#   "2": {"start": 54, "end": 146, "name": "System Overview"},
#   ...
#   "last_updated": "2025-11-27"
# }
```

##### Step 2: Lookup Target Section

For a target section (e.g., Section 11 - Operational Considerations), extract its line range:

```python
section_11_range = doc_index.get_section_range(section=11)
# Returns: {"start": 1401, "end": 1650, "name": "Operational Considerations"}
```

##### Step 3: Calculate Load Parameters with Buffer

Calculate `offset` and `limit` parameters for the Read tool with context buffer:

```python
section_start = 1401  # From Document Index
section_end = 1650    # From Document Index
buffer = 10           # Context buffer (5-20 lines recommended)

# Calculate Read parameters
offset = section_start - buffer - 1  # -1 for zero-indexed offset
limit = (section_end - section_start) + (2 * buffer)

# Result: offset=1390, limit=259
section_content = Read(file_path="ARCHITECTURE.md", offset=1390, limit=259)
# Reads lines 1391-1649 (Section 11 with ±10-line buffer)
```

**Buffer Purpose:**
- Captures context around section boundaries
- Ensures subsection headers are included
- Prevents data loss at edges
- Standard sizes: minimal (5-10), standard (10-20), extended (20-50 lines)

#### Buffer Size Guidelines

| Extraction Type | Buffer Size | Use Case | Example |
|----------------|-------------|----------|---------|
| **Minimal** | 5-10 lines | Single value extraction (RTO, SLA) | Extract "RTO: 4 hours" |
| **Standard** | 10-20 lines | Subsection extraction (Section 11.3) | Extract full backup strategy |
| **Extended** | 20-50 lines | Full section or complex patterns | Extract all monitoring tools + config |

**Selection Criteria:**
- **Minimal**: Known value location, simple regex patterns
- **Standard**: Subsection-level data, multiple related values
- **Extended**: Cross-subsection relationships, aggregate data

#### Subsection Detection and Loading

For subsections (e.g., Section 11.3 - Backup & Recovery), use a two-step approach:

**Step 1: Locate Subsection Within Section**

After loading the full section (Step 3 above), use grep to find subsection boundaries:

```python
# Use Grep tool to find subsection within section range
grep_result = grep_subsection(
    file_path="ARCHITECTURE.md",
    pattern="^### 11\.3",  # Subsection pattern (note escaped dot)
    start_line=1401,       # Section 11 start (from index)
    end_line=1650          # Section 11 end (from index)
)
# Returns: {"line_number": 1523, "header": "### 11.3 Backup & Recovery"}
```

**Step 2: Calculate Subsection Line Range**

Find the next subsection to determine where 11.3 ends:

```python
# Grep for next subsection (11.4)
next_subsection = grep_subsection(
    pattern="^### 11\.4",
    start_line=1523,       # Current subsection start
    end_line=1650          # Section end
)
# Returns: {"line_number": 1575}

# Calculate subsection bounds
subsection_start = 1523
subsection_end = next_subsection["line_number"] - 1  # 1574 (line before 11.4)
```

**Step 3: Load Subsection with Buffer**

```python
buffer = 10
offset = subsection_start - buffer - 1  # 1512
limit = (subsection_end - subsection_start) + (2 * buffer)  # 71

subsection_content = Read(file_path="ARCHITECTURE.md", offset=1512, limit=71)
# Reads lines 1513-1583 (Section 11.3 + 10-line buffer)
```

#### Section Boundary Detection Algorithm

When the Document Index is unavailable, outdated, or needs regeneration, use this algorithm:

##### Step 1: Detect All Primary Section Headers

Use grep to find all numbered section headers:

```bash
grep -n "^## [0-9]" ARCHITECTURE.md
```

**Output Example:**
```
25:## 1. Executive Summary
54:## 2. System Overview
147:## 3. Architecture Principles
301:## 4. Deployment Architecture
451:## 5. System Components
601:## 6. Data Flow
751:## 7. Integration Points
901:## 8. Technology Stack
1051:## 9. Security Considerations
1251:## 10. Performance Requirements
1401:## 11. Operational Considerations
1651:## 12. Architecture Decision Records
```

##### Step 2: Parse Grep Output to Build Index

```python
import re

section_boundaries = {}
grep_lines = grep_output.strip().split('\n')

for i, line in enumerate(grep_lines):
    # Parse: "25:## 1. Executive Summary"
    line_num, header = line.split(':', 1)

    # Extract section number (1, 2, 3, ..., 12)
    match = re.search(r'^## (\d+)\.', header)
    section_num = match.group(1)

    # Extract section name
    section_name = header.split('. ', 1)[1].strip()

    # Calculate end line (next section start - 1, or EOF for last section)
    if i + 1 < len(grep_lines):
        next_line_num = int(grep_lines[i+1].split(':')[0])
        end_line = next_line_num - 1
    else:
        end_line = "EOF"  # Or get file line count

    section_boundaries[section_num] = {
        "start": int(line_num),
        "end": end_line,
        "name": section_name
    }

# Result: Same structure as parsed Document Index
```

##### Step 3: Generate or Update Document Index

Use the parsed boundaries to create/update the Document Index section:

```python
from datetime import date

index_content = "## Document Index\n\n**Quick Navigation:**\n"

for section_num in sorted(section_boundaries.keys(), key=int):
    section = section_boundaries[section_num]
    anchor = f"#{section_num}-{section['name'].lower().replace(' ', '-')}"
    end_display = section['end'] if section['end'] != 'EOF' else 'EOF'

    index_content += f"- [Section {section_num}: {section['name']}]({anchor}) → Lines {section['start']}-{end_display}\n"

index_content += f"\n**Index Last Updated:** {date.today().isoformat()}\n"

# Write to ARCHITECTURE.md lines 5-21 (replace existing index)
```

#### Line Number Calculation for Source References

All extracted values must include precise line number references. Calculate using this formula:

**Formula:**
```
absolute_line_number = subsection_start_line + relative_offset
```

**Implementation:**

```python
# After loading subsection content and finding a match
rto_match = re.search(r'RTO:?\s*([0-9]+\s*hours?)', subsection_content)

if rto_match:
    # Calculate relative offset (newline count before match)
    relative_offset = subsection_content[:rto_match.start()].count('\n')

    # Calculate absolute line number
    absolute_line_number = subsection_start + relative_offset
    # Example: 1523 (subsection start) + 5 (offset) = 1528

    # Store with source reference
    rto_value = rto_match.group(1)
    rto_source = f"Section 11.3, line {absolute_line_number}"

# Return structured data
return {
    "rto": rto_value,
    "rto_source": rto_source,
    "rto_line": absolute_line_number
}
```

**Why This Matters:**
- **Traceability**: Compliance audits require exact source locations
- **Consistency**: Same value must have same line reference across contracts
- **Validation**: Enables automated consistency checking
- **Updates**: Easy to re-extract if ARCHITECTURE.md changes

#### Context-Efficient Loading Strategy

Follow this hierarchy to minimize token usage:

1. **Document Index First** (50 lines): Always start by loading the index
2. **Section-Level Loading** (100-300 lines): Load full section for multiple subsections
3. **Subsection-Level Loading** (30-100 lines): Load specific subsection when possible
4. **Targeted Extraction** (10-30 lines): Use grep + minimal buffer for single values

**Example Optimization:**

```python
# INEFFICIENT: Load entire file (2000+ lines)
full_content = Read(file_path="ARCHITECTURE.md")  # DON'T DO THIS

# EFFICIENT: Document Index + targeted section
index = Read(file_path="ARCHITECTURE.md", offset=1, limit=50)  # 50 lines
section_11 = Read(file_path="ARCHITECTURE.md", offset=1390, limit=259)  # 259 lines
# Total: 309 lines (vs 2000+ lines)

# MOST EFFICIENT: Index + subsection only
index = Read(offset=1, limit=50)  # 50 lines
subsection_11_3 = Read(offset=1512, limit=71)  # 71 lines
# Total: 121 lines (6x more efficient than full file read)
```

#### Complete Workflow Example

Extracting RTO/RPO from Section 11.3 using index-based methodology:

```python
def extract_rto_rpo_from_architecture(architecture_md_path):
    # Step 1: Load Document Index
    index_content = Read(file_path=architecture_md_path, offset=1, limit=50)
    doc_index = parse_document_index(index_content)

    # Step 2: Get Section 11 range
    section_11 = doc_index["11"]
    # Returns: {"start": 1401, "end": 1650, "name": "Operational Considerations"}

    # Step 3: Find subsection 11.3 within Section 11
    grep_result_11_3 = grep_subsection(
        file_path=architecture_md_path,
        pattern="^### 11\.3",
        start_line=section_11["start"],
        end_line=section_11["end"]
    )
    subsection_start = grep_result_11_3["line_number"]  # 1523

    # Step 4: Find next subsection to determine end
    grep_result_11_4 = grep_subsection(
        pattern="^### 11\.4",
        start_line=subsection_start,
        end_line=section_11["end"]
    )
    subsection_end = grep_result_11_4["line_number"] - 1  # 1574

    # Step 5: Load subsection with buffer
    buffer = 10
    offset = subsection_start - buffer - 1  # 1512
    limit = (subsection_end - subsection_start) + (2 * buffer)  # 71

    subsection_content = Read(
        file_path=architecture_md_path,
        offset=1512,
        limit=71
    )

    # Step 6: Extract values with line number tracking
    rto_match = re.search(r'RTO:?\s*([0-9]+\s*hours?)', subsection_content)
    rpo_match = re.search(r'RPO:?\s*([0-9]+\s*hours?)', subsection_content)

    results = {}

    if rto_match:
        relative_offset = subsection_content[:rto_match.start()].count('\n')
        results["rto"] = {
            "value": rto_match.group(1),
            "line": subsection_start + relative_offset,
            "source": f"Section 11.3, line {subsection_start + relative_offset}"
        }

    if rpo_match:
        relative_offset = subsection_content[:rpo_match.start()].count('\n')
        results["rpo"] = {
            "value": rpo_match.group(1),
            "line": subsection_start + relative_offset,
            "source": f"Section 11.3, line {subsection_start + relative_offset}"
        }

    return results

# Example return value:
# {
#     "rto": {
#         "value": "4 hours",
#         "line": 1528,
#         "source": "Section 11.3, line 1528"
#     },
#     "rpo": {
#         "value": "1 hour",
#         "line": 1529,
#         "source": "Section 11.3, line 1529"
#     }
# }
```

**Tokens Saved:**
- Full file read: ~2000 lines
- This approach: 121 lines (index + subsection)
- **Efficiency: 94% reduction** in context usage

---

## Contract Summary Matrix

| Contract Type | Primary Sections | Secondary | Complexity | Templates Priority |
|---------------|------------------|-----------|------------|-------------------|
| **1. Business Continuity v2.0** | 1, 3, 4, 5, 7, 8, 10, 11 | - | High | High (#2) |
| **2. SRE Architecture** | 10, 11 | 5 | High | High (#1) |
| **3. Cloud Architecture** | 4, 8, 11 | 9, 10 | High | Medium (#3) |
| **4. Data & Analytics - AI Architecture** | 5, 6, 7 | 8, 10 | High | Medium (#4) |
| **5. Development Architecture** | 3, 5, 8, 12 | 11 | Medium | Medium (#5) |
| **6. Process Transformation** | 1, 2, 6 | 5, 7 | Low | Low (#6) |
| **7. Security Architecture v2.0** | 4, 5, 7, 9, 11 | - | High | High (#7) |
| **8. Platform & IT Infrastructure** | 4, 8, 11 | 10 | Medium | Medium (#8) |
| **9. Enterprise Architecture** | 1, 2, 3, 4 | 12 | Medium | Medium (#9) |
| **10. Integration Architecture v2.0** | 5, 6, 7, 9 | - | High | High (#10) |

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
- **Source**: Section 3 (Architecture Overview → Logical Architecture)
- **Extract**: Layer count and layer names
- **Pattern**: Search for "tier", "layer", numbered architecture levels
- **Example**: "4-tier: Presentation, API, Business Logic, Data" → Compliant

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

**Step 1: Load Document Index**
```
Read ARCHITECTURE.md lines 1-50
Parse Document Index → {1: lines 25-53, 3: lines 147-300, ...}
```

**Step 2: Extract by Category (43 iterations)**

For each LACN requirement:
1. Identify source section from mapping above
2. Load section using Document Index line range
3. Apply extraction pattern (Grep or string search)
4. Calculate absolute line number: section_start + relative_offset
5. Determine status (Compliant/Non-Compliant/Not Applicable/Unknown)
6. Populate table row

**Step 3: Generate Compliance Summary**

Transform extracted data → 6-column table:
```
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LACN001 | Application Name | BC-GEN | Compliant | Section 1, line 28 | Business Team |
| LACN012 | RTO Definition | BC-RTO | Compliant | Section 10, line 1296 | Infrastructure |
...
```

#### Line Number Calculation Example

**LACN012 (RTO)** extraction:
```
1. Document Index → Section 10: lines 1251-1400
2. Grep in Section 10: "RTO:?\s*([0-9]+\s*(hours?|minutes?))"
3. Match found at offset +45 from section start
4. Absolute line: 1251 + 45 = 1296
5. Source reference: "Section 10 (Non-Functional Requirements), line 1296"
6. Value: "4 hours"
7. Status: Compliant (RTO documented)
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
ARCHITECTURE.md Section 11.1:
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

##### Section 10 (Performance Requirements) - 30%
**Maps to**: LASRE07-11, LASRE17-19, LASRE42-44

**Subsections**:
- **10.1 Performance Metrics, Resilience**: LASRE07 (readiness probes), LASRE08 (health checks), LASRE10 (load testing), LASRE11 (auto-scaling), LASRE42-44 (resilience patterns)
- **10.2 Availability, SLAs**: LASRE09 (HA), LASRE17-18 (availability/performance measurement), LASRE19 (thresholds)

**Extraction Pattern**:
```markdown
ARCHITECTURE.md Section 10.1:
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
- Source: Section 11.1 (Monitoring and Logging)
- Blocker: Structured format, log levels, accessibility
- Desired: Centralization, verbosity control

**Application Deployment** (LASRE04, 33):
- Source: Section 11.3 (Deployment)
- Blocker: Rollback mechanisms, deployment consistency

**Configuration Management** (LASRE05, 15, 39):
- Source: Section 11.4 (Configuration)
- Blocker: Secure repositories
- Desired: Version control

**Operational Documentation** (LASRE06):
- Source: Section 11.4 (Documentation)
- Blocker: SOP in official repositories

**Operational Resilience** (LASRE07-11, 42-44):
- Source: Sections 10.1, 10.2
- Blocker: Readiness, health checks, HA, load testing, auto-scaling
- Desired: 7x24 maintenance, circuit breakers, retries

**Recovery and Resilience Testing** (LASRE12, 45):
- Source: Section 11.2 (DR)
- Blocker: Documented DRP
- Desired: Chaos testing

**Information and Architecture** (LASRE13-16, 46-47):
- Source: Sections 2.1, 4.1
- Blocker: C2 diagrams, portfolio registration, escalation matrix, observability requests
- Desired: Critical journey identification

**Key Metrics** (LASRE17-19):
- Source: Section 10.2
- Blocker: Availability measurement, performance measurement, threshold configuration

**Backend Application** (LASRE20-22, 48-51):
- Source: Section 11.1
- Blocker: Dynatrace instrumentation, API monitoring, exception handling
- Desired: Labels, external API validation, advanced monitoring, log ingestion

**Frontend Application** (LASRE23, 52):
- Source: Section 11.1
- Blocker: Synthetic validation
- Desired: MFA-free testing

**User Experience** (LASRE24-26):
- Source: Section 11.1
- Blocker: RUM injection, security compatibility, UX monitoring

**Cost Estimation** (LASRE27-28):
- Source: Section 2.5
- Blocker: Dynatrace cost estimation, budget prerequisites

**Infrastructure** (LASRE29-31, 53-54):
- Source: Section 5.2
- Blocker: OneAgent installation, container monitoring, dependency monitoring
- Desired: Cloud tagging, process health detection

**Batch Processing** (LASRE32):
- Source: Section 11.1
- Blocker: Non-Control-M batch monitoring

**Disaster Recovery** (LASRE34-35):
- Source: Section 11.2
- Blocker: DR automation, DR validation automation

**Application Operational Tasks** (LASRE36, 55-56):
- Source: Section 11.3
- Blocker: Service management automation
- Desired: Reporting, data sanitization

**Integration, Deployment and Delivery** (LASRE40-41):
- Source: Section 11.3
- Desired: Canary releases, traffic management

**Auto-remediation** (LASRE57):
- Source: Section 11.3
- Desired: Automated failure remediation

#### Extraction Logic (v2.0)

```python
def extract_sre_architecture_v2(architecture_md):
    """
    Extract 57 LASRE requirements from ARCHITECTURE.md
    Returns contract with compliance status for each requirement
    """
    
    # Initialize contract with 57 requirements
    contract = {
        "version": "2.0",
        "template": "SRE Architecture",
        "requirements": []
    }
    
    # Load section index
    doc_index = parse_document_index(architecture_md)
    
    # Extract from Section 11 (50% of requirements)
    section_11 = load_section(architecture_md, doc_index["11"])
    
    # LASRE01-03: Log Management from 11.1
    logging_data = extract_subsection(section_11, "11.1")
    contract["requirements"].extend([
        assess_requirement("LASRE01", "Structured logging", logging_data, "blocker"),
        assess_requirement("LASRE02", "Log levels", logging_data, "blocker"),
        assess_requirement("LASRE03", "Log accessibility", logging_data, "blocker"),
    ])
    
    # LASRE04: Deployment from 11.3
    deployment_data = extract_subsection(section_11, "11.3")
    contract["requirements"].append(
        assess_requirement("LASRE04", "Rollback mechanisms", deployment_data, "blocker")
    )
    
    # Extract from Section 10 (30% of requirements)
    section_10 = load_section(architecture_md, doc_index["10"])
    
    # LASRE07-11: Resilience from 10.1
    resilience_data = extract_subsection(section_10, "10.1")
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
- Source: ARCHITECTURE.md Section 11.1, lines 1405-1408
- Note: N/A

#### 1.1.2 Validation
**Validation Evidence**: Log parser validates JSON schema
- Status: Compliant
- Explanation: Automated validation in logging pipeline
- Source: ARCHITECTURE.md Section 11.1, line 1410

**Source References**: ARCHITECTURE.md Section 11.1 (Monitoring and Logging)

---

### 1.13 Log Centralization (LASRE37 - Desired)
**Requirement**: Generated logs must be centralized in an analysis or monitoring tool...
**Status**: Compliant
**Responsible Role**: SRE Engineer
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: Splunk centralized logging
- Status: Compliant
- Explanation: All logs aggregated to Splunk with 90-day retention
- Source: ARCHITECTURE.md Section 11.1, line 1412
- Note: N/A

**Source References**: ARCHITECTURE.md Section 11.1

---
```

#### Placeholder Recommendations

**Common Placeholders in Generated Contracts**:

1. **Missing Section 11.1 (Monitoring)**:
   - LASRE20-26, 29-32: Dynatrace instrumentation, monitoring coverage
   - Recommendation: Add observability tool configuration to Section 11.1

2. **Missing Section 11.2 (Incident Management)**:
   - LASRE12, 15, 34-35: DRP, escalation matrix, DR automation
   - Recommendation: Document DR procedures and escalation paths in Section 11.2

3. **Missing Section 11.3 (Deployment)**:
   - LASRE04, 33, 36: Rollback, deployment consistency, service automation
   - Recommendation: Add CI/CD pipeline and deployment automation to Section 11.3

4. **Missing Section 10.1 (Performance)**:
   - LASRE07-11: Readiness, health checks, HA, load testing, auto-scaling
   - Recommendation: Document resilience patterns and performance testing in Section 10.1

5. **Missing Section 4.1 (Architecture)**:
   - LASRE13, 46-47: C2 diagrams, critical journeys
   - Recommendation: Add C2 diagrams and architecture documentation to Section 4.1

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

### Dynamic Section 9 Subsection Discovery (Index-Based)

To dynamically find Section 9 subsections and their line ranges in any ARCHITECTURE.md file:

#### Step 1: Load Document Index and Section 9 Range

```python
# Load Document Index
index_content = Read(file_path="ARCHITECTURE.md", offset=1, limit=50)
doc_index = parse_document_index(index_content)

# Get Section 9 range
section_9_range = doc_index["9"]
# Returns: {"start": 1051, "end": 1250, "name": "Security Considerations"}
```

#### Step 2: Load Section 9 with Buffer

```python
buffer = 20  # Extended buffer for security section
offset = section_9_range["start"] - buffer - 1
limit = (section_9_range["end"] - section_9_range["start"]) + (2 * buffer)

section_9_content = Read(file_path="ARCHITECTURE.md", offset=offset, limit=limit)
```

#### Step 3: Detect All Subsections Within Section 9

```python
import re

# Find all level-3 headers (###) in Section 9
subsection_pattern = r'^###\s+(.+)$'
subsections = []

for match in re.finditer(subsection_pattern, section_9_content, re.MULTILINE):
    subsection_name = match.group(1).strip()
    relative_offset = section_9_content[:match.start()].count('\n')
    absolute_line = section_9_range["start"] + relative_offset

    subsections.append({
        "name": subsection_name,
        "line_start": absolute_line,
        "relative_offset": relative_offset
    })

# Calculate end lines (next subsection start - 1, or section end)
for i, subsection in enumerate(subsections):
    if i + 1 < len(subsections):
        subsection["line_end"] = subsections[i+1]["line_start"] - 1
    else:
        subsection["line_end"] = section_9_range["end"]

# Example result:
# [
#   {"name": "Security Principles", "line_start": 1053, "line_end": 1060},
#   {"name": "Threat Model", "line_start": 1062, "line_end": 1088},
#   {"name": "Authentication & Authorization", "line_start": 1090, "line_end": 1114},
#   {"name": "Network Security", "line_start": 1115, "line_end": 1172},
#   ...
# ]
```

#### Step 4: Generate Section 9 References Dynamically

```python
def generate_section_9_reference(subsection_name, subsection_data):
    """Generate standardized Section 9 reference with line numbers"""
    return (
        f"Section 9 (Security Architecture → {subsection_name}), "
        f"lines {subsection_data['line_start']}-{subsection_data['line_end']}"
    )

# Usage examples:
auth_ref = generate_section_9_reference("Authentication & Authorization", subsections[2])
# Returns: "Section 9 (Security Architecture → Authentication & Authorization), lines 1090-1114"

network_ref = generate_section_9_reference("Network Security", subsections[3])
# Returns: "Section 9 (Security Architecture → Network Security), lines 1115-1172"
```

#### Step 5: Nested Subsection Support

For nested subsections (e.g., "Data Security → Encryption in Transit"):

```python
def find_nested_subsections(section_9_content, parent_subsection_range):
    """Find level-4 headers (####) within a level-3 subsection"""

    # Extract parent subsection content
    parent_start_offset = parent_subsection_range["relative_offset"]
    if parent_subsection_range == subsections[-1]:
        parent_content = section_9_content[parent_start_offset:]
    else:
        next_subsection_offset = subsections[subsections.index(parent_subsection_range) + 1]["relative_offset"]
        parent_content = section_9_content[parent_start_offset:next_subsection_offset]

    # Find level-4 headers
    nested_pattern = r'^####\s+(.+)$'
    nested_subsections = []

    for match in re.finditer(nested_pattern, parent_content, re.MULTILINE):
        nested_name = match.group(1).strip()
        relative_offset = parent_content[:match.start()].count('\n')
        absolute_line = parent_subsection_range["line_start"] + relative_offset

        nested_subsections.append({
            "name": nested_name,
            "line_start": absolute_line,
            "parent": parent_subsection_range["name"]
        })

    # Calculate end lines
    for i, nested in enumerate(nested_subsections):
        if i + 1 < len(nested_subsections):
            nested["line_end"] = nested_subsections[i+1]["line_start"] - 1
        else:
            nested["line_end"] = parent_subsection_range["line_end"]

    return nested_subsections

# Example: Find nested subsections under "Data Security"
data_security_subsection = subsections[4]  # Assuming index 4
nested = find_nested_subsections(section_9_content, data_security_subsection)

# Generate nested reference:
encryption_ref = (
    f"Section 9 (Security Architecture → {data_security_subsection['name']} → "
    f"{nested[0]['name']}), lines {nested[0]['line_start']}-{nested[0]['line_end']}"
)
# Returns: "Section 9 (Security Architecture → Data Security → Encryption in Transit), lines 1168-1172"
```

#### Complete Workflow Example

```python
def extract_section_9_subsections(architecture_md):
    """Complete workflow: Extract all Section 9 subsections with line ranges"""

    # Step 1: Load Document Index
    index = Read(file_path=architecture_md, offset=1, limit=50)
    doc_index = parse_document_index(index)

    # Step 2: Get Section 9 range
    section_9 = doc_index["9"]

    # Step 3: Load Section 9
    buffer = 20
    section_9_content = Read(
        file_path=architecture_md,
        offset=section_9["start"] - buffer - 1,
        limit=(section_9["end"] - section_9["start"]) + (2 * buffer)
    )

    # Step 4: Extract all subsections
    subsections = []
    for match in re.finditer(r'^###\s+(.+)$', section_9_content, re.MULTILINE):
        name = match.group(1).strip()
        offset = section_9_content[:match.start()].count('\n')
        subsections.append({
            "name": name,
            "line_start": section_9["start"] + offset
        })

    # Calculate end lines
    for i, sub in enumerate(subsections):
        sub["line_end"] = (subsections[i+1]["line_start"] - 1
                          if i+1 < len(subsections) else section_9["end"])

    # Step 5: Return structured data
    return {
        "section_9_range": section_9,
        "subsections": subsections,
        "document_index_version": doc_index["last_updated"]
    }

# Usage:
section_9_data = extract_section_9_subsections("ARCHITECTURE.md")

# Generate references dynamically:
for subsection in section_9_data["subsections"]:
    ref = (
        f"Section 9 (Security Architecture → {subsection['name']}), "
        f"lines {subsection['line_start']}-{subsection['line_end']}"
    )
    print(ref)
```

**Benefits of Dynamic Discovery:**
- **Adaptability**: Works with any ARCHITECTURE.md structure
- **Accuracy**: Line numbers always correct via Document Index
- **No Hardcoding**: No need to update mappings when sections change
- **Full Traceability**: Every reference includes exact line ranges

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
Source: Section 10.2
Used in:
- Business Continuity (RTO/RPO justification)
- SRE Architecture (SLO, error budget)
- Cloud Architecture (cloud SLA requirements)
- Platform & IT Infrastructure (infrastructure availability)
- Enterprise Architecture (business criticality)

Extract once: "99.99% SLA"
Cache with source: "Section 10.2, line 1576"
Reuse in all 5 contracts with appropriate transformations
```

**2. Technology Stack (appears in 5 contracts)**
```
Source: Section 8
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
Source: Section 7
Used in:
- Integration Architecture (full catalog)
- Security Architecture (integration security)
- Data & Analytics - AI Architecture (data sources/sinks)

Extract once: All integrations with details
Cache as structured list
Filter by contract focus
```

### Caching Strategy (Index-Based)

```python
# Global cache for cross-contract data with full traceability
contract_data_cache = {}

def extract_with_caching(architecture_md, section_num, subsection_num, pattern, cache_key):
    """Extract data with index-based caching for reuse across contracts"""

    # Check cache first
    if cache_key in contract_data_cache:
        return contract_data_cache[cache_key]

    # Step 1: Load Document Index (if not already cached)
    if "document_index" not in contract_data_cache:
        index_content = Read(file_path=architecture_md, offset=1, limit=50)
        contract_data_cache["document_index"] = parse_document_index(index_content)

    doc_index = contract_data_cache["document_index"]

    # Step 2: Get section range from index
    section_range = doc_index[str(section_num)]

    # Step 3: Find subsection within section
    subsection_pattern = f"^### {section_num}\.{subsection_num}"
    grep_result = grep_subsection(
        file_path=architecture_md,
        pattern=subsection_pattern,
        start_line=section_range["start"],
        end_line=section_range["end"]
    )
    subsection_start = grep_result["line_number"]

    # Find next subsection for boundary
    next_subsection_num = subsection_num + 1
    next_grep_result = grep_subsection(
        pattern=f"^### {section_num}\.{next_subsection_num}",
        start_line=subsection_start,
        end_line=section_range["end"]
    )
    subsection_end = (next_grep_result["line_number"] - 1
                     if next_grep_result else section_range["end"])

    # Step 4: Load subsection with buffer
    buffer = 10
    offset = subsection_start - buffer - 1
    limit = (subsection_end - subsection_start) + (2 * buffer)

    section_content = Read(file_path=architecture_md, offset=offset, limit=limit)

    # Step 5: Extract value with line number tracking
    match = re.search(pattern, section_content)
    if not match:
        return None

    relative_offset = section_content[:match.start()].count('\n')
    absolute_line = subsection_start + relative_offset

    # Cache with enhanced metadata including index-based traceability
    contract_data_cache[cache_key] = {
        "value": match.group(1),
        "source": {
            "section": section_num,
            "subsection": f"{section_num}.{subsection_num}",
            "line_start": absolute_line,
            "line_end": absolute_line + section_content[match.start():match.end()].count('\n'),
            "document_index_version": doc_index["last_updated"]
        },
        "extraction_method": "index_lookup",
        "extracted_at": current_timestamp(),
        "raw_source_string": f"Section {section_num}.{subsection_num}, line {absolute_line}"
    }

    return contract_data_cache[cache_key]

# Usage across contracts with index-based extraction
sla_data = extract_with_caching(
    arch_md,
    section_num=10,
    subsection_num=2,
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

Action (Strict Source Traceability):
1. DO NOT attempt interpretation or inference
2. Flag as [PLACEHOLDER] - data format too ambiguous
3. Request explicit value in completion report

Example:
RTO: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11.3]
Optional Reference: Industry standard for Tier 1 applications: 4 hours RTO (NIST SP 800-34)
Note: Update ARCHITECTURE.md Section 11.3 with explicit RTO value (e.g., "RTO: 4 hours").
Current text "generally within half a business day" is too ambiguous for compliance documentation.
Source: ARCHITECTURE.md Section 11.3, line X (ambiguous format)
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

## Index-Based Mapping Validation Checklist

This checklist ensures full compliance with the index-based section mapping methodology documented in this guide. Use this before generating any compliance documents.

### Document Index Validation

**Index Availability**:
- [ ] Document Index exists in ARCHITECTURE.md (typically lines 5-21)
- [ ] Index contains all 12 standard sections
- [ ] Each section entry includes: section number, name, and line range
- [ ] Index timestamp ("Index Last Updated") is present and recent
- [ ] Index format matches standard template (markdown list with anchors)

**Index Accuracy**:
- [ ] Grep validation: Run `grep -n "^## [0-9]" ARCHITECTURE.md` and compare with index
- [ ] Line ranges are sequential (no overlaps, no gaps)
- [ ] Section 12 ends with "EOF" or actual final line number
- [ ] Index last updated within 30 days (if architecture recently modified)

### Section Loading Validation

**Offset/Limit Parameters**:
- [ ] Every section load uses `Read(offset=X, limit=Y)` format
- [ ] No full-file reads (`Read(file_path)` without offset/limit)
- [ ] Offset calculated as: `section_start - buffer - 1` (zero-indexed)
- [ ] Limit calculated as: `(section_end - section_start) + (2 * buffer)`
- [ ] Buffer sizes appropriate:
  - Minimal extraction (5-10 lines)
  - Standard extraction (10-20 lines)
  - Extended extraction (20-50 lines)

**Section Range Validation**:
- [ ] Document Index loaded first (offset=1, limit=50)
- [ ] Section ranges extracted from parsed index
- [ ] Grep used to find subsection boundaries within sections
- [ ] Subsection end calculated via next subsection start - 1
- [ ] Last subsection ends at parent section end

### Line Number Calculation Validation

**Absolute Line Number Formula**:
- [ ] All line numbers calculated as: `subsection_start + relative_offset`
- [ ] Relative offset calculated via: `content[:match.start()].count('\n')`
- [ ] No hardcoded line numbers in extraction logic
- [ ] Line numbers stored with extracted values for traceability

**Source Reference Format**:
- [ ] All sources follow format: `"Section N.M, line X"` or `"Section N.M, lines X-Y"`
- [ ] Section 9 references use: `"Section 9 (Security Architecture → Subsection Name), lines X-Y"`
- [ ] Source references include subsection names (e.g., "Backup & Recovery", "Availability SLA")
- [ ] Line ranges accurate (extracted value spans declared lines)

### Subsection Detection Validation

**Grep Patterns**:
- [ ] Primary sections detected with: `^## [0-9]`
- [ ] Subsections detected with: `^### N\.M` (escaped dot)
- [ ] Nested subsections (level 4) detected with: `^####`
- [ ] Grep searches constrained to parent section ranges (start_line, end_line)

**Boundary Calculation**:
- [ ] Subsection start: grep match line number
- [ ] Subsection end: next subsection start - 1 (or parent section end)
- [ ] No assumptions about subsection count or structure
- [ ] Dynamic discovery works with variable subsection counts

### Caching and Reuse Validation

**Cache Structure**:
- [ ] Global cache initialized: `contract_data_cache = {}`
- [ ] Document Index cached with key: `"document_index"`
- [ ] Common data points cached (SLA, technology stack, integrations)
- [ ] Cache entries include:
  - `value`: Extracted data
  - `source`: Dict with section, subsection, line_start, line_end
  - `document_index_version`: Timestamp from index
  - `extraction_method`: "index_lookup"
  - `extracted_at`: Current timestamp

**Cache Consistency**:
- [ ] Same cache key returns identical data across contracts
- [ ] Cache hits preserve original line numbers
- [ ] Transformations applied after cache retrieval (not cached)
- [ ] Document Index cached once and reused for all contracts

### Pattern Example Validation

**Dynamic Line Numbers**:
- [ ] Pattern examples use `{subsection_start}+` instead of hardcoded lines
- [ ] Line number calculation steps documented in examples
- [ ] Examples show: Document Index lookup → Grep → Offset calculation
- [ ] Variable syntax explained: `{rto_line}`, `{sla_line}`, etc.

**Calculation Documentation**:
- [ ] Each pattern example includes "Line Number Calculation" section
- [ ] Calculation shows:
  1. Document Index section range
  2. Grep result for subsection
  3. Relative offset calculation
  4. Absolute line number formula
- [ ] Examples demonstrate buffer usage

### Extraction Logic Validation

**Pseudo-Code Structure**:
- [ ] All extraction functions start with: Load Document Index
- [ ] Section ranges retrieved from parsed index (not hardcoded)
- [ ] Grep used to find subsections dynamically
- [ ] Offset/limit calculated for each Read operation
- [ ] Line number tracking implemented for all extractions
- [ ] Return values include `document_index_version`

**No Old-Style References**:
- [ ] No `load_section(architecture_md, section=11.3)` calls
- [ ] No `get_line_number(value)` calls (use offset calculation)
- [ ] No assumptions about section line numbers
- [ ] All section discovery via Document Index + Grep

### Context Efficiency Validation

**Token Usage Optimization**:
- [ ] Document Index loaded once (50 lines)
- [ ] Sections loaded individually (100-300 lines each)
- [ ] Subsections loaded when possible (30-100 lines)
- [ ] No full-file reads (avoid loading 2000+ lines)
- [ ] Efficiency target: 70-94% reduction vs full file read

**Loading Hierarchy**:
- [ ] Level 1: Document Index (always first)
- [ ] Level 2: Full section (when multiple subsections needed)
- [ ] Level 3: Single subsection (when targeted extraction)
- [ ] Level 4: Grep + minimal buffer (for single values)

### Cross-Contract Consistency Validation

**Shared Data Points**:
- [ ] Availability SLA: Same value in all 6 contracts (Business Continuity v2.0, SRE, Cloud, Platform, Enterprise, Risk)
  - Business Continuity v2.0: Referenced in LACN006 (HA Requirement), extracted from Section 10
  - SRE Architecture: Used for SLO and error budget calculation
  - Cloud Architecture: Cloud SLA requirements
  - All contracts must show identical value and source line number
- [ ] Technology Stack: Same inventory in 5 contracts (Development, Cloud, Platform, Integration, Security)
- [ ] Integration Catalog: Same list in 3 contracts (Integration, Security, Data/AI)
- [ ] Same line numbers for same data across all contracts

**Transformation Consistency**:
- [ ] Error budget calculation: Same formula in SRE and Business Continuity v2.0
  - Formula: Error Budget = (1 - SLA%) × Time Period
  - Example: 99.95% SLA → 0.05% × 30 days × 24 hours = 21.6 minutes/month
  - Business Continuity: Validates RTO aligns with error budget
  - SRE Architecture: Uses for operational targets and alerting thresholds
- [ ] Downtime calculation: Same formula across all contracts
- [ ] Criticality inference: Same rules (99.99% → Tier 1)
- [ ] All transformations documented and replicable

### Section 9 Special Handling

**Dynamic Discovery**:
- [ ] Section 9 subsections discovered via regex `^###\s+(.+)$`
- [ ] Nested subsections (level 4) detected when present
- [ ] No hardcoded subsection names or line numbers
- [ ] Reference format: `Section 9 (Security Architecture → Subsection), lines X-Y`

**Validation**:
- [ ] No references to "Section 9.1", "9.2", "9.3" (numbered subsections)
- [ ] All Section 9 references include subsection path
- [ ] Line numbers point to actual subsection content
- [ ] Nested subsections formatted as: `Parent → Child`

### Implementation Checklist

Before generating compliance documents:

**Preparation**:
- [ ] ARCHITECTURE.md has valid Document Index
- [ ] Index timestamp is current
- [ ] All 12 sections present in ARCHITECTURE.md
- [ ] Grep tool available for subsection detection

**Execution**:
- [ ] Load Document Index first
- [ ] Parse index to extract section ranges
- [ ] Use index-based loading for all sections
- [ ] Calculate line numbers for all extracted values
- [ ] Cache common data points with full metadata

**Validation**:
- [ ] All source references include line numbers
- [ ] Line numbers verified against ARCHITECTURE.md
- [ ] Cross-contract data has identical line numbers
- [ ] No hardcoded assumptions about document structure

**Output Quality**:
- [ ] Every contract section has source traceability
- [ ] Line ranges are accurate and verifiable
- [ ] Document Index version included in metadata
- [ ] Extraction method documented (index_lookup)

---

## Conclusion

This mapping guide provides the foundation for extracting compliance data from ARCHITECTURE.md efficiently and accurately. By following these patterns and using context-efficient loading strategies, you can generate comprehensive compliance documents with minimal manual effort and high traceability.

For complete contract structures and additional examples, refer to:
- **COMPLIANCE_GENERATION_GUIDE.md**: Full methodology and contract descriptions
- **templates/**: Template files for each contract type
- **contracts/CONTRACT_TYPES_REFERENCE.md**: Organizational standards and requirements