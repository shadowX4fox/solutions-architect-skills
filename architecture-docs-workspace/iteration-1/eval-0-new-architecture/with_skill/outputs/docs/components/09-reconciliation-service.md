[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Reconciliation Service

# Reconciliation Service

**Type:** Microservice

---

## Overview

**Bounded Context**: End-of-Day Reconciliation — cross-checking event store vs ledger positions; gap detection

**Technology**: Python 3.12, FastAPI 0.111.x, pandas
**Team Owner**: Payments Team

**Purpose**:
Validates the accuracy of the settlement calculation by cross-checking the event store (Kafka event history) against the Ledger Service's Oracle positions. Detects reconciliation gaps (discrepancies between events and ledger entries), alerts operations, and produces reconciliation reports for the compliance team.

**Responsibilities**:
- Consume `settlement.events` (settlement.calculated) from Kafka
- Query event store to enumerate all payment events for the settlement period
- Cross-check event totals vs ledger positions from Settlement Service
- Detect and report gaps (amount mismatches, missing ledger entries)
- Publish `reconciliation.complete` or `reconciliation.gap` events
- Generate reconciliation report (PDF + CSV) archived to S3

---

## API Specification

**API Type**: REST (internal admin + report access)

**Base URL**: `/internal/reconciliation`

**Authentication**: Istio mTLS (internal only); ops role required

**REST Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/internal/reconciliation/{batchId}` | Get reconciliation result |
| GET | `/internal/reconciliation/reports/{date}` | Get reconciliation report |
| POST | `/internal/reconciliation/run` | Manual reconciliation trigger |

---

## Data Management

**Database Type**: PostgreSQL 15.4 (AWS RDS Multi-AZ)
**Database Name**: `reconciliation_db` (within `settlement_db` schema or separate RDS; [To be defined])

**Tables**:
- `reconciliation_runs`: (id UUID PK, batch_id UUID, status VARCHAR, gap_count INT, gap_amount DECIMAL, completed_at TIMESTAMP)
- `reconciliation_gaps`: (id UUID PK, run_id UUID FK, transaction_id VARCHAR, expected_amount DECIMAL, actual_amount DECIMAL, gap_type VARCHAR)

---

## Event-Driven Communication

**Events Consumed**:

| Event Name | Source | Action | Idempotency |
|------------|--------|--------|-------------|
| `settlement.calculated` | Settlement Service | Begin reconciliation cross-check | `eventId` |

**Events Published**:

| Event Name | Trigger | Payload | Topic |
|------------|---------|---------|-------|
| `reconciliation.complete` | No gaps detected | batch_id, partner_id, period | `settlement.events` |
| `reconciliation.gap.detected` | Gap found | batch_id, partner_id, gap_count, gap_amount | `settlement.events` |

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/reconciliation-service:<version>`

**Resource Requirements**:
- CPU: Requests 500m, Limits 4000m (pandas aggregations are CPU-intensive)
- Memory: Requests 1Gi, Limits 4Gi (in-memory data aggregations)

**Replicas**: Min 1, Max 5 (batch workload; not latency-sensitive)

**Deployment Strategy**: Rolling update

---

## Security

**Authentication**: Istio mTLS; internal-only

**Secrets Management**: AWS Secrets Manager — DB credentials, Kafka credentials

**PCI-DSS Scope**: IN SCOPE — accesses transaction totals and settlement records

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `batchId`, `partnerId`, `runDurationMs`, `gapCount`

**Metrics**:
- `reconciliation_runs_total` (counter, labels: status)
- `reconciliation_gaps_total` (counter, labels: gap_type)
- `reconciliation_duration_seconds` (histogram)

**Alerts**:
- Reconciliation gap detected → P1 PagerDuty (financial discrepancy)
- Reconciliation not completed within 30 minutes of settlement → P2 alert
