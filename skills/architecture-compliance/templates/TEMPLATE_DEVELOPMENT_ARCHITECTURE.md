# Compliance Contract: Development Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 3, 5, 8, 11, 12)
**Version**: 2.0

---

<!-- @include-with-config shared/sections/document-control.md config=development-architecture -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=development-architecture -->

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LADES1 | Best Practices Adoption (Technology Stack Alignment) | Development Architecture | [STATUS] | Section 8 | Solution Architect |
| LADES2 | Architecture Debt Impact (Exception Handling) | Development Architecture | [STATUS] | Section 8, 12 | Technical Lead |

<!-- @include shared/fragments/compliance-summary-footer.md -->

**Stack Validation**: [VALIDATION_SUMMARY] (**MANDATORY** - Contract cannot be approved without completed validation)

**Dynamic Field Instructions**:
- `[VALIDATION_SUMMARY]`: If `validation_results.overall_status == "PASS"` → "✅ PASS (pass_count PASS, fail_count FAIL, na_count N/A, unknown_count UNKNOWN)", else if "FAIL" → "❌ FAIL (pass_count PASS, fail_count FAIL, na_count N/A, unknown_count UNKNOWN) - See LADES1.6 for details", else → "PENDING - Validation not performed"

**CRITICAL - Compliance Score Calculation**:
When calculating the Compliance Score in validation_results, N/A items MUST be included in the numerator:
- Compliance Score = (PASS items + N/A items + EXCEPTION items) / (Total items) × 10
- N/A items count as fully compliant (10 points each)
- Example: 6 PASS, 5 N/A, 0 FAIL, 0 UNKNOWN → (6+5)/11 × 10 = 10.0/10 (100%)
- Add note in contract output: "Note: N/A items counted as fully compliant (included in compliance score)"

---

## 1. Best Practices Adoption - Technology Stack Alignment (LADES1)

**Requirement**: The solution must be aligned with the defined technology stack (frameworks, versions, tools, libraries). All technology choices must comply with organizational standards and authorized catalogs.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Solution Architect / Technical Lead or N/A]

**External Validation Required**: ⚠️ **MANDATORY** - Stack Validation Checklist (STACK_VALIDATION_CHECKLIST.md) must be completed before contract approval

### 1.1 Backend Technology Stack Alignment

**Backend Language and Framework**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backend stack documented and matches authorized catalog (Java 11/17 + Spring Boot OR .NET Core 3.1/.NET 6/7 + ASP.NET Core). Versions are current and supported. If Non-Compliant: Backend technology not in authorized stack or versions deprecated. If Not Applicable: No backend component. If Unknown: Backend mentioned but versions unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Languages, Frameworks), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify against Stack Validation Checklist Section 1 (Java Backend) or Section 2 (.NET Backend). Document framework version, language version, and justify if deviation exists. Authorized: Java 11/17, .NET Core 3.1/.NET 6/.NET 7]

**Backend Tools and Libraries**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Build tools, testing frameworks, and libraries documented and authorized (Maven/Gradle for Java, NuGet for .NET, SonarQube, JUnit/xUnit/NUnit, OpenAPI/Swagger). If Non-Compliant: Tools not specified or unapproved libraries used. If Unknown: Tools mentioned but approval status unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Frameworks & Libraries), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Cross-reference with authorized library catalog. Document all third-party libraries and verify chapter approval. Include version numbers. Checklist items: Maven/Gradle (Java), NuGet (.NET), SonarQube, JUnit/xUnit/NUnit, OpenAPI/Swagger]

### 1.2 Frontend Technology Stack Alignment (if applicable)

**Frontend Framework**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Frontend framework documented and authorized (Angular v12+, React v17+, Vue.js v3+). Version is current and supported. If Non-Compliant: Framework not in authorized list or deprecated version. If Not Applicable: No frontend component. If Unknown: Framework mentioned but version unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Frontend) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify against Stack Validation Checklist Section 3 (Frontend). Document framework version and architecture pattern (SPA/Micro-Frontends). Authorized frameworks: Angular v12+, React v17+, Vue.js v3+]

