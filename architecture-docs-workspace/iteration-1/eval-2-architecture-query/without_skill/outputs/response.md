# PayStream Checkout Flow — Step-by-Step Explanation

## Overview

PayStream is a cloud-native, event-driven payment processing platform built on AWS with a Kafka event bus. The checkout flow is the platform's primary use case: real-time payment authorization initiated by a customer. The entire end-to-end flow is designed to complete within a P99 latency of 2 seconds.

---

## Step-by-Step Checkout Flow

### Step 0 — Customer Initiates Payment

The customer submits payment details (card number, amount, merchant) from a client application (mobile app, web frontend, or partner-integrated checkout). The request is sent over HTTPS to PayStream's entry point.

---

### Step 1 — API Gateway: Authentication and Rate Limiting

The request first hits the **API Gateway**, which enforces:
- **Authentication**: validates the caller's identity (OAuth token, API key, or session token).
- **Rate limiting**: prevents abuse and protects downstream services from traffic spikes.

If the request passes these controls, it is forwarded to the Payment Orchestrator Service. If not, the gateway returns a `401 Unauthorized` or `429 Too Many Requests` response immediately, and processing stops here.

---

### Step 2 — Payment Orchestrator: Request Validation (Sub-step 1)

The **Payment Orchestrator Service** is the central coordinator for the entire checkout flow. It receives the validated request and immediately invokes the **Validation Service**:

- Checks that all required fields are present and well-formed (amount, currency, card data, merchant ID, etc.).
- Computes a **fraud score** using rules-based checks (velocity, geography, merchant risk, etc.).

**Outcome:**
- Returns `valid` or `invalid`, plus a fraud score.
- If `invalid`, the orchestrator returns an error response to the customer immediately — no further processing occurs.

---

### Step 3 — Card Tokenization via VGS Vault (Sub-step 2)

To maintain PCI-DSS Level 1 compliance, the **raw card PAN (Primary Account Number) is never stored in PayStream's own systems**. Instead, the orchestrator sends card data to **VGS Vault** (Very Good Security), an external vault service:

- VGS replaces the sensitive card number with a **payment token**.
- All subsequent processing uses this token — PayStream never handles or persists raw card data.

**Error handling:** If VGS times out, the orchestrator retries up to **3 times with exponential backoff**. If all retries fail, the transaction is aborted and the customer receives a failure response.

---

### Step 4 — Funds Authorization via Card Network (Sub-step 3)

Using the payment token, the **Authorization Service** initiates a real-time authorization request through the card network:

- The request flows to **Visa or Mastercard** (depending on the card), then onward to the **customer's issuing/acquirer bank**.
- The bank evaluates available funds, credit limits, and account standing.

**Outcome:**
- **Approved**: returns an `auth_code` — the funds are reserved (not yet captured) against the customer's account.
- **Declined**: returns a `decline_reason` (e.g., insufficient funds, suspected fraud, expired card).

**If declined:** The orchestrator immediately returns the decline reason to the customer. No Kafka event is published, and no ledger entry is written — processing stops here.

---

### Step 5 — Event Publication to Kafka (Sub-step 4)

On a successful authorization, the orchestrator publishes a `payment.authorized` event to the **Kafka** event bus. This event is consumed asynchronously and in parallel by three downstream services:

| Consumer | Action |
|---|---|
| **Ledger Service** | Writes the authoritative financial ledger entry |
| **Fraud ML Service** | Runs the ML-based fraud risk scoring model (async) |
| **Notification Service** | Triggers customer-facing and internal notifications |

**Reliability guarantee:** Kafka publishing uses the **Outbox Pattern** — the event is first written to a transactional outbox table atomically with the authorization result. If the Kafka publish fails, the entire transaction is rolled back, ensuring no orphaned authorization records exist.

---

### Step 6 — Ledger Entry Write (Sub-step 5)

The **Ledger Service** (a Kafka consumer from Step 5) writes the authoritative financial record to **Oracle DB**:

- The write uses an **idempotency key** to guarantee **exactly-once semantics** — duplicate events or retries cannot produce duplicate ledger entries.
- The ledger record captures: transaction ID, amount, currency, merchant, authorization code, timestamp, and payment token reference.

**Error handling:** If the ledger write fails, a **compensating transaction via the Saga pattern** is triggered to reverse any side effects (e.g., notifying the card network to void the authorization).

---

### Step 7 — Confirmation Returned to Customer (Sub-step 6)

Once the authorization is confirmed and the Kafka event is published, the **Payment Orchestrator returns a success confirmation** to the customer application. This includes:

- Transaction ID
- Authorization code
- Confirmation status

The total elapsed time for Steps 1–7 must meet the **P99 target of 2 seconds or less**.

---

### Step 8 — Async Fraud ML Review (Post-Authorization)

In parallel, after the `payment.authorized` event is published, the **Fraud ML Service** performs a deeper machine-learning-based risk assessment:

- If the ML model scores the transaction at a **risk score > 0.8**, the service publishes a `payment.fraud.flagged` event.
- This triggers the **Fraud Hold Flow**:
  - **Risk Review Service** creates a manual review task for the operations team.
  - **Notification Service** alerts the operations team.
  - **Payment Orchestrator** places a **hold on settlement** — the payment has been authorized (customer sees it as pending), but settlement is delayed **up to 24 hours** pending human review.

Note: this fraud hold happens asynchronously and does not affect the 2-second confirmation already returned to the customer.

---

## End-to-End Flow Summary

```
Customer App
    |
    v
[API Gateway] — auth + rate-limit
    |
    v
[Payment Orchestrator Service]
    |
    |-- [1] Validation Service → valid/invalid + fraud score
    |-- [2] VGS Vault (external) → payment token (PAN never stored)
    |-- [3] Authorization Service → Card Network (Visa/MC) → Acquirer Bank
    |            auth_code  OR  decline_reason
    |-- [4] Kafka: publish payment.authorized
    |            → Ledger Service (write Oracle DB, exactly-once)
    |            → Fraud ML Service (async risk scoring)
    |            → Notification Service (customer + ops alerts)
    |-- [5] Ledger write confirmed (idempotency key, saga on failure)
    |
    v
[Return confirmation to customer] — P99 ≤ 2 seconds
```

---

## Error Handling Reference

| Failure Point | Behavior |
|---|---|
| Validation fails | Return error immediately, no further processing |
| Authorization declined | Return decline reason, no Kafka event, no ledger write |
| VGS timeout | Retry 3x with exponential backoff, then fail the transaction |
| Kafka publish failure | Transaction rolled back via Outbox Pattern |
| Ledger write failure | Compensating transaction triggered via Saga Pattern |
| Fraud ML score > 0.8 (async) | Settlement placed on 24h hold pending manual review |

---

## Key Design Decisions

- **PCI-DSS Level 1 compliance** is enforced by never storing raw card data — VGS Vault handles all sensitive card tokenization.
- **Exactly-once ledger writes** are guaranteed via idempotency keys on Oracle DB.
- **Saga pattern** ensures distributed consistency across authorization and ledger steps without a two-phase commit.
- **Outbox pattern** ensures Kafka events are never published without a committed authorization record.
- **Async fraud ML** keeps the critical path (2-second SLO) clean while still enabling post-authorization fraud review.
