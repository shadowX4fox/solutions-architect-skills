# 3-Tier to C4 Model Translation Guide

> **Purpose**: Step-by-step guide for translating 3-tier architectures into C4 model diagrams. Covers the key insight that tiers do not map 1:1 to containers, deployment variant translations, and common anti-patterns to avoid.

---

## 1. The Key Insight: Tier ≠ Container

The most common mistake when drawing C4 diagrams for 3-tier applications is creating three Containers — one for each tier. This is wrong.

**Why?** In a typical 3-tier deployment:

- The **Presentation tier** (server-rendered templates or API endpoints) and the **Application tier** (business logic) and the **Data Access code** (repositories, ORM) all run inside the **same process** — they deploy as **one Container** (the backend application)
- The **database** is a separate deployable unit — it is **one Container** (the data store)
- If a **SPA frontend** exists, it is an independently deployed artifact — it is **one Container** (the frontend application)

So a typical 3-tier application with a SPA frontend produces **three C2 Containers**, but NOT because of the three tiers:

```
Container 1: SPA Frontend [React]           ← independently deployed
Container 2: Backend API [Spring Boot]       ← Presentation + Application + Data Access code
Container 3: Database [PostgreSQL]           ← data store
```

The tiers are **logical layers inside the code**. Containers are **physical deployment units**. The mapping is:

| 3-Tier Concept | C4 Mapping |
|---------------|------------|
| Presentation tier (SPA) | Container (if independently deployed) |
| Presentation tier (server-rendered) | Part of Backend Container |
| Application tier (business logic) | Part of Backend Container |
| Data Access tier (repositories/ORM) | Part of Backend Container |
| Database (PostgreSQL, MySQL) | Container (data store) |
| Cache (Redis) | Container (data store) — if separately deployed |
| Background Worker | Container (application) — if separately deployed |

---

## 2. C1 — System Context Diagram

At C1, the entire 3-tier application **collapses into a single System box**. The purpose of C1 is to show the system's relationship with users and external systems.

### Rules

1. **Entire application = one System** — backend, frontend, database, cache — all one System
2. **SPA as separate System** — only if the SPA is a truly independent product with its own team and release cycle (rare; usually it's part of the same System)
3. **Database is NEVER shown at C1** — it is an internal implementation detail
4. **Cache is NEVER shown at C1** — same reason
5. **External systems are shown** — payment gateways, email services, third-party APIs
6. **Users are shown as Persons** — each distinct user role

### Example C1

```
Person: "Customer"
  → uses → System: "Order Management System"

Person: "Administrator"
  → manages → System: "Order Management System"

System: "Order Management System"
  → sends emails via → External System: "SendGrid [Email Service]"
  → processes payments via → External System: "Stripe [Payment Gateway]"
  → authenticates users via → External System: "Auth0 [Identity Provider]"
```

---

## 3. C2 — Container Diagram

At C2, you **zoom into the System** and show each independently deployed unit using pure C4 conventions. The 3-tier layer structure does NOT appear as visual groupings in the C4 L2 diagram — tier grouping belongs in Diagrams 1 (Logical View) and 4 (Detailed View). Containers are grouped by C4 element type: `Container()` for apps, `ContainerDb()` for stores. **Transit infrastructure** (API gateway, message brokers, topics, queues, service mesh, iPaaS) → **edge label**, not a node. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2).

### Deployment Variant 1: SPA + API + Database

The most common modern 3-tier deployment.

Format note for prose narrative: `description → target — <PROTOCOL>/<STYLE> [Action]`. The em-dash separates the 3rd `Rel()` parameter (description) from the 4th parameter (canonical normal form per Connection Naming Rule).

```
Container: "Web Application [React + TypeScript]"
  → makes API calls               → Container: "Backend API [Spring Boot]"     — HTTPS/JSON [Data]

Container: "Backend API [Spring Boot]"
  → reads/writes order rows       → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]

External System: "Stripe [Payment Gateway]"
  ← processes payments            ← Container: "Backend API [Spring Boot]"     — HTTPS/JSON [Data]
```

**Containers: 3** (SPA + Backend + Database)

### Deployment Variant 2: Server-Rendered + Database

Traditional server-rendered application (no SPA).

```
Container: "Web Application [Spring Boot + Thymeleaf]"
  → reads/writes app state        → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]

Person: "Customer"
  → uses                          → Container: "Web Application [Spring Boot + Thymeleaf]" — HTTPS/JSON [Data]
```

