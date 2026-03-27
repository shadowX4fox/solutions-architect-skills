# Compliance Contract: SRE Architecture (Site Reliability Engineering)

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 2, 4, 5, 7, 10, 11)
**Version**: 2.0

> **Note for agents/reviewers**: `Note` fields in this template reference ARCHITECTURE.md sections using internal section numbers (S1-S12), NOT file prefix numbers. Use the canonical mapping: S9 = `docs/07-security-architecture.md`, S10 = `docs/08-scalability-and-performance.md`, S11 = `docs/09-operational-considerations.md`. See SECTION_MAPPING_GUIDE.md for the full S1-S12 → file path mapping.

---

<!-- @include-with-config shared/sections/document-control.md config=sre-architecture -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=sre-architecture -->

**CRITICAL - Two-Tier Compliance Scoring**:
This template uses a two-tier scoring system for SRE requirements:

**Blocker Requirements (36 total)** - MANDATORY:
- ALL Blocker requirements must be Compliant or Not Applicable for approval
- Status values: Compliant, Non-Compliant, Not Applicable, Unknown
- Non-Compliant or Unknown Blocker requirements BLOCK approval (score capped at 4.9)
- Blocker Score = (Compliant + Not Applicable) / 36 → Must be 100% for approval pathway

**Desired Requirements (21 total)** - OPTIONAL:
- Desired requirements are enhancement recommendations
- Only counted if status is Compliant or Not Applicable
- Non-Compliant or Unknown Desired requirements do NOT block approval
- Desired Score = (Compliant + Not Applicable) / 21 → Enhancement metric

**Final Score Calculation**:
- Final Score = (Blocker Score × 0.7) + (Desired Score × 0.3)
- Minimum for approval (score ≥ 7.0): All 36 Blocker requirements pass
- Auto-approval (score ≥ 8.0): All 36 Blocker pass + at least 60% Desired requirements

