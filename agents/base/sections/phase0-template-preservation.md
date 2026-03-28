### PHASE 0: Template Preservation Mandate

**ABSOLUTE RULE - READ THIS FIRST**:

You are operating in **TEMPLATE PRESERVATION MODE**.

**What this means**:
- The template is a READ-ONLY document
- Your ONLY task is to replace `[PLACEHOLDER]` text with actual values
- You are FORBIDDEN from modifying any template structure
- You are FORBIDDEN from adding, removing, or reorganizing sections
- You are FORBIDDEN from changing table formats
- You are FORBIDDEN from adding section numbering (A.1, A.2, etc.)
- You are FORBIDDEN from adding or removing table columns/rows
- You are FORBIDDEN from converting tables to other formats
- You are FORBIDDEN from populating the `## Questions & Gaps Register` table — it is populated automatically by the post-generation pipeline after you write the contract

**What you CAN do**:
- Replace `[PROJECT_NAME]` with the actual project name
- Replace `[GENERATION_DATE]` with the current date
- Replace `[VALIDATION_EVALUATOR]` with "Claude Code (Automated Validation Engine)"
- Replace `[APPROVAL_AUTHORITY]` with the appropriate review board name
- Replace `[Compliant/Non-Compliant/Not Applicable/Unknown]` with actual status
- Replace conditional placeholders `[If X: ... If Y: ...]` with exact matching branch text
- Replace `[Source Section]` with the docs/ file path (e.g., `docs/09-operational-considerations.md`)
- Replace role placeholders (`[Role or N/A]`, `[X Architect or N/A]`, etc.) with the role name specified in the template; use "N/A" ONLY if Status = "Not Applicable"
<!-- @append phase0-can-do-list -->

**How to work**:
1. Read the cleaned template as immutable content
2. Identify each `[PLACEHOLDER]` in the template
3. Replace ONLY the placeholder with its value
4. Preserve everything else EXACTLY as-is
5. Write the result (structure must be identical to template)

**Violation Detection**: If the output structure differs from template structure in ANY way, the contract will be REJECTED.

**KNOWN FAILURE MODE - FREE-FORM GENERATION (READ THIS)**:

The most critical and common failure is when the agent IGNORES the template and generates a free-form compliance document from scratch. This has happened before and produced unusable output. Signs of this failure:

- **Wrong requirement codes**: This template uses `{{compliance_prefix}}1` through `{{compliance_prefix}}{{requirement_count}}` ({{requirement_count}} requirements total). If you are writing codes like {{wrong_code_examples}}, or ANY code not in the template, you have failed.
- **Wrong section structure**: The template has sections numbered 1-{{requirement_count}} ({{section_structure_description}}). If your output has different sections, you have failed.
- **Inventing content**: If you are writing an "Executive Summary", creating your own categories, or generating tables not in the template, you have failed.
- **Wrong requirement count**: The Compliance Summary table has exactly {{requirement_count}} rows ({{requirement_range}}). If yours has more or fewer, you have failed.

**Recovery procedure if you detect this failure**: STOP immediately. Do NOT write any output. Return to PHASE 1 Step 1.1 and re-execute the template expansion. The template IS the document - you are only filling in its blanks.
