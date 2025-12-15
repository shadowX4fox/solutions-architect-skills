# Compliance Contract: Enterprise Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 2, 3, 4, 5, 6, 7, 8, 9, 12)
**Version**: 2.0

---

<!-- @include-with-config shared/sections/document-control.md config=enterprise-architecture -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=enterprise-architecture -->

<!-- @include shared/fragments/compliance-score-calculation.md -->

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAE1 | Modularity and Capability Reusability | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Enterprise Architect or N/A] |
| LAE2 | Third-Party Application Customization | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Technical Architect / Product Manager or N/A] |
| LAE3 | Cloud First | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Cloud Architect / Enterprise Architect or N/A] |
| LAE4 | Business Strategy Alignment | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Enterprise Architect / Business Analyst or N/A] |
| LAE5 | Zero Obsolescence | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Enterprise Architect / Technical Lead or N/A] |
| LAE6 | Managed Data Vision | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect / Data Governance Lead or N/A] |
| LAE7 | API First / Event Driven | Enterprise Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect / API Lead or N/A] |

<!-- @include shared/fragments/compliance-summary-footer.md -->

---

## 1. Modularity and Capability Reusability (LAE1)

**Requirement**: Ensure no redundancy of capabilities through capability map review and application coverage analysis.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Enterprise Architect or N/A]

### 1.1 Capability Map Review

**Business Capabilities Addressed**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business capabilities documented. If Non-Compliant: Capabilities not specified in ARCHITECTURE.md. If Not Applicable: Not required for this solution type. If Unknown: Capabilities mentioned but not clearly mapped]
- Source: [ARCHITECTURE.md Section 2.2 (Functional Requirements) or Section 3.1 (Use Cases) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Map solution capabilities to enterprise capability model in Section 2 or 3]

**Capability Redundancy Analysis**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Redundancy check documented. If Non-Compliant: No analysis of existing capabilities. If Not Applicable: Greenfield solution. If Unknown: Existing systems mentioned but overlap unclear]
- Source: [ARCHITECTURE.md Section 5 (Current State / Existing Systems) or Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document analysis of existing systems providing similar capabilities and justify new development in Section 5 or 12]

**Reusability Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Reuse strategy documented. If Non-Compliant: No evaluation of existing components. If Not Applicable: N/A. If Unknown: Reusability mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture) or Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document which existing enterprise components/services are reused vs. newly built in Section 4 or 12]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE1]

---

### 1.2 Application Coverage Analysis

**Existing Application Landscape**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Application inventory documented. If Non-Compliant: Existing applications not identified. If Not Applicable: N/A. If Unknown: Applications mentioned but coverage unclear]
- Source: [ARCHITECTURE.md Section 5 (Current State) or "Not documented"]
- Note: [If Non-Compliant or Unknown: List existing applications in the capability domain and their coverage in Section 5]

**Coverage Gap Analysis**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Gaps documented. If Non-Compliant: Gap analysis not performed. If Not Applicable: N/A. If Unknown: Gaps mentioned but not quantified]
- Source: [ARCHITECTURE.md Section 5 or Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document functional gaps that justify this solution in Section 5 or 12]

**Application Rationalization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Rationalization plan documented. If Non-Compliant: No consolidation strategy. If Not Applicable: No existing applications to rationalize. If Unknown: Decommissioning mentioned but timeline unclear]
- Source: [ARCHITECTURE.md Section 7 (Migration and Transition) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document which legacy applications will be retired or consolidated in Section 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE1]

---

### 1.3 Redundancy Assessment

**Duplicate Functionality Check**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Duplication analysis documented. If Non-Compliant: No check for overlapping functionality. If Not Applicable: N/A. If Unknown: Similar systems mentioned but overlap not analyzed]
- Source: [ARCHITECTURE.md Section 5 or Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document any functional overlap with existing systems and justify in Section 5 or 12]

**Consolidation Opportunities**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Consolidation assessed. If Non-Compliant: No evaluation of consolidation potential. If Not Applicable: N/A. If Unknown: Integration mentioned but consolidation unclear]
- Source: [ARCHITECTURE.md Section 7 or Section 12 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify opportunities to consolidate capabilities instead of building new in Section 7 or 12]

**Architectural Patterns for Reusability**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Modular patterns documented. If Non-Compliant: No modular design approach. If Not Applicable: N/A. If Unknown: Architecture mentioned but modularity unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document microservices, shared libraries, or component reuse patterns in Section 4]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE1]

