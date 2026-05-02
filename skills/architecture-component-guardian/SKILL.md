---
name: architecture-component-guardian
description: Use this skill to create or update docs/components/README.md — the only sanctioned way to modify the component index table. Invoke when adding, removing, or updating components, syncing the index, or migrating flat components to C4 multi-system structure. This is the ONLY skill for C4 component migration — do not use architecture-docs for component migration.
triggers:
  - migrate components
  - migrate components to C4
  - C4 migration
  - component migration
  - sync components
  - sync component index
  - add component
  - remove component
  - update component
  - component guardian
  - component index
---

# Architecture Component Guardian Skill

## Purpose

This skill is the single source of truth for generating and maintaining
`docs/components/README.md`. It enforces a fixed 5-column table schema on every
write and refuses ad-hoc direct edits.

## C4 Model Governance

This skill enforces **C4 Level 2 (Container diagram)** rules from:
```
[plugin_dir]/skills/architecture-docs/references/ICEPANEL-C4-MODEL.md
```
Read that reference for the full C4 model (abstractions, 4 diagram levels, IcePanel conventions). Below are only the **guardian-specific enforcement rules** that extend the C4 reference.

### C4 L2 Canonical Types

The **Type** column accepts exactly these 8 values:

| Type | C4 Category | Description | Examples |
|------|------------|-------------|---------|
| API Service | App | Exposes a request/reply interface (REST, GraphQL, gRPC) | Payment API, Account Service, BFF |
| Web Application | App | Serves a browser-based UI or server-rendered pages | React SPA, Angular portal, Next.js SSR |
| Worker/Consumer | App | Processes work asynchronously — messages, scheduled jobs, background tasks | Kafka consumer, Celery worker, cron scheduler |
| Gateway | App | Routes, authenticates, rate-limits at the edge | Kong, NGINX, AWS API Gateway, Envoy |
| Database | Store | Primary persistence — system of record for a domain | PostgreSQL, MongoDB, SQL Server, DynamoDB |
| Cache | Store | Fast-access temporary data store | Redis, Memcached, Valkey, ElastiCache |
| Message Broker | Store | Async communication backbone — buffers and replays messages | Apache Kafka, RabbitMQ, Azure Service Bus, SQS |
| Object Storage | Store | Unstructured binary/file storage | S3, Azure Blob, MinIO, GCS |

### Ambiguous Cases

| Scenario | Resolution |
|----------|-----------|
| Dual-role: consumer AND exposes API (e.g., History Service) | Classify by **primary external interface** — API exposed → `API Service` |
| In-memory cache inside a service (Caffeine, Guava) | NOT a component — mention in parent service description |
| External managed service (SendGrid, Auth0) | NOT a component — integration reference. If user tracks it, flag as external in system header |
| Sidecar / service mesh proxy (Envoy, Istio) | NOT a component — transparent infrastructure, mention in description |
| Shared library or SDK | NOT a component — technology stack item, not a deployable unit |

### Architecture Type → C4 Translation

**On every invocation** (sync, add, migrate), detect the project's architecture type and load its C4 translation guide. The translation guide defines how that specific architecture maps to C4 levels — this affects what qualifies as a component.

**Step 0: Detect architecture type**

Search for the type metadata comment:
```
Grep pattern: "<!-- ARCHITECTURE_TYPE:"
file: docs/03-architecture-layers.md
```

Extract the type value (e.g., `MICROSERVICES`, `3-TIER`, `META`, `N-LAYER`, `BIAN`).

**Step 0.1: Load the C4 translation guide**

Read the matching translation file from the plugin:
```
[plugin_dir]/skills/architecture-docs/references/{TYPE}-TO-C4-TRANSLATION.md
```

Mapping:
| ARCHITECTURE_TYPE | Translation File |
|-------------------|-----------------|
| MICROSERVICES | `MICROSERVICES-TO-C4-TRANSLATION.md` |
| 3-TIER | `3-TIER-TO-C4-TRANSLATION.md` |
| N-LAYER | `N-LAYER-TO-C4-TRANSLATION.md` |
| META | `META-TO-C4-TRANSLATION.md` |
| BIAN | `BIAN-TO-C4-TRANSLATION.md` |

If `docs/03-architecture-layers.md` doesn't exist or has no type comment, skip translation loading and use the generic C4 L2 rules from `ICEPANEL-C4-MODEL.md` only.

**Step 0.2: Apply type-specific container rules**

The translation guide overrides the generic C4 rules for what counts as a component:

| Architecture Type | Key Translation Rule |
|-------------------|---------------------|
| **Microservices** | Each service = Container (App). Each DB per service = Container (Store). Event bus = Container. API Gateway = Container. |
| **3-Tier** | Backend code (tiers 2+3) = ONE Container. Only the database, cache, and external processes are separate Containers. Do NOT create a component per tier. |
| **N-Layer** | All inner layers (Domain, Application, Use Cases) = C3 level inside one backend Container. Only infrastructure that runs as a separate process (DB, cache, broker) = Container. |
| **META** | Channels (L1) = separate Systems. Layers 2–5 containers grouped by layer. Transversal = vertical column. BIAN SDs at L5 = Containers. |
| **BIAN** | Each BIAN Service Domain = Container (App) labeled with BIAN SD name + `[BIAN V12.0]`. Core systems = external. |

