# Compliance Contract: Integration Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 5, 6, 7, 9)
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
| Approval Authority | Integration Architecture Review Board |

**Validation Configuration**: `/skills/architecture-compliance/validation/integration_architecture_validation.json`

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
  - Score 7.0-7.9 → "Integration Architecture Review Board"
  - Score 5.0-6.9 → "Architecture Team"
  - Score 0.0-4.9 → "N/A (Blocked)"

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.0-10.0: Automatic approval (no human review required)
- Score 7.0-7.9: Manual review by Integration Architecture Review Board required
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

This Integration Architecture compliance contract validates 7 LAI (Integration Architecture) requirements to ensure integration best practices, security, technology currency, governance compliance, third-party documentation, traceability, and event-driven architecture standards.

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAI1 | Best Practices Adoption | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect or N/A] |
| LAI2 | Secure Integrations | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Security Architect / Integration Architect or N/A] |
| LAI3 | No Obsolete Integration Technologies | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect / Enterprise Architect or N/A] |
| LAI4 | Integration Governance Standards | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect / Governance Board or N/A] |
| LAI5 | Third-Party Documentation | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect / API Product Owner or N/A] |
| LAI6 | Traceability and Audit | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect / SRE Team or N/A] |
| LAI7 | Event-Driven Integration Compliance | Integration Architecture | [Compliant/Non-Compliant/Not Applicable/Unknown] | [Section X or N/A] | [Integration Architect / Event Architect or N/A] |

**Overall Compliance**:
- ✅ Compliant: [X]/7 ([X/7*100]%)
- ❌ Non-Compliant: [Y]/7 ([Y/7*100]%)
- ⊘ Not Applicable: [Z]/7 ([Z/7*100]%)
- ❓ Unknown: [W]/7 ([W/7*100]%)

**Completeness**: [COMPLETENESS_PERCENTAGE]% ([COMPLETED_ITEMS]/[TOTAL_ITEMS] data points documented)

---

## 1. Best Practices Adoption (LAI1)

**Requirement**: Ensure each domain microservice is accessible via a domain API following integration best practices including API design, versioning, error handling, and documentation.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect or N/A]

### 1.1 Domain API Accessibility

**Domain Microservices with APIs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All domain microservices expose domain APIs documented in integration catalog. If Non-Compliant: Microservices exist without domain API exposure. If Not Applicable: No domain microservices architecture. If Unknown: Domain API accessibility not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Domain APIs / API Catalog) or Section 5 (Component Model → Microservices), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document domain API endpoints for each microservice in Section 7. Ensure each bounded context exposes a well-defined API]

**API Catalog Completeness**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Complete API catalog with endpoints, methods, authentication documented. If Non-Compliant: API catalog missing or incomplete. If Not Applicable: No APIs. If Unknown: API catalog not referenced]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Catalog / Integration Catalog), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create comprehensive API catalog in Section 7 listing all domain APIs with endpoints, authentication, and SLAs]

### 1.2 API Design Best Practices

**RESTful API Design Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: APIs follow REST principles (resource-oriented, HTTP verbs, stateless, JSON). If Non-Compliant: Non-RESTful design or RPC-style endpoints. If Not Applicable: No REST APIs (SOAP/GraphQL only). If Unknown: API design principles not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Design Standards) or Section 5 (Component Model → API Design), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document REST API design standards in Section 7. Include resource naming conventions, HTTP verb usage (GET, POST, PUT, DELETE), status codes]

**API Versioning Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API versioning strategy defined (URL path, header, or query parameter versioning). If Non-Compliant: No versioning or breaking changes without version management. If Not Applicable: Internal-only APIs with controlled clients. If Unknown: Versioning strategy not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Versioning), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define API versioning strategy in Section 7 (e.g., /v1/, /v2/ in URL path). Document backward compatibility policy]

**Error Handling Standards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Standardized error response format (HTTP status codes, error codes, messages). If Non-Compliant: Inconsistent error responses or missing error handling. If Not Applicable: N/A (error handling generally required). If Unknown: Error handling not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Error Handling) or Section 5 (Component Model → API Error Handling), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document error handling standards in Section 7. Include HTTP status code usage (4xx client errors, 5xx server errors), error response schema with error codes and messages]

### 1.3 API Documentation

