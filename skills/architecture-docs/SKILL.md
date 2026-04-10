---
name: architecture-docs
description: Use this skill when creating, updating, or maintaining ARCHITECTURE.md files, when users ask about "my architecture documentation" or "architecture", when generating diagrams from architecture documentation, when validating/checking/auditing architecture (including BIAN alignment, META layers, standards compliance), or when answering questions about documented components, data structures, integrations, security, performance, deployment, technology stack, or architectural decisions
triggers:
  - architecture documentation
  - create architecture
  - ARCHITECTURE.md
---

# Architecture Documentation Skill

This skill provides comprehensive guidelines for creating and maintaining ARCHITECTURE.md files using the standardized template from ARCHITECTURE_DOCUMENTATION_GUIDE.md. It enforces consistency across all documentation sections through the **Foundational Context Anchor Protocol** — a dependency-aware editing workflow that loads required upstream context before any downstream section edit, requires source attribution for derived claims, and detects downstream impact when any section changes.

### CRITICAL: Section Number vs File Prefix Disambiguation

Internal section numbers (S1-S12) and file prefix numbers (01-10) are **independent** and do NOT align.

| Internal Section | Name | File |
|---|---|---|
| S1+S2 | Executive Summary + System Overview | `docs/01-system-overview.md` |
| S3 | Architecture Principles | `docs/02-architecture-principles.md` |
| S4 | Architecture Layers | `docs/03-architecture-layers.md` |
| S5 | Component Details | `docs/components/` |
| S6 | Data Flow Patterns | `docs/04-data-flow-patterns.md` |
| S7 | Integration Points | `docs/05-integration-points.md` |
| S8 | Technology Stack | `docs/06-technology-stack.md` |
| S9 | Security Architecture | `docs/07-security-architecture.md` |
| S10 | Scalability & Performance | `docs/08-scalability-and-performance.md` |
| S11 | Operational Considerations | `docs/09-operational-considerations.md` |
| S12 | ADRs | `adr/` directory |

**Rules:**
- When a user says "update Section 9" → resolve to **S9** = `docs/07-security-architecture.md`, NOT `docs/09-*`
- `docs/09-operational-considerations.md` = **S11**, not Section 9
- Always use S-prefix (S1-S12) to identify sections, file paths to identify files
- NEVER assume file prefix `NN` equals section number `N`

## When This Skill is Invoked

Automatically activate when:
- User asks to create architecture documentation
- User asks to update or edit ARCHITECTURE.md
- User mentions documenting system architecture
- User requests architecture review, audit, or analysis (triggers Design Drivers calculation prompt)
- User explicitly asks to "calculate design drivers" or "update design drivers"
- User asks about architecture documentation structure or best practices
- User edits Section 1 Executive Summary Key Metrics (triggers metric consistency check)
- User edits any downstream section (S4–S11) → triggers Context Anchor load
- User requests metric consistency check, verify metrics, or audit metrics
- **User asks informational questions about the documented architecture** (if ARCHITECTURE.md exists)
  - "What is our [authentication/scaling/data flow/etc.] approach?"
  - "How does [component/system/integration] work?"
  - "What technologies do we use for [purpose]?"
  - "Tell me about the architecture of [system]"
- **User asks to generate, create, add, or update diagrams in architecture documentation** (triggers Workflow 8)
  - "Generate my architecture diagrams"
  - "Create Mermaid diagrams from ARCHITECTURE.md"
  - "Add diagrams to my architecture"
  - "Update my architecture diagrams"
  - "Refresh / regenerate diagrams to reflect recent changes"

### Query Pattern Triggers

This skill automatically activates when users ask questions about documented architecture, including:

**Reference Patterns**:
- "According to my architecture documentation..."
- "Based on the architecture..."
- "What does the architecture use/require/implement for..."
- "My architecture documentation shows/says..."
- "The architecture specifies/defines..."
- "Check/Validate/Verify the architecture [aspect]..."
- "Audit the [architecture component/pattern]..."

**Technical Query Keywords**:
- **Components**: "components", "services", "modules", "microservices", "systems"
- **Data**: "data structures", "data flow", "database", "schema", "models", "entities"
- **Integration**: "APIs", "integrations", "external systems", "endpoints", "interfaces"
- **Security**: "authentication", "authorization", "encryption", "security", "compliance"
- **Performance**: "scaling", "performance", "SLA", "capacity", "throughput", "latency"
- **Deployment**: "deployment", "cloud provider", "infrastructure", "environments", "regions"
- **Technology**: "tech stack", "languages", "frameworks", "tools", "libraries", "versions"
- **Decisions**: "why choose", "decision", "trade-offs", "alternatives", "ADR", "rationale"
- **Validation**: "check", "validate", "verify", "audit", "alignment", "BIAN", "META", "service domain", "layer", "standards", "compliance check"

