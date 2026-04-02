# N-Layer to C4 Translation Guide

## Key Insight

N-Layer code layers (UI, Application, Domain, Infrastructure) all deploy together as **ONE process**. They are not separate containers. In C4 terms, an N-Layer backend is a single **Container** (C2), and its internal layers become **Components** (C3) when you zoom in.

The critical distinction:

```
WRONG thinking:
  Domain Layer     = Container (C2)      ← NO
  Application Layer = Container (C2)     ← NO
  Infrastructure Layer = Container (C2)  ← NO

RIGHT thinking:
  Entire Backend   = ONE Container (C2)  ← YES (single deployable unit)
  Domain Layer     = Components (C3)     ← Zoom into the container
  Application Layer = Components (C3)    ← Zoom into the container
  Infrastructure   = Components (C3)     ← Zoom into the container
```

Only elements that run as **separate processes** — databases, caches, message brokers, external APIs — are separate C2 Containers.

---

## The Layer ≠ Container Distinction

### Why Layers Are NOT Containers

A C4 Container is "something that needs to be running in order for the overall software system to work" — a separately deployable/runnable unit. In an N-Layer application:

- All layers compile into one artifact (JAR, DLL, Docker image)
- All layers start/stop together as one process
- All layers share the same memory space
- Inter-layer calls are in-process method invocations, not network calls

Therefore, an N-Layer backend is **ONE Container** regardless of how many internal layers it has.

### What IS a Separate Container?

| Element | Separate Container? | Why |
|---------|-------------------|-----|
| Backend application (all layers) | YES — one Container | Single deployable process |
| PostgreSQL database | YES — separate Container | Separate process, own lifecycle |
| Redis cache | YES — separate Container | Separate process, own lifecycle |
| Kafka / RabbitMQ | YES — separate Container | Separate process, own lifecycle |
| Frontend SPA (if served separately) | YES — separate Container | Separate deployable |
| Domain Layer | NO | Code module inside the backend |
| Application Layer | NO | Code module inside the backend |
| Infrastructure Layer | NO | Code module inside the backend |

---

## C1 — Context Diagram

At C1, an N-Layer application looks identical to any other monolithic backend. The internal layers are invisible.

### What to Show

| Element | C1 Representation |
|---------|------------------|
| The entire N-Layer backend | One System box |
| Frontend (if independently deployed) | Separate System or Person |
| External systems (payment, email, etc.) | External System boxes |
| Users | Person boxes |

### Example C1

```
+----------+          +---------------------------+          +----------------+
|          |  HTTPS   |                           |   REST   |                |
|  Customer|--------->|  Order Management System  |--------->| Payment Gateway|
|          |          |  [N-Layer Backend]         |          | [External]     |
+----------+          +---------------------------+          +----------------+
                               |
                               | SQL
                               v
                      +------------------+
                      | (not shown at C1 |
                      |  — internal)     |
                      +------------------+
```

At C1, you show:
- **Person**: Customer
- **System**: Order Management System (your N-Layer app as ONE box)
- **External System**: Payment Gateway, Email Service, etc.
- **Relationships**: labeled with protocol and purpose

### C1 Rules for N-Layer

1. The backend is ONE System — do not decompose layers
2. If the frontend is an SPA served by a CDN (separate deployment), show it as a separate System
3. If the frontend is server-rendered by the backend, it is part of the same System
4. External services remain as single External System boxes

---

## C2 — Container Diagram

At C2, zoom into the System to show its deployable units using pure C4 conventions. The N-Layer backend is still **ONE Container** here — internal layers do NOT appear as visual groupings in the C4 L2 diagram (layer grouping belongs in Diagrams 1 and 4). Containers are grouped by C4 element type: `Container()` for apps, `ContainerDb()` for stores, `ContainerQueue()` for brokers.

### What to Show

| Element | C2 Representation | Label Format |
|---------|-------------------|-------------|
| N-Layer backend | One Container (App) | `Order Service [Spring Boot]` |
| Frontend SPA | Container (App) | `Web App [React SPA]` |
| Primary database | Container (Store) | `Order DB [PostgreSQL 15]` |
| Cache | Container (Store) | `Cache [Redis 7]` |
| Message broker | Container (App) | `Event Bus [Apache Kafka]` |
| External systems | External System | `Payment Gateway [Stripe]` |

### Example C2

