/**
 * Compliance Validation Error Reporter
 *
 * Formats validation errors into user-friendly reports with:
 * - Line numbers and section references
 * - SKILL.md and template references
 * - Actionable fix instructions
 * - Clear visual separation
 *
 * @module error_reporter
 */

import type { ValidationError, ValidationResult } from './validators';

// ============================================================================
// Constants
// ============================================================================

const SEPARATOR = '━'.repeat(80);
const SUMMARY_SEPARATOR = '─'.repeat(80);

// ============================================================================
// Error Reporter Class
// ============================================================================

export class ErrorReporter {
  /**
   * Generate a comprehensive validation report
   */
  public static generateReport(result: ValidationResult, contractType: string): string {
    if (result.isValid) {
      return this.generateSuccessReport(result, contractType);
    }

    const { errors, warnings } = result;
    const blockers = errors.filter(e => e.severity === 'BLOCKING');
    const nonBlockers = errors.filter(e => e.severity !== 'BLOCKING');

    let report = '';

    // Header
    report += this.generateHeader(contractType, blockers.length, warnings.length);
    report += '\n\n';

    // Blocking errors
    if (blockers.length > 0) {
      report += this.generateErrorSection('BLOCKING ERRORS', blockers);
      report += '\n\n';
    }

    // Non-blocking errors
    if (nonBlockers.length > 0) {
      report += this.generateErrorSection('NON-BLOCKING ERRORS', nonBlockers);
      report += '\n\n';
    }

    // Warnings
    if (warnings.length > 0) {
      report += this.generateWarningSection(warnings);
      report += '\n\n';
    }

    // Summary
    report += this.generateSummary(result, contractType);

    return report;
  }

  /**
   * Generate header for validation report
   */
  private static generateHeader(
    contractType: string,
    errorCount: number,
    warningCount: number
  ): string {
    const title = `VALIDATION FAILED: ${this.formatContractType(contractType)}`;
    const counts = `${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;

    return `${SEPARATOR}\n${title} (${counts})\n${SEPARATOR}`;
  }

  /**
   * Generate error section
   */
  private static generateErrorSection(title: string, errors: ValidationError[]): string {
    let section = `${title}:\n`;

    errors.forEach((error, index) => {
      section += '\n';
      section += SEPARATOR + '\n';
      section += this.formatError(error, index + 1);
      section += SEPARATOR;
      if (index < errors.length - 1) {
        section += '\n';
      }
    });

    return section;
  }

  /**
   * Generate warning section
   */
  private static generateWarningSection(warnings: ValidationError[]): string {
    let section = 'WARNINGS:\n';

    warnings.forEach((warning, index) => {
      section += '\n';
      section += SUMMARY_SEPARATOR + '\n';
      section += this.formatWarning(warning, index + 1);
      section += SUMMARY_SEPARATOR;
      if (index < warnings.length - 1) {
        section += '\n';
      }
    });

    return section;
  }

  /**
   * Format a single error
   */
  private static formatError(error: ValidationError, index: number): string {
    let formatted = '';

    // Error header
    const location = error.lineNumber
      ? `Line ${error.lineNumber}`
      : error.location;

    formatted += `ERROR ${index}: ${error.validationArea} (${location})\n`;
    formatted += `Severity: ${error.severity}\n`;

    if (error.location !== location) {
      formatted += `Location: ${error.location}\n`;
    }

    formatted += '\n';

    // Expected vs Found
    formatted += 'Expected:\n';
    formatted += this.indent(error.expected) + '\n\n';

    formatted += 'Found:\n';
    formatted += this.indent(error.found) + '\n\n';

    // References
    if (Object.keys(error.references).length > 0) {
      formatted += 'Reference:\n';

      if (error.references.skillMd) {
        formatted += this.indent(`- SKILL.md ${error.references.skillMd}`) + '\n';
      }

      if (error.references.template) {
        formatted += this.indent(`- Template: ${error.references.template}`) + '\n';
      }

      if (error.references.shared) {
        formatted += this.indent(`- Shared: ${error.references.shared}`) + '\n';
      }

      formatted += '\n';
    }

    // Fix instructions
    formatted += 'Fix:\n';
    formatted += this.indent(error.fix) + '\n';

    return formatted;
  }

  /**
   * Format a single warning
   */
  private static formatWarning(warning: ValidationError, index: number): string {
    let formatted = '';

    const location = warning.lineNumber
      ? `Line ${warning.lineNumber}`
      : warning.location;

    formatted += `WARNING ${index}: ${warning.validationArea} (${location})\n`;

    if (warning.location !== location) {
      formatted += `Location: ${warning.location}\n`;
    }

    formatted += `\n${this.indent(warning.fix)}\n`;

    return formatted;
  }

  /**
   * Generate summary section
   */
  private static generateSummary(result: ValidationResult, contractType: string): string {
    const { validationSummary, errors, warnings } = result;
    const blockingCount = errors.filter(e => e.severity === 'BLOCKING').length;

    let summary = SEPARATOR + '\n';
    summary += 'SUMMARY\n';
    summary += SEPARATOR + '\n';

    summary += `Contract Type: ${this.formatContractType(contractType)}\n`;
    summary += `Validation Status: ${blockingCount > 0 ? '❌ BLOCKED' : '⚠️ PASSED WITH WARNINGS'}\n`;
    summary += '\n';

    summary += 'Checks:\n';
    summary += this.indent(`Total: ${validationSummary.totalChecks}`) + '\n';
    summary += this.indent(`Passed: ${validationSummary.passed}`) + '\n';
    summary += this.indent(`Failed: ${validationSummary.failed}`) + '\n';
    summary += this.indent(`Warnings: ${validationSummary.warnings}`) + '\n';
    summary += '\n';

    summary += 'Errors:\n';
    summary += this.indent(`Blocking: ${blockingCount}`) + '\n';
    summary += this.indent(`Non-Blocking: ${errors.length - blockingCount}`) + '\n';
    summary += this.indent(`Warnings: ${warnings.length}`) + '\n';
    summary += '\n';

    if (blockingCount > 0) {
      summary += 'Contract Generation: ❌ BLOCKED\n';
      summary += 'Action Required: Fix all blocking errors before generation can proceed\n';
    } else if (warnings.length > 0) {
      summary += 'Contract Generation: ⚠️ ALLOWED (with warnings)\n';
      summary += 'Recommendation: Review and address warnings for best quality\n';
    }

    return summary;
  }

  /**
   * Generate success report
   */
  private static generateSuccessReport(result: ValidationResult, contractType: string): string {
    const { validationSummary, warnings } = result;

    let report = '';

    report += SEPARATOR + '\n';
    report += `✅ VALIDATION PASSED: ${this.formatContractType(contractType)}\n`;
    report += SEPARATOR + '\n\n';

    report += 'Checks:\n';
    report += this.indent(`Total: ${validationSummary.totalChecks}`) + '\n';
    report += this.indent(`Passed: ${validationSummary.passed}`) + '\n';
    report += this.indent(`Failed: ${validationSummary.failed}`) + '\n';
    report += this.indent(`Warnings: ${validationSummary.warnings}`) + '\n\n';

    if (warnings.length > 0) {
      report += 'Note: Validation passed but there are warnings to review:\n\n';
      report += this.generateWarningSection(warnings);
      report += '\n';
    }

    report += SEPARATOR + '\n';
    report += 'Contract Generation: ✅ READY TO PROCEED\n';
    report += SEPARATOR + '\n';

    return report;
  }

  /**
   * Format contract type for display
   */
  private static formatContractType(contractType: string): string {
    return contractType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Indent text with 2 spaces
   */
  private static indent(text: string, spaces = 2): string {
    const prefix = ' '.repeat(spaces);
    return text
      .split('\n')
      .map(line => prefix + line)
      .join('\n');
  }

  /**
   * Format error for console output (with colors if supported)
   */
  public static formatErrorForConsole(error: ValidationError): string {
    // Basic formatting for now (can add colors later with chalk or similar)
    return this.formatError(error, 0);
  }

  /**
   * Generate a compact single-line error summary
   */
  public static generateCompactSummary(result: ValidationResult): string {
    const { errors, warnings } = result;
    const blockingCount = errors.filter(e => e.severity === 'BLOCKING').length;

    if (result.isValid) {
      return warnings.length > 0
        ? `✅ Validation passed (${warnings.length} warnings)`
        : '✅ Validation passed';
    }

    return `❌ Validation failed: ${blockingCount} blocking error${blockingCount !== 1 ? 's' : ''}, ` +
           `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`;
  }

  /**
   * Extract errors by validation area
   */
  public static groupErrorsByArea(errors: ValidationError[]): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();

    for (const error of errors) {
      const area = error.validationArea;
      if (!grouped.has(area)) {
        grouped.set(area, []);
      }
      grouped.get(area)!.push(error);
    }

    return grouped;
  }

  /**
   * Generate a markdown-formatted report
   */
  public static generateMarkdownReport(result: ValidationResult, contractType: string): string {
    let report = '';

    // Title
    if (result.isValid) {
      report += `# ✅ Validation Passed: ${this.formatContractType(contractType)}\n\n`;
    } else {
      const blockingCount = result.errors.filter(e => e.severity === 'BLOCKING').length;
      report += `# ❌ Validation Failed: ${this.formatContractType(contractType)}\n\n`;
      report += `**Blocking Errors**: ${blockingCount}  \n`;
      report += `**Warnings**: ${result.warnings.length}\n\n`;
    }

