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
- "Generate all my compliance contracts"
- "Create all compliance contracts"
- `/skill architecture-compliance all`
- `/skill architecture-compliance SRE,Cloud,Security` (comma-separated list for subset)

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

### Phase 3: Agent Invocation (v2.0+)

**IMPORTANT**: As of v2.0.0, this skill uses specialized compliance generation agents (one per contract type) instead of direct generation. This section documents the agent routing logic.

**Step 3.1: Agent Selection**

Based on the selected contract type(s) from Phase 2, invoke the corresponding specialized agent(s):

| Contract Type | Agent Name | Mythos | Subagent Type |
|---------------|------------|--------|---------------|
| Business Continuity | business-continuity-compliance-generator | Aegis | `solutions-architect-skills:business-continuity-compliance-generator` |
| SRE Architecture | sre-compliance-generator | Prometheus | `solutions-architect-skills:sre-compliance-generator` |
| Cloud Architecture | cloud-compliance-generator | Atlas | `solutions-architect-skills:cloud-compliance-generator` |
| Data & AI Architecture | data-ai-compliance-generator | Mnemosyne | `solutions-architect-skills:data-ai-compliance-generator` |
| Development Architecture | development-compliance-generator | Hephaestus | `solutions-architect-skills:development-compliance-generator` |
| Process Transformation | process-compliance-generator | Hermes | `solutions-architect-skills:process-compliance-generator` |
| Security Architecture | security-compliance-generator | Argus | `solutions-architect-skills:security-compliance-generator` |
| Platform & IT Infrastructure | platform-compliance-generator | Vulcan | `solutions-architect-skills:platform-compliance-generator` |
| Enterprise Architecture | enterprise-compliance-generator | Athena | `solutions-architect-skills:enterprise-compliance-generator` |
| Integration Architecture | integration-compliance-generator | Iris | `solutions-architect-skills:integration-compliance-generator` |

**Agent Characteristics:**
- Each agent is **pre-configured** with contract-specific settings:
  - Contract type (no parameter needed)
  - Template filename
  - Section mappings (pre-configured for performance)
  - Domain-specific data extraction patterns
- Agents are **self-contained** (no shared state)
- Agents support **parallel execution** (unique output filenames)
- Agents **DO NOT** generate COMPLIANCE_MANIFEST.md (skill handles this)

**Step 3.2: Single Contract Invocation**

When generating a single contract (selected_contracts.length == 1):

```python
# Example: Generate Cloud Architecture contract
Task(
    subagent_type="solutions-architect-skills:cloud-compliance-generator",
    prompt="Generate Cloud Architecture compliance contract from ./ARCHITECTURE.md",
    description="Atlas — Generate Cloud compliance"
)
```

**Agent Input:**
- `architecture_file` path (default: ./ARCHITECTURE.md)

**Agent Output:**
- Generated compliance contract file: `/compliance-docs/[CONTRACT_TYPE]_[PROJECT]_[DATE].md`
- Metadata (filename, project, date, score) returned to skill
- **IMPORTANT**: Agents create ONLY the .md contract file (no .txt reports, no additional files)

**Step 3.3: Bulk Contract Invocation (Parallel)**

When generating multiple contracts (selected_contracts.length > 1):

**Parallel Execution:**
```python
# Example: Generate all 10 contracts in parallel
# Single message with multiple Task tool calls

Task(subagent_type="solutions-architect-skills:business-continuity-compliance-generator", description="Aegis — Generate Business Continuity compliance", ...),
Task(subagent_type="solutions-architect-skills:sre-compliance-generator", description="Prometheus — Generate SRE compliance", ...),
Task(subagent_type="solutions-architect-skills:cloud-compliance-generator", description="Atlas — Generate Cloud compliance", ...),
Task(subagent_type="solutions-architect-skills:data-ai-compliance-generator", description="Mnemosyne — Generate Data & AI compliance", ...),
Task(subagent_type="solutions-architect-skills:development-compliance-generator", description="Hephaestus — Generate Development compliance", ...),
Task(subagent_type="solutions-architect-skills:process-compliance-generator", description="Hermes — Generate Process compliance", ...),
Task(subagent_type="solutions-architect-skills:security-compliance-generator", description="Argus — Generate Security compliance", ...),
Task(subagent_type="solutions-architect-skills:platform-compliance-generator", description="Vulcan — Generate Platform compliance", ...),
Task(subagent_type="solutions-architect-skills:enterprise-compliance-generator", description="Athena — Generate Enterprise compliance", ...),
Task(subagent_type="solutions-architect-skills:integration-compliance-generator", description="Iris — Generate Integration compliance", ...)
```

**Benefits:**
- **Performance**: 10 agents in parallel ~10x faster than sequential
- **No conflicts**: Each agent writes unique output file
- **No shared state**: Fully independent execution

**Step 3.4: Collect Agent Results**

After all agents complete:

```python
results = []
for agent in launched_agents:
    result = agent.wait_for_completion()
    results.append({
        "filename": result.filename,
        "project": result.project,
        "date": result.date,
        "score": result.score,  # If calculated by agent
        "type": result.contract_type
    })
```

**Step 3.4A: Detect Compliance Docs Directory**

Determine the absolute path to the compliance-docs directory:

```bash
# Get absolute path to ARCHITECTURE.md directory
ARCH_DIR=$(dirname "$(realpath ./ARCHITECTURE.md)")

# Compliance docs are in subdirectory of ARCHITECTURE.md location
COMPLIANCE_DOCS_DIR="${ARCH_DIR}/compliance-docs"
```

Store this path for use in manifest-generator invocations.

**Why This Step**:
- Manifest-generator.ts looks for compliance-docs at `process.cwd()/compliance-docs`
- In plugin context, `process.cwd()` differs from ARCHITECTURE.md location
- Passing absolute path via `--compliance-docs-dir` ensures correct directory is used

**Step 3.5: Generate Compliance Manifest**

After all agent(s) complete successfully, generate COMPLIANCE_MANIFEST.md using manifest-generator.ts.

**CRITICAL: You MUST execute manifest generation after ALL contract generation (single OR bulk).**

**Applies To:**
- Single contract generation: Execute manifest-generator once (create mode)
- Bulk contract generation: Execute manifest-generator sequentially for each contract (create for first, update for rest)

**Path Resolution Note** (v1.9.3+):

The `--compliance-docs-dir` parameter is required when running from plugin context to ensure manifest-generator finds the correct directory. This parameter should be set to the absolute path of the compliance-docs directory (subdirectory of ARCHITECTURE.md location).

If the parameter is omitted, manifest-generator defaults to `./compliance-docs` relative to `process.cwd()`, which may not match the contract generation location in plugin contexts.

**Command Sequence:**

For each generated contract, invoke manifest-generator.ts sequentially:

1. **First Contract** (creates new manifest):
```bash
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode create \
  --project "[PROJECT_NAME]" \
  --contract-type "[CONTRACT_TYPE]" \
  --filename "[GENERATED_FILENAME]" \
  --score [SCORE] \
  --status "[STATUS]" \
  --completeness [COMPLETENESS_PERCENTAGE] \
  --compliance-docs-dir "${COMPLIANCE_DOCS_DIR}"
```

