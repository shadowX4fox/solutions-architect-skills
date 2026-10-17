# System Runtime View — [PROJECT_NAME]

<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->
<!-- TEMPLATE_VERSION: 4.3.1 -->
| Field | Value |
|-------|-------|
| Version | [EKONTE_VERSION] |
| Owner | [ARCHITECT_NAME or NOT DOCUMENTED] |
| Status | [STATUS — draft / review / baselined] |
| Architecture Version | [ARCHITECTURE_VERSION] |
| Generated | [GENERATION_DATE] |
| Project | [PROJECT_NAME] |

### Role Quick Index <!-- SECTION: Role Quick Index -->

| Audience | Read first in this document |
|----------|-----------------------------|
| **Architect** | Scope → Flows → Budget Decomposition → Edge Rationale → Return Path |
| **Dev** | Flows (for flows you appear in) → Edge Rationale (edges touching your component) |
| **Ops / SRE** | Budget Decomposition → Failure Posture → Return Path |

Full-kit reading order across the four handoff documents is in `handoffs/README.md`.

The System Runtime View is the **whole-system storyboard** — the shared view
every service team receives alongside its Component Specification. Its job is to
eliminate the "why does this connection exist?" question at each interface by
naming every edge, its rationale, and the ADR that decided it, and to
force per-hop budget decomposition so no team assumes it owns the full
end-to-end SLO.

---

## Scope <!-- SECTION: Scope -->

**In scope**

[IN_SCOPE_COMPONENTS_LIST]

**Out of scope** (named explicitly so absence is not ambiguity)

[OUT_OF_SCOPE_COMPONENTS_LIST or "No out-of-scope components documented."]

---

## Flows <!-- SECTION: Flows -->

For each significant end-to-end flow: trigger, path, sequence-diagram
link, global budget, failure posture. Path components use the canonical
name — the component file's H1 (`name` from `component-facts.ts list`).

[FLOWS_BLOCK — one H3 per flow using the template below]

<!--
Per-flow block template (repeat for each flow — F-01, F-02, …):

### F-NN — [Flow name]

- **Trigger:** [event or request]
- **Path:** [component-a] → [component-b] → [component-c]
- **Sequence:** [../docs/04-data-flow-patterns.md#anchor](../docs/04-data-flow-patterns.md#anchor)
- **Global budget:** p99 [N]ms | availability [N]% | cost/txn [N]
- **Failure posture:** [what degrades, what fails closed, what is retried where]

[FLOW_MAIN_IMAGE — the payload's `Main image:` fence for this flow, verbatim: the flow's end-to-end sequence, whose steps are labelled N.M (phase N, step M of that phase's panel in § Phase Catalog). One picture per flow; the phases are drawn once, below, not here. When the payload carries a [NOT DOCUMENTED — …] line instead, write that line.]
-->

---

## Phase Catalog <!-- SECTION: Phase Catalog -->

Every phase the flows above run, drawn once. A step `4.2` in any main image is step 2 of Phase 4 here.
`Used by` is the reverse index — the flows a change to this phase reaches.

[PHASE_CATALOG — the payload's `## Phase Catalog` block verbatim: per phase, the `### Phase N — <name>` heading, its `Used by:` line and its fenced ```mermaid block. Never edit a Mermaid line, never merge fences, never draw one, never repeat a phase.]

---

## Budget Decomposition <!-- SECTION: Budget Decomposition -->

Every global number allocates to per-hop numbers. Allocations MUST sum
within each flow's global constraint. Unallocated headroom is stated
explicitly, not left implicit.

[BUDGET_DECOMPOSITION_TABLE]

<!--
Per-flow subsection template:

### F-NN — [Flow name]

| Hop | Component | p99 allocation | Error budget | Notes |
|----:|-----------|---------------:|-------------:|-------|
| 1 | [component-a] | [N]ms | [P]% | [notes] |
| 2 | [component-b] | [N]ms | [P]% | [notes] |
| 3 | [component-c] | [N]ms | [P]% | [notes] |
|   | **Sum** | **[TOTAL]ms** | **[TOTAL]%** | vs global [G]ms / [P]% — headroom [H] |

If Latency Budget analysis is missing, render each row's p99 / error
budget cell as `[NOT DOCUMENTED — run /sa-analysis:architecture-analysis
latency-budget]` and add a D-level gap entry in the Component Specifications sourcing
this flow.
-->

---

## Edge Rationale <!-- SECTION: Edge Rationale -->

Every edge on the diagram carries one line and an ADR link. No unexplained
edges — if an edge lacks a rationale, the design is not ready to hand off.

| Edge | Style | Rationale (one line) | Decision |
|------|-------|----------------------|---------:|
[EDGE_RATIONALE_ROWS]

<!--
Row template:

| [upstream] → [downstream] | [sync | async | event | batch] | [one-line rationale] | [ADR-NNN](../adr/ADR-NNN-slug.md) |

If no ADR references the edge, write `[NOT DOCUMENTED — record decision
in adr/]` in the Decision column and log the gap in the Component Specification of
either endpoint.
-->

---

## Failure Posture at a Glance <!-- SECTION: Failure Posture at a Glance -->

Cross-flow summary of cascade behaviour and bulkhead posture. Sourced
from `analysis/BLAST_RADIUS-*.md`.

[FAILURE_POSTURE_SUMMARY or "No Blast Radius analysis found — run /sa-analysis:architecture-analysis blast-radius to populate this section."]

---

## Return Path <!-- SECTION: Return Path -->

The storyboard analogy is one-way; software is not. The team closest to
execution often sees what the architect did not. This section names how
to challenge the runtime view after it has been handed off.

- **Interface Challenge** — an assumption in a Interface Contract is wrong or
  unimplementable. Raise before implementation. Resolution updates the
  Interface Contract and, if the interaction style changes, produces a new ADR.
- **Budget Challenge** — an allocation is not achievable. Resolution
  re-decomposes the flow; the global constraint is renegotiated only
  with the constraint's owner.
- **Standards Exception** — a global rule does not fit. Recorded as a
  dated, expiring deviation in [`CROSS_CUTTING_STANDARDS.md § Deviations`](CROSS_CUTTING_STANDARDS.md#deviations).
  Never a silent local departure.
- **Finding** — anything else discovered during build that invalidates
  the runtime view. Logged against the flow, triaged at the next architecture
  review.

Everything above has a named owner and a decision record. Slack threads
are not a return path.

---

*Generated by `sa-skills:architecture-dev-handoff` on [GENERATION_DATE]*
*Source: [ARCHITECTURE_FILE_PATH]*
