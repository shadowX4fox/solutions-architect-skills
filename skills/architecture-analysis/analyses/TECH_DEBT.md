# Tech Debt / EOL Analysis Spec

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Technology Currency and Technical Debt analysis. It classifies every documented technology by EOL / deprecation status, surfaces deprecated SDKs and abandoned patterns, identifies ADRs whose replacement is pending, and generates a prioritized modernization roadmap.

**Output file**: `analysis/TECH-DEBT-<YYYY-MM-DD>.md`

---

## Classification Model

Evaluate every technology (runtime, framework, library, SaaS service, OS, database engine) found in the architecture documentation.

### Tier T1 — EOL Now (Critical)

A technology is **T1** when:
- The vendor's **official support has ended** — no security patches are being released
- The technology is **documented with a specific EOL date that has passed** (per the architecture docs or the analysis date)
- Continuing to use it creates **unpatched CVE exposure**

**Evidence to look for:**
- `docs/06-technology-stack.md` — version numbers next to runtimes (Node.js 14, Java 8, .NET 5)
- Per-component `.md` files — "Technology" or "Runtime" fields
- ADRs referencing specific versions — check if the version was already EOL at ADR acceptance date

### Tier T2 — EOL ≤6 Months (High Urgency)

A technology is **T2** when:
- Official support ends **within 6 months** of the analysis date
- Security patches are still available today but the runway is critically short

**Same evidence sources as T1.**

### Tier T3 — Deprecated (Medium Urgency)

A technology is **T3** when:
- The vendor or maintainer has announced **"do not start new work"** or flagged it as deprecated — but still provides support/patches
- The architecture uses it as a **primary technology** (not a transitional adapter)
- Examples: an older major version of a framework still in LTS but with a successor that is the recommended path

### Tier T4 — Current (No Debt)

The technology version is within vendor active support and there is no deprecation notice.
- List in a summary table only — do not produce a findings row.

### Tier T5 — Unknown (Documentation Gap)

The architecture doc mentions the technology but **does not document the version**.
- Must appear in Documentation Gaps with a recommendation to pin the version.

---

## Technology Currency Table

For each T1–T5 technology, produce one row:

```
Tier | Technology | Documented Version | EOL / End-of-Support Date | Runway (months) | Component(s) using it | Source | Validation
```

- `EOL / End-of-Support Date` = the **WebSearch-validated** date (per the EOL Validation Protocol below). If validation could not be performed, fall back to the architecture-doc value or the version → known-EOL mapping.
- `Runway` = months from analysis date to the validated EOL. Negative = already EOL (T1).
- `Source` = the doc file and section where the technology is mentioned.
- `Validation` = one of:
  - `✅ web-validated` — search confirmed the doc/derived value within ±1 month
  - `⚠️ corrected via WebSearch — was: <doc value>` — vendor EOL is earlier than doc claimed; the table now shows the vendor value
  - `ℹ️ doc value (vendor: <later date>)` — vendor EOL is later than the doc; doc value retained as conservative
  - `⏵ WebSearch inconclusive` — search returned no authoritative result; doc/derived value retained
  - `⏵ WebSearch unavailable` — tool not granted or network error; doc/derived value only

Sort by Runway ascending (most urgent first).

---

## EOL Hotlist

Extract only T1 and T2 rows into a separate high-visibility table:

```
⚠️  EOL HOTLIST — Action Required

Tier | Technology | Version | EOL Date | Runway | Risk
```

- `Risk` = T1: CRITICAL (unpatched CVEs possible), T2: HIGH (short runway)

---

## Deprecated SDK / Library Scan

Scan all documentation for any of these keywords: "deprecated", "legacy", "v1 API", "to be replaced", "migration pending", "tech debt", "old", "sunset". For each hit:

```
Component | Technology / SDK | Context (quoted phrase) | Replacement | Source
```

- `Replacement` = the planned successor mentioned in the docs, or "[NOT DOCUMENTED]"

---

## Architectural Debt Table

Scan `adr/ADR-*.md` for ADRs whose Status is `Deprecated` or `Superseded` but whose **replacement has not yet been implemented** (no corresponding new ADR in Accepted status, or the replacement component is not present in `docs/components/`):

```
ADR | Title | Status | Superseded By | Replacement Implemented? | Risk
```

- `Replacement Implemented?` = Yes / No / Partial — derived from whether the replacement component/technology appears in the current architecture docs
- `Risk` = HIGH (core-path component), MEDIUM, LOW

---

## Heat Map

Build a **3×3 ASCII heat map**:
- **Y-axis (vertical)**: Severity — T3/Unknown (bottom) to T1/EOL Now (top)
- **X-axis (horizontal)**: Remediation Effort — LOW (config/version bump) to HIGH (re-architecture)

**Effort scoring:**
- LOW = version upgrade within major version (e.g., Node 18 → 20), no API changes
- MEDIUM = major version upgrade with breaking changes, framework migration within same paradigm
- HIGH = platform replacement, language migration, paradigm shift (e.g., REST → event-driven)

