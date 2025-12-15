# Compliance Contract: Data & Analytics Architecture - AI

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 4, 5, 6, 7, 8, 9, 10, 11, 12)
**Version**: 2.0

---

<!-- @include-with-config shared/sections/document-control.md config=data-ai-architecture -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=data-ai-architecture -->

<!-- @include shared/fragments/compliance-score-calculation.md -->

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAD1 | Data Quality | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect or N/A] |
| LAD2 | Data Fabric Reuse | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect or N/A] |
| LAD3 | Data Recovery | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Business Continuity Manager or N/A] |
| LAD4 | Data Decoupling | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect or N/A] |
| LAD5 | Data Scalability | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect or N/A] |
| LAD6 | Data Integration | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Engineer or N/A] |
| LAD7 | Regulatory Compliance | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Compliance Officer or N/A] |
| LAD8 | Data Architecture Standards | Data | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect or N/A] |
| LAIA1 | AI Model Governance | AI | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [AI/ML Architect or N/A] |
| LAIA2 | AI Security and Reputation | AI | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [AI/ML Architect or N/A] |
| LAIA3 | AI Hallucination Control | AI | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [AI/ML Architect or N/A] |

<!-- @include shared/fragments/compliance-summary-footer.md -->

---

## 1. Data Quality (LAD1 - Category: Data)

**Requirement**: Implement quality control mechanisms and ensure data completeness throughout the data lifecycle.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Data Engineer or N/A]

### 1.1 Data Quality Control Mechanisms

**Quality Validation Framework**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Quality framework documented in ARCHITECTURE.md. If Non-Compliant: Quality control mechanisms not specified. If Not Applicable: Data quality not applicable. If Unknown: Quality mentioned but framework unclear]
- Source: [ARCHITECTURE.md Section X.Y, lines A-B or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data quality validation framework including profiling, validation rules, and cleansing processes in Section 5 or 6]

**Data Profiling Approach**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data profiling approach documented. If Non-Compliant: Profiling strategy not specified. If Not Applicable: N/A. If Unknown: Profiling mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data profiling strategy, tools, and frequency in Section 6]

**Anomaly Detection Methods**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Anomaly detection documented. If Non-Compliant: Detection methods not specified. If Not Applicable: N/A. If Unknown: Anomaly detection mentioned but methods unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify anomaly detection algorithms, thresholds, and response procedures in Section 5 or 11]

### 1.2 Data Completeness Tracking

**Completeness Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Completeness metrics defined. If Non-Compliant: Metrics not specified. If Not Applicable: N/A. If Unknown: Completeness mentioned but metrics unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define completeness thresholds and measurement methods in Section 10 or 11]

**Data Quality SLOs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Quality SLOs documented. If Non-Compliant: SLOs not defined. If Not Applicable: N/A. If Unknown: Quality targets mentioned but SLOs unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data quality service level objectives in Section 10]

**Completeness Monitoring**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Monitoring approach documented. If Non-Compliant: Monitoring not specified. If Not Applicable: N/A. If Unknown: Monitoring mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document completeness monitoring dashboards and alerting in Section 11]

### 1.3 Data Validation and Cleansing

**Validation Rules**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Validation rules documented. If Non-Compliant: Rules not specified. If Not Applicable: N/A. If Unknown: Validation mentioned but rules unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define validation rules, constraints, and business logic in Section 6]

**Cleansing Processes**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Cleansing processes documented. If Non-Compliant: Processes not specified. If Not Applicable: N/A. If Unknown: Cleansing mentioned but processes unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data cleansing workflows, transformation rules, and remediation procedures in Section 6]

**Rejection Handling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Rejection handling documented. If Non-Compliant: Handling not specified. If Not Applicable: N/A. If Unknown: Rejection mentioned but handling unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define rejection criteria, quarantine processes, and notification mechanisms in Section 6]

### 1.4 Data Quality Monitoring

**Quality Dashboards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Dashboards documented. If Non-Compliant: Dashboards not specified. If Not Applicable: N/A. If Unknown: Monitoring mentioned but dashboards unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify quality monitoring dashboards, metrics, and visualizations in Section 11]

**Alerting Thresholds**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Alert thresholds documented. If Non-Compliant: Thresholds not defined. If Not Applicable: N/A. If Unknown: Alerting mentioned but thresholds unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define alert thresholds for quality metrics and escalation procedures in Section 11]

**Remediation Workflows**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Remediation workflows documented. If Non-Compliant: Workflows not specified. If Not Applicable: N/A. If Unknown: Remediation mentioned but workflows unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document quality issue remediation workflows and ownership in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD1]

---

## 2. Data Fabric Reuse (LAD2 - Category: Data)

**Requirement**: Verify that integration and availability mechanisms in the Data Fabric can be reused, including SOR ingestion and Data Product consumption.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Integration Lead or N/A]

### 2.1 Data Fabric Integration

**Data Fabric Connectivity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data Fabric connectivity documented. If Non-Compliant: Connectivity not specified. If Not Applicable: Data Fabric not used. If Unknown: Connection mentioned but details unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document Data Fabric integration endpoints, authentication, and network connectivity in Section 7]

**Ingestion Patterns**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Ingestion patterns documented. If Non-Compliant: Patterns not specified. If Not Applicable: N/A. If Unknown: Ingestion mentioned but patterns unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define reusable ingestion patterns (batch, streaming, CDC) in Section 6]

**Reusable Components**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Reusable components identified. If Non-Compliant: Components not specified. If Not Applicable: N/A. If Unknown: Components mentioned but reusability unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify reusable Data Fabric components and libraries in Section 5 or 8]

