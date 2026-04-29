# Compliance Contract: Process Transformation and Automation

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Architecture Version**: [ARCHITECTURE_VERSION]
**Source**: ARCHITECTURE.md (Sections 3, 5, 6, 7, 8, 10, 11, 12)
**Version**: 2.0

---

<!-- @include-with-config shared/sections/document-control.md config=process-transformation -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=process-transformation -->

<!-- @include shared/fragments/compliance-score-calculation.md -->

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAA1 | BPM / DMS Feasibility and Impact Analysis | Process Transformation | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [BPM Architect / Information Architect or N/A] |
| LAA2 | BPM / DMS Operational Factors | Process Transformation | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [BPM Lead / DMS Administrator or N/A] |
| LAA3 | BPM / DMS License Usage | Process Transformation | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [License Manager / Solution Architect or N/A] |
| LAA4 | Document Management Alignment | Process Transformation | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Information Architect / DMS Administrator or N/A] |

<!-- @include shared/fragments/compliance-summary-footer.md -->

---

## Applicability

This contract evaluates compliance for **Business Process Management (BPM) platforms** and **Document Management Systems (DMS)** specifically. It is **not** a general-purpose automation contract — generic scripting, ETL pipelines, scheduled jobs, RPA bots without an underlying BPM engine, and one-off custom workflows are out of scope and route to other contracts (CC-010 SRE for batch jobs, CC-004 Development for custom services).

**This contract applies if and only if the project's architecture includes at least one of:**

- **A BPM platform** — a process orchestration / workflow engine that executes BPMN / case-management models with persistent state, human tasks, and process variables. Examples: **Camunda Platform / Camunda 8**, **Activiti**, **jBPM**, **Bonita**, **Flowable**, **IBM Business Automation Workflow** (formerly IBM BPM), **Pega Platform**, **Appian**, **ProcessMaker**, **Oracle BPM Suite**, **TIBCO ActiveMatrix BPM**, or any equivalent process engine.
- **A Document Management System** — an enterprise content / records management platform that stores, versions, classifies, and applies retention policies to documents, with an API or workflow surface for system integration. Examples: **IBM FileNet (P8)**, **Athento**, **Microsoft SharePoint** (when used as DMS, not just collaboration), **OpenText Documentum**, **Alfresco**, **OpenText Content Server**, **Nuxeo**, **Hyland OnBase**, **Box (Enterprise / Governance tier)**, **M-Files**, or any equivalent enterprise content management system.

**If the architecture contains NEITHER a BPM platform NOR a DMS**: mark all four LAA codes as **Not Applicable** with the justification "*No BPM platform or DMS in architecture — Process Transformation compliance does not apply to this project.*" The contract is scored N/A overall and exits the auto-approve gate as a no-op.

**If the architecture contains BPM-only** (e.g., Camunda orchestrating REST microservices with no document storage layer): apply LAA1 (process feasibility), LAA2 (BPM operational factors), LAA3 (BPM licensing). Mark LAA4 as **Not Applicable** with the justification "*No DMS in architecture — Document Management Alignment requirements scoped to projects with a Document Management System.*"

**If the architecture contains DMS-only** (e.g., Athento or FileNet with no separate BPM engine, where workflow needs are minimal or handled in application code): apply LAA1 (document-flow feasibility), LAA3 (DMS licensing), LAA4 (DMS alignment). Mark LAA2 as **Not Applicable** with the justification "*No BPM platform in architecture — BPM Operational Factors scoped to projects with a process orchestration engine.*" Note: most DMS platforms ship with an embedded workflow engine (FileNet has Process Engine; Athento has its own workflow layer); if the project actually uses that embedded engine for non-trivial process orchestration, treat the project as **both** BPM and DMS — apply all four LAAs.

**If the architecture contains BOTH BPM and DMS** (the canonical case — e.g., Camunda + FileNet, IBM BAW with FileNet, or Athento with embedded BPM driving document approval workflows): all four LAAs apply.

The validator agent MUST verify BPM/DMS presence by grepping `ARCHITECTURE.md` (Sections 4 Meta Architecture, 5 Component Model, 6 Data Model, 7 Integration View, 8 Technology Stack) for any of the platform names listed above. The verification result MUST be recorded in the External Validation Summary at the end of this contract under "Applicability Verification".

---

## 1. BPM / DMS Feasibility and Impact Analysis (LAA1)

**Requirement**: Provide comprehensive feasibility and impact analysis for the BPM platform and/or Document Management System, covering current manual workflow / paper-document effort, BPMN process maps and document lifecycle topology, integration with line-of-business systems, user experience impact on case workers / document handlers, and data classification of process variables / document content.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [BPM Architect / Information Architect or N/A]

### 1.1 Manual Workflow / Document Effort Baseline

**Current Manual Effort (FTE Hours/Week)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Manual effort quantified in FTE hours per week — for BPM, time spent on manual hand-offs / approvals / status updates the process engine will automate; for DMS, time spent on physical filing / manual document classification / paper-based retrieval the DMS will replace. If Non-Compliant: Manual effort not quantified. If Not Applicable: Net-new BPM/DMS deployment with no prior manual process. If Unknown: Manual workflow mentioned but effort not quantified]
- Source: [ARCHITECTURE.md Section 3 (Business Context → Business Problem or Goals) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Quantify current manual effort (e.g., 10 FTE hours/week on approval routing for the BPM case, or 8 FTE hours/week on document classification for the DMS) in Section 3 to establish a baseline against which BPM-token throughput / DMS-document throughput improvements can be measured]

**BPM Process / DMS Workflow Complexity Assessment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Complexity categorized — for BPM, by BPMN node count, gateway count (parallel/exclusive/inclusive), exception/escalation paths, sub-process nesting depth; for DMS, by document type taxonomy size, content classification rules, retention schedule complexity. If Non-Compliant: Complexity not assessed. If Not Applicable: N/A. If Unknown: Process or document workflow described but complexity unclear]
- Source: [ARCHITECTURE.md Section 3 (Business Context → Use Cases or Workflows) or Section 5 (Component Model) for BPM process diagrams / DMS workflow diagrams, or "Not documented"]
- Note: [If Non-Compliant or Unknown: Classify BPM process complexity (e.g., "moderate: 18 BPMN nodes, 4 gateways, 2 escalations, 1 sub-process") OR DMS workflow complexity (e.g., "complex: 12 document types, 4 retention classes, 3 classification taxonomies, e-signature integration") in Section 3 or 5]