**API Documentation Standards**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: APIs documented with OpenAPI/Swagger specifications, endpoints, request/response schemas. If Non-Compliant: APIs lack documentation or outdated documentation. If Not Applicable: No APIs. If Unknown: API documentation approach not specified]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Documentation), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement OpenAPI 3.0 specification for all APIs in Section 7. Include endpoint descriptions, authentication requirements, request/response examples]

---

## 2. Secure Integrations (LAI2)

**Requirement**: Demonstrate secure integration of APIs and microservices following cybersecurity guidelines including authentication, authorization, encryption, and security monitoring.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Security Architect / Integration Architect or N/A]

### 2.1 Integration Authentication

**API Authentication Mechanism**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Secure authentication for all APIs (OAuth 2.0, JWT, API keys with rotation, mTLS). If Non-Compliant: Basic authentication, hardcoded credentials, or no authentication. If Not Applicable: No external integrations. If Unknown: Authentication mechanism not documented]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → API Security / Authentication) or Section 7 (Integration View → Authentication), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API authentication in Section 9. Implement OAuth 2.0 or JWT for user-context APIs, mTLS for service-to-service]

**Service-to-Service Authentication**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Microservices use secure service-to-service authentication (mTLS, service identity, JWT). If Non-Compliant: No service authentication or network-only security. If Not Applicable: Monolithic architecture. If Unknown: Service authentication not specified]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Service Authentication), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement mTLS or service mesh with service identity in Section 9. Document service authentication mechanism]

### 2.2 Integration Authorization

**API Authorization Model**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Authorization model defined (RBAC, ABAC, scope-based) with fine-grained access control. If Non-Compliant: No authorization or all-or-nothing access. If Not Applicable: Public read-only APIs. If Unknown: Authorization not documented]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authorization / Access Control), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define authorization model in Section 9 with roles, scopes, and permissions. Implement RBAC or ABAC for API access control]

### 2.3 Integration Encryption

**Data in Transit Encryption**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All integrations use TLS 1.2+ encryption for data in transit. If Non-Compliant: Unencrypted communications or TLS 1.0/1.1. If Not Applicable: No external communications. If Unknown: Encryption not documented]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Encryption / TLS Configuration), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Enforce TLS 1.2+ for all API communications in Section 9. Disable older TLS versions (1.0, 1.1)]

**Secrets Management for Integration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API credentials and secrets stored in vault (Azure Key Vault, HashiCorp Vault, AWS Secrets Manager). If Non-Compliant: Credentials in code, configuration files, or environment variables. If Not Applicable: No secrets required. If Unknown: Secrets management not documented]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Secrets Management), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement vault-based secrets management in Section 9. Store all API keys, tokens, and credentials in approved vault]

### 2.4 Integration Security Monitoring

**Integration Security Logging**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Security events for integrations logged (authentication failures, authorization denials, anomalous traffic). If Non-Compliant: No security logging for integrations. If Not Applicable: N/A (security logging required). If Unknown: Security logging not documented]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Security Logging) or Section 7 (Integration View → Logging), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement security event logging for all integrations in Section 9. Include authentication attempts, authorization decisions, and security exceptions]

---

## 3. No Obsolete Integration Technologies (LAI3)

**Requirement**: Confirm no use of obsolete integration technologies, ensuring all integration protocols, message formats, and middleware are current and supported.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / Enterprise Architect or N/A]

### 3.1 Integration Protocol Currency

**REST API Protocol Version**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: REST APIs use HTTP/1.1 or HTTP/2, JSON format, modern standards. If Non-Compliant: HTTP/1.0 or deprecated XML-RPC. If Not Applicable: No REST APIs. If Unknown: Protocol version not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → REST APIs / Protocols), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Upgrade to HTTP/1.1 or HTTP/2 in Section 7. Use JSON for data interchange]

**SOAP Version (if applicable)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: SOAP 1.2 with documented migration path to REST. If Non-Compliant: SOAP 1.0 or no migration plan. If Not Applicable: No SOAP integrations. If Unknown: SOAP version not specified]
- Source: [ARCHITECTURE.md Section 7 (Integration View → SOAP APIs), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: If using SOAP, upgrade to SOAP 1.2 and document REST migration plan in Section 7]

### 3.2 Messaging Technology Currency

**Message Broker Technology**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Modern message broker (Kafka, RabbitMQ, Azure Service Bus, AWS SQS/SNS) with current version. If Non-Compliant: Deprecated broker (WebSphere MQ 7.x, MSMQ) or end-of-life version. If Not Applicable: No messaging middleware. If Unknown: Message broker not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Messaging / Event Bus) or Section 5 (Component Model → Message Broker), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Migrate to modern message broker in Section 7 (Kafka for high throughput, RabbitMQ for general messaging, cloud-native for managed services)]

