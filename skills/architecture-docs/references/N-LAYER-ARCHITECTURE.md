# N-Layer Architecture — Choose Your Own Layers

## What is it

N-Layer Architecture is a family of layered architectural patterns where the number and responsibility of layers are tailored to the system's domain complexity, testability requirements, and team preferences. Unlike the rigid 3-Tier model (Presentation / Business Logic / Data), N-Layer patterns let architects define layers around domain-centric principles — placing business logic at the center and pushing infrastructure concerns to the edges.

This reference covers four widely adopted variants:

| # | Variant | Origin | Layer Count | Core Idea |
|---|---------|--------|-------------|-----------|
| 1 | DDD 4-Layer | Eric Evans (2003) | 4 | Domain model is king; infrastructure implements domain interfaces |
| 2 | Clean Architecture | Robert C. Martin (2012) | 4 rings | Source code dependencies point inward only (The Dependency Rule) |
| 3 | Hexagonal Architecture | Alistair Cockburn (2005) | 3 zones | Ports define contracts; Adapters plug in implementations |
| 4 | 5-Layer Extended | Enterprise patterns | 5 | Adds a Cross-Cutting layer for shared enterprise concerns |

All four share a single guiding philosophy: **the domain (business logic) depends on nothing; everything else depends on the domain**.

---

## Core Principles

### 1. Dependency Inversion

Inner layers define interfaces (abstractions). Outer layers provide implementations. The domain never imports a database driver, an HTTP framework, or a messaging library.

```
WRONG:  Domain --> PostgreSQL driver
RIGHT:  Domain --> IRepository (interface)
        Infrastructure --> IRepository (implements it, uses PostgreSQL)
```

### 2. Domain at the Center

Business rules, entities, value objects, and aggregates live in the innermost layer. They are pure code with zero framework dependencies. If you delete every framework reference from your project, the domain layer should still compile.

### 3. Framework Independence

The architecture does not depend on the existence of any particular library or framework. Frameworks are tools confined to the outermost layers — they are pluggable and replaceable.

### 4. Testability Through Abstraction

Because every external dependency is behind an interface, unit tests can replace real implementations with in-memory fakes, mocks, or stubs without touching the domain layer. This makes the domain the most testable part of the system.

### 5. Screaming Architecture

The project structure should scream the business domain, not the framework. A folder named `orders/` tells you more than a folder named `controllers/`.

---

## Variant 1 — DDD 4-Layer (Eric Evans)

### Layer Structure

```
+------------------------------------------------------+
|                Layer 1: UI / Presentation             |
|   Controllers, API endpoints, View Models, DTOs       |
+------------------------------------------------------+
          |  depends on  ↓
+------------------------------------------------------+
|             Layer 2: Application                      |
|   Application Services, Use Cases, Command/Query      |
|   Handlers, DTOs, Mappers, Transaction Scripts        |
+------------------------------------------------------+
          |  depends on  ↓
+------------------------------------------------------+
|               Layer 3: Domain                         |
|   Entities, Value Objects, Aggregates, Domain Events, |
|   Repository Interfaces, Domain Services              |
+------------------------------------------------------+
          ↑  implements interfaces from Domain
+------------------------------------------------------+
|            Layer 4: Infrastructure                    |
|   Repository Implementations, ORM, DB Drivers,       |
|   Email/SMS Gateways, File Storage, External APIs     |
+------------------------------------------------------+
```

### Dependency Rules

- UI --> Application --> Domain (top-down for orchestration)
- Infrastructure --> Domain (bottom-up: implements domain interfaces)
- **Domain has ZERO outward dependencies**

### Layer Responsibilities

| Layer | Responsibility | Typical Classes |
|-------|---------------|-----------------|
| **UI** | Accept HTTP requests, validate input format, serialize responses | `OrderController`, `CreateOrderRequest`, `OrderResponse` |
| **Application** | Orchestrate use cases, manage transactions, map DTOs to domain | `CreateOrderUseCase`, `OrderApplicationService`, `OrderMapper` |
| **Domain** | Business rules, invariants, domain events | `Order`, `OrderItem`, `Money`, `IOrderRepository`, `OrderPlacedEvent` |
| **Infrastructure** | Persistence, messaging, external API calls | `PostgresOrderRepository`, `KafkaEventPublisher`, `SmtpEmailSender` |