**Note**: Not Applicable items counted as fully compliant (included in compliance score)

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Operational and audit logs must be recorded in a structured format, us... | Practice - Log Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE02 | Operational logs must record relevant information, classified into lev... | Practice - Log Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE03 | Logs must be accessible without depending on third parties, either thr... | Practice - Log Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE04 | Automatic rollback mechanisms must be in place in case of failures dur... | Practice - Application Deployment | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE05 | All configurations must be stored in official and secure repositories,... | Practice - Configuration Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.4 | [Role or N/A] |
| LASRE06 | Application documentation and operational procedures (SOP) will be mai... | Practice - Operational Documentation | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.4 | [Role or N/A] |
| LASRE07 | The application must implement mechanisms that allow identifying when ... | Practice - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE08 | The application must implement health check mechanisms that allow iden... | Practice - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE09 | The application must have high availability mechanisms, through the im... | Practice - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE10 | Load tests must be executed and documented on all application componen... | Practice - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE11 | The application must have automatic adjustment mechanisms in the numbe... | Practice - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE12 | A documented recovery plan (DRP) must be in place, establishing the ne... | Practice - Recovery and Resilience Testing | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.2 | [Role or N/A] |
| LASRE13 | Has C2 application and deployment diagrams in IcePanel. | Practice - Information and Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | 4.1/2.1 | [Role or N/A] |
| LASRE14 | The application is registered in the Bank's application portfolio and ... | Practice - Information and Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | 4.1/2.1 | [Role or N/A] |
| LASRE15 | The escalation matrix is defined and resolving groups are registered i... | Practice - Information and Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | 4.1/2.1 | [Role or N/A] |
| LASRE16 | Has generated a request for implementation or modification of applicat... | Practice - Information and Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | 4.1/2.1 | [Role or N/A] |
| LASRE17 | Has defined the mechanism and criteria for measuring application avail... | Observability - Key Metrics | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.2 | [Role or N/A] |
| LASRE18 | Has defined the mechanism and criteria for measuring application perfo... | Observability - Key Metrics | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.2 | [Role or N/A] |
| LASRE19 | Monitored components have dynamic or static thresholds correctly confi... | Observability - Key Metrics | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.2 | [Role or N/A] |
| LASRE20 | Has validated that microservices are instrumented with Dynatrace (auto... | Observability - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE21 | Internal APIs of the application are monitored. | Observability - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE22 | Has validated that microservice requests correctly handle exceptions a... | Observability - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE23 | The application URL has synthetic availability validation. | Observability - Frontend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE24 | The application frontend allows injection of Dynatrace JavaScript for ... | Observability - User Experience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE25 | Confirms that in security components like WAF, firewall, frontdoor, et... | Observability - User Experience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE26 | The application has UX monitoring. Note: Applies to applications with ... | Observability - User Experience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE27 | Has performed Dynatrace licensing cost estimation using the official c... | Observability - Cost Estimation | [Compliant/Non-Compliant/Not Applicable/Unknown] | 2.5 | [Role or N/A] |
| LASRE28 | Prerequisites necessary to ensure coverage of all components have been... | Observability - Cost Estimation | [Compliant/Non-Compliant/Not Applicable/Unknown] | 2.5 | [Role or N/A] |
| LASRE29 | Onpremise or cloud servers of the application have Dynatrace agent ins... | Observability - Infrastructure | [Compliant/Non-Compliant/Not Applicable/Unknown] | 5.2 | [Role or N/A] |
| LASRE30 | Containers (OpenShift/AKS/EKS/GKE) have Dynatrace Operator/OneAgent de... | Observability - Infrastructure | [Compliant/Non-Compliant/Not Applicable/Unknown] | 5.2 | [Role or N/A] |
| LASRE31 | Onpremise and/or cloud dependencies like DB, load balancers, Redis, fr... | Observability - Infrastructure | [Compliant/Non-Compliant/Not Applicable/Unknown] | 5.2 | [Role or N/A] |
| LASRE32 | Has monitoring of batch processes not managed by Control-M. | Observability - Batch Processing | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE33 | Consistency between applications and their source code will be ensured... | Observability - Application Deployment | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE34 | Must have automation of the Disaster Recovery process. | Observability - Disaster Recovery | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.2 | [Role or N/A] |
| LASRE35 | Must have automation of the process to validate the state of what is r... | Observability - Disaster Recovery | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.2 | [Role or N/A] |
| LASRE36 | Must have an automated process for managing application services (star... | Observability - Application Operational Tasks | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE37 | Generated logs must be centralized in an analysis or monitoring tool, ... | Observability - Log Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE38 | Operational logs must allow modification of verbosity level, thus faci... | Observability - Log Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE39 | Configurations must be subject to version control, ensuring that any c... | Observability - Configuration Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.4 | [Role or N/A] |
| LASRE40 | Deployments of new versions will be performed gradually, using strateg... | Observability - Integration, Deployment and Delivery | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE41 | Appropriate traffic management strategies will be applied to the appli... | Observability - Integration, Deployment and Delivery | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE42 | Will have a defined 7x24 maintenance procedure that guarantees continu... | Observability - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE43 | Must have alternative mechanisms that allow managing backend failures,... | Automation - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE44 | Automatic retries and proper management of timeouts for both client an... | Automation - Operational Resilience | [Compliant/Non-Compliant/Not Applicable/Unknown] | 10.1 | [Role or N/A] |
| LASRE45 | The application must execute chaos tests, with the objective of evalua... | Automation - Recovery and Resilience Testing | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.2 | [Role or N/A] |
| LASRE46 | Components involved in the application's critical journeys are identif... | Automation - Information and Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | 4.1/2.1 | [Role or N/A] |
| LASRE47 | Components involved in the application's critical journeys are identif... | Automation - Information and Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | 4.1/2.1 | [Role or N/A] |
| LASRE48 | Microservices and workloads contain labels that allow differentiating ... | Automation - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE49 | Has validated with the external system provider that they have APIs th... | Automation - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE50 | Critical services have advanced monitoring configurations and threshol... | Automation - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE51 | Application logs are correctly ingested into observability tools. | Automation - Backend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE52 | The application allows performing synthetic validations through authen... | Automation - Frontend Application | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.1 | [Role or N/A] |
| LASRE53 | Cloud components (MS Azure, GCP, AWS) of the application are tagged at... | Automation - Infrastructure | [Compliant/Non-Compliant/Not Applicable/Unknown] | 5.2 | [Role or N/A] |
| LASRE54 | Has health or state detection of critical processes or OS services (pr... | Automation - Infrastructure | [Compliant/Non-Compliant/Not Applicable/Unknown] | 5.2 | [Role or N/A] |
| LASRE55 | Must have generation of reports on application components. | Automation - Application Operational Tasks | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE56 | Will have an automated process to sanitize or copy data to previous en... | Automation - Application Operational Tasks | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |
| LASRE57 | Will have automation to remediate application failures automatically. | Automation - Auto-remediation | [Compliant/Non-Compliant/Not Applicable/Unknown] | 11.3 | [Role or N/A] |

<!-- @include shared/fragments/compliance-summary-footer.md -->

**Blocker Requirements**: [X/36 Compliant] (**MANDATORY** - All must pass for approval)
**Desired Requirements**: [Y/21 Compliant] (OPTIONAL - Enhancement recommendations)

**Compliance by Area**:
- Practice: [X/16 Compliant]
- Observability: [Y/26 Compliant]
- Automation: [Z/15 Compliant]

---

## 1. Log Management (LASRE01)

**Requirement**: Operational and audit logs must be recorded in a structured format, using defined and consistent fields, or following a standard to ensure uniformity and facilitate analysis.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 1.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 1.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE01]

---

## 2. Log Management (LASRE02)

**Requirement**: Operational logs must record relevant information, classified into levels such as debug, info, or error according to the system's needs and characteristics.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 2.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 2.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE02]

---

## 3. Log Management (LASRE03)

**Requirement**: Logs must be accessible without depending on third parties, either through internal mechanisms or automated processes that allow efficient and secure consultation of these records.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 3.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 3.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE03]

---

## 4. Application Deployment (LASRE04)

**Requirement**: Automatic rollback mechanisms must be in place in case of failures during deployment, ensuring that the system can revert to a previous stable version.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 4.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 4.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE04]

