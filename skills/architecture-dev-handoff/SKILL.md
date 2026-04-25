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

As of v3.7.0, this skill is an **orchestrator**. Per-component generation runs in isolated sub-agent contexts via `agents/generators/handoff-generator.md` (model: sonnet) and `agents/builders/handoff-context-builder.md` (model: sonnet, added in v3.13.0). The orchestrator stays in main context; sub-agents do the heavy per-component reads.

- **Main context budget**: ~80–120 KB per invocation, flat regardless of how many components are selected.
- **Sub-agent budget**: ~25–40 KB per spawn (per-component payload + handoff template + section-extraction guide + ranged slice of asset guide).
- **Parallelism**: sub-agents spawn in batches of N (default 4, configurable via `--parallelism N`, capped at 8), one message per batch. Default raised from 2 in v3.13.0 — sub-agents are read-only on independent payloads, so 4-way fan-out cuts wall-clock by ~50% on 8-component runs without extra rate-limit risk on standard tiers.

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

**Step 0c — (removed in v3.13.0)**

Earlier versions mirrored four reference files (`HANDOFF_TEMPLATE.md`, `SECTION_EXTRACTION_GUIDE.md`, `ASSET_GENERATION_GUIDE.md`, `assets/_index.md`) to `/tmp/handoff-plugin-refs/` so sub-agents could Read them despite permission scoping. As of v3.13.0 those references are bundled directly into `agents/generators/handoff-generator.md` (sub-agent system prompt). Sub-agents no longer Read any plugin file at runtime, so the staging fallback is dead overhead and has been removed.

`plugin_dir` is still resolved in Steps 0a/0b — the orchestrator uses it to invoke `bun [plugin_dir]/skills/architecture-dev-handoff/utils/{prepare-payload-dir,manifest}.ts`. If a bun helper invocation fails with a permission error, check that `Bash(bun *)` is granted in project settings.

### Phase 1: Initialization

**Step 1.0: Parse orchestrator flags**

Inspect the user's invocation for flags. Default values apply when a flag is absent.

| Flag | Default | Validation | Purpose |
|------|---------|------------|---------|
| `--parallelism N` | `4` | integer 1–8; on out-of-range value, warn (`⚠ --parallelism N out of range; clamping to <1\|8>`) and clamp | Phase 5 batch size |
| `--force` | `false` | boolean (presence) | Bypass `handoffs/.manifest.json` skip-if-unchanged (see Phase 4.5 / Item 7) |

Store the resolved values as `parallelism` and `force` for use throughout the workflow. If neither flag is present, behaviour matches today's defaults except `parallelism = 4` instead of `2`.

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

**Step 2.2: Order selected components**

Sort by `component_index_position` ascending. (Earlier versions sorted by dependency count to provide upstream context for downstream handoffs, but sub-agents never read other handoff outputs — they read only their assigned payload + bundled references — so dependency ordering provides no information benefit and added N component-file Reads per orchestration. Sub-agents can fan out in any order.)

### Phase 3: Delegate shared-context build to `handoff-context-builder` sub-agent

**The core change in v3.13.0.** All shared-doc Reads, ADR indexing, per-component slicing, payload writing, dedup, and manifest skip-checks happen inside a single Sonnet sub-agent. The orchestrator's main context (running on the user's session model — typically Opus) never loads the ~80–120 KB of shared docs + ADR corpus.

**Step 3.1: Detect architecture-doc language** (kept on orchestrator — uses `ARCHITECTURE.md` already loaded in Phase 1)

Set once per run — propagated to the context-builder, which writes it into every payload's `doc_language` frontmatter field. Drives the template-variant selection for the `c4-descriptor` asset (English vs Spanish).

Detection order (stop at the first match):

1. **Explicit marker** — grep `ARCHITECTURE.md` for `<!-- LANGUAGE: es -->` or `<!-- LANGUAGE: en -->`. If found, use that value.
2. **Section-heading inference** — scan `ARCHITECTURE.md` and `docs/01-system-overview.md` for Spanish section headers that commonly appear in the canonical layout (`## Contexto`, `## Descripción`, `## Visión general`, `## Componentes`, `## Decisiones arquitectónicas`). If **two or more** distinct Spanish headings appear, set `es`. Otherwise set `en`.
3. **Default** — `en`.

(Spanish-heading detection requires a one-time Read of `docs/01-system-overview.md` on the orchestrator. Acceptable cost — one shared file, used only for the language marker check.)

**Step 3.2: Pre-cache context7 spec docs (optional, orchestrator-side)**

If the context7 MCP tool is available and one or more selected components produce asset types, call `resolve-library-id` once per unique asset spec (OpenAPI, AsyncAPI, Kubernetes, the database engine for DDL, Avro, Protobuf, Redis). Cache the resolved library IDs and fetched docs for the duration of this orchestration run. The orchestrator passes the cache path hint to handoff-generator sub-agents in Phase 5 — context-builder does not use context7.

