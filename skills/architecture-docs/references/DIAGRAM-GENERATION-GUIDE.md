# Architecture Diagram Generation Guide

> Reference for generating the 4 standard architecture diagrams in `docs/03-architecture-layers.md`.
> Each diagram serves a different audience and zoom level. Generate all 4 when creating or updating architecture documentation.
> Diagrams adapt their grouping, naming, and color conventions to the detected architecture type.

---

## Overview

| # | Diagram | Format | Audience | Shows |
|---|---------|--------|----------|-------|
| 1 | Logical View | ASCII art | Executives, architects | Layers/tiers/groups as horizontal bands with components inside, arrows between groups only |
| 2 | C4 Level 1 — System Context | Mermaid `graph TB` | Non-technical stakeholders | The system as a single box, external actors, external systems |
| 3 | C4 Level 2 — Container | Mermaid `graph TB` | Development teams | All containers inside the system boundary, grouped by layer/tier, with protocols |
| 4 | Detailed View | Mermaid `graph TB` | Architects, SREs | Full component wiring with topic names, queue names, all async/sync flows |

**Ordering in the file**: Always place diagrams in this order (1→2→3→4) under a `## Architecture Diagrams` heading.

**Architecture type detection**: Read the `<!-- ARCHITECTURE_TYPE: ... -->` comment in `docs/03-architecture-layers.md` to determine the active type. All 4 diagrams adapt to this type.

---

## Architecture Type Adaptation

All 4 diagrams use the same grouping logic, determined by the detected architecture type:

| Architecture Type | Grouping Strategy | Group Naming Pattern | Layer/Group Source |
|-------------------|-------------------|---------------------|--------------------|
| META | 6 layers: Channels → UX → Business Scenarios → Business → Domain → Core | `LAYER N — NAME` | `docs/03-architecture-layers.md` layer summary table |
| BIAN | 5 layers matching BIAN V12.0 service landscape | `LAYER N — NAME` | `docs/03-architecture-layers.md` layer summary table |
| 3-TIER | 3 tiers: Presentation → Logic → Data | `TIER N — NAME` | `docs/03-architecture-layers.md` tier definitions |
| N-LAYER | Layers from architecture doc (varies: Domain, Application, Infrastructure, etc.) | `LAYER — NAME` | `docs/03-architecture-layers.md` layer definitions |
| MICROSERVICES | Functional groups: API Gateway, Services, Data Stores, Message Brokers | `GROUP — NAME` | `docs/03-architecture-layers.md` component groupings |

---

## Diagram 1 — Logical View (ASCII)

**Purpose**: High-level logical view showing the architecture structure. Each layer/tier/group is a visual band containing its components. Arrows flow between groups only — no internal wiring.

**Format**: ASCII art inside a fenced code block (no language tag). Never use Mermaid for this diagram — ASCII guarantees rendering on all platforms and Mermaid versions.

**When to use**: All architecture types. For MICROSERVICES without layers, use functional groups (Gateway, Services, Stores, Brokers) as the horizontal bands.

### Structure Rules

1. **Outer box per group**: Full-width rectangle using `┌─┐│└─┘` box-drawing characters
2. **Group title**: Centered, uppercase, format per type (see Architecture Type Adaptation table)
3. **Component boxes inside**: Smaller rectangles nested inside the group box
4. **Inter-group arrows**: Centered between group boxes, using `│` and `▼` with protocol label
5. **Conceptual links**: Use `· · ·` (dotted) for non-runtime relationships (e.g., "implements")
6. **Legend**: Always include at the bottom

