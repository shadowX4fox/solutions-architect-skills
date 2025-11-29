---
name: architecture-docs
description: Use this skill when creating, updating, or maintaining ARCHITECTURE.md files or when the user asks about architecture documentation
---

# Architecture Documentation Skill

This skill provides comprehensive guidelines for creating and maintaining ARCHITECTURE.md files using the standardized template from ARCHITECTURE_DOCUMENTATION_GUIDE.md.

## When This Skill is Invoked

Automatically activate when:
- User asks to create architecture documentation
- User asks to update or edit ARCHITECTURE.md
- User mentions documenting system architecture
- User requests architecture review, audit, or analysis (triggers Design Drivers calculation prompt)
- User explicitly asks to "calculate design drivers" or "update design drivers"
- User asks about architecture documentation structure or best practices
- User edits Section 1 Executive Summary Key Metrics (triggers metric consistency check)
- User requests metric consistency check, verify metrics, or audit metrics

## File Naming Convention

**IMPORTANT**: All architecture documents MUST be named **ARCHITECTURE.md**

- When creating a new architecture document, always use the filename: `ARCHITECTURE.md`
- When updating existing architecture, work with the file: `ARCHITECTURE.md`
- Do NOT use alternative names like: architecture.md, ARCH.md, system-architecture.md, etc.
- Each project/system should have ONE primary ARCHITECTURE.md file

### Location
- Place ARCHITECTURE.md in the root of the project or in a `/docs` directory
- For multi-project repositories, each project subdirectory gets its own ARCHITECTURE.md

## Working with ARCHITECTURE.md - Context Optimization

**IMPORTANT**: When working with ARCHITECTURE.md, optimize for context by loading sections incrementally, NOT the entire document at once.

### Context-Efficient Workflow

1. **Initial Assessment**
   - Read ONLY lines 1-50 of ARCHITECTURE.md to locate the **Document Index**
   - The Document Index provides exact line ranges for each section
   - Use the index to plan which sections need work
   - Identify which specific section(s) need work

2. **Section-Based Editing**
   - Use the Document Index to find exact line ranges for your target section
   - Use the Read tool with `offset` and `limit` parameters to load ONLY the relevant section
   - **Add context buffer**: Read ±10-20 lines beyond the section boundaries
   - Work on one section at a time
   - Example: Index shows Section 5 is lines 601-850, read lines 590-860 (with 10-line buffer)

3. **Incremental Updates**
   - Make edits to individual sections using the Edit tool
   - Avoid reading the full document unless absolutely necessary
   - For multi-section updates, work sequentially section by section
   - Update the Document Index line ranges if section size changes significantly

4. **Verification**
   - After edits, read ONLY the modified section to verify changes
   - Use Grep to search for specific content without loading full file
   - Update "Index Last Updated" date in the Document Index after major changes

### Using the Document Index

**Every ARCHITECTURE.md should include a Document Index** (before Section 1) with exact line ranges.

**Index Format Example:**
```markdown
## Document Index

**Quick Navigation:**
- [Section 1: Executive Summary](#1-executive-summary) → Lines 1-80
- [Section 2: System Overview](#2-system-overview) → Lines 81-150
- [Section 3: Architecture Principles](#3-architecture-principles) → Lines 151-350
- [Section 4: Meta Architecture Layers](#4-meta-architecture-layers) → Lines 351-600
- [Section 5: Component Details](#5-component-details) → Lines 601-850
- [Section 6: Data Flow Patterns](#6-data-flow-patterns) → Lines 851-1000
- [Section 7: Integration Points](#7-integration-points) → Lines 1001-1150
- [Section 8: Technology Stack](#8-technology-stack) → Lines 1151-1300
- [Section 9: Security Architecture](#9-security-architecture) → Lines 1301-1550
- [Section 10: Scalability & Performance](#10-scalability--performance) → Lines 1551-1750
- [Section 11: Operational Considerations](#11-operational-considerations) → Lines 1751-1950
- [Section 12: Architecture Decision Records (ADRs)](#12-architecture-decision-records-adrs) → Lines 1951-end

**Index Last Updated:** YYYY-MM-DD
```

**How to Use the Index:**

1. **Find the Index**: Read lines 1-50 to locate the Document Index
2. **Identify Target Section**: Check the index for exact line ranges
3. **Load with Context Buffer**: Read target section ± 10-20 lines for context preservation
4. **Example**:
   ```
   # To edit Section 5 (Component Details):
   # Index shows: Lines 601-850
   # Load with 10-line buffer:
   Read(file_path="ARCHITECTURE.md", offset=590, limit=270)
   # This reads lines 590-860
   ```

**Context Buffer Guidelines:**

| Edit Type | Buffer Size | Use Case |
|-----------|-------------|----------|
| **Minimal** | ±5-10 lines | Small edits (single paragraph, config value) |
| **Standard** | ±10-20 lines | Section edits (rewriting subsection, adding components) |
| **Extended** | ±20-50 lines | Cross-section edits (changes referencing adjacent sections) |

**Maintaining the Index:**

After significant edits:
1. Use `grep -n "^## [0-9]" ARCHITECTURE.md` to find actual section line numbers
2. Update the Document Index with current line ranges
3. Update "Index Last Updated" date
4. Verify index accuracy periodically (quarterly reviews)

**Note**: The Document Index is part of the ARCHITECTURE_DOCUMENTATION_GUIDE.md template and should be included in all new ARCHITECTURE.md files.

---

## Automatic Index Updates

**CRITICAL**: After ANY edit that significantly changes section line numbers, automatically update the Document Index.

### When to Update the Index

**Update the Document Index if:**
- ✅ You added/removed content that shifts section boundaries (>10 lines)
- ✅ You added/removed entire subsections or major content blocks
- ✅ You modified section headers or restructured sections
- ✅ User explicitly requests: "update the index" or "update document index"

**Do NOT update if:**
- ❌ Minor edits (<10 lines) within a section that don't shift other sections
- ❌ Only updating metadata (dates, version numbers, single values)
- ❌ Fixing typos or formatting issues

### Index Update Workflow

**Step 1: Detect Section Boundaries**

Run this bash command to find all numbered section headers:
```bash
grep -n "^## [0-9]" ARCHITECTURE.md
```

This returns output like:
```
25:## 1. Executive Summary
54:## 2. System Overview
147:## 3. Architecture Principles
...
```

**Step 2: Calculate Line Ranges**

