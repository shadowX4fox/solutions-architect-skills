# Template Validation Framework - Developer Guide

A comprehensive validation framework for ensuring strict template adherence in compliance contract generation.

## Overview

The Template Validation Framework provides **two-stage validation** for compliance contract generation:

### Stage 1: Pre-Validation (Phase 4.1) - NEW
Validates template structure BEFORE data population:
- No unresolved @include directives
- Required sections present (Document Control, Compliance Summary)
- Appendix A.1-A.4 structure correct
- Basic markdown structure valid
- Placeholder format correct

**Benefits**: Catches template defects early, before spending time on data extraction/population.

### Stage 2: Post-Validation (Phase 4.6)
Validates populated contract BEFORE output across 5 critical areas:

1. **Compliance Summary Table** - 6-column format, row counts, markdown syntax
2. **Status Values** - Exact case enforcement (Compliant, Non-Compliant, Not Applicable, Unknown)
3. **Appendix A.1-A.4 Structure** - All present, correct order
4. **Compliance Calculations** - Sum checks (X+Y+Z+W=TOTAL), percentage accuracy
5. **Template Completeness** - All required sections present

**Benefits**: Ensures final contract strictly adheres to format requirements.

## Quick Start

### Pre-Validation (Phase 4.1)

Validate template structure after expanding @include directives:

```bash
# Expand template with structure validation
bun run utils/resolve-includes.ts templates/cc-010-sre-architecture.template.md expanded.md --validate
```

Output:
```
📋 Running template structure pre-validation...
✅ Template Structure Validation PASSED
   11/11 checks passed

✅ Template expanded successfully: expanded.md
   Lines: 1605 → 1736 (+131)
```

### Post-Validation (Phase 4.6)

Validate populated contract before output:

```typescript
import { ComplianceValidator } from './utils/validators';
import { ErrorReporter } from './utils/error-reporter';

// 1. Create validator with contract-specific rules
const validator = new ComplianceValidator(
  'validation/cc-010-sre-architecture-template-validation.json'
);

// 2. Validate document
const result = await validator.validateDocument(
  documentContent,
  'cc-010-sre-architecture'
);

// 3. Check results
if (!result.isValid) {
  const report = ErrorReporter.generateReport(result, 'cc-010-sre-architecture');
  console.error(report);
  throw new Error('Validation failed');
}

console.log('✅ Validation passed!');
```

### Run Example

```bash
cd skills/architecture-compliance
bun run examples/validate-example.ts
```

### Run Tests

```bash
cd skills/architecture-compliance
bun test tests/validators.test.ts
```

**Test Results:**
```
✅ 22 pass
❌ 0 fail
📊 46 expect() calls
⏱️  ~36ms
```

## Architecture

### Components

```
skills/architecture-compliance/
├── utils/
│   ├── validators.ts               (883 lines) - Post-validation engine (Phase 4.6)
│   ├── template-prevalidator.ts     (300 lines) - Pre-validation engine (Phase 4.1)
│   ├── error-reporter.ts           (409 lines) - Error formatting & reporting
│   ├── generation-helper.ts        (250 lines) - Integration helper module
│   ├── validate-cli.ts             (200 lines) - Standalone CLI tool
│   ├── resolve-includes.ts         (240 lines) - Template expansion + pre-validation
│   └── validate-example.ts         (200 lines) - Example usage (see examples/)
├── validation/
│   ├── TEMPLATE_VALIDATION_SCHEMA.json     - JSON schema for rules
│   ├── VALIDATION_RULE_EXAMPLES.md         - Examples & patterns
│   ├── cc-010-sre-architecture-template-validation.json (10 files total)
│   └── ... (9 more contract-specific rule files)
└── tests/
    └── validators.test.ts          (300 lines) - Comprehensive test suite
```

### Validation Flow (Two-Stage)

```
┌─────────────────────────────────────────┐
│   Phase 4.1: Template Loading           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Expand @include Directives            │
│   (resolve-includes.ts)                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   PRE-VALIDATION (--validate flag)      │
│   Check template structure:             │
│   • No unresolved @include directives   │
│   • Required sections present           │
│   • Appendix A.1-A.4 correct            │
│   • Basic markdown structure            │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌─────────┐    ┌─────────────┐
    │ Valid   │    │ Invalid     │
    └────┬────┘    └──────┬──────┘
         │                │
         │                ▼
         │         ┌──────────────┐
         │         │ BLOCK & Show │
         │         │ Error Report │
         │         └──────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Phase 4.2-4.5: Data Population        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Phase 4.6: POST-VALIDATION            │
│   Load Validation Rules                 │
│   (validation/cc-*-template-validation.json)│
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Run 5 Validation Areas:               │
│   1. Compliance Table                   │
│   2. Status Values                      │
│   3. Appendix Structure                 │
│   4. Calculations                       │
│   5. Completeness                       │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌─────────┐    ┌─────────────┐
    │ Valid   │    │ Invalid     │
    └────┬────┘    └──────┬──────┘
         │                │
         ▼                ▼
  ┌──────────┐    ┌──────────────┐
  │ Proceed  │    │ BLOCK & Show │
  │ to Phase │    │ Error Report │
  │ 5        │    └──────────────┘
  └──────────┘
```

