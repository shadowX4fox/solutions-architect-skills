> Part of **Workflow 1 — Create** (`architecture-docs`). **Read by line range only** (8.87.0): a create runs `00-gates-run.md`, whose `gates-check.js` names the range of this file to read for a gate that does not pass. This file stays the full specification of Steps 0.1–0.65. Step numbers are global across the parts.

#### Step 0.1: Documentation Language Gate (MANDATORY — no skip)

This is the **first** gate of Workflow 1. It runs before the PO Spec check, because every prompt,
file and heading produced from here on depends on the answer.

**Scope**: Workflow 1 (new ARCHITECTURE.md creation) only. Workflows 2, 8, 9 and 10 resolve the
language from the existing marker instead — see `SKILL.md` → "Language Resolution".

**Re-run safety — resolve before asking.** Apply the resolution protocol in
`references/LANGUAGE_POLICY.md` §3 first:

1. `<!-- DOC_LANGUAGE: xx -->` already present in `ARCHITECTURE.md` → adopt it silently, display
   `✅ Documentation language: [English (en) | Español (es)]`, and proceed to Step 0.2.
2. Legacy `<!-- LANGUAGE: xx -->` present → adopt it, rewrite the marker as `DOC_LANGUAGE`, and
   proceed to Step 0.2.
3. A `PRODUCT_OWNER_SPEC.md` at the project root carries `<!-- DOC_LANGUAGE: xx -->` → use that
   value as the **pre-selected default** in the prompt below (do not adopt it silently; the
   architect still confirms).
4. Otherwise → ask.

---

**Prompt** (display verbatim, then wait):

```
🌐 Documentation Language

Every document this workflow writes into your project — ARCHITECTURE.md, docs/,
ADRs, analysis reports, compliance contracts and the dev-handoff kit — will be
authored in the language you pick here. Codes, status values, table column keys
and filenames stay in English so downstream tooling keeps working.

  1️⃣  English (en)
  2️⃣  Español (es)

Enter 1 or 2:
```

Wait for user response before proceeding. There is **no skip token** — unlike the PO Spec gate at
Step 0.2, this gate costs one keystroke and everything downstream depends on its answer. If the
user answers with a language name rather than a number (`english`, `español`, `spanish`, `es`),
accept it. Any other answer → re-display the prompt.

---

**On answer** — hold the resolved value as `doc_language` for the remainder of the workflow and:

- Display `✅ Documentation language: Español (es)` (or the English equivalent).
- Record the value for Step 5, which writes `<!-- DOC_LANGUAGE: xx -->` into `ARCHITECTURE.md`
  and `<!-- DOC_LANGUAGE_GATE: PASSED (xx, YYYY-MM-DD) -->` into `docs/01-system-overview.md`.
- Proceed to Step 0.2.

---

**What `doc_language` changes for the rest of Workflow 1**

| | |
|---|---|
| **Localized** | Every heading, label, prose paragraph, table cell **content**, diagram node label, `EXPLORER_HEADER` **values**, and the `docs/CHANGELOG.md` preamble that this workflow writes into a file |
| **Always English** | Every prompt, warning and status line displayed to the user *about* the work; every item in the do-not-localize registry (`references/LANGUAGE_POLICY.md` §4) — codes, status enum values, table column **headers**, filenames, HTML-comment marker names and values, `EXPLORER_HEADER` field **keys**, Mermaid keywords and `classDef` role names, and the four `#### Diagram: …` headings |
| **Anchored** | Every structural heading carries its English anchor comment — `## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->` — in **both** languages, so downstream gates match the anchor and never the visible text |

The visible-text registry for both languages is `references/LANGUAGE_POLICY.md` §5. Do not invent
translations that are not in it; if a heading you need has no registry entry, author it in the
selected language and keep the English anchor exact.

---

#### Step 0.2: Product Owner Specification Prerequisite Check

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
- After the PO Spec is created, re-run Step 0.2 detection (the new file should now be found)
- Proceed with the standard "PO Spec FOUND" path

---

**Option 2 — Async intake from a file:**

⛔ **This flow NEVER transitions to elicitation.** It produces a gap report and STOPS.

Ask the user for the file path (ticket export, email, requirements document). Then:

- Invoke the `architecture-readiness` skill's Async Intake workflow: read the file, map content to 8 PO Spec sections, score, and generate `PO_SPEC_GAP_REPORT.md` with a **Ready-to-Send Message** block (email-ready questions)
- **If score ≥ 7.5**: A draft `PRODUCT_OWNER_SPEC.md` is also created — re-run Step 0.2 detection (it will now be found), then proceed with the standard "PO Spec FOUND" path
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

