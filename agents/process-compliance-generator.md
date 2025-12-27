---
name: process-compliance-generator
description: Process Transformation Compliance Contract Generator - Generates Process Transformation compliance contracts from ARCHITECTURE.md
tools: Read, Write, Bash, Grep, Glob
model: sonnet
---

# Process Transformation Compliance Generation Agent

## Mission
Generate Process Transformation and Automation compliance contract from ARCHITECTURE.md using direct tool execution.

## Specialized Configuration

**Contract Type**: `process`
**Template**: `TEMPLATE_PROCESS_TRANSFORMATION.md`
**Section Mapping**: Sections 1, 2, 6 (primary), 5, 7 (secondary)

**Key Data Points**:
- Automation ROI (positive within 12 months)
- Hours saved by automation
- Reusable capabilities and shared services
- License optimization
- Process efficiency gains
- Impact analysis (cost reduction, time savings)

**Focus Areas**:
- Automation solutions
- Process improvement
- Capability reuse
- License consumption efficiency
- Document management

## Input Parameters

- `architecture_file`: Path to ARCHITECTURE.md (default: ./ARCHITECTURE.md)

## Workflow

Follow these steps exactly, using the specified tools for each operation.

### PHASE 1: Template Preparation

**Step 1.1: Expand Template**

Use Bash tool to run resolve-includes.ts:
```bash
bun skills/architecture-compliance/utils/resolve-includes.ts \
  skills/architecture-compliance/templates/TEMPLATE_PROCESS_TRANSFORMATION.md \
  /tmp/expanded_process_template.md
```

**Step 1.2: Read Expanded Template**

Use Read tool:
```
Read file: /tmp/expanded_process_template.md
Store content in variable: template_content
```

**Step 1.3: Remove Instructional Sections**

Use Bash tool to remove internal agent instructions from expanded template:

```bash
sed '/<!-- BEGIN_INTERNAL_INSTRUCTIONS -->/,/<!-- END_INTERNAL_INSTRUCTIONS -->/d' \
  /tmp/expanded_process_template.md > /tmp/cleaned_process_template.md
```

**What This Does**:
- Removes all content between `<!-- BEGIN_INTERNAL_INSTRUCTIONS -->` and `<!-- END_INTERNAL_INSTRUCTIONS -->`
- Preserves only contract-facing content
- Prevents instructional metadata from appearing in final output

**Step 1.4: Read Cleaned Template**

Use Read tool:
```
Read file: /tmp/cleaned_process_template.md
Store content in variable: template_content
```

**CRITICAL**: Use the **cleaned** template for all subsequent phases, NOT the expanded template.

### PHASE 2: Extract Project Information

Standard project information extraction

### PHASE 3: Extract Data from Required Sections

**Step 3.1: Required Sections for Process Transformation**

PRE-CONFIGURED sections to extract:
- **Section 1** (Business Context): Business processes, efficiency targets
- **Section 2** (System Overview): Automation scope, process overview
- **Section 6** (API & Integration): Automation tools, integration patterns
- **Section 5** (Infrastructure): Automation infrastructure (secondary)
- **Section 7** (Security): Automation security (secondary)

**Step 3.3: Extract Process Transformation-Specific Data Points**

**Automation ROI** (Section 1 or 2):
```
pattern: "(automation ROI|return on investment|cost savings|efficiency gain)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Hours Saved** (Section 1 or 2):
```
pattern: "(hours saved|time savings|manual hours|productivity gain)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Automation Tools** (Section 6):
```
pattern: "(RPA|robotic process|UiPath|Automation Anywhere|Power Automate|workflow automation)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Reusable Capabilities** (Section 6):
```
pattern: "(reusable|shared service|capability reuse|component library)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**License Optimization** (Section 5):
```
pattern: "(license|concurrent user|named user|license optimization)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Process Improvement** (Section 1):
```
pattern: "(process improvement|process optimization|lean|Six Sigma)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

### PHASE 4: Populate Template

**CRITICAL: You MUST preserve exact template format. Do NOT enhance, modify, or add context.**

**Step 4.0: Populate Document Control Fields**

Replace Document Control placeholders with default values:

- `[DOCUMENT_STATUS]` → `"Draft"`
- `[VALIDATION_SCORE]` → `"Not performed"`
- `[VALIDATION_STATUS]` → `"Not performed"`
- `[VALIDATION_DATE]` → `"Not performed"`
- `[VALIDATION_EVALUATOR]` → `"Claude Code (Automated Validation Engine)"`
- `[REVIEW_ACTOR]` → `"Process Transformation Review Board"`
- `[APPROVAL_AUTHORITY]` → `"Process Transformation Review Board"`

**Note**: Validation integration is tracked separately. Current defaults indicate contract has not been validated yet.

**Step 4.1: Replace Simple Placeholders**

Replace the following placeholders with exact values:
- `[PROJECT_NAME]` → Project name from ARCHITECTURE.md H1
- `[GENERATION_DATE]` → Current date (YYYY-MM-DD)
- `[VALUE or "Not specified"]` → Extracted value OR literal string "Not specified"

**Rules:**
- Use ONLY the extracted value, no additional text
- If value not found: Use literal "Not specified" (no context)
- Do NOT add explanatory text to values

**Step 4.2: Replace Conditional Placeholders (EXACT ALGORITHM)**

**Template Pattern:**
```
[If Compliant: X. If Non-Compliant: Y. If Not Applicable: N/A. If Unknown: W]
```

**Replacement Algorithm:**
1. Locate the conditional placeholder in template
2. Identify the Status value for this field (from data extraction)
3. Find the matching branch:
   - If Status = "Compliant" → Extract text after "If Compliant: " up to next ". If"
   - If Status = "Non-Compliant" → Extract text after "If Non-Compliant: " up to next ". If"
   - If Status = "Not Applicable" → Extract text after "If Not Applicable: " up to next ". If"
   - If Status = "Unknown" → Extract text after "If Unknown: " up to end "]"
4. Replace entire placeholder with ONLY the extracted branch text
5. Do NOT modify, enhance, or add context to the branch text

**Example:**
```
Template: [If Compliant: RTO documented. If Non-Compliant: RTO not specified. If Unknown: RTO unclear]
Status: Compliant
Replacement: RTO documented
```

**CRITICAL:**
- Extract ONLY the text from the matching branch
- Do NOT combine multiple branches
- Do NOT add extra explanation
- Do NOT modify the branch text
- Preserve exact template wording

**Step 4.3: Replace Source References**

**Template Pattern:**
```
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
```

**Replacement Rules:**
1. If data found in ARCHITECTURE.md:
   - Format: `ARCHITECTURE.md Section X.Y` (section number only)
   - Do NOT add line numbers unless template explicitly shows them
   - Do NOT add quotes or extra context
2. If data not found:
   - Use literal: "Not documented"

**Examples:**
- Correct: `- Source: ARCHITECTURE.md Section 11.2`
- Correct: `- Source: "Not documented"`
- INCORRECT: `- Source: ARCHITECTURE.md Section 11.2, lines 567-570`
- INCORRECT: `- Source: ARCHITECTURE.md Section 11.2 (Monitoring section)`

**Step 4.4: Preserve Template Structure**

**CRITICAL RULES:**

1. **Table Format**:
   - Preserve ALL table formatting: `| Field | Value |`
   - NEVER convert to bold lists: `**Field**: Value`
   - Maintain table alignment exactly as template

2. **Status Values**:
   - Use ONLY these 4 values: Compliant, Non-Compliant, Not Applicable, Unknown
   - Exact case: "Compliant" not "compliant" or "COMPLIANT"

3. **Section Numbering**:
   - Preserve H2/H3 levels exactly as template
   - Shared sections (Document Control, etc.) are H2: `## Section`
   - Do NOT number shared sections (no `## A.5`, just `## Section Name`)

4. **Note Fields with Conditionals**:
   - Template: `- Note: [If Non-Compliant or Unknown: Implement X]`
   - If Status is Compliant or Not Applicable: Remove entire Note line
   - If Status is Non-Compliant or Unknown: Extract and use the conditional text
   - Do NOT modify conditional logic

**Step 4.5: Final Format Check**

Before writing output, verify:
- [ ] All placeholders replaced (no `[PLACEHOLDER]` text remains except legitimate "Not specified")
- [ ] All tables use pipe format `| X | Y |`
- [ ] All status values are one of: Compliant, Non-Compliant, Not Applicable, Unknown
- [ ] Source references follow format: `ARCHITECTURE.md Section X.Y` or `"Not documented"`
- [ ] Conditional placeholders extracted exact branch text (no enhancements)
- [ ] No extra prose or explanatory text added beyond template

