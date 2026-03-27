---
name: architecture-compliance-review
description: Use this skill to review compliance contract portfolio health. Validates all 10 contracts exist and are ≤6 months old, triggers regeneration for missing/expired contracts, and generates an interactive playground for exploring concept gaps across all contracts to understand what needs to be addressed to reach the auto-approve threshold (≥8.0/10).
triggers:
  - review compliance
  - compliance health
  - compliance gaps
---

# Architecture Compliance Review Skill

## Purpose

This skill acts as a **compliance portfolio health reviewer**. It validates that all 10 compliance contracts are present and fresh (≤6 months old), analyzes each contract's requirement gaps, and generates an interactive HTML playground for exploring the concept gaps across all contracts — helping you understand which areas of ARCHITECTURE.md fall short of the auto-approve threshold (≥8.0/10) and why.

**Auto-Approve Threshold**: ≥8.0/10 per contract.

**Maximum Contract Age**: 6 months. Any contract older than 6 months is considered EXPIRED and must be regenerated before review proceeds.

---

## When to Invoke This Skill

- User asks to "review compliance contracts", "check compliance coverage", or "assess compliance health"
- User wants to know what must be fixed to reach auto-approve across all contracts
- User asks for a "compliance gap analysis", "compliance dashboard", or "compliance review"
- User wants to explore which ARCHITECTURE.md concepts to update for compliance
- User uses `/skill architecture-compliance-review`

**Do NOT invoke for:**
- Generating new compliance contracts → use `architecture-compliance` skill
- **Recreating, regenerating, or rebuilding compliance contracts or the compliance manifest** → use `architecture-compliance` skill
- Creating or editing ARCHITECTURE.md → use `architecture-docs` skill
- Architecture quality peer review → use `architecture-peer-review` skill
- Business requirements documentation → use `architecture-readiness` skill

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — entry point and workflow |
| `PLAYGROUND_TEMPLATE.md` | Playground template for the interactive compliance gap explorer HTML |

---

## The 10 Required Compliance Contracts

| # | Contract Type | Identifier Prefix |
|---|---------------|-------------------|
| 1 | SRE Architecture | `SRE_ARCHITECTURE` |
| 2 | Business Continuity | `BUSINESS_CONTINUITY` |
| 3 | Cloud Architecture | `CLOUD_ARCHITECTURE` |
| 4 | Data & AI Architecture | `DATA_AI_ARCHITECTURE` |
| 5 | Development Architecture | `DEVELOPMENT_ARCHITECTURE` |
| 6 | Process Transformation & Automation | `PROCESS_TRANSFORMATION` |
| 7 | Security Architecture | `SECURITY_ARCHITECTURE` |
| 8 | Platform & IT Infrastructure | `PLATFORM_INFRASTRUCTURE` |
| 9 | Enterprise Architecture | `ENTERPRISE_ARCHITECTURE` |
| 10 | Integration Architecture | `INTEGRATION_ARCHITECTURE` |

---

## Workflow

### Step 1 — Locate COMPLIANCE_MANIFEST.md

Search for `compliance-docs/COMPLIANCE_MANIFEST.md` at the project root.

If not found, abort with:
> *"No COMPLIANCE_MANIFEST.md found. Run `/skill architecture-compliance` to generate compliance contracts first, then return here for the review."*

---

### Step 2 — Parse Manifest and Determine Coverage

Read `compliance-docs/COMPLIANCE_MANIFEST.md`. Extract:
- Project name
- For each listed contract: contract type, filename, generation date, status, score

**Get today's date** by running: `date +%Y-%m-%d`

**6-month cutoff rule**: A contract is VALID only if its generation date is within 6 calendar months of today. Compute the cutoff date = today minus 6 months (e.g., if today is 2026-03-22, the cutoff is 2025-09-22).

**For each of the 10 required contract types**, determine:
- **present**: Is the contract listed in the manifest? Confirm the file exists in `compliance-docs/` using Glob.
- **fresh**: Is the generation date on or after the 6-month cutoff?
- **contract_status**: `valid` | `missing` | `expired`

Build a coverage summary table and display it to the user:

```
| # | Contract Type                 | Status    | Generation Date | Age      | Score   |
|---|-------------------------------|-----------|-----------------|----------|---------|
| 1 | SRE Architecture              | ✅ Valid  | 2025-12-27      | 2.8 mo   | 7.69/10 |
| 2 | Business Continuity           | ❌ Missing | —              | —        | —       |
| 3 | Security Architecture         | ⚠️ Expired | 2025-01-15     | 14.2 mo  | 6.5/10  |
| … | …                             | …         | …               | …        | …       |
```

---

### Step 3 — Handle Missing and Expired Contracts

