# Section 7 — Technology Stack

## 7.1 Stack Overview

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Container Orchestration | AWS EKS (Kubernetes 1.28+) | AWS-managed; aligns with existing enterprise agreement; strong ecosystem |
| Service Mesh | AWS App Mesh (Envoy) | mTLS between services without application code changes; aligns with PCI mTLS requirement |
| Container Registry | Amazon ECR | Native AWS integration; image scanning (ECR Enhanced Scanning with Inspector) |
| Event Streaming | Amazon MSK (Apache Kafka 3.5) | Managed Kafka; durable, exactly-once, replay capability; 99.99% AWS SLA |
| Schema Registry | AWS Glue Schema Registry | Avro schema enforcement; native MSK integration |
| API Gateway Runtime | Node.js 20 + Fastify | Low-latency request routing; mature JWT libraries |
| Payment Processor Runtime | Java 21 (Spring Boot 3) | Mature payment domain libraries (Spring JDBC, HikariCP); virtual threads for high concurrency |
| Tokenisation Runtime | Go 1.22 | Low-latency, low-overhead; PKCS#11 HSM binding |
| Fraud Detection Runtime | Python 3.12 (FastAPI + XGBoost) | ML ecosystem; FastAPI async for high-throughput scoring |
| Ledger Runtime | Java 21 (Spring Boot 3) | Robust Oracle JDBC; Spring transaction management |
| Webhook / Bulk Ingest | Go 1.22 / Python 3.12 | Go for outbound HTTP throughput; Python for pandas-based file parsing |
| Reconciliation | Python 3.12 + pandas + Celery | Data processing; scheduling |
| Ledger DB | Oracle Database 19c | Finance mandate; existing instance |
| Payments DB | Amazon Aurora PostgreSQL 15 | Managed; high availability; serverless v2 for variable load |
| Idempotency Store | Amazon DynamoDB | Sub-millisecond conditional writes; TTL support |
| Cache / Feature Store | Amazon ElastiCache Redis 7 | Sub-ms reads; Lua scripting for atomic rate-limit operations |
| Object Storage | Amazon S3 | Bulk files, reports, model artefacts, audit archives |
| Key Management (PCI) | AWS CloudHSM | FIPS 140-2 Level 3; required for PCI-DSS Level 1 |
| Secrets Management | AWS Secrets Manager | Automatic rotation; CSI driver injection into pods |
| Identity (Consumer) | Amazon Cognito | Managed OIDC; MFA; scalable |
| CDN / DDoS | Amazon CloudFront + AWS Shield Standard | Edge caching for static assets; DDoS protection |
| WAF | AWS WAF | OWASP rules; custom rate-limit rules |
| Observability — Logs | Amazon CloudWatch Logs | Centralised; structured JSON logs; log group per service |
| Observability — Metrics | Amazon CloudWatch Metrics + Prometheus | CloudWatch for infra; Prometheus (managed via ADOT) for application metrics |
| Observability — Traces | AWS X-Ray | Distributed tracing; service map for latency debugging |
| Observability — Alerts | Amazon CloudWatch Alarms + PagerDuty | P1 alerts page on-call SRE via PagerDuty |
| CI/CD | GitHub Actions + ArgoCD | GitOps; environment promotion via PR; ArgoCD sync to EKS |
| IaC | AWS CDK (TypeScript) | Type-safe; co-located with team's primary language; CDK Pipelines for self-mutation |
| SFTP | AWS Transfer Family | Managed SFTP for partner settlement file ingestion |
| Email | Amazon SES | Transactional email; SPF/DKIM managed |
| Push Notifications | Amazon SNS | FCM/APNs routing |
| SMS | Amazon Pinpoint | SMS delivery with delivery receipts |

## 7.2 Language Version Matrix

| Language | Version | Services |
|----------|---------|---------|
| Java | 21 (LTS) | Payment Processor, Ledger Service |
| Go | 1.22 | Tokenisation Service, Webhook Dispatcher |
| Python | 3.12 | Fraud Detection, Bulk Ingest, Reconciliation |
| Node.js | 20 (LTS) | API Gateway Service, Notification Service |
| TypeScript | 5.x | AWS CDK infrastructure |

## 7.3 Third-Party Libraries (Key)

| Library | Language | Purpose |
|---------|---------|---------|
| Spring Boot 3 | Java | Application framework, dependency injection, data access |
| HikariCP | Java | JDBC connection pool |
| Fastify | Node.js | HTTP server (API Gateway, Notification) |
| FastAPI | Python | HTTP server (Fraud Detection, Bulk Ingest) |
| XGBoost | Python | ML fraud scoring model |
| pandas | Python | Bulk file parsing, reconciliation data processing |
| Debezium | Java (MSK Connect) | CDC for outbox pattern relay |
| Flyway | Java | Oracle schema migration management |
| AWS SDK v2 | Java / Python / Go / Node.js | AWS service clients |

## 7.4 Dependency Version Governance

- All direct dependencies pinned in `pom.xml` / `go.sum` / `requirements.txt` / `package.json`.
- Dependabot enabled on all repositories; security advisories auto-create PRs.
- Monthly dependency review meeting; critical CVEs must be patched within 48 hours (P1 SLA).
- Base images: `amazoncorretto:21-alpine`, `golang:1.22-alpine`, `python:3.12-slim`, `node:20-alpine`. Rebuilt weekly via CI pipeline.
