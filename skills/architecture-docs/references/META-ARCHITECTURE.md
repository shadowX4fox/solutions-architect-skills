# META Architecture Reference (Arquitectura Meta Conceptual)

> **Purpose**: Comprehensive reference for the META banking layered architecture — a 6-layer reference framework used by banking and financial institutions to structure enterprise applications. Use this document when designing, reviewing, or documenting architectures that follow the META layered model.

---

## 1. What Is META Architecture?

META (Arquitectura Meta Conceptual) is a **6-layer reference architecture framework** designed for banking and large financial institutions. It provides a standardized way to structure enterprise applications by separating concerns across well-defined horizontal layers and vertical transversal services.

The META model addresses the unique challenges of banking architectures:

- **Regulatory compliance** — strict separation between channels, business logic, and core banking systems
- **Multi-channel delivery** — branches, ATMs, web banking, mobile banking, contact centers, partner APIs
- **Legacy core integration** — modern digital layers must coexist with decades-old core banking systems
- **Organizational scale** — hundreds of developers across dozens of teams working on the same platform
- **Domain complexity** — financial products (loans, accounts, payments, cards, investments) each with deep business rules
- **Transversal concerns** — security, accounting, regulatory rules, and processing that cut across all business domains

META is not a technology prescription — it is an **organizational and architectural framework** that defines where each concern lives, how layers communicate, and which team owns which layer.

---

## 2. Core Principles

### 2.1 Separation of Concerns

Each layer has a clearly defined responsibility. No layer reaches beyond its scope:

- Channels do not contain business logic
- Business scenarios orchestrate but do not implement domain rules
- Domain services own business rules but do not know about channels or UX
- Core banking is accessed only through domain abstractions

### 2.2 Technical and Functional Decoupling

Layers are decoupled both technically (different runtimes, protocols, deployment units) and functionally (different business responsibilities):

- Technical decoupling enables independent technology evolution per layer
- Functional decoupling enables independent business evolution per domain
- Changes to a channel (e.g., mobile app redesign) do not affect business logic
- Changes to a core banking module do not affect the orchestration layer

### 2.3 Centralized API Governance

All inter-layer communication flows through governed APIs:

- API Gateway controls access to Layers 3-5 from Layers 1-2
- Internal API standards enforce versioning, schema validation, and contract testing
- API catalog provides discoverability across the organization
- Rate limiting and throttling protect downstream systems

### 2.4 Modular Evolution

The architecture supports incremental modernization:

- Legacy core systems are wrapped behind domain service interfaces
- New capabilities can be added as new domain services without modifying existing ones
- Channels can be modernized independently (e.g., new mobile app without touching business logic)
- Business scenarios can be re-orchestrated without changing underlying domains

### 2.5 Scalable and Resilient

Each layer scales independently based on its traffic patterns:

- Channel layer scales with user demand (millions of mobile users)
- Business scenario layer scales with transaction volume (peak hours, paydays)
- Domain layer scales per business domain (payments may need more capacity than investments)
- Core layer is protected from overload by upstream circuit breakers and queuing

---

## 3. The 6 Layers

### Layer 1 — Canales (Channels)

**Purpose**: Entry points through which users and external systems interact with the bank.

**Description**: The Channels layer represents every touchpoint where a customer, partner, or internal user initiates an interaction. Each channel has its own characteristics (device, connectivity, session model) but all channels converge on the same backend layers.

**Channel Types:**

| Channel | Description | Characteristics |
|---------|-------------|----------------|
| Banca Web | Internet banking portal | Browser-based, session-managed, responsive |
| Banca Móvil | Mobile banking application | Native/hybrid, biometric auth, push notifications |
| Sucursales | Branch systems (teller, kiosk) | On-premise, low-latency, high-reliability |
| ATM / Cajeros | ATM network | Limited UI, offline-capable, card-based auth |
| Contact Center | Phone banking, chat, video | Agent-assisted, IVR integration, CRM integration |
| API Partners | Open Banking APIs, fintech integrations | OAuth2, rate-limited, sandbox environments |
| Backoffice | Internal operations portals | Role-based, audit-logged, bulk operations |

**Key Rules:**

- Channels do NOT contain business logic — they delegate to Layer 2 (Experience) or Layer 3 (Business Scenarios)
- Each channel has its own authentication flow adapted to the device (biometric for mobile, certificate for ATM, MFA for web)
- Channel-specific data formatting (currency, date, locale) happens here
- Channels are independently deployable — a mobile app release does not require a web release

### Layer 2 — Experiencia (Experience / Microfrontends)

**Purpose**: Compose user experiences by assembling reusable UI components (microfrontends) and BFF orchestration specific to each channel.

