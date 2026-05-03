# BIAN to C4 Translation Guide

## Key Insight

The BIAN 5-Layer architecture maps to C4 similarly to the META architecture, but with **mandatory BIAN compliance labeling** at every level. Each BIAN Service Domain becomes a C2 Container (it runs as its own microservice or module), and zooming into a Service Domain at C3 reveals the BIAN-specific internals: Control Record manager, Behavior Qualifier handlers, and the 7 standard Service Operations.

The critical mapping:

```
BIAN Layer 1 (Channels)            → C1: Separate Systems (each channel)
BIAN Layers 2-4 (Scenarios +       → C1: ONE System ("Banking Platform")
  Capabilities + Service Domains)
BIAN Layer 5 (Core Systems)        → C1: External Systems

BIAN Service Domain (Layer 4)      → C2: ONE Container per SD
BIAN Scenario Orchestrator (L2)    → C2: Container (orchestrator)
BIAN Business Capability (L3)      → C2: Container (capability service)
SD Database                        → C2: Container (Store)
Message Broker                     → C2: Container

BIAN Control Record Manager        → C3: Component inside SD Container
BIAN Behavior Qualifier Handler    → C3: Component inside SD Container
BIAN Service Operation Endpoint    → C3: Component inside SD Container
```

---

## BIAN Layers to C4 Mapping

### C1 — Context Diagram

At C1, the entire BIAN platform is shown as systems and persons. Individual Service Domains are NOT visible.

#### What to Show

| BIAN Element | C1 Representation | Notes |
|-------------|-------------------|-------|
| Retail Customer | Person | Uses channels |
| Bank Employee | Person | Uses internal channels |
| Third-party Fintech | Person | Uses Open Banking APIs |
| BancaWeb / Mobile App | System (if independently deployed) | Or group as "Digital Channels" System |
| Layers 2-4 combined | ONE System: "Banking Platform" | All BIAN logic inside one system box |
| Core Banking (Layer 5) | External System | Legacy mainframe, card processor |
| Payment Network (SWIFT, ACH) | External System | External to the bank |
| Regulatory Systems | External System | Regulator portals, reporting |

#### Example C1

```
+----------------+    +------------------+    +------------------+
|   Retail       |    |   Bank           |    |   Fintech        |
|   Customer     |    |   Employee       |    |   Partner        |
|   [Person]     |    |   [Person]       |    |   [Person]       |
+-------+--------+    +--------+---------+    +--------+---------+
        |                      |                       |
        | HTTPS                | HTTPS                 | REST/OAuth2
        v                      v                       v
+-------+--------+    +--------+---------+    +--------+---------+
| Digital        |    | Internal         |    | Open Banking     |
| Channels       |    | Channels         |    | API Gateway      |
| [System]       |    | [System]         |    | [System]         |
+-------+--------+    +--------+---------+    +--------+---------+
        |                      |                       |
        +----------+-----------+-----------+-----------+
                   |
                   v
        +----------+-----------+
        |   Banking Platform   |
        |   [System]           |
        |   BIAN V12.0         |
        +----------+-----------+
                   |
        +----------+-----------+-----------+
        |                      |           |
        v                      v           v
+-------+--------+  +---------+---+  +----+----------+
| Core Banking   |  | Payment     |  | Regulatory    |
| System         |  | Network     |  | Systems       |
| [External]     |  | [External]  |  | [External]    |
+----------------+  +-------------+  +---------------+
```

---

### C2 — Container Diagram

At C2, zoom into the "Banking Platform" System to show its deployable units using pure C4 conventions. Each BIAN Service Domain is a **separate Container** because in a BIAN-compliant architecture, SDs run as independent services (microservice-per-SD pattern). BIAN layer grouping does NOT appear in the C4 L2 diagram — layer grouping belongs in Diagrams 1 (Logical View) and 4 (Detailed View). Containers are grouped by C4 element type: `Container()` for apps, `ContainerDb()` for stores. **Transit infrastructure** (API gateway, message brokers, topics, queues, service mesh, iPaaS) → **edge label**, not a node. See DIAGRAM-GENERATION-GUIDE → Infrastructure-as-via Rule (L2).

#### What to Show