**BPM / DMS ROI Justification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: ROI calculated with time savings and cost reduction — for BPM, faster cycle time per case (e.g., 5-day approval → 4-hour approval), reduced labor cost per process instance; for DMS, reduced storage costs (paper → digital), reduced retrieval time, reduced compliance risk on retention audits. If Non-Compliant: ROI not documented. If Not Applicable: Regulatory mandate (e.g., legal hold capability required by court order; ROI is N/A). If Unknown: Benefits mentioned but not quantified]
- Source: [ARCHITECTURE.md Section 3 (Business Context → Success Metrics) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Calculate projected BPM cycle-time reduction (e.g., "loan approval 5d → 4h, 96% reduction") and/or DMS storage / retrieval savings (e.g., "$120k/year physical storage eliminated, retrieval SLA 2 days → 30 sec") in Section 3 or 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA1.1]

### 1.2 BPM / DMS Integration Analysis

**Line-of-Business System Integration Points**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Integration points documented — for BPM, every system the process engine calls during a process instance (CRM, ERP, payment gateway, identity provider, notification service) with the connector / adapter type (Camunda External Task, REST connector, JMS bridge, IBM BAW Service Flow); for DMS, every system that pushes documents into or pulls from the DMS (email gateway, scanner pipeline, e-signature service, archive store) with the API protocol (CMIS, REST, SMB, IMAP, SOAP). If Non-Compliant: Integration requirements not specified. If Not Applicable: Standalone BPM (no external system calls) or standalone DMS (manual upload only). If Unknown: Integrations mentioned but systems not identified]
- Source: [ARCHITECTURE.md Section 5 (Component Model) or Section 7 (Integration View) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document all integrated systems by BPM connector type or DMS API surface in Section 5 or 7. For BPM: list every Service Task / External Task / Send Task and its target. For DMS: list every CMIS / REST endpoint and the systems consuming it]

**Data Flow Documentation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data flows mapped between systems. If Non-Compliant: Data movement not documented. If Not Applicable: No cross-system data transfer. If Unknown: Data mentioned but flows unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model) or Section 7 (Integration View) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Map data flows showing source → transformation → destination in Section 6 or 7]

**API Dependencies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API dependencies documented with endpoints and authentication. If Non-Compliant: API requirements not specified. If Not Applicable: No API integrations required. If Unknown: APIs mentioned but specifications unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Integration Catalog) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document required APIs (REST/SOAP/GraphQL), endpoints, and authentication methods in Section 7]

**Integration Error Handling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Integration error scenarios and retry logic documented. If Non-Compliant: Error handling not defined. If Not Applicable: N/A. If Unknown: Error handling mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Monitoring) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define integration failure scenarios, retry policies, and fallback mechanisms in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA1.2]

### 1.3 Case Worker / Document Handler Experience Impact

**Workflow Changes for Process Participants**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Workflow changes documented from the perspective of the people who interact with the BPM tasklist or DMS interface — for BPM, what each role (initiator, approver, reviewer, escalation handler) sees in the human tasklist and how their day-to-day responsibilities shift; for DMS, what document handlers (filers, classifiers, records officers, retrieval users) do differently when documents move from paper / shared drive to the DMS. If Non-Compliant: BPM/DMS user impact not assessed. If Not Applicable: Fully back-office BPM with no human tasks AND fully unattended DMS ingestion. If Unknown: BPM/DMS mentioned but participant impact unclear]
- Source: [ARCHITECTURE.md Section 3 (Business Context → User Stories or Use Cases) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document how BPM tasklist users and/or DMS document handlers' tasks change (e.g., "Approvers move from email-based approvals to Camunda Tasklist with 4h SLA"; "Records officers move from manual file plan filing to FileNet RM auto-classification with periodic audit") in Section 3]

**Tasklist / Document UI Modifications**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: User-facing surfaces documented — for BPM, the tasklist and form layer (Camunda Tasklist, IBM BAW Process Portal, Pega Case Worker UI, custom React/Angular embedded forms calling the engine REST API); for DMS, the user interface (FileNet Workplace XT / Content Navigator, Athento web client, SharePoint document library views, Alfresco Share, custom DMS portal). If Non-Compliant: BPM/DMS UI not specified. If Not Applicable: Headless BPM (no human tasks) or headless DMS (API-only, no human upload / retrieval). If Unknown: UI mentioned but specific surface unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture → Presentation Layer) or Section 5 (Component Model) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Name the specific BPM tasklist surface (Camunda Tasklist, BAW Process Portal, custom forms) and/or DMS UI (Workplace XT, Content Navigator, Athento client, SharePoint library, custom portal) and which forms / views are new in Section 4 or 5]

**Training Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Training plan documented for BPM tasklist users, DMS handlers, and process / records administrators. If Non-Compliant: Training needs not addressed. If Not Applicable: No human users (fully unattended BPM service flows AND fully unattended DMS ingestion). If Unknown: Training mentioned but scope unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Deployment) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define BPM tasklist training (claim/complete tasks, escalations, delegation), DMS user training (upload, classify, retrieve, lifecycle states), and admin training (BPMN model deployment, DMS taxonomy maintenance, retention schedule changes) in Section 11]

**Change Management**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Change management strategy documented — for BPM, how process participants migrate from the legacy manual workflow (email approval, paper-based hand-off) to the orchestrated BPMN flow; for DMS, how the organization migrates from shared drives / paper archives to the DMS-managed lifecycle, including bulk-import / back-scan plans and parallel-run periods. If Non-Compliant: Adoption strategy not defined. If Not Applicable: N/A. If Unknown: Rollout mentioned but plan unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Deployment) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document phased BPM rollout (pilot process model → full production), DMS bulk-load / back-scan plan, stakeholder communication, and adoption metrics (e.g., % of cases originated in BPM vs legacy email; % of documents stored in DMS vs file shares) in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA1.3]

### 1.4 Process Variable / Document Content Assessment

**Process Variable / Document Source Identification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Inputs identified — for BPM, every process variable the engine reads or writes during a process instance and where it originates (form input, REST call, External Task return, message payload, DMS document property); for DMS, every source feeding documents into the repository (scanner pipeline, email gateway, e-signature service, line-of-business app push, manual upload). If Non-Compliant: Sources not identified. If Not Applicable: Trivial process with no variables AND/OR DMS-only with single ingestion path already obvious. If Unknown: BPM/DMS mentioned but inputs unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Sources) or Section 7 (Integration View) or "Not documented"]
- Note: [If Non-Compliant or Unknown: List BPM process variables with their source (form, REST, External Task, DMS lookup) and/or DMS ingestion sources (scanner, email, API push, manual) in Section 6 or 7]

