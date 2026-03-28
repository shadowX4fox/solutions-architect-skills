# Section 9 — Scalability and Performance

## 9.1 Capacity Model

The platform must scale from the current 50,000 tx/day to 500,000 tx/day within 18 months.

| Metric | Current (Legacy) | MVP Target (Month 3) | Full Platform (Month 6) | 18-Month Projection |
|--------|-----------------|---------------------|------------------------|---------------------|
| Transactions/day | 50,000 | 100,000 | 300,000 | 500,000 |
| Sustained tx/s | 0.6 (batch) | 1.2 | 3.5 | 5.8 |
| Peak tx/s (10× burst) | N/A | 12 | 35 | 58 |
| P99 latency | Hours (batch) | ≤ 2 s | ≤ 2 s | ≤ 2 s |
| Concurrent API connections | N/A | 1,000 | 5,000 | 20,000 |

## 9.2 Scaling Strategy per Component

| Component | Scaling Trigger | Min Pods | Max Pods | Bottleneck |
|-----------|----------------|----------|----------|------------|
| API Gateway Service | CPU ≥ 60% OR P99 latency > 300 ms | 3 | 20 | Network I/O |
| Payment Processor | CPU ≥ 70% OR Kafka producer lag | 5 | 50 | Aurora connections |
| Tokenisation Service | gRPC request rate | 3 | 15 | CloudHSM throughput |
| Fraud Detection (sync) | CPU ≥ 70% | 3 | 20 | Model inference time |
| Fraud Detection (async) | Kafka consumer lag > 1000 | 2 | 15 | Redis I/O |
| Ledger Service | Kafka consumer lag > 500 | 3 | 10 | Oracle connection pool (100 max) |
| Notification Service | Kafka consumer lag > 2000 | 2 | 10 | SNS/SES throughput |
| Webhook Dispatcher | Kafka consumer lag > 1000 | 2 | 15 | Outbound HTTP |
| Bulk Ingest Service | SQS message depth > 10 | 2 | 20 | Kafka producer rate |

## 9.3 Database Scaling

### Amazon Aurora PostgreSQL (Payments DB)

- **Write path**: Single Aurora writer instance (`db.r7g.xlarge`), Multi-AZ with automatic failover (< 30 s).
- **Read path**: 2 Aurora read replicas for reporting queries; auto-scaled with Aurora Serverless v2 for burst.
- **Connection pooling**: PgBouncer as a sidecar per Payment Processor pod (pool_mode=transaction, max_client_conn=50 per pod).
- **Partitioning**: `payment_records` table partitioned by month (range partitioning); partitions older than 12 months archived to S3 via pg_partman.

### Oracle Database (Ledger)

- **Write throughput**: Limited by Oracle connection pool (100 connections). At 500 K tx/day (5.8 tx/s), each write takes < 100 ms → pool utilisation ≈ 58% at peak. Capacity headroom: ~170 tx/s before pool exhaustion.
- **Read offload**: All reporting and reconciliation queries directed to read replica.
- **Bottleneck mitigation**: Ledger Service batches micro-batch writes (50 entries per commit) to reduce per-transaction COMMIT overhead.

### Amazon DynamoDB (Idempotency)

- **Capacity mode**: On-Demand (no pre-provisioning; handles burst automatically).
- **TTL**: 24-hour TTL on idempotency keys; automatic cleanup.
- **Table design**: Single-table design; PK = `idempotency_key`; conditional `PutItem` for atomic idempotency check-and-set.

### Amazon ElastiCache Redis (Cache / Rate Limiting)

- **Cluster mode**: Enabled; 3 shards × 2 nodes (`cache.r7g.large`).
- **Rate limiting**: Lua scripts for atomic INCR + EXPIRE; single-round-trip rate limit check.
- **Fraud feature store**: Features pre-computed by async Fraud Detection worker, cached with 1-minute TTL.

## 9.4 Kafka Throughput Sizing