**Multi-section Queries**:
- Questions requiring synthesis across multiple sections
- Cross-cutting concerns (e.g., "How does authentication work with external systems?")
- Implementation details spanning components, data, and deployment

**Do NOT activate for** (redirect to the correct skill):
- Requirements deviation checks, requirements traceability, or PO Spec coverage analysis → use `architecture-traceability` skill
- Component migration to C4, component index sync, add/remove/update components → use `architecture-component-guardian` skill
- Peer review or architecture quality assessment → use `architecture-peer-review` skill
- Compliance contract generation → use `architecture-compliance` skill

**Component Operations Delegation Rule**:
All structural operations on `docs/components/` MUST delegate to `architecture-component-guardian`:
- Creating, renaming, or deleting component files → delegate to guardian
- Creating or updating `docs/components/README.md` → delegate to guardian (`sync` action)
- Migrating flat components to C4 multi-system structure → delegate to guardian (`migrate` action)
- Adding C4 metadata (Type, C4 Level, system folders) → delegate to guardian
This skill may **read** component files for context (editing sections, propagation checks) but must NOT directly create, restructure, or modify the component index.

---

## 🎯 AUTOMATIC WORKFLOW DETECTION

**IMPORTANT**: Immediately upon skill invocation, analyze the user's request to detect their intent.

### Detection Logic

Check the user's original message (before `/architecture-docs` was invoked) for these patterns:

#### Workflow 8: Diagram Generation
**Triggers:**
- Keywords: "generate", "create", "add", "update", "make" + "diagram", "diagrams", "Mermaid diagram", "architecture diagram"
- Examples: "generate my architecture diagrams", "create diagrams from ARCHITECTURE.md", "add diagrams to my architecture"
- Section-specific: "generate diagrams for Section 4", "create data flow diagrams"
- Format mentions: "Mermaid diagrams", "visual diagrams", "architecture diagrams"
- Reconciliation: "reconcile diagrams", "move diagrams", "consolidate diagrams"
- Audit/coverage: "check diagram coverage", "audit diagrams", "diagram completeness", "diagram audit"
- Placement: "diagrams in wrong location", "fix diagram placement", "diagram location"
- External intake: user provides external file path and mentions diagrams

**Action when detected:**
1. Confirm: "I'll help you generate architecture diagrams."
2. Jump directly to **Workflow 8, Step 1** (Diagram Type Selection)
3. Do NOT ask which workflow - proceed automatically

#### Workflow 9: Migrate to docs/ Structure
**Triggers:**
- Keywords: "migrate", "restructure", "split", "reorganize", "convert" + "architecture", "ARCHITECTURE.md"
- Size complaints: "too large", "too long", "hard to navigate", "split into files"
- Explicit: "migrate my architecture to the new structure", "convert to docs/ layout"

**Action when detected:**
1. Confirm: "I'll help you migrate ARCHITECTURE.md to the multi-file docs/ structure."
2. Jump directly to **Workflow 9, Step 1**
3. Do NOT ask which workflow - proceed automatically

#### Other Workflows
If the user's request matches other documented workflows (1-9), follow their respective trigger patterns.

**Note**: Workflow 1 (new ARCHITECTURE.md creation) starts at Step 0 (PO Spec prerequisite check), then Step 0.5 (ADR pre-identification) establishes the **ADR Context Block** — a list of ADR candidates derived from PO Spec analysis that is maintained through all creation steps for decision consistency. See ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md for the full flow.

### If No Pattern Matches

If the user's request doesn't match any workflow triggers:
1. Acknowledge the skill invocation
2. Ask which workflow they want to use
3. Provide brief description of available workflows

---

## File Naming Convention

**IMPORTANT**: All architecture documentation uses the multi-file `docs/` structure.

- **`ARCHITECTURE.md`** at the project root is the **navigation index only** (~130 lines)
- All section content lives under **`docs/`** as numbered Markdown files
- Component details (Section 5) live under **`docs/components/`** — one file per component

**File naming pattern**: `NN-kebab-case-name.md` — lowercase, hyphens only, no spaces, no uppercase, no underscores.
- Section files: `docs/01-system-overview.md`, `docs/06-technology-stack.md`
- Component files: `docs/components/01-api-gateway.md`, `docs/components/02-payment-service.md`

See **RESTRUCTURING_GUIDE.md** for the full directory structure and naming conventions.

### Location
- `ARCHITECTURE.md` — always at the **project root**
- `docs/` — always at the **project root** (sibling to `ARCHITECTURE.md`)
- `docs/components/` — inside `docs/`
- For multi-project repositories, each project subdirectory gets its own `ARCHITECTURE.md` + `docs/`

