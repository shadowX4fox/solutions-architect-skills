# Project Guidelines

> **Note**: This is a Claude Code Plugin. For plugin development documentation, see [Claude Code Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins).

## Plugin Structure

This repository follows the Claude Code plugin structure:

- `.claude-plugin/` - Plugin configuration and marketplace metadata
  - `plugin.json` - Plugin manifest (name, version, description)
  - `marketplace.json` - Marketplace registry configuration
- `skills/` - Five skill directories (architecture-readiness, architecture-docs, architecture-compliance, component-index-guardian, architecture-peer-review)
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

2. **Technical Architecture Phase** (Architecture Team)
   - Use the `architecture-docs` skill to create ARCHITECTURE.md
   - Translates business requirements into technical architecture
   - Defines components, integrations, and technical decisions
   - **Prerequisite Gate**: When no PO Spec exists, the user chooses from three options:
     (1) run the full `/skill architecture-readiness` elicitation, (2) provide business
     context inline (evaluated against the PO Spec scoring rubric with gap interviews),
     or (3) skip with `SKIP PO SPEC` (warning recorded). Gate applies only to new
     document creation, not editing existing documents.

3. **Compliance Documentation Phase** (Compliance Team)
   - Use the `architecture-compliance` skill to generate compliance documents
   - Generates 10 compliance contracts from ARCHITECTURE.md

### Using the Architecture-Readiness Skill

The `architecture-readiness` skill helps Product Owners document business requirements before technical architecture design begins.

To manually activate the skill, use: `/skill architecture-readiness`

The skill has three primary functions:
1. **Requirements Elicitation**: Guided discovery interview when starting from scratch (no existing PO Spec)
2. **PO Spec Creation**: Template-guided document creation for business requirements
3. **PO Spec Evaluation**: Weighted scoring (0–10) to assess architecture team readiness

The skill includes:
- Requirements Elicitation Guide (4-phase discovery interview methodology)
- Product Owner Specification Guide (8-section template)
- Quick-start template for new specifications
- Scoring guide: weighted assessment methodology
- Business-focused language (no technical details)
- Mapping guide: PO Spec → ARCHITECTURE.md
- User personas, use cases, and user stories

**When to use**: When starting from scratch with no existing PO Spec (elicitation), before creating ARCHITECTURE.md, when documenting business requirements, or when Product Owners need to communicate context to the architecture team.

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

**Diagram Enforcement Policy** (Workflow 9):
- **Mandatory diagrams**: High-Level Architecture and Data Flow diagrams are always generated (not optional)
- **Canonical locations**: All diagrams must reside in their designated `docs/` file — not configurable, no override
- **Source of truth**: Architecture docs are authoritative — diagrams for undocumented flows are discarded
- **Completeness audit**: Every documented flow is checked for a corresponding Mermaid diagram after generation
- **External reconciliation**: Diagrams from external files are classified, validated against architecture docs, then relocated or discarded


### Using the Architecture Compliance Skill

The `architecture-compliance` skill generates Compliance Contracts (Contratos de Adherencia) from ARCHITECTURE.md files. It produces 10 separate compliance documents ensuring organizational standards adherence.

To manually activate the skill, use: `/skill architecture-compliance`

The skill includes:
- **10 specialized compliance agents** with parallel execution support
- **Gap detection** and completion recommendations
- **Output**: Saved to `/compliance-docs/` with `COMPLIANCE_MANIFEST.md`

**Agents and Contract Types**:

| Agent | Contract Type |
|-------|---------------|
| `business-continuity-compliance-generator` | Continuidad de Negocio |
| `sre-compliance-generator` | Arquitectura SRE |
| `cloud-compliance-generator` | Arquitectura Cloud |
| `data-ai-compliance-generator` | Arquitectura Datos y Analítica - IA |
| `development-compliance-generator` | Arquitectura Desarrollo |
| `process-compliance-generator` | Transformación de Procesos y Automatización |
| `security-compliance-generator` | Arquitectura Seguridad |
| `platform-compliance-generator` | Plataformas e Infraestructura TI |
| `enterprise-compliance-generator` | Arquitectura Empresarial |
| `integration-compliance-generator` | Arquitectura de Integración |

