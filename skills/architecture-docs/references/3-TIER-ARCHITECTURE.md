# 3-Tier Architecture Reference

> **Purpose**: Comprehensive reference for the foundational 3-tier web application architecture pattern. Use this document when designing, reviewing, or documenting applications that follow the Presentation-Application-Data tier separation.

---

## 1. What Is 3-Tier Architecture?

3-Tier architecture is a software architecture pattern that separates an application into three logical layers:

1. **Tier 1 — Presentation** (User Interface)
2. **Tier 2 — Application** (Business Logic)
3. **Tier 3 — Data** (Persistence)

Each tier has a specific responsibility and communicates only with its adjacent tier. The Presentation tier never accesses the Data tier directly — all requests flow through the Application tier.

This is the **foundational pattern for web applications** and has been the dominant architecture for server-side applications for over two decades. Despite the rise of microservices, 3-tier remains the right choice for the majority of applications — especially those with moderate complexity, small-to-medium teams, and straightforward scaling requirements.

The pattern is also known as: N-Tier (when generalized), Layered Architecture, or Three-Layer Architecture.

---

## 2. Core Principles

### 2.1 Separation of Concerns

Each tier handles one category of responsibility:

- **Presentation** — how data is displayed and how user input is captured
- **Application** — what the business rules are and how they are enforced
- **Data** — how data is stored, retrieved, and maintained

A change to the UI (e.g., redesigning a form) should not require changes to business logic or database schema.

### 2.2 Top-Down Communication

Requests flow top-down: Presentation → Application → Data. Responses flow bottom-up: Data → Application → Presentation.

The Data tier never initiates communication with the Application tier. The Application tier never initiates communication with the Presentation tier (except via push mechanisms like WebSockets, which are an extension of the base pattern).

### 2.3 Tier Independence

Each tier can be:

- **Developed** by different teams or developers with different specializations
- **Tested** independently (unit tests for business logic, integration tests for data access, E2E tests for presentation)
- **Replaced** without affecting other tiers (e.g., swap PostgreSQL for MySQL without changing business logic)
- **Scaled** independently in some deployment models (e.g., scale the Application tier horizontally while the Data tier scales vertically)

### 2.4 Simplicity Over Distribution

3-Tier architecture explicitly chooses simplicity. Unlike microservices, it does not distribute business logic across a network. This means:

- No distributed transactions — a single database transaction handles consistency
- No service discovery — all code runs in the same process (or two processes: frontend + backend)
- No message brokers required — synchronous request-response is the default
- No eventual consistency — the database is the single source of truth

This simplicity is a **feature**, not a limitation.

---

## 3. The Three Tiers

### 3.1 Tier 1 — Presentation

The Presentation tier is responsible for everything the user sees and interacts with. It captures user input, sends it to the Application tier, and displays the response.

**Variants:**

| Variant | Description | Technology Examples |
|---------|-------------|-------------------|
| **Single-Page Application (SPA)** | Client-side rendered JavaScript application; communicates with backend via REST/GraphQL API | React, Angular, Vue.js, Svelte |
| **Server-Rendered Pages** | HTML generated on the server; each page request produces a full HTML response | Thymeleaf (Java), Razor (.NET), Jinja2 (Python), EJS (Node.js) |
| **Mobile Application** | Native or cross-platform mobile app consuming the backend API | Swift, Kotlin, React Native, Flutter |
| **API Consumer** | No UI — the "presentation" tier is another system consuming the API | Partner integrations, CLI tools, IoT devices |
| **Static Assets** | HTML, CSS, JavaScript, images served from a CDN or web server | nginx, CloudFront, Vercel |

**Responsibilities:**

- Render UI components (forms, tables, charts, navigation)
- Capture and validate user input (client-side validation for UX, NOT for security)
- Manage UI state (loading, error, success states)
- Call the Application tier API (REST, GraphQL, or server-rendered form submissions)
- Handle authentication flows (login screens, token storage)
- Manage routing (SPA client-side routing or server-side URL routing)

**What does NOT belong here:**

- Business logic (e.g., calculating discounts, validating business rules)
- Direct database access
- Authorization decisions (the backend must enforce these)
- Sensitive data processing

### 3.2 Tier 2 — Application (Business Logic)

The Application tier is the heart of the system. It implements all business rules, orchestrates workflows, and mediates between the Presentation and Data tiers.

**Internal Structure:**

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Controllers / Handlers** | Receive HTTP requests, parse input, delegate to services, return HTTP responses | `OrderController`, `UserController` |
| **Service Layer** | Implement business logic, orchestrate operations, manage transactions | `OrderService`, `PaymentService` |
| **Domain Model** | Business entities, value objects, domain rules | `Order`, `LineItem`, `Money`, `Address` |
| **Validation** | Input validation (schema, format) and business validation (rules, constraints) | `OrderValidator`, Bean Validation annotations |
| **Authorization** | Enforce who can do what — role-based or attribute-based access control | `@PreAuthorize`, middleware, guards |
| **DTOs / Mappers** | Convert between API representations and domain models | `OrderDTO`, `OrderMapper` |