### Request Lifecycle

```
1. HTTP POST /api/orders arrives at UI layer
   → OrderController receives CreateOrderRequest DTO
   → Validates request format (not business rules)

2. Controller calls Application layer
   → CreateOrderUseCase.execute(command)
   → Begins transaction
   → Calls domain to create Order aggregate

3. Domain layer enforces business rules
   → Order.create(items, customer) checks invariants
   → Raises OrderPlacedEvent domain event

4. Application layer persists via interface
   → Calls IOrderRepository.save(order) (domain interface)
   → Infrastructure provides PostgresOrderRepository
   → Commits transaction

5. Response flows back up
   → Domain entity → DTO mapper → JSON response
```

### Technology Stack Examples

| Technology | UI | Application | Domain | Infrastructure |
|-----------|-----|-------------|--------|---------------|
| **Java/Spring** | Spring MVC Controllers | Spring Service classes | POJOs, no Spring annotations | Spring Data JPA, Kafka Template |
| **.NET** | ASP.NET Controllers | MediatR Handlers | C# classes, no framework refs | EF Core, Azure Service Bus |
| **Node.js** | Express/Fastify routes | Use case classes | Plain TypeScript classes | TypeORM, Nodemailer, AWS SDK |

### Project Structure

```
src/
  ui/
    controllers/
      OrderController.ts
    dto/
      CreateOrderRequest.ts
      OrderResponse.ts
  application/
    use-cases/
      CreateOrderUseCase.ts
      GetOrderByIdUseCase.ts
    mappers/
      OrderMapper.ts
  domain/
    entities/
      Order.ts
      OrderItem.ts
    value-objects/
      Money.ts
      OrderStatus.ts
    events/
      OrderPlacedEvent.ts
    repositories/
      IOrderRepository.ts          # Interface only
    services/
      PricingDomainService.ts
  infrastructure/
    persistence/
      PostgresOrderRepository.ts   # Implements IOrderRepository
      OrderSchema.ts
    messaging/
      KafkaEventPublisher.ts
    external/
      PaymentGatewayClient.ts
```

---

## Variant 2 — Clean Architecture (Robert C. Martin)

### The Concentric Rings

```
+----------------------------------------------------------+
|          Frameworks & Drivers (outermost ring)            |
|   Web framework, DB driver, UI framework, devices        |
|  +----------------------------------------------------+  |
|  |        Interface Adapters                          |  |
|  |   Controllers, Presenters, Gateways, Repositories  |  |
|  |  +----------------------------------------------+  |  |
|  |  |           Use Cases                          |  |  |
|  |  |   Application-specific business rules        |  |  |
|  |  |  +----------------------------------------+  |  |  |
|  |  |  |          Entities                       |  |  |  |
|  |  |  |   Enterprise-wide business rules        |  |  |  |
|  |  |  +----------------------------------------+  |  |  |
|  |  +----------------------------------------------+  |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### The Dependency Rule

> Source code dependencies must point inward only. Nothing in an inner ring can know anything about something in an outer ring.

This is the single most important rule of Clean Architecture. An Entity must not import a Use Case. A Use Case must not import a Controller. A Controller must not import Express.js in the Entity ring.

### Ring Responsibilities

| Ring | What Lives Here | Depends On |
|------|----------------|------------|
| **Entities** | Enterprise business rules, domain objects that would exist even if the application did not | Nothing |
| **Use Cases** | Application-specific business rules — orchestrate entity interactions for a specific workflow | Entities only |
| **Interface Adapters** | Convert data between Use Case format and external format (DB rows, HTTP requests, etc.) | Use Cases, Entities |
| **Frameworks & Drivers** | The "glue" code — web server, ORM config, DI container bootstrap | Interface Adapters |

### Data Crossing Boundaries

Data structures that cross ring boundaries are simple DTOs or value objects. The inner ring defines the shape; the outer ring converts:

```
HTTP Request (outer)
  → Controller converts to InputDTO
    → Use Case receives InputDTO, works with Entities
    → Use Case returns OutputDTO
  → Presenter converts OutputDTO to ViewModel
