# Async Intake Guide

## Purpose

Extract Product Owner Specification requirements from asynchronous sources — tickets, emails, requirements documents, or any text provided out-of-band — and produce a structured gap report the architect can use to gather missing information from the requester without a live conversation.

**Key principle**: This mode never asks the user questions interactively. All gaps are captured in a written gap report with ready-to-send questions.

---

## Step 1: Locate the Context File

Ask the user for the file path if not already provided. Also auto-detect files matching these patterns in the project root:

- `business-context.*`
- `ticket-*.*`
- `requirements-*.*`
- `email-*.*`
- `intake-*.*`

If multiple files match, list them and ask which one to process.

---

## Step 2: Content Extraction Rules

Read the full file. Map every piece of information to one or more of the 8 PO Spec sections using the keyword indicators below.

### Section Keyword Indicators

| PO Spec Section | Weight | Keywords / Signal Phrases |
|----------------|--------|---------------------------|
| **1. Business Context** | 1.0 | problem, opportunity, market, industry, background, current situation, pain point, why, challenge, driver, motivation, initiative, strategic |
| **2. Stakeholders & Users** | 0.5 | user, customer, persona, role, team, department, manager, operator, end-user, who will use, audience, actor, beneficiary |
| **3. Business Objectives** | 1.5 | goal, objective, target, outcome, increase, reduce, improve, achieve, KPI, OKR, business value, ROI, expected result, by [date/quarter] |
| **4. Use Cases** | 2.5 | use case, scenario, flow, process, when a user, step, workflow, journey, happy path, edge case, exception, user needs to, should be able to |
| **5. User Stories** | 0.5 | as a [role], I want, so that, story, acceptance criteria, given/when/then, feature request |
| **6. UX Requirements** | 1.0 | experience, interface, usability, response time, latency, load time, accessibility, mobile, browser, notification, alert, dashboard, report, UX, UI |
| **7. Business Constraints** | 2.0 | budget, cost, timeline, deadline, launch date, compliance, regulation, GDPR, SOC2, PCI, legal, vendor, integration, must use, cannot change, approved, mandate, restriction |
| **8. Success Metrics & KPIs** | 1.0 | measure, metric, KPI, baseline, target, benchmark, success, tracking, report, dashboard, SLA, adoption rate, conversion, retention, NPS, % |

**Mapping rules**:
- A sentence can map to multiple sections
- When in doubt, err on the side of inclusion (false positives are better than false negatives at this stage)
- Mark a section as present only if substantive content exists — a single word mention does not count

---

## Step 3: Scoring per Section

For each section, assign a completeness percentage using the thresholds from `PO_SPEC_SCORING_GUIDE.md`:

| Completeness | Score |
|-------------|-------|
| 0% | 0 |
| 25% | 25 |
| 50% | 50 |
| 75% | 75 |
| 100% | 100 |

Apply section weights and compute:

```
Total Score = SUM((Section Completeness % / 100) × Section Weight)
```

Example: Use Cases at 50% → 0.50 × 2.5 = 1.25 points out of a possible 2.5.

---

## Step 4: Gap Analysis

For each section where completeness < 75%:

1. Identify the specific sub-criteria that are missing (reference `PO_SPEC_SCORING_GUIDE.md` for sub-criteria per section)
2. Assign priority based on section weight:
   - **HIGH** (weight ≥ 1.5): Use Cases (2.5), Business Constraints (2.0), Business Objectives (1.5)
   - **MEDIUM** (weight 1.0): Business Context (1.0), UX Requirements (1.0), Success Metrics (1.0)
   - **LOW** (weight 0.5): Stakeholders & Users (0.5), User Stories (0.5)
3. Generate 2-3 ready-to-send questions per gap section (see Question Generation Rules below)

---

## Step 5: Question Generation Rules

Questions must be:
- **Specific** — not "tell me more about stakeholders" but "Who are the 3 primary user groups and what daily task does each struggle with today?"
- **Answerable** — can be answered in 1-3 sentences without a meeting
- **Business-language** — no technical jargon
- **Independent** — each question stands alone; the requester can answer them in any order

### Question Templates by Section

**Business Context (1.0)**
- "What specific business problem is this initiative solving, and why is solving it urgent now?"
- "What is the current state (manual process, existing system, competitor gap) that this replaces or improves?"
- "Which business unit or strategic objective does this initiative directly support?"

**Stakeholders & Users (0.5)**
- "Who are the primary users of this system — list up to 3 roles with a one-sentence description of each?"
- "Which internal teams (other than the requesting team) are affected by or depend on this initiative?"
- "Is there a specific user persona or customer segment that is the priority target for launch?"

**Business Objectives (1.5)**
- "What are the 2-3 most important business outcomes expected from this initiative? (e.g., reduce processing time by X%, increase revenue by $Y)"
- "By what date or quarter are these outcomes expected to be measurable?"
- "How will leadership know this initiative was successful — what does 'done' look like?"

**Use Cases (2.5)**
- "Walk me through the most common scenario a user will perform: what triggers it, what steps do they take, and what is the expected result?"
- "What happens when the normal flow fails or an exception occurs — how should the system or user respond?"
- "List 2-3 other scenarios (beyond the main one) that the system must support at launch."

**User Stories (0.5)**
- "Can you provide 3-5 user stories in the format: As a [role], I want [capability] so that [benefit]?"
- "What acceptance criteria would make each story 'done' from a business perspective?"