---

## Working with Architecture Documentation — Context Optimization

**IMPORTANT**: The multi-file structure makes context loading simple — individual `docs/` files are 50–400 lines each (full file fits in context). No line-offset tricks needed.

### Context-Efficient Workflow

1. **Find the target section**
   - Read `ARCHITECTURE.md` navigation table to identify which `docs/NN-name.md` file contains the target section
   - Example: "Edit security architecture" → navigate to `docs/07-security-architecture.md`

2. **Load Context Anchor** *(REQUIRED for downstream sections)*
   - **Section 3 Enforcement Gate**: Any write to `docs/02-architecture-principles.md` — whether creation, migration, or edit — MUST pass the Section 3 validation checklist from VALIDATIONS.md (9 principles present in exact order, three subsections each: Description/Implementation/Trade-offs, system-specific content, no custom principles). Run the checklist before finalizing the write.
   - **SKIP** this step when editing `docs/01-system-overview.md`, `docs/02-architecture-principles.md`, or for typo/formatting-only fixes
   - **REQUIRED** when editing any file from `docs/03-architecture-layers.md` through `docs/09-operational-considerations.md`, or any `docs/components/*.md` file
   - **Universal Foundation**: Always load `docs/01-system-overview.md` + `docs/02-architecture-principles.md`
   - **Relevant ADRs**: Match ADR titles from `ARCHITECTURE.md` navigation table against target section keywords; load matched ADRs
   - **Section-Specific Parents**: Load parent sections per the Foundational Context Anchor Protocol dependency table (see below)
   - Example for S9 (Security): load S1+2 (foundation) + S5/README (components) + S7 (integrations) + S8 (tech stack) + relevant ADRs
   - Context budget: 250–850 lines depending on section tier

3. **Read the entire target file**
   - Individual `docs/` files are small enough to read in full
   - `Read(file_path="docs/07-security-architecture.md")`  — no offset/limit needed

4. **Edit the target file directly**
   - Use the Edit tool on the specific `docs/NN-name.md` file
   - **Do NOT edit ARCHITECTURE.md** unless you are adding a new section/file to the navigation table
   - **Source Attribution** *(during editing)*: When writing derived content in downstream sections, insert cross-reference links to the source:
     - **Metrics**: When repeating a metric from S1 Key Metrics → `(see [Key Metrics](01-system-overview.md#key-metrics))`
     - **ADR decisions**: When content implements an ADR → `per [ADR-NNN](../adr/ADR-NNN-title.md)`
     - **Principles**: When invoking an S3 principle → `per [Principle Name](02-architecture-principles.md#anchor)`
     - **Parent section references**: When referencing components, layers, integrations, or tech → link to the specific file
     - **Unverifiable claims**: If a specific claim (metric, decision, constraint) cannot be traced to an existing section, user input, or ADR → insert `<!-- TODO: Add source reference -->` marker

5. **Post-Write Alignment & Traceability Audit**
   - **Check A — Principle traceability**: Written content does not contradict Section 3 principles
   - **Check B — Metric consistency**: Numeric values match Section 1 Key Metrics
   - **Check C — ADR alignment**: Content does not contradict loaded ADR decisions
   - **Check D — Parent section alignment**: Content references valid components (S5), integrations (S7), tech (S8) as loaded
   - **Check E — Source citation audit**: Scan the written content for:
     - Numeric values (TPS, latency, SLO, %) → must link to S1 Key Metrics or be marked as section-local
     - Technology names matching S8 → should link to tech stack or governing ADR
     - Architecture pattern references → should link to S3 or S4
     - `<!-- TODO: Add source reference -->` markers → count and report
   - **Silent pass** if no issues found; display alignment report **only when misalignment or missing citations are detected**

5.5. **Downstream Documentation Propagation**

Runs immediately after the Post-Write Alignment Audit passes. Detects downstream files whose content may be stale due to the edit and offers to update them.

#### Trigger Gate

**Run when**: The edit changed substantive content — metrics, technology names, component names, architectural patterns, constraints, requirements, or interface definitions.

**Skip silently when**: The edit was cosmetic — typo fixes, formatting, grammar, markdown structure, comment updates, `<!-- TODO -->` markers, source attribution links, or Document Index line numbers. Heuristic: if the diff contains only whitespace/punctuation/link/formatting changes with no word-level changes to technical terms, skip entirely.

**Anti-recursion rule**: Propagation updates (Phase 3 edits) do NOT re-trigger Step 5.5.

#### Reverse Dependency Table

