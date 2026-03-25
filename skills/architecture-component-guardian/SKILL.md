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

### Flow D — Rejected direct edit
1. User or Claude tries to edit `docs/components/README.md` directly
2. `CLAUDE.md` project rule redirects to this skill