**When validating component entries**, check the Type value against what the translation guide considers a valid C4 L2 container for this architecture. Flag violations:
```
⚠️ Architecture type is 3-TIER but component "Service Layer" looks like an internal code layer (C3), not a deployable container (C2).
The 3-Tier C4 translation says: backend code (tiers 2+3) deploys as ONE container.
```

---

## When to Invoke This Skill

- User adds a new component file to `docs/components/`
- User removes a component file from `docs/components/`
- User updates a component name or type in a component file
- User asks to "sync", "regenerate", or "rebuild" the component index
- After a migration that produces the `docs/components/` structure for the first time
- Any request to modify `docs/components/README.md` directly → redirect here instead
- User asks to "migrate", "convert to C4", or "restructure components" → triggers the C4 multi-system migration workflow

**Do NOT invoke for**: questions about individual components (use `architecture-docs`
skill), compliance generation, presentation creation, or **component development handoffs**
(use `architecture-dev-handoff` skill — it manages `handoffs/` independently).

---

## Format Specification — FIXED, do not alter without updating this skill

The generated `docs/components/README.md` MUST follow this exact structure:

```
Line 1:  <!-- managed by sa-skills:architecture-component-guardian — do not edit manually -->
Line 2:  [Architecture](../../ARCHITECTURE.md) > Components
Line 3:  (blank)
Line 4:  # Component Details
Line 5:  (blank)
Line 6:  <intro paragraph>
Line 7:  (blank)
Line 8:  ## <System Name> Components
Line 9:  (blank)
Line 10: | # | Component | File | Type | Technology |
Line 11: |---|-----------|------|------|------------|
Line 12: | 5.1 | ... | ... | ... |
         ...
         (blank)
         ## Key Relationships
         (blank)
         - bullet list
         (blank)
         ## Related Documentation
         (blank)
         - link list
```

**Table schema — exactly 5 columns, never add or remove:**

| # | Component | File | Type | Technology |
|---|-----------|------|------|------------|

**Type canonical values (C4 L2 set):**

| Type | C4 Category |
|------|------------|
| API Service | App |
| Web Application | App |
| Worker/Consumer | App |
| Database | Store |
| Cache | Store |
| Message Broker | Store |
| Object Storage | Store |
| Gateway | App |

**Multi-system grouped tables:**

- **All architectures**: Use a `### [System Name](system-name.md)` header linked to the system descriptor file before each system's table. File column paths include system folder: `[01-name.md](system-name/01-name.md)`. This applies to both single-system and multi-system architectures — there is no flat layout exception.

**C4 L1 System descriptor files** (all architectures):

- Located at `docs/components/` root: `{system-name}.md` (kebab-case, matches folder name)
- NOT indexed as rows in the README table — they are linked from the `### System Name` section headers
- Contain: C4 Level (System L1), Type (Internal/External), Owner, Container summary table, System Boundaries, Communication patterns
- When scanning `docs/components/`, distinguish files by name pattern:
  - `NN-*.md` (starts with digits) = C4 L2 container → indexed in table
  - `{name}.md` matching a subfolder name = C4 L1 system descriptor → NOT in table, linked from header
  - `README.md` = index file → managed by this skill

**Technology column — IcePanel bracket convention:**

Use brackets around the technology with version: `[Spring Boot 3.2]`, `[PostgreSQL 16]`, `[React 18 SPA]`

**Column extraction rules:**

| Column | Source |
|--------|--------|
| `#` | Filename prefix `NN-` → formatted as `5.N` (e.g. `01` → `5.1`) |
| `Component` | First `# Heading` in the component file |
| `File` | `[NN-filename.md](system-name/NN-filename.md)` relative link (always includes system folder path) |
| `Type` | Value of `**Type:**` field in the component file; must be one of the C4 L2 canonical values above |
| `Technology` | Value of `**Technology:**` field in the component file, formatted in IcePanel brackets |

**What belongs here vs. elsewhere:**

| Data | Location |
|------|----------|
| Technology stack per component | Individual component file (`**Technology:**` section) |
| Monthly cost per component | `docs/09-operational-considerations.md` Cost Management section |
| Component relationships | `## Key Relationships` section of this README |
| Scaling details | `docs/08-scalability-and-performance.md` |
| Extra index columns beyond 5 | **Not permitted** — update this skill's format spec first |
| Development handoff docs | `handoffs/NN-*-handoff.md` — managed by `architecture-dev-handoff` skill |

---

## EXPLORER_HEADER Block — Generation Rules

This skill is the **first-class writer** of `<!-- EXPLORER_HEADER -->` blocks for every component file it produces (L1 system descriptors and L2 containers). The dedicated `architecture-explorer-headers` skill is for **legacy backfill only** — it must not be relied on to fill gaps left by this skill.

**Why headers are mandatory at creation time**: `agents/builders/architecture-explorer.md` (the universal Haiku navigator) reads only the **first 60 lines** of each component file and extracts EXPLORER_HEADER metadata into the `EXPLORE_MANIFEST` it emits. Compliance, dev-handoff, peer-review, and analysis skills filter that manifest by `key_concepts`, `technologies`, `component_self`, `component_type`, and `related_adrs`. A component file written without a header degrades every downstream classification until backfilled.

