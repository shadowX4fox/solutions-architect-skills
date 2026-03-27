/**
 * Generation Helper Unit Tests
 *
 * Tests the high-level validation API and contract-type utilities.
 *
 * Note: validateGeneratedContract requires a real validation rules file
 * on disk (it calls ComplianceValidator which reads JSON rules). These
 * tests use the actual sre_architecture rules file that ships with the
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
    expect(getContractDisplayName('sre_architecture')).toBe('SRE Architecture');
    expect(getContractDisplayName('cloud_architecture')).toBe('Cloud Architecture');
    expect(getContractDisplayName('business_continuity')).toBe('Business Continuity');
    expect(getContractDisplayName('data_ai_architecture')).toBe('Data & AI Architecture');
    expect(getContractDisplayName('development_architecture')).toBe('Development Architecture');
    expect(getContractDisplayName('process_transformation')).toBe('Process Transformation');
    expect(getContractDisplayName('security_architecture')).toBe('Security Architecture');
    expect(getContractDisplayName('platform_it_infrastructure')).toBe('Platform IT Infrastructure');
    expect(getContractDisplayName('enterprise_architecture')).toBe('Enterprise Architecture');
    expect(getContractDisplayName('integration_architecture')).toBe('Integration Architecture');
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
    expect(types).toContain('sre_architecture');
    expect(types).toContain('cloud_architecture');
    expect(types).toContain('security_architecture');
    expect(types).toContain('business_continuity');
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
    const path = getValidationRulesPath('sre_architecture');
    expect(path).toContain('sre_architecture');
    expect(path).toEndWith('.json');
  });

  test('throws for unknown contract type', () => {
    expect(() => getValidationRulesPath('invalid_type')).toThrow('Unknown contract type');
  });
});

// ============================================================================
// getLocalDateString (re-exported via generation-helper)
// ============================================================================

describe('getLocalDateString (via date-utils)', () => {
  test('returns YYYY-MM-DD format', () => {
    const date = getLocalDateString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
