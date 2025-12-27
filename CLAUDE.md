# Project Guidelines

> **Note**: This is a Claude Code Plugin. For plugin development documentation, see [Claude Code Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins).

## Plugin Structure

This repository follows the Claude Code plugin structure:

- `.claude-plugin/` - Plugin configuration and marketplace metadata
  - `plugin.json` - Plugin manifest (name, version, description)
  - `marketplace.json` - Marketplace registry configuration
- `skills/` - Three skill directories (architecture-readiness, architecture-docs, architecture-compliance)
- `docs/` - User-facing documentation
- `CLAUDE.md` - This file (development guidelines)

For more on plugin structure, see [Plugin Directory Structure](https://docs.anthropic.com/claude/docs/claude-code-plugins#directory-structure).

---

## Architecture Documentation

This project maintains architecture documentation using standardized templates and guidelines.

### Quick Reference
- **All architecture documents** must be named `ARCHITECTURE.md`
- **Use the architecture-docs skill** when working with architecture documentation
- **Primary template**: ARCHITECTURE_DOCUMENTATION_GUIDE.md
- **Architectural decisions**: Use ADR_GUIDE.md for decision records

### Architecture Documentation Workflow

This project follows a three-phase documentation approach:

1. **Business Requirements Phase** (Product Owner)
   - Use the `architecture-readiness` skill to create Product Owner Specifications
   - Captures business context, user needs, and success criteria
   - Provides input for technical architecture design

2. **Technical Architecture Phase** (Architecture Team)
   - Use the `architecture-docs` skill to create ARCHITECTURE.md
   - Translates business requirements into technical architecture
   - Defines components, integrations, and technical decisions

3. **Compliance Documentation Phase** (Compliance Team)
   - Use the `architecture-compliance` skill to generate compliance documents
   - Generates 10 compliance contracts from ARCHITECTURE.md
   - Ensures adherence to organizational standards and best practices

### Using the Architecture-Readiness Skill

The `architecture-readiness` skill helps Product Owners document business requirements before technical architecture design begins.

To manually activate the skill, use: `/skill architecture-readiness`

The skill includes:
- Product Owner Specification Guide (8-section template)
- Quick-start template for new specifications
- Business-focused language (no technical details)
- Mapping guide: PO Spec → ARCHITECTURE.md
- User personas, use cases, and user stories

**When to use**: Before creating ARCHITECTURE.md, when documenting business requirements, or when Product Owners need to communicate context to the architecture team.

### Using the Architecture Documentation Skill

The `architecture-docs` skill provides comprehensive guidelines for creating and maintaining ARCHITECTURE.md files. It automatically activates when you create, update, or maintain ARCHITECTURE.md files, or when you ask about documented components, data structures, integrations, security, performance, deployment, technology stack, or architectural decisions. You can also manually activate it.

To manually activate the skill, use: `/skill architecture-docs`

The skill includes:
- File naming conventions
- Context-efficient workflows for editing large documents
- 12-section structure template
- Best practices for documentation maintenance
- Integration with ARCHITECTURE_DOCUMENTATION_GUIDE.md and ADR_GUIDE.md

**Note**: The skill is optimized to minimize context usage by loading document sections incrementally rather than reading entire files.

### Using the Architecture Compliance Skill

The `architecture-compliance` skill generates Compliance Contracts (Contratos de Adherencia) from ARCHITECTURE.md files. It produces 10 separate compliance documents ensuring organizational standards adherence.

**Version 2.0+**: Uses 10 specialized compliance generation agents (one per contract type) for optimized performance and parallel execution.

To manually activate the skill, use: `/skill architecture-compliance`

The skill includes:
- **10 specialized compliance agents**: One dedicated agent per contract type
- **10 compliance contract templates** (Contratos de Adherencia)
- **Parallel execution support**: Generate all 10 contracts simultaneously (~10x faster)
- **Pre-configured section mappings**: Domain-specific optimization
- **Automated data extraction** from ARCHITECTURE.md
- **Context-efficient generation** (70-80% reduction in loaded content)
- **Full source traceability** for audit trails
- **Gap detection** and completion recommendations

**Compliance Document Types**:
1. Continuidad de Negocio (Business Continuity)
2. Arquitectura SRE (Site Reliability Engineering)
3. Arquitectura Cloud
4. Arquitectura Datos y Analítica - IA
5. Arquitectura Desarrollo (Development Architecture)
6. Transformación de Procesos y Automatización
7. Arquitectura Seguridad (Security Architecture)
8. Plataformas e Infraestructura TI
9. Arquitectura Empresarial (Enterprise Architecture)
10. Arquitectura de Integración

**Specialized Agents** (v2.0+):
1. `business-continuity-compliance-generator` - Business Continuity contracts
2. `sre-compliance-generator` - SRE Architecture contracts
3. `cloud-compliance-generator` - Cloud Architecture contracts
4. `data-ai-compliance-generator` - Data & AI Architecture contracts
5. `development-compliance-generator` - Development Architecture contracts
6. `process-compliance-generator` - Process Transformation contracts
7. `security-compliance-generator` - Security Architecture contracts
8. `platform-compliance-generator` - Platform & IT Infrastructure contracts
9. `enterprise-compliance-generator` - Enterprise Architecture contracts
10. `integration-compliance-generator` - Integration Architecture contracts

**Agent Benefits**:
- **Performance**: Pre-configured section mappings, domain-specific extraction patterns
- **Clarity**: Each agent has single responsibility, self-documenting names
- **Scalability**: Native parallel execution, no shared state
- **Maintainability**: Independent updates per agent, easier testing

**When to use**: After ARCHITECTURE.md is complete, when compliance documentation is required, or when organizational standards validation is needed.

**Output**: All generated compliance documents are saved to `/compliance-docs/` directory with full traceability to ARCHITECTURE.md sources. The skill orchestrator generates `COMPLIANCE_MANIFEST.md` after all contracts complete.

**Migration**: See `agents/MIGRATION.md` for v1.9.0 → v2.0.0 upgrade guide.