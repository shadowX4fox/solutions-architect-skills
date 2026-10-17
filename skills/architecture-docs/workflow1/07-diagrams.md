> Part of **Workflow 1 — Create** (`architecture-docs`). The router is `../ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md`: read this file when the run reaches its step, not before, and read the sibling files from the router's load map when the run reaches theirs. Step numbers are global across the parts.

#### Step 7: Mandatory Diagram Generation

**This step is not optional.** It always runs immediately after Step 6 completes (or is skipped). The two mandatory diagrams — High-Level Architecture and Data Flow — are generated now, before the workflow ends.

> **Why here**: `docs/03-architecture-layers.md` and `docs/04-data-flow-patterns.md` were just written in Step 5, so their content is fully in context. Generating diagrams now ensures a freshly created architecture is never delivered without its mandatory visual documentation.

---

##### Step 7.1: Generate Mandatory Diagrams

**Process**:

1. **The payload (8.89.1)** — everything the four diagrams are written from, cut by code:

   ```bash
   bun [plugin_dir]/skills/architecture-docs/scripts/diagram-prepare.js <project_root>
   ```

   `Read` `.cache/sa-skills/payloads/diagrams.md` once (~77 KB on the reference). It carries the requirements
   below and the Step 7.3 audit, the generation guide's sections for these four diagrams, the design standard's
   skeleton, canonical palette block and self-check in the document's language, the connection-label registry
   `label-check.js` enforces, the facts (systems, containers with layer, type and technology, layers,
   integrations), the Mermaid HLD, `docs/03`'s outline and the commands that check the write. **Do not** load
   `DIAGRAM-GENERATION-GUIDE.md`, `MERMAID_DIAGRAMS_GUIDE.md` or the design standard, do not read `docs/03`–`05`
   whole, and never read a check script's source — run it and read its output. The 8.89.0 control run's diagram
   sub-agent read all of those (~230 KB, 37 calls) and was the most expensive sub-agent of the run.
   **Automatic checkpoints**: dispatch this step to a `segment-runner` with `items: diagrams` (`workflow1/05-auto.md`)
   instead of writing it here; Step 7.2's question and the Step 7.3 audit stay in this session.