### Validation Manifest Integration

After all contracts are generated (Phase 5), the COMPLIANCE_MANIFEST.md is created with:

1. **Compliance Framework Reference**: Links to this guide (VALIDATION_FRAMEWORK_GUIDE.md)
2. **Validation Configuration**: Lists all validation rule files used
3. **Generated Documents**: Summary of all contracts with completeness metrics
4. **Approval Status**: Aggregate validation scores and review requirements

This manifest provides a centralized reference for auditing and tracking validation framework usage across all compliance contracts.

## Contract Types & Rules

| Contract | Requirements | Special Case |
|----------|--------------|--------------|
| SRE Architecture | 57 (36+21) | Two-tier scoring |
| Business Continuity | 5 sections | Section-based (no table) |
| Cloud Architecture | 6 | Standard |
| Security Architecture | 56 | Standard |
| Data & AI | 10 (5+5) | Dual categories |
| Development | 14 | Standard |
| Enterprise | 12 | Standard |
| Integration | 18 | Standard |
| Platform IT | 15 | Standard |
| Process Transformation | 12 | Standard |

## Error Reporting

### Console Report Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION FAILED: SRE Architecture (3 errors, 1 warning)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR 1: Invalid Status Value (Line 287)
Severity: BLOCKING
Location: Compliance Summary Table / Row 5

Expected:
  One of ["Compliant", "Non-Compliant", "Not Applicable", "Unknown"]

Found:
  "Pass"

Fix:
  Change "Pass" to "Compliant" (exact case required)
```

### Other Formats

```typescript
// Compact summary
const summary = ErrorReporter.generateCompactSummary(result);
// Output: "❌ Validation failed: 3 blocking errors, 1 warning"

// Markdown report
const markdown = ErrorReporter.generateMarkdownReport(result, contractType);
// Output: Full markdown with tables and formatting
```

## Validation Details

### 1. Compliance Summary Table

**What it validates:**
- Exactly 6 columns in correct order
- Markdown syntax (pipes, separators)
- Row count matches requirements
- Code format: `^[A-Z]+\d+$`
- Valid category values
- Valid status values

**Common errors:**
- Wrong column count (5 instead of 6)
- Missing "Responsible Role" column
- Invalid code format
- Wrong status case

### 2. Status Value Standardization

**What it validates:**
- Exact case: "Compliant", "Non-Compliant", "Not Applicable", "Unknown"
- Consistency across all locations

**Common errors:**
- Lowercase "compliant" instead of "Compliant"
- "Pass"/"Fail" instead of standard values
- "N/A" instead of "Not Applicable"

### 3. Appendix A.1-A.4 Structure

**What it validates:**
- All 4 appendices present
- Correct heading format: `### A.X`
- Correct order (A.1 → A.2 → A.3 → A.4)

**Common errors:**
- Missing A.2 or A.3
- Out of order appendices
- Wrong heading level

### 4. Compliance Calculations

**What it validates:**
- Sum: Compliant + Non-Compliant + Not Applicable + Unknown = TOTAL
- Percentages: `round((count / TOTAL) * 100)` matches stated %
- Emojis: ✅ ❌ ⊘ ❓

**Common errors:**
- Counts don't sum to TOTAL
- Percentage off by 1% (rounding error)
- Missing or wrong emoji

### 5. Template Completeness

**What it validates:**
- All required sections present
- Correct section identifiers

**Common errors:**
- Missing document_control
- Missing dynamic_sections

## Performance

**Benchmarks:**
- Validation: ~100-150ms per contract
- Overhead: 3-5% of total generation time
- All tests: ~36ms for 22 tests

**Optimization:**
- Incremental validation (section-by-section)
- Early error detection
- Efficient regex patterns
- Cached validation rules

## Extending the Framework

### Adding New Validation Type

1. **Update Schema** (`TEMPLATE_VALIDATION_SCHEMA.json`)
2. **Update Contract Rules** (all 10 JSON files)
3. **Implement Validation** (`validators.ts`)
4. **Add Tests** (`validators.test.ts`)
5. **Update Documentation**

Example:
```typescript
// In validators.ts
private async validateNewRule(content: string): Promise<void> {
  const rules = this.rules.validations.new_rule!;
  this.checksPerformed++;

  // Validation logic here

  if (/* validation fails */) {
    this.errors.push({
      errorId: 'NEW_RULE_ERROR',
      severity: rules.severity,
      validationArea: 'New Rule',
      location: 'Somewhere',
      expected: 'Expected value',
      found: 'Actual value',
      references: { skillMd: 'line 123' },
      fix: 'How to fix',
    });
  }

  this.checksPassed++;
}
```

