# Compliance Contract: Security Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 4, 5, 7, 9, 11)
**Version**: 2.0

---

## Document Control

| Field | Value |
|-------|-------|
| Document Owner | [SOLUTION_ARCHITECT or N/A] |
| Last Review Date | [GENERATION_DATE] |
| Next Review Date | [NEXT_REVIEW_DATE] |
| Status | [DOCUMENT_STATUS] |
| Validation Score | [VALIDATION_SCORE]/10 |
| Validation Status | [VALIDATION_STATUS] |
| Validation Date | [VALIDATION_DATE] |
| Validation Evaluator | [VALIDATION_EVALUATOR] |
| Review Actor | [REVIEW_ACTOR] |
| Approval Authority | [APPROVAL_AUTHORITY] |

**Validation Configuration**: `/skills/architecture-compliance/validation/security_architecture_validation.json`

**Dynamic Field Instructions for Document Generation**:

- `[DOCUMENT_STATUS]`: Determined by validation_results.outcome.document_status
  - Score 8.0-10.0 → "Approved" (auto-approved)
  - Score 7.0-7.9 → "In Review" (ready for manual review)
  - Score 5.0-6.9 → "Draft" (needs work)
  - Score 0.0-4.9 → "Rejected" (blocked)

- `[VALIDATION_SCORE]`: From validation_results.final_score (format: "8.7/10")

- `[VALIDATION_STATUS]`: From validation_results.outcome.overall_status
  - "PASS" (score ≥ 7.0)
  - "CONDITIONAL" (score 5.0-6.9)
  - "FAIL" (score < 5.0)

- `[VALIDATION_DATE]`: From validation_results.validation_date → "YYYY-MM-DD" or "Not performed"

- `[VALIDATION_EVALUATOR]`: "Claude Code (Automated Validation Engine)"

- `[REVIEW_ACTOR]`: From validation_results.outcome.review_actor
  - Score 8.0-10.0 → "System (Auto-Approved)"
  - Score 7.0-7.9 → "Security Review Board"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

- `[APPROVAL_AUTHORITY]`: "Security Review Board"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.0-10.0: Automatic approval (no human review required)
- Score 7.0-7.9: Manual review by Security Review Board required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

**CRITICAL - Compliance Score Calculation**:
When calculating the Compliance Score in validation_results, N/A items MUST be included in the numerator:
- Compliance Score = (PASS items + N/A items + EXCEPTION items) / (Total items) × 10
- N/A items count as fully compliant (10 points each)
- Example: 6 PASS, 5 N/A, 0 FAIL, 0 UNKNOWN → (6+5)/11 × 10 = 10.0/10 (100%)
- Add note in contract output: "Note: N/A items counted as fully compliant (included in compliance score)"

---

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAS1 | API Exposure | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Security Architect or N/A] |
| LAS2 | Intra-Microservices Communication | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Security Architect / Platform Engineer or N/A] |
| LAS3 | Inter-Cluster Kubernetes Communication | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Kubernetes Administrator / Security Architect or N/A] |
| LAS4 | Domain API Communication | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [API Architect / Security Architect or N/A] |
| LAS5 | Third-Party API Consumption | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Engineer / Security Architect or N/A] |
| LAS6 | Data Lake Communication | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Data Architect / Security Architect or N/A] |
| LAS7 | Internal Application Authentication | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Identity Architect / Security Architect or N/A] |
| LAS8 | HTTP Encryption Scheme | Security Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Security Architect or N/A] |

**Overall Compliance**:
- ✅ Compliant: [X]/8 ([X/8*100]%)
- ❌ Non-Compliant: [Y]/8 ([Y/8*100]%)
- ⊘ Not Applicable: [Z]/8 ([Z/8*100]%)
- ❓ Unknown: [W]/8 ([W/8*100]%)

**Completeness**: [COMPLETENESS_PERCENTAGE]% ([COMPLETED_ITEMS]/[TOTAL_ITEMS] data points documented)

---

## 1. API Exposure (LAS1)

**Requirement**: Demonstrate compliance with API exposure guidelines including authentication, authorization, rate limiting, and gateway configuration.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Security Architect / API Architect or N/A]

### 1.1 API Gateway Configuration

