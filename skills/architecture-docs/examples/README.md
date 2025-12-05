# Architecture Documentation Examples

This directory contains example ARCHITECTURE.md files demonstrating each supported architecture type.

## Available Examples

### 1. ARCHITECTURE_example_meta.md
**Architecture Type**: META (6-Layer Enterprise)

Demonstrates:
- 6-layer META model (Channels → UX → Business Scenarios → Integration → Domain → Core)
- [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) alignment for Layer 5 (Domain) components (default version)
- Complex enterprise integration patterns
- Regulatory compliance considerations

**BIAN V12.0 Default**: All META architecture examples use BIAN V12.0 as the default service domain model. Service domains are referenced from the [official BIAN Service Landscape V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html).

**Best for**: Large enterprise systems, financial services, complex integrations

---

### 2. ARCHITECTURE_example_3tier.md
**Architecture Type**: 3-Tier (Classic Web Application)

Demonstrates:
- 3-tier structure (Presentation → Application/Business Logic → Data)
- Tier separation enforcement
- Stateless application tier design
- Standard web application patterns

**Best for**: Web applications, REST APIs, standard CRUD systems

---

### 3. ARCHITECTURE_example_microservices.md
**Architecture Type**: Microservices (Cloud-Native Distributed)

Demonstrates:
- Infrastructure components (API Gateway, Service Mesh, Event Bus)
- Database-per-service pattern
- Event-driven communication
- Circuit breaker patterns
- Microservice catalog with comprehensive service details

**Best for**: Cloud-native systems, independently deployable services, event-driven architectures

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
<!-- ARCHITECTURE_TYPE: META | 3-TIER | MICROSERVICES | N-LAYER -->
```

This metadata enables type-specific validation and ensures proper template selection.

---

## Comparison Matrix

| Feature | META | 3-Tier | Microservices | N-Layer |
|---------|------|--------|---------------|---------|
| **Complexity** | Very High | Low | High | Medium-High |
| **Team Size** | Large (10+) | Small-Med (2-8) | Large (10+) | Medium (4-10) |
| **Scalability** | Horizontal/Vertical | Vertical | Horizontal | Depends on pattern |
| **Deployment** | Complex | Simple | Complex (independent) | Moderate |
| **Data Management** | Centralized/Distributed | Centralized | Distributed (per-service) | Depends on pattern |
| **Integration** | Complex (ESB/Integration layer) | Simple (direct) | Event-driven + REST | Interface-based |
| **Best For** | Enterprises, banking | Web apps, APIs | Cloud-native, SaaS | DDD, Clean Arch |

---

## Related Documentation

- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Full documentation guide with all 12 sections
- **VALIDATIONS.md**: Validation rules and checklists (including type-aware validation)
- **SKILL.md**: Operational workflows for creating and editing ARCHITECTURE.md
- **templates/**: Type-specific templates for Section 4 and Section 5

---

## Contributing Examples

If you create a high-quality ARCHITECTURE.md that could serve as a reference example, consider contributing it to this directory (with sensitive information removed).

**Contribution guidelines:**
1. Remove all proprietary/confidential information
2. Use realistic but generic company/system names
3. Include comprehensive content for all 12 sections
4. Follow validation rules strictly
5. Add architecture type metadata comment in Section 4