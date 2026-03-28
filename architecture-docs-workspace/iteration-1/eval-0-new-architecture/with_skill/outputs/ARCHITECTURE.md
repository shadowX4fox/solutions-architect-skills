# PayStream — Architecture

> Cloud-native real-time payment processing platform built on a Microservices architecture, replacing legacy batch processing with sub-2-second transaction settlement for FinTech Corp.

## Documentation

| # | Section | File | Description |
|---|---------|------|-------------|
| S1+S2 | Executive Summary & System Overview | [docs/01-system-overview.md](docs/01-system-overview.md) | Problem, solution, use cases, key metrics |
| S3 | Architecture Principles | [docs/02-architecture-principles.md](docs/02-architecture-principles.md) | Design principles with trade-offs |
| S4 | Architecture Layers | [docs/03-architecture-layers.md](docs/03-architecture-layers.md) | Microservices architecture model, layer diagram |
| S5 | Component Details | [docs/components/README.md](docs/components/README.md) | All components |
| S6 | Data Flow Patterns | [docs/04-data-flow-patterns.md](docs/04-data-flow-patterns.md) | Payment flows, fraud detection, settlement |
| S7 | Integration Points | [docs/05-integration-points.md](docs/05-integration-points.md) | Banking partners, payment rails, external systems |
| S8 | Technology Stack | [docs/06-technology-stack.md](docs/06-technology-stack.md) | Libraries, versions, tools |
| S9 | Security Architecture | [docs/07-security-architecture.md](docs/07-security-architecture.md) | PCI-DSS, threat model, controls, GDPR |
| S10 | Scalability & Performance | [docs/08-scalability-and-performance.md](docs/08-scalability-and-performance.md) | HPA, latency targets, capacity planning |
| S11 | Operational Considerations | [docs/09-operational-considerations.md](docs/09-operational-considerations.md) | Deployment, DR, monitoring, costs |

> **Note**: The `#` column uses internal section numbers (S-prefix), not file prefix numbers.
> File prefix `07` = S9 (Security Architecture). File prefix `09` = S11 (Operational Considerations).

## Architecture Decision Records

| ADR | Title | Status | Date | Impact |
|-----|-------|--------|------|--------|
| [ADR-001](adr/ADR-001-microservices-architecture.md) | Microservices Architecture Selection | Accepted | 2026-03-26 | High |
| [ADR-002](adr/ADR-002-oracle-ledger-persistence.md) | Retain Oracle for Ledger Persistence | Accepted | 2026-03-26 | High |
| [ADR-003](adr/ADR-003-event-driven-payment-processing.md) | Event-Driven Payment Processing with Kafka | Accepted | 2026-03-26 | High |
| [ADR-004](adr/ADR-004-aws-cloud-platform.md) | AWS-Only Cloud Platform | Accepted | 2026-03-26 | High |
| [ADR-005](adr/ADR-005-saga-pattern-distributed-transactions.md) | Saga Pattern for Distributed Transactions | Accepted | 2026-03-26 | High |

See [adr/README.md](adr/README.md) for ADR process · [References](docs/10-references.md)
