/**
 * Error Reporter Unit Tests
 *
 * Tests formatted validation output for:
 * - Full error report generation
 * - Compact summary mode
 * - Markdown report mode
 * - Grouping by validation area
 *
 * @module error-reporter.test
 */

import { describe, test, expect } from 'bun:test';
import { ErrorReporter } from '../utils/error-reporter';
import type { ValidationResult, ValidationError } from '../utils/validators';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeError(overrides: Partial<ValidationError> = {}): ValidationError {
  return {
    errorId: 'ERR-TEST-001',
    validationArea: 'Compliance Summary Table',
    severity: 'BLOCKING',
    location: 'Section 2',
    lineNumber: 42,
    expected: 'Expected 6-column table header',
    found: 'Found 5-column header',
    fix: 'Add missing "Responsible Role" column',
    references: { skillMd: 'Phase 4', template: 'template_sre.md', shared: '' },
    ...overrides,
  };
}

function makeWarning(overrides: Partial<ValidationError> = {}): ValidationError {
  return makeError({
    severity: 'WARNING',
    validationArea: 'Source Documentation',
    lineNumber: undefined,
    location: 'Row R05',
    expected: 'Documented source section',
    found: 'Not documented',
    fix: 'Add source section reference',
    references: {},
    ...overrides,
  });
}

function makeResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    validationSummary: {
      totalChecks: 10,
      passed: 10,
      failed: 0,
      warnings: 0,
    },
    ...overrides,
  };
}

// ============================================================================
// generateCompactSummary
// ============================================================================

describe('generateCompactSummary', () => {
  test('valid with no warnings → simple pass message', () => {
    const result = makeResult();
    const summary = ErrorReporter.generateCompactSummary(result);
    expect(summary).toBe('✅ Validation passed');
  });

  test('valid with warnings → pass message with warning count', () => {
    const result = makeResult({ warnings: [makeWarning()] });
    const summary = ErrorReporter.generateCompactSummary(result);
    expect(summary).toContain('✅');
    expect(summary).toContain('1 warning');
  });

  test('invalid → fail message with blocking count', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError(), makeError({ severity: 'WARNING' })],
    });
    const summary = ErrorReporter.generateCompactSummary(result);
    expect(summary).toContain('❌');
    expect(summary).toContain('1 blocking error');
  });

  test('plural "errors" when multiple blocking', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError(), makeError()],
    });
    const summary = ErrorReporter.generateCompactSummary(result);
    expect(summary).toContain('2 blocking errors');
  });
});

// ============================================================================
// generateReport
// ============================================================================

describe('generateReport', () => {
  test('success report contains VALIDATION PASSED', () => {
    const result = makeResult();
    const report = ErrorReporter.generateReport(result, 'sre_architecture');
    expect(report).toContain('VALIDATION PASSED');
    expect(report).toContain('Sre Architecture');
  });

  test('error report contains error details', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError()],
      validationSummary: { totalChecks: 10, passed: 9, failed: 1, warnings: 0 },
    });
    const report = ErrorReporter.generateReport(result, 'cloud_architecture');
    expect(report).toContain('VALIDATION FAILED');
    expect(report).toContain('BLOCKING ERRORS');
    expect(report).toContain('Line 42');
    expect(report).toContain('Add missing "Responsible Role" column');
  });

  test('warning section appears when result has warnings', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError()],
      warnings: [makeWarning()],
      validationSummary: { totalChecks: 10, passed: 9, failed: 1, warnings: 1 },
    });
    const report = ErrorReporter.generateReport(result, 'sre_architecture');
    expect(report).toContain('WARNINGS');
  });

  test('report includes SKILL.md reference when provided', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError({ references: { skillMd: 'Phase 4.6', template: '', shared: '' } })],
      validationSummary: { totalChecks: 1, passed: 0, failed: 1, warnings: 0 },
    });
    const report = ErrorReporter.generateReport(result, 'sre_architecture');
    expect(report).toContain('SKILL.md Phase 4.6');
  });

  test('summary shows correct check counts', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError()],
      validationSummary: { totalChecks: 15, passed: 14, failed: 1, warnings: 0 },
    });
    const report = ErrorReporter.generateReport(result, 'sre_architecture');
    expect(report).toContain('Total: 15');
    expect(report).toContain('Passed: 14');
    expect(report).toContain('Failed: 1');
  });
});

// ============================================================================
// generateMarkdownReport
// ============================================================================

describe('generateMarkdownReport', () => {
  test('valid result produces markdown heading with checkmark', () => {
    const result = makeResult();
    const md = ErrorReporter.generateMarkdownReport(result, 'sre_architecture');
    expect(md).toContain('# ✅ Validation Passed');
    expect(md).toContain('## Validation Summary');
  });

  test('failed result produces markdown heading with X', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError()],
      validationSummary: { totalChecks: 5, passed: 4, failed: 1, warnings: 0 },
    });
    const md = ErrorReporter.generateMarkdownReport(result, 'sre_architecture');
    expect(md).toContain('# ❌ Validation Failed');
  });

  test('markdown report includes error details in code blocks', () => {
    const result = makeResult({
      isValid: false,
      errors: [makeError()],
      validationSummary: { totalChecks: 5, passed: 4, failed: 1, warnings: 0 },
    });
    const md = ErrorReporter.generateMarkdownReport(result, 'sre_architecture');
    expect(md).toContain('**Expected**');
    expect(md).toContain('**Found**');
    expect(md).toContain('**Fix**');
    expect(md).toContain('```');
  });

  test('markdown report has warnings section when warnings exist', () => {
    const result = makeResult({
      isValid: true,
      warnings: [makeWarning()],
      validationSummary: { totalChecks: 10, passed: 10, failed: 0, warnings: 1 },
    });
    const md = ErrorReporter.generateMarkdownReport(result, 'sre_architecture');
    expect(md).toContain('## Warnings');
  });
});

// ============================================================================
// groupErrorsByArea
// ============================================================================

describe('groupErrorsByArea', () => {
  test('groups errors by validationArea', () => {
    const errors: ValidationError[] = [
      makeError({ validationArea: 'Table Structure' }),
      makeError({ validationArea: 'Table Structure' }),
      makeError({ validationArea: 'Appendix A' }),
    ];
    const grouped = ErrorReporter.groupErrorsByArea(errors);
    expect(grouped.size).toBe(2);
    expect(grouped.get('Table Structure')?.length).toBe(2);
    expect(grouped.get('Appendix A')?.length).toBe(1);
  });

  test('empty array returns empty map', () => {
    const grouped = ErrorReporter.groupErrorsByArea([]);
    expect(grouped.size).toBe(0);
  });
});