Parse the grep output to calculate ranges:
- Each section starts at its header line
- Each section ends at (next section's start line - 1)
- Last section ends at "end" or last line of file
- Use the format: `Lines START-END`

**Example Calculation:**
```
Section 1: Lines 25-53  (from line 25 to 54-1)
Section 2: Lines 54-146 (from line 54 to 147-1)
Section 3: Lines 147-300 (from line 147 to 301-1)
...
Section 12: Lines 1917-1940 (or "1917-end" if last section)
```

**Step 3: Update the Document Index**

Use the Edit tool to update the Document Index section (typically lines 5-21):
1. Update line ranges for all sections that changed
2. Verify anchor links match section headers exactly
3. Update `**Index Last Updated:**` to current date (YYYY-MM-DD format)
4. Preserve the exact formatting and structure

**Step 4: Inform the User**

Report which sections had their line ranges updated:
```
✅ Document Index updated:
   - Section 8: Lines 906-980 → Lines 912-996
   - Section 9: Lines 982-1228 → Lines 998-1244
   - Index Last Updated: 2025-01-16
```

### Automation Template

**When completing a section edit, automatically:**

1. **Check if index update needed**:
   - Ask: "Did my edit add/remove >10 lines?"
   - Ask: "Did I modify section headers or structure?"

2. **If YES, run the update workflow:**
   ```bash
   # Get current section positions
   grep -n "^## [0-9]" ARCHITECTURE.md
   ```

3. **Parse grep output to extract section line numbers**
   - Store each section number and its starting line
   - Calculate end line (next section start - 1)

4. **Build new index content:**
   ```markdown
   - [Section N: Title](#anchor) → Lines START-END
   ```

5. **Update the index (typically lines 5-21):**
   - Use Edit tool to replace the Quick Navigation list
   - Update "Index Last Updated" date

6. **Notify user:**
   - Report updated sections
   - Confirm index is current

### Example: Complete Index Update

**Scenario:** After adding Confluent Kafka to Section 8 (Technology Stack), the section grew from lines 906-980 to lines 912-996.

**Automated Workflow:**

```markdown
1. Detect change: Section 8 grew by 10 lines
2. Run: grep -n "^## [0-9]" ARCHITECTURE.md
3. Parse output:
   - Section 1: Line 25
   - Section 2: Line 54
   ...
   - Section 8: Line 912
   - Section 9: Line 998
   - Section 10: Line 1244
   ...
   - Section 12: Line 1923

4. Calculate ranges:
   - Section 8: Lines 912-997 (912 to 998-1)
   - Section 9: Lines 998-1243 (998 to 1244-1)
   - Section 10: Lines 1244-1417 (1244 to next-1)
   ...

5. Update index:
   - [Section 8: Technology Stack](#8-technology-stack) → Lines 912-997
   - [Section 9: Security Architecture](#9-security-architecture) → Lines 998-1243
   - [Section 10: Scalability & Performance](#10-scalability--performance) → Lines 1244-1417
   - **Index Last Updated:** 2025-01-16

6. Report to user:
   "✅ Document Index updated - Sections 8-12 line ranges adjusted after Technology Stack expansion"
```

### Manual Index Update

**User can explicitly request index update:**
- "Update the document index"
- "Refresh the index line numbers"
- "Fix the index"

**When requested:**
1. Always run the full update workflow regardless of recent changes
2. Update all section line ranges
3. Update the timestamp
4. Report all changes to the user

### Common Scenarios

| Scenario | Action | Example |
|----------|--------|---------|
| **Added 50-line component** | ✅ Update index | Added Section 5.6, shifts Section 6-12 |
| **Fixed 2 typos** | ❌ Skip update | Minimal impact, no section shifts |
| **Removed subsection (30 lines)** | ✅ Update index | Section 9 shortened, shifts Section 10-12 |
| **Updated date metadata** | ❌ Skip update | No structural changes |
| **Restructured principles** | ✅ Update index | Section 3 reorganized, may affect length |
| **User says "update index"** | ✅ Always update | Manual request, always honor |

### Verification Checklist

After updating the index, verify:
- ✅ All 12 sections are listed
- ✅ Line ranges are sequential (no gaps or overlaps)
- ✅ Anchor links match actual section headers exactly
- ✅ "Index Last Updated" date is current (YYYY-MM-DD)
- ✅ Format matches the template (consistent spacing and symbols)

### Best Practices

**DO:**
- ✅ Update index immediately after significant edits
- ✅ Run grep to get accurate line numbers (don't guess)
- ✅ Update timestamp every time you update ranges
- ✅ Report changes to user for transparency
- ✅ Preserve exact markdown formatting in index

**DON'T:**
- ❌ Update index for every tiny change
- ❌ Guess line ranges without running grep
- ❌ Forget to update the timestamp
- ❌ Change index format or structure
- ❌ Skip notifying user about index updates

---

## Metric Consistency Detection & Management

**CRITICAL**: The Executive Summary (Section 1, Key Metrics subsection around lines 31-38) contains performance metrics that serve as the **Source of Truth** for system capacity, throughput, latency, and availability targets. These metrics are often duplicated across multiple sections (especially Section 6: Data Flow, Section 7: Integration Points, and Section 10: Scalability & Performance).

**Problem**: When metrics are updated in the Executive Summary, duplicates in other sections can become stale, creating inconsistencies.

**Solution**: This skill provides automatic metric consistency detection and review-based synchronization.

### When to Trigger Metric Audit

**Automatic Trigger:**
- ✅ After editing Section 1 Executive Summary Key Metrics (typically lines 31-38)
- ✅ When user updates any metric values in the Key Metrics subsection
- ✅ After Edit tool completes on lines in Section 1 that contain metrics (TPS, latency, SLA, etc.)

**Manual Trigger:**
- User explicitly requests: "Check metric consistency", "Verify metrics", "Audit metrics", "Sync metrics"
- User updates Section 10 (Scalability & Performance) and asks to verify consistency with Exec Summary
- During quarterly documentation review or audit

**Do NOT Trigger:**
- ❌ Minor edits outside Key Metrics subsection (e.g., updating document version or date)
- ❌ Edits to narrative text that don't change numeric metric values
- ❌ Changes to other sections that don't involve performance metrics

### Metric Audit Workflow

**Step 1: Extract Executive Summary Metrics**

Read ONLY lines 30-40 (Key Metrics section) using context-efficient approach:
```bash
Read(file_path="ARCHITECTURE.md", offset=30, limit=10)
```

Parse and extract all metrics with their values using these patterns:

| Metric Type | Pattern | Example Match |
|-------------|---------|---------------|
| **TPS Capacity** | `(\d{1,3}(?:,\d{3})*)\s*(?:TPS\|transactions per second)` | "450 TPS", "1,000 transactions per second" |
| **Percentile Latency** | `p(\d{2})\s*<\s*(\d+)ms` | "p95 < 100ms", "p99 < 200ms" |
| **Availability SLA** | `(\d{2,3}\.\d+)\s*%` | "99.99%", "99.9%" |
| **Concurrent Jobs** | `(\d{1,3}(?:,\d{3})*)\+?\s*concurrent` | "10,000+ concurrent", "5000 concurrent" |
| **Jobs per Hour** | `\[(\d{1,3}(?:,\d{3})*)\s*jobs?/hour\]` | "[1,620,000 jobs/hour]" |

Build a metrics registry from parsed data:
```
METRICS_REGISTRY = [
  {name: "Job Creation Capacity", value: 450, unit: "TPS", line: 32},
  {name: "Job Execution Capacity", value: 500, unit: "TPS", line: 33},
  {name: "Peak Job Creation", value: 1000, unit: "TPS", line: 34},
  {name: "Peak Job Execution", value: 2000, unit: "TPS", line: 34},
  {name: "Initial Load Creation", value: 150, unit: "TPS", line: 35},
  {name: "Initial Load Execution", value: 350, unit: "TPS", line: 35},
  {name: "System Availability", value: 99.99, unit: "%", line: 36},
  {name: "Latency p95", value: 100, unit: "ms", line: 37},
  {name: "Latency p99", value: 200, unit: "ms", line: 37},
  {name: "Concurrent Jobs", value: 10000, unit: "jobs", line: 38}
]
```

**Step 2: Scan Document for Metric References**

Use Grep to find all occurrences of each metric value (context-efficient, no full file load):

```bash
# For each metric in registry, search with appropriate pattern
Grep(pattern="450\s*TPS", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="500\s*TPS", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="1,?000\s*TPS", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="2,?000\s*TPS", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="150\s*TPS", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="350\s*TPS", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="99\.99%", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="p95.*100ms", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="p99.*200ms", path="ARCHITECTURE.md", output_mode="files_with_matches")
Grep(pattern="10,?000.*concurrent", path="ARCHITECTURE.md", output_mode="files_with_matches")
```

**Note**: Use `-n` flag with grep bash command if you need line numbers, or use Grep tool with `output_mode="content"`.

**Step 3: Load Context for Each Match**

For each grep result, read ±5 lines for context to determine if it's a duplicate or coincidental match:
```bash
# If match found at line 787
Read(file_path="ARCHITECTURE.md", offset=782, limit=10)
# Reads lines 782-792 for context
```

**Step 4: Classify Findings**

Categorize each finding into one of four categories:

- **✓ Exact Match**: Same value, same metric concept, already consistent with Executive Summary
- **⚠️ Mismatch**: Same metric concept but different value (ACTION REQUIRED - user must decide)
- **ℹ️ Derived Value**: Related but transformed metric (e.g., 450 TPS = 1,620,000 jobs/hour via 450 × 3600)
- **? Ambiguous**: Number matches but context is unclear (flag for manual review)

**Classification Logic**:
1. Check if line is in Section 1 (skip, that's the source of truth)
2. Read context (±5 lines) to understand what the metric represents
3. Compare metric concept (is this the same "Job Creation Capacity" or different metric?)
4. Determine relationship (exact duplicate, derived value, or unrelated)

**Step 5: Generate Consistency Report**

Present findings in structured, user-friendly format:

```markdown
═══════════════════════════════════════════════════════════
   METRIC CONSISTENCY AUDIT REPORT
═══════════════════════════════════════════════════════════
Source of Truth: Section 1 (Executive Summary) Lines 31-38
Total Metrics Audited: 10
═══════════════════════════════════════════════════════════

## ✓ Exact Matches (Consistent)

| Metric | Exec Value | Location | Context | Status |
|--------|-----------|----------|---------|--------|
| Job Latency (p95) | < 100ms | Line 787 | Section 6: Data Flow Performance | ✓ Match |
| Job Latency (p99) | < 200ms | Line 787 | Section 6: Data Flow Performance | ✓ Match |
| Job Latency (p95) | < 100ms | Line 1345 | Section 10: Performance Table | ✓ Match |
| Job Latency (p99) | < 200ms | Line 1345 | Section 10: Performance Table | ✓ Match |

## ⚠️ Mismatches Found (ACTION REQUIRED)

| Metric | Exec Value | Location | Current Value | Difference |
|--------|-----------|----------|---------------|------------|
| Peak Job Creation | 1,000 TPS | Line 1367 | 500 TPS | -500 TPS |

## ℹ️ Derived Values (Informational)

| Metric | Exec Value | Location | Derived Value | Relationship |
|--------|-----------|----------|---------------|--------------|
| Job Creation | 450 TPS | Line 32 | 1,620,000 jobs/hour | 450 × 3600 |

═══════════════════════════════════════════════════════════
SUMMARY: ✓ 4 Matches | ⚠️ 1 Mismatch | ℹ️ 1 Derived
═══════════════════════════════════════════════════════════
```

**Step 6: Await User Decision**

If mismatches found, present options to user:
```
I found 1 metric mismatch. What would you like to do?

1. [Review Details] - Show detailed context for the mismatch
2. [Update Exec Summary] - Update Section 1 to match line 1367 (500 TPS)
3. [Update Document] - Update line 1367 to match Exec Summary (1,000 TPS)
4. [Preview Changes] - Show exactly what will change before applying
5. [Manual Review] - I'll review and decide later
6. [Ignore] - Keep as-is (intentional difference)
```

**Step 7: Apply Approved Changes**

If user approves updates:
1. Show preview of all changes (exact before/after for each location)
2. Confirm user approval
3. Use Edit tool to update each location sequentially
4. Update Document Index if line numbers shift significantly (>10 lines)
5. Report completion with summary of all changes made

### Common Metric Locations

**Known Duplicate Locations** (for typical architecture documents):

| Metric | Executive Summary | Common Duplicate Locations |
|--------|------------------|---------------------------|
| Job Creation Capacity (450 TPS) | Line ~32 | Section 10 Throughput Table (~line 1367) |
| Job Execution Capacity (500 TPS) | Line ~33 | Section 10 Throughput Table (~line 1368), Section 6 Data Flow (~line 787) |
| Peak Capacity (1,000/2,000 TPS) | Line ~34 | Section 10 Throughput Table (~lines 1367-1368) |
| Initial Load (150/350 TPS) | Line ~35 | Section 10 Capacity Planning (~lines 1378-1379) |
| System Availability (99.99%) | Line ~36 | Section 2 Use Case metrics (~line 115), Section 7 Integration SLA Table (~lines 829-832) |
| Latency Targets (p95/p99) | Line ~37 | Section 6 Data Flow Performance (~line 787), Section 10 Performance Table (~line 1345) |
| Concurrent Jobs (10,000+) | Line ~38 | Less commonly duplicated (usually only in Exec Summary) |

**Note**: Line numbers are approximate and vary by document. Use grep to find exact locations.

### Metric Update Best Practices

**DO:**
- ✅ Always scan full document after Exec Summary metric changes
- ✅ Present findings before making any changes (review-only first)
- ✅ Explain context for each mismatch (which section, what table/paragraph)
- ✅ Offer batch update option for multiple occurrences of same metric
- ✅ Show preview with exact before/after text for transparency
- ✅ Update Document Index if edits shift section boundaries

**DON'T:**
- ❌ Auto-update without user approval (always review-only first)
- ❌ Change metrics in unrelated sections without confirming intent
- ❌ Ignore ambiguous matches (always flag for review)
- ❌ Forget to check derived values (e.g., jobs/hour conversions from TPS)
- ❌ Skip context loading (always read ±5 lines to understand match)

### Error Handling & Edge Cases

**1. Multiple Conflicting Values**

Scenario: Same metric has different values in multiple sections (not just Exec Summary vs. one location)

Example:
- Exec Summary (Line 32): 450 TPS
- Section 6 (Line 787): 500 TPS
- Section 10 (Line 1367): 400 TPS

**Handling:**
```
⚠️ CONFLICT DETECTED: Job Execution Capacity has 3 different values

| Location | Value | Context |
|----------|-------|---------|
| Line 32 (Exec Summary) | 450 TPS | Design Capacity |
| Line 787 (Section 6) | 500 TPS | Data Flow Performance |
| Line 1367 (Section 10) | 400 TPS | Throughput Table |

Which value is correct?
1. Use Exec Summary (450 TPS) as source of truth
2. Use most common value (if clear majority)
3. Manual review - I need to investigate further

Please clarify which value should be used across all locations.
```

**2. Derived Value Calculation Errors**

Scenario: Derived value doesn't match expected conversion

Example:
- Exec Summary: 450 TPS
- Expected derived: 1,620,000 jobs/hour (450 × 3600)
- Found in doc: 1,650,000 jobs/hour

**Handling:**
```
ℹ️ Derived Value Mismatch Detected:

Metric: Job Creation Capacity
Base Value: 450 TPS (Line 32)
Expected Derived: 1,620,000 jobs/hour (450 × 3600)
Actual Found: 1,650,000 jobs/hour (Line 32)
Difference: +30,000 jobs/hour

Possible causes:
- Rounding or overhead factor applied
- Different calculation method
- Stale value from previous metric update

Would you like to:
1. Update to calculated value (1,620,000)
2. Keep current value (1,650,000) - might be intentional overhead
3. Investigate further
```

**3. Ambiguous Metric Context**

Scenario: Number matches but unclear if it's the same metric

Example:
- Exec Summary: Peak Capacity 1,000 TPS
- Found at line 1367: "System limit 1,000 TPS (theoretical max)"
- Found at line 1372: "Target throughput 1,000 TPS (steady state)"
- Found at line 1389: "1000 TPS limit"

**Handling:**
```
? AMBIGUOUS MATCH: Value "1,000 TPS" found in multiple contexts

Exec Summary Definition (Line 34):
"Peak Capacity: 1,000 TPS job creation, 2,000 TPS job execution (system limits)"

Found Matches:
1. Line 1367: "System limit 1,000 TPS"
   Context: Throughput table - appears to be same metric ✓

2. Line 1372: "1000 TPS (theoretical max)"
   Context: Throughput calculation - likely same metric ✓

3. Line 1389: "1000 TPS limit"
   Context: Capacity planning - likely same metric ✓

All 3 appear to reference Peak Capacity. Treat as exact matches? [Yes/No/Review Each]
```

**4. No Matches Found**

Scenario: Metric exists in Exec Summary but never referenced elsewhere

Example:
- Exec Summary: "Concurrent Jobs: Support for 10,000+ concurrent scheduled jobs"
- Grep search: No matches found in rest of document

**Handling:**
```
ℹ️ INFORMATIONAL: Metric appears only in Executive Summary

Metric: Concurrent Jobs (10,000+)
Location: Line 38 (Section 1)
Document Coverage: Not referenced in other sections

This is not necessarily an error - some high-level metrics may only appear in Exec Summary.

Recommendation:
- If this metric is important to architecture, consider adding to Section 10 (Scalability & Performance)
- If it's a summary-only metric, no action needed

Would you like to:
1. Add this metric to Section 10
2. Keep as-is (Exec Summary only)
3. Ignore this finding
```

**5. Too Many Grep Results**

Scenario: Common number matches hundreds of unrelated contexts

Example: Searching for "100" also matches "100 pods", "section 100", "version 1.00"

**Handling:**
- Use context-aware grep patterns to reduce false positives:
  - Bad: `grep -n "100" ARCHITECTURE.md` (too broad)
  - Good: `grep -n "p95.*100ms" ARCHITECTURE.md` (context-aware)
  - Better: `grep -n "p95\s*<\s*100ms" ARCHITECTURE.md` (exact pattern)

- If still >20 matches after context-aware patterns:
  1. Load only first 10 matches
  2. Present summary: "Found 47 matches for '100' - showing first 10 most relevant"
  3. Ask user if they want to see all or refine search pattern

### Example: Complete Metric Update Workflow

**Scenario:** User updates Job Execution Capacity from 500 TPS to 700 TPS

**Step-by-Step Execution:**

1. **User Action**:
   ```
   User: "Update the job execution capacity to 700 TPS in the Executive Summary"
   ```

2. **Claude Applies Edit**:
   ```
   [Uses Edit tool to change line 33: "500 TPS" → "700 TPS"]
   ✓ Updated line 33: Design Capacity - Job Execution: 700 TPS

   Now checking for metric consistency across the document...
   ```

3. **Automatic Audit Triggered**:
   ```
   [Metric audit automatically triggered because Section 1 Key Metrics was edited]

   Scanning document for references to old value (500 TPS)...
   [Runs: Grep(pattern="500\s*TPS", path="ARCHITECTURE.md")]
   [Found at: Line 787, Line 1368]
   ```

4. **Load Context for Each Match**:
   ```
   [Reads context around each match]
   Read(file_path="ARCHITECTURE.md", offset=782, limit=10)  # Lines 782-792 for Line 787
   Read(file_path="ARCHITECTURE.md", offset=1363, limit=10) # Lines 1363-1373 for Line 1368
   ```

5. **Present Findings**:
   ```
   ═══════════════════════════════════════════════════════════
   METRIC CONSISTENCY AUDIT REPORT
   ═══════════════════════════════════════════════════════════
   Triggered by: Executive Summary edit (Line 33)
   Metric Changed: Job Execution Capacity (500 TPS → 700 TPS)
   ═══════════════════════════════════════════════════════════

   ## ⚠️ Outdated References Found

   | Location | Section | Current Value | Should Be | Context |
   |----------|---------|---------------|-----------|---------|
   | Line 787 | Section 6: Data Flow Patterns | 500 TPS capacity | 700 TPS | "Performance: p50 = 40ms, p95 = 100ms, p99 = 200ms \| 500 TPS capacity" |
   | Line 1368 | Section 10: Scalability & Performance | 500 | 700 | Throughput table: "Job Execution (TPS) \| 500 \| 1000 \| 2000" |

   ═══════════════════════════════════════════════════════════
   SUMMARY: Found 2 locations with outdated metric value
   ═══════════════════════════════════════════════════════════

   Would you like me to update both locations to 700 TPS?

   Options:
   1. [Yes - Update All] - Apply changes to both locations
   2. [Preview Changes] - Show me exactly what will change
   3. [Manual Selection] - Let me choose individually
   4. [No Thanks] - I'll handle this manually
   ```

6. **User Requests Preview**:
   ```
   User: "Preview changes first"
   ```

7. **Show Preview**:
   ```
   Here's a preview of the changes I'll make:

   ════════════════════════════════════════════════════════════
   CHANGE 1 of 2: Line 787 (Section 6: Data Flow Patterns)
   ════════════════════════════════════════════════════════════

   Current:
   **Performance**: p50 = 40ms, p95 = 100ms, p99 = 200ms | 500 TPS capacity

   Will become:
   **Performance**: p50 = 40ms, p95 = 100ms, p99 = 200ms | 700 TPS capacity

   ════════════════════════════════════════════════════════════
   CHANGE 2 of 2: Line 1368 (Section 10: Throughput Table)
   ════════════════════════════════════════════════════════════

   Current:
   | Job Execution (TPS) | 500 | 1000 | 2000 | Downstream domain services |

   Will become:
   | Job Execution (TPS) | 700 | 1000 | 2000 | Downstream domain services |

   ════════════════════════════════════════════════════════════

   Proceed with both changes? [Yes/No/Choose Individually]
   ```

8. **User Approves**:
   ```
   User: "Yes"
   ```

9. **Apply Changes**:
   ```
   Applying metric consistency updates...

   [Uses Edit tool on line 787]
   ✓ Updated line 787: "500 TPS capacity" → "700 TPS capacity"

   [Uses Edit tool on line 1368]
   ✓ Updated line 1368: Throughput table "500" → "700"

   Checking if Document Index needs update...
   [Runs: grep -n "^## [0-9]" ARCHITECTURE.md to check section positions]
   [Determines: No significant line shifts, index still valid]

   ✓ Document Index is still accurate (no update needed)
   ```

10. **Completion Report**:
    ```
    ═══════════════════════════════════════════════════════════
    METRIC CONSISTENCY UPDATE COMPLETE
    ═══════════════════════════════════════════════════════════

    Summary of Changes:
    ✓ Executive Summary (Line 33): 500 TPS → 700 TPS
    ✓ Section 6 Data Flow (Line 787): 500 TPS → 700 TPS
    ✓ Section 10 Throughput Table (Line 1368): 500 → 700

    Total Locations Updated: 3
    Document Index: No update needed
    All references to Job Execution Capacity are now consistent.

    ═══════════════════════════════════════════════════════════
    ```

---

## Design Drivers Impact Metrics Calculation

**PURPOSE**: Automatically calculate and maintain Design Drivers impact metrics (Value Delivery, Scale, Impacts) based on data from existing architecture sections. Design Drivers provide a quantifiable assessment of the architecture's business value, customer reach, and implementation complexity.

### When to Trigger Design Drivers Calculation

**Automatic Prompt:**
- ✅ User requests "architecture review" or "audit" (prompt to calculate)
- ✅ User explicitly asks to "calculate design drivers" or "update design drivers"
- ✅ After significant architecture changes during review process

**Manual Trigger:**
- User explicitly requests: "Calculate design drivers", "Update Section 2.2.1", "Assess design impact"
- During quarterly documentation review or architecture validation
- When preparing architecture presentations or business justifications

**Do NOT Trigger:**
- ❌ Minor edits unrelated to architecture (typos, formatting, dates)
- ❌ Changes to sections not used in design drivers calculation (Sections 3, 4, 9, 11, 12)
- ❌ User explicitly declines when prompted during review

### Design Drivers Framework

The Design Drivers subsection (Section 2.2.1) measures three impact dimensions:

#### 1. Value Delivery
**Definition**: Effectiveness of change in customer experience
**Threshold**: >50% = High Impact, ≤50% = Low Impact
**Data Source**: Section 1 Executive Summary - Business Value bullets
**Extraction Pattern**: `(\d{1,3})%\s*(reduction|improvement|increase|efficiency|optimization|cost\s*savings?|faster|time\s*savings?)`

**Calculation Logic**:
1. Read Section 1 Executive Summary (lines 25-55)
2. Find all percentage metrics in Business Value subsection
3. Extract maximum percentage value
4. If ANY metric > 50% → HIGH Impact
5. If ALL metrics ≤ 50% → LOW Impact
6. Generate justification citing specific percentage and line number

**Example**:
- Input: "70% cost reduction" (Section 1, line 52)
- Output: HIGH Impact - "System delivers 70% cost reduction (Section 1, line 52)"

#### 2. Scale
**Definition**: Estimated number of customers/transactions impacted
**Threshold**: >100K = High Impact, ≤100K = Low Impact
**Data Source**: Section 2.3 Use Cases - Success Metrics
**Extraction Pattern**: `(\d{1,3}(?:,\d{3})*)\+?\s*(?:per\s*day|daily|customers?|users?|transactions?|reminders?|payments?|jobs?)`

**Calculation Logic**:
1. Read Section 2.3 Use Cases (approximate lines 100-165)
2. Find all volume metrics in Success Metrics subsections
3. Extract maximum customer/transaction count
4. If MAX count > 100,000 → HIGH Impact
5. If MAX count ≤ 100,000 → LOW Impact
6. Generate justification citing specific volume and line number

**Example**:
- Input: "500,000+ reminders per day" (Section 2.3, line 141)
- Output: HIGH Impact - "System impacts 500,000 customers/day (Section 2.3, line 141)"

#### 3. Impacts
**Definition**: Implementation complexity (configuration, development, deployment)
**Threshold**: >5 impacts = High Impact, ≤5 impacts = Low Impact
**Data Sources**: Section 5 Component Architecture + Section 8 Technology Stack
**Extraction Method**: Count subsection headers + table rows

**Calculation Logic**:
1. Read Section 5 Component Details (approximate lines 456-675)
2. Count component subsection headers matching pattern: `^###\s+\d+\.\d+`
3. Read Section 8 Technology Stack (approximate lines 912-998)
4. Count technology table rows (excluding headers and separators)
5. Total = component_count + technology_count
6. If total > 5 → HIGH Impact
7. If total ≤ 5 → LOW Impact
8. Generate justification with breakdown

**Example**:
- Input: 5 components in Section 5, 3 technologies in Section 8
- Output: HIGH Impact - "System requires 8 components/technologies (Section 5: 5, Section 8: 3)"

### 6-Phase Calculation Workflow

#### Phase 1: Detection & User Prompt

**Trigger Detection**:
When user request contains keywords:
- "architecture review", "audit", "assess architecture"
- "calculate design drivers", "update design drivers"
- "design impact", "impact metrics"

**User Prompt**:
```
═══════════════════════════════════════════════════════════
Would you like me to calculate Design Drivers impact metrics?
═══════════════════════════════════════════════════════════

Design Drivers provide quantifiable assessment across 3 dimensions:
• Value Delivery: Customer experience effectiveness (from Section 1)
• Scale: Customer/transaction volume impacted (from Section 2.3)
• Impacts: Implementation complexity (from Sections 5 & 8)

This will analyze existing architecture data and update Section 2.2.1.

[Calculate Now] [Skip] [Learn More]
```

If user selects "Learn More", explain:
```
Design Drivers help you:
✓ Quantify business value of architecture decisions
✓ Justify complexity based on scale and impact
✓ Communicate architecture priorities to stakeholders
✓ Validate alignment between architecture and business goals

The calculation is automatic - metrics are extracted from:
• Section 1: Business value percentages
• Section 2.3: Customer/transaction volumes
• Section 5: Component count
• Section 8: Technology count

Results are presented for your review before updating the document.
```

#### Phase 2: Context-Efficient Data Loading

**Sequential Loading Strategy** (minimize context usage):

```bash
# Load only required sections, NOT full document
# Total: ~400-500 lines vs 2000+ full document (75% reduction)

# Step 1: Load Document Index
Read(file_path="ARCHITECTURE.md", offset=1, limit=50)
# Parse index to get exact line ranges for Sections 1, 2, 5, 8

# Step 2: Load Section 1 Executive Summary
Read(file_path="ARCHITECTURE.md", offset=<section1_start-5>, limit=<section1_length+10>)
# Extract Business Value bullets, look for percentage metrics

# Step 3: Load Section 2.3 Use Cases
Read(file_path="ARCHITECTURE.md", offset=<section2.3_start-5>, limit=<section2.3_length+10>)
# Extract Success Metrics from all use cases, look for volume counts

# Step 4: Load Section 5 Component Details
Read(file_path="ARCHITECTURE.md", offset=<section5_start-5>, limit=<section5_length+10>)
# Count subsection headers (### X.X Component Name)

# Step 5: Load Section 8 Technology Stack
Read(file_path="ARCHITECTURE.md", offset=<section8_start-5>, limit=<section8_length+10>)
# Count technology table rows
```

**Context Buffer Guidelines**:
- Add ±5-10 lines buffer to each section for context preservation
- Load sections sequentially (one at a time), not simultaneously
- Extract metrics immediately after loading each section
- Clear temporary data before loading next section

#### Phase 3: Metric Extraction & Calculation

**Algorithm 1: Value Delivery Extraction**

```python
# Pseudo-code for Value Delivery calculation
def extract_value_delivery(section1_text, section1_start_line):
    # Find Business Value subsection
    business_value_match = re.search(r'\*\*Business Value:\*\*(.+?)(?=\n\n|\n\*\*|$)', section1_text, re.DOTALL)

    if not business_value_match:
        return {
            'impact': 'LOW',
            'justification': 'No quantifiable business value metrics found in Section 1',
            'percentage': None,
            'line': None
        }

    business_value_section = business_value_match.group(1)

    # Extract all percentage metrics
    percentage_pattern = r'(\d{1,3})%\s*(reduction|improvement|increase|efficiency|optimization|cost\s*savings?|faster|time\s*savings?)'
    matches = re.finditer(percentage_pattern, business_value_section, re.IGNORECASE)

    percentages = []
    for match in matches:
        percentage = int(match.group(1))
        context = match.group(2)
        # Calculate approximate line number within section
        line_offset = section1_text[:match.start()].count('\n')
        line_number = section1_start_line + line_offset
        percentages.append({
            'value': percentage,
            'context': context,
            'line': line_number
        })

    if not percentages:
        return {
            'impact': 'LOW',
            'justification': 'No percentage-based metrics found in Business Value',
            'percentage': None,
            'line': None
        }

    # Find maximum percentage
    max_metric = max(percentages, key=lambda x: x['value'])

    # Apply threshold
    impact = 'HIGH' if max_metric['value'] > 50 else 'LOW'

    return {
        'impact': impact,
        'justification': f"System delivers {max_metric['value']}% {max_metric['context']} (Section 1, line {max_metric['line']})",
        'percentage': max_metric['value'],
        'line': max_metric['line']
    }
```

**Algorithm 2: Scale Extraction**

```python
# Pseudo-code for Scale calculation
def extract_scale(section2_3_text, section2_3_start_line):
    # Extract all volume metrics from Success Metrics subsections
    volume_pattern = r'(\d{1,3}(?:,\d{3})*)\+?\s*(?:per\s*day|daily|customers?|users?|transactions?|reminders?|payments?|jobs?)'
    matches = re.finditer(volume_pattern, section2_3_text, re.IGNORECASE)

    volumes = []
    for match in matches:
        # Parse number (remove commas)
        volume_str = match.group(1).replace(',', '')
        volume = int(volume_str)
        context = match.group(0)
        # Calculate line number
        line_offset = section2_3_text[:match.start()].count('\n')
        line_number = section2_3_start_line + line_offset
        volumes.append({
            'value': volume,
            'context': context,
            'line': line_number
        })

    if not volumes:
        return {
            'impact': 'LOW',
            'justification': 'No volume metrics found in Use Cases success metrics',
            'volume': None,
            'line': None
        }

    # Find maximum volume
    max_volume = max(volumes, key=lambda x: x['value'])

    # Apply threshold
    impact = 'HIGH' if max_volume['value'] > 100000 else 'LOW'

    # Format volume with commas for readability
    volume_formatted = f"{max_volume['value']:,}"

    return {
        'impact': impact,
        'justification': f"System impacts {volume_formatted} customers/transactions per day (Section 2.3, line {max_volume['line']})",
        'volume': max_volume['value'],
        'line': max_volume['line']
    }
```

**Algorithm 3: Impacts Calculation**

```python
# Pseudo-code for Impacts calculation
def calculate_impacts(section5_text, section8_text):
    # Count component subsection headers in Section 5
    component_pattern = r'^###\s+\d+\.\d+\s+.+$'
    component_matches = re.findall(component_pattern, section5_text, re.MULTILINE)
    component_count = len(component_matches)

    # Count technology table rows in Section 8
    # Exclude header rows (contains | --- |) and empty rows
    tech_table_pattern = r'^\|[^|]+\|[^|]+\|.+\|$'
    separator_pattern = r'^\|\s*-+\s*\|'

    tech_rows = []
    for line in section8_text.split('\n'):
        if re.match(tech_table_pattern, line) and not re.match(separator_pattern, line):
            tech_rows.append(line)

    # First row is typically header, so subtract 1
    # Count unique tables (Languages, Frameworks, Databases, etc.)
    # Approximate: count all rows and subtract ~4-6 header rows
    technology_count = max(0, len(tech_rows) - 5)  # Conservative estimate

    # Total impacts
    total_impacts = component_count + technology_count

    # Apply threshold
    impact = 'HIGH' if total_impacts > 5 else 'LOW'

    return {
        'impact': impact,
        'justification': f"System requires {total_impacts} components/technologies (Section 5: {component_count}, Section 8: {technology_count})",
        'component_count': component_count,
        'technology_count': technology_count,
        'total': total_impacts
    }
```

#### Phase 4: Generate Calculation Report & User Review

**Report Format**:
```
═══════════════════════════════════════════════════════════
  DESIGN DRIVERS IMPACT METRICS CALCULATION
═══════════════════════════════════════════════════════════
Calculation Date: YYYY-MM-DD
Data Sources: Sections 1, 2.3, 5, 8
═══════════════════════════════════════════════════════════

## Value Delivery: [HIGH / LOW]
**Threshold**: >50% = High Impact
**Assessment**: [Percentage]% [context] exceeds threshold
**Justification**: System delivers [X]% [context] (Section 1, line [N])
**Source Data**: [Extracted percentage metric from Business Value]

## Scale: [HIGH / LOW]
**Threshold**: >100K = High Impact
**Assessment**: [Volume] [unit] exceeds threshold
**Justification**: System impacts [X] customers/day (Section 2.3, line [N])
**Source Data**: [Extracted volume metric from Success Metrics]

## Impacts: [HIGH / LOW]
**Threshold**: >5 = High Impact
**Assessment**: [Total] components/technologies exceeds threshold
**Justification**: System requires [Total] components/technologies (Section 5: [C], Section 8: [T])
**Breakdown**:
  - Components (Section 5): [Component count]
  - Technologies (Section 8): [Technology count]

═══════════════════════════════════════════════════════════
SUMMARY: [3/3 HIGH | 2/3 HIGH | 1/3 HIGH | 0/3 HIGH]
═══════════════════════════════════════════════════════════

Next Steps:
1. [Update Section 2.2.1] - Apply these metrics to Design Drivers subsection
2. [Preview Changes] - See exact updates before applying
3. [Manual Override] - Adjust values or classifications manually
4. [Export Report] - Save this report for documentation
5. [Skip Update] - Review only, don't modify ARCHITECTURE.md

Please select an option:
```

**Interactive Review Options**:

1. **Update Section 2.2.1**: Proceed with applying metrics to Design Drivers subsection
2. **Preview Changes**: Show exact before/after of Section 2.2.1
3. **Manual Override**: User can adjust thresholds, classifications, or justifications
4. **Export Report**: Save calculation report to separate file
5. **Skip Update**: Review-only mode, don't modify document

#### Phase 5: Apply Changes to ARCHITECTURE.md

**Insertion Logic**:

1. **Check if Section 2.2.1 exists**:
   ```bash
   Grep(pattern="### Design Drivers", path="ARCHITECTURE.md")
   # or
   Grep(pattern="### 2\.2\.1", path="ARCHITECTURE.md")
   ```

2. **If Section 2.2.1 DOES NOT exist** (first-time insertion):
   - Find end of Section 2.2 (Solution Overview)
   - Insert new Design Drivers subsection after Section 2.2
   - Update section numbering if needed (2.3 Use Cases remains 2.3)
   - Update Document Index (Section 2 line range expands)

3. **If Section 2.2.1 DOES exist** (update existing):
   - Read Section 2.2.1 content
   - Update only the impact assessments and justifications
   - Preserve structure and formatting
   - Update "Last Calculated" date
   - Update "Calculation Method" to "Automatic"

**Section 2.2.1 Template** (for insertion):
```markdown
### 2.2.1 Design Drivers

This architecture is driven by the following key factors:

#### Value Delivery
**Description**: Effectiveness of change in customer experience
- **Threshold**: >50% = High Impact, ≤50% = Low Impact
- **Current Assessment**: [HIGH / LOW] Impact
- **Justification**: [Extracted justification with line reference]

#### Scale
**Description**: Estimated number of customers impacted
- **Threshold**: >100K = High, ≤100K = Low
- **Current Assessment**: [HIGH / LOW] Impact
- **Justification**: [Extracted justification with line reference]

#### Impacts
**Description**: Implementation complexity across configuration, development, and applications
- **Threshold**: >5 = High, ≤5 = Low
- **Current Assessment**: [HIGH / LOW] Impact
- **Justification**: [Extracted justification with component/technology counts]

**Last Calculated**: [YYYY-MM-DD]
**Calculation Method**: Automatic
```

**Update Workflow**:

```bash
# Step 1: Find insertion point
Read(file_path="ARCHITECTURE.md", offset=82, limit=20)  # Section 2.2 Solution Overview
# Identify line number where Section 2.2 ends (before 2.3 Use Cases)

# Step 2: Insert or Update Section 2.2.1
# If new insertion:
Edit(file_path="ARCHITECTURE.md",
     old_string="[End of Section 2.2 content]\n\n### 2.3 Primary Use Cases",
     new_string="[End of Section 2.2 content]\n\n### 2.2.1 Design Drivers\n\n[Full template with calculated values]\n\n### 2.3 Primary Use Cases")

# If updating existing:
Edit(file_path="ARCHITECTURE.md",
     old_string="**Current Assessment**: [old value]\n- **Justification**: [old justification]",
     new_string="**Current Assessment**: [new value]\n- **Justification**: [new justification]")

# Step 3: Update "Last Calculated" date
Edit(file_path="ARCHITECTURE.md",
     old_string="**Last Calculated**: YYYY-MM-DD",
     new_string="**Last Calculated**: 2025-01-26")  # Use current date

# Step 4: Update Document Index (if significant line shift)
# Run grep to detect new section positions
grep -n "^## [0-9]" ARCHITECTURE.md
# Update index line ranges if Section 2 grew by >10 lines
```

#### Phase 6: Completion Report & Verification

**Completion Report Format**:
```
═══════════════════════════════════════════════════════════
  DESIGN DRIVERS UPDATE COMPLETE
═══════════════════════════════════════════════════════════

✓ Section 2.2.1 Design Drivers updated
✓ All three metrics calculated and applied
✓ Document Index updated (Section 2: Lines X-Y)
✓ Last Calculated: 2025-01-26

Summary of Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Value Delivery:  HIGH   (70% cost reduction)
Scale:           HIGH   (500,000 customers/day)
Impacts:         HIGH   (8 components/technologies)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Design Impact: 3/3 HIGH

Data Sources:
• Section 1 (Executive Summary): Business value metrics
• Section 2.3 (Use Cases): Success metrics and volumes
• Section 5 (Components): Component architecture details
• Section 8 (Technology Stack): Technology inventory

Next Steps:
• Review Section 2.2.1 for accuracy
• Use these metrics in architecture presentations
• Recalculate after significant architecture changes
• Include in quarterly architecture reviews

═══════════════════════════════════════════════════════════
```

**Verification Steps**:
1. Read Section 2.2.1 to confirm updates applied correctly
2. Verify Document Index reflects new line ranges
3. Check "Last Calculated" date is current
4. Confirm all three metrics (Value Delivery, Scale, Impacts) are present
5. Validate justifications include source line numbers

### Edge Cases & Error Handling

#### Edge Case 1: Missing Source Data

**Scenario**: No percentage metrics found in Section 1 Business Value

**Handling**:
```
⚠️ MISSING DATA: Value Delivery

No percentage-based metrics found in Section 1 Business Value.

Recommendations:
1. Add quantifiable business value metrics to Section 1
2. Provide manual override for Value Delivery assessment
3. Default to LOW impact with note: "No quantifiable metrics found"

Would you like to:
[Add Metrics to Section 1] [Manual Override] [Default to LOW]
```

**Default Behavior**:
- Value Delivery: LOW Impact with justification "No quantifiable business value metrics found in Section 1"
- Scale: LOW Impact with justification "No volume metrics found in Use Cases"
- Impacts: Calculate based on available data (Section 5 or 8, whichever exists)

#### Edge Case 2: Threshold Edge Cases (Exactly 50%, 100K, or 5)

**Scenario**: Metric value exactly equals threshold

**Handling**:
```
ℹ️ THRESHOLD EDGE CASE: Scale

Volume metric: Exactly 100,000 customers/day (Section 2.3, line 141)
Threshold rule: >100K = HIGH (not ≥)

Assessment: LOW Impact (100K is NOT > 100K)
Note: Consider if this is close enough to merit HIGH classification

Would you like to:
[Use LOW (strict threshold)] [Override to HIGH] [Review Context]
```

**Default Rule**:
- Thresholds use strict > operator (not ≥)
- 50% exactly → LOW
- 100,000 exactly → LOW
- 5 exactly → LOW
- Flag these cases for user review with note in justification

#### Edge Case 3: Conflicting Metrics (Multiple Percentages)

**Scenario**: Multiple different percentage metrics in Business Value

**Example**:
- 70% cost reduction
- 45% time savings
- 60% efficiency improvement

**Handling**:
```
ℹ️ MULTIPLE METRICS: Value Delivery

Found 3 percentage metrics in Business Value:
• 70% cost reduction (Line 52)
• 45% time savings (Line 53)
• 60% efficiency improvement (Line 54)

Using maximum value approach:
Selected: 70% cost reduction → HIGH Impact

Alternative: Could use average (58.3%) → still HIGH
Alternative: Could list all metrics in justification

Proceed with maximum value (70%)? [Yes] [Use Average] [Custom]
```

**Default Behavior**: Use maximum percentage value

#### Edge Case 4: Non-Standard Document Structure

**Scenario**: Document Index missing or section numbers non-standard

**Handling**:
1. **Fallback Detection**: Use grep to find sections by header text
   ```bash
   grep -n "^## .*Executive Summary" ARCHITECTURE.md
   grep -n "^### .*Primary Use Cases" ARCHITECTURE.md
   grep -n "^## .*Component" ARCHITECTURE.md
   grep -n "^## .*Technology Stack" ARCHITECTURE.md
   ```

2. **Prompt User**:
   ```
   ⚠️ NON-STANDARD STRUCTURE

   Document Index not found or sections not in expected locations.

   Would you like me to:
   1. Search for sections by header text (slower but works)
   2. Update document to standard structure first
   3. Manually specify section line ranges

   Recommended: Option 2 (standardize structure)
   ```

3. **Graceful Degradation**: Calculate what's possible, note what's missing

#### Edge Case 5: Section 2.2.1 Already Exists with Manual Overrides

**Scenario**: User previously set manual override values in Section 2.2.1

**Detection**:
Check if "Calculation Method: Manual Override" exists in Section 2.2.1

**Handling**:
```
⚠️ MANUAL OVERRIDE DETECTED

Section 2.2.1 was previously updated with manual overrides.

Current Values (Manual):
• Value Delivery: HIGH (manually set)
• Scale: LOW (manually set)
• Impacts: HIGH (manually set)

New Calculated Values (Automatic):
• Value Delivery: HIGH (70% cost reduction)
• Scale: HIGH (500,000 customers/day)  ← DIFFERS
• Impacts: HIGH (8 components/technologies)

Differences found:
⚠️ Scale changed from LOW → HIGH (new data: 500,000/day)

Would you like to:
[Accept New Values] [Keep Manual Overrides] [Review Changes] [Merge (keep manual where unchanged)]
```

**Default Behavior**: Present comparison, require user approval before overwriting manual overrides

### Manual Override Workflow

**User can manually override any metric classification:**

```
Manual Override: Value Delivery
────────────────────────────────────────────────────────────
Calculated: HIGH (70% cost reduction)

Override Options:
1. [Keep Calculated] - Use automatic calculation (HIGH)
2. [Change to LOW] - Override to LOW impact
3. [Custom Percentage] - Specify different percentage
4. [Custom Justification] - Keep HIGH but change justification

If overriding, provide reason (for documentation):
[Text input: "Business value is delayed until Year 2"]

Method will be marked as: "Manual Override (2025-01-26)"
```

**When Manual Override Applied**:
- Update "Calculation Method" to "Manual Override"
- Add note in justification: "(Manual override: [reason])"
- Subsequent automatic calculations will prompt before overwriting

### Best Practices for Design Drivers

**DO:**
- ✅ Calculate after major architecture changes (new components, technologies)
- ✅ Recalculate quarterly during architecture reviews
- ✅ Use metrics in stakeholder presentations and justifications
- ✅ Document assumptions in justifications (which metric was used, why)
- ✅ Update source sections (1, 2.3, 5, 8) before calculating for accuracy
- ✅ Review calculation report carefully before applying

**DON'T:**
- ❌ Auto-calculate on every minor documentation update
- ❌ Override thresholds without documentation
- ❌ Ignore edge cases (flag for review, don't silently default)
- ❌ Skip user review (always present findings before updating)
- ❌ Forget to update "Last Calculated" date
- ❌ Calculate with stale data (ensure source sections are current)

### Integration with Existing Workflows

**Metric Consistency Workflow Integration**:
- Design Drivers calculation runs AFTER metric consistency check
- If Section 1 metrics are updated, first sync duplicates, then calculate drivers
- Ensures Design Drivers use most current metric values

**Document Index Integration**:
- Design Drivers insertion may shift Section 2.3 line numbers
- Automatically trigger Document Index update if Section 2 grows >10 lines
- Update index before final completion report

**Architecture Review Integration**:
- When user requests "architecture review", present checklist:
  ```
  Architecture Review Checklist:
  ☐ Metric consistency check (Section 1 vs rest of document)
  ☐ Design Drivers calculation (Section 2.2.1 update)
  ☐ Architecture Principles validation (all 9 required)
  ☐ Document Index accuracy (line ranges current)
  ☐ ADR references up to date (Section 12)

  Would you like me to run all checks? [Yes] [Select Individually]
  ```

### Example: Complete Design Drivers Calculation

**Scenario**: User requests architecture review for Task Scheduling System

**Step-by-Step Execution**:

1. **User Request**:
   ```
   User: "Review the architecture documentation"
   ```

2. **Detection & Prompt**:
   ```
   [Architecture review trigger detected]

   As part of the architecture review, would you like me to calculate Design Drivers impact metrics?

   Design Drivers assess:
   • Value Delivery: Business value effectiveness
   • Scale: Customer/transaction volume
   • Impacts: Implementation complexity

   [Calculate Now] [Skip] [Learn More]
   ```

3. **User Approves**:
   ```
   User: "Calculate now"
   ```

4. **Context-Efficient Data Loading**:
   ```
   Loading architecture data for Design Drivers calculation...

   ✓ Document Index loaded (lines 1-21)
   ✓ Section 1 Executive Summary loaded (lines 25-54)
   ✓ Section 2.3 Use Cases loaded (lines 99-162)
   ✓ Section 5 Component Details loaded (lines 456-675)
   ✓ Section 8 Technology Stack loaded (lines 912-998)

   Total lines loaded: 436 / 2,000 (78% reduction)
   ```

5. **Metric Extraction**:
   ```
   Extracting metrics from architecture sections...

   Value Delivery:
   ✓ Found: 70% cost reduction (Section 1, line 52)
   ✓ Found: 60% time savings (Section 1, line 53)
   ✓ Maximum: 70% → HIGH Impact (exceeds 50% threshold)

   Scale:
   ✓ Found: 500,000+ reminders per day (Section 2.3, line 141)
   ✓ Found: 10,000+ concurrent jobs (Section 2.3, line 38)
   ✓ Maximum: 500,000 → HIGH Impact (exceeds 100K threshold)

   Impacts:
   ✓ Components (Section 5): 5 subsections found
   ✓ Technologies (Section 8): 3 table rows found
   ✓ Total: 8 → HIGH Impact (exceeds 5 threshold)
   ```

6. **Present Findings**:
   ```
   ═══════════════════════════════════════════════════════════
     DESIGN DRIVERS IMPACT METRICS CALCULATION
   ═══════════════════════════════════════════════════════════
   Calculation Date: 2025-01-26
   Data Sources: Sections 1, 2.3, 5, 8
   ═══════════════════════════════════════════════════════════

   ## Value Delivery: HIGH
   **Threshold**: >50% = High Impact
   **Assessment**: 70% exceeds threshold
   **Justification**: System delivers 70% cost reduction (Section 1, line 52)

   ## Scale: HIGH
   **Threshold**: >100K = High Impact
   **Assessment**: 500,000 exceeds threshold
   **Justification**: System impacts 500,000 customers/day (Section 2.3, line 141)

   ## Impacts: HIGH
   **Threshold**: >5 = High Impact
   **Assessment**: 8 exceeds threshold
   **Justification**: System requires 8 components/technologies (Section 5: 5, Section 8: 3)

   ═══════════════════════════════════════════════════════════
   SUMMARY: 3/3 HIGH - Strong business justification for architecture complexity
   ═══════════════════════════════════════════════════════════

   [Update Section 2.2.1] [Preview Changes] [Manual Override] [Skip]
   ```

7. **User Selects Update**:
   ```
   User: "Update Section 2.2.1"
   ```

8. **Apply Changes**:
   ```
   Updating Section 2.2.1 Design Drivers...

   [Checking if section exists]
   ✓ Section 2.2.1 not found - will insert new section

   [Finding insertion point]
   ✓ Section 2.2 ends at line 97
   ✓ Section 2.3 starts at line 99
   ✓ Insertion point: line 98

   [Inserting Design Drivers subsection]
   ✓ Inserted 22 lines at line 98
   ✓ Section 2.3 renumbered (now starts at line 121)

   [Updating Document Index]
   ✓ Section 2 range updated: Lines 56-154 → Lines 56-176
   ✓ Sections 2.3-12 ranges shifted by +22 lines
   ✓ Index Last Updated: 2025-01-26
   ```

9. **Completion Report**:
   ```
   ═══════════════════════════════════════════════════════════
     DESIGN DRIVERS UPDATE COMPLETE
   ═══════════════════════════════════════════════════════════

   ✓ Section 2.2.1 Design Drivers inserted at line 98
   ✓ All three metrics calculated and applied
   ✓ Document Index updated (Section 2: Lines 56-176)
   ✓ Last Calculated: 2025-01-26

   Summary of Metrics:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Value Delivery:  HIGH   (70% cost reduction)
   Scale:           HIGH   (500,000 customers/day)
   Impacts:         HIGH   (8 components/technologies)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Overall Design Impact: 3/3 HIGH

   This indicates strong business justification for:
   • Architecture complexity (8 components/technologies)
   • Investment in scalability (500K customers/day)
   • Development resources (70% cost reduction value)

   ═══════════════════════════════════════════════════════════
   ```

### Performance & Context Optimization

**Context Usage Comparison**:

| Approach | Lines Loaded | Percentage |
|----------|-------------|------------|
| Full Document Load | 2,000+ | 100% |
| Design Drivers (Context-Efficient) | ~400-500 | 20-25% |
| **Savings** | **~1,500-1,600** | **75-80%** |

**Sequential Loading Benefits**:
- Load one section at a time (not all simultaneously)
- Extract metrics immediately after loading
- Clear section data before loading next
- Minimize context window pressure
- Faster execution with large documents

**Optimization Strategies**:
- Use Document Index for exact line ranges (no guessing)
- Load only ±5-10 line buffers (minimal context)
- Use Grep for initial detection (no loading required)
- Cache Document Index in memory (reuse across phases)
- Batch similar operations (all regex extractions together)

---

### Best Practices

✅ **DO**:
- Load specific sections using `Read` with offset/limit
- Use `Grep` to search for keywords without loading full file
- Work incrementally on one section at a time
- Read the table of contents or first 50 lines to orient yourself

❌ **DON'T**:
- Read the entire ARCHITECTURE.md file unless creating it from scratch
- Load multiple sections simultaneously unless they're small
- Use full document reads for simple section updates
- Assume section locations without checking first

### Example Workflows

**Task 1**: Update the Technology Stack section

1. Read lines 1-50 to confirm document structure
2. Use Grep to find "## Section 8: Technology Stack"
3. Read ONLY Section 8 (estimated lines 1001-1150)
4. Make edits using Edit tool
5. Read ONLY the updated section to verify

**Task 2**: Update Executive Summary metrics and ensure consistency

1. User edits Section 1 Key Metrics (lines 31-38)
2. Skill detects metric change automatically
3. Scan document using Grep for all metric values
4. Load context for each match (Read with ±5 line buffer)
5. Generate consistency report with findings
6. Present findings to user for review
7. If user approves, batch update all locations
8. Update Document Index if needed (>10 lines shifted)
9. Report completion summary

These approaches keep context usage minimal while maintaining full editing capability.

## Documentation Structure

This project uses **ARCHITECTURE_DOCUMENTATION_GUIDE.md** as the authoritative guide for creating and maintaining architecture documentation. This guide ensures consistency across all architecture documents.

## When to Use the Guide

### 1. Creating New Architecture Documents
When starting a new system architecture document (ARCHITECTURE.md):
- Follow the 12-section structure defined in ARCHITECTURE_DOCUMENTATION_GUIDE.md
- Use the templates provided for each section
- Maintain detailed coverage for: Layers, Components, Integration Points, Tech Stack, Security, and Performance
- Keep Executive Summary, System Overview, and Principles concise
- Reference ADR_GUIDE.md for architectural decision documentation

### 2. Documenting Existing Projects
When documenting an existing system:
- Use ARCHITECTURE_DOCUMENTATION_GUIDE.md as the structure template
- Focus on capturing current state accurately (not ideal state)
- Prioritize Sections 4-10 (core architecture sections)
- Document actual technologies, versions, and configurations in use
- Create ADRs for past decisions if context is available

### 3. Maintaining Architecture Documentation
When updating existing architecture docs:
- Follow the same section structure from ARCHITECTURE_DOCUMENTATION_GUIDE.md
- Keep core sections (Layers, Components, Security, Performance) detailed and current
- Update version numbers and technology stack as system evolves
- Add new ADRs for architectural changes
- Review quarterly for accuracy

## Key Principles

1. **Use Templates**: Follow section templates from ARCHITECTURE_DOCUMENTATION_GUIDE.md
2. **Stay Concise**: Keep Sections 1-3, 6, 12 brief; detail in Sections 4-5, 7-11
3. **Separate ADRs**: Use ADR_GUIDE.md for decision records, link from main doc
4. **Maintain Accuracy**: Document actual state, include version numbers
5. **Context Efficiency**: Balance detail with readability for Claude Code context

## Architecture Principles Enforcement (Section 3)

**CRITICAL**: Section 3 (Architecture Principles) MUST follow these requirements:

### Required Principles (Strict Order)

All ARCHITECTURE.md documents MUST include these **9 core principles** in this **exact order**:

1. **Separation of Concerns**
2. **High Availability**
3. **Scalability First**
4. **Security by Design**
5. **Observability**
6. **Resilience**
7. **Simplicity**
8. **Cloud-Native**
9. **Open Standards**

### Optional Principle

10. **Event-Driven Architecture** *(Include ONLY if the system actually uses event-driven patterns)*

### Required Structure for Each Principle

Each principle MUST include these three subsections:

```markdown
### [Number]. [Principle Name]

**Description:**
[What this principle means - 1-2 sentences]

**Implementation:**
- [System-specific implementation details]
- [Technologies, patterns, configurations used]
- [Concrete examples from your architecture]

**Trade-offs:**
- [Costs, downsides, complexity introduced]
- [Performance impacts, infrastructure costs, etc.]
```

### Validation Rules

When creating or updating Section 3, verify:

✅ All 9 core principles are present
✅ Principles appear in the exact order specified
✅ Each principle has all three subsections: Description, Implementation, Trade-offs
✅ Implementation section contains system-specific details (NOT generic placeholders)
✅ Trade-offs section honestly assesses costs/downsides
✅ Event-Driven Architecture (#10) is only included if system uses it
✅ No additional custom principles beyond the standard 9-10

### Common Mistakes to Avoid

❌ Missing principles from the core 9
❌ Changing the order of principles
❌ Using generic placeholder text in Implementation sections
❌ Omitting Trade-offs section
❌ Including Event-Driven Architecture when system doesn't use it
❌ Adding custom principles not in the standard list
❌ Using single-sentence descriptions instead of structured format

### When Updating Existing Documents

If an existing ARCHITECTURE.md has different principles:

1. **Identify missing principles**: Compare against the required 9
2. **Reorder existing principles**: Match the standard order (1-9)
3. **Add missing principles**: Write system-specific Implementation details
4. **Restructure format**: Ensure each has Description/Implementation/Trade-offs
5. **Remove non-standard principles**: Either map to standard principles or remove
6. **Preserve content**: Migrate existing content to appropriate standard principles

## Required Section Names (Strict Enforcement)

**CRITICAL**: All ARCHITECTURE.md documents MUST use these exact section names in this exact order.

### Standard 12-Section Structure

All ARCHITECTURE.md documents MUST include these **12 sections** with these **exact names** in this **exact order**:

1. **Executive Summary**
2. **System Overview**
3. **Architecture Principles**
4. **Meta Architecture Layers**
5. **Component Details**
6. **Data Flow Patterns** *(Optional - include only if system has complex flows)*
7. **Integration Points**
8. **Technology Stack**
9. **Security Architecture**
10. **Scalability & Performance**
11. **Operational Considerations**
12. **Architecture Decision Records (ADRs)**

### Markdown Header Format

Each section MUST use this exact format:

```markdown
## [NUMBER]. [SECTION NAME]
```

**Examples:**
- ✅ Correct: `## 1. Executive Summary`
- ✅ Correct: `## 12. Architecture Decision Records (ADRs)`
- ❌ Wrong: `## Executive Summary` (missing number)
- ❌ Wrong: `## 1 Executive Summary` (missing period)
- ❌ Wrong: `## 12. ADR References` (wrong section name)

### Validation Rules

When creating or updating ARCHITECTURE.md, verify:

✅ All 12 section headers match exactly (case-sensitive)
✅ Sections appear in the exact order specified (1-12)
✅ Section numbers are present with period (e.g., "## 1. Executive Summary")
✅ No custom section names unless explicitly documented as optional
✅ Data Flow Patterns (Section 6) may be omitted for simple systems (renumber subsequent sections if omitted)

**Verification Command:**
```bash
# Check section headers match standard names
grep -n "^## [0-9]" ARCHITECTURE.md
```

Expected output should show all 12 sections in order with exact names.

### Common Mistakes to Avoid

❌ Using "ADR References" instead of "Architecture Decision Records (ADRs)"
❌ Using "Decision References (ADRs)" instead of "Architecture Decision Records (ADRs)"
❌ Using "Tech Stack" instead of "Technology Stack"
❌ Using "Security" instead of "Security Architecture"
❌ Using "Performance" instead of "Scalability & Performance"
❌ Reordering sections (e.g., putting Technology Stack before Integration Points)
❌ Omitting section numbers (e.g., "## Executive Summary")
❌ Using wrong number format (e.g., "## 1 Executive Summary" without period)
❌ Adding custom sections between standard sections without guidance

### Optional Sections

**Data Flow Patterns (Section 6):**
- Include if system has complex data flows requiring visualization
- Omit for simple systems with straightforward request/response patterns
- If omitted, renumber subsequent sections (7→6, 8→7, etc.)

**Additional subsections are encouraged:**
- Section 5 (Component Details) should have subsections per component
- Section 11 (Operational Considerations) should include deployment, monitoring, backup, and disaster recovery

### Section Renumbering

**If Data Flow Patterns (Section 6) is omitted:**

The 11-section structure becomes:
1. Executive Summary
2. System Overview
3. Architecture Principles
4. Meta Architecture Layers
5. Component Details
6. Integration Points (was 7)
7. Technology Stack (was 8)
8. Security Architecture (was 9)
9. Scalability & Performance (was 10)
10. Operational Considerations (was 11)
11. Architecture Decision Records (ADRs) (was 12)

**Document Index must be updated** to reflect the 11-section structure.

## Optional Enhancements

- Data Flow Patterns (for complex flows)
- Diagrams (C4 Model, PlantUML, Mermaid)
- Cost breakdown tables
- Disaster recovery procedures
- Runbooks (common operations and incident response procedures)

## Reference Documents

This skill includes the following asset files:

- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Primary template and structure guide (located in skill assets)
- **ADR_GUIDE.md**: Architectural Decision Record format and guidelines (located in skill assets)

These reference documents are bundled with this skill and will be available when the skill is active.

**Note**: ARCHITECTURE_DOCUMENTATION_GUIDE.md is optimized for Claude Code context management. Load it when creating or significantly updating architecture docs.