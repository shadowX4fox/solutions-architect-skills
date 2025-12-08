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

- **Automated Compliance**: Generate 11 compliance documents from one source
- **Gap Detection**: Identify missing requirements in ARCHITECTURE.md
- **Continuous Alignment**: Regenerate after architecture changes
- **Audit Trail**: Full source traceability for every data point
- **Quality Assurance**: Standardized templates and validation

---

## Document Types (11 Compliance Contracts)

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

**Purpose**: Define guidelines for site reliability, observability, and operational excellence to ensure solution resilience and performance.

**Stakeholders**:
- SRE team
- DevOps team
- Platform engineering
- On-call engineers

**Key Content Requirements**:
- **Service Level Objectives (SLOs)**: Availability, latency, throughput, error rate targets
- **Service Level Indicators (SLIs)**: Metrics to measure SLOs
- **Error Budgets**: Calculated from SLOs, downtime allowances
- **Monitoring & Observability**: Tools, metrics, dashboards, alerting
- **Incident Management**: Response procedures, escalation, postmortems
- **Capacity Planning**: Growth projections, scaling triggers
- **On-Call**: Rotation schedules, runbooks, escalation paths

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 10 (Performance Requirements) - 50% of content
    - 10.1: Performance Metrics
    - 10.2: Availability SLAs
  - Section 11 (Operational Considerations) - 40% of content
    - 11.1: Monitoring and Logging
    - 11.2: Incident Management
- **Secondary**: Section 5 (System Components) - 10% of content
  - Component-level reliability requirements

**Example Guidelines**:
- All services must define availability SLOs (minimum 99.9%)
- Error budgets must be calculated and tracked monthly
- Monitoring must include metrics, logs, and traces (observability triad)
- Incident response time: P1 < 15min, P2 < 1hr, P3 < 4hr
- Postmortems required for all P1/P2 incidents
- Runbooks must exist for all operational procedures

