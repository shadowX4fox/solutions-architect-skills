# Section 5: Component Details - ENTERPRISE Architecture

<!-- ARCHITECTURE_TYPE: ENTERPRISE -->

**Purpose**: Deep dive into each component within every ENTERPRISE layer, providing detailed technical specifications and operational characteristics.

This template organizes components by their ENTERPRISE layer assignment (Channels → Experience → Process → Domain Services → Systems of Record & Data), then the Cross-Cutting Capabilities.

**No industry standard is mandated.** A Domain Services component MAY carry a capability tag — for example the BIAN Service Domain it implements, when the project carries `BIAN_ALIGNMENT.md`. The tag is optional and never invented.

**Language**: under `doc_language: es`, the layer names in headings and dependency lines take their Spanish visible form — Canales, Experiencia, Procesos, Servicios de Dominio, Sistemas de Registro y Datos, Capacidades Transversales. Metadata keys (`**Type:**`, `**Technology:**` …), anchor comments, layer ids and table column headers stay English.

---

## Component Documentation Guidelines

For each component in your system, document using the template below. **Group components by their layer.** One file per C4 L2 container under `docs/components/`; a channel or system of record owned by another team is an L1 external-system descriptor, not a container file.

---

## Layer 1: Channels - Components

Channels are usually C4 L1 systems or external actors. Use this template only for a channel this system builds and deploys (for example, a web front end shipped by the same team); otherwise describe the channel in its external-system descriptor.

### [Component Name]

**Type:** {C4 type}
**Technology:** [{technology with version}]
**Internal Name:** `{repository / workload / product identifier when it differs from the canonical name, e.g. shp-spa-order-history — omit the line when there is none}`
**C4 Level:** Container (L2)
**Deploys as:** {Docker container | serverless function | managed service | VM}
**Communicates via:** {HTTPS | gRPC | AMQP | TCP | ...}
**Description:** [<Component Name> + what it does — one line, ≤120 chars in all, opens with the canonical name (the H1) verbatim and plain]

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD
<!-- context7: use resolve-library-id + get-library-docs for each technology listed above to surface config patterns and version-specific features. Present as advisory Technology Context Brief only — do not auto-fill. -->
**Version**: [Version number]
**Location**: [Package/directory path or repository]

**Purpose**:
[1-2 sentence description of what this component does]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Layer 2 (Experience) components; Identity & Security capability]
- Depended by: [End users, partners, upstream systems]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 2: Experience - Components

### [Component Name]

**Type:** {C4 type}
**Technology:** [{technology with version}]
**Internal Name:** `{repository / workload / product identifier when it differs from the canonical name, e.g. shp-spa-order-history — omit the line when there is none}`
**C4 Level:** Container (L2)
**Deploys as:** {Docker container | serverless function | managed service | VM}
**Communicates via:** {HTTPS | gRPC | AMQP | TCP | ...}
**Description:** [<Component Name> + what it does — one line, ≤120 chars in all, opens with the canonical name (the H1) verbatim and plain]

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

**Purpose**:
[1-2 sentence description of what this component does]

**Channel Served**: [The one channel, or channel family, this component adapts for]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Layer 3 (Process) components; a Layer 4 (Domain Services) read only by ADR exception — name the ADR]
- Depended by: [Layer 1 (Channels) components]

**Business Rules Held**: none — a rule found here moves to the Domain Service that owns it

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 3: Process - Components

### [Component Name]

**Type:** {C4 type}
**Technology:** [{technology with version}]
**Internal Name:** `{repository / workload / product identifier when it differs from the canonical name, e.g. shp-spa-order-history — omit the line when there is none}`
**C4 Level:** Container (L2)
**Deploys as:** {Docker container | serverless function | managed service | VM}
**Communicates via:** {HTTPS | gRPC | AMQP | TCP | ...}
**Description:** [<Component Name> + what it does — one line, ≤120 chars in all, opens with the canonical name (the H1) verbatim and plain]

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

**Purpose**:
[1-2 sentence description of what this component does]

**Processes Run**:
- [Use case or process id and name — e.g. UC-01 Place Order]
- [Use case or process id and name]

**Process State**:
- **Held**: [Step reached, correlation ids, deadlines, retries — never a business entity]
- **Store**: [Where the state is persisted]
- **Retention**: [How long a finished instance is kept]

**Compensation**:
- [Step that can fail → the compensating action on the steps already done]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Process start, status query, signal]
- Events: [Events consumed and published, by topic]

**Dependencies**:
- Depends on: [Layer 4 (Domain Services) components; Integration capability for events]
- Depended by: [Layer 2 (Experience) components; process-starting events]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Process instances started, completed, compensated, stuck]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 4: Domain Services - Components

### [Component Name]

**Type:** {C4 type}
**Technology:** [{technology with version}]
**Internal Name:** `{repository / workload / product identifier when it differs from the canonical name, e.g. shp-spa-order-history — omit the line when there is none}`
**C4 Level:** Container (L2)
**Deploys as:** {Docker container | serverless function | managed service | VM}
**Communicates via:** {HTTPS | gRPC | AMQP | TCP | ...}
**Description:** [<Component Name> + what it does — one line, ≤120 chars in all, opens with the canonical name (the H1) verbatim and plain]

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

