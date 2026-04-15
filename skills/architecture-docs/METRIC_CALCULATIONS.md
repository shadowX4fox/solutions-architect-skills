# Metric Calculations

> Algorithms for metric extraction and consistency checking across the multi-file `docs/` structure

## Purpose

This document provides detailed algorithms for:
1. **Metric Consistency Detection**: Extract metrics from the Executive Summary (`docs/01-system-overview.md`), scan downstream docs for duplicates, and classify matches/mismatches/derived values

## Related Documentation

- **SKILL.md**: Operational workflows and when to trigger these calculations
- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Content templates and what metrics to document
- **DESIGN_DRIVER_CALCULATIONS.md**: Design Drivers calculation algorithms

---

## Metric Consistency Detection

### Overview

The Executive Summary Key Metrics (in `docs/01-system-overview.md` under `## Key Metrics`) contains performance metrics that serve as the **Source of Truth** for system capacity, throughput, latency, and availability targets. These metrics are often duplicated across multiple `docs/NN-*.md` files. When metrics are updated in the Executive Summary, duplicates in other files can become stale, creating inconsistencies.

This algorithm provides automatic metric consistency detection and classification across the multi-file structure.

### When to Trigger

**Automatic Trigger:**
- ✅ After editing Key Metrics in `docs/01-system-overview.md`
- ✅ When user updates any metric values in the Key Metrics subsection
- ✅ After Edit tool completes on any line in `docs/01-system-overview.md` that contains metrics (TPS, latency, SLA, etc.)

**Manual Trigger:**
- ✅ User requests: "check metrics", "verify metrics", "audit metrics", "metric consistency"
- ✅ User requests: "find duplicates", "check for stale metrics"

### Metric Extraction & Registry Building

**Step 1: Read the Executive Summary**

Read the file in full (typically 100–300 lines — well within context budget):
```
Read(file_path="docs/01-system-overview.md")
```

Locate the `## Key Metrics` section. No offsets needed.

**Step 2: Parse Metrics Using Regex Patterns**

| Metric Type | Regex Pattern | Example Match |
|-------------|---------------|---------------|
| **Average Read TPS** | `Average\s+Read\s+TPS:\s*(\d{1,3}(?:,\d{3})*)\s*transactions/second` | "Average Read TPS: 1,500 transactions/second" |
| **Peak Read TPS** | `Peak\s+Read\s+TPS:\s*(\d{1,3}(?:,\d{3})*)\s*transactions/second` | "Peak Read TPS: 3,000 transactions/second" |
| **Average Processing TPS** | `Average\s+Processing\s+TPS:\s*(\d{1,3}(?:,\d{3})*)\s*transactions/second` | "Average Processing TPS: 450 transactions/second" |
| **Peak Processing TPS** | `Peak\s+Processing\s+TPS:\s*(\d{1,3}(?:,\d{3})*)\s*transactions/second` | "Peak Processing TPS: 1,000 transactions/second" |
| **Average Write TPS** | `Average\s+Write\s+TPS:\s*(\d{1,3}(?:,\d{3})*)\s*transactions/second` | "Average Write TPS: 300 transactions/second" |
| **Peak Write TPS** | `Peak\s+Write\s+TPS:\s*(\d{1,3}(?:,\d{3})*)\s*transactions/second` | "Peak Write TPS: 800 transactions/second" |
| **Measurement Period** | `Measurement\s+Period:\s*(.+)` | "Measurement Period: Average over last 30 days" |
| **Percentile Latency** | `p(\d{2})\s*<\s*(\d+)ms` | "p95 < 100ms", "p99 < 200ms" |
| **Availability SLA** | `(\d{2,3}\.\d+)\s*%` | "99.99%", "99.9%" |
| **Concurrent Jobs** | `(\d{1,3}(?:,\d{3})*)\+?\s*concurrent` | "10,000+ concurrent", "5000 concurrent" |
| **Jobs per Hour** | `\[(\d{1,3}(?:,\d{3})*)\s*jobs?/hour\]` | "[1,620,000 jobs/hour]" |
| **Daily Volume** | `(\d{1,3}(?:,\d{3})*)\+?\s*(?:per\s*day\|daily)` | "500,000+ per day", "1,000,000 daily" |

**Step 3: Build Metrics Registry**