- Load `plugins/sa-requirements/skills/architecture-readiness/PO_SPEC_SCORING_GUIDE.md`
- Map the user's input to the 8 PO Spec sections
- Score each section using the weighted rubric defined in `plugins/sa-requirements/skills/architecture-readiness/PO_SPEC_SCORING_GUIDE.md` § "Section Weights" (8 sections, weighted 0–10, ≥7.5 = ready — update that file if weights ever change)
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
- Save as `PRODUCT_OWNER_SPEC.md` at project root (using the template from `plugins/sa-requirements/skills/architecture-readiness/templates/PO_SPEC_TEMPLATE.md`)
- Render the distribution PDF by running `plugins/sa-requirements/skills/architecture-readiness/SKILL.md` workflow 5 — the PO Spec is stakeholder-facing, so the PDF is produced here exactly as it is in the standalone readiness flows. A failed render warns and continues; it never blocks architecture creation.
- Display: `✅ Product Owner Specification created: PRODUCT_OWNER_SPEC.md (score: X.X/10.0)`
- Display (on a successful render): `📄 Distribution PDF: exports/PO-SPEC-<slug>.pdf`
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

#### Step 0.3: Capability Alignment Gate (mandatory when a framework is declared)

The initiative is mapped onto the **capability framework** its organization uses before design begins — the industry
reference model whose capabilities it realizes. Frameworks are listed by code (`bun [plugin_dir]/scripts/shared/frameworks.js
--project <root>`): the base ships **BIAN** (banking: the BIAN Service Landscape v14.0.0 — Business Areas › Business Domains ›
Service Domains) and **CROSS-INDUSTRY** (the Turbo EA cross-industry capability map — Domains › Capability Groups ›
Capabilities, CC BY 4.0); an institution pack may add its own and declare one as the organization's default.

**Scope**: Workflow 1 (new ARCHITECTURE.md creation) only — not edits, diagrams, migration or the release.

**Which framework** — `gates-check.js` reports it on the `0.3 align` line, resolved in this order: the project's
`.sa-skills/project.json` (`framework`), an institution pack's `defaults.framework`, a `BIAN_ALIGNMENT.md` (or the older
`ENTERPRISE_ALIGNMENT.md`) already in the project (BIAN). Then:

- **`ASK` — nothing declared.** Ask once (`AskUserQuestion`), listing the frameworks the note names and **none** — an
  initiative with no industry reference model. Record the answer, then re-run `gates-check.js`:
  ```bash
  bun [plugin_dir]/scripts/shared/frameworks.js --declare <id|none> --project <project_root>
  ```
- **`PASS` with `none`** — the project declares no framework. Section 1.5 is omitted; record
  `<!-- ALIGNMENT_GATE: NONE (no capability framework declared, YYYY-MM-DD) -->`. Proceed to Step 0.4.
- **`BLOCK` — the declared framework's report is missing or below its version.** Display and **STOP** — no skip override
  while a framework is declared (change the declaration instead, above):
  ```
  🚫 No capability alignment for <framework>

  The project declares <framework> (<source>). Run, then re-invoke /sa-skills:architecture-docs:

    /sa-requirements:architecture-capability-alignment [--framework <id>]

  It maps the PO Spec onto <framework> and writes <report> at the project root.
  ```
  A legacy `ENTERPRISE_ALIGNMENT.md`, or a BIAN report below `BIAN_ALIGNMENT_VERSION: 3.0`, blocks the same way: it was
  written against a withdrawn model and is never read or rendered — regenerate, then delete the old file. Do not
  auto-invoke the alignment skill; the user runs it.
- **`PASS` / `WARN` — the report exists.** A `WARN` means it may be stale (written against another PO Spec, or older than
  the spec): show the note and ask whether to continue; on no, stop and point to the alignment skill.

**Skip path — PO Spec skipped**: when `<!-- PO_SPEC_GATE: SKIPPED -->` was just recorded (Step 0.2 Option 4), this gate is
skipped too — there is nothing to map.

