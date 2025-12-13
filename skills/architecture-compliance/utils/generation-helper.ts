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
 *   'sre_architecture'
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
import { ErrorReporter } from './error_reporter';
import type { ValidationResult } from './validators';

/**
 * Contract type to validation rule file mapping
 */
const VALIDATION_RULE_FILES: Record<string, string> = {
  business_continuity: 'validation/template_validation_business_continuity.json',
  sre_architecture: 'validation/template_validation_sre_architecture.json',
  cloud_architecture: 'validation/template_validation_cloud_architecture.json',
  data_ai_architecture: 'validation/template_validation_data_ai_architecture.json',
  development_architecture: 'validation/template_validation_development_architecture.json',
  process_transformation: 'validation/template_validation_process_transformation.json',
  security_architecture: 'validation/template_validation_security_architecture.json',
  platform_it_infrastructure: 'validation/template_validation_platform_it_infrastructure.json',
  enterprise_architecture: 'validation/template_validation_enterprise_architecture.json',
  integration_architecture: 'validation/template_validation_integration_architecture.json',
};

/**
 * Contract type display names
 */
const CONTRACT_DISPLAY_NAMES: Record<string, string> = {
  business_continuity: 'Business Continuity',
  sre_architecture: 'SRE Architecture',
  cloud_architecture: 'Cloud Architecture',
  data_ai_architecture: 'Data & AI Architecture',
  development_architecture: 'Development Architecture',
  process_transformation: 'Process Transformation',
  security_architecture: 'Security Architecture',
  platform_it_infrastructure: 'Platform IT Infrastructure',
  enterprise_architecture: 'Enterprise Architecture',
  integration_architecture: 'Integration Architecture',
};

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
 * @param contractType - Contract type identifier (e.g., 'sre_architecture')
 * @param options - Optional configuration
 * @returns Validation result with formatted reports
 *
 * @example
 * ```typescript
 * const result = await validateGeneratedContract(
 *   generatedContent,
 *   'sre_architecture'
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
  // Validate contract type
  const rulesFile = VALIDATION_RULE_FILES[contractType];
  if (!rulesFile) {
    throw new Error(
      `Unknown contract type: ${contractType}. Valid types: ${Object.keys(VALIDATION_RULE_FILES).join(', ')}`
    );
  }

  const displayName = CONTRACT_DISPLAY_NAMES[contractType] || contractType;

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
 *   { content: sreContent, contractType: 'sre_architecture' },
 *   { content: cloudContent, contractType: 'cloud_architecture' },
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
  const rulesFile = VALIDATION_RULE_FILES[contractType];
  if (!rulesFile) {
    throw new Error(`Unknown contract type: ${contractType}`);
  }
  return rulesFile;
}

/**
 * Get list of all supported contract types
 *
 * @returns Array of contract type identifiers
 */
export function getSupportedContractTypes(): string[] {
  return Object.keys(VALIDATION_RULE_FILES);
}

/**
 * Get display name for a contract type
 *
 * @param contractType - Contract type identifier
 * @returns Human-readable display name
 */
export function getContractDisplayName(contractType: string): string {
  return CONTRACT_DISPLAY_NAMES[contractType] || contractType;
}

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
