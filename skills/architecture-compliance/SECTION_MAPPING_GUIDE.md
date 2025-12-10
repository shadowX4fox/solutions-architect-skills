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
| **1. Business Continuity** | 11 | 10 | Medium | High (#2) |
| **2. SRE Architecture** | 10, 11 | 5 | High | High (#1) |
| **3. Cloud Architecture** | 4, 8, 11 | 9, 10 | High | Medium (#3) |
| **4. Data & Analytics - AI Architecture** | 5, 6, 7 | 8, 10 | High | Medium (#4) |
| **5. Development Architecture** | 3, 5, 8, 12 | 11 | Medium | Medium (#5) |
| **6. Transformación Procesos** | 1, 2, 6 | 5, 7 | Low | Low (#6) |
| **7. Security Architecture v2.0** | 4, 5, 7, 9, 11 | - | High | High (#7) |
| **8. Plataformas Infraestructura** | 4, 8, 11 | 10 | Medium | Medium (#8) |
| **9. Enterprise Architecture** | 1, 2, 3, 4 | 12 | Medium | Medium (#9) |
| **10. Integration Architecture v2.0** | 5, 6, 7, 9 | - | High | High (#10) |
| **11. Risk Management** | 9, 10, 11, 12 | 1, 5 | High | High (#4) |

---

## Detailed Contract Mappings

### Contract 1: Business Continuity (Business Continuity)

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
ARCHITECTURE.md Input (Section 11.3, lines {subsection_start}+):
"Backup Strategy:
- Incremental backups: Daily at 2 AM UTC
- Full backups: Weekly on Sunday
- Retention: 30 days (incremental), 12 months (full)
- Storage: AWS S3 (primary), Glacier (long-term)
- RTO: 4 hours
- RPO: 1 hour"

Line Number Calculation:
1. Document Index: Section 11 (Operational Considerations) → Lines 1401-1650
2. Grep within Section 11: "^### 11\.3" found at line 1523
3. subsection_start = 1523
4. Extract RTO at relative offset +5 → absolute line 1528 (1523 + 5)
5. Extract RPO at relative offset +6 → absolute line 1529 (1523 + 6)

Contract Output:
## 1. Recovery Objectives
**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 1 hour
**Business Criticality**: Tier 1 (inferred from RTO)
**Source**: ARCHITECTURE.md Section 11.3 (Backup & Recovery), lines {rto_line}-{rpo_line}

## 2. Backup Strategy
| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Incremental | Daily (2 AM UTC) | 30 days | AWS S3 |
| Full | Weekly (Sunday) | 12 months | AWS S3 + Glacier |

**Backup Testing**: [PLACEHOLDER: Add backup restoration test schedule]
**Source**: ARCHITECTURE.md Section 11.3 (Backup & Recovery), lines {subsection_start}-{subsection_start + 3}
```

##### Subsection 11.4: Disaster Recovery
**Extract**: DR procedures, failover mechanisms, geographic redundancy
**Transform to**: Contract Section 3 (DR Procedures)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 11.4, lines {subsection_start}+):
"Disaster Recovery:
- DR Site: AWS us-west-2 (primary: us-east-1)
- Failover: Automated via Route 53 health checks
- RTO Target: 4 hours
- DR Drills: Quarterly"

Line Number Calculation:
1. Document Index: Section 11 → Lines 1401-1650
2. Grep for "^### 11\.4" within Section 11 → line 1575
3. subsection_start = 1575
4. DR details span lines 1575-1579 (subsection header + 4 lines)

Contract Output:
## 3. Disaster Recovery
**Primary Site**: AWS us-east-1
**DR Site**: AWS us-west-2
**Failover Mechanism**: Automated via Route 53 health checks
**RTO Target**: 4 hours
**DR Testing**: Quarterly drills
**Last DR Test**: [PLACEHOLDER: Add last DR drill date and results]
**Source**: ARCHITECTURE.md Section 11.4 (Disaster Recovery), lines {subsection_start}-{subsection_start + 4}
```

**Secondary Source: Section 10 (Performance Requirements) - 20%**

##### Subsection 10.2: Availability SLA
**Extract**: Availability requirements, downtime tolerance
**Transform to**: Contract Section 4 (Business Impact)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 10.2, lines {subsection_start}+):
"Availability SLA: 99.99% uptime"

Line Number Calculation:
1. Document Index: Section 10 (Performance Requirements) → Lines 1251-1400
2. Grep for "^### 10\.2" within Section 10 → line 1305
3. SLA value found at relative offset +2 → absolute line 1307 (1305 + 2)

Contract Output:
## 4. Business Impact Analysis
**Availability Requirement**: 99.99% uptime
**Allowable Downtime**: 43.2 minutes/month (calculated from SLA)
**Business Criticality**: Tier 1 (Mission Critical - inferred from 99.99% SLA)
**Estimated Downtime Cost**: [PLACEHOLDER: Add hourly revenue impact]
**Source**: ARCHITECTURE.md Section 10.2 (Availability SLA), line {sla_line}
```

#### Extraction Logic (Pseudo-code)
```python
def extract_business_continuity(architecture_md):
    # Step 1: Load Document Index
    index_content = Read(file_path=architecture_md, offset=1, limit=50)
    doc_index = parse_document_index(index_content)
    # Returns: {"11": {"start": 1401, "end": 1650, ...}, "10": {"start": 1251, "end": 1400, ...}}

    # Step 2: Get Section 11 range
    section_11_range = doc_index["11"]
    # Returns: {"start": 1401, "end": 1650, "name": "Operational Considerations"}

    # Step 3: Find Subsection 11.3 (Backup & Recovery) within Section 11
    grep_result_11_3 = grep_subsection(
        file_path=architecture_md,
        pattern="^### 11\.3",
        start_line=section_11_range["start"],
        end_line=section_11_range["end"]
    )
    subsection_11_3_start = grep_result_11_3["line_number"]  # e.g., 1523

    # Find next subsection to determine end boundary
    grep_result_11_4 = grep_subsection(
        pattern="^### 11\.4",
        start_line=subsection_11_3_start,
        end_line=section_11_range["end"]
    )
    subsection_11_3_end = grep_result_11_4["line_number"] - 1  # e.g., 1574

    # Step 4: Calculate load parameters for Section 11.3
    buffer = 10
    offset_11_3 = subsection_11_3_start - buffer - 1  # e.g., 1512
    limit_11_3 = (subsection_11_3_end - subsection_11_3_start) + (2 * buffer)  # e.g., 71

    # Step 5: Load Section 11.3 with buffer
    backup_section = Read(
        file_path=architecture_md,
        offset=offset_11_3,
        limit=limit_11_3
    )

    # Step 6: Extract RTO/RPO with line number tracking
    rto_match = re.search(r'RTO:?\s*([0-9]+\s*hours?)', backup_section)
    rpo_match = re.search(r'RPO:?\s*([0-9]+\s*hours?)', backup_section)

    rto_data = {}
    if rto_match:
        relative_offset = backup_section[:rto_match.start()].count('\n')
        rto_data = {
            "value": rto_match.group(1),
            "line": subsection_11_3_start + relative_offset,
            "source": f"Section 11.3, line {subsection_11_3_start + relative_offset}"
        }

    rpo_data = {}
    if rpo_match:
        relative_offset = backup_section[:rpo_match.start()].count('\n')
        rpo_data = {
            "value": rpo_match.group(1),
            "line": subsection_11_3_start + relative_offset,
            "source": f"Section 11.3, line {subsection_11_3_start + relative_offset}"
        }

    # Extract backup details
    backup_frequency = extract_with_line_tracking(
        backup_section,
        pattern=r"Incremental.*:\s*(.+)",
        subsection_start=subsection_11_3_start
    )
    retention = extract_with_line_tracking(
        backup_section,
        pattern=r"Retention:\s*(.+)",
        subsection_start=subsection_11_3_start
    )

    # Step 7: Load Section 11.4 (Disaster Recovery) using same methodology
    subsection_11_4_start = grep_result_11_4["line_number"]  # e.g., 1575

    # Find next subsection (11.5 or section end)
    grep_result_11_5 = grep_subsection(
        pattern="^### 11\.5",
        start_line=subsection_11_4_start,
        end_line=section_11_range["end"]
    )
    subsection_11_4_end = (grep_result_11_5["line_number"] - 1
                           if grep_result_11_5 else section_11_range["end"])

    offset_11_4 = subsection_11_4_start - buffer - 1
    limit_11_4 = (subsection_11_4_end - subsection_11_4_start) + (2 * buffer)

    dr_section = Read(file_path=architecture_md, offset=offset_11_4, limit=limit_11_4)

    # Extract DR details
    dr_site = extract_with_line_tracking(dr_section, r"DR Site:\s*(.+)", subsection_11_4_start)
    failover = extract_with_line_tracking(dr_section, r"Failover:\s*(.+)", subsection_11_4_start)

    # Step 8: Load Section 10.2 (Availability SLA)
    section_10_range = doc_index["10"]
    grep_result_10_2 = grep_subsection(
        pattern="^### 10\.2",
        start_line=section_10_range["start"],
        end_line=section_10_range["end"]
    )
    subsection_10_2_start = grep_result_10_2["line_number"]

    # Find next subsection for boundary
    grep_result_10_3 = grep_subsection(
        pattern="^### 10\.3",
        start_line=subsection_10_2_start,
        end_line=section_10_range["end"]
    )
    subsection_10_2_end = (grep_result_10_3["line_number"] - 1
                           if grep_result_10_3 else section_10_range["end"])

    offset_10_2 = subsection_10_2_start - buffer - 1
    limit_10_2 = (subsection_10_2_end - subsection_10_2_start) + (2 * buffer)

    perf_section = Read(file_path=architecture_md, offset=offset_10_2, limit=limit_10_2)

    # Extract SLA with transformation
    sla_match = re.search(r'SLA:?\s*([0-9.]+%)', perf_section)
    sla_data = {}
    if sla_match:
        relative_offset = perf_section[:sla_match.start()].count('\n')
        sla_value = sla_match.group(1)
        sla_data = {
            "value": sla_value,
            "line": subsection_10_2_start + relative_offset,
            "source": f"Section 10.2, line {subsection_10_2_start + relative_offset}",
            "downtime": calculate_downtime(sla_value),  # Transformation
            "criticality": infer_criticality(sla_value)  # Inference
        }

    # Return structured data with full traceability
    return {
        "rto": rto_data,
        "rpo": rpo_data,
        "backup_frequency": backup_frequency,
        "retention": retention,
        "dr_site": dr_site,
        "failover": failover,
        "sla": sla_data,
        "document_index_version": doc_index["last_updated"]
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

### Contract 2: SRE Architecture (Site Reliability Engineering)

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
ARCHITECTURE.md Input (Section 10.1, lines {subsection_start}+):
"Performance Targets:
- p50 latency: < 50ms
- p95 latency: < 100ms
- p99 latency: < 200ms
- Throughput: 450 TPS (design capacity)
- Peak capacity: 1000 TPS"

Line Number Calculation:
1. Document Index: Section 10 (Performance Requirements) → Lines 1251-1400
2. Grep for "^### 10\.1" within Section 10 → line 1253
3. subsection_start = 1253
4. p50 latency at relative offset +2 → absolute line 1255
5. p95 latency at relative offset +3 → absolute line 1256
6. p99 latency at relative offset +4 → absolute line 1257

Contract Output:
## 1. Service Level Objectives (SLOs)

### 1.1 Latency SLOs
| Percentile | Target | Measurement Method | Source |
|------------|--------|-------------------|--------|
| p50 | < 50ms | API response time | Section 10.1, line {p50_line} |
| p95 | < 100ms | API response time | Section 10.1, line {p95_line} |
| p99 | < 200ms | API response time | Section 10.1, line {p99_line} |

**Monitoring Tool**: [PLACEHOLDER: Specify monitoring tool]
**Alert Threshold**: p95 > 110ms (10% over target)

### 1.2 Throughput SLOs
**Design Capacity**: 450 TPS
**Peak Capacity**: 1,000 TPS (2.2× design)
**Headroom**: 550 TPS (122% over design)
**Source**: ARCHITECTURE.md Section 10.1, lines {throughput_line_start}-{throughput_line_end}
```

##### Subsection 10.2: Availability SLA
**Extract**: Uptime requirements
**Transform to**: Contract Sections 1.3 (Availability SLO) & 3 (Error Budget)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 10.2, lines {subsection_start}+):
"Availability SLA: 99.99% uptime"

Line Number Calculation:
1. Document Index: Section 10 → Lines 1251-1400
2. Grep for "^### 10\.2" within Section 10 → line 1305
3. subsection_start = 1305
4. SLA value at relative offset +2 → absolute line 1307

Contract Output:
### 1.3 Availability SLO
**Target**: 99.99% uptime
**Measurement Window**: Monthly
**Measurement Method**: Uptime monitoring (synthetic checks every 60s)
**Source**: ARCHITECTURE.md Section 10.2 (Availability SLA), line {sla_line}

## 3. Error Budgets

### 3.1 Monthly Error Budget
**SLA**: 99.99%
**Error Budget**: 43.2 minutes/month (calculated from SLA)
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
ARCHITECTURE.md Input (Section 11.1, lines {subsection_start}+):
"Monitoring:
- Metrics: Prometheus
- Visualization: Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
- Tracing: Jaeger
- Alerting: PagerDuty"

Line Number Calculation:
1. Document Index: Section 11 (Operational Considerations) → Lines 1401-1650
2. Grep for "^### 11\.1" within Section 11 → line 1405
3. subsection_start = 1405
4. Monitoring tools span lines 1405-1410

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
**Source**: ARCHITECTURE.md Section 11.1 (Monitoring and Logging), lines {subsection_start}-{subsection_start + 5}
```

##### Subsection 11.2: Incident Management
**Extract**: Incident response procedures, escalation paths
**Transform to**: Contract Section 5 (Incident Management)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 11.2, lines {subsection_start}+):
"Incident Management:
- Alerting: PagerDuty
- Response SLA: P1 < 15 min, P2 < 1 hour, P3 < 4 hours
- Escalation: L1 (5 min) → L2 (15 min) → L3 (30 min)
- Postmortems: Required for all P1/P2 incidents
- Incident Commander: On-call SRE"

Line Number Calculation:
1. Document Index: Section 11 → Lines 1401-1650
2. Grep for "^### 11\.2" within Section 11 → line 1458
3. subsection_start = 1458
4. Incident management details span lines 1458-1468

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

**Source**: ARCHITECTURE.md Section 11.2 (Incident Management), lines {subsection_start}-{subsection_start + 10}
```

**Secondary Source: Section 5 (System Components) - 10%**

##### Component-Level Reliability
**Extract**: Component redundancy, failover
**Transform to**: Contract Section 2 (SLIs)

**Pattern Example**:
```
ARCHITECTURE.md Input (Section 5.2, lines {subsection_start}+):
"API Gateway: NGINX (3 instances, load balanced)"

Line Number Calculation:
1. Document Index: Section 5 (System Components) → Lines 451-600
2. Grep for "^### 5\.2" within Section 5 → line 475
3. Component details at relative offset +3 → absolute line 478

Contract Output:
## 2. Service Level Indicators (SLIs)

### 2.1 Component Availability
| Component | Redundancy | Monitoring Method | Target |
|-----------|------------|-------------------|--------|
| API Gateway | 3 instances (NGINX) | Health checks | 99.99% |
| [Other components...] | [...] | [...] | [...] |

**Source**: ARCHITECTURE.md Section 5.2 (API Gateway), line {component_line}
```

#### Extraction Logic (Pseudo-code)
```python
def extract_sre_architecture(architecture_md):
    # Step 1: Load Document Index
    index_content = Read(file_path=architecture_md, offset=1, limit=50)
    doc_index = parse_document_index(index_content)

    # Step 2: Load Section 10.1 (Performance Metrics)
    section_10_range = doc_index["10"]
    grep_result_10_1 = grep_subsection(
        pattern="^### 10\.1",
        start_line=section_10_range["start"],
        end_line=section_10_range["end"]
    )
    subsection_10_1_start = grep_result_10_1["line_number"]

    # Find next subsection
    grep_result_10_2 = grep_subsection(
        pattern="^### 10\.2",
        start_line=subsection_10_1_start,
        end_line=section_10_range["end"]
    )
    subsection_10_1_end = grep_result_10_2["line_number"] - 1

    # Load Section 10.1 with buffer
    buffer = 10
    perf_section = Read(
        file_path=architecture_md,
        offset=subsection_10_1_start - buffer - 1,
        limit=(subsection_10_1_end - subsection_10_1_start) + (2 * buffer)
    )

    # Extract latency SLOs with line tracking
    p50_match = re.search(r'p50.*:<\s*([0-9]+ms)', perf_section)
    p95_match = re.search(r'p95.*:<\s*([0-9]+ms)', perf_section)
    p99_match = re.search(r'p99.*:<\s*([0-9]+ms)', perf_section)

    latency_slos = {}
    if p50_match:
        offset = perf_section[:p50_match.start()].count('\n')
        latency_slos["p50"] = {
            "value": p50_match.group(1),
            "line": subsection_10_1_start + offset,
            "source": f"Section 10.1, line {subsection_10_1_start + offset}"
        }

    if p95_match:
        offset = perf_section[:p95_match.start()].count('\n')
        latency_slos["p95"] = {
            "value": p95_match.group(1),
            "line": subsection_10_1_start + offset,
            "source": f"Section 10.1, line {subsection_10_1_start + offset}"
        }

    if p99_match:
        offset = perf_section[:p99_match.start()].count('\n')
        latency_slos["p99"] = {
            "value": p99_match.group(1),
            "line": subsection_10_1_start + offset,
            "source": f"Section 10.1, line {subsection_10_1_start + offset}"
        }

    # Step 3: Load Section 10.2 (Availability)
    subsection_10_2_start = grep_result_10_2["line_number"]
    grep_result_10_3 = grep_subsection(
        pattern="^### 10\.3",
        start_line=subsection_10_2_start,
        end_line=section_10_range["end"]
    )
    subsection_10_2_end = (grep_result_10_3["line_number"] - 1
                           if grep_result_10_3 else section_10_range["end"])

    avail_section = Read(
        file_path=architecture_md,
        offset=subsection_10_2_start - buffer - 1,
        limit=(subsection_10_2_end - subsection_10_2_start) + (2 * buffer)
    )

    # Extract SLA with transformation
    sla_match = re.search(r'SLA:?\s*([0-9.]+%)', avail_section)
    sla_data = {}
    if sla_match:
        offset = avail_section[:sla_match.start()].count('\n')
        sla_value = sla_match.group(1)
        sla_data = {
            "value": sla_value,
            "line": subsection_10_2_start + offset,
            "source": f"Section 10.2, line {subsection_10_2_start + offset}",
            "error_budget": calculate_error_budget(sla_value)
        }

    # Step 4: Load Section 11.1 (Monitoring)
    section_11_range = doc_index["11"]
    grep_result_11_1 = grep_subsection(
        pattern="^### 11\.1",
        start_line=section_11_range["start"],
        end_line=section_11_range["end"]
    )
    subsection_11_1_start = grep_result_11_1["line_number"]

    grep_result_11_2 = grep_subsection(
        pattern="^### 11\.2",
        start_line=subsection_11_1_start,
        end_line=section_11_range["end"]
    )
    subsection_11_1_end = grep_result_11_2["line_number"] - 1

    monitor_section = Read(
        file_path=architecture_md,
        offset=subsection_11_1_start - buffer - 1,
        limit=(subsection_11_1_end - subsection_11_1_start) + (2 * buffer)
    )

    # Extract monitoring tools (Aggregation)
    monitoring_tools = {
        "metrics": extract_with_line_tracking(monitor_section, r"Metrics:\s*(.+)", subsection_11_1_start),
        "visualization": extract_with_line_tracking(monitor_section, r"Visualization:\s*(.+)", subsection_11_1_start),
        "logging": extract_with_line_tracking(monitor_section, r"Logging:\s*(.+)", subsection_11_1_start)
    }

    # Step 5: Load Section 11.2 (Incidents)
    subsection_11_2_start = grep_result_11_2["line_number"]
    grep_result_11_3 = grep_subsection(
        pattern="^### 11\.3",
        start_line=subsection_11_2_start,
        end_line=section_11_range["end"]
    )
    subsection_11_2_end = grep_result_11_3["line_number"] - 1

    incident_section = Read(
        file_path=architecture_md,
        offset=subsection_11_2_start - buffer - 1,
        limit=(subsection_11_2_end - subsection_11_2_start) + (2 * buffer)
    )

    # Extract incident SLAs
    p1_response = extract_with_line_tracking(incident_section, r"P1.*<\s*([0-9]+\s*min)", subsection_11_2_start)

    # Return structured data with full traceability
    return {
        "latency_slos": latency_slos,
        "availability_slo": sla_data,
        "monitoring": monitoring_tools,
        "incident_response": {"p1": p1_response},
        "document_index_version": doc_index["last_updated"]
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
| TEMPLATE_RISK_MANAGEMENT.md | Implicit references | ⚠️ Needs review |

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
- Requirement: CloudEvents specification with schema registry for event-driven integrations

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
- Business Continuity (RTO/RPO justification)
- SRE Architecture (SLO, error budget)
- Cloud Architecture (cloud SLA requirements)
- Plataformas Infraestructura (infrastructure availability)
- Enterprise Architecture (business criticality)
- Risk Management (availability risks)

Extract once: "99.99% SLA"
Cache with source: "Section 10.2, line 1576"
Reuse in all 6 contracts with appropriate transformations
```

**2. Technology Stack (appears in 5 contracts)**
```
Source: Section 8
Used in:
- Development Architecture (technology choices)
- Cloud Architecture (cloud services)
- Plataformas Infraestructura (infrastructure tech)
- Arquitectura Integración (integration tech)
- Security Architecture (security tools)

Extract once: Full technology inventory
Cache as structured data
Apply different filters per contract
```

**3. Integration Catalog (appears in 3 contracts)**
```
Source: Section 7
Used in:
- Arquitectura Integración (full catalog)
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
- [ ] Availability SLA: Same value in all 6 contracts (Business Continuity, SRE, Cloud, Platform, Enterprise, Risk)
- [ ] Technology Stack: Same inventory in 5 contracts (Development, Cloud, Platform, Integration, Security)
- [ ] Integration Catalog: Same list in 3 contracts (Integration, Security, Data/AI)
- [ ] Same line numbers for same data across all contracts

**Transformation Consistency**:
- [ ] Error budget calculation: Same formula in SRE and Business Continuity
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