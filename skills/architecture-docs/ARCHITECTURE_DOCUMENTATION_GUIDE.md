# Architecture Documentation Guide

> A comprehensive guide for creating system architecture documentation ARCHITECTURE.md

## Purpose

This guide provides a structured approach to documenting complex system architectures. Incorporates industry best practices for technical documentation.

**Use this guide when:**
- Starting a new system architecture from scratch
- Documenting an existing system's architecture
- Standardizing architecture documentation across multiple projects
- Onboarding teams to a new system
- Communicating architecture decisions to stakeholders

## Document Structure Overview

A comprehensive architecture document should follow this hierarchical structure:

```
1. Executive Summary
2. System Overview
3. Architecture Principles
4. Meta Architecture Layers
5. Component Details (Per Layer)
6. Data Flow Patterns
7. Integration Points
8. Technology Stack
9. Security Architecture
10. Scalability & Performance
11. Operational Considerations
12. Architecture Decision Records (ADRs)
```

**IMPORTANT**: Section names must match exactly as shown above. See the architecture-docs skill guide for strict section name enforcement rules.

---

## Document Index & Navigation

**Purpose**: Provide line number references for efficient document traversal and context-aware editing.

Every ARCHITECTURE.md document should include a **Document Index** at the beginning (before Section 1) that lists all major sections with their approximate line ranges. This enables:
- Quick navigation to specific sections without reading the entire document
- Context-efficient editing by loading only relevant sections
- Easy maintenance and updates to specific parts of the documentation

### Index Template

Place this index immediately after the document title and before Section 1:

```markdown
## Document Index

**Quick Navigation:**
- [Section 1: Executive Summary](#1-executive-summary) → Lines [START]-[END]
- [Section 2: System Overview](#2-system-overview) → Lines [START]-[END]
- [Section 3: Architecture Principles](#3-architecture-principles) → Lines [START]-[END]
- [Section 4: Meta Architecture Layers](#4-meta-architecture-layers) → Lines [START]-[END]
- [Section 5: Component Details](#5-component-details) → Lines [START]-[END]
- [Section 6: Data Flow Patterns](#6-data-flow-patterns) → Lines [START]-[END]
- [Section 7: Integration Points](#7-integration-points) → Lines [START]-[END]
- [Section 8: Technology Stack](#8-technology-stack) → Lines [START]-[END]
- [Section 9: Security Architecture](#9-security-architecture) → Lines [START]-[END]
- [Section 10: Scalability & Performance](#10-scalability--performance) → Lines [START]-[END]
- [Section 11: Operational Considerations](#11-operational-considerations) → Lines [START]-[END]
- [Section 12: Architecture Decision Records (ADRs)](#12-architecture-decision-records-adrs) → Lines [START]-[END]

**Index Last Updated:** YYYY-MM-DD

---
```

### How to Use the Index

**When Reading:**
1. Read lines 1-50 to locate the Document Index
2. Find your target section's line range in the index
3. Use `Read` tool with offset/limit to load only that section
4. Add 10-20 line buffer on each side to preserve context

**Example:**
```
# Index shows: Section 5: Component Details → Lines 601-850
# Load with context buffer:
Read(file_path="ARCHITECTURE.md", offset=590, limit=270)
# This reads lines 590-860 (10-line buffer + 250 lines + 10-line buffer)
```

**When Editing:**
After making significant changes to a section:
1. Use `grep -n "^## [0-9]" ARCHITECTURE.md` to find actual line numbers
2. Update the index with current line ranges
3. Update the "Index Last Updated" date

### Context Preservation Guidelines

When working with sections using the index:

**Minimal Context** (Small edits):
- Buffer: ±5-10 lines
- Use case: Updating a single paragraph or config value

**Standard Context** (Section edits):
- Buffer: ±10-20 lines
- Use case: Rewriting a subsection or adding new components

**Extended Context** (Cross-section edits):
- Buffer: ±20-50 lines
- Use case: Changes that reference adjacent sections

**Example Workflow:**
```bash
# Step 1: Read index to find section
Read(file_path="ARCHITECTURE.md", offset=1, limit=50)

# Step 2: Index shows Section 8: Tech Stack → Lines 1151-1300
# Step 3: Load with standard context (±15 lines)
Read(file_path="ARCHITECTURE.md", offset=1136, limit=179)
# Reads lines 1136-1315

# Step 4: Make edits using Edit tool
# Step 5: Verify changes
Read(file_path="ARCHITECTURE.md", offset=1136, limit=179)

# Step 6: Update index if section grew/shrunk significantly
```

---

## Section 1: Executive Summary

**Purpose**: High-level overview for executives and stakeholders.

**Important**: Before Section 1, include the Document Index with line number references for navigation.

