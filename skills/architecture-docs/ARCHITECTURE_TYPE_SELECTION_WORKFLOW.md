## Architecture Type Selection Workflow

**PURPOSE**: When creating a new ARCHITECTURE.md, prompt the user to select their architecture type. This determines the structure and content of Section 4 (Meta Architecture) and Section 5 (Component Details).

### When to Trigger

**Activate this workflow when:**
- ✅ User asks to create a NEW ARCHITECTURE.md document
- ✅ User explicitly requests to "change architecture type" or "select architecture type"
- ✅ User is updating an existing ARCHITECTURE.md and mentions changing from one architecture type to another

**Prerequisite**: Step 0 (PO Spec check) runs before Step 1 for all new document creation triggers

**Skip this workflow when:**
- ❌ Editing an existing ARCHITECTURE.md (type already selected)
- ❌ User is only updating specific sections unrelated to architecture type
- ❌ Document type is already clear from context

### Available Architecture Types

1. **Microservices Architecture (Recommended)** - Cloud-native distributed systems with independent services
2. **META Architecture** - 6-layer enterprise model (Channels → UX → Business Scenarios → Business → Domain → Core) with [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) alignment for Layer 5 Domain service domains
3. **3-Tier Architecture** - Classic web application pattern (Presentation → Application/Business Logic → Data)
4. **N-Layer Architecture** - Customizable patterns (DDD, Clean Architecture, Hexagonal)
5. **BIAN Architecture** - 5-layer BIAN-compliant model (Channels → BIAN Business Scenarios → BIAN Business Capabilities → BIAN Service Domains → Core Systems) with full [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) compliance across layers 2-4

**BIAN Standard for META**: BIAN V12.0 is the default and recommended version for META architecture. Use the [BIAN Service Landscape V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) to identify and define service domains for Layer 5 (Domain).

### Workflow Steps

#### Step 0: Product Owner Specification Prerequisite Check

Before proceeding with new ARCHITECTURE.md creation, verify that a Product Owner Specification exists.

**Detection procedure** (ordered — stop at first match):
1. Check for `PRODUCT_OWNER_SPEC.md` at project root
2. Check for `PO_SPEC.md` at project root
3. Glob search: `**/PRODUCT_OWNER_SPEC*.md`, `**/PO_SPEC*.md`
4. Grep fallback: search for header pattern `# .* - Product Owner Specification`

---

**If PO Spec FOUND → Gate passes:**

- Display: `✅ Product Owner Specification found: [filename]`
- Show scoring reminder: "If you haven't evaluated it yet, consider running `/skill architecture-readiness` to score it (recommended threshold: ≥7.5/10)."
- Load high-weight PO Spec sections into context for pre-populating ARCHITECTURE.md:
  - Section 1: Business Context
  - Section 3: Business Objectives
  - Section 4: Use Cases
  - Section 7: Business Constraints
- Record traceability metadata (embed in `docs/01-system-overview.md` during Step 5):
  ```
  <!-- PO_SPEC_SOURCE: [filename] (loaded YYYY-MM-DD) -->
  ```
- Proceed to Step 1

---

**If PO Spec NOT FOUND → Present 3-option menu:**

Display the following message:

```
🚫 No Product Owner Specification Found

The three-phase workflow requires business context before architecture design:

  Phase 1 → Product Owner Specification  ← MISSING
  Phase 2 → ARCHITECTURE.md              ← You are here
  Phase 3 → Compliance Contracts

How would you like to proceed?

  1️⃣  Run the full elicitation flow
      → Launches /skill architecture-readiness to create a complete PO Spec
      → Recommended for new projects with no documented requirements

  2️⃣  Provide business context now
      → Type your business context here and I'll evaluate it against the
        PO Spec scoring rubric, then interview you for any gaps
      → Best when you have context in mind but no formal document yet

  3️⃣  Skip (SKIP PO SPEC)
      → Proceed without any business context
      → A PO_SPEC_GATE: SKIPPED warning will be recorded

  4️⃣  Async intake from a file
      → Provide a file (ticket export, email, requirements doc) and I'll
        extract requirements, score them, and generate a gap report
      → Best when business context arrived asynchronously via ticket or email

Enter 1, 2, 3, or 4:
```