---

## 5. Configuration Management (LASRE05)

**Requirement**: All configurations must be stored in official and secure repositories, such as authorized repositories or specialized services like Azure Repos, to ensure protection and controlled access to information.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 5.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 5.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE05]

---

## 6. Operational Documentation (LASRE06)

**Requirement**: Application documentation and operational procedures (SOP) will be maintained in official repositories, accessible to the entire team.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Team Lead or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 6.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 6.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE06]

---

## 7. Operational Resilience (LASRE07)

**Requirement**: The application must implement mechanisms that allow identifying when it is ready to receive load, ensuring that services are available and operational before starting processes or receiving requests.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 7.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 7.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE07]

---

## 8. Operational Resilience (LASRE08)

**Requirement**: The application must implement health check mechanisms that allow identifying if it is functioning correctly, ensuring timely detection of possible service failures.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 8.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 8.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE08]

---

## 9. Operational Resilience (LASRE09)

**Requirement**: The application must have high availability mechanisms, through the implementation of more than one replica, to ensure service continuity and minimize possible interruptions.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 9.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 9.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE09]

---

## 10. Operational Resilience (LASRE10)

**Requirement**: Load tests must be executed and documented on all application components before production release, ensuring that performance is adequate and results are available for consultation and analysis.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 10.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 10.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE10]

---

## 11. Operational Resilience (LASRE11)

**Requirement**: The application must have automatic adjustment mechanisms in the number of instances, allowing scaling according to service load to ensure optimal performance and continuous availability.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 11.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 11.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE11]

---

## 12. Recovery and Resilience Testing (LASRE12)

**Requirement**: A documented recovery plan (DRP) must be in place, establishing the necessary procedures and resources to restore service in case of incidents or disasters, guaranteeing operational continuity.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Business Continuity Manager or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 12.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 12.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE12]

---

## 13. Information and Architecture (LASRE13)

**Requirement**: Has C2 application and deployment diagrams in IcePanel.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Enterprise Architect or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 13.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 13.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE13]

---

## 14. Information and Architecture (LASRE14)

**Requirement**: The application is registered in the Bank's application portfolio and business criticality has been categorized.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Enterprise Architect or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 14.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 14.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE14]

---

## 15. Information and Architecture (LASRE15)

**Requirement**: The escalation matrix is defined and resolving groups are registered in the application portfolio.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Enterprise Architect or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 15.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 15.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE15]

---

## 16. Information and Architecture (LASRE16)

**Requirement**: Has generated a request for implementation or modification of application observability.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Enterprise Architect or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 16.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 16.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE16]

---

## 17. Key Metrics (LASRE17)

**Requirement**: Has defined the mechanism and criteria for measuring application availability.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 17.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 17.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE17]

---