| BIAN Element | C2 Representation | Label Format |
|-------------|-------------------|-------------|
| Scenario Orchestrator (L2) | Container (App) | `Customer Onboarding Orchestrator [Camunda, BIAN V12.0]` |
| Business Capability (L3) | Container (App) | `Payment Processor [Spring Boot, BIAN V12.0]` |
| Service Domain (L4) | Container (App) | `Savings Account SD [Spring Boot, BIAN V12.0]` |
| SD Database | Container (Store) | `Savings Account DB [PostgreSQL 15]` |
| Event Bus | **Edge label only** | `Kafka topic: domain-events (async)` on producer→consumer `Rel()`. Do NOT emit `Domain Event Bus [Apache Kafka]` as a node. See Infrastructure-as-via Rule (L2). |
| API Gateway | **Edge label only** | `HTTPS via Kong` on actor/system→service `Rel()`. Exception: gateway with custom architectural logic. |
| Cache | Container (Store) | `Reference Data Cache [Redis 7]` |

#### BIAN-Specific Labeling Convention

Every container that implements a BIAN concept MUST include the BIAN tag in its label:

```
Format:  {BIAN Name} [{Technology}, BIAN V12.0]

Examples:
  Savings Account SD [Spring Boot, BIAN V12.0]
  Payment Initiation SD [Quarkus, BIAN V12.0]
  Customer Onboarding Scenario [Camunda, BIAN V12.0]
  Deposit Account Manager [Spring Boot, BIAN V12.0]
```

Non-BIAN containers (databases, caches) use standard labels:
```
  Savings Account DB [PostgreSQL 15]
  Reference Data Cache [Redis 7]
```

Transit infrastructure (brokers, gateways) does NOT appear as a node at L2 — it lives on the edge label:
```
  Rel(payment_sd, settlement_sd, "Settlement events (async)", "Kafka topic: settlement-events")
  Rel(channel, savings_sd, "Account inquiry", "HTTPS via Kong")
```

#### Example C2 — Payments Domain

```
+------------------+          +---------------------------+
|  Digital         |  REST    |  BIAN API Gateway         |
|  Channels        |--------->|  [Kong, BIAN V12.0]       |
|  [System]        |          |  Container (App)          |
+------------------+          +-------------+-------------+
                                            |
                              +-------------+-------------+
                              |                           |
                              v                           v
              +---------------+-------+   +---------------+-------+
              | Fund Transfer         |   | Balance Inquiry       |
              | Scenario              |   | Scenario              |
              | [Camunda, BIAN V12.0] |   | [Camunda, BIAN V12.0] |
              | Container (App)       |   | Container (App)       |
              +---+--------+----------+   +----------+------------+
                  |        |                         |
                  v        v                         v
+----------+----------+ +----------+----------+ +---+----------------+
| Payment Initiation  | | Payment Execution   | | Savings Account    |
| SD                   | | SD                  | | SD                 |
| [Spring Boot,        | | [Spring Boot,       | | [Spring Boot,      |
|  BIAN V12.0]         | |  BIAN V12.0]        | |  BIAN V12.0]       |
| Container (App)      | | Container (App)     | | Container (App)    |
+----------+-----------+ +----------+----------+ +----------+---------+
           |                        |                       |
           v                        v                       v
+----------+-----------+ +----------+----------+ +----------+---------+
| Payment Initiation   | | Payment Execution   | | Savings Account    |
| DB                   | | DB                  | | DB                 |
| [PostgreSQL 15]      | | [PostgreSQL 15]     | | [PostgreSQL 15]    |
| Container (Store)    | | Container (Store)   | | Container (Store)  |
+----------------------+ +---------------------+ +--------------------+
           |                        |                       |
           +----------+-------------+-----------+-----------+
                      |                         |
                      v                         v
           +----------+-----------+  +----------+---------+
           | Domain Event Bus     |  | Core Banking       |
           | [Apache Kafka]       |  | System             |
           | Container            |  | [External]         |
           +----------------------+  +--------------------+
```

#### Arrow Labels Reference BIAN Operations

Arrows between containers must reference BIAN operations where applicable:

```
Arrow label format:  {BIAN Operation} [{Protocol}]

Examples:
  Fund Transfer Scenario --"Initiate [REST POST]"--> Payment Initiation SD
  Fund Transfer Scenario --"Execute [REST PUT]"--> Payment Execution SD
  Fund Transfer Scenario --"Retrieve [REST GET]"--> Savings Account SD
  Payment Execution SD --"SQL/JDBC"--> Payment Execution DB
  Savings Account SD --"SavingsAccountFacility.Initiated [Kafka]"--> Domain Event Bus
```

---

### C3 — Component Diagram

At C3, zoom into ONE BIAN Service Domain Container to show its internal structure. This is where BIAN-specific components become visible.

#### Standard C3 Components for Any BIAN SD

Every BIAN Service Domain Container should show these component types at C3:

| Component | Stereotype | Purpose |
|-----------|-----------|---------|
| Control Record Manager | `[CR Manager]` | Manages the lifecycle of the primary Control Record |
| Behavior Qualifier Handler (per BQ) | `[BQ Handler]` | Manages a specific aspect of the Control Record |
| Service Operation Endpoints | `[BIAN API]` | REST endpoints for the 7 standard operations |
| Domain Event Publisher | `[Event Publisher]` | Publishes BIAN-compliant domain events to Kafka |
| Domain Event Consumer | `[Event Consumer]` | Consumes events from other SDs |
| Repository | `[Repository]` | Data access for the Control Record and BQs |
| Anti-Corruption Layer | `[ACL]` | Translates between BIAN format and Core system format |

#### Example C3 — Savings Account SD

```
Zoom into: Savings Account SD [Spring Boot, BIAN V12.0] Container
+------------------------------------------------------------------------+
|                  Savings Account SD (C2 Container)                      |
|                                                                        |
|  [BIAN Service Operation Endpoints]                                    |
|  +----------------------------+  +----------------------------+        |
|  | Initiate Endpoint          |  | Retrieve Endpoint          |        |
|  | POST /savings-account      |  | GET /savings-account/{id}  |        |
|  | [BIAN API]                 |  | [BIAN API]                 |        |
|  +-------------+--------------+  +----------------------------+        |
|  +----------------------------+  +----------------------------+        |
|  | Update Endpoint            |  | Control Endpoint           |        |
|  | PUT /savings-account/{id}  |  | PUT /.../control           |        |
|  | [BIAN API]                 |  | [BIAN API]                 |        |
|  +----------------------------+  +----------------------------+        |
|  +----------------------------+  +----------------------------+        |
|  | Execute Endpoint           |  | Request Endpoint           |        |
|  | PUT /.../execution         |  | POST /.../requisition      |        |
|  | [BIAN API]                 |  | [BIAN API]                 |        |
|  +-------------+--------------+  +----------------------------+        |
|                | calls                                                 |
|  [Control Record Manager]                                              |
|  +----------------------------+                                        |
|  | SavingsAccountFacility     |                                        |
|  | Manager                    |                                        |
|  | [CR Manager]               |                                        |
|  +-------------+--------------+                                        |
|                | delegates to                                          |
|  [Behavior Qualifier Handlers]                                         |
|  +------------------+ +------------------+ +------------------+        |
|  | Interest Handler | | Fees Handler     | | Deposits &       |        |
|  | [BQ Handler]     | | [BQ Handler]     | | Withdrawals      |        |
|  |                  | |                  | | Handler           |        |
|  +------------------+ +------------------+ | [BQ Handler]     |        |
|  +------------------+ +------------------+ +------------------+        |
|  | Payments Handler | | Statements       |                             |
|  | [BQ Handler]     | | Handler          |                             |
|  |                  | | [BQ Handler]     |                             |
|  +------------------+ +------------------+                             |
|                                                                        |
|  [Infrastructure]                                                      |
|  +----------------------------+  +----------------------------+        |
|  | SavingsAccountRepository   |  | KafkaEventPublisher        |        |
|  | [Repository]               |  | [Event Publisher]          |        |
|  +-------------+--------------+  +-------------+--------------+        |
|  +----------------------------+                                        |
|  | CoreBankingAdapter         |                                        |
|  | [ACL]                      |                                        |
|  +-------------+--------------+                                        |
+------------------------------------------------------------------------+
         |                |                    |
         | SQL            | Kafka Protocol     | Legacy Adapter
         v                v                    v
+--------+------+ +-------+--------+ +--------+--------+
| Savings       | | Domain Event   | | Core Banking    |
| Account DB    | | Bus            | | System          |
| [PostgreSQL]  | | [Kafka]        | | [External]      |
+---------------+ +----------------+ +-----------------+
```

---

## BIAN-Specific Conventions

### Container Labels Must Include BIAN SD Name

```
CORRECT:   Savings Account SD [Spring Boot, BIAN V12.0]
WRONG:     Account Service [Spring Boot]
WRONG:     savings-account-service [Spring Boot]
```

The BIAN SD name is the official name from the BIAN Service Landscape, not an internal codename.

### Arrow Labels Reference BIAN Operations

```
CORRECT:   Initiate [REST POST]
CORRECT:   Retrieve [REST GET]
CORRECT:   Execute BQ:Interest [REST PUT]
WRONG:     Create Account [POST]
WRONG:     Get Balance [GET]
```

