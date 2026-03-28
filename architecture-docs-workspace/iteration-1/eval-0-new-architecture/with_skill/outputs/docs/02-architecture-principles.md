# Section 3: Architecture Principles

[Architecture](../ARCHITECTURE.md) > Architecture Principles

---

## Overview

These principles guide all architectural decisions for PayStream. They were derived from the business objectives in the Product Owner Specification (see [Executive Summary](01-system-overview.md)), the regulatory constraints (PCI-DSS Level 1, GDPR), and the operational reality of an 8-engineer / 2-SRE team delivering a 10× scale-up in 6 months.

---

## Principle 1: Exactly-Once Processing

**Statement**: Every payment transaction must be processed exactly once. Duplicate processing or silent loss are both unacceptable.

**Rationale**: Financial transactions carry legal and regulatory weight. Duplicate debits cause direct customer harm; silent loss creates ledger inconsistency. PCI-DSS and financial regulations mandate zero transaction loss.

**Implementation**:
- Idempotency keys on all payment API endpoints
- Kafka exactly-once semantics (EOS) with transactional producers
- Event deduplication via event ID tracking in each consuming service
- Saga pattern ([ADR-005](../adr/ADR-005-saga-pattern-distributed-transactions.md)) for distributed transaction compensation

**Trade-offs**:
- (+) Zero transaction loss, auditable exactly-once guarantee
- (-) Higher implementation complexity; requires careful state management in each service
- (-) Performance overhead of Kafka EOS and idempotency checks

---

## Principle 2: Security by Design (PCI-DSS First)

**Statement**: Security controls are embedded at every layer, not added as an afterthought. All design decisions must pass PCI-DSS Level 1 requirements.

**Rationale**: PCI-DSS Level 1 certification is a hard deadline at month 7. The cost of retrofitting security is far higher than building it in. Cardholder data exposure carries regulatory fines and business-ending reputational damage.

**Implementation**:
- Encryption in transit (TLS 1.3) and at rest (AES-256) everywhere
- Network segmentation: PCI scope boundary isolates cardholder data environment (CDE)
- Secrets management via AWS Secrets Manager — no hardcoded credentials
- mTLS for all service-to-service communication within the CDE
- Immutable audit trail for all transaction events
- GDPR: EU customer data remains in eu-west-1 region; right-to-erasure implemented via pseudonymization

**Trade-offs**:
- (+) Audit-ready architecture; reduced certification risk
- (-) Network overhead from mTLS; latency budget must account for encryption handshake
- (-) Operational complexity of certificate rotation

---

## Principle 3: Event-Driven Loose Coupling

**Statement**: Services communicate asynchronously via events wherever possible. Synchronous calls are reserved for operations requiring immediate response.

**Rationale**: Real-time settlement (< 30 seconds) and parallel micro-batch processing for partners require an event-driven backbone. Synchronous coupling between payment services would create cascading failure risk at scale.

**Implementation**:
- Apache Kafka as the event backbone ([ADR-003](../adr/ADR-003-event-driven-payment-processing.md))
- Synchronous REST/gRPC only on the critical path requiring sub-2-second response (authorization)
- Async events for settlement, reconciliation, notifications, and webhook delivery
- Dead-letter queues for all consumer groups; failed events are never silently dropped

**Trade-offs**:
- (+) Service independence; resilience to partial failures; horizontal scale-out
- (-) Eventual consistency; debugging distributed event chains is harder than synchronous call stacks
- (-) Kafka cluster operational overhead for a small SRE team

---

## Principle 4: Database-per-Service (Bounded Context Ownership)

**Statement**: Each microservice owns its data store exclusively. No service reads or writes another service's database directly.

**Rationale**: Shared databases create invisible coupling between services, making independent deployment and scaling impossible. Bounded context ownership enables teams to evolve schemas without coordination.

**Exception**: The Oracle ledger database is a shared persistence store for the Ledger Service only, mandated by the finance team constraint ([ADR-002](../adr/ADR-002-oracle-ledger-persistence.md)). No other service accesses Oracle directly — all ledger access goes through the Ledger Service API.