**Process Variable / Document Content Quality Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Quality standards defined — for BPM, validation rules on process variables (required, type, range, regex) enforced by start-form schemas or service-task validators; for DMS, document content quality (OCR confidence threshold for scanned input, mandatory metadata properties, content-type validation, virus / malware scanning rule). If Non-Compliant: Quality requirements not specified. If Not Applicable: N/A. If Unknown: Quality mentioned but standards unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Quality) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define BPM variable validation rules and/or DMS document quality gates (OCR confidence ≥ X%, mandatory properties present, virus scan clean) in Section 6]

**Process Variable / Document Transformation Logic**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Transformations documented — for BPM, variable mapping between Service Tasks (input/output JSONata/FEEL/Spring expressions, payload-to-message correlation), DMN decision tables routing process variables; for DMS, content classification rules (auto-classify by file pattern / metadata / content), property-extraction rules (OCR + regex pulling values into Document Class properties). If Non-Compliant: Transformation requirements not specified. If Not Applicable: No transformations. If Unknown: Logic mentioned but unclear]
- Source: [ARCHITECTURE.md Section 5 (Component Model) or Section 6 (Data Model) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document BPM variable-mapping expressions, DMN decision logic, DMS auto-classification rules, and property extraction rules in Section 5 or 6]

**Process Variable / Document Sensitivity Classification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data classified by sensitivity (public / internal / confidential / restricted) — for BPM, classification of process variables (e.g., SSN / income data on a loan-application instance is restricted) driving variable-level encryption-at-rest in the engine database; for DMS, document-level classification driving Object Store / Document Class ACLs and records-management retention class. If Non-Compliant: Classification not performed. If Not Applicable: N/A. If Unknown: Security mentioned but classification unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Classification) or Section 9 (Security Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Classify BPM process variables and/or DMS Document Classes by sensitivity and define BPM variable-encryption policy and DMS ACL / Information Management Policy in Section 6 or 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA1.4]

---

## 2. BPM / DMS Operational Factors (LAA2)

**Requirement**: Analyze and document critical operational factors for the BPM platform and/or DMS, including process instance / case / document throughput, BPM execution model (synchronous vs asynchronous tasks, human task SLAs), DMS ingestion rate and retention triggers, comprehensive platform cost analysis (BPM engine, DMS storage tiers, support contracts), and operational maintenance requirements (process model versioning, document taxonomy evolution, BPM/DMS upgrades).

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [BPM Lead / DMS Administrator or N/A]

### 2.1 BPM Process / DMS Workflow Execution Model

**Execution Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Execution model documented — for BPM, classify each task type (User Task with human SLA, Service Task synchronous, Service Task asynchronous via External Task / message correlation, Receive Task event-driven, Timer Boundary Event), name the orchestration pattern (BPMN 2.0 process, CMMN case, hybrid); for DMS, classify ingestion path (manual upload, scan-to-DMS, email-to-DMS, API push) and the post-ingest workflow trigger (immediate classification, scheduled batch, event-driven). If Non-Compliant: Execution model not defined. If Not Applicable: N/A. If Unknown: BPM/DMS mentioned but task / workflow types unclear]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Performance) or Section 11 (Operational Considerations) or Section 5 (Component Model) for BPMN/CMMN diagrams, or "Not documented"]
- Note: [If Non-Compliant or Unknown: For BPM, label each task in the BPMN diagram with its execution semantics; specify human task SLA targets (e.g., "approver responds within 4 business hours"). For DMS, document the ingestion-to-availability latency target (e.g., "scanned documents available for retrieval within 2 minutes")]

**Time-Critical Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Time sensitivity defined with deadlines. If Non-Compliant: Time constraints not specified. If Not Applicable: No time-critical operations. If Unknown: Timing mentioned but requirements unclear]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Performance → Response Time) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define execution deadlines and time windows (e.g., must complete within 30 minutes) in Section 10]

**Business Hours Alignment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Operating hours documented (business hours vs 24/7). If Non-Compliant: Operating schedule not specified. If Not Applicable: N/A. If Unknown: Availability mentioned but hours unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Support Model) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify automation operating window (e.g., 8am-6pm Mon-Fri, 24/7) in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA2.1]

### 2.2 BPM Process Instance / DMS Document Throughput

**Throughput Volumes**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Volumes documented — for BPM, process instances per day at steady state and at peak (e.g., "200 loan applications/day average, 800/day peak end-of-quarter"), case open/close rate, average tokens-per-instance; for DMS, documents ingested per day (peak and steady state), average document size by content type, total active documents under management. If Non-Compliant: Throughput not quantified. If Not Applicable: N/A. If Unknown: Volume mentioned but numbers unclear]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Scalability or Performance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document BPM throughput as "X process instances/day at peak, Y at steady state, Z concurrent active instances" and/or DMS as "N documents ingested/day at peak, M total documents under management at year-3 projection" in Section 10]

**Peak Load Considerations**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Peak load handling documented — for BPM, scaling strategy for the process engine (additional engine nodes, External Task worker pool size, async-task message broker capacity); for DMS, storage tier scaling (object store / file system capacity headroom), full-text index sizing, peak ingestion bandwidth. If Non-Compliant: Capacity planning not addressed. If Not Applicable: Minimal load variation. If Unknown: Load mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 10 (Non-Functional Requirements → Scalability) or "Not documented"]
- Note: [If Non-Compliant or Unknown: For BPM, document engine sizing (e.g., "Camunda 8 cluster: 3 brokers, 6 partitions, 4 worker pods") and message broker capacity. For DMS, document storage projection (e.g., "FileNet object store grows ~500 GB/year at current ingestion rate") in Section 10]

**Retry and Backoff Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retry logic documented with backoff intervals. If Non-Compliant: Retry strategy not defined. If Not Applicable: N/A. If Unknown: Error handling mentioned but retry logic unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Error Handling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define retry attempts, exponential backoff, and circuit breaker patterns in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA2.2]

### 2.3 BPM / DMS Cost Analysis

**Platform License Costs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Software license costs documented for the specific BPM and/or DMS platform — Camunda Enterprise (per process engine / per cluster), IBM BAW (PVU or Authorized User), Pega (per case-type), Appian (per user / per cluster), Bonita (per node), Flowable Enterprise (per cluster), FileNet (PVU + per-user CALs + Connection licensing), Athento (per active process / per user / per document store), SharePoint (per server + CALs or M365 E3/E5), Documentum (per user + repository), Alfresco (per repository / per active user). If Non-Compliant: License costs not quantified. If Not Applicable: Open-source-only stack (Camunda Community, Activiti Community, Alfresco Community) with no commercial licensing. If Unknown: BPM/DMS licensing mentioned but model and costs unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Tools and Platforms) or Section 11 (Operational Considerations → Cost) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document platform-specific licensing model and unit costs (e.g., "Camunda Enterprise: 2 production engine clusters × $X/year"; "FileNet P8: 250 named users × $Y + 15 PVUs × $Z + 1 connection license × $W") in Section 8 or 11]

