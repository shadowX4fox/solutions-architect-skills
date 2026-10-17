# Mermaid Architecture Diagram Guide

**Purpose**: Comprehensive guide for creating Mermaid architecture diagrams for any system architecture (ENTERPRISE, 3-Tier, Microservices, N-Layer)

**Applies To**: All architecture types supported by architecture-docs skill

> **Design Language governed mode**: when `[design_language_dir]/llms-mermaid.txt` exists, its syntax contract supersedes the examples in this guide wherever they differ — in particular, write `flowchart` never `graph` and `TB` never `TD` (`M-01`/`M-02`), even where an example below shows otherwise. Normative: `references/DIAGRAM-GENERATION-GUIDE.md` § Design Language Governance.
**Version**: 2.0 (Generic)
**Last Updated**: 2025-12-03

---

## 1. Introduction

### Purpose

This document provides comprehensive instructions for creating Mermaid architecture diagrams for any system architecture. It includes templates, guidelines, and generic examples applicable to ENTERPRISE, 3-Tier, Microservices, and N-Layer architectures.

### Why Mermaid Over ASCII Art?

**Benefits of Mermaid Diagrams**:
- ✅ **Interactive**: Zoom, pan, clickable components
- ✅ **Color-coded**: Visual distinction between component types
- ✅ **Maintainable**: Text-based, easy to update without manual alignment
- ✅ **Professional**: Modern, polished appearance
- ✅ **GitHub/GitLab Native**: Renders automatically in markdown viewers
- ✅ **Version Control Friendly**: Git diffs work well with text format
- ✅ **Accessible**: Screen readers can parse the underlying text
- ✅ **Exportable**: Can generate PNG, SVG, PDF for presentations

**ASCII Art Limitations**:
- ❌ Manual alignment required
- ❌ Difficult to maintain
- ❌ No interactivity
- ❌ No color-coding
- ❌ Breaks easily with edits
- ❌ Time-consuming to create

---

## 2. Prerequisites

### Mermaid Version Compatibility

**Minimum Version**: Mermaid 8.0+
**Recommended Version**: Mermaid 10.0+ (for best styling support)

### Rendering Compatibility

**Native Rendering** (no plugins required):
- GitHub (markdown files)
- GitLab (markdown files)
- Azure DevOps (markdown files)

**With Extensions/Plugins**:
- **VS Code**: Install "Markdown Preview Mermaid Support" extension
- **JetBrains IDEs**: Enable Mermaid plugin in Markdown settings
- **MkDocs**: Add `pymdownx.superfences` with Mermaid support
- **Docusaurus**: Built-in Mermaid support (v2.0+)
- **Confluence**: Install "Mermaid Diagrams for Confluence" app

### Testing Rendering