**Frontend Language and Tools**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: TypeScript or JavaScript ES6+ documented with approved tooling (NPM/Yarn, Webpack, Jest, Cypress). If Non-Compliant: Language version or tools not authorized. If Not Applicable: No frontend. If Unknown: Tools mentioned but versions unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Frontend Tools) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document language version (TypeScript version or JavaScript ES6+), build tools, testing frameworks. Verify against checklist Section 3. Authorized: TypeScript/JavaScript ES6+, NPM/Yarn, Webpack, Jest, Cypress]

### 1.3 Infrastructure and Deployment Alignment

**Container Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Container deployment documented and authorized (Docker + Kubernetes: AKS/EKS/GKE/OpenShift). Versions are current and supported. If Non-Compliant: Container platform not authorized or missing. If Not Applicable: Non-containerized deployment. If Unknown: Containers mentioned but platform unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture → Deployment Architecture) or Section 8 (Infrastructure), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document container runtime (Docker version), orchestration platform (Kubernetes variant: AKS/EKS/GKE/OpenShift), and verify authorization. Include Helm/chart management strategy. Checklist: Docker + Kubernetes (AKS/EKS/GKE/OpenShift)]

**Database Platform and Version**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database platform documented and in authorized catalog (PostgreSQL, SQL Server, Oracle, MongoDB with approved versions). Version is current and not EOL. If Non-Compliant: Database not authorized or version EOL. If Not Applicable: Stateless application. If Unknown: Database mentioned but version unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Databases), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify against Stack Validation Checklist Section 4 (Other Stacks → Databases). Document platform, version, and EOL status. Authorized databases: PostgreSQL, SQL Server, Oracle, MongoDB]

### 1.4 API and Integration Standards

**API Standards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: APIs documented and comply with standards (OpenAPI 3.0, REST, gRPC). API specifications are versioned and documented. If Non-Compliant: API design does not follow standards. If Not Applicable: No APIs. If Unknown: APIs mentioned but standard unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration Points) or Section 8 (Technology Stack), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API specification format (OpenAPI/Swagger), protocol (REST/gRPC), and version. Ensure OpenAPI 3.0 compliance for REST APIs. Checklist: OpenAPI 3.0, REST, gRPC]

### 1.5 CI/CD and Automation Tools

**CI/CD Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: CI/CD tooling documented and authorized (Azure DevOps, Jenkins, GitHub Actions). Pipeline configuration follows best practices. If Non-Compliant: CI/CD platform not approved or missing. If Unknown: CI/CD mentioned but platform unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → CI/CD) or Section 8 (Technology Stack → CI/CD), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document CI/CD platform, pipeline configuration, and deployment automation. Verify against authorized tools list. Checklist: Azure DevOps, Jenkins, GitHub Actions]

**Infrastructure as Code (IaC)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: IaC tooling documented and authorized (Terraform, Ansible, Azure DevOps Pipelines). Infrastructure is version-controlled. If Non-Compliant: IaC tools not approved or infrastructure manually configured. If Not Applicable: No IaC usage. If Unknown: IaC mentioned but tools unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Deployment) or Section 8 (Technology Stack → Infrastructure), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document IaC tool, version, and infrastructure-as-code repository. Verify against checklist Section 4 (Other Stacks → Infrastructure as Code). Authorized: Terraform, Ansible, Azure DevOps Pipelines]

### 1.6 Stack Validation Checklist Compliance (Automatic Validation)

**Validation Status**: [VALIDATION_STATUS_BADGE]
**Validation Date**: [VALIDATION_DATE]
**Validation Evaluator**: [VALIDATION_EVALUATOR]

**Overall Results**:
- **Total Items**: [TOTAL_ITEMS]
- **PASS**: [PASS_COUNT] ([PASS_PERCENTAGE]%)
- **FAIL**: [FAIL_COUNT] ([FAIL_PERCENTAGE]%)
- **N/A**: [NA_COUNT] ([NA_PERCENTAGE]%)
- **UNKNOWN**: [UNKNOWN_COUNT] ([UNKNOWN_PERCENTAGE]%)

**Dynamic Content**: The following validation summary is automatically generated from `validation_results` cache:

---

#### Java Backend (6 items): [JAVA_SUMMARY]

