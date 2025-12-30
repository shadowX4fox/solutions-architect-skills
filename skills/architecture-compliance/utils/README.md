# Compliance Template Utilities

This directory contains utilities for working with compliance templates.

## resolve-includes.ts (Bun/TypeScript)

**Purpose**: Resolves `@include` and `@include-with-config` directives in compliance templates, expanding them into fully rendered documents using the Bun runtime.

### Usage

```bash
bun resolve-includes.ts <template-file> [output-file] [--validate]
# or make executable:
chmod +x resolve-includes.ts
./resolve-includes.ts <template-file> [output-file] [--validate]
```

**Arguments:**
- `template-file`: Path to the template file (required)
- `output-file`: Path for the expanded output (optional, outputs to stdout if omitted)

**Options:**
- `--validate`: Run template structure pre-validation after expansion

### Examples

**Expand a single template:**
```bash
bun utils/resolve-includes.ts templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md
```

**Output to stdout:**
```bash
bun utils/resolve-includes.ts templates/TEMPLATE_SRE_ARCHITECTURE.md
```

**Expand with validation:**
```bash
bun utils/resolve-includes.ts templates/TEMPLATE_SECURITY_ARCHITECTURE.md expanded.md --validate
```

**Test all templates:**
```bash
for template in templates/TEMPLATE_*.md; do
  echo "Testing: $(basename $template)"
  bun utils/resolve-includes.ts "$template" /tmp/test.md
  rm /tmp/test.md
done
```

### How It Works

1. **Reads the template file** and scans for include directives
2. **Parses each directive** to extract the file path and configuration name
3. **Loads shared content** from the specified path
4. **Replaces variables** (for `@include-with-config`) using domain config files
5. **Recursively resolves** nested includes (up to 3 levels deep)
6. **Outputs the expanded template** with all includes resolved

### Include Directive Syntax

**Simple Include** (static content, no variable replacement):
```markdown
<!-- @include shared/fragments/status-codes.md -->
```

**Parameterized Include** (with variable replacement):
```markdown
<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->
```

### Variable Replacement

Variables in shared content use double-curly-brace syntax: `{{variable_name}}`

**Example shared content:**
```markdown
**Review Board**: {{review_board}}
**Compliance Code**: {{compliance_prefix}}
```

**Domain config** (`shared/config/business-continuity.json`):
```json
{
  "review_board": "Business Continuity Review Board",
  "compliance_prefix": "LABC"
}
```

**Expanded output:**
```markdown
**Review Board**: Business Continuity Review Board
**Compliance Code**: LABC
```

### Key Features

- ✅ **TypeScript type safety** with interfaces for `DomainConfig` and `IncludeDirective`
- ✅ **Modern ES modules** (`import/export`)
- ✅ **Bun-optimized APIs** (`Bun.file().text()`, `Bun.file().json<T>()`)
- ✅ **Clean async/await** patterns throughout
- ✅ **Simple includes** for static content
- ✅ **Parameterized includes** with JSON config-based variable replacement
- ✅ **Nested includes** support (up to 3 levels deep)
- ✅ **Circular include detection** prevents infinite loops
- ✅ **Error handling** with descriptive messages
- ✅ **Template pre-validation** (with `--validate` flag)
- ✅ **Statistics** showing line count changes

### Error Handling

The script handles common errors gracefully:

- **Missing template file**: Exits with error message
- **Missing include file**: Keeps directive in place, shows error
- **Missing config file**: Exits with error message
- **Circular includes**: Exits with error message
- **Max depth exceeded**: Exits with error message
- **Unknown variables**: Warns but continues, keeps `{{variable}}` placeholder

### Testing Results

All 10 compliance templates expand successfully:

| Template | Current Lines | Expanded Lines | Difference |
|----------|--------------|----------------|------------|
| Business Continuity | 164 | 294 | +130 |
| Cloud Architecture | 372 | 509 | +137 |
| Data & AI Architecture | 1156 | 1293 | +137 |
| Development Architecture | 530 | 622 | +92 |
| Enterprise Architecture | 724 | 861 | +137 |
| Integration Architecture | 556 | 654 | +98 |
| Platform IT Infrastructure | 586 | 716 | +130 |
| Process Transformation | 497 | 627 | +130 |
| Security Architecture | 653 | 783 | +130 |
| SRE Architecture | 1611 | 1735 | +124 |

