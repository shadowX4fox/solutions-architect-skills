# Compliance Contract: Business Continuity

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 10, 11)
**Version**: 1.0

---

<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=business-continuity -->

<!-- @include shared/fragments/compliance-score-calculation.md -->

---

## 1. Recovery Objectives

**RTO (Recovery Time Objective)**: [EXTRACTED from Section 11.3 or PLACEHOLDER]
**RPO (Recovery Point Objective)**: [EXTRACTED from Section 11.3 or PLACEHOLDER]
**Business Criticality**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 2.2]
Optional Reference: Industry tiers - Tier 1: 99.99%+, Tier 2: 99.9%+, Tier 3: 99.5%+
Note: Add business criticality classification to ARCHITECTURE.md Section 2.2 (System Overview → Solution Overview)
**Source**: [SOURCE_REFERENCE]

---

## 2. Backup Strategy

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| [EXTRACTED] | [EXTRACTED] | [EXTRACTED] | [EXTRACTED] |

**Restoration Tests**: [PLACEHOLDER: Add test schedule]
**Source**: [SOURCE_REFERENCE]

---

## 3. Disaster Recovery Procedures

**Primary Site**: [EXTRACTED from Section 11.4 or 4]
**DR Site**: [EXTRACTED from Section 11.4 or PLACEHOLDER]
**Failover Mechanism**: [EXTRACTED or PLACEHOLDER]
**RTO Target**: [EXTRACTED]
**DR Tests**: [EXTRACTED or PLACEHOLDER: Quarterly recommended]
**Last DR Test**: [PLACEHOLDER: Add date and results]

**Source**: [SOURCE_REFERENCE]

---

## 4. Business Impact Analysis

**Availability Requirement**: [EXTRACTED from Section 10.2]
**Allowed Downtime**: [CALCULATED from SLA]
**Business Criticality**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 2.2]
Optional Reference: Industry tiers - Tier 1: 99.99%+, Tier 2: 99.9%+, Tier 3: 99.5%+
Note: Add business criticality classification to ARCHITECTURE.md Section 2.2 (System Overview → Solution Overview)
**Estimated Downtime Cost**: [PLACEHOLDER: Add revenue impact per hour]

**Source**: [SOURCE_REFERENCE]

---

## 5. Resilience Measures

[PLACEHOLDER: User must provide organizational guidelines]

**Key Guidelines**:
- Impact to critical processes must be documented
- Disaster recovery procedures must be automated
- DR automation where possible
- [PLACEHOLDER: Other guidelines]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Business Continuity Terms**:
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime before business impact becomes unacceptable
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss measured in time
- **DR (Disaster Recovery)**: Process and procedures for recovering IT systems after a disaster
- **Failover**: Automatic switching to redundant system when primary system fails
- **Backup**: Copy of data stored separately for recovery purposes
- **High Availability (HA)**: System design ensuring minimal downtime through redundancy
- **Business Continuity Plan (BCP)**: Documented procedures for maintaining business operations during disruptions
- **Hot Site**: Fully operational backup facility ready for immediate failover
- **Cold Site**: Backup location with basic infrastructure requiring configuration before use
- **Warm Site**: Partially configured backup facility requiring some setup time

<!-- @include shared/fragments/status-codes.md -->

**Compliance Abbreviations**:
- **LABC**: Business Continuity compliance requirement code
- **MTTR**: Mean Time To Recovery
- **MTBF**: Mean Time Between Failures
- **SLA**: Service Level Agreement

---

<!-- @include-with-config shared/sections/validation-methodology.md config=business-continuity -->

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common Business Continuity Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| RTO/RPO values not defined | LABC1 Non-Compliant | Section 10 (Non-Functional Requirements) | Define recovery objectives (e.g., RTO: 4 hours, RPO: 1 hour) |
| Backup strategy undefined | LABC2 Non-Compliant | Section 11 (Operational → Backup & DR) | Document backup frequency, retention, storage location |
| DR testing plan missing | LABC3 Non-Compliant | Section 11 (Operational → Disaster Recovery) | Define DR drill schedule, validation procedures, success criteria |
| Failover mechanisms not specified | LABC4 Unknown | Section 11 (Operational → High Availability) | Specify automatic failover configuration and triggers |
| Data replication undefined | LABC2 Unknown | Section 11 (Operational → Backup & DR) | Document geo-replication strategy, sync/async, RPO alignment |
| Incident response plan missing | LABC5 Unknown | Section 11 (Operational → Incident Management) | Define escalation paths, communication plan, roles/responsibilities |
| Business impact analysis incomplete | LABC1 Unknown | Section 1 (Business Context) | Add BIA with critical systems, dependencies, impact assessment |

---

#### A.3.2 Step-by-Step Remediation Workflow

<!-- @include shared/sections/remediation-workflow-guide.md -->

**Business Continuity-Specific Examples**:

**Example 1: Defining RTO and RPO**
- **Gap**: RTO/RPO values not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add RTO/RPO objectives to Section 10:
   RTO: 4 hours (maximum acceptable downtime),
   RPO: 1 hour (maximum acceptable data loss),
   Availability target: 99.9% (43 minutes downtime/month),
   Recovery tier: Tier 2 (mission-critical, 4-hour recovery),
   Justification: Payment processing requires <4hr recovery"
  ```
- **Expected Outcome**: Section 10 with RTO, RPO, availability targets, tier classification
- **Impact**: LABC1 → Compliant (+0.6 points)

**Example 2: Backup Strategy Documentation**
- **Gap**: Backup strategy not defined
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add backup strategy to Section 11 → Backup & DR:
   Frequency: Full backup daily, incremental every 6 hours,
   Retention: 30 days online, 7 years archival,
   Storage: AWS S3 with cross-region replication to us-west-2,
   Encryption: AES-256 at rest, TLS 1.3 in transit,
   Testing: Monthly restore validation, quarterly full DR drill"
  ```
- **Expected Outcome**: Section 11 with backup frequency, retention, storage, encryption, testing
- **Impact**: LABC2 → Compliant (+0.5 points)

**Example 3: Disaster Recovery Testing Plan**
- **Gap**: DR testing plan not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add DR testing plan to Section 11 → Disaster Recovery:
   Drill schedule: quarterly full DR drill, monthly tabletop exercise,
   Test scenarios: region failure, data corruption, ransomware attack,
   Success criteria: RTO <4hr, RPO <1hr, all services operational,
   Runbook: DR playbook in Confluence with step-by-step procedures,
   Post-drill: retrospective within 1 week, update runbook"
  ```
- **Expected Outcome**: Section 11 with DR drill schedule, scenarios, success criteria, runbook
- **Impact**: LABC3 → Compliant (+0.5 points)

**Example 4: Failover Mechanisms**
- **Gap**: Failover configuration not specified
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add failover mechanisms to Section 11 → High Availability:
   Database: PostgreSQL streaming replication to standby,
   Automatic failover: pg_auto_failover with 30-second detection,
   Application: multi-AZ deployment with ALB health checks,
   DNS: Route 53 health checks with 60-second failover,
   Cache: Redis Sentinel for automatic master election"
  ```
- **Expected Outcome**: Section 11 with failover config, detection time, automation
- **Impact**: LABC4 → Compliant (+0.4 points)

**Example 5: Incident Response Plan**
- **Gap**: Incident response plan missing
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add incident response plan to Section 11 → Incident Management:
   Escalation: L1 (5 min) → L2 (15 min) → L3 (30 min) → exec (1 hr),
   Communication: status page, Slack #incidents, email stakeholders,
   Roles: Incident Commander, Tech Lead, Comms Lead, Scribe,
   Runbooks: GitHub wiki with playbooks for common scenarios,
   Postmortem: within 48 hours, blameless, action items tracked"
  ```
- **Expected Outcome**: Section 11 with escalation matrix, communication plan, roles, runbooks
- **Impact**: LABC5 → Compliant (+0.4 points)

---

#### A.3.3 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required business continuity fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all recovery procedures

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete Recovery Objectives and Strategy** (estimated impact: +0.6 points)
   - Define RTO and RPO with business justification (Section 10)
   - Document backup strategy: frequency, retention, storage, encryption (Section 11)
   - Add data replication: geo-replication, sync/async, RPO alignment (Section 11)
   - Specify recovery tier classification (Tier 1-4) in Section 10
   - Define availability targets and SLAs (Section 10)

2. **Establish DR Testing and Failover** (estimated impact: +0.3 points)
   - Create DR testing plan: drill schedule, scenarios, success criteria (Section 11)
   - Document failover mechanisms: automatic triggers, detection time, procedures (Section 11)
   - Add DR runbook with step-by-step recovery procedures (Section 11)
   - Specify multi-region/multi-AZ deployment strategy (Section 4 or 11)
   - Define post-incident review process with action item tracking (Section 11)

3. **Enhance Incident Management and BIA** (estimated impact: +0.2 points)
   - Document incident response plan: escalation, communication, roles (Section 11)
   - Add business impact analysis: critical systems, dependencies, impact (Section 1)
   - Define incident severity levels with SLA response times (Section 11)
   - Specify crisis communication plan for stakeholders (Section 11)
   - Add monitoring and alerting for BC/DR events (Section 11)

**Priority Order**: LABC1 (RTO/RPO) → LABC2 (backup strategy) → LABC3 (DR testing) → LABC4 (failover) → LABC5 (incident response)

**Estimated Final Score After Remediation**: 8.3-8.8/10 (AUTO_APPROVE)

---

### A.4 Change History

**Version 2.0 (Current)**:
- Complete template restructuring to Version 2.0 format
- Added comprehensive Appendix with A.1-A.4 subsections
- Added Data Extracted Successfully section
- Added Missing Data Requiring Attention table
- Added Not Applicable Items section
- Added Unknown Status Items Requiring Investigation table
- Expanded Generation Metadata
- Aligned with Cloud Architecture template structure
- Total: 10+ validation data points

**Version 1.0 (Previous)**:
- Initial template with minimal appendix
- Basic PLACEHOLDER approach
- Limited source traceability

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=business-continuity -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.