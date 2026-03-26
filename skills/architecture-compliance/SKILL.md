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
- "Recreate compliance contracts" / "Regenerate compliance contracts" / "Rebuild compliance contracts"
- "Recreate the compliance manifest" / "Regenerate the compliance manifest" / "Rebuild the compliance manifest"
- "Generate [specific contract type]" (e.g., "Generate SRE Architecture contract")
- "Create compliance documentation"
- `/skill architecture-compliance`
- "Generate all compliance docs"
- "Create security compliance" or "Generate risk management"
- "List available contracts"
- "Show contract types"
- "What contracts can I generate?"
- "Show me all compliance contracts"
- "Generate all my compliance contracts"
- "Create all compliance contracts"
- `/skill architecture-compliance all`
- `/skill architecture-compliance SRE,Cloud,Security` (comma-separated list for subset)

**NOT Activated For:**
- Automatic triggers when ARCHITECTURE.md changes
- General architecture documentation tasks (use `architecture-docs` skill)
- Business requirements documentation (use `architecture-readiness` skill)

## INVOCATION REQUIREMENT — BLOCKING

The compliance generator agents (`*-compliance-generator`) are **internal agents**.
They MUST ONLY be spawned from within this skill's Phase 3 workflow — always with `plugin_dir` and `architecture_file` parameters.

**NEVER call a compliance generator agent without `plugin_dir`.**
Doing so skips: plugin directory resolution, template expansion, and post-generation scoring.

If a user requests any compliance contract → invoke this skill first.
This skill resolves `plugin_dir`, then routes to the appropriate agent(s).

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

## Version History & Recent Improvements

### v2.2.0 - Unified Agent-Based Workflow (2025-12-31)

**Summary**: Refactored single contract generation to use specialized agents, eliminating duplicate inline generation logic and creating a consistent workflow path for all contract counts.

**Changes:**

1. **Routing Logic Unification**
   - Single contracts (count == 1) now use Phase 3 (Agent Invocation) instead of Phase 2-5 (inline generation)
   - All contract generation paths now consistently route to specialized agents
   - Removed conditional workflow branching based on contract count

2. **Code Cleanup** (~740 lines removed)
   - Removed obsolete Phase 2.2-2.4 (Output Directory, Template Availability, Preview Option)
   - Removed obsolete Phase 4 (Document Generation - inline logic)
   - Removed obsolete Phase 5 (Output - inline logic)
   - Removed Phase 2.1 Example Scenarios (6 scenarios)
   - SKILL.md reduced from 3491 to 2830 lines

3. **Phase 3.5 Enhancement**
   - Clarified manifest generation applies to both single AND bulk contract generation
   - Added explicit guidance for single contract invocation (create mode once)
   - Maintained existing sequential manifest generation for bulk

**Impact:**
- **Single Source of Truth**: Agents are the only generation implementation (no duplicate logic)
- **Consistency**: Identical workflow path regardless of contract count (1, 2-3, 4+)
- **Maintainability**: Fixes/updates only needed in agent files, not in SKILL.md
- **Simplicity**: SKILL.md is now ONLY an orchestrator (routing + manifest generation)
- **Reliability**: All contracts benefit from v1.9.5 agent fixes (file writing, validation)

**Files Modified:**
- `/skills/architecture-compliance/SKILL.md` (740 lines removed, ~50 lines updated)
- All documentation references updated to reflect unified workflow

---

### v2.1.0 - Enhanced Template Format Enforcement (2025-12-30)

**Summary**: Implemented comprehensive template preservation mandate and pre-write validation across all 10 compliance generation agents.

**Changes:**

1. **PHASE 0: Template Preservation Mandate** (All agents)
   - Establishes "READ-ONLY TEMPLATE MODE" as first instruction
   - Explicitly forbids structural modifications, table conversions, section numbering
   - Defines allowed operations (placeholder replacement ONLY)
   - Includes violation detection warnings

2. **PHASE 4.5: Comprehensive Pre-Write Validation** (All agents)
   - 7-point validation checklist covering ALL template sections
   - Document Control: 10 required fields, table format validation, forbidden field detection
   - Dynamic Field Instructions, Scoring Methodology validation
   - Compliance Summary table: 6 columns, row count verification
   - Detailed Requirements sections structure check
   - General structure rules enforcement (no section numbering, table formats)
   - **Aborts contract generation if ANY validation check fails**

