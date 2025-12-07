# Compliance Contract: Cloud Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 4, 8, 9, 10, 11)
**Version**: 2.0

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
- `[APPROVAL_AUTHORITY]`: "Cloud Architecture Review Board" or contract-specific authority

---

## Compliance Summary

| Code | Requirement | Status | Source Section | Responsible Role |
|------|-------------|--------|----------------|------------------|
| LAC1 | Cloud Deployment Model (IaaS, PaaS, SaaS) | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Cloud Architect or N/A] |
| LAC2 | Network Connectivity and Integration | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Network Engineer / Cloud Architect or N/A] |
| LAC3 | Security and Regulatory Compliance | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Security Architect / Compliance Officer or N/A] |
| LAC4 | Resource Monitoring and Management | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [DevOps Engineer / SRE Lead or N/A] |
| LAC5 | Backup and Recovery Policies | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Cloud Architect / Business Continuity Manager or N/A] |
| LAC6 | Cloud Best Practices Adoption | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Cloud Architect / Technical Lead or N/A] |

**Overall Compliance**: [X/6 Compliant, Y/6 Non-Compliant, Z/6 Not Applicable, W/6 Unknown]

---

## 1. Cloud Deployment Model (LAC1)

**Requirement**: Select and justify the most appropriate cloud service model (IaaS, PaaS, SaaS).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Cloud Architect or N/A]

### 1.1 Service Model Selection

**Service Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service model documented. If Non-Compliant: Service model not specified in ARCHITECTURE.md. If Not Applicable: Cloud service not used. If Unknown: Service model mentioned but not clearly defined]
- Source: [ARCHITECTURE.md Section X.Y, lines A-B or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define whether solution uses IaaS, PaaS, or SaaS and document in Section 4 or 8]

**Cloud Provider**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Provider documented. If Non-Compliant: Provider not specified. If Not Applicable: Cloud not used. If Unknown: Provider mentioned ambiguously]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify cloud provider (AWS/Azure/GCP/Other) in Section 4]

**Deployment Regions**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Regions documented. If Non-Compliant: Regions not specified. If Not Applicable: Regional deployment not required. If Unknown: Regions mentioned but not clearly identified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document primary and secondary regions in Section 4]

**Justification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Rationale provided via ADR or design decision. If Non-Compliant: No justification documented. If Not Applicable: N/A. If Unknown: Partial justification provided]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add ADR explaining why this service model was chosen, addressing alternatives and trade-offs]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAC1]

---

## 2. Network Connectivity and Integration (LAC2)

**Requirement**: Describe network integration with other platforms (e.g., Azure, AWS, On-Premise). Indicate required network segments for communication if using existing components.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Network Engineer / Cloud Architect or N/A]

### 2.1 Network Architecture

**Network Architecture**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Network design documented. If Non-Compliant: Network architecture not specified. If Not Applicable: No network integration required. If Unknown: Network mentioned but design unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document VPC/VNet configuration, subnets, routing in Section 4 or 9]

**Cloud-to-Cloud Connectivity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Multi-cloud connectivity documented. If Non-Compliant: Integration method not specified. If Not Applicable: Single cloud deployment. If Unknown: Connectivity mentioned but method unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify if using VPN, Direct Connect/ExpressRoute, or transit gateway]

**On-Premise Integration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Hybrid connectivity documented. If Non-Compliant: On-prem integration method not specified. If Not Applicable: Cloud-only solution. If Unknown: Hybrid mentioned but details unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document VPN/Direct Connect configuration and on-premise CIDR blocks in Section 4 or 9]

**Network Latency Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Latency SLOs defined. If Non-Compliant: No latency requirements specified. If Not Applicable: Latency not critical. If Unknown: Performance mentioned but no specific targets]
- Source: [ARCHITECTURE.md Section 10 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define acceptable latency thresholds (p50, p95, p99) in Section 10]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAC2]

---

## 3. Security and Regulatory Compliance (LAC3)

**Requirement**: Include network communication protocols (TLS, mTLS, etc.) in the design and ensure solution meets security and regulatory requirements.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Security Architect / Compliance Officer or N/A]

### 3.1 Network Security

**Communication Protocols**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Encryption protocols documented. If Non-Compliant: Communication security not specified. If Not Applicable: N/A. If Unknown: Security mentioned but protocols unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security → Encryption in Transit) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify TLS version, certificate management, and whether mTLS is required in Section 9 (Security Architecture → Data Security)]

**Identity and Access Management (IAM)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: IAM policies documented. If Non-Compliant: Access controls not defined. If Not Applicable: N/A. If Unknown: IAM mentioned but policies unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document RBAC policies, service accounts, and authentication methods in Section 9 (Security Architecture → Authentication & Authorization)]