| Edited Section | File | Downstream Section Files |
|---|---|---|
| S1+S2 (System Overview) | `docs/01-system-overview.md` | ALL sections (S4–S11) + `docs/components/*` |
| S3 (Principles) | `docs/02-architecture-principles.md` | ALL sections (S4–S11) + `docs/components/*` |
| S4 (Layers) | `docs/03-architecture-layers.md` | S5 (`docs/components/*`), S8 (`docs/06-technology-stack.md`) |
| S5 (Components) | `docs/components/*.md` | S6 (`docs/04-data-flow-patterns.md`), S7 (`docs/05-integration-points.md`), S8 (`docs/06-technology-stack.md`), S9 (`docs/07-security-architecture.md`), S10 (`docs/08-scalability-and-performance.md`), S11 (`docs/09-operational-considerations.md`), Refs (`docs/10-references.md`) |
| S6 (Data Flow) | `docs/04-data-flow-patterns.md` | *(leaf — no downstream sections)* |
| S7 (Integration) | `docs/05-integration-points.md` | S9 (`docs/07-security-architecture.md`) |
| S8 (Tech Stack) | `docs/06-technology-stack.md` | S9 (`docs/07-security-architecture.md`), S10 (`docs/08-scalability-and-performance.md`), S11 (`docs/09-operational-considerations.md`), Refs (`docs/10-references.md`) |
| S9 (Security) | `docs/07-security-architecture.md` | *(leaf)* |
| S10 (Scalability) | `docs/08-scalability-and-performance.md` | S11 (`docs/09-operational-considerations.md`) |
| S11 (Operations) | `docs/09-operational-considerations.md` | *(leaf)* |
| S12 (ADRs) | `ARCHITECTURE.md` (navigation table) | `adr/` directory → delegate to `/skill architecture-definition-record`, Refs (`docs/10-references.md`) |

**Cross-cutting** (always scanned regardless of table): `docs/components/`, `docs/handoffs/`, `docs/10-references.md`

##### References file (`docs/10-references.md`) propagation

`docs/10-references.md` is a cross-cutting file that aggregates links from multiple sections. It MUST be included in the downstream scan when **any** of these change:

| Change Type | What to update in `10-references.md` |
|---|---|
| ADR added, removed, renamed, or status changed (`adr/*.md`) | ADR index table — add/remove/rename row, update status |
| New technology in S5 components or S8 tech stack | Technology documentation links — add official doc URL |
| Technology removed or replaced | Technology documentation links — remove or replace entry |
| New glossary-worthy term introduced in any section | Glossary — add definition |

When `10-references.md` is flagged for update during Phase 2 (Generate Checklist), present specific sub-items showing which table(s) need updating (ADR index, technology links, glossary).

#### S12 ADR Table Propagation (Special Rule)

When the edited file is `ARCHITECTURE.md` **and** the edit added or modified rows in the Section 12 ADR table:

1. **Detect new ADR rows**: Compare the ADR table before and after the edit. Extract any new rows matching `| [ADR-NNN](...) | ... |`
2. **Check for existing files**: For each new ADR row, check if `adr/ADR-NNN-slug.md` already exists
3. **Delegate creation**: For ADR rows where the file does NOT exist, invoke `/skill architecture-definition-record` with context:
   - Trigger reason: "Section 12 ADR table updated — generate ADR files for new entries"
   - Pass the ADR metadata (number, title, status, date, impact) from the table row
   - The architecture-definition-record skill runs Workflow 1 Steps 1.3–1.5 (extract → load template → generate)
4. **Skip if file exists**: If the ADR file already exists, do not overwrite — report: `adr/ADR-NNN-slug.md already exists — skipped`

After ADR file creation (or skip), **always update `docs/10-references.md`**:
- Add new ADRs to the ADR index table
- Update ADR titles or status if changed
- Remove entries for deleted ADRs

This rule runs **instead of** the standard Phase 1–3 propagation for S12 changes. ADR table changes do not trigger downstream section updates — they trigger ADR file creation and references update.

#### Phase 1: Impact Discovery

**1a. Fact-delta extraction** — Compare the file content before and after the edit. Produce a concrete bullet list of what changed (e.g., "Database: PostgreSQL → CockroachDB", "Added: Redis caching layer", "Removed: legacy SOAP endpoint"). If zero substantive deltas → skip propagation entirely.

**1b. Structural dependency scan** — Look up the edited section in the reverse dependency table above. Collect all downstream section files.

**1c. Cross-reference scan** — Grep across `docs/`, `docs/components/`, `docs/handoffs/` for explicit references to the edited filename (links, section anchors, `(see [...](...))`).

```bash
grep -rl "{edited_filename}" docs/ docs/components/ docs/handoffs/ 2>/dev/null
```

