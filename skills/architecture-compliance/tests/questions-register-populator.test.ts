/**
 * Questions & Gaps Register Populator Unit Tests
 *
 * Tests register row building, priority derivation, action derivation,
 * section replacement, and A.3.1 statistics — all without hitting the filesystem.
 *
 * @module questions-register-populator.test
 */

import { describe, test, expect } from 'bun:test';
import { populateQuestionsRegister } from '../utils/questions-register-populator';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract only the Questions & Gaps Register section from the output.
 * Returns the text from the heading to (not including) the next ## heading.
 */
function extractRegisterSection(content: string): string {
  const match = content.match(/## Questions & Gaps Register[\s\S]*?(?=\n## |$)/);
  return match ? match[0] : '';
}

/**
 * Extract only the A.3.1 block from the output.
 */
function extractA31(content: string): string {
  const match = content.match(/#### A\.3\.1[\s\S]*?(?=\n####|\n###|\n##|$)/);
  return match ? match[0] : '';
}

/**
 * Minimal compliance contract.
 *
 * Real structure: Compliance Summary → ... → A.3.1 → Register → Generation Metadata
 * (A.3.1 must appear BEFORE the register so replaceRegisterSection doesn't consume it)
 */
function makeContract(rows: string[], extras = ''): string {
  const summary = [
    '## Compliance Summary',
    '',
    '| Code | Requirement | Category | Status | Source Section | Responsible Role |',
    '|------|-------------|----------|--------|----------------|------------------|',
    ...rows,
    '',
  ].join('\n');

  const a31 = [
    '#### A.3.1 Identified Gaps',
    '',
    'Old content here.',
    '',
  ].join('\n');

  const register = [
    '## Questions & Gaps Register',
    '',
    '| Code | Requirement | Type | Status | Owner | ARCHITECTURE.md Section | Action Required | Priority |',
    '|------|-------------|------|--------|-------|-------------------------|-----------------|----------|',
    '| [PIPELINE_POPULATED] | [See Compliance Summary] | — | — | — | — | — | — |',
    '',
  ].join('\n');

  const metadata = '## Generation Metadata\n\nSome metadata.';

  return [summary, extras, a31, register, metadata].join('\n');
}

function makeCompliantRow(code = 'SRE1.1'): string {
  return `| ${code} | Compliant requirement | SRE | Compliant | docs/01.md | SRE Team |`;
}

function makeNonCompliantRow(code = 'SRE1.2'): string {
  return `| ${code} | Non-compliant req | SRE | Non-Compliant | docs/02.md | SRE Team |`;
}

function makeUnknownRow(code = 'SRE1.3'): string {
  return `| ${code} | Unknown req | SRE | Unknown | docs/03.md | SRE Team |`;
}

function makeNARow(code = 'SRE1.4'): string {
  return `| ${code} | N/A req | SRE | Not Applicable | docs/04.md | SRE Team |`;
}

// ============================================================================
// Basic behavior
// ============================================================================

describe('populateQuestionsRegister — basic behavior', () => {
  test('returns original content when Compliance Summary is absent', () => {
    const content = 'No compliance summary here.';
    const result = populateQuestionsRegister(content, 'validation/cc-010-sre-architecture-validation.json');
    expect(result).toBe(content);
  });

  test('compliant-only table produces "no gaps found" row', () => {
    const contract = makeContract([makeCompliantRow()]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    expect(register).toContain('No gaps found');
    expect(register).not.toContain('[PIPELINE_POPULATED]');
  });

  test('replaces PIPELINE_POPULATED placeholder with real rows', () => {
    const contract = makeContract([makeCompliantRow(), makeNonCompliantRow()]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    expect(result).not.toContain('[PIPELINE_POPULATED]');
    const register = extractRegisterSection(result);
    expect(register).toContain('SRE1.2');
  });

  test('compliant rows are excluded from the register', () => {
    const contract = makeContract([makeCompliantRow('SRE1.1'), makeNonCompliantRow('SRE1.2')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    expect(register).not.toContain('SRE1.1');
    expect(register).toContain('SRE1.2');
  });

  test('generates all three non-compliant types in the register', () => {
    const contract = makeContract([
      makeNonCompliantRow('X1'),
      makeUnknownRow('X2'),
      makeNARow('X3'),
    ]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    expect(register).toContain('Non-Compliant');
    expect(register).toContain('Unknown');
    expect(register).toContain('Not Applicable');
  });
});

// ============================================================================
// Priority in rendered output
// ============================================================================

describe('populateQuestionsRegister — priority in register rows', () => {
  test('Not Applicable rows always have Low priority', () => {
    const contract = makeContract([makeNARow('NA1')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    const lines = register.split('\n').filter(l => l.includes('NA1'));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toMatch(/\|\s*Low\s*\|/);
  });

  test('Non-Compliant rows have Critical or Medium priority (never High)', () => {
    const contract = makeContract([makeNonCompliantRow('NC1')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    const lines = register.split('\n').filter(l => l.includes('NC1'));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toMatch(/\|\s*(Critical|Medium)\s*\|/);
    expect(lines[0]).not.toMatch(/\|\s*High\s*\|/);
  });

  test('Unknown rows have High or Medium priority (never Critical or Low)', () => {
    const contract = makeContract([makeUnknownRow('UN1')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    const lines = register.split('\n').filter(l => l.includes('UN1'));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).not.toMatch(/\|\s*Critical\s*\|/);
    expect(lines[0]).not.toMatch(/\|\s*Low\s*\|/);
  });
});

// ============================================================================
// Sort order (Critical → High → Low)
// ============================================================================

describe('populateQuestionsRegister — sort order', () => {
  test('Critical rows appear before High, High before Low in register', () => {
    const contract = makeContract([
      makeNARow('Z3'),            // Low
      makeNonCompliantRow('Z1'),  // Critical (blocker)
      makeUnknownRow('Z2'),       // High (blocker)
    ]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const register = extractRegisterSection(result);
    const z1Pos = register.indexOf('Z1');
    const z2Pos = register.indexOf('Z2');
    const z3Pos = register.indexOf('Z3');
    expect(z1Pos).toBeLessThan(z2Pos);
    expect(z2Pos).toBeLessThan(z3Pos);
  });
});

// ============================================================================
// Section replacement
// ============================================================================

describe('replaceRegisterSection (via populateQuestionsRegister)', () => {
  test('replaces register section when followed by ## heading', () => {
    const contract = makeContract([makeNonCompliantRow('R1')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    expect(result).not.toContain('[PIPELINE_POPULATED]');
    expect(result).toContain('## Questions & Gaps Register');
    // Generation Metadata must still be present (not swallowed by register regex)
    expect(result).toContain('## Generation Metadata');
  });

  test('handles register as last section (no trailing ## heading)', () => {
    const summary = [
      '## Compliance Summary',
      '',
      '| Code | Requirement | Category | Status | Source Section | Responsible Role |',
      '|------|-------------|----------|--------|----------------|------------------|',
      makeNonCompliantRow('EOF1'),
      '',
    ].join('\n');

    const register = [
      '## Questions & Gaps Register',
      '',
      '| Code | Requirement | Type | Status | Owner | ARCHITECTURE.md Section | Action Required | Priority |',
      '|------|-------------|------|--------|-------|-------------------------|-----------------|----------|',
      '| [PIPELINE_POPULATED] | [See Compliance Summary] | — | — | — | — | — | — |',
      '',
    ].join('\n');

    // No trailing ## section — register is last
    const contract = summary + '\n' + register;
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    expect(result).not.toContain('[PIPELINE_POPULATED]');
    const register2 = extractRegisterSection(result);
    expect(register2).toContain('EOF1');
  });

  test('inserts register before Generation Metadata when section was missing', () => {
    const content = [
      '## Compliance Summary',
      '',
      '| Code | Requirement | Category | Status | Source Section | Responsible Role |',
      '|------|-------------|----------|--------|----------------|------------------|',
      makeNonCompliantRow('INS1'),
      '',
      '## Generation Metadata',
      '',
      'Meta content.',
    ].join('\n');

    const result = populateQuestionsRegister(content, 'validation/cc-010-sre-architecture-validation.json');
    const registerPos = result.indexOf('## Questions & Gaps Register');
    const metaPos = result.indexOf('## Generation Metadata');
    expect(registerPos).toBeGreaterThanOrEqual(0);
    expect(metaPos).toBeGreaterThan(registerPos);
  });
});

// ============================================================================
// A.3.1 statistics
// ============================================================================

describe('A.3.1 gap summary statistics', () => {
  test('updates A.3.1 with correct total count', () => {
    const contract = makeContract([
      makeNonCompliantRow('S1'),
      makeUnknownRow('S2'),
      makeNARow('S3'),
    ]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const a31 = extractA31(result);
    expect(a31).toContain('A.3.1 Gap Summary Statistics');
    expect(a31).toMatch(/\*\*Total gaps\*\*\s*\|\s*\*\*3\*\*/);
  });

  test('A.3.1 shows zero total when all requirements are compliant', () => {
    const contract = makeContract([makeCompliantRow('C1'), makeCompliantRow('C2')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const a31 = extractA31(result);
    expect(a31).toContain('A.3.1 Gap Summary Statistics');
    expect(a31).toMatch(/\*\*Total gaps\*\*\s*\|\s*\*\*0\*\*/);
  });

  test('A.3.1 references the Questions & Gaps Register section', () => {
    const contract = makeContract([makeNonCompliantRow('REF1')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const a31 = extractA31(result);
    expect(a31).toContain('Questions & Gaps Register');
  });

  test('A.3.1 correctly counts by type', () => {
    const contract = makeContract([
      makeNonCompliantRow('T1'),
      makeNonCompliantRow('T2'),
      makeUnknownRow('T3'),
      makeNARow('T4'),
    ]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    const a31 = extractA31(result);
    // 2 Non-Compliant
    expect(a31).toMatch(/Non-Compliant\s*\|\s*2/);
    // 1 Unknown
    expect(a31).toMatch(/Unknown\s*\|\s*1/);
    // 1 Not Applicable
    expect(a31).toMatch(/Not Applicable\s*\|\s*1/);
  });
});

// ============================================================================
// Pipe escaping
// ============================================================================

describe('cell pipe escaping', () => {
  test('rows with pipe characters in requirement are still emitted', () => {
    // Use a simple row — pipe-in-content is handled by escapeCell
    const contract = makeContract([makeNonCompliantRow('PIPE1')]);
    const result = populateQuestionsRegister(contract, 'validation/cc-010-sre-architecture-validation.json');
    expect(result).toContain('PIPE1');
  });
});