**Data Encryption**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Encryption at-rest and in-transit documented. If Non-Compliant: Encryption strategy not specified. If Not Applicable: No sensitive data. If Unknown: Encryption mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify encryption methods (KMS, customer-managed keys) for data at rest and in transit in Section 9 (Security Architecture → Data Security)]

**Network Security Controls**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Security groups/NSGs documented. If Non-Compliant: Network controls not defined. If Not Applicable: N/A. If Unknown: Security mentioned but controls unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Network Security) or Section 4 (Meta Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document VPC/VNet security groups, NACLs, firewall rules in Section 9 (Security Architecture → Network Security) or Section 4]

**Regulatory Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Compliance requirements documented. If Non-Compliant: Regulatory requirements not addressed. If Not Applicable: No specific regulations apply. If Unknown: Compliance mentioned but requirements unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Compliance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify applicable regulations (GDPR, HIPAA, PCI-DSS, etc.) and compliance controls in Section 9 (Security Architecture → Compliance)]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAC3]

---

## 4. Resource Monitoring and Management (LAC4)

**Requirement**: Validate if additional components are required for monitoring in observability tools. Describe how cloud resources will be monitored and managed.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [DevOps Engineer / SRE Lead or N/A]

### 4.1 Observability Infrastructure

**Monitoring Tools**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Observability stack documented. If Non-Compliant: Monitoring tools not specified. If Not Applicable: Monitoring not required. If Unknown: Tools mentioned but not clearly identified]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify monitoring solution (CloudWatch, Azure Monitor, Datadog, Prometheus, etc.) in Section 11]

**Metrics Collection**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Key metrics defined. If Non-Compliant: Metrics not specified. If Not Applicable: N/A. If Unknown: Monitoring mentioned but metrics unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define infrastructure metrics (CPU, memory, disk, network) and application metrics in Section 11]

**Log Aggregation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Logging strategy documented. If Non-Compliant: Log management not specified. If Not Applicable: N/A. If Unknown: Logging mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document log collection, retention, and centralized logging solution in Section 11]

**Alerting Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Alert policies defined. If Non-Compliant: Alerting not configured. If Not Applicable: N/A. If Unknown: Alerts mentioned but thresholds unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define alert thresholds, escalation policies, and notification channels in Section 11]

**Cost Tracking**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Cost monitoring documented. If Non-Compliant: Cost management not addressed. If Not Applicable: N/A. If Unknown: Budgets mentioned but tracking unclear]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document cost budgets, tagging strategy, and budget alerts in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAC4]

---

## 5. Backup and Recovery Policies (LAC5)

**Requirement**: Establish procedures for data backup and recovery according to business needs.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Cloud Architect / Business Continuity Manager or N/A]

### 5.1 Backup Strategy

**Backup Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup approach documented. If Non-Compliant: Backup strategy not defined. If Not Applicable: No data persistence. If Unknown: Backups mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 11.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define backup types (full, incremental, snapshot), frequency, and retention in Section 11.3]

**Recovery Time Objective (RTO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO documented. If Non-Compliant: RTO not specified. If Not Applicable: N/A. If Unknown: Recovery mentioned but RTO unclear]
- Source: [ARCHITECTURE.md Section 11.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define RTO based on business criticality (Tier 1: 4h, Tier 2: 8h, Tier 3: 24h) in Section 11.3]

**Recovery Point Objective (RPO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO documented. If Non-Compliant: RPO not specified. If Not Applicable: N/A. If Unknown: Backup frequency mentioned but RPO unclear]
- Source: [ARCHITECTURE.md Section 11.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define maximum acceptable data loss window (e.g., 15 min, 1 hour, 24 hours) in Section 11.3]

**Multi-Region Replication**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Disaster recovery documented. If Non-Compliant: DR strategy not defined. If Not Applicable: Single region acceptable. If Unknown: Replication mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 11.4 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document cross-region replication, failover procedures, and DR testing plan in Section 11.4]

**Backup Testing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Recovery testing documented. If Non-Compliant: Testing procedures not defined. If Not Applicable: N/A. If Unknown: Testing mentioned but schedule unclear]
- Source: [ARCHITECTURE.md Section 11.3 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define backup restoration testing frequency and procedures in Section 11.3]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAC5]

---

## 6. Cloud Best Practices Adoption (LAC6)

**Requirement**: Ensure solution applies cloud-native standards for the selected cloud provider.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Cloud Architect / Technical Lead or N/A]

### 6.1 Cloud-Native Standards

**Well-Architected Framework Alignment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Framework alignment documented. If Non-Compliant: Best practices not addressed. If Not Applicable: N/A. If Unknown: Best practices mentioned but specific framework unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document alignment with AWS Well-Architected, Azure Well-Architected, or Google Cloud Architecture Framework in Section 12]

