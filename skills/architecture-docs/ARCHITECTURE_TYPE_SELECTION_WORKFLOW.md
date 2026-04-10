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

**Industry Standard:**
1. **Microservices** `STANDARD` `RECOMMENDED` — Cloud-native distributed systems with independently deployable services
2. **3-Tier** `STANDARD` — Classic web application pattern (Presentation → Application/Business Logic → Data)
3. **N-Layer** `STANDARD` — Customizable layered patterns (DDD, Clean Architecture, Hexagonal)

**Enterprise / Domain-Specific:**
4. **META** `ENTERPRISE` — 6-layer enterprise model (Channels → UX → Business Scenarios → Integration → Domain → Core) with [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) alignment for Layer 5 Domain
5. **BIAN** `ENTERPRISE` `BANKING` — 5-layer BIAN-compliant model with full [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) compliance across layers 2-4

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

  1️⃣  Run the full elicitation flow (interactive interview)
      → Launches /skill architecture-readiness to create a complete PO Spec
      → Recommended for new projects with no documented requirements

  2️⃣  Async intake from a file (non-interactive)
      → Provide a file (ticket export, email, requirements doc) and I'll
        extract requirements, score them, and generate a gap report with
        email-ready questions to send back to the requester
      → Best when business context arrived asynchronously via ticket or email

  3️⃣  Provide business context now (inline)
      → Type your business context here and I'll evaluate it against the
        PO Spec scoring rubric, then interview you for any gaps
      → Best when you have context in mind but no formal document yet

  4️⃣  Skip (SKIP PO SPEC)
      → Proceed without any business context
      → A PO_SPEC_GATE: SKIPPED warning will be recorded

Enter 1, 2, 3, or 4:
```

Wait for user response before proceeding.

---

**Option 1 — Full elicitation flow:**

- Invoke `/skill architecture-readiness`
- After the PO Spec is created, re-run Step 0 detection (the new file should now be found)
- Proceed with the standard "PO Spec FOUND" path

---

**Option 2 — Async intake from a file:**

⛔ **This flow NEVER transitions to elicitation.** It produces a gap report and STOPS.

Ask the user for the file path (ticket export, email, requirements document). Then:

- Invoke the `architecture-readiness` skill's Async Intake workflow: read the file, map content to 8 PO Spec sections, score, and generate `PO_SPEC_GAP_REPORT.md` with a **Ready-to-Send Message** block (email-ready questions)
- **If score ≥ 7.5**: A draft `PRODUCT_OWNER_SPEC.md` is also created — re-run Step 0 detection (it will now be found), then proceed with the standard "PO Spec FOUND" path
- **If score < 7.5**: Present the gap report to the user. The Ready-to-Send Message in the gap report can be copied directly into an email, ticket, or Slack message. Do NOT proceed to architecture creation — do NOT start elicitation. STOP here.

---

**Option 3 — Provide business context now (inline elicitation):**

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

**Option 4 — Skip:**

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

#### Step 0.5: Pre-Identify Architecture Decision Records (ADR Context Block)

**Trigger**: Immediately after PO Spec is loaded (Step 0 passes) and before architecture type selection.

**Objective**: Derive an initial ADR candidate list from PO Spec analysis. This list — the **ADR Context Block** — is carried through all subsequent steps to ensure every section references the same decisions with consistent rationale.

**Input sources** (already loaded in Step 0):
- **PO Spec Section 1 (Business Context)** → industry, domain, strategic direction → ADRs for architecture pattern, framework selection
- **PO Spec Section 3 (Business Objectives)** → scalability/performance/cost targets → ADRs for infrastructure strategy, caching approach
- **PO Spec Section 4 (Use Cases)** → sync vs async patterns, integration approaches → ADRs for communication patterns, API strategy
- **PO Spec Section 7 (Business Constraints)** → technology mandates, vendor constraints, compliance requirements, budget → ADRs for technology choices, deployment platform, compliance approach

**Action**: Analyze the loaded PO Spec sections and present the ADR Candidate Table:

```
📋 Pre-Identified Architecture Decision Records

Based on the PO Spec analysis, these architectural decisions will need to be made
during architecture design. Each will become a formal ADR in the adr/ directory.

