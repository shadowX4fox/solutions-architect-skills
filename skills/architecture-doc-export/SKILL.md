---
name: architecture-doc-export
description: >
  On-demand export of Solution Architecture documents and Component Development Handoffs
  to professional Word (.docx) files. Exports are never automatic — invoke explicitly.
  Produces: one docx for ARCHITECTURE.md + one per ADR (Solution Architecture export),
  or one docx per selected component handoff (Handoff export).
triggers:
  - export architecture
  - export to word
  - export to docx
  - generate word document
  - generate docx
  - export handoff
  - export component handoff
  - convert to word
  - download as word
---

# Architecture Doc Export Skill

Exports architecture documents to professional Word files on demand.

> **On-demand only** — this skill never runs automatically after document generation.
> Invoke it explicitly when you are ready to produce deliverable Word files.

---

## What Gets Exported

| Export Mode | Input | Output |
|-------------|-------|--------|
| Solution Architecture | `ARCHITECTURE.md` + all `ADR-*.md` files | One `.docx` per file in `exports/` |
| Component Handoff | Selected component handoff(s) from `docs/handoffs/` | One `.docx` per selected component |

---

## Workflow A — Export Solution Architecture

**Trigger phrases**: "export architecture", "export to Word", "export ARCHITECTURE.md"

### Step A.1 — Locate ARCHITECTURE.md

Search the project root and `docs/` for `ARCHITECTURE.md`. If not found:

```
❌ ARCHITECTURE.md not found. Generate it first with /skill architecture-docs.
```

### Step A.2 — Export ARCHITECTURE.md

```bash
bun run tools/docgen/generate-doc.js \
  --type    solution-architecture \
  --input   <path-to-ARCHITECTURE.md> \
  --output  exports/SA-<solution-name>.docx \
  --author  "Solution Architecture" \
  --version "1.0" \
  --status  "Draft"
```

Use the solution name from the `# <Title>` heading in ARCHITECTURE.md as `<solution-name>` (kebab-cased, spaces → hyphens).

### Step A.3 — Find and Export ADRs

Scan for ADR files matching:
- `ADR-*.md` in project root
- `docs/adr/ADR-*.md`
- `docs/decisions/ADR-*.md`

For each ADR found:

```bash
bun run tools/docgen/generate-doc.js \
  --type    adr \
  --input   <path-to-ADR-NNN-name.md> \
  --output  exports/ADR-NNN-<name>.docx \
  --author  "Solution Architecture" \
  --version "1.0" \
  --status  "Draft"
```

### Step A.4 — Report

List every file produced:

```
✅ Solution Architecture Export Complete
   exports/SA-<name>.docx        (ARCHITECTURE.md)
   exports/ADR-001-<title>.docx  (ADR-001)
   exports/ADR-002-<title>.docx  (ADR-002)
   ...
```

---

## Workflow B — Export Component Handoff

**Trigger phrases**: "export handoff", "export component handoff", "export <component-name> to Word"

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
| ARCHITECTURE.md | `SA` | Corporate blue `#1F4E79` | Technical architecture |
| ADR-*.md | `ADR` | Corporate blue `#1F4E79` | Architecture decisions |
| Component handoffs | `HANDOFF` | Teal `#0D7377` | Dev team deliverables |

Corporate blue is reserved exclusively for architecture artifacts. Handoff documents use teal to signal their role in the development phase.

---

## CHANGELOG Directive (Optional)

Add this to any `ARCHITECTURE.md` to render a version history table before the document body:

```markdown
<!-- CHANGELOG: 1.0|2024-01-10|Solution Architecture|Initial draft;1.1|2024-02-01|Solution Architecture|Added diagrams -->
```

Format: `version|date|author|description`, entries separated by `;`.

---

## Output Location

All exports land in `exports/` at the project root. The generator auto-creates the directory.

```
exports/
├── SA-payment-gateway.docx
├── ADR-001-api-gateway-choice.docx
├── ADR-002-database-selection.docx
├── HANDOFF-payment-api.docx
└── HANDOFF-user-service.docx
```

---

## Dependency Check

The generator requires `docx` (npm). On first run the generator will fail if `node_modules` is absent.

If you see a `Cannot find module 'docx'` error:

```bash
cd tools/docgen && bun install
```

This installs the `docx` package into `tools/docgen/node_modules/`. Only needed once.

---

## Prerequisites

- ARCHITECTURE.md created by `/skill architecture-docs`
- ADR files created by `/skill architecture-docs` (Workflow — ADR)
- Component handoffs created by `/skill architecture-dev-handoff`
