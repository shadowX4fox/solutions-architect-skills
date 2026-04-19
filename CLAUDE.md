# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: This is a Claude Code Plugin. For plugin development documentation, see [Claude Code Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins).

## Development Commands

```bash
# Type-check all TypeScript files
bun run typecheck

# Compile TypeScript (tsc)
bun run build

# Run unit tests (Bun test framework)
bun test

# Run tests in a specific file
bun test skills/architecture-compliance/tests/validators.test.ts

# Install workspace dependencies (root + tools/docgen)
bun install

# Build a release package (ZIP + SHA256)
bash scripts/build-release.sh
```

## Trigger Routing — Exact Phrases

When the user types any of these phrases, the correct FIRST action is to invoke the listed skill (not plan, not ask, not explore). These rules override plan-mode's default "Explore → Plan → ExitPlanMode" flow: skill invocation is a read-only context load that is legal inside plan mode, and the skill's own workflow handles clarification, state detection, and change scoping.

| User phrase (any of) | Invoke | Workflow |
|----------------------|--------|----------|
| `release my architecture` · `release architecture` · `release architecture version` · `publish architecture` · `ship architecture` · `tag architecture version` · `freeze architecture` · `bump architecture version` · `finalize architecture` | `solutions-architect-skills:architecture-docs` | Workflow 10 — `RELEASE_WORKFLOW.md` (Draft → Released, CHANGELOG, `architecture-v{version}` git tag) |
| `generate my architecture diagrams` · `create architecture diagrams` · `add diagrams to my architecture` · `update diagrams` | `solutions-architect-skills:architecture-docs` | Workflow 8 — diagram generation |
| `migrate my architecture` · `restructure architecture` · `split ARCHITECTURE.md` | `solutions-architect-skills:architecture-docs` | Workflow 9 — multi-file `docs/` layout migration |
| `review my architecture` · `peer-review architecture` · `architecture quality review` | `solutions-architect-skills:architecture-peer-review` | Full peer review with HTML playground |
| `generate compliance contracts` · `generate compliance documentation` · `compliance contracts` | `solutions-architect-skills:architecture-compliance` | 10 compliance contracts (Contratos de Adherencia) |
| `check compliance health` · `compliance portfolio review` · `concept gaps across contracts` | `solutions-architect-skills:architecture-compliance-review` | Portfolio gap explorer playground |
| `check requirements coverage` · `traceability report` · `PO spec coverage` · `deviation check` | `solutions-architect-skills:architecture-traceability` | `TRACEABILITY_REPORT.md` |
| `generate dev handoff` · `component handoff for <X>` · `implementation handoff` | `solutions-architect-skills:architecture-dev-handoff` | Per-component 16-section handoff + scaffolded assets |
| `add component <X>` · `remove component <X>` · `sync component index` · `migrate to C4` | `solutions-architect-skills:architecture-component-guardian` | `docs/components/README.md` (only sanctioned writer) |
| `export architecture to Word` · `export handoff to Word` · `generate .docx` | `solutions-architect-skills:architecture-docs-export` | `.docx` export only |
| `run architecture analysis` · `SPOF analysis` · `blast radius analysis` · `STRIDE threat model` · `cost hotspot analysis` · `tech debt analysis` · `all analyses` | `solutions-architect-skills:architecture-analysis` | Risk & sustainability reports in `analysis/` |
| `onboard to architecture` · `architecture concept map` · `new team member onboarding` | `solutions-architect-skills:architecture-onboarding` | Canvas concept-map playground |
| `PO spec` · `elicit requirements` · `business context intake` · `evaluate PO spec` | `solutions-architect-skills:architecture-readiness` | Requirements elicitation + scoring |
| `create ADR` · `update ADR status` · `supersede ADR` · `list ADRs` | `solutions-architect-skills:architecture-definition-record` | ADR CRUD (only sanctioned writer for `adr/`) |
| `generate business blueprint` · `datos de iniciativa` · `application blueprint` | `solutions-architect-skills:architecture-blueprint` | Organizational blueprint templates |
| `sync to IcePanel` · `IcePanel drift check` · `C4 model sync` | `solutions-architect-skills:architecture-icepanel-sync` | C4 import YAML + drift report |