| # | ADR Title (Candidate)              | Driver (PO Spec Source)                  | Impact |
|---|------------------------------------|------------------------------------------|--------|
| 1 | Select architecture pattern        | Business Objectives, Use Cases           | High   |
| 2 | Choose primary programming language| Business Constraints (team skills)       | High   |
| 3 | Select database technology         | Use Cases (data model requirements)      | High   |
| 4 | Define API communication strategy  | Use Cases (sync/async needs)             | Medium |
| 5 | Choose deployment platform         | Business Constraints (budget, cloud)     | High   |
| 6 | Select authentication approach     | Business Constraints (compliance)        | High   |
| N | [Additional decisions from PO Spec]| [Source section]                         | ...    |

Please confirm, adjust, or add decisions before we begin architecture design.
```

**Rules**:
- Derive candidates from PO Spec content — do NOT invent generic ADRs unrelated to the project
- Minimum 3 candidates, typical range 5–10
- Each candidate must trace to a specific PO Spec section as its driver
- Impact = High if it affects multiple architecture sections, Medium if 1–2 sections, Low if localized

**Wait for user confirmation.** Adjust the list based on user feedback. The confirmed list becomes the **ADR Context Block** — a structured reference maintained through Steps 1–6.

**If PO Spec was skipped (SKIP PO SPEC)**: Present a minimal ADR Candidate Table with the universal decisions (architecture pattern, primary language, database, deployment platform) and ask the user to provide drivers inline.

**ADR Context Block format** (maintained in conversation context):

```
ADR CONTEXT BLOCK (confirmed at Step 0.5)
──────────────────────────────────────────
ADR-001: [Title] | Driver: [source] | Status: PENDING
ADR-002: [Title] | Driver: [source] | Status: PENDING
ADR-003: [Title] | Driver: [source] | Status: PENDING
...
```

As decisions are made during Steps 1–5, update each ADR's status from `PENDING` to `DECIDED: [decision summary]` with the rationale captured in context.

---

#### Step 1: Present Architecture Type Options

When creating a new ARCHITECTURE.md, present the user with architecture type selection:

```markdown
📐 **Architecture Type Selection**

Before creating your ARCHITECTURE.md, please select the architecture type that best describes your system:

── Industry Standard ──────────────────────────────────────

**1. Microservices** `STANDARD` `RECOMMENDED`
   Cloud-native distributed services — independently deployable containers
   - Components: API Gateway → Services → Data Stores → Event Bus
   - Complexity: High | Team Size: Large (10+)

**2. 3-Tier** `STANDARD`
   Classic web application — presentation, business logic, data layers
   - Tiers: Presentation → Application/Business Logic → Data
   - Complexity: Low | Team Size: Small-Medium (2-8)

**3. N-Layer** `STANDARD`
   Customizable layered patterns — DDD, Clean Architecture, Hexagonal
   - Patterns: 4-Layer DDD, 5-Layer Extended, Clean, Hexagonal
   - Complexity: Medium-High | Team Size: Medium (4-10)

── Enterprise / Domain-Specific ───────────────────────────

**4. META** `ENTERPRISE`
   6-layer enterprise model with BIAN V12.0 alignment for domain services
   - Layers: Channels → UX → Business Scenarios → Integration → Domain → Core
   - Complexity: Very High | Team Size: Large (10+)

**5. BIAN** `ENTERPRISE` `BANKING`
   5-layer BIAN-compliant model — full BIAN V12.0 certification
   - Layers: Channels → BIAN Business Scenarios → BIAN Capabilities → BIAN Service Domains → Core
   - Complexity: Very High | Team Size: Large (10+)
   - BIAN Compliance: Full V12.0 across layers 2-4

────────────────────────────────────────────────────────────

