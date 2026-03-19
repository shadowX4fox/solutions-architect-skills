# Compliance Contract: Business Continuity

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 1, 3, 4, 5, 7, 8, 10, 11)
**Version**: 2.0

---

<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=business-continuity -->

<!-- @include shared/fragments/compliance-score-calculation.md -->

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LACN001 | Document the official name of the application, system, or business initiative covered by this Business Continuity plan | BC-GEN | [Status] | Section 1 (Business Context) or Section 2 (System Overview) | [Role or N/A] |
| LACN002 | Specify the architectural pattern (e.g., monolithic, microservices, serverless) and deployment model (e.g., on-premises, cloud, hybrid) used by the system | BC-GEN | [Status] | Section 3 (Architecture Overview) or Section 4 (Deployment Architecture) | [Role or N/A] |
| LACN003 | Define the number of logical or physical layers in the system architecture (e.g., presentation, business logic, data access, persistence) | BC-GEN | [Status] | Section 4 (Architecture Layers) or Section 3 (Architecture Overview) | [Role or N/A] |
| LACN004 | Document the infrastructure type: physical servers, virtual machines, containers, serverless, or a combination thereof | BC-GEN | [Status] | Section 4 (Deployment Architecture) or Section 11 (Operational → Infrastructure) | [Role or N/A] |
| LACN005 | Identify all critical dependencies including internal systems, external services, third-party APIs, databases, and infrastructure components required for operation | BC-GEN | [Status] | Section 1 (Business Context → Dependencies) or Section 5 (System Integrations) | [Role or N/A] |
| LACN006 | Determine whether the solution requires high availability (HA) design patterns to minimize downtime and ensure continuous operation | BC-DR | [Status] | Section 10 (Non-Functional Requirements → Availability) | [Role or N/A] |
| LACN007 | If HA is required, identify which specific system components, services, or tiers must be designed for high availability | BC-DR | [Status] | Section 11 (Operational → High Availability) | [Role or N/A] |
| LACN008 | Determine if the solution requires local contingency measures (within same data center or availability zone) to handle component failures | BC-DR | [Status] | Section 11 (Operational → High Availability) | [Role or N/A] |
| LACN009 | Determine if the solution requires disaster recovery (DR) capabilities to recover from catastrophic site-wide or regional failures | BC-DR | [Status] | Section 11 (Operational → Disaster Recovery) | [Role or N/A] |
| LACN010 | Specify the DR architecture pattern: cold standby, warm standby, hot standby, or active-active multi-region | BC-DR | [Status] | Section 11 (Operational → Disaster Recovery) | [Role or N/A] |
| LACN011 | Specify the data replication method used for DR: synchronous, asynchronous, snapshot-based, or backup-restore | BC-DR | [Status] | Section 11 (Operational → Disaster Recovery → Data Replication) | [Role or N/A] |
| LACN012 | Establish a Recovery Time Objective (RTO) - the maximum acceptable time to restore service after a failure | BC-RTO | [Status] | Section 10 (Non-Functional Requirements) or Section 11 (Operational → DR) | [Role or N/A] |
| LACN013 | Determine if contingency and disaster recovery procedures must be regularly tested and validated | BC-DR | [Status] | Section 11 (Operational → Disaster Recovery → Testing) | [Role or N/A] |
| LACN014 | Verify that the application can continue operating gracefully when individual components or dependencies experience transient failures | BC-DR | [Status] | Section 11 (Operational → Resilience) or Section 7 (Application Architecture → Resilience Patterns) | [Role or N/A] |
| LACN015 | Determine if the platform will execute batch processing jobs or scheduled workloads | BC-DR | [Status] | Section 7 (Application Architecture → Batch Processing) or Section 11 (Operational) | [Role or N/A] |
| LACN016 | Specify the type of batch execution: scheduled (time-based), event-triggered, manual, or on-demand | BC-DR | [Status] | Section 7 (Application Architecture → Batch Processing) | [Role or N/A] |
| LACN017 | Determine if failed batch jobs must support reprocessing or retry to avoid data inconsistencies | BC-DR | [Status] | Section 7 (Application Architecture → Batch Processing → Error Handling) | [Role or N/A] |
| LACN018 | Determine if periodic backups of application data are required for recovery purposes | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore) | [Role or N/A] |
| LACN019 | Specify the frequency of data backups: continuous, hourly, daily, weekly, or custom schedule based on RPO requirements | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Schedule) | [Role or N/A] |
| LACN020 | Define how long backup copies must be retained before deletion: days, months, years, or permanent archival | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Retention) | [Role or N/A] |
| LACN021 | Determine if backups should overwrite previous versions or maintain historical versions for point-in-time recovery | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Versioning) | [Role or N/A] |
| LACN022 | Assess the difficulty and effort required to recreate lost data if backups are unavailable | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore) or Section 1 (Business Context) | [Role or N/A] |
| LACN023 | Quantify the business impact if data is lost: revenue loss, operational disruption, regulatory penalties, reputation damage | BC-BACKUP | [Status] | Section 1 (Business Context → Business Impact Analysis) | [Role or N/A] |
| LACN024 | Confirm that the Recovery Point Objective (RPO) - maximum acceptable data loss - has been validated and approved by business stakeholders | BC-RTO | [Status] | Section 10 (Non-Functional Requirements) or Section 11 (Operational → Backup & DR) | [Role or N/A] |
| LACN025 | Determine if backups must be stored in a geographically separate location to protect against site-wide disasters | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Geographic Distribution) | [Role or N/A] |
| LACN026 | Determine if infrastructure configurations, operating system settings, and system files require backup (often called BDI - Base de Infraestructura) | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Infrastructure) | [Role or N/A] |
| LACN027 | Determine if audit logs of infrastructure changes must be backed up for compliance, troubleshooting, and forensic analysis | BC-BACKUP | [Status] | Section 11 (Operational → Logging & Monitoring or Backup & Restore) | [Role or N/A] |
| LACN028 | Verify that the complete application can be restored from backups if all components fail simultaneously (worst-case scenario) | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Testing) | [Role or N/A] |
| LACN029 | Identify if the platform handles sensitive data such as customer PII, financial data, or other regulated information requiring enhanced backup protection | BC-BACKUP | [Status] | Section 8 (Security Architecture → Data Classification) or Section 11 (Operational) | [Role or N/A] |
| LACN030 | Define who is responsible for executing, monitoring, and validating backups: infrastructure team, DBA team, application team, or managed service provider | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Responsibilities) | [Role or N/A] |
| LACN031 | Determine if backups stored in cloud or managed services can be downloaded to local or on-premises storage for additional protection | BC-BACKUP | [Status] | Section 11 (Operational → Backup & Restore → Hybrid Strategy) | [Role or N/A] |
| LACN032 | Assess if disaster recovery activation can be automated rather than requiring manual procedures | BC-AUTO | [Status] | Section 11 (Operational → Disaster Recovery → Automation) | [Role or N/A] |
| LACN033 | Identify which specific components and procedures can be automated during disaster recovery activation | BC-AUTO | [Status] | Section 11 (Operational → Disaster Recovery → Automation) | [Role or N/A] |
| LACN034 | Determine if the application requires circuit breaker pattern to prevent cascading failures when downstream services are unavailable or slow | BC-CLOUD | [Status] | Section 7 (Application Architecture → Resilience Patterns) | [Role or N/A] |
| LACN035 | Implement retry logic with exponential backoff to handle transient failures in distributed systems and third-party integrations | BC-CLOUD | [Status] | Section 7 (Application Architecture → Resilience Patterns) | [Role or N/A] |
| LACN036 | Implement appropriate timeout values for calls to third-party and external services to prevent blocking and cascading slowness | BC-CLOUD | [Status] | Section 7 (Application Architecture → Resilience Patterns) or Section 5 (Integrations) | [Role or N/A] |
| LACN037 | Define time-bound triggers for automated contingency or disaster recovery activation to limit blast radius and ensure timely response | BC-CLOUD | [Status] | Section 11 (Operational → Disaster Recovery → Automation) | [Role or N/A] |
| LACN038 | Implement fallback responses or degraded functionality when primary services or features are unavailable | BC-CLOUD | [Status] | Section 7 (Application Architecture → Resilience Patterns) | [Role or N/A] |
| LACN039 | Implement bulkhead pattern to isolate failing components and prevent cascading failures across services | BC-CLOUD | [Status] | Section 7 (Application Architecture → Resilience Patterns) | [Role or N/A] |
| LACN040 | Implement auto-scaling with health checks to automatically replace failed instances across multiple availability zones | BC-CLOUD | [Status] | Section 11 (Operational → Auto-Scaling) or Section 4 (Deployment Architecture) | [Role or N/A] |
| LACN041 | Implement load balancing to automatically distribute traffic across multiple instances and availability zones | BC-CLOUD | [Status] | Section 4 (Deployment Architecture → Load Balancing) or Section 11 (Operational) | [Role or N/A] |
| LACN042 | Implement queue-based load leveling to absorb traffic spikes and process workloads asynchronously without impacting service availability | BC-CLOUD | [Status] | Section 7 (Application Architecture → Asynchronous Processing) | [Role or N/A] |
| LACN043 | Identify all potential single points of failure in the architecture that could cause complete service outage if they fail | BC-CLOUD | [Status] | Section 3 (Architecture Overview) or Section 11 (Operational → High Availability) | [Role or N/A] |

