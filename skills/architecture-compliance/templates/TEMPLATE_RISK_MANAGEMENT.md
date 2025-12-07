# Risk Management

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 9, 10, 11, 12)
**Version**: 1.0

---

## Document Control

| Field | Value |
|-------|-------|
| Document Owner | [SOLUTION_ARCHITECT or N/A] |
| Last Review Date | [GENERATION_DATE] |
| Next Review Date | [NEXT_REVIEW_DATE] |
| Status | [DOCUMENT_STATUS] |
| Stack Validation Status | [VALIDATION_STATUS] - MANDATORY for approval |
| Validation Date | [VALIDATION_DATE] |
| Validation Evaluator | [VALIDATION_EVALUATOR] |
| Approval Authority | [APPROVAL_AUTHORITY] |

**Dynamic Field Instructions**:
- `[DOCUMENT_STATUS]`: If `validation_results.overall_status == "PASS"` → "In Review" (ready for approval), else → "Draft" (blocked)
- `[VALIDATION_STATUS]`: From `validation_results.overall_status` → "PASS" or "FAIL"
- `[VALIDATION_DATE]`: From `validation_results.validation_date` → "YYYY-MM-DD" or "Not performed"
- `[VALIDATION_EVALUATOR]`: From `validation_results.validation_evaluator` → "Claude Code (Automated)" or "N/A"
- `[APPROVAL_AUTHORITY]`: "Risk Management Review Board" or contract-specific authority

---

[PLACEHOLDER: User must provide customized organizational format for Risk Management]

---

## Risk Register (Example Structure)

### RISK-001: [Risk Title]
**Category**: [Security/Availability/Performance/Operational]
**Description**: [EXTRACTED from Sections 9, 10, 11, 12 or PLACEHOLDER]
Note: If risk not documented in ARCHITECTURE.md, add to Section 12 (ADRs) or create Risk Assessment section
**Likelihood**: [1-5 based on documented evidence or PLACEHOLDER]
**Impact**: [1-5 based on documented business impact or PLACEHOLDER]
**Risk Score**: [Likelihood × Impact]
**Source**: [SOURCE_REFERENCE]

**Mitigation Strategies**:
1. [EXTRACTED from documented controls or PLACEHOLDER]
2. [...]

**Residual Risk**: [1-5]
**Owner**: [PLACEHOLDER: Assign owner]
**Target Date**: [PLACEHOLDER]

---

### Examples of Common Risks to Extract:

**From Section 9 (Security)**:
- Manual key rotation risks
- Weak authentication risks
- API exposure vulnerabilities

**From Section 10 (Performance)**:
- Insufficient capacity risks
- SLA violation risks
- Latency risks

**From Section 11 (Operational)**:
- Single-region DR risks
- Backup failure risks
- Incident management risks

**From Section 12 (ADRs)**:
- Architectural decision risks
- Trade-offs and compromises
- Technical debt

---

## Risk Summary

| Risk ID | Category | Score | Status | Owner |
|---------|----------|-------|--------|-------|
| [EXTRACTED] | [CATEGORY] | [SCORE] | [STATUS] | [OWNER] |

---

## Appendix: Source Traceability

**Data Extracted From**: [SOURCE_REFERENCES]
**Last Generated**: [GENERATION_DATE]

**Note**: This template is an example. User must provide the specific organizational format for Risk Management.