**Complete Template (Including Index):**
```markdown
# [System Name] - [Tagline]

> [One-paragraph mission statement]

## Document Index

**Quick Navigation:**
- [Section 1: Executive Summary](#1-executive-summary) → Lines [START]-[END]
- [Section 2: System Overview](#2-system-overview) → Lines [START]-[END]
- [Section 3: Architecture Principles](#3-architecture-principles) → Lines [START]-[END]
- [Section 4: Meta Architecture Layers](#4-meta-architecture-layers) → Lines [START]-[END]
- [Section 5: Component Details](#5-component-details) → Lines [START]-[END]
- [Section 6: Data Flow Patterns](#6-data-flow-patterns) → Lines [START]-[END]
- [Section 7: Integration Points](#7-integration-points) → Lines [START]-[END]
- [Section 8: Technology Stack](#8-technology-stack) → Lines [START]-[END]
- [Section 9: Security Architecture](#9-security-architecture) → Lines [START]-[END]
- [Section 10: Scalability & Performance](#10-scalability--performance) → Lines [START]-[END]
- [Section 11: Operational Considerations](#11-operational-considerations) → Lines [START]-[END]
- [Section 12: Architecture Decision Records (ADRs)](#12-architecture-decision-records-adrs) → Lines [START]-[END]

**Index Last Updated:** YYYY-MM-DD

---

## 1. Executive Summary

### System Overview

[System description paragraph]

**Key Metrics:**
- **Metric 1**: [Value and context]
- **Metric 2**: [Value and context]
- **Metric 3**: [Value and context]

**Technology Stack:** [Primary technologies: language, framework, cloud platform]

**Deployment:** [Cloud provider, orchestration platform, deployment model]

**Business Value:**
- **Value Proposition 1**: [Impact statement]
- **Value Proposition 2**: [Impact statement]
- **Value Proposition 3**: [Impact statement]
```

**Instructions for Creating the Index:**

1. **Initial Creation**: Use placeholder line ranges [START]-[END] when creating a new document
2. **After Writing**: Once the document is complete, use `grep -n "^## [0-9]" ARCHITECTURE.md` to find actual line numbers
3. **Update Ranges**: Replace placeholders with actual line ranges
4. **Maintenance**: Update the index whenever making significant section changes
5. **Update Date**: Change "Index Last Updated" to the current date after updates

---

## Section 2: System Overview

**Purpose**: Context about the problem, solution, and key use cases.

**Template:**
```markdown
## System Overview

### Problem Statement
[Industry/domain] faces challenges with [specific problem]. Current solutions suffer from [pain points].

### Solution
[System name] addresses this by [approach]. Key differentiators: [3-5 bullet points]

### Design Drivers

This architecture is driven by the following key factors:

#### Value Delivery
**Description**: Effectiveness of change in customer experience
- **Threshold**: >50% = High Impact, ≤50% = Low Impact
- **Current Assessment**: [HIGH / LOW] Impact
- **Justification**: [Specific percentage or business value metric from Section 1 Executive Summary]
- **Example**: "System delivers 70% cost reduction (Section 1, line 52)" → HIGH

#### Scale
**Description**: Estimated number of customers impacted
- **Threshold**: >100K = High, ≤100K = Low
- **Current Assessment**: [HIGH / LOW] Impact
- **Justification**: [Specific customer/transaction volume from Section 2.3 Use Cases]
- **Example**: "System impacts 500,000 customers/day (Section 2.3, line 141)" → HIGH

#### Impacts
**Description**: Implementation complexity across configuration, development, and applications
- **Threshold**: >5 = High, ≤5 = Low
- **Current Assessment**: [HIGH / LOW] Impact
- **Justification**: [Component count from Section 5 + Technology count from Section 8]
- **Example**: "System requires 8 components/technologies (Section 5: 5, Section 8: 3)" → HIGH

**Last Calculated**: YYYY-MM-DD
**Calculation Method**: [Automatic / Manual Override]

**Note**: Design Drivers can be automatically calculated using the architecture-docs skill during architecture reviews. The skill will extract metrics from Sections 1, 2.3, 5, and 8 to determine impact levels.

### Primary Use Cases
1. **Use Case 1**: [Description]
2. **Use Case 2**: [Description]
3. **Use Case 3**: [Description]
```

**Design Drivers Guidance:**

The Design Drivers subsection provides a quantifiable assessment of the architecture's impact across three dimensions:

1. **Value Delivery**: Measures the effectiveness of the change from a customer experience perspective. Look for percentage improvements in Section 1's business value bullets (cost reduction, efficiency gains, time savings). If any metric exceeds 50%, classify as HIGH.

2. **Scale**: Measures the breadth of impact by counting affected customers or transactions. Extract volume metrics from Section 2.3 Use Cases success metrics. Thresholds of 100K+ customers or transactions indicate HIGH scale impact.

3. **Impacts**: Measures implementation complexity by counting the number of components and technologies. Sum the component headers in Section 5 with technology table rows in Section 8. More than 5 total indicates HIGH complexity impact.

