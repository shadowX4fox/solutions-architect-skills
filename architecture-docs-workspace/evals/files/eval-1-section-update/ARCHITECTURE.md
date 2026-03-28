# PayStream — Architecture

> Real-time payment processing platform replacing legacy batch system

## Documentation

| # | Section | File | Description |
|---|---------|------|-------------|
| S1+S2 | Executive Summary & System Overview | [docs/01-system-overview.md](docs/01-system-overview.md) | System purpose, key metrics |
| S3 | Architecture Principles | [docs/02-architecture-principles.md](docs/02-architecture-principles.md) | Design principles |
| S4 | Architecture Layers | [docs/03-architecture-layers.md](docs/03-architecture-layers.md) | Microservices topology |
| S5 | Component Details | [docs/components/README.md](docs/components/README.md) | All components |
| S6 | Data Flow Patterns | [docs/04-data-flow-patterns.md](docs/04-data-flow-patterns.md) | Payment flows |
| S7 | Integration Points | [docs/05-integration-points.md](docs/05-integration-points.md) | Banking APIs |
| S8 | Technology Stack | [docs/06-technology-stack.md](docs/06-technology-stack.md) | AWS, Java, Kafka |
| S9 | Security Architecture | [docs/07-security-architecture.md](docs/07-security-architecture.md) | PCI-DSS controls |
| S10 | Scalability & Performance | [docs/08-scalability-and-performance.md](docs/08-scalability-and-performance.md) | SLOs, HPA |
| S11 | Operational Considerations | [docs/09-operational-considerations.md](docs/09-operational-considerations.md) | DR, monitoring |

## Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](adr/ADR-001-kafka-event-bus.md) | Use Kafka as event bus | Accepted |