**API Gateway Implementation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API Gateway documented with vendor/technology. If Non-Compliant: API Gateway not specified. If Not Applicable: No external API exposure. If Unknown: API Gateway mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section 5 (Component Model → API Gateway) or Section 9 (Security Architecture → API Security), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API Gateway technology (Azure API Management, Kong, Apigee, AWS API Gateway) in Section 5 or 9]

**Exposed API Endpoints**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Public API endpoints documented with paths and methods. If Non-Compliant: Exposed endpoints not listed. If Not Applicable: N/A. If Unknown: APIs mentioned but endpoints not specified]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Catalog) or Section 9, lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: List all publicly exposed API endpoints with HTTP methods in Section 7]

**API Versioning Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Versioning approach documented (URI versioning, header versioning, etc.). If Non-Compliant: Versioning strategy not defined. If Not Applicable: N/A. If Unknown: Versioning mentioned but approach unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define API versioning strategy (e.g., /v1/, /v2/ URI path) in Section 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS1.1]

### 1.2 API Authentication

**Authentication Method**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authentication mechanism documented (OAuth 2.0, API keys, JWT, mTLS). If Non-Compliant: Authentication not specified. If Not Applicable: N/A. If Unknown: Authentication mentioned but method unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify API authentication method (OAuth 2.0 Client Credentials recommended) in Section 9]

**Token Management**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Token issuance, validation, and expiration documented. If Non-Compliant: Token management not addressed. If Not Applicable: N/A. If Unknown: Tokens mentioned but lifecycle unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document token expiration (e.g., access token 1 hour, refresh token 30 days) in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS1.2]

### 1.3 API Authorization

**Authorization Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authorization approach documented (RBAC, ABAC, scope-based). If Non-Compliant: Authorization not defined. If Not Applicable: N/A. If Unknown: Authorization mentioned but model unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define authorization model (OAuth 2.0 scopes or RBAC) in Section 9]

**Access Control Policies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Access policies documented per API endpoint. If Non-Compliant: Access controls not specified. If Not Applicable: N/A. If Unknown: Policies mentioned but not detailed]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document which roles/scopes can access which API endpoints in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS1.3]

### 1.4 Rate Limiting and Throttling

**Rate Limiting Policy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Rate limits documented (requests per minute/hour). If Non-Compliant: Rate limiting not configured. If Not Applicable: Internal-only APIs with no rate limiting requirement. If Unknown: Rate limiting mentioned but limits unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → API Security) or Section 10 (Non-Functional Requirements), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define rate limits per consumer tier (e.g., 1000 req/min for premium, 100 req/min for free) in Section 9]

**Throttling Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Throttling behavior documented (reject, queue, delay). If Non-Compliant: Throttling not addressed. If Not Applicable: N/A. If Unknown: Throttling mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify throttling response (HTTP 429 with Retry-After header) in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS1.4]

---

## 2. Intra-Microservices Communication (LAS2)

**Requirement**: Show compliance with microservices communication guidelines including service mesh, mTLS, and secure service-to-service communication.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Security Architect / Platform Engineer or N/A]

### 2.1 Service Mesh Implementation

**Service Mesh Technology**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service mesh documented (Istio, Linkerd, Consul Connect). If Non-Compliant: Service mesh not implemented. If Not Applicable: Monolithic architecture (no microservices). If Unknown: Service mesh mentioned but technology unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture → Microservices) or Section 5 (Component Model), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify service mesh technology for service-to-service security in Section 4 or 5]

**Service Mesh Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Mesh configuration documented (sidecar injection, control plane). If Non-Compliant: Configuration not specified. If Not Applicable: N/A. If Unknown: Configuration mentioned but details unclear]
- Source: [ARCHITECTURE.md Section 5 (Component Model) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document service mesh control plane and data plane configuration in Section 5]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS2.1]

### 2.2 Mutual TLS (mTLS)

**mTLS Enforcement**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: mTLS enforced for all service-to-service communication. If Non-Compliant: mTLS not enforced or not documented. If Not Applicable: Monolithic architecture. If Unknown: mTLS mentioned but enforcement unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Network Security or Data Security → Encryption in Transit), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Mandate mTLS for all intra-microservices communication in Section 9]

**Certificate Management**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Certificate issuance and rotation documented. If Non-Compliant: Certificate management not addressed. If Not Applicable: N/A. If Unknown: Certificates mentioned but management unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Secrets Management), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document certificate authority (CA) and automatic rotation (e.g., cert-manager, SPIFFE) in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS2.2]

