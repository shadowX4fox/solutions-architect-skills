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
