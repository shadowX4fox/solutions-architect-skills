# Compliance Contract: Security Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 7, 9, 11)
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
- `[APPROVAL_AUTHORITY]`: "Security Review Board" or contract-specific authority

---

## 1. API Security

**API Exposure**: [EXTRACTED from Section 9 or 7]
**Authentication**: [EXTRACTED: Authentication methods from Section 9]
**Authorization**: [EXTRACTED: Authorization approach from Section 9]
**Rate Limiting**: [EXTRACTED or PLACEHOLDER]
**API Gateway**: [EXTRACTED from Section 5 or 9]

**Source**: [SOURCE_REFERENCE]

---

## 2. Authentication and Authorization

**Authentication Methods**: [EXTRACTED: OAuth, SAML, JWT, etc. from Section 9]
**MFA**: [EXTRACTED: MFA requirement from Section 9 or PLACEHOLDER]
**SSO**: [EXTRACTED or PLACEHOLDER]
**Identity Management**: [EXTRACTED or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 3. Encryption

**Encryption in Transit**: [EXTRACTED: TLS version from Section 9]
**Encryption at Rest**: [EXTRACTED: Encryption algorithm from Section 9]
**Key Management**: [EXTRACTED or PLACEHOLDER: Key management approach]
**Key Rotation**: [EXTRACTED or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 4. Communication Security

**Intra-Microservices**: [EXTRACTED: Internal communication security from Section 9]
**Inter-Microservices**: [EXTRACTED: External communication security]
**HTTP Communication**: [EXTRACTED: HTTP security measures]

**Source**: [SOURCE_REFERENCE]

---

## 5. Integration Security

[EXTRACTED or AGGREGATED from Section 7]

| System | Protocol | Authentication | Encryption | Source |
|--------|----------|----------------|------------|--------|
| [EXTRACTED] | [EXTRACTED] | [EXTRACTED] | [EXTRACTED] | [SOURCE_REFERENCE] |

---

## 6. Security Monitoring

**SIEM**: [EXTRACTED from Section 11 or PLACEHOLDER]
**Intrusion Detection**: [EXTRACTED or PLACEHOLDER]
**Log Auditing**: [EXTRACTED or PLACEHOLDER]

**Source**: [SOURCE_REFERENCE]

---

## 7. Vulnerability Management

**Vulnerability Scanning**: [EXTRACTED or PLACEHOLDER]
**Patching SLA**: [EXTRACTED or PLACEHOLDER: Critical < 24hr, High < 7 days]
**Remediation**: [PLACEHOLDER]

---

## 8. Security Guidelines

[PLACEHOLDER: User must provide organizational guidelines]

**Key Guidelines**:
- API exposure must be protected
- Authentication and encryption required
- Secure intra/inter microservice communication
- [PLACEHOLDER: Other guidelines]

---

## Appendix: Source Traceability

**Data Extracted From**: [SOURCE_REFERENCES]
**Last Generated**: [GENERATION_DATE]