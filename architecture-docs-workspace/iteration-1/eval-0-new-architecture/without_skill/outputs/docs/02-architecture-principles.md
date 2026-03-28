# Section 2 — Architecture Principles

## 2.1 Guiding Principles

The following principles govern every design decision in PayStream. They are listed in priority order; when two principles conflict, the higher-ranked principle wins.

### P1 — Data Integrity Above All

Payments must never be lost, duplicated, or silently corrupted. Every design trade-off that pits performance against correctness must resolve in favour of correctness. This principle manifests as:
- Exactly-once semantics enforced at the messaging layer (Kafka idempotent producers + transactional consumers).
- Outbox pattern for every service that writes to both a database and an event stream.
- Idempotency keys on all payment APIs so retries are safe.

### P2 — Security and Compliance by Design

PCI-DSS Level 1 and GDPR compliance are non-negotiable constraints, not retrofit items. Security controls are embedded in the architecture, not bolted on:
- Cardholder data handled only by the tokenisation service within a dedicated PCI-scoped network segment.
- All secrets managed by AWS Secrets Manager; zero hardcoded credentials.
- Audit log is append-only and immutable; no service may delete or modify audit records.

### P3 — Independently Deployable Services

Each microservice owns its domain, its data store, and its deployment lifecycle. No two services share a database schema. This enables:
- Targeted scaling of high-throughput services (Payment Processor, Fraud Engine) without touching low-throughput services.
- Independent release cadence; a fraud model update does not require redeployment of the Ledger Service.

### P4 — Async-First Communication

Inter-service communication defaults to asynchronous event streaming (Apache Kafka). Synchronous REST/gRPC is used only where a real-time response is required by the caller (e.g., consumer-facing authorization). This approach:
- Decouples producers from consumers; a downstream service restart does not cascade failures upstream.
- Provides durable message replay for audit and reprocessing.

### P5 — Observable by Default

Every service emits structured logs, metrics, and distributed traces from day one. Observability is not added post-launch. Services that cannot be monitored are not promoted to production.

### P6 — Design for Failure

The platform assumes any individual service, availability zone, or external dependency will fail. Resilience patterns — circuit breakers, bulkheads, retries with exponential back-off, dead-letter queues — are standard components, not optional enhancements.

### P7 — Least Privilege

Every service, IAM role, and human operator is granted only the minimum permissions required for their function. Network access is restricted to explicitly declared trust paths.

### P8 — Operational Simplicity

With 8 engineers and 2 SRE, the architecture must be operable by a small team. Managed AWS services are preferred over self-managed equivalents when the operational difference outweighs the cost premium.

## 2.2 Architecture Style: Microservices

PayStream adopts a **Microservices** architecture style with the following characteristics:

| Characteristic | Implementation |
|---------------|----------------|
| Service granularity | Domain-bounded; one service per bounded context |
| Data ownership | Each service owns its primary data store (no shared schemas) |
| Communication | Async event streaming (Kafka) primary; REST/gRPC for synchronous flows |
| Deployment | Containerised on AWS EKS (Kubernetes) |
| Service discovery | AWS ALB + Kubernetes service mesh (AWS App Mesh) |
| Configuration | AWS Secrets Manager + AWS Parameter Store |

## 2.3 Constraints

| Constraint | Source | Implication |
|-----------|--------|-------------|
| Oracle DB for ledger | Finance team mandate | Ledger Service is the only service that may write to the Oracle instance; all other services use managed AWS data stores |
| AWS cloud only | Enterprise agreement | All infrastructure is AWS; no multi-cloud, no on-premises new workloads |
| Team size: 8 engineers + 2 SRE | Org constraint | Prefer managed services; limit bespoke infrastructure |
| PCI-DSS Level 1 | Regulatory | Network segmentation, encryption, audit log, key rotation, annual pen-test |
| GDPR | Regulatory | Data minimisation, right-to-erasure workflow (tokenisation + pseudonymisation), EU data residency for EU customers |
