# Compliance Contract: Business Continuity

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

**Validation Configuration**: `/skills/architecture-compliance/validation/business_continuity_validation.json`

**Dynamic Field Instructions for Document Generation**:

- `[DOCUMENT_STATUS]`: Determined by validation_results.outcome.document_status
  - Score 8.0-10.0 → "Approved" (auto-approved)
  - Score 7.0-7.9 → "In Review" (ready for manual review)
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
  - Score 8.0-10.0 → "System (Auto-Approved)"
  - Score 7.0-7.9 → "Business Continuity Review Board"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

- `[APPROVAL_AUTHORITY]`: "Business Continuity Review Board"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.0-10.0: Automatic approval (no human review required)
- Score 7.0-7.9: Manual review by Business Continuity Review Board required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

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

## Appendix: Source Traceability

**Data Extracted From**:
- [SOURCE_REFERENCES]

**Missing Data Requiring Manual Review**:
1. [PLACEHOLDER items]

**Last Generated**: [GENERATION_DATE]