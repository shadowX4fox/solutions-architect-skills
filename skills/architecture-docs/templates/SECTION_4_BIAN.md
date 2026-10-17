# Section 4: Meta Architecture - BIAN 5-Layer Architecture

<!-- ARCHITECTURE_TYPE: BIAN -->

**Purpose**: Define the BIAN-compliant layered architecture model that organizes system components according to BIAN v14.0.0 business hierarchy and banking industry standards.

This template follows the **BIAN 5-Layer Architecture** pattern, designed for banking and financial services systems requiring full BIAN v14.0.0 certification and compliance across all architectural layers.

**BIAN Standard**: This template uses **BIAN v14.0.0** as the mandatory standard across Layers 2, 3, and 4. See the [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html) for official service domain definitions.

**Key Distinction from ENTERPRISE Architecture**: BIAN architecture implements full BIAN v14.0.0 compliance across three layers (Business Scenarios, Business Capabilities, and Service Domains), whereas ENTERPRISE architecture has no BIAN mandate and carries an optional Service Domain tag on Domain Services components. BIAN architecture is optimized for BIAN certification and complete traceability through the BIAN business hierarchy.

---

## Layers Overview

| Layer | Function | BIAN v14.0.0 Mapping |
|-------|----------|-------------------|
| **Layer 1: Channels** | User interaction points across all channels (web, mobile, ATM, branch, API). | Channel implementation patterns |
| **Layer 2: BIAN Business Scenarios** | Business process orchestration and scenario management. | BIAN Business Areas (8 areas) |
| **Layer 3: BIAN Business Capabilities** | Business capability management and coordination. | BIAN Business Domains (43 domains) |
| **Layer 4: BIAN Service Domains** | Atomic banking services following BIAN v14.0.0 service domain model. | BIAN Service Domains (341 domains) |
| **Layer 5: Core Systems** | Legacy and core banking systems providing foundational services. | System of record |

**BIAN Hierarchy Traceability**:
- **BIAN Business Areas** (8 areas) → Implemented in Layer 2: BIAN Business Scenarios
- **BIAN Business Domains** (43 domains) → Implemented in Layer 3: BIAN Business Capabilities
- **BIAN Service Domains** (341 domains) → Implemented in Layer 4: BIAN Service Domains

---

## Layer Documentation Template

For each layer, document the following information:

### Layer 1: Channels

**Purpose**: Manage user interaction across all banking channels (web, mobile, ATM, branch, API gateway)

**Components**:
- Component 1: [Name and brief description - e.g., Mobile Banking App]
- Component 2: [Name and brief description - e.g., Internet Banking Portal]
- Component 3: [Name and brief description - e.g., ATM Network Interface]
- Component 4: [Name and brief description - e.g., Branch Terminal System]

**Technologies**:
- Primary: [Main technology stack - e.g., React Native, Angular, Java]
- Supporting: [Additional technologies, frameworks - e.g., OAuth 2.0, Firebase]

**Key Responsibilities**:
- Provide omnichannel access to banking services
- Manage channel-specific user authentication
- Adapt user experience to channel capabilities
- Handle channel-specific security requirements
- Orchestrate multi-channel user journeys
- Manage session state across channels

**Communication Patterns**:
- Inbound: [How users interact with channels - HTTPS, mobile protocols]
- Outbound: [How channels communicate with Layer 2 - REST, GraphQL]
- Protocols: [HTTPS/REST, OAuth 2.0, WebSockets, etc.]

**Non-Functional Requirements**:
- Performance: [Latency, throughput requirements - e.g., <500ms response time]
- Availability: [SLA, uptime requirements - e.g., 99.95% uptime]
- Scalability: [How this layer scales - e.g., auto-scaling to 100K concurrent users]

---

### Layer 2: BIAN Business Scenarios

**Purpose**: Orchestrate transversal business processes and scenarios aligned with BIAN Business Areas

**BIAN v14.0.0 Alignment**: This layer maps business scenarios to the 8 BIAN Business Areas defined in [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html):
1. **Business Management** - Corporate direction, corporate relations and corporate services scenarios (strategy, legal compliance, internal audit)
2. **Resource Management** - Unit, buildings and equipment, human resources and platform operations scenarios
3. **Finance And Risk Management** - Market risk, compliance, financial control, credit risk, operational risk and group treasury scenarios
4. **Operations** - External agency, operational services, custody and collateral, clearing and settlement, accounting scenarios
5. **Products** - Consumer and corporate banking, cards, loans and deposits, market trading and corporate finance scenarios
6. **Customers** - Sales, relationship management, customer care, party reference and investment services scenarios
7. **Channels** - Information providers, cross-channel, channel-specific, distribution and servicing scenarios
8. **Business Development** - Marketing, product management, solution development, channel management, knowledge, models and analytics scenarios

