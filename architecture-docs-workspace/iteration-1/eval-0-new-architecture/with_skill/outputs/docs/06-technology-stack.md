# Section 8: Technology Stack

[Architecture](../ARCHITECTURE.md) > Technology Stack

---

## Overview

The PayStream technology stack is shaped by three constraints from the [System Overview](01-system-overview.md): AWS-only cloud deployment ([ADR-004](../adr/ADR-004-aws-cloud-platform.md)), Oracle ledger retention ([ADR-002](../adr/ADR-002-oracle-ledger-persistence.md)), and operability by an 8-engineer / 2-SRE team ([Principle P6](02-architecture-principles.md#principle-6-operational-simplicity-for-small-teams)). Managed AWS services are preferred over self-operated infrastructure.

---

## Runtime Languages & Frameworks

| Layer | Language | Framework | Version | Rationale |
|-------|----------|-----------|---------|-----------|
| Payment critical-path services | Java | Spring Boot | 3.2.x | Strong ecosystem, PCI-DSS library support, battle-tested at financial scale |
| Authorization Service | Java | Spring Boot | 3.2.x | Spring Security, HSM integration via PKCS#11 |
| Fraud Detection Service | Python | FastAPI | 0.111.x | ML model inference (scikit-learn / PyTorch), async I/O |
| Reconciliation Service | Python | FastAPI | 0.111.x | Data processing, pandas for aggregations |
| Partner Gateway / Webhook / Notification | Node.js | NestJS | 10.x | Event-driven I/O, fast webhook fan-out |
| Infrastructure as Code | HCL | Terraform | 1.8.x | All AWS resources |
| CI/CD Pipelines | YAML | GitHub Actions | — | Build, test, security scan |
| GitOps deployment | YAML | ArgoCD | 2.10.x | Kubernetes manifest sync from Git |

---

## Cloud Platform (AWS)

Per [ADR-004](../adr/ADR-004-aws-cloud-platform.md), all infrastructure runs exclusively on AWS.

| AWS Service | Version / Tier | Purpose |
|-------------|----------------|---------|
| AWS EKS | 1.29 | Managed Kubernetes; container orchestration |
| Amazon MSK | Kafka 3.5 | Managed event streaming; Kafka backbone |
| AWS RDS (PostgreSQL) | PostgreSQL 15.4 | Per-service relational databases |
| AWS ElastiCache (Redis) | Redis 7.2 | Session cache, rate limiting, idempotency keys |
| AWS API Gateway | v2 (HTTP API) | Edge routing, JWT auth, WAF integration |
| AWS CloudHSM | — | PCI-DSS cryptographic operations (HSM-backed keys) |
| AWS Secrets Manager | — | Secrets rotation for all credentials |
| AWS S3 | — | Audit event archive (S3 Object Lock for immutability) |
| AWS Athena | — | Query interface for audit log in S3 |
| AWS Glue Schema Registry | — | Kafka event schema versioning |
| AWS CloudWatch | — | Metrics, logs, alarms |
| AWS X-Ray | — | Distributed tracing |
| AWS CloudTrail | — | Infrastructure audit log |
| AWS Security Hub | — | Compliance posture (PCI-DSS checks) |
| AWS WAF | — | OWASP Top 10 protection on API Gateway |
| AWS CloudFront | — | CDN for consumer app assets (future) |
| AWS IAM | — | Identity and access management |
| AWS VPC | — | Network isolation, PCI scope boundary |

**Regions**:
- Primary: `us-east-1` (Virginia) — main production deployment
- DR: `us-west-2` (Oregon) — warm standby for Tier 1 services
- EU data residency: `eu-west-1` (Ireland) — EU customer data per GDPR

---

## Messaging & Streaming

| Component | Technology | Version | Configuration |
|-----------|-----------|---------|---------------|
| Event bus | Amazon MSK (Apache Kafka) | 3.5 | 3-broker cluster, 3 AZs, replication factor 3 |
| Schema registry | AWS Glue Schema Registry | — | Backward compatibility enforced |
| Kafka client | Apache Kafka Java client | 3.5.x | EOS (exactly-once semantics) enabled |
| Kafka client (Python) | confluent-kafka-python | 2.4.x | Fraud Detection, Reconciliation services |
| Kafka client (Node.js) | KafkaJS | 2.2.x | Partner Gateway, Webhook, Notification services |

---

## Data Storage

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Service databases | PostgreSQL | 15.4 | AWS RDS Multi-AZ; automated backups |
| Ledger database | Oracle Database | 19c | Existing; AWS RDS for Oracle; RAC not available on RDS → Oracle Data Guard |
| Cache / sessions | Redis | 7.2 | AWS ElastiCache cluster mode; TLS + AUTH |
| Audit archive | AWS S3 + Athena | — | S3 Object Lock (WORM); 1 year hot, 7 years Glacier |
| Database migrations | Flyway | 10.x | Java services; Alembic for Python services |

---

## Service Communication

| Concern | Technology | Notes |
|---------|-----------|-------|
| Synchronous (internal) | gRPC over HTTP/2 | Critical payment path |
| Synchronous (external / partner) | REST over HTTP/2 | Partner Gateway, API Gateway |
| Service mesh | Istio | 1.21.x on EKS; mTLS, circuit breaking, tracing |
| API contracts | OpenAPI 3.1 | All REST services; generated from code |
| gRPC contracts | Protocol Buffers | All gRPC services; versioned .proto files in shared repo |
| Async events | Apache Kafka via MSK | All event-driven flows |

---

## Security

| Concern | Technology | Version | Notes |
|---------|-----------|---------|-------|
| Secret management | AWS Secrets Manager | — | Rotation every 90 days |
| HSM / crypto | AWS CloudHSM | — | PCI-DSS HSM for card auth key signing |
| Certificate authority | AWS Private CA | — | mTLS certificates for service mesh |
| TLS | TLS 1.3 | — | Enforced at all ingress and service mesh |
| JWT / OAuth | Keycloak | 24.x | OAuth 2.0 / OIDC for consumer clients |
| Container security | Trivy | — | Image scanning in CI/CD pipeline |
| SAST | SonarQube | — | Static analysis; quality gate in CI |
| Dependency scanning | OWASP Dependency-Check | — | CI/CD step; CVE detection |
| WAF | AWS WAF | — | OWASP Top 10 managed rule group |

---

## Observability

| Concern | Technology | Version | Notes |
|---------|-----------|---------|-------|
| Metrics | AWS CloudWatch | — | Custom metrics via CloudWatch SDK |
| Distributed tracing | OpenTelemetry + AWS X-Ray | OTEL 1.x | All services instrument with OTEL SDK; exporter → X-Ray |
| Logging | Structured JSON → CloudWatch Logs | — | Correlation ID in all log lines |
| Alerting | CloudWatch Alarms + PagerDuty | — | P1/P2 alerts page on-call SRE |
| Dashboards | CloudWatch Dashboards | — | Per-service and platform-wide |
| APM | AWS X-Ray Service Map | — | End-to-end trace visualization |

---

## DevOps & CI/CD

| Concern | Technology | Version | Notes |
|---------|-----------|---------|-------|
| Source control | GitHub | — | Mono-repo per service + shared libraries |
| CI/CD | GitHub Actions | — | Build, test, scan, push image |
| Container registry | Amazon ECR | — | Per-service image repository |
| GitOps | ArgoCD | 2.10.x | Sync Kubernetes manifests from Git |
| Container orchestration | Kubernetes (EKS) | 1.29 | Namespace-per-service; RBAC enforced |
| IaC | Terraform | 1.8.x | Modules for EKS, MSK, RDS, ElastiCache |
| Secrets in IaC | AWS Secrets Manager (no Vault) | — | Per [Principle P6](02-architecture-principles.md#principle-6-operational-simplicity-for-small-teams) |
| Load testing | k6 | — | Payment path at 2× peak (120 TPS) |
| Contract testing | Pact | 12.x | Consumer-driven contracts between services |

---

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cloud provider | AWS only | Existing enterprise agreement; [ADR-004](../adr/ADR-004-aws-cloud-platform.md) |
| Ledger database | Oracle (retained) | Finance team constraint; [ADR-002](../adr/ADR-002-oracle-ledger-persistence.md) |
| Event streaming | Amazon MSK (Kafka) | Exactly-once semantics; [ADR-003](../adr/ADR-003-event-driven-payment-processing.md) |
| Critical-path language | Java/Spring Boot | Financial ecosystem maturity, PCI-DSS library support |
| Service mesh | Istio | mTLS enforcement (PCI-DSS); traffic management |
| Secrets | AWS Secrets Manager | Managed rotation; no self-hosted Vault operational overhead |
| Distributed tracing | OpenTelemetry + X-Ray | Vendor-agnostic instrumentation; AWS-native backend |