**What Step 5 lifts** — the section payload carries the report (`section-prepare.js --section 1`): its **Summary** table,
the per-area impacted domains and impacted units, and — BIAN only — the **Diagram ID Segments** (when an institution pack's
design language is in force) and the **API Surface**. They become sub-section `1.5` of `docs/01-system-overview.md`
(`ARCHITECTURE_DOCUMENTATION_GUIDE.md` § 1.5): `BIAN Capability Alignment` for BIAN, `Capability Alignment` for any other
framework. A framework publishes no governance rules: there is no cross-cutting findings or owner section to lift — do not
manufacture one. The payload also carries the traceability markers (`BIAN_ALIGNMENT_GATE` / `BIAN_ALIGNMENT_SOURCE` for
BIAN, `ALIGNMENT_GATE` / `ALIGNMENT_SOURCE` for another framework); `collect-save.js --framework <id|none> --alignment
<report>` records them at Step 4.9.

---

#### Step 0.4: HLD Intake Gate (MANDATORY — no skip)

After the Capability Alignment Gate resolves, prompt the user once for the project's **High-Level Design (HLD)** file. This gate is mandatory — there is no `SKIP HLD` override. The HLD anchors S4 (Architecture Layers), S5 (Component Inventory), and S6 (Data Flow Patterns) so they reflect upstream design intent rather than reverse-derivation from the PO Spec alone.

**Scope**: This gate runs **only for Workflow 1 (new ARCHITECTURE.md creation)**. It does NOT run for Workflow 2 (edits), Workflow 8 (diagrams), Workflow 9 (migration), or the release (`architecture-lifecycle`).

**Cascades-skip rule**: If `<!-- PO_SPEC_GATE: SKIPPED -->` OR an alignment gate SKIPPED marker (`BIAN_ALIGNMENT_GATE` or `ALIGNMENT_GATE`) was recorded earlier in this workflow, automatically skip this gate too — there is no design intent to anchor against. Record:

```
<!-- HLD_GATE: SKIPPED (cascading from upstream gate skip, YYYY-MM-DD) -->
```

…and proceed to Step 0.5. Otherwise, display:

```
📐 **HLD Intake Gate (Required)**

This architecture must be anchored to a High-Level Design document.
Provide the path to your HLD file. Accepted formats (best extraction first):

  • Mermaid (.mmd, .mermaid) — explicit nodes, edges and subgraphs;
                               nothing is inferred. Preferred when available.
  • Mermaid in Markdown (.md) — a design doc carrying ```mermaid fences
  • PDF  (.pdf)
  • PNG  (.png)            — high-resolution recommended (≥1920px wide
                             or ≥150 DPI) for diagram label readability
  • SVG  (.svg)            — exported from draw.io, Lucidchart, Excalidraw

Examples:  design/hld.mmd  •  docs/design.md  •  design/hld.pdf
           diagrams/system-overview.svg  •  hld.png

Type the file path to continue. There is no skip option.
```

**Processing the HLD file**:

1. **Validate the extension** is one of `.mmd`, `.mermaid`, `.md`, `.pdf`, `.svg`, `.png` (case-insensitive). Reject any other extension and re-prompt:
   ```
   ⚠️ [filename] is not a supported HLD format.
   Accepted: .mmd, .mermaid, .md, .pdf, .svg, .png.
   Please provide an HLD file in one of these formats.
   ```
   A `.md` file must contain at least one ` ```mermaid ` fenced block. If it contains none, reject and re-prompt:
   ```
   ⚠️ [filename] contains no ```mermaid fenced blocks.
   Provide a .md file with at least one Mermaid diagram, or a bare .mmd/.mermaid file.
   ```
   Continue re-prompting until a valid file is supplied. Do NOT proceed to Step 0.5 without a valid HLD.

2. **Read the file**:
   - `.mmd` / `.mermaid` → Read tool (text — the entire file is the diagram source)
   - `.md` → Read tool (text — extract every ` ```mermaid ` fence. Surrounding prose is ignored except where a heading or caption names the diagram, which is used as its title)
   - `.pdf` → Read tool with the `pages` parameter (chunks of 20 pages for PDFs >10 pages)
   - `.png` → Read tool (multimodal — Claude sees the image visually)
   - `.svg` → Read tool (XML text — Claude parses element labels, group hierarchy, and arrow markers from the markup)

