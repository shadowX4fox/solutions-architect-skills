/**
 * Score Calculator Unit Tests
 *
 * Tests score calculation logic independently of filesystem by using
 * the exported pure functions directly.
 *
 * @module score-calculator.test
 */

import { describe, test, expect } from 'bun:test';
import {
  parseComplianceSummaryTable,
  calculateCompletenessScore,
  calculateComplianceScoreValue,
  calculateQualityScore,
  determineOutcome,
  parseTableRow,
  normalizeStatus,
  type ComplianceTableData,
  type ValidationConfig,
} from '../utils/score-calculator';
import { getLocalDateString } from '../utils/date-utils';

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_CONFIG: ValidationConfig = {
  template_name: 'Test Contract',
  template_id: 'test',
  approval_authority: 'Architecture Board',
  scoring: {
    scale: 10,
    thresholds: {
      auto_approve: 8.0,
      ready_for_review: 7.0,
      needs_work: 5.0,
      reject: 0,
    },
    weights: {
      completeness: 0.4,
      compliance: 0.5,
      quality: 0.1,
    },
    status_codes: {
      PASS: 10,
      FAIL: 0,
      'N/A': 10,
      UNKNOWN: 0,
      EXCEPTION: 5,
    },
  },
};

function makeTable(rows: string[]): string {
  const header = `## Compliance Summary\n\n| Code | Requirement | Category | Status | Source Section | Responsible Role |\n|------|-------------|----------|--------|----------------|------------------|\n`;
  return header + rows.join('\n') + '\n';
}

function makeReq(code: string, status: string, source = 'docs/01-overview.md'): string {
  return `| ${code} | Requirement ${code} | Category | ${status} | ${source} | Team |`;
}

// ============================================================================
// parseTableRow
// ============================================================================

describe('parseTableRow', () => {
  test('splits 6-column row into array of 6 trimmed strings', () => {
    const row = '| A1 | Req | Cat | Compliant | docs/01.md | Team |';
    const result = parseTableRow(row);
    expect(result).toEqual(['A1', 'Req', 'Cat', 'Compliant', 'docs/01.md', 'Team']);
  });

  test('trims whitespace from each column', () => {
    const row = '|  A1  |  Req  |  Cat  |  Compliant  |  docs/01.md  |  Team  |';
    const result = parseTableRow(row);
    expect(result[0]).toBe('A1');
    expect(result[3]).toBe('Compliant');
  });
});

// ============================================================================
// normalizeStatus
// ============================================================================

describe('normalizeStatus', () => {
  test('returns exact canonical values unchanged', () => {
    expect(normalizeStatus('Compliant')).toBe('Compliant');
    expect(normalizeStatus('Non-Compliant')).toBe('Non-Compliant');
    expect(normalizeStatus('Not Applicable')).toBe('Not Applicable');
    expect(normalizeStatus('Unknown')).toBe('Unknown');
  });

  test('normalizes case variations', () => {
    expect(normalizeStatus('compliant')).toBe('Compliant');
    expect(normalizeStatus('COMPLIANT')).toBe('Compliant');
    expect(normalizeStatus('non-compliant')).toBe('Non-Compliant');
    expect(normalizeStatus('noncompliant')).toBe('Non-Compliant');
    expect(normalizeStatus('not applicable')).toBe('Not Applicable');
    expect(normalizeStatus('n/a')).toBe('Not Applicable');
    expect(normalizeStatus('unknown')).toBe('Unknown');
  });

  test('returns unrecognized values as-is', () => {
    expect(normalizeStatus('Pending')).toBe('Pending');
  });
});

// ============================================================================
// parseComplianceSummaryTable
// ============================================================================