[JAVA_ITEM_1]
[JAVA_ITEM_2]
[JAVA_ITEM_3]
[JAVA_ITEM_4]
[JAVA_ITEM_5]
[JAVA_ITEM_6]

---

#### .NET Backend (6 items): [DOTNET_SUMMARY]

[DOTNET_ITEM_1]
[DOTNET_ITEM_2]
[DOTNET_ITEM_3]
[DOTNET_ITEM_4]
[DOTNET_ITEM_5]
[DOTNET_ITEM_6]

---

#### Frontend (6 items): [FRONTEND_SUMMARY]

[FRONTEND_ITEM_1]
[FRONTEND_ITEM_2]
[FRONTEND_ITEM_3]
[FRONTEND_ITEM_4]
[FRONTEND_ITEM_5]
[FRONTEND_ITEM_6]

---

#### Other Stacks and Components (5 items): [OTHER_STACKS_SUMMARY]

[OTHER_STACKS_ITEM_1]
[OTHER_STACKS_ITEM_2]
[OTHER_STACKS_ITEM_3]
[OTHER_STACKS_ITEM_4]
[OTHER_STACKS_ITEM_5]

---

#### Exceptions and Action Plan (3 items): [EXCEPTIONS_SUMMARY]

[EXCEPTIONS_ITEM_1]
[EXCEPTIONS_ITEM_2]
[EXCEPTIONS_ITEM_3]

---

**Stack Deviations**: [DEVIATIONS_LIST or "None detected"]

**Recommendations**: [RECOMMENDATIONS_LIST or "None"]

**Source**: ARCHITECTURE.md Section 8 (Technology Stack), lines [SOURCE_LINES]

**Legend**:
- ✅ PASS: Complies with authorized technology catalog
- ❌ FAIL: Non-compliant (deprecated version, unapproved technology, or missing documentation)
- ❓ UNKNOWN: Insufficient data in Section 8 to validate
- ⚪ N/A: Not applicable to this architecture

---

**Dynamic Field Mapping Instructions**:

1. **Header Fields**:
   - `[VALIDATION_STATUS_BADGE]`: "✅ **PASS** (Compliant)" if overall_status == "PASS", else "❌ **FAIL** (Non-Compliant)"
   - `[VALIDATION_DATE]`: From `validation_results.validation_date`
   - `[VALIDATION_EVALUATOR]`: From `validation_results.validation_evaluator`
   - `[TOTAL_ITEMS]`: From `validation_results.total_items` (always 26)
   - `[PASS_COUNT]`: From `validation_results.pass_count`
   - `[FAIL_COUNT]`: From `validation_results.fail_count`
   - `[NA_COUNT]`: From `validation_results.na_count`
   - `[UNKNOWN_COUNT]`: From `validation_results.unknown_count`
   - `[PASS_PERCENTAGE]`: Calculate as `(pass_count / total_items) * 100`
   - `[FAIL_PERCENTAGE]`: Calculate as `(fail_count / total_items) * 100`
   - `[NA_PERCENTAGE]`: Calculate as `(na_count / total_items) * 100`
   - `[UNKNOWN_PERCENTAGE]`: Calculate as `(unknown_count / total_items) * 100`

2. **Section Summaries** (format: "X PASS, Y FAIL, Z N/A, W UNKNOWN"):
   - `[JAVA_SUMMARY]`: Count statuses in `validation_results.sections.java_backend`
   - `[DOTNET_SUMMARY]`: Count statuses in `validation_results.sections.dotnet_backend`
   - `[FRONTEND_SUMMARY]`: Count statuses in `validation_results.sections.frontend`
   - `[OTHER_STACKS_SUMMARY]`: Count statuses in `validation_results.sections.other_stacks`
   - `[EXCEPTIONS_SUMMARY]`: Count statuses in `validation_results.sections.exceptions`

3. **Item Details** (one line per item):
   Format: "- {ICON} {QUESTION} ({EVIDENCE})" where:
   - ICON: ✅ (PASS), ❌ (FAIL), ❓ (UNKNOWN), ⚪ (N/A)
   - QUESTION: From `validation_results.sections.{section}.item_{N}.question`
   - EVIDENCE: From `validation_results.sections.{section}.item_{N}.evidence` (if status != N/A)

   Example mappings:
   - `[JAVA_ITEM_1]`: Format item_1 from java_backend section
   - `[JAVA_ITEM_2]`: Format item_2 from java_backend section
   - ... (repeat for all 26 items across 5 sections)