**Template Priority**: High (Template #1 - serves as reference pattern)

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

**Purpose**: Define guidelines for data management, analytics, and artificial intelligence including data quality, governance, and AI model lifecycle.

**Stakeholders**:
- Data architects
- Data engineers
- Data scientists
- ML engineers
- Data governance team

**Key Content Requirements**:
- **Data Quality**: Validation, cleansing, accuracy, completeness
- **Data Governance**: Ownership, lineage, cataloging, metadata
- **Data Lifecycle**: Ingestion, storage, processing, retention, archival
- **Analytics**: BI tools, reporting, data visualization
- **AI/ML Models**: Training, deployment, monitoring, retraining
- **Data Security**: Encryption, masking, access controls, PII handling
- **Compliance**: GDPR, regulatory requirements, data residency
- **Scalability**: Data volume growth, processing capacity

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 5 (System Components) - 30% of content
    - Data storage components, ML models
  - Section 6 (Data Flow) - 30% of content
    - Data pipelines, transformations
  - Section 7 (Integration Points) - 20% of content
    - Data sources, sinks
- **Secondary**:
  - Section 8 (Technology Stack) - 10% of content
    - Data technologies
  - Section 10 (Performance Requirements) - 10% of content
    - Data processing SLAs

**Example Guidelines**:
- Data quality metrics must be defined and monitored
- Data lineage must be tracked from source to consumption
- PII data must be encrypted and masked appropriately
- AI models must have defined retraining schedules
- Data retention policies must comply with regulations
- Data scalability must handle 3x growth without redesign

**Template Priority**: Medium (Template #4)

---

### 5. Development Architecture (Development Architecture)

**Purpose**: Define guidelines for software development including technology stack, development practices, and technical debt management.

**Stakeholders**:
- Development teams
- Tech leads
- Engineering managers
- DevOps team

**Key Content Requirements**:
- **Technology Stack**: Languages, frameworks, libraries, versions
- **Development Practices**: Coding standards, code reviews, testing
- **Technical Debt**: Tracking, prioritization, remediation plans
- **Exception Plans**: Handling deviations from standards
- **Development Environment**: Local setup, CI/CD, testing environments
- **Code Quality**: Static analysis, test coverage, quality gates
- **Dependency Management**: Package management, vulnerability scanning

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 3 (Architecture Patterns) - 25% of content
    - Design patterns, architectural style
  - Section 5 (System Components) - 25% of content
    - Component design, interfaces
  - Section 8 (Technology Stack) - 30% of content
    - Technologies used
  - Section 12 (Architecture Decision Records) - 10% of content
    - Technology choices
- **Secondary**:
  - Section 11 (Operational Considerations) - 10% of content
    - Deployment, CI/CD

**Example Guidelines**:
- Technology stack must use supported, non-deprecated versions
- Code coverage minimum: 80% for critical paths
- All code changes require peer review
- Technical debt must be tracked and addressed quarterly
- Dependency vulnerabilities must be patched within SLA
- Exception plans required for non-standard technology choices

**Automatic Stack Validation**: This contract includes automatic validation of the technology stack against a 26-item checklist during document generation. Validation evaluates Java Backend (6 items), .NET Backend (6 items), Frontend (6 items), Other Stacks (5 items), and Exceptions (3 items). Results are embedded in the document with PASS (approval unblocked) or FAIL (approval blocked) status. See Step 3.5 for validation methodology.

**Template Priority**: Medium (Template #5)

---

### 6. Process Transformation and Automation

**Purpose**: Define guidelines for process automation, efficiency improvements, and digital transformation initiatives.

**Stakeholders**:
- Process improvement team
- Automation engineers
- Business analysts
- Digital transformation office

**Key Content Requirements**:
- **Automation Opportunities**: Processes to automate, ROI analysis
- **Automation Best Practices**: Tools, frameworks, patterns
- **Impact Analysis**: Efficiency gains, cost reduction, time savings
- **License Efficiency**: Software licensing optimization
- **Capability Reuse**: Shared services, reusable components
- **Document Management**: Automated workflows, approvals
- **Change Management**: Rollout strategy, training, adoption

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 1 (System Overview) - 25% of content
    - Automation scope and objectives
  - Section 2 (Business Context) - 25% of content
    - Business process context
  - Section 6 (Data Flow) - 25% of content
    - Automated workflows
- **Secondary**:
  - Section 5 (System Components) - 15% of content
    - Automation components
  - Section 7 (Integration Points) - 10% of content
    - Integration with existing systems

**Example Guidelines**:
- Manual processes > 10 hours/month should be evaluated for automation
- Automation ROI must be positive within 12 months
- Reusable capabilities must be designed as shared services
- License costs must be optimized (concurrent vs. named users)
- Process automation must include error handling and monitoring
- Impact analysis required before process changes

**Template Priority**: Low (Template #6)

---

### 7. Security Architecture (Security Architecture)

**Purpose**: Define guidelines for security including API security, authentication, encryption, and secure communication.

**Stakeholders**:
- Security architects
- Security operations (SecOps)
- Application security team
- Compliance team

**Key Content Requirements**:
- **API Security**: Authentication, authorization, rate limiting, API gateway
- **Authentication**: Methods (OAuth, SAML, JWT), MFA, SSO
- **Encryption**: Data at rest, data in transit, key management
- **Communication Security**: Intra-service, inter-service, external
- **Access Controls**: RBAC, ABAC, least privilege
- **Security Monitoring**: SIEM, intrusion detection, audit logging
- **Vulnerability Management**: Scanning, patching, remediation
- **Compliance**: Standards (ISO 27001, SOC 2, etc.)

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 9 (Security Considerations) - 70% of content
    - All security subsections
- **Secondary**:
  - Section 7 (Integration Points) - 20% of content
    - Integration security
  - Section 11 (Operational Considerations) - 10% of content
    - Security monitoring

**Example Guidelines**:
- All APIs must require authentication and authorization
- Encryption required: TLS 1.3 for transit, AES-256 for rest
- Secrets must never be stored in code or configuration files
- Microservice communication must use mutual TLS (mTLS)
- Security vulnerabilities: Critical < 24hr, High < 7 days
- All authentication events must be logged and monitored

**Template Priority**: High (Template #3)

---

### 8. Platform & IT Infrastructure

**Purpose**: Define guidelines for platform design, infrastructure deployment, and operational environments.

**Stakeholders**:
- Platform engineers
- Infrastructure team
- Database administrators
- Operations team

**Key Content Requirements**:
- **Production Environments**: Number, purpose, isolation
- **Operating Systems**: Authorized OS, versions, patching
- **Database Platforms**: RDBMS, NoSQL, capacity planning
- **Capacity & Retention**: Storage, compute, retention policies
- **Naming Conventions**: Resources, environments, components
- **Transactional Dimensioning**: TPS capacity, scaling limits
- **Infrastructure as Code**: Terraform, CloudFormation, Ansible

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 4 (Deployment Architecture) - 35% of content
    - Environments, infrastructure
  - Section 8 (Technology Stack) - 35% of content
    - Platform technologies
  - Section 11 (Operational Considerations) - 20% of content
    - Operations, maintenance
- **Secondary**:
  - Section 10 (Performance Requirements) - 10% of content
    - Capacity requirements

**Example Guidelines**:
- Production environments must be isolated (network, IAM)
- Only authorized OS versions may be used (security patches current)
- Database capacity must support 3x current transaction volume
- Retention policies must comply with regulatory requirements
- Naming conventions must be consistent and documented
- Infrastructure must be defined as code (IaC)

**Template Priority**: Medium (Template #8)

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

### 10. Integration Architecture

**Purpose**: Define guidelines for integration of microservices, APIs, and event-driven systems ensuring security, standards compliance, and best practices.

**Stakeholders**:
- Integration architects
- API platform team
- Microservices teams
- Enterprise integration team

**Key Content Requirements**:
- **Integration Catalog**: All external systems, APIs, protocols
- **Integration Patterns**: REST, SOAP, messaging, events, batch
- **Best Practices**: API design, versioning, error handling
- **Security**: Authentication, authorization, encryption for integrations
- **Obsolete Technologies**: Avoidance of deprecated protocols/standards
- **Traceability & Auditing**: Integration logging, correlation IDs
- **Standards Compliance**: OpenAPI, AsyncAPI, integration standards

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 7 (Integration Points) - 50% of content
    - All integration details
- **Secondary**:
  - Section 5 (System Components) - 20% of content
    - Integration components (API gateway, message brokers)
  - Section 6 (Data Flow) - 20% of content
    - Integration flows
  - Section 8 (Technology Stack) - 10% of content
    - Integration technologies

**Example Guidelines**:
- All integrations must be cataloged and documented
- REST APIs must follow OpenAPI 3.0 specification
- Asynchronous integrations must use event-driven patterns
- Integration security: OAuth 2.0, mutual TLS, API keys
- Avoid obsolete protocols (SOAP 1.1, XML-RPC, etc.)
- All integrations must include correlation IDs for tracing
- API versioning strategy must be consistent (URI vs. header)

**Template Priority**: Medium (Template #10)

---

### 11. Risk Management

**Purpose**: Define and manage risks associated with the architecture including technical, security, operational, and business risks.

**Stakeholders**:
- Risk management team
- Security team
- Compliance team
- Executive leadership

**Key Content Requirements**:
- **Risk Identification**: Technical, security, operational, business risks
- **Risk Assessment**: Likelihood (1-5), Impact (1-5), Risk Score (L×I)
- **Risk Classification**: Critical (20-25), High (15-19), Medium (8-14), Low (1-7)
- **Mitigation Strategies**: Controls, action plans, ownership
- **Residual Risk**: Risk after mitigation
- **Risk Monitoring**: KRIs (Key Risk Indicators), review frequency
- **Contingency Plans**: Actions if risks materialize

**Source Sections from ARCHITECTURE.md**:
- **Primary**:
  - Section 9 (Security Considerations) - 30% of content
    - Security risks
  - Section 10 (Performance Requirements) - 20% of content
    - Performance risks
  - Section 11 (Operational Considerations) - 30% of content
    - Operational risks
  - Section 12 (Architecture Decision Records) - 10% of content
    - Decision risks/trade-offs
- **Secondary**:
  - Section 1 (System Overview) - 5% of content
    - Business risks
  - Section 5 (System Components) - 5% of content
    - Technical risks

**Example Guidelines**:
- All identified risks must have mitigation strategies
- Critical and High risks require executive approval
- Risk assessment must be reviewed quarterly
- Residual risk must be within acceptable tolerance
- Key Risk Indicators (KRIs) must be monitored continuously
- Contingency plans required for all Critical risks

**Template Priority**: High (Template #4)

**Note**: This contract uses a custom organizational format that will be provided by the user incrementally.

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
- Select all 11 contract types
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
- "security" → Security Architecture, Risk Management
- "cloud" → Cloud Architecture, Plataformas Infraestructura
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
✓ Security Architecture          (92% complete, 1 placeholder)
✓ Platform & IT Infrastructure   (85% complete, 3 placeholders)
✓ Enterprise Architecture        (78% complete, 4 placeholders)
✓ Integration Architecture     (82% complete, 3 placeholders)
✓ Risk Management                 (65% complete, 7 placeholders)

Overall Statistics:
- Average Completeness: 81%
- Total Placeholders: 40
- Context Efficiency: 75% reduction (avg 450 lines loaded per contract vs 2100 total)
- Processing Time: ~8 minutes (all 11 contracts)

Files Created:
- /compliance-docs/COMPLIANCE_MANIFEST.md
- /compliance-docs/CONTINUIDAD_NEGOCIO_JobSchedulingPlatform_2025-11-26.md
- /compliance-docs/ARQUITECTURA_SRE_JobSchedulingPlatform_2025-11-26.md
- ... (9 more)

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
Output: 11 compliance contracts

Purpose: Generate compliance documents, ensure standards adherence
```

### Workflow Integration Points

**From architecture-readiness to architecture-compliance**:
- Business context informs Risk Management contract
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

- **Automation**: 11 contracts generated from single source
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