→ HTTP Response (outer)
```

### Technology Stack Examples

| Technology | Entities | Use Cases | Interface Adapters | Frameworks & Drivers |
|-----------|----------|-----------|-------------------|---------------------|
| **Java** | Plain Java classes | Application Service POJOs | Spring Controllers, JPA Repos | Spring Boot, Hibernate config |
| **TypeScript** | Plain TS classes | Use case classes | Express routes, TypeORM repos | Express app, TypeORM config |
| **Go** | Struct + methods | Interactor functions | HTTP handlers, SQL repos | net/http, pgx driver |

### Project Structure

```
src/
  entities/
    Order.ts
    Customer.ts
    Product.ts
  use-cases/
    CreateOrder.ts
    CancelOrder.ts
    GetOrderHistory.ts
    ports/
      IOrderRepository.ts
      IPaymentGateway.ts
      INotificationService.ts
  interface-adapters/
    controllers/
      OrderController.ts
    presenters/
      OrderPresenter.ts
    gateways/
      PostgresOrderRepository.ts
      StripePaymentGateway.ts
  frameworks/
    web/
      express-app.ts
      routes.ts
    database/
      typeorm-config.ts
      migrations/
    config/
      dependency-injection.ts
```

---

## Variant 3 — Hexagonal Architecture (Ports & Adapters)

### The Hexagon

```
                    Primary Adapters (Driving)
                    ┌─────────────────────┐
                    │  REST Controller     │
                    │  CLI Handler         │
                    │  GraphQL Resolver    │
                    │  gRPC Service        │
                    │  Event Listener      │
                    └────────┬────────────┘
                             │ calls
                    ┌────────▼────────────┐
                    │   Primary Ports      │
                    │   (Input Interfaces) │
                    │   ICreateOrder       │
                    │   ICancelOrder       │
                    │   IGetOrder          │
                    ├─────────────────────┤
                    │                     │
                    │   APPLICATION CORE  │
                    │                     │
                    │   Domain Entities   │
                    │   Domain Services   │
                    │   Business Rules    │
                    │                     │
                    ├─────────────────────┤
                    │   Secondary Ports    │
                    │   (Output Interfaces)│
                    │   IOrderRepository   │
                    │   IPaymentGateway    │
                    │   IEventPublisher    │
                    └────────┬────────────┘
                             │ implemented by
                    ┌────────▼────────────┐
                    │  Secondary Adapters  │
                    │  (Driven)            │
                    │  PostgresRepository  │
                    │  StripePayment       │
                    │  KafkaPublisher      │
                    │  S3FileStorage       │
                    └─────────────────────┘
```

### Key Concepts

**Ports** are interfaces defined by the application core:
- **Primary (Driving) Ports**: Define what the application CAN DO. Called by the outside world. Example: `ICreateOrderUseCase`
- **Secondary (Driven) Ports**: Define what the application NEEDS. Called by the application core. Example: `IOrderRepository`

**Adapters** are implementations that connect the ports to the real world:
- **Primary (Driving) Adapters**: Translate external input into port calls. Example: `OrderRestController` calls `ICreateOrderUseCase`
- **Secondary (Driven) Adapters**: Implement secondary ports with real technology. Example: `PostgresOrderRepository` implements `IOrderRepository`

### The Symmetry Principle

The hexagonal shape represents symmetry: the application does not know whether it is being driven by a user, a test, or a batch process (primary side), nor whether it is talking to a real database, a file, or an in-memory store (secondary side). Both sides are equivalent and interchangeable.

### Request Lifecycle

```
1. REST Controller (primary adapter) receives HTTP request
   → Converts HTTP request to domain command
   → Calls ICreateOrderUseCase (primary port)

