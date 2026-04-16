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
Tier | Technology | Documented Version | EOL / End-of-Support Date | Runway (months) | Component(s) using it | Source
```

- `EOL / End-of-Support Date` = from architecture docs. If the docs cite a date, use it. If the docs only name a version (e.g., "Node.js 18"), use the known EOL for that version — and note in the table footnote that this was derived from the version number.
- `Runway` = months from analysis date to EOL. Negative = already EOL (T1).
- `Source` = the doc file and section where the technology is mentioned.

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

1. **Executive Summary** — count by tier (T1/T2/T3/T5), highest-risk finding, overall currency verdict
2. **Technology Currency Table** — full table sorted by runway ascending
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
| EOL dates | Architecture docs (authoritative); version → known EOL mapping as secondary | Agent may use WebSearch to look up current EOL for a version if suspicious, per Documentation Fidelity Rule |

**WebSearch note**: The `WebSearch` permission is available. If a documented version's EOL date seems inconsistent with known release history (e.g., docs say "Node.js 20 EOL: 2022"), the agent MAY search for the official EOL to verify — but MUST report the architecture-doc value and note the discrepancy. Never replace the documented value with the web-sourced value.
