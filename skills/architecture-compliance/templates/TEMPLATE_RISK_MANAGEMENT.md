# Risk Management

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 9, 10, 11, 12)
**Version**: 1.0

---

## Document Control

| Field | Value |
|-------|-------|
| Document Owner | [PLACEHOLDER: Assign owner] |
| Review Date | [GENERATION_DATE + 90 days] |
| Status | Draft - Auto-Generated |

---

[PLACEHOLDER: User must provide customized organizational format for Risk Management]

---

## Risk Register (Example Structure)

### RISK-001: [Risk Title]
**Category**: [Security/Availability/Performance/Operational]
**Description**: [EXTRACTED or INFERRED from Sections 9, 10, 11, 12]
**Likelihood**: [1-5]
**Impact**: [1-5]
**Risk Score**: [Likelihood × Impact]
**Source**: [SOURCE_REFERENCE]

**Mitigation Strategies**:
1. [EXTRACTED or INFERRED]
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
