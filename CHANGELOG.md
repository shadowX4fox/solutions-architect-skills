# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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