**Command Line** (Mermaid CLI):
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i ARCHITECTURE.md -o architecture-diagram.png
```

**Online Editor** (for testing):
- https://mermaid.live/

---

## 3. Complete Mermaid Diagram Template

### Full Working Example

This example shows a generic layered architecture (six illustrative layers; ENTERPRISE uses five) with Layer 3 (event-driven) components in detail:

````markdown
```mermaid
graph TB
    %% Layer 1: Channels
    subgraph Layer1["Layer 1: Channels"]
        WebClient["Web Client"]
        MobileClient["Mobile Client"]
        APIClient["API Client"]
    end

    %% Layer 2: User Experience
    subgraph Layer2["Layer 2: User Experience"]
        APIGateway["API Gateway"]
        BFF["Backend for Frontend<br/>(BFF Services)"]
    end

    %% Layer 3: Business Scenarios (DETAILED)
    subgraph Layer3["Layer 3: Business Scenarios<br/>(Decouple Through Events)"]
        %% Orchestrator Service
        OrchestratorService["Orchestrator Service<br/>REST API: /api/v1/resources"]

        %% Event Topics
        EventTopicA["Event Topic:<br/>event-stream-alpha<br/>18 partitions, 3-day retention"]
        EventTopicB["Event Topic:<br/>event-stream-beta<br/>12 partitions, 14-day retention"]

        %% Workers
        WorkerA["Worker Service A<br/>Event Handler: TYPE_A"]
        WorkerB["Worker Service B<br/>Event Handler: TYPE_B"]

        %% Query Service
        QueryService["Query Service<br/>Query API: /api/v1/query/*<br/>Materialized Views"]
    end

    %% Layer 4: Business
    subgraph Layer4["Layer 4: Business"]
        BusinessServiceA["Business Service A"]
        BusinessServiceB["Business Service B"]
    end

    %% Layer 5: Domain
    subgraph Layer5["Layer 5: Domain Services"]
        DomainServiceA["Domain Service A"]
        DomainServiceB["Domain Service B"]
        DomainServiceC["Domain Service C"]
        DomainServiceD["Domain Service D"]
    end

    %% Layer 6: Core
    subgraph Layer6["Layer 6: Core Systems"]
        CoreSystemA["Core System A"]
        CoreSystemB["Core System B"]
    end

    %% Data Flows - Layer 1 to Layer 2
    %% NOTE: edge labels follow the canonical <PROTOCOL>/<STYLE> [Action Type] form.
    %% Auth posture (OAuth/JWT/mTLS), timeouts, retries, consumer-group names, event
    %% sequences (STARTED/COMPLETED/FAILED) and topic-name detail live in
    %% docs/04-data-flow-patterns.md and docs/07-security-architecture.md — not on edges.
    WebClient -->|HTTPS/JSON [Data]| APIGateway
    MobileClient -->|HTTPS/JSON [Data]| APIGateway
    APIClient -->|HTTPS/JSON [Data]| APIGateway

    %% Data Flows - Layer 2 to Layer 3
    APIGateway -->|HTTPS/JSON [Data]| OrchestratorService
    APIGateway -.->|HTTPS/JSON [Query]| QueryService

    %% Data Flows - Layer 3 Internal (Async Event Decoupling)
    OrchestratorService -.->|TLS/AVRO [Event]| EventTopicA
    OrchestratorService -.->|TLS/AVRO [Event]| EventTopicB

    EventTopicA -.->|TLS/AVRO [Event]| WorkerA
    EventTopicA -.->|TLS/AVRO [Event]| WorkerB

    WorkerA -.->|TLS/AVRO [Event]| EventTopicB
    WorkerB -.->|TLS/AVRO [Event]| EventTopicB

    EventTopicB -.->|TLS/AVRO [Event]| QueryService
    EventTopicB -.->|TLS/AVRO [Event]| BusinessServiceA

    %% Data Flows - Layer 3 to Layer 5 (Domain Calls)
    WorkerA -->|gRPC/PROTOBUF [Internal]| DomainServiceA
    WorkerB -->|gRPC/PROTOBUF [Internal]| DomainServiceC
    WorkerB -->|gRPC/PROTOBUF [Internal]| DomainServiceD

    %% Data Flows - Layer 4 to Layer 5
    BusinessServiceA -->|gRPC/PROTOBUF [Internal]| DomainServiceA
    BusinessServiceA -->|gRPC/PROTOBUF [Internal]| DomainServiceB
    BusinessServiceB -->|gRPC/PROTOBUF [Internal]| DomainServiceC
    BusinessServiceB -->|gRPC/PROTOBUF [Internal]| DomainServiceD

    %% Data Flows - Layer 5 to Layer 6
    DomainServiceA -->|HTTPS/JSON [Data]| CoreSystemA
    DomainServiceB -->|HTTPS/JSON [Data]| CoreSystemB

    %% Styling
    classDef orchestrator fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    classDef worker fill:#F5A623,stroke:#B8791A,stroke-width:2px,color:#fff
    classDef query fill:#7ED321,stroke:#5A9B18,stroke-width:2px,color:#fff
    classDef events fill:#BD10E0,stroke:#8A0CA3,stroke-width:2px,color:#fff
    classDef domain fill:#50E3C2,stroke:#3AA893,stroke-width:2px,color:#000
    classDef gateway fill:#9B9B9B,stroke:#6B6B6B,stroke-width:2px,color:#fff

    class OrchestratorService orchestrator
    class WorkerA,WorkerB worker
    class QueryService query
    class EventTopicA,EventTopicB events
    class DomainServiceA,DomainServiceB,DomainServiceC,DomainServiceD domain
    class APIGateway,BFF gateway