**Responsibilities:**

- Implement all business rules and workflows
- Validate input (server-side validation is the security boundary)
- Enforce authorization (who can access what)
- Manage database transactions (begin, commit, rollback)
- Call the Data tier through repository abstractions
- Call external services (email, payment, file storage)
- Handle errors and map them to appropriate HTTP responses
- Emit events or notifications (optional)

**What does NOT belong here:**

- UI rendering logic
- SQL queries (these belong in the Data tier / Repository layer)
- Infrastructure concerns (connection pooling, caching implementation details)
- Presentation-specific formatting (date formats, currency symbols)

### 3.3 Tier 3 — Data

The Data tier is responsible for persisting and retrieving data. It abstracts the storage mechanism from the Application tier.

**Components:**

| Component | Responsibility | Example |
|-----------|---------------|---------|
| **RDBMS** | Primary data store — relational tables, indexes, constraints | PostgreSQL, MySQL, SQL Server, Oracle |
| **ORM / Data Access** | Object-relational mapping, query building, connection management | Hibernate (Java), Prisma (Node.js), SQLAlchemy (Python), Entity Framework (.NET) |
| **Schema Migrations** | Version-controlled database schema changes | Flyway, Liquibase, Prisma Migrate, Alembic, EF Migrations |
| **Repository Pattern** | Abstraction layer that isolates query logic from business logic | `OrderRepository.findByCustomerId()`, `UserRepository.save()` |
| **Stored Procedures** (optional) | Complex queries or operations pushed to the database | Used sparingly; most logic stays in Application tier |
| **Caching Layer** (optional) | In-memory cache to reduce database load | Redis, Memcached, application-level cache |

**Responsibilities:**

- Store and retrieve data reliably
- Enforce data integrity (foreign keys, unique constraints, check constraints)
- Provide efficient query execution (indexes, query optimization)
- Manage schema evolution (migrations)
- Handle connection pooling and resource management
- Provide transaction support (ACID guarantees)

**What does NOT belong here:**

- Business logic (do not put business rules in stored procedures)
- Input validation (the Application tier must validate before data reaches the DB)
- Presentation formatting
- API response construction

---

## 4. Request Lifecycle

A typical request flows through all three tiers in six steps:

```
Step 1: User Action
  → User clicks "Place Order" in the Presentation tier (browser/mobile)

Step 2: API Call
  → Presentation tier sends POST /api/orders with order data to Application tier

Step 3: Business Processing
  → Controller receives request, validates input
  → Service layer applies business rules (check inventory, calculate totals, apply discounts)
  → Service layer begins database transaction

Step 4: Data Access
  → Repository writes order to database
  → Repository updates inventory counts
  → Transaction commits (both writes succeed or both fail)

Step 5: Response Construction
  → Service layer constructs response DTO
  → Controller maps to HTTP response (201 Created + order details)

Step 6: Display
  → Presentation tier receives response
  → UI updates to show order confirmation
```

**Key property**: The entire business operation (steps 3-4) executes within a **single database transaction**. This is the primary advantage of 3-tier over distributed architectures — ACID consistency is trivial.

---

## 5. Deployment Models

### 5.1 Monolith Deployment

All three tiers deploy as a single artifact (WAR, JAR, binary):

```
┌──────────────────────────────────┐
│          Single Process          │
│  ┌────────────────────────────┐  │
│  │   Presentation (templates) │  │
│  │   Application (services)   │  │
│  │   Data Access (repos/ORM)  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│      Database (PostgreSQL)       │
└──────────────────────────────────┘
```

- Simplest deployment model
- Server-rendered HTML (no separate frontend)
- Common for: Django, Rails, Spring MVC (Thymeleaf), Laravel, ASP.NET MVC

### 5.2 Frontend + Backend Separation

Presentation tier deploys separately from Application + Data tiers:

```
┌─────────────────┐         ┌──────────────────────┐
│   SPA Frontend   │  REST   │   Backend API        │
│   (React/Vue)    │ ──────► │   Application + Data │
│   CDN / nginx    │  /HTTPS │   (Spring Boot)      │
└─────────────────┘         └──────────────────────┘
                                      │
                                      ▼
                            ┌──────────────────────┐
                            │   Database            │
                            │   (PostgreSQL)        │
                            └──────────────────────┘
```

- Most common modern deployment model
- SPA served from CDN or static hosting
- Backend is a REST/GraphQL API
- Frontend and backend can be deployed independently
- Common for: React + Spring Boot, Vue + NestJS, Angular + .NET

