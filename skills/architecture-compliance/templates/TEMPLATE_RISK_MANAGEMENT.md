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
| Validation Score | [VALIDATION_SCORE]/10 |
| Validation Status | [VALIDATION_STATUS] |
| Validation Date | [VALIDATION_DATE] |
| Validation Evaluator | [VALIDATION_EVALUATOR] |
| Review Actor | [REVIEW_ACTOR] |
| Approval Authority | [APPROVAL_AUTHORITY] |

**Validation Configuration**: `/skills/architecture-compliance/validation/risk_management_validation.json`

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
  - Score 7.0-7.9 → "Risk Management Review Board"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

- `[APPROVAL_AUTHORITY]`: "Risk Management Review Board"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.0-10.0: Automatic approval (no human review required)
- Score 7.0-7.9: Manual review by Risk Management Review Board required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

**CRITICAL - Compliance Score Calculation**:
When calculating the Compliance Score in validation_results, N/A items MUST be included in the numerator:
- Compliance Score = (PASS items + N/A items + EXCEPTION items) / (Total items) × 10
- N/A items count as fully compliant (10 points each)
- Example: 6 PASS, 5 N/A, 0 FAIL, 0 UNKNOWN → (6+5)/11 × 10 = 10.0/10 (100%)
- Add note in contract output: "Note: N/A items counted as fully compliant (included in compliance score)"

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