**Purpose**:
[1-2 sentence description of the business capability this service implements]

**Bounded Context**:
- **Capability**: [The business capability, in the business's own words]
- **Ubiquitous Language**: [3–6 terms this context defines]
- **Boundary**: [What is outside — the neighbouring contexts and what they own]

**Owned Data**:
- **Entities**: [Aggregates and entities this service alone writes]
- **Store**: [Database or store, engine, one per service]
- **Shared with**: none — other services read through this service's API or its events

**Invariants**:
- [Rule enforced on every write — e.g. "an order line has a positive quantity"]
- [Rule enforced on every write]

**Events Published**:
- [Event name — topic — when it is published]

**Systems of Record Reached**:
- [Layer 5 system — through which adapter or integration route — for which data]

**Capability Tag** (optional — omit the block when the project carries no alignment):
- **Alignment source**: [e.g. `BIAN_ALIGNMENT.md`]
- **Capability implemented**: [The name exactly as the alignment gives it — e.g. a BIAN Service Domain]

**Responsibilities**:
- Enforce the invariants of the bounded context
- Persist and serve the entities it owns
- Publish a domain event on every state change other contexts need
- [Additional capability-specific responsibilities]

**APIs/Interfaces**:
- Domain API: [Operations, endpoints]
- Domain Events: [Topics published and consumed]

**Dependencies**:
- Depends on: [Layer 5 (Systems of Record & Data) through adapters; cross-cutting capabilities]
- Depended by: [Layer 3 (Process) components; a Layer 2 read only by ADR exception]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Approach for scaling service instances]
- Vertical: [Limits]

**Failure Modes**:
- [Failure scenario 1 and recovery approach]
- [Failure scenario 2 and recovery approach]

**Monitoring**:
- Key metrics: [Capability KPIs and request metrics]
- Health checks: [Liveness, readiness, dependency checks]
- Alerting: [Alert conditions and thresholds]

---

## Layer 5: Systems of Record & Data - Components

Use this template for a store or platform **this system owns and operates** (an authoritative database, a data-platform pipeline it runs). A packaged, core or SaaS platform run by another team is an L1 external-system descriptor (`**Type:** External System`); its containers, when needed, go in that descriptor's `## Containers` table.

### [System or Store Name]

**Type:** {C4 type}
**Technology:** [{technology with version}]
**Internal Name:** `{repository / workload / product identifier when it differs from the canonical name, e.g. shp-spa-order-history — omit the line when there is none}`
**C4 Level:** Container (L2)
**Deploys as:** {VM | on-premise | managed service}
**Communicates via:** {TCP | HTTPS | JDBC | CDC | ...}
**Description:** [<Component Name> + what it does — one line, ≤120 chars in all, opens with the canonical name (the H1) verbatim and plain]

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

**Purpose**:
[1-2 sentence description of the record this system holds]

**Authoritative For**:
- [Entity or data set this system is the source of truth for]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- Data access: [Who reads and writes, by which protocol]
- Change publication: [CDC stream, outbox, events — the way changes reach upper layers]
- Batch / files: [Batch jobs, file exchanges, schedules]

**Dependencies**:
- Depends on: [Other systems of record, storage platforms]
- Depended by: [Layer 4 (Domain Services) components; Integration capability adapters]
- Calls upward: none — changes leave as events

**Modernization Plan**:
- Current State: [Assessment]
- Target State: [Goals]
- Migration Approach: [Strategy]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Read replicas, partitioning, or N/A]
- Vertical: [Capacity planning]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Cross-Cutting Capabilities - Components

Use this template for a cross-cutting component **this system owns** — an event broker it operates, a notification or document service it builds. An API gateway is never a container file: it is named on the connections it fronts. A platform another team runs is an external-system descriptor.

### [Component Name]

**Type:** {C4 type}
**Technology:** [{technology with version}]
**Internal Name:** `{repository / workload / product identifier when it differs from the canonical name, e.g. shp-spa-order-history — omit the line when there is none}`
**C4 Level:** Container (L2)
**Deploys as:** {Docker container | serverless function | managed service | VM}
**Communicates via:** {HTTPS | gRPC | AMQP | TCP | ...}
**Description:** [<Component Name> + what it does — one line, ≤120 chars in all, opens with the canonical name (the H1) verbatim and plain]

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

**Purpose**:
[1-2 sentence description of what this component does]

**Capability**: [Integration | Identity & Security | Observability | Shared Platform Services]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints or topics]

**Dependencies**:
- Depends on: [Platforms, stores]
- Depended by: [Components of every layer that call it — name each]

**Configuration**:
- Config param 1: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact on each calling layer, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Example: Catalog Service (Layer 4: Domain Services)

### Catalog Service

**Type:** Container
**Technology:** [Java 21, Spring Boot 3.3, PostgreSQL 16, Redis 7]
**C4 Level:** Container (L2)
**Deploys as:** Docker container
**Communicates via:** HTTPS
**Description:** Catalog Service holds products, prices and availability windows and quotes the price in force per market.