**Description**: The Experience layer sits between Channels and Business Scenarios. It is responsible for:

- **Microfrontend composition** — assembling feature-specific UI components into cohesive user journeys
- **BFF (Backend-for-Frontend)** — channel-specific API aggregation and transformation
- **UX orchestration** — multi-step user flows (wizards, onboarding journeys, approval flows)
- **State management** — client-side state for complex interactions
- **A/B testing and personalization** — experience-level feature flags and content targeting

**Key Patterns:**

| Pattern | Description |
|---------|-------------|
| Microfrontends | Each business domain exposes its own UI components (e.g., "Transfer Widget", "Account Summary Card") that are composed into channel pages |
| BFF per channel | Each channel (web, mobile) has its own BFF that aggregates backend calls and transforms data for the channel's specific needs |
| Design system | Shared component library (buttons, forms, cards) ensures visual consistency across microfrontends |
| Shell application | A host application loads and orchestrates microfrontends at runtime (Module Federation, single-spa) |

**Key Rules:**

- Experience components are **reusable across channels** — the same "Transfer Widget" microfrontend can appear in web and mobile
- BFFs aggregate calls to Layer 3 (Business Scenarios) — they do not call Layer 4 or 5 directly
- No business logic in the Experience layer — it orchestrates UX flows, not business rules
- Experience components are owned by **product/feature teams**, not channel teams

### Layer 3 — Escenarios de Negocio (Business Scenarios / Orchestration)

**Purpose**: Orchestrate multi-domain business processes by composing calls to Layer 4 (Business) and Layer 5 (Domain) services.

**Description**: Business Scenarios implement end-to-end business processes that span multiple business domains. A single scenario may involve accounts, payments, cards, and notifications — all coordinated here.

**Examples:**

| Business Scenario | Domains Involved |
|-------------------|-----------------|
| Customer Onboarding | Customer, Accounts, Cards, Notifications, Compliance (KYC) |
| Domestic Transfer | Accounts, Payments, Limits, Notifications, Accounting |
| Loan Origination | Customer, Credit Scoring, Loans, Documents, Notifications |
| Card Activation | Cards, Customer, Notifications, Security |
| Investment Purchase | Customer, Investments, Accounts, Payments, Compliance |

**Key Patterns:**

| Pattern | Description |
|---------|-------------|
| Saga Orchestration | Coordinate multi-step transactions with compensation (rollback) for failures |
| Process Engine | BPMN-based workflow engine for complex approval and routing flows |
| Choreography | Event-driven coordination for loosely coupled scenarios |
| API Composition | Aggregate responses from multiple domain services into a single response |

**Key Rules:**

- Business Scenarios **orchestrate** — they do not implement business rules
- Each scenario has a clear entry point (API) and exit point (response or event)
- Scenarios handle error coordination — if step 3 fails, compensate steps 1 and 2
- Scenarios are stateful (saga state) but delegate all business validation to Layer 4/5
- Long-running scenarios (loan origination, account opening) may span hours or days

### Layer 4 — Negocio (Business Capabilities)

**Purpose**: Implement business rules, validations, and domain logic for a specific business capability.

**Description**: Layer 4 contains the **business rule engine** for each capability area. These are not BIAN service domains (that is Layer 5) — they are higher-level business capabilities that may compose multiple BIAN service domains.

**Examples:**

| Business Capability | Responsibility |
|--------------------|---------------|
| Payments | Payment validation, routing, limits enforcement, fraud screening |
| Lending | Credit policy rules, interest calculation, repayment scheduling |
| Accounts | Account lifecycle rules, balance management, account types |
| Cards | Card lifecycle, authorization rules, spending limits, rewards |
| Investments | Portfolio rules, risk assessment, suitability validation |
| Customer Management | Customer lifecycle, segmentation, preferences |
| Compliance | KYC/AML rules, transaction monitoring, regulatory reporting |

**Key Rules:**

- Business capabilities **own their business rules** — no other layer decides if a transfer is valid
- Capabilities expose APIs consumed by Layer 3 (Scenarios) and sometimes by Layer 2 (BFF) for simple reads
- Capabilities call Layer 5 (Domain) for core data operations and Layer 6 (Core) through domain adapters
- Business rules are externalized when possible (rules engine, decision tables) for business-led changes

### Layer 5 — Dominio (BIAN Service Domains)

**Purpose**: Implement standardized banking service domains following the BIAN (Banking Industry Architecture Network) framework.

**Description**: Layer 5 decomposes banking into standardized **service domains** defined by BIAN. Each service domain encapsulates a well-defined area of banking functionality with standard interfaces.

