# META Architecture to C4 Model Translation Guide

> **Purpose**: Step-by-step guide for translating the META (Arquitectura Meta Conceptual) banking layered architecture into C4 model diagrams. Covers the fundamental mismatch between META layers and C4 zoom levels, visual conventions, and common anti-patterns.

---

## 1. The Fundamental Mismatch

META and C4 answer **different questions**:

| Framework | Question | Answer |
|-----------|----------|--------|
| **META** | **WHERE** does each concern live? | 6 horizontal layers + vertical transversal services |
| **C4** | **WHAT** exists and at what zoom level? | Systems → Containers → Components (zoom in progressively) |

META defines **architectural layers** (organizational/functional zones). C4 defines **zoom levels** (abstraction depth). They are orthogonal:

- A META layer is NOT a C4 level
- A META layer may contain elements that span multiple C4 levels
- Multiple META layers may collapse into a single C4 element at a given zoom level

The translation challenge is mapping META's horizontal layering into C4's progressive zoom model. This guide provides the rules and conventions for doing so consistently.

---

## 2. C1 — System Context Diagram

At C1, the META architecture **collapses dramatically**. C1 shows the system's relationship with users and external systems — not its internal layer structure.

### Translation Rules

| META Element | C1 Mapping |
|-------------|------------|
| Layer 1 — Channels (Mobile, Web, ATM) | **Separate Systems** (one per independently deployed channel) |
| Layer 2 through Layer 5 (Experience → Domain) | **Single System** ("Banking Platform" or specific platform name) |
| Layer 6 — Core Banking (if legacy/third-party) | **External System** (if it is a separate product with its own lifecycle) |
| Layer 6 — Core Banking (if custom-built) | Part of the main **System** |
| Layer 6 — Data Fabric (Warehouse, Lake) | **External System** or omit (if purely internal analytics) |
| Transversal — Financial Gateways (SWIFT, ACH) | **External Systems** |
| Transversal — SaaS services (Auth0, Mambu) | **External Systems** |
| Customers (retail, corporate) | **Person** |
| Bank employees (branch, contact center) | **Person** |
| Partner systems (fintechs, regulators) | **External System** |

### Key Insight: Channels as Systems

In META, each channel is an independently deployed application with its own release cycle, team, and technology:

- Mobile Banking App → System
- Web Banking Portal → System
- ATM Network → System (or External System if vendor-managed)
- Partner API Platform → System

These are NOT Containers inside a System at C1 — they are independent Systems that use the Banking Platform.

### Example C1 Elements

```
Person: "Retail Customer"
  → uses → System: "Mobile Banking App [iOS/Android]"
  → uses → System: "Web Banking Portal [React SPA]"

Person: "Corporate Treasurer"
  → uses → System: "Corporate Banking Portal [Angular SPA]"

Person: "Branch Teller"
  → uses → System: "Branch System [Desktop Client]"

System: "Mobile Banking App [iOS/Android]"
  → makes API calls to → System: "Banking Platform"

System: "Web Banking Portal [React SPA]"
  → makes API calls to → System: "Banking Platform"

System: "Banking Platform"
  → processes payments via → External System: "SWIFT Network"
  → processes card transactions via → External System: "Visa/Mastercard Network"
  → posts accounting entries to → External System: "Core Banking System [AS/400]"
  → authenticates users via → External System: "IAM Platform [Keycloak]"
  → stores analytical data in → External System: "Data Warehouse [Snowflake]"

Person: "Regulator"
  → receives reports from → System: "Banking Platform"
```

---

## 3. C2 — Container Diagram

At C2, you **zoom into the Banking Platform System** and show its internal structure as pure C4 containers. META layers do NOT appear as visual groupings in the C4 L2 diagram — layer grouping belongs in Diagrams 1 (Logical View) and 4 (Detailed View).

### Translation Rules