Wait for user response before proceeding.

---

**Option 1 — Full elicitation flow:**

- Invoke `/skill architecture-readiness`
- After the PO Spec is created, re-run Step 0 detection (the new file should now be found)
- Proceed with the standard "PO Spec FOUND" path

---

**Option 2 — Provide business context now (inline elicitation):**

**Step 0.2a: Capture initial context**

Prompt the user:

```
Please describe your business context — the problem you're solving, who it's for,
key objectives, constraints, and any other business requirements you have in mind.
```

Wait for user input.

**Step 0.2b: Evaluate against PO Spec scoring rubric**

- Load `skills/architecture-readiness/PO_SPEC_SCORING_GUIDE.md`
- Map the user's input to the 8 PO Spec sections
- Score each section using the weighted rubric:
  - Section 4: Use Cases (weight 2.5) — HIGH priority
  - Section 7: Business Constraints (weight 2.0) — HIGH priority
  - Section 3: Business Objectives (weight 1.5) — HIGH priority
  - Section 1: Business Context (weight 1.0)
  - Section 6: UX Requirements (weight 1.0)
  - Section 8: Success Metrics (weight 1.0)
  - Section 2: Stakeholders & Users (weight 0.5)
  - Section 5: User Stories (weight 0.5)
- Display the evaluation results:
  ```
  📊 Business Context Evaluation (scored against PO Spec rubric)

  Section                    | Score | Weight | Weighted
  ---------------------------|-------|--------|--------
  1. Business Context        | X%    | 1.0    | X.XX
  2. Stakeholders & Users    | X%    | 0.5    | X.XX
  3. Business Objectives     | X%    | 1.5    | X.XX
  4. Use Cases               | X%    | 2.5    | X.XX
  5. User Stories            | X%    | 0.5    | X.XX
  6. UX Requirements         | X%    | 1.0    | X.XX
  7. Business Constraints    | X%    | 2.0    | X.XX
  8. Success Metrics & KPIs  | X%    | 1.0    | X.XX
  ─────────────────────────────────────────────
  Total                                        X.XX/10.0
  ```

**Step 0.2c: Interview for gaps (if score < 7.5)**

- Identify sections scoring below 50% (Critical Gaps) and 50–74% (Moderate Gaps)
- Prioritize by weight: ask about HIGH-priority gaps first (Use Cases → Business Constraints → Business Objectives)
- For each gap, ask targeted questions derived from that section's evaluation criteria in the scoring guide
- After each answer, re-score the affected section
- Continue until score reaches ≥7.5 or all HIGH-priority sections are ≥75%
- If score still < 7.5 after addressing HIGH-priority sections, ask about MEDIUM-priority gaps
- Display updated scorecard after the interview round

**Step 0.2d: Generate inline PO Spec and proceed**

- Compile all gathered context into a structured PO Spec document
- Save as `PRODUCT_OWNER_SPEC.md` at project root (using the template from `skills/architecture-readiness/templates/PO_SPEC_TEMPLATE.md`)
- Display: `✅ Product Owner Specification created: PRODUCT_OWNER_SPEC.md (score: X.X/10.0)`
- Load high-weight sections (1, 3, 4, 7) into context for pre-populating ARCHITECTURE.md
- Record traceability (embed in `docs/01-system-overview.md` during Step 5):
  ```
  <!-- PO_SPEC_SOURCE: PRODUCT_OWNER_SPEC.md (inline-generated YYYY-MM-DD, score: X.X/10.0) -->
  ```
- Proceed to Step 1

---

**Option 3 — Skip:**

Display the following warning and proceed:

```
⚠️  PO Spec gate overridden. Proceeding without a Product Owner Specification.

   Consequences to be aware of:
   - Architecture decisions will not be traceable to validated business requirements
   - The compliance phase may flag gaps due to missing business context
   - A PO_SPEC_GATE: SKIPPED note will be embedded in the generated documentation

Proceeding to architecture type selection...
```

Record override metadata (embed in `docs/01-system-overview.md` during Step 5):
```
<!-- PO_SPEC_GATE: SKIPPED (user override at YYYY-MM-DD) -->
```

No PO Spec context is available for section pre-population — proceed to Step 1 without it.

