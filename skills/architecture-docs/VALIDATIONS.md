# Architecture Documentation Validations

> Enforcement rules and validation checklists for ARCHITECTURE.md structure and content

## Purpose

This document defines validation rules for:
1. **Architecture Principles Enforcement** (Section 3)
2. **Section Name Enforcement** (All 13 sections)
3. **Document Structure Validation**

These rules ensure consistency and completeness across all ARCHITECTURE.md documents.

## Related Documentation

- **SKILL.md**: Operational workflows and when to apply validations
- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Content templates and section guidance
- **METRIC_CALCULATIONS.md**: Metric extraction and consistency algorithms
- **DESIGN_DRIVER_CALCULATIONS.md**: Design Drivers calculation algorithms

---

## 1. Architecture Principles Enforcement (Section 3)

The rules live in `PRINCIPLE_VALIDATION.md` (Layer 1, executed by `scripts/principle-check.js` since 8.31.1 — `P-STRUCT`, `P-HYGIENE`, `P-SEM`, `P-ADR-REF`, `P-XREF`, `P-TYPE-MATRIX`) and in `agents/reviewers/principle-quality-reviewer.md` (Layer 2). The canonical 9-principle template is `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → "Section 3". This file no longer mirrors them — read the rule file for the rule.

## 1.5 Documentation Language Enforcement

Every architecture records its documentation language once, and every artifact derived from it
must agree. Full contract: `references/LANGUAGE_POLICY.md`.

### Rules

✅ **`ARCHITECTURE.md` carries the marker**

```bash
rg -m1 '<!-- DOC_LANGUAGE:' ARCHITECTURE.md
```

Expected: exactly one line, value `en` or `es`. Absent → the document predates the gate; run the
resolution protocol (`LANGUAGE_POLICY.md` §3), confirm with the user once, and stamp it.
A value outside the registry → treat as absent.

✅ **No competing marker anywhere else**

```bash
rg -n '<!-- DOC_LANGUAGE:' . -g '*.md' | rg -v '^\./ARCHITECTURE.md'
```

Expected: no hits other than `PRODUCT_OWNER_SPEC.md` (which may carry its own, used only as the
Step 0.1 pre-selection). `ARCHITECTURE.md` is the single authority.

✅ **The gate record is present in `docs/01-system-overview.md`**

```bash
rg -n '<!-- DOC_LANGUAGE_GATE:' docs/01-system-overview.md
```

✅ **The machine layer was not translated** — the most damaging failure mode, because it fails
silently at the *next* skill rather than here:

```bash
# EXPLORER_HEADER field keys must be English
rg -n '^(conceptos_clave|tecnologias|alcance|componentes):' docs/ 2>/dev/null
# the four diagram headings must be English
rg -n '#### Diagram' docs/03-architecture-layers.md
```

The first two must return nothing; the third must return exactly the four English headings.
Full inventory of what must stay English: `references/LANGUAGE_POLICY.md` §4.

✅ **The document is not mixed-language** — if `doc_language: es`, no section heading may still
carry its English visible name. Compare the visible text against the `es` column of
`LANGUAGE_POLICY.md` §5.1; anchors are exempt (they are always English by design).

### Common Mistakes to Avoid

❌ **Translating an anchor, a column header, a status value or a marker name** — see §4 of the
policy. Each one breaks a specific downstream parser, and none of them fail loudly here.

❌ **Inferring the language on every run instead of stamping it** — the heuristic is a one-time
fallback, not a steady state. Once confirmed, it is written down and never inferred again.

❌ **Bundling the Spanish mirror of the SA Design Language Standard** to "match" a Spanish
project. The standard is English-only by its own one-language-per-agent rule, and its
vocabularies stay English in both editions.

---

## 1.7 Prose Style Enforcement

The contract is `references/PROSE_STYLE.md`; the executable rules and the scope map (`first-write` / `edit` / `release`, which groups run where) are `PROSE_VALIDATION.md`. There is no file-length rule and there must never be one. This file no longer mirrors the rule table.

## 2. Section Name Enforcement

### Standard 13-Section Structure

All ARCHITECTURE.md documents MUST include these **13 sections**, each identified by its **exact English `SECTION:` anchor**, in this **exact order**.

> **Anchors, not visible text.** The names below are the *anchor* identity — the machine-readable name inside the heading's HTML comment. They are never translated. The **visible** heading text is authored in the project's `doc_language` (`references/LANGUAGE_POLICY.md` §5.1), so a Spanish architecture reads `## 1. Resumen Ejecutivo` while still carrying `<!-- SECTION: Executive Summary -->`. **Every rule in this section validates the anchor.** A document written before anchors existed is validated against the visible English text as a legacy fallback.

1. **Executive Summary**
2. **System Overview**
3. **Architecture Principles**
4. **Architecture Layers**
5. **Component Details**
6. **Data Flow Patterns** *(Optional - may be omitted for simple systems)*
7. **Integration Points**
8. **Technology Stack**
9. **Security Architecture**
10. **Scalability & Performance**
11. **Operational Considerations**
12. **Architecture Decision Records (ADRs)**
13. **Risks and Technical Debt**

### Markdown Header Format

Each section MUST use this exact format:

```markdown
## [NUMBER]. [LOCALIZED NAME] <!-- SECTION: [English Anchor Name] -->
```

**Correct Examples**:
- ✅ `## 1. Executive Summary <!-- SECTION: Executive Summary -->`
- ✅ `## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->`
- ✅ `## 12. Architecture Decision Records (ADRs) <!-- SECTION: Architecture Decision Records (ADRs) -->`
- ✅ `## 8. Stack Tecnológico <!-- SECTION: Technology Stack -->`

**Incorrect Examples**:
- ❌ `## 1. Resumen Ejecutivo` (missing anchor — nothing downstream can find this section)
- ❌ `## Executive Summary <!-- SECTION: Executive Summary -->` (missing number)
- ❌ `## 1 Executive Summary <!-- SECTION: Executive Summary -->` (missing period after number)
- ❌ `## 12. ADR References <!-- SECTION: ADR References -->` (invented anchor — not in the registry)
- ❌ `## 8. Tech Stack <!-- SECTION: Tech Stack -->` (abbreviated anchor, should be `Technology Stack`)
- ❌ `## 1. Resumen Ejecutivo <!-- SECTION: Resumen Ejecutivo -->` (anchor translated — anchors are always English)

### Validation Rules

When creating or updating ARCHITECTURE.md, verify:

✅ **All 13 section anchors match the registry exactly (case-sensitive)**
- `SECTION: Executive Summary` not `SECTION: Executive summary`
- `SECTION: Technology Stack` not `SECTION: Tech Stack`
- `SECTION: Security Architecture` not just `SECTION: Security`
- `SECTION: Architecture Decision Records (ADRs)` not `SECTION: ADR References`
- Anchors are always English, whatever the visible heading says

✅ **Every structural heading has an anchor**
- Verify with: `rg -n '^## [0-9]+\. ' docs/*.md | rg -v '<!-- SECTION: '` → must return nothing
- An unanchored heading is a hard failure: the Section 6 mode detector, the compliance validators and the docgen dispatcher all lose their match target