## 18. Key Metrics (LASRE18)

**Requirement**: Has defined the mechanism and criteria for measuring application performance.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 18.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 18.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE18]

---

## 19. Key Metrics (LASRE19)

**Requirement**: Monitored components have dynamic or static thresholds correctly configured.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 19.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 19.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE19]

---

## 20. Backend Application (LASRE20)

**Requirement**: Has validated that microservices are instrumented with Dynatrace (automatic or manual instrumentation).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 20.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 20.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE20]

---

## 21. Backend Application (LASRE21)

**Requirement**: Internal APIs of the application are monitored.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 21.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 21.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE21]

---

## 22. Backend Application (LASRE22)

**Requirement**: Has validated that microservice requests correctly handle exceptions at code level in test environment, to avoid increase in monitoring failure rate in production.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 22.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 22.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE22]

---

## 23. Frontend Application (LASRE23)

**Requirement**: The application URL has synthetic availability validation.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Frontend SRE or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 23.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 23.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE23]

---

## 24. User Experience (LASRE24)

**Requirement**: The application frontend allows injection of Dynatrace JavaScript for RUM (Real User Experience) capture. Note: Applies to applications with business transactionality.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 24.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 24.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE24]

---

## 25. User Experience (LASRE25)

**Requirement**: Confirms that in security components like WAF, firewall, frontdoor, etc., there are no blocks to Dynatrace injection and beacons. Note: Applies to applications with business transactionality.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 25.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 25.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE25]

---

## 26. User Experience (LASRE26)

**Requirement**: The application has UX monitoring. Note: Applies to applications with business transactionality.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 26.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 26.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE26]

---

## 27. Cost Estimation (LASRE27)

**Requirement**: Has performed Dynatrace licensing cost estimation using the official calculator and has Observability team approval for coverage and/or budget allocation.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Team Lead or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 27.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 27.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE27]

---

## 28. Cost Estimation (LASRE28)

**Requirement**: Prerequisites necessary to ensure coverage of all components have been considered in the budget, such as manual code instrumentation, additional development by the provider, cloud service activation, infrastructure, among others.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Team Lead or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 28.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 28.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE28]

---

## 29. Infrastructure (LASRE29)

**Requirement**: Onpremise or cloud servers of the application have Dynatrace agent installed (OneAgent).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Platform Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 29.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 29.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE29]

---

## 30. Infrastructure (LASRE30)

**Requirement**: Containers (OpenShift/AKS/EKS/GKE) have Dynatrace Operator/OneAgent deployed.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Platform Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 30.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 30.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE30]

---

## 31. Infrastructure (LASRE31)

**Requirement**: Onpremise and/or cloud dependencies like DB, load balancers, Redis, frontdoor, etc. of the application are monitored.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Platform Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 31.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 31.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE31]

---

## 32. Batch Processing (LASRE32)

**Requirement**: Has monitoring of batch processes not managed by Control-M.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 32.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 32.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE32]

---

## 33. Application Deployment (LASRE33)

**Requirement**: Consistency between applications and their source code will be ensured through automated deployment and configuration processes.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 33.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 33.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE33]

---

## 34. Disaster Recovery (LASRE34)

**Requirement**: Must have automation of the Disaster Recovery process.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Business Continuity Manager or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 34.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 34.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE34]

---

## 35. Disaster Recovery (LASRE35)

**Requirement**: Must have automation of the process to validate the state of what is required to start the application at the Alternate Site.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Business Continuity Manager or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 35.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 35.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE35]

---

## 36. Application Operational Tasks (LASRE36)

**Requirement**: Must have an automated process for managing application services (start, stop, restart).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: **BLOCKER** (Blocking - Must Pass)

### 36.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Implemented and documented. If Non-Compliant: Not implemented. If Not Applicable: N/A. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement in ARCHITECTURE.md Section 10 or 11]

### 36.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LASRE36]

---

## 37. Log Management (LASRE37)

**Requirement**: Generated logs must be centralized in an analysis or monitoring tool, such as Dynatrace or Splunk, to facilitate their management, consultation, and analysis.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE37]

---

## 38. Log Management (LASRE38)

**Requirement**: Operational logs must allow modification of verbosity level, thus facilitating adjustment of the amount and type of information recorded according to monitoring or diagnostic needs.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE38]

---

## 39. Configuration Management (LASRE39)

