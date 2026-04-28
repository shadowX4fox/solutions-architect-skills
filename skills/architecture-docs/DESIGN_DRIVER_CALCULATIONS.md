# Design Driver Calculations

> Implementation algorithms for automatically calculating Design Drivers impact metrics from ARCHITECTURE.md data

## Purpose

This document provides detailed implementation algorithms for Design Drivers calculation. Design Drivers assess architecture impact across three dimensions:

1. **Value Delivery**: Effectiveness of change in customer experience
2. **Scale**: Estimated number of customers/transactions impacted
3. **Impacts**: Implementation complexity (configuration, development, deployment)

## Related Documentation

- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Conceptual overview, templates, and thresholds (primary reference for content authors)
- **SKILL.md**: Operational workflows and when to trigger calculations
- **METRIC_CALCULATIONS.md**: Metric extraction and index update algorithms

---

## Overview

**Purpose**: Automatically assess architecture impact across three dimensions to justify complexity and communicate value to stakeholders.

**When to Use**:
- Architecture reviews, audits, or assessments
- Explicit user requests: "calculate design drivers", "update design drivers"
- Quarterly architecture reviews

**Data Sources**:
- Section 1 Executive Summary (Business Value)
- Section 2.3 Use Cases (Success Metrics)
- Section 5 Component Details (Component count)
- Section 8 Technology Stack (Technology count)

**Output**: Impact assessment (HIGH/LOW) for each dimension with justifications and line number references

---

## Algorithm 1: Value Delivery

**Definition**: Effectiveness of change in customer experience

**Threshold**: >50% = HIGH Impact, ≤50% = LOW Impact

**Data Source**: Section 1 Executive Summary - Business Value bullets

**Extraction Pattern**:
```regex
(\d{1,3})%\s*(reduction|improvement|increase|efficiency|optimization|cost\s*savings?|faster|time\s*savings?|decrease)
```

### Calculation Logic

**Step 1**: Read `docs/01-system-overview.md` in full (Section 1 + Section 2; files are 100–300 lines)
```
Read(file_path="docs/01-system-overview.md")
```

**Step 2**: Locate Business Value subsection
```python
# Pseudo-code
business_value_match = re.search(
    r'\*\*Business Value:\*\*(.+?)(?=\n\n|\n\*\*|$)',
    section1_text,
    re.DOTALL
)
```

**Step 3**: Extract all percentage metrics from Business Value
```python
# Pseudo-code
percentage_pattern = r'(\d{1,3})%\s*(reduction|improvement|increase|efficiency|optimization|cost\s*savings?|faster|time\s*savings?)'

matches = re.finditer(percentage_pattern, business_value_section, re.IGNORECASE)

percentages = []
for match in matches:
    percentage = int(match.group(1))
    context = match.group(2)
    percentages.append({
        'value': percentage,
        'context': context,
        'source': 'docs/01-system-overview.md#key-metrics'
    })
```

**Step 4**: Find maximum percentage value
```python
# Pseudo-code
max_metric = max(percentages, key=lambda x: x['value'])
```

**Step 5**: Apply threshold (>50%)
```python
# Pseudo-code
impact = 'HIGH' if max_metric['value'] > 50 else 'LOW'
```

**Step 6**: Generate justification
```python
# Pseudo-code
return {
    'impact': impact,
    'justification': f"System delivers {max_metric['value']}% {max_metric['context']} (see [Key Metrics](01-system-overview.md#key-metrics))",
    'percentage': max_metric['value'],
    'source': max_metric['source']
}
```

### Example

**Input**: `docs/01-system-overview.md` contains "70% cost reduction" under `## Key Metrics`

**Output**:
```json
{
  "impact": "HIGH",
  "justification": "System delivers 70% cost reduction (see [Key Metrics](01-system-overview.md#key-metrics))",
  "percentage": 70,
  "source": "docs/01-system-overview.md#key-metrics"
}
```

### Edge Cases

**Case 1: No percentage metrics found**
```python
return {
    'impact': 'LOW',
    'justification': 'No quantifiable business value metrics found in Section 1',
    'percentage': None,
    'line': None
}
```

**Case 2: Multiple percentages (use maximum)**
```python
# Example: 70%, 45%, 60% found
# Use maximum: 70% → HIGH Impact
```

**Case 3: Exactly 50% (threshold edge case)**
```python
# 50% exactly → LOW Impact (threshold is >50, not ≥50)
# Flag for user review with note
```

**Case 4: Percentage without clear context**
```python
# Found: "50% [unclear context]"
# Extract but flag as ambiguous
# Prompt user for clarification
```

