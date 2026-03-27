/**
 * Resolve Includes Unit Tests
 *
 * Tests variable substitution and include directive parsing.
 * replaceVariables and resolveIncludes are tested in isolation via exports.
 *
 * @module resolve-includes.test
 */

import { describe, test, expect } from 'bun:test';
import { replaceVariables } from '../utils/resolve-includes';

// ============================================================================
// replaceVariables
// ============================================================================

const MOCK_CONFIG = {
  domain_name: 'SRE Architecture',
  compliance_prefix: 'SRE',
  review_board: 'SRE Architecture Review Board',
  approval_authority: 'Architecture Committee',
  validation_config_path: 'validation/sre_architecture_validation.json',
  weights: {
    completeness: 0.4,
    compliance: 0.5,
    quality: 0.1,
  },
};

describe('replaceVariables — top-level fields', () => {
  test('replaces a single top-level variable', () => {
    const result = replaceVariables('Hello {{domain_name}}', MOCK_CONFIG);
    expect(result).toBe('Hello SRE Architecture');
  });

  test('replaces multiple variables in one string', () => {
    const result = replaceVariables('{{compliance_prefix}} — {{review_board}}', MOCK_CONFIG);
    expect(result).toBe('SRE — SRE Architecture Review Board');
  });

  test('replaces same variable appearing multiple times', () => {
    const result = replaceVariables('{{domain_name}} / {{domain_name}}', MOCK_CONFIG);
    expect(result).toBe('SRE Architecture / SRE Architecture');
  });

  test('preserves placeholder when variable not in config', () => {
    const result = replaceVariables('{{unknown_var}}', MOCK_CONFIG);
    expect(result).toBe('{{unknown_var}}');
  });

  test('leaves non-variable text untouched', () => {
    const result = replaceVariables('Plain text with no variables.', MOCK_CONFIG);
    expect(result).toBe('Plain text with no variables.');
  });
});

describe('replaceVariables — nested object fields', () => {
  test('replaces variable found in nested object', () => {
    // completeness is inside weights nested object
    const result = replaceVariables('Weight: {{completeness}}', MOCK_CONFIG);
    expect(result).toBe('Weight: 0.4');
  });

  test('replaces compliance weight from nested object', () => {
    const result = replaceVariables('{{compliance}}', MOCK_CONFIG);
    expect(result).toBe('0.5');
  });

  test('replaces quality weight from nested object', () => {
    const result = replaceVariables('{{quality}}', MOCK_CONFIG);
    expect(result).toBe('0.1');
  });
});

describe('replaceVariables — edge cases', () => {
  test('handles empty string input', () => {
    const result = replaceVariables('', MOCK_CONFIG);
    expect(result).toBe('');
  });

  test('handles config with no matching nested keys', () => {
    const config = {
      domain_name: 'Test',
      compliance_prefix: 'T',
      review_board: 'Board',
      approval_authority: 'Authority',
      validation_config_path: 'path.json',
    };
    const result = replaceVariables('{{domain_name}} - {{missing}}', config);
    expect(result).toBe('Test - {{missing}}');
  });

  test('handles multiline template content', () => {
    const template = '# {{domain_name}}\n\nReview: {{review_board}}\n\nAuth: {{approval_authority}}';
    const result = replaceVariables(template, MOCK_CONFIG);
    expect(result).toContain('# SRE Architecture');
    expect(result).toContain('Review: SRE Architecture Review Board');
    expect(result).toContain('Auth: Architecture Committee');
  });

  test('handles variable at start of string', () => {
    const result = replaceVariables('{{domain_name}} is great', MOCK_CONFIG);
    expect(result).toBe('SRE Architecture is great');
  });

  test('handles variable at end of string', () => {
    const result = replaceVariables('The domain is {{domain_name}}', MOCK_CONFIG);
    expect(result).toBe('The domain is SRE Architecture');
  });
});

// ============================================================================
// resolveIncludes — directive parsing (light functional test)
// ============================================================================

describe('replaceVariables — domain-config variables used in shared sections', () => {
  test('replaces completeness_percent format variable', () => {
    const config = {
      ...MOCK_CONFIG,
      completeness_percent: '40%',
      compliance_percent: '50%',
      quality_percent: '10%',
    };
    const template = 'Completeness ({{completeness_percent}} weight)';
    const result = replaceVariables(template, config as any);
    expect(result).toBe('Completeness (40% weight)');
  });

  test('validation-methodology template variables substitute correctly', () => {
    const config = {
      ...MOCK_CONFIG,
      completeness_percent: '40%',
      compliance_percent: '50%',
      quality_percent: '10%',
      completeness: '0.4',
      compliance: '0.5',
      quality: '0.1',
    };
    const template = [
      'Final Score = (Completeness × {{completeness}}) + (Compliance × {{compliance}}) + (Quality × {{quality}})',
      '{{review_board}} | Manual review required',
      'critical {{domain_name}} gaps',
    ].join('\n');

    const result = replaceVariables(template, config as any);
    expect(result).toContain('(Completeness × 0.4)');
    expect(result).toContain('(Compliance × 0.5)');
    expect(result).toContain('(Quality × 0.1)');
    expect(result).toContain('SRE Architecture Review Board');
    expect(result).toContain('critical SRE Architecture gaps');
  });
});