**When to Calculate**:
- During initial architecture documentation (manual assessment)
- After significant architecture changes (prompted by skill during reviews)
- When validating architecture decisions against business goals

**Automation Support**:
The architecture-docs skill includes a Design Drivers calculation workflow that:
- Automatically extracts metrics from relevant sections
- Applies threshold rules to determine impact levels
- Generates justifications with source line numbers
- Presents results for user review and approval
- Updates Section 2.2.1 with calculated values

To trigger calculation, request an "architecture review" or explicitly ask to "calculate design drivers".

---

## Section 3: Architecture Principles

**Purpose**: Guiding principles that drive architectural decisions.

**Required Principles (in order):**

All architecture documents must include these 9 core principles in this exact order:

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **High Availability**: System remains operational during infrastructure failures
3. **Scalability First**: Design for horizontal scalability from day one
4. **Security by Design**: Security is not an afterthought
5. **Observability**: All components emit metrics, logs, and traces
6. **Resilience**: System degrades gracefully under failure
7. **Simplicity**: Choose the simplest solution that meets requirements
8. **Cloud-Native**: Design for cloud deployment and orchestration
9. **Open Standards**: Prefer open standards over proprietary solutions

**Optional Principle:**

10. **Event-Driven Architecture**: *(Include only if your system uses event-driven patterns)*
    - Loose coupling via domain events
    - Asynchronous communication patterns

**Template Structure:**

Each principle must follow this three-part structure:

```markdown
## Architecture Principles

### 1. Separation of Concerns

**Description:**
Each component has a single, well-defined responsibility with clear boundaries between layers and modules.

**Implementation:**
- [How this principle is applied in your system]
- [Specific technologies, patterns, or architectural choices]
- [Examples of separation in your architecture]

**Trade-offs:**
- [Costs or downsides of implementing this principle]
- [Complexity introduced, performance impacts, etc.]

### 2. High Availability

**Description:**
System remains operational during infrastructure failures through redundancy and fault tolerance.

**Implementation:**
- [Your HA strategy: clustering, multi-zone deployment, etc.]
- [Specific configurations and technologies used]
- [Health checks, failover mechanisms]

**Trade-offs:**
- [Increased infrastructure complexity and cost]
- [Additional operational overhead]

### 3. Scalability First

**Description:**
Design for horizontal scalability from day one, enabling linear capacity scaling by adding resources.

**Implementation:**
- [Stateless services, auto-scaling configuration]
- [Specific scaling strategies and triggers]
- [Technologies used: Kubernetes HPA, load balancers, etc.]

**Trade-offs:**
- [State management complexity]
- [Distributed coordination challenges]

### 4. Security by Design

**Description:**
Security is not an afterthought but built into every layer with encryption, authentication, and authorization.

**Implementation:**
- [Encryption standards: mTLS, TLS version]
- [Authentication/authorization: OAuth, RBAC, etc.]
- [Secrets management, key vault solutions]
- [Audit logging and compliance measures]

**Trade-offs:**
- [Performance overhead from encryption]
- [Development complexity increase]

### 5. Observability

**Description:**
All components emit metrics, logs, and traces to provide full visibility into system behavior and failures.

**Implementation:**
- [Logging strategy: structured logging, correlation IDs]
- [Metrics collection: Prometheus, CloudWatch, etc.]
- [Tracing: distributed tracing tools]
- [Dashboards and alerting setup]

**Trade-offs:**
- [Storage and processing overhead for metrics/logs]
- [Additional infrastructure cost]

### 6. Resilience

**Description:**
System degrades gracefully under failure with automatic handling of transient issues and isolation of persistent failures.

**Implementation:**
- [Retry strategies: exponential backoff]
- [Circuit breakers and bulkheads]
- [Timeouts and dead-letter queues]
- [Graceful degradation patterns]

**Trade-offs:**
- [Increased complexity in error handling logic]
- [Potential for delayed failure detection]

### 7. Simplicity

**Description:**
Choose the simplest solution that meets requirements, avoiding over-engineering and unnecessary complexity.

**Implementation:**
- [Technology choices favoring simplicity]
- [Design patterns chosen for clarity]
- [Examples of choosing simple over complex solutions]

**Trade-offs:**
- [May require refactoring as requirements grow]
- [Balance between simplicity and flexibility]

### 8. Cloud-Native

**Description:**
Design for cloud deployment and orchestration, leveraging cloud platform capabilities.

**Implementation:**
- [Container orchestration: Kubernetes, ECS, etc.]
- [Cloud services utilized: managed databases, message queues]
- [Infrastructure as Code approach]
- [12-factor app principles applied]

**Trade-offs:**
- [Potential vendor lock-in]
- [Cloud provider dependency]

### 9. Open Standards

**Description:**
Prefer open standards over proprietary solutions to ensure interoperability and avoid vendor lock-in.

**Implementation:**
- [Standard protocols: REST, gRPC, OpenAPI]
- [Open source technologies chosen]
- [Industry standards followed]

**Trade-offs:**
- [May miss proprietary optimizations]
- [Potential performance trade-offs]

### 10. Event-Driven Architecture *(Optional - include only if applicable)*

**Description:**
Loose coupling via domain events instead of synchronous coupling, enabling asynchronous communication patterns.

**Implementation:**
- [Event publishing: Kafka, EventBridge, etc.]
- [Consumer groups and subscription model]
- [Idempotent event handlers]
- [Event sourcing patterns if used]

**Trade-offs:**
- [Eventual consistency requires careful handling]
- [Increased debugging complexity]
- [Message ordering challenges]
```

