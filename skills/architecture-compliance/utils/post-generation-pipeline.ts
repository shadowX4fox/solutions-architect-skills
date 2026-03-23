#!/usr/bin/env bun

/**
 * Post-Generation Pipeline (Bun/TypeScript)
 *
 * Single-invocation script that replaces the orchestrator's per-contract Bash calls:
 * score-calculator → field-updater → manifest-generator.
 *
 * Usage:
 *   bun post-generation-pipeline.ts \
 *     --compliance-docs-dir /path/to/compliance-docs \
 *     --project "Project Name"
 *
 * What it does:
 *   1. Scans compliance-docs-dir for *.md files (excluding COMPLIANCE_MANIFEST.md)
 *   2. For each contract: calculate score, update fields with scores, write back
 *   3. Generate COMPLIANCE_MANIFEST.md in one pass
 *   4. Output JSON summary to stdout
 */

import { resolve, join, basename } from 'path';
import { readdirSync, existsSync } from 'fs';
import { calculateComplianceScore } from './score-calculator';
import { updateContractWithValidation } from './field-updater';
import {
  generateManifestContent,
  type ContractMetadata,
  type ManifestData
} from './manifest-generator';
import { getContractDisplayName, getLocalDateString } from './generation-helper';

// Configuration
const MANIFEST_FILENAME = 'COMPLIANCE_MANIFEST.md';

// Contract filename prefix → contract type key
const FILENAME_PREFIX_TO_CONTRACT_TYPE: Record<string, string> = {
  INTEGRATION_ARCHITECTURE: 'integration_architecture',
  SECURITY_ARCHITECTURE: 'security_architecture',
  CLOUD_ARCHITECTURE: 'cloud_architecture',
  DEVELOPMENT_ARCHITECTURE: 'development_architecture',
  SRE_ARCHITECTURE: 'sre_architecture',
  BUSINESS_CONTINUITY: 'business_continuity',
  DATA_AI_ARCHITECTURE: 'data_ai_architecture',
  ENTERPRISE_ARCHITECTURE: 'enterprise_architecture',
  PLATFORM_IT_INFRASTRUCTURE: 'platform_it_infrastructure',
  PROCESS_TRANSFORMATION: 'process_transformation',
};

// Contract type key → validation config path (relative to SKILL_DIR, resolved by score-calculator)
const CONTRACT_TYPE_TO_VALIDATION: Record<string, string> = {
  integration_architecture: 'validation/integration_architecture_validation.json',
  security_architecture: 'validation/security_architecture_validation.json',
  cloud_architecture: 'validation/cloud_architecture_validation.json',
  development_architecture: 'validation/development_architecture_validation.json',
  sre_architecture: 'validation/sre_architecture_validation.json',
  business_continuity: 'validation/business_continuity_validation.json',
  data_ai_architecture: 'validation/data_ai_architecture_validation.json',
  enterprise_architecture: 'validation/enterprise_architecture_validation.json',
  platform_it_infrastructure: 'validation/platform_it_infrastructure_validation.json',
  process_transformation: 'validation/process_transformation_validation.json',
};

interface ContractResult {
  file: string;
  contractType: string;
  displayName: string;
  score: number;
  status: string;
  completeness: number;
  generationDate: string;
  success: boolean;
  error?: string;
}

/**
 * Determine contract type from filename by matching known prefixes.
 * Example: "INTEGRATION_ARCHITECTURE_Project_2025-01-01.md" → "integration_architecture"
 */
function getContractTypeFromFilename(filename: string): string | null {
  for (const [prefix, contractType] of Object.entries(FILENAME_PREFIX_TO_CONTRACT_TYPE)) {
    if (filename.startsWith(prefix + '_') || filename === prefix + '.md') {
      return contractType;
    }
  }
  return null;
}

/**
 * Process a single contract: calculate score, update fields, write back.
 */
