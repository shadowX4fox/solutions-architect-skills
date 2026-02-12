#!/usr/bin/env bun

import { ValidationScore } from './score-calculator';

/**
 * Compliance Contract Field Updater
 *
 * Updates contract markdown content with validation scores by:
 * 1. Replacing Document Control placeholder fields
 * 2. Updating Overall Compliance footer with actual counts
 * 3. Updating Remediation Section A.3.3 with current status and estimates
 *
 * @module field-updater
 */

// ============================================================================
// Main Function
// ============================================================================

/**
 * Update contract content with validation scores
 *
 * @param contractContent - Original contract markdown content
 * @param validationScore - Calculated validation score object
 * @returns Updated contract content with validation fields populated
 */
export function updateContractWithValidation(
  contractContent: string,
  validationScore: ValidationScore
): string {
  let updatedContent = contractContent;

  // 1. Update Document Control fields
  updatedContent = updateDocumentControlFields(updatedContent, validationScore);

  // 2. Update Overall Compliance footer
  updatedContent = updateComplianceFooter(updatedContent, validationScore);

  // 3. Update Remediation Section A.3.3
  updatedContent = updateRemediationSection(updatedContent, validationScore);

  return updatedContent;
}

// ============================================================================
// Document Control Fields
// ============================================================================

/**
 * Update Document Control table fields with validation results
 */
function updateDocumentControlFields(
  content: string,
  score: ValidationScore
): string {
  let updated = content;

  // Replace [VALIDATION_SCORE] with actual score (template already has "/10" suffix)
  updated = updated.replace(
    /\[VALIDATION_SCORE\]/g,
    score.final_score.toFixed(1)
  );
  // Fallback: match already-replaced "Not performed" in validation score row
  // Handles both "Not performed/10" (template suffix kept) and "Not performed" (suffix stripped)
  updated = updated.replace(
    /(\| Validation Score\s*\| )Not performed(?:\/10)?( \|)/g,
    `$1${score.final_score.toFixed(1)}/10$2`
  );

  // Replace [VALIDATION_STATUS] with outcome status
  updated = updated.replace(
    /\[VALIDATION_STATUS\]/g,
    score.outcome.overall_status
  );
  // Fallback: match already-replaced "Not performed" in validation status row
  updated = updated.replace(
    /(\| Validation Status\s*\| )Not performed( \|)/g,
    `$1${score.outcome.overall_status}$2`
  );

  // Replace [VALIDATION_DATE] with current date
  updated = updated.replace(
    /\[VALIDATION_DATE\]/g,
    score.validation_date
  );
  // Fallback: match already-replaced "Not performed" in validation date row
  updated = updated.replace(
    /(\| Validation Date\s*\| )Not performed( \|)/g,
    `$1${score.validation_date}$2`
  );

  // Replace [DOCUMENT_STATUS] with outcome document status
  updated = updated.replace(
    /\[DOCUMENT_STATUS\]/g,
    score.outcome.document_status
  );
  // Fallback: match already-replaced "Draft" in status row
  updated = updated.replace(
    /(\| Status\s*\| )Draft( \|)/g,
    `$1${score.outcome.document_status}$2`
  );

  // Replace [REVIEW_ACTOR] with outcome review actor
  updated = updated.replace(
    /\[REVIEW_ACTOR\]/g,
    score.outcome.review_actor
  );
  // Fallback: match already-replaced review board names in Document Control review actor row
  // Only match rows where "Review Actor" is in the Field column (first cell), not Value column
  // Pattern: line starts with | Review Actor | <value> | (exactly 2 cells, Field-Value table)
  updated = updated.replace(
    /^(\| Review Actor\s*\| )[^|\n]+( \|)\s*$/gm,
    `$1${score.outcome.review_actor}$2`
  );

  // Replace [VALIDATION_EVALUATOR] if present (some templates might have this placeholder)
  updated = updated.replace(
    /\[VALIDATION_EVALUATOR\]/g,
    'Claude Code (Automated Validation Engine)'
  );

  return updated;
}

// ============================================================================
// Overall Compliance Footer
// ============================================================================

/**
 * Update Overall Compliance footer with status counts and percentages
 */