Source: [bian_dir]/llms-bian.txt (index; open one per-area file only for the areas in scope).

**Components**:
- Business Scenario Orchestrator: [Description - e.g., Workflow engine coordinating BIAN Business Areas]
- Process Management: [Description - e.g., BPMN engine for scenario flows]
- Business Rules Engine: [Description - e.g., Rules engine for scenario logic]

**Technologies**:
- Primary: [Workflow/orchestration technology - e.g., Camunda, Apache Airflow]
- Supporting: [Rules engine, process automation - e.g., Drools, custom]

**Key Responsibilities**:
- Orchestrate end-to-end business scenarios across BIAN Business Areas
- Coordinate business capabilities (Layer 3) to fulfill scenarios
- Implement cross-domain business process flows
- Apply business rules and policies at scenario level
- Manage scenario state and lifecycle
- Ensure regulatory compliance for business scenarios

**BIAN Business Area Mapping**:
Document which BIAN Business Areas are implemented in this layer:

| Business Scenario | BIAN Business Area | BIAN Business Domains (Layer 3) | Description |
|-------------------|-------------------|--------------------------------|-------------|
| [Scenario Name] | [Business Management / Resource Management / Finance And Risk Management / Operations / Products / Customers / Channels / Business Development] | [List of Business Domains involved] | [What this scenario orchestrates] |

**Communication Patterns**:
- Inbound: [From Layer 1 Channels - REST, GraphQL]
- Outbound: [To Layer 3 BIAN Business Capabilities - REST, events]
- Protocols: [Synchronous: REST, gRPC; Asynchronous: Kafka, message queues]

**Non-Functional Requirements**:
- Performance: [Process execution time - e.g., <2 seconds for scenario orchestration]
- Availability: [Business continuity requirements - e.g., 99.9% uptime]
- Scalability: [Process volume handling - e.g., 10K concurrent scenarios]

---

### Layer 3: BIAN Business Capabilities

**Purpose**: Implement business capabilities aligned with BIAN Business Domains

**BIAN v14.0.0 Alignment**: This layer implements the 43 BIAN Business Domains defined in [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html). Each business domain groups related BIAN Service Domains (Layer 4).

**BIAN Business Domains** (examples - see [BIAN v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html) for complete list):
- **Relationship Management**: Customer agreement, customer relationship management, customer event history
- **Product Management**: Product directory, product design, product deployment
- **Channel Management**: Channel activity analysis, servicing mandate
- **Clearing And Settlement**: Payment orchestration, payment settlement, payment rail
- **Loans and Deposits**: Consumer loan, current account, savings account
- **Credit Risk**: Credit management, counterparty risk, fraud resolution
- **Compliance**: Regulatory compliance, regulatory reporting, compliance reporting
- [Additional business domains as applicable]

**Components**:
- Business Capability Services: [Description - e.g., Services implementing BIAN Business Domains]
- Business API Layer: [Description - e.g., API facade for business capabilities]
- Business Domain Coordinator: [Description - e.g., Coordinates service domains within a business domain]

**Technologies**:
- Primary: [Business services platform - e.g., Spring Boot, Node.js]
- Supporting: [API management, orchestration - e.g., Kong, Apigee]

**Key Responsibilities**:
- Implement BIAN Business Domain logic
- Coordinate BIAN Service Domains (Layer 4) within each business domain
- Expose business capabilities through standardized APIs
- Manage business domain state and lifecycle
- Enforce business domain policies and rules
- Ensure cross-domain consistency

**BIAN Business Domain Mapping**:
Document which BIAN Business Domains are implemented in this layer:

| BIAN Business Domain | BIAN Business Area (Layer 2) | BIAN Service Domains (Layer 4) | Responsibilities |
|---------------------|------------------------------|-------------------------------|------------------|
| [Domain Name] | [Parent Business Area] | [List of Service Domains in this domain] | [What this capability manages] |

