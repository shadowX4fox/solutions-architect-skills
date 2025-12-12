# Compliance Document Generation Guide

## Purpose and Overview

This guide provides comprehensive reference for generating compliance documents from ARCHITECTURE.md files. These compliance documents ensure that architectural decisions align with organizational standards, regulatory requirements, and best practices.

### What are Compliance Contracts?

**Compliance Contracts** (Adherence Contracts) are organizational compliance documents that define guidelines, standards, and requirements for different architectural domains. Each contract type focuses on a specific aspect of architecture (security, cloud, SRE, etc.) and ensures consistency across projects.

### Why Generate from ARCHITECTURE.md?

1. **Single Source of Truth**: ARCHITECTURE.md contains comprehensive technical architecture details
2. **Consistency**: Automated generation ensures uniform compliance documentation
3. **Traceability**: Direct links between architecture decisions and compliance requirements
4. **Efficiency**: Reduces manual documentation effort by 70-80%
5. **Accuracy**: Extracts actual values rather than relying on manual transcription

### Benefits

- **Automated Compliance**: Generate 10 compliance documents from one source
- **Gap Detection**: Identify missing requirements in ARCHITECTURE.md
- **Continuous Alignment**: Regenerate after architecture changes
- **Audit Trail**: Full source traceability for every data point
- **Quality Assurance**: Standardized templates and validation

---

## Shared Content System

### Overview

To reduce duplication and ensure consistency, common sections are extracted to `/skills/architecture-compliance/shared/`:

**Shared Sections**:
- **Document Control**: Standard table structure with validation fields (lines 10-24 in templates)
- **Dynamic Field Instructions**: Placeholder population logic and validation requirements (lines 27-50)
- **Compliance Score Calculation**: Critical N/A item scoring rules (around line 61-66)
- **Validation Methodology**: 3-step scoring process - Completeness (40%), Compliance (50%), Quality (10%)
- **Status Codes**: Four standard statuses (Compliant, Non-Compliant, Not Applicable, Unknown)

**Benefits**:
- **Eliminates ~400-500 lines of duplication** across all 10 templates
- **Single point of maintenance**: Update validation logic once, applies to all contracts
- **Guaranteed consistency**: Identical scoring formulas and status definitions
- **Simplified updates**: Change shared file instead of editing 10 templates

### How It Works

Templates use `<!-- @include -->` directives to reference shared content:

```markdown
<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->
```

During generation (Phase 4, Step 4.1):
1. Include directives are detected and parsed
2. Shared files are loaded from `/shared/` directory
3. Domain-specific values (review boards, compliance codes) are injected from `shared/config/<domain>.json`
4. Template variables (e.g., `{{review_board}}`) are replaced with actual values
5. Directives are replaced with fully expanded content
6. Placeholder replacement proceeds normally (Step 4.2)

### Domain Configuration

Each compliance domain has a config file (e.g., `shared/config/business-continuity.json`) containing:

```json
{
  "domain_name": "Business Continuity",
  "compliance_prefix": "LABC",
  "review_board": "Business Continuity Review Board",
  "approval_authority": "Business Continuity Review Board",
  "validation_config_path": "/skills/architecture-compliance/validation/business_continuity_validation.json"
}
```

Variables like `{{review_board}}` in shared files are replaced with these values during include processing.

### Template Compatibility

**Backward Compatible**: Templates without `@include` directives work unchanged. The system only processes includes if directives are present, ensuring all existing templates continue functioning.

**For detailed documentation**: See `shared/README.md`

---

## Document Types (10 Compliance Contracts)

### 1. Business Continuity (Business Continuity)

**Purpose**: Define guidelines for business continuity, disaster recovery, and resilience to ensure solution availability during disruptions.

**Stakeholders**:
- Business Continuity team
- Operations team
- Infrastructure team
- Executive leadership

**Key Content Requirements**:
- **Recovery Objectives**: RTO (Recovery Time Objective), RPO (Recovery Point Objective)
- **Backup Strategy**: Frequency, retention, storage location, testing
- **Disaster Recovery**: Procedures, failover mechanisms, DR site configuration
- **Business Impact Analysis**: Critical processes, downtime costs, dependencies
- **Resilience Measures**: Redundancy, fault tolerance, geographic distribution
- **Testing**: DR drills, backup restoration tests, validation frequency

**Source Sections from ARCHITECTURE.md**:
- **Primary**: Section 11 (Operational Considerations) - 80% of content
  - 11.3: Backup and Recovery
  - 11.4: Disaster Recovery
- **Secondary**: Section 10 (Performance Requirements) - 20% of content
  - 10.2: Availability SLAs

**Example Guidelines**:
- Impact to critical business processes must be documented
- RTO and RPO must be defined based on business criticality
- Disaster recovery procedures must be automated where possible
- Backup restoration must be tested quarterly
- Geographic redundancy required for Tier 1 applications

