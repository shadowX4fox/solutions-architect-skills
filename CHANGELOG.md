# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.14.4]

### Added — `architecture-explorer` integration for `architecture-dev-handoff` (per-component ADR allowlists)

**Symptom (cost): the dev-handoff flow was paying for ADR classification on Sonnet.** The Sonnet `handoff-context-builder` indexed every ADR (first-30-line read × N), then full-read the matched subset per component. On a project with 38 ADRs and 8 components, that's ~38 indexing reads + ~50 full reads on Sonnet — even though only 4–9 ADRs are typically relevant per component.

**Root cause: missing wiring.** The infrastructure to fix this had been in place since v3.14.0 — the universal `architecture-explorer` agent (Haiku tier) and its `agents/configs/explorer/handoff-component.json` config — but the dev-handoff orchestration never invoked the explorer; it kept doing its own Sonnet-tier classification.

**Fix (single PR, three files):**

#### `agents/builders/architecture-explorer.md`

Extended `extra_terms` support to `task_family: handoff` (was previously `question` and `adr` only). Per-component fan-out can now pass `[<slug>, <type>, ...<technology>]` as runtime boost terms with weight 4 to differentiate one component's classification from another's on the same shared corpus.

#### `agents/builders/handoff-context-builder.md`

New `explore_results` input parameter — a YAML map of `{ <slug>: { relevant_files: [], cache_hit: bool, explorer_status } }`. Workflow phases revised:

- **PHASE 1 (read shared docs)**: when `explore_results` is present, reads only files in the **union** of every component's `relevant_files[]`. The 9 always-included files (7 shared docs + `ARCHITECTURE.md` + `docs/components/README.md`) are guaranteed by the config's `required_sections[]`. ADRs read here are deferred to PHASE 3.3 (full content needed only when slicing per-component).
- **PHASE 2 (ADR indexing pass)**: skipped entirely when `explore_results` is present — the explorer already classified ADR relevance. Sonnet first-30-line scan disappears.
- **PHASE 3.3 (per-component ADR lookup)**: takes the per-component ADR allowlist directly from `explore_results[<slug>].relevant_files[]` filtered to `adr/*.md`. Full-Read each, excerpt at the explorer's `matched_sections[]`, format under `## Relevant ADRs`.
- **CONTEXT_RESULT contract**: preserved exactly. `handoff-generator` requires no changes.
- **Legacy fallback**: when `explore_results` is absent (every explorer call returned `FAILED`), runs the v3.13.0 indexing pass as before. Fail-open by design.

Agent version 1.0.0 → 1.1.0.

#### `skills/architecture-dev-handoff/SKILL.md` Phase 3

New **Step 3.4a**: per-component explorer fan-out, parallelism-batched (uses the same default-4, capped-at-8 setting as the existing handoff fan-out). Each invocation:

```yaml
task_type: handoff-component
config_path: <plugin_dir>/agents/configs/explorer/handoff-component.json
extra_terms:
  - <component.slug>
  - <component.type>
  - <each entry from component.technology[]>
```

Collects per-component `EXPLORE_RESULT.relevant_files[]` into a map keyed by slug. Step 3.5 (the existing context-builder spawn) is extended to include the `explore_results` map in its prompt body.

If any explorer call returns `FAILED`, that component's allowlist falls back to the config's `required_sections[]` only (the 9 always-relevant entries) and the context-builder runs the legacy indexing pass for it. If every explorer call fails, the `explore_results` key is omitted entirely — the v3.13.0 path runs as before.

#### Concrete savings (38 ADRs, 8 components — a real-world shape)

- **Sonnet tokens**: ~10K saved on the indexing pass (the 38×30-line scan disappears). Per-component ADR full-reads drop ~20–30% as the explorer's `score_threshold: 0.20` filters genuinely irrelevant ADRs before Sonnet sees them.
- **Haiku tokens**: ~200 per component for classification — effectively free vs Sonnet equivalents.
- **Cache hits**: zero Haiku tokens on repeat runs (cache-keyed by candidate-file mtimes + plugin version + config mtime).
- **Wall-clock**: builder phase ~2m → ~45s on the same input (estimated; depends on doc-tree size).

#### Required-section safeguard (false-negative protection)

`handoff-component.json` declares `ARCHITECTURE.md`, `docs/01-system-overview.md`, `docs/04-data-flow-patterns.md`, `docs/05-integration-points.md`, `docs/06-technology-stack.md`, `docs/07-security-architecture.md`, `docs/08-scalability-and-performance.md`, `docs/09-operational-considerations.md`, and `docs/components/README.md` as `required_sections[]`. Every component's `relevant_files[]` includes them regardless of score. The runtime parser (`skills/architecture-explorer/utils/parse-explore-result.ts`) rejects any `EXPLORE_RESULT` that omits a required entry, falling back to the legacy path. Payload coverage stays lossless.

#### Verification

- `bun run typecheck` clean.
- `bun test` passes (478/478, no test changes).
- The `handoff-component.json` config (shipped in v3.14.0) needed no changes — already correctly shaped for the new flow.

#### Migration

No user action required. Re-running any handoff after upgrading to v3.14.4 picks up the new flow automatically. The v3.13.0 manifest format and CONTEXT_RESULT contract are preserved; existing handoff files remain valid.

**Roadmap shift**: per-skill compliance integration was previously slated for v3.14.4 → v3.14.5. Analysis / peer-review / docs / ADR follow at v3.14.6 / v3.14.7 / v3.14.8 / v3.14.9. The original v3.14.0 plan reserved v3.14.7 for this dev-handoff work — bringing it forward kept the user's active pain (visible cost on every handoff) on the critical path.

## [3.14.3]

### Fixed — `enabledPlugins` key aligned with marketplace plugin name + auto-migration of legacy entries

**Symptom**: `/plugin → Errors` showed `Plugin "solutions-architect-skills" not found in marketplace "shadowx4fox-solution-architect-marketplace"` after install or `/reload-plugins`. The plugin still loaded (cache was already extracted), but Claude Code couldn't reconcile the registration on each reload, so the error persisted.

