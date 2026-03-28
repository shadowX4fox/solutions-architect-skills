---
name: architecture-blueprint
description: Generate Business and Application blueprint markdown files from ARCHITECTURE.md. Extracts architecture data to fill standardized organizational templates (datos de iniciativa / initiative data). Detects architecture document language and selects the matching template automatically. Invoke when the user asks to generate blueprints, initiative data sheets, datos de iniciativa, or organizational architecture forms.
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

Generates standardized blueprint markdown files by extracting data from the architecture documentation and filling organizational templates. Detects the language of the architecture docs, selects the matching-language template, and produces output files written to the same directory as `ARCHITECTURE.md`.

**Available templates**:
| Language | Business | Application |
|----------|----------|-------------|
| English (`en`) | `BUSINESS_TEMPLATE_EN.md` | `APPLICATION_TEMPLATE_EN.md` *(pending)* |
| Spanish (`es`) | `BUSINESS_TEMPLATE_ES.md` | `APPLICATION_TEMPLATE_ES.md` *(pending)* |

---

## Automatic Workflow Detection

This skill activates automatically when the user's message contains any of:
- "generate blueprint", "create blueprint", "architecture blueprint"
- "datos de iniciativa", "business blueprint", "application blueprint"
- "blueprint files", "fill blueprint", "generate initiative data"

**Action when detected**: proceed directly to Step 0.

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
Glob: **/solutions-architect-skills/skills/architecture-blueprint/BUSINESS_TEMPLATE_EN.md
```
If found, strip `/skills/architecture-blueprint/BUSINESS_TEMPLATE_EN.md` to get `plugin_dir`.

**Step B — Marketplace fallback**:
```bash
plugin_dir=$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/skills/architecture-compliance/utils/resolve-plugin-dir.ts)
```

---

## Step 0.5: Detect Architecture Language

Read the first 30 lines of `docs/01-system-overview.md` and scan for language indicator keywords:

**English indicators**: "Executive Summary", "System Overview", "Problem Statement", "Business Value", "Architecture Principles", "Key Metrics", "Solution"

**Spanish indicators**: "Resumen Ejecutivo", "Descripción del Sistema", "Planteamiento del Problema", "Valor de Negocio", "Principios de Arquitectura", "Métricas Clave", "Solución"

**Decision rules**:
- If 3+ English indicators found → `lang = en`
- If 3+ Spanish indicators found → `lang = es`
- If ambiguous (fewer than 3 matches in either language) → ask the user:
  ```
  🌐 Could not confidently detect architecture language.
  Use which template language? [en = English / es = Spanish]
  ```
- If the user explicitly passes a language flag (e.g., "generate blueprint in spanish", "use english template") → override detection with the specified language

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

Load the template(s) required for the selected mode and detected language from `$plugin_dir`:

**Business template**:
- `lang = en` → `$plugin_dir/skills/architecture-blueprint/BUSINESS_TEMPLATE_EN.md`
- `lang = es` → `$plugin_dir/skills/architecture-blueprint/BUSINESS_TEMPLATE_ES.md`

**Application template**:
- `lang = en` → `$plugin_dir/skills/architecture-blueprint/APPLICATION_TEMPLATE_EN.md`
- `lang = es` → `$plugin_dir/skills/architecture-blueprint/APPLICATION_TEMPLATE_ES.md`
- If the file does NOT exist → skip Application generation and display:
  ```
  ℹ️  Application template ([lang]) not yet configured. Skipping Application blueprint.
     To add it: place APPLICATION_TEMPLATE_EN.md or APPLICATION_TEMPLATE_ES.md in skills/architecture-blueprint/
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
| `docs/08-scalability-and-performance.md` | Capacity sizing: users, TPS, storage, scaling strategy *(Application template)* |
| `adr/ADR-*.md` | Architecture decisions, alternatives, criteria, assumptions *(Application template)* |
| `compliance-docs/COMPLIANCE_MANIFEST.md` | Compliance status per contract area *(Application template — optional)* |

If additional `docs/` files are needed for specific template fields, load them on demand (e.g., `docs/07-security-architecture.md` for security-related fields, `docs/09-operational-considerations.md` for deployment/location and debt fields).

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

### Field Mapping: Business Template (EN and ES)

