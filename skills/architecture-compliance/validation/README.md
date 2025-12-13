# Compliance Template Validation System

## Overview

This directory contains external validation configuration files for all 10 compliance contract templates. The validation system provides automated scoring (0-10 scale) to determine whether compliance contracts should be automatically approved, sent for manual review, require additional work, or be rejected.

## Purpose

The external validation system separates validation logic from template content, providing:

1. **Maintainability**: Validation rules are centralized and easier to update
2. **Consistency**: All templates use the same validation methodology
3. **Transparency**: Numeric scores (0-10) provide granular feedback
4. **Automation**: Clear thresholds enable automatic approval for high-quality contracts
5. **Extensibility**: Easy to add new validation items without modifying templates
6. **Audit Trail**: Validation configs are versioned and traceable

## Validation Configuration Files

Each compliance template has a corresponding validation configuration file:

| Template | Validation Config File |
|----------|------------------------|
| Development Architecture | `development_architecture_validation.json` |
| Business Continuity | `business_continuity_validation.json` |
| SRE Architecture | `sre_architecture_validation.json` |
| Cloud Architecture | `cloud_architecture_validation.json` |
| Security Architecture | `security_architecture_validation.json` |
| Data & Analytics - AI | `data_analytics_ai_validation.json` |
| Process Transformation | `process_transformation_validation.json` |
| Platform & IT Infrastructure | `platform_it_infrastructure_validation.json` |
| Enterprise Architecture | `enterprise_architecture_validation.json` |
| Integration Architecture | `integration_architecture_validation.json` |

## Validation Schema

All validation configuration files conform to `VALIDATION_SCHEMA.json`, which defines:

- **Template metadata**: Name, ID, version, approval authority
- **Scoring configuration**: Scale (0-10), thresholds, weights, status code mapping
- **Validation sections**: Grouped validation items with weights
- **Validation items**: Individual checks with questions, rules, and criteria
- **Outcome mapping**: Score ranges mapped to approval actions
- **Remediation guidance**: Help for addressing validation failures

## Scoring System

### Score Calculation

The final validation score (0-10) is calculated using a weighted formula:

```
Final Score = (Completeness × W₁) + (Compliance × W₂) + (Quality × W₃)

Where:
- Completeness = (Filled required data points / Total required data points) × 10
- Compliance = (PASS items + N/A items + EXCEPTION items) / (Total applicable items) × 10
- Quality = Source traceability score (0-10 based on line number coverage)
- W₁, W₂, W₃ = Template-specific weights (must sum to 1.0)

**CRITICAL - N/A Items Calculation Example:**

N/A items MUST be included in the compliance score numerator:

```
Example:
- 6 PASS items, 5 N/A items, 0 FAIL items, 0 UNKNOWN items (11 total items)
- Compliance = (6 PASS + 5 N/A + 0 EXCEPTION) / 11 × 10 = 11/11 × 10 = 10.0/10 (100%)
- ✅ Correct: N/A counted as fully compliant
- ❌ Wrong: 6/11 × 10 = 6.0/10 (treating N/A as neutral)
```
```

### Template-Specific Weights

**Weights are template-specific** (defined in validation config JSON files):

- Most templates use: Completeness 40%, Compliance 50%, Quality 10%
- Security/SRE/Integration: Completeness 30%, Compliance 60%, Quality 10% (compliance-focused)
- Business Continuity: Completeness 50%, Compliance 40%, Quality 10% (completeness-focused)
- Cloud Architecture: Completeness 35%, Compliance 55%, Quality 10% (balanced)

See individual validation config files in `/validation/*_validation.json` for exact weights per template.

### Template-Specific Weight Recommendations

| Template | Completeness | Compliance | Quality | Rationale |
|----------|--------------|------------|---------|-----------|
| Development Architecture | 40% | 50% | 10% | Stack compliance critical, moderate documentation |
| Security Architecture | 20% | 70% | 10% | Security controls non-negotiable |
| SRE Architecture | 30% | 60% | 10% | Availability and reliability metrics paramount |
| Cloud Architecture | 35% | 55% | 10% | Cloud provider compliance essential |
| Data & Analytics - AI | 40% | 50% | 10% | Data governance and AI compliance equally important |
| Business Continuity | 50% | 40% | 10% | Comprehensive recovery plans paramount |
| Integration Architecture | 35% | 55% | 10% | Integration security and standards critical |
| Enterprise Architecture | 45% | 45% | 10% | Strategic documentation and compliance balanced |
| Platform & IT Infrastructure | 40% | 50% | 10% | Infrastructure standards and documentation critical |
| Process Transformation | 50% | 40% | 10% | Detailed process documentation paramount |

## Validation Status Codes

Each validation item receives one of five status codes:

| Status Code | Score | Meaning | Criteria |
|-------------|-------|---------|----------|
| **PASS** | 10 | Fully compliant | Item meets all validation criteria |
| **FAIL** | 0 | Non-compliant | Item violates validation rules (deprecated version, unapproved technology) |
| **N/A** | 10 | Not applicable | Item doesn't apply to this architecture (e.g., Java validation when using .NET) |
| **UNKNOWN** | 0 | Missing data | Required data not found in ARCHITECTURE.md |
| **EXCEPTION** | 10 | Approved deviation | Properly documented exception via LADES2 process (ADR + approval) |

