# Section 9: Security Architecture

[Architecture](../ARCHITECTURE.md) > Security Architecture

---

## Overview

PayStream's security architecture is governed by [Principle P2: Security by Design (PCI-DSS First)](02-architecture-principles.md#principle-2-security-by-design-pci-dss-first) and must satisfy PCI-DSS Level 1 certification by month 7 and GDPR for EU customers. Security controls are embedded at every layer: network, service mesh, application, data, and infrastructure.

---

## Regulatory Compliance Framework

| Regulation | Scope | Key Requirements |
|-----------|-------|-----------------|
| PCI-DSS Level 1 | Cardholder data environment (CDE) | Network segmentation, encryption, access control, audit logging, penetration testing, HSM for crypto |
| GDPR | EU customer personal data | Data minimization, right to erasure, data residency (eu-west-1), breach notification |

---

## PCI-DSS Cardholder Data Environment (CDE) Boundary

The CDE is isolated within a dedicated AWS VPC subnet with strict ingress/egress controls:

**In-scope services** (CDE):
- Authorization Service (handles card authorization requests)
- Ledger Service (stores transaction records)
- AWS CloudHSM (key management)

**Out-of-scope services** (non-CDE VPC):
- All other microservices (Payment, Fraud, Settlement, Partner Gateway, etc.)
- Communication with CDE services goes through explicit allow-listed security group rules

**Network Segmentation**:
- AWS VPC with separate subnets for CDE and non-CDE workloads
- No internet-facing resources in CDE subnet
- API Gateway terminates external TLS before any traffic reaches the CDE
- Security Group rules: deny-all default; explicit allow per service-to-service route

---

## Authentication & Authorization

### External Client Authentication (Consumer Apps)

- **Protocol**: OAuth 2.0 / OIDC with PKCE flow
- **Identity Provider**: Keycloak (self-hosted on EKS, multi-AZ)
- **Token**: JWT (RS256); 15-minute expiry; refresh token rotation
- **Validation**: API Gateway validates JWT signature on every request (public key from Keycloak JWKS endpoint)

### Business Partner Authentication

- **Protocol**: API Key per partner, sent in `X-API-Key` header
- **Key Storage**: AWS Secrets Manager per partner; keys rotated annually or on breach
- **Rate Limiting**: Per-partner rate limits enforced at API Gateway (Kong)

### Service-to-Service Authentication (Internal)

- **Protocol**: mTLS enforced by Istio service mesh for all intra-cluster communication
- **Certificate Authority**: AWS Private CA issues certificates per service identity
- **Certificate Rotation**: Automatic rotation via Istio's cert-manager integration (90-day certificates, rotated at 80% lifetime)

### Operations & Internal Tools

- **Protocol**: OAuth 2.0 + RBAC; operations dashboard access gated by Keycloak roles
- **MFA**: Required for all operations and compliance team access
- **Least Privilege**: Kubernetes RBAC + AWS IAM roles scoped per service; no wildcard permissions

---

## Encryption

### Encryption in Transit

| Channel | Protocol | Notes |
|---------|---------|-------|
| Client → API Gateway | TLS 1.3 | HTTPS enforced; TLS 1.2 minimum, 1.3 preferred |
| API Gateway → Services | TLS 1.3 | Via Istio mTLS; certificates from AWS Private CA |
| Service → Service | mTLS (TLS 1.3) | Istio enforces mutual authentication |
| Service → MSK (Kafka) | TLS 1.3 | AWS MSK encryption in transit |
| Service → RDS (PostgreSQL) | TLS 1.3 | SSL enforced on RDS; certificate pinning |
| Service → Oracle | TLS 1.3 | Oracle Advanced Security; JDBC SSL |
| Service → ElastiCache (Redis) | TLS 1.3 | In-transit encryption + AUTH token |
| Service → S3 | HTTPS (AWS SDK) | TLS 1.3 via AWS SDK |

### Encryption at Rest

| Data Store | Encryption | Key Management |
|-----------|-----------|----------------|
| RDS (PostgreSQL) | AES-256 (AWS-managed RDS encryption) | AWS KMS CMK per database |
| Oracle DB | AES-256 (Oracle Transparent Data Encryption) | Oracle wallet; key in AWS Secrets Manager |
| ElastiCache (Redis) | AES-256 | AWS KMS CMK |
| S3 (Audit Store) | AES-256 (SSE-S3 with KMS) | AWS KMS CMK; Object Lock for immutability |
| MSK (Kafka) | AES-256 | AWS MSK managed key |
| EKS Volumes | AES-256 | AWS KMS CMK via EBS encryption |

### Cryptographic Key Management (PCI-DSS HSM Requirement)

- **AWS CloudHSM**: Used for all card authorization signing operations (PCI-DSS HSM requirement)
- **Key Hierarchy**: CloudHSM root → KMS CMKs → data encryption keys
- **Key Rotation**: Authorization signing keys rotated quarterly; other KMS CMKs rotated annually
- **Key Custodians**: Dual-control required for CloudHSM key operations (Janet Kirk + Engineering Lead)

---

## Secrets Management