---

**Option 4 — Async intake from a file:**

Ask the user for the file path (ticket export, email, requirements document). Then:

- Invoke the `architecture-readiness` skill's Async Intake workflow: read the file, map content to 8 PO Spec sections, score, and generate `PO_SPEC_GAP_REPORT.md`
- **If score ≥ 7.5**: A draft `PRODUCT_OWNER_SPEC.md` is also created — re-run Step 0 detection (it will now be found), then proceed with the standard "PO Spec FOUND" path
- **If score < 7.5**: Present the gap report to the user, advise them to send the gap questions to the requester and re-run intake once answers arrive — do NOT proceed to architecture creation yet

---

**If multiple PO Spec files found:**

List all matches and ask the user to select which one applies before proceeding:

```
📋 Multiple Product Owner Specifications found. Which one applies to this architecture?

  1. [path/to/first/PRODUCT_OWNER_SPEC.md]
  2. [path/to/second/PO_SPEC.md]
  ...

Please enter the number of the specification to use.
```

---

#### Step 0.5: Supplementary Context Files (Optional)

After the PO Spec gate resolves (found, inline context provided, or skipped), prompt the user once for any additional context files that could enrich the architecture documentation.

Display the following message:

```
📎 **Supplementary Context (Optional)**

Before we start, do you have any existing documents that could inform the architecture?
Examples:

  📄  ADR files or decision logs
  📐  High-Level Design (HLD) — must be provided as PDF (.pdf)
  🔧  Technology stack specs or tech radar
  🔌  API specifications (OpenAPI, AsyncAPI)
  🗄️  Data models or ER diagrams
  📊  Non-functional requirements or SLA documents
  🏗️  Infrastructure diagrams or IaC templates
  📝  Any other relevant design documents

You can provide:
  • File paths (e.g., `design/hld.pdf`, `specs/openapi.yaml`, `adr/ADR-001.md`)
  • Multiple files separated by commas
  • A directory to scan (e.g., `design-docs/`)

Type **skip** or press Enter to proceed without extra context.
```

**Processing supplementary files:**

1. **If user provides file paths or a directory:**
   - Read each file provided:
     - Markdown, YAML, JSON, text files → read directly
     - **PDF files** → read using the Read tool (supports PDF with `pages` parameter; for large PDFs >10 pages, read in chunks of 20 pages)
     - For directories: glob `*.md`, `*.yaml`, `*.yml`, `*.json`, `*.pdf`, `*.txt`
   - Classify each file by type:
     | File Pattern | Classification | Used In |
     |---|---|---|
     | `ADR-*`, `adr/*`, decision log content | ADR / Decision Record | S3 (Principles), S12 (ADRs) |
     | HLD, high-level design, system design (**PDF only** — reject non-PDF HLD files) | High-Level Design | S4 (Layers), S5 (Components), S6 (Data Flow) |
     | Tech stack, tech radar, versions | Technology Stack | S8 (Technology Stack) |
     | OpenAPI, Swagger, AsyncAPI specs | API Specification | S5 (Components), S7 (Integration Points) |
     | ER diagram, data model, schema | Data Model | S5 (Components), S6 (Data Flow) |
     | NFR, SLA, performance targets | Non-Functional Requirements | S10 (Scalability & Performance) |
     | Kubernetes, Terraform, IaC, infra | Infrastructure | S4 (Layers), S11 (Operational) |
     | Security policy, threat model | Security | S9 (Security Architecture) |
   - **HLD format enforcement**: If a file is classified as High-Level Design but is NOT a `.pdf` file, reject it and display:
     ```
     ⚠️ [filename] appears to be an HLD document but is not a PDF.
     High-Level Design documents must be provided as PDF files.
     Please provide the PDF version of this document.
     ```
   - Display summary:
     ```
     ✅ Loaded N supplementary file(s):
       • [filename] → classified as [type] → will inform [sections]
       ...
     ```
   - Store extracted data points for use during Step 5 (file creation):
     - Pre-populate relevant sections with data from supplementary files
     - Add source attribution: `<!-- SUPPLEMENTARY_SOURCE: [filename] -->`
     - Cross-reference with PO Spec data (supplementary files complement, PO Spec is authoritative for business context)

