# Section Extraction Guide — Handoff Kit (TEMPLATE_VERSION 4.3.1)

This guide maps each section of the four Ekonte templates to the
architecture source files (and analysis / compliance artefacts) from
which data is extracted, and defines the extraction rules per field.

The four templates:

- `SYSTEM_EKONTE_TEMPLATE.md` — once-per-run, whole-system storyboard
- `SETTEI_TEMPLATE.md` — once-per-run, global rules
- `SEAM_SPEC_TEMPLATE.md` — one per adjacent-service pair
- `CUT_SHEET_TEMPLATE.md` — one per C4 L2 component

Each template is filled by a dedicated sub-agent
(`ekonte-generator.md`, `settei-generator.md`, `seam-generator.md`,
`cutsheet-generator.md`). The sub-agents receive pre-sliced payloads
from `handoff-context-builder.md` — see `PAYLOAD_SCHEMA.md`.

---

## How to Use This Guide

1. Each generator reads only the fields defined for its template
   below — never re-Read shared docs / ADRs / analyses.
2. **Embed values verbatim** for tables and quotable text (edges,
   ADR IDs, requirement codes, entity names). Runtime View and Cross-Cutting Standards rules
   MUST include their citation (`→ per ADR-018`).
3. If data is not in the payload, write the specific gap marker
   documented in the template (or the generic `[NOT DOCUMENTED — add
   to <file>]`) and record the gap in the Component Specification's § 11 (never in
   the Runtime View, Cross-Cutting Standards, or Interface Contract — those don't carry gap sections).
4. Never infer, guess, or use industry-standard defaults.
5. **Component naming**: every reference to a component MUST use the
   canonical name — the component file's H1 (`name` from
   `component-facts.ts list`). This applies to
   Runtime View flows/edges, Interface Contract headers, and Component Specification § 2 Position.
6. **Per-field name resolution (Fidelity Rule)**: several extraction
   rules below read component references from sources that may use
   shortened forms — notably `docs/05-integration-points.md` rows
   (edges → Runtime View Edge Rationale + Interface Contract Integration Row) and
   `**Dependencies:**` / `**Calls:**` fields inside component files
   (Component Specification § 2 Position, § 6 Data ownership Reads-only list,
   § 7 Constraints). Whenever an extracted value names another
   documented component, you MUST resolve that name to its **canonical
   full name** — the component file's H1 (`name` from
   `component-facts.ts list`; the README index is derived and can lag)
   **before writing it into the output document**. The source may say
   `omn-spa` or `omn-bs`; if the canonical name is
   `shp-spa-product-summary` or `shp-bs-gift-cards-and-bundles`, write the
   full form. Applies to every row, table, and prose mention — never
   propagate the shortened form even if the source uses it inline.
   This is the per-field enforcement of the "Component Naming
   Fidelity" block at the top of each generator sub-agent's system
   prompt (carried through from the v2 handoff-generator fix in
   v3.27.1).

---

## Old → new template mapping (v2 → v3)

The v2 audience-segmented 8-section handoff decomposes across the four
kit artefacts:

| v2 (TEMPLATE_VERSION 2.1.0) | v3 handoff-kit destination |
|---|---|
| Section 0 Metadata | Component Specification § 0 (Metadata) |
| A1 Purpose + Key Responsibilities | Component Specification § 1 (Responsibility) |
| A1 Scope / Boundaries | Component Specification § 2 (Position) — links to Runtime View flows + Interface Contracts |
| A1 Tech Constraints | Component Specification § 7 (Constraints) |
| A1 Relevant ADRs | Component Specification § 7 (constraint reasons); Runtime View § Edge Rationale (ADR link column) |
| A2 Endpoints (titles + versions) | Component Specification § 3 (Contracts owned) — schemas move to assets |
| A2 Request/Response schemas | assets/openapi.yaml ONLY — no longer in Component Specification |
| A2 Error Codes | assets/openapi.yaml + Component Specification § 4 as INV-nn for the error contract |
| A2 Owned Entities | Component Specification § 6 (Data ownership — Owns) |
| A2 Database / Collection Schema | assets/ddl.sql ONLY |
| A3 External System Integrations | Interface Contract § Interaction + Ownership |
| A3 Async / Event-Driven Integrations | Interface Contract (per event topic pair) |
| A3 Failure Modes | Interface Contract § Failure semantics |
| B1 Functional Acceptance | Component Specification § 9 (Acceptance) |
| B1 Performance Targets | Runtime View § Budget Decomposition → Component Specification § 5 (Budgets) |
| B1 Security Checks | Cross-Cutting Standards (§ Identity, § Data) |
| B1 Error & Resilience Scenarios | Interface Contract § Failure semantics + Component Specification § 9 |
| B1 Definition of Done | Component Specification § 9 (Acceptance) |
| C1 Runtime / Resources / Scaling | Component Specification § 7 constraint pointers + assets/c4-descriptor.md (sizing) |
| C1 Config / Env / Feature Flags | not carried — the platform team's (no manifest asset since 8.104.0) |
| C1 Per-Environment Values | not carried — the platform team's (no manifest asset since 8.104.0) |
| C2 Metrics / Logs / Health / Alerts | Cross-Cutting Standards § Observability defaults; per-service invariants stay as Component Specification § 4 INV-nn |
| C2 Failure Recovery Runbook | Interface Contract § Failure semantics (downstream behaviour column) |
| C3 Assets | Component Specification § 10 (Assets) — unchanged |
| D1 Open Questions | Component Specification § 11 (Open questions) — same mechanism |

**What is deleted**: v2's self-containment principle is intentionally
replaced by shared-and-referenced. Verbatim schemas and deployment
tables are OUT of the Component Specification. The Runtime View / Cross-Cutting Standards / seam files are
always delivered together as one kit — teams reading a Component Specification also
have the shared documents open.

---

## SYSTEM_EKONTE_TEMPLATE.md — extraction rules

**Filled by**: `ekonte-generator` (sonnet), once per run.
**Payload**: `_run.md`.

### Role Quick Index (fixed text)

The `### Role Quick Index` table immediately after the metadata table
is a **fixed 4-row Architect / Dev / Ops (SRE) reading guide** — copy
verbatim from the template. Never regenerate, never customise per
project. Same rule for every template in this kit.

### Metadata table

| Field | Payload source |
|---|---|
| `[PROJECT_NAME]` | frontmatter `project_name` |
| `[EKONTE_VERSION]` | orchestrator input parameter (= `TEMPLATE_VERSION`) |
| `[ARCHITECT_NAME or NOT DOCUMENTED]` | frontmatter `architect` |
| `[STATUS]` | fixed literal `draft` (Runtime View auto-regens on every run) |
| `[ARCHITECTURE_VERSION]` | frontmatter `architecture_version` |
| `[GENERATION_DATE]` | frontmatter `generation_date` |

### Panels (4.3.1)

The storyboard's frames. Every panel is a picture the architecture already carries, cut by
`handoff-prepare.js` and carried verbatim by the generator — never drawn, never edited:

| Placeholder | Document | Payload source |
|---|---|---|
| `[FLOW_PANELS]` | Runtime View § F-NN | `_run.md` `## Panels` — the `### Panel — Phase N` fences the flow's `Panels:` line names, in phase order (the docs/04 phase `sequenceDiagram`s) |
| `[INTERFACE_PANEL]` | Interface Contract § Interaction | the seam payload's `## Panel` — the pair's nodes on the docs/03 container diagram and the edges between them, or the shortest route when the diagram joins them through an intermediary |
| `[POSITION_PANEL]` | Component Specification § 2 Position | the component payload's `## Panel` — the component and its neighbours on the docs/03 container diagram |

A `[NOT DOCUMENTED — …]` line in the payload is carried as is. The orchestrator runs
`mermaid-check.js` over the written kit (Step 5.2b).

### Scope