| META Element | C2 Mapping |
|-------------|------------|
| Each microservice in Layer 3 | `Container()` — e.g., "Transfer Orchestrator [Spring Boot]" |
| Each microservice in Layer 4 | `Container()` — e.g., "Payment Service [Spring Boot]" |
| Each microservice in Layer 5 | `Container()` — e.g., "Current Account SD [Quarkus]" |
| Layer 2 BFF services | `Container()` — e.g., "Mobile BFF [Node.js]" |
| API Gateway | **Edge encoding only** — `(via Kong)` in the 3rd `Rel()` parameter (description); 4th parameter follows the canonical `<PROTOCOL>/<STYLE> [Action Type]` form (e.g. `"HTTPS/JSON [Data]"`). Exception: keep as `Container()` only when the gateway runs custom architectural logic that is itself a unit of decision (in-house policy engine, complex routing). See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2) and Connection Naming Rule (L1 + L2). |
| Transversal services | `Container()` — e.g., "IAM Service [Keycloak]" |
| Each database per service | `ContainerDb()` — e.g., "Payment DB [PostgreSQL]" |
| Message broker (Kafka) | **Edge encoding only** — `(Kafka topic: payment-events, async)` in the 3rd `Rel()` parameter (description); 4th parameter is `"TLS/AVRO [Event]"` (or `"Kafka/AVRO [Event]"` when broker is shown explicitly). Do NOT emit `ContainerQueue("Event Bus")`. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2) and Connection Naming Rule (L1 + L2). |
| Cache | `ContainerDb()` — e.g., "Session Cache [Redis]" |

### C2 Grouping Convention

The C4 L2 diagram uses **pure C4 conventions** — containers are grouped by their C4 element type, not by META layers:

- **`Container()`** for all application/service containers (BFFs, orchestrators, business services, domain services, transversal services)
- **`ContainerDb()`** for all data stores (databases, caches)
- **Transit infrastructure** (API gateway, message brokers, topics, queues, service mesh, iPaaS) → **edge label**, not a node. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2) for the canonical rule and label syntax.

The Mermaid C4 renderer visually differentiates the remaining nodes by shape (box, cylinder). No nested `Container_Boundary()` blocks are used for META layer grouping.

**Note**: META layer grouping (horizontal bands for L2–L5, transversal column) is expressed in Diagram 1 (ASCII Logical View) and Diagram 4 (Detailed View), not in the C4 L2 diagram.

### Example C2 Elements

Format note for prose narrative: `description → target — <PROTOCOL>/<STYLE> [Action]`. The em-dash separates the 3rd `Rel()` parameter (left, free prose with via/topic context) from the 4th parameter (right, canonical normal form).

```
Container: "Mobile BFF [Node.js + Express]"
  → routes requests (via Kong) → Container: "Transfer Orchestrator [Spring Boot]"  — HTTPS/JSON [Data]
  → routes requests (via Kong) → Container: "Payment Service [Spring Boot]"        — HTTPS/JSON [Data]
  (API Gateway collapsed into description — not a node)

Container: "Transfer Orchestrator [Spring Boot]"          ← Layer 3
  → calls Payment Service        → Container: "Payment Service [Spring Boot]"      — HTTPS/REST [Internal]
  → calls Account Service        → Container: "Account Service [Spring Boot]"      — HTTPS/REST [Internal]
  → calls Compliance Service     → Container: "Compliance Service [Spring Boot]"   — HTTPS/REST [Internal]
  → reads/writes saga state      → Container: "Orchestration DB [PostgreSQL]"      — JDBC/SQL [Write]

Container: "Payment Service [Spring Boot]"                ← Layer 4
  → calls Payment Order SD                                                          — gRPC/PROTOBUF [Internal]
       → Container: "Payment Order SD [Quarkus]"
  → publishes events (Kafka topic: payment-events, async)                           — TLS/AVRO [Event]
       → Container: "Settlement Service [Spring Boot]"
       → Container: "Notification Service [Node.js]"
       → Container: "Audit Log Service [Quarkus]"
       (broker collapsed into description — one edge per producer-consumer pair, topic name is the join)
  → reads/writes payment rows    → Container: "Payment DB [PostgreSQL]"             — JDBC/SQL [Write]

Container: "Payment Order SD [Quarkus]"                   ← Layer 5
  → calls Core Banking            → External System: "Core Banking [AS/400]"        — MQ/JMS/XML [Internal]
  → reads/writes domain rows      → Container: "Payment Domain DB [PostgreSQL]"     — JDBC/SQL [Write]

Container: "IAM Service [Keycloak]"                       ← Transversal
  ← validates tokens (via Kong)   ← Container: "Mobile BFF [Node.js]"              — HTTPS/JSON [Auth]

Container: "GL Posting Service [Spring Boot]"             ← Transversal
  → posts entries                  → External System: "General Ledger [SAP]"        — MQ/JMS/XML [Internal]
  ← called by Payment Service      ← Container: "Payment Service [Spring Boot]"     — HTTPS/REST [Internal]
```