### 5.3 Fully Separated (with Background Workers)

Frontend, backend API, background workers, and cache all deploy separately:

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│ SPA Frontend │────►│ Backend API   │────►│ Database     │
│ (React)      │     │ (NestJS)      │     │ (PostgreSQL) │
└──────────────┘     └───────┬───────┘     └──────────────┘
                             │                     ▲
                             ▼                     │
                     ┌───────────────┐     ┌───────┴──────┐
                     │ Redis Cache   │     │ Worker       │
                     │ + Job Queue   │────►│ (Background) │
                     └───────────────┘     └──────────────┘
```

- Adds background processing for long-running tasks
- Redis serves as both cache and job queue
- Workers process jobs asynchronously (email sending, report generation, image processing)
- Still a 3-tier architecture — the worker is part of the Application tier

---

## 6. Technology Stack by Tier

### Java / Spring Boot

| Tier | Technology |
|------|-----------|
| Presentation | React / Angular / Vue (SPA) or Thymeleaf (server-rendered) |
| Application | Spring Boot, Spring MVC, Spring Security, Spring Data JPA |
| Data | PostgreSQL / MySQL, Hibernate ORM, Flyway migrations |
| Build | Maven or Gradle, Docker, Kubernetes |

### Node.js / TypeScript

| Tier | Technology |
|------|-----------|
| Presentation | React / Next.js / Vue / Nuxt |
| Application | NestJS / Express / Fastify, Passport.js, class-validator |
| Data | PostgreSQL / MySQL, Prisma ORM, Prisma Migrate |
| Build | npm / pnpm, Docker, Kubernetes |

### Python / Django

| Tier | Technology |
|------|-----------|
| Presentation | Django Templates (server-rendered) or React/Vue (SPA) |
| Application | Django, Django REST Framework, Celery (background jobs) |
| Data | PostgreSQL / MySQL, Django ORM, Django Migrations |
| Build | pip / poetry, Docker, Kubernetes |

### .NET

| Tier | Technology |
|------|-----------|
| Presentation | Blazor / React / Angular |
| Application | ASP.NET Core, Entity Framework Core, MediatR |
| Data | SQL Server / PostgreSQL, Entity Framework Core, EF Migrations |
| Build | dotnet CLI, Docker, Kubernetes |

---

## 7. Project Structure Example (Spring Boot)

```
src/
├── main/
│   ├── java/com/example/orders/
│   │   ├── OrdersApplication.java              ← Application entrypoint
│   │   │
│   │   ├── controller/                          ← Tier 1 (API layer)
│   │   │   ├── OrderController.java
│   │   │   ├── CustomerController.java
│   │   │   └── dto/
│   │   │       ├── CreateOrderRequest.java
│   │   │       ├── OrderResponse.java
│   │   │       └── CustomerResponse.java
│   │   │
│   │   ├── service/                             ← Tier 2 (Business Logic)
│   │   │   ├── OrderService.java
│   │   │   ├── CustomerService.java
│   │   │   ├── PricingService.java
│   │   │   └── NotificationService.java
│   │   │
│   │   ├── domain/                              ← Tier 2 (Domain Model)
│   │   │   ├── Order.java
│   │   │   ├── OrderItem.java
│   │   │   ├── Customer.java
│   │   │   ├── Money.java
│   │   │   └── OrderStatus.java
│   │   │
│   │   ├── repository/                          ← Tier 3 (Data Access)
│   │   │   ├── OrderRepository.java
│   │   │   └── CustomerRepository.java
│   │   │
│   │   ├── config/                              ← Cross-cutting
│   │   │   ├── SecurityConfig.java
│   │   │   ├── WebConfig.java
│   │   │   └── CacheConfig.java
│   │   │
│   │   └── exception/                           ← Cross-cutting
│   │       ├── GlobalExceptionHandler.java
│   │       ├── OrderNotFoundException.java
│   │       └── InsufficientInventoryException.java
│   │
│   └── resources/
│       ├── application.yml
│       ├── db/migration/                        ← Tier 3 (Schema Migrations)
│       │   ├── V1__create_customers.sql
│       │   ├── V2__create_orders.sql
│       │   └── V3__add_order_status_index.sql
│       └── static/                              ← Tier 1 (if server-rendered)
│
└── test/
    ├── java/com/example/orders/
    │   ├── controller/                          ← API tests (MockMvc)
    │   ├── service/                             ← Unit tests (mocked repos)
    │   └── repository/                          ← Integration tests (Testcontainers)
    └── resources/
        └── application-test.yml