**Infrastructure Costs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Compute, storage, network costs estimated. If Non-Compliant: Infrastructure costs not calculated. If Not Applicable: N/A. If Unknown: Resources mentioned but costs unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture → Infrastructure) or Section 11 (Operational Considerations → Cost) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Estimate cloud resources (VMs, storage, bandwidth) and on-premise server costs in Section 4 or 11]

**Maintenance and Support Costs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Ongoing maintenance costs documented. If Non-Compliant: Support costs not estimated. If Not Applicable: N/A. If Unknown: Support mentioned but costs unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Support Model) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document FTE effort for monitoring, updates, and incident response in Section 11]

**ROI Timeline**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Payback period calculated. If Non-Compliant: ROI timeline not specified. If Not Applicable: Regulatory mandate (no ROI required). If Unknown: Benefits mentioned but timeline unclear]
- Source: [ARCHITECTURE.md Section 3 (Business Context → Success Metrics) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Calculate breakeven point comparing automation costs vs manual process savings in Section 3]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA2.3]

### 2.4 BPM / DMS Operability and Maintenance

**BPM / DMS Monitoring Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Platform-specific monitoring documented — for BPM, process-level metrics (active process instances per model, instance cycle time per model, human-task SLA breach rate, External Task fail rate, incident count per process model) and engine-level metrics (engine pod CPU/memory, broker partition lag for Camunda 8, JMS queue depth for IBM BAW); for DMS, ingestion success rate, classification confidence distribution, retention-policy execution success, full-text index health, repository / Object Store free-space, OCR queue depth. If Non-Compliant: BPM/DMS monitoring not defined. If Not Applicable: N/A. If Unknown: Monitoring mentioned but BPM/DMS-specific metrics unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Monitoring) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define BPM dashboards (per process model: active instances, cycle time p50/p95, SLA breaches, incidents) and DMS dashboards (ingestion rate, classification confidence, retention-policy runs, repository free-space, OCR latency) in Section 11]

**BPM Incident Handling / DMS Error Handling and Alerting**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Failure handling documented — for BPM, the Incident model (where in the BPMN flow execution can park as an Incident, who triages incidents, retry/restart strategy via Cockpit / Operator dashboards, dead-letter queue policy for External Tasks); for DMS, ingestion-failure handling (failed scan, malformed metadata, virus-detected, classification-confidence-too-low routing to a manual-review queue) and retention-policy-execution failures. If Non-Compliant: BPM Incident model / DMS error pipeline not specified. If Not Applicable: N/A. If Unknown: Errors mentioned but BPM/DMS-specific handling unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Error Handling and Alerting) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document BPM Incident triage flow (who watches the Camunda Cockpit / BAW PA dashboard, retry-vs-skip vs raise-error policy) and/or DMS exception queue handling (failed-OCR queue, low-confidence-classification review queue, retention-policy failure alerts) in Section 11]

**BPM / DMS Support Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Tiered support documented — L1 (BPM tasklist user issues, DMS retrieval issues, password resets), L2 (Incident triage in BPM Cockpit, DMS classification rule fixes, retention-policy adjustments), L3 (BPM platform engineering: engine upgrades, DMN model changes, broker tuning; DMS platform engineering: Object Store evolution, taxonomy changes, RM file plan changes), with response time SLAs per tier. If Non-Compliant: Support responsibilities not defined. If Not Applicable: N/A. If Unknown: Support mentioned but BPM/DMS-specific model unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Support Model) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define L1/L2/L3 BPM/DMS responsibilities and response-time SLAs (e.g., L1: 30 min response on BPM tasklist outage, L3: BPM engine upgrade owner) in Section 11]

**BPM Process Model / DMS Taxonomy Maintenance Windows**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Maintenance schedule covers platform AND content evolution — for BPM, engine patch / upgrade windows AND BPMN / DMN / CMMN model deployment schedule (with versioning policy for in-flight instances); for DMS, platform patch windows AND Document Class / taxonomy / retention-schedule revision schedule (with impact analysis for already-stored documents). If Non-Compliant: Maintenance schedule not defined. If Not Applicable: N/A. If Unknown: Updates mentioned but BPM model / DMS taxonomy evolution unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Deployment) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define maintenance windows for BPM engine upgrades, BPMN/DMN model deployments (in-flight-instance migration policy), DMS platform patches, and DMS taxonomy / retention-schedule revisions (impact on legacy documents) in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA2.4]

---

## 3. BPM / DMS License Usage (LAA3)

**Requirement**: Ensure efficient license consumption for the BPM platform and/or Document Management System, including platform core licensing, named-user vs concurrent-user CALs, capacity-based metrics (PVU, document count, storage GB), connector / adapter licenses for line-of-business integration, and alignment with enterprise licensing agreements (ELAs) the organization already holds.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [License Manager / Solution Architect or N/A]

### 3.1 BPM / DMS License Consumption Model

**License Metric**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: License metric documented for the chosen BPM and/or DMS platform — examples: Camunda Enterprise (per running engine / per cluster, optionally per task-execution-rate tier); IBM BAW (PVU on the BPM Process Server, Authorized User on the Process Designer); Pega (per case type per environment + per developer seat); Appian (Application User license tier); FileNet (PVU + Authorized User CALs + Connection licenses for federated repositories); Athento (per active process + per user + per document repository tier); SharePoint (per server + CAL, or per Microsoft 365 user); Documentum (per repository + per Authorized User). If Non-Compliant: License metric not specified. If Not Applicable: Open-source-only deployment (Camunda Community, Activiti, Alfresco Community). If Unknown: Licensing mentioned but metric unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Tools and Platforms) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document the exact BPM/DMS license metric (e.g., "FileNet P8: PVU-based on the Content Engine + 250 Authorized User CALs + 1 Federation Connection license to the legacy archive") in Section 8]

**License Pooling Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: License sharing approach documented. If Non-Compliant: Pooling strategy not defined. If Not Applicable: Single-purpose licenses (no sharing). If Unknown: Resource allocation mentioned but sharing unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define how licenses are shared across automations or departments in Section 8 or 11]

**Estimated License Quantity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Required license count calculated. If Non-Compliant: License quantity not estimated. If Not Applicable: N/A. If Unknown: Licensing mentioned but quantity unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Cost) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Calculate required licenses based on concurrent executions, users, or API calls in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA3.1]

### 3.2 BPM / DMS Integration Licensing