```
````

### Structure Breakdown

**Diagram Type**: `graph TB` (top-to-bottom flowchart)
- **TB** = Top-to-Bottom (vertical layout)
- Alternative: `graph LR` (left-to-right) for horizontal layouts

**Key Sections**:
1. **Subgraphs**: One per architecture layer (six in this illustration)
2. **Components**: Labeled rectangles with names and descriptions
3. **Data Flows**: Arrows connecting components
4. **Styling**: classDef declarations for color-coding

**Comments**: Use `%%` for comments (ignored in rendering)

---

## 4. Component Guidelines

### Component Types and Representation

#### 1. Microservices / Applications

**Syntax**:
```mermaid
ComponentName["Display Name<br/>Additional Info"]
```

**Examples**:
```mermaid
OrchestratorService["Orchestrator Service<br/>REST API: /api/v1/resources"]
WorkerA["Worker Service A<br/>Event Handler: TYPE_A"]
```

**Guidelines**:
- Use PascalCase for component IDs (e.g., `WorkerA`, `ServiceB`)
- Use descriptive display names
- Add key info with `<br/>` line breaks
- Keep descriptions concise (1-2 lines max)

#### 2. Event Streaming Topics (Kafka, RabbitMQ)

**Syntax**:
```mermaid
TopicName["Kafka Topic:<br/>topic-name<br/>partitions, retention"]
```

**Example**:
```mermaid
EventTopicA["Event Topic:<br/>event-stream-alpha<br/>18 partitions, 3-day retention"]
```

**Guidelines**:
- Prefix with "Kafka Topic:" or "RabbitMQ Queue:"
- Include partition count and retention policy
- Use purple color styling

#### 3. Databases / Data Stores

**Syntax**:
```mermaid
DBName[("Database Name<br/>Type")]
```

**Example**:
```mermaid
DataStoreA[("PostgreSQL<br/>Primary Data Store")]
```

**Guidelines**:
- Use `(( ))` for cylindrical database shape
- Include database type and purpose

#### 4. External Systems / APIs

**Syntax**:
```mermaid
SystemName["System Name<br/>(External)"]
```

**Example**:
```mermaid
CoreSystemA["Core System A<br/>(External)"]
```

**Guidelines**:
- Clearly mark as external if applicable
- Use rounded rectangles for external systems

### Naming Conventions

**Component IDs** (internal references):
- PascalCase: `OrchestratorService`, `WorkerA`, `QueryService`
- No spaces, no special characters
- Descriptive but concise

**Display Names** (visible labels):
- Title Case or Sentence case
- Include context (e.g., "Worker Service A" not just "Worker")
- Add clarifying info (API endpoints, event handlers, pod counts)

---

## 5. Data Flow Guidelines

> **Note**: This section covers data flow **arrows in `graph TB` topology diagrams** (Diagrams 1 and 4). For per-flow **sequence diagrams**, use `sequenceDiagram` format as defined in `references/DIAGRAM-GENERATION-GUIDE.md` → "Data Flow Diagrams — Sequence Diagrams". For C4 diagrams (Diagrams 2 and 3), use native `C4Context` / `C4Container` syntax — see DIAGRAM-GENERATION-GUIDE for templates.
>
> **Infrastructure scope differs by diagram type**: C4 L1 and L2 (Diagrams 2 and 3) collapse transit infrastructure (APIM, brokers, topics, queues, service mesh, iPaaS) into edge labels — see `DIAGRAM-GENERATION-GUIDE.md` → "Infrastructure-as-via Rule (L1)" and "(L2)". The Detailed View (Diagram 4, `graph TB` below) is the place where every topic, queue, and broker IS a first-class node — operational fidelity lives here.
>
> **Connection-label normal form**: The 4th `Rel()` parameter at L1 / L2 follows the canonical `<PROTOCOL>/<STYLE> [Action Type]` form (e.g. `"HTTPS/JSON [Data]"`, `"TLS/AVRO [Event]"`, `"gRPC/PROTOBUF [Internal]"`) per `DIAGRAM-GENERATION-GUIDE.md` → "Connection Naming Rule (L1 + L2)". Diagram 4 (`graph TB` below) follows the same normal form on its arrow labels — `SVC_A -- "HTTPS/JSON [Data]" --> SVC_B`, `PROD -. "TLS/AVRO [Event]" .-> CONS`. The 3rd parameter (description) carries human prose: verb, via-hop in parentheses, topic / queue + async flag.
>
> **Sequence diagrams are exempt from the Connection Naming Rule.** Per `DIAGRAM-GENERATION-GUIDE.md` → "Connection Naming Rule (L1 + L2)" → Scope, message labels in `sequenceDiagram` blocks (`A->>B: ...`, `A-->>B: ...`, `A-)B: ...`) are **free prose** describing what flows step-by-step. Do NOT append `[Action Type]` tags, do NOT enforce `<PROTOCOL>/<STYLE>` casing on sequence-diagram messages. They remain bound only by Pre-Write Validation (no `<br/>` / HTML tags, no `;` in message text, no emoji). Audit gates and reviewers: when the diagram's first line is `sequenceDiagram`, skip Connection-Naming-Rule checks entirely.

### Synchronous Flows (Solid Arrows)

**Syntax**:
```mermaid
SourceComponent -->|<PROTOCOL>/<STYLE> [Action Type]| TargetComponent
```

The whole edge label is one string of the canonical form — no `<br/>`, no second line, no comma-separated operational fields. Per the Connection Naming Rule (L1 + L2) in `references/DIAGRAM-GENERATION-GUIDE.md`, the closed `[Action Type]` registry is the fifteen of `llms-rules.txt` §5.4 — `[Data] [Query] [Event] [Internal] [Cache] [Command] [Stream] [File] [Batch] [Auth] [Notification] [Replication] [Telemetry] [Transaction] [Config]` — followed by at most one data-scope qualifier and at most one composition qualifier (`· loads` / `· publish` / `· served from`), all registries closed; every label passes the Connection Label Check before the block is written.

**Examples**:
```mermaid
APIGateway -->|HTTPS/JSON [Data]| OrchestratorService
ServiceA   -->|gRPC/PROTOBUF [Internal]| ServiceB
QueryAPI   -->|HTTPS/JSON [Query]| QueryService
DomainSvc  -->|JDBC/SQL [Query]| OperationalDB
```

**Guidelines**:
- Use solid arrows (`-->`) for synchronous calls (REST, gRPC, SOAP, JDBC).
- The label MUST follow `<PROTOCOL>/<STYLE> [Action Type]` exactly — one line, one bracket, one action-type token from the closed vocabulary.
- **One edge per (A → B, [Action Type]) tuple.** If A→B exchanges multiple entities over the same protocol/action-type, collapse them into one edge — never draw parallel `[Data]` edges between the same pair.
- **Operational detail does not go on the edge.** Timeouts, retry policy, circuit-breaker thresholds, idempotency keys, sequence numbers, status codes, and HTTP method+path live in the per-flow sequence diagram and prose in `docs/04-data-flow-patterns.md`.
- **Security posture does not go on the edge.** Auth mechanism (mTLS, OAuth 2.0 + JWT, API Key) lives in `docs/07-security-architecture.md`. The edge carries the transport (`HTTPS`, `gRPC`, `JDBC`), not the auth tier.
- **Transit infrastructure does not become a separate edge field.** In C4 L1 / L2 (`C4Container` syntax) it collapses into the 3rd `Rel()` parameter as `(via Kong)`, `(via Apigee → AWS APIGW)` per the Infrastructure-as-via Rule. In `graph TB` Diagram 4 it can appear as a node (the Detailed View admits brokers/queues/topics as nodes), but the edge label is still the canonical form.

### Asynchronous Flows (Dashed Arrows)

**Syntax**:
```mermaid
SourceComponent -.->|<PROTOCOL>/<STYLE> [Action Type]| TargetComponent
```

**Examples**:
```mermaid
PublisherService -.->|TLS/AVRO [Event]| EventTopicA
EventTopicA      -.->|TLS/AVRO [Event]| WorkerA
WorkerA          -.->|TLS/AVRO [Event]| EventTopicB
SettlementSvc    -.->|AMQP/JSON [Event]| SettlementsQueue
```

**Guidelines**:
- Use dashed arrows (`-.->`) for asynchronous events (Kafka, RabbitMQ, event buses).
- The label MUST follow `<PROTOCOL>/<STYLE> [Action Type]` with `[Event]` as the action type for event traffic (or `[Stream]` for unbounded streaming pipelines).
- **One edge per (A → B, [Event]) tuple.** Multiple event types between the same producer/consumer pair collapse to one edge.
- **Topic names, consumer groups, partition counts, retention windows, and event-type sequences (`STARTED → COMPLETED → FAILED`) do not go on the edge.** Topic / queue identity is encoded in the *node* (e.g. `EventTopicA["Event Topic: event-stream-alpha"]`), and the dynamics — consumer-group routing, event-type ordering, replay semantics, at-least-once vs exactly-once — live in `docs/04-data-flow-patterns.md`.
- **Async flag is implicit in the arrow style.** `-.->` already says "async"; don't repeat it as text on the edge.
- **Security posture** (TLS 1.2+, SASL/SCRAM) lives in `docs/07-security-architecture.md`.

> **Cross-reference**: For end-to-end retry/timeout/event-sequence/error-path detail per flow, see the matching `sequenceDiagram` in `docs/04-data-flow-patterns.md`. The L2 / Diagram 4 view answers "who talks to whom, over what protocol, with what data class" — the data-flow file answers "in what order, with what guarantees, and what happens on failure."

### Bidirectional Flows

**Syntax**:
```mermaid
Component1 <-->|Request/Response| Component2
```

**Example**:
```mermaid
APIGateway <-->|HTTPS/JSON [Data]| BackendService
```

**Guidelines**:
- Use bidirectional arrows (`<-->`) sparingly.
- Typically for request/response patterns where both directions carry the same protocol and action type.
- Label follows the canonical `<PROTOCOL>/<STYLE> [Action Type]` form — same constraints as sync/async edges.
- Can combine with dashed for async bidirectional.
- If the two directions carry different protocols or action types, draw two separate edges instead.

---

## 6. Standard Color Scheme

> **Scope — read first (v4.3.0).** This section does **NOT** apply to the four standard diagrams in `docs/03-architecture-layers.md`. Diagrams 1 (Logical View) and 4 (Detailed View) emit the fixed four-role `zone` / `unit` / `store` / `ext` palette defined in `references/DIAGRAM-GENERATION-GUIDE.md` → Diagram 1 § "Palette"; Diagrams 2 and 3 take native Mermaid C4 colouring. The role-based scheme below assigns fill by **what a component does**, which is colour-as-meaning — the pattern the standard diagrams deliberately moved away from, because it duplicates what the `subgraph` bands already state and does not survive greyscale.
>
> What this section still governs: the **optional** diagrams from the Workflow 8 menu (infrastructure & deployment, HA & failover, performance & scaling, integration, security) and any ad-hoc diagram outside `docs/03-architecture-layers.md`. If you are generating a standard diagram, stop here and use the four-role palette.

### Color Palette

**Blue - Entry Points / Orchestrators**:
- Fill: `#4A90E2`
- Stroke: `#2E5C8A`
- Text: White (`#fff`)
- **Use for**: Orchestrator services, coordinators, entry point services

