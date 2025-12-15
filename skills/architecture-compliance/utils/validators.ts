/**
 * Compliance Template Validation Engine
 *
 * Enforces strict template adherence for compliance contract generation.
 * Validates 7 critical areas:
 * 1. Compliance Summary table (6-column format)
 * 2. Status value standardization
 * 3. Appendix A.1-A.4 structure
 * 4. Compliance calculation accuracy
 * 5. Template completeness
 * 6. Forbidden section numbering (A.5+ prevention)
 * 7. Document Control table format enforcement
 *
 * @module validators
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationError {
  errorId: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  validationArea: string;
  lineNumber?: number;
  location: string;
  expected: string;
  found: string;
  references: {
    skillMd?: string;
    template?: string;
    shared?: string;
  };
  fix: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validationSummary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface ValidationRules {
  contract_type: string;
  contract_name: string;
  template_file: string;
  version: string;
  validations: {
    compliance_summary_table?: ComplianceTableRules;
    section_based_format?: SectionBasedRules;
    status_value_standardization?: StatusValueRules;
    appendix_structure?: AppendixStructureRules;
    compliance_calculation?: CalculationRules;
    template_completeness?: CompletenessRules;
    two_tier_scoring?: TwoTierScoringRules;
    forbidden_section_numbering?: ForbiddenSectionNumberingRules;
    document_control_table?: DocumentControlTableRules;
  };
  error_messages?: Record<string, string>;
}

interface ComplianceTableRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  reason?: string;
  requirement_count?: number;
  blocker_count?: number;
  desired_count?: number;
  column_validation?: {
    columns: Array<{
      name: string;
      pattern?: string;
      allowed_values?: string[];
      max_length?: number;
      required: boolean;
    }>;
  };
}

interface SectionBasedRules {
  enabled: boolean;
  severity?: 'BLOCKING' | 'WARNING' | 'INFO';
  required_sections?: Array<{
    id: string;
    heading: string;
    required_fields: string[];
  }>;
}

interface StatusValueRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  allowed_values: string[];
  case_sensitive: boolean;
  common_errors?: Record<string, string>;
}

interface AppendixStructureRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  required_appendices: string[];
  strict_order: boolean;
  note?: string;
}

interface CalculationRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  total_requirements?: number;
  percentage_tolerance: number;
  completeness_tolerance?: number;
}

interface CompletenessRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  required_sections: string[];
  section_order?: {
    strict_order: boolean;
    sequence: string[];
  };
}

interface TwoTierScoringRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  blocker_section_pattern?: string;
  blocker_count: number;
  desired_count: number;
  blocker_validation?: string;
}

interface ForbiddenSectionNumberingRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  forbidden_patterns: string[];
  error_message: string;
}

interface DocumentControlTableRules {
  enabled: boolean;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  required_table_pattern: string;
  required_fields: string[];
  error_message: string;
}

// ============================================================================
// Compliance Validator Class
// ============================================================================

export class ComplianceValidator {
  private rules: ValidationRules;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private checksPerformed = 0;
  private checksPassed = 0;

  constructor(rulesPath: string) {
    this.rules = this.loadRules(rulesPath);
  }

  /**
   * Load validation rules from JSON file
   */
  private loadRules(rulesPath: string): ValidationRules {
    try {
      const fullPath = rulesPath.startsWith('/')
        ? rulesPath
        : join(process.cwd(), rulesPath);

      const content = readFileSync(fullPath, 'utf-8');
      return JSON.parse(content) as ValidationRules;
    } catch (error) {
      throw new Error(`Failed to load validation rules from ${rulesPath}: ${error}`);
    }
  }

  /**
   * Main validation orchestration method
   */
  public async validateDocument(
    documentContent: string,
    contractType: string
  ): Promise<ValidationResult> {
    this.errors = [];
    this.warnings = [];
    this.checksPerformed = 0;
    this.checksPassed = 0;

    // Verify contract type matches rules
    if (this.rules.contract_type !== contractType) {
      throw new Error(
        `Contract type mismatch: rules are for '${this.rules.contract_type}', ` +
        `but validating '${contractType}'`
      );
    }

    // Run all enabled validations
    if (this.rules.validations.compliance_summary_table?.enabled) {
      await this.validateComplianceTable(documentContent);
    }

    if (this.rules.validations.section_based_format?.enabled) {
      await this.validateSectionBasedFormat(documentContent);
    }

    if (this.rules.validations.status_value_standardization?.enabled) {
      await this.validateStatusValues(documentContent);
    }

    if (this.rules.validations.appendix_structure?.enabled) {
      await this.validateAppendixStructure(documentContent);
    }

    if (this.rules.validations.compliance_calculation?.enabled) {
      await this.validateCalculations(documentContent);
    }

    if (this.rules.validations.template_completeness?.enabled) {
      await this.validateCompleteness(documentContent);
    }

    if (this.rules.validations.two_tier_scoring?.enabled) {
      await this.validateTwoTierScoring(documentContent);
    }

    if (this.rules.validations.forbidden_section_numbering?.enabled) {
      await this.validateForbiddenSectionNumbering(documentContent);
    }

    if (this.rules.validations.document_control_table?.enabled) {
      await this.validateDocumentControlTable(documentContent);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      validationSummary: {
        totalChecks: this.checksPerformed,
        passed: this.checksPassed,
        failed: this.errors.length,
        warnings: this.warnings.length,
      },
    };
  }

  /**
   * Validate 6-column Compliance Summary table format
   */
  private async validateComplianceTable(content: string): Promise<void> {
    const rules = this.rules.validations.compliance_summary_table!;
    this.checksPerformed++;

    // Find Compliance Summary section
    const summaryMatch = content.match(/##\s+Compliance Summary\s*\n([\s\S]*?)(?=\n##|\n\*\*Overall Compliance\*\*|$)/);

    if (!summaryMatch) {
      this.errors.push({
        errorId: 'MISSING_COMPLIANCE_SUMMARY',
        severity: rules.severity,
        validationArea: 'Compliance Summary Table',
        location: 'Document structure',
        expected: '## Compliance Summary section',
        found: 'Section not found',
        references: {
          skillMd: 'lines 676-687',
          template: this.rules.template_file,
        },
        fix: 'Add ## Compliance Summary section with 6-column table',
      });
      return;
    }

    const tableSection = summaryMatch[1];
    const lineNumber = this.getLineNumber(content, summaryMatch.index!);

    // Extract table rows (lines that start and end with |)
    const tableLines = tableSection.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('|') && trimmed.endsWith('|');
    });

    if (tableLines.length < 3) {
      this.errors.push({
        errorId: 'MISSING_TABLE',
        severity: rules.severity,
        validationArea: 'Compliance Summary Table',
        lineNumber,
        location: 'Compliance Summary section',
        expected: 'Markdown table with header, separator, and data rows',
        found: `Only ${tableLines.length} table lines found (need at least 3: header, separator, data)`,
        references: {
          skillMd: 'lines 676-687',
        },
        fix: 'Add complete markdown table with 6 columns',
      });
      return;
    }

    // Validate table header
    const headerRow = tableLines[0];
    const expectedColumns = ['Code', 'Requirement', 'Category', 'Status', 'Source Section', 'Responsible Role'];

    const headerCols = this.parseTableRow(headerRow);
    if (headerCols.length !== 6) {
      this.errors.push({
        errorId: 'INVALID_TABLE_COLUMNS',
        severity: rules.severity,
        validationArea: 'Compliance Summary Table',
        lineNumber: lineNumber + 1,
        location: 'Table header',
        expected: `6 columns: ${expectedColumns.join(' | ')}`,
        found: `${headerCols.length} columns: ${headerCols.join(' | ')}`,
        references: {
          skillMd: 'lines 677-678',
        },
        fix: `Ensure table has exactly 6 columns in this order: ${expectedColumns.join(', ')}`,
      });
      return;
    }

    // Validate column names
    for (let i = 0; i < expectedColumns.length; i++) {
      if (headerCols[i].trim() !== expectedColumns[i]) {
        this.errors.push({
          errorId: 'INVALID_COLUMN_NAME',
          severity: rules.severity,
          validationArea: 'Compliance Summary Table',
          lineNumber: lineNumber + 1,
          location: `Table header, column ${i + 1}`,
          expected: expectedColumns[i],
          found: headerCols[i].trim(),
          references: {
            skillMd: 'lines 677',
          },
          fix: `Change column ${i + 1} from "${headerCols[i].trim()}" to "${expectedColumns[i]}"`,
        });
      }
    }

    // Validate separator row
    const separatorRow = tableLines[1];
    const separatorCols = this.parseTableRow(separatorRow);
    if (separatorCols.length !== 6) {
      this.errors.push({
        errorId: 'INVALID_SEPARATOR',
        severity: rules.severity,
        validationArea: 'Compliance Summary Table',
        lineNumber: lineNumber + 2,
        location: 'Table separator',
        expected: '6 column separators (|------|------|------|------|------|------|)',
        found: `${separatorCols.length} column separators`,
        references: {
          skillMd: 'line 679',
        },
        fix: 'Ensure separator row has exactly 6 columns matching header',
      });
    }

    // Validate data rows
    const dataRows = tableLines.slice(2);

    if (rules.requirement_count && dataRows.length !== rules.requirement_count) {
      this.errors.push({
        errorId: 'INVALID_ROW_COUNT',
        severity: rules.severity,
        validationArea: 'Compliance Summary Table',
        lineNumber: lineNumber + 3,
        location: 'Table data rows',
        expected: `${rules.requirement_count} requirement rows`,
        found: `${dataRows.length} rows`,
        references: {
          skillMd: 'line 680',
        },
        fix: this.rules.error_messages?.table_row_count_mismatch?.replace('{actual}', dataRows.length.toString()) ||
             `Add missing requirement rows or verify requirement count (expected ${rules.requirement_count}, found ${dataRows.length})`,
      });
    }

    // Validate each data row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const cols = this.parseTableRow(row);
      const rowLineNumber = lineNumber + 3 + i;

      if (cols.length !== 6) {
        this.errors.push({
          errorId: 'INVALID_ROW_COLUMNS',
          severity: rules.severity,
          validationArea: 'Compliance Summary Table',
          lineNumber: rowLineNumber,
          location: `Table row ${i + 1}`,
          expected: '6 columns',
          found: `${cols.length} columns`,
          references: {
            skillMd: 'line 677',
          },
          fix: `Ensure row ${i + 1} has exactly 6 columns`,
        });
        continue;
      }

      // Validate Code column (column 0)
      const codePattern = /^[A-Z]+\d+$/;
      if (!codePattern.test(cols[0].trim())) {
        this.errors.push({
          errorId: 'INVALID_CODE_FORMAT',
          severity: rules.severity,
          validationArea: 'Compliance Summary Table',
          lineNumber: rowLineNumber,
          location: `Row ${i + 1}, Code column`,
          expected: 'Code pattern: uppercase letters + numbers (e.g., LASRE01, LAC1)',
          found: cols[0].trim(),
          references: {
            skillMd: 'line 680',
          },
          fix: `Format code as uppercase letters followed by numbers (e.g., ${this.rules.contract_type.toUpperCase().slice(0, 3)}${i + 1})`,
        });
      }

      // Validate Status column (column 3)
      const status = cols[3].trim();
      const allowedStatuses = ['Compliant', 'Non-Compliant', 'Not Applicable', 'Unknown'];
      if (!allowedStatuses.includes(status)) {
        const suggestion = this.suggestStatusCorrection(status);
        this.errors.push({
          errorId: 'INVALID_STATUS_VALUE',
          severity: rules.severity,
          validationArea: 'Compliance Summary Table',
          lineNumber: rowLineNumber,
          location: `Row ${i + 1}, Status column`,
          expected: `One of: ${allowedStatuses.join(', ')}`,
          found: status,
          references: {
            skillMd: 'line 682',
            shared: 'shared/fragments/status-codes.md',
          },
          fix: suggestion ?
               `Change "${status}" to "${suggestion}" (exact case required)` :
               `Use one of the allowed status values: ${allowedStatuses.join(', ')}`,
        });
      }
    }

    this.checksPassed++;
  }

  /**
   * Validate section-based format (for Business Continuity)
   */
  private async validateSectionBasedFormat(content: string): Promise<void> {
    const rules = this.rules.validations.section_based_format!;
    this.checksPerformed++;

    if (!rules.required_sections) {
      this.checksPassed++;
      return;
    }

    for (const section of rules.required_sections) {
      const headingPattern = new RegExp(`##\\s+${section.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const match = content.match(headingPattern);

      if (!match) {
        this.errors.push({
          errorId: 'MISSING_REQUIRED_SECTION',
          severity: rules.severity || 'BLOCKING',
          validationArea: 'Section-Based Format',
          location: 'Document structure',
          expected: section.heading,
          found: 'Section not found',
          references: {
            template: this.rules.template_file,
          },
          fix: `Add section: ${section.heading}`,
        });
      }
    }

    this.checksPassed++;
  }

  /**
   * Validate status values across all locations
   */
  private async validateStatusValues(content: string): Promise<void> {
    const rules = this.rules.validations.status_value_standardization!;
    this.checksPerformed++;

    const allowedValues = rules.allowed_values;
    const locations = [
      // Table status column (already validated in table validation)
      // Requirement section status
      { pattern: /\*\*Status\*\*:\s*\[(.*?)\]/g, location: 'Requirement section status' },
      // Subsection status
      { pattern: /-\s*Status:\s*(\S+)/g, location: 'Subsection status line' },
    ];

    for (const { pattern, location } of locations) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const status = match[1].trim();
        const lineNumber = this.getLineNumber(content, match.index);

        if (rules.case_sensitive) {
          if (!allowedValues.includes(status)) {
            const suggestion = this.suggestStatusCorrection(status, rules.common_errors);
            this.errors.push({
              errorId: 'INVALID_STATUS_VALUE',
              severity: rules.severity,
              validationArea: 'Status Value Standardization',
              lineNumber,
              location,
              expected: `One of: ${allowedValues.join(', ')}`,
              found: status,
              references: {
                skillMd: 'line 682',
                shared: 'shared/fragments/status-codes.md',
              },
              fix: suggestion ?
                   `Change "${status}" to "${suggestion}"` :
                   `Use exact case: ${allowedValues.join(', ')}`,
            });
          }
        } else {
          const statusLower = status.toLowerCase();
          const matchFound = allowedValues.some(v => v.toLowerCase() === statusLower);
          if (!matchFound) {
            this.errors.push({
              errorId: 'INVALID_STATUS_VALUE',
              severity: rules.severity,
              validationArea: 'Status Value Standardization',
              lineNumber,
              location,
              expected: `One of: ${allowedValues.join(', ')}`,
              found: status,
              references: {
                skillMd: 'line 682',
                shared: 'shared/fragments/status-codes.md',
              },
              fix: `Use one of the allowed status values: ${allowedValues.join(', ')}`,
            });
          }
        }
      }
    }

    this.checksPassed++;
  }

  /**
   * Validate Appendix A.1-A.4 structure
   */
  private async validateAppendixStructure(content: string): Promise<void> {
    const rules = this.rules.validations.appendix_structure!;
    this.checksPerformed++;

    const requiredAppendices = rules.required_appendices;
    const foundAppendices: Array<{ id: string; index: number; line: number }> = [];

    // Find all appendix headings
    const appendixPattern = /###\s+(A\.\d+)\s+/g;
    let match;

    while ((match = appendixPattern.exec(content)) !== null) {
      foundAppendices.push({
        id: match[1],
        index: match.index,
        line: this.getLineNumber(content, match.index),
      });
    }

    // Check for missing appendices
    for (const required of requiredAppendices) {
      if (!foundAppendices.some(f => f.id === required)) {
        this.errors.push({
          errorId: 'MISSING_APPENDIX',
          severity: rules.severity,
          validationArea: 'Appendix Structure',
          location: 'Appendix section',
          expected: `### ${required}`,
          found: 'Appendix not found',
          references: {
            skillMd: 'lines 676-687',
          },
          fix: `Add appendix section: ### ${required}` +
               (rules.note ? ` (${rules.note})` : ''),
        });
      }
    }

    // Check order if strict_order is enabled
    if (rules.strict_order && foundAppendices.length > 1) {
      const expectedOrder = [...requiredAppendices].sort();
      const actualOrder = foundAppendices.map(f => f.id).sort();

      for (let i = 0; i < foundAppendices.length - 1; i++) {
        const current = foundAppendices[i];
        const next = foundAppendices[i + 1];
        const currentNum = parseFloat(current.id.substring(2));
        const nextNum = parseFloat(next.id.substring(2));

        if (currentNum > nextNum) {
          this.errors.push({
            errorId: 'APPENDIX_OUT_OF_ORDER',
            severity: rules.severity,
            validationArea: 'Appendix Structure',
            lineNumber: current.line,
            location: `Appendix ${current.id}`,
            expected: `Appendices in order: ${expectedOrder.join(' → ')}`,
            found: `${current.id} appears before ${next.id}`,
            references: {
              skillMd: 'lines 676-687',
            },
            fix: `Reorder appendices: ${expectedOrder.join(' → ')}`,
          });
          break;
        }
      }
    }

    this.checksPassed++;
  }

  /**
   * Validate compliance calculation accuracy
   */
  private async validateCalculations(content: string): Promise<void> {
    const rules = this.rules.validations.compliance_calculation!;
    this.checksPerformed++;

    // Find Overall Compliance section
    const overallMatch = content.match(/\*\*Overall Compliance\*\*:\s*\n([\s\S]*?)(?=\n##|\*\*Completeness\*\*|$)/);

    if (!overallMatch) {
      this.errors.push({
        errorId: 'MISSING_OVERALL_COMPLIANCE',
        severity: rules.severity,
        validationArea: 'Compliance Calculations',
        location: 'Document structure',
        expected: '**Overall Compliance**: section',
        found: 'Section not found',
        references: {
          skillMd: 'lines 683-686',
          shared: 'shared/fragments/compliance-summary-footer.md',
        },
        fix: 'Add **Overall Compliance**: section after Compliance Summary table',
      });
      return;
    }

    const complianceSection = overallMatch[1];
    const lineNumber = this.getLineNumber(content, overallMatch.index!);

    // Extract status counts (capture any emoji/character to validate later)
    const statusPattern = /- (.)\s+([\w\s-]+?):\s+(\d+)\/(\d+)\s+\((\d+)%\)/g;
    const statuses: Record<string, { count: number; total: number; percentage: number; emoji: string }> = {};

    let statusMatch;
    let totalFromCounts = 0;
    let expectedTotal: number | null = null;

    while ((statusMatch = statusPattern.exec(complianceSection)) !== null) {
      const emoji = statusMatch[1];
      const name = statusMatch[2].trim(); // Trim to avoid spacing issues
      const count = parseInt(statusMatch[3], 10);
      const total = parseInt(statusMatch[4], 10);
      const percentage = parseInt(statusMatch[5], 10);

      statuses[name] = { count, total, percentage, emoji };
      totalFromCounts += count;
      expectedTotal = total;
    }

    if (!expectedTotal) {
      this.errors.push({
        errorId: 'MISSING_COMPLIANCE_METRICS',
        severity: rules.severity,
        validationArea: 'Compliance Calculations',
        lineNumber,
        location: 'Overall Compliance section',
        expected: 'Compliance metrics with counts and percentages',
        found: 'No compliance metrics found',
        references: {
          skillMd: 'lines 683-686',
        },
        fix: 'Add compliance metrics: Compliant, Non-Compliant, Not Applicable, Unknown',
      });
      return;
    }

    // Validate sum: Compliant + Non-Compliant + Not Applicable + Unknown = TOTAL
    if (totalFromCounts !== expectedTotal) {
      this.errors.push({
        errorId: 'CALCULATION_SUM_ERROR',
        severity: rules.severity,
        validationArea: 'Compliance Calculations',
        lineNumber,
        location: 'Overall Compliance section',
        expected: `Sum of status counts equals TOTAL (${expectedTotal})`,
        found: `Sum = ${totalFromCounts}`,
        references: {
          skillMd: 'line 684',
        },
        fix: `Verify counts: ${Object.entries(statuses).map(([k, v]) => `${k}=${v.count}`).join(', ')} should sum to ${expectedTotal}`,
      });
    }

    // Validate percentages
    for (const [name, data] of Object.entries(statuses)) {
      const calculated = Math.round((data.count / data.total) * 100);
      if (Math.abs(calculated - data.percentage) > rules.percentage_tolerance) {
        this.errors.push({
          errorId: 'CALCULATION_PERCENTAGE_ERROR',
          severity: rules.severity,
          validationArea: 'Compliance Calculations',
          lineNumber,
          location: `${name} percentage`,
          expected: `${calculated}% (calculated from ${data.count}/${data.total})`,
          found: `${data.percentage}%`,
          references: {
            skillMd: 'lines 671-672',
          },
          fix: `Change ${name} percentage from ${data.percentage}% to ${calculated}%`,
        });
      }
    }

    // Validate emoji indicators
    const expectedEmojis: Record<string, string> = {
      'Compliant': '✅',
      'Non-Compliant': '❌',
      'Not Applicable': '⊘',
      'Unknown': '❓',
    };

    for (const [name, data] of Object.entries(statuses)) {
      if (expectedEmojis[name] && data.emoji !== expectedEmojis[name]) {
        this.errors.push({
          errorId: 'INVALID_EMOJI_INDICATOR',
          severity: rules.severity,
          validationArea: 'Compliance Calculations',
          lineNumber,
          location: `${name} line`,
          expected: `Emoji: ${expectedEmojis[name]}`,
          found: `Emoji: ${data.emoji}`,
          references: {
            skillMd: 'line 683',
          },
          fix: `Use correct emoji for ${name}: ${expectedEmojis[name]}`,
        });
      }
    }

    this.checksPassed++;
  }

  /**
   * Validate template completeness (required sections)
   */
  private async validateCompleteness(content: string): Promise<void> {
    const rules = this.rules.validations.template_completeness!;
    this.checksPerformed++;

    const sectionPatterns: Record<string, RegExp> = {
      'header': /^#\s+Compliance Contract:/m,
      'document_control': /##\s+Document Control/,
      'compliance_summary': /##\s+Compliance Summary/,
      'overall_compliance': /\*\*Overall Compliance\*\*:/,
      'appendix_a1_a4': /###\s+A\.1\s+/,
      'dynamic_sections': /##\s+Data Extracted from ARCHITECTURE\.md/,
    };

    for (const section of rules.required_sections) {
      const pattern = sectionPatterns[section];
      if (!pattern) {
        continue; // Skip unknown section identifiers
      }

      if (!pattern.test(content)) {
        this.errors.push({
          errorId: 'MISSING_REQUIRED_SECTION',
          severity: rules.severity,
          validationArea: 'Template Completeness',
          location: 'Document structure',
          expected: `Section: ${section}`,
          found: 'Section not found',
          references: {
            template: this.rules.template_file,
          },
          fix: `Add required section: ${section}`,
        });
      }
    }

    this.checksPassed++;
  }

  /**
   * Validate two-tier scoring (SRE Architecture special case)
   */
  private async validateTwoTierScoring(content: string): Promise<void> {
    const rules = this.rules.validations.two_tier_scoring!;
    this.checksPerformed++;

    // Check for blocker section note
    if (rules.blocker_section_pattern) {
      const pattern = new RegExp(rules.blocker_section_pattern);
      if (!pattern.test(content)) {
        this.warnings.push({
          errorId: 'MISSING_TWO_TIER_NOTE',
          severity: 'WARNING',
          validationArea: 'Two-Tier Scoring',
          location: 'Compliance Summary section',
          expected: 'Two-tier scoring note before Compliance Summary table',
          found: 'Note not found',
          references: {
            template: this.rules.template_file,
          },
          fix: this.rules.error_messages?.missing_two_tier_note ||
               'Add note explaining two-tier scoring (Blocker vs Desired requirements)',
        });
      }
    }

    // Verify blocker + desired counts match total
    const totalExpected = rules.blocker_count + rules.desired_count;
    const tableRules = this.rules.validations.compliance_summary_table;

    if (tableRules?.requirement_count && tableRules.requirement_count !== totalExpected) {
      this.errors.push({
        errorId: 'TWO_TIER_COUNT_MISMATCH',
        severity: rules.severity,
        validationArea: 'Two-Tier Scoring',
        location: 'Requirement counts',
        expected: `Total requirements = ${rules.blocker_count} (Blocker) + ${rules.desired_count} (Desired) = ${totalExpected}`,
        found: `Total requirements = ${tableRules.requirement_count}`,
        references: {
          template: this.rules.template_file,
        },
        fix: `Verify requirement counts: Blocker=${rules.blocker_count}, Desired=${rules.desired_count}, Total=${totalExpected}`,
      });
    }

    this.checksPassed++;
  }

  /**
   * Validate that sections after A.4 are NOT numbered as A.5+
   * BLOCKING severity - prevents contract generation if violations found
   */
  private async validateForbiddenSectionNumbering(content: string): Promise<void> {
    const rules = this.rules.validations.forbidden_section_numbering!;
    this.checksPerformed++;

    let errorsFound = 0;

    // Check each forbidden pattern
    for (const pattern of rules.forbidden_patterns) {
      const regex = new RegExp(pattern, 'gm');
      const matches = content.matchAll(regex);

      for (const match of matches) {
        // Find line number (approximate)
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        this.errors.push({
          errorId: 'FORBIDDEN_SECTION_NUMBERING',
          severity: rules.severity,
          validationArea: 'Appendix Structure',
          lineNumber,
          location: `Section numbering after A.4`,
          expected: 'Plain H2 header (## Section Name)',
          found: match[0],
          references: {
            skillMd: 'SKILL.md lines 87-107 (CRITICAL FORMAT PRESERVATION RULES)',
            template: 'Template HTML comments after A.4 section',
          },
          fix: `Change "${match[0]}" to "## ${match[0].replace(/###\s+A\.\d+\s+/, '')}" (remove numbering, use H2)`,
        });
        errorsFound++;
      }
    }

    if (errorsFound === 0) {
      this.checksPassed++;
    }
  }

  /**
   * Validate Document Control section uses table format (not bold field lists)
   * BLOCKING severity - prevents contract generation if table format violated
   */
  private async validateDocumentControlTable(content: string): Promise<void> {
    const rules = this.rules.validations.document_control_table!;
    this.checksPerformed++;

    // Find Document Control section
    const dcSectionMatch = content.match(/##\s+Document Control\s*\n([\s\S]*?)(?=\n##|$)/);

    if (!dcSectionMatch) {
      this.errors.push({
        errorId: 'MISSING_DOCUMENT_CONTROL',
        severity: rules.severity,
        validationArea: 'Document Control',
        location: 'Document structure',
        expected: '## Document Control section',
        found: 'Section not found',
        references: {
          skillMd: 'SKILL.md lines 108-138',
          shared: 'shared/sections/document-control.md',
        },
        fix: 'Add Document Control section with table format',
      });
      return;
    }

    const dcContent = dcSectionMatch[1];
    const beforeMatch = content.substring(0, dcSectionMatch.index);
    const sectionLineNumber = beforeMatch.split('\n').length;

    // Check for required table pattern
    const tablePatternRegex = new RegExp(rules.required_table_pattern, 'm');
    const hasTableFormat = tablePatternRegex.test(dcContent);

    if (!hasTableFormat) {
      // Check if bold field list format is being used (violation)
      const boldFieldPattern = /\*\*[A-Za-z\s]+\*\*:\s+/;
      const hasBoldFieldFormat = boldFieldPattern.test(dcContent);

      this.errors.push({
        errorId: 'INVALID_DOCUMENT_CONTROL_FORMAT',
        severity: rules.severity,
        validationArea: 'Document Control',
        lineNumber: sectionLineNumber,
        location: 'Document Control section',
        expected: 'Markdown table format: | Field | Value |',
        found: hasBoldFieldFormat ? 'Bold field list format: **Field**: Value' : 'Unknown format',
        references: {
          skillMd: 'SKILL.md lines 108-138 (Document Control Table Structure)',
          shared: 'shared/sections/document-control.md lines 3-6 (HTML comment)',
        },
        fix: rules.error_message + '\n\nCorrect format:\n```markdown\n| Field | Value |\n|-------|-------|\n| Document Owner | VALUE |\n| Last Review Date | VALUE |\n...\n```',
      });
      return;
    }

    // Validate required fields are present in table
    for (const field of rules.required_fields) {
      const fieldPattern = new RegExp(`\\|\\s*${field}\\s*\\|`, 'i');
      if (!fieldPattern.test(dcContent)) {
        this.warnings.push({
          errorId: 'MISSING_REQUIRED_FIELD',
          severity: 'WARNING',  // Field missing is warning, not blocking
          validationArea: 'Document Control',
          lineNumber: sectionLineNumber,
          location: 'Document Control table',
          expected: `Table row with field: ${field}`,
          found: 'Field not found in table',
          references: {
            shared: 'shared/sections/document-control.md',
          },
          fix: `Add row to Document Control table: | ${field} | [VALUE] |`,
        });
      }
    }

    if (this.errors.filter(e => e.errorId === 'INVALID_DOCUMENT_CONTROL_FORMAT').length === 0) {
      this.checksPassed++;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Parse table row into columns
   */
  private parseTableRow(row: string): string[] {
    return row
      .split('|')
      .slice(1, -1) // Remove leading and trailing empty strings from split
      .map(col => col.trim());
  }

  /**
   * Get line number for a given character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Suggest status value correction based on common errors
   */
  private suggestStatusCorrection(
    invalidStatus: string,
    commonErrors?: Record<string, string>
  ): string | null {
    // Check common errors map first
    if (commonErrors && commonErrors[invalidStatus]) {
      return commonErrors[invalidStatus];
    }

    // Default common errors
    const defaults: Record<string, string> = {
      'compliant': 'Compliant',
      'non-compliant': 'Non-Compliant',
      'not applicable': 'Not Applicable',
      'unknown': 'Unknown',
      'N/A': 'Not Applicable',
      'Pass': 'Compliant',
      'Fail': 'Non-Compliant',
      'pass': 'Compliant',
      'fail': 'Non-Compliant',
      'PASS': 'Compliant',
      'FAIL': 'Non-Compliant',
    };

    return defaults[invalidStatus] || null;
  }
}
