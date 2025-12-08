# Compliance Contract: SRE Architecture (Site Reliability Engineering)

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 10, 11)
**Version**: 1.0

---

## Document Control

| Field | Value |
|-------|-------|
| Document Owner | [SOLUTION_ARCHITECT or N/A] |
| Last Review Date | [GENERATION_DATE] |
| Next Review Date | [NEXT_REVIEW_DATE] |
| Status | [DOCUMENT_STATUS] |
| Validation Score | [VALIDATION_SCORE]/10 |
| Validation Status | [VALIDATION_STATUS] |
| Validation Date | [VALIDATION_DATE] |
| Validation Evaluator | [VALIDATION_EVALUATOR] |
| Review Actor | [REVIEW_ACTOR] |
| Approval Authority | [APPROVAL_AUTHORITY] |

**Validation Configuration**: `/skills/architecture-compliance/validation/sre_architecture_validation.json`

**Dynamic Field Instructions for Document Generation**:

- `[DOCUMENT_STATUS]`: Determined by validation_results.outcome.document_status
  - Score 8.5-10.0 → "Approved" (auto-approved)
  - Score 7.0-8.4 → "In Review" (ready for manual review)
  - Score 5.0-6.9 → "Draft" (needs work)
  - Score 0.0-4.9 → "Rejected" (blocked)

- `[VALIDATION_SCORE]`: From validation_results.final_score (format: "8.7/10")

- `[VALIDATION_STATUS]`: From validation_results.outcome.overall_status
  - "PASS" (score ≥ 7.0)
  - "CONDITIONAL" (score 5.0-6.9)
  - "FAIL" (score < 5.0)

- `[VALIDATION_DATE]`: From validation_results.validation_date → "YYYY-MM-DD" or "Not performed"

- `[VALIDATION_EVALUATOR]`: "Claude Code (Automated Validation Engine)"

- `[REVIEW_ACTOR]`: From validation_results.outcome.review_actor
  - Score 8.5-10.0 → "System (Auto-Approved)"
  - Score 7.0-8.4 → "SRE Leadership/Operations"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

- `[APPROVAL_AUTHORITY]`: "SRE Leadership/Operations"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.5-10.0: Automatic approval (no human review required)
- Score 7.0-8.4: Manual review by SRE Leadership/Operations required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

---

## 1. Service Level Objectives (SLOs)

### 1.1 Availability SLO
**Objective**: [EXTRACTED: Availability SLO from Section 10.2]
**Error Budget**: [CALCULATED: Error budget from SLA]
**Measurement Window**: Monthly
**Measurement Method**: [EXTRACTED or PLACEHOLDER]
**Source**: [SOURCE_REFERENCE]

### 1.2 Latency SLOs
| Percentile | Objective | Measurement Method | Source |
|------------|-----------|-------------------|--------|
| p50 | [EXTRACTED from Section 10.1] | [METHOD] | [SOURCE_REFERENCE] |
| p95 | [EXTRACTED from Section 10.1] | [METHOD] | [SOURCE_REFERENCE] |
| p99 | [EXTRACTED from Section 10.1] | [METHOD] | [SOURCE_REFERENCE] |

**Alert Threshold**: [PLACEHOLDER: Define alert threshold (e.g.: p95 > 110ms)]

### 1.3 Throughput SLOs
**Design Capacity**: [EXTRACTED: Design capacity TPS from Section 10.1]
**Peak Capacity**: [EXTRACTED: Peak capacity TPS]
**Capacity Margin**: [CALCULATED: Peak - Design]
**Source**: [SOURCE_REFERENCE]

---

## 2. Service Level Indicators (SLIs)

### 2.1 Availability Indicators
[PLACEHOLDER: User must provide organizational format for SLIs]

**Monitored Components**:
- [EXTRACTED: List of components from Section 5]

### 2.2 Performance Indicators
[PLACEHOLDER: User must provide organizational format]

---

## 3. Error Budget

### 3.1 Monthly Error Budget
**SLA**: [EXTRACTED from Section 10.2]
**Error Budget**: [CALCULATED: Error budget in minutes/month]
**Calculation**: (100% - SLA) × 43,200 min = [VALUE] min/month

### 3.2 Budget Usage
| Period | Allowed Downtime | Current Usage | Remaining |
|--------|------------------|---------------|-----------|
| This Month | [CALCULATED] min | [PLACEHOLDER: Add from monitoring] | [PLACEHOLDER] |
| Previous Month | [CALCULATED] min | [PLACEHOLDER: Add historical data] | [PLACEHOLDER] |

**Error Budget Policy**: [PLACEHOLDER: Define policy when budget is exhausted]

---

## 4. Monitoring and Observability