2. Application Core processes the command
   → CreateOrderUseCase orchestrates domain logic
   → Order aggregate enforces business invariants
   → Use case calls IOrderRepository.save() (secondary port)

3. PostgresOrderRepository (secondary adapter) persists
   → Converts domain entity to DB row
   → Executes SQL INSERT
   → Returns persisted entity

4. Use case calls IEventPublisher.publish() (secondary port)
   → KafkaPublisher (secondary adapter) sends domain event

5. Response flows back through the primary adapter
```

### Technology Stack Examples

| Technology | Primary Adapters | Application Core | Secondary Adapters |
|-----------|-----------------|-----------------|-------------------|
| **Java/Spring** | `@RestController`, `@KafkaListener` | Plain Java + interfaces | Spring Data, Kafka Template |
| **.NET** | ASP.NET Controllers, Azure Functions | C# interfaces + classes | EF Core, Azure SDK |
| **Node.js** | Express routes, Lambda handlers | TS interfaces + classes | TypeORM, AWS SDK, ioredis |

### Project Structure

```
src/
  core/                              # The hexagon
    domain/
      entities/
        Order.ts
        Customer.ts
      value-objects/
        Money.ts
        OrderId.ts
      events/
        OrderCreated.ts
      services/
        PricingService.ts
    application/
      use-cases/
        CreateOrderUseCase.ts
        CancelOrderUseCase.ts
      ports/
        primary/                     # What the app CAN DO
          ICreateOrderUseCase.ts
          ICancelOrderUseCase.ts
        secondary/                   # What the app NEEDS
          IOrderRepository.ts
          IPaymentGateway.ts
          IEventPublisher.ts
  adapters/
    primary/                         # Driving adapters
      rest/
        OrderController.ts
        middleware/
      graphql/
        OrderResolver.ts
      cli/
        ImportOrdersCommand.ts
    secondary/                       # Driven adapters
      persistence/
        PostgresOrderRepository.ts
      payment/
        StripePaymentAdapter.ts
      messaging/
        KafkaEventPublisher.ts
      storage/
        S3FileStorageAdapter.ts
  config/
    dependency-injection.ts
    app-bootstrap.ts
```

---

## Variant 4 — 5-Layer Extended

### Layer Structure

```
+------------------------------------------------------+
|              Layer 1: API / Presentation              |
|   REST Controllers, GraphQL, gRPC, WebSocket, DTOs   |
+------------------------------------------------------+
          |  depends on  ↓
+------------------------------------------------------+
|              Layer 2: Application                     |
|   Use Cases, Application Services, CQRS Handlers,    |
|   Sagas, Orchestration                                |
+------------------------------------------------------+
          |  depends on  ↓
+------------------------------------------------------+
|              Layer 3: Domain                          |
|   Entities, Aggregates, Value Objects, Domain Events, |
|   Repository Interfaces, Domain Services              |
+------------------------------------------------------+
          ↑  implements interfaces from Domain
+------------------------------------------------------+
|              Layer 4: Infrastructure                  |
|   Repository Impls, ORM, Message Brokers, External    |
|   API Clients, File Storage, Cache                    |
+------------------------------------------------------+
          ↑  consumed by all layers