**Containers: 2** (Web App + Database). The Presentation and Application tiers are a single Container because they deploy together.

### Deployment Variant 3: SPA + API + Database + Cache + Worker

Full-featured deployment with caching and background jobs.

```
Container: "Web Application [React + TypeScript]"
  → makes API calls               → Container: "Backend API [NestJS]"          — HTTPS/JSON [Data]

Container: "Backend API [NestJS]"
  → reads/writes app rows         → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]
  → caches/reads session keys     → Container: "Cache [Redis]"                 — TCP/RESP [Cache]
  → enqueues jobs                 → Container: "Job Queue [Redis]"             — TCP/RESP [Internal]

Container: "Background Worker [NestJS]"
  → dequeues jobs                 → Container: "Job Queue [Redis]"             — TCP/RESP [Internal]
  → reads/writes app rows         → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]
  → sends emails                  → External System: "SendGrid"                — HTTPS/JSON [Data]
```

**Containers: 5** (SPA + Backend + Worker + Database + Redis). Note: Redis may serve as both cache and job queue — model as one or two Containers depending on whether they are the same Redis instance.

### Deployment Variant 4: Mobile + API + Database

Mobile application consuming a backend API.

```
Container: "Mobile App [React Native]"
  → makes API calls               → Container: "Backend API [NestJS]"          — HTTPS/JSON [Data]

Container: "Backend API [NestJS]"
  → reads/writes app rows         → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]
```

**Containers: 3** (Mobile App + Backend + Database)

### Deployment Variant 5: API-Only (Headless)

Backend API consumed by external systems or partner integrations.

```
Container: "Backend API [FastAPI + Python]"
  → reads/writes app rows         → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]

External System: "Partner System"
  → calls (API key auth)          → Container: "Backend API [FastAPI + Python]" — HTTPS/JSON [Data]
```

**Containers: 2** (Backend + Database). No frontend Container.

---

## 4. C3 — Component Diagram

At C3, you **zoom into the Backend Container** to show its internal structure. This is where the 3-tier layering becomes visible — as Components inside a single Container.

### Standard Component Structure

```
Component: "OrderController [Spring REST Controller]"
  → uses → Component: "OrderService [Spring Service]"

Component: "CustomerController [Spring REST Controller]"
  → uses → Component: "CustomerService [Spring Service]"

Component: "OrderService [Spring Service]"
  → uses → Component: "OrderRepository [Spring Data JPA]"
  → uses → Component: "PricingService [Spring Service]"
  → uses → Component: "StripeClient [REST Client]"

Component: "CustomerService [Spring Service]"
  → uses → Component: "CustomerRepository [Spring Data JPA]"

Component: "OrderRepository [Spring Data JPA]"
  → reads/writes order rows       → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]

Component: "CustomerRepository [Spring Data JPA]"
  → reads/writes customer rows    → Container: "Database [PostgreSQL]"         — JDBC/SQL [Write]

Component: "StripeClient [REST Client]"
  → processes payments            → External System: "Stripe [Payment Gateway]" — HTTPS/JSON [Data]
```

### Component Categories

| Component Type | Tier | Description |
|---------------|------|-------------|
| Controller | Presentation | Handles HTTP requests and responses |
| Service | Application | Business logic and orchestration |
| Repository | Data | Data access and query abstraction |
| External Client | Application | Calls external APIs |
| Validator | Application | Input and business rule validation |
| Mapper | Cross-cutting | Converts between DTOs and domain objects |
| Event Publisher | Application | Publishes events (if applicable) |
| Security Filter | Cross-cutting | Authentication and authorization |

---

## 5. Pattern-Specific C4 Translations

### 5.1 Authentication Flow

```
C2:
  Container: "Web App [React]"
    → redirects to                → External System: "Auth0 [IdP]"             — HTTPS/JSON [Auth]
  External System: "Auth0 [IdP]"
    → returns JWT token           → Container: "Web App [React]"               — HTTPS/JSON [Auth]
  Container: "Web App [React]"
    → sends requests (Bearer JWT) → Container: "Backend API [Spring Boot]"     — HTTPS/JSON [Data]

C3 (inside Backend API):
  Component: "JwtAuthFilter [Spring Security Filter]"
    → validates token → Component: "OrderController"
  Component: "OrderController"
    → uses → Component: "OrderService"
```

### 5.2 File Upload Flow