---

## 2. Third-Party Application Customization (LAE2)

**Requirement**: Confirm third-party application customizations are only for regulatory needs and part of the product.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Technical Architect / Product Manager or N/A]

### 2.1 Third-Party Application Inventory

**Third-Party Applications Used**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party products documented. If Non-Compliant: Third-party components not identified. If Not Applicable: No third-party applications. If Unknown: Vendors mentioned but products unclear]
- Source: [ARCHITECTURE.md Section 6 (Technology Stack) or Section 4 (Meta Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: List all third-party applications/products (COTS, SaaS) in Section 6 or 4]

**Product Versions and Editions**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Versions documented. If Non-Compliant: Versions not specified. If Not Applicable: N/A. If Unknown: Products mentioned but versions unclear]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify exact versions and editions of third-party products in Section 6]

**Licensing Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Licensing documented. If Non-Compliant: License type not specified. If Not Applicable: N/A. If Unknown: Licensing mentioned but terms unclear]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document licensing model (subscription, perpetual, usage-based) in Section 6]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE2]

---

### 2.2 Customization Justification

**Customizations Applied**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Customizations documented. If Non-Compliant: Customizations not specified. If Not Applicable: No customizations (vanilla deployment). If Unknown: Customization mentioned but details unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document all customizations to third-party products in Section 4 or 12]

**Regulatory Compliance Justification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Regulatory need documented. If Non-Compliant: Customizations not justified by regulatory requirements. If Not Applicable: No customizations. If Unknown: Compliance mentioned but link to customizations unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Compliance) or Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Justify each customization with specific regulatory requirement (GDPR, local regulations) in Section 9 or 12]

**Product Roadmap Alignment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Future product features assessed. If Non-Compliant: No evaluation of vendor roadmap. If Not Applicable: N/A. If Unknown: Vendor capabilities mentioned but future unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify customizations will be part of vendor's product in Section 12]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE2]

---

### 2.3 Product Integration Strategy

**Configuration vs. Customization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Configuration approach documented. If Non-Compliant: No distinction between config and custom code. If Not Applicable: N/A. If Unknown: Implementation mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 8 (Deployment) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document which changes use native configuration vs. custom development in Section 4 or 8]

**Upgrade Impact Analysis**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Upgrade strategy documented. If Non-Compliant: Upgrade impact not assessed. If Not Applicable: N/A. If Unknown: Upgrades mentioned but process unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Excellence) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document how customizations affect product upgrades in Section 11]

**Vendor Support Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Support coverage documented. If Non-Compliant: Support model not specified. If Not Applicable: N/A. If Unknown: Support mentioned but coverage unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Clarify whether customizations void vendor support in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE2]

---

## 3. Cloud First (LAE3)

**Requirement**: Demonstrate solutions are designed and deployed cloud-first using native cloud services.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Cloud Architect / Enterprise Architect or N/A]

### 3.1 Cloud Deployment Model

**Cloud-First Commitment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Cloud deployment confirmed. If Non-Compliant: On-premise or hybrid deployment. If Not Applicable: Legacy system exception. If Unknown: Deployment model unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture) or Section 8 (Deployment) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Confirm cloud deployment or provide exception justification in Section 4 or 8]

**Cloud Provider**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Provider documented. If Non-Compliant: Cloud provider not specified. If Not Applicable: N/A. If Unknown: Cloud mentioned but provider unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 8 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify primary cloud provider (AWS, Azure, GCP, etc.) in Section 4 or 8]

**Cloud Service Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service model documented (IaaS/PaaS/SaaS). If Non-Compliant: Service model not specified. If Not Applicable: N/A. If Unknown: Cloud services mentioned but model unclear]
- Source: [ARCHITECTURE.md Section 4 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define whether using IaaS, PaaS, or SaaS in Section 4]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE3]

---

### 3.2 Native Cloud Services Usage

**Managed Services Adoption**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Managed services documented. If Non-Compliant: Self-managed infrastructure instead of managed services. If Not Applicable: N/A. If Unknown: Services mentioned but management model unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 6 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Prefer managed services (RDS, DynamoDB, Cloud SQL) over self-managed databases in Section 4 or 6]

**Cloud-Native Components**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Native services documented. If Non-Compliant: Non-cloud-native tools used. If Not Applicable: N/A. If Unknown: Components mentioned but cloud-native status unclear]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document use of native cloud services (Lambda, Cloud Functions, etc.) in Section 6]