**CRITICAL — release vs export are different skills**: "release my architecture" is the Draft → Released lifecycle (`architecture-docs` Workflow 10 — bumps version, writes CHANGELOG, creates `architecture-v{version}` git tag). "export my architecture" is `.docx` generation (`architecture-docs-export`). These MUST NOT be confused. If phrasing is ambiguous, default to `architecture-docs` for release phrasing and `architecture-docs-export` for "word", "docx", "deliverable", "executive summary document" phrasing.

**Deterministic slash-command fallback**: `/release-architecture` invokes `architecture-docs` directly, bypassing phrase matching.

## Plugin Structure

- `.claude-plugin/` — Plugin manifest (`plugin.json`, **authoritative version**) and marketplace registry (`marketplace.json`)
- `package.json` — Root Bun workspace config (workspace: `tools/docgen`)
- `agents/` — Sub-agents consumed by the Agent tool. Single universal `compliance-generator.md` + 4 specialized agents (`handoff-generator`, `docs-export-generator`, `peer-review-category-agent`, `architecture-analysis-agent`); domain configs in `agents/base/configs/`; validators in `agents/validators/`
- `skills/` — 14 skill directories (each containing `SKILL.md` + supporting files)
- `tools/docgen/` — Standalone `generate-doc.js` for Word/.docx generation; own `package.json` under the Bun workspace
- `scripts/build-release.sh` — Packages a release ZIP with SHA256 checksum
- `docs/` — User-facing documentation

## Code Architecture

**Skills**: Each skill is a directory under `skills/` containing a `SKILL.md` frontmatter file plus supporting Markdown guides, templates, and JSON schemas. Skills are pure Markdown — no compiled code — except `architecture-compliance`, which includes TypeScript utilities.

**TypeScript utilities** live exclusively in `skills/architecture-compliance/utils/`:
- `validators.ts` — compliance table/section validation
- `post-generation-pipeline.ts` — runs after each contract is generated
- `manifest-generator.ts` — writes `COMPLIANCE_MANIFEST.md`
- `check-dir.ts` — validates output directory
- `resolve-plugin-dir.ts` — resolves plugin cache path at runtime (the skill runs from arbitrary project directories)
- CLI wrappers (`*-cli.ts`) — thin Bun entrypoints

**Agents vs. Skills**: `agents/` holds sub-agents spawned by skills via the Agent tool. They are **not** skills and NEVER to be invoked directly from user-facing prompts.

**Compliance agent architecture**: A single universal `agents/compliance-generator.md` handles all 10 contract types, reading its domain config at runtime from `agents/base/configs/{contract_type}.json` (template filename, section mappings, grep patterns, requirement codes). Domain-specific validation is handled by 10 separate validator agents in `agents/validators/`.

**Versioning**: Canonical version lives in `.claude-plugin/plugin.json`. Commits follow `feat: <description> v<semver>`; the `/release` skill bumps, commits, and pushes.

**Word export**: `tools/docgen/generate-doc.js` is invoked as `bun run tools/docgen/generate-doc.js <type> <input.md> <output.docx>`. It has its own `node_modules` under `tools/docgen/`, managed separately from the root workspace.

---

## Architecture Documentation Rules

Detailed per-skill documentation lives in each `skills/<skill-name>/SKILL.md` — consult those when invoking a skill. This section captures only the cross-cutting rules Claude must honor while operating in this repo.

### Quick Reference
- All architecture documents must be named `ARCHITECTURE.md`
- Primary template: `ARCHITECTURE_DOCUMENTATION_GUIDE.md` (inside `skills/architecture-docs/`)
- ADR template and guide: `skills/architecture-definition-record/`
- Every `ARCHITECTURE.md` carries a semantic version (see "Architecture Versioning" below)

### Four-Phase Workflow
1. **Business Requirements** (PO) → `architecture-readiness` → PO Spec
2. **Technical Architecture** (Architecture Team) → `architecture-docs` → ARCHITECTURE.md
3. **Compliance Documentation** (Compliance Team) → `architecture-compliance` → 10 contracts
4. **Development Handoff** (Dev Team) → `architecture-dev-handoff` → per-component handoffs + assets