### Layout Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              GROUP TITLE (per type naming)                               │
│                                                                                         │
│   [optional sub-group label]:                                                           │
│   ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────────┐    │
│   │  Component Name       │ │  Component Name       │ │  Component Name           │    │
│   │  [C4 Type]            │ │  [C4 Type]            │ │  [C4 Type]                │    │
│   │  Responsibility 1     │ │  Responsibility 1     │ │  Responsibility 1         │    │
│   │  Responsibility 2     │ │  Responsibility 2     │ │  Responsibility 2         │    │
│   └───────────────────────┘ └───────────────────────┘ └───────────────────────────┘    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼  Protocol label
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT GROUP TITLE                                           │
│  ...                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Box Content

Each component box contains exactly these lines:
1. **Line 1**: Component name (display name or technical name)
2. **Line 2**: `[C4 Type]` or `[C4 Type · Technology]` — from the component's `**Type:**` field
3. **Lines 3+**: 1–3 key responsibilities (short phrases, not sentences)

### Inter-Group Arrow Format

```
                                          │
                                          ▼  PROTOCOL (network context)
```

- `▼` for synchronous calls (solid arrow down)
- `· · ·` for conceptual/non-runtime links (e.g., domain model alignment)
- Protocol label on the same line as `▼`, after two spaces
- Examples: `HTTPS + OAuth2`, `HTTP (AKS internal)`, `REST (private network)`, `gRPC/mTLS`

### Sizing Rules

- **Outer box width**: 89 characters (fits 90-column terminals)
- **Inner component boxes**: Size to fit content, arranged horizontally within the group
- **Spacing**: 1 space between adjacent component boxes
- **Groups with many components**: Split into labeled sub-groups (e.g., "Applications:" and "Support Stores:")

### Legend (always include)

```
Legend:
  ▼  = Synchronous call (request flows top → down)
  · · · = Conceptual alignment (not a runtime call)
  [Type] = C4 L2 container type
  All [technology] services: [Framework] on [Platform] (min N replicas)
  Response path: implicit — bottom → up via [mechanism]
```

### Data Sources

| Element | Source File | Field |
|---------|-----------|-------|
| Group names (layers/tiers) | `docs/03-architecture-layers.md` | Layer/tier summary table |
| Components per group | `docs/03-architecture-layers.md` | Each group section → `**Components:**` |
| Component types | `docs/components/**/*.md` | `**Type:**` field |
| Component responsibilities | `docs/components/**/*.md` | `## Responsibilities` section (pick top 2–3) |
| Protocols between groups | `docs/03-architecture-layers.md` | `**Communication Patterns:**` per group |
| C4 types | `docs/components/README.md` | Type column |

---

## Diagram 2 — C4 Level 1 System Context (Mermaid)

**Purpose**: Highest zoom level. Shows the system as a single box, who uses it, and what external systems it depends on.

**Format**: Mermaid `graph TB` — compatible with Mermaid 8.8.0+.

### Structure Rules

1. **3–7 boxes max**: 1 internal system, 1–3 external actors, 1–3 external systems
2. **No internal details**: The system is a single opaque box — no containers, no layers
3. **Actor labels**: Include role and what they do (e.g., "Cash withdrawals and deposits for clients")
4. **Arrow labels**: Protocol + what flows (e.g., "HTTPS + OAuth2 / pacs.008 / pacs.003")
5. **Phase 2 systems**: Use dashed arrows (`-.->`) with "Phase 2" label

### Template

```mermaid
graph TB
    %% Actors
    ACTOR["Actor Name\n(Role)\nWhat they do"]

    %% Internal System
    SYSTEM["System Name\n[Internal System]\nOne-line description\nKey technologies"]

    %% External Systems
    EXT1["External System\n[External System]\nWhat it does\nTechnology"]

    %% Relationships
    ACTOR -->|"Protocol\nWhat flows"| SYSTEM
    SYSTEM -->|"Protocol\n(network context)"| EXT1

    %% Styling — C4 color conventions
    classDef person fill:#08427B,stroke:#052E56,stroke-width:2px,color:#fff
    classDef system fill:#1168BD,stroke:#0B4884,stroke-width:2px,color:#fff
    classDef external fill:#999999,stroke:#6B6B6B,stroke-width:2px,color:#fff

    class ACTOR person
    class SYSTEM system
    class EXT1 external
```

