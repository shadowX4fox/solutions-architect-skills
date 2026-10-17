# Edit Workflow — Context Anchor, Post-Write Audit and Downstream Propagation

> Workflow 2 of `architecture-docs`. Loaded when an existing `docs/` file is edited (`SKILL.md` → "Workflow 2"). It carries the Foundational Context Anchor Protocol, the Section 3 Enforcement Gate, the Post-Write Alignment Audit (Checks A–F), Step 5.5 Downstream Documentation Propagation with its Phase 1.5 Principle Alignment Audit, and the navigation-index rules. Workflow 1 (`ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md`) points here for the Section 3 gate it runs at first write.

**Read-once rule**: every project file named below is read at most once per run. A file already in context is reused; it is re-read only after this workflow has written to it. Verify an `Edit` by grepping the edited anchor, not by re-reading the file.

---

## Working with Architecture Documentation — Context Optimization

**IMPORTANT**: The multi-file structure makes context loading simple — individual `docs/` files are 50–400 lines each (full file fits in context). No line-offset tricks needed.

### Context-Efficient Workflow

0. **Facts first — never reopen a document to remember a name or an id.** Run
   `bun [plugin_dir]/skills/architecture-docs/scripts/arch-facts.js <project_root>` once per run; it writes
   `.cache/sa-skills/facts.json` and prints the counts. Everything a propagation, a citation or an
   index check needs is a `--section` away, at no model cost: `components` (canonical names, slugs,
   systems, types, technologies, internal names, versions, last-updated), `adrs` and `tdrs` (ids,
   titles, status, scope), `integrations` (the `I-nn` rows), `phases` and `flows` (the docs/04
   catalogs), `layers`, `diagrams`, `releases`, `docs` (titles, header fields, bytes). Open a document
   only to edit it or to quote its prose. When the ledger and a document disagree, the document wins
   and the ledger is stale — re-run the script after every write.

1. **Find the target section**
   - Read `ARCHITECTURE.md` navigation table to identify which `docs/NN-name.md` file contains the target section
   - Example: "Edit security architecture" → navigate to `docs/07-security-architecture.md`