| Field | Payload source |
|---|---|
| `[IN_SCOPE_COMPONENTS_LIST]` | `## Scope` block, "In scope" bullets |
| `[OUT_OF_SCOPE_COMPONENTS_LIST]` | `## Scope` block, "Out of scope" bullets. Use the template's fallback text when empty. |

### Flows

For each flow entry in the payload's `## Flows` block, emit one H3
`### F-NN — <flow name>` followed by the Trigger / Path / Sequence /
Global budget / Failure posture lines (see the template's inline
comment). Preserve the flow order from the payload.

### Budget Decomposition

For each flow, emit one H3 with a table. Populate rows from the payload's
`## Latency Budget` block. Compute a `**Sum**` row per flow that adds
`p99 allocation` and `error budget` columns, and shows the delta vs the
flow's global constraint. When the payload's Latency Budget block
contains `[NOT DOCUMENTED — run /sa-analysis:architecture-analysis
latency-budget]`, propagate that marker into every row cell.

### Edge Rationale

One row per edge in the payload's `## Edges` block. The `Rationale` cell
comes from the docs/05 row's `Purpose` cell (verbatim). The `Decision`
cell links to the first related ADR (`[ADR-018](../adr/ADR-018-slug.md)`);
if none, `[NOT DOCUMENTED — record decision in adr/]`.

### Failure Posture at a Glance

Collapse the payload's `## Blast Radius` block into 3–5 bullets naming
high-cascade components and bulkhead posture. If the block is absent,
render the template's fallback text.

### Return Path

Fixed text — copy from template verbatim.

---

## SETTEI_TEMPLATE.md — extraction rules

**Filled by**: `settei-generator` (sonnet), once per run.
**Payload**: `_run.md`.

### Role Quick Index (fixed text)

The `### Role Quick Index` table immediately after the metadata table
is a **fixed 4-row Architect / Dev / QA / Ops (SRE) reading guide** —
copy verbatim from the template.

### Metadata table

| Field | Payload source |
|---|---|
| `[SETTEI_VERSION]` | orchestrator input parameter |
| `[PROJECT_NAME]` / `[ARCHITECTURE_VERSION]` / `[GENERATION_DATE]` | frontmatter |

### Rule sections

Each section pulls rules from a primary compliance domain plus keyword-
matched ADRs:

| Cross-Cutting Standards section | ADR keywords |
|---|---|
| Error semantics | error envelope, retryable, RFC 7807, error mapping |
| Versioning | semver, deprecation, breaking change, contract version |
| Identity and authorisation | mTLS, JWT, OAuth, delegation, impersonation |
| Idempotency | idempotency key, exactly-once, duplicate delivery |
| Observability conventions | tracecontext, correlation id, RED, USE, JSON logging |
| Data | classification, PII, retention, encryption |
| Resilience defaults | timeout, retry, backoff, circuit breaker, bulkhead |

**Rule format**:
```
- **MUST** [statement verbatim from the ADR body]
  → per [ADR-NNN](../adr/ADR-NNN-slug.md)
```

Use `SHOULD` / `MAY` when the source uses that verb explicitly. Never
upgrade `SHOULD` to `MUST`.

Every rule bullet MUST carry at least one citation. Sections with zero
rules render `[NOT DOCUMENTED — no institutional ADR covers it]`.

### Deviations table

If the payload has a `## Deviations` block, one row per entry. Otherwise
the template's placeholder single-row `No deviations recorded.` is
emitted.

### Return Path

Fixed pointer — copy verbatim.

---

## SEAM_SPEC_TEMPLATE.md — extraction rules

**Filled by**: `seam-generator` (sonnet), once per edge.
**Payload**: `seams/<upstream>→<downstream>.md`.

### Role Quick Index (fixed text)

The `### Role Quick Index` table immediately after the metadata table
is a **fixed 3-row Dev / QA / Ops (SRE) reading guide** — copy
verbatim from the template.

### Metadata table