function updateComplianceFooter(
  content: string,
  score: ValidationScore
): string {
  const statusCounts = score.status_counts ?? (score as any).statusCounts;
  const total =
    statusCounts.Compliant +
    statusCounts['Non-Compliant'] +
    statusCounts['Not Applicable'] +
    statusCounts.Unknown;

  if (total === 0) {
    return content; // Graceful degradation: no requirements to update
  }

  // Calculate percentages
  const compliantPct = Math.round((statusCounts.Compliant / total) * 100);
  const nonCompliantPct = Math.round((statusCounts['Non-Compliant'] / total) * 100);
  const naPct = Math.round((statusCounts['Not Applicable'] / total) * 100);
  const unknownPct = Math.round((statusCounts.Unknown / total) * 100);

  // Find Overall Compliance section
  const footerPattern = /\*\*Overall Compliance\*\*:\s*\n([\s\S]*?)(?=\n\*\*Completeness\*\*|\n##|$)/;
  const match = content.match(footerPattern);

  if (!match) {
    // Graceful degradation: section not found, skip update
    console.warn('Overall Compliance footer section not found, skipping update');
    return content;
  }

  // Build updated footer
  const updatedFooter = `**Overall Compliance**:
- ✅ Compliant: ${statusCounts.Compliant}/${total} (${compliantPct}%)
- ❌ Non-Compliant: ${statusCounts['Non-Compliant']}/${total} (${nonCompliantPct}%)
- ⊘ Not Applicable: ${statusCounts['Not Applicable']}/${total} (${naPct}%)
- ❓ Unknown: ${statusCounts.Unknown}/${total} (${unknownPct}%)
`;

  return content.replace(footerPattern, updatedFooter);
}

// ============================================================================
// Remediation Section A.3.3
// ============================================================================

/**
 * Update Remediation Section A.3.3 with current status and score estimates
 */
function updateRemediationSection(
  content: string,
  score: ValidationScore
): string {
  // Find Section A.3.3 (or similar heading patterns)
  const remediationPattern = /(####\s+A\.3\.3\s+Achieving Auto-Approve Status[\s\S]*?)(?=####\s+A\.|---\s*\n###\s+A\.4|$)/;
  const match = content.match(remediationPattern);

  if (!match) {
    // Try alternative pattern (## A.3.3 or ### A.3.3)
    const altPattern = /(###?\s+A\.3\.3\s+Achieving Auto-Approve Status[\s\S]*?)(?=###?\s+A\.|---\s*\n##|$)/;
    const altMatch = content.match(altPattern);

    if (!altMatch) {
      // Graceful degradation: section not found
      console.warn('Remediation Section A.3.3 not found, skipping update');
      return content;
    }

    return updateRemediationSectionContent(content, altMatch[1], altPattern, score);
  }

  return updateRemediationSectionContent(content, match[1], remediationPattern, score);
}

/**
 * Helper function to update remediation section content
 */
function updateRemediationSectionContent(
  content: string,
  remediationSection: string,
  pattern: RegExp,
  score: ValidationScore
): string {
  let updatedSection = remediationSection;

  // Update "Current Status:" line
  const statusLinePattern = /Current Status:\s+\d+\s+Compliant,\s+\d+\s+Unknown,\s+\d+\s+Not Applicable/;
  if (statusLinePattern.test(updatedSection)) {
    const statusCounts = score.status_counts ?? (score as any).statusCounts;
    const updatedStatusLine = `Current Status: ${statusCounts.Compliant} Compliant, ${statusCounts.Unknown} Unknown, ${statusCounts['Not Applicable']} Not Applicable`;

    updatedSection = updatedSection.replace(
      statusLinePattern,
      updatedStatusLine
    );
  }

  // Update "Estimated Final Score After Remediation" line
  const estimatePattern = /\*\*Estimated Final Score After Remediation\*\*:\s+[\d.]+-[\d.]+\/10\s+\([A-Z_]+\)/;
  if (estimatePattern.test(updatedSection)) {
    // Calculate optimistic estimate (if all UNKNOWN become PASS)
    const optimisticScore = calculateOptimisticScore(score);
    const pessimisticScore = score.final_score; // Current score is pessimistic

    // Determine action based on optimistic score
    const estimateAction = optimisticScore >= 8.0 ? 'AUTO_APPROVE' :
                          optimisticScore >= 7.0 ? 'MANUAL_REVIEW' :
                          optimisticScore >= 5.0 ? 'NEEDS_WORK' : 'REJECT';

    const updatedEstimate = `**Estimated Final Score After Remediation**: ${pessimisticScore.toFixed(1)}-${optimisticScore.toFixed(1)}/10 (${estimateAction})`;

    updatedSection = updatedSection.replace(
      estimatePattern,
      updatedEstimate
    );
  }

  return content.replace(pattern, updatedSection);
}

/**
 * Calculate optimistic score assuming all UNKNOWN items become PASS
 */
function calculateOptimisticScore(score: ValidationScore): number {
  const statusCounts = score.status_counts ?? (score as any).statusCounts;
  const total =
    statusCounts.Compliant +
    statusCounts['Non-Compliant'] +
    statusCounts['Not Applicable'] +
    statusCounts.Unknown;

  if (total === 0) {
    return 0;
  }

  // Optimistic: All Unknown → Compliant
  const optimisticCompliant = statusCounts.Compliant + statusCounts.Unknown;

  // Recalculate component scores
  const optimisticCompletenessScore = 10.0; // All fields filled
  const optimisticComplianceScore =
    ((optimisticCompliant + statusCounts['Not Applicable']) / total) * 10;
  const optimisticQualityScore = score.quality_score; // Assume quality unchanged

  // Apply same weights (approximate - we don't have config here, use common weights)
  // NOTE: In production, you might want to pass config or detect from score ratios
  const weights = estimateWeightsFromScore(score);

  return (
    optimisticCompletenessScore * weights.completeness +
    optimisticComplianceScore * weights.compliance +
    optimisticQualityScore * weights.quality
  );
}

/**
 * Estimate weights from current score (reverse calculation)
 * This is a heuristic - in production, consider passing config to field-updater
 */
function estimateWeightsFromScore(score: ValidationScore): {
  completeness: number;
  compliance: number;
  quality: number;
} {
  // Use common default weights if reverse calculation is complex
  // Most templates use similar weights: ~40% completeness, ~50% compliance, ~10% quality
  return {
    completeness: 0.4,
    compliance: 0.5,
    quality: 0.1,
  };
}

// Export for testing
export {
  updateDocumentControlFields,
  updateComplianceFooter,
  updateRemediationSection,
  calculateOptimisticScore,
};