    // Summary table
    report += '## Validation Summary\n\n';
    report += '| Metric | Count |\n';
    report += '|--------|-------|\n';
    report += `| Total Checks | ${result.validationSummary.totalChecks} |\n`;
    report += `| Passed | ${result.validationSummary.passed} |\n`;
    report += `| Failed | ${result.validationSummary.failed} |\n`;
    report += `| Warnings | ${result.validationSummary.warnings} |\n\n`;

    // Errors
    if (result.errors.length > 0) {
      report += '## Errors\n\n';
      result.errors.forEach((error, index) => {
        report += `### ${index + 1}. ${error.validationArea}\n\n`;

        if (error.lineNumber) {
          report += `**Line**: ${error.lineNumber}  \n`;
        }

        report += `**Location**: ${error.location}  \n`;
        report += `**Severity**: ${error.severity}\n\n`;

        report += '**Expected**:\n```\n';
        report += error.expected + '\n';
        report += '```\n\n';

        report += '**Found**:\n```\n';
        report += error.found + '\n';
        report += '```\n\n';

        report += '**Fix**:\n';
        report += error.fix + '\n\n';

        if (Object.keys(error.references).length > 0) {
          report += '**References**:\n';
          if (error.references.skillMd) {
            report += `- SKILL.md ${error.references.skillMd}\n`;
          }
          if (error.references.template) {
            report += `- Template: ${error.references.template}\n`;
          }
          if (error.references.shared) {
            report += `- Shared: ${error.references.shared}\n`;
          }
          report += '\n';
        }

        report += '---\n\n';
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      report += '## Warnings\n\n';
      result.warnings.forEach((warning, index) => {
        report += `### ${index + 1}. ${warning.validationArea}\n\n`;
        report += `**Location**: ${warning.location}  \n`;
        report += `**Fix**: ${warning.fix}\n\n`;
        report += '---\n\n';
      });
    }

    return report;
  }
}
