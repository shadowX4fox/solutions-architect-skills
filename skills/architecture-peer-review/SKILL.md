---
name: architecture-peer-review
description: Use this skill to perform a Solution Architect peer review of ARCHITECTURE.md documents. Generates an interactive HTML playground for reviewing and triaging findings with approve/reject/comment workflow. Invoke when the user asks to review, critique, peer-review, or assess architecture documentation quality, asks for architecture feedback or a second opinion, or wants scalability/security/performance analysis of their architecture.
triggers:
  - peer review
  - review architecture
  - architecture quality
---

# Architecture Peer Review Skill

## Purpose

This skill acts as a **Solution Architect peer reviewer** for ARCHITECTURE.md documents. It evaluates design decisions, questions trade-offs, identifies risks, and assesses real-world viability — the kind of review a senior architect would give in a design review meeting.

The output is an **interactive HTML playground** (via the `playground` plugin) where the user triages findings, approves or rejects each one, adds comments, and copies a fix prompt back to Claude.

**Distinct from** the `architecture-docs` skill's REVIEW_AUDIT_WORKFLOW: that workflow validates form compliance (structure, template adherence). This skill provides opinionated architectural judgment on quality, soundness, and production-readiness.

---

## When to Invoke This Skill

- User asks to "peer review", "review architecture", "critique architecture", or "assess architecture quality"
- User asks for "architecture feedback", "design review", or "architecture assessment"
- User wants a second opinion on their ARCHITECTURE.md
- User asks for scalability, security, or performance review of their architecture
- User uses `/skill architecture-peer-review`

**Do NOT invoke for:**
- Form/template compliance validation → use `architecture-docs` skill (REVIEW_AUDIT_WORKFLOW)
- Compliance contract generation → use `architecture-compliance` skill
- Creating or editing ARCHITECTURE.md → use `architecture-docs` skill
- Business requirements review → use `architecture-readiness` skill
- Component index updates → use `architecture-component-guardian` skill

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — entry point and workflow |
| `PEER_REVIEW_CRITERIA.md` | All review checks organized by depth level and category (60+ checks across 13 categories) |
| `PLAYGROUND_TEMPLATE.md` | Custom playground template for the interactive review HTML file |

---

## Workflow

### Step 1 — Locate Architecture Document

Search for `ARCHITECTURE.md` at the project root.

**Multi-file structure detected** if `ARCHITECTURE.md` exists as a navigation index and a `docs/` directory contains numbered section files. In this case, the full architecture spans:
- `ARCHITECTURE.md` (navigation index)
- `docs/NN-section-name.md` files (one per section)
- `docs/components/NN-component-name.md` files
- `adr/*.md` files (for Hard depth)

**Monolithic structure**: A single `ARCHITECTURE.md` file contains all 12 sections.

If no `ARCHITECTURE.md` is found, abort with: *"No ARCHITECTURE.md found. Use `/skill architecture-docs` to create one first."*

---

### Step 2 — Select Review Depth (BLOCKING — user must choose)

Present the three options. **Do not default or assume.** If the user says "review my architecture" without specifying depth, ask.

---

**Choose review depth:**

**Light** (~2 min)
Structural check: are all required sections present? Do naming conventions follow standards? Are required fields populated?
- Checks: STRUCT (5), NAMING (5), SECTIONS (12) = 22 checks

**Medium** (~5 min)
Everything in Light plus content quality: are sections internally consistent? Do technology choices make sense together? Are integration patterns sound? Are metrics realistic?
- Checks: Light + COHERENCE (7), TECH (5), INTEG (5), METRICS (5) = 44 checks

**Hard** (~10 min)
Everything in Medium plus deep architectural analysis: scalability design, security posture, performance patterns, operational readiness, ADR quality, trade-off honesty, TOGAF/BIAN alignment.
- Checks: Medium + SCALE (7), SECURITY (9), PERF (5), OPS (7), ADR (5), TRADEOFF (5) = 82 checks

---

### Step 3 — Load Review Criteria

Read `PEER_REVIEW_CRITERIA.md`. Load only the depth-relevant sections:
- **Light**: Load STRUCT, NAMING, SECTIONS
- **Medium**: Load STRUCT, NAMING, SECTIONS + COHERENCE, TECH, INTEG, METRICS
- **Hard**: Load all 13 category sections

---

### Step 4 — Read Architecture Document

**For monolithic ARCHITECTURE.md**: Read the full file. Track all line numbers.

**For multi-file structure**: Read files in this order, concatenating content with file separator markers for the playground:
1. `ARCHITECTURE.md`
2. `docs/NN-*.md` files in numeric order
3. `docs/components/NN-*.md` files in numeric order (for Medium and Hard depth)
4. `adr/*.md` files in alphabetic order (for Hard depth only)

Track line numbers per source file (each file restarts at line 1).

---

### Step 5 — Perform Review

Apply every check from the loaded criteria against the document content. For each failed check, create a finding object:

```
{
  id: <sequential integer>,
  file: <source file path>,
  lineRef: "Lines N–M" or "Line N",
  checkId: <e.g., "SECURITY-04">,
  category: <category code, e.g., "SECURITY">,
  categoryName: <category name, e.g., "Security Posture">,
  severity: <"critical" | "major" | "minor" | "suggestion">,
  depthLevel: <"light" | "medium" | "hard">,
  title: <short descriptive title, max 60 chars>,
  finding: <what was found — current state of the document, 1-3 sentences>,
  recommendation: <what a Solution Architect would recommend — specific and actionable>,
  rationale: <why this matters architecturally — real-world consequences>,
  status: "pending",
  userComment: ""
}
```

**Finding quality rules:**
- `finding` describes the current state (not the solution)
- `recommendation` is specific — name technologies, patterns, thresholds (not "improve X")
- `rationale` states real-world consequences of leaving the issue unaddressed
- `lineRef` points to the specific lines in the document where the issue exists
- If a check passes cleanly, do not create a finding for it

---

### Step 6 — Generate Scorecard

After collecting all findings, calculate scores per category:

**Per-category score:**
1. Start at 10.0
2. Subtract per finding in that category:
   - Critical: −2.5
   - Major: −1.5
   - Minor: −0.5
   - Suggestion: no deduction
3. Floor at 0.0

**Overall score** = weighted average of active category scores using weights from `PEER_REVIEW_CRITERIA.md`.

**Renormalization for partial depths:**
- Light: active weights are STRUCT (0.40), NAMING (0.20), SECTIONS (0.40)
- Medium: distribute proportionally across the 7 active categories
- Hard: use full weights as defined

**Rating bands:**
| Score | Label |
|-------|-------|
| 9.0–10.0 | Production-ready |
| 7.5–8.9 | Minor improvements recommended |
| 5.0–7.4 | Significant gaps — address before implementation |
| 0.0–4.9 | Major rework needed |

---

### Step 7 — Generate Interactive Playground

Invoke the `playground` skill using `PLAYGROUND_TEMPLATE.md` as the template.

Embed in the generated HTML file:
1. `docContent` — full document text with file separator markers (see PLAYGROUND_TEMPLATE.md)
2. `findings` — the findings array as a JSON literal
3. `scorecard` — the calculated scorecard (overall score, rating, per-category scores)
4. `depthLevel` — the chosen depth level

Follow all core playground requirements:
- Single HTML file, no external dependencies
- Dark theme, system font for UI
- Open in browser after writing: `open <filename>.html`

**Filename convention:** `architecture-peer-review-<YYYY-MM-DD>.html`

**Fallback** — If the `playground` plugin is not installed, output the findings as a structured plain-text report instead:

```
# Architecture Peer Review Report
Date: <date>
Depth: <level>
Overall Score: <score>/10 — <rating>

## Scorecard
...

## Findings (<N> total)
...
```

---

### Step 8 — User Triages Findings

The user reviews findings in the browser playground, approves/rejects each one, and adds comments where needed. When done, they copy the generated fix prompt.

---

### Step 9 — Apply Fixes (Optional)

If the user pastes the generated fix prompt back into Claude, apply the approved findings using the `architecture-docs` skill's context-efficient editing workflow:
- Load only the affected section files
- Apply each approved recommendation
- Do not alter sections not referenced in the approved findings

---

## Integration with Other Skills

| Skill | Relationship |
|-------|-------------|
| `architecture-docs` | Prerequisite: ARCHITECTURE.md must exist. Architecture docs skill's REVIEW_AUDIT_WORKFLOW validates form before this skill validates quality. Use architecture-docs editing workflow to apply fixes. |
| `playground` | External plugin dependency: generates the interactive HTML review file. |
| `architecture-compliance` | Peer review findings (especially SECURITY and SCALE categories) can inform compliance gap analysis. Hard-depth findings map directly to compliance contract requirements. |
| `architecture-readiness` | If peer review reveals missing business context (vague requirements, unexplained constraints), suggest running `architecture-readiness` to produce a PO Spec. |

---

## Example Invocations

```
/skill architecture-peer-review
→ Skill activates, asks user to choose depth

"Peer review my ARCHITECTURE.md at hard depth"
→ Skips depth prompt, proceeds directly to Hard review

"Do a light review of my architecture"
→ Runs Light depth checks only

"Architecture quality assessment"
→ Skill activates, asks user to choose depth

"Review my architecture — just the security parts"
→ Activates skill, suggests Hard depth and notes only SECURITY category findings will be most relevant
```

---

## Success Criteria

A successful peer review produces:

- [ ] All checks for the chosen depth level are evaluated (no skipped categories)
- [ ] Every finding has a specific `lineRef` pointing to actual content in the document
- [ ] Every finding has an actionable `recommendation` (not vague advice)
- [ ] Scorecard shows a score and rating for each active category
- [ ] Interactive HTML playground is generated and opened in browser
- [ ] Fix prompt output groups findings by severity and includes file/line references
- [ ] Findings are peer-review quality — the kind a senior architect would write