---

## Detailed Requirements

## 1. Application or Initiative Name (LACN001)

**Requirement**: Provide the complete and official name of the application or business initiative, matching the name used in enterprise architecture documentation and project charters. Include any acronyms or alternative names commonly used within the organization.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-GEN

### 1.1 Application Identification

**Application Name**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Official name is documented. If Non-Compliant: Name is missing. If Not Applicable: N/A. If Unknown: Name not found in source.]
- Source: [ARCHITECTURE.md Section 1 (Business Context) or Section 2 (System Overview) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add the official application name to ARCHITECTURE.md Section 1 or Section 2.]

**Enterprise Registry Match**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Name matches enterprise architecture registry. If Non-Compliant: Name does not match registry. If Not Applicable: N/A. If Unknown: Registry match not verified.]
- Source: [ARCHITECTURE.md Section 1 (Business Context) or Section 2 (System Overview) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify name against enterprise architecture registry and update ARCHITECTURE.md Section 1 or 2.]

**Alternative Names/Acronyms**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Alternative names and acronyms are listed. If Non-Compliant: Alternatives not documented. If Not Applicable: No alternative names exist. If Unknown: Not confirmed.]
- Source: [ARCHITECTURE.md Section 1 (Business Context) or Section 2 (System Overview) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add any acronyms or alternative names to ARCHITECTURE.md Section 1 or 2.]

**Source References**: [ARCHITECTURE.md Section 1 (Business Context), Section 2 (System Overview)]

---

## 2. Architecture Type and Deployment Model (LACN002)

**Requirement**: Document the high-level architecture pattern (e.g., monolithic, microservices, serverless) and deployment model (e.g., on-premises, cloud, hybrid), as these are critical for disaster recovery planning since different architectures require different recovery strategies.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-GEN

### 2.1 Architecture and Deployment Documentation

**Architecture Pattern**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Architecture pattern is clearly documented. If Non-Compliant: Pattern not specified. If Not Applicable: N/A. If Unknown: Pattern not determinable from source.]
- Source: [ARCHITECTURE.md Section 3 (Architecture Overview) or Section 4 (Deployment Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add architecture pattern (e.g., microservices, monolithic) to ARCHITECTURE.md Section 3 or 4.]

**Deployment Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Deployment model is specified. If Non-Compliant: Model not documented. If Not Applicable: N/A. If Unknown: Model not determinable.]
- Source: [ARCHITECTURE.md Section 3 (Architecture Overview) or Section 4 (Deployment Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify deployment model (e.g., AWS cloud, on-premises, hybrid) in ARCHITECTURE.md Section 3 or 4.]

**Architecture Choice Rationale**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Rationale for non-standard architecture choice is provided. If Non-Compliant: No rationale documented. If Not Applicable: Standard pattern requires no justification. If Unknown: Rationale not found.]
- Source: [ARCHITECTURE.md Section 3 (Architecture Overview) or Section 4 (Deployment Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add rationale for architecture choice to ARCHITECTURE.md Section 3 if a non-standard pattern was selected.]

**Source References**: [ARCHITECTURE.md Section 3 (Architecture Overview), Section 4 (Deployment Architecture)]

---

## 3. Number of Architecture Layers (LACN003)

**Requirement**: Specify how many distinct layers or tiers comprise the architecture and name each layer exactly as defined in ARCHITECTURE.md, as layer count determines dependencies and recovery sequence during disaster recovery scenarios.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-GEN

### 3.1 Layer Inventory

**Layer Count**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Number of layers is documented. If Non-Compliant: Count not specified. If Not Applicable: N/A. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 4 (Architecture Layers) or Section 3 (Architecture Overview) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document the number of architecture layers in ARCHITECTURE.md Section 4.]

**Architecture Type Detected**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Architecture type is detected (META/BIAN/3-TIER/MICROSERVICES/NLAYER). If Non-Compliant: Type not determinable. If Not Applicable: N/A. If Unknown: Marked as UNKNOWN.]
- Source: [ARCHITECTURE.md Section 4 (Architecture Layers) or Section 3 (Architecture Overview) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify architecture type in ARCHITECTURE.md Section 3 or 4 to enable correct layer mapping.]

**Layer Names**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Each layer is named with exact names from ARCHITECTURE.md. If Non-Compliant: Layer names missing or incomplete. If Not Applicable: N/A. If Unknown: Names not found.]
- Source: [ARCHITECTURE.md Section 4 (Architecture Layers) or Section 3 (Architecture Overview) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add exact layer names to ARCHITECTURE.md Section 4 matching architecture type expectations.]

**Layer Responsibilities**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Responsibilities are defined for each layer. If Non-Compliant: Responsibilities not documented. If Not Applicable: N/A. If Unknown: Responsibilities not found.]
- Source: [ARCHITECTURE.md Section 4 (Architecture Layers) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define responsibilities for each layer in ARCHITECTURE.md Section 4 to support DR sequencing.]

**Layer Dependencies for DR Sequencing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Layer dependencies are identified for DR recovery order. If Non-Compliant: Dependencies not documented. If Not Applicable: N/A. If Unknown: Dependencies not determinable.]
- Source: [ARCHITECTURE.md Section 4 (Architecture Layers) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document inter-layer dependencies in ARCHITECTURE.md Section 4 to establish DR recovery sequence.]

**Source References**: [ARCHITECTURE.md Section 4 (Architecture Layers), Section 3 (Architecture Overview)]

---

## 4. Infrastructure Type (LACN004)

**Requirement**: Specify the infrastructure foundation supporting the application (physical servers, virtual machines, containers, serverless, or hybrid), as infrastructure type significantly impacts backup strategies, failover mechanisms, and recovery time objectives.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-GEN

### 4.1 Infrastructure Classification

**Infrastructure Type**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Infrastructure type is documented. If Non-Compliant: Type not specified. If Not Applicable: N/A. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 4 (Deployment Architecture) or Section 11 (Operational → Infrastructure) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document infrastructure type (physical, virtual, containers, serverless) in ARCHITECTURE.md Section 4 or 11.]

**Infrastructure Provider/Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Provider/platform is specified. If Non-Compliant: Provider not documented. If Not Applicable: N/A. If Unknown: Provider not determinable.]
- Source: [ARCHITECTURE.md Section 4 (Deployment Architecture) or Section 11 (Operational → Infrastructure) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify infrastructure provider/platform in ARCHITECTURE.md Section 4 or 11.]

