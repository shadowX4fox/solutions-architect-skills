# Section 6: Data Flow Patterns

[Architecture](../ARCHITECTURE.md) > Data Flow Patterns

---

## Overview

PayStream has four primary data flow patterns, each with distinct latency profiles, consistency requirements, and failure modes. These patterns are derived from the use cases in the [System Overview](01-system-overview.md#use-cases) and constrained by [Key Metrics](01-system-overview.md#key-metrics).

---

## Flow 1: Real-Time Payment Authorization (Critical Path)

**Target Latency**: ≤ 2 seconds P99 (see [Key Metrics](01-system-overview.md#key-metrics))

**Trigger**: End customer initiates payment via mobile or web app.

**Participants**: Client → API Gateway → Payment Service → Authorization Service → Fraud Detection Service → Ledger Service → Card Network

### Sequence

```mermaid
sequenceDiagram
    participant C as Client (Mobile/Web)
    participant GW as API Gateway
    participant PS as Payment Service
    participant AS as Authorization Service
    participant FD as Fraud Detection Service
    participant LS as Ledger Service
    participant CN as Card Network
    participant MSK as Kafka (MSK)

    C->>GW: POST /payments (JWT auth)
    GW->>GW: Validate JWT, rate limit check
    GW->>PS: POST /internal/payments (mTLS)

    PS->>PS: Generate idempotency key, validate request
    PS->>AS: gRPC AuthorizePayment (mTLS)
    AS->>CN: HTTPS Authorization request
    CN-->>AS: Authorization response (approved/declined)
    AS-->>PS: AuthorizationResult

    alt Authorization Approved
        PS->>FD: gRPC ScoreTransaction (mTLS)
        FD-->>PS: RiskScore (low/medium/high)

        alt Risk Score = Low or Medium
            PS->>LS: gRPC DebitCredit (mTLS)
            LS->>LS: Begin Oracle transaction
            LS-->>PS: LedgerEntryConfirmed
            PS->>MSK: Publish payment.events (payment.completed)
            PS-->>GW: 200 OK {transactionId, status: CONFIRMED}
            GW-->>C: Payment confirmed (< 2s total)
        else Risk Score = High (Fraud Hold)
            PS->>MSK: Publish fraud.alerts (transaction.held)
            PS-->>GW: 200 OK {transactionId, status: PENDING_REVIEW}
            GW-->>C: Payment pending review
        end
    else Authorization Declined
        PS->>MSK: Publish payment.events (payment.declined)
        PS-->>GW: 200 OK {transactionId, status: DECLINED}
        GW-->>C: Payment declined
    end
```

### Timing Budget

| Step | Max Duration | Cumulative |
|------|-------------|------------|
| API Gateway (JWT validation, routing) | 50ms | 50ms |
| Payment Service (validation, idempotency) | 50ms | 100ms |
| Authorization Service + Card Network round-trip | 800ms | 900ms |
| Fraud Detection Service (risk scoring) | 500ms | 1,400ms |
| Ledger Service (Oracle transaction) | 300ms | 1,700ms |
| Response marshalling + network | 100ms | 1,800ms |
| **Buffer** | 200ms | **2,000ms** |

### Idempotency

- Client must send `X-Idempotency-Key` header (UUID v4)
- Payment Service checks key against Redis cache before processing
- Duplicate requests within 24 hours return the original response without re-processing

---

## Flow 2: Bulk Partner Payment Processing

**Target Latency**: Per-transaction status via webhook within 30 seconds of individual transaction processing

**Trigger**: Business partner submits bulk payment file via Partner Gateway API.

### Sequence

```mermaid
sequenceDiagram
    participant P as Banking Partner
    participant PG as Partner Gateway
    participant BP as Bulk File Processor
    participant MSK as Kafka (MSK)
    participant PS as Payment Service
    participant WH as Webhook Delivery Service

    P->>PG: POST /partner/bulk-payments (API Key auth)
    PG->>PG: Validate API key, parse file format
    PG-->>P: 202 Accepted {batchId}

    PG->>BP: Trigger file processing (async)
    BP->>BP: Split file into individual transactions
    loop For each transaction (parallel)
        BP->>MSK: Publish payment.events (payment.submitted)
    end

    MSK->>PS: Consume payment.submitted events
    PS->>PS: Process each payment (Flow 1 critical path)
    PS->>MSK: Publish payment.events (payment.completed / declined)

    MSK->>WH: Consume payment events
    WH->>WH: Look up partner webhook config
    WH->>P: POST partner webhook URL {transactionId, status}
    alt Webhook Delivery Failed
        WH->>WH: Retry with exponential backoff (3x)
        WH->>MSK: Publish to webhook.dlq if all retries exhausted
    end
```

### Parallelism

- Bulk file processor splits files into individual transaction events
- Payment Service consumer group scales horizontally — up to N consumers per Kafka partition
- Kafka topic `payment.events` partitioned by `partnerId` to preserve per-partner ordering while enabling parallel processing across partners

---

## Flow 3: Fraud Detection and Hold Workflow

**Target Latency**: Inline detection < 500ms; manual review notification < 5 seconds

**Trigger**: Fraud Detection Service assigns HIGH risk score during payment processing.

### Sequence

```mermaid
sequenceDiagram
    participant PS as Payment Service
    participant FD as Fraud Detection Service
    participant MSK as Kafka (MSK)
    participant NS as Notification Service
    participant OPS as Operations Dashboard

    PS->>FD: gRPC ScoreTransaction
    FD->>FD: Apply ML risk model + rule engine
    FD-->>PS: RiskScore = HIGH, reason codes

    PS->>PS: Set transaction status = PENDING_REVIEW
    PS->>MSK: Publish fraud.alerts (transaction.held)
    PS-->>Client: 200 OK {status: PENDING_REVIEW}

    MSK->>NS: Consume fraud.alerts
    NS->>Client: Push notification: "Payment under review"

    MSK->>OPS: Consume fraud.alerts
    OPS->>OPS: Add to manual review queue

    alt Operations approves
        OPS->>PS: POST /internal/payments/{id}/approve
        PS->>PS: Resume payment processing (Flow 1)
        PS->>MSK: Publish fraud.alerts (review.approved)
    else Operations rejects
        OPS->>PS: POST /internal/payments/{id}/reject
        PS->>MSK: Publish payment.events (payment.declined)
        NS->>Client: Push notification: "Payment declined"
    end
```

---

## Flow 4: End-of-Day Settlement and Reconciliation

**Target Latency**: Settlement report available within 30 minutes of EOD cutoff

**Trigger**: Scheduled job (cron) at EOD cutoff time per banking partner timezone.

### Sequence

```mermaid
sequenceDiagram
    participant SCHED as Scheduler (K8s CronJob)
    participant SS as Settlement Service
    participant LS as Ledger Service
    participant MSK as Kafka (MSK)
    participant RS as Reconciliation Service
    participant PG as Partner Gateway
    participant P as Banking Partners

    SCHED->>SS: Trigger EOD settlement run {partnerId, date}
    SS->>LS: gRPC GetLedgerPositions {partnerId, date}
    LS->>LS: Query Oracle ledger for net positions
    LS-->>SS: LedgerPositions {debits, credits, net}

    SS->>SS: Calculate settlement amounts per partner
    SS->>MSK: Publish settlement.events (settlement.calculated)

    MSK->>RS: Consume settlement.events
    RS->>RS: Cross-check event store vs ledger positions
    alt Reconciliation OK
        RS->>MSK: Publish settlement.events (reconciliation.complete)
        RS->>SS: Confirm settlement
        SS->>PG: Trigger settlement transfer
        PG->>P: POST settlement wire / SWIFT message
    else Reconciliation Gap Detected
        RS->>MSK: Publish settlement.events (reconciliation.gap)
        RS->>OPS: Alert operations team (PagerDuty)
    end

    SS->>SS: Generate settlement report (PDF + CSV)
    SS->>MSK: Publish settlement.events (report.generated)
```

---

## Data Consistency Strategy

| Scenario | Pattern | Implementation |
|----------|---------|----------------|
| Payment authorization + ledger debit | Saga (Choreography) | Payment Service publishes events; Ledger Service reacts |
| Bulk payment processing | Idempotent consumers | Each consumer deduplicates by event ID |
| Settlement calculation | Eventual consistency | Settlement Service reads from event store and ledger after payment events settle |
| Fraud hold → approve/reject | State machine | Payment Service owns FSM; transitions are atomic with event publish |

### Saga Compensation

Per [ADR-005](../adr/ADR-005-saga-pattern-distributed-transactions.md), if any step in the payment Saga fails after ledger debit, a compensating transaction is published:

- `payment.cancelled` → Ledger Service receives and posts credit reversal
- `payment.cancelled` → Notification Service sends cancellation message to customer
- All saga steps are logged to the audit trail

---

## Event Schema Conventions

All Kafka events follow a common envelope schema:

```json
{
  "eventId": "uuid-v4",
  "eventType": "payment.completed",
  "aggregateId": "transactionId",
  "aggregateType": "Payment",
  "occurredAt": "2026-03-26T14:32:00.000Z",
  "schemaVersion": "1.0",
  "payload": { ... }
}
```

- `eventId` is used for consumer-side idempotency deduplication
- `aggregateId` is the correlation ID propagated through all downstream events
- Schema versions are managed via AWS Glue Schema Registry
