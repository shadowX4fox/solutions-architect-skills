# Security Posture Validation Spec — Consolidated Security Control Checklist

## Purpose

This spec defines how the `architecture-analysis-agent` produces a **Security Posture
Validation** document — a single, actionable checklist enumerating **every security
control that must be validated for this architecture**.

Unlike the other analyses, Security Posture is a **consolidation**: it does NOT scan the
architecture docs directly. It reads the two security-focused analysis reports that already
exist (`STRIDE` and `Data Sensitivity`) and transforms each of their evaluated controls —
both the ones that PASSED and the ones that surfaced a FINDING/gap — into one row of a
reviewer-fillable validation checklist.

**Output file**: `analysis/SECURITY-POSTURE-<YYYY-MM-DD>.md`

**Output format**: Markdown only. This analysis has no HTML/d3 viz mode — it is a worksheet,
not a visualization. The orchestrator never dispatches it with `output_format=html`.

---

## Source Inputs (the `FILES:` list)

The orchestrator passes these — read them in order:

| File | Role |
|------|------|
| `analysis/STRIDE-<date>.md` | **Primary** — per-trust-boundary STRIDE matrix (the source of STRIDE control checks) |
| `analysis/DATA-SENSITIVITY-<date>.md` | **Primary** — data inventory + required controls per sensitivity tier (the source of data-protection checks) |
| `ARCHITECTURE.md` (or `docs/01-system-overview.md`) | Header metadata only — solution name, architecture version, status |
| `docs/components/README.md` | Canonical component names (Component Naming Fidelity) |

**Missing-source rule** (fail-soft, never invent):
- If **both** primary reports are absent, abort:
  `ANALYSIS ABORTED: Security Posture requires analysis/STRIDE-*.md and analysis/DATA-SENSITIVITY-*.md. Run analyses 5 and 10 first.`
- If **one** primary report is present and the other is absent, generate the checklist from
  the one available, render the missing section's table as a single row
  `[NOT GENERATED — run the <STRIDE|Data Sensitivity> analysis first]`, and record the
  omission in Documentation Gaps and the Executive Summary. Do NOT fabricate the missing
  controls.

This spec never derives controls from raw architecture docs — every check must trace to a
row, cell, or finding in one of the two primary reports.

---

## Consolidation Model

A "check" is one security control that the architecture asserts (or should assert). Each
check becomes one checklist row. Two sources feed the checklist:

### From the STRIDE report → STRIDE Controls table

For **every cell** of **every** per-boundary STRIDE matrix (`### TB-xx` tables), and every
row of the High-Priority Threats table, emit one check:

- `Control to Validate` — the control the cell maps to (the mitigation for that STRIDE
  category at that boundary). For a PASS cell, this is the documented control verbatim
  (e.g., "TLS 1.3 in transit", "APIM rate limiting 1000 req/min"). For a FINDING cell, this
  is the spec's recommended mitigation for that category (e.g., "JWT validation at gateway",
  "centralized audit log with non-repudiation fields").
- `Sev` — the cell's severity (High / Medium / Low). PASS cells with no documented severity
  use `—`.
