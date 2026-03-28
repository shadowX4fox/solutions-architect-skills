# Section 4 — Component Details

## 4.1 Component Inventory

| # | Component | Domain | Type | Tier |
|---|-----------|--------|------|------|
| 1 | API Gateway Service | Edge / Routing | REST API + Auth | 1 |
| 2 | Payment Processor Service | Payments | REST API + Event Producer | 1 |
| 3 | Tokenisation Service | Security / PCI | gRPC Internal Service | 1 |
| 4 | Fraud Detection Service | Risk | Event Consumer + ML Inference | 1 |
| 5 | Ledger Service | Finance / Accounting | Event Consumer + Oracle Writer | 1 |
| 6 | Notification Service | Comms | Event Consumer + Push/Email | 2 |
| 7 | Webhook Dispatcher Service | Partner Integration | Event Consumer + HTTP Emitter | 2 |
| 8 | Bulk Ingest Service | Partner Integration | REST API + S3 + Event Producer | 2 |
| 9 | Reconciliation Service | Finance / Operations | Batch + Report Generator | 2 |

---

## 4.2 API Gateway Service

**Responsibility**: Single entry point for all external traffic. Handles authentication (JWT / API key), request validation, rate limiting, TLS termination, and routing to downstream services.

**Technology**: Node.js 20 (Fastify) on EKS
**Data stores**: ElastiCache Redis (rate-limit counters, session cache)
**Communication**: Synchronous HTTP routing to Payment Processor, Bulk Ingest

**Key Behaviours**:
- Validates JWTs issued by Amazon Cognito (consumer channel) and verifies HMAC-signed API keys (partner channel).
- Enforces per-key rate limits: 100 req/s (consumer), 500 req/s (partner bulk endpoints).
- Strips PAN data from logs before forwarding to CloudWatch.
- Returns `202 Accepted` + `idempotency-key` header for asynchronous operations.

**Scaling**: HPA min 3 / max 20 pods; scales on CPU ≥ 60% or latency P99 > 300 ms.

**SLO**: P99 latency ≤ 50 ms (routing overhead only, excluding downstream).

---

## 4.3 Payment Processor Service

**Responsibility**: Core payment orchestration. Validates payment requests, calls Tokenisation Service to vault/retrieve card data, applies business rules (limits, currency), publishes `payment.events` to Kafka, and returns synchronous authorization response to API Gateway.

**Technology**: Java 21 (Spring Boot 3) on EKS
**Data stores**: Amazon Aurora PostgreSQL (payment records, idempotency keys), Amazon DynamoDB (distributed idempotency lock)
**Communication**:
- Synchronous: gRPC call to Tokenisation Service (< 10 ms SLA)
- Asynchronous: Kafka producer to `payment.events` (transactional outbox)

**Key Behaviours**:
- Implements the Outbox Pattern: payment record and event written in a single Aurora transaction; a CDC relay (Debezium on MSK Connect) publishes the event to Kafka.
- Idempotency key stored in DynamoDB with 24-hour TTL; duplicate requests return cached response without reprocessing.
- Fraud pre-check: synchronous call to Fraud Detection Service for < 500 ms inline scoring before authorization.
- Produces a `PaymentInitiated`, `PaymentAuthorized`, or `PaymentDeclined` event.

**Scaling**: HPA min 5 / max 50 pods; scales on CPU ≥ 70% or Kafka producer lag.

**SLO**: P99 end-to-end authorization ≤ 1.5 s (including tokenisation and fraud pre-check).

---

## 4.4 Tokenisation Service

**Responsibility**: Vaults cardholder data (PAN, CVV) and issues tokens. This is the **only** service permitted to handle raw cardholder data. It operates inside the PCI-scoped network segment.

**Technology**: Go 1.22 on EKS (PCI-scoped node group)
**Data stores**: Amazon DynamoDB (token-to-encrypted-PAN mapping); AWS CloudHSM for key management
**Communication**: gRPC only; no public HTTP endpoints

**Key Behaviours**:
- On `tokenise(pan)`: encrypts PAN with AES-256-GCM using CloudHSM-managed key, stores ciphertext in DynamoDB, returns opaque token (UUID v4).
- On `detokenise(token)`: retrieves ciphertext, decrypts via CloudHSM, returns PAN only to authorised callers (Payment Processor during settlement).
- CVV is never persisted; used only for authorization and then discarded.
- Key rotation: 90-day automatic CloudHSM key rotation; old keys retained for in-flight transaction decryption.

**Scaling**: HPA min 3 / max 15 pods; scales on gRPC request rate.

**SLO**: P99 tokenise/detokenise ≤ 10 ms.

---

## 4.5 Fraud Detection Service

**Responsibility**: Real-time and near-real-time fraud scoring. Provides synchronous pre-authorization scoring for Payment Processor and asynchronous post-authorization analysis via Kafka consumer.

**Technology**: Python 3.12 (FastAPI + scikit-learn / XGBoost) on EKS
**Data stores**: ElastiCache Redis (feature store cache, velocity counters); Amazon S3 (model artefacts)
**Communication**:
- Synchronous: REST (invoked by Payment Processor for inline scoring, 200 ms budget)
- Asynchronous: Kafka consumer on `payment.events`; produces to `fraud.events`

