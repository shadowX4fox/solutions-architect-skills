---
name: architecture-onboarding
description: >
  Interactive concept map explorer for architecture documentation onboarding.
  Reads ARCHITECTURE.md, docs/, compliance-docs/, and adr/ to generate a
  canvas-based concept map playground with draggable nodes representing
  sections, components, principles, compliance contracts, and skills —
  connected by dependency, ownership, and workflow edges. Users cycle knowledge
  levels (Know/Fuzzy/Unknown) per node and generate targeted learning prompts.
  Use when onboarding a new team member, exploring the architecture suite,
  getting an architecture overview, or mapping what you know and don't know.
triggers:
  - onboarding
  - explore architecture
  - architecture overview
  - architecture explorer
  - architecture tour
  - concept map
  - what is this architecture
---

# Architecture Onboarding Skill

## Purpose

This skill is the **entry point for new team members** joining a project that uses the solutions-architect-skills documentation suite. It reads the project's existing architecture docs and generates an interactive concept map — a canvas-based, draggable node-and-edge visualization — that helps users explore:

- The **5-phase lifecycle pipeline** (Readiness → Docs → Compliance → Review → Handoff)
- **Use cases** from the PO Spec / system overview, traced through sections and components
- The **12-section architecture structure** (S1-S12) with their file paths and dependency tiers
- **Architecture types** (META, 3-Tier, Microservices, N-Layer, BIAN) with the detected type highlighted
- **Components** from the component index with their types and connections
- **Compliance contract slots** (10 contracts) with scores if available
- **Architecture principles** (9 required) with presence indicators
- **Available skills** (9 skills) and when to invoke each
- **Architecture Decision Records** if `adr/` exists

Users can cycle knowledge levels per node (Know / Fuzzy / Unknown) and copy a targeted learning prompt pre-shaped by their knowledge gaps.

**Distinct from `architecture-peer-review`** (which reviews quality) and **`architecture-compliance-review`** (which analyzes contract health) — this skill is for exploration and learning, not evaluation.

---

## When to Invoke This Skill

- User is new to the project and wants an overview of the architecture
- User asks for an "architecture overview", "architecture tour", "architecture map", or "concept map"
- User asks "what is this architecture?", "how does this architecture work?", or "where do I start?"
- User asks for an "onboarding" experience or "explore the architecture"
- User uses `/skill architecture-onboarding`

**Do NOT invoke for:**
- Creating or editing ARCHITECTURE.md → use `architecture-docs` skill
- Generating compliance contracts → use `architecture-compliance` skill
- Peer review of architecture quality → use `architecture-peer-review` skill
- Compliance gap analysis → use `architecture-compliance-review` skill
- Generating component handoffs → use `architecture-dev-handoff` skill

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — entry point and workflow |
| `PLAYGROUND_TEMPLATE.md` | Concept map playground template for the interactive HTML explorer |

---

## Workflow

### Step 1 — Locate ARCHITECTURE.md (Required)

Search for `ARCHITECTURE.md` at the project root (and one level up if running from a subdirectory). If not found, **abort** with:

> *"No ARCHITECTURE.md found. Use `/skill architecture-docs` to create one first, then run onboarding."*

Detect structure type:
- **Multi-file**: `ARCHITECTURE.md` is a navigation index + `docs/` directory with section files
- **Monolithic**: Single `ARCHITECTURE.md` contains all content

---

### Step 2 — Extract Architecture Metadata

From `ARCHITECTURE.md`:
- **Project name**: From the first H1 heading or the "Project" field in Document Control
- **Architecture type**: Search for `<!-- ARCHITECTURE_TYPE: XXX -->` comment. If not found, infer from content (look for "META", "BIAN", "Microservices", "3-Tier", "N-Layer" keywords). Default to `"unknown"`.
- **Structure type**: Whether `docs/` directory exists with numbered files

---

### Step 3 — Read Section Presence

Glob for `docs/NN-*.md` files. Map each found file to its S-number using this fixed table:

| File | S-number | Tier |
|------|----------|------|
| `docs/01-system-overview.md` | S1+S2 | 0 (Foundation) |
| `docs/02-architecture-principles.md` | S3 | 0 (Foundation) |
| `docs/03-architecture-layers.md` | S4 | 1 |
| `docs/04-data-flow-patterns.md` | S6 | 3 |
| `docs/05-integration-points.md` | S7 | 3 |
| `docs/06-technology-stack.md` | S8 | 3 |
| `docs/07-security-architecture.md` | S9 | 4 |
| `docs/08-scalability-and-performance.md` | S10 | 4 |
| `docs/09-operational-considerations.md` | S11 | 5 |
| `docs/components/` (directory) | S5 | 2 |
| `adr/` (directory) | S12 | 0 (Foundation) |