**Orange - Workers / Executors**:
- Fill: `#F5A623`
- Stroke: `#B8791A`
- Text: White (`#fff`)
- **Use for**: Worker microservices, executors, processors, event handlers

**Green - Query Services / CQRS Read Models**:
- Fill: `#7ED321`
- Stroke: `#5A9B18`
- Text: White (`#fff`)
- **Use for**: Query services, CQRS read models, reporting services

**Purple - Event Streaming**:
- Fill: `#BD10E0`
- Stroke: `#8A0CA3`
- Text: White (`#fff`)
- **Use for**: Kafka topics, RabbitMQ queues, event buses

**Teal - Domain Services**:
- Fill: `#50E3C2`
- Stroke: `#3AA893`
- Text: Black (`#000`)
- **Use for**: BIAN service domains, business logic services, domain APIs

**BIAN Service Domain Names in Diagrams**: When including Layer 4 (Domain Services) services in BIAN-tagged ENTERPRISE architecture diagrams, use official BIAN v14.0.0 service domain **names (Capabilities)**. Reference the [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html) to validate capability names (e.g., Payment Execution, Account Transfer). BIAN IDs (e.g., SD-003, SD-045) are for internal document tracking only.

**Default BIAN Version**: BIAN v14.0.0 is the default and recommended version for all BIAN-tagged architecture diagrams.

**Gray - Infrastructure**:
- Fill: `#9B9B9B`
- Stroke: `#6B6B6B`
- Text: White (`#fff`)
- **Use for**: API Gateway, load balancers, proxies, infrastructure components

### Applying Color Scheme