**Which architecture type best describes your system? (1-5, or type name)**
```

#### Step 2: Capture User Selection

Wait for user response (1, 2, 3, 4, or 5) or architecture type name.

**Valid inputs:**
- Numeric: `1`, `2`, `3`, `4`, `5`
- Type names: `Microservices`, `3-Tier`, `N-Layer`, `META`, `BIAN`
- Variations: `microservices`, `three-tier`, `n-layer`, `meta`, `bian`

**If user is unsure:**
- Offer to load `templates/ARCHITECTURE_TYPE_SELECTOR.md` decision guide
- Provide quick decision tree questions
- Default to **Microservices (1)** for modern cloud-native systems
- Default to **3-Tier (2)** if user wants maximum simplicity and minimal operational complexity
- Default to **META (4)** if user has enterprise requirements and regulatory compliance needs

**ADR Context Block update**: After the user selects an architecture type, update the ADR Context Block — mark the "Select architecture pattern" ADR as `DECIDED: [selected type] — [rationale from user input]`.

#### Step 3: Load Type-Specific Templates

Based on user selection, load the appropriate templates:

| Selection | Tag | Section 4 Template | Section 5 Template | Architecture Rules | C4 Translation |
|-----------|-----|-------------------|-------------------|-------------------|----------------|
| 1 — Microservices | `STANDARD` | `templates/SECTION_4_MICROSERVICES.md` | `templates/SECTION_5_MICROSERVICES.md` | `references/MICROSERVICES-ARCHITECTURE.md` | `references/MICROSERVICES-TO-C4-TRANSLATION.md` |
| 2 — 3-Tier | `STANDARD` | `templates/SECTION_4_3TIER.md` | `templates/SECTION_5_3TIER.md` | `references/3-TIER-ARCHITECTURE.md` | `references/3-TIER-TO-C4-TRANSLATION.md` |
| 3 — N-Layer | `STANDARD` | `templates/SECTION_4_NLAYER_PATTERNS.md` | *(generic)* | `references/N-LAYER-ARCHITECTURE.md` | `references/N-LAYER-TO-C4-TRANSLATION.md` |
| 4 — META | `ENTERPRISE` | `templates/SECTION_4_META.md` | `templates/SECTION_5_META.md` | `references/META-ARCHITECTURE.md` | `references/META-TO-C4-TRANSLATION.md` |
| 5 — BIAN | `ENTERPRISE` | `templates/SECTION_4_BIAN.md` | `templates/SECTION_5_BIAN.md` | `references/BIAN-ARCHITECTURE.md` | `references/BIAN-TO-C4-TRANSLATION.md` |

**Loading Process:**
1. Read the appropriate Section 4 template file
2. Read the appropriate Section 5 template file (if exists)
3. **Read the Architecture Rules reference** — defines the architecture pattern, layers, principles
4. **Read the C4 Translation reference** — maps the architecture to C4 levels for component documentation
5. Extract template content (excluding metadata comments)
6. Prepare for insertion into ARCHITECTURE.md at correct section boundaries

**GATE CHECK**: If either reference doc (Architecture Rules or C4 Translation) is missing for the selected type:
```
⚠️ Cannot proceed — {type} is missing its architecture reference docs.
Required: references/{TYPE}-ARCHITECTURE.md and references/{TYPE}-TO-C4-TRANSLATION.md

