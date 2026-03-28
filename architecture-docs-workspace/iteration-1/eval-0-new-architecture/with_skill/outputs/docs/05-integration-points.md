# Section 7: Integration Points

[Architecture](../ARCHITECTURE.md) > Integration Points

---

## Overview

PayStream integrates with three categories of external systems: card payment networks, banking partners (3 external banks), and supporting cloud services. All external integrations are mediated through dedicated adapter services to isolate protocol and format differences from core business logic.

---

## Integration Map

| Integration | Direction | Protocol | Owning Service | Auth |
|-------------|-----------|----------|----------------|------|
| Card Networks (Visa/Mastercard) | Outbound | HTTPS (ISO 8583 / JSON) | Authorization Service | mTLS + HSM-signed keys |
| Banking Partner APIs (3 banks) | Inbound + Outbound | HTTPS REST | Partner Gateway Service | API Key per partner |
| Partner Webhooks | Outbound | HTTPS POST | Webhook Delivery Service | HMAC-SHA256 signature |
| AWS MSK (Kafka) | Internal | Kafka protocol | All services | IAM + TLS |
| Oracle Ledger DB | Internal | JDBC over TLS | Ledger Service only | AWS Secrets Manager |
| AWS RDS (PostgreSQL) | Internal | PostgreSQL/TLS | Per-service | AWS Secrets Manager |
| AWS ElastiCache (Redis) | Internal | Redis/TLS | API Gateway, Webhook Svc | AWS IAM auth |
| AWS S3 (Audit Store) | Internal | HTTPS | Audit Log Service | IAM Role |
| AWS Secrets Manager | Internal | HTTPS | All services (init) | IAM Role |

---

## Integration 1: Card Networks (Visa / Mastercard)

**Direction**: Outbound from Authorization Service

**Purpose**: Submit card authorization requests and receive approve/decline responses on the real-time payment critical path.

**Protocol**: HTTPS with TLS 1.3; message format varies by network:
- Visa: VisaNet API (JSON over HTTPS)
- Mastercard: Mastercard Connect API (ISO 8583 adapted to JSON)

**Authentication**: mTLS client certificates; signing keys stored in AWS CloudHSM (PCI-DSS requirement for cryptographic operations)

