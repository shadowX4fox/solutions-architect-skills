/**
 * Generation Helper Unit Tests
 *
 * Tests the high-level validation API and contract-type utilities.
 *
 * Note: validateGeneratedContract requires a real validation rules file
 * on disk (it calls ComplianceValidator which reads JSON rules). These
 * tests use the actual cc-010-sre-architecture rules file that ships with the
 * skill rather than mocking the filesystem.
 *
 * @module generation-helper.test
 */

import { describe, test, expect } from 'bun:test';
import {
  getContractDisplayName,
  getSupportedContractTypes,
  getValidationRulesPath,
} from '../utils/generation-helper';
import { getLocalDateString } from '../utils/date-utils';

// ============================================================================
// getContractDisplayName
// ============================================================================

describe('getContractDisplayName', () => {
  test('returns human-readable name for all supported types', () => {
    expect(getContractDisplayName('cc-010-sre-architecture')).toBe('SRE Architecture');
    expect(getContractDisplayName('cc-002-cloud-architecture')).toBe('Cloud Architecture');
    expect(getContractDisplayName('cc-001-business-continuity')).toBe('Business Continuity');
    expect(getContractDisplayName('cc-003-data-ai-architecture')).toBe('Data & AI Architecture');
    expect(getContractDisplayName('cc-004-development-architecture')).toBe('Development Architecture');
    expect(getContractDisplayName('cc-008-process-transformation')).toBe('Process Transformation');
    expect(getContractDisplayName('cc-009-security-architecture')).toBe('Security Architecture');
    expect(getContractDisplayName('cc-007-platform-it-infrastructure')).toBe('Platform IT Infrastructure');
    expect(getContractDisplayName('cc-005-enterprise-architecture')).toBe('Enterprise Architecture');
    expect(getContractDisplayName('cc-006-integration-architecture')).toBe('Integration Architecture');
  });

  test('returns raw string for unknown type', () => {
    expect(getContractDisplayName('unknown_type')).toBe('unknown_type');
  });
});

// ============================================================================
// getSupportedContractTypes
// ============================================================================

describe('getSupportedContractTypes', () => {
  test('returns array of all 10 contract types', () => {
    const types = getSupportedContractTypes();
    expect(types.length).toBe(10);
  });

  test('includes all expected types', () => {
    const types = getSupportedContractTypes();
    expect(types).toContain('cc-010-sre-architecture');
    expect(types).toContain('cc-002-cloud-architecture');
    expect(types).toContain('cc-009-security-architecture');
    expect(types).toContain('cc-001-business-continuity');
  });

  test('returns a new array each call (not mutating the source)', () => {
    const a = getSupportedContractTypes();
    const b = getSupportedContractTypes();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ============================================================================
// getValidationRulesPath
// ============================================================================

describe('getValidationRulesPath', () => {
  test('returns path ending in .json for known type', () => {
    const path = getValidationRulesPath('cc-010-sre-architecture');
    expect(path).toContain('cc-010-sre-architecture');
    expect(path).toEndWith('.json');
  });

  test('throws for unknown contract type', () => {
    expect(() => getValidationRulesPath('invalid_type')).toThrow('Unknown contract type');
  });
});

// ============================================================================
// getLocalDateString (re-exported via generation-helper)
// ============================================================================

describe('getLocalDateString', () => {
  test('returns YYYY-MM-DD format', () => {
    const date = getLocalDateString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