**Event Streaming Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Modern event streaming (Apache Kafka, Azure Event Hubs, AWS Kinesis, Confluent Cloud). If Non-Compliant: Legacy polling or batch file transfer. If Not Applicable: No event streaming. If Unknown: Event platform not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Event Streaming) or Section 7 (Integration View → Event Bus), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement modern event streaming platform in Section 6/7 for real-time data integration]

### 3.3 Integration Middleware Currency

**ESB/Integration Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Modern integration platform (MuleSoft, Azure Logic Apps, AWS Step Functions) or no ESB (cloud-native). If Non-Compliant: Legacy ESB (Oracle SOA Suite 11g, WebSphere ESB) without upgrade path. If Not Applicable: No ESB (microservices with direct integration). If Unknown: Integration platform not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Integration Platform) or Section 5 (Component Model → Integration Middleware), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: If using ESB, document upgrade to current version or migration to cloud-native integration in Section 7. Prefer serverless integration or API-first approach]

---

## 4. Integration Governance Standards (LAI4)

**Requirement**: Ensure all APIs and microservices follow the integration governance playbook including naming conventions, API lifecycle management, change control, and compliance with organizational standards.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / Governance Board or N/A]

### 4.1 API Naming Conventions

**API Naming Standards Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: APIs follow organizational naming conventions (resource naming, URI structure, operation naming). If Non-Compliant: Inconsistent naming or non-standard URI patterns. If Not Applicable: No APIs. If Unknown: Naming standards not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Standards / Naming Conventions), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API naming conventions in Section 7. Follow RESTful resource naming (plural nouns, lowercase, hyphens for multi-word resources)]

**Endpoint Standardization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Endpoints follow standard patterns (base URL, version prefix, resource path). If Non-Compliant: Ad-hoc endpoint structures. If Not Applicable: No APIs. If Unknown: Endpoint standards not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Endpoint Standards), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Standardize endpoint structure in Section 7 (e.g., https://api.domain.com/v1/{resource}/{id})]

### 4.2 API Lifecycle Management

**API Lifecycle Governance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API lifecycle stages defined (design, development, testing, production, deprecation). If Non-Compliant: No lifecycle management or uncontrolled API changes. If Not Applicable: No APIs. If Unknown: Lifecycle management not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Lifecycle), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document API lifecycle stages in Section 7. Include approval gates for production promotion and deprecation policies]

**API Change Control**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API changes follow governance process (change request, impact analysis, stakeholder approval). If Non-Compliant: Uncontrolled API changes causing breaking changes. If Not Applicable: No APIs or single client. If Unknown: Change control not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Change Control), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement API change control process in Section 7. Require impact analysis and consumer notification for breaking changes]

### 4.3 Governance Playbook Compliance

**Integration Governance Playbook Reference**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Architecture references organizational integration governance playbook with compliance confirmation. If Non-Compliant: No playbook reference or non-compliance. If Not Applicable: No organizational playbook. If Unknown: Playbook compliance not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Governance Compliance) or Section 12 (ADRs → Governance Decisions), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Reference integration governance playbook in Section 7. Document compliance or exceptions with justification]

**API Review and Approval Process**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: API review process with architecture review board approval before production. If Non-Compliant: No review process or self-approved APIs. If Not Applicable: No APIs. If Unknown: Review process not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → API Review Process), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Establish API review process in Section 7 with architecture board approval gate]

---

## 5. Third-Party Documentation (LAI5)

**Requirement**: Ensure all third-party APIs, microservices, and events provide proper documentation including API specifications, SLAs, support contacts, and integration guides.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / API Product Owner or N/A]

### 5.1 Third-Party API Inventory

**Third-Party API Catalog**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Complete inventory of third-party APIs with vendor, purpose, endpoint, authentication. If Non-Compliant: Third-party APIs used without central catalog. If Not Applicable: No third-party API consumption. If Unknown: Third-party API inventory not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Third-Party APIs / External Integrations), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create third-party API inventory in Section 7 listing vendor, API name, base URL, authentication method, contact]

**External Service Dependencies**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: External dependencies documented with service names, vendors, criticality. If Non-Compliant: Undocumented external dependencies. If Not Applicable: No external dependencies. If Unknown: Dependencies not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → External Dependencies), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document all external service dependencies in Section 7 with criticality assessment (critical, high, medium, low)]

