---
name: architecture-dev-handoff
description: Generate Component Development Handoff documents from architecture documentation. Creates per-component implementation guides with deliverable assets (OpenAPI specs, DDL scripts, Kubernetes manifests) for development teams. Invoke when handing off a component for implementation, when a dev team needs implementation specs, or when generating development handoff documents.
triggers:
  - generate handoff
  - create handoff
  - handoff document
  - handoff documents
  - component handoff
  - dev handoff document
  - generate dev handoff
  - create dev handoff
  - handoff for development
  - generate implementation spec
  - create implementation spec
  - prepare component for development
---

# Architecture Dev Handoff Skill

## When This Skill is Invoked

This skill is **manually activated** when users request component handoff document generation. It is NOT automatically triggered.

**Activation Triggers:**
- "Generate handoff for [component name]"
- "Create development handoff"
- "Hand off [component] to development"
- "Generate implementation spec for [component]"
- "Create dev handoff for all components"
- "Generate handoff documents"
- "Create handoff docs"
- "Prepare components for development"
- `/skill architecture-dev-handoff`
- `/skill architecture-dev-handoff all`
- `/skill architecture-dev-handoff [component-name]`

**NOT Activated For:**
- General architecture documentation tasks (use `architecture-docs` skill)
- Compliance generation (use `architecture-compliance` skill)
- Component index maintenance (use `architecture-component-guardian` skill)
- Peer review (use `architecture-peer-review` skill)

---

## Purpose

This skill generates **Component Development Handoff** documents — one per component — that give development teams everything needed to implement a component without reading the full ARCHITECTURE.md suite.

**Output location:** `docs/handoffs/` directory

**Per-component output:**
- `docs/handoffs/NN-<component-name>-handoff.md` — 16-section handoff document
- `docs/handoffs/assets/NN-<component-name>/` — scaffolded deliverable assets (OpenAPI spec, DDL, Kubernetes manifests, etc.)
- `docs/handoffs/README.md` — managed index updated after each generation

---

## Template Format Preservation Policy

**CRITICAL REQUIREMENT**: Generated handoff documents MUST preserve template format exactly.

**Strict Preservation Rules:**
1. ✅ **ONLY replace explicit `[PLACEHOLDER]` tokens** — text inside `[...]` brackets
2. ✅ **PRESERVE ALL other text exactly** — including formatting, headers, structure
3. ❌ **NEVER transform template content** — no custom prose restructuring, no reformatting
4. ✅ **GAP DETECTION** — if data is not found in architecture docs, write `[NOT DOCUMENTED]` and add entry to Section 15 (Open Questions)
5. ❌ **NEVER invent** values not stated in the architecture documentation

---

## Strict Source Traceability Policy

All handoff documents must trace data back to architecture docs.

1. ✅ **ONLY extract data** that explicitly exists in the architecture docs
2. ✅ **CITE source files** (e.g., `docs/components/01-api-gateway.md`, `docs/07-security-architecture.md`)
3. ✅ **NEVER infer or guess** values not stated in the docs
4. ❌ **NO INFERENCE** — even if industry standards suggest a value
5. ✅ When data is missing: write `[NOT DOCUMENTED — add to docs/NN-file.md]` and record in §15

---

## Documentation Fidelity Policy

**CRITICAL REQUIREMENT**: Every generated handoff document and asset file MUST be an exact representation of what is specified in the architecture documentation. No more, no less.

**Rules:**
1. ✅ **EXACT MATCH** — every value in a generated handoff or asset (endpoint, field, schema, resource limit, env var, port, path, version, etc.) must come verbatim from the architecture docs
2. ❌ **NO DEFAULTS** — do not fill in default/fallback values in either handoff documents or asset files. If the value is not documented, use `[NOT DOCUMENTED — add to <source-file>]` in handoff sections or `# TODO: [NOT DOCUMENTED]` in asset files
3. ❌ **NO EXTRA FIELDS** — do not add fields, endpoints, schemas, columns, or resources beyond what is explicitly documented
4. ❌ **NO OMISSIONS** — every documented value relevant to the section or asset type MUST appear in the generated output
5. ✅ **COMPLETENESS CHECK** — after generating each handoff section and asset, verify it against the source documentation: every documented item has a corresponding entry, and every entry traces back to a documented item

---

## Generation Workflow

### Phase 1: Initialization

**Step 1.1: Locate ARCHITECTURE.md**
```
Search order:
1. Current directory
2. Parent directory
3. /docs subdirectory
4. Ask user for location
```

**Step 1.2: Validate Prerequisites**
```
Check for:
- ARCHITECTURE.md exists (navigation index)
- docs/components/ directory exists with at least one NN-*.md file
- docs/components/README.md exists (if not, suggest running architecture-component-guardian sync first)

Warn (do not block) if:
- compliance-docs/ is absent (skill works without it, but security/SRE enrichment is skipped)
```

**Step 1.3: Load Component Index**
```
Read docs/components/README.md to get the component table.
If absent, scan docs/components/*.md directly (excluding README.md).
Present the component list to the user.
```

### Phase 2: Component Selection

**Step 2.1: Component Selection**
```
ALWAYS show the component index and ask:
"Which component(s) would you like to generate a handoff for?
  (Enter a number, component name, comma-separated list, or 'all')"

Exception: If the user explicitly named specific component(s) in their original
request (e.g., "generate handoff for payment-api"), skip the prompt and use those.

Selection modes:
1. "all"               → process every component in the index
2. Number (e.g. "3")   → process that component by index position
3. Component name      → process that single component
4. Comma-separated     → process that subset (e.g. "1, 3" or "payment-api, auth-service")
```