**Communication Patterns**:
- Inbound: [From Layer 2 Business Scenarios - REST, events]
- Outbound: [To Layer 4 BIAN Service Domains - REST, gRPC, events]
- Protocols: [REST, gRPC, domain events, Kafka]

**Non-Functional Requirements**:
- Performance: [Capability response time - e.g., <300ms for API calls]
- Availability: [Business domain availability - e.g., 99.95% uptime]
- Scalability: [Domain-specific scaling - e.g., horizontal scaling by business domain]

---

### Layer 4: BIAN Service Domains

**Purpose**: Implement atomic banking services as defined by BIAN v14.0.0 Service Domain model

**BIAN v14.0.0 Alignment**: This layer implements the 341 BIAN Service Domains from the [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html). Each service domain is an atomic, independently deployable banking service.

**CRITICAL**: All service domains in this layer MUST be validated against the official [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html) to ensure accurate naming and compliance.

**Service Domain Documentation Template**:

For each BIAN Service Domain, document the following:

#### BIAN Service Domain: [Official BIAN Service Domain Name]

**BIAN Metadata** (MANDATORY):
- **Official BIAN Name**: [Exact name from BIAN Service Landscape v14.0.0 - e.g., "Payment Order Initiation", "Current Account"]
- **BIAN ID**: [Internal tracking ID - e.g., SD-001 for document tracking only]
- **BIAN Version**: v14.0.0 (mandatory)
- **BIAN Business Domain**: [Parent business domain - e.g., "Consumer Banking", "Loans and Deposits"]
- **BIAN Business Area**: [Parent business area - e.g., "Products"]
- **BIAN Service Landscape URL**: [Direct link to service domain in BIAN v14.0.0 landscape]

**Control Record** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- **Control Record Type**: [As defined in BIAN spec - e.g., "PaymentOrderInitiationTransaction"]
- **Structure**: [Document control record structure per BIAN specification]
- **Lifecycle**: [Active, completed, suspended states per BIAN]

**Service Operations** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
Document the standard BIAN service operations for this domain:
- **Initiate**: [Create new control record - description of initiate operation]
- **Update**: [Modify existing control record - description of update operation]
- **Retrieve**: [Query control record - description of retrieve operation]
- **Control**: [Manage control record lifecycle - description of control operation]
- **Exchange**: [If applicable - exchange operation description]
- **Execute**: [If applicable - execute operation description]
- **Request**: [If applicable - request operation description]

**Behavior Qualifiers** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- [List behavior qualifiers as defined in BIAN spec for this service domain]
- [Example: "registration", "valuation", "compliance" for specific domains]

**Functional Patterns** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- **Pattern Type**: [Managed Object, Tracked Object, Administered Object, Governed Object, etc.]
- **Pattern Description**: [How this service domain follows the BIAN functional pattern]

**Implementation Details**:
- **Technology Stack**: [Primary language/framework - e.g., Java/Spring Boot, Node.js]
- **Database**: [Data store - e.g., PostgreSQL, MongoDB]
- **API Endpoints**: [List key endpoints following BIAN service operations]
  - `POST /service-domain/initiate`: Initiate service domain
  - `PUT /service-domain/{id}/update`: Update control record
  - `GET /service-domain/{id}/retrieve`: Retrieve control record
  - `PUT /service-domain/{id}/control`: Control lifecycle

**Data Ownership**:
- [What data this service domain owns - aligned with BIAN control record]

**Dependencies**:
- **Upstream Service Domains**: [BIAN Service Domains this domain depends on]
- **Downstream Service Domains**: [BIAN Service Domains that depend on this domain]

**Events Published** (if event-driven):
- `[service-domain].[event-name]`: [When and what data - e.g., "payment-order.initiated"]

**Events Consumed** (if event-driven):
- `[other-domain].[event-name]`: [From which service domain, what action taken]

**Non-Functional Requirements**:
- Performance: [Service response time - e.g., <200ms p95]
- Availability: [Service SLA - e.g., 99.99% uptime]
- Scalability: [Scaling strategy - e.g., horizontal scaling 2-10 instances]

**BIAN Compliance Level**:
- **Level**: Full BIAN v14.0.0 Compliance (required for BIAN architecture type)
- **Validation Date**: [When compliance was validated]
- **Deviations**: [None for full compliance, or document any customizations]

---

