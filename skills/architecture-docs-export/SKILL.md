---
name: architecture-docs-export
description: >
  On-demand export of architecture documents to professional Word (.docx) files.
  Exports are never automatic — invoke explicitly when ready to produce deliverables.
  Solution Architecture mode synthesizes an Executive Summary from docs/01-system-overview.md,
  the component index, and the compliance manifest (if present), then exports individual ADR docs.
  Handoff mode exports selected component development handoffs from handoffs/.
  IMPORTANT — this skill ONLY produces Word .docx files. It does NOT handle releasing,
  publishing, tagging, freezing, bumping, or finalizing an architecture version. For the
  Draft → Released lifecycle (git tag architecture-v{version}, archive snapshot, semver bump),
  use the `architecture-docs` skill (Workflow 10) instead. Do NOT invoke this skill when the
  user says "release my architecture", "release architecture", "publish architecture",
  "ship architecture", "tag architecture version", "freeze architecture",
  "bump architecture version", or "finalize architecture" — those route to `architecture-docs`.
---

# Architecture Doc Export Skill — Orchestrator

Exports architecture documents to professional Word files on demand.

> **On-demand only** — this skill never runs automatically after document generation. Invoke it explicitly when you are ready to produce deliverable Word files.

---

## Architecture — Orchestrator + Sub-Agent (v3.8.0)

As of v3.8.0, this skill is an **orchestrator**. The actual export work (file reads, markdown composition, `bun run tools/docgen/generate-doc.js` invocations) runs inside the `docs-export-generator` sub-agent, pinned to `model: sonnet`.

**Why**: Export is a high-frequency, zero-synthesis task — pure verbatim extraction + docgen orchestration. Running it on Opus (the default for most Claude Code sessions) wastes token budget. The sub-agent pins Sonnet deterministically, so cost per run does not depend on whoever invokes it. Teams that batch-export ADRs, handoffs, and compliance contracts weekly/monthly see immediate savings.

**Orchestrator responsibilities** (main context):
- User interaction: listing ADRs / handoffs / compliance contracts, parsing selection ("all", numbers, ranges)
- Plugin directory resolution
- Compliance contract metadata extraction (score + status from Document Control table) for user-facing display
- Spawning the sub-agent with the full job spec

**Sub-agent responsibilities** (`agents/docs-export-generator.md`):
- Read source files verbatim
- Compose the executive summary markdown (SA mode)
- Call docgen per output
- Clean up temp files
- Report a structured `EXPORT_RESULT:` block back

---

> **Runtime: Bun only — never Node.** All generator calls inside the sub-agent use `bun run $plugin_dir/tools/docgen/generate-doc.js` (absolute path). If `bun run` hangs:
> 1. Ensure the `docx` package is installed: `cd $plugin_dir/tools/docgen && bun install`
> 2. Confirm `plugin_dir` was resolved correctly in Step 0 — re-run the Glob if unsure
> 3. Never fall back to `node` — it is not an authorized runtime

> **Documentation Fidelity**: All executive summary content is extracted verbatim from source files. No paraphrasing, no embellishment. If a required section exists in the source but is empty, the sub-agent writes `[NOT DOCUMENTED — add content to <source-file>]`. Compliance statistics are computed strictly from manifest table values.

---

## What Gets Exported

| Export Mode | Input Sources | Output |
|-------------|--------------|--------|
| Solution Architecture | `docs/01-system-overview.md` + `docs/02-architecture-principles.md` + `docs/components/README.md` + `compliance-docs/COMPLIANCE_MANIFEST.md` (optional) | `exports/SA-<name>.docx` (executive summary) + `exports/ADR-NNN-<title>.docx` per ADR |
| Component Handoff | Selected handoff(s) from `handoffs/` | `exports/HANDOFF-<component>.docx` per component |
| Compliance Contract | Selected contract(s) from `compliance-docs/` | `exports/CC-<domain>-<project>.docx` per contract; Questions & Gaps Register cells are highlighted for stakeholder editing |

---

## Step 0 — Resolve Plugin Directory (orchestrator)

Before spawning the sub-agent, the orchestrator MUST resolve the absolute path to the plugin installation and pass it in the spawn prompt.