This architecture type is unavailable until the reference docs are added to the plugin.
```

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

Instead of creating a single `ARCHITECTURE.md`, create the full multi-file `docs/` structure.

> **CRITICAL**: Steps 4a–4g (C4 component structure) below are MANDATORY for ALL PO Spec paths (Option 1, 2, 3, or 4). The C4 system folder structure MUST be created regardless of how business context was provided. Do NOT skip system identification (4a–4c) or create flat component files without system subfolders.

**ADR Context Block consistency**: Reference the ADR Context Block (from Step 0.5) when writing each section. As decisions are made during section creation, update the corresponding ADR candidate from `PENDING` to `DECIDED` with the decision summary and rationale. This ensures:
- **Section 3 (Principles)**: Trade-offs align with ADR candidates — each principle's Implementation/Trade-offs should reference relevant pending or decided ADRs
- **Section 4 (Architecture Layers)**: References ADR for architecture pattern (decided at Step 2)
- **Section 8 (Technology Stack)**: Each technology choice resolves a technology-related ADR candidate
- **Section 9 (Security)**: References security/compliance ADR candidates
- **Section 12 (ADR Table)**: Populate directly from the ADR Context Block — all confirmed candidates become rows with their final status, drivers, and impact

**Creation Order:**
1. Create `docs/` directory
2. Create `docs/components/` directory
3. Write each section to its corresponding `docs/NN-name.md` file (see RESTRUCTURING_GUIDE.md for file mapping):
   - `docs/01-system-overview.md` — Sections 1+2 (Executive Summary + System Overview)
     - Include PO Spec traceability metadata at the top of this file:
       - `<!-- PO_SPEC_SOURCE: [filename] (loaded YYYY-MM-DD) -->` if a PO Spec was found and used
       - `<!-- PO_SPEC_GATE: SKIPPED (user override at YYYY-MM-DD) -->` if the gate was overridden
   - `docs/02-architecture-principles.md` — Section 3 (Architecture Principles)
     - **MUST follow the mandatory 9-principle template** from ARCHITECTURE_DOCUMENTATION_GUIDE.md → "Section 3: Architecture Principles"
     - Include ALL 9 core principles in EXACT order: (1) Separation of Concerns, (2) High Availability, (3) Scalability First, (4) Security by Design, (5) Observability, (6) Resilience, (7) Simplicity, (8) Cloud-Native, (9) Open Standards
     - Each principle MUST have three subsections: **Description**, **Implementation** (system-specific, not generic), **Trade-offs** (honest cost assessment)
     - Optional principle 10 (Decouple Through Events): include ONLY if async patterns are documented in the architecture
     - Populate Implementation and Trade-offs using: PO Spec Section 7 (Business Constraints), architecture type decisions, and technology choices from the architecture discussion
     - **Document header**: Use `## Architecture Principles (9 Core Principles)` — or `(10 Core Principles)` if optional principle 10 is included
     - Do NOT invent custom principles, omit any of the 9, or reorder them
     - Validate against VALIDATIONS.md → "Section 3: Architecture Principles Validation" checklist before finalizing
   - `docs/03-architecture-layers.md` — Section 4 (Architecture Layers, type-specific template)
   - `docs/04-data-flow-patterns.md` — Section 6 (Data Flow Patterns)
   - `docs/05-integration-points.md` — Section 7 (Integration Points)
   - `docs/06-technology-stack.md` — Section 8 (Technology Stack)
   - `docs/07-security-architecture.md` — Section 9 (Security Architecture)
   - `docs/08-scalability-and-performance.md` — Section 10 (Scalability & Performance)
   - `docs/09-operational-considerations.md` — Section 11 (Operational Considerations)
   - `docs/10-references.md` — References
