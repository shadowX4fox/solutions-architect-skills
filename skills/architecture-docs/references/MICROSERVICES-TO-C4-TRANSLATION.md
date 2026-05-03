# Microservices to C4 Model Translation Guide

> **Purpose**: Step-by-step guide for translating microservices architectures into C4 model diagrams. Covers the mapping from microservices concepts to C4 abstractions, pattern-specific translations, and common anti-patterns to avoid.

---

## 1. How Microservices Map to C4 Abstractions

The C4 model defines four levels of abstraction. Each microservices concept maps to a specific level:

| Microservices Concept | C4 Abstraction | C4 Level |
|-----------------------|----------------|----------|
| The entire system (all services together) | **System** | C1 Context |
| External users (web, mobile, partner) | **Person** | C1 Context |
| External systems (payment provider, email, CRM) | **External System** | C1 Context |
| Individual microservice | **Container** (application) | C2 Container |
| Database owned by a service | **Container** (data store) | C2 Container |
| Message broker (Kafka, RabbitMQ) | **Container** (infrastructure) | C2 Container |
| API Gateway / BFF | **Container** (application) | C2 Container |
| Internal class/module within a service | **Component** | C3 Component |
| Controller, Service class, Repository | **Component** | C3 Component |

### The Key Insight

**One microservice = one Container, NOT one System.**

This is the single most important mapping rule. A microservice is a deployable unit — it maps to a C4 Container. The entire microservices-based application (all services working together) is the System.

If you draw each microservice as a separate System at C1, you are modeling integration between independent products, not a single application's internal architecture.

---

## 2. C1 — System Context Diagram

At C1, all internal microservices **collapse into a single System box**. The purpose of C1 is to show the system's relationship with users and external systems, not its internal structure.

### What to Show

| Element | Representation | Example |
|---------|---------------|---------|
| All backend microservices | Single "System" box | "Order Management System" |
| Frontend SPA (if independently deployed) | Separate "System" box | "Web Application [React SPA]" |
| Mobile app | Separate "System" box | "Mobile App [iOS/Android]" |
| External third-party systems | "External System" box | "Stripe [Payment Gateway]" |
| Users | "Person" | "Customer", "Back-Office User" |

### Rules

1. **Never** show individual microservices at C1
2. **Never** show databases, message brokers, or internal infrastructure at C1
3. Frontend applications that are independently deployed and have their own release cycle are shown as separate Systems
4. Arrows show high-level relationships: "Places orders using", "Sends payment to", "Receives notifications from"
5. If the system has multiple distinct frontends (web, mobile, partner portal), each is a separate System

### Example C1 Elements

```
Person: "Customer"
  → uses → System: "E-Commerce Platform"
  → uses → System: "Web Store [React SPA]"

System: "Web Store [React SPA]"
  → makes API calls to → System: "E-Commerce Platform"

System: "E-Commerce Platform"
  → processes payments via → External System: "Stripe"
  → sends emails via → External System: "SendGrid"
  → fetches product data from → External System: "ERP System"

Person: "Warehouse Operator"
  → manages fulfillment using → System: "E-Commerce Platform"
```

---

## 3. C2 — Container Diagram

At C2, you **zoom into the System** and show every independently deployable unit. This is where the microservices architecture becomes visible.

### What to Show

| Microservices Element | C4 Container Type | Notation |
|----------------------|-------------------|----------|
| Each microservice | Application container | "Order Service [Spring Boot]" |
| Each database | Data store container | "Order DB [PostgreSQL]" |
| BFF | Application container | "Mobile BFF [Node.js]" — owns business-facing logic, keep as node |
| API Gateway | **Edge label only** | Collapse into `Rel()` 4th parameter (e.g. `"HTTPS via Kong"`). Exception: keep as `Container()` only when the gateway runs custom architectural logic. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2). |
| Message broker | **Edge label only** | Collapse into `Rel()` 4th parameter (e.g. `"Kafka topic: order-events (async)"`). Do NOT emit `ContainerQueue("Event Bus")`. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2). |
| Cache | Data store container | "Session Cache [Redis]" |
| SPA frontend | Application container | "Web App [React + TypeScript]" |
| Mobile app | Application container | "Mobile App [React Native]" |
| Background workers | Application container | "Email Worker [Node.js]" |
| Scheduled jobs | Application container | "Report Generator [Python]" |