| EN Placeholder | ES Placeholder | Intent | Primary Source | Fallback |
|---|---|---|---|---|
| `<City, other locations>` | `<Quito, otras sedes>` | Physical location / deployment region | `docs/09-operational-considerations.md` → deployment region or cloud region | `docs/01-system-overview.md` → Deployment section |
| `<Business domain – Per capability map>` | `<Dominio de negocio – Según mapa de capacidades>` | Business domain | `docs/01-system-overview.md` → System Overview or Business Value section | PO Spec → Business Context |
| `<Cross-cutting project, Regulatory project, Product increment project, Project>` | `<Proyecto transversal, Proyecto regulatorio, Proyecto incremento producto, Proyecto>` | Project classification type | `docs/01-system-overview.md` → Problem Statement or Business Value | PO Spec → Business Objectives |
| `<Tribe Name>` | `<Nombre de Tribu>` | Tribe name (org structure) | Architecture docs do not typically contain this | `NOT FOUND — suggest: add to docs/01-system-overview.md under Team/Org section` |
| `<Cell Name>` | `<Nombre de Célula>` | Cell name (org structure) | Architecture docs do not typically contain this | `NOT FOUND — suggest: add to docs/01-system-overview.md under Team/Org section` |
| `<Product owner name> <email>` | `<Nombre del dueño de producto> <email>` | Product Owner name and email | PO Spec if available | `NOT FOUND — suggest: add to PRODUCT_OWNER_SPEC.md` |
| `<Tribe lead name> <email>` | `<Nombre de líder de tribu> <email>` | Tribe Lead | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Technical tribe lead name> <email>` | `<Nombre de líder técnico de tribu> <email>` | Technical Tribe Lead | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Assigned enterprise architect> <email>` | `<Nombre de arquitecto empresarial asignado> <email>` | Enterprise Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Assigned solutions architect> <email>` | `<Nombre de arquitecto de soluciones asignado> <email>` | Solutions Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Assigned integration architect> <email>` | `<Nombre de arquitecto de integración asignado> <email>` | Integration Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Assigned data architect> <email>` | `<Nombre de arquitecto de datos asignado> <email>` | Data Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Assigned security architect> <email>` | `<Nombre de arquitecto de seguridad asignado> <email>` | Security Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Assigned software architect> <email>` | `<Nombre de arquitecto de software asignado> <email>` | Software Architect | Architecture docs do not typically contain this | `NOT FOUND` |
| `<Application ID in the enterprise architecture portfolio>` | `<ID de aplicación en el portafolio de arquitectura empresarial>` | Enterprise portfolio app ID | Architecture docs do not typically contain this | `NOT FOUND — suggest: obtain from enterprise architecture portfolio system` |
| `<The what>` | `<El qué>` | What the initiative does | `docs/01-system-overview.md` → Problem Statement or Solution description (first sentence) | PO Spec → Business Objectives |
| `<The how>` | `<El cómo>` | How the initiative achieves it | `docs/01-system-overview.md` → Solution section (approach/method) | `docs/02-architecture-principles.md` → key principles |
| `<The why>` | `<El para>` | Purpose / outcome | `docs/01-system-overview.md` → Business Value section (impact statements) | PO Spec → Success Criteria |
| `<URL_FUNCTIONAL_DETAIL_DOC>` | `<URL_DOC_DETALLE_FUNCIONAL>` | URL to functional detail doc | Architecture docs do not typically contain this | `NOT FOUND — suggest: add functional spec URL to docs/10-references.md` |
| `<URL_CAPABILITY_MAP>` | `<URL_MAPA_CAPACIDADES>` | URL to capability map | Architecture docs do not typically contain this | `NOT FOUND — suggest: add capability map URL to docs/10-references.md` |
| `<URL_TARGET_VALUE_FLOW>` | `<URL_FLUJO_VALOR_OBJETIVO>` | URL to value flow diagram | Architecture docs do not typically contain this | `NOT FOUND — suggest: add value flow URL to docs/10-references.md` |
| `<URL_REFERENCE_ARCHITECTURE>` | `<URL_ARQ_REFERENCIA>` | URL to reference architecture diagram | `docs/03-architecture-layers.md` → check for Mermaid diagrams | `NOT FOUND — suggest: export diagram from docs/03-architecture-layers.md` |

### Field Mapping: Application Template (EN and ES)

#### Design Drivers

| EN Placeholder | ES Placeholder | Intent | Primary Source | Fallback |
|---|---|---|---|---|
| `<Effective change in customer experience.>` | `<Cambio efectivo en la experiencia de los clientes.>` | Value delivery description | `docs/01-system-overview.md` → Business Value / Design Drivers section | PO Spec → Success Criteria |
| `<Upper threshold for value delivery and impact>` | `<Umbral superior de entrega de valor e impacto>` | Upper bound that classifies Value Delivery as HIGH impact | `docs/01-system-overview.md` → Design Drivers (Value Delivery metric/percentage); describe as "Greater than X% High Impact" using the actual percentage from docs | `NOT FOUND — suggest: add value delivery threshold to docs/01-system-overview.md Design Drivers` |
| `<Lower threshold for value delivery and impact>` | `<Umbral inferior de entrega de valor e impacto>` | Lower bound that classifies Value Delivery as LOW impact | `docs/01-system-overview.md` → Design Drivers; complement of upper threshold, e.g., "Less than X% Low Impact" | `NOT FOUND — suggest: add value delivery threshold to docs/01-system-overview.md Design Drivers` |
| `<LOW/HIGH>` (Value Delivery) | `<BAJO/ALTO>` (Entrega de valor) | Impact rating | `docs/01-system-overview.md` → Design Drivers impact metrics; compare extracted value against extracted threshold | `NOT FOUND — suggest: add Design Drivers metrics to docs/01-system-overview.md` |
| `<Estimated number of customers impacted by the change.>` | `<Cantidad estimada de clientes impactados por el cambio.>` | Scale description | `docs/01-system-overview.md` → Key Metrics (users, reach) or Design Drivers | PO Spec → Business Context |
| `<Upper threshold for scale and impact>` | `<Umbral superior de escala e impacto>` | Upper bound that classifies Scale as HIGH impact | `docs/01-system-overview.md` → Key Metrics (peak users/customers); describe as "Greater than X users/customers High Impact" using actual value | `NOT FOUND — suggest: add user scale threshold to docs/01-system-overview.md Key Metrics` |
| `<Lower threshold for scale and impact>` | `<Umbral inferior de escala e impacto>` | Lower bound that classifies Scale as LOW impact | `docs/01-system-overview.md` → Key Metrics; complement of upper threshold | `NOT FOUND — suggest: add user scale threshold to docs/01-system-overview.md Key Metrics` |
| `<LOW/HIGH>` (Scale) | `<BAJO/ALTO>` (Escala) | Scale impact rating | Compare extracted user count against extracted scale threshold | `NOT FOUND — suggest: add user count to docs/01-system-overview.md Key Metrics` |
| `<Number of impacts on configuration, development, or implementation in applications.>` | `<Cantidad de impactos en configuración, desarrollo o implementación en las aplicaciones.>` | Implementation impacts description | `docs/01-system-overview.md` → Design Drivers or `docs/components/README.md` → component count | `NOT FOUND — suggest: add implementation impact count to docs/01-system-overview.md` |
| `<Upper threshold for application impacts>` | `<Umbral superior de impactos en aplicaciones>` | Upper bound that classifies application Impacts as HIGH | `docs/components/README.md` → total component count; `docs/01-system-overview.md` → Design Drivers; describe as "Greater than N application impacts High Impact" | `NOT FOUND — suggest: add application impact threshold to docs/01-system-overview.md Design Drivers` |
| `<Lower threshold for application impacts>` | `<Umbral inferior de impactos en aplicaciones>` | Lower bound that classifies application Impacts as LOW | Complement of upper threshold | `NOT FOUND — suggest: add application impact threshold to docs/01-system-overview.md Design Drivers` |
| `<LOW/HIGH>` (Impacts) | `<BAJO/ALTO>` (Impactos) | Impacts rating | Compare extracted component/impact count against extracted threshold | `NOT FOUND — suggest: add impact count to docs/01-system-overview.md Design Drivers` |

#### Architecture Decisions

For each ADR found in `adr/ADR-*.md`, extract one entry per ADR. If multiple ADRs exist, generate one block per ADR:

| EN Placeholder | ES Placeholder | Intent | Source |
|---|---|---|---|
| `<Description of the problem or need that prompted the architecture decision>` | `<Descripción del problema o necesidad que generó la decisión de arquitectura>` | ADR problem statement | ADR file → "Context" or "Problem Statement" section |
| `<Description of the decision made>` | `<Descripción de la decisión tomada>` | ADR decision | ADR file → "Decision" section |
| `<Description of the technical implications of the decision>` | `<Descripción de las implicaciones técnicas de la decisión>` | Technical consequences | ADR file → "Consequences" section — technical items only |
| `<Description of non-technical implications>` | `<Descripción de implicaciones no técnicas>` | Operational/business consequences | ADR file → "Consequences" section — non-technical items |
| `<Description of alternative 1>` ... `<Description of alternative N>` | `<Descripción de la alternativa 1>` ... `<Descripción de la alternativa N>` | Evaluated alternatives | ADR file → "Options Considered" or "Alternatives" section |
| `<Description of criterion or principle 1>` ... `<Description of criterion or principle N>` | `<Descripción del criterio o principio 1>` ... `<Descripción del criterio o principio N>` | Decision criteria / principles | ADR file → "Decision Criteria" section or `docs/02-architecture-principles.md` |
| `<Description of assumption 1>` ... `<Description of assumption N>` | `<Descripción de la suposición 1>` ... `<Descripción de la suposición N>` | Assumptions | ADR file → "Assumptions" section |

If NO ADR files found: fill each placeholder with `NOT FOUND — suggest: create ADRs using /skill architecture-definition-record`.

#### Capacity Sizing

| EN Placeholder | ES Placeholder | Intent | Primary Source | Fallback |
|---|---|---|---|---|
| `<Describe normal user demand>` | `<Describir la demanda normal de usuarios>` | Normal user load | `docs/08-scalability-and-performance.md` → Scaling targets or current load | `docs/01-system-overview.md` → Key Metrics (Read TPS, users) |
| `<Describe peak user demand, how many users are estimated and when>` | `<Describir la demanda pico de usuarios, cuántos usuarios se estiman y cuándo>` | Peak user load | `docs/08-scalability-and-performance.md` → Peak load / burst capacity | `docs/01-system-overview.md` → Key Metrics (Peak TPS) |
| `<Describe normal transaction demand>` | `<Describir la demanda normal de transacciones>` | Normal TPS | `docs/01-system-overview.md` → Key Metrics (Average Read/Write TPS) | `docs/08-scalability-and-performance.md` → Performance targets |
| `<Describe peak transaction demand, how many transactions are estimated and when>` | `<Describir la demanda pico de transacciones, cuántas transacciones se estiman y cuándo>` | Peak TPS | `docs/01-system-overview.md` → Key Metrics (Peak TPS) | `docs/08-scalability-and-performance.md` |
| `<Describe average payload size per transaction in storage units (bytes)>` | `<Describir el tamaño de la carga útil promedio por transacción en unidades de almacenamiento (bytes)>` | Payload size | `docs/08-scalability-and-performance.md` → Payload / message size | `NOT FOUND — suggest: add average payload size to docs/08-scalability-and-performance.md` |
| `<Minimum estimated GB of storage in the transactional database>` | `<Estimado mínimo en GB de almacenamiento en la base de datos transaccional>` | Min operational storage | `docs/08-scalability-and-performance.md` → Storage requirements | `NOT FOUND — suggest: add storage estimates to docs/08-scalability-and-performance.md` |
| `<Maximum estimated GB of storage in the transactional database>` | `<Estimado máximo en GB de almacenamiento en la base de datos transaccional>` | Max operational storage | `docs/08-scalability-and-performance.md` → Storage requirements | `NOT FOUND` |
| `<Minimum estimated GB of backup storage>` | `<Estimado mínimo en GB de almacenamiento en almacenamiento de respaldo>` | Min backup storage | `docs/09-operational-considerations.md` → Backup strategy | `NOT FOUND — suggest: add backup storage estimates to docs/09-operational-considerations.md` |
| `<Maximum estimated GB of backup storage>` | `<Estimado máximo en GB de almacenamiento en almacenamiento de respaldo>` | Max backup storage | `docs/09-operational-considerations.md` → Backup strategy | `NOT FOUND` |
| `<Minimum estimated GB of analytical storage>` | `<Estimado mínimo en GB de almacenamiento en almacenamiento analítico>` | Min analytical storage | `docs/08-scalability-and-performance.md` → Data/analytics layer | `NOT FOUND — suggest: add analytical storage estimates` |
| `<Maximum estimated GB of analytical storage>` | `<Estimado máximo en GB de almacenamiento en almacenamiento analítico>` | Max analytical storage | `docs/08-scalability-and-performance.md` | `NOT FOUND` |

#### Architecture Risks and Debt

| EN Placeholder | ES Placeholder | Intent | Primary Source | Fallback |
|---|---|---|---|---|
| `<Description of the architecture debt>` | `<Descripción de la deuda de Arquitectura>` | Debt description | `docs/09-operational-considerations.md` → Technical debt section | ADR files → rejected/deferred decisions |
| `<Description of the justification for the debt's existence>` | `<Descripción de la justificación de la existencia de la deuda>` | Debt justification | ADR file → Context section of related ADR | `NOT FOUND — suggest: document debt justification in an ADR` |
| `<Description of the risk associated with the debt>` | `<Descripción del riesgo asociado a la deuda>` | Debt risk | `docs/09-operational-considerations.md` → Risks section | `NOT FOUND` |
| `<Approximate date for debt remediation>` | `<Fecha aproximada de remediación de la deuda>` | Remediation timeline | `docs/09-operational-considerations.md` → Roadmap or milestones | `NOT FOUND — suggest: add remediation timeline to docs/09-operational-considerations.md` |