### Color Conventions (C4 standard — all architecture types)

| Element | Fill | Meaning |
|---------|------|---------|
| Person/Actor | `#08427B` (dark blue) | External user or system that initiates interaction |
| Internal System | `#1168BD` (blue) | The system being documented |
| External System | `#999999` (gray) | Systems outside your control |

### Architecture Type → C4 L1 Translation

| Architecture Type | What collapses into Internal System box | What becomes External Actor/System |
|-------------------|----------------------------------------|-----------------------------------|
| META | Layers 2–5 (UX through Domain) | Layer 1 actors → Person boxes; Layer 6 core/legacy → External System boxes |
| BIAN | All BIAN service domains | External channels → Person boxes; Core banking/legacy → External System boxes |
| 3-TIER | All 3 tiers (Presentation + Logic + Data) | External users → Person boxes; External integrations → External System boxes |
| N-LAYER | All internal layers (UI through Infrastructure) | External users → Person boxes; External systems → External System boxes |
| MICROSERVICES | All services + stores + brokers | External users/clients → Person boxes; External APIs/systems → External System boxes |

### Data Sources

| Element | Source File |
|---------|-----------|
| System name + description | `ARCHITECTURE.md` top-level description |
| External actors | `docs/01-system-overview.md` → `**External Actor:**` or user/actor references |
| External systems | `docs/01-system-overview.md` → `**Internal Dependencies:**` (items marked external) |
| Protocols | `docs/05-integration-points.md` → external integrations section |

---

## Diagram 3 — C4 Level 2 Container (Mermaid)

**Purpose**: Zooms into the system boundary. Shows all deployable containers, grouped by architectural layer/tier/group, with protocols on every arrow.

**Format**: Mermaid `graph TB` — compatible with Mermaid 8.8.0+.

### Structure Rules

1. **System boundary subgraph**: Wraps all internal containers
2. **Group subgraphs inside**: Group containers by layer/tier/functional group (per Architecture Type Adaptation table)
3. **External actor outside**: Above the system boundary
4. **External systems outside**: Below the system boundary
5. **Every arrow has a protocol label**: `HTTPS`, `HTTP`, `AMQP`, `Kafka`, `JDBC`, `Redis protocol`
6. **Solid arrows** (`-->`) for synchronous calls
7. **Dashed arrows** (`-.->`) for asynchronous messaging
8. **Container labels**: `component-name\n[C4 Type: Technology]\nKey responsibility`

### Template

```mermaid
graph TB
    %% External Actor
    ACTOR["Actor Name\n(Role)"]

    %% System Boundary
    subgraph SYS["System Name (System Boundary)"]

        subgraph GROUP_A["Group Name"]
            C1["component-name\n[Type: Technology]\nResponsibility"]
        end

        subgraph GROUP_B["Group Name"]
            C2["component-name\n[Type: Technology]\nResponsibility"]
            C3["component-name\n[Type: Technology]\nResponsibility"]
        end

        subgraph STORES["Data Stores"]
            S1["store-name\n[Type: Technology]\nPurpose"]
        end

    end

    %% External System
    EXT["External System\n[External System: Technology]"]

    %% Sync flows
    ACTOR -->|"Protocol"| C1
    C2 -->|"Protocol"| EXT

    %% Async flows
    C1 -.->|"Protocol: topic/queue"| S1
    S1 -.->|"Protocol: consume"| C2

    %% Styling
    classDef person fill:#08427B,stroke:#052E56,stroke-width:2px,color:#fff
    classDef gateway fill:#9B9B9B,stroke:#6B6B6B,stroke-width:2px,color:#fff
    classDef app fill:#438DD5,stroke:#2E6295,stroke-width:2px,color:#fff
    classDef store fill:#417505,stroke:#2D5204,stroke-width:2px,color:#fff
    classDef external fill:#999999,stroke:#6B6B6B,stroke-width:2px,color:#fff
    classDef boundary fill:transparent,stroke:#444,stroke-width:2px,stroke-dasharray: 5 5

    class ACTOR person
    class C1 gateway
    class C2,C3 app
    class S1 store
    class EXT external
    class GROUP_A,GROUP_B,STORES boundary
```

