# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: This is a Claude Code Plugin. For plugin development documentation, see [Claude Code Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins).

## Development Commands

```bash
# Type-check all TypeScript files
bun run typecheck

# Build agents + compile TypeScript
bun run build

# Rebuild compliance agents only (base template + configs → 10 agent .md files)
bun run build:agents

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
- `agents/` - `agents/compliance-generator.md` is the single universal generator; `agents/validators/` holds 10 domain validation agents; `agents/base/configs/` holds 10 domain config JSONs read at runtime
- `skills/` - Eight skill directories (architecture-readiness, architecture-docs, architecture-compliance, architecture-compliance-review, architecture-component-guardian, architecture-peer-review, architecture-dev-handoff, architecture-docs-export)
- `tools/docgen/` - Standalone `generate-doc.js` (Word/.docx generation via `docx` v8); its own `package.json` under the Bun workspace
- `scripts/build-agents.ts` - Assembles 10 compliance agent .md files from base template + domain configs
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

**Agents vs. Skills**: The `agents/` directory holds 10 compliance generator agents and 10 validation agents consumed by Claude Code's Agent tool. They are **not** skills; compliance generators are spawned as sub-agents from the `architecture-compliance` skill, and validation agents are spawned by their respective compliance generators. NEVER invoke them directly from user-facing prompts.

**Agent architecture**: A single universal `agents/compliance-generator.md` handles all 10 contract types. It reads its domain config at runtime from `agents/base/configs/{contract_type}.json` to load template filename, section mappings, grep patterns, and requirement codes. Domain-specific validation (EOL checks, stack validation) is handled by 10 separate validator agents in `agents/validators/`.

**Agent directory structure**:
- `agents/compliance-generator.md` — single universal generator (reads config at runtime)
- `agents/base/configs/` — 10 JSON files with domain-specific values (section mappings, grep patterns, requirements, etc.)
- `agents/validators/` — 10 validation agents with domain personality, EOL checks, and standard validation

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
- **Architecture versioning**: Every `ARCHITECTURE.md` carries a semantic version (see "Architecture Versioning" section below)

### Architecture Versioning

Every architecture carries a **semantic version** (MAJOR.MINOR.PATCH) that is the canonical reference for all downstream artifacts. Versioning has two levels:

**1. Whole-architecture version** (in `ARCHITECTURE.md` header):
```markdown
<!-- ARCHITECTURE_VERSION: 1.2.0 -->
<!-- ARCHITECTURE_STATUS: Released -->
<!-- ARCHITECTURE_RELEASED: 2026-04-08 -->