**Serverless Architecture**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Serverless adoption documented. If Non-Compliant: Traditional server-based deployment. If Not Applicable: Serverless not suitable. If Unknown: Architecture mentioned but serverless usage unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 8 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Evaluate serverless options (Lambda, Cloud Functions, Cloud Run) in Section 4 or 8]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE3]

---

### 3.3 Cloud-First Architecture Compliance

**On-Premise Dependencies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: No on-prem dependencies or justified. If Non-Compliant: Unnecessary on-premise dependencies. If Not Applicable: Pure cloud solution. If Unknown: Dependencies mentioned but scope unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 5 (Current State) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Minimize on-premise dependencies or justify exceptions in Section 4 or 5]

**Cloud Migration Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Migration approach documented. If Non-Compliant: No migration plan for legacy components. If Not Applicable: Greenfield cloud solution. If Unknown: Migration mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 7 (Migration and Transition) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document cloud migration approach (rehost/replatform/refactor) in Section 7]

**Cloud-First Decision Framework**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Cloud-first rationale documented. If Non-Compliant: No justification for cloud approach. If Not Applicable: N/A. If Unknown: Cloud mentioned but decision process unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add ADR explaining cloud-first design decisions in Section 12]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE3]

---

## 4. Business Strategy Alignment (LAE4)

**Requirement**: Show alignment with business strategy and value generation.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Enterprise Architect / Business Analyst or N/A]

### 4.1 Business Strategy Alignment

**Strategic Objectives Addressed**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business objectives documented. If Non-Compliant: Strategic alignment not specified. If Not Applicable: N/A. If Unknown: Objectives mentioned but link unclear]
- Source: [ARCHITECTURE.md Section 2.1 (Business Objectives) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Map solution to enterprise strategic goals in Section 2.1]

**Business Case**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business justification documented. If Non-Compliant: No business case provided. If Not Applicable: N/A. If Unknown: Justification mentioned but incomplete]
- Source: [ARCHITECTURE.md Section 2.1 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document ROI, cost-benefit analysis, or strategic value in Section 2.1]

**Stakeholder Alignment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Key stakeholders identified. If Non-Compliant: Stakeholders not documented. If Not Applicable: N/A. If Unknown: Stakeholders mentioned but roles unclear]
- Source: [ARCHITECTURE.md Section 2 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify business sponsors and key stakeholders in Section 2]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE4]

---

### 4.2 Value Generation Metrics

**Success Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: KPIs documented. If Non-Compliant: Success criteria not defined. If Not Applicable: N/A. If Unknown: Metrics mentioned but not quantified]
- Source: [ARCHITECTURE.md Section 2.3 (Success Criteria) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define measurable success criteria in Section 2.3]

**Business Value Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Value metrics documented. If Non-Compliant: Business value not quantified. If Not Applicable: N/A. If Unknown: Value mentioned but not measured]
- Source: [ARCHITECTURE.md Section 2.1 or Section 2.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Quantify expected business value (revenue, cost savings, efficiency) in Section 2.1 or 2.3]

**Performance Indicators**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Performance targets documented. If Non-Compliant: No performance KPIs. If Not Applicable: N/A. If Unknown: Performance mentioned but targets unclear]
- Source: [ARCHITECTURE.md Section 10 (Performance Requirements) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define technical KPIs that support business outcomes in Section 10]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE4]

---

### 4.3 Strategic Initiatives Mapping

**Enterprise Initiatives**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Strategic initiatives mapped. If Non-Compliant: No connection to enterprise programs. If Not Applicable: Standalone solution. If Unknown: Initiatives mentioned but mapping unclear]
- Source: [ARCHITECTURE.md Section 2 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Map to enterprise transformation initiatives or strategic programs in Section 2]

**Digital Transformation Alignment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Transformation role documented. If Non-Compliant: Digital strategy not addressed. If Not Applicable: N/A. If Unknown: Transformation mentioned but role unclear]
- Source: [ARCHITECTURE.md Section 2 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Explain how solution supports digital transformation strategy in Section 2]

**Long-Term Roadmap**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Future evolution documented. If Non-Compliant: No strategic roadmap. If Not Applicable: N/A. If Unknown: Roadmap mentioned but timeline unclear]
- Source: [ARCHITECTURE.md Section 2 or Section 7 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document planned evolution aligned with business strategy in Section 2 or 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE4]