### 5.2 Third-Party API Documentation Standards

**API Specification Availability**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party APIs provide OpenAPI/Swagger specification or equivalent documentation. If Non-Compliant: APIs lack formal specification. If Not Applicable: No third-party APIs. If Unknown: API documentation availability not confirmed]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Third-Party API Documentation), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify third-party API documentation in Section 7. Request OpenAPI spec from vendors or create internal specification]

**Integration Guides and Examples**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Third-party vendors provide integration guides, code examples, SDKs. If Non-Compliant: Minimal documentation or trial-and-error integration. If Not Applicable: No third-party integrations. If Unknown: Integration guide availability not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Third-Party Integration Guides), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document integration guide availability in Section 7. Request comprehensive integration documentation from vendors]

### 5.3 Third-Party SLA and Support

**Third-Party SLA Documentation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: SLAs documented for third-party APIs (availability, response time, rate limits). If Non-Compliant: No SLA documentation or unknown service levels. If Not Applicable: No third-party APIs. If Unknown: SLAs not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Third-Party SLAs), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document third-party API SLAs in Section 7. Include availability guarantees, response time targets, rate limits]

**Support Contact Information**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Support contacts documented for third-party vendors (email, portal, escalation path). If Non-Compliant: No support contact information. If Not Applicable: No third-party APIs. If Unknown: Support contacts not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Third-Party Support Contacts), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document third-party vendor support contacts in Section 7 with escalation procedures]

---

## 6. Traceability and Audit (LAI6)

**Requirement**: Guarantee integration with standard formats for logs and traces, ensuring distributed tracing, correlation IDs, structured logging, and integration with observability platforms.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / SRE Team or N/A]

### 6.1 Distributed Tracing

**Distributed Tracing Implementation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Distributed tracing implemented across all integrations (OpenTelemetry, Jaeger, Zipkin, Azure Application Insights). If Non-Compliant: No distributed tracing or siloed tracing. If Not Applicable: Monolithic application with no distributed calls. If Unknown: Distributed tracing not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Distributed Tracing) or Section 5 (Component Model → Observability), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement distributed tracing in Section 7 using OpenTelemetry standard. Instrument all API calls and service-to-service communications]

**Trace Context Propagation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Trace context propagated across service boundaries (W3C Trace Context standard, correlation IDs in headers). If Non-Compliant: Trace context not propagated or broken trace chains. If Not Applicable: No distributed architecture. If Unknown: Trace propagation not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Trace Propagation), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement W3C Trace Context standard in Section 7. Propagate traceparent and tracestate headers across all integrations]

### 6.2 Structured Logging

**Structured Logging Format**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Structured logging with standard format (JSON, key-value pairs, consistent schema). If Non-Compliant: Unstructured text logs or inconsistent formats. If Not Applicable: N/A (logging required). If Unknown: Logging format not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Logging Standards) or Section 5 (Component Model → Logging), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement structured JSON logging in Section 7 with standard fields (timestamp, level, message, correlation_id, service_name)]

**Log Correlation IDs**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: All logs include correlation IDs for request tracing across services. If Non-Compliant: Logs lack correlation IDs or inconsistent ID usage. If Not Applicable: N/A (correlation required). If Unknown: Correlation ID usage not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Correlation IDs), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement correlation ID propagation in Section 7. Generate at API gateway, propagate through all service calls, include in all log entries]

### 6.3 Observability Platform Integration

**Centralized Logging Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Logs sent to centralized platform (ELK Stack, Splunk, Azure Monitor, AWS CloudWatch). If Non-Compliant: Logs stored locally or not centralized. If Not Applicable: N/A (centralized logging required). If Unknown: Logging platform not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Logging Platform) or Section 5 (Component Model → Logging Infrastructure), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement centralized logging in Section 7. Ship all integration logs to organizational logging platform]

**Trace and Log Integration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Traces and logs integrated with unified correlation (trace ID in logs, log links in traces). If Non-Compliant: Traces and logs in separate systems without correlation. If Not Applicable: No distributed tracing. If Unknown: Trace-log integration not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Observability Integration), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Integrate traces and logs in Section 7. Include trace IDs in log entries and provide log query links in trace UIs]

---

## 7. Event-Driven Integration Compliance (LAI7)

**Requirement**: Ensure compliance with event-driven integration guidelines including event schema standards, event versioning, event catalog, consumer contracts, and event delivery guarantees.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / Event Architect or N/A]