### Notation Conventions

- **Technology in brackets**: Every container must specify its technology — `[Spring Boot]`, `[PostgreSQL]`
- **Protocol on arrows**: Every arrow must specify the communication protocol — `REST/HTTPS`, `gRPC`, `AMQP`, `JDBC`
- **`via` annotation**: When the call transits APIM, a service mesh, or an iPaaS, append `via <name>` to the protocol (e.g. `"HTTPS via Kong"`, `"HTTPS via Apigee → AWS APIGW"`) instead of declaring the transit hop as a node
- **Topic / queue annotation**: When the call traverses a broker, the protocol parameter carries the topic or queue name and async flag (e.g. `"Kafka topic: order-events (async)"`, `"RabbitMQ queue: settlements (async)"`) — the broker is NOT a node at L2
- **Direction matters**: Arrows point in the direction of the dependency (caller → callee)
- **Database arrows**: Service → Database (the service depends on the database, not the reverse)
- **Async arrows**: Distinguish synchronous (solid) from asynchronous (dashed) communication

### C2 Grouping Convention

The C4 L2 diagram uses **pure C4 conventions** — containers are grouped by their C4 element type, not by architecture layers:

- **`Container()`** for all application/service containers (microservices, BFFs, workers, schedulers)
- **`ContainerDb()`** for all data stores (databases, caches)
- **Transit infrastructure** (API gateway, message brokers, topics, queues, service mesh, iPaaS) → **edge label**, not a node. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2).

The Mermaid C4 renderer visually differentiates the remaining nodes by shape (box, cylinder). Architecture-specific grouping (bounded contexts, deployment boundaries, functional groups) belongs in Diagrams 1 and 4.

### Example C2 Elements

```
Container: "Web App [React + TypeScript]"
  → makes API calls [HTTPS via Kong] → Container: "Order Service [Spring Boot]"
  → makes API calls [HTTPS via Kong] → Container: "Product Service [Go]"
  → makes API calls [HTTPS via Kong] → Container: "Customer Service [NestJS]"
  (API Gateway collapsed onto edge labels — not a node)

Container: "Order Service [Spring Boot]"
  → reads/writes [JDBC] → Container: "Order DB [PostgreSQL]"
  → publishes order events [Kafka topic: order-events (async)]
       → Container: "Payment Service [Spring Boot]"
       → Container: "Notification Service [Node.js]"
       (broker collapsed — one edge per producer-consumer pair)
  → calls [gRPC] → Container: "Inventory Service [Go]"

Container: "Payment Service [Spring Boot]"
  → reads/writes [JDBC] → Container: "Payment DB [PostgreSQL]"
  → publishes payment events [Kafka topic: payment-events (async)]
       → Container: "Notification Service [Node.js]"
  → processes payments [HTTPS via Mulesoft] → External System: "Stripe"

Container: "Notification Service [Node.js]"
  → sends emails [HTTPS] → External System: "SendGrid"
  (subscriptions to order-events and payment-events appear on the
   producer-side edges above — no broker node needed)
```

---

## 4. C3 — Component Diagram

At C3, you **zoom into a single Container** (one microservice) to show its internal structure. You only draw C3 for services that are complex enough to warrant it.

### Standard Internal Components

| Component | Responsibility | Example |
|-----------|---------------|---------|
| Controller / API Layer | Receives HTTP/gRPC requests, validates input, returns responses | `OrderController` |
| Service Layer | Business logic, orchestration, transaction management | `OrderService` |
| Domain Model | Domain entities, value objects, domain events | `Order`, `OrderItem`, `Money` |
| Repository | Data access abstraction, query construction | `OrderRepository` |
| Event Publisher | Publishes domain events to the message broker | `OrderEventPublisher` |
| Event Consumer | Listens for events from other services | `PaymentEventConsumer` |
| External Client | Calls other services or external APIs | `InventoryClient`, `StripeClient` |
| Mapper / Transformer | Converts between DTOs, domain objects, and persistence entities | `OrderMapper` |

