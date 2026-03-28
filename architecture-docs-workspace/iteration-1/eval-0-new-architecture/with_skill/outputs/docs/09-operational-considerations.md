# Section 11: Operational Considerations

[Architecture](../ARCHITECTURE.md) > Operational Considerations

---

## Overview

PayStream is operated by 2 SREs supported by an 8-engineer team. Per [Principle P6: Operational Simplicity for Small Teams](02-architecture-principles.md#principle-6-operational-simplicity-for-small-teams), the operational model relies on AWS managed services, GitOps-based deployment, and automated runbooks to minimize toil. This section covers deployment, environments, DR, incident response, monitoring, and cost.

---

## Deployment Model

### GitOps Pipeline

All deployments follow a GitOps model via ArgoCD (see [Technology Stack](06-technology-stack.md#devops--cicd)):

1. **Developer pushes code** → GitHub PR → CI pipeline (GitHub Actions) runs:
   - Unit tests, integration tests (Testcontainers)
   - Contract tests (Pact)
   - SAST (SonarQube) — must pass quality gate
   - Container image scan (Trivy) — block on CRITICAL CVEs
   - Docker image build + push to Amazon ECR
2. **ArgoCD detects** new image tag in Git manifest → syncs to target environment
3. **Deployment strategy**: Rolling update (max unavailable: 0, max surge: 1) for zero-downtime deployment
4. **Canary releases** for major changes: Istio traffic split (5% → 20% → 50% → 100%) with automated rollback on error rate increase

### Deployment Environments

| Environment | Purpose | Scale | Access |
|-------------|---------|-------|--------|
| Development | Feature branch testing | ~20% of prod scale | Developers |
| Staging | Pre-release validation + load tests | ~50% of prod scale | All team |
| Production | Live traffic | Full scale | SRE + Engineering Lead |
| DR (us-west-2) | Warm standby for Tier 1 | ~100% of prod scale | SRE only |

### Release Cadence

- **MVP (Month 3)**: Card payment flow; bi-weekly releases
- **Full Platform (Month 6)**: All services; weekly releases targeting
- **Post-GA**: Continuous deployment for non-critical services; scheduled releases for CDE services (PCI-DSS change management requirement)

---

## Infrastructure as Code

All AWS resources defined in Terraform (see [Technology Stack](06-technology-stack.md)):

- **Repository**: `infra/terraform/` (mono-repo with per-environment workspace)
- **Modules**: EKS cluster, MSK cluster, RDS instances, ElastiCache, VPC, IAM roles, CloudHSM
- **State**: Terraform state in S3 + DynamoDB lock; one state file per environment
- **Plan/Apply**: Terraform plan runs in CI for PRs; `terraform apply` gated by SRE approval in GitHub Actions workflow

---

## Monitoring & Observability

### Monitoring Stack

Per [Technology Stack: Observability](06-technology-stack.md#observability):

- **Metrics**: AWS CloudWatch (custom metrics via SDK + Container Insights for EKS)
- **Tracing**: OpenTelemetry SDK → AWS X-Ray (all services)
- **Logging**: Structured JSON → CloudWatch Logs; CloudWatch Logs Insights for query
- **Dashboards**: CloudWatch Dashboards:
  - Payment Platform Overview (TPS, P99 latency, error rate, availability)
  - Per-Service Dashboard (each service: latency, error rate, DB pool, HPA)
  - Kafka Lag Dashboard (consumer group lag per topic)
  - Oracle Ledger Dashboard (connection pool, query latency, replication lag)

### Alerting & On-Call

| Severity | Examples | Channel | Response SLA |
|---------|---------|---------|-------------|
| P1 (Critical) | P99 > 2s, error rate > 5%, zero healthy pods | PagerDuty (immediate page) | 5 minutes acknowledgement |
| P2 (High) | P99 > 1.5s, MSK consumer lag > 10K, DR failover | PagerDuty (urgent) | 15 minutes |
| P3 (Warning) | HPA at max, Oracle latency > 500ms | Slack `#payments-alerts` | Next business day |
| P4 (Info) | Deployment complete, load test results | Slack `#payments-deployments` | No response required |

**On-call rotation**: 2 SREs in weekly rotation; engineering team secondary on-call for P1s.

### SLO Tracking

See [Scalability & Performance: SLO Monitoring & Alerts](08-scalability-and-performance.md#slo-monitoring--alerts) for SLO thresholds. SLO burn rate alerting configured per Google SRE book model:
- 2% burn rate over 1 hour → P2 alert
- 10% burn rate over 5 minutes → P1 alert

---

## Disaster Recovery

### DR Objectives

Per [Key Metrics](01-system-overview.md#key-metrics):
- **RTO**: < 5 minutes for Tier 1 services
- **RPO**: < 30 seconds for Tier 1 services

### Tier 1 Services (Payment Critical Path)

Services: Authorization Service, Payment Service, Ledger Service, API Gateway

**DR Strategy**: Warm standby in `us-west-2`

- EKS cluster pre-deployed in `us-west-2` with minimum replicas running
- Kafka MSK cluster in `us-west-2` replicates `payment.events` via MSK Replicator (async, lag < 30s)
- Oracle Data Guard synchronous replication; standby DB in `us-west-2` promotes within 2 minutes
- Route 53 health checks on API Gateway endpoints; DNS failover to `us-west-2` within 3 minutes of primary failure

**Failover Runbook** (automated):
1. CloudWatch alarm detects primary region health check failure (2 consecutive failures = 60s)
2. Route 53 DNS failover switches traffic to `us-west-2` (TTL 60s)
3. EKS HPA in `us-west-2` scales up from warm standby to full capacity
4. SRE receives P1 PagerDuty alert; validates failover in DR monitoring dashboard
5. Estimated total RTO: ~4 minutes

**Failback**: Manual failback after primary region recovery; SRE validates data consistency before switching DNS back.

### Tier 2 Services (Settlement, Reconciliation, Notifications)

**DR Strategy**: Event replay from Kafka (RPO determined by Kafka retention = 7 days for `payment.events`)

- Services restart in DR region and replay unprocessed events from Kafka consumer group offset
- No real-time standby required; acceptable delay during DR scenario
- RTO: < 30 minutes (event replay time depends on backlog)

---

## Backup & Recovery

| Data | Backup Method | Frequency | Retention | RTO |
|------|-------------|-----------|-----------|-----|
| RDS PostgreSQL | Automated snapshots (AWS) | Daily + continuous PITR | 35 days | < 1 hour (PITR) |
| Oracle Ledger DB | Oracle RMAN + RDS automated | Daily + continuous | 35 days | < 1 hour |
| S3 Audit Store | S3 Object Lock (WORM) | Continuous (event stream) | 7 years | Immediate (read) |
| Kafka (MSK) | Topic retention | Per-topic (7–365 days) | See [Integration Points](05-integration-points.md#topic-configuration) | Replay (minutes to hours) |
| Kubernetes manifests | Git repository | Continuous | Indefinite | < 5 min (ArgoCD re-sync) |
| Secrets (Secrets Manager) | AWS managed replication | Continuous | 90-day version history | < 1 min |

---

## Change Management

### PCI-DSS Change Requirements

All changes to CDE-in-scope services (Authorization Service, Ledger Service) require:
1. Change request documented in ticketing system (Jira)
2. Security review sign-off (Janet Kirk or delegated compliance team member)
3. Deployment only during approved change window
4. Post-deployment validation against PCI-DSS controls

### Non-CDE Services

Standard GitOps flow: PR approval by 1 peer engineer + passing CI → ArgoCD deploys to staging → SRE promotes to production.

---

## Incident Response

### Severity Classification

| Severity | Definition | Examples |
|---------|-----------|---------|
| P1 | Complete payment processing outage | API Gateway down, Oracle unavailable, 0 healthy pods |
| P2 | Partial outage or SLO breach | P99 > 2s for 10+ minutes, fraud detection unavailable |
| P3 | Degraded performance | Single service elevated latency, webhook delivery delays |
| P4 | Minor issue | Individual transaction failure, cosmetic alert |

### Incident Runbooks

Automated runbooks are maintained in the `runbooks/` repository and linked from PagerDuty alerts:

| Runbook | Trigger | Actions |
|---------|--------|---------|
| `payment-service-down.md` | 0 healthy Payment Service pods | Check EKS events, review HPA state, force pod restart |
| `oracle-latency-high.md` | Oracle latency > 500ms | Check connection pool, RDS performance insights |
| `kafka-consumer-lag.md` | MSK lag > 10,000 | Scale consumer group, check dead-letter queue |
| `dr-failover.md` | Primary region outage | Execute DNS failover, validate DR cluster |
| `fraud-hold-spike.md` | Fraud hold rate > 5% | Alert fraud team, review fraud model inputs |

---

## Cost Estimation

| Service | Resource | Estimated Monthly Cost (USD) |
|---------|----------|------------------------------|
| AWS EKS | 1 cluster + ~15 m6i.xlarge nodes | ~$3,000 |
| Amazon MSK | 3× kafka.m5.xlarge brokers | ~$900 |
| AWS RDS (PostgreSQL) | 5× db.r6g.large Multi-AZ | ~$2,500 |
| AWS RDS (Oracle) | 1× db.r6g.2xlarge | ~$2,000 |
| AWS ElastiCache (Redis) | 6 nodes cache.r6g.large | ~$900 |
| AWS CloudHSM | 2 HSM instances | ~$3,000 |
| AWS API Gateway | ~500K/day requests | ~$150 |
| S3 + Athena (Audit) | ~10GB/day + queries | ~$300 |
| CloudWatch / X-Ray | Logs + metrics + traces | ~$500 |
| DR Warm Standby (us-west-2) | Reduced scale | ~$2,000 |
| **Estimated Total** | | **~$15,250/month** |

> Note: Costs will increase with transaction volume growth. Estimated costs at 500K/day target (18-month) may reach ~$25,000/month. Reserved Instances and Savings Plans should be evaluated after MVP baseline is established.

---

## Operational Runbook Catalog

| Runbook | Location | Last Tested |
|---------|----------|-------------|
| Payment Service Scale-Out | `runbooks/payment-service-scaleout.md` | [To be defined] |
| Oracle DB Failover | `runbooks/oracle-failover.md` | [To be defined] |
| Kafka Consumer Lag Recovery | `runbooks/kafka-lag-recovery.md` | [To be defined] |
| DR Failover (us-west-2) | `runbooks/dr-failover.md` | [To be defined] |
| PCI-DSS Incident Response | `runbooks/pci-incident-response.md` | [To be defined] |
| GDPR Data Erasure | `runbooks/gdpr-erasure.md` | [To be defined] |