✅ **Visible names come from the registry, not from invention**
- If `doc_language: es`, each visible name must be the `es` column of `references/LANGUAGE_POLICY.md` §5.1
- Mixed languages within one document is a failure (e.g. a Spanish doc with three English headings left over)

✅ **Sections appear in the exact order specified (1-13)**
- Section 1 is always `SECTION: Executive Summary`
- Section 12 is always `SECTION: Architecture Decision Records (ADRs)`
- Section 13 is always `SECTION: Risks and Technical Debt`
- No sections skipped (except Data Flow Patterns - see Optional Sections)

✅ **Section numbers are present with period**
- Format: `## [NUMBER]. [LOCALIZED NAME] <!-- SECTION: [English Anchor Name] -->`
- Must have period after number: "## 1. " not "## 1 "

✅ **No custom section anchors unless documented as optional**
- Stick to the 13 registered anchor names — the anchor registry is closed
- If adding subsections, those are fine (e.g., "### 2.1 Problem Statement")

✅ **Data Flow Patterns (Section 6) may be omitted for simple systems**
- If omitted, renumber subsequent sections (7→6, 8→7, etc.)
- Navigation index in `ARCHITECTURE.md` must reflect the resulting 12-section structure (`docs/04-data-flow-patterns.md` removed)

### Verification Command

List the section files present in `docs/`:

```bash
ls docs/*.md
```

List every section anchor in document order — this is the language-independent check:

```bash
rg -no '<!-- SECTION: [^>]+ -->' docs/*.md
```

Confirm every numbered H2 carries one (nothing should be printed):

```bash
rg -n '^## [0-9]+\. ' docs/*.md | rg -v '<!-- SECTION: '
```

Verify each file is linked from the Documentation table in `ARCHITECTURE.md`.

**Expected Output** (13-section structure — shown with `doc_language: en`; under `doc_language: es` the visible names are Spanish and the anchors are unchanged):
```
25:## 1. Executive Summary <!-- SECTION: Executive Summary -->
54:## 2. System Overview
147:## 3. Architecture Principles
301:## 4. Architecture Layers
456:## 5. Component Details
676:## 6. Data Flow Patterns
851:## 7. Integration Points
998:## 8. Technology Stack
1244:## 9. Security Architecture
1417:## 10. Scalability & Performance
1623:## 11. Operational Considerations
1850:## 12. Architecture Decision Records (ADRs)
2010:## 13. Risks and Technical Debt
```

**Expected Output** (12-section structure, Data Flow omitted):
```
25:## 1. Executive Summary
54:## 2. System Overview
147:## 3. Architecture Principles
301:## 4. Architecture Layers
456:## 5. Component Details
676:## 6. Integration Points         ← Was 7, renumbered
851:## 7. Technology Stack          ← Was 8, renumbered
998:## 8. Security Architecture     ← Was 9, renumbered
1244:## 9. Scalability & Performance  ← Was 10, renumbered
1417:## 10. Operational Considerations ← Was 11, renumbered
1623:## 11. Architecture Decision Records (ADRs) ← Was 12, renumbered
1810:## 12. Risks and Technical Debt              ← Was 13, renumbered
```

### Common Mistakes to Avoid

❌ **Using abbreviated or alternative anchor names**

| Wrong ❌ | Correct ✅ |
|---------|-----------|
| `SECTION: ADR References` | `SECTION: Architecture Decision Records (ADRs)` |
| `SECTION: Decision References (ADRs)` | `SECTION: Architecture Decision Records (ADRs)` |
| `SECTION: Tech Stack` | `SECTION: Technology Stack` |
| `SECTION: Security` | `SECTION: Security Architecture` |
| `SECTION: Performance` | `SECTION: Scalability & Performance` |
| `SECTION: Operations` | `SECTION: Operational Considerations` |

❌ **Translating the anchor**
- Example: `## 8. Stack Tecnológico <!-- SECTION: Stack Tecnológico -->`
- Fix: `## 8. Stack Tecnológico <!-- SECTION: Technology Stack -->`

❌ **Omitting the anchor on a localized heading**
- Example: `## 9. Arquitectura de Seguridad`
- Fix: `## 9. Arquitectura de Seguridad <!-- SECTION: Security Architecture -->`

❌ **Reordering sections**
- Example: Putting "Technology Stack" before "Integration Points"
- Fix: Follow standard order (1-13)

❌ **Omitting section numbers**
- Example: `## Executive Summary <!-- SECTION: Executive Summary -->`
- Fix: `## 1. Executive Summary <!-- SECTION: Executive Summary -->`

❌ **Using wrong number format**
- Example: `## 1 Executive Summary <!-- SECTION: Executive Summary -->` (missing period)
- Fix: `## 1. Executive Summary <!-- SECTION: Executive Summary -->`