**Infrastructure-Specific BC Considerations**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: BC considerations for the infrastructure type are documented. If Non-Compliant: Considerations not documented. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 4 (Deployment Architecture) or Section 11 (Operational → Infrastructure) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add BC considerations specific to the infrastructure type in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 4 (Deployment Architecture), Section 11 (Operational → Infrastructure)]

---

## 5. Critical System Dependencies (LACN005)

**Requirement**: Document all upstream and downstream dependencies critical for system operation, including internal services, external APIs, SaaS platforms, authentication providers, databases, and message queues, noting each dependency's name, provider, criticality level, and impact if unavailable.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-GEN

### 5.1 Dependency Documentation

**Dependency Inventory**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All critical dependencies are identified and documented. If Non-Compliant: Dependencies not fully documented. If Not Applicable: N/A. If Unknown: Cannot determine completeness.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Dependencies) or Section 5 (System Integrations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: List all critical dependencies in ARCHITECTURE.md Section 1 or 5, including name, provider, criticality, and failure impact.]

**Dependency Detail (Name, Provider, Criticality, Impact)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Each dependency includes name, provider, criticality, and failure impact. If Non-Compliant: Details incomplete. If Not Applicable: N/A. If Unknown: Not verifiable.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Dependencies) or Section 5 (System Integrations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enrich each dependency entry in ARCHITECTURE.md Section 5 with provider, criticality level, and failure impact.]

**Dependency Diagram or Relationship Map**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Diagram showing dependency relationships is provided. If Non-Compliant: No diagram present. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Dependencies) or Section 5 (System Integrations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add dependency diagram or relationship map to ARCHITECTURE.md Section 5.]

**Mitigation Strategies for Critical Dependencies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Mitigation strategies are documented for critical dependencies. If Non-Compliant: Strategies not documented. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Dependencies) or Section 5 (System Integrations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document mitigation strategies for each critical dependency in ARCHITECTURE.md Section 5.]

**Source References**: [ARCHITECTURE.md Section 1 (Business Context → Dependencies), Section 5 (System Integrations)]

---

## 6. High Availability Requirement (LACN006)

**Requirement**: Assess whether the system must be designed for high availability, specifying the target availability percentage (e.g., 99.95%) and providing business justification based on revenue impact of downtime, user expectations, and SLA commitments.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 6.1 HA Requirement Assessment

**HA Requirement (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: HA requirement is clearly stated. If Non-Compliant: HA requirement not defined. If Not Applicable: N/A. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add HA requirement (Yes/No) to ARCHITECTURE.md Section 10 under Non-Functional Requirements.]

**Target Availability Percentage**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Target availability percentage is specified. If Non-Compliant: Percentage not documented. If Not Applicable: HA not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add target availability percentage (e.g., 99.9%) to ARCHITECTURE.md Section 10.]

**Business Justification for HA**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business justification for HA requirement is documented. If Non-Compliant: No justification provided. If Not Applicable: HA not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document business justification for HA in ARCHITECTURE.md Section 10, including downtime tolerance and business impact.]

**Downtime Tolerance and Business Impact**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Downtime tolerance and business impact are assessed. If Non-Compliant: Not assessed. If Not Applicable: HA not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add downtime tolerance assessment and business impact analysis to ARCHITECTURE.md Section 10.]

**Source References**: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Availability)]

---

## 7. High Availability Component Scope (LACN007)

**Requirement**: Specify which components require HA design (redundancy and failover), documenting for each: deployment pattern (active-active or active-passive), redundancy level (N+1, N+2), geographic distribution (single AZ, multi-AZ, multi-region), and failover mechanism (automatic or manual).
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 7.1 HA Component Definitions

**HA Component List**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All HA components are explicitly listed. If Non-Compliant: Component list incomplete or missing. If Not Applicable: HA not required. If Unknown: Not determinable.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: List all HA components (web servers, databases, caches, etc.) in ARCHITECTURE.md Section 11.]

**Deployment Pattern per Component (Active-Active/Passive)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Deployment pattern is specified for each HA component. If Non-Compliant: Patterns not documented. If Not Applicable: HA not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add deployment pattern (active-active or active-passive) for each HA component in ARCHITECTURE.md Section 11.]

**Redundancy Level and Geographic Distribution**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Redundancy level and geographic distribution are documented. If Non-Compliant: Not documented. If Not Applicable: HA not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify redundancy level (N+1, N+2) and geographic distribution (multi-AZ) in ARCHITECTURE.md Section 11.]

**Failover Mechanism (Automatic/Manual)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Automatic vs manual failover approach is defined. If Non-Compliant: Failover mechanism not specified. If Not Applicable: HA not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define failover mechanism (automatic or manual) for each HA component in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → High Availability)]

---

## 8. Local Contingency Requirement (LACN008)

**Requirement**: Determine whether the solution requires local contingency measures (failover within the same data center or availability zone) to handle component-level failures such as server crashes, network issues, or software bugs, distinct from disaster recovery which handles site-wide failures.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 8.1 Local Contingency Design

**Local Contingency Requirement (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Local contingency requirement is clearly stated. If Non-Compliant: Requirement not defined. If Not Applicable: N/A. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add local contingency requirement (Yes/No) to ARCHITECTURE.md Section 11.]

**Local Failover Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Local failover strategy is documented. If Non-Compliant: Strategy not defined. If Not Applicable: Local contingency not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document local failover strategy in ARCHITECTURE.md Section 11, including redundant servers and load balancing within same location.]

**Component Redundancy Within Same Location**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Component redundancy within same location is specified. If Non-Compliant: Not documented. If Not Applicable: Local contingency not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify component redundancy within the same location in ARCHITECTURE.md Section 11.]

**Health Check and Automatic Failover Mechanisms**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Health check and automatic failover mechanisms are defined. If Non-Compliant: Mechanisms not documented. If Not Applicable: Local contingency not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define health check and automatic failover mechanisms in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → High Availability)]

---

## 9. Disaster Recovery Requirement (LACN009)

**Requirement**: Determine if the solution requires disaster recovery capabilities to recover from catastrophic site-wide or regional failures, documenting the business justification, disaster scenarios addressed, and associated RTO and RPO targets.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 9.1 DR Requirement Assessment

**DR Requirement (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DR requirement is clearly stated. If Non-Compliant: Requirement not defined. If Not Applicable: N/A. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add DR requirement (Yes/No) to ARCHITECTURE.md Section 11.]

**Disaster Scenarios Addressed**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Disaster scenarios (regional outage, data center loss, etc.) are identified. If Non-Compliant: Scenarios not documented. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document disaster scenarios addressed (e.g., regional outage, data center loss) in ARCHITECTURE.md Section 11.]

**Business Justification for DR Investment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business justification for DR is documented. If Non-Compliant: No justification provided. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document business justification for DR investment in ARCHITECTURE.md Section 11.]

**RTO and RPO Targets**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO and RPO targets are defined. If Non-Compliant: Targets not documented. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define RTO and RPO targets in ARCHITECTURE.md Section 10 or 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery)]

---

## 10. Disaster Recovery Architecture Pattern (LACN010)

**Requirement**: Document the DR architecture pattern based on RTO and cost considerations, selecting from cold standby, warm standby, hot standby, or active-active, and provide justification including primary and DR site locations and failover trigger criteria.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 10.1 DR Architecture

**DR Pattern (Cold/Warm/Hot/Active-Active)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DR pattern is clearly specified. If Non-Compliant: Pattern not defined. If Not Applicable: DR not required. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify DR pattern (cold/warm/hot/active-active) in ARCHITECTURE.md Section 11.]

**Primary and DR Site Locations**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Primary and DR site locations are documented. If Non-Compliant: Site locations not specified. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document primary and DR site locations in ARCHITECTURE.md Section 11.]

**Justification for Selected DR Pattern**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Justification based on RTO/cost is provided. If Non-Compliant: No justification. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add justification for chosen DR pattern based on RTO requirements and cost in ARCHITECTURE.md Section 11.]

