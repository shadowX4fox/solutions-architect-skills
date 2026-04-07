# Requirements Elicitation Guide

## 1. Purpose & Scope

This guide directs Claude to conduct a structured requirements discovery interview with a Product Owner (PO) before a PO Spec exists. The output is a **Discovery Summary** followed by a **draft PO Spec** targeting a score ≥ 7.5/10 on the weighted scoring methodology.

**Use this guide when:**
- No existing PO Spec file is found in the project
- The user says they don't know where to start
- The user asks for requirements discovery, elicitation, or a requirements interview
- The user has a business idea but no documented requirements

**Do not use this guide when:**
- A PO Spec already exists → offer Evaluation or Creation workflows instead
- The user explicitly asks for the template only → provide `templates/PO_SPEC_TEMPLATE.md`

---

## 2. Detection Logic

Before starting the interview, scan the project for existing PO Spec files:

```
Search patterns (in order):
1. PRODUCT_OWNER_SPEC.md (exact name)
2. PO_SPEC.md (exact name)
3. **/po-spec* (any location, any extension)
4. **/product-owner* (any location, any extension)
```

**If a file is found:**
> "I found an existing PO Spec at `[path]`. Would you like to:
> - **Evaluate** it to see if it's ready for the architecture team (scored out of 10)
> - **Update** it with new or missing information
> - Start a **new elicitation interview** anyway (replaces or supplements the existing spec)"

**If no file is found:** Proceed with the elicitation interview as described below.

---

## 3. Language Adaptation

This guide is written in English. The interview itself adapts to the user's language:

1. **Detection**: Read the user's first message language. If clearly Spanish, French, Portuguese, etc., conduct the entire interview in that language.
2. **Ambiguous**: Ask once — "Would you prefer to conduct this interview in English or another language?"
3. **Discovery Summary and PO Spec draft**: Always produced in the user's chosen language.
4. **PO Spec section headers**: Keep in English for compatibility with the architecture-docs skill (e.g., "Section 4: Use Cases" not "Sección 4: Casos de Uso").

---

## 4. Interview Introduction

Open the interview with a brief orientation message. Adapt to the user's language. Example (English):

> "I'll guide you through a structured requirements discovery interview to capture the business requirements for your project. We'll cover 4 phases:
>
> - **Phase 1 – Foundation** (~5 min): Business problem and stakeholders
> - **Phase 2 – Value & Boundaries** (~10 min): Goals, success criteria, and constraints
> - **Phase 3 – Behavior** (~15 min): How users interact with the system
> - **Phase 4 – Experience & Measurement** (~8 min): UX expectations and KPIs
>
> At the end I'll summarize what we've covered, confirm it with you, then draft a complete PO Spec. You can answer as much or as little as you know — I'll suggest reasonable industry defaults where you're unsure.
>
> Let's start with the big picture. **What business problem are you trying to solve?**"

---

## 5. Four-Phase Interview Structure

### Score Weight Reference

| Section | Weight | Phase |
|---------|--------|-------|
| Use Cases | 2.5 | Phase 3 |
| Business Constraints | 2.0 | Phase 2 |
| Business Objectives | 1.5 | Phase 2 |
| Business Context | 1.0 | Phase 1 |
| UX Requirements | 1.0 | Phase 4 |
| Success Metrics | 1.0 | Phase 4 |
| Stakeholders & Users | 0.5 | Phase 1 |
| User Stories | 0.5 | Phase 3 |
| **Total** | **10.0** | |

---

### Phase 1 — Foundation

**Sections covered**: Business Context (1.0), Stakeholders & Users (0.5)
**Min exchanges**: 3–5
**Goal**: Understand the business problem, market context, strategic alignment, and who is involved.

**Opening question**: "What business problem are you trying to solve?"

**Topics to cover in Phase 1:**

| Topic | Example probing questions |
|-------|--------------------------|
| Problem statement | "How is this problem being solved today? What's the cost of not solving it?" |
| Market context | "Is this for internal users, customers, or both? What's the competitive context?" |
| Strategic alignment | "Does this align with a specific company initiative or OKR?" |
| Stakeholders | "Who are the key stakeholders — who will sponsor, who will use it, who will be affected?" |
| User personas | "Describe your primary user in one sentence. What's their biggest frustration today?" |
| Domain vocabulary | "Are there domain-specific terms I should know?" |

**Phase transition**: Once problem statement, at least 2 stakeholders, and 1 user persona are captured, transition:
> "Good foundation. Now let's define what success looks like and what constraints we're working within."

---

### Phase 2 — Value & Boundaries

**Sections covered**: Business Objectives (1.5), Business Constraints (2.0)
**Min exchanges**: 5–8
**Goal**: Define goals with metrics and timeframes; surface all constraints. These sections carry 35% of the total score — invest interview depth here.

**Business Objectives topics:**

| Topic | Example probing questions |
|-------|--------------------------|
| Primary goals | "What are the top 3 business outcomes this must achieve?" |
| Measurable targets | "What number would represent success for each goal?" |
| Timeframes | "By when do you need each goal achieved?" |
| Priority forcing | "If you could only achieve one goal at launch, which would it be?" |
| MoSCoW | "Which objectives are Must Have vs. Nice to Have?" |

**Business Constraints topics:**

| Topic | Example probing questions |
|-------|--------------------------|
| Budget | "Is there an approved budget? A ballpark range?" |
| Timeline | "Is there a hard deadline — regulatory, seasonal, executive commitment?" |
| Regulatory/compliance | "Any data privacy laws (GDPR, HIPAA), industry regulations, or audit requirements?" |
| Integration | "What existing systems must this connect to?" |
| Technology | "Are there mandated platforms, languages, or cloud providers?" |
| Resource | "What team size and skills are available?" |
| Operational | "Any uptime, maintenance windows, or support model requirements?" |

**Phase transition**: Once 3+ objectives with targets and 4+ constraints are captured:
> "Excellent. Now let's map out how users will actually interact with the system."

---

### Phase 3 — Behavior

**Sections covered**: Use Cases (2.5), User Stories (0.5)
**Min exchanges**: 6–10
**Goal**: Elicit use cases that capture the full scope of the desired architecture, with flows, alternatives, and edge cases. Derive user stories from use cases. Use Cases carry 25% of the total score — this is the deepest phase. The number of use cases indicates architecture complexity, not a hard minimum.

**Scenario Walking Technique** (primary technique for this phase):

For each use case, walk the PO through this structure:
1. "Who is the actor?" (persona from Phase 1)
2. "What are they trying to accomplish?"
3. "Walk me through the steps — what does the user do first, then what happens?"
4. "What could go wrong at each step?"
5. "How does success look for the user?"
6. "Is there a time constraint or performance expectation for this use case?"

**Target**: Use cases that cover the business scope. Aim to include:
- Primary/happy-path use cases
- Use cases involving error or failure handling
- Use cases involving secondary personas or edge scenarios
The number of use cases reflects architecture complexity — a simple system may need 1-2, a complex one may need 5+.

**Deriving User Stories**: After each use case, extract user stories:
> "From this use case, can we say: As a [persona], I want to [action] so that [benefit]?"

Aim for 3–5 user stories per use case.

**Phase transition**: Once use cases covering the business scope with primary flows are documented:
> "Great. Last phase — let's cover experience expectations and how you'll measure success after launch."

---

### Phase 4 — Experience & Measurement

**Sections covered**: UX Requirements (1.0), Success Metrics (1.0)
**Min exchanges**: 3–5
**Goal**: Define performance, usability, accessibility expectations; establish KPIs with baselines and targets.

**UX Requirements topics:**

| Topic | Example probing questions |
|-------|--------------------------|
| Performance | "How fast do key screens need to load? What's acceptable vs. ideal?" |
| Usability | "Do users need training, or should it be self-service?" |
| Accessibility | "Any accessibility requirements (WCAG, Section 508)?" |
| Cross-platform | "Which devices and browsers must be supported?" |
| Branding | "Are there design system or brand guidelines to follow?" |

**Success Metrics topics:**

| Topic | Example probing questions |
|-------|--------------------------|
| Primary KPIs | "What 3-5 metrics will prove this was a success?" |
| Baselines | "What are those metrics today (before launch)?" |
| Targets | "What number would you celebrate at 3 months? 12 months?" |
| Leading indicators | "What early signals would show you're on track before you hit the big KPIs?" |
| Measurement | "How will you measure these — existing analytics, new instrumentation, surveys?" |

---

## 6. Probing Techniques

Apply these techniques throughout the interview to increase answer depth:

| Technique | When to Use | Pattern |
|-----------|-------------|---------|
| **Broadening** | Answer is too narrow | "Beyond [X], are there other scenarios or users we should consider?" |
| **Deepening** | Answer is surface-level | "Can you quantify that? What's the current baseline and the target?" |
| **Scenario Walking** | Use Cases phase | "Walk me through: [persona] wants to [action]. What's the first thing they do?" |
| **Negative Probing** | Edge cases, constraints | "What happens when [system fails / user makes a mistake / load spikes]?" |
| **Quantification** | Vague goals | "What specific number would represent success for that goal?" |
| **Assumption Surfacing** | Any section | "You're assuming [X] — is that confirmed or still TBD?" |
| **Priority Forcing** | Too many equal goals | "If you could only deliver one thing at launch, which would it be?" |
| **Stakeholder Perspective** | Missing viewpoints | "How would the [ops team / compliance team / end users] experience this?" |
| **Analogies** | Abstract requirements | "Is there an existing product that does something similar? What would you borrow from it?" |

---

## 7. Handling Partial Knowledge

It is normal for POs to not have all answers ready. Handle gaps gracefully:

**Steps when a PO doesn't know an answer:**

1. **Acknowledge**: "That's completely normal at this stage."
2. **Suggest industry defaults**: Offer reasonable ranges from similar projects (see examples below). Clearly label these as suggestions, not requirements.
3. **Record as Open Question**: Add to the Appendix: Open Questions section in the PO Spec.
4. **Identify the knowledge owner**: "Who in your organization might know this?"
5. **Move on**: Don't block the interview — note it and continue.
6. **Flag scoring impact**: If the gap is in a high-weight section (Use Cases, Constraints, Objectives), warn the PO.

**Industry Default Examples** (offer these when PO is unsure):

| Topic | Typical Default / Range |
|-------|------------------------|
| Page load time | "Similar web apps typically target < 3s for initial load, < 1s for subsequent navigations" |
| Uptime SLA | "Business-critical apps typically target 99.9% (8.7h downtime/year)" |
| Checkout abandonment | "E-commerce typically targets < 30% cart abandonment" |
| API response time | "Internal APIs: < 500ms; customer-facing: < 200ms at P95" |
| Onboarding completion | "B2C apps typically target > 60% onboarding completion within 7 days" |
| Support ticket reduction | "Self-service initiatives typically target 20–40% reduction in tier-1 tickets" |

> Always say: "A common default for [topic] in similar projects is [default]. Does that match your expectations, or would you adjust it?"

---

## 8. Question Batching & Pacing

- **Batch**: Ask 2–3 related questions per message. Never fire 5+ questions at once.
- **Summarize** between phases: "Here's what we've captured so far on [Phase N]..." (1–2 sentences, not a full recap)
- **Allow skipping**: Low-weight sections (Stakeholders, User Stories) can be skipped with "I'll fill that later" — accept and note.
- **Push back on high-weight skips**: If the PO tries to skip Use Cases or Business Constraints:
  > "These sections carry [X]% of the readiness score. Skipping them will likely keep the PO Spec below 7.5/10 and delay architecture handoff. Can we spend 5 more minutes here?"
- **Progress check-ins**: After Phase 2, offer an optional pause: "We're about halfway through. Want a quick summary of what we've covered, or shall we continue?"

---

## 9. Discovery Summary (Checkpoint)

After completing all 4 phases, produce a structured Discovery Summary **in the conversation** (do not save as a file). This is a checkpoint — the PO must confirm before drafting.

**Format:**

```
## Discovery Summary

### Section 1: Business Context
- [Key finding 1]
- [Key finding 2]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 2: Stakeholders & Users
- [Key finding 1]
- [Key finding 2]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 3: Business Objectives
- [Key finding 1] (target: [X] by [date])
- [Key finding 2] (target: [X] by [date])
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 4: Use Cases
- Use Case 1: [name] — [one-line description]
- Use Case 2: [name] — [one-line description]
- Use Case 3: [name] — [one-line description]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 5: User Stories
- As a [persona], I want to [action] so that [benefit]
- [additional stories...]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 6: UX Requirements
- [Key finding 1]
- [Key finding 2]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 7: Business Constraints
- Budget: [finding]
- Timeline: [finding]
- Regulatory: [finding]
- Integration: [finding]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

### Section 8: Success Metrics & KPIs
- [Metric 1]: baseline [X] → target [Y] by [date]
- [Metric 2]: baseline [X] → target [Y] by [date]
Confidence: High / Medium / Low
Open Questions: [list or "None"]

---
Does this summary accurately capture what we discussed? Any corrections or additions before I draft the PO Spec?
```

**Wait for PO confirmation** before proceeding to Step 10.

---

## 10. Transition to PO Spec Drafting

After PO approves the Discovery Summary:

1. **Load template**: Read `templates/PO_SPEC_TEMPLATE.md`
2. **Load scoring guide**: Read `PO_SPEC_SCORING_GUIDE.md`
3. **Fill each section**: Populate from the Discovery Summary and elicited data
4. **Industry defaults**: Insert accepted defaults with a note: `[Default — confirm before architecture handoff]`
5. **Open Questions**: Compile all open questions into `Appendix: Open Questions`
6. **Self-assess**: Score the draft against `PO_SPEC_SCORING_GUIDE.md`
7. **Gap loop**:
   - If score ≥ 7.5: proceed to Step 11
   - If score < 7.5: identify the 2–3 lowest-scoring sections, ask targeted follow-up questions, re-score
   - Max 2 gap-loop iterations before accepting current score and flagging gaps explicitly
8. **Save**: Write the final PO Spec to the project root as `PRODUCT_OWNER_SPEC.md`

---

## 11. Score-Aware Priority Matrix

Use this matrix to guide interview depth and gap-loop prioritization:

| Section | Weight | Min. Completeness Target | Points at Target |
|---------|--------|--------------------------|-----------------|
| Use Cases | 2.5 | 85% | 2.13 |
| Business Constraints | 2.0 | 80% | 1.60 |
| Business Objectives | 1.5 | 80% | 1.20 |
| Business Context | 1.0 | 75% | 0.75 |
| UX Requirements | 1.0 | 75% | 0.75 |
| Success Metrics | 1.0 | 75% | 0.75 |
| Stakeholders & Users | 0.5 | 60% | 0.30 |
| User Stories | 0.5 | 60% | 0.30 |
| **Total** | **10.0** | | **7.78** |

Meeting these targets yields ~7.78/10, clearing the 7.5 readiness threshold.

**During the gap loop**: Focus remediation on sections where `actual completeness < target completeness`, weighted by section score impact.

---

## 12. Final Output

After the PO Spec is saved:

> "Your PO Spec has been saved as `PRODUCT_OWNER_SPEC.md` with a self-assessed score of [X]/10.
>
> **Status**: [Ready for architecture handoff ✓ / Needs improvement before handoff]
>
> **Open Questions** ([N] items): These are documented in the Appendix. Resolve them before or during architecture team kickoff.
>
> **Next step**: Share `PRODUCT_OWNER_SPEC.md` with your architecture team and use the `architecture-docs` skill to begin ARCHITECTURE.md."
