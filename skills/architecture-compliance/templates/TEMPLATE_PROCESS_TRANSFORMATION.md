# Compliance Contract: Process Transformation and Automation

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 1, 2, 5, 6, 7)
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

**Validation Configuration**: `/skills/architecture-compliance/validation/process_transformation_validation.json`

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
  - Score 7.0-8.4 → "Process Transformation Review Board"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

- `[APPROVAL_AUTHORITY]`: "Process Transformation Review Board"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.5-10.0: Automatic approval (no human review required)
- Score 7.0-8.4: Manual review by Process Transformation Review Board required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

---

## 1. Automation Opportunities

**Processes to Automate**: [EXTRACTED from Section 1, 2 or PLACEHOLDER]
**ROI Analysis**: [PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 2. Automation Best Practices

**Tools**: [EXTRACTED from Section 5, 8 or PLACEHOLDER]
**Frameworks**: [EXTRACTED or PLACEHOLDER]
**Patterns**: [EXTRACTED from Section 3 or PLACEHOLDER]

---

## 3. Impact Analysis

**Efficiency Gains**: [PLACEHOLDER]
**Cost Reduction**: [PLACEHOLDER]
**Time Savings**: [PLACEHOLDER]

---

## 4. License Efficiency

**License Optimization**: [PLACEHOLDER]

---

## 5. Capability Reuse

**Shared Services**: [EXTRACTED from Section 5 or PLACEHOLDER]
**Reusable Components**: [EXTRACTED or PLACEHOLDER]

---

## 6. Document Management

**Automated Workflows**: [EXTRACTED from Section 6 or PLACEHOLDER]
**Approvals**: [PLACEHOLDER]

---

## 7. Change Management

**Rollout Strategy**: [PLACEHOLDER]
**Training**: [PLACEHOLDER]
**Adoption**: [PLACEHOLDER]

---

## 8. Guidelines

[PLACEHOLDER: User must provide organizational guidelines]

**Key Guidelines**:
- Automation best practices
- Impact analysis
- License efficiency, capability reuse
- [PLACEHOLDER: Others]

---

## Appendix

**Source**: [SOURCE_REFERENCES]
**Last Generated**: [GENERATION_DATE]