[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Webhook Delivery Service

# Webhook Delivery Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Outbound Partner Notification — reliable webhook delivery to banking partners

**Technology**: Node.js 20, NestJS 10.x
**Team Owner**: Integration Team

**Purpose**:
Consumes payment and settlement events from Kafka and delivers HTTPS webhook callbacks to banking partners at their configured webhook URLs. Provides at-least-once delivery guarantees with retry and exponential backoff. Tracks delivery state per event per partner; routes undeliverable events to DLQ.

**Responsibilities**:
- Consume relevant events from `webhook.dispatch` Kafka topic
- Look up partner webhook configuration (URL, signing secret)
- Sign webhook payload with HMAC-SHA256 per-partner secret
- POST to partner webhook URL with retry (3 attempts, exponential backoff)
- Track delivery state per event
- Route failed deliveries to DLQ after exhausting retries; alert operations

---

## API Specification

**API Type**: Internal REST (admin/monitoring only); primary interface is Kafka consumption

**Base URL**: `/internal/webhooks`

**Authentication**: Istio mTLS (internal only)

**Admin REST Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/internal/webhooks/deliveries/{eventId}` | Query delivery status for event |
| POST | `/internal/webhooks/retry/{eventId}` | Manually retry failed delivery |
| GET | `/internal/webhooks/dlq` | List events in DLQ |

---

## Data Management

**Type**: Redis (AWS ElastiCache) — delivery state cache

**Keys**:
- `webhook:delivery:{eventId}:{partnerId}` → delivery status, attempt count, last error (TTL 7 days)
- `webhook:dlq:{eventId}` → DLQ entry metadata (TTL 30 days)

**No relational DB** — delivery state is ephemeral; S3 audit trail captures final state via Kafka `audit.trail` topic

---

## Event-Driven Communication

**Events Consumed**:

| Event Name | Source | Action | Idempotency |
|------------|--------|--------|-------------|
| `payment.completed` | Payment Service (via `webhook.dispatch`) | Deliver webhook to partner | `eventId` dedup in Redis |
| `payment.declined` | Payment Service (via `webhook.dispatch`) | Deliver webhook to partner | `eventId` dedup in Redis |
| `payment.held` | Payment Service (via `webhook.dispatch`) | Deliver webhook to partner | `eventId` dedup in Redis |
| `settlement.completed` | Settlement Service (via `webhook.dispatch`) | Deliver settlement notification | `eventId` dedup in Redis |

**Events Published**:

| Event Name | Trigger | Topic |
|------------|---------|-------|
| `webhook.delivered` | Successful delivery | `audit.trail` |
| `webhook.failed` | All retries exhausted | `audit.trail` + `webhook.dlq` |

**Consumer Group**: `webhook-delivery-consumer`; KEDA HPA triggers on MSK consumer lag > 1,000

---

## Webhook Delivery Protocol

- **Method**: HTTPS POST
- **Content-Type**: `application/json`
- **Signature Header**: `X-PayStream-Signature: sha256=<HMAC-SHA256 hex>`
- **Signature computation**: HMAC-SHA256 of raw request body using per-partner signing secret from AWS Secrets Manager
- **Retry policy**: 3 attempts with 30s, 60s, 120s backoff
- **Timeout per attempt**: 10 seconds
- **Success criteria**: HTTP 2xx response from partner

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/webhook-delivery-service:<version>`

**Resource Requirements**:
- CPU: Requests 250m, Limits 1000m
- Memory: Requests 256Mi, Limits 512Mi

**Replicas**: Min 2, Max 10 (KEDA: MSK consumer lag > 1,000 events — see [Scalability](../08-scalability-and-performance.md))

---

## Security

**Outbound security**: HMAC-SHA256 signature on all webhooks; partner validates signature

**Secrets Management**: AWS Secrets Manager — per-partner webhook signing secrets

**Encryption**: mTLS (TLS 1.3) internal; outbound HTTPS TLS 1.3 to partner endpoints

---

## Observability

**Metrics**:
- `webhook_deliveries_total` (counter, labels: partner_id, status)
- `webhook_delivery_duration_seconds` (histogram)
- `webhook_retry_attempts_total` (counter, labels: partner_id)
- `webhook_dlq_total` (counter, labels: partner_id)

**Alerts**:
- Webhook DLQ entries > 0 for a partner → P2 Slack alert
- Webhook delivery P95 > 5s → Warning
- Consumer lag > 5,000 → P2 alert
