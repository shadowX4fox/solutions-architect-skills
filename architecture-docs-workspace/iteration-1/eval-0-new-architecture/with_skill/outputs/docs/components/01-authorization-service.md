[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Authorization Service

# Authorization Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Payment Authorization — real-time card authorization with external card networks

**Technology**: Java 17, Spring Boot 3.2.x, Spring Security
**Team Owner**: Payments Team (Engineering Lead: Carlos Mendez)

**Purpose**:
Handles all card authorization requests on the synchronous critical path. Submits authorization requests to Visa/Mastercard networks via their respective APIs, receives approve/decline responses, and returns results to the Payment Service within the 800ms budget allocated in the [timing budget](../04-data-flow-patterns.md#timing-budget).

**Responsibilities**:
- Submit card authorization requests to card networks (Visa VisaNet API, Mastercard Connect API)
- Validate card token/reference (PAN never stored — tokenized upstream)
- Return authorization result (approved/declined + auth code) to Payment Service
- Log authorization events to the immutable audit trail
- Manage HSM-signed cryptographic credentials for card network mTLS

---

## API Specification

**API Type**: gRPC (internal) + REST (health/admin)

**Base URL (gRPC)**: `authorization-service.payments.svc.cluster.local:9090`

**Authentication**: mTLS (Istio service mesh — only Payment Service is authorized to call)

**gRPC Methods**:

| Method | Description | Request | Response | Timeout |
|--------|-------------|---------|----------|---------|
| `AuthorizePayment` | Authorize a card payment | `AuthorizationRequest` | `AuthorizationResult` | 800ms |
| `ReverseAuthorization` | Reverse a previous authorization | `ReversalRequest` | `ReversalResult` | 500ms |

**REST Endpoints** (health only):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/liveness` | Kubernetes liveness probe |
| GET | `/health/readiness` | Kubernetes readiness probe |

---

## Data Management

**Database Type**: PostgreSQL 15.4 (AWS RDS Multi-AZ)
**Database Name**: `auth_db`

**Tables**:
- `authorization_records`: (id UUID PK, transaction_id UUID, card_token VARCHAR, network VARCHAR, auth_code VARCHAR, status VARCHAR, network_response_code VARCHAR, authorized_at TIMESTAMP)
- `idempotency_keys`: (key VARCHAR PK, transaction_id UUID, result JSONB, created_at TIMESTAMP, expires_at TIMESTAMP)

**Data Ownership**: Source of truth for authorization records and idempotency key cache

**Data Access Patterns**:
- Write: Single authorization record per transaction (high frequency, insert-only)
- Read: Lookup by `transaction_id` for reversal workflows

**Consistency Model**: Strong consistency (ACID) — each authorization is a single DB write

**PCI-DSS Note**: PAN and CVV are never stored. Only card tokens and authorization codes are persisted.

---

## Event-Driven Communication

**Events Published**:

| Event Name | Trigger | Payload | Topic | Consumers |
|------------|---------|---------|-------|-----------|
| `authorization.completed` | Authorization response received | transaction_id, auth_code, status, network | `payment.events` | Payment Service |
| `authorization.reversed` | Reversal completed | transaction_id, reversal_code | `payment.events` | Payment Service |

**Events Consumed**: None (Authorization Service is a synchronous responder only)

**Dead Letter Queue**: N/A (synchronous service — no Kafka consumption)

---

## Service Dependencies

**Synchronous Dependencies**:
- **Visa VisaNet API** (external): Card authorization — 800ms budget; single retry on timeout
- **Mastercard Connect API** (external): Card authorization — 800ms budget; single retry on timeout
- **AWS CloudHSM**: Cryptographic signing for card network mTLS — <10ms

**Asynchronous Dependencies**: None

**External Dependencies**:
- Visa VisaNet API: SLA 99.99%; timeout 600ms; single retry
- Mastercard Connect API: SLA 99.99%; timeout 600ms; single retry

**Circuit Breaker Configuration** (Istio + Resilience4j):
- Failure threshold: 3 consecutive failures
- Open duration: 30 seconds
- Fallback: Return `DECLINED` (safer than unknown state)
- **Note**: Circuit breaker does NOT open on card network — each declined request is a valid response. Opens only on network connectivity failure.

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/authorization-service:<version>`

**Resource Requirements**:
- CPU: Requests 500m, Limits 2000m
- Memory: Requests 512Mi, Limits 1Gi

**Replicas**: Min 3, Max 20 (HPA on CPU 70% — see [Scalability](../08-scalability-and-performance.md#horizontal-pod-autoscaler-hpa))

**Deployment Strategy**: Rolling update (max unavailable: 0, max surge: 1)

**Health Checks**:
- Liveness: `GET /health/liveness` every 30s, failure threshold 3
- Readiness: `GET /health/readiness` every 10s, failure threshold 1

---

## Security

**Authentication**: mTLS via Istio — only Payment Service ServiceAccount is authorized

**Authorization**: Istio AuthorizationPolicy limits inbound to `payment-service` ServiceAccount

**Secrets Management**: AWS Secrets Manager (IRSA) — card network credentials, CloudHSM partition credentials

**Encryption**:
- In-transit: mTLS (TLS 1.3) via Istio
- At-rest: RDS encryption AES-256 (AWS KMS CMK)
- Cryptographic operations: AWS CloudHSM (PKCS#11)

**PCI-DSS Scope**: IN SCOPE (CDE) — handles card network communication

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `transactionId`, `network`, `authStatus`, `durationMs`

**Metrics**:
- `authorization_requests_total` (counter, labels: network, status)
- `authorization_duration_seconds` (histogram, p50/p95/p99)
- `card_network_errors_total` (counter, labels: network, error_type)

**Distributed Tracing**: OpenTelemetry SDK → AWS X-Ray; trace context propagated from Payment Service

**Alerts**:
- Authorization P99 > 700ms → Slack warning (approaching 800ms budget)
- Card network error rate > 2% → P2 PagerDuty
- 0 healthy replicas → P1 PagerDuty immediate