2. **Subsequent Contracts** (update existing manifest):
```bash
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode update \
  --project "[PROJECT_NAME]" \
  --contract-type "[CONTRACT_TYPE]" \
  --filename "[GENERATED_FILENAME]" \
  --score [SCORE] \
  --status "[STATUS]" \
  --completeness [COMPLETENESS_PERCENTAGE] \
  --compliance-docs-dir "${COMPLIANCE_DOCS_DIR}"
```

**Parameter Extraction:**
- `[PROJECT_NAME]`: Extract from first H1 in ARCHITECTURE.md or contract filename
- `[CONTRACT_TYPE]`: Type of contract (Business Continuity, SRE Architecture, etc.)
- `[GENERATED_FILENAME]`: The .md file created by the agent
- `[SCORE]`: Actual `final_score` from Step 2D.PRE validation (fallback: `0`)
- `[STATUS]`: Actual `outcome.document_status` from validation (fallback: `"Draft"`)
- `[COMPLETENESS_PERCENTAGE]`: Actual `completeness_score * 10` from validation (fallback: `0`)

**Example Execution Sequence:**
```bash
# 1. First contract (creates manifest) - use actual scores from Step 2D.PRE
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode create \
  --project "3-Tier-To-Do-List" \
  --contract-type "Business Continuity" \
  --filename "BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md" \
  --score [ACTUAL_SCORE] \
  --status "[ACTUAL_STATUS]" \
  --completeness [ACTUAL_COMPLETENESS] \
  --compliance-docs-dir "${COMPLIANCE_DOCS_DIR}"

# 2-10. Remaining contracts (update manifest) - use actual scores
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode update \
  --project "3-Tier-To-Do-List" \
  --contract-type "SRE Architecture" \
  --filename "SRE_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md" \
  --score [ACTUAL_SCORE] \
  --status "[ACTUAL_STATUS]" \
  --completeness [ACTUAL_COMPLETENESS] \
  --compliance-docs-dir "${COMPLIANCE_DOCS_DIR}"

# ... repeat for all 10 contracts with their actual validation scores
```

**Error Handling:**
- If manifest-generator.ts fails → Log error, continue with remaining contracts
- If all contracts fail → Return error, do not create empty manifest
- Always verify COMPLIANCE_MANIFEST.md exists after completion

**Why Skill Handles Manifest:**
- **Atomicity**: Manifest updated only after ALL contracts complete
- **Consistency**: Single source of truth for manifest generation
- **No Race Conditions**: Prevents conflicts when running 10 agents in parallel
- **Traceability**: Skill aggregates all agent results before manifest creation

**IMPORTANT**:
- Individual agents DO NOT generate or update COMPLIANCE_MANIFEST.md (prevents write conflicts during parallel execution)
- This step is NOT optional - always execute after parallel agent completion
- Verify COMPLIANCE_MANIFEST.md exists before reporting completion to user

### Phase 3 (Legacy): Data Extraction (Context-Efficient)

**NOTE**: This phase is now delegated to specialized agents (v2.0+). The documentation below describes the agent's internal workflow for reference.

**Legacy Phase - Now Handled by Agents:**

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

---

## BULK GENERATION WORKFLOW

**This section is used ONLY when selected_contracts.length > 1 (bulk mode).**
**For single contracts, use Phase 3: Agent Invocation above (unified workflow).**

### Phase 2 Bulk: Batch Workflow Routing

**Step 2B.0: Batching Decision**

Determine workflow mode based on selected_contracts.length:

```
IF selected_contracts.length >= 4:
    # BATCHED MODE
    batch_size = 3
    batches = split_into_batches(selected_contracts, batch_size)

    # Priority order for splitting (importance-based)
    priority_order = [
        'business_continuity', 'sre_architecture', 'cloud_architecture',
        'data_ai_architecture', 'development_architecture',
        'process_transformation', 'security_architecture',
        'platform_it_infrastructure', 'enterprise_architecture',
        'integration_architecture'
    ]

    # Initialize cross-batch state
    batch_results = {
        'successful_contracts': [],
        'failed_contracts': [],
        'generated_contracts': {},
        'validation_results': [],
        'manifest_mode': 'create'  # First batch creates, rest update
    }

    # Execute batched workflow
    for batch_num, batch_contracts in enumerate(batches, start=1):
        print("═══════════════════════════════════════════")
        print(f"Processing Batch {batch_num}/{len(batches)}")
        print(f"Contracts: {', '.join(batch_contracts)}")
        print("═══════════════════════════════════════════\n")

        # Process batch (Phases 2B.1-Batched through 4B.3-Batched)
        batch_result = process_single_batch(
            batch_contracts,
            batch_num,
            batch_results['manifest_mode']
        )

        # Accumulate results
        batch_results['successful_contracts'].extend(batch_result.successful)
        batch_results['failed_contracts'].extend(batch_result.failed)
        batch_results['generated_contracts'].update(batch_result.generated)
        batch_results['validation_results'].extend(batch_result.validation)

        # Update manifest mode for next batch
        batch_results['manifest_mode'] = 'update'

    # Generate aggregated summary (Phase 5B-Batched)
    generate_batched_summary_report(batch_results)
    EXIT  # Batched workflow complete

ELSE:
    # PARALLEL MODE (2-3 contracts, no batching needed)
    # Continue to Step 2B.1 (existing workflow below)
```

---

### Phase 2C: Parallel Agent Generation (4+ Contracts)

**CRITICAL**: This phase is automatically activated when `selected_contracts.length >= 4` to enable parallel agent-based generation with 10× speedup.

**When to Use:**
- User requests 4 or more compliance contracts
- Automatically spawns Task Agents (1 per contract) in parallel
- No user prompt required (automatic activation)

**Routing Logic:**
```
IF selected_contracts.length === 1:
    → Use Phase 3 (Agent Invocation - Single Contract)
ELSE IF selected_contracts.length <= 3:
    → Use Phase 2 Bulk (Parallel Data Loading - see below)
ELSE IF selected_contracts.length >= 4:
    → Use Phase 2C (Parallel Agent Generation - THIS SECTION)
```

**Benefits:**
- 10× speedup (3-5 min for 10 contracts vs 50+ min sequential)
- Parallel execution (all contracts generated simultaneously)
- Auto-fallback on failure (graceful degradation to sequential mode)
- Leverages existing skill infrastructure (agents invoke skill)

---

**Step 2C.0: Agent Configuration**

1. **Determine contract list**
   ```
   IF user requested "all":
       contracts = all 10 contract types
   ELSE:
       contracts = user-specified list (must be >= 4)
   ```

2. **Locate ARCHITECTURE.md**
   ```
   architecture_file = path to ARCHITECTURE.md
   - Validate file exists
   - Get absolute path for agents
   ```

3. **Get project metadata**
   ```
   - Read ARCHITECTURE.md lines 1-50 (Document Index)
   - Extract project_name from Section 1
   - Get current_date in YYYY-MM-DD format (for manifest updates)
   ```

