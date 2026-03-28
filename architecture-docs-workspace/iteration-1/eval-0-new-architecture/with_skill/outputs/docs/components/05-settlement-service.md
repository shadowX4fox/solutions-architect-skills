[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Settlement Service

# Settlement Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Settlement Processing — EOD net position calculation and settlement initiation per banking partner

**Technology**: Java 17, Spring Boot 3.2.x
**Team Owner**: Payments Team

**Purpose**:
Calculates net settlement positions for each banking partner at end-of-day (EOD), coordinates with the Ledger Service for authoritative positions, and initiates settlement transfers via the Partner Gateway. Produces settlement reports (PDF + CSV) for compliance records.

**Responsibilities**:
- Triggered by Kubernetes CronJob at EOD per partner timezone
- Query Ledger Service for net positions (debits vs credits per partner per day)
- Calculate settlement amount per partner
- Trigger settlement transfer via Partner Gateway
- Produce settlement reports (archived to S3)
- Publish `settlement.events` for Reconciliation Service to cross-check

---

## API Specification

**API Type**: REST (internal admin) — primary trigger is CronJob, not inbound REST

**Base URL**: `/internal/settlement`

**Authentication**: mTLS (Istio; internal only)

**REST Endpoints**:

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/internal/settlement/run` | Manual settlement trigger | Ops role |
| GET | `/internal/settlement/{batchId}` | Get settlement batch status | Ops role |
| GET | `/internal/settlement/reports/{date}` | Download settlement report | Ops role |

---

## Data Management

**Database Type**: PostgreSQL 15.4 (AWS RDS Multi-AZ)
**Database Name**: `settlement_db`

**Tables**:
- `settlement_batches`: (id UUID PK, partner_id VARCHAR, settlement_date DATE, status VARCHAR, net_amount DECIMAL, currency VARCHAR, initiated_at TIMESTAMP, completed_at TIMESTAMP)
- `settlement_positions`: (id UUID PK, batch_id UUID FK, account_id VARCHAR, debit_total DECIMAL, credit_total DECIMAL, net_position DECIMAL)

**Data Ownership**: Source of truth for settlement batch state and position calculations

**Consistency Model**: Eventual consistency — positions read from Ledger Service and event store; settlement is idempotent (batch_id + partner_id unique constraint)

---

## Event-Driven Communication

**Events Published**:

| Event Name | Trigger | Payload | Topic | Consumers |
|------------|---------|---------|-------|-----------|
| `settlement.calculated` | Net position computed | batch_id, partner_id, net_amount, positions | `settlement.events` | Reconciliation Service |
| `settlement.initiated` | Transfer sent to Partner Gateway | batch_id, partner_id, amount | `settlement.events` | Reconciliation Service, Audit Log |
| `settlement.completed` | Partner confirms receipt | batch_id, partner_id, confirmation_ref | `settlement.events` | Reconciliation Service, Webhook Delivery |
| `settlement.failed` | Settlement transfer failed | batch_id, partner_id, failure_reason | `settlement.events` | Operations Dashboard, PagerDuty |
| `report.generated` | Settlement report ready | batch_id, report_url | `settlement.events` | Operations Dashboard |

**Events Consumed**:

| Event Name | Source | Action | Idempotency |
|------------|--------|--------|-------------|
| `reconciliation.gap.detected` | Reconciliation Service | Investigate and re-run if needed | `eventId` |

**Dead Letter Queue**: `settlement-service-dlq`

---

## Service Dependencies

**Synchronous Dependencies**:
- Ledger Service: `GetLedgerPositions` gRPC — timeout 5s; positions query is batch read
- Partner Gateway Service: trigger settlement transfer — timeout 30s; 3 retries

**Asynchronous Dependencies**:
- Reconciliation Service: `reconciliation.complete` events confirm settlement accuracy

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/settlement-service:<version>`

**Resource Requirements**:
- CPU: Requests 500m, Limits 2000m
- Memory: Requests 512Mi, Limits 1Gi

**Replicas**: Min 2, Max 10 (HPA CPU 70%)

**Deployment Strategy**: Rolling update

**Health Checks**:
- Liveness: `GET /health/liveness` every 30s
- Readiness: `GET /health/readiness` every 10s

---

## Security

**Authentication**: Istio mTLS; internal-only service (no external exposure)

**Secrets Management**: AWS Secrets Manager — DB credentials, Kafka credentials

**Encryption**:
- In-transit: mTLS (TLS 1.3)
- At-rest: RDS AES-256; S3 SSE-KMS for reports

**PCI-DSS Scope**: IN SCOPE — processes and stores financial settlement data

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `batchId`, `partnerId`, `settlementDate`, `durationMs`

**Metrics**:
- `settlement_batches_total` (counter, labels: partner_id, status)
- `settlement_duration_seconds` (histogram — full EOD run duration)
- `settlement_amount_total` (gauge, labels: partner_id, currency)

**Alerts**:
- Settlement batch failed → P1 PagerDuty (financial impact)
- Settlement batch not completed within 30 minutes of EOD → P2 alert