---

## 5. Zero Obsolescence (LAE5)

**Requirement**: Ensure no component reaches end-of-support within 24-36 months.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Enterprise Architect / Technical Lead or N/A]

### 5.1 Component Lifecycle Assessment

**Technology Stack Versions**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Component versions documented. If Non-Compliant: Versions not specified. If Not Applicable: N/A. If Unknown: Technologies mentioned but versions unclear]
- Source: [ARCHITECTURE.md Section 6 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document specific versions of all technologies in Section 6]

**Vendor Support Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Support timelines verified. If Non-Compliant: Support status not checked. If Not Applicable: N/A. If Unknown: Support mentioned but dates unclear]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify vendor support end dates for all components in Section 6]

**Open Source Project Health**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Project viability assessed. If Non-Compliant: OSS health not evaluated. If Not Applicable: No open source dependencies. If Unknown: Projects mentioned but health unclear]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Assess community activity and maintenance status of OSS components in Section 6]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE5]

---

### 5.2 End-of-Support Timeline

**Component EOL Dates**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: EOL dates documented and >36 months. If Non-Compliant: Components EOL within 24-36 months. If Not Applicable: N/A. If Unknown: EOL not verified]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document end-of-life dates for all critical components in Section 6]

**Operating System Lifecycle**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: OS support verified. If Non-Compliant: OS nearing EOL. If Not Applicable: Serverless/PaaS deployment. If Unknown: OS mentioned but lifecycle unclear]
- Source: [ARCHITECTURE.md Section 6 or Section 8 (Deployment) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify OS versions have 36+ months support remaining in Section 6 or 8]

**Database and Middleware Support**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database/middleware support confirmed. If Non-Compliant: Versions nearing EOL. If Not Applicable: Managed services with auto-upgrade. If Unknown: Versions mentioned but support unclear]
- Source: [ARCHITECTURE.md Section 6 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document database and middleware support timelines in Section 6]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE5]

---

### 5.3 Upgrade Roadmap

**Version Upgrade Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Upgrade plan documented. If Non-Compliant: No upgrade strategy. If Not Applicable: N/A. If Unknown: Upgrades mentioned but plan unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Excellence) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document upgrade approach and frequency in Section 11]

**Technology Refresh Cycle**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Refresh cycle defined. If Non-Compliant: No technology refresh plan. If Not Applicable: N/A. If Unknown: Maintenance mentioned but cycle unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define periodic technology review and upgrade cycle in Section 11]

**Migration Path for Expiring Components**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Migration plan documented. If Non-Compliant: No plan for EOL components. If Not Applicable: All components have long support. If Unknown: Replacement mentioned but plan unclear]
- Source: [ARCHITECTURE.md Section 7 (Migration and Transition) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document replacement strategy for components nearing EOL in Section 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE5]

---

## 6. Managed Data Vision (LAE6)

**Requirement**: Optimize data management and governance (roles, regulations, storage, backup, integrity, lifecycle).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Data Governance Lead or N/A]

### 6.1 Data Governance Framework

**Data Ownership and Stewardship**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data owners identified. If Non-Compliant: Ownership not defined. If Not Applicable: No data management. If Unknown: Roles mentioned but responsibilities unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 (Security Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data owners and stewards for each data domain in Section 4 or 9]

**Data Classification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data classification documented. If Non-Compliant: Classification not performed. If Not Applicable: N/A. If Unknown: Data types mentioned but classification unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Classify data by sensitivity (public, internal, confidential, restricted) in Section 9]

**Regulatory Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data regulations documented. If Non-Compliant: Regulatory requirements not addressed. If Not Applicable: No regulated data. If Unknown: Regulations mentioned but compliance unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Compliance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document GDPR, CCPA, or industry-specific data regulations in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE6]

---

### 6.2 Data Lifecycle Management

**Data Storage Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Storage approach documented. If Non-Compliant: Storage strategy not defined. If Not Applicable: N/A. If Unknown: Storage mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 6 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define hot/warm/cold storage tiers and retention in Section 4 or 6]

**Data Retention Policies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retention rules documented. If Non-Compliant: No retention policy. If Not Applicable: N/A. If Unknown: Retention mentioned but periods unclear]
- Source: [ARCHITECTURE.md Section 9 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document retention periods by data type in Section 9 or 11]