If **all 10 contracts are valid**, skip to Step 4.

If any contracts are `missing` or `expired`, present the user with a choice:

> **N contract(s) are missing or expired and cannot be included in this review.**
>
> **[A] Regenerate now** — invoke the `architecture-compliance` skill for the affected contracts, then continue the review
> **[B] Proceed with valid contracts only** — review covers only the valid contracts; missing/expired will be marked as NOT REVIEWED
> **[C] Cancel** — stop here and regenerate contracts manually with `/skill architecture-compliance`

- **Option A**: Invoke the `architecture-compliance` skill specifying only the affected contract types. Wait for completion. Re-read the manifest. Proceed to Step 4.
- **Option B**: Proceed to Step 4 with the available valid contracts. Track missing/expired contracts separately as NOT REVIEWED items in the playground data.
- **Option C**: Abort with guidance to use `/skill architecture-compliance`.

---

### Step 4 — Read Contract Files for Gap Extraction

For each contract with `contract_status = valid`, read the actual file from `compliance-docs/`.

From each contract file, extract the following data:

#### 4a. Score and Requirement Breakdown

Locate the Document Control section (table with `| Field | Value |` format) or the score summary. Extract:
- Current score (e.g., `7.69/10`)
- Projected score after resolving all Unknown gaps (if stated)

Locate the requirement breakdown section. Extract counts for:
- Blocker requirements: total, compliant, not applicable, unknown, non-compliant
- Desired requirements: total, compliant, not applicable, unknown, non-compliant

#### 4b. Gap Rows from Compliance Summary Table

Locate the **Compliance Summary Table** — a 6-column table with headers:
`| Code | Requirement | Category | Status | Source Section | Responsible Role |`

Extract every row where `Status` = `Non-Compliant` OR `Status` = `Unknown`.

For each gap row, capture:
- `code`: requirement code (e.g., `SRE-B-023`)
- `requirement`: full requirement text
- `category`: compliance category
- `status`: `Non-Compliant` or `Unknown`
- `sourceSection`: ARCHITECTURE.md source section reference
- `priority`: determine whether this is a **Blocker** or **Desired** requirement by checking which section heading precedes the row (e.g., "Blocker Requirements" or "Desired Requirements")

**Assign concept tags** to each gap based on requirement text keywords:
- Load testing, stress testing, performance testing → `["load-testing", "performance"]`
- Chaos engineering, fault injection → `["chaos-engineering", "resilience"]`
- RTO, RPO, DR, disaster recovery → `["dr-rto-rpo", "business-continuity"]`
- IAM, RBAC, authentication, authorization → `["iam", "access-control"]`
- Monitoring, observability, alerting, SLO, SLA → `["observability", "monitoring"]`
- Data retention, data classification, data governance → `["data-governance"]`
- CI/CD, pipeline, deployment automation → `["cicd", "deployment"]`
- API documentation, API contracts, OpenAPI → `["api-docs", "integration"]`
- Encryption, TLS, mTLS, certificates → `["encryption", "security"]`
- Incident management, runbooks, SOPs, on-call → `["incident-management", "operations"]`
- Capacity planning, scaling, auto-scaling → `["capacity-planning", "scalability"]`
- Compliance framework, audit, GDPR, SOC2 → `["regulatory-compliance"]`

---

### Step 5 — Compute Gap Analysis

#### 5a. Per-Contract Auto-Approve Gap

For each valid contract, compute:
- `aboveThreshold`: score ≥ 8.0
- `gapToThreshold`: max(0, 8.0 − score)
- Estimated score if all Unknown gaps resolved to Compliant:
  - For two-tier scoring (Blocker 70% weight, Desired 30% weight):
    - New blocker compliant = current compliant + current unknown
    - New blocker score % = (new compliant + not applicable) / total
    - New desired score % = (current desired compliant + current desired unknown + current desired not applicable) / total
    - Projected = (new blocker % × 0.7) + (new desired % × 0.3) × 10
  - For single-tier scoring: (resolved compliant + not applicable) / total × 10

#### 5b. Concept Clustering

Group all gaps across all contracts by concept (using the concept tags assigned in Step 4b).

For each concept cluster:
- `concept`: human-readable concept name (e.g., "Load Testing Strategy")
- `description`: one-sentence explanation of what documentation is needed
- `affectedContracts`: list of contract types that have gaps with this concept tag
- `totalGaps`: total number of gap rows tagged with this concept
- `blockerGaps`: count of gaps where `priority = blocker`
- `desiredGaps`: count of gaps where `priority = desired`
- `impactScore`: (blockerGaps × 2 + desiredGaps × 1) × (number of affectedContracts)
- `estimatedEffort`: `High` (impactScore ≥ 8) | `Medium` (4–7) | `Low` (1–3)
- `architectureSection`: inferred ARCHITECTURE.md section(s) where gaps originate (based on source sections from gap rows)