### 2.2 SOR (System of Record) Ingestion

**SOR Integration Method**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: SOR integration method documented. If Non-Compliant: Method not specified. If Not Applicable: No SOR integration. If Unknown: Integration mentioned but method unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document SOR integration approach, protocols, and connectors in Section 7]

**Ingestion Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Ingestion frequency documented. If Non-Compliant: Frequency not specified. If Not Applicable: N/A. If Unknown: Ingestion mentioned but frequency unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define ingestion schedules and real-time vs batch strategies in Section 6]

**Data Lineage Tracking**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Lineage tracking documented. If Non-Compliant: Tracking not specified. If Not Applicable: N/A. If Unknown: Lineage mentioned but tracking unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data lineage tracking mechanisms and tools in Section 6 or 8]

### 2.3 Data Product Consumption

**Data Product Catalog Access**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Catalog access documented. If Non-Compliant: Access not specified. If Not Applicable: No data product catalog. If Unknown: Catalog mentioned but access unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data product catalog access methods and permissions in Section 7]

**Consumption APIs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Consumption APIs documented. If Non-Compliant: APIs not specified. If Not Applicable: N/A. If Unknown: APIs mentioned but details unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data product consumption APIs, contracts, and rate limits in Section 7]

**Usage Patterns**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Usage patterns documented. If Non-Compliant: Patterns not specified. If Not Applicable: N/A. If Unknown: Usage mentioned but patterns unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data product usage patterns and consumption workflows in Section 6]

### 2.4 Reusability Assessment

**Existing Component Reuse**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Component reuse documented. If Non-Compliant: Reuse assessment not performed. If Not Applicable: No existing components. If Unknown: Reuse mentioned but assessment unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document assessment of existing Data Fabric component reusability in Section 5]

**New Component Justification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Justification for new components documented. If Non-Compliant: Justification not provided. If Not Applicable: Only reusing existing components. If Unknown: New components mentioned but justification unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Justify any new components when existing Data Fabric capabilities are available in Section 12 (ADRs)]

**Integration Standards Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Standards compliance documented. If Non-Compliant: Compliance not assessed. If Not Applicable: N/A. If Unknown: Standards mentioned but compliance unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document compliance with organizational Data Fabric integration standards in Section 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD2]

---

## 3. Data Recovery (LAD3 - Category: Data)

**Requirement**: Define recovery processes according to the Proposed Architecture, including recovery in case of main process failures.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Business Continuity Manager or N/A]

### 3.1 Recovery Processes

**Recovery Procedures**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Recovery procedures documented. If Non-Compliant: Procedures not defined. If Not Applicable: Recovery not required. If Unknown: Recovery mentioned but procedures unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define step-by-step recovery procedures for data pipelines and storage in Section 11.3 or 11.4]

**Failover Mechanisms**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Failover mechanisms documented. If Non-Compliant: Mechanisms not specified. If Not Applicable: N/A. If Unknown: Failover mentioned but mechanisms unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document automated failover mechanisms for data processing and storage in Section 11.4]

**Restoration Workflows**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Restoration workflows documented. If Non-Compliant: Workflows not defined. If Not Applicable: N/A. If Unknown: Restoration mentioned but workflows unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data restoration workflows and validation procedures in Section 11.3]

### 3.2 Recovery Time Objectives (RTO)

**RTO Targets**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO targets documented. If Non-Compliant: RTO not defined. If Not Applicable: RTO not applicable. If Unknown: Recovery time mentioned but RTO unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define RTO targets for critical data pipelines and storage systems in Section 11.3]

**Recovery Priority Tiers**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Priority tiers documented. If Non-Compliant: Tiers not defined. If Not Applicable: N/A. If Unknown: Prioritization mentioned but tiers unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define recovery priority tiers (Tier 1/2/3) based on business criticality in Section 11.3]

**Recovery Automation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Automation documented. If Non-Compliant: Automation not specified. If Not Applicable: Manual recovery only. If Unknown: Automation mentioned but details unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document automated recovery capabilities and manual intervention points in Section 11.3 or 11.4]

### 3.3 Recovery Point Objectives (RPO)

**RPO Targets**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO targets documented. If Non-Compliant: RPO not defined. If Not Applicable: RPO not applicable. If Unknown: Data loss tolerance mentioned but RPO unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define RPO targets (maximum acceptable data loss window) in Section 11.3]

**Data Loss Tolerance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data loss tolerance documented. If Non-Compliant: Tolerance not specified. If Not Applicable: N/A. If Unknown: Tolerance mentioned but thresholds unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document acceptable data loss thresholds for different data tiers in Section 11.3]

**Backup Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup frequency documented. If Non-Compliant: Frequency not specified. If Not Applicable: Backups not required. If Unknown: Backups mentioned but frequency unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define backup frequency (continuous, hourly, daily) aligned with RPO targets in Section 11.3]

### 3.4 Failure Scenario Planning

**Main Process Failure Scenarios**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Failure scenarios documented. If Non-Compliant: Scenarios not identified. If Not Applicable: N/A. If Unknown: Failures mentioned but scenarios unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify main data pipeline and processing failure scenarios in Section 11.4]

**Mitigation Strategies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Mitigation strategies documented. If Non-Compliant: Strategies not defined. If Not Applicable: N/A. If Unknown: Mitigation mentioned but strategies unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document failure mitigation strategies (redundancy, replication, circuit breakers) in Section 11.4]

**Recovery Testing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Recovery testing documented. If Non-Compliant: Testing not specified. If Not Applicable: N/A. If Unknown: Testing mentioned but procedures unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define recovery testing frequency and procedures (quarterly DR drills) in Section 11.3]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD3]