### 4.1 Observability Stack
**Metrics Collection**: [EXTRACTED: Metrics tool from Section 11.1]
**Visualization**: [EXTRACTED: Visualization tool from Section 11.1]
**Log Aggregation**: [EXTRACTED: Logging tool from Section 11.1]
**Distributed Tracing**: [EXTRACTED: Tracing tool from Section 11.1]
**Alerting Platform**: [EXTRACTED: Alerting platform from Section 11.1]
**Source**: [SOURCE_REFERENCE]

### 4.2 Key Monitored Metrics
- Latency (p50, p95, p99)
- Throughput (requests/sec)
- Error rate (%)
- Availability (uptime %)
- Resource utilization (CPU, memory, disk)

**Dashboard Links**: [PLACEHOLDER: Add Grafana dashboard URLs]

### 4.3 Alert Configuration
[PLACEHOLDER: User must provide specific alert configuration]

---

## 5. Incident Management

### 5.1 Incident Classification
[EXTRACTED from Section 11.2 or PLACEHOLDER]

| Priority | Description | Response SLA | Escalation |
|----------|-------------|--------------|------------|
| P1 | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] |
| P2 | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] |
| P3 | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] |

**Source**: [SOURCE_REFERENCE or "PLACEHOLDER: Add to ARCHITECTURE.md Section 11.2"]

### 5.2 Incident Response
**Alerting Platform**: [EXTRACTED from Section 11.1 or 11.2]
**Incident Commander**: [EXTRACTED or PLACEHOLDER: Define Incident Commander role]
**Communication Channel**: [PLACEHOLDER: Add Slack channel or tool]

### 5.3 Escalation Path
[EXTRACTED from Section 11.2 or PLACEHOLDER]

1. **L1** (0-5 min): [ROLE] performs triage
2. **L2** (5-15 min): [ROLE] engages
3. **L3** (15-30 min): [ROLE] + [ROLE]

### 5.4 Postmortem Requirements
**Required For**: [EXTRACTED or PLACEHOLDER: All P1 and P2 incidents]
**Timeline**: [PLACEHOLDER: Within 48 hours of resolution]
**Distribution**: [PLACEHOLDER: Engineering team, stakeholders]
**Template**: [PLACEHOLDER: Link to postmortem template]

---

## 6. Capacity Planning

### 6.1 Current Capacity
**Design Capacity**: [EXTRACTED from Section 10.1]
**Peak Capacity**: [EXTRACTED from Section 10.1]
**Current Utilization**: [PLACEHOLDER: Add from monitoring]

### 6.2 Growth Projections
[PLACEHOLDER: User must provide growth projections]

### 6.3 Scaling Thresholds
[PLACEHOLDER: Define auto-scaling thresholds]

---

## 7. On-Call Management

### 7.1 On-Call Rotation
**Rotation Schedule**: [PLACEHOLDER: Define schedule (e.g.: 7 days, 24/7)]
**Coverage**: [PLACEHOLDER: Primary + Secondary]
**Calendar**: [PLACEHOLDER: Link to on-call calendar]

### 7.2 Incident Response Team Contacts
[PLACEHOLDER: Add incident response team contacts]

### 7.3 Operational Runbooks
**Repository**: [PLACEHOLDER: Runbook repository location]
**Required Runbooks**:
- Deployment
- Rollback
- Incident response
- [PLACEHOLDER: Other specific runbooks]

---

## 8. SRE Architecture Guidelines

### 8.1 Resilience Assessment
[PLACEHOLDER: User must provide specific organizational guidelines]

**Key Guidelines**:
- Component resilience assessment
- Critical component observability
- Self-healing capability
- [PLACEHOLDER: Other organizational guidelines]

### 8.2 Compliance
**Compliance Status**: [PLACEHOLDER: Assess compliance]
**Exceptions**: [PLACEHOLDER: Document exceptions]
**Remediation Plan**: [PLACEHOLDER: If applicable]

---

## Appendix: Source Traceability

### Data Sources

Data extracted from ARCHITECTURE.md:

**Section 10: Performance Requirements**
- [SOURCE_REFERENCE]: [DESCRIPTION of extracted data]

**Section 11: Operational Considerations**
- [SOURCE_REFERENCE]: [DESCRIPTION of extracted data]

### Missing Data

The following data requires manual review (marked with [PLACEHOLDER]):

1. [LIST of placeholder items from generation]
2. [...]

### Recommendations for ARCHITECTURE.md

To reduce placeholders in future generations, add to ARCHITECTURE.md:

1. **Section 11.2: Incident Management**
   - On-call team contacts
   - Rotation schedule
   - Escalation procedures

2. **Section 11.4: Operational Runbooks**
   - Runbook repository location
   - List of key runbooks

---

**Last Generated**: [GENERATION_DATE]
**Completeness**: [PERCENTAGE]% ([FILLED]/[TOTAL] data points)
**Action Required**: Review and complete [COUNT] sections marked with [PLACEHOLDER]