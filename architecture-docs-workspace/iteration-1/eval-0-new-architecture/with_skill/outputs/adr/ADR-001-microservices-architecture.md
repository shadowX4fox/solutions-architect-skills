# ADR-001: Microservices Architecture Selection

**Status**: Accepted
**Date**: 2026-03-26
**Impact**: High
**Author**: Carlos Mendez (Engineering Lead)
**Approved by**: Maria Chen (Product Owner), Janet Kirk (Compliance Officer)

---

## Context

PayStream must replace a monolithic batch payment system with a real-time processing platform that can scale from 50,000 to 500,000 transactions/day within 18 months. The system has distinct subsystems with very different scaling profiles:
- Authorization: high-frequency, sub-second, latency-critical
- Settlement: batch-oriented, runs at EOD
- Fraud Detection: ML inference, CPU-intensive
- Reconciliation: periodic, data-intensive

Additionally, the team size (8 engineers + 2 SRE) requires independent team ownership per domain to avoid coordination overhead. PCI-DSS Level 1 compliance requires clear network segmentation of the cardholder data environment (CDE).

---

## Decision

Adopt a **Microservices Architecture** with services organized by business bounded context.

---

## Rationale

1. **Independent scaling**: Hot-path services (Authorization, Fraud Detection) can scale independently from cold-path services (Reconciliation, Reporting) — not possible in a monolith
2. **Technology choice per service**: Fraud Detection uses Python/ML libraries; payment services use Java/Spring Boot; partner integration uses Node.js for I/O-heavy workloads — each service uses the best tool for its job
3. **PCI-DSS scope reduction**: Microservices allow tight CDE boundary definition (only Authorization + Ledger services in scope) — simpler than PCI-scoping an entire monolith
4. **Team autonomy**: 8 engineers organized in 2 teams (Payments, Integration) each own their services end-to-end
5. **Failure isolation**: Failure in Reconciliation Service does not affect Authorization Service; bulkhead pattern limits blast radius

---

## Consequences

**Positive**:
- Services can be deployed, scaled, and updated independently
- Clear ownership boundaries reduce coordination overhead
- PCI-DSS CDE scope is minimized
- Technology choices optimized per service

**Negative**:
- Distributed systems complexity: network failures, eventual consistency, distributed tracing required
- Operational overhead: managing 10 services vs 1 monolith (mitigated by AWS managed services per [ADR-004](ADR-004-aws-cloud-platform.md))
- Saga pattern required for distributed transactions ([ADR-005](ADR-005-saga-pattern-distributed-transactions.md))

---

## Alternatives Considered

**Monolith (not chosen)**: Cannot support independent scaling of authorization vs reconciliation; PCI-DSS scope would cover entire codebase; single deployment unit is a bottleneck for 8 engineers.

**Modular Monolith (not chosen)**: Better than pure monolith for team boundaries, but still shares deployment and scaling constraints. Does not meet the 10× scale requirement without significant refactoring risk.
