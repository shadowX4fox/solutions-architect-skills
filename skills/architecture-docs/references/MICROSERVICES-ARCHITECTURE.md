# Microservices Architecture Reference

> **Purpose**: Comprehensive reference for cloud-native distributed systems built as independently deployable services. Use this document when designing, reviewing, or documenting microservices-based architectures.

---

## 1. What Is Microservices Architecture?

Microservices architecture is an approach to building cloud-native distributed systems as a collection of **independently deployable services**, each owning a specific business capability. Services communicate over well-defined APIs (synchronous or asynchronous), run in their own process, and can be developed, deployed, and scaled independently.

Key characteristics:

- **Small, focused services** — each service encapsulates a single business capability or bounded context
- **Independent deployment** — a change to one service does not require redeploying others
- **Polyglot technology** — each service can use the language, framework, and data store best suited to its problem
- **Decentralized data management** — each service owns its data; no shared database
- **Lightweight communication** — services communicate via HTTP/REST, gRPC, or asynchronous messaging
- **Automated infrastructure** — containerization, orchestration, and CI/CD are foundational, not optional

Microservices architecture is not simply "small services." It is a **sociotechnical architecture style** that aligns software boundaries with organizational boundaries (Conway's Law), enabling autonomous teams to deliver value independently.

---

## 2. Core Principles

### 2.1 Single Responsibility

Each service owns exactly one business capability or bounded context. If a service needs to change for more than one business reason, it should be split.

### 2.2 Loose Coupling

Services minimize dependencies on each other. A change in Service A's internal implementation must not require a change in Service B. Coupling is managed through:

- Versioned API contracts
- Asynchronous event-driven communication
- Anti-corruption layers at integration boundaries

### 2.3 Independent Deployability

Each service can be built, tested, and deployed to production without coordinating with other services. This is the **litmus test** of a true microservices architecture. If you cannot deploy Service A without also deploying Service B, you have a distributed monolith.

### 2.4 Data Sovereignty

Each service owns its data store. No other service may read from or write to another service's database directly. Data is shared through:

- API calls (synchronous)
- Domain events (asynchronous)
- Materialized views or read models (CQRS)

### 2.5 Decentralized Governance

Teams choose their own technology stacks, frameworks, and patterns within organizational guardrails. There is no single "blessed" framework — but there are shared standards for:

- API design (OpenAPI, AsyncAPI)
- Observability (structured logging, distributed tracing)
- Security (authentication, authorization protocols)
- Deployment (container standards, health check contracts)

### 2.6 Design for Failure

In a distributed system, failure is not exceptional — it is inevitable. Every service must:

- Handle downstream failures gracefully (circuit breakers, fallbacks)
- Implement timeouts on all outbound calls
- Be idempotent for retried operations
- Define and enforce SLOs (latency, availability, error rate)

### 2.7 Observable by Default

Every service must be observable from day one. Observability is not a nice-to-have; it is a hard requirement for operating distributed systems. The three pillars:

- **Logs** — structured, correlated by trace ID
- **Metrics** — RED (Rate, Errors, Duration) and USE (Utilization, Saturation, Errors)
- **Traces** — distributed traces across service boundaries

---

## 3. Architecture Components

### 3.1 API Gateway

The API Gateway is the single entry point for all client requests. It handles cross-cutting concerns before routing to downstream services.

**Responsibilities:**

| Concern | Description |
|---------|-------------|
| Routing | Maps external URLs to internal service endpoints |
| Authentication | Validates JWT/OAuth2 tokens before forwarding |
| Rate Limiting | Enforces per-client or per-endpoint request quotas |
| Request Aggregation | Combines multiple service calls into a single client response |
| Protocol Translation | Translates between client protocols (HTTP) and internal protocols (gRPC) |
| SSL Termination | Terminates TLS at the edge |
| Caching | Caches responses for idempotent GET requests |

**Backend-for-Frontend (BFF) Pattern:**

Instead of a single monolithic gateway, deploy one lightweight gateway per client type:

- `gateway-web` — optimized for SPA clients (aggregates, transforms for browser)
- `gateway-mobile` — optimized for mobile (smaller payloads, offline support)
- `gateway-partner` — optimized for B2B integrations (API key auth, webhook callbacks)

Each BFF is owned by the frontend team it serves, enabling independent evolution.

**Gateway Aggregation:**

The gateway can compose responses from multiple services in a single request. This reduces client-side complexity and minimizes round trips:

```
Client → Gateway → [Service A + Service B + Service C] → Aggregated Response → Client
```

Use aggregation sparingly. If the gateway contains business logic, it has become an orchestration service and should be extracted.

### 3.2 Services

Services are the core building blocks. They are categorized by their responsibility:

**Domain Services** (Business Capability Services):

- Implement core business logic for a bounded context
- Own their data store
- Expose APIs consumed by other services or the gateway
- Examples: `order-service`, `payment-service`, `inventory-service`, `customer-service`

**Application Services** (Orchestration / Composition):

- Coordinate workflows across multiple domain services
- Implement saga patterns for distributed transactions
- Do not own business logic — they orchestrate
- Examples: `checkout-orchestrator`, `onboarding-workflow`, `claim-processor`

**Infrastructure Services** (Platform Capabilities):

- Provide shared technical capabilities consumed by all services
- Are not business-specific
- Examples: `notification-service`, `file-storage-service`, `audit-log-service`, `scheduler-service`

**Edge Services** (Client-Facing Adapters):

- BFF gateways and API adapters
- Translate between external client needs and internal service APIs
- Examples: `web-bff`, `mobile-bff`, `partner-adapter`

### 3.3 Data Stores (Polyglot Persistence)

Each service chooses the data store best suited to its access patterns:

| Access Pattern | Recommended Store | Example |
|---------------|-------------------|---------|
| Transactional CRUD | PostgreSQL, MySQL | Order Service |
| Document/flexible schema | MongoDB, DynamoDB | Product Catalog |
| Key-value / caching | Redis, Memcached | Session Store |
| Full-text search | Elasticsearch, OpenSearch | Search Service |
| Time-series | TimescaleDB, InfluxDB | Metrics Service |
| Graph relationships | Neo4j, Neptune | Recommendation Engine |
| Event log / streaming | Kafka, EventStoreDB | Event Sourcing |
| File / object storage | S3, MinIO, GCS | Document Service |

**Data Consistency Patterns:**

Since each service owns its data, cross-service consistency requires explicit patterns:

- **Outbox Pattern**: Write domain event to a local `outbox` table in the same transaction as the business data. A separate process (Debezium, polling publisher) reads the outbox and publishes to the message broker. Guarantees at-least-once delivery without distributed transactions.

- **Change Data Capture (CDC)**: Capture database change events directly from the transaction log (WAL/binlog) using tools like Debezium. Enables real-time data synchronization without application-level changes.

- **Saga Pattern**: Coordinate multi-service transactions as a sequence of local transactions with compensating actions. Two variants:
  - **Choreography**: Each service listens for events and reacts independently. Simple but hard to trace.
  - **Orchestration**: A central orchestrator directs the saga steps. Easier to understand and monitor.

- **CQRS + Event Sourcing (CQRS+ES)**: Separate write model (commands) from read model (queries). Write side appends events to an event store. Read side projects events into optimized read models (materialized views). Enables:
  - Independent scaling of reads and writes
  - Complete audit trail
  - Temporal queries ("what was the state at time T?")
  - Event replay for rebuilding projections

### 3.4 Event Bus / Message Broker

Asynchronous messaging is the backbone of a loosely coupled microservices architecture.

**Communication Patterns:**

| Pattern | Description | Use Case | Broker |
|---------|-------------|----------|--------|
| Pub/Sub | Publisher emits event; multiple subscribers consume independently | Domain events, notifications | Kafka, SNS+SQS, RabbitMQ (fanout) |
| Point-to-Point | One producer, one consumer per message | Task queues, command processing | SQS, RabbitMQ (direct) |
| Event Streaming | Ordered, replayable log of events with consumer group semantics | Event sourcing, data pipelines, CDC | Kafka, Kinesis, Pulsar |
| Request-Reply | Synchronous-style communication over async transport | RPC over messaging (rare) | RabbitMQ (reply-to) |

**Dead Letter Queue (DLQ):**

Messages that fail processing after a configured number of retries are routed to a DLQ. DLQ messages must be:

- Monitored with alerts
- Inspectable via tooling (console, CLI)
- Replayable after the root cause is fixed
- Retained for a defined period (e.g., 14 days)

---

## 4. Supporting Infrastructure

### 4.1 Service Discovery

Services need to find each other without hardcoded addresses. Two approaches:

- **Client-side discovery**: Service queries a registry (Consul, Eureka) and load-balances locally
- **Server-side discovery**: Load balancer (Kubernetes Service, AWS ALB) handles routing; services register automatically

In Kubernetes environments, **DNS-based service discovery** (CoreDNS + Kubernetes Services) is the standard approach. External service meshes (Istio, Linkerd) add advanced traffic management.

### 4.2 Service Mesh

A service mesh provides a dedicated infrastructure layer for service-to-service communication:

- **mTLS** — automatic mutual TLS between all services
- **Traffic management** — canary deployments, traffic splitting, retries, timeouts
- **Observability** — automatic distributed tracing, metrics collection
- **Policy enforcement** — authorization policies, rate limiting

Common implementations: Istio, Linkerd, Consul Connect.

The service mesh operates as sidecar proxies (Envoy) injected alongside each service container. Application code is unaware of the mesh.

### 4.3 Containerization (Docker + Kubernetes)

Microservices are packaged as container images and orchestrated by Kubernetes:

- **Docker** — standard container runtime; each service has a Dockerfile
- **Kubernetes** — orchestration: scheduling, scaling, self-healing, service discovery
- **Helm / Kustomize** — templated Kubernetes manifests for environment-specific configuration
- **Namespaces** — logical isolation per team or environment

Key Kubernetes resources per service:

| Resource | Purpose |
|----------|---------|
| Deployment | Manages pod replicas and rolling updates |
| Service | Stable network endpoint (ClusterIP, LoadBalancer) |
| HorizontalPodAutoscaler | Scales pods based on CPU/memory/custom metrics |
| ConfigMap / Secret | Externalized configuration and sensitive values |
| Ingress | External HTTP routing to services |
| NetworkPolicy | Pod-level firewall rules |
| PodDisruptionBudget | Guarantees minimum available pods during maintenance |

### 4.4 CI/CD Pipeline

Each service has its own CI/CD pipeline enabling independent deployment:

```
Code Push → Build → Unit Tests → Container Build → Integration Tests → Security Scan → Deploy to Staging → E2E Tests → Deploy to Production
```

Key practices:

- **Trunk-based development** — short-lived branches, frequent merges to main
- **Feature flags** — decouple deployment from release
- **Canary deployments** — roll out to a small percentage of traffic first
- **Blue-green deployments** — maintain two production environments, switch traffic
- **Automated rollback** — revert on error rate or latency SLO breach

### 4.5 Observability (Logging, Metrics, Tracing)

**Structured Logging:**

- JSON format with consistent fields: `timestamp`, `level`, `service`, `traceId`, `spanId`, `message`
- Centralized aggregation: ELK (Elasticsearch + Logstash + Kibana), Loki + Grafana, CloudWatch
- Correlation via `traceId` propagated in HTTP headers (`X-Trace-Id`, `traceparent`)

**Metrics:**

- RED method per service: **R**ate (requests/sec), **E**rrors (error rate %), **D**uration (latency percentiles)
- USE method per resource: **U**tilization, **S**aturation, **E**rrors
- Tools: Prometheus + Grafana, Datadog, CloudWatch Metrics
- Custom business metrics: orders/min, payment success rate, search latency

**Distributed Tracing:**

- OpenTelemetry (OTel) as the standard instrumentation SDK
- Trace propagation via W3C `traceparent` header
- Visualization: Jaeger, Zipkin, Tempo, X-Ray
- Every service boundary (HTTP call, message publish/consume, DB query) creates a span

---

## 5. Resilience Patterns

### 5.1 Circuit Breaker

Prevents cascading failures by detecting when a downstream service is unhealthy and short-circuiting requests.

**States:**

1. **Closed** — requests flow normally; failures are counted
2. **Open** — requests are immediately rejected (fail fast); triggered when failure threshold is exceeded
3. **Half-Open** — a limited number of test requests are allowed; if successful, circuit closes; if failed, circuit reopens

**Configuration parameters:** failure threshold (e.g., 50% in 10s window), open duration (e.g., 30s), half-open test count (e.g., 3 requests).

### 5.2 Retry with Exponential Backoff

Retries failed requests with increasing delays to avoid overwhelming a recovering service:

```
Attempt 1: immediate
Attempt 2: 100ms + jitter
Attempt 3: 200ms + jitter
Attempt 4: 400ms + jitter
(max 3-5 retries)
```

**Critical**: Add random jitter to prevent thundering herd. Only retry on transient errors (5xx, timeout, connection refused). Never retry on 4xx (client errors).

### 5.3 Timeout

Every outbound call must have an explicit timeout. Unbounded waits are a system-killing antipattern.

- **Connection timeout**: 1-3 seconds (time to establish connection)
- **Read timeout**: varies by operation (100ms for cache, 1-5s for service calls, 30s for reports)
- **Total timeout**: end-to-end deadline propagated via `deadline` or `timeout` headers

### 5.4 Bulkhead

Isolates failures by partitioning resources (thread pools, connection pools, rate limits) per downstream dependency:

- If Service A's connection pool to Service B is exhausted, calls to Service C are unaffected
- Implemented via separate thread pools (Hystrix-style) or semaphore limits
- In Kubernetes: resource limits and requests per container prevent noisy-neighbor effects

### 5.5 Rate Limiter

Protects services from being overwhelmed by excessive requests:

- **Token bucket** — smooth rate limiting with burst allowance
- **Sliding window** — precise rate counting over a time window
- **Per-client** — different limits for different API consumers
- **Global** — total capacity protection for the service

Return `429 Too Many Requests` with `Retry-After` header.

### 5.6 Fallback

When a dependency fails, return a degraded but acceptable response:

- Cached previous response (stale data)
- Default values
- Simplified computation (skip recommendation engine, return popular items)
- Graceful degradation message to the user

### 5.7 Idempotency

Ensure operations can be safely retried without side effects:

- Use idempotency keys (client-generated UUID) for POST/PUT operations
- Store processed idempotency keys with TTL (e.g., 24h in Redis)
- Return the original response for duplicate requests
- Critical for payment processing, order creation, and any state-changing operation

---

## 6. Security

### 6.1 Zero Trust Network

Trust nothing, verify everything:

- No implicit trust based on network location
- Every service-to-service call is authenticated and authorized
- Network policies restrict pod-to-pod communication to only what is explicitly allowed
- Encrypt all traffic in transit (mTLS)

### 6.2 Mutual TLS (mTLS)

All service-to-service communication uses mutual TLS:

- Both client and server present certificates
- Certificates are managed by the service mesh (Istio, Linkerd) or a PKI (Vault, cert-manager)
- Automatic certificate rotation (short-lived certificates, 24h validity)
- Application code is unaware of TLS — handled by sidecar proxy

### 6.3 OAuth 2.0 + OpenID Connect (OIDC)

External client authentication and authorization:

- **Authorization Code + PKCE** — for SPAs and mobile apps
- **Client Credentials** — for service-to-service (machine-to-machine) communication
- **JWT access tokens** — validated at the API Gateway and/or individual services
- **Token introspection** — for opaque tokens requiring server-side validation
- **Scopes and claims** — fine-grained authorization based on token content

### 6.4 API Key + Scopes

For partner and B2B integrations:

- API keys identify the calling application (authentication)
- Scopes define what the application is allowed to do (authorization)
- Keys are rotatable, revocable, and rate-limited independently
- Never embed API keys in client-side code

### 6.5 Secret Management

Secrets (database passwords, API keys, certificates) are never stored in code or configuration files:

- **Vault** (HashiCorp) — dynamic secrets, secret rotation, lease management
- **Kubernetes Secrets** — base64-encoded (encrypt at rest with KMS)
- **AWS Secrets Manager / GCP Secret Manager** — cloud-native secret stores
- **External Secrets Operator** — syncs external secret stores to Kubernetes Secrets

### 6.6 Network Policies

Kubernetes NetworkPolicies restrict pod communication:

- Default deny all ingress and egress
- Explicitly allow only required communication paths
- Label-based selection (e.g., `app: order-service` can reach `app: payment-service`)
- Enforced by CNI plugins (Calico, Cilium)

---

## 7. When to Use Microservices

### When to Use

- Large, complex domains with multiple bounded contexts
- Multiple autonomous teams that need to deploy independently
- Different parts of the system have different scaling requirements
- Different parts of the system benefit from different technology stacks
- Organization has the operational maturity to manage distributed systems
- System requires high availability and fault isolation between components
- Rapid, independent feature delivery across teams is a business requirement

### When NOT to Use

- Small team (fewer than 5-8 developers) — the operational overhead outweighs the benefits
- Simple domain with few business capabilities — a well-structured monolith is simpler and faster
- Startup / MVP phase — you don't yet understand the domain boundaries; start with a modular monolith
- No CI/CD automation — microservices without automated pipelines is operational suicide
- No observability infrastructure — you cannot operate what you cannot see
- Team lacks distributed systems experience — the learning curve is steep and mistakes are costly
- Low-latency requirements between components — network hops add latency; a monolith in-process call is always faster
- Strong data consistency requirements across the entire system — distributed transactions are hard; a single database is simpler

---

## 8. Technology Stack Reference

| Concern | Options |
|---------|---------|
| **API Gateway** | Kong, AWS API Gateway, Apigee, Traefik, NGINX, Envoy Gateway |
| **Service Framework** | Spring Boot (Java), NestJS (Node.js), FastAPI (Python), Go stdlib + chi/gin, .NET Minimal API |
| **Service Mesh** | Istio, Linkerd, Consul Connect, Cilium Service Mesh |
| **Message Broker** | Apache Kafka, RabbitMQ, AWS SQS/SNS, Google Pub/Sub, NATS |
| **Container Runtime** | Docker, containerd, CRI-O |
| **Orchestration** | Kubernetes (EKS, GKE, AKS), Nomad, ECS |
| **Service Discovery** | Kubernetes DNS, Consul, Eureka |
| **CI/CD** | GitHub Actions, GitLab CI, Jenkins, ArgoCD, Flux |
| **Observability - Logs** | ELK Stack, Loki + Grafana, CloudWatch Logs, Datadog |
| **Observability - Metrics** | Prometheus + Grafana, Datadog, CloudWatch Metrics, New Relic |
| **Observability - Traces** | Jaeger, Zipkin, Tempo, AWS X-Ray, Datadog APM |
| **Instrumentation** | OpenTelemetry (OTel) |
| **Secret Management** | HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault |
| **Configuration** | ConfigMaps + Secrets, Spring Cloud Config, Consul KV |
| **Database (Relational)** | PostgreSQL, MySQL, Aurora, Cloud SQL |
| **Database (Document)** | MongoDB, DynamoDB, Firestore, CosmosDB |
| **Database (Cache)** | Redis, Memcached, ElastiCache |
| **Database (Search)** | Elasticsearch, OpenSearch |
| **Event Store** | EventStoreDB, Kafka (as event log), DynamoDB Streams |
| **Schema Registry** | Confluent Schema Registry (Avro, Protobuf, JSON Schema) |
| **API Specification** | OpenAPI 3.1 (REST), AsyncAPI 3.0 (async), gRPC/Protobuf |

---

## 9. References

- **Sam Newman** — *Building Microservices* (2nd ed., O'Reilly, 2021) — the definitive guide to microservices design and operation
- **Chris Richardson** — *Microservices Patterns* (Manning, 2018) — pattern catalog for microservices (Saga, CQRS, API Gateway, etc.); see also [microservices.io](https://microservices.io)
- **Martin Fowler** — [Microservices Resource Guide](https://martinfowler.com/microservices/) — foundational articles including "Microservices" (2014), "MonolithFirst", and "Microservice Prerequisites"
- **The Twelve-Factor App** — [12factor.net](https://12factor.net) — methodology for building cloud-native applications; applies directly to microservices design
- **CNCF (Cloud Native Computing Foundation)** — [cncf.io](https://cncf.io) — landscape of cloud-native technologies; Trail Map for adoption guidance
- **Eric Evans** — *Domain-Driven Design* (Addison-Wesley, 2003) — bounded contexts and strategic design that define service boundaries
- **Vaughn Vernon** — *Implementing Domain-Driven Design* (Addison-Wesley, 2013) — practical DDD applied to service design
- **OpenTelemetry** — [opentelemetry.io](https://opentelemetry.io) — vendor-neutral observability framework (logs, metrics, traces)
- **AsyncAPI** — [asyncapi.com](https://asyncapi.com) — specification for event-driven APIs