```
C2:
  Container: "Web App [React]"
    → uploads file [multipart/form-data] → Container: "Backend API [NestJS]"
  Container: "Backend API [NestJS]"
    → stores file                   → External System: "AWS S3 [Object Storage]" — HTTPS/BINARY [Storage]
    → stores metadata               → Container: "Database [PostgreSQL]"       — JDBC/SQL [Write]

C3 (inside Backend API):
  Component: "FileController"
    → uses → Component: "FileService"
  Component: "FileService"
    → uses → Component: "S3Client [AWS SDK]"
    → uses → Component: "FileRepository"
```

### 5.3 Background Jobs

```
C2:
  Container: "Backend API [NestJS]"
    → enqueues job                  → Container: "Redis [Job Queue]"           — TCP/RESP [Internal]
  Container: "Worker [NestJS]"
    → dequeues job                  → Container: "Redis [Job Queue]"           — TCP/RESP [Internal]
    → generates report              → External System: "AWS S3"                — HTTPS/BINARY [Storage]
    → sends notification            → External System: "SendGrid"              — HTTPS/JSON [Data]
```

Note: The Worker is a **separate Container** because it deploys independently (different process, different scaling).

### 5.4 Caching Pattern

```
C2:
  Container: "Backend API [Spring Boot]"
    → cache read/write              → Container: "Cache [Redis]"               — TCP/RESP [Cache]
    → reads/writes app rows         → Container: "Database [PostgreSQL]"       — JDBC/SQL [Write]

C3 (inside Backend API):
  Component: "ProductController"
    → uses → Component: "ProductService"
  Component: "ProductService"
    → checks cache → Component: "CacheManager [Spring Cache + Redis]"
    → on miss, reads from → Component: "ProductRepository"
  Component: "CacheManager [Spring Cache + Redis]"
    → reads/writes cache keys       → Container: "Cache [Redis]"               — TCP/RESP [Cache]
  Component: "ProductRepository"
    → reads/writes product rows     → Container: "Database [PostgreSQL]"       — JDBC/SQL [Query]
```

### 5.5 External API Integration

```
C2:
  Container: "Backend API [NestJS]"
    → fetches exchange rates        → External System: "Exchange Rate API"     — HTTPS/JSON [Data]
    → processes payments            → External System: "Stripe"                — HTTPS/JSON [Data]
    → sends SMS                     → External System: "Twilio"                — HTTPS/JSON [Data]

C3 (inside Backend API):
  Component: "ExchangeRateClient [Axios HTTP Client]"
    → calls Exchange Rate API       → External System: "Exchange Rate API"     — HTTPS/JSON [Data]
  Component: "StripeClient [Stripe SDK]"
    → calls Stripe                  → External System: "Stripe"                — HTTPS/JSON [Data]
  Component: "TwilioClient [Twilio SDK]"
    → calls Twilio                  → External System: "Twilio"                — HTTPS/JSON [Data]
```

---

## 6. Anti-Patterns

### Anti-Pattern 1: Three Containers for Three Tiers

**Wrong**: Drawing three Containers at C2 named "Presentation Layer", "Business Logic Layer", and "Data Access Layer."

**Why it's wrong**: These are logical code layers, not deployment units. They all run inside the same process (the backend application). C4 Containers represent independently deployable units, not code packages.

**Fix**: One Container for the entire backend application. Show the internal layers at C3 as Components.

### Anti-Pattern 2: Database at C1

**Wrong**: Showing "PostgreSQL Database" as a System at C1.

**Why it's wrong**: C1 shows Systems (complete applications with user-facing functionality) and External Systems (third-party products). A database is an internal implementation detail of your system.

**Fix**: Show the database only at C2 as a Container (data store). At C1, the database is invisible — it is part of your System.

### Anti-Pattern 3: Framework as Architecture

**Wrong**: Drawing Containers named "Spring Boot", "React", or "PostgreSQL" without describing what they do.

**Why it's wrong**: C4 Containers describe what software does, not what technology it uses. Technology goes in brackets after the name.

**Fix**: Name Containers by purpose: "Order Management Backend [Spring Boot]", "Customer Portal [React + TypeScript]", "Order Database [PostgreSQL]".

### Anti-Pattern 4: Missing SPA as Separate Container

**Wrong**: Not showing the SPA frontend at C2 when it is independently deployed.

**Why it's wrong**: If the SPA is built, versioned, and deployed independently from the backend (which is almost always the case), it is a separate Container. Omitting it hides a real deployment and communication boundary.