**Line-of-Business Integration Licenses**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Licenses for systems the BPM engine calls or the DMS pulls/pushes are documented — e.g., Salesforce per-API-call tier required to drive BPM Service Tasks, SAP RFC connector license required for IBM BAW SAP adapter, ServiceNow integration users for case-creation calls, e-signature platform per-envelope licensing (DocuSign, Adobe Sign) when called from a BPMN Service Task, OCR engine licenses (ABBYY, Tesseract Pro) when called by the DMS ingestion pipeline. If Non-Compliant: LOB integration licensing not addressed. If Not Applicable: No third-party LOB integrations. If Unknown: Integrations mentioned but licensing unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Integration Catalog) or Section 8 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: For each system the BPM Service Tasks call or the DMS ingestion pipeline depends on, document the integration licensing model (per-API-call, per-RFC-connector, per-envelope, per-OCR-page) in Section 7 or 8]

**BPM Connector / DMS Adapter Licensing Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Premium connectors / adapters identified — for BPM, IBM Case Manager, IBM Operational Decision Manager (ODM) integration, Camunda Connectors marketplace add-ons, Pega DX connectors, Activiti enterprise adapters; for DMS, FileNet Workplace XT add-on, IBM Records Manager add-on, Athento premium connectors, SharePoint AIP/Purview labels, Alfresco Records Management module, OpenText InfoArchive bridge. Each named with its licensing metric. If Non-Compliant: Connector / adapter licensing not specified. If Not Applicable: Only platform-bundled connectors used. If Unknown: Connectors mentioned but licensing unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View) or Section 8 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enumerate premium BPM connectors and DMS add-on modules (RM module, federation/connection licenses, Workplace XT, ODM, Case Manager, Athento premium, AIP/Purview) requiring separate licenses in Section 7 or 8]

**BPM Engine / DMS Repository Database Licensing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database licensing for the BPM engine state store and the DMS metadata repository is documented — e.g., Oracle Database PVU / Named-User-Plus licenses for IBM BAW (which mandates Oracle, DB2, or supported equivalent), DB2 for FileNet Content Engine + Process Engine state, PostgreSQL Enterprise (EnterpriseDB) for Camunda Enterprise on EDB, SQL Server CALs / Core licenses for SharePoint content DB, Oracle for Documentum repository. If Non-Compliant: Database licensing not addressed. If Not Applicable: Free RDBMS only (community PostgreSQL, MySQL Community) and DMS uses bundled DB. If Unknown: Database mentioned but licensing unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Sources) or Section 8 (Technology Stack) or "Not documented"]
- Note: [If Non-Compliant or Unknown: For each BPM engine state store and DMS metadata DB, name the RDBMS edition and its licensing model (Oracle PVU, DB2 PVU, SQL Server Core+CAL, EDB subscription, MariaDB Enterprise) in Section 6 or 8]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA3.2]

### 3.3 BPM / DMS Cost Efficiency Measures

**BPM / DMS License Cost Reduction Tactics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Platform-aware cost-optimization tactics documented — for BPM, consolidating multiple process applications onto one engine cluster (drives down per-cluster Camunda / per-PVU BAW costs), tiering process models by criticality so non-critical models run on a smaller engine, using open-source Camunda Community / Activiti for non-revenue-critical workflows, scheduling External Task workers to scale down off-peak; for DMS, storage-tier optimization (active in primary repository, aged-out documents migrated to archive tier with cheaper licensing), Document-Class consolidation to reduce Authorized User CAL count, federating to existing repositories instead of duplicating storage. If Non-Compliant: Cost optimization not addressed. If Not Applicable: Fixed licensing with no optimization options. If Unknown: Cost mentioned but tactics unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or Section 11 (Operational Considerations → Cost) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document BPM tactics (cluster consolidation, tier-based engine sizing, off-peak worker scaling, OSS for low-criticality flows) and/or DMS tactics (storage tiering, Document-Class consolidation, federation to existing repos, archive-tier migration) in Section 11 or 12]

**Organizational Licensing Agreements (BPM / DMS Vendor ELAs)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Alignment with existing vendor ELAs verified — IBM ELA covers FileNet + IBM BAW + Records Manager + WebSphere; Microsoft EA covers SharePoint + AIP/Purview + SQL Server; Camunda enterprise subscription scoped to declared engine count; OpenText ELA covers Documentum + Content Server. If Non-Compliant: ELA alignment not verified. If Not Applicable: No vendor ELAs in place. If Unknown: Enterprise licensing mentioned but compliance unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack) or "External organizational documentation"]
- Note: [If Non-Compliant or Unknown: For each BPM/DMS vendor in the architecture, verify whether the organization holds a vendor ELA and whether the project's planned consumption fits within remaining ELA entitlement; record outcome in Section 8]

**BPM / DMS License Compliance Monitoring**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: License consumption tracked at the BPM/DMS metric level — for BPM, active engine count, PVU consumption, named-user CAL utilization, per-case-type counts (Pega), per-active-process consumption (Athento embedded BPM); for DMS, Authorized User CAL utilization (FileNet, Documentum), repository / Object Store count, federation / connection license usage, RM module activations. Tracked via vendor license-management tooling (IBM ILMT, Flexera, vendor portals) and reconciled against entitlements quarterly. If Non-Compliant: License monitoring not defined. If Not Applicable: N/A. If Unknown: Monitoring mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Monitoring) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define how BPM engine count / PVU / CAL utilization and DMS Authorized User / Object Store / Connection license utilization are tracked, reconciled against entitlements, and audited in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA3.3]

---

## 4. Document Management Alignment (LAA4)

**Requirement**: Confirm alignment with the project's Document Management System — its native object model, content classification taxonomy, version control mode, retention/records management policy, security model, and integration surface. This section applies whenever the architecture includes a DMS (FileNet, Athento, SharePoint as DMS, Documentum, Alfresco, OpenText Content Server, Nuxeo, OnBase, etc.). When the architecture is BPM-only with no document storage layer, mark this entire section **Not Applicable** with the justification from the contract's Applicability gate.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Information Architect / DMS Administrator or N/A]

### 4.1 DMS Object Model and Lifecycle Scope

**Document Lifecycle Scope (DMS-native semantics)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Document lifecycle documented in the DMS's native model — for FileNet, Object Stores + Document Class hierarchy + Properties + Lifecycle Policies + Records Management states; for Athento, Dossiers + Document Types + Workflow states + Retention Templates; for SharePoint, Site Collections + Libraries + Content Types + Information Management Policies; for Alfresco, Sites + Folders + Aspects + Rules. Lifecycle covers creation / ingestion → classification → versioning → retention → archival → disposition. If Non-Compliant: DMS object model and lifecycle not specified. If Not Applicable: No DMS in the architecture (BPM-only project). If Unknown: DMS mentioned but native model unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Storage / Document Repository) or Section 5 (Component Model) for the DMS component descriptor, or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define the DMS-native object model (e.g., "FileNet: 1 Object Store `OS_LOAN`, 4 Document Classes [Application, ID, Income, Disclosure], retention via Lifecycle Policies tied to RM file plan") and the lifecycle states each document transits in Section 6]

