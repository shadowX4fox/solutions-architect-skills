#!/usr/bin/env bun

/**
 * Compliance Manifest Generator (Bun/TypeScript)
 *
 * Generates or updates COMPLIANCE_MANIFEST.md after compliance contract generation.
 * Tracks all generated contracts with metadata (score, status, completeness).
 *
 * Usage:
 *   bun manifest-generator.ts --mode create --project "Project Name" --contract-type "Development Architecture" --filename "DEV_2025-12-14.md" --score 8.5 --status "Approved" --completeness 85
 *   bun manifest-generator.ts --mode update --project "Project Name" --contract-type "Cloud Architecture" --filename "CLOUD_2025-12-14.md" --score 7.8 --status "In Review" --completeness 78
 *
 * Modes:
 *   create - Create new manifest (first contract)
 *   update - Update existing manifest (subsequent contracts)
 */

import { resolve, join } from 'path';
import { existsSync } from 'fs';

// Configuration
const SKILL_DIR = resolve(import.meta.dir, '..');
const DEFAULT_COMPLIANCE_DOCS_DIR = join(process.cwd(), 'compliance-docs');
const MANIFEST_FILENAME = 'COMPLIANCE_MANIFEST.md';

// Type Definitions
interface ContractMetadata {
  contractType: string;        // "Development Architecture"
  filename: string;             // "DEVELOPMENT_ARCHITECTURE_Project_2025-12-14.md"
  score: number;                // 8.5
  status: string;               // "Approved" | "In Review" | "Draft" | "Rejected"
  completeness: number;         // 85 (percentage)
  generatedDate: string;        // "2025-12-14"
}

interface ManifestData {
  projectName: string;
  sourceFile: string;           // "ARCHITECTURE.md"
  generationDate: string;
  contracts: ContractMetadata[];
}

interface StatusCounts {
  approved: number;
  inReview: number;
  draft: number;
  rejected: number;
}

/**
 * Parse existing manifest to extract contract entries
 */
function parseExistingManifest(content: string): ContractMetadata[] {
  const contracts: ContractMetadata[] = [];

  // Find the Generated Documents table
  const tableRegex = /## Generated Documents\s+\|[^\n]+\|\s+\|[-\s|]+\|\s+((?:\|[^\n]+\|\s+)+)/;
  const match = content.match(tableRegex);

  if (!match || !match[1]) {
    return contracts;
  }

  // Parse each table row
  const rows = match[1].trim().split('\n');
  for (const row of rows) {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);

    if (cells.length === 6) {
      contracts.push({
        contractType: cells[0],
        filename: cells[1],
        score: parseFloat(cells[2]),
        status: cells[3],
        completeness: parseInt(cells[4].replace('%', '')),
        generatedDate: cells[5]
      });
    }
  }

  return contracts;
}

/**
 * Merge new contract into existing contracts list
 * Replaces if same type exists, appends if new type
 */
function mergeContracts(
  existing: ContractMetadata[],
  newContract: ContractMetadata
): ContractMetadata[] {
  const existingIndex = existing.findIndex(
    c => c.contractType === newContract.contractType
  );

  if (existingIndex >= 0) {
    // Replace existing entry (regeneration)
    existing[existingIndex] = newContract;
  } else {
    // Append new entry
    existing.push(newContract);
  }

  // Sort alphabetically by contract type
  return existing.sort((a, b) => a.contractType.localeCompare(b.contractType));
}

/**
 * Calculate summary statistics
 */
function calculateSummary(contracts: ContractMetadata[]): {
  total: number;
  avgScore: number;
  avgCompleteness: number;
  statusCounts: StatusCounts;
} {
  if (contracts.length === 0) {
    return {
      total: 0,
      avgScore: 0,
      avgCompleteness: 0,
      statusCounts: { approved: 0, inReview: 0, draft: 0, rejected: 0 }
    };
  }

  const totalScore = contracts.reduce((sum, c) => sum + c.score, 0);
  const totalCompleteness = contracts.reduce((sum, c) => sum + c.completeness, 0);

  const statusCounts: StatusCounts = {
    approved: contracts.filter(c => c.status === 'Approved').length,
    inReview: contracts.filter(c => c.status === 'In Review').length,
    draft: contracts.filter(c => c.status === 'Draft').length,
    rejected: contracts.filter(c => c.status === 'Rejected').length
  };

  return {
    total: contracts.length,
    avgScore: parseFloat((totalScore / contracts.length).toFixed(1)),
    avgCompleteness: Math.round(totalCompleteness / contracts.length),
    statusCounts
  };
}

/**
 * Generate Compliance Framework Reference section (static)
 */