At 500,000 tx/day peak → 5.8 events/s sustained, 58 events/s burst (10× peak).

| Topic | Max throughput | Partitions | Partition sizing |
|-------|---------------|-----------|-----------------|
| `payment.events` | 200 events/s (headroom × 3) | 30 | ~7 events/s/partition |
| `fraud.events` | 100 events/s | 10 | ~10 events/s/partition |
| `webhook.dispatch` | 150 events/s | 15 | ~10 events/s/partition |

MSK broker capacity (`kafka.m5.xlarge`): ~150 MB/s per broker; average event size ~1 KB → 150,000 events/s per broker (far exceeds requirement). Partition count is sized for parallelism (consumer instances), not broker throughput.

## 9.5 Latency Budget Analysis

Target: P99 end-to-end ≤ 2,000 ms for consumer payment authorization.

| Segment | P50 Budget | P99 Budget | Measurement Point |
|---------|-----------|-----------|------------------|
| Client → CloudFront → ALB | 10 ms | 50 ms | X-Ray trace entry |
| API Gateway (auth + routing) | 20 ms | 50 ms | X-Ray segment |
| Payment Processor (validation) | 30 ms | 100 ms | X-Ray segment |
| Tokenisation Service (gRPC) | 5 ms | 10 ms | gRPC histogram metric |
| Fraud Detection (inline score) | 80 ms | 200 ms | FastAPI latency metric |
| Aurora write (outbox TX) | 15 ms | 50 ms | DB latency metric |
| Payment Processor → response | 5 ms | 10 ms | X-Ray segment |
| **Total (P99 budget used)** | **165 ms** | **470 ms** | |
| **Buffer remaining before SLO breach** | — | **1,530 ms** | |

The P99 latency budget shows 1,530 ms of margin before the 2,000 ms SLO is breached. This accommodates network jitter, GC pauses (Java virtual threads mitigate stop-the-world), and CloudHSM variance.

## 9.6 Availability Design

### 99.99% SLO = < 52.6 minutes downtime/year

| Strategy | Implementation |
|----------|---------------|
| Multi-AZ deployment | All Tier 1 services across 3 AZs; ALB distributes across AZs |
| Pod disruption budgets | `maxUnavailable: 1` for all Tier 1 services |
| Aurora Multi-AZ | Automatic failover < 30 s; meets RPO < 30 s |
| MSK Multi-AZ | 3 brokers; RF=3; single broker loss = no data loss |
| Oracle standby | Oracle Data Guard Active Standby in separate AZ; automatic failover via Observer |
| Health checks | Kubernetes liveness + readiness probes; ALB target health checks |
| Circuit breakers | Resilience4j (Java), `circuitbreaker` library (Go), `tenacity` (Python) |

### RTO / RPO Targets

| Service Tier | RTO | RPO | Mechanism |
|-------------|-----|-----|-----------|
| Tier 1 (Payment Processor, Ledger, API GW) | < 5 min | < 30 s | Multi-AZ; automatic failover; HPA |
| Tier 2 (Notification, Webhook, Bulk Ingest) | < 15 min | < 5 min | Multi-AZ; Kafka replay for missed events |
| Tier 3 (Reconciliation) | < 1 hour | < 24 hours (daily batch) | Idempotent re-run from last checkpoint |

## 9.7 Performance Testing Strategy

| Test Type | Tool | Frequency | Pass Criteria |
|-----------|------|-----------|--------------|
| Load test | k6 (500 K tx/day sustained) | Pre-release, weekly in staging | P99 ≤ 2 s; zero errors |
| Stress test | k6 (10× peak, 5-minute burst) | Pre-release | No service crash; graceful degradation |
| Chaos engineering | AWS Fault Injection Simulator | Monthly | RTO met for all AZ-loss scenarios |
| Soak test | k6 (72-hour continuous load) | Quarterly | No memory leaks; metrics stable |
| Fraud model latency | Custom benchmark | On model update | Inline score P99 ≤ 200 ms |