**Failover Trigger Criteria and Procedures**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Failover trigger criteria and procedures are documented. If Non-Compliant: Criteria not defined. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document failover trigger criteria and procedures in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery)]

---

## 11. Data Replication Method for DR (LACN011)

**Requirement**: Document how data is replicated from the primary to the DR site, specifying the replication method (synchronous, asynchronous, snapshot-based, or backup-restore), replication frequency/lag, RPO achieved, and network bandwidth and performance impact.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 11.1 Replication Configuration

**Replication Method**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Replication method is specified. If Non-Compliant: Method not documented. If Not Applicable: DR not required. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Data Replication) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify replication method (synchronous, asynchronous, snapshot, backup-restore) in ARCHITECTURE.md Section 11.]

**Replication Frequency/Lag**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Replication frequency or lag is documented. If Non-Compliant: Not specified. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Data Replication) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document replication frequency or acceptable lag in ARCHITECTURE.md Section 11.]

**RPO Achieved by Replication Method**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO achieved by the replication method is stated. If Non-Compliant: RPO not documented. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Data Replication) or "Not documented"]
- Note: [If Non-Compliant or Unknown: State the RPO achieved by the chosen replication method in ARCHITECTURE.md Section 11.]

**Network Bandwidth and Performance Impact**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Network bandwidth and performance impact are assessed. If Non-Compliant: Not assessed. If Not Applicable: DR not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Data Replication) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Assess and document network bandwidth and performance impact of replication in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Data Replication)]

---

## 12. Recovery Time Objective (RTO) Definition (LACN012)

**Requirement**: Define the RTO representing the maximum tolerable downtime before business impact becomes unacceptable, differentiated by failure type, with business-driven justification and documented stakeholder approval.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-RTO

### 12.1 RTO Documentation

**RTO Value**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO value is clearly documented (e.g., 4 hours). If Non-Compliant: RTO not defined. If Not Applicable: N/A. If Unknown: Cannot determine from source.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements) or Section 11 (Operational → DR) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define RTO value in ARCHITECTURE.md Section 10 under Non-Functional Requirements.]

**RTO Differentiated by Failure Type**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO is differentiated by failure type (local vs. disaster). If Non-Compliant: Not differentiated. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements) or Section 11 (Operational → DR) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add separate RTO values for component failure and site disaster scenarios in ARCHITECTURE.md Section 10 or 11.]

**Business Justification for RTO**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business justification for RTO is provided. If Non-Compliant: No justification. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document business justification for RTO in ARCHITECTURE.md Section 10, including revenue loss and operational impact.]

**Stakeholder Approval of RTO**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO is approved by business stakeholders. If Non-Compliant: Approval not documented. If Not Applicable: N/A. If Unknown: Approval status not verifiable.]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Obtain and document stakeholder approval of RTO in ARCHITECTURE.md Section 10.]

**Source References**: [ARCHITECTURE.md Section 10 (Non-Functional Requirements), Section 11 (Operational → DR)]

---

## 13. Contingency and DR Testing Requirement (LACN013)

**Requirement**: Determine if contingency and disaster recovery procedures must be regularly tested and validated, specifying testing frequency, test types, success criteria, roles/responsibilities, and a post-test review and improvement process.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 13.1 DR Testing Plan

**DR Testing Requirement (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DR testing requirement is clearly stated. If Non-Compliant: Requirement not defined. If Not Applicable: N/A. If Unknown: Cannot determine.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Testing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add DR testing requirement to ARCHITECTURE.md Section 11.]

**Testing Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Testing frequency is specified (monthly, quarterly, annually). If Non-Compliant: Frequency not defined. If Not Applicable: Testing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Testing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify DR test frequency in ARCHITECTURE.md Section 11 (e.g., monthly tabletop, quarterly partial, annual full).]

**Test Types and Scenarios**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Test types and scenarios are documented. If Non-Compliant: Not documented. If Not Applicable: Testing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Testing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document test types (tabletop, partial, full failover) and scenarios in ARCHITECTURE.md Section 11.]

**Success Criteria and Validation Procedures**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Success criteria and validation procedures are defined. If Non-Compliant: Not defined. If Not Applicable: Testing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Testing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define success criteria and validation procedures for DR tests in ARCHITECTURE.md Section 11.]

**Post-Test Review and Improvement Process**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Post-test review and improvement process is established. If Non-Compliant: Process not documented. If Not Applicable: Testing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Testing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Establish a post-test review and improvement process in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Testing)]

---

## 14. Resilience to Transient Component Failures (LACN014)

**Requirement**: Verify that the application implements resilience patterns (circuit breakers, retries with exponential backoff, timeouts, fallbacks, bulkheads) to handle transient failures of internal or external components, with documented failure handling strategies per critical dependency.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 14.1 Resilience Pattern Coverage

**Resilience to Component Failures (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Resilience to component failures is documented. If Non-Compliant: Not documented. If Not Applicable: N/A. If Unknown: Cannot determine.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Resilience) or Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add resilience requirements to ARCHITECTURE.md Section 7 or 11.]

**Resilience Patterns Implemented**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Resilience patterns are specified (circuit breaker, retry, timeout, fallback, bulkhead). If Non-Compliant: Patterns not documented. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: List implemented resilience patterns in ARCHITECTURE.md Section 7.]

**Failure Handling Strategy per Critical Dependency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Failure handling strategy is defined for each critical dependency. If Non-Compliant: Strategies not documented. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document failure handling strategy per critical dependency in ARCHITECTURE.md Section 7.]

**Graceful Degradation Behavior**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Graceful degradation behavior is documented. If Non-Compliant: Not documented. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document graceful degradation behavior in ARCHITECTURE.md Section 7.]

**Monitoring and Alerting for Component Failures**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Monitoring and alerting for component failures is configured. If Non-Compliant: Not configured. If Not Applicable: N/A. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Resilience) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add monitoring and alerting configuration for component failures in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Resilience), Section 7 (Application Architecture → Resilience Patterns)]

---

## 15. Batch Processing Requirement (LACN015)

**Requirement**: Determine if the platform executes batch processing jobs or scheduled workloads, documenting a batch job inventory with execution schedules, dependencies, data volumes, and criticality rating to enable prioritized recovery during DR scenarios.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 15.1 Batch Processing Assessment

**Batch Processing Requirement (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Batch processing requirement is clearly stated. If Non-Compliant: Requirement not defined. If Not Applicable: N/A. If Unknown: Cannot determine.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or Section 11 (Operational) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add batch processing requirement (Yes/No) to ARCHITECTURE.md Section 7 or 11.]

**Batch Job Inventory**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Batch job inventory is documented. If Non-Compliant: Inventory missing. If Not Applicable: Batch processing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create batch job inventory in ARCHITECTURE.md Section 7 listing all jobs with schedules, dependencies, and data volumes.]

**Execution Schedule and Triggers**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Execution schedule and triggers are defined. If Non-Compliant: Not defined. If Not Applicable: Batch processing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document execution schedule and triggers for each batch job in ARCHITECTURE.md Section 7.]

**Criticality and Recovery Priority per Job**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Criticality and recovery priority for each batch job is specified. If Non-Compliant: Not specified. If Not Applicable: Batch processing not required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add criticality and DR recovery priority for each batch job in ARCHITECTURE.md Section 7.]

**Source References**: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing), Section 11 (Operational)]

---

## 16. Batch Execution Type (LACN016)

**Requirement**: Classify batch job execution patterns (scheduled, event-triggered, manual, or on-demand) as execution type impacts DR recovery sequencing — scheduled jobs may need catch-up after outage while event-triggered jobs may need message queue replay.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 16.1 Batch Execution Classification

**Batch Execution Type per Job**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Batch execution type is documented for each job. If Non-Compliant: Not documented. If Not Applicable: No batch processing. If Unknown: Not clearly specified.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document execution type (scheduled/event-triggered/manual/on-demand) for each batch job in ARCHITECTURE.md Section 7.]

