#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

// Resolve skill directory from script location (works both locally and as plugin)
const SKILL_DIR = resolve(import.meta.dir, '..');

/**
 * Compliance Contract Score Calculator
 *
 * Calculates validation scores from generated compliance contracts by:
 * 1. Parsing Compliance Summary table
 * 2. Counting status values (Compliant, Non-Compliant, Unknown, Not Applicable)
 * 3. Calculating component scores (completeness, compliance, quality)
 * 4. Applying template-specific weights
 * 5. Determining outcome tier based on score thresholds
 *
 * @module score-calculator
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationScore {
  final_score: number;
  completeness_score: number;
  compliance_score: number;
  quality_score: number;
  status_counts: {
    Compliant: number;
    'Non-Compliant': number;
    'Not Applicable': number;
    Unknown: number;
  };
  outcome: OutcomeTier;
  validation_date: string;
}

export interface ComplianceTableData {
  requirements: Requirement[];
  statusCounts: {
    Compliant: number;
    'Non-Compliant': number;
    'Not Applicable': number;
    Unknown: number;
  };
  totalRequirements: number;
}

export interface Requirement {
  code: string;
  requirement: string;
  category: string;
  status: string;
  sourceSection: string;
  role: string;
  hasSource: boolean;
}

export interface OutcomeTier {
  overall_status: 'PASS' | 'CONDITIONAL' | 'FAIL';
  document_status: 'Approved' | 'In Review' | 'Draft' | 'Rejected';
  action: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'NEEDS_WORK' | 'REJECT';
  review_actor: string;
}

export interface ValidationConfig {
  template_name: string;
  template_id: string;
  approval_authority: string;
  scoring: {
    scale: number;
    thresholds: {
      auto_approve: number;
      ready_for_review: number;
      needs_work: number;
      reject: number;
    };
    weights: {
      completeness: number;
      compliance: number;
      quality: number;
    };
    status_codes: {
      PASS: number;
      FAIL: number;
      'N/A': number;
      UNKNOWN: number;
      EXCEPTION: number;
    };
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Calculate compliance validation score from contract markdown content
 *
 * @param contractContent - Full markdown content of generated contract
 * @param validationConfigPath - Path to validation JSON config (e.g., "validation/business_continuity_validation.json")
 * @returns ValidationScore object with all score components
 */
export function calculateComplianceScore(
  contractContent: string,
  validationConfigPath: string
): ValidationScore {
  // 1. Load validation config
  const config = loadValidationConfig(validationConfigPath);

  // 2. Parse Compliance Summary table
  const tableData = parseComplianceSummaryTable(contractContent);

  // 3. Calculate component scores
  const completenessScore = calculateCompletenessScore(tableData, config);
  const complianceScore = calculateComplianceScoreValue(tableData, config);
  const qualityScore = calculateQualityScore(tableData, config);

  // 4. Apply weights and calculate final score
  const finalScore =
    (completenessScore * config.scoring.weights.completeness) +
    (complianceScore * config.scoring.weights.compliance) +
    (qualityScore * config.scoring.weights.quality);

  // 5. Determine outcome tier
  const outcome = determineOutcome(finalScore, config);

  return {
    final_score: parseFloat(finalScore.toFixed(1)),
    completeness_score: parseFloat(completenessScore.toFixed(1)),
    compliance_score: parseFloat(complianceScore.toFixed(1)),
    quality_score: parseFloat(qualityScore.toFixed(1)),
    status_counts: tableData.statusCounts,
    outcome: outcome,
    validation_date: new Date().toISOString().split('T')[0],
  };
}

// ============================================================================
// Table Parsing
// ============================================================================

/**
 * Parse Compliance Summary table from contract markdown
 */
export function parseComplianceSummaryTable(content: string): ComplianceTableData {
  // 1. Find "## Compliance Summary" section
  const summaryMatch = content.match(
    /##\s+Compliance Summary\s*\n([\s\S]*?)(?=\n##|\*\*Overall Compliance\*\*|$)/
  );

  if (!summaryMatch) {
    throw new Error('Compliance Summary section not found in contract');
  }

  // 2. Extract table section
  const tableSection = summaryMatch[1];
  const tableLines = tableSection.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---');
  });

  if (tableLines.length < 2) {
    throw new Error('Compliance Summary table has insufficient rows (expected header + data rows)');
  }

  // 3. Skip header row, parse data rows
  const dataRows = tableLines.slice(1); // Skip header

  // 4. Initialize status counts
  const statusCounts = {
    Compliant: 0,
    'Non-Compliant': 0,
    'Not Applicable': 0,
    Unknown: 0,
  };

  const requirements: Requirement[] = [];

  // 5. Parse each data row
  for (const row of dataRows) {
    const cols = parseTableRow(row);

    if (cols.length < 6) {
      console.warn(`Skipping malformed row (expected 6 columns, got ${cols.length}): ${row}`);
      continue;
    }

    const code = cols[0].trim();
    const requirement = cols[1].trim();
    const category = cols[2].trim();
    const status = cols[3].trim();
    const sourceSection = cols[4].trim();
    const role = cols[5].trim();

    // Count status (handle case variations)
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus in statusCounts) {
      statusCounts[normalizedStatus as keyof typeof statusCounts]++;
    } else {
      console.warn(`Unknown status value: "${status}" in requirement ${code}`);
    }

    // Track requirement details
    requirements.push({
      code,
      requirement,
      category,
      status: normalizedStatus,
      sourceSection,
      role,
      hasSource: !sourceSection.toLowerCase().includes('not specified') &&
                 !sourceSection.toLowerCase().includes('not documented') &&
                 sourceSection.trim() !== 'N/A' &&
                 sourceSection.trim() !== '',
    });
  }

  return {
    requirements,
    statusCounts,
    totalRequirements: requirements.length,
  };
}

