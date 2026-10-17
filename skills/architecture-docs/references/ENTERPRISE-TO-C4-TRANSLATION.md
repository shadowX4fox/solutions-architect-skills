# ENTERPRISE Architecture to C4 Model Translation Guide

> **Purpose**: Step-by-step guide for translating the ENTERPRISE 5-layer architecture (Channels, Experience, Process, Domain Services, Systems of Record & Data, plus cross-cutting capabilities) into C4 model diagrams. Covers the fundamental mismatch between ENTERPRISE layers and C4 zoom levels, visual conventions, and common anti-patterns.

---

## 1. The Fundamental Mismatch

ENTERPRISE and C4 answer **different questions**:

| Framework | Question | Answer |
|-----------|----------|--------|
| **ENTERPRISE** | **WHERE** does each concern live? | 5 horizontal layers + cross-cutting capabilities |
| **C4** | **WHAT** exists and at what zoom level? | Systems → Containers → Components (zoom in progressively) |

ENTERPRISE defines **architectural layers** (functional and ownership zones). C4 defines **zoom levels** (abstraction depth). They are orthogonal:

- An ENTERPRISE layer is NOT a C4 level
- A layer may contain elements at several C4 levels — Layer 1 is mostly systems, Layer 4 mostly containers
- Several layers collapse into a single C4 element at a given zoom level

The translation challenge is mapping the horizontal layering into C4's progressive zoom model. This guide provides the rules and conventions for doing so consistently.

---

## 2. C1 — System Context Diagram

At C1, the ENTERPRISE architecture **collapses**. C1 shows the system's relationship with users and external systems — not its internal layer structure.

### Translation Rules

| ENTERPRISE Element | C1 Mapping |
|-------------|------------|
| Layer 1 — Channels built and released by another team (mobile app, web shop, partner applications) | **Separate Systems** (one per independently deployed channel) |
| Layer 1 — Partner / B2B API consumers | **External Systems** (the partner's system) |
| Layer 2 through Layer 4 (Experience → Domain Services) | **Single System** (the platform under design, by its name) |
| Layer 5 — Packaged, core or SaaS system of record | **External System** (its own product and lifecycle) |
| Layer 5 — Store this system owns (ledger, record database) | Part of the main **System** |
| Layer 5 — Enterprise data platform (warehouse, lake) | **External System**, or omit when it only receives a copy |
| Cross-cutting — Identity provider, enterprise broker, observability platform run by others | **External Systems** |
| Cross-cutting — Capability this system builds (notification service it owns) | Part of the main **System** |
| Customers, citizens, members, partners' staff | **Person** |
| Internal staff (agents, operators, back office) | **Person** |

### Key Insight: Channels as Systems

In ENTERPRISE, each channel is usually an independently deployed application with its own release cycle, team and technology:

- Mobile application → System
- Web shop or portal → System
- Agent desktop → System (or External System if a product)
- Partner application → External System

They are NOT Containers inside the platform at C1 — they are Systems that use the platform. The platform's entry point for a channel is its BFF, which lives inside the platform (Layer 2).

### Example C1 Elements

```
Person: "Customer"
  → uses → System: "Order Desk Mobile [iOS/Android]"
  → uses → System: "Order Desk Web [React SPA]"

Person: "Store Associate"
  → uses → System: "Store Desk [Desktop Client]"

External System: "Partner Ordering Clients"
  → submits orders to → System: "Ordering Platform"

System: "Order Desk Web [React SPA]"
  → makes API calls to → System: "Ordering Platform"

System: "Ordering Platform"
  → sends pick requests to → External System: "Warehouse Management System [packaged]"
  → posts invoices to → External System: "ERP Platform [SaaS]"
  → authenticates users via → External System: "Identity Provider [OIDC]"
  → streams changes to → External System: "Analytics Lakehouse"
```

---

## 3. C2 — Container Diagram

At C2, you **zoom into the platform System** and show its internal structure as pure C4 containers. ENTERPRISE layers do NOT appear as visual groupings in the C4 L2 diagram — layer grouping belongs in Diagrams 1 (Logical View) and 4 (Detailed View).

### Translation Rules

| ENTERPRISE Element | C2 Mapping |
|-------------|------------|
| Layer 2 BFF or composition service | `Container()` — e.g., "Order Desk BFF [Node.js]" |
| Layer 2 micro-frontend shell this system deploys | `Container()` — e.g., "Order Desk Shell [Module Federation]" |
| Layer 3 process manager / workflow worker | `Container()` — e.g., "Fulfilment Process [Temporal]" |
| Layer 3 process state store | `ContainerDb()` — e.g., "Process State Store [PostgreSQL]" |
| Layer 4 domain service | `Container()` — e.g., "Catalog Service [Spring Boot]" |
| Layer 4 database per service | `ContainerDb()` — e.g., "Catalog DB [PostgreSQL]" |
| Layer 5 store this system owns | `ContainerDb()` — e.g., "Order Ledger [PostgreSQL]" |
| Layer 5 packaged / SaaS system of record | `System_Ext()` — same element as at C1 |
| API Gateway | **Edge encoding only** — `(via Kong)` in the 3rd `Rel()` parameter (description); 4th parameter follows the canonical `<PROTOCOL>/<STYLE> [Action Type]` form (e.g. `"HTTPS/JSON [Data]"`). Exception: keep as `Container()` only when the gateway runs custom architectural logic that is itself a unit of decision. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2) and Connection Naming Rule (L1 + L2). |
| Event broker owned and operated by this system | `Container()` only in Diagram 4; at C2 the topic is still edge encoding (see next row) |
| Message broker (any) on a C2 edge | **Edge encoding only** — `(Kafka topic: order-events, async)` in the 3rd `Rel()` parameter; 4th parameter is `"TLS/AVRO [Event]"`. Do NOT emit `ContainerQueue("Event Bus")`. |
| Shared platform service this system builds | `Container()` — e.g., "Notification Service [Node.js]" |
| Cache | `ContainerDb()` — e.g., "Price Cache [Redis]" |