```
+------------------+
|    Customer      |
|    [Person]      |
+--------+---------+
         | HTTPS/REST
         v
+------------------+         +---------------------+
| Web App          |  REST   | Order Service        |
| [React SPA]      |-------->| [Spring Boot]        |
| Container (App)  |         | Container (App)      |
+------------------+         | ← ALL N-Layer code   |
                             | ← lives inside here  |
                             +----+------+-----+----+
                                  |      |     |
                         SQL/JDBC |      |     | REST
                                  v      |     v
                    +-------------+  Redis  +-----------+
                    | Order DB    |  Proto  | Payment   |
                    | [PostgreSQL]|  col    | Gateway   |
                    | Container   |   |     | [External]|
                    | (Store)     |   v     +-----------+
                    +-------------+  +----------+
                                     | Cache    |
                                     | [Redis]  |
                                     | Container|
                                     | (Store)  |
                                     +----------+
```

### C2 Rules for N-Layer

1. **ONE Container for the backend** — all 4/5 layers are inside it
2. Technology label shows the framework: `[Spring Boot]`, `[NestJS]`, `[ASP.NET Core]`
3. Database, cache, message broker are separate Containers
4. Arrow labels show protocol: `SQL/JDBC`, `Redis Protocol`, `REST/HTTPS`, `AMQP`
5. Do NOT create containers named "Domain Layer" or "Application Layer"

---

## C3 — Component Diagram

C3 is where N-Layer architecture shines. Zooming into the single backend Container reveals the internal layer structure as Components.

### General Mapping: Layers to C3 Components

| N-Layer Element | C3 Component Type | Example |
|----------------|-------------------|---------|
| REST Controller | Component | `Order Controller [REST]` |
| GraphQL Resolver | Component | `Order Resolver [GraphQL]` |
| Application Service / Use Case | Component | `Create Order Use Case` |
| Domain Entity / Aggregate | Component | `Order Aggregate` |
| Domain Service | Component | `Pricing Service` |
| Repository Interface | Component (interface) | `IOrderRepository` |
| Repository Implementation | Component | `Postgres Order Repository` |
| Event Publisher | Component | `Kafka Event Publisher` |
| External API Client | Component | `Stripe Payment Client` |

---

### Variant-Specific C3: DDD 4-Layer

```
Zoom into: Order Service [Spring Boot] Container
+------------------------------------------------------------------+
|                    Order Service (C2 Container)                   |
|                                                                  |
|  [UI Layer]                                                      |
|  +---------------------+  +---------------------+               |
|  | OrderController     |  | OrderDtoMapper      |               |
|  | [REST Controller]   |  | [DTO Mapper]        |               |
|  +----------+----------+  +---------------------+               |
|             | calls                                              |
|  [Application Layer]                                             |
|  +---------------------+  +---------------------+               |
|  | CreateOrderUseCase  |  | GetOrderQueryHandler|               |
|  | [Application Svc]   |  | [Query Handler]     |               |
|  +----------+----------+  +---------------------+               |
|             | calls                                              |
|  [Domain Layer]                                                  |
|  +---------------------+  +---------------------+               |
|  | Order               |  | PricingService      |               |
|  | [Aggregate Root]    |  | [Domain Service]    |               |
|  +---------------------+  +---------------------+               |
|  +---------------------+                                        |
|  | IOrderRepository    |  ← Interface (port)                    |
|  | [Repository Intf]   |                                        |
|  +----------+----------+                                        |
|             | implemented by                                     |
|  [Infrastructure Layer]                                          |
|  +---------------------+  +---------------------+               |
|  | PostgresOrderRepo   |  | KafkaEventPublisher |               |
|  | [Repository Impl]   |  | [Event Publisher]   |               |
|  +----------+----------+  +----------+----------+               |
+------------------------------------------------------------------+
              |                          |
              | SQL                      | Kafka Protocol
              v                          v
     +---------------+          +----------------+
     | Order DB      |          | Event Bus      |
     | [PostgreSQL]  |          | [Kafka]        |
     +---------------+          +----------------+
```

### Variant-Specific C3: Clean Architecture