**Template Priority**: High (Template #2)

---

### 2. SRE Architecture (Site Reliability Engineering)

**Purpose**: Define guidelines for site reliability, observability, operational excellence, automation, and resilience practices to ensure production-ready solutions.

**Stakeholders**:
- SRE team
- DevOps team
- Platform engineering
- On-call engineers
- Automation engineers

**Template Version**: 2.0 (57 LASRE Requirements)

**57 Requirements Organized in 3 Sections**:

**Section 1: Practice Requirements (LASRE01-16)** - 16 Blocker
- Log Management (3): Structured logging, log levels, log accessibility
- Application Deployment (1): Automatic rollback mechanisms
- Configuration Management (1): Secure configuration repositories
- Operational Documentation (1): SOP documentation in repositories
- Operational Resilience (5): Readiness probes, health checks, HA, load testing, auto-scaling
- Recovery and Resilience Testing (1): Documented DRP

**Section 2: Observability Requirements (LASRE17-42)** - 20 Blocker + 6 Desired
- Information and Architecture (4 Blocker): C2 diagrams, portfolio registration, escalation matrix, observability requests
- Key Metrics (3 Blocker): Availability measurement, performance measurement, threshold configuration
- Backend Application (3 Blocker + 3 Desired): Dynatrace instrumentation, API monitoring, exception handling, labels, external APIs, advanced configurations
- Frontend Application (1 Blocker + 1 Desired): Synthetic validation, MFA-free testing
- User Experience (3 Blocker): RUM injection, security component compatibility, UX monitoring
- Cost Estimation (2 Blocker): Dynatrace cost estimation, budget prerequisites
- Infrastructure (3 Blocker + 2 Desired): Agent installation, container monitoring, dependency monitoring, cloud tagging, process health
- Batch Processing (1 Blocker): Non-Control-M batch monitoring
- Log Management (2 Desired): Log centralization, verbosity control
- Configuration Management (1 Desired): Version control
- Integration, Deployment and Delivery (2 Desired): Canary releases, traffic management
- Operational Resilience (3 Desired): 7x24 maintenance, circuit breakers, retry mechanisms
- Recovery and Resilience Testing (1 Desired): Chaos testing

**Section 3: Automation Requirements (LASRE43-57)** - 15 Desired
- Operational Resilience (2): Fallback mechanisms, timeout management
- Recovery and Resilience Testing (1): Chaos engineering
- Information and Architecture (2): Critical journey identification
- Backend Application (3): Labels, external API validation, advanced monitoring
- Frontend Application (1): Synthetic validation with generic user
- Infrastructure (2): Cloud tagging, process health detection
- Application Operational Tasks (2): Component reporting, data sanitization
- Auto-remediation (1): Automated failure remediation

**Two-Tier Scoring System**:
- **36 Blocker Requirements**: MANDATORY - All must pass for approval (ANY failure blocks approval)
- **21 Desired Requirements**: OPTIONAL - Enhancement recommendations (do not block approval)
- **Final Score** = (Blocker Score × 0.7) + (Desired Score × 0.3)
- **Approval Threshold**: Score ≥ 7.0 requires all 36 Blocker requirements pass
- **Auto-Approval**: Score ≥ 8.0 requires all Blocker + 60% Desired

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 11 (Operational Considerations) - 50% of content
    - 11.1: Monitoring, Logging, Observability
    - 11.2: Incident Management, DR
    - 11.3: Deployment, CI/CD
    - 11.4: Configuration Management, Documentation
  - Section 10 (Performance Requirements) - 30% of content
    - 10.1: Performance Metrics, Resilience
    - 10.2: Availability, SLAs
- **Secondary**:
  - Section 5 (Infrastructure) - 10% of content (Infrastructure monitoring, agents)
  - Section 4 (System Architecture) - 5% of content (C2 diagrams)
  - Section 2 (Project Context) - 5% of content (Portfolio, costs)

**Example LASRE Requirements**:
- LASRE01 (Blocker): Structured logging with defined fields
- LASRE07 (Blocker): Readiness probes for load acceptance
- LASRE13 (Blocker): C2 diagrams in IcePanel
- LASRE24 (Blocker): Dynatrace instrumentation validation
- LASRE37 (Desired): Centralized log aggregation
- LASRE45 (Desired): Chaos testing implementation

**Template Priority**: High (Template #1 - v2.0 serves as reference for requirement-based compliance)

---

### 3. Cloud Architecture

**Purpose**: Define guidelines for cloud-based solutions including deployment models, connectivity, security, and cloud best practices.

**Stakeholders**:
- Cloud architects
- Infrastructure team
- Security team
- FinOps/Cost optimization team

**Key Content Requirements**:
- **Cloud Deployment Model**: IaaS, PaaS, SaaS classification and rationale
- **Cloud Provider**: AWS, Azure, GCP, multi-cloud strategy
- **Connectivity**: Network architecture, VPN, Direct Connect, latency
- **Security**: IAM, encryption, network security, compliance
- **Monitoring**: Cloud-native monitoring, cost tracking
- **Backup & DR**: Cloud backup strategy, cross-region replication
- **Cloud Best Practices**: Well-Architected Framework, cost optimization, tagging

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 4 (Deployment Architecture) - 40% of content
    - Cloud provider, regions, deployment model
  - Section 8 (Technology Stack) - 30% of content
    - Cloud services used
  - Section 11 (Operational Considerations) - 20% of content
    - Cloud monitoring, backup
- **Secondary**:
  - Section 9 (Security Considerations) - 5% of content
  - Section 10 (Performance Requirements) - 5% of content

**Example Guidelines**:
- Cloud deployment model must be documented (IaaS/PaaS/SaaS)
- Multi-region deployment required for Tier 1 applications
- Cloud-native services preferred over custom solutions
- Cost optimization: reserved instances, autoscaling, right-sizing
- Cloud security: encryption at rest/transit, IAM least privilege
- Monitoring: CloudWatch/Azure Monitor/Stackdriver integration

**Template Priority**: Medium (Template #3)

---

### 4. Data & Analytics - AI Architecture

**Purpose**: Define guidelines for data management, analytics, and artificial intelligence including data quality, governance, AI model lifecycle, and hallucination control to ensure trustworthy data and AI systems.

**Stakeholders**:
- Data architects
- Data engineers
- Data scientists
- AI/ML architects
- ML engineers
- Data governance team
- Compliance officers
- Business continuity managers

**11 Requirements: 8 LAD (Data) + 3 LAIA (AI)** (Version 2.0):

**Data Requirements (LAD1-LAD8)**:

**LAD1: Data Quality**
- Quality control mechanisms, data completeness, validation frameworks, accuracy metrics
- Requirement: Implement quality control and ensure data completeness throughout lifecycle

**LAD2: Data Fabric Reuse**
- Reusability analysis, data asset catalog, shared data services, duplicate prevention
- Requirement: Maximize data asset reuse and avoid redundant data processing

**LAD3: Data Recovery**
- Backup strategy, disaster recovery, RTO/RPO alignment, recovery testing
- Requirement: Ensure data recovery capabilities aligned with business continuity objectives

**LAD4: Data Decoupling**
- Storage decoupling, processing decoupling, microservices architecture, API abstraction
- Requirement: Decouple data storage from processing to enable independent scaling and evolution

**LAD5: Data Scalability**
- Horizontal scalability, vertical scalability, partitioning strategy, growth projections
- Requirement: Ensure data architecture scales to handle projected volume growth

**LAD6: Data Integration**
- Integration patterns, ETL/ELT pipelines, data synchronization, integration testing
- Requirement: Define robust data integration patterns for reliable data movement

**LAD7: Regulatory Compliance**
- GDPR compliance, data residency, retention policies, compliance reporting
- Requirement: Ensure data handling complies with regulatory requirements

**LAD8: Data Architecture Standards**
- Naming conventions, data modeling standards, metadata standards, documentation requirements
- Requirement: Adhere to organizational data architecture standards

**AI Requirements (LAIA1-LAIA3)**:

**LAIA1: AI Model Governance**
- Model lifecycle management, version control, model registry, deployment approvals, retraining schedules
- Requirement: Establish governance for AI model development, deployment, and monitoring

**LAIA2: AI Security and Reputation**
- Adversarial attack prevention, model security, bias detection, fairness metrics, reputation risk
- Requirement: Protect AI models from security threats and ensure fair, unbiased predictions

**LAIA3: AI Hallucination Control**
- Hallucination detection, grounding mechanisms, fact verification, confidence thresholds, human oversight
- Requirement: Implement controls to detect and prevent AI hallucinations and false information

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 6 (Data Model) - 30% of content
    - Data structures, quality, governance, compliance (LAD1, LAD2, LAD7, LAD8)
  - Section 5 (Component Model) - 20% of content
    - Data components, ML models, AI services (LAD4, LAIA1, LAIA2)
  - Section 11 (Operational Considerations) - 15% of content
    - Backup/recovery, monitoring, model retraining (LAD3, LAIA1)
- **Secondary**:
  - Section 7 (Integration View) - 10% of content
    - Data sources, ETL pipelines (LAD6)
  - Section 8 (Technology Stack) - 10% of content
    - Data technologies, ML frameworks (LAD5, LAIA1)
  - Section 9 (Security Architecture) - 5% of content
    - Data security, AI security (LAD7, LAIA2)
  - Section 10 (Non-Functional Requirements) - 5% of content
    - Scalability, performance (LAD5)
  - Section 4 (Meta Architecture) - 3% of content
    - Data architecture patterns (LAD4)
  - Section 12 (ADRs) - 2% of content
    - Data/AI technology decisions (LAD8, LAIA1)

**Example Guidelines**:
- Data quality metrics (completeness, accuracy, timeliness) must be defined and monitored (LAD1)
- Data asset catalog must document all reusable data products (LAD2)
- Data backup must meet RTO ≤ 4 hours, RPO ≤ 1 hour for critical data (LAD3)
- Data storage must be decoupled from processing using API abstraction layer (LAD4)
- Data architecture must handle 5x volume growth without redesign (LAD5)
- ETL/ELT pipelines must include data validation and error handling (LAD6)
- PII data must comply with GDPR retention limits and data residency rules (LAD7)
- Data naming conventions must follow organizational standards (LAD8)
- AI models must have documented retraining schedules and version control (LAIA1)
- AI models must be tested for bias and adversarial robustness (LAIA2)
- Generative AI must implement hallucination detection with confidence thresholds (LAIA3)

**Template Priority**: Medium (Template #4)
**Validation Items**: 11 requirements (8 LAD + 3 LAIA)
**Template Version**: 2.0

---

### 5. Development Architecture (Development Architecture)

**Purpose**: Define guidelines for software development including technology stack validation, development best practices, and architecture debt management through standardized compliance requirements.

**Stakeholders**:
- Solution architects
- Development teams
- Tech leads
- Engineering managers
- DevOps team

**2 LADES Requirements** (Version 2.0):

**LADES1: Best Practices Adoption - Technology Stack Alignment**
- **Backend Technology Stack Alignment**: Backend language/framework, backend tools, containerization, backend libraries, backend naming conventions
- **Frontend Technology Stack Alignment**: Frontend framework, frontend language, frontend tools, frontend architecture pattern, frontend libraries, frontend naming conventions
- **Other Technology Stack Alignment**: Automation/testing tools, Infrastructure as Code, databases, APIs/integrations, CI/CD pipelines
- **Stack Validation Checklist**: Automatic 26-item validation (Java Backend: 6 items, .NET Backend: 6 items, Frontend: 6 items, Other Stacks: 5 items, Exceptions: 3 items)
- **Requirement**: All technology choices must comply with organizational standards and authorized catalogs

**LADES2: Architecture Debt Impact - Exception Handling**
- **Stack Deviation Identification**: Document non-compliant or deprecated technologies, unapproved frameworks, missing tools
- **Exception Documentation**: Provide business justification, technical rationale, risk assessment, mitigation plan for each deviation
- **Remediation Action Plans**: Define upgrade timeline, migration strategy, interim risk mitigation if deviations exist
- **Requirement**: All deviations from technology standards must be documented with approved exceptions or remediation plans

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 8 (Technology Stack) - 60% of content
    - Languages, frameworks, versions, tools, libraries (LADES1)
    - Stack validation against 26-item checklist (LADES1.6)
  - Section 12 (Architecture Decision Records) - 15% of content
    - Technology choice justifications (LADES2)
    - Exception documentation for deviations (LADES2.2)
- **Secondary**:
  - Section 3 (Business Context) - 10% of content
    - Design patterns, architectural style (LADES1)
  - Section 5 (Component Model) - 10% of content
    - Component design, interfaces (LADES1)
  - Section 11 (Operational Considerations) - 5% of content
    - CI/CD pipelines, deployment processes (LADES1)

**Example Guidelines**:
- Technology stack must use approved versions (Java 11/17/21 LTS, .NET 6/8, React 18+) (LADES1)
- Deprecated versions (Java 8, .NET Framework 4.x) trigger FAIL status (LADES1)
- All deviations require documented exceptions via LADES2 process
- Exception documentation must include business justification and remediation timeline (LADES2.2, LADES2.3)
- Stack validation is MANDATORY - contract cannot be approved without completed 26-item checklist (LADES1.6)
- Unapproved technologies automatically populate LADES2.1 for exception review

**Automatic Stack Validation**: This contract includes **mandatory** automatic validation of the technology stack against a 26-item checklist during document generation (Step 3.5). Validation evaluates Java Backend (6 items), .NET Backend (6 items), Frontend (6 items), Other Stacks (5 items), and Exceptions (3 items). Results are embedded in LADES1.6 with PASS (approval unblocked) or FAIL (approval blocked) status. FAIL status requires LADES2 exception documentation before contract approval.

**Template Priority**: Medium (Template #5)
**Validation Items**: 26 items across technology stack categories + 2 LADES requirements
**Template Version**: 2.0

---

### 6. Process Transformation and Automation

**Purpose**: Define guidelines for process automation, feasibility analysis, automation factors, license efficiency, and document management alignment to ensure successful digital transformation.

**Stakeholders**:
- Process architects
- Automation engineers
- License managers
- Information architects
- Business analysts
- Digital transformation office

**4 LAA Requirements** (Version 2.0):

**LAA1: Feasibility and Impact Analysis**
- **Manuality Assessment**: Current manual effort (FTE hours/week), process complexity, ROI justification
- **Integration Analysis**: System integration points, data flows, API dependencies, error handling
- **User Experience Impact**: Workflow changes, UI/UX modifications, training requirements, change management
- **Data Type Assessment**: Data sources, quality requirements, transformation logic, sensitivity classification

**LAA2: Automation Factors**
- **Automation Timing**: Execution schedule (real-time/batch/event-driven), time-critical requirements, business hours alignment
- **Periodicity and Frequency**: Run frequency, peak load considerations, retry and backoff strategy
- **Cost Analysis**: License costs, infrastructure costs, maintenance costs, ROI timeline
- **Operability and Maintenance**: Monitoring requirements, error handling/alerting, support model, maintenance windows

**LAA3: Efficient License Usage**
- **License Optimization Strategy**: Consumption model (concurrent/named user/API calls), pooling strategy, license quantity
- **Technology Integration Licensing**: Third-party integration licenses, connector licensing, database access licensing
- **Cost Efficiency Measures**: Cost reduction tactics, organizational licensing agreements, compliance monitoring

**LAA4: Document Management Alignment**
- **Document Management Capabilities**: Document lifecycle scope, version control, archival/retention policies
- **Licensing Alignment**: DMS licensing, organizational agreement compliance, storage licensing
- **Integration Verification**: DMS integration points, authentication/access controls, document security classification

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 3 (Business Context) - 25% of content
    - Business problem, goals, success metrics, use cases (LAA1)
  - Section 10 (Non-Functional Requirements) - 20% of content
    - Performance, scalability requirements (LAA2)
  - Section 11 (Operational Considerations) - 25% of content
    - Monitoring, error handling, support model, cost (LAA2, LAA4)
- **Secondary**:
  - Section 5 (Component Model) - 10% of content
    - Automation components (LAA1)
  - Section 6 (Data Model) - 10% of content
    - Data sources, quality, classification (LAA1, LAA4)
  - Section 7 (Integration View) - 5% of content
    - Integration catalog, API dependencies (LAA1, LAA3, LAA4)
  - Section 8 (Technology Stack) - 5% of content
    - Automation platforms, licenses (LAA2, LAA3, LAA4)

**Example Guidelines**:
- Manual effort > 10 FTE hours/week requires documented ROI analysis (LAA1)
- All integrations must document error handling and retry logic (LAA1)
- Automation timing must align with business hours or specify 24/7 operation (LAA2)
- License consumption model must be optimized (concurrent vs. named user) (LAA3)
- Third-party integration licenses must be identified and costed (LAA3)
- Document management integration requires DMS authentication documentation (LAA4)

**Template Priority**: Medium (Template #6)
**Validation Items**: 24 items across 4 LAA sections (8+8+5+3)
**Template Version**: 2.0

---

### 7. Security Architecture (Security Architecture)

**Purpose**: Define guidelines for API security, microservices communication security, encryption, and authentication to ensure comprehensive security architecture compliance.

**Stakeholders**:
- Security architects
- Security operations (SecOps)
- Application security team
- Compliance team
- Platform engineers
- API architects

**8 LAS Requirements** (Version 2.0):

**LAS1: API Exposure**
- API Gateway implementation, authentication mechanism, authorization model, rate limiting
- Requirement: All external APIs must be exposed through API Gateway with OAuth 2.0/OIDC authentication

**LAS2: Intra-Microservices Communication**
- Service mesh implementation, mTLS encryption, service-to-service authorization
- Requirement: Microservices must communicate via service mesh with mTLS and service identity

**LAS3: Inter-Cluster Kubernetes Communication**
- Multi-cluster architecture, inter-cluster security (VPN/TLS, network policies)
- Requirement: Multi-cluster Kubernetes deployments must secure inter-cluster communication

**LAS4: Domain API Communication**
- Domain API design (DDD bounded contexts), domain API security, domain events security
- Requirement: Domain APIs must follow bounded context design with defined security models

**LAS5: Third-Party API Consumption**
- Third-party API inventory, credential security (vault storage), vendor risk management
- Requirement: Third-party API credentials must be stored in approved vault (Azure Key Vault, HashiCorp Vault)

**LAS6: Data Lake Communication**
- Data lake access security, encryption (TLS 1.2+), data governance policies
- Requirement: Data lake communication must use RBAC, encryption, and data classification

**LAS7: Internal Application Authentication**
- Authentication strategy (SSO/SAML/OIDC), MFA enforcement, session management
- Requirement: Internal applications must use centralized SSO with MFA enforcement

**LAS8: HTTP Encryption Scheme**
- TLS 1.2+ configuration, certificate management automation, HTTP security headers
- Requirement: All HTTP communications must enforce TLS 1.2+ with HSTS and security headers

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 9 (Security Architecture) - 50% of content
    - API security, authentication, encryption, access controls (LAS1, LAS2, LAS4, LAS5, LAS6, LAS7, LAS8)
  - Section 5 (Component Model) - 20% of content
    - API Gateway, service mesh, component security (LAS1, LAS2)
  - Section 7 (Integration View) - 15% of content
    - Domain APIs, third-party integrations, data lake (LAS4, LAS5, LAS6)
- **Secondary**:
  - Section 4 (Architecture Diagrams) - 10% of content
    - Multi-cluster architecture, deployment topology (LAS3)
  - Section 11 (Operational Considerations) - 5% of content
    - Certificate management, vendor risk (LAS5, LAS8)

**Validation Items**: 24 items across 8 LAS sections (4+3+2+3+3+3+3+3)
**Template Version**: 2.0

**Template Priority**: High (Template #7)

---

### 8. Platform & IT Infrastructure

**Purpose**: Define guidelines for platform design, infrastructure deployment, database management, capacity planning, and operational environments to ensure scalable and maintainable IT infrastructure.

**Stakeholders**:
- Infrastructure architects
- Platform engineers
- Database administrators
- Integration architects
- Operations team
- Cloud architects

**9 LAPI Requirements** (Version 1.0):

**LAPI01: Unique Production Environments**
- Environment isolation, network separation, configuration management, access controls
- Requirement: Production must be isolated from non-production to prevent unauthorized access and configuration errors

**LAPI02: Server Operating Systems**
- OS selection, version approval, patch management, security hardening
- Requirement: Only authorized operating system versions with current security patches

**LAPI03: Database Storage Capacity**
- Storage sizing, growth projections, retention policies, archival strategy
- Requirement: Database capacity must support current and projected transaction volumes

**LAPI04: Database Version Authorization**
- Database platform selection, version approval, upgrade path, compatibility
- Requirement: Only approved database versions (current or n-1) may be used

**LAPI05: Database Backup and Retention**
- Backup frequency, retention periods, recovery testing, compliance alignment
- Requirement: Backup strategy must meet RTO/RPO and regulatory retention requirements

**LAPI06: Infrastructure Capacity**
- Compute resources, memory allocation, network bandwidth, scaling strategy
- Requirement: Infrastructure must support peak load with headroom for growth

**LAPI07: Naming Conventions**
- Resource naming standards, environment prefixes, component identification
- Requirement: Consistent naming conventions across all infrastructure components

**LAPI08: Transaction Volume Dimensioning**
- TPS capacity, concurrent users, throughput limits, performance benchmarks
- Requirement: Infrastructure must support documented transaction volume requirements

**LAPI09: Legacy Platform Transaction Capacity**
- Integration with legacy systems, transaction limits, throttling, capacity constraints
- Requirement: Legacy platform integration must respect transaction capacity limits

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 4 (Meta Architecture) - 30% of content
    - Deployment environments, infrastructure topology (LAPI01, LAPI06)
  - Section 8 (Technology Stack) - 30% of content
    - Operating systems, databases, infrastructure tools (LAPI02, LAPI03, LAPI04, LAPI07)
  - Section 11 (Operational Considerations) - 25% of content
    - Backup/recovery, capacity planning, operations (LAPI05, LAPI06)
- **Secondary**:
  - Section 10 (Non-Functional Requirements) - 10% of content
    - Performance, capacity requirements (LAPI06, LAPI08)
  - Section 7 (Integration View) - 5% of content
    - Legacy system integrations (LAPI09)

**Example Guidelines**:
- Production environments must be isolated from dev/test (LAPI01)
- Only approved OS versions: Windows Server 2019/2022, RHEL 8/9, Ubuntu 20.04/22.04 LTS (LAPI02)
- Database capacity must support 3x current transaction volume (LAPI03)
- Approved databases: PostgreSQL 14+, MySQL 8+, SQL Server 2019+, Oracle 19c+ (LAPI04)
- Database backups: daily full, hourly incremental, 30-day retention minimum (LAPI05)
- Infrastructure must handle peak load + 30% headroom (LAPI06)
- Naming convention: [env]-[app]-[component]-[instance] (e.g., prod-crm-api-01) (LAPI07)
- Document maximum TPS and concurrent user limits (LAPI08)
- Legacy system integration must not exceed documented capacity limits (LAPI09)

**Template Priority**: Medium (Template #8)
**Validation Items**: 9 LAPI requirements
**Template Version**: 1.0

---

### 9. Enterprise Architecture (Enterprise Architecture)

**Purpose**: Define guidelines for strategic alignment, modularity, cloud-first approach, and business-technology alignment.

**Stakeholders**:
- Enterprise architects
- Business architects
- CTO/CIO office
- Portfolio management

**Key Content Requirements**:
- **Strategic Alignment**: Business strategy alignment, digital transformation
- **Modularity**: Bounded contexts, service boundaries, reusability
- **Cloud-First**: Cloud adoption strategy, cloud-native principles
- **Third-Party Applications**: Customization limits, integration approach
- **Obsolescence Zero**: Technology lifecycle, modernization roadmap
- **API First / Event Driven**: API strategy, event-driven architecture
- **Business Capabilities**: Capability mapping, domain-driven design

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 1 (System Overview) - 25% of content
    - System purpose, scope
  - Section 2 (Business Context) - 25% of content
    - Business drivers, stakeholders
  - Section 3 (Architecture Patterns) - 25% of content
    - Architectural approach
  - Section 4 (Deployment Architecture) - 15% of content
    - Deployment strategy
- **Secondary**:
  - Section 12 (Architecture Decision Records) - 10% of content
    - Strategic decisions

**Example Guidelines**:
- Solutions must align with enterprise business capabilities
- Modularity: services should be bounded by business domains
- Cloud-first: prefer cloud-native over on-premise solutions
- Third-party app customization maximum: 20% of functionality
- No obsolete technologies (EOL within 3 years)
- API-first design for all service interfaces
- Event-driven for asynchronous processes

**Template Priority**: Medium (Template #9)

---

### 10. Integration Architecture (Version 2.0)

**Purpose**: Define guidelines for API integration best practices, secure integrations, technology currency, governance compliance, third-party documentation, traceability, and event-driven architecture standards.

**Stakeholders**:
- Integration architects
- API platform team
- Microservices teams
- Enterprise integration team
- Security architects
- SRE team
- Event architects

**7 LAI Requirements** (Version 2.0):

**LAI1: Best Practices Adoption**
- Domain microservice API accessibility, API catalog completeness, RESTful design, versioning strategy, error handling, OpenAPI documentation
- Requirement: All domain microservices must be accessible via domain APIs with complete catalog

**LAI2: Secure Integrations**
- API authentication (OAuth 2.0, JWT, mTLS), authorization (RBAC/ABAC), TLS 1.2+ encryption, secrets management, security logging
- Requirement: All integrations must use secure authentication and TLS 1.2+ encryption

**LAI3: No Obsolete Integration Technologies**
- REST protocol currency (HTTP/1.1, HTTP/2), SOAP version check, modern message brokers (Kafka, RabbitMQ), no legacy ESB
- Requirement: No deprecated integration technologies (SOAP 1.0, WebSphere MQ, legacy ESB without upgrade path)

**LAI4: Integration Governance Standards**
- API naming conventions, API lifecycle management, change control, governance playbook compliance, API review process
- Requirement: All APIs must follow organizational integration governance playbook

**LAI5: Third-Party Documentation**
- Third-party API inventory, API specifications (OpenAPI/Swagger), integration guides, SLAs, support contacts
- Requirement: All third-party APIs must provide proper documentation and SLAs

**LAI6: Traceability and Audit**
- Distributed tracing (OpenTelemetry, Jaeger), trace context propagation (W3C standard), structured logging (JSON), correlation IDs, centralized logging platform
- Requirement: All integrations must implement distributed tracing and structured logging with correlation IDs

**LAI7: Event-Driven Integration Compliance**
- Event schemas (JSON Schema/Avro), CloudEvents compliance, event versioning, schema registry, event catalog, consumer contracts, delivery guarantees, DLQ handling
- Requirement: Event-driven integrations must follow CloudEvents specification with schema registry

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 7 (Integration View) - 50% of content
    - Domain APIs, API catalog, integration patterns, third-party APIs, distributed tracing, logging standards (LAI1, LAI3, LAI4, LAI5, LAI6)
  - Section 9 (Security Architecture) - 25% of content
    - API authentication, authorization, TLS encryption, secrets management, security logging (LAI2)
  - Section 6 (Data Model) - 15% of content
    - Event schemas, CloudEvents, schema registry, event catalog, DLQ handling (LAI7)
- **Secondary**:
  - Section 5 (Component Model) - 10% of content
    - API Gateway, message brokers, service mesh, schema registry (LAI1, LAI3, LAI6)

**Validation Items**: 25 items across 7 LAI sections (5+4+4+4+4+4+4)
**Template Version**: 2.0

**Template Priority**: High (Template #10)

---

## Generation Workflow

### Phase 1: Preparation

**Step 1: Verify ARCHITECTURE.md Exists**
```
Check locations:
1. Current directory: ./ARCHITECTURE.md
2. Parent directory: ../ARCHITECTURE.md
3. Docs directory: ./docs/ARCHITECTURE.md

If not found: Ask user for location or suggest creating with architecture-docs skill
```

**Step 2: Load Document Index**
```
Read ARCHITECTURE.md lines 1-50 to extract:
- Project name (Section 1 title)
- Document structure (12-section format)
- Section boundaries (line ranges)

Example Document Index:
Line 1: # Project Name: Job Scheduling Platform
Line 5: ## Section 1: System Overview (lines 5-150)
Line 151: ## Section 2: Business Context (lines 151-300)
...
Line 1950: ## Section 12: ADRs (lines 1950-2100)
```

**Step 3: Validate Structure**
```
Required checks:
✓ ARCHITECTURE.md follows 12-section standard format
✓ Document Index present (first 50 lines)
✓ All sections numbered and titled correctly
✓ Section line ranges don't overlap

If validation fails: Suggest running architecture-docs skill
```

**Step 4: Prompt User for Output Preferences**
```
Questions:
1. Which contracts to generate? (All 11, specific, by category)
2. Output directory? (Default: /compliance-docs/)
3. Preview before generation? (Yes/No)
4. Handle missing templates? (Use placeholder structure / Skip / Provide now)
```

---

### Phase 2: Contract Selection

**Option A: Generate All 11 Documents**
```
User: "Generate all compliance documents"

Action:
- Select all 10 contract types
- Estimate time and context usage
- Confirm with user
- Proceed to data extraction
```

**Option B: Generate Specific Contract Type**
```
User: "Generate SRE Architecture contract"

Action:
- Parse contract name from request
- Match to contract type: "SRE Architecture"
- Confirm selection
- Proceed to data extraction
```

**Option C: Generate by Category**
```
User: "Generate security compliance documents"

Category Mapping:
- "security" → Security Architecture
- "cloud" → Cloud Architecture, Platform & IT Infrastructure
- "data" → Data & Analytics - AI Architecture
- "development" → Development Architecture
- "integration" → Integration Architecture
- "SRE" or "reliability" → SRE Architecture, Business Continuity
- "enterprise" → Enterprise Architecture
- "automation" → Process Transformation and Automation

Action:
- Map category to contract types
- Confirm selection
- Proceed to data extraction
```

---

### Phase 3: Data Extraction

**For Each Selected Contract:**

**Step 3.1: Identify Required Sections**
```
Consult SECTION_MAPPING_GUIDE.md for contract type

Example: SRE Architecture
- Primary: Sections 10, 11 (70% of content)
- Secondary: Section 5 (10% of content)

Prioritize loading: Primary sections first, secondary only if needed
```

**Step 3.2: Load Sections Incrementally**
```
For each required section:
1. Get line range from Document Index
2. Add ±10 line buffer (capture section context)
3. Read specific lines from ARCHITECTURE.md
4. Parse and extract relevant data

Example:
Section 10: Performance Requirements (lines 1550-1750)
Load with buffer: lines 1540-1760 (220 lines total)

Benefits:
- Avoid loading entire 2000+ line document
- Reduce context usage by 70-80%
- Faster processing
- More focused extraction
```

**Step 3.3: Extract Data Using Patterns**
```
Four extraction strategies:

1. Direct Mapping (1:1)
   Pattern: Look for exact values
   Example: "RTO: 4 hours" → Extract "4 hours"

2. Aggregation (Multiple sources)
   Pattern: Collect related items
   Example: All integrations from Section 7 → Integration catalog

3. Transformation (Reformatting)
   Pattern: Calculate or reformat
   Example: "99.99% SLA" → Calculate error budget (43.2 min/month)

4. Inference (Derived values)
   Pattern: Infer from context
   Example: "99.99% SLA" → Infer "Tier 1" criticality
```

**Step 3.4: Cache Extracted Data**
```
Store extracted data with metadata:

{
  "contract_type": "SRE Architecture",
  "data_points": [
    {
      "key": "availability_slo",
      "value": "99.99%",
      "source": "Section 10.2, line 1576",
      "extraction_type": "direct"
    },
    {
      "key": "error_budget",
      "value": "43.2 minutes/month",
      "source": "Section 10.2, line 1576 (calculated)",
      "extraction_type": "transformation"
    }
  ]
}

Cache benefits:
- Reuse data across multiple contracts
- Avoid re-loading same sections
- Maintain source traceability
```

**Step 3.5: Automatic Validation** (All Contract Types)
```
For ALL contract types:

Input: Cached section content from ARCHITECTURE.md
Process: Load external validation config and validate against criteria
Output: ValidationResults object → cache for Phase 4

Validation Workflow:
1. Load validation config file from /skills/architecture-compliance/validation/
   - Format: {contract_name}_validation.json
   - Example: development_architecture_validation.json

2. Parse validation configuration:
   - Scoring thresholds (auto_approve: 8.0, ready_for_review: 7.0, needs_work: 5.0)
   - Weights (completeness, compliance, quality)
   - Validation sections and items
   - Approval authority

3. Evaluate validation items from config:
   - PASS (10 points): Complies with requirements
   - FAIL (0 points): Non-compliant or deprecated
   - N/A (10 points): Not applicable to this architecture
   - UNKNOWN (0 points): Missing data in ARCHITECTURE.md
   - EXCEPTION (10 points): Documented exception via LADES2

4. Calculate scores:
   - Item Score: Based on status (PASS=10, FAIL=0, N/A=10, UNKNOWN=0, EXCEPTION=10)
   - Section Score: Weighted average of item scores
   - Completeness Score: (Filled required fields / Total required) × 10
   - Compliance Score: (PASS + N/A + EXCEPTION items / Total applicable) × 10
   - Quality Score: Source traceability coverage (0-10)
   - Final Score: (Completeness × weight) + (Compliance × weight) + (Quality × weight)

   **CRITICAL - N/A Items MUST Be Included in Compliance Score:**

   N/A items receive full 10 points and must be counted in the compliance score numerator.

   Example calculation:
   - Items: 6 PASS, 5 N/A, 0 FAIL, 0 UNKNOWN out of 11 total items
   - Compliance Score: (6 PASS + 5 N/A + 0 EXCEPTION) / 11 × 10 = 11/11 × 10 = **10.0/10 (100%)**
   - ❌ WRONG: 6/11 × 10 = 6.0/10 (55%)

   **Rationale**: N/A means "legitimately not applicable to this architecture" - these items should
   count as fully compliant, not neutral. Only UNKNOWN (missing required data) and FAIL (non-compliant)
   items receive 0 points.

5. Determine outcome based on final score:
   - 8.0-10.0: AUTO_APPROVE → Status: "Approved", Actor: "System (Auto-Approved)"
   - 7.0-7.9: MANUAL_REVIEW → Status: "In Review", Actor: [Approval Authority]
   - 5.0-6.9: NEEDS_WORK → Status: "Draft", Actor: "Architecture Team"
   - 0.0-4.9: REJECT → Status: "Rejected", Actor: "N/A (Blocked)"

6. Collect evidence with source references (Section X.Y, line Z)

7. Generate recommendations for FAIL/UNKNOWN items

Validation States:
- PASS (score ≥ 7.0): Approval pathway open
- CONDITIONAL (5.0-6.9): Must address gaps before review
- FAIL (< 5.0): Contract rejected, cannot proceed

Context Overhead: ~6,000 tokens (3.5K prompt + 2.5K response)

Cache Structure:
{
  "validation_results": {
    "final_score": 8.7,
    "outcome": {
      "overall_status": "PASS" | "CONDITIONAL" | "FAIL",
      "document_status": "Approved" | "In Review" | "Draft" | "Rejected",
      "review_actor": "System (Auto-Approved)" | "[Approval Authority]" | "Architecture Team" | "N/A (Blocked)",
      "action": "AUTO_APPROVE" | "MANUAL_REVIEW" | "NEEDS_WORK" | "REJECT",
      "message": "Validation passed with high confidence..."
    },
    "validation_date": "2025-12-07",
    "validation_evaluator": "Claude Code (Automated Validation Engine)",
    "scores": {
      "completeness": 9.2,
      "compliance": 8.0,
      "quality": 8.0
    },
    "validation_sections": [
      {
        "section_id": "stack_compliance",
        "section_score": 8.0,
        "items": [
          {
            "item_id": "java_version",
            "status": "PASS",
            "score": 10,
            "evidence": "Java 17 LTS (Section 8.1, line 1234)",
            "source": "Section 8.1, line 1234"
          }
        ]
      }
    ],
    "failures": [],
    "unknowns": [],
    "recommendations": []
  }
}
```

---

### Phase 4: Document Generation

**Step 4.1: Load Template**
```
Template file: templates/TEMPLATE_[CONTRACT_TYPE].md

Example: templates/TEMPLATE_SRE_ARCHITECTURE.md

If template not found:
- Warn user
- Offer: Use basic placeholder structure / Skip / Provide template
- If placeholder: Use generic contract structure
```

**Step 4.2: Apply Extracted Data to Placeholders**
```
Replace standard placeholders:

[PROJECT_NAME] → "Job Scheduling Platform" (from Document Index)
[GENERATION_DATE] → "2025-12-07" (current date)
[EXTRACTED_VALUE] → Actual value from cached data
[SOURCE_REFERENCE] → "Section X, line Y" (from cache)

Example:
Template: **Availability SLO**: [EXTRACTED_VALUE]
Output: **Availability SLO**: 99.99% (Section 10.2, line 1576)
```

**Step 4.2.1: Populate Document Control Section**
```
Using validation_results from Step 3.5, populate Document Control fields:

Standard Placeholders:
[SOLUTION_ARCHITECT] → Extract from ARCHITECTURE.md Section 1 metadata
[GENERATION_DATE] → Current date (YYYY-MM-DD)
[NEXT_REVIEW_DATE] → GENERATION_DATE + 6 months (or per policy)

Validation-Driven Placeholders:
[DOCUMENT_STATUS] → From validation_results.outcome.document_status
  - "Approved" (score 8.0-10.0)
  - "In Review" (score 7.0-7.9)
  - "Draft" (score 5.0-6.9)
  - "Rejected" (score 0.0-4.9)

[VALIDATION_SCORE] → From validation_results.final_score
  - Format: "8.7/10"

[VALIDATION_STATUS] → From validation_results.outcome.overall_status
  - "PASS" (score ≥ 7.0)
  - "CONDITIONAL" (score 5.0-6.9)
  - "FAIL" (score < 5.0)

[VALIDATION_DATE] → From validation_results.validation_date
  - Format: "2025-12-07" or "Not performed"

[VALIDATION_EVALUATOR] → "Claude Code (Automated Validation Engine)"

[REVIEW_ACTOR] → From validation_results.outcome.review_actor
  - "System (Auto-Approved)" (score 8.0-10.0)
  - Template-specific approval authority (score 7.0-7.9)
  - "Architecture Team" (score 5.0-6.9)
  - "N/A (Blocked)" (score 0.0-4.9)

[APPROVAL_AUTHORITY] → From validation config approval_authority field
  - Example: "Technical Architecture Review Board"
  - Example: "Security Review Board"

Example Document Control Output:
| Field | Value |
|-------|-------|
| Document Owner | Solutions Architect Team |
| Last Review Date | 2025-12-07 |
| Next Review Date | 2026-06-07 |
| Status | In Review |
| Validation Score | 7.8/10 |
| Validation Status | PASS |
| Validation Date | 2025-12-07 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | Technical Architecture Review Board |
| Approval Authority | Technical Architecture Review Board |
```

**Step 4.3: Calculate Derived Values**
```
Common calculations:

1. Error Budget from SLA
   Input: 99.99% SLA
   Calculation: (100% - 99.99%) × 43,200 min/month
   Output: 43.2 minutes/month

2. Business Criticality from SLA
   Input: 99.99% SLA
   Inference: Tier 1 (Mission Critical)
   Rationale: >99.95% indicates high-availability requirement

3. Integration Count
   Input: Section 7 (Integration Points)
   Count: Number of external systems
   Output: "15 external integrations"
```

**Step 4.4: Validate Completeness**
```
Check for:
✓ All required sections present in generated document
✓ No empty sections (except where data legitimately missing)
✓ All tables properly formatted
✓ All lists properly formatted
✓ Source traceability included
✓ Metadata complete (project name, date, version)

Track completeness percentage:
Completeness = (Filled data points / Total data points) × 100%

Example: 17/20 data points = 85% complete
```

**Step 4.5: Flag Missing Data**
```
For each missing data point:

1. Add [PLACEHOLDER] marker
   **RTO**: [PLACEHOLDER: Not specified in ARCHITECTURE.md]

2. Provide guidance
   [PLACEHOLDER: Define RTO based on business criticality.
   Recommended: Tier 1 = 4 hours, Tier 2 = 8 hours]

3. Reference source section
   [PLACEHOLDER: See ARCHITECTURE.md Section 11.3 for backup strategy.
   Add RTO/RPO values to complete this section.]

4. Track for completion report
   Contract: SRE Architecture
   Missing data points: 3
   - Incident response team contacts
   - On-call rotation schedule
   - Runbook repository location
```

---

### Phase 4.5: Compliance Summary Table Generation

**CRITICAL**: The Compliance Summary table is the most important section for stakeholders. It MUST follow the exact format specified below for ALL compliance contracts (except Business Continuity).

#### Mandatory Table Format

**Table Structure (6 columns - MANDATORY):**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| [CODE] | [Requirement name] | [Category] | [Status] | [Section] | [Role] |
```

**Column Requirements:**

1. **Code**: Requirement code from template (e.g., LASRE01, LAC1, LAPI01)
   - Extract directly from template
   - Must match template's requirement codes exactly

2. **Requirement**: Short requirement name from template
   - Extract from template
   - Keep concise (≤60 characters recommended)
   - Example: "Define SLOs for all services"

3. **Category**: Classification of the requirement
   - **If template has explicit categories**: Use those (e.g., Data/AI template has "Data" and "AI")
   - **If template has NO explicit categories**: Use the template type as category
     - SRE Architecture → "SRE Architecture"
     - Cloud Architecture → "Cloud Architecture"
     - Security Architecture → "Security Architecture"
     - Platform & IT Infrastructure → "Platform & IT Infrastructure"
     - Development Architecture → "Development Architecture"
     - Enterprise Architecture → "Enterprise Architecture"
     - Integration Architecture → "Integration Architecture"
     - Process Transformation → "Process Transformation"

4. **Status**: Compliance status determined from ARCHITECTURE.md analysis
   - MUST be exactly one of these four values:
     - `Compliant`
     - `Non-Compliant`
     - `Not Applicable`
     - `Unknown`

5. **Source Section**: Reference to ARCHITECTURE.md
   - Format: "Section X" or "Section X, Y" (comma-separated for multiple)
   - If data not found: "Not documented"

6. **Responsible Role**: Accountable role from template
   - Extract from template (e.g., "SRE Team", "Security Architect")

#### Status Determination Logic

For each requirement, analyze ARCHITECTURE.md and assign the appropriate status:

| Status | Criteria | When to Use |
|--------|----------|-------------|
| **Compliant** | Data fully documented in ARCHITECTURE.md AND meets organizational standards | Required data is present and validated |
| **Non-Compliant** | Data missing OR does not meet organizational standards | Critical gaps found or policy violations detected |
| **Not Applicable** | Requirement does not apply to this architecture | Cloud-only requirement for on-premise architecture, etc. |
| **Unknown** | Data partially documented OR quality/applicability unclear | Ambiguous information that needs investigation |

#### Example Scenarios

**Scenario 1: SRE Architecture - LASRE01 "Define SLOs"**
- ARCHITECTURE.md Section 10 contains: "SLO: 99.9% availability, p99 latency < 200ms"
- **Status**: `Compliant` (SLOs are clearly defined with specific metrics)
- **Source Section**: "Section 10"
- **Category**: "SRE Architecture"

**Scenario 2: SRE Architecture - LASRE15 "Runbook Coverage"**
- ARCHITECTURE.md Section 11 mentions: "operational procedures documented in Confluence"
- No specific runbook coverage percentage or systematic approach described
- **Status**: `Unknown` (runbooks mentioned but coverage metrics unclear)
- **Source Section**: "Section 11"
- **Category**: "SRE Architecture"

**Scenario 3: Security Architecture - LAS3 "API Rate Limiting"**
- ARCHITECTURE.md Section 9 (Security) does not mention rate limiting at all
- API endpoints are described in Section 7 but no rate limiting controls
- **Status**: `Non-Compliant` (required security control is missing)
- **Source Section**: "Not documented"
- **Category**: "Security Architecture"

**Scenario 4: Cloud Architecture - LAC4 "Multi-Region Deployment"**
- ARCHITECTURE.md Section 4 states: "Deployment: On-premise data center, single region"
- Architecture has no cloud deployment
- **Status**: `Not Applicable` (cloud requirement for on-premise architecture)
- **Source Section**: "Section 4"
- **Category**: "Cloud Architecture"

**Scenario 5: Data & AI Architecture - LAD1 "Data Quality"**
- ARCHITECTURE.md Section 6 contains: "Data validation: Schema checks, null handling, deduplication"
- **Status**: `Compliant` (data quality measures are documented)
- **Source Section**: "Section 6"
- **Category**: "Data" (template specifies "Data" category for LAD1-LAD5)

**Scenario 6: Data & AI Architecture - LAIA2 "AI Model Monitoring"**
- ARCHITECTURE.md mentions AI models but no monitoring strategy
- **Status**: `Non-Compliant` (AI models present but monitoring missing)
- **Source Section**: "Section 5"
- **Category**: "AI" (template specifies "AI" category for LAIA1-LAIA5)

#### Overall Compliance Summary Calculation

After populating all table rows, calculate compliance statistics:

**Calculation Formula:**
```
TOTAL = Total number of requirements for this contract type
X (Compliant) = Count of rows with Status = "Compliant"
Y (Non-Compliant) = Count of rows with Status = "Non-Compliant"
Z (Not Applicable) = Count of rows with Status = "Not Applicable"
W (Unknown) = Count of rows with Status = "Unknown"

Verification: X + Y + Z + W = TOTAL (must sum correctly)
```

**Output Format (MANDATORY):**
```markdown
**Overall Compliance**:
- ✅ Compliant: X/TOTAL (X/TOTAL*100%)
- ❌ Non-Compliant: Y/TOTAL (Y/TOTAL*100%)
- ⊘ Not Applicable: Z/TOTAL (Z/TOTAL*100%)
- ❓ Unknown: W/TOTAL (W/TOTAL*100%)

**Completeness**: [COMPLETENESS_PERCENTAGE]% ([COMPLETED_ITEMS]/[TOTAL_ITEMS] data points documented)
```

**Example Calculation (SRE Architecture - 57 total requirements):**

Assume after analyzing ARCHITECTURE.md:
- 42 requirements are Compliant (data fully documented)
- 8 requirements are Non-Compliant (data missing)
- 3 requirements are Not Applicable (doesn't apply to this architecture)
- 4 requirements are Unknown (partially documented)
- Total: 42 + 8 + 3 + 4 = 57 ✓

**Output:**
```markdown
**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)

**Completeness**: 87% (124/142 data points documented)
```

**Notes:**
- Round percentages to nearest integer (e.g., 73.68% → 74%)
- Completeness percentage is separate from compliance status
- Completeness measures how many data points across ALL sections are documented
- A document can be 100% complete but have non-compliant items

#### Format Enforcement Checklist

Before finalizing any generated compliance contract, verify:

- [ ] Table has exactly 6 columns: Code | Requirement | Category | Status | Source Section | Responsible Role
- [ ] Table header uses proper markdown pipe syntax: `| Col1 | Col2 | Col3 | Col4 | Col5 | Col6 |`
- [ ] Table separator line uses proper syntax: `|------|------|------|------|------|------|`
- [ ] All requirement codes present (row count matches template's total requirements)
- [ ] Category column is populated for every row
  - Use explicit categories if template defines them (e.g., "Data", "AI")
  - Use template type as category if no explicit categories (e.g., "Cloud Architecture")
- [ ] Status values use EXACTLY one of: "Compliant", "Non-Compliant", "Not Applicable", "Unknown"
- [ ] No placeholder status values like "[STATUS]" or "[Compliant/Non-Compliant]"
- [ ] Source Section references actual ARCHITECTURE.md sections or "Not documented"
- [ ] Overall Compliance line uses emoji indicators: ✅ ❌ ⊘ ❓
- [ ] Compliance counts sum to TOTAL: X + Y + Z + W = TOTAL
- [ ] Percentages calculated correctly and rounded to nearest integer
- [ ] Completeness metric included with percentage and fraction format
- [ ] No markdown formatting errors in the table

#### Special Cases

**Business Continuity Contracts:**
- These two contracts use a **different format** (section-based, not table-based)
- DO NOT apply the 6-column table format to these contracts
- Use the template's native format instead

**Data & AI Architecture Contract:**
- Uses two explicit categories: "Data" and "AI"
- LAD1-LAD5 requirements use "Data" category
- LAIA1-LAIA5 requirements use "AI" category
- Do NOT use "Data & AI Architecture" as category for this template

#### Complete Example

**SRE Architecture Contract - Compliance Summary Section:**

```markdown
## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Define SLOs for all services | SRE Architecture | Compliant | Section 10 | SRE Team |
| LASRE02 | Calculate error budgets | SRE Architecture | Compliant | Section 10 | SRE Team |
| LASRE03 | Implement monitoring stack | SRE Architecture | Non-Compliant | Not documented | Platform Team |
| LASRE04 | Incident response procedures | SRE Architecture | Unknown | Section 11 | SRE Team |
| LASRE05 | On-call rotation schedule | SRE Architecture | Compliant | Section 11 | SRE Team |
| ... | ... | ... | ... | ... | ... |
| LASRE57 | Capacity planning process | SRE Architecture | Compliant | Section 10 | SRE Team |

**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)

**Completeness**: 87% (124/142 data points documented)
```

#### Common Mistakes to Avoid

1. ❌ **Wrong column count**: Using 5 columns instead of 6 (missing Category)
2. ❌ **Missing Category**: Leaving Category column empty or using "[Category]" placeholder
3. ❌ **Invalid Status values**: Using custom status like "Partial", "In Progress", etc.
4. ❌ **Missing emoji indicators**: Not using ✅ ❌ ⊘ ❓ in Overall Compliance
5. ❌ **Missing percentages**: Only showing fractions without percentages
6. ❌ **Incorrect sums**: X + Y + Z + W ≠ TOTAL
7. ❌ **Applying table to wrong contracts**: Using table format for Business Continuity (only contract with section-based format)
8. ❌ **Using wrong category**: Using "Data & AI Architecture" for every row in Data/AI contract instead of "Data"/"AI"

---

### Phase 5: Output and Verification

**Step 5.1: Generate Filename**
```
Pattern: [CONTRACT_TYPE]_[PROJECT_NAME]_[DATE].md

Sanitize project name: Remove spaces, special characters
Example: "Job Scheduling Platform" → "JobSchedulingPlatform"

Final filename: ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md

If file exists:
- Check timestamp
- Append time: ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26_1430.md
```

**Step 5.2: Save Document**
```
Output directory: /compliance-docs/ (default)

Create directory if doesn't exist:
mkdir -p /compliance-docs/

Write file:
Write content to: /compliance-docs/ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md

Preserve:
- Markdown formatting
- Line breaks
- Tables
- Lists
- Code blocks
```

**Step 5.3: Generate Manifest**
```
File: /compliance-docs/COMPLIANCE_MANIFEST.md

Content:
# Compliance Documentation Manifest

**Project**: Job Scheduling Platform
**Source**: ARCHITECTURE.md
**Generated**: 2025-11-26

## Generated Documents

| Contract Type | Filename | Completeness | Placeholders |
|---------------|----------|--------------|--------------|
| SRE Architecture | ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md | 85% | 3 |
| Business Continuity | CONTINUIDAD_NEGOCIO_JobSchedulingPlatform_2025-11-26.md | 90% | 2 |
| ... | ... | ... | ... |

## Summary
- Total Contracts: 11
- Average Completeness: 87%
- Total Placeholders: 23
- Generation Time: 2025-11-26 14:30:00

Update manifest after each contract generation (append or update)
```

**Step 5.4: Per-Contract Completion Report**
```
For each generated contract:

---
Contract: SRE Architecture
Filename: ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md
Status: ✓ Generated
Completeness: 85% (17/20 data points)

Data Extraction Statistics:
- Total data points: 20
- Successfully extracted: 17
- Placeholders: 3
- Source sections used: 10, 11 (400 lines loaded vs 2000+ total)

Missing Data (Requires Manual Review):
1. Incident response team contacts
   Location: Section "On-Call Management"
   Recommendation: Add to ARCHITECTURE.md Section 11.2

2. On-call rotation schedule
   Location: Section "On-Call Management"
   Recommendation: Add to ARCHITECTURE.md Section 11.2

3. Runbook repository location
   Location: Section "Operational Runbooks"
   Recommendation: Add to ARCHITECTURE.md Section 11.4

Source Traceability:
- Section 10.1 (lines 1558-1560): Latency SLOs
- Section 10.2 (line 1576): Availability SLO
- Section 11.1 (lines 1780-1785): Monitoring tools
- Section 11.2 (lines 1810-1820): Incident procedures

Next Steps:
1. Review ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md
2. Complete 3 [PLACEHOLDER] sections
3. Update ARCHITECTURE.md to reduce placeholders in future generations
---
```

**Step 5.5: Summary Report for All Contracts**
```
After all contracts generated:

═══════════════════════════════════════════════════
COMPLIANCE DOCUMENTATION GENERATION COMPLETE
═══════════════════════════════════════════════════

Project: Job Scheduling Platform
Source: ARCHITECTURE.md (2,100 lines)
Generated: 2025-11-26 14:30:00
Output Directory: /compliance-docs/

Contracts Generated: 11 / 11 ✓

Individual Contract Status:
✓ Business Continuity          (90% complete, 2 placeholders)
✓ SRE Architecture                (85% complete, 3 placeholders)
✓ Cloud Architecture              (80% complete, 4 placeholders)
✓ Data & Analytics - AI Architecture  (75% complete, 5 placeholders)
✓ Development Architecture         (88% complete, 2 placeholders)
✓ Process Transformation and Automation      (70% complete, 6 placeholders)
✓ Security Architecture v2.0     (8 LAS requirements, 24 validation items)
✓ Platform & IT Infrastructure   (85% complete, 3 placeholders)
✓ Enterprise Architecture        (78% complete, 4 placeholders)
✓ Integration Architecture v2.0  (7 LAI requirements, 25 validation items)

Overall Statistics:
- Average Completeness: 83%
- Total Placeholders: 33
- Context Efficiency: 75% reduction (avg 450 lines loaded per contract vs 2100 total)
- Processing Time: ~7 minutes (all 10 contracts)

Files Created:
- /compliance-docs/COMPLIANCE_MANIFEST.md
- /compliance-docs/CONTINUIDAD_NEGOCIO_JobSchedulingPlatform_2025-11-26.md
- /compliance-docs/ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md
- ... (8 more)

Placeholders Requiring Manual Review: 40
Top Missing Data Points:
1. On-call contacts/schedules (appears in 5 contracts)
2. DR drill schedules (appears in 3 contracts)
3. Backup restoration test results (appears in 2 contracts)

Recommendations for ARCHITECTURE.md Improvements:
1. Add Section 11.2: Incident Management
   - Include on-call rotation, escalation paths, team contacts
   - Would eliminate 8 placeholders across 5 contracts

2. Expand Section 11.3: Backup and Recovery
   - Include DR drill schedule and results
   - Would eliminate 5 placeholders across 3 contracts

3. Add Section 11.4: Operational Runbooks
   - Include runbook repository, key procedures
   - Would eliminate 4 placeholders across 2 contracts

Next Steps:
1. Review all generated contracts in /compliance-docs/
2. Complete 40 [PLACEHOLDER] sections manually
3. Update ARCHITECTURE.md based on recommendations
4. Regenerate contracts to validate improvements

═══════════════════════════════════════════════════
```

---

## Section Extraction Strategies

### Direct Mapping (1:1 Extraction)

**Definition**: Extract exact values from ARCHITECTURE.md without transformation.

**When to Use**:
- Values are explicitly stated
- No calculation needed
- Format matches contract requirement

**Examples**:

**Example 1: RTO/RPO**
```
ARCHITECTURE.md Input (Section 11.3, line 1823):
"Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour"

Contract Output:
**RTO**: 4 hours
**RPO**: 1 hour
**Source**: ARCHITECTURE.md Section 11.3, lines 1823-1824
```

**Example 2: Technology Stack**
```
ARCHITECTURE.md Input (Section 8.1, line 1350):
"Backend: Python 3.11, FastAPI 0.104
Database: PostgreSQL 15.2"

Contract Output:
**Backend Technologies**:
- Python 3.11
- FastAPI 0.104

**Database**:
- PostgreSQL 15.2

**Source**: ARCHITECTURE.md Section 8.1, lines 1350-1351
```

---

### Aggregation (Multiple Sources)

**Definition**: Collect related items from multiple locations and consolidate.

**When to Use**:
- Data scattered across multiple sections
- Creating catalogs or inventories
- Building comprehensive lists

**Examples**:

**Example 1: Integration Catalog**
```
ARCHITECTURE.md Input:

Section 7.1 (line 1005):
"Integration: User Directory (Active Directory)
Protocol: LDAP, REST API
Authentication: Service Account"

Section 7.2 (line 1020):
"Integration: Payment Gateway (Stripe)
Protocol: REST API
Authentication: API Key"

Section 7.3 (line 1035):
"Integration: Email Service (SendGrid)
Protocol: REST API
Authentication: Bearer Token"

Contract Output:
## Integration Catalog

| System | Protocol | Authentication | Source |
|--------|----------|----------------|--------|
| Active Directory | LDAP, REST API | Service Account | Section 7.1, line 1005 |
| Stripe Payment Gateway | REST API | API Key | Section 7.2, line 1020 |
| SendGrid Email | REST API | Bearer Token | Section 7.3, line 1035 |

**Total Integrations**: 3
```

**Example 2: Technology Inventory**
```
ARCHITECTURE.md Input:

Section 8.1 (Backend): "Python 3.11, FastAPI"
Section 8.2 (Frontend): "React 18, TypeScript 5.0"
Section 8.3 (Database): "PostgreSQL 15.2, Redis 7.0"
Section 8.4 (Infrastructure): "Docker, Kubernetes 1.28"
Section 8.5 (Monitoring): "Prometheus, Grafana"

Contract Output:
## Technology Stack Inventory

**Backend**:
- Python 3.11 (Section 8.1)
- FastAPI 0.104 (Section 8.1)

**Frontend**:
- React 18 (Section 8.2)
- TypeScript 5.0 (Section 8.2)

**Data Layer**:
- PostgreSQL 15.2 (Section 8.3)
- Redis 7.0 (Section 8.3)

**Infrastructure**:
- Docker (Section 8.4)
- Kubernetes 1.28 (Section 8.4)

**Observability**:
- Prometheus (Section 8.5)
- Grafana (Section 8.5)

**Total Technologies**: 9
**Categories**: 5
```

---

### Transformation (Reformatting/Calculation)

**Definition**: Convert, calculate, or reformat data from ARCHITECTURE.md.

**When to Use**:
- Need to calculate derived metrics
- Format doesn't match contract requirement
- Need to present data differently

**Examples**:

**Example 1: Error Budget Calculation**
```
ARCHITECTURE.md Input (Section 10.2, line 1576):
"Service Level Agreement (SLA): 99.99% uptime"

Contract Output:
**Availability SLO**: 99.99%
**Error Budget**: 43.2 minutes/month
**Calculation**: (100% - 99.99%) × 43,200 min/month = 43.2 min
**Quarterly Allowance**: 129.6 minutes/quarter
**Annual Allowance**: 525.6 minutes/year (8.76 hours)

**Source**: ARCHITECTURE.md Section 10.2, line 1576
**Transformation**: Error budget calculated from SLA
```

**Example 2: Capacity Conversion**
```
ARCHITECTURE.md Input (Section 10.1, line 1562):
"Throughput: 450 transactions per second (design capacity)"

Contract Output:
**Design Capacity**: 450 TPS
**Hourly Capacity**: 1,620,000 transactions
**Daily Capacity**: 38,880,000 transactions
**Monthly Capacity**: ~1.2 billion transactions

**Source**: ARCHITECTURE.md Section 10.1, line 1562
**Transformation**: TPS converted to hourly/daily/monthly volumes
```

**Example 3: Data Size Formatting**
```
ARCHITECTURE.md Input (Section 5.3, line 850):
"Database storage: 2048 GB allocated"

Contract Output:
**Allocated Storage**: 2 TB (2,048 GB)
**Current Usage**: [PLACEHOLDER: Add current usage from monitoring]
**Utilization**: [PLACEHOLDER: Calculate usage %]

**Source**: ARCHITECTURE.md Section 5.3, line 850
**Transformation**: GB converted to TB for readability
```

---

### Strict Source Traceability Rules

**Principle**: Every data point in compliance contracts must trace back to actual ARCHITECTURE.md content. No inference, derivation, or guessing is permitted.

**Allowed Extraction Methods:**

1. **Direct Extraction**: Value explicitly stated in ARCHITECTURE.md
   - Example: "RTO: 4 hours" in Section 11.3, line 1842
   - Extract as-is with source reference

2. **Aggregation**: Multiple related values consolidated from different sections
   - Example: Integration catalog from Section 7.1, 7.2, 7.3
   - Source reference includes all sections

3. **Transformation**: Mathematical calculation or format conversion from explicit source data
   - Example: 99.99% SLA → Error budget: (100% - 99.99%) × 43,200 min = 43.2 min/month
   - MUST show: source data + calculation formula + source reference

**Prohibited Actions:**

❌ **NEVER infer values** from context
- Example: Do NOT infer "Tier 1" criticality from 99.99% SLA
- Even if correlation is industry-standard, do not assume

❌ **NEVER derive values** from architectural patterns
- Example: Do NOT derive RTO from SLA percentages
- Even if formula exists, do not apply without explicit source data

❌ **NEVER guess section locations**
- Example: Do NOT cite "Section 10.2" if you didn't read that section
- All section references must be from actual Document Index or section reads

❌ **NEVER create placeholder sections**
- Example: Do NOT suggest "Add Section 12.5" if Section 12 doesn't exist
- Only reference existing ARCHITECTURE.md sections

**Validation Checklist (Before Caching Data):**

For each extracted data point, verify:
1. ✅ Value exists in ARCHITECTURE.md? (If NO → [PLACEHOLDER])
2. ✅ Source section and line number documented?
3. ✅ Extraction type is Direct, Aggregation, or Transformation?
4. ✅ If Transformation: calculation formula shown with source data?
5. ✅ No inference or derivation occurred?

If ANY check fails → Mark as [PLACEHOLDER] with section guidance.

**Missing Data Placeholder Format:**
```markdown
**[Field Name]**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section X.Y]
Optional Reference: [Industry standard or framework guidance - informational only]
Note: Add [specific data point] to ARCHITECTURE.md Section X.Y ([Section Name] → [Subsection Name])
```

**Example Placeholder:**
```markdown
**Business Criticality**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 2.2]
Optional Reference: Industry tiers based on availability - Tier 1: 99.99%+, Tier 2: 99.9%+, Tier 3: 99.5%+
Note: Add business criticality classification to ARCHITECTURE.md Section 2.2 (System Overview → Solution Overview)
```

---

## Best Practices

### Before Generation

**1. Ensure ARCHITECTURE.md is Complete**
```
Checklist:
✓ All 12 sections present
✓ Section 10 (Performance) has SLAs, latency, throughput
✓ Section 11 (Operational) has monitoring, backup, incidents
✓ Section 9 (Security) comprehensive
✓ Section 7 (Integrations) lists all external systems
✓ Metrics are quantified (not "high availability" but "99.99%")
```

**2. Validate Structure**
```
Run architecture-docs skill first:
- Ensures 12-section standard format
- Creates Document Index
- Validates section completeness
- Checks for metric consistency
```

**3. Review Section 11 (Critical for Most Contracts)**
```
Section 11 subsections needed by contracts:
- 11.1 Monitoring → SRE Architecture, Cloud Architecture
- 11.2 Incidents → SRE Architecture
- 11.3 Backup & Recovery → Business Continuity, Cloud Architecture
- 11.4 DR → Business Continuity
- 11.5 Capacity Planning → Platform & IT Infrastructure
```

**4. Check for Quantified Metrics**
```
Replace vague with specific:
❌ "High availability" → ✓ "99.99% SLA"
❌ "Low latency" → ✓ "p95 < 100ms"
❌ "Fast recovery" → ✓ "RTO: 4 hours, RPO: 1 hour"
❌ "Scalable" → ✓ "450 TPS design, 1000 TPS peak"
```

---

### During Generation

**1. Load Incrementally (Context Efficiency)**
```
DO:
- Load Document Index (50 lines)
- Load only required sections per contract
- Use ±10 line buffer
- Average: 400-500 lines per contract

DON'T:
- Load entire ARCHITECTURE.md (2000+ lines)
- Load sections you don't need
- Load same section multiple times (cache instead)
```

**2. Cache Extracted Data**
```
DO:
- Extract once, reuse across contracts
- Store with source references
- Cache common data (project name, SLAs, tech stack)

Example: SLA appears in 6 contracts
- Extract once from Section 10.2
- Cache with source reference
- Reuse in all 6 contracts
```

**3. Preserve Source References**
```
Always include:
- Section number
- Line number(s)
- Extraction type (direct, aggregated, transformed, inferred)

Format: "Section X.Y, line Z" or "Sections X-Y, lines A-B"
```

**4. Flag All Gaps**
```
For any missing data:
- Use [PLACEHOLDER: description]
- Provide guidance on completing
- Reference source section if applicable
- Track for completion report
```

---

### After Generation

**1. Review Placeholders**
```
Process:
1. Read completion report
2. Identify all [PLACEHOLDER] sections
3. Prioritize by contract importance
4. Complete highest-priority placeholders manually
5. Update ARCHITECTURE.md to eliminate placeholders in future
```

**2. Validate Accuracy**
```
Spot-check extraction:
1. Pick 3-5 contracts
2. For each, select 3-5 data points
3. Verify against ARCHITECTURE.md source
4. Check calculations (error budgets, conversions)
5. Validate inferences are reasonable
```

**3. Update Templates**
```
Iterative improvement:
1. Review generated contracts
2. Identify sections that need better structure
3. Update templates with actual organizational formats
4. Regenerate to validate improvements
5. Repeat quarterly
```

**4. Iterate ARCHITECTURE.md**
```
Continuous improvement:
1. Review completion report recommendations
2. Add missing sections to ARCHITECTURE.md
3. Quantify vague metrics
4. Expand operational details
5. Regenerate contracts to reduce placeholders
6. Target: >90% completeness

Example progression:
- Generation 1: 75% complete (40 placeholders)
- Update ARCHITECTURE.md based on recommendations
- Generation 2: 85% complete (23 placeholders)
- Further updates
- Generation 3: 92% complete (12 placeholders)
```

---

## Quality Assurance Checklist

### Before Delivery

For each generated contract:

**Content Completeness**:
- [ ] All required sections present
- [ ] No empty sections (except legitimate gaps)
- [ ] Metadata complete (project, date, version)
- [ ] Source traceability included

**Data Accuracy**:
- [ ] Extracted values match ARCHITECTURE.md
- [ ] Calculations correct (error budgets, conversions)
- [ ] Inferences reasonable and documented
- [ ] Source references accurate

**Formatting**:
- [ ] Markdown properly formatted
- [ ] Tables aligned and complete
- [ ] Lists properly structured
- [ ] Code blocks formatted
- [ ] No broken links

**Placeholders**:
- [ ] All [PLACEHOLDER] markers include descriptions
- [ ] Guidance provided for completing gaps
- [ ] Source sections referenced where applicable
- [ ] Tracked in completion report

**Review Checklist**:
- [ ] Completion report generated
- [ ] Manifest updated
- [ ] Recommendations documented
- [ ] Next steps clear

---

## Troubleshooting Guide

### Issue: ARCHITECTURE.md Not Found

**Symptoms**: Skill cannot locate ARCHITECTURE.md

**Solutions**:
1. Check current directory: `ls ARCHITECTURE.md`
2. Check parent directory: `ls ../ARCHITECTURE.md`
3. Check docs directory: `ls docs/ARCHITECTURE.md`
4. Ask user for file location
5. Suggest creating with architecture-docs skill

---

### Issue: Invalid Structure

**Symptoms**: ARCHITECTURE.md doesn't follow 12-section format

**Solutions**:
1. Run architecture-docs skill to validate structure
2. Check for Document Index in first 50 lines
3. Verify all 12 sections present and numbered
4. Suggest restructuring to standard format

---

### Issue: High Placeholder Count

**Symptoms**: >50% placeholders in generated contracts

**Root Causes**:
- ARCHITECTURE.md incomplete
- Sections missing or empty
- Vague metrics (qualitative vs. quantitative)

**Solutions**:
1. Review completion report recommendations
2. Expand ARCHITECTURE.md Section 11 (Operational)
3. Add quantified metrics to Section 10 (Performance)
4. Complete Section 9 (Security) details
5. Regenerate after improvements

---

### Issue: Template Not Found

**Symptoms**: Template file missing for contract type

**Solutions**:
1. Check templates directory exists
2. Verify template filename matches expected pattern
3. Offer user options:
   - Use basic placeholder structure
   - Provide template now
   - Skip this contract
4. Continue with other contracts

---

### Issue: Extraction Errors

**Symptoms**: Incorrect data extracted or missing expected values

**Root Causes**:
- Data format doesn't match expected pattern
- Section structure differs from standard
- Typos or inconsistencies in ARCHITECTURE.md

**Solutions**:
1. Review ARCHITECTURE.md section structure
2. Check for format variations
3. Update extraction patterns if needed
4. Use [PLACEHOLDER] if extraction impossible
5. Flag in completion report

---

## Integration with Architecture Workflow

### Complete Workflow

**Phase 1: Business Requirements**
```
Stakeholder: Product Owner
Skill: architecture-readiness
Output: PRODUCT_OWNER_SPEC.md

Purpose: Document business context, user needs, success criteria
```

**Phase 2: Technical Architecture**
```
Stakeholder: Architecture Team
Skill: architecture-docs
Input: PRODUCT_OWNER_SPEC.md (optional reference)
Output: ARCHITECTURE.md

Purpose: Define technical architecture, design decisions, components
```

**Phase 3: Compliance Documentation**
```
Stakeholder: Compliance Team
Skill: architecture-compliance
Input: ARCHITECTURE.md (required)
Output: 10 compliance contracts

Purpose: Generate compliance documents, ensure standards adherence
```

### Workflow Integration Points

**From architecture-readiness to architecture-compliance**:
- Business context informs compliance contracts
- Success criteria map to compliance requirements
- Stakeholder list feeds into contract ownership

**From architecture-docs to architecture-compliance**:
- ARCHITECTURE.md is primary data source
- Document Index enables context-efficient loading
- 12-section structure ensures complete coverage
- Metrics consistency checked across contracts

**Feedback Loop**:
```
ARCHITECTURE.md (incomplete)
  ↓
Generate compliance contracts
  ↓
Identify gaps (40 placeholders)
  ↓
Completion report recommendations
  ↓
Update ARCHITECTURE.md
  ↓
Regenerate compliance contracts
  ↓
Reduced gaps (23 placeholders)
  ↓
Iterate until >90% complete
```

---

## Conclusion

This guide provides comprehensive methodology for generating compliance documentation from ARCHITECTURE.md, ensuring:

- **Automation**: 10 contracts generated from single source
- **Efficiency**: 70-80% context reduction through incremental loading
- **Traceability**: Full source references for audit trail
- **Quality**: Standardized templates and validation
- **Continuous Improvement**: Iterative refinement through feedback

For detailed section mappings and contract-specific extraction patterns, refer to **SECTION_MAPPING_GUIDE.md**.

For template structures and placeholder conventions, refer to files in the **templates/** directory.

For organizational contract requirements and standards, refer to **contracts/CONTRACT_TYPES_REFERENCE.md**.

---

## Edge Case Handling for Automatic Stack Validation

### Overview

Automatic stack validation (Step 3.5) must handle various edge cases gracefully to ensure robust document generation across different architecture patterns. This section documents 7 critical edge cases and their handling strategies.

### Edge Case 1: Backend-Only Architecture (No Frontend)

**Scenario**: Architecture has backend components (Java or .NET) but no frontend framework.

**Example ARCHITECTURE.md Section 8**:
```
### 8.1 Backend Stack
- Language: Java 17
- Framework: Spring Boot 3.2
- Build Tool: Maven 3.9

### 8.2 Deployment
- Containers: Docker 24+, AKS 1.28+
```

**Detection**:
- LLM analyzes Section 8 for frontend keywords: React, Angular, Vue, TypeScript, JavaScript, NPM, Yarn, Webpack
- No frontend framework detected → `architecture_pattern: "backend-only"`

**Validation Behavior**:
- **Java Backend (6 items)**: Evaluate all 6 items → Mix of PASS/FAIL/UNKNOWN expected
- **.NET Backend (6 items)**: All N/A (if no .NET detected)
- **Frontend (6 items)**: All N/A with reasoning "No frontend (backend-only architecture)"
- **Other Stacks (5 items)**: Evaluate databases, IaC, CI/CD → Mix of PASS/FAIL/UNKNOWN
- **Exceptions (3 items)**: Evaluate normally

**Expected Output**:
```
#### Frontend (6 items): All N/A

- ⚪ No frontend (backend-only architecture)
- ⚪ No frontend (backend-only architecture)
- ⚪ No frontend (backend-only architecture)
- ⚪ No frontend (backend-only architecture)
- ⚪ No frontend (backend-only architecture)
- ⚪ No frontend (backend-only architecture)
```

**Overall Status**: Can be PASS if backend stack complies

---

### Edge Case 2: Full-Stack Architecture (Java Backend + React Frontend)

**Scenario**: Architecture has both backend and frontend components.

**Example ARCHITECTURE.md Section 8**:
```
### 8.1 Backend Stack
- Language: Java 17
- Framework: Spring Boot 3.2

### 8.2 Frontend Stack
- Framework: React 18
- Language: TypeScript 5.0
- Build Tool: Webpack 5, NPM 9
```

**Detection**:
- Backend detected: Java 17 + Spring Boot 3.2
- Frontend detected: React 18 + TypeScript
- `architecture_pattern: "full-stack"`

**Validation Behavior**:
- **Java Backend (6 items)**: Evaluate all 6 items
- **.NET Backend (6 items)**: All N/A (no .NET)
- **Frontend (6 items)**: Evaluate all 6 items
- **Other Stacks (5 items)**: Evaluate all 5 items
- **Exceptions (3 items)**: Evaluate all 3 items

**Expected Validation Coverage**: ~15-18 applicable items (6 Java + 6 Frontend + 3-5 Other Stacks + 1-2 Exceptions)

**Overall Status**: PASS only if all applicable items PASS (both backend and frontend compliant)

---

### Edge Case 3: Polyglot Backend (Java + .NET)

**Scenario**: Architecture uses both Java and .NET backends (microservices, migration scenario).

**Example ARCHITECTURE.md Section 8**:
```
### 8.1 Backend Stack (Microservices)
- Service A: Java 17 + Spring Boot 3.2
- Service B: .NET 7 + ASP.NET Core
```

**Detection**:
- LLM detects both Java and .NET keywords
- `backend_type: "polyglot"`, `backend_languages: ["java", "dotnet"]`

**Validation Behavior**:
- **Java Backend (6 items)**: Evaluate all 6 items (for Service A)
- **.NET Backend (6 items)**: Evaluate all 6 items (for Service B)
- **Frontend (6 items)**: Evaluate or mark N/A based on frontend presence
- **Other Stacks (5 items)**: Evaluate all 5 items
- **Exceptions (3 items)**: Evaluate all 3 items

**Special Handling**:
- Items 1-4 (language/framework/tools/containers): Evaluate separately for each backend
- Item 5 (approved libraries): Combine library lists from both backends
- Item 6 (naming conventions): Apply to both backends

**Expected Validation Coverage**: ~17-20 applicable items (6 Java + 6 .NET + 3-5 Other + 1-2 Exceptions)

**Overall Status**: PASS only if both Java AND .NET stacks comply

**Example Output**:
```
#### Java Backend (6 items): 5 PASS, 1 UNKNOWN

- ✅ Is Java in a supported version? (Java 17 LTS - Service A)
- ✅ Is Spring Boot in a supported version? (Spring Boot 3.2 - Service A)
...

#### .NET Backend (6 items): 6 PASS

- ✅ Is C# in a supported version? (.NET 7 - Service B)
- ✅ Is ASP.NET Core in a supported version? (ASP.NET Core 7 - Service B)
...
```

---

### Edge Case 4: Section 8 Missing or Empty

**Scenario**: ARCHITECTURE.md has no Section 8 or Section 8 exists but is empty/placeholder.

**Example ARCHITECTURE.md**:
```
## Section 8: Technology Stack

[To be documented]
```

**Detection**:
- Section 8 not found in document index
- OR Section 8 found but content < 50 characters
- OR Section 8 contains only placeholder text ("TBD", "To be documented", etc.)

**Validation Behavior**:
- **Cannot perform automatic validation**
- Skip Step 3.5 entirely
- Cache validation results as "NOT_PERFORMED"

**Document Output**:
```
### 1.6 Stack Validation Checklist Compliance (Automatic Validation)

**Validation Status**: ⚠️ **NOT PERFORMED** (Section 8 Missing)
**Validation Date**: Not performed
**Validation Evaluator**: N/A

**Error**: ARCHITECTURE.md Section 8 (Technology Stack) not found or empty. Automatic stack validation cannot be performed without technology stack documentation.

**Required Action**:
1. Add Section 8 (Technology Stack) to ARCHITECTURE.md
2. Document all technology components: backend language/framework, frontend framework (if applicable), databases, containers, IaC tools, CI/CD platforms
3. Include version numbers for all technologies
4. Regenerate compliance document after Section 8 is complete

**Manual Fallback**: Complete STACK_VALIDATION_CHECKLIST.md manually until Section 8 is documented.

**Contract Status**: Draft (BLOCKED - validation required for approval)
```

**Overall Status**: FAIL (blocks approval)

**Completion Report Entry**:
```
[CRITICAL] Section 8 (Technology Stack) missing or empty. Add detailed technology stack documentation including:
- Backend: Language, framework, build tools, testing frameworks, libraries
- Frontend (if applicable): Framework, language, build tools, testing frameworks
- Infrastructure: Containers, orchestration, databases
- Automation: IaC tools, CI/CD platforms
Priority: CRITICAL (blocks compliance document approval)
```

---

### Edge Case 5: Partial Section 8 (Incomplete Data)

**Scenario**: Section 8 exists with some content but missing critical details (versions, tools, libraries).

**Example ARCHITECTURE.md Section 8**:
```
### 8.1 Backend Stack
- Language: Java (version not specified)
- Framework: Spring Boot

### 8.2 Infrastructure
- Containers: Docker, Kubernetes
```

**Detection**:
- Section 8 found and has content
- LLM detects missing version numbers, incomplete tool lists, or vague descriptions

**Validation Behavior**:
- Perform validation with available data
- Mark items as UNKNOWN where data is insufficient
- Collect detailed recommendations for missing data

**Example Validation Results**:
```
#### Java Backend (6 items): 2 PASS, 4 UNKNOWN

- ❓ Is Java in a supported version? (Java version not specified in Section 8)
- ❓ Is Spring Boot in a supported version? (Spring Boot version not specified)
- ❓ Are official tools used? (Build tools not documented)
- ❓ Is deployment in authorized containers? (Docker/Kubernetes versions not specified)
- ⚪ Are only approved libraries used? (No library inventory documented - N/A)
- ❓ Does naming follow standards? (Not documented)
```

**Overall Status**: FAIL (4+ UNKNOWN items triggers FAIL status)

**Recommendations**:
```
**Recommendations**:
1. **Specify Java version**: Document exact Java version (e.g., Java 17 LTS) in Section 8.1 (Java Backend Item 1)
2. **Specify Spring Boot version**: Document Spring Boot version (e.g., 3.2) in Section 8.1 (Java Backend Item 2)
3. **Document build tools**: Add Maven/Gradle version to Section 8.1 (Java Backend Item 3)
4. **Specify container versions**: Add Docker version and Kubernetes variant (AKS/EKS/GKE) with version in Section 8.2 (Java Backend Item 4)
5. **Create library inventory**: List all third-party libraries used in Section 8.1 (Java Backend Item 5)
6. **Document naming conventions**: Add repository and resource naming standards to Section 8 (Java Backend Item 6)
```

**Completion Report Entry**:
```
[HIGH] Section 8 (Technology Stack) incomplete. Missing version numbers and detailed specifications.
Add: Java version, Spring Boot version, Docker version, Kubernetes variant/version, build tools, library inventory
Priority: HIGH (4 UNKNOWN items block approval)
```

---

### Edge Case 6: Deprecated Technology Versions Detected

**Scenario**: Section 8 documents technology versions that are deprecated or EOL.

**Example ARCHITECTURE.md Section 8**:
```
### 8.1 Backend Stack
- Language: Java 8
- Framework: Spring Boot 2.3
- Build Tool: Maven 3.6

### 8.2 Frontend Stack
- Framework: Angular 11
- Language: JavaScript ES5
```

**Detection**:
- LLM compares versions against authorized catalog
- Detects: Java 8 (EOL since 2022), Spring Boot 2.3 (EOL), Angular 11 (deprecated), JavaScript ES5 (deprecated)

**Validation Behavior**:
- Mark deprecated items as FAIL
- Collect all deprecated technologies in `deviations` array
- Provide specific remediation recommendations

**Example Validation Results**:
```
#### Java Backend (6 items): 1 PASS, 3 FAIL, 2 UNKNOWN

- ❌ Is Java in a supported version? (Java 8 detected - DEPRECATED/EOL since 2022 - Section 8.1, line 952)
- ❌ Is Spring Boot in a supported version? (Spring Boot 2.3 detected - EOL - Section 8.1, line 953)
- ✅ Are official tools used? (Maven 3.6 - Section 8.1, line 954)
- ❓ Is deployment in authorized containers? (Not documented)
- ❓ Are only approved libraries used? (Library inventory not documented)
- ❓ Does naming follow standards? (Not documented)

#### Frontend (6 items): 2 FAIL, 4 PASS

- ❌ Is frontend framework in supported version? (Angular 11 detected - deprecated, upgrade to v12+ - Section 8.2, line 960)
- ❌ Is frontend language current? (JavaScript ES5 detected - deprecated, upgrade to ES6+ or TypeScript - Section 8.2, line 961)
...
```

**Overall Status**: FAIL (4 FAIL items)

**Stack Deviations**:
```
**Stack Deviations**:
1. **Java 8 (DEPRECATED/EOL)**: Detected in Section 8.1, line 952. Java 8 reached EOL in March 2022 and no longer receives security updates. CRITICAL security risk.
   - **Remediation**: Migrate to Java 17 LTS (recommended) or Java 11 LTS (minimum)
   - **Priority**: CRITICAL
   - **Action Required**: Create ADR in Section 12 documenting migration plan with timeline

2. **Spring Boot 2.3 (EOL)**: Detected in Section 8.1, line 953. No longer supported.
   - **Remediation**: Upgrade to Spring Boot 3.2 (current LTS)
   - **Priority**: HIGH
   - **Action Required**: Document upgrade plan in LADES2

3. **Angular 11 (Deprecated)**: Detected in Section 8.2, line 960. Version < v12 not authorized.
   - **Remediation**: Upgrade to Angular 17+ (current)
   - **Priority**: MEDIUM
   - **Action Required**: Plan frontend framework upgrade

4. **JavaScript ES5 (Deprecated)**: Detected in Section 8.2, line 961. ES6+ or TypeScript required.
   - **Remediation**: Migrate to TypeScript 5.0+ or JavaScript ES6+
   - **Priority**: MEDIUM
```

**Recommendations**:
```
**Recommendations**:
1. **CRITICAL: Upgrade Java to LTS version**: Migrate from Java 8 to Java 17 LTS immediately due to security EOL (Java Backend Item 1)
2. **HIGH: Upgrade Spring Boot**: Migrate from Spring Boot 2.3 to 3.2 LTS (Java Backend Item 2)
3. **MEDIUM: Upgrade Angular**: Migrate from Angular 11 to Angular 17+ (Frontend Item 1)
4. **MEDIUM: Modernize JavaScript**: Migrate from ES5 to TypeScript 5.0+ or ES6+ (Frontend Item 2)
```

**LADES2 Integration**:
- All 4 deviations automatically populate LADES2.1 (Stack Deviation Identification)
- Require exception documentation in LADES2.2 if immediate upgrade not feasible
- Require action plan with timeline in LADES2.3

**Contract Status**: Draft (BLOCKED until deprecated technologies addressed or exception approved)

---

### Edge Case 7: Unapproved Technology Detected

**Scenario**: Section 8 documents technologies not in the authorized catalog.

**Example ARCHITECTURE.md Section 8**:
```
### 8.1 Backend Stack
- Language: Python 3.11
- Framework: Django 4.2
- Database: CouchDB 3.3

### 8.2 Frontend Stack
- Framework: Svelte 4.0
- State Management: MobX 6.0
```

**Detection**:
- LLM compares technologies against authorized catalog
- Detects unapproved: Python (not in Java/.NET catalog), Django, CouchDB (not in authorized databases), Svelte (not in React/Angular/Vue), MobX (unapproved library)

**Validation Behavior**:
- Mark unapproved items as FAIL
- Collect all unapproved technologies in `deviations` array
- Distinguish between: (a) completely unapproved stack, (b) unapproved library in approved stack

**Case 7a: Completely Unapproved Stack (Python/Django)**

**Example Validation Results**:
```
#### Java Backend (6 items): All N/A

- ⚪ No Java detected (Python backend used - not in authorized stack)
...

#### .NET Backend (6 items): All N/A

- ⚪ No .NET detected (Python backend used - not in authorized stack)
...

#### Frontend (6 items): 1 FAIL, 5 N/A

- ❌ Is frontend framework approved? (Svelte 4.0 detected - NOT in authorized catalog [React/Angular/Vue])
...

#### Other Stacks (5 items): 1 FAIL, 4 PASS/UNKNOWN

- ✅ Is automation aligned? (Python 3.11 detected - authorized for automation/scripting only)
- ✅ Is IaC approved? (N/A or evaluated separately)
- ❌ Are databases authorized? (CouchDB 3.3 detected - NOT in authorized catalog [PostgreSQL/SQL Server/Oracle/MongoDB])
...
```

**Overall Status**: FAIL

**Stack Deviations**:
```
**Stack Deviations**:
1. **Python/Django Backend (UNAPPROVED)**: Detected in Section 8.1. Python is authorized for automation/scripting only, NOT for backend application development. Authorized backend stacks: Java 11/17 + Spring Boot OR .NET 6/7 + ASP.NET Core.
   - **Remediation**: Migrate to Java 17 + Spring Boot 3.2 OR .NET 7 + ASP.NET Core
   - **Exception Required**: If business justification exists, document ADR in Section 12 and request chapter approval
   - **Priority**: CRITICAL (fundamental stack misalignment)

2. **Svelte Frontend (UNAPPROVED)**: Detected in Section 8.2. Svelte not in authorized frontend catalog. Authorized frameworks: Angular v12+, React v17+, Vue.js v3+.
   - **Remediation**: Migrate to React 18, Angular 17, or Vue 3
   - **Exception Required**: Document technical justification and request approval
   - **Priority**: HIGH

3. **CouchDB Database (UNAPPROVED)**: Detected in Section 8.2. CouchDB not in authorized database catalog. Authorized: PostgreSQL, SQL Server, Oracle, MongoDB.
   - **Remediation**: Migrate to MongoDB (closest NoSQL alternative) or PostgreSQL
   - **Exception Required**: If CouchDB features are critical, document requirements and request approval
   - **Priority**: HIGH
```

**Recommendations**:
```
**Recommendations**:
1. **CRITICAL: Replace unapproved backend stack**: Python/Django not authorized for backend. Migrate to Java 17 + Spring Boot 3.2 or .NET 7 + ASP.NET Core. If migration not feasible, create ADR documenting business justification and submit for chapter exception approval.

2. **HIGH: Replace unapproved frontend framework**: Svelte not authorized. Migrate to React 18, Angular 17, or Vue.js 3. If Svelte features are critical, document in ADR and request exception.

3. **HIGH: Replace unapproved database**: CouchDB not authorized. Migrate to MongoDB (NoSQL) or PostgreSQL (relational). If CouchDB required, document use case and request exception.
```

**Case 7b: Unapproved Library in Approved Stack**

**Example**: Java 17 + Spring Boot 3.2 (approved), but uses unapproved library "Lodash" (JavaScript library inappropriately used in Java backend)

**Example Validation Results**:
```
#### Java Backend (6 items): 4 PASS, 1 FAIL, 1 UNKNOWN

- ✅ Is Java in a supported version? (Java 17 LTS)
- ✅ Is Spring Boot in a supported version? (Spring Boot 3.2)
- ✅ Are official tools used? (Maven, JUnit, SonarQube)
- ✅ Is deployment in authorized containers? (Docker, AKS)
- ❌ Are only approved libraries used? (Lodash detected - unapproved JavaScript library - Section 8.1, line 957)
- ❓ Does naming follow standards? (Not documented)
```

**Overall Status**: FAIL (1 FAIL item)

**Stack Deviations**:
```
**Stack Deviations**:
1. **Unapproved Library: Lodash**: Detected in Section 8.1, line 957. Lodash is a JavaScript utility library and not appropriate for Java backend. May indicate inappropriate dependency or documentation error.
   - **Remediation**: If Lodash is used, replace with Apache Commons Lang or Guava (Java equivalents). If documentation error, remove from Section 8.
   - **Exception Path**: If Lodash is genuinely required (e.g., for Node.js tooling), document usage context and request chapter approval.
   - **Priority**: MEDIUM
```

**LADES2 Integration**:
- All unapproved technologies populate LADES2.1 (Stack Deviation Identification)
- LADES2.2 (Exception Documentation): Require ADR for each unapproved technology
  - ADR must include: business justification, technical rationale, alternatives considered, risk assessment, migration plan (if temporary exception)
- LADES2.3 (Remediation Action Plans): If exception denied or temporary, document migration plan with timeline

**Contract Status**: Draft (BLOCKED until technologies approved or migrated)

**Escalation Path**:
1. Product Owner + Solution Architect review deviations
2. If business justification exists: Create ADR, submit to Architecture Review Board
3. If approved: Document exception in LADES2, contract status → "In Review (Exception Approved)"
4. If denied: Mandatory migration to authorized stack before contract approval

---

### Edge Case Handling Summary

| Edge Case | Detection Method | Validation Behavior | Overall Status | Approval Impact |
|-----------|-----------------|---------------------|----------------|-----------------|
| 1. Backend-Only | No frontend keywords | Frontend items → N/A | Can be PASS | None (if backend compliant) |
| 2. Full-Stack | Backend + frontend detected | Evaluate both stacks | PASS if all comply | None (if all compliant) |
| 3. Polyglot Backend | Multiple backend languages | Evaluate all backends | PASS if all comply | None (if all compliant) |
| 4. Section 8 Missing | Section not found or <50 chars | Skip validation entirely | FAIL | BLOCKS approval |
| 5. Partial Section 8 | Missing versions/details | Mark items UNKNOWN | FAIL (if 4+ UNKNOWN) | BLOCKS approval |
| 6. Deprecated Versions | Version comparison vs catalog | Mark deprecated as FAIL | FAIL | BLOCKS until upgrade/exception |
| 7. Unapproved Technology | Technology not in catalog | Mark unapproved as FAIL | FAIL | BLOCKS until migration/exception |

**Critical Success Factors**:
1. **LLM Accuracy**: Validation quality depends on LLM's ability to accurately detect stack type, versions, and deviations
2. **Catalog Currency**: Authorized technology catalog must be kept current (update quarterly)
3. **Clear Remediation**: Recommendations must provide specific, actionable guidance
4. **Exception Process**: Well-defined path for legitimate deviations (LADES2 integration)
5. **Fail-Safe Design**: When in doubt, mark as UNKNOWN rather than incorrect PASS/FAIL

**Testing Requirements**:
- Test each edge case with representative ARCHITECTURE.md samples
- Verify correct status assignment (PASS/FAIL/N/A/UNKNOWN)
- Validate deviations array population
- Confirm recommendations quality
- Ensure LADES2 integration for deviations

For edge case testing scenarios, see Phase 4 test cases below.