**Canonical format reference**: `skills/architecture-docs/ARCHITECTURE_DOCUMENTATION_GUIDE.md` (sections "Format" and "What goes in `docs/components/NN-<slug>.md`").
**Field allowlist + validator**: `skills/architecture-explorer-headers/utils/header-detector.ts` (`HEADER_OPEN`, `HEADER_CLOSE`, `ALLOWED_FIELDS`, `REQUIRED_FIELDS_*`).

### Format — L2 Container (`docs/components/<system>/NN-*.md`)

Insert immediately after the H1, before the `**Type:**` line:

```markdown
# Payment Service

<!-- EXPLORER_HEADER
key_concepts: PCI compliance, idempotency, refund, chargeback, settlement
technologies: Spring Boot 3.3, PostgreSQL 16, Stripe API
component_self: payment-service
component_type: api-service
scope: API service handling card authorization, capture, refund, and ledger persistence
related_adrs: ADR-018, ADR-031
-->

> Payment Service ingests authorization requests from the order-checkout flow, calls the Stripe API for capture/refund/void operations, and persists ledger entries with idempotency guarantees.

**Type:** API Service
...
```

### Format — L1 System Descriptor (`docs/components/<system>.md`)

Insert immediately after the H1, before the `**C4 Level:** System (L1)` line:

```markdown
# Notification Inbox Platform

<!-- EXPLORER_HEADER
key_concepts: multi-channel delivery, event ingest, fan-out, dedupe, opt-in registry
technologies: Kafka, PostgreSQL 16, Redis, Spring Boot 3.3
component_self: notification-inbox-platform
component_type: internal-system
scope: System boundary for ingesting events and fanning out push/email/SMS notifications
related_adrs: ADR-014, ADR-022
-->

> Notification Inbox Platform owns the end-to-end multi-channel delivery pipeline for transactional and marketing events, from upstream ingest through per-channel adapters.

**C4 Level:** System (L1)
**Type:** Internal System
...
```

### Field Derivation Rules

| Field | Source for L2 container | Source for L1 descriptor |
|-------|------------------------|--------------------------|
| `key_concepts` | 5–15 domain terms from the component description, `## Overview`, and the architecture context (Section 6 / 8 / 9 docs). Concrete vocabulary only — no generic words like "service", "data", "system". | 5–15 terms describing the system's responsibility and dominant patterns; pull from architecture docs and any existing system summary. |
| `technologies` | Exact value of `**Technology:**` (without IcePanel brackets), comma-separated when multiple. Preserve version numbers. | Aggregate of the technologies listed in the system's contained containers, deduplicated. |
| `component_self` | Kebab-case of the filename slug (filename without `NN-` prefix and without `.md`). E.g., `03-payment-service.md` → `payment-service`. | Kebab-case of the system folder name. E.g., `notification-inbox-platform.md` → `notification-inbox-platform`. |
| `component_type` | Kebab-case of the canonical `**Type:**` value: `api-service`, `web-application`, `worker-consumer`, `gateway`, `database`, `cache`, `message-broker`, `object-storage`. | `internal-system` or `external-system` (drawn from `**Type:**`). |
| `scope` | One sentence (≤120 chars) describing what the container does and what it does NOT do. | One sentence (≤120 chars) describing the system boundary. |
| `related_adrs` | ADR identifiers (`ADR-NNN`) loaded in Step 6a whose titles or decisions reference this component. | ADRs that scope the system as a whole (architecture-shaping decisions). |

**Validator quirk**: `header-detector.ts:188-189` flags any path containing `/components/` as a "component file" requiring `component_self`. L1 descriptors and L2 containers therefore both use `component_self` (not `components`). The L1 descriptor's `component_type: internal-system | external-system` is the explicit distinguishing token.

### Refresh Rules

- **`add component`** → write the full header from scratch using the rules above.
- **`update component`** → if `Component Name`, `**Type:**`, or `**Technology:**` changed, refresh `component_self`, `component_type`, and `technologies` in the existing header. Preserve `key_concepts`, `scope`, and `related_adrs` unless the user-facing change clearly invalidates them (e.g., a wholesale responsibility shift).
- **`migrate`** → write headers as part of Phase M3.5 (see Migrate Workflow below).
- **`sync`** → read-only. Never modifies headers.

### Post-Write Validation

Every file written by this skill must pass:

```bash
bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts validate <abs_path>
```

Exit 0 = valid. Exit 1 = malformed; revert the header block via Edit tool, leave the rest of the file intact, and warn the user that header authoring degraded for that file. The component file itself is **not** rolled back.

---

## Workflow

### Step 1 — Detect mode

Check if `docs/components/README.md` exists:
- **Does not exist** → **CREATE mode** (new architecture or post-migration)
- **Exists** → **UPDATE mode** (add / remove / update / sync)

### Step 2 — Scan component files

Read every `.md` file in `docs/components/` **except `README.md`**.
Sort by filename prefix ascending (01, 02, 03 …).

For each file extract: section number, component name, file link, type.