Use BIAN operation names (Initiate, Update, Retrieve, Control, Exchange, Execute, Request), not CRUD verbs.

### Behavior Qualifiers as C3 Components

Each BQ implemented by the SD should appear as a separate C3 Component within the SD Container:

```
+------------------+
| Interest         |
| [BQ Handler]     |
+------------------+

+------------------+
| Fees             |
| [BQ Handler]     |
+------------------+
```

### Event Names Follow BIAN Convention

```
CORRECT:   SavingsAccountFacility.Initiated
CORRECT:   PaymentExecutionTransaction.Completed
WRONG:     account.created
WRONG:     payment-completed
```

---

## Pattern Translations

### BIAN Orchestration Flow (Saga)

Business Scenarios in Layer 2 orchestrate multi-SD flows using saga patterns:

```
C2 Level:
  +-----------------------------+
  | Customer Onboarding         |
  | Scenario                    |
  | [Camunda, BIAN V12.0]      |
  +----+-----+-----+-----+-----+
       |     |     |     |
       v     v     v     v
  +----+--+ +--+--+ +--+---+ +--+---+
  | Party  | |Cust | |Reg.  | |Curr. |
  | Ref.   | |RM   | |Comp. | |Acct. |
  | Data   | |SD   | |SD    | |SD    |
  | Dir.SD | |     | |      | |      |
  +--------+ +-----+ +------+ +------+

  Arrow labels:
    Scenario --"1. Initiate [REST POST]"--> Party Ref. Data Dir. SD
    Scenario --"2. Initiate [REST POST]"--> Customer RM SD
    Scenario --"3. Execute [REST PUT]"--> Regulatory Compliance SD
    Scenario --"4. Initiate [REST POST]"--> Current Account SD
```

### SD-to-SD Communication

Service Domains communicate through events (preferred) or synchronous calls:

```
C2 Level (Event-driven):
  Payment Initiation SD --"PaymentInitiationTransaction.Initiated [Kafka]"--> Domain Event Bus
  Domain Event Bus --"Subscribe"--> Payment Execution SD
  Domain Event Bus --"Subscribe"--> Fraud Detection SD

C2 Level (Synchronous):
  Payment Initiation SD --"Retrieve [REST GET]"--> Savings Account SD
```

### Core Integration (Layer 4 to Layer 5)

```
C2 Level:
  Savings Account SD --"Legacy Adapter [MQ/JDBC]"--> Core Banking System [External]

C3 Level (inside Savings Account SD):
  SavingsAccountRepository --"SQL"--> Savings Account DB
  CoreBankingAdapter [ACL] --"MQ PUT"--> Core Banking System
```

### Event-Driven BIAN

```
C2 Level:
  Savings Account SD -.-> Domain Event Bus
  Current Account SD -.-> Domain Event Bus
  Domain Event Bus -.-> Notification SD
  Domain Event Bus -.-> Regulatory Compliance SD

  Arrow labels:
    Savings Account SD --"SavingsAccountFacility.Initiated [Kafka]"--> Event Bus
    Event Bus --"Subscribe [Consumer Group]"--> Notification SD
```

---

## Anti-Patterns

| Anti-Pattern | Why It Is Wrong | Correct Approach |
|-------------|----------------|-----------------|
| **Not labeling BIAN SDs** | Containers labeled "Account Service" lose BIAN traceability | Label as `Savings Account SD [Tech, BIAN V12.0]` |
| **Mixing BIAN and non-BIAN containers** without distinction | Unclear which containers are BIAN-compliant | Use `BIAN V12.0` tag on compliant containers; label others clearly as non-BIAN |
| **Missing Control Record in C3** | C3 of an SD without the CR Manager is incomplete | Always show the Control Record Manager as the central C3 Component |
| **CRUD verbs instead of BIAN operations** | "Create Account" is not a BIAN operation | Use "Initiate", "Update", "Retrieve", "Control", "Exchange", "Execute", "Request" |
| **Omitting Behavior Qualifiers in C3** | Loses the BQ structure that defines the SD's sub-domains | Show each implemented BQ as a separate C3 Component |
| **Scenarios calling Core directly** | Layer 2 must not bypass Layers 3 and 4 | Scenarios call Capabilities (L3) which call Service Domains (L4) which call Core (L5) |
| **Single Container for all SDs** | A monolith labeled "BIAN Backend" defeats the purpose of SD separation | Each SD is a separate C2 Container with its own database |
| **Non-BIAN event names** | `account.created` loses BIAN semantic traceability | Use `{ControlRecord}.{Operation}` format |

