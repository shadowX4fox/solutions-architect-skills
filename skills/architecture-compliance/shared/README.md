# Shared Compliance Template Content

## Purpose

This directory contains reusable sections and fragments used across all 10 compliance templates to eliminate duplication and ensure consistency.

**Benefits**:
- **Reduces duplication**: Eliminates ~1,150-1,400 lines across all 10 templates
- **Centralizes maintenance**: Update once, apply to all templates
- **Ensures consistency**: Guaranteed identical scoring logic, status codes, and data sections
- **Simplifies updates**: Single point of change for common sections

---

## Directory Structure

```
shared/
├── sections/                                   # Complete reusable sections
│   ├── document-control.md                     # Document Control table structure
│   ├── dynamic-field-instructions.md           # Dynamic field mappings
│   ├── validation-methodology.md               # Appendix A.2 content
│   ├── completion-guide-intro.md               # Appendix A.3 intro text
│   ├── generation-metadata.md                  # Generation Metadata section
│   ├── change-history-template.md              # Appendix A.4 Change History
│   ├── data-extracted-template.md              # Data Extracted Successfully section
│   ├── missing-data-table-template.md          # Missing Data Requiring Attention table
│   ├── not-applicable-template.md              # Not Applicable Items section
│   └── unknown-status-table-template.md        # Unknown Status Items table
│
├── fragments/                                  # Smaller reusable fragments
│   ├── status-codes.md                         # 4 status definitions
│   ├── compliance-score-calculation.md         # N/A scoring rules
│   └── compliance-summary-footer.md            # Overall Compliance + Completeness display
│
├── config/                                     # Domain-specific configuration
│   ├── business-continuity.json                # Business Continuity config
│   ├── cloud-architecture.json                 # Cloud Architecture config
│   ├── data-ai-architecture.json               # Data & AI Architecture config
│   ├── development-architecture.json           # Development Architecture config
│   ├── enterprise-architecture.json            # Enterprise Architecture config
│   ├── integration-architecture.json           # Integration Architecture config
│   ├── platform-it-infrastructure.json         # Platform IT Infrastructure config
│   ├── process-transformation.json             # Process Transformation config
│   ├── security-architecture.json              # Security Architecture config
│   └── sre-architecture.json                   # SRE Architecture config
│
└── README.md                                   # This file
```

---

## Include Syntax

### Simple Include (100% Identical Content)

For content that is identical across all templates:

```markdown
<!-- @include shared/fragments/status-codes.md -->
```

**Use for**:
- Status Codes definitions
- Compliance Score Calculation rules
- Any content that is 100% identical

### Include with Config (Parameterized Content)

For content that has the same structure but domain-specific values:

```markdown
<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->
```

**Use for**:
- Document Control (validation config path varies)
- Dynamic Field Instructions (review board names vary)
- Validation Methodology (domain names vary)

---

## Exceptions to Shared Includes

While most sections use shared includes, some templates have domain-specific requirements that necessitate inline content:

### Appendix A.2 - Validation Methodology Exceptions

**TEMPLATE_DEVELOPMENT_ARCHITECTURE.md**:
- Uses inline A.2 validation methodology
- **Reason**: LADES1.6 (Stack Validation Checklist) is a blocking requirement
- **Unique Logic**: Contract cannot be approved if LADES1.6 status is "Unknown"
- **Impact**: Requires custom compliance scoring formula

**TEMPLATE_INTEGRATION_ARCHITECTURE.md**:
- Uses inline A.2 validation methodology
- **Reason**: Custom weight distribution (30% Completeness, 60% Compliance, 10% Quality)
- **Standard Weights**: 40% Completeness, 50% Compliance, 10% Quality
- **Impact**: References external JSON validation file

These exceptions are intentional and should be maintained as inline content.

---

## Template Variables

Shared files can use template variables that get replaced with domain-specific values from config files.

### Variable Syntax

In shared files, use double-curly-brace syntax:

```markdown
**Approval Authority**: {{approval_authority}}
**Review Board**: {{review_board}}
**Compliance Code**: {{compliance_prefix}}
**Domain Name**: {{domain_name}}
```

### Variable Resolution

Variables are replaced during include processing using values from `shared/config/<domain>.json`.

**Example**: For `config=business-continuity`, variables are loaded from `shared/config/business-continuity.json`:

```json
{
  "domain_name": "Business Continuity",
  "compliance_prefix": "LABC",
  "review_board": "Business Continuity Review Board",
  "approval_authority": "Business Continuity Review Board",
  "validation_config_path": "/skills/architecture-compliance/validation/business_continuity_validation.json"
}
```

---

## How Includes Are Processed

During template loading (Phase 4, Step 4.1 of compliance generation):

1. **Read template file** (e.g., `TEMPLATE_BUSINESS_CONTINUITY.md`)
2. **Detect include directives** using regex: `<!-- @include(-with-config)?\s+(.+?)\s*(?:config=(\S+))?\s*-->`
3. **For each directive**:
   - Parse type (simple or with-config)
   - Resolve file path (relative to `/skills/architecture-compliance/`)
   - Read shared file content
   - If with-config:
     - Load domain config from `shared/config/<domain>.json`
     - Replace `{{variables}}` in shared content with config values
   - Replace directive with processed content