**Technologies** (Layer 4 Overview):
- Primary: [Microservices framework - e.g., Spring Boot, Node.js]
- Supporting: [Databases, caching, messaging - e.g., PostgreSQL, Redis, Kafka]

**Key Responsibilities** (Layer 4 Overview):
- Implement BIAN Service Domain functional patterns
- Maintain BIAN control records per specification
- Expose BIAN service operations (Initiate, Update, Retrieve, Control, etc.)
- Ensure BIAN behavior qualifier implementation
- Manage service domain lifecycle per BIAN standards
- Publish domain events for state changes

**Communication Patterns**:
- Inbound: [From Layer 3 BIAN Business Capabilities - REST, gRPC]
- Outbound: [To Layer 5 Core Systems - REST, legacy protocols, events]
- Protocols: [REST, gRPC, Kafka, legacy protocols as needed]

**BIAN Service Domain Catalog**:

| BIAN Service Domain | BIAN ID | BIAN Business Domain | BIAN Business Area | Technology | Team Owner |
|--------------------|---------|---------------------|-------------------|------------|------------|
| [Official BIAN Name] | SD-001 | [Business Domain] | [Business Area] | [Tech Stack] | [Team] |
| [Official BIAN Name] | SD-002 | [Business Domain] | [Business Area] | [Tech Stack] | [Team] |
| [Official BIAN Name] | SD-003 | [Business Domain] | [Business Area] | [Tech Stack] | [Team] |