**Implementation**:
- Each service has its own dedicated database (PostgreSQL on AWS RDS for most services)
- Oracle retained for Ledger Service (existing enterprise agreement, migration prohibited)
- Redis for session state, rate limiting, and idempotency key caching
- No cross-service database joins — data composition happens at the API or event level

**Trade-offs**:
- (+) Independent deployment; technology choice flexibility per service
- (-) No cross-service ACID transactions — requires Saga pattern for consistency
- (-) Data duplication necessary for denormalized read models

---

## Principle 5: Design for 10× Scale

**Statement**: All capacity planning, auto-scaling policies, and SLA targets are designed for 500,000 transactions/day, not the current 50,000/day baseline.

**Rationale**: The PO Spec projects 10× growth within 18 months. Building to current load guarantees re-architecture within a year. AWS horizontal scaling makes this achievable without over-provisioning hardware upfront (see [Key Metrics](01-system-overview.md#key-metrics)).

**Implementation**:
- Horizontal Pod Autoscaler (HPA) on all payment-path services
- Kafka partitioning designed for 10× throughput (60 TPS sustained)
- Oracle connection pool sized for 10× concurrent transactions
- Load testing at 2× peak (120 TPS) before each release

**Trade-offs**:
- (+) No re-architecture required for projected growth period
- (-) Slightly higher baseline infrastructure cost during low-traffic phase
- (-) Load testing at 10× scale is a non-trivial engineering investment

---

## Principle 6: Operational Simplicity for Small Teams

**Statement**: Architecture choices must be operable by 2 SREs without heroics. Automation over manual processes; managed services over self-operated infrastructure wherever the trade-off is acceptable.

**Rationale**: An 8-engineer team building a new platform cannot also operate a complex Kubernetes cluster, Kafka cluster, and Oracle database without managed service support. Operational complexity that creates SRE toil will slow feature delivery and increase MTTR.

**Implementation**:
- AWS EKS (managed Kubernetes) for container orchestration
- Amazon MSK (managed Kafka) instead of self-hosted
- AWS RDS (managed PostgreSQL) for service databases
- AWS Secrets Manager for secrets (no HashiCorp Vault operational overhead)
- Automated runbooks for DR failover (see [Operational Considerations](09-operational-considerations.md))
- Observability via AWS CloudWatch + OpenTelemetry (avoid standalone Prometheus/Grafana stack unless needed)

**Trade-offs**:
- (+) Reduced operational overhead; faster time-to-production
- (-) Vendor lock-in to AWS managed services; higher cost than self-operated at extreme scale
- (-) Less control over managed service upgrade schedules

---

## Principle 7: Immutable Audit Trail

**Statement**: Every state change in a payment transaction must produce an immutable, append-only audit record traceable to a specific actor, timestamp, and system event.

**Rationale**: PCI-DSS requires audit logs for all cardholder data access and system events. Financial regulations require dispute resolution capability. Immutability prevents tampering.

**Implementation**:
- Event sourcing for the payment transaction log — events are never updated, only appended
- AWS CloudTrail for infrastructure-level audit
- Structured JSON logging with correlation IDs across all services
- Log retention: 12 months hot, 7 years cold (S3 Glacier) per PCI-DSS requirement

**Trade-offs**:
- (+) Full audit trail for PCI-DSS compliance; dispute resolution capability
- (-) Event store growth requires archival strategy; query complexity increases over time
- (-) Debugging requires correlation ID discipline across all services

---

## Principle Summary Table

| # | Principle | Key Mechanism | Primary Benefit |
|---|-----------|---------------|-----------------|
| P1 | Exactly-Once Processing | Kafka EOS, idempotency keys, Saga pattern | Zero transaction loss |
| P2 | Security by Design (PCI-DSS First) | mTLS, TLS 1.3, AES-256, AWS Secrets Manager | Certification readiness |
| P3 | Event-Driven Loose Coupling | Kafka, async events, DLQ | Resilience, scale |
| P4 | Database-per-Service | Owned schemas, Ledger Service API boundary | Independent deployment |
| P5 | Design for 10× Scale | HPA, MSK partitioning, Oracle pool | Growth without re-arch |
| P6 | Operational Simplicity | AWS managed services, EKS, MSK, RDS | Small team operability |
| P7 | Immutable Audit Trail | Event sourcing, CloudTrail, structured logging | PCI-DSS compliance |
