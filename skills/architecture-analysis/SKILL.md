---
name: architecture-analysis
description: >
  Run risk and design-characteristics analyses over ARCHITECTURE.md documentation.
  Produces date-stamped reports in analysis/ covering five HIGH-priority lenses:
  SPOF (single points of failure — Critical/Degradation/Operational), Blast Radius
  (downstream cascade impact per component), Bottleneck (throughput chokepoints and
  capacity headroom), Cost Hotspots (Pareto cost concentration and over-provisioning),
  and STRIDE Threat Model (per-trust-boundary security threats). Each analysis can
  be requested individually or all five run in parallel. Output: analysis/<TYPE>-<YYYY-MM-DD>.md.
  Requires ARCHITECTURE.md to exist (created by architecture-docs skill).
  Do NOT invoke for compliance contracts (use architecture-compliance),
  peer quality review (use architecture-peer-review), or ADR management (use architecture-definition-record).
---

# Architecture Analysis Skill

## Purpose

This skill produces **risk and design-characteristics analyses** over an architecture's documentation — the kind of assessments that come out of an architecture review meeting, pre-incident review, or release-readiness audit.

It bundles **five focused analyses**, each driven by a dedicated spec and a universal sub-agent:

| # | Analysis | Lens | Output |
|---|----------|------|--------|
| 1 | **SPOF** | Single points of failure → full outage / degradation / operational | `analysis/SPOF-<date>.md` |
| 2 | **Blast Radius** | Per-component downstream cascade impact | `analysis/BLAST-RADIUS-<date>.md` |
| 3 | **Bottleneck** | Throughput chokepoints and capacity headroom | `analysis/BOTTLENECK-<date>.md` |
| 4 | **Cost Hotspots** | Pareto cost concentration and over-provisioning | `analysis/COST-HOTSPOTS-<date>.md` |
| 5 | **STRIDE** | Security threats per trust boundary | `analysis/STRIDE-<date>.md` |

**Distinct from:**
- `architecture-peer-review` — evaluates *document quality* (structure, completeness, coherence). This skill evaluates *runtime and operational risk*.
- `architecture-compliance` — generates contract adherence documents (10 compliance types). This skill produces architectural risk reports.
- `architecture-traceability` — maps PO Spec use cases to architecture sections. This skill has no dependency on a PO Spec.

---

## When to Invoke This Skill

- Before a release-readiness review or architecture gate
- During an annual architecture audit
- After a major architectural change (new component, ADR superseded, Redis removed, etc.)
- Pre-incident risk assessment or chaos engineering planning
- User asks: "find my SPOFs", "blast radius analysis", "where are my bottlenecks", "cost analysis of my architecture", "threat model my architecture", "run all analyses"
- Use `/skill architecture-analysis`

**Do NOT invoke for:**
- Document quality review → `architecture-peer-review`
- Compliance contract generation → `architecture-compliance`
- Requirements traceability → `architecture-traceability`
- ADR creation or update → `architecture-definition-record`

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — dispatcher, menu, orchestration |
| `analyses/SPOF.md` | Classification rules and report spec for SPOF analysis |
| `analyses/BLAST_RADIUS.md` | Classification rules and report spec for Blast Radius analysis |
| `analyses/BOTTLENECK.md` | Classification rules and report spec for Bottleneck analysis |
| `analyses/COST_HOTSPOTS.md` | Classification rules and report spec for Cost Hotspots analysis |
| `analyses/STRIDE.md` | Classification rules and report spec for STRIDE Threat Model |
| `templates/analysis-report-skeleton.md` | Shared section structure for all analysis reports |

---

## Step 0 — Resolve Plugin Directory

Before any workflow, resolve the absolute path to the plugin installation so spec files can be loaded by the sub-agent.

**Step A — Glob (dev/local mode)**:

Glob for: `**/solutions-architect-skills/skills/architecture-analysis/SKILL.md`

If found, strip `/skills/architecture-analysis/SKILL.md` from the result to get `plugin_dir`.

**Step B — Marketplace fallback**:

If Glob returns nothing, set:
```
plugin_dir = ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace
```

Store `plugin_dir` for use in all agent prompts.

---

## Step 1 — Locate Architecture Document

Search for `ARCHITECTURE.md` at the project root. Determine doc structure:

- **Multi-file**: `ARCHITECTURE.md` exists as a navigation index + `docs/NN-*.md` section files + `docs/components/` per-component files
- **Monolithic**: a single `ARCHITECTURE.md` file containing all sections

If no `ARCHITECTURE.md` is found, abort:
```
❌ No ARCHITECTURE.md found. Use /skill architecture-docs to create one first.
```

Build `doc_files` — an ordered list of absolute file paths to pass to each agent:
1. `ARCHITECTURE.md` (always)
2. `docs/NN-*.md` section files in numeric order (if `docs/` exists)
3. `docs/components/README.md` and `docs/components/**/*.md` in numeric order
4. All `adr/ADR-*.md` files in alphabetic order
5. `compliance-docs/COMPLIANCE_MANIFEST.md` (if present — used for SPOF and STRIDE cross-reference)

---

## Step 2 — Select Analyses (BLOCKING — user must choose)

Present the analysis menu. **Do not default or assume.** If the user says "analyze my architecture" without specifying which, present this menu:

```
═══════════════════════════════════════════════════════════
Architecture Analysis — choose analyses to run:
═══════════════════════════════════════════════════════════

  1. SPOF          (Single Points of Failure)       ~60s · 1 agent
     Critical, Degradation, and Operational failure modes with Heat Map

  2. Blast Radius  (Downstream cascade impact)      ~60s · 1 agent
     Per-component fan-out, cascade severity, bulkhead assessment

  3. Bottleneck    (Throughput chokepoints)          ~60s · 1 agent
     Serial chokepoints, connection saturation, capacity headroom

  4. Cost Hotspots (Cost concentration)             ~60s · 1 agent
     Pareto cost ranking, over-provisioning candidates, vendor lock-in cost

  5. STRIDE        (Security threats per boundary)  ~90s · 1 agent
     Per-trust-boundary STRIDE matrix, high-priority threats

  6. All five (parallel)                            ~90s · 5 agents

═══════════════════════════════════════════════════════════
Selection (e.g. "1", "1,3,5", or "all"):
```

**Parse user selection:**
- `all` or `6` → run analyses 1–5
- Comma-separated numbers → run only those analyses
- Single number → run one analysis

---

## Step 3 — Spawn Analysis Agents (Parallel)

For each selected analysis, determine:
- `analysis_type` — one of: `spof`, `blast-radius`, `bottleneck`, `cost-hotspots`, `stride`
- `spec_path` — `{plugin_dir}/skills/architecture-analysis/analyses/<SPEC_FILE>.md`
- `skeleton_path` — `{plugin_dir}/skills/architecture-analysis/templates/analysis-report-skeleton.md`
- `output_path` — `analysis/<TYPE>-<YYYY-MM-DD>.md` (where `<TYPE>` is uppercase with hyphens matching the file convention below)

| Analysis | `analysis_type` | Spec file | Output filename |
|----------|----------------|-----------|-----------------|
| SPOF | `spof` | `SPOF.md` | `SPOF-<date>.md` |
| Blast Radius | `blast-radius` | `BLAST_RADIUS.md` | `BLAST-RADIUS-<date>.md` |
| Bottleneck | `bottleneck` | `BOTTLENECK.md` | `BOTTLENECK-<date>.md` |
| Cost Hotspots | `cost-hotspots` | `COST_HOTSPOTS.md` | `COST-HOTSPOTS-<date>.md` |
| STRIDE | `stride` | `STRIDE.md` | `STRIDE-<date>.md` |

**Ensure `analysis/` directory exists:**
```bash
mkdir -p analysis
```

**Issue all Task() calls in a single message** so the harness runs them concurrently. Each call:

```
subagent_type: solutions-architect-skills:architecture-analysis-agent

Prompt:
analysis_type: <type>
spec_path: <absolute path to spec .md file>
skeleton_path: <absolute path to analysis-report-skeleton.md>
output_path: <absolute path to output .md file>
today: <YYYY-MM-DD>

FILES:
<absolute path 1 — ARCHITECTURE.md>
<absolute path 2 — docs/01-system-overview.md>
...
<absolute path N — last file>
```

Set each `description` to `"<Analysis Name> analysis"` (e.g., `"SPOF analysis"`).

**[BARRIER — wait for all agents to complete before Step 4]**

---

## Step 4 — Collect Results and Report

After all agents return, collect each agent's one-line summary.

**Check for failures**: if any agent failed to produce an output file, report:
```
⚠️ <Analysis Name> agent failed — <error summary>
   You can re-run this analysis by selecting option <N> again.
```

**Print completion summary:**

```
═══════════════════════════════════════════════════════════
✅ Architecture Analysis Complete
═══════════════════════════════════════════════════════════

  analysis/SPOF-2026-04-16.md          6 critical · 5 degradation · 3 operational
  analysis/BLAST-RADIUS-2026-04-16.md  3 high-blast · 4 isolated components
  analysis/BOTTLENECK-2026-04-16.md    4 chokepoints · top: API Gateway (fan-in ×8)
  analysis/COST-HOTSPOTS-2026-04-16.md top hotspot: Confluent Kafka ($2,100/mo)
  analysis/STRIDE-2026-04-16.md        8 high · 5 medium · 3 low priority threats

═══════════════════════════════════════════════════════════
Next steps:
  • Review reports in analysis/ — each finding includes source citations
  • Address Documentation Gaps entries to improve future analysis accuracy
  • Export to Word: /skill architecture-docs-export  (select Compliance Contract mode
    on any analysis .md file)
═══════════════════════════════════════════════════════════
```

---

## Documentation Fidelity Rule

Every finding in every analysis report MUST cite the source file and section it was derived from (e.g., `(source: docs/08-scalability-and-performance.md — Section "HPA Configuration")`). Agents must NOT invent components, costs, trust boundaries, or risks not present in the architecture documentation. Where required data is absent, the finding is marked `[NOT DOCUMENTED — add to <source-file>]` and listed in a **Documentation Gaps** section at the report footer.

---

## Output Location

All analysis reports are written to `analysis/` at the project root. Files are date-stamped — re-running the same analysis on the same day overwrites the existing file; re-running on a new date creates a new file, preserving history.

```
analysis/
├── SPOF-2026-04-16.md
├── BLAST-RADIUS-2026-04-16.md
├── BOTTLENECK-2026-04-16.md
├── COST-HOTSPOTS-2026-04-16.md
└── STRIDE-2026-04-16.md
```

---

## Prerequisites

- `ARCHITECTURE.md` created by `/skill architecture-docs`
- `docs/` directory with section files (multi-file architecture recommended for richer analysis)
- `docs/components/` with per-component files (required for Blast Radius and Bottleneck analysis)
- `compliance-docs/` (optional — used by SPOF and STRIDE for cross-reference enrichment)
- ADR files in `adr/` (optional — used to surface risk decisions)

---

## Permissions Required

Add to your project's `.claude/settings.json`:

```json
"Write(analysis/*)",
"Read(analysis/*)",
"Bash(mkdir *)",
"Agent(solutions-architect-skills:architecture-analysis-agent)"
```
