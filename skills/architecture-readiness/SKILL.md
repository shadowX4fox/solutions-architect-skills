---
name: architecture-readiness
description: Use this skill for requirements elicitation, discovery interviews, and creating or evaluating Product Owner Specifications documenting business requirements before architecture design
---

# Architecture Readiness Skill

## Description

This skill helps Product Owners document business requirements and context before architecture design begins. It provides templates and guidance for creating Product Owner Specifications that feed into technical ARCHITECTURE.md documents.

The skill includes four primary functions:
1. **Requirements Elicitation**: Guided discovery interview to surface business requirements when no PO Spec exists
2. **PO Spec Creation**: Templates and guidance for documenting business requirements
3. **PO Spec Evaluation**: Scoring methodology to assess if a PO Spec is ready for architecture team handoff
4. **Async Intake**: File-based requirements extraction from tickets, emails, or documents — produces a gap report for async follow-up

## When to Use This Skill

Invoke this skill when:
- No existing PO Spec is found in the project and the user needs to capture business requirements
- User says they don't know where to start with business requirements
- User asks for requirements discovery, elicitation, or a requirements interview
- User asks to create a Product Owner Specification
- User asks about documenting business requirements for architecture
- User mentions "business context", "product requirements", or "requirements gathering" in relation to architecture
- User wants to prepare business documentation before technical architecture design
- User asks to evaluate or score a Product Owner Specification
- User wants to know if their PO Spec is ready for the architecture team
- User has business context in a file (ticket export, email, requirements doc) and wants to extract a PO Spec
- User says "async intake", "ticket context", "email context", or "intake from file"
- User provides a file path containing business requirements from an external async source

## Files in This Skill

- **REQUIREMENTS_ELICITATION_GUIDE.md**: Structured discovery interview methodology — 4 phases, probing techniques, Discovery Summary, and transition to PO Spec drafting
- **PRODUCT_OWNER_SPEC_GUIDE.md**: Comprehensive guide with 8-section template, examples, and best practices
- **templates/PO_SPEC_TEMPLATE.md**: Quick-start template for creating a new PO Specification
- **PO_SPEC_SCORING_GUIDE.md**: Weighted scoring methodology to evaluate PO Spec readiness (0-10 scale)
- **ASYNC_INTAKE_GUIDE.md**: File-based async intake methodology — extraction rules, keyword indicators, gap report template, and follow-up question generation

## How to Use This Skill

### For Requirements Elicitation

When this skill is activated and no existing PO Spec is found (or the user requests discovery/elicitation):

1. **Detect existing PO Spec**: Search for `PRODUCT_OWNER_SPEC.md`, `PO_SPEC.md`, `**/po-spec*`, `**/product-owner*`
   - If found: offer Evaluation or Creation workflows instead
   - If not found: proceed with elicitation
2. **Load the guide**: Read `REQUIREMENTS_ELICITATION_GUIDE.md` fully before starting
3. **Detect language**: Infer from user's first message; ask if ambiguous
4. **Conduct the 4-phase interview**:
   - Phase 1 — Foundation (Business Context, Stakeholders)
   - Phase 2 — Value & Boundaries (Objectives, Constraints) ← highest weight, invest depth here
   - Phase 3 — Behavior (Use Cases, User Stories) ← deepest phase, min 3 use cases
   - Phase 4 — Experience & Measurement (UX Requirements, Success Metrics)
5. **Produce Discovery Summary**: Structured by all 8 sections with confidence levels and open questions; present for PO confirmation before drafting
6. **Draft PO Spec**: Load `templates/PO_SPEC_TEMPLATE.md`, fill from elicited data, self-score against `PO_SPEC_SCORING_GUIDE.md`
7. **Gap loop if needed**: If score < 7.5, ask targeted follow-ups on weakest sections; re-score; save final as `PRODUCT_OWNER_SPEC.md`

### For PO Spec Creation

When this skill is activated for document creation:

1. **Read the guide**: Load PRODUCT_OWNER_SPEC_GUIDE.md to understand the 8-section structure
2. **Understand user context**: Ask clarifying questions about their product/feature
3. **Provide appropriate template**:
   - For guidance and understanding: Reference PRODUCT_OWNER_SPEC_GUIDE.md
   - For quick start: Provide templates/PO_SPEC_TEMPLATE.md