### Example C3 for Order Service

```
Component: "OrderController [Spring REST Controller]"
  → uses → Component: "OrderService [Spring Service]"

Component: "OrderService [Spring Service]"
  → uses → Component: "Order [Domain Model]"
  → uses → Component: "OrderRepository [Spring Data JPA]"
  → uses → Component: "InventoryClient [REST Client]"
  → uses → Component: "OrderEventPublisher [Kafka Producer]"

Component: "OrderRepository [Spring Data JPA]"
  → reads/writes [JDBC] → Container: "Order DB [PostgreSQL]"

Component: "InventoryClient [REST Client]"
  → calls [REST/HTTPS] → Container: "Inventory Service [Go]"

Component: "OrderEventPublisher [Kafka Producer]"
  → publishes [Kafka topic: order-events (async)] → Container: "Notification Service"
  → publishes [Kafka topic: order-events (async)] → Container: "Inventory Service"
  (broker collapsed onto edge label per Infrastructure-as-via Rule)

Component: "PaymentEventConsumer [Kafka Consumer]"
  ← subscribes [Kafka topic: payment-events (async)] ← Container: "Payment Service"
  → uses → Component: "OrderService [Spring Service]"
```

### When to Draw C3

- The service has more than 3-4 internal components with distinct responsibilities
- You need to show how the service integrates with external dependencies
- New developers need to understand the internal structure of a complex service
- You are doing a detailed design review of a specific service

### When NOT to Draw C3

- Simple CRUD services with minimal logic
- The service's internal structure is obvious from its Container description
- You are presenting to a non-technical audience

---

## 5. Pattern-Specific C4 Translations

### 5.1 API Gateway + BFF Pattern

```
C2 Translation:
  Container: "Web BFF [Node.js + Express]"         ← BFF for web
  Container: "Mobile BFF [Node.js + Express]"       ← BFF for mobile
  Container: "Partner Gateway [Kong]"               ← Gateway for B2B

  Person: "Customer" → "Web App [React]" → "Web BFF" → [downstream services]
  Person: "Customer" → "Mobile App [React Native]" → "Mobile BFF" → [downstream services]
  External System: "Partner System" → "Partner Gateway" → [downstream services]
```

Each BFF is a separate Container. Do not merge BFFs into a single "API Gateway" container if they have different codebases and deployment cycles.

### 5.2 Event-Driven / Choreography Pattern

At L2 the broker is **not** a node. Each producer-consumer pair becomes one direct edge labeled with the topic name and `(async)`. The topic name on the edge IS the join key — readers can still see the choreography without an "Event Bus" box clogging the diagram. Diagram 4 (Detailed View) keeps the broker as a node for ops visibility.

```
C2 Translation:
  Container: "Order Service [Spring Boot]"
    → [Kafka topic: order-created (async)] → Container: "Payment Service [Spring Boot]"
    → [Kafka topic: order-created (async)] → Container: "Inventory Service [Go]"
    → [Kafka topic: order-created (async)] → Container: "Notification Service [Node.js]"

  Container: "Payment Service [Spring Boot]"
    → [Kafka topic: payment-completed (async)] → Container: "Notification Service [Node.js]"
```

Each `Rel()` carries `Kafka topic: <name> (async)` on the protocol parameter. Use dashed arrows to distinguish async from sync. Do NOT declare an "Event Bus" container.

### 5.3 Saga Orchestration Pattern

```
C2 Translation:
  Container: "Checkout Orchestrator [Spring Boot]"   ← the saga orchestrator
    → calls [REST] → Container: "Order Service"
    → calls [REST] → Container: "Payment Service"
    → calls [REST] → Container: "Inventory Service"
    → reads/writes [JDBC] → Container: "Saga State DB [PostgreSQL]"
```

The saga orchestrator is its own Container. It maintains saga state in its own database. Show direct calls (REST/gRPC) from the orchestrator to participating services.

### 5.4 CQRS + Event Sourcing Pattern

