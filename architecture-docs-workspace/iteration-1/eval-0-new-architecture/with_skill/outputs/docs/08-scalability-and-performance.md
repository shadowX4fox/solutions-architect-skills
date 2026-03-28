# Section 10: Scalability & Performance

[Architecture](../ARCHITECTURE.md) > Scalability & Performance

---

## Overview

PayStream is designed for 10× scale growth per [Principle P5: Design for 10× Scale](02-architecture-principles.md#principle-5-design-for-10-scale). All capacity models target 500,000 transactions/day (the 18-month projection from the [System Overview](01-system-overview.md#key-metrics)), not the current 50,000/day baseline.

---

## Performance Targets (SLOs)

| Metric | SLO Target | Measurement Method |
|--------|-----------|-------------------|
| Payment P99 latency (end-to-end) | ≤ 2,000ms | Distributed trace p99 in X-Ray |
| Payment P95 latency | ≤ 1,200ms | X-Ray histogram |
| Payment P50 latency | ≤ 500ms | X-Ray histogram |
| Throughput — peak | 60 TPS sustained (500K/day at 2.3h peak window) | CloudWatch `payment.events` count/s |
| Throughput — target load test | 120 TPS (2× peak) | k6 load test |
| System availability | 99.99% | CloudWatch uptime SLI |
| Settlement latency (payment confirmed → ledger entry) | < 30 seconds | Event timestamp delta (Kafka → Oracle commit) |
| Partner webhook delivery P95 | < 5 seconds | Webhook Delivery Service metric |

---

## Capacity Model

### Transaction Volume

| Period | Transactions/Day | Avg TPS | Peak TPS (10% of day) |
|--------|----------------|---------|----------------------|
| Current (baseline) | 50,000 | 0.6 | 6 |
| MVP (Month 3) | 100,000 | 1.2 | 12 |
| Full Platform (Month 6) | 250,000 | 2.9 | 29 |
| 18-Month Target | 500,000 | 5.8 | 58 |
| Load Test Target | — | — | 120 TPS |

Peak TPS assumption: 10% of daily volume processed in a 1.4-hour peak window (e.g., lunchtime / payday).

### Critical Path Timing Budget

See [Data Flow Patterns: Timing Budget](04-data-flow-patterns.md#timing-budget) for the detailed per-step allocation.

Total budget: **1,800ms** execution time + 200ms buffer = **2,000ms P99 SLO** (see [Key Metrics](01-system-overview.md#key-metrics)).

---

## Auto-Scaling Configuration

### Horizontal Pod Autoscaler (HPA)

All payment-path services use HPA with the following profiles:

| Service | Min Replicas | Max Replicas | Scale-Up Metric | Scale-Up Threshold |
|---------|-------------|-------------|-----------------|-------------------|
| Authorization Service | 3 | 20 | CPU | 70% |
| Fraud Detection Service | 2 | 15 | CPU + Request Rate | 70% CPU or 30 req/s/pod |
| Payment Service | 3 | 20 | CPU | 70% |
| Ledger Service | 2 | 10 | CPU | 60% (Oracle connection pool limit) |
| Settlement Service | 2 | 10 | CPU | 70% |
| Partner Gateway Service | 2 | 10 | CPU + Request Rate | 70% |
| Webhook Delivery Service | 2 | 10 | Queue Depth | MSK consumer lag > 1,000 |
| Notification Service | 2 | 8 | Queue Depth | MSK consumer lag > 500 |
| Reconciliation Service | 1 | 5 | CPU (batch only) | 70% |
| API Gateway (Kong) | 3 | 20 | CPU + Connections | 70% |

**Scale-up policy**: Add 2 pods when threshold exceeded for 2 consecutive minutes.
**Scale-down policy**: Remove 1 pod when below 40% threshold for 10 minutes (conservative — avoid thrashing).

### Cluster Autoscaler (EKS Node Groups)

- **Node type**: `m6i.xlarge` (4 vCPU, 16 GiB) for payment services; `r6i.large` (2 vCPU, 16 GiB) for Fraud Detection (ML inference)
- **Min nodes**: 6 (maintains 3-AZ spread)
- **Max nodes**: 30
- **Scale-out trigger**: Pending pods for > 2 minutes

---

## Database Scaling

### PostgreSQL (AWS RDS Multi-AZ)

| Service Database | Instance Class | Max Connections | Read Replicas |
|-----------------|---------------|----------------|---------------|
| auth_db | db.r6g.large | 500 | 1 (read replicas for reporting) |
| payment_db | db.r6g.xlarge | 1,000 | 1 |
| fraud_db | db.r6g.large | 500 | — |
| settlement_db | db.r6g.large | 500 | 1 |
| partner_db | db.r6g.medium | 200 | — |

- **Connection Pooling**: PgBouncer sidecar per service (transaction pooling mode); max pool size per service = 50
- **Multi-AZ**: All production databases are Multi-AZ for automatic failover (RPO < 1 minute for RDS)

### Oracle Ledger Database

- **Instance**: AWS RDS for Oracle — `db.r6g.2xlarge` (8 vCPU, 64 GiB)
- **Connection Pool**: HikariCP in Ledger Service; max 50 connections (Oracle licensing constraint)
- **Performance Budget**: 300ms max per ledger write (see [Timing Budget](04-data-flow-patterns.md#timing-budget))
- **Oracle Data Guard**: Synchronous replication to standby; automatic failover; RPO < 30 seconds (see [Key Metrics](01-system-overview.md#key-metrics))

### Redis (AWS ElastiCache)

- **Cluster mode**: Enabled; 3 shards × 1 replica = 6 nodes
- **Node type**: `cache.r6g.large`
- **Use cases**: Rate limiting counters (TTL 60s), idempotency key cache (TTL 24h), JWT session cache (TTL 15min)

---

## Kafka Scaling (Amazon MSK)

Per [Integration Points: Topic Configuration](05-integration-points.md#topic-configuration):

- **Brokers**: 3 brokers across 3 AZs
- **Broker type**: `kafka.m5.xlarge` (4 vCPU, 16 GiB)
- **Partition count**: Designed for 10× volume — `payment.events` at 12 partitions supports 60+ TPS with consumer headroom
- **Consumer scaling**: Kafka consumer groups scale by adding pods (HPA queue-depth metric via KEDA)
- **Throughput benchmark**: MSK m5.xlarge supports ~300 MB/s; payment event payload ~2KB → 150,000 events/s capacity vs 60 TPS requirement (2,500× headroom)

---

## Performance Optimization Strategies

### Critical Path Optimizations

| Strategy | Services | Expected Benefit |
|----------|----------|----------------|
| gRPC over HTTP/2 (binary protocol) | Auth, Fraud, Ledger, Payment | 30–40% latency reduction vs REST+JSON for internal calls |
| Connection pooling (PgBouncer) | All PostgreSQL services | Eliminates connection establishment overhead; reduces Oracle license cost |
| Redis idempotency cache (TTL 24h) | Payment Service | Sub-1ms duplicate detection vs database lookup |
| Async offload (Kafka) for non-critical path | Settlement, Notification, Webhook | Decouples settlement from authorization; auth path unblocked by settlement work |
| Warm connection pool | All services | Pre-warm HPA minimum replicas maintain hot connections; no cold-start on scale-up |

### Fraud Detection Latency

- Fraud Detection Service must respond within **500ms** on the critical path
- Strategy: Lightweight rule-engine (< 50ms) executes inline; heavy ML inference is async
- Inline rules cover high-confidence patterns (velocity checks, amount anomalies, known fraud lists)
- ML model inference (PyTorch, scikit-learn) runs asynchronously — results feed back for future scoring but do not block the current transaction

### Oracle Ledger Performance

- Oracle OLTP-optimized tablespace with SSD storage
- Batch ledger writes avoided — each transaction commits its own ledger entry (ACID, not batch)
- Ledger read for reconciliation uses a dedicated read replica (separate JDBC pool)

---

## Load Testing Requirements

Per [Principle P5](02-architecture-principles.md#principle-5-design-for-10-scale):

| Test Type | Target TPS | Duration | Pass Criteria |
|-----------|-----------|---------|---------------|
| Sustained load | 60 TPS | 30 minutes | P99 ≤ 2,000ms; zero transaction loss |
| Peak burst | 120 TPS | 5 minutes | P99 ≤ 2,500ms; zero errors |
| Soak test | 30 TPS | 4 hours | No memory leaks; stable latency |
| Fraud hold spike | 60 TPS + 10% fraud rate | 10 minutes | Fraud holds processed without auth path degradation |

**Tool**: k6 (open source load testing)

**Schedule**: Load tests run before every release to production; baseline test suite runs nightly in the staging environment.

---

## Disaster Recovery

Per [Key Metrics](01-system-overview.md#key-metrics): RTO < 5 minutes, RPO < 30 seconds for Tier 1 services.

| Component | DR Strategy | RTO | RPO |
|-----------|------------|-----|-----|
| EKS Payment Services | Multi-AZ pods; warm standby in `us-west-2` | < 5 min | < 30s (Kafka replication) |
| RDS PostgreSQL | Multi-AZ automatic failover | < 2 min | < 1 min |
| Oracle Ledger | Oracle Data Guard (synchronous) | < 5 min | < 30s |
| MSK Kafka | 3-AZ replication; topic replication factor 3 | < 2 min | 0 (synchronous replication) |
| Redis ElastiCache | Cluster mode with replicas | < 2 min | < 1 min |
| API Gateway | AWS-managed; multi-AZ by default | N/A | N/A |

**Runbooks**: Automated DR runbooks for each failover scenario; tested quarterly.

---

## SLO Monitoring & Alerts

| Alert | Threshold | Severity | Action |
|-------|-----------|---------|--------|
| Payment P99 > 1,500ms | 5-minute window | Warning | Slack #payments-alerts |
| Payment P99 > 2,000ms | 2-minute window | Critical (P1) | Page on-call SRE + Engineering Lead |
| Transaction error rate > 1% | 5-minute window | Warning | Slack alert |
| Transaction error rate > 5% | 2-minute window | Critical (P1) | Page on-call SRE |
| MSK consumer lag > 10,000 events | Any topic | Warning | Slack alert |
| Oracle ledger latency > 500ms | 2-minute window | Warning | Slack + DB team alert |
| HPA at max replicas | Any critical service | Warning | Slack — may need node group scale-out |
