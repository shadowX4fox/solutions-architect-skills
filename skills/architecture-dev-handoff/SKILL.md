---
name: architecture-dev-handoff
description: Generate Component Development Handoff documents from architecture documentation. Creates per-component, audience-segmented (Dev/QA/Ops) implementation guides in an 8-section condensed format with deliverable assets (OpenAPI specs, DDL scripts, Kubernetes manifests). Invoke when handing off a component for implementation, when a dev team needs implementation specs, or when generating development handoff documents.
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
- `handoffs/NN-<component-name>-handoff.md` — 8-section audience-segmented handoff document (Dev / QA / Ops tracks; TEMPLATE_VERSION 2.0.0)
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
4. ✅ **GAP DETECTION** — if data is not found in architecture docs, write `[NOT DOCUMENTED]` and add entry to section D1 (Open Questions & Assumptions)
5. ❌ **NEVER invent** values not stated in the architecture documentation

These rules apply to both the orchestrator (payload construction) and the sub-agent (template filling).

---

## Strict Source Traceability Policy

All handoff documents must trace data back to architecture docs.

1. ✅ **ONLY extract data** that explicitly exists in the architecture docs
2. ✅ **CITE source files** (e.g., `docs/components/01-api-gateway.md`, `docs/07-security-architecture.md`)
3. ✅ **NEVER infer or guess** values not stated in the docs
4. ❌ **NO INFERENCE** — even if industry standards suggest a value
5. ✅ When data is missing: write `[NOT DOCUMENTED — add to docs/NN-file.md]` and record in section D1

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
| `--parallelism N` | `4` | integer 1–8; on out-of-range value, warn (`⚠ --parallelism N out of range; clamping to <1\|8>`) and clamp | Stage 5A batch size (handoff-document fan-out) |
| `--asset-parallelism N` | `4` | integer 1–8; on out-of-range value, warn (`⚠ --asset-parallelism N out of range; clamping to <1\|8>`) and clamp | Stage 5B batch size (handoff-asset-generator fan-out, v3.14.7+) |
| `--force` | `false` | boolean (presence) | Bypass `handoffs/.manifest.json` skip-if-unchanged (see Phase 4.5 / Item 7) |

Store the resolved values as `parallelism`, `asset_parallelism`, and `force` for use throughout the workflow. If no flags are present, behaviour matches today's defaults (`parallelism = asset_parallelism = 4`).

**Why two parallelism flags?** Stage 5A spawns one Sonnet handoff-generator per component (heavier — fills the full 8-section audience-segmented document). Stage 5B spawns one asset agent per (component, asset_type) tuple — typically lighter, and a mix of Sonnet (code-style assets) and Haiku (descriptor-style asset). The two stages have different cost profiles, so they expose independent dials. Most users leave both at the default 4.

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

**Step 3.4a: Per-component explorer findings fan-out (v3.16.0+)**

Spawn `sa-skills:architecture-explorer` in findings mode once per selected component, in parallel batches of `parallelism` (the Step 1.0 value, default 4, capped at 8). Each invocation passes both `component_file` (for the `focus_component.related_adrs` allowlist) AND `query` (for line-level evidence across the canonical doc surface). The agent emits an `EXPLORE_FINDINGS` block carrying both — the per-component ADR allowlist AND the per-component shared-doc match map for Step 3.5.

For each component, send one `Task()` with this prompt body:

```
Task(sa-skills:architecture-explorer)
prompt:
  project_root: <project_root>
  component_file: <abs path to component.component_file>
  query: <component.slug>, <component.type>, <component.technology joined as ", ">
```

That's the complete prompt — no `task_type`, no `config_path`, no `agent_version`, no `extra_terms`, no `force`. The explorer (a) reads the component's `<!-- EXPLORER_HEADER -->` block and copies `related_adrs:` into `focus_component.related_adrs`, and (b) runs parallel Grep + targeted Read across the canonical doc surface (`ARCHITECTURE.md`, `docs/**/*.md`, `adr/**/*.md`) for the query terms, emitting line-level matches with headings and 3–5-line excerpts.

Collect each findings block into a per-component map keyed by slug:

```yaml
findings_by_component:
  <slug-1>:
    findings: |                          # full EXPLORE_FINDINGS YAML body
      schema_version: 2
      status: OK
      query: "<slug>, <type>, <tech>"
      total_files_matched: <N>
      total_matches: <M>
      files: [...]                       # line-level matches per file
      focus_component:
        file: docs/components/<system>/NN-<slug>.md
        related_adrs: [ADR-018, ADR-031]
        has_header: true
    explorer_status: <OK|FAILED>
    explorer_mode: <header | unheaded | failed>
  <slug-2>:
    ...
```

**Deriving `explorer_mode`**:
- `header` when the component's `focus_component.has_header == true` and `related_adrs` is populated (the canonical fast path).
- `unheaded` when `has_header == false` (legacy doc; downstream falls back to title-match against `adr_index[*].terms`).
- `failed` when the explorer returned `status: FAILED`.

Track the mode counts for the Phase 7 report. Also track `total_files_matched` and `total_matches` summed across components for the new findings-evidence telemetry line.

If any explorer call returns `FAILED` or empty `files[]`, log a warning. The context-builder will run in v3.13.0 legacy in-builder grep slicing for those slugs.

If every explorer call returns `FAILED`, omit `findings_by_component` from the context-builder spawn prompt entirely — the builder falls back to the v3.13.0 legacy path corpus-wide.

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
  template_version: <output of `bun [plugin_dir]/skills/architecture-dev-handoff/utils/manifest-cli.ts template-version [plugin_dir]/skills/architecture-dev-handoff/HANDOFF_TEMPLATE.md`>
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
  findings_by_component:                              # v3.16.0+ — from Step 3.4a
    <slug-1>:
      findings: |                                     # full EXPLORE_FINDINGS YAML body
        schema_version: 2
        status: OK
        query: "<slug>, <type>, <tech>"
        total_files_matched: <N>
        total_matches: <M>
        files: [...]
        focus_component:
          file: docs/components/<system>/NN-<slug>.md
          related_adrs: [...]
          has_header: <true|false>
      explorer_status: <OK|FAILED>
    <slug-2>:
      ...
