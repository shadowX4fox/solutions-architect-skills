# ADR-005: Saga Pattern for Distributed Transactions

**Status**: Accepted
**Date**: 2026-03-26
**Impact**: High
**Author**: Carlos Mendez (Engineering Lead)
**Approved by**: Maria Chen (Product Owner), Janet Kirk (Compliance Officer)

---

## Context

PayStream uses a database-per-service pattern ([ADR-001](ADR-001-microservices-architecture.md)). A payment transaction spans multiple services (Payment Service, Authorization Service, Fraud Detection Service, Ledger Service). When a failure occurs after a partial sequence (e.g., authorization succeeds but ledger write fails), the system must compensate to ensure data consistency.

Traditional ACID distributed transactions (2-Phase Commit / XA) are not feasible in a microservices architecture because:
- They require a distributed transaction coordinator (single point of failure)
- They hold database locks across service boundaries (latency incompatible with the 2-second SLO)
- Most microservices frameworks do not support XA transactions

---

## Decision

Adopt the **Saga Pattern (Choreography style)** for distributed transactions spanning multiple services.

---

## Saga Design for Payment Flow

**Happy path** (no compensation needed):

```
Payment Service → publishes payment.submitted
  → Authorization Service authorizes → publishes authorization.completed
  → Fraud Detection scores LOW/MEDIUM → proceeds
  → Ledger Service posts entry → publishes ledger.entry.posted
  → Payment Service confirms → publishes payment.confirmed
```

**Compensation path** (ledger write fails after authorization):

```
Ledger Service fails → Payment Service detects timeout
  → Payment Service publishes payment.cancelled
  → Authorization Service reverses authorization (publishes authorization.reversed)
  → Notification Service notifies customer of cancellation
```

**Compensation guarantees**:
- Every saga step that can fail must have a defined compensating transaction
- Compensating transactions are idempotent (safe to retry multiple times)
- Payment Service owns the saga state machine; maintains `saga_state` table tracking current step and compensation status

---

## Rationale

**Choreography vs Orchestration**:
- Chose **choreography** (event-driven reactions) over orchestration (central saga orchestrator) to keep the Payment Service as a lightweight coordinator without requiring a dedicated saga orchestrator service
- Each service reacts to events and publishes its own compensation events
- Saga state is maintained in the Payment Service's `saga_state` table — single source of truth for the payment state machine

**Why Saga over 2PC**:
- No distributed lock holds — each service commits locally and emits an event
- Latency compatible with the 2-second authorization SLO
- Compatible with Kafka exactly-once semantics (per [ADR-003](ADR-003-event-driven-payment-processing.md))
- Failure modes are explicit and handled in code; no hidden lock timeouts

---

## Consequences

**Positive**:
- No distributed locks; each service commits locally — compatible with 2-second SLO
- Explicit failure handling via compensation events
- Saga state visible in `payment_db.saga_state` table — auditable
- EOS Kafka + idempotent consumers prevent duplicate event processing

**Negative**:
- Eventual consistency: brief window between authorization and ledger write where data is inconsistent
- Compensation logic must be implemented and tested in every participating service
- Debugging failed sagas requires correlation ID tracing across multiple services
- Risk of compensation failures (compensating transaction itself fails) — must be handled with DLQ and manual resolution runbook

---

## Compensating Transactions

| Step | Action | Compensation |
|------|--------|-------------|
| payment.submitted | Create payment record | Delete payment record (if next step fails immediately) |
| authorization.completed | Auth code from card network | Reverse authorization via AuthorizationService.ReverseAuthorization |
| ledger.entry.posted | Oracle debit/credit | Reverse via LedgerService.ReverseLedgerEntry |

**Compensation ordering**: Compensations execute in reverse order of the forward saga steps.

---

## Alternatives Considered

**2-Phase Commit (rejected)**: Requires distributed lock across Oracle + PostgreSQL; incompatible with 2-second SLO; 2PC coordinator is a single point of failure.

**Outbox Pattern with dedicated Saga Orchestrator (deferred)**: More robust for complex sagas; may be introduced for future multi-step payment flows (installment payments, multi-currency). Current payment flow is linear enough that choreography is sufficient.