```
Zoom into: Order Service [NestJS] Container
+------------------------------------------------------------------+
|                    Order Service (C2 Container)                   |
|                                                                  |
|  [Frameworks & Drivers]                                          |
|  +---------------------+  +---------------------+               |
|  | Express App Config  |  | TypeORM Config      |               |
|  | [Framework Config]  |  | [ORM Config]        |               |
|  +---------------------+  +---------------------+               |
|                                                                  |
|  [Interface Adapters]                                            |
|  +---------------------+  +---------------------+               |
|  | OrderController     |  | OrderPresenter      |               |
|  | [REST Controller]   |  | [Presenter]         |               |
|  +----------+----------+  +---------------------+               |
|  +---------------------+  +---------------------+               |
|  | TypeORMOrderRepo    |  | StripePaymentGw     |               |
|  | [Gateway Impl]      |  | [Gateway Impl]      |               |
|  +----------+----------+  +----------+----------+               |
|             | implements                | implements             |
|  [Use Cases]                                                     |
|  +---------------------+  +---------------------+               |
|  | CreateOrder         |  | CancelOrder         |               |
|  | [Use Case]          |  | [Use Case]          |               |
|  +----------+----------+  +---------------------+               |
|             | uses                                               |
|  [Entities]                                                      |
|  +---------------------+  +---------------------+               |
|  | Order               |  | Money               |               |
|  | [Entity]            |  | [Value Object]      |               |
|  +---------------------+  +---------------------+               |
+------------------------------------------------------------------+
```

### Variant-Specific C3: Hexagonal Architecture

```
Zoom into: Order Service [Spring Boot] Container
+------------------------------------------------------------------+
|                    Order Service (C2 Container)                   |
|                                                                  |
|  [Primary Adapters — Driving]                                    |
|  +---------------------+  +---------------------+               |
|  | OrderRestController |  | OrderEventListener  |               |
|  | [REST Adapter]      |  | [Kafka Adapter]     |               |
|  +----------+----------+  +----------+----------+               |
|             | calls                   | calls                    |
|  [Primary Ports]                                                 |
|  +---------------------+  +---------------------+               |
|  | ICreateOrder        |  | IProcessPayment     |               |
|  | [Input Port]        |  | [Input Port]        |               |
|  +----------+----------+  +---------------------+               |
|             | implemented by                                     |
|  [Application Core]                                              |
|  +---------------------+  +---------------------+               |
|  | CreateOrderUseCase  |  | Order Aggregate     |               |
|  | [Use Case]          |  | [Domain Entity]     |               |
|  +---------------------+  +---------------------+               |
|  [Secondary Ports]                                               |
|  +---------------------+  +---------------------+               |
|  | IOrderRepository    |  | IEventPublisher     |               |
|  | [Output Port]       |  | [Output Port]       |               |
|  +----------+----------+  +----------+----------+               |
|             | implemented by          | implemented by           |
|  [Secondary Adapters — Driven]                                   |
|  +---------------------+  +---------------------+               |
|  | PostgresOrderRepo   |  | KafkaEventPublisher |               |
|  | [DB Adapter]        |  | [Messaging Adapter] |               |
|  +----------+----------+  +----------+----------+               |
+------------------------------------------------------------------+
              |                          |
              | SQL                      | Kafka Protocol
              v                          v
     +---------------+          +----------------+
     | Order DB      |          | Event Bus      |
     | [PostgreSQL]  |          | [Kafka]        |
     +---------------+          +----------------+
```

---

## Pattern Translations

### CQRS Within N-Layer

CQRS splits read and write paths but does NOT create separate containers (unless the read model uses a different database).

```
C2 Level:
  Backend Container (ONE) → Write DB [PostgreSQL] (Container)
                          → Read DB [Elasticsearch] (Container)  ← ONLY if separate process

C3 Level (inside Backend Container):
  +---------------------------+    +---------------------------+
  | Command Side              |    | Query Side                |
  | CreateOrderCommandHandler |    | GetOrderQueryHandler      |
  | [Command Handler]         |    | [Query Handler]           |
  | Order Aggregate           |    | OrderReadModel            |
  | [Domain Entity]           |    | [Read Model]              |
  | PostgresOrderRepo         |    | ElasticOrderRepo          |
  | [Write Repository]        |    | [Read Repository]         |
  +---------------------------+    +---------------------------+
```

### Event Sourcing

Event Sourcing stores events instead of current state. The Event Store is a separate C2 Container.

```
C2 Level:
  Backend Container → Event Store [EventStoreDB] (Container)
                    → Read DB [PostgreSQL] (Container) — projections

C3 Level (inside Backend Container):
  EventSourcedOrderRepo [Repository] → stores events via Event Store
  OrderProjection [Projector] → reads events, builds read model in Read DB
```