```

(Omit the `findings_by_component` key entirely if Step 3.4a reported every component's explorer call `FAILED` — the builder falls back to the v3.13.0 legacy path that does its own ADR indexing and in-builder grep slicing. Per-component fallback applies to individual `FAILED` slugs while keeping the findings-driven path for the rest.)

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

### Phase 3.6: v1 → v2 template upgrade detection (silent auto-regen)

After receiving `context_result` from Phase 3.5, scan every component whose `decision == SKIP` for an existing handoff file written under TEMPLATE_VERSION 1.0.0 (the pre-v2 16-section format). When found, flip the decision to `REGEN` so the v1 file is rewritten under v2 on this run. This is silent and unconditional — auto-regen, not opt-in.

For each component in `context_result.components` with `decision == SKIP`:

1. Compute the handoff file path: `<project>/<handoff_file_rel>` (already provided by context-builder).
2. If the file does not exist, skip (the SKIP decision is wrong — context-builder will catch this on the next run; do not flip here).
3. Read the first ~10 lines of the file (cheap — one Read per SKIP component, no fan-out needed). Look for the literal marker `<!-- TEMPLATE_VERSION: 1.0.0 -->`.
4. If the marker is present, override `decision` from `SKIP` to `REGEN` and append a reason: `v1 template upgrade — auto-regen to TEMPLATE_VERSION 2.0.0`.
5. If the marker is `<!-- TEMPLATE_VERSION: 2.0.0 -->` (or any other v2.x), keep the SKIP decision.
6. If the marker is absent entirely (e.g., a hand-edited file), keep SKIP — flipping every unmarked file would force regen on legitimate user edits. The user can always pass `--force` to regenerate everything.

After the scan, if any component was flipped, emit ONE summary line at the top of Stage 5 (do not prompt or pause):

```
Detected N v1 handoff(s) → forcing regen to TEMPLATE_VERSION 2.0.0
```

If `N == 0`, print nothing.

This phase adds at most one Read per SKIP component (~milliseconds). REGEN'd components have their orphan-asset handling and manifest update flow through Phases 5–6 normally — no special-casing past this point.

### Phase 4: Pre-create asset directories for REGEN components

Filter `context_result.components` to entries where `decision == REGEN`. For each one, pre-create its asset output directory so the downstream `handoff-generator` sub-agent never needs Bash:

```bash
bun [plugin_dir]/skills/architecture-dev-handoff/utils/prepare-payload-dir.ts <project>/handoffs/assets/NN-<slug>
```

(SKIP'd components keep their existing asset directories untouched. FAILED components are excluded.)

### Phase 5: One-cohort parallel fan-out — handoff documents (5A) + assets (5B) concurrent, then gap merge (5C)

As of v3.14.8, Stages 5A and 5B run as a single parallel cohort rather than sequentially. The handoff-generator (5A) and handoff-asset-generator (5B) Tasks both consume only `payload_path` (already on disk after Phase 3.5) — there is no cross-dependency between a component's handoff document and its asset files. Spawning them concurrently reclaims `~min(T(5A), T(5B))` of wall-time per run; on the observed single-component run that was ~200 s, scaling to 25–35 % off Phase 5 wall-clock on multi-component runs. Stage 5C still runs after both cohorts complete, editing each component's handoff document in-place to append asset-level gaps to section D1.

**Concurrency budget (changed in v3.14.8)**: At any instant, the total number of in-flight sub-agents is `parallelism + asset_parallelism` (default 4 + 4 = 8), not `max(parallelism, asset_parallelism)`. Cap each individually at 8 (so the absolute ceiling is 16). If your project rate-limits aggressively, lower `--parallelism` and/or `--asset-parallelism` accordingly.

**Step 5.0: Build both queues from REGEN components**

Take `context_result.components` (from Phase 3.5) and keep only entries with `decision == REGEN`. SKIP'd components are not spawned — their existing handoff files, asset files, and manifest entries remain valid.

From the REGEN list, build BOTH queues up-front:

1. **Handoff queue** — one entry per REGEN component (input for Stage 5A handoff-generator Tasks).
2. **Asset queue** — for each REGEN component, expand its `asset_types[]` into one tuple per asset (input for Stage 5B handoff-asset-generator Tasks). Use the static filename map and model-tier classification table below. **Important — eager asset spawning**: the asset queue is built from the REGEN list directly, NOT gated on Stage 5A success. Pre-v3.14.8 behavior was "drop from asset queue when 5A fails", but the queues now spawn together so this gating is no longer possible. See "Failure handling" below.

If a component's `asset_types[]` is empty (skip-list type), no asset tuples are emitted for it. The component still appears in the Stage 6 manifest update (with `assets: ""`) and the Phase 7 report.

**Asset filename map** (also embedded in `handoff-asset-generator` and in `assets/_index.md`):

| asset_type | Filename |
|------------|----------|
| `openapi` | `openapi.yaml` |
| `ddl` | `ddl.sql` |
| `deployment` | `deployment.yaml` |
| `asyncapi` | `asyncapi.yaml` |
| `cronjob` | `cronjob.yaml` |
| `avro` | `schema.avsc` |
| `protobuf` | `schema.proto` |
| `redis` | `redis-key-schema.md` |
| `c4-descriptor` | `c4-descriptor.md` |

**Asset → model tier classification** (frozen — change only by an explicit ADR):

| asset_type | Tier | Model | Rationale |
|------------|------|-------|-----------|
| `openapi`, `ddl`, `deployment`, `asyncapi`, `cronjob`, `avro`, `protobuf`, `redis` | code | `sonnet` | Strict syntactic schemas (YAML, SQL, Avro, Protobuf, structured Redis key/TTL/eviction tables) — Sonnet's structural precision matters |
| `c4-descriptor` | descriptor | `haiku` | Free-form markdown one-pager (EN/ES variant); template-fill task well within Haiku's capability |

Order the asset queue by `(component_index_position, asset_type)` for determinism. Order the handoff queue by `component_index_position` for determinism.

---

#### Step 5.1: Spawn the combined cohort

Send ONE message containing up to `parallelism` handoff-generator Tasks **plus** up to `asset_parallelism` handoff-asset-generator Tasks, all in parallel. Per-Task model pin still applies to the asset Tasks.

**Handoff Task** (one per REGEN component, up to `parallelism` per cohort message):

```
Task(subagent_type="sa-skills:handoff-generator", prompt="...")
```

Prompt body provides (from the matching `context_result.components[]` entry):

- `payload_path`: absolute path to the component's payload file
- `output_handoff_path`: absolute path `<project>/<handoff_file_rel>`
- `component_slug`, `component_index_position`
- `asset_types`: copy of the payload's `asset_types[]` array — handoff-generator uses this to deterministically populate section C3 from the static filename map
- `context7_cache_hint` (if context7 was used in Step 3.2): a path or inline summary — otherwise omit

(`output_assets_dir` is not passed — handoff-generator does not write asset files. `plugin_dir` is not required — sub-agents bundle their references and do not invoke Bash.)

**Asset Task** (one per asset tuple, up to `asset_parallelism` per cohort message). Set the `model:` parameter on each Task call to the tuple's `model_tier` — this overrides the agent's frontmatter (which is intentionally unset). Pattern modeled on `architecture-compliance/SKILL.md:863, 890`:

```
Task(subagent_type="sa-skills:handoff-asset-generator", model="<sonnet|haiku>", prompt="...")
```

Prompt body provides:
- `payload_path`
- `asset_type`
- `output_asset_path` (computed from the static filename map)
- `component_slug`
- `doc_language` (relevant only for `c4-descriptor`; pass through for all asset types so the agent does not need to re-derive it)
- `context7_cache_hint` (if context7 was used in Step 3.2 — otherwise omit)

**Tail-batching**: when both queues have remaining work after the first message, send subsequent messages each containing up to `parallelism` handoff Tasks + up to `asset_parallelism` asset Tasks. The cohort size of the tail batch may be smaller. Wait for each cohort message to complete before sending the next — this keeps in-flight sub-agents bounded by `parallelism + asset_parallelism`.

---

#### Step 5.2: Collect results from both cohorts

Each handoff-generator returns a `HANDOFF_RESULT:` block with status, handoff file path, `[NOT DOCUMENTED]` count, and validation notes. Each handoff-asset-generator returns an `ASSET_RESULT:` block:

```
ASSET_RESULT:
  component_slug: <slug>
  asset_type: <token>
  status: OK | VALIDATION_FAILED | PAYLOAD_FAILED
  asset_path: <abs path>
  gaps:
    - field: "..."
      recommended_location: "..."
      impact: "..."
  validation_notes: "..."