**Requirement**: Configurations must be subject to version control, ensuring that any change is recorded and can be audited or reverted if necessary.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE39]

---

## 40. Integration, Deployment and Delivery (LASRE40)

**Requirement**: Deployments of new versions will be performed gradually, using strategies such as Canary Release, to minimize risks and ensure a controlled transition before applying changes to all users.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE40]

---

## 41. Integration, Deployment and Delivery (LASRE41)

**Requirement**: Appropriate traffic management strategies will be applied to the application's target audience, such as the Friends & Family approach, to control access and use according to defined needs.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE41]

---

## 42. Operational Resilience (LASRE42)

**Requirement**: Will have a defined 7x24 maintenance procedure that guarantees continuous application availability, allowing preventive and corrective tasks to be performed without affecting service for users.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE42]

---

## 43. Operational Resilience (LASRE43)

**Requirement**: Must have alternative mechanisms that allow managing backend failures, such as Fallback or Circuit Breaker strategies, ensuring service continuity and resilience in case of possible interruptions.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE43]

---

## 44. Operational Resilience (LASRE44)

**Requirement**: Automatic retries and proper management of timeouts for both client and backend must be implemented, ensuring resilience and proper handling of wait or failure situations in communications.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE44]

---

## 45. Recovery and Resilience Testing (LASRE45)

**Requirement**: The application must execute chaos tests, with the objective of evaluating its resilience and recovery capacity in adverse scenarios or unexpected failures.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Business Continuity Manager or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE45]

---

## 46. Information and Architecture (LASRE46)

**Requirement**: Components involved in the application's critical journeys are identified in the C2 diagram.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Enterprise Architect or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE46]

---

## 47. Information and Architecture (LASRE47)

**Requirement**: Components involved in the application's critical journeys are identified in the C2 diagram.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Enterprise Architect or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE47]

---

## 48. Backend Application (LASRE48)

**Requirement**: Microservices and workloads contain labels that allow differentiating the application and its vital functions (for example: application name, application id, resolving group, vital function, tribe, cell, etc.).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE48]

---

## 49. Backend Application (LASRE49)

**Requirement**: Has validated with the external system provider that they have APIs that allow monitoring the state of their system/APIs synthetically.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE49]

---

## 50. Backend Application (LASRE50)

**Requirement**: Critical services have advanced monitoring configurations and threshold customization (traffic load, anomaly detection, latency, key request, etc.).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE50]

---

## 51. Backend Application (LASRE51)

**Requirement**: Application logs are correctly ingested into observability tools.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: SRE Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE51]

---

## 52. Frontend Application (LASRE52)

**Requirement**: The application allows performing synthetic validations through authentication of generic Observability user without MFA (only user and password).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Frontend SRE or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE52]

---

## 53. Infrastructure (LASRE53)

**Requirement**: Cloud components (MS Azure, GCP, AWS) of the application are tagged at the source for easy identification.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Platform Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE53]

---

## 54. Infrastructure (LASRE54)

**Requirement**: Has health or state detection of critical processes or OS services (process group) on hosts.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Platform Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE54]

---

## 55. Application Operational Tasks (LASRE55)

**Requirement**: Must have generation of reports on application components.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE55]

---

## 56. Application Operational Tasks (LASRE56)

**Requirement**: Will have an automated process to sanitize or copy data to previous environments.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: DevOps Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE56]

---

## 57. Auto-remediation (LASRE57)

**Requirement**: Will have automation to remediate application failures automatically.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: Automation Engineer or N/A
**Criticality**: DESIRED (Optional Enhancement)

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Brief explanation]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant: Optional enhancement - consider implementing]

**Source References**: [ARCHITECTURE.md sections used for LASRE57]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**SRE Architecture Terms**:
- **SLO (Service Level Objective)**: Target level of service reliability agreed upon between service provider and users
- **SLI (Service Level Indicator)**: Quantifiable measure of service performance (e.g., latency, availability, error rate)
- **Error Budget**: Maximum allowable downtime or errors before SLO is violated
- **Golden Signals**: Core monitoring metrics (latency, traffic, errors, saturation)
- **Observability**: Ability to understand system internal state from external outputs (logs, metrics, traces)
- **MTTR (Mean Time To Recovery)**: Average time to restore service after incident
- **MTBF (Mean Time Between Failures)**: Average time between system failures
- **Toil**: Manual, repetitive operational work that should be automated
- **Incident Management**: Process for responding to service disruptions
- **Blameless Postmortem**: Retrospective analysis focusing on systemic improvements, not individual blame

