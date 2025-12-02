# Architecture Type Selection Guide

This guide helps you choose the right architecture type for your ARCHITECTURE.md document. The architecture type determines the structure and content of **Section 4 (Architecture Layers)** and **Section 5 (Component Details)**.

---

## Quick Selection

**Answer this question**: What best describes your system's architectural pattern?

1. **Large enterprise system with complex integrations** → Choose **META Architecture**
2. **Standard web application with database** → Choose **3-Tier Architecture**
3. **Cloud-native system with independent services** → Choose **Microservices Architecture**
4. **Custom layered system with specific patterns** → Choose **N-Layer Architecture**

---

## Architecture Type Details

### 1. META Architecture (6-Layer Enterprise)

**Best for:**
- Large enterprise systems
- Financial services platforms
- Complex integration landscapes
- Systems with multiple channel types (web, mobile, API, batch)
- Regulated industries requiring clear separation of concerns

**Characteristics:**
- 6 distinct layers: Channels → UX → Business Scenarios → Integration → Domain → Core
- Clear separation between presentation, orchestration, integration, and business logic
- Strong emphasis on integration patterns and external system connectivity
- Designed for high complexity and regulatory compliance

**Layer Structure:**
```
Layer 1: Channels (External Access Points)
Layer 2: UX (User Experience)
Layer 3: Business Scenarios (Orchestration)
Layer 4: Integration (External Systems)
Layer 5: Domain (Business Logic)
Layer 6: Core (Shared Services)
```

**Use META when:**
- Your system has 5+ external integrations
- You need clear audit trails and regulatory compliance
- Multiple teams will work on different layers
- You're building an enterprise platform or core banking system

**Section 4 Structure:** Detailed layer definitions with flow diagrams
**Section 5 Structure:** Components mapped to layers with integration patterns

---

### 2. 3-Tier Architecture (Classic Web Application)

**Best for:**
- Web applications
- REST APIs
- Standard CRUD systems
- Line-of-business applications
- Systems with straightforward user interaction patterns

**Characteristics:**
- 3 classic tiers: Presentation → Application/Business Logic → Data
- Simple, well-understood pattern
- Clear separation of concerns without over-engineering
- Suitable for monolithic or modular monolith deployments

**Tier Structure:**
```
Tier 1: Presentation Layer (UI, Web Controllers, API Endpoints)
Tier 2: Application/Business Logic Layer (Services, Business Rules)
Tier 3: Data Layer (Database, Data Access, Persistence)
```

**Use 3-Tier when:**
- Building a web application or API
- Team is familiar with traditional layered architecture
- System complexity is low to moderate
- You want simplicity and proven patterns

**Section 4 Structure:** Tier descriptions with responsibility boundaries
**Section 5 Structure:** Components organized by tier with data flow

---

### 3. Microservices Architecture

**Best for:**
- Cloud-native distributed systems
- Independently deployable services
- Systems requiring high scalability
- Organizations with multiple autonomous teams
- Event-driven architectures

**Characteristics:**
- Multiple independent services with clear boundaries
- API Gateway for routing and orchestration
- Service mesh for inter-service communication
- Event-driven communication patterns
- Decentralized data management (database per service)

**Component Structure:**
```
API Gateway (Routing, Auth, Rate Limiting)
├── Service A (Bounded Context A)
│   └── Database A
├── Service B (Bounded Context B)
│   └── Database B
├── Service C (Bounded Context C)
│   └── Database C
└── Shared Infrastructure
    ├── Service Mesh
    ├── Event Bus
    └── Configuration Service
```

**Use Microservices when:**
- Building cloud-native applications
- Need to scale services independently
- Multiple teams working on different business capabilities
- Requirement for polyglot technology stacks
- High availability and fault isolation are critical

**Section 4 Structure:** Service mesh topology and communication patterns
**Section 5 Structure:** Service catalog with bounded contexts and APIs