**Key Behaviours**:
- Inline scoring: lightweight rule engine + cached ML features. Score returned in < 200 ms.
- Async deep scoring: full ML model evaluation on completed payment events. Results published to `fraud.events`.
- Fraud hold: if score > threshold, publishes `FraudHoldApplied` event consumed by Ledger Service and Notification Service.
- Manual review queue: `FraudHoldApplied` events trigger a task in the Operations dashboard (implemented as SQS FIFO queue).
- Velocity counters: per-card, per-IP, per-merchant transaction counts stored in Redis with 1-minute, 1-hour, 24-hour windows.

**Scaling**: HPA min 3 / max 20 pods; separate deployment for sync (latency-sensitive) and async (throughput) paths.

**SLO**: Inline score P99 ≤ 200 ms; async score within 5 s of event arrival.

---

## 4.6 Ledger Service

**Responsibility**: Authoritative double-entry ledger for all financial movements. Consumes `payment.events` and writes debit/credit entries to Oracle. Only service permitted to write to the Oracle database.

**Technology**: Java 21 (Spring Boot 3) on EKS
**Data stores**: Oracle Database 19c (ledger, via existing enterprise instance); read replicas for reporting
**Communication**: Kafka consumer on `payment.events` and `ledger.commands`

**Key Behaviours**:
- Double-entry bookkeeping: every payment creates a debit on the sender account and credit on the receiver account within a single Oracle transaction.
- Exactly-once: Kafka consumer group with manual offset commit; offset committed only after successful Oracle write.
- GDPR pseudonymisation: PAN replaced by token in all ledger rows; name replaced by hashed value.
- Settlement: at configurable interval (default 30 s), runs settlement job that sweeps `PENDING` entries to `SETTLED`, updates balances.
- Read replica used by Reconciliation Service to avoid contention on primary.

**Scaling**: HPA min 3 / max 10 pods (Oracle connection pool is the bottleneck; pool size = 100 connections).

**SLO**: Event-to-ledger write P99 ≤ 1 s; settlement sweep ≤ 30 s end-to-end.

---

## 4.7 Notification Service

**Responsibility**: Delivers real-time payment confirmations to end customers (push notifications, email, SMS).

**Technology**: Node.js 20 (Fastify) on EKS
**Data stores**: DynamoDB (notification state, deduplication)
**Communication**: Kafka consumer on `notification.events`; sends via Amazon SNS (push), Amazon SES (email), Amazon Pinpoint (SMS)

**Key Behaviours**:
- Deduplication: DynamoDB conditional write on notification ID; prevents duplicate push/email if consumer restarts.
- Retry policy: 3 attempts with exponential back-off per channel. Failed notifications go to DLQ (SQS).
- Template rendering: per-channel Mustache templates stored in S3 and cached in memory (TTL 5 min).

**Scaling**: HPA min 2 / max 10 pods.

---

## 4.8 Webhook Dispatcher Service

**Responsibility**: Delivers payment status callbacks to registered business partner endpoints.

**Technology**: Go 1.22 on EKS
**Data stores**: Amazon Aurora PostgreSQL (webhook subscriptions, delivery log)
**Communication**: Kafka consumer on `webhook.dispatch`; outbound HTTPS POST to partner endpoints

**Key Behaviours**:
- HMAC-SHA256 signature on each webhook payload; partners verify using pre-shared secret.
- Retry schedule: immediate → 30 s → 2 min → 10 min → 1 hour → 6 hours (total 6 attempts over ≈ 7.5 hours). After exhaustion, marks `FAILED` and alerts operations.
- Delivery log stored in Aurora for partner support queries.
- Circuit breaker per partner endpoint: if 5 consecutive failures, stops dispatching for 60 s then half-opens.

**Scaling**: HPA min 2 / max 15 pods.

---

## 4.9 Bulk Ingest Service

**Responsibility**: Accepts bulk payment files from business partners (CSV/JSON), validates, fans out individual payment events, and streams status back via webhooks.

**Technology**: Python 3.12 (FastAPI) on EKS
**Data stores**: Amazon S3 (raw and processed file storage); DynamoDB (job state)
**Communication**: REST inbound (presigned S3 upload URL flow); Kafka producer to `payment.events`

**Key Behaviours**:
- Partners upload files to S3 via pre-signed URL. S3 event triggers SQS → Bulk Ingest Service.
- Validates file schema; rejects malformed files with error report to partner.
- Fans out each payment record as an individual Kafka event (idempotency key = `bulk_job_id + record_index`).
- Progress tracked in DynamoDB; partner can poll job status endpoint or receive final webhook on completion.
- Parallel workers: up to 10 concurrent Kafka producers per job instance; configurable.

**Scaling**: HPA min 2 / max 20 pods.

---

## 4.10 Reconciliation Service

**Responsibility**: End-of-day reconciliation between PayStream ledger and external bank statements. Generates settlement reports for the operations team.

**Technology**: Python 3.12 (Celery + pandas) on EKS
**Data stores**: Oracle DB read replica (ledger), Amazon S3 (report output), Amazon Aurora PostgreSQL (reconciliation run state)
**Communication**: Scheduled (Kubernetes CronJob, daily at 23:00 UTC); reads from Oracle read replica

**Key Behaviours**:
- Compares PayStream ledger totals against bank-provided settlement files (SFTP ingestion from partners).
- Generates discrepancy report and publishes to S3; emails link to operations team via SES.
- Idempotent run: if run fails mid-way, resumes from last checkpoint stored in Aurora.
- Read-only access to Oracle; uses dedicated read replica to avoid impacting Ledger Service throughput.

**Scaling**: Single pod for scheduled run; no HPA required.