Extract all metrics and store in structured format (source file is always `docs/01-system-overview.md`):
```
METRICS_REGISTRY = [
  {name: "Read TPS", value: 1500, unit: "TPS", category: "Read", stat_type: "Average", source: "docs/01-system-overview.md#key-metrics", measurement_period: "Average over last 30 days in production"},
  {name: "Read TPS", value: 3000, unit: "TPS", category: "Read", stat_type: "Peak", source: "docs/01-system-overview.md#key-metrics", measurement_period: "Peak observed during Black Friday 2024"},
  {name: "Processing TPS", value: 450, unit: "TPS", category: "Processing", stat_type: "Average", source: "docs/01-system-overview.md#key-metrics", measurement_period: "Average over last quarter"},
  {name: "Processing TPS", value: 1000, unit: "TPS", category: "Processing", stat_type: "Peak", source: "docs/01-system-overview.md#key-metrics", measurement_period: "Peak during end-of-month batch processing"},
  {name: "Write TPS", value: 300, unit: "TPS", category: "Write", stat_type: "Average", source: "docs/01-system-overview.md#key-metrics", measurement_period: "Average over last month"},
  {name: "Write TPS", value: 800, unit: "TPS", category: "Write", stat_type: "Peak", source: "docs/01-system-overview.md#key-metrics", measurement_period: "Peak during data migration events"},
  {name: "System Availability", value: 99.99, unit: "%", source: "docs/01-system-overview.md#key-metrics", context: "SLA target"},
  {name: "Latency p95", value: 100, unit: "ms", source: "docs/01-system-overview.md#key-metrics", context: "response time"},
  {name: "Latency p99", value: 200, unit: "ms", source: "docs/01-system-overview.md#key-metrics", context: "response time"},
  {name: "Concurrent Jobs", value: 10000, unit: "jobs", source: "docs/01-system-overview.md#key-metrics", context: "concurrency limit"}
]
```

### Document Scanning & Match Detection

**Step 4: Scan All `docs/NN-*.md` Files for Metric References**

For each metric in the registry, use Grep to find all occurrences across the `docs/` tree (exclude the source file to avoid self-matches):

```bash
# Example searches for TPS metrics
Grep(pattern="Average\s+Read\s+TPS:\s*1,?500", path="docs/", output_mode="content", -n=True)
Grep(pattern="Peak\s+Read\s+TPS:\s*3,?000", path="docs/", output_mode="content", -n=True)
Grep(pattern="Average\s+Processing\s+TPS:\s*450", path="docs/", output_mode="content", -n=True)
Grep(pattern="Peak\s+Processing\s+TPS:\s*1,?000", path="docs/", output_mode="content", -n=True)
Grep(pattern="Average\s+Write\s+TPS:\s*300", path="docs/", output_mode="content", -n=True)
Grep(pattern="Peak\s+Write\s+TPS:\s*800", path="docs/", output_mode="content", -n=True)

# Example searches for other metric types
Grep(pattern="99\.99%", path="docs/", output_mode="content", -n=True)
Grep(pattern="p95.*100ms", path="docs/", output_mode="content", -n=True)
Grep(pattern="p99.*200ms", path="docs/", output_mode="content", -n=True)
Grep(pattern="10,?000.*concurrent", path="docs/", output_mode="content", -n=True)
```

**Note**: Use context-aware patterns to reduce false positives. For example:
- ❌ Bad: `grep "100"` (matches section numbers, version 1.00, etc.)
- ✅ Good: `grep "p95.*100ms"` (context-specific pattern)

**Step 5: Load Context for Each Match**

For each grep result, read the containing file in full (files are 50–400 lines — no offset/limit needed):
```
Read(file_path="docs/08-scalability-and-performance.md")
```

Then locate the match by line number from the grep result and read the surrounding section heading to understand context.

### Classification Algorithm

**Step 6: Classify Each Finding**

For each match, determine relationship to source metric:

**Classification Logic**:
```
1. IF match file is `docs/01-system-overview.md`:
   SKIP (this is the source of truth)

2. Read the containing file and locate the enclosing section heading for context

3. Compare metric concept:
   - Same metric name/concept → potential duplicate
   - Different context → likely unrelated

4. Classify:
   IF (same value AND same concept):
      → ✓ Exact Match (consistent)

   ELSE IF (same concept AND different value):
      → ⚠️ Mismatch (ACTION REQUIRED)

   ELSE IF (mathematical transformation detected):
      → ℹ️ Derived Value (informational)
      Example: 450 TPS × 3600 = 1,620,000 jobs/hour

   ELSE:
      → ? Ambiguous (manual review needed)
```

