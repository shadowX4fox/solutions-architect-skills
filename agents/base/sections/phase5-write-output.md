### PHASE 5: Write Output

**Step 5.0: Pre-Flight Format Validation**

Before writing the output file, verify the following:

**Validation Checklist:**
- [ ] **No LLM enhancements**: All replacements use exact template text
- [ ] **Table format preserved**: All `| Field | Value |` tables intact
- [ ] **Status values standardized**: Only Compliant, Non-Compliant, Not Applicable, Unknown
- [ ] **Conditional placeholders**: Extracted ONLY matching branch (no modifications)
- [ ] **Source references**: Format `docs/NN-name.md` (e.g., `docs/09-operational-considerations.md`)
- [ ] **No extra prose**: No explanatory text added beyond template
- [ ] **Section numbering**: Shared sections use H2 without numbering
- [ ] **No instructional content**: Verify no "Dynamic Field Instructions" or "BEGIN_INTERNAL_INSTRUCTIONS" text in output

**If any validation check fails, STOP and fix the issue before proceeding.**

<!-- @append phase5-extra-checks -->

**CRITICAL: This agent creates EXACTLY ONE output file - the .md contract.**

**Prohibited Actions**:
- ❌ DO NOT create .txt report files
- ❌ DO NOT create additional summary files
- ❌ DO NOT create analysis files
- ❌ DO NOT create any files other than the contract .md file

**Allowed Output**:
- ✅ ONLY: `compliance-docs/{{output_prefix}}_[PROJECT]_[DATE].md`

**Step 5.1: Determine Output Filename**

Format: `compliance-docs/{{output_prefix}}_[PROJECT]_[DATE].md`

**IMPORTANT**: This is the ONLY file this agent creates. All summary information, scoring, gaps, and recommendations should be included in the .md contract file, NOT in separate report files.

Example: `compliance-docs/{{output_prefix}}_PaymentPlatform_{{build_date}}.md`

**Step 5.2: Create Output Directory**

First, check if the directory exists using Bash (do NOT use Glob, Search, or Grep):

`bun [plugin_dir]/skills/architecture-compliance/utils/check-dir.ts compliance-docs`

Read the output:
- If output contains "Directory compliance-docs/ exists." → the directory already exists. Do NOT run mkdir. Proceed to Step 5.3.
- If output is empty (directory does not exist) → run: `mkdir compliance-docs`

**Step 5.3: Write Output Contract**

Use Write tool to write the fully populated contract directly from your working memory (the populated template from PHASE 4):
```
file_path: [output_filename from 5.1]
content: [the populated template — all [PLACEHOLDER] values replaced in PHASE 4]
```

**Note**: The post-generation pipeline run by the orchestrator will calculate validation scores and update `COMPLIANCE_MANIFEST.md` after all agents complete.

**Step 5.4: Return Success with Metadata**

Return formatted result:
```
✅ Generated {{domain_name}} compliance contract successfully

Contract Details:
   File: [output_filename]
   Project: [project_name]
   Date: [generation_date]
   Type: {{domain_name}}
   Sections: {{success_sections}}
```

**IMPORTANT**: This agent does NOT generate COMPLIANCE_MANIFEST.md. The skill orchestrator handles manifest generation after all agents complete.