4. **Footer Fields**:
   - `[DEVIATIONS_LIST]`: From `validation_results.deviations` array (numbered list) or "None detected"
   - `[RECOMMENDATIONS_LIST]`: From `validation_results.unknowns` array (numbered list) or "None"
   - `[SOURCE_LINES]`: Extract from first and last evidence line numbers in validation_results

**Example Output (PASS scenario)**:

```
**Validation Status**: ✅ **PASS** (Compliant)
**Validation Date**: 2025-11-27
**Validation Evaluator**: Claude Code (Automated)

**Overall Results**:
- **Total Items**: 26
- **PASS**: 11 (42%)
- **FAIL**: 0 (0%)
- **N/A**: 12 (46%)
- **UNKNOWN**: 3 (12%)

#### Java Backend (6 items): 5 PASS, 1 UNKNOWN

- ✅ Is Java in a supported version? (Java 17 LTS - Section 8.1, line 952)
- ✅ Is Spring Boot in a supported version? (Spring Boot 3.2 - Section 8.1, line 953)
- ✅ Are official tools used? (Maven 3.9, JUnit 5, Mockito, SonarQube - Section 8.1, lines 954-956)
- ✅ Is deployment in authorized containers? (Docker 24+, AKS 1.28+ - Section 8.2, lines 960-962)
- ✅ Are only approved libraries used? (10 Spring libraries documented - Section 8.1, line 957)
- ❓ Does naming follow standards? (Not documented in Section 8)

#### .NET Backend (6 items): All N/A

- ⚪ No .NET detected in technology stack
- ⚪ No .NET detected in technology stack
- ⚪ No .NET detected in technology stack
- ⚪ No .NET detected in technology stack
- ⚪ No .NET detected in technology stack
- ⚪ No .NET detected in technology stack

[... remaining sections ...]

**Stack Deviations**: None detected

**Recommendations**:
1. **Document Naming Conventions**: Add repository and resource naming conventions to Section 8 (Java Backend Item 6)
2. **Document OpenAPI Version**: Explicitly specify OpenAPI/Swagger version in Section 8 (Other Stacks Item 4)

**Source**: ARCHITECTURE.md Section 8 (Technology Stack), lines 949-1035
```

**Example Output (FAIL scenario)**:

```
**Validation Status**: ❌ **FAIL** (Non-Compliant)
**Validation Date**: 2025-11-27
**Validation Evaluator**: Claude Code (Automated)

**Overall Results**:
- **Total Items**: 26
- **PASS**: 8 (31%)
- **FAIL**: 2 (8%)
- **N/A**: 12 (46%)
- **UNKNOWN**: 4 (15%)

#### Java Backend (6 items): 4 PASS, 1 FAIL, 1 UNKNOWN

- ❌ Is Java in a supported version? (Java 8 detected - DEPRECATED - Section 8.1, line 952)
- ✅ Is Spring Boot in a supported version? (Spring Boot 3.2 - Section 8.1, line 953)
- ✅ Are official tools used? (Maven 3.9, JUnit 5 - Section 8.1, lines 954-956)
- ✅ Is deployment in authorized containers? (Docker 24+, AKS 1.28+ - Section 8.2, lines 960-962)
- ✅ Are only approved libraries used? (All libraries authorized - Section 8.1, line 957)
- ❓ Does naming follow standards? (Not documented in Section 8)

[... remaining sections ...]

**Stack Deviations**:
1. **Java 8 (DEPRECATED)**: Detected in Section 8.1, line 952. Java 8 is EOL. Migrate to Java 11 LTS or Java 17 LTS.
2. **Unapproved Library (lodash)**: Detected in Section 8.3, line 987. Library not in approved catalog. Request chapter approval or replace with approved alternative.

**Recommendations**:
1. **CRITICAL: Upgrade Java to LTS version**: Migrate from Java 8 to Java 17 LTS (Java Backend Item 1)
2. **Remove unapproved library**: Replace lodash with approved alternative or request exception (Frontend Item 5)
3. **Document Naming Conventions**: Add naming conventions to Section 8 (Java Backend Item 6)
```