describe('parseComplianceSummaryTable', () => {
  test('parses table with mixed statuses correctly', () => {
    const content = makeTable([
      makeReq('R01', 'Compliant'),
      makeReq('R02', 'Non-Compliant', 'Not documented'),
      makeReq('R03', 'Unknown', 'N/A'),
      makeReq('R04', 'Not Applicable'),
    ]);
    const result = parseComplianceSummaryTable(content);
    expect(result.totalRequirements).toBe(4);
    expect(result.statusCounts.Compliant).toBe(1);
    expect(result.statusCounts['Non-Compliant']).toBe(1);
    expect(result.statusCounts.Unknown).toBe(1);
    expect(result.statusCounts['Not Applicable']).toBe(1);
  });

  test('all Compliant — perfect table', () => {
    const content = makeTable([
      makeReq('R01', 'Compliant'),
      makeReq('R02', 'Compliant'),
    ]);
    const result = parseComplianceSummaryTable(content);
    expect(result.statusCounts.Compliant).toBe(2);
    expect(result.totalRequirements).toBe(2);
  });

  test('hasSource false when sourceSection is empty or Not documented', () => {
    const content = makeTable([
      makeReq('R01', 'Compliant', 'Not documented'),
      makeReq('R02', 'Compliant', 'N/A'),
      makeReq('R03', 'Compliant', ''),
      makeReq('R04', 'Compliant', 'docs/01.md'),
    ]);
    const result = parseComplianceSummaryTable(content);
    expect(result.requirements[0].hasSource).toBe(false);
    expect(result.requirements[1].hasSource).toBe(false);
    expect(result.requirements[2].hasSource).toBe(false);
    expect(result.requirements[3].hasSource).toBe(true);
  });

  test('throws when Compliance Summary section is missing', () => {
    expect(() => parseComplianceSummaryTable('# Contract\nNo table here.')).toThrow(
      'Compliance Summary section not found'
    );
  });

  test('throws when table has only header row and no data', () => {
    const content = `## Compliance Summary\n\n| Code | Requirement | Category | Status | Source Section | Responsible Role |\n|------|-------------|----------|--------|----------------|------------------|\n`;
    expect(() => parseComplianceSummaryTable(content)).toThrow('insufficient rows');
  });
});

// ============================================================================
// calculateCompletenessScore
// ============================================================================

describe('calculateCompletenessScore', () => {
  test('all non-Unknown → score 10.0', () => {
    const table: ComplianceTableData = {
      requirements: [
        { code: 'R1', requirement: '', category: '', status: 'Compliant', sourceSection: 'docs/', role: '', hasSource: true },
        { code: 'R2', requirement: '', category: '', status: 'Non-Compliant', sourceSection: 'docs/', role: '', hasSource: true },
      ],
      statusCounts: { Compliant: 1, 'Non-Compliant': 1, 'Not Applicable': 0, Unknown: 0 },
      totalRequirements: 2,
    };
    expect(calculateCompletenessScore(table, MOCK_CONFIG)).toBe(10);
  });

  test('all Unknown → score 0', () => {
    const table: ComplianceTableData = {
      requirements: [
        { code: 'R1', requirement: '', category: '', status: 'Unknown', sourceSection: '', role: '', hasSource: false },
      ],
      statusCounts: { Compliant: 0, 'Non-Compliant': 0, 'Not Applicable': 0, Unknown: 1 },
      totalRequirements: 1,
    };
    expect(calculateCompletenessScore(table, MOCK_CONFIG)).toBe(0);
  });

  test('half Unknown → score 5.0', () => {
    const table: ComplianceTableData = {
      requirements: [
        { code: 'R1', requirement: '', category: '', status: 'Compliant', sourceSection: 'docs/', role: '', hasSource: true },
        { code: 'R2', requirement: '', category: '', status: 'Unknown', sourceSection: '', role: '', hasSource: false },
      ],
      statusCounts: { Compliant: 1, 'Non-Compliant': 0, 'Not Applicable': 0, Unknown: 1 },
      totalRequirements: 2,
    };
    expect(calculateCompletenessScore(table, MOCK_CONFIG)).toBe(5);
  });

  test('empty table → score 0', () => {
    const table: ComplianceTableData = {
      requirements: [],
      statusCounts: { Compliant: 0, 'Non-Compliant': 0, 'Not Applicable': 0, Unknown: 0 },
      totalRequirements: 0,
    };
    expect(calculateCompletenessScore(table, MOCK_CONFIG)).toBe(0);
  });
});

