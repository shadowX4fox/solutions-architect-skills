---
name: architecture-blueprint
description: Generate Business and Application blueprint markdown files from ARCHITECTURE.md. Extracts architecture data to fill standardized organizational templates (datos de iniciativa). Invoke when the user asks to generate blueprints, initiative data sheets, datos de iniciativa, or organizational architecture forms.
triggers:
  - generate blueprint
  - create blueprint
  - datos de iniciativa
  - blueprint files
  - generate business blueprint
  - generate application blueprint
  - architecture blueprint
---

# Architecture Blueprint Skill

Generates standardized blueprint markdown files by extracting data from the architecture documentation and filling organizational templates. Produces two output files — Business and Application — written to the same directory as `ARCHITECTURE.md`.

---

## Automatic Workflow Detection

This skill activates automatically when the user's message contains any of:
- "generate blueprint", "create blueprint", "architecture blueprint"
- "datos de iniciativa", "business blueprint", "application blueprint"
- "blueprint files", "fill blueprint", "generate initiative data"

**Action when detected**: proceed directly to Step 1.

---

## Prerequisites

Before running, verify:
- `ARCHITECTURE.md` exists at the project root (or subdirectory — detect its location)
- `docs/` directory exists with at least `docs/01-system-overview.md`

If `ARCHITECTURE.md` is not found:
```
❌ ARCHITECTURE.md not found.
   Generate architecture documentation first with /skill architecture-docs.
```

---

## Step 0: Resolve Plugin Directory

Resolve `$plugin_dir` to locate the templates:

**Step A — Development mode** (glob):
```
Glob: **/solutions-architect-skills/skills/architecture-blueprint/BUSINESS_TEMPLATE.md
```
If found, strip `/skills/architecture-blueprint/BUSINESS_TEMPLATE.md` to get `plugin_dir`.

**Step B — Marketplace fallback**:
```bash
plugin_dir=$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/skills/architecture-compliance/utils/resolve-plugin-dir.ts)
```

---

## Step 1: Detect Mode

Determine which blueprints to generate based on the user's request:

| User says | Mode |
|-----------|------|
| "business" / "negocio" | Business blueprint only |
| "application" / "aplicación" / "app" | Application blueprint only |
| (default — no qualifier) | Both blueprints |

---

## Step 2: Load Templates

Load the template(s) required for the selected mode from `$plugin_dir`:

**Business template**: `$plugin_dir/skills/architecture-blueprint/BUSINESS_TEMPLATE.md`

**Application template**: `$plugin_dir/skills/architecture-blueprint/APPLICATION_TEMPLATE.md`
- If this file does NOT exist → skip Application generation and display:
  ```
  ℹ️  Application template not yet configured. Skipping Application blueprint.
     To add it: place APPLICATION_TEMPLATE.md in skills/architecture-blueprint/
  ```

---

## Step 3: Load Architecture Context

Read the following files (load all — they are small enough to fit in context):

| File | Content Used |
|------|-------------|
| `docs/01-system-overview.md` | Executive Summary, System Overview, Key Metrics, Business Value, Deployment |
| `docs/02-architecture-principles.md` | Architecture Principles |
| `docs/03-architecture-layers.md` | Architecture layers and component grouping |
| `docs/components/README.md` | Component index (names and types) |
| `ARCHITECTURE.md` | Navigation index, metadata, ADR table |

If additional `docs/` files are needed for specific template fields, load them on demand (e.g., `docs/07-security-architecture.md` for security-related fields, `docs/09-operational-considerations.md` for deployment/location fields).

Also check for a PO Spec file at the project root (glob: `**/PRODUCT_OWNER_SPEC*.md`, `**/PO_SPEC*.md`) — if found, load it as a supplementary source for business context fields.

---

## Step 4: Fill Template Fields

For each `<placeholder>` in the template:

1. **Search** the loaded architecture docs for data matching the field's intent
2. **If found** → replace the entire `<placeholder>` (angle brackets included) with the extracted value — verbatim, no paraphrasing
3. **If NOT found** → replace with:
   ```
   NOT FOUND — suggest: [recommended section or keyword to check, e.g., "add to docs/01-system-overview.md under Deployment"]
   ```
4. **Preserve all template formatting** — only replace content inside `< >` angle brackets; never alter surrounding text, markdown structure, heading levels, bold/italic markers, or static prose

### Field Mapping: Business Template (`BUSINESS_TEMPLATE.md`)