### 2.3 Service-to-Service Authorization

**Authorization Policy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service-to-service authorization documented (service identity, RBAC). If Non-Compliant: Authorization not enforced between services. If Not Applicable: N/A. If Unknown: Authorization mentioned but policy unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define which services can call which services using service mesh authorization policies in Section 9]

**Service Identity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service identity mechanism documented (SPIFFE, Kubernetes Service Accounts). If Non-Compliant: Service identity not established. If Not Applicable: N/A. If Unknown: Identity mentioned but mechanism unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement service identity using SPIFFE/SPIRE or Kubernetes Service Accounts in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS2.3]

---

## 3. Inter-Cluster Kubernetes Communication (LAS3)

**Requirement**: Demonstrate compliance with inter-cluster communication guidelines including cluster mesh, multi-cluster networking, and cross-cluster security.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Kubernetes Administrator / Security Architect or N/A]

### 3.1 Multi-Cluster Architecture

**Cluster Topology**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Multi-cluster topology documented (number of clusters, purpose per cluster). If Non-Compliant: Cluster architecture not specified. If Not Applicable: Single Kubernetes cluster. If Unknown: Multiple clusters mentioned but topology unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture → Deployment Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document cluster topology (e.g., dev cluster, staging cluster, prod cluster) in Section 4]

**Cross-Cluster Networking**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Inter-cluster networking documented (cluster mesh, VPN, gateway). If Non-Compliant: Cross-cluster networking not addressed. If Not Applicable: Single cluster. If Unknown: Networking mentioned but implementation unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture) or Section 9 (Security Architecture → Network Security), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify cross-cluster networking approach (Istio multi-cluster, Submariner, Cilium Cluster Mesh) in Section 4 or 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS3.1]

### 3.2 Inter-Cluster Security

**Cross-Cluster mTLS**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: mTLS enforced for cross-cluster communication. If Non-Compliant: Cross-cluster encryption not enforced. If Not Applicable: Single cluster. If Unknown: Encryption mentioned but enforcement unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security → Encryption in Transit), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Mandate mTLS for all cross-cluster service calls in Section 9]

**Cross-Cluster Service Discovery**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Service discovery mechanism documented (federated service registry). If Non-Compliant: Service discovery not configured. If Not Applicable: N/A. If Unknown: Discovery mentioned but mechanism unclear]
- Source: [ARCHITECTURE.md Section 5 (Component Model → Service Discovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure federated service discovery for cross-cluster service location in Section 5]

**Network Policies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Cross-cluster network policies documented. If Non-Compliant: Network isolation not enforced. If Not Applicable: N/A. If Unknown: Policies mentioned but rules unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Network Security), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define Kubernetes NetworkPolicies restricting cross-cluster traffic in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS3.2]

---

## 4. Domain API Communication (LAS4)

**Requirement**: Show compliance with domain API communication guidelines including domain-driven design, bounded contexts, and domain event security.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [API Architect / Security Architect or N/A]

### 4.1 Domain API Design

**Bounded Contexts**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Domain bounded contexts documented with API boundaries. If Non-Compliant: Bounded contexts not defined. If Not Applicable: Non-DDD architecture. If Unknown: Bounded contexts mentioned but boundaries unclear]
- Source: [ARCHITECTURE.md Section 3 (Business Context → Domain Model) or Section 5 (Component Model), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define bounded contexts and their API boundaries per domain-driven design principles in Section 3 or 5]

**Domain API Catalog**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Domain APIs cataloged with ownership and contracts. If Non-Compliant: Domain APIs not documented. If Not Applicable: N/A. If Unknown: APIs mentioned but catalog incomplete]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Catalog), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create domain API catalog listing each domain's public APIs in Section 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS4.1]

### 4.2 Domain API Security

**Domain-Level Authentication**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authentication per domain API documented. If Non-Compliant: Domain API authentication not specified. If Not Applicable: N/A. If Unknown: Authentication mentioned but per-domain implementation unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify authentication requirements for each domain API (OAuth 2.0 scopes per domain) in Section 9]

