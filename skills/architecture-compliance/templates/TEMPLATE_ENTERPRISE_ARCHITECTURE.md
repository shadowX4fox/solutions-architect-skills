# Compliance Contract: Enterprise Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 1, 2, 3, 4, 12)
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

**Validation Configuration**: `/skills/architecture-compliance/validation/enterprise_architecture_validation.json`

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
  - Score 7.0-7.9 → "Enterprise Architecture Review Board"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

- `[APPROVAL_AUTHORITY]`: "Enterprise Architecture Review Board"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.0-10.0: Automatic approval (no human review required)
- Score 7.0-7.9: Manual review by Enterprise Architecture Review Board required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

**CRITICAL - Compliance Score Calculation**:
When calculating the Compliance Score in validation_results, N/A items MUST be included in the numerator:
- Compliance Score = (PASS items + N/A items + EXCEPTION items) / (Total items) × 10
- N/A items count as fully compliant (10 points each)
- Example: 6 PASS, 5 N/A, 0 FAIL, 0 UNKNOWN → (6+5)/11 × 10 = 10.0/10 (100%)
- Add note in contract output: "Note: N/A items counted as fully compliant (included in compliance score)"

---

## 1. Strategic Alignment

**Business Strategy**: [EXTRACTED from Section 2]
**Digital Transformation**: [EXTRACTED from Section 1, 2 or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 2. Modularity

**Bounded Contexts**: [EXTRACTED from Section 3 or PLACEHOLDER]
**Service Boundaries**: [EXTRACTED from Section 3, 5]
**Reusability**: [EXTRACTED or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 3. Cloud-First

**Cloud Adoption Strategy**: [EXTRACTED from Section 4 or PLACEHOLDER]
**Cloud-Native Principles**: [EXTRACTED or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 4. Third-Party Applications

**Customization Limits**: [PLACEHOLDER: Maximum 20% of functionality]
**Integration Approach**: [EXTRACTED from Section 7 or PLACEHOLDER]

---

## 5. Zero Obsolescence

**Technology Lifecycle**: [EXTRACTED from Section 8, 12 or PLACEHOLDER]
**Modernization Roadmap**: [PLACEHOLDER]

---

## 6. API First / Event Driven

**API Strategy**: [EXTRACTED from Section 7 or PLACEHOLDER]
**Event-Driven Architecture**: [EXTRACTED from Section 3, 6 or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 7. Business Capabilities

**Capability Mapping**: [EXTRACTED from Section 2 or PLACEHOLDER]
**Domain-Driven Design**: [EXTRACTED from Section 3 or PLACEHOLDER]

---

## 8. Guidelines

[PLACEHOLDER: User must provide organizational guidelines]

**Key Guidelines**:
- Modularity, cloud-first
- Limited third-party app customization
- Zero obsolescence
- API First/Event Driven
- Business strategy alignment
- [PLACEHOLDER: Others]

---

## Appendix

**Source**: [SOURCE_REFERENCES]
**Last Generated**: [GENERATION_DATE]