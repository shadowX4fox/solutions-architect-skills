#!/usr/bin/env bun

/**
 * Questions & Gaps Register Populator
 *
 * Post-generation pipeline step that replaces the placeholder
 * "## Questions & Gaps Register" table with a fully computed
 * 8-column register derived from the Compliance Summary.
 *
 * Also updates A.3.1 with gap summary statistics.
 *
 * @module questions-register-populator
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { parseComplianceSummaryTable, type Requirement } from './score-calculator';

const SKILL_DIR = resolve(import.meta.dir, '..');

// ============================================================================
// Types
// ============================================================================

export interface RegisterRow {
  code: string;
  requirement: string;
  type: 'Non-Compliant' | 'Unknown' | 'Not Applicable';
  status: string;
  owner: string;
  archSection: string;
  actionRequired: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface ValidationItem {
  code?: string;
  item_id: string;
  question: string;
  architecture_md_section: string;
  required: boolean;
  criticality?: 'blocker' | 'desired';
  validation_rules: {
    fail_criteria: string;
    unknown_criteria: string;
    na_criteria: string;
    pass_criteria: string;
  };
}

interface ValidationSection {
  section_id: string;
  section_name: string;
  validation_items: ValidationItem[];
}

interface DomainValidation {
  validation_sections: ValidationSection[];
}

// ============================================================================
// Priority Derivation
// ============================================================================

/**
 * Derive priority for a gap row.
 *
 * Blocker/desired comes from the validation JSON `criticality` field.
 * Domains without `criticality` (9 of 10) default to "blocker" since all
 * their requirements use `required: true` with no tiering.
 */
function derivePriority(
  status: string,
  criticality: 'blocker' | 'desired'
): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (status === 'Not Applicable') return 'Low';

  if (criticality === 'blocker') {
    return status === 'Non-Compliant' ? 'Critical' : 'High';
  }

  // desired tier
  return 'Medium';
}

// ============================================================================
// Action Required Derivation
// ============================================================================

/**
 * Build a concise action string from validation rules.
 * Uses fail_criteria for Non-Compliant, unknown_criteria for Unknown,
 * na_criteria for Not Applicable.
 */
function deriveAction(status: string, item: ValidationItem): string {
  if (status === 'Non-Compliant') {
    return item.validation_rules.fail_criteria
      .replace(/ - BLOCKS APPROVAL/gi, '')
      .trim();
  }
  if (status === 'Unknown') {
    return item.validation_rules.unknown_criteria
      .replace(/ - BLOCKS APPROVAL/gi, '')
      .trim();
  }
  if (status === 'Not Applicable') {
    return 'Verify justification: ' + item.validation_rules.na_criteria.trim();
  }
  return 'Review and update documentation';
}

// ============================================================================
// Validation JSON Loading
// ============================================================================

/**
 * Load domain validation JSON and build a code → ValidationItem map.
 * Normalizes codes to uppercase for reliable lookup.
 */