3. **Validation Utility** (New tool)
   - Created `validate-contract-structure.ts` for automated format verification
   - Validates Document Control section (10 fields, table format, no extra fields)
   - Validates Compliance Summary table (6 columns, proper structure)
   - Detects invalid status values
   - Detects forbidden section numbering (A.1, A.2, etc. in shared sections)
   - Detects table-to-bold-field conversions
   - Usage: `bun skills/architecture-compliance/utils/validate-contract-structure.ts <contract-file>`

**Impact:**
- **100% template fidelity** - Zero structural deviations allowed
- **Deterministic output** - Same ARCHITECTURE.md → same structure every time
- **Consistent bulk generation** - All 10 contracts follow exact template format
- **Zero hallucinations** - No extra fields, sections, or content
- **Automated enforcement** - Validation happens before output is written

**Files Modified:**
- All 10 agent files in `/agents/` (PHASE 0 + PHASE 4.5 added)
- New utility: `/skills/architecture-compliance/utils/validate-contract-structure.ts`

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
- Mark as `[PLACEHOLDER: Not specified in docs/NN-name.md]`
- Provide optional industry standard reference (informational, not prescriptive)
- Include guidance on which docs/ file should contain the data

**Example:**
```
**RTO**: [PLACEHOLDER: Not specified in docs/09-operational-considerations.md]
Optional Reference: Industry standard for Tier 1 applications: 4 hours RTO (NIST SP 800-34)
Note: Add RTO value to docs/09-operational-considerations.md (Operational Considerations → Backup and Recovery)
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

Architecture documentation uses a **multi-file structure** where `ARCHITECTURE.md` is a navigation index (~130 lines) and section content lives in separate `docs/` files. This eliminates the need for line-offset based reads — each section is an independent file that can be read directly.

### Context-Efficient Workflow

**Step 1: Read Navigation Index**
```
Read ARCHITECTURE.md (full file, ~130 lines) to get:
- Project name (H1 header)
- Links to docs/ section files
```

**Step 2: Identify Required docs/ Files**
```
For each contract type, consult SECTION_MAPPING_GUIDE.md to determine:
- Primary files (80%+ of content)
- Secondary files (15-30% of content)
- Tertiary files (<15% of content)
```

**Step 3: Read docs/ Files Directly**
```
Read only required docs/ files in full (no offset/limit needed)
Example for SRE Architecture:
- docs/08-scalability-and-performance.md: SLOs, SLIs, latency targets
- docs/09-operational-considerations.md: Monitoring, DR, runbooks
Total: 2-3 focused files vs all 12 docs/ files
```

**Step 4: Cache Extracted Data**
```
Extract data once, cache for contract generation
Avoid re-reading same files for multiple contracts
```

### Example: SRE Architecture Contract Generation

**Multi-File Approach:**
```
1. Read ARCHITECTURE.md (~130 lines) — get project name
2. Read docs/08-scalability-and-performance.md — SLOs, latency, throughput
3. Extract performance metrics, cache
4. Read docs/09-operational-considerations.md — monitoring, incidents, DR
5. Extract operational data, cache
6. Generate contract from cached data
Total: 3 files, each read in full, no offset calculations needed
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

Parse user request to determine which contracts to generate:

**Intent Types:**
1. **"all" keyword** → Generate all 10 contracts
   - Examples:
     - "Generate all compliance documents"
     - "Generate all my compliance contracts"
     - "/skill architecture-compliance all"
     - "Create all compliance contracts"
   - Detection: Check for "all" keyword in normalized input (lowercase, trimmed)
   - Pattern matching: "all compliance", "all my compliance", "all contracts", "all docs"

2. **Comma-separated list** → Generate specific subset of contracts
   - Examples:
     - "/skill architecture-compliance SRE,Cloud,Security"
     - "Generate compliance contracts: SRE, Cloud, and Security"
     - "Create SRE and Cloud contracts"
   - Detection: Split by comma, "and", "or" delimiters
   - Parse each contract name using alias matching (see Aliases table lines 173-188)

3. **Single contract name** → Generate one contract (existing workflow)
   - Examples:
     - "Generate SRE Architecture contract"
     - "Create Development Architecture compliance"
   - Detection: Single contract type identified via exact or fuzzy matching