**Data Archival and Deletion**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Archival process documented. If Non-Compliant: No archival/deletion strategy. If Not Applicable: N/A. If Unknown: Lifecycle mentioned but process unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define archival triggers and secure deletion procedures in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE6]

---

### 6.3 Data Quality and Integrity

**Data Quality Standards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Quality standards documented. If Non-Compliant: No quality framework. If Not Applicable: N/A. If Unknown: Quality mentioned but standards unclear]
- Source: [ARCHITECTURE.md Section 4 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data accuracy, completeness, and consistency standards in Section 4]

**Data Validation and Verification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Validation approach documented. If Non-Compliant: No validation process. If Not Applicable: N/A. If Unknown: Validation mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document input validation and data verification mechanisms in Section 4 or 9]

**Data Lineage and Traceability**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Lineage tracking documented. If Non-Compliant: No lineage management. If Not Applicable: N/A. If Unknown: Data flow mentioned but lineage unclear]
- Source: [ARCHITECTURE.md Section 4 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data lineage tracking and audit trails in Section 4]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE6]

---

### 6.4 Backup and Recovery Strategy

**Backup Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup approach documented. If Non-Compliant: No backup strategy. If Not Applicable: Stateless system. If Unknown: Backups mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 11.3 (Backup and Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define backup frequency, retention, and scope in Section 11.3]

**Recovery Time Objective (RTO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO documented. If Non-Compliant: RTO not defined. If Not Applicable: N/A. If Unknown: Recovery mentioned but RTO unclear]
- Source: [ARCHITECTURE.md Section 11.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define acceptable recovery time objective in Section 11.3]

**Recovery Point Objective (RPO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO documented. If Non-Compliant: RPO not defined. If Not Applicable: N/A. If Unknown: Data loss tolerance mentioned but RPO unclear]
- Source: [ARCHITECTURE.md Section 11.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define acceptable data loss window in Section 11.3]

**Disaster Recovery Testing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DR testing documented. If Non-Compliant: No testing plan. If Not Applicable: N/A. If Unknown: Testing mentioned but schedule unclear]
- Source: [ARCHITECTURE.md Section 11.3 or Section 11.4 (Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document DR testing frequency and procedures in Section 11.3 or 11.4]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE6]

---

## 7. API First / Event Driven (LAE7)

**Requirement**: Ensure solution design exposes APIs/events for interoperability.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / API Lead or N/A]

### 7.1 API Strategy and Design

**API Design Approach**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API-first design documented. If Non-Compliant: No API strategy. If Not Applicable: Standalone system. If Unknown: APIs mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API-first design principles in Section 4 or 9]

**API Specification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API contracts documented. If Non-Compliant: API specifications not defined. If Not Applicable: N/A. If Unknown: Endpoints mentioned but specification unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document OpenAPI/Swagger specifications or GraphQL schemas in Section 4 or 9]

**API Versioning Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Versioning approach documented. If Non-Compliant: No versioning strategy. If Not Applicable: N/A. If Unknown: Versioning mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define API versioning and deprecation strategy in Section 4 or 11]

**API Security**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API security documented. If Non-Compliant: Security not addressed. If Not Applicable: N/A. If Unknown: Security mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document OAuth2, API keys, or JWT authentication in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE7]

---

### 7.2 Event-Driven Architecture

**Event Streaming Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event platform documented. If Non-Compliant: No event-driven architecture. If Not Applicable: Request-response sufficient. If Unknown: Events mentioned but platform unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 6 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document Kafka, Event Grid, EventBridge, or Pub/Sub usage in Section 4 or 6]

**Event Schema Design**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event contracts documented. If Non-Compliant: Event schemas not defined. If Not Applicable: N/A. If Unknown: Events mentioned but schema unclear]
- Source: [ARCHITECTURE.md Section 4 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define event schema standards (CloudEvents, Avro, JSON Schema) in Section 4]

**Event Catalog**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event inventory documented. If Non-Compliant: Events not cataloged. If Not Applicable: N/A. If Unknown: Events mentioned but catalog unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document event types, publishers, and subscribers in Section 4 or 9]

**Event Replay and Debugging**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event debugging documented. If Non-Compliant: No replay capability. If Not Applicable: N/A. If Unknown: Event handling mentioned but replay unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document event replay and troubleshooting approach in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE7]

---

### 7.3 Interoperability Standards