<!-- @include shared/fragments/status-codes.md -->

**SRE Abbreviations**:
- **LASRE**: SRE Architecture compliance requirement code
- **RED**: Rate, Errors, Duration (monitoring methodology)
- **USE**: Utilization, Saturation, Errors (resource monitoring)
- **APM**: Application Performance Monitoring
- **RCA**: Root Cause Analysis

---

<!-- @include-with-config shared/sections/validation-methodology.md config=sre-architecture -->

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common SRE Architecture Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| SLO definitions not documented | LASRE1 Non-Compliant | Section 10 (Performance Requirements) | Define SLOs with targets (e.g., 99.9% availability, p99 latency < 200ms) |
| Error budget policy missing | LASRE1 Non-Compliant | Section 10 (Performance) | Document error budget calculation and consumption policies |
| Incident response plan undefined | LASRE2 Non-Compliant | Section 11 (Operational → Incident Management) | Define on-call rotation, escalation paths, runbooks |
| Observability stack not specified | LASRE3 Unknown | Section 11 (Operational Considerations) | Specify monitoring tools (Prometheus, Grafana, Datadog, etc.) |
| Deployment automation undefined | LASRE4 Unknown | Section 11 (Operational → Deployment) | Document CI/CD pipeline, rollback procedures, canary releases |
| Load testing strategy missing | LASRE5 Unknown | Section 10 (Performance) | Specify load test scenarios, tools, and acceptance criteria |
| Runbook repository not specified | LASRE2 Unknown | Section 11 (Operational → Incident Management) | Define runbook location, format, maintenance process |
| Chaos engineering not documented | LASRE5 Unknown | Section 10 or 11 (Performance/Operational) | Specify chaos experiments, tools (Chaos Monkey, Gremlin), frequency |

---


#### A.3.2 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required SRE fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all operational procedures

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete SLO and Reliability Engineering** (estimated impact: +0.6 points)
   - Define SLOs with quantitative targets (availability, latency, throughput) in Section 10
   - Document error budget calculation and consumption policy in Section 10
   - Add load testing strategy with tools, scenarios, acceptance criteria in Section 10
   - Specify chaos engineering experiments and frequency in Section 10 or 11
   - Define capacity planning process with growth projections in Section 11

2. **Enhance Incident Management and Operations** (estimated impact: +0.3 points)
   - Document incident response plan: on-call rotation, escalation, runbooks in Section 11
   - Add runbook repository with location, format, maintenance process
   - Define postmortem process with RCA template and timeline
   - Specify observability stack: metrics (Prometheus), logs (ELK), traces (Jaeger) in Section 11
   - Add alerting strategy with severity levels and escalation in Section 11

3. **Improve Deployment and Automation** (estimated impact: +0.2 points)
   - Document CI/CD pipeline with automated testing in Section 11
   - Define deployment strategies: blue-green, canary, feature flags in Section 11
   - Add rollback procedures with automated triggers on SLO breach
   - Specify toil reduction initiatives and automation targets in Section 11
   - Document change management process with approval gates in Section 11

**Priority Order**: LASRE1 (SLOs + error budgets) → LASRE2 (incident response) → LASRE3 (observability) → LASRE4 (deployment) → LASRE5 (load testing + chaos)

**Estimated Final Score After Remediation**: 8.5-9.0/10 (AUTO_APPROVE)

---

### A.4 Change History

**Version 2.0 (Current)**:
- Complete template restructuring to Version 2.0 format
- Added comprehensive Appendix with A.1-A.4 subsections
- Replaced "Recommendations" section with "Missing Data Requiring Attention" table
- Added Data Extracted Successfully section
- Added Not Applicable Items section
- Added Unknown Status Items Requiring Investigation table
- Expanded Generation Metadata
- Aligned with Cloud Architecture template structure
- Total: 36+ validation data points across SRE practices

**Version 1.0 (Previous)**:
- Basic appendix with source references
- Recommendations-based approach
- Limited structure

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=sre-architecture -->

---

<!-- @include-with-config shared/sections/questions-gaps-register-template.md config=sre-architecture -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=sre-architecture -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.
