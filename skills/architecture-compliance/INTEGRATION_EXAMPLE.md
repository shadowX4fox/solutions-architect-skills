# Compliance Generation with Integrated Validation - Example Workflow

This document demonstrates the complete compliance contract generation workflow with the Template Validation Framework integrated at Phase 4.6.

## Overview

The validation framework is integrated into Phase 4.6 of the compliance generation workflow (as described in SKILL.md). This ensures that all generated contracts strictly adhere to template requirements before being saved to the output directory.

## Full Workflow Example

### Phase 1-4.5: Template Loading and Population
*(Existing workflow - no changes)*

```typescript
// Phase 1: Requirement Extraction from ARCHITECTURE.md
const requirements = extractRequirements(architectureMd);

// Phase 2: Template Selection
const templateType = selectTemplate(requirements);

// Phase 3: Template Loading with Include Resolution
const template = await loadTemplate(templateType);

// Phase 4.1-4.5: Placeholder Replacement and Content Population
const generatedContent = populateTemplate(template, requirements);
```

### Phase 4.6: Automated Template Validation (NEW)

**Integration Point**: Before saving the generated contract, validate it against template rules.

```typescript
import { validateGeneratedContract } from './utils/generation-helper';

// Phase 4.6: Validate generated content
console.log('\n📋 Phase 4.6: Validating generated contract...\n');

const validationResult = await validateGeneratedContract(
  generatedContent,
  contractType  // e.g., 'sre_architecture'
);

if (!validationResult.isValid) {
  // BLOCK: Generation failed validation
  console.error(validationResult.errorReport);

  throw new Error(
    `❌ Validation failed for ${validationResult.contractDisplayName}\n` +
    `   ${validationResult.validationResult.errors.length} error(s), ` +
    `   ${validationResult.validationResult.warnings.length} warning(s)\n` +
    `   Generation blocked - see error report above`
  );
}

// Success: Validation passed
console.log(validationResult.successMessage);
```

### Phase 5: Output
*(Proceed only if validation passed)*

```typescript
// Phase 5: Save validated contract to output directory
const outputPath = `compliance-docs/${contractType}.md`;
await writeFile(outputPath, generatedContent);

console.log(`\n✅ Contract generated successfully: ${outputPath}\n`);
```

## Complete Integration Example

Here's a complete example showing the full integration:

```typescript
#!/usr/bin/env bun
/**
 * Example: Compliance Contract Generation with Validation
 *
 * Demonstrates the complete workflow with validation integrated at Phase 4.6
 */

import { readFile, writeFile } from 'fs/promises';
import { validateGeneratedContract } from './utils/generation-helper';

async function generateComplianceContract(
  architectureMdPath: string,
  contractType: string
): Promise<void> {
  console.log('═'.repeat(80));
  console.log('Compliance Contract Generation Workflow');
  console.log('═'.repeat(80));
  console.log(`Architecture Source: ${architectureMdPath}`);
  console.log(`Contract Type: ${contractType}`);
  console.log('═'.repeat(80));
  console.log();

  try {
    // Phase 1: Load ARCHITECTURE.md
    console.log('📖 Phase 1: Loading ARCHITECTURE.md...');
    const architectureMd = await readFile(architectureMdPath, 'utf-8');
    console.log('   ✓ Loaded\n');

    // Phase 2-4.5: Extract, Select, Load, Populate
    console.log('🔧 Phase 2-4.5: Generating contract content...');

    // [Your existing generation logic here]
    // This would include:
    // - Requirement extraction
    // - Template selection
    // - Template loading with include resolution
    // - Placeholder replacement
    // - Content population

    const generatedContent = await yourGenerationFunction(
      architectureMd,
      contractType
    );
    console.log('   ✓ Content generated\n');

    // ========================================================================
    // Phase 4.6: AUTOMATED TEMPLATE VALIDATION (NEW)
    // ========================================================================
    console.log('📋 Phase 4.6: Validating generated contract...');

    const validationResult = await validateGeneratedContract(
      generatedContent,
      contractType
    );

    if (!validationResult.isValid) {
      // BLOCK: Validation failed
      console.log('   ✗ Validation FAILED\n');
      console.error(validationResult.errorReport);

      throw new Error(
        `Validation failed for ${validationResult.contractDisplayName}: ` +
        `${validationResult.validationResult.errors.length} error(s), ` +
        `${validationResult.validationResult.warnings.length} warning(s)`
      );
    }

    // SUCCESS: Validation passed
    console.log('   ✓ Validation PASSED');
    console.log(`   ${validationResult.validationResult.validationSummary.totalChecks} checks performed\n`);
    // ========================================================================

    // Phase 5: Save to output
    console.log('💾 Phase 5: Saving contract to output directory...');
    const outputPath = `compliance-docs/${contractType}.md`;
    await writeFile(outputPath, generatedContent);
    console.log(`   ✓ Saved to ${outputPath}\n`);

    // Success summary
    console.log('═'.repeat(80));
    console.log('✅ CONTRACT GENERATION COMPLETE');
    console.log('═'.repeat(80));
    console.log(validationResult.successMessage);
    console.log('═'.repeat(80));

  } catch (error) {
    // Error handling
    console.log();
    console.log('═'.repeat(80));
    console.log('❌ CONTRACT GENERATION FAILED');
    console.log('═'.repeat(80));
    console.error(error instanceof Error ? error.message : String(error));
    console.log('═'.repeat(80));

    process.exit(1);
  }
}

// Example usage
const architecturePath = 'examples/ARCHITECTURE.md';
const contractType = 'sre_architecture';

generateComplianceContract(architecturePath, contractType)
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
```

## Validation Error Handling