---

## Algorithm 2: Scale

**Definition**: Estimated number of customers/transactions impacted

**Threshold**: >100,000 = HIGH Impact, ≤100,000 = LOW Impact

**Data Source**: Section 2.3 Use Cases - Success Metrics subsections

**Extraction Pattern**:
```regex
(\d{1,3}(?:,\d{3})*)\+?\s*(?:per\s*day|daily|customers?|users?|transactions?|reminders?|payments?|jobs?|records?)
```

### Calculation Logic

**Step 1**: Read `docs/01-system-overview.md` in full (contains Sections 1+2 including 2.3 Primary Use Cases)
```
Read(file_path="docs/01-system-overview.md")
```

**Step 2**: Extract all volume metrics from Success Metrics
```python
# Pseudo-code
volume_pattern = r'(\d{1,3}(?:,\d{3})*)\+?\s*(?:per\s*day|daily|customers?|users?|transactions?|reminders?|payments?|jobs?)'

matches = re.finditer(volume_pattern, section2_3_text, re.IGNORECASE)

volumes = []
for match in matches:
    # Parse number (remove commas)
    volume_str = match.group(1).replace(',', '')
    volume = int(volume_str)
    context = match.group(0)
    volumes.append({
        'value': volume,
        'context': context,
        'source': 'docs/01-system-overview.md#primary-use-cases'
    })
```

**Step 3**: Find maximum volume
```python
# Pseudo-code
max_volume = max(volumes, key=lambda x: x['value'])
```

**Step 4**: Apply threshold (>100,000)
```python
# Pseudo-code
impact = 'HIGH' if max_volume['value'] > 100000 else 'LOW'
```

**Step 5**: Format justification with comma-separated volume
```python
# Pseudo-code
volume_formatted = f"{max_volume['value']:,}"  # 500000 → "500,000"

return {
    'impact': impact,
    'justification': f"System impacts {volume_formatted} customers/transactions per day (Section 2.3, line {max_volume['line']})",
    'volume': max_volume['value'],
    'line': max_volume['line']
}
```

### Example

**Input**: `docs/01-system-overview.md` contains "500,000+ reminders per day" under `## Primary Use Cases`

**Output**:
```json
{
  "impact": "HIGH",
  "justification": "System impacts 500,000 customers/day (see [Primary Use Cases](01-system-overview.md#primary-use-cases))",
  "volume": 500000,
  "source": "docs/01-system-overview.md#primary-use-cases"
}
```

### Edge Cases

**Case 1: No volume metrics found**
```python
return {
    'impact': 'LOW',
    'justification': 'No volume metrics found in Use Cases success metrics',
    'volume': None,
    'line': None
}
```

**Case 2: Plus sign (+) in volume**
```python
# "500,000+ reminders per day"
# Extract: 500000
# Note "+" indicates minimum, actual may be higher
```

**Case 3: Exactly 100,000 (threshold edge case)**
```python
# 100,000 exactly → LOW Impact (threshold is >100K, not ≥100K)
# Flag for user review
```

**Case 4: Multiple units (customers vs transactions)**
```python
# Found: "500,000 customers" and "1,000,000 transactions"
# Use maximum: 1,000,000 → HIGH Impact
# Note both in context for user review
```

**Case 5: Volume without "per day" or "daily"**
```python
# "Supports 500,000 users"
# May still be valid scale metric
# Extract but flag for context review
```

---

## Algorithm 3: Impacts

**Definition**: Implementation complexity (configuration, development, deployment)

**Threshold**: >5 total = HIGH Impact, ≤5 total = LOW Impact

**Data Sources**:
- Section 5 Component Details: Count component subsection headers
- Section 8 Technology Stack: Count technology table rows

**Extraction Methods**:
- Components: Regex pattern `^###\s+\d+\.\d+` (H3 headers with numbering)
- Technologies: Count table rows (excluding headers and separators)

### Calculation Logic

**Step 1**: Read `docs/components/README.md` (component index)
```
Read(file_path="docs/components/README.md")
```

**Step 2**: Count components in the 5-column table (rows after the header/separator)
```python
# Pseudo-code — count data rows in the Components table
# (exclude header row and `|---|---|...` separator row)
component_count = count_data_rows(components_readme_text)
```

Alternative: glob count `docs/components/**/*.md` (excluding `README.md` and system descriptor files without `NN-` prefix).

**Step 3**: Read `docs/06-technology-stack.md` in full
```
Read(file_path="docs/06-technology-stack.md")
```