**Derived Value Detection**:
Common transformations to check:
- TPS → jobs/hour: multiply by 3600
- TPS → jobs/day: multiply by 86400
- Percentage → fraction: divide by 100
- ms → seconds: divide by 1000

### Report Generation

**Step 7: Generate Consistency Report**

Present findings in structured format (file-path + section-anchor citations):

```markdown
═══════════════════════════════════════════════════════════
   METRIC CONSISTENCY AUDIT REPORT
═══════════════════════════════════════════════════════════
Source of Truth: docs/01-system-overview.md → Key Metrics
Total Metrics Audited: 8
Scan Date: YYYY-MM-DD
═══════════════════════════════════════════════════════════

## ✓ Exact Matches (Consistent)

| Metric | Source Value | Location | Status |
|--------|-------------|----------|--------|
| Job Latency (p95) | < 100ms | [docs/04-data-flow-patterns.md → Performance](docs/04-data-flow-patterns.md#performance) | ✓ Match |
| Job Latency (p99) | < 200ms | [docs/04-data-flow-patterns.md → Performance](docs/04-data-flow-patterns.md#performance) | ✓ Match |
| Job Latency (p95) | < 100ms | [docs/08-scalability-and-performance.md → Performance Table](docs/08-scalability-and-performance.md#performance-table) | ✓ Match |
| Job Latency (p99) | < 200ms | [docs/08-scalability-and-performance.md → Performance Table](docs/08-scalability-and-performance.md#performance-table) | ✓ Match |

## ⚠️ Mismatches Found (ACTION REQUIRED)

| Metric | Source Value | Location | Current Value | Difference |
|--------|-------------|----------|---------------|------------|
| Peak Job Creation | 1,000 TPS | [docs/08-scalability-and-performance.md → Throughput Table](docs/08-scalability-and-performance.md#throughput-table) | 500 TPS | -500 TPS |

## ℹ️ Derived Values (Informational)

| Metric | Source Value | Location | Derived Value | Relationship |
|--------|-------------|----------|---------------|--------------|
| Job Creation | 450 TPS | [docs/01-system-overview.md → Key Metrics](docs/01-system-overview.md#key-metrics) | 1,620,000 jobs/hour | 450 × 3600 |

## ? Ambiguous Matches (Review Needed)

| Metric Pattern | Location | Recommendation |
|----------------|----------|----------------|
| "1000 TPS" | [docs/08-scalability-and-performance.md → Capacity Planning](docs/08-scalability-and-performance.md#capacity-planning) | Verify if refers to Peak Job Creation |

═══════════════════════════════════════════════════════════
SUMMARY: ✓ 4 Exact | ⚠️ 1 Mismatch | ℹ️ 1 Derived | ? 1 Ambiguous
═══════════════════════════════════════════════════════════
```

### Common Metric Locations

**Known Duplicate Locations** (typical architecture documents in the multi-file structure):

| Metric | Source File (Truth) | Common Duplicate Locations |
|--------|---------------------|---------------------------|
| Read TPS (Avg/Peak) | `docs/01-system-overview.md` → Key Metrics | `docs/08-scalability-and-performance.md` → Throughput Table |
| Processing TPS (Avg/Peak) | `docs/01-system-overview.md` → Key Metrics | `docs/08-scalability-and-performance.md` → Throughput Table; `docs/04-data-flow-patterns.md` |
| Write TPS (Avg/Peak) | `docs/01-system-overview.md` → Key Metrics | `docs/08-scalability-and-performance.md` → Throughput Table |
| System Availability (%) | `docs/01-system-overview.md` → Key Metrics | `docs/01-system-overview.md` → Use Case metrics; `docs/05-integration-points.md` → Integration SLA Table |
| Latency Targets (p95/p99) | `docs/01-system-overview.md` → Key Metrics | `docs/04-data-flow-patterns.md` → Performance; `docs/08-scalability-and-performance.md` → Performance Table |
| Concurrent Jobs | `docs/01-system-overview.md` → Key Metrics | Less commonly duplicated (usually only in Executive Summary) |

### Edge Cases & Error Handling

**Case 1: Multiple Conflicting Values**