**Total lines saved by using includes**: ~1,287 lines across all 10 templates

**Shared Content Breakdown:**
- 10 shared sections (document-control, dynamic-field-instructions, validation-methodology, completion-guide-intro, generation-metadata, change-history-template, data-extracted-template, missing-data-table-template, not-applicable-template, unknown-status-table-template)
- 3 shared fragments (status-codes, compliance-score-calculation, compliance-summary-footer)
- 10 domain configs (all compliance domains)
- 3 refactoring phases completed (Quick Wins + Table Templates + Compliance Summary)
- Appendix standardization COMPLETE - All 10 templates have A.1-A.4 structure

### Integration with Skill

The include resolution utility is used during contract generation (Phase 4, Step 4.1) to expand templates before placeholder replacement.

**Workflow:**
1. **Phase 1-3**: Extract data from ARCHITECTURE.md
2. **Phase 4.1**: Load template and resolve includes using `resolve-includes.ts`
3. **Phase 4.2**: Apply extracted data to placeholders in expanded template
4. **Phase 4.3**: Populate compliance summary table
5. **Phase 5**: Save final contract

### Template Pre-Validation

When using the `--validate` flag, the utility runs structural validation on the expanded template to catch common issues early:

```bash
bun utils/resolve-includes.ts templates/TEMPLATE_SRE_ARCHITECTURE.md expanded.md --validate
```

**Validates:**
- Required sections present (Document Control, Compliance Summary, Appendix)
- Appendix structure (A.1-A.4 sections)
- Compliance codes follow correct format
- No duplicate codes
- Required metadata fields present

**Benefits:**
- Catch template errors before contract generation
- Ensure template consistency across all 10 contract types
- Faster feedback loop during template development

### Performance

Benchmark on SRE Architecture template (1655 lines):
- **Bun**: ~33ms per run
- Includes type safety and modern developer experience
- Zero external dependencies

### Maintenance

When adding new shared content:

1. Create the shared file in `shared/sections/` or `shared/fragments/`
2. Update domain configs in `shared/config/` with new variables if needed
3. Add `@include` directives to templates
4. Test expansion with this script
5. Update `shared/README.md` documentation

### Requirements

- Bun runtime 1.0 or higher
- No external dependencies

### License

Part of the Solutions Architect Skills plugin for Claude Code.

**Last Updated**: 2025-12-13 (Removed Python/Node.js implementations - Bun/TypeScript only)

---

## manifest-generator.ts (Bun/TypeScript)

**Purpose**: Generate or update the COMPLIANCE_MANIFEST.md file after each compliance contract generation. Tracks all generated contracts with metadata (score, status, completeness).

### Usage

```bash
bun manifest-generator.ts --mode <create|update> --project "<name>" \
  --contract-type "<type>" --filename "<file>" --score <0-10> \
  --status "<status>" --completeness <0-100>
# or make executable:
chmod +x manifest-generator.ts
./manifest-generator.ts --mode <create|update> ...
```

**Required Arguments:**
- `--mode`: `create` (new manifest) or `update` (modify existing)
- `--project`: Project name from ARCHITECTURE.md Document Index
- `--contract-type`: Full contract type name (e.g., "Development Architecture", "Cloud Architecture")
- `--filename`: Generated contract filename
- `--score`: Validation score (0-10, one decimal place, e.g., 8.5)
- `--status`: Document status - one of: `Approved`, `In Review`, `Draft`, `Rejected`
- `--completeness`: Completeness percentage (0-100, e.g., 85 for 85%)

**Optional Arguments:**
- `--compliance-docs-dir`: Custom output directory (default: `./compliance-docs`)

**Working Directory Consideration** (v1.9.3+):

When invoking manifest-generator from a different working directory than where ARCHITECTURE.md resides (e.g., plugin context), you MUST provide the `--compliance-docs-dir` parameter with an absolute path.

Example:
```bash
# Determine absolute path first
ARCH_DIR=$(dirname "$(realpath /path/to/ARCHITECTURE.md)")
COMPLIANCE_DOCS_DIR="${ARCH_DIR}/compliance-docs"

# Pass to manifest-generator
bun manifest-generator.ts \
  --mode create \
  --compliance-docs-dir "${COMPLIANCE_DOCS_DIR}" \
  [other params...]
```

