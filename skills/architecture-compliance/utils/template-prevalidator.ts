#!/usr/bin/env bun
/**
 * Template Pre-Validator
 *
 * Validates expanded template structure BEFORE data population.
 * This is Phase 4.1 validation - catches template defects early.
 *
 * Validates:
 * 1. Required sections are present
 * 2. Appendix A.1-A.4 structure is correct
 * 3. No unresolved @include directives
 * 4. Basic markdown structure is valid
 * 5. Placeholder format is correct
 *
 * Usage:
 *   import { validateTemplateStructure } from './template-prevalidator';
 *
 *   const result = await validateTemplateStructure(expandedTemplate, contractType);
 *   if (!result.isValid) {
 *     console.error(result.errors);
 *     throw new Error('Template structure validation failed');
 *   }
 */

export interface TemplateValidationError {
  errorId: string;
  severity: 'BLOCKING' | 'WARNING';
  location: string;
  expected: string;
  found: string;
  fix: string;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationError[];
  checksPerformed: number;
  checksPassed: number;
}

/**
 * Minimum required sections that all templates must have
 * (Section names are dynamically generated based on requirements)
 *
 * Note: Business Continuity doesn't have "Compliance Summary" - it uses section-based format
 */
const MINIMUM_REQUIRED_SECTIONS = [
  'Document Control'
];

/**
 * Sections required for table-based contracts (all except Business Continuity)
 */
const TABLE_BASED_REQUIRED_SECTIONS = [
  'Compliance Summary'
];

/**
 * Validate that minimum required sections are present in the template
 */
function validateRequiredSections(
  content: string,
  contractType: string,
  errors: TemplateValidationError[]
): number {
  let checksPerformed = 0;
  const missingSections: string[] = [];

  // Check minimum required sections (all contracts)
  for (const section of MINIMUM_REQUIRED_SECTIONS) {
    checksPerformed++;

    // Check for section heading (## Section Name)
    const sectionPattern = new RegExp(`^##\\s+${section}\\s*$`, 'm');
    if (!sectionPattern.test(content)) {
      missingSections.push(section);
    }
  }

  // Check table-based sections (all except Business Continuity)
  if (contractType !== 'business_continuity') {
    for (const section of TABLE_BASED_REQUIRED_SECTIONS) {
      checksPerformed++;

      const sectionPattern = new RegExp(`^##\\s+${section}\\s*$`, 'm');
      if (!sectionPattern.test(content)) {
        missingSections.push(section);
      }
    }
  }

  if (missingSections.length > 0) {
    const allRequired = contractType === 'business_continuity'
      ? MINIMUM_REQUIRED_SECTIONS
      : [...MINIMUM_REQUIRED_SECTIONS, ...TABLE_BASED_REQUIRED_SECTIONS];

    errors.push({
      errorId: 'TEMPLATE_MISSING_REQUIRED_SECTIONS',
      severity: 'BLOCKING',
      location: 'Template Structure',
      expected: `Required sections present: ${allRequired.join(', ')}`,
      found: `Missing ${missingSections.length} section(s): ${missingSections.join(', ')}`,
      fix: `Add missing section headings to the template file. Each section should start with "## Section Name".`
    });
  }

  return checksPerformed;
}

/**
 * Validate Appendix A.1-A.4 structure
 */