2. **If user types "skip" or presses Enter:**
   - Display: `⏭️ Proceeding without supplementary context.`
   - Continue to Step 1

3. **Conflict resolution:**
   - If supplementary files contradict PO Spec → PO Spec wins (business context is authoritative)
   - If supplementary files contradict each other → flag the conflict and ask the user to clarify
   - If supplementary files add detail not in PO Spec → incorporate as enrichment

---

#### Step 1: Present Architecture Type Options

When creating a new ARCHITECTURE.md, present the user with architecture type selection:

```markdown
📐 **Architecture Type Selection**

Before creating your ARCHITECTURE.md, please select the architecture type that best describes your system:

**1. Microservices Architecture (Recommended)** (Cloud-Native Distributed)
   - Best for: Cloud-native systems, independently deployable services, modern applications
   - Components: API Gateway → Services → Data Stores → Event Bus
   - Complexity: High
   - Team Size: Large (10+)
   - Why Recommended: Industry standard for scalable, resilient modern applications

**2. META Architecture** (6-Layer Enterprise)
   - Best for: Large enterprise systems, financial services, complex integrations
   - Layers: Channels → UX → Business Scenarios → Integration → Domain → Core
   - Complexity: Very High
   - Team Size: Large (10+)

**3. 3-Tier Architecture** (Classic Web Application)
   - Best for: Web apps, REST APIs, standard CRUD systems
   - Tiers: Presentation → Application/Business Logic → Data
   - Complexity: Low
   - Team Size: Small-Medium (2-8)

**4. N-Layer Architecture** (Customizable Patterns)
   - Best for: DDD, Clean Architecture, Hexagonal Architecture
   - Patterns: 4-Layer DDD, 5-Layer Extended, Clean Architecture, Hexagonal
   - Complexity: Medium-High
   - Team Size: Medium (4-10)

**5. BIAN Architecture** (5-Layer BIAN-Compliant)
   - Best for: Banking systems requiring BIAN V12.0 certification, full BIAN compliance
   - Layers: Channels → BIAN Business Scenarios → BIAN Business Capabilities → BIAN Service Domains → Core Systems
   - Complexity: Very High
   - Team Size: Large (10+)
   - BIAN Compliance: Full BIAN V12.0 across layers 2-4

For detailed comparison and decision guidance, refer to: `templates/ARCHITECTURE_TYPE_SELECTOR.md`

**Which architecture type best describes your system? (1-5, or type name)**

Note: Option 1 (Microservices) is recommended for most modern cloud-native applications.
```

#### Step 2: Capture User Selection

Wait for user response (1, 2, 3, 4, or 5) or architecture type name.

**Valid inputs:**
- Numeric: `1`, `2`, `3`, `4`, `5`
- Type names: `Microservices`, `META`, `3-Tier`, `N-Layer`, `BIAN`
- Variations: `microservices`, `meta`, `three-tier`, `n-layer`, `bian`

**If user is unsure:**
- Offer to load `templates/ARCHITECTURE_TYPE_SELECTOR.md` decision guide
- Provide quick decision tree questions
- Default to **Microservices (Recommended)** for modern cloud-native systems
- Default to **META** if user has enterprise requirements and regulatory compliance needs
- Default to **3-Tier** if user wants maximum simplicity and minimal operational complexity

#### Step 3: Load Type-Specific Templates

Based on user selection, load the appropriate templates:

| Selection | Section 4 Template | Section 5 Template |
|-----------|-------------------|-------------------|
| Microservices (1) | `templates/SECTION_4_MICROSERVICES.md` | `templates/SECTION_5_MICROSERVICES.md` |
| META (2) | `templates/SECTION_4_META.md` | `templates/SECTION_5_META.md` |
| 3-Tier (3) | `templates/SECTION_4_3TIER.md` | `templates/SECTION_5_3TIER.md` |
| N-Layer (4) | `templates/SECTION_4_NLAYER_PATTERNS.md` | *(Use generic component template)* |
| BIAN (5) | `templates/SECTION_4_BIAN.md` | `templates/SECTION_5_BIAN.md` |