**Contract Type List:**
```javascript
all_contracts = [
  'business_continuity',      // 1. Business Continuity
  'sre_architecture',         // 2. SRE Architecture
  'cloud_architecture',       // 3. Cloud Architecture
  'data_ai',                  // 4. Data & AI Architecture
  'development',              // 5. Development Architecture
  'process',                  // 6. Process Transformation
  'security',                 // 7. Security Architecture
  'platform',                 // 8. Platform & IT Infrastructure
  'enterprise',               // 9. Enterprise Architecture
  'integration'               // 10. Integration Architecture
]
```

---

**Step 2C.1: Spawn Task Agents in Parallel**

For each contract_type in contracts, spawn a Task Agent using the compliance-generator agent definition:

```
For contract_type in contracts:
  Spawn Task Agent:
    Agent Definition: agents/compliance-generator.md  ← At plugin root
    Parameters:
      contract_type: [contract_type]
      architecture_file: [architecture_file_path]

    The agent will:
      1. Invoke: /solutions-architect-skills:architecture-compliance [contract_type]
      2. The skill automatically:
         - Reads ARCHITECTURE.md
         - Loads template for [contract_type]
         - Generates and validates contract
         - Writes to /compliance-docs/[FILENAME].md
         - Updates COMPLIANCE_MANIFEST.md
      3. Returns: Success or error message
```

**Example Spawn Calls (10 agents in parallel):**
```
Task Agent 1  (Aegis):      Load agents/compliance-generator.md, contract_type=business_continuity, architecture_file=[PATH]
Task Agent 2  (Prometheus): Load agents/compliance-generator.md, contract_type=sre_architecture, architecture_file=[PATH]
Task Agent 3  (Atlas):      Load agents/compliance-generator.md, contract_type=cloud_architecture, architecture_file=[PATH]
Task Agent 4  (Mnemosyne):  Load agents/compliance-generator.md, contract_type=data_ai, architecture_file=[PATH]
Task Agent 5  (Hephaestus): Load agents/compliance-generator.md, contract_type=development, architecture_file=[PATH]
Task Agent 6  (Hermes):     Load agents/compliance-generator.md, contract_type=process, architecture_file=[PATH]
Task Agent 7  (Argus):      Load agents/compliance-generator.md, contract_type=security, architecture_file=[PATH]
Task Agent 8  (Vulcan):     Load agents/compliance-generator.md, contract_type=platform, architecture_file=[PATH]
Task Agent 9  (Athena):     Load agents/compliance-generator.md, contract_type=enterprise, architecture_file=[PATH]
Task Agent 10 (Iris):       Load agents/compliance-generator.md, contract_type=integration, architecture_file=[PATH]
```

**Agent Behavior:**
- Each agent follows compliance-generator.md workflow (simple skill invocation)
- Agents run independently (no shared state)
- Each agent has Write tool access via the skill
- Timeout: 10 minutes per agent
- **Agent location:** Plugin root `agents/` directory (Claude Code convention)

---

**Step 2C.2: Wait for All Task Agents**

```
Wait for all spawned agents to complete
Timeout: 10 minutes per agent
Collect results: { agent_id, contract_type, status, output }
```

**Expected Results:**
```javascript
agent_results = [
  { agent_id: 1, contract_type: 'business_continuity', status: 'success', output: '✅ Generated...' },
  { agent_id: 2, contract_type: 'sre_architecture', status: 'success', output: '✅ Generated...' },
  { agent_id: 3, contract_type: 'cloud_architecture', status: 'failed', output: '❌ Failed...' },
  ...
]
```

---

**Step 2C.3: Handle Complete Failure (All Agents Failed)**

```
successful_agents = agent_results.filter(r => r.status === 'success')

IF successful_agents.length === 0:
    Display:
    ═══════════════════════════════════════════════
    ⚠️  Parallel Agent Mode Failed
    ═══════════════════════════════════════════════

    All agents failed to generate contracts.
    Falling back to sequential single-contract mode...

    This will process contracts one at a time using the
    existing workflow. Processing may take longer.

    ═══════════════════════════════════════════════

    → Fall back to Phase 3 (Sequential Agent Invocation)
    → Process each contract sequentially
    → EXIT Phase 2C
```

---

**Step 2C.4: Aggregate Results**

```javascript
successful_agents = agent_results.filter(r => r.status === 'success')
failed_agents = agent_results.filter(r => r.status === 'failed')

aggregated_results = {
  total_requested: contracts.length,
  successful: successful_agents.length,
  failed: failed_agents.length,
  successful_contracts: successful_agents.map(a => a.contract_type),
  failed_contracts: failed_agents.map(a => ({
    contract_type: a.contract_type,
    error_message: a.output
  }))
}
```

**Note:** Each successful agent:
- Wrote its contract file to /compliance-docs/
- Does NOT update COMPLIANCE_MANIFEST.md (prevents race conditions during parallel execution)
- Returns metadata to skill orchestrator

**Next Step:** Skill MUST invoke manifest-generator.ts sequentially for all contracts (see Step 3.5)

---

### PHASE 2D: POST-AGENT VALIDATION AND MANIFEST GENERATION

**BLOCKING REQUIREMENT**: You MUST execute this phase. The skill is NOT complete until all contracts are validated and COMPLIANCE_MANIFEST.md exists.

**Purpose**: Validate generated contracts with score-calculator, update validation fields, then create COMPLIANCE_MANIFEST.md with actual scores.

**Why This Phase Exists**:
- Agents leave validation placeholders (`[VALIDATION_SCORE]`, `[DOCUMENT_STATUS]`, etc.) for CLI tools to populate
- Score calculator analyzes compliance status counts and calculates weighted scores
- Field updater writes actual scores, dates, and status into the contract
- Manifest provides single source of truth for all contracts with real validation data

---

**Step 2D.PRE: Validate Each Generated Contract**

**CRITICAL**: Run validation on EACH generated contract BEFORE manifest generation. This populates validation scores in the contract files.

**Validation Config Mapping**:

| Contract Type | Validation Config |
|---|---|
| Business Continuity | `validation/business_continuity_validation.json` |
| SRE Architecture | `validation/sre_architecture_validation.json` |
| Cloud Architecture | `validation/cloud_architecture_validation.json` |
| Data & AI Architecture | `validation/data_ai_architecture_validation.json` |
| Development Architecture | `validation/development_architecture_validation.json` |
| Process Transformation | `validation/process_transformation_validation.json` |
| Security Architecture | `validation/security_architecture_validation.json` |
| Platform & IT Infrastructure | `validation/platform_it_infrastructure_validation.json` |
| Enterprise Architecture | `validation/enterprise_architecture_validation.json` |
| Integration Architecture | `validation/integration_architecture_validation.json` |

**For each generated contract, run these two commands sequentially:**

```bash
# Step 1: Calculate validation score
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/score-calculator-cli.ts \
  "${COMPLIANCE_DOCS_DIR}/[FILENAME]" \
  validation/[CONFIG_FILE]

# Step 2: Update contract with validation results (writes back to same file)
bun skills/architecture-compliance/utils/field-updater-cli.ts \
  "${COMPLIANCE_DOCS_DIR}/[FILENAME]" \
  /tmp/validation_score.json \
  "${COMPLIANCE_DOCS_DIR}/[FILENAME]"
```