Without this parameter, manifest-generator uses `process.cwd()/compliance-docs`, which may be incorrect in plugin contexts.

### Examples

**Create new manifest (first contract):**
```bash
bun utils/manifest-generator.ts --mode create --project "Task Scheduling System" \
  --contract-type "Development Architecture" \
  --filename "DEVELOPMENT_ARCHITECTURE_TaskScheduling_2025-12-14.md" \
  --score 8.5 --status "Approved" --completeness 85
```

**Update existing manifest (subsequent contract):**
```bash
bun utils/manifest-generator.ts --mode update --project "Task Scheduling System" \
  --contract-type "Cloud Architecture" \
  --filename "CLOUD_ARCHITECTURE_TaskScheduling_2025-12-14.md" \
  --score 7.8 --status "In Review" --completeness 78
```

**Regenerate contract (replaces existing entry):**
```bash
bun utils/manifest-generator.ts --mode update --project "Task Scheduling System" \
  --contract-type "Development Architecture" \
  --filename "DEVELOPMENT_ARCHITECTURE_TaskScheduling_2025-12-14.md" \
  --score 9.0 --status "Approved" --completeness 95
```

### How It Works

1. **Parses command-line arguments** and validates required parameters
2. **Loads existing manifest** (in update mode) and extracts contract entries from table
3. **Merges contract data**:
   - Replaces entry if contract type already exists (regeneration)
   - Appends entry if new contract type
   - Sorts entries alphabetically by contract type
4. **Calculates summary statistics**:
   - Total contracts, average score, average completeness
   - Counts by status (Approved, In Review, Draft, Rejected)
5. **Generates manifest content**:
   - Framework Reference section (static)
   - Validation Configuration section (static)
   - Generated Documents table (dynamic)
   - Summary section (calculated)
6. **Writes manifest file** to `/compliance-docs/COMPLIANCE_MANIFEST.md`

### Manifest Structure

**File**: `/compliance-docs/COMPLIANCE_MANIFEST.md`

**Contents**:
```markdown
# Compliance Documentation Manifest

**Project**: [PROJECT_NAME]
**Source**: ARCHITECTURE.md
**Generated**: [GENERATION_DATE]

---

## Compliance Framework Reference
[Framework version, scoring formula, approval thresholds table]

---

## Validation Configuration
[Schema paths, engine version, rule files]

---

## Generated Documents

| Contract Type | Filename | Score | Status | Completeness | Generated |
|---------------|----------|-------|--------|--------------|-----------|
| Cloud Architecture | CLOUD_ARCHITECTURE_Task_2025-12-14.md | 7.8 | In Review | 78% | 2025-12-14 |
| Development Architecture | DEV_ARCHITECTURE_Task_2025-12-14.md | 8.5 | Approved | 85% | 2025-12-14 |
| SRE Architecture | SRE_ARCHITECTURE_Task_2025-12-14.md | 9.2 | Approved | 92% | 2025-12-14 |

---

## Summary
- Total Contracts: 3
- Average Score: 8.5/10
- Average Completeness: 85%
- Approved: 2, In Review: 1, Draft: 0, Rejected: 0
- Last Updated: 2025-12-14 14:30:00
```

### Key Features

- ✅ **TypeScript type safety** with interfaces for `ContractMetadata` and `ManifestData`
- ✅ **Modern ES modules** (`import/export`)
- ✅ **Bun-optimized APIs** (`Bun.file().text()`, `Bun.write()`)
- ✅ **Automatic entry merging** (replace if same type, append if new)
- ✅ **Alphabetical sorting** by contract type
- ✅ **Summary statistics calculation** (averages, status counts)
- ✅ **Markdown table formatting** with proper alignment
- ✅ **Mode detection** (create vs update)
- ✅ **Error handling** with validation of arguments
- ✅ **Programmatic API** (exported functions for testing)

### Update Behavior

**Create mode** (`--mode create`):
- Generates new manifest file
- Initializes with Framework and Validation sections
- Adds first contract entry
- Sets up Summary section

**Update mode** (`--mode update`):
- Reads existing manifest
- Parses contract entries from table
- Merges new contract:
  - **Same contract type**: Replaces existing entry (regeneration)
  - **New contract type**: Appends new entry
