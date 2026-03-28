# Data Flow Patterns (S6)

## 6.1 Checkout Flow (Customer Payment)

The primary checkout flow handles customer-initiated payments end-to-end.

```
Customer App
    │
    ▼
API Gateway (auth + rate-limit)
    │
    ▼
Payment Orchestrator Service
    │
    ├── [1] Validate request → Validation Service
    │       Returns: valid/invalid + fraud score
    │
    ├── [2] Tokenize card → VGS Vault (external)
    │       Returns: payment token (PAN never stored)
    │
    ├── [3] Reserve funds → Authorization Service
    │       Calls: Card Network (Visa/MC) → acquirer bank
    │       Returns: auth_code or decline_reason
    │
    ├── [4] Publish event → Kafka topic: payment.authorized
    │       Consumers: Ledger Service, Fraud ML Service, Notification Service
    │
    ├── [5] Write ledger entry → Oracle DB (via Ledger Service)
    │       Guarantees: exactly-once with idempotency key
    │
    └── [6] Return confirmation to customer
            P99 target: ≤ 2 seconds total
```

**Error handling:**
- Authorization declined → return decline reason, no Kafka event
- VGS timeout → retry 3× with exponential backoff, then fail
- Kafka publish failure → transaction rolled back (outbox pattern)
- Ledger write failure → compensating transaction via saga

## 6.2 Partner Bulk Payment Flow

Business partners submit batch files via REST API.

```
Partner API Client
    │  POST /v1/batch-payments
    ▼
API Gateway
    │
    ▼
Batch Ingestion Service
    ├── Validates file format (ISO 20022)
    ├── Splits into individual payment tasks
    └── Publishes to Kafka: payment.batch.item (per payment)

Kafka Consumers (parallel, 20 partitions):
    └── Payment Orchestrator (same flow as checkout, steps 2–5)
        └── On complete: POST webhook to partner callback URL
```

**Throughput**: 500,000 payments/day = ~6 TPS average, burst to 100 TPS

## 6.3 Fraud Hold Flow

When fraud ML service scores a transaction > 0.8 risk threshold:

```
Fraud ML Service (async consumer of payment.authorized)
    │  score > 0.8
    ▼
Publishes: payment.fraud.flagged
    │
    ├── Risk Review Service → creates manual review task
    ├── Notification Service → alerts operations team
    └── Payment Orchestrator → places hold on settlement
        (payment authorized but settlement delayed 24h pending review)
```