**Validate naming convention**: Every component file MUST follow `NN-kebab-case-name.md` — lowercase, hyphens only, no spaces, no uppercase, no underscores. If any file violates this convention, warn the user:

```
⚠️  Component file naming violation (must be lowercase kebab-case):
  docs/components/03-PaymentService.md → rename to 03-payment-service.md
```

Offer to rename the file automatically.

### Step 3 — Apply requested change

| Argument | Action |
|----------|--------|
| `sync` | Rebuild table from current files, no other change. Read-only — does NOT modify component file bodies or EXPLORER_HEADER blocks. |
| `add component <description>` | Resolve target system folder, create the new component file with EXPLORER_HEADER block + 30-second summary blockquote (see "EXPLORER_HEADER Block — Generation Rules" above) and version fields (`Component Version: 1.0.0`, `Architecture Version` from ARCHITECTURE.md, `Last Updated: today`), then sync (see Step 3a below) |
| `remove component <name>` | Confirm deletion of component file, then sync |
| `update component <name>` | Edit the relevant component file fields, update `**Last Updated:**` to today, suggest a `**Component Version:**` bump (see "Component Version Management" below). If `Component Name`, `**Type:**`, or `**Technology:**` changed, refresh `component_self`, `component_type`, and `technologies` in the EXPLORER_HEADER (preserve `key_concepts`, `scope`, `related_adrs` unless the change clearly invalidates them). Then sync. |
| `migrate` | Run the full C4 multi-system migration workflow (Phases M1–M8). Converts flat `docs/components/` to system-subfolder structure with canonical C4 metadata, writes EXPLORER_HEADER blocks (Phase M3.5), and updates all cross-references. See "Migrate Workflow" section below. |

**When creating a new component file** (`add`): always convert the component name to lowercase kebab-case for the filename. Examples: "Payment Service" → `NN-payment-service.md`, "CRM Domain Service" → `NN-crm-domain-service.md`, "Redis Cache" → `NN-redis-cache.md`. The display name in the `# Heading` inside the file keeps its natural casing (e.g., `# Payment Service`).

#### Step 3a — Resolve target system folder (`add` only)

Before creating the component file, determine which system folder it belongs to.

**3a.1 Detect existing system folders**: Scan `docs/components/` for subdirectories containing `.md` files. List all system folders found along with their L1 descriptor files.

**3a.2 System selection prompt** (when system folders exist):

```
📂 Existing systems in docs/components/:
  1. notification-inbox-platform (Internal) — 8 containers
  2. campaign-management-system (External) — 1 container

Add "<component-name>" to which system?
  [1] notification-inbox-platform
  [2] campaign-management-system
  [N] Create new system
```

Wait for user selection.

- **Existing system selected**: Place the new file in that system's subfolder with the next sequential `NN-` number. Skip to Step 3a.5.
- **Create new system selected**: Proceed to Step 3a.3.

**3a.3 New system — classify and create L1+L2 structure**:

When the user wants to add a component under a new system (or the component description implies a system that does not yet have a folder), prompt:

```
🆕 New system: "<system-name>"

System type?
  [1] Internal System — owned and developed by your team
  [2] External System — third-party, SaaS, or owned by another team

Create Level 1 (system descriptor) + Level 2 (container folder) structure? [Yes/No]
```

- **If Yes**: Proceed to create the full L1+L2 structure (Step 3a.4)
- **If No**: Create the component file in the most appropriate existing system folder, or abort if the user declines

**3a.4 Create L1+L2 folder structure**:

1. **Create system subfolder**: `docs/components/<system-name>/` (kebab-case)
2. **Create L1 system descriptor**: `docs/components/<system-name>.md` with EXPLORER_HEADER + 30-second blockquote (per "EXPLORER_HEADER Block — Generation Rules" above) + C4 metadata:
   ```markdown
   # <System Display Name>

   <!-- EXPLORER_HEADER
   key_concepts: <5–15 system-level domain terms>
   technologies: <aggregate of contained-container technologies, deduplicated>
   component_self: <system-name>
   component_type: internal-system | external-system
   scope: <one sentence ≤120 chars describing the system boundary>
   related_adrs: <ADR-NNN, ADR-NNN>
   -->

   > <30-second summary of the system's responsibility and dominant patterns>

   **C4 Level:** System (L1)
   **Type:** <Internal System | External System>
   **Owner:** <ask user or infer from context>

   ## Overview
   <brief system description — infer from architecture docs or ask user>

   ## Containers

   | # | Container | File | Type | Technology |
   |---|-----------|------|------|------------|
   | 1 | <component-name> | [01-<component>.md](<system-name>/01-<component>.md) | <type> | <technology> |

   ## System Boundaries
   <what is inside this system boundary>

   ## Communication Patterns
   <how this system communicates with others — protocols, events, APIs>
   ```
3. **Create L2 container file**: `docs/components/<system-name>/01-<component-name>.md` with EXPLORER_HEADER + 30-second blockquote (per "EXPLORER_HEADER Block — Generation Rules" above) + standard C4 L2 metadata fields. Insert the header block immediately after the H1, before the `**Type:**` line. Pull `key_concepts` and `technologies` from the architecture context (Section 6 Technology Stack, Section 8 Scalability, Section 9 Operations) and the user's component description; pull `related_adrs` from ADR titles matched in Step 6a.
4. **Validate every written file**: run `bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts validate <abs_path>` against each new file (L1 descriptor + L2 container). On exit 1, revert only the EXPLORER_HEADER block via Edit and warn the user — keep the C4 file body intact.