#### 5c. Priority Ranking

Sort concept clusters descending by `impactScore`. Clusters that affect more contracts with more Blocker gaps rank highest.

---

### Step 6 — Generate Compliance Gap Explorer Playground

Read `PLAYGROUND_TEMPLATE.md` from this skill's directory (use the full path resolved via `resolve-plugin-dir.ts` or equivalent).

Invoke the `playground` skill using `PLAYGROUND_TEMPLATE.md` as the template.

Embed the following JSON in the generated HTML `<script>` block as `const reviewData = { … }`:

```javascript
{
  project: "<project name from manifest>",
  reviewDate: "<today YYYY-MM-DD>",
  autoApproveThreshold: 8.0,
  coverage: {
    valid: <count>,
    missing: <count>,
    expired: <count>,
    total: 10
  },
  contracts: [
    {
      id: "<slug e.g. 'sre'>",
      type: "<Contract Type>",
      filename: "<filename or null>",
      generationDate: "<YYYY-MM-DD or null>",
      ageMonths: <float or null>,
      contractStatus: "<valid|missing|expired>",
      score: <float or null>,
      aboveThreshold: <bool or null>,
      gapToThreshold: <float or null>,
      projectedScoreAfterFix: <float or null>,
      requirements: {
        blocker: { total: N, compliant: N, notApplicable: N, unknown: N, nonCompliant: N },
        desired:  { total: N, compliant: N, notApplicable: N, unknown: N, nonCompliant: N }
      },
      gaps: [
        {
          id: "<contract-slug>-gap-<n>",
          code: "<requirement code>",
          requirement: "<requirement text>",
          category: "<category>",
          priority: "<blocker|desired>",
          status: "<Unknown|Non-Compliant>",
          sourceSection: "<section reference>",
          conceptTags: ["<tag>", ...]
        }
      ]
    }
  ],
  conceptClusters: [
    {
      id: "<slug>",
      concept: "<concept name>",
      description: "<one-sentence description>",
      affectedContracts: ["<contract type>", ...],
      totalGaps: N,
      blockerGaps: N,
      desiredGaps: N,
      impactScore: N,
      estimatedEffort: "<High|Medium|Low>",
      architectureSection: "<section(s) where gaps originate>"
    }
  ]
}
```

Follow all core playground requirements:
- Single HTML file, no external dependencies
- Dark theme, system font for UI
- Open in browser after writing: `open <filename>.html`

**Filename convention:** `compliance-review-<YYYY-MM-DD>.html`

**Fallback** — If the `playground` plugin is not installed, output the gap analysis as a structured plain-text report:

```
# Compliance Review Report
Date: <date>
Project: <name>
Coverage: <N>/10 contracts valid

## Portfolio Health
[table of 10 contracts with scores]

## Concept Clusters (Priority Order)
[ranked list with contract impact and fix guidance]

## Path to Full Auto-Approval
[per-contract projected scores]
```

---

### Step 7 — User Explores and Acts

The user interacts with the compliance gap explorer playground to:
- Identify the highest-impact concept clusters to investigate first
- See which ARCHITECTURE.md sections correspond to gap areas
- Understand which contracts are below the auto-approve threshold and by how much
- Explore which specific requirements are Non-Compliant or Unknown per contract

---

## Integration with Other Skills

| Skill | Relationship |
|-------|-------------|
| `architecture-compliance` | Prerequisite and regeneration target: this skill reads contracts generated by architecture-compliance. Triggers architecture-compliance if contracts are missing or expired. |
| `architecture-docs` | Next step after exploration: once gaps are understood from this review, use the architecture-docs skill to update ARCHITECTURE.md. |
| `playground` | External plugin dependency: generates the interactive HTML compliance gap explorer. |
| `architecture-peer-review` | Complementary: peer review validates architectural quality; this skill validates compliance contract health. Together they provide full quality assurance coverage. |

---

## Success Criteria

A successful compliance review produces:

- [ ] All 10 contract types checked for presence and freshness (≤6 months)
- [ ] Missing/expired contracts identified and handled (regenerated or acknowledged as NOT REVIEWED)
- [ ] Every valid contract's gap rows extracted (Non-Compliant + Unknown) from the compliance summary table
- [ ] Concept clusters computed with impact scores, affected contracts, and ARCHITECTURE.md section guidance
- [ ] Concept clusters ranked by impact (most contracts × most Blocker gaps = highest priority)
- [ ] Interactive HTML playground generated and opened in browser
- [ ] Portfolio summary clearly shows: N/10 contracts at auto-approve threshold, N/10 below, N/10 not reviewed
