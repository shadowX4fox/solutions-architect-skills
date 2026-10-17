# Architecture Documentation Examples

This directory contains example ARCHITECTURE.md files demonstrating each supported architecture type.

## Available Examples

### 1. ARCHITECTURE_example_microservices.md (Recommended)
**Architecture Type**: Microservices (Cloud-Native Distributed)

Demonstrates:
- Infrastructure components (API Gateway, Service Mesh, Event Bus)
- Database-per-service pattern
- Event-driven communication
- Circuit breaker patterns
- Microservice catalog with comprehensive service details

**Best for**: Cloud-native systems, independently deployable services, event-driven architectures

**Why Recommended**: Industry-standard approach for modern, scalable, cloud-native applications

---

### 2. ARCHITECTURE_example_enterprise.md
**Architecture Type**: ENTERPRISE (5-Layer Enterprise)

Demonstrates:
- 5-layer ENTERPRISE model (Channels → Experience → Process → Domain Services → Systems of Record & Data)
- Cross-cutting capabilities (Integration, Identity & Security, Observability, Shared Platform Services)
- Dependency rule: a layer calls only the layer below or a cross-cutting capability
- Optional BIAN Service Domain tag on Domain Services components

**Best for**: Large enterprise platforms, complex integrations

---

### 3. ARCHITECTURE_example_3tier.md
**Architecture Type**: 3-Tier (Classic Web Application)

Demonstrates:
- 3-tier structure (Presentation → Application/Business Logic → Data)
- Tier separation enforcement
- Stateless application tier design
- Standard web application patterns

**Best for**: Web applications, REST APIs, standard CRUD systems

---

### 4. ARCHITECTURE_example_nlayer.md
**Architecture Type**: N-Layer (Domain-Driven Design)

Demonstrates:
- 4-Layer Classic DDD pattern
- Framework-free domain layer
- Dependency inversion principle
- Repository pattern with interface segregation
- Clean separation of concerns

**Best for**: DDD implementations, Clean Architecture, Hexagonal Architecture

---

### 5. 04-data-flow-patterns.example.md
**Purpose**: Reference example for Section 6 in **Phase Catalog mode** — the default authoring mode for any architecture with 2+ use cases that share components, or a single UC with ≥4 distinguishable phases.

Demonstrates:
- The 8-part Phase Catalog structure: EXPLORER_HEADER → intro + how-to-read → Flow Inventory → Phase Catalog → Use Case Resolutions matrix → Cross-cutting concerns → End-to-End Wire Sequences → Validation checklist
- Synthetic 3-UC e-commerce checkout (UC1 New Order, UC2 Reorder, UC3 Refund)
- Per-phase mini `sequenceDiagram` mermaid blocks (one per phase, scoped to the phase's participants only)
- Phase × UC composition matrix with `✓ | reused | skipped | n/a` cell vocabulary
- Latency budget breakdown per hop and failure classification per (phase, failure mode) pair
- Full end-to-end wire sequence diagrams at the bottom (one per UC)

**Best for**: Any architecture where multiple use cases share phases. Open this file alongside `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → Section 6 when authoring Section 6 from scratch. Component / ADR / metric values are illustrative — do not import them verbatim.

---

## Using These Examples

**To use an example as a starting point:**

1. Copy the example file that best matches your system's architecture type
2. Rename it to `ARCHITECTURE.md` in your project directory
3. Replace placeholder content with your system-specific details
4. Validate using the validation rules in `../VALIDATIONS.md`

**Key sections to customize:**
- Section 1: Executive Summary (system name, metrics, business value)
- Section 2: System Overview (problem statement, use cases)
- Section 3: Architecture Principles (system-specific implementations)
- Section 5: Component Details (your actual components)
- Section 7: Integration Points (your external systems)
- Section 8: Technology Stack (your technologies)

**Metadata tracking:**

Each example includes an architecture type metadata comment in Section 4:
```markdown
<!-- ARCHITECTURE_TYPE: ENTERPRISE | 3-TIER | MICROSERVICES | N-LAYER -->
```

This metadata enables type-specific validation and ensures proper template selection.

---

## Comparison Matrix

| Feature | Microservices* | ENTERPRISE | 3-Tier | N-Layer |
|---------|----------------|------|--------|---------|
| **Complexity** | High | Very High | Low | Medium-High |
| **Team Size** | Large (10+) | Large (10+) | Small-Med (2-8) | Medium (4-10) |
| **Scalability** | Horizontal | Horizontal/Vertical | Vertical | Depends on pattern |
| **Deployment** | Complex (independent) | Complex | Simple | Moderate |
| **Data Management** | Distributed (per-service) | Centralized/Distributed | Centralized | Depends on pattern |
| **Integration** | Event-driven + REST | Complex (ESB/Integration layer) | Simple (direct) | Interface-based |
| **Best For** | Cloud-native, SaaS | Enterprises | Web apps, APIs | DDD, Clean Arch |

\* Recommended for modern cloud-native applications

---

## Related Documentation

- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Full documentation guide with all 13 sections
- **VALIDATIONS.md**: Validation rules and checklists (including type-aware validation)
- **SKILL.md**: Operational workflows for creating and editing ARCHITECTURE.md
- **templates/**: Type-specific templates for Section 4 and Section 5

---

## Contributing Examples

If you create a high-quality ARCHITECTURE.md that could serve as a reference example, consider contributing it to this directory (with sensitive information removed).

**Contribution guidelines:**
1. Remove all proprietary/confidential information
2. Use realistic but generic company/system names
3. Include comprehensive content for all 13 sections
4. Follow validation rules strictly
5. Add architecture type metadata comment in Section 4