---
name: architecture-component-guardian
description: Use this skill to create or update docs/components/README.md — the only sanctioned way to modify the component index table. Invoke when: adding a component, removing a component, updating a component name or type, syncing the index after a migration, or any time docs/components/README.md needs to change.
---

# Architecture Component Guardian Skill

## Purpose

This skill is the single source of truth for generating and maintaining
`docs/components/README.md`. It enforces a fixed 4-column table schema on every
write and refuses ad-hoc direct edits.

---

## When to Invoke This Skill

- User adds a new component file to `docs/components/`
- User removes a component file from `docs/components/`
- User updates a component name or type in a component file
- User asks to "sync", "regenerate", or "rebuild" the component index
- After a migration that produces the `docs/components/` structure for the first time
- Any request to modify `docs/components/README.md` directly → redirect here instead

**Do NOT invoke for**: questions about individual components (use `architecture-docs`
skill), compliance generation, presentation creation, or **component development handoffs**
(use `architecture-dev-handoff` skill — it manages `docs/handoffs/` independently).

---

## Format Specification — FIXED, do not alter without updating this skill

The generated `docs/components/README.md` MUST follow this exact structure:

```
Line 1:  <!-- managed by solutions-architect-skills:architecture-component-guardian — do not edit manually -->
Line 2:  [Architecture](../../ARCHITECTURE.md) > Components
Line 3:  (blank)
Line 4:  # Component Details
Line 5:  (blank)
Line 6:  <intro paragraph>
Line 7:  (blank)
Line 8:  ## <System Name> Components
Line 9:  (blank)
Line 10: | # | Component | File | Type |
Line 11: |---|-----------|------|------|
Line 12: | 5.1 | ... | ... | ... |
         ...
         (blank)
         ## Key Relationships
         (blank)
         - bullet list
         (blank)
         ## Related Documentation
         (blank)
         - link list
```

**Table schema — exactly 4 columns, never add or remove:**

| # | Component | File | Type |
|---|-----------|------|------|

**Column extraction rules:**

| Column | Source |
|--------|--------|
| `#` | Filename prefix `NN-` → formatted as `5.N` (e.g. `01` → `5.1`) |
| `Component` | First `# Heading` in the component file |
| `File` | `[NN-filename.md](NN-filename.md)` relative link; anchor fragment allowed for files grouping multiple components |
| `Type` | Value of `**Type:**` field in the component file; if absent, first classification sentence |

**What belongs here vs. elsewhere:**

| Data | Location |
|------|----------|
| Technology stack per component | Individual component file (`**Technology:**` section) |
| Monthly cost per component | `docs/09-operational-considerations.md` Cost Management section |
| Component relationships | `## Key Relationships` section of this README |
| Scaling details | `docs/08-scalability-and-performance.md` |
| Extra index columns | **Not permitted** — update this skill's format spec first |
| Development handoff docs | `docs/handoffs/NN-*-handoff.md` — managed by `architecture-dev-handoff` skill |

---

## Workflow

### Step 1 — Detect mode

Check if `docs/components/README.md` exists:
- **Does not exist** → **CREATE mode** (new architecture or post-migration)
- **Exists** → **UPDATE mode** (add / remove / update / sync)

### Step 2 — Scan component files

Read every `.md` file in `docs/components/` **except `README.md`**.
Sort by filename prefix ascending (01, 02, 03 …).

For each file extract: section number, component name, file link, type.

### Step 3 — Apply requested change

| Argument | Action |
|----------|--------|
| `sync` | Rebuild table from current files, no other change |
| `add component <description>` | Create the new component file if not present, then sync |
| `remove component <name>` | Confirm deletion of component file, then sync |
| `update component <name>` | Edit the relevant component file fields, then sync |

### Step 4 — Regenerate `docs/components/README.md`

Write the full file using the Format Specification above.

**If the user requests extra columns** (technology, cost, etc.): decline and explain
that additional data belongs in the individual component files or in a dedicated
supplementary document. The index table schema is fixed by this skill.

### Step 5 — Verify output

Before finishing, confirm:
- [ ] Line 1 is the managed-by HTML comment
- [ ] Table has exactly 4 columns: `#`, `Component`, `File`, `Type`
- [ ] All `.md` files in `docs/components/` (except README.md) are represented in the table
- [ ] No component appears twice
- [ ] Breadcrumb is `[Architecture](../../ARCHITECTURE.md) > Components`
- [ ] Sections appear in order: Components table → Key Relationships → Related Documentation

---

### Step 6 — Update architecture documentation

**Runs for**: `add`, `remove`, `update` operations only. **Skip for `sync`** — sync rebuilds the index from existing files without changing architecture content.

---

#### Step 6a — Load Context Anchor

Required by the architecture-docs Context-Efficient Workflow for any edit to `docs/components/*.md` files.

Load in this order:
1. **Universal Foundation**: `docs/01-system-overview.md` + `docs/02-architecture-principles.md`
2. **Section-Specific Parents**: `docs/03-architecture-layers.md` (layers/tiers the component belongs to) + `docs/components/README.md` (component index)
3. **Relevant ADRs**: Read the ARCHITECTURE.md navigation table; match ADR titles against the component name and type — load any matched ADRs

---

#### Step 6b — Post-Write Alignment & Traceability Audit

Run the 5-check audit on the modified or newly created component file:

- **Check A — Principle traceability**: Component design does not contradict Section 3 (Architecture Principles)
- **Check B — Metric consistency**: Any numeric values (throughput, latency, SLO) match Section 1 Key Metrics
- **Check C — ADR alignment**: Component does not contradict decisions in the loaded ADRs
- **Check D — Parent section alignment**: Component maps to a valid layer defined in `docs/03-architecture-layers.md`
- **Check E — Source citation audit**: Numeric values, technology names, and architecture patterns have source cross-reference links; unverifiable claims are marked `<!-- TODO: Add source reference -->`

Silent pass if all checks clear. Report only when misalignment or missing citations are detected.

---

#### Step 6c — Update all downstream architecture sections (S6–S11)

Read each downstream file and update it to reflect the component change:

| File | Section | What to Update |
|------|---------|----------------|
| `docs/04-data-flow-patterns.md` | S6 — Data Flow | Flows the component participates in (request/response paths, event streams, pipelines) |
| `docs/05-integration-points.md` | S7 — Integration Points | Endpoints, APIs, or events the component exposes or consumes |
| `docs/06-technology-stack.md` | S8 — Technology Stack | Technologies introduced or removed with the component |
| `docs/07-security-architecture.md` | S9 — Security | Auth boundaries, encryption controls, trust zones relevant to the component |
| `docs/08-scalability-and-performance.md` | S10 — Scalability | Scaling strategy, resource limits, SLOs relevant to the component |
| `docs/09-operational-considerations.md` | S11 — Operations | Deployment config, health checks, alerting, runbooks for the component |

**Per-operation rules**:

- **`add`**: Insert references to the new component in each section where it is architecturally relevant. If a section has no applicable content for this component type (e.g., a stateless utility service has no S10 scaling entry), leave it unchanged and note it in the propagation report.
- **`remove`**: Remove all references to the deleted component from each section. Flag any flows, integration points, or operational runbooks that depended exclusively on this component as **orphaned** (mark with `<!-- ORPHANED: <component-name> removed — update required -->`).
- **`update`**: Update all references to reflect the changed component details (new name, changed type, modified endpoints, revised responsibilities). Replace stale references; do not duplicate them.

Apply source-attribution conventions throughout:
- Cross-reference links to the component file: `(see [Component Name](../components/NN-name.md))`
- Unverifiable claims: `<!-- TODO: Add source reference -->`

---

#### Step 6d — Update `ARCHITECTURE.md` navigation index

Applies to `add` and `remove` only (skip for `update`):

- **`add`**: Verify the new component file appears in the Section 5 row of the ARCHITECTURE.md navigation table. If missing, add the row.
- **`remove`**: Verify the removed component no longer appears in the Section 5 row. If still present, remove the row.

---

#### Step 6e — Prompt for diagram update

Component changes affect the High-Level Architecture diagram and potentially Data Flow diagrams. Present:

```
⚠️  Component change detected — architecture diagrams may be out of date.

Affected diagrams:
- High-Level Architecture → docs/03-architecture-layers.md  [REQUIRED diagram]
- Data Flow Diagrams → docs/04-data-flow-patterns.md  [REQUIRED diagram]

Update architecture diagrams now? [Yes/No]
```

- If **Yes**: invoke the `architecture-docs` skill with diagram update intent — Workflow 8 runs in update mode (existing diagrams are replaced, Step 5a detects and inventories them, all source-traceability and canonical-location rules apply)
- If **No**: log a `<!-- DIAGRAM UPDATE PENDING: <component-name> <operation> (YYYY-MM-DD) -->` comment at the top of `docs/03-architecture-layers.md` so the outstanding update is traceable

---

#### Step 6f — Change Propagation Report

Present the downstream impact summary:

```
═══════════════════════════════════════════════════════════
CHANGE PROPAGATION — DOWNSTREAM IMPACT REPORT
═══════════════════════════════════════════════════════════

Component: <component-name> (<operation>: add | remove | update)

Sections updated:
→ docs/04-data-flow-patterns.md (S6) — [summary of change]
→ docs/05-integration-points.md (S7) — [summary of change]
→ docs/06-technology-stack.md (S8) — [summary of change]
→ docs/07-security-architecture.md (S9) — [summary of change]
→ docs/08-scalability-and-performance.md (S10) — [summary of change]
→ docs/09-operational-considerations.md (S11) — [summary of change]

Sections with no applicable content for this component:
ℹ️  [list sections where no update was needed, with reason]

[remove only] Orphaned references requiring manual review:
⚠️  [list any flows or runbooks that exclusively referenced the removed component]
═══════════════════════════════════════════════════════════
```

---

## User Flows

### Flow A — New architecture (first time)
1. `architecture-docs` skill creates ARCHITECTURE.md + `docs/` structure including component files
2. User invokes this skill with `sync`
3. Skill scans `docs/components/*.md`, extracts data, creates README from scratch

### Flow B — Post-migration
1. MIGRATION agent splits a monolithic ARCHITECTURE.md into `docs/` files
2. At end of migration, invoke this skill with `sync` to create or verify README
3. Managed-by comment is written at line 1

### Flow C — Ongoing maintenance
1. Developer adds/changes/removes a `docs/components/NN-*.md` file
2. Invoke this skill — README is regenerated with the change reflected
3. 4-column format is enforced on every write
4. Architecture documentation sections (S6–S11) are updated with component references
5. `ARCHITECTURE.md` navigation index is updated (add/remove only)
6. Diagram update prompt is presented; pending updates are tracked with a comment marker

### Flow D — Rejected direct edit
1. User or Claude tries to edit `docs/components/README.md` directly
2. `CLAUDE.md` project rule redirects to this skill