❌ **Adding custom sections between standard sections**
- Example: Adding "## 14. Future Roadmap" or "## 6.5 Custom Section"
- Fix: Use subsections (###) for custom content within standard sections

❌ **Wrong capitalization in the anchor**
- Example: `## 1. Resumen Ejecutivo <!-- SECTION: executive summary -->` (lowercase anchor)
- Fix: `## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->` (anchors are title case, case-sensitive)

### Optional Sections

**Data Flow Patterns (Section 6)**:

**Include if:**
- ✅ System has complex data flows requiring visualization
- ✅ Multiple data transformation steps
- ✅ Event streaming or data pipelines
- ✅ Integration patterns need detailed explanation

**Omit for:**
- ❌ Simple request/response patterns
- ❌ Straightforward CRUD operations
- ❌ No complex data transformations

**Mode selection (when included)**: Section 6 has two authoring modes — **Phase Catalog mode** (default, for any architecture with 2+ use cases that share components or a single UC with ≥4 distinguishable phases) and **Single-Flow mode** (legacy fallback, only for trivially-simple systems with 1 UC and ≤3 short linear flows). Full mode-selection rule: `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → Section 6 → "Mode selection".

**Mode detection rule** (used by validators, analysis, dev-handoff): rg `docs/04-data-flow-patterns.md` for the literal H2 strings `## Phase Catalog`, `## Flow Inventory`, `## Use Case Resolutions`. If **any two** are present, the doc is in **Phase Catalog mode**; otherwise it is in **Single-Flow mode**.

**Section 6 — Phase Catalog mode structural checks** (apply only when mode-detection resolves to Phase Catalog mode):

- ✅ `## Flow Inventory` table present with ≥1 row, columns `Flow | Trigger | Use Case | Latency Target`.
- ✅ `## Phase Catalog` summary table present with the fixed 5-column schema `# | Phase | On critical path? | Owner | Failure mode`.
- ✅ Every phase row in the Phase Catalog summary table has a corresponding phase H4 (or H3) subsection with all three required bold labels: `**Purpose**`, `**Latency budget (p95)**`, `**Side effects**`.
- ✅ Every phase H4 carries a `**Hops**` line (the owner chain) **and** one `sequenceDiagram` scoped to the phase (8.30.0 — the panel is the source `flow-compose.js` derives every end-to-end sequence from; `flow-check.js` reports `phase-undrawn` as a finding).
- ✅ `## Use Case Resolutions` matrix present. Column count of the matrix MUST equal the count of unique UCs in the Flow Inventory. No blank cells (allowed values: `✓`, `skipped`, `reused`, `n/a`, or a UC-specific note).
- ✅ The phase row count of the matrix MUST equal the phase row count of the Phase Catalog summary table — silent drift between the two views is the failure mode this pattern is designed to prevent.
- ✅ `## Cross-cutting flow concerns` present with all three required H3 subsections: `### Idempotency`, `### Latency budget breakdown`, `### Failure classification`.
- ✅ `### Failure classification` table has ≥1 row for every phase H4 in the Phase Catalog.
- ✅ `## End-to-End Wire Sequences` present with one H4 per UC in the Flow Inventory. Each H4 contains either a full `sequenceDiagram` OR an explicit "no wire sequence in this domain" clause that links to a governing ADR.
- ✅ `## Validation` checklist present at the end of the file.

**If omitted:**
- Renumber subsequent **internal section numbers** only:
  - S7 (Integration Points) → S6
  - S8 (Technology Stack) → S7
  - S9 (Security Architecture) → S8
  - S10 (Scalability & Performance) → S9
  - S11 (Operational Considerations) → S10
  - S12 (Architecture Decision Records) → S11
  - S13 (Risks and Technical Debt) → S12
- **Update the navigation index** in `ARCHITECTURE.md` to reflect the 12-section structure
- **Note**: All section cross-references must be updated
- **IMPORTANT**: `docs/NN-name.md` **file names do NOT change** when sections are renumbered. `docs/05-integration-points.md` stays `05-*` regardless of whether it is internally numbered S6 or S7. This is why internal section numbers and file prefix numbers are independent — never assume they align.

### Section Renumbering Workflow

**When Data Flow Patterns is omitted:**

**Step 1**: Remove or comment out Section 6
```markdown
<!-- ## 6. Data Flow Patterns -->
<!-- (Omitted for this architecture - simple request/response patterns) -->
```

**Step 2**: Renumber subsequent sections
- Change `## 7. Integration Points` to `## 6. Integration Points`
- Change `## 8. Technology Stack` to `## 7. Technology Stack`
- Continue through Section 12 → Section 11

**Step 3**: Update the navigation index in `ARCHITECTURE.md`

Remove the Data Flow Patterns row (or `docs/04-data-flow-patterns.md` if the file itself was deleted). Keep all other rows as they are — **file prefix numbers do not change** when internal section numbers are renumbered (e.g., `docs/05-integration-points.md` stays `05-*` regardless of whether it is internally numbered S6 or S7).

Example navigation table after Data Flow omission:

```markdown
| # | Title | File | Description |
|---|-------|------|-------------|
| S1+S2 | Executive Summary + System Overview | [docs/01-system-overview.md](docs/01-system-overview.md) | System purpose, key metrics, use cases |
| S3 | Architecture Principles | [docs/02-architecture-principles.md](docs/02-architecture-principles.md) | 9 core principles |
| S4 | Architecture Layers | [docs/03-architecture-layers.md](docs/03-architecture-layers.md) | System topology and layer definitions |
| S5 | Component Details | [docs/components/README.md](docs/components/README.md) | Component index and per-component files |
| S6 | Integration Points | [docs/05-integration-points.md](docs/05-integration-points.md) | External integrations and protocols |
| S7 | Technology Stack | [docs/06-technology-stack.md](docs/06-technology-stack.md) | Languages, frameworks, databases |
| S8 | Security Architecture | [docs/07-security-architecture.md](docs/07-security-architecture.md) | Auth, encryption, controls |
| S9 | Scalability & Performance | [docs/08-scalability-and-performance.md](docs/08-scalability-and-performance.md) | SLOs, capacity, scaling strategy |
| S10 | Operational Considerations | [docs/09-operational-considerations.md](docs/09-operational-considerations.md) | Monitoring, deployment, DR |
| S11 | Architecture Decision Records | [adr/](adr/) | All ADR files with status |
```

**Step 4**: Update all internal cross-references
- Search for references to sections 7-12
- Update to new numbers (6-11)

---

## 3. Document Structure Validation

### Required Elements Per Section

#### Section 1: Executive Summary
- ✅ **System Name**: Clear identification
- ✅ **Purpose**: What the system does (1-2 sentences)
- ✅ **Key Metrics**: Performance targets (Read TPS, Processing TPS, Write TPS - with Average/Peak values and Measurement Period; latency targets; SLA targets)
- ✅ **Business Value**: Quantifiable benefits
- ✅ **Technical Overview**: High-level architecture summary

#### Section 2: System Overview
- ✅ **2.1 Problem Statement**: What problem does this solve?
- ✅ **2.2 Solution Overview**: How does this solution address it?
- ✅ **2.2.1 Design Drivers** (Optional): Impact metrics
- ✅ **2.3 Primary Use Cases**: User scenarios with success metrics

#### Section 3: Architecture Principles
- ✅ All 9 required principles (see Section 1 of this document)
- ✅ Each with Description, Implementation, Trade-offs

#### Section 4: Meta Architecture Layers
- ✅ 6-layer model (Data, Integration, Core Logic, Process, Interface, Presentation)
- ✅ Each layer described
- ✅ Component mapping to layers

#### Section 5: Component Details
- ✅ One subsection per component (###  5.1, 5.2, etc.)
- ✅ Each component documented: Purpose, Responsibilities, Technologies, Interactions

#### Section 6: Data Flow Patterns (Optional)
- If included: Data flow diagrams or descriptions
- Transformation steps documented

#### Section 7: Integration Points
- ✅ External systems listed
- ✅ Integration patterns described
- ✅ SLA/availability requirements

#### Section 8: Technology Stack
- ✅ Languages table
- ✅ Frameworks table
- ✅ Databases table
- ✅ Infrastructure table
- ✅ Rationale for key technology choices

#### Section 9: Security Architecture
- ✅ Authentication & Authorization
- ✅ Data encryption (in-transit, at-rest)
- ✅ Security controls
- ✅ Threat model (optional but recommended)

#### Section 10: Scalability & Performance
- ✅ Performance targets (from Section 1 Key Metrics)
- ✅ Scalability approach (horizontal/vertical)
- ✅ Bottlenecks and mitigation strategies
- ✅ Load testing results (if available)

#### Section 11: Operational Considerations
- ✅ Deployment strategy
- ✅ Monitoring & observability
- ✅ Backup & disaster recovery
- ✅ Maintenance procedures

#### Section 12: Architecture Decision Records (ADRs)
- ✅ List of ADRs with links
- ✅ Or inline ADRs if not using separate files
- ✅ Key decisions documented

### Format Validation Rules

**Markdown Headers**:
- ✅ Sections use ## (H2)
- ✅ Subsections use ### (H3)
- ✅ Sub-subsections use #### (H4)
- ✅ Consistent header hierarchy (no skipping levels)

**Tables**:
- ✅ All tables have header rows
- ✅ Separator row uses | --- | format
- ✅ Columns aligned (for readability)

**Lists**:
- ✅ Bullet points use - or * consistently
- ✅ Numbered lists use 1. 2. 3. format

**Code Blocks**:
- ✅ Use triple backticks ```
- ✅ Specify language: ```bash, ```python, ```yaml

**Links**:
- ✅ Internal links use anchors: [Section 2](#2-system-overview)
- ✅ External links are absolute: https://example.com
- ✅ ADR links work (files exist or references are valid)

### Completeness Checks

**Use this checklist to verify completeness**:

```
Document Completeness Validation
════════════════════════════════════════════════

Core Sections:
☐ All 13 sections present (or 12 if Data Flow omitted)
☐ Section names match exactly
☐ Sections in correct order
☐ Section numbering correct (## 1. format)

Content Quality:
☐ No "TODO" or "TBD" placeholders
☐ No empty sections
☐ All metrics sourced from Section 1
☐ All components documented in Section 5
☐ All technologies listed in Section 8
☐ Security controls documented in Section 9

Structure:
☐ Navigation index in `ARCHITECTURE.md` lists every `docs/NN-*.md` file (no dangling links, no missing rows)
☐ Subsection numbering consistent (2.1, 2.2, 2.3) within each file
☐ No duplicate section numbers

Cross-References:
☐ All internal links work
☐ ADR references valid
☐ Metric references consistent across sections
☐ Component references match Section 5

Format:
☐ Markdown headers properly formatted
☐ Tables have headers and separators
☐ Code blocks specify language
☐ Lists formatted consistently
```

---

## 4. Architecture Type-Aware Validation

### Overview

Starting with the Architecture Type Selection feature, ARCHITECTURE.md documents are categorized into one of five architecture types:
- **Microservices Architecture** (cloud-native distributed) - **Recommended**
- **ENTERPRISE Architecture** (5-layer enterprise, domain-neutral)
- **3-Tier Architecture** (classic web application)
- **N-Layer Architecture** (DDD, Clean Architecture, Hexagonal)
- **BIAN Architecture** (5-layer BIAN-compliant for banking systems)

Each architecture type has **type-specific validation rules** for Section 4 (Meta Architecture) and Section 5 (Component Details). `scripts/shared/arch-types.js` lists the types in force; a type an institution pack adds is validated by the checklist its own templates carry.

### Detecting Architecture Type

**Method 1: Metadata Comment Detection**

Search for the architecture type metadata comment in Section 4:

```bash
rg -n "<!-- ARCHITECTURE_TYPE:" ARCHITECTURE.md
```

**Valid metadata values:**
- `<!-- ARCHITECTURE_TYPE: MICROSERVICES -->`
- `<!-- ARCHITECTURE_TYPE: ENTERPRISE -->`
- `<!-- ARCHITECTURE_TYPE: 3-TIER -->`
- `<!-- ARCHITECTURE_TYPE: N-LAYER -->`
- `<!-- ARCHITECTURE_TYPE: BIAN -->`

**Method 2: Section 4 Header Inference**

If no metadata comment exists, infer type from Section 4 headers:

```bash
rg -n "^### [0-9]" ARCHITECTURE.md | rg -A5 "## 4\."
```

**Inference Rules (in order of specificity):**

| Pattern Found in Section 4 | Inferred Type |
|---------------------------|---------------|
| "Layer 2: BIAN Business Scenarios" OR "Layer 4: BIAN Service Domains" | **BIAN** (check first - most specific) |
| "Layer 1: Channels" AND "Layer 3: Process" AND "Layer 5: Systems of Record" (or the Spanish visible names: Canales, Procesos, Sistemas de Registro) | **ENTERPRISE** |
| "Tier 1: Presentation" OR "Tier 3: Data" | **3-Tier** |
| "API Gateway" AND "Service Mesh" | **Microservices** |
| "Clean Architecture" OR "Hexagonal" OR "Ports & Adapters" | **N-Layer** |

### ENTERPRISE Architecture Validation

**Applies when**: `<!-- ARCHITECTURE_TYPE: ENTERPRISE -->` is present OR Section 4 contains ENTERPRISE layer headers.

#### Section 4: Architecture Layers

✅ **All 5 layers must be documented:**
- Layer 1: Channels
- Layer 2: Experience
- Layer 3: Process
- Layer 4: Domain Services
- Layer 5: Systems of Record & Data

✅ **Layers appear in correct order (1-5)**

✅ **Cross-cutting capabilities are not a layer:** Integration, Identity & Security, Observability and Shared Platform Services are documented as cross-cutting.

✅ **Dependency rule stated:** a layer calls only the layer below or a cross-cutting capability; a layer skip requires an ADR; systems of record never call up.

✅ **Section 4 should be named "Architecture Layers"**

**Verification Command:**
```bash
rg -n "^### [0-9]\.[1-5]" ARCHITECTURE.md | rg -A2 "## 4\."
```

**Expected Output** (excerpt):
```
### 4.1 Layer 1: Channels
### 4.2 Layer 2: Experience
### 4.3 Layer 3: Process
### 4.4 Layer 4: Domain Services
### 4.5 Layer 5: Systems of Record & Data
```

#### Section 5: Component Details

✅ **Components grouped by layer:**
- Each component MUST specify which layer it belongs to, or "Cross-cutting"
- Use headers like: `## Layer 1: Channels - Components` or `### [Component Name] (Layer 4: Domain Services)`

✅ **BIAN Service Domain tag is optional:** a Domain Services component carries it only when the project has a BIAN alignment; ENTERPRISE has no BIAN mandate.

#### Common Errors - ENTERPRISE

❌ **Missing layers from the required 5**
- Fix: Add all 5 layers in Section 4

❌ **Layers out of order**
- Fix: Reorder to 1→2→3→4→5

❌ **Cross-cutting capability drawn as a layer**
- Fix: Move it to the cross-cutting group

❌ **Layer skipped without an ADR, or a system of record calling up**
- Fix: Add the ADR or remove the upward call

❌ **Components not mapped to specific layers**
- Fix: Indicate layer for each component in Section 5

### 3-Tier Architecture Validation

**Applies when**: `<!-- ARCHITECTURE_TYPE: 3-TIER -->` is present OR Section 4 contains tier headers.

#### Section 4: Meta Architecture

✅ **All 3 tiers must be documented:**
- Tier 1: Presentation
- Tier 2: Application/Business Logic
- Tier 3: Data

✅ **Tiers appear in correct order (1-3)**

✅ **Section 4 header should reflect 3-Tier pattern:**
- **Correct**: `## 4. Architecture Layers - 3-Tier Classic Web Application` or `## 4. Architecture Layers`
- **Incorrect**: `## 4. Meta Architecture` (missing "Layers" suffix)

**Verification Command:**
```bash
rg -n "^### [0-9]\.[1-3]" ARCHITECTURE.md | rg -A1 "## 4\."
```

**Expected Output** (excerpt):
```
### 4.1 Tier 1: Presentation
### 4.2 Tier 2: Application/Business Logic
### 4.3 Tier 3: Data
```

#### Section 5: Component Details

✅ **Components grouped by tier:**
- Use headers: `## Tier 1: Presentation Layer - Components`
- Each component indicates tier assignment

✅ **Tier separation enforced:**
- **No direct database access from Tier 1** (Presentation)
- Presentation tier components must NOT have direct database connections
- All data access goes through Tier 2 (Application) → Tier 3 (Data)

✅ **Tier 2 components are stateless:**
- Application/Business Logic components should be stateless for horizontal scalability
- Session state managed externally (e.g., Redis, database)

**Validation Check for Tier Separation:**

Search for forbidden patterns (Presentation tier with database):
```bash
rg -B5 -A10 "Tier 1" ARCHITECTURE.md | rg -i "database|postgres|mysql|mongodb"
```

If matches found → **VIOLATION**: Presentation tier should NOT access database directly.

#### Common Errors - 3-Tier

❌ **Missing tiers from the required 3**
- Fix: Document all 3 tiers

❌ **Tier 1 components accessing database directly**
- Fix: Route data access through Tier 2 → Tier 3

❌ **Tier 2 components with stateful session management**
- Fix: Externalize session state (Redis, distributed cache)

❌ **Using "Layer" terminology instead of "Tier"**
- Fix: Use "Tier 1", "Tier 2", "Tier 3" for consistency

### Microservices Architecture Validation

**Applies when**: `<!-- ARCHITECTURE_TYPE: MICROSERVICES -->` is present OR Section 4 contains microservices infrastructure components.

#### Section 4: Meta Architecture

✅ **Infrastructure components documented:**
- **API Gateway**: Single entry point for clients
- **Service Mesh**: Service-to-service communication infrastructure (or justification if omitted)
- **Event Bus**: Asynchronous communication backbone (Kafka, RabbitMQ, etc.)
- **Service Discovery**: How services find each other (or justification if not used)

✅ **Section 4 header reflects microservices pattern:**
- **Correct**: `## 4. Meta Architecture - Microservices Architecture` or `## 4. Meta Architecture`

**Verification Command:**
```bash
rg -i "API Gateway|Service Mesh|Event Bus|Service Discovery" ARCHITECTURE.md | rg -A5 "## 4\."
```

✅ **If API Gateway or Service Mesh omitted:**
- Must include justification in Section 4 or ADR
- Example: "Service Mesh omitted - using direct service-to-service mTLS with client-side load balancing"

#### Section 5: Component Details

✅ **Database-per-service pattern followed:**
- Each microservice MUST have its own database (no shared databases)
- Each service documented with dedicated data store
- If shared database exists → **VIOLATION** (or must justify in ADR)

✅ **Each microservice includes:**
- **Bounded Context**: Domain/business capability it owns
- **API Specification**: REST/gRPC/GraphQL endpoints
- **Events Published**: Event names, triggers, payloads, consumers
- **Events Consumed**: Events from other services, actions taken
- **Circuit Breaker Configuration**: Failure threshold, timeout, fallback strategy

✅ **Event bus topics documented:**
- Event names follow naming convention (e.g., `service.resource.action`)
- Event schemas versioned (v1, v2, etc.)
- Dead Letter Queue (DLQ) handling documented

**Validation Check for Database-per-Service:**

```bash
# Count services
rg -c "### .* Service$" ARCHITECTURE.md

# Count databases (should match or exceed service count)
rg -c "Database|PostgreSQL|MongoDB|DynamoDB" ARCHITECTURE.md
```

If services > databases → **WARNING**: Verify database-per-service pattern.

**Validation Check for Circuit Breakers:**

```bash
rg -i "circuit breaker|resilience4j|hystrix" ARCHITECTURE.md | wc -l
```

Should have matches for each synchronous inter-service dependency.

#### Common Errors - Microservices

❌ **Shared database across multiple services**
- Fix: Implement database-per-service or document exception in ADR

❌ **API Gateway or Service Mesh not documented (and no justification)**
- Fix: Add infrastructure component or explain omission

❌ **Event bus missing for event-driven services**
- Fix: Document event bus (Kafka, RabbitMQ, etc.)

❌ **No circuit breakers for synchronous calls**
- Fix: Configure circuit breakers for all sync dependencies

❌ **Events not versioned**
- Fix: Add schema versioning (v1, v2) to event definitions

### N-Layer Architecture Validation

**Applies when**: `<!-- ARCHITECTURE_TYPE: N-LAYER -->` is present OR Section 4 contains N-Layer pattern headers.

#### Section 4: Meta Architecture

✅ **Pattern specification required:**
- Must specify which N-Layer pattern is used:
  - **4-Layer Classic DDD**
  - **5-Layer Extended**
  - **Clean Architecture**
  - **Hexagonal Architecture (Ports & Adapters)**
  - **Custom N-Layer** (with layer definitions)

✅ **Dependency direction documented:**
- Clear dependency rules between layers
- Example: "Presentation → Application → Domain; Infrastructure → Domain (implements interfaces)"

✅ **Layer boundaries defined:**
- Each layer has defined components
- Communication patterns between layers documented
- Interfaces at layer boundaries documented

**Verification Command:**
```bash
rg -i "4-Layer|5-Layer|Clean Architecture|Hexagonal|Ports & Adapters" ARCHITECTURE.md | head -5
```

Should find pattern specification in Section 4.

#### Section 5: Component Details

✅ **Components organized by layer:**
- Each component assigned to a specific layer
- Layer headers used: `## Layer 1: Presentation`, `## Core: Entities`, etc.

✅ **Core/Domain layer is framework-free (if applicable):**
- For DDD, Clean Architecture, Hexagonal patterns:
  - Domain/Core layer should have NO framework dependencies
  - Pure business logic only
  - No references to ORM, web framework, external libraries

✅ **Infrastructure layer implements domain interfaces (if applicable):**
- Repository implementations in Infrastructure layer
- External service adapters in Infrastructure layer
- Infrastructure depends on Domain (not vice versa)

**Validation Check for Framework-Free Domain:**

For DDD/Clean/Hexagonal patterns:
```bash
# Check Domain/Core layer for framework imports
rg -A30 "Domain\|Core" ARCHITECTURE.md | rg -i "spring|express|django|sequelize|typeorm"
```

If matches found → **WARNING**: Domain layer should be framework-free.

#### Common Errors - N-Layer

❌ **Pattern not specified**
- Fix: Declare which N-Layer pattern (DDD, Clean, Hexagonal, etc.)

❌ **Dependency direction not documented**
- Fix: Add dependency rules (e.g., "Dependencies point INWARD")

❌ **Domain layer with framework dependencies**
- Fix: Remove framework dependencies from domain/core layer

❌ **Infrastructure layer depends on external frameworks (not domain interfaces)**
- Fix: Infrastructure should implement domain-defined interfaces

❌ **Circular dependencies between layers**
- Fix: Enforce unidirectional dependencies with dependency inversion

### BIAN Architecture Validation

**Applies when**: `<!-- ARCHITECTURE_TYPE: BIAN -->` is present OR Section 4 contains BIAN layer headers.

#### Section 4: Meta Architecture - BIAN Layers

✅ **All 5 BIAN layers must be documented in order:**
- Layer 1: Channels
- Layer 2: BIAN Business Scenarios
- Layer 3: BIAN Business Capabilities
- Layer 4: BIAN Service Domains
- Layer 5: Core Systems

✅ **Layer 2: BIAN Business Scenarios Validation:**
- Must map business scenarios to BIAN Business Areas (8 areas):
  - Business Management
  - Resource Management
  - Finance And Risk Management
  - Operations
  - Products
  - Customers
  - Channels
  - Business Development
  - Source: [bian_dir]/llms-bian.txt (index; open one per-area file only for the areas in scope).
- Business scenarios organized by BIAN Business Area
- BIAN Business Area mapping table present
- BIAN v14.0.0 reference URL included

**Verification Command:**
```bash
rg -i "Layer 2: BIAN Business Scenarios" ARCHITECTURE.md
rg -i "BIAN Business Area" ARCHITECTURE.md | head -10
```

✅ **Layer 3: BIAN Business Capabilities Validation:**
- Must map business capabilities to BIAN Business Domains (43 domains)
- Examples: Relationship Management, Clearing And Settlement, Loans and Deposits, Credit Risk, etc.
- Business capability components mapped to BIAN Business Domains
- BIAN Business Domain mapping table present
- Parent Business Area documented for each Business Domain
- BIAN v14.0.0 reference URL included

**Verification Command:**
```bash
rg -i "Layer 3: BIAN Business Capabilities" ARCHITECTURE.md
rg -i "BIAN Business Domain" ARCHITECTURE.md | head -10
```

✅ **Layer 4: BIAN Service Domains Validation (CRITICAL):**
- Must implement BIAN Service Domains from BIAN v14.0.0 (341 service domains)
- All service domain names validated against [official BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
- Service domain catalog table with BIAN IDs (SD-XXX format)
- BIAN v14.0.0 reference URL: https://bian.org/servicelandscape-14-0-0/views/view_54486.html

**Verification Command:**
```bash
rg -i "Layer 4: BIAN Service Domains" ARCHITECTURE.md
rg -i "BIAN Service Domain|SD-[0-9]" ARCHITECTURE.md | wc -l
rg -i "bian.org/servicelandscape-14-0-0" ARCHITECTURE.md
```

Expected: Multiple BIAN service domains documented with BIAN IDs (SD-001, SD-002, etc.)

✅ **BIAN Hierarchy Traceability:**
- Clear mapping: Service Domain → Business Domain → Business Area
- Documented in Layer 4 service domain catalog
- Cross-references between layers 2, 3, and 4

**Verification Command:**
```bash
# Check for BIAN hierarchy documentation
rg -A5 "BIAN Business Area\|BIAN Business Domain" ARCHITECTURE.md | rg -i "Service Domain"
```

✅ **Mermaid Diagram Requirement:**
- Architecture diagram showing all 5 BIAN layers
- BIAN hierarchy visualization (Business Areas → Business Domains → Service Domains)
- Communication patterns between layers

**Verification Command:**
```bash
rg -A20 "```mermaid" ARCHITECTURE.md | rg -i "BIAN|Layer [1-5]"
```

#### Section 5: Component Details - BIAN Compliance

✅ **Components grouped by BIAN layers (1-5):**
- Layer 1: Channels components
- Layer 2: BIAN Business Scenarios components
- Layer 3: BIAN Business Capabilities components
- Layer 4: BIAN Service Domains components (CRITICAL - see below)
- Layer 5: Core Systems components

✅ **Layer 4 Components - Complete BIAN Metadata (MANDATORY):**

Every Layer 4 (BIAN Service Domain) component MUST include:

1. **Official BIAN Name:**
   - Exact name from BIAN Service Landscape v14.0.0
   - Examples: "Payment Order Initiation", "Current Account", "Party Authentication"

2. **BIAN ID:**
   - Internal tracking ID in SD-XXX format
   - Examples: SD-001, SD-002, SD-003

3. **BIAN Version:**
   - Must be v14.0.0 (mandatory)

4. **BIAN Business Domain:**
   - Parent business domain from Layer 3
   - Examples: "Consumer Banking", "Loans and Deposits", "Relationship Management"

5. **BIAN Business Area:**
   - Parent business area from Layer 2
   - Examples: "Products", "Customers"

6. **BIAN Service Landscape URL:**
   - Direct link to service domain in BIAN v14.0.0
   - Must be: https://bian.org/servicelandscape-14-0-0/views/view_54486.html

7. **Control Record:**
   - Control Record Type (e.g., "PaymentOrderInitiationTransaction")
   - Control Record Structure (fields, types, descriptions)
   - Lifecycle States (e.g., Initiated, Completed, Failed, Cancelled)
   - State Transitions (allowed state changes)

8. **Service Operations (BIAN v14.0.0 Standard):**
   - **Initiate**: Create new control record (MANDATORY)
   - **Update**: Modify control record (MANDATORY)
   - **Retrieve**: Query control record (MANDATORY)
   - **Control**: Manage lifecycle (MANDATORY)
   - **Exchange**: If applicable per BIAN spec (OPTIONAL)
   - **Execute**: If applicable per BIAN spec (OPTIONAL)
   - **Request**: If applicable per BIAN spec (OPTIONAL)

9. **Behavior Qualifiers:**
   - List of behavior qualifiers from BIAN spec
   - Examples: "compliance", "reporting", "booking", "registration", "valuation"

10. **Functional Patterns:**
    - Pattern Type from BIAN spec
    - Examples: "Managed Object", "Tracked Object", "Administered Object", "Governed Object"
    - Pattern Description

11. **BIAN Compliance Level:**
    - Compliance Level: Full BIAN v14.0.0 Compliance (required for BIAN architecture)
    - Validation Date: When compliance was verified
    - Deviations: None for full compliance, or document customizations

12. **BIAN Traceability:**
    - Service Domain → Business Domain → Business Area mapping documented

**Verification Command for Layer 4 Components:**
```bash
# Check for BIAN metadata in Layer 4 components
rg -A50 "Layer 4.*BIAN Service Domain" ARCHITECTURE.md | \
  rg "Official BIAN Name|BIAN ID|BIAN Version|Control Record|Service Operations|Behavior Qualifiers|Functional Pattern"
```

Expected: Every Layer 4 component includes all 12 required BIAN metadata fields.

**Verification Command for BIAN v14.0.0 URLs:**
```bash
# Count BIAN v14.0.0 URL references
rg -c "bian.org/servicelandscape-14-0-0" ARCHITECTURE.md
```

Expected: Multiple references (at least one per service domain + general references)

✅ **Layer 2 Components - BIAN Business Area Mapping:**
- Each component mapped to one of 8 BIAN Business Areas
- BIAN Business Area documented in component metadata
- Orchestration logic for business scenarios documented

✅ **Layer 3 Components - BIAN Business Domain Mapping:**
- Each component mapped to a BIAN Business Domain (43 domains)
- BIAN Business Domain documented in component metadata
- Parent Business Area documented
- Service Domains coordinated by this capability listed

✅ **Layer 5 Components - BIAN Integration Strategy:**
- Core systems integration with BIAN service domains documented
- Adapter pattern for BIAN integration described
- Modernization strategy aligned with BIAN architecture

#### Common Errors - BIAN Architecture

❌ **Missing layers (not all 5 layers present)**
- Fix: Document all 5 BIAN layers in Section 4 in correct order

❌ **Layer 2 not mapped to BIAN Business Areas**
- Fix: Add BIAN Business Area mapping table, map scenarios to 8 BIAN Business Areas

❌ **Layer 3 not mapped to BIAN Business Domains**
- Fix: Add BIAN Business Domain mapping table, identify which domains are implemented

❌ **Layer 4 service domain names don't match BIAN v14.0.0**
- Fix: Validate all service domain names against [official BIAN Service Landscape](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
- Examples of correct names: "Payment Order Initiation", "Payment Orchestration", "Current Account"

❌ **Layer 4 components missing BIAN metadata**
- Fix: Add all 12 required BIAN metadata fields for every Layer 4 component
- Required: Official BIAN Name, BIAN ID, Version, Business Domain, Business Area, URL, Control Record, Service Operations, Behavior Qualifiers, Functional Patterns, Compliance Level, Traceability

❌ **Control records not documented per BIAN spec**
- Fix: Document control record structure, lifecycle states, and state transitions per BIAN v14.0.0

❌ **Missing mandatory BIAN service operations**
- Fix: Implement all 4 mandatory operations: Initiate, Update, Retrieve, Control
- Optional operations: Exchange, Execute, Request (add if applicable per BIAN spec)

❌ **Behavior qualifiers not documented**
- Fix: List all behavior qualifiers from BIAN spec for each service domain
- Reference: https://bian.org/servicelandscape-14-0-0/views/view_54486.html

❌ **Functional patterns not documented**
- Fix: Identify and document BIAN functional pattern (Managed Object, Tracked Object, etc.)

❌ **BIAN v14.0.0 URLs missing or incorrect**
- Fix: Use correct URL: https://bian.org/servicelandscape-14-0-0/views/view_54486.html
- Add URL references in Layer 2, Layer 3, and Layer 4 sections

❌ **BIAN hierarchy not traceable**
- Fix: Document clear mapping: Service Domain → Business Domain → Business Area
- Add cross-references between layers 2, 3, and 4

❌ **Compliance level not documented**
- Fix: Document "Full BIAN v14.0.0 Compliance" for each Layer 4 service domain
- Include validation date and any deviations

❌ **BIAN IDs not used consistently**
- Fix: Assign BIAN IDs (SD-001, SD-002, etc.) for internal tracking
- Use consistently throughout document

#### BIAN Architecture Checklist

**Section 4: Meta Architecture**
- [ ] All 5 layers documented in order (Channels, BIAN Business Scenarios, BIAN Business Capabilities, BIAN Service Domains, Core Systems)
- [ ] Layer 2 mapped to 8 BIAN Business Areas
- [ ] Layer 2 includes BIAN Business Area mapping table
- [ ] Layer 3 mapped to BIAN Business Domains (43 domains)
- [ ] Layer 3 includes BIAN Business Domain mapping table
- [ ] Layer 4 implements BIAN Service Domains from BIAN v14.0.0
- [ ] Layer 4 includes service domain catalog with BIAN IDs
- [ ] All layer names use exact BIAN terminology
- [ ] BIAN v14.0.0 reference URL included throughout
- [ ] BIAN hierarchy traceability documented
- [ ] Mermaid diagram shows all 5 BIAN layers

**Section 5: Component Details**
- [ ] Components grouped by 5 BIAN layers
- [ ] Layer 4 components include complete BIAN metadata (all 12 fields)
- [ ] Official BIAN Names validated against BIAN Service Landscape v14.0.0
- [ ] BIAN IDs (SD-XXX) assigned to all Layer 4 components
- [ ] BIAN Version v14.0.0 documented for all Layer 4 components
- [ ] BIAN Business Domain documented for all Layer 4 components
- [ ] BIAN Business Area documented for all Layer 4 components
- [ ] BIAN Service Landscape URL included for all Layer 4 components
- [ ] Control records documented per BIAN specification
- [ ] All 4 mandatory service operations implemented (Initiate, Update, Retrieve, Control)
- [ ] Behavior qualifiers documented per BIAN spec
- [ ] Functional patterns documented per BIAN spec
- [ ] Full BIAN v14.0.0 compliance level documented
- [ ] BIAN hierarchy traceability documented (Service Domain → Business Domain → Business Area)
- [ ] Layer 2 components mapped to BIAN Business Areas
- [ ] Layer 3 components mapped to BIAN Business Domains
- [ ] Layer 5 includes BIAN integration and modernization strategy

### Type-Aware Validation Workflow

**Step 1: Detect Architecture Type**

```bash
# Check for metadata comment
rg "<!-- ARCHITECTURE_TYPE:" ARCHITECTURE.md
```

If found → Use specified type
If not found → Infer from Section 4 headers (see inference rules above)

**Step 2: Apply Type-Specific Validation**

Based on detected type, run appropriate validation:

**ENTERPRISE**:
```bash
# Check all 5 layers present
rg -n "^### [0-9]\.[1-5]" ARCHITECTURE.md | rg "Layer"

# Check cross-cutting capabilities are documented
rg -i "Cross-cutting|Transversal" ARCHITECTURE.md
```
**3-Tier**:
```bash
# Check all 3 tiers present
rg -n "^### [0-9]\.[1-3]" ARCHITECTURE.md | rg "Tier"

# Check no direct DB access from Tier 1
rg -B5 -A10 "Tier 1" ARCHITECTURE.md | rg -i "database"
```

**Microservices**:
```bash
# Check infrastructure components
rg -i "API Gateway|Service Mesh|Event Bus" ARCHITECTURE.md

# Check database-per-service pattern
rg -c "### .* Service$" ARCHITECTURE.md
rg -c "Database" ARCHITECTURE.md
```

**N-Layer**:
```bash
# Check pattern specified
rg -i "4-Layer|5-Layer|Clean|Hexagonal" ARCHITECTURE.md

# Check dependency direction documented
rg -i "dependency|depends on" ARCHITECTURE.md
```

**Step 3: Report Validation Results**

Create validation report:

```markdown
## Architecture Type Validation Report

**Detected Type**: [ENTERPRISE | 3-Tier | Microservices | N-Layer | BIAN | a pack type]

**Validation Results**:

✅ **Passed Checks**:
- [List passed validations]

❌ **Failed Checks**:
- [List violations with line numbers]

⚠️ **Warnings**:
- [List warnings or missing best practices]

**Recommendations**:
- [Fix suggestions for failed checks]
```

### Validation Checklist by Type

#### ENTERPRISE Architecture Checklist

```
ENTERPRISE Architecture Validation
════════════════════════════════════════════════

Section 4 - Architecture Layers:
☐ All 5 layers documented (Channels, Experience, Process, Domain Services, Systems of Record & Data)
☐ Layers in correct order (1→2→3→4→5)
☐ Cross-cutting capabilities (Integration, Identity & Security, Observability, Shared Platform Services) documented as cross-cutting, not as a layer
☐ Each layer has description and component mapping
☐ Metadata comment present: <!-- ARCHITECTURE_TYPE: ENTERPRISE -->

Section 5 - Component Details:
☐ Components grouped by layer assignment
☐ Each component states its layer, or "Cross-cutting"
☐ Dependency rule documented: a layer calls only the layer below or a cross-cutting capability
☐ Every layer skip is justified by an ADR
☐ Systems of record never call up
☐ BIAN Service Domain tag present on Domain Services components only when the project has a BIAN alignment

Common Errors:
☐ No missing layers
☐ Layers not reordered
☐ Cross-cutting capabilities not modelled as a layer
☐ No call from a system of record to a higher layer
```

A type an institution pack adds is validated by the checklist its own templates carry.

#### 3-Tier Architecture Checklist

```
3-Tier Architecture Validation
════════════════════════════════════════════════

Section 4 - Meta Architecture:
☐ All 3 tiers documented (Presentation, Application/Business Logic, Data)
☐ Tiers in correct order (1→2→3)
☐ Tier separation principles explained
☐ Metadata comment present: <!-- ARCHITECTURE_TYPE: 3-TIER -->

Section 5 - Component Details:
☐ Components grouped by tier assignment
☐ Tier 1 (Presentation) has NO direct database access
☐ Tier 2 (Application) components are stateless
☐ Data access flows: Tier 1 → Tier 2 → Tier 3

Tier Separation:
☐ Presentation tier only calls Application tier
☐ Application tier calls Data tier for persistence
☐ No database connections in Presentation tier
☐ Session state externalized (if applicable)

Common Errors:
☐ No missing tiers
☐ No Tier 1 database access violations
☐ Tier terminology used (not "Layer")
```

#### Microservices Architecture Checklist

```
Microservices Architecture Validation
════════════════════════════════════════════════

Section 4 - Meta Architecture:
☐ API Gateway documented (or omission justified)
☐ Service Mesh documented (or omission justified)
☐ Event Bus documented (Kafka, RabbitMQ, etc.)
☐ Service Discovery approach documented
☐ Metadata comment present: <!-- ARCHITECTURE_TYPE: MICROSERVICES -->

Section 5 - Component Details:
☐ Each microservice has bounded context defined
☐ Database-per-service pattern followed (no shared databases)
☐ API endpoints documented (REST/gRPC/GraphQL)
☐ Events published and consumed documented
☐ Circuit breakers configured for sync dependencies
☐ Event schemas versioned (v1, v2, etc.)
☐ Dead Letter Queue (DLQ) handling documented

Infrastructure:
☐ One database per service (or exception in ADR)
☐ Event naming convention followed
☐ Circuit breaker thresholds specified
☐ Timeout configurations documented

Common Errors:
☐ No shared databases
☐ API Gateway/Service Mesh present or justified
☐ Circuit breakers for all sync calls
☐ Events versioned
```

#### N-Layer Architecture Checklist

```
N-Layer Architecture Validation
════════════════════════════════════════════════

Section 4 - Meta Architecture:
☐ Pattern specified (4-Layer, 5-Layer, Clean, Hexagonal, Custom)
☐ All required layers for pattern documented
☐ Dependency direction documented
☐ Layer boundaries and interfaces defined
☐ Metadata comment present: <!-- ARCHITECTURE_TYPE: N-LAYER -->

Section 5 - Component Details:
☐ Components organized by layer assignment
☐ Core/Domain layer is framework-free (if applicable)
☐ Infrastructure layer implements domain interfaces
☐ No circular dependencies between layers
☐ Communication patterns between layers documented

Pattern-Specific (if applicable):
☐ DDD: Domain, Application, Infrastructure, Presentation layers
☐ Clean: Entities, Use Cases, Interface Adapters, Frameworks
☐ Hexagonal: Core, Primary Ports, Secondary Ports, Adapters

Common Errors:
☐ Pattern clearly specified
☐ Domain/Core layer has no framework dependencies
☐ Dependency direction is unidirectional
☐ No circular dependencies
```

---

## Best Practices

### DO:
- ✅ Validate structure during document creation
- ✅ Run verification commands (grep) to check sections
- ✅ Use validation checklist before finalizing
- ✅ Update the navigation index in `ARCHITECTURE.md` when adding/removing docs/ files
- ✅ Enforce strict section names and order
- ✅ Ensure all 9 principles are documented
- ✅ Include system-specific implementation details
- ✅ Document honest trade-offs for each principle

### DON'T:
- ❌ Skip required sections
- ❌ Use abbreviated section names
- ❌ Reorder sections from standard sequence
- ❌ Omit principle subsections (Description/Implementation/Trade-offs)
- ❌ Use generic placeholder text
- ❌ Include Decouple Through Events unless async provides clear benefits
- ❌ Add custom principles beyond standard 9-10
- ❌ Forget to update the navigation index when a docs/ file is added or renamed

---

## Integration with Workflows

**When to Apply Validations**:

1. **During document creation**: Validate structure as you build
2. **Before architecture reviews**: Run full validation checklist
3. **After major updates**: Verify section integrity
4. **Quarterly reviews**: Ensure document still meets standards

**Validation Workflow**:

```
1. List docs/ files:
   ls docs/*.md

2. Verify each expected file is present (11 or 12, depending on whether Data Flow is included)
   and the navigation index in ARCHITECTURE.md links every file

3. Check docs/02-architecture-principles.md has all 9 required principles:
   rg -n "^### [0-9]" docs/02-architecture-principles.md

4. Validate each principle has required subsections:
   - Description
   - Implementation
   - Trade-offs

5. Run completeness checklist

6. Update the navigation index in ARCHITECTURE.md if any docs/ files were added/renamed/removed

7. Report validation results to user
```

---

## Summary

This document provides validation rules and enforcement checklists for ARCHITECTURE.md documents. For operational workflows, see **SKILL.md**. For content templates and examples, see **ARCHITECTURE_DOCUMENTATION_GUIDE.md**.

**Key Validation Points**:
- 9 required Architecture Principles (strict order)
- 12 required Section Names (exact match, case-sensitive)
- 3 required subsections per principle (Description, Implementation, Trade-offs)
- Optional: Decouple Through Events principle (#10)
- Optional: Data Flow Patterns section (#6)
- Strict markdown header format: `## [NUMBER]. [NAME]`