**SLA**: Card network authorization round-trip budget = 800ms max (see [Data Flow Patterns](04-data-flow-patterns.md#timing-budget))

**Failure Handling**:
- Timeout (> 800ms): return DECLINED to customer; log timeout event
- Network error: single retry with 200ms delay; if retry fails → DECLINED
- No circuit breaker open on card network (decline is safer than unknown state)

**PCI-DSS Notes**:
- Card authorization data (PAN, CVV) must never be logged
- Authorization responses (token, approval code) are stored; raw card data is not
- HSM key management follows PCI-DSS Key Management requirements

---

## Integration 2: Banking Partner APIs (3 External Banks)

**Direction**: Inbound (partner submits payments) + Outbound (settlement transfers)

**Purpose**: Accept bulk payment file submissions from banking partners; deliver settlement wire instructions at EOD.

**Owning Service**: [Partner Gateway Service](components/06-partner-gateway-service.md)

**Authentication**: Per-partner API keys, provisioned during partner onboarding. Keys stored in AWS Secrets Manager.

**Protocol Variations**:

| Partner | Inbound Format | Settlement Format | Notes |
|---------|---------------|-------------------|-------|
| Bank A | ISO 20022 XML | SWIFT MT103 | Legacy format; XML parser in Partner Gateway |
| Bank B | JSON REST | JSON REST | Modern; simplest integration |
| Bank C | CSV batch file (SFTP) | JSON REST | SFTP → S3 landing zone → Bulk File Processor |

**Inbound Flow**: Partner submits → Partner Gateway normalizes → Publishes to Kafka `payment.events` as standardized PayStream events → standard payment pipeline

**Outbound Settlement Flow**: Settlement Service computes positions → Partner Gateway translates to partner-specific format → sends via appropriate channel

**Onboarding Process**:
- API key generation and secure delivery to partner
- Webhook URL configuration per partner
- Test environment validation (sandbox)
- Production go-live with monitoring

**Timeout / Retry**: Partner API calls have 30-second timeout; 3 retries with exponential backoff. Failed settlement delivery triggers PagerDuty alert.

---

## Integration 3: Partner Webhook Delivery

**Direction**: Outbound from Webhook Delivery Service

**Purpose**: Deliver real-time payment status notifications to business partners per their webhook configuration.

**Protocol**: HTTPS POST to partner-configured URL

**Payload**: JSON (PayStream standard event envelope, see [Data Flow Patterns](04-data-flow-patterns.md#event-schema-conventions))

**Authentication**: HMAC-SHA256 request signature. PayStream signs the webhook body with a per-partner shared secret; partner validates signature on receipt.

**Delivery Guarantees**:
- At-least-once delivery (partner must implement idempotency on webhook receipt using `eventId`)
- Retry policy: 3 attempts with exponential backoff (30s, 60s, 120s)
- After 3 failures: event routed to `webhook.dlq` Kafka topic; operations team alerted
- Webhook delivery status tracked per partner; SLA reporting available

**Partner Webhook Events**:

| Event Type | Trigger | Payload |
|-----------|---------|---------|
| `payment.completed` | Transaction confirmed | transactionId, amount, status, timestamp |
| `payment.declined` | Transaction declined | transactionId, declineCode, timestamp |
| `payment.held` | Fraud hold applied | transactionId, holdReason, timestamp |
| `settlement.completed` | EOD settlement wire sent | batchId, totalAmount, transactionCount |

---

## Integration 4: Amazon MSK (Kafka) — Internal Event Bus

**Direction**: Internal (all services publish and consume)

**Purpose**: Asynchronous backbone per [ADR-003](../adr/ADR-003-event-driven-payment-processing.md)

**Technology**: Amazon MSK (managed Apache Kafka 3.5)

**Authentication**: AWS IAM-based authentication for MSK + TLS encryption in transit

**Topic Configuration**:

| Topic | Partitions | Retention | Replication Factor |
|-------|-----------|-----------|-------------------|
| `payment.events` | 12 | 7 days | 3 |
| `fraud.alerts` | 6 | 30 days | 3 |
| `settlement.events` | 6 | 90 days | 3 |
| `ledger.entries` | 6 | 90 days | 3 |
| `webhook.dispatch` | 6 | 7 days | 3 |
| `audit.trail` | 12 | 365 days | 3 |

**Schema Registry**: AWS Glue Schema Registry for event schema versioning and compatibility validation.

---

## Integration 5: Oracle Ledger Database

**Direction**: Internal (Ledger Service only)

**Purpose**: Source of truth for all account debit/credit entries. Retained per business constraint (see [ADR-002](../adr/ADR-002-oracle-ledger-persistence.md)).

**Owning Service**: [Ledger Service](components/04-ledger-service.md) — **only** service permitted to access Oracle directly

**Connection**: JDBC over TLS; connection pool managed by Ledger Service (HikariCP, max 50 connections)

**Credentials**: Stored in AWS Secrets Manager; rotated every 90 days

**Performance Budget**: Ledger debit/credit operation must complete within 300ms (see [Data Flow Patterns](04-data-flow-patterns.md#timing-budget))

**Resilience**: Oracle RAC (Real Application Clusters) provides automatic failover. RPO < 30 seconds per Oracle Data Guard replication.

---

## Integration 6: AWS Supporting Services

| Service | Integration Type | Purpose | Auth |
|---------|----------------|---------|------|
| AWS Secrets Manager | SDK (all services at startup) | Retrieve credentials, API keys, certificates | IAM Role per service |
| AWS CloudWatch | SDK / agent | Metrics, logs, alarms | IAM Role |
| AWS X-Ray | SDK (OpenTelemetry exporter) | Distributed tracing | IAM Role |
| AWS S3 | SDK (Audit Log Service) | Immutable audit event archive | IAM Role (write-once policy) |
| AWS CloudHSM | PKCS#11 (Authorization Service) | PCI-DSS cryptographic operations | mTLS + HSM partition credentials |
| AWS WAF | Managed (API Gateway) | OWASP Top 10 protection | N/A (managed) |
| AWS CloudTrail | Managed | Infrastructure audit log | N/A (managed) |
| AWS Security Hub | Managed | Compliance posture monitoring | N/A (managed) |

---

## Integration Failure Taxonomy

| Integration | Failure Mode | Impact | Mitigation |
|-------------|-------------|--------|------------|
| Card Network timeout | Authorization cannot complete | Payment declined | Timeout → decline (safe default) |
| Card Network unreachable | All card payments fail | Platform unavailable | Separate circuit breaker monitor; alert on-call |
| Banking Partner API down | Settlement delayed | Delayed settlement (not data loss) | Retry with backoff; DLQ |
| Partner Webhook endpoint down | Partner not notified | Partner polling required | Retry + DLQ + partner alert |
| Oracle DB unreachable | Ledger writes fail | Payment cannot confirm | Circuit breaker; payment held until DB recovers |
| MSK unavailable | Async flows stop | Settlement/notification delayed | Kafka HA (3 AZs); local retry buffer in services |
