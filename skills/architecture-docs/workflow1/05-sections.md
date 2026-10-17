> Part of **Workflow 1 — Create** (`architecture-docs`). The router is `../ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md`: read this file when the run reaches its step, not before, and read the sibling files from the router's load map when the run reaches theirs. Step numbers are global across the parts.

#### Step 5: Create Multi-File Architecture Documentation

> Component files (`docs/components/**`): when the context7 MCP tool is configured, `references/CONTEXT7_ENRICHMENT.md` describes the advisory Technology Context Brief — load it only then.

Instead of creating a single `ARCHITECTURE.md`, create the full multi-file `docs/` structure.

> **CRITICAL**: Steps 4a–4g (C4 component structure, `workflow1/05-components.md`) are MANDATORY for ALL PO Spec paths (Option 1, 2, 3, or 4). The C4 system folder structure MUST be created regardless of how business context was provided. Do NOT skip system identification (4a–4c) or create flat component files without system subfolders.

> **CRITICAL — Documentation Language**: Every file written in this step is authored in the `doc_language` resolved at Step 0.1. That means headings, prose, table cell **contents**, diagram node labels, breadcrumbs and `EXPLORER_HEADER` **values**. It does **not** mean the machine layer — filenames, HTML-comment marker names and values, table column **headers**, `EXPLORER_HEADER` field **keys**, status enum values, requirement codes, Mermaid keywords, `classDef` role names, and the four `#### Diagram: …` headings all stay English (`references/LANGUAGE_POLICY.md` §4).
>
> **Every structural heading carries its English anchor comment, in both languages**:
>
> ```markdown
> ## 1. Executive Summary <!-- SECTION: Executive Summary -->      # doc_language: en
> ## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->       # doc_language: es
> ```
>
> Anchors are what every downstream gate, validator and gap-detector matches on — the visible text is for the reader only. The visible-name registry for both languages is `references/LANGUAGE_POLICY.md` §5.1 (13 sections), §5.2 (9 principles), §5.3 (recurring labels) and §5.4 (Section 6 mode headings). Step 5.7 fails the workflow on any unanchored structural heading.

**ADR Context Block consistency**: Reference the ADR Context Block (from Step 0.6) when writing each section. As decisions are made during section creation, update the corresponding ADR candidate from `PENDING` to `DECIDED` with the decision summary, the rationale and the section that resolved it — **in `.cache/sa-skills/adr-context.md`, with `Edit`**, not only in context: a checkpoint may follow, and the resumed session and Step 6 read the block from disk. This ensures:
- **Section 3 (Principles)**: Trade-offs align with ADR candidates — each principle's Implementation OR Trade-offs **MUST** contain at least one ADR reference (`[ADR-NNN](...)`, `per ADR-NNN`, or equivalent) **OR** the explicit `<!-- NO_ADR_GOVERNS -->` sentinel (also accepted as the visible blockquote `> No ADR governs this aspect yet`). Layer 1 (`PRINCIPLE_VALIDATION.md` rule `P-ADR-REF-01`) enforces this; Layer 2 (`principle-quality-reviewer`) flags overuse of the sentinel for explicit user confirmation.
- **Section 4 (Architecture Layers)**: References ADR for architecture pattern (decided at Step 2)
- **Section 8 (Technology Stack)**: Each technology choice resolves a technology-related ADR candidate
- **Section 9 (Security)**: References security/compliance ADR candidates
- **Section 12 (ADR Table)**: Populate directly from the ADR Context Block — all confirmed candidates become rows with their final status, drivers, and impact

**Payload per section (8.7.0+)** — before writing a section, run

```bash
bun [plugin_dir]/skills/architecture-docs/scripts/section-prepare.js <project_root> --section <N> \
  [--type <ARCH_TYPE>] [--lang en|es] [--po-spec <file>] [--hld <file>] [--adr-context <file>] [--full <NN,NN>]
```

and read `.cache/sa-skills/payloads/section-NN.md` **instead of the guide**. It carries, by code: the
guide's own block for that section (`## Section N:` by line range) plus the two rules every section
obeys (authoring budgets, explorer headers) and the visible-name registry row for the document
language; the type templates and references the section uses (S4, S5); the inputs the section takes
(for S1+2 the PO Spec cut by anchor to the sections `scripts/SECTION_MAP.json` names — 8.88.0: the whole spec made the S1 payload 146 KB on the reference, now 75 KB; `--po-spec-whole` restores it — its business-constraints section for S3, its outline otherwise; the
the capability alignment report for S1+2; the HLD verbatim when it is Mermaid; the ADR Context Block when saved with
`--adr-context`; the ADR index for S3, S4, S12); the section's parents per the Foundational Context
Anchor Protocol as outlines (H1, header, 30-second summary, headings) — `--full 01,02` inlines a
parent whole when a passage must be quoted; and the facts the section cites from `arch-facts.js`
(canonical container names, integrations, layers, ADR ids and statuses — with the decision in one line for every project ADR and every institutional one the ADR Context Block names, 8.88.1 — TDRs) as tables. The manifest
at the top lists what went in and what was **missing** — a parent not written yet, a PO Spec the gate
skipped, an HLD marker pointing at a file that moved — and the writer treats every missing item as
a gap to report, never as something to invent. Save the ADR Context Block from Step 0.6 to
`.cache/sa-skills/adr-context.md` so every payload after it carries it. **An input the payload carries is
not opened again**: the PO Spec, the capability alignment, the HLD, the ADR index and a parent's outline
reach the writer through the payload, and a second read of the same file in the main context is the
single most expensive habit a create can have (the controlled run of 8.8.0 re-read a 90 KB PO Spec
twice). When a passage is needed that the payload does not carry, read it by heading range with
`offset` / `limit`, never whole. Sections 6 to 13 come to
16–36 KB; S1 carries the PO Spec and S4 / S5 their templates, so they are larger by exactly those inputs.

