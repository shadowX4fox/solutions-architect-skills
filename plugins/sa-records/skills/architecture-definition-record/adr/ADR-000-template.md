# ADR-XXX: [Short Decision Title]
<!-- Title rule: the text AFTER `# ADR-NNN: ` must be ≤ 50 characters. Example: "Dynatrace as Mandatory Observability Platform" (45). See ADR_GUIDE.md § Title and Problem Statement Length Constraints. -->

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Scope**: Institutional | User
<!-- For Institutional scope (ADR-001..100), see ADR_GUIDE.md § Institutional ADR Content Discipline — no project-specific content allowed. -->
**Date**: YYYY-MM-DD
**Authors**: [Author names or team name]
**Related**: [Links to related ADRs, e.g., ADR-001, ADR-005]

---

## Context
<!-- Budget: ≤ 250 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> What is the issue or situation that is motivating this decision or change?

### Problem Statement
<!-- Length rule: the Problem Statement body must be ≤ 200 characters total. Compose by answering — internally — What problem? Who is impacted? Cost of inaction? Current state and why insufficient? — then compress the answer to one tight sentence (or two short ones). The author-facing questions belong in your draft notes, not in the final ADR. See ADR_GUIDE.md § Title and Problem Statement Length Constraints. -->

[A concise statement (≤ 200 characters) describing the problem or opportunity. Compose by answering: What problem? Who is impacted? Cost of inaction? Current state and why insufficient? — then compress to a single tight sentence.]

### Requirements

**Functional Requirements:**
- Requirement 1: [Description]
- Requirement 2: [Description]
- Requirement 3: [Description]

**Non-Functional Requirements:**
- Performance: [Latency, throughput targets]
- Scalability: [Growth expectations]
- Security: [Compliance, data protection]
- Reliability: [Uptime, fault tolerance]
- Maintainability: [Complexity, learning curve]

**Constraints:**
- Budget: [Financial limitations]
- Timeline: [Deadlines, milestones]
- Technology: [Existing tech stack, vendor lock-in]
- Team: [Skills, capacity]
- Compliance: [Regulatory requirements]

### Business Drivers

[Explain the business context and drivers:]
- Business impact if we solve this
- Business impact if we don't solve this
- Strategic alignment
- Competitive considerations
- Cost implications

---

## Decision
<!-- Budget: ≤ 500 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> What is the change that we're proposing and/or doing?

### Summary

[One-paragraph summary of the decision. This should be understandable to non-technical stakeholders.]

### Detailed Decision

[Provide a comprehensive explanation of what was decided. Include:]
- What solution or approach we selected
- How it will be implemented
- What technologies, patterns, or practices will be used
- Timeline or phasing if applicable

### Scope

**What IS included:**
- Item 1
- Item 2
- Item 3

**What is NOT included:**
- Item 1
- Item 2
- Item 3

---

## Rationale
<!-- Budget: ≤ 250 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> Why did we make this decision? What factors influenced the choice?

### Primary Drivers

- **[Driver]** — why it matters here; the evidence (a number, a benchmark, a cited ADR).
- **[Driver]** — …

[3–4 drivers, one line each. An argument another ADR already makes is one line and a link.]

### Comparison Summary

| Criteria | Selected Option | Alternative 1 | Alternative 2 |
|----------|----------------|---------------|---------------|
| **[Criterion]** | ✅ | ⚠️ | ❌ |

---

## Consequences
<!-- Budget: ≤ 300 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> What becomes easier or more difficult because of this change?

### Positive Consequences

- **[Outcome]** — who benefits, and by how much when it is measured.

### Negative Consequences

- **[Drawback]** — who is impacted. **Severity**: Low | Medium | High. **Mitigation**: [how, or the TDR that tracks it].

### Trade-offs

- **[A vs B]**: [what this decision gives up, one line].

[One consequence per bullet, one line each; ≤ 3 per list.]

---

## Alternatives Considered
<!-- Budget: ≤ 250 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> What other options did we evaluate and why were they not selected?

| Alternative | Why rejected | When it would have been the better choice |
|---|---|---|
| [Name] | [One line] | [One line] |

[≤ 3 alternatives, one row each.]

---

## Implementation Plan

> How will this decision be implemented? (Optional section)

### Phases

**Phase 1: [Name]** (Timeline: [Duration])
- Task 1
- Task 2
- Task 3
- **Success Criteria**: [How we know this phase is complete]

**Phase 2: [Name]** (Timeline: [Duration])
- Task 1
- Task 2
- Task 3
- **Success Criteria**: [How we know this phase is complete]

**Phase 3: [Name]** (Timeline: [Duration])
- Task 1
- Task 2
- Task 3
- **Success Criteria**: [How we know this phase is complete]

### Dependencies

- Dependency 1: [Description, owner]
- Dependency 2: [Description, owner]
- Dependency 3: [Description, owner]

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [Mitigation strategy] |
| [Risk 2] | Low/Med/High | Low/Med/High | [Mitigation strategy] |
| [Risk 3] | Low/Med/High | Low/Med/High | [Mitigation strategy] |

---

## Success Metrics

> How will we measure the success of this decision? (Optional section)

### Quantitative Metrics

- **Metric 1**: [Current baseline] → [Target]
- **Metric 2**: [Current baseline] → [Target]
- **Metric 3**: [Current baseline] → [Target]

### Qualitative Metrics

- Developer satisfaction: [How measured, target]
- User feedback: [How measured, target]
- Team velocity: [How measured, target]

### Review Timeline

- **Initial Review**: [Date] - Check if metrics are trending correctly
- **Final Review**: [Date] - Evaluate success and lessons learned
- **Owner**: [Who is responsible for tracking metrics]

---

## References
<!-- Budget: ≤ 150 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> Links to supporting documentation, research, and related materials

### Documentation
- [Internal docs, architecture diagrams]
- [API specifications, schemas]
- [Design documents]

### Research & Analysis
- [Blog posts, whitepapers]
- [Benchmark results, performance tests]
- [Case studies, success stories]

### Related ADRs
- [ADR-XXX](ADR-XXX-title.md) - Related decision
- [ADR-YYY](ADR-YYY-title.md) - Supersedes/Builds on

### External Resources
- [Technology documentation]
- [Community discussions, GitHub issues]
- [Books, articles, conference talks]

---

## Review History

> The amendment log — the one place history is recorded. One row per change, one line each. The
> sections above state the decision in force (rewrite them in place when amending); keep the decision
> body ≤ 1,500 words for a project ADR (ADR_GUIDE.md § Decision Body and Amendment Log).

| Date | Reviewer | Action | Notes |
|------|----------|--------|-------|
| YYYY-MM-DD | [Name] | Created | Initial draft |
| YYYY-MM-DD | [Name] | Reviewed | [Comments] |
| YYYY-MM-DD | [Name] | Approved | Status changed to Accepted |
| YYYY-MM-DD | [Name] | Amended | [What changed, one sentence — the section it rewrote, the ADR that caused it] |

---

## Notes
<!-- Budget: ≤ 100 words (project ADRs; body total ≤ 1,500). State the decision in force — history goes to one Review History row. See ADR_GUIDE.md § Decision Body and Amendment Log. -->

> Additional context, caveats, or future considerations

[Optional section for:]
- Edge cases not covered
- Future evolution plans
- Known limitations
- Assumptions made
- Open questions

---

**Last Updated**: YYYY-MM-DD
**Status**: ✅ Accepted | 🚧 Proposed | ⚠️ Deprecated | 🔄 Superseded
**Next Review**: YYYY-MM-DD (for important decisions, schedule periodic reviews)

---

## ADR Template Usage Guide

### When to Create an ADR

Create an ADR when making decisions about:
- ✅ Technology selection (languages, frameworks, databases)
- ✅ Architectural patterns (microservices, event-driven, monolith)
- ✅ API design (REST, GraphQL, gRPC)
- ✅ Infrastructure choices (cloud provider, container orchestration)
- ✅ Security approaches (authentication, authorization, encryption)
- ✅ Data modeling (schema design, storage patterns)
- ✅ Development practices (testing strategy, deployment process)
- ✅ Major refactoring decisions
- ✅ Third-party service integrations

### When NOT to Create an ADR

Don't create an ADR for:
- ❌ Minor implementation details
- ❌ Temporary experiments or prototypes
- ❌ Coding style preferences (use linting rules instead)
- ❌ Routine operational changes
- ❌ Decisions that can be easily reversed

### Writing Tips

1. **Be Specific**: Use concrete examples and data
2. **Be Honest**: Document trade-offs, don't oversell the decision
3. **Be Concise**: Aim for clarity, not length
4. **Use Present Tense**: "We use X" not "We will use X"
5. **Include Evidence**: Link to benchmarks, tests, proof of concepts
6. **Update Status**: Mark as Deprecated or Superseded when invalidated

### ADR Workflow

```
1. Create ADR with Status: Proposed
   ↓
2. Share with team for review
   ↓
3. Incorporate feedback, iterate
   ↓
4. Present in architecture review meeting
   ↓
5. Update Status: Accepted (or Rejected)
   ↓
6. Implement decision
   ↓
7. Periodic review (for critical ADRs)
   ↓
8. Update or Deprecate as needed
```

### File Naming Convention

- Format: `ADR-NNN-brief-title.md`
- NNN: Zero-padded number — range encodes scope:
  - **Institutional scope** → 001–100 (reserved for Architecture Team / org-wide decisions)
  - **User / Project scope** → 101+ (team-level decisions within a single project)
- brief-title: Lowercase, hyphen-separated
- Examples:
  - `ADR-001-mandatory-mtls-internal.md`       ← Institutional
  - `ADR-042-encryption-at-rest-policy.md`     ← Institutional
  - `ADR-101-postgresql-primary-database.md`   ← User/Project
  - `ADR-115-event-sourcing-pattern.md`        ← User/Project

### Cross-Referencing

- Link to related ADRs in the "Related" field at the top
- Link to ADRs from ARCHITECTURE.md when explaining decisions
- Maintain an ADR index (README.md in adr/ directory)