**Important Notes:**

- All 9 core principles are **required** in every ARCHITECTURE.md
- Principles must appear in the **exact order** listed above
- Each principle must include all three subsections: **Description**, **Implementation**, and **Trade-offs**
- The **Implementation** section must be customized with system-specific details (not generic placeholders)
- The **Trade-offs** section must honestly assess the costs and downsides
- Event-Driven Architecture (principle #10) is **optional** and should only be included if the system actually uses event-driven patterns

---

## Section 4: Meta Architecture Layers

**Purpose**: Define the layered architecture model that organizes system components according to their responsibilities and functions.

## Layers

| Layer | Function |
|-------|----------|
| **Channels** | Manages touchpoints and interaction with users (internal and external): web, mobile, ATMs, call center, etc. |
| **User Experience** | Orchestrates the experience and presentation of services, ensuring consistent and accessible interaction. |
| **Business Scenarios** | Defines and manages cross-cutting business flows and processes, integrating capabilities from different domains. |
| **Integration** | Consolidates core business capabilities and services, aligned with the organization's functional domains. |
| **Domain** | Implements Service Domains under the BIAN v12 model, ensuring functional consistency and alignment with financial sector standards. |
| **Core** | Includes central and legacy systems that support critical operations, such as core banking and transactional systems. |

---

### Layer Documentation Template

For each layer, document the following information:

**Template:**
```markdown
## Meta Architecture Layers

### Layer 1: Channels

**Purpose**: [What this layer provides to the business/users]

**Components**:
- Component 1: [Name and brief description]
- Component 2: [Name and brief description]
- Component 3: [Name and brief description]

**Technologies**:
- Primary: [Main technology stack]
- Supporting: [Additional technologies, frameworks]

**Key Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**Communication Patterns**:
- Inbound: [How this layer receives requests]
- Outbound: [How this layer communicates with other layers]
- Protocols: [HTTP/REST, gRPC, messaging, etc.]

**Non-Functional Requirements**:
- Performance: [Latency, throughput requirements]
- Availability: [SLA, uptime requirements]
- Scalability: [How this layer scales]

---

### Layer 2: User Experience

**Purpose**: [What this layer provides to the business/users]

**Components**:
- BFF (Backend for Frontend): [Description]
- API Gateway: [Description]
- Session Management: [Description]

**Technologies**:
- Primary: [Main technology stack]
- Supporting: [Additional technologies, frameworks]

**Key Responsibilities**:
- Service orchestration and composition
- User session management
- Experience personalization
- Response formatting and aggregation

**Communication Patterns**:
- Inbound: [From Channels layer]
- Outbound: [To Business Scenarios and Integration layers]
- Protocols: [REST, GraphQL, etc.]

**Non-Functional Requirements**:
- Performance: [Response time targets]
- Availability: [High availability requirements]
- Scalability: [Horizontal scaling approach]

---

### Layer 3: Business Scenarios

**Purpose**: [What this layer provides to the business/users]

**Components**:
- Scenario Orchestrator: [Description]
- Process Engine: [Description]
- Business Rules Engine: [Description]

**Technologies**:
- Primary: [Workflow/orchestration technology]
- Supporting: [Rules engine, process automation]

**Key Responsibilities**:
- Cross-domain business process orchestration
- Business rule execution
- Transaction coordination
- Workflow management

**Communication Patterns**:
- Inbound: [From User Experience layer]
- Outbound: [To Integration and Domain layers]
- Protocols: [Sync/async patterns, events]

**Non-Functional Requirements**:
- Performance: [Process execution time]
- Availability: [Business continuity requirements]
- Scalability: [Process volume handling]

---

### Layer 4: Integration

**Purpose**: [What this layer provides to the business/users]

**Components**:
- Enterprise Service Bus (ESB): [Description]
- API Management: [Description]
- Integration Adapters: [Description]

**Technologies**:
- Primary: [Integration platform]
- Supporting: [Message brokers, adapters]

**Key Responsibilities**:
- Service routing and mediation
- Protocol transformation
- Message translation
- Integration with external systems

**Communication Patterns**:
- Inbound: [From Business Scenarios layer]
- Outbound: [To Domain and external services]
- Protocols: [REST, SOAP, messaging, file transfer]

**Non-Functional Requirements**:
- Performance: [Message throughput]
- Availability: [Integration uptime]
- Scalability: [Message volume capacity]

---

### Layer 5: Domain

**Purpose**: [What this layer provides to the business/users]

**Service Domains** (BIAN v12):
- Service Domain 1: [Name, BIAN ID, description]
- Service Domain 2: [Name, BIAN ID, description]
- Service Domain 3: [Name, BIAN ID, description]

**Technologies**:
- Primary: [Microservices framework]
- Supporting: [Databases, caching, messaging]

**Key Responsibilities**:
- Implementation of BIAN Service Domains
- Domain-specific business logic
- Data ownership and management
- Domain event publishing

**Communication Patterns**:
- Inbound: [From Integration layer]
- Outbound: [To Core systems and other domains]
- Protocols: [REST, gRPC, domain events]

**BIAN Alignment**:
- Service Domain Model: [Version, compliance level]
- Control Records: [How implemented]
- Service Operations: [Activation, configuration, feedback]

**Non-Functional Requirements**:
- Performance: [Service response time]
- Availability: [Domain availability targets]
- Scalability: [Domain-specific scaling strategy]

---

### Layer 6: Core

**Purpose**: [What this layer provides to the business/users]

**Systems**:
- Core Banking System: [Name, vendor, version]
- Transaction Processing: [Name, description]
- Legacy Systems: [List of critical legacy systems]

**Technologies**:
- Primary: [Mainframe, core banking platform]
- Supporting: [Databases, interfaces]

**Key Responsibilities**:
- Account management
- Transaction processing
- Balance and ledger management
- Master data management

**Communication Patterns**:
- Inbound: [From Domain layer]
- Outbound: [Data replication, events]
- Protocols: [Legacy protocols, files, APIs]

**Modernization Strategy**:
- Current State: [Assessment of current systems]
- Target State: [Modernization goals]
- Migration Approach: [Strangler pattern, lift-and-shift, etc.]

**Non-Functional Requirements**:
- Performance: [Transaction processing rate]
- Availability: [24/7 uptime requirements]
- Scalability: [Capacity planning]
```

**Example Implementation:**

```markdown
## Meta Architecture Layers

### Layer 1: Channels

**Purpose**: Provide omnichannel access to banking services for retail and corporate customers.

**Components**:
- Mobile Banking App (iOS/Android): Native applications for retail customers
- Internet Banking Portal: Web-based portal for account management
- ATM Network Interface: Integration with ATM network for cash services
- Contact Center Platform: Unified platform for customer service representatives

**Technologies**:
- Primary: React Native (Mobile), Angular (Web), Java Spring Boot (APIs)
- Supporting: OAuth 2.0, Firebase, CDN (CloudFront)

**Key Responsibilities**:
- User authentication and authorization
- Channel-specific presentation logic
- Device management and security
- Multi-factor authentication orchestration

**Communication Patterns**:
- Inbound: User interactions via mobile, web, ATM, voice
- Outbound: REST APIs to User Experience layer
- Protocols: HTTPS/REST, WebSocket for real-time updates

**Non-Functional Requirements**:
- Performance: <200ms response time for UI interactions
- Availability: 99.95% uptime per channel
- Scalability: Support 1M concurrent mobile users

---

### Layer 2: User Experience

**Purpose**: Orchestrate personalized banking experiences across all channels.

**Components**:
- Mobile BFF: Backend for frontend optimized for mobile apps
- Web BFF: Backend for frontend optimized for web portal
- API Gateway: Kong API Gateway for routing and security
- Session Service: Distributed session management with Redis

**Technologies**:
- Primary: Node.js (BFF), Kong (API Gateway), Redis (Session)
- Supporting: JWT tokens, GraphQL, circuit breakers (Hystrix)

**Key Responsibilities**:
- Experience orchestration and service composition
- Session management and security token handling
- Response aggregation and formatting
- A/B testing and feature flag management

**Communication Patterns**:
- Inbound: REST/GraphQL from Channels layer
- Outbound: REST/gRPC to Business Scenarios and Integration layers
- Protocols: REST, GraphQL, gRPC

**Non-Functional Requirements**:
- Performance: p95 latency <100ms
- Availability: 99.99% uptime
- Scalability: Auto-scale 10-100 instances based on load

---

### Layer 5: Domain

**Purpose**: Implement core banking capabilities as BIAN v12 Service Domains.

**Service Domains** (BIAN v12):
- Customer Agreement (SD-001): Manages customer agreements and terms
- Current Account (SD-002): Handles current account operations
- Payment Execution (SD-003): Processes payment transactions
- Card Management (SD-004): Manages card lifecycle and operations

**Technologies**:
- Primary: Java Spring Boot microservices, PostgreSQL
- Supporting: Kafka (events), Redis (cache), Kubernetes

**Key Responsibilities**:
- BIAN Service Domain implementation
- Domain-specific business rules and validation
- Transactional data management
- Domain event publishing for cross-domain coordination

**Communication Patterns**:
- Inbound: REST APIs from Integration layer
- Outbound: REST to Core systems, Kafka events to other domains
- Protocols: REST (synchronous), Kafka (asynchronous events)

**BIAN Alignment**:
- Service Domain Model: BIAN v12.0
- Control Records: Implemented as aggregate roots
- Service Operations: Initiate, Update, Execute, Request, Retrieve

**Non-Functional Requirements**:
- Performance: <50ms service response time (p95)
- Availability: 99.99% uptime for critical domains
- Scalability: Horizontal scaling up to 50 instances per domain
```

---

## Section 5: Component Details (Per Layer)

**Purpose**: Deep dive into each component within every layer.

**For Each Component, Document:**

### Component Template
```markdown
### Component Name

**Type**: Service | Database | Message Queue | Cache | Gateway
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Package/directory path]

**Purpose**:
[1-2 sentence description of what this component does]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Other components this depends on]
- Depended by: [Components that depend on this]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]
```

**Example:**

> **Note:** The following example uses illustrative file paths (`services/user-service/`, `proto/user/v1/user.proto`) that represent a typical microservices project structure. When documenting your own system, replace these with your actual project paths.

```markdown
### User Service

**Type**: Microservice
**Technology**: Go 1.21 + gRPC
**Version**: v2.3.1
**Location**: `services/user-service/` *(example path)*

**Purpose**:
Manages user identity, authentication, and profile information.

**Responsibilities**:
- User registration and authentication
- Profile management
- Session management
- Role-based access control (RBAC)

**APIs/Interfaces**:
- gRPC API: `UserService` (see proto/user/v1/user.proto)
- REST API: `/api/v1/users/*` (via API Gateway transcoding)
- Events: Publishes to `user.created`, `user.updated` topics

**Dependencies**:
- PostgreSQL: User data persistence
- Redis: Session cache
- NATS: Event publishing

**Configuration**:
- `DB_CONNECTION_STRING`: PostgreSQL connection (required)
- `SESSION_TTL`: Session timeout in seconds (default: 3600)
- `BCRYPT_COST`: Password hashing cost (default: 12)

**Scaling**:
- Horizontal: Stateless, scales linearly with load
- Vertical: 2 vCPU, 4GB RAM per instance

**Failure Modes**:
- Database unavailable: Returns 503, sessions fail to persist
- Redis unavailable: Falls back to database sessions (slower)
- NATS unavailable: Events queued locally, retry on reconnect

**Monitoring**:
- Metrics: Request rate, latency, error rate, active sessions
- Alerts: Error rate > 1%, p99 latency > 500ms
- Logs: All authentication attempts, errors
```

---

## Section 6: Data Flow Patterns

**Purpose**: Document how data moves through the system for key operations.

**Template:**
```markdown
## Data Flow Patterns

### [Operation Name] Flow

**Flow Steps**:
1. Component A → Component B: [Action]
2. Component B → Component C: [Action]
[Continue for key steps]

**Performance**: [Latency p50/p99, throughput]
**Error Handling**: [Key error scenarios and mitigations]

### [Event Name] Event Flow

**Event**: `event.name.v1`
**Publisher**: [Component]
**Subscribers**: [Components]
**Guarantees**: [Delivery, ordering, retention]
```

---

## Section 7: Integration Points

**Purpose**: Document all external integrations and third-party dependencies.

**Template:**
```markdown
## Integration Points

### [Integration Name]

**Type**: REST API | gRPC | Message Queue | Database | SaaS
**Provider**: [Company/service name]
**Purpose**: [Why we integrate with this]

**Integration Details**:
- Protocol: [HTTP/HTTPS, gRPC, AMQP, etc.]
- Authentication: [API key, OAuth, mTLS, etc.]
- Endpoints: [Base URL, key endpoints]
- Rate Limits: [Requests per second/minute]
- SLA: [Uptime guarantee, support level]

**Data Exchanged**:
- Outbound: [What we send]
- Inbound: [What we receive]

**Error Handling**:
- Timeout: [Timeout value, retry logic]
- Rate limiting: [Backoff strategy]
- Service unavailable: [Fallback behavior]

**Monitoring**:
- Health check: [How we monitor availability]
- Metrics: [Integration-specific metrics]

**Security**:
- Credentials: [How stored (secrets manager, etc.)]
- Encryption: [TLS version, cipher suites]
- IP Whitelisting: [If applicable]

**Cost**:
- Pricing model: [Per request, monthly, etc.]
- Expected monthly cost: [Estimate]

**Documentation**:
- API Docs: [Link]
- Support: [Contact method]
```

---

## Section 8: Technology Stack

**Purpose**: Comprehensive list of all technologies used in the system.

**Template:**
```markdown
## Technology Stack

### Languages
| Language | Version | Use Case | Justification |
|----------|---------|----------|---------------|
| Go | 1.21+ | Backend services | Performance, concurrency |
| TypeScript | 5.0+ | Frontend | Type safety |
| Python | 3.11+ | Data processing | Libraries, ecosystem |

### Frameworks & Libraries
| Framework | Version | Component | Purpose |
|-----------|---------|-----------|---------|
| gRPC | 1.60+ | API layer | Inter-service communication |
| Vue 3 | 3.4+ | Frontend | UI framework |

### Databases
| Database | Version | Use Case | Data Type |
|----------|---------|----------|-----------|
| PostgreSQL | 16+ | Primary DB | Transactional data |
| Redis | 7.0+ | Cache | Session, temp data |
| ScyllaDB | 5.0+ | Time-series | Events, metrics |

### Infrastructure
| Service | Version | Purpose |
|---------|---------|---------|
| Kubernetes | 1.28+ | Orchestration |
| Docker | 24+ | Containerization |
| Terraform | 1.6+ | IaC |

### Observability
| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| Jaeger | Distributed tracing |
| ELK Stack | Log aggregation |

### Security
| Tool | Purpose |
|------|---------|
| HashiCorp Vault | Secrets management |
| cert-manager | Certificate management |
| OWASP ZAP | Security testing |

### CI/CD
| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD pipelines |
| ArgoCD | GitOps deployment |
| Trivy | Container scanning |
```

---

## Section 9: Security Architecture

**Purpose**: Document security controls, threat model, and compliance requirements.

**Template:**
```markdown
## Security Architecture

### Security Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum necessary permissions
3. **Zero Trust**: Verify everything, trust nothing
4. **Encryption Everywhere**: Data encrypted in transit and at rest

### Threat Model

**Assets**:
- User data (PII, credentials)
- Financial transactions
- API keys and secrets
- Intellectual property

**Threats**:
1. **Unauthorized Access**: [Mitigation]
2. **Data Breach**: [Mitigation]
3. **DDoS Attack**: [Mitigation]
4. **SQL Injection**: [Mitigation]
5. **Man-in-the-Middle**: [Mitigation]

### Security Controls

**Authentication & Authorization**:
- Method: [OAuth 2.0, JWT, mTLS, etc.]
- Session management: [Approach]
- MFA: [Required for whom]
- RBAC: [Role model]

**Network Security**:
- Network segmentation: [VPCs, subnets]
- Firewall rules: [Ingress/egress]
- DDoS protection: [Service/approach]
- WAF: [Rules, provider]

**Data Security**:
- Encryption at rest: [Algorithm, key management]
- Encryption in transit: [TLS version]
- PII handling: [Tokenization, masking]
- Backup encryption: [Approach]

**Application Security**:
- Input validation: [Framework, approach]
- Output encoding: [Method]
- CSRF protection: [Tokens]
- Rate limiting: [Per endpoint, global]

**Secrets Management**:
- Storage: [HashiCorp Vault, AWS Secrets Manager, etc.]
- Rotation: [Frequency, automation]
- Access control: [IAM policies]

**Compliance**:
- Standards: [SOC 2, PCI-DSS, GDPR, HIPAA, etc.]
- Audit logging: [What, where, retention]
- Data residency: [Requirements, implementation]

### Security Monitoring

**Detection**:
- IDS/IPS: [Tool, rules]
- Anomaly detection: [ML-based, rules-based]
- Vulnerability scanning: [Tool, frequency]

**Response**:
- Incident response plan: [Link to runbook]
- Security team contact: [On-call rotation]
- Breach notification: [Process, timeline]
```

---

## Section 10: Scalability & Performance

**Purpose**: Document how the system scales and performance characteristics.

**Template:**
```markdown
## Scalability & Performance

### Scalability Model

**Horizontal Scaling**:
| Component | Scaling Strategy | Limits |
|-----------|-----------------|--------|
| API Gateway | Auto-scale 2-50 instances | CPU > 70% |
| App Services | Auto-scale 3-100 instances | Request queue > 100 |
| Database | Read replicas (5 max) | Replication lag < 100ms |

**Vertical Scaling**:
| Component | Min Resources | Max Resources |
|-----------|--------------|---------------|
| App Service | 2 vCPU, 4GB RAM | 8 vCPU, 16GB RAM |
| Database | 4 vCPU, 16GB RAM | 32 vCPU, 128GB RAM |

**Data Partitioning**:
- Strategy: [Sharding, partitioning approach]
- Partition key: [Field used for partitioning]
- Rebalancing: [Automated or manual]

### Performance Targets

**Latency**:
| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Read API | <50ms | <100ms | <200ms |
| Write API | <100ms | <200ms | <500ms |
| Batch Job | N/A | N/A | <30min |

**Throughput**:
| Operation | Target | Peak | Limit |
|-----------|--------|------|-------|
| Read API | 10K req/s | 50K req/s | 100K req/s |
| Write API | 5K req/s | 20K req/s | 50K req/s |

**Capacity Planning**:
- Current load: [Metrics]
- Growth projection: [% per month/year]
- Capacity headroom: [Safety margin]
- Next scaling milestone: [When, what action]

### Performance Optimization

**Caching Strategy**:
- L1 (Application): [In-memory cache, TTL]
- L2 (Distributed): [Redis, TTL]
- CDN: [CloudFlare, assets cached]

**Database Optimization**:
- Indexing strategy: [Key indexes]
- Query optimization: [Approach]
- Connection pooling: [Pool size, timeout]

**Async Processing**:
- Message queue: [Technology]
- Background jobs: [Framework]
- Batch processing: [Schedule, size]
```

---

## Section 11: Operational Considerations

**Purpose**: Document deployment, monitoring, and operational procedures.

**Template:**
```markdown
## Operational Considerations

### Deployment

**Environments**:
- Development: [Purpose, update frequency]
- Staging: [Purpose, resembles production]
- Production: [Multi-region, HA setup]

**Deployment Strategy**:
- Method: [Blue-green, rolling, canary]
- Rollback procedure: [Automated, manual]
- Deployment frequency: [Daily, weekly, on-demand]
- Deployment windows: [Anytime, maintenance windows]

**Infrastructure as Code**:
- Tool: [Terraform, CloudFormation, etc.]
- Repository: [Git repo location]
- State management: [Remote state, locking]

### Monitoring & Observability

**Metrics**:
- **Golden Signals**: Latency, Traffic, Errors, Saturation
- **Business Metrics**: [Revenue, conversions, etc.]
- **Infrastructure Metrics**: [CPU, memory, disk, network]

**Dashboards**:
- Overview: [System health at a glance]
- Service-specific: [Per-service deep dive]
- Infrastructure: [Host, container metrics]

**Alerting**:
| Alert | Threshold | Severity | On-call |
|-------|-----------|----------|---------|
| API error rate | >1% | Critical | Yes |
| Database CPU | >80% | Warning | No |
| Disk space | <10% | Critical | Yes |

**Logging**:
- Format: [JSON, structured]
- Aggregation: [ELK, Loki, CloudWatch]
- Retention: [Duration per log level]
- PII handling: [Redaction, masking]

### Backup & Disaster Recovery

**Backup Strategy**:
| Data Store | Frequency | Retention | Location |
|------------|-----------|-----------|----------|
| PostgreSQL | Hourly | 30 days | S3 + Glacier |
| Redis | Daily | 7 days | S3 |
| File storage | Daily | 90 days | S3 + vault |

**Disaster Recovery**:
- RTO (Recovery Time Objective): [Target]
- RPO (Recovery Point Objective): [Target]
- Failover procedure: [Automated, manual]
- DR testing: [Frequency, procedure]

### Cost Management

**Cost Breakdown**:
| Service | Monthly Cost | Percentage |
|---------|-------------|------------|
| Compute | $X,XXX | XX% |
| Storage | $X,XXX | XX% |
| Network | $X,XXX | XX% |
| Managed Services | $X,XXX | XX% |
| **Total** | **$XX,XXX** | **100%** |

**Optimization Opportunities**:
- Reserved instances: [Potential savings]
- Storage tiering: [Cold data archival]
- Resource right-sizing: [Over-provisioned services]
```

---

## Section 12: Architecture Decision Records (ADRs)

**Purpose**: Document key architectural decisions in separate ADR files.

Architecture decisions should be documented using Architecture Decision Records (ADRs). For complete guidance on creating and managing ADRs, see [ADR_GUIDE.md](ADR_GUIDE.md).

**Template:**
```markdown
## Architecture Decision Records

Architectural decisions are documented in ADRs. See [ADR_GUIDE.md](ADR_GUIDE.md) for the complete ADR template and guidelines.

### Active ADRs

| ID | Title | Status | Date | Impact |
|----|-------|--------|------|--------|
| [ADR-001](adr/ADR-001.md) | [Title] | Accepted | YYYY-MM-DD | High/Medium/Low |
```

---

## References

**Related Guides:**
- [ADR_GUIDE.md](ADR_GUIDE.md) - Complete guide for Architecture Decision Records

**External Resources:**
- [C4 Model](https://c4model.com/) - Architecture diagram approach
- [arc42](https://arc42.org/) - Architecture documentation template
- [BIAN v12](https://bian.org/) - Banking Industry Architecture Network

---

**Document Version**: 2.0.0
**Last Updated**: 2025-01-18
**Maintained By**: Architecture Team