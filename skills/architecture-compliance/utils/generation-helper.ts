#!/usr/bin/env bun
/**
 * Compliance Contract Generation Helper with Integrated Validation
 *
 * This module provides a high-level API for validating compliance contracts
 * during the generation workflow (Phase 4.6). It wraps the validation framework
 * with contract-type-aware rule loading and formatted error reporting.
 *
 * Usage in SKILL.md Phase 4.6:
 *
 * ```typescript
 * import { validateGeneratedContract } from './utils/generation-helper';
 *
 * const result = await validateGeneratedContract(
 *   generatedContent,
 *   'cc-010-sre-architecture'
 * );
 *
 * if (!result.isValid) {
 *   console.error(result.errorReport);
 *   throw new Error('Validation failed - generation blocked');
 * }
 *
 * console.log(result.successMessage);
 * // Proceed to Phase 5: Output
 * ```
 */

import { ComplianceValidator } from './validators';
import { ErrorReporter } from './error-reporter';
import type { ValidationResult } from './validators';
import {
  getContractDisplayName,
  getSupportedContractTypes,
  getTemplateValidationFile,
} from './contract-types';
export { getContractDisplayName, getSupportedContractTypes } from './contract-types';
export { getLocalDateString } from './date-utils';

/**
 * Validation result with formatted reports
 */
export interface GenerationValidationResult {
  isValid: boolean;
  contractType: string;
  contractDisplayName: string;
  validationResult: ValidationResult;
  errorReport?: string;
  compactSummary: string;
  successMessage?: string;
  markdownReport?: string;
}

/**
 * Validate a generated compliance contract with automatic rule loading
 * and formatted error reporting.
 *
 * @param content - The generated contract content (markdown)
 * @param contractType - Contract type identifier (e.g., 'cc-010-sre-architecture')
 * @param options - Optional configuration
 * @returns Validation result with formatted reports
 *
 * @example
 * ```typescript
 * const result = await validateGeneratedContract(
 *   generatedContent,
 *   'cc-010-sre-architecture'
 * );
 *
 * if (!result.isValid) {
 *   console.error(result.errorReport);
 *   throw new Error('Validation failed');
 * }
 * ```
 */
export async function validateGeneratedContract(
  content: string,
  contractType: string,
  options: {
    includeMarkdownReport?: boolean;
    throwOnError?: boolean;
  } = {}
): Promise<GenerationValidationResult> {
  // Validate contract type and get rule file (throws on unknown type)
  const rulesFile = getTemplateValidationFile(contractType);
  const displayName = getContractDisplayName(contractType);

  // Load validator with contract-specific rules
  const validator = new ComplianceValidator(rulesFile);

  // Run validation
  const validationResult = await validator.validateDocument(content, contractType);

  // Generate reports
  const compactSummary = ErrorReporter.generateCompactSummary(validationResult);
  const errorReport = !validationResult.isValid
    ? ErrorReporter.generateReport(validationResult, contractType)
    : undefined;
  const markdownReport = options.includeMarkdownReport
    ? ErrorReporter.generateMarkdownReport(validationResult, contractType)
    : undefined;

  const successMessage = validationResult.isValid
    ? `✅ Validation passed for ${displayName}\n` +
      `   ${validationResult.validationSummary.totalChecks} checks performed, all passed\n` +
      `   Contract is ready for output (Phase 5)`
    : undefined;

  const result: GenerationValidationResult = {
    isValid: validationResult.isValid,
    contractType,
    contractDisplayName: displayName,
    validationResult,
    errorReport,
    compactSummary,
    successMessage,
    markdownReport,
  };

  // Optionally throw on validation failure
  if (options.throwOnError && !validationResult.isValid) {
    throw new ValidationError(result);
  }

  return result;
}

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  public readonly validationResult: GenerationValidationResult;

  constructor(result: GenerationValidationResult) {
    super(
      `Validation failed for ${result.contractDisplayName}: ` +
      `${result.validationResult.errors.length} error(s), ` +
      `${result.validationResult.warnings.length} warning(s)`
    );
    this.name = 'ValidationError';
    this.validationResult = result;
  }
}

/**
 * Validate multiple contracts in batch
 *
 * @param contracts - Array of {content, contractType} objects
 * @returns Array of validation results
 *
 * @example
 * ```typescript
 * const results = await validateMultipleContracts([
 *   { content: sreContent, contractType: 'cc-010-sre-architecture' },
 *   { content: cloudContent, contractType: 'cc-002-cloud-architecture' },
 * ]);
 *
 * const failedContracts = results.filter(r => !r.isValid);
 * ```
 */
export async function validateMultipleContracts(
  contracts: Array<{ content: string; contractType: string }>
): Promise<GenerationValidationResult[]> {
  const results: GenerationValidationResult[] = [];

  for (const { content, contractType } of contracts) {
    const result = await validateGeneratedContract(content, contractType);
    results.push(result);
  }

  return results;
}

/**
 * Get validation rules file path for a contract type
 *
 * @param contractType - Contract type identifier
 * @returns Path to validation rules file
 */
export function getValidationRulesPath(contractType: string): string {
  return getTemplateValidationFile(contractType);
}

// getContractDisplayName, getSupportedContractTypes, getLocalDateString
// are re-exported at the top of this file from contract-types and date-utils.

/**
 * Print validation result to console with formatted output
 *
 * @param result - Validation result from validateGeneratedContract
 */
export function printValidationResult(result: GenerationValidationResult): void {
  console.log('\n' + '═'.repeat(80));
  console.log(`Validation Result: ${result.contractDisplayName}`);
  console.log('═'.repeat(80) + '\n');

  if (result.isValid) {
    console.log(result.successMessage);
  } else {
    console.log(result.errorReport);
  }

  console.log('\n' + '═'.repeat(80) + '\n');
}
