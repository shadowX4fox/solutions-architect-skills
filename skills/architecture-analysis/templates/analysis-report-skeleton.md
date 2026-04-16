# {Analysis Type} Analysis — {Solution Name} v{Architecture Version}

**Analysis Date**: {YYYY-MM-DD}
**Architecture Source**: `ARCHITECTURE.md` v{version} (Status: {status})
**Analyst**: Architecture Analysis Skill

---

## Executive Summary

{2–4 sentences — the single highest-severity finding, the overall risk posture for this
analysis dimension, and the top remediation priority. Written for a technical decision-maker
who will read only this section. Do not pad with generic praise.}

---

## Findings

{This section is expanded by the analysis spec — each spec defines its own table structure.

SPOF:        Three sub-sections: Critical SPOFs, Degradation SPOFs, Operational SPOFs
Blast Radius: Two tables: High-Blast Components, Isolated Components
Bottleneck:  Two tables: Top Chokepoints, Convergence Points
Cost Hotspots: Two tables: Pareto Cost Table, Over-Provisioning Candidates
STRIDE:      Trust Boundary Inventory + STRIDE matrix per boundary + High-Priority Threats}

---

## Heat Map

{Present only when the analysis spec defines a 2D severity model (SPOF: Impact × Likelihood;
Blast Radius: Fan-out × Cascade; STRIDE: Severity × Exploitability). Omit for Bottleneck
and Cost Hotspots — use ranked tables instead.

ASCII format (3×3 or 4×4 grid) with finding IDs plotted at their coordinates:}

```
                HIGH IMPACT
                    │
  [C1] [C3] ────────┼──────── [C2] [C5]
                    │
  [D1] [D2] ────────┼──────── [C4] [C6]
                    │
  [O1] [O2] ────────┼──────── [D3] [D5]
                    │
               LOW IMPACT
        LOW ────────┼──────── HIGH
                LIKELIHOOD
```

---

## Top {N} Remediation Recommendations

{N is defined by the analysis spec (default 5). Ordered by severity × remediation feasibility.
Each recommendation:}

**1. {Short title} ({finding ID})**
{What to do — specific technology, pattern, or configuration change. Include the trade-off accepted
(cost, complexity, time) and the risk reduced. Cite the source file that surfaced the finding.}

**2. …**

**3. …**

---

## Summary Verdict

{1 paragraph — the overall risk posture across this analysis dimension. State what the
architecture does well (existing mitigations), what the dominant risk theme is (e.g.,
"external dependency concentration", "no horizontal scale on the data plane"), and the
minimum viable remediation set that would materially improve the posture.}

---

## Documentation Gaps

{Findings where required data was absent from the architecture documentation. Each entry
is a checklist item for the architecture team. If no gaps, omit this section.}

- [ ] `[NOT DOCUMENTED]` {Component name} — {what data is missing and which source file should contain it}
- [ ] …

---

**Source Citations**: {Comma-separated list of all `docs/*.md`, `adr/*.md`, and `compliance-docs/*.md` files read to produce this report}
**Compliance Cross-Reference**: {Any compliance contracts cited (e.g., `compliance-docs/SECURITY_ARCHITECTURE_*.md — Section "Authentication"`). Omit if none.}