**Execution Schedule or Trigger Conditions**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Execution schedule or trigger conditions are specified. If Non-Compliant: Not specified. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document execution schedules or trigger conditions in ARCHITECTURE.md Section 7.]

**Catch-Up or Replay Strategy After DR Failover**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Catch-up or replay strategy after DR failover is defined. If Non-Compliant: Strategy not defined. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define catch-up or message queue replay strategy for batch jobs after DR failover in ARCHITECTURE.md Section 7.]

**Job Orchestration and Dependency Management**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Job orchestration and dependency management is documented. If Non-Compliant: Not documented. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document job orchestration and inter-job dependencies in ARCHITECTURE.md Section 7.]

**Source References**: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing)]

---

## 17. Batch Job Reprocessing on Failure (LACN017)

**Requirement**: Determine if failed batch jobs must support safe reprocessing or retry, requiring idempotency design, checkpoint/resume state tracking, transactional consistency, and input/output validation to avoid data inconsistencies.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-DR

### 17.1 Batch Reprocessing Design

**Reprocessing Requirement per Critical Batch Job**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Reprocessing requirement is stated for each critical batch job. If Non-Compliant: Not documented. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing → Error Handling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document reprocessing requirements per batch job in ARCHITECTURE.md Section 7.]

**Idempotency Design**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Idempotency design is documented (running same job multiple times yields same result). If Non-Compliant: Not documented. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing → Error Handling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document idempotency design for batch jobs in ARCHITECTURE.md Section 7.]

**Checkpoint/Resume Mechanism**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Checkpoint/resume mechanism is implemented to enable resume from last checkpoint. If Non-Compliant: Not implemented. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing → Error Handling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement and document checkpoint/resume mechanism in ARCHITECTURE.md Section 7.]

**Error Handling and Retry Logic**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Error handling and retry logic is specified. If Non-Compliant: Not specified. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing → Error Handling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document error handling and retry logic for batch jobs in ARCHITECTURE.md Section 7.]

**Data Validation Before and After Processing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data validation before and after processing is defined. If Non-Compliant: Not defined. If Not Applicable: No batch processing. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing → Error Handling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data validation procedures (input and output) for batch jobs in ARCHITECTURE.md Section 7.]

**Source References**: [ARCHITECTURE.md Section 7 (Application Architecture → Batch Processing → Error Handling)]

---

## 18. Periodic Data Backup Requirement (LACN018)

**Requirement**: Determine if periodic backups of application data are required for recovery purposes, documenting backup scope (databases, file storage, configurations), recovery scenarios addressed, and any compliance or regulatory backup mandates.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 18.1 Backup Requirement Assessment

**Backup Requirement (Yes/No)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup requirement is clearly stated. If Non-Compliant: Not documented. If Not Applicable: No backup required. If Unknown: Cannot determine.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add backup requirement (Yes/No) to ARCHITECTURE.md Section 11.]

**Backup Scope (Data Stores and Configurations)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup scope is defined (which databases, file storage, configurations). If Non-Compliant: Scope not defined. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define backup scope in ARCHITECTURE.md Section 11, listing all data stores and configurations to back up.]

**Recovery Scenarios Requiring Backups**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Recovery scenarios requiring backups are documented. If Non-Compliant: Scenarios not documented. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document recovery scenarios (data corruption, ransomware, accidental deletion) in ARCHITECTURE.md Section 11.]

**Compliance or Regulatory Backup Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Compliance or regulatory backup requirements are identified. If Non-Compliant: Not identified. If Not Applicable: No regulatory requirements. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify applicable compliance backup requirements (GDPR, HIPAA, PCI-DSS) in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore)]

---

## 19. Backup Frequency (LACN019)

**Requirement**: Specify the frequency of data backups (continuous, hourly, daily, weekly, or custom) based on RPO requirements, including the full vs. incremental backup strategy and how the schedule accounts for maintenance windows and system load.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 19.1 Backup Schedule

**Backup Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup frequency is specified. If Non-Compliant: Not documented. If Not Applicable: No backup required. If Unknown: Not clearly specified.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Schedule) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify backup frequency (continuous/hourly/daily/weekly) in ARCHITECTURE.md Section 11.]

**Full vs. Incremental Backup Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Full vs. incremental backup strategy is documented. If Non-Compliant: Strategy not documented. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Schedule) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document full vs. incremental backup strategy in ARCHITECTURE.md Section 11.]

**RPO Achieved by Backup Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO achieved by the backup frequency is stated. If Non-Compliant: Not stated. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Schedule) or "Not documented"]
- Note: [If Non-Compliant or Unknown: State the RPO achieved by the chosen backup frequency in ARCHITECTURE.md Section 11.]

**Backup Schedule Accounts for Maintenance Windows**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup schedule accounts for maintenance windows and system load. If Non-Compliant: Not considered. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Schedule) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Adjust backup schedule to avoid peak load windows and document in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Schedule)]

---

## 20. Backup Retention Period (LACN020)

**Requirement**: Define how long backup copies must be retained before deletion, balancing recovery needs with storage costs and compliance requirements, and specifying a tiered retention strategy for different backup types.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 20.1 Retention Policy

**Retention Period**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retention period is specified (days, months, years). If Non-Compliant: Not documented. If Not Applicable: No backup required. If Unknown: Not clearly specified.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Retention) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify retention period in ARCHITECTURE.md Section 11.]

**Retention Differentiated by Backup Type**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retention is differentiated by backup type (daily, weekly, monthly). If Non-Compliant: Not differentiated. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Retention) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define retention periods per backup type in ARCHITECTURE.md Section 11.]

**Regulatory or Compliance Retention Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Regulatory or compliance retention requirements are documented. If Non-Compliant: Not documented. If Not Applicable: No regulatory requirements apply. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Retention) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Identify and document applicable regulatory retention requirements (financial, healthcare, legal) in ARCHITECTURE.md Section 11.]

**Tiered Storage Strategy for Cost Optimization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Tiered storage strategy (hot/warm/cold archive) is defined. If Non-Compliant: Not defined. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Retention) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define tiered storage strategy for cost optimization in ARCHITECTURE.md Section 11.]

**Backup Deletion and Cleanup Procedures**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup deletion and cleanup procedures are documented. If Non-Compliant: Not documented. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Retention) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document backup deletion and automated cleanup procedures in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Retention)]

---

## 21. Backup Versioning Strategy (LACN021)

**Requirement**: Determine if backups should overwrite previous versions or maintain historical versions for point-in-time recovery, assessing the number of versions to retain and storage cost impact for ransomware protection and auditing scenarios.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 21.1 Versioning Configuration

**Versioning Strategy (Overwrite vs. Historical)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Versioning strategy is clearly specified. If Non-Compliant: Not documented. If Not Applicable: No backup required. If Unknown: Not clearly specified.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Versioning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify versioning strategy (overwrite or historical) in ARCHITECTURE.md Section 11.]

**Number of Versions Retained**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Number of historical versions retained is documented. If Non-Compliant: Not documented. If Not Applicable: Overwrite strategy in use or no backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Versioning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document number of versions to retain in ARCHITECTURE.md Section 11.]

**Point-in-Time Recovery Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Point-in-time recovery requirements are defined. If Non-Compliant: Not defined. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Versioning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define point-in-time recovery requirements in ARCHITECTURE.md Section 11.]

**Storage Cost Impact of Versioning**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Storage cost impact is assessed and approved. If Non-Compliant: Not assessed. If Not Applicable: No backup required. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Versioning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Assess and document storage cost impact of versioning strategy in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Versioning)]

---

## 22. Data Recreation Difficulty Assessment (LACN022)

**Requirement**: Assess the difficulty and effort required to recreate lost data if backups are unavailable, categorizing each data store and ensuring backup frequency and redundancy align with recreation difficulty.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 22.1 Data Recreation Assessment