**Fix**: Show the SPA as its own Container: "Customer Portal [React + TypeScript]" with an arrow to the Backend API; the `Rel()` 4th parameter follows the canonical normal form `"HTTPS/JSON [Data]"` per Connection Naming Rule.

---

## 7. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                    3-TIER → C4 QUICK REFERENCE                      │
├──────────────────────┬──────────────────────────────────────────────┤
│ Concept              │ C4 Mapping                                   │
├──────────────────────┼──────────────────────────────────────────────┤
│ Entire application   │ C1: System                                   │
│ SPA frontend         │ C2: Container [React/Vue/Angular]            │
│ Server-rendered UI   │ Part of Backend Container                    │
│ Backend (all code)   │ C2: Container [Spring Boot/NestJS/Django]    │
│ Database             │ C2: Container (data store) [PostgreSQL]      │
│ Cache (Redis)        │ C2: Container (data store) [Redis]           │
│ Background Worker    │ C2: Container [technology]                   │
│ External service     │ C1/C2: External System                      │
│ Controller class     │ C3: Component                                │
│ Service class        │ C3: Component                                │
│ Repository class     │ C3: Component                                │
│ External API client  │ C3: Component                                │
├──────────────────────┼──────────────────────────────────────────────┤
│ Common Mistakes      │                                              │
├──────────────────────┼──────────────────────────────────────────────┤
│ ✗ 3 tiers = 3 boxes │ ✓ Tiers are logical; containers are physical │
│ ✗ DB at C1           │ ✓ DB only at C2                              │
│ ✗ "Spring Boot" box  │ ✓ "Order API [Spring Boot]"                  │
│ ✗ Missing SPA        │ ✓ SPA = separate Container                   │
└──────────────────────┴──────────────────────────────────────────────┘
```

---

## 8. Comparison: 3-Tier C2 vs Microservices C2

Understanding the difference between a 3-tier C2 and a microservices C2 helps architects choose the right abstraction and communicate clearly.

### 3-Tier C2 (Typical)

```
Containers:
  1. Web Application [React]
  2. Backend API [Spring Boot]           ← ALL business logic in one container
  3. Database [PostgreSQL]               ← ONE database for everything

  Optional:
  4. Cache [Redis]
  5. Background Worker [Spring Boot]

Total: 3-5 containers
Arrows: Few (SPA → Backend → DB, Backend → External Systems)
Complexity: Low
```

### Microservices C2 (Typical)

```
Containers:
  1. Web Application [React]
  2. Order Service [Spring Boot]         ← Business logic distributed
  3. Payment Service [Spring Boot]
  4. Inventory Service [Go]
  5. Notification Service [Node.js]
  6. Order DB [PostgreSQL]               ← Database per service
  7. Payment DB [PostgreSQL]
  8. Inventory DB [MongoDB]
  9. Search Service [Python]
  10. Search Index [Elasticsearch]

(API Gateway "Kong" and Event Bus "Apache Kafka" are NOT separate
 containers at L2 — collapsed into edge labels per Infrastructure-as-via Rule.
 Diagram 4 still renders the broker and gateway as nodes for ops fidelity.)

Total: 10-15 containers
Arrows: Many (service-to-service, service-to-DB; broker/gateway encoded
        as edge encoding — description `(Kafka topic: X, async)` / `(via Kong)`,
        protocol `TLS/AVRO [Event]` / `HTTPS/JSON [Data]`)
Complexity: High
```

### Key Visual Differences

| Aspect | 3-Tier C2 | Microservices C2 |
|--------|-----------|-----------------|
| Number of containers | 3-5 | 10-20+ |
| Number of arrows | 5-8 | 20-40+ |
| Database containers | 1 (shared) | N (one per service) |
| Message broker | Usually absent | Central infrastructure element |
| API Gateway | Usually absent | Present (separate container) |
| Communication style | Mostly synchronous | Mix of sync and async |
| Diagram complexity | Fits on one page | May need grouping by bounded context |

### When to Transition

Your 3-tier C2 diagram is trying to tell you it wants to be a microservices C2 when:

- The single Backend Container has grown so large that its C3 diagram has 30+ Components
- Different Components within the backend have vastly different scaling needs
- Multiple teams are working on the same Backend Container and blocking each other
- You need to deploy different parts of the business logic on different schedules
- You need polyglot technology (some Components would benefit from a different language/runtime)

At that point, each major Component group at C3 becomes a candidate for extraction into its own Container (service) at C2.