4. **Section 5 — Create Individual Component Files (C4 Model)** (MANDATORY)

   Every component identified during architecture design MUST get its own file. Do NOT write Section 5 content into a single monolithic file. Components follow the **C4 model**: systems (L1) organize into folders, containers (L2) become component files.

   **4a. C4 Level 1 — Identify and Confirm Systems**

   From the architecture discussion, identify all systems. A system is a logical group of applications and data stores, typically owned by a single development team. Present to the user for confirmation:

   ```
   🔍 C4 Level 1 — Systems Identified

   Based on the architecture discussion, I've identified these systems:

     1. [System Name] — [brief description]
     2. [System Name] — [brief description]
     3. [System Name] (external) — [provider, not owned by us]

   Internal systems (1, 2) will get component documentation.
   External systems (3) are referenced as dependencies only.

   Please confirm or adjust this list before we proceed.
   ```

   Wait for user confirmation. Adjust if needed.

   **4b. C4 Level 2 — Confirm Focus System**

   If multiple internal systems detected, ask which is the **main system of concern**:

   ```
   🔎 C4 Level 2 — Confirm Focus System

   Which system is the main focus of this architecture?
   (All systems get full documentation. The focus system is listed first and centers the C2 diagram.)

     1. [System Name] ← (main system of concern)
     2. [System Name]

   Enter the number of your main system:
   ```

   Single system → skip this prompt (it is the focus by default), but still create the system folder and system descriptor file.

   All identified internal systems get **full detailed component documentation** — same depth for every system. The focus system designation only affects:
   - Priority in the README.md index (focus system listed first)
   - Architecture diagram scope (C2 diagram centers on the focus system)

   **4c. C4 Level 2 — Identify Containers per System**

   For each system, identify all containers (C4 Level 2). Each MUST pass the **boundary test**:
   - "Can this be deployed independently?" → YES = valid container
   - "Does this run as its own process/container?" → YES = valid container
   - Code module inside a deployable → NOT a container (C3 level — document within parent)
   - External system you don't own → NOT a container (reference in integration docs)

   Classify each container as **App** or **Store**:

   | Type | C4 Category | Examples |
   |------|------------|---------|
   | API Service | App | REST API, GraphQL server, gRPC service |
   | Web Application | App | SPA, SSR frontend, admin portal |
   | Worker/Consumer | App | Message consumer, background processor, scheduler |
   | Database | Store | PostgreSQL, MongoDB, SQL Server |
   | Cache | Store | Redis, Memcached |
   | Message Broker | Store | Kafka, RabbitMQ, Azure Service Bus |
   | Object Storage | Store | S3, Azure Blob, MinIO |
   | Gateway | App | API Gateway, reverse proxy, load balancer |

   **4d. Create System Files and Component Files**

   **Multi-system only — Create C4 L1 system descriptor files first:**

   For each identified system (internal and external), create `docs/components/<system-name>.md` at the root of `docs/components/`:

   ```markdown
   [Architecture](../../ARCHITECTURE.md) > [Components](README.md) > {System Name}

   # {System Name}

   **C4 Level:** System (L1)
   **Type:** {Internal System | External System}
   **Owner:** {team or organization}
   **Containers:** {count} ({N} Apps, {M} Stores)

   ## Description

   {1-2 paragraph description of the system's business purpose and scope}

   ## Containers

   | Component | Type | Technology |
   |-----------|------|------------|
   | [Component Name](<system-name>/01-component.md) | {C4 type} | [{technology}] |

   ## System Boundaries

   **Owns:** {what data/capabilities this system is responsible for}
   **Depends on:** {other systems it calls}
   **Consumed by:** {other systems that call it}

   ## Communication

   | From | To | Protocol | Description |
   |------|----|----------|-------------|
   ```

   File name = kebab-case system name (same as the folder name). ALL architectures — including single-system — create a system descriptor file and a system folder for their containers.

   **Then create C4 L2 container files:**

   For each container identified in 4c, create a component file:
   - Path: `docs/components/<system-name>/NN-<component-name>.md` (always nested in system folder)
   - `NN` = two-digit zero-padded index (01, 02, 03, ...) — resets per system folder
   - Name = lowercase kebab-case (e.g., `01-payment-api.md`, `02-payment-db.md`)
   - Breadcrumb: `[Architecture](../../../ARCHITECTURE.md) > [Components](../README.md) > [System Name](.) > <Component Name>`
   - Add `# <Component Name>` heading
   - Add C4 metadata header:
     ```
     **Type:** <C4 type from table above>
     **Technology:** [<technology with version>]
     **C4 Level:** Container (L2)
     **Deploys as:** <Docker container | serverless function | managed service | VM>
     **Communicates via:** <HTTPS | gRPC | AMQP | TCP | ...>
     ```
   - Fill in component details using the type-specific Section 5 template (loaded in Step 3)
   - Use placeholder values (e.g., `[To be defined]`) for fields the user hasn't specified yet

   **4d-VERIFY. Structural Validation (before guardian sync)**

   Before invoking the guardian, verify the C4 folder structure:
   - [ ] At least one system folder exists: `docs/components/<system-name>/`
   - [ ] Each system folder contains at least one `NN-*.md` component file
   - [ ] A system descriptor file exists for each system folder: `docs/components/<system-name>.md`
   - [ ] No component files exist at `docs/components/` root (only system descriptors and README.md belong there)

   If any check fails, go back to Step 4d and create the missing structure. Do NOT invoke the guardian on a broken layout.

   **4e. Create README.md Component Index — DELEGATE TO GUARDIAN**

   **Do NOT create `docs/components/README.md` directly.** Invoke the `architecture-component-guardian` skill to generate it. The guardian is the only sanctioned way to create or modify the component index — it enforces the canonical format specification.

   Invoke: `/skill architecture-component-guardian` with action `sync`

   The guardian will scan all component files created in Steps 4d and generate `docs/components/README.md` with the correct format:
   - Line 1: `<!-- managed by solutions-architect-skills:architecture-component-guardian — do not edit manually -->` (em dash, not double hyphen)
   - Title: `# Component Details` (fixed — not "Component Index" or project-specific)
   - Intro paragraph: prose summary of the component structure
   - Grouped tables with `### [<System Name>](<system-name>.md)` headers (all architectures)
   - 5-column table: `#`, `Component`, `File`, `Type`, `Technology`
   - Row numbering: `5.1`, `5.2`, `5.3` format (not sequential 1, 2, 3)
   - `## Key Relationships` section
   - `## Related Documentation` section

   **If the guardian skill is not available** (e.g., plugin not installed), fall back to creating README.md manually following the exact format specification in `skills/architecture-component-guardian/SKILL.md` → "Format Specification".

   **4f. Verify Counts**

   Count of component files created must match count of rows in README.md table (across all system groups).

   **4g. Summary**

   Report all systems and components created:
   ```
   ✅ C4 Component Documentation Complete

   Focus System: [name]
   Systems: [count] internal, [count] external (dependencies only)

   [System Name] ([count] containers):
     - 01-component-name.md (API Service) [Spring Boot 3.2]
     - 02-component-name.md (Database) [PostgreSQL 16]
     ...
   ```

   > **HARD GATE**: Do NOT proceed to Step 5 (ARCHITECTURE.md index) until at least one component file exists in `docs/components/`. If no components were identified, ask the user to define at least the primary containers before continuing.