**Loading Process:**
1. Read the appropriate Section 4 template file
2. Read the appropriate Section 5 template file (if exists)
3. Extract template content (excluding metadata comments)
4. Prepare for insertion into ARCHITECTURE.md at correct section boundaries

#### Step 4: Add Architecture Type Metadata

When creating the ARCHITECTURE.md, add an HTML comment metadata tag at the beginning of Section 4 to track the selected architecture type:

```html
<!-- ARCHITECTURE_TYPE: META -->
```

**Valid metadata values:**
- `<!-- ARCHITECTURE_TYPE: META -->`
- `<!-- ARCHITECTURE_TYPE: 3-TIER -->`
- `<!-- ARCHITECTURE_TYPE: MICROSERVICES -->`
- `<!-- ARCHITECTURE_TYPE: N-LAYER -->`
- `<!-- ARCHITECTURE_TYPE: BIAN -->`

**Purpose:**
- Enables type detection for future edits
- Used by validation rules
- Used by Design Drivers calculation
- Used by architecture compliance skill

#### Step 5: Create Multi-File Architecture Documentation

Instead of creating a single `ARCHITECTURE.md`, create the full multi-file `docs/` structure:

**Creation Order:**
1. Create `docs/` directory
2. Create `docs/components/` directory
3. Write each section to its corresponding `docs/NN-name.md` file (see RESTRUCTURING_GUIDE.md for file mapping):
   - `docs/01-system-overview.md` — Sections 1+2 (Executive Summary + System Overview)
     - Include PO Spec traceability metadata at the top of this file:
       - `<!-- PO_SPEC_SOURCE: [filename] (loaded YYYY-MM-DD) -->` if a PO Spec was found and used
       - `<!-- PO_SPEC_GATE: SKIPPED (user override at YYYY-MM-DD) -->` if the gate was overridden
   - `docs/02-architecture-principles.md` — Section 3 (Architecture Principles)
   - `docs/03-architecture-layers.md` — Section 4 (Architecture Layers, type-specific template)
   - `docs/04-data-flow-patterns.md` — Section 6 (Data Flow Patterns)
   - `docs/05-integration-points.md` — Section 7 (Integration Points)
   - `docs/06-technology-stack.md` — Section 8 (Technology Stack)
   - `docs/07-security-architecture.md` — Section 9 (Security Architecture)
   - `docs/08-scalability-and-performance.md` — Section 10 (Scalability & Performance)
   - `docs/09-operational-considerations.md` — Section 11 (Operational Considerations)
   - `docs/10-references.md` — References
4. **Section 5 — Create Individual Component Files** (MANDATORY)

   Every component identified during architecture design MUST get its own file. Do NOT write Section 5 content into a single monolithic file.

   **4a.** Identify all components from the architecture discussion (services, modules, infrastructure components, etc.)
   **4b.** For each component, create `docs/components/NN-<component-name>.md`:
      - `NN` = two-digit zero-padded index (01, 02, 03, ...)
      - Name = lowercase kebab-case (e.g., `01-api-gateway.md`, `02-order-service.md`)
      - Add breadcrumb: `[Architecture](../../ARCHITECTURE.md) > [Components](README.md) > <Component Name>`
      - Add `# <Component Name>` heading
      - Add `**Type:** <type>` field (e.g., Microservice, Infrastructure, Module, Service Domain)
      - Fill in component details using the type-specific Section 5 template (loaded in Step 3)
      - Use placeholder values (e.g., `[To be defined]`) for fields the user hasn't specified yet
   **4c.** Create `docs/components/README.md` component index using the architecture-component-guardian format:
      - Line 1: `<!-- managed by solutions-architect-skills:architecture-component-guardian -- do not edit manually -->`
      - Breadcrumb: `[Architecture](../../ARCHITECTURE.md) > Components`
      - 4-column table: `#`, `Component`, `File`, `Type`
      - One row per component file created in 4b
   **4d.** Verify: count of component files created must match count of rows in README.md table

   > **HARD GATE**: Do NOT proceed to Step 5 (ARCHITECTURE.md index) until at least one component file exists in `docs/components/`. If no components were identified, ask the user to define at least the primary components before continuing.