### Color Conventions (C4 standard — all architecture types)

| Element | Fill | classDef name |
|---------|------|--------------|
| External actor | `#08427B` dark blue | `person` |
| Gateway containers | `#9B9B9B` gray | `gateway` |
| Application containers | `#438DD5` medium blue | `app` |
| Store containers | `#417505` dark green | `store` |
| External systems | `#999999` gray | `external` |
| Group subgraphs | transparent, dashed | `boundary` |

### Data Sources

| Element | Source File |
|---------|-----------|
| All containers | `docs/components/README.md` → 5-column table |
| Container details | `docs/components/**/*.md` → Type, Technology, Purpose, APIs |
| Protocols | `docs/05-integration-points.md` → all integration entries |
| Async topics/queues | `docs/05-integration-points.md` → internal integrations section |
| Group structure | `docs/03-architecture-layers.md` → layer/tier summary table |

---

## Diagram 4 — Detailed View (Mermaid)

**Purpose**: Full wiring diagram showing every component, topic name, queue name, and flow. The most detailed diagram — used by architects and SREs for operational understanding.

**Format**: Mermaid `graph TB` — compatible with Mermaid 8.x+.

### Structure Rules

1. **One subgraph per architectural group**: Named per Architecture Type Adaptation table (layer, tier, or functional group)
2. **Every component inside its group subgraph**: Using full technical names
3. **Message broker topics as separate nodes**: Show actual topic/queue names
4. **Solid arrows** for sync, **dashed arrows** for async
5. **Arrow labels**: Include protocol AND purpose (e.g., `"Publish validated\nISO 20022 XML"`)
6. **Domain alignment** (if applicable): Dotted lines from domain model to implementing containers
7. **Standalone data stores**: If a data store serves multiple groups, place it outside subgraphs

### Template

```mermaid
graph TB
    subgraph Group1["Group 1: Name"]
        ACTOR["Actor\n(Role)"]
    end

    subgraph Group2["Group 2: Name"]
        GATEWAY["gateway-component-name\n(Technology)\nResponsibility"]
    end

    subgraph Group3["Group 3: Name"]
        SVC1["service-name\n[Role]\n(Technology)\nResponsibilities"]
        TOPIC_REQ["topic_name_req\n(broker-type)"]
        TOPIC_RESP["topic_name_resp\n(broker-type)"]
        CACHE["cache-name\n(Purpose)"]
        SVC2["service-name\n[Role]\n(Technology)\nResponsibilities"]
    end

    subgraph Group4["Group 4: Name"]
        EXEC["executor-name\n(Technology)\nRouting description"]
    end

    subgraph GroupN["Group N: Name"]
        CORE["core-system\n(Type)"]
    end

    DATA_STORE["data-store\n(Purpose)"]

    %% Full wiring with protocols and purpose on every arrow
    ACTOR -->|"Protocol + Auth\nEndpoint"| GATEWAY
    GATEWAY -->|"Protocol\nPurpose"| SVC1
    SVC1 <-->|"Purpose"| CACHE
    SVC1 -.->|"Purpose"| TOPIC_REQ
    TOPIC_REQ -.->|"Consume"| SVC2
    SVC2 -->|"Protocol"| EXEC
    EXEC -->|"Protocol"| CORE
    SVC2 -.->|"Purpose"| TOPIC_RESP
    TOPIC_RESP -.->|"Purpose"| SVC1
    SVC1 -->|"Response"| GATEWAY
    GATEWAY -->|"Response"| ACTOR

    %% Styling — adapt classDef names and colors to architecture type
    %% See "Color Conventions by Architecture Type" below
```