```

Aggregate handoff results across all components, and index asset results by `component_slug` for Stage 5C. Track per-tier counts (`sonnet_count`, `haiku_count`) for Phase 7. Do NOT abort on any single failure — continue collecting and report at the end.

**Failure handling — orphaned assets when 5A fails (v3.14.8+)**: Because asset Tasks are spawned eagerly from the REGEN list (not gated on 5A success), a component whose handoff-generator returns `PAYLOAD_FAILED` or `VALIDATION_FAILED` may still have asset files written to disk by its asset Tasks. Treatment:

1. **Leave orphaned asset files on disk.** They are valid stand-alone artifacts (YAML/SQL/manifests). Deleting them would require `rm` in the orchestrator — explicitly avoided post-v3.13.0 because file removal is hard to gate by permission.
2. **Phase 6 (manifest update) already filters to `5A.status == OK`** — orphaned assets do NOT enter the manifest's `assets` field, so they get overwritten on the next successful run.
3. **Phase 7 reports orphans** — for each component with `5A.status != OK` and at least one `5B.status == OK` asset, emit a separate line: `Asset written but handoff doc failed: <asset_path> — will be regenerated next run`.

This trade is intentional: the wasted token cost (one component's asset cohort) is bounded and re-runs naturally clean up on the next successful pass; the wall-time savings (~200 s/component) accrue on every run regardless of failure rate. Track the 5A failure rate in Phase 7 — if it sustains above ~5 %, revisit (e.g. add a cheap pre-flight payload sanity check that gates 5B spawn).

---

#### Stage 5B asset queue — historical reference (v3.14.7 sequencing)

Pre-v3.14.8, Stage 5B ran after Stage 5A completed for all components, with the asset queue built from `5A.status == OK` only. The current v3.14.8 sequencing collapses 5A.* and 5B.* into the parallel cohort above. The model-tier classification, filename map, and per-asset prompt body are unchanged — only the spawn ordering changed.

<details>
<summary>Pre-v3.14.8 sequential stages (kept for upgrade-path reference)</summary>

**Step 5B.1: Build the flat asset queue**

For every component where Stage 5A returned `status: OK`, expand its `asset_types[]` into one tuple per asset:

```yaml
- component_slug: <slug>
  component_index_position: <NN>
  asset_type: <token>
  payload_path: <abs path to payload>
  output_asset_path: <project>/handoffs/assets/NN-<slug>/<filename>
  doc_language: <en|es>
  model_tier: <sonnet | haiku>