---

## 4. Data Decoupling (LAD4 - Category: Data)

**Requirement**: Ensure separation of capabilities (ingestion, processing, storage, delivery) and separation of storage layer from processing layer.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Solution Architect or N/A]

### 4.1 Capability Separation

**Ingestion Decoupling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Ingestion decoupling documented. If Non-Compliant: Ingestion not decoupled. If Not Applicable: Single monolithic pipeline. If Unknown: Separation mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document separate ingestion layer with clear interfaces in Section 5 or 6]

**Processing Decoupling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Processing decoupling documented. If Non-Compliant: Processing not decoupled. If Not Applicable: N/A. If Unknown: Separation mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document separate processing layer independent of ingestion and storage in Section 5 or 6]

**Storage Decoupling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Storage decoupling documented. If Non-Compliant: Storage tightly coupled. If Not Applicable: N/A. If Unknown: Separation mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document storage layer abstraction and independence from processing in Section 5 or 8]

**Delivery Decoupling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Delivery decoupling documented. If Non-Compliant: Delivery not decoupled. If Not Applicable: N/A. If Unknown: Separation mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document separate data delivery layer (APIs, exports) in Section 5 or 7]

### 4.2 Storage-Processing Separation

**Storage Layer Independence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Storage independence documented. If Non-Compliant: Storage coupled to processing. If Not Applicable: N/A. If Unknown: Independence mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document storage layer that can scale independently of processing in Section 8]

**Processing Layer Independence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Processing independence documented. If Non-Compliant: Processing coupled to storage. If Not Applicable: N/A. If Unknown: Independence mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document processing layer that can scale independently of storage in Section 5]

**Interface Contracts**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Interface contracts documented. If Non-Compliant: Contracts not defined. If Not Applicable: N/A. If Unknown: Interfaces mentioned but contracts unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define clear interface contracts between storage and processing layers in Section 5]

### 4.3 Component Independence

**Service Boundaries**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service boundaries documented. If Non-Compliant: Boundaries not defined. If Not Applicable: Monolithic architecture. If Unknown: Boundaries mentioned but definition unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define clear service boundaries for data components in Section 5]

**API Contracts**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API contracts documented. If Non-Compliant: Contracts not specified. If Not Applicable: N/A. If Unknown: APIs mentioned but contracts unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API contracts between data components in Section 7]

**Deployment Independence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Deployment independence documented. If Non-Compliant: Components deployed together. If Not Applicable: N/A. If Unknown: Independence mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document independent deployment capability for data components in Section 4]

### 4.4 Scalability Independence

**Independent Scaling Policies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Scaling policies documented. If Non-Compliant: Scaling not independent. If Not Applicable: Fixed capacity. If Unknown: Scaling mentioned but policies unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define independent auto-scaling policies for ingestion, processing, and storage in Section 10]

**Resource Allocation Isolation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Resource isolation documented. If Non-Compliant: Resources shared without isolation. If Not Applicable: N/A. If Unknown: Isolation mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document resource allocation isolation between data layers in Section 4 or 10]

**Performance Isolation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Performance isolation documented. If Non-Compliant: Performance not isolated. If Not Applicable: N/A. If Unknown: Isolation mentioned but mechanisms unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document performance isolation mechanisms (separate compute pools, throttling) in Section 10]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD4]

---

## 5. Data Scalability (LAD5 - Category: Data)

**Requirement**: Design to handle growth and changes, accommodate data volume growth and evolution.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Infrastructure Engineer or N/A]

### 5.1 Data Volume Scalability

**Current Data Volume**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Current volume documented. If Non-Compliant: Volume not quantified. If Not Applicable: Data volume not tracked. If Unknown: Volume mentioned but not quantified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document current data volume (TB/PB) in Section 10]

**Projected Growth**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Growth projection documented. If Non-Compliant: Projection not provided. If Not Applicable: Static data volume. If Unknown: Growth mentioned but projections unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document projected data growth (annual %) and volume projections in Section 10]

**Scaling Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Scaling strategy documented. If Non-Compliant: Strategy not defined. If Not Applicable: Fixed capacity sufficient. If Unknown: Scaling mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data volume scaling strategy (horizontal partitioning, tiered storage) in Section 10]

### 5.2 Processing Capacity Scalability

**Current Throughput**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Current throughput documented. If Non-Compliant: Throughput not measured. If Not Applicable: Throughput not tracked. If Unknown: Processing mentioned but throughput unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document current processing throughput (records/sec, TPS) in Section 10]

**Peak Capacity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Peak capacity documented. If Non-Compliant: Capacity not defined. If Not Applicable: N/A. If Unknown: Capacity mentioned but limits unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define peak processing capacity and system limits in Section 10]

**Auto-Scaling Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Auto-scaling documented. If Non-Compliant: Auto-scaling not configured. If Not Applicable: Manual scaling only. If Unknown: Scaling mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document auto-scaling policies, triggers, and thresholds in Section 4 or 10]

### 5.3 Schema Evolution

**Schema Versioning**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Schema versioning documented. If Non-Compliant: Versioning not implemented. If Not Applicable: Static schema. If Unknown: Versioning mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define schema versioning strategy and registry in Section 6 or 8]

**Backward Compatibility**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backward compatibility documented. If Non-Compliant: Compatibility not ensured. If Not Applicable: N/A. If Unknown: Compatibility mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document backward compatibility requirements and schema evolution rules in Section 6]

**Migration Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Migration strategy documented. If Non-Compliant: Strategy not defined. If Not Applicable: No migrations required. If Unknown: Migration mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define schema migration procedures and rollback strategies in Section 11]

### 5.4 Horizontal Scaling Strategy

