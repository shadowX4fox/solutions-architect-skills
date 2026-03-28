[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > API Gateway

# API Gateway

**Type:** Infrastructure

---

## Overview

**Bounded Context**: Edge Routing & Authentication — single ingress point for all external traffic

**Technology**: AWS API Gateway (HTTP API v2) + Kong Gateway 3.x (internal routing)
**Team Owner**: Platform / SRE Team

**Purpose**:
Single entry point for all inbound traffic to PayStream from external clients (mobile/web apps, banking partners, operations team). Handles TLS termination, JWT validation, API key authentication, rate limiting, WAF protection, and request routing to downstream microservices.

**Responsibilities**:
- TLS 1.3 termination for all inbound HTTPS connections
- JWT token validation (public key from Keycloak JWKS endpoint)
- API key authentication for banking partners
- Rate limiting per client tier (consumer: 100 req/min; partner: 1,000 req/min; internal: unlimited)
- Request routing to Payment Service, Partner Gateway, Operations endpoints
- AWS WAF integration (OWASP Top 10 managed rule group)
- Response caching for non-sensitive GET endpoints (payment status)

---

## Routing Configuration

| Route Pattern | Target Service | Auth Method | Rate Limit |
|--------------|----------------|-------------|------------|
| `POST /api/v1/payments` | Payment Service | JWT | 100/min/customer |
| `GET /api/v1/payments/{id}` | Payment Service | JWT | 100/min/customer |
| `POST /partner/v1/payments` | Partner Gateway | API Key | 1,000/min/partner |
| `POST /partner/v1/payments/bulk` | Partner Gateway | API Key | 10/min/partner |
| `GET /partner/v1/*` | Partner Gateway | API Key | 1,000/min/partner |
| `POST /internal/*` | Internal services | JWT (Ops role) | Unlimited |

---

## Data Management

**Type**: Redis (AWS ElastiCache) — rate limiting counters and response cache

**Keys**:
- `ratelimit:{clientId}:{window}` → request count (TTL: rate limit window, 60s)
- `cache:payment:{paymentId}` → cached payment status response (TTL: 5s)

---

## Non-Functional Requirements

**Performance**: Routing overhead target < 50ms (see [timing budget](../04-data-flow-patterns.md#timing-budget))

**Availability**: 99.99% — AWS API Gateway is a managed multi-AZ service (no single-point-of-failure)

**Scalability**: AWS API Gateway auto-scales without pod HPA; Kong internal routing scales per HPA (Min 3, Max 20 pods)

---

## Security

**WAF**: AWS WAF with OWASP Top 10 managed rule group; custom rules for PCI-DSS compliance

**Authentication flows**:
- Consumer JWT: RS256 JWT signed by Keycloak; validated against JWKS endpoint (cached 5 minutes)
- Partner API Key: key hash validated against partner_db via Kong plugin; raw key never logged

**TLS**: TLS 1.3 only; TLS 1.2 allowed for legacy partner clients (TLS 1.2 sunset in 6 months)

**PCI-DSS Scope**: BOUNDARY — terminates external TLS; not in CDE (does not handle card data)

---

## Deployment & Scaling

**AWS API Gateway**: Managed; multi-AZ; no deployment configuration required

**Kong Gateway (EKS)**:
- Container: `<ecr-account>.dkr.ecr.us-east-1.amazonaws.com/kong-gateway:<version>`
- CPU: Requests 500m, Limits 2000m
- Memory: Requests 512Mi, Limits 1Gi
- Replicas: Min 3, Max 20 (HPA CPU 70%)

---

## Observability

**Logging**: All requests logged (method, path, status, duration, clientId); PAN fields stripped from logs

**Metrics**:
- `gateway_requests_total` (counter, labels: method, route, status)
- `gateway_latency_seconds` (histogram — routing overhead)
- `rate_limit_exceeded_total` (counter, labels: client_tier)
- `waf_blocked_requests_total` (counter, labels: rule_group)

**Alerts**:
- WAF block rate spike (> 100/min) → P2 Slack alert (potential attack)
- Gateway error rate > 1% → P2 alert
- Gateway P99 routing overhead > 80ms → Warning
