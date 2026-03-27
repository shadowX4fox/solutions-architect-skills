/**
 * Field Updater Unit Tests
 *
 * Tests contract markdown field replacement logic for:
 * - Document Control placeholder fields
 * - Overall Compliance footer counts
 * - Section A.3.2 remediation estimates
 *
 * @module field-updater.test
 */

import { describe, test, expect } from 'bun:test';
import {
  updateContractWithValidation,
  updateDocumentControlFields,
  updateComplianceFooter,
  updateRemediationSection,
} from '../utils/field-updater';
import type { ValidationScore } from '../utils/score-calculator';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeScore(overrides: Partial<ValidationScore> = {}): ValidationScore {
  return {
    final_score: 8.5,
    completeness_score: 9.0,
    compliance_score: 8.2,
    quality_score: 8.8,
    status_counts: {
      Compliant: 8,
      'Non-Compliant': 1,
      'Not Applicable': 1,
      Unknown: 0,
    },
    outcome: {
      overall_status: 'PASS',
      document_status: 'Approved',
      action: 'AUTO_APPROVE',
      review_actor: 'System (Auto-Approved)',
    },
    validation_date: '2026-03-26',
    ...overrides,
  };
}

const DOC_CONTROL_TEMPLATE = `# Contract

| Field | Value |
|-------|-------|
| Validation Score | [VALIDATION_SCORE]/10 |
| Validation Status | [VALIDATION_STATUS] |
| Validation Date | [VALIDATION_DATE] |
| Status | [DOCUMENT_STATUS] |
| Review Actor | [REVIEW_ACTOR] |
`;

const COMPLIANCE_FOOTER_TEMPLATE = `## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| R01 | Req | Cat | Compliant | docs/01.md | Team |

**Overall Compliance**:
- ✅ Compliant: 0/0 (0%)
- ❌ Non-Compliant: 0/0 (0%)
- ⊘ Not Applicable: 0/0 (0%)
- ❓ Unknown: 0/0 (0%)
`;

const REMEDIATION_TEMPLATE = `#### A.3.2 Achieving Auto-Approve Status

Current Status: 5 Compliant, 3 Unknown, 2 Not Applicable
**Estimated Final Score After Remediation**: 6.0-8.0/10 (AUTO_APPROVE)
`;

// ============================================================================
// updateDocumentControlFields
// ============================================================================

describe('updateDocumentControlFields', () => {
  test('replaces all placeholder tokens', () => {
    const score = makeScore();
    // Access via updateContractWithValidation (which calls updateDocumentControlFields)
    // but we also export it directly
    const updated = updateDocumentControlFields(DOC_CONTROL_TEMPLATE, score);
    expect(updated).toContain('8.5/10');
    expect(updated).toContain('PASS');
    expect(updated).toContain('2026-03-26');
    expect(updated).toContain('Approved');
    expect(updated).toContain('System (Auto-Approved)');
  });

  test('does not leave any [PLACEHOLDER] tokens behind', () => {
    const score = makeScore();
    const updated = updateDocumentControlFields(DOC_CONTROL_TEMPLATE, score);
    expect(updated).not.toContain('[VALIDATION_SCORE]');
    expect(updated).not.toContain('[VALIDATION_STATUS]');
    expect(updated).not.toContain('[VALIDATION_DATE]');
    expect(updated).not.toContain('[DOCUMENT_STATUS]');
    expect(updated).not.toContain('[REVIEW_ACTOR]');
  });

  test('handles special characters in review actor', () => {
    const score = makeScore({
      outcome: {
        overall_status: 'PASS',
        document_status: 'In Review',
        action: 'MANUAL_REVIEW',
        review_actor: 'Architecture & Governance Board',
      },
    });
    const updated = updateDocumentControlFields(DOC_CONTROL_TEMPLATE, score);
    expect(updated).toContain('Architecture & Governance Board');
  });

  test('content without placeholders passes through unchanged', () => {
    const score = makeScore();
    const noop = '# Plain content\nNo placeholders here.';
    const updated = updateDocumentControlFields(noop, score);
    expect(updated).toBe(noop);
  });
});

// ============================================================================
// updateComplianceFooter
// ============================================================================

describe('updateComplianceFooter', () => {
  test('updates footer with correct counts and percentages', () => {
    const score = makeScore({
      status_counts: {
        Compliant: 8,
        'Non-Compliant': 1,
        'Not Applicable': 1,
        Unknown: 0,
      },
    });
    const updated = updateComplianceFooter(COMPLIANCE_FOOTER_TEMPLATE, score);
    expect(updated).toContain('Compliant: 8/10');
    expect(updated).toContain('Non-Compliant: 1/10');
    expect(updated).toContain('Not Applicable: 1/10');
    expect(updated).toContain('Unknown: 0/10');
  });

  test('calculates percentages correctly', () => {
    const score = makeScore({
      status_counts: {
        Compliant: 5,
        'Non-Compliant': 5,
        'Not Applicable': 0,
        Unknown: 0,
      },
    });
    const updated = updateComplianceFooter(COMPLIANCE_FOOTER_TEMPLATE, score);
    expect(updated).toContain('50%');
  });

  test('graceful degradation when total is 0', () => {
    const score = makeScore({
      status_counts: { Compliant: 0, 'Non-Compliant': 0, 'Not Applicable': 0, Unknown: 0 },
    });
    const updated = updateComplianceFooter(COMPLIANCE_FOOTER_TEMPLATE, score);
    // Should return content unchanged (no division by zero)
    expect(updated).toBe(COMPLIANCE_FOOTER_TEMPLATE);
  });

  test('graceful degradation when footer section is missing', () => {
    const score = makeScore();
    const noFooter = '# Contract\nNo overall compliance section.';
    const updated = updateComplianceFooter(noFooter, score);
    expect(updated).toBe(noFooter);
  });
});

// ============================================================================
// updateRemediationSection
// ============================================================================

describe('updateRemediationSection', () => {
  test('updates Current Status line with actual counts', () => {
    const score = makeScore({
      status_counts: {
        Compliant: 7,
        'Non-Compliant': 1,
        'Not Applicable': 2,
        Unknown: 0,
      },
    });
    const updated = updateRemediationSection(REMEDIATION_TEMPLATE, score);
    expect(updated).toContain('7 Compliant');
    expect(updated).toContain('0 Unknown');
    expect(updated).toContain('2 Not Applicable');
  });

  test('graceful degradation when A.3.2 section is missing', () => {
    const score = makeScore();
    const noSection = '# Contract\nNo remediation section.';
    const updated = updateRemediationSection(noSection, score);
    expect(updated).toBe(noSection);
  });
});

// ============================================================================
// updateContractWithValidation (integration)
// ============================================================================

describe('updateContractWithValidation', () => {
  test('applies all three updates in sequence', () => {
    const fullTemplate = DOC_CONTROL_TEMPLATE + '\n' + COMPLIANCE_FOOTER_TEMPLATE + '\n' + REMEDIATION_TEMPLATE;
    const score = makeScore({
      status_counts: {
        Compliant: 7,
        'Non-Compliant': 1,
        'Not Applicable': 1,
        Unknown: 1,
      },
    });
    const updated = updateContractWithValidation(fullTemplate, score);
    // Doc control
    expect(updated).toContain('8.5/10');
    expect(updated).not.toContain('[VALIDATION_SCORE]');
    // Footer
    expect(updated).toContain('Compliant: 7/10');
    // Remediation
    expect(updated).toContain('7 Compliant');
  });
});
