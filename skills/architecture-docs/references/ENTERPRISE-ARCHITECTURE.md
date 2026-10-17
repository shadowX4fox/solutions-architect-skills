# ENTERPRISE Architecture Reference (Arquitectura Empresarial por Capas)

> **Purpose**: Comprehensive reference for the ENTERPRISE layered architecture — a domain-neutral 5-layer reference model for enterprise applications in any industry. Use this document when designing, reviewing, or documenting architectures that follow the ENTERPRISE layered model.

---

## 1. What Is ENTERPRISE Architecture?

ENTERPRISE is a **5-layer reference architecture model** for systems that serve several channels, run business processes across several capabilities, and sit on top of systems of record the organization already operates. It structures an application by separating concerns across horizontal layers and a set of cross-cutting capabilities that any layer may call.

The model addresses the challenges most enterprises share, whatever the industry:

- **Multi-channel delivery** — web, mobile, partner and B2B APIs, agent desktops, file and batch intake, all reaching the same capabilities
- **Long-running business processes** — orders, claims, applications, shipments and cases that span hours or weeks and several capabilities
- **Systems of record integration** — modern services must coexist with ERP, packaged, SaaS and in-house platforms that keep the authoritative record
- **Organizational scale** — many teams working on one platform, each owning a capability
- **Regulation and audit** — clear ownership of data and a traceable path from a request to the record it changes