**Integration Patterns**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Integration approach documented. If Non-Compliant: Integration patterns not defined. If Not Applicable: Standalone system. If Unknown: Integration mentioned but patterns unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document REST, GraphQL, gRPC, or messaging patterns in Section 4 or 9]

**Data Exchange Formats**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data formats documented. If Non-Compliant: Formats not standardized. If Not Applicable: N/A. If Unknown: Data exchange mentioned but formats unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Standardize on JSON, XML, Protobuf, or other formats in Section 4 or 9]

**API Gateway and Management**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API management documented. If Non-Compliant: No API gateway. If Not Applicable: Direct API exposure acceptable. If Unknown: Gateway mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API gateway for rate limiting, authentication, monitoring in Section 4 or 9]

**Third-Party Integration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: External integrations documented. If Non-Compliant: Third-party APIs not specified. If Not Applicable: No external integrations. If Unknown: Integrations mentioned but details unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 9 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document external API dependencies and integration approach in Section 4 or 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAE7]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Key Enterprise Architecture Terms**:

- **Modularity**: Design approach enabling independent development and deployment of capabilities
- **Capability Reusability**: Ability to leverage existing components across multiple solutions
- **Technology Radar**: Framework for tracking and evaluating technology maturity and adoption
- **Zero Obsolescence**: Strategy to prevent technical debt through continuous modernization
- **Managed Data Vision**: Centralized data strategy ensuring data as strategic asset
- **API First**: Design principle prioritizing API interfaces for all integrations
- **Event-Driven Architecture**: Pattern using events to trigger and communicate between services

<!-- @include shared/fragments/status-codes.md -->

**Abbreviations**:

- **LAE**: Enterprise Architecture (Lineamiento de Arquitectura Empresarial)
- **API**: Application Programming Interface
- **EDA**: Event-Driven Architecture
- **MDM**: Master Data Management
- **ESB**: Enterprise Service Bus
- **SOA**: Service-Oriented Architecture

---

### A.2 Validation Methodology

<!-- @include-with-config shared/sections/validation-methodology.md config=enterprise-architecture -->

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common Enterprise Architecture Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| Missing modularity analysis | LAE1 Non-Compliant | Section 5 (Component View) | Document component boundaries, interfaces, bounded contexts |
| No technology radar reference | LAE3 Non-Compliant | Section 8 (Technology Stack) | Align stack with approved enterprise technologies, reference radar |
| Undefined data strategy | LAE6 Non-Compliant | Section 6 (Data Model) | Document data governance, MDM, data lake/warehouse strategy |
| Missing API-first approach | LAE7 Non-Compliant | Section 7 (Integration View) | Define API strategy, event-driven patterns, integration standards |
| Strategic alignment unclear | LAE2 Unknown | Section 1 (Business Context) | Map architecture to enterprise strategic goals and objectives |
| Enterprise integration patterns undefined | LAE4 Unknown | Section 7 (Integration View) | Define integration patterns, ESB/API gateway, messaging |
| Governance framework missing | LAE5 Unknown | Section 12 (ADRs) or Section 11 | Document architectural governance, review boards, decision authority |

---

#### A.3.2 Step-by-Step Remediation Workflow

<!-- @include shared/sections/remediation-workflow-guide.md -->

**Enterprise Architecture-Specific Examples**:

**Example 1: Modularity and Bounded Contexts**
- **Gap**: Missing modularity analysis and bounded contexts
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add modularity analysis to Section 5:
   Bounded contexts: Customer, Order, Payment, Inventory, Shipping,
   Component boundaries: clear domain separation, anti-corruption layers,
   Interface definitions: REST APIs with OpenAPI specs,
   Cross-cutting concerns: logging, monitoring, security centralized,
   Domain dependencies: DAG (directed acyclic graph) with no circular refs"
  ```
- **Expected Outcome**: Section 5 with bounded contexts, boundaries, interfaces, dependencies
- **Impact**: LAE1 → Compliant (+0.6 points)

**Example 2: Technology Radar Alignment**
- **Gap**: No technology radar reference
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add technology radar alignment to Section 8:
   All technologies from enterprise radar quadrants,
   Adopt: Kubernetes, React, PostgreSQL, Kafka,
   Trial: Temporal workflow, GraphQL, Dapr,
   Assess: None (stable stack),
   Hold: Avoiding deprecated ESB, SOAP, monolithic databases,
   Radar version: Q4 2025, link to enterprise radar"
  ```