function generateFrameworkSection(): string {
  return `## Compliance Framework Reference

**Framework**: Two-Stage Template Validation Framework v1.0
**Documentation**: \`/skills/architecture-compliance/VALIDATION_FRAMEWORK_GUIDE.md\`
**Scoring Formula**: \`(Completeness × 0.4) + (Compliance × 0.5) + (Quality × 0.1)\`

**Approval Thresholds**:
| Score Range | Status | Review Actor |
|-------------|--------|--------------|
| 8.0-10.0 | Approved | System (Auto-Approved) |
| 7.0-7.9 | In Review | Review Board |
| 5.0-6.9 | Draft | Architecture Team |
| 0.0-4.9 | Rejected | N/A (Blocked) |`;
}

/**
 * Generate Validation Configuration section (static)
 */
function generateValidationSection(): string {
  return `## Validation Configuration

**Validation Schema**: \`/skills/architecture-compliance/validation/TEMPLATE_VALIDATION_SCHEMA.json\`
**Schema Version**: 1.0.0
**Validation Engine**: ComplianceValidator v1.0
**Validation Date**: ${new Date().toISOString().split('T')[0]}

**Validation Stages**:
- Stage 1 (Pre-Validation): Template structure validation
- Stage 2 (Post-Validation): Populated contract validation (5 critical areas)

**Rule Files**: 10 contract-specific validation rule files in \`/validation/\` directory`;
}

/**
 * Generate Generated Documents table (dynamic)
 */
function generateDocumentsTable(contracts: ContractMetadata[]): string {
  let table = `## Generated Documents

| Contract Type | Filename | Score | Status | Completeness | Generated |
|---------------|----------|-------|--------|--------------|-----------|
`;

  for (const contract of contracts) {
    table += `| ${contract.contractType} | ${contract.filename} | ${contract.score} | ${contract.status} | ${contract.completeness}% | ${contract.generatedDate} |\n`;
  }

  return table.trim();
}

/**
 * Generate Summary section (dynamic)
 */
function generateSummarySection(contracts: ContractMetadata[]): string {
  const summary = calculateSummary(contracts);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return `## Summary
- Total Contracts: ${summary.total}
- Average Score: ${summary.avgScore}/10
- Average Completeness: ${summary.avgCompleteness}%
- Approved: ${summary.statusCounts.approved}, In Review: ${summary.statusCounts.inReview}, Draft: ${summary.statusCounts.draft}, Rejected: ${summary.statusCounts.rejected}
- Last Updated: ${timestamp}`;
}

/**
 * Generate complete manifest content
 */
function generateManifestContent(manifestData: ManifestData): string {
  const content = `# Compliance Documentation Manifest

**Project**: ${manifestData.projectName}
**Source**: ${manifestData.sourceFile}
**Generated**: ${manifestData.generationDate}

---

${generateFrameworkSection()}

---

${generateValidationSection()}

---

${generateDocumentsTable(manifestData.contracts)}

---

${generateSummarySection(manifestData.contracts)}
`;

  return content;
}

/**
 * Main function to generate or update manifest
 */