**1d. Handoff scan** — For each fact-delta keyword (component names, technology names, pattern names), grep `docs/handoffs/` for matching terms.

**1e. Merge and deduplicate** — Combine results from 1b+1c+1d. Remove duplicates and remove the edited file itself.

#### Phase 2: Generate Checklist

Present a structured checklist grouped by file type:

```
═══════════════════════════════════════════════════════════
DOWNSTREAM UPDATES REQUIRED — {edited_file} ({section_name})
═══════════════════════════════════════════════════════════

Changes detected:
- {bullet list from Phase 1a}

─── Downstream Sections ──────────────────────────────────
[ ] 1. docs/07-security-architecture.md — references {changed_tech}; security controls may need updating
[ ] 2. docs/09-operational-considerations.md — mentions {old_value}; align with new value

─── Component Files ──────────────────────────────────────
[ ] 3. docs/components/03-payment-service.md — uses {changed_component}; integration details may be stale

─── Handoff Docs ─────────────────────────────────────────
[ ] 4. docs/handoffs/03-payment-service-handoff.md — Section 4 references {old_tech}

─── No Updates Required ──────────────────────────────────
ℹ️  docs/04-data-flow-patterns.md — no references to changed content
═══════════════════════════════════════════════════════════
Approve all? ('all', comma-separated numbers to deselect, or 'skip')
```

Wait for user response before proceeding.

#### Phase 3: Execute Updates

Process approved files **in tier order** (lower tiers first → higher tiers last) so each updated file is available as context for files that depend on it.

For each approved `docs/*.md` or `docs/components/*.md` file:
1. Load Context Anchor (universal foundation + section-specific parents per the dependency table)
2. Read the target file in full
3. Identify passages affected by the fact-deltas
4. Apply updates, maintaining Source Attribution links (`per [Section X](../...)`)
5. Run the 5-check Post-Write Alignment Audit on the updated file
6. Mark as `[x]`

For approved `docs/handoffs/*.md` files: Read, locate affected passages, update following the dev-handoff Documentation Fidelity Policy. Mark as `[x]`.

If user selected `skip`: Add `<!-- PROPAGATION PENDING: upstream {edited_file} changed ({date}) — downstream not yet updated -->` comment at the top of the edited file.

#### Component File Edit Handling

When the edited file is `docs/components/*.md` (not a section file):
- Cascade through S5's row in the table (S6, S7, S8, S9, S10, S11)
- Additionally grep for the **component name** (not just filename) across all `docs/` files
- Always include the matching `docs/handoffs/{component}-handoff.md` if it exists
- If `docs/components/README.md` needs updating, delegate to the `architecture-component-guardian` skill

#### Phase 4: Propagation Report

```
═══════════════════════════════════════════════════════════
DOWNSTREAM PROPAGATION — COMPLETION REPORT
═══════════════════════════════════════════════════════════

Source: {edited_file} ({section_name})
Changes: {summary from Phase 1a}

Completed:
[x] docs/07-security-architecture.md — {what was updated}
[x] docs/components/03-payment-service.md — {what was updated}

Verified (no change needed):
✓  docs/08-scalability-and-performance.md — content still accurate

Deselected (manual update required):
[ ] docs/09-operational-considerations.md — user chose manual update

Failed (require manual review):
⚠️  {any files where edit could not be applied cleanly}
═══════════════════════════════════════════════════════════
```

#### Phase 5: Asset Regeneration Advisory

**Runs after**: Phase 4 report is displayed.
**Also runs when**: User selected `skip` in Phase 2 and handoff files exist in `docs/handoffs/` — in this case, note that handoff text was also not updated.

**Skip silently when**: No `docs/handoffs/*.md` files appeared in the Phase 3 update list (completed, deselected, or failed) AND propagation was not skipped.

**Step 5a — Detect asset-impacting changes**: Scan the fact-deltas from Phase 1a for asset-impact keywords (case-insensitive):

| Keywords | Potentially Stale Asset |
|----------|------------------------|
| API, endpoint, REST, GraphQL, gRPC, route, path, method, request, response, header, status code | `openapi.yaml` |
| database, table, column, schema, index, constraint, migration, DDL, SQL | `ddl.sql` |
| Redis, cache, key, TTL, expiration, eviction | `redis-key-schema.md` |
| deployment, container, pod, replica, port, resource, limit, CPU, memory, image, Kubernetes, K8s | `deployment.yaml` |
| message, event, topic, queue, consumer, producer, Kafka, RabbitMQ, stream | `asyncapi.yaml` |
| Avro, schema registry | `schema.avsc` |
| Protobuf, proto | `schema.proto` |
| cron, schedule, batch, job, CronJob | `cronjob.yaml` |

If no keywords match → skip this phase silently.