**PO Spec Gate (Phase 2)**: When no PO Spec exists, the user chooses: (1) full `/skill architecture-readiness` elicitation, (2) async intake from a file, (3) provide context inline (scored against rubric with gap interviews), or (4) skip with `SKIP PO SPEC`. Applies only to new document creation, not editing.

### Architecture Versioning

Every architecture carries a **semantic version** (MAJOR.MINOR.PATCH) — the canonical reference for all downstream artifacts.

**Whole-architecture version** (in `ARCHITECTURE.md` header):
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

**Per-component version** (in each `docs/components/**/*.md`, after the C4 metadata block):
```markdown
**Component Version:** 1.3.0
**Architecture Version:** 1.2.0
**Last Updated:** 2026-04-08
```

**Semver rules**:
- **MAJOR**: Breaking structural changes (new system, architecture type change, major ADR superseded)
- **MINOR**: New components, new sections, new integrations, new ADRs accepted
- **PATCH**: Corrections, clarifications, metric/typo fixes

**Lifecycle**: `v1.0.0` Draft → first release (Status: Released + git tag `architecture-v1.0.0`) → bump per semver on each change. All released versions recorded in `docs/CHANGELOG.md` (Keep a Changelog format).

**Git tag**: `architecture-v{version}` — namespaced to distinguish from plugin/app tags. MUST reflect the doc version under git.

**Archive snapshots** (`archive/v{version}/`): immutable copies of `ARCHITECTURE.md` + `docs/` + `adr/` + `RELEASE_NOTES.md` + `.immutable` marker. Non-git projects: auto-created on every release. Git projects: optional (tag is primary). Files MUST NOT be edited after creation; corrections require a new PATCH release.

**Downstream reference**: Compliance contracts, handoffs, and traceability reports include `Architecture Version: v{version}` in metadata for baseline traceability.

### ADR Scope Partition
- **ADR-001 … ADR-100** — **Institutional** (org-wide Architecture Team decisions)
- **ADR-101+** — **User / Project** (local to a single project)

Institutional range is hard-capped at 100; overflow blocks until an existing institutional ADR is superseded or the new decision is reclassified.

### Component Index Policy
`docs/components/README.md` is writable **only** by `architecture-component-guardian`, which enforces the fixed 5-column schema (`#`, `Component`, `File`, `Type`, `Technology`) with grouped system headers for multi-system architectures. Redirect direct-edit requests there.

### Dev Handoff Scope
`architecture-dev-handoff` is scoped to **C4 Level 2 (Container) components only**. C4 Level 1 (System) descriptors are excluded — they describe system boundaries, not implementable units.

### Diagram Policy (architecture-docs Workflow 8)
4 standard diagrams always generated — Logical View (ASCII), C4 L1 System Context, C4 L2 Container, Detailed View (`graph TB`) — plus Data Flow sequence diagrams per documented flow. All Mermaid targets **v11.4.1**. Canonical locations: standard diagrams in `docs/03-architecture-layers.md`; Data Flow in `docs/04-data-flow-patterns.md` (not configurable). Architecture docs are authoritative — diagrams for undocumented flows are discarded.

### Permissions
Each skill's required `.claude/settings.json` permissions are documented inside its own `SKILL.md`. A pre-configured example consolidating all skill permissions is at `.claude/settings.json.example` — users installing the plugin copy or merge the `permissions.allow` block into their project settings.

**Plugin limitation**: Claude Code plugin agents do not support `permissionMode` in frontmatter (silently ignored). Permissions must be granted via project settings.

### Optional MCP: context7
`architecture-dev-handoff` and `architecture-docs` optionally use context7 when configured:
- `resolve-library-id` — finds the context7 library ID for a framework/tool
- `query-docs` — fetches up-to-date documentation for the resolved library, scoped to a topic

**Constraint**: context7 informs **syntax and structure only** — never content or data values. The Asset Fidelity Rule and "no invention" policy remain absolute; all data values come from architecture docs. If context7 is not configured, both skills degrade gracefully using built-in templates.
