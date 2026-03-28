# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: This is a Claude Code Plugin. For plugin development documentation, see [Claude Code Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins).

## Development Commands

```bash
# Type-check all TypeScript files
bun run typecheck

# Compile TypeScript to dist/
bun run build

# Run unit tests (Bun test framework)
bun test

# Run tests in a specific file
bun test skills/architecture-compliance/tests/validators.test.ts

# Install all workspace dependencies (root + tools/docgen)
bun install

# Build a release package (ZIP + SHA256)
bash scripts/build-release.sh
```

## Plugin Structure

This repository follows the Claude Code plugin structure:

- `.claude-plugin/` - Plugin manifest (`plugin.json`) and marketplace registry (`marketplace.json`) — version is tracked here (authoritative)
- `package.json` - Root Bun workspace config; `bun run build` / `bun run typecheck` operate here
- `agents/` - 10 Markdown agent definitions, one per compliance contract type; invoked by the `architecture-compliance` skill via the Agent tool
- `skills/` - Eight skill directories (architecture-readiness, architecture-docs, architecture-compliance, architecture-compliance-review, architecture-component-guardian, architecture-peer-review, architecture-dev-handoff, architecture-docs-export)
- `tools/docgen/` - Standalone `generate-doc.js` (Word/.docx generation via `docx` v8); its own `package.json` under the Bun workspace
- `scripts/build-release.sh` - Packages a release ZIP with SHA256 checksum
- `docs/` - User-facing documentation
- `CLAUDE.md` - This file (development guidelines)