When validation fails, the framework provides detailed error reports:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION FAILED: SRE Architecture (3 errors, 0 warnings)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR 1: Invalid Status Value (Line 287)
Severity: BLOCKING
Location: Compliance Summary Table / Row 5

Expected:
  One of ["Compliant", "Non-Compliant", "Not Applicable", "Unknown"]

Found:
  "Pass"

Reference:
  - SKILL.md lines 682-683 (Status value standardization)

Fix:
  Change "Pass" to "Compliant" (exact case required)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Batch Validation Example

For generating multiple contracts in a batch:

```typescript
import { validateMultipleContracts } from './utils/generation-helper';

async function generateAllContracts(architectureMdPath: string) {
  const contractTypes = [
    'sre_architecture',
    'cloud_architecture',
    'security_architecture',
    // ... all 10 types
  ];

  const contracts = [];

  // Generate all contracts
  for (const contractType of contractTypes) {
    const content = await generateContractContent(architectureMdPath, contractType);
    contracts.push({ content, contractType });
  }

  // Validate all contracts in batch
  const validationResults = await validateMultipleContracts(contracts);

  // Check for failures
  const failures = validationResults.filter(r => !r.isValid);

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} contract(s) failed validation:\n`);
    failures.forEach(failure => {
      console.error(`- ${failure.contractDisplayName}`);
      console.error(`  ${failure.compactSummary}\n`);
    });

    throw new Error(`Batch validation failed: ${failures.length} contract(s) invalid`);
  }

  // All passed - save contracts
  for (let i = 0; i < contracts.length; i++) {
    const { contractType } = contracts[i];
    const { content } = contracts[i];
    await writeFile(`compliance-docs/${contractType}.md`, content);
  }

  console.log(`✅ All ${contracts.length} contracts validated and saved successfully`);
}
```

## CLI Tool Usage

For standalone validation of existing contracts:

```bash
# Validate an existing contract
bun run utils/validate-cli.ts compliance-docs/sre_architecture.md sre_architecture

# Validate with markdown report
bun run utils/validate-cli.ts compliance-docs/cloud.md cloud_architecture --markdown

# Compact summary for CI/CD
bun run utils/validate-cli.ts compliance-docs/security.md security_architecture --compact

# List supported contract types
bun run utils/validate-cli.ts --list-types
```

## CI/CD Integration Example

Validate contracts in a CI/CD pipeline:

```yaml
# .github/workflows/validate-contracts.yml
name: Validate Compliance Contracts

on:
  pull_request:
    paths:
      - 'compliance-docs/*.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Bun
        uses: oven-sh/setup-bun@v1

      - name: Validate Contracts
        run: |
          for contract in compliance-docs/*.md; do
            # Extract contract type from filename
            type=$(basename "$contract" .md)

            echo "Validating $type..."
            bun run skills/architecture-compliance/utils/validate-cli.ts \
              "$contract" \
              "$type" \
              --compact
          done
```

## Error Recovery Workflow

When validation fails during generation:

1. **Review Error Report**: Check line numbers and specific violations
2. **Fix Template or Logic**: Update template fragments or generation logic
3. **Re-run Validation**: Use CLI tool to validate fixes
4. **Iterate**: Repeat until validation passes
5. **Proceed to Output**: Save validated contract

```bash
# After fixing issues, re-validate
bun run utils/validate-cli.ts temp-output.md sre_architecture

# If passed, move to final location
mv temp-output.md compliance-docs/sre_architecture.md
```

## Performance Considerations

**Validation Overhead**:
- ~100-150ms per contract
- 3-5% of total generation time
- Negligible impact on user experience

**Optimization Tips**:
- Validate incrementally during generation (if possible)
- Cache validation rules in memory for batch operations
- Use compact summary in CI/CD (faster than full reports)

## Testing Integration

Test your integration with the provided example:

```bash
# Run integration test
cd skills/architecture-compliance
bun run utils/validate-example.ts

# Expected output:
# ✅ Example 1: Document with errors - Shows error report
# ✅ Example 2: Valid document - Shows success message
# ✅ Example 3: Compact summary format
# ✅ Example 4: Markdown report format
```

## Best Practices

1. **Always validate before saving**: Don't skip validation for "quick edits"
2. **Log validation results**: Keep audit trail of validation checks
3. **Include line numbers in errors**: Makes debugging faster
4. **Fail fast in CI/CD**: Use `--strict` mode for pipelines
5. **Test validation rules**: Update unit tests when adding new rules

## Troubleshooting

**Issue**: Validation fails with "Unknown contract type"
- **Solution**: Check contract type matches one of the 10 supported types

**Issue**: Validation passes but contract looks wrong
- **Solution**: Review validation rules in `validation/template_validation_*.json`

**Issue**: Performance is slow
- **Solution**: Batch validation for multiple contracts, use compact mode

## Summary

The Template Validation Framework integrates seamlessly into the compliance generation workflow at Phase 4.6, providing:

- ✅ Strict template adherence enforcement
- ✅ Detailed error reporting with line numbers
- ✅ Blocking behavior on validation failures
- ✅ Support for all 10 contract types
- ✅ Special case handling (Business Continuity, SRE, Data & AI)
- ✅ Performance overhead < 200ms per contract
- ✅ CLI tool for standalone validation
- ✅ CI/CD integration support

For more information:
- **Developer Guide**: VALIDATION_FRAMEWORK_GUIDE.md
- **Validation Rules**: validation/VALIDATION_RULE_EXAMPLES.md
- **Schema**: validation/TEMPLATE_VALIDATION_SCHEMA.json
- **Generation Guide**: COMPLIANCE_GENERATION_GUIDE.md (Phase 4.6)
