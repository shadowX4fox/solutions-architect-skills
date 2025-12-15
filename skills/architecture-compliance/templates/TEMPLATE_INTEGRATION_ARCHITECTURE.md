# Compliance Contract: Integration Architecture

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 5, 6, 7, 9)
**Version**: 2.0

---

<!-- @include-with-config shared/sections/document-control.md config=integration-architecture -->

<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=integration-architecture -->

<!-- @include shared/fragments/compliance-score-calculation.md -->

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

<!-- @include shared/fragments/compliance-summary-footer.md -->

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

## Appendix: Source Traceability and Completion Status

### A.1 Definitions and Terminology

**Integration Architecture**: The design and implementation of connections between systems, services, and data sources using APIs, events, messaging, and other integration patterns.

**Domain API**: RESTful API exposing a bounded context's capabilities following domain-driven design principles.

**LAI (Integration Architecture Requirements)**: Organizational standards for integration architecture covering best practices, security, technology currency, governance, documentation, traceability, and event-driven patterns.

**API Catalog**: Comprehensive inventory of all APIs including endpoints, authentication, SLAs, consumers, and documentation.

**Distributed Tracing**: Observability technique tracking requests across distributed services using correlation IDs and trace context.

**CloudEvents**: CNCF specification for describing events in a common format to ensure interoperability.

**Schema Registry**: Centralized repository for event and message schemas with versioning and compatibility enforcement.

**Dead Letter Queue (DLQ)**: Queue for messages/events that fail processing after retry attempts, enabling manual inspection and remediation.

<!-- @include shared/fragments/status-codes.md -->

---

### A.2 Validation Methodology

This document is validated using an automated scoring system defined in `/skills/architecture-compliance/validation/integration_architecture_validation.json`.

**Validation Process**:

1. **Completeness Check (30% weight)**:
   - Counts filled data points across all LAI requirements
   - Formula: (Filled fields / Total required fields) × 10
   - Example: 19 out of 21 fields = 9.0/10 completeness

2. **Compliance Check (60% weight)**:
   - Evaluates each validation item as PASS/FAIL/N/A/UNKNOWN/EXCEPTION
   - Formula: (PASS + N/A + EXCEPTION items) / Total items × 10
   - **CRITICAL**: N/A items MUST be included in numerator
   - Example: 15 PASS + 4 N/A + 0 EXCEPTION out of 21 items = (15+4)/21 × 10 = 9.0/10

3. **Quality Check (10% weight)**:
   - Assesses source traceability (ARCHITECTURE.md section references)
   - Verifies explanation quality and actionable notes
   - Formula: (Items with valid sources / Total items) × 10

4. **Final Score Calculation**:
   ```
   Final Score = (Completeness × 0.3) + (Compliance × 0.6) + (Quality × 0.1)
   ```

**Validation Item Statuses**:
- ✅ **PASS** (10 points): Complies with LAI requirement
- ❌ **FAIL** (0 points): Non-compliant or uses deprecated/insecure technologies
- ⚪ **N/A** (10 points): Not applicable to this architecture (counts as compliant)
- ❓ **UNKNOWN** (0 points): Missing data in ARCHITECTURE.md
- 🔓 **EXCEPTION** (10 points): Documented and approved exception

**Outcome Determination**:
| Score Range | Document Status | Review Actor | Action |
|-------------|----------------|--------------|--------|
| 8.0-10.0 | Approved | System (Auto-Approved) | Ready for implementation |
| 7.0-7.9 | In Review | Integration Architecture Review Board | Manual review required |
| 5.0-6.9 | Draft | Architecture Team | Address integration gaps before review |
| 0.0-4.9 | Rejected | N/A (Blocked) | Cannot proceed - critical integration failures |

---

### A.3 Document Completion Guide

<!-- @include shared/sections/completion-guide-intro.md -->

---

#### A.3.1 Common Gaps Quick Reference

**Common Integration Architecture Gaps and Remediation**:

| Gap Description | Impact | ARCHITECTURE.md Section to Update | Recommended Action |
|-----------------|--------|----------------------------------|-------------------|
| API catalog missing or incomplete | LAI1 Non-Compliant | Section 7 (Integration View) | List all domain APIs with endpoints, authentication, consumers, SLAs |
| API design standards not documented | LAI1 Non-Compliant | Section 7 (Integration View) | Document REST principles, versioning strategy, error handling standards |
| API authentication not specified | LAI2 Non-Compliant | Section 9 (Security Architecture) | Specify OAuth 2.0, JWT, or mTLS for API security |
| Integration protocols undefined | LAI3 Unknown | Section 7 (Integration View) | Document HTTP/2, REST, message brokers (Kafka, RabbitMQ), no legacy ESB |
| API governance not defined | LAI4 Unknown | Section 7 (Integration View) | Define API naming conventions, lifecycle management, change control |
| Third-party API inventory missing | LAI5 Unknown | Section 7 (Integration View) | Inventory external APIs with vendors, endpoints, SLAs, support contacts |
| Distributed tracing not implemented | LAI6 Unknown | Section 7 (Integration View) | Implement OpenTelemetry, correlation IDs, structured logging |
| Event schemas not documented | LAI7 Unknown | Section 6 or 7 (Data Model/Integration) | Define event schemas with JSON Schema/Avro, CloudEvents compliance |
| Schema registry not specified | LAI7 Unknown | Section 7 (Integration View) | Specify schema registry (Confluent, AWS Glue), backward compatibility |
| Dead letter queue handling undefined | LAI7 Unknown | Section 7 (Integration View) | Define DLQ strategy, retention, reprocessing workflow |

---

#### A.3.2 Step-by-Step Remediation Workflow

<!-- @include shared/sections/remediation-workflow-guide.md -->

**Integration Architecture-Specific Examples**:

**Example 1: Adding Comprehensive API Catalog**
- **Gap**: Missing comprehensive API catalog
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add API catalog to Section 7 with table format:
   API Name, Endpoint, Authentication, Consumers, SLA, Owner.
   Include all domain APIs: User Service, Payment Service,
   Notification Service, Inventory Service"
  ```
- **Expected Outcome**: Section 7 with complete API catalog table including SLAs and ownership
- **Impact**: LAI1 → Compliant (+0.6 points)

**Example 2: Implementing Distributed Tracing**
- **Gap**: No distributed tracing implementation documented
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add distributed tracing to Section 7:
   OpenTelemetry SDK in all services,
   Jaeger backend for trace storage,
   W3C Trace Context propagation,
   100% sampling in prod with adaptive sampling"
  ```
- **Expected Outcome**: Section 7 with tracing architecture, propagation standards, backend config
- **Impact**: LAI6 → Compliant (+0.5 points)

**Example 3: Defining Schema Registry**
- **Gap**: Missing schema registry for event-driven architecture
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add schema registry to Section 7:
   Confluent Schema Registry with Kafka,
   Avro schemas for all events,
   backward compatibility enforcement,
   schema evolution policy"
  ```
- **Expected Outcome**: Section 7 with schema registry config, versioning, compatibility rules
- **Impact**: LAI7 → Compliant (+0.4 points)

**Example 4: API Governance Framework**
- **Gap**: API governance not defined
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add API governance to Section 7:
   Naming convention (kebab-case, plural nouns),
   Versioning strategy (URI versioning /v1/),
   Lifecycle stages (alpha, beta, stable, deprecated),
   Change control process with stakeholder approvals"
  ```
- **Expected Outcome**: Section 7 with governance standards, playbook compliance
- **Impact**: LAI4 → Compliant (+0.5 points)

**Example 5: Third-Party API Inventory**
- **Gap**: Third-party API inventory incomplete
- **Skill Command**:
  ```
  /skill architecture-docs
  "Add third-party API inventory to Section 7:
   Stripe Payment API (REST, OAuth 2.0, 99.9% SLA, support@stripe.com),
   SendGrid Email API (REST, API key, 99.95% SLA, support@sendgrid.com),
   Twilio SMS API (REST, Basic Auth, 99.95% SLA, help@twilio.com)
   Include API specs, integration guides, rate limits"
  ```
- **Expected Outcome**: Section 7 with third-party API catalog, SLAs, support contacts
- **Impact**: LAI5 → Compliant (+0.4 points)