---

### 4. N-Layer Architecture (Predefined Patterns)

**Best for:**
- Systems with custom layer requirements
- Clean Architecture implementations
- Hexagonal (Ports & Adapters) Architecture
- Onion Architecture
- Domain-Driven Design implementations

**Characteristics:**
- Flexible number of layers (typically 4-7)
- Support for modern architectural patterns
- Emphasis on dependency inversion and clean boundaries
- Adaptable to specific domain needs

**Predefined Patterns:**

#### Option A: 4-Layer (Classic DDD)
```
Layer 1: Presentation (UI, API Controllers)
Layer 2: Application (Use Cases, Application Services)
Layer 3: Domain (Business Logic, Entities, Aggregates)
Layer 4: Infrastructure (Database, External Services)
```

#### Option B: 5-Layer (Extended)
```
Layer 1: Presentation (UI, API)
Layer 2: Application (Use Cases)
Layer 3: Domain (Business Logic)
Layer 4: Infrastructure (Persistence, External APIs)
Layer 5: Cross-Cutting (Logging, Security, Caching)
```

#### Option C: Clean Architecture (Concentric Layers)
```
Core: Entities (Domain Models)
Layer 1: Use Cases (Application Business Rules)
Layer 2: Interface Adapters (Controllers, Presenters)
Layer 3: Frameworks & Drivers (UI, Database, External)
```

**Use N-Layer when:**
- Implementing Domain-Driven Design
- Following Clean Architecture principles
- Need testability and dependency inversion
- Want flexibility in layer definitions
- Building a system with complex domain logic

**Section 4 Structure:** Custom layer definitions with dependency rules
**Section 5 Structure:** Components organized by layer with domain boundaries

---

## Decision Tree

Use this decision tree to quickly identify the best architecture type:

```
START
│
├─ Does your system have 5+ external integrations AND regulatory compliance requirements?
│  └─ YES → **META Architecture**
│
├─ Is your system a distributed cloud-native application with independent services?
│  └─ YES → **Microservices Architecture**
│
├─ Are you implementing Domain-Driven Design or Clean Architecture?
│  └─ YES → **N-Layer Architecture**
│
└─ Is your system a standard web application or API?
   └─ YES → **3-Tier Architecture**
```

---

## Comparison Matrix

| Criteria | META | 3-Tier | Microservices | N-Layer |
|----------|------|--------|---------------|---------|
| **Complexity** | Very High | Low | High | Medium-High |
| **Team Size** | Large (10+) | Small-Medium (2-8) | Large (10+) | Medium (4-10) |
| **Deployment** | Monolith or Modular | Monolith | Distributed | Monolith or Modular |
| **Scalability** | Vertical | Vertical | Horizontal | Vertical |
| **Best For** | Enterprise platforms | Web apps, APIs | Cloud-native systems | DDD, Clean Arch |
| **Learning Curve** | Steep | Gentle | Steep | Moderate |

---

## How to Proceed

Once you've selected an architecture type:

1. **Inform the skill** which type you selected (e.g., "I'm using 3-Tier Architecture")
2. The skill will load the appropriate templates for Section 4 and Section 5
3. Your ARCHITECTURE.md will include type-specific guidance and structure
4. Validation rules will be applied according to your architecture type

---

## Changing Architecture Type Later

If you need to change the architecture type of an existing ARCHITECTURE.md:

1. **Re-invoke the skill** and specify the new architecture type
2. The skill will detect the change and update Sections 4 and 5
3. **Manual review required**: Ensure component mappings align with the new structure
4. **Update metadata comment**: The HTML comment tracking architecture type will be updated

---

## Questions?

If you're unsure which architecture type to choose:

- Review the "Best for" descriptions above
- Consider your team's expertise and familiarity
- Evaluate system complexity and integration requirements
- When in doubt, start with **3-Tier** (simplest) or **META** (most comprehensive)