**Step 1: Define Color Classes**:
```mermaid
classDef orchestrator fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
classDef worker fill:#F5A623,stroke:#B8791A,stroke-width:2px,color:#fff
classDef query fill:#7ED321,stroke:#5A9B18,stroke-width:2px,color:#fff
classDef events fill:#BD10E0,stroke:#8A0CA3,stroke-width:2px,color:#fff
classDef domain fill:#50E3C2,stroke:#3AA893,stroke-width:2px,color:#000
classDef gateway fill:#9B9B9B,stroke:#6B6B6B,stroke-width:2px,color:#fff
```

**Step 2: Assign Classes to Components**:
```mermaid
class OrchestratorService orchestrator
class WorkerA,WorkerB worker
class QueryService query
class EventTopicA,EventTopicB events
class DomainServiceA,DomainServiceB,DomainServiceC,DomainServiceD domain
class APIGateway,BFF gateway
```

**Guidelines**:
- Define all classes at the end of the diagram (after data flows)
- Assign multiple components to same class with comma separation
- Use consistent naming for classDef IDs

### Dark Theme Color Scheme

When generating diagrams for dark-background environments, use these `classDef` declarations instead. The class **names** are identical to the light scheme — only hex values differ.

**Detect** (fallback mode only — governed blocks carry the §9 directive and ignore this): read `<!-- DIAGRAM_THEME: dark -->` from `docs/03-architecture-layers.md`; absent, the theme is light and nobody is asked. See `references/DIAGRAM-GENERATION-GUIDE.md` → "Theme Preference Detection".

**Dark classDef declarations**:
```mermaid
classDef orchestrator fill:#5BA0F2,stroke:#7DB8FF,stroke-width:2px,color:#fff
classDef worker fill:#FFB83D,stroke:#FFCE6D,stroke-width:2px,color:#000
classDef query fill:#8FE432,stroke:#A8F060,stroke-width:2px,color:#000
classDef events fill:#D040F0,stroke:#E070FF,stroke-width:2px,color:#fff
classDef domain fill:#60F3D2,stroke:#80FFE6,stroke-width:2px,color:#000
classDef gateway fill:#B0B0B0,stroke:#D0D0D0,stroke-width:2px,color:#000
```

**Design rationale**: Dark-mode fills are ~15-20% lighter than their light-mode counterparts. Strokes are lighter than fills to remain visible against dark backgrounds (`#1e1e1e` to `#2d2d2d`). Text color flips to black (`#000`) on lighter fills for WCAG AA contrast compliance.

**C4 and Sequence diagrams**: For dark theme, prepend `%%{init: {'theme': 'dark'}}%%` as the first line inside the Mermaid code fence (before `C4Context`, `C4Container`, or `sequenceDiagram`). No `classDef` needed — Mermaid applies dark theme natively.

---

## 7. Legend Template

### Complete Reusable Legend

Include this legend after every Mermaid architecture diagram:

```markdown
**Diagram Legend**:

**Arrow Types**:
- **Solid arrows (→)**: Synchronous calls (REST, gRPC, SOAP, JDBC).
- **Dashed arrows (-.->)**: Asynchronous events (Kafka, RabbitMQ, event buses).
- **Bidirectional (↔)**: Request/response patterns where both directions share protocol and action type.

**Edge Labels**: Follow the canonical `<PROTOCOL>/<STYLE> [Action Type]` form per `references/DIAGRAM-GENERATION-GUIDE.md` → "Connection Naming Rule (L1 + L2)". The closed `[Action Type]` registry is the fifteen of `llms-rules.txt` §5.4 — `[Data] [Query] [Event] [Internal] [Cache] [Command] [Stream] [File] [Batch] [Auth] [Notification] [Replication] [Telemetry] [Transaction] [Config]` — plus at most one registered data-scope qualifier and at most one of the three composition qualifiers; every label passes the guide's Connection Label Check before the block is written.

**What's NOT on the diagram** (and where it lives instead):
- Security posture — auth mechanism (OAuth 2.0 + JWT, mTLS, TLS 1.2+, SASL) → `docs/07-security-architecture.md`.
- Operational detail — timeouts, retry policy, circuit breaker thresholds, error codes, sequence numbers, idempotency keys → `docs/04-data-flow-patterns.md` (per-flow `sequenceDiagram` + prose).
- Transit infrastructure — gateways, brokers, queues, service meshes, iPaaS collapse via the Infrastructure-as-via Rule at L1 / L2; in Diagram 4 (Detailed View) they may appear as nodes but edge labels still use the canonical form.

**Component Colors**:
- **Blue**: Entry points (orchestrators, coordinators)
- **Orange**: Worker microservices (event handlers, executors)
- **Green**: Query services (CQRS read models, reporting)
- **Purple**: Event streaming (event topics, message queues)
- **Teal**: Domain services (business logic, domain APIs)
- **Gray**: Infrastructure (API Gateway, load balancers)

**[Optional] Kafka Consumer Groups**:
- `group-name-1`: Purpose description
- `group-name-2`: Purpose description

**[Optional] Data Flow Patterns**:
- **Pattern 1**: Description of flow
- **Pattern 2**: Description of flow
```

### Customizing the Legend

**Add sections as needed**:
- Database schemas
- Scaling policies
- Retry strategies
- Event types
- API versions

**Keep it concise**:
- Max 10 bullet points per section
- Use bold for emphasis
- Use code formatting for technical terms

