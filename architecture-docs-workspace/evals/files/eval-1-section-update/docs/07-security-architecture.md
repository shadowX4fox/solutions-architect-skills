# Security Architecture (S9)

## 9.1 Authentication & Authorization

Current state: API keys are used for all service-to-service and partner authentication. API keys are stored in AWS Secrets Manager and rotated monthly.

**Known Gap**: API Gateway currently uses static API keys for partner authentication. Team has discussed migrating to OAuth2 but no decision recorded.

## 9.2 Data Encryption

- In transit: TLS 1.3 for all external traffic, TLS 1.2 for internal service mesh
- At rest: AES-256 for database volumes (AWS RDS encryption), S3 bucket encryption enabled
- PAN data: tokenized via VGS (Very Good Security) — raw card data never stored

## 9.3 PCI-DSS Controls

| Control | Status | Notes |
|---------|--------|-------|
| Network segmentation (PCI Zone) | ✅ Implemented | VPC isolated subnets |
| Encryption at rest | ✅ Implemented | AES-256 RDS + S3 |
| Encryption in transit | ✅ Implemented | TLS 1.3 |
| Access control | ⚠️ Partial | API keys only, no RBAC |
| Audit logging | ✅ Implemented | CloudTrail + custom audit log |
| Vulnerability scanning | ⚠️ Partial | Manual quarterly scans |

## 9.4 Security Monitoring

- AWS GuardDuty enabled for threat detection
- CloudTrail for all API calls
- Custom fraud detection service (ML-based, async path)