**Version Control Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Document versioning documented. If Non-Compliant: Version control not addressed. If Not Applicable: No versioning required. If Unknown: Versions mentioned but control unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Management) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify version control approach (major/minor versions, retention policy) in Section 6]

**Archival and Retention Policies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Retention rules documented. If Non-Compliant: Archival policies not defined. If Not Applicable: N/A. If Unknown: Retention mentioned but policies unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Retention) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define retention periods and archival procedures per document type in Section 6 or 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA4.1]

### 4.2 Licensing Alignment

**Document Management System Licensing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DMS licenses documented with platform-specific metric — FileNet (PVU + Authorized User CALs + Connection / Federation licenses + IBM Records Manager add-on if used), Athento (per active process + per user + per document store + premium connector licenses), SharePoint (per server + CAL OR per M365 user, plus AIP/Purview if used for classification), Documentum (Repository license + Authorized User + xCP licenses if using xCP-based apps), Alfresco (per repository + per active user + Records Management module), OpenText Content Server (per user + connector licenses), Nuxeo (per CPU + per active user). If Non-Compliant: DMS licensing not addressed. If Not Applicable: No DMS in architecture (BPM-only project) — sections 4.x do not apply. If Unknown: DMS mentioned but licensing model unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Tools and Platforms) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document the DMS license stack with platform-specific metrics (e.g., "FileNet P8 5.5.x: 24 PVU on Content Engine + 1500 Authorized User CALs + 1 Connection license to the IBM Records Manager file plan") in Section 8]

**DMS Vendor ELA Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DMS purchases reconciled against existing vendor ELA — e.g., FileNet entitlement verified within IBM ELA, SharePoint within Microsoft EA, Documentum within OpenText ELA, Alfresco within Hyland subscription. If Non-Compliant: ELA alignment not verified. If Not Applicable: No DMS in architecture (BPM-only project). If Unknown: Organizational DMS mentioned but ELA compliance unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack) or "External organizational documentation"]
- Note: [If Non-Compliant or Unknown: Verify the DMS purchases (Authorized User CALs, PVU, repository licenses, federation/connection licenses, RM module) fit within the relevant vendor ELA entitlement in Section 8]

**DMS Storage and Records-Management Capacity Licensing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DMS storage capacity is sized and any volume-based licensing documented — physical/object-store size projections (year-1, year-3 with retention applied), DMS-tier-aware licensing (FileNet content storage backed by IBM Spectrum Scale, Athento storage on managed S3, SharePoint content DB on SQL Server licensed per core, Alfresco S3 connector storage), and any records-management module per-record fees. If Non-Compliant: Storage licensing not addressed. If Not Applicable: No DMS in architecture (BPM-only project). If Unknown: Storage mentioned but DMS-specific licensing unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Storage) or Section 11 (Operational Considerations → Cost) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document projected DMS object-store size at year-3 (with retention disposition applied), the storage-tier licensing model (IBM Spectrum, S3, SQL Server core, etc.), and any RM module per-record fees in Section 6 or 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA4.2]

### 4.3 DMS Integration and Security Verification

**DMS API / Connector Integration Points**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DMS surface documented end-to-end — the protocol (CMIS REST/SOAP, FileNet Content Engine API, Athento REST, SharePoint Graph / CSOM, Alfresco REST, Documentum DFC / DFS), the consumers (BPM Service Tasks, line-of-business app, e-signature service, scanner pipeline, archive bridge), and the operations performed (create, classify, version, retrieve, declare-as-record, dispose). If Non-Compliant: DMS integration approach not specified. If Not Applicable: No DMS in architecture (BPM-only project). If Unknown: Integration mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Integration Catalog) or "Not documented"]
- Note: [If Non-Compliant or Unknown: For each DMS consumer, document the protocol (CMIS, FileNet CE API, SharePoint Graph, Alfresco REST, Documentum DFC), the operations it performs, and the auth context in Section 7]

**DMS Authentication and Authorization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DMS authn/authz documented at the platform's native level — authentication via SAML / OAuth / Kerberos / AD-LDAP / DMS service accounts; authorization via DMS-native ACLs (FileNet Object Store + Document Class ACLs, SharePoint permission inheritance + groups, Alfresco group-based permissions + Aspects, Athento dossier-level ACLs, Documentum ACL templates), declared records inherit Records Management security. If Non-Compliant: Access controls not defined. If Not Applicable: No DMS in architecture (BPM-only project). If Unknown: Security mentioned but DMS-native model unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define DMS authn (SAML / OAuth / Kerberos / AD-LDAP) and the DMS-native ACL model (Object Store / Document Class / Library / Dossier ACLs, RM record-class security) in Section 9]

**Document Security Classification (DMS-Native Labels)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Document sensitivity classified at the DMS's native classification surface — FileNet Document Class properties + IBM Records Manager security categories, SharePoint sensitivity labels (AIP / Microsoft Purview), Alfresco Aspects + RM categories, Athento Document Type sensitivity attribute, Documentum aspects + ACL templates. Each level (public / internal / confidential / restricted) maps to specific ACLs and retention rules. If Non-Compliant: Classification not performed. If Not Applicable: No DMS in architecture (BPM-only project). If Unknown: Security mentioned but classification unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Classification) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Map each Document Class / Content Type / Document Type to a sensitivity label in the DMS's native model (FileNet RM security category, SharePoint sensitivity label, Alfresco RM category, Athento sensitivity attribute) and define the resulting ACLs in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAA4.3]

---

## External Validation Summary

| Field | Value |
|-------|-------|
| Status | [VALIDATION_STATUS_BADGE] |
| Validator | [VALIDATOR_AGENT] |
| Date | [VALIDATION_DATE] |
| Items Evaluated | [TOTAL_ITEMS] |
| Result | [PASS_COUNT] PASS, [FAIL_COUNT] FAIL, [NA_COUNT] N/A, [UNKNOWN_COUNT] UNKNOWN |

**Deviations**: [DEVIATIONS_LIST or "None detected"]