async function generateManifest(
  complianceDocsDir: string,
  contractMetadata: ContractMetadata,
  projectName: string,
  mode: 'create' | 'update'
): Promise<void> {
  const manifestPath = join(complianceDocsDir, MANIFEST_FILENAME);

  let contracts: ContractMetadata[] = [];

  // Load existing manifest if updating
  if (mode === 'update') {
    if (existsSync(manifestPath)) {
      const existingContent = await Bun.file(manifestPath).text();
      contracts = parseExistingManifest(existingContent);
      console.log(`📝 Loaded ${contracts.length} existing contract(s) from manifest`);
    } else {
      console.warn('⚠️  Manifest not found. Switching to create mode.');
      mode = 'create';
    }
  }

  // Merge new contract
  contracts = mergeContracts(contracts, contractMetadata);
  console.log(`✓ Merged contract: ${contractMetadata.contractType}`);

  // Generate manifest data
  const manifestData: ManifestData = {
    projectName,
    sourceFile: 'ARCHITECTURE.md',
    generationDate: contractMetadata.generatedDate,
    contracts
  };

  // Generate manifest content
  const content = generateManifestContent(manifestData);

  // Write manifest file
  await Bun.write(manifestPath, content);

  const summary = calculateSummary(contracts);
  console.log(`\n✅ Manifest ${mode === 'create' ? 'created' : 'updated'} successfully: ${manifestPath}`);
  console.log(`   Contracts: ${summary.total} (Avg Score: ${summary.avgScore}/10, Avg Completeness: ${summary.avgCompleteness}%)`);
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): {
  mode: 'create' | 'update';
  project: string;
  contractType: string;
  filename: string;
  score: number;
  status: string;
  completeness: number;
  complianceDocsDir?: string;
} | null {
  const parsed: any = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];

    if (!value) {
      console.error(`Error: Missing value for --${key}`);
      return null;
    }

    switch (key) {
      case 'mode':
        if (value !== 'create' && value !== 'update') {
          console.error('Error: --mode must be "create" or "update"');
          return null;
        }
        parsed.mode = value;
        break;
      case 'project':
        parsed.project = value;
        break;
      case 'contract-type':
        parsed.contractType = value;
        break;
      case 'filename':
        parsed.filename = value;
        break;
      case 'score':
        parsed.score = parseFloat(value);
        if (isNaN(parsed.score) || parsed.score < 0 || parsed.score > 10) {
          console.error('Error: --score must be a number between 0 and 10');
          return null;
        }
        break;
      case 'status':
        if (!['Approved', 'In Review', 'Draft', 'Rejected'].includes(value)) {
          console.error('Error: --status must be one of: Approved, In Review, Draft, Rejected');
          return null;
        }
        parsed.status = value;
        break;
      case 'completeness':
        parsed.completeness = parseInt(value);
        if (isNaN(parsed.completeness) || parsed.completeness < 0 || parsed.completeness > 100) {
          console.error('Error: --completeness must be a number between 0 and 100');
          return null;
        }
        break;
      case 'compliance-docs-dir':
        parsed.complianceDocsDir = value;
        break;
      default:
        console.error(`Error: Unknown argument --${key}`);
        return null;
    }
  }

  // Validate required arguments
  const required = ['mode', 'project', 'contractType', 'filename', 'score', 'status', 'completeness'];
  for (const field of required) {
    if (!(field in parsed)) {
      console.error(`Error: Missing required argument --${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      return null;
    }
  }

  return parsed;
}

/**
 * Main CLI execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Compliance Manifest Generator

Usage:
  bun manifest-generator.ts --mode <create|update> --project "<name>" \\
    --contract-type "<type>" --filename "<file>" --score <0-10> \\
    --status "<status>" --completeness <0-100>

Required Arguments:
  --mode               Create new manifest or update existing (create|update)
  --project            Project name from ARCHITECTURE.md
  --contract-type      Contract type (e.g., "Development Architecture")
  --filename           Generated contract filename
  --score              Validation score (0-10, e.g., 8.5)
  --status             Document status (Approved|In Review|Draft|Rejected)
  --completeness       Completeness percentage (0-100)

Optional Arguments:
  --compliance-docs-dir  Custom output directory (default: ./compliance-docs)

Examples:
  # Create new manifest
  bun manifest-generator.ts --mode create --project "Task Scheduling" \\
    --contract-type "Development Architecture" \\
    --filename "DEVELOPMENT_ARCHITECTURE_Task_2025-12-14.md" \\
    --score 8.5 --status "Approved" --completeness 85

  # Update existing manifest
  bun manifest-generator.ts --mode update --project "Task Scheduling" \\
    --contract-type "Cloud Architecture" \\
    --filename "CLOUD_ARCHITECTURE_Task_2025-12-14.md" \\
    --score 7.8 --status "In Review" --completeness 78
`);
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  // Parse arguments
  const parsed = parseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  // Get compliance docs directory
  const complianceDocsDir = parsed.complianceDocsDir || DEFAULT_COMPLIANCE_DOCS_DIR;

  // Ensure compliance-docs directory exists
  if (!existsSync(complianceDocsDir)) {
    console.error(`Error: Compliance docs directory not found: ${complianceDocsDir}`);
    console.error('Please create the directory or specify a custom path with --compliance-docs-dir');
    process.exit(1);
  }

  // Create contract metadata
  const contractMetadata: ContractMetadata = {
    contractType: parsed.contractType,
    filename: parsed.filename,
    score: parsed.score,
    status: parsed.status,
    completeness: parsed.completeness,
    generatedDate: new Date().toISOString().split('T')[0]
  };

  try {
    await generateManifest(complianceDocsDir, contractMetadata, parsed.project, parsed.mode);
  } catch (error) {
    console.error(`Error generating manifest: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

// Export for testing and programmatic use
export {
  generateManifest,
  parseExistingManifest,
  mergeContracts,
  calculateSummary,
  generateFrameworkSection,
  generateValidationSection,
  generateDocumentsTable,
  generateSummarySection,
  generateManifestContent,
  type ContractMetadata,
  type ManifestData,
  type StatusCounts
};
