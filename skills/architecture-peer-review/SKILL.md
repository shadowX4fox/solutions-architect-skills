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
| `PEER_REVIEW_CRITERIA.md` | All review checks organized by depth level and category (82 checks across 13 categories) |
| `PLAYGROUND_TEMPLATE.md` | Custom playground template for the interactive review HTML file |
| `agents/peer-review-category-agent.md` | Universal category reviewer sub-agent — evaluates one category's checks in parallel |

---

## Workflow

### Step 1 — Locate Architecture Document

Search for `ARCHITECTURE.md` at the project root.

**Multi-file structure detected** if `ARCHITECTURE.md` exists as a navigation index and a `docs/` directory contains numbered section files. In this case, the full architecture spans:
- `ARCHITECTURE.md` (navigation index)
- `docs/NN-section-name.md` files (one per section)
- `docs/components/NN-component-name.md` files (or `docs/components/<system>/NN-*.md` for multi-system architectures)
- `adr/*.md` files (for Hard depth)

**Monolithic structure**: A single `ARCHITECTURE.md` file contains all 12 sections.

If no `ARCHITECTURE.md` is found, abort with: *"No ARCHITECTURE.md found. Use `/skill architecture-docs` to create one first."*

---

### Step 2 — Select Review Depth (BLOCKING — user must choose)

Present the three options. **Do not default or assume.** If the user says "review my architecture" without specifying depth, ask.

---

**Choose review depth:**

**Light** (~40 sec)
Structural check: are all required sections present? Do naming conventions follow standards? Are required fields populated?
- Checks: STRUCT (5), NAMING (5), SECTIONS (12) = 22 checks — 3 parallel agents

**Medium** (~90 sec)
Everything in Light plus content quality: are sections internally consistent? Do technology choices make sense together? Are integration patterns sound? Are metrics realistic?
- Checks: Light + COHERENCE (7), TECH (5), INTEG (5), METRICS (5) = 44 checks — 7 parallel agents

**Hard** (~2-3 min)
Everything in Medium plus deep architectural analysis: scalability design, security posture, performance patterns, operational readiness, ADR quality, trade-off honesty, TOGAF/BIAN alignment.
- Checks: Medium + SCALE (7), SECURITY (9), PERF (5), OPS (7), ADR (5), TRADEOFF (5) = 82 checks — 13 parallel agents

---

### Step 3 — Load Review Criteria

Read `PEER_REVIEW_CRITERIA.md`. Parse it into per-category blocks — one block per category, containing that category's full markdown criteria table (header row + all check rows).

Active categories by depth:

| Depth | Active Categories |
|-------|-----------------|
| Light | STRUCT, NAMING, SECTIONS |
| Medium | STRUCT, NAMING, SECTIONS, COHERENCE, TECH, INTEG, METRICS |
| Hard | All 13: STRUCT, NAMING, SECTIONS, COHERENCE, TECH, INTEG, METRICS, SCALE, SECURITY, PERF, OPS, ADR, TRADEOFF |

Store for each active category:
- `code` — e.g., `SECURITY`
- `name` — e.g., `Security Posture`
- `weight` — as defined in the Scoring Weights table
- `checks_table` — the full markdown table text for that category (to be passed to the sub-agent)

---

### Step 4 — Read Architecture Document

**For monolithic ARCHITECTURE.md**: Read the full file. Track all line numbers.

**For multi-file structure**: Read files in this order, concatenating content with file separator markers for the playground:
1. `ARCHITECTURE.md`
2. `docs/NN-*.md` files in numeric order
3. `docs/components/NN-*.md` and `docs/components/*/NN-*.md` files in numeric order (for Medium and Hard depth)
4. `adr/*.md` files in alphabetic order (for Hard depth only)

Track line numbers per source file (each file restarts at line 1).

Store the concatenated result as `doc_content` — this exact string is passed to every category agent.

---

### Step 5 — Perform Review (Parallel Category Agents)

Spawn one `peer-review-category-agent` per active category. **Issue all Task() calls in a single message** so the harness runs them concurrently.

All agents use: `solutions-architect-skills:peer-review-category-agent`

**Agent prompt template:**
```
Review category.
category_code: [CODE]
category_name: [Name]
weight: [0.XX]
depth_level: [light|medium|hard]

CHECKS:
[paste the full markdown criteria table for this category]

DOCUMENT:
[paste the full doc_content — all files concatenated with --- path --- separators]
```

**LIGHT depth — single message with 3 agents:**
```python
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="STRUCT — Structural Completeness",
     prompt="Review category.\ncategory_code: STRUCT\ncategory_name: Structural Completeness\nweight: 0.10\ndepth_level: light\n\nCHECKS:\n[STRUCT checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="NAMING — Naming & Conventions",
     prompt="Review category.\ncategory_code: NAMING\ncategory_name: Naming & Conventions\nweight: 0.05\ndepth_level: light\n\nCHECKS:\n[NAMING checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="SECTIONS — Section Completeness",
     prompt="Review category.\ncategory_code: SECTIONS\ncategory_name: Section Completeness\nweight: 0.10\ndepth_level: light\n\nCHECKS:\n[SECTIONS checks table]\n\nDOCUMENT:\n[doc_content]")
```