**Step 5b — Identify affected components**: For each `docs/handoffs/*-handoff.md` file that was touched in Phase 3 (or would have been if propagation was skipped/deselected), check whether `docs/handoffs/assets/NN-<component-name>/` exists and contains any of the matched asset types. Exclude components with no asset directory or no matching asset files on disk.

If zero components remain after filtering → skip silently.

**Step 5c — Present advisory**:

```
───────────────────────────────────────────────────────────
ASSET REGENERATION ADVISORY
───────────────────────────────────────────────────────────

The propagation above updated handoff document text, but
the following scaffolded assets may now be stale:

  Component: {component-name}
    → openapi.yaml  (changes mention: endpoint, API)
    → ddl.sql       (changes mention: table, column)

  Component: {component-name-2}
    → deployment.yaml  (changes mention: container, port)

These assets were generated by the dev-handoff skill and
contain structured specs derived from architecture docs.
In-place text patches do not regenerate them.

Would you like to regenerate handoff documents and assets
for the affected components?

  [Yes] → I will provide the commands to run
  [No]  → No action needed right now

Note: You can regenerate all handoffs at any time with:
  /skill architecture-dev-handoff
───────────────────────────────────────────────────────────
```

If propagation was **skipped**: prepend to the advisory:
> `Note: Propagation was skipped — handoff document text was also not updated. Full regeneration is recommended.`

**Wait for user response.**

- **Yes** → Display one line per affected component: `Run: /skill architecture-dev-handoff` (for each affected component by name). Do NOT invoke the skill automatically.
- **No** → Acknowledge and proceed with no further action.

---

6. **Verification**
   - After edits, re-read the modified `docs/` file to verify changes
   - Use Grep to search for specific content without loading multiple files

### Discovering Available Files

When the target section is not obvious, read `ARCHITECTURE.md` first:

```python
# Step 1: Read navigation table
nav_content = Read(file_path="ARCHITECTURE.md")

# Step 2: Parse the Documentation table to find the target file
# Example row: | 8 | Security Architecture | [docs/07-security-architecture.md](docs/07-security-architecture.md) | ... |

# Step 3: Read that specific docs/ file in full
target_content = Read(file_path="docs/07-security-architecture.md")
```

### Technology Context Enrichment (context7) — Component Documentation

When creating NEW component documentation (Workflow 1, Section 5), and the component's **Technology** field references specific frameworks, libraries, or tools, use the context7 MCP tool to fetch current documentation for those technologies.

**Prerequisite**: The context7 MCP tool must be available (`resolve-library-id` and `get-library-docs` functions). If not available, skip silently — component doc generation proceeds normally.

**When to use**:
- During Workflow 1 (new ARCHITECTURE.md creation) when populating Section 5 component files
- When a user explicitly asks to "enrich" or "validate" technology references in an existing component doc
- NOT during routine section edits, NOT during compliance generation, NOT during handoff generation

**Procedure**:
1. Extract technology names from the component's Technology field (e.g., "Java 17, Spring Boot 3.1.5, PostgreSQL 15").
2. For each distinct technology, call `resolve-library-id` (e.g., `spring-boot`, `postgresql`, `nestjs`).
3. For each resolved library, call `get-library-docs` with a topic hint scoped to configuration patterns and version features for the documented version (e.g., "Spring Boot 3.1 actuator endpoints and configuration properties").
4. Present a **Technology Context Brief** to the user as an advisory checklist — do NOT auto-fill any document fields:

   ```
   Technology Context Brief — [Component Name]

   Spring Boot 3.1.5:
   - Key config patterns: application.yml (spring.datasource.*, management.endpoints.*)
   - Health check endpoints: /actuator/health (liveness), /actuator/health/readiness
   - Suggested fields to document: connection pool settings, JPA dialect, security filter chain

   PostgreSQL 15:
   - Notable in v15: MERGE statement, improved JSON path, pg_walinspect
   - Suggested fields to document: connection pool strategy (PgBouncer?), vacuum/autovacuum, extensions used
   ```

5. The architect decides which items to include in the component doc. The skill does NOT auto-populate any fields from this brief.

**What this is NOT**:
- Not a replacement for the architect's knowledge or documentation decisions
- Not auto-filled content (the "no invention" policy still applies)
- Not blocking — generation proceeds with or without it

### Updating the Navigation Index

Update `ARCHITECTURE.md` only when:
- A new section file is added to `docs/`
- A new component file is added to `docs/components/`
- A file is renamed or removed

**Do NOT update ARCHITECTURE.md** for content edits within existing `docs/` files.

---

## Architecture Type Selection Workflow

Full workflow for guiding users through architecture type selection (Banking/BIAN, Microservices, Monolith, etc.), the PO Spec prerequisite check, template loading, and diagram generation is in `ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md`.