**Partitioning Approach**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Partitioning approach documented. If Non-Compliant: Partitioning not implemented. If Not Applicable: No partitioning required. If Unknown: Partitioning mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data partitioning strategy (range, hash, time-based) in Section 8]

**Sharding Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Sharding strategy documented. If Non-Compliant: Sharding not implemented. If Not Applicable: Single instance sufficient. If Unknown: Sharding mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define sharding strategy and shard key selection in Section 8]

**Distributed Processing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Distributed processing documented. If Non-Compliant: Processing not distributed. If Not Applicable: Single-node processing sufficient. If Unknown: Distribution mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document distributed processing frameworks and parallelization strategy in Section 5 or 8]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD5]

---

## 6. Data Integration (LAD6 - Category: Data)

**Requirement**: Define synchronization and replication mechanisms, structures and formats, and maintain data consistency and updating.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Integration Engineer or N/A]

### 6.1 Synchronization Mechanisms

**Sync Methods**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Sync methods documented. If Non-Compliant: Methods not specified. If Not Applicable: No synchronization required. If Unknown: Sync mentioned but methods unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define synchronization methods (real-time, batch, CDC) in Section 6 or 7]

**Sync Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Sync frequency documented. If Non-Compliant: Frequency not defined. If Not Applicable: N/A. If Unknown: Frequency mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document synchronization frequency and schedules in Section 6]

**Conflict Resolution**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Conflict resolution documented. If Non-Compliant: Resolution not defined. If Not Applicable: Conflicts not possible. If Unknown: Resolution mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define conflict resolution strategies (last-write-wins, merge, manual) in Section 6]

### 6.2 Replication Strategy

**Replication Type**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Replication type documented. If Non-Compliant: Type not specified. If Not Applicable: No replication. If Unknown: Replication mentioned but type unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define replication type (active-passive, active-active, multi-master) in Section 8]

**Replication Lag Tolerance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Lag tolerance documented. If Non-Compliant: Tolerance not defined. If Not Applicable: N/A. If Unknown: Lag mentioned but tolerance unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define acceptable replication lag thresholds in Section 10]

**Consistency Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Consistency model documented. If Non-Compliant: Model not specified. If Not Applicable: N/A. If Unknown: Consistency mentioned but model unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define consistency model (strong, eventual, causal) in Section 8 or 12]

### 6.3 Data Formats and Structures

**Standard Data Formats**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data formats documented. If Non-Compliant: Formats not standardized. If Not Applicable: N/A. If Unknown: Formats mentioned but standards unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define standard data formats (JSON, Avro, Parquet, ORC) in Section 6 or 8]

**Schema Registry**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Schema registry documented. If Non-Compliant: Registry not implemented. If Not Applicable: Schema registry not required. If Unknown: Registry mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document schema registry solution and versioning approach in Section 8]

**Transformation Pipelines**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Transformation pipelines documented. If Non-Compliant: Pipelines not defined. If Not Applicable: No transformations required. If Unknown: Transformations mentioned but pipelines unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data transformation pipelines and logic in Section 6]

### 6.4 Data Consistency Management

**Consistency Guarantees**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Consistency guarantees documented. If Non-Compliant: Guarantees not defined. If Not Applicable: N/A. If Unknown: Consistency mentioned but guarantees unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define consistency guarantees and SLAs in Section 10]

**Eventual Consistency Handling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Eventual consistency handling documented. If Non-Compliant: Handling not defined. If Not Applicable: Strong consistency used. If Unknown: Handling mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document eventual consistency handling and reconciliation procedures in Section 6]

**Data Validation Checkpoints**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Validation checkpoints documented. If Non-Compliant: Checkpoints not defined. If Not Applicable: N/A. If Unknown: Validation mentioned but checkpoints unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data validation checkpoints across integration pipeline in Section 6]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD6]

---

## 7. Regulatory Compliance (LAD7 - Category: Data)

**Requirement**: Identify and establish compliance controls and audits regarding impacts to control structures. Guarantee monitoring and regulatory compliance.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Compliance Officer / Data Governance Lead or N/A]

### 7.1 Compliance Requirements Identification

**Applicable Regulations**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Applicable regulations documented. If Non-Compliant: Regulations not identified. If Not Applicable: No regulatory requirements. If Unknown: Regulations mentioned but not clearly identified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify applicable regulations (GDPR, CCPA, HIPAA, BCBS 239, SOX, etc.) in Section 9]

**Jurisdiction Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Jurisdiction requirements documented. If Non-Compliant: Requirements not specified. If Not Applicable: Single jurisdiction. If Unknown: Jurisdictions mentioned but requirements unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document jurisdiction-specific compliance requirements in Section 9]

**Industry Standards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Industry standards documented. If Non-Compliant: Standards not identified. If Not Applicable: No industry standards apply. If Unknown: Standards mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document applicable industry standards (ISO 27001, PCI-DSS, etc.) in Section 9]

### 7.2 Compliance Controls

**Access Controls for Sensitive Data**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Access controls documented. If Non-Compliant: Controls not implemented. If Not Applicable: No sensitive data. If Unknown: Controls mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document RBAC, ABAC, and data classification-based access controls in Section 9]

**Audit Logging**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Audit logging documented. If Non-Compliant: Logging not implemented. If Not Applicable: Audit logging not required. If Unknown: Logging mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document audit logging mechanisms, retention, and immutability in Section 9 or 11]

**Retention Policies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retention policies documented. If Non-Compliant: Policies not defined. If Not Applicable: N/A. If Unknown: Retention mentioned but policies unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data retention policies aligned with regulatory requirements in Section 11]

### 7.3 Compliance Monitoring