**UX Requirements (1.0)**
- "Are there performance expectations (e.g., pages must load within 2 seconds, reports must generate in under 30 seconds)?"
- "Are there accessibility, mobile, or browser requirements the solution must meet?"
- "What notifications, alerts, or reports do users expect from the system?"

**Business Constraints (2.0)**
- "What is the approved budget range for this initiative?"
- "What is the target launch date or deadline, and are there any milestones before that?"
- "Are there regulatory, compliance, or legal requirements this solution must meet (e.g., GDPR, SOC2, PCI-DSS)?"
- "Are there existing systems, vendors, or platforms the solution must integrate with or cannot replace?"

**Success Metrics & KPIs (1.0)**
- "What are the 2-3 key metrics that will be tracked to measure success?"
- "What is the current baseline for each metric (where things stand today)?"
- "What is the target value for each metric, and within what timeframe?"

---

## Step 6: Gap Report Template

Save as `PO_SPEC_GAP_REPORT.md` in the project root:

```markdown
# PO Spec Gap Report

**Source file**: [filename]
**Processed**: [YYYY-MM-DD]
**Score**: [X.X]/10.0 — [Interpretation: Not ready / Ready with gaps / Ready]
**Threshold**: ≥7.5/10 required for architecture handoff

---

## Extraction Summary

| Section | Weight | Completeness | Score | Status |
|---------|--------|-------------|-------|--------|
| Business Context | 1.0 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| Stakeholders & Users | 0.5 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| Business Objectives | 1.5 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| Use Cases | 2.5 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| User Stories | 0.5 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| UX Requirements | 1.0 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| Business Constraints | 2.0 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| Success Metrics & KPIs | 1.0 | [X]% | [X.XX] | ✅ / ⚠️ / ❌ |
| **Total** | **10.0** | | **[X.X]** | |

Legend: ✅ ≥75% · ⚠️ 50–74% · ❌ <50%

---

## What Was Found

> Brief summary of what the source file covered well (1-3 sentences).

---

## Gaps & Questions to Send Back

> Send these questions to the requester to fill the identified gaps.
> Priority order: HIGH → MEDIUM → LOW.

### [Section Name] — [HIGH / MEDIUM / LOW] Priority

**What's missing**: [specific sub-criteria not covered]

**Questions**:
1. [Question 1]
2. [Question 2]
3. [Question 3 — optional]

---
[Repeat for each section below 75%]

---

## Next Steps

1. Send the gap questions above to the requester (copy the "Gaps & Questions" section)
2. Once you receive their answers, either:
   - **Re-run async intake**: Add answers to the source file and re-run `/skill architecture-readiness` with async intake
   - **Paste inline**: Share the answers directly in this conversation — the skill will score and draft the PO Spec
3. Target score ≥7.5/10 before proceeding to architecture design

[If score ≥ 7.5 — add this section instead:]
## PO Spec Draft

A draft `PRODUCT_OWNER_SPEC.md` has been saved based on extracted data.
Fields marked `[Default — confirm before architecture handoff]` were inferred and should be confirmed with the requester.
```

---

## Step 7: Score-Based Output Decision

| Score | Action |
|-------|--------|
| ≥ 7.5 | Save `PO_SPEC_GAP_REPORT.md` + draft `PRODUCT_OWNER_SPEC.md` (with `[Default]` flags) |
| < 7.5 | Save `PO_SPEC_GAP_REPORT.md` only — do NOT draft a PO Spec |

In both cases: report the score, highlight the top 3 gaps by priority, and present the next steps to the user.

⛔ **This flow NEVER transitions to elicitation.** The gap report with its Ready-to-Send Message is the final output. Do NOT start a discovery interview.

---

## Step 8: Ready-to-Send Message (Email/Ticket/Slack)

**Always include this section at the end of `PO_SPEC_GAP_REPORT.md`** when there are gaps (score < 7.5 or any section below 75%).

This block is designed to be copied directly into an email, ticket, or Slack message and sent to the business requester.

### Template

```markdown
## Ready-to-Send Message

> Copy the block below and send it to the requester via email, ticket, or message:

---

**Subject: Additional Information Needed — Architecture Requirements ({project_name})**

Hi,

Thank you for the business context provided in `{source_file}`. We've analyzed it against our architecture requirements framework and identified areas where we need additional information before proceeding with the technical architecture design.

**Current Score: {score}/10.0** (minimum 7.5 required to proceed)

**HIGH Priority — Please address these first:**

{For each HIGH priority gap (sections with weight ≥ 1.5 and completeness < 75%):}
{N}. **{Section Name}**: {Gap question}

**MEDIUM Priority:**

{For each MEDIUM priority gap (sections with weight < 1.5 and completeness < 75%):}
{N}. **{Section Name}**: {Gap question}

Please respond to this message with your answers. Once received, we'll complete the requirements assessment and proceed to architecture design.

Best regards,
Architecture Team

---
```

### Rules

- **Subject line**: Always include the project name
- **Score**: Show current score and the 7.5 threshold
- **Question ordering**: HIGH priority first (Use Cases weight 2.5, Business Constraints 2.0, Business Objectives 1.5), then MEDIUM
- **Questions**: Use the exact gap questions generated in Step 6, not summaries
- **No technical language**: The requester is a business stakeholder — keep questions business-focused
- **Max 8 questions**: If more gaps exist, prioritize by weight and combine related questions