5. Write `ARCHITECTURE.md` as the navigation index using the template from RESTRUCTURING_GUIDE.md
6. Add the `<!-- ARCHITECTURE_TYPE: TYPE -->` metadata comment at the top of `docs/03-architecture-layers.md`

> **Note — Context Anchor on Subsequent Edits**: The sequential creation order (S1 → S2 → S3 → ... → S11) inherently satisfies the context anchor during initial documentation creation, since each section is written with prior sections fresh in context. However, the **Foundational Context Anchor Protocol MUST be followed for all subsequent edits** to any downstream section (S4–S11), as the original creation context will no longer be available.

**Include:**
- All template content from the type-specific templates, properly formatted
- Placeholder values in each file for the user to customize
- Breadcrumbs in all `docs/components/NN-name.md` files
- Cross-references as relative Markdown links (never bare `Section X.Y`)
- At least one `docs/components/NN-name.md` file per identified component
- `docs/components/README.md` with 4-column index matching all component files
- Each component file has: breadcrumb, `# Heading`, `**Type:**` field

#### Step 6: Delegate ADR Generation (Optional)

**Trigger**: Immediately after Step 5 completes successfully (docs/ structure created)

**Objective**: If ARCHITECTURE.md contains an ADR table, hand off ADR file generation to the `architecture-definition-record` skill — which owns all ADR write operations.

**Action**: Invoke `/skill architecture-definition-record` and pass context:
- ARCHITECTURE.md path
- Trigger reason: "Post-architecture-docs creation — generate ADRs from Section 12 table"

The `architecture-definition-record` skill handles the full interactive workflow (prompt user, parse table, generate files, conflict resolution, summary report). Do not replicate that logic here.

**If `architecture-definition-record` skill is not available**: Fall back to displaying this message:

```
📋 Architecture Decision Records (ADRs) Setup

Your ARCHITECTURE.md includes an ADR table. To generate ADR files, run:
  /skill architecture-definition-record

This skill will create adr/ADR-XXX-title.md files from the table entries.
```

#### Step 7: Mandatory Diagram Generation

**This step is not optional.** It always runs immediately after Step 6 completes (or is skipped). The two mandatory diagrams — High-Level Architecture and Data Flow — are generated now, before the workflow ends.

> **Why here**: `docs/03-architecture-layers.md` and `docs/04-data-flow-patterns.md` were just written in Step 5, so their content is fully in context. Generating diagrams now ensures a freshly created architecture is never delivered without its mandatory visual documentation.

---

##### Step 7.1: Generate Mandatory Diagrams

**Process**:

1. Load `MERMAID_DIAGRAMS_GUIDE.md` for templates and color scheme
2. Read `docs/03-architecture-layers.md` in full (just created in Step 5)
3. Read `docs/04-data-flow-patterns.md` in full (just created in Step 5)
4. Determine architecture type from the `<!-- ARCHITECTURE_TYPE: ... -->` comment inserted in Step 4 (already known in context)

**Generate Diagram A — High-Level Architecture**:
- Type: `graph TB` (top-to-bottom flowchart)
- Source: `docs/03-architecture-layers.md` — extract all layers, tiers, and component relationships
- Apply color scheme from MERMAID_DIAGRAMS_GUIDE (`classDef presentation`, `classDef application`, `classDef data`, etc.)
- Placement: **append at the end of `docs/03-architecture-layers.md`** with heading `#### Diagram: High-Level System Architecture`

**Generate Diagram B — Data Flow Diagrams**:
- Type: `sequenceDiagram` (one per H3 flow subsection)
- Source: `docs/04-data-flow-patterns.md` — parse every `### [Flow Name] Flow` H3 subsection
- For each H3 flow: extract participants and interactions, generate one `sequenceDiagram`
- Placement: insert each diagram **immediately after its corresponding H3 subsection** in `docs/04-data-flow-patterns.md`
- Heading: `#### Diagram: [Flow Name] Sequence`

**Canonical location rule**: Same as Workflow 8 Step 4 — placements above are not configurable and cannot be overridden.

---

##### Step 7.2: Offer Optional Diagrams

After mandatory diagrams are written, present the optional diagram menu:

```
✅ Mandatory diagrams generated:
- High-Level Architecture → docs/03-architecture-layers.md
- Data Flow Diagrams ([N] sequence diagrams) → docs/04-data-flow-patterns.md

**Additional Diagrams** (opt-in — select any or none):
A. Infrastructure & Deployment → docs/09-operational-considerations.md
B. High Availability & Failover → docs/08-scalability-and-performance.md
C. Performance & Scaling → docs/08-scalability-and-performance.md
D. Integration Diagrams → docs/05-integration-points.md
E. Security Architecture Diagrams → docs/07-security-architecture.md

Reply with letters (e.g., "A, C") or "None" to skip.
```

Generate any selected optional diagrams using the same Workflow 8 Step 8 rules and canonical locations.

---

##### Step 7.3: Mandatory Diagram Completeness Audit

Run the completeness audit on the two mandatory types only (scoped version of Workflow 8 Step 10):

1. Re-read `docs/03-architecture-layers.md` and `docs/04-data-flow-patterns.md`
2. Verify at least one `mermaid` block exists in each file
3. For `docs/04-data-flow-patterns.md`: verify each H3 flow subsection has a diagram within 30 lines below it

**If any REQUIRED diagram is missing**: generate it now (do not skip or defer).

---

##### Step 7.4: Workflow Completion

```
✅ Architecture creation complete.

**Structure created**:
- docs/ with [N] section files
- docs/components/ with [N] component files + README.md
- ARCHITECTURE.md navigation index
[- adr/ with [N] ADR files]  ← only if Step 6 generated ADRs

**Diagrams generated**:
- ✅ High-Level Architecture → docs/03-architecture-layers.md [REQUIRED]
- ✅ Data Flow Diagrams ([N]) → docs/04-data-flow-patterns.md [REQUIRED]
[- ✅ [Optional diagram name] → [file]]  ← only if user opted in

All diagrams follow canonical location enforcement (Workflow 8 policy).
```

**Return to main workflow**: Architecture Type Selection Workflow completes successfully

---

**End of Step 7**

### Detecting Existing Architecture Type

When editing an existing ARCHITECTURE.md, detect the architecture type:

**Detection Method 1: Metadata Comment**
```bash
grep -n "<!-- ARCHITECTURE_TYPE:" ARCHITECTURE.md
```

If found, extract the type from the comment.

**Detection Method 2: Section 4 Header Analysis**

If no metadata comment, infer from Section 4 headers:

```bash
# Check for BIAN indicators (check FIRST - most specific)
grep -E "(Layer 2: BIAN Business Scenarios|Layer 4: BIAN Service Domains)" ARCHITECTURE.md

# Check for META indicators
grep -E "(Layer 1: Channels|Layer 5: Domain|Layer 6: Core)" ARCHITECTURE.md

# Check for 3-Tier indicators
grep -E "(Tier 1: Presentation|Tier 3: Data)" ARCHITECTURE.md

# Check for Microservices indicators
grep -E "(API Gateway|Service Mesh|Microservices Catalog)" ARCHITECTURE.md

# Check for N-Layer indicators
grep -E "(Clean Architecture|Hexagonal|Ports & Adapters)" ARCHITECTURE.md
```

**Inference Rules (in order of specificity):**
- Contains "Layer 2: BIAN Business Scenarios" OR "Layer 4: BIAN Service Domains" → **BIAN**
- Contains "Layer 1: Channels" AND "Layer 5: Domain" AND "Layer 6: Core" → **META**
- Contains "Tier 1: Presentation" OR "Tier 3: Data" → **3-Tier**
- Contains "API Gateway" AND "Service Mesh" → **Microservices**
- Contains "Clean Architecture" OR "Hexagonal" → **N-Layer**
- Cannot determine → Ask user or default to **Microservices (Recommended)**

### Changing Architecture Type (Existing Document)

If user requests to change architecture type of an existing ARCHITECTURE.md:

**Warning Steps:**
1. **Detect current type** using detection methods above
2. **Warn user** about potential data loss:
   ```
   ⚠️  **Architecture Type Change Warning**

   Current type: [DETECTED_TYPE]
   Requested type: [NEW_TYPE]

   Changing architecture type will:
   - Replace Section 4 (Meta Architecture) with new structure
   - Replace Section 5 (Component Details) with new organization
   - Require manual component remapping

   **Recommendation**: Review and backup current Sections 4 & 5 before proceeding.

   Continue with architecture type change? (yes/no)
   ```