```

---

## 8. Scaling Strategies

### 8.1 Vertical Scaling

Add more CPU, memory, or disk to existing servers:

- **Presentation**: Rarely needed — static assets are served from CDN
- **Application**: Add more RAM for concurrent request handling, more CPU for compute-intensive operations
- **Data**: Add more RAM for database buffer pool, faster disks (SSD/NVMe), more CPU for query processing

Vertical scaling is the simplest approach and should be exhausted before horizontal scaling.

### 8.2 Horizontal Scaling per Tier

Scale each tier independently by adding more instances:

| Tier | Horizontal Scaling Approach |
|------|---------------------------|
| **Presentation (SPA)** | CDN with multiple edge locations — essentially infinite horizontal scale |
| **Application** | Multiple backend instances behind a load balancer; requires stateless design (no server-side sessions, or use Redis for session storage) |
| **Data** | Read replicas for read-heavy workloads; connection pooling (PgBouncer); partitioning/sharding for write-heavy workloads |

**Stateless Application Tier** is the prerequisite for horizontal scaling:

- No in-memory sessions — use Redis or JWT tokens
- No local file storage — use S3 or shared filesystem
- No instance-specific state — any instance can handle any request

### 8.3 When 3-Tier Becomes Insufficient

Signs that you are outgrowing 3-tier architecture:

| Signal | Description | Consider |
|--------|-------------|----------|
| Deployment conflicts | Multiple teams stepping on each other's changes | Modular monolith or microservices |
| Scaling mismatch | One feature needs 10x more resources than the rest | Extract that feature to its own service |
| Technology lock-in | A new feature needs a different language/framework | Extract as a separate service |
| Database bottleneck | Single database cannot handle the load despite optimization | Database sharding, CQRS, or data decomposition |
| Team scaling | More than 8-10 developers working on the same codebase | Split into bounded contexts / services |
| Deployment risk | A small change requires deploying the entire application | Modular monolith with independent deployability |

**The recommended evolution path**: 3-Tier Monolith → Modular Monolith → Strategic Service Extraction → Microservices (only if needed).

---

## 9. Security Concerns

| Layer | Security Concern | Mitigation |
|-------|-----------------|------------|
| **Presentation** | XSS (Cross-Site Scripting) | Output encoding, Content Security Policy (CSP) headers |
| **Presentation** | CSRF (Cross-Site Request Forgery) | CSRF tokens (server-rendered), SameSite cookies (SPA) |
| **Presentation** | Sensitive data exposure | Never store secrets in frontend code; use httpOnly cookies for tokens |
| **Application** | Injection (SQL, NoSQL, LDAP) | Parameterized queries, ORM, input validation |
| **Application** | Broken authentication | Use established libraries (Spring Security, Passport.js); MFA |
| **Application** | Broken authorization | Server-side authorization on every request; RBAC/ABAC |
| **Application** | Mass assignment | Use DTOs; never bind request directly to domain entities |
| **Application** | Insecure deserialization | Validate and whitelist allowed types; avoid native serialization |
| **Application** | Rate limiting | Implement rate limiting at application or gateway level |
| **Data** | Unencrypted data at rest | Enable TDE (Transparent Data Encryption) or filesystem encryption |
| **Data** | Unencrypted connections | Require TLS for database connections; use certificate-based auth |
| **Data** | SQL injection (at DB level) | Least-privilege database users; no admin credentials in application |
| **Data** | Backup exposure | Encrypt backups; restrict access; test restore procedures |
| **Cross-cutting** | Missing logging/audit | Log all authentication, authorization, and data modification events |
| **Cross-cutting** | Dependency vulnerabilities | Automated dependency scanning (Snyk, Dependabot, OWASP) |
| **Cross-cutting** | Secrets in code | Use secret management (Vault, AWS Secrets Manager); never hardcode |

---

## 10. When to Use 3-Tier Architecture

### When to Use

- **Small-to-medium teams** (2-8 developers) — the simplicity pays off
- **Well-understood domain** — clear business rules, moderate complexity
- **Single deployment unit is acceptable** — you don't need independent deployment of sub-features
- **Strong consistency required** — ACID transactions across the entire domain are a must
- **Rapid development** — getting to market quickly is more important than perfect scalability
- **Internal tools and back-office applications** — where simplicity and maintainability matter most
- **CRUD-dominant applications** — when most operations are straightforward data manipulation
- **Startup / MVP** — when you are still discovering the domain and need to iterate fast
- **Limited operational capacity** — you don't have a platform team to manage distributed infrastructure

### When NOT to Use

- **Large, complex domains with multiple bounded contexts** — consider a modular monolith or microservices
- **Multiple teams needing independent deployment** — deployment coupling will slow everyone down
- **Extreme scale requirements** — when a single database cannot handle the load
- **Polyglot technology needs** — when different parts of the system genuinely need different languages or runtimes
- **Event-driven / real-time systems** — when the core architecture is event streaming, not request-response
- **Very high availability requirements** — when you need fault isolation between subsystems (a bug in one feature should not take down the entire application)