**Infrastructure as Code (IaC)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: IaC approach documented. If Non-Compliant: Infrastructure provisioning method not specified. If Not Applicable: N/A. If Unknown: Automation mentioned but tooling unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 8 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify IaC tool (Terraform, CloudFormation, ARM templates, etc.) in Section 4 or 8]

**Scalability and Elasticity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Auto-scaling documented. If Non-Compliant: Scaling strategy not defined. If Not Applicable: Fixed capacity sufficient. If Unknown: Scaling mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 10 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define auto-scaling policies, scaling triggers, and capacity limits in Section 4 or 10]

**Cost Optimization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Cost optimization strategies documented. If Non-Compliant: Cost management not addressed. If Not Applicable: N/A. If Unknown: Cost considerations mentioned but strategies unclear]
- Source: [ARCHITECTURE.md Section 4 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document reserved instances, spot instances, right-sizing strategies in Section 4 or 11]

**Organizational Cloud Standards**: [PLACEHOLDER: User must provide organizational cloud guidelines]
- Status: [Unknown]
- Explanation: Organization-specific cloud standards must be validated against this architecture
- Source: [External organizational documentation]
- Note: Validate compliance with internal cloud governance policies, naming conventions, tagging standards, and approved service catalog

**Key Guidelines Verification**:
- Cloud service model (IaaS/PaaS/SaaS) documented: [Yes/No]
- Network connectivity, security, monitoring, and backup defined: [Yes/No]
- Cloud provider best practices applied: [Yes/No]
- Infrastructure as Code implemented: [Yes/No]
- [PLACEHOLDER: Additional organizational requirements]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAC6]

---

## Appendix: Source Traceability and Completion Status

### Data Extracted Successfully
[List of all data points marked as "Compliant" with source references]

Example format:
- LAC1 - Service Model: [Value] (Source: ARCHITECTURE.md Section 4.2, lines 123-125)
- LAC2 - Network Architecture: [Value] (Source: ARCHITECTURE.md Section 9.1, lines 456-460)
- LAC3 - Communication Protocols: [Value] (Source: ARCHITECTURE.md Section 9.3, line 678)

### Missing Data Requiring Attention

| Requirement | Missing Data Point | Responsible Role | Recommended Action |
|-------------|-------------------|------------------|-------------------|
| LAC1 | [Example: Service model justification] | Cloud Architect | Add ADR to Section 12 explaining IaaS/PaaS/SaaS selection |
| LAC2 | [Example: Network latency requirements] | Network Engineer | Define latency SLOs in Section 10 |
| LAC3 | [Example: Regulatory compliance requirements] | Compliance Officer | Document applicable regulations in Section 9 |
| LAC4 | [Example: Monitoring tools] | DevOps Engineer | Specify observability stack in Section 11 |
| LAC5 | [Example: RTO/RPO values] | Business Continuity Manager | Define recovery objectives in Section 11.3 |
| LAC6 | [Example: IaC tooling] | Technical Lead | Document infrastructure automation approach in Section 4 or 8 |

### Not Applicable Items
[List of requirements marked as "Not Applicable" with justification]

Example format:
- LAC2 - On-Premise Integration: Solution is cloud-native with no hybrid connectivity required
- LAC5 - Multi-Region Replication: Business requirements accept single-region deployment

### Unknown Status Items Requiring Investigation

| Requirement | Data Point | Issue | Responsible Role | Action Needed |
|-------------|------------|-------|------------------|---------------|
| LAC1 | [Example: Deployment regions] | Regions mentioned but not clearly identified | Cloud Architect | Clarify primary and secondary regions in Section 4 |
| LAC4 | [Example: Alert thresholds] | Monitoring mentioned but no specific thresholds | SRE Lead | Define alert policies and thresholds in Section 11 |
| LAC3 | [Example: Encryption keys] | Encryption referenced but key management unclear | Security Architect | Specify KMS configuration in Section 9 |

---

## Generation Metadata

**Template Version**: 2.0 (Updated with compliance evaluation system)
**Generation Date**: [GENERATION_DATE]
**Source Document**: ARCHITECTURE.md
**Primary Source Sections**: 4 (Infrastructure), 8 (Deployment), 9 (Security), 10 (Performance), 11 (Operational Excellence), 12 (ADRs)
**Completeness**: [PERCENTAGE]% ([X/TOTAL] data points documented)
**Template Language**: English
**Compliance Framework**: LAC (Cloud Architecture Compliance) with 6 requirements
**Status Labels**: Compliant, Non-Compliant, Not Applicable, Unknown

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.