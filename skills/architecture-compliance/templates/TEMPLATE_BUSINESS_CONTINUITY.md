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

**Common Business Continuity Gaps and Remediation**:

| Missing Item | ARCHITECTURE.md Section | What to Add |
|--------------|------------------------|-------------|
| RTO/RPO values | Section 11.3 (Backup & Disaster Recovery) | Define recovery objectives (e.g., RTO: 4 hours, RPO: 1 hour) |
| Backup strategy | Section 11.3 (Backup & Disaster Recovery) | Document backup frequency, retention, and storage location |
| DR testing plan | Section 11.4 (Disaster Recovery) | Define DR drill schedule and validation procedures |
| Failover mechanisms | Section 11.2 (High Availability) | Specify automatic failover configuration and triggers |
| Data replication | Section 11.3 or 11.4 | Document geo-replication strategy and RPO alignment |

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