4. **Support nested includes** (max 3 levels deep)
5. **Return fully expanded template** for placeholder replacement

---

## Adding New Shared Content

### Step 1: Identify Duplication

Find content duplicated across multiple templates (90%+ identical).

**Examples**:
- Identical tables or lists
- Same formulas or calculations
- Consistent structure with only variable names changing

### Step 2: Extract to Appropriate Subdirectory

Choose the right location:

- **`sections/`**: Complete standalone sections (10+ lines)
  - Example: Document Control, Validation Methodology

- **`fragments/`**: Smaller reusable pieces (2-10 lines)
  - Example: Status Codes, Compliance Score Calculation

### Step 3: Replace Domain-Specific Values with {{variables}}

Identify values that vary by domain and replace with variables:

```markdown
# Before (domain-specific)
**Review Board**: Business Continuity Review Board

# After (parameterized)
**Review Board**: {{review_board}}
```

### Step 4: Create/Update Domain Configs

Add variable mappings to `shared/config/<domain>.json`:

```json
{
  "review_board": "Business Continuity Review Board"
}
```

### Step 5: Replace Original Content with Include Directive

In the template, replace the extracted content:

```markdown
# Before
**Status Codes**:
- **Compliant**: Requirement fully satisfied with documented evidence
- **Non-Compliant**: Requirement not met or missing from ARCHITECTURE.md
- **Not Applicable**: Requirement does not apply to this solution
- **Unknown**: Partial information exists but insufficient to determine compliance

# After
<!-- @include shared/fragments/status-codes.md -->
```

### Step 6: Test Generation

Generate a compliance contract to verify:
- Include is resolved correctly
- Variables are replaced with correct values
- Output is identical to original template

---

## Variable Naming Conventions

### Required Variables

These variables should be in all domain configs:

- `domain_name`: Full name of the compliance domain (e.g., "Business Continuity")
- `compliance_prefix`: Code prefix for requirements (e.g., "LABC", "LAC", "LASRE")
- `review_board`: Name of the review board (e.g., "Business Continuity Review Board")
- `approval_authority`: Authority that approves contracts (usually same as review_board)
- `validation_config_path`: Path to validation JSON (e.g., `/skills/architecture-compliance/validation/business_continuity_validation.json`)
- `primary_source_sections`: ARCHITECTURE.md sections where data is sourced (e.g., "10 (Non-Functional Requirements), 11 (Operational Considerations)")
- `framework_description`: Brief description of framework requirements (e.g., "RTO/RPO, backup, DR, and high availability")
- `compliance_framework_code`: Full compliance code with domain name (e.g., "LABC (Business Continuity)")
- `v2_domain_features`: Detailed list of Version 2.0 domain-specific features (can be empty string)
- `v2_data_point_count`: Number of validation data points in Version 2.0 (e.g., "10")

### Optional Variables

Add domain-specific variables as needed:

- `domain_terms`: Dictionary of domain-specific terminology
- `abbreviations`: Dictionary of domain-specific abbreviations
- Custom variables for specific use cases

### Naming Style

- Use `snake_case` for variable names
- Be descriptive but concise
- Use full words, avoid abbreviations in variable names

---

## Troubleshooting

### Variables Not Being Replaced

**Symptom**: Output shows `{{variable_name}}` instead of value

**Causes**:
1. Variable not defined in domain config
2. Using simple `@include` instead of `@include-with-config`
3. Typo in variable name

**Solution**:
- Add variable to `shared/config/<domain>.json`
- Change to `@include-with-config`
- Check variable name spelling matches config

### Include File Not Found

**Symptom**: Error during template loading or include not resolved

**Causes**:
1. Incorrect file path in include directive
2. File doesn't exist in shared directory
3. Typo in filename

**Solution**:
- Verify file path is relative to `/skills/architecture-compliance/`
- Check file exists: `ls shared/sections/` or `ls shared/fragments/`
- Correct typo in directive

### Circular Include Detected

**Symptom**: Infinite loop or recursion error

**Cause**: File A includes File B, which includes File A

**Solution**:
- Restructure includes to remove circular dependency
- Max 3 levels of nesting enforced to prevent deep recursion

### Output Different from Original Template

**Symptom**: Generated contract doesn't match original template output

**Causes**:
1. Shared content doesn't match original
2. Variable replacement not working correctly
3. Extra whitespace or formatting differences

**Solution**:
- Compare shared file with original template section
- Verify all variables are being replaced
- Check for whitespace differences (tabs vs spaces)

---

## Migration Guide for New Templates

All 10 current templates have been refactored to use shared content. For future new compliance domains:

### Step 1: Create Domain Config

Create `shared/config/<domain-name>.json` with all required variables:

```json
{
  "domain_name": "New Domain Name",
  "compliance_prefix": "LANEW",
  "review_board": "New Domain Review Board",
  "approval_authority": "New Domain Review Board",
  "validation_config_path": "/skills/architecture-compliance/validation/new_domain_validation.json",
  "primary_source_sections": "Relevant ARCHITECTURE.md section numbers",
  "framework_description": "Brief description of requirements",
  "compliance_framework_code": "LANEW (New Domain)",
  "v2_domain_features": "List of domain-specific features or empty string",
  "v2_data_point_count": "Number of data points"
}
```

### Step 2: Create Template with Includes

Use the standard include directives pattern found in existing templates:

**Document Control Section**:
```markdown
<!-- @include-with-config shared/sections/document-control.md config=<domain-name> -->
```

**Dynamic Field Instructions**:
```markdown
<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=<domain-name> -->
```

**Compliance Score Calculation**:
```markdown
<!-- @include shared/fragments/compliance-score-calculation.md -->
```

**Appendix A.1 Status Codes**:
```markdown
<!-- @include shared/fragments/status-codes.md -->
```

**Appendix A.2 Validation Methodology**:
```markdown
<!-- @include-with-config shared/sections/validation-methodology.md config=<domain-name> -->
```

**Appendix A.3 Intro**:
```markdown
<!-- @include shared/sections/completion-guide-intro.md -->
```

**Post-Appendix Sections** (in order):
```markdown
<!-- @include-with-config shared/sections/data-extracted-template.md config=<domain-name> -->

---

<!-- @include-with-config shared/sections/missing-data-table-template.md config=<domain-name> -->

---

<!-- @include-with-config shared/sections/not-applicable-template.md config=<domain-name> -->

---

<!-- @include-with-config shared/sections/unknown-status-table-template.md config=<domain-name> -->

---

<!-- @include-with-config shared/sections/generation-metadata.md config=<domain-name> -->
```

### Step 3: Test Template Expansion

```bash
bun utils/resolve-includes.ts templates/TEMPLATE_<NAME>.md /tmp/test.md
```

Verify:
- All includes resolve correctly
- Variables are replaced with config values
- Output structure is correct

### Step 4: Verify Line Counts

```bash
wc -l templates/TEMPLATE_<NAME>.md
```

Expected template size: 300-1,700 lines (depending on domain complexity)
Expected line expansion: +80-130 lines when includes are resolved

---

## Maintenance

### Updating Shared Content

When updating shared files:

1. **Test impact**: Generate contracts for all domains using the shared file
2. **Verify consistency**: Ensure change is appropriate for all domains
3. **Document change**: Update this README if behavior changes
4. **Version control**: Commit with clear message explaining change

### Adding New Domains

When adding new compliance domains:

1. Create `shared/config/<new-domain>.json`
2. Define all required variables
3. Create template using include directives
4. Test generation thoroughly
5. Document any domain-specific variations

---

## Statistics

**Current Status** (as of December 2025):

| Metric | Value |
|--------|-------|
| Shared sections | 10 (document-control, dynamic-field-instructions, validation-methodology, completion-guide-intro, generation-metadata, change-history-template, data-extracted-template, missing-data-table-template, not-applicable-template, unknown-status-table-template) |
| Shared fragments | 3 (status-codes, compliance-score-calculation, compliance-summary-footer) |
| Domain configs | 10 (all domains) |
| Templates refactored | 10 (all templates) |
| Templates remaining | 0 |
| Lines saved | ~1,340 lines across all 10 templates |
| Refactoring phases | 3 (Quick Wins + Table Templates + Compliance Summary) |
| Appendix standardization | COMPLETE - All templates have A.1-A.4 structure |

**Template-Specific Savings**:

| Template | Original Lines | Refactored Lines | Savings |
|----------|---------------|------------------|---------|
| Business Continuity | ~294 (expanded) | 164 | ~130 |
| Security Architecture | ~784 (expanded) | 647 | ~137 |
| SRE Architecture | ~1,736 (expanded) | 1,605 | ~131 |
| Process Transformation | ~628 (expanded) | 491 | ~137 |
| Platform IT Infrastructure | ~717 (expanded) | 580 | ~137 |
| Development Architecture | ~623 (expanded) | 524 | ~99 |
| Integration Architecture | ~655 (expanded) | 550 | ~105 |
| Cloud Architecture | ~509 (expanded) | 372 | ~137 |
| Data & AI Architecture | ~1,293 (expanded) | 1,156 | ~137 |
| Enterprise Architecture | ~861 (expanded) | 724 | ~137 |

**Total Estimated Savings**: ~1,287 lines eliminated through shared content extraction

---

## Support

For questions or issues with shared content:

1. Check this README first
2. Review existing shared files for examples
3. Test include processing with simple examples
4. Consult SKILL.md for include resolution algorithm

---

**Last Updated**: 2025-12-11
**Version**: 2.0 (All templates refactored with Appendix extraction)
**Author**: Architecture Compliance Skill
