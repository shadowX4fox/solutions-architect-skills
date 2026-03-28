# Security Architecture (S9)

## 9.1 Authentication & Authorization

API Gateway uses **OAuth2 with PKCE flow** (Proof Key for Code Exchange) for all partner and client authentication. The Authorization Server is **AWS Cognito**.

**Token Configuration:**
- Access token expiry: **15 minutes**
- Refresh token expiry: **7 days**
- Flow: Authorization Code + PKCE (RFC 7636) — prevents authorization code interception attacks

**OAuth2/PKCE Flow Summary:**
1. Client generates a `code_verifier` (random string) and derives `code_challenge` (SHA-256 hash)
2. Client sends authorization request to AWS Cognito with `code_challenge`
3. AWS Cognito returns an authorization code
4. Client exchanges authorization code + `code_verifier` for access/refresh tokens
5. API Gateway validates the JWT access token against AWS Cognito JWKS endpoint on every request
6. Refresh tokens are stored server-side; access tokens are short-lived and stateless

**Service-to-Service Authentication:**
- Internal services use AWS IAM roles (instance profiles / ECS task roles) — no static credentials
- API keys previously used for partner authentication have been replaced by OAuth2 client credentials flow via AWS Cognito for machine-to-machine integrations

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
| Access control | ✅ Implemented | OAuth2 + PKCE via AWS Cognito; RBAC enforced at API Gateway |
| Audit logging | ✅ Implemented | CloudTrail + custom audit log |
| Vulnerability scanning | ⚠️ Partial | Manual quarterly scans |

## 9.4 Security Monitoring

- AWS GuardDuty enabled for threat detection
- CloudTrail for all API calls
- Custom fraud detection service (ML-based, async path)
