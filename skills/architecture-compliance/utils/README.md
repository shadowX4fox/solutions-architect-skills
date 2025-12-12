# Compliance Template Utilities

This directory contains utility scripts for working with compliance templates.

## Available Implementations

Three implementations are available, each with specific advantages:

1. **`resolve-includes.ts`** (Bun/TypeScript) - Type-safe, modern syntax, best developer experience
2. **`resolve-includes.py`** (Python 3) - Fastest performance, universally available, no dependencies
3. **`resolve-includes.js`** (Node.js) - Cross-runtime compatibility fallback

**Recommended**: Use Python for production (fastest), Bun for development (type safety).

---

## resolve-includes.ts (Bun/TypeScript)

**Purpose**: Type-safe implementation using Bun runtime with modern ES modules and TypeScript interfaces.

### Usage

```bash
bun resolve-includes.ts <template-file> [output-file]
# or make executable:
chmod +x resolve-includes.ts
./resolve-includes.ts <template-file> [output-file]
```

**Arguments:**
- `template-file`: Path to the template file (required)
- `output-file`: Path for the expanded output (optional, outputs to stdout if omitted)

### Examples

**Expand a single template:**
```bash
bun utils/resolve-includes.ts templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md
```

**Output to stdout:**
```bash
bun utils/resolve-includes.ts templates/TEMPLATE_SRE_ARCHITECTURE.md
```

**Test all templates:**
```bash
for template in templates/TEMPLATE_*.md; do
  echo "Testing: $(basename $template)"
  bun utils/resolve-includes.ts "$template" /tmp/test.md
  rm /tmp/test.md
done
```

### Key Features

- ✅ **TypeScript type safety** with interfaces for `DomainConfig` and `IncludeDirective`
- ✅ **Modern ES modules** (`import/export`)
- ✅ **Bun-optimized APIs** (`Bun.file().text()`, `Bun.file().json<T>()`)
- ✅ **Clean async/await** patterns throughout
- ✅ **Same output** as Python version (verified with all 10 templates)

### Requirements

- Bun runtime 1.0 or higher
- No external dependencies

### Performance

Benchmark on SRE Architecture template (1655 lines):
- **Bun**: ~33ms per run
- **Python**: ~23ms per run (1.4x faster)

While Python is faster for small files, Bun provides better type safety and developer experience.

---

## resolve-includes.py (Python 3)

**Purpose**: Resolves `@include` and `@include-with-config` directives in compliance templates, expanding them into fully rendered documents.

### Usage

```bash
python3 resolve-includes.py <template-file> [output-file]
```

**Arguments:**
- `template-file`: Path to the template file (required)
- `output-file`: Path for the expanded output (optional, outputs to stdout if omitted)

### Examples

**Expand a single template:**
```bash
python3 utils/resolve-includes.py templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md
```

**Output to stdout:**
```bash
python3 utils/resolve-includes.py templates/TEMPLATE_SRE_ARCHITECTURE.md
```

**Test all templates:**
```bash
for template in templates/TEMPLATE_*.md; do
  echo "Testing: $(basename $template)"
  python3 utils/resolve-includes.py "$template" /tmp/test.md
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

### Features

- ✅ **Simple includes** for static content
- ✅ **Parameterized includes** with JSON config-based variable replacement
- ✅ **Nested includes** support (up to 3 levels deep)
- ✅ **Circular include detection** prevents infinite loops
- ✅ **Error handling** with descriptive messages
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

The include resolution utilities are used during contract generation (Phase 4, Step 4.1) to expand templates before placeholder replacement.

**Implementation Priority:**
1. **Python** (`resolve-includes.py`) - Recommended for production (fastest)
2. **Bun** (`resolve-includes.ts`) - Recommended for development (type-safe)
3. **Node.js** (`resolve-includes.js`) - Fallback if neither Python nor Bun available

**Workflow:**
1. **Phase 1-3**: Extract data from ARCHITECTURE.md
2. **Phase 4.1**: Load template and resolve includes using one of the scripts above
3. **Phase 4.2**: Apply extracted data to placeholders in expanded template
4. **Phase 4.3**: Populate compliance summary table
5. **Phase 5**: Save final contract

All three implementations produce identical output and support the same features.

### Maintenance

When adding new shared content:

1. Create the shared file in `shared/sections/` or `shared/fragments/`
2. Update domain configs in `shared/config/` with new variables if needed
3. Add `@include` directives to templates
4. Test expansion with this script
5. Update `shared/README.md` documentation

### Requirements

**For Python version:**
- Python 3.6 or higher
- No external dependencies (uses only standard library)

**For Bun version:**
- Bun runtime 1.0 or higher
- No external dependencies

**For Node.js version:**
- Node.js 14 or higher
- No external dependencies (uses only standard library)

### License

Part of the Solutions Architect Skills plugin for Claude Code.

**Last Updated**: 2025-12-11 (Completed Appendix extraction refactoring - all 10 templates optimized)