Plot T1-xx / T2-xx / T3-xx IDs at their coordinates.

---

## Report Sections (in order)

1. **Executive Summary** — count by tier (T1/T2/T3/T5), highest-risk finding, overall currency verdict; include WebSearch validation status (`N/M validated, K corrected, J inconclusive`) or the "WebSearch unavailable" notice
2. **Technology Currency Table** — full table sorted by runway ascending (includes `Validation` column)
3. **EOL Hotlist** — T1 and T2 items only, high-visibility format
4. **Deprecated SDK / Library Scan** — table of doc-flagged deprecated items
5. **Architectural Debt** — pending ADR replacements table
6. **Debt Heat Map** — severity × effort (3×3 ASCII)
7. **Top 5 Modernization Recommendations** — ordered by (severity × strategic impact × effort); each cites finding ID + source file
8. **Summary Verdict** — overall tech currency posture: what is at risk, what has a clear upgrade path, what requires architectural change
9. **Documentation Gaps** — T5 items (no version documented), components with no technology version in docs, ADRs referencing technology with no version pin

---

## Evidence Extraction Priority

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Technology list + versions | `docs/06-technology-stack.md` | Each `docs/components/**/*.md` Technology field |
| Runtime / OS versions | `docs/components/**/*.md` | ARCHITECTURE.md Section 6 |
| Deprecation / legacy flags | Keyword scan across all docs | ADRs citing "deprecated", "legacy" |
| ADR status | `adr/ADR-*.md` — Status field | ARCHITECTURE.md Section 12 ADR table |
| Replacement plans | ADRs referencing the deprecated tech | `docs/09-operational-considerations.md` roadmap |
| EOL dates | **`WebSearch` (mandatory)** — official vendor lifecycle pages, `endoflife.date`, vendor product lifecycle docs | Architecture docs (authoritative for the *fact* that the technology is in use); version → known EOL mapping as ultimate fallback when WebSearch is unavailable |

---

## EOL Validation Protocol (Mandatory)

For this analysis, **`WebSearch` is REQUIRED** to validate EOL / end-of-support dates for every technology that lands in tiers T1, T2, or T3 in Phase 2 of the agent workflow.

### Why mandatory

EOL dates documented in `docs/06-technology-stack.md` or per-component files are frequently stale:
- Vendors push EOL forward (e.g., extended support contracts)
- Vendors pull EOL backward (e.g., security incidents, accelerated deprecation)
- The doc may have been written months ago and never refreshed
- The doc may cite a version but not an EOL date — and the version → EOL mapping in the agent's knowledge can be out of date

Acting on stale EOL data produces **misleading risk reports** — either false alarms (paged about a "critical EOL" that's been extended) or, worse, missed criticals (planning a 12-month migration for a runtime that's already unsupported).

### Procedure

For every (technology, version) pair classified as T1, T2, or T3:

1. **Search**: query of the form `"<technology> <version> end of life"` or `"<technology> <version> end of support"`.
2. **Prefer authoritative sources** in this order:
   - Official vendor product lifecycle pages (`learn.microsoft.com/lifecycle`, `nodejs.org/en/about/previous-releases`, `wiki.postgresql.org/wiki/PostgreSQL_Release_Support_Policy`, `kubernetes.io/releases/`, `endoflife.date`)
   - Vendor security advisories or release-notes pages
   - Reputable third-party trackers (`endoflife.date` is acceptable as a primary source)
   - Discard blog posts older than 12 months
3. **Read the published EOL date** for the documented major version.
4. **Apply the comparison matrix** from the agent's Phase 2.5 — match / corrected / vendor-later / inconclusive / unavailable — and record the outcome in the `Validation` column of the Technology Currency Table.
5. **Re-tier** if validation moves the technology across a tier boundary (e.g., a T3 tech with a vendor-confirmed EOL within 6 months becomes T2; a T1 doc claim that the vendor refutes with a still-supported version drops to T4).

### Caching and budget

- Cache results in working memory: one search per unique (technology, version) pair across the entire run, even if multiple components share the technology.
- This bounds the number of WebSearch calls to the count of distinct stack entries — typically 5–15 for a normal architecture.

### Documentation Gap creation

Every override (architect-doc value differs from the WebSearch-validated value) MUST be added to the Documentation Gaps section as:

```
- [ ] Update `docs/06-technology-stack.md` (or `<source-file>`): <technology> <version> EOL is <vendor date>, not <doc date> (verified <today>, source: <vendor URL>)
```

This converts the validation artifact into actionable doc maintenance work.

### Behavior when WebSearch is unavailable

If the `WebSearch` tool is not granted or returns errors for every call:
- Continue the analysis using doc-only / version-mapping values
- Annotate every row's `Validation` column as `⏵ WebSearch unavailable`
- Add a single line to the Executive Summary: `⚠️ WebSearch validation unavailable — EOL dates derived from architecture docs only. Re-run with WebSearch permission for higher accuracy.`
- Do not abort — the analysis still has value as a doc-grounded baseline.
