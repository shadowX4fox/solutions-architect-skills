---
name: architecture-definition-record
description: >
  Create, update, and manage Architecture Decision Records (ADRs).
  Single point of entry for all ADR write operations: generate from
  ARCHITECTURE.md Section 12 table, create individual ADRs interactively,
  update status, and supersede existing decisions. All other skills
  delegate here for any ADR modification — reading adr/*.md for context
  is still permitted directly.
triggers:
  - ADR
  - architecture decision
  - decision record
  - create ADR
  - new ADR
  - update ADR
  - supersede ADR
  - decision log
  - architectural decision
---

# Architecture Definition Record Skill

## Purpose

This skill is the **single owner of all ADR write operations**. It creates, updates, and manages Architecture Decision Records (ADRs) — immutable documents that capture the context, rationale, and consequences of significant architectural choices.

**Other skills read `adr/*.md` directly** for context loading, compliance, review, and export. They must **delegate here** when they need to create or modify any ADR file.

---

## When to Invoke This Skill

- User asks to create a new ADR or document an architectural decision
- User asks to update an ADR's status (Accepted, Deprecated, Rejected)
- User asks to supersede an existing decision with a new one
- User asks to list, audit, or review the ADR inventory
- User says: "add an ADR for…", "document this decision as an ADR", "mark ADR-XXX as accepted"
- Another skill triggers ADR file generation (e.g., after ARCHITECTURE.md creation)
- Use `/skill architecture-definition-record`

**Do NOT invoke for:**
- Reading ADRs as editing context → read `adr/*.md` directly
- Exporting ADRs to Word → use `architecture-docs-export` skill
- Reviewing ADR quality → use `architecture-peer-review` skill
- Referencing ADRs in compliance → compliance agents read `adr/README.md` directly

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — entry point and all workflows |
| `ADR_GUIDE.md` | Comprehensive guide: template structure, best practices, status lifecycle, comparison table standards |
| `adr/ADR-000-template.md` | Canonical ADR template — 10 sections, usage guide, file naming convention |

---

## Canonical Template Rule (ALL Workflows)

Every ADR file written by this skill MUST use the full 10-section canonical template from:
```
[plugin_dir]/skills/architecture-definition-record/adr/ADR-000-template.md
```

**No workflow may write an ADR file without first loading this template.** If the template cannot be loaded, the workflow MUST abort with:
```
TEMPLATE LOAD FAILURE: Could not load ADR-000-template.md. ADR generation aborted.
```

This applies to Workflows 1, 2, and 4. There are no exceptions.

---

## Pre-flight: Session-Edit Check (v3.14.1+)

Before any workflow that gathers architecture context for ADR creation or supersession (Workflows 2 and 4), run the EXPLORER_HEADER session-edit pre-flight (identical across every doc-consuming sa-skills skill). ADR creation reads architecture sections to ground the decision; stale EXPLORER_HEADERs mislead the architecture-explorer's classification of which sections to load.

```bash
bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts session-log count --project-root <project_root>
```

- **Output `0`** → editlog is clean. Proceed directly to the workflow.
- **Output `N > 0`** → run `... session-log list --project-root <project_root>`, then emit a loud preamble before the workflow's first prompt:

  ```
  ⚠ N docs were edited this session; their EXPLORER_HEADERs may be stale.
    Affected:
      - <path-1>
      - …
    ACTION REQUIRED before this ADR's context can be trusted:
      → Run: /regenerate-explorer-headers --session
  ```

  Continue running the workflow (non-blocking). Add a freshness note in the ADR's "Context" section indicating which architecture docs were edited but not yet re-classified by the explorer.

Workflow 1 (the bulk ADR generation from `ARCHITECTURE.md` Section 12) and Workflow 3 (status updates / listing) do not need the pre-flight — Workflow 1 reads `ARCHITECTURE.md` directly (always exempt from EXPLORER_HEADER tracking) and Workflow 3 is metadata-only.

## Workflows

### Workflow 1 — Generate ADRs from ARCHITECTURE.md Section 12 Table

**Trigger**: Called by `architecture-docs` after ARCHITECTURE.md creation, after Section 12 ADR table updates, or by user explicitly.

**Objective**: Extract the ADR table from ARCHITECTURE.md and generate `adr/ADR-XXX-title.md` files.

#### Step 1.0: Present ADR Generation Prompt

After ARCHITECTURE.md is created, display:

```
✅ Architecture documentation created successfully!

═══════════════════════════════════════════════════════════
📋 Architecture Decision Records (ADRs) Setup
═══════════════════════════════════════════════════════════

Your ARCHITECTURE.md includes an ADR table. I can automatically generate
ADR files using the standard template.

Would you like me to generate the ADR files now?

1. [Yes - Generate ADRs] - Create all ADR files listed in the table
2. [Preview First]       - Show me which ADRs will be created
3. [No Thanks]           - I'll create them manually later
4. [Learn More]          - Tell me about ADRs and the template

Recommended: Option 1 (Generate ADRs) - Saves time and ensures consistency
```

**Wait for user response.**

#### Step 1.1: Handle User Selection

- **Option 1 (Yes)** → Step 1.2
- **Option 2 (Preview)** → Step 1.2, then show preview, re-prompt yes/no
- **Option 3 (No)** → Show skip message with manual instructions
- **Option 4 (Learn More)** → Show ADR overview from `ADR_GUIDE.md`, re-prompt

#### Step 1.2: Locate ADR Table

Read `ARCHITECTURE.md` in full and parse the ADR table:

```bash
grep -E "^\| \[ADR-" ARCHITECTURE.md
```

**If no ADR table found:**
```
⚠️  ADR table not found in ARCHITECTURE.md
Options:
1. [Add ADR Table]       - Add the ADR section to ARCHITECTURE.md
2. [Skip ADR Generation] - Continue without generating ADRs
3. [Manual Review]       - Let me check the navigation index first
```

#### Step 1.3: Extract ADR List

For each line matching `^\| \[ADR-`:
1. Extract ADR number (e.g., `001`)
2. Extract file path (e.g., `adr/ADR-001-name.md`)
3. Extract slug from file path (or generate from title)
4. Extract title, status, date, impact
5. Extract Scope if a Scope column is present (see scope handling below)

**Regex:**
```
^\| \[ADR-(\d{3})\]\(adr\/ADR-\d{3}(-[a-z0-9-]+)?\.md\) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|
```

**Validate**: Check for duplicate ADR numbers — warn and halt if found.

**Scope handling — two cases:**

**Case A — Section 12 table has an explicit `Scope` column:**

Extract the Scope value from each row (`Institutional` or `User`). Validate that:
- Institutional rows use numbers 001–100
- User rows use numbers 101+

If mismatched (e.g., a "User" row with number 042), warn before generating:
```
⚠️  ADR-042 is labeled "User" but uses an institutional number (001–100).
    Options:
      1. [Reclassify to Institutional] — keep number 042, set Scope=Institutional
      2. [Renumber]                    — assign next available User slot (ADR-{next_user})
      3. [Keep as-is]                  — not recommended (breaks scope partition)
```

**Case B — Section 12 table has no `Scope` column (legacy / existing projects):**

Infer scope from the ADR number range: 001–100 → Institutional, 101+ → User.

Before writing any files, present an inferred-scope confirmation:
```
═══════════════════════════════════════════════════════════
INFERRED SCOPES (no Scope column in ARCHITECTURE.md Section 12)
═══════════════════════════════════════════════════════════
  ADR-001  [Title]   → Institutional  (number in range 001–100)
  ADR-002  [Title]   → Institutional  (number in range 001–100)
  ADR-101  [Title]   → User           (number ≥ 101)
═══════════════════════════════════════════════════════════
Proceed with these inferred scopes?  [all / specify overrides (e.g. 001=User) / cancel]
```

User can override individual ADRs before generation proceeds.

**If empty table:**
```
ℹ️  ADR table is empty. This is normal for newly created ARCHITECTURE.md files.
Create ADRs as architectural decisions are made using Workflow 2 (Create Individual ADR).
```

#### Step 1.4: Load Template

Resolve plugin directory and load the canonical template:

```bash
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1)
Read(file_path="$PLUGIN_DIR/skills/architecture-definition-record/adr/ADR-000-template.md")
```

Store template content in memory for reuse across all ADR files.

#### Step 1.5: Generate Each ADR File

> **CRITICAL**: Use the **full canonical template** (all 10 sections). Do NOT produce abbreviated stubs with empty body sections. Every section for which architecture documentation provides relevant context MUST be populated. Only Implementation Plan and Success Metrics may remain as optional stubs.

> **Institutional content discipline**: When generating any ADR with `Scope: Institutional` (numbers 001–100), apply the rules in `ADR_GUIDE.md § Institutional ADR Content Discipline` — no "Institutional Inheritance Note", no "Project Application" sections, no component/operator/budget/timeline specifics, no cross-refs to ADR-101+. If source material from `ARCHITECTURE.md` contains those specifics, generalize them in the institutional ADR (and optionally retain the specifics in a paired User/Project ADR).

For each ADR in the list:

**Generate file path:**
- Slug from table path if present, else generate from title (lowercase, hyphens, strip special chars, max 50 chars)
- Placeholder title `[Title]` → slug `untitled`

**Check for existing file (never auto-overwrite):**
```
⚠️  ADR file conflict: adr/ADR-001-old-title.md already exists
1. [Skip This ADR]   - Keep existing file
2. [Rename New ADR]  - Create as ADR-{next_available}
3. [Overwrite]       - Replace existing (destructive)
4. [Review Existing] - Show me what's in the existing file first
```

**Load relevant architecture docs for this ADR** — before populating, identify which `docs/` files are relevant based on the ADR title/topic:

| ADR Topic Keywords | Architecture Files to Load |
|---|---|
| database, storage, data, persistence | `docs/04-data-flow-patterns.md`, `docs/06-technology-stack.md` |
| API, protocol, REST, gRPC, HTTP | `docs/05-integration-points.md`, `docs/06-technology-stack.md` |
| security, auth, encryption, identity | `docs/07-security-architecture.md` |
| scaling, performance, cache, latency | `docs/08-scalability-and-performance.md` |
| deployment, infrastructure, cloud | `docs/09-operational-considerations.md`, `docs/06-technology-stack.md` |
| framework, language, runtime, library | `docs/06-technology-stack.md` |
| architecture pattern, layer, structure | `docs/03-architecture-layers.md` |
| messaging, events, queue, stream, kafka | `docs/04-data-flow-patterns.md`, `docs/05-integration-points.md` |

Always also read `ARCHITECTURE.md` (navigation index) and `docs/02-architecture-principles.md` for every ADR — they provide universal context (constraints, principles, design drivers).

**Populate template — section by section from architecture documentation:**

| Template Section | How to populate |
|---|---|
| **Header metadata** | ADR number, title from table, status, date, authors: "Architecture Team" |
| **`**Scope**` field** | Case A: from the Scope column in Section 12 table; Case B: from inferred range (confirmed by user in Step 1.3) |
| **Context → Problem Statement** | Infer from ADR title + relevant docs — why did this decision need to be made? What gap or requirement prompted it? |
| **Context → Functional Requirements** | Extract from the relevant docs/ section — what the system must do that drives this decision |
| **Context → Non-Functional Requirements** | From S3 (principles) + S10 (scalability) + S9 (security) as applicable |
| **Context → Constraints** | From S3 principles and S8 tech stack constraints |
| **Context → Business Drivers** | From S1+S2 system overview — business goals that made this decision necessary |
| **Decision → Summary** | The chosen approach stated in the ADR title (e.g., "Use PostgreSQL as the primary relational database") |
| **Decision → Detailed Decision** | From the relevant architecture section — the specific technology/pattern/approach and how it is used |
| **Decision → Scope** | What is included in this decision; what is explicitly excluded |
| **Rationale → Primary Drivers** | From architecture principles (S3) and design drivers — why this choice satisfies the requirements; include quantitative evidence from architecture docs where available |
| **Rationale → Comparison Summary table** | Build a real comparison table with actual data from architecture docs — **never use placeholder rows**; include at least 3 evaluation criteria with the chosen option and at least one rejected alternative |
| **Consequences → Positive** | Benefits the decision delivers, mapped to architecture goals |
| **Consequences → Negative** | Trade-offs and costs accepted; mitigation strategy for each |
| **Consequences → Trade-offs** | What was gained vs. what was given up |
| **Alternatives Considered** | Extract alternatives from architecture context (tech stack alternatives, pattern alternatives); for each: what it is, why it was considered, why it was rejected |
| **Implementation Plan** | Mark as `[OPTIONAL — populate during implementation planning]` |
| **Success Metrics** | Mark as `[OPTIONAL — populate during implementation planning]` |
| **References** | Cite architecture docs sections used: e.g., `docs/06-technology-stack.md`, `docs/03-architecture-layers.md`; add any external references if known |

If the ADR title is a placeholder (`[Title]`, `[title]`, `Title`), add at the top:
```
> **TODO**: Auto-generated with placeholder title. Update title, filename, and all sections with the actual architectural decision.
```

**Step 1.5a — Length Validation Gate (BLOCKING)**: Before the file is written, verify both length constraints from `ADR_GUIDE.md § Title and Problem Statement Length Constraints`:

1. **Title length** — extract the text after `# ADR-NNN: ` from the populated H1 line and count characters. Must be ≤ 50.
2. **Problem Statement length** — extract the body between `### Problem Statement` and the next `### ` (or `---`) heading, strip any HTML comments, trim whitespace, and count characters. Must be ≤ 200.

```bash
# Title check (in-memory before write):
title_text="<populated title>"
[ ${#title_text} -le 50 ] || echo "FAIL P1: title is ${#title_text} chars (>50)"

# Problem Statement check (in-memory before write):
ps_body="<populated Problem Statement body, comments stripped, trimmed>"
[ ${#ps_body} -le 200 ] || echo "FAIL P2: Problem Statement is ${#ps_body} chars (>200)"
```

On any FAIL: revise the field per the guide ("drop weak words, prefer single concrete nouns" for titles; "compress to one tight sentence, move requirements to `### Requirements`" for Problem Statement) and re-run the gate. Cap at 3 revision rounds. Round 4 → escalate to user with the actual lengths and current text; ask whether to split the ADR into sub-decisions (the recommended fix when content genuinely cannot fit).

**No waiver mechanism**: if the decision cannot fit, split it into multiple ADRs.

**Write file** and report: `✅ Created: adr/ADR-001-technology-stack.md`

#### Step 1.6: Summary Report

```
✅ ADR Generation Complete
Generated {N} of {total} ADR files in ./adr/

Created: [list]
Skipped: [list with reason]
Failed:  [list with error]

Next steps:
1. Review and refine populated sections — verify accuracy against your intent
2. Strengthen the comparison table with benchmark data, POC results, or vendor metrics
3. Add Implementation Plan and Success Metrics when implementation planning begins
4. Update status to "Accepted" once reviewed and approved by the architecture team
5. Link related ADRs in the "Related" field
```

---

### Workflow 2 — Create Individual ADR (Interactive)

**Trigger**: User asks to create a new ADR for a specific decision.

**Objective**: Guided interview → writes a complete `adr/ADR-XXX-title.md`.

#### Step 2.1: Determine Scope and Next ADR Number

**Step 2.1a — Ask scope** (default = User/Project):

```
Is this an Institutional or User/Project ADR?

  1. [User / Project]  (default) — decision local to this project → numbered 101+
  2. [Institutional]             — organization-wide Architecture Team decision → numbered 001–100
```

If the user does not explicitly choose, default to **User / Project**.

**Step 2.1b — Compute next number for the chosen scope**:

For each existing `adr/ADR-*.md` file, read its `**Scope**` header line. Partition into:
- `institutional_numbers` = numbers from files with `**Scope**: Institutional`
- `user_numbers` = numbers from files with `**Scope**: User`, **plus** legacy ADR files with no `**Scope**` field whose number is ≥ 101 (legacy files with no scope field and number ≤ 100 are treated as institutional by default)

**For Institutional scope:**
```
next = max(n for n in institutional_numbers where n ≤ 100) + 1
```
- If no institutional ADRs exist → `next = 1`
- If `next > 100` (range full) → **abort** with:
  ```
  ⚠️  Institutional ADR range (001–100) is full ({count} institutional ADRs).

  Options:
    1. Supersede an existing institutional ADR (use Workflow 4)
    2. Reclassify this decision as User/Project (next User slot: ADR-{user_next})
    3. Cancel
  ```

**For User/Project scope:**
```
next = max(n for n in user_numbers where n ≥ 101) + 1
```
- If no user ADRs exist → `next = 101`

**Step 2.1c — Collision guard**: if a file named `adr/ADR-{NNN}-*.md` already exists for the computed `next` (edge case from manual renames), increment until a free slot is found and report:
```
ℹ️  ADR-{computed} already exists. Next available {scope} number: ADR-{actual}.
```

#### Step 2.2: Gather Decision Information

> **Note**: Carry the scope selected in Step 2.1a forward — it will be written as the `**Scope**` field in the ADR header.

Ask the user (can be answered in one message or iteratively):

```
Creating ADR-{NNN}. Please provide:

1. Decision title (brief, descriptive):
   e.g., "Use PostgreSQL as primary database"

2. What problem does this decision solve?
   (1-2 sentences)

3. What was decided?
   (The chosen approach in 1 paragraph)

4. Why was this approach chosen over alternatives?
   (Key drivers, ideally with specific data/metrics)

5. What alternatives were considered and why rejected?
   (List each with reason rejected)

6. What are the main trade-offs?
   (What you gained vs. what you gave up)

7. Initial status:
   [Proposed] (default) | Accepted | Rejected
```

#### Step 2.3: Generate Slug and File Path

Apply slug rules: lowercase, spaces → hyphens, strip `?*<>|"`, max 50 chars.

File: `adr/ADR-{NNN}-{slug}.md`

#### Step 2.4: Load Template and Populate

**Load the canonical template** (same as Workflow 1 Step 1.4):
```
Read(file_path="$PLUGIN_DIR/skills/architecture-definition-record/adr/ADR-000-template.md")
```

**GATE CHECK**: If the template was NOT loaded (read failed or content is empty), DO NOT generate the ADR. Return error:
```
TEMPLATE LOAD FAILURE: Could not load ADR-000-template.md. ADR generation aborted.
```

Populate all sections from the interview answers. Fill the `**Scope**` header field with the value from Step 2.1a (`Institutional` or `User`). Leave Implementation Plan and Success Metrics as optional stubs unless user provided that information.

**Step 2.4a — Institutional content gate**: If the scope chosen in Step 2.1a is `Institutional`, before writing the file, verify the populated content does NOT contain:
- "Institutional Inheritance Note" header
- "Project Application" sections or tables
- Specific component names, operator names, or feature names
- Project budgets, deadlines, or user counts
- Cross-references to ADR-101+

If any are present, generalize them per `ADR_GUIDE.md § Institutional ADR Content Discipline` and confirm with the user before writing.

**Step 2.4b — Length Validation Gate (BLOCKING)**: Before the file is written, verify both length constraints from `ADR_GUIDE.md § Title and Problem Statement Length Constraints`. Applies to ALL scopes (Institutional and User/Project alike — the rules are universal).

1. **Title length** — extract the text after `# ADR-NNN: ` from the populated H1 line and count characters. Must be ≤ 50.
2. **Problem Statement length** — extract the body between `### Problem Statement` and the next `### ` (or `---`) heading, strip any HTML comments, trim whitespace, and count characters. Must be ≤ 200.

```bash
# Title check (in-memory before write):
title_text="<populated title from Step 2.2 interview>"
[ ${#title_text} -le 50 ] || echo "FAIL T1: title is ${#title_text} chars (>50)"

# Problem Statement check (in-memory before write):
ps_body="<populated Problem Statement body, comments stripped, trimmed>"
[ ${#ps_body} -le 200 ] || echo "FAIL P2: Problem Statement is ${#ps_body} chars (>200)"
```

On FAIL: prompt the user with the actual length and the current text, and ask them to revise. The interactive flow allows direct rewording; do NOT proceed to Step 2.5 until both checks pass. Cap at 3 revision rounds — on round 4, recommend splitting the decision into multiple ADRs (the natural fix when scope is too broad to fit the constraints).

**No waiver mechanism**: a decision that cannot be stated as a 50-char title and a 200-char problem statement is one decision too many.

#### Step 2.5: Write File

```
Write(file_path="adr/ADR-{NNN}-{slug}.md", content=...)
```

Report:
```
✅ Created: adr/ADR-{NNN}-{slug}.md

Review and customize the file, particularly:
- The comparison table (replace placeholder data with real metrics)
- References section (cite vendor docs, benchmarks, POC results)
- Related ADRs field
```

#### Step 2.6: Offer to Update ARCHITECTURE.md Table

```
Would you like me to add ADR-{NNN} to the Section 12 table in ARCHITECTURE.md? (yes/no)
```

If yes: Read ARCHITECTURE.md, locate the ADR table, append a new row:
```
| [ADR-{NNN}](adr/ADR-{NNN}-{slug}.md) | {title} | {status} | {date} | {impact} |
```

---

### Workflow 3 — Update ADR Status

**Trigger**: User asks to accept, reject, deprecate, or supersede an ADR.

#### Step 3.1: Identify Target ADR

If not specified, list all ADRs with current status:
```bash
grep -l "**Status**" adr/ADR-*.md | xargs grep -H "^\*\*Status\*\*"
```

#### Step 3.2: Perform Update

**For Proposed → Accepted / Deprecated / Rejected:**
- Read the target ADR file
- Replace the `**Status**: Proposed` line with the new status
- Update `**Date**` if appropriate
- Write the file back

**For Supersede (most common):**
→ Invoke Workflow 4 (Supersede ADR)

#### Step 3.3: Documentation Impact Propagation

**When to run**: After every Accepted / Deprecated / Rejected status change. Skip for Proposed→Proposed (no downstream impact) and for Supersede (handled by Workflow 4 Step 4.3).

---

##### Phase 1: Impact Discovery

**1a. Citation scan** — find all files that explicitly reference this ADR:
```bash
grep -rl "ADR-{NNN}" docs/ docs/components/ handoffs/ 2>/dev/null
```

**1b. Topic scan** — extract keywords from the ADR title and Context section. Match against the topic-to-file mapping table to find conceptually-affected files even without explicit citations:

| ADR Topic Keywords | Architecture Files to Check |
|---|---|
| database, storage, data, persistence | `docs/04-data-flow-patterns.md`, `docs/06-technology-stack.md` |
| API, protocol, REST, gRPC, HTTP | `docs/05-integration-points.md`, `docs/06-technology-stack.md` |
| security, auth, encryption, identity | `docs/07-security-architecture.md` |
| scaling, performance, cache, latency | `docs/08-scalability-and-performance.md` |
| deployment, infrastructure, cloud | `docs/09-operational-considerations.md`, `docs/06-technology-stack.md` |
| framework, language, runtime, library | `docs/06-technology-stack.md` |
| architecture pattern, layer, structure | `docs/03-architecture-layers.md` |
| messaging, events, queue, stream, kafka | `docs/04-data-flow-patterns.md`, `docs/05-integration-points.md` |

Add any matched files not already in the citation list.

**1c. Handoff scan** — scan `handoffs/` for references to this ADR; also include handoffs for components that match the ADR topic:
```bash
grep -rl "ADR-{NNN}" handoffs/ 2>/dev/null
```

**1d. Fact-change extraction** — read the ADR and produce a concrete bullet list of what changed. For a status-only change:
```
- Status: {old} → {new} (decision is now {authoritative/deprecated/rejected})
```
For a content-bearing supersede, compare the old and new Decision sections and list changed parameters (e.g., "Kafka retention 7d → 1d", "Added PostgreSQL fallback").

---

##### Phase 2: Generate "Documentation Updates Required" Checklist

Present to the user grouped by file type. For each file, state what needs to change and why.

```
═══════════════════════════════════════════════════════════
DOCUMENTATION UPDATES REQUIRED — ADR-{NNN} ({title})
═══════════════════════════════════════════════════════════

Status change: {old_status} → {new_status}
Fact changes:
- {bullet list from Phase 1d}

─── Architecture Docs (docs/) ────────────────────────────
1. [ ] docs/04-data-flow-patterns.md — {what needs updating and why}
2. [ ] docs/06-technology-stack.md — {what needs updating and why}

─── Component Files (docs/components/) ───────────────────
3. [ ] docs/components/08-confluent-kafka.md — {what needs updating}

─── Handoff Docs (handoffs/) ────────────────────────
4. [ ] handoffs/08-confluent-kafka-handoff.md — {what needs updating}

─── No Updates Required ──────────────────────────────────
ℹ️  docs/07-security-architecture.md — references ADR-{NNN} but content is status-independent
═══════════════════════════════════════════════════════════
Approve all updates? ('all' / comma-separated numbers to deselect / 'skip')
```

**Wait for user response:**
- `all` or Enter → proceed with all items
- `1,3` → deselect those numbers (mark as manual)
- `skip` → add `<!-- PROPAGATION PENDING: downstream docs not yet updated ({date}) -->` to the ADR file and stop

---

##### Phase 3: Execute Updates

For each approved item, apply the change following the architecture-docs Context Anchor Protocol. **Never modify `docs/` or `handoffs/` without loading the required context first.**

**For `docs/*.md`, `docs/components/*.md`, and `docs/components/**/*.md`:**
1. Load Context Anchor — universal foundation (`docs/01-system-overview.md` + `docs/02-architecture-principles.md`) + section-specific parents per the dependency tier table + the changed ADR
2. Read the target file
3. Identify specific passages: ADR citations (`per [ADR-NNN]`), facts derived from the ADR, status references
4. Apply changes:
   - Status changes: update `per [ADR-NNN]` citations to note the new status where relevant
   - Deprecated/rejected: add `<!-- ADR-{NNN} deprecated/rejected — review this section -->` beside affected content
   - For supersede: replace `per [ADR-{old}]` with `per [ADR-{new}]`; update derived facts
5. Run the 5-check Post-Write Alignment Audit (Checks A–E from architecture-docs)
6. Mark `[x]` in the checklist

**For `handoffs/*.md`:**
1. Read the handoff file
2. Locate ADR references (typically Section 13 "ADRs Referenced") and any content derived from the ADR decision
3. Update following the handoff Documentation Fidelity Policy: only change what the ADR changed; preserve all other content
4. Mark `[x]` in the checklist

**For `ARCHITECTURE.md` Section 12 table:**
Update the ADR row's Status column to reflect the new status (this is within this skill's authority).

---

##### Phase 4: Propagation Report

```
═══════════════════════════════════════════════════════════
ADR CHANGE PROPAGATION — COMPLETION REPORT
═══════════════════════════════════════════════════════════

ADR: ADR-{NNN} — {title}
Change: {old_status} → {new_status}

Documentation updates completed:
[x] docs/04-data-flow-patterns.md — retention figures updated
[x] docs/components/08-confluent-kafka.md — retention figures updated
[x] handoffs/08-confluent-kafka-handoff.md — acceptance criteria updated

Deselected (manual update required):
[ ] docs/09-operational-considerations.md — DR runbook: confirm two-phase recovery procedure

Failed (require manual review):
⚠️  {list any files where the edit could not be applied cleanly}

Pending markers added:
ℹ️  {list any <!-- PROPAGATION PENDING --> or <!-- ADR deprecated --> markers placed}
═══════════════════════════════════════════════════════════
```

##### Phase 5: Asset Regeneration Advisory

**Runs after**: Phase 4 report is displayed.
**Also runs when**: User selected `skip` in Phase 2 and handoff files exist in `handoffs/` — in this case, note that handoff text was also not updated.

**Skip silently when**: No `handoffs/*.md` files appeared in the Phase 3 update list (completed, deselected, or failed) AND propagation was not skipped.

**Step 5a — Detect asset-impacting changes**: Scan the fact-deltas from Phase 1d for asset-impact keywords (case-insensitive):

| Keywords | Potentially Stale Asset |
|----------|------------------------|
| API, endpoint, REST, GraphQL, gRPC, route, path, method, request, response, header, status code | `openapi.yaml` |
| database, table, column, schema, index, constraint, migration, DDL, SQL | `ddl.sql` |
| Redis, cache, key, TTL, expiration, eviction | `redis-key-schema.md` |
| deployment, container, pod, replica, port, resource, limit, CPU, memory, image, Kubernetes, K8s | `deployment.yaml` |
| message, event, topic, queue, consumer, producer, Kafka, RabbitMQ, stream | `asyncapi.yaml` |
| Avro, schema registry | `schema.avsc` |
| Protobuf, proto | `schema.proto` |
| cron, schedule, batch, job, CronJob | `cronjob.yaml` |

If no keywords match → skip this phase silently.

**Step 5b — Identify affected components**: For each `handoffs/*-handoff.md` file that was touched in Phase 3 (or would have been if propagation was skipped/deselected), check whether `handoffs/assets/NN-<component-name>/` exists and contains any of the matched asset types. Exclude components with no asset directory or no matching asset files on disk.

If zero components remain after filtering → skip silently.

**Step 5c — Present advisory**:

```
───────────────────────────────────────────────────────────
ASSET REGENERATION ADVISORY
───────────────────────────────────────────────────────────

The ADR propagation above updated handoff document text,
but the following scaffolded assets may now be stale:

  Component: {component-name}
    → openapi.yaml  (ADR changes mention: endpoint, API)
    → ddl.sql       (ADR changes mention: table, column)

These assets were generated by the dev-handoff skill and
contain structured specs derived from architecture docs.
In-place text patches do not regenerate them.

Would you like to regenerate handoff documents and assets
for the affected components?

  [Yes] → I will provide the commands to run
  [No]  → No action needed right now

Note: You can regenerate all handoffs at any time with:
  /skill architecture-dev-handoff
───────────────────────────────────────────────────────────
```

If propagation was **skipped**: prepend to the advisory:
> `Note: Propagation was skipped — handoff document text was also not updated. Full regeneration is recommended.`

**Wait for user response.**

- **Yes** → Display one line per affected component: `Run: /skill architecture-dev-handoff` (for each affected component by name). Do NOT invoke the skill automatically.
- **No** → Acknowledge and proceed with no further action.

---

### Workflow 4 — Supersede an ADR

**Trigger**: User decides to replace an existing architectural decision with a new one.

ADRs are **immutable** — do not edit accepted ADRs. Create a new ADR that supersedes the old one.

#### Step 4.1: Create New ADR

Follow Workflow 2, collecting the new decision information. In the new ADR's header:
```
**Related**: Supersedes [ADR-{old}](ADR-{old}-{slug}.md)
```

#### Step 4.2: Mark Old ADR as Superseded

Read the old ADR, update its status line:
```
**Status**: Superseded by [ADR-{new}](ADR-{new}-{slug}.md)
```
Add a `**Superseded Date**: {today}` field after the status line. Write the file back.

#### Step 4.3: Documentation Impact Propagation (Supersede)

Run the same 4-phase Documentation Impact Propagation as Workflow 3 Step 3.3, with these supersede-specific adjustments:

**Phase 1 adjustments:**
- Step 1a: grep for BOTH `ADR-{old}` and `ADR-{new}` across all `docs/`, `docs/components/`, `handoffs/`
- Step 1d: compare the old ADR's Decision section with the new ADR's Decision section to produce concrete fact deltas (what changed, what was added, what was removed)

**Phase 2 adjustments:**
- Checklist header shows: `Supersede: ADR-{old} → ADR-{new}`
- For each file: distinguish between (a) citation updates only (`per [ADR-{old}]` → `per [ADR-{new}]`) and (b) content updates where derived facts changed

**Phase 3 adjustments:**
- Replace all `per [ADR-{old}](../adr/ADR-{old}-slug.md)` citations with `per [ADR-{new}](../adr/ADR-{new}-slug.md)` in every affected file
- Update derived content to reflect the new decision's facts (changed parameters, changed approach, changed technology)
- Update `ARCHITECTURE.md` Section 12 table: old ADR row status → "Superseded", ensure new ADR row is present

**Phase 4 adjustments:**
- Report includes citation migration count: `{N} references migrated from ADR-{old} to ADR-{new}`

**Phase 5 (Asset Regeneration Advisory):**
- Run the same Phase 5 logic from Workflow 3 Step 3.3
- Fact-deltas come from the supersede comparison (old ADR Decision section vs. new ADR Decision section)
- Advisory prompt header says "ADR supersede propagation" instead of "ADR propagation"

#### Step 4.4: Confirm

```
✅ Done:
- Created: adr/ADR-{new}-{slug}.md (new decision)
- Updated: adr/ADR-{old}-{slug}.md (Status: Superseded by ADR-{new})
- Propagated: {N} downstream files updated, {M} deselected for manual review
```

---

### Workflow 5 — List / Audit ADRs

**Trigger**: User asks for an ADR inventory, status summary, or gap report.

#### Step 5.1: Scan adr/ Directory

```bash
ls -1 adr/ADR-*.md 2>/dev/null
```

For each file: extract number, title (from H1), status, date from file header.

#### Step 5.2: Display Summary

```
ADR Inventory — {project}
──────────────────────────────────────────────────────────────────────────
 #   Title                            Scope          Status       Date
──────────────────────────────────────────────────────────────────────────
 001 Technology Stack Selection       Institutional  ✅ Accepted   2024-01-15
 002 Database Policy                  Institutional  ✅ Accepted   2024-01-20
 101 PostgreSQL Primary DB            User           ✅ Accepted   2024-02-01
 102 Auth Strategy                    User           🔄 Superseded 2024-02-10
──────────────────────────────────────────────────────────────────────────
 4 total | 2 Institutional (001–100: 2/100 used) | 2 User/Project (101+)
         | 3 Accepted | 1 Superseded

⚠️  Gaps detected:
 - ADR-102 is Superseded — check that a superseding ADR exists
 - Consider reviewing: ADRs older than 6 months (ADR-001, ADR-002)
```

For ADRs missing a `**Scope**` field (legacy files), display scope as `Legacy` and note at the bottom:
```
ℹ️  {N} legacy ADR(s) have no Scope field. Numbers ≤100 are treated as Institutional,
    numbers ≥101 are treated as User. Add "**Scope**: Institutional | User" to those
    files to make the classification explicit.
```

---

## ADR File Convention

- **Location**: `adr/` directory at the same level as `ARCHITECTURE.md`
- **Naming**: `ADR-NNN-brief-title.md` (zero-padded, lowercase, hyphen-separated)
- **Template**: `skills/architecture-definition-record/adr/ADR-000-template.md`
- **Guide**: `skills/architecture-definition-record/ADR_GUIDE.md`

**Status lifecycle:**
```
Proposed → Accepted → Deprecated → Superseded by ADR-NNN
           ↓
        Rejected
```

**Immutability rule**: Once Accepted, never edit content. Create a new ADR that supersedes it instead.

---

## Integration with Other Skills

| Skill | ADR Interaction | Delegation Required? |
|-------|----------------|---------------------|
| `architecture-docs` | Reads ADRs for context; delegates creation to this skill; **receives downstream update requests during ADR change propagation (Step 3.3 / 4.3)** | YES for create; YES for propagation edits |
| `architecture-docs-export` | Reads `adr/*.md`, exports to .docx | NO (read-only) |
| `architecture-peer-review` | Reads `adr/*.md` for quality review at Hard depth | NO (read-only) |
| `architecture-blueprint` | Reads `adr/*.md` for structured data extraction | NO (read-only) |
| `architecture-component-guardian` | Reads ADRs for alignment context | NO (read-only) |
| `architecture-compliance` agents | Read `adr/README.md` for compliance validation | NO (read-only) |
| `architecture-dev-handoff` | References ADRs in Section 13 of handoff docs; **receives update requests during ADR change propagation (Step 3.3 / 4.3)** | YES for propagation edits |

---

## Success Criteria

- [ ] ADR file written to `adr/ADR-NNN-slug.md` with correct naming convention
- [ ] Template populated: no placeholder data in comparison tables
- [ ] Status field set correctly
- [ ] ARCHITECTURE.md Section 12 table updated if requested
- [ ] For supersede operations: old ADR marked `Superseded by ADR-NNN`, new ADR references old one
- [ ] For status changes and supersede: Documentation Impact Propagation checklist generated and presented (Step 3.3 / 4.3)
- [ ] All approved propagation items completed or marked with `<!-- PROPAGATION PENDING -->` / `<!-- ADR-NNN deprecated -->` tracking markers
- [ ] For propagation with handoff impact: Asset Regeneration Advisory displayed when asset-impacting keywords detected in fact-deltas (Phase 5)
