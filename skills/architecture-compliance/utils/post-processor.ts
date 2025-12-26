#!/usr/bin/env bun
/**
 * Compliance Contract Post-Processor
 *
 * Processes resolved templates to prepare them for final content population.
 * Implements post-processing pipeline for bulk compliance contract generation.
 *
 * Pipeline:
 * 1. Remove instructional sections
 * 2. Apply outcome tier mapping
 * 3. Replace dynamic field placeholders
 *
 * Usage:
 *   import { postProcessTemplate } from './post-processor';
 *   const processed = await postProcessTemplate(expandedTemplate, validationResults, config, generationDate);
 */

import { resolve } from 'path';
import { existsSync } from 'fs';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationResults {
  final_score: number;
  validation_date: string;
  completeness_score: number;
  compliance_score: number;
  quality_score: number;
  breakdown?: any;
}

export interface OutcomeTier {
  overall_status: "PASS" | "CONDITIONAL" | "FAIL";
  document_status: "Approved" | "In Review" | "Draft" | "Rejected";
  review_actor: string;
  action: "AUTO_APPROVE" | "MANUAL_REVIEW" | "NEEDS_WORK" | "REJECT";
}

export interface DomainConfig {
  domain_name: string;
  compliance_prefix: string;
  review_board: string;
  approval_authority: string;
  validation_config_path?: string;
  [key: string]: any;
}

interface ProcessingContext {
  validationResults: ValidationResults;
  outcome: OutcomeTier;
  config: DomainConfig;
  generationDate: string;
}

// ============================================================================
// Main Post-Processing Function
// ============================================================================

/**
 * Post-process a resolved template with validation results
 *
 * @param expandedTemplate - Template after resolve-includes.ts
 * @param validationResults - Results from Phase 3.5 validation
 * @param config - Domain config (from shared/config/*.json)
 * @param generationDate - YYYY-MM-DD format
 * @returns Processed template ready for final content population
 */
export async function postProcessTemplate(
  expandedTemplate: string,
  validationResults: ValidationResults,
  config: DomainConfig,
  generationDate: string
): Promise<string> {
  let processed = expandedTemplate;

  // Stage 1: Remove instructional sections
  processed = removeInstructionalSections(processed);

  // Stage 2: Apply outcome tier mapping
  const outcome = await mapOutcomeFromScore(
    validationResults.final_score,
    config.approval_authority,
    config.validation_config_path
  );

  // Stage 3: Replace dynamic field placeholders
  const context: ProcessingContext = {
    validationResults,
    outcome,
    config,
    generationDate
  };

  processed = replaceDynamicFields(processed, context);

  return processed;
}

// ============================================================================
// Stage 1: Instruction Removal
// ============================================================================

/**
 * Remove sections marked with INSTRUCTIONS markers
 *
 * Removes content between:
 * <!-- BEGIN INSTRUCTIONS - REMOVE FROM FINAL OUTPUT -->
 * ...
 * <!-- END INSTRUCTIONS -->
 */
export function removeInstructionalSections(content: string): string {
  const pattern = /<!--\s*BEGIN INSTRUCTIONS.*?-->([\s\S]*?)<!--\s*END INSTRUCTIONS\s*-->/gi;

  const result = content.replace(pattern, '');

  // Log removal for debugging
  const removedCount = (content.match(pattern) || []).length;
  if (removedCount > 0) {
    console.log(`✓ Removed ${removedCount} instructional section(s)`);
  }

  return result;
}

// ============================================================================
// Stage 2: Outcome Tier Mapping
// ============================================================================

/**
 * Map validation score to outcome tier
 *
 * Implements outcome tier mapping logic based on validation score.
 * Uses default mapping if validation config is unavailable.
 *
 * @param finalScore - Validation score (0-10 scale)
 * @param approvalAuthority - Fallback approval authority name
 * @param validationConfigPath - Path to validation config (optional)
 * @returns Outcome tier with document_status, review_actor, etc.
 */
export async function mapOutcomeFromScore(
  finalScore: number,
  approvalAuthority: string,
  validationConfigPath?: string
): Promise<OutcomeTier> {
  // Try to load outcome_mapping from validation config
  if (validationConfigPath) {
    try {
      const config = await loadValidationConfig(validationConfigPath);

      if (config.outcome_mapping) {
        return findOutcomeTier(finalScore, config.outcome_mapping, approvalAuthority);
      }
    } catch (error) {
      console.warn(`Warning: Could not load outcome_mapping from ${validationConfigPath}, using default`);
    }
  }

  // Fallback to default mapping
  return defaultOutcomeMapping(finalScore, approvalAuthority);
}

/**
 * Load validation config JSON
 */
