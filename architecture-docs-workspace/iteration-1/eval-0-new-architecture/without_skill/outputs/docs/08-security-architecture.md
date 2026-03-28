# Section 8 — Security Architecture

## 8.1 Security Model Summary

PayStream's security model is designed to satisfy **PCI-DSS Level 1** and **GDPR** requirements as non-negotiable baseline controls. The model follows zero-trust principles: no service trusts another by default; all cross-service communication is authenticated, authorised, and encrypted.

## 8.2 PCI-DSS Compliance Controls

| PCI-DSS Requirement | Control |
|---------------------|---------|
| Req 1 – Network controls | Dedicated PCI-scoped VPC subnet for Tokenisation Service; security groups restrict inbound to Payment Processor only |
| Req 2 – Secure configurations | CIS Kubernetes Benchmark applied to EKS nodes; AWS Inspector scans ECR images before promotion |
| Req 3 – Protect stored cardholder data | PAN encrypted with AES-256-GCM; key managed by CloudHSM; CVV never persisted |
| Req 4 – Protect data in transit | TLS 1.2+ for all inter-service calls; mTLS enforced by App Mesh; Kafka TLS in-transit |
| Req 5 – Protect against malicious software | ECR Enhanced Scanning; runtime threat detection via Amazon GuardDuty |
| Req 6 – Secure systems and software | Dependabot; mandatory SAST (CodeQL) in CI pipeline; DAST (OWASP ZAP) in staging |
| Req 7 – Restrict access to cardholder data | IAM least-privilege; Tokenisation Service IAM role restricted to CloudHSM partition only |
| Req 8 – Authentication and access control | Cognito MFA for consumers; AWS IAM Identity Center for engineers; no shared credentials |
| Req 9 – Restrict physical access | AWS responsibility (shared model); data centre controls documented in AWS compliance reports |
| Req 10 – Log and monitor all access | Immutable audit log to CloudWatch Logs with log data protection; CloudTrail for API access |
| Req 11 – Test security of systems | Annual penetration test (Month 7); quarterly vulnerability scans; continuous GuardDuty |
| Req 12 – Information security policies | Documented in `/docs/compliance/pci-policies/`; reviewed annually |

## 8.3 GDPR Controls

| GDPR Article | Control |
|-------------|---------|
| Art. 25 – Data protection by design | Tokenisation replaces PAN in all downstream services; data minimisation in event schemas |
| Art. 17 – Right to erasure | Customer deletion triggers pseudonymisation workflow: hashes customer_id in ledger and replaces token mapping with null in DynamoDB; audit records retained per financial law override |
| Art. 32 – Security of processing | Encryption at rest and in transit; access control; incident response plan |
| Art. 33/34 – Breach notification | GuardDuty + Security Hub → PagerDuty → 72-hour breach notification SOP |
| Art. 44 – International transfers | EU customer data stored in `eu-west-1`; explicit data residency tags on all resources |

## 8.4 Identity and Access Management

### Human Access

| Role | Access Method | Permissions |
|------|------------|------------|
| Engineers (development) | AWS IAM Identity Center + SSO | Dev and staging environments only; no production direct access |
| SRE (on-call) | AWS IAM Identity Center + SSO + MFA | Read/exec in production; write gated by Change Advisory Board approval |
| Compliance Officer | Read-only audit portal IAM role | Read-only access to audit logs and CloudTrail |
| Database Admins | Bastion host in DBA subnet + session recording | Oracle schema changes only; sessions recorded via AWS Session Manager |

### Service-to-Service Access

All services run as Kubernetes service accounts mapped to IAM roles via EKS IRSA (IAM Roles for Service Accounts). No service shares an IAM role with another.

```
Service Account → IRSA mapping → IAM Role → Policy
payment-processor-sa → payment-processor-role → {
  msk:Produce on payment.events,
  dynamodb:PutItem / GetItem on idempotency-table,
  rds-db:connect on aurora-cluster,
  secretsmanager:GetSecretValue on payment-processor/* secrets
}
```

## 8.5 Encryption

| Data State | Mechanism | Key Owner |
|-----------|-----------|-----------|
| PAN at rest (DynamoDB) | AES-256-GCM via CloudHSM | CloudHSM (PCI scope) |
| All other DB at rest | AWS-managed KMS (AES-256) | AWS KMS |
| S3 at rest | SSE-KMS (AES-256) | AWS KMS |
| Data in transit (external) | TLS 1.2+ with HSTS | ACM-managed certificates |
| Data in transit (internal) | mTLS via App Mesh | ACM PCA (private CA) |
| Kafka at rest | AES-256 (MSK-managed KMS) | AWS KMS |
| Kafka in transit | TLS 1.2+ | MSK-managed |

**Key rotation schedule**:
- CloudHSM PAN encryption key: 90 days
- AWS KMS CMKs: 1 year (automatic rotation enabled)
- TLS certificates (ACM): 60 days (automatic renewal)
- API keys (partner): on-demand via Secrets Manager rotation Lambda

## 8.6 Network Security

```
Internet
  ↓
AWS Shield Standard + CloudFront (DDoS, CDN)
  ↓
AWS WAF (OWASP Core Rule Set, rate limiting, geo-block)
  ↓
Public ALB (TLS termination)
  ↓ [Security Group: allow 443 from ALB only]
API Gateway Pods (DMZ subnet)
  ↓ [Security Group: allow 8080 from API GW pods only]
Core Services (App Zone subnet)
  ↓ [Security Group: allow specific ports from Core Services only]
Data Stores (Data Zone subnet, no internet egress)
```

**Additional controls**:
- VPC Flow Logs enabled; analysed by Amazon Detective.
- AWS Security Hub (FSBP standard) for continuous compliance posture.
- GuardDuty threat detection; EKS Runtime Monitoring enabled.
- No SSH to EC2/EKS nodes; all operations via AWS Systems Manager Session Manager.

## 8.7 Audit Trail

The audit trail is a core PCI-DSS requirement. Every state-changing event in PayStream is captured in an immutable audit log.

- **Mechanism**: All services emit structured audit events to the `audit.events` Kafka topic. An Audit Log Service (future component) consumes these and writes to S3 (long-term storage, 7-year retention) and CloudWatch Logs (90-day hot storage for query).
- **CloudTrail**: All AWS API calls captured; management events + data events for S3 and DynamoDB.
- **Log protection**: CloudWatch Log Data Protection masks PAN patterns; S3 Object Lock (WORM) on audit archives.
- **Immutability**: No service holds `logs:DeleteLogEvents` or `s3:DeleteObject` permissions on audit resources.

## 8.8 Incident Response

1. **Detection**: GuardDuty + CloudWatch Alarm → PagerDuty P1 alert to on-call SRE.
2. **Containment**: SRE isolates affected service (scale to 0, network policy deny-all).
3. **Assessment**: Compliance Officer notified if PAN/PII potentially exposed.
4. **Notification**: GDPR 72-hour breach notification clock starts at detection.
5. **Remediation**: Fix deployed via GitOps pipeline (emergency change process documented in runbook).
6. **Post-Mortem**: Blameless post-mortem within 5 business days; action items tracked in JIRA.