- `Finding` — the analysis verdict carried forward, with traceability:
  - PASS cell → `✅ Documented`
  - FINDING cell → `⚠️ Gap (<STRIDE threat ID, e.g. T1-S>)` (use the threat ID from the
    STRIDE report's High-Priority Threats table when one exists; otherwise `⚠️ Gap`)

### From the Data Sensitivity report → Data Protection Controls table

For every **S1 (Restricted)** and **S2 (Confidential)** store/queue/cache/flow in the Data
Inventory, emit one check per required control for its tier (per the Data Sensitivity spec's
Controls-Required column): encryption in transit, encryption at rest, access logging,
retention ceiling, deletion guarantee (S1); encryption in transit, encryption at rest,
access control (S2). For each:

- `Required Control` — the specific control (e.g., "Encryption at rest (TDE/envelope)").
- `Tier` — S1 / S2 (drives row coloring).
- `Finding` — `✅ Documented` if the report shows the control present, or
  `⚠️ Gap (<G-id, e.g. G2-01>)` citing the G1–G5 finding ID from the report's gap tables
  when the control is missing.

S3/S4 stores are summarized in the Executive Summary count but are NOT enumerated as
individual checks (no mandatory controls to validate).

### Check ID scheme

- STRIDE Controls: `S-01`, `S-02`, … in boundary order, then category order (S,T,R,I,D,E).
- Data Protection Controls: `D-01`, `D-02`, … in store order, then control order.

These IDs are stable references for the reviewer; the `Finding` column preserves the
original STRIDE threat ID / data gap ID for traceability back to the source report.

---

## Report Sections (in order)

1. **Executive Summary** — total checks (STRIDE + data), how many are `✅ Documented` vs
   `⚠️ Gap`, the count of High-severity / CRITICAL gaps, and a one-line posture verdict.
   Note any missing source report here.

2. **Scope & Sources** — which two reports were consolidated (filenames + their dates), the
   architecture version, and the date of this validation snapshot. A one-line instruction:
   "Mark each control Pass / Fail / N/A in the Status column; assign an Owner and link
   Evidence during the review."

3. **STRIDE Controls** — the checklist table. Columns **exactly**:

   ```
   | ID | Trust Boundary | Control to Validate | Sev | Finding | Status | Owner | Evidence |
   ```
   Leave `Status`, `Owner`, and `Evidence` cells **empty** — they are filled by the
   validating reviewer. One row per
   check from the STRIDE consolidation above. Use canonical full component / boundary names.

4. **Data Protection Controls** — the checklist table. Columns **exactly**:

   ```
   | ID | Data Store / Flow | Required Control | Tier | Finding | Status | Owner | Evidence |
   ```
   Same empty-cell rule for `Status` / `Owner` / `Evidence`. One row per required control
   for each S1/S2 store/flow.

5. **Validation Summary** — a small counts table:

   ```
   | Source | Total Checks | ✅ Documented | ⚠️ Gap | High/Critical Gaps |
   |--------|-------------|--------------|--------|--------------------|
   | STRIDE | … | … | … | … |
   | Data Protection | … | … | … | … |
   | Total | … | … | … | … |
   ```

6. **Top Validation Priorities** — the 5 highest-risk gaps to validate first, ordered by
   (severity/tier × exploitability). Each: check ID, what to validate, the source finding ID
   (STRIDE threat ID or data G-id), and the source report citation. Reuse the recommendation
   prose already present in the two source reports — do not invent new mitigations.

7. **Summary Verdict** — one paragraph: which control families are well-covered (mostly
   `✅ Documented`), which are systematically gapped, and the single most important control
   to validate before release.

8. **Documentation Gaps** — controls that could not be assessed because the source report
   marked them `[NOT DOCUMENTED]`, plus any missing source report. Checklist format
   (`- [ ]`). Carry forward the source report's own gap entries; do not re-derive.

---

## Fidelity Rules

- **No invention.** Every row traces to a cell/row/finding in `STRIDE-*.md` or
  `DATA-SENSITIVITY-*.md`. If neither report contains the data, the control is not a check —
  it is a Documentation Gap.
- **Empty reviewer cells.** `Status`, `Owner`, and `Evidence` are ALWAYS left empty in the
  generated markdown. They exist for the human reviewer; populating them would be invention.
- **Column headers verbatim.** `Status`, `Owner`, `Evidence`, `Sev` / `Tier` are the columns the
  reviewer fills and reads — do not rename or reorder them.
- **Canonical names.** Component, boundary, and store names use the canonical full form from
  `docs/components/README.md` (Component Naming Fidelity), even when the source report
  abbreviated inline.
- **Traceability preserved.** The `Finding` column always carries the originating STRIDE
  threat ID or data G-id when the source report assigned one, so a reviewer can jump back to
  the full finding.