### C2 Grouping Convention

The C4 L2 diagram uses **pure C4 conventions** — containers are grouped by their C4 element type, not by ENTERPRISE layers:

- **`Container()`** for all application and service containers (BFFs, process managers, domain services, owned shared services)
- **`ContainerDb()`** for all data stores (databases, caches, owned ledgers)
- **Transit infrastructure** (API gateway, message brokers, topics, queues, service mesh, iPaaS) → **edge label**, not a node. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2) for the canonical rule and label syntax.

No nested `Container_Boundary()` blocks are used for ENTERPRISE layer grouping.

**Note**: ENTERPRISE layer grouping (horizontal bands for L1–L5 and the cross-cutting band `C6`) is expressed in Diagram 1 (Logical View — Mermaid `flowchart TB` `subgraph` bands) and Diagram 4 (Detailed View), not in the C4 L2 diagram.

### Example C2 Elements

Format note for prose narrative: `description → target — <PROTOCOL>/<STYLE> [Action]`. The em-dash separates the 3rd `Rel()` parameter (left, free prose with via/topic context) from the 4th parameter (right, canonical normal form).

```
Container: "Order Desk BFF [Node.js + Express]"            ← Layer 2
  → starts orders (via Kong)     → Container: "Fulfilment Process [Temporal]"      — HTTPS/JSON [Data]
  → validates tokens             → External System: "Identity Provider [OIDC]"     — HTTPS/JSON [Auth]
  (API Gateway collapsed into description — not a node)

Container: "Fulfilment Process [Temporal]"                 ← Layer 3
  → quotes prices                → Container: "Catalog Service [Spring Boot]"      — HTTPS/JSON [Internal]
  → reserves stock               → Container: "Inventory Service [Spring Boot]"    — HTTPS/JSON [Internal]
  → creates the order            → Container: "Order Service [Spring Boot]"        — HTTPS/JSON [Command]
  → reads/writes process state   → Container: "Process State Store [PostgreSQL]"  — JDBC/SQL [Command]

Container: "Order Service [Spring Boot]"                   ← Layer 4
  → writes the order record      → Container: "Order Ledger [PostgreSQL]"          — JDBC/SQL [Command]
  → publishes events (Kafka topic: order-events, async)                           — TLS/AVRO [Event]
       → Container: "Fulfilment Process [Temporal]"
       → Container: "Notification Service [Node.js]"
       (broker collapsed into description — one edge per producer-consumer pair, topic name is the join)

Container: "Inventory Service [Spring Boot]"               ← Layer 4
  → sends pick requests          → External System: "Warehouse Management System" — HTTPS/JSON [Command]
  → reads/writes stock rows      → Container: "Inventory DB [PostgreSQL]"          — JDBC/SQL [Command]

External System: "Warehouse Management System"             ← Layer 5
  → publishes shipments (Kafka topic: shipment-events, async)                     — TLS/AVRO [Event]
       → Container: "Fulfilment Process [Temporal]"
  (a system of record publishes; it never calls a service)

Container: "Notification Service [Node.js]"                ← Cross-cutting (owned)
  ← consumes order events        ← Container: "Order Service [Spring Boot]"        — TLS/AVRO [Event]
```