**Naming Convention Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Repositories and resources follow organizational naming standards. Naming conventions are documented. If Non-Compliant: Naming standards not followed or not documented. If Unknown: Naming mentioned but compliance unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document naming conventions for repositories, containers, resources. Verify against organizational standards. Checklist items: Java Backend (section 1.6), .NET Backend (section 2.6), Frontend (section 3.6)]

**Approved Libraries Verification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All libraries used are approved by chapter. Library inventory is documented and verified. If Non-Compliant: Unapproved libraries in use. If Unknown: Library approval status not verified]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Frameworks & Libraries) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create inventory of all third-party libraries. Cross-reference with chapter-approved library catalog. Document any unapproved libraries and create exception (LADES2). Checklist items: Java (1.5), .NET (2.5), Frontend (3.5)]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LADES1, e.g., "Section 4, lines X-Y; Section 7, lines A-B; Section 8, lines M-N; Section 11, lines P-Q"]

---

## 2. Architecture Debt Impact - Exception Handling and Action Plans (LADES2)

**Requirement**: In case of deviations from the defined technology stack, document the exception and action plan for remediation. Exceptions must be formally approved and tracked with clear timelines.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Technical Lead / Architecture Review Board or N/A]

### 2.1 Stack Deviation Identification

**Technology Stack Deviations**: [Value or "None identified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: No deviations from authorized stack OR all deviations documented with exceptions. Stack compliance verified via checklist. If Non-Compliant: Deviations exist without documented exceptions. If Not Applicable: Full stack compliance (no deviations). If Unknown: Stack compliance not assessed]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack), Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Compare technology stack against authorized catalog (stack-validation-checklist.md). Identify all deviations (unapproved libraries, deprecated versions, non-standard tools). Document in Section 8 or create ADR in Section 12. Checklist reference: Section 5 (Exceptions and Action Plan)]

**Deprecated Technology Usage**: [Value or "None"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: No deprecated/EOL technology in use OR documented migration plan exists for all deprecated components. If Non-Compliant: Deprecated technology used without migration plan. If Not Applicable: All technologies current. If Unknown: EOL status not verified]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Check each technology component against vendor EOL dates (Java, .NET, frameworks, libraries). Document deprecated items and create migration plan with timeline in Section 12 (ADRs). Include risk assessment for continued use of deprecated technologies]

### 2.2 Exception Documentation

**Exception Approval**: [Value or "Not required"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All exceptions formally documented via ADR with approval from chapter/architecture review board. Approval date and approver documented. If Non-Compliant: Exceptions exist but not formally approved. If Not Applicable: No exceptions required. If Unknown: Approval status unclear]
- Source: [ARCHITECTURE.md Section 12 (Architecture Decision Records), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create ADR for each exception documenting: deviation details, business justification, technical rationale, alternatives considered, approval date, approver name. Register exception in this Adherence Contract. Checklist reference: Section 5.2 (Exception and action plan documented)]

**Exception Justification**: [Value or "Not required"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business and technical justification documented for each exception in ADR. Risk assessment and mitigation strategy included. If Non-Compliant: Exceptions lack clear justification or risk assessment. If Not Applicable: No exceptions. If Unknown: Justification partial or unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs → Context, Decision, Consequences) or "Not documented"]
- Note: [If Non-Compliant or Unknown: For each exception, document in ADR: business driver (why deviation is necessary), technical constraints (why standard cannot be used), risk assessment (security, maintainability, vendor support), mitigation strategy (compensating controls, monitoring)]

### 2.3 Remediation Action Plans

**Action Plan Definition**: [Value or "Not required"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Remediation action plan documented with timeline, steps, and success criteria. Each exception has clear path to compliance. If Non-Compliant: Exception exists without action plan or plan incomplete. If Not Applicable: No exceptions requiring remediation. If Unknown: Action plan mentioned but details unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs → Consequences, Future Work) or "Not documented"]
- Note: [If Non-Compliant or Unknown: For each exception, define action plan: remediation steps (migrate to authorized stack), timeline (target quarter/year), resource requirements, success criteria (e.g., library upgraded to approved version), risk mitigation during transition (e.g., dual-run, feature flags). Checklist reference: Section 5.3 (Plan approved by chapter)]