async function loadValidationConfig(configPath: string): Promise<any> {
  // Handle relative paths
  const fullPath = configPath.startsWith('/')
    ? resolve(import.meta.dir, '..', configPath.slice(1))
    : resolve(import.meta.dir, '..', configPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Validation config not found: ${fullPath}`);
  }

  return await Bun.file(fullPath).json();
}

/**
 * Find matching outcome tier from outcome_mapping
 */
function findOutcomeTier(
  score: number,
  outcomeMapping: any,
  approvalAuthority: string
): OutcomeTier {
  for (const [range, outcome] of Object.entries(outcomeMapping)) {
    const [min, max] = range.split('-').map(parseFloat);

    // Inclusive lower bound, inclusive upper bound
    if (score >= min && score <= max) {
      // Replace {{approval_authority}} placeholder in review_actor if needed
      const reviewActor = (outcome as any).review_actor
        ?.replace('{{approval_authority}}', approvalAuthority)
        || (outcome as any).review_actor;

      return {
        overall_status: (outcome as any).overall_status,
        document_status: (outcome as any).document_status,
        action: (outcome as any).action,
        review_actor: reviewActor
      };
    }
  }

  // Fallback (should never reach if config is valid)
  throw new Error(`No outcome tier mapping for score ${score}`);
}

/**
 * Default outcome mapping (if validation config unavailable)
 *
 * Score Ranges:
 * | 8.0-10.0 | PASS        | Approved   | System (Auto-Approved) |
 * | 7.0-7.9  | PASS        | In Review  | [Approval Authority]   |
 * | 5.0-6.9  | CONDITIONAL | Draft      | Architecture Team      |
 * | 0.0-4.9  | FAIL        | Rejected   | N/A (Blocked)          |
 */
function defaultOutcomeMapping(
  finalScore: number,
  approvalAuthority: string
): OutcomeTier {
  if (finalScore >= 8.0) {
    return {
      overall_status: "PASS",
      document_status: "Approved",
      review_actor: "System (Auto-Approved)",
      action: "AUTO_APPROVE"
    };
  } else if (finalScore >= 7.0) {
    return {
      overall_status: "PASS",
      document_status: "In Review",
      review_actor: approvalAuthority,
      action: "MANUAL_REVIEW"
    };
  } else if (finalScore >= 5.0) {
    return {
      overall_status: "CONDITIONAL",
      document_status: "Draft",
      review_actor: "Architecture Team",
      action: "NEEDS_WORK"
    };
  } else {
    return {
      overall_status: "FAIL",
      document_status: "Rejected",
      review_actor: "N/A (Blocked)",
      action: "REJECT"
    };
  }
}

// ============================================================================
// Stage 3: Dynamic Field Replacement
// ============================================================================

/**
 * Replace all dynamic field placeholders
 *
 * Replaced placeholders:
 * - [DOCUMENT_STATUS] → outcome.document_status
 * - [VALIDATION_SCORE] → "X.X/10"
 * - [VALIDATION_STATUS] → outcome.overall_status
 * - [VALIDATION_DATE] → validation_results.validation_date
 * - [VALIDATION_EVALUATOR] → "Claude Code (Automated Validation Engine)"
 * - [REVIEW_ACTOR] → outcome.review_actor
 * - [APPROVAL_AUTHORITY] → config.approval_authority
 * - [GENERATION_DATE] → generationDate
 */
export function replaceDynamicFields(
  content: string,
  context: ProcessingContext
): string {
  const { validationResults, outcome, config, generationDate } = context;

  const replacements: Record<string, string> = {
    '[DOCUMENT_STATUS]': outcome.document_status,
    '[VALIDATION_SCORE]': `${validationResults.final_score.toFixed(1)}/10`,
    '[VALIDATION_STATUS]': outcome.overall_status,
    '[VALIDATION_DATE]': validationResults.validation_date || 'Not performed',
    '[VALIDATION_EVALUATOR]': 'Claude Code (Automated Validation Engine)',
    '[REVIEW_ACTOR]': outcome.review_actor,
    '[APPROVAL_AUTHORITY]': config.approval_authority,
    '[GENERATION_DATE]': generationDate,
    '[PROJECT_NAME]': config.domain_name || '[PROJECT_NAME]',
  };

  let result = content;
  let replacedCount = 0;

  for (const [placeholder, value] of Object.entries(replacements)) {
    const pattern = new RegExp(escapeRegex(placeholder), 'g');
    const matches = (result.match(pattern) || []).length;

    if (matches > 0) {
      result = result.replace(pattern, value);
      replacedCount += matches;
    }
  }

  if (replacedCount > 0) {
    console.log(`✓ Replaced ${replacedCount} dynamic field placeholder(s)`);
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Exports for Testing
// ============================================================================

export {
  removeInstructionalSections as _removeInstructionalSections,
  mapOutcomeFromScore as _mapOutcomeFromScore,
  replaceDynamicFields as _replaceDynamicFields
};