**Recommendations**: [RECOMMENDATIONS_LIST or "None"]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**BPM (Business Process Management) Terms**:
- **BPM Platform**: A process orchestration / workflow engine that executes BPMN 2.0 or CMMN models with persistent state, human tasks, gateways, and process variables. Examples: Camunda, IBM BAW, Activiti, jBPM, Bonita, Flowable, Pega, Appian.
- **BPMN (Business Process Model and Notation)**: ISO/IEC 19510 graphical notation for process diagrams; the modeling language most BPM platforms execute natively.
- **CMMN (Case Management Model and Notation)**: OMG standard for case management; alternative to BPMN for unstructured / knowledge-worker processes.
- **Process Instance**: A single in-flight execution of a process model — for cycle-time and throughput measurements.
- **Token**: BPMN execution-flow marker; "tokens-per-instance" tracks parallelism within a single process.
- **External Task / Service Task**: BPMN node executed by an external worker (External Task pattern, e.g., Camunda) or directly by the engine (Service Task).
- **Human Task / User Task**: BPMN node assigned to a person; SLA-bound for cycle-time tracking.

**DMS (Document Management System) Terms**:
- **DMS Platform**: An enterprise content management system that stores, classifies, versions, and governs documents with a stable API surface. Examples: FileNet, Athento, SharePoint, Documentum, Alfresco, OpenText Content Server, Nuxeo, OnBase.
- **Object Store / Repository**: Logical container for documents and their metadata in a DMS.
- **Document Class / Content Type / Document Type**: Schema definition for a category of documents (e.g., "Loan Application", "Disclosure", "ID Document"); carries property definitions and lifecycle hooks.
- **Records Management / Retention Policy**: Rule set governing how long documents are retained, when they are eligible for disposition, and the audit trail required during their lifecycle.
- **CMIS (Content Management Interoperability Services)**: OASIS standard REST/SOAP API for cross-DMS interop; supported natively by FileNet, Alfresco, SharePoint, Nuxeo.
- **Federation / Connection license**: A DMS license that authorizes the platform to read or write a separate repository (e.g., FileNet federation to a legacy archive).

**Cross-Cutting Terms**:
- **Manuality**: Current manual effort measured in FTE hours per week — for BPM, manual approvals/hand-offs that the process engine will replace; for DMS, manual filing/classification/retrieval that the document repository will replace.
- **Line-of-Business (LOB) Integration**: Systems the BPM/DMS calls during a process or document lifecycle (CRM, ERP, identity provider, e-signature, scanner pipeline).
- **ROI (Return on Investment)**: Financial benefit calculation (savings minus costs) — for BPM, primarily cycle-time × labor-cost reduction; for DMS, primarily storage / retrieval / compliance-risk reduction.

<!-- @include shared/fragments/status-codes.md -->

**Compliance Abbreviations**:
- **LAA**: Process Transformation compliance requirement code (BPM / DMS scoped)
- **BPM**: Business Process Management
- **BPMN**: Business Process Model and Notation
- **CMMN**: Case Management Model and Notation
- **DMS**: Document Management System
- **CMIS**: Content Management Interoperability Services
- **CAL**: Client Access License
- **PVU**: Processor Value Unit (IBM licensing metric)
- **ELA**: Enterprise License Agreement
- **FTE**: Full-Time Equivalent (labor measurement)
- **RTO/RPO**: Recovery Time/Point Objective (disaster recovery metrics)
- **SLA**: Service Level Agreement

---

<!-- @include-with-config shared/sections/validation-methodology.md config=process-transformation -->

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common BPM / DMS Process Transformation Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| BPM/DMS platform not named (generic "workflow engine" or "document store") | Applicability gate FAILS — contract may be marked Not Applicable in error | Section 8 (Technology Stack) | Name the specific BPM platform (Camunda, IBM BAW, Pega, Activiti, Flowable, etc.) and/or DMS (FileNet, Athento, SharePoint, Documentum, Alfresco, etc.) — applicability hinges on this |
| Manual workflow / paper-document effort not quantified | LAA1 Non-Compliant | Section 3 (Business Context) | Document FTE hours/week spent on the manual process the BPM/DMS will replace; calculate cycle-time / retrieval-time ROI |
| BPM connectors / DMS integration surface undefined | LAA1 Non-Compliant | Section 7 (Integration View) | List every BPM Service Task / External Task target and every DMS API consumer (CMIS, REST, SMB, IMAP, e-signature) |
| BPMN / CMMN process diagrams missing | LAA1 Non-Compliant | Section 5 (Component Model) | Embed or link the BPMN / CMMN process diagrams with node-by-node task labels |
| BPM execution model undocumented (sync vs async, human task SLA) | LAA2 Unknown | Section 11 (Operational Considerations) | Classify each BPMN task type and specify human-task SLAs |
| Process instance / document throughput volumes missing | LAA2 Unknown | Section 10 (Non-Functional Requirements) | Specify peak and steady-state instance/document/day counts and concurrent active counts |
| BPM / DMS engine sizing not specified | LAA2 Unknown | Section 10 (NFR → Scalability) | Document engine cluster topology, message broker capacity, DMS storage projection |
| Platform license model unspecified | LAA3 Unknown | Section 8 (Technology Stack) | Document platform-specific metric (PVU, named user, per-engine, per-active-process, CAL) and unit counts |
| Connector / adapter licensing not addressed | LAA3 Unknown | Section 7 or 8 | Identify premium connectors / adapters (FileNet Workplace XT, IBM Case Manager, Athento premium connectors) requiring separate licenses |
| ELA alignment not verified | LAA3 Unknown | Section 8 | Verify the BPM/DMS purchases align with existing organization-wide IBM, Microsoft, or vendor ELAs |
| DMS object model not documented (Object Stores, Document Classes, taxonomies) | LAA4 Non-Compliant | Section 6 (Data Model) | Define DMS-native model: Object Stores / Repositories, Document Classes / Content Types, classification taxonomy, retention schedule |
| DMS retention / records-management policy missing | LAA4 Unknown | Section 6 or 11 | Define retention period per Document Class, disposition triggers, legal-hold handling |
| DMS authentication / authorization not specified | LAA4 Unknown | Section 9 (Security Architecture) | Document DMS authn (SAML, OAuth, AD/LDAP) and authz model (ACLs per Object Store / Document Class / record class) |

---


#### A.3.2 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required BPM/DMS fields applicable to your platform combination (BPM-only, DMS-only, or both)
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all BPM/DMS architectural decisions

**Pre-step — Verify Applicability** (this is the gate; everything below assumes the gate passes):

- Confirm the architecture names a specific BPM platform AND/OR DMS in Section 4, 5, 6, 7, or 8.
- If neither is present, the contract is **Not Applicable** in full and is auto-scored N/A — score-improvement actions below do not apply.

**To Achieve AUTO_APPROVE Status (8.0+ score) when the contract IS applicable:**