**BIAN Service Domain Examples:**

| BIAN Service Domain | Description |
|--------------------|-------------|
| Current Account | Demand deposit account lifecycle and transactions |
| Savings Account | Term deposit and savings product management |
| Payment Order | Payment initiation, routing, and execution |
| Card Transaction | Card authorization, clearing, and settlement |
| Customer Offer | Product offers, bundling, and pricing |
| Party Reference | Customer identity, contact, and relationship data |
| Credit Risk | Credit scoring and risk assessment |
| Regulatory Compliance | Regulatory rule enforcement and reporting |
| Customer Workbench | Unified customer view and service history |

**Key Rules:**

- Service domains follow **BIAN naming and interface conventions** for industry interoperability
- Each service domain is an **anti-corruption layer** over Core (Layer 6) — it presents a clean domain API regardless of core system complexity
- Service domains handle **data transformation** between the modern domain model and legacy core formats
- Service domains may cache core data for performance (with defined consistency rules)
- Service domains are the **last layer before core** — they abstract all core banking integration complexity

### Layer 6 — Core y Datos (Core Banking + Data Fabric)

**Purpose**: Core banking systems (legacy or modern), transactional databases, and the enterprise data fabric.

**Description**: Layer 6 contains the systems of record:

**Core Banking:**

| Component | Description |
|-----------|-------------|
| Core Banking System | Account ledger, transaction posting, interest calculation (often legacy: AS/400, mainframe) |
| Card Processor | Card scheme integration (Visa, Mastercard), authorization, clearing, settlement |
| Loan System | Loan origination, servicing, collections (may be legacy or SaaS) |
| Payment Hub | SWIFT, ACH, SEPA, real-time payment network integration |
| GL (General Ledger) | Accounting system of record, double-entry posting |

**Data Fabric:**

| Component | Description |
|-----------|-------------|
| Data Warehouse | Historical data for analytics and reporting (Snowflake, BigQuery, Redshift) |
| Data Lake | Raw and semi-structured data for data science and ML |
| Master Data Management | Golden record for customers, products, and organizational data |
| Event Store | Event sourcing backbone for audit and temporal queries |
| Data Catalog | Metadata management, data lineage, data quality |

**Key Rules:**

- Core systems are **never exposed directly** to upper layers — always accessed through Layer 5 (Domain) adapters
- Core modernization happens incrementally — replace modules behind the Layer 5 interface without impacting upper layers
- The data fabric serves analytical workloads — transactional workloads go through the service layers
- Data replication between core and analytical systems is managed by CDC or ETL pipelines

---

## 4. Transversal Services

Transversal services cut across all 6 layers. They provide capabilities consumed by any layer, not bound to a single horizontal layer.

### 4.1 Gateways Financieros (Financial Gateways)

External financial network integration:

- SWIFT gateway (international payments)
- ACH/SEPA gateway (domestic/regional payments)
- Real-time payment networks (PIX, Faster Payments, TIPS)
- Card scheme gateways (Visa, Mastercard, AMEX)
- Open Banking APIs (PSD2, regulatory mandates)

### 4.2 Procesadores (Processors)

Specialized processing engines:

- Payment processor (authorization, clearing, settlement)
- Card processor (transaction lifecycle, BIN routing)
- Batch processor (end-of-day, interest calculation, statements)
- File processor (bulk transfers, payroll, regulatory reports)

### 4.3 Seguridad (Security)

Enterprise security services:

- Identity and Access Management (IAM) — SSO, MFA, federation
- API security — OAuth2, token management, API key governance
- Fraud detection — real-time transaction monitoring, ML models
- Encryption services — data at rest, data in transit, tokenization
- Audit logging — tamper-proof audit trail for all operations

### 4.4 Reglas (Rules)

Business rules management:

- Rules engine (Drools, decision tables, DMN)
- Regulatory rules (KYC/AML thresholds, transaction limits)
- Product rules (eligibility, pricing, interest rates)
- Operational rules (routing, approval matrices, escalation)

### 4.5 Contabilidad (Accounting)

Financial accounting services:

- Double-entry posting to the General Ledger
- Multi-currency accounting
- Regulatory reporting (balance sheet, P&L, Basel III)
- Reconciliation services
- Tax calculation and withholding

---

## 5. How It Works: End-to-End Flow

A domestic bank transfer illustrates how a request flows through all 6 layers:

```
Step 1: Channel (Layer 1)
  → Customer opens the mobile banking app and initiates a transfer
  → Mobile app sends request to the Mobile BFF

Step 2: Experience (Layer 2)
  → Mobile BFF validates the session and formats the request
  → BFF calls the "Domestic Transfer" business scenario API

Step 3: Business Scenario (Layer 3)
  → Transfer Orchestrator begins the saga:
    → Step 3a: Call Payments capability to validate the transfer
    → Step 3b: Call Accounts capability to check balance and limits
    → Step 3c: Call Compliance capability for AML screening
    → Step 3d: Call Payments capability to execute the transfer
    → Step 3e: Call Notifications capability to send confirmation

Step 4: Business Capability (Layer 4)
  → Payments capability validates:
    → Amount within daily limits?
    → Destination account valid?
    → Fraud score acceptable?
  → Accounts capability checks:
    → Sufficient balance?
    → Account not frozen?

Step 5: Domain / BIAN Service Domain (Layer 5)
  → Current Account SD reads account balance from core
  → Payment Order SD formats the payment instruction for the core

Step 6: Core + Data (Layer 6)
  → Core Banking System posts the debit transaction
  → Payment Hub routes the payment to the ACH network
  → General Ledger records the accounting entries
  → Event Store captures the transfer event for audit

Step 7: Response (bottom-up)
  → Core confirms posting → Domain confirms execution → Capability confirms completion
  → Orchestrator completes saga → BFF formats response → Mobile app shows confirmation
```

---

## 6. Implementation Reference

| Layer | Technology Patterns | Typical Implementation |
|-------|-------------------|----------------------|
| **Layer 1 — Channels** | Native mobile SDKs, responsive web, ATM middleware | Swift/Kotlin (mobile), React/Angular (web), vendor ATM software |
| **Layer 2 — Experience** | Microfrontends, BFF pattern, design systems | Module Federation / single-spa, Node.js BFFs, Storybook design system |
| **Layer 3 — Scenarios** | Saga orchestration, BPMN, API composition | Temporal/Conductor (orchestration), Camunda (BPMN), Spring Boot (API composition) |
| **Layer 4 — Business** | Microservices, rules engines, event-driven | Spring Boot / Quarkus microservices, Drools/OPA rules, Kafka events |
| **Layer 5 — Domain** | BIAN-compliant APIs, anti-corruption layers, adapters | REST/gRPC APIs, adapter pattern over core, Redis caching |
| **Layer 6 — Core** | Core banking, mainframe integration, data platforms | AS/400/mainframe (legacy), Temenos/Mambu (modern), Snowflake/BigQuery (data) |
| **Transversal — Security** | IAM, API gateway, fraud ML | Keycloak/Auth0, Kong/Apigee, custom ML models |
| **Transversal — Rules** | Business rules engines, decision management | Drools, OPA, IBM ODM, decision tables |
| **Transversal — Accounting** | GL integration, reconciliation | SAP GL, custom posting services, reconciliation engines |
| **Transversal — Gateways** | Financial messaging, payment networks | SWIFT Alliance, ACH adapters, card scheme connectors |

---

## 7. Key Challenges

| Challenge | Description | Mitigation |
|-----------|-------------|------------|
| **Layer boundary enforcement** | Teams bypass layers for convenience (e.g., BFF calling Core directly) | API Gateway policies, architectural fitness functions, automated checks in CI/CD |
| **Orchestration complexity** | Business scenarios become monolithic orchestrators with hundreds of steps | Decompose scenarios into sub-sagas; enforce single-responsibility per scenario |
| **BIAN adoption** | BIAN service domain definitions are abstract and require interpretation for each bank | Create a bank-specific BIAN mapping guide; start with 5-10 most critical service domains |
| **Legacy core integration** | Core banking systems have proprietary protocols, batch-oriented interfaces, and limited throughput | Anti-corruption layers in Layer 5; caching; circuit breakers; async integration where possible |
| **Cross-layer observability** | A single user action traverses 6 layers — tracing is essential but complex | Mandatory distributed tracing (OpenTelemetry); correlation IDs from Channel to Core |
| **Data consistency** | Each layer may cache or materialize data — consistency across layers is challenging | Define data ownership per layer; CDC for synchronization; eventual consistency SLAs |
| **Team coordination** | Different teams own different layers — inter-team dependencies create bottlenecks | API-first development; contract testing; internal API marketplace; clear ownership boundaries |
| **Performance** | 6 layers of network hops add latency | Caching at Layer 2 and 5; async processing; connection pooling; minimize synchronous depth |
| **Security at every layer** | Each layer must enforce its own security boundary — a single breach should not cascade | Zero Trust; mTLS between layers; OAuth2 token propagation; network segmentation per layer |
| **Incremental modernization** | Migrating from a legacy monolith to META is a multi-year journey | Strangler Fig pattern; migrate one domain at a time; run legacy and modern in parallel behind Layer 5 |
