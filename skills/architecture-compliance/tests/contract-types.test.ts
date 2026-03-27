/**
 * Contract Types Registry Unit Tests
 *
 * Tests the single source of truth for all 10 contract type mappings:
 * display names, template validation files, scoring validation files,
 * and filename prefix mapping.
 *
 * @module contract-types.test
 */

import { describe, test, expect } from 'bun:test';
import {
  CONTRACT_TYPES,
  CONTRACT_DISPLAY_NAMES,
  TEMPLATE_VALIDATION_FILES,
  SCORING_VALIDATION_FILES,
  FILENAME_PREFIX_TO_CONTRACT_TYPE,
  getContractDisplayName,
  getSupportedContractTypes,
  getTemplateValidationFile,
  getScoringValidationFile,
} from '../utils/contract-types';

const EXPECTED_TYPES = [
  'business_continuity',
  'sre_architecture',
  'cloud_architecture',
  'data_ai_architecture',
  'development_architecture',
  'process_transformation',
  'security_architecture',
  'platform_it_infrastructure',
  'enterprise_architecture',
  'integration_architecture',
] as const;

// ============================================================================
// CONTRACT_TYPES constant
// ============================================================================

describe('CONTRACT_TYPES', () => {
  test('contains exactly 10 contract types', () => {
    expect(CONTRACT_TYPES.length).toBe(10);
  });

  test('contains all expected type identifiers', () => {
    for (const t of EXPECTED_TYPES) {
      expect(CONTRACT_TYPES).toContain(t);
    }
  });

  test('has no duplicate entries', () => {
    const unique = new Set(CONTRACT_TYPES);
    expect(unique.size).toBe(CONTRACT_TYPES.length);
  });
});

// ============================================================================
// CONTRACT_DISPLAY_NAMES
// ============================================================================

describe('CONTRACT_DISPLAY_NAMES', () => {
  test('has entry for every contract type', () => {
    for (const t of EXPECTED_TYPES) {
      expect(CONTRACT_DISPLAY_NAMES[t]).toBeDefined();
      expect(typeof CONTRACT_DISPLAY_NAMES[t]).toBe('string');
      expect(CONTRACT_DISPLAY_NAMES[t].length).toBeGreaterThan(0);
    }
  });

  test('display names are human-readable (no underscores)', () => {
    for (const name of Object.values(CONTRACT_DISPLAY_NAMES)) {
      expect(name).not.toContain('_');
    }
  });

  test('known display names are correct', () => {
    expect(CONTRACT_DISPLAY_NAMES['sre_architecture']).toBe('SRE Architecture');
    expect(CONTRACT_DISPLAY_NAMES['business_continuity']).toBe('Business Continuity');
    expect(CONTRACT_DISPLAY_NAMES['data_ai_architecture']).toBe('Data & AI Architecture');
  });
});

// ============================================================================
// TEMPLATE_VALIDATION_FILES
// ============================================================================

