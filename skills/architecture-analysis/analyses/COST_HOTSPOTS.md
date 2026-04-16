# Cost Hotspots Analysis Spec — Cost Concentration and Over-Provisioning

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Cost Hotspots analysis. It extracts cost figures from architecture documentation, builds a Pareto ranking of where cost concentrates, identifies over-provisioning candidates and vendor lock-in cost, and generates right-sizing recommendations with trade-off analysis.

**Output file**: `analysis/COST-HOTSPOTS-<YYYY-MM-DD>.md`

---

## Cost Data Extraction Model

Architecture docs often contain cost figures in several forms. The agent must extract ALL of the following wherever they appear:

### Primary Sources

| Source | What to extract |
|--------|----------------|
| `docs/06-technology-stack.md` | Per-technology cost figures (e.g., `$1,400/month`, `$X/vCore/hour`, `Free tier`, `License included`) |
| `docs/09-operational-considerations.md` | Infrastructure running cost, observability tool subscriptions, CI/CD platform cost |
| ADRs | Cost figures cited in decision rationale (e.g., "Redis removed — saving $14–21K/year") |
| `docs/05-integration-points.md` | External SaaS subscription tiers cited in integration descriptions |
| Per-component `docs/components/**/*.md` | Instance sizes, tiers, or cost annotations in C4 metadata or body |

### Cost Data Quality Tiers

| Tier | Label | Criteria |
|------|-------|---------|
| **Q1** | Precise | Exact dollar amount with time period (e.g., `$2,100/month`) |
| **Q2** | Range | Cost range (e.g., `$14,000–$21,000/year`) |
| **Q3** | Relative | Qualitative cost mention (e.g., "high-cost tier", "most expensive SaaS") |
| **Q4** | Not Found | No cost data in docs — mark `[NOT DOCUMENTED]` |

Build the cost table using Q1/Q2 figures for Pareto ranking. Q3 items appear in a separate "Qualitative Mentions" section. Q4 items go in Documentation Gaps.

---

## Classification Model

After extracting all cost figures, classify each cost item:

### P — Pareto Cost Hotspot

A component/service is a **Cost Hotspot** when:
- Its monthly cost (Q1 or Q2 midpoint) places it in the top 80% of total documented monthly cost, OR
- It represents a cost introduced by an ADR trade-off (explicitly called out as cost-significant)

**Pareto rule**: rank all Q1+Q2 components by monthly cost descending. Find the subset that represents ≥80% of the total documented monthly cost — these are the hotspots.

### O — Over-Provisioning Candidate

A component is **Over-Provisioning Candidate** when:
- HPA min-replicas > 1 AND average utilization is documented as < 40%, OR
- The component is sized for a burst tier when the architecture does not document burst scenarios that justify it, OR
- An ADR documents that a paid tier was chosen "for future capacity" without a timeline

### V — Vendor Concentration

Flag when ≥ 60% of documented monthly cost is attributable to a single vendor or cloud provider. This is a vendor lock-in cost risk — migration cost would be high.

---

## Evidence Extraction

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Technology costs | `docs/06-technology-stack.md` | ARCHITECTURE.md Section 6 |
| Infrastructure costs | `docs/09-operational-considerations.md` | ARCHITECTURE.md Section 9 |
| ADR cost decisions | All `adr/ADR-*.md` — search for `$`, `cost`, `saving`, `budget`, `license`, `tier` | ARCHITECTURE.md Section 12 |
| SaaS subscription tiers | `docs/05-integration-points.md` | ARCHITECTURE.md Section 5 |
| HPA config (for over-provisioning) | Per-component `docs/components/**/*.md` | `docs/08-scalability-and-performance.md` |
| Utilization data (if documented) | `docs/08-scalability-and-performance.md` | Per-component `.md` files |
| Vendor attributions | By grouping all cost items by `Technology.vendor` or cloud provider | |

---

## Report Sections (in order)

1. **Executive Summary** — total documented monthly cost (sum of Q1 + Q2-midpoint figures), top cost hotspot, vendor concentration finding, one-line verdict