2. **Load Context Anchor** *(REQUIRED for downstream sections)*
   - **Section 3 Enforcement Gate** (BLOCKING — runs on every write to `docs/02-architecture-principles.md`):
     1. **Layer 1 — Prescriptive checklist**. Run `bun [plugin_dir]/skills/architecture-docs/scripts/principle-check.js <project_root>` — every rule of `skills/architecture-docs/PRINCIPLE_VALIDATION.md`, by code (8.31.1); quote its receipt verbatim as the report (the anti-self-attestation is the script's output, not a rg the model reran). A finding names the principle, the subsection and the line — fix it by editing at that line, never by regenerating the file for a one-line finding. Emit the `PRINCIPLE_VALIDATION_REPORT` block at the end with the script's findings. If any BLOCKING finding, regenerate `docs/02-architecture-principles.md` per the recommendations and re-run from rule 1. Increment round counter.
     2. **Layer 2 — Semantic review**. Run `bun [plugin_dir]/skills/architecture-docs/scripts/principle-gate-prepare.js <project_root> --mode <first-write|edit-delta> --round <n> [--diff <file>]` and invoke `agents/reviewers/principle-quality-reviewer.md` with `.cache/sa-skills/payloads/principle-gate.md` as the prompt — it carries `mode`, `round`, `arch_type` (from the `<!-- ARCHITECTURE_TYPE: -->` marker), the paths, the diff, and the five blocks (`<principles>` whole; overview, layers and tech stack as the extracts the checks read; the ADR ids that exist). Never paste the four files whole. If `status: FAIL` with BLOCKING findings, fix those findings at their lines (warnings stay; no reason attributed to an ADR its text does not give) and re-run from Layer 1; the re-review is `--mode edit-delta --round <n+1> --prior <the saved review>`, the diff computed against the last reviewed version (8.118.7). Record the outcome in the report's mandatory `layer2:` field — see the report schema in `PRINCIPLE_VALIDATION.md`. **Stamp it**: on `layer2: PASS` or `WARNING`, run `bun [plugin_dir]/skills/architecture-docs/scripts/principle-check.js <project_root> --stamp-review PASS|WARNING` — it writes `<!-- PRINCIPLE_REVIEW: … sha256:… -->` as the file's last line, held to the principles' hash; the release check (`architecture-lifecycle`) blocks without a current stamp. Never stamp `SUPPRESSED`, `FAIL` or `NOT_REACHED`, and never write the stamp by hand.
     3. **Round-3 escalation**. After 3 failed rounds across both layers (counted together), STOP. Show the user all 3 rounds' reports side by side and ask: "Three revision rounds have not produced a passing principles document. Pick: (a) edit further manually, (b) accept the current version with the listed findings (explicit override), or (c) abort the workflow." Do NOT silently accept.
     4. **Layer 2 availability clauses**. *Invoked and failed* and *never invoked* are different outcomes and MUST NOT collapse into one:
        - **Invoked, but returns empty / errors / times out** → treat as PASS-with-warning ("manual review required"); record `layer2: WARNING`. Do not block forever on tool failure.
        - **Could not be invoked at all** — suppressed by a session-level policy (e.g. a standing instruction not to spawn sub-agents), the agent is not registered, or `Agent(sa-skills:reviewers:principle-quality-reviewer)` was denied → **this is NOT a fail-open**. Record `layer2: SUPPRESSED`, state plainly in the user-facing summary that a BLOCKING gate did not run, and name the remedy (grant the permission, or have the user request the review explicitly). A suppressed gate MUST NOT be reported as a pass, and MUST NOT be silently absorbed into the clause above — that clause presupposes the agent ran.
        - **Layer 2 never reached** — Layer 1 returned FAIL, or the workflow aborted earlier → record `layer2: NOT_REACHED`.
     5. **Fail-closed clause**:
        - If Layer 1 rg tools are unavailable (`rg: command not found`): treat as fail-closed → escalate immediately. The user fixes the environment or overrides.
   - **SKIP** the Context Anchor load below when editing `docs/01-system-overview.md` only, or for typo/formatting-only fixes
   - For edits to `docs/02-architecture-principles.md`: load `docs/01-system-overview.md`, `docs/03-architecture-layers.md`, `docs/06-technology-stack.md`, and the ADR index BEFORE editing — the Section 3 Enforcement Gate above runs after the edit
   - **REQUIRED** when editing any file from `docs/03-architecture-layers.md` through `docs/09-operational-considerations.md`, or any `docs/components/*.md` file
   - **Universal Foundation**: Always load `docs/01-system-overview.md` + `docs/02-architecture-principles.md`
   - **Relevant ADRs**: Match ADR titles from `ARCHITECTURE.md` navigation table against target section keywords; load matched ADRs
   - **Section-Specific Parents**: Load parent sections per the Foundational Context Anchor Protocol dependency table (`ARCHITECTURE_DOCUMENTATION_GUIDE.md` → "Foundational Context Anchor Protocol")
   - Example for S9 (Security): load S1+2 (foundation) + S5/README (components) + S7 (integrations) + S8 (tech stack) + relevant ADRs
   - Context budget: 250–850 lines depending on section tier

3. **Read the entire target file**
   - Individual `docs/` files are small enough to read in full
   - `Read(file_path="docs/07-security-architecture.md")`  — no offset/limit needed

3.5. **Confirm the change (BLOCKING — the edit runs without plan mode)**
   Nothing is written before the user approves it — except, in a RUN-team project past its first release (`bun [plugin_dir]/scripts/shared/support.js <project_root>` prints `Tier 0`), a wording, typo or link fix that changes no fact, when nothing is in doubt: it is written and reported. A crossed escalation trigger (the script lists them) writes nothing to the architecture: it becomes an escalation record and, after the user's yes, an issue on the git host (`escalate.js`, the project CLAUDE.md § RUN teams), then stop.
   - **Doubts first.** Anything the request leaves open — which file or section, which value, which component (by canonical name), whether a figure in S1 Key Metrics moves with it, how far the change reaches — is asked with `AskUserQuestion`, every doubt in one call, each with the options the documents support. Never resolve a doubt by guessing.
   - **The change set.** Show, per file, the lines before → after (a new block in full), the downstream files Step 5.5 will offer (the Reverse Dependency Table row), and the principles and ADRs the change bears on; then one approval question (approve · revise). A revision is shown again and asked again.
   - **Only what was approved is written.** A gate or audit finding on the approved lines (Section 3 gate, Checks A–I) is fixed at its line and reported when the fix keeps their meaning; a fix that changes a value or meaning, touches another line, or adds a file is asked first. Downstream files keep Phase 2's own approval.

4. **Edit the target file directly**
   - Use the Edit tool on the specific `docs/NN-name.md` file — **surgically**: the number of tokens used to edit a file is best minimized, so when it will not affect the end result, edit at the lines that change rather than rewrite the file. A `Write` of the whole document is for a file that does not exist yet or whose greater part changes; for anything else it costs the output tokens of the whole file and regresses what already passed (8.31.1: a rewritten principle lost the cost noun its gate had accepted)
   - **Do NOT edit ARCHITECTURE.md** unless you are adding a new section/file to the navigation table
   - **Source Attribution** *(during editing)*: When writing derived content in downstream sections, insert cross-reference links to the source:
     - **Metrics**: When repeating a metric from S1 Key Metrics → `(see [Key Metrics](01-system-overview.md#key-metrics))`
     - **ADR decisions**: When content implements an ADR → `per [ADR-NNN](../adr/ADR-NNN-title.md)`
     - **Principles**: When invoking an S3 principle → `per [Principle Name](02-architecture-principles.md#anchor)`
     - **Parent section references**: When referencing components, layers, integrations, or tech → link to the specific file
     - **Unverifiable claims**: If a specific claim (metric, decision, constraint) cannot be traced to an existing section, user input, or ADR → insert `<!-- TODO: Add source reference -->` marker

5. **Post-Write Alignment & Traceability Audit**
   - **Check A — Principle traceability**: Written content does not contradict Section 3 principles
   - **Check B — Metric consistency**: Numeric values match Section 1 Key Metrics
   - **Check C — ADR alignment**: Content does not contradict loaded ADR decisions
   - **Check D — Parent section alignment**: Content references valid components (S5), integrations (S7), tech (S8) as loaded
   - **Check E — Source citation audit**: Scan the written content for:
     - Numeric values (TPS, latency, SLO, %) → must link to S1 Key Metrics or be marked as section-local
     - Technology names matching S8 → should link to tech stack or governing ADR
     - Architecture pattern references → should link to S3 or S4
     - `<!-- TODO: Add source reference -->` markers → count and report
   - **Check F — Prose style**: `bun [plugin_dir]/skills/architecture-docs/scripts/prose-check.js <project_root> --scope edit --file <edited file>` — `PROSE_VALIDATION.md` as code, Groups 1, 2 and 6 only (length, form and density are not re-litigated for a document you did not restructure). Quote its report line; exit 1 is a FAIL. The judgement rules of Group 6 go to the judge in force — under the default `agent` engine their candidates are undecided until the `sa-skills:reviewers:worksheet-judge` subagent answers the worksheet the report names and the same command runs again (8.119.0); under `typesafe` or `clef` they are answered in the run, every dismissal printed. Read the rulebook only for the fix text of a rule the report names.
   - **Check G — Size budget**: `bun [plugin_dir]/skills/architecture-docs/scripts/docs-stats.js <project_root> --file <edited file>`; print the findings. Byte budgets never block; a shape budget (principle, risk cell, integration block, descriptor) blocks once the project is stamped, and its fix is to move the argument to the ADR it cites (`ARCHITECTURE_DOCUMENTATION_GUIDE.md` → "Authoring budgets"). A `changelog-unreleased` finding means `[Unreleased]` has outgrown its budget: add one line to the Phase 4 report — "`docs/CHANGELOG.md` [Unreleased] is {N} KB: a release is waiting (release my architecture)" — and keep the entry you add one line.
   - **Check H — EXPLORER_HEADER contract (BLOCKING)**: when the edited file is a `docs/NN-*.md` or `docs/components/**/*.md`, run `bun [plugin_dir]/skills/architecture-explorer-headers/utils/explorer-cli.ts check <project_root> --file <edited file>`; an error (unknown key, missing required field, header after the first `##`, a `components` or `related_adrs` entry with no file, `component_self` not the slug) is fixed before the edit is reported done. An edit that added a component or an ADR reference updates the header in the same Edit — the check is what notices when it did not. BLOCKING findings are template boilerplate, filler, meta-narration, hedges, marketing register and first/second person — all literal strings. Regenerate the offending sentence and re-run; cap 3 rounds.
   - **Check I — Code identifiers in English (WARNING)**: when the edited file is `docs/04`, `docs/05`, `docs/08` or a `docs/components/**/*.md`, run `bun [plugin_dir]/scripts/shared/identifier-check.js <project_root> --file <edited file>`. A path, field, schema, enum value, topic, table or key prefix the edit wrote in Spanish is renamed to English in the same edit (`LANGUAGE_POLICY.md` §4 — the handoff assets copy identifiers verbatim); prose stays in the document language. On `PENDING` the session is the judge: answer the worksheet the note names (one `1` / `0` per item — is this identifier Spanish?) into the answers file it names, then re-run with `--answers`; under `SA_JUDGE=typesafe` Jev answers and nothing is pending. Never blocks.
   - **Silent pass** if no issues found; display alignment report **only when misalignment, missing citations, or prose findings are detected**

5.5. **Downstream Documentation Propagation**

Runs immediately after the Post-Write Alignment Audit passes. Detects downstream files whose content may be stale due to the edit and offers to update them.

#### Trigger Gate

**Run when**: The edit changed substantive content — metrics, technology names, component names, architectural patterns, constraints, requirements, or interface definitions.

**Skip silently when**: The edit was cosmetic — typo fixes, formatting, grammar, markdown structure, comment updates, `<!-- TODO -->` markers, or source attribution links. Heuristic: if the diff contains only whitespace/punctuation/link/formatting changes with no word-level changes to technical terms, skip entirely.

**Anti-recursion rule**: Propagation updates (Phase 3 edits) do NOT re-trigger Step 5.5.

#### Reverse Dependency Table

| Edited Section | File | Downstream Section Files |
|---|---|---|
| S1+S2 (System Overview) | `docs/01-system-overview.md` | ALL sections (S4–S11) + `docs/components/*` |
| S3 (Principles) | `docs/02-architecture-principles.md` | S6–S11 (`docs/04` … `docs/09`) — the sections that cite the principles; S4, S5 and S8 are written before S3 (8.32.0) and do not read it |
| S4 (Layers) | `docs/03-architecture-layers.md` | S5 (`docs/components/*`), S8 (`docs/06-technology-stack.md`), S3 (`docs/02-architecture-principles.md` — the type matrix reads its layer vocabulary), S6 (`docs/04-data-flow-patterns.md`), S7 (`docs/05-integration-points.md`) |
| S5 (Components) | `docs/components/*.md` | S6 (`docs/04-data-flow-patterns.md`), S7 (`docs/05-integration-points.md`), S8 (`docs/06-technology-stack.md`), S9 (`docs/07-security-architecture.md`), S10 (`docs/08-scalability-and-performance.md`), S11 (`docs/09-operational-considerations.md`), Refs (`docs/11-references.md`), **+ S3 semantic re-check** (Phase 1.5 — invoke `principle-quality-reviewer` in `mode: downstream-impact` with `downstream_file = docs/02-architecture-principles.md`; flag any principle whose Implementation/Trade-offs the new component contradicts) |
| S6 (Data Flow) | `docs/04-data-flow-patterns.md` | *(leaf — no downstream sections)* |
| S7 (Integration) | `docs/05-integration-points.md` | S9 (`docs/07-security-architecture.md`) |
| S8 (Tech Stack) | `docs/06-technology-stack.md` | S3 (`docs/02-architecture-principles.md` — `P-SPECIFIC-01` reads its technology names), S9 (`docs/07-security-architecture.md`), S10 (`docs/08-scalability-and-performance.md`), S11 (`docs/09-operational-considerations.md`), Refs (`docs/11-references.md`) |
| S9 (Security) | `docs/07-security-architecture.md` | *(leaf)* |
| S10 (Scalability) | `docs/08-scalability-and-performance.md` | S11 (`docs/09-operational-considerations.md`) |
| S11 (Operations) | `docs/09-operational-considerations.md` | *(leaf)* |
| S12 (ADRs) | `ARCHITECTURE.md` (navigation table) | `adr/` directory → delegate to `/skill architecture-definition-record`, Refs (`docs/11-references.md`) |
| S13 (Risks & Technical Debt) | `docs/10-risks-and-technical-debt.md` | *(leaf — full TDRs live at `/tdr/` and are managed by the `technical-debt-records` skill)* |

**Cross-cutting** (always scanned regardless of table): `docs/components/`, `handoffs/`, `docs/11-references.md`

##### References file (`docs/11-references.md`) propagation

`docs/11-references.md` is a cross-cutting file that aggregates links from multiple sections. It MUST be included in the downstream scan when **any** of these change:

| Change Type | What to update in `11-references.md` |
|---|---|
| ADR added, removed, renamed, or status changed (`adr/*.md`) | Nothing per ADR — `adr/README.md` is the derived index and `architecture-definition-record` regenerates it; verify `docs/11` still links it and drop any per-ADR table it carries |
| New technology in S5 components or S8 tech stack | Technology documentation links — add official doc URL |
| Technology removed or replaced | Technology documentation links — remove or replace entry |
| New glossary-worthy term introduced in any section | Glossary — add definition |

When `11-references.md` is flagged for update during Phase 2 (Generate Checklist), present specific sub-items showing which table(s) need updating (technology links, glossary, the `adr/README.md` link).

#### S12 ADR Table Propagation (Special Rule)

When the edited file is `ARCHITECTURE.md` **and** the edit added or modified rows in the Section 12 ADR table:

1. **Detect new ADR rows**: Compare the ADR table before and after the edit. Extract any new rows matching `| [ADR-NNN](...) | ... |`
2. **Check for existing files**: For each new ADR row, check if `adr/ADR-NNN-slug.md` already exists
3. **Delegate creation**: For ADR rows where the file does NOT exist, invoke `/skill architecture-definition-record` with context:
   - Trigger reason: "Section 12 ADR table updated — generate ADR files for new entries"
   - Pass the ADR metadata (number, title, status, date, impact) from the table row
   - The architecture-definition-record skill runs Workflow 1 Steps 1.3–1.5 (extract → load template → generate)
4. **Skip if file exists**: If the ADR file already exists, do not overwrite — report: `adr/ADR-NNN-slug.md already exists — skipped`

After ADR file creation (or skip), verify `docs/11-references.md` links `adr/README.md` (the derived index the ADR skill regenerates) and carries no per-ADR table; the institutional ADR ids in scope stay one comma-separated line.

This rule runs **instead of** the standard Phase 1–3 propagation for S12 changes. ADR table changes do not trigger downstream section updates — they trigger ADR file creation and references update.

#### Phase 1: Impact Discovery

**1a. Fact-delta extraction** — Compare the file content before and after the edit. Produce a concrete bullet list of what changed (e.g., "Database: PostgreSQL → CockroachDB", "Added: Redis caching layer", "Removed: legacy SOAP endpoint"). If zero substantive deltas → skip propagation entirely.

**1b. Structural dependency scan** — Look up the edited section in the reverse dependency table above. Collect all downstream section files.

**1c. Cross-reference scan** — Grep across `docs/`, `docs/components/`, `handoffs/` for explicit references to the edited filename (links, section anchors, `(see [...](...))`).

```bash
rg -lF "{edited_filename}" docs/ docs/components/ handoffs/ 2>/dev/null
```

**1d. Handoff scan** — For each fact-delta keyword (component names, technology names, pattern names), rg `handoffs/` for matching terms.

**1e. Merge and deduplicate** — Combine results from 1b+1c+1d. Remove duplicates and remove the edited file itself.

#### Phase 1.5: Principle Alignment Audit (S3 edits only)

Runs **only** when the edited file is `docs/02-architecture-principles.md` AND Phase 1a's fact-delta extraction reported substantive word-level changes in any of {Description, Implementation, Trade-offs} subsections.

**Trigger gate** — skip Phase 1.5 silently when:
- The diff contains only whitespace, punctuation, link reformatting, or markdown structure changes (no word-level changes inside D/I/T blocks).
- The Section 3 Enforcement Gate above failed and the principles file was regenerated wholesale (the regenerated file is treated as a first-write, not an edit, and the orchestrator already re-ran the gate).
- Phase 1a's diff is empty (no substantive changes detected).

**Audit procedure** when the gate fires:

1. **Extract per-principle deltas** from the diff. For each principle that changed, capture:
   - `principleNumber`, `principleName`
   - Which subsection(s) changed (Description / Implementation / Trade-offs)
   - A 1-line summary of the change (what was added, removed, or rephrased)
   - **Token set for pruning** — derived from the *raw* added/removed lines of the changed subsections (not from the 1-line summary). Build a single de-duplicated set containing:
     - **Principle names** — the `principleName` of every changed principle.
     - **ADR IDs** — every `ADR-NNN` token (regex `ADR-\d{3}`) that appears in either the before-text or the after-text of changed Description / Implementation / Trade-offs subsections.
     - **Affected tech tokens** — every named tech term that appears on an added or removed diff line AND is enumerated in `docs/06-technology-stack.md` (i.e., a tech this system actually uses). Intersecting with the tech stack avoids matching English words that happen to be tech-name-shaped. Compare case-insensitive on whole-token boundaries.

   This token set powers the pruning step below; if the set ends up empty (e.g., the diff only rephrased Description prose with no concrete principle names, ADR IDs, or system-tech tokens) the fall-back is conservative — fan out to all candidates without pruning.

2. **Pre-fan-out pruning** — Token-grep each candidate downstream file against the token set from step 1 to drop files with zero references to anything that changed. The median S3 edit touches one principle's Implementation, so most downstream files do not mention the changed content; a cheap structural rg skips guaranteed `NO_IMPACT` verdicts.

   **Candidate set** = the reverse dependency files for S3 (S4–S11 + every `docs/components/**/*.md` listed in `docs/components/README.md`).

   **Pruning rule (per candidate file):**
   - If the token set from step 1 is empty → KEEP the file (conservative: nothing concrete to rg against; fall through to fan-out).
   - Else, run a single composite case-insensitive rg over the file using a regex alternation of every token in the set (escape regex metacharacters in principle names; whole-line match is fine — we only need a hit/no-hit signal). Examples:
     ```bash
     rg -li 'Principle Name 1|Principle Name 4|ADR-005|ADR-012|Spring Boot|PostgreSQL|Redis' \
       docs/03-architecture-layers.md docs/04-data-flow-patterns.md \
       docs/05-integration-points.md docs/06-technology-stack.md \
       docs/07-security-architecture.md docs/08-scalability-and-performance.md \
       docs/09-operational-considerations.md docs/components/*.md
     ```
   - File path emitted by rg → KEEP for the fan-out in step 3.
   - File NOT emitted → SKIP. Record one Phase 2 note for the user:
     ```
     ℹ️  {file} — no token references to changed principles, cited ADRs, or affected tech; semantic review skipped (Phase 1.5 pruning).
     ```

   **Empty kept-set after pruning** — when zero candidate files token-match (and the token set was non-empty, so the prune was real), emit one consolidated Phase 2 note ("Principle Alignment Audit: no downstream files reference any of the changed principles, cited ADRs, or affected tech — nothing to review.") and skip steps 3–6 of this Audit procedure. Phase 2 still runs with the structural impact list from Phase 1b–1d.

   **Fail-open** — if `grep` is unavailable or returns an unexpected error, emit a one-line Phase 2 warning ("Phase 1.5 pruning unavailable; fanned out to the full candidate set") and fall through to step 3 with all candidates kept. Pruning is an optimization, not a gate.

   **Why this is recall-safe** — the token set includes principle names AND cited ADR IDs AND affected tech, all three. Most "implicit contradiction" cases (a downstream file paraphrases a principle without naming it) still surface because the file usually mentions either the cited ADR or the affected tech. The conservative empty-set fallback covers the long tail (pure prose changes with no concrete tokens).

3. **Fan out to `principle-quality-reviewer`** in `mode: downstream-impact`. The orchestrator MUST construct the sub-agent prompt using the **stable-prefix → dynamic-suffix template** below so parallel calls in the same batch share the maximum cacheable prefix (Anthropic prompt cache hits on byte-identical prefixes within the 5-min TTL).

   **Read-once foundational context.** Before dispatching any sub-agent in this fan-out, run `bun [plugin_dir]/skills/architecture-docs/scripts/principle-gate-prepare.js <project_root> --mode downstream-impact --round <n> --diff <deltas file>` **once**: it writes the whole stable prefix below to `.cache/sa-skills/payloads/principle-gate.md`, with the overview, layers and tech-stack blocks as extracts (the orchestrator reads none of the four files). The five blocks are byte-identical across every sub-agent call in the fan-out, so inlining them lets calls 2..N hit the prompt cache for the entire prefix instead of each agent re-Reading the same files independently:

   - `docs/02-architecture-principles.md` (post-edit) → `<principles>` block
   - `docs/01-system-overview.md` → `<system_overview>` block
   - `docs/03-architecture-layers.md` → `<arch_layers>` block
   - `docs/06-technology-stack.md` → `<tech_stack>` block
   - `Glob('adr/*.md')` ID list (one `ADR-NNN` per line, sorted) → `<adr_index>` block (the IDs alone — bodies are not needed for existence checks)

   **Prompt template** — positional, order must not change. Lines above the marker are stable across the batch; only `downstream_file` (last line) differs per call:

   ```
   mode: downstream-impact
   round: <int>
   arch_type: <MICROSERVICES|ENTERPRISE|BIAN|3-TIER|N-LAYER|unknown>
   principles_file: docs/02-architecture-principles.md
   principles_diff: |
     <per-principle deltas from step 1, identical for every call in this batch>

   <principles>
   {full content of docs/02-architecture-principles.md (post-edit)}
   </principles>

   <system_overview>
   {extract of docs/01-system-overview.md: H1, header, summary, Key Metrics, Business Value, Problem Statement, Solution, heading outline}
   </system_overview>

   <arch_layers>
   {extract of docs/03-architecture-layers.md: H1, header, summary, ARCHITECTURE_TYPE, the layer table, heading outline}
   </arch_layers>

   <tech_stack>
   {extract of docs/06-technology-stack.md: H1, header, summary, every table, the descriptors' technologies, heading outline}
   </tech_stack>

   <adr_index>
   {one ADR-NNN id per line, sorted}
   </adr_index>

   # === Stable prefix ends here. Only the line below differs per call. ===

   downstream_file: {absolute path to the specific downstream file under audit}
   ```

   The agent's Step 1 consumes the five inlined blocks directly — it does NOT re-Read the four foundational files when the blocks are present. See `agents/reviewers/principle-quality-reviewer.md` Step 1 (Inlined-blocks fast path) for the consumption contract.

   **Why the order matters**: Anthropic's prompt cache is a prefix matcher. Any per-call discriminator above the marker would split the cache and force every parallel call to be a cache miss. Keep `downstream_file` as the LAST line; keep `principles_diff` and the five inlined blocks above it; keep them in the order shown so all calls in the batch share a byte-identical prefix.

   **Backward compatibility**: when running the reviewer outside this orchestrator (e.g., direct invocation, older callers), the agent still accepts path-only inputs and falls back to `Read` — the four files by path and `adr/README.md` for the ADR set (`Read` is its only tool since 8.47.1). The path parameters (`system_overview_file`, `arch_layers_file`, `tech_stack_file`, `adr_index_glob`) remain in the prompt as fallback values; they are ignored when the inlined blocks are present.

   **Parallelism**: dispatch in batches of 4. Wait for each batch before starting the next.

   **Cache-warm sequencing (first batch only)**: in the FIRST batch of any Phase 1.5 fan-out, fire **one** sub-agent call first and wait for its response to settle before firing the remaining 1–3 calls in parallel. The first call's response writes the byte-identical stable prefix (the five inlined blocks above) into Anthropic's prompt cache; the remaining calls in that batch — and every call in every subsequent batch within the 5-min cache TTL — read the prefix from cache instead of re-paying it. After the first batch completes, dispatch subsequent batches normally (full parallel of 4); the cache is already warm.

   The latency cost is one extra serialized call (~30–60s) paid only on the first batch of each Phase 1.5 fan-out. For typical S3 edits where step 2 pruning leaves 2–4 candidate files, this adds < 1 minute of wall-clock time. For wider fan-outs (8+ files post-pruning) the savings compound across batches because each non-first batch hits cache for the full prefix instead of re-writing it.

4. **Aggregate results** — each sub-agent returns one of:
   - `status: PASS` with `findings: []` and a finding `checkType: downstream-impact, severity: NO_IMPACT` → file unaffected; no action.
   - `status: PASS` with `WARNING` findings → surface in Phase 2 checklist as `[principle-impact]` items but don't block.
   - `status: FAIL` with `BLOCKING` findings → file contradicts a changed principle; surface in Phase 2 checklist as `[principle-impact-BLOCKING]` items requiring user review.

5. **Fail-open clauses**:
   - Sub-agent timeout / empty / error on any single file: skip that file with a Phase 2 warning ("`{file}` — principle alignment review unavailable; manual review required"). Do not block.
   - All sub-agents fail (e.g., system-wide tool outage): emit one warning at the top of Phase 2 ("Principle Alignment Audit unavailable; downstream files not semantically re-checked.") and proceed to standard Phase 2 with structural impacts only.

6. **Inject findings into Phase 2 checklist** — semantic findings appear as a dedicated subsection labeled "Principle Alignment Findings" between the structural impact list and the "Approve all?" prompt. Pruning notes from step 2 (skipped files) appear in the same subsection under a "Skipped (no token references)" sub-heading so the user retains visibility into what was deliberately not reviewed. User can approve / deselect / skip per file (same UX as structural impacts).

**Anti-recursion**: Phase 1.5 sub-agent calls do NOT trigger another Phase 1.5 invocation when their findings translate into Phase 3 edits.

#### Phase 2: Generate Checklist

Present a structured checklist grouped by file type:

```
═══════════════════════════════════════════════════════════
DOWNSTREAM UPDATES REQUIRED — {edited_file} ({section_name})
═══════════════════════════════════════════════════════════

Changes detected:
- {bullet list from Phase 1a}

─── Downstream Sections ──────────────────────────────────
[ ] 1. docs/07-security-architecture.md — references {changed_tech}; security controls may need updating
[ ] 2. docs/09-operational-considerations.md — mentions {old_value}; align with new value

─── Component Files ──────────────────────────────────────
[ ] 3. docs/components/03-payment-service.md — uses {changed_component}; integration details may be stale

─── Handoff Docs ─────────────────────────────────────────
[ ] 4. handoffs/03-payment-service-handoff.md — Section 4 references {old_tech}

─── No Updates Required ──────────────────────────────────
ℹ️  docs/04-data-flow-patterns.md — no references to changed content
═══════════════════════════════════════════════════════════
Approve all? ('all', comma-separated numbers to deselect, or 'skip')
```

Wait for user response before proceeding.

#### Phase 3: Execute Updates

Process approved files **in tier order** (lower tiers first → higher tiers last) so each updated file is available as context for files that depend on it.

For each approved `docs/*.md` or `docs/components/*.md` file:
1. Load Context Anchor (universal foundation + section-specific parents per the dependency table)
2. Read the target file in full
3. Identify passages affected by the fact-deltas
4. Apply updates, maintaining Source Attribution links (`per [Section X](../...)`)
6. Run the 6-check Post-Write Alignment Audit on the updated file
6. Mark as `[x]`

For approved `handoffs/*.md` files: Read, locate affected passages, update following the dev-handoff Documentation Fidelity Policy. Mark as `[x]`.

If user selected `skip`: Add `<!-- PROPAGATION PENDING: upstream {edited_file} changed ({date}) — downstream not yet updated -->` comment at the top of the edited file.

#### Component File Edit Handling

When the edited file is `docs/components/*.md` (not a section file):
- Cascade through S5's row in the table (S6, S7, S8, S9, S10, S11)
- Additionally rg for the **component name** (not just filename) across all `docs/` files
- Always include the matching `handoffs/{component}-handoff.md` if it exists
- If `docs/components/README.md` needs updating, delegate to the `architecture-component-guardian` skill

#### Phase 4: Propagation Report

```
═══════════════════════════════════════════════════════════
DOWNSTREAM PROPAGATION — COMPLETION REPORT
═══════════════════════════════════════════════════════════

Source: {edited_file} ({section_name})
Changes: {summary from Phase 1a}

Completed:
[x] docs/07-security-architecture.md — {what was updated}
[x] docs/components/03-payment-service.md — {what was updated}

Verified (no change needed):
✓  docs/08-scalability-and-performance.md — content still accurate

Deselected (manual update required):
[ ] docs/09-operational-considerations.md — user chose manual update

Failed (require manual review):
⚠️  {any files where edit could not be applied cleanly}

PO Spec: {when the edited file is docs/01, docs/04, docs/05, docs/07 or docs/08, or an ADR changed status — "the business requirements read this section; run \"update the PO spec\" (architecture-readiness Workflow 6) when the change is one the Product Owner must hold"; otherwise omit}
═══════════════════════════════════════════════════════════
```

#### Phase 4.5: Command center refresh (scripts, no model tokens)

When `visualizations/architecture-command-center.scene.json` (or a dated `architecture-command-center-*.scene.json` from before 8.150.0) exists and Phase 3 wrote at least one file, rebuild the dossier and re-render the page so Alia answers from the edited corpus — the newest scene, in place:

```bash
S=$(ls -t visualizations/architecture-command-center*.scene.json | head -1)
bun [plugin_dir]/plugins/sa-visualization/skills/architecture-command-center/scripts/dossier.js . "$S" --write   # optional: architecture-command-center
bun [plugin_dir]/plugins/sa-visualization/skills/architecture-command-center/scripts/render.js "$S" "${S%.scene.json}.html"   # optional: architecture-command-center
```

Skip silently when no scene exists; a structural change — a container added or removed, a flow changed — is a `command center` run, not a refresh.

#### Phase 5: Asset Regeneration Advisory

**Runs after**: Phase 4 report is displayed.
**Also runs when**: User selected `skip` in Phase 2 and handoff files exist in `handoffs/` — in this case, note that handoff text was also not updated.

**Skip silently when**: No `handoffs/*.md` files appeared in the Phase 3 update list (completed, deselected, or failed) AND propagation was not skipped.

Load `references/ASSET_REGENERATION_ADVISORY.md` and follow it (Steps 5a–5c; fact-deltas come from Phase 1a).

---

6. **Verification**
   - After edits, re-read the modified `docs/` file to verify changes
   - Use Grep to search for specific content without loading multiple files

### Discovering Available Files

When the target section is not obvious, read `ARCHITECTURE.md` first:

```python
# Step 1: Read navigation table
nav_content = Read(file_path="ARCHITECTURE.md")

# Step 2: Parse the Documentation table to find the target file
# Example row: | 8 | Security Architecture | [docs/07-security-architecture.md](docs/07-security-architecture.md) | ... |

# Step 3: Read that specific docs/ file in full
target_content = Read(file_path="docs/07-security-architecture.md")
```

### Updating the Navigation Index

Update `ARCHITECTURE.md` only when:
- A new section file is added to `docs/`
- A new component file is added to `docs/components/`
- A file is renamed or removed

**Do NOT update ARCHITECTURE.md** for content edits within existing `docs/` files.

---