### Key Decisions

- **UNKNOWN = 0**: Missing data is treated as a failure, forcing complete documentation
- **EXCEPTION = 10**: Properly documented exceptions count as fully compliant (no penalty for approved deviations)

## Outcome Tiers

The validation system maps final scores to four outcome tiers:

| Score Range | Overall Status | Document Status | Action | Review Actor | Description |
|-------------|----------------|-----------------|--------|--------------|-------------|
| **8.0-10.0** | PASS | Approved | AUTO_APPROVE | System (Auto-Approved) | High confidence validation. Contract automatically approved without human review. |
| **7.0-7.9** | PASS | In Review | MANUAL_REVIEW | [Approval Authority] | Validation passed with small gaps. Ready for human review by approval authority. |
| **5.0-6.9** | CONDITIONAL | Draft | NEEDS_WORK | Architecture Team | Validation incomplete. Must address missing data or FAIL items before approval. |
| **0.0-4.9** | FAIL | Rejected | REJECT | N/A (Blocked) | Critical failures or insufficient data. Cannot proceed to approval. |

### Approval Gating

- **Validation score ≥ 7.0** is MANDATORY for approval pathway
- **Score 8.0-10.0**: Automatic approval (no human review required)
- **Score 7.0-7.9**: Manual review by approval authority required
- **Score 5.0-6.9**: Must address gaps before proceeding to review
- **Score < 5.0**: Contract rejected, cannot proceed

## Validation Rules Types

Validation configurations support several rule types:

### 1. version_check

Validates technology versions against approved and deprecated lists.

```json
{
  "type": "version_check",
  "approved_versions": ["Java 11 LTS", "Java 17 LTS", "Java 21 LTS"],
  "deprecated_versions": ["Java 8"],
  "pass_criteria": "Version found in approved list",
  "fail_criteria": "Deprecated version or unapproved version",
  "na_criteria": "Java not used in architecture",
  "unknown_criteria": "Version not specified in ARCHITECTURE.md"
}
```

### 2. presence_check

Validates that required data is present in ARCHITECTURE.md.

```json
{
  "type": "presence_check",
  "architecture_md_section": "9.3",
  "required_format": "Duration (e.g., 4 hours, 24 hours)",
  "pass_criteria": "RTO value specified with time unit",
  "fail_criteria": "N/A (presence check cannot fail)",
  "na_criteria": "Not applicable to this architecture",
  "unknown_criteria": "RTO not specified in Section 9.3"
}
```

### 3. value_check

Validates values against an approved list.

```json
{
  "type": "value_check",
  "approved_values": ["AWS", "Azure", "Google Cloud Platform"],
  "pass_criteria": "Cloud provider in approved list",
  "fail_criteria": "Unapproved cloud provider",
  "na_criteria": "On-premises infrastructure only",
  "unknown_criteria": "Cloud provider not specified"
}
```

### 4. format_check

Validates data format or structure.

```json
{
  "type": "format_check",
  "required_format": "TLS 1.2 or TLS 1.3",
  "pass_criteria": "TLS version is 1.2 or 1.3",
  "fail_criteria": "TLS version is 1.0 or 1.1 (deprecated)",
  "na_criteria": "No external TLS endpoints",
  "unknown_criteria": "TLS version not specified"
}
```

### 5. custom

Custom validation logic (defined in generation code).

```json
{
  "type": "custom",
  "pass_criteria": "Custom condition met",
  "fail_criteria": "Custom condition not met",
  "na_criteria": "Custom check not applicable",
  "unknown_criteria": "Insufficient data for custom check"
}
```

## Validation Process

The validation engine executes the following steps:

1. **Load Configuration**: Read validation config JSON for target template
2. **Extract Data**: Parse ARCHITECTURE.md and extract data points per validation items
3. **Evaluate Items**: Apply validation rules to each item, assign status (PASS/FAIL/N/A/UNKNOWN/EXCEPTION)
4. **Calculate Scores**:
   - Item scores: Based on status code mapping (PASS=10, FAIL=0, N/A=10, UNKNOWN=0, EXCEPTION=10)
   - Section scores: Weighted average of item scores within section
   - Completeness: (Filled required fields / Total required fields) × 10
   - Compliance: (PASS + N/A + EXCEPTION items / Total applicable items) × 10
   - Quality: Source traceability coverage (0-10)
   - Final score: (Completeness × W₁) + (Compliance × W₂) + (Quality × W₃)
5. **Determine Outcome**: Map final score to tier (AUTO_APPROVE/MANUAL_REVIEW/NEEDS_WORK/REJECT)
6. **Generate Results Object**: Create validation_results with score, status, breakdown, and recommendations
7. **Populate Template**: Fill in Document Control fields and compliance summary based on results
8. **Generate Manifest**: Create COMPLIANCE_MANIFEST.md summarizing:
   - Validation framework reference (two-stage validation)
   - Validation configuration details (schema, rule files)
   - All generated contracts with validation scores
   - Aggregate metrics and approval status