**Step 4**: Count technology table rows
```python
# Pseudo-code
tech_table_pattern = r'^\|[^|]+\|[^|]+\|.+\|$'
separator_pattern = r'^\|\s*-+\s*\|'

tech_rows = []
for line in section8_text.split('\n'):
    if re.match(tech_table_pattern, line) and not re.match(separator_pattern, line):
        tech_rows.append(line)

# Count rows excluding headers
# First row is typically header, subtract ~4-6 header rows across all tables
technology_count = max(0, len(tech_rows) - 5)  # Conservative estimate
```

**Step 5**: Calculate total impacts
```python
# Pseudo-code
total_impacts = component_count + technology_count
```

**Step 6**: Apply threshold (>5)
```python
# Pseudo-code
impact = 'HIGH' if total_impacts > 5 else 'LOW'
```

**Step 7**: Generate justification with breakdown
```python
# Pseudo-code
return {
    'impact': impact,
    'justification': f"System requires {total_impacts} components/technologies (Section 5: {component_count}, Section 8: {technology_count})",
    'component_count': component_count,
    'technology_count': technology_count,
    'total': total_impacts
}
```

### Example

**Input**:
- Section 5 has 5 component subsections (### 5.1, 5.2, 5.3, 5.4, 5.5)
- Section 8 has 8 technology table rows (3 after subtracting 5 header rows)

**Output**:
```json
{
  "impact": "HIGH",
  "justification": "System requires 8 components/technologies (Section 5: 5, Section 8: 3)",
  "component_count": 5,
  "technology_count": 3,
  "total": 8
}
```

### Edge Cases

**Case 1: Section 5 missing or empty**
```python
# Component count = 0
# Use only Section 8 technology count
# Note missing section in justification
```

**Case 2: Section 8 missing or empty**
```python
# Technology count = 0
# Use only Section 5 component count
# Note missing section in justification
```

**Case 3: Nested components (#### headers)**
```python
# Only count ### headers (H3)
# Ignore #### headers (H4 sub-components)
# Use strict pattern: ^###\s+\d+\.\d+
```

**Case 4: Multi-row table entries**
```python
# Technology tables may span multiple rows
# Count conservatively (subtract more header rows)
# Flag for manual review if count seems wrong
```

**Case 5: Exactly 5 total (threshold edge case)**
```python
# 5 exactly → LOW Impact (threshold is >5, not ≥5)
# Flag for user review
```

---

## File Loading Strategy

**Goal**: Read only the files needed — each `docs/NN-*.md` is 50–400 lines, so reading in full is cheap

### Loading Order

1. **`docs/01-system-overview.md`**: Extract Value Delivery (from `## Key Metrics`) and Scale (from `## Primary Use Cases`) metrics
2. **`docs/components/README.md`**: Count components in the 5-column table
3. **`docs/06-technology-stack.md`**: Count technology table rows

### Per-File Loading

```
# Step 1: System overview (covers Value Delivery + Scale)
Read(file_path="docs/01-system-overview.md")
# Process: Extract percentages AND use case volumes in one pass

# Step 2: Component index
Read(file_path="docs/components/README.md")
# Process: Count data rows in the 5-column table

# Step 3: Technology stack
Read(file_path="docs/06-technology-stack.md")
# Process: Count technology table rows
```

No offset/limit — each file fits comfortably in context.

---

## Implementation Notes

### Return Format

All three algorithms return structured data:

```python
{
  'impact': 'HIGH' or 'LOW',
  'justification': "Human-readable explanation with line reference",
  'value': <numeric_value>,  # percentage, volume, or count
  'line': <line_number>      # source line number
}
```

### User Review Required

**IMPORTANT**: All calculations must be presented to user for review before applying changes to ARCHITECTURE.md.

**Review Workflow**:
1. Run all three algorithms (orchestrator computes — these are deterministic numeric calculations, no sub-agent needed).
2. Generate calculation report.
3. Present findings to user.
4. Await user approval or manual override.
5. **Apply via the explore → Plan → editor pipeline** (v3.17.0+, see SKILL.md → "Sub-agent Orchestration Pattern"):
   - Skip the explorer call (target file is fixed: `docs/01-system-overview.md` → Section 2.2.1).
   - Build a Plan prompt carrying: the approved calculation values, the existing Section 2.2.1 content (orchestrator reads it once), and the instruction to emit Route C with one surgical-edit on `docs/01-system-overview.md`.
   - Dispatch via the editor agent.
   - Read the editor's summary; mark complete.

### Manual Override Support

Users can override any calculated value:
- Change impact level (HIGH ↔ LOW)
- Provide custom justification
- Specify different metric/threshold
- Mark as "Manual Override" in document

When manual override exists:
- Subsequent automatic calculations prompt before overwriting
- Preserve manual override unless user explicitly approves change

### Threshold Enforcement

**Strict Threshold Rules**:
- Value Delivery: >50% (not ≥50%)
- Scale: >100,000 (not ≥100,000)
- Impacts: >5 (not ≥5)

**Edge Case Handling**:
- Exactly at threshold → LOW Impact
- Flag exact matches for user review
- Note in justification: "(Threshold edge case: exactly 50%)"

---

## Integration with Workflows

### Metric Consistency Integration

Design Drivers calculation should run AFTER metric consistency check:
1. User updates Section 1 Key Metrics
2. Metric consistency check runs (syncs duplicates)
3. Design Drivers calculation runs (uses updated metrics)
4. Ensures Design Drivers reflect current metric values

### Architecture Review Integration

When user requests "architecture review", offer comprehensive checklist:
```
Architecture Review Checklist:
☐ Metric consistency check (Executive Summary vs other docs)
☐ Design Drivers calculation (Section 2.2.1 in docs/01-system-overview.md)
☐ Architecture Principles validation (9 required)
☐ Navigation index up to date (ARCHITECTURE.md links all docs/NN-*.md files)
☐ ADR references up to date (Section 12 table + adr/ files)
```

---

## Best Practices

### DO:
- ✅ Calculate after major architecture changes
- ✅ Recalculate quarterly during architecture reviews
- ✅ Use metrics in stakeholder presentations
- ✅ Document assumptions in justifications
- ✅ Update source sections before calculating
- ✅ Review calculation report carefully before applying
- ✅ Read only the `docs/NN-*.md` files needed for each driver
- ✅ Flag edge cases for user review

### DON'T:
- ❌ Auto-calculate on every minor update
- ❌ Override thresholds without documentation
- ❌ Ignore edge cases (flag for review)
- ❌ Skip user review (always present findings first)
- ❌ Forget to update "Last Calculated" date
- ❌ Calculate with stale data
- ❌ Load every `docs/NN-*.md` file when only 2–3 are needed
- ❌ Auto-apply changes without user approval

---

## Example: Complete Calculation

**Scenario**: Task Scheduling System architecture review

**Input Data**:
- `docs/01-system-overview.md` → `## Key Metrics`: "70% cost reduction"
- `docs/01-system-overview.md` → `## Primary Use Cases`: "500,000+ reminders per day"
- `docs/components/` → 5 component files
- `docs/06-technology-stack.md` → 8 technology table rows (3 after header subtraction)

**Calculation Results**:
```
Value Delivery: HIGH (70% > 50%)
Justification: "System delivers 70% cost reduction (see [Key Metrics](01-system-overview.md#key-metrics))"

Scale: HIGH (500,000 > 100,000)
Justification: "System impacts 500,000 customers/day (see [Primary Use Cases](01-system-overview.md#primary-use-cases))"

Impacts: HIGH (8 > 5)
Justification: "System requires 8 components/technologies (see [Components](components/README.md) + [Technology Stack](06-technology-stack.md))"

Overall: 3/3 HIGH - Strong business justification for architecture complexity
```

**Output Format** (for Section 2.2.1 in `docs/01-system-overview.md`):
```markdown
### 2.2.1 Design Drivers

This architecture is driven by the following key factors:

#### Value Delivery
**Description**: Effectiveness of change in customer experience
- **Threshold**: >50% = High Impact, ≤50% = Low Impact
- **Current Assessment**: HIGH Impact
- **Justification**: System delivers 70% cost reduction (see [Key Metrics](01-system-overview.md#key-metrics))

#### Scale
**Description**: Estimated number of customers impacted
- **Threshold**: >100K = High, ≤100K = Low
- **Current Assessment**: HIGH Impact
- **Justification**: System impacts 500,000 customers/day (see [Primary Use Cases](01-system-overview.md#primary-use-cases))

#### Impacts
**Description**: Implementation complexity across configuration, development, and applications
- **Threshold**: >5 = High, ≤5 = Low
- **Current Assessment**: HIGH Impact
- **Justification**: System requires 8 components/technologies (Section 5: 5, Section 8: 3)

**Last Calculated**: 2025-01-29
**Calculation Method**: Automatic
```

---

## Summary

This document provides implementation-level details for Design Drivers calculation algorithms. For conceptual understanding and templates, see **ARCHITECTURE_DOCUMENTATION_GUIDE.md § Design Drivers**. For operational workflows and trigger detection, see **SKILL.md § Design Drivers Workflow**.