---

## 4. C3 — Component Diagram

At C3, you **zoom into a single Container** to show its internal components. Choose the most architecturally significant containers.

### C3 for a Process Manager (Layer 3)

```
Component: "PlaceOrderController [REST Controller]"
  → starts → Component: "PlaceOrderWorkflow [Temporal Workflow]"

Component: "PlaceOrderWorkflow [Temporal Workflow]"
  → Step 1: quotes → Component: "CatalogClient [REST Client]"
  → Step 2: reserves → Component: "InventoryClient [REST Client]"
  → Step 3: creates order → Component: "OrderClient [REST Client]"
  → Step 4: on failure, compensates → Component: "CompensationActivities [Temporal Activities]"
  → waits for "shipped" → Component: "ShipmentSignalHandler [Kafka Consumer]"

Component: "ProcessStateRepository [Temporal Persistence]"
  → reads/writes process state    → Container: "Process State Store [PostgreSQL]"   — JDBC/SQL [Command]

Component: "CatalogClient [REST Client]"
  → calls Catalog Service          → Container: "Catalog Service [Spring Boot]"     — HTTPS/JSON [Internal]

Component: "InventoryClient [REST Client]"
  → calls Inventory Service        → Container: "Inventory Service [Spring Boot]"   — HTTPS/JSON [Internal]

Component: "OrderClient [REST Client]"
  → calls Order Service            → Container: "Order Service [Spring Boot]"       — HTTPS/JSON [Command]
```

The workflow holds ids and step state only. A component that stores an order or a price inside the process is an entity leak — move it to the owning Domain Service.

### C3 for a Domain Service over a System of Record (Layer 4)

```
Component: "InventoryController [REST Controller]"
  → uses → Component: "ReservationService [Domain Service]"

Component: "ReservationService [Domain Service]"
  → uses → Component: "StockPosition [Aggregate]"
  → uses → Component: "StockRepository [Data Access]"
  → uses → Component: "WarehouseAdapter [Anti-Corruption Layer]"
  → uses → Component: "InventoryEventPublisher [Outbox Publisher]"

Component: "WarehouseAdapter [Anti-Corruption Layer]"
  → translates and calls the WMS   → External System: "Warehouse Management System" — HTTPS/JSON [Command]

Component: "StockRepository [Data Access]"
  → reads/writes stock rows        → Container: "Inventory DB [PostgreSQL]"         — JDBC/SQL [Command]

Component: "InventoryEventPublisher [Outbox Publisher]"
  → publishes (Kafka topic: inventory-events, async)                               — TLS/AVRO [Event]
       → Container: "Fulfilment Process [Temporal]"
  (broker collapsed into description per Infrastructure-as-via Rule)
```

