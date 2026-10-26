# Chat Mode — helping the Product Owner write the spec

Read this file instead of `SKILL.md`'s workflows when the skill runs where it cannot run a shell command or
`bun --version` fails — a Claude chat (claude.ai), the desktop or mobile app. Chat mode **supports the Product Owner in
writing the PO Spec**; evaluating it, scoring it and releasing it to the architecture team happen in Claude Code, where
the rest of the delivery runs.

## What runs here

| Workflow | Chat mode |
|---|---|
| 2 Requirements Elicitation | **Yes** — `REQUIREMENTS_ELICITATION_GUIDE.md`, the four phases, the checkability ladder (§ 6) as the way to ask |
| 3 PO Spec Creation | **Yes** — `templates/PO_SPEC_TEMPLATE.md`, filled from the interview |
| Pre-check (below) | **Yes** — findings only, never a score |
| 1 Async Intake, 4 Evaluation | No — they score. Answer: *the evaluation runs in Claude Code: `evaluate PO spec`* |
| 5 Distribution PDF | No — it needs Bun. Say so once, when the spec is delivered |
| 6 PO Spec Sync | No — it reads the architecture repository |

## The Discovery Summary is a file

A discovery interview often spans several chats. After the four phases, write the Discovery Summary
(`REQUIREMENTS_ELICITATION_GUIDE.md` § 9, its format unchanged) as `DISCOVERY_SUMMARY.md` and present it for the Product
Owner's confirmation. A chat that opens with a `DISCOVERY_SUMMARY.md` resumes from it: read it, name the sections
still marked low confidence or open, and continue the interview there. Its H1 is `# Discovery Summary — <product>`,
never `… - Product Owner Specification`, so no gate mistakes it for the spec.

## Drafting

`REQUIREMENTS_ELICITATION_GUIDE.md` § 10 steps 1–5 and 8, with these changes:

- Steps 6–7 (the self-score and the gap loop on it) are replaced by the pre-check below.
- Step 9 (the PDF) is skipped.
- The spec's last line is `<!-- READINESS_CHECK: draft -->`. Never write `verified` — only `readiness-stamp.js` in
  Claude Code writes it, and the architecture's PO Spec gate blocks a `draft` spec until it does.

## Pre-check — before the Product Owner sends the spec

Read the spec once and report **findings, never a number**: no section score, no total, no multiplier, no Ready cap,
no "ready" or "not ready". The official result is the scripts' (`PO_SPEC_SCORING_GUIDE.md` § The checkability rule,
§ The coherence gate), which find more than a reading does.

1. **Checkability** — every statement in Business Objectives, Use Cases (part by part: description, actor, trigger,
   steps, alternative flows, outcome, acceptance criteria), User Stories, UX Requirements, Business Constraints and
   Success Metrics against the five tests: named · closed · dated · observable · measurable (the table in
   `PO_SPEC_SCORING_GUIDE.md` § The checkability rule). Out of Scope and Aspirations are not requirements.
2. **Coherence you can see by reading** —
   - a solution label the spec claims (`references/solution-labels.json`) that no use case exercises;
   - an objective no use case delivers, or no metric measures;
   - a use case that serves no objective, a metric that measures none (warnings).
   The rest of the coherence gate — acceptance tests, closure of states and triggers, contradictions, sizing — needs
   the judge and the test writer: it is not attempted here.
3. **Implementation suggestions** — a requirement that chooses how to build the system (a product, technology, vendor,
   framework, data store or design) rather than what it must do: ask what it gives the business, write that need as the
   requirement, and move the statement verbatim to Appendix › Implementation Suggestions with Status `Open`
   (`REQUIREMENTS_ELICITATION_GUIDE.md` § 6, *Need behind the means*). Never answer a suggestion: the architecture does.

Report each finding as one line — where (section, `UC-nn`, objective number), the test it fails, the statement quoted,
the ladder question that fixes it — then work through them with the Product Owner: each answer rewritten in place, a
wish that cannot be made concrete moved to Appendix → Aspirations. Close with:

> Pre-check only. Before the spec goes to the architecture team, run `evaluate PO spec` in Claude Code — it scores the
> spec, runs the full checks and stamps it; the architecture's gate accepts nothing else.