### Color Conventions by Architecture Type

#### META / BIAN

| Group Role | Fill | classDef name |
|-----------|------|--------------|
| Channel (L1) | `#4A90E2` blue | `channel` |
| User Experience (L2) | `#9B9B9B` gray | `ux` |
| Business Scenarios (L3) | `#F5A623` orange | `scenario` |
| Business (L4) | `#7ED321` green | `business` |
| Domain (L5) | `#50E3C2` teal | `domain` |
| Core (L6) | `#D0021B` red | `core` |
| Messaging (brokers/topics) | `#BD10E0` purple | `messaging` |
| Data stores | `#417505` dark green | `datastore` |

#### 3-TIER

| Group Role | Fill | classDef name |
|-----------|------|--------------|
| Presentation (Tier 1) | `#4A90E2` blue | `presentation` |
| Logic (Tier 2) | `#F5A623` orange | `logic` |
| Data (Tier 3) | `#417505` dark green | `data` |
| Messaging (brokers/topics) | `#BD10E0` purple | `messaging` |
| Data stores | `#417505` dark green | `datastore` |

#### N-LAYER

| Group Role | Fill | classDef name |
|-----------|------|--------------|
| UI / Presentation | `#4A90E2` blue | `ui` |
| Application / Service | `#F5A623` orange | `application` |
| Domain / Business | `#7ED321` green | `domain` |
| Infrastructure / Persistence | `#9B9B9B` gray | `infrastructure` |
| Messaging (brokers/topics) | `#BD10E0` purple | `messaging` |
| Data stores | `#417505` dark green | `datastore` |

#### MICROSERVICES

| Group Role | Fill | classDef name |
|-----------|------|--------------|
| API Gateway | `#9B9B9B` gray | `gateway` |
| Application Services | `#438DD5` medium blue | `service` |
| Workers / Consumers | `#F5A623` orange | `worker` |
| Messaging (brokers/topics) | `#BD10E0` purple | `messaging` |
| Data stores | `#417505` dark green | `datastore` |
| External systems | `#999999` gray | `external` |

### Data Sources

| Element | Source File |
|---------|-----------|
| All components + types | `docs/components/README.md` |
| Component responsibilities | `docs/components/**/*.md` → Responsibilities, Purpose |
| Topic/queue names | `docs/05-integration-points.md` → internal integrations section |
| Full flow wiring | `docs/04-data-flow-patterns.md` → all flow sections |
| Domain model (if applicable) | `docs/03-architecture-layers.md` → Domain layer/section |
| Protocols per integration | `docs/05-integration-points.md` |

---

## Data Flow Diagrams — Sequence Diagrams

**Purpose**: Per-flow sequence diagrams showing step-by-step interactions between components for each documented data flow. One diagram per H3 flow subsection in `docs/04-data-flow-patterns.md`.

**Format**: Classic Mermaid `sequenceDiagram` — compatible with Mermaid 8.x+.

```mermaid
sequenceDiagram
    participant A as Component A
    A->>B: request
```

**Placement**: Insert each diagram **immediately after its corresponding H3 subsection** in `docs/04-data-flow-patterns.md`, with heading `#### Diagram: [Flow Name] Sequence`.

### Syntax Reference

#### Message Types

| Type | Syntax | Use For |
|------|--------|---------|
| Sync request | `A->>B: description` | REST, gRPC, JDBC calls (solid arrow) |
| Sync response | `B-->>A: description` | Return values, acknowledgements (dashed arrow) |
| Async (fire-and-forget) | `A-->>B: description` | Kafka publish, queue push, event emit (dashed arrow) |
| Participant declaration | `participant Alias as Full Name` | Declare and alias participants |
| Activation | `activate A` / `deactivate A` | Show processing scope (or use `+`/`-` on arrows) |
| Note | `Note over A,B: text` | Protocol annotations, context notes |
| Note (single) | `Note right of A: text` | Side annotations for a single participant |

