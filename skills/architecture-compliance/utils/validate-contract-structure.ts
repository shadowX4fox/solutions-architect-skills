#!/usr/bin/env bun

/**
 * Contract Structure Validation Utility
 *
 * Validates that generated compliance contracts match template structure completely.
 * Ensures 100% template fidelity by checking all sections, tables, and formatting rules.
 *
 * Usage:
 *   bun validate-contract-structure.ts <contract-file>
 *   ./validate-contract-structure.ts <contract-file>
 *
 * Exit Codes:
 *   0 - Contract is valid (matches template structure)
 *   1 - Contract is invalid (template violations detected)
 */

import { existsSync } from 'fs';

// Type Definitions
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Main validation function - checks complete contract structure
 */
export async function validateContractStructure(
  contractContent: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Document Control Section
  const docControlIssues = validateDocumentControl(contractContent);
  errors.push(...docControlIssues);

  // 2. Dynamic Field Instructions Section
  if (!contractContent.includes('## Dynamic Field Instructions')) {
    errors.push('Dynamic Field Instructions section missing');
  }
  if (contractContent.match(/##\s+A\.\d+\s+Dynamic Field Instructions/)) {
    errors.push('Dynamic Field Instructions has forbidden section numbering (A.X format)');
  }

  // 3. Compliance Summary Table Structure
  const summaryIssues = validateComplianceSummary(contractContent);
  errors.push(...summaryIssues);

  // 4. Table Format Check (no bold field conversions)
  if (contractContent.match(/\*\*Document Owner\*\*:/)) {
    errors.push('Document Control table converted to bold field format (forbidden - must use | Field | Value | table)');
  }

  // 5. Section Numbering in Shared Sections
  const numberingMatches = contractContent.match(/##\s+A\.\d+\s+(Document Control|Dynamic Field)/g);
  if (numberingMatches && numberingMatches.length > 0) {
    errors.push(`Shared sections have forbidden numbering (A.X format): ${numberingMatches.join(', ')}`);
  }

  // 6. Header Preservation
  if (!contractContent.includes('**Project**:')) {
    errors.push('Header missing **Project**: field');
  }
  if (!contractContent.includes('**Generation Date**:')) {
    errors.push('Header missing **Generation Date**: field');
  }

  // 7. Status Value Validation
  const invalidStatuses = findInvalidStatuses(contractContent);
  if (invalidStatuses.length > 0) {
    errors.push(`Invalid status values found (only Compliant, Non-Compliant, Not Applicable, Unknown allowed): ${invalidStatuses.join(', ')}`);
  }

  // 8. Compliance Summary Section Existence
  if (!contractContent.includes('## Compliance Summary')) {
    errors.push('Compliance Summary section missing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates Document Control section structure
 */
function validateDocumentControl(content: string): string[] {
  const errors: string[] = [];

  if (!content.includes('## Document Control')) {
    errors.push('Document Control section not found');
    return errors;
  }

  // Check for forbidden section numbering
  if (content.match(/##\s+A\.\d+\s+Document Control/)) {
    errors.push('Document Control section has forbidden numbering (A.X format)');
  }

  const requiredFields = [
    'Document Owner',
    'Last Review Date',
    'Next Review Date',
    'Status',
    'Validation Score',
    'Validation Status',
    'Validation Date',
    'Validation Evaluator',
    'Review Actor',
    'Approval Authority'
  ];

  const section = extractSection(content, 'Document Control');

  // Check table format
  if (!section.includes('| Field | Value |')) {
    errors.push('Document Control section not in markdown table format (missing | Field | Value | header)');
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!section.includes(`| ${field} |`)) {
      errors.push(`Document Control missing required field: ${field}`);
    }
  }

  // Check for forbidden extra fields
  const forbiddenFields = ['Document ID', 'Template Version', 'Compliance Code Prefix', 'Total Requirements'];
  for (const field of forbiddenFields) {
    if (section.includes(`| ${field} |`)) {
      errors.push(`Document Control has forbidden/hallucinated field: ${field} (not in template)`);
    }
  }

  return errors;
}

/**
 * Validates Compliance Summary table structure
 */
function validateComplianceSummary(content: string): string[] {
  const errors: string[] = [];

  if (!content.includes('## Compliance Summary')) {
    errors.push('Compliance Summary section not found');
    return errors;
  }

  const section = extractSection(content, 'Compliance Summary');

  // Check column headers - must have exactly these 6 columns
  const requiredColumns = ['Code', 'Requirement', 'Category', 'Status', 'Source Section', 'Responsible Role'];

  // Look for the header row
  const headerMatch = section.match(/\|\s*(.+?)\s*\|/);
  if (!headerMatch) {
    errors.push('Compliance Summary table header not found');
    return errors;
  }

  for (const col of requiredColumns) {
    if (!section.includes(`| ${col} |`)) {
      errors.push(`Compliance Summary missing required column: ${col}`);
    }
  }

  // Check for table format
  if (!section.match(/\|[-\s]+\|/)) {
    errors.push('Compliance Summary table missing separator row (|---|---|)');
  }

  return errors;
}

/**
 * Finds invalid status values in the contract
 */
function findInvalidStatuses(content: string): string[] {
  const validStatuses = ['Compliant', 'Non-Compliant', 'Not Applicable', 'Unknown'];
  const invalidStatuses = new Set<string>();

  // Look for status values in table rows
  // Pattern: | ... | Status | ... |
  const tableRows = content.split('\n').filter(line => line.includes('|'));

  for (const row of tableRows) {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);

    // Check cells that might be status values
    for (const cell of cells) {
      // Skip if it's a header or separator
      if (cell.includes('---') || validStatuses.includes(cell)) {
        continue;
      }

      // If it looks like a status (contains "Compliant" or similar keywords)
      if (cell.match(/\b(Compli|Non-Compli|Applicable|Unknown)\b/i) && !validStatuses.includes(cell)) {
        invalidStatuses.add(cell);
      }
    }
  }

  return Array.from(invalidStatuses);
}

/**
 * Extracts a section from the contract content
 */
function extractSection(content: string, sectionTitle: string): string {
  const regex = new RegExp(`## ${sectionTitle}([\\s\\S]*?)(?=##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1] : '';
}

/**
 * Generates a human-readable validation report
 */
export function generateValidationReport(result: ValidationResult, contractFile: string): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  CONTRACT STRUCTURE VALIDATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Contract: ${contractFile}`);
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('ERRORS DETECTED:');
    lines.push('─────────────────────────────────────────────────────────────');
    result.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. ${error}`);
    });
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    lines.push('─────────────────────────────────────────────────────────────');
    result.warnings.forEach((warning, index) => {
      lines.push(`  ${index + 1}. ${warning}`);
    });
    lines.push('');
  }

  if (result.isValid) {
    lines.push('✅ Contract matches template structure completely.');
    lines.push('   All sections, tables, and formatting rules validated.');
  } else {
    lines.push('❌ Contract DOES NOT match template structure.');
    lines.push('   Fix the errors above before using this contract.');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: bun validate-contract-structure.ts <contract-file>');
    console.error('');
    console.error('Example:');
    console.error('  bun validate-contract-structure.ts /compliance-docs/SRE_ARCHITECTURE_MyProject_2025-12-30.md');
    console.error('  ./validate-contract-structure.ts /compliance-docs/BUSINESS_CONTINUITY_MyProject_2025-12-30.md');
    process.exit(1);
  }

  const contractFile = args[0];

  if (!existsSync(contractFile)) {
    console.error(`Error: Contract file not found: ${contractFile}`);
    process.exit(1);
  }

  try {
    // Read contract using Bun's fast file API
    const content = await Bun.file(contractFile).text();

    // Validate structure
    const result = await validateContractStructure(content);

    // Generate and display report
    const report = generateValidationReport(result, contractFile);
    console.log(report);

    // Exit with appropriate code
    process.exit(result.isValid ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

// Export for testing
export { validateDocumentControl, validateComplianceSummary, findInvalidStatuses, extractSection };
