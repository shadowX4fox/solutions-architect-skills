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
- User asks to "regenerate peer review playground", "rebuild review playground", or "reload peer review results" — activates the **fast path** (Step 0) to regenerate from saved JSON without re-running agents

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

### Step 0 — Check for Existing Review Data (Fast Path)

Before starting a full review, check if the user explicitly requested regeneration from existing data (e.g., "regenerate playground", "rebuild review playground", "reload peer review results").

**If the user requested regeneration:**

1. Glob for `architecture-peer-review-*.json` in the project root.
2. If found, present the most recent file(s) with dates and let the user pick one.
3. Read the selected JSON file and parse it as `reviewData`.
4. **Validate** the JSON contains: `findings` (array), `scorecard` (object with `overall`, `rating`, `categories`), and `depthLevel` (string).
5. **Staleness check**: if the JSON contains `metadata.sourceFiles`, compare each file's `lastModified` timestamp against the current file modification time. If any source file has been modified since the review, warn:
   ```
   ⚠️ Source files changed since this review was saved:
     - docs/07-security-architecture.md (modified 2026-04-05, review from 2026-04-03)
   Results may be stale. Proceed with regeneration or run a fresh review?
   ```
6. If the user confirms, **skip directly to Step 7** (Generate Interactive Playground) using the loaded `reviewData`.
7. Report: `♻️ Regenerated playground from saved results (skipped agent evaluation)`

**If no JSON files found**: inform the user and proceed with the full review workflow (Step 1).

**If the user did NOT request regeneration**: proceed normally to Step 1.

---

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

Active categories for each depth are defined by the **Depth Level** column in the Scoring Weights table in `PEER_REVIEW_CRITERIA.md`.

Store for each active category:
- `code` — e.g., `SECURITY`
- `name` — e.g., `Security Posture`
- `weight` — as defined in the Scoring Weights table
- `checks_table` — the full markdown table text for that category (to be passed to the sub-agent)

---

### Step 4 — Resolve Architecture File List

Determine the ordered list of files to review (`doc_files`). This list is passed to each category agent — agents read the files themselves.

**File discovery order** (same for monolithic and multi-file):
1. `ARCHITECTURE.md` (always)
2. `docs/NN-*.md` files in numeric order (if `docs/` exists)
3. `docs/components/NN-*.md` and `docs/components/*/NN-*.md` files in numeric order (for Medium and Hard depth)
4. `adr/*.md` files in alphabetic order (for Hard depth only)

Store the result as `doc_files` — an ordered list of **absolute file paths**.

---

### Step 5 — Perform Review (Parallel Category Agents)

Spawn one `peer-review-category-agent` per active category. Issue Task() calls in **batches of 2 per message** (strict parallel barrier).

**Batching rule**: dispatch exactly **2 Task() calls per message**. After sending a batch, wait for BOTH `CATEGORY_REVIEW_RESULT:` blocks to return before sending the next batch. Do not start batch N+1 until every Task() in batch N has returned. If any category agent in a batch fails, record the failure and continue with the next batch (do not retry inline; failures are collected and reported at the end). This caps peak parallelism at 2 and gives the orchestrator a chance to observe early failures before dispatching the remaining batches. For Light (3 categories) this is 2 batches (2+1); Medium (7) is 4 batches (2+2+2+1); Hard (13) is 7 batches (2×6 + 1).

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