For monolithic docs: use heading patterns to infer which sections are present.

**Principles extraction** (if S3 present): Search `docs/02-architecture-principles.md` for the 9 required principle headings. Mark each as `present: true` if found with non-empty Implementation subsection.

**Design drivers** (if S1 present): Search `docs/01-system-overview.md` for `### Design Drivers` heading. Extract Value Delivery, Scale, and Impacts levels if present.

---

### Step 4 — Read Optional Data

All items in this step are **optional** — the skill works with just `ARCHITECTURE.md`.

**Components** (`docs/components/README.md`):
- If exists: parse the 4-column index table (`#`, `Component`, `File`, `Type`)
- Limit to first 15 components to avoid node overload on large projects
- Status: `"present"` if file exists, `"not-created"` otherwise

**Compliance** (`compliance-docs/COMPLIANCE_MANIFEST.md`):
- If exists: parse the contract table (type, filename, score, date)
- Compute status per slot: `"valid"` (≤6 months old), `"expired"` (>6 months), `"missing"` (no file)
- Status: `"present"` if manifest exists, `"not-generated"` otherwise

**ADRs** (`adr/` directory):
- If exists: list ADR files. Extract title from first H1 and status from `**Status**: XXX` line
- Limit to first 10 ADRs
- Status: `"present"` if directory exists with files, `"not-created"` otherwise

**Handoffs** (`docs/handoffs/` directory):
- If exists: list handoff files, extract component name from filename
- Status: `"present"` if directory exists, `"not-created"` otherwise

**PO Spec** (`PRODUCT_OWNER_SPEC.md`):
- Check if file exists. Used to determine Phase 1 lifecycle status.

**Use Cases** (extracted from two sources in priority order):
1. **Primary source** — `docs/01-system-overview.md` Section 2.3 "Primary Use Cases": Parse use case headings (`### Use Case N: <Name>`) and extract: name, description (first line after heading), actors, and success metrics.
2. **Fallback source** — `PRODUCT_OWNER_SPEC.md` Section 4 "Use Cases": Parse `### Use Case N: <Name>` headings with description, actors, primary flow steps, and success metrics.
3. If neither source has use cases, skip — no use case nodes are created.
- Limit to 10 use cases maximum.

**Use Case → Component mapping** (from handoff docs):
- If `docs/handoffs/` exists: scan each handoff file for the "Business Context" field (typically line ~30). Extract use case references (e.g., "UC 1", "UC 2", "Use Case 1") and map them to component IDs.
- If handoffs don't exist: infer mapping from component descriptions and use case names (best-effort keyword matching).

---

### Step 5 — Build Nodes and Edges

Assemble `onboardingData` JSON following the schema in `PLAYGROUND_TEMPLATE.md`.

**Node construction rules:**
- Create one node per **use case** extracted in Step 4 (id: `uc-N`, group: `usecases`). Include description, actors, and success metrics in the detail field.
- Create one node per lifecycle phase (always 5, status derived from artifact existence)
- Create one node per S-number (present nodes fully opaque, missing nodes as ghost nodes with `status: "missing"`)
- Create one node per component (up to 15)
- Create one node per compliance contract slot (always 10, using fixed contract list)
- Create one node per required principle (9 nodes; mark present/missing from Step 3)
- Create one node per available skill (always 9 nodes)
- Default all `knowledge` fields to `"fuzzy"`

**Edge construction rules (fixed structural edges always present):**

Section tier dependencies:
- S4 → S1+S2 (depends-on)
- S4 → S3 (depends-on)
- S5 → S1+S2 (depends-on)
- S5 → S4 (depends-on)
- S6 → S5 (depends-on), S7 → S5 (depends-on), S8 → S5 (depends-on)
- S9 → S5 (depends-on), S9 → S7 (depends-on), S9 → S8 (depends-on)
- S10 → S5 (depends-on), S10 → S8 (depends-on)
- S11 → S5 (depends-on), S11 → S8 (depends-on), S11 → S10 (depends-on)

Lifecycle phase → output edges:
- Phase 1 → PO Spec (produces) — always shown, ghost if missing
- Phase 2 → S1-S12 sections (produces)
- Phase 3 → Compliance contracts (produces)
- Phase 4 → peer-review score (produces)
- Phase 5 → handoffs (produces)