4. **Guide document creation**: Help user fill out each section with business context
5. **Reference mapping**: Explain how PO Spec maps to ARCHITECTURE.md (see guide Section "Mapping to ARCHITECTURE.md")

### For PO Spec Evaluation

When this skill is activated to evaluate a PO Spec:

1. **Read the scoring guide**: Load PO_SPEC_SCORING_GUIDE.md to understand the weighted scoring methodology
2. **Read the PO Spec**: Load the user's Product Owner Specification document
3. **Evaluate each section**: Assess completeness of all 8 sections using the evaluation criteria
4. **Calculate weighted score**: Apply section weights and compute total score (0-10 scale)
5. **Provide detailed feedback**:
   - Overall score and readiness interpretation
   - Section-by-section breakdown showing completeness %
   - Identify gaps in critical sections (Use Cases, Business Constraints, Business Objectives)
   - Provide actionable recommendations for improvement
6. **Determine readiness**: Score ≥7.5/10 indicates ready for architecture team handoff

### For Async Intake

When business context arrives via ticket, email, or document (not a live conversation):

1. **Locate the context file**: Ask the user for the file path, or detect common patterns (`business-context.*`, `ticket-*.*`, `requirements-*.*`, `email-*.*`)
2. **Read and parse the file**: Load the full content
3. **Load scoring guide**: Read `PO_SPEC_SCORING_GUIDE.md` for the 8-section weighted rubric
4. **Load async intake guide**: Read `ASYNC_INTAKE_GUIDE.md` for extraction methodology and keyword indicators
5. **Map content to 8 PO Spec sections**: Extract what's present, mark what's missing per section
6. **Score against the rubric**: Calculate per-section completeness % and weighted total score
7. **Generate gap report**: Produce a structured markdown report containing:
   - **Source file**: filename and processing date
   - **Extraction summary**: what was found mapped to each of the 8 sections with completeness %
   - **Score**: weighted total and per-section breakdown
   - **Gap report**: for each section below 75% completeness, list:
     - What's missing (specific sub-criteria from the scoring guide)
     - 2-3 ready-to-send questions the architect can forward back to the requester
     - Priority level (HIGH / MEDIUM / LOW based on section weight)
   - **Next steps**: "Send gap questions to requester → receive answers → re-run async intake or paste answers inline"
8. **Save gap report**: Write to `PO_SPEC_GAP_REPORT.md` in the project root
9. **If score ≥ 7.5**: Also draft `PRODUCT_OWNER_SPEC.md` from the extracted data using `templates/PO_SPEC_TEMPLATE.md`; flag any inferred values with `[Default — confirm before architecture handoff]`
10. **If score < 7.5**: Save gap report only — do NOT draft a PO Spec yet; gaps must be resolved first

## Key Principles

- **Business-focused**: No technical details or architecture decisions in PO Spec
- **User-centric**: Emphasize user needs, personas, and pain points
- **Measurable**: All goals and success criteria must be quantifiable
- **Constraint-aware**: Document all business constraints (budget, timeline, compliance)

## Integration with Other Skills

**Relationship to architecture-docs skill:**
- architecture-readiness (this skill) → Creates **business** requirements (PO Spec)
- architecture-docs skill → Creates **technical** architecture (ARCHITECTURE.md)

**Workflow:**
1. Product Owner uses architecture-readiness skill → Creates PO Spec
2. PO Spec handed off to architecture team
3. Architecture team uses architecture-docs skill → Creates ARCHITECTURE.md

## Example Invocations

### Example 2: Creating a PO Spec

```
User: "I want to create a Product Owner Specification for a new mobile payment feature"

Claude (with architecture-readiness skill activated):
1. Load PRODUCT_OWNER_SPEC_GUIDE.md to understand structure
2. Ask clarifying questions:
   - What business problem does this solve?
   - Who are the target users?
   - What are the business objectives and success metrics?
   - Are there regulatory/compliance requirements?
3. Guide user through 8 sections:
   - Business Context
   - Stakeholders & Users
   - Business Objectives
   - Use Cases
   - User Stories
   - User Experience Requirements
   - Business Constraints
   - Success Metrics & KPIs
4. Provide template sections as needed
5. Explain how completed PO Spec feeds into ARCHITECTURE.md
```

### Example 1: Requirements Elicitation (No Existing PO Spec)

```
User: "I have an idea for a loyalty program app but I don't know where to start with requirements."

Claude (with architecture-readiness skill activated):
1. Search project for existing PO Spec files → none found
2. Load REQUIREMENTS_ELICITATION_GUIDE.md
3. Detect language from user message → English
4. Open interview: "I'll guide you through a discovery interview across 4 phases..."
5. Phase 1 — Foundation:
   - "What business problem does the loyalty program solve?"
   - "Who are your target users — existing customers, new customers, both?"
   - "Who are the key stakeholders — marketing team, store managers, IT?"
6. Phase 2 — Value & Boundaries:
   - "What are the top 3 business outcomes? (e.g., increase repeat purchases by X%)"
   - "Any regulatory requirements — data privacy laws, financial regulations?"
   - "Is there an approved budget range and a launch deadline?"
7. Phase 3 — Behavior (Scenario Walking):
   - "Walk me through: a customer earns points after a purchase. What's the first thing they do?"
   - "What happens if a points redemption fails at checkout?"
   - "Describe the experience for a store employee who manages loyalty accounts."
8. Phase 4 — Experience & Measurement:
   - "How fast should the points balance update after a purchase?"
   - "What 3 metrics will prove the loyalty program is working at 6 months?"
9. Discovery Summary: Present structured summary with confidence levels → PO confirms
10. Draft PO Spec from template, self-score → 7.9/10
11. Save as PRODUCT_OWNER_SPEC.md, report score and next steps
```

### Example 4: Async Intake (File-Based)

```
User: "I received this ticket from the product team — extract requirements from it"
      [provides path: business-context.md]

Claude (with architecture-readiness skill activated):
1. Read business-context.md
2. Load PO_SPEC_SCORING_GUIDE.md + ASYNC_INTAKE_GUIDE.md
3. Map content to 8 sections using keyword indicators:
   - Business Context: 90% — clear problem statement and market context
   - Stakeholders & Users: 40% — "customers" mentioned but no detailed personas
   - Business Objectives: 70% — targets mentioned but not quantified with baselines
   - Use Cases: 30% — 1 scenario, no alternative flows or edge cases
   - User Stories: 0% — none provided
   - UX Requirements: 50% — performance expectations mentioned, no acceptance thresholds
   - Business Constraints: 80% — budget and timeline documented
   - Success Metrics & KPIs: 20% — "increase revenue" mentioned, no baselines or targets
4. Weighted score: 4.85/10 — Not ready
5. Generate PO_SPEC_GAP_REPORT.md:
   - HIGH gaps: Use Cases (weight 2.5), Success Metrics (weight 1.0), Stakeholders (weight 0.5)
   - 12 ready-to-send questions organized by priority
   - Next steps: "Send gap questions to product team; re-run async intake with their answers"
6. Save PO_SPEC_GAP_REPORT.md — do NOT draft PO Spec (score < 7.5)
```

### Example 3: Evaluating a PO Spec

```
User: "Can you evaluate my Product Owner Spec and tell me if it's ready for the architecture team?"

Claude (with architecture-readiness skill activated):
1. Load PO_SPEC_SCORING_GUIDE.md to understand scoring methodology
2. Read the user's PRODUCT_OWNER_SPEC.md file
3. Evaluate each section:
   - Section 1 (Business Context): 80% complete
   - Section 2 (Stakeholders): 60% complete
   - Section 3 (Business Objectives): 90% complete
   - Section 4 (Use Cases): 100% complete
   - Section 5 (User Stories): 70% complete
   - Section 6 (UX Requirements): 85% complete
   - Section 7 (Business Constraints): 95% complete
   - Section 8 (Success Metrics): 80% complete
4. Calculate weighted score: 8.85/10
5. Provide feedback:
   - "Your PO Spec scores 8.85/10 - Good, ready for architecture design"
   - "Excellent: Use Cases, Business Constraints, Business Objectives"
   - "Minor gaps: Stakeholders & Users section needs more detailed personas"
   - "Recommendation: Proceed with architecture design; clarify user personas during kickoff"
```

## Common User Requests

**Requirements Elicitation:**
- "I don't know where to start with requirements" → Use REQUIREMENTS_ELICITATION_GUIDE.md, begin Phase 1
- "Can you interview me about my project requirements?" → Use REQUIREMENTS_ELICITATION_GUIDE.md, begin interview
- "Help me discover requirements for [project]" → Use REQUIREMENTS_ELICITATION_GUIDE.md
- "I have a business idea, what do I need to document?" → Detect PO Spec, if none → elicitation flow
- "Requirements discovery / elicitation / interview" → Use REQUIREMENTS_ELICITATION_GUIDE.md

**PO Spec Creation:**
- "Help me document business requirements" → Use PRODUCT_OWNER_SPEC_GUIDE.md
- "I need a template for product specifications" → Provide templates/PO_SPEC_TEMPLATE.md
- "How does this relate to the architecture document?" → Reference "Mapping to ARCHITECTURE.md" section in guide
- "What should I include in use cases vs user stories?" → Reference Sections 4 and 5 of guide

**PO Spec Evaluation:**
- "Evaluate my PO Spec" → Use PO_SPEC_SCORING_GUIDE.md to score the document
- "Is my PO Spec ready for the architecture team?" → Score and assess readiness (≥7.5/10)
- "What's missing from my business requirements?" → Identify gaps using evaluation criteria
- "How can I improve my PO Spec score?" → Provide actionable recommendations based on section weights

**Async Intake:**
- "I received a ticket/email with business context" → Read the file, run Async Intake mode
- "Extract requirements from this file" → Async Intake mode
- "Generate a gap report from this document" → Async Intake mode
- "Async intake" / "ticket context" / "email context" / "intake from file" → Async Intake mode
- "What questions should I ask to fill in the gaps?" → Async Intake mode, generate ready-to-send questions

## Success Criteria

### For Requirements Elicitation

A quality elicitation should:
- ✅ Detect the absence of an existing PO Spec before starting the interview
- ✅ Conduct all 4 interview phases with appropriate depth (Use Cases and Constraints receive most time)
- ✅ Apply probing techniques (scenario walking, quantification, negative probing) to increase answer depth
- ✅ Offer industry defaults when PO is unsure, and record unknowns as Open Questions
- ✅ Produce a Discovery Summary organized by all 8 sections with confidence levels
- ✅ Confirm Discovery Summary with PO before drafting
- ✅ Draft a PO Spec from the template, self-score it, and iterate until score ≥ 7.5/10
- ✅ Save final PO Spec as `PRODUCT_OWNER_SPEC.md` with score and next-step guidance

### For PO Spec Creation

A well-formed Product Owner Specification should:
- ✅ Have all 8 sections completed
- ✅ Include specific, measurable success criteria
- ✅ Define user personas with real pain points
- ✅ Document all business constraints (budget, timeline, compliance)
- ✅ Use business language (avoid technical jargon)
- ✅ Map clearly to ARCHITECTURE.md inputs
- ✅ Score ≥7.5/10 on the weighted scoring methodology

### For PO Spec Evaluation

A quality evaluation should:
- ✅ Assess all 8 sections using the evaluation criteria from PO_SPEC_SCORING_GUIDE.md
- ✅ Calculate weighted score correctly (applying section weights)
- ✅ Provide clear readiness determination (Ready ≥7.5/10, Not Ready <7.5/10)
- ✅ Give specific, actionable feedback for each gap identified
- ✅ Prioritize feedback on high-weight sections (Use Cases, Business Constraints, Business Objectives)
- ✅ Explain what needs to be added/improved to reach readiness threshold

### For Async Intake

A quality async intake should:
- ✅ Read the provided context file completely before any analysis
- ✅ Map content to all 8 PO Spec sections using keyword indicators from ASYNC_INTAKE_GUIDE.md
- ✅ Calculate accurate weighted score per PO_SPEC_SCORING_GUIDE.md
- ✅ Generate a gap report with 2-3 ready-to-send questions per gap section
- ✅ Prioritize gaps by section weight (HIGH: Use Cases, Constraints, Objectives)
- ✅ Save gap report as `PO_SPEC_GAP_REPORT.md` in the project root
- ✅ If score ≥ 7.5, also produce a draft `PRODUCT_OWNER_SPEC.md` with inferred values flagged as `[Default]`
- ✅ NOT start an interactive interview — this mode is fully async