## Validation Results Object

The validation engine produces a structured results object:

```json
{
  "validation_results": {
    "final_score": 8.7,
    "completeness_score": 9.0,
    "compliance_score": 9.5,
    "quality_score": 6.0,
    "overall_status": "PASS",
    "document_status": "Approved",
    "action": "AUTO_APPROVE",
    "validation_date": "2025-12-07",
    "validation_evaluator": "Claude Code (Automated Validation Engine)",
    "review_actor": "System (Auto-Approved)",
    "sections": {
      "stack_compliance": {
        "score": 9.5,
        "weight": 0.4,
        "items": {
          "java_version": {
            "status": "PASS",
            "score": 10,
            "evidence": "Java 17 LTS - Section 8.1, line 952",
            "line_numbers": [952]
          }
        }
      }
    },
    "failures": [],
    "unknowns": [],
    "exceptions": [],
    "remediation_recommendations": []
  }
}
```

## Exception Handling

Properly documented exceptions are treated as fully compliant (EXCEPTION = 10/10):

### Requirements for EXCEPTION Status

1. Deviation from technology stack documented in ARCHITECTURE.md Section 12 (ADR)
2. Architecture Decision Record (ADR) includes:
   - Business justification
   - Technical rationale
   - Alternatives considered
   - Risk assessment
   - Mitigation plan
3. Exception approved by chapter/architecture review board
4. Exception registered in compliance contract (LADES2 process)

### Remediation Paths

| Status | Remediation Action |
|--------|-------------------|
| **FAIL** | Option 1: Migrate to approved technology stack<br>Option 2: Register exception via LADES2 process |
| **UNKNOWN** | Add missing data to ARCHITECTURE.md Section X.Y |
| **Low Completeness** | Complete all required sections before submitting for approval |

## Edge Cases

The validation system handles several edge cases:

| Edge Case | Detection | Behavior | Outcome |
|-----------|-----------|----------|---------|
| Backend-Only Architecture | No frontend keywords | Frontend validation items → N/A | PASS if backend compliant |
| Full-Stack (Java + React) | Backend + frontend detected | Evaluate both stacks | PASS if all compliant |
| Polyglot Backend (Java + .NET) | Multiple backend languages | Evaluate all backends separately | PASS only if both comply |
| Section 8 Missing | Not found or <50 characters | Skip stack validation entirely | FAIL (critical data missing) |
| Partial Section 8 | Missing versions/details | Mark items UNKNOWN | FAIL if score < 5.0 |
| Deprecated Versions | Version comparison vs catalog | Mark deprecated as FAIL | FAIL until upgrade/exception |
| Unapproved Technology | Not in authorized catalog | Mark unapproved as FAIL | FAIL until migration/exception |

## Source Traceability

All extracted data must include source references:

- **Format**: "Section X.Y, line Z" or "Sections X-Y, lines A-B"
- **Requirement**: Every data point in compliance contract must trace to ARCHITECTURE.md
- **Quality Score**: Based on percentage of data points with line number references
- **Placeholder Convention**:
  ```markdown
  **[Field Name]**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section X.Y]
  Note: Add [specific data] to ARCHITECTURE.md Section X.Y
  ```

## Updating Validation Configurations

To add or modify validation rules:

1. Edit the appropriate `*_validation.json` file
2. Ensure changes conform to `VALIDATION_SCHEMA.json`
3. Validate JSON syntax and schema compliance
4. Update version number in validation config (semantic versioning)
5. Document changes in version control commit message
6. Test validation with sample ARCHITECTURE.md files

### Schema Validation

Validate configuration files against the schema:

```bash
# Using a JSON schema validator tool
jsonschema -i development_architecture_validation.json VALIDATION_SCHEMA.json
```

## Version History

- **1.0.0** (2025-12-07): Initial release
  - Externalized validation from templates
  - Standardized 0-10 scoring system
  - Four-tier outcome mapping (AUTO_APPROVE, MANUAL_REVIEW, NEEDS_WORK, REJECT)
  - Template-specific weight configurations
  - UNKNOWN = 0, EXCEPTION = 10 scoring decisions

## References

- **VALIDATION_SCHEMA.json**: JSON schema defining validation configuration structure
- **COMPLIANCE_GENERATION_GUIDE.md**: Step-by-step guide for generating compliance contracts with validation
- **STACK_VALIDATION_CHECKLIST.md**: 26-item checklist for Development Architecture validation
- **Templates**: 10 compliance contract templates in `/skills/architecture-compliance/templates/`

## Support

For questions or issues with the validation system:

1. Review this README and VALIDATION_SCHEMA.json
2. Check existing validation configuration files for examples
3. Consult COMPLIANCE_GENERATION_GUIDE.md for generation workflow
4. Review template Document Control sections for validation field instructions