| Template Placeholder | Intent | Primary Source | Fallback |
|---|---|---|---|
| `<Quito, otras sedes>` | Physical location / deployment region | `docs/09-operational-considerations.md` → deployment region or cloud region | `docs/01-system-overview.md` → Deployment section |
| `<Dominio de negocio – Según mapa de capacidades>` | Business domain | `docs/01-system-overview.md` → System Overview paragraph or Business Value section | PO Spec → Business Context |
| `<Proyecto transversal, Proyecto regulatorio, Proyecto incremento producto, Proyecto>` | Project classification type | `docs/01-system-overview.md` → Problem Statement or Business Value | PO Spec → Business Objectives |
| `<Nombre de Tribu>` | Tribe name (org structure) | Architecture docs do not typically contain this | `NOT FOUND — suggest: add to docs/01-system-overview.md under Team/Org section` |
| `<Nombre de Célula>` | Cell name (org structure) | Architecture docs do not typically contain this | `NOT FOUND — suggest: add to docs/01-system-overview.md under Team/Org section` |
| `<Nombre del dueño de producto> <email>` | Product Owner name and email | PO Spec if available | `NOT FOUND — suggest: add to PRODUCT_OWNER_SPEC.md` |
| `<Nombre de líder de tribu> <email>` | Tribe Lead name and email | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de líder técnico de tribu> <email>` | Technical Tribe Lead | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de arquitecto empresarial asignado> <email>` | Enterprise Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de arquitecto de soluciones asignado> <email>` | Solutions Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de arquitecto de integración asignado> <email>` | Integration Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de arquitecto de datos asignado> <email>` | Data Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de arquitecto de seguridad asignado> <email>` | Security Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Nombre de arquitecto de software asignado> <email>` | Software Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<ID de aplicación en el portafolio de arquitectura empresarial>` | Enterprise portfolio app ID | Architecture docs do not typically contain this | `NOT FOUND — suggest: obtain from enterprise architecture portfolio system` |
| `<El qué>` | What the initiative does | `docs/01-system-overview.md` → Problem Statement or Solution description (first sentence) | PO Spec → Business Objectives |
| `<El cómo>` | How the initiative achieves it | `docs/01-system-overview.md` → Solution section (approach/method) | `docs/02-architecture-principles.md` → key principles |
| `<El para>` | Purpose / outcome | `docs/01-system-overview.md` → Business Value section (impact statements) | PO Spec → Success Criteria |
| `<URL_DOC_DETALLE_FUNCIONAL>` | URL to functional detail doc | Architecture docs do not typically contain this | `NOT FOUND — suggest: add functional spec URL to docs/10-references.md` |
| `<URL_MAPA_CAPACIDADES>` | URL to capability map | Architecture docs do not typically contain this | `NOT FOUND — suggest: add capability map URL to docs/10-references.md` |
| `<URL_FLUJO_VALOR_OBJETIVO>` | URL to value flow diagram | Architecture docs do not typically contain this | `NOT FOUND — suggest: add value flow URL to docs/10-references.md` |
| `<URL_ARQ_REFERENCIA>` | URL to reference architecture diagram | Architecture docs: check `docs/03-architecture-layers.md` for Mermaid diagrams | `NOT FOUND — suggest: export diagram from docs/03-architecture-layers.md` |

---

## Step 5: Determine Output Directory

The output directory is the same directory that contains `ARCHITECTURE.md`:
- If `ARCHITECTURE.md` is at project root → write to `./`
- If `ARCHITECTURE.md` is in a subdirectory (e.g., `projects/foo/ARCHITECTURE.md`) → write to `projects/foo/`

Output filenames:
- Business: `BLUEPRINT_BUSINESS.md`
- Application: `BLUEPRINT_APPLICATION.md`

---

## Step 6: Write Output Files

Write each filled template to its output path using the Write tool.

If the output file already exists, display:
```
⚠️  BLUEPRINT_BUSINESS.md already exists. Overwrite? [Yes/No]
```
Wait for confirmation before overwriting.

---

## Step 7: Summary Report

After writing, display the fill summary:

```
═══════════════════════════════════════════════════════════
BLUEPRINT GENERATION COMPLETE
═══════════════════════════════════════════════════════════

📄 BLUEPRINT_BUSINESS.md → [output_dir]

Field Fill Summary:
✅ Filled (N):
   - Sede: [extracted value]
   - Dominio: [extracted value]
   - El qué / El cómo / El para: [extracted values]
   ...

⚠️  NOT FOUND (N) — requires manual input:
   - Tribu → suggest: add to docs/01-system-overview.md
   - Célula → suggest: add to docs/01-system-overview.md
   - Product Owner → suggest: add to PRODUCT_OWNER_SPEC.md
   - All architect names/emails → suggest: add to docs/01-system-overview.md
   - All URLs → suggest: add to docs/10-references.md
   ...
═══════════════════════════════════════════════════════════
```