The **Anti-Corruption Layer** component is what makes Layer 4 the shield over Layer 5 — it isolates the service's model from the record's protocol and format.

---

## 5. Step-by-Step Translation Process

### Step 1: Inventory All Components by Layer

Create a table listing every deployable component and its ENTERPRISE layer:

| Component | ENTERPRISE Layer | Type | Technology |
|-----------|-----------|------|------------|
| Order Desk Mobile | L1 Channels | Native app (own team) | Kotlin / Swift |
| Order Desk Web | L1 Channels | SPA (own team) | React |
| Order Desk BFF | L2 Experience | BFF service | Node.js |
| API Gateway | Cross-cutting — Integration | Gateway | Kong |
| Fulfilment Process | L3 Process | Workflow worker | Temporal |
| Process State Store | L3 Process | Database | PostgreSQL |
| Catalog Service | L4 Domain Services | Domain service | Spring Boot |
| Order Service | L4 Domain Services | Domain service | Spring Boot |
| Inventory Service | L4 Domain Services | Domain service | Spring Boot |
| Order Ledger | L5 Systems of Record & Data | Owned record store | PostgreSQL |
| Warehouse Management System | L5 Systems of Record & Data | Packaged system | vendor product |
| Event Backbone | Cross-cutting — Integration | Broker (owned) | Apache Kafka |
| Identity Provider | Cross-cutting — Identity & Security | External platform | OIDC |
| Notification Service | Cross-cutting — Shared Platform Services | Service (owned) | Node.js |

### Step 2: Classify for C1

- Channels (L1) → separate Systems, partners → External Systems
- L2–L4, owned L5 stores and owned cross-cutting services → single System (the platform)
- Packaged / SaaS systems of record (L5) → External Systems
- Cross-cutting platforms run by others → External Systems
- Users → Persons

### Step 3: Draw C1

Draw the System Context diagram following the classification from Step 2. Keep it simple — 3-7 Systems, 2-4 Persons, 2-5 External Systems.

### Step 4: Expand to C2

Replace the platform System with its internal Containers:

1. Draw each container of L2, L3 and L4, and each owned store
2. Keep packaged and SaaS systems of record as External Systems at the edge
3. Name the API Gateway on each connection it fronts — `(via Kong)` in the description, or `· Via kong` in the label in governed mode — never as a box
4. Name each topic on the edge it carries — `(Kafka topic: X, async)` — one edge per producer-consumer pair
5. Draw arrows with protocols
6. Distinguish sync (solid) and async (dashed) arrows
7. Leave layer bands to Diagrams 1 and 4

### Step 5: Select and Draw C3 (for key containers)

Choose 2-3 architecturally significant containers and draw their Component diagrams:

- One process manager (Layer 3) — to show the steps, compensation and process state
- One domain service that reaches a system of record (Layer 4) — to show the anti-corruption layer
- One owned cross-cutting service — if it has complex internal structure

### Step 6: Validate

- Every C2 Container traces back to the C1 System
- Every C3 Component lives inside a C2 Container
- Layer boundaries are respected — every call goes one layer down or to a cross-cutting capability; a skip names its ADR
- No edge leaves a system of record toward a higher layer except an event
- External Systems at C1 appear consistently at C2
- Cross-cutting containers are reached from several layers

---

## 6. Common Pattern Translations

### 6.1 SaaS or Packaged System of Record

When a system of record is a product (ERP, WMS, CRM, policy administration):

```
C1: External System: "ERP Platform [SaaS]"
C2: Container: "Billing Service [Spring Boot]"
      → posts invoices           → External System: "ERP Platform [SaaS]"         — HTTPS/JSON [Command]
```

