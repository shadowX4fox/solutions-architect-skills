# Section 4: Meta Architecture - META 6-Layer Enterprise Model

<!-- ARCHITECTURE_TYPE: META -->

**Purpose**: Define the layered architecture model that organizes system components according to their responsibilities and functions.

This template follows the **META 6-Layer Enterprise Architecture** model, designed for large enterprise systems with complex integrations and regulatory compliance requirements.

---

## Layers Overview

| Layer | Function |
|-------|----------|
| **Channels** | Manages touchpoints and interaction with users (internal and external): web, mobile, ATMs, call center, etc. |
| **User Experience** | Orchestrates the experience and presentation of services, ensuring consistent and accessible interaction. |
| **Business Scenarios** | Defines and manages cross-cutting business flows and processes, integrating capabilities from different domains. |
| **Integration** | Consolidates core business capabilities and services, aligned with the organization's functional domains. |
| **Domain** | Implements Service Domains under the BIAN v12 model, ensuring functional consistency and alignment with financial sector standards. |
| **Core** | Includes central and legacy systems that support critical operations, such as core banking and transactional systems. |

---

## Layer Documentation Template

For each layer, document the following information:

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

---

## Example Implementation

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
- Inbound: User requests via HTTPS
- Outbound: REST API calls to User Experience layer
- Protocols: HTTPS/REST, OAuth 2.0, WebSockets (real-time notifications)

**Non-Functional Requirements**:
- Performance: <500ms response time for API calls
- Availability: 99.95% uptime (4.4 hours/year downtime)
- Scalability: Auto-scaling to handle 100K concurrent users

---

## Guidelines

1. **All 6 layers are required** in META architecture
2. **Document layers in order**: Channels → UX → Business Scenarios → Integration → Domain → Core
3. **Each layer must include all subsections**: Purpose, Components, Technologies, Key Responsibilities, Communication Patterns, Non-Functional Requirements
4. **Flow direction**: Requests typically flow top-down (Channels → Core), responses flow bottom-up
5. **Integration points**: Clearly define how each layer communicates with adjacent layers
6. **BIAN compliance**: Layer 5 (Domain) should align with BIAN v12 Service Domain model for financial services
7. **Modernization strategy**: Layer 6 (Core) should include plans for legacy system evolution

---

## Validation Checklist

- [ ] All 6 layers documented (Channels, UX, Business Scenarios, Integration, Domain, Core)
- [ ] Each layer has all required subsections
- [ ] Communication patterns defined for inter-layer communication
- [ ] Technologies specified for each layer
- [ ] Non-functional requirements quantified (not just placeholders)
- [ ] BIAN alignment documented in Layer 5 (Domain)
- [ ] Modernization strategy included in Layer 6 (Core)
- [ ] Flow diagrams or architecture diagrams referenced (optional but recommended)