1. **Complete BPM/DMS Feasibility, Process Maps, and Integration** (estimated impact: +0.6 points)
   - Quantify manual workflow / paper-document effort: FTE hours/week, annual cost, BPM cycle-time / DMS retrieval-time ROI (Section 3)
   - Embed BPMN / CMMN process diagrams with task-by-task labels for the BPM scope (Section 5)
   - Document DMS object model: Object Stores / Repositories, Document Classes / Content Types, classification taxonomy (Section 6)
   - Document integration points: BPM Service Task / External Task targets, DMS CMIS / REST / SMB consumers, line-of-business systems (Section 7)
   - Name the specific BPM platform (Camunda Enterprise / IBM BAW / Pega / Appian / Bonita / Flowable / Activiti) and/or DMS (FileNet / Athento / SharePoint / Documentum / Alfresco / OpenText / Nuxeo / OnBase) (Section 8)
   - Define platform license costs with platform-specific metrics (PVU, named user, per-engine, per-active-process, CAL) (Section 8 or 11)

2. **Establish BPM/DMS Operational Procedures** (estimated impact: +0.3 points)
   - Define BPM execution model: classify each BPMN task as User Task (with SLA), Service Task (sync/async), Receive Task, Timer Boundary Event (Section 11)
   - Define DMS workflow: ingestion path (manual upload / scan-to-DMS / email-to-DMS / API push), post-ingest classification trigger, retention schedule activation (Section 11)
   - Specify throughput volumes: process instances/day at peak and steady state, documents ingested/day, total active documents under management (Section 10)
   - Document engine sizing: BPM cluster topology, message broker capacity, DMS storage projection at year-3 (Section 10)
   - Document monitoring: BPM cycle-time per process model, human-task SLA breach rate, DMS ingestion success rate, retention policy compliance (Section 11)

3. **Enhance Governance, Records Management, and Licensing Discipline** (estimated impact: +0.2 points)
   - Document DMS retention / records-management policy: retention period per Document Class, disposition triggers, legal-hold handling, audit trail (Section 6 or 11)
   - Define DMS authentication / authorization: authn method (SAML / OAuth / AD-LDAP), authz model (ACLs per Object Store / Document Class / record class) (Section 9)
   - Define BPM model versioning strategy: how new versions of a BPMN process model are deployed without disrupting in-flight instances (Section 11)
   - Verify ELA alignment: confirm BPM/DMS purchases align with existing organization-wide IBM, Microsoft, or vendor ELAs (Section 8)
   - Document connector / adapter licensing: premium connectors (FileNet Workplace XT, IBM Case Manager, Athento premium connectors) requiring separate licenses (Section 7 or 8)
   - Add change management: BPMN model deployment gates, DMS taxonomy evolution process, retention schedule revision approval (Section 11)

**Priority Order**: Applicability gate → LAA1 (BPM/DMS feasibility + process maps + integration) → LAA2 (BPM execution model + DMS workflow + throughput + sizing) → LAA3 (platform licensing model + ELA alignment) → LAA4 (DMS object model + retention + security) [LAA4 N/A for BPM-only projects]

**Estimated Final Score After Remediation**: 8.3-8.8/10 (AUTO_APPROVE)

---

### A.4 Change History

**Version 2.1 (Current — BPM / DMS scope)**:
- **Applicability gate added** at top of contract: this contract evaluates BPM platforms (Camunda, IBM BAW, Pega, Activiti, Flowable, Bonita, Appian, ProcessMaker, Oracle BPM, TIBCO ActiveMatrix BPM) and/or Document Management Systems (FileNet, Athento, SharePoint, Documentum, Alfresco, OpenText Content Server, Nuxeo, OnBase, Box Governance, M-Files). When the architecture contains neither, all four LAA codes are marked Not Applicable and the contract is scored N/A overall. Partial applicability rules documented for BPM-only and DMS-only projects.
- LAA1 reframed as **BPM / DMS Feasibility and Impact Analysis**: data point names and remediation notes anchored in BPM-specific concepts (BPMN node count, gateway count, exception/escalation paths, sub-process nesting depth, process cycle time) and DMS-specific concepts (document type taxonomy size, content classification rules, retention schedule complexity, ingestion-to-availability latency).
- LAA2 reframed as **BPM / DMS Operational Factors**: execution-model questions now classify BPMN task types (User Task with SLA, Service Task sync/async, External Task pattern, Receive Task, Timer Boundary Event) and DMS workflow triggers (manual upload, scan-to-DMS, email-to-DMS, API push); throughput questions ask for process-instances/day and documents/day at peak and steady state.
- LAA3 reframed as **BPM / DMS License Usage**: license metrics enumerated per platform (Camunda per-engine/per-cluster, IBM BAW PVU, Pega per case-type, Appian Application User, FileNet PVU + Authorized User CAL + Connection license, Athento per-active-process + per-user + per-document-store, SharePoint per-server + CAL or M365 per-user, Documentum per-repository + Authorized User, Alfresco per-repository + per-active-user).
- LAA4 (Document Management Alignment) tightened to use DMS-native semantics: FileNet Object Stores + Document Classes + Lifecycle Policies + Records Management; Athento Dossiers + Document Types + Workflow states + Retention Templates; SharePoint Site Collections + Libraries + Content Types + Information Management Policies; Alfresco Sites + Folders + Aspects + Rules.
- Definitions section split into BPM Terms / DMS Terms / Cross-Cutting Terms with platform-specific vocabulary (Process Instance, Token, External Task, Object Store, Document Class, Records Management, CMIS, PVU, CAL, ELA).
- Common Gaps Quick Reference rewritten with BPM/DMS-specific entries; first row is "BPM/DMS platform not named" — flags applicability ambiguity as the highest-priority gap.
- Auto-Approve action plan reorganized around the BPM/DMS scope: Pre-step verifies applicability gate; remediation steps anchored in BPMN diagrams, DMS object models, BPM connector inventories, and platform licensing models.

**Version 2.0 (Previous)**:
- Complete template restructuring to Version 2.0 format
- Replaced 8 simple sections with 4 comprehensive LAA requirements
- LAA1: Feasibility and Impact Analysis (4 subsections, 14 data points)
- LAA2: Automation Factors (4 subsections, 13 data points)
- LAA3: Efficient License Usage (3 subsections, 9 data points)
- LAA4: Document Management Alignment (3 subsections, 9 data points)
- Added comprehensive Appendix with 4 sections
- Total: 45 validation data points across 14 subsections
- Source mapping expanded to Sections 3, 5, 6, 7, 8, 10, 11, 12
- Aligned with Cloud Architecture template structure

**Version 1.0 (Initial)**:
- Initial template with 8 simple sections
- Basic PLACEHOLDER approach
- Limited source traceability
- 8 validation items across 4 sections

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=process-transformation -->

---

<!-- @include-with-config shared/sections/questions-gaps-register-template.md config=process-transformation -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=process-transformation -->

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation.