**Recreation Difficulty per Data Store**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data recreation difficulty is assessed for each data store. If Non-Compliant: Not assessed. If Not Applicable: N/A. If Unknown: Not clearly specified.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or Section 1 (Business Context) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Assess data recreation difficulty (impossible/very difficult/moderate/easy) per data store in ARCHITECTURE.md Section 11 or 1.]

**Assessment Includes Time, Cost, and Business Impact**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Assessment includes time, cost, and business impact. If Non-Compliant: Assessment incomplete. If Not Applicable: N/A. If Unknown: Not verifiable.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or Section 1 (Business Context) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Include time, cost, and business impact estimates in data recreation assessment in ARCHITECTURE.md Section 1 or 11.]

**Backup Frequency Aligns with Recreation Difficulty**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup frequency and redundancy align with recreation difficulty. If Non-Compliant: Misaligned. If Not Applicable: N/A. If Unknown: Not verifiable.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Align backup frequency and redundancy to match data recreation difficulty in ARCHITECTURE.md Section 11.]

**Enhanced Protection for Critical (Impossible to Recreate) Data**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Critical data has enhanced protection (more frequent backups, multiple copies). If Non-Compliant: Enhanced protection not in place. If Not Applicable: No impossible-to-recreate data. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Add enhanced backup protection for impossible-to-recreate data in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore), Section 1 (Business Context)]

---

## 23. Business Impact of Data Loss (LACN023)

**Requirement**: Quantify the business impact if data is lost (revenue loss, operational disruption, regulatory penalties, reputation damage) to drive backup investment decisions and ensure backup strategy aligns with impact severity.
**Status**: [Status]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 23.1 Business Impact Analysis

**Business Impact Quantified (Revenue, Penalties, Operational Cost)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Business impact of data loss is quantified. If Non-Compliant: Impact not assessed. If Not Applicable: N/A. If Unknown: Partially assessed but not quantified.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Business Impact Analysis) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Quantify business impact (revenue per hour, penalty amounts, operational costs) in ARCHITECTURE.md Section 1.]

**Impact Assessment Approved by Business Stakeholders**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Impact assessment is documented and approved by business stakeholders. If Non-Compliant: Not approved. If Not Applicable: N/A. If Unknown: Approval status not verifiable.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Business Impact Analysis) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Obtain and document stakeholder approval of impact assessment in ARCHITECTURE.md Section 1.]

**Backup Strategy Aligns with Impact Severity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup strategy (frequency, redundancy, testing) aligns with impact severity. If Non-Compliant: Misaligned. If Not Applicable: N/A. If Unknown: Not verifiable.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Business Impact Analysis) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Align backup strategy with business impact severity in ARCHITECTURE.md Section 11.]

**Enhanced Protection for High-Impact Data**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Critical data with high business impact has enhanced protection measures. If Non-Compliant: Enhanced protection not in place. If Not Applicable: No high-impact data identified. If Unknown: Not found.]
- Source: [ARCHITECTURE.md Section 1 (Business Context → Business Impact Analysis) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement enhanced backup protection for high-impact data and document in ARCHITECTURE.md Section 11.]

**Source References**: [ARCHITECTURE.md Section 1 (Business Context → Business Impact Analysis)]

---

## 24. RPO Validation with Business Stakeholders (LACN024)

**Requirement**: Confirm that the Recovery Point Objective (RPO) - maximum acceptable data loss - has been validated and approved by business stakeholders.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-RTO

### 24.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO documented and approved by business stakeholders. If Non-Compliant: RPO not defined or approved. If Not Applicable: N/A. If Unknown: Partially mentioned but not formally validated]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements) or Section 11 (Operational → Backup & DR) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define and validate RPO with business stakeholders in Section 10]

### 24.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 10 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN024]

---

## 25. Geographic Backup Distribution (LACN025)

**Requirement**: Determine if backups must be stored in a geographically separate location to protect against site-wide disasters.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 25.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Geographic distribution specified with secondary backup location. If Non-Compliant: Not documented. If Not Applicable: Not required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Geographic Distribution) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document geographic backup distribution in Section 11]

### 25.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN025]

---

## 26. Infrastructure Configuration Backup (LACN026)

**Requirement**: Determine if infrastructure configurations, operating system settings, and system files require backup (often called BDI - Base de Infraestructura).
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 26.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Infrastructure backup scope documented with mechanism. If Non-Compliant: Not documented. If Not Applicable: Not required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Infrastructure) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document infrastructure backup strategy in Section 11]

### 26.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN026]

---

## 27. Infrastructure Change Log Backup (LACN027)

**Requirement**: Determine if audit logs of infrastructure changes must be backed up for compliance, troubleshooting, and forensic analysis.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 27.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Log backup requirement stated with retention period. If Non-Compliant: Not documented. If Not Applicable: Not required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Logging & Monitoring or Backup & Restore) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document infrastructure log backup in Section 11]

### 27.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN027]

---

## 28. Full Application Restore Capability (LACN028)

**Requirement**: Verify that the complete application can be restored from backups if all components fail simultaneously (worst-case scenario).
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 28.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Full restore procedures documented and tested. If Non-Compliant: Not documented or tested. If Not Applicable: N/A. If Unknown: Partially documented but not tested]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Testing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document and test full restore procedures in Section 11]

### 28.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN028]

---

## 29. Sensitive Data Classification (LACN029)

**Requirement**: Identify if the platform handles sensitive data such as customer PII, financial data, or other regulated information requiring enhanced backup protection.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 29.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Sensitive data classified with enhanced backup controls. If Non-Compliant: Not documented. If Not Applicable: No sensitive data. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 8 (Security Architecture → Data Classification) or Section 11 (Operational) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document sensitive data classification in Section 8 or Section 11]

### 29.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 8 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN029]

---

## 30. Backup Responsibility Assignment (LACN030)

**Requirement**: Define who is responsible for executing, monitoring, and validating backups: infrastructure team, DBA team, application team, or managed service provider.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 30.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup responsibility clearly assigned with RACI. If Non-Compliant: Not assigned. If Not Applicable: No backup required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Responsibilities) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Assign backup responsibility in Section 11]

### 30.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN030]

---

## 31. Backup Download to Local/On-Premises Repository (LACN031)

**Requirement**: Determine if backups stored in cloud or managed services can be downloaded to local or on-premises storage for additional protection.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-BACKUP

### 31.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Hybrid backup strategy documented with download frequency. If Non-Compliant: Not documented. If Not Applicable: Not required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Backup & Restore → Hybrid Strategy) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document hybrid backup strategy in Section 11]

### 31.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN031]

---

## 32. DR Activation Automation Capability (LACN032)

**Requirement**: Assess if disaster recovery activation can be automated rather than requiring manual procedures.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-AUTO

### 32.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DR automation capability assessed with automation scope. If Non-Compliant: Not assessed. If Not Applicable: DR not required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Automation) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document DR automation capability in Section 11]

### 32.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN032]

---

## 33. Automatable DR Components (LACN033)

**Requirement**: Identify which specific components and procedures can be automated during disaster recovery activation.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-AUTO

### 33.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Automatable components listed with tooling. If Non-Compliant: Not identified. If Not Applicable: DR not required. If Unknown: Not clearly specified]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Automation) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document automatable DR components in Section 11]

### 33.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN033]

---

## 34. Circuit Breaker Pattern Requirement (LACN034)

**Requirement**: Determine if the application requires circuit breaker pattern to prevent cascading failures when downstream services are unavailable or slow.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 34.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Circuit breaker implemented with configuration documented. If Non-Compliant: Not implemented. If Not Applicable: No distributed service calls. If Unknown: Partially mentioned but not configured]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement circuit breaker pattern in Section 7]

### 34.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 7 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN034]

---

## 35. Retry with Exponential Backoff Pattern (LACN035)

**Requirement**: Implement retry logic with exponential backoff to handle transient failures in distributed systems and third-party integrations.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 35.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retry with backoff implemented with configuration documented. If Non-Compliant: Not implemented. If Not Applicable: No external calls. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement retry with exponential backoff in Section 7]

