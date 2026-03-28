# References

[Architecture](../ARCHITECTURE.md) > References

---

## Architecture Decision Records

| ADR | Title | Status | File |
|-----|-------|--------|------|
| ADR-001 | Microservices Architecture Selection | Accepted | [adr/ADR-001-microservices-architecture.md](../adr/ADR-001-microservices-architecture.md) |
| ADR-002 | Retain Oracle for Ledger Persistence | Accepted | [adr/ADR-002-oracle-ledger-persistence.md](../adr/ADR-002-oracle-ledger-persistence.md) |
| ADR-003 | Event-Driven Payment Processing with Kafka | Accepted | [adr/ADR-003-event-driven-payment-processing.md](../adr/ADR-003-event-driven-payment-processing.md) |
| ADR-004 | AWS-Only Cloud Platform | Accepted | [adr/ADR-004-aws-cloud-platform.md](../adr/ADR-004-aws-cloud-platform.md) |
| ADR-005 | Saga Pattern for Distributed Transactions | Accepted | [adr/ADR-005-saga-pattern-distributed-transactions.md](../adr/ADR-005-saga-pattern-distributed-transactions.md) |

---

## Standards & Regulations

| Standard | Version | Relevance |
|---------|---------|-----------|
| PCI-DSS | 4.0 | Cardholder data security; Level 1 certification required |
| GDPR | 2018 (EU) | EU customer personal data processing |
| ISO 20022 | 2022 | Banking message standard (Bank A partner format) |
| SWIFT MT103 | — | Wire transfer message format (Bank A settlement) |
| OpenAPI | 3.1 | REST API specification standard |
| AsyncAPI | 3.0 | Kafka event specification standard |
| W3C Trace Context | 1.0 | Distributed tracing propagation standard |

---

## Technology Documentation

| Technology | Documentation URL |
|-----------|------------------|
| Amazon EKS | https://docs.aws.amazon.com/eks/ |
| Amazon MSK | https://docs.aws.amazon.com/msk/ |
| AWS RDS for PostgreSQL | https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html |
| AWS RDS for Oracle | https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Oracle.html |
| AWS CloudHSM | https://docs.aws.amazon.com/cloudhsm/ |
| AWS Secrets Manager | https://docs.aws.amazon.com/secretsmanager/ |
| Apache Kafka | https://kafka.apache.org/documentation/ |
| Istio Service Mesh | https://istio.io/latest/docs/ |
| Spring Boot | https://spring.io/projects/spring-boot |
| FastAPI | https://fastapi.tiangolo.com/ |
| NestJS | https://nestjs.com/ |
| ArgoCD | https://argo-cd.readthedocs.io/ |
| Terraform | https://developer.hashicorp.com/terraform/docs |
| OpenTelemetry | https://opentelemetry.io/docs/ |
| Keycloak | https://www.keycloak.org/documentation |

---

## Source Documents

| Document | Description |
|---------|-------------|
| [PRODUCT_OWNER_SPEC.md](../../../evals/files/PRODUCT_OWNER_SPEC.md) | Product Owner Specification — PayStream (FinTech Corp) |

---

## Contact

| Role | Name | Responsibility |
|------|------|----------------|
| Product Owner | Maria Chen | Business requirements, feature prioritization |
| Engineering Lead | Carlos Mendez | Technical decisions, architecture review |
| Compliance Officer | Janet Kirk | PCI-DSS certification, compliance gating |