### Phase 3: Per-Component Generation

For each selected component, execute Steps 3.1–3.5 sequentially:

**Step 3.1: Read Source Files**

Read all architecture docs relevant to this component. Consult `SECTION_EXTRACTION_GUIDE.md` for which files to read per handoff section. Always read:
- `docs/components/NN-<component>.md` (primary source)
- `ARCHITECTURE.md` (project name, navigation)
- Any file referenced by the section mapping for this component's type

Read opportunistically: if a file was already read for a previous component, reuse cached content.

**Step 3.2: Detect Component Type(s)**

From the component file's `**Type:**` field, determine which asset types to generate:

| Type Keyword(s) | Asset(s) |
|-----------------|---------|
| API, REST, GraphQL, gRPC, Service | `openapi.yaml` |
| Database, DB, Data Store, PostgreSQL, MySQL, MongoDB, Redis | `ddl.sql` |
| Kubernetes, K8s, Deployment, Pod, Service (k8s) | `deployment.yaml` |
| Consumer, Producer, Queue, Topic, Event, Message, Kafka, RabbitMQ | `asyncapi.yaml` |
| Kafka component AND doc/integration mentions `Avro` or `Schema Registry` | `schema.avsc` |
| Kafka component AND doc/integration mentions `Protobuf` or `proto` | `schema.proto` |
| Kafka component AND serialization format NOT specified | `schema.avsc` + `schema.proto` (dev picks one) |
| CronJob, Cron, Scheduled, Batch | `cronjob.yaml` |

A component may match multiple types and thus generate multiple assets.

**Step 3.3: Fill Handoff Template**

Load `HANDOFF_TEMPLATE.md` and replace all `[PLACEHOLDER]` tokens using data extracted from the architecture docs. Follow `SECTION_EXTRACTION_GUIDE.md` for the extraction rules per section.

For any section where source data is absent:
- Replace placeholder with `[NOT DOCUMENTED — add to <source-file>]`
- Add an entry to Section 15 (Open Questions & Assumptions)

**Step 3.4: Generate Deliverable Assets**

For each asset type detected in Step 3.2, generate the corresponding artifact file following `ASSET_GENERATION_GUIDE.md`.

Assets MUST exactly match the architecture documentation. Populate ONLY values explicitly stated in the docs — no defaults, no inferred values. For any value not found in the docs, use `# TODO: [NOT DOCUMENTED — add to <source-file>]`. After generating each asset, perform a completeness check: every documented item must appear in the asset, and every asset entry must trace to a documented item.

Write assets to `docs/handoffs/assets/NN-<component-name>/`.

**Step 3.5: Write Handoff Document**

Write the filled handoff document to `docs/handoffs/NN-<component-name>-handoff.md`.

### Phase 4: Index Generation

After all components are processed:

**Step 4.1: Create/Update `docs/handoffs/README.md`**

Write or update the managed index file. Format:

```
Line 1:  <!-- managed by solutions-architect-skills:architecture-dev-handoff — do not edit manually -->
Line 2:  [Architecture](../../ARCHITECTURE.md) > Development Handoffs
Line 3:  (blank)
Line 4:  # Component Development Handoffs
Line 5:  (blank)
Line 6:  <intro paragraph>
Line 7:  (blank)
Line 8:  ## <System Name> — Development Handoffs
Line 9:  (blank)
Line 10: | # | Component | Handoff File | Status | Assets | Generated |
Line 11: |---|-----------|-------------|--------|--------|-----------|
Line 12: | 5.1 | ... | ... | ... | ... | ... |
         ...
         (blank)
         ## Related Documentation
         (blank)
         - link list
```

**Table schema — exactly 6 columns:**

| # | Component | Handoff File | Status | Assets | Generated |
|---|-----------|-------------|--------|--------|-----------|

| Column | Source |
|--------|--------|
| `#` | Filename prefix `NN-` → formatted as `5.N` |
| `Component` | First `# Heading` in the component file |
| `Handoff File` | `[NN-name-handoff.md](NN-name-handoff.md)` relative link |
| `Status` | `Ready` (freshly generated) or `Outdated` (component file newer than handoff) |
| `Assets` | Comma-separated list of generated asset filenames, or `—` if none |
| `Generated` | ISO date the handoff was generated (`YYYY-MM-DD`) |

**Step 4.2: Update ARCHITECTURE.md Navigation**

If `ARCHITECTURE.md` does not already include a link to `docs/handoffs/README.md`, add one under the Component Details section or at the end of the navigation table.

### Phase 5: Report

Report results to the user:
```
Handoff generation complete

Generated: [N] component handoff(s)
Location: docs/handoffs/

Components:
  ✓ [Component Name] — NN-name-handoff.md
      Assets: openapi.yaml, ddl.sql
      Gaps recorded: [M] open questions in §15
  ✓ [Component Name] — NN-name-handoff.md
      Assets: deployment.yaml
      Gaps recorded: 0
```

---

## Files in This Skill

- **SKILL.md**: This file — activation triggers and generation workflow
- **HANDOFF_TEMPLATE.md**: 16-section template with `[PLACEHOLDER]` tokens
- **SECTION_EXTRACTION_GUIDE.md**: Maps each handoff section to source architecture doc files and extraction rules
- **ASSET_GENERATION_GUIDE.md**: Rules and scaffold templates for per-type deliverable assets