2b. **Transcribe a picture into Mermaid** (`.pdf` · `.png` · `.svg` only — 8.93.1). Write `<name>.hld.mmd` beside the
   file (`HLD.pdf` → `HLD.hld.mmd`; the receipt names it), once, from the reading in item 2. It is the form every later
   reader takes the design from — the section payloads carry it verbatim and `integration-check.js` holds docs/05 to its
   edges; a picture states nothing code can read. A transcription, not a redesign:
   - `flowchart TB`; one `subgraph ID["Label"]` per grouping the picture draws (system, zone, tier, domain).
   - One node per box, its label **verbatim** from the picture — the shape as drawn (`[( … )]` for a cylinder).
   - One edge per arrow, in the arrow's direction, its label verbatim: `A -->|"label as written"| B`; an arrow with no
     label is `A --> B`; a dashed arrow `A -.-> B`; a double-headed one `A <--> B`.
   - Nothing the picture does not show: no invented protocol, no house palette, no renamed box. What cannot be read is
     a `%% unreadable: …` comment, never a guess.
   - First line `%% Transcribed from <file> (<date>) — the picture is the source; correct this file, not the reading.`
   Re-run `gates-check.js --hld <file>`: the gate passes once the transcription states at least one edge.

3. **Extract design concepts** for downstream sections:
   - Component / container names → seed S5 (Component Inventory)
   - Layer / tier groupings → seed S4 (Architecture Layers)
   - Connection arrows / integration lines → seed S6 (Data Flow Patterns)
   - Annotated technologies → cross-check against S8 (Technology Stack)

4. **Mermaid extraction rules** (applies to `.mmd`, `.mermaid`, and each fence found in a `.md`):

   Dispatch on the first statement of each block.

   **`C4Context` / `C4Container`** — apply the element-by-element extraction already specified in
   `plugins/sa-delivery/skills/architecture-icepanel-sync/SKILL.md` Step 1.1. Do not restate those rules here; that file
   is the single source of truth for `Person()`, `Person_Ext()`, `System()`, `System_Ext()`,
   `Container()`, `ContainerDb()`, `ContainerQueue()`, `Container_Boundary()` and `Rel()`.

   **`flowchart` / `graph`** (any direction — `TB`, `TD`, `LR`, `RL`, `BT`):

   | Construct | Seeds |
   |---|---|
   | `subgraph ID["Label"]` | S4 — one layer, tier or functional group per subgraph; a nested subgraph is a sub-group |
   | Node `id["Label"]`, `id(Label)`, `id([Label])`, `id[[Label]]` | S5 — a component |
   | Node `id[(Label)]` (cylinder), `id{{Label}}` (hexagon) | S5 — the shape hints at type: cylinder → datastore, hexagon → gateway/broker. A hint only; the label wins if they disagree |
   | Node `id((Label))` (circle) | S5 — usually an external system or actor, especially outside any subgraph |
   | Node `id{Label}` (rhombus) | **S6, not S5** — a rhombus is a decision/branch in the flow, not a deployable component. Record it as branching in the data flow and do **not** add it to the Component Inventory |
   | A node in **no** subgraph | S5 — treat as external to the system boundary (an actor or third-party system) unless the label says otherwise; it does not belong to any S4 layer |
   | Edge `A --> B`, `A -->\|"label"\| B` | S6 — a synchronous data flow |
   | Edge `A -.-> B`, `A -.- B` | S6 — an asynchronous or conceptual relationship |
   | Edge label text | Cross-check S8 — protocols, auth and technology names commonly ride here |

   Any node shape not listed above is still a component — extract the label and move on. Never drop a
   node because its shape is unfamiliar.

   **`sequenceDiagram`**:

   | Construct | Seeds |
   |---|---|
   | `participant X as Label`, `actor X` | S5 — a component (`actor` is an external actor) |
   | `A->>B: msg` (solid) | S6 — a synchronous call, in sequence order |
   | `A-->>B: msg` (dashed) | S6 — a synchronous **response**: a return value or acknowledgement, not a new call. Do not double-count it as a second integration |
   | `A-)B: msg`, `A--)B: msg` (open arrow) | S6 — an asynchronous message |
   | `alt` / `else`, `opt`, `loop`, `par` / `and` | S6 — branching, optionality, repetition and parallelism in the flow |

   Activation markers attach to the arrow, not the name: in `AuthService-->>-APIGW: token valid` the
   participant is `APIGW`, not `-APIGW`. Strip a leading/trailing `+` or `-` before matching a
   participant id.

   **Any other diagram type** (`erDiagram`, `classDiagram`, `stateDiagram`, `mindmap`, …) — accept the
   file, extract whatever entities and relationships are legible, and note in the confirmation that
   only partial structure was extracted. Never reject on diagram type.

   **Skip** — presentation and rendering directives that carry no design meaning:
   `%%{init: ...}%%` theme blocks, `title` lines, `classDef` / `class` / `style` / `linkStyle`
   statements, `autonumber`, `direction`, and comment lines beginning with `%%`.

   ⚠️ **The repo's own diagram conventions do NOT apply to an inbound HLD.** The four-role palette
   (`zone`/`unit`/`store`/`ext`), canonical component names from `component-cli.ts list`,
   the subgraph-ids-only edge rule for Diagram 1, and the Diagram ID / `SUBJ` rules are **output**
   rules governing what Workflow 8 *writes*. An HLD with node-to-node edges, unclassed nodes,
   ad-hoc ids, `LR` direction or abbreviated names is **valid input** and must be accepted as-is.
   Normalize to the house conventions later, when Step 7 generates the standard diagrams — never
   reject an architect's diagram at this gate for failing a generation rule.

