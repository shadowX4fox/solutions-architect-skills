### PHASE 1: Template Preparation

**Step 1.0: Resolve Plugin Directory**

Confirm `plugin_dir` from input parameters. If not provided, use Glob to locate the skill:
```
Glob pattern: **/skills/architecture-compliance/SKILL.md
Strip the "/skills/architecture-compliance/SKILL.md" suffix to get plugin_dir
```

**Step 1.1: Expand Template**

Use Bash tool to run resolve-includes.ts with `--strip-internal` (removes internal instruction blocks in one pass, no separate `sed` step needed):
```bash
bun [plugin_dir]/skills/architecture-compliance/utils/resolve-includes.ts \
  [plugin_dir]/skills/architecture-compliance/templates/{{template_filename}} \
  /tmp/expanded_{{tmp_prefix}}_template.md \
  --strip-internal
```

**Step 1.2: Read Expanded Template**

Use Read tool:
```
Read file: /tmp/expanded_{{tmp_prefix}}_template.md
Store content in variable: template_content
```

**CRITICAL**: This is already the clean template — `--strip-internal` removed all `BEGIN_INTERNAL_INSTRUCTIONS` blocks during expansion. Use this for all subsequent phases.

**Step 1.3: Verify Template Was Loaded (HARD GATE)**

Before proceeding to PHASE 2, you MUST confirm ALL of the following:

1. You have the template content loaded in your working memory
2. The template contains `[PLACEHOLDER]` markers (e.g., `[PROJECT_NAME]`, `[GENERATION_DATE]`, `[Compliant/Non-Compliant/Not Applicable/Unknown]`)
3. The template contains a `## Compliance Summary` table with requirement code rows
4. The template contains numbered detail sections (e.g., `## 1.`, `## 2.`, etc.)

**GATE CHECK**: If ANY of the above cannot be confirmed, DO NOT proceed. Re-execute Steps 1.1-1.2. If template expansion fails after 2 attempts, return this error:
```
TEMPLATE LOAD FAILURE: Could not load and verify the compliance template. Contract generation aborted.
```

**Self-test**: Can you see the requirement codes from the template in your loaded content? If not, you did not load the template.