**3a.5 Confirm placement**: Before writing files, display:

```
✅ Component placement:
  System: <system-name> (<Internal|External>)
  File: docs/components/<system-name>/NN-<component-name>.md
  L1 descriptor: docs/components/<system-name>.md [new | existing]
```

Proceed to Step 4 (regenerate README.md).

### Step 4 — Regenerate `docs/components/README.md`

Write the full file using the Format Specification above.

**If the user requests extra columns** (technology, cost, etc.): decline and explain
that additional data belongs in the individual component files or in a dedicated
supplementary document. The index table schema is fixed by this skill.

### Step 5 — Verify output

Before finishing, confirm:
- [ ] Line 1 is the managed-by HTML comment
- [ ] Table has exactly 5 columns: `#`, `Component`, `File`, `Type`, `Technology`
- [ ] All `.md` files in `docs/components/` (except README.md) are represented in the table
- [ ] No component appears twice
- [ ] Breadcrumb is `[Architecture](../../ARCHITECTURE.md) > Components`
- [ ] Sections appear in order: Components table → Key Relationships → Related Documentation
- [ ] Every newly written component file (L1 descriptor or L2 container) contains an `<!-- EXPLORER_HEADER -->` block immediately after the H1
- [ ] Validator passes — `bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts validate <abs_path>` returns exit 0 for each file written or modified by this run. On exit 1, revert only the header block via Edit and warn the user that header authoring degraded for that file (the C4 file body remains intact and the rest of the workflow continues)

---

## Component Version Management

Each component file carries three version-related fields directly below the C4 metadata block:

```markdown
**Component Version:** 1.0.0
**Architecture Version:** 1.0.0
**Last Updated:** YYYY-MM-DD
```

The guardian manages these fields on every `add` and `update` action:

### On `add component`

- **Component Version**: start at `1.0.0`
- **Architecture Version**: copy the current value from `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` in `ARCHITECTURE.md`. If the comment is absent, use `unversioned` (the parent architecture predates versioning).
- **Last Updated**: today's date in ISO format (`YYYY-MM-DD`)

### On `update component`

- **Component Version**: evaluate what changed and suggest a bump:
  - **MAJOR (X+1.0.0)**: Breaking API change (endpoint removed/renamed, schema incompatible), technology replaced, responsibility boundary shifted
  - **MINOR (X.Y+1.0)**: New endpoint, new responsibility, new dependency, new configuration option
  - **PATCH (X.Y.Z+1)**: Documentation clarifications, metric updates, typo fixes
  - Present the suggestion to the user: `Suggest bumping Component Version {old} → {new} ({bump-type}). Confirm or override?`
- **Architecture Version**: leave unchanged (only bumps during a full architecture release via Workflow 10 of `architecture-docs`)
- **Last Updated**: always update to today's date

### On `sync`

- `sync` is read-only for component files — it does NOT modify version fields. It only rebuilds `docs/components/README.md` from the current file state.

### On architecture release (Workflow 10 of architecture-docs)

- The release workflow updates `**Architecture Version:**` in every component file to match the new architecture version. Component Version is NOT bumped during release.

---

## Migrate Workflow — C4 Multi-System Migration

**Trigger**: User invokes with `migrate`, or asks to "convert to C4 structure" or "restructure components into systems".

**Prerequisite**: `docs/components/` exists with at least one `.md` file (besides README.md). If no component files exist, abort:
```
⚠️ No component files found in docs/components/. Nothing to migrate.
```

**Reference**: Load `C4-MIGRATION-REFERENCE.md` from this skill's directory for type mapping tables, ownership heuristics, and cross-reference patterns.

---

### Phase M1 — Detect & Scan

**M1.1 Check C4 compliance**: Scan `docs/components/` for subdirectories with `.md` files. If subfolders already exist AND all Type values are canonical → report "Already C4-compliant. Use `sync` instead." Offer to proceed anyway for partial re-migrations.

**M1.2 Scan all component files**: Read every `.md` file in `docs/components/` (excluding README.md). For each file, extract:
- `heading` — first `#` heading
- `heading_has_section_number` — starts with digits + dot (e.g., `## 5.1 ...`)
- `type_raw` — value of `**Type:**` field
- `type_is_canonical` — matches C4 L2 types
- `technology_raw` — value of `**Technology:**` field
- `technology_has_brackets` — wrapped in `[...]`
- `location` — value of `**Location:**` (may be absent)
- `team_owner` — value of `**Team Owner:**` (may be absent)
- `has_c4_header` — file contains all 5 C4 metadata fields

Present scan summary with issue counts.

---

### Phase M2 — Classify Systems

**M2.1 Apply ownership heuristics** (from C4-MIGRATION-REFERENCE.md):
- `**Location:** services/...` → internal
- Technology says "managed by domain service team" → external
- No Location AND no Version → likely external
- `**Bounded Context:**` grouping → same system

