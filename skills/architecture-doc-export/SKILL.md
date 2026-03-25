---
name: architecture-doc-export
description: >
  On-demand export of architecture documents to professional Word (.docx) files.
  Exports are never automatic — invoke explicitly when ready to produce deliverables.
  Solution Architecture mode synthesizes an Executive Summary from docs/01-system-overview.md,
  the component index, and the compliance manifest (if present), then exports individual ADR docs.
  Handoff mode exports selected component development handoffs from docs/handoffs/.
triggers:
  - export architecture
  - export to word
  - export to docx
  - generate word document
  - generate docx
  - export handoff
  - export component handoff
  - export dev handoff
  - export dev handoffs
  - convert to word
  - download as word
---

# Architecture Doc Export Skill

Exports architecture documents to professional Word files on demand.

> **On-demand only** — this skill never runs automatically after document generation.
> Invoke it explicitly when you are ready to produce deliverable Word files.

> **Runtime: Bun only — never Node.** All generator calls MUST use `bun run $plugin_dir/tools/docgen/generate-doc.js` (absolute path resolved in Step 0). Never use `node` or a relative path under any circumstances.
> If `bun run` appears to hang or produces no output:
> 1. Ensure the `docx` package is installed: `cd $plugin_dir/tools/docgen && bun install`
> 2. Confirm `plugin_dir` was resolved correctly in Step 0 — re-run the Glob if unsure
> 3. Run **foreground** (not in background) to capture output immediately
> Do NOT attempt `node generate-doc.js` as an alternative — it is not an authorized runtime.

> **Documentation Fidelity**: All executive summary content MUST be extracted verbatim from source files. Do not paraphrase, summarize in your own words, embellish, or generate content not present in the source documents. If a required section or heading exists in the source file but is empty, write `[NOT DOCUMENTED — add content to <source-file>]`. Compliance statistics must be computed strictly from manifest table values — do not estimate or round.

---

## What Gets Exported

| Export Mode | Input Sources | Output |
|-------------|--------------|--------|
| Solution Architecture | `docs/01-system-overview.md` + `docs/components/README.md` + `compliance-docs/COMPLIANCE_MANIFEST.md` (optional) | `exports/SA-<name>.docx` (executive summary) + `exports/ADR-NNN-<title>.docx` per ADR |
| Component Handoff | Selected handoff(s) from `docs/handoffs/` | `exports/HANDOFF-<component>.docx` per component |

---

## Step 0 — Resolve Plugin Directory

Before running any export workflow, resolve the absolute path to the plugin installation. The generator is bundled inside the plugin — never at the user's project root.

**Step A — Glob (dev/local mode)**:

Glob for: `**/solutions-architect-skills/tools/docgen/generate-doc.js`

If found, strip `/tools/docgen/generate-doc.js` from the result to get `plugin_dir`.

**Step B — Marketplace fallback**:

If Glob returns nothing, run:

```bash
plugin_dir=$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/skills/architecture-compliance/utils/resolve-plugin-dir.ts)
```

If both steps fail, stop and report:
```
❌ Cannot locate plugin directory. Ensure the plugin is installed correctly.
```

All subsequent `bun run` calls MUST use `$plugin_dir/tools/docgen/generate-doc.js`.

---

## Workflow A — Export Solution Architecture

**Trigger phrases**: "export architecture", "export to Word", "export solution architecture"

### Step A.1 — Gather Source Files

Read these files:

| File | Required | Purpose |
|------|----------|---------|
| `docs/01-system-overview.md` | ✅ Yes | Executive Summary + System Overview sections |
| `docs/02-architecture-principles.md` | ✅ Yes | Architecture principles that drove the design |
| `docs/components/README.md` | ✅ Yes | Component index table (4-column: #, Component, File, Type) |
| `compliance-docs/COMPLIANCE_MANIFEST.md` | ⬜ Optional | Compliance summary table and scores |

If `docs/01-system-overview.md` is not found:

```
❌ docs/01-system-overview.md not found.
   Generate architecture documentation first with /skill architecture-docs.
```

### Step A.2 — Compose the Executive Summary

Build a temporary markdown document (`sa-executive-summary.md`) with the following structure:

---

```markdown
# <Solution Name> — Executive Summary

<!-- source: docs/01-system-overview.md -->
## Executive Summary
<Extract the content under the "Executive Summary" heading from docs/01-system-overview.md
 through (but not including) the "System Overview" heading>

## System Overview
<Extract the content under the "System Overview" heading from docs/01-system-overview.md
 through end of file (or the next H1/H2 boundary)>

<!-- source: docs/02-architecture-principles.md -->
## Architecture Principles
<Extract the full content from docs/02-architecture-principles.md — all principles with their
 Description, Implementation, and Trade-offs subsections, verbatim>

<!-- source: docs/components/README.md -->
## Architecture Components
<Paste the Markdown table from docs/components/README.md (the 4-column # / Component / File / Type table only — skip the managed-by comment, breadcrumb, and prose)>

<!-- source: compliance-docs/COMPLIANCE_MANIFEST.md — only if file exists -->
## Compliance Summary
**Overall**: <Total Contracts> contracts · Average Score: <X.X>/10 · Average Completeness: <N>%

<Paste the "Generated Documents" table from COMPLIANCE_MANIFEST.md (Contract Type / Filename / Score / Status / Completeness / Generated)>

**Status breakdown**: Approved: N · In Review: N · Draft: N · Rejected: N

## Architecture Decision Records
<Build a Markdown table from the ADR files found in Step A.4 search:>
| # | Title | Status | File |
|---|-------|--------|------|
| ADR-001 | <title from H1> | <status from frontmatter or NOT DOCUMENTED> | ADR-001-<slug>.md |
...
```

---

**Extraction fidelity rules**:
1. Extract content **verbatim** from source files — do not paraphrase, rewrite, or add commentary
2. If a heading exists but has no content beneath it, write: `[NOT DOCUMENTED — add content to <source-file>]`
3. Compliance statistics (score, completeness, status counts) must be **computed from the manifest table** — do not estimate
4. The component table must be pasted exactly as it appears in `docs/components/README.md` — do not reformat or add columns
5. Do not add sections, content, or data not present in the source files

Use the `# Title` from `docs/01-system-overview.md` as the solution name (kebab-case it for the output filename).

### Step A.3 — Export Executive Summary to Word

Validate the output directory exists:
```bash
bun $plugin_dir/skills/architecture-compliance/utils/check-dir.ts exports
```
If output is empty (directory does not exist), create it:
```bash
mkdir exports
```

```bash
# MUST use bun — never node
bun run $plugin_dir/tools/docgen/generate-doc.js \
  --type    solution-architecture \
  --input   sa-executive-summary.md \
  --output  exports/SA-<solution-name>.docx \
  --author  "Solution Architecture" \
  --version "1.0" \
  --status  "Draft"
```

### Step A.4 — Find and Export Individual ADRs

Scan for ADR files in these locations (in order):
- `adr/ADR-*.md`
- `docs/adr/ADR-*.md`
- `docs/decisions/ADR-*.md`
- `ADR-*.md` in project root

For each ADR found:

```bash
# MUST use bun — never node
bun run $plugin_dir/tools/docgen/generate-doc.js \
  --type    adr \
  --input   <path-to-ADR-NNN-name.md> \
  --output  exports/ADR-NNN-<name>.docx \
  --author  "Solution Architecture" \
  --version "1.0" \
  --status  "Draft"
```

### Step A.5 — Clean Up and Report

Delete the temporary markdown file (`sa-executive-summary.md`), then report:

```
✅ Solution Architecture Export Complete

   exports/SA-<solution-name>.docx          (Executive Summary)
   exports/ADR-001-<title>.docx             (Architecture Decision 001)
   exports/ADR-002-<title>.docx             (Architecture Decision 002)
   ...
```

---

## Workflow B — Export Component Handoff

**Trigger phrases**: "export handoff", "export dev handoff", "export <component-name> to Word"

### Step B.1 — List Available Handoffs

Check `docs/handoffs/` for handoff documents (pattern: `*-handoff.md`). If none found:

```
❌ No handoff documents found in docs/handoffs/.
   Generate them first with /skill architecture-dev-handoff.
```

If handoffs exist, display a numbered list:

```
Available component handoffs:

  1. 01-payment-api-handoff.md        Payment API
  2. 02-user-service-handoff.md       User Service
  3. 03-audit-db-handoff.md           Audit Database

Which component(s) to export?
  Enter numbers (e.g. 1, 3), ranges (e.g. 1-3), or "all"
```

### Step B.2 — Export Selected Components

Validate the output directory exists:
```bash
bun $plugin_dir/skills/architecture-compliance/utils/check-dir.ts exports
```
If output is empty (directory does not exist), create it:
```bash
mkdir exports
```

For each selected handoff:

```bash
# MUST use bun — never node
bun run $plugin_dir/tools/docgen/generate-doc.js \
  --type    handoff \
  --input   docs/handoffs/<NN>-<component>-handoff.md \
  --output  exports/HANDOFF-<component>.docx \
  --author  "Solution Architecture" \
  --version "1.0" \
  --status  "Draft"
```

### Step B.3 — Report

```
✅ Handoff Export Complete
   exports/HANDOFF-payment-api.docx    (Payment API)
   exports/HANDOFF-user-service.docx   (User Service)
```

---

## Document Styling

| Document | Type Code | Color | Purpose |
|----------|-----------|-------|---------|
| Executive Summary | `SA` | Corporate blue `#1F4E79` | Architecture overview deliverable |
| ADR-*.md | `ADR` | Amber/Gold `#8B6914` | Architecture decisions |
| Component handoffs | `HANDOFF` | Teal `#0D7377` | Dev team deliverables |

Each document type has a distinct color: corporate blue for the SA executive summary, amber/gold for ADRs, and teal for development handoffs.

---

## Output Location

All exports land in `exports/` at the project root (validated via `check-dir.ts`, created if missing).

```
exports/
├── SA-payment-gateway.docx              ← Executive Summary
├── ADR-001-api-gateway-choice.docx      ← Individual ADR
├── ADR-002-database-selection.docx      ← Individual ADR
├── HANDOFF-payment-api.docx
└── HANDOFF-user-service.docx
```

---

## Dependency Check

If you see a `Cannot find module 'docx'` error:

```bash
cd tools/docgen && bun install
```

Only needed once.

---

## Prerequisites

- `docs/01-system-overview.md` and `docs/components/README.md` created by `/skill architecture-docs`
- ADR files created by `/skill architecture-docs` (ADR workflow)
- Compliance manifest created by `/skill architecture-compliance`
- Component handoffs created by `/skill architecture-dev-handoff`