Read it when:
- User is creating a NEW architecture document
- User asks to change architecture type
- No existing ARCHITECTURE.md is detected

The workflow runs Steps 0–7 (PO Spec gate → type selection → template load → metadata → multi-file creation → ADR delegation → diagrams).

**ADR operations**: Any ADR creation, update, or supersede must delegate to `/skill architecture-definition-record`. This skill reads `adr/*.md` for context only.

### When to Trigger

**Activate this workflow when:**
- ✅ User asks to create a NEW ARCHITECTURE.md document
- ✅ User explicitly requests to "change architecture type" or "select architecture type"
- ✅ User is updating an existing ARCHITECTURE.md and mentions changing from one architecture type to another

**Prerequisite**: Step 0 (PO Spec check) runs before Step 1 for all new document creation triggers

**Skip this workflow when:**
- ❌ Editing an existing ARCHITECTURE.md (type already selected)
- ❌ User is only updating specific sections unrelated to architecture type
- ❌ Document type is already clear from context

See `ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md` for full workflow details.

---

## Automatic Index Updates

**CRITICAL**: After ANY edit that significantly changes section line numbers (>10 lines), automatically update the Document Index.

### When to Update

**Update if:**
- ✅ Added/removed content shifting section boundaries (>10 lines)
- ✅ Modified section headers or structure
- ✅ User requests: "update the index"

**Skip if:**
- ❌ Minor edits (<10 lines)
- ❌ Only metadata changes
- ❌ Typo fixes

### Workflow Overview

**Quick Steps:**
1. **Detect**: Run `grep -n "^## [0-9]" ARCHITECTURE.md` to find section boundaries
2. **Calculate**: Parse output to determine line ranges (Section_Start to Next_Section_Start - 1)
3. **Update**: Edit Document Index (typically lines 5-21) with new ranges
4. **Timestamp**: Update "Index Last Updated" to current date
5. **Report**: Inform user which sections changed

**Example:**
```bash
# After adding content to Section 8, it grew from 906-980 to 912-996
grep -n "^## [0-9]" ARCHITECTURE.md
# Parse: Section 8 now at line 912, Section 9 at 998
# Calculate: Section 8 = 912-997, Section 9 = 998-1243
# Update index and report to user
```

### Detailed Algorithm

For complete line range calculation algorithm, step-by-step examples, verification checklist, and edge cases:
→ **METRIC_CALCULATIONS.md** § Automatic Index Updates

### Best Practices