Scenario: Same metric has different values in multiple files

Example:
- `docs/01-system-overview.md` → Key Metrics: Average Processing TPS: 450 transactions/second
- `docs/04-data-flow-patterns.md`: Average Processing TPS: 500 transactions/second
- `docs/08-scalability-and-performance.md` → Throughput Table: Average Processing TPS: 400 transactions/second

**Handling**:
```
⚠️ CONFLICT DETECTED: Average Processing TPS has 3 different values

| Location | Value | Context |
|----------|-------|---------|
| docs/01-system-overview.md → Key Metrics | 450 TPS | Design Capacity |
| docs/04-data-flow-patterns.md | 500 TPS | Data Flow Performance |
| docs/08-scalability-and-performance.md → Throughput Table | 400 TPS | Throughput Table |

Options:
1. Use Executive Summary (450 TPS) as source of truth
2. Manual review — investigate each context
```

**Case 2: Derived Value Calculation Errors**

Scenario: Derived value doesn't match expected conversion

Example:
- Source: 450 TPS
- Expected: 1,620,000 jobs/hour (450 × 3600)
- Found: 1,650,000 jobs/hour

**Handling**:
```
ℹ️ Derived Value Mismatch:
Base: 450 TPS (docs/01-system-overview.md → Key Metrics)
Expected: 1,620,000 jobs/hour
Found: 1,650,000 jobs/hour
Difference: +30,000 jobs/hour

Possible causes:
- Rounding or overhead factor
- Different calculation method
- Stale value
```

**Case 3: Ambiguous Context**

Scenario: Number matches but unclear if same metric

**Handling**:
```
? AMBIGUOUS MATCH: "1,000 TPS" found in multiple contexts

Source (docs/01-system-overview.md → Key Metrics):
"Peak Capacity: 1,000 TPS job creation"

Found Matches:
1. docs/08-scalability-and-performance.md → Throughput Table: "System limit 1,000 TPS"
   → Likely same metric ✓

2. docs/08-scalability-and-performance.md → Capacity Planning: "1000 TPS limit"
   → Context unclear, review needed
```

**Case 4: No Matches Found**

Scenario: Metric exists in Executive Summary but never referenced elsewhere

**Handling**:
```
ℹ️ INFORMATIONAL: Metric appears only in Executive Summary

Metric: Concurrent Jobs (10,000+)
Location: docs/01-system-overview.md → Key Metrics
Coverage: Not referenced in other files

Recommendation:
- If important: Add to docs/08-scalability-and-performance.md
- If summary-only: No action needed
```

**Case 5: Too Many False Positives**

Scenario: Common number matches unrelated contexts

**Mitigation**:
- Use context-aware grep patterns
- ❌ Avoid: `grep "100"` (too broad)
- ✅ Use: `grep "p95.*100ms"` (context-specific)
- ✅ Use: `grep "100\s*TPS"` (unit-specific)

---

## Best Practices

### DO:
- ✅ Always scan all `docs/NN-*.md` files after Executive Summary metric changes
- ✅ Present findings before making any changes (review-only first)
- ✅ Explain context for each mismatch (file path + section heading)
- ✅ Use context-aware grep patterns to reduce false positives
- ✅ Read matched files in full (50–400 lines is within budget)
- ✅ Show exact before/after text for transparency
- ✅ Cite findings with file-path + section-anchor links

### DON'T:
- ❌ Auto-update without user approval (always review first)
- ❌ Change metrics in unrelated files without confirming
- ❌ Ignore ambiguous matches (always flag for review)
- ❌ Forget to check derived values (TPS → jobs/hour conversions)
- ❌ Use overly broad grep patterns
- ❌ Cite findings by line number (use file path + section anchor instead)

---

## Implementation Notes

**Context Efficiency**:
- Read each `docs/NN-*.md` file in full — files are 50–400 lines, no offset/limit needed
- Use Grep tool for cross-file searches (more efficient than reading every file)
- Start with `docs/01-system-overview.md` to build the registry, then scan `docs/` for references

**User Interaction**:
- Always present report before making changes
- Offer options: Update Source, Update Duplicates, Ignore, Manual Review
- Show preview with exact before/after text
- Confirm user approval before applying changes

**Workflow Integration**:
- Automatically trigger after edits to `docs/01-system-overview.md` Key Metrics
- Report completion summary with all changes made