For more on plugin structure, see [Plugin Directory Structure](https://docs.anthropic.com/claude/docs/claude-code-plugins#directory-structure).

## Code Architecture

**Skill anatomy**: Each skill is a directory under `skills/` containing a `SKILL.md` frontmatter file plus supporting Markdown guides, templates, and JSON validation schemas. Skills are pure Markdown — no compiled code — except `architecture-compliance`, which includes TypeScript utilities.

**TypeScript utilities** live exclusively in `skills/architecture-compliance/utils/`:
- `validators.ts` — compliance table/section validation logic
- `post-generation-pipeline.ts` — runs after each contract is generated
- `manifest-generator.ts` — writes `COMPLIANCE_MANIFEST.md`
- `check-dir.ts` — validates output directory before writing
- `resolve-plugin-dir.ts` — resolves the plugin cache path at runtime (needed because the skill is invoked from arbitrary project directories)
- CLI wrappers (`*-cli.ts`) — thin Bun entrypoints for each utility

**Agents vs. Skills**: The `agents/` directory holds 10 agent definitions consumed by Claude Code's Agent tool. They are **not** skills; they are spawned as sub-agents from the `architecture-compliance` skill to run compliance generation in parallel. NEVER invoke them directly from user-facing prompts.

**Versioning**: The canonical version lives in `.claude-plugin/plugin.json`. Commits follow `feat: <description> v<semver>` and the `/release` skill bumps the version, commits, and pushes.

**Word export**: `tools/docgen/generate-doc.js` is invoked with `bun run tools/docgen/generate-doc.js <type> <input.md> <output.docx>`. It has its own `node_modules` under `tools/docgen/` managed separately from the root workspace.

---

## Architecture Documentation

This project maintains architecture documentation using standardized templates and guidelines.

### Quick Reference
- **All architecture documents** must be named `ARCHITECTURE.md`
- **Use the architecture-docs skill** when working with architecture documentation
- **Primary template**: ARCHITECTURE_DOCUMENTATION_GUIDE.md
- **Architectural decisions**: Use ADR_GUIDE.md for decision records

### Architecture Documentation Workflow

This project follows a four-phase documentation approach:

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

4. **Development Handoff Phase** (Development Team)
   - Use the `architecture-dev-handoff` skill to generate per-component handoff documents
   - Produces a 16-section handoff document per component plus deliverable assets
   - Assets are scaffolded based on component type: `openapi.yaml` (API), `ddl.sql` (DB), `redis-key-schema.md` (Redis/Cache), `deployment.yaml` (K8s), `asyncapi.yaml` (messaging), `cronjob.yaml` (scheduled jobs)
   - **Prerequisite**: ARCHITECTURE.md and `docs/components/` must exist (Phase 2 complete); compliance contracts optional (used for enrichment if present)

### Using the Architecture-Readiness Skill

The `architecture-readiness` skill helps Product Owners document business requirements before technical architecture design begins.

To manually activate the skill, use: `/skill architecture-readiness`

The skill has four primary functions:
1. **Requirements Elicitation**: Guided discovery interview when starting from scratch (no existing PO Spec)
2. **PO Spec Creation**: Template-guided document creation for business requirements
3. **PO Spec Evaluation**: Weighted scoring (0–10) to assess architecture team readiness
4. **Async Intake**: File-based requirements extraction from tickets, emails, or documents — scores against the PO Spec rubric and produces a gap report with ready-to-send questions for the requester

The skill includes:
- Requirements Elicitation Guide (4-phase discovery interview methodology)
- Product Owner Specification Guide (8-section template)
- Quick-start template for new specifications
- Scoring guide: weighted assessment methodology
- Business-focused language (no technical details)
- Mapping guide: PO Spec → ARCHITECTURE.md
- User personas, use cases, and user stories

**When to use**: When starting from scratch with no existing PO Spec (elicitation), before creating ARCHITECTURE.md, when documenting business requirements, when Product Owners need to communicate context to the architecture team, or when business context arrives asynchronously via ticket, email, or document (async intake).

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

**Diagram Enforcement Policy** (Workflow 8):
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
    "Bash(bun *)",
    "Bash(ls *)",
    "Bash(mkdir *)",
    "Bash(date *)",
    "Bash(cat *)",
    "Bash(cp *)",
    "Bash(grep *)",
    "Bash(python3 *)",
    "Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/*)",
    "Glob(**/skills/architecture-compliance/SKILL.md)",
    "Read(//tmp/*)",
    "Write(//tmp/*)",
    "Write(compliance-docs/*)",
    "Read(compliance-docs/*)",
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

### Using the Architecture Component Guardian Skill

The `architecture-component-guardian` skill is the **only sanctioned way** to create or update `docs/components/README.md`. It enforces a fixed 4-column table schema on every write.

To manually activate the skill, use: `/skill architecture-component-guardian`

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

**Note**: Development handoff documents (`docs/handoffs/`) are managed separately by the `architecture-dev-handoff` skill.

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

### Using the Architecture Compliance Review Skill

The `architecture-compliance-review` skill validates compliance contract portfolio health and generates an interactive playground for exploring what needs to be fixed in ARCHITECTURE.md to reach the auto-approve threshold (≥8.0/10) across all 10 contracts.

To manually activate the skill, use: `/skill architecture-compliance-review`

The skill includes:
- **Coverage validation**: Checks all 10 required contracts are present and ≤6 months old
- **Expired/missing contract handling**: Offers to regenerate stale contracts via the `architecture-compliance` skill before proceeding
- **Gap extraction**: Reads every contract's compliance summary table and extracts Non-Compliant and Unknown requirements
- **Concept clustering**: Groups gaps across contracts by underlying ARCHITECTURE.md concept (load testing, DR/RTO, IAM, observability, etc.) ranked by cross-contract impact
- **Interactive HTML playground** via the `playground` plugin — compliance gap explorer with portfolio health panel and filter controls for exploring concept gaps across all contracts

**When to use**: After compliance contracts are generated (use `architecture-compliance` first), when you want to understand what ARCHITECTURE.md improvements are needed to reach auto-approval across all contracts, or for periodic compliance health checks.

**Permissions required** (add to project `.claude/settings.json`):

```json
"Read(compliance-docs/*)"
```

### Using the Architecture Dev Handoff Skill

The `architecture-dev-handoff` skill generates per-component **Component Development Handoff** documents that give development teams everything needed to implement a component without reading the full ARCHITECTURE.md suite.

To manually activate the skill, use: `/skill architecture-dev-handoff`

The skill includes:
- **16-section handoff document** per component — metadata, overview, scope, API contract, data model, integrations, security, performance, configuration, observability, error handling, technology constraints, acceptance criteria, ADRs, deliverable assets, open questions
- **Component-type-specific asset generation** — scaffolded artifacts based on component type:
  - API/REST/Service → `openapi.yaml` (OpenAPI 3.1 specification)
  - Database/Data Store → `ddl.sql` (DDL with tables, indexes, constraints)
  - Redis / Cache → `redis-key-schema.md` (key patterns, TTL, eviction, fail-open behavior)
  - Kubernetes workload → `deployment.yaml` (Deployment + Service + HPA manifests)
  - Message Consumer/Producer → `asyncapi.yaml` (AsyncAPI 3.0 specification)
  - Kafka + Avro serialization → `schema.avsc` (Avro schema for Schema Registry)
  - Kafka + Protobuf serialization → `schema.proto` (Protobuf message definition)
  - Scheduled Job → `cronjob.yaml` (Kubernetes CronJob manifest)
- **Gap detection** — fields not found in architecture docs are marked `[NOT DOCUMENTED]` and listed in Section 15 (Open Questions) as a remediation checklist
- **Compliance enrichment** — if `compliance-docs/` exists, security/SRE/development contract gaps are surfaced in relevant sections
- **Managed index** at `docs/handoffs/README.md` — 6-column table tracking all handoff docs

**Output location**: `docs/handoffs/NN-<component-name>-handoff.md` + `docs/handoffs/assets/NN-<component-name>/`

**When to use**: After ARCHITECTURE.md and `docs/components/` are complete (Phase 2), when handing off a component to the development team for implementation, or when generating implementation specs for one or more components.

**Permissions required** (add to project `.claude/settings.json`):

```json
"Write(docs/handoffs/*)",
"Read(docs/handoffs/*)"
```

### Using the Architecture Blueprint Skill

The `architecture-blueprint` skill generates standardized organizational blueprint markdown files by extracting data from the architecture documentation and filling predefined templates. It produces two output files — **Business** and **Application** — written to the same directory as `ARCHITECTURE.md`.

To manually activate the skill, use: `/skill architecture-blueprint`

The skill includes:
- **Business blueprint** (`BLUEPRINT_BUSINESS.md`) — fills the "Datos de la Iniciativa" organizational template with architecture-derived data (business domain, strategy, deployment location, team roles)
- **Application blueprint** (`BLUEPRINT_APPLICATION.md`) — fills an application-level template (template pending; skipped until `APPLICATION_TEMPLATE.md` is added)
- **Smart field extraction** — maps each `<placeholder>` to the relevant architecture doc section using a field mapping table
- **NOT FOUND handling** — fields not found in architecture docs are marked `NOT FOUND` with a recommended keyword or section to add the missing data
- **Selective generation** — generate both, business-only, or application-only based on request
- **Summary report** — lists all filled fields and all NOT FOUND gaps with remediation suggestions

**Output location**: same directory as `ARCHITECTURE.md` (project root or subdirectory).

**Templates location**: `skills/architecture-blueprint/` in the plugin directory.
- `BUSINESS_TEMPLATE.md` — provided (Datos de la Iniciativa format)
- `APPLICATION_TEMPLATE.md` — **pending** (add when ready; skill auto-skips if missing)

**When to use**: When generating initiative data sheets, organizational architecture forms, or standardized business/application blueprints from an existing architecture document.

---

### Using the Architecture Onboarding Skill

The `architecture-onboarding` skill is the **entry point for new team members**. It reads the project's existing architecture docs and generates a canvas-based interactive concept map via the `playground` plugin. The map is **centered on architecture sections** and traces back to **use cases from the PO Spec / system overview**, showing how business requirements flow through sections into components. Users drag nodes to explore, cycle knowledge levels (Know/Fuzzy/Unknown) per concept, and copy a targeted learning prompt shaped by their gaps.

To manually activate the skill, use: `/skill architecture-onboarding`

The skill includes:
- **Use case traceability** — extracts use cases from PO Spec Section 4 or `docs/01-system-overview.md` Section 2.3, traces them through architecture sections to components via handoff docs
- **Concept map playground** — draggable nodes, force-directed auto-layout, edge types (depends-on, produces, validates, uses-skill, implements, traces-to, served-by)
- **3 core node groups** — Use Cases (pink), Architecture Sections (blue), Components (green) — the traceability spine shown by default
- **4 supplementary groups** — Lifecycle Phases, Compliance Contracts, Principles, Available Skills — hidden by default, available via toggles or Full Map preset
- **4 preset views** — Use Case Traceability (default), Section Dependencies, Component Map, Full Map
- **Ghost nodes** — missing sections/contracts shown semi-transparent with actionable guidance on which skill to invoke
- **Knowledge cycling** — Know / Fuzzy / Unknown per node; generates targeted learning prompt
- **Fallback** — plain-text report with next-skill recommendations if playground plugin is not installed

**Output**: `architecture-onboarding-<YYYY-MM-DD>.html` opened in browser.

**When to use**: When a new team member joins the project, when you want an overview of the architecture suite, when exploring what documentation exists and what's missing, or when mapping what you know and don't know about the architecture.

---

### Using the Architecture Doc Export Skill

The `architecture-docs-export` skill exports architecture documents and component handoffs to professional Word (.docx) files on demand. Exports are **never automatic** — invoke explicitly when ready to produce deliverables.

To manually activate the skill, use: `/skill architecture-docs-export`

The skill has two export modes:

| Mode | What it exports | Output |
|------|----------------|--------|
| **Solution Architecture** | Executive Summary synthesized from `docs/01-system-overview.md` + component index + compliance manifest (if present), plus one `.docx` per ADR | `exports/SA-<name>.docx` + `exports/ADR-NNN-<title>.docx` per ADR |
| **Dev Handoff** | Selected component handoff(s) from `docs/handoffs/` | `exports/HANDOFF-<component>.docx` per component |

**Document styling**:
- Corporate blue (`#1F4E79`) — SA executive summary
- Amber/Gold (`#8B6914`) — Architecture Decision Records (ADRs)
- Teal (`#0D7377`) — component handoffs (development phase deliverables)

**Output location**: `exports/` at project root (auto-created).

**When to use**: When you need a Word-format executive summary of the architecture (with component overview and compliance status), individual ADR deliverables, or component handoff documents.

**Permissions required** (add to project `.claude/settings.json`):

```json
"Bash(bun run tools/docgen/generate-doc.js *)",
"Write(exports/*)"
```