Phase → skill edges (uses-skill):
- Phase 1 → architecture-readiness skill
- Phase 2 → architecture-docs skill
- Phase 3 → architecture-compliance skill
- Phase 4 → architecture-peer-review + architecture-compliance-review skills
- Phase 5 → architecture-dev-handoff + architecture-docs-export skills

Use case → section edges (traces-to):
- Every use case traces to S1+S2 (system overview is where use cases are technically defined)
- Use case → S6 (data flow) if the use case involves async flows or event processing
- Use case → S7 (integration) if the use case involves external systems

Use case → component edges (served-by) — extracted from handoff docs:
- Each component's "Business Context" field lists which use cases it serves
- Create `{ from: "uc-N", to: "comp-<slug>", type: "served-by" }` for each mapping

Component → S5 edges (implements) — extracted from component index

Compliance → section edges (validates) — fixed mapping per contract type:
- SRE → S11, Business Continuity → S11, Cloud → S4, Development → S8, Security → S9, Integration → S7, Data & AI → S6, Enterprise → S1+S2, Platform → S4, Process → S7

---

### Step 6 — Invoke Playground

Invoke the `playground` skill using `PLAYGROUND_TEMPLATE.md` as the template. Pass the assembled `onboardingData` as the data to embed.

Output filename: `architecture-onboarding-<YYYY-MM-DD>.html` (use today's date)

After writing the file, run: `open architecture-onboarding-<YYYY-MM-DD>.html`

---

### Step 7 — Fallback (No Playground Plugin)

If the `playground` plugin is not installed, output a structured plain-text report:

```
# Architecture Onboarding: [PROJECT NAME]
Type: [ARCH TYPE] | Structure: [MULTI-FILE | MONOLITHIC]

## Lifecycle Pipeline
Phase 1 (Readiness): [COMPLETE | PENDING] — /skill architecture-readiness
Phase 2 (Documentation): [COMPLETE | PARTIAL | PENDING] — /skill architecture-docs
Phase 3 (Compliance): [COMPLETE | PARTIAL | PENDING] — /skill architecture-compliance
Phase 4 (Review): — /skill architecture-peer-review, /skill architecture-compliance-review
Phase 5 (Handoff): [COMPLETE | PARTIAL | PENDING] — /skill architecture-dev-handoff

## Architecture Sections Present
[S-number] [Name] — [File] (Tier [N])
...

## Components ([N] found)
...

## Compliance Contracts ([N]/10 valid)
...

## Available Skills
[name] — [one-line description]
...

## Start Here
[Recommended next skill based on what's missing]
```

---

## Integration with Other Skills

| Skill | Phase | Relationship |
|-------|-------|-------------|
| `architecture-readiness` | 1 | Onboarding shows Phase 1 status; this skill creates the PO Spec |
| `architecture-docs` | 2 | Primary data source for the concept map; this skill creates ARCHITECTURE.md |
| `architecture-compliance` | 3 | Onboarding shows compliance slot status; this skill generates contracts |
| `architecture-peer-review` | 4 | Onboarding links to this for architecture quality review |
| `architecture-compliance-review` | 4 | Onboarding links to this for compliance gap deep-dive |
| `architecture-dev-handoff` | 5 | Onboarding shows handoff presence; this skill generates them |
| `architecture-docs-export` | 5 | Onboarding references this for Word deliverable export |
| `architecture-component-guardian` | Cross-cutting | Onboarding reads component index; this skill maintains it |
| `architecture-blueprint` | Cross-cutting | Onboarding references this for organizational blueprint forms |
| `playground` | Infrastructure | External plugin dependency: generates the interactive concept map HTML |

---

## Example Invocations

```
"Give me an architecture onboarding overview"
→ Reads project docs, generates concept map HTML, opens in browser

"I'm new to this project — show me the architecture"
→ Same as above

"Create a concept map of this architecture"
→ Same as above

"Explore the architecture"
→ Same as above
```

---

## Success Criteria

- [ ] ARCHITECTURE.md found and project name / architecture type extracted
- [ ] Section presence determined for all S1-S12 slots
- [ ] `onboardingData` JSON assembled with nodes, edges, groups, and presets
- [ ] Concept map HTML generated via playground plugin
- [ ] File opened in browser
- [ ] All node groups represented (usecases, lifecycle, sections, components, compliance, principles, skills)
- [ ] Ghost nodes shown for missing sections/contracts with actionable guidance
- [ ] If playground unavailable: plain-text report output with next-skill recommendations
