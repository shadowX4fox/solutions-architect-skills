# Section 5 — Data Flow Patterns

## 5.1 Consumer Payment Flow (Happy Path)

The primary flow for a consumer initiating a card payment via mobile or web.

```mermaid
sequenceDiagram
    participant Customer
    participant APIGW as API Gateway
    participant PS as Payment Processor
    participant TS as Tokenisation Service
    participant FD as Fraud Detection
    participant Kafka as Kafka (payment.events)
    participant LS as Ledger Service
    participant NS as Notification Service
    participant Oracle as Oracle DB

    Customer->>APIGW: POST /payments (PAN + amount + idempotency-key)
    APIGW->>APIGW: Validate JWT, rate limit check
    APIGW->>PS: Forward payment request (PAN removed from logs)
    PS->>PS: Check idempotency key in DynamoDB
    PS->>TS: gRPC tokenise(PAN)
    TS-->>PS: token
    PS->>FD: POST /score (token + context)
    FD-->>PS: score = 0.12 (ALLOW)
    PS->>PS: Write PaymentRecord + OutboxEvent to Aurora (single TX)
    PS-->>APIGW: 200 OK { payment_id, status: AUTHORIZED }
    APIGW-->>Customer: 200 OK { payment_id, status: AUTHORIZED }

    Note over PS,Kafka: CDC relay (Debezium) reads outbox

    PS->>Kafka: PaymentAuthorized event
    Kafka->>LS: Consume PaymentAuthorized
    LS->>Oracle: Write debit + credit entries (single TX)
    LS->>Kafka: LedgerEntryCreated event
    Kafka->>NS: Consume LedgerEntryCreated
    NS->>Customer: Push notification "Payment confirmed"
```

**End-to-end latency budget**:

| Segment | Budget |
|---------|--------|
| API Gateway (auth + routing) | 50 ms |
| Payment Processor (validation + idempotency check) | 100 ms |
| Tokenisation Service (gRPC) | 10 ms |
| Fraud Detection (inline score) | 200 ms |
| Aurora write (payment record + outbox) | 50 ms |
| API response to customer | ≤ 410 ms subtotal |
| Kafka CDC relay + Ledger write (async) | ≤ 1.5 s async |
| **Total customer-visible P99** | **≤ 2 s** |

---

## 5.2 Fraud Hold Flow

Triggered when the Fraud Detection Service scores a transaction above the hold threshold.

```mermaid
sequenceDiagram
    participant PS as Payment Processor
    participant FD as Fraud Detection
    participant Kafka as Kafka
    participant LS as Ledger Service
    participant NS as Notification Service
    participant OPS as Operations Dashboard

    PS->>FD: POST /score (transaction context)
    FD-->>PS: score = 0.87 (HOLD)
    PS->>PS: Write PaymentRecord (status=HOLD) + OutboxEvent
    PS-->>Customer: 200 OK { payment_id, status: UNDER_REVIEW }
    PS->>Kafka: FraudHoldApplied event
    Kafka->>LS: Consume FraudHoldApplied → write hold entry to Oracle
    Kafka->>NS: Consume FraudHoldApplied → notify customer "Payment under review"
    Kafka->>OPS: SQS FIFO → ops task created for manual review
    OPS->>OPS: Analyst reviews → APPROVE or REJECT
    OPS->>Kafka: ManualReviewDecision event
    Kafka->>LS: Update ledger entry to SETTLED or REVERSED
    Kafka->>NS: Notify customer of final outcome
```

---

## 5.3 Partner Bulk Processing Flow

```mermaid
sequenceDiagram
    participant Partner
    participant APIGW as API Gateway
    participant BIS as Bulk Ingest Service
    participant S3
    participant Kafka
    participant PS as Payment Processor
    participant WHS as Webhook Dispatcher

    Partner->>APIGW: POST /bulk-jobs (request pre-signed URL)
    APIGW->>BIS: CreateBulkJob
    BIS->>S3: Generate pre-signed PUT URL
    BIS-->>APIGW: { job_id, upload_url }
    APIGW-->>Partner: { job_id, upload_url }
    Partner->>S3: PUT bulk_payment_file.csv
    S3->>SQS: S3 Event Notification
    SQS->>BIS: Trigger processing
    BIS->>BIS: Validate file schema
    loop For each payment record
        BIS->>Kafka: PaymentRequested event (idempotency_key = job_id+index)
    end
    Kafka->>PS: Consume PaymentRequested (parallel)
    PS->>PS: Process each payment (tokenise + fraud check)
    PS->>Kafka: PaymentAuthorized / PaymentDeclined per record
    Kafka->>WHS: Consume results → queue webhook dispatches
    WHS->>Partner: POST /webhook { job_id, record_id, status }
    BIS->>BIS: Aggregate job completion (all records done)
    WHS->>Partner: POST /webhook { job_id, status: COMPLETE, summary }
```

---

## 5.4 End-of-Day Reconciliation Flow

```mermaid
sequenceDiagram
    participant CronJob as K8s CronJob (23:00 UTC)
    participant RS as Reconciliation Service
    participant Oracle as Oracle Read Replica
    participant SFTP as Partner Bank SFTP
    participant S3
    participant SES as Amazon SES
    participant OPS as Ops Team

    CronJob->>RS: Trigger reconciliation run
    RS->>Oracle: SELECT settled entries for date
    RS->>SFTP: Fetch bank settlement file
    RS->>RS: Compare PayStream totals vs bank totals
    RS->>S3: Save reconciliation report (CSV + PDF)
    alt Discrepancy found
        RS->>SES: Email ops team with discrepancy alert + S3 link
        OPS->>OPS: Investigate and resolve
    else No discrepancy
        RS->>SES: Email ops team "Reconciliation OK" + S3 link
    end
```

---

## 5.5 Event Schema (Kafka)

### `payment.events` — `PaymentAuthorized`

```json
{
  "event_type": "PaymentAuthorized",
  "event_id": "uuid-v4",
  "payment_id": "uuid-v4",
  "idempotency_key": "string",
  "token": "string (opaque card token)",
  "amount": { "value": "decimal", "currency": "ISO-4217" },
  "merchant_id": "string",
  "customer_id": "string (hashed, GDPR)",
  "timestamp": "ISO-8601",
  "schema_version": "1.0"
}
```

### `fraud.events` — `FraudHoldApplied`

```json
{
  "event_type": "FraudHoldApplied",
  "event_id": "uuid-v4",
  "payment_id": "uuid-v4",
  "fraud_score": "float [0.0–1.0]",
  "triggered_rules": ["string"],
  "timestamp": "ISO-8601",
  "schema_version": "1.0"
}
```

All events conform to a schema registry (AWS Glue Schema Registry with Avro). Producers must register and validate against the schema before publishing; consumers reject unregistered schema versions.