```

`output_asset_path` is computed from the static filename map below. `model_tier` is computed from the static asset → tier classification table — no runtime lookup needed.

**Asset filename map** (also embedded in `handoff-asset-generator` and in `assets/_index.md`):

| asset_type | Filename |
|------------|----------|
| `openapi` | `openapi.yaml` |
| `ddl` | `ddl.sql` |
| `deployment` | `deployment.yaml` |
| `asyncapi` | `asyncapi.yaml` |
| `cronjob` | `cronjob.yaml` |
| `avro` | `schema.avsc` |
| `protobuf` | `schema.proto` |
| `redis` | `redis-key-schema.md` |
| `c4-descriptor` | `c4-descriptor.md` |

**Asset → model tier classification** (frozen — change only by an explicit ADR):

| asset_type | Tier | Model | Rationale |
|------------|------|-------|-----------|
| `openapi`, `ddl`, `deployment`, `asyncapi`, `cronjob`, `avro`, `protobuf`, `redis` | code | `sonnet` | Strict syntactic schemas (YAML, SQL, Avro, Protobuf, structured Redis key/TTL/eviction tables) — Sonnet's structural precision matters |
| `c4-descriptor` | descriptor | `haiku` | Free-form markdown one-pager (EN/ES variant); template-fill task well within Haiku's capability |

If `asset_types[]` is empty for a component (skip-list type), no tuples are emitted for it. The component still appears in the Stage 6 manifest update (with `assets: ""`) and the Phase 7 report.

**Step 5B.2: Partition the asset queue into batches of `asset_parallelism`**

Use the `asset_parallelism` value resolved in Step 1.0 (default 4, capped at 8). Order the queue by `(component_index_position, asset_type)` for determinism, then partition. The tail batch may be smaller than `asset_parallelism`.

**Step 5B.3: Spawn one asset batch per message**

For each batch, send ONE message containing up to `asset_parallelism` `Task()` tool-use blocks in parallel. Each Task invokes `sa-skills:handoff-asset-generator`. **Set the `model:` parameter on each Task call to the tuple's `model_tier`** — this overrides the agent's frontmatter (which is intentionally unset). Pattern modeled on `architecture-compliance/SKILL.md:863, 890`:

```
Task(subagent_type="sa-skills:handoff-asset-generator", model="<sonnet|haiku>", prompt="...")
```

The prompt body provides:
- `payload_path`
- `asset_type`
- `output_asset_path`
- `component_slug`
- `doc_language` (relevant only for `c4-descriptor`; pass through for all asset types so the agent does not need to re-derive it)
- `context7_cache_hint` (if context7 was used in Step 3.2 — otherwise omit)

**Step 5B.4: Collect ASSET_RESULT blocks**

Each agent returns an `ASSET_RESULT:` block:
```
ASSET_RESULT:
  component_slug: <slug>
  asset_type: <token>
  status: OK | VALIDATION_FAILED | PAYLOAD_FAILED
  asset_path: <abs path>
  gaps:
    - field: "..."
      recommended_location: "..."
      impact: "..."
  validation_notes: "..."
