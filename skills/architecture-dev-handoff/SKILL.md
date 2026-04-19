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

# Architecture Dev Handoff Skill — Orchestrator

## When This Skill is Invoked

Manually activated when users request component handoff document generation. It is NOT automatically triggered.

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

## Architecture — Orchestrator + Sub-Agent

As of v3.7.0, this skill is an **orchestrator**. Per-component generation runs in isolated sub-agent contexts via `agents/handoff-generator.md` (model: sonnet). The orchestrator stays in main context; sub-agents do the heavy per-component reads.

- **Main context budget**: ~80–120 KB per invocation, flat regardless of how many components are selected.
- **Sub-agent budget**: ~25–40 KB per spawn (per-component payload + handoff template + section-extraction guide + ranged slice of asset guide).
- **Parallelism**: sub-agents spawn in batches of 2 (per v3.6.1 high-fanout batching pattern), one message per batch.

Why this matters: previous versions re-read 7 shared architecture files plus the full `adr/` directory once per component. For a 10-component run that was ~750–2,750 KB of redundant reads. The orchestrator now reads them **exactly once** and slices per component into payload files that sub-agents consume.

See `PAYLOAD_SCHEMA.md` for the orchestrator → sub-agent contract.

---

## Purpose

This skill generates **Component Development Handoff** documents — one per component — that give development teams everything needed to implement a component without reading the full ARCHITECTURE.md suite.

**Scope:** C4 Level 2 (Container) components only. C4 Level 1 (System) descriptors are excluded — they describe system boundaries, not implementable units.

**Output location:** `handoffs/` directory at the project root

**Per-component output** (all names use **lowercase kebab-case** — no spaces, no uppercase, no underscores):
- `handoffs/NN-<component-name>-handoff.md` — 16-section handoff document
- `handoffs/assets/NN-<component-name>/` — scaffolded deliverable assets (OpenAPI spec, DDL, Kubernetes manifests, etc.)
- `handoffs/README.md` — managed index updated after each generation

The `<component-name>` slug is derived from the component file name in `docs/components/` (e.g., `docs/components/03-payment-service.md` → `handoffs/03-payment-service-handoff.md`).

---

## Template Format Preservation Policy

**CRITICAL REQUIREMENT**: Generated handoff documents MUST preserve template format exactly.

**Strict Preservation Rules:**
1. ✅ **ONLY replace explicit `[PLACEHOLDER]` tokens** — text inside `[...]` brackets
2. ✅ **PRESERVE ALL other text exactly** — including formatting, headers, structure
3. ❌ **NEVER transform template content** — no custom prose restructuring, no reformatting
4. ✅ **GAP DETECTION** — if data is not found in architecture docs, write `[NOT DOCUMENTED]` and add entry to Section 15 (Open Questions)
5. ❌ **NEVER invent** values not stated in the architecture documentation

These rules apply to both the orchestrator (payload construction) and the sub-agent (template filling).

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

## Orchestration Workflow

### Step 0 — Resolve Plugin Directory

Before any workflow, resolve the absolute path to the plugin installation so sub-agents can read the handoff template, section-extraction guide, asset-generation guide, and asset index.

**Step 0a — Glob (dev/local mode)**:

Glob for: `**/{sa-skills,solutions-architect-skills}/skills/architecture-dev-handoff/SKILL.md`

The brace expansion matches both marketplace installs (`sa-skills/` in `~/.claude/plugins/cache/...`) and local dev clones (historical repo folder `solutions-architect-skills/`). If found, strip `/skills/architecture-dev-handoff/SKILL.md` from the result to get `plugin_dir`.

**Step 0b — Marketplace fallback**:

If Glob returns nothing, set:
```
plugin_dir = ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace
```

**Step 0c — Readability probe + /tmp staging fallback** (permission safety net):

Sub-agents must be able to `Read` four files under `plugin_dir`:
- `skills/architecture-dev-handoff/HANDOFF_TEMPLATE.md`
- `skills/architecture-dev-handoff/SECTION_EXTRACTION_GUIDE.md`
- `skills/architecture-dev-handoff/ASSET_GENERATION_GUIDE.md`
- `skills/architecture-dev-handoff/assets/_index.md`