+------------------------------------------------------+
|           Layer 5: Cross-Cutting Concerns             |
|   Logging, Security, Caching, Configuration,          |
|   Exception Handling, Validation, Monitoring           |
+------------------------------------------------------+
```

### Why 5 Layers?

The 5-Layer Extended pattern addresses a practical gap in the 4-Layer DDD model: where do shared utilities, security policies, logging, and configuration live? In a 4-layer model, these concerns either leak into every layer or create awkward dependencies. The Cross-Cutting layer provides a sanctioned home.

### Layer Responsibilities

| Layer | Responsibility | Depends On |
|-------|---------------|------------|
| **API** | HTTP/gRPC/GraphQL entry points, input validation, response formatting, API versioning | Application |
| **Application** | Use case orchestration, CQRS commands/queries, saga coordination, transaction management | Domain |
| **Domain** | Business rules, entities, aggregates, domain events, repository interfaces | Nothing (pure) |
| **Infrastructure** | Database access, messaging, external services, file I/O, cache implementations | Domain (interfaces) |
| **Cross-Cutting** | Logging, security, caching abstractions, configuration, health checks, exception handling | Nothing (utility) |

### Cross-Cutting Layer Deep Dive

| Concern | What It Provides | Consumed By |
|---------|-----------------|-------------|
| **Logging** | Structured logging interfaces and configuration | All layers |
| **Security** | Authentication, authorization, encryption utilities | API, Application |
| **Caching** | Cache abstractions and decorators | Application, Infrastructure |
| **Configuration** | Environment-aware config loading | All layers |
| **Exception Handling** | Global exception types, error codes, middleware | All layers |
| **Validation** | Shared validation rules and pipeline | API, Application |
| **Monitoring** | Health checks, metrics, distributed tracing | All layers |
| **Resilience** | Retry policies, circuit breakers, bulkheads | Infrastructure |

### Technology Stack Examples

| Technology | API | Application | Domain | Infrastructure | Cross-Cutting |
|-----------|-----|-------------|--------|---------------|---------------|
| **Java/Spring** | Spring MVC | Spring Service | POJOs | Spring Data, Kafka | Spring AOP, Micrometer |
| **.NET** | ASP.NET Core | MediatR | C# classes | EF Core, MassTransit | Serilog, Polly |
| **Node.js** | NestJS Controllers | NestJS Services | Plain TS | TypeORM, BullMQ | Winston, Prometheus |

### Project Structure

```
src/
  api/
    controllers/
      OrderController.ts
    dto/
      CreateOrderRequest.ts
      OrderResponse.ts
    middleware/
      AuthenticationMiddleware.ts
    filters/
      GlobalExceptionFilter.ts
  application/
    commands/
      CreateOrderCommand.ts
      CreateOrderHandler.ts
    queries/
      GetOrderQuery.ts
      GetOrderHandler.ts
    sagas/
      OrderFulfillmentSaga.ts
    mappers/
      OrderMapper.ts
  domain/
    aggregates/
      Order.ts
    entities/
      OrderItem.ts
    value-objects/
      Money.ts
      OrderStatus.ts
    events/
      OrderPlacedEvent.ts
    repositories/
      IOrderRepository.ts
    services/
      PricingDomainService.ts
  infrastructure/
    persistence/
      PostgresOrderRepository.ts
    messaging/
      KafkaEventPublisher.ts
    external/
      PaymentGatewayClient.ts
    cache/
      RedisCache.ts
  cross-cutting/
    logging/
      Logger.ts
      LoggingInterceptor.ts
    security/
      JwtValidator.ts
      RbacGuard.ts
    caching/
      CacheDecorator.ts
    config/
      AppConfig.ts
    resilience/
      RetryPolicy.ts
      CircuitBreaker.ts
    monitoring/
      HealthCheck.ts
      MetricsCollector.ts