```

Index results by `component_slug` for Stage 5C. If a Task returns `VALIDATION_FAILED` or `PAYLOAD_FAILED`, log it; do NOT abort — the component's handoff document is already written and other assets continue. Failures are surfaced in Phase 7. Track per-tier counts (`sonnet_count`, `haiku_count`) for the Phase 7 report.

**Step 5B.5: Run asset batches sequentially**

Wait for each batch to complete before spawning the next. This keeps total parallel asset-agent count ≤ `asset_parallelism` at any instant.

</details>

---

#### Step 5.3: Asset-gap merge into section D1

For each component slug where Step 5.2 produced at least one non-empty `gaps[]`, perform ONE `Edit` on the component's handoff document to append asset-level gaps to section D1 (Open Questions and Assumptions). Components with zero asset gaps are skipped (no Edit). Components whose handoff-generator (5A) returned `PAYLOAD_FAILED` or `VALIDATION_FAILED` are skipped here too — there is no handoff doc to edit; their orphaned assets are surfaced separately in Phase 7.

**Step 5.3.1: Build the merged gap block per component**

Group all `gaps[]` from `ASSET_RESULT` by `component_slug`. For each component, render one block of lines using this format (matching the existing section D1 idiom):

```
- **Asset — <asset_filename>**: <field>
  → Recommended location: <recommended_location>
  → Impact: <impact>
```

Concatenate one entry per gap, ordered first by `asset_type` (alphabetical), then by gap order within that asset.

**Step 5.3.2: Edit each handoff document once**

For each component_slug with a non-empty gap block, do ONE `Edit` call on `<project>/<handoff_file_rel>`. Use the existing section D1 anchor in the handoff document:

- Find the literal placeholder text:
  ```
  [OPEN_QUESTIONS_LIST or "No gaps detected — all sections fully documented."]
  ```
  This line appears verbatim only when handoff-generator emitted no A1–C2 gaps. Replace it with the rendered gap block.
- If that placeholder is NOT present (handoff-generator already substituted it with handoff-level gaps), append the gap block to the end of section D1 by anchoring on the line `**Format for each gap:**` and inserting the new block above it.

If neither anchor is found (the handoff document failed validation), skip the Edit and surface the slug in Phase 7 with note `asset-gap merge skipped: section D1 anchor not found`.

**Step 5.3.3: Confirm Edit success**

The Edit tool returns success/failure. On failure, log the slug + failure reason; do not retry.

This step adds at most one Edit per component — typically 0 to N components depending on how many have asset-level gaps. There is no parallelism budget for Step 5.3; the orchestrator runs Edits sequentially in slug order.

### Phase 6: Update index, manifest, and report

**Step 6.0: Update `handoffs/.manifest.json`**

For each component that the orchestrator REGEN'd AND whose handoff-generator sub-agent returned `status: OK`, insert or replace its manifest entry using the `payload_hash` already returned by `context-builder` in Phase 3.5 (no need to re-hash on the orchestrator). Skipped components keep their existing entries untouched.

The `<asset1>,<asset2>,...` argument is the comma-separated list of asset filenames the orchestrator built deterministically from the payload's `asset_types[]` (filename map in Step 5.0). Filter the list to assets whose `ASSET_RESULT.status == OK` from Step 5.2 — failed asset Tasks do not appear in the manifest's `assets` field, which forces them to be retried on the next run.

```bash
bun [plugin_dir]/skills/architecture-dev-handoff/utils/manifest-cli.ts \
    update <project>/handoffs/.manifest.json \
    <slug> "<payload_hash from context_result>" <template_version> <schema_version> \
    <architecture_version> <handoff_file_rel from context_result> \
    <doc_language from context_result> <generator_version> "<asset1>,<asset2>,..."
```

`<template_version>` is the same value passed into the context-builder in Step 3.5 — sourced from the `<!-- TEMPLATE_VERSION: -->` marker inside `HANDOFF_TEMPLATE.md` via `manifest-cli.ts template-version`. Cache it once at the top of Phase 6 rather than re-running the CLI per component. Bumping the plugin version no longer invalidates manifest entries when the handoff template is byte-identical (v3.14.8+); only a `TEMPLATE_VERSION` bump or template content change does.

The CLI writes the manifest atomically (`.tmp` then rename). One invocation per regenerated component; skipped components are left as-is so their `generated` timestamp reflects when they were last actually produced.

Components whose handoff-generator (5A) sub-agent run returned `status: VALIDATION_FAILED` or `status: PAYLOAD_FAILED` are NOT written to the manifest — that ensures the next run treats them as "needs regen" until the underlying problem is fixed. Same applies to components the context-builder reported as `decision: FAILED` in Phase 3.5. Asset-level (5B) failures alone do not block the manifest update — only the failing asset is dropped from the `assets` field, while the handoff document and successful assets are still recorded. **Orphaned assets** (5B succeeded but 5A failed for the same component, possible since v3.14.8's eager-spawn cohort) are also excluded from the manifest, which guarantees they get overwritten on the next successful run.

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
      Gaps recorded: [M] open questions in D1
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
Explorer mode (per component): header: [Ch] | unheaded: [Cu] | failed: [Cf]   (v3.16.0+ — `header` is the canonical fast path: `findings.focus_component.has_header == true`; `unheaded` falls back to title-match against `adr_index[*].terms`; `failed` invokes the legacy v3.13.0 in-builder grep slicing path for that component)
Explorer findings (per component): [TFM] matched files / [TM] total matches across [N] component(s)   (v3.16.0+ — sum of `findings.total_files_matched` and `findings.total_matches` across all OK components; surfaces how much line-level evidence the context-builder starts from instead of grepping the shared docs itself)
Phase 5 cohort messages:   [B_C] cohort(s) — handoff Tasks: {parallelism}-parallel sonnet | asset Tasks: {asset_parallelism}-parallel (sonnet: [X], haiku: [Y])
Step 5.3 gap-merge edits:  [E] component(s) had asset-level gaps merged into D1
5A failure rate:           [Kf] / [N_regen] handoff doc(s) failed ([P]%) — revisit gating if sustained > 5%
Orphaned assets:           [O] asset file(s) written for components whose handoff doc failed (will be regenerated next run)
Skipped (unchanged):       [S] component(s) — pass --force to regenerate

💡 Generated N handoffs. Run `/compact` to trim main context now if continuing.
```

If `[S] > 0`, list skipped components by slug on a separate line (e.g., `Skipped: inbox-ux, inbox-realtime, notification-preferences`) so the user can decide whether to `--force` a specific re-run.

If `[O] > 0`, list each orphaned asset file on its own line as: `Asset written but handoff doc failed: <abs_asset_path> — will be regenerated next run`. These appear when a component's handoff-generator (5A) returned `PAYLOAD_FAILED|VALIDATION_FAILED` while one or more of its asset Tasks (5B) succeeded — a side-effect of v3.14.8's eager-spawn parallelization. The next clean run produces both the handoff doc and overwrites the orphans.

---

## Files in This Skill

- **SKILL.md** — this file (orchestrator workflow)
- **HANDOFF_TEMPLATE.md** — 8-section audience-segmented template with `[PLACEHOLDER]` tokens (consumed by the sub-agent)
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
"Agent(sa-skills:handoff-asset-generator)",
"Agent(sa-skills:handoff-context-builder)"
```

Directory creation (`/tmp/handoff-payloads/` and `handoffs/assets/NN-<slug>/`) and the per-run `generation_date` are produced by `utils/prepare-payload-dir.ts`, so the only bash grant required is the project-wide `Bash(bun *)`. Earlier versions used `Bash(mkdir *)` plus a chained `&& date +%Y-%m-%d`, which triggered a permission prompt on every run because the chained form was not pre-approved.

**Why two plugin read grants?** `plugin_dir` may resolve to either the marketplaces manifest path or the versioned cache install path depending on how the plugin was installed. Step 0 probes readability under both. (Sub-agents no longer Read plugin files at runtime as of v3.13.0 — references are bundled into `agents/generators/handoff-generator.md` and `agents/builders/handoff-context-builder.md` — but the orchestrator still needs to invoke `bun [plugin_dir]/skills/architecture-dev-handoff/utils/*.ts` helpers, which require the bun binary to load files from `plugin_dir`.)