Skip silently if context7 is unavailable.

**Step 3.3: Capture `generation_date` and prepare `/tmp/handoff-payloads/`**

```bash
generation_date=$(bun [plugin_dir]/skills/architecture-dev-handoff/utils/prepare-payload-dir.ts /tmp/handoff-payloads)
```

The helper `mkdir -p`s the payload directory and prints `YYYY-MM-DD`. Capture both for the context-builder spawn prompt.

**Step 3.4: Compute per-component metadata for the spawn prompt**

For each selected component, gather the following from its file header (15–30 line Read on the orchestrator — small, and necessary anyway for the C4 Level Validation Gate already done in Step 2.1):

- `slug` (from filename)
- `component_file` (repo-relative path)
- `type` (from `**Type:**`)
- `technology` (list, from `**Technology:**`)
- `component_index_position` (`NN-` prefix)

Pack these into a YAML list to embed in the spawn prompt body. The context-builder does NOT re-read these files for metadata extraction — it consumes the orchestrator's pre-extracted list directly. Step 3.4 keeps the orchestrator's pre-3 work consistent with what it already does for component selection.

**Step 3.5: Spawn `sa-skills:handoff-context-builder`** (single Task call, NOT batched)

Send ONE message containing one `Task()` invocation:

```
Task(sa-skills:handoff-context-builder)
prompt:
  architecture_md_path: <abs path>
  project_name: <from H1>
  architect: <from metadata, or "Not specified">
  architecture_version: <from <!-- ARCHITECTURE_VERSION: ... -->, or "unversioned">
  doc_language: <en|es from Step 3.1>
  generation_date: <YYYY-MM-DD from Step 3.3>
  payload_dir: /tmp/handoff-payloads
  manifest_path: <project>/handoffs/.manifest.json
  template_version: <plugin version from .claude-plugin/plugin.json>
  schema_version: "2"
  force: <true|false from Step 1.0>
  plugin_dir: <abs path>
  handoffs_dir_abs: <project>/handoffs
  components:
    - slug: …
      component_file: …
      type: …
      technology: [...]
      component_index_position: "NN"
    - slug: …
      …
```

Wait for the `CONTEXT_RESULT:` block. The context-builder returns:

- `status` — `OK`, `PARTIAL`, or `FAILED`
- `payload_dir`, `shared_refs_path` (optional)
- `shared_docs_read`, `adrs_indexed`, `adrs_full_read` (for the Phase 7 report)
- `parse_fallback_slugs` (components that fell back to `## Component File (raw)`)
- `components[]` — per-component `{ slug, payload_path, payload_hash, decision (SKIP|REGEN|FAILED), reason, asset_types, doc_language, handoff_file_rel }`

Failure handling:
- `status: FAILED` → abort the orchestration with the context-builder's reason.
- `status: PARTIAL` → drop FAILED components, continue with the rest, surface them in Phase 7.
- `status: OK` → all components have a SKIP or REGEN decision.

Store the `components[]` list as `context_result` for use in Phase 4 and Phase 6.

**Backward compat**: first run after upgrading from <v3.13.0 has no manifest → context-builder returns `decision: REGEN` for every component → manifest is created in Step 6.0. No surprises.

