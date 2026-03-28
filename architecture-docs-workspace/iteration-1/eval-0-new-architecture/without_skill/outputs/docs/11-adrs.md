# Section 11 — Architecture Decision Records

## ADR-001: Microservices Architecture

**Status**: Accepted
**Date**: 2026-03-26
**Deciders**: Carlos Mendez (Engineering Lead), Maria Chen (PO)

### Context
The legacy monolithic payment system cannot scale to 500,000 tx/day, cannot be deployed independently per domain, and cannot be complied with PCI-DSS requirements that mandate strict isolation of cardholder data handling.

### Decision
Adopt a Microservices architecture with 9 domain-scoped services. Each service owns its data store, deploys independently, and communicates via Kafka (async) or gRPC/REST (sync where latency demands it).

### Consequences
- (+) Independent scaling per service; Payment Processor and Fraud Detection scale without affecting Ledger.
- (+) PCI-DSS compliance through network isolation of Tokenisation Service.
- (+) Fault isolation; a Notification Service failure does not affect payment authorization.
- (-) Distributed systems complexity: eventual consistency, saga coordination, distributed tracing required.
- (-) Higher operational overhead; mitigated by managed AWS services and GitOps.

---

## ADR-002: Outbox Pattern for Exactly-Once Event Publishing

**Status**: Accepted
**Date**: 2026-03-26
**Deciders**: Carlos Mendez

### Context
Payment Processor must both persist a payment record to Aurora and publish a Kafka event. Without coordination, either the DB write or Kafka publish can fail independently, leading to duplicate processing or lost events — violating the "zero transaction loss" SLO.

### Decision
Implement the Transactional Outbox Pattern:
1. Payment Processor writes the payment record AND an outbox event row in a single Aurora transaction.
2. Debezium (deployed on MSK Connect) polls the outbox table via CDC and publishes events to Kafka.
3. Kafka idempotent producer ensures at-least-once delivery; consumer idempotency keys ensure exactly-once processing.

### Alternatives Considered
- **Two-phase commit (XA)**: Rejected — Java/Kafka XA support is poor; high latency overhead.
- **Saga choreography without outbox**: Rejected — doesn't guarantee atomicity between DB write and event publish.

### Consequences
- (+) Exactly-once semantics without distributed transactions.
- (+) Debezium is a well-understood open-source tool with MSK Connect managed runtime.
- (-) Additional operational component (Debezium); mitigated by MSK Connect (managed).
- (-) Small latency increase (CDC polling interval: 100 ms); acceptable within async budget.

---

## ADR-003: Retain Oracle Database for Ledger Persistence

**Status**: Accepted (constrained by business)
**Date**: 2026-03-26
**Deciders**: Finance Team (mandate), Carlos Mendez (acknowledgement)

### Context
Finance team prohibits migration of the Oracle ledger database due to audit history continuity and existing Oracle licence amortisation. The architecture must work with the existing Oracle 19c instance.

### Decision
Accept Oracle as the Ledger Service data store. Isolate all Oracle access behind the Ledger Service (single writer, read replica for reporting). Other services use Aurora PostgreSQL or DynamoDB.

### Consequences
- (+) No data migration risk; existing Oracle audit history preserved.
- (+) Finance team constraints satisfied without negotiation.
- (-) Oracle connection pool becomes a throughput ceiling (100 connections → ~170 tx/s max write throughput). Mitigation: micro-batch writes (50 entries/commit).
- (-) Oracle is not natively cloud-managed on AWS; DBA team retains responsibility for patching and standby configuration.
- **Revisit trigger**: If PayStream exceeds 150 tx/s sustained for > 30 days, re-evaluate Oracle capacity or migrate to Aurora PostgreSQL.

---

## ADR-004: Apache Kafka (Amazon MSK) for Async Communication

**Status**: Accepted
**Date**: 2026-03-26
**Deciders**: Carlos Mendez

### Context
Async inter-service communication requires a durable, replayable event stream with exactly-once semantics. The platform must support high-throughput fan-out (one payment event consumed by 4+ services).

### Decision
Use Apache Kafka via Amazon MSK for all async inter-service communication. AWS Glue Schema Registry enforces Avro schema contracts.

### Alternatives Considered
- **Amazon SQS + SNS**: Rejected for core payment flows — no replay, no schema enforcement, fan-out requires topic duplication across SNS subscribers.
- **Amazon EventBridge**: Rejected — no exactly-once support; routing rules are less expressive for high-throughput patterns.

### Consequences
- (+) Durable replay for audit and reprocessing.
- (+) Exactly-once with idempotent producers + transactional consumers.
- (+) Managed MSK removes Kafka operations burden.
- (-) More complex consumer group management; mitigated by Kafka client libraries.
- (-) MSK cost higher than SQS at low volume; cost justified by compliance requirements.

---

## ADR-005: AWS CloudHSM for PCI Key Management

**Status**: Accepted
**Date**: 2026-03-26
**Deciders**: Janet Kirk (Compliance Officer), Carlos Mendez

### Context
PCI-DSS Requirement 3 mandates that encryption keys for cardholder data be stored in a FIPS 140-2 Level 3 validated device. AWS KMS (software-protected keys) satisfies Level 2 only.

### Decision
Use AWS CloudHSM for all PAN encryption/decryption key management. Tokenisation Service accesses CloudHSM via PKCS#11.

### Consequences
- (+) FIPS 140-2 Level 3 compliance; satisfies PCI-DSS Req 3.
- (+) Keys never exported from HSM in plaintext.
- (-) CloudHSM costs significantly more than AWS KMS (~$1.45/hr/HSM vs $0.03/10K API calls).
- (-) CloudHSM cluster requires 2+ HSM instances for HA; minimum ~$2,088/month.
- **Justification**: PCI-DSS Level 1 requirement; cost is a compliance cost, not optional.

---

## ADR-006: Java 21 Virtual Threads for Payment Processor and Ledger Service

**Status**: Accepted
**Date**: 2026-03-26
**Deciders**: Carlos Mendez

### Context
Payment Processor makes multiple blocking I/O calls (Aurora, gRPC to Tokenisation, REST to Fraud Detection) per request. Traditional thread-per-request model requires large thread pools for throughput; reactive programming (WebFlux) adds code complexity.

### Decision
Use Java 21 with virtual threads (Project Loom) enabled in Spring Boot 3 (`spring.threads.virtual.enabled=true`). Virtual threads allow blocking I/O code style without the memory overhead of OS threads.

### Consequences
- (+) Simple blocking code style; no reactive complexity.
- (+) JVM handles thousands of concurrent virtual threads with minimal memory.
- (+) Java 21 is LTS; long-term support guaranteed.
- (-) Virtual threads are relatively new; team requires ramp-up on debugging techniques.
- (-) Some libraries (HikariCP, Oracle JDBC) need pinned-carrier-thread awareness; documented in team wiki.