6. Determine architecture type from the `<!-- ARCHITECTURE_TYPE: ... -->` comment inserted in Step 4 (already known in context)
6.5. **Theme: nothing to detect, nothing to ask.** In governed mode — `[design_language_dir]` resolves (`bun [plugin_dir]/scripts/shared/packs.js --path design-language`) — the §9 palette directive is the palette of every block and `<!-- DIAGRAM_THEME -->` is neither read nor written. Only if the folder has been removed (fallback mode): honour an existing `<!-- DIAGRAM_THEME: light|dark -->` marker for Diagrams 2 and 3, and when there is none **default to light silently** and say so in the receipt. **Never ask the user which theme they use** — the question was retired in 8.29.1 (through 8.29.0 this step demanded it unconditionally while the generation guide's governance note forbade it, and the step file won).
7. Select grouping strategy and naming pattern from DIAGRAM-GENERATION-GUIDE's Architecture Type Adaptation table. **Colour is not selected** — Diagrams 1 and 4 emit the fixed four-role `zone` / `unit` / `store` / `ext` palette verbatim on every architecture type and in both themes; the detected theme applies only to Diagrams 2 and 3 and the sequence diagrams

**Generate all 4 standard diagrams** (in order, under `## Architecture Diagrams` in `docs/03-architecture-layers.md`):

**Diagram 1 — Logical View (Mermaid)**:
- Format: Mermaid `flowchart TB` — one `subgraph` band per group, edges between **band ids** only (never between component nodes)
- Source: `docs/03-architecture-layers.md` — extract all layers/tiers/groups and components
- Grouping: per Architecture Type Adaptation table (layers for ENTERPRISE/BIAN/N-Layer, tiers for 3-Tier, functional groups for Microservices)
- Palette: the fixed four-role `zone` / `unit` / `store` / `ext` palette from DIAGRAM-GENERATION-GUIDE → Diagram 1 § "Palette" — **not** Diagram 4's per-type colours, and no dark-theme variant
- Heading: `#### Diagram: Logical View`
- Include a `**Legend:**` block after it (bands, band-to-band edge meaning, the four role classes)
- **Migration**: if that heading already holds a pre-v4.3.0 ASCII block, replace the entire fenced block — never leave ASCII and Mermaid under one heading

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
- Palette: the same fixed four-role `zone` / `unit` / `store` / `ext` palette as Diagram 1, on every architecture type and with no dark variant — see DIAGRAM-GENERATION-GUIDE → Diagram 4 § "Palette". The retired per-type layer-role palettes (`channel`, `business`, `messaging`, `datastore`, …) must not survive a regeneration
- Shapes: cylinder `[( )]` for stores and caches, stadium `([ ])` for broker topics and queues, rectangle for everything else
- Heading: `#### Diagram: Detailed View`

**Generate Data Flow Diagrams** (separately, in `docs/04-data-flow-patterns.md`):

This rule is **mode-aware** — Section 6 has two authoring modes (see `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → Section 6 → "Mode selection"). Detect the mode by grepping the doc for the **English `SECTION:` anchor comments** `<!-- SECTION: Phase Catalog -->`, `<!-- SECTION: Flow Inventory -->`, and `<!-- SECTION: Use Case Resolutions -->` — never the visible heading text, which is localized (`references/LANGUAGE_POLICY.md` §5.4). If **any two** of those three are present, the doc is in **Phase Catalog mode**; otherwise it is in **Single-Flow mode**. For a legacy document written before anchors existed, fall back to the literal English H2 strings `## Phase Catalog`, `## Flow Inventory`, `## Use Case Resolutions`.

- See DIAGRAM-GENERATION-GUIDE → "Data Flow Diagrams — Sequence Diagrams" for the shared syntax reference and architecture conventions (sync `->>`, async `-)`, `alt/else/end`, `loop/end`, `par/and/end`).

**Phase Catalog mode** (default for new docs):
- **Every phase carries its `sequenceDiagram` (8.30.0 — inverts 8.2.0).** Each phase H4 carries a `**Hops**` line — the owner chain in call order — **and** one `sequenceDiagram` scoped strictly to that phase, numbered steps `1.`, `2.`, … in business intent (§12), its participants by canonical name. The phase panel is the **source** of every sequence in the document: `flow-compose.js` derives the end-to-end sequence of each flow by concatenating the panels of the phases the flow declares (steps relabelled `N.M`), and the handoff kit cuts the same panels into its Phase Catalog. Nobody draws an end-to-end sequence by hand. 8.2.0 made the panel optional to save bytes (a real corpus measured 62 KB of phase catalog against 11 KB of wire sequences); with the end-to-end derived instead of drawn, the panels are the only sequences anyone authors — a phase is drawn **once** and reused by every flow that runs it — and the corpus is smaller than when both were hand-written. A phase whose Purpose says it branches (`alt` / `par`) draws the branch in its own panel; the derived sequence carries it.
- **The end-to-end sequences are derived, not drawn (8.27.0).** After the Phase Catalog is written, run `bun [plugin_dir]/skills/architecture-docs/scripts/flow-compose.js <project_root>`: for every flow of the Flow Inventory it concatenates the panels of the phases the flow's `**Phases**:` line declares — participants unioned by display name, every numbered step relabelled `N.M` (phase N, the panel's own step M), returns carried as they are, the §9 palette directive once — and writes `§ End-to-End Wire Sequences` in place, marked `DERIVED`, one `#### Flow N — <name> (full wire sequence)` (`Flujo N — … (secuencia completa)`) per flow. Every message traces to a step of a panel; nothing is composed by anyone, so the two statements of a flow cannot disagree. A flow whose block declares no phases keeps a hand-authored sequence if one exists (the receipt says `KEPT`) and otherwise gets `[NOT DOCUMENTED — …]`; the fix is its `**Phases**:` line, never the section. A flow with no synchronous role in this domain declares no phases and carries a one-sentence clause plus its ADR — the composer keeps that block as it finds it. **Never hand-edit the section**: change the panel or the Phases line and re-run.
- Placement: each diagram lives **inside its corresponding phase or UC subsection**, not under a separate `## Diagrams` heading.

**Single-Flow mode** (legacy/simple fallback):
- Source: parse every `### [Flow Name] Flow` H3 subsection.
- For each H3 flow: generate one `sequenceDiagram` covering its participants and interactions.
- Placement: insert each diagram **immediately after its corresponding H3 subsection** in `docs/04-data-flow-patterns.md`. Heading: `#### Diagram: [Flow Name] Sequence`.

**Pre-Write Validation (MANDATORY)**:

Before writing any generated Mermaid/ZenUML diagram to its destination file, scan the code for forbidden patterns. See `references/DIAGRAM-GENERATION-GUIDE.md` → "Pre-Write Validation" for the full checklist. Critical patterns to catch:

- `<br/>`, `<br>`, or any HTML tag in labels → replace with `\n` or remove
- `;` (semicolon) in message/node/edge labels → replace with `,`
- Emoji characters in labels → remove
- `|` in node label text → replace with `/`

If any forbidden pattern is found, fix it and re-scan before writing. Do NOT write broken diagrams that will fail at render time. **After the write, run `bun [plugin_dir]/skills/architecture-docs/scripts/mermaid-check.js docs/03-architecture-layers.md docs/04-data-flow-patterns.md [<other file>]` — the same checklist as code plus a render through mermaid-cli when it is installed — and fix every block it names at the line it names before Step 7.2. A block that fails here exports as source, not as a picture.**

**Then run `bun [plugin_dir]/skills/architecture-docs/scripts/flow-compose.js <project_root>` and `flow-check.js <project_root>`.** `mermaid-check` asks whether each diagram is well formed; the composer writes the end-to-end sequences from the phases, and the check asks whether `docs/04` agrees with itself — after the composer it can only disagree where a flow declares no phases. A flow is written down twice — its block names the phases it runs, and § End-to-End Wire Sequences draws the whole flow as its *complete* sequence — and nothing held the two to each other until now. Fix every finding at the line named:

| Finding | What it means |
|---|---|
| `phase-absent` | the flow declares a phase its complete sequence does not contain. **Both readings are live**: the phase list may be long, or the sequence may stop short. Decide which, then fix that side — never silence the finding by editing the other |
| `sequence-missing` | a documented flow has no end-to-end sequence. The diagram policy is one per documented flow; write it |
| `flow-block-missing` | the Flow Inventory lists a flow whose block the ledger cannot pair by name. Unpaired, that flow has no phases, no delta and no governing ADRs, and every downstream artifact prints `Not documented` |
| `phases-undeclared` | the composition is prose instead of a `**Phases**: 1 → 2 → 4` line. The line is what the ledger reads; prose holding the same digits is invisible to it |

The warnings — `phase-hops-missing`, `phase-undrawn`, `phase-orphan`, `sequence-declared-absent` — are reported and do not block. A `docs/04` written before the Flow Inventory / Phase Catalog layout is skipped, never passed.

**Canonical location rule**: Same as Workflow 8 — placements above are not configurable and cannot be overridden.

---

##### Step 7.2: Offer Optional Diagrams

**Asked at Step 4.9** (8.118.8): `collect-save.js <project_root> --show` → `optional_diagrams`. A list (empty means
none) → generate those letters, ask nothing, and print the menu below with the choice marked. No list (a collection
saved before 8.118.8) → ask here.

After mandatory diagrams are written, present the optional diagram menu:

```
✅ Mandatory diagrams generated:
- Logical View → docs/03-architecture-layers.md
- C4 Level 1 — System Context → docs/03-architecture-layers.md
- C4 Level 2 — Container → docs/03-architecture-layers.md
- Detailed View → docs/03-architecture-layers.md
- Data Flow Diagrams (Phase Catalog mode: [U] full wire sequences, per-phase mini-flows only where justified | Single-Flow mode: [N] sequence diagrams) → docs/04-data-flow-patterns.md

**Additional Diagrams** (opt-in — select any or none):
A. Infrastructure & Deployment → docs/09-operational-considerations.md
B. High Availability & Failover → docs/08-scalability-and-performance.md
C. Performance & Scaling → docs/08-scalability-and-performance.md
D. Integration Diagrams → docs/05-integration-points.md
E. Security Architecture Diagrams → docs/07-security-architecture.md

Reply with letters (e.g., "A, C") or "None" to skip.
```

**Ask it with `AskUserQuestion`, and always offer none** (8.92.7 — the 8.92.6 control run asked one multi-select of four
diagrams, dropped C, and had no way to answer "none" but *Other*). The tool caps a question at four options, so ask
**two multi-select questions in one call**, each opening with its own *none* option:

| Question | Options |
|---|---|
| Operation (docs/08, docs/09) | **None** · A. Infrastructure & Deployment · B. High Availability & Failover · C. Performance & Scaling |
| Integration and security (docs/05, docs/07) | **None** · D. Integration Diagrams · E. Security Architecture Diagrams |

Labels in the document language (*Ninguno*, …). *None* beside a diagram in the same answer means the diagram. None in
both questions — or no diagram picked — skips generation and goes to Step 7.3.

Generate any selected optional diagrams using the same Workflow 8 Step 8 rules and canonical locations.

---

##### Step 7.3: Mandatory Diagram Completeness Audit (BLOCKING)

This is a **blocking gate** — Step 7.4 (Workflow Completion) cannot run until every mandatory diagram is verified present and well-formed. The workflow does **not** print `✅ Architecture creation complete` while any required diagram is missing or fails Pre-Write Validation.

Run the audit on all mandatory diagrams:

1. Use the content of `docs/03-architecture-layers.md` and `docs/04-data-flow-patterns.md` already in context from Step 7.1; re-read a file **only if Step 7.2 (or a previous audit round) wrote to it** since it was last read.
2. Verify `docs/03-architecture-layers.md` contains all 4 standard diagrams under `## Architecture Diagrams`:
   - **D1 — Logical View**: one `mermaid` block whose first statement is `flowchart TB` under heading `#### Diagram: Logical View`. **A residual ASCII block under this heading is a FAIL** — as of v4.3.0 the Logical View is Mermaid, and an un-migrated architecture must have the old block replaced, not supplemented
   - **D2 — C4 Level 1 — System Context**: one `mermaid` block under heading `#### Diagram: C4 Level 1 — System Context`
   - **D3 — C4 Level 2 — Container**: one `mermaid` block under heading `#### Diagram: C4 Level 2 — Container`
   - **D4 — Detailed View**: one `mermaid` block under heading `#### Diagram: Detailed View`
3. Verify `docs/04-data-flow-patterns.md` diagram coverage. The check is **mode-aware** — detect mode by grepping for the `SECTION:` anchor comments `<!-- SECTION: Phase Catalog -->`, `<!-- SECTION: Flow Inventory -->`, `<!-- SECTION: Use Case Resolutions -->` (legacy fallback: the literal English H2 strings); if any two are present, the doc is in **Phase Catalog mode**, otherwise **Single-Flow mode**.
   - **Phase Catalog mode**: count phase subsections under the `<!-- SECTION: Phase Catalog -->` heading (each phase block headed `Phase [N] — …` / `Fase [N] — …`, one level below the section — **the level is read from the document, never assumed**) → call this `P`. Then `bun [plugin_dir]/skills/architecture-docs/scripts/flow-compose.js <project_root> --check` MUST exit 0 — `§ End-to-End Wire Sequences` is the derivation of the catalog, so the gate is *is the file in sync with itself*, not a count — and `flow-check.js <project_root>` MUST report no finding. Every phase block carries a `**Hops**` line (flow-check warns `phase-hops-missing`); a per-phase `sequenceDiagram` is what the composer concatenates, so a phase with none leaves `[NOT DOCUMENTED — …]` in every flow that declares it.
   - **Single-Flow mode**: a `sequenceDiagram` block MUST appear within 30 lines below each `### [Flow Name] Flow` H3 subsection. The count of `sequenceDiagram` blocks MUST be ≥ the count of H3 flow subsections.
4. Run `bun [plugin_dir]/skills/architecture-docs/scripts/integration-check.js <project_root>` first (8.93.0) — the diagrams are drawn from docs/05, so a Protocol cell off the registered form or an HLD connection with no row reaches them; a protocol finding blocks the audit, an HLD departure goes to the Step 7.4 report by line. Then run `bun [plugin_dir]/skills/architecture-docs/scripts/mermaid-check.js docs/03-architecture-layers.md docs/04-data-flow-patterns.md [<other file>]` (and `label-check.js` on `docs/03`) — the receipt is the verification: for each Mermaid block (D1, D2, D3, D4, and every Data Flow sequence diagram), the Pre-Write Validation rules from Step 7.1 are satisfied — no `<br/>` / `<br>` / HTML tags in labels, no `;` in labels, no emoji, no `|` in node-label text. **A diagram that exists but fails Pre-Write Validation counts as MISSING for the purposes of this gate.**

**Audit outcome**:

- **PASS** — all 4 standard diagrams present in `docs/03-architecture-layers.md` AND `docs/04-data-flow-patterns.md` satisfies its mode-specific count (Phase Catalog: ≥ `U` wire-sequence `sequenceDiagram` blocks and a `**Hops**` line on every phase H4; Single-Flow: ≥ one diagram per H3 flow subsection) AND every Mermaid block passes Pre-Write Validation. Proceed to Step 7.4.
- **FAIL — first attempt**: regenerate the missing or invalid diagram(s) per Step 7.1 rules, then re-run this audit from item 1. Do NOT skip, do NOT defer, do NOT proceed to Step 7.4.
- **FAIL — after second regeneration attempt**: stop the workflow and emit:

  ```
  ❌ DIAGRAMS_GATE: FAILED

  The mandatory diagram audit could not be satisfied after two regeneration attempts.
  Missing or invalid:
    [- list each missing/invalid diagram by name + canonical location]

  The Architecture Type Selection Workflow cannot complete. Resolve the failure manually
  (consult `references/DIAGRAM-GENERATION-GUIDE.md` and `MERMAID_DIAGRAMS_GUIDE.md`),
  regenerate the affected diagram(s), and re-invoke `/skill architecture-docs` with the
  "audit diagrams" trigger to re-run this gate.

  Until DIAGRAMS_GATE passes, ARCHITECTURE.md is in a partial state and downstream
  skills (compliance, dev-handoff, analysis, release) MUST refuse to run on it.
  ```

**No `SKIP DIAGRAMS` override exists**. Unlike the PO Spec Gate at Step 0.2 (which permits `SKIP PO SPEC` for projects with no Product Owner artifact), every architecture must ship with its mandatory diagrams — they are a delivered artifact of the creation workflow, not a soft prerequisite.

---

##### Step 7.3b: Pending TDRs (8.92.7)

A create can cite a technical debt record before any exists — a principle or an ADR writes "the waiver is pending,
TDR-001" — and nothing asked for it (the 8.92.6 control run left three citations of TDR-001 with no `tdr/`). By code:

```bash
bun [plugin_dir]/plugins/sa-records/skills/technical-debt-records/scripts/tdr-check.js <project_root> --pending   # optional: technical-debt-records; without it, skip the offer
```

It lists every `TDR-NNN` that `ARCHITECTURE.md`, `docs/**` or `adr/**` cites with no record in `tdr/`, with the lines
that cite it, the sentences that promise a TDR without an id, and the next free id. Nothing listed → Step 7.4.

Otherwise **always ask** (`AskUserQuestion`, one question): create these N TDRs now — naming each id and its subject in
a few words from the citing lines — or not now. On *create*, invoke `/skill sa-records:technical-debt-records` (12 KB,
at the end of the run) and run its **Create** workflow once per pending id, **keeping the cited id** so the citations
resolve; a promise without an id takes the next free id and its sentence gets the id by `Edit`. The citing lines are
the record's source; a field they do not state (Owner, Driver) is a question to the user, never a placeholder. Then
`tdr-check.js <project_root>` exits 0 and `--pending` lists nothing. On *not now*, Step 7.4 lists them as pending.

##### Step 7.4: Workflow Completion

```
✅ Architecture creation complete.

**Structure created**:
- docs/ with [N] section files
- docs/components/ with [N] component files + README.md
- ARCHITECTURE.md navigation index
[- adr/ with [N] ADR files]  ← only if Step 6 generated ADRs
[- tdr/ with [N] TDR files]  ← only if Step 7.3b created TDRs
[- ⚠️ Pending TDRs: [ids] — cited, not created]  ← only if the user answered not now

**Diagrams generated**:
- ✅ Logical View → docs/03-architecture-layers.md [REQUIRED]
- ✅ C4 Level 1 — System Context → docs/03-architecture-layers.md [REQUIRED]
- ✅ C4 Level 2 — Container → docs/03-architecture-layers.md [REQUIRED]
- ✅ Detailed View → docs/03-architecture-layers.md [REQUIRED]
- ✅ Data Flow Diagrams ([N]) → docs/04-data-flow-patterns.md [REQUIRED]
[- ✅ [Optional diagram name] → [file]]  ← only if user opted in

All diagrams follow canonical location enforcement (Workflow 8 policy).

**route**: in-session (architecture-docs Step 5 — every section written in this session from its payload; Layer 2 by `principle-quality-reviewer`; [R] Section 3 repair rounds)
         | in-session with segment runners (automatic checkpoints — [N] segment-runner dispatches, [R] repair rounds)
```

The `route` line is not optional and not a courtesy: a run measured afterwards with `scripts/session-cost.ts`
must be able to say what it measured. State the repair rounds the gates triggered.

Then `create-progress.js <project_root> --done 7` — the receipt reads `the create is complete`.

**Return to main workflow**: Architecture Type Selection Workflow completes successfully

---

**End of Step 7**

### Detecting Existing Architecture Type

When editing an existing ARCHITECTURE.md, detect the architecture type:

**Detection Method 1: Metadata Comment**
```bash
rg -n "<!-- ARCHITECTURE_TYPE:" ARCHITECTURE.md
```

If found, extract the type from the comment.

**Detection Method 2: Section 4 Header Analysis**

If no metadata comment, infer from Section 4 headers:

```bash
# Check for BIAN indicators (check FIRST - most specific)
rg "(Layer 2: BIAN Business Scenarios|Layer 4: BIAN Service Domains)" ARCHITECTURE.md

# Check for ENTERPRISE indicators
rg "(Layer 1: Channels|Layer 3: Process|Layer 5: Systems of Record)" ARCHITECTURE.md

# Check for 3-Tier indicators
rg "(Tier 1: Presentation|Tier 3: Data)" ARCHITECTURE.md

# Check for Microservices indicators
rg "(API Gateway|Service Mesh|Microservices Catalog)" ARCHITECTURE.md

# Check for N-Layer indicators
rg "(Clean Architecture|Hexagonal|Ports & Adapters)" ARCHITECTURE.md
```

**Inference Rules (in order of specificity):**
- Contains "Layer 2: BIAN Business Scenarios" OR "Layer 4: BIAN Service Domains" → **BIAN**
- Contains "Layer 1: Channels" AND "Layer 3: Process" AND "Layer 5: Systems of Record" (or Canales, Procesos, Sistemas de Registro) → **ENTERPRISE**
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
   - Replace Section 4 content (`docs/03-architecture-layers.md`)
   - Replace Section 5 content (`docs/components/**/*.md` — delegate structural changes to `architecture-component-guardian`)
   - Update the `<!-- ARCHITECTURE_TYPE: -->` metadata comment
   - Report changes to user

4. **If user declines:**
   - Cancel operation
   - Suggest manual editing approach