### Repository Pattern

The Repository pattern creates a clear C3 boundary:

```
C3 Component:  IOrderRepository [Interface]     ← Domain layer
C3 Component:  PostgresOrderRepository [Impl]   ← Infrastructure layer
               Arrow: PostgresOrderRepository --implements--> IOrderRepository
               Arrow: PostgresOrderRepository --SQL--> Order DB (C2 Container)
```

### Domain Events

Domain Events flow through an Event Publisher component to an external message broker:

```
C3 Level:
  Order Aggregate --raises--> OrderPlacedEvent
  DomainEventDispatcher [Component] --publishes to--> Event Bus [Kafka] (C2 Container)
  InventoryEventListener [Component] --subscribes from--> Event Bus
```

---

## Anti-Patterns

| Anti-Pattern | Why It Is Wrong | Correct Approach |
|-------------|----------------|-----------------|
| **Each layer as a C2 Container** | Layers are code modules, not deployable units. They share one process. | ONE Container for the backend; layers become C3 Components |
| **DDD layers as deployment units** | `domain.jar` and `application.jar` are compile-time modules, not runtime processes | Show as C3 Components inside one C2 Container |
| **Domain logic in Infrastructure C3** | Repository implementations contain business rules | Keep business rules in Domain C3 Components; Infrastructure only maps data |
| **Missing interface components** | C3 omits the ports/interfaces that define boundaries | Show `IOrderRepository` as a C3 Component with "implements" arrows |
| **Fat Controller in C3** | One Controller component handles all endpoints | Split into focused Controller components per resource or use case |
| **Cross-cutting as a Container** | Logging, security, config shown as separate C2 Containers | Show as C3 Components inside the backend Container (or omit if framework-provided) |

---

## Quick Reference Card

### N-Layer → C1

| N-Layer Element | C1 Mapping |
|----------------|-----------|
| Entire application (all layers) | ONE System |
| Frontend (if separately deployed) | Separate System or part of same System |
| External services | External Systems |
| Users | Persons |

### N-Layer → C2

| N-Layer Element | C2 Mapping |
|----------------|-----------|
| Backend (all layers combined) | ONE Container `[Framework]` |
| Database | Container (Store) `[Technology]` |
| Cache | Container (Store) `[Technology]` |
| Message broker | Container `[Technology]` |
| External API | External System |
| Frontend SPA | Container (App) `[Technology]` |

### N-Layer → C3

| N-Layer Element | C3 Mapping |
|----------------|-----------|
| REST/gRPC Controller | Component `[REST Controller]` |
| Application Service / Use Case | Component `[Application Service]` or `[Use Case]` |
| Domain Entity / Aggregate | Component `[Aggregate]` or `[Entity]` |
| Domain Service | Component `[Domain Service]` |
| Repository Interface | Component `[Repository Interface]` |
| Repository Implementation | Component `[Repository]` |
| Event Publisher/Consumer | Component `[Event Publisher]` / `[Event Consumer]` |
| External API Client | Component `[API Client]` |
| Port (Hexagonal) | Component `[Input Port]` or `[Output Port]` |
| Adapter (Hexagonal) | Component `[REST Adapter]`, `[DB Adapter]`, etc. |

### Label Conventions

```
Container labels:   Name [Technology]
                    Order Service [Spring Boot]
                    Order DB [PostgreSQL 15]

Component labels:   Name [Stereotype]
                    OrderController [REST Controller]
                    CreateOrderUseCase [Use Case]
                    Order [Aggregate Root]
                    IOrderRepository [Repository Interface]
                    PostgresOrderRepo [Repository]

Arrow labels:       Protocol or purpose
                    SQL/JDBC
                    REST/HTTPS
                    Kafka Protocol
                    implements
                    calls
                    publishes to
```

---

## References

- **C4 Model** — c4model.info
- **IcePanel C4 Guide** — See ICEPANEL-C4-MODEL.md in this references directory
- **N-Layer Architecture Reference** — See N-LAYER-ARCHITECTURE.md in this references directory
- **Simon Brown** — *Software Architecture for Developers* (2023)
- **Robert C. Martin** — *Clean Architecture* (2017) — Chapter 22: The Clean Architecture
- **Alistair Cockburn** — Hexagonal Architecture, alistair.cockburn.us