The product is always an External System — it is not deployed or operated by this system's team.

### 6.2 Owned Record Store

When this system operates the authoritative store itself:

```
C2: ContainerDb: "Order Ledger [PostgreSQL]"
      ← writes the order record  ← Container: "Order Service [Spring Boot]"       — JDBC/SQL [Command]
```

Only its owning Domain Service writes it. Other services read through that service.

### 6.3 Cross-Cutting Capabilities

Owned cross-cutting services are regular Containers reached from several layers:

```
C2: Container: "Notification Service [Node.js]"
      ← consumes order events      ← Container: "Order Service [Spring Boot]"       — TLS/AVRO [Event]
      ← sends confirmations        ← Container: "Fulfilment Process [Temporal]"     — HTTPS/JSON [Command]
```

Platforms run by other teams (identity provider, enterprise broker, observability) are External Systems, or edge encoding when they are transit infrastructure.

### 6.4 Channel as System

Each channel is a System at C1 and does NOT appear at C2 (it is outside the platform boundary):

```
C1: System: "Order Desk Mobile [iOS/Android]"
      → uses → System: "Ordering Platform"

C2 (inside Ordering Platform):
  Container: "Order Desk BFF [Node.js]"     ← the channel's entry point into the platform
```

The BFF is inside the platform. The mobile application is outside. The BFF is the bridge.

### 6.5 Process Layer

Processes are orchestrators. They appear as Containers with many outgoing arrows and one state store:

```
C2: Container: "Fulfilment Process [Temporal]"
      → calls → Container: "Catalog Service"
      → calls → Container: "Inventory Service"
      → calls → Container: "Order Service"
      → persists process state → ContainerDb: "Process State Store [PostgreSQL]"
```

The process manager is usually the **most connected Container** at C2 — it is the hub of the use case.

### 6.6 Optional Capability Tag

When the project carries an alignment (for example `BIAN_ALIGNMENT.md`), a Domain Service may carry the capability it implements as a tag in its descriptor. The tag never changes the C4 element: a tagged service is the same `Container()` at C2, named by its canonical name, not by the capability.

---

## 7. Anti-Patterns

### Anti-Pattern 1: Mixing Abstraction Levels

**Wrong**: Showing ENTERPRISE layers as C4 Systems at C1 — e.g., "Process System", "Domain Services System".

**Why it's wrong**: Layers are groupings within one System. Showing them as Systems implies they are independent products.

**Fix**: Collapse Layers 2–4 into one System at C1. Show layers as bands only in Diagrams 1 and 4.

### Anti-Pattern 2: Layer Explosion at C1

**Wrong**: Showing 15+ boxes at C1 because each process and domain service is drawn as a System.

**Why it's wrong**: C1 shows 3-7 Systems for an audience that needs to know what the system is, not how it works.

**Fix**: One System for the platform. Individual services appear only at C2.

### Anti-Pattern 3: Channels Inside the Platform

**Wrong**: Drawing the mobile application or the web shop as a Container of the platform, or leaving channels out of C1.

**Why it's wrong**: Channels are independently deployed applications with their own teams and release cycles.

**Fix**: Each independently deployed channel is a System at C1 with an arrow to the platform. Its BFF is the Container.

### Anti-Pattern 4: Cross-Cutting as a Horizontal Layer

**Wrong**: Treating Integration, Identity or Shared Platform Services as a sixth layer that only the layer above or below may call.

**Why it's wrong**: Cross-cutting capabilities serve every layer and take no part in the dependency rule.

**Fix**: Draw them in their own band `C6` with edges from several layers in Diagram 1, and as Containers or External Systems reached from several layers at C2.

### Anti-Pattern 5: API Gateway or Broker as a Container

**Wrong**: Drawing the API gateway or a shared enterprise broker as a box in the logical model.

**Why it's wrong**: They are transit infrastructure; the box hides who actually calls whom.