**Compliance Dashboards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Dashboards documented. If Non-Compliant: Dashboards not implemented. If Not Applicable: Manual monitoring only. If Unknown: Monitoring mentioned but dashboards unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document compliance monitoring dashboards and metrics in Section 11]

**Automated Compliance Checks**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Automated checks documented. If Non-Compliant: Checks not automated. If Not Applicable: Manual compliance only. If Unknown: Checks mentioned but automation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define automated compliance validation checks and frequency in Section 11]

**Violation Alerting**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Alerting documented. If Non-Compliant: Alerting not configured. If Not Applicable: N/A. If Unknown: Alerting mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document compliance violation alerting and escalation procedures in Section 11]

### 7.4 Audit and Reporting

**Audit Trail Mechanisms**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Audit trails documented. If Non-Compliant: Mechanisms not implemented. If Not Applicable: Audit trails not required. If Unknown: Mechanisms mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document audit trail mechanisms for data access and modifications in Section 9 or 11]

**Compliance Reporting Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Reporting frequency documented. If Non-Compliant: Frequency not defined. If Not Applicable: N/A. If Unknown: Reporting mentioned but frequency unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define compliance reporting frequency (monthly, quarterly, annual) in Section 11]

**Regulatory Submission Processes**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Submission processes documented. If Non-Compliant: Processes not defined. If Not Applicable: No regulatory submissions. If Unknown: Submissions mentioned but processes unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document regulatory submission procedures and responsible parties in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD7]

---

## 8. Data Architecture Standards (LAD8 - Category: Data)

**Requirement**: Establish database engines and data models according to the institutional catalog. Guarantee performance and use of selected data storage platforms.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Database Administrator or N/A]

### 8.1 Database Engine Selection

**Approved Database Engines**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database engines documented and from approved catalog. If Non-Compliant: Engines not from institutional catalog. If Not Applicable: No institutional catalog exists. If Unknown: Engines documented but catalog compliance unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document database engines and verify against institutional catalog in Section 8]

**Engine Justification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Engine selection justified. If Non-Compliant: Justification not provided. If Not Applicable: Default catalog choice. If Unknown: Selection mentioned but justification unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document justification for database engine selection in Section 12 (ADRs)]

**Catalog Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Catalog compliance verified. If Non-Compliant: Non-catalog engines used without exception. If Not Applicable: No catalog requirements. If Unknown: Compliance mentioned but not verified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify database engine compliance with institutional catalog or request exception in Section 12]

### 8.2 Data Model Design

**Data Modeling Approach**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Modeling approach documented. If Non-Compliant: Approach not specified. If Not Applicable: No data modeling required. If Unknown: Modeling mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document data modeling approach (relational, NoSQL, graph, time-series) in Section 8]

**Normalization Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Normalization strategy documented. If Non-Compliant: Strategy not defined. If Not Applicable: Non-relational database. If Unknown: Normalization mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define normalization level (3NF, denormalized) and rationale in Section 8 or 12]

**Schema Design Patterns**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Design patterns documented. If Non-Compliant: Patterns not specified. If Not Applicable: N/A. If Unknown: Patterns mentioned but not clearly defined]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document schema design patterns (star schema, vault, etc.) in Section 8]

### 8.3 Storage Platform Performance

**Performance SLOs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Performance SLOs documented. If Non-Compliant: SLOs not defined. If Not Applicable: Performance not critical. If Unknown: Performance mentioned but SLOs unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define storage performance SLOs (IOPS, throughput, latency) in Section 10]

**Query Latency Targets**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Latency targets documented. If Non-Compliant: Targets not defined. If Not Applicable: N/A. If Unknown: Latency mentioned but targets unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define query latency targets (p50, p95, p99) in Section 10]

**Throughput Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Throughput requirements documented. If Non-Compliant: Requirements not specified. If Not Applicable: N/A. If Unknown: Throughput mentioned but requirements unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define storage throughput requirements (MB/s, TPS) in Section 10]

### 8.4 Institutional Catalog Compliance

**Catalog Alignment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Catalog alignment verified. If Non-Compliant: Non-catalog technologies used. If Not Applicable: No institutional catalog. If Unknown: Alignment mentioned but not verified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify all data technologies align with institutional catalog in Section 8]

**Exception Requests**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Exception requests documented and approved. If Non-Compliant: Non-catalog use without exception. If Not Applicable: All catalog-compliant. If Unknown: Exceptions mentioned but approval unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document exception requests for non-catalog technologies in Section 12 (ADRs)]

**Standardization Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Standardization compliance documented. If Non-Compliant: Non-standard practices used. If Not Applicable: No standards apply. If Unknown: Compliance mentioned but not verified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify compliance with institutional data architecture standards in Section 8]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAD8]

---

## 9. AI Model Governance (LAIA1 - Category: AI)

**Requirement**: Define embedding and foundational AI model under the bank's tenant. Guarantee secure data handling and perimetral security in the Cloud.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [AI/ML Architect / Data Scientist Lead or N/A]

### 9.1 AI Model Catalog

**Foundational Models**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Foundational models documented. If Non-Compliant: Models not specified. If Not Applicable: No foundational models used. If Unknown: Models mentioned but not clearly identified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document foundational models (GPT-4, Claude, BERT, etc.) and versions in Section 5 or 8]

**Embedding Models**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Embedding models documented. If Non-Compliant: Models not specified. If Not Applicable: No embeddings used. If Unknown: Embeddings mentioned but models unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document embedding models and dimensions in Section 5 or 8]

**Custom Models**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Custom models documented. If Non-Compliant: Models not documented. If Not Applicable: Only using pre-trained models. If Unknown: Custom models mentioned but details unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document custom model architectures, training data, and versions in Section 5]