**Parsing Logic:**
```
1. Normalize input: lowercase, trim whitespace, remove punctuation
2. Check for "all" keyword (in patterns like "all compliance", "all my", "all contracts")
   - If found → selected_contracts = ALL_10_CONTRACT_TYPES
3. Check for delimiter patterns (comma, "and", "or")
   - If found → split input, parse each token as contract name
   - Use alias matching for each token (see lines 173-188)
   - selected_contracts = [matched contract types]
4. Otherwise → single contract mode
   - Use exact or fuzzy matching (existing logic, lines 410-431)
   - selected_contracts = [single contract type]

Output: selected_contracts = array of 1-10 contract types
```

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
- ARCHITECTURE.md as navigation index (~130 lines)
- docs/ directory with section files
- Required docs/ files exist for the selected contract types
```

**Step 1.4: Clarify User Intent**
```
If ambiguous, ask:
- "Which compliance documents would you like to generate?"
  Options: All 11, Specific contract(s), By category (security, cloud, etc.)
```

### Phase 2: Configuration

**Step 2.1: Contract Selection and Workflow Routing**

Based on selected_contracts from Step 1.1:

**Routing Logic:**
```
# ALL contract generation now uses specialized agents (v2.0+)
# No inline generation logic in SKILL.md

IF selected_contracts.length >= 1:
  # AGENT-BASED GENERATION (All contract counts)
  # Single contract (count == 1): Invoke one agent sequentially
  # Multiple contracts (count >= 2): Invoke agents in parallel
  # See Phase 3: Agent Invocation below
  proceed_to_phase_3()
  # Skip to Phase 3: Agent Invocation
```

**Single Contract Validation** (when selected_contracts.length == 1):
```
Validation Process:
1. Normalize user input: Convert to lowercase, trim whitespace
2. Check for exact match against contract type names and aliases (see Aliases table above)
   - If match found → Proceed to Step 2.2
3. If no match found:
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

Output: Validated contract type
```

**Bulk Contracts Validation** (when selected_contracts.length > 1):
```
1. For each contract in selected_contracts:
   - Validate template exists: templates/TEMPLATE_[CONTRACT_TYPE].md
   - Validate validation config exists: validation/template_validation_[contract_type].json
2. If any templates missing:
   - Warn user: "Template not found for [CONTRACT_TYPE]"
   - Offer options:
     a) Skip missing contracts, generate remaining ones
     b) Cancel entire operation