```

---

## Comparison of All 4 Variants

| Criterion | DDD 4-Layer | Clean Architecture | Hexagonal | 5-Layer Extended |
|-----------|------------|-------------------|-----------|-----------------|
| **Layer count** | 4 | 4 rings | 3 zones (core + 2 adapter sides) | 5 |
| **Core abstraction** | Domain Layer | Entities ring | Application Core (hexagon) | Domain Layer |
| **Dependency direction** | Top-down + Infrastructure inverts | All inward (concentric) | Outside-in through ports | Top-down + Infrastructure inverts + Cross-Cutting |
| **How external deps are isolated** | Infrastructure layer implements domain interfaces | Frameworks ring wraps everything | Adapters implement ports | Infrastructure layer + Cross-Cutting abstractions |
| **Testing strategy** | Mock Infrastructure interfaces | Mock outer rings | Swap adapters (primary and secondary) | Mock Infrastructure + Cross-Cutting decorators |
| **Project structure** | By layer | By ring | Core vs. Adapters | By layer + cross-cutting |
| **Strength** | DDD tactical patterns (aggregates, events) | Strict dependency rule, framework independence | Symmetry — same treatment for all I/O | Enterprise concerns (security, logging, resilience) |
| **Weakness** | Cross-cutting concerns have no home | Can feel over-engineered for simple CRUD | Adapter explosion with many I/O channels | More layers = more indirection |
| **Best fit** | Complex domain logic | Maximum testability and portability | Multiple input/output channels | Enterprise Java/.NET with many shared concerns |

---

## When to Use / When NOT to Use

### DDD 4-Layer

**Use when**:
- The domain model is the most complex and valuable part of the system
- You have identified clear aggregates, entities, and domain events
- The team has DDD experience or is investing in learning it
- Business rules change frequently and must be isolated

**Do NOT use when**:
- The application is primarily CRUD with little business logic
- The domain model is trivial (anemic domain)
- The team is unfamiliar with DDD concepts and timelines are tight

### Clean Architecture

**Use when**:
- Testability is the highest priority
- You anticipate replacing frameworks or databases
- The system must be portable across platforms
- You want the strictest dependency isolation

**Do NOT use when**:
- The system is a simple API proxy or passthrough
- You will never change the framework or database
- The overhead of multiple ring boundaries is unjustified

### Hexagonal Architecture

**Use when**:
- The application has multiple input channels (REST, CLI, events, scheduled jobs)
- You need to swap data stores or external services frequently
- You want symmetric treatment of all I/O (driving and driven)
- Integration testing with real vs. fake adapters is critical

**Do NOT use when**:
- There is only one input channel and one output channel (simple web app)
- Adapter count would be 2 (one controller, one repository) — overhead is not worth it
- The team finds the ports/adapters vocabulary confusing

### 5-Layer Extended

**Use when**:
- Enterprise environment with mandatory cross-cutting concerns (audit, security, resilience)
- Multiple teams share logging, security, and configuration infrastructure
- Regulatory requirements demand explicit separation of security and audit
- The system is large enough that cross-cutting code needs its own module

**Do NOT use when**:
- The application is small enough that cross-cutting concerns fit as middleware
- Adding a fifth layer creates unnecessary complexity for the team size
- Framework-provided cross-cutting support (Spring AOP, NestJS interceptors) is sufficient

---

## Common Anti-Patterns

| Anti-Pattern | Description | Fix |
|-------------|-------------|-----|
| **Anemic Domain** | Domain layer has only getters/setters, all logic in Application layer | Move business rules into domain entities and value objects |
| **Framework in the Domain** | Domain classes annotated with `@Entity`, `@Column`, etc. | Use plain classes; map in Infrastructure |
| **Leaky Abstractions** | Repository interface exposes ORM-specific types (e.g., `QueryBuilder`) | Return domain types only from repository interfaces |
| **God Service** | One Application Service handles 20 use cases | One class per use case (or small group of related use cases) |
| **Circular Dependencies** | Infrastructure imports Application which imports Infrastructure | Strict interface-based dependency inversion |
| **DTO Explosion** | Separate DTOs for every layer boundary | Reuse where layers agree on shape; map only at real boundaries |

---

## References

- **Eric Evans** — *Domain-Driven Design: Tackling Complexity in the Heart of Software* (2003)
- **Robert C. Martin** — *Clean Architecture: A Craftsman's Guide to Software Structure and Design* (2017)
- **Alistair Cockburn** — *Hexagonal Architecture (Ports and Adapters)* (2005), alistair.cockburn.us
- **Vaughn Vernon** — *Implementing Domain-Driven Design* (2013)
- **Vaughn Vernon** — *Domain-Driven Design Distilled* (2016)
- **Tom Hombergs** — *Get Your Hands Dirty on Clean Architecture* (2nd ed., 2023)
- **C4 Model** — c4model.info (for mapping N-Layer to C4, see N-LAYER-TO-C4-TRANSLATION.md)