### 9.2 Tenant Isolation

**Model Deployment Tenant**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Deployment tenant documented. If Non-Compliant: Tenant not specified. If Not Applicable: Single-tenant environment. If Unknown: Tenant mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI model deployment under bank's dedicated tenant in Section 4 or 5]

**Data Residency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data residency documented. If Non-Compliant: Residency not specified. If Not Applicable: No residency requirements. If Unknown: Residency mentioned but location unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI data residency requirements and compliance in Section 4 or 9]

**Isolation Boundaries**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Isolation boundaries documented. If Non-Compliant: Boundaries not defined. If Not Applicable: N/A. If Unknown: Isolation mentioned but boundaries unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document tenant isolation boundaries (network, compute, storage) in Section 4 or 9]

### 9.3 Data Handling Security

**Training Data Encryption**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Training data encryption documented. If Non-Compliant: Encryption not implemented. If Not Applicable: No training data. If Unknown: Encryption mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document training data encryption (at-rest, in-transit) in Section 9]

**Model Artifact Security**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Artifact security documented. If Non-Compliant: Security not implemented. If Not Applicable: N/A. If Unknown: Security mentioned but measures unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document model artifact storage security and access controls in Section 9]

**Inference Data Protection**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Inference data protection documented. If Non-Compliant: Protection not implemented. If Not Applicable: N/A. If Unknown: Protection mentioned but measures unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document inference request/response data protection in Section 9]

### 9.4 Perimetral Security

**Model API Access Controls**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API access controls documented. If Non-Compliant: Controls not implemented. If Not Applicable: No API exposure. If Unknown: Controls mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document model API authentication, authorization, and rate limiting in Section 9]

**Network Segmentation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Network segmentation documented. If Non-Compliant: Segmentation not implemented. If Not Applicable: N/A. If Unknown: Segmentation mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI infrastructure network segmentation in Section 4 or 9]

**Inference Endpoint Security**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Endpoint security documented. If Non-Compliant: Security not implemented. If Not Applicable: No inference endpoints. If Unknown: Security mentioned but measures unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document inference endpoint security (TLS, authentication, DDoS protection) in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAIA1]

---

## 10. AI Security and Reputation (LAIA2 - Category: AI)

**Requirement**: Implement guardrail node (Prompt + AI Model). Guarantee the security of AI use in Gen AI applications and agents.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [AI/ML Architect / Security Architect or N/A]

### 10.1 Guardrail Implementation

**Guardrail Architecture**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Guardrail architecture documented. If Non-Compliant: Guardrails not implemented. If Not Applicable: Guardrails not required. If Unknown: Architecture mentioned but design unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document guardrail node architecture (prompt filtering, response filtering) in Section 5 or 9]

**Guardrail Rules**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Guardrail rules documented. If Non-Compliant: Rules not defined. If Not Applicable: N/A. If Unknown: Rules mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define guardrail rules (content policies, toxicity filters) in Section 9]

**Enforcement Mechanisms**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Enforcement mechanisms documented. If Non-Compliant: Mechanisms not implemented. If Not Applicable: N/A. If Unknown: Enforcement mentioned but mechanisms unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document guardrail enforcement mechanisms (blocking, logging, alerting) in Section 5 or 9]

### 10.2 Prompt Security

**Prompt Injection Prevention**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Prevention measures documented. If Non-Compliant: Measures not implemented. If Not Applicable: N/A. If Unknown: Prevention mentioned but measures unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document prompt injection prevention techniques in Section 9]

**Prompt Sanitization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Sanitization documented. If Non-Compliant: Sanitization not implemented. If Not Applicable: N/A. If Unknown: Sanitization mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document prompt sanitization and validation procedures in Section 9]

**Input Validation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Input validation documented. If Non-Compliant: Validation not implemented. If Not Applicable: N/A. If Unknown: Validation mentioned but rules unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define input validation rules and constraints in Section 9]

### 10.3 Response Security

**Output Filtering**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Output filtering documented. If Non-Compliant: Filtering not implemented. If Not Applicable: N/A. If Unknown: Filtering mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI response filtering mechanisms in Section 9]

**PII Detection**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: PII detection documented. If Non-Compliant: Detection not implemented. If Not Applicable: No PII risk. If Unknown: Detection mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document PII detection and handling in AI responses in Section 9]

**Sensitive Information Redaction**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Redaction documented. If Non-Compliant: Redaction not implemented. If Not Applicable: N/A. If Unknown: Redaction mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define sensitive information redaction procedures in Section 9]

### 10.4 Gen AI Application Security

**Agent Authentication**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authentication documented. If Non-Compliant: Authentication not implemented. If Not Applicable: No agents. If Unknown: Authentication mentioned but method unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI agent authentication mechanisms in Section 9]

**Agent Authorization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authorization documented. If Non-Compliant: Authorization not implemented. If Not Applicable: N/A. If Unknown: Authorization mentioned but controls unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI agent authorization and access control policies in Section 9]

**Usage Monitoring**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Usage monitoring documented. If Non-Compliant: Monitoring not implemented. If Not Applicable: N/A. If Unknown: Monitoring mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI usage monitoring, logging, and anomaly detection in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAIA2]

---

## 11. AI Hallucination Control (LAIA3 - Category: AI)

**Requirement**: Implement AI inference evaluation method. Visualize and prevent random generation phenomena, mitigate hallucination error. Report with Evaluation Metrics.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [AI/ML Architect / ML Engineer or N/A]

### 11.1 Inference Evaluation Method

