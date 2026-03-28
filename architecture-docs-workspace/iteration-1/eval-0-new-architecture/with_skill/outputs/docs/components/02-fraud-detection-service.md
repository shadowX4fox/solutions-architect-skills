[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Fraud Detection Service

# Fraud Detection Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Transaction Risk Assessment — real-time fraud scoring and hold workflow

**Technology**: Python 3.12, FastAPI 0.111.x, scikit-learn / rule engine
**Team Owner**: Payments Team

**Purpose**:
Evaluates transaction risk in real-time on the payment critical path. Provides a two-tier approach: a lightweight rule engine (< 50ms) executes inline for high-confidence fraud patterns; ML model inference runs asynchronously for enrichment. Returns a risk score (LOW / MEDIUM / HIGH) to the Payment Service within the 500ms budget.

**Responsibilities**:
- Execute inline fraud rules (velocity checks, amount anomalies, known fraud lists, geographic anomalies)
- Return risk score (LOW / MEDIUM / HIGH) with reason codes to Payment Service
- Publish `fraud.alerts` events for HIGH-risk transactions (hold workflow trigger)
- Consume async ML inference results to enrich future scoring models
- Maintain fraud rule configuration (updated by operations team without code deployment)

---

## API Specification

**API Type**: gRPC (internal)

**Base URL (gRPC)**: `fraud-detection-service.payments.svc.cluster.local:9090`

**Authentication**: mTLS (Istio; only Payment Service is authorized to call)

**gRPC Methods**:

| Method | Description | Request | Response | Timeout |
|--------|-------------|---------|----------|---------|
| `ScoreTransaction` | Real-time risk score | `TransactionScoreRequest` | `RiskScoreResult` | 500ms |
| `UpdateFraudRules` | Reload fraud rule config (admin) | `RuleUpdateRequest` | `UpdateAck` | 5s |

**Risk Score Levels**:

| Score | Threshold | Payment Action |
|-------|-----------|---------------|
| LOW | Rule score < 30 | Proceed to authorization |
| MEDIUM | Rule score 30–70 | Proceed with enhanced logging |
| HIGH | Rule score > 70 | Hold transaction; trigger manual review |

---

## Data Management

**Database Type**: PostgreSQL 15.4 (AWS RDS Multi-AZ)
**Database Name**: `fraud_db`

**Tables**:
- `fraud_decisions`: (id UUID PK, transaction_id UUID, risk_score VARCHAR, rule_scores JSONB, reason_codes TEXT[], ml_score DECIMAL, decided_at TIMESTAMP)
- `fraud_rules`: (id UUID PK, rule_name VARCHAR, rule_definition JSONB, enabled BOOLEAN, updated_at TIMESTAMP)
- `blocked_entities`: (entity_type VARCHAR, entity_id VARCHAR, reason VARCHAR, blocked_at TIMESTAMP, PRIMARY KEY (entity_type, entity_id))
- `manual_reviews`: (id UUID PK, transaction_id UUID, decision VARCHAR, reviewer VARCHAR, decided_at TIMESTAMP)

**Data Ownership**: Source of truth for fraud decisions and fraud rule configuration

**Consistency Model**: Strong consistency for fraud decisions (ACID write on each score)

---

## Event-Driven Communication

**Events Published**:

| Event Name | Trigger | Payload | Topic | Consumers |
|------------|---------|---------|-------|-----------|
| `fraud.transaction.held` | HIGH risk score returned | transaction_id, risk_score, reason_codes | `fraud.alerts` | Payment Service, Notification Service, Ops Dashboard |
| `fraud.review.completed` | Manual review decided | transaction_id, decision, reviewer | `fraud.alerts` | Payment Service |

**Events Consumed**:

| Event Name | Source | Action | Idempotency |
|------------|--------|--------|-------------|
| `ml.score.result` | ML Inference Service (async, future) | Enrich fraud model feedback loop | `eventId` deduplication |

**Dead Letter Queue**: `fraud-service-dlq` Kafka topic; failed event processing retried 3× then routed to DLQ

---

## Service Dependencies

**Synchronous Dependencies**:
- None on critical path (Fraud Detection is a synchronous responder; calls come from Payment Service)

**Asynchronous Dependencies**:
- ML Inference Service (future): async enrichment via `ml.score.result` events

**External Dependencies**: None (all fraud rules are internal; external threat feeds consumed via async batch update)

**Circuit Breaker**: Not applicable (Fraud Detection is the called service; Payment Service has the circuit breaker on this dependency)

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/fraud-detection-service:<version>`

**Resource Requirements**:
- CPU: Requests 1000m, Limits 4000m (ML rule evaluation is CPU-intensive)
- Memory: Requests 1Gi, Limits 4Gi (rule engine + model in-process)

**Node affinity**: Prefer `r6i.large` nodes (memory-optimized for ML inference workloads)

**Replicas**: Min 2, Max 15 (HPA on CPU 70% and request rate 30 req/s/pod — see [Scalability](../08-scalability-and-performance.md#horizontal-pod-autoscaler-hpa))

**Deployment Strategy**: Rolling update (max unavailable: 0, max surge: 1)

**Health Checks**:
- Liveness: `GET /health/liveness` every 30s
- Readiness: `GET /health/readiness` every 10s (readiness checks rule engine loaded)

---

## Security

**Authentication**: mTLS via Istio; Istio AuthorizationPolicy limits callers to `payment-service` ServiceAccount

**Secrets Management**: AWS Secrets Manager — fraud DB credentials, rule engine encryption keys

**Encryption**:
- In-transit: mTLS (TLS 1.3) via Istio
- At-rest: RDS encryption AES-256

**PCI-DSS Scope**: OUT OF SCOPE (receives tokenized transaction data, not raw card data)

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `transactionId`, `riskScore`, `triggeredRules`, `durationMs`

**Metrics**:
- `fraud_score_duration_seconds` (histogram, p50/p95/p99)
- `fraud_decisions_total` (counter, labels: risk_level)
- `fraud_holds_total` (counter — HIGH risk transactions held)
- `fraud_rules_evaluated_total` (counter, labels: rule_name, triggered)

**Alerts**:
- Fraud hold rate > 5% over 10 minutes → Slack warning (potential fraud wave or rule misconfiguration)
- Fraud detection P99 > 400ms → Warning (approaching 500ms budget)
- 0 healthy replicas → P1 PagerDuty