**Domain Authorization Boundaries**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authorization boundaries enforced per bounded context. If Non-Compliant: Cross-domain authorization not controlled. If Not Applicable: N/A. If Unknown: Authorization mentioned but domain boundaries unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define authorization policies preventing unauthorized cross-domain access in Section 9]

**API Contract Versioning**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Domain API contract versioning strategy documented. If Non-Compliant: Versioning not addressed. If Not Applicable: N/A. If Unknown: Versioning mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement semantic versioning for domain API contracts in Section 7]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS4.2]

### 4.3 Domain Events Security

**Event Publishing Security**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Domain event publishing security documented (encryption, authentication). If Non-Compliant: Event security not addressed. If Not Applicable: No event-driven architecture. If Unknown: Events mentioned but security unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Events/Messaging) or Section 9, lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enforce authentication and encryption for domain event publishing in Section 7 or 9]

**Event Subscription Authorization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event subscription authorization documented (which domains can subscribe to which events). If Non-Compliant: Subscription access not controlled. If Not Applicable: N/A. If Unknown: Subscriptions mentioned but authorization unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define which bounded contexts can subscribe to domain events in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS4.3]

---

## 5. Third-Party API Consumption (LAS5)

**Requirement**: Demonstrate compliance with third-party API consumption guidelines including credential management, API security, and vendor risk assessment.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Engineer / Security Architect or N/A]

### 5.1 Third-Party API Inventory

**External API Catalog**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party APIs documented with vendor, purpose, and endpoints. If Non-Compliant: External APIs not cataloged. If Not Applicable: No third-party integrations. If Unknown: External APIs mentioned but not cataloged]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Integration Catalog), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create inventory of all consumed third-party APIs (Stripe, Twilio, SendGrid, etc.) in Section 7]

**API Dependency Criticality**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party API criticality assessed (critical, high, medium, low). If Non-Compliant: Criticality not evaluated. If Not Applicable: N/A. If Unknown: Dependencies mentioned but criticality unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration View) or Section 11 (Operational Considerations), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Classify each third-party API by business impact if unavailable in Section 7 or 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS5.1]

### 5.2 Third-Party API Security

**API Credential Management**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party API keys/credentials stored securely (Key Vault, Secrets Manager). If Non-Compliant: Credentials not secured or stored in code. If Not Applicable: N/A. If Unknown: Credential storage mentioned but method unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Secrets Management), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Store all third-party API credentials in Azure Key Vault / AWS Secrets Manager in Section 9]

**API Key Rotation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API key rotation policy documented. If Non-Compliant: Key rotation not configured. If Not Applicable: N/A. If Unknown: Rotation mentioned but policy unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Secrets Management) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement automated API key rotation (e.g., every 90 days) in Section 9]

**TLS/SSL Verification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: TLS certificate verification enforced for third-party API calls. If Non-Compliant: TLS verification disabled or not enforced. If Not Applicable: N/A. If Unknown: TLS mentioned but verification unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security → Encryption in Transit), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enforce TLS 1.3+ with certificate validation for all third-party API calls in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS5.2]

### 5.3 Vendor Risk Management

**Vendor Security Assessment**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party vendor security posture assessed (SOC 2, ISO 27001). If Non-Compliant: Vendor security not evaluated. If Not Applicable: N/A. If Unknown: Vendor security mentioned but assessment unclear]
- Source: [ARCHITECTURE.md Section 12 (ADRs) or "External vendor documentation"]
- Note: [If Non-Compliant or Unknown: Document vendor security certifications and compliance in Section 12 or ADR]

**Data Sharing Agreements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data sharing with third parties documented with DPA/NDA. If Non-Compliant: Data sharing agreements not in place. If Not Applicable: No data shared with third parties. If Unknown: Data sharing mentioned but agreements unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Compliance) or "External legal documentation"]
- Note: [If Non-Compliant or Unknown: Ensure Data Processing Agreements (DPA) exist for third parties handling PII in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS5.3]

---

## 6. Data Lake Communication (LAS6)

**Requirement**: Show compliance with data lake communication guidelines including authentication, encryption, data access policies, and data lineage.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Data Architect / Security Architect or N/A]

### 6.1 Data Lake Access Security

**Authentication Mechanism**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data lake authentication documented (Azure AD, IAM roles, Kerberos). If Non-Compliant: Authentication not configured. If Not Applicable: No data lake integration. If Unknown: Authentication mentioned but mechanism unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure data lake authentication using managed identities or service principals in Section 9]

