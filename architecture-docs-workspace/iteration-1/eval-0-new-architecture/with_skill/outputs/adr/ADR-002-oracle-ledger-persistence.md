# ADR-002: Retain Oracle for Ledger Persistence

**Status**: Accepted
**Date**: 2026-03-26
**Impact**: High
**Author**: Carlos Mendez (Engineering Lead)
**Approved by**: Maria Chen (Product Owner)
**Constraint source**: Finance team — migration prohibited

---

## Context

The legacy monolithic system uses an Oracle database as the authoritative ledger for all account debit/credit entries. The finance team has imposed a constraint: the Oracle database cannot be migrated to a different technology during the 6-month delivery timeline. This is a hard business constraint, not a technical preference.

The architecture must accommodate Oracle as the ledger database while following the database-per-service principle for all other services.

---

## Decision

Retain Oracle Database 19c (AWS RDS for Oracle) as the sole persistence store for the **Ledger Service**. The Ledger Service is the **only** service permitted to access Oracle directly. All other services interact with the ledger through the Ledger Service API.

---

## Rationale

1. **Finance team constraint**: Migration is explicitly prohibited; no exception was granted
2. **Risk**: Oracle migration during a 6-month delivery window would introduce schema migration risk, data validation overhead, and regulatory review — not acceptable given PCI-DSS certification timeline
3. **Isolation via Ledger Service API**: By making Oracle accessible only via the Ledger Service's gRPC API, Oracle becomes an implementation detail. Future migration can be achieved by replacing the Ledger Service's data layer without changing any other service
4. **Oracle capabilities**: Oracle's ACID guarantees and Data Guard replication provide the RPO < 30 seconds requirement for ledger data

---

## Consequences

**Positive**:
- Finance team risk concern respected; no migration scope added to delivery
- Oracle isolation behind Ledger Service API enables future migration
- Oracle Data Guard provides synchronous replication meeting RPO < 30 seconds

**Negative**:
- Oracle licensing cost (included in cost estimate in [Operational Considerations](../docs/09-operational-considerations.md#cost-estimation))
- Oracle connection pool size limit (50 connections) caps Ledger Service horizontal scaling — HPA max set at 10 pods × 5 connections = 50 total
- No Oracle RAC available on AWS RDS for Oracle — relies on Data Guard instead
- Technology heterogeneity: team must maintain Oracle DBA knowledge

---

## Migration Path (Future)

When Oracle migration is permitted:
1. The Ledger Service data layer is replaced (PostgreSQL or Aurora PostgreSQL)
2. Ledger Service gRPC API contract remains unchanged
3. Data migration plan: parallel write to both Oracle and PostgreSQL → validation → cutover
4. No other services require code changes

---

## Alternatives Considered

**PostgreSQL (Aurora) migration (deferred)**: Technically superior choice (lower cost, better horizontal scaling, PostgreSQL ecosystem). Deferred per finance team constraint. Architecture isolates Oracle so migration is feasible post-certification.

**Event sourcing ledger only (not chosen)**: Event log replaces Oracle for ledger queries. Rejected because the finance team's existing reconciliation tools query Oracle directly; replacing the storage engine would require re-certifying those tools — scope outside delivery timeline.