- **Expected Outcome**: Section 8 with radar alignment, quadrants, version reference
- **Impact**: LAE3 → Compliant (+0.5 points)

**Example 3: Data Strategy and Governance**
- **Gap**: Undefined data strategy
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add data strategy to Section 6:
   Data governance: centralized data governance board,
   MDM: customer and product master data in dedicated MDM system,
   Data lake: S3 with Delta Lake for raw/curated/gold zones,
   Data warehouse: Snowflake for analytics and BI,
   Data catalog: AWS Glue Data Catalog with business glossary,
   Retention: operational 30 days, analytics 7 years, GDPR compliance"
  ```
- **Expected Outcome**: Section 6 with data governance, MDM, lake/warehouse strategy, catalog
- **Impact**: LAE6 → Compliant (+0.5 points)

**Example 4: API-First and Integration Strategy**
- **Gap**: Missing API-first approach and integration patterns
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add API-first strategy to Section 7:
   API gateway: Kong for all external APIs,
   Design-first: OpenAPI specs reviewed before implementation,
   Integration patterns: REST for sync, Kafka for async/event-driven,
   Event bus: Kafka with schema registry (Avro),
   API lifecycle: design → review → implement → publish → deprecate,
   Versioning: URI versioning (/v1/, /v2/), backward compatibility required"
  ```
- **Expected Outcome**: Section 7 with API-first strategy, integration patterns, event bus
- **Impact**: LAE7 → Compliant (+0.5 points)

**Example 5: Strategic Alignment and Governance**
- **Gap**: Strategic alignment and governance framework missing
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add strategic alignment to Section 1 and governance to Section 12:
   Strategic goals: digital transformation, cloud-first, API-first,
   Business objectives: reduce time-to-market 50%, improve scalability,
   Architecture principles: align with 9 principles in Section 3,
   Governance: Enterprise Architecture Review Board (EARB),
   Decision authority: EARB for strategic, team for tactical,
   ADR process: template, review, approval, publication"
  ```
- **Expected Outcome**: Section 1 with strategic alignment, Section 12 with governance framework
- **Impact**: LAE2 + LAE5 → Compliant (+0.4 points)

---

#### A.3.3 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required enterprise architecture fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all strategic decisions

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete Strategic and Modular Architecture** (estimated impact: +0.6 points)
   - Document modularity analysis: bounded contexts, component boundaries, interfaces (Section 5)
   - Map architecture to enterprise strategic goals and business objectives (Section 1)
   - Define technology radar alignment with quadrants (Adopt, Trial, Assess, Hold) in Section 8
   - Add domain-driven design principles: aggregates, entities, value objects (Section 5 or 6)
   - Document cross-cutting concerns: logging, monitoring, security, configuration (Section 5)

2. **Establish Data and Integration Strategy** (estimated impact: +0.3 points)
   - Define data strategy: governance, MDM, data lake/warehouse (Section 6)
   - Add API-first approach: design-first, OpenAPI, lifecycle management (Section 7)
   - Document integration patterns: REST, event-driven, messaging, ESB/API gateway (Section 7)
   - Specify data catalog with business glossary and lineage (Section 6)
   - Define event-driven architecture: Kafka, schema registry, event catalog (Section 7)

3. **Enhance Governance and Standards** (estimated impact: +0.2 points)
   - Document architectural governance framework: review boards, decision authority (Section 12 or 11)
   - Add ADR process: template, review, approval, publication (Section 12)
   - Define technology standards: approved libraries, frameworks, patterns (Section 8)
   - Specify architecture compliance checks and validation gates (Section 11 or 12)
   - Add architecture evolution roadmap with milestones (Section 1 or 12)

**Priority Order**: LAE1 (modularity) → LAE3 (technology radar) → LAE6 (data strategy) → LAE7 (API-first) → LAE2 (strategic alignment) → LAE5 (governance) → LAE4 (integration patterns)

**Estimated Final Score After Remediation**: 8.3-8.8/10 (AUTO_APPROVE)

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
- Aligned with standardized template structure
- Total: 7 validation data points across LAE1-LAE7 requirements

**Version 1.0 (Previous)**:
- Initial template with minimal appendix
- Basic PLACEHOLDER approach
- Limited source traceability

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=enterprise-architecture -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=enterprise-architecture -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=enterprise-architecture -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=enterprise-architecture -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=enterprise-architecture -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.