**Authorization Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data lake authorization documented (RBAC, ACLs, ABAC). If Non-Compliant: Authorization not enforced. If Not Applicable: N/A. If Unknown: Authorization mentioned but model unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement RBAC or ACLs for data lake access control (folder-level permissions) in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS6.1]

### 6.2 Data Lake Encryption

**Encryption in Transit**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: TLS enforced for data lake communication. If Non-Compliant: Encryption in transit not configured. If Not Applicable: N/A. If Unknown: Encryption mentioned but enforcement unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security → Encryption in Transit), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enforce TLS 1.3+ for all data lake API calls (HTTPS, ADLS REST API) in Section 9]

**Encryption at Rest**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data lake encryption at rest documented (service-managed or customer-managed keys). If Non-Compliant: At-rest encryption not configured. If Not Applicable: N/A. If Unknown: Encryption mentioned but key management unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security → Encryption at Rest), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enable data lake encryption at rest using platform-managed or customer-managed keys in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS6.2]

### 6.3 Data Governance

**Data Classification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data lake content classified by sensitivity (public, internal, confidential, restricted). If Non-Compliant: Data classification not performed. If Not Applicable: N/A. If Unknown: Classification mentioned but levels unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Classification) or Section 9, lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Classify data lake zones/folders by sensitivity level in Section 6 or 9]

**Data Lineage Tracking**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data lineage from source to data lake documented. If Non-Compliant: Data lineage not tracked. If Not Applicable: N/A. If Unknown: Lineage mentioned but tracking unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Data Lineage) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement data lineage tracking showing data sources and transformations in Section 6]

**Access Audit Logging**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data lake access logging enabled for audit trail. If Non-Compliant: Access logging not configured. If Not Applicable: N/A. If Unknown: Logging mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Monitoring → Audit Logging), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enable data lake diagnostic logs capturing all read/write operations in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS6.3]

---

## 7. Internal Application Authentication (LAS7)

**Requirement**: Demonstrate compliance with internal application authentication guidelines including SSO, identity providers, MFA, and session management.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Identity Architect / Security Architect or N/A]

### 7.1 Authentication Strategy

**Identity Provider (IdP)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Identity provider documented (Azure AD, Okta, Auth0, Keycloak). If Non-Compliant: IdP not specified. If Not Applicable: Public application with no authentication. If Unknown: IdP mentioned but vendor unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Specify corporate identity provider for user authentication in Section 9]

**Authentication Protocol**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authentication protocol documented (OAuth 2.0, SAML 2.0, OpenID Connect). If Non-Compliant: Protocol not specified. If Not Applicable: N/A. If Unknown: Protocol mentioned but type unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Use OpenID Connect (OIDC) for user authentication in Section 9]

**Single Sign-On (SSO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: SSO integration documented with corporate IdP. If Non-Compliant: SSO not implemented. If Not Applicable: Standalone application. If Unknown: SSO mentioned but integration unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Integrate with corporate SSO for seamless user experience in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS7.1]

### 7.2 Multi-Factor Authentication (MFA)

**MFA Requirement**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: MFA enforced for user authentication. If Non-Compliant: MFA not required or not enforced. If Not Applicable: Service-to-service authentication only. If Unknown: MFA mentioned but enforcement unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Mandate MFA for all internal application users in Section 9]

**MFA Methods**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: MFA methods documented (SMS, authenticator app, FIDO2, biometric). If Non-Compliant: MFA methods not specified. If Not Applicable: N/A. If Unknown: MFA mentioned but methods unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Support authenticator apps (TOTP) and FIDO2 hardware keys in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS7.2]

### 7.3 Session Management

**Session Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Session timeout and configuration documented. If Non-Compliant: Session management not configured. If Not Applicable: N/A. If Unknown: Sessions mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure session timeout (e.g., 8 hours idle, 24 hours absolute) in Section 9]

**Token Security**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Access token and refresh token security documented. If Non-Compliant: Token security not addressed. If Not Applicable: N/A. If Unknown: Tokens mentioned but security unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Store tokens securely (HttpOnly cookies or secure storage), define expiration in Section 9]

**Logout Mechanism**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Logout process documented (session invalidation, token revocation). If Non-Compliant: Logout not implemented. If Not Applicable: N/A. If Unknown: Logout mentioned but mechanism unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement proper logout invalidating both access and refresh tokens in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS7.3]