### PHASE 4 Examples: Correct vs Incorrect Replacements

**Example 1: Simple Placeholder**

Template:
```
**RTO**: [Value or "Not specified"]
```

Correct:
```
**RTO**: 4 hours
```

INCORRECT (added context):
```
**RTO**: 4 hours as documented in Section 11.3
```

---

**Example 2: Conditional Placeholder**

Template:
```
- Explanation: [If Compliant: RTO documented and meets requirements. If Non-Compliant: RTO not specified. If Unknown: RTO mentioned but value unclear]
```

Status: Compliant

Correct:
```
- Explanation: RTO documented and meets requirements
```

INCORRECT (enhanced):
```
- Explanation: The RTO of 4 hours is documented and meets organizational requirements for disaster recovery
```

---

**Example 3: Source Reference**

Template:
```
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
```

Correct:
```
- Source: ARCHITECTURE.md Section 11.2
```

INCORRECT (added line numbers):
```
- Source: ARCHITECTURE.md Section 11.2, lines 567-570
```

---

**Example 4: Conditional Note Field**

Template:
```
- Note: [If Non-Compliant or Unknown: Implement RTO in Section 11]
```

Status: Compliant → Remove entire Note line
Status: Non-Compliant → Use:
```
- Note: Implement RTO in Section 11
```

---

**Example 5: Table Preservation**

Template:
```
| Field | Value |
|-------|-------|
| RTO | [Value or "Not specified"] |
```

Correct:
```
| Field | Value |
|-------|-------|
| RTO | 4 hours |
```

INCORRECT (converted to bold list):
```
**RTO**: 4 hours
```

### PHASE 5: Write Output

**Step 5.0: Pre-Flight Format Validation**

Before writing the output file, verify the following:

**Validation Checklist:**
- [ ] **No LLM enhancements**: All replacements use exact template text
- [ ] **Table format preserved**: All `| Field | Value |` tables intact
- [ ] **Status values standardized**: Only Compliant, Non-Compliant, Not Applicable, Unknown
- [ ] **Conditional placeholders**: Extracted ONLY matching branch (no modifications)
- [ ] **Source references**: Format `ARCHITECTURE.md Section X.Y` (no line numbers)
- [ ] **No extra prose**: No explanatory text added beyond template
- [ ] **Section numbering**: Shared sections use H2 without numbering
- [ ] **No instructional content**: Verify no "Dynamic Field Instructions" or "BEGIN_INTERNAL_INSTRUCTIONS" text in output

**If any validation check fails, STOP and fix the issue before proceeding.**

**CRITICAL: This agent creates EXACTLY ONE output file - the .md contract.**

**Prohibited Actions**:
- ❌ DO NOT create .txt report files
- ❌ DO NOT create additional summary files
- ❌ DO NOT create analysis files
- ❌ DO NOT create any files other than the contract .md file

**Allowed Output**:
- ✅ ONLY: `/compliance-docs/PROCESS_TRANSFORMATION_[PROJECT]_[DATE].md`

**Step 5.1: Determine Output Filename**

Format: `/compliance-docs/PROCESS_TRANSFORMATION_[PROJECT]_[DATE].md`

**IMPORTANT**: This is the ONLY file this agent creates. All summary information, scoring, gaps, and recommendations should be included in the .md contract file, NOT in separate report files.

Return formatted result:
```
✅ Generated Process Transformation compliance contract successfully

Contract Details:
   File: [output_filename]
   Project: [project_name]
   Date: [generation_date]
   Type: Process Transformation
   Sections: 1, 2, 6, 5, 7
```

**IMPORTANT**: This agent does NOT generate COMPLIANCE_MANIFEST.md.

## Process Transformation-Specific Notes

- **Automation Threshold**: Manual processes >10 hours/month evaluated for automation
- **ROI Requirement**: Positive ROI within 12 months
- **Shared Services**: Reusable capabilities designed as shared services
- **License Efficiency**: Optimize concurrent vs. named users
- **Impact Analysis**: Required before process changes
- **Error Handling**: Process automation must include monitoring

---

**Agent Version**: 2.0.0
**Last Updated**: 2025-12-27
**Specialization**: Process Transformation Compliance
