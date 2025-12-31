#!/usr/bin/env bun

import { calculateComplianceScore } from './score-calculator';
import { readFileSync, writeFileSync } from 'fs';

/**
 * CLI wrapper for score calculator
 *
 * Usage:
 *   bun score-calculator-cli.ts <contract_file> <validation_config>
 *
 * Example:
 *   bun score-calculator-cli.ts /tmp/contract.md validation/business_continuity_validation.json
 *
 * Output:
 *   - JSON to stdout
 *   - JSON written to /tmp/validation_score.json for next step
 *   - Exit code 0 on success, 1 on error
 */

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: bun score-calculator-cli.ts <contract_file> <validation_config>');
  console.error('');
  console.error('Example:');
  console.error('  bun score-calculator-cli.ts /tmp/contract.md validation/business_continuity_validation.json');
  process.exit(1);
}

const [contractFile, validationConfig] = args;

try {
  // Read contract content
  const contractContent = readFileSync(contractFile, 'utf-8');

  // Calculate score
  const score = calculateComplianceScore(contractContent, validationConfig);

  // Output JSON to stdout
  const jsonOutput = JSON.stringify(score, null, 2);
  console.log(jsonOutput);

  // Write to temp file for next step
  writeFileSync('/tmp/validation_score.json', jsonOutput);

  console.error(`✅ Validation score calculated: ${score.final_score.toFixed(1)}/10 (${score.outcome.overall_status})`);

  process.exit(0);
} catch (error) {
  console.error(`❌ Validation calculation failed: ${error}`);

  // Write error placeholder
  const errorScore = {
    final_score: 0,
    completeness_score: 0,
    compliance_score: 0,
    quality_score: 0,
    status_counts: {
      Compliant: 0,
      'Non-Compliant': 0,
      'Not Applicable': 0,
      Unknown: 0,
    },
    outcome: {
      overall_status: 'FAIL',
      document_status: 'Draft',
      action: 'NEEDS_WORK',
      review_actor: 'Architecture Team',
    },
    validation_date: 'Not performed',
    error: String(error),
  };

  writeFileSync('/tmp/validation_score.json', JSON.stringify(errorScore, null, 2));

  process.exit(1);
}