**Version**: 1.2.0
**Status**: Draft | Released | Deprecated
**Released**: YYYY-MM-DD
**Architect**: [Name or Team]
**Supersedes**: v1.1.0
```

**2. Per-component version** (in each `docs/components/**/*.md` file, after the C4 metadata block):
```markdown
**Component Version:** 1.3.0
**Architecture Version:** 1.2.0
**Last Updated:** 2026-04-08
```

**Semver rules**:
- **MAJOR**: Breaking structural changes (new system, architecture type change, major ADR superseded)
- **MINOR**: New components, new sections, new integrations, new ADRs accepted
- **PATCH**: Corrections, clarifications, metric/typo fixes

**Lifecycle**:
1. New architecture → `v1.0.0` / Status: `Draft`
2. First release → Status: `Released` + `Released: YYYY-MM-DD` + git tag `architecture-v1.0.0`
3. Change → bump version per semver rules → re-release
4. All released versions recorded in `docs/CHANGELOG.md` (Keep a Changelog format)

**Git tag convention**: `architecture-v{version}` (e.g., `architecture-v1.2.0`). Namespaced with `architecture-` prefix to distinguish from plugin/app version tags. The git tag MUST reflect the doc version when the project is under git version control.

**Archive snapshots** (`archive/v{version}/`): Immutable filesystem snapshot of a released version (copy of ARCHITECTURE.md + docs/ + adr/ + RELEASE_NOTES.md + .immutable marker).
- **Non-git projects**: archive is created automatically on every release (it's the only snapshot mechanism when git history is unavailable)
- **Git projects**: archive is optional — the git tag is the primary mechanism. Users can opt into the archive for regulated industries, audit compliance, or when consumers need a filesystem-level baseline without git
- Files inside `archive/v{version}/` MUST NOT be edited after creation — corrections require a new PATCH release

**Downstream reference**: Compliance contracts, handoff documents, and traceability reports include `Architecture Version: v{version}` in their metadata, making artifacts traceable to a specific architecture baseline.

### Architecture Documentation Workflow

This project follows a four-phase documentation approach:

1. **Business Requirements Phase** (Product Owner)
   - Use the `architecture-readiness` skill to create Product Owner Specifications
   - Captures business context, user needs, and success criteria

2. **Technical Architecture Phase** (Architecture Team)
   - Use the `architecture-docs` skill to create ARCHITECTURE.md
   - Translates business requirements into technical architecture
   - Defines components, integrations, and technical decisions
   - **Prerequisite Gate**: When no PO Spec exists, the user chooses from four options:
     (1) run the full `/skill architecture-readiness` elicitation, (2) async intake
     from a file (scores and generates gap report), (3) provide business context inline
     (evaluated against the PO Spec scoring rubric with gap interviews), or (4) skip
     with `SKIP PO SPEC` (warning recorded). Gate applies only to new
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
- **Mandatory diagrams**: 4 standard diagrams always generated — Logical View (ASCII), C4 L1 System Context (`C4Context`), C4 L2 Container (`C4Container`), and Detailed View (`graph TB`) — plus Data Flow sequence diagrams per documented flow. All Mermaid diagrams target **Mermaid v11.4.1** (Mermaid Chart VS Code extension). Each diagram adapts grouping, naming, and colors to the detected architecture type (META, BIAN, 3-Tier, N-Layer, Microservices).
- **Canonical locations**: All 4 standard diagrams reside in `docs/03-architecture-layers.md`; Data Flow diagrams in `docs/04-data-flow-patterns.md` — not configurable, no override
- **Source of truth**: Architecture docs are authoritative — diagrams for undocumented flows are discarded
- **Completeness audit**: Every documented flow is checked for a corresponding diagram after generation; all 4 standard diagrams verified present
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
    "Bash(mkdir *)",
    "Bash(date *)",
    "Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/*)",
    "Glob(**/skills/architecture-compliance/SKILL.md)",
    "Glob(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/*)",
    "Read(//tmp/*)",
    "Write(//tmp/*)",
    "Write(compliance-docs/*)",
    "Read(compliance-docs/*)",
    "Agent(solutions-architect-skills:compliance-generator)",
    "Agent(solutions-architect-skills:business-continuity-validator)",
    "Agent(solutions-architect-skills:cloud-validator)",
    "Agent(solutions-architect-skills:data-ai-validator)",
    "Agent(solutions-architect-skills:development-validator)",
    "Agent(solutions-architect-skills:enterprise-validator)",
    "Agent(solutions-architect-skills:integration-validator)",
    "Agent(solutions-architect-skills:platform-validator)",
    "Agent(solutions-architect-skills:process-validator)",
    "Agent(solutions-architect-skills:security-validator)",
    "Agent(solutions-architect-skills:sre-validator)",
    "WebSearch"
  ]
}
```

A pre-configured example is provided at `.claude/settings.json.example`. Users installing the plugin must copy or merge the `permissions.allow` block into their project's `.claude/settings.json`.

### Using the Architecture Component Guardian Skill

The `architecture-component-guardian` skill is the **only sanctioned way** to create or update `docs/components/README.md`. It enforces a fixed 5-column table schema on every write, with grouped system headers for multi-system architectures.

To manually activate the skill, use: `/skill architecture-component-guardian`

**When to use**:
- After adding, removing, or renaming a component file in `docs/components/`
- To sync the index after a migration that produces the `docs/components/` structure
- Any time `docs/components/README.md` needs to change (redirect direct-edit requests here)

