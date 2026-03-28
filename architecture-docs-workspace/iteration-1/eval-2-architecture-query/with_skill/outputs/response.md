# PayStream Checkout Flow — Step-by-Step Explanation

**Source sections consulted:**
- S1+S2 (Executive Summary & System Overview) — `docs/01-system-overview.md`
- S6 (Data Flow Patterns) — `docs/04-data-flow-patterns.md`

---

## Overview

PayStream is a cloud-native, event-driven real-time payment processing platform built on AWS. The checkout flow is the primary path by which a customer initiates a payment and receives confirmation. It is designed to complete end-to-end in under 2 seconds at P99.

---

## Step-by-Step: The Checkout Flow (Section 6.1)

When a customer makes a payment, the following sequence of steps occurs:

### Step 0 — Customer App Initiates Payment

The customer submits payment details (card number, amount, etc.) from the Customer App (mobile or web). The request is sent to the platform's API Gateway.

### Step 1 — API Gateway: Authentication and Rate Limiting

The API Gateway is the system's ingress point. It performs:
- **Authentication** — verifies the caller's identity/token
- **Rate limiting** — protects downstream services from abuse or overload

Once the request passes these checks, it is forwarded to the **Payment Orchestrator Service**.

### Step 2 — Validation (Validation Service)

The Payment Orchestrator sends the request to the **Validation Service**. This service performs:
- Input and business rule validation (e.g., required fields, amount limits)
- **Fraud scoring** — returns a fraud risk score alongside the valid/invalid result

If the request is invalid, the flow terminates here and returns an error to the customer.

### Step 3 — Card Tokenization (VGS Vault — External)

The Payment Orchestrator sends the raw card data (Primary Account Number, PAN) to **VGS Vault**, an external tokenization service. VGS returns a **payment token** in exchange.

> **Important security note:** The raw PAN is never stored in PayStream's systems. Only the token is retained and used downstream. This is a core PCI-DSS control.

### Step 4 — Authorization (Authorization Service → Card Networks → Acquirer Bank)

Using the payment token, the **Authorization Service** submits an authorization request to the card network (Visa or Mastercard), which routes it to the **acquirer bank**.

The bank responds with one of:
- `auth_code` — authorization approved, funds reserved
- `decline_reason` — authorization declined (insufficient funds, fraud block, etc.)

If the authorization is **declined**, the flow stops here. No Kafka event is published. The decline reason is returned directly to the customer.

### Step 5 — Event Publication (Kafka: `payment.authorized`)

On a successful authorization, the Payment Orchestrator publishes an event to the Kafka topic **`payment.authorized`**. Three downstream consumers react asynchronously:

| Consumer | What it does |
|---|---|
| **Ledger Service** | Writes the ledger entry (see Step 6) |
| **Fraud ML Service** | Runs advanced fraud ML scoring on the authorized payment |
| **Notification Service** | Sends payment confirmation notifications |

> **Reliability guarantee:** Kafka publish failure causes a full transaction rollback using the **outbox pattern**, ensuring no orphaned authorization exists without a corresponding event.

### Step 6 — Ledger Write (Ledger Service → Oracle DB)

The **Ledger Service**, triggered by the Kafka event, writes a permanent ledger entry to **Oracle DB**. This write is guaranteed **exactly-once** using an **idempotency key** — duplicate events (e.g., from retries) do not create duplicate ledger entries.

If the ledger write fails, a **compensating transaction** is executed via the **saga pattern** to reverse the authorization.

### Step 7 — Confirmation Returned to Customer

After authorization succeeds and all downstream processing is in motion, the Payment Orchestrator returns a payment confirmation to the customer.

**P99 target: ≤ 2 seconds total** (end-to-end, from customer request to confirmation).

---

## Error Handling Summary

| Failure Scenario | Behavior |
|---|---|
| Authorization declined | Return decline reason immediately; no Kafka event published |
| VGS timeout (tokenization) | Retry 3 times with exponential backoff, then fail the transaction |
| Kafka publish failure | Full transaction rollback using the outbox pattern |
| Ledger write failure | Compensating transaction via saga pattern |

---

## High-Level Flow Diagram

```
Customer App
    │
    ▼
API Gateway  (auth + rate-limit)
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

---

## Key Design Decisions Behind This Flow

1. **PAN never stored** — Tokenization via VGS is mandatory before any downstream processing. This is a PCI-DSS Level 1 requirement.
2. **Event-driven decoupling** — Ledger writes, fraud ML scoring, and notifications are all triggered via Kafka rather than synchronous calls, reducing P99 latency and improving fault isolation.
3. **Outbox pattern** — Ensures Kafka events are only published when a payment is truly authorized, preventing ghost events from failed transactions.
4. **Saga pattern for compensation** — If the ledger write fails after authorization, the system executes a compensating transaction to reverse the authorization cleanly, maintaining consistency without distributed transactions.
5. **Idempotency keys on ledger writes** — Protects against duplicate ledger entries caused by Kafka redelivery or consumer retries.