**Example** (Cloud Architecture):
```bash
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/score-calculator-cli.ts \
  "${COMPLIANCE_DOCS_DIR}/CLOUD_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md" \
  validation/cloud_architecture_validation.json

bun skills/architecture-compliance/utils/field-updater-cli.ts \
  "${COMPLIANCE_DOCS_DIR}/CLOUD_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md" \
  /tmp/validation_score.json \
  "${COMPLIANCE_DOCS_DIR}/CLOUD_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md"
```

**After each validation pair**, capture the score from `/tmp/validation_score.json` for use in Step 2D.2. The key fields are:
- `final_score` → use as `--score` value
- `outcome.document_status` → use as `--status` value
- `completeness_score` → use as `--completeness` value (multiply by 10 for percentage)

**Error Handling**: If validation fails for a contract, use fallback values: `--score 0 --status "Draft" --completeness 0`.

---

**Step 2D.1: Collect Contract Metadata**

From the 10 completed agents and their validation results (Step 2D.PRE), gather:
- Project name (from ARCHITECTURE.md H1 or first contract filename)
- Generation date (current date YYYY-MM-DD)
- For each successfully generated contract:
  - Contract type (Business Continuity, SRE Architecture, Cloud Architecture, etc.)
  - Generated filename (full filename with .md extension)
  - Score: actual `final_score` from validation (fallback: `0`)
  - Status: actual `outcome.document_status` from validation (fallback: `"Draft"`)
  - Completeness: actual `completeness_score * 10` from validation (fallback: `0`)

**Example Metadata Collection**:
```
Project: "3-Tier-To-Do-List"
Date: "2025-12-27"
Contracts:
  1. Type: "Business Continuity", File: "BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md", Score: 7.2, Status: "In Review", Completeness: 85
  2. Type: "SRE Architecture", File: "SRE_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md", Score: 6.5, Status: "Draft", Completeness: 72
  ... (continue for all generated contracts)
```

---

**Step 2D.2: Execute Manifest Generation Commands**

**CRITICAL**: Execute these commands sequentially (NOT parallel) to prevent file conflicts.

**Use actual validation scores** from Step 2D.PRE. For each contract, use the `final_score`, `outcome.document_status`, and `completeness_score * 10` captured during validation. If validation failed for a contract, fall back to `--score 0 --status "Draft" --completeness 0`.

**FIRST CONTRACT - CREATE MODE**:

Use Bash tool to run:
```bash
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode create \
  --project "[PROJECT_NAME]" \
  --contract-type "[FIRST_CONTRACT_TYPE]" \
  --filename "[FIRST_FILENAME]" \
  --score [ACTUAL_SCORE] \
  --status "[ACTUAL_STATUS]" \
  --completeness [ACTUAL_COMPLETENESS]
```

**Example**:
```bash
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode create \
  --project "3-Tier-To-Do-List" \
  --contract-type "Business Continuity" \
  --filename "BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md" \
  --score 7.2 \
  --status "In Review" \
  --completeness 85
```

**SUBSEQUENT CONTRACTS - UPDATE MODE (Sequential)**:

For each remaining contract (2-10), use Bash tool:
```bash
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode update \
  --project "[PROJECT_NAME]" \
  --contract-type "[CONTRACT_TYPE]" \
  --filename "[FILENAME]" \
  --score [ACTUAL_SCORE] \
  --status "[ACTUAL_STATUS]" \
  --completeness [ACTUAL_COMPLETENESS]
```

**Example** (Contract 2):
```bash
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode update \
  --project "3-Tier-To-Do-List" \
  --contract-type "SRE Architecture" \
  --filename "SRE_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md" \
  --score 6.5 \
  --status "Draft" \
  --completeness 72
```

**Repeat UPDATE mode for all remaining contracts** (Cloud, Data & AI, Development, Process, Security, Platform, Enterprise, Integration).

**IMPORTANT**:
- Use absolute path: `PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"` before each command
- Execute sequentially (not parallel) to prevent file conflicts
- Capture and report any errors immediately
- Do NOT proceed to Step 2D.3 until all contracts are added

---

**Step 2D.3: VERIFY Manifest Creation**

Use Read tool to verify:
```
Read file: /compliance-docs/COMPLIANCE_MANIFEST.md
```

**Expected**: File exists and contains all generated contracts in the table.

**If file does not exist**:
- This is a CRITICAL ERROR - skill has FAILED
- You MUST retry manifest generation (Step 2D.2)
- Do NOT report skill completion
- Report error to user with manifest-generator.ts logs

**If file exists but is incomplete**:
- Count contracts in manifest table
- Compare with number of successful agent generations
- If mismatch, identify missing contracts and add them using UPDATE mode

---

**Step 2D.4: Report Manifest Completion**

Only after COMPLIANCE_MANIFEST.md exists and contains all contracts:

```
✅ Compliance manifest generated successfully

Location: /compliance-docs/COMPLIANCE_MANIFEST.md
Contracts: [N]/[N] included
Framework: [FRAMEWORK from ARCHITECTURE.md]
Generation Date: [DATE]
```

**IMPORTANT**: Do NOT report skill completion before this message is displayed

---

### Example: Complete Validation + Manifest Generation Workflow

**Scenario**: Generated all 10 contracts for "3-Tier-To-Do-List" project on 2025-12-27

**Step 1: Validate each contract** (repeat for all 10):
```bash
# Validate Business Continuity contract
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/score-calculator-cli.ts \
  "${COMPLIANCE_DOCS_DIR}/BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md" \
  validation/business_continuity_validation.json

bun skills/architecture-compliance/utils/field-updater-cli.ts \
  "${COMPLIANCE_DOCS_DIR}/BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md" \
  /tmp/validation_score.json \
  "${COMPLIANCE_DOCS_DIR}/BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md"

# Capture score from /tmp/validation_score.json for manifest
# Repeat for all 10 contracts with their respective validation configs
```

**Step 2: Generate manifest using actual scores from validation**:
```bash
# Contract 1: Business Continuity (CREATE - establishes manifest)
# Use actual scores from Step 2D.PRE validation
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode create \
  --project "3-Tier-To-Do-List" \
  --contract-type "Business Continuity" \
  --filename "BUSINESS_CONTINUITY_3-Tier-To-Do-List_2025-12-27.md" \
  --score [ACTUAL_SCORE] \
  --status "[ACTUAL_STATUS]" \
  --completeness [ACTUAL_COMPLETENESS]

# Contract 2-10: Use UPDATE mode with actual scores from each contract's validation
PLUGIN_DIR=$(find "$HOME" -maxdepth 10 -type d -name "solutions-architect-skills" ! -path "*/node_modules/*" 2>/dev/null | head -1) && cd "$PLUGIN_DIR"
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode update \
  --project "3-Tier-To-Do-List" \
  --contract-type "SRE Architecture" \
  --filename "SRE_ARCHITECTURE_3-Tier-To-Do-List_2025-12-27.md" \
  --score [ACTUAL_SCORE] \
  --status "[ACTUAL_STATUS]" \
  --completeness [ACTUAL_COMPLETENESS]

# ... repeat UPDATE for all remaining contracts (Cloud, Data & AI, Development,
# Process, Security, Platform, Enterprise, Integration) with their actual scores

# Verify manifest was created
# Read /compliance-docs/COMPLIANCE_MANIFEST.md
```