**M2.2 Present classification to user**:
```
🔍 C4 Level 1 — System Classification (Migration)

  1. task-scheduling-system — 9 containers (6 Apps, 3 Stores)
  2. bian-domain-services (external) — 3 API Services

Please confirm, adjust system names, or reassign components.
```
Wait for user confirmation.

**M2.3 Confirm focus system** (if multiple internal systems):
```
🔎 Which system is the main focus? (Listed first in README.md)
```

---

### Phase M3 — Migrate Metadata (per file)

**M3.1 Fix headings**: Strip section number prefixes, enforce H1. Record old→new heading text (needed for anchor slug updates in M5).

**M3.2 Fix Type values**: Use the auto-map table in C4-MIGRATION-REFERENCE.md. For unmapped types, prompt user with the 8 canonical options.

**M3.3 Fix Technology format**: Wrap in IcePanel brackets. Strip tier/SKU/pricing details. Keep primary tech + version.

**M3.4 Add C4 metadata header** (if missing): Insert after Type/Technology fields:
```
**C4 Level:** Container (L2)
**Deploys as:** [infer or placeholder]
**Communicates via:** [infer or placeholder]
```

**M3.5 Write EXPLORER_HEADER block**: For every file in scope, derive the header fields from the file's existing body and insert immediately after the H1 (before any other metadata). This is the only place in `migrate` where the guardian both creates and improves header metadata in one pass.

Field derivation:
- `key_concepts` — 5–15 domain terms from H2/H3 headings, bold terms in `## Overview`, and table headers in the file body. Skip generic words.
- `technologies` — value of the now-canonicalized `**Technology:**` field (without IcePanel brackets), plus any other named tools/products in the body. Preserve version numbers.
- `component_self` — kebab-case slug from the filename (`NN-<slug>.md` → `<slug>`).
- `component_type` — kebab-case of the canonical `**Type:**` value set by M3.2.
- `scope` — one sentence (≤120 chars) drawn from the file's intro paragraph.
- `related_adrs` — `ADR-NNN` identifiers found in the body or footer.

Skip files that already have an EXPLORER_HEADER block (the migration is structural; do not overwrite hand-curated headers). Track count for the M8.4 final report.

Validate each written header via `bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts validate <abs_path>`. On exit 1, revert only the header block via Edit and continue with the next file.

Present Phase 3 summary with all fixes applied (including EXPLORER_HEADERs added).

---

### Phase M4 — Create Folders & Move Files

**M4.1 Create system subfolders**: `docs/components/<system-name>/` (kebab-case).

**M4.1b Create C4 L1 system descriptor files**: For each system, write `docs/components/<system-name>.md` at the root using the L1 system file format (EXPLORER_HEADER + 30-second blockquote per "EXPLORER_HEADER Block — Generation Rules" above, then C4 Level: System L1, Type: Internal/External, Owner, Container table, System Boundaries, Communication). Populate header fields and body from architecture docs context. Validate each L1 descriptor via the same `header-cli.ts validate` call as Phase M3.5.

**M4.2 Detect project type**: Check if `.git/` exists in project root.
- Git repo → use `git mv` (preserves history)
- Non-git → Read source file content → Write to new path → delete original

**M4.3 Move files**: For each component, move to its system subfolder.

**M4.4 Renumber within folders**: If numbering has gaps after grouping, renumber contiguously (01, 02, 03...) within each system folder.

**M4.5 Build MOVE MANIFEST**: Complete mapping of old paths → new paths. This drives all reference updates in Phase M5.

**M4.6 Update breadcrumbs in moved files**:
- Old (flat): `[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > Name`
- New (multi): `[Architecture](../../../ARCHITECTURE.md) > [Components](../README.md) > [System](.) > Name`

---

### Phase M5 — Update References (CRITICAL)

**This is where manual migrations break.** Every markdown reference to a moved component must be updated.

**M5.1 Build search patterns**: From the MOVE MANIFEST, generate search patterns for each moved file across all possible relative path forms.

**M5.2 Scan ALL markdown files** in: `docs/`, `adr/`, `handoffs/`, `compliance-docs/`, `ARCHITECTURE.md`

**M5.3 For each reference found**, classify:
- **Markdown link** `[text](path)` → compute new relative path → update automatically
- **Plain text** (path in prose without link syntax) → LOG for manual review, do NOT auto-update

**M5.4 Update anchor slugs**: If headings changed in M3 (e.g., `#51-job-scheduler-service` → `#job-scheduler-service`), find and update all anchor references.

**M5.5 Update cross-system references**: Component files referencing files in different system folders need relative paths through `../other-system/`.

Present Phase M5 summary: links updated count, anchor slugs updated, plain-text references logged.

---

### Phase M6 — Regenerate README.md

Use the existing Format Specification in multi-system mode:
- Focus system listed first
- `### [System Name](system-name.md)` header linked to system descriptor file before each system's table
- 5-column table with updated file paths including system folder prefix
- Renumbered `#` column contiguous within README

---

### Phase M7 — Update ARCHITECTURE.md

Update Section 5 description to reflect system count:
```
| S5 | Component Details | [docs/components/README.md](...) | N systems, M containers |
```

