[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Notification Service

# Notification Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Customer Notifications — real-time push/email/SMS notifications to end customers

**Technology**: Node.js 20, NestJS 10.x
**Team Owner**: Integration Team

**Purpose**:
Delivers real-time notifications to end customers (mobile push, email, SMS) in response to payment lifecycle events. Consumes events from Kafka and dispatches notifications via third-party notification providers. Provides best-effort delivery — notifications are informational and do not affect payment state.

**Responsibilities**:
- Consume payment and fraud events from Kafka
- Look up customer notification preferences (channel: push/email/SMS)
- Dispatch notifications via appropriate provider (Firebase FCM for push, AWS SES for email, AWS SNS for SMS)
- Track notification delivery status (best-effort; failures logged but do not trigger alerts)

---

## API Specification

**API Type**: Event-driven (Kafka consumption only); no REST endpoints exposed externally

**Admin REST Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/internal/notifications/retry/{eventId}` | Manually retry failed notification |

---

## Data Management

**Type**: Redis (AWS ElastiCache) — notification deduplication and customer preference cache

**Keys**:
- `notif:dedup:{eventId}:{customerId}` → delivered status (TTL 24h)
- `notif:prefs:{customerId}` → customer notification channel preferences (TTL 1h; source of truth in customer profile DB)

---

## Event-Driven Communication

**Events Consumed**:

| Event Name | Source | Notification Sent |
|------------|--------|-----------------|
| `payment.confirmed` | Payment Service | "Payment of $X confirmed" |
| `payment.declined` | Payment Service | "Payment of $X was declined" |
| `payment.held` | Fraud Detection (via `fraud.alerts`) | "Payment under review" |
| `fraud.review.completed` | Fraud Detection | "Payment approved/rejected by review" |

**Events Published**: None (notifications are fire-and-forget; delivery status to `audit.trail` only)

**Consumer Group**: `notification-consumer`; KEDA HPA on MSK consumer lag > 500

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/notification-service:<version>`

**Resource Requirements**:
- CPU: Requests 250m, Limits 1000m
- Memory: Requests 256Mi, Limits 512Mi

**Replicas**: Min 2, Max 8 (KEDA: MSK consumer lag > 500)

**Deployment Strategy**: Rolling update

---

## External Provider Dependencies

| Provider | Channel | Failure Handling |
|---------|---------|-----------------|
| Firebase FCM | Push notifications | Best-effort; log failure, no retry |
| AWS SES | Email | Best-effort; log failure, no retry |
| AWS SNS | SMS | Best-effort; log failure, no retry |

**Note**: Notification delivery failure does NOT affect payment state. Customers can always check payment status via the app.

---

## Security

**Authentication**: Istio mTLS (internal only)

**Secrets Management**: AWS Secrets Manager — FCM service account key, SES credentials

**PCI-DSS Scope**: OUT OF SCOPE

---

## Observability

**Metrics**:
- `notifications_sent_total` (counter, labels: channel, event_type, status)
- `notification_duration_seconds` (histogram)

**Alerts**: No P1/P2 alerts (best-effort service); Slack warning if delivery error rate > 20% for 30 minutes