### 35.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 7 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN035]

---

## 36. Timeout Configuration for External Services (LACN036)

**Requirement**: Implement appropriate timeout values for calls to third-party and external services to prevent blocking and cascading slowness.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 36.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Timeout values documented per external service. If Non-Compliant: Not configured. If Not Applicable: No external service calls. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or Section 5 (Integrations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document timeout configuration in Section 7 or Section 5]

### 36.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 7 or Section 5 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN036]

---

## 37. Timeboxing for Automated Contingency/DRP Activation (LACN037)

**Requirement**: Define time-bound triggers for automated contingency or disaster recovery activation to limit blast radius and ensure timely response.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 37.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Timeboxing thresholds documented with health check configuration. If Non-Compliant: Not defined. If Not Applicable: Manual DR only. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 11 (Operational → Disaster Recovery → Automation) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document timeboxing triggers in Section 11]

### 37.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN037]

---

## 38. Fallback Response Pattern (LACN038)

**Requirement**: Implement fallback responses or degraded functionality when primary services or features are unavailable.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 38.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Fallback strategy documented per feature with user experience defined. If Non-Compliant: Not implemented. If Not Applicable: No degradable features. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement fallback responses in Section 7]

### 38.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 7 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN038]

---

## 39. Bulkhead Isolation Pattern (LACN039)

**Requirement**: Implement bulkhead pattern to isolate failing components and prevent cascading failures across services.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 39.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Bulkhead isolation implemented with resource partitions documented. If Non-Compliant: Not implemented. If Not Applicable: No shared resource contention risk. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Resilience Patterns) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement bulkhead pattern in Section 7]

### 39.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 7 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN039]

---

## 40. Auto-Scaling with Health-Based Instance Replacement (LACN040)

**Requirement**: Implement auto-scaling with health checks to automatically replace failed instances across multiple availability zones.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 40.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Auto-scaling configured with health checks and multi-AZ deployment. If Non-Compliant: Not configured. If Not Applicable: Not required. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 11 (Operational → Auto-Scaling) or Section 4 (Deployment Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure auto-scaling with health checks in Section 4 or Section 11]

### 40.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 11 or Section 4 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN040]

---

## 41. Load Balancing for Automatic Traffic Distribution (LACN041)

**Requirement**: Implement load balancing to automatically distribute traffic across multiple instances and availability zones.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 41.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Load balancer type and configuration documented. If Non-Compliant: Not configured. If Not Applicable: Not required. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 4 (Deployment Architecture → Load Balancing) or Section 11 (Operational) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document load balancing configuration in Section 4 or Section 11]

### 41.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 4 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN041]

---

## 42. Queue-Based Load Leveling Pattern (LACN042)

**Requirement**: Implement queue-based load leveling to absorb traffic spikes and process workloads asynchronously without impacting service availability.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 42.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Queue technology and consumer scaling documented. If Non-Compliant: Not implemented. If Not Applicable: No async processing required. If Unknown: Not documented]
- Source: [ARCHITECTURE.md Section 7 (Application Architecture → Asynchronous Processing) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement queue-based load leveling in Section 7]

### 42.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 7 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN042]

---

## 43. Single Points of Failure (SPOF) Identification (LACN043)

**Requirement**: Identify all potential single points of failure in the architecture that could cause complete service outage if they fail.
**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Role or N/A]
**Category**: BC-CLOUD

### 43.1 Implementation