#### Compliance Contract — Approvals

For each of the 10 compliance areas, extract the Status and Observations from `compliance-docs/COMPLIANCE_MANIFEST.md`.

**Compliance area mapping** (ES name → EN name → contract file pattern):

| ES Area | EN Area | Manifest Contract Type |
|---------|---------|----------------------|
| Continuidad de Negocio | Business Continuity | `Continuidad de Negocio` |
| Arquitectura SRE | SRE Architecture | `Arquitectura SRE` |
| Arquitectura Cloud | Cloud Architecture | `Arquitectura Cloud` |
| Arquitectura Datos y Analítica - IA | Data & Analytics Architecture - AI | `Arquitectura Datos y Analítica` |
| Arquitectura Desarrollo | Development Architecture | `Arquitectura Desarrollo` |
| Transformación de Procesos y Automatización | Process Transformation and Automation | `Transformación de Procesos` |
| Arquitectura Seguridad | Security Architecture | `Arquitectura Seguridad` |
| Plataformas e Infraestructura TI | Platforms and IT Infrastructure | `Plataformas e Infraestructura` |
| Arquitectura Empresarial | Enterprise Architecture | `Arquitectura Empresarial` |
| Arquitectura de Integración | Integration Architecture | `Arquitectura de Integración` |

**Status mapping from manifest score**:
- Score ≥ 8.0 → `Cumple` / `Compliant`
- Score 5.0–7.9 → `No cumple` / `Non-compliant`
- Contract missing or score = N/A → `No aplica` / `Not applicable`