```
C2 Translation:
  Container: "Order Command Service [Spring Boot]"       ← write side
    → appends events [HTTP] → Container: "Event Store [EventStoreDB]"

  Container: "Event Store [EventStoreDB]"                 ← event log
    → publishes [subscription] → Container: "Order Query Projector [Node.js]"

  Container: "Order Query Projector [Node.js]"            ← projection builder
    → writes [JDBC] → Container: "Order Read DB [PostgreSQL]"

  Container: "Order Query Service [Node.js]"              ← read side
    → reads [JDBC] → Container: "Order Read DB [PostgreSQL]"
```

CQRS means the write side and read side are separate Containers. The event store is a distinct data store Container. The projector is a separate Container that builds read models.

### 5.5 Database per Service Pattern

```
C2 Translation:
  Container: "Order Service [Spring Boot]"
    → reads/writes [JDBC] → Container: "Order DB [PostgreSQL]"

  Container: "Product Service [Go]"
    → reads/writes [MongoDB Wire Protocol] → Container: "Product DB [MongoDB]"

  Container: "Search Service [Python]"
    → reads/writes [REST] → Container: "Search Index [Elasticsearch]"
```

Each service has its own dedicated data store Container. Data stores are never shared between services. Use the specific protocol on the arrow (JDBC, MongoDB Wire Protocol, REST).

### 5.6 Service Mesh Pattern

```
C2 Translation:
  DO NOT show the service mesh as a Container.

  The service mesh (Istio, Linkerd) is infrastructure that is invisible at the C2 level.
  Show direct service-to-service arrows as if the mesh does not exist.
  Optionally add a note: "All service-to-service communication secured via Istio service mesh (mTLS)"
```

The service mesh is a deployment concern, not an architectural container. Showing sidecar proxies as Containers clutters the diagram without adding architectural insight.

### 5.7 External SaaS Integration

```
C2 Translation:
  Container: "Payment Service [Spring Boot]"
    → processes payments via [REST/HTTPS] → External System: "Stripe [Payment Gateway]"

  Container: "Notification Service [Node.js]"
    → sends emails via [REST/HTTPS] → External System: "SendGrid [Email Service]"
    → sends SMS via [REST/HTTPS] → External System: "Twilio [SMS Service]"
```

External SaaS systems are always shown as External Systems (grey boxes), even at C2. They are not Containers within your system boundary.

---

## 6. Visual Conventions

### Color Coding

| Element Type | Recommended Color | Meaning |
|-------------|-------------------|---------|
| Person | Blue | Human user |
| Internal System / Container | Blue (darker) | Software you build and own |
| External System | Grey | Software you do not own |
| Data Store Container | Blue-green / Teal | Database, cache, search index |
| Infrastructure Container | Orange / Amber | Message broker, event bus |
| BFF / Gateway Container | Light blue | Edge / routing services |

### Arrow Conventions

| Communication Type | Arrow Style | Label Example |
|-------------------|-------------|---------------|
| Synchronous REST | Solid arrow | `REST/HTTPS` |
| Synchronous gRPC | Solid arrow | `gRPC/HTTP2` |
| Asynchronous messaging | Dashed arrow | `Kafka topic: order-events` |
| Database access | Solid arrow | `JDBC`, `MongoDB Wire Protocol` |
| File/object access | Solid arrow | `S3 API / HTTPS` |

### Grouping

Use visual boundaries (dashed rectangles) to group related containers:

- **Bounded context**: Group Order Service + Order DB within an "Order Context" boundary
- **Deployment boundary**: Group all containers within a "Kubernetes Cluster" or "AWS VPC" boundary
- **Team ownership**: Group containers owned by the same team

---

## 7. Step-by-Step Drawing Guide

### Step 1: Identify the System Boundary

List all microservices, databases, message brokers, and frontends that make up your system. Everything inside this list is a Container at C2; everything outside is an External System or Person.

### Step 2: Draw C1 First

1. Draw one System box for all backend services
2. Draw separate System boxes for independently deployed frontends (SPA, mobile)
3. Draw External System boxes for all third-party integrations
4. Draw Person boxes for each user role
5. Draw arrows with high-level relationship descriptions

### Step 3: Draw C2 by Expanding the System

