[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Partner Gateway Service

# Partner Gateway Service

**Type:** Microservice

---

## Overview

**Bounded Context**: Banking Partner Integration — protocol normalization and partner API adapter

**Technology**: Node.js 20, NestJS 10.x
**Team Owner**: Integration Team

**Purpose**:
Abstracts all banking partner protocol differences from the core payment platform. Normalizes inbound payment formats (ISO 20022 XML, JSON REST, CSV/SFTP) into the standard PayStream event format. Translates outbound settlement instructions into partner-specific formats (SWIFT MT103, JSON REST). Each banking partner's specific protocol logic is isolated in a per-partner adapter module.

**Responsibilities**:
- Authenticate inbound requests from banking partners (API key per partner)
- Parse and validate partner-specific payment submission formats
- Normalize to PayStream standard payment events and publish to Kafka
- Accept settlement instructions from Settlement Service and translate to partner format
- Manage partner configuration (webhook URLs, API credentials, format preferences)
- Provide a sandbox mode for partner integration testing

---

## API Specification

**API Type**: REST (inbound from partners) + gRPC (internal from Settlement Service)

**Base URL (Partner-facing)**: `/partner/v1`

**Authentication**: API Key per partner (`X-API-Key` header); keys stored in AWS Secrets Manager

**Partner-Facing REST Endpoints**:

| Method | Path | Description | Format | Status Codes |
|--------|------|-------------|--------|--------------|
| POST | `/partner/v1/payments` | Submit payment (JSON) | JSON | 202, 400, 401 |
| POST | `/partner/v1/payments/bulk` | Submit bulk file | JSON/XML | 202, 400, 401 |
| GET | `/partner/v1/payments/{id}` | Query payment status | JSON | 200, 404, 401 |
| GET | `/partner/v1/batches/{batchId}` | Query batch status | JSON | 200, 404, 401 |

**Internal REST Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/internal/settlement/initiate` | Initiate settlement for partner (from Settlement Service) |

**Partner Format Support**:

| Partner | Inbound | Settlement |
|---------|---------|-----------|
| Bank A | ISO 20022 XML | SWIFT MT103 |
| Bank B | JSON REST | JSON REST |
| Bank C | CSV (SFTP → S3 landing) | JSON REST |

---

## Data Management

**Database Type**: PostgreSQL 15.4 (AWS RDS Multi-AZ)
**Database Name**: `partner_db`

**Tables**:
- `partners`: (id UUID PK, partner_name VARCHAR, api_key_hash VARCHAR, webhook_url VARCHAR, inbound_format VARCHAR, settlement_format VARCHAR, status VARCHAR)
- `partner_batches`: (id UUID PK, partner_id UUID FK, batch_reference VARCHAR, status VARCHAR, transaction_count INT, submitted_at TIMESTAMP)
- `partner_transactions`: (id UUID PK, batch_id UUID FK, external_reference VARCHAR, paystream_transaction_id UUID, status VARCHAR)

**Data Ownership**: Source of truth for partner configuration and batch submission state

---

## Event-Driven Communication

**Events Published**:

| Event Name | Trigger | Payload | Topic | Consumers |
|------------|---------|---------|-------|-----------|
| `payment.submitted` | Partner payment received and normalized | payment_id, partner_id, amount, currency, normalized_payload | `payment.events` | Payment Service |

**Events Consumed**:

| Event Name | Source | Action | Idempotency |
|------------|--------|--------|-------------|
| `payment.completed` | Payment Service | Update partner transaction status | `eventId` |
| `payment.declined` | Payment Service | Update partner transaction status | `eventId` |
| `settlement.initiated` | Settlement Service | Trigger partner-specific settlement transfer | `eventId` |

---

## Deployment & Scaling

**Container Image**: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/partner-gateway-service:<version>`

**Resource Requirements**:
- CPU: Requests 500m, Limits 2000m
- Memory: Requests 512Mi, Limits 1Gi

**Replicas**: Min 2, Max 10 (HPA CPU 70% and request rate)

**Deployment Strategy**: Rolling update

---

## Security

**Authentication**: Per-partner API keys; keys hashed in DB (sha-256 + salt); raw keys in AWS Secrets Manager

**Secrets Management**: AWS Secrets Manager — partner API keys, partner banking API credentials, DB credentials

**Encryption**:
- In-transit: TLS 1.3 (partner-facing) + mTLS (internal)
- At-rest: RDS AES-256

**PCI-DSS Scope**: OUT OF SCOPE (partner gateway handles tokenized payment references, not raw card data)

---

## Observability

**Logging**: Structured JSON; mandatory fields: `correlationId`, `partnerId`, `batchId`, `requestFormat`, `durationMs`

**Metrics**:
- `partner_submissions_total` (counter, labels: partner_id, status)
- `partner_normalization_errors_total` (counter, labels: partner_id, error_type)
- `settlement_transfers_total` (counter, labels: partner_id, status)

**Alerts**:
- Partner API error rate > 10% → Slack warning
- Settlement transfer failure → P1 PagerDuty
