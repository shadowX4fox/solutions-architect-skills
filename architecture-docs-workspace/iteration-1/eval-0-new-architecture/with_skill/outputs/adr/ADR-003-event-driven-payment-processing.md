# ADR-003: Event-Driven Payment Processing with Apache Kafka (Amazon MSK)

**Status**: Accepted
**Date**: 2026-03-26
**Impact**: High
**Author**: Carlos Mendez (Engineering Lead)
**Approved by**: Maria Chen (Product Owner), Janet Kirk (Compliance Officer)

---

## Context

PayStream must process 500,000 transactions/day with the following requirements:
- Real-time settlement (< 30 seconds from payment confirmed to ledger entry)
- Bulk partner payment processing in parallel micro-batches
- Exactly-once transaction semantics (zero loss)
- Immutable audit trail for PCI-DSS compliance
- Asynchronous notification delivery (webhook, push, email)

The system must decouple the real-time authorization path from the settlement, reconciliation, and notification paths to avoid the authorization critical path being blocked by settlement work.

---

## Decision

Adopt **Apache Kafka** (via Amazon MSK managed service) as the asynchronous event backbone for all non-critical-path communication. Use Kafka exactly-once semantics (EOS) with transactional producers on all payment-critical topics.

---

## Rationale

1. **Exactly-once semantics (EOS)**: Kafka 3.x supports transactional producers with EOS — critical for zero-loss payment events (per [Principle P1](../docs/02-architecture-principles.md#principle-1-exactly-once-processing))
2. **High throughput**: MSK m5.xlarge handles ~150,000 events/second — 2,500× our 60 TPS requirement at 2KB per event
3. **Immutable log**: Kafka's append-only log with configurable retention (1 year for `audit.trail`) supports PCI-DSS immutable audit requirement (per [Principle P7](../docs/02-architecture-principles.md#principle-7-immutable-audit-trail))
4. **Event replay**: Consumer group offsets allow settlement and reconciliation services to replay unprocessed events after restart — critical for DR scenarios
5. **Amazon MSK**: Managed Kafka reduces operational burden for the SRE team (per [Principle P6](../docs/02-architecture-principles.md#principle-6-operational-simplicity-for-small-teams))
6. **Decoupling**: Authorization path publishes events and returns to client; settlement/reconciliation/notification consume independently — no blocking dependencies

---

## Consequences

**Positive**:
- Zero-loss event delivery with EOS guarantees
- Authorization path fully decoupled from settlement and notification
- Event replay capability for DR and reprocessing
- Immutable audit trail built-in
- MSK managed service reduces operational overhead

**Negative**:
- Exactly-once semantics increase producer implementation complexity (transactional producers)
- Consumer-side idempotency required for all consumer groups (not just producers)
- Kafka cluster cost ($900/month for MSK m5.xlarge × 3 brokers)
- Debugging event-driven flows is harder than synchronous calls (requires distributed tracing)
- MSK upgrade schedule is AWS-managed (less control)

---

## Kafka vs Alternative Messaging Options

| Option | EOS | Throughput | Managed on AWS | Chosen |
|--------|-----|-----------|----------------|--------|
| Amazon MSK (Kafka) | Yes (EOS) | Very High (150K+/s) | Yes (MSK) | **Yes** |
| Amazon SQS + SNS | At-least-once | High | Yes (native) | No |
| Amazon EventBridge | At-least-once | Medium | Yes (native) | No |
| RabbitMQ | At-most-once / at-least-once | Medium | No (self-hosted) | No |

**SQS/SNS not chosen**: Does not provide exactly-once semantics; no consumer group replay capability; cannot serve as immutable audit log.

**EventBridge not chosen**: Not designed for high-throughput event streaming; limited replay capability; does not meet audit retention requirements.