**Observations**: Extract the top gap or note from the manifest's observations column, if present. If not present: write `NOT FOUND — suggest: run /skill architecture-compliance to generate contracts`.

**If `compliance-docs/COMPLIANCE_MANIFEST.md` does not exist**: fill all statuses with `NOT FOUND — suggest: run /skill architecture-compliance to generate compliance contracts`.

---

## Step 5: Determine Output Directory

The output directory is the same directory that contains `ARCHITECTURE.md`:
- If `ARCHITECTURE.md` is at project root → write to `./`
- If `ARCHITECTURE.md` is in a subdirectory (e.g., `projects/foo/ARCHITECTURE.md`) → write to `projects/foo/`

Output filenames include the language suffix:
- Business (EN): `BLUEPRINT_BUSINESS_EN.md`
- Business (ES): `BLUEPRINT_BUSINESS_ES.md`
- Application (EN): `BLUEPRINT_APPLICATION_EN.md`
- Application (ES): `BLUEPRINT_APPLICATION_ES.md`

---

## Step 6: Write Output Files

Write each filled template to its output path using the Write tool.

If the output file already exists, display:
```
⚠️  BLUEPRINT_BUSINESS_EN.md already exists. Overwrite? [Yes/No]
```
Wait for confirmation before overwriting.

---

## Step 7: Summary Report

After writing, display the fill summary:

```
═══════════════════════════════════════════════════════════
BLUEPRINT GENERATION COMPLETE
═══════════════════════════════════════════════════════════

🌐 Language detected: English (en)

📄 BLUEPRINT_BUSINESS_EN.md → [output_dir]

Field Fill Summary:
✅ Filled (N):
   - Headquarters: [extracted value]
   - Domain: [extracted value]
   - The what / The how / The why: [extracted values]
   ...

⚠️  NOT FOUND (N) — requires manual input:
   - Tribe → suggest: add to docs/01-system-overview.md
   - Cell → suggest: add to docs/01-system-overview.md
   - Product Owner → suggest: add to PRODUCT_OWNER_SPEC.md
   - All architect names/emails → suggest: add to docs/01-system-overview.md
   - All URLs → suggest: add to docs/10-references.md
   ...
═══════════════════════════════════════════════════════════
```