**Implementation Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: SPOF analysis documented with mitigation strategies. If Non-Compliant: Analysis not performed. If Not Applicable: N/A. If Unknown: Not clearly documented]
- Source: [ARCHITECTURE.md Section 3 (Architecture Overview) or Section 11 (Operational → High Availability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Perform SPOF analysis and document in Section 3 or Section 11]

### 43.2 Validation

**Validation Evidence**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [Validation results and evidence]
- Source: [ARCHITECTURE.md Section 3 or Section 11 or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document validation approach]

**Source References**: [ARCHITECTURE.md sections used for LACN043]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Business Continuity Terms**:
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime before business impact becomes unacceptable
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss measured in time
- **DR (Disaster Recovery)**: Process and procedures for recovering IT systems after a disaster
- **Failover**: Automatic switching to redundant system when primary system fails
- **Backup**: Copy of data stored separately for recovery purposes
- **High Availability (HA)**: System design ensuring minimal downtime through redundancy
- **Business Continuity Plan (BCP)**: Documented procedures for maintaining business operations during disruptions
- **Hot Site**: Fully operational backup facility ready for immediate failover
- **Cold Site**: Backup location with basic infrastructure requiring configuration before use
- **Warm Site**: Partially configured backup facility requiring some setup time
- **Circuit Breaker**: Resilience pattern that prevents cascading failures by failing fast
- **Exponential Backoff**: Retry strategy with progressively increasing wait times
- **Bulkhead**: Isolation pattern that prevents failures from spreading
- **Auto-Scaling**: Automatic adjustment of compute resources based on demand or health

<!-- @include shared/fragments/status-codes.md -->

**Compliance Abbreviations**:
- **LACN**: Business Continuity compliance requirement code (new standard)
- **BC-GEN**: General information requirements
- **BC-RTO**: Recovery time objective requirements
- **BC-DR**: Disaster recovery requirements
- **BC-BACKUP**: Backup and restore requirements
- **BC-AUTO**: Automation requirements
- **BC-CLOUD**: Cloud resilience requirements
- **MTTR**: Mean Time To Recovery
- **MTBF**: Mean Time Between Failures
- **SLA**: Service Level Agreement
- **SPOF**: Single Point of Failure

---

<!-- @include-with-config shared/sections/validation-methodology.md config=business-continuity -->

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common Business Continuity Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| Application name not documented | LACN001 Non-Compliant | Section 1 or 2 | Add official application name, acronyms, and aliases |
| RTO/RPO values not defined | LACN012,LACN024 Non-Compliant | Section 10 (Non-Functional Requirements) | Define recovery objectives (e.g., RTO: 4 hours, RPO: 1 hour) |
| HA components not identified | LACN007 Unknown | Section 11 (Operational → High Availability) | List HA components with deployment patterns (active-active/passive) |
| DR architecture not specified | LACN010 Non-Compliant | Section 11 (Operational → Disaster Recovery) | Specify DR pattern (cold/warm/hot/active-active) and site locations |
| Backup strategy undefined | LACN018-LACN021 Non-Compliant | Section 11 (Operational → Backup & DR) | Document backup frequency, retention, storage location, versioning |
| DR testing plan missing | LACN013 Non-Compliant | Section 11 (Operational → Disaster Recovery) | Define DR drill schedule, validation procedures, success criteria |
| Failover mechanisms not specified | LACN007 Unknown | Section 11 (Operational → High Availability) | Specify automatic failover configuration and triggers |
| Data replication undefined | LACN011 Unknown | Section 11 (Operational → Backup & DR) | Document geo-replication strategy, sync/async, RPO alignment |
| Resilience patterns not implemented | LACN034-LACN039 Unknown | Section 7 (Application Architecture → Resilience) | Implement circuit breaker, retry, timeout, fallback, bulkhead patterns |
| SPOF not identified | LACN043 Unknown | Section 3 or 11 | Document single points of failure and mitigation strategies |

---

#### A.3.2 Step-by-Step Remediation Workflow

<!-- @include shared/sections/remediation-workflow-guide.md -->

**Business Continuity-Specific Examples**:

**Example 1: Defining RTO and RPO (LACN012, LACN024)**
- **Gap**: RTO/RPO values not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add RTO/RPO objectives to Section 10:
   RTO: 4 hours (maximum acceptable downtime),
   RPO: 1 hour (maximum acceptable data loss),
   Availability target: 99.9% (43 minutes downtime/month),
   Business justification: Payment processing requires <4hr recovery"
  ```
- **Expected Outcome**: Section 10 with RTO, RPO, availability targets
- **Impact**: LACN012, LACN024 → Compliant

**Example 2: Backup Strategy Documentation (LACN018-LACN021)**
- **Gap**: Backup strategy not defined
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add backup strategy to Section 11 → Backup & DR:
   Periodic backups required: Yes,
   Frequency: Full backup daily at 2 AM, incremental every 6 hours,
   Retention: 30 days online (hot storage), 90 days warm, 7 years archival,
   Storage: AWS S3 with cross-region replication to us-west-2,
   Versioning: Historical versions retained (30 daily, 12 monthly, 7 yearly),
   Encryption: AES-256 at rest, TLS 1.3 in transit,
   Testing: Monthly restore validation, quarterly full DR drill"
  ```
- **Expected Outcome**: Section 11 with complete backup strategy
- **Impact**: LACN018, LACN019, LACN020, LACN021 → Compliant

**Example 3: Disaster Recovery Architecture (LACN009-LACN011)**
- **Gap**: DR architecture not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add DR architecture to Section 11 → Disaster Recovery:
   DR Required: Yes (catastrophic regional failures),
   DR Pattern: Warm standby (infrastructure provisioned, not fully running),
   Primary Site: AWS us-east-1 (3 AZs),
   DR Site: AWS us-west-2 (3 AZs),
   Replication: Asynchronous database replication (RPO 5 minutes),
   Failover: Semi-automated with manual approval gate,
   RTO Target: 2 hours (from declaration to full service restoration)"
  ```
- **Expected Outcome**: Section 11 with DR architecture, sites, replication, RTO
- **Impact**: LACN009, LACN010, LACN011 → Compliant

**Example 4: Resilience Patterns (LACN034-LACN039)**
- **Gap**: Cloud resilience patterns not implemented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add resilience patterns to Section 7 → Application Architecture → Resilience:
   Circuit Breaker: Implemented using Resilience4j for all external API calls,
     - Failure threshold: 50% failures over 10 requests
     - Open duration: 60 seconds before retry
   Retry with Exponential Backoff: Max 3 retries, initial delay 1s, backoff 2x, max 30s,
   Timeouts: Connection 5s, Read 30s for external services,
   Fallback: Cached responses for product catalog, default recommendations when ML fails,
   Bulkhead: Separate thread pools per external service (checkout: 20 threads, search: 50 threads)"
  ```
- **Expected Outcome**: Section 7 with complete resilience pattern implementation
- **Impact**: LACN034, LACN035, LACN036, LACN038, LACN039 → Compliant

**Example 5: Auto-Scaling and Load Balancing (LACN040-LACN041)**
- **Gap**: Auto-scaling and load balancing not documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add auto-scaling and load balancing to Section 4 → Deployment or Section 11 → Operational:
   Auto-Scaling: Enabled with health-based replacement,
     - Health check: HTTP /health endpoint every 30s,
     - Grace period: 300s for application startup,
     - Min instances: 2, Desired: 4, Max: 20,
     - Scaling policy: Target 70% CPU utilization,
     - Multi-AZ: Distributed across 3 availability zones,
   Load Balancing: Application Load Balancer (ALB),
     - Algorithm: Least outstanding requests,
     - Health check: /health every 30s, 2 consecutive successes,
     - Sticky sessions: Cookie-based, 1 hour TTL,
     - Cross-zone: Enabled for even distribution"
  ```
- **Expected Outcome**: Section 4 or 11 with auto-scaling and load balancing configuration
- **Impact**: LACN040, LACN041 → Compliant

---

#### A.3.3 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required business continuity fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all recovery procedures

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete General Information (BC-GEN)** (5 requirements, estimated impact: +0.5 points)
   - LACN001: Document application name and aliases (Section 1 or 2)
   - LACN002: Specify architecture type and deployment model (Section 3 or 4)
   - LACN003: Define number of architecture layers (Section 3)
   - LACN004: Document infrastructure type (physical, virtual, containers) (Section 4 or 11)
   - LACN005: Identify all critical dependencies with impact analysis (Section 1 or 5)

2. **Define Recovery Objectives (BC-RTO)** (2 requirements, estimated impact: +0.6 points)
   - LACN012: Define RTO with business justification (Section 10)
   - LACN024: Validate RPO with business stakeholders and document approval (Section 10)

3. **Establish Disaster Recovery (BC-DR)** (11 requirements, estimated impact: +1.2 points)
   - LACN006-LACN008: Document HA requirements, components, local contingency (Section 11)
   - LACN009-LACN011: Define DR requirements, architecture pattern, replication method (Section 11)
   - LACN013: Create DR testing plan with schedule and success criteria (Section 11)
   - LACN014: Document resilience to transient component failures (Section 7 or 11)
   - LACN015-LACN017: Document batch processing, execution types, reprocessing strategy (Section 7 or 11)

4. **Implement Backup Strategy (BC-BACKUP)** (13 requirements, estimated impact: +1.5 points)
   - LACN018-LACN021: Document backup requirements, frequency, retention, versioning (Section 11)
   - LACN022-LACN024: Assess data recreation difficulty and business impact (Section 1 or 11)
   - LACN025: Implement geographic backup distribution (Section 11)
   - LACN026-LACN028: Document infrastructure and log backups, full restore capability (Section 11)
   - LACN029-LACN031: Document sensitive data classification, backup responsibility, hybrid strategy (Section 8 or 11)

5. **Enable DR Automation (BC-AUTO)** (2 requirements, estimated impact: +0.3 points)
   - LACN032: Assess DR automation capability and approach (Section 11)
   - LACN033: Identify and document automatable components with tooling (Section 11)

6. **Implement Cloud Resilience (BC-CLOUD)** (10 requirements, estimated impact: +1.0 points)
   - LACN034: Implement circuit breaker pattern (Section 7)
   - LACN035: Implement retry with exponential backoff (Section 7)
   - LACN036: Configure timeouts for external services (Section 7)
   - LACN037: Define timeboxing for automated DR activation (Section 11)
   - LACN038: Implement fallback responses (Section 7)
   - LACN039: Implement bulkhead isolation pattern (Section 7)
   - LACN040: Configure auto-scaling with health-based replacement (Section 4 or 11)
   - LACN041: Implement load balancing (Section 4 or 11)
   - LACN042: Implement queue-based load leveling (Section 7)
   - LACN043: Identify and document SPOFs with mitigation (Section 3 or 11)

**Priority Order**: 
1. BC-RTO (LACN012, LACN024) - Foundation
2. BC-DR (LACN009-LACN011) - DR architecture
3. BC-BACKUP (LACN018-LACN021) - Backup strategy
4. BC-GEN (LACN001-LACN005) - Basic information
5. BC-CLOUD (LACN034-LACN043) - Resilience patterns
6. BC-AUTO (LACN032-LACN033) - Automation

**Estimated Final Score After Remediation**: 8.5-9.2/10 (AUTO_APPROVE)

---

### A.4 Change History

**Version 2.0 (Current)**:
- Complete template restructuring to SRE format
- Migrated from 10 LABC requirements to 43 LACN requirements
- Changed from section-based to table-based compliance summary format
- All content translated from Spanish to professional English with expanded phrasing
- Added 6-column compliance summary table (Code, Requirement, Category, Status, Source, Role)
- Organized into 6 categories: BC-GEN (5), BC-RTO (2), BC-DR (11), BC-BACKUP (13), BC-AUTO (2), BC-CLOUD (10)
- All 43 requirements include Implementation + Validation subsections
- Added A.2 Source Mapping Table appendix
- Updated A.3 with 43-requirement remediation examples
- Enhanced A.1 terminology with cloud resilience patterns
- All requirements have equal weight (no two-tier scoring)
- Data source: Compliance_Questionnaire_LACN.xlsx
- Total: 43 validation data points

**Version 1.0 (Previous)**:
- Section-based format with 5 narrative sections
- 10 LABC requirements
- Limited appendix structure (missing A.2)
- Basic PLACEHOLDER approach
- Limited source traceability

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=business-continuity -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=business-continuity -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.
