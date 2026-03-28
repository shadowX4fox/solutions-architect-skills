[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Payment Service

# Payment Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Payment Orchestration — Saga coordinator for the end-to-end payment lifecycle

**Technology**: Java 17, Spring Boot 3.2.x, Spring Data JPA, Resilience4j
**Team Owner**: Payments Team (Engineering Lead: Carlos Mendez)

**Purpose**:
Central orchestrator of the payment processing pipeline. Coordinates the synchronous critical path (Authorization → Fraud Detection → Ledger) and publishes events to drive the asynchronous settlement and notification pipeline. Implements the payment Saga pattern per [ADR-005](../../adr/ADR-005-saga-pattern-distributed-transactions.md) with compensation on failure.

**Responsibilities**:
- Validate incoming payment requests; generate idempotency keys
- Orchestrate the synchronous payment critical path (Auth → Fraud → Ledger)
- Manage payment state machine (PENDING → AUTHORIZED → FRAUD_HOLD → CONFIRMED / DECLINED / CANCELLED)
- Publish payment lifecycle events to Kafka `payment.events` topic
- Implement Saga compensation (reversal events) on partial failure
- Expose endpoints for operations team (approve/reject fraud holds)

---

## API Specification

**API Type**: REST (external via API Gateway) + gRPC (internal from API Gateway)

**Base URL**: `/api/v1/payments`

**Authentication**: JWT (validated by API Gateway); mTLS for internal gRPC calls

**REST Endpoints**:

| Method | Path | Description | Auth | Status Codes |
|--------|------|-------------|------|--------------|
| POST | `/payments` | Initiate payment | JWT | 202, 400, 409 |
| GET | `/payments/{id}` | Get payment status | JWT | 200, 404 |
| GET | `/payments/{id}/events` | Get payment event history | JWT | 200, 404 |
| POST | `/payments/{id}/cancel` | Cancel pending payment | JWT | 200, 400, 404 |
| POST | `/internal/payments/{id}/approve` | Approve fraud hold (ops) | Ops role | 200, 400, 404 |
| POST | `/internal/payments/{id}/reject` | Reject fraud hold (ops) | Ops role | 200, 400, 404 |

**OpenAPI Spec**: `https://api.paystream.internal/docs/payment-service/v1`

---

## Data Management

**Database Type**: PostgreSQL 15.4 (AWS RDS Multi-AZ)
**Database Name**: `payment_db`

**Tables**:
- `payments`: (id UUID PK, idempotency_key VARCHAR UNIQUE, customer_id UUID, partner_id UUID, amount DECIMAL, currency VARCHAR, status VARCHAR, auth_code VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)
- `payment_events`: (id UUID PK, payment_id UUID FK, event_type VARCHAR, event_payload JSONB, occurred_at TIMESTAMP)
- `saga_state`: (payment_id UUID PK, current_step VARCHAR, compensation_needed BOOLEAN, step_results JSONB, updated_at TIMESTAMP)

**Data Ownership**: Source of truth for payment records, status, and Saga state

**Data Access Patterns**:
- Insert payment record on new request (high frequency)
- Update payment status on state transitions
- Idempotency key lookup (Redis cache first, DB fallback)

**Consistency Model**: Strong consistency for payment creates; optimistic locking on status updates

---

## Event-Driven Communication

**Events Published**:

| Event Name | Trigger | Payload | Topic |
|------------|---------|---------|-------|
| `payment.submitted` | Payment request received | payment_id, amount, currency, customer_id | `payment.events` |
| `payment.authorized` | Authorization approved | payment_id, auth_code | `payment.events` |
| `payment.confirmed` | Ledger entry confirmed | payment_id, amount, ledger_entry_id | `payment.events` |
| `payment.declined` | Authorization declined or fraud rejected | payment_id, reason_code | `payment.events` |
| `payment.held` | Fraud hold applied | payment_id, risk_score | `payment.events` |
| `payment.cancelled` | Payment cancelled + compensation needed | payment_id, cancellation_reason | `payment.events` |

**Events Consumed**:

| Event Name | Source | Action | Idempotency |
|------------|--------|--------|-------------|
| `fraud.review.completed` | Fraud Detection Service | Approve/reject held transaction | `eventId` |

**Dead Letter Queue**: `payment-service-dlq`; consumed events retried 3× then moved to DLQ

---

## Service Dependencies

**Synchronous Dependencies** (critical path):
- Authorization Service: `AuthorizePayment` gRPC — timeout 850ms, no retry (fail-fast to DECLINED)
- Fraud Detection Service: `ScoreTransaction` gRPC — timeout 550ms, no retry (fail-fast to HOLD or DECLINED)
- Ledger Service: `DebitCredit` gRPC — timeout 350ms, 1 retry (ledger failure is exceptional)

**Asynchronous Dependencies**:
- Fraud Detection Service: `fraud.review.completed` events (fraud hold resolution)

**Circuit Breaker** (Resilience4j):
- Auth Service: threshold 50% over 10 requests; open 30s; fallback → DECLINED
- Fraud Detection: threshold 50% over 10 requests; open 30s; fallback → proceed with HIGH risk logging
- Ledger Service: threshold 3 consecutive failures; open 30s; fallback → payment held (not lost)

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/payment-service:<version>`

**Resource Requirements**:
- CPU: Requests 500m, Limits 2000m
- Memory: Requests 1Gi, Limits 2Gi

**Replicas**: Min 3, Max 20 (HPA CPU 70% — see [Scalability](../08-scalability-and-performance.md))

**Deployment Strategy**: Rolling update (max unavailable: 0, max surge: 1)

**Health Checks**:
- Liveness: `GET /health/liveness` every 30s
- Readiness: `GET /health/readiness` every 10s (checks DB + Redis connectivity)

---

## Security

**Authentication**: JWT validated by API Gateway; Istio mTLS for internal service calls

**Authorization**: RBAC — customers access own payments only; operations role required for approve/reject

**Secrets Management**: AWS Secrets Manager (IRSA) — DB credentials, Kafka credentials

**Encryption**:
- In-transit: mTLS (TLS 1.3) via Istio
- At-rest: RDS AES-256 (AWS KMS CMK)

**PCI-DSS Scope**: OUT OF SCOPE (handles tokenized payment references, not raw card data)

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `paymentId`, `transactionStatus`, `durationMs`, `sagaStep`

**Metrics**:
- `payment_requests_total` (counter, labels: status)
- `payment_duration_seconds` (histogram — end-to-end critical path, p50/p95/p99)
- `payment_saga_steps_total` (counter, labels: step, result)
- `payment_compensation_total` (counter — saga compensations triggered)

**Alerts**:
- Payment P99 > 1,800ms → P2 alert (approaching 2s SLO from [Key Metrics](../01-system-overview.md#key-metrics))
- Payment error rate > 5% → P1 alert
- Saga compensation rate > 2% → P2 alert (unusual failure rate)