---

## 4. C3 — Component Diagram

At C3, you **zoom into a single Container** to show its internal components. Choose the most architecturally significant containers:

### C3 for a Business Scenario Orchestrator (Layer 3)

```
Component: "TransferController [Spring REST Controller]"
  → uses → Component: "TransferSagaOrchestrator [Temporal Workflow]"

Component: "TransferSagaOrchestrator [Temporal Workflow]"
  → Step 1: validates → Component: "PaymentClient [REST Client]"
  → Step 2: checks balance → Component: "AccountClient [REST Client]"
  → Step 3: screens AML → Component: "ComplianceClient [REST Client]"
  → Step 4: executes → Component: "PaymentClient [REST Client]"
  → Step 5: notifies → Component: "NotificationClient [Kafka Producer]"

Component: "SagaStateRepository [Spring Data JPA]"
  → reads/writes saga rows         → Container: "Orchestration DB [PostgreSQL]"   — JDBC/SQL [Write]

Component: "TransferSagaOrchestrator"
  → persists saga state → Component: "SagaStateRepository"

Component: "PaymentClient [REST Client]"
  → calls Payment Service          → Container: "Payment Service [Spring Boot]"   — HTTPS/REST [Internal]

Component: "AccountClient [REST Client]"
  → calls Account Service          → Container: "Account Service [Spring Boot]"   — HTTPS/REST [Internal]

Component: "ComplianceClient [REST Client]"
  → calls Compliance Service       → Container: "Compliance Service [Spring Boot]" — HTTPS/REST [Internal]

Component: "NotificationClient [Kafka Producer]"
  → publishes (Kafka topic: notification-events, async)                            — TLS/AVRO [Event]
       → Container: "Notification Service [Node.js]"
  (broker collapsed into description per Infrastructure-as-via Rule)
```

### C3 for a BIAN Service Domain (Layer 5)

```
Component: "CurrentAccountController [REST Controller]"
  → uses → Component: "CurrentAccountService [Domain Service]"

Component: "CurrentAccountService [Domain Service]"
  → uses → Component: "AccountDomainModel [Domain Entity]"
  → uses → Component: "CoreBankingAdapter [Anti-Corruption Layer]"
  → uses → Component: "AccountRepository [Data Access]"
  → uses → Component: "AccountEventPublisher [Kafka Producer]"

Component: "CoreBankingAdapter [Anti-Corruption Layer]"
  → translates and calls Core Banking → External System: "Core Banking [AS/400]"  — MQ/JMS/XML [Internal]
  → caches core responses → Component: "CoreCacheManager [Redis Client]"

Component: "CoreCacheManager [Redis Client]"
  → reads/writes session keys     → Container: "Domain Cache [Redis]"             — TCP/RESP [Cache]

Component: "AccountRepository [Data Access]"
  → reads/writes account rows     → Container: "Account Domain DB [PostgreSQL]"   — JDBC/SQL [Write]

Component: "AccountEventPublisher [Kafka Producer]"
  → publishes (Kafka topic: account-events, async)                                 — TLS/AVRO [Event]
       → Container: "Audit Service [Spring Boot]"
       → Container: "Notification Service [Node.js]"
  (broker collapsed into description per Infrastructure-as-via Rule;
   one edge per producer-consumer pair, topic name is the join)
```

The **Anti-Corruption Layer** component is critical in Layer 5 — it isolates the clean domain model from the complexity of legacy core banking protocols and data formats.

---

## 5. Step-by-Step Translation Process