**Action Plan Timeline**: [Value or "Not required"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Timeline documented with milestones and target completion date. Timeline is realistic and includes dependencies. If Non-Compliant: Timeline missing or unrealistic. If Not Applicable: No remediation required. If Unknown: Timeline vague or missing milestones]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document specific timeline with phases: Phase 1 (assessment and impact analysis, Q1 2026), Phase 2 (migration and testing, Q2-Q3 2026), Phase 3 (production deployment and validation, Q4 2026). Include milestones, dependencies, and rollback plan]

### 2.4 Technical Debt Tracking

**Debt Register**: [Value or "Not maintained"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Technical debt tracked in formal register (backlog, ADR log, debt management tool). Each debt item is inventoried and tracked. If Non-Compliant: Technical debt not tracked or ad-hoc tracking without formal register. If Not Applicable: No technical debt. If Unknown: Tracking mechanism unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or external debt tracking system reference or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement technical debt register using: ADR log in Section 12, product backlog, or dedicated debt management tool (e.g., Jira, Azure DevOps). Track each debt item: stack deviation, deprecated technology, architecture shortcut, unapproved library. Include: priority, owner, remediation plan reference, creation date]

**Debt Prioritization**: [Value or "Not defined"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Debt prioritization criteria documented (business impact, security risk, EOL urgency, maintainability). Debt items are prioritized and ordered by risk. If Non-Compliant: Debt not prioritized or criteria unclear. If Not Applicable: No debt to prioritize. If Unknown: Prioritization mentioned but criteria unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define prioritization criteria: Critical (security vulnerability, EOL <6 months, regulatory non-compliance), High (major deviation from stack, EOL <12 months, significant business impact), Medium (minor deviation, EOL <24 months, moderate maintainability risk), Low (cosmetic, no EOL risk, minimal impact). Document priority for each debt item]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LADES2, e.g., "Section 8, lines X-Y; Section 12, lines A-B"]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Development Architecture Terms**:
- **Stack Validation**: Process of verifying technology choices against organizational standards and best practices
- **Tech Debt (Technical Debt)**: Code or architecture decisions that trade long-term maintainability for short-term delivery
- **CI/CD (Continuous Integration/Continuous Deployment)**: Automated pipelines for building, testing, and deploying code
- **Approved Library Catalog**: Organizational list of approved frameworks, libraries, and tools
- **EOL (End of Life)**: Technology version no longer supported by vendor
- **ADR (Architecture Decision Record)**: Document capturing architectural choices and their rationale
- **Stack Alignment**: Ensuring technology choices follow organizational standards
- **Exception Handling**: Documented approval process for deviating from standard technology choices

<!-- @include shared/fragments/status-codes.md -->

**Development Abbreviations**:
- **LADES**: Development Architecture compliance requirement code
- **DX**: Developer Experience
- **SCA**: Static Code Analysis
- **SAST**: Static Application Security Testing

---

### A.2 Validation Methodology

**Validation Process**:

1. **Completeness Check (40% weight)**:
   - Counts filled data points across all LADES requirements
   - Formula: (Filled fields / Total required fields) × 10
   - Example: 12 out of 14 fields = 8.6/10 completeness

2. **Compliance Check (50% weight)**:
   - Evaluates each validation item as PASS/FAIL/N/A/UNKNOWN
   - Formula: (PASS + N/A + EXCEPTION items) / Total items × 10
   - **CRITICAL**: N/A items MUST be included in numerator
   - Example: 10 PASS + 2 N/A + 0 EXCEPTION out of 14 items = (10+2)/14 × 10 = 8.6/10
   - **SPECIAL**: LADES1.6 (Stack Validation) cannot be "Unknown" - must be Compliant (PASS) or Non-Compliant (PENDING/FAIL)

3. **Quality Check (10% weight)**:
   - Assesses source traceability (ARCHITECTURE.md section references)
   - Verifies Stack Validation Checklist completion
   - Formula: (Items with valid sources / Total items) × 10