function loadValidationItemMap(validationConfigPath: string): Map<string, ValidationItem> {
  const normalized = validationConfigPath
    .replace(/^\//, '')
    .replace(/^skills\/architecture-compliance\//, '');
  const fullPath = join(SKILL_DIR, normalized);

  let domainValidation: DomainValidation;
  try {
    const content = readFileSync(fullPath, 'utf-8');
    domainValidation = JSON.parse(content) as DomainValidation;
  } catch (error) {
    console.warn(`Could not load validation config for register population: ${error}`);
    return new Map();
  }

  const map = new Map<string, ValidationItem>();

  for (const section of domainValidation.validation_sections ?? []) {
    for (const item of section.validation_items ?? []) {
      // Use explicit `code` field if present (SRE), else derive from item_id
      const code = (item.code ?? item.item_id).toUpperCase();
      map.set(code, item);
    }
  }

  return map;
}

// ============================================================================
// Register Row Builder
// ============================================================================

/**
 * Build register rows from non-Compliant requirements.
 */
function buildRegisterRows(
  requirements: Requirement[],
  validationItemMap: Map<string, ValidationItem>
): RegisterRow[] {
  const rows: RegisterRow[] = [];

  for (const req of requirements) {
    if (req.status === 'Compliant') continue;

    const type = req.status as 'Non-Compliant' | 'Unknown' | 'Not Applicable';
    const validationItem = validationItemMap.get(req.code.toUpperCase());

    const criticality: 'blocker' | 'desired' =
      validationItem?.criticality ?? 'blocker';

    const priority = derivePriority(req.status, criticality);

    const archSection = validationItem?.architecture_md_section
      ? `Section ${validationItem.architecture_md_section}`
      : req.sourceSection || 'Not documented';

    const actionRequired = validationItem
      ? deriveAction(req.status, validationItem)
      : 'Document this requirement in ARCHITECTURE.md';

    rows.push({
      code: req.code,
      requirement: req.requirement,
      type,
      status: req.status,
      owner: req.role || 'N/A',
      archSection,
      actionRequired,
      priority,
    });
  }

  // Sort: Critical → High → Medium → Low
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  rows.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return rows;
}

// ============================================================================
// Markdown Rendering
// ============================================================================

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderRegisterTable(rows: RegisterRow[]): string {
  if (rows.length === 0) {
    return '| — | No gaps found — all requirements are Compliant | — | — | — | — | — | — |\n';
  }

  return rows
    .map(r =>
      `| ${escapeCell(r.code)} | ${escapeCell(r.requirement)} | ${r.type} | ${r.status} | ${escapeCell(r.owner)} | ${escapeCell(r.archSection)} | ${escapeCell(r.actionRequired)} | ${r.priority} |`
    )
    .join('\n') + '\n';
}

function buildRegisterSection(rows: RegisterRow[]): string {
  const lines: string[] = [
    '## Questions & Gaps Register',
    '',
    'The following items require attention to improve compliance. Each row maps to a requirement from the Compliance Summary that is not yet "Compliant". Use this register to assign ownership, plan remediation, and track progress.',
    '',
    '| Code | Requirement | Type | Status | Owner | ARCHITECTURE.md Section | Action Required | Priority |',
    '|------|-------------|------|--------|-------|-------------------------|-----------------|----------|',
    renderRegisterTable(rows),
    '**Type definitions**:',
    '- `Non-Compliant` — Requirement explicitly not met',
    '- `Unknown` — Partial information exists but insufficient to determine compliance',
    '- `Not Applicable` — Requirement does not apply to this solution (justification required)',
    '',
    '**Priority derivation**:',
    '- `Critical` — Non-Compliant blocker requirement (blocks approval)',
    '- `High` — Unknown blocker requirement (blocks approval)',
    '- `Medium` — Non-Compliant or Unknown desired requirement',
    '- `Low` — Not Applicable item (justification review recommended)',
    '',
    '> **Note for editable exports**: The "Owner", "Action Required", and "Priority" columns are designed for stakeholder input. When this document is exported to Word format, these fields are highlighted for editing.',
    '',
  ];
  return lines.join('\n');
}

// ============================================================================
// A.3.1 Summary Statistics
// ============================================================================

function buildGapSummaryStatistics(rows: RegisterRow[]): string {
  const byType = {
    'Non-Compliant': rows.filter(r => r.type === 'Non-Compliant').length,
    'Unknown': rows.filter(r => r.type === 'Unknown').length,
    'Not Applicable': rows.filter(r => r.type === 'Not Applicable').length,
  };
  const byPriority = {
    Critical: rows.filter(r => r.priority === 'Critical').length,
    High: rows.filter(r => r.priority === 'High').length,
    Medium: rows.filter(r => r.priority === 'Medium').length,
    Low: rows.filter(r => r.priority === 'Low').length,
  };

  const lines = [
    `| Metric | Count |`,
    `|--------|-------|`,
    `| **Total gaps** | **${rows.length}** |`,
    `| Non-Compliant | ${byType['Non-Compliant']} |`,
    `| Unknown | ${byType['Unknown']} |`,
    `| Not Applicable | ${byType['Not Applicable']} |`,
    `| Critical priority | ${byPriority.Critical} |`,
    `| High priority | ${byPriority.High} |`,
    `| Medium priority | ${byPriority.Medium} |`,
    `| Low priority | ${byPriority.Low} |`,
  ];
  return lines.join('\n');
}

// ============================================================================
// Contract Content Updaters
// ============================================================================

/**
 * Replace the Questions & Gaps Register section content in the contract.
 *
 * The section starts at `## Questions & Gaps Register` and ends at the next
 * `## ` heading (or end of file). The replacement overwrites everything in
 * between.
 */
function replaceRegisterSection(content: string, newSection: string): string {
  // Match from "## Questions & Gaps Register" to the next H2/H3 heading or end of string.
  // Note: /m flag makes ^ match line starts but also makes $ match line ends (not EOF).
  // We use a greedy [\s\S]* with a lookahead that explicitly handles EOF via (?:\n## |\n### )
  // or consumes everything remaining when no subsequent heading exists.
  const registerPattern = /^## Questions & Gaps Register[\s\S]*?(?=\n## |\n### )/m;
  const registerPatternEOF = /^## Questions & Gaps Register[\s\S]*/m;

  if (registerPattern.test(content)) {
    return content.replace(registerPattern, newSection.trimEnd());
  }

  // Fallback: register is the last section (no subsequent ## heading) — use greedy match to EOF
  if (registerPatternEOF.test(content)) {
    return content.replace(registerPatternEOF, newSection.trimEnd());
  }

  // If section not found, append before "## Generation Metadata" or at end
  const metaPattern = /\n## Generation Metadata/;
  if (metaPattern.test(content)) {
    return content.replace(metaPattern, '\n\n' + newSection.trimEnd() + '\n\n## Generation Metadata');
  }

  return content + '\n\n' + newSection;
}

/**
 * Update A.3.1 Identified Gaps / Gap Summary Statistics in the contract.
 */
function updateA31Section(content: string, summaryTable: string): string {
  // Match A.3.1 content (may be titled "Identified Gaps" or "Gap Summary Statistics")
  const a31Pattern = /#### A\.3\.1[^\n]*\n([\s\S]*?)(?=\n####|\n###|\n##|$)/;
  const match = content.match(a31Pattern);

  if (!match) {
    return content; // A.3.1 not found — skip silently
  }

  const newA31Block = `#### A.3.1 Gap Summary Statistics\n\n${summaryTable}\n\nFor full details, see the [Questions & Gaps Register](#questions--gaps-register) section below.\n`;
  return content.replace(a31Pattern, newA31Block);
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Populate the Questions & Gaps Register in a compliance contract.
 *
 * @param contractContent  Full markdown content of the generated contract
 * @param validationConfigPath  Path to the domain validation JSON (e.g., "validation/sre_architecture_validation.json")
 * @returns Updated contract content with the register filled in
 */
export function populateQuestionsRegister(
  contractContent: string,
  validationConfigPath: string
): string {
  // 1. Parse Compliance Summary
  let tableData;
  try {
    tableData = parseComplianceSummaryTable(contractContent);
  } catch (error) {
    console.warn(`Could not parse Compliance Summary for register population: ${error}`);
    return contractContent;
  }

  // 2. Load validation items for action/section enrichment
  const validationItemMap = loadValidationItemMap(validationConfigPath);

  // 3. Build register rows
  const rows = buildRegisterRows(tableData.requirements, validationItemMap);

  // 4. Render new register section
  const registerSection = buildRegisterSection(rows);

  // 5. Build A.3.1 summary statistics
  const summaryTable = buildGapSummaryStatistics(rows);

  // 6. Replace sections in contract
  let updated = replaceRegisterSection(contractContent, registerSection);
  updated = updateA31Section(updated, summaryTable);

  return updated;
}
