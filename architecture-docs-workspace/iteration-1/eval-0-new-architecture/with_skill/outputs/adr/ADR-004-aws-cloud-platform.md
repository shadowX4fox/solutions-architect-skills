# ADR-004: AWS-Only Cloud Platform

**Status**: Accepted
**Date**: 2026-03-26
**Impact**: High
**Author**: Carlos Mendez (Engineering Lead)
**Approved by**: Maria Chen (Product Owner)
**Constraint source**: Existing enterprise agreement

---

## Context

FinTech Corp has an existing AWS Enterprise Agreement providing committed spend discounts, AWS Support, and pre-negotiated data processing pricing. The finance team and procurement policy require all new infrastructure to use AWS unless a specific exception is granted. No exception was sought for PayStream.

Additionally, the PCI-DSS Level 1 certification timeline (month 7) benefits from AWS's pre-existing PCI-DSS compliance attestation and available AWS Security Hub PCI-DSS compliance checks.

---

## Decision

All PayStream infrastructure is deployed exclusively on AWS. No multi-cloud or hybrid-cloud deployment. DR warm standby also runs on AWS (different region: us-west-2).

---

## Rationale

1. **Enterprise Agreement**: Existing committed spend discounts; switching clouds requires new procurement cycle and financial model (out of scope for 6-month delivery)
2. **PCI-DSS**: AWS holds PCI-DSS Level 1 Service Provider certification; PayStream inherits controls for covered services (EKS, RDS, MSK, CloudHSM) — reduces certification scope
3. **Operational familiarity**: Engineering team has AWS expertise; no re-skilling cost
4. **Managed services alignment**: MSK (Kafka), RDS (PostgreSQL + Oracle), ElastiCache (Redis), EKS align with [Principle P6](../docs/02-architecture-principles.md#principle-6-operational-simplicity-for-small-teams) — no self-operated alternatives needed
5. **CloudHSM availability**: AWS CloudHSM required for PCI-DSS HSM cryptographic operations (Visa/Mastercard key signing); available only on AWS in this case

---

## AWS Regions

| Region | Purpose |
|--------|---------|
| `us-east-1` | Primary production deployment |
| `us-west-2` | DR warm standby for Tier 1 services |
| `eu-west-1` | EU customer data (GDPR data residency requirement) |

---

## Consequences

**Positive**:
- Enterprise Agreement discounts reduce infrastructure cost
- PCI-DSS inherited controls reduce audit scope
- Full access to AWS managed services (MSK, RDS, ElastiCache, CloudHSM, EKS)
- Single cloud simplifies network topology and IAM

**Negative**:
- AWS vendor lock-in — migration to another cloud would require significant re-architecture
- AWS pricing increases or policy changes affect PayStream cost directly
- AWS managed service upgrade schedules outside team control

---

## Lock-in Mitigation

To reduce lock-in risk where practical:
- OpenTelemetry (vendor-neutral) for observability — can switch exporter from X-Ray to other backends
- Kafka protocol (via MSK) — can migrate to self-hosted Kafka or Confluent Cloud without service code changes
- PostgreSQL on RDS — standard PostgreSQL; can migrate to another managed PostgreSQL provider
- Terraform IaC — provider-agnostic definitions; AWS-specific provider can be substituted

No mitigation for CloudHSM (PCI-DSS requirement binds this choice).