---

#### A.3.3 Achieving Auto-Approve Status (8.0+ Score)

**Target Score Breakdown**:
- Completeness ({{completeness_percent}} weight): Fill all required integration architecture fields
- Compliance ({{compliance_percent}} weight): Convert UNKNOWN/FAIL to PASS
- Quality ({{quality_percent}} weight): Add source traceability for all integration points

**To Achieve AUTO_APPROVE Status (8.0+ score):**

1. **Complete API & Integration Documentation** (estimated impact: +0.6 points)
   - Create comprehensive API catalog with endpoints, auth, consumers, SLAs (Section 7)
   - Document API design standards: REST principles, versioning, error handling (Section 7)
   - Define API governance: naming, lifecycle, change control (Section 7)
   - Add third-party API inventory with vendors, endpoints, SLAs (Section 7)
   - Specify integration protocols: HTTP/2, REST, message brokers (Section 7)

2. **Enhance Observability & Event-Driven Architecture** (estimated impact: +0.3 points)
   - Implement distributed tracing: OpenTelemetry, correlation IDs (Section 7)
   - Add structured logging with centralized platform (Section 11)
   - Define event schemas with JSON Schema/Avro (Section 6 or 7)
   - Implement schema registry with backward compatibility (Section 7)
   - Document DLQ handling and reprocessing workflow (Section 7)

3. **Strengthen Security & Standards Compliance** (estimated impact: +0.2 points)
   - Document API authentication: OAuth 2.0, JWT, or mTLS (Section 9)
   - Add TLS 1.2+ encryption for all API communications (Section 9)
   - Define secrets management for API keys (Vault, Key Vault) in Section 9
   - Ensure CloudEvents compliance for event-driven patterns (Section 7)
   - Add API security logging and threat detection (Section 9)

**Priority Order**: LAI1 (API catalog) → LAI2 (API auth) → LAI4 (API governance) → LAI6 (distributed tracing) → LAI5 (third-party APIs) → LAI3 (protocols) → LAI7 (event schemas)

**For FAIL Items**:
- **Obsolete Technologies**: Upgrade SOAP 1.0, WebSphere MQ, legacy ESB to REST, Kafka, modern integration
- **Security Gaps**: Implement OAuth 2.0/mTLS, TLS 1.2+, vault-based secrets
- **Missing Standards**: Implement API governance, event schema registry, CloudEvents compliance
- **Approved Exceptions**: Document exception with risk acceptance in Section 12 (ADRs)

**Estimated Final Score After Remediation**: 8.3-8.8/10 (AUTO_APPROVE)

---

### A.4 Change History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | [GENERATION_DATE] | Complete template replacement with 7 LAI requirements (LAI1-LAI7). Replaced generic integration catalog format with requirement-specific subsections following Cloud Architecture v2.0 structure. Added comprehensive validation framework with 21 subsections across 7 requirements. Added Data Extracted Successfully, Missing Data, Not Applicable, and Unknown Status sections. Aligned with standardized appendix format. | Integration Architecture Team |
| 1.0 | [ORIGINAL_DATE] | Initial release with basic integration catalog and patterns. | Integration Architecture Team |

---

<!-- CRITICAL: The sections below use @include directives that expand to H2 headers.
     DO NOT add section numbers (A.5, A.6, etc.) to these headers.
     The resolved content will be ## Header format - preserve it exactly.
     Validation rule 'forbidden_section_numbering' will BLOCK numbered sections after A.4. -->

<!-- @include-with-config shared/sections/data-extracted-template.md config=integration-architecture -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=integration-architecture -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=integration-architecture -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=integration-architecture -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=integration-architecture -->

---

**Note**: This compliance contract is automatically generated from ARCHITECTURE.md. Status labels (Compliant/Non-Compliant/Not Applicable/Unknown) and responsible roles must be populated during generation based on available data. Items marked as Non-Compliant or Unknown require stakeholder action to complete the architecture documentation. To update this document, modify the source architecture file and regenerate. All [PLACEHOLDER] items indicate missing data that should be added to ARCHITECTURE.md for complete compliance validation.