**Fix**: Name the gateway on the connection (`(via Kong)`, governed `· Via kong`) and the topic on the edge. A broker is a node only in Diagram 4, and only when this system owns it.

### Anti-Pattern 6: Arrows Skipping Layers

**Wrong**: A BFF (Layer 2) calling a Domain Service (Layer 4) for a write, or any upper layer reaching a system of record (Layer 5) directly.

**Why it's wrong**: Skipping layers moves business decisions into the wrong place and couples the channel to the record.

**Fix**: Route through the layer skipped. **Exception**: a read of reference data from Layer 2 to Layer 4 may be allowed by an ADR named on the connection's integration row.

### Anti-Pattern 7: Systems of Record Calling Up

**Wrong**: An arrow from a system of record to a Domain Service or a process ("WMS calls Order Service when shipped").

**Why it's wrong**: The record becomes coupled to the services above it, and each new consumer needs a change in the record.

**Fix**: The record publishes (outbox, CDC, event on the backbone); consumers subscribe.

### Anti-Pattern 8: Process Owning Entities

**Wrong**: The process store holds orders, customers or prices that the process reads and changes.

**Why it's wrong**: Two writers for one entity; the Domain Service no longer enforces its invariants.

**Fix**: The process keeps ids and step state; the entity stays with its Domain Service.

---

## 8. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                 ENTERPRISE → C4 QUICK REFERENCE                     │
├──────────────────────┬──────────────────────────────────────────────┤
│ ENTERPRISE Concept   │ C4 Mapping                                   │
├──────────────────────┼──────────────────────────────────────────────┤
│ L1 Channel           │ C1: System (per channel) / External System   │
│ L2 Experience        │ C2: Container (BFF, composition)             │
│ L3 Process           │ C2: Container (process manager) + store      │
│ L4 Domain Service    │ C2: Container + its own database             │
│ L5 Record (product)  │ C1/C2: External System                       │
│ L5 Record (owned)    │ C2: ContainerDb                              │
│ L5 Data platform     │ C1/C2: External System, or omit              │
│ Cross-cutting (owned)│ C2: Container, reached from several layers   │
│ Cross-cutting (other)│ C1/C2: External System                       │
│ API Gateway          │ C2: description = `(via Kong)`,              │
│                      │     protocol = `HTTPS/JSON [Data]` — not node │
│                      │     (governed: `HTTPS/JSON [Data] · Via kong`)│
│ Event broker / topic │ C2: description = `(Kafka topic: X, async)`, │
│                      │     protocol = `TLS/AVRO [Event]` — not node │
│                      │     Diagram 4 keeps an owned broker as node. │
│ Capability tag       │ Descriptor metadata only — no C4 change      │
│ Process internals    │ C3: Components (steps, compensation)         │
│ Domain internals     │ C3: Components (incl. ACL, outbox)           │
├──────────────────────┼──────────────────────────────────────────────┤
│ Visual Conventions   │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ Layers               │ Bands in Diagrams 1 and 4 only, never at C2  │
│ Cross-cutting        │ Band C6, edges from several layers           │
│ Sync arrows          │ Solid lines with protocol                    │
│ Async arrows         │ Dashed lines with topic name                 │
├──────────────────────┼──────────────────────────────────────────────┤
│ Common Mistakes      │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ ✗ Layer = System     │ ✓ Layers 2-4 = one System                    │
│ ✗ 15 boxes at C1     │ ✓ 3-7 Systems at C1                          │
│ ✗ Channel inside C2  │ ✓ Channel = System at C1                     │
│ ✗ Gateway as box     │ ✓ Gateway on the connection                  │
│ ✗ Record calls up    │ ✓ Record publishes events                    │
│ ✗ Process owns data  │ ✓ Process owns process state only            │
│ ✗ Arrows skip layers │ ✓ One layer down, or an ADR                  │
└──────────────────────┴──────────────────────────────────────────────┘
```