- Recalculates summary statistics
- Writes updated manifest

**Example - Regeneration**:
```bash
# Initial generation
bun manifest-generator.ts --mode create --project "Project" \
  --contract-type "Development Architecture" --filename "DEV_v1.md" \
  --score 8.0 --status "Draft" --completeness 75

# Later regeneration (replaces entry)
bun manifest-generator.ts --mode update --project "Project" \
  --contract-type "Development Architecture" --filename "DEV_v2.md" \
  --score 9.5 --status "Approved" --completeness 98

# Result: Only ONE "Development Architecture" entry in manifest (v2 replaced v1)
```

### Integration with SKILL.md

The manifest generator is integrated into the compliance contract generation workflow at **Phase 5, Step 5.3**.

**Workflow**:
1. **Phase 1-3**: Extract data from ARCHITECTURE.md and validate
2. **Phase 4**: Generate compliance contract from template
3. **Phase 5.1-5.2**: Save contract to `/compliance-docs/`
4. **Phase 5.3**: **Update manifest** using `manifest-generator.ts`
5. **Phase 5.4-5.5**: Generate per-contract and summary reports

### Error Handling

The script validates all arguments and handles errors gracefully:

- **Missing required argument**: Exits with clear error message listing required parameters
- **Invalid mode**: Must be `create` or `update`
- **Invalid score**: Must be 0-10
- **Invalid status**: Must be one of: `Approved`, `In Review`, `Draft`, `Rejected`
- **Invalid completeness**: Must be 0-100
- **Compliance docs directory not found**: Exits with error (directory must exist)
- **Manifest not found in update mode**: Automatically switches to create mode

### Performance

- **Fast parsing**: Uses regex to extract table rows from existing manifest
- **Efficient merging**: In-place array operations (replace or append)
- **Clean output**: Formatted markdown with proper table alignment
- **Minimal dependencies**: No external packages required

### Maintenance

When modifying the manifest structure:

1. Update section generators (`generateFrameworkSection`, `generateValidationSection`, etc.)
2. Update table column definitions in `generateDocumentsTable`
3. Update summary calculation in `calculateSummary`
4. Update parsing logic in `parseExistingManifest` if table structure changes
5. Test with both create and update modes

### Requirements

- Bun runtime 1.0 or higher
- No external dependencies
- Compliance docs directory must exist (`/compliance-docs/`)

### Testing

```bash
# Create compliance-docs directory for testing
mkdir -p compliance-docs

# Test create mode
bun utils/manifest-generator.ts --mode create --project "Test Project" \
  --contract-type "Development Architecture" --filename "DEV_Test.md" \
  --score 8.5 --status "Approved" --completeness 85

# Verify manifest was created
cat compliance-docs/COMPLIANCE_MANIFEST.md

# Test update mode (add second contract)
bun utils/manifest-generator.ts --mode update --project "Test Project" \
  --contract-type "Cloud Architecture" --filename "CLOUD_Test.md" \
  --score 7.8 --status "In Review" --completeness 78

# Verify manifest was updated
cat compliance-docs/COMPLIANCE_MANIFEST.md

# Test regeneration (same contract type)
bun utils/manifest-generator.ts --mode update --project "Test Project" \
  --contract-type "Development Architecture" --filename "DEV_Test_v2.md" \
  --score 9.2 --status "Approved" --completeness 95

# Verify entry was replaced (not duplicated)
cat compliance-docs/COMPLIANCE_MANIFEST.md
```

### Exported API

For programmatic use or testing:

```typescript
import {
  generateManifest,
  parseExistingManifest,
  mergeContracts,
  calculateSummary,
  type ContractMetadata,
  type ManifestData
} from './utils/manifest-generator.ts';

// Example: Programmatic usage
const contractMetadata: ContractMetadata = {
  contractType: "Development Architecture",
  filename: "DEV_Project_2025-12-14.md",
  score: 8.5,
  status: "Approved",
  completeness: 85,
  generatedDate: "2025-12-14"
};

await generateManifest(
  '/path/to/compliance-docs',
  contractMetadata,
  'Project Name',
  'create'
);
```

### License

Part of the Solutions Architect Skills plugin for Claude Code.

**Last Updated**: 2025-12-14 (Added manifest-generator.ts)
