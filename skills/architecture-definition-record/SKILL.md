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

## Workflows

### Workflow 1 — Generate ADRs from ARCHITECTURE.md Section 12 Table

**Trigger**: Called by `architecture-docs` after ARCHITECTURE.md creation, or by user explicitly.

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

**Regex:**
```
^\| \[ADR-(\d{3})\]\(adr\/ADR-\d{3}(-[a-z0-9-]+)?\.md\) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|
```

**Validate**: Check for duplicate ADR numbers — warn and halt if found.

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

#### Step 2.1: Determine Next ADR Number

```bash
ls adr/ADR-*.md 2>/dev/null | grep -oP 'ADR-\K\d+' | sort -n | tail -1
```

Next number = max + 1 (zero-padded to 3 digits). If no ADRs exist, start at `001`.

#### Step 2.2: Gather Decision Information

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

#### Step 2.4: Populate Template

Load template (from Step 1.4 method), populate all sections from the interview answers. Leave Implementation Plan and Success Metrics sections as optional stubs unless user provided that information.

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
grep -rl "ADR-{NNN}" docs/ docs/components/ docs/handoffs/ 2>/dev/null
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

**1c. Handoff scan** — scan `docs/handoffs/` for references to this ADR; also include handoffs for components that match the ADR topic:
```bash
grep -rl "ADR-{NNN}" docs/handoffs/ 2>/dev/null
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

─── Handoff Docs (docs/handoffs/) ────────────────────────
4. [ ] docs/handoffs/08-confluent-kafka-handoff.md — {what needs updating}

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

For each approved item, apply the change following the architecture-docs Context Anchor Protocol. **Never modify `docs/` or `docs/handoffs/` without loading the required context first.**

**For `docs/*.md` and `docs/components/*.md`:**
1. Load Context Anchor — universal foundation (`docs/01-system-overview.md` + `docs/02-architecture-principles.md`) + section-specific parents per the dependency tier table + the changed ADR
2. Read the target file
3. Identify specific passages: ADR citations (`per [ADR-NNN]`), facts derived from the ADR, status references
4. Apply changes:
   - Status changes: update `per [ADR-NNN]` citations to note the new status where relevant
   - Deprecated/rejected: add `<!-- ADR-{NNN} deprecated/rejected — review this section -->` beside affected content
   - For supersede: replace `per [ADR-{old}]` with `per [ADR-{new}]`; update derived facts
5. Run the 5-check Post-Write Alignment Audit (Checks A–E from architecture-docs)
6. Mark `[x]` in the checklist

**For `docs/handoffs/*.md`:**
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
[x] docs/handoffs/08-confluent-kafka-handoff.md — acceptance criteria updated

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
**Also runs when**: User selected `skip` in Phase 2 and handoff files exist in `docs/handoffs/` — in this case, note that handoff text was also not updated.

**Skip silently when**: No `docs/handoffs/*.md` files appeared in the Phase 3 update list (completed, deselected, or failed) AND propagation was not skipped.

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

**Step 5b — Identify affected components**: For each `docs/handoffs/*-handoff.md` file that was touched in Phase 3 (or would have been if propagation was skipped/deselected), check whether `docs/handoffs/assets/NN-<component-name>/` exists and contains any of the matched asset types. Exclude components with no asset directory or no matching asset files on disk.

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
- Step 1a: grep for BOTH `ADR-{old}` and `ADR-{new}` across all `docs/`, `docs/components/`, `docs/handoffs/`
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
─────────────────────────────────────────────────────────────
 #   Title                               Status       Date
─────────────────────────────────────────────────────────────
 001 Technology Stack Selection          ✅ Accepted   2024-01-15
 002 Database Choice                     ✅ Accepted   2024-01-20
 003 API Protocol                        🚧 Proposed   2024-02-01
 004 Auth Strategy                       🔄 Superseded 2024-02-10
─────────────────────────────────────────────────────────────
 4 total | 2 Accepted | 1 Proposed | 1 Superseded

⚠️  Gaps detected:
 - ADR-003 is still Proposed (not yet accepted)
 - Consider reviewing: ADRs older than 6 months (ADR-001, ADR-002)
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
