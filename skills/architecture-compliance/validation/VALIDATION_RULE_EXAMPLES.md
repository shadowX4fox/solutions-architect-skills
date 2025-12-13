# Compliance Template Validation - Examples

This document provides examples of valid and invalid patterns for each validation area, along with explanations of why they pass or fail validation.

## Table of Contents

1. [Compliance Summary Table](#1-compliance-summary-table)
2. [Status Value Standardization](#2-status-value-standardization)
3. [Appendix A.1-A.4 Structure](#3-appendix-a1-a4-structure)
4. [Compliance Calculations](#4-compliance-calculations)
5. [Template Completeness](#5-template-completeness)
6. [Special Cases](#6-special-cases)

---

## 1. Compliance Summary Table

### ✅ VALID: 6-Column Table

```markdown
## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Structured logging | Practice - Log Management | Compliant | Section 11.1 | SRE Team |
| LASRE02 | Centralized logging | Practice - Log Management | Non-Compliant | Not documented | SRE Team |
| LASRE03 | Log retention policy | Practice - Log Management | Not Applicable | N/A | N/A |
```

**Why it passes:**
- Exactly 6 columns in correct order
- Valid Code format (LASRE01, LASRE02, etc.)
- Valid Status values (Compliant, Non-Compliant, Not Applicable)
- Proper markdown syntax

### ❌ INVALID: 5-Column Table

```markdown
## Compliance Summary

| Code | Requirement | Category | Status | Source Section |
|------|-------------|----------|--------|----------------|
| LASRE01 | Structured logging | Practice | Compliant | Section 11.1 |
```

**Why it fails:**
- Only 5 columns (missing "Responsible Role")
- Will trigger: `INVALID_TABLE_COLUMNS` error
- **Fix**: Add "Responsible Role" column

**Error Example:**
```
ERROR: Invalid Table Columns (Line 42)
Expected: 6 columns: Code | Requirement | Category | Status | Source Section | Responsible Role
Found: 5 columns
Fix: Ensure table has exactly 6 columns in this order
```

### ❌ INVALID: Wrong Column Order

```markdown
## Compliance Summary

| Code | Category | Requirement | Status | Source Section | Responsible Role |
|------|----------|-------------|--------|----------------|------------------|
| LASRE01 | Practice | Structured logging | Compliant | Section 11.1 | SRE Team |
```

**Why it fails:**
- Columns 2 and 3 are swapped
- Will trigger: `INVALID_COLUMN_NAME` error
- **Fix**: Reorder columns to: Code, Requirement, Category, Status, Source Section, Responsible Role

### ❌ INVALID: Invalid Code Format

```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| sre-01 | Structured logging | Practice | Compliant | Section 11.1 | SRE Team |
```

**Why it fails:**
- Code uses lowercase and hyphen instead of uppercase letters + numbers
- Expected pattern: `^[A-Z]+\\d+$` (e.g., LASRE01, LAC1)
- Will trigger: `INVALID_CODE_FORMAT` error
- **Fix**: Change "sre-01" to "LASRE01"

---

## 2. Status Value Standardization

### ✅ VALID: Exact Case Status Values

**In Table:**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Test | Category | Compliant | Section 1 | Team |
| LASRE02 | Test | Category | Non-Compliant | Not documented | Team |
| LASRE03 | Test | Category | Not Applicable | N/A | N/A |
| LASRE04 | Test | Category | Unknown | Section 2 | Team |
```

**In Requirement Sections:**
```markdown
## 1. Test Requirement

**Status**: [Compliant]
```

**In Subsections:**
```markdown
- Status: Compliant
```

**Why it passes:**
- Uses exact case for all four allowed values
- Consistent across all locations

### ❌ INVALID: Case Mismatch

```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Test | Category | compliant | Section 1 | Team |
```

**Why it fails:**
- Uses lowercase "compliant" instead of "Compliant"
- Will trigger: `INVALID_STATUS_VALUE` error
- **Fix**: Change "compliant" to "Compliant" (exact case required)

**Error Example:**
```
ERROR: Invalid Status Value (Line 45)
Expected: One of ["Compliant", "Non-Compliant", "Not Applicable", "Unknown"]
Found: "compliant"
Fix: Change "compliant" to "Compliant"
```

### ❌ INVALID: Custom Status Value

```markdown
**Status**: [Pass]
```

**Why it fails:**
- "Pass" is not one of the four allowed values
- Will trigger: `INVALID_STATUS_VALUE` error
- Suggestion: "Did you mean 'Compliant'?"
- **Fix**: Change "Pass" to "Compliant"

### ❌ INVALID: Abbreviated Status

```markdown
- Status: N/A
```

**Why it fails:**
- "N/A" is not the exact status value
- Will trigger: `INVALID_STATUS_VALUE` error
- Suggestion: "Did you mean 'Not Applicable'?"
- **Fix**: Change "N/A" to "Not Applicable"

---

## 3. Appendix A.1-A.4 Structure

### ✅ VALID: Complete Appendix Structure

```markdown
### A.1 Definitions and Terminology

**Domain-Specific Terms**:
- **Term 1**: Definition
- **Term 2**: Definition

**Status Codes**:
- **Compliant**: Requirement fully satisfied
- **Non-Compliant**: Requirement not met
- **Not Applicable**: Requirement does not apply
- **Unknown**: Partial information exists

### A.2 Validation Methodology

**Completeness Check (40% weight)**:
...

**Compliance Check (50% weight)**:
...

**Quality Check (10% weight)**:
...

### A.3 Document Completion Guide

**How to Complete Missing Data**:
...

### A.4 Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2024-01-01 | System | Initial version |
```

**Why it passes:**
- All four appendices present (A.1, A.2, A.3, A.4)
- Correct heading format (`### A.X`)
- In correct order

### ❌ INVALID: Missing A.2

```markdown
### A.1 Definitions and Terminology
...

### A.3 Document Completion Guide
...

### A.4 Change History
...
```

**Why it fails:**
- Missing A.2 Validation Methodology
- Will trigger: `MISSING_APPENDIX` error
- **Fix**: Add `### A.2 Validation Methodology` section

**Error Example:**
```
ERROR: Missing Appendix (Line 450)
Missing: ### A.2 Validation Methodology
Found: A.1 ✓, A.3 ✓, A.4 ✓
Expected order: A.1 → A.2 → A.3 → A.4
Fix: Add A.2 Validation Methodology section
```

### ❌ INVALID: Out of Order (when strict_order=true)

```markdown
### A.1 Definitions and Terminology
...

### A.3 Document Completion Guide
...

### A.2 Validation Methodology
...

### A.4 Change History
...
```

**Why it fails:**
- A.3 appears before A.2
- Will trigger: `APPENDIX_OUT_OF_ORDER` error (if strict_order=true)
- **Fix**: Reorder to A.1 → A.2 → A.3 → A.4

---

## 4. Compliance Calculations

### ✅ VALID: Correct Calculations

```markdown
**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)

**Completeness**: 95% (54/57 data points documented)
```

**Why it passes:**
- Sum check: 42 + 8 + 3 + 4 = 57 ✓
- Percentage for Compliant: round((42/57) * 100) = 74% ✓
- Percentage for Non-Compliant: round((8/57) * 100) = 14% ✓
- Percentage for Not Applicable: round((3/57) * 100) = 5% ✓
- Percentage for Unknown: round((4/57) * 100) = 7% ✓
- Correct emoji indicators ✅ ❌ ⊘ ❓

### ❌ INVALID: Incorrect Sum

```markdown
**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 5/57 (9%)
```

**Why it fails:**
- Sum: 42 + 8 + 3 + 5 = 58 (should be 57)
- Will trigger: `CALCULATION_SUM_ERROR`
- **Fix**: Verify counts sum to TOTAL (42 + 8 + 3 + 4 = 57)

**Error Example:**
```
ERROR: Calculation Sum Error (Line 98)
Expected: Sum of status counts equals TOTAL (57)
Found: Sum = 58
Fix: Verify counts: Compliant=42, Non-Compliant=8, Not Applicable=3, Unknown=5 should sum to 57
```

### ❌ INVALID: Incorrect Percentage

```markdown
**Overall Compliance**:
- ✅ Compliant: 42/57 (75%)
```

**Why it fails:**
- Calculated: round((42/57) * 100) = 74%
- Stated: 75%
- Off by 1% (exceeds tolerance)
- Will trigger: `CALCULATION_PERCENTAGE_ERROR`
- **Fix**: Change percentage from 75% to 74%

### ❌ INVALID: Missing Emoji Indicator

```markdown
**Overall Compliance**:
- Compliant: 42/57 (74%)
```

**Why it fails:**
- Missing ✅ emoji before "Compliant"
- Will trigger: `INVALID_EMOJI_INDICATOR`
- **Fix**: Add ✅ emoji: `- ✅ Compliant: 42/57 (74%)`

---

## 5. Template Completeness

### ✅ VALID: All Required Sections Present

```markdown
# Compliance Contract: SRE Architecture

**Project**: Example Project
**Generation Date**: 2024-01-01
**Source**: ARCHITECTURE.md
**Version**: 2.0

## Document Control

**Status**: Draft
**Validation Score**: 8.5/10

## Compliance Summary

[Table here]

**Overall Compliance**:
[Metrics here]

## 1. Log Management (LASRE01)
[Requirements here]

### A.1 Definitions and Terminology
...

### A.2 Validation Methodology
...

### A.3 Document Completion Guide
...

### A.4 Change History
...

## Data Extracted from ARCHITECTURE.md
...

## Missing Data Requiring Manual Review
...
```

**Why it passes:**
- All required sections present:
  - header (Project, Date, Source, Version)
  - document_control
  - compliance_summary
  - overall_compliance
  - requirement sections
  - appendix_a1_a4
  - dynamic_sections

### ❌ INVALID: Missing Document Control

```markdown
# Compliance Contract: SRE Architecture

**Project**: Example Project

## Compliance Summary
[Table here]
```

**Why it fails:**
- Missing "## Document Control" section
- Will trigger: `MISSING_REQUIRED_SECTION`
- **Fix**: Add Document Control section before Compliance Summary

**Error Example:**
```
ERROR: Missing Required Section (Line 10)
Expected: Section: document_control
Found: Section not found
Fix: Add required section: document_control
```

---

## 6. Special Cases

### Special Case 1: Business Continuity (Section-Based Format)

**Business Continuity does NOT use the 6-column Compliance Summary table.**

### ✅ VALID: Business Continuity Format

```markdown
## 1. Recovery Objectives (LABC1)

**RTO (Recovery Time Objective)**: 4 hours
- Status: Compliant
- Source: ARCHITECTURE.md Section 11.3, lines 489-491

**RPO (Recovery Point Objective)**: 15 minutes
- Status: Compliant
- Source: ARCHITECTURE.md Section 11.3, lines 492-494

**Business Criticality**: Tier 1 (Mission Critical)
- Status: Compliant
- Source: ARCHITECTURE.md Section 10.1, lines 425-427
```

**Why it passes:**
- Section-based format with required fields (RTO, RPO, Business Criticality)
- No Compliance Summary table (disabled for Business Continuity)
- Status values still validated

### ❌ INVALID: Business Continuity with Table

```markdown
## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LABC1 | RTO | BC | Compliant | 11.3 | BC Team |
```

**Why it fails:**
- Business Continuity should NOT use table format
- Will trigger warning or error depending on configuration
- **Fix**: Use section-based format instead

---

### Special Case 2: SRE Architecture (Two-Tier Scoring)

**SRE Architecture has 57 requirements: 36 Blocker + 21 Desired**

### ✅ VALID: Two-Tier Row Count

```markdown
## Compliance Summary

**Two-Tier Compliance Scoring**: This contract uses a two-tier scoring system with 36 Blocker requirements (LASRE01-16, critical for approval) and 21 Desired requirements (LASRE17+, enhance quality).

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
[... 57 total rows: 36 Blocker + 21 Desired ...]
```

**Why it passes:**
- Table has exactly 57 rows (36 + 21)
- Two-tier note present
- Blocker and Desired counts match configuration

### ❌ INVALID: Wrong Row Count

```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
[... only 50 rows ...]
```

**Why it fails:**
- Only 50 rows instead of 57
- Will trigger: `INVALID_ROW_COUNT` and `TWO_TIER_COUNT_MISMATCH`
- **Fix**: Add missing 7 requirement rows

---

### Special Case 3: Data & AI Architecture (Dual Categories)

**Data & AI uses "Data" and "AI" as categories, not "Data & AI Architecture"**

### ✅ VALID: Dual Categories

```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAD1 | Data modeling | Data | Compliant | Section 8 | Data Architect |
| LAD2 | Data quality | Data | Compliant | Section 8 | Data Architect |
| LAIA1 | ML model versioning | AI | Compliant | Section 8 | ML Engineer |
| LAIA2 | Model monitoring | AI | Compliant | Section 8 | ML Engineer |
```

**Why it passes:**
- Uses "Data" category for LAD* codes
- Uses "AI" category for LAIA* codes
- Correct CODE pattern: `^LA(D|AI)\\d+$`

### ❌ INVALID: Wrong Category

```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LAD1 | Data modeling | Data & AI Architecture | Compliant | Section 8 | Data Architect |
```

**Why it fails:**
- Uses "Data & AI Architecture" instead of "Data"
- Will trigger: `INVALID_CATEGORY` error
- **Fix**: Change category to "Data" for LAD* codes, "AI" for LAIA* codes

---

## Common Error Patterns

### 1. Copy-Paste Errors

**❌ INVALID:**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Logging | Practice | Compliant | Section 11.1 | SRE Team |
| LASRE01 | Logging | Practice | Compliant | Section 11.1 | SRE Team |
```

**Issue**: Duplicate Code (LASRE01 appears twice)
**Fix**: Use sequential codes (LASRE01, LASRE02, etc.)

### 2. Placeholder Retention

**❌ INVALID:**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| [CODE] | [Requirement] | [Category] | [STATUS] | [SOURCE] | [ROLE] |
```

**Issue**: Placeholders not replaced with actual values
**Fix**: Replace all placeholders with real data

### 3. Markdown Syntax Errors

**❌ INVALID:**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role
|------|-------------|----------|--------|----------------|------------------
| LASRE01 | Test | Category | Compliant | Section 1 | Team
```

**Issue**: Missing trailing pipes (|) at end of rows
**Fix**: Add trailing pipe to each row

---

## Validation Workflow

1. **Generate document** using compliance generation workflow
2. **Run validation** via `ComplianceValidator`
3. **Review errors** in detailed error report
4. **Fix issues** using error report fix instructions
5. **Re-validate** until all errors resolved
6. **Proceed to output** when validation passes

## Testing Validation

To test validation rules manually:

```typescript
import { ComplianceValidator } from './utils/validators';

const validator = new ComplianceValidator('validation/template_validation_sre_architecture.json');
const result = await validator.validateDocument(documentContent, 'sre_architecture');

console.log(result.isValid);  // true or false
console.log(result.errors);    // Array of validation errors
```

---

## Reference

- **SKILL.md**: Lines 676-740 (Format Enforcement Checklist)
- **Validation Schema**: `/validation/TEMPLATE_VALIDATION_SCHEMA.json`
- **Validation Rules**: `/validation/template_validation_*.json`
- **Validators**: `/utils/validators.ts`
- **Error Reporter**: `/utils/error_reporter.ts`