**Output**: Generates `docs/components/README.md` with a managed-by comment, breadcrumb, and a 5-column table (`#`, `Component`, `File`, `Type`, `Technology`). Multi-system architectures use grouped tables with `### System Name` headers.

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
- **3 review depth levels**: Light (~40 sec, 22 checks, 3 parallel agents), Medium (~90 sec, 44 checks, 7 parallel agents), Hard (~2-3 min, 82 checks, 13 parallel agents)
- **13 review categories** with weighted scoring: Structural Completeness, Naming & Conventions, Section Completeness, Content Coherence, Technology Alignment, Integration Soundness, Metric Realism, Scalability Design, Security Posture, Performance Design, Operational Readiness, ADR Quality, Trade-off Honesty
- **Parallel category review** — each category is evaluated by a dedicated `peer-review-category-agent` sub-agent; all spawn in a single message for concurrent execution
- **Interactive HTML playground** via the `playground` plugin — approve/reject/comment workflow
- **Weighted 0–10 scorecard** per category and overall
- **Fix prompt generation** for approved findings to paste back into Claude
- **JSON result persistence** — review data saved to `architecture-peer-review-<date>.json` after each run; enables fast-path playground regeneration without re-running agents

**When to use**: After ARCHITECTURE.md passes form validation (use `architecture-docs` review first), when a peer review or architectural quality assessment is needed, before finalizing architecture for implementation, or to regenerate the review playground from saved results.

**Permissions required** (add to project `.claude/settings.json`):

```json
"Agent(solutions-architect-skills:peer-review-category-agent)"
```

### Using the Architecture Traceability Skill

The `architecture-traceability` skill compares PO Spec use cases against architecture documentation to detect coverage gaps. It generates a portable markdown report (`TRACEABILITY_REPORT.md`) designed for tickets, emails, and external platforms.

To manually activate the skill, use: `/skill architecture-traceability`

The skill includes:
- **Use case parsing** from PO Spec Section 4 — extracts requirements from primary flows, alternative flows, edge cases, preconditions, postconditions, and success metrics
- **Architecture coverage search** — maps each requirement to the relevant architecture section (S1-S12) and classifies as Covered, Partial, or Not Covered
- **Per-use-case coverage tables** with evidence citations (section + quote)
- **Summary statistics** — total/covered/partial/gaps with percentages, per-phase breakdown
- **Gap Report** — consolidated list of all Not Covered and Partial items with suggested architecture sections

**Output**: `TRACEABILITY_REPORT.md` at project root (overwritten on each run).

**When to use**: After both the PO Spec and ARCHITECTURE.md exist, when validating architecture coverage of business requirements, checking for deviations from the PO Spec, or preparing traceability evidence for stakeholders.

---

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

The `architecture-dev-handoff` skill generates per-component **Component Development Handoff** documents — scoped to **C4 Level 2 (Container) components only** — that give development teams everything needed to implement a component without reading the full ARCHITECTURE.md suite. C4 Level 1 (System) descriptors are excluded; they describe system boundaries, not implementable units.

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

### Using the Architecture Definition Record Skill

The `architecture-definition-record` skill is the **single owner of all ADR write operations**. It creates, updates, and manages Architecture Decision Records (ADRs) — immutable documents capturing the context, rationale, and consequences of significant architectural choices.

To manually activate the skill, use: `/skill architecture-definition-record`

The skill has five workflows:
1. **Generate from Section 12** — extract ADR table from ARCHITECTURE.md, create `adr/ADR-XXX-title.md` files
2. **Create individual ADR** — guided interview (problem, decision, alternatives, rationale) → writes complete ADR file
3. **Update ADR status** — change Proposed → Accepted / Deprecated / Rejected
4. **Supersede ADR** — create new ADR, mark old one as `Superseded by ADR-NNN`
5. **List/audit ADRs** — scan `adr/` directory, show status summary, flag gaps

**When to use**: When documenting architectural decisions, updating ADR status, or generating ADR files from a newly created ARCHITECTURE.md. All other skills read `adr/*.md` directly for context but must delegate any write operations here.

**ADR file convention**: `adr/ADR-NNN-brief-title.md` — zero-padded, lowercase, hyphen-separated. Template and guide are in `skills/architecture-definition-record/`.

**ADR Scope and numbering partition**: Every ADR carries a `**Scope**` metadata field (`Institutional` or `User`) and the number range encodes that scope:
- **ADR-001 … ADR-100** — reserved for **Institutional** ADRs (organization-wide Architecture Team decisions, e.g., mandatory mTLS, approved cloud regions, logging standards)
- **ADR-101+** — **User / Project** ADRs (decisions local to a single project, e.g., database choice, message broker, caching strategy)