**Evaluation Framework**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Evaluation framework documented. If Non-Compliant: Framework not implemented. If Not Applicable: Evaluation not required. If Unknown: Framework mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document AI inference evaluation framework and methodology in Section 5 or 11]

**Ground Truth Validation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Validation approach documented. If Non-Compliant: Validation not implemented. If Not Applicable: N/A. If Unknown: Validation mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document ground truth validation procedures and datasets in Section 5 or 11]

**Confidence Scoring**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Confidence scoring documented. If Non-Compliant: Scoring not implemented. If Not Applicable: N/A. If Unknown: Scoring mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document confidence scoring mechanisms and thresholds in Section 5]

### 11.2 Hallucination Detection

**Hallucination Detection Methods**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Detection methods documented. If Non-Compliant: Methods not implemented. If Not Applicable: Hallucination not a concern. If Unknown: Detection mentioned but methods unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document hallucination detection techniques (consistency checks, fact verification) in Section 5 or 11]

**Factuality Verification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Verification documented. If Non-Compliant: Verification not implemented. If Not Applicable: N/A. If Unknown: Verification mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document factuality verification mechanisms and knowledge sources in Section 5]

**Source Grounding**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Source grounding documented. If Non-Compliant: Grounding not implemented. If Not Applicable: N/A. If Unknown: Grounding mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document source grounding and citation mechanisms in Section 5]

### 11.3 Evaluation Metrics Reporting

**Regression Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Regression metrics documented. If Non-Compliant: Metrics not tracked. If Not Applicable: Not applicable to use case. If Unknown: Metrics mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document regression metrics (MSE, RMSE, MAE) if applicable in Section 11]

**Classification Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Classification metrics documented. If Non-Compliant: Metrics not tracked. If Not Applicable: Not applicable to use case. If Unknown: Metrics mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document classification metrics (F1, precision, recall, accuracy) in Section 11]

**Clustering Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Clustering metrics documented. If Non-Compliant: Metrics not tracked. If Not Applicable: Not applicable to use case. If Unknown: Metrics mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document clustering metrics (silhouette score, Davies-Bouldin) if applicable in Section 11]

**Explained Variance Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Variance metrics documented. If Non-Compliant: Metrics not tracked. If Not Applicable: Not applicable to use case. If Unknown: Metrics mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document explained variance metrics if applicable in Section 11]

**Perplexity Metrics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Perplexity metrics documented. If Non-Compliant: Metrics not tracked. If Not Applicable: Not applicable to use case. If Unknown: Metrics mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document perplexity metrics for language models in Section 11]

**NLG Metrics (BLEU, ROUGE)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: NLG metrics documented. If Non-Compliant: Metrics not tracked. If Not Applicable: Not applicable to use case. If Unknown: Metrics mentioned but not specified]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document BLEU, ROUGE, and other NLG metrics for generation quality in Section 11]

### 11.4 Mitigation Strategies

**Hallucination Mitigation Techniques**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Mitigation techniques documented. If Non-Compliant: Techniques not implemented. If Not Applicable: N/A. If Unknown: Mitigation mentioned but techniques unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document hallucination mitigation strategies (temperature tuning, prompt engineering) in Section 5]

**Model Fine-Tuning**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Fine-tuning documented. If Non-Compliant: Fine-tuning not performed. If Not Applicable: Pre-trained model only. If Unknown: Fine-tuning mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document model fine-tuning procedures and datasets in Section 5]

**Retrieval Augmentation (RAG)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RAG implementation documented. If Non-Compliant: RAG not implemented. If Not Applicable: RAG not required. If Unknown: RAG mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document Retrieval Augmented Generation architecture and knowledge sources in Section 5]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAIA3]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Key Data & AI Architecture Terms**:

- **Data Quality**: Accuracy, completeness, consistency, and timeliness of data
- **Data Governance**: Policies, procedures, and standards for data management
- **Data Catalog**: Centralized repository of metadata describing available datasets
- **Data Lineage**: Documentation of data origin, transformations, and movement
- **AI Model Governance**: Oversight of AI model development, deployment, and monitoring
- **AI Hallucination Control**: Mechanisms to detect and prevent AI-generated false information
- **Data Lake**: Centralized repository storing structured and unstructured data
- **Master Data Management (MDM)**: Process to ensure single source of truth for critical data

<!-- @include shared/fragments/status-codes.md -->

**Abbreviations**:

- **LAD**: Data Architecture (Lineamiento de Arquitectura de Datos)
- **LAIA**: AI Architecture (Lineamiento de Arquitectura de IA)
- **MDM**: Master Data Management
- **ETL**: Extract, Transform, Load
- **API**: Application Programming Interface
- **ML**: Machine Learning
- **AI**: Artificial Intelligence
- **LLM**: Large Language Model

---

### A.2 Validation Methodology

<!-- @include-with-config shared/sections/validation-methodology.md config=data-ai-architecture -->

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common Data & AI Architecture Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| Missing data quality metrics | LAD1 Non-Compliant | Section 6 (Data Model) | Define data quality KPIs and validation rules |
| Undefined data governance policies | LAD2 Non-Compliant | Section 11 (Operational Considerations) | Document data access controls and policies |
| No AI model governance framework | LAIA1 Non-Compliant | Section 6 (AI/ML Components) | Establish model approval and monitoring process |
| Missing AI hallucination controls | LAIA3 Non-Compliant | Section 6 (AI/ML Components) | Implement validation and grounding mechanisms |
| Data lineage not documented | LAD2 Unknown | Section 6 (Data Model) | Add data lineage tracking, upstream/downstream dependencies |
| AI model monitoring undefined | LAIA2 Unknown | Section 6 or 11 (AI/ML/Operational) | Define model performance metrics, drift detection, retraining triggers |
| Data retention policies missing | LAD2 Unknown | Section 11 (Operational Considerations) | Specify retention periods, archival strategy, compliance requirements |
| AI bias mitigation not specified | LAIA3 Unknown | Section 6 (AI/ML Components) | Document bias detection, fairness metrics, mitigation strategies |

