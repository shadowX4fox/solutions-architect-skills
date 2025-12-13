#!/usr/bin/env bun
/**
 * Validation Framework Usage Example
 *
 * Demonstrates how to use the ComplianceValidator and ErrorReporter
 * to validate compliance contract documents.
 *
 * Usage:
 *   bun run utils/validate-example.ts
 */

import { ComplianceValidator } from './validators';
import { ErrorReporter } from './error_reporter';

// Example document with validation errors
const EXAMPLE_DOCUMENT_WITH_ERRORS = `# Compliance Contract: SRE Architecture

**Project**: Example Project
**Generation Date**: 2024-01-15
**Source**: ARCHITECTURE.md
**Version**: 2.0

## Document Control

**Status**: Draft
**Validation Score**: 8.5/10

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Structured logging | Practice - Log Management | Pass | Section 11.1 | SRE Team |
| LASRE02 | Centralized logging | Practice - Log Management | compliant | Section 11.1 | SRE Team |
| LASRE03 | Log retention | Practice - Log Management | Compliant | Not documented | SRE Team |

**Overall Compliance**:
- ✅ Compliant: 2/3 (67%)
- ❌ Non-Compliant: 0/3 (0%)
- ⊘ Not Applicable: 0/3 (0%)
- ❓ Unknown: 0/3 (0%)

**Completeness**: 100% (3/3 data points documented)

### A.1 Definitions and Terminology
**Test**: Example

### A.2 Validation Methodology
**Test**: Example

### A.3 Document Completion Guide
**Test**: Example

### A.4 Change History
**Test**: Example
`;

// Example document without errors
const EXAMPLE_DOCUMENT_VALID = `# Compliance Contract: SRE Architecture

**Project**: Example Project
**Generation Date**: 2024-01-15
**Source**: ARCHITECTURE.md
**Version**: 2.0

## Document Control

**Status**: Draft
**Validation Score**: 8.5/10

## Compliance Summary

| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Structured logging | Practice - Log Management | Compliant | Section 11.1 | SRE Team |
| LASRE02 | Centralized logging | Practice - Log Management | Compliant | Section 11.1 | SRE Team |
| LASRE03 | Log retention | Practice - Log Management | Non-Compliant | Not documented | SRE Team |

**Overall Compliance**:
- ✅ Compliant: 2/3 (67%)
- ❌ Non-Compliant: 1/3 (33%)
- ⊘ Not Applicable: 0/3 (0%)
- ❓ Unknown: 0/3 (0%)

**Completeness**: 100% (3/3 data points documented)

### A.1 Definitions and Terminology
**Test**: Example

### A.2 Validation Methodology
**Test**: Example

### A.3 Document Completion Guide
**Test**: Example

### A.4 Change History
**Test**: Example
`;

async function main() {
  console.log('═'.repeat(80));
  console.log('Compliance Template Validation Framework - Usage Example');
  console.log('═'.repeat(80));
  console.log();

  // Example 1: Validate document with errors
  console.log('📋 Example 1: Validating document with errors...\n');

  try {
    const validator1 = new ComplianceValidator(
      'validation/template_validation_sre_architecture.json'
    );

    const result1 = await validator1.validateDocument(
      EXAMPLE_DOCUMENT_WITH_ERRORS,
      'sre_architecture'
    );

    if (!result1.isValid) {
      console.log('❌ Validation failed!\n');
      const report = ErrorReporter.generateReport(result1, 'sre_architecture');
      console.log(report);
    }
  } catch (error) {
    console.error('Error during validation:', error);
  }

  console.log();
  console.log('═'.repeat(80));
  console.log();

  // Example 2: Validate document without errors
  console.log('📋 Example 2: Validating valid document...\n');

  try {
    const validator2 = new ComplianceValidator(
      'validation/template_validation_sre_architecture.json'
    );

    const result2 = await validator2.validateDocument(
      EXAMPLE_DOCUMENT_VALID,
      'sre_architecture'
    );

    if (result2.isValid) {
      console.log('✅ Validation passed!\n');
      const report = ErrorReporter.generateReport(result2, 'sre_architecture');
      console.log(report);
    } else {
      console.log('❌ Unexpected validation failure');
      console.log('Errors:', result2.errors);
    }
  } catch (error) {
    console.error('Error during validation:', error);
  }

  console.log();
  console.log('═'.repeat(80));
  console.log();

  // Example 3: Compact summary
  console.log('📋 Example 3: Compact summary format...\n');

  try {
    const validator3 = new ComplianceValidator(
      'validation/template_validation_sre_architecture.json'
    );

    const result3 = await validator3.validateDocument(
      EXAMPLE_DOCUMENT_WITH_ERRORS,
      'sre_architecture'
    );

    const summary = ErrorReporter.generateCompactSummary(result3);
    console.log(summary);
  } catch (error) {
    console.error('Error during validation:', error);
  }

  console.log();
  console.log('═'.repeat(80));
  console.log();

  // Example 4: Markdown report
  console.log('📋 Example 4: Markdown report format...\n');

  try {
    const validator4 = new ComplianceValidator(
      'validation/template_validation_sre_architecture.json'
    );

    const result4 = await validator4.validateDocument(
      EXAMPLE_DOCUMENT_WITH_ERRORS,
      'sre_architecture'
    );

    const markdownReport = ErrorReporter.generateMarkdownReport(result4, 'sre_architecture');
    console.log('Markdown report generated (first 500 chars):');
    console.log(markdownReport.substring(0, 500) + '...\n');
  } catch (error) {
    console.error('Error during validation:', error);
  }

  console.log('═'.repeat(80));
  console.log('✨ Examples completed!');
  console.log('═'.repeat(80));
}

// Run examples
main().catch(console.error);