**MEDIUM depth — single message with 7 agents** (Light 3 + 4 more):
```python
# ... same 3 Light agents above, plus:
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="COHERENCE — Content Coherence",
     prompt="Review category.\ncategory_code: COHERENCE\ncategory_name: Content Coherence\nweight: 0.10\ndepth_level: medium\n\nCHECKS:\n[COHERENCE checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="TECH — Technology Alignment",
     prompt="Review category.\ncategory_code: TECH\ncategory_name: Technology Alignment\nweight: 0.10\ndepth_level: medium\n\nCHECKS:\n[TECH checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="INTEG — Integration Soundness",
     prompt="Review category.\ncategory_code: INTEG\ncategory_name: Integration Soundness\nweight: 0.10\ndepth_level: medium\n\nCHECKS:\n[INTEG checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="METRICS — Metric Realism",
     prompt="Review category.\ncategory_code: METRICS\ncategory_name: Metric Realism\nweight: 0.05\ndepth_level: medium\n\nCHECKS:\n[METRICS checks table]\n\nDOCUMENT:\n[doc_content]")
```

**HARD depth — single message with 13 agents** (Medium 7 + 6 more):
```python
# ... same 7 Medium agents above, plus:
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="SCALE — Scalability Design",
     prompt="Review category.\ncategory_code: SCALE\ncategory_name: Scalability Design\nweight: 0.10\ndepth_level: hard\n\nCHECKS:\n[SCALE checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="SECURITY — Security Posture",
     prompt="Review category.\ncategory_code: SECURITY\ncategory_name: Security Posture\nweight: 0.10\ndepth_level: hard\n\nCHECKS:\n[SECURITY checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="PERF — Performance Design",
     prompt="Review category.\ncategory_code: PERF\ncategory_name: Performance Design\nweight: 0.05\ndepth_level: hard\n\nCHECKS:\n[PERF checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="OPS — Operational Readiness",
     prompt="Review category.\ncategory_code: OPS\ncategory_name: Operational Readiness\nweight: 0.05\ndepth_level: hard\n\nCHECKS:\n[OPS checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="ADR — ADR Quality",
     prompt="Review category.\ncategory_code: ADR\ncategory_name: ADR Quality\nweight: 0.05\ndepth_level: hard\n\nCHECKS:\n[ADR checks table]\n\nDOCUMENT:\n[doc_content]"),
Task(subagent_type="solutions-architect-skills:peer-review-category-agent",
     description="TRADEOFF — Trade-off Honesty",
     prompt="Review category.\ncategory_code: TRADEOFF\ncategory_name: Trade-off Honesty\nweight: 0.05\ndepth_level: hard\n\nCHECKS:\n[TRADEOFF checks table]\n\nDOCUMENT:\n[doc_content]")
```

**[BARRIER — wait for all agents to complete]**

---

### Step 5.2 — Collect and Merge Results

After all agents return:

1. **Collect** the `CATEGORY_REVIEW_RESULT:` JSON block from each agent response.

2. **Check for failures.** If any agent failed to return a valid result:
   - Report which category failed (e.g., "⚠️ SECURITY agent failed — findings for this category unavailable")
   - Offer to retry: "Would you like me to re-run the failed categories?"
   - Continue processing successful results.

3. **Merge** all `findings` arrays from all `CATEGORY_REVIEW_RESULT` blocks into a single flat `findings` array.

4. **Renumber IDs** sequentially across the merged array (1, 2, 3...). Sort order: by category depth level (LIGHT categories first, then MEDIUM, then HARD), then by severity within each category (critical → major → minor → suggestion).

5. **Report progress:**
   ```
   ✅ Review complete — N categories, M total findings (X critical, Y major, Z minor, Z suggestions)
   Generating scorecard and playground...
   ```

The `findings` array is now ready for Step 6 (scorecard) and Step 7 (playground).

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
| `architecture-definition-record` | For ADR fixes found during Hard review (ADR quality checks), delegate any ADR creation, update, or supersede to this skill. Read-only access to `adr/*.md` is permitted directly. |
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

- [ ] All category agents for the chosen depth level complete (no skipped categories)
- [ ] Every finding has a specific `lineRef` pointing to actual content in the document
- [ ] Every finding has an actionable `recommendation` (not vague advice)
- [ ] Scorecard shows a score and rating for each active category
- [ ] Interactive HTML playground is generated and opened in browser
- [ ] Fix prompt output groups findings by severity and includes file/line references
- [ ] Findings are peer-review quality — the kind a senior architect would write