5. Write `ARCHITECTURE.md` as the navigation index using the template from RESTRUCTURING_GUIDE.md
6. Add the `<!-- ARCHITECTURE_TYPE: TYPE -->` metadata comment at the top of `docs/03-architecture-layers.md`

> **Note — Context Anchor on Subsequent Edits**: The sequential creation order (S1 → S2 → S3 → ... → S11) inherently satisfies the context anchor during initial documentation creation, since each section is written with prior sections fresh in context. However, the **Foundational Context Anchor Protocol MUST be followed for all subsequent edits** to any downstream section (S4–S11), as the original creation context will no longer be available.

**Include:**
- All template content from the type-specific templates, properly formatted
- Placeholder values in each file for the user to customize
- Breadcrumbs in all `docs/components/<system-name>/NN-name.md` files
- Cross-references as relative Markdown links (never bare `Section X.Y`)
- At least one `docs/components/NN-name.md` file per identified component
- `docs/components/README.md` with 5-column index matching all component files
- Each component file has: breadcrumb, `# Heading`, `**Type:**` field

#### Step 6: Delegate ADR Generation (Optional)

**Trigger**: Immediately after Step 5 completes successfully (docs/ structure created)

**Objective**: If ARCHITECTURE.md contains an ADR table, hand off ADR file generation to the `architecture-definition-record` skill — which owns all ADR write operations.

**Action**: Invoke `/skill architecture-definition-record` and pass context:
- ARCHITECTURE.md path
- Trigger reason: "Post-architecture-docs creation — generate ADRs from Section 12 table using full template"
- **ADR Context Block**: Pass the full ADR Context Block from Step 0.5 — each ADR candidate now has its driver (PO Spec source), decision summary, rationale, and the section(s) where it was resolved. This enriched context ensures ADR files are complete and consistent with the architecture documentation.
- **Critical context note**: The full architecture documentation (all `docs/` files created in Step 5) is in the current conversation context. The ADR skill MUST use this context to populate ALL body sections of each ADR (Context, Decision, Rationale, Consequences, Alternatives) — not just metadata placeholders. Do NOT generate abbreviated stubs.
- **Canonical template requirement**: The ADR skill MUST load and use the canonical template (`ADR-000-template.md`) for every generated file. If any ADR is produced without the full 10-section structure (Context, Decision, Rationale, Consequences, Alternatives, Implementation Plan, Success Metrics, References, Review History, Notes), the generation has FAILED.

The `architecture-definition-record` skill handles the full interactive workflow (prompt user, parse table, generate files with fully populated content, conflict resolution, summary report). Do not replicate that logic here.

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

1. Load `references/DIAGRAM-GENERATION-GUIDE.md` (primary generation reference) and `MERMAID_DIAGRAMS_GUIDE.md` (authoring reference)
2. Read `docs/03-architecture-layers.md` in full (just created in Step 5)
3. Read `docs/04-data-flow-patterns.md` in full (just created in Step 5)
4. Read `docs/components/README.md` for the component index
5. Read `docs/05-integration-points.md` for protocols and topic/queue names
6. Determine architecture type from the `<!-- ARCHITECTURE_TYPE: ... -->` comment inserted in Step 4 (already known in context)
6.5. Detect theme preference from `<!-- DIAGRAM_THEME: ... -->` in `docs/03-architecture-layers.md` — if absent (expected for new docs), ask: "Do you use a **light** or **dark** theme in your editor/viewer? (Default: light)". Persist the answer as `<!-- DIAGRAM_THEME: light|dark -->` immediately after the `<!-- ARCHITECTURE_TYPE: ... -->` comment.
7. Select grouping strategy, naming pattern, and color conventions from DIAGRAM-GENERATION-GUIDE's Architecture Type Adaptation table — use light or dark palette per detected theme

