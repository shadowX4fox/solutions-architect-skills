---
name: architecture-compliance
description: Generate Compliance Contracts (Contratos de Adherencia) from ARCHITECTURE.md files
---

# Architecture Compliance Skill

## When This Skill is Invoked

This skill is **manually activated** when users request compliance document generation. It is NOT automatically triggered.

**Activation Triggers:**
- "Generate compliance documents"
- "Create Compliance Contracts"
- "Generate [specific contract type]" (e.g., "Generate SRE Architecture contract")
- "Create compliance documentation"
- `/skill architecture-compliance`
- "Generate all compliance docs"
- "Create security compliance" or "Generate risk management"
- "List available contracts"
- "Show contract types"
- "What contracts can I generate?"
- "Show me all compliance contracts"

**NOT Activated For:**
- Automatic triggers when ARCHITECTURE.md changes
- General architecture documentation tasks (use `architecture-docs` skill)
- Business requirements documentation (use `architecture-readiness` skill)

## Purpose

This skill generates compliance documents from ARCHITECTURE.md, producing 10 separate documents:

**10 Compliance Contracts:**
1. Business Continuity
2. SRE Architecture (Site Reliability Engineering)
3. Cloud Architecture
4. Data & Analytics - AI Architecture
5. Development Architecture
6. Process Transformation and Automation
7. Security Architecture
8. Platform & IT Infrastructure
9. Enterprise Architecture
10. Integration Architecture

## Template Format Preservation Policy

**CRITICAL REQUIREMENT**: Generated compliance contracts MUST preserve template format exactly.

**Strict Preservation Rules:**
1. ✅ **ONLY replace explicit `[PLACEHOLDER]` tokens** - text inside `[...]` brackets
2. ✅ **PRESERVE ALL other text exactly** - including formatting, structure
3. ❌ **NEVER transform template content** - no custom prose, no reformatting
4. ✅ **EXPAND conditional structures** - replace `[If Compliant: X. If Non-Compliant: Y]` with the text matching the Status value
5. ❌ **NEVER add extra sections** - templates have A.1-A.4 only, no A.5-A.9

**Template Format Example:**
```markdown
**RTO**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO documented and meets requirements. If Non-Compliant: RTO not specified. If Not Applicable: N/A. If Unknown: RTO mentioned but value unclear]
```

**CORRECT Replacement** (Status = Compliant):
```markdown
**RTO**: 4 hours
- Status: Compliant
- Explanation: RTO documented and meets requirements
```

**INCORRECT Replacement (DO NOT DO THIS):**
```markdown
**RTO**: 4 hours documented in Section 11.3
- Status: Compliant
- Explanation: The system documents a 4-hour RTO requirement which meets organizational standards...
```

**Why This Matters:**
- Ensures template consistency across all generated contracts
- Maintains conditional guidance for future updates
- Prevents LLM from "improving" template structure

**See Phase 4, Step 4.2 for detailed placeholder replacement workflow.**

---

## CRITICAL FORMAT PRESERVATION RULES

**IMPORTANT**: The following format rules are MANDATORY and validated with BLOCKING severity. Violations will prevent contract generation.

### 1. Shared Section Headers After A.4

After "### A.4 Change History", the template includes shared sections via `@include` directives.
These are already expanded by `resolve-includes.ts` and appear as `## Header` (H2).

**YOU MUST PRESERVE THEM AS H2 - DO NOT ADD A.5+ NUMBERING**

- ❌ **WRONG**: `### A.5 Data Extracted Successfully`
- ✅ **CORRECT**: `## Data Extracted Successfully`

**Validation Rule**: `forbidden_section_numbering` will BLOCK any sections numbered A.5 or higher.

### 2. Document Control Table Structure

Document Control MUST use table format: `| Field | Value |`

**NEVER convert tables to bold field lists**

- ❌ **WRONG**:
  ```markdown
  **Document ID**: VALUE
  **Template Version**: VALUE
  ```

- ✅ **CORRECT**:
  ```markdown
  | Field | Value |
  |-------|-------|
  | Document ID | VALUE |
  | Template Version | VALUE |
  ```

**Validation Rule**: `document_control_table` will BLOCK contracts without proper table format.

### 3. ALL Template Formatting

**Preserve ALL markdown structures exactly:**
- Tables must stay as tables (with `|` separators)
- Lists must stay as lists (with `-` or `*`)
- Headers must preserve level (H2/H3) and numbering exactly
- ONLY replace `[PLACEHOLDER]` tokens - nothing else

**Why This Matters:**
- Template consistency across all 10 contract types
- Automated validation and parsing
- Audit trail integrity

**See Phase 4, Step 4.2 for detailed format preservation workflow.**

---

## Strict Source Traceability Policy

**CRITICAL REQUIREMENT**: All compliance contracts must maintain strict source traceability to ARCHITECTURE.md.

**Rules:**
1. ✅ **ONLY extract data** that explicitly exists in ARCHITECTURE.md
2. ✅ **ALWAYS cite** actual section numbers and line numbers
3. ✅ **NEVER infer, derive, or guess** values not stated in ARCHITECTURE.md
4. ❌ **NO INFERENCE** - even if industry standards suggest correlation
5. ✅ **FORMAT ENFORCEMENT** - Compliance Summary table MUST use 6-column format (see Phase 4.3)

**Allowed Extraction Methods:**
- **Direct**: Extract exact values as-is from ARCHITECTURE.md
- **Aggregation**: Consolidate multiple related values from different sections
- **Transformation**: Calculate or reformat values using explicit source data with formula shown

**When Data is Missing:**
- Mark as `[PLACEHOLDER: Not specified in ARCHITECTURE.md Section X.Y]`
- Provide optional industry standard reference (informational, not prescriptive)
- Include guidance on which ARCHITECTURE.md section should contain the data

**Example:**
```
**RTO**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11.3]
Optional Reference: Industry standard for Tier 1 applications: 4 hours RTO (NIST SP 800-34)
Note: Add RTO value to ARCHITECTURE.md Section 11.3 (Operational Considerations → Backup and Recovery)
```

**Audit Compliance**: This policy ensures all generated compliance documents are fully auditable with verifiable sources, meeting regulatory requirements for documentation traceability.

### Contract Type Aliases and Keywords

To support flexible contract selection and validation, the following aliases and keywords are recognized:

| Contract Type | Aliases | Keywords |
|---------------|---------|----------|
| Business Continuity | continuity, bcm, disaster recovery | business, continuity, recovery, rto, rpo, backup |
| SRE | site reliability, sre, reliability | sre, slo, sli, error budget, monitoring, observability |
| Cloud Architecture | cloud, infrastructure as code, iac | cloud, aws, azure, gcp, deployment, regions |
| Data & AI Architecture | data, ai, ml, analytics, machine learning, data ai | data, ai, ml, analytics, pipeline, model, hallucination |
| Development Architecture | development, dev, coding standards | development, coding, stack, framework, languages, tools |
| Process Transformation | automation, process, transformation | process, automation, rpa, efficiency, workflow |
| Security Architecture | security, infosec, cybersecurity | security, authentication, encryption, compliance, oauth |
| IT Infrastructure | infrastructure, platforms, it | infrastructure, platform, database, compute, capacity |
| Enterprise Architecture | enterprise, ea, strategic | enterprise, strategic, modularity, governance, alignment |
| Integration Architecture | integration, api, middleware | integration, api, messaging, event, microservices |

## Files in This Skill