---

## 8. Step-by-Step Instructions

### Creating a New Mermaid Diagram

**Step 1: Identify Architecture Layers**

List all layers in your architecture:
- Example: Channels, User Experience, Business Scenarios, Business, Domain, Core

**Step 2: Map Components to Layers**

For each layer, identify:
- Components (services, APIs, databases)
- External systems
- Event streaming infrastructure

**Step 3: Define Data Flows**

Identify:
- **Synchronous**: REST APIs, gRPC calls, SOAP services
- **Asynchronous**: Kafka events, message queues, webhooks

**Step 4: Create Mermaid Diagram**

```mermaid
graph TB
    %% Layer 1
    subgraph Layer1["Layer 1: Layer Name"]
        Component1["Component 1"]
        Component2["Component 2"]
    end

    %% Add more layers...

    %% Data Flows — canonical form: <PROTOCOL>/<STYLE> [Action Type]
    Component1 -->|HTTPS/JSON [Data]| Component2
```

**Step 5: Apply Color Scheme**

Add classDef declarations and assign classes to components (see Section 6).

**Step 6: Add Legend**

Include comprehensive legend explaining all diagram elements (see Section 7).

**Step 7: Validate Rendering**

Test in:
- GitHub/GitLab preview
- VS Code Mermaid preview
- https://mermaid.live/

### Updating an Existing Mermaid Diagram

**Step 1: Locate Diagram Section**

Find the Mermaid diagram in ARCHITECTURE.md (typically Section 4).

**Step 2: Identify Changes**

Determine what needs to change:
- Add new component
- Remove obsolete component
- Update data flow
- Modify security annotations

**Step 3: Update Component Definitions**

**Add Component**:
```mermaid
%% In appropriate layer subgraph
NewComponent["New Component Name<br/>Description"]
```

**Remove Component**:
- Delete component definition
- Delete all arrows referencing the component
- Remove from class assignments

**Step 4: Update Data Flows**

**Add Flow** (label must follow `<PROTOCOL>/<STYLE> [Action Type]`):
```mermaid
SourceComponent -->|HTTPS/JSON [Data]| NewComponent
```

**Remove Flow**:
- Delete the arrow line.