Per [Principle P6](02-architecture-principles.md#principle-6-operational-simplicity-for-small-teams) and [Technology Stack](06-technology-stack.md#security):

- **All secrets** stored in AWS Secrets Manager (no Kubernetes Secrets for sensitive data)
- **Rotation**: Database credentials rotated every 90 days; API keys annually
- **Access**: Services access secrets via IAM Role attached to EKS ServiceAccount (IRSA)
- **No hardcoded credentials**: Enforced by SonarQube SAST rule and pre-commit hook
- **Secret types**: DB credentials, Oracle credentials, API keys (card networks, banking partners), partner webhook signing secrets, Keycloak client secrets

---

## Threat Model

### Threat 1: Card Data Interception

**Threat**: Attacker intercepts card authorization request containing PAN/CVV.

**Mitigations**:
- PAN/CVV never stored anywhere in PayStream — only authorization tokens stored
- CDE network isolation prevents lateral movement to non-CDE services
- TLS 1.3 + mTLS eliminates plaintext interception
- CloudHSM signs authorization requests; private key never leaves HSM

**Residual Risk**: Low

### Threat 2: Unauthorized Transaction Injection

**Threat**: Attacker submits fraudulent payment requests.

**Mitigations**:
- JWT authentication with 15-minute token expiry
- Idempotency key validation prevents replay attacks
- Fraud Detection Service scores all transactions inline
- AWS WAF blocks request anomaly patterns (rate limiting, SQL injection, etc.)

**Residual Risk**: Low-Medium (fraud detection reduces but does not eliminate risk)

### Threat 3: Insider Threat / Privilege Escalation

**Threat**: Insider accesses cardholder data or manipulates transaction records.

**Mitigations**:
- Immutable audit trail via event sourcing + CloudTrail (Principle P7)
- PAN/CVV never accessible to application engineers (only auth tokens)
- Kubernetes RBAC + AWS IAM least-privilege; no standing admin access
- MFA required for all privileged operations
- Log access to all audit records is itself audited

**Residual Risk**: Low (monitoring and immutability limit damage and enable detection)

### Threat 4: Denial of Service

**Threat**: High-volume attack disrupts payment processing.

**Mitigations**:
- AWS WAF rate limiting at edge
- API Gateway per-client rate limits (100 req/min consumer, 1,000 req/min partner)
- AWS Shield Standard (DDoS protection included with CloudFront/API Gateway)
- HPA auto-scales services under load (see [Scalability & Performance](08-scalability-and-performance.md))

**Residual Risk**: Low (volumetric DDoS); Medium (application-layer DDoS on complex endpoints)

### Threat 5: Supply Chain / Dependency Compromise

**Threat**: Compromised library or container image introduces malicious code.

**Mitigations**:
- Trivy container image scanning in CI/CD pipeline (block on CRITICAL CVEs)
- OWASP Dependency-Check for Java/Python/Node.js dependencies
- SonarQube SAST in CI pipeline; quality gate enforced
- ECR image signing (AWS Signer); EKS admission controller validates signatures

**Residual Risk**: Low-Medium

---

## Audit Logging

Per [Principle P7: Immutable Audit Trail](02-architecture-principles.md#principle-7-immutable-audit-trail):

| Log Type | Source | Destination | Retention |
|---------|--------|-------------|-----------|
| Payment transaction events | All payment services | `audit.trail` Kafka → S3 Object Lock | 7 years |
| Application logs | All services | CloudWatch Logs | 12 months |
| API access logs | API Gateway | CloudWatch Logs | 12 months |
| Infrastructure events | AWS CloudTrail | S3 + CloudWatch | 7 years |
| Security events | AWS Security Hub | S3 | 7 years |
| Database access | RDS / Oracle audit logs | CloudWatch | 12 months |

**Immutability**: S3 Object Lock (Compliance mode) prevents deletion or modification of audit records.

**Log Format**: Structured JSON with mandatory fields: `timestamp`, `correlationId`, `serviceId`, `userId`, `eventType`, `aggregateId`.

---

## Penetration Testing

- **Frequency**: Annual (PCI-DSS requirement) + post-major-release
- **Scope**: External penetration test of API Gateway; internal network segmentation test of CDE boundary
- **Provider**: Third-party QSA-approved penetration tester
- **Remediation SLA**: Critical findings remediated within 30 days; High within 90 days

---

## GDPR Controls

| Requirement | Implementation |
|------------|---------------|
| Data residency (EU) | EU customer data stored in `eu-west-1` region; no cross-region replication of EU PII |
| Right to erasure | Customer PII pseudonymized in transaction records; erasure replaces PII with hash token |
| Data minimization | Only fields required for payment processing and audit stored; no behavioral profiling |
| Breach notification | AWS Security Hub + PagerDuty alert; 72-hour GDPR notification process documented |
| Data Processing Agreement | DPA maintained with all banking partners and third-party services processing EU data |

---

## Security Review Gates

| Gate | When | Approver |
|------|------|---------|
| Security design review | Before service deployment | Engineering Lead + Compliance Officer |
| PCI-DSS gap assessment | Month 4 (pre-audit preparation) | QSA (external) |
| Penetration test | Month 6 (pre-certification) | Third-party tester |
| PCI-DSS Level 1 audit | Month 7 | QSA (Janet Kirk oversight) |