- **SKILL.md**: This file - activation triggers and workflows
- **COMPLIANCE_GENERATION_GUIDE.md**: Comprehensive guide for all 10 contract types with generation methodology
- **SECTION_MAPPING_GUIDE.md**: Detailed mapping between ARCHITECTURE.md sections and compliance documents
- **templates/**: 10 template files (one per compliance document type)
- **validation/**: 11 external validation configuration files (JSON format, one per contract type)
  - **VALIDATION_SCHEMA.json**: JSON schema defining validation config structure
  - **README.md**: Documentation for the validation system
- **contracts/CONTRACT_TYPES_REFERENCE.md**: Reference documentation for all contract types
- **shared/**: Reusable template content to eliminate duplication
  - **sections/**: Complete reusable sections (Document Control, Validation Methodology, etc.)
  - **fragments/**: Smaller reusable pieces (Status Codes, Compliance Score Calculation, etc.)
  - **config/**: Domain-specific configuration files (JSON) with variable mappings
  - **README.md**: Documentation for the shared content system

## Shared Content System

**Purpose**: Eliminate duplication across 10 compliance templates by extracting common sections into reusable files.

**Directory**: `/skills/architecture-compliance/shared/`

**Components**:
- **sections/**: Complete reusable sections (Document Control, Validation Methodology, etc.)
- **fragments/**: Smaller reusable pieces (Status Codes, Compliance Score Calculation, etc.)
- **config/**: Domain-specific JSON configs (compliance codes, review boards, domain terms)
- **README.md**: Comprehensive documentation and usage guide

**Include Syntax**:
- Simple include: `<!-- @include shared/sections/file.md -->`
- Parameterized include: `<!-- @include-with-config shared/sections/file.md config=domain-name -->`

**Processing**: Includes are resolved during template loading (Phase 4, Step 4.1) before placeholder replacement.

**Benefits**:
- Reduces template duplication by ~400-500 lines across all 10 templates
- Centralizes maintenance for common sections (update once, apply to all)
- Ensures consistency across all contract types (identical validation logic, status codes, etc.)
- Simplifies updates and reduces maintenance burden

**Example** (Business Continuity template):
```markdown
<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->
```

Resolves to the Document Control table with `{{variables}}` replaced from `shared/config/business-continuity.json`.

**For detailed usage**: See `shared/README.md`

## File Naming Convention

**Output Directory:** `/compliance-docs/` (relative to ARCHITECTURE.md location)

**File Naming Pattern:**
```
[CONTRACT_TYPE]_[PROJECT_NAME]_[DATE].md
```

**Examples:**
- `SRE_ARCHITECTURE_JobScheduler_2025-11-26.md`
- `BUSINESS_CONTINUITY_PaymentGateway_2025-11-26.md`
- `DEVELOPMENT_ARCHITECTURE_JobScheduler_2025-11-26.md`

**Regeneration Behavior:**
- When regenerating an existing contract (same type, project, date), the file is REPLACED
- Previous content is overwritten with newly generated contract
- No timestamp appending - same filename is used: `[CONTRACT_TYPE]_[PROJECT_NAME]_[DATE].md`
- To preserve old versions, manually rename/copy files before regenerating
- Alternatively, use git for version control of generated contracts

**Additional Outputs:**
- `COMPLIANCE_MANIFEST.md`: Index of all generated compliance documents with metadata

## Working with ARCHITECTURE.md - Context Optimization

### Why Context Efficiency Matters

Loading the entire ARCHITECTURE.md file (typically 2000+ lines) for each compliance document is inefficient. This skill uses **incremental section loading** to reduce context usage by 70-80%.

### Context-Efficient Workflow

**Step 1: Load Document Index (Lines 1-50)**
```
Read ARCHITECTURE.md lines 1-50 to get:
- Project name
- Document structure
- Section locations (line ranges)
```

**Step 2: Identify Required Sections**
```
For each contract type, consult SECTION_MAPPING_GUIDE.md to determine:
- Primary sections (80%+ of content)
- Secondary sections (15-30% of content)
- Tertiary sections (<15% of content)
```

**Step 3: Load Sections Incrementally**
```
Load only required sections with ±10 line buffer
Example for SRE Architecture:
- Section 10: Performance (lines 1550-1750, ~200 lines)
- Section 11: Operational (lines 1750-1950, ~200 lines)
Total: ~400 lines vs 2000+ (80% reduction)
```

**Step 4: Cache Extracted Data**
```
Extract data once, cache for contract generation
Avoid re-loading same sections for multiple contracts
```

### Example: SRE Architecture Contract Generation

**Traditional Approach:**
```
1. Load entire ARCHITECTURE.md (2000+ lines)
2. Search for relevant information
3. Extract SRE metrics
4. Generate contract
```

**Context-Efficient Approach:**
```
1. Read Document Index (50 lines)
2. Identify required sections: 10, 11
3. Load Section 10 (200 lines + 10 line buffer)
4. Extract performance metrics (SLOs, latency, throughput), cache
5. Load Section 11 (200 lines + 10 line buffer)
6. Extract operational data (monitoring, incidents), cache
7. Generate contract from cached data
Total: 460 lines vs 2000+ (77% reduction)
```

## Contract Listing Workflow

### Special Command: List Contracts

When users request a list of available contracts (e.g., "list contracts", "show contract types", "what contracts are available"), display the following summary:

**Available Compliance Contracts (10 total):**

1. **Business Continuity** - RTO/RPO objectives, disaster recovery plans, backup strategies
2. **SRE Architecture** - SLOs, error budgets, monitoring, incident management, runbooks
3. **Cloud Architecture** - Cloud deployment models, multi-region strategy, cloud-native services
4. **Data & AI Architecture** - Data quality, AI governance, hallucination control, data lineage
5. **Development Architecture** - Technology stack validation, code coverage, technical debt management
6. **Process Transformation** - Automation ROI, efficiency gains, license optimization
7. **Security Architecture** - API security, authentication, encryption, vulnerability management
8. **Platform & IT Infrastructure** - Environment isolation, database capacity, naming conventions
9. **Enterprise Architecture** - Strategic alignment, modularity, cloud-first, API-first design
10. **Integration Architecture** - Integration catalog, API standards, selective async patterns

**To generate contracts:**
- Single contract: "Generate [contract name]" (e.g., "Generate SRE Architecture")
- Multiple contracts: "Generate Business Continuity and Security Architecture"
- All contracts: "Generate all compliance documents"

**For more details on any contract type, see:** `/skills/architecture-compliance/contracts/CONTRACT_TYPES_REFERENCE.md`

### User Interaction After Listing

After displaying the contract list, ask:

**"Which compliance contract(s) would you like to generate?"**

**User Options:**
- User specifies contract(s) → Proceed to normal generation workflow (Phase 1 below)
- User says "tell me more about [contract]" → Show detailed info from CONTRACT_TYPES_REFERENCE.md
- User says "all" → Generate all 10 contracts

## Generation Workflow

### Phase 1: Initialization

**Step 1.1: Detect User Intent**
- Parse user request to determine which contracts to generate
- Options: all (11 documents), specific type, or category

**Step 1.2: Locate ARCHITECTURE.md**
```
Search order:
1. Current directory
2. Parent directory
3. /docs subdirectory
4. Ask user for location
```

**Step 1.3: Validate Structure**
```
Check for:
- Document Index (first 50 lines)
- 12-section structure (standard ARCHITECTURE.md)
- Required sections exist
```

**Step 1.4: Clarify User Intent**
```
If ambiguous, ask:
- "Which compliance documents would you like to generate?"
  Options: All 11, Specific contract(s), By category (security, cloud, etc.)
```

### Phase 2: Configuration

**Step 2.1: Contract Selection with Validation**
```
Based on user intent:
- All: Generate all 10 contracts
- Specific: Parse contract name from request
- Category: Map category to relevant contracts
  Examples:
  - "security" → Security Architecture
  - "cloud" → Cloud Architecture, Platform & IT Infrastructure
  - "SRE" → SRE Architecture, Business Continuity

Validation Process:
1. Normalize user input: Convert to lowercase, trim whitespace
2. Check for exact match against contract type names and aliases (see Aliases table above)
   - If match found → Proceed to Step 2.2
3. Check for "all" keyword → Generate all 10 contracts
4. If no match found:
   - Calculate similarity scores using:
     * Keyword matching (40% weight): Count matching words between user input and contract names/keywords
     * Substring matching (30% weight): Check if user input is substring of contract name or vice versa
     * Fuzzy matching (30% weight): Calculate edit distance for typo tolerance
   - Select top 3 contract types with highest similarity scores
   - Use AskUserQuestion to offer alternatives:
     ```
     The contract type "[USER_INPUT]" is not recognized.

     Did you mean one of these?
     - [Alternative 1 Name]: [Brief description]
     - [Alternative 2 Name]: [Brief description]
     - [Alternative 3 Name]: [Brief description]
     ```
   - If user selects alternative → Use selected contract type
   - If user selects "Other" → List all 10 contract types with descriptions and let user choose

Output: Validated contract type(s)
```

**Step 2.2: Output Directory Configuration**
```
Default: /compliance-docs/ (relative to ARCHITECTURE.md)
Check if directory exists, create if needed
Confirm with user if non-default location desired
```

**Step 2.3: Template Availability Check**
```
For each selected contract:
- Check if template exists in templates/ directory
- If missing: warn user, use basic placeholder structure
- If exists: load template for generation
```

**Step 2.4: Preview Option**
```
Offer user preview of what will be generated:
- List of contracts to create
- Output directory
- Source sections to be used
- Estimated placeholders (missing data)
```

#### Phase 2.1 Example Scenarios

**Scenario 1: Exact Match**
- User input: "Cloud Architecture"
- Validation: Exact match found
- Output: Cloud Architecture contract selected

**Scenario 2: Alias Match**
- User input: "sre"
- Validation: Alias match found ("sre" → "SRE Architecture")
- Output: SRE Architecture contract selected

**Scenario 3: Typo with Fuzzy Match**
- User input: "securtiy architecture"
- Validation: No exact match
- Similarity scores:
  - Security Architecture: 95% (high keyword + fuzzy match)
  - Enterprise Architecture: 45% (keyword "architecture")
  - Cloud Architecture: 42% (keyword "architecture")
- Action: Offer top 3 alternatives via AskUserQuestion
- User selects: "Security Architecture"
- Output: Security Architecture contract selected

**Scenario 4: Conceptual Match**
- User input: "ml governance"
- Validation: No exact match
- Similarity scores:
  - Data & AI Architecture: 75% (keywords "ml", "governance" related to AI)
  - Enterprise Architecture: 50% (keyword "governance")
  - Security Architecture: 45% (keyword "governance")
- Action: Offer top 3 alternatives via AskUserQuestion
- User selects: "Data & AI Architecture"
- Output: Data & AI Architecture contract selected

**Scenario 5: Ambiguous Input**
- User input: "platform"
- Validation: No exact match
- Similarity scores:
  - IT Infrastructure: 70% (alias "platforms")
  - Data & AI Architecture: 45% (data platform concept)
  - Cloud Architecture: 40% (cloud platform concept)
- Action: Offer top 3 alternatives via AskUserQuestion
- User selects "Other" and requests: "Show me all options"
- Action: List all 10 contract types with descriptions
- User selects: "IT Infrastructure"
- Output: IT Infrastructure contract selected

**Scenario 6: Completely Unrelated Input**
- User input: "banana"
- Validation: No exact match
- Similarity scores: All very low
- Action: Offer 3 most common contracts (Enterprise Architecture, Cloud Architecture, Development Architecture)
- Note: "Your input didn't match any contract types. Here are some common options."
- User selects "Other" → Shows all 10 contract types
- Output: User selects appropriate contract type

### Phase 3: Data Extraction (Context-Efficient)

**Step 3.1: Load Document Index**
```
Read ARCHITECTURE.md lines 1-50:
- Extract project name
- Identify section boundaries
- Cache section line ranges
```

**Step 3.2: For Each Contract, Identify Required Sections**
```
Consult SECTION_MAPPING_GUIDE.md:
Example for Business Continuity:
- Primary: Section 11 (Operational Considerations)
- Secondary: Section 10 (Performance Requirements)
```

**Step 3.3: Load Sections Incrementally**
```
For each required section:
- Calculate line range with ±10 buffer
- Read specific line range from ARCHITECTURE.md
- Extract relevant data using patterns
- Cache extracted data
```

**Step 3.4: Extract and Validate**
```
For each data point:
- Apply extraction pattern (direct, aggregation, transformation, inference)
- Validate extracted value
- If missing: flag for [PLACEHOLDER]
- Store with source reference (section, line number)
```

**Step 3.5: Automatic Validation** (All Contract Types)
```
For ALL contract types:
- Input: Cached section content from ARCHITECTURE.md
- Process: Load and apply external validation configuration
  1. Load validation config file from /skills/architecture-compliance/validation/
     - Format: {contract_name}_validation.json
     - Example: development_architecture_validation.json

  2. Parse validation configuration:
     - Scoring thresholds (auto_approve: 8.0, ready_for_review: 7.0, needs_work: 5.0)
     - Weights (completeness, compliance, quality)
     - Validation sections and items
     - Approval authority

  3. Evaluate validation items:
     - PASS (10 points): Complies with requirements
     - FAIL (0 points): Non-compliant or deprecated
     - N/A (10 points): Not applicable
     - UNKNOWN (0 points): Missing data in ARCHITECTURE.md
     - EXCEPTION (10 points): Documented exception via LADES2

  4. Calculate scores:

     **CRITICAL: USE WEIGHTS FROM VALIDATION CONFIG, NOT DEFAULT VALUES**

     Step 4a: Extract weights from loaded validation config:
     - Let W_completeness = config.scoring.weights.completeness
     - Let W_compliance = config.scoring.weights.compliance
     - Let W_quality = config.scoring.weights.quality
     - Verify weights sum to 1.0 (±0.001 tolerance), warn if not

     Step 4b: Calculate component scores (0-10 scale):
     - Completeness = (Filled required fields / Total required fields) × 10
     - Compliance = (PASS count + N/A count + EXCEPTION count) / Total applicable items × 10
     - Quality = (Items with valid source references / Total items) × 10

     Step 4c: Calculate weighted final score:
     - Final Score = (Completeness × W_completeness) + (Compliance × W_compliance) + (Quality × W_quality)
     - Round to 1 decimal place

     **Example Calculation**:
     Given: Completeness=9.3, Compliance=8.6, Quality=9.0, Weights=0.35/0.55/0.10
     Calculation: (9.3 × 0.35) + (8.6 × 0.55) + (9.0 × 0.10)
                = 3.255 + 4.73 + 0.9
                = 8.885
     Final Score = 8.9/10 (rounded to 1 decimal)

     **CRITICAL - N/A Scoring**: N/A items MUST be included in the compliance score numerator:
     - N/A = "Not applicable to this architecture" = Fully compliant (10 points)
     - UNKNOWN = "Missing required data" = Non-compliant (0 points)
     - Example: 6 PASS + 5 N/A out of 11 items = (6+5)/11 × 10 = 10.0/10 (100%)

  5. Determine outcome:

     **CRITICAL: USE OUTCOME_MAPPING FROM VALIDATION CONFIG**

     Step 5a: Load outcome_mapping from validation config
     Step 5b: Apply threshold matching using INCLUSIVE lower bound, INCLUSIVE upper bound:

     Algorithm:
     1. For each range in outcome_mapping (e.g., "8.0-10.0"):
        - Parse range: lower = 8.0, upper = 10.0
        - Check if: lower <= Final Score <= upper
        - If match found, use that tier's values

     2. Extract outcome values from matched tier:
        - document_status (e.g., "Approved")
        - overall_status (e.g., "PASS")
        - action (e.g., "AUTO_APPROVE")
        - review_actor (e.g., "System (Auto-Approved)")

     **Range Definitions** (from config):
     - 8.0-10.0: AUTO_APPROVE → Status: "Approved", Actor: "System (Auto-Approved)"
     - 7.0-7.9: MANUAL_REVIEW → Status: "In Review", Actor: [Approval Authority]
     - 5.0-6.9: NEEDS_WORK → Status: "Draft", Actor: "Architecture Team"
     - 0.0-4.9: REJECT → Status: "Rejected", Actor: "N/A (Blocked)"

     **Example Mapping**:
     Final Score = 8.9 → Check: 8.0 <= 8.9 <= 10.0? YES → Status="Approved"
     Final Score = 8.2 → Check: 8.0 <= 8.2 <= 10.0? YES → Status="Approved"
     Final Score = 7.8 → Check: 7.0 <= 7.8 <= 7.9? YES → Status="In Review"

  6. Collect evidence with source references (Section X.Y, line Z)

- Output: ValidationResults object → cache for Phase 4
- Overhead: ~6,000 tokens (3.5K prompt + 2.5K response)
- Result: PASS (score ≥ 7.0) | CONDITIONAL (5.0-6.9) | FAIL (< 5.0)
```

### Phase 4: Document Generation

**Step 4.1: Load Template with Include Resolution**

**Implementation**: Use `utils/resolve-includes.ts` to expand template includes before processing.

```bash
bun utils/resolve-includes.ts templates/TEMPLATE_<TYPE>.md /tmp/expanded_template.md
```

**Algorithm** (automated by resolve-includes.ts):

1. Load template file for contract type from templates/
   Example: templates/TEMPLATE_SRE_ARCHITECTURE.md

2. Detect and resolve @include directives:
   - Pattern: <!-- @include(-with-config)?\s+(.+?)\s*(?:config=(\S+))?\s*-->
   - For each directive found:
     a. Parse directive type (simple @include or @include-with-config)
     b. Resolve file path (relative to /skills/architecture-compliance/)
     c. Read shared file content from resolved path
     d. If @include-with-config:
        - Load domain config from shared/config/<config>.json
        - Replace {{variables}} in shared content with config values
        - Example: {{review_board}} → "Business Continuity Review Board"
     e. Replace directive with processed content
   - Support nested includes up to 3 levels deep
   - Detect circular includes and error gracefully

3. Cache expanded template to avoid re-processing for same contract type

4. Return fully expanded template for placeholder replacement (Step 4.2)

**Example:**
```markdown
<!-- @include-with-config shared/sections/document-control.md config=business-continuity -->
```

Expands to:
```markdown
## Document Control
| Field | Value |
|-------|-------|
| Approval Authority | Business Continuity Review Board |
...
```

**Usage in Workflow:**
```bash
# Expand template first
bun utils/resolve-includes.ts templates/TEMPLATE_BUSINESS_CONTINUITY.md /tmp/template.md

# Then use expanded template for contract generation
# (apply placeholders, populate data, etc.)
```

**Note**: If template has no @include directives, process normally (backward compatible)

**Documentation**: See `utils/README.md` for detailed usage and examples

**Step 4.2: Apply Extracted Data to Placeholders**

**CRITICAL RULE: PRESERVE TEMPLATE FORMAT EXACTLY**

⚠️ **See "Template Format Preservation Policy" at the top of this document for critical rules.**

The template format MUST be preserved exactly as written. Do NOT transform, rewrite, or restructure the template content. ONLY replace explicit placeholder tokens inside `[...]` brackets.

**Quick Reference - Preservation Rules:**
1. Keep ALL text that is not inside `[PLACEHOLDER]` brackets exactly as-is
2. Preserve conditional structures like `[If Compliant: X. If Non-Compliant: Y]` without modification
3. Do NOT replace structured placeholders with custom prose or explanations
4. Do NOT change formatting, line breaks, bullets, or markdown structure
5. Replace ONLY explicit `[PLACEHOLDER]` tokens with actual values
6. **CRITICAL - Appendix Numbering**: Only A.1 through A.4 should be numbered
   - A.1: Definitions and Terminology
   - A.2: Validation Methodology
   - A.3: Document Completion Guide (with A.3.1, A.3.2, A.3.3)
   - A.4: Change History
   - Sections after A.4 (Data Extracted, Missing Data, Not Applicable, Unknown Status, Generation Metadata)
     MUST remain as H2 (`##`) headers WITHOUT section numbering (NOT A.5, A.6, etc.)

```
Replace standard placeholders:
- [PROJECT_NAME] → from Document Index
- [GENERATION_DATE] → current date (YYYY-MM-DD) - Use `date +%Y-%m-%d` bash command to get local system date
- [EXTRACTED_VALUE] → from cached data
- [SOURCE_REFERENCE] → section and line numbers
```

**Step 4.2.1: Apply Validation Outcome Tier Mapping**

Before populating Document Control fields, determine the outcome tier based on the final validation score.

**Outcome Tier Thresholds** (from validation/README.md):

| Score Range | Overall Status | Document Status | Review Actor |
|-------------|----------------|-----------------|--------------|
| 8.0-10.0 | PASS | Approved | System (Auto-Approved) |
| 7.0-7.9 | PASS | In Review | [Approval Authority from config] |
| 5.0-6.9 | CONDITIONAL | Draft | Architecture Team |
| 0.0-4.9 | FAIL | Rejected | N/A (Blocked) |

**Mapping Logic**:

```typescript
function determineOutcome(finalScore: number, approvalAuthority: string) {
  if (finalScore >= 8.0) {
    return {
      overall_status: "PASS",
      document_status: "Approved",
      review_actor: "System (Auto-Approved)",
      action: "AUTO_APPROVE"
    };
  } else if (finalScore >= 7.0) {
    return {
      overall_status: "PASS",
      document_status: "In Review",
      review_actor: approvalAuthority,  // e.g., "Technical Architecture Review Board"
      action: "MANUAL_REVIEW"
    };
  } else if (finalScore >= 5.0) {
    return {
      overall_status: "CONDITIONAL",
      document_status: "Draft",
      review_actor: "Architecture Team",
      action: "NEEDS_WORK"
    };
  } else {
    return {
      overall_status: "FAIL",
      document_status: "Rejected",
      review_actor: "N/A (Blocked)",
      action: "REJECT"
    };
  }
}
```

**CRITICAL**: Use the outcome object values for Document Control placeholders, NOT static template values or config values.

**Example** - Score 8.4/10:
- `[DOCUMENT_STATUS]` = "Approved" (from outcome tier, NOT "In Review")
- `[REVIEW_ACTOR]` = "System (Auto-Approved)" (from outcome tier, NOT approval authority name)

**Step 4.2.2: Populate Document Control Fields**

```
Populate Document Control section with validation outcome tier values:
- [DOCUMENT_STATUS] → outcome.document_status (e.g., "Approved" for score ≥ 8.0)
- [VALIDATION_SCORE] → validation_results.final_score (format: "8.4/10")
- [VALIDATION_STATUS] → outcome.overall_status (e.g., "PASS")
- [VALIDATION_DATE] → validation_results.validation_date (YYYY-MM-DD)
- [VALIDATION_EVALUATOR] → "Claude Code (Automated Validation Engine)"
- [REVIEW_ACTOR] → outcome.review_actor (e.g., "System (Auto-Approved)" for score ≥ 8.0)
- [APPROVAL_AUTHORITY] → config.approval_authority (always from config, unchanged)
```

**Example Output** - Score 8.4/10 (AUTO_APPROVE):
```markdown
| Status | Approved |
| Validation Score | 8.4/10 |
| Validation Status | PASS |
| Review Actor | System (Auto-Approved) |
| Approval Authority | Technical Architecture Review Board |
```

**Example Output** - Score 7.6/10 (MANUAL_REVIEW):
```markdown
| Status | In Review |
| Validation Score | 7.6/10 |
| Validation Status | PASS |
| Review Actor | Technical Architecture Review Board |
| Approval Authority | Technical Architecture Review Board |
```

**Critical Distinction**:
- **Scores 8.0-10.0**: AUTO_APPROVE → Review Actor = "System (Auto-Approved)"
- **Scores 7.0-7.9**: MANUAL_REVIEW → Review Actor = [Approval Authority name]
- **Approval Authority field**: ALWAYS shows the approval authority name (for reference/escalation)
```

**Step 4.2.3: Expand Conditional Placeholders**

Conditional placeholders provide status-specific explanations and notes. They must be EXPANDED to show only the relevant branch based on the Status value.

**Conditional Pattern**:
```
[If Compliant: <text>. If Non-Compliant: <text>. If Not Applicable: <text>. If Unknown: <text>]
```

**Expansion Logic**:

1. **Identify conditionals**: Find text matching the pattern `[If STATUS: ...]`
2. **Extract Status value**: Get the Status field from the same data point (e.g., "Compliant", "Unknown")
3. **Match branch**: Find the conditional branch matching the Status
4. **Replace entire conditional**: Replace with ONLY the matching branch text (remove brackets and other branches)

**Example** - Status = "Unknown":

Template:
```markdown
**Business Capabilities**: Not specified
- Status: Unknown
- Explanation: [If Compliant: Business capabilities documented. If Non-Compliant: Capabilities not specified in ARCHITECTURE.md. If Not Applicable: Not required for this solution type. If Unknown: Capabilities mentioned but not clearly mapped]
- Note: [If Non-Compliant or Unknown: Map solution capabilities to enterprise capability model in Section 2 or 3]
```

Generated (CORRECT):
```markdown
**Business Capabilities**: Not specified
- Status: Unknown
- Explanation: Capabilities mentioned but not clearly mapped
- Note: Map solution capabilities to enterprise capability model in Section 2 or 3
```

**Example** - Status = "Compliant":

Template:
```markdown
**RTO**: 4 hours
- Status: Compliant
- Explanation: [If Compliant: RTO documented and meets requirements. If Non-Compliant: RTO not specified. If Not Applicable: N/A. If Unknown: RTO mentioned but value unclear]
- Source: ARCHITECTURE.md Section 11.3, line 1576
```

Generated (CORRECT):
```markdown
**RTO**: 4 hours
- Status: Compliant
- Explanation: RTO documented and meets requirements
- Source: ARCHITECTURE.md Section 11.3, line 1576
```

**Handling "Or" Conditions**:

Some conditionals use "or" logic: `[If Non-Compliant or Unknown: text]`

- If Status matches ANY of the listed values, show the text
- Example: Status = "Unknown" → `[If Non-Compliant or Unknown: Fix this]` → "Fix this"

**Edge Cases**:

| Case | Behavior |
|------|----------|
| Conditional not found for Status | Keep original conditional as-is (fallback) |
| Multiple conditionals in same line | Expand each one independently |
| Nested conditionals | Not supported (flag as error) |
| Partial matches | Match exact Status values only (case-sensitive) |

**CRITICAL**: This is a BREAKING CHANGE from previous behavior (v1.5.10 and earlier). Previously, conditionals were preserved as-is. Now they must be expanded to show only the relevant branch based on Status value.

**See COMPLIANCE_GENERATION_GUIDE.md Step 4.2 for detailed examples of correct vs incorrect placeholder replacement.**

**Step 4.2.4: Preserve Shared Section Headers**

After A.4 Change History, the template includes shared sections via `<!-- @include-with-config -->` directives.
These sections are already expanded by resolve-includes.ts (Phase 4.1) and appear as H2 (`##`) headers.

**CRITICAL RULE**: DO NOT add section numbers to these shared sections.

**Correct Format** (after A.4):
```markdown
### A.4 Change History
...

---

## Data Extracted Successfully
[List of data points...]

---

## Missing Data Requiring Attention
[Table of gaps...]

---

## Not Applicable Items
[List of N/A items...]

---

## Unknown Status Items Requiring Investigation
[Table of unknowns...]

---

## Generation Metadata
[Metadata table...]
```

**WRONG Format** (DO NOT DO THIS):
```markdown
### A.5 Data Extracted Successfully
### A.6 Missing Data Requiring Attention
### A.7 Not Applicable Items
### A.8 Unknown Status Items Requiring Investigation
### A.9 Generation Metadata
```

**Reason**: These shared sections are supplementary content, not formal appendix sections.
They provide dynamic data tables and should remain as unnumbered H2 sections for flexibility.

**CRITICAL RULE**: DO NOT convert Document Control table to bold field lists.

The Document Control section (expanded from `shared/sections/document-control.md`) uses a table format:

**Correct Format**:
```markdown
| Field | Value |
|-------|-------|
| Document Owner | [PLACEHOLDER] |
| Last Review Date | [PLACEHOLDER] |
...
```

**WRONG Format** (DO NOT DO THIS):
```markdown
**Document ID**: [VALUE]
**Template Version**: [VALUE]
**Document Owner**: [VALUE]
```

**Validation**: The `document_control_table` validation rule will BLOCK contracts that transform tables into bold field lists.

**Step 4.3: Populate Compliance Summary Table**

The Compliance Summary table is the most critical section for stakeholders. It MUST follow this exact format for ALL contract types.

**Table Structure (6 columns - MANDATORY):**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
```

**Column Definitions:**
- **Code**: Requirement code from template (e.g., LASRE01, LAC1, LAPI01)
- **Requirement**: Short requirement name from template (≤60 chars recommended)
- **Category**: Classification of requirement. Use template-specific category if defined, otherwise use template type as category (e.g., "Cloud Architecture", "Security Architecture", "SRE Architecture")
- **Status**: One of exactly four values: `Compliant`, `Non-Compliant`, `Not Applicable`, `Unknown`
- **Source Section**: ARCHITECTURE.md section reference (e.g., "Section 10", "Section 4, 11", "Not documented")
- **Responsible Role**: Accountable role from template (e.g., "SRE Team", "Security Architect", "Cloud Architect")

**Population Logic:**

1. **Extract requirement count** from contract template header
2. **For each requirement code** (e.g., LASRE01-LASRE57 for SRE, LAC1-LAC6 for Cloud):

   a. **Code**: Extract from template

   b. **Requirement**: Extract requirement name from template

   c. **Category**:
      - If template defines specific category (e.g., Data/AI uses "Data" and "AI"), use that
      - Otherwise, use template type as category:
        - SRE Architecture → "SRE Architecture"
        - Cloud Architecture → "Cloud Architecture"
        - Security Architecture → "Security Architecture"
        - Platform & IT Infrastructure → "Platform & IT Infrastructure"
        - Development Architecture → "Development Architecture"
        - Enterprise Architecture → "Enterprise Architecture"
        - Integration Architecture → "Integration Architecture"
        - Process Transformation → "Process Transformation"

   d. **Status**: Determine based on ARCHITECTURE.md data availability and quality:
      - **Compliant**: Data fully documented in ARCHITECTURE.md AND meets organizational standards
      - **Non-Compliant**: Data missing OR does not meet organizational standards
      - **Not Applicable**: Requirement does not apply to this architecture (e.g., cloud-only requirement for on-premise architecture)
      - **Unknown**: Data partially documented OR quality/applicability unclear

   e. **Source Section**: Extract from ARCHITECTURE.md:
      - If data found: "Section X" or "Section X, Y" (comma-separated if multiple)
      - If not found: "Not documented"

   f. **Responsible Role**: Extract from template (usually specified per requirement)

**Example Population (SRE Architecture - 57 requirements):**
```markdown
| Code | Requirement | Category | Status | Source Section | Responsible Role |
|------|-------------|----------|--------|----------------|------------------|
| LASRE01 | Define SLOs for all services | SRE Architecture | Compliant | Section 10 | SRE Team |
| LASRE02 | Calculate error budgets | SRE Architecture | Compliant | Section 10 | SRE Team |
| LASRE03 | Implement monitoring stack | SRE Architecture | Non-Compliant | Not documented | Platform Team |
| LASRE04 | Incident response procedures | SRE Architecture | Unknown | Section 11 | SRE Team |
...
```

**Step 4.4: Calculate Overall Compliance Summary**

After populating all rows in the Compliance Summary table, calculate compliance statistics using this MANDATORY format:

**Calculation Formula:**
```
TOTAL = Total number of requirements for this contract type
X (Compliant) = Count of rows with Status = "Compliant"
Y (Non-Compliant) = Count of rows with Status = "Non-Compliant"
Z (Not Applicable) = Count of rows with Status = "Not Applicable"
W (Unknown) = Count of rows with Status = "Unknown"

Verification: X + Y + Z + W = TOTAL (counts must sum correctly)
```

**Output Format (MANDATORY - use emoji indicators and percentages):**
```markdown
**Overall Compliance**:
- ✅ Compliant: X/TOTAL (X/TOTAL*100%)
- ❌ Non-Compliant: Y/TOTAL (Y/TOTAL*100%)
- ⊘ Not Applicable: Z/TOTAL (Z/TOTAL*100%)
- ❓ Unknown: W/TOTAL (W/TOTAL*100%)

**Completeness**: [COMPLETENESS_PERCENTAGE]% ([COMPLETED_ITEMS]/[TOTAL_ITEMS] data points documented)
```

**Example (SRE Architecture - 57 total requirements):**
```markdown
**Overall Compliance**:
- ✅ Compliant: 42/57 (74%)
- ❌ Non-Compliant: 8/57 (14%)
- ⊘ Not Applicable: 3/57 (5%)
- ❓ Unknown: 4/57 (7%)

**Completeness**: 87% (124/142 data points documented)
```

**Percentage Calculation:**
- Round percentages to nearest integer (e.g., 73.68% → 74%)
- Completeness percentage measures how many total data points across ALL sections are documented
- Completeness is separate from compliance status (a document can be 100% complete but have non-compliant items)

**Format Enforcement Checklist - Automated Validation:**
The following checks are now automated via the Template Validation Framework (executed in Phase 4.6):
- [x] Table has exactly 6 columns: Code | Requirement | Category | Status | Source Section | Responsible Role
- [x] Table header uses proper markdown pipe syntax: `| Col1 | Col2 | Col3 | Col4 | Col5 | Col6 |`
- [x] Table separator line uses proper syntax: `|------|------|------|------|------|------|`
- [x] All requirement codes present (row count matches template's total requirements)
- [x] Category column populated (use template type if no specific category)
- [x] Status values use EXACTLY one of: "Compliant", "Non-Compliant", "Not Applicable", "Unknown"
- [x] Overall Compliance line uses emoji indicators: ✅ ❌ ⊘ ❓
- [x] Compliance counts sum to TOTAL: X + Y + Z + W = TOTAL
- [x] Percentages calculated correctly and rounded to nearest integer
- [x] Completeness metric included with percentage and fraction format

**Validation Details:**
- Validation errors include line numbers, section references, and fix instructions
- Generation is BLOCKED if validation fails
- Validation rules: `/validation/template_validation_*.json`
- See error report for detailed debugging information

**Special Cases:**
- **Business Continuity** contract uses a different format (section-based, not table-based). Do NOT apply table format to this contract.
- **Data & AI Architecture** uses two categories: "Data" for data requirements (LAD1-LAD5) and "AI" for AI requirements (LAIA1-LAIA5)

**Step 4.5: Calculate Derived Values**
```
Examples:
- Error Budget from SLA (99.99% → 43.2 min/month)
- Business Criticality from uptime (99.99% → Tier 1)
- Integration Count from Section 7
```

**Step 4.6: Format and Comprehensive Validation**

**4.6.1 Automated Template Validation:**

Use the generation helper for integrated validation:

```typescript
import { validateGeneratedContract } from './utils/generation-helper';

// Validate generated content before output
const validationResult = await validateGeneratedContract(
  generatedContent,
  contractType  // e.g., 'sre_architecture', 'cloud_architecture', etc.
);

if (!validationResult.isValid) {
  // BLOCK: Generation failed validation
  console.error(validationResult.errorReport);

  throw new Error(
    `Validation failed for ${validationResult.contractDisplayName}: ` +
    `${validationResult.validationResult.errors.length} error(s), ` +
    `${validationResult.validationResult.warnings.length} warning(s)`
  );
}

// SUCCESS: Proceed to Phase 5 (Output)
console.log(validationResult.successMessage);
```

**Validation Checks:**
1. **Compliance Summary Table**: 6-column format, row counts, markdown syntax
2. **Status Values**: Exact case enforcement (Compliant, Non-Compliant, Not Applicable, Unknown)
3. **Appendix A.1-A.4 Structure**: All present, correct order
4. **Compliance Calculations**: Counts sum correctly, percentages accurate (X+Y+Z+W=TOTAL)
5. **Template Completeness**: All required sections present

**Error Handling:**
- Validation errors include line numbers, SKILL.md references, and actionable fix instructions
- All errors collected before reporting (not fail-fast)
- Generation BLOCKED if any BLOCKING-severity errors found
- Detailed error report shows exact violations and how to fix them

**Supported Contract Types:**
- `business_continuity`, `sre_architecture`, `cloud_architecture`
- `data_ai_architecture`, `development_architecture`, `process_transformation`
- `security_architecture`, `platform_it_infrastructure`, `enterprise_architecture`
- `integration_architecture`

**Standalone Validation CLI:**
For validating existing contracts or testing:
```bash
bun run utils/validate-cli.ts compliance-docs/sre_architecture.md sre_architecture
bun run utils/validate-cli.ts --help
```

**Integration Examples:**
See `INTEGRATION_EXAMPLE.md` for complete workflow examples including:
- Full generation workflow with validation
- Batch validation for multiple contracts
- CI/CD integration
- Error recovery workflow

**4.6.2 Manual Format Checks** (backward compatibility):
```
- Ensure proper markdown formatting
- Verify tables and lists render correctly
- Check source traceability references
```

**Step 4.7: Flag Missing Data**
```
For each missing data point:
- Add [PLACEHOLDER: description]
- Provide guidance on how to complete
- Reference source section if applicable
- Track for completion report
```

### Phase 5: Output

**Step 5.1: Generate Filename**
```
Pattern: [CONTRACT_TYPE]_[PROJECT_NAME]_[DATE].md
Example: SRE_ARCHITECTURE_JobScheduler_2025-11-26.md

IMPORTANT: If file exists, it will be REPLACED (overwritten) with the new version.
This ensures regenerated contracts reflect the latest ARCHITECTURE.md data.
```

**Step 5.2: Save to Output Directory**
```
Write file to /compliance-docs/ using Write tool
The Write tool OVERWRITES existing files, ensuring regeneration replaces old content
Preserve formatting and markdown structure
```

**Step 5.3: Generate/Update Manifest**

After generating each compliance contract, update the manifest using the manifest-generator utility:

```bash
bun utils/manifest-generator.ts \
  --mode [create|update] \
  --project "[PROJECT_NAME]" \
  --contract-type "[CONTRACT_TYPE_NAME]" \
  --filename "[GENERATED_FILENAME]" \
  --score [VALIDATION_SCORE] \
  --status "[DOCUMENT_STATUS]" \
  --completeness [COMPLETENESS_PERCENTAGE]
```

**Mode Selection**:
- Use `create` if this is the FIRST contract generated (manifest doesn't exist)
- Use `update` if manifest already exists (subsequent contracts)

**Required Arguments**:
- `--project`: Project name from ARCHITECTURE.md Document Index (e.g., "Task Scheduling System")
- `--contract-type`: Full contract type name (e.g., "Development Architecture", "Cloud Architecture")
- `--filename`: Generated contract filename (e.g., "DEVELOPMENT_ARCHITECTURE_Project_2025-12-14.md")
- `--score`: Final validation score from Phase 3.5 (0-10 scale, e.g., 8.5)
- `--status`: Document status from outcome tier mapping (e.g., "Approved", "In Review", "Draft", "Rejected")
- `--completeness`: Completeness percentage (0-100, e.g., 85 for 85%)

**Manifest Contents** (Auto-Generated):
- Compliance Framework Reference (framework version, scoring formula, approval thresholds)
- Validation Configuration (schema paths, validation engine version, rule files)
- Generated Documents table (contract type, filename, score, status, completeness, date)
- Summary statistics (total contracts, average completeness, average score, generation timestamp)

**Output**: `/compliance-docs/COMPLIANCE_MANIFEST.md`

**Behavior**:
- **Create mode**: Generates new manifest with framework/validation sections + first contract entry
- **Update mode**: Replaces existing contract entry if same type, appends if new type, recalculates summary

**Example Output**:
```markdown
## Generated Documents

| Contract Type | Filename | Score | Status | Completeness | Generated |
|---------------|----------|-------|--------|--------------|-----------|
| Cloud Architecture | CLOUD_ARCHITECTURE_TaskScheduling_2025-12-14.md | 7.8 | In Review | 78% | 2025-12-14 |
| Development Architecture | DEVELOPMENT_ARCHITECTURE_TaskScheduling_2025-12-14.md | 8.5 | Approved | 85% | 2025-12-14 |
| SRE Architecture | SRE_ARCHITECTURE_TaskScheduling_2025-12-14.md | 9.2 | Approved | 92% | 2025-12-14 |

## Summary
- Total Contracts: 3
- Average Score: 8.5/10
- Average Completeness: 85%
- Approved: 2, In Review: 1, Draft: 0, Rejected: 0
- Last Updated: 2025-12-14 14:30:00
```

**Note**: The utility automatically handles manifest creation, entry merging, sorting, and summary calculation.

**Step 5.4: Per-Contract Completion Report**
```
For each generated contract:
- Filename and location
- Data extraction statistics
  - Total data points
  - Successfully extracted
  - Placeholders requiring manual review
- Source sections used
- Completeness percentage
```

**Step 5.5: Summary Report**
```
Overall summary:
- Total contracts generated
- Total placeholders across all contracts
- Recommendations for ARCHITECTURE.md improvements
- Next steps for user review
```

## Contract Types and Required Sections

### 1. Business Continuity
**Primary Sections:** 11 (Operational Considerations)
**Secondary Sections:** 10 (Performance Requirements)
**Key Extractions:** RTO, RPO, backup strategy, DR procedures

### 2. SRE Architecture
**Primary Sections:** 10 (Performance), 11 (Operational)
**Secondary Sections:** 5 (System Components)
**Key Extractions:** SLOs, SLIs, error budgets, monitoring, incident management

### 3. Cloud Architecture
**Primary Sections:** 4 (Deployment Architecture), 8 (Technology Stack), 11 (Operational)
**Secondary Sections:** 9 (Security), 10 (Performance)
**Key Extractions:** Cloud model, connectivity, security, monitoring, backup, best practices

### 4. Data & Analytics - AI Architecture
**Primary Sections:** 5 (System Components), 6 (Data Flow), 7 (Integration Points)
**Secondary Sections:** 8 (Technology Stack), 10 (Performance)
**Key Extractions:** Data quality, governance, AI models, compliance, scalability

### 5. Development Architecture
**Primary Sections:** 3 (Architecture Patterns), 5 (System Components), 8 (Technology Stack), 12 (ADRs)
**Secondary Sections:** 11 (Operational)
**Key Extractions:** Technology stack, development practices, technical debt
**Automatic Validation:** Stack validation checklist (26 items) automatically evaluated during generation. Results: PASS (approval unblocked) or FAIL (detailed failure report with remediation guidance)

### 6. Process Transformation and Automation
**Primary Sections:** 1 (System Overview), 2 (Business Context), 6 (Data Flow)
**Secondary Sections:** 5 (System Components), 7 (Integration Points)
**Key Extractions:** Automation practices, process improvements, efficiency metrics

### 7. Security Architecture
**Primary Sections:** 9 (Security Considerations)
**Secondary Sections:** 7 (Integration Points), 11 (Operational)
**Key Extractions:** API security, authentication, encryption, communication security

### 8. Platform & IT Infrastructure
**Primary Sections:** 4 (Deployment Architecture), 8 (Technology Stack), 11 (Operational)
**Secondary Sections:** 10 (Performance)
**Key Extractions:** Environments, OS, databases, capacity, retention, naming

### 9. Enterprise Architecture
**Primary Sections:** 1 (System Overview), 2 (Business Context), 3 (Architecture Patterns), 4 (Deployment)
**Secondary Sections:** 12 (ADRs)
**Key Extractions:** Modularity, cloud-first, API-first, business alignment

### 10. Integration Architecture
**Primary Sections:** 7 (Integration Points)
**Secondary Sections:** 5 (System Components), 6 (Data Flow), 8 (Technology Stack)
**Key Extractions:** Integration catalog, patterns, security, standards compliance

## User Interaction Points

### Initialization Phase
**When:** Skill activation
**Question:** "Which compliance documents would you like to generate?"
**Options:** All 11, Specific contract(s), By category

### Configuration Phase
**When:** Before generation
**Question:** "Confirm output directory?"
**Default:** `/compliance-docs/`

### Template Missing
**When:** Template not found
**Question:** "Template for [CONTRACT_TYPE] not found. How should I proceed?"
**Options:** Use basic placeholder structure, Skip this contract, Provide template now

### Preview Phase (Optional)
**When:** User requests preview or many placeholders expected
**Question:** "Would you like to preview what will be generated?"
**Shows:** Contracts list, expected placeholders, source sections

### Missing Data Detected
**When:** Significant gaps in ARCHITECTURE.md
**Question:** "ARCHITECTURE.md is missing key data for [CONTRACT_TYPE]. How should I proceed?"
**Options:** Generate with placeholders, Complete ARCHITECTURE.md first, Skip this contract

### Completion Phase
**When:** After generation
**Prompt:** "Review [X] documents in /compliance-docs/. [Y] placeholders require manual review."
**Next Steps:** List sections needing completion, suggest ARCHITECTURE.md improvements

## Data Extraction Strategies (Strict Source Traceability)

The skill uses ONLY three extraction strategies that reference actual ARCHITECTURE.md content:

### 1. Direct Mapping (1:1)
- Extract exact values from ARCHITECTURE.md without transformation
- Source Reference Format: `Section X.Y, line Z`

```
ARCHITECTURE.md Input:
"RTO: 4 hours, RPO: 1 hour" (Section 11.3, line 1823)

Contract Output:
**RTO**: 4 hours
**RPO**: 1 hour
**Source**: ARCHITECTURE.md Section 11.3, line 1823
```

### 2. Aggregation (Multiple Sources)
- Collect related items from multiple locations and consolidate
- Source Reference Format: `Sections X-Y, lines A-B` (consolidated)

```
ARCHITECTURE.md Input:
Section 7.1, line 1005: "Integration: User Management (REST API)"
Section 7.2, line 1020: "Integration: Payment Gateway (SOAP)"

Contract Output:
## Integration Catalog
| System | Protocol | Source |
|--------|----------|--------|
| User Management | REST API | Section 7.1, line 1005 |
| Payment Gateway | SOAP | Section 7.2, line 1020 |
```

### 3. Transformation (Reformatting/Calculation)
- Convert, calculate, or reformat data from ARCHITECTURE.md
- Source Reference Format: `Section X.Y, line Z (calculated: [formula])`
- IMPORTANT: Transformations must show source data + calculation formula

```
ARCHITECTURE.md Input:
"SLA: 99.99% uptime" (Section 10.2, line 1576)

Contract Output:
**Availability SLO**: 99.99%
**Error Budget**: 43.2 minutes/month
**Calculation**: (100% - 99.99%) × 43,200 min = 43.2 min
**Source**: Section 10.2, line 1576 (calculated)
```

**Strict Validation Rule:**
- If value CANNOT be found using Direct, Aggregation, or Transformation → mark as [PLACEHOLDER]
- NO INFERENCE ALLOWED: Do not derive, guess, or infer values not explicitly stated in ARCHITECTURE.md
- Exception: None. All data must trace back to actual ARCHITECTURE.md content.

## Missing Data Handling - Strict Placeholder Format

### When Data Cannot Be Extracted

When data CANNOT be extracted using Direct, Aggregation, or Transformation strategies, use the following placeholder format:

**Standard Placeholder Template:**
```markdown
**[Field Name]**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section X.Y]
Optional Reference: [Industry standard or framework guidance - informational only]
Note: Add [specific data point] to ARCHITECTURE.md Section X.Y ([Section Name] → [Subsection Name])
```

**Example 1: Missing RTO**
```markdown
**RTO (Recovery Time Objective)**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11.3]
Optional Reference: Industry standard for Tier 1 applications: 4 hours RTO (NIST SP 800-34)
Note: Add RTO value to ARCHITECTURE.md Section 11.3 (Operational Considerations → Backup and Recovery)
```

**Example 2: Missing Authentication Method**
```markdown
**Authentication Method**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 9.1]
Optional Reference: Common patterns: OAuth 2.0 + JWT (IETF RFC 6749), SAML 2.0, or mTLS
Note: Add authentication approach to ARCHITECTURE.md Section 9.1 (Security Architecture → Authentication & Authorization)
```

**Example 3: Missing Encryption Standard**
```markdown
**Data Encryption at Rest**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 9.2]
Optional Reference: Industry standards: AES-256, TLS 1.3+ (FIPS 140-2 compliant)
Note: Add encryption standards to ARCHITECTURE.md Section 9.2 (Security Architecture → Data Encryption)
```

**Placeholder Components:**
1. **[PLACEHOLDER: ...]** - Clearly marks missing data
2. **Section Reference** - Which ARCHITECTURE.md section should contain the data (Section X.Y)
3. **Optional Reference** - Industry standard or framework guidance (informational, not prescriptive)
4. **Note** - Specific guidance on where to add the data in ARCHITECTURE.md (Section → Subsection path)

**Critical Rules:**
- ❌ NEVER infer or derive values not in ARCHITECTURE.md
- ❌ NEVER suggest specific values as if they were extracted
- ✅ ALWAYS reference actual section locations (Section X.Y)
- ✅ ALWAYS provide industry standards as optional reference (not requirements)
- ✅ ALWAYS include subsection path for adding missing data

### Completion Report

**For Each Contract:**
```
Contract: SRE Architecture
Completeness: 85% (17/20 data points)
Placeholders:
1. Incident response team contacts (Section 11.2 missing)
2. On-call rotation schedule (Section 11.2 missing)
3. Runbook locations (Section 11.4 missing)

Recommendations:
- Add Section 11.2: Incident Management with team contacts
- Add Section 11.4: Operational Runbooks with locations
```

## Integration with Existing Skills

### With architecture-docs Skill

**Dependencies:**
- Reads ARCHITECTURE.md created by architecture-docs skill
- Follows same 12-section structure
- Uses same Document Index pattern (lines 1-50)
- Respects same context-efficient loading strategies

**Workflow:**
```
1. User creates/updates ARCHITECTURE.md (architecture-docs skill)
2. User invokes: "Generate compliance documents" (architecture-compliance skill)
3. Skill reads ARCHITECTURE.md sections incrementally
4. Generates 10 compliance documents
```

### With architecture-readiness Skill

**Dependencies:**
- Product Owner Specifications provide business context
- Business requirements feed into compliance contracts
- Success criteria map to compliance requirements

**Workflow:**
```
1. Product Owner creates PO Spec (architecture-readiness skill)
2. Architecture team creates ARCHITECTURE.md (architecture-docs skill)
3. Compliance team generates contracts (architecture-compliance skill)
```

### Referenced in CLAUDE.md

**Project Guidelines Reference:**
```markdown
## Architecture Workflow

1. Business Requirements (architecture-readiness skill)
   → Creates: PRODUCT_OWNER_SPEC.md

2. Technical Architecture (architecture-docs skill)
   → Creates: ARCHITECTURE.md

3. Compliance Documentation (architecture-compliance skill)
   → Creates: 10 compliance contracts in /compliance-docs/
```

## Edge Cases and Error Handling

### ARCHITECTURE.md Not Found
```
Error: "ARCHITECTURE.md not found in current directory, parent, or /docs."
Action: Ask user for file location or suggest creating one with architecture-docs skill
```

### Invalid Structure
```
Error: "ARCHITECTURE.md does not follow 12-section standard structure."
Action: Suggest running architecture-docs skill to validate/fix structure
```

### Template Not Found
```
Warning: "Template for [CONTRACT_TYPE] not found."
Action: Ask user if they want to (1) use basic structure, (2) provide template, or (3) skip
```

### Empty Section
```
Warning: "Section 11 (Operational) is empty or missing."
Action: Flag affected contracts, generate with placeholders, list in completion report
```

### Multiple ARCHITECTURE.md Files
```
Question: "Multiple ARCHITECTURE.md files found. Which one?"
Action: Present list, ask user to select
```

### Output Directory Permissions
```
Error: "Cannot write to /compliance-docs/ (permission denied)."
Action: Ask user for alternative location or fix permissions
```

## Best Practices

### Before Generation
1. **Ensure ARCHITECTURE.md is complete** - Run architecture-docs skill first
2. **Validate structure** - Check for 12-section standard format
3. **Review Section 11** - Most contracts need operational data
4. **Check for metrics** - SLOs, SLAs, RTO/RPO critical for many contracts

### During Generation
1. **Load incrementally** - Don't load entire ARCHITECTURE.md
2. **Cache extracted data** - Reuse across multiple contracts
3. **Preserve source references** - Track section and line numbers
4. **Flag all gaps** - Use [PLACEHOLDER] for missing data

### After Generation
1. **Review placeholders** - Complete manual data entry
2. **Validate accuracy** - Check extracted data against ARCHITECTURE.md
3. **Update templates** - Refine templates based on actual organizational requirements
4. **Iterate ARCHITECTURE.md** - Improve source document to reduce placeholders

## Examples

### Example 1: Generate All Compliance Documents

**User Request:**
```
User: "Generate all compliance documents for this project"
```

**Skill Actions:**
```
1. Locate ARCHITECTURE.md in current directory
2. Load Document Index (lines 1-50)
3. Validate 12-section structure ✓
4. Confirm: "Generate all 10 compliance contracts?"
5. User confirms
6. For each of 10 contracts:
   - Identify required sections
   - Load sections incrementally
   - Extract data
   - Apply template
   - Generate document
7. Save to /compliance-docs/
8. Generate COMPLIANCE_MANIFEST.md
9. Report: "10 contracts generated. 20 placeholders require review."
```

### Example 2: Generate Specific Contract

**User Request:**
```
User: "Create SRE Architecture contract"
```

**Skill Actions:**
```
1. Locate ARCHITECTURE.md
2. Load Document Index (lines 1-50)
3. Identify contract: SRE Architecture
4. Required sections: 10, 11
5. Load Section 10 (lines 1550-1760)
6. Extract: SLOs (p95 < 100ms, p99 < 200ms), throughput (450 TPS)
7. Load Section 11 (lines 1760-1950)
8. Extract: Monitoring (Prometheus, Grafana), incidents (PagerDuty)
9. Apply template: templates/TEMPLATE_SRE_ARCHITECTURE.md
10. Generate: SRE_ARCHITECTURE_JobScheduler_2025-11-26.md
11. Report: "SRE contract generated. 2 placeholders (on-call rotation, runbooks)."
```

### Example 3: Generate by Category

**User Request:**
```
User: "Generate security compliance documentation"
```

**Skill Actions:**
```
1. Locate ARCHITECTURE.md
2. Parse category: "security"
3. Map to contract: Security Architecture
4. Confirm: "Generate Security Architecture contract?"
5. User confirms
6. Generate Security Architecture:
   - Load Section 9 (Security Considerations)
   - Extract: API security, authentication, encryption
   - Apply template
7. Save to /compliance-docs/
8. Report: "Security Architecture contract generated."
```

## Template Placeholder Conventions

### Standard Placeholders

**Project Information:**
- `[PROJECT_NAME]` - Extracted from ARCHITECTURE.md title (Section 1)
- `[GENERATION_DATE]` - Current date in YYYY-MM-DD format (use `date +%Y-%m-%d` bash command)
- `[DOCUMENT_OWNER]` - Extracted from ARCHITECTURE.md metadata or [PLACEHOLDER]

**Extracted Values:**
- `[EXTRACTED_VALUE]` - Actual data from ARCHITECTURE.md with source reference
- `[SOURCE_REFERENCE]` - Format: "Section X, line Y" or "Sections X-Y, lines A-B"

**Calculated Values (Transformation):**
- `[CALCULATED: formula]` - Mathematical calculation from explicit source data
- Must show source data + calculation formula + source reference
- Example: `[CALCULATED: (100% - 99.99%) × 43,200 min = 43.2 min/month from Section 10.2, line 1576]`

**Missing Data:**
- `[PLACEHOLDER: Not specified in ARCHITECTURE.md Section X.Y]` - Data not found, needs manual input
- Must include: section reference + optional industry standard + note with subsection path

### Example Template Excerpt

```markdown
# Compliance Contract: SRE Architecture

**Project**: [PROJECT_NAME]
**Generated**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 10, 11)
**Version**: 2.0

---

## 1. Service Level Objectives

### 1.1 Availability SLO
**Target**: [EXTRACTED_VALUE from Section 10.2, line 1576]
**Error Budget**: [CALCULATED: (100% - 99.99%) × 43,200 min = 43.2 min/month from Section 10.2, line 1576]
**Monitoring**: [EXTRACTED_VALUE from Section 11.1, line 1780]

### 1.2 Latency SLOs
**p95**: [EXTRACTED_VALUE from Section 10.1, line 1558]
**p99**: [EXTRACTED_VALUE from Section 10.1, line 1559]

[If missing]
**p95**: [PLACEHOLDER: Not specified in ARCHITECTURE.md Section 10.1]
Optional Reference: Industry standard for user-facing APIs: p95 < 100ms
Note: Add p95 latency target to ARCHITECTURE.md Section 10.1 (Scalability & Performance → Performance Targets)
```

## External Validation System (All Contract Types)

### Overview

All compliance contracts include **automatic validation** using external configuration files. This standardized validation system evaluates compliance against contract-specific criteria and generates a **0-10 score** that determines document approval status. This eliminates manual validation and provides consistent, auditable compliance assessment.

### Validation Configuration Files

**Location**: `/skills/architecture-compliance/validation/`

**Format**: JSON configuration files (one per contract type)

**Examples**:
- `development_architecture_validation.json` (26 validation items for tech stack)
- `security_architecture_validation.json` (security controls and compliance)
- `cloud_architecture_validation.json` (cloud best practices)
- `sre_architecture_validation.json` (reliability and observability)
- ...and 7 more (10 total)

**Schema**: `VALIDATION_SCHEMA.json` defines the structure for all validation configs

### Validation States

- **PASS (10 points)**: Item complies with requirements
- **FAIL (0 points)**: Non-compliant, deprecated, or unapproved
- **N/A (10 points)**: Not applicable to this architecture
- **UNKNOWN (0 points)**: Missing data in ARCHITECTURE.md (forces completeness)
- **EXCEPTION (10 points)**: Documented exception via LADES2 process (fully compliant)

### Scoring System (0-10 Scale)

**Score Calculation**:
```
Final Score = (Completeness × weight) + (Compliance × weight) + (Quality × weight)

Where:
- Completeness = (Filled required fields / Total required) × 10
- Compliance = (PASS + N/A + EXCEPTION items / Total applicable) × 10
- Quality = Source traceability coverage (0-10)
- Weights = Template-specific (defined in validation config):
  - Most templates: Completeness 40%, Compliance 50%, Quality 10%
  - Security/SRE/Integration: Completeness 30%, Compliance 60%, Quality 10% (compliance-focused)
  - Business Continuity: Completeness 50%, Compliance 40%, Quality 10% (completeness-focused)
  - Cloud Architecture: Completeness 35%, Compliance 55%, Quality 10% (balanced)
  - See individual validation config files for exact weights per template
```

**Outcome Tiers**:
- **8.0-10.0**: AUTO_APPROVE → Status: "Approved", Actor: "System (Auto-Approved)"
- **7.0-7.9**: MANUAL_REVIEW → Status: "In Review", Actor: [Approval Authority]
- **5.0-6.9**: NEEDS_WORK → Status: "Draft", Actor: "Architecture Team"
- **0.0-4.9**: REJECT → Status: "Rejected", Actor: "N/A (Blocked)"

### Validation Process

**Step 1: Load Configuration**
- Read validation config JSON for contract type
- Parse thresholds, weights, validation items, approval authority

**Step 2: Evaluate Items**
- For each validation item in config, evaluate against ARCHITECTURE.md data
- Collect evidence with source references (Section X.Y, line Z)
- Assign status: PASS, FAIL, N/A, UNKNOWN, or EXCEPTION

**Step 3: Calculate Scores**
- Item scores based on status (PASS=10, FAIL=0, etc.)
- Section scores: weighted average of item scores
- Completeness, Compliance, Quality scores
- Final score using weighted formula

**Step 4: Determine Outcome**
- Map final score to outcome tier
- Set document status, validation status, review actor
- Generate recommendations for FAIL/UNKNOWN items

**Step 5: Cache Results**
- Store validation_results object for document generation
- Include final score, outcome, breakdown, recommendations

### Template Integration

Validation results populate the Document Control section in generated compliance documents:

**Document Control Table**:
```markdown
| Status | In Review |
| Validation Score | 7.8/10 |
| Validation Status | PASS |
| Validation Date | 2025-12-07 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | Technical Architecture Review Board |
| Approval Authority | Technical Architecture Review Board |
```

**Validation Requirements**:
- Validation score ≥ 7.0 MANDATORY for approval pathway
- Score 8.0-10.0: Automatic approval (no human review required)
- Score 7.0-7.9: Manual review by [Approval Authority] required
- Score 5.0-6.9: Must address gaps before proceeding to review
- Score < 5.0: Contract rejected, cannot proceed

**Contract-Specific Content**:
- Development Architecture: LADES1.6 section with detailed stack validation results
- Security Architecture: Security controls compliance assessment
- SRE Architecture: SLO/SLI compliance and monitoring coverage
- Other contracts: Domain-specific validation details as defined in their configs

### Benefits of External Validation

1. **Maintainability**: Validation logic separated from templates and code
2. **Consistency**: All 10 contracts use the same validation schema and scoring methodology
3. **Transparency**: Numeric scores (0-10) provide granular feedback vs binary PASS/FAIL
4. **Automation**: Clear thresholds for automatic approval (8.0+) vs manual review (7.0-7.9)
5. **Extensibility**: Easy to add/modify validation items without changing templates
6. **Auditability**: Validation configs are versioned and traceable
7. **Flexibility**: Each contract can define custom weights while maintaining standard scoring

### Performance

- **Context overhead**: ~6,000 tokens per contract (3.5K prompt + 2.5K response)
- **Leverages cached data**: Uses sections already extracted in Step 3.4
- **No additional loading**: Validation uses cached ARCHITECTURE.md content
- **Efficient scoring**: JSON-based config parsing is fast and deterministic

### Approval Workflow

- **PASS**: Contract approval unblocked, document can move to "Approved" status
- **FAIL**: Contract approval blocked, document must remain "Draft" until remediation
- **Remediation**: Address failures via LADES2 (exception and action plan) or update Section 8

### Benefits

1. **Eliminates manual work**: Automatic validation saves 30-60 minutes per document
2. **Consistent evaluation**: Same 26 criteria applied uniformly every time
3. **Immediate feedback**: Know stack compliance instantly when generating docs
4. **Actionable reports**: FAIL cases include specific failures, evidence, recommendations
5. **Audit trail**: Validation date, evaluator, results documented
6. **Quality gate**: Non-compliant stacks cannot bypass validation

---

## Conclusion

This skill provides a systematic approach to generating compliance documentation from ARCHITECTURE.md, ensuring:

- **Context efficiency** (70-80% reduction in loaded content)
- **Data traceability** (all extractions reference source)
- **Gap visibility** (all missing data clearly flagged)
- **Automatic validation** (Development Architecture stack validation)
- **Incremental improvement** (templates evolve with organizational requirements)
- **Integration** (seamless workflow with architecture-docs and architecture-readiness skills)

For detailed mapping strategies and contract-specific guidance, refer to COMPLIANCE_GENERATION_GUIDE.md and SECTION_MAPPING_GUIDE.md.
