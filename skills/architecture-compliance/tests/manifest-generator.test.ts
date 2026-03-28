/**
 * Manifest Generator Unit Tests
 *
 * Tests manifest content generation, contract merging, summary calculation,
 * and existing manifest parsing.
 *
 * @module manifest-generator.test
 */

import { describe, test, expect } from 'bun:test';
import {
  generateManifestContent,
  type ContractMetadata,
  type ManifestData,
} from '../utils/manifest-generator';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeContract(overrides: Partial<ContractMetadata> = {}): ContractMetadata {
  return {
    contractType: 'SRE Architecture',
    filename: 'CC-010-sre-architecture_Project_2026-01-01.md',
    score: 8.5,
    status: 'Approved',
    completeness: 85,
    generatedDate: '2026-01-01',
    ...overrides,
  };
}

function makeManifest(contracts: ContractMetadata[]): ManifestData {
  return {
    projectName: 'Test Project',
    sourceFile: 'ARCHITECTURE.md',
    generationDate: '2026-01-01',
    contracts,
  };
}

// ============================================================================
// generateManifestContent — structure
// ============================================================================

describe('generateManifestContent — structure', () => {
  test('contains project name in output', () => {
    const result = generateManifestContent(makeManifest([makeContract()]));
    expect(result).toContain('Test Project');
  });

  test('contains source file reference', () => {
    const result = generateManifestContent(makeManifest([makeContract()]));
    expect(result).toContain('ARCHITECTURE.md');
  });

  test('contains Generated Documents table header', () => {
    const result = generateManifestContent(makeManifest([makeContract()]));
    expect(result).toContain('## Generated Documents');
    expect(result).toContain('Contract Type');
    expect(result).toContain('Filename');
    expect(result).toContain('Score');
    expect(result).toContain('Status');
  });

  test('contains contract row with correct data', () => {
    const result = generateManifestContent(makeManifest([makeContract()]));
    expect(result).toContain('SRE Architecture');
    expect(result).toContain('CC-010-sre-architecture_Project_2026-01-01.md');
    expect(result).toContain('8.5');
    expect(result).toContain('Approved');
    expect(result).toContain('85%');
  });

  test('contains Compliance Framework Reference section', () => {
    const result = generateManifestContent(makeManifest([makeContract()]));
    expect(result).toContain('## Compliance Framework Reference');
  });
});

// ============================================================================
// generateManifestContent — summary statistics
// ============================================================================

describe('generateManifestContent — summary statistics', () => {
  test('calculates average score correctly', () => {
    const contracts = [
      makeContract({ score: 8.0, status: 'Approved' }),
      makeContract({ contractType: 'Cloud Architecture', score: 6.0, status: 'Draft' }),
    ];
    const result = generateManifestContent(makeManifest(contracts));
    // Average should be 7.0
    expect(result).toContain('7.0');
  });

  test('counts status breakdown correctly', () => {
    const contracts = [
      makeContract({ status: 'Approved' }),
      makeContract({ contractType: 'Cloud Architecture', status: 'In Review' }),
      makeContract({ contractType: 'Security Architecture', status: 'Draft' }),
    ];
    const result = generateManifestContent(makeManifest(contracts));
    expect(result).toContain('Approved');
    expect(result).toContain('In Review');
    expect(result).toContain('Draft');
  });

  test('handles single contract correctly', () => {
    const result = generateManifestContent(makeManifest([makeContract({ score: 9.2, completeness: 92 })]));
    expect(result).toContain('9.2');
    expect(result).toContain('92%');
  });

  test('handles multiple contracts with different statuses', () => {
    const contracts = [
      makeContract({ status: 'Approved' }),
      makeContract({ contractType: 'Cloud', status: 'Approved' }),
      makeContract({ contractType: 'Security', status: 'Rejected' }),
    ];
    const result = generateManifestContent(makeManifest(contracts));
    expect(result).toContain('Rejected');
  });
});

// ============================================================================
// generateManifestContent — completeness display
// ============================================================================

describe('generateManifestContent — completeness', () => {
  test('shows completeness with % suffix', () => {
    const result = generateManifestContent(makeManifest([makeContract({ completeness: 73 })]));
    expect(result).toContain('73%');
  });

  test('handles 100% completeness', () => {
    const result = generateManifestContent(makeManifest([makeContract({ completeness: 100 })]));
    expect(result).toContain('100%');
  });

  test('handles 0% completeness', () => {
    const result = generateManifestContent(makeManifest([makeContract({ completeness: 0, score: 0, status: 'Rejected' })]));
    expect(result).toContain('0%');
  });
});

// ============================================================================
// generateManifestContent — multiple contracts
// ============================================================================

describe('generateManifestContent — multiple contracts', () => {
  test('all 10 contract types produce non-empty output', () => {
    const contractTypes = [
      'Business Continuity',
      'SRE Architecture',
      'Cloud Architecture',
      'Data & AI Architecture',
      'Development Architecture',
      'Process Transformation',
      'Security Architecture',
      'Platform IT Infrastructure',
      'Enterprise Architecture',
      'Integration Architecture',
    ];

    const contracts = contractTypes.map((ct, i) =>
      makeContract({
        contractType: ct,
        filename: `${ct.toUpperCase().replace(/ /g, '_')}_2026-01-01.md`,
        score: 7.0 + i * 0.1,
        completeness: 70 + i,
      })
    );

    const result = generateManifestContent(makeManifest(contracts));
    for (const ct of contractTypes) {
      expect(result).toContain(ct);
    }
  });

  test('generation date appears in manifest', () => {
    const result = generateManifestContent(makeManifest([makeContract()]));
    expect(result).toContain('2026-01-01');
  });
});