2. **Pareto Cost Table** — all Q1+Q2 components ranked by monthly cost descending, with a running cumulative % column

   ```
   Rank | Component / Service | Monthly Cost | Data Quality | Vendor | Cumulative % | Category
   ```
   - Mark the Pareto cutoff line (≥80% cumulative) with a separator row: `──── 80% of cost above this line ────`
   - `Category` = P (hotspot) / O (over-provisioning) / V (vendor concentration)

3. **Qualitative Cost Mentions** — Q3 items that couldn't be ranked but are still significant

   ```
   Component | Cost Mention | Source | Recommended Action
   ```

4. **Over-Provisioning Candidates Table** — O-classified components with evidence

   ```
   Component | Current Provisioning | Utilization (documented) | ADR | Estimated Monthly Waste
   ```
   Use `[NOT DOCUMENTED]` for utilization where absent.

5. **Vendor Concentration Summary** — pie breakdown by vendor/provider of documented monthly cost:

   ```
   Vendor / Provider       Monthly Cost    % of Total
   ─────────────────────────────────────────────────
   Microsoft Azure         $X,XXX/mo       NN%
   Confluent (Kafka)       $X,XXX/mo       NN%
   Auth0 (Okta)            $X,XXX/mo       NN%
   Open Source / Free      $0              0%
   ─────────────────────────────────────────────────
   Total documented        $XX,XXX/mo      100%
   ```

   If one vendor exceeds 60%: flag as **V — Vendor Concentration Risk** with a note on migration cost.

6. **ADR-Driven Cost Decisions Table** — cost figures explicitly cited in ADRs:

   ```
   ADR | Decision | Cost Impact | Annual Saving or Spend | Risk Introduced
   ```
   Example row: `ADR-013 | Redis removed | -$14,000–$21,000/year saving | Introduced latency SPOF (see SPOF D1)`

7. **Top 5 Right-Sizing Recommendations** — ordered by (monthly waste estimate × feasibility):
   - Component to right-size
   - Current tier / sizing
   - Recommended tier / sizing
   - Estimated monthly saving
   - Trade-off accepted (performance, reliability, vendor flexibility)
   - Cite the source file and, if relevant, the ADR that should be updated

8. **Summary Verdict** — overall cost posture: total documented monthly cost, vendor concentration level, proportion that is fixed vs. elastic (HPA-backed), and the top two cost optimization opportunities

9. **Documentation Gaps** — components with no cost data (Q4); note that without this data the Pareto analysis is incomplete

   ```
   Component | What cost data is missing | Suggested field to add to docs
   ```

---

## Key Patterns That Signal Cost Risk

| Pattern | Signal |
|---------|--------|
| External managed SaaS with no cost tier documented | Q4 gap — could be the largest cost item |
| ADR mentions cost savings from removing a component | Cross-reference with SPOF/Bottleneck — savings may have introduced technical debt |
| HPA `min: N` where N > 1 on a low-traffic component | Over-provisioning candidate |
| "Premium tier", "Business tier", "Enterprise tier" without utilization justification | Over-provisioning candidate |
| Single cloud provider hosting compute, data, observability, and CI/CD | Vendor concentration risk |
| Cost figure given in different currencies or time periods | Normalize to USD/month for comparison |
| `License included` or `open-source` components | Record as $0 for Pareto but note the engineering cost |

---

## Normalization Rules

When computing the Pareto table, normalize all costs to **USD/month**:

| Given format | Normalize to |
|-------------|-------------|
| `/hour` | × 730 (average hours/month) |
| `/day` | × 30 |
| `/year` | ÷ 12 |
| Range (min–max) | Use midpoint: (min + max) / 2 |
| Per-vCore | Multiply by documented vCore count |
| `Free tier` | $0 |
| `[NOT DOCUMENTED]` | Exclude from Pareto total; add to Documentation Gaps |

State the normalization assumptions in the Executive Summary footnote.