/**
 * Parse markdown table row into columns
 */
function parseTableRow(row: string): string[] {
  return row
    .split('|')
    .slice(1, -1) // Remove leading and trailing empty strings
    .map(col => col.trim());
}

/**
 * Normalize status value to standard form
 */
function normalizeStatus(status: string): string {
  const normalized = status.trim();

  // Handle exact matches (case-sensitive for standard values)
  if (['Compliant', 'Non-Compliant', 'Not Applicable', 'Unknown'].includes(normalized)) {
    return normalized;
  }

  // Handle common variations (case-insensitive)
  const lower = normalized.toLowerCase();
  if (lower === 'compliant') return 'Compliant';
  if (lower === 'non-compliant' || lower === 'noncompliant') return 'Non-Compliant';
  if (lower === 'not applicable' || lower === 'n/a') return 'Not Applicable';
  if (lower === 'unknown') return 'Unknown';

  // Return as-is if no match (will trigger warning in caller)
  return normalized;
}

// ============================================================================
// Score Calculation Functions
// ============================================================================

/**
 * Calculate completeness score (0-10)
 * Completeness = (Filled required fields / Total required fields) × 10
 *
 * Definition: Requirements with non-UNKNOWN status are considered "filled"
 */
export function calculateCompletenessScore(
  tableData: ComplianceTableData,
  config: ValidationConfig
): number {
  if (tableData.totalRequirements === 0) {
    return 0;
  }

  // Count requirements with non-Unknown status (data available)
  const filledRequirements = tableData.requirements.filter(
    req => req.status !== 'Unknown'
  ).length;

  const completeness = filledRequirements / tableData.totalRequirements;
  return completeness * 10;
}

/**
 * Calculate compliance score (0-10)
 * Compliance = (PASS + N/A items) / Total items × 10
 *
 * Status Mapping:
 * - Compliant → PASS (10 points)
 * - Non-Compliant → FAIL (0 points)
 * - Not Applicable → N/A (10 points)
 * - Unknown → UNKNOWN (0 points)
 */
export function calculateComplianceScoreValue(
  tableData: ComplianceTableData,
  config: ValidationConfig
): number {
  if (tableData.totalRequirements === 0) {
    return 0;
  }

  const { statusCounts } = tableData;

  // PASS + N/A items (both count as compliant)
  const passItems = statusCounts.Compliant + statusCounts['Not Applicable'];

  // Total items
  const totalItems = tableData.totalRequirements;

  const compliance = passItems / totalItems;
  return compliance * 10;
}

/**
 * Calculate quality score (0-10)
 * Quality = (Items with valid sources / Total items) × 10
 */
export function calculateQualityScore(
  tableData: ComplianceTableData,
  config: ValidationConfig
): number {
  if (tableData.totalRequirements === 0) {
    return 0;
  }

  const itemsWithSources = tableData.requirements.filter(
    req => req.hasSource
  ).length;

  const quality = itemsWithSources / tableData.totalRequirements;
  return quality * 10;
}

/**
 * Determine outcome tier based on final score
 */
export function determineOutcome(
  finalScore: number,
  config: ValidationConfig
): OutcomeTier {
  const { thresholds } = config.scoring;

  if (finalScore >= thresholds.auto_approve) {
    return {
      overall_status: 'PASS',
      document_status: 'Approved',
      action: 'AUTO_APPROVE',
      review_actor: 'System (Auto-Approved)',
    };
  } else if (finalScore >= thresholds.ready_for_review) {
    return {
      overall_status: 'PASS',
      document_status: 'In Review',
      action: 'MANUAL_REVIEW',
      review_actor: config.approval_authority,
    };
  } else if (finalScore >= thresholds.needs_work) {
    return {
      overall_status: 'CONDITIONAL',
      document_status: 'Draft',
      action: 'NEEDS_WORK',
      review_actor: 'Architecture Team',
    };
  } else {
    return {
      overall_status: 'FAIL',
      document_status: 'Rejected',
      action: 'REJECT',
      review_actor: 'N/A (Blocked)',
    };
  }
}

// ============================================================================
// Configuration Loading
// ============================================================================

/**
 * Load validation configuration from JSON file
 */
export function loadValidationConfig(configPath: string): ValidationConfig {
  try {
    // Strip leading slash and any skills/architecture-compliance/ prefix
    // to get just the relative path within the skill directory (e.g., "validation/xxx.json")
    const normalized = configPath
      .replace(/^\//, '')
      .replace(/^skills\/architecture-compliance\//, '');
    const fullPath = join(SKILL_DIR, normalized);
    const content = readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as ValidationConfig;
  } catch (error) {
    throw new Error(`Failed to load validation config from ${configPath}: ${error}`);
  }
}

// Export for testing
export { parseTableRow, normalizeStatus };
