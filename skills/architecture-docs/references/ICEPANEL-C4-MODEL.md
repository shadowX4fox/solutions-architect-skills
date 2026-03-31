# IcePanel C4 Model — Software Architecture Visualization

## What is it

The C4 model is a lightweight, hierarchical approach to software architecture visualization created by Simon Brown. It uses a fixed set of abstractions and four diagram levels to communicate architecture to different audiences — from business stakeholders to developers. IcePanel is a visual C4 modelling, diagramming, and documentation tool that maintains the C4 hierarchical structure with interactive, explorable diagrams.

The C4 model consists of exactly two things:
1. A hierarchical set of **abstractions** (Person, System, Container, Component)
2. Four **diagram types** (Context, Container, Component, Code)

## The Abstractions

### Person
The end user who uses the systems. Examples: Customer, admin user, bank employee, API consumer.

### System
The highest level of abstraction that delivers value to end users. Systems are often owned by a development team. A system is a logical group of applications and data stores. Examples: "Online Banking System", "Payment Processing System", "SendGrid" (external).

Key question for defining system boundaries: **"Is this owned by a single development team?"** If yes, it's likely one system. Systems can be internal (you build and own it) or external (third-party).

### Container (not Docker)
Applications and data stores that make up a system. These are independently deployable and runnable units. Examples: API service, frontend SPA, mobile app, database, message queue, file system.

IcePanel renames these to **Apps** and **Stores** to avoid Docker container confusion.

### Component
Building blocks and modules that make up each container. These are code-level boundaries deployed together. Examples: Authentication module, payment card validator, REST controller, service class.

## The Four Diagram Levels

### Level 1 — Context Diagram (C1)

**What is it**: The highest-level diagram. Shows how users interact with your system and how your system relates to other systems.

**Scope**: Persons and Systems only. No internal details.

**Audience**: Everyone — technical and non-technical. Business, product, architects, developers.

**Useful for**: Getting alignment on how users use your system. Starting point for any architecture discussion.

**Rules**:
- Show only systems as single boxes (no internal structure)
- Include all relevant persons (user types)
- Show internal and external systems
- Label all relationships with verbs describing the interaction
- Keep it simple — if it doesn't fit on one page, you have too many systems

### Level 2 — Container Diagram (C2)

**What is it**: A zoomed-in view of ONE system showing the deployable/runnable units inside.

**Scope**: Persons, other systems, and containers (apps and stores) within the selected system.

**Audience**: Mostly technical people — architects, developers, technically fluent product people.

**Useful for**: Understanding and agreeing on higher-level technical choices. "What apps make up our system?"

**Rules**:
- Each container is a separately deployable unit
- Show technology choices in brackets: [Spring Boot], [React SPA], [PostgreSQL]
- Show communication protocols on arrows: HTTPS, gRPC, AMQP, TCP
- External systems remain as single boxes (don't decompose what you don't own)

### Level 3 — Component Diagram (C3)

**What is it**: A zoomed-in view of ONE container showing the building blocks inside.

**Scope**: Components inside the container, plus related containers and systems.

**Audience**: Technical people only — architects and developers.

**Useful for**: Understanding and agreeing on modules and code structure.

**Rules**:
- Components are code-level boundaries (modules, packages, namespaces)
- Typically maps to major classes, interfaces, or module groupings
- Most useful for monolithic containers with internal complexity

### Level 4 — Code Diagram (C4)

**What is it**: UML class diagrams or similar code-level detail.

**Audience**: Developers only. Rarely diagrammed manually.

**IcePanel approach**: "Link model objects to the code itself (reality)" rather than maintaining these diagrams manually. Most IDEs can generate this level on demand.

## How It Works

The C4 model works through **progressive zoom**:
1. Start at C1 — see the forest (systems and users)
2. Zoom into a system — C2 — see the trees (apps, stores, services)
3. Zoom into a container — C3 — see the branches (modules, components)
4. Zoom into a component — C4 — see the leaves (classes, code)

Most teams get the highest value from **C1 + C2 combined**. These two levels give a single, simple view of how systems work that satisfies both business and technical audiences.

## How It Is Implemented (with IcePanel)

### Model-first approach
IcePanel uses modelling instead of just diagramming. Changes to a model object (renaming a system, updating a description) automatically sync across ALL diagrams that reference it. This eliminates the "stale diagram" problem.

### Domains (Level 0)
IcePanel extends C4 with **Domains** — high-level business verticals that organize systems. Examples for a bank: Retail Banking, Cards, Payments, Risk & Compliance.

### Interactive exploration
IcePanel diagrams are explorable — click on a system to zoom into its containers, click on a container to see its components. This replaces the need for multiple static diagrams.

### Flows
Beyond static structure, IcePanel supports **Flows** — step-by-step sequences overlaid on diagrams showing how data/requests move through the architecture.

### Key IcePanel features
- **Model objects**: Actor, Group, System, App, Store, Component — each with name, description, tags, links
- **Connections**: Labeled relationships between objects with protocol annotations
- **Diagrams**: Multiple views of the same model, auto-synced
- **Flows**: Numbered step-by-step paths through the architecture
- **Tags and metadata**: Technology, ownership, status annotations

## Practical Guidelines

### Naming
- Use names anyone can understand (not internal codenames)
- Label all connections so relationships are clear
- Include technology in brackets for containers: `[Node.js API]`, `[PostgreSQL]`

### Defining system boundaries
Two methods:
- **Bottom-up**: Start from existing applications and group them into systems
- **Top-down**: Start from business capabilities and define systems around them

### Common mistakes
- Mixing abstraction levels in one diagram (systems and components together)
- Not labeling relationships
- Including too much detail at C1 (decomposing systems that should be boxes)
- Drawing Docker containers instead of C4 containers (they're different concepts)
- Creating ring/circular layouts for sequential flows (use linear flows instead)

## References

- C4 Model official: c4model.info
- IcePanel C4 guide: icepanel.io/c4-model
- IcePanel blog — What is C4: icepanel.io/blog/2024-07-18-what-is-the-c4-model
- IcePanel blog — Visualizing with C4: icepanel.io/blog/2023-02-23-visualizing-software-architecture-with-the-c4-model
- IcePanel blog — Structuring C4: icepanel.io/blog/2023-01-10-structuring-icepanel-c4-model
- IcePanel docs — Modelling: docs.icepanel.io/core-features/modelling
- IcePanel docs — Getting started: docs.icepanel.io/getting-started
