#!/usr/bin/env bun

/**
 * CLI wrapper for questions-register-populator.ts
 *
 * Usage:
 *   bun questions-register-populator-cli.ts \
 *     --input compliance-docs/CC-010-sre-architecture_Project_2026-03-25.md \
 *     --validation validation/cc-010-sre-architecture-validation.json
 *
 * Reads the contract file, populates the Questions & Gaps Register,
 * and writes the updated content back to the same file.
 */

import { populateQuestionsRegister } from './questions-register-populator';

function parseArgs(args: string[]): { input: string; validation: string } | null {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (!key || value === undefined) continue;
    parsed[key] = value;
  }

  if (!parsed['input']) {
    console.error('Error: Missing required argument --input');
    return null;
  }
  if (!parsed['validation']) {
    console.error('Error: Missing required argument --validation');
    return null;
  }

  return { input: parsed['input'], validation: parsed['validation'] };
}

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Questions & Gaps Register Populator

Reads a compliance contract, populates the ## Questions & Gaps Register
table from the Compliance Summary, and writes the result back in-place.

Usage:
  bun questions-register-populator-cli.ts \\
    --input <contract.md> \\
    --validation <validation/cc-NNN-name-validation.json>

Arguments:
  --input       Path to the compliance contract markdown file
  --validation  Path to the domain validation JSON config
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  try {
    const content = await Bun.file(parsed.input).text();
    const updated = populateQuestionsRegister(content, parsed.validation);
    await Bun.write(parsed.input, updated);
    console.log(`✓ Questions & Gaps Register populated: ${parsed.input}`);
  } catch (error) {
    console.error(`Failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