---

### Phase M8 — Verify & Report

**M8.1 Orphaned path check**: Grep all `.md` files for old flat component paths not updated.

**M8.2 Link validation**: Every file in system folders has a README row; every README row has a file.

**M8.3 Mandatory diagram regeneration**:

C4 migration changes the system's container topology. Invoke `/skill architecture-docs` and pass context:

```
Trigger reason: "C4 migration — full diagram regeneration required"
Operation: migrate
Request: Update architecture diagrams
```

The architecture-docs skill detects this as a Workflow 8 trigger and regenerates all 4 standard diagrams plus data flow sequence diagrams from the updated source files.

**Fallback**: If diagram generation fails, log `<!-- DIAGRAM UPDATE PENDING: C4 migration (YYYY-MM-DD) -->` at the top of `docs/03-architecture-layers.md` and report failure in M8.4.

**M8.4 Final report**:
```
═══════════════════════════════════════════════════════════
C4 MIGRATION — COMPLETE
═══════════════════════════════════════════════════════════
Systems: N (M internal, K external)
Files moved: X
Metadata fixes: Y (headings, types, technology, C4 headers)
EXPLORER_HEADERs added: H files
References updated: Z markdown links, W anchor slugs
Plain-text refs logged: N (manual review recommended)
═══════════════════════════════════════════════════════════
```

---

### Step 6 — Update architecture documentation

**Runs for**: `add`, `remove`, `update` operations only. **Skip for `sync` and `migrate`** (migrate handles its own architecture updates in Phase M7).

---

#### Step 6a — Load Context Anchor

Required by the architecture-docs Context-Efficient Workflow for any edit to `docs/components/*.md` files.

Load in this order:
1. **Universal Foundation**: `docs/01-system-overview.md` + `docs/02-architecture-principles.md`
2. **Section-Specific Parents**: `docs/03-architecture-layers.md` (layers/tiers the component belongs to) + `docs/components/README.md` (component index)
3. **Relevant ADRs**: Read the ARCHITECTURE.md navigation table; match ADR titles against the component name and type — load any matched ADRs

---

#### Step 6b — Post-Write Alignment & Traceability Audit

Run the 5-check audit on the modified or newly created component file:

- **Check A — Principle traceability**: Component design does not contradict Section 3 (Architecture Principles)
- **Check B — Metric consistency**: Any numeric values (throughput, latency, SLO) match Section 1 Key Metrics
- **Check C — ADR alignment**: Component does not contradict decisions in the loaded ADRs
- **Check D — Parent section alignment**: Component maps to a valid layer defined in `docs/03-architecture-layers.md`
- **Check E — Source citation audit**: Numeric values, technology names, and architecture patterns have source cross-reference links; unverifiable claims are marked `<!-- TODO: Add source reference -->`

Silent pass if all checks clear. Report only when misalignment or missing citations are detected.

---

#### Step 6c — Update all downstream architecture sections (S6–S11)

Read each downstream file and update it to reflect the component change:

| File | Section | What to Update |
|------|---------|----------------|
| `docs/04-data-flow-patterns.md` | S6 — Data Flow | Flows the component participates in (request/response paths, event streams, pipelines) |
| `docs/05-integration-points.md` | S7 — Integration Points | Endpoints, APIs, or events the component exposes or consumes |
| `docs/06-technology-stack.md` | S8 — Technology Stack | Technologies introduced or removed with the component |
| `docs/07-security-architecture.md` | S9 — Security | Auth boundaries, encryption controls, trust zones relevant to the component |
| `docs/08-scalability-and-performance.md` | S10 — Scalability | Scaling strategy, resource limits, SLOs relevant to the component |
| `docs/09-operational-considerations.md` | S11 — Operations | Deployment config, health checks, alerting, runbooks for the component |

**Per-operation rules**:

- **`add`**: Insert references to the new component in each section where it is architecturally relevant. If a section has no applicable content for this component type (e.g., a stateless utility service has no S10 scaling entry), leave it unchanged and note it in the propagation report.
- **`remove`**: Remove all references to the deleted component from each section. Flag any flows, integration points, or operational runbooks that depended exclusively on this component as **orphaned** (mark with `<!-- ORPHANED: <component-name> removed — update required -->`).
- **`update`**: Update all references to reflect the changed component details (new name, changed type, modified endpoints, revised responsibilities). Replace stale references; do not duplicate them.

Apply source-attribution conventions throughout:
- Cross-reference links to the component file: `(see [Component Name](../components/NN-name.md))`
- Unverifiable claims: `<!-- TODO: Add source reference -->`

---

#### Step 6d — Update `ARCHITECTURE.md` navigation index

Applies to `add` and `remove` only (skip for `update`):

- **`add`**: Verify the new component file appears in the Section 5 row of the ARCHITECTURE.md navigation table. If missing, add the row.
- **`remove`**: Verify the removed component no longer appears in the Section 5 row. If still present, remove the row.

---

#### Step 6e — Mandatory diagram regeneration

Component add/remove operations change the system's container topology. Diagrams **MUST** be regenerated to reflect the current state. This step is not optional.

**Applies to**: `add` and `remove` operations. **Skip for `update`** unless the update changed the component's **Name**, **Type**, or communication/integration fields (topology-affecting changes).