async function processContract(contractPath: string, contractType: string, fallbackDate: string): Promise<ContractResult> {
  const filename = basename(contractPath);
  const displayName = getContractDisplayName(contractType);

  try {
    const content = await Bun.file(contractPath).text();

    // Extract the generation date embedded by the agent (e.g. "**Generation Date**: 2025-03-23")
    const dateMatch = content.match(/\*\*Generation Date\*\*:\s*(\d{4}-\d{2}-\d{2})/);
    const generationDate = dateMatch?.[1] ?? fallbackDate;

    const validationConfig = CONTRACT_TYPE_TO_VALIDATION[contractType];
    if (!validationConfig) {
      throw new Error(`No validation config mapped for contract type: ${contractType}`);
    }

    // calculateComplianceScore resolves validationConfig relative to SKILL_DIR (import.meta.dir)
    const score = calculateComplianceScore(content, validationConfig);

    const updatedContent = updateContractWithValidation(content, score);
    await Bun.write(contractPath, updatedContent);

    const completeness = Math.round(score.completeness_score * 10); // 0-10 → 0-100%

    console.log(`  ✓ ${displayName}: ${score.final_score.toFixed(1)}/10 (${score.outcome.document_status})`);

    return {
      file: filename,
      contractType,
      displayName,
      score: score.final_score,
      status: score.outcome.document_status,
      completeness,
      generationDate,
      success: true,
    };
  } catch (error) {
    console.error(`  ✗ ${displayName}: ${(error as Error).message}`);
    return {
      file: filename,
      contractType,
      displayName,
      score: 0,
      status: 'Draft',
      completeness: 0,
      generationDate: fallbackDate,
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Run the full post-generation pipeline.
 */
async function runPipeline(complianceDocsDir: string, projectName: string): Promise<void> {
  console.log(`\nPost-Generation Pipeline`);
  console.log(`Compliance docs: ${complianceDocsDir}`);
  console.log(`Project: ${projectName}\n`);

  if (!existsSync(complianceDocsDir)) {
    throw new Error(`Compliance docs directory not found: ${complianceDocsDir}`);
  }

  // Scan for contract files
  const allFiles = readdirSync(complianceDocsDir);
  const contractFiles = allFiles.filter(f => f.endsWith('.md') && f !== MANIFEST_FILENAME);

  if (contractFiles.length === 0) {
    throw new Error(`No contract .md files found in ${complianceDocsDir}`);
  }

  console.log(`Found ${contractFiles.length} contract(s) to process:`);

  // Process each contract
  const results: ContractResult[] = [];
  const today = getLocalDateString();

  for (const filename of contractFiles) {
    const contractPath = join(complianceDocsDir, filename);
    const contractType = getContractTypeFromFilename(filename);

    if (!contractType) {
      console.warn(`  ? Skipping unrecognized filename pattern: ${filename}`);
      continue;
    }

    const result = await processContract(contractPath, contractType, today);
    results.push(result);
  }

  // Generate manifest in one pass from all successful contracts
  const successfulResults = results.filter(r => r.success);

  if (successfulResults.length === 0) {
    throw new Error('No contracts processed successfully — manifest not generated');
  }

  const contracts: ContractMetadata[] = successfulResults
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(r => ({
      contractType: r.displayName,
      filename: r.file,
      score: r.score,
      status: r.status,
      completeness: r.completeness,
      generatedDate: r.generationDate,
    }));

  const manifestData: ManifestData = {
    projectName,
    sourceFile: 'ARCHITECTURE.md',
    generationDate: today,
    contracts,
  };

  const manifestContent = generateManifestContent(manifestData);
  const manifestPath = join(complianceDocsDir, MANIFEST_FILENAME);
  await Bun.write(manifestPath, manifestContent);

  const failedCount = results.filter(r => !r.success).length;
  console.log(`\n✅ COMPLIANCE_MANIFEST.md written: ${manifestPath}`);
  console.log(`   ${successfulResults.length} successful, ${failedCount} failed`);

  // JSON summary to stdout for orchestrator consumption
  const summary = {
    success: true,
    project: projectName,
    totalContracts: results.length,
    successful: successfulResults.length,
    failed: failedCount,
    manifestPath,
    contracts: results,
  };

  console.log('\n' + JSON.stringify(summary, null, 2));
}

/**
 * Parse CLI arguments.
 */
function parseArgs(args: string[]): { complianceDocsDir: string; project: string } | null {
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (!key || value === undefined) continue;
    parsed[key] = value;
  }

  if (!parsed['compliance-docs-dir']) {
    console.error('Error: Missing required argument --compliance-docs-dir');
    return null;
  }
  if (!parsed['project']) {
    console.error('Error: Missing required argument --project');
    return null;
  }

  return {
    complianceDocsDir: resolve(parsed['compliance-docs-dir']),
    project: parsed['project'],
  };
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Post-Generation Pipeline

Scans compliance-docs for generated contracts, calculates validation scores,
updates contract fields, and writes COMPLIANCE_MANIFEST.md — all in one pass.

Usage:
  bun post-generation-pipeline.ts --compliance-docs-dir <path> --project "<name>"

Arguments:
  --compliance-docs-dir   Absolute or relative path to compliance-docs directory
  --project               Project name (from ARCHITECTURE.md H1 heading)

Example:
  bun post-generation-pipeline.ts \\
    --compliance-docs-dir /home/user/project/compliance-docs \\
    --project "My Project"
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  runPipeline(parsed.complianceDocsDir, parsed.project).catch(error => {
    console.error(`\nPipeline failed: ${(error as Error).message}`);
    process.exit(1);
  });
}

export { runPipeline, getContractTypeFromFilename };