---

## Compliance Checklist — What Must Be Visible

### At C2

- [ ] Every BIAN Service Domain appears as a separate Container with `BIAN V12.0` tag
- [ ] Container labels use official BIAN SD names (not internal codenames)
- [ ] Arrow labels reference BIAN operations (Initiate, Retrieve, etc.)
- [ ] Scenario orchestrators are labeled with their BIAN Business Area
- [ ] Business Capability containers reference their BIAN Business Domain
- [ ] SD databases are separate Containers (database-per-SD pattern)
- [ ] Event bus is a separate Container with BIAN event naming on arrows
- [ ] Core Systems appear as External Systems

### At C3

- [ ] Control Record Manager component is present and central
- [ ] All implemented Behavior Qualifiers appear as separate components
- [ ] Service Operation endpoints (Initiate, Update, Retrieve, etc.) are visible
- [ ] Repository component handles Control Record persistence
- [ ] Event Publisher component publishes BIAN-named events
- [ ] Anti-Corruption Layer component interfaces with Core Systems
- [ ] Component labels use BIAN stereotypes: `[CR Manager]`, `[BQ Handler]`, `[BIAN API]`, `[ACL]`

---

## Quick Reference Card

### BIAN → C1

| BIAN Element | C1 Mapping |
|-------------|-----------|
| All channels (Layer 1) | Separate Systems or grouped as "Digital Channels" System |
| Layers 2-4 combined | ONE System: "Banking Platform [BIAN V12.0]" |
| Core Systems (Layer 5) | External Systems |
| Payment networks, regulators | External Systems |
| Customers, employees, fintechs | Persons |

### BIAN → C2

| BIAN Element | C2 Mapping | Label |
|-------------|-----------|-------|
| Service Domain (L4) | Container (App) | `{SD Name} SD [{Tech}, BIAN V12.0]` |
| SD Database | Container (Store) | `{SD Name} DB [{Technology}]` |
| Scenario Orchestrator (L2) | Container (App) | `{Scenario Name} [{Tech}, BIAN V12.0]` |
| Business Capability (L3) | Container (App) | `{Capability Name} [{Tech}, BIAN V12.0]` |
| API Gateway | Container (App) | `BIAN API Gateway [{Tech}, BIAN V12.0]` |
| Event Bus | Container | `Domain Event Bus [{Technology}]` |
| Cache | Container (Store) | `{Name} Cache [{Technology}]` |
| Core Banking | External System | `Core Banking System [{Technology}]` |

### BIAN → C3 (Inside an SD Container)

| BIAN Element | C3 Mapping | Label |
|-------------|-----------|-------|
| Control Record lifecycle logic | Component | `{CR Name} Manager [CR Manager]` |
| Behavior Qualifier handler | Component | `{BQ Name} Handler [BQ Handler]` |
| Service Operation endpoint | Component | `{Operation} Endpoint [BIAN API]` |
| Data access | Component | `{SD Name}Repository [Repository]` |
| Event publishing | Component | `KafkaEventPublisher [Event Publisher]` |
| Event consumption | Component | `{Event}Listener [Event Consumer]` |
| Core system adapter | Component | `CoreBankingAdapter [ACL]` |

### Label Conventions

```
Container labels:
  {BIAN SD Name} SD [{Technology}, BIAN V12.0]
  Savings Account SD [Spring Boot, BIAN V12.0]
  Payment Execution SD [Quarkus, BIAN V12.0]

Component labels:
  {Name} [{BIAN Stereotype}]
  SavingsAccountFacility Manager [CR Manager]
  Interest Handler [BQ Handler]
  Initiate Endpoint [BIAN API]
  SavingsAccountRepository [Repository]

Arrow labels (C2):
  {BIAN Operation} [{Protocol}]
  Initiate [REST POST]
  Retrieve [REST GET]
  Execute BQ:Interest [REST PUT]
  SavingsAccountFacility.Initiated [Kafka]

Arrow labels (C3):
  calls, delegates to, implements, publishes, SQL, Kafka Protocol
```

---

## References

- **C4 Model** — c4model.info
- **IcePanel C4 Guide** — See ICEPANEL-C4-MODEL.md in this references directory
- **BIAN Architecture Reference** — See BIAN-ARCHITECTURE.md in this references directory
- **BIAN Service Landscape V12.0** — [bian.org/servicelandscape-12-0-0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html)
- **BIAN API Portal** — [portal.bian.org](https://portal.bian.org)
- **Simon Brown** — *Software Architecture for Developers* (2023)