---

## 8. HTTP Encryption Scheme (LAS8)

**Requirement**: Show compliance with HTTP encryption guidelines including TLS version, cipher suites, certificate management, and HSTS.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Security Architect / Platform Engineer or N/A]

### 8.1 TLS Configuration

**TLS Version**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: TLS 1.3 or TLS 1.2+ enforced for all HTTPS communication. If Non-Compliant: TLS 1.0/1.1 allowed or TLS not enforced. If Not Applicable: N/A. If Unknown: TLS mentioned but version unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Data Security → Encryption in Transit), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enforce TLS 1.3 (preferred) or minimum TLS 1.2 for all HTTP endpoints in Section 9]

**Cipher Suites**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Approved cipher suites documented (AES-GCM, ChaCha20-Poly1305). If Non-Compliant: Weak ciphers allowed (3DES, RC4, MD5). If Not Applicable: N/A. If Unknown: Ciphers mentioned but suites unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure strong cipher suites (ECDHE-RSA-AES256-GCM-SHA384, TLS_AES_256_GCM_SHA384) in Section 9]

**Protocol Downgrade Protection**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: TLS downgrade attacks prevented (disable SSL fallback). If Non-Compliant: Protocol downgrade possible. If Not Applicable: N/A. If Unknown: Protection mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Disable TLS downgrade and SSL fallback to prevent POODLE attacks in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS8.1]

### 8.2 Certificate Management

**Certificate Authority (CA)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: CA documented (public CA like Let's Encrypt, DigiCert, or internal PKI). If Non-Compliant: CA not specified or self-signed certificates used. If Not Applicable: N/A. If Unknown: Certificates mentioned but CA unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Secrets Management) or Section 11, lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Use public CA certificates (Let's Encrypt, DigiCert) or documented internal PKI in Section 9]

**Certificate Lifecycle**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Certificate issuance, renewal, and revocation documented. If Non-Compliant: Certificate lifecycle not managed. If Not Applicable: N/A. If Unknown: Lifecycle mentioned but process unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture) or Section 11 (Operational Considerations), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement automated certificate renewal (cert-manager, ACME protocol) in Section 9 or 11]

**Certificate Expiration Monitoring**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Certificate expiration monitoring configured with alerts. If Non-Compliant: Monitoring not configured. If Not Applicable: N/A. If Unknown: Monitoring mentioned but alerting unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Monitoring), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure alerts for certificates expiring within 30 days in Section 11]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS8.2]

### 8.3 HTTP Security Headers

**HSTS (HTTP Strict Transport Security)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: HSTS header enforced (max-age, includeSubDomains, preload). If Non-Compliant: HSTS not configured. If Not Applicable: N/A. If Unknown: HSTS mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Application Security), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enable HSTS header with max-age=31536000; includeSubDomains; preload in Section 9]

**Additional Security Headers**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Security headers documented (X-Content-Type-Options, X-Frame-Options, CSP). If Non-Compliant: Security headers not configured. If Not Applicable: N/A. If Unknown: Headers mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Configure X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Content-Security-Policy in Section 9]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAS8.3]

---

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Security Architecture Terms**:
- **API Exposure**: Publicly accessible API endpoints requiring authentication and authorization
- **mTLS (Mutual TLS)**: Two-way TLS authentication where both client and server authenticate each other
- **Service Mesh**: Infrastructure layer handling service-to-service communication, security, and observability
- **Bounded Context**: DDD concept defining domain boundaries with explicit API contracts
- **Data Lake**: Centralized repository storing structured and unstructured data at scale
- **SSO (Single Sign-On)**: Authentication mechanism allowing one set of credentials across multiple applications
- **HSTS**: HTTP header forcing browsers to use HTTPS connections only
- **SPIFFE**: Secure Production Identity Framework for Everyone (service identity standard)

**Status Codes**:
- **Compliant**: Security requirement fully satisfied with documented evidence
- **Non-Compliant**: Security requirement not met or missing from ARCHITECTURE.md
- **Not Applicable**: Security requirement does not apply to this solution
- **Unknown**: Partial security information exists but insufficient to determine compliance