4. **Final Score Calculation**:
   ```
   Final Score = (Completeness × 0.4) + (Compliance × 0.5) + (Quality × 0.1)
   ```

**Outcome Determination**:
| Score Range | Document Status | Review Actor | Action |
|-------------|----------------|--------------|--------|
| 8.0-10.0 | Approved | System (Auto-Approved) | Ready for implementation (requires LADES1.6 PASS) |
| 7.0-7.9 | In Review | Development Architecture Review Board | Manual review required |
| 5.0-6.9 | Draft | Architecture Team | Address gaps before review |
| 0.0-4.9 | Rejected | N/A (Blocked) | Cannot proceed - critical development standards missing |

**IMPORTANT**: Contract cannot achieve "Approved" status without Stack Validation Checklist (LADES1.6) showing PASS status.

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

**Additional Development-Specific Steps**:
- **Complete Stack Validation**: For LADES1.6, complete STACK_VALIDATION_CHECKLIST.md (26 checkpoints)
- **Stack Checklist Path**: `.claude/skills/architecture-compliance/STACK_VALIDATION_CHECKLIST.md`

---

#### A.3.1 Common Gaps Quick Reference

**Common Development Architecture Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| Technology stack incomplete | LADES1 Non-Compliant | Section 8 (Technology Stack) | Document all languages, frameworks, databases, tools with versions |
| Stack validation not completed | LADES1.6 Non-Compliant | External checklist | Complete STACK_VALIDATION_CHECKLIST.md (26 checkpoints) |
| Deprecated technology versions | LADES2 Non-Compliant | Section 8 or 12 (Technology/ADRs) | Upgrade to approved versions or register exception via LADES2 |
| CI/CD pipeline undefined | LADES3 Unknown | Section 11 (Operational Considerations) | Document build, test, deployment automation, rollback procedures |
| Code quality standards missing | LADES4 Unknown | Section 8 or 11 (Technology/Operational) | Specify linting, static analysis, code coverage requirements |
| Dependency management undefined | LADES5 Unknown | Section 8 (Technology Stack) | Document dependency lock files, vulnerability scanning, update policy |
| Testing strategy incomplete | LADES6 Unknown | Section 11 (Operational Considerations) | Define unit, integration, e2e testing with coverage thresholds |
| Tech debt not documented | LADES2 Unknown | Section 12 (ADRs) | Create ADRs for approved exceptions with justification and mitigation plan |

---

#### A.3.2 Step-by-Step Remediation Workflow

<!-- @include shared/sections/remediation-workflow-guide.md -->

**Development Architecture-Specific Examples**:

**Example 1: Completing Technology Stack Documentation**
- **Gap**: Technology stack incomplete in Section 8
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add complete technology stack to Section 8:
   Backend: Java 17 LTS, Spring Boot 3.1, Hibernate 6.2,
   Frontend: React 18, TypeScript 5.1, Vite 4.4,
   Database: PostgreSQL 15, Redis 7.2,
   Infrastructure: Docker 24, Kubernetes 1.28,
   CI/CD: GitHub Actions, ArgoCD,
   Monitoring: Prometheus, Grafana"
  ```
- **Expected Outcome**: Section 8 with complete stack, versions, approved technologies
- **Impact**: LADES1 → Compliant (+0.6 points)

**Example 2: CI/CD Pipeline Documentation**
- **Gap**: CI/CD pipeline not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add CI/CD pipeline to Section 11:
   Build: GitHub Actions with Maven/Gradle,
   Testing: automated unit (90% coverage), integration, e2e tests,
   Deployment: GitOps with ArgoCD, blue-green strategy,
   Rollback: automated on health check failure within 5 minutes,
   Environments: dev → staging → production with approval gates"
  ```
- **Expected Outcome**: Section 11 with CI/CD workflow, testing, deployment strategies
- **Impact**: LADES3 → Compliant (+0.5 points)