**DO:**
- ✅ Update after significant edits
- ✅ Use grep for accuracy (don't guess)
- ✅ Update timestamp
- ✅ Report changes to user

**DON'T:**
- ❌ Update for tiny changes
- ❌ Skip timestamp update
- ❌ Change index format

---

## Metric Consistency Detection & Management

Full workflow and reference details are in `METRIC_CALCULATIONS.md` (Read it when this workflow is needed).

**Quick summary**: Automatically detects and reviews metric inconsistencies when Section 1 Key Metrics are updated, scanning the entire document for stale duplicates and presenting a structured audit report before applying changes.

**When to invoke**: After editing Section 1 Executive Summary Key Metrics, or when user requests "check metric consistency", "verify metrics", or "audit metrics".

---

## Foundational Context Anchor Protocol

Full workflow and reference details are in `ARCHITECTURE_DOCUMENTATION_GUIDE.md` (Read it when this workflow is needed).

**Quick summary**: Dependency-aware editing workflow that loads required upstream context (S1+S2, S3, ADRs, and section-specific parents) before any downstream section edit, requires source attribution for derived claims, and detects downstream impact when any section changes (executed via Step 5.5 Downstream Documentation Propagation).

**When to invoke**: Before editing any docs/ file from `docs/03-architecture-layers.md` through `docs/09-operational-considerations.md`, or any `docs/components/*.md` file.

---

## Design Drivers Impact Metrics Calculation

Full workflow and reference details are in `DESIGN_DRIVER_CALCULATIONS.md` (Read it when this workflow is needed).

**Quick summary**: Automatically calculates and maintains Design Drivers impact metrics (Value Delivery, Scale, Impacts) from Sections 1, 2.3, 5, and 8, using a 6-phase workflow to extract data, present findings, and update Section 2.2.1.

**When to invoke**: When user requests "architecture review", "calculate design drivers", "update design drivers", or "assess design impact".

---

## Architecture Reference Docs (C4 Model + Type-Specific Rules)

The `references/` directory contains the architecture rules and C4 translation guides for each architecture type. These are loaded during Step 3 of the Architecture Type Selection Workflow.

| File | Purpose |
|------|---------|
| `references/ICEPANEL-C4-MODEL.md` | **Governing C4 reference** — defines C4 abstractions, diagram levels, boundary test. Constrains component documentation behavior. |
| `references/MICROSERVICES-ARCHITECTURE.md` | Microservices architecture rules and patterns |
| `references/MICROSERVICES-TO-C4-TRANSLATION.md` | Microservices → C4 mapping (services=containers, not systems) |
| `references/3-TIER-ARCHITECTURE.md` | 3-Tier architecture rules (Presentation, Logic, Data) |
| `references/3-TIER-TO-C4-TRANSLATION.md` | 3-Tier → C4 mapping (tier≠container distinction) |
| `references/N-LAYER-ARCHITECTURE.md` | N-Layer variants (DDD, Clean, Hexagonal, 5-Layer Extended) |
| `references/N-LAYER-TO-C4-TRANSLATION.md` | N-Layer → C4 mapping (inner layers=C3, infra=C2) |
| `references/META-ARCHITECTURE.md` | META 6-layer banking architecture rules |
| `references/META-TO-C4-TRANSLATION.md` | META → C4 mapping (layers as visual groupings at C2) |
| `references/BIAN-ARCHITECTURE.md` | BIAN V12.0 5-layer architecture rules |
| `references/BIAN-TO-C4-TRANSLATION.md` | BIAN → C4 mapping (Service Domains as containers) |
| `references/DIAGRAM-GENERATION-GUIDE.md` | **Diagram generation reference** — defines 4 standard architecture diagrams with type-specific templates for META, BIAN, 3-Tier, N-Layer, and Microservices. Includes C4 color conventions, Mermaid compatibility rules, and generation workflow. |

**Critical rule**: Every architecture type MUST have both reference docs. Types without them are greyed out in the selection menu and cannot be used.

---

## Documentation Structure

Full workflow and reference details are in `QUERY_SECTION_MAPPING.md` (Read it when this workflow is needed).

**Quick summary**: Covers when and how to use ARCHITECTURE_DOCUMENTATION_GUIDE.md for creating, documenting, and maintaining architecture docs, the 9 required Architecture Principles, the 12 required section names with exact format, and the Workflow 7 Informational Query workflow for answering questions from architecture documentation.

**When to invoke**: When creating new architecture documents, documenting existing projects, maintaining architecture docs, or answering user questions about documented architecture content.

---

## Workflow 8: Diagram Generation (Generate Architecture Diagrams)

**Two reference files** (read both when this workflow is needed):
- `references/DIAGRAM-GENERATION-GUIDE.md` — **Primary generation reference**: defines the 4 standard diagrams (Logical View ASCII, C4 L1 Context, C4 L2 Container, Detailed View Mermaid), architecture-type-specific templates for all 5 types (META, BIAN, 3-Tier, N-Layer, Microservices), data sources, C4 color conventions, Mermaid compatibility rules, and the generation workflow algorithm.
- `MERMAID_DIAGRAMS_GUIDE.md` — **Authoring reference**: Mermaid syntax patterns, component guidelines, data flow conventions, standard color scheme, common scenarios, and best practices.

**Quick summary**: Generate all 4 standard diagrams in order (ASCII logical → C4 L1 → C4 L2 → Detailed) under `## Architecture Diagrams` in `docs/03-architecture-layers.md`. Each diagram adapts its grouping, naming, and color conventions to the detected architecture type **and theme preference** (light/dark). Theme is detected from `<!-- DIAGRAM_THEME: light|dark -->` in `docs/03-architecture-layers.md` — if absent, ask the user once and persist. Dark theme applies `%%{init: {'theme': 'dark'}}%%` to C4/sequence diagrams and uses the dark `classDef` palette for the Detailed View. Data Flow sequence diagrams are generated separately in `docs/04-data-flow-patterns.md`. External diagram reconciliation, canonical location enforcement, and completeness audit rules apply.

**When to invoke**: When user requests "generate diagrams", "create diagrams", "add diagrams", "update diagrams", or references Mermaid/architecture/visual diagrams.

---

## Workflow 9: Migrate Existing ARCHITECTURE.md to docs/ Structure

Full workflow and reference details are in `RESTRUCTURING_GUIDE.md` (Read it when this workflow is needed).

**Quick summary**: Covers migrating a monolithic ARCHITECTURE.md to the multi-file docs/ structure (6 steps: analyze, propose target layout, extract files, rewrite ARCHITECTURE.md as navigation index, update external references, verify), plus optional enhancements and reference document inventory.

**When to invoke**: When user mentions "migrate", "restructure", "split", "reorganize", or "convert" with "architecture" or "ARCHITECTURE.md", or when the file is "too large" or "hard to navigate".