| Field | Payload source |
|---|---|
| `[UPSTREAM_COMPONENT]` / `[DOWNSTREAM_COMPONENT]` | frontmatter `upstream` / `downstream` |
| `[EDGE_ID_FROM_EKONTE]` | frontmatter `edge_id_in_ekonte` |
| `[EKONTE_VERSION]` / `[SETTEI_VERSION]` | orchestrator input parameters |
| `[ADR-NNN link or NOT DOCUMENTED]` | the first entry marked `(edge)` in `## Related ADRs` (the docs/05 row's own decision); only with no `(edge)` entry, the first `(endpoint)` one; if empty, `[NOT DOCUMENTED — record decision in adr/]` |
| `[GENERATION_DATE]` | frontmatter |

### Interaction row

| Field | Source |
|---|---|
| Style | Classify `## Integration Row` Protocol as sync / async / batch / stream |
| Transport | `## Integration Row` Protocol column verbatim |
| Contract | `## Integration Row` Contract/Schema cell OR the downstream's contract asset (`assets/NN-<downstream>/openapi.yaml`); if none, `[NOT DOCUMENTED — add contract reference to docs/05-integration-points.md]` |
| Compatibility | Cite Cross-Cutting Standards: `see [CROSS_CUTTING_STANDARDS § Versioning](../CROSS_CUTTING_STANDARDS.md#versioning)` unless the payload has edge-specific compatibility notes |

### Entry / Exit state

Derive bullets from `## Boundaries Downstream`. Entry = preconditions
the caller must satisfy. Exit = postconditions the downstream guarantees.

### Mutual assumptions

**Upstream assumes** comes from `## Boundaries Upstream` (assumptions
the upstream makes about the downstream — idempotency, ordering, etc.).
**Downstream assumes** comes from `## Boundaries Downstream`
(assumptions the downstream makes about the caller — retry with backoff,
correlation-id supplied, etc.). Each side must have at least one bullet
(even if just `[NOT DOCUMENTED]`).

### Failure semantics table

Populate the four canonical rows (timeout, downstream unavailable,
poison message, partial failure) from `## Integration Row` (retry,
breaker) and `## Blast Radius Row`. Include the `version mismatch` row
only when the payload has versioning info. Empty cells → `[NOT DOCUMENTED]`.

Cascade classification comes from `## Blast Radius Row`; missing →
`[NOT DOCUMENTED — run /sa-analysis:architecture-analysis blast-radius]`.

### Ownership table

Derive `Owned by upstream`, `Owned by downstream`, `Reads-only (via
this seam)` from `## Boundaries Upstream` and `## Boundaries Downstream`.

### Observability

- Correlation row: fixed literal `per [CROSS_CUTTING_STANDARDS § Observability](../CROSS_CUTTING_STANDARDS.md#observability-conventions)`.
- Required metrics: union of RED/USE metrics from `## Related ADRs` and
  boundary rows; if none, `[NOT DOCUMENTED — add per-interface metrics to
  docs/09-operational-considerations.md]`.
- Log fields: from `## Related ADRs`; if none, `[NOT DOCUMENTED — see CROSS_CUTTING_STANDARDS § Observability]`.

### Change log

Copy the template scaffold verbatim. First row = `[GENERATION_DATE] |
Initial interface contract | [ADR-NNN or —]`.

---

## CUT_SHEET_TEMPLATE.md — extraction rules

**Filled by**: `cutsheet-generator` (sonnet), once per component.
**Payload**: `<slug>.md`.

### Role Quick Index (fixed text)

The `### Role Quick Index` table immediately after the § 0 metadata
table is a **fixed 3-row Dev / QA / Ops (SRE) reading guide** — copy
verbatim from the template.

### § 0 Metadata

| Field | Payload source |
|---|---|
| `[COMPONENT_NAME]` | `component.name` from `## Component (structured)` — must be the canonical name, i.e. the component file's H1 (`name` from `component-facts.ts list`), also equal to the payload frontmatter `component_slug` slugified |
| `[COMPONENT_NUMBER]` | `component_index_position` formatted as `5.N` |
| `[OWNER_TEAM]` | frontmatter `component_owner`; if `"Not specified"`, `[NOT DOCUMENTED — add **Owner:** field to docs/components/NN-<slug>.md]` |
| `[CUT_SHEET_VERSION]` | fixed `4.3.1` (matches TEMPLATE_VERSION) |
| `[EKONTE_VERSION]` / `[SETTEI_VERSION]` | orchestrator input parameters |
| `[ARCHITECTURE_VERSION]` / `[COMPONENT_VERSION]` / `[GENERATION_DATE]` / `[COMPONENT_FILE]` | frontmatter |

### § 1 Responsibility

One paragraph from `component.description`. **Always include the
"explicitly NOT accountable for" negation** — if the component file has
no explicit negation, seed one by inverting the "Out of scope" entries
from the boundaries block. If neither exists, mark
`[NOT DOCUMENTED — add a not-accountable clause to docs/components/NN-<slug>.md]`.

### § 2 Position

- `[FLOW_HOP_REFERENCES]`: comma-joined entries from `## Flows
  referencing this component` — e.g. `F-01 hop 2, F-03 hop 1`.
- `[UPSTREAM_SEAM_LINKS]` / `[DOWNSTREAM_SEAM_LINKS]`: one bullet per
  seam file from `## Seams incident on this component`. Link
  `../interfaces/<upstream>→<downstream>.md`.

### § 3 Contracts owned

One row per API in `component.apis` (from `## Component (structured)`).
Columns: Contract title | Version | Consumers | Asset link
(`assets/NN-<slug>/<filename>`). **Never inline schemas** — the asset
is the schema.

### § 4 Invariants

Seed from `component.responsibilities` (each responsibility → one
`INV-NN` bullet) and from ADR excerpts in `## Relevant ADRs` that
constrain this component (each constraint → one `INV-NN`). Preserve
numbering; do not renumber across regenerations.

### § 5 Budgets

Populate from `## Budgets (from Runtime View)`. Each row's Source column
links back to `SYSTEM_RUNTIME_VIEW.md § F-NN` anchor. Missing values →
`[NOT DOCUMENTED — run /sa-analysis:architecture-analysis latency-budget]`.

### § 6 Data ownership

- Owns: one bullet per entity in `component.schema.tables` +
  `## Owned Entities`.
- Reads (via contract): one bullet per entity in `component.dependencies`
  read via another service's contract, with the seam link.
- Must not access: bullets from ADRs and Cross-Cutting Standards rules that explicitly
  prohibit access.

### § 7 Constraints

- Mandated: from `component.technology` (language, framework, runtime
  version) + ADRs that mandate a technology. Each bullet ends with a
  citation: `— per [ADR-NNN](../../adr/ADR-NNN-slug.md)`.
- Prohibited: from ADRs that reject a technology for this component's
  domain. Same citation format.

Cite `## Applicable Cross-Cutting Standards Rules` for the requirement codes that apply
to this component's type.

### § 8 Deliberately unspecified

Fixed 5-bullet list from the template. **DO NOT customize.** The source
doc calls out that over-specification turns a directive into a bad
implementation.

### § 9 Acceptance

Fixed 5-item checklist. Copy verbatim.

### § 10 Assets

Populate deterministically from `asset_types[]` using the filename map
(see cutsheet-generator PHASE 2). Empty `asset_types[]` → the single
placeholder row.

### § 11 Open questions

Aggregate every `[NOT DOCUMENTED — ...]` marker written into §§ 1–7.
Sort by section number. Asset-level gaps are appended by
`kit-gaps-merge.js` after the assets are written — do not attempt to predict them here.

Format per gap:
```
- **Section [ID] — [Section Name]**: [What is missing]
  → Recommended location: [file to update]
  → Impact: [What is blocked or undefined]
```

---

**Guide version**: 4.0.0 (handoff kit — four templates, three payload
shapes, shared-and-referenced replaces v2 self-containment)

**Consumers**: `agents/generators/ekonte-generator.md`,
`agents/generators/settei-generator.md`,
`agents/generators/seam-generator.md`,
`agents/generators/cutsheet-generator.md`.
