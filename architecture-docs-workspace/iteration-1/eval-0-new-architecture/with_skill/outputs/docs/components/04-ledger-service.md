[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Ledger Service

# Ledger Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Ledger Management — authoritative debit/credit journal for all payment transactions

**Technology**: Java 17, Spring Boot 3.2.x, Spring Data JPA (Oracle dialect)
**Team Owner**: Payments Team

**Purpose**:
Sole gateway to the Oracle ledger database (retained per business constraint in [ADR-002](../../adr/ADR-002-oracle-ledger-persistence.md)). Accepts debit/credit instructions from the Payment Service, posts entries to Oracle atomically, and publishes `ledger.entries` events for settlement and reconciliation downstream. No other service accesses Oracle directly.

**Responsibilities**:
- Accept and validate debit/credit instructions from Payment Service
- Post atomic ledger entries to Oracle within 300ms budget (see [timing budget](../04-data-flow-patterns.md#timing-budget))
- Query ledger positions for Settlement Service (EOD settlement calculations)
- Publish `ledger.entries` events for downstream reconciliation
- Manage Oracle connection pool (max 50 connections; Oracle licensing constraint)

---

## API Specification

**API Type**: gRPC (internal only)

**Base URL (gRPC)**: `ledger-service.payments.svc.cluster.local:9090`

**Authentication**: mTLS (Istio; only Payment Service and Settlement Service are authorized callers)

**gRPC Methods**:

| Method | Description | Request | Response | Timeout |
|--------|-------------|---------|----------|---------|
| `DebitCredit` | Post a ledger entry | `LedgerEntryRequest` | `LedgerEntryConfirmed` | 300ms |
| `GetLedgerPositions` | Get net positions for settlement | `PositionQuery` | `LedgerPositions` | 5,000ms |
| `ReverseLedgerEntry` | Reverse a previous entry (saga compensation) | `ReversalRequest` | `ReversalConfirmed` | 300ms |

---

## Data Management

**Database Type**: Oracle Database 19c (AWS RDS for Oracle — existing; migration prohibited per [ADR-002](../../adr/ADR-002-oracle-ledger-persistence.md))
**Database Name**: `ledger_db`

**Tables**:
- `ledger_entries`: (id NUMBER PK, transaction_id VARCHAR2 NOT NULL, account_id VARCHAR2, entry_type VARCHAR2, amount NUMBER(18,4), currency VARCHAR2, status VARCHAR2, posted_at TIMESTAMP, reversed_by NUMBER NULL)
- `account_balances`: (account_id VARCHAR2 PK, balance NUMBER(18,4), currency VARCHAR2, last_updated TIMESTAMP) — maintained by trigger

**Data Ownership**: Sole source of truth for all account balances and transaction journal entries

**Connection Pool**: HikariCP — max 50 connections (Oracle licensing constraint); connection timeout 3s; idle timeout 600s

**Data Access Patterns**:
- High-frequency: Single ledger entry insert per payment (ACID transaction)
- Batch-read: Position query for settlement (once per partner per day; large result set)

**Consistency Model**: Strong consistency (ACID); Oracle serializable isolation for entry posting

---

## Event-Driven Communication

**Events Published**:

| Event Name | Trigger | Payload | Topic | Consumers |
|------------|---------|---------|-------|-----------|
| `ledger.entry.posted` | Ledger entry committed to Oracle | entry_id, transaction_id, account_id, amount, currency, posted_at | `ledger.entries` | Reconciliation Service, Audit Log |
| `ledger.entry.reversed` | Entry reversal committed | reversal_id, original_entry_id, transaction_id | `ledger.entries` | Reconciliation Service, Audit Log |

**Events Consumed**: None (synchronous responder only)

---

## Service Dependencies

**Synchronous Dependencies**:
- Oracle DB (AWS RDS for Oracle): Required for all ledger operations; circuit breaker: 3 consecutive failures → open 30s; Payment Service receives error → transaction held (not lost)

**External Dependencies**: None

**Oracle Data Guard Replication**: Synchronous replication to standby in `us-west-2`; RPO < 30 seconds (see [Key Metrics](../01-system-overview.md#key-metrics))

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/ledger-service:<version>`

**Resource Requirements**:
- CPU: Requests 500m, Limits 2000m
- Memory: Requests 512Mi, Limits 1Gi

**Replicas**: Min 2, Max 10 (HPA CPU 60%; conservative — Oracle connection pool limits at 50 max connections shared across all pods)

**Note**: Max replicas × connections per pod must not exceed 50 Oracle connections. At max 10 pods × 5 pool size = 50 connections. HPA ceiling set accordingly.

**Deployment Strategy**: Rolling update (max unavailable: 0, max surge: 1)

**Health Checks**:
- Liveness: `GET /health/liveness` every 30s
- Readiness: `GET /health/readiness` every 10s (checks Oracle JDBC connectivity)

---

## Security

**Authentication**: Istio mTLS; AuthorizationPolicy restricts inbound to `payment-service` and `settlement-service` ServiceAccounts only

**Secrets Management**: AWS Secrets Manager (IRSA) — Oracle credentials rotated every 90 days

**Encryption**:
- In-transit: mTLS (TLS 1.3) via Istio; Oracle JDBC over TLS 1.3
- At-rest: Oracle Transparent Data Encryption (AES-256); Oracle wallet credentials in AWS Secrets Manager

**PCI-DSS Scope**: IN SCOPE (CDE) — stores financial transaction records

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `transactionId`, `entryId`, `amount`, `durationMs`

**Metrics**:
- `ledger_entry_duration_seconds` (histogram, p50/p95/p99)
- `ledger_entries_total` (counter, labels: entry_type)
- `oracle_connection_pool_active` (gauge)
- `oracle_connection_pool_pending` (gauge)

**Alerts**:
- Ledger entry P99 > 250ms → Warning (approaching 300ms budget)
- Oracle connection pool pending > 5 → P2 alert (pool saturation)
- Oracle connectivity failure → P1 PagerDuty