ENTERPRISE is not a technology prescription and not an industry standard. It defines **where each concern lives**, how layers communicate, and which team owns which layer. An industry capability model (BIAN for banking, or the project's own capability map) can be laid over the Domain Services layer as an optional tag; the layer model does not depend on one.

### Visible Names

| Id | English | Spanish (`doc_language: es`) |
|----|---------|------------------------------|
| L1 | Channels | Canales |
| L2 | Experience | Experiencia |
| L3 | Process | Procesos |
| L4 | Domain Services | Servicios de Dominio |
| L5 | Systems of Record & Data | Sistemas de Registro y Datos |
| C6 | Cross-Cutting Capabilities | Capacidades Transversales |

Anchors, markers, ids and table column headers stay English in both languages; only the visible names change.

---

## 2. Core Principles

### 2.1 Separation of Concerns

Each layer has a clearly defined responsibility. No layer reaches beyond its scope:

- Channels do not contain business logic
- Experience adapts to a channel but holds no business rules
- Process orchestrates use cases but owns no business entity
- Domain Services own business rules and data but know nothing of channels
- Systems of Record are reached only through Domain Services or the integration capability

### 2.2 One Owner per Fact

Every business entity has exactly one writer — the Domain Service of its bounded context — and every authoritative record lives in exactly one system of record:

- Two services writing the same table is a defect, not a shortcut
- Other contexts read through the owner's API or keep a copy fed by its events
- The process layer keeps process state (step, deadline, correlation), never a copy of the entity it moves

### 2.3 Downward Dependencies

Calls flow down; changes flow out as events:

- A layer calls only the layer directly below it or a cross-cutting capability
- Skipping a layer is an exception, accepted by an ADR and named where it occurs
- Systems of Record never call up — their changes leave through change data capture, an outbox or events on the backbone

### 2.4 Governed Interfaces

All inter-layer communication flows through stated interfaces:

- API management fronts the platform's entry points; it is infrastructure on the connection, not a layer
- Interface versioning, schema validation and contract tests apply at every layer boundary
- An API and event catalog makes every capability discoverable

### 2.5 Modular Evolution

The architecture supports incremental modernization:

- A system of record is wrapped behind a Domain Service and replaced behind it without touching upper layers
- A new capability is a new Domain Service, not a change to an existing one
- Channels and experiences are rebuilt independently of the capabilities they use
- Processes are re-orchestrated without changing the services they call

### 2.6 Independent Scaling and Resilience

Each layer scales on its own load:

- Channels and Experience scale with users
- Process scales with concurrent process instances
- Domain Services scale per capability
- Systems of Record are protected by upstream timeouts, circuit breakers and queues

---

## 3. The 5 Layers

### Layer 1 — Channels (Canales)

**Purpose**: Entry points through which users, partners and upstream systems interact with the platform.

**Description**: The Channels layer represents every touchpoint where an interaction starts. Each channel has its own device, connectivity and session model, but all channels converge on the same layers below.

**Channel Types:**

| Channel | Description | Characteristics |
|---------|-------------|----------------|
| Web | Browser-based self-service | Session-managed, responsive |
| Mobile | Native or hybrid application | Device auth, push notifications, offline modes |
| Partner / B2B API consumers | Third parties calling published APIs | OAuth2 client credentials, rate-limited, sandboxed |
| Agent and back-office desktops | Internal staff applications | Role-based, audit-logged, bulk operations |
| File and batch intake | Files and batches from partners or other systems | Scheduled, validated, reconciled |
| Physical touchpoints | Kiosks, point of sale, field devices | Low latency, intermittent connectivity |

**Key Rules:**

- Channels do NOT contain business logic — they delegate to Layer 2 (Experience)
- Each channel authenticates its users in a way suited to its device, against the Identity & Security capability
- Channel-specific formatting (locale, currency, date) happens here or in Experience, never below
- Channels are usually **C4 L1 systems or external actors**: a mobile application released by its own team is its own system, not a container of the platform
- Partner channels reach the platform through API management; the partner's system is an external system

### Layer 2 — Experience (Experiencia)

**Purpose**: Adapt the platform to each channel — composing calls and shaping responses — without holding business rules.

**Description**: The Experience layer sits between Channels and Process. It is responsible for:

- **Backend-for-Frontend (BFF)** — one API per channel, shaped for its screens
- **Micro-frontends** — feature-specific UI components composed into journeys
- **API composition** — aggregating several downstream calls into one response
- **Session and presentation state** — what the channel needs between requests

**Key Patterns:**

| Pattern | Description |
|---------|-------------|
| BFF per channel | Each channel family has its own BFF that aggregates and transforms for its needs |
| Micro-frontends | Each capability team ships its own UI fragment, composed in a shell |
| API composition | One call from the channel fans out to several process or service calls |
| Design system | A shared component library keeps the channels consistent |

**Key Rules:**

- No business rules in Experience — a validation that depends on business data belongs to a Domain Service
- Experience calls Layer 3 (Process); a direct read from Layer 4 is an ADR exception (typically reference data)
- Experience components are owned by product or channel teams, not by capability teams

### Layer 3 — Process (Procesos)

**Purpose**: Orchestrate use cases and long-running business processes by composing calls to Domain Services.

**Description**: A process implements an end-to-end use case that spans several capabilities. One process may reserve stock, create an order, request a shipment and notify the customer — all coordinated here.

**Examples (by industry):**

| Process | Industry | Capabilities Involved |
|---------|----------|-----------------------|
| Place Order | Retail | Catalog, Order, Inventory, Payment, Notification |
| Handle Claim | Insurance | Policy, Claim, Assessment, Payment, Document |
| Issue Permit | Government | Applicant, Application, Inspection, Fee, Document |
| Ship Consignment | Logistics | Booking, Capacity, Route, Tracking, Billing |
| Open Account | Banking | Party, Account, Product, Screening, Notification |

**Key Patterns:**

| Pattern | Description |
|---------|-------------|
| Saga orchestration | Multi-step transaction with a compensating action for each step |
| Workflow engine | BPMN or code-defined workflows for approvals, routing and human tasks |
| Process manager | Event-driven coordination keyed by a correlation id |
| Choreography | Loosely coupled reaction to events, when no single owner is needed |

**Key Rules:**

- Process **orchestrates** — it does not implement business rules
- Process owns **process state** (step, deadline, correlation ids, retries), never business entities
- Each process has one entry point and a stated outcome (response or event)
- Process coordinates compensation: if step 3 fails, steps 1 and 2 are undone by their own services
- Long-running processes survive restarts — their state is persisted

### Layer 4 — Domain Services (Servicios de Dominio)

**Purpose**: Implement the business capabilities as bounded contexts, each owning its data, its rules and its interface.

**Description**: Layer 4 holds one service (or a small set) per bounded context. A bounded context names a capability and the language it defines; its service is the only writer of that capability's entities and enforces its invariants.

**Examples:**

| Domain Service | Owns | Invariant Example |
|----------------|------|-------------------|
| Catalog | Products, prices, availability | One active price list per market |
| Order | Orders, order lines, order status | An order is confirmed only with every line reserved |
| Inventory | Stock positions, reservations | A reservation never exceeds available stock |
| Customer | Customer profile, consent, preferences | Contact only through a channel with consent |
| Billing | Invoices, credit notes | An invoice total equals the sum of its lines |

**Optional capability tag**: when the project carries an alignment to an industry capability model — for example `BIAN_ALIGNMENT.md`, which maps the business onto BIAN Service Domains — a Domain Service MAY carry the capability it implements as a tag. The tag is traceability, not structure: the service's boundary comes from its bounded context, and a service without a tag is complete. Never invent a tag the alignment does not give.

**Key Rules:**

- Domain Services **own their business rules** — no other layer decides whether an order is valid
- Each service owns its data; other services read through its API or its events
- Each service publishes a domain event for every state change another context needs
- Each service is an **anti-corruption layer** over the systems of record it reaches — it presents its own model regardless of the record's format
- Domain Services are consumed by Layer 3 (Process); an Experience read is an ADR exception

### Layer 5 — Systems of Record & Data (Sistemas de Registro y Datos)

**Purpose**: Hold the authoritative records and the data platform the enterprise runs on.

**Description**: Layer 5 contains the systems that are the source of truth and the platforms that keep data for analysis:

**Systems of Record:**

| Component | Description |
|-----------|-------------|
| Core / ERP platform | Finance, procurement, inventory valuation — usually packaged |
| Packaged line-of-business system | Warehouse management, policy administration, case management |
| SaaS platform | CRM, HR, billing run by a provider |
| Authoritative store owned by the system | A ledger or record database this system operates |

**Data Platform:**

| Component | Description |
|-----------|-------------|
| Data warehouse | Curated historical data for reporting |
| Data lake / lakehouse | Raw and semi-structured data for analytics and ML |
| Streaming store | Retained event streams for replay and analytics |
| Master data management | Golden records for shared reference entities |
| Data catalog | Metadata, lineage, data quality |

**Key Rules:**

- Systems of Record are **never reached directly** by Layers 1–3 — only through Domain Services or the Integration capability's adapters
- Systems of Record **never call up** — their changes leave as events, CDC streams or files through the Integration capability
- Modernization replaces a system behind the Domain Service that wraps it, without impacting upper layers
- The data platform serves analytical workloads; transactional workloads go through Domain Services
- Packaged and SaaS systems are external systems in C4 terms; a store this system operates is a container

---

## 4. Cross-Cutting Capabilities (Capacidades Transversales)

Cross-cutting capabilities are **not a layer**. Any layer may call them; they take no part in the downward dependency rule.

### 4.1 Integration (Integración)

How components and systems reach each other:

- API management / gateway — entry policies, rate limits, routing; drawn on the connection it fronts, never as a container
- Event backbone / broker — topics for domain events and change streams; a container only when this system owns it
- Managed file transfer — scheduled file exchanges with partners and systems of record
- Adapters to systems of record — protocol and format translation where a Domain Service does not do it itself

### 4.2 Identity & Security (Identidad y Seguridad)

- Identity provider — sign-in, federation, multi-factor authentication
- Token issuance and validation — OAuth2 / OIDC for users, client credentials for partners
- Secrets and key management — credentials, certificates, encryption keys
- Policy enforcement — authorization decisions outside application code where stated

### 4.3 Observability (Observabilidad)

- Logs, metrics and distributed traces with one correlation id from channel to record
- Alerting and on-call routing
- Audit trail — who changed which record, when, through which channel

### 4.4 Shared Platform Services (Servicios de Plataforma Compartidos)

- Notifications — email, SMS, push
- Documents — generation, storage, signature
- Business rules — decision tables and rule engines shared by several services
- Scheduling — timers and batch triggers

A shared platform service is a container when this system builds it, and an external system when another team runs it for the enterprise.

---

## 5. How It Works: End-to-End Flow

An online order illustrates how a request flows through the five layers:

```
Step 1: Channel (Layer 1)
  → Customer places an order in Order Desk Web
  → The browser sends the request to the Order Desk BFF

Step 2: Experience (Layer 2)
  → Order Desk BFF validates the session and the request format
  → BFF calls the "Place Order" process through API management

Step 3: Process (Layer 3)
  → Fulfilment Process starts a saga and records its state:
    → Step 3a: Catalog Service quotes the price of each line
    → Step 3b: Inventory Service reserves stock for each line
    → Step 3c: Order Service creates the order
    → Step 3d: Payment capability authorizes the amount
    → Step 3e: Notification Service sends the confirmation

Step 4: Domain Services (Layer 4)
  → Inventory Service checks:
    → Stock available in the chosen warehouse?
    → Reservation within the order's validity window?
  → Order Service checks:
    → Every line priced and reserved?
    → Customer allowed to order in this market?

Step 5: Systems of Record & Data (Layer 5)
  → Order Service writes the order to the Order Ledger
  → The Warehouse Management System receives the pick request through the Integration capability
  → The ledger's change stream lands in the Analytics Lakehouse

Step 6: Response (bottom-up)
  → Ledger confirms the write → Order Service confirms the order → Process completes the saga
  → BFF formats the response → the web channel shows the confirmation

Step 7: Changes out (events)
  → Warehouse Management System publishes "shipped" on the event backbone
  → Fulfilment Process consumes it and closes the process instance
```

---

## 6. Implementation Reference

| Layer | Technology Patterns | Typical Implementation |
|-------|-------------------|----------------------|
| **Layer 1 — Channels** | Responsive web, native mobile, partner APIs, file intake | React / Angular (web), Kotlin / Swift (mobile), published OpenAPI for partners, SFTP / AS2 intake |
| **Layer 2 — Experience** | BFF, micro-frontends, API composition | Node.js / Spring Boot BFFs, Module Federation, GraphQL composition |
| **Layer 3 — Process** | Sagas, workflow engines, process managers | Temporal / Camunda / Conductor, code-defined state machines |
| **Layer 4 — Domain Services** | Bounded-context services, event publishing, anti-corruption adapters | Spring Boot / .NET / Go services, PostgreSQL per service, outbox to Kafka |
| **Layer 5 — Systems of Record & Data** | Packaged and SaaS platforms, owned stores, data platform | ERP / WMS / CRM products, PostgreSQL / Oracle ledgers, warehouse and lakehouse, CDC |
| **Cross-cutting — Integration** | API management, event backbone, file transfer | Kong / Apigee / Azure API Management, Apache Kafka / RabbitMQ, MFT |
| **Cross-cutting — Identity & Security** | OIDC, secrets, policy | Keycloak / Entra ID / Auth0, Vault, OPA |
| **Cross-cutting — Observability** | Tracing, metrics, logs | OpenTelemetry, Prometheus, Grafana, ELK |
| **Cross-cutting — Shared Platform Services** | Notifications, documents, rules, scheduling | Notification service, document service, decision tables, schedulers |

The product names are examples of the pattern, not recommendations; the architecture states the products the project actually uses.

---

## 7. Adapting the Model to an Industry

The five layers stay the same; the vocabulary inside them changes.

| Industry | Typical Channels | Typical Processes | Typical Domain Services | Typical Systems of Record |
|----------|------------------|-------------------|-------------------------|---------------------------|
| Retail | Web shop, mobile app, stores, marketplaces | Place order, return, replenish | Catalog, order, inventory, pricing, loyalty | ERP, WMS, POS back office |
| Insurance | Agent portal, customer app, broker APIs | Quote, bind, handle claim | Policy, claim, party, product, billing | Policy administration, claims system |
| Government | Citizen portal, counter desk, agency APIs | Apply, inspect, issue permit | Applicant, application, case, fee | Registry, case management, finance |
| Logistics | Shipper portal, carrier APIs, EDI files | Book, dispatch, deliver | Booking, capacity, route, tracking | TMS, WMS, billing |
| Banking | Online banking, mobile, branches, open APIs | Open account, transfer, originate loan | Party, account, payment, lending | Core platform, card processor, ledger |

When the industry has a published capability model and the project carries an alignment to it, tag the Domain Services with it (§ 3, Layer 4). The tag does not add a layer, rename one, or change the dependency rule.

---

## 8. Key Challenges

| Challenge | Description | Mitigation |
|-----------|-------------|------------|
| **Layer boundary enforcement** | Teams bypass layers for convenience (e.g., a BFF calling a system of record) | API management policies, architecture fitness functions, checks in CI |
| **Process bloat** | One process grows into a monolith of hundreds of steps | Split into sub-processes; one process per use case |
| **Entity leakage into Process** | Process stores copies of orders or customers and starts deciding on them | Process keeps ids and state only; decisions go to the owning Domain Service |
| **Context boundaries** | Two services claim the same entity, or one service owns everything | Context map; one writer per entity; split a service that owns unrelated entities |
| **Systems of record integration** | Packaged systems expose batch, proprietary or slow interfaces | Anti-corruption adapters, caching with stated staleness, async integration, circuit breakers |
| **Upward calls from records** | A system of record calls a service to notify a change | Outbox, CDC or events on the backbone; consumers subscribe |
| **Cross-layer observability** | One user action crosses five layers and several systems | Mandatory distributed tracing; one correlation id from channel to record |
| **Data consistency** | Copies fed by events lag the owner | State the consistency window per copy; reconcile against the owner |
| **Team coordination** | Different teams own different layers | API-first, contract tests, an interface catalog, clear ownership |
| **Latency** | Each layer adds a network hop | Keep synchronous depth low; cache reference data; move waits to async steps |
| **Incremental modernization** | Replacing a system of record is a multi-year effort | Strangler pattern behind the Domain Service; run old and new in parallel |
