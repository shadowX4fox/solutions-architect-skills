// A synthetic architecture — Order Desk, an invented order-taking system — shared by the scene generator's tests and by
// the example scene (`examples/build-example.ts`). Every name in it is made up: a fixture never reuses a real project's.
export const header = (self: string, type: string, adrs = 'ADR-101') => `<!-- EXPLORER_HEADER
key_concepts: orders, payments
technologies: React, Spring Boot
component_self: ${self}
component_type: ${type}
scope: One line.
related_adrs: ${adrs}
-->`;
export const container = (name: string, self: string, ctype: string, type: string, tech: string, extra = '') => `[Architecture](../../../ARCHITECTURE.md) > [Components](../README.md) > [Order Desk](.) > ${name}

# ${name}

${header(self, ctype)}

**Type:** ${type}
**Technology:** [${tech}]
${extra}**C4 Level:** Container (L2)

**Component Version:** 1.0.0

## Purpose <!-- LABEL: Purpose -->

${name} does one thing. It does it for the desk. A third sentence that the note must not carry.
`;

export const FILES: Record<string, string> = {
  'ARCHITECTURE.md': `<!-- ARCHITECTURE_VERSION: 1.2.0 -->
<!-- ARCHITECTURE_STATUS: Released -->
<!-- DOC_LANGUAGE: en -->
<!-- ARCHITECTURE_TYPE: Microservices -->

# Order Desk — Architecture
`,
  'docs/components/order-desk.md': `# Order Desk

${header('order-desk', 'internal-system')}

**C4 Level:** System (L1)
**Type:** Internal System
`,
  'docs/components/order-desk/01-web-app.md': container('Web App', 'web-app', 'web-application', 'Web Application', 'React', '**Internal Name:** \`CHL0001\`\n'),
  'docs/components/order-desk/02-api-gateway.md': container('API Gateway', 'api-gateway', 'gateway', 'Gateway', 'Kong'),
  'docs/components/order-desk/03-order-service.md': container('Order Service', 'order-service', 'api-service', 'API Service', 'Spring Boot'),
  'docs/components/order-desk/04-order-db.md': container('Order DB', 'order-db', 'database', 'Database', 'PostgreSQL'),
  'docs/components/order-desk/05-outbox-relay.md': container('Outbox Relay', 'outbox-relay', 'worker-consumer', 'Worker/Consumer', 'Kafka Connect'),
  'docs/components/payments-hub.md': `# Payments Hub

${header('payments-hub', 'external-system', 'ADR-102')}

**C4 Level:** System (L1)
**Type:** External System

## Containers

| Component | Type | Technology |
|-----------|------|------------|
| Hub API | Gateway | [Azure APIM] |
| Hub Ledger | Database | [Oracle] |

## Communication

| From | To | Protocol | Description |
|------|----|----------|-------------|
| Order Desk | Payments Hub | HTTPS/JSON | Payment authorization from \`Order Service\` to \`Hub API\` (I-03) |
| Payments Hub | Payments Hub | JDBC | \`Hub API\` writes the \`Hub Ledger\` |
| Payments Hub | Order Desk | Kafka | \`Hub API\` publishes settlement events to \`Outbox Relay\` and \`Order Service\`, which store them in \`Order DB\` |
| Payments Hub | Order Desk | SFTP | Monthly statement to the desk |
`,
  'docs/components/fraud-screen.md': `# Fraud Screen

${header('fraud-screen', 'external-system', 'ADR-102')}

**C4 Level:** System (L1)
**Type:** External System
`,
  'docs/03-architecture-layers.md': `# Architecture Layers

## 4.1 Layer table

| Layer | Containers | Inside boundary |
|-------|------------|-----------------|
| **L1 — Channel** | Web App | Yes |
| **L2 — Edge** | API Gateway | Yes |
| **L3 — Services** | Order Service, Outbox Relay | Yes |
| **L4 — Data** | Order DB | Yes |
| **L5 — Partners** | Hub API, Hub Ledger, Fraud Screen | No |
`,
  'docs/05-integration-points.md': `# Integration Points

| # | From | To | Protocol | Pattern | Boundary |
|---|------|----|----------|---------|----------|
| I-01 | \`Web App\` | \`API Gateway\` | HTTPS/JSON | Request-response | Internal |
| I-02 | \`API Gateway\` | \`Order Service\` | HTTPS/JSON | Request-response | Internal |
| I-03 | \`Order Service\` | \`Hub API\` (Payments Hub) | HTTPS/JSON | Request-response | Partner |
| I-04 | \`Order Service\` | \`Order DB\` | JDBC | Query | Internal |
| I-05 | \`Web App\` | Device Guard | Embedded SDK | Local validation | Security |
| I-06 | \`Web App\` | \`Fraud Screen\` and \`Order Service\`, via \`API Gateway\` | HTTPS | Request-response | Partner |
| ~~I-07~~ | ~~\`Web App\`~~ | ~~\`Hub Ledger\`~~ | — | — | **Retired** |
`,
  'docs/04-data-flow-patterns.md': `# Data Flow Patterns

## Flow Inventory

| Flow | Trigger | Use Case | Latency Target |
|------|---------|----------|----------------|
| 1. Place an order | The user submits | UC-01 | ≤ 2 s end to end |
| 2. Settle | The hub settles | UC-02, UC-03 | ≤ 30 s end to end |
| 3. Orphan | Nothing | UC-04 | ≤ 1 s |

## Phase Catalog

| # | Phase | On critical path? | Owner | Failure mode |
|---|-------|-------------------|-------|--------------|
| 1 | Device check | yes | Device Guard → Web App | Blocked |
| 2 | Submit order | yes | Web App → API Gateway → Order Service (the write path) → Order DB | Rejected |
| 3 | Authorize payment | yes | Order Service → Payments Hub | Declined |
| 4 | Settlement | no | Hub API → Outbox Relay and Order Service → Order DB | Late |
| 5 | Nightly reconcile | no — scheduled batch | Order DB → Hub Ledger | Stale |
| 6 | Fan-out read | no | Order Service → Order DB → Hub API | Slow |
| 7 | Relay skipped | no | Web App → Order Service | Slow |
| 8 | Plural | no | Hub API → Hub Ledgers | Slow |

#### Phase 2 — Submit order

**Hops**: Web App → API Gateway → Order Service → Order DB
**Latency budget (p95)**: ≤ 800 ms, measured at the gateway

#### Phase 3 — Authorize payment

**Latency budget (p95)**: ≤ 1.5 s

#### Flow 1 — Place an order

**Phases**: 1 → 2 → 3 (synchronous).
**Governed by**: [ADR-101](../adr/ADR-101.md), ADR-102.
**Delta**: Payment moves to the hub.

#### Flow 2 — Settle

**Phases**: 4 → 2 (asynchronous).
`,
};