### Modifying Requirements

Simply update the contract-specific JSON file:

```json
{
  "validations": {
    "compliance_summary_table": {
      "requirement_count": 60  // Changed from 57
    }
  }
}
```

## Special Cases

### Business Continuity

Uses **section-based format** instead of table:

```markdown
## 1. Recovery Objectives (LABC1)

**RTO**: 4 hours
- Status: Compliant

**RPO**: 15 minutes
- Status: Compliant
```

**Validation:**
- Table validation disabled
- Section-based format validation enabled
- Appendix A.2 not required

### SRE Architecture

**Two-tier scoring:** 36 Blocker + 21 Desired = 57 total

**Validation:**
- Must have exactly 57 rows
- Two-tier note must be present
- Blocker/Desired counts validated

### Data & AI

**Dual categories:** "Data" and "AI" (not "Data & AI Architecture")

**Validation:**
- Category must be "Data" or "AI"
- Code pattern: `^LA(D|AI)\d+$`

## Troubleshooting

### Test Failures

**Issue:** Tests fail with "INVALID_TABLE_COLUMNS"
```bash
# Solution: Check table has exactly 6 columns
cat test-document.md | grep "^|" | head -1
# Should show 6 pipe-separated columns
```

**Issue:** Tests fail with calculation errors
```bash
# Solution: Verify sum and percentages
# Sum: Compliant + Non-Compliant + Not Applicable + Unknown = TOTAL
# Percentage: round((count / TOTAL) * 100)
```

### Integration Issues

**Issue:** Validation too strict
```typescript
// Solution: Adjust tolerance in rules
{
  "compliance_calculation": {
    "percentage_tolerance": 1  // Allow ±1% deviation
  }
}
```

**Issue:** Performance too slow
```typescript
// Solution: Disable non-critical validations for debugging
{
  "appendix_structure": {
    "enabled": false  // Temporarily disable
  }
}
```

## Testing

### Run Full Test Suite

```bash
bun test tests/validators.test.ts
```

### Run Specific Test

```bash
bun test tests/validators.test.ts -t "should pass validation for valid 6-column table"
```

### Run with Coverage

```bash
bun test --coverage tests/validators.test.ts
```

### Test Categories

- **ComplianceTableValidation** (4 tests)
- **StatusValueValidation** (4 tests)
- **AppendixValidation** (4 tests)
- **CalculationValidation** (5 tests)
- **CompletenessValidation** (2 tests)
- **IntegrationTests** (2 tests)
- **ContractTypeMismatch** (1 test)

## Documentation References

- **Schema**: `validation/TEMPLATE_VALIDATION_SCHEMA.json`
- **Examples**: `validation/VALIDATION_RULE_EXAMPLES.md`
- **Integration**: `COMPLIANCE_GENERATION_GUIDE.md` (Phase 4.6)
- **Format Requirements**: `SKILL.md` (lines 676-740)

## API Reference

### ComplianceValidator

```typescript
class ComplianceValidator {
  constructor(rulesPath: string)

  validateDocument(
    content: string,
    contractType: string
  ): Promise<ValidationResult>
}
```

### ErrorReporter

```typescript
class ErrorReporter {
  static generateReport(
    result: ValidationResult,
    contractType: string
  ): string

  static generateCompactSummary(
    result: ValidationResult
  ): string

  static generateMarkdownReport(
    result: ValidationResult,
    contractType: string
  ): string

  static groupErrorsByArea(
    errors: ValidationError[]
  ): Map<string, ValidationError[]>
}
```

### Types

```typescript
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  validationSummary: {
    totalChecks: number
    passed: number
    failed: number
    warnings: number
  }
}

interface ValidationError {
  errorId: string
  severity: 'BLOCKING' | 'WARNING' | 'INFO'
  validationArea: string
  lineNumber?: number
  location: string
  expected: string
  found: string
  references: {
    skillMd?: string
    template?: string
    shared?: string
  }
  fix: string
}
```

## Version History

- **v1.0.0** - Initial release with all 5 validation areas
- Full test coverage (22 tests passing)
- Support for all 10 contract types
- Special case handling (Business Continuity, SRE, Data & AI)

## Future Enhancements

Potential future additions:
- [ ] Validation caching for performance
- [ ] Parallel validation execution
- [ ] Custom validation plugins
- [ ] Validation metrics dashboard
- [ ] Auto-fix suggestions
- [ ] Integration with CI/CD
- [ ] HTML report generation

---

**Status:** ✅ Production Ready
**Test Coverage:** 22/22 passing
**Performance:** <150ms per contract
**Last Updated:** 2024-12-11