### 7.1 Event Schema Standards

**Event Schema Definition**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event schemas defined with standard format (JSON Schema, Avro, Protocol Buffers). If Non-Compliant: Unstructured events or no schema validation. If Not Applicable: No event-driven architecture. If Unknown: Event schemas not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Event Schemas) or Section 7 (Integration View → Event Definitions), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define event schemas in Section 6 using JSON Schema or Avro. Include schema versioning and validation]

**CloudEvents Compliance**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Events follow CloudEvents specification for metadata (id, source, type, time). If Non-Compliant: Custom event format without standard metadata. If Not Applicable: No event-driven architecture. If Unknown: CloudEvents compliance not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Event Format / CloudEvents), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Adopt CloudEvents specification in Section 6 for event metadata standardization. Include required fields: id, source, specversion, type]

### 7.2 Event Versioning and Compatibility

**Event Versioning Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event versioning strategy defined (schema evolution, backward/forward compatibility). If Non-Compliant: Breaking schema changes without versioning. If Not Applicable: No events. If Unknown: Event versioning not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Event Versioning), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define event versioning strategy in Section 6. Include schema evolution rules (add optional fields, deprecate fields gracefully)]

**Schema Registry Implementation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Schema registry used for event schema management (Confluent Schema Registry, Azure Schema Registry). If Non-Compliant: No schema registry or manual schema management. If Not Applicable: No event-driven architecture. If Unknown: Schema registry not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Schema Registry) or Section 5 (Component Model → Schema Registry), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement schema registry in Section 6 for centralized schema versioning and compatibility checks]

### 7.3 Event Catalog and Governance

**Event Catalog**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event catalog documenting all events (name, schema, producers, consumers, purpose). If Non-Compliant: Events lack documentation or unknown producers/consumers. If Not Applicable: No events. If Unknown: Event catalog not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Event Catalog) or Section 7 (Integration View → Event Catalog), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Create event catalog in Section 6/7 listing all domain events, event types, producers, consumers, and schemas]

**Consumer Contracts**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Consumer contracts defined for event subscriptions (consumer testing, contract testing). If Non-Compliant: No consumer contracts or unknown event dependencies. If Not Applicable: No events. If Unknown: Consumer contracts not documented]
- Source: [ARCHITECTURE.md Section 7 (Integration View → Consumer Contracts), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define consumer contracts in Section 7. Implement contract testing to prevent breaking changes for consumers]

### 7.4 Event Delivery Guarantees

**Event Delivery Semantics**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Event delivery guarantees defined (at-least-once, at-most-once, exactly-once). If Non-Compliant: Undefined delivery semantics or message loss/duplication. If Not Applicable: No events. If Unknown: Delivery guarantees not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Event Delivery Guarantees) or Section 7 (Integration View → Messaging Guarantees), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define event delivery guarantees in Section 6. Document idempotency requirements for at-least-once delivery]

**Dead Letter Queue (DLQ) Handling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: DLQ configured for failed event processing with monitoring and retry policies. If Non-Compliant: No DLQ or unmonitored failures. If Not Applicable: No asynchronous events. If Unknown: DLQ handling not documented]
- Source: [ARCHITECTURE.md Section 6 (Data Model → Dead Letter Queue) or Section 7 (Integration View → Error Handling), lines X-Y or "Not documented"]
- Note: [If Non-Compliant or Unknown: Implement DLQ for event failures in Section 6. Define retry policies, monitoring, and manual intervention procedures]

---

## Appendix

### A.1 Definitions and Terminology

**Integration Architecture**: The design and implementation of connections between systems, services, and data sources using APIs, events, messaging, and other integration patterns.

**Domain API**: RESTful API exposing a bounded context's capabilities following domain-driven design principles.

**LAI (Integration Architecture Requirements)**: Organizational standards for integration architecture covering best practices, security, technology currency, governance, documentation, traceability, and event-driven patterns.

**API Catalog**: Comprehensive inventory of all APIs including endpoints, authentication, SLAs, consumers, and documentation.

**Distributed Tracing**: Observability technique tracking requests across distributed services using correlation IDs and trace context.

**CloudEvents**: CNCF specification for describing events in a common format to ensure interoperability.

**Schema Registry**: Centralized repository for event and message schemas with versioning and compatibility enforcement.

**Dead Letter Queue (DLQ)**: Queue for messages/events that fail processing after retry attempts, enabling manual inspection and remediation.

