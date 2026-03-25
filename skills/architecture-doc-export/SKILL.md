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

> **Runtime: Bun only — never Node.** All generator calls MUST use `bun run`. Never use `node` or fall back to it under any circumstances.
> If `bun run` appears to hang or produces no output:
> 1. Ensure the `docx` package is installed: `cd tools/docgen && bun install`
> 2. Use an **absolute path** to `generate-doc.js` — resolve it from the plugin install location
> 3. Run **foreground** (not in background) to capture output immediately
> Do NOT attempt `node generate-doc.js` as an alternative — it is not an authorized runtime.

---

## What Gets Exported

| Export Mode | Input Sources | Output |
|-------------|--------------|--------|
| Solution Architecture | `docs/01-system-overview.md` + `docs/components/README.md` + `compliance-docs/COMPLIANCE_MANIFEST.md` (optional) | `exports/SA-<name>.docx` (executive summary) + `exports/ADR-NNN-<title>.docx` per ADR |
| Component Handoff | Selected handoff(s) from `docs/handoffs/` | `exports/HANDOFF-<component>.docx` per component |

---

## Workflow A — Export Solution Architecture

**Trigger phrases**: "export architecture", "export to Word", "export solution architecture"

### Step A.1 — Gather Source Files

Read these files:

| File | Required | Purpose |
|------|----------|---------|
| `docs/01-system-overview.md` | ✅ Yes | Executive Summary + System Overview sections |
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
| ADR-001 | <title from H1> | <status from frontmatter or "Draft"> | ADR-001-<slug>.md |
...
```

---

Use the `# Title` from `docs/01-system-overview.md` as the solution name (kebab-case it for the output filename).

### Step A.3 — Export Executive Summary to Word

```bash
# MUST use bun — never node
bun run tools/docgen/generate-doc.js \
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
bun run tools/docgen/generate-doc.js \
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

For each selected handoff:

```bash
# MUST use bun — never node
bun run tools/docgen/generate-doc.js \
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

All exports land in `exports/` at the project root (auto-created).

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
