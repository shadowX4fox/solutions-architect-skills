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
  'business_continuity',
  'sre_architecture',
  'cloud_architecture',
  'data_ai_architecture',
  'development_architecture',
  'process_transformation',
  'security_architecture',
  'platform_it_infrastructure',
  'enterprise_architecture',
  'integration_architecture',
] as const;

export type ContractType = typeof CONTRACT_TYPES[number];

/**
 * Human-readable display names for each contract type.
 */
export const CONTRACT_DISPLAY_NAMES: Record<string, string> = {
  business_continuity:      'Business Continuity',
  sre_architecture:         'SRE Architecture',
  cloud_architecture:       'Cloud Architecture',
  data_ai_architecture:     'Data & AI Architecture',
  development_architecture: 'Development Architecture',
  process_transformation:   'Process Transformation',
  security_architecture:    'Security Architecture',
  platform_it_infrastructure: 'Platform IT Infrastructure',
  enterprise_architecture:  'Enterprise Architecture',
  integration_architecture: 'Integration Architecture',
};

/**
 * Contract type → template validation rule file (used during Phase 4.6 generation
 * to validate contract structure against the template schema).
 */
export const TEMPLATE_VALIDATION_FILES: Record<string, string> = {
  business_continuity:      'validation/template_validation_business_continuity.json',
  sre_architecture:         'validation/template_validation_sre_architecture.json',
  cloud_architecture:       'validation/template_validation_cloud_architecture.json',
  data_ai_architecture:     'validation/template_validation_data_ai_architecture.json',
  development_architecture: 'validation/template_validation_development_architecture.json',
  process_transformation:   'validation/template_validation_process_transformation.json',
  security_architecture:    'validation/template_validation_security_architecture.json',
  platform_it_infrastructure: 'validation/template_validation_platform_it_infrastructure.json',
  enterprise_architecture:  'validation/template_validation_enterprise_architecture.json',
  integration_architecture: 'validation/template_validation_integration_architecture.json',
};

/**
 * Contract type → scoring validation config file (used by post-generation-pipeline.ts
 * to calculate compliance scores after contracts are written to disk).
 */
export const SCORING_VALIDATION_FILES: Record<string, string> = {
  business_continuity:      'validation/business_continuity_validation.json',
  sre_architecture:         'validation/sre_architecture_validation.json',
  cloud_architecture:       'validation/cloud_architecture_validation.json',
  data_ai_architecture:     'validation/data_ai_architecture_validation.json',
  development_architecture: 'validation/development_architecture_validation.json',
  process_transformation:   'validation/process_transformation_validation.json',
  security_architecture:    'validation/security_architecture_validation.json',
  platform_it_infrastructure: 'validation/platform_it_infrastructure_validation.json',
  enterprise_architecture:  'validation/enterprise_architecture_validation.json',
  integration_architecture: 'validation/integration_architecture_validation.json',
};

/**
 * Contract filename prefix → contract type key.
 * Used by post-generation-pipeline.ts to identify contract type from filename.
 *
 * Example: "SRE_ARCHITECTURE_Project_2026-03-25.md" → 'sre_architecture'
 */
export const FILENAME_PREFIX_TO_CONTRACT_TYPE: Record<string, string> = {
  INTEGRATION_ARCHITECTURE:  'integration_architecture',
  SECURITY_ARCHITECTURE:     'security_architecture',
  CLOUD_ARCHITECTURE:        'cloud_architecture',
  DEVELOPMENT_ARCHITECTURE:  'development_architecture',
  SRE_ARCHITECTURE:          'sre_architecture',
  BUSINESS_CONTINUITY:       'business_continuity',
  DATA_AI_ARCHITECTURE:      'data_ai_architecture',
  ENTERPRISE_ARCHITECTURE:   'enterprise_architecture',
  PLATFORM_IT_INFRASTRUCTURE: 'platform_it_infrastructure',
  PROCESS_TRANSFORMATION:    'process_transformation',
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