function validateAppendixStructure(
  content: string,
  contractType: string,
  errors: TemplateValidationError[]
): number {
  // Business Continuity doesn't require A.2
  const requiredAppendices = contractType === 'business_continuity'
    ? ['A.1', 'A.3', 'A.4']
    : ['A.1', 'A.2', 'A.3', 'A.4'];

  let checksPerformed = 0;
  const missingAppendices: string[] = [];

  for (const appendix of requiredAppendices) {
    checksPerformed++;

    // Check for appendix heading (### A.X)
    const appendixPattern = new RegExp(`^###\\s+${appendix}\\s+`, 'm');
    if (!appendixPattern.test(content)) {
      missingAppendices.push(appendix);
    }
  }

  if (missingAppendices.length > 0) {
    errors.push({
      errorId: 'TEMPLATE_MISSING_APPENDICES',
      severity: 'BLOCKING',
      location: 'Template Appendix Structure',
      expected: `Appendices ${requiredAppendices.join(', ')} present`,
      found: `Missing appendix/appendices: ${missingAppendices.join(', ')}`,
      fix: `Add missing appendix headings to the template. Format: "### A.X Appendix Name"`
    });
  }

  // Check appendix order
  checksPerformed++;
  const appendixMatches = Array.from(content.matchAll(/^###\s+(A\.\d+)\s+/gm));
  const foundOrder = appendixMatches.map(m => m[1]);

  // Filter to only A.1-A.4
  const a1to4 = foundOrder.filter(a => ['A.1', 'A.2', 'A.3', 'A.4'].includes(a));

  if (a1to4.length > 1) {
    for (let i = 1; i < a1to4.length; i++) {
      const prev = parseFloat(a1to4[i - 1].substring(2));
      const curr = parseFloat(a1to4[i].substring(2));

      if (curr <= prev) {
        errors.push({
          errorId: 'TEMPLATE_APPENDIX_ORDER',
          severity: 'BLOCKING',
          location: `Appendix ${a1to4[i]}`,
          expected: `Appendices in order: A.1, A.2, A.3, A.4`,
          found: `Found ${a1to4[i]} after ${a1to4[i - 1]}`,
          fix: `Reorder appendices in the template to be sequential (A.1 → A.2 → A.3 → A.4)`
        });
        break;
      }
    }
  }

  return checksPerformed;
}

/**
 * Validate no unresolved @include directives
 */
function validateNoUnresolvedIncludes(
  content: string,
  errors: TemplateValidationError[],
  warnings: TemplateValidationError[]
): number {
  const includePattern = /<!--\s*@include(-with-config)?\s+(.+?)\s*(?:config=\S+)?\s*-->/g;
  const matches = Array.from(content.matchAll(includePattern));

  if (matches.length > 0) {
    const unresolvedPaths = matches.map(m => m[2]).slice(0, 5); // Show first 5

    errors.push({
      errorId: 'TEMPLATE_UNRESOLVED_INCLUDES',
      severity: 'BLOCKING',
      location: 'Template Include Directives',
      expected: 'All @include directives resolved',
      found: `${matches.length} unresolved @include directive(s): ${unresolvedPaths.join(', ')}${matches.length > 5 ? '...' : ''}`,
      fix: `Run resolve-includes.ts to expand all @include directives before validation.`
    });
  }

  return 1;
}

/**
 * Validate placeholder format
 */
function validatePlaceholderFormat(
  content: string,
  warnings: TemplateValidationError[]
): number {
  // Check for common placeholder issues
  const invalidPlaceholders: string[] = [];

  // Find all placeholders {{...}}
  const placeholderPattern = /\{\{([^}]+)\}\}/g;
  const matches = Array.from(content.matchAll(placeholderPattern));

  for (const match of matches) {
    const placeholder = match[1];

    // Check for spaces (should use underscores)
    if (/\s/.test(placeholder)) {
      invalidPlaceholders.push(`{{${placeholder}}}`);
    }

    // Check for uppercase (should be lowercase or snake_case)
    if (/^[A-Z_]+$/.test(placeholder) && placeholder !== placeholder.toUpperCase()) {
      // Mixed case - might be intentional, but warn
      if (!invalidPlaceholders.includes(`{{${placeholder}}}`)) {
        invalidPlaceholders.push(`{{${placeholder}}}`);
      }
    }
  }

  if (invalidPlaceholders.length > 0) {
    const examples = invalidPlaceholders.slice(0, 3);
    warnings.push({
      errorId: 'TEMPLATE_PLACEHOLDER_FORMAT',
      severity: 'WARNING',
      location: 'Template Placeholders',
      expected: 'Placeholders in format: {{variable_name}} (lowercase with underscores)',
      found: `${invalidPlaceholders.length} placeholder(s) with potential formatting issues: ${examples.join(', ')}${invalidPlaceholders.length > 3 ? '...' : ''}`,
      fix: `Review placeholder naming conventions. Use lowercase with underscores (e.g., {{project_name}} not {{Project Name}})`
    });
  }

  return 1;
}

/**
 * Validate basic markdown structure
 */
function validateMarkdownStructure(
  content: string,
  errors: TemplateValidationError[]
): number {
  let checksPerformed = 0;

  // Check for title (# ...)
  checksPerformed++;
  if (!/^#\s+.+/m.test(content)) {
    errors.push({
      errorId: 'TEMPLATE_NO_TITLE',
      severity: 'BLOCKING',
      location: 'Template Header',
      expected: 'Document title starting with "# "',
      found: 'No level-1 heading found',
      fix: `Add a document title at the top of the template: "# Compliance Contract: {{contract_type}}"`
    });
  }

  // Check for balanced code fences
  checksPerformed++;
  const codeFences = content.match(/```/g);
  if (codeFences && codeFences.length % 2 !== 0) {
    errors.push({
      errorId: 'TEMPLATE_UNBALANCED_CODE_FENCES',
      severity: 'BLOCKING',
      location: 'Template Markdown',
      expected: 'Balanced code fences (``` pairs)',
      found: `Unbalanced: ${codeFences.length} code fence marker(s)`,
      fix: `Ensure all code blocks are properly closed with matching \`\`\` markers`
    });
  }

  return checksPerformed;
}