3. **If user confirms:**
   - Load new type templates
   - Replace Section 4 content
   - Replace Section 5 content
   - Update metadata comment
   - Update Document Index
   - Report changes to user

4. **If user declines:**
   - Cancel operation
   - Suggest manual editing approach

### Type-Specific Validation

After selecting or detecting architecture type, apply type-specific validation rules:

**BIAN Architecture:**
- ✅ Must have all 5 layers (Channels, BIAN Business Scenarios, BIAN Business Capabilities, BIAN Service Domains, Core Systems)
- ✅ Layer 2 must map to BIAN Business Areas (5 areas)
- ✅ Layer 3 must map to BIAN Business Domains (30+ domains)
- ✅ Layer 4 must implement BIAN Service Domains from [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html)
- ✅ All Layer 4 service domain names validated against official [BIAN Service Landscape V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html)
- ✅ Layer 4 components must include complete BIAN metadata (Official Name, BIAN ID, Version, Business Domain, Business Area, URL)
- ✅ Control records documented per BIAN specification for all Layer 4 service domains
- ✅ All mandatory BIAN service operations implemented (Initiate, Update, Retrieve, Control)
- ✅ Behavior qualifiers documented per BIAN spec
- ✅ Functional patterns documented per BIAN spec (Managed Object, Tracked Object, etc.)
- ✅ Full BIAN V12.0 compliance level documented
- ✅ BIAN hierarchy traceability: Service Domain → Business Domain → Business Area
- ✅ Layers documented in correct order

**META Architecture:**
- ✅ Must have all 6 layers (Channels, UX, Business Scenarios, Business, Domain, Core)
- ✅ Layer 5 must include BIAN alignment section
- ✅ Verify BIAN V12.0 is documented as the default version
- ✅ Validate BIAN service domain **names (Capabilities)** against the official [BIAN Service Landscape V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html)
- ✅ Ensure BIAN IDs (SD-XXX) are used for internal document tracking only
- ✅ Validate Layer 5 (Domain) components include BIAN alignment subsection with official URLs
- ✅ Layers documented in correct order

**3-Tier Architecture:**
- ✅ Must have all 3 tiers (Presentation, Application, Data)
- ✅ No direct database access from Presentation tier
- ✅ Application tier should be stateless

**Microservices Architecture:**
- ✅ Must document API Gateway and Service Mesh (or justify omission)
- ✅ Database-per-service pattern followed
- ✅ Event bus and topics documented
- ✅ Circuit breakers configured

**N-Layer Architecture:**
- ✅ Must specify which pattern (4-Layer, 5-Layer, Clean, Hexagonal)
- ✅ Dependency direction documented
- ✅ Core/domain layer is framework-free (if applicable)

**For detailed validation rules**, see: `VALIDATIONS.md` § Type-Aware Validation

### Best Practices

**DO:**
- ✅ Always prompt for architecture type when creating new ARCHITECTURE.md
- ✅ Add metadata comment to track architecture type
- ✅ Load appropriate templates based on selection
- ✅ Warn before changing architecture type of existing document
- ✅ Apply type-specific validation rules

**DON'T:**
- ❌ Assume architecture type without asking
- ❌ Mix templates from different architecture types
- ❌ Change architecture type without user confirmation
- ❌ Skip metadata comment (makes future edits harder)

### Example Workflow

**User:** "Create architecture documentation for my microservices system"

**Assistant:**
1. Detects new ARCHITECTURE.md creation
2. Presents architecture type options (1-4)
3. User selects "3" (Microservices)
4. Loads `templates/SECTION_4_MICROSERVICES.md` and `templates/SECTION_5_MICROSERVICES.md`
5. Creates ARCHITECTURE.md with:
   - Standard Sections 1-3
   - Microservices Section 4 (API Gateway, Service Mesh, Services, Event Bus)
   - Microservices Section 5 (Service catalog format)
   - Standard Sections 6-12
   - Metadata comment: `<!-- ARCHITECTURE_TYPE: MICROSERVICES -->`
6. Reports completion with architecture type confirmation

---