FILES:
[absolute path 1]
[absolute path 2]
...
```

Pass all file paths from `doc_files` in every agent prompt. Agents read only what they need.

For each active category (from Step 3), issue one Task() call substituting that category's `code`, `name`, `weight`, and the chosen `depth_level`. Set `description` to `"CODE — Name"`. Group categories into pairs in the order they appear in the Scoring Weights table and dispatch each pair in its own message; if there's an odd category left over, it goes in a final 1-agent batch.

- **Light**: 3 agents — STRUCT, NAMING, SECTIONS
- **Medium**: 7 agents — Light + COHERENCE, TECH, INTEG, METRICS
- **Hard**: 13 agents — Medium + SCALE, SECURITY, PERF, OPS, ADR, TRADEOFF

All category codes, names, weights, and depth assignments are in the **Scoring Weights table** in `PEER_REVIEW_CRITERIA.md`.

**[BARRIER — wait for the current batch to complete before dispatching the next batch, and wait for the final batch before proceeding to Step 5.2]**

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

5. **Inject category fields** into each finding from its parent `CATEGORY_REVIEW_RESULT` envelope: set `category`, `categoryName`, and `depthLevel`. Agents omit these from individual findings to reduce output size.

6. **Report progress:**
   ```
   ✅ Review complete — N categories, M total findings (X critical, Y major, Z minor, Z suggestions)
   Generating scorecard and playground...
   ```

The `findings` array is now ready for Step 6 (scorecard) and Step 7 (playground).

---

### Step 6 — Assemble Scorecard

Each `CATEGORY_REVIEW_RESULT` block already contains `score` and `weight` computed by the agent. Assemble the scorecard directly from those values — no recalculation needed.

**Per-category scores**: read `score` and `weight` directly from each agent's result block.

**Renormalization for partial depths** (weights must sum to 1.0 across active categories):
- **Light** (3 categories): STRUCT → 0.40, NAMING → 0.20, SECTIONS → 0.40
- **Medium** (7 categories): divide each original weight by the sum of active weights (0.60) → STRUCT 0.167, NAMING 0.083, SECTIONS 0.167, COHERENCE 0.167, TECH 0.167, INTEG 0.167, METRICS 0.083
- **Hard** (13 categories): use weights as reported by agents (sum to 1.0)

**Overall score** = sum of (category score × renormalized weight) across all active categories.

Apply the **Scorecard Rating Bands** from `PEER_REVIEW_CRITERIA.md` to assign the rating label.

---

### Step 6.1 — Persist Review Data

Write the complete `reviewData` object to a JSON file for future fast-path regeneration (Step 0).

1. **Assemble** the full `reviewData` object:
   ```json
   {
     "depthLevel": "hard",
     "scorecard": { "overall": 7.2, "rating": "...", "categories": [...] },
     "findings": [...],
     "metadata": {
       "reviewDate": "YYYY-MM-DD",
       "sourceFiles": [
         { "path": "docs/07-security-architecture.md", "lastModified": "YYYY-MM-DDTHH:mm:ss" }
       ]
     }
   }
   ```
   - `metadata.reviewDate`: current ISO date
   - `metadata.sourceFiles`: array of `{ path, lastModified }` for each file in `doc_files` (enables staleness detection on fast-path load in Step 0)

2. **Write** to `architecture-peer-review-<YYYY-MM-DD>.json` in the project root (pretty-printed).

3. **Report**: `💾 Review data saved to architecture-peer-review-<date>.json`

---

### Step 7 — Generate Interactive Playground

Invoke the `playground` skill using `PLAYGROUND_TEMPLATE.md` as the template.

The `reviewData` object (containing `findings`, `scorecard`, and `depthLevel`) comes from either:
- **Full review path**: assembled in Steps 5.2 + 6
- **Fast path**: loaded from a saved JSON file (Step 0)

Embed in the generated HTML file:
1. `findings` — the findings array as a JSON literal
2. `scorecard` — the calculated scorecard (overall score, rating, per-category scores)
3. `depthLevel` — the chosen depth level

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

**After the playground opens (or the fallback report prints), always append the following user-visible context-reclaim hint** (verbatim, as the final lines of the skill's output):

```
💡 Tip: findings are saved to `architecture-peer-review-<date>.json` and the playground HTML. To reclaim context from the category-agent responses before your next task, run:
    /compact
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

"Regenerate the peer review playground"
→ Fast path: reads saved JSON, regenerates HTML, skips agent evaluation

"Rebuild the review from the last results"
→ Fast path: reads most recent architecture-peer-review-*.json
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