**Action**: Invoke `/skill architecture-docs` and pass context:

```
Trigger reason: "Component <operation> — diagram regeneration required"
Component name: <component display name>
Component type: <C4 L2 type>
Component system: <system name from system subfolder>
Operation: add | remove
Affected connections: <list of components/external systems this component communicates with, from the component file's integration/communication fields>
Files already updated in this workflow: <list of docs/ files modified in Steps 6c-6d>
Request: Update architecture diagrams
```

The architecture-docs skill detects this as a Workflow 8 (Diagram Generation) trigger. It reads all source files (`docs/03-architecture-layers.md`, `docs/04-data-flow-patterns.md`, `docs/components/README.md`, `docs/components/**/*.md`, `docs/05-integration-points.md`) and regenerates:

1. **All 4 standard diagrams** in `docs/03-architecture-layers.md` (Logical View ASCII, C4 L1 Context, C4 L2 Container, Detailed View) — the new/removed component must appear/disappear in Diagrams 1, 3, and 4
2. **Data Flow sequence diagrams** in `docs/04-data-flow-patterns.md` — any flow involving the component must be added/updated/removed

**Verification after diagram generation**:
- For `add`: Grep `docs/03-architecture-layers.md` for the component name — it MUST appear in at least Diagram 3 (C4 L2 Container) and Diagram 4 (Detailed View)
- For `remove`: Grep `docs/03-architecture-layers.md` for the component name — it MUST NOT appear in any diagram
- If verification fails, report the discrepancy and retry diagram generation once

**Fallback**: If diagram generation fails (skill unavailable, generation error, or context limit exceeded), do NOT block the component operation. Instead:
1. Log `<!-- DIAGRAM UPDATE PENDING: <component-name> <operation> (YYYY-MM-DD) -->` at the top of `docs/03-architecture-layers.md`
2. Report the failure in the Step 6f Change Propagation Report under the `Diagram update` row
3. Display: `⚠️ Diagram regeneration failed — component <operation> completed successfully but diagrams are stale. Run '/skill architecture-docs' with 'update diagrams' to regenerate manually.`

---

#### Step 6f — Change Propagation Report

Present the downstream impact summary:

```
═══════════════════════════════════════════════════════════
CHANGE PROPAGATION — DOWNSTREAM IMPACT REPORT
═══════════════════════════════════════════════════════════

Component: <component-name> (<operation>: add | remove | update)
System: <system-name> (<Internal|External>) [new system created | existing]

Sections updated:
→ docs/04-data-flow-patterns.md (S6) — [summary of change]
→ docs/05-integration-points.md (S7) — [summary of change]
→ docs/06-technology-stack.md (S8) — [summary of change]
→ docs/07-security-architecture.md (S9) — [summary of change]
→ docs/08-scalability-and-performance.md (S10) — [summary of change]
→ docs/09-operational-considerations.md (S11) — [summary of change]

Diagram update:
→ docs/03-architecture-layers.md — [4 diagrams regenerated | FAILED — see fallback]
→ docs/04-data-flow-patterns.md — [N sequence diagrams regenerated | no flows affected]

Sections with no applicable content for this component:
ℹ️  [list sections where no update was needed, with reason]

[remove only] Orphaned references requiring manual review:
⚠️  [list any flows or runbooks that exclusively referenced the removed component]
═══════════════════════════════════════════════════════════
```

---

## User Flows

### Flow A — New architecture (first time)
1. `architecture-docs` skill creates ARCHITECTURE.md + `docs/` structure including component files
2. User invokes this skill with `sync`
3. Skill scans `docs/components/*.md`, extracts data, creates README from scratch

### Flow B — Post-migration
1. MIGRATION agent splits a monolithic ARCHITECTURE.md into `docs/` files
2. At end of migration, invoke this skill with `sync` to create or verify README
3. Managed-by comment is written at line 1

### Flow C — Ongoing maintenance
1. Developer adds/changes/removes a `docs/components/NN-*.md` file
2. Invoke this skill — system folder selection prompt presented (Step 3a)
3. For new systems or external systems, user is asked whether to create L1+L2 folder structure
4. README is regenerated with the change reflected; 5-column format enforced
5. Architecture documentation sections (S6–S11) are updated with component references
6. `ARCHITECTURE.md` navigation index is updated (add/remove only)
7. Architecture diagrams are regenerated automatically; failures are tracked with a comment marker

### Flow D — Rejected direct edit
1. User or Claude tries to edit `docs/components/README.md` directly
2. `CLAUDE.md` project rule redirects to this skill

### Flow E — C4 Multi-System Migration
1. User has existing flat `docs/components/` with non-C4 metadata
2. User invokes this skill with `migrate`
3. Skill runs Phases M1–M8: scan → classify systems → fix metadata → move files → update references → regenerate README → update ARCHITECTURE.md → verify
4. User confirms system classification (Phase M2) and ambiguous type mappings (Phase M3)
5. File moves use `git mv` if git repo detected, otherwise Read→Write→delete
6. References across docs/, adr/, handoffs/, compliance-docs/ are updated automatically
7. Final report shows all changes with any items needing manual review