1. Replace the single System box with individual Container boxes for each microservice
2. Add data store Containers (one per service, following database-per-service)
3. Add infrastructure Containers (message broker, cache)
4. Add gateway/BFF Containers
5. Draw arrows with protocols and topic names
6. Group related containers by bounded context
7. Keep External Systems from C1 — they appear at C2 as well

### Step 4: Draw C3 for Complex Services (Optional)

1. Choose the service to zoom into
2. Identify its internal components (Controller, Service, Repository, Client, Publisher)
3. Draw Component boxes inside the Container boundary
4. Show dependencies between components
5. Show connections from components to external Containers (databases, message brokers, other services)

### Step 5: Validate

- Every Container at C2 must be traceable to the System at C1
- Every Component at C3 must live inside a Container shown at C2
- Arrow labels are consistent across levels (same protocol, same topic name)
- No orphan Containers — every Container has at least one incoming or outgoing arrow
- Data stores are never shared between services

---

## 8. Anti-Patterns

### Anti-Pattern 1: Service = System (C1 Explosion)

**Wrong**: Drawing each microservice as a separate System at C1, resulting in 15+ System boxes.

**Why it's wrong**: C1 shows how the system relates to users and external systems. Individual microservices are internal implementation details invisible at C1.

**Fix**: Collapse all services into a single System. Zoom into C2 to show individual services.

### Anti-Pattern 2: Shared Database at C2

**Wrong**: Two or more service Containers pointing to the same database Container.

**Why it's wrong**: This violates data sovereignty. If services share a database, they are not truly independent — they are a distributed monolith.

**Fix**: If services genuinely share a database, either (a) merge them into one service, or (b) split the database and add an API or event-based data synchronization.

### Anti-Pattern 3: Service Mesh as a Container

**Wrong**: Drawing an "Istio" or "Envoy Sidecar" Container box and routing all arrows through it.

**Why it's wrong**: The service mesh is infrastructure (like the network itself). It does not change the logical architecture. Showing it clutters the diagram.

**Fix**: Omit the service mesh from C2. Add a note if mTLS/mesh is architecturally significant.

### Anti-Pattern 4: Kubernetes as Architecture

**Wrong**: Drawing Kubernetes Pods, Deployments, or Namespaces as C4 Containers.

**Why it's wrong**: C4 models software architecture, not deployment infrastructure. A Kubernetes Deployment is a deployment mechanism for a Container, not a Container itself.

**Fix**: Show the application (e.g., "Order Service [Spring Boot]") as the Container. Document Kubernetes deployment details in a separate deployment view or supplementary diagram.

---

## 9. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES → C4 QUICK REFERENCE               │
├──────────────────────┬──────────────────────────────────────────────┤
│ Concept              │ C4 Mapping                                   │
├──────────────────────┼──────────────────────────────────────────────┤
│ All services         │ C1: System                                   │
│ One microservice     │ C2: Container [technology]                   │
│ Service's database   │ C2: Container (data store) [technology]      │
│ Message broker       │ C2: Container (infrastructure) [technology]  │
│ API Gateway / BFF    │ C2: Container [technology]                   │
│ SPA / Mobile app     │ C1: System  OR  C2: Container               │
│ External SaaS        │ C1/C2: External System                      │
│ Internal class       │ C3: Component                                │
│ Service mesh         │ NOT shown (add note)                         │
│ Kubernetes           │ NOT shown (deployment view)                  │
├──────────────────────┼──────────────────────────────────────────────┤
│ Arrow Labels         │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ REST call            │ "REST/HTTPS"                                 │
│ gRPC call            │ "gRPC/HTTP2"                                 │
│ Kafka publish        │ "Kafka topic: <name>"                        │
│ Database access      │ "JDBC" / "MongoDB Wire Protocol" / "Redis"   │
│ Async message        │ Dashed arrow + topic/queue name              │
├──────────────────────┼──────────────────────────────────────────────┤
│ Common Mistakes      │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ ✗ Service = System   │ ✓ Service = Container                        │
│ ✗ Shared DB          │ ✓ DB per service                             │
│ ✗ Mesh as box        │ ✓ Mesh as note                               │
│ ✗ K8s in C4          │ ✓ K8s in deployment view                     │
└──────────────────────┴──────────────────────────────────────────────┘
```