**Recommended git policy**: commit `handoffs/.manifest.json` alongside the handoff files. Teammates pulling the branch then benefit from skip-if-unchanged on their own machines. The file is small (one JSON object per component) and changes deterministically with the handoffs. If a project explicitly does not want to track it, add `handoffs/.manifest.json` to `.gitignore`; the skill works either way (just regenerates everything on the first machine that doesn't have it locally).

### Phase 4: Pre-create asset directories for REGEN components

Filter `context_result.components` to entries where `decision == REGEN`. For each one, pre-create its asset output directory so the downstream `handoff-generator` sub-agent never needs Bash:

```bash
bun [plugin_dir]/skills/architecture-dev-handoff/utils/prepare-payload-dir.ts <project>/handoffs/assets/NN-<slug>
```

(SKIP'd components keep their existing asset directories untouched. FAILED components are excluded.)

### Phase 5: Spawn handoff-generator sub-agents in N-parallel batches

**Step 5.0: Filter to REGEN components**

Take `context_result.components` (from Phase 3.5) and keep only entries with `decision == REGEN`. SKIP'd components are not spawned — their existing handoff files and manifest entries remain valid.

**Step 5.1: Partition REGEN components into batches of `parallelism`**

Use the `parallelism` value resolved in Step 1.0 (default 4, capped at 8). The tail batch may be smaller than `parallelism` if `len(regen_components) % parallelism != 0`.

**Step 5.2: Spawn one batch per message**

For each batch, send ONE message containing up to `parallelism` `Task()` tool-use blocks in parallel. Each Task invokes `sa-skills:handoff-generator` with a prompt that provides (all values come from the matching `context_result.components[]` entry):

- `payload_path`: from `payload_path` (absolute path to the component's payload file)
- `output_handoff_path`: absolute path `<project>/<handoff_file_rel>`
- `output_assets_dir`: absolute path `<project>/handoffs/assets/NN-<slug>/` (pre-created in Phase 4)
- `component_slug`, `component_index_position`
- `context7_cache_hint` (if context7 was used in Step 3.2): a path or inline summary — otherwise omit
- (`plugin_dir` is no longer required as of v3.13.0 — sub-agents bundle their references and do not invoke Bash)

**Step 5.3: Collect sub-agent results**

Each sub-agent returns a `HANDOFF_RESULT:` block with status, file paths, asset list, `[NOT DOCUMENTED]` count, and validation notes. Aggregate across all sub-agents for the final report.

If a sub-agent returns `status: PAYLOAD_FAILED` or `status: VALIDATION_FAILED`, DO NOT abort — continue with the remaining components. Report failures at the end.

**Step 5.4: Run batches sequentially**

Wait for each batch to complete before spawning the next. This keeps total parallel sub-agent count ≤ `parallelism` at any instant.

### Phase 6: Update index, manifest, and report

**Step 6.0: Update `handoffs/.manifest.json`**

For each component that the orchestrator REGEN'd AND whose handoff-generator sub-agent returned `status: OK`, insert or replace its manifest entry using the `payload_hash` already returned by `context-builder` in Phase 3.5 (no need to re-hash on the orchestrator). Skipped components keep their existing entries untouched.

```bash
bun [plugin_dir]/skills/architecture-dev-handoff/utils/manifest-cli.ts \
    update <project>/handoffs/.manifest.json \
    <slug> "<payload_hash from context_result>" <template_version> <schema_version> \
    <architecture_version> <handoff_file_rel from context_result> \
    <doc_language from context_result> <generator_version> "<asset1>,<asset2>,..."
```

The CLI writes the manifest atomically (`.tmp` then rename). One invocation per regenerated component; skipped components are left as-is so their `generated` timestamp reflects when they were last actually produced.

Components whose sub-agent run returned `status: VALIDATION_FAILED` or `status: PAYLOAD_FAILED` are NOT written to the manifest — that ensures the next run treats them as "needs regen" until the underlying problem is fixed. Same applies to components the context-builder reported as `decision: FAILED` in Phase 3.5.

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

Generated: [N] component handoff(s)  ([K] failed, [S] skipped)
Location: handoffs/

Components:
  ✓ [Component Name] — NN-name-handoff.md
      Assets: openapi.yaml, ddl.sql
      Gaps recorded: [M] open questions in §15
  ✓ [Component Name] — NN-name-handoff.md
      Assets: deployment.yaml
      Gaps recorded: 0
  ⏭ [Component Name] — skipped (unchanged since last generation)
  ⏭ [Component Name] — skipped (unchanged since last generation)
  ✗ [Component Name] — VALIDATION_FAILED: [notes]

Main-context reads (shared docs): 1 (ARCHITECTURE.md only — context-builder owns docs/04–09 + adr/)
Context-builder (sonnet) reads:
  shared docs: [shared_docs_read from CONTEXT_RESULT]
  ADRs indexed: [adrs_indexed]
  ADRs full-Read: [adrs_full_read]
Sub-agent batches: [B] ({parallelism}-parallel)
Skipped (unchanged): [S] component(s) — pass --force to regenerate

💡 Generated N handoffs. Run `/compact` to trim main context now if continuing.
```

If `[S] > 0`, list skipped components by slug on a separate line (e.g., `Skipped: inbox-ux, inbox-realtime, notification-preferences`) so the user can decide whether to `--force` a specific re-run.

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
"Write(handoffs/.manifest.json)",
"Read(handoffs/.manifest.json)",
"Write(//tmp/handoff-payloads/*)",
"Read(//tmp/handoff-payloads/*)",
"Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/**)",
"Read(~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/**)",
"Bash(bun *)",
"Agent(sa-skills:handoff-generator)",
"Agent(sa-skills:handoff-context-builder)"
```

Directory creation (`/tmp/handoff-payloads/` and `handoffs/assets/NN-<slug>/`) and the per-run `generation_date` are produced by `utils/prepare-payload-dir.ts`, so the only bash grant required is the project-wide `Bash(bun *)`. Earlier versions used `Bash(mkdir *)` plus a chained `&& date +%Y-%m-%d`, which triggered a permission prompt on every run because the chained form was not pre-approved.

**Why two plugin read grants?** `plugin_dir` may resolve to either the marketplaces manifest path or the versioned cache install path depending on how the plugin was installed. Step 0 probes readability under both. (Sub-agents no longer Read plugin files at runtime as of v3.13.0 — references are bundled into `agents/generators/handoff-generator.md` and `agents/builders/handoff-context-builder.md` — but the orchestrator still needs to invoke `bun [plugin_dir]/skills/architecture-dev-handoff/utils/*.ts` helpers, which require the bun binary to load files from `plugin_dir`.)