**State comes from receipts, not from exploring (8.88.0).** What exists and what was decided is printed by
`create-progress.js`, `arch-facts.js --summary` and, after a checkpoint, `resume-prepare.js`; what a section
needs from the PO Spec, the ADRs and its parents is in its payload. Do not `ls` / `grep` / `sed` / `cat` the
project to rediscover it, and read instruction files with `Read`, never `cat`.

**Section writes, in this session, from the payload (8.31.0).** For each section in the
Creation Order below:

1. Run `section-prepare.js --section <N>` (above) — save the ADR Context Block first so the payload
   carries it — and `Read` the payload it wrote. **The payload is the whole of what you read for the
   section**: never the guide, never `VALIDATIONS.md`, never a parent whole. When the guide block
   requires a parent passage's content, `Read` that file by heading range (`offset` / `limit`), never
   whole, and never the PO Spec (its outline is in the payload; a fact the outline does not carry is
   a gap to mark, not a passage to fetch).
2. `Write` the section file — one write, complete, the EXPLORER_HEADER right after the H1, every
   heading with its English anchor, the content in the guide's order, a `<!-- TODO: Add source
   reference -->` marker wherever the payload had no fact. Carry the decisions the section resolved
   into the ADR Context Block (`PENDING` → `DECIDED`) and the names it introduced into item 4 (the
   component identification).
3. Run the gates on the file: `explorer-cli.ts check --file` (blocking) and `docs-stats.js`
   (WARNING); for `docs/02` the Section 3 Enforcement Gate as written below (Layer 1 by
   `principle-check.js`, Layer 2 through `principle-gate-prepare.js` and `principle-quality-reviewer`) —
   a finding is fixed by editing the file at the line named, then the gate re-runs (cap 3 rounds, then
   escalate). A rewrite of the whole file for a one-line finding regresses what already passed.
4. Re-run `arch-facts.js` (the ledger is derived from disk — the next payload reads the section
   just written as a parent outline and its facts as tables).
5. Mark it: `bun [plugin_dir]/skills/architecture-docs/scripts/create-progress.js <project_root> --done s<N>`
   (`s1`, `s13`, `s4`, `s5`, `s8`, `s3`, `s6`, `s7`, `s9`, `s10`, `s11`, `s12` for `docs/11`, `index` for
   `ARCHITECTURE.md`). When the receipt prints a `CHECKPOINT` (after `s5`, after `s6`, after `index`),
   display it and **stop**; the next session resumes from `workflow1/resume.md`. Never mark an item whose
   gates have not passed.

Through 8.30.0 this step delegated each section to a `section-generator` sub-agent. Measured on the
reference project (8.30.0, `scripts/session-cost.ts`): 18 calls of 20 turns each, 83 Reads and 81
`cat`/`sed` of the corpus across them, 2.06M tokens on the sidechains — the writers explored instead
of writing from their payload, and the whole run cost four times the in-session one. This skill
writes in session again; with automatic checkpoints a segment runs in a `segment-runner` sub-agent.

**Write order — the dependency order** (8.32.0; `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → "Foundational Context & Source Attribution Requirement" is the table): **S1+2 → S13 → S4 → S5 (component files, step 4 below) → S8 → S3 → S6 → S7 → S9 → S10 → S11 → `docs/11`**. Section 3 is written after the layers and the technology stack because its gate checks it against them; `docs/11` is written last because its header names components that must exist. The file list below is by file number, not by write order.

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
     - **Every principle heading carries its English `PRINCIPLE:` anchor** — `### 1. [Localized Name] <!-- PRINCIPLE: Separation of Concerns -->`. The anchor names above are the machine identity and are never translated; the visible name is authored in `doc_language` per `references/LANGUAGE_POLICY.md` §5.2. Validation matches the anchor, so ordering and completeness checks work identically in both languages.
     - Each principle MUST have three subsections, each carrying its English `LABEL:` anchor: **Description** `<!-- LABEL: Description -->`, **Implementation** `<!-- LABEL: Implementation -->` (system-specific, not generic), **Trade-offs** `<!-- LABEL: Trade-offs -->` (honest cost assessment)
     - Optional principle 10 (Decouple Through Events): include ONLY if async patterns are documented in the architecture
     - Populate Implementation and Trade-offs using: PO Spec Section 7 (Business Constraints), the layers of `docs/03` and the technologies of `docs/06` — both written before this file (8.32.0), so the vocabulary the gate checks is on disk, not guessed
     - **Document header**: Use `## Architecture Principles (9 Core Principles) <!-- SECTION: Architecture Principles -->` — or `(10 Core Principles)` if optional principle 10 is included. In Spanish: `## Principios de Arquitectura (9 Principios Fundamentales) <!-- SECTION: Architecture Principles -->`
     - Do NOT invent custom principles, omit any of the 9, or reorder them
     - **Section 3 Enforcement Gate (BLOCKING)**: After writing this file, run the two-layer validation pipeline (see `EDIT_WORKFLOW.md` → "Section 3 Enforcement Gate"):
       1. Layer 1 — `bun [plugin_dir]/skills/architecture-docs/scripts/principle-check.js <project_root>`: every rule of `PRINCIPLE_VALIDATION.md`, by code (8.31.1). Quote its receipt — the rule lines, the findings with their line numbers and the `LAYER1:` line — as the report; nothing is self-attested. Read `PRINCIPLE_VALIDATION.md` only to interpret a finding.
       2. Layer 2 — run `bun [plugin_dir]/skills/architecture-docs/scripts/principle-gate-prepare.js <project_root> --mode first-write --round <n>` and invoke `agents/reviewers/principle-quality-reviewer.md` with `.cache/sa-skills/payloads/principle-gate.md` as the prompt: the principles whole, the overview / layers / tech stack as the extracts the checks read (Key Metrics, Business Value, Problem and Solution; type and layer table; tech tables plus the descriptors' technologies), the ADR ids that exist. Never paste the four files whole.
       3. Both layers must return `status: PASS` (warnings allowed) before this section is considered finalized. On FAIL, fix each **BLOCKING** finding **at the line it names** (a phrase, a cost noun, a citation, a bullet) — warnings stay as they are, and no reason is attributed to an ADR that the ADR's text does not give — and re-run from Layer 1; regenerate the file only for a structural finding. Re-review as a repair round (8.118.7): save the review to `.cache/sa-skills/payloads/principle-review-round<n>.md` and run `principle-gate-prepare.js <project_root> --mode edit-delta --round <n+1> --prior <that file>` — the diff against the last reviewed version is computed by the script. Once Layer 2 passes, stamp it: `principle-check.js <project_root> --stamp-review PASS|WARNING` — the release check blocks without a current stamp. Cap at 3 rounds counted across both layers, then escalate to user. Do NOT proceed to the sections that cite the principles (S6 → S11) until S3 passes the gate.
       The advisory VALIDATIONS.md checklist (now described in `VALIDATIONS.md` → "Validator-Enforced Rules") documents what the gate enforces — it is no longer a separate manual step.
   - `docs/03-architecture-layers.md` — Section 4 (Architecture Layers, type-specific template)
   - `docs/04-data-flow-patterns.md` — Section 6 (Data Flow Patterns)
   - `docs/05-integration-points.md` — Section 7 (Integration Points) — gate: `integration-check.js <project_root>` (8.93.0; Protocol cells in the registered form, blocking; the Mermaid HLD's edges each a row or a stated departure)
   - `docs/06-technology-stack.md` — Section 8 (Technology Stack)
   - `docs/07-security-architecture.md` — Section 9 (Security Architecture)
   - `docs/08-scalability-and-performance.md` — Section 10 (Scalability & Performance)
   - `docs/09-operational-considerations.md` — Section 11 (Operational Considerations)
   - `docs/10-risks-and-technical-debt.md` — Section 13 (Risks and Technical Debt) — **MANDATORY**
     - Created from the Section 13 template in ARCHITECTURE_DOCUMENTATION_GUIDE.md → "Section 13: Risks and Technical Debt"
     - **Both summary tables are written empty** — header row and separator only, no example rows. A new architecture has no recorded TDRs, and an example `TDR-NNN` row is indistinguishable from a real one to every downstream reader
     - Populated over time by the `technical-debt-records` skill, which owns `tdr/` and writes the 13.2 summary row for each TDR it creates. This skill never writes TDR content here beyond the empty scaffold
     - Risks identified during Steps 0.2–0.6 (PO Spec constraints, HLD gaps, unresolved ADR candidates) MAY seed 13.1 rows; leave 13.1 empty when none were surfaced
   - `docs/11-references.md` — References: the link to `adr/README.md` (the derived ADR index — **never a per-ADR table here**), the applicable institutional ADR ids as one comma-separated line, project document links, in-scope BIAN specifications, technology documentation links, glossary. Budget 12 KB

4. **Section 5 — the component files (C4 L1 systems, L2 containers, the guardian's index)**: read
   `workflow1/05-components.md` when the run reaches item `s5` (8.88.0 — 10.7 KB a resumed segment that does
   not write Section 5 no longer loads).
5. **`ARCHITECTURE.md`, the type metadata and the closing checks of Step 5**: read `workflow1/05-index.md`
   when the run reaches item `index`.