When creating an ADR (Workflow 2), the skill asks for scope and computes the next available number in the appropriate range. The institutional range is hard-capped at 100 — overflow is blocked and requires superseding an existing institutional ADR or reclassifying the new decision as User scope.

---

### Using the Architecture Onboarding Skill

The `architecture-onboarding` skill is the **entry point for new team members**. It reads the project's existing architecture docs and generates a canvas-based interactive concept map via the `playground` plugin. The map is **centered on architecture sections** and traces back to **use cases from the PO Spec / system overview**, showing how business requirements flow through sections into components. Users drag nodes to explore, cycle knowledge levels (Know/Fuzzy/Unknown) per concept, and copy a targeted learning prompt shaped by their gaps.

To manually activate the skill, use: `/skill architecture-onboarding`

The skill includes:
- **Use case traceability** — extracts use cases from PO Spec Section 4 or `docs/01-system-overview.md` Section 2.3, traces them through architecture sections to components via handoff docs
- **Concept map playground** — draggable nodes, force-directed auto-layout, edge types (depends-on, traces-to, served-by, implements)
- **3 node groups** — Use Cases (pink), Architecture Sections (blue), Components (green)
- **3 preset views** — Use Case Traceability (default), Section Dependencies, Component Map
- **Ghost nodes** — missing sections shown semi-transparent with actionable guidance
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

---

### Using the Architecture IcePanel Sync Skill (Beta)

The `architecture-icepanel-sync` skill (beta) syncs architecture documentation to IcePanel for live C4 model visualization. It extracts C4 elements (systems, containers, connections) from Mermaid diagrams and component metadata, generates an IcePanel-compatible import YAML, and optionally pushes via the IcePanel REST API.

To manually activate the skill, use: `/skill architecture-icepanel-sync`

The skill has two modes:

| Mode | Requirement | Behavior |
|------|-------------|----------|
| **Online** | `ICEPANEL_API_KEY` + `ICEPANEL_LANDSCAPE_ID` set in env or `.env` | Checks existing objects, imports new, reports drift |
| **Offline** | No credentials needed | Generates import YAML for manual upload via IcePanel UI |

**Output location**: `icepanel-sync/` at project root.
- `c4-model.yaml` — IcePanel import file (LandscapeImportData schema)
- `sync-report.md` — validation results, model summary, sync status

**When to use**: After architecture documentation is complete (Phase 2+), when you want to visualize the C4 model in IcePanel, or to check if IcePanel is in sync with documentation.

**Permissions required** (add to project `.claude/settings.json`):

```json
"Write(icepanel-sync/*)",
"Read(icepanel-sync/*)",
"Bash(curl *)"
```

**Note**: Import adds model objects and connections to IcePanel. Diagrams (layout views) are NOT auto-created — create C4 L1 and L2 diagram views manually in IcePanel after import.

---

### Optional MCP Integration: context7

The `architecture-dev-handoff` and `architecture-docs` skills optionally use the context7 MCP tool when available. context7 provides two functions:
- `resolve-library-id` — finds the context7 library ID for a given framework or tool name
- `get-library-docs` — fetches up-to-date documentation for a resolved library, scoped to a topic

**How it is used**:

| Skill | When | What |
|-------|------|------|
| `architecture-dev-handoff` | During asset generation (Step 3.3b) | Fetches current spec docs (OpenAPI, AsyncAPI, Kubernetes, Protobuf, Avro, database DDL, Redis) to validate that generated scaffolds use correct, current syntax |
| `architecture-docs` | During new component doc creation (Workflow 1, Section 5) | Fetches framework documentation for technologies listed in the `**Technology**` field and presents an advisory Technology Context Brief to the architect |

**Key constraint**: context7 informs **syntax and structure only** — never content or data values. The Asset Fidelity Rule and "no invention" policy remain absolute. All data values come from architecture docs.

**Configuration**: To enable this integration, configure context7 as an MCP server in Claude Code settings. If context7 is not configured, both skills degrade gracefully and generate documents using their built-in templates with no errors or warnings.

**No hard dependency**: context7 is purely optional. Every skill workflow completes successfully without it.