**Expected Result**: COMPLIANCE_MANIFEST.md created with all 10 contracts in the table.

**Contract Type Order**:
1. Business Continuity
2. SRE Architecture
3. Cloud Architecture
4. Data & AI Architecture
5. Development Architecture
6. Process Transformation
7. Security Architecture
8. Platform & IT Infrastructure
9. Enterprise Architecture
10. Integration Architecture

---

**Step 2C.6: Report Failures (If Any)**

```
IF failed_agents.length > 0:
  Display:
  ═══════════════════════════════════════════════
  ⚠️  Partial Generation Failures
  ═══════════════════════════════════════════════

  [N] out of [TOTAL] contracts failed to generate.
  Successful contracts have been written to /compliance-docs/

  Failed Contracts:
  [For each failed_agent:]
    - [contract_type]: [error_message]

  Recovery Options:
  1. Fix ARCHITECTURE.md missing sections/errors
  2. Regenerate failed contracts individually:
     /solutions-architect-skills:architecture-compliance [contract_type]
     /solutions-architect-skills:architecture-compliance [contract_type]
     ...

  ═══════════════════════════════════════════════
```

**Example:**
```
═══════════════════════════════════════════════
⚠️  Partial Generation Failures
═══════════════════════════════════════════════

2 out of 10 contracts failed to generate.
Successful contracts have been written to /compliance-docs/

Failed Contracts:
  - sre_architecture: Missing Section 10.1 (Monitoring and Observability)
  - integration: Missing Section 5.2 (Integration Patterns)

Recovery Options:
1. Fix ARCHITECTURE.md missing sections/errors
2. Regenerate failed contracts individually:
   /solutions-architect-skills:architecture-compliance sre_architecture
   /solutions-architect-skills:architecture-compliance integration

═══════════════════════════════════════════════
```

---

**Step 2C.7: Generate Summary Report**

Display comprehensive summary of parallel agent generation:

```
═══════════════════════════════════════════════════════════════
Compliance Contract Generation Summary (Parallel Agent Mode)
═══════════════════════════════════════════════════════════════

Status: [N_SUCCESS]/[TOTAL] successful, [N_FAILED] failed
Performance: [N] parallel agents, ~3-5 min total (10× speedup vs sequential)
Output: /compliance-docs/

Generated Contracts:
[For each successful_agent:]
✅ [Display Name]
[For each failed_agent:]
❌ [Display Name] (Failed - [Error Summary])

Next Steps:
- Review contracts in /compliance-docs/
- Check COMPLIANCE_MANIFEST.md for full audit trail
[IF failures:]
- Fix ARCHITECTURE.md missing sections
- Regenerate failed contracts individually (see commands above)

═══════════════════════════════════════════════════════════════
```

**Example (Partial Success - 8/10):**
```
═══════════════════════════════════════════════════════════════
Compliance Contract Generation Summary (Parallel Agent Mode)
═══════════════════════════════════════════════════════════════

Status: 8/10 successful, 2 failed
Performance: 10 parallel agents, ~4 min total (10× speedup vs sequential)
Output: /compliance-docs/

Generated Contracts:
✅ Business Continuity
✅ Cloud Architecture
✅ Data & AI Architecture
✅ Development Architecture
✅ Process Transformation
✅ Security Architecture
✅ Platform & IT Infrastructure
✅ Enterprise Architecture
❌ SRE Architecture (Failed - Missing Section 10.1)
❌ Integration Architecture (Failed - Missing Section 5.2)

Next Steps:
- Review contracts in /compliance-docs/
- Check COMPLIANCE_MANIFEST.md for full audit trail
- Fix ARCHITECTURE.md missing sections
- Regenerate failed contracts individually (see commands above)

═══════════════════════════════════════════════════════════════
```

**Example (Complete Success - 10/10):**
```
═══════════════════════════════════════════════════════════════
Compliance Contract Generation Summary (Parallel Agent Mode)
═══════════════════════════════════════════════════════════════

Status: 10/10 successful, 0 failed
Performance: 10 parallel agents, ~3.5 min total (10× speedup vs sequential)
Output: /compliance-docs/

Generated Contracts:
✅ Business Continuity
✅ SRE Architecture
✅ Cloud Architecture
✅ Data & AI Architecture
✅ Development Architecture
✅ Process Transformation
✅ Security Architecture
✅ Platform & IT Infrastructure
✅ Enterprise Architecture
✅ Integration Architecture

Next Steps:
- Review contracts in /compliance-docs/
- Check COMPLIANCE_MANIFEST.md for full audit trail

═══════════════════════════════════════════════════════════════
```

---

**MANDATORY Completion Criteria (BLOCKING):**

Before reporting skill completion, you MUST verify:

- [ ] All requested .md contract files exist in /compliance-docs/
- [ ] COMPLIANCE_MANIFEST.md exists in /compliance-docs/
- [ ] COMPLIANCE_MANIFEST.md contains all successfully generated contracts in the table
- [ ] Manifest shows correct project name and generation date
- [ ] No manifest-generator.ts errors occurred during PHASE 2D
- [ ] Manifest completion message displayed (Step 2D.4)

**CRITICAL**: If ANY item is unchecked, the skill has FAILED. You MUST fix before reporting completion.

**Recovery Steps if Manifest is Missing or Incomplete**:

1. Re-execute PHASE 2D manually:
   - Collect contract metadata from agent outputs (Step 2D.1)
   - Execute manifest-generator.ts commands sequentially (Step 2D.2)
   - Verify manifest exists and is complete (Step 2D.3)
   - Report manifest completion (Step 2D.4)
2. If errors persist, report failure to user with error details
3. Do NOT report skill completion until manifest exists and is verified

---

**EXIT Phase 2C** - Parallel agent generation complete.

---

### Phase 2 Bulk: Parallel Data Loading (Non-Batched)

**NOTE**: This workflow is used when selected_contracts.length <= 3 (no batching needed).
**For 4+ contracts, batching is automatically enabled (see Step 2B.0 above).**

This phase loads all templates and ARCHITECTURE.md sections in parallel to minimize I/O overhead.

**Step 2B.1: Load Shared Context (Once)**

Execute the following operations in parallel:

1. **Load ARCHITECTURE.md Document Index** (lines 1-50)
   ```
   - Extract project name from Document Index
   - Identify section boundaries (line ranges for sections 1-12)
   - Cache as: document_index = { project_name, section_boundaries }
   ```

2. **Validate output directory**
   ```
   - Check /compliance-docs/ exists relative to ARCHITECTURE.md
   - Create directory if needed using Bash: mkdir -p /compliance-docs
   - Get current date for filename generation: YYYY-MM-DD format
   ```

**Step 2B.2: Parallel Template Loading**

For each contract in validated_contracts, execute Read tool calls in parallel:

**Example for 3 contracts** (SRE, Cloud, Security):
```
Read skills/architecture-compliance/templates/TEMPLATE_SRE_ARCHITECTURE.md
Read skills/architecture-compliance/templates/TEMPLATE_CLOUD_ARCHITECTURE.md
Read skills/architecture-compliance/templates/TEMPLATE_SECURITY_ARCHITECTURE.md
```

Cache results as: `templates[contract_type] = template_content`