describe('TEMPLATE_VALIDATION_FILES', () => {
  test('has entry for every contract type', () => {
    for (const t of EXPECTED_TYPES) {
      expect(TEMPLATE_VALIDATION_FILES[t]).toBeDefined();
    }
  });

  test('all paths start with validation/', () => {
    for (const path of Object.values(TEMPLATE_VALIDATION_FILES)) {
      expect(path).toMatch(/^validation\//);
    }
  });

  test('all filenames follow template_validation_*.json pattern', () => {
    for (const path of Object.values(TEMPLATE_VALIDATION_FILES)) {
      expect(path).toMatch(/template_validation_.+\.json$/);
    }
  });

  test('no two types share the same validation file', () => {
    const paths = Object.values(TEMPLATE_VALIDATION_FILES);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });
});

// ============================================================================
// SCORING_VALIDATION_FILES
// ============================================================================

describe('SCORING_VALIDATION_FILES', () => {
  test('has entry for every contract type', () => {
    for (const t of EXPECTED_TYPES) {
      expect(SCORING_VALIDATION_FILES[t]).toBeDefined();
    }
  });

  test('all paths start with validation/', () => {
    for (const path of Object.values(SCORING_VALIDATION_FILES)) {
      expect(path).toMatch(/^validation\//);
    }
  });

  test('all filenames end with _validation.json', () => {
    for (const path of Object.values(SCORING_VALIDATION_FILES)) {
      expect(path).toMatch(/_validation\.json$/);
    }
  });

  test('no two types share the same scoring file', () => {
    const paths = Object.values(SCORING_VALIDATION_FILES);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  test('scoring files are distinct from template validation files', () => {
    for (const t of EXPECTED_TYPES) {
      expect(SCORING_VALIDATION_FILES[t]).not.toBe(TEMPLATE_VALIDATION_FILES[t]);
    }
  });
});

// ============================================================================
// FILENAME_PREFIX_TO_CONTRACT_TYPE
// ============================================================================

describe('FILENAME_PREFIX_TO_CONTRACT_TYPE', () => {
  test('has 10 entries (one per contract type)', () => {
    expect(Object.keys(FILENAME_PREFIX_TO_CONTRACT_TYPE).length).toBe(10);
  });

  test('all prefixes are SCREAMING_SNAKE_CASE', () => {
    for (const prefix of Object.keys(FILENAME_PREFIX_TO_CONTRACT_TYPE)) {
      expect(prefix).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });

  test('all values are valid contract types', () => {
    const types = getSupportedContractTypes(); // returns string[]
    for (const value of Object.values(FILENAME_PREFIX_TO_CONTRACT_TYPE)) {
      expect(types).toContain(value);
    }
  });

  test('maps known prefixes correctly', () => {
    expect(FILENAME_PREFIX_TO_CONTRACT_TYPE['SRE_ARCHITECTURE']).toBe('sre_architecture');
    expect(FILENAME_PREFIX_TO_CONTRACT_TYPE['BUSINESS_CONTINUITY']).toBe('business_continuity');
    expect(FILENAME_PREFIX_TO_CONTRACT_TYPE['DATA_AI_ARCHITECTURE']).toBe('data_ai_architecture');
    expect(FILENAME_PREFIX_TO_CONTRACT_TYPE['PLATFORM_IT_INFRASTRUCTURE']).toBe('platform_it_infrastructure');
  });

  test('no duplicate values (each type has exactly one prefix)', () => {
    const values = Object.values(FILENAME_PREFIX_TO_CONTRACT_TYPE);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ============================================================================
// getContractDisplayName
// ============================================================================

describe('getContractDisplayName', () => {
  test('returns display name for known type', () => {
    expect(getContractDisplayName('sre_architecture')).toBe('SRE Architecture');
  });

  test('returns raw string for unknown type (fallback)', () => {
    expect(getContractDisplayName('unknown_type')).toBe('unknown_type');
  });

  test('returns correct names for all 10 types', () => {
    for (const t of EXPECTED_TYPES) {
      const name = getContractDisplayName(t);
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toContain('_'); // display names have no underscores
    }
  });
});

// ============================================================================
// getSupportedContractTypes
// ============================================================================

describe('getSupportedContractTypes', () => {
  test('returns array of 10 types', () => {
    expect(getSupportedContractTypes().length).toBe(10);
  });

  test('returns a copy (not the original array)', () => {
    const a = getSupportedContractTypes();
    const b = getSupportedContractTypes();
    expect(a).not.toBe(b); // different references
    expect(a).toEqual(b);  // same content
  });
});

// ============================================================================
// getTemplateValidationFile
// ============================================================================

describe('getTemplateValidationFile', () => {
  test('returns file path for known type', () => {
    const path = getTemplateValidationFile('sre_architecture');
    expect(path).toContain('sre_architecture');
    expect(path).toMatch(/\.json$/);
  });

  test('throws for unknown type', () => {
    expect(() => getTemplateValidationFile('nonexistent_type')).toThrow();
  });

  test('error message includes the unknown type name', () => {
    expect(() => getTemplateValidationFile('bad_type')).toThrow('bad_type');
  });
});

// ============================================================================
// getScoringValidationFile
// ============================================================================

describe('getScoringValidationFile', () => {
  test('returns file path for known type', () => {
    const path = getScoringValidationFile('sre_architecture');
    expect(path).toContain('sre_architecture');
    expect(path).toMatch(/\.json$/);
  });

  test('throws for unknown type', () => {
    expect(() => getScoringValidationFile('nonexistent_type')).toThrow();
  });

  test('error message includes the unknown type name', () => {
    expect(() => getScoringValidationFile('bad_type')).toThrow('bad_type');
  });

  test('returns different file than getTemplateValidationFile for same type', () => {
    const scoring = getScoringValidationFile('sre_architecture');
    const template = getTemplateValidationFile('sre_architecture');
    expect(scoring).not.toBe(template);
  });
});