**Step 0a — Glob (dev/local mode)**:

Glob for: `**/{sa-skills,solutions-architect-skills}/tools/docgen/generate-doc.js`

The brace expansion matches both marketplace installs (`sa-skills/` in `~/.claude/plugins/cache/...`) and local dev clones (historical repo folder `solutions-architect-skills/`). If found, strip `/tools/docgen/generate-doc.js` from the result to get `plugin_dir`.

**Step 0b — Marketplace fallback**:

If Glob returns nothing, run:

```bash
plugin_dir=$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/skills/architecture-compliance/utils/resolve-plugin-dir.ts)
```

If both fail:
```
❌ Cannot locate plugin directory. Ensure the plugin is installed correctly.
```

`plugin_dir` is passed to the sub-agent in the spawn prompt — the sub-agent does NOT re-resolve it.

---

## Workflow A — Export Solution Architecture

**Trigger phrases**: "export architecture", "export to Word", "export solution architecture"

### Step A.1 — Validate prerequisites (orchestrator)

Confirm `docs/01-system-overview.md` exists. If not:
```
❌ docs/01-system-overview.md not found.
   Generate architecture documentation first with /skill architecture-docs.
```

### Step A.2 — Discover ADRs (orchestrator)

Scan for ADR files in these locations, in order:
- `adr/ADR-*.md`
- `docs/adr/ADR-*.md`
- `docs/decisions/ADR-*.md`
- `ADR-*.md` in project root

Collect absolute paths. If zero ADRs found, still proceed — the executive summary will have an empty ADR table.

### Step A.3 — Determine solution slug (orchestrator)

Read `docs/01-system-overview.md`'s H1; kebab-case it for the output filename. Pass as `solution_name_slug`.

### Step A.4 — Spawn the sub-agent

Invoke `sa-skills:docs-export-generator` with a prompt providing:

- `job_type: solution-architecture`
- `plugin_dir: <absolute path from Step 0>`
- `project_dir: <CWD>`
- `solution_name_slug: <from Step A.3>`
- `items: <JSON array of absolute ADR file paths from Step A.2>`

Wait for the sub-agent's `EXPORT_RESULT:` block, then report to user.

### Step A.5 — Report (orchestrator)

Parse the sub-agent's `EXPORT_RESULT:` block and display:

```
✅ Solution Architecture Export Complete

   exports/SA-<solution-name>.docx          (Executive Summary)
   exports/ADR-001-<title>.docx             (Architecture Decision 001)
   exports/ADR-002-<title>.docx             (Architecture Decision 002)
   ...
```

If `status: PARTIAL` or `FAILED`, list the failures from the result block.

---

## Workflow B — Export Component Handoff

**Trigger phrases**: "export handoff", "export dev handoff", "export <component-name> to Word"

### Step B.1 — List available handoffs (orchestrator)

Glob `handoffs/*-handoff.md`. If none found:
```
❌ No handoff documents found in handoffs/.
   Generate them first with /skill architecture-dev-handoff.
```

Otherwise display numbered list:
```
Available component handoffs:

  1. 01-payment-api-handoff.md        Payment API
  2. 02-user-service-handoff.md       User Service
  3. 03-audit-db-handoff.md           Audit Database

Which component(s) to export?
  Enter numbers (e.g. 1, 3), ranges (e.g. 1-3), or "all"
```

### Step B.2 — Parse selection (orchestrator)

Convert user input to the list of absolute paths.

### Step B.3 — Spawn the sub-agent

Invoke `sa-skills:docs-export-generator` with:

- `job_type: handoff`
- `plugin_dir: <absolute path>`
- `project_dir: <CWD>`
- `items: <JSON array of absolute handoff file paths>`

### Step B.4 — Report (orchestrator)

```
✅ Handoff Export Complete
   exports/HANDOFF-payment-api.docx    (Payment API)
   exports/HANDOFF-user-service.docx   (User Service)
```

---

## Workflow C — Export Compliance Contracts

**Trigger phrases**: "export compliance", "export compliance contract", "export compliance to Word"

### Step C.1 — List available contracts (orchestrator)