**Step 2B.3: Parallel Include Resolution**

For each loaded template, resolve `@include-with-config` directives in parallel:

**Use resolve-includes.ts utility** (see skills/architecture-compliance/utils/resolve-includes.ts):

```bash
# Parallel Bash tool calls (one per contract)
bun skills/architecture-compliance/utils/resolve-includes.ts \
  skills/architecture-compliance/templates/TEMPLATE_SRE_ARCHITECTURE.md \
  /tmp/expanded_sre.md

bun skills/architecture-compliance/utils/resolve-includes.ts \
  skills/architecture-compliance/templates/TEMPLATE_CLOUD_ARCHITECTURE.md \
  /tmp/expanded_cloud.md

bun skills/architecture-compliance/utils/resolve-includes.ts \
  skills/architecture-compliance/templates/TEMPLATE_SECURITY_ARCHITECTURE.md \
  /tmp/expanded_security.md
```

Then read expanded templates back in parallel:
```
Read /tmp/expanded_sre.md
Read /tmp/expanded_cloud.md
Read /tmp/expanded_security.md
```

Cache results as: `expanded_templates[contract_type] = expanded_content`

**Step 2B.4: Parallel Section Extraction**

For each contract, determine required sections from SECTION_MAPPING_GUIDE.md (see lines 1344+):

**Section Requirements per Contract:**
- Business Continuity: Section 11
- SRE Architecture: Sections 10, 11
- Cloud Architecture: Sections 4, 8, 11
- Data & AI: Sections 3, 5, 6
- Development: Sections 3, 5, 8, 12
- Process Transformation: Sections 5, 8
- Security: Section 9
- Platform & IT: Sections 4, 8, 10, 11
- Enterprise: Sections 1, 2, 3, 4
- Integration: Section 7

**Identify unique sections needed across ALL validated_contracts:**
```
unique_sections = set()
for contract in validated_contracts:
  unique_sections.add(contract.required_sections)

Example: If generating SRE (10,11), Cloud (4,8,11), Security (9)
  → unique_sections = [4, 8, 9, 10, 11] (5 unique sections)
```

**Load all unique sections in parallel using section_boundaries from Step 2B.1:**

```
# Example: Load sections 4, 8, 9, 10, 11 in parallel
Read ARCHITECTURE.md lines [section_4_start]:[section_4_end+10]  # ±10 buffer
Read ARCHITECTURE.md lines [section_8_start]:[section_8_end+10]
Read ARCHITECTURE.md lines [section_9_start]:[section_9_end+10]
Read ARCHITECTURE.md lines [section_10_start]:[section_10_end+10]
Read ARCHITECTURE.md lines [section_11_start]:[section_11_end+10]
```

Cache results as: `sections[section_number] = section_content`

**Context Efficiency:**
- Each section loaded ONCE, shared across all contracts that need it
- Total loaded (worst case all 10 contracts): Document Index (50 lines) + 10 templates (~500KB) + 12 sections (~100KB) = ~602KB

**Fallback for Context Limits:**
- If context approaching limits, use batched loading:
  - Batch 1: Contracts 1-5 (load templates + sections, generate, output) ~325KB
  - Batch 2: Contracts 6-10 (load templates + sections, generate, output) ~325KB

---

## BATCHED WORKFLOW (4+ Contracts)

**This section describes processing ONE batch of contracts (used when batching is enabled).**

### Phase 2B-Batched: Single Batch Processing

**Input:**
- `batch_contracts`: Array of 1-3 contract types for this batch
- `batch_num`: Current batch number (1-based)
- `manifest_mode`: 'create' for first batch, 'update' for subsequent

**Step 2B.1-Batched: Load Shared Context for Batch**

Execute in parallel:

1. **Load ARCHITECTURE.md Document Index** (lines 1-50)
   ```
   - Extract project name
   - Identify section boundaries
   - Cache as: document_index = { project_name, section_boundaries }
   ```

2. **Validate output directory** (only if batch_num == 1)
   ```
   - Check /compliance-docs/ exists
   - Create if needed: mkdir -p /compliance-docs
   - Get current date: YYYY-MM-DD format
   ```

**Step 2B.2-Batched: Parallel Template Loading (Batch Only)**

For each contract in `batch_contracts`, execute Read in parallel:

```
# Example Batch 1 (3 contracts)
Read skills/architecture-compliance/templates/TEMPLATE_BUSINESS_CONTINUITY.md
Read skills/architecture-compliance/templates/TEMPLATE_SRE_ARCHITECTURE.md
Read skills/architecture-compliance/templates/TEMPLATE_CLOUD_ARCHITECTURE.md
```

Cache: `batch_templates[contract_type] = template_content`

**Context Usage**: ~85 KB for 3 templates (vs ~556 KB for all 10)

**Step 2B.3-Batched: Parallel Include Resolution (Batch Only)**

For each template in batch, resolve @include directives in parallel:

```bash
bun skills/architecture-compliance/utils/resolve-includes.ts \
  templates/TEMPLATE_BUSINESS_CONTINUITY.md /tmp/expanded_bc.md &

bun skills/architecture-compliance/utils/resolve-includes.ts \
  templates/TEMPLATE_SRE_ARCHITECTURE.md /tmp/expanded_sre.md &

bun skills/architecture-compliance/utils/resolve-includes.ts \
  templates/TEMPLATE_CLOUD_ARCHITECTURE.md /tmp/expanded_cloud.md &

wait
```

Then read expanded templates in parallel:
```
Read /tmp/expanded_bc.md
Read /tmp/expanded_sre.md
Read /tmp/expanded_cloud.md
```

Cache: `batch_expanded_templates[contract_type] = expanded_content`

**Step 2B.4-Batched: Parallel Section Extraction (Batch Only)**

Determine unique sections needed for this batch:

```
# Example Batch 1:
# - Business Continuity: Section 11
# - SRE Architecture: Sections 10, 11
# - Cloud Architecture: Sections 4, 8, 11
# Unique sections: [4, 8, 10, 11] (4 sections instead of all 12)
```

Load unique sections in parallel from ARCHITECTURE.md with ±10 line buffer.

Cache: `batch_sections[section_number] = section_content`

**Context Efficiency**:
- Batch 1-3 (3 contracts each): ~85 KB templates + 40 KB sections = ~125 KB
- Batch 4 (1 contract): ~30 KB templates + 10 KB sections = ~40 KB

---

### Phase 3B-Batched: Sequential Generation (Batch Only)

**Step 3B.1-Batched: For Each Contract in Batch**

Process each contract in `batch_contracts` using cached data only (no additional I/O):

```
for contract_type in batch_contracts:
    template = batch_expanded_templates[contract_type]
    required_sections = get_required_sections_from_mapping(contract_type)

    # Extract data from cached sections
    extracted_data = extract_from_sections(batch_sections, required_sections)

    # Apply data to template
    generated = apply_data_to_template(template, extracted_data, document_index)

    # Cache generated contract
    batch_generated_contracts[contract_type] = {
        'content': generated,
        'filename': f"{contract_type.upper()}_{project_name}_{date}.md"
    }
```

**Performance**: ~1-2 seconds per contract (in-memory processing)

