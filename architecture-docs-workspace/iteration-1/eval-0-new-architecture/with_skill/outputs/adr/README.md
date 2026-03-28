# Architecture Decision Records — PayStream

This directory contains Architecture Decision Records (ADRs) for the PayStream payment processing platform.

## ADR Index

| ADR | Title | Status | Date | Impact |
|-----|-------|--------|------|--------|
| [ADR-001](ADR-001-microservices-architecture.md) | Microservices Architecture Selection | Accepted | 2026-03-26 | High |
| [ADR-002](ADR-002-oracle-ledger-persistence.md) | Retain Oracle for Ledger Persistence | Accepted | 2026-03-26 | High |
| [ADR-003](ADR-003-event-driven-payment-processing.md) | Event-Driven Payment Processing with Kafka | Accepted | 2026-03-26 | High |
| [ADR-004](ADR-004-aws-cloud-platform.md) | AWS-Only Cloud Platform | Accepted | 2026-03-26 | High |
| [ADR-005](ADR-005-saga-pattern-distributed-transactions.md) | Saga Pattern for Distributed Transactions | Accepted | 2026-03-26 | High |

## Process

New ADRs are created when:
- A significant architectural decision is made
- An existing decision is superseded
- A technical constraint is formally accepted

ADR template: See `skills/architecture-docs/adr/ADR-000-template.md` in the plugin directory.

Return to [ARCHITECTURE.md](../ARCHITECTURE.md).
