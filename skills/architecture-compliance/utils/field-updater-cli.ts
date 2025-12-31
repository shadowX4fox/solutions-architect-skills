#!/usr/bin/env bun

import { updateContractWithValidation } from './field-updater';
import { ValidationScore } from './score-calculator';
import { readFileSync, writeFileSync } from 'fs';

/**
 * CLI wrapper for field updater
 *
 * Usage:
 *   bun field-updater-cli.ts <contract_file> <score_json> <output_file>
 *
 * Example:
 *   bun field-updater-cli.ts /tmp/contract.md /tmp/score.json /tmp/final.md
 *
 * Output:
 *   - Updated contract written to output_file
 *   - Summary to stdout
 *   - Exit code 0 on success, 1 on error
 */

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: bun field-updater-cli.ts <contract_file> <score_json> <output_file>');
  console.error('');
  console.error('Example:');
  console.error('  bun field-updater-cli.ts /tmp/contract.md /tmp/score.json /tmp/final.md');
  process.exit(1);
}

const [contractFile, scoreJsonFile, outputFile] = args;

try {
  // Read inputs
  const contractContent = readFileSync(contractFile, 'utf-8');
  const scoreJson = readFileSync(scoreJsonFile, 'utf-8');
  const validationScore = JSON.parse(scoreJson) as ValidationScore;

  // Update contract
  const updatedContract = updateContractWithValidation(contractContent, validationScore);

  // Write output
  writeFileSync(outputFile, updatedContract);

  console.log(`✅ Contract updated successfully: ${outputFile}`);
  console.log(`   Validation Score: ${validationScore.final_score.toFixed(1)}/10`);
  console.log(`   Status: ${validationScore.outcome.overall_status}`);
  console.log(`   Action: ${validationScore.outcome.action}`);
  console.log(`   Document Status: ${validationScore.outcome.document_status}`);

  process.exit(0);
} catch (error) {
  console.error(`❌ Field update failed: ${error}`);

  // Fallback: Copy original contract to output with error placeholders
  try {
    const contractContent = readFileSync(contractFile, 'utf-8');

    // Replace validation placeholders with error values
    const fallbackContent = contractContent
      .replace(/\[VALIDATION_SCORE\]/g, 'Error')
      .replace(/\[VALIDATION_STATUS\]/g, 'Error')
      .replace(/\[VALIDATION_DATE\]/g, 'Not performed')
      .replace(/\[DOCUMENT_STATUS\]/g, 'Draft');

    writeFileSync(outputFile, fallbackContent);
    console.warn('⚠️  Validation failed - contract written with default/error values');
    console.warn(`    Output: ${outputFile}`);
  } catch (fallbackError) {
    console.error(`❌ Critical failure: ${fallbackError}`);
    process.exit(1);
  }

  process.exit(1);
}
