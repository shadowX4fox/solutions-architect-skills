#!/usr/bin/env bun

/**
 * Template Include Resolution Utility (Bun/TypeScript)
 *
 * Resolves @include and @include-with-config directives in compliance templates.
 * Optimized for performance using Bun's fast file I/O APIs.
 *
 * Usage:
 *   bun resolve-includes.ts <template-file> [output-file] [--validate]
 *   ./resolve-includes.ts <template-file> [output-file] [--validate]
 *
 * Options:
 *   --validate    Run template structure pre-validation after expansion
 *
 * If output-file is omitted, outputs to stdout.
 */

import { resolve, join, basename } from 'path';
import { existsSync } from 'fs';
import {
  validateTemplateStructure,
  generateTemplateValidationReport
} from './template-prevalidator';

// Configuration
const SKILL_DIR = resolve(import.meta.dir, '..');
const MAX_DEPTH = 3;

// Type Definitions
interface DomainConfig {
  domain_name: string;
  compliance_prefix: string;
  review_board: string;
  approval_authority: string;
  validation_config_path: string;
  domain_terms?: Record<string, string>;
  abbreviations?: Record<string, string>;
}

interface IncludeDirective {
  full: string;
  type: 'simple' | 'with-config';
  filePath: string;
  configName?: string;
}

/**
 * Load a JSON config file using Bun's fast file API
 */
async function loadConfig(configName: string): Promise<DomainConfig> {
  const configPath = join(SKILL_DIR, 'shared', 'config', `${configName}.json`);

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  // Bun's optimized JSON loading
  return await Bun.file(configPath).json<DomainConfig>();
}

/**
 * Replace {{variables}} in content with values from config
 */
function replaceVariables(content: string, config: DomainConfig): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = config[varName as keyof DomainConfig];
    if (value !== undefined) {
      return String(value);
    }
    // Keep the placeholder if variable not found in config
    console.warn(`Warning: Variable {{${varName}}} not found in config`);
    return match;
  });
}

/**
 * Parse an include directive
 */
function parseDirective(directiveText: string): IncludeDirective | null {
  // Pattern: <!-- @include(-with-config)? path/to/file.md (config=name)? -->
  const pattern = /<!--\s*@include(-with-config)?\s+(.+?)\s*(?:config=(\S+))?\s*-->/;
  const match = directiveText.match(pattern);

  if (!match) {
    return null;
  }

  return {
    full: match[0],
    type: match[1] ? 'with-config' : 'simple',
    filePath: match[2].trim(),
    configName: match[3] || undefined
  };
}

/**
 * Resolve a single include directive
 */
async function resolveInclude(
  directive: IncludeDirective,
  config: DomainConfig | null,
  depth: number,
  processedFiles: Set<string>
): Promise<string> {
  const { type, filePath, configName } = directive;

  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    throw new Error(`Max include depth (${MAX_DEPTH}) exceeded`);
  }

  // Resolve file path relative to skill directory
  const fullPath = join(SKILL_DIR, filePath);

  // Detect circular includes
  if (processedFiles.has(fullPath)) {
    throw new Error(`Circular include detected: ${filePath}`);
  }

  if (!existsSync(fullPath)) {
    throw new Error(`Include file not found: ${fullPath}`);
  }

  // Read the included file using Bun's fast API
  let content = await Bun.file(fullPath).text();

  // Mark as processed
  processedFiles.add(fullPath);

  // If it's a parameterized include, load config and replace variables
  if (type === 'with-config') {
    if (!configName) {
      throw new Error(`Config name required for @include-with-config: ${filePath}`);
    }

    const domainConfig = config || await loadConfig(configName);
    content = replaceVariables(content, domainConfig);
  }

  // Recursively resolve nested includes
  content = await resolveIncludes(content, config, depth + 1, processedFiles);

  // Remove from processed to allow reuse in different branches
  processedFiles.delete(fullPath);

  return content;
}

/**
 * Resolve all includes in content
 */
async function resolveIncludes(
  content: string,
  config: DomainConfig | null = null,
  depth: number = 0,
  processedFiles: Set<string> = new Set()
): Promise<string> {
  // Find all include directives
  const includePattern = /<!--\s*@include(-with-config)?\s+.+?\s*(?:config=\S+)?\s*-->/g;

  let result = content;
  const matches = Array.from(content.matchAll(includePattern));

  // Process all includes
  for (const match of matches) {
    const directive = parseDirective(match[0]);

    if (!directive) {
      console.warn(`Warning: Could not parse directive: ${match[0]}`);
      continue;
    }

    try {
      const resolvedContent = await resolveInclude(directive, config, depth, processedFiles);
      result = result.replace(directive.full, resolvedContent);
    } catch (error) {
      console.error(`Error resolving include: ${directive.filePath}`);
      console.error((error as Error).message);
      // Keep the directive in place on error
    }
  }

  return result;
}

/**
 * Extract contract type from template filename
 * Example: TEMPLATE_SRE_ARCHITECTURE.md → sre_architecture
 */
function extractContractType(templatePath: string): string | null {
  const filename = basename(templatePath, '.md');

  // Pattern: TEMPLATE_CONTRACT_TYPE or template_contract_type
  const match = filename.match(/^TEMPLATE_(.+)$/i);
  if (!match) {
    return null;
  }

  // Convert to lowercase with underscores
  return match[1].toLowerCase();
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: bun resolve-includes.ts <template-file> [output-file] [--validate]');
    console.error('');
    console.error('Options:');
    console.error('  --validate    Run template structure pre-validation after expansion');
    console.error('');
    console.error('Example:');
    console.error('  bun resolve-includes.ts templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md');
    console.error('  bun resolve-includes.ts templates/TEMPLATE_SRE_ARCHITECTURE.md expanded.md --validate');
    console.error('  ./resolve-includes.ts templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md --validate');
    process.exit(1);
  }

  // Parse arguments
  const validateFlag = args.includes('--validate');
  const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));

  const templatePath = nonFlagArgs[0];
  const outputPath = nonFlagArgs[1] || null;

  if (!existsSync(templatePath)) {
    console.error(`Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }

  try {
    // Read template using Bun's fast file API
    const content = await Bun.file(templatePath).text();

    // Resolve includes
    const expanded = await resolveIncludes(content);

    // Pre-validation (Phase 4.1)
    if (validateFlag) {
      const contractType = extractContractType(templatePath);

      if (!contractType) {
        console.error('Warning: Could not extract contract type from filename. Skipping validation.');
        console.error('Expected filename format: TEMPLATE_CONTRACT_TYPE.md');
      } else {
        console.log('\n📋 Running template structure pre-validation...');

        const validationResult = await validateTemplateStructure(expanded, contractType);
        const report = generateTemplateValidationReport(validationResult, contractType);

        console.log(report);

        if (!validationResult.isValid) {
          console.error('\n❌ Template validation failed. Fix errors before proceeding.');
          process.exit(1);
        }

        console.log('');
      }
    }

    // Output
    if (outputPath) {
      await Bun.write(outputPath, expanded);
      console.log(`✅ Template expanded successfully: ${outputPath}`);

      // Show statistics
      const originalLines = content.split('\n').length;
      const expandedLines = expanded.split('\n').length;
      console.log(`   Lines: ${originalLines} → ${expandedLines} (+${expandedLines - originalLines})`);
    } else {
      console.log(expanded);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

// Export for testing
export { resolveIncludes, loadConfig, replaceVariables };