**Step 3B.2-Batched**: Apply placeholders (same as existing Step 3B.2)
- Replace `[PROJECT_NAME]`, `[GENERATION_DATE]`, etc.
- Expand conditional placeholders
- Populate Document Control table
- Calculate Compliance Summary

**Step 3B.3-Batched**: Cache generated contracts

---

### Phase 4B-Batched: Batch Validation & Output

**Step 4B.1-Batched: Batch Validation**

Use `validateMultipleContracts()` from generation-helper.ts:

```typescript
import { validateMultipleContracts } from './utils/generation-helper';

const validation_inputs = Object.entries(batch_generated_contracts).map(
  ([contract_type, contract_data]) => ({
    content: contract_data.content,
    contractType: contract_type
  })
);

const validation_results = await validateMultipleContracts(validation_inputs);
```

**Step 4B.2-Batched: Parallel Output**

Write contracts that passed validation in parallel:

```
# Parallel Write calls
Write /compliance-docs/BUSINESS_CONTINUITY_Project_2025-12-26.md
Write /compliance-docs/SRE_ARCHITECTURE_Project_2025-12-26.md
Write /compliance-docs/CLOUD_ARCHITECTURE_Project_2025-12-26.md
```

**Step 4B.3-Batched: Sequential Manifest Updates**

**CRITICAL**: First contract in Batch 1 uses `create`, all others use `update`:

```bash
# First contract (Batch 1, Contract 1 only)
if batch_num == 1 and contract_index == 0:
    bun utils/manifest-generator.ts --mode create \
      --project "[PROJECT]" --contract-type "[TYPE]" \
      --filename "[FILE]" --score [SCORE] \
      --status "[STATUS]" --completeness [COMP]
else:
    # All other contracts
    bun utils/manifest-generator.ts --mode update \
      --project "[PROJECT]" --contract-type "[TYPE]" \
      --filename "[FILE]" --score [SCORE] \
      --status "[STATUS]" --completeness [COMP]
```

---

### Phase 5B-Batched: Aggregated Summary Report

**Step 5B.1-Batched: Aggregate Results Across All Batches**

```
total_successful = len(batch_results['successful_contracts'])
total_failed = len(batch_results['failed_contracts'])
all_validations = batch_results['validation_results']

avg_score = mean([v.finalScore for v in all_validations if v.isValid])
avg_completeness = mean([v.completeness for v in all_validations if v.isValid])

# Count by status
auto_approved = count([v for v in all_validations if v.finalScore >= 8.0])
needs_review = count([v for v in all_validations if 7.0 <= v.finalScore < 8.0])
```

**Step 5B.2-Batched: Generate Summary Report**

Display formatted output with batching statistics:

```
═══════════════════════════════════════════════════════════════
Compliance Contract Generation Summary (Batched Mode)
═══════════════════════════════════════════════════════════════

Generated Contracts: [successful]/[total_requested]
Batches Processed: [num_batches]

✅ Successful: ([successful] contracts)
- Business Continuity: BUSINESS_CONTINUITY_Project_2025-12-26.md
  Score: 7.2/10 | Status: In Review | Completeness: 72% | Batch: 1

- SRE Architecture: SRE_ARCHITECTURE_Project_2025-12-26.md
  Score: 8.7/10 | Status: Approved | Completeness: 89% | Batch: 1

[... all successful contracts grouped by batch ...]

───────────────────────────────────────────────────────────────
Overall Statistics
───────────────────────────────────────────────────────────────
• Average Score: [avg_score]/10
• Average Completeness: [avg_completeness]%
• Auto-Approved (≥8.0): [count]
• Needs Review (7.0-7.9): [count]
• Needs Work (5.0-6.9): [count]

───────────────────────────────────────────────────────────────
Batching Performance
───────────────────────────────────────────────────────────────
• Total Batches: [num_batches]
• Contracts per Batch: 3 (last may have fewer)
• Est. Context per Batch: ~167 KB avg
• Context Savings: ~70% vs parallel (556 KB → 167 KB/batch)

───────────────────────────────────────────────────────────────
Output
───────────────────────────────────────────────────────────────
All contracts saved to: /compliance-docs/
Manifest updated: /compliance-docs/COMPLIANCE_MANIFEST.md

Next Steps:
1. Review contracts with "Needs Review" status
2. Complete missing data for "Needs Work" contracts
3. Re-generate individual contracts if needed
```

---

### Phase 3 Bulk: Sequential Generation

**NOTE**: This workflow is used when selected_contracts.length <= 3 (no batching).
**For 4+ contracts, see Phase 3B-Batched (automatic batching enabled).**

This phase processes each contract sequentially using cached data (no I/O overhead).

**Step 3B.1: For Each Contract in validated_contracts**

Loop through each contract type:

```
for contract_type in validated_contracts:
  # All data already loaded in Phase 2 Bulk - no tool calls needed

  template = expanded_templates[contract_type]
  required_sections = get_required_sections(contract_type)  # From SECTION_MAPPING_GUIDE.md

  # Extract data from cached sections
  extracted_data = {}
  for section_num in required_sections:
    section_content = sections[section_num]
    extracted_data[section_num] = extract_data(section_content, contract_type)

  # Generate contract (in-memory, fast)
  generated_contract = apply_data_to_template(
    template=template,
    data=extracted_data,
    project_name=document_index.project_name,
    generation_date=current_date
  )

  # Cache for validation
  generated_contracts[contract_type] = generated_contract
```

**Step 3B.2: Apply Placeholders**

For each contract, follow existing Phase 4, Step 4.2 logic (lines 698-889):

1. **Replace standard placeholders:**
   - `[PROJECT_NAME]` → from document_index.project_name
   - `[GENERATION_DATE]` → current_date
   - `[CONTRACT_TYPE]` → contract type name
   - `[DOCUMENT_VERSION]` → "1.0" (initial generation)

2. **Expand conditional placeholders** (lines 820-889):
   - Pattern: `[If Compliant: X. If Non-Compliant: Y. If Not Applicable: Z. If Unknown: W]`
   - Expand to match the Status value for each requirement

3. **Populate Document Control table** (lines 784-817):
   - Document ID, Version, Status, Classification, etc.

4. **Calculate Compliance Summary** (lines 963-1088):
   - 6-column format: Code | Requirement | Category | Status | Source Section | Responsible Role
   - Status values: "Compliant", "Non-Compliant", "Not Applicable", "Unknown"

5. **Format derived values** (lines 1090-1095):
   - Compliance scores, completeness percentages

**Step 3B.3: Cache Generated Contracts**

Store all generated contracts in memory for batch validation:

```
generated_contracts = {
  'sre_architecture': {
    content: generated_content,
    filename: 'SRE_ARCHITECTURE_Project_2025-12-26.md',
    metadata: { score, status, completeness }
  },
  'cloud_architecture': {
    content: generated_content,
    filename: 'CLOUD_ARCHITECTURE_Project_2025-12-26.md',
    metadata: { score, status, completeness }
  },
  ...
}
```

**Performance**: This phase is fast (~1-2 seconds per contract) because all data is cached.

---

### Phase 4 Bulk: Batch Validation & Output

**NOTE**: This workflow is used when selected_contracts.length <= 3 (no batching).
**For 4+ contracts, see Phase 4B-Batched (automatic batching enabled).**

