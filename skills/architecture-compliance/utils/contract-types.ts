#!/usr/bin/env bun

/**
 * Contract type registry — single source of truth for all contract-type mappings.
 *
 * Previously these dictionaries were duplicated across generation-helper.ts
 * (template_validation_*.json paths) and post-generation-pipeline.ts
 * (*_validation.json paths + filename prefix map). Both sets are defined here
 * to eliminate the parallel-maintenance risk.
 *
 * @module contract-types
 */

/**
 * All supported contract type identifiers.
 */
export const CONTRACT_TYPES = [
  'cc-001-business-continuity',
  'cc-002-cloud-architecture',
  'cc-003-data-ai-architecture',
  'cc-004-development-architecture',
  'cc-005-enterprise-architecture',
  'cc-006-integration-architecture',
  'cc-007-platform-it-infrastructure',
  'cc-008-process-transformation',
  'cc-009-security-architecture',
  'cc-010-sre-architecture',
] as const;

export type ContractType = typeof CONTRACT_TYPES[number];

/**
 * Human-readable display names for each contract type.
 */
export const CONTRACT_DISPLAY_NAMES: Record<string, string> = {
  'cc-001-business-continuity':      'Business Continuity',
  'cc-002-cloud-architecture':       'Cloud Architecture',
  'cc-003-data-ai-architecture':     'Data & AI Architecture',
  'cc-004-development-architecture': 'Development Architecture',
  'cc-005-enterprise-architecture':  'Enterprise Architecture',
  'cc-006-integration-architecture': 'Integration Architecture',
  'cc-007-platform-it-infrastructure': 'Platform IT Infrastructure',
  'cc-008-process-transformation':   'Process Transformation',
  'cc-009-security-architecture':    'Security Architecture',
  'cc-010-sre-architecture':         'SRE Architecture',
};

/**
 * Contract type → template validation rule file (used during Phase 4.6 generation
 * to validate contract structure against the template schema).
 */
export const TEMPLATE_VALIDATION_FILES: Record<string, string> = {
  'cc-001-business-continuity':      'validation/cc-001-business-continuity-template-validation.json',
  'cc-002-cloud-architecture':       'validation/cc-002-cloud-architecture-template-validation.json',
  'cc-003-data-ai-architecture':     'validation/cc-003-data-ai-architecture-template-validation.json',
  'cc-004-development-architecture': 'validation/cc-004-development-architecture-template-validation.json',
  'cc-005-enterprise-architecture':  'validation/cc-005-enterprise-architecture-template-validation.json',
  'cc-006-integration-architecture': 'validation/cc-006-integration-architecture-template-validation.json',
  'cc-007-platform-it-infrastructure': 'validation/cc-007-platform-it-infrastructure-template-validation.json',
  'cc-008-process-transformation':   'validation/cc-008-process-transformation-template-validation.json',
  'cc-009-security-architecture':    'validation/cc-009-security-architecture-template-validation.json',
  'cc-010-sre-architecture':         'validation/cc-010-sre-architecture-template-validation.json',
};

/**
 * Contract type → scoring validation config file (used by post-generation-pipeline.ts
 * to calculate compliance scores after contracts are written to disk).
 */
export const SCORING_VALIDATION_FILES: Record<string, string> = {
  'cc-001-business-continuity':      'validation/cc-001-business-continuity-validation.json',
  'cc-002-cloud-architecture':       'validation/cc-002-cloud-architecture-validation.json',
  'cc-003-data-ai-architecture':     'validation/cc-003-data-ai-architecture-validation.json',
  'cc-004-development-architecture': 'validation/cc-004-development-architecture-validation.json',
  'cc-005-enterprise-architecture':  'validation/cc-005-enterprise-architecture-validation.json',
  'cc-006-integration-architecture': 'validation/cc-006-integration-architecture-validation.json',
  'cc-007-platform-it-infrastructure': 'validation/cc-007-platform-it-infrastructure-validation.json',
  'cc-008-process-transformation':   'validation/cc-008-process-transformation-validation.json',
  'cc-009-security-architecture':    'validation/cc-009-security-architecture-validation.json',
  'cc-010-sre-architecture':         'validation/cc-010-sre-architecture-validation.json',
};

/**
 * Contract filename prefix → contract type key.
 * Used by post-generation-pipeline.ts to identify contract type from filename.
 *
 * Example: "CC-010-sre-architecture_Project_2026-03-25.md" → 'cc-010-sre-architecture'
 */
export const FILENAME_PREFIX_TO_CONTRACT_TYPE: Record<string, string> = {
  'CC-001-business-continuity':      'cc-001-business-continuity',
  'CC-002-cloud-architecture':       'cc-002-cloud-architecture',
  'CC-003-data-ai-architecture':     'cc-003-data-ai-architecture',
  'CC-004-development-architecture': 'cc-004-development-architecture',
  'CC-005-enterprise-architecture':  'cc-005-enterprise-architecture',
  'CC-006-integration-architecture': 'cc-006-integration-architecture',
  'CC-007-platform-it-infrastructure': 'cc-007-platform-it-infrastructure',
  'CC-008-process-transformation':   'cc-008-process-transformation',
  'CC-009-security-architecture':    'cc-009-security-architecture',
  'CC-010-sre-architecture':         'cc-010-sre-architecture',
};

/**
 * Get human-readable display name for a contract type.
 * Returns the raw contractType string if not found.
 */
export function getContractDisplayName(contractType: string): string {
  return CONTRACT_DISPLAY_NAMES[contractType] ?? contractType;
}

/**
 * Get list of all supported contract type identifiers.
 */
export function getSupportedContractTypes(): string[] {
  return [...CONTRACT_TYPES];
}

/**
 * Get the template validation rules file path for a contract type.
 * Throws if the type is unknown.
 */
export function getTemplateValidationFile(contractType: string): string {
  const file = TEMPLATE_VALIDATION_FILES[contractType];
  if (!file) {
    throw new Error(
      `Unknown contract type: "${contractType}". Valid types: ${CONTRACT_TYPES.join(', ')}`
    );
  }
  return file;
}

/**
 * Get the scoring validation config file path for a contract type.
 * Throws if the type is unknown.
 */
export function getScoringValidationFile(contractType: string): string {
  const file = SCORING_VALIDATION_FILES[contractType];
  if (!file) {
    throw new Error(
      `Unknown contract type: "${contractType}". Valid types: ${CONTRACT_TYPES.join(', ')}`
    );
  }
  return file;
}
