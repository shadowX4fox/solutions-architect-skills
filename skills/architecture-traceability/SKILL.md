---
name: architecture-traceability
description: Compare PO Spec use cases against architecture documentation to detect coverage gaps. Generates a markdown traceability report showing Covered, Partial, or Not Covered status per requirement. Output is designed for tickets, emails, and external platforms. Invoke when validating architecture coverage of business requirements, checking for deviations from the PO Spec, or verifying traceability between business and technical documentation.
triggers:
  - traceability
  - coverage matrix
  - PO spec coverage
  - architecture coverage
  - requirements traceability
  - check coverage
  - deviation check
---

# Architecture Traceability Skill

## Purpose

This skill compares **PO Spec use cases** against **architecture documentation** to produce a portable markdown traceability report. It answers: "Did the architecture team cover everything the PO asked for?"

**Output**: `TRACEABILITY_REPORT.md` at the project root — a markdown file designed for tickets, emails, Confluence, GitHub issues, and external platforms.

---

## When to Invoke This Skill

- User asks to "check PO spec coverage", "verify traceability", or "check architecture coverage"
- User asks if the architecture covers all business requirements
- User wants to detect deviations from the PO Spec
- User needs a traceability matrix or coverage report
- User uses `/skill architecture-traceability`

**Do NOT invoke for:**
- Creating or editing the PO Spec → use `architecture-readiness` skill
- Creating or editing ARCHITECTURE.md → use `architecture-docs` skill
- Compliance contract generation → use `architecture-compliance` skill
- Architecture quality/peer review → use `architecture-peer-review` skill

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — entry point and workflow |

---

## Workflow

### Step 1 — Locate PO Spec File

Search for the Product Owner Specification:

```
Search order:
1. PRODUCT_OWNER_SPEC.md at project root
2. PO_SPEC.md at project root
3. Glob **/PRODUCT_OWNER_SPEC.md, **/PO_SPEC.md
4. Glob **/po-spec*, **/product-owner*
5. Ask user for path
```

If no PO Spec found, abort with: *"No Product Owner Specification found. Use `/skill architecture-readiness` to create one first."*

---

### Step 2 — Locate Architecture Documentation

Search for `ARCHITECTURE.md` at the project root. Detect multi-file vs monolithic structure.

Build the `arch_files` list:
- `ARCHITECTURE.md` (navigation index or monolithic)
- `docs/01-system-overview.md` (S1+S2)
- `docs/03-architecture-layers.md` (S4)
- `docs/components/*.md` or `docs/components/*/*.md` (S5)
- `docs/04-data-flow-patterns.md` (S6)
- `docs/05-integration-points.md` (S7)
- `docs/06-technology-stack.md` (S8)
- `docs/07-security-architecture.md` (S9)
- `docs/08-scalability-and-performance.md` (S10)
- `docs/09-operational-considerations.md` (S11)

Only include files that exist. If no `ARCHITECTURE.md` found, abort with: *"No ARCHITECTURE.md found. Use `/skill architecture-docs` to create one first."*

---

### Step 3 — Parse Use Cases from PO Spec

Read the PO Spec file. Locate the Use Cases section by searching for heading patterns:
- `## N. Use Cases` (e.g., `## 4. Use Cases`, `## 3. Use Cases`)
- `## Use Cases`

For each use case found (identified by `### UC-NNN:`, `### N.N UC-NNN:`, `### Use Case N:`, or `### N.N` sub-headings), extract:

| Field | Pattern | Required |
|-------|---------|----------|
| `id` | Parse from heading (e.g., `UC-01`) or generate sequentially | Yes |
| `name` | Text after the colon in the heading | Yes |
| `actor` | `**Actor:**` or `**Actors:**` field | No |
| `description` | `**Description:**` field or first paragraph after heading | No |
| `primaryFlow` | `**Primary Flow:**` numbered steps | No |
| `alternativeFlows` | `**Alternative Flows:**` sub-items | No |
| `edgeCases` | `**Edge Cases:**` items | No |
| `preconditions` | `**Preconditions:**` items | No |
| `postconditions` | `**Postconditions:**` items | No |
| `successMetrics` | `**Success Metrics:**` items | No |