**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** 2026-01-15

**Purpose**:
Hold the retailer's product catalog and quote the price in force for a product and market.

**Bounded Context**:
- **Capability**: Product catalog and pricing
- **Ubiquitous Language**: product, price list, market, availability window
- **Boundary**: stock belongs to Inventory Service, orders to Order Service

**Owned Data**:
- **Entities**: Product, PriceList, AvailabilityWindow
- **Store**: Catalog DB (PostgreSQL 16), price cache in Redis 7
- **Shared with**: none

**Invariants**:
- One active price list per market at any moment
- A product without an availability window is not orderable

**Events Published**:
- `catalog.product-changed` — on any product attribute change
- `catalog.price-changed` — when a price list is activated

**Systems of Record Reached**:
- Product Information Management (packaged, external) — nightly import through the Integration capability's file transfer

**Responsibilities**:
- Serve product search and detail to Fulfilment Process
- Quote the price in force for a product, market and date
- Import product master data from Product Information Management
- Publish catalog changes for Order Service and the Analytics Lakehouse

**APIs/Interfaces**:
- REST API: `GET /products/{id}`, `GET /products?query=`, `POST /quotes`
- Events: publishes `catalog.product-changed`, `catalog.price-changed`

**Dependencies**:
- Depends on: Catalog DB, price cache, Event Backbone (cross-cutting)
- Depended by: Fulfilment Process (Layer 3), Order Service (Layer 4, by event)

**Configuration**:
- `PRICE_CACHE_TTL`: price cache lifetime (default: 300s)
- `DEFAULT_MARKET`: market used when a request names none (default: none, request rejected)

**Scaling**:
- Horizontal: Yes, 2 to 8 replicas on request rate
- Vertical: 1 vCPU, 1 GiB per replica

**Failure Modes**:
- Catalog DB unavailable: quotes served from the price cache for up to 5 minutes, then rejected
- Price import fails: the previous price list stays active, alert raised

**Monitoring**:
- Key metrics: quote latency p95, cache hit ratio, import duration
- Alerts: quote p95 > 150 ms for 5 minutes, import failure
- Logs: every price list activation, every rejected quote with its reason

The example's Capacity section, written in the component file as its own H2:

```markdown
## Capacity <!-- LABEL: Capacity -->

| Metric | Value | Unit | Source |
|---|---|---|---|
| capacity_per_replica | 250 | rps | Load test, quotePrice |
| replicas | 2 | count | Deployment manifest |
| max_replicas | 8 | count | Autoscaler limit |
| requests_per_transaction | 3 | ratio | One search, one detail, one quote per order |
| documented_demand | Not documented | rps | |
```

---

## Guidelines

### Capacity table (mandatory shape, 8.33.0)

Every container descriptor carries `## Capacity <!-- LABEL: Capacity -->` (visible heading in `doc_language`) with exactly this table — `Metric` and `Unit` from their closed registries, `Value` a number or `Not documented`, the nuance in `Source`. See `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → Section 5 → "Capacity table".

| Metric | Value | Unit | Source |
|---|---|---|---|
| capacity_per_replica | Not documented | rps | |
| replicas | Not documented | count | |
| max_replicas | Not documented | count | |
| requests_per_transaction | Not documented | ratio | |
| documented_demand | Not documented | rps | |

1. **Document all components** in every layer, and the cross-cutting components this system owns
2. **Group components by layer** for clarity
3. **Channels and systems of record run by others** are external-system descriptors, not container files
4. **Domain Services name their bounded context, owned data, invariants and events**
5. **Process components hold process state only** — a business entity in a process store moves to its Domain Service
6. **Capability tags are optional** — only from an alignment the project carries, named exactly as it gives them
7. **Include modernization plans** for Layer 5 (Systems of Record & Data) systems being replaced
8. **Quantify metrics** in Monitoring section (not generic placeholders)
9. **Define failure modes** with realistic mitigation strategies
10. **Cross-reference layers** in Dependencies section; every skipped layer names its ADR

---

## Validation Checklist

- [ ] Components documented for all 5 ENTERPRISE layers and owned cross-cutting components
- [ ] Each component includes all required subsections and the metadata block
- [ ] Each container file carries `## Capacity <!-- LABEL: Capacity -->` in the mandatory shape
- [ ] Layer 3 (Process) components state process state, its store and compensation
- [ ] Layer 4 (Domain Services) components state bounded context, owned data, invariants and events
- [ ] Capability tags appear only where the project carries an alignment
- [ ] Layer 5 (Systems of Record & Data) components state what they are authoritative for, how changes leave, and the modernization plan
- [ ] No API gateway container file; a broker file only when this system owns it
- [ ] Dependencies clearly reference layer numbers and name the ADR of every skipped layer
- [ ] Failure modes include realistic impact and mitigation
- [ ] Monitoring includes specific metrics (not placeholders)
- [ ] Visible layer names in `doc_language`; metadata keys and anchors in English
- [ ] Example paths updated to match actual project structure