**Implementation Guidance**:
1. Validate all service domain names against the official [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
2. Assign internal BIAN IDs (SD-XXX format) for document tracking only
3. Implement all mandatory BIAN service operations for each service domain
4. Document control records per BIAN specification
5. Implement behavior qualifiers as defined in BIAN v14.0.0
6. Follow BIAN functional patterns (Managed Object, Tracked Object, etc.)
7. Ensure full traceability: Service Domain → Business Domain → Business Area

---

### Layer 5: Core Systems

**Purpose**: Provide foundational banking services through legacy and core banking systems

**Systems**:
- Core Banking System: [Name, vendor, version - e.g., Finacle 10.x, Temenos T24]
- Transaction Processing System: [Name, description]
- Legacy Mainframe: [System name, purpose]
- Master Data Management: [System for customer, product, reference data]

**Technologies**:
- Primary: [Core banking platform, mainframe - e.g., IBM z/OS, Oracle Database]
- Supporting: [Databases, interfaces, adapters - e.g., DB2, MQ, ESB]

**Key Responsibilities**:
- Provide system of record for core banking data
- Process critical banking transactions
- Maintain account balances and ledgers
- Ensure regulatory compliance and audit trails
- Support BIAN Service Domains (Layer 4) with foundational services
- Manage master data for customers, products, accounts

**Communication Patterns**:
- Inbound: [From Layer 4 BIAN Service Domains - REST APIs, legacy protocols]
- Outbound: [Data replication, events, batch files]
- Protocols: [Legacy protocols (MQ, file transfer), REST APIs, SOAP, database replication]

**BIAN Integration Strategy**:
- **Adapter Pattern**: [How core systems are wrapped to support BIAN Service Domains]
- **Data Synchronization**: [How core data is synchronized with BIAN service domains]
- **Transaction Coordination**: [How distributed transactions are managed]
- **Event Publishing**: [How core system events are published to BIAN layers]

**Modernization Strategy**:
- Current State: [Assessment of legacy systems and technical debt]
- Target State: [Modernization goals aligned with BIAN architecture]
- Migration Approach: [Strangler pattern, lift-and-shift, progressive modernization]
- BIAN Alignment: [How modernization supports BIAN compliance]
- Gradual Evolution: [Phased approach to minimize business disruption]

**Non-Functional Requirements**:
- Performance: [Transaction processing rate - e.g., 10K TPS]
- Availability: [24/7 uptime requirements - e.g., 99.99% availability]
- Scalability: [Capacity planning - e.g., vertical scaling for mainframe]
- Resilience: [Disaster recovery, backup strategy - e.g., RPO <15 min, RTO <1 hour]

---

## Example Implementation

### Layer 1: Channels - Mobile Banking App

**Purpose**: Provide retail customers with mobile access to banking services on iOS and Android.

**Components**:
- Mobile Banking App (iOS): Native iOS app using Swift
- Mobile Banking App (Android): Native Android app using Kotlin
- Mobile BFF (Backend for Frontend): Node.js API tailored for mobile clients

**Technologies**:
- Primary: Swift (iOS), Kotlin (Android), Node.js (BFF)
- Supporting: OAuth 2.0, Firebase Cloud Messaging, Biometric Authentication

**Key Responsibilities**:
- User authentication with biometrics (Face ID, Touch ID, fingerprint)
- Account overview and transaction history
- Fund transfers and bill payments
- Mobile-specific features (QR payments, mobile check deposit)
- Push notifications for account alerts

**Communication Patterns**:
- Inbound: User interactions via mobile app
- Outbound: HTTPS/REST to Mobile BFF, which calls Layer 2 Business Scenarios
- Protocols: HTTPS/REST, OAuth 2.0, WebSockets for real-time updates

**Non-Functional Requirements**:
- Performance: <500ms response time for API calls, <2s for screen load
- Availability: 99.95% uptime (4.4 hours/year downtime)
- Scalability: Support 500K monthly active users, auto-scaling BFF 2-10 instances

---

### Layer 4: BIAN Service Domain - Payment Order Initiation

#### BIAN Service Domain: Payment Order Initiation

**BIAN Metadata** (MANDATORY):
- **Official BIAN Name**: Payment Order Initiation
- **BIAN ID**: SD-001 (internal tracking)
- **BIAN Version**: v14.0.0
- **BIAN Business Domain**: Consumer Banking
- **BIAN Business Area**: Products
- **BIAN Service Landscape URL**: https://bian.org/servicelandscape-14-0-0/views/view_54486.html

**Control Record** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- **Control Record Type**: PaymentOrderInitiationTransaction
- **Structure**: Includes payment details, parties, amounts, dates, status
- **Lifecycle**: Initiated → In Progress → Completed / Failed / Cancelled

**Service Operations** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- **Initiate**: Create new payment order (validate parties, amounts, compliance)
- **Update**: Modify payment order details (before execution)
- **Retrieve**: Query payment order status and details
- **Control**: Manage payment order lifecycle (cancel, suspend, resume)
- **Execute**: Trigger payment execution (hand off to Payment Orchestration SD)

**Behavior Qualifiers** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- compliance, reporting, booking

**Functional Patterns** ([BIAN Standard](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)):
- **Pattern Type**: Tracked Object
- **Pattern Description**: Manages lifecycle of payment orders from initiation through completion

**Implementation Details**:
- **Technology Stack**: Java 17, Spring Boot 3.1, Spring Data JPA
- **Database**: PostgreSQL 15 (payment_orders, payment_order_events tables)
- **API Endpoints**:
  - `POST /payment-order/initiate`: Initiate new payment order
  - `PUT /payment-order/{id}/update`: Update payment order
  - `GET /payment-order/{id}/retrieve`: Retrieve payment order details
  - `PUT /payment-order/{id}/control`: Control payment order lifecycle
  - `POST /payment-order/{id}/execute`: Execute payment order

**Data Ownership**:
- Payment order control records
- Payment order status and lifecycle events
- Payment order compliance checks

**Dependencies**:
- **Upstream Service Domains**: Party Authentication (SD-004), Account Verification (SD-007)
- **Downstream Service Domains**: Payment Orchestration (SD-002), Payment Rail (SD-003)

**Events Published**:
- `payment-order.initiated`: When payment order created
- `payment-order.updated`: When payment order modified
- `payment-order.executed`: When payment handed to execution
- `payment-order.completed`: When payment fully processed
- `payment-order.failed`: When payment fails validation or execution

**Events Consumed**:
- `payment-execution.completed`: From Payment Orchestration (SD-002), updates payment order status
- `compliance.check-completed`: From Fraud Evaluation (SD-045), validates payment

**Non-Functional Requirements**:
- Performance: <200ms p95 response time, 1000 TPS
- Availability: 99.99% uptime (52 minutes/year downtime)
- Scalability: Horizontal scaling 3-15 pods based on load

**BIAN Compliance Level**:
- **Level**: Full BIAN v14.0.0 Compliance
- **Validation Date**: 2025-01-15
- **Deviations**: None

---

## Architecture Diagram (Mermaid)

**Purpose**: Visualize the BIAN layer structure, BIAN hierarchy mapping, and communication patterns between layers.

**Diagram Note**: Layer 4 components MUST reference official [BIAN v14.0.0 Service Domains](https://bian.org/servicelandscape-14-0-0/views/view_54486.html). All service domain names must be validated against the BIAN Service Landscape v14.0.0.

### BIAN Architecture Diagram Example

The following diagram shows a complete 5-layer BIAN architecture with BIAN Business Areas, Business Domains, and Service Domains:

````markdown
```mermaid
graph TB
    %% Layer 1: Channels
    subgraph Layer1["Layer 1: Channels"]
        Mobile["Mobile Banking App<br/>(iOS/Android)"]
        Web["Internet Banking<br/>(Web Portal)"]
        ATM["ATM Network"]
        Branch["Branch Terminals"]
    end

    %% Layer 2: BIAN Business Scenarios (BIAN Business Areas)
    subgraph Layer2["Layer 2: BIAN Business Scenarios<br/>(BIAN Business Areas)"]
        SalesService["Customers<br/>Scenarios"]
        Operations["Operations<br/>Scenarios"]
        RiskCompliance["Finance And Risk Management<br/>Scenarios"]
    end

    %% Layer 3: BIAN Business Capabilities (BIAN Business Domains)
    subgraph Layer3["Layer 3: BIAN Business Capabilities<br/>(BIAN Business Domains)"]
        CustomerMgmt["Relationship Management<br/>Business Domain"]
        Payments["Clearing And Settlement<br/>Business Domain"]
        LoansDeposits["Loans and Deposits<br/>Business Domain"]
        RiskMgmt["Credit Risk<br/>Business Domain"]
    end

    %% Layer 4: BIAN Service Domains (BIAN v14.0.0)
    subgraph Layer4["Layer 4: BIAN Service Domains<br/>(BIAN v14.0.0 - 341 Service Domains)"]
        PartyAuth["Party Authentication<br/>(SD-004)"]
        PaymentOrder["Payment Order Initiation<br/>(SD-001)"]
        PaymentExec["Payment Orchestration<br/>(SD-002)"]
        CurrentAccount["Current Account<br/>(SD-003)"]
        FraudEvaluation["Fraud Evaluation<br/>(SD-045)"]
        CustomerRelMgmt["Customer Relationship Management<br/>(SD-006)"]
    end

    %% Layer 5: Core Systems
    subgraph Layer5["Layer 5: Core Systems"]
        CoreBanking["Core Banking System<br/>(Finacle/Temenos)"]
        Mainframe["Legacy Mainframe<br/>(Transaction Processing)"]
        MDM["Master Data Management"]
    end

    %% Layer 1 to Layer 2
    Mobile -->|OAuth 2.0 + JWT<br/>HTTPS/REST| SalesService
    Mobile -->|OAuth 2.0 + JWT<br/>HTTPS/REST| Operations
    Web -->|OAuth 2.0 + JWT<br/>HTTPS/REST| SalesService
    Web -->|OAuth 2.0 + JWT<br/>HTTPS/REST| Operations
    ATM -->|ISO 8583<br/>Secure Protocol| Operations
    Branch -->|HTTPS/REST<br/>Internal Auth| SalesService

    %% Layer 2 to Layer 3 (Business Scenarios orchestrate Business Capabilities)
    SalesService -->|REST/gRPC<br/>mTLS| CustomerMgmt
    Operations -->|REST/gRPC<br/>mTLS| Payments
    Operations -->|REST/gRPC<br/>mTLS| LoansDeposits
    RiskCompliance -->|REST/gRPC<br/>mTLS| RiskMgmt

    %% Layer 3 to Layer 4 (Business Capabilities coordinate Service Domains)
    CustomerMgmt -->|REST/gRPC<br/>mTLS| PartyAuth
    CustomerMgmt -->|REST/gRPC<br/>mTLS| CustomerRelMgmt
    Payments -->|REST/gRPC<br/>mTLS| PaymentOrder
    Payments -->|REST/gRPC<br/>mTLS| PaymentExec
    LoansDeposits -->|REST/gRPC<br/>mTLS| CurrentAccount
    RiskMgmt -->|REST/gRPC<br/>mTLS| FraudEvaluation

    %% Layer 4 inter-service domain communication (event-driven)
    PaymentOrder -.->|Kafka Event<br/>payment-order.initiated| PaymentExec
    PaymentOrder -.->|Kafka Event<br/>compliance.check| FraudEvaluation
    FraudEvaluation -.->|Kafka Event<br/>fraud.check-completed| PaymentOrder

    %% Layer 4 to Layer 5 (Service Domains call Core Systems)
    PartyAuth -->|REST API<br/>Legacy Adapter| MDM
    PaymentExec -->|REST API<br/>Legacy Adapter| CoreBanking
    CurrentAccount -->|REST API<br/>Legacy Adapter| CoreBanking
    CustomerRelMgmt -->|REST API<br/>Legacy Adapter| MDM
    PaymentOrder -->|REST API<br/>Legacy Adapter| Mainframe

    %% Styling — four drawing roles, identical on every architecture type
    %% See references/DIAGRAM-GENERATION-GUIDE.md → Diagram 1 § "Palette"
    classDef zone  fill:none,stroke:#019f68,stroke-width:1px,color:#7a7977
    classDef unit  fill:#d6ecff,stroke:#2a78d6,stroke-width:2px,color:#0b0b0b
    classDef store fill:#ffe0cf,stroke:#dd5c00,stroke-width:2px,color:#0b0b0b
    classDef ext   fill:#e7e6e3,stroke:#7e7d7b,stroke-width:2px,stroke-dasharray:5 5,color:#52514e

    class Layer1,Layer2,Layer3,Layer4,Layer5 zone
    class Mobile,Web,Branch,SalesService,Operations,RiskCompliance,CustomerMgmt,Payments,LoansDeposits,RiskMgmt,PartyAuth,PaymentOrder,PaymentExec,CurrentAccount,FraudEvaluation,CustomerRelMgmt unit
    class MDM store
    class ATM,CoreBanking,Mainframe ext
    linkStyle default stroke:#7e7d7b,stroke-width:2px
```
````

### Legend

**Arrow Types**:
- **Solid arrows (`-->`)**: Synchronous calls (REST, gRPC)
- **Dashed arrows (`-.->`)**: Asynchronous events (Kafka, message queues)

**Colors** — assigned by **drawing role only**, never by BIAN layer, criticality, or trust zone:
- **No fill, aqua stroke**: layer band (`subgraph`) — bands carry no fill because Mermaid paints cluster rectangles after edges, so an opaque fill washes out every edge label inside the band
- **Blue** (`unit`): any component in scope — channel app, business scenario, business domain, BIAN Service Domain
- **Orange** (`store`): any data holder in scope — data store, cache, MDM, Kafka topic, queue
- **Grey, dashed** (`ext`): actors and external systems — the ATM network, the core banking system, the legacy mainframe

Shape carries what a fourth hue would have: cylinder `[( )]` for stores and caches, stadium `([ ])` for topics and queues.

**Strip the colour and the diagram must say exactly what it said** — the BIAN layering survives because the bands do. That is the test this palette is built to pass; a palette that tints by layer fails it.

**BIAN Hierarchy Visualization**:
- **Layer 2 → BIAN Business Areas**: 8 business areas (Customers, Operations, Finance And Risk Management, etc.)
- **Layer 3 → BIAN Business Domains**: 43 business domains (Relationship Management, Clearing And Settlement, Loans and Deposits, etc.)
- **Layer 4 → BIAN Service Domains**: 341 service domains (Payment Order Initiation SD-001, Payment Orchestration SD-002, etc.)

### Customization Instructions

To customize this diagram for your specific BIAN architecture:

1. **Update Layer 1 Channels**: Replace example channels with your actual channel implementations
2. **Update Layer 2 Business Scenarios**: Map your business scenarios to BIAN Business Areas
3. **Update Layer 3 Business Capabilities**: Identify which BIAN Business Domains are implemented
4. **Update Layer 4 Service Domains**: Replace example service domains with your BIAN v14.0.0 service domains (validate names against [BIAN Service Landscape](https://bian.org/servicelandscape-14-0-0/views/view_54486.html))
5. **Update Layer 5 Core Systems**: Replace with your actual core banking systems
6. **Add/Remove Communication Flows**: Update arrows based on your actual integration patterns
7. **Do NOT adjust colors**: the four `classDef` roles are fixed across every architecture type and both themes — emit them verbatim. Assign each new node to `unit`, `store`, or `ext`, and each new `subgraph` to `zone`; an unclassed element inherits the host theme and goes unreadable on one of the two backgrounds

**For detailed diagram creation and update instructions**, see [MERMAID_DIAGRAMS_GUIDE.md](../MERMAID_DIAGRAMS_GUIDE.md).

---

## Guidelines

1. **All 5 layers are required** in BIAN architecture
2. **Document layers in order**: Channels → BIAN Business Scenarios → BIAN Business Capabilities → BIAN Service Domains → Core Systems
3. **Each layer must include all subsections**: Purpose, Components, Technologies, Key Responsibilities, Communication Patterns, Non-Functional Requirements
4. **Flow direction**: Requests typically flow top-down (Channels → Core), responses flow bottom-up
5. **BIAN v14.0.0 compliance is mandatory** for Layers 2, 3, and 4:
   - Layer 2: Map to BIAN Business Areas (8 areas)
   - Layer 3: Map to BIAN Business Domains (43 domains)
   - Layer 4: Implement BIAN Service Domains (341 domains)
6. **BIAN hierarchy traceability**: Every service domain must be traceable to its parent business domain and business area
7. **BIAN service domain validation**: All service domain names in Layer 4 must be validated against the official [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
8. **BIAN service operations**: All Layer 4 service domains must implement BIAN standard service operations (Initiate, Update, Retrieve, Control, etc.)
9. **BIAN control records**: Document control record structure per BIAN specification for each service domain
10. **BIAN functional patterns**: Identify and document the BIAN functional pattern for each service domain (Managed Object, Tracked Object, etc.)
11. **BIAN metadata**: All Layer 4 service domains must include complete BIAN metadata (BIAN ID, version, business domain, business area)
12. **Core systems integration**: Layer 5 must document how core systems support BIAN service domains through adapters and integration patterns
13. **Modernization strategy**: Document progressive modernization approach aligned with BIAN architecture goals

---

## Validation Checklist

**Structure Validation**:
- [ ] All 5 layers documented in order (Channels, BIAN Business Scenarios, BIAN Business Capabilities, BIAN Service Domains, Core Systems)
- [ ] Each layer has all required subsections (Purpose, Components, Technologies, Key Responsibilities, Communication Patterns, Non-Functional Requirements)
- [ ] Communication patterns defined for inter-layer communication
- [ ] Technologies specified for each layer
- [ ] Non-functional requirements quantified (not placeholders)

**BIAN v14.0.0 Compliance Validation**:
- [ ] Layer 2: Business scenarios mapped to BIAN Business Areas (8 areas)
- [ ] Layer 2: BIAN Business Area mapping table included
- [ ] Layer 3: Business capabilities mapped to BIAN Business Domains (43 domains)
- [ ] Layer 3: BIAN Business Domain mapping table included
- [ ] Layer 4: All service domains validated against [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
- [ ] Layer 4: Service domain catalog table included with BIAN IDs
- [ ] Layer 4: Each service domain has complete BIAN metadata (Official Name, BIAN ID, Version, Business Domain, Business Area, URL)
- [ ] Layer 4: Control records documented per BIAN specification
- [ ] Layer 4: Service operations documented (Initiate, Update, Retrieve, Control, etc.)
- [ ] Layer 4: Behavior qualifiers documented per BIAN spec
- [ ] Layer 4: Functional patterns documented per BIAN spec
- [ ] Layer 4: BIAN compliance level documented (Full/Partial/Custom)

**BIAN Hierarchy Traceability**:
- [ ] Clear mapping: BIAN Service Domain → BIAN Business Domain → BIAN Business Area
- [ ] BIAN hierarchy visualization in architecture diagram
- [ ] Cross-references between layers 2, 3, and 4

**Integration and Implementation**:
- [ ] Layer 5: Core systems integration strategy documented
- [ ] Layer 5: BIAN adapter pattern documented
- [ ] Layer 5: Modernization strategy aligned with BIAN architecture
- [ ] Architecture diagram included (Mermaid format showing all 5 layers)
- [ ] BIAN v14.0.0 reference URLs included throughout document
- [ ] Event-driven patterns documented (if applicable)

**Quality Checks**:
- [ ] No placeholder content (all sections filled with real information)
- [ ] All BIAN service domain names use exact BIAN v14.0.0 terminology
- [ ] BIAN IDs (SD-XXX) used consistently for internal tracking
- [ ] All required BIAN URLs reference https://bian.org/servicelandscape-14-0-0/views/view_54486.html