3. Output: validated_contracts = [contracts with templates available]
```

### Phase 3: Agent Invocation

**Step 3.1: Resolve Plugin Directory**

**Step A — Try Glob (dev mode / running from within the plugin directory):**
```
Glob pattern: **/solutions-architect-skills/skills/architecture-compliance/SKILL.md
```
If a result is returned: strip the `"/skills/architecture-compliance/SKILL.md"` suffix → `plugin_dir`. Done — skip Step B.

**Step B — Call resolve-plugin-dir.ts from the marketplace installation (installed plugin):**
If Glob returned nothing, run:
```bash
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/skills/architecture-compliance/utils/resolve-plugin-dir.ts
```
Capture stdout. If non-empty: use it as `plugin_dir`. Done.

If both steps yield nothing: **STOP** and report:
> ERROR: Cannot resolve plugin_dir. Run from within the plugin dev directory, or ensure the plugin is installed via the shadowx4fox-solution-architect-marketplace.

Store `plugin_dir` for inclusion in all agent prompts.

**Step 3.2: Resolve Compliance Docs Directory**

Determine the absolute path where contracts will be written:
```
compliance_docs_dir = dirname(realpath(architecture_file)) + "/compliance-docs"
```

This is needed for the pipeline in Phase 4.

**Step 3.3: Spawn Agents**

Invoke all selected agents in a **single message** (Claude handles parallel Task execution natively). Pass `plugin_dir` and `architecture_file` in each prompt.

| Contract Type | Agent | Subagent Type |
|---------------|-------|---------------|
| Business Continuity | Aegis | `solutions-architect-skills:business-continuity-compliance-generator` |
| SRE Architecture | Prometheus | `solutions-architect-skills:sre-compliance-generator` |
| Cloud Architecture | Atlas | `solutions-architect-skills:cloud-compliance-generator` |
| Data & AI Architecture | Mnemosyne | `solutions-architect-skills:data-ai-compliance-generator` |
| Development Architecture | Hephaestus | `solutions-architect-skills:development-compliance-generator` |
| Process Transformation | Hermes | `solutions-architect-skills:process-compliance-generator` |
| Security Architecture | Argus | `solutions-architect-skills:security-compliance-generator` |
| Platform & IT Infrastructure | Vulcan | `solutions-architect-skills:platform-compliance-generator` |
| Enterprise Architecture | Athena | `solutions-architect-skills:enterprise-compliance-generator` |
| Integration Architecture | Iris | `solutions-architect-skills:integration-compliance-generator` |

**Agent prompt template** (use for all agents, fill in contract type and agent name):
```
Generate [Contract Type] compliance contract.
architecture_file: [absolute path to ARCHITECTURE.md]
plugin_dir: [plugin_dir resolved in Step 3.1]
```

**Single contract example:**
```python
Task(
    subagent_type="solutions-architect-skills:cloud-compliance-generator",
    prompt="Generate Cloud Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: /home/user/.claude/plugins/solutions-architect-skills",
    description="Atlas — Generate Cloud compliance"
)
```

**All 10 contracts (single message, all in parallel):**
```python
Task(subagent_type="solutions-architect-skills:business-continuity-compliance-generator", description="Aegis — Business Continuity", prompt="Generate Business Continuity compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:sre-compliance-generator", description="Prometheus — SRE", prompt="Generate SRE Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:cloud-compliance-generator", description="Atlas — Cloud", prompt="Generate Cloud Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:data-ai-compliance-generator", description="Mnemosyne — Data & AI", prompt="Generate Data & AI Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:development-compliance-generator", description="Hephaestus — Development", prompt="Generate Development Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:process-compliance-generator", description="Hermes — Process", prompt="Generate Process Transformation compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:security-compliance-generator", description="Argus — Security", prompt="Generate Security Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:platform-compliance-generator", description="Vulcan — Platform", prompt="Generate Platform & IT Infrastructure compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:enterprise-compliance-generator", description="Athena — Enterprise", prompt="Generate Enterprise Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="solutions-architect-skills:integration-compliance-generator", description="Iris — Integration", prompt="Generate Integration Architecture compliance contract.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]")
```

**Step 3.4: Collect Results**

After all tasks complete, check for failures. If any agent failed:
- Report which contracts failed
- Offer to retry individual failures
- Continue to Phase 4 for successful contracts

### Phase 4: Post-Generation Pipeline

After all agents complete, run the post-generation pipeline in a **single Bash call**. This calculates validation scores, updates contract fields, and writes `COMPLIANCE_MANIFEST.md`:

```bash
bun [plugin_dir]/skills/architecture-compliance/utils/post-generation-pipeline.ts \
  --compliance-docs-dir [compliance_docs_dir] \
  --project "[PROJECT_NAME]"
```

**What the pipeline does**:
1. Scans `compliance-docs-dir` for `*.md` files (excluding `COMPLIANCE_MANIFEST.md`)
2. Detects and removes superseded contracts (same type, older date) — only the newest per type is kept
3. For each contract: calculates validation score, updates Document Control fields
4. Writes `COMPLIANCE_MANIFEST.md` with all contracts in one pass

**Error handling**: If pipeline fails, report the error. Contracts are already written — only scoring and manifest are affected. The user can re-run the pipeline manually.

### Phase 5: Verify and Report

**Step 5.1: Verify Manifest**

Check that `COMPLIANCE_MANIFEST.md` exists in the compliance-docs directory:
```
Read file: [compliance_docs_dir]/COMPLIANCE_MANIFEST.md
```

If missing, report error and provide the pipeline command for manual re-run.

**Step 5.2: Report Completion**

Report results to the user:
```
✅ Compliance generation complete

Generated contracts: [N] of [M] requested
Manifest: [compliance_docs_dir]/COMPLIANCE_MANIFEST.md

Contracts:
  ✓ [Contract Type] — [filename] (Score: X.X/10, Status: Approved)
  ✗ [Contract Type] — FAILED: [reason]
```

If the pipeline JSON summary includes `removedContracts` (non-empty array), append:

```
🗑️  Cleaned up [N] superseded contract(s):
  - [old_filename] (superseded by [newer_filename])
```

---

## Conclusion

This skill generates compliance documentation from ARCHITECTURE.md using 10 specialized agents in parallel. Each agent is self-contained and writes its contract independently. The post-generation pipeline handles scoring and manifest generation in a single pass.

For detailed mapping strategies and contract-specific guidance, refer to COMPLIANCE_GENERATION_GUIDE.md and SECTION_MAPPING_GUIDE.md.