**Example 3: Code Quality and Testing Standards**
- **Gap**: Code quality standards and testing strategy missing
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add code quality standards to Section 11:
   Linting: ESLint (frontend), Checkstyle (backend),
   Static analysis: SonarQube with Quality Gate (A rating minimum),
   Code coverage: 90% unit test coverage required,
   Testing pyramid: 70% unit, 20% integration, 10% e2e,
   PR requirements: 2 approvals, all checks passing"
  ```
- **Expected Outcome**: Section 11 with quality gates, testing strategy, PR requirements
- **Impact**: LADES4 + LADES6 → Compliant (+0.5 points)

**Example 4: Dependency Management and Security**
- **Gap**: Dependency management not specified
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add dependency management to Section 8:
   Lock files: package-lock.json (npm), pom.xml (Maven),
   Vulnerability scanning: Dependabot automated PRs,
   Update policy: security patches within 48 hours, minor versions monthly,
   Supply chain security: npm audit, OWASP dependency check,
   Private registry: Artifactory for approved dependencies"
  ```
- **Expected Outcome**: Section 8 with dependency management, security scanning, update policy
- **Impact**: LADES5 → Compliant (+0.4 points)

**Example 5: Tech Debt Exception Documentation**
- **Gap**: Using deprecated Java 8 without documented exception
- **Skill Command**:
  ```
  /skill architecture-docs
  "Create ADR in Section 12 for Java 8 exception:
   Title: Continue Java 8 usage for legacy module,
   Context: Legacy payment module requires Java 8 compatibility,
   Decision: Maintain Java 8 for legacy module, Java 17 for new services,
   Consequences: Technical debt, migration plan by Q3 2025,
   Mitigation: Isolated module, no new features, security patches only"
  ```
- **Expected Outcome**: Section 12 with ADR documenting exception, mitigation, migration plan
- **Impact**: LADES2 → Exception Approved (LADES2 → PASS) (+0.5 points)

---

#### A.3.3 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required development architecture fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS (requires stack validation)
- Quality ({{quality_percent}} weight): Add source traceability for all technology decisions

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete Technology Stack Documentation** (estimated impact: +0.6 points)
   - Document complete technology stack in Section 8: languages, frameworks, databases, tools with versions
   - Complete STACK_VALIDATION_CHECKLIST.md (26 checkpoints) for LADES1.6
   - Verify all technologies against organizational approved catalog
   - Document dependency management: lock files, vulnerability scanning, update policy (Section 8)
   - Add approved library/framework justifications in Section 8 or Section 12 (ADRs)

2. **Establish Development Workflow and Quality** (estimated impact: +0.3 points)
   - Document CI/CD pipeline: build, test, deploy, rollback procedures (Section 11)
   - Define code quality standards: linting, static analysis, SonarQube gates (Section 11)
   - Add testing strategy: unit, integration, e2e with coverage thresholds (Section 11)
   - Specify PR requirements: approvals, checks, code review guidelines (Section 11)
   - Document branching strategy: GitFlow, trunk-based, or feature branches (Section 11)

3. **Address Tech Debt and Exceptions** (estimated impact: +0.2 points)
   - Create ADRs for deprecated technologies with migration plans (Section 12)
   - Document approved exceptions via LADES2 process with risk mitigation (Section 12)
   - Add technical debt register with prioritization and remediation timeline (Section 12)
   - Specify upgrade path for deprecated versions with timeline (Section 12)
   - Ensure all FAIL items have exceptions or upgrade plans

**Priority Order**: LADES1 (tech stack) → LADES1.6 (stack validation) → LADES3 (CI/CD) → LADES4 (code quality) → LADES6 (testing) → LADES2 (exceptions) → LADES5 (dependencies)

**CRITICAL**: Contract cannot achieve "Approved" status without LADES1.6 (Stack Validation Checklist) showing PASS status. Complete the checklist before requesting approval.

**Estimated Final Score After Remediation**: 8.2-8.7/10 (AUTO_APPROVE)

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
- Total: 14 validation data points across 2 LADES requirements
- Integrated Stack Validation Checklist as mandatory requirement

**Version 1.0 (Previous)**:
- Basic source traceability section
- Generation metadata focus
- Limited structure

---

<!-- @include-with-config shared/sections/data-extracted-template.md config=development-architecture -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=development-architecture -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=development-architecture -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=development-architecture -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=development-architecture -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.

**CRITICAL**: Contract approval requires LADES1.6 (Stack Validation) to show PASS status. Complete STACK_VALIDATION_CHECKLIST.md before seeking approval.