### Step 1: Inventory All Components by Layer

Create a table listing every deployable component and its META layer:

| Component | META Layer | Type | Technology |
|-----------|-----------|------|------------|
| Mobile App | L1 Channel | Native app | Kotlin/Swift |
| Web Portal | L1 Channel | SPA | React |
| Mobile BFF | L2 Experience | BFF service | Node.js |
| Web BFF | L2 Experience | BFF service | Node.js |
| API Gateway | Cross-layer | Gateway | Kong |
| Transfer Orchestrator | L3 Scenario | Orchestration service | Spring Boot |
| Payment Service | L4 Business | Business service | Spring Boot |
| Account Service | L4 Business | Business service | Spring Boot |
| Current Account SD | L5 Domain | Domain service | Quarkus |
| Payment Order SD | L5 Domain | Domain service | Quarkus |
| Core Banking | L6 Core | Legacy system | AS/400 |
| IAM | Transversal | Security | Keycloak |

### Step 2: Classify for C1

- Channels (L1) → separate Systems
- L2-L5 → single System ("Banking Platform")
- L6 Core (legacy) → External System
- External integrations → External Systems
- Users → Persons

### Step 3: Draw C1

Draw the System Context diagram following the classification from Step 2. Keep it simple — 3-7 Systems, 2-4 Persons, 2-5 External Systems.

### Step 4: Expand to C2

Replace the "Banking Platform" System with its internal Containers:

1. Draw horizontal bands (dashed rectangles) for each META layer
2. Place each service as a Container within its layer's band
3. Place data stores at the bottom
4. Place transversal services in a vertical column on the right
5. Place the API Gateway between L2 and L3
6. Draw arrows with protocols
7. Distinguish sync (solid) and async (dashed) arrows

### Step 5: Select and Draw C3 (for key containers)

Choose 2-3 architecturally significant containers and draw their Component diagrams:

- One orchestrator (Layer 3) — to show saga/workflow patterns
- One BIAN service domain (Layer 5) — to show the anti-corruption layer over core
- One transversal service — if it has complex internal structure

### Step 6: Validate

- Every C2 Container traces back to the C1 System
- Every C3 Component lives inside a C2 Container
- Layer boundaries are respected (no arrows skip layers without passing through an intermediate service)
- External Systems at C1 appear consistently at C2
- Transversal services are accessible from multiple layers (vertical arrows)

---

## 6. Common Pattern Translations

### 6.1 SaaS Integration (Modern Core)

When the bank uses a SaaS core banking platform (e.g., Mambu, Thought Machine):

```
C1: External System: "Mambu [Core Banking SaaS]"
C2: Container: "Account SD [Quarkus]"
      → calls Mambu             → External System: "Mambu [Core Banking SaaS]"   — HTTPS/REST [Internal]
```

The SaaS platform is always an External System — it is not deployed or operated by the bank.

### 6.2 Transversal Services

Transversal services are modeled as regular Containers but visually grouped vertically:

```
C2: Container: "IAM Service [Keycloak]"
      ← validates tokens (via Kong) ← Container: "Web BFF [Node.js]"               — HTTPS/JSON [Auth]
      ← authenticates users         ← Container: "Mobile BFF [Node.js]"            — HTTPS/JSON [Auth]

    Container: "GL Posting Service [Spring Boot]"
      ← posts entries               ← Container: "Payment Service [Spring Boot]"   — HTTPS/REST [Internal]
      ← posts entries               ← Container: "Lending Service [Spring Boot]"   — HTTPS/REST [Internal]
      → writes ledger entries       → Container: "GL Database [PostgreSQL]"        — JDBC/SQL [Write]
```

Transversal Containers have arrows from **multiple layers** — this is what makes them visually vertical.

### 6.3 BIAN Service Domains

Each BIAN SD is a Container at C2. Its internal structure (C3) always includes an Anti-Corruption Layer:

```
C2: Container: "Current Account SD [Quarkus]"
      → calls core              → External System: "Core Banking [AS/400]"        — MQ/JMS/XML [Internal]

C3 (inside Current Account SD):
  Component: "AccountController [REST API]"
  Component: "AccountService [Domain Logic]"
  Component: "CoreBankingAdapter [ACL]"     ← Anti-Corruption Layer
  Component: "AccountRepository [JPA]"
```

### 6.4 Channel as System

Each channel is a System at C1 and does NOT appear at C2 (it is outside the Banking Platform boundary):

```
C1: System: "Mobile Banking App [iOS/Android]"
      → uses → System: "Banking Platform"

C2 (inside Banking Platform):
  Container: "Mobile BFF [Node.js]"         ← the channel's entry point into the platform
```

The Mobile BFF is inside the Banking Platform. The Mobile App is outside. The BFF is the bridge.

### 6.5 Orchestration Layer (Saga)

Business Scenarios (Layer 3) are orchestrators. They appear as Containers with many outgoing arrows:

```
C2: Container: "Onboarding Orchestrator [Temporal + Spring Boot]"
      → calls → Container: "Customer Service"
      → calls → Container: "Account Service"
      → calls → Container: "Card Service"
      → calls → Container: "Compliance Service (KYC)"
      → calls → Container: "Notification Service"
      → persists saga state → Container: "Orchestration DB [PostgreSQL]"
```

The orchestrator is the **most connected Container** at C2 — it is the hub of the business process.

---

## 7. Anti-Patterns

### Anti-Pattern 1: Mixing Abstraction Levels

**Wrong**: Showing META layers as C4 Systems at C1 — e.g., "Layer 3 System", "Layer 4 System", "Layer 5 System".

**Why it's wrong**: META layers are not Systems. They are organizational groupings within a single System. Showing them as Systems at C1 implies they are independent products.

**Fix**: Collapse Layers 2-5 into one System at C1. Show layers as visual groupings (dashed rectangles) only at C2.

### Anti-Pattern 2: Layer Explosion at C1

**Wrong**: Showing 15+ boxes at C1 because each Layer 3 orchestrator, Layer 4 service, and Layer 5 domain is drawn as a System.

**Why it's wrong**: C1 should show 3-7 Systems, not the entire internal architecture. The audience for C1 is non-technical stakeholders who need to understand what the system is, not how it works.

**Fix**: One System for the Banking Platform. Individual services appear only at C2.

### Anti-Pattern 3: Missing Channels as Systems

**Wrong**: Not showing the Mobile App, Web Portal, or ATM Network at C1. Or showing them as Containers inside the Banking Platform.

**Why it's wrong**: Channels are independently deployed applications with their own teams, release cycles, and technology stacks. They are Systems in C4 terms.

**Fix**: Each independently deployed channel is a System at C1 with an arrow to the Banking Platform System.

### Anti-Pattern 4: Transversal as Horizontal Layer

**Wrong**: Drawing transversal services (Security, Accounting, Rules) as a seventh horizontal layer at the bottom or top of the C2 diagram.

**Why it's wrong**: Transversal services are vertical — they serve all layers. Drawing them as a horizontal layer implies they are called only by one layer (the one above or below them in the diagram).

**Fix**: Group transversal services in a **vertical column** on the right side of the C2 diagram, with arrows coming from multiple horizontal layers.

### Anti-Pattern 5: Core Banking as a Container

**Wrong**: Drawing the legacy core banking system as a Container inside the Banking Platform at C2.

**Why it's wrong**: If the core banking system is a separate product (especially legacy: AS/400, mainframe, or SaaS), it has its own lifecycle, team, and deployment. It is an External System, not a Container within your platform.

**Fix**: Show core banking as an External System at both C1 and C2. Layer 5 Domain services are the Containers that bridge to it.

### Anti-Pattern 6: Arrows Skipping Layers

**Wrong**: Drawing a direct arrow from a BFF (Layer 2) to a BIAN Service Domain (Layer 5), bypassing Layers 3 and 4.

**Why it's wrong**: META enforces top-down communication through layers. Skipping layers undermines the decoupling the architecture is designed to provide.

**Fix**: If a BFF needs data from Layer 5, it should call through Layer 3 or Layer 4. If a simple read-through is needed, a thin passthrough service in Layer 4 makes the path explicit.

**Exceptions (both require an explicit architectural decision / ADR):**