**Security Abbreviations**:
- **LAS**: Security Architecture compliance requirement code
- **OAuth**: Open Authorization standard for delegated access
- **OIDC**: OpenID Connect (authentication layer on OAuth 2.0)
- **SAML**: Security Assertion Markup Language
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **ABAC**: Attribute-Based Access Control
- **MFA**: Multi-Factor Authentication
- **TLS**: Transport Layer Security
- **CA**: Certificate Authority
- **PKI**: Public Key Infrastructure

---

### A.2 Validation Methodology

**Validation Process**:

1. **Completeness Check (40% weight)**:
   - Counts filled data points across all 8 LAS requirements
   - Formula: (Filled fields / Total required fields) × 10
   - Example: 28 out of 30 fields = 9.3/10 completeness

2. **Compliance Check (50% weight)**:
   - Evaluates each validation item as PASS/FAIL/N/A/UNKNOWN
   - Formula: (PASS + N/A + EXCEPTION items) / Total items × 10
   - **CRITICAL**: N/A items MUST be included in numerator
   - Example: 20 PASS + 5 N/A + 0 EXCEPTION out of 30 items = (20+5)/30 × 10 = 8.3/10

3. **Quality Check (10% weight)**:
   - Assesses source traceability (ARCHITECTURE.md section references)
   - Verifies explanation quality and actionable notes
   - Formula: (Items with valid sources / Total items) × 10

4. **Final Score Calculation**:
   ```
   Final Score = (Completeness × 0.4) + (Compliance × 0.5) + (Quality × 0.1)
   ```

**Outcome Determination**:
| Score Range | Document Status | Review Actor | Action |
|-------------|----------------|--------------|--------|
| 8.0-10.0 | Approved | System (Auto-Approved) | Ready for implementation |
| 7.0-7.9 | In Review | Security Review Board | Manual review required |
| 5.0-6.9 | Draft | Architecture Team | Address security gaps before review |
| 0.0-4.9 | Rejected | N/A (Blocked) | Cannot proceed - critical security missing |

---

### A.3 Document Completion Guide

**For Architecture Teams**:

If this contract shows "Non-Compliant" or "Unknown" items:

1. **Identify Missing Sections**: Review the "Note" field for each item
2. **Locate ARCHITECTURE.md Section**: The note specifies target section (4, 5, 7, 9, or 11)
3. **Add Required Security Content**: Document the missing security information in the specified section
4. **Regenerate Contract**: Run compliance generation again after updates

**Common Security Gaps and Remediation**:

| Missing Item | ARCHITECTURE.md Section | What to Add |
|--------------|------------------------|-------------|
| API authentication | Section 9 (Security Architecture) | OAuth 2.0, API keys, or mTLS configuration |
| Service mesh | Section 4 or 5 (Architecture/Components) | Istio, Linkerd, or Consul Connect implementation |
| mTLS configuration | Section 9 (Security Architecture) | Mutual TLS enforcement for service-to-service calls |
| Third-party API catalog | Section 7 (Integration View) | List of external APIs with vendors and endpoints |
| Data lake authentication | Section 9 (Security Architecture) | Azure AD, IAM roles, or service principal authentication |
| SSO configuration | Section 9 (Security Architecture) | OIDC or SAML integration with corporate IdP |
| TLS version | Section 9 (Security Architecture) | TLS 1.3 or minimum TLS 1.2 enforcement |
| Certificate management | Section 9 or 11 (Security/Operations) | CA, renewal automation, expiration monitoring |

---

### A.4 Change History

**Version 2.0 (Current)**:
- Complete template restructuring to Version 2.0 format
- Replaced old simple sections with 8 comprehensive LAS requirements
- LAS1: API Exposure (4 subsections, 10 data points)
- LAS2: Intra-Microservices Communication (3 subsections, 6 data points)
- LAS3: Inter-Cluster Kubernetes Communication (2 subsections, 5 data points)
- LAS4: Domain API Communication (3 subsections, 7 data points)
- LAS5: Third-Party API Consumption (3 subsections, 7 data points)
- LAS6: Data Lake Communication (3 subsections, 7 data points)
- LAS7: Internal Application Authentication (3 subsections, 7 data points)
- LAS8: HTTP Encryption Scheme (3 subsections, 7 data points)
- Added comprehensive Appendix with 4 sections
- Total: 56 validation data points across 24 subsections
- Source mapping expanded to Sections 4, 5, 7, 9, 11
- Aligned with Cloud Architecture template structure
- All content in English