**Phase detection**: Search the PO Spec for phase references:
- Look for `**Phase N:**` sections in Section 8 (Next Steps / Roadmap)
- Cross-reference use case names or keywords with phase deliverables
- If no phase structure found, all UCs default to `Phase 1`

**Requirement extraction**: Each use case yields N traceable requirements:

| Requirement Source | What becomes a requirement |
|--------------------|---------------------------|
| Primary Flow | Each step that implies system behavior (skip pure UI navigation) |
| Alternative Flows | Each alternative scenario |
| Edge Cases | Each edge case with its handling |
| Preconditions | Authentication, role, or system state requirements |
| Postconditions | System state changes that must be supported |
| Success Metrics | Performance, quality, or UX targets |

For **simplified PO Specs** (bullet-point format without formal UC structure), each bullet under the Use Cases section becomes one requirement.

**Extraction filter — strip "how" from PO Spec requirements**: When the PO Spec mentions specific technologies, integration paths, or implementation details (e.g., "integrate with Push Notification Gateway via FCM"), extract only the business capability ("push notification delivery with status tracking") as the traceable requirement. The architecture team decides the "how" — the traceability check validates the "what."

---

### Step 4 — Search Architecture Docs for Coverage

For each requirement from Step 3, search the architecture files for coverage evidence. Map requirement types to architecture sections:

| Requirement Type | Primary Search Targets |
|-----------------|----------------------|
| Functional behavior (flow steps) | S1+S2 (`docs/01-system-overview.md`), S5 (`docs/components/*.md`) |
| Data operations (CRUD, storage) | S6 (`docs/04-data-flow-patterns.md`), S5 |
| External integrations | S7 (`docs/05-integration-points.md`) |
| Authentication / authorization | S9 (`docs/07-security-architecture.md`) |
| Performance / latency targets | S10 (`docs/08-scalability-and-performance.md`) |
| Error handling / edge cases | S5, S11 (`docs/09-operational-considerations.md`) |
| Monitoring / operations | S11 (`docs/09-operational-considerations.md`) |

**Coverage classification**:

- **✅ Covered**: Architecture docs explicitly address this requirement. Evidence includes section reference + brief quote (max 100 chars).
- **⚠️ Partial**: Architecture docs mention related concepts but don't fully address the requirement. Evidence shows what's present; gap describes what's missing.
- **❌ Not Covered**: No evidence found in any architecture doc. Suggest which architecture section should document this.

**Important**: Coverage matching is **semantic, not lexical**. The PO Spec may say "User configures schedule" while the architecture says "Cron-based scheduling." Use architectural understanding to determine coverage — grep is a locating hint, classification is judgment.

**PO Spec Scope Rule — "What" vs "How"**:

The PO Spec defines **what** the business needs (capabilities, outcomes, constraints). It does **not** define **how** the architecture implements those needs (technology choices, integration paths, component decomposition). When evaluating coverage:

- **Evaluate the business capability**, not the implementation path. If the PO Spec says "Push Notification Gateway integration" but the architecture delegates push delivery to a different component that achieves the same outcome, the requirement is **✅ Covered** — the business need (push notifications) is satisfied.
- **Never flag a gap** because the architecture uses a different integration path, technology, or component structure than the PO Spec imagined. The PO owns the "what"; the architecture team owns the "how."
- **Do flag a gap** when the business capability itself is missing — e.g., the PO Spec requires push notifications but no component in the architecture handles push delivery at all.
- When the architecture satisfies the requirement through a different path than the PO Spec expected, note this in the evidence column: `"Covered via [component/path] (differs from PO Spec's expected [path])"`