**Generate all 4 standard diagrams** (in order, under `## Architecture Diagrams` in `docs/03-architecture-layers.md`):

**Diagram 1 — Logical View (ASCII)**:
- Format: ASCII art in a fenced code block (no language tag)
- Source: `docs/03-architecture-layers.md` — extract all layers/tiers/groups and components
- Grouping: per Architecture Type Adaptation table (layers for META/BIAN/N-Layer, tiers for 3-Tier, functional groups for Microservices)
- Heading: `#### Diagram: Logical View`
- Include `**Reading the diagram:**` section after with arrow convention bullet points

**Diagram 2 — C4 Level 1 System Context (Mermaid)**:
- Format: Mermaid `graph TB`
- Source: `ARCHITECTURE.md` + `docs/01-system-overview.md` + `docs/05-integration-points.md`
- Apply C4 L1 translation per architecture type (see DIAGRAM-GENERATION-GUIDE → C4 L1 Translation table)
- Heading: `#### Diagram: C4 Level 1 — System Context`

**Diagram 3 — C4 Level 2 Container (Mermaid)**:
- Format: Mermaid `graph TB`
- Source: `docs/components/README.md` + `docs/components/**/*.md` + `docs/05-integration-points.md`
- Group containers by layer/tier/functional group (same grouping as Diagram 1)
- Heading: `#### Diagram: C4 Level 2 — Container`

**Diagram 4 — Detailed View (Mermaid)**:
- Format: Mermaid `graph TB`
- Source: all docs — full component wiring with topic names, queue names, protocols
- Apply type-specific color conventions from DIAGRAM-GENERATION-GUIDE → Color Conventions by Architecture Type
- Heading: `#### Diagram: Detailed View`

**Generate Data Flow Diagrams** (separately, in `docs/04-data-flow-patterns.md`):
- Type: `sequenceDiagram` (one per H3 flow subsection) — see DIAGRAM-GENERATION-GUIDE → "Data Flow Diagrams — Sequence Diagrams" for syntax reference and conventions
- Source: `docs/04-data-flow-patterns.md` — parse every `### [Flow Name] Flow` H3 subsection
- For each H3 flow: extract participants and interactions, generate one `sequenceDiagram` using `->>` for sync calls, `-)` for async events, and `alt/else/end`, `loop/end`, `par/and/end` for control flow
- Placement: insert each diagram **immediately after its corresponding H3 subsection** in `docs/04-data-flow-patterns.md`
- Heading: `#### Diagram: [Flow Name] Sequence`

**Canonical location rule**: Same as Workflow 8 — placements above are not configurable and cannot be overridden.

---

##### Step 7.2: Offer Optional Diagrams

After mandatory diagrams are written, present the optional diagram menu:

```
✅ Mandatory diagrams generated:
- Logical View (ASCII) → docs/03-architecture-layers.md
- C4 Level 1 — System Context → docs/03-architecture-layers.md
- C4 Level 2 — Container → docs/03-architecture-layers.md
- Detailed View → docs/03-architecture-layers.md
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

Run the completeness audit on all mandatory diagrams (scoped version of Workflow 8):

1. Re-read `docs/03-architecture-layers.md` and `docs/04-data-flow-patterns.md`
2. Verify `docs/03-architecture-layers.md` contains all 4 standard diagrams under `## Architecture Diagrams`:
   - One ASCII code block (Logical View)
   - Three `mermaid` blocks (C4 L1, C4 L2, Detailed View)
3. For `docs/04-data-flow-patterns.md`: verify each H3 flow subsection has a `sequenceDiagram` within 30 lines below it

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
- ✅ Logical View (ASCII) → docs/03-architecture-layers.md [REQUIRED]
- ✅ C4 Level 1 — System Context → docs/03-architecture-layers.md [REQUIRED]
- ✅ C4 Level 2 — Container → docs/03-architecture-layers.md [REQUIRED]
- ✅ Detailed View → docs/03-architecture-layers.md [REQUIRED]
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