5. **Add source attribution** everywhere HLD-derived content appears in `docs/**/*.md` during Step 5:
   ```
   <!-- HLD_SOURCE: [filename] -->
   ```

6. **Display confirmation**:
   ```
   ✅ HLD loaded: [filename] ([format])
      Will inform: S4 (Layers), S5 (Components), S6 (Data Flow)
   ```

7. **Record traceability metadata** (embed in `docs/01-system-overview.md` during Step 5):
   ```
   <!-- HLD_GATE: PASSED (ref: [filename], YYYY-MM-DD) -->
   <!-- HLD_SOURCE: [filename] -->
   <!-- HLD_FORMAT: mermaid | pdf | svg | png -->
   ```
   `mermaid` covers `.mmd`, `.mermaid` and `.md` alike — the exact extension is already recorded in
   `HLD_SOURCE`, so splitting the format axis further buys nothing.

**Conflict resolution**:

- HLD vs PO Spec → PO Spec wins for *business* context; HLD wins for *structural* layout (component decomposition, integration topology).
- HLD vs supplementary files (Step 0.5) → HLD wins (it is the design anchor).
- HLD internally inconsistent (e.g. components on the diagram with no labels, or arrows with no source/target) → flag the gap and ask the user to clarify before continuing.

**Format fidelity ladder** — what each format gives up, so the architect can choose knowingly:

- **Mermaid** (`.mmd`, `.mermaid`, `.md`) — highest fidelity. Components, groupings and connections are stated explicitly as nodes, `subgraph` bands and typed edges, so nothing is inferred. Prefer it whenever the HLD exists as, or can be written as, Mermaid.
- **PDF** and **high-res PNG** — the rendered drawing is visible, so spatial meaning survives (swimlane layouts, north-south vs east-west arrangement). Label extraction depends on resolution; for PNG, ≥1920px wide or ≥150 DPI.
- **SVG** — parsed as XML text: Claude reads labels, group hierarchy and arrow directions but does not "see" rendered visual positioning. For HLDs where positioning carries meaning, prefer PDF or high-res PNG.

Mermaid shares SVG's lack of rendered positioning, but not its ambiguity — SVG encodes a picture as absolute-positioned markup that structure must be inferred from, while Mermaid encodes the structure directly. The SVG caveat above does not extend to Mermaid.

---

#### Step 0.5: Supplementary Context Files (Optional)

After the PO Spec gate resolves (found, inline context provided, or skipped), prompt the user once for any additional context files that could enrich the architecture documentation.

Display the following message:

```
📎 **Supplementary Context (Optional)**

Before we start, do you have any existing documents that could inform the architecture?
Examples:

  📄  ADR files or decision logs
  🔧  Technology stack specs or tech radar
  🔌  API specifications (OpenAPI, AsyncAPI)
  🗄️  Data models or ER diagrams
  📊  Non-functional requirements or SLA documents
  🏗️  Infrastructure diagrams or IaC templates
  📝  Any other relevant design documents

You can provide:
  • File paths (e.g., `specs/openapi.yaml`, `adr/ADR-001.md`)
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
     | Tech stack, tech radar, versions | Technology Stack | S8 (Technology Stack) |
     | OpenAPI, Swagger, AsyncAPI specs | API Specification | S5 (Components), S7 (Integration Points) |
     | ER diagram, data model, schema | Data Model | S5 (Components), S6 (Data Flow) |
     | NFR, SLA, performance targets | Non-Functional Requirements | S10 (Scalability & Performance) |
     | Kubernetes, Terraform, IaC, infra | Infrastructure | S4 (Layers), S11 (Operational) |
     | Security policy, threat model | Security | S9 (Security Architecture) |
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

#### Step 0.6: Pre-Identify Architecture Decision Records (ADR Context Block)

**Trigger**: Immediately after PO Spec is loaded (Step 0.2 passes) and before architecture type selection.

**Objective**: Derive an initial ADR candidate list from PO Spec analysis. This list — the **ADR Context Block** — is carried through all subsequent steps to ensure every section references the same decisions with consistent rationale.

**Input sources** (already loaded in Step 0.2):
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
- **Do not assign ADR IDs at Step 0.6.** The `#` column is a row counter only. ADR IDs are computed at Step 6 (delegated to `architecture-definition-record`) per the ADR Scope Partition rule — **project ADRs start at 101**. **Never** invent IDs with phase / version / variant prefixes or suffixes (e.g., `ADR-P1-001`, `ADR-P2-002`, `ADR-Phase1-001`, `ADR-001-P1`, `ADR-101-v2`); they will be rejected by the **ADR ID Format Gate** in `architecture-definition-record/SKILL.md`. The 100+ range encodes project scope on its own — phase tracking in the ID is incorrect.

**Wait for user confirmation.** Adjust the list based on user feedback. The confirmed list becomes the **ADR Context Block** — a structured reference maintained through Steps 1–6.

**If PO Spec was skipped (SKIP PO SPEC)**: Present a minimal ADR Candidate Table with the universal decisions (architecture pattern, primary language, database, deployment platform) and ask the user to provide drivers inline.

**ADR Context Block format** (maintained in conversation context):

```
ADR CONTEXT BLOCK (confirmed at Step 0.6)
──────────────────────────────────────────
[Candidate 1] [Title]    | Driver: [source] | Status: PENDING
[Candidate 2] [Title]    | Driver: [source] | Status: PENDING
[Candidate 3] [Title]    | Driver: [source] | Status: PENDING
...
```

> Candidates carry **no ADR ID** until materialization. Workflow 1 Step 6 delegates to `architecture-definition-record`, which computes the next sequential number in the project scope (101+) and validates each ID against the ADR ID Format Gate before writing.

As decisions are made during Steps 1–5, update each candidate's status from `PENDING` to `DECIDED: [decision summary]` with the rationale captured in context. IDs (e.g., `ADR-101`, `ADR-102`) are assigned only at Step 6 — never during Steps 0.5 through 5.

---

#### Step 0.65: Institutional ADR Catalog Check

**Trigger**: Immediately after Step 0.6, before architecture type selection.

**Objective**: Guarantee that every institutional ADR (001–100) this architecture will cite resolves to a file inside the project. An institutional catalog kept outside the project is not a citation source — it is a dangling reference.

**Detection**:

1. Glob `adr/ADR-*.md` and partition by range: `institutional` (001–100), `project` (101+).
2. Collect institutional IDs referenced by the inputs already loaded — the PO Spec, any Step 0.5 supplementary context, and (on a re-run) `ARCHITECTURE.md` + `docs/`.
3. Classify:

| Condition | Severity | Action |
|---|---|---|
| Institutional IDs are cited, and one or more resolve to no file in `adr/` | **BLOCKING** | Name the unresolved IDs and go to *Resolution* below. Do not proceed to Step 1 with dangling institutional citations. |
| No institutional ADR files exist and none are cited yet | WARNING | Ask once whether the organization keeps an institutional catalog. If yes → *Resolution*. If the user confirms none exists → record and continue. |
| Institutional ADRs already present in `adr/` | PASS | Continue. |

**Resolution**: ask the user for the catalog directory and delegate to `architecture-definition-record` **Workflow 6 — Import Institutional ADR Catalog**. That workflow owns the copy, the range filter, the collision check and the link repair; this step only detects and routes. Never copy ADR files from here — `architecture-definition-record` is the only sanctioned writer for `adr/`.

**Why this is not merely tidiness**: with the catalog external, `institutional_numbers` is empty, so `architecture-definition-record` Step 2.1b computes the next institutional ADR as **ADR-001** and collides with the real one. Downstream, Layer 2 principle review, the compliance validators and traceability all resolve `per ADR-NNN` against `adr/` — with nothing there they silently fall back to whatever summary table the project happens to keep, and a lossy one-line summary produces confidently wrong findings.

**Skip conditions**: skipped when the PO Spec gate was skipped *and* no institutional IDs appear in any loaded input. Never skipped merely because `adr/` is empty.

---