1. **Reference data reads**: direct reads for simple reference data may be allowed if the bank's META governance permits it.
2. **WebSocket / real-time push (L1 ↔ L4)**: when Layer 1 (Channels) establishes a persistent WebSocket connection to a Layer 4 business service for real-time push (market data, live alerts, streaming telemetry, trading events), the L1 → L4 direct connection is allowed. L2 (UX) and L3 (Scenarios) do not participate in the real-time stream because each hop would add serialization latency that defeats the use case. The WebSocket gateway at L1 handles backpressure; L4 owns the event stream.

   **Security requirement (mandatory)** — because this path bypasses the L2/L3 governance plane, the L4 service exposing the WebSocket endpoint MUST implement the full channel security stack that L2/L3 would normally provide:
   - **WSS/TLS 1.2+** — no cleartext `ws://`
   - **Token-based authentication on the upgrade handshake** (OAuth2/JWT), re-validated on reconnect — not only on the originating HTTP session
   - **Per-message authorization** — validate the subscriber is entitled to each topic/event, not just "connected"
   - **Origin / CORS checks** — reject connections from untrusted origins
   - **Rate limiting + backpressure** — per-connection frame caps, subscription quotas, idle-timeouts
   - **Audit logging** — connect/disconnect/subscribe events with user + channel identity
   - **Input validation** on any client→server frame — treat the L1 channel as untrusted

   These controls must be documented in the Layer 4 component file's security section and referenced from Section 9 (Security Architecture).

---

## 8. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                    META → C4 QUICK REFERENCE                        │
├──────────────────────┬──────────────────────────────────────────────┤
│ META Concept         │ C4 Mapping                                   │
├──────────────────────┼──────────────────────────────────────────────┤
│ Layer 1 Channel      │ C1: System (per channel)                     │
│ Layer 2 Experience   │ C2: Container (BFF services)                 │
│ Layer 3 Scenario     │ C2: Container (orchestrator services)        │
│ Layer 4 Business     │ C2: Container (business microservices)       │
│ Layer 5 Domain       │ C2: Container (BIAN SD microservices)        │
│ Layer 6 Core (legacy)│ C1/C2: External System                      │
│ Layer 6 Core (custom)│ C2: Container(s)                             │
│ Layer 6 Data Fabric  │ C2: External System or Container             │
│ Transversal services │ C2: Containers (vertical grouping)           │
│ Financial Gateways   │ C1/C2: External System                      │
│ API Gateway          │ C2: description = `(via Kong)`,              │
│                      │     protocol = `HTTPS/JSON [Data]` — not node │
│ Per-service database  │ C2: Container (data store)                  │
│ Event Bus (Kafka)    │ C2: description = `(Kafka topic: X, async)`, │
│                      │     protocol = `TLS/AVRO [Event]` — not node │
│                      │     Diagram 4 keeps it as a node.            │
│ BIAN SD internals    │ C3: Components (incl. ACL)                   │
│ Orchestrator internals│ C3: Components (saga steps)                 │
├──────────────────────┼──────────────────────────────────────────────┤
│ Visual Conventions   │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ META layers at C2    │ Dashed rectangle groupings (visual only)     │
│ Transversal column   │ Vertical column on right side                │
│ Data stores          │ Bottom band                                  │
│ API Gateway          │ Between Layer 2 and Layer 3                  │
│ Sync arrows          │ Solid lines with protocol                    │
│ Async arrows         │ Dashed lines with topic name                 │
├──────────────────────┼──────────────────────────────────────────────┤
│ Common Mistakes      │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ ✗ Layer = System     │ ✓ Layers 2-5 = one System                   │
│ ✗ 15 boxes at C1     │ ✓ 3-7 Systems at C1                         │
│ ✗ Channel inside C2  │ ✓ Channel = System at C1                    │
│ ✗ Transversal = band │ ✓ Transversal = vertical column             │
│ ✗ Core as Container  │ ✓ Core (legacy) as External System          │
│ ✗ Arrows skip layers │ ✓ Top-down through layers                   │
└──────────────────────┴──────────────────────────────────────────────┘
```