#### Control Flow

| Construct | Syntax | Use For |
|-----------|--------|---------|
| Conditional | `alt condition` ... `else condition` ... `end` | Branching logic (success/failure paths) |
| Optional | `opt condition` ... `end` | Optional execution path |
| Loop | `loop condition` ... `end` | Retry loops, polling, batch processing |
| Grouping | `rect rgb(...)` ... `end` | Visual grouping of related steps |

### Architecture Conventions

1. **Participant naming**: Use component technical names from `docs/components/README.md` with aliases for readability — e.g., `participant APIGW as API Gateway`, `participant PS as PaymentService`
2. **Sync calls with protocols**: Use `Note over` to annotate protocol context:
   ```
   Note over Client,APIGW: HTTPS + OAuth2
   Client->>+APIGW: POST /payments
   APIGW->>+AuthService: validateToken()
   AuthService-->>-APIGW: token valid
   ```
3. **Async events**: Use dashed-arrow syntax with topic/queue name:
   ```
   PS-->>Kafka: payment.completed.v1
   Kafka-->>NS: consume(payment.completed.v1)
   ```
4. **Error paths**: Use `alt` for success/failure branching:
   ```
   alt success
       PS-->>APIGW: 200 OK {payment_id}
   else failure
       PS-->>DLQ: payment.failed
       PS-->>APIGW: 500 Error
   end
   ```
5. **Parallel processing**: Use `Note over` to annotate concurrent fan-out:
   ```
   Note over NS,SMSService: Parallel execution
   NS->>EmailService: sendEmail()
   NS->>SMSService: sendSMS()
   ```
6. **Activation bars**: Use `+`/`-` on arrows to show processing scope:
   ```
   Client->>+APIGW: submitPayment()
   APIGW->>+PS: process()
   PS->>+Bank: transfer()
   Bank-->>-PS: status
   PS-->>-APIGW: result
   APIGW-->>-Client: response
   ```

### Template

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant BizSvc as BusinessService
    participant Store as DataStore
    participant MQ as MessageBroker
    participant DLQ

    Note over Client,APIGW: HTTPS + OAuth2
    Client->>+APIGW: [action description]

    Note over APIGW,BizSvc: gRPC/mTLS
    APIGW->>+BizSvc: process(request)

    Note over BizSvc,Store: JDBC/TLS
    BizSvc->>+Store: save(data)
    Store-->>-BizSvc: saved

    BizSvc-->>MQ: event.name.v1

    BizSvc-->>-APIGW: result

    alt success
        APIGW-->>-Client: 200 OK response
    else failure
        APIGW-->>DLQ: request.failed
        APIGW-->>Client: error response
    end
```

### Data Sources

| Element | Source File |
|---------|-----------|
| Flow steps | `docs/04-data-flow-patterns.md` → each `### [Flow Name] Flow` H3 subsection |
| Participant names | `docs/components/README.md` → Component column |
| Protocols | `docs/05-integration-points.md` → integration entries |
| Topic/queue names | `docs/05-integration-points.md` → internal integrations section |
| Error handling | `docs/04-data-flow-patterns.md` → `**Error Handling:**` per flow |
| Performance constraints | `docs/04-data-flow-patterns.md` → `**Performance:**` per flow |

---

## Mermaid Compatibility Rules

### Topology Diagrams (Diagrams 1–4)

Target: **Mermaid 8.8.0+** (VS Code, GitHub, GitLab).

Applies to: All 4 standard diagrams — Logical View (ASCII), C4 L1 System Context, C4 L2 Container, and Detailed View. Diagrams 2–4 use `graph TB`.

### DO