**Step 4B.1: Batch Validation (Use Existing Utility)**

Use the existing `validateMultipleContracts()` function from generation-helper.ts (lines 192-203):

```typescript
import { validateMultipleContracts } from './utils/generation-helper';

const validation_inputs = Object.entries(generated_contracts).map(
  ([contract_type, contract_data]) => ({
    content: contract_data.content,
    contractType: contract_type
  })
);

const validation_results = await validateMultipleContracts(validation_inputs);
```

**Process Validation Results:**

```
successful_contracts = []
failed_contracts = []

for result in validation_results:
  if result.isValid:
    mark_for_output(result.contractType)
    successful_contracts.push(result)
  else:
    log_error(result.contractType, result.errorReport)
    failed_contracts.push(result)

    # Graceful degradation: generate anyway as "Draft"
    if result.validationResult.finalScore >= 3.0:
      mark_for_output_as_draft(result.contractType)
      successful_contracts.push(result)  # Include in output
```

**Step 4B.2: Parallel Output (Write Contracts)**

For all contracts that passed validation (or marked as Draft), write in parallel:

```
# Parallel Write Tool Calls
Write /compliance-docs/SRE_ARCHITECTURE_Project_2025-12-26.md
Write /compliance-docs/CLOUD_ARCHITECTURE_Project_2025-12-26.md
Write /compliance-docs/SECURITY_ARCHITECTURE_Project_2025-12-26.md
... (for all successful contracts)
```

**Step 4B.3: Sequential Manifest Updates**

Use manifest-generator.ts to create or update COMPLIANCE_MANIFEST.md:

**First contract: create manifest**
```bash
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode create \
  --project "[PROJECT_NAME]" \
  --contract-type "SRE Architecture" \
  --filename "SRE_ARCHITECTURE_Project_2025-12-26.md" \
  --score 8.7 \
  --status "Approved" \
  --completeness 89
```

**Subsequent contracts: update manifest (sequential, fast)**
```bash
bun skills/architecture-compliance/utils/manifest-generator.ts \
  --mode update \
  --project "[PROJECT_NAME]" \
  --contract-type "Cloud Architecture" \
  --filename "CLOUD_ARCHITECTURE_Project_2025-12-26.md" \
  --score 7.8 \
  --status "In Review" \
  --completeness 78

# ... (repeat for all successful contracts)
```

**Note**: Manifest updates are sequential to prevent concurrent write conflicts.
This is fast (~100ms per update) and ensures data integrity.

---

### Phase 5 Bulk: Summary Report

**NOTE**: This workflow is used when selected_contracts.length <= 3 (no batching).
**For 4+ contracts, see Phase 5B-Batched (automatic batching enabled).**

**Step 5B.1: Aggregate Results**

Collect statistics from validation_results:

```
successful_count = len(successful_contracts)
failed_count = len(failed_contracts)
total_requested = len(validated_contracts)

avg_score = mean([r.validationResult.finalScore for r in successful_contracts])
avg_completeness = mean([r.completeness for r in successful_contracts])

# Status breakdown
auto_approved = [r for r in successful_contracts if r.validationResult.finalScore >= 8.0]
needs_review = [r for r in successful_contracts if 7.0 <= r.validationResult.finalScore < 8.0]
needs_work = [r for r in successful_contracts if 5.0 <= r.validationResult.finalScore < 7.0]
rejected = [r for r in successful_contracts if r.validationResult.finalScore < 5.0]
```

**Step 5B.2: Generate Summary Report**

Output formatted summary to user:

```
═══════════════════════════════════════════════════════════════
Compliance Contract Generation Summary
═══════════════════════════════════════════════════════════════

Generated Contracts: [successful_count]/[total_requested]

✅ Successful: ([successful_count] contracts)
- SRE Architecture: SRE_ARCHITECTURE_Project_2025-12-26.md
  Score: 8.7/10 | Status: Approved | Completeness: 89%

- Cloud Architecture: CLOUD_ARCHITECTURE_Project_2025-12-26.md
  Score: 7.8/10 | Status: In Review | Completeness: 78%

- Security Architecture: SECURITY_ARCHITECTURE_Project_2025-12-26.md
  Score: 9.2/10 | Status: Approved | Completeness: 92%

[... list all successful contracts with scores, status, completeness ...]

❌ Failed: ([failed_count] contracts)
[Only if failures occurred]
- Integration Architecture: Validation failed (score 4.2/10)
  Reason: Missing required data in ARCHITECTURE.md Section 7
  Missing Data:
    • Integration catalog (Section 7.1)
    • API standards (Section 7.2)
    • Async patterns (Section 7.3)

  Recovery Steps:
  1. Add Section 7 to ARCHITECTURE.md with integration details
  2. Regenerate: /skill architecture-compliance Integration

  Reference: SKILL.md lines 1400+ (Integration Architecture requirements)

───────────────────────────────────────────────────────────────
Overall Statistics
───────────────────────────────────────────────────────────────
• Average Score: [avg_score]/10
• Average Completeness: [avg_completeness]%
• Auto-Approved (≥8.0): [count] contracts
• Needs Review (7.0-7.9): [count] contracts
• Needs Work (5.0-6.9): [count] contracts
• Rejected (<5.0): [count] contracts

───────────────────────────────────────────────────────────────
Output
───────────────────────────────────────────────────────────────
All contracts saved to: /compliance-docs/
Manifest updated: /compliance-docs/COMPLIANCE_MANIFEST.md

═══════════════════════════════════════════════════════════════
Next Steps
═══════════════════════════════════════════════════════════════
1. Review contracts in /compliance-docs/
2. Complete placeholders in contracts with score < 8.0:
   [List specific contracts and what needs completion]
3. Update ARCHITECTURE.md for failed contracts:
   [List specific sections and data points to add]
4. Regenerate improved contracts: /skill architecture-compliance [CONTRACT_TYPE]
5. See COMPLIANCE_MANIFEST.md for detailed tracking
```

**Step 5B.3: Error Handling & Recovery**

For each failed contract, provide specific recovery instructions:

```
Failed Contract: [CONTRACT_TYPE]
├─ Error: [SPECIFIC_ERROR_MESSAGE]
├─ Root Cause: [MISSING_SECTION | VALIDATION_FAILURE | TEMPLATE_NOT_FOUND]
├─ Missing Data Points:
│  • [DATA_POINT_1] (should be in Section [X])
│  • [DATA_POINT_2] (should be in Section [Y])
│  • [DATA_POINT_3] (should be in Section [Z])
├─ Recommended Actions:
│  1. Update ARCHITECTURE.md Section [X]: Add [SPECIFIC_DATA]
│  2. Update ARCHITECTURE.md Section [Y]: Add [SPECIFIC_DATA]
│  3. Regenerate contract: /skill architecture-compliance [CONTRACT_TYPE]
└─ Reference: SECTION_MAPPING_GUIDE.md for [CONTRACT_TYPE] requirements
```

**Idempotent Regeneration**:
- User can regenerate failed contracts individually using existing single-contract workflow
- Existing successful contracts are preserved (not regenerated)
- Manifest tracks latest version per contract type (updates existing entry)
- Files are REPLACED when regenerating (Write tool overwrites)

---

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