**Version 1.0 (Previous)**:
- Initial template with 6 simple sections
- Basic PLACEHOLDER approach
- Limited source traceability
- Focused on API security, authentication, encryption only

---

## Data Extracted Successfully

[List of all data points marked as "Compliant" with source references]

Example format:
- LAS1.1 - API Gateway: [Value] (Source: ARCHITECTURE.md Section 5.2, lines 234-240)
- LAS2.2 - mTLS Enforcement: [Value] (Source: ARCHITECTURE.md Section 9.4, lines 1168-1172)
- LAS7.1 - Identity Provider: [Value] (Source: ARCHITECTURE.md Section 9.1, lines 1079-1085)
- LAS8.1 - TLS Version: [Value] (Source: ARCHITECTURE.md Section 9.4, line 1170)

---

## Missing Data Requiring Attention

| Requirement | Missing Data Point | Responsible Role | Recommended Action |
|-------------|-------------------|------------------|-------------------|
| LAS1 | [Example: API authentication method] | Security Architect | Specify OAuth 2.0, API keys, or mTLS in Section 9 |
| LAS2 | [Example: Service mesh technology] | Platform Engineer | Document Istio, Linkerd, or Consul Connect in Section 4/5 |
| LAS3 | [Example: Cross-cluster mTLS] | Kubernetes Admin | Configure multi-cluster service mesh in Section 9 |
| LAS4 | [Example: Domain bounded contexts] | API Architect | Define DDD bounded contexts and API boundaries in Section 3/5 |
| LAS5 | [Example: Third-party API catalog] | Integration Engineer | List all consumed external APIs in Section 7 |
| LAS6 | [Example: Data lake authentication] | Data Architect | Configure Azure AD or IAM roles for data lake access in Section 9 |
| LAS7 | [Example: SSO integration] | Identity Architect | Document OIDC integration with corporate IdP in Section 9 |
| LAS8 | [Example: TLS cipher suites] | Security Architect | Specify approved strong cipher suites in Section 9 |

---

## Not Applicable Items

[List of requirements marked as "Not Applicable" with justification]

Example format:
- LAS2: Intra-Microservices Communication - Monolithic architecture with no microservices
- LAS3: Inter-Cluster Kubernetes Communication - Single Kubernetes cluster deployment
- LAS4: Domain API Communication - Non-DDD architecture, no domain-driven design
- LAS6: Data Lake Communication - No data lake integration in solution

---

## Unknown Status Items Requiring Investigation

| Requirement | Data Point | Issue | Responsible Role | Action Needed |
|-------------|------------|-------|------------------|---------------|
| LAS1 | [Example: Rate limiting] | Mentioned but limits not specified | Security Architect | Define rate limits per API consumer tier in Section 9 |
| LAS2 | [Example: Certificate management] | Service mesh mentioned but cert rotation unclear | Platform Engineer | Document cert-manager or SPIFFE/SPIRE usage in Section 9 |
| LAS5 | [Example: API key rotation] | Third-party APIs listed but rotation policy unknown | Integration Engineer | Define API key rotation schedule (e.g., 90 days) in Section 9 |
| LAS7 | [Example: MFA methods] | MFA mentioned but supported methods unclear | Identity Architect | Specify authenticator apps, FIDO2, biometric in Section 9 |
| LAS8 | [Example: HSTS configuration] | HTTPS enforced but HSTS header configuration unknown | Security Architect | Add HSTS header with max-age and includeSubDomains in Section 9 |

---

## Generation Metadata

**Template Version**: 2.0 (Updated with 8 LAS requirements and compliance evaluation system)
**Generation Date**: [GENERATION_DATE]
**Source Document**: ARCHITECTURE.md
**Primary Source Sections**: 4 (Meta Architecture), 5 (Component Model), 7 (Integration View), 9 (Security Architecture), 11 (Operational Considerations)
**Completeness**: [PERCENTAGE]% ([X/56] data points documented)
**Template Language**: English
**Compliance Framework**: LAS (Security Architecture) with 8 requirements
**Status Labels**: Compliant, Non-Compliant, Not Applicable, Unknown

---

**Note**: This document is auto-generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the security architecture documentation.