### A.2 Validation Methodology

This document is validated using an automated scoring system defined in `/skills/architecture-compliance/validation/integration_architecture_validation.json`.

**Validation Scoring**:
- **Completeness Score** (30%): Percentage of required fields populated
- **Compliance Score** (60%): Percentage of validation items with PASS or N/A status
- **Quality Score** (10%): Source traceability coverage

**Final Score Calculation**:
```
Final Score = (Completeness × 0.30) + (Compliance × 0.60) + (Quality × 0.10)
```

**Validation Item Statuses**:
- ✅ **PASS** (10 points): Complies with LAI requirement
- ❌ **FAIL** (0 points): Non-compliant or uses deprecated/insecure technologies
- ⚪ **N/A** (10 points): Not applicable to this architecture (counts as compliant)
- ❓ **UNKNOWN** (0 points): Missing data in ARCHITECTURE.md
- 🔓 **EXCEPTION** (10 points): Documented and approved exception

**Score Interpretation**:
- **8.0-10.0**: High confidence → Auto-approved by system
- **7.0-7.9**: Passed validation → Manual review by Integration Architecture Review Board
- **5.0-6.9**: Conditional → Address gaps before review
- **0.0-4.9**: Rejected → Critical integration failures, cannot proceed

### A.3 Document Completion Guide

**For UNKNOWN Items** (Missing Data):
1. Locate the corresponding section in ARCHITECTURE.md (refer to Source field)
2. Add the required integration architecture information:
   - **LAI1**: Document domain APIs, API catalog, design standards, versioning, error handling, documentation
   - **LAI2**: Document API authentication, authorization, encryption (TLS 1.2+), secrets management, security logging
   - **LAI3**: Document integration protocols (HTTP/2, REST), message brokers (Kafka, RabbitMQ), no legacy ESB
   - **LAI4**: Document API naming conventions, lifecycle management, change control, governance playbook compliance
   - **LAI5**: Document third-party API inventory, API specifications, integration guides, SLAs, support contacts
   - **LAI6**: Document distributed tracing (OpenTelemetry), correlation IDs, structured logging (JSON), centralized platform
   - **LAI7**: Document event schemas (JSON Schema/Avro), CloudEvents compliance, event catalog, delivery guarantees, DLQ
3. Regenerate this compliance contract to reflect updated data

**For FAIL Items** (Non-Compliant):
1. **Obsolete Technologies**: Upgrade deprecated integration technologies (SOAP 1.0, WebSphere MQ, legacy ESB)
2. **Security Gaps**: Implement secure authentication (OAuth 2.0, mTLS), TLS 1.2+, vault-based secrets
3. **Missing Standards**: Implement API governance (naming, versioning, change control, lifecycle management)
4. **Documentation Gaps**: Create API catalog, event catalog, third-party API inventory with SLAs
5. **Observability Gaps**: Implement distributed tracing, structured logging, correlation IDs, centralized logging
6. **Event Standards Gaps**: Define event schemas, implement schema registry, CloudEvents compliance, DLQ handling
7. **Approved Exceptions**: If technology/approach deviation required, document exception with risk acceptance in Section 12 (ADRs)

**For N/A Items**:
- Ensure N/A status is accurate (e.g., "No event-driven architecture" for LAI7 event requirements)
- N/A items count as fully compliant in validation scoring

**Improving Validation Score**:
- **Target 8.0+ for auto-approval**: Resolve all UNKNOWN and FAIL items, ensure comprehensive source references
- **Minimum 7.0 for manual review**: Address critical integration gaps, document remaining items with placeholders
- **Below 7.0**: Focus on required LAI items (LAI1, LAI2, LAI4, LAI6) before optional items (LAI3, LAI7)

### A.4 Change History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | [GENERATION_DATE] | Complete template replacement with 7 LAI requirements (LAI1-LAI7). Replaced generic integration catalog format with requirement-specific subsections following Cloud Architecture v2.0 structure. Added comprehensive validation framework with 21 subsections across 7 requirements. | Integration Architecture Team |
| 1.0 | [ORIGINAL_DATE] | Initial release with basic integration catalog and patterns. | Integration Architecture Team |

---

**Document End**

**Note**: This compliance contract is automatically generated from ARCHITECTURE.md. To update this document, modify the source architecture file and regenerate. All [PLACEHOLDER] items indicate missing data that should be added to ARCHITECTURE.md for complete compliance validation.