**When to use**: After ARCHITECTURE.md is complete, when compliance documentation is required, or when organizational standards validation is needed.

**Permissions (Plugin Limitation)**: Claude Code plugin agents do not support `permissionMode` in frontmatter (silently ignored). Permissions must be granted via the project's `.claude/settings.json`. Required permissions:

```json
"permissions": {
  "allow": [
    "Bash(bun:*)",
    "Bash(mkdir:*)",
    "Bash(date:*)",
    "Bash(cat:*)",
    "Bash(cp:*)",
    "Bash(grep:*)",
    "Bash(python3:*)",
    "Read(//tmp/*)",
    "Write(//tmp/*)",
    "Agent(solutions-architect-skills:business-continuity-compliance-generator)",
    "Agent(solutions-architect-skills:sre-compliance-generator)",
    "Agent(solutions-architect-skills:cloud-compliance-generator)",
    "Agent(solutions-architect-skills:data-ai-compliance-generator)",
    "Agent(solutions-architect-skills:development-compliance-generator)",
    "Agent(solutions-architect-skills:process-compliance-generator)",
    "Agent(solutions-architect-skills:security-compliance-generator)",
    "Agent(solutions-architect-skills:platform-compliance-generator)",
    "Agent(solutions-architect-skills:enterprise-compliance-generator)",
    "Agent(solutions-architect-skills:integration-compliance-generator)"
  ]
}
```

A pre-configured example is provided at `.claude/settings.json.example`. Users installing the plugin must copy or merge the `permissions.allow` block into their project's `.claude/settings.json`.

### Using the Component Index Guardian Skill

The `component-index-guardian` skill is the **only sanctioned way** to create or update `docs/components/README.md`. It enforces a fixed 4-column table schema on every write.

To manually activate the skill, use: `/skill component-index-guardian`

**When to use**:
- After adding, removing, or renaming a component file in `docs/components/`
- To sync the index after a migration that produces the `docs/components/` structure
- Any time `docs/components/README.md` needs to change (redirect direct-edit requests here)

**Output**: Generates `docs/components/README.md` with a managed-by comment, breadcrumb, and a 4-column table (`#`, `Component`, `File`, `Type`).

| Change | How |
|--------|-----|
| Add a component | Invoke skill with "add component \<name\>" |
| Remove a component | Invoke skill with "remove component \<name\>" |
| Update a component | Invoke skill with "update component \<name\>" |
| Re-sync index | Invoke skill with "sync" |

If a user requests a direct edit to `docs/components/README.md` (adding columns, reformatting, or any change), redirect to this skill.

### Using the Architecture Peer Review Skill

The `architecture-peer-review` skill performs Solution Architect peer reviews of ARCHITECTURE.md documents, generating an interactive HTML playground for triaging findings.

To manually activate the skill, use: `/skill architecture-peer-review`

The skill includes:
- **3 review depth levels**: Light (structural, 22 checks), Medium (content quality, 44 checks), Hard (deep analysis, 82 checks)
- **13 review categories** with weighted scoring: Structural Completeness, Naming & Conventions, Section Completeness, Content Coherence, Technology Alignment, Integration Soundness, Metric Realism, Scalability Design, Security Posture, Performance Design, Operational Readiness, ADR Quality, Trade-off Honesty
- **Interactive HTML playground** via the `playground` plugin — approve/reject/comment workflow
- **Weighted 0–10 scorecard** per category and overall
- **Fix prompt generation** for approved findings to paste back into Claude

**When to use**: After ARCHITECTURE.md passes form validation (use `architecture-docs` review first), when a peer review or architectural quality assessment is needed, or before finalizing architecture for implementation.
