# Security Architecture (S9)

## 9.1 Authentication & Authorization

The API Gateway uses **OAuth2 with PKCE (Proof Key for Code Exchange)** flow for all partner and external client authentication. The Authorization Server is **AWS Cognito**.

**OAuth2/PKCE Configuration:**

| Parameter | Value |
|-----------|-------|
| Flow | Authorization Code + PKCE |
| Authorization Server | AWS Cognito |
| Access Token Expiry | 15 minutes |
| Refresh Token Expiry | 7 days |
| Token Endpoint | AWS Cognito User Pool token endpoint |

**Flow Summary:**
1. Client generates a `code_verifier` and derives a `code_challenge` (SHA-256).
2. Client redirects to AWS Cognito authorization endpoint with `code_challenge` and `code_challenge_method=S256`.
3. AWS Cognito authenticates the user/partner and returns an authorization code.
4. Client exchanges the authorization code + `code_verifier` for access and refresh tokens.
5. Access tokens (JWT, 15-minute TTL) are presented to the API Gateway on each request.
6. API Gateway validates the JWT signature and expiry against the AWS Cognito JWKS endpoint.
7. Refresh tokens (7-day TTL) are used to obtain new access tokens without re-authentication.

Service-to-service calls within the internal mesh continue to use AWS IAM roles and instance profiles; API keys stored in AWS Secrets Manager are retained only for legacy internal tooling pending migration.

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
| Access control | ✅ Implemented | OAuth2/PKCE via AWS Cognito; RBAC enforced via Cognito user pool groups |
| Audit logging | ✅ Implemented | CloudTrail + custom audit log |
| Vulnerability scanning | ⚠️ Partial | Manual quarterly scans |

## 9.4 Security Monitoring

- AWS GuardDuty enabled for threat detection
- CloudTrail for all API calls
- Custom fraud detection service (ML-based, async path)