- Use `graph TB` (not `flowchart TB` — `flowchart` is unreliable in 8.x)
- Use `subgraph NAME["Label"]` for grouping
- Use `-->` for solid arrows, `-.->` for dashed arrows, `-.-` for dotted lines (no arrow)
- Use `|"label"| ` for edge labels (quoted)
- Use `\n` for line breaks inside node labels
- Use `classDef` + `class` for styling

### DO NOT

- Do not use `direction LR` inside subgraphs (requires Mermaid 10+)
- Do not use nested subgraphs more than 2 levels deep (fragile in 8.x)
- Do not use HTML tags (`<b>`, `<i>`, `<sup>`) in labels
- Do not use emoji characters in node labels (rendering varies)
- Do not use `|` pipe characters inside node label text (breaks parsing) — use `/` instead
- Do not connect subgraph IDs as link endpoints (`L1 --> L2` fails) — connect nodes only
- Do not use `flowchart` keyword — use `graph` for maximum compatibility
- Do not use native C4 diagram types (`C4Context`, `C4Container`) — they require Mermaid 9.3+

### Data Flow Diagrams (Sequence Diagrams)

Target: **Mermaid 8.8.0+** (VS Code, GitHub, GitLab).

**DO:**
- Use `sequenceDiagram` as the first line inside the Mermaid fence block
- Use `participant Alias as Full Name` for declaring participants
- Use `->>` for sync requests (solid arrow), `-->>` for responses and async messages (dashed arrow)
- Use `+`/`-` on arrows for activation bars (e.g., `->>+` to activate, `-->>-` to deactivate)
- Use `alt/else/end` for branching, `opt/end` for optional paths, `loop/end` for retries
- Use `Note over A,B: text` for protocol annotations

**DO NOT:**
- Do not use `-)` open-arrow syntax (requires Mermaid 9.1+) — use `-->>` instead
- Do not use `par/and/end` (requires Mermaid 9.1+) — use `Note over` to annotate parallel execution
- Do not use `critical/option/end` or `break/end` (requires Mermaid 9.1+)
- Do not use `flowchart` or `graph TB` syntax inside sequence diagrams
- Do not use HTML tags in participant names or messages
- Do not use emoji characters in labels (rendering varies)
- Do not nest `alt` blocks more than 2 levels deep (readability degrades)

---

## Generation Workflow

When generating or updating diagrams:

1. **Read** `docs/03-architecture-layers.md` for group structure (layers/tiers) and component placement
2. **Read** `docs/components/README.md` for the component index (names, types, technologies)
3. **Read** `docs/05-integration-points.md` for protocols and topic/queue names
4. **Read** `docs/04-data-flow-patterns.md` for flow wiring between components
5. **Detect** architecture type from `<!-- ARCHITECTURE_TYPE: ... -->` comment in `docs/03-architecture-layers.md`
6. **Select** grouping strategy, naming pattern, and color conventions from the Architecture Type Adaptation table and Diagram 4 color conventions
7. **Generate** all 4 topology diagrams in order (ASCII logical → C4 L1 → C4 L2 → Detailed)
8. **Place** all 4 topology diagrams under `## Architecture Diagrams` in `docs/03-architecture-layers.md`
9. **Include** a `**Reading the diagram:**` section after the ASCII logical view with bullet points explaining the arrow conventions
10. **Generate** sequence diagrams — one per H3 flow subsection in `docs/04-data-flow-patterns.md`
11. **Place** each sequence diagram immediately after its H3 subsection with heading `#### Diagram: [Flow Name] Sequence`

### Update vs. Create

- **Create**: Generate all 4 topology diagrams + all sequence diagrams from scratch using source files
- **Update**: When components change (add/remove/rename), update all 4 topology diagrams to match. Check that every component in `docs/components/README.md` appears in Diagrams 1, 3, and 4. Diagram 2 (C4 L1) only shows system-level boxes — individual components do not appear. Also update sequence diagrams if affected participants or flows changed.