---

### Step 5 — Compute Summary Statistics

Before generating the report, compute:
- Total requirements count (all UCs combined)
- Covered / Partial / Not Covered counts and percentages
- Per-use-case coverage percentages
- Per-phase coverage breakdown (if phases detected)

---

### Step 6 — Generate Markdown Report

Write `TRACEABILITY_REPORT.md` at the project root using this format:

```markdown
# PO Spec Use Cases vs Architecture Coverage

**PO Spec**: [filename]
**Architecture**: ARCHITECTURE.md
**Date**: YYYY-MM-DD

## Summary

| Metric | Count | % |
|--------|-------|---|
| Total Requirements | N | — |
| ✅ Covered | N | N% |
| ⚠️ Partial | N | N% |
| ❌ Not Covered | N | N% |

### Coverage by Phase

| Phase | Requirements | Covered | Partial | Gaps | Coverage |
|-------|-------------|---------|---------|------|----------|
| Phase 1 | N | N | N | N | N% |
| Phase 2 | N | N | N | N | N% |

---

## UC-01: [Name] — [Phase]

**Actor**: [actor]
**Coverage**: N/N requirements (N%)

| PO Spec Requirement | Architecture Coverage | Status |
|---------------------|----------------------|--------|
| [requirement text] | [evidence: section + quote] | ✅ Covered |
| [requirement text] | [evidence] | ⚠️ Partial |
| [requirement text] | — | ❌ Not Covered |

(repeat for each use case)

---

## Gap Report

Requirements that need architecture documentation attention:

### ❌ Not Covered

| UC | Requirement | Source | Suggested Section |
|----|-------------|--------|-------------------|
| [UC-id] | [text] | [Primary Flow / Alt Flow / Edge Case / etc.] | [S-number (section name)] |

### ⚠️ Partial

| UC | Requirement | Evidence | Gap |
|----|-------------|----------|-----|
| [UC-id] | [text] | [what's documented] | [what's missing] |
```

**Overwrite policy**: `TRACEABILITY_REPORT.md` is regenerated fresh on each run (not date-stamped).

---

### Step 7 — Report to User

Show summary to the user:

```
Traceability report generated.

PO Spec: [filename] → Architecture: ARCHITECTURE.md
Coverage: N% (N/N requirements covered)
  ✅ N covered · ⚠️ N partial · ❌ N gaps

Report: TRACEABILITY_REPORT.md

Copy the Gap Report section to address coverage gaps using /skill architecture-docs.
```

---

## Integration with Other Skills

| Skill | Relationship |
|-------|-------------|
| `architecture-readiness` | Prerequisite: PO Spec must exist. If not found, direct user to create one. |
| `architecture-docs` | Prerequisite: ARCHITECTURE.md + docs/ must exist. Gap Report output guides users to update architecture using this skill. |
| `architecture-peer-review` | Complementary: peer review validates architecture quality; traceability validates business requirement coverage. |
| `architecture-compliance` | Complementary: compliance validates organizational standards; traceability validates PO Spec coverage. |

---

## Example Invocations

```
/skill architecture-traceability
→ Locates PO Spec and architecture docs, generates coverage report

"Check if my architecture covers all the PO Spec use cases"
→ Same as above

"Generate a traceability matrix"
→ Same as above

"Are we deviating from the PO Spec?"
→ Generates report highlighting gaps and partial coverage
```

---

## Success Criteria

A successful traceability report produces:

- [ ] All use cases from the PO Spec are listed with their requirements
- [ ] Every requirement has a coverage status (Covered / Partial / Not Covered)
- [ ] Covered requirements include evidence citations (section + quote)
- [ ] Gap Report lists all Not Covered and Partial items with suggested sections
- [ ] Summary statistics are accurate
- [ ] `TRACEABILITY_REPORT.md` renders correctly in GitHub/external platforms
