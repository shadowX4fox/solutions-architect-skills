/**
 * Compliance Validator Unit Tests
 *
 * Tests all 5 validation areas:
 * 1. Compliance Summary table (6-column format)
 * 2. Status value standardization
 * 3. Appendix A.1-A.4 structure
 * 4. Compliance calculation accuracy
 * 5. Template completeness
 *
 * @module validators.test
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { ComplianceValidator } from '../utils/validators';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEMP_DIR = join(__dirname, '.temp');

// Create temp directory for test files
try {
  mkdirSync(TEMP_DIR, { recursive: true });
} catch {
  // Directory already exists
}

const VALID_TABLE = `## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Structured logging | Practice - Log Management | Compliant | Section 11.1 | SRE Team |
| LASRE02 | Centralized logging | Practice - Log Management | Compliant | Section 11.1 | SRE Team |
| LASRE03 | Log retention policy | Practice - Log Management | Non-Compliant | Not documented | SRE Team |
`;

const INVALID_5COLUMN_TABLE = `## Compliance Summary

| Code | Requirement | Category | Status | Source Section |
|------|-------------|----------|--------|----------------|
| LASRE01 | Structured logging | Practice | Compliant | Section 11.1 |
`;

const INVALID_STATUS_TABLE = `## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Structured logging | Practice | Pass | Section 11.1 | SRE Team |
`;

const VALID_OVERALL_COMPLIANCE = `**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)

**Completeness**: 95% (54/57 data points documented)
`;

const INVALID_SUM_COMPLIANCE = `**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 5/57 (9%)

**Completeness**: 95% (54/57 data points documented)
`;

const INVALID_PERCENTAGE_COMPLIANCE = `**Overall Compliance**:
- ✅ Compliant: 42/57 (75%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)

**Completeness**: 95% (54/57 data points documented)
`;

const VALID_APPENDIX = `### A.1 Definitions and Terminology

**Domain-Specific Terms**: ...

### A.2 Validation Methodology

**Completeness Check**: ...

### A.3 Document Completion Guide

**How to Complete**: ...

### A.4 Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2024-01-01 | System | Initial version |
`;

const MISSING_A2_APPENDIX = `### A.1 Definitions and Terminology

**Domain-Specific Terms**: ...

### A.3 Document Completion Guide

**How to Complete**: ...

### A.4 Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2024-01-01 | System | Initial version |
`;

const OUT_OF_ORDER_APPENDIX = `### A.1 Definitions and Terminology

**Domain-Specific Terms**: ...

### A.3 Document Completion Guide

**How to Complete**: ...

### A.2 Validation Methodology

**Completeness Check**: ...

### A.4 Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2024-01-01 | System | Initial version |
`;

// ============================================================================
// Helper Functions
// ============================================================================

function createTestRules(overrides: any = {}): string {
  const rules = {
    contract_type: 'sre_architecture',
    contract_name: 'SRE Architecture Test',
    template_file: 'TEST_TEMPLATE.md',
    version: '1.0.0',
    validations: {
      compliance_summary_table: {
        enabled: true,
        severity: 'BLOCKING',
        requirement_count: 3,
        ...overrides.compliance_summary_table,
      },
      status_value_standardization: {
        enabled: true,
        severity: 'BLOCKING',
        allowed_values: ['Compliant', 'Non-Compliant', 'Not Applicable', 'Unknown'],
        case_sensitive: true,
        ...overrides.status_value_standardization,
      },
      appendix_structure: {
        enabled: true,
        severity: 'BLOCKING',
        required_appendices: ['A.1', 'A.2', 'A.3', 'A.4'],
        strict_order: true,
        ...overrides.appendix_structure,
      },
      compliance_calculation: {
        enabled: true,
        severity: 'BLOCKING',
        total_requirements: 57,
        percentage_tolerance: 0,
        ...overrides.compliance_calculation,
      },
      template_completeness: {
        enabled: true,
        severity: 'BLOCKING',
        required_sections: ['header', 'document_control', 'compliance_summary'],
        ...overrides.template_completeness,
      },
      ...overrides.validations,
    },
  };

  const rulesPath = join(TEMP_DIR, `test_rules_${Date.now()}.json`);
  writeFileSync(rulesPath, JSON.stringify(rules, null, 2));
  return rulesPath;
}

// ============================================================================
// Tests: Compliance Summary Table Validation
// ============================================================================

describe('ComplianceTableValidation', () => {
  test('should pass validation for valid 6-column table', async () => {
    // Disable appendix and completeness validation for this test
    const rulesPath = createTestRules({
      appendix_structure: { enabled: false },
      template_completeness: { enabled: false },
    });
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${VALID_OVERALL_COMPLIANCE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    expect(result.errors.length).toBe(0);
    expect(result.isValid).toBe(true);
  });

  test('should fail validation for 5-column table', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${INVALID_5COLUMN_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    const tableError = result.errors.find(e => e.errorId === 'INVALID_TABLE_COLUMNS');
    expect(tableError).toBeDefined();
    expect(tableError?.expected).toContain('6 columns');
    expect(tableError?.found).toContain('5 columns');
  });

  test('should fail validation for incorrect row count', async () => {
    const rulesPath = createTestRules({
      compliance_summary_table: { requirement_count: 5 },
    });
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const rowCountError = result.errors.find(e => e.errorId === 'INVALID_ROW_COUNT');
    expect(rowCountError).toBeDefined();
    expect(rowCountError?.expected).toContain('5 requirement rows');
    expect(rowCountError?.found).toContain('3 rows');
  });

  test('should fail validation for invalid code format', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const invalidCodeTable = `## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| invalid-code | Test | Category | Compliant | Section 1 | Team |
`;

    const document = `# Compliance Contract: Test
${invalidCodeTable}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const codeError = result.errors.find(e => e.errorId === 'INVALID_CODE_FORMAT');
    expect(codeError).toBeDefined();
    expect(codeError?.location).toContain('Code column');
  });
});

// ============================================================================
// Tests: Status Value Validation
// ============================================================================

describe('StatusValueValidation', () => {
  test('should pass validation for exact case status values', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const statusErrors = result.errors.filter(e => e.errorId === 'INVALID_STATUS_VALUE');
    expect(statusErrors.length).toBe(0);
  });

  test('should fail validation for invalid status value', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${INVALID_STATUS_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const statusError = result.errors.find(e =>
      e.errorId === 'INVALID_STATUS_VALUE' &&
      e.found === 'Pass'
    );
    expect(statusError).toBeDefined();
    expect(statusError?.fix).toContain('Compliant');
  });

  test('should suggest correction for common errors', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const invalidTable = `## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Test | Category | N/A | Section 1 | Team |
`;

    const document = `# Compliance Contract: Test
${invalidTable}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const statusError = result.errors.find(e =>
      e.errorId === 'INVALID_STATUS_VALUE' &&
      e.found === 'N/A'
    );
    expect(statusError).toBeDefined();
    expect(statusError?.fix).toContain('Not Applicable');
  });

  test('should validate status in requirement sections', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}

## 1. Test Requirement

**Status**: [Pass]
`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const statusError = result.errors.find(e =>
      e.errorId === 'INVALID_STATUS_VALUE' &&
      e.location === 'Requirement section status' &&
      e.found === 'Pass'
    );
    expect(statusError).toBeDefined();
  });
});

// ============================================================================
// Tests: Appendix Structure Validation
// ============================================================================

describe('AppendixValidation', () => {
  test('should pass validation for complete A.1-A.4 structure', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${VALID_APPENDIX}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const appendixErrors = result.errors.filter(e =>
      e.errorId === 'MISSING_APPENDIX' || e.errorId === 'APPENDIX_OUT_OF_ORDER'
    );
    expect(appendixErrors.length).toBe(0);
  });

  test('should fail validation for missing A.2', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${MISSING_A2_APPENDIX}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const missingError = result.errors.find(e =>
      e.errorId === 'MISSING_APPENDIX' &&
      e.expected.includes('A.2')
    );
    expect(missingError).toBeDefined();
    expect(missingError?.fix).toContain('Add appendix section: ### A.2');
  });

  test('should fail validation for out-of-order appendices when strict_order enabled', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${OUT_OF_ORDER_APPENDIX}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const orderError = result.errors.find(e => e.errorId === 'APPENDIX_OUT_OF_ORDER');
    expect(orderError).toBeDefined();
  });

  test('should allow out-of-order appendices when strict_order disabled', async () => {
    const rulesPath = createTestRules({
      appendix_structure: { strict_order: false },
    });
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${OUT_OF_ORDER_APPENDIX}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const orderError = result.errors.find(e => e.errorId === 'APPENDIX_OUT_OF_ORDER');
    expect(orderError).toBeUndefined();
  });
});

// ============================================================================
// Tests: Calculation Validation
// ============================================================================

describe('CalculationValidation', () => {
  test('should pass validation for correct calculations', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${VALID_OVERALL_COMPLIANCE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const calcErrors = result.errors.filter(e =>
      e.errorId === 'CALCULATION_SUM_ERROR' ||
      e.errorId === 'CALCULATION_PERCENTAGE_ERROR'
    );
    expect(calcErrors.length).toBe(0);
  });

  test('should fail validation for incorrect sum', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${INVALID_SUM_COMPLIANCE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const sumError = result.errors.find(e => e.errorId === 'CALCULATION_SUM_ERROR');
    expect(sumError).toBeDefined();
    expect(sumError?.expected).toContain('57');
    expect(sumError?.found).toContain('58');
  });

  test('should fail validation for incorrect percentage', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${INVALID_PERCENTAGE_COMPLIANCE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const percentageError = result.errors.find(e => e.errorId === 'CALCULATION_PERCENTAGE_ERROR');
    expect(percentageError).toBeDefined();
    expect(percentageError?.expected).toContain('74%');
    expect(percentageError?.found).toContain('75%');
  });

  test('should fail validation for missing Overall Compliance section', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const missingError = result.errors.find(e => e.errorId === 'MISSING_OVERALL_COMPLIANCE');
    expect(missingError).toBeDefined();
  });

  test('should validate emoji indicators', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const invalidEmoji = `**Overall Compliance**:
- ✓ Compliant: 42/57 (74%)
- ✗ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)
`;

    const document = `# Compliance Contract: Test
${VALID_TABLE}
${invalidEmoji}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const emojiErrors = result.errors.filter(e => e.errorId === 'INVALID_EMOJI_INDICATOR');
    expect(emojiErrors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Tests: Completeness Validation
// ============================================================================

describe('CompletenessValidation', () => {
  test('should pass validation when all required sections present', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test

## Document Control

**Status**: Draft

${VALID_TABLE}
${VALID_OVERALL_COMPLIANCE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const completenessErrors = result.errors.filter(e =>
      e.validationArea === 'Template Completeness'
    );
    expect(completenessErrors.length).toBe(0);
  });

  test('should fail validation for missing required section', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    const missingSection = result.errors.find(e =>
      e.errorId === 'MISSING_REQUIRED_SECTION' &&
      e.expected.includes('document_control')
    );
    expect(missingSection).toBeDefined();
  });
});

// ============================================================================
// Tests: Contract Type Mismatch
// ============================================================================

describe('ContractTypeMismatch', () => {
  test('should throw error when contract type does not match rules', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}`;

    await expect(
      validator.validateDocument(document, 'cloud_architecture')
    ).rejects.toThrow(/Contract type mismatch/);
  });
});

// ============================================================================
// Tests: Integration
// ============================================================================

describe('IntegrationTests', () => {
  test('should return validation result with correct structure', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    const document = `# Compliance Contract: Test
${VALID_TABLE}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('validationSummary');
    expect(result.validationSummary).toHaveProperty('totalChecks');
    expect(result.validationSummary).toHaveProperty('passed');
    expect(result.validationSummary).toHaveProperty('failed');
    expect(result.validationSummary).toHaveProperty('warnings');
  });

  test('should collect multiple errors without failing fast', async () => {
    const rulesPath = createTestRules();
    const validator = new ComplianceValidator(rulesPath);

    // Document with multiple errors
    const document = `# Compliance Contract: Test
${INVALID_5COLUMN_TABLE}
${INVALID_SUM_COMPLIANCE}
${MISSING_A2_APPENDIX}`;

    const result = await validator.validateDocument(document, 'sre_architecture');

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);

    // Should have errors from different validation areas
    const validationAreas = new Set(result.errors.map(e => e.validationArea));
    expect(validationAreas.size).toBeGreaterThan(1);
  });
});