---

#### A.3.2 Step-by-Step Remediation Workflow

<!-- @include shared/sections/remediation-workflow-guide.md -->

**Data & AI Architecture-Specific Examples**:

**Example 1: Data Quality Metrics and Validation**
- **Gap**: Missing data quality metrics
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add data quality framework to Section 6:
   Completeness: 95% minimum for critical fields,
   Accuracy: 98% validation against source systems,
   Consistency: cross-system validation rules,
   Timeliness: data freshness SLA < 15 minutes,
   Great Expectations library for automated validation"
  ```
- **Expected Outcome**: Section 6 with data quality KPIs, validation rules, monitoring tools
- **Impact**: LAD1 → Compliant (+0.6 points)

**Example 2: AI Model Governance Framework**
- **Gap**: No AI model governance framework
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add AI model governance to Section 6:
   Model approval: peer review + compliance review before production,
   Model registry: MLflow for versioning and lineage,
   Performance monitoring: accuracy, precision, recall tracked daily,
   Retraining triggers: accuracy drop > 5% or drift detection,
   Model cards: documentation for explainability and bias assessment"
  ```
- **Expected Outcome**: Section 6 with governance framework, approval process, monitoring
- **Impact**: LAIA1 → Compliant (+0.6 points)

**Example 3: AI Hallucination Controls**
- **Gap**: Missing AI hallucination controls for LLM applications
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add hallucination controls to Section 6:
   Grounding: RAG (Retrieval-Augmented Generation) with vector DB,
   Validation: confidence scoring with threshold > 0.85,
   Citation: source attribution for all generated content,
   Human-in-the-loop: review for high-risk decisions,
   Guardrails: NeMo Guardrails for prompt injection prevention"
  ```
- **Expected Outcome**: Section 6 with RAG architecture, validation mechanisms, guardrails
- **Impact**: LAIA3 → Compliant (+0.5 points)

**Example 4: Data Lineage and Governance**
- **Gap**: Data lineage not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add data lineage to Section 6:
   Lineage tool: Apache Atlas or AWS Glue Data Catalog,
   Tracking: upstream sources, transformations, downstream consumers,
   Data catalog: searchable metadata with business glossary,
   Access controls: RBAC with attribute-based policies,
   Retention: PII 30 days, analytics data 7 years, compliance with GDPR"
  ```
- **Expected Outcome**: Section 6 with lineage tracking, catalog, governance policies
- **Impact**: LAD2 → Compliant (+0.5 points)

**Example 5: AI Model Monitoring and Drift Detection**
- **Gap**: AI model monitoring undefined
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add model monitoring to Section 6 or 11:
   Performance metrics: accuracy, F1 score, AUC tracked hourly,
   Data drift: KL divergence monitoring on input distributions,
   Concept drift: prediction distribution monitoring,
   Alerting: Slack notification when accuracy < 90% or drift detected,
   Auto-retraining: triggered on drift with approval gate"
  ```
- **Expected Outcome**: Section 6/11 with monitoring metrics, drift detection, alerting
- **Impact**: LAIA2 → Compliant (+0.4 points)

---

#### A.3.3 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required data and AI fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all data and AI controls

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete Data Governance and Quality** (estimated impact: +0.5 points)
   - Define data quality metrics: completeness, accuracy, consistency, timeliness (Section 6)
   - Document data governance policies: access controls, RBAC, data classification (Section 11)
   - Add data lineage tracking with upstream/downstream dependencies (Section 6)
   - Specify data retention policies with compliance requirements (GDPR, CCPA) in Section 11
   - Define data catalog with searchable metadata and business glossary (Section 6)

2. **Establish AI Model Governance and Controls** (estimated impact: +0.6 points)
   - Create AI model governance framework: approval, versioning, monitoring (Section 6)
   - Implement hallucination controls: RAG, validation, citation, guardrails (Section 6)
   - Add model monitoring: performance metrics, drift detection, retraining triggers (Section 6/11)
   - Document bias mitigation: fairness metrics, bias detection, mitigation strategies (Section 6)
   - Specify model explainability: SHAP, LIME, model cards for transparency (Section 6)

3. **Enhance Data Security and Compliance** (estimated impact: +0.2 points)
   - Document data encryption: at-rest (AES-256), in-transit (TLS 1.3) in Section 9
   - Add PII/sensitive data handling with tokenization or anonymization (Section 9)
   - Define data masking policies for non-production environments (Section 9/11)
   - Specify compliance certifications: SOC 2, ISO 27001, GDPR, HIPAA (Section 9)
   - Add data breach response procedures (Section 11)

**Priority Order**: LAD1 (data quality) → LAIA1 (model governance) → LAIA3 (hallucination controls) → LAD2 (data governance) → LAIA2 (model monitoring)

**Estimated Final Score After Remediation**: 8.4-8.9/10 (AUTO_APPROVE)

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
- Separated Data (LAD1-LAD8) and AI (LAIA1-LAIA3) requirements
- Total: 11 validation data points (8 Data + 3 AI)

**Version 1.0 (Previous)**:
- Initial template with minimal appendix
- Basic PLACEHOLDER approach
- Limited source traceability

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=data-ai-architecture -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=data-ai-architecture -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=data-ai-architecture -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=data-ai-architecture -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=data-ai-architecture -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.