**Root cause**: the marketplace registers the plugin as `sa-skills` (matches `plugin.json`'s `name` field), but four user-facing files still referenced the older `solutions-architect-skills` name from before the marketplace rename:

- `.claude/settings.json.example` → `enabledPlugins` key (the one `/setup` merges into every consuming project).
- `README.md` → `/plugin install` one-liner.
- `docs/INSTALLATION.md` → install one-liner + manual `enabledPlugins` snippet.

Claude Code resolves `enabledPlugins` keys against `marketplace.json plugins[].name`, so the stale legacy key produced "Plugin not found in marketplace" on every reload.

**Fix**:

- All four references updated to `sa-skills@shadowx4fox-solution-architect-marketplace`.
- `scripts/setup-permissions.ts` extended with auto-migration: any user `enabledPlugins["solutions-architect-skills@<marketplace>"]` is renamed to `sa-skills@<marketplace>` (boolean value preserved, stale key dropped). Idempotent — re-running `/setup` on already-migrated settings is a no-op.
- New loud merge-summary line when migration fires: `🔄 Migrated 1 legacy enabledPlugins entry…` so the user sees exactly what changed and why.
- Unrelated user plugins under any name are preserved verbatim.

**Verification**:

- `bun run typecheck` clean, `bun test` 478/478.
- End-to-end smoke: fixture project with `solutions-architect-skills@…` legacy key + an unrelated `some-other-plugin@…` entry → migration renames the sa-skills key, leaves the unrelated plugin alone, second run reports `Plugins: added 0 · already present 1` with no migration line (idempotent).

**Migration**: run `/setup` once. The migration line in the merge summary confirms the rename. Then `/reload-plugins` and the `/plugin → Errors` tab clears.

**Roadmap**: per-skill explorer wiring shifts again — compliance integration moves from v3.14.3 → v3.14.4 (chain pushed by 1).

## [3.14.2]

### Fixed — `architecture-explorer` Tool Discipline tightened to eliminate spurious permission prompts

**Symptom**: Q&A workflows that routed through the `architecture-explorer` Haiku-tier classifier triggered a Claude Code permission prompt mid-run when the agent staged its EXPLORE_RESULT YAML to `/tmp/explore_result.yaml` via a Bash here-doc (`cat > /tmp/explore_result.yaml << 'EOF'`). The prompt fired because `Bash(cat *)` is not allowlisted in `.claude/settings.json.example` — the project's permission model deliberately routes file writes through the Write tool (path-globbed, auditable) or through `Bash(bun *)`, never through Bash redirection.

**Root cause** (prompt design, not code or permission misconfiguration):

1. The `agents/builders/architecture-explorer.md` "FORBIDDEN" list banned `cat`, `head`, `tail`, `grep`, `find`, `sed`, `awk` "for reading" — leaving the model an opening to use them for *writing* via redirection.
2. The cache-write step said "use the CLI **or** the Write tool — the CLI accepts either," which named two paths but never marked them as the only legal forms. The Haiku model invented a third (heredoc).
3. The workflow implicitly suggested staging the YAML to a temp file before emitting it; in fact the EXPLORE_RESULT block was always meant to be emitted inline as the agent's final response.

**Fix** (single-file, prompt-only):

- **Reframed FORBIDDEN list**: bans are now unconditional and apply for any purpose (read, write, pipe, redirect). Explicit examples added for redirected forms (`cat > file`, `cat >> file`, `tee file`, `command > file`, here-doc).
- **New WRITES discipline block**: names exactly two legal write surfaces — `bun explore-cli.ts write-cache` (under existing `Bash(bun *)`) or the Write tool at the cache path (under existing `Write(//tmp/architecture-explorer/**)`). No third path is permitted.
- **Removed implied scratch-file staging**: the EXPLORE_RESULT YAML is emitted inline in the agent's final response. There is no `/tmp/explore_result.yaml` intermediate.
- **Added why-strict footnote** explaining the project's permission model so future maintainers don't loosen the lock.

**Behavior change**: every architecture-explorer invocation (cache miss or cache hit) runs silently end-to-end with the v3.14.0 baseline `.claude/settings.json` permissions. No prompt at any stage.

**Verification**: `bun run typecheck` ✅, `bun test` 478/478 ✅. No CLI changes (`explore-cli.ts write-cache` already exists since v3.14.0); no permission changes (loosening `Bash(cat *)` would create a write-anywhere primitive — explicitly rejected); no test changes.

**Roadmap shift**: per-skill explorer wiring previously slated for v3.14.2 → v3.14.7 moves to v3.14.3 → v3.14.8. Compliance integration is now the v3.14.3 release.

## [3.14.1]

### Added — Session-scoped EXPLORER_HEADER edit tracker + batch refresh

Closes the v3.14.0 feedback gap: when bodies under `docs/**/*.md` get edited, their `<!-- EXPLORER_HEADER -->` blocks silently drift. The `architecture-explorer` agent classifies relevance off those headers, so drift quietly degrades downstream classification. v3.14.1 adopts a **batch model** — per-edit autofix was deliberately rejected; per-doc work added complexity without clear wins. Instead: track every edit in a session-scoped log, surface one TODO while the log is non-empty, and let one slash command refresh the whole batch with the LLM when the user is ready.

#### New files

- `skills/architecture-explorer-headers/utils/session-log.ts` — `appendEdit`, `readSessionEdits`, `clearSessionEdits`, `retainSessionEdits`, `sessionLogPath`. Storage `/tmp/architecture-explorer/sessions/<projectHash>-<sessionId>.editlog`, JSONL one-line-per-edit. ARCHITECTURE.md, docs/README.md, paths outside docs/** are silently dropped.
- `skills/architecture-explorer-headers/utils/session-log.test.ts` — 13 tests (Bun): append + read happy path, dedup-on-read, exempt-path no-ops, malformed-line skipping, latest-first ordering, clear, retain, sessionLogPath sanitization.

#### CLI

- `header-cli.ts session-log {add | list | count | clear}` — all exit-0 on success, suitable for the hot PostToolUse hook path. `add` infers project root from the file's nearest `CLAUDE.md` / `ARCHITECTURE.md` / `.git` ancestor; `list` / `count` / `clear` accept an explicit `--project-root` flag.

#### Hooks (default-on via `/setup`)

- `.claude/settings.json.example` carries a real `hooks.PostToolUse[Write|Edit]` entry that calls the tracker on every doc edit. Per-edit cost ~10 ms (bun startup + JSONL append). Never blocks user edits, never invokes an LLM.
- `scripts/setup-permissions.ts` extended to merge `hooks` into the user's `settings.json` with idempotent recognition of the sa-skills marker (`header-cli.ts session-log add`). Existing user hooks under any matcher are preserved verbatim. Re-running `/setup` reports the hook under "already present" once installed.
- Merge summary now includes a fourth `Hooks: added X · already present Y` line.

#### Slash command

- `/regenerate-explorer-headers --session` (also exposed in the skill's Activation Forms): reads the editlog, runs LLM-driven regeneration only on the listed files (with implicit `--force` since they're already published), and clears the editlog on success. Combine with `--dry-run` to preview without LLM calls or log mutation. Partial failures retain the failing files in the log so a re-run picks them up.

#### Orchestrator-managed TODO

- `scripts/setup-claude-md.ts` extends the managed CLAUDE.md block with a new `### Session edit tracker — keep EXPLORER_HEADERs honest` subsection. Claude (the orchestrator in the user's main session) is instructed to keep one and only one task on the user-visible task list (`Regenerate EXPLORER_HEADERs for N session-edited docs (run /regenerate-explorer-headers --session)`) whenever the editlog is non-empty. Never auto-runs the slash command — surfaces the action; the user decides.

#### Per-skill pre-flight

`Pre-flight: Session-Edit Check` blocks added to:

- `skills/architecture-compliance/SKILL.md` — before Phase 1.
- `skills/architecture-analysis/SKILL.md` — before Step 0.
- `skills/architecture-peer-review/SKILL.md` — before Step 0.
- `skills/architecture-dev-handoff/SKILL.md` — before Step 0.
- `skills/architecture-docs/SKILL.md` — Q&A workflows only (editing workflows are the *source* of edits).
- `skills/architecture-definition-record/SKILL.md` — before context-gather Workflows 2 / 4.

Each pre-flight runs `header-cli.ts session-log count`. On `0` it stays silent. On `N > 0` it emits a loud preamble naming affected files and the `/regenerate-explorer-headers --session` action, then continues running (non-blocking). The skill's final report metadata gains a `headers_status: stale-edits-pending` flag so downstream consumers can grep for runs based on partially-stale headers.

#### Modified

- `commands/regenerate-explorer-headers.md` — documents the `--session` flag and `--session --dry-run` combination.
- `skills/architecture-explorer-headers/SKILL.md` — Phase 1 alternate `--session` mode that reads from the editlog instead of the disk inventory; Phase 4 reports cleared/retained editlog state. Skill version bumped 1.0.0 → 1.1.0.
- `commands/setup.md` — documents the hook-merge whitelist addition and the new `### Optional: enable EXPLORER_HEADER staleness checks` companion section.
- `CLAUDE.md` — trigger-routing row for `regenerate-explorer-headers` documents the new `--session` flag and adds matching trigger phrases.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json` — version 3.14.0 → 3.14.1.

#### Verification

- `bun run typecheck` clean.
- `bun test` passes (478/478, 13 new `session-log` tests on top of 465 pre-existing).
- `/setup` end-to-end smoke: fresh project creates settings + CLAUDE.md + .gitignore + hooks; idempotent re-run reports 0 added under every section; pre-existing user hooks under same matcher are preserved verbatim.

## [3.14.0]

### Added — Universal `architecture-explorer` Haiku-tier doc classifier (infrastructure)

Front-door classifier for every doc-consuming workflow in the plugin. Treats ARCHITECTURE.md, `docs/`, `adr/`, and `docs/components/**` as a universe and answers one question per file: *is this relevant to the current task?* Reads only the first 60 lines + headings of each candidate (sampling, not synthesis), so classification stays cheap on Haiku while keeping the user's main session (typically Opus) and downstream synthesis agents (Sonnet/Opus validators, generators, reviewers) off the redundant-read treadmill.

**Why this matters**: a 10-contract compliance run today does ~1.8 MB of redundant Opus reads (10 validators + 10 generators each open the full doc suite). A 10-analysis run does ~1.5–2 MB. The explorer outputs an `EXPLORE_RESULT` allowlist (`relevant_files[]`, typically 4–9 files instead of 20+) that downstream agents will honor in v3.14.x patches — token budget on the synthesis tier drops by ≥30% per skill once integrations land.

**Always-on by design**: there is no `--no-explorer` opt-out. The false-negative safeguard is at the config level — every `agents/configs/explorer/<task_type>.json` declares `required_sections[]` that bypass scoring. The runtime parser (`skills/architecture-explorer/utils/parse-explore-result.ts`) rejects any `EXPLORE_RESULT` whose `relevant_files[]` is missing a `required_sections[]` entry, falling back to degraded mode (use the required list directly, skip the explorer call) so a malformed agent response never strips load-bearing files.

#### New files

- **Agent** — `agents/builders/architecture-explorer.md` (model: haiku). Universal Haiku-tier classifier; reads `agents/configs/explorer/<task_type>.json`, expands `candidate_files[]`, scores against `relevance_keywords.boost[]` + anchor hints, detects gaps via `gap_markers[]`, returns `EXPLORE_RESULT` block. Cache-keyed by candidate-file mtimes + plugin version + config mtime.
- **Configs** — `agents/configs/explorer/` (36 task-typed JSON configs):
  - 10 compliance: `compliance-{sre,security,cloud,business-continuity,cloud,data-and-ai,development,enterprise,integration,platform,process}.json`. SRE / security / cloud are hand-tuned; the other 7 are auto-derived from existing `agents/configs/<contract>.json` `phase3.required_files` + `data_points`.
  - 10 analysis: `analysis-{spof,blast-radius,bottleneck,cost-hotspots,stride,vendor-lockin,latency-budget,tech-debt,coupling,data-sensitivity}.json`.
  - 13 peer-review: `peer-review-{struct,naming,sections,coherence,tech,integ,metrics,scale,security,perf,ops,adr,tradeoff}.json` (one per category in `skills/architecture-peer-review/PEER_REVIEW_CRITERIA.md`).
  - 3 special: `handoff-component.json` (per-component classification feeding handoff-slicer when v3.14.x splits the builder), `architecture-question.json` (free-form Q&A; relevance keywords injected at runtime from question terms), `adr-application.json` (ADR creation/supersession context).
  - `_schema.json` — JSON Schema validating every config.
- **TypeScript utilities** — `skills/architecture-explorer/utils/`:
  - `explore-cache.ts` — `/tmp/architecture-explorer/<project_hash>/<task_type>.json` cache read/write + `inputs_hash` computation (mtimes + plugin version + config mtime) + zero-dependency glob expansion.
  - `parse-explore-result.ts` — extracts and validates the `EXPLORE_RESULT` YAML block emitted by the agent; enforces required-sections coverage; ships its own minimal YAML subset parser (no external deps).
  - `validate-config.ts` — runtime schema validation for `agents/configs/explorer/*.json`.
  - `explore-cli.ts` — Bun CLI invoked by the explorer agent (subcommands: `inputs-hash`, `check-cache`, `expand-candidates`, `write-cache`, `read-cache`, `project-hash`).
- **Auto-derivation script** — `tools/derive-explorer-configs.ts`. One-shot Bun script that projects from existing source-of-truth (`agents/configs/<contract>.json` `phase3.data_points` patterns; analysis vocabulary mappings; peer-review category checks) into 33 explorer configs. Skips existing configs by default; pass `--force` to overwrite.
- **Explorer-Friendly Headers** — new `## Explorer-Friendly Headers` section in `skills/architecture-docs/ARCHITECTURE_DOCUMENTATION_GUIDE.md` documents an `<!-- EXPLORER_HEADER ... -->` block (5–10 lines after the H1) that newly-created `docs/NN-*.md` and `docs/components/**/*.md` files must include. Lists key_concepts, technologies, components, scope, and related ADRs in the first 60 lines so the explorer's body sample lands on dense, classifier-relevant metadata. Backwards-compatible — legacy docs without the header still work, the explorer falls back to body+heading scoring. `ARCHITECTURE.md` (project root) is exempt; the explorer reads it in full as the navigation index.
- **`/setup` permissions update** — `.claude/settings.json.example` extended with three new entries: `Agent(sa-skills:architecture-explorer)`, `Write(//tmp/architecture-explorer/**)`, `Read(//tmp/architecture-explorer/**)`. Existing projects re-running `/setup` after upgrading get these appended non-destructively (the `setup-permissions.ts` helper does an array union and counts pre-existing entries under "already present"). Comment headers in the example file updated to mention the explorer + headers CLIs and the per-project cache. New `## v3.14.0 — what's new in this setup` section in `commands/setup.md` documents what re-running adds.
- **`architecture-explorer-headers` skill + slash command** — new `skills/architecture-explorer-headers/` skill with `/regenerate-explorer-headers` slash command for backfilling EXPLORER_HEADER blocks into legacy docs. Workflow: Phase 1 inventory (Bun CLI walks `docs/` + `docs/components/`, excludes `ARCHITECTURE.md` and `README.md`, returns JSON of `{path, has_header, h1, byte_size}`) → Phase 2 plan-and-confirm → Phase 3 model-generated header inserted via Edit tool right after the H1 → Phase 4 report. Supports `--dry-run` (no writes), `--force` (overwrite existing), and `<path-glob>` (restrict scope). TypeScript module `header-detector.ts` exports `listDocFiles`, `hasExplorerHeader`, `findInsertionPoint`, `parseHeader`, `validateHeader`, `insertHeader`, `removeHeader`, `buildHeader`. Bun CLI `header-cli.ts` (subcommands: `list`, `validate`, `has-header`). 30 unit tests covering detection, insertion (idempotent + force semantics), removal, parsing round-trip, validation (doc files require key_concepts+technologies+scope; component files additionally require component_self), and the fs walker (excludes ARCHITECTURE.md, recurses components/, does not recurse other docs/ subdirs).
- **Tests** — `skills/architecture-explorer/utils/explore-cache.test.ts` (cache round-trip, mtime invalidation, plugin-upgrade invalidation, project-hash collision-resistance, glob expansion), `parse-explore-result.test.ts` (happy path, malformed YAML, missing required fields, false-negative safeguard rejection), `validate-config.test.ts` (every shipped config passes the schema; targeted error cases). Total: 45 tests across 3 files.

#### Documentation

- `CLAUDE.md` — Plugin Structure section now lists `agents/configs/explorer/` and `architecture-explorer.md`; new "Architecture-explorer (v3.14.0)" paragraph in Code Architecture explaining the contract; TypeScript utilities section split into compliance + explorer subsections.
- This `CHANGELOG.md` entry.

#### Per-skill integration roadmap (v3.14.x patches)

| Patch | Skill | Work |
|-------|-------|------|
| 3.14.1 | `architecture-compliance` | Insert Step 3.2.5 Explore Phase before validator/generator fan-out; wire `compliance-generator.md` + 10 validators to honor `EXPLORE_RESULT.relevant_files[]` |
| 3.14.2 | `architecture-analysis` | Insert Step 2.5 Explore Phase; wire `architecture-analysis-agent.md` to honor `relevant_files[]` |
| 3.14.3 | `architecture-peer-review` | Insert Step 4.5 Explore Phase (all depths); wire `peer-review-category-agent.md` |
| 3.14.4 | `architecture-dev-handoff` | Refactor `handoff-context-builder.md` → `handoff-slicer.md` (Sonnet, slicing/dedup/manifest only) with `architecture-explorer` running first via `handoff-component.json` |
| 3.14.5 | `architecture-docs` | Q&A workflows route through explorer with runtime keyword injection (`architecture-question.json`) |
| 3.14.6 | `architecture-definition-record` | ADR create/supersede route through explorer (`adr-application.json`) |

Each patch ships independently — no patch depends on a later patch. `architecture-explorer` is self-contained infrastructure in v3.14.0; integrations are additive.

#### Verification

`bun run typecheck` ✅ · `bun test skills/architecture-explorer/` (45/45 pass) ✅ · 36/36 explorer configs validate against `_schema.json` ✅ · auto-derivation script runs cleanly (`bun run tools/derive-explorer-configs.ts`) ✅

## [3.13.1]

### Changed
- **Reorganized `agents/` by role**: `agents/generators/` (compliance-generator, docs-export-generator, handoff-generator), `agents/builders/` (handoff-context-builder), `agents/reviewers/` (architecture-analysis-agent, peer-review-category-agent), `agents/validators/` (10 domain validators, unchanged location), `agents/configs/` (10 domain JSON configs, was `agents/base/configs/`). The misleading `agents/base/` parent directory is gone.
- All 16 file moves use `git mv` so per-file history is preserved.

### Updated (coordinated path references — 33 files total)
- Runtime: `agents/generators/compliance-generator.md` and `agents/validators/*-validator.md` (×10) read configs from `[plugin_dir]/agents/configs/` instead of `[plugin_dir]/agents/base/configs/`. `tools/bundle-handoff-agent.ts` + its test target the new agent paths. `scripts/build-release.sh` error messages updated.
- Documentation: `CLAUDE.md` Plugin Structure section rewritten. SKILL.md path mentions in `architecture-dev-handoff`, `architecture-docs-export`, `architecture-peer-review` updated. `PAYLOAD_SCHEMA.md` `Consumers:` footer updated and re-bundled into `handoff-context-builder.md`.

### Not changed
- Agent invocation: Claude Code resolves agents by `name:` frontmatter (`sa-skills:<name>`), so subdirectory location does not affect spawn. No skill needs to change which agent it calls.
- Behavior: pure refactor. Zero functional changes vs v3.13.0.
- Historical CHANGELOG and README roadmap entries (v3.5.x → v3.13.0): intentionally left intact — they accurately document file paths at those release points.

### Verification
`bun run typecheck` ✅ · `bun run bundle:check` (both bundles in sync) ✅ · 353/353 tests pass ✅ · `bash scripts/build-release.sh` smoke-test ✅

## [3.13.0]

### Performance — `architecture-dev-handoff` token + wall-clock overhaul

Nine fixes ranked by measured impact from a captured 8-component run (~481K tokens / ~50 min wall-clock). Targets: ~70% token reduction on full runs, ~80% on minor-architecture-bump runs, ~40–50% wall-clock cut.

#### Added
- `agents/handoff-context-builder.md` — new sub-agent pinned to `model: sonnet`. Owns all I/O-heavy work previously done in the orchestrator's main context (which inherits the user's session model — typically Opus): reading `docs/01` + `docs/04–09` once, building the ADR term-index from each `adr/*.md` first 30 lines, per-component slicing, parsing component files into the `## Component (structured)` YAML payload format, dedup of shared excerpts to `_shared.md`, payload writing, and SHA-256 manifest fingerprint + skip-vs-regen decision per component. Returns a `CONTEXT_RESULT:` block to the orchestrator listing each component's `payload_path`, `payload_hash`, `decision`, `reason`, `asset_types`, and `handoff_file_rel`. Effect: the orchestrator's main context never loads the ~80–120 KB of shared docs + ADR corpus, and the file-shuffling work runs on Sonnet instead of Opus.
- `tools/bundle-handoff-agent.ts` — bundles static reference files into BOTH sub-agents now: `agents/handoff-generator.md` (HANDOFF_TEMPLATE.md, SECTION_EXTRACTION_GUIDE.md, assets/_index.md, ASSET_GENERATION_GUIDE.md) AND `agents/handoff-context-builder.md` (PAYLOAD_SCHEMA.md). Uses a `BUNDLE_TARGETS` array so future agents are easy to add. Bundled content lives in each sub-agent's system prompt and is API-prompt-cached across all spawns within the orchestration window — saving ~300K tokens per 8-component run on the handoff-generator side vs. fresh per-spawn Reads.
- `package.json` scripts: `bundle:handoff-agent` (rebuild bundle) and `bundle:check` (CI guard, exit 1 on drift).
- `tools/bundle-handoff-agent.test.ts` — sync test asserting the agent file is in sync with its sources.
- `scripts/build-release.sh` — runs `bundle:check` before zipping; release fails on drift.
- `skills/architecture-dev-handoff/utils/manifest.ts` + `manifest-cli.ts` — `handoffs/.manifest.json` with SHA-256 fingerprint of `payload + template_version`. The orchestrator skips components whose fingerprint matches the manifest entry AND whose handoff file still exists. Big win on minor-architecture-bump runs (5/8 components typically unchanged).
- `skills/architecture-dev-handoff/utils/manifest.test.ts` — 18 unit tests covering hash determinism, manifest round-trip, all skip/regen conditions, and the CLI smoke path.
- `--parallelism N` orchestrator flag (default 4, capped at 8) — Phase 5 batch size, raised from the v3.6.1 default of 2 (sub-agents are independent on read-only payloads, so 4-way fan-out cuts wall-clock by ~50%).
- `--force` orchestrator flag — bypass manifest skip-if-unchanged.
- `## Component (structured)` payload section — typed YAML block (`component.name`, `component.type`, `component.apis`, `component.config`, `component.scaling`, …) replaces the verbatim 100–200 line `## Component File` markdown blob. Denser and more deterministic for the sub-agent to consume. Raw fallback (`## Component File (raw)`) preserved for unfamiliar component-doc structures.
- `_shared.md` deduplication — content that appears verbatim in ≥3 component payloads (typically org-wide ADRs like ADR-012 mTLS, ADR-014 WAF) is written once to `/tmp/handoff-payloads/_shared.md` and referenced via `> See: _shared.md § Shared: <header>` markers. Sub-agent PHASE 0.3 resolves markers in memory before fill. ~30% smaller payloads on average for multi-component runs.
- ADR pre-grep index pass — first 30 lines of every `adr/*.md` are read once into an in-memory term index; per-component lookup intersects against the index, full-Reading only the ADRs each component actually needs. Cuts orchestrator-side ADR token cost by ~60%.
- `Phase 7` report now prints `Skipped (unchanged): K component(s)` and `Main-context reads (ADRs): matched/total`.

#### Changed
- `agents/handoff-generator.md`: PHASE 1 no longer issues Read calls for plugin reference files (now bundled). PHASE 2 codifies the **Single-Write rule** — fill the entire template in memory, emit one `Write` call (target: 4–6 tool calls per spawn instead of the 15–31 observed in v3.12.0). PHASE 0 Step 0.3 added for `_shared.md` resolution. Per-section guidance updated to read from `component.<key>` (structured YAML) instead of `## Component File` markdown.
- `agents/handoff-generator.md` frontmatter: dropped `Bash` from `tools:` — sub-agents no longer invoke any shell command (asset directory pre-created by orchestrator; `generation_date` from payload frontmatter; references bundled).
- `skills/architecture-dev-handoff/SKILL.md` Phase 5: batch language switched from "batches of 2" to "batches of `parallelism`".
- `skills/architecture-dev-handoff/SKILL.md` Phases 3 + 4: collapsed into a single `handoff-context-builder` sub-agent spawn (Phase 3.5) plus a small "pre-create asset directories for REGEN components" step (Phase 4). The orchestrator's pre-spawn work now consists of: parse flags → locate `ARCHITECTURE.md` → load the component index → detect `doc_language` → spawn context-builder → consume `CONTEXT_RESULT` → spawn handoff-generators for REGEN entries → write manifest → report. Steps 3.1 (full shared-doc Reads), 3.1b (ADR index pass), 4.1–4.5 (per-component parsing + payload writing + manifest checks) all moved into `handoff-context-builder`.
- `skills/architecture-dev-handoff/PAYLOAD_SCHEMA.md`: schema version bumped 1.0.0 → 2.0.0; documented `## Component (structured)` block, `shared_refs` frontmatter, `> See:` body marker.

#### Removed
- `skills/architecture-dev-handoff/SKILL.md` Step 0c (plugin-ref staging to `/tmp/handoff-plugin-refs/`) — obsoleted by the agent bundle. Permissions block dropped `/tmp/handoff-plugin-refs/*` grants.
- `skills/architecture-dev-handoff/SKILL.md` Step 2.2 (dependency-based component ordering) — sub-agents never read prior handoffs, so the sort provided no information benefit. Components now ordered by `component_index_position`.

#### Migration
- First run after upgrade has no `handoffs/.manifest.json` → all components REGEN → manifest created. No surprises.
- Payloads from earlier versions on disk are ephemeral (`/tmp/handoff-payloads/`); new payloads are written every run.
- Existing handoff files are not modified by the upgrade itself; they're re-evaluated against the new manifest at the next orchestration.

#### Permissions delta
- Added: `Read(handoffs/.manifest.json)`, `Write(handoffs/.manifest.json)`, `Agent(sa-skills:handoff-context-builder)`
- Removed: `Read(/tmp/handoff-plugin-refs/*)`, `Write(/tmp/handoff-plugin-refs/*)`

## [3.5.8]

### Changed
- All 13 sub-agents migrated to `model: opus` (from `model: sonnet`):
  - `agents/compliance-generator.md`, `agents/peer-review-category-agent.md`, `agents/architecture-analysis-agent.md`
  - 10 validators under `agents/validators/` (business-continuity, cloud, data-ai, development, enterprise, integration, platform, process, security, sre)
- Rationale: On the Anthropic API, the `opus` alias currently resolves to Claude Opus 4.7 (1M context). Stronger reasoning improves compliance contract fidelity, peer-review nuance, validator evidence extraction, and architecture-analysis classification; 1M window removes the split-read constraints previously planned for large ARCHITECTURE.md suites.
- Skills (14) require no changes — all use current tool patterns and parallel agent spawning idioms supported natively by Opus 4.7. Skill frontmatter continues to inherit model selection from the calling session.

## [2.10.21]

### Added
- `redis-key-schema.md` asset type for Redis/Cache/ElastiCache/Memcached/Valkey components in `architecture-dev-handoff` skill
- New Asset 7 section in `ASSET_GENERATION_GUIDE.md` covering instance configuration, connection pooling, key patterns table, TTL strategy, eviction policy, memory sizing, and fail-open behavior

### Changed
- `SKILL.md` Step 3.2 type detection table: Redis removed from `ddl.sql` row; new row maps Redis/Cache/ElastiCache/Memcached/Valkey → `redis-key-schema.md`
- `CLAUDE.md`: Added `redis-key-schema.md (Redis/Cache)` to asset type lists

## [2.10.20]

### Changed
- `skills/architecture-peer-review/PLAYGROUND_TEMPLATE.md`: Fix prompt header now reads `"Use /skill architecture-docs to update the ARCHITECTURE.md..."` — ensures remediation always routes through the architecture-docs skill
- `.claude/settings.json` + `.claude/settings.json.example`: Added `"Bash(ls *)"` permission to prevent approval prompts when skills run `ls` on the plugin marketplace directory
- `CLAUDE.md`: Permissions block updated to include `"Bash(ls *)"`

## [2.10.19]

### Changed
- `skills/architecture-blueprint/APPLICATION_TEMPLATE_ES.md`: 6 hardcoded threshold lines replaced with `<placeholder>` fields for LLM analysis
- `skills/architecture-blueprint/APPLICATION_TEMPLATE_EN.md`: Same 6 lines in English replaced with `<placeholder>` fields
- `skills/architecture-blueprint/SKILL.md`: Design Drivers field mapping table extended with 6 new rows mapping each threshold placeholder to `docs/01-system-overview.md` Key Metrics

## [2.10.18]

### Added
- `skills/architecture-blueprint/APPLICATION_TEMPLATE_ES.md`: Spanish Application template — Design Drivers, Architecture Decisions, Capacity Sizing, Architecture Debt, and 10-area Compliance Contract Approvals
- `skills/architecture-blueprint/APPLICATION_TEMPLATE_EN.md`: English translation of the Application template

### Changed
- `skills/architecture-blueprint/SKILL.md`: Step 3 extended with `docs/08-scalability-and-performance.md`, `adr/ADR-*.md`, and `compliance-docs/COMPLIANCE_MANIFEST.md` as context sources; Application field mapping section added

## [2.10.17]

### Added
- `skills/architecture-blueprint/BUSINESS_TEMPLATE_EN.md`: English Business template — same structure as Spanish template with EN placeholders

### Changed
- `skills/architecture-blueprint/BUSINESS_TEMPLATE_ES.md`: Renamed from `BUSINESS_TEMPLATE.md` for clarity
- `skills/architecture-blueprint/SKILL.md`: Added Step 0.5 (language detection); template paths now language-suffixed; output filenames include language suffix

## [2.10.16]

### Added
- `skills/architecture-blueprint/SKILL.md`: New skill — generates `BLUEPRINT_BUSINESS.md` and `BLUEPRINT_APPLICATION.md` by extracting data from `ARCHITECTURE.md` and filling organizational templates; 7-step workflow with mode detection, plugin-dir resolution, context loading, field mapping, NOT FOUND handling, overwrite protection, and fill summary report
- `skills/architecture-blueprint/BUSINESS_TEMPLATE.md`: Business template ("Datos de la Iniciativa") with 20 placeholders

## [2.10.15]

### Added
- `skills/architecture-docs-export/SKILL.md`: `docs/02-architecture-principles.md` added as required source; `## Architecture Principles` section added to Step A.2 composed document structure
- `.claude/settings.json` + `.claude/settings.json.example`: Added `Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/*)` permission

## [2.10.14]

### Changed
- `skills/architecture-docs/SKILL.md`: Diagram update parity rule — all creation guardrails apply equally to update requests; New Step 5a (Existing Diagram Detection); Step 9 updated to differentiate update vs create mode; Workflow 1 now includes Step 7 (Mandatory Diagram Generation at creation time)
- `skills/architecture-component-guardian/SKILL.md`: Added Step 6 (Update architecture documentation) triggered on add/remove/update operations — loads Context Anchor, runs Post-Write Audit, updates downstream sections, updates nav index, prompts for diagram update, generates Change Propagation Report

## [2.10.13]

### Changed
- `skills/architecture-docs-export/SKILL.md`: Added `check-dir.ts` validation step before Steps A.3 and B.2; Added Documentation Fidelity policy — verbatim extraction, `[NOT DOCUMENTED]` markers for empty sections; Fixed ADR status fallback to `NOT DOCUMENTED`

## [2.10.12]

### Changed
- `skills/architecture-dev-handoff/SKILL.md`: "Documentation Fidelity Policy" extended to cover handoff documents in addition to asset files; `[NOT DOCUMENTED — add to <source-file>]` tokens standardized
- `skills/architecture-dev-handoff/HANDOFF_TEMPLATE.md`: All gap tokens standardized to canonical `NOT DOCUMENTED`; removed example hints from placeholders
- `skills/architecture-dev-handoff/SECTION_EXTRACTION_GUIDE.md`: Eliminated permissive "infer" instructions; global-to-component substitution requires `[GLOBAL — not component-specific]` annotation; acceptance criteria synthesis requires source citation

## [2.10.11]

### Added
- `skills/architecture-dev-handoff/SKILL.md`: Asset-Documentation Fidelity Policy with 5 rules (EXACT MATCH, NO DEFAULTS, NO EXTRA FIELDS, NO OMISSIONS, COMPLETENESS CHECK)

### Changed
- `skills/architecture-dev-handoff/ASSET_GENERATION_GUIDE.md`: Removed ~50 `[VALUE or fallback]` default patterns from all scaffold templates; added Post-generation check after each asset scaffold section

## [2.10.10]

### Fixed
- `skills/architecture-docs-export/SKILL.md`: Added Step 0 — plugin directory resolution before all workflows; all bash blocks use `$plugin_dir/tools/docgen/generate-doc.js` (absolute path)

## [2.10.9]

### Added
- `README.md`: New `## Recommended VS Code Setup` section documenting 3 VS Code extensions (Claude Code, Mermaid Preview, Office Viewer)

## [2.10.8]

### Changed
- `tools/docgen/generate-doc.js`: ADR document type now uses amber/gold (`#8B6914`) — 3-color scheme: SA=corporate blue, ADR=amber/gold, Handoff=teal

## [2.10.7]

### Fixed
- `tools/docgen/generate-doc.js`: `i < lines.length` guard before skipping closing code fence; CHANGELOG directive destructuring with defaults; `parseTable()` guards empty header row; `get()` CLI helper checks bounds; `fs.mkdirSync()` and `fs.writeFileSync()` wrapped in try-catch

## [2.10.6]

### Fixed
- `tools/docgen/generate-doc.js`: Expanded heading regex from `#{1,4}` to `#{1,6}` — H5/H6 no longer cause infinite loop; `else { i++ }` safety fallback in paragraph collector; `fs.existsSync(input)` check before `readFileSync`

## [2.10.5]

### Fixed
- `skills/architecture-docs-export/SKILL.md`: Explicit Bun runtime enforcement; executive summary temp file changed to `sa-executive-summary.md` at project root

## [2.10.4]

### Changed
- `skills/architecture-docs-export/SKILL.md`: Workflow A redesigned — synthesizes executive summary from `docs/01-system-overview.md`, `docs/components/README.md`, and `compliance-docs/COMPLIANCE_MANIFEST.md`; ADRs exported individually

## [2.10.3]

### Fixed
- `tools/docgen/generate-doc.js`: Replaced `TableOfContents` field code with `buildManualToc()` — pre-rendered TOC visible in all readers without "update fields" step

## [2.10.2]

### Fixed
- `skills/architecture-dev-handoff/SKILL.md`: Added explicit `triggers:` frontmatter; Phase 2 component selection always prompts with component list
- `skills/architecture-docs-export/SKILL.md`: Added `export dev handoff` and `export dev handoffs` triggers

## [2.10.1]

### Fixed
- `tools/docgen/generate-doc.js`: Added `features: { updateFields: true }` to `Document` constructor — TOC auto-populates on open

## [2.10.0]

### Added
- `skills/architecture-docs-export/` (new skill): On-demand Word (.docx) export for Solution Architecture documents and Component Development Handoffs
- `tools/docgen/generate-doc.js`: Professional Word generator for 3 doc types: `solution-architecture`, `adr`, `handoff`; Bun runtime; CHANGELOG directive support
- `tools/docgen/package.json`: Isolated `docx ^8.5.0` workspace dependency
- `skills/architecture-dev-handoff/` (new skill): Per-component handoff documents — 16-section template, component-type-specific asset generation (OpenAPI, DDL, K8s Deployment, AsyncAPI, Avro/Protobuf schemas, CronJob), gap detection, compliance enrichment
- `skills/architecture-component-guardian/`: Renamed from `component-index-guardian` for consistent `architecture-*` prefix

### Removed
- `skills/architecture-docs/SKILL.md`: Presentation Generation workflow (~500 lines) and `officegen` dependency removed; Workflow 9 → 8, Workflow 10 → 9

## [2.8.28]

### Fixed
- Skill routing: "recreate/regenerate/rebuild compliance manifest" no longer triggers `architecture-compliance-review`

## [2.8.27]

### Fixed
- Compliance manifest date accuracy: contract's embedded generation date used instead of UTC re-computation; all date fields use local timezone via `getLocalDateString()`

## [2.8.26]

### Changed
- `architecture-compliance-review/SKILL.md`: Removed fix prompt generation; playground is now a pure exploration tool

## [2.8.25]

### Added
- `skills/architecture-compliance-review/SKILL.md` (new skill): Validates all 10 compliance contracts are present and ≤6 months old; gap extraction; concept clustering; interactive HTML playground — portfolio health panel + concept cluster gap explorer

## [2.8.24]

### Fixed
- Plugin directory resolution in compliance skill: replaced temp-file approach with direct `bun ~/.claude/plugins/marketplaces/.../resolve-plugin-dir.ts` call

## [2.8.23]

### Fixed
- `Write(//tmp/*)` permission path: changed `file_path` to use `//tmp/` double-slash prefix to match permission pattern exactly

## [2.8.22]

### Fixed
- Write tool path for plugin dir discovery: annotated `file_path` with explicit warning to use absolute `/tmp/` path

## [2.8.21]

### Fixed
- Temp file creation in Step B: explicitly uses Write tool; forbids `cat`/Bash/heredoc to eliminate security prompt

## [2.8.20]

### Fixed
- Plugin dir discovery in compliance skill: replaced hardcoded path with temp-file discovery script that scans `$HOME` for `resolve-plugin-dir.ts`

## [2.8.19]

### Added
- `skills/architecture-compliance/utils/resolve-plugin-dir.ts`: uses `import.meta.dir` to compute plugin root from its own location

### Fixed
- `SKILL.md` Step 3.1: added Step B fallback using `resolve-plugin-dir.ts` when Glob fails

## [2.8.18]

### Fixed
- All 10 compliance agents: removed leading `/` from output paths — agents now write to `compliance-docs/FILENAME.md` (relative, matches `Write(compliance-docs/*)` permission)

## [2.8.17]

### Fixed
- `.claude/settings.json` + `.claude/settings.json.example` + `CLAUDE.md` + `docs/INSTALLATION.md`: Added `Write(compliance-docs/*)` permission

## [2.8.16]

### Fixed
- All 10 compliance templates: renamed `A.3.3 Achieving Auto-Approve Status` → `A.3.2 Achieving Auto-Approve Status`
- `completion-guide-intro.md`: replaced stale internal section reference with link to plugin README

## [2.8.15]

### Removed
- `shared/sections/remediation-workflow-guide.md` (232-line shared fragment) and A.3.2 Remediation Steps sections from all 10 templates (~806 lines total) — saves ~13,000 tokens per run

## [2.8.14]

### Added
- `skills/architecture-compliance/utils/check-dir.ts`: TypeScript utility replacing shell `[ -d ]` operator to avoid `&&` safety prompt

### Removed
- `Bash([ *)` permission from all 4 permission files

## [2.8.13]

### Fixed
- Directory existence check: eliminated tool-choice decision point — now uses Bash `[ -d ]` check

## [2.8.12]

### Fixed
- All 10 compliance agents: Step 5.2 now explicitly states to use Glob (not Search/Grep) for directory existence check

## [2.8.11]

### Fixed
- All 10 compliance agents run end-to-end without permission prompts. Confirmed working permission set documented.

## [2.8.10]

### Fixed
- All 10 compliance agents: replaced `mkdir -p` with Glob-check + plain `mkdir` — `-p` flag incompatible with permission matcher

## [2.8.9]

### Fixed
- Added `Bash(mkdir -p *)` alongside `Bash(mkdir *)` in all 4 permission files (superseded in v2.8.10)

## [2.8.8]

### Changed
- All Bash permissions updated to `command *` space format; `command:*` colon syntax deprecated

## [2.8.7]

### Fixed
- Read/Write `/tmp/` permissions: changed to `//` prefix (`Read(//tmp/*)`, `Write(//tmp/*)`) for absolute path matching

## [2.8.6]

### Added
- `Read(//tmp/*)` and `Write(//tmp/*)` permissions (corrected to `//` prefix in v2.8.7)

## [2.8.5]

### Changed
- Bash permission format changed to `command:*` syntax (reverted to `command *` in v2.8.8)

## [2.8.4]

### Fixed
- `Bash(bun *)` permission: changed to wildcard that matches full absolute paths

## [2.8.3]

### Fixed
- All 10 compliance agents: removed intermediate temp file — agents now Write populated contract directly from working memory; TOOL DISCIPLINE block added with forbidden tool list

## [2.8.2]

### Changed
- All 10 compliance agents reverted to `model: sonnet`

## [2.8.1]

### Changed
- All 10 compliance agents switched to `model: haiku` (reverted in v2.8.2)

## [2.8.0]

### Added
- `post-generation-pipeline.ts`: single Bun call that scans compliance-docs, calculates validation scores, updates contract fields, and writes `COMPLIANCE_MANIFEST.md`
- `resolve-includes.ts` `--strip-internal` flag: strips `BEGIN_INTERNAL_INSTRUCTIONS` blocks during template expansion
- 10 `Agent(sa-skills:*-compliance-generator)` permissions in `settings.json`

### Changed
- `SKILL.md` reduced from 2,863 → 701 lines; `plugin_dir` passed as input parameter to all 10 compliance agents instead of running `find && cd`

## [2.7.0]

### Added
- `skills/architecture-peer-review/` (new skill): Solution Architect peer review with interactive HTML playground
  - 3 depth levels: Light (22 checks), Medium (44 checks), Hard (82 checks)
  - 13 review categories with weighted 0–10 scoring
  - Interactive HTML playground via `playground` plugin — approve/reject/comment
  - Fix prompt generation for approved findings
  - Fallback plain-text report when playground plugin not installed

## [2.6.0]

### Added
- Workflow 8 (Diagrams): Mandatory diagrams (High-Level Architecture + Data Flow) always generated
- New Step 2: External diagram detection & intake — scans external files, classifies into 7 categories
- New Step 3: External diagram reconciliation — MATCH/PARTIAL diagrams relocated, NO MATCH discarded
- New Step 10: Flow-diagram completeness audit — `[REQUIRED]` gaps produce compliance warning
- New trigger keywords: `reconcile diagrams`, `audit diagrams`, `diagram completeness`, `fix diagram placement`

### Changed
- Canonical location enforcement: non-canonical diagram placement requests denied

## [2.5.9]

### Changed
- README First Workflow section: documents full elicitation interview flow with auto-detection, 4 phases, Discovery Summary path, and alternate Evaluation/Creation path

## [2.5.8]

### Changed
- README updated to reflect multi-file ARCHITECTURE.md structure
- `/release` command updated: README is now updated as first step of every release

## [2.5.6]

### Added
- `architecture-readiness`: Requirements Elicitation — 4-phase guided discovery interview (Foundation → Value & Boundaries → Behavior → Experience & Measurement)
  - `REQUIREMENTS_ELICITATION_GUIDE.md` with complete interview methodology
  - 8 probing techniques, industry defaults, question batching, phase progress summaries
  - Discovery Summary checkpoint before drafting; self-scoring gap loop until ≥7.5
  - Auto-detects existing PO Spec; bilingual support

## [2.3.15]

### Added
- 5th Architecture Type: Full BIAN V12.0 — new `SECTION_4_BIAN.md` and `SECTION_5_BIAN.md` templates; mandatory Full BIAN V12.0 compliance; 12 BIAN metadata fields; 7 standardized operations; full hierarchy traceability
- META Layer 5 Enhancement: expanded from 4 to 12 BIAN metadata fields
- Business Continuity v2.0: table-based format with 43 LACN requirements (up from 10 LABC); 6-column compliance summary table; 6 validation categories
- Automatic ADR file generation from Section 12 table in ARCHITECTURE.md

### Changed
- Principle #10 renamed: "Decouple Through Events" (formerly "Event-Driven Integration")

## [1.3.0]

### Added
- All 10 compliance contracts with templates and validation
- External validation system (0-10 scoring, 4-tier approval)
- 10 validation configuration files (JSON-based, template-specific) + 10 template validation configs
- `VALIDATION_SCHEMA.json`, `VALIDATION_EXAMPLES.md`
- Document Control standardization across all 11 templates

### Changed
- Automated approval workflow: Auto-approve ≥8.0, Manual review 7.0-7.9, Needs work 5.0-6.9, Rejected <5.0

## [1.2.2]

### Changed
- Document Control format standardization
- Strict source traceability enforcement

## [1.2.0]

### Added
- 3 integrated skills (architecture-readiness, architecture-docs, architecture-compliance)
- 4 architecture types with Mermaid diagrams (META, 3-Tier, Microservices, N-Layer)
- BIAN V12.0 integration for META architecture
- 4 ready-to-use compliance contracts
- Enhanced Data & AI Architecture compliance (Version 2.0)

## [1.1.0] - 2025-12-04

### Added
- 3 ready-to-use compliance contracts:
  - Cloud Architecture contract
  - Development Architecture contract (with 26-item stack validation)
  - IT Platforms & Infrastructure contract
- Roadmap section in README documenting v1.1.0, v1.2.0, and v2.0.0 milestones
- Clear status indicators for ready vs in-development compliance contracts
- 4 architecture types with Mermaid diagram support (META, 3-Tier, Microservices, N-Layer)
- Interactive Mermaid diagrams in ARCHITECTURE.md Section 4
- MERMAID_DIAGRAMS_GUIDE.md with comprehensive diagram creation instructions

### Changed
- Updated README to clarify compliance contract availability (3 ready, 8 in development)
- BIAN compliance now exclusively for Layer 5 (Domain) - removed Layer 4 BIAN N2 references
- BIAN validation focus shifted to capability names instead of IDs
- BIAN V12.0 set as explicit default version with official landscape URLs
- BIAN IDs (SD-XXX) clarified as internal document tracking only

### Improved
- Compliance contract documentation structure
- Version information clarity across all documentation
- BIAN Service Landscape integration with official URLs
- Architecture type selection guidance

### Planned for v1.2.0
- Remaining 8 compliance contracts (Business Continuity, SRE, Data & Analytics/AI, Process Transformation, Security, Enterprise Architecture, Integration, Risk Management)
- Enhanced validation rules
- Additional architecture patterns

---

## [1.0.0] - 2025-11-28

### Added
- Initial release of Solutions Architect Skills plugin
- **architecture-readiness** skill: Product Owner Specification workflow
  - 8-section PO Spec template
  - Weighted scoring methodology (0-10 scale)
  - Readiness assessment for architecture team handoff
- **architecture-docs** skill: ARCHITECTURE.md creation and maintenance
  - 12-section standardized structure
  - Automatic metric consistency validation
  - Design Drivers calculation
  - ADR (Architecture Decision Record) support
  - Document Index for context-efficient editing
- **architecture-compliance** skill: Generate 11 compliance contracts
  - Business Continuity (Continuidad de Negocio)
  - Site Reliability Engineering (Arquitectura SRE)
  - Cloud Architecture
  - Data & Analytics/AI (Arquitectura Datos y Analítica - IA)
  - Development Architecture (Arquitectura Desarrollo)
  - Process Transformation (Transformación de Procesos y Automatización)
  - Security Architecture (Arquitectura Seguridad)
  - IT Platforms & Infrastructure (Plataformas e Infraestructura TI)
  - Enterprise Architecture (Arquitectura Empresarial)
  - Integration Architecture (Arquitectura de Integración)
  - Risk Management
- Automatic stack validation (26-item checklist) for Development Architecture
- Context-efficient document generation (70-80% reduction in loaded content)
- Complete documentation suite (Installation, Quick Start, Workflow Guide, Troubleshooting)
- Example outputs demonstrating full workflow

### Features
- Three-phase workflow: Readiness → Documentation → Compliance
- 11 compliance contract templates with full traceability
- Automatic validation and quality checks
- Pure markdown-based configuration (no build dependencies)
- MIT License for open distribution

---

## Version Strategy

- **MAJOR** (X.0.0): Breaking changes (template structure, SKILL.md format changes)
- **MINOR** (1.X.0): New features (new templates, new skills, enhancements)
- **PATCH** (1.0.X): Bug fixes (template corrections, documentation improvements)