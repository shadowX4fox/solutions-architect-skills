#!/usr/bin/env bun
/**
 * Standalone CLI Tool for Compliance Contract Validation
 *
 * Validates existing compliance contract documents against template rules.
 * Useful for testing validation rules, auditing existing documents, or
 * validating contracts generated outside the main workflow.
 *
 * Usage:
 *   bun run utils/validate-cli.ts <contract-file> <contract-type>
 *   bun run utils/validate-cli.ts compliance-docs/sre_architecture.md sre_architecture
 *   bun run utils/validate-cli.ts --help
 *
 * Options:
 *   --markdown     Generate markdown report instead of console output
 *   --compact      Show compact summary only
 *   --strict       Exit with non-zero code on warnings
 *   --help         Show this help message
 *
 * Examples:
 *   # Validate SRE Architecture contract
 *   bun run utils/validate-cli.ts compliance-docs/sre_architecture.md sre_architecture
 *
 *   # Validate with markdown report
 *   bun run utils/validate-cli.ts compliance-docs/cloud.md cloud_architecture --markdown
 *
 *   # Compact summary for CI/CD
 *   bun run utils/validate-cli.ts compliance-docs/security.md security_architecture --compact
 *
 *   # List supported contract types
 *   bun run utils/validate-cli.ts --list-types
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import {
  validateGeneratedContract,
  getSupportedContractTypes,
  getContractDisplayName,
  printValidationResult,
} from './generation-helper';
import { ErrorReporter } from './error_reporter';

// Parse command line arguments
const args = process.argv.slice(2);

// Help flag
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

// List types flag
if (args.includes('--list-types')) {
  listContractTypes();
  process.exit(0);
}

// Parse options
const options = {
  markdown: args.includes('--markdown'),
  compact: args.includes('--compact'),
  strict: args.includes('--strict'),
};

// Get positional arguments (filter out options)
const positionalArgs = args.filter(arg => !arg.startsWith('--'));

if (positionalArgs.length < 2) {
  console.error('Error: Missing required arguments\n');
  printHelp();
  process.exit(1);
}

const [contractFilePath, contractType] = positionalArgs;

// Validate arguments
if (!getSupportedContractTypes().includes(contractType)) {
  console.error(`Error: Unknown contract type "${contractType}"\n`);
  console.error('Supported types:');
  getSupportedContractTypes().forEach(type => {
    console.error(`  - ${type} (${getContractDisplayName(type)})`);
  });
  process.exit(1);
}

// Main validation flow
async function main() {
  try {
    // Read contract file
    const absolutePath = resolve(contractFilePath);
    const content = await readFile(absolutePath, 'utf-8');

    console.log('═'.repeat(80));
    console.log('Compliance Contract Validation CLI');
    console.log('═'.repeat(80));
    console.log(`File: ${absolutePath}`);
    console.log(`Contract Type: ${getContractDisplayName(contractType)}`);
    console.log(`Options: ${JSON.stringify(options)}`);
    console.log('═'.repeat(80));
    console.log();

    // Run validation
    const result = await validateGeneratedContract(content, contractType, {
      includeMarkdownReport: options.markdown,
    });

    // Output based on options
    if (options.compact) {
      // Compact summary
      console.log(result.compactSummary);
    } else if (options.markdown && result.markdownReport) {
      // Markdown report
      console.log(result.markdownReport);
    } else {
      // Full console report (default)
      printValidationResult(result);
    }

    // Exit code
    if (!result.isValid) {
      // Validation failed - always exit with error
      process.exit(1);
    } else if (options.strict && result.validationResult.warnings.length > 0) {
      // Strict mode - exit with error on warnings
      console.error(`\nStrict mode: Exiting with error due to ${result.validationResult.warnings.length} warning(s)`);
      process.exit(1);
    } else {
      // Success
      process.exit(0);
    }
  } catch (error) {
    console.error('═'.repeat(80));
    console.error('VALIDATION ERROR');
    console.error('═'.repeat(80));
    console.error();

    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack && process.env.DEBUG) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }

    console.error();
    console.error('═'.repeat(80));
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Compliance Contract Validation CLI

Usage:
  bun run utils/validate-cli.ts <contract-file> <contract-type> [options]

Arguments:
  contract-file    Path to compliance contract markdown file
  contract-type    Type of contract (see --list-types)

Options:
  --markdown       Generate markdown report instead of console output
  --compact        Show compact summary only
  --strict         Exit with non-zero code on warnings
  --list-types     List all supported contract types
  --help, -h       Show this help message

Exit Codes:
  0                Validation passed (no errors, or warnings in non-strict mode)
  1                Validation failed or errors occurred

Examples:
  # Validate SRE Architecture contract
  bun run utils/validate-cli.ts compliance-docs/sre_architecture.md sre_architecture

  # Validate with markdown report
  bun run utils/validate-cli.ts compliance-docs/cloud.md cloud_architecture --markdown

  # Compact summary for CI/CD pipelines
  bun run utils/validate-cli.ts compliance-docs/security.md security_architecture --compact

  # Strict mode (fail on warnings)
  bun run utils/validate-cli.ts compliance-docs/data_ai.md data_ai_architecture --strict

  # List all supported contract types
  bun run utils/validate-cli.ts --list-types

Environment Variables:
  DEBUG=1          Show stack traces on errors

For more information, see:
  - VALIDATION_FRAMEWORK_GUIDE.md
  - validation/VALIDATION_RULE_EXAMPLES.md
`);
}

function listContractTypes() {
  console.log('\nSupported Contract Types:\n');

  const types = getSupportedContractTypes();
  const maxTypeLength = Math.max(...types.map(t => t.length));

  types.forEach(type => {
    const displayName = getContractDisplayName(type);
    const padding = ' '.repeat(maxTypeLength - type.length + 2);
    console.log(`  ${type}${padding}→  ${displayName}`);
  });

  console.log(`\nTotal: ${types.length} contract types\n`);
}

// Run CLI
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