// ============================================================================
// calculateComplianceScoreValue
// ============================================================================

describe('calculateComplianceScoreValue', () => {
  test('all Compliant → score 10.0', () => {
    const table: ComplianceTableData = {
      requirements: [],
      statusCounts: { Compliant: 4, 'Non-Compliant': 0, 'Not Applicable': 0, Unknown: 0 },
      totalRequirements: 4,
    };
    expect(calculateComplianceScoreValue(table, MOCK_CONFIG)).toBe(10);
  });

  test('all Non-Compliant → score 0', () => {
    const table: ComplianceTableData = {
      requirements: [],
      statusCounts: { Compliant: 0, 'Non-Compliant': 4, 'Not Applicable': 0, Unknown: 0 },
      totalRequirements: 4,
    };
    expect(calculateComplianceScoreValue(table, MOCK_CONFIG)).toBe(0);
  });

  test('Not Applicable counts as passing', () => {
    const table: ComplianceTableData = {
      requirements: [],
      statusCounts: { Compliant: 2, 'Non-Compliant': 0, 'Not Applicable': 2, Unknown: 0 },
      totalRequirements: 4,
    };
    expect(calculateComplianceScoreValue(table, MOCK_CONFIG)).toBe(10);
  });

  test('mixed statuses → proportional score', () => {
    const table: ComplianceTableData = {
      requirements: [],
      statusCounts: { Compliant: 2, 'Non-Compliant': 2, 'Not Applicable': 0, Unknown: 0 },
      totalRequirements: 4,
    };
    expect(calculateComplianceScoreValue(table, MOCK_CONFIG)).toBe(5);
  });
});

// ============================================================================
// determineOutcome
// ============================================================================

describe('determineOutcome', () => {
  test('score >= 8.0 → AUTO_APPROVE', () => {
    const outcome = determineOutcome(8.0, MOCK_CONFIG);
    expect(outcome.action).toBe('AUTO_APPROVE');
    expect(outcome.overall_status).toBe('PASS');
    expect(outcome.document_status).toBe('Approved');
  });

  test('score 7.99 → MANUAL_REVIEW (just below auto-approve threshold)', () => {
    const outcome = determineOutcome(7.99, MOCK_CONFIG);
    expect(outcome.action).toBe('MANUAL_REVIEW');
    expect(outcome.overall_status).toBe('PASS');
  });

  test('score 7.0 → MANUAL_REVIEW', () => {
    const outcome = determineOutcome(7.0, MOCK_CONFIG);
    expect(outcome.action).toBe('MANUAL_REVIEW');
    expect(outcome.review_actor).toBe('Architecture Board');
  });

  test('score 5.0 → NEEDS_WORK', () => {
    const outcome = determineOutcome(5.0, MOCK_CONFIG);
    expect(outcome.action).toBe('NEEDS_WORK');
    expect(outcome.overall_status).toBe('CONDITIONAL');
    expect(outcome.document_status).toBe('Draft');
  });

  test('score below 5.0 → REJECT', () => {
    const outcome = determineOutcome(4.9, MOCK_CONFIG);
    expect(outcome.action).toBe('REJECT');
    expect(outcome.overall_status).toBe('FAIL');
    expect(outcome.document_status).toBe('Rejected');
  });

  test('score 10.0 → AUTO_APPROVE', () => {
    const outcome = determineOutcome(10.0, MOCK_CONFIG);
    expect(outcome.action).toBe('AUTO_APPROVE');
  });

  test('score 0.0 → REJECT', () => {
    const outcome = determineOutcome(0.0, MOCK_CONFIG);
    expect(outcome.action).toBe('REJECT');
  });
});

// ============================================================================
// getLocalDateString
// ============================================================================

describe('getLocalDateString', () => {
  test('returns YYYY-MM-DD format', () => {
    const date = getLocalDateString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('year is current year', () => {
    const date = getLocalDateString();
    const year = parseInt(date.split('-')[0]);
    expect(year).toBe(new Date().getFullYear());
  });
});