**Modify Flow**:
- Update label with the new protocol/style (e.g. `gRPC/PROTOBUF [Internal]`) or new action type (e.g. `[Data]` → `[Query]` if the call's semantics change).
- Security posture changes (mTLS, OAuth, TLS version) → update `docs/07-security-architecture.md`, not the edge label.
- Timeout/retry/circuit-breaker changes → update the per-flow `sequenceDiagram` and prose in `docs/04-data-flow-patterns.md`.

**Step 5: Update Styling**

If new component type:
```mermaid
classDef newtype fill:#HEXCOLOR,stroke:#HEXCOLOR,stroke-width:2px,color:#fff
class NewComponent newtype
```

**Step 6: Update Legend**

Add new sections if needed:
- New component color
- New protocol
- New consumer group

**Step 7: Validate Rendering**

Test updated diagram renders correctly.

---

## 9. Integration Checklist

Before committing Mermaid diagram changes, verify:

### Syntax Validation
- ✅ Mermaid code renders without errors in GitHub/GitLab preview
- ✅ All opening subgraphs have closing `end` statements
- ✅ All component IDs are unique (no duplicates)
- ✅ All arrows reference valid component IDs
- ✅ Quotes are properly closed in labels

### Visual Validation
- ✅ All layers are visible and properly labeled
- ✅ Components are in the correct layers
- ✅ Data flows are accurate (direction, labels)
- ✅ Colors are applied correctly (classDef assignments)
- ✅ No overlapping arrows or components
- ✅ Diagram layout is readable (not too cluttered)

### Content Validation
- ✅ Security protocols are accurate (mTLS, OAuth, SASL)
- ✅ Timeouts and retries match architecture specifications
- ✅ Consumer groups are correctly labeled
- ✅ Event types are listed accurately
- ✅ Component descriptions are up-to-date

### Legend Validation
- ✅ Legend explains all arrow types used
- ✅ Legend documents all security protocols used
- ✅ Legend lists all component colors used
- ✅ Legend includes consumer groups if applicable
- ✅ Legend includes data flow patterns if complex

### Cross-Reference Validation
- ✅ Diagram matches component details in Section 5
- ✅ Data flows match descriptions in Section 6
- ✅ Integration points match Section 7
- ✅ Performance metrics referenced (not shown on diagram)

---

## 10. Common Scenarios and Examples

### Scenario 1: Add New Microservice

**Task**: Add a new "ServiceC" microservice that consumes events from an event topic.

**Steps**:

1. **Add component to Layer 3 subgraph**:
```mermaid
subgraph Layer3["Layer 3: Business Scenarios"]
    %% Existing components...

    %% New component
    ServiceC["Service C<br/>Event Handler: TYPE_C"]
end
```

2. **Add data flow from event topic**:
```mermaid
EventTopicA -.->|TLS/AVRO [Event]| ServiceC
```

3. **Add data flow to domain service**:
```mermaid
ServiceC -->|gRPC/PROTOBUF [Internal]| DomainServiceB
```

4. **Add lifecycle event publishing**:
```mermaid
ServiceC -.->|TLS/AVRO [Event]| EventTopicB
```

5. **Apply color styling**:
```mermaid
class ServiceC worker
```

6. **Document the dynamics in `docs/04-data-flow-patterns.md`** — add a flow entry covering: consumer-group routing (e.g. `service-c-group` reads `event-stream-alpha` filtered by `TYPE_C`), the `STARTED → COMPLETED → FAILED` lifecycle sequence ServiceC publishes back, retry/timeout for the gRPC call to DomainServiceB, and failure paths. These belong in the per-flow `sequenceDiagram`, not on the L2 / Diagram 4 edge labels.

---

### Scenario 2: Add New Event Topic

**Task**: Add a new "notification-events" event topic for notification management.

**Steps**:

1. **Add topic component to Layer 3**:
```mermaid
EventTopicC["Event Topic:<br/>notification-events<br/>6 partitions, 7-day retention"]
```

2. **Add producer flow**:
```mermaid
ServiceD -.->|TLS/AVRO [Event]| EventTopicC
```

3. **Add consumer flow**:
```mermaid
EventTopicC -.->|TLS/AVRO [Event]| ServiceE
```

> Event-type semantics (`Notification Event`), consumer group name (`notification-handler-group`), partition routing, and replay behavior go in `docs/04-data-flow-patterns.md`, not on the edge label.

4. **Apply color styling**:
```mermaid
class EventTopicC events
```

5. **Update legend** (add to description):
```markdown
**Event Topics**:
- event-stream-alpha: Primary event stream
- event-stream-beta: Lifecycle events
- notification-events: Notification events (new)
```

---

### Scenario 3: Update Data Flow (Change Protocol)

**Task**: Change ServiceB → Domain Service calls from gRPC/PROTOBUF to HTTPS/JSON (e.g. because a downstream consumer no longer supports the Protobuf schema registry).

**Steps**:

1. **Locate existing data flow arrows**:
```mermaid
ServiceB -->|gRPC/PROTOBUF [Internal]| DomainServiceA
```

2. **Update arrow labels** (only the `<PROTOCOL>/<STYLE>` half changes — `[Action Type]` stays the same because the *kind* of traffic is unchanged):
```mermaid
ServiceB -->|HTTPS/JSON [Internal]| DomainServiceA
```

3. **Update operational detail in `docs/04-data-flow-patterns.md`** — if retry/timeout semantics differ between gRPC and HTTPS for this flow (they usually do — HTTP/1.1 head-of-line blocking changes the timeout calculus), revise the per-flow `sequenceDiagram` and prose there. Security posture changes (mTLS variant, certificate authority) go in `docs/07-security-architecture.md`.

---

### Scenario 4: Add New Layer

**Task**: Add Layer 7 (External Systems) below Layer 6.

**Steps**:

1. **Add new subgraph**:
```mermaid
%% Layer 7: External Systems
subgraph Layer7["Layer 7: External Systems"]
    PaymentGateway["Payment Gateway<br/>(External)"]
    CreditBureau["Credit Bureau API<br/>(External)"]
end
```

2. **Add data flows from Layer 6**:
```mermaid
CoreBanking -->|HTTPS/JSON [Data]| PaymentGateway
CoreBanking -->|HTTPS/JSON [Data]| CreditBureau
```

> Auth posture (API Key vs mTLS, the per-edge difference between PaymentGateway and CreditBureau) is encoded in `docs/07-security-architecture.md` — not on the edge label.

3. **Apply color styling** (use gray for external):
```mermaid
classDef external fill:#9B9B9B,stroke:#6B6B6B,stroke-width:2px,color:#fff
class PaymentGateway,CreditBureau external
```

4. **Update legend**:
```markdown
**Component Colors**:
- **Gray**: Infrastructure and external systems
```

---

### Scenario 5: Replace Existing Component

**Task**: Replace "DomainServiceA" with "DomainServiceX".

**Steps**:

1. **Find and delete old component**:
```mermaid
%% DELETE THIS:
DomainServiceA["Domain Service A"]
```

2. **Add new component**:
```mermaid
DomainServiceX["Domain Service X<br/>Enhanced API: /api/v2/resources"]
```

3. **Update all arrows referencing old component**:
```mermaid
%% OLD:
WorkerA -->|gRPC/PROTOBUF [Internal]| DomainServiceA

%% NEW:
WorkerA -->|gRPC/PROTOBUF [Internal]| DomainServiceX
```

4. **Update class assignments**:
```mermaid
%% OLD:
class DomainServiceA domain

%% NEW:
class DomainServiceX domain
```

5. **Update legend** (if needed):
```markdown
- Domain Service X: Enhanced version replacing Domain Service A with additional capabilities
```

---

## 11. Best Practices

### Do's

✅ **Use consistent naming conventions**:
- Component IDs: PascalCase
- Consumer groups: kebab-case
- Topics: kebab-case

✅ **Keep diagrams focused**:
- Show 1-2 layers in detail, others simplified
- Avoid cluttering with every single component

✅ **Label all arrows**:
- Include protocol, security, timeout
- Be concise but informative

✅ **Use color-coding consistently**:
- Apply same colors across all diagrams
- Document color meanings in legend

✅ **Test rendering regularly**:
- Check in GitHub/GitLab preview
- Validate in Mermaid live editor

✅ **Version control diagrams**:
- Commit diagram changes with descriptive messages
- Reference architecture decision records (ADRs)

### Don'ts

❌ **Don't overload diagrams**:
- Avoid showing every component in one diagram
- Create multiple focused diagrams instead

❌ **Don't forget the legend**:
- Always include comprehensive legend
- Explain all symbols and colors used

❌ **Don't use ambiguous labels**:
- "Svc1" → "Orchestrator Service"
- "DB" → "PostgreSQL Primary Data Store"

❌ **Don't mix ASCII and Mermaid**:
- Choose one format per document
- If migrating, replace all diagrams at once
- **Settled for the 4 standard diagrams as of plugin v4.3.0**: the Logical View moved from ASCII box art to Mermaid `flowchart TB`, so `docs/03-architecture-layers.md` is uniformly Mermaid. When regenerating a pre-v4.3.0 architecture, delete the ASCII block under `#### Diagram: Logical View` — leaving both notations under one heading fails the DIAGRAMS_GATE (`ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md` → Step 7.3, check D1)

❌ **Don't neglect security annotations**:
- Always show mTLS, OAuth, API keys
- Don't assume readers know protocols

❌ **Don't use custom colors without documentation**:
- Stick to standard palette
- If adding new color, document in legend

---

## 12. Integration with solutions-architect-skills

### Recommended Skill Enhancement

**Skill Name**: `sa-skills:architecture-docs`

**New Capabilities to Add**:

1. **Generate Mermaid Diagrams**:
   - Use this template as base
   - Prompt for architecture layers
   - Prompt for components per layer
   - Prompt for data flows
   - Auto-generate Mermaid code

2. **Update Existing Diagrams**:
   - Parse existing Mermaid diagram
   - Identify components and flows
   - Offer modification options (add/remove/update)
   - Regenerate Mermaid code

3. **Validate Diagrams**:
   - Check syntax correctness
   - Verify all IDs are unique
   - Ensure all arrows reference valid components
   - Validate legend completeness

4. **Export Diagrams**:
   - Generate PNG/SVG using Mermaid CLI
   - Export for presentations

### Implementation Hints

**Prompt Templates**:
- "Generate a Mermaid architecture diagram for [ARCHITECTURE_NAME]"
- "Update the Mermaid diagram in ARCHITECTURE.md to add [COMPONENT_NAME]"
- "Replace the ASCII diagram with a Mermaid diagram in [FILE_PATH]"

**Required Inputs**:
- Architecture layers (e.g., "5-layer ENTERPRISE architecture")
- Components per layer
- Data flow types (sync vs async)
- Security protocols

**Auto-Generated Sections**:
- classDef declarations (use standard color palette)
- Legend (use template from Section 7)
- Component descriptions (from architecture doc)

---

## 13. Reference Examples

For complete, working Mermaid diagram examples, see the Section 4 templates:

**Section 4 Templates**:
- **ENTERPRISE Architecture**: `templates/SECTION_4_ENTERPRISE.md` (5-layer enterprise pattern)
- **3-Tier Architecture**: `templates/SECTION_4_3TIER.md` (classic web application pattern)
- **Microservices Architecture**: `templates/SECTION_4_MICROSERVICES.md` (cloud-native distributed pattern)

Each template includes:
- Complete Mermaid diagram example with realistic component names
- Layer/Tier-specific component organization
- Communication patterns (synchronous/asynchronous)
- Legend and customization instructions
- Color coding appropriate for architecture type
- Security protocols and data flow patterns

**Usage**:
1. Choose the template that matches your architecture type
2. Copy the Mermaid diagram from Section 4 of the template
3. Customize component names and flows for your specific system
4. Update the legend to reflect your actual components and patterns
5. Validate rendering in your documentation platform

**Benefits**:
- ✅ Realistic examples show patterns in context
- ✅ Architecture-specific best practices
- ✅ Ready-to-use diagrams that render in GitHub/GitLab
- ✅ Professional, maintainable, interactive visualizations

---

## 14. Conclusion

This document provides everything needed to create Mermaid architecture diagrams for any system architecture:

- ✅ Generic working template applicable to all architecture types
- ✅ Component guidelines with architecture-agnostic examples
- ✅ Data flow patterns for synchronous and asynchronous communication
- ✅ Standard color scheme
- ✅ Reusable legend template
- ✅ Step-by-step instructions for creating and updating diagrams
- ✅ Common scenarios with generic examples
- ✅ Best practices for maintainable visualizations
- ✅ Reference to architecture-specific templates (ENTERPRISE, 3-Tier, Microservices)

**How to Use This Guide**:
1. Read through the guide to understand Mermaid diagram patterns
2. Choose the appropriate Section 4 template for your architecture type
3. Copy and customize the diagram for your specific system
4. Follow the step-by-step instructions for updates
5. Refer to common scenarios for typical modification tasks

**Benefits**:
- Works for any system type (e-commerce, CRM, IoT, financial services, etc.)
- Supports all architecture patterns (ENTERPRISE, 3-Tier, Microservices, N-Layer)
- Technology-agnostic (Kafka, RabbitMQ, REST, gRPC, etc.)
- Professional, maintainable, version-control-friendly diagrams

**Questions or Feedback**:
Contact the architecture documentation team or submit issues to the solutions-architect-skills repository.

---

**Version History**:
- **v2.0 (2025-12-03)**: Genericized version with architecture-agnostic examples applicable to any system type
- **v1.0 (2025-12-03)**: Initial release with complete Mermaid diagram template and guidelines