Glob `compliance-docs/*.md` (excluding `COMPLIANCE_MANIFEST.md`). If none:
```
❌ No compliance contracts found in compliance-docs/.
   Generate them first with /skill architecture-compliance.
```

For each contract, read the Document Control table and extract:
- Score (from `[VALIDATION_SCORE]` or the populated score field)
- Document status (from `| Status |` row)
- Approval authority (from the Approval Authority field)
- Generation date (from `**Generation Date**`)

Display:
```
Available compliance contracts:

  1. SRE_ARCHITECTURE_Project_2026-03-25.md      SRE Architecture          7.69/10  In Review
  2. CLOUD_ARCHITECTURE_Project_2026-03-25.md    Cloud Architecture        8.50/10  Approved
  ...

Which contract(s) to export?
  Enter numbers (e.g. 1, 3), ranges (e.g. 1-3), or "all"
```

### Step C.2 — Parse selection + derive slugs (orchestrator)

For each selected contract, derive `domain_slug` from the filename prefix (e.g., `SRE_ARCHITECTURE` → `sre-architecture`). Read the project name for `project_slug`.

### Step C.3 — Spawn the sub-agent

Invoke `sa-skills:docs-export-generator` with:

- `job_type: compliance`
- `plugin_dir: <absolute path>`
- `project_dir: <CWD>`
- `project_slug: <kebab-case project name>`
- `items: <JSON array of {path, domain_slug, score, document_status, approval_authority} objects>`

### Step C.4 — Report (orchestrator)

```
✅ Compliance Export Complete

   exports/CC-sre-architecture-project.docx       (SRE Architecture — 7.69/10 In Review)
   exports/CC-cloud-architecture-project.docx     (Cloud Architecture — 8.50/10 Approved)

📝 The Questions & Gaps Register in each document has yellow-highlighted cells (Owner, Action Required, Priority)
   ready for stakeholder review and editing in Microsoft Word.
```

---

## Document Styling

| Document | Type Code | Color | Purpose |
|----------|-----------|-------|---------|
| Executive Summary | `SA` | Corporate blue `#1F4E79` | Architecture overview deliverable |
| ADR-*.md | `ADR` | Amber/Gold `#8B6914` | Architecture decisions |
| Component handoffs | `HANDOFF` | Teal `#0D7377` | Dev team deliverables |
| Compliance contracts | `CC` | Purple `#7B2D8E` | Compliance adherence contracts with editable Questions & Gaps Register |

Compliance exports' Questions & Gaps Register has:
- Yellow-highlighted cells for **Owner**, **Action Required**, and **Priority** (editable in Word)
- Status-conditional coloring in the Compliance Summary table: green=Compliant, red=Non-Compliant, gray=Not Applicable, yellow=Unknown

---

## Output Location

All exports land in `exports/` at the project root.

```
exports/
├── SA-payment-gateway.docx              ← Executive Summary
├── ADR-001-api-gateway-choice.docx      ← Individual ADR
├── ADR-002-database-selection.docx      ← Individual ADR
├── HANDOFF-payment-api.docx
├── HANDOFF-user-service.docx
├── CC-sre-architecture-project.docx     ← Compliance Contract (Questions & Gaps editable)
└── CC-cloud-architecture-project.docx
```

---

## Dependency Check

If you see a `Cannot find module 'docx'` error from the sub-agent's report:

```bash
cd tools/docgen && bun install
```

Only needed once per plugin install.

---

## Prerequisites

- `docs/01-system-overview.md` and `docs/components/README.md` created by `/skill architecture-docs`
- ADR files created by `/skill architecture-definition-record`
- Compliance manifest created by `/skill architecture-compliance` (optional for Workflow A; required for Workflow C)
- Component handoffs created by `/skill architecture-dev-handoff` (required for Workflow B)

---

## Permissions required

Add to project `.claude/settings.json`:

```json
"Bash(bun *)",
"Bash(mkdir *)",
"Bash(rm *)",
"Write(exports/*)",
"Read(exports/*)",
"Agent(sa-skills:docs-export-generator)"
```

`Bash(rm *)` is used by the sub-agent to clean up the temporary `sa-executive-summary.md`.