/**
 * Main validation function
 */
export async function validateTemplateStructure(
  expandedTemplate: string,
  contractType: string
): Promise<TemplateValidationResult> {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationError[] = [];
  let checksPerformed = 0;

  // 1. Validate no unresolved @include directives
  checksPerformed += validateNoUnresolvedIncludes(expandedTemplate, errors, warnings);

  // 2. Validate basic markdown structure
  checksPerformed += validateMarkdownStructure(expandedTemplate, errors);

  // 3. Validate required sections
  checksPerformed += validateRequiredSections(expandedTemplate, contractType, errors);

  // 4. Validate appendix structure
  checksPerformed += validateAppendixStructure(expandedTemplate, contractType, errors);

  // 5. Validate placeholder format (warnings only)
  checksPerformed += validatePlaceholderFormat(expandedTemplate, warnings);

  const checksPassed = checksPerformed - errors.length - warnings.length;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    checksPerformed,
    checksPassed
  };
}

/**
 * Generate a formatted error report for template validation
 */
export function generateTemplateValidationReport(
  result: TemplateValidationResult,
  contractType: string
): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push('✅ Template Structure Validation PASSED');
    lines.push(`   ${result.checksPassed}/${result.checksPerformed} checks passed`);
    if (result.warnings.length > 0) {
      lines.push(`   ${result.warnings.length} warning(s)`);
    }
    return lines.join('\n');
  }

  lines.push('━'.repeat(80));
  lines.push(`❌ TEMPLATE VALIDATION FAILED: ${contractType}`);
  lines.push(`   ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
  lines.push('━'.repeat(80));
  lines.push('');

  // Errors
  result.errors.forEach((error, index) => {
    lines.push(`ERROR ${index + 1}: ${error.errorId}`);
    lines.push(`Severity: ${error.severity}`);
    lines.push(`Location: ${error.location}`);
    lines.push('');
    lines.push('Expected:');
    lines.push(`  ${error.expected}`);
    lines.push('');
    lines.push('Found:');
    lines.push(`  ${error.found}`);
    lines.push('');
    lines.push('Fix:');
    lines.push(`  ${error.fix}`);
    lines.push('');
    lines.push('━'.repeat(80));
    lines.push('');
  });

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    lines.push('');

    result.warnings.forEach((warning, index) => {
      lines.push(`${index + 1}. ${warning.errorId}`);
      lines.push(`   ${warning.found}`);
      lines.push(`   Fix: ${warning.fix}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}