If the resolved `plugin_dir` points to a path not covered by project `.claude/settings.json` permissions (most commonly `~/.claude/plugins/cache/.../<version>/` when the grant is scoped to `~/.claude/plugins/marketplaces/`), the sub-agent's first Read will be permission-blocked and the handoff will abort.

To guarantee readability regardless of how the plugin was installed:

1. On the main thread, attempt to Read `plugin_dir/skills/architecture-dev-handoff/HANDOFF_TEMPLATE.md`.
2. If the Read succeeds, keep `plugin_dir` as-is and pass it to sub-agents.
3. If the Read fails with a permission error, stage the four reference files to `/tmp/handoff-plugin-refs/`:
   ```bash
   bun [plugin_dir]/skills/architecture-dev-handoff/utils/prepare-payload-dir.ts /tmp/handoff-plugin-refs/skills/architecture-dev-handoff/assets
   ```
   (The helper recursively `mkdir`s the path and prints today's date — discard the date here; you only need the directory.) Then Read each of the four files from the original `plugin_dir` (main-thread permissions are typically broader than sub-agent permissions) and Write each verbatim to the mirrored path under `/tmp/handoff-plugin-refs/`. Set `plugin_dir = /tmp/handoff-plugin-refs` and pass that to sub-agents.
4. If the main-thread Read also fails, abort with:
   ```
   ❌ Cannot read plugin reference files at [original plugin_dir].
      Add this to .claude/settings.json allow list and retry:
      "Read(~/.claude/plugins/cache/**)"
   ```

Store the final `plugin_dir` (either original or `/tmp/handoff-plugin-refs`) for use in all sub-agent spawn prompts.

### Phase 1: Initialization

**Step 1.1: Locate ARCHITECTURE.md**

Search order:
1. Current directory
2. Parent directory
3. `/docs` subdirectory
4. Ask user for location

Extract the project name (first H1), architect (metadata), and `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` comment value.

**Step 1.2: Validate Prerequisites**

Check for:
- `ARCHITECTURE.md` exists (navigation index)
- `docs/components/` directory exists with at least one `NN-*.md` file (may be in system subfolders for multi-system architectures)
- `docs/components/README.md` exists (if not, suggest running architecture-component-guardian sync first)
- Note: multi-system architectures use `docs/components/<system-name>/NN-*.md` with grouped tables in README.md

**Step 1.3: Load Component Index**

Read `docs/components/README.md` for the component table (5-column: #, Component, File, Type, Technology). If the table has system group headers (`### System Name`), parse all groups. If README absent, scan `docs/components/*.md` and `docs/components/**/*.md`.

Filter out non-L2 files using BOTH checks (either match excludes the file):
1. File naming heuristic: exclude files without an `NN-` prefix that match a subfolder name (e.g., `payment-system.md`) — these are C4 L1 system descriptors.
2. Metadata check: for every candidate file, read the first 15 lines and check for `**C4 Level:**`. If the value is anything other than `Container (L2)`, exclude the file.

Only files that pass both checks enter the component list. Present the component list (grouped by system if multi-system).

### Phase 2: Component Selection

**Step 2.1: Ask user which components**

Show the component index and ask:
> "Which component(s) would you like to generate a handoff for?
>   (Enter a number, component name, comma-separated list, or 'all')"

Exception: if the user explicitly named specific component(s) in their original request (e.g., "generate handoff for payment-api"), skip the prompt and use those.

Selection modes:
1. `all` → process every component in the index
2. Number (e.g., `3`) → process that component by index position
3. Component name → process that single component
4. Comma-separated → process that subset (e.g., `1, 3` or `payment-api, auth-service`)

**C4 Level Validation Gate** (applied to every selected component before proceeding):

For each selected component file, read its `**C4 Level:**` metadata field:
- `Container (L2)` → proceed
- `System (L1)` or any non-L2 value → reject: "⚠ Skipping [Component Name] — C4 Level is [value], not Container (L2). Dev handoff documents are only generated for C4 L2 (Container) components."
- Missing field → warn but proceed: "⚠ [Component Name] has no C4 Level metadata. Proceeding as L2 (Container). Consider adding `**C4 Level:** Container (L2)` to [file path]."

If all selected components are rejected, report and stop.

**Step 2.2: Dependency-Based Ordering (batch only)**

When multiple components are selected, sort by dependency count **ascending** (least dependencies first). Components with fewer dependencies provide foundational context; generating them first means heavily-dependent components have upstream handoffs available for cross-reference.

1. For each selected component, read its component file
2. Count inter-component dependencies (`**Dependencies:**`, `**Depends On:**`, integration references to other selected components)
3. Sort ascending; ties broken by index position

Skip for single-component generation.

### Phase 3: Build the shared context bundle (ONCE)

**The core change in v3.7.0.** Read every shared architecture file exactly once on the main thread, regardless of how many components are selected.

**Step 3.1: Read shared docs**

```
Read: docs/01-system-overview.md
Read: docs/04-data-flow-patterns.md
Read: docs/05-integration-points.md
Read: docs/06-technology-stack.md
Read: docs/07-security-architecture.md
Read: docs/08-scalability-and-performance.md
Read: docs/09-operational-considerations.md
Read: every file in adr/ (use Glob adr/*.md then Read each)
```

If any of these files are missing, note the gap but continue — sub-agents will emit `[NOT DOCUMENTED]` markers for any section that would have sourced from them.

**Step 3.2: Pre-cache context7 spec docs (optional, shared across components)**

If the context7 MCP tool is available and one or more selected components produce asset types, call `resolve-library-id` once per unique asset spec (OpenAPI, AsyncAPI, Kubernetes, the database engine for DDL, Avro, Protobuf, Redis). Cache the resolved library IDs and fetched docs for the duration of this orchestration run. These caches are passed to sub-agents via a path hint in the spawn prompt — sub-agents do not re-fetch.

Skip silently if context7 is unavailable.

### Phase 4: Slice the bundle per component, write payloads

For each selected component (in dependency order when batch):

**Step 4.1: Detect component type and asset types**

From the component file's `**Type:**` field, determine `component_type` and `asset_types` per the table in `PAYLOAD_SCHEMA.md`.

**Step 4.2: Slice each shared doc for this component**

Grep each shared doc for:
- The component's display name
- The component's `**Type:**` value (match by keyword)
- The technologies listed in the component's `**Technology:**` field

Retain the surrounding rows / bullets / table entries / paragraph blocks that match. Preserve original formatting — do NOT reformat, summarize, or collapse.

**Step 4.3: Slice the ADR directory**

For each ADR file, check if its body references the component name, its technology, its domain keywords, or a pattern used by it. Include matching ADRs with a body excerpt (≤30 lines, focused on the relevant paragraphs).

**Step 4.4: Write the payload file**

Before writing the first payload of the run, ensure the output directory exists and capture today's date in one bun call:
```bash
generation_date=$(bun [plugin_dir]/skills/architecture-dev-handoff/utils/prepare-payload-dir.ts /tmp/handoff-payloads)
```
The helper recursively `mkdir`s `/tmp/handoff-payloads/` and prints `YYYY-MM-DD` to stdout — capture that into `generation_date` for every payload's YAML frontmatter. Run this once per orchestration; subsequent payloads in the same run reuse the captured value.

```
Write: /tmp/handoff-payloads/<component-slug>.md
```

Format per `PAYLOAD_SCHEMA.md`:
- YAML frontmatter (component_slug, component_file, component_type, component_index_position, asset_types, architecture_version, project_name, architect, generation_date, architecture_md_path)
- Body sections in the prescribed order: Component File / Integrations / Flows / Security Requirements / Perf Targets / Ops Config / Relevant ADRs

### Phase 5: Spawn sub-agents in 2-parallel batches

**Step 5.1: Partition components into batches of 2**

Following the v3.6.1 batching pattern for high-fanout sub-agent work.

**Step 5.2: Spawn one batch per message**

For each batch, send ONE message containing two (or one for the tail batch) `Task()` tool-use blocks in parallel. Each Task invokes `sa-skills:handoff-generator` with a prompt that provides:

- `payload_path`: absolute path to the component's payload file
- `output_handoff_path`: absolute path `<project>/handoffs/NN-<slug>-handoff.md`
- `output_assets_dir`: absolute path `<project>/handoffs/assets/NN-<slug>/`
- `plugin_dir`: absolute path resolved in Step 0 (either the installed plugin root or `/tmp/handoff-plugin-refs` if staging fallback triggered) — required, never omit
- `component_slug`, `component_index_position`
- `context7_cache_hint` (if context7 was used in Step 3.2): a path or inline summary — otherwise omit

**Step 5.3: Collect sub-agent results**

Each sub-agent returns a `HANDOFF_RESULT:` block with status, file paths, asset list, `[NOT DOCUMENTED]` count, and validation notes. Aggregate across all sub-agents for the final report.

If a sub-agent returns `status: PAYLOAD_FAILED` or `status: VALIDATION_FAILED`, DO NOT abort — continue with the remaining components. Report failures at the end.

**Step 5.4: Run batches sequentially**

Wait for each batch to complete before spawning the next. This keeps total parallel sub-agent count ≤ 2 at any instant.

### Phase 6: Update index and report

**Step 6.1: Create/Update `handoffs/README.md`**

Write or update the managed index file. Format:

```
Line 1:  <!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->
Line 2:  [Architecture](../ARCHITECTURE.md) > Development Handoffs
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

| Column | Source |
|--------|--------|
| `#` | Filename prefix `NN-` → formatted as `5.N` |
| `Component` | First `# Heading` in the component file |
| `Handoff File` | `[NN-name-handoff.md](NN-name-handoff.md)` relative link |
| `Status` | `Ready` (fresh) or `Outdated` (component file newer than handoff) |
| `Assets` | Comma-separated list of generated asset filenames, or `—` if none |
| `Generated` | ISO date (`YYYY-MM-DD`) |

**Step 6.2: Update ARCHITECTURE.md Navigation**

If `ARCHITECTURE.md` does not already include a link to `handoffs/README.md`, add one under the Component Details section or at the end of the navigation table.

### Phase 7: Report

Print the aggregated report:

```
Handoff generation complete

Generated: [N] component handoff(s)  ([K] failed)
Location: handoffs/

Components:
  ✓ [Component Name] — NN-name-handoff.md
      Assets: openapi.yaml, ddl.sql
      Gaps recorded: [M] open questions in §15
  ✓ [Component Name] — NN-name-handoff.md
      Assets: deployment.yaml
      Gaps recorded: 0
  ✗ [Component Name] — VALIDATION_FAILED: [notes]

Main-context reads (shared docs): [N]
Sub-agent batches: [B] (2-parallel)

💡 Generated N handoffs. Run `/compact` to trim main context now if continuing.
```

---

## Files in This Skill

- **SKILL.md** — this file (orchestrator workflow)
- **HANDOFF_TEMPLATE.md** — 16-section template with `[PLACEHOLDER]` tokens (consumed by the sub-agent)
- **SECTION_EXTRACTION_GUIDE.md** — extraction rules per handoff section (consumed by the sub-agent)
- **PAYLOAD_SCHEMA.md** — contract between orchestrator and sub-agent
- **assets/_index.md** — asset-type → line-range map for `ASSET_GENERATION_GUIDE.md`
- **ASSET_GENERATION_GUIDE.md** — per-asset scaffold templates and rules (consumed by the sub-agent via line-range slices)

---

## Permissions required

Add to project `.claude/settings.json`:

```json
"Write(handoffs/*)",
"Read(handoffs/*)",
"Write(/tmp/handoff-payloads/*)",
"Read(/tmp/handoff-payloads/*)",
"Write(/tmp/handoff-plugin-refs/*)",
"Read(/tmp/handoff-plugin-refs/*)",
"Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/**)",
"Read(~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/**)",
"Bash(bun *)",
"Agent(sa-skills:handoff-generator)"
```

Directory creation (`/tmp/handoff-payloads/`, `/tmp/handoff-plugin-refs/`, and `handoffs/assets/NN-<slug>/`) and the per-run `generation_date` are produced by `utils/prepare-payload-dir.ts`, so the only bash grant required is the project-wide `Bash(bun *)`. Earlier versions used `Bash(mkdir *)` plus a chained `&& date +%Y-%m-%d`, which triggered a permission prompt on every run because the chained form was not pre-approved.

**Why two plugin read grants?** `plugin_dir` may resolve to either the marketplaces manifest path or the versioned cache install path depending on how the plugin was installed. Step 0 probes readability and falls back to `/tmp/handoff-plugin-refs/` if neither matches, but granting both removes the fallback path and keeps sub-agent Reads fast.
