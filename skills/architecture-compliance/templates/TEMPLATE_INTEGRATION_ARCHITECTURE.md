# Compliance Contract: Integration Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 5, 6, 7, 8)
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
- `[APPROVAL_AUTHORITY]`: "Integration Architecture Review Board" or contract-specific authority

---

## 1. Integration Catalog

[EXTRACTED and AGGREGATED from Section 7]

| System | Protocol | Authentication | SLA | Source |
|--------|----------|----------------|-----|--------|
| [EXTRACTED] | [EXTRACTED] | [EXTRACTED] | [EXTRACTED] | [SOURCE_REFERENCE] |

**Total Integrations**: [COUNT]

---

## 2. Integration Patterns

**REST**: [EXTRACTED from Section 7 or PLACEHOLDER]
**SOAP**: [EXTRACTED or PLACEHOLDER]
**Messaging**: [EXTRACTED or PLACEHOLDER]
**Events**: [EXTRACTED from Section 6 or PLACEHOLDER]
**Batch**: [EXTRACTED or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 3. Best Practices

**API Design**: [PLACEHOLDER]
**Versioning**: [PLACEHOLDER]
**Error Handling**: [PLACEHOLDER]

---

## 4. Integration Security

**Authentication**: [EXTRACTED from Section 7, 9]
**Authorization**: [EXTRACTED from Section 9 or PLACEHOLDER]
**Encryption**: [EXTRACTED from Section 9]

**Source**: [SOURCE_REFERENCE]

---

## 5. Obsolete Technologies

**Avoid**: [PLACEHOLDER: SOAP 1.1, XML-RPC, etc.]
**Deprecated Protocols**: [EXTRACTED from Section 12 ADRs or PLACEHOLDER]

---

## 6. Traceability and Audit

**Integration Logging**: [EXTRACTED from Section 11 or PLACEHOLDER]
**Correlation IDs**: [PLACEHOLDER]

---

## 7. Standards Compliance

**OpenAPI**: [PLACEHOLDER]
**AsyncAPI**: [PLACEHOLDER]
**Integration Standards**: [PLACEHOLDER]

---

## 8. Guidelines

[PLACEHOLDER: User must provide organizational guidelines]

**Key Guidelines**:
- Best practices adoption
- Secure integrations
- Avoid obsolete technologies
- Traceability and audit
- Integration standards compliance
- [PLACEHOLDER: Others]

---

## Appendix

**Source**: [SOURCE_REFERENCES]
**Last Generated**: [GENERATION_DATE]