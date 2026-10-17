# Component Specification — [COMPONENT_NAME]

<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->
<!-- TEMPLATE_VERSION: 4.3.1 -->
| Field | Value |
|-------|-------|
| Component | [COMPONENT_NAME] |
| Component Number | [COMPONENT_NUMBER] |
| Team | [OWNER_TEAM or NOT DOCUMENTED] |
| Component Specification Version | [CUT_SHEET_VERSION] |
| Runtime View Version | [EKONTE_VERSION] |
| Standards Version | [SETTEI_VERSION] |
| Architecture Version | [ARCHITECTURE_VERSION] |
| Component Version | [COMPONENT_VERSION] |
| Generated | [GENERATION_DATE] |
| Source Component Doc | [../docs/components/COMPONENT_FILE](../docs/components/[COMPONENT_FILE]) |

### Role Quick Index <!-- SECTION: Role Quick Index -->

| Audience | Read first in this document |
|----------|-----------------------------|
| **Dev** | § 1 Responsibility → § 2 Position → § 3 Contracts owned → § 4 Invariants → § 7 Constraints → § 8 Deliberately unspecified |
| **QA** | § 3 Contracts owned → § 4 Invariants → § 5 Budgets → § 9 Acceptance |
| **Ops / SRE** | § 5 Budgets → § 7 Constraints → § 10 Assets |

Full-kit reading order across the four handoff documents is in `../README.md`.

This is the **panel for this team**. It specifies intent and constraint
only. Internal structure, persistence choice within owned boundaries,
language idiom, module layout, and test strategy are deliberately not
specified — the team owns those.

Read alongside [`../SYSTEM_RUNTIME_VIEW.md`](../SYSTEM_RUNTIME_VIEW.md) (whole-system
story), [`../CROSS_CUTTING_STANDARDS.md`](../CROSS_CUTTING_STANDARDS.md) (global rules), and each linked
Interface Contract (continuity with adjacent services).

---

## 1. Responsibility <!-- SECTION: Responsibility -->

[RESPONSIBILITY_PARAGRAPH]

<!--
One paragraph. Two things:
1. What this service is accountable for.
2. What it is explicitly NOT accountable for (source doc emphasises
   the negation — the not-list stops teams from silently expanding
   scope).
-->

---

## 2. Position <!-- SECTION: Position -->

**Appears in flows:** [FLOW_HOP_REFERENCES]

<!--
Format: F-01 hop 2, F-03 hop 1
Sourced from SYSTEM_RUNTIME_VIEW.md § Flows.
-->

**Upstream seams** (inbound):

[UPSTREAM_SEAM_LINKS or "No inbound seams documented."]

**Downstream seams** (outbound):

[DOWNSTREAM_SEAM_LINKS or "No outbound seams documented."]

**Interfaces without an Interface Contract**:

[UNCONTRACTED_INTERFACES or "None."]

<!--
Each interface link names the docs/05 id it carries:
- [<upstream>→<downstream>](../interfaces/<upstream>→<downstream>.md) — I-nn
Each interface without a contract (its other end is no component of the architecture), from the payload's list:
- I-nn — inbound from <caller> · <protocol> — no Interface Contract; pending, it fails closed
Every I-nn of the component's security obligations appears here: kit-check fails `interface-missing` otherwise.
-->

**Panel** — this component and its neighbours on the container diagram, cut from `docs/03` (generated, never hand-edited):

[POSITION_PANEL]

---

## 3. Contracts owned <!-- SECTION: Contracts Owned -->

Contracts this component publishes. Schemas live in the linked asset
files — this table lists only titles, versions, and consumers.

| Contract | Version | Consumers | Asset |
|----------|--------:|-----------|-------|
[CONTRACTS_OWNED_ROWS or "| — | — | — | No contracts owned. |"]

<!--
Row template:
| [contract title] | [version] | [consumer-a, consumer-b] | [openapi.yaml](assets/NN-slug/openapi.yaml) |

Schemas are NOT inlined here — they belong to the asset file.
-->

---

## 4. Invariants <!-- SECTION: Invariants -->

Conditions that must hold at all times, regardless of implementation.
Every invariant is a testable statement — QA covers each with a test.

[INVARIANTS_LIST]

<!--
Bullet template:
- **INV-01** [statement — e.g., "Every settled payment produces exactly
  one `payment_settled` event on `settlements.v1`"]
- **INV-02** [statement]

Seeded from component-file Key Responsibilities negations and from
ADRs that constrain this component. Teams may add invariants but must
preserve numbering.
-->

---

## 5. Budgets (from decomposition) <!-- SECTION: Budgets -->

Pulled verbatim from [`../SYSTEM_RUNTIME_VIEW.md § Budget Decomposition`](../SYSTEM_RUNTIME_VIEW.md#budget-decomposition)
rows referencing this component. Do not restate the global SLO — restate
only this component's allocation.

| Aspect | Allocation | Source |
|--------|-----------:|--------|
| p99 latency | [LATENCY_ALLOCATION_MS] ms | [SOURCE_FLOW_HOP] |
| Error budget | [ERROR_BUDGET_PCT] % | [SOURCE_FLOW_HOP] |
| Throughput (peak) | [PEAK_TPS] | [SOURCE_FLOW_HOP] |
| Throughput (sustained) | [SUSTAINED_TPS] | [SOURCE_FLOW_HOP] |
| Cost ceiling | [COST_CEILING] per [UNIT] | [SOURCE_FLOW_HOP] |

If Latency Budget analysis is missing, rows render `[NOT DOCUMENTED — run
/sa-analysis:architecture-analysis latency-budget]` and the gap is echoed
in § 11.

---

## 6. Data ownership <!-- SECTION: Data Ownership -->

Exclusive ownership. No shared mutable ownership anywhere in the
system.

**Owns (authoritative source):**

[OWNED_ENTITIES_LIST]

**Reads (via contract, does not own):**

[READS_NOT_OWNED_LIST or "No external reads."]

**Must not access:**

[MUST_NOT_ACCESS_LIST or "No explicit prohibitions."]

<!--
Bullet templates:
Owns:  - [entity-a], [entity-b]
Reads: - [entity-c] via [interface link] — per INV-nn
Must not access: - [store-x] (owned by [component-y]) — per INV-nn
-->

---

## 7. Constraints <!-- SECTION: Constraints -->

Constraints are backed by a reason (Cross-Cutting Standards rule, ADR, or invariant).
Constraints without a reason are drift-in-waiting; either cite one or
delete the row.

**Mandated:**

[MANDATED_CONSTRAINTS_LIST]

**Prohibited:**

[PROHIBITED_CONSTRAINTS_LIST]

<!--
Bullet templates:
Mandated:
  - [constraint] — [reason: ADR-NNN / INV-nn]

Prohibited:
  - [constraint] — [reason: ADR-NNN / INV-nn]
-->

---

## 8. Deliberately unspecified <!-- SECTION: Deliberately Unspecified -->

The team owns the following decisions:

- Internal structure (module layout, package boundaries)
- Persistence choice within the owned boundary
- Language idiom and framework subset
- Test strategy (unit vs integration split, tooling)
- Local caching, in-process pooling

Over-specification here would replace judgement with prescription. If
you find yourself specifying one of the above, escalate — it belongs in
Cross-Cutting Standards (if institution-wide) or in an ADR (if project-wide), not in a
Component Specification.

---

## 9. Acceptance <!-- SECTION: Acceptance -->

- [ ] Contracts in § 3 published and consumer-verified
- [ ] Budgets in § 5 demonstrated under load
- [ ] Invariants in § 4 covered by tests
- [ ] Interface failure semantics exercised (fault-injection per Interface Contract)
- [ ] Cross-Cutting Standards conformance checked; any deviation recorded per [`../CROSS_CUTTING_STANDARDS.md § Deviations`](../CROSS_CUTTING_STANDARDS.md#deviations)

---

## 10. Assets <!-- SECTION: Assets -->

Deliverable assets generated alongside this Component Specification.

| Asset | File | Description |
|-------|------|-------------|
[ASSETS_TABLE_ROWS or "| — | — | No assets generated for this component type. |"]

Assets live in `handoffs/assets/[COMPONENT_FOLDER]/`.

---

## 11. Open questions <!-- SECTION: Open Questions -->

Gaps detected during Component Specification generation — values not found in the
architecture documentation or upstream artefacts (Runtime View, Cross-Cutting Standards, Interface
Contracts).

**A register, not an essay.** This section is read by whoever unblocks the gap, and it competes for
attention with the invariants and constraints the team has to implement. One row per gap; the row
says what is missing, where it gets fixed and what it blocks, and stops there. The reasoning behind
a gap belongs in the section that has it, not here.

[OPEN_QUESTIONS_TABLE or "No gaps detected — all sections fully documented."]

<!--
Row template (one row per gap — column headers are fixed English, cells are in doc_language):

| Section | What is missing | Where to fix it | What it blocks |
|---------|-----------------|-----------------|----------------|
| § [Anchor name] | [the missing value, one line] | [`path/to/file.md` § section, or the command to run] | [what cannot be decided or built] |

`Section` is the SECTION anchor of the section that has the gap — `Position`, `Contracts Owned`,
`Budgets` — never a localized heading and never a bare number, so the row resolves in both language
editions. Two gaps in the same section are two rows. A gap whose fix is a command names the command
(`/sa-analysis:architecture-analysis latency-budget`), because that is where the reader goes next.
-->

---

*Generated by `sa-skills:architecture-dev-handoff` on [GENERATION_DATE]*
*Source: [ARCHITECTURE_FILE_PATH]*
