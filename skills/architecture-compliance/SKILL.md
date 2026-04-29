---
name: architecture-compliance
description: Generate Compliance Contracts (Contratos de Adherencia) from ARCHITECTURE.md files
triggers:
  - compliance contracts
  - generate compliance
  - contratos de adherencia
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
- `/skill architecture-compliance eco all` (model preset first, contract selector second)
- `/skill architecture-compliance balanced SRE,Security` (balanced preset on a subset)
- `/skill architecture-compliance critical-opus all` (Opus retained only for high-stakes validators)
- `/skill architecture-compliance max all` (legacy — Opus for all, most expensive)

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
**RTO**: 4 hours documented in S11 (docs/09-operational-considerations.md)
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

### v2.3.0 - Model Preset Selection (2026-04-18)

**Summary**: Introduced four model presets (`eco`, `balanced`, `critical-opus`, `max`) so users can trade cost against reasoning depth when spawning validator and generator sub-agents. Agent frontmatter remains unchanged (Opus fallback); the skill orchestrator now passes `model:` per Task() call using a resolver keyed on `(contract_type, role, preset)`.

**Changes:**

1. **New Activation Arguments**
   - `/skill architecture-compliance <preset> [selector]` — preset keyword parsed as the first token in Phase 1 Step 1.1
   - Supported presets: `eco`, `balanced` (default), `critical-opus`, `max`

2. **New Step 1.5: Determine Model Preset**
   - Added AskUserQuestion flow when preset not supplied inline
   - Declined / dismissed answers fall back to `balanced`

3. **Per-Validator Model Matrix**
   - `critical-opus` retains Opus only for Security / SRE / Data & AI / Development validators (reasoning-nuance or WebSearch synthesis)
   - All other validators drop to Haiku under `critical-opus`, Sonnet under `balanced`, Haiku under `eco`
   - Generator runs on Sonnet for every preset except `max`

4. **Phase 3 Task() Calls**
   - Step 3.3 (validators) and Step 3.4 (generator) now include an explicit `model:` parameter
   - Single-contract and all-10-parallel examples updated to show the parameter

**Impact:**
- **~90% savings** on full runs with `eco`, **~75%** with `balanced`, **~60%** with `critical-opus` (relative to all-Opus baseline)
- **No frontmatter churn** — the 11 agent files under `agents/` are untouched; the override is purely orchestration-level
- **Reversible** — users can still run `max` for the prior behavior

**Files Modified:**
- `/skills/architecture-compliance/SKILL.md`

---

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

## Model Preset Selection

Compliance generation spawns up to 20 sub-agents per full run (10 validators + 10 generators). Running every agent on Opus is expensive and usually unnecessary — validators perform mechanical pattern-match classification (Read + Grep → PASS/FAIL/N/A/UNKNOWN), which smaller models handle reliably.

The skill exposes four presets. Each Task() call passes the preset-selected model as the `model:` parameter, overriding the agent's frontmatter default.

### Presets

| Preset | Validators | Generator | Relative cost vs. `max` |
|--------|-----------|-----------|------------------------|
| `eco` | Haiku × 10 | Sonnet | ~10% |
| `balanced` (default) | Sonnet × 10 | Sonnet | ~25% |
| `critical-opus` | Opus for Security / SRE / Data-AI / Development; Haiku for the other 6 | Sonnet | ~40% |
| `max` | Opus × 10 | Opus | 100% (legacy) |

### Per-Validator Model Matrix

The `critical-opus` column is the only preset that varies per validator. The four validators that stay on Opus are the ones where reasoning nuance materially affects the outcome (security-posture wording, SLO/error-budget math, PII classification, EOL date synthesis via WebSearch).

| Contract | Validator | `eco` | `balanced` | `critical-opus` | `max` |
|----------|-----------|-------|------------|-----------------|-------|
| Business Continuity | Aegis | haiku | sonnet | haiku | opus |
| SRE Architecture | Prometheus | haiku | sonnet | **opus** | opus |
| Cloud Architecture | Atlas | haiku | sonnet | haiku | opus |
| Data & AI Architecture | Mnemosyne | haiku | sonnet | **opus** | opus |
| Development Architecture | Hephaestus | haiku | sonnet | **opus** | opus |
| Process Transformation | Hermes | haiku | sonnet | haiku | opus |
| Security Architecture | Argus | haiku | sonnet | **opus** | opus |
| Platform & IT Infrastructure | Vulcan | haiku | sonnet | haiku | opus |
| Enterprise Architecture | Athena | haiku | sonnet | haiku | opus |
| Integration Architecture | Iris | haiku | sonnet | haiku | opus |
| Generator (all 10 contract types) | compliance-generator | sonnet | sonnet | sonnet | opus |

### Tradeoffs

- `eco` — Haiku occasionally miscategorizes edge-case wording (UNKNOWN vs. FAIL); worst case is one or two items off per 15-item contract. Safe for internal drafts or repeated iteration runs.
- `balanced` — recommended default. Sonnet matches Opus on the structured classification workload at ~4–5× lower cost.
- `critical-opus` — pick when audit evidence quality on security / reliability / data / stack-currency is non-negotiable (regulated industries, pre-release review).
- `max` — prior behavior; keep only when you need maximum reasoning and cost is not a constraint.

Preset resolution order: CLI argument > AskUserQuestion prompt > `balanced` default. See Step 1.5 for runtime resolution.

---

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
[CC-NNN-contract-type]_[PROJECT_NAME]_[DATE].md
```

**Examples:**
- `CC-010-sre-architecture_JobScheduler_2025-11-26.md`
- `CC-001-business-continuity_PaymentGateway_2025-11-26.md`
- `CC-004-development-architecture_JobScheduler_2025-11-26.md`

**Regeneration Behavior:**
- Before generating, old contracts for the selected types are deleted (Step 3.2.1)
- Each generation produces a fresh file with today's date
- The post-generation pipeline (Phase 4) also removes any superseded contracts as a safety net
- To preserve old versions, use git for version control of generated contracts

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
2. Check for preset keyword as the FIRST token (eco | balanced | critical-opus | max)
   - If found → model_preset = matched value; strip the token; continue parsing the remainder
   - If not found → model_preset = UNRESOLVED (handled in Step 1.5)
3. Check for "all" keyword (in patterns like "all compliance", "all my", "all contracts")
   - If found → selected_contracts = ALL_10_CONTRACT_TYPES
4. Check for delimiter patterns (comma, "and", "or")
   - If found → split input, parse each token as contract name
   - Use alias matching for each token (see lines 173-188)
   - selected_contracts = [matched contract types]
5. Otherwise → single contract mode
   - Use exact or fuzzy matching (existing logic, lines 410-431)
   - selected_contracts = [single contract type]

Output:
- selected_contracts = array of 1-10 contract types
- model_preset = one of {eco, balanced, critical-opus, max, UNRESOLVED}
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

**Step 1.5: Determine Model Preset**

If `model_preset == UNRESOLVED` from Step 1.1, ask the user before spawning agents. Use AskUserQuestion with the following prompt:

```
AskUserQuestion:
  question: "Compliance generation can spawn up to 20 sub-agents. Pick a model preset to control cost vs. depth:"
  multiSelect: false
  options:
    - label: "Balanced (Sonnet, ~75% cheaper than Opus)"
      description: "Sonnet for all validators and generator. Recommended default — matches Opus on structured classification."
    - label: "Eco (Haiku validators, ~90% cheaper)"
      description: "Maximum savings. Haiku may miscategorize edge-case wording (UNKNOWN vs. FAIL). Safe for drafts."
    - label: "Critical-Opus (Opus only for Security/SRE/Data-AI/Dev, ~60% cheaper)"
      description: "Retains Opus on the four validators where reasoning nuance materially affects audit evidence. Haiku elsewhere."
    - label: "Max (Opus everywhere, legacy)"
      description: "Prior behavior. Most expensive. Pick only when cost is not a constraint."
```

Map the selected label to the preset id (`balanced`, `eco`, `critical-opus`, `max`). If the user declines to answer, default to `balanced`.

Store the resolved preset as `model_preset` for use in Phase 3.

**Model resolution helper** (referenced by Step 3.3 and 3.4):

```
function resolve_model(contract_type, role, model_preset):
  if model_preset == "max":
    return "opus"
  if role == "generator":
    return "sonnet"                          # sonnet for all presets except max
  if model_preset == "balanced":
    return "sonnet"
  if model_preset == "eco":
    return "haiku"
  if model_preset == "critical-opus":
    if contract_type in {"security", "sre", "data-ai", "development"}:
      return "opus"
    return "haiku"
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
   - Validate template exists: templates/cc-NNN-contract-type.template.md
   - Validate validation config exists: validation/cc-NNN-contract-type-template-validation.json
2. If any templates missing:
   - Warn user: "Template not found for [CC-NNN-contract-type]"
   - Offer options:
     a) Skip missing contracts, generate remaining ones
     b) Cancel entire operation
3. Output: validated_contracts = [contracts with templates available]
```

### Phase 3: Agent Invocation

**Step 3.1: Resolve Plugin Directory**

**Step A — Try Glob (dev mode / running from within the plugin directory):**
```
Glob pattern: **/skills/architecture-compliance/SKILL.md
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

**Step 3.2.1: Clean Up Old Contracts**

Before generating new contracts, remove existing contracts for the selected types to prevent stale dated files from accumulating:

```bash
# For each selected contract type, delete any existing files matching the prefix
# Example: rm compliance-docs/CC-001-business-continuity_*.md
for prefix in [selected contract prefixes]:
    rm -f compliance_docs_dir/PREFIX_*.md
```

Only delete prefixes for the contract types being generated (from `selected_contracts`). Use the contract type → filename prefix mapping:

| Contract Type | Filename Prefix |
|---------------|----------------|
| business-continuity | `CC-001-business-continuity` |
| cloud | `CC-002-cloud-architecture` |
| data-ai | `CC-003-data-ai-architecture` |
| development | `CC-004-development-architecture` |
| enterprise | `CC-005-enterprise-architecture` |
| integration | `CC-006-integration-architecture` |
| platform | `CC-007-platform-it-infrastructure` |
| process | `CC-008-process-transformation` |
| security | `CC-009-security-architecture` |
| sre | `CC-010-sre-architecture` |

Run all deletions in a single `rm -f` command. If `compliance-docs/` does not exist yet, skip this step.

**Step 3.2.5: Per-contract explorer findings fan-out (v3.16.0+)**

Spawn `sa-skills:architecture-explorer` once per selected contract, in **parallel batches of 4**. Each call runs the explorer in FINDINGS mode, scoped to that contract's domain vocabulary, and returns line-level evidence (`files[]` with `line` / `heading` / `excerpt` per match). The synthesis tier (Sonnet/Opus generator) then starts from pinpointed excerpts instead of doing its own grep across the corpus.

For each selected contract, read its domain config and join `key_data_points[]` into a comma-separated query:

```
contract_query = ", ".join(read_json(<plugin_dir>/agents/configs/<contract_type>.json).key_data_points)
```

`key_data_points[]` is a curated 6–10-term vocabulary list present in every `agents/configs/<contract_type>.json`. SRE: SLO, SLI, Error Budget, MTTR, MTBF, Runbook coverage, Monitoring tools, Incident response. Security: API authentication, Encryption (TLS/AES), mTLS, Secrets management, Vulnerability SLAs, Security event logging. Cloud: Cloud provider, Deployment model, Multi-region, IaC, Cloud costs, Cloud-native services. Etc.

Spawn template:

```
Task(sa-skills:architecture-explorer)
prompt:
  project_root: <dirname(architecture_file)>
  query: <contract_query>
```

That's the complete prompt — no `task_type`, no `config_path`, no `agent_version`, no `force`. Per-contract differentiation is entirely in the `query`.

Collect each contract's `EXPLORE_FINDINGS` block keyed by contract type:

```yaml
findings_by_contract:
  sre:
    findings_yaml: |
      schema_version: 2
      status: OK
      query: "..."
      files:
        - file: docs/08-scalability-and-performance.md
          matched_terms: [SLO, MTTR]
          matches:
            - line: 42
              heading: "## 8.3 SLO Targets"
              excerpt: |
                ...
        ...
    explorer_status: <OK|FAILED>
  security:
    ...
```

Pass each contract's `findings_yaml` into that contract's generator prompt (Step 3.4) as an `EXPLORE_FINDINGS:` block. **Validators do NOT receive findings** — they continue using their hardcoded read lists since the v3.16.0 cleanup.

**Cost shape**: per-contract Haiku fan-out (parallel batches of 4) for a 10-contract run is 3 batches (4+4+2). Each call is small (one Read of ARCHITECTURE.md + parallel Greps + parallel context Reads). Net synthesis-tier savings come from the generator no longer re-grepping the corpus to extract placeholder values — `findings.files[*].matches[*]` already names the line, heading, and surrounding excerpt.

**Degraded mode** (fail-open): if any explorer call returns `status: FAILED` or empty `files[]`, omit the `EXPLORE_FINDINGS` block from that contract's generator prompt entirely. The generator falls back to `phase3.required_files[]` only.

**Step 3.3: Spawn Validators (FIRST)**

⛔ **Validators MUST run before generators.** Each validator performs external checks (EOL verification via WebSearch, stack validation) and returns a `VALIDATION_RESULT` block. The generator needs this result to populate the contract correctly.

Invoke validators for the selected contracts in **batches of 2 per message** (strict parallel barrier):

**Batching rule**: dispatch exactly **2 Task() calls per message**. After sending a batch, wait for BOTH `VALIDATION_RESULT:` blocks to return before sending the next batch. Do not start batch N+1 until every Task() in batch N has returned. If any validator in a batch fails, record the failure and continue with the next batch (do not retry inline; failures are collected and reported at the end). This caps peak parallelism at 2 and gives the orchestrator a chance to observe early failures before dispatching the remaining batches. For 10 contracts this is 5 sequential batches; for fewer contracts, round up (e.g., 3 contracts = 2 batches of 2+1).

| Contract Type | Validator | Subagent Type |
|---------------|-----------|---------------|
| Business Continuity | Aegis Validator | `sa-skills:business-continuity-validator` |
| SRE Architecture | Prometheus Validator | `sa-skills:sre-validator` |
| Cloud Architecture | Atlas Validator | `sa-skills:cloud-validator` |
| Data & AI Architecture | Mnemosyne Validator | `sa-skills:data-ai-validator` |
| Development Architecture | Hephaestus Validator | `sa-skills:development-validator` |
| Process Transformation | Hermes Validator | `sa-skills:process-validator` |
| Security Architecture | Argus Validator | `sa-skills:security-validator` |
| Platform & IT Infrastructure | Vulcan Validator | `sa-skills:platform-validator` |
| Enterprise Architecture | Athena Validator | `sa-skills:enterprise-validator` |
| Integration Architecture | Iris Validator | `sa-skills:integration-validator` |

**Validator prompt template:**
```
Validate [Contract Type] compliance.
architecture_file: [absolute path to ARCHITECTURE.md]
plugin_dir: [plugin_dir resolved in Step 3.1]
```

The validator uses its hardcoded "Required Files" list. As of v3.16.0 the orchestrator no longer passes an explorer block to validators — `agents/configs/<contract_type>.json:phase3.required_files[]` is a superset of the validator's hardcoded list, so the generator's manifest-driven read set still covers everything the validator might check.

**Model selection per validator**: for each validator Task() call, set the `model:` parameter using `resolve_model(contract_type, "validator", model_preset)` from Step 1.5. Example: `Task(subagent_type="...", model="sonnet", prompt="...")`. If `model_preset` is not set, default to `sonnet`.

Each validator returns a `VALIDATION_RESULT:` block. **Collect and store all results** before proceeding to Step 3.4.

**Step 3.4: Spawn Generators (with validation results)**

After all validators complete, invoke generators for the selected contracts. **Include the validator's VALIDATION_RESULT in each generator's prompt.**

All generators use the **single universal agent** `sa-skills:compliance-generator`. The `contract_type` parameter determines which config and template to use.

**Generator prompt template** (includes contract_type, validation result, and the shared manifest):
```
Generate compliance contract.
contract_type: [config name, e.g., cloud]
architecture_file: [absolute path to ARCHITECTURE.md]
plugin_dir: [plugin_dir resolved in Step 3.1]

VALIDATION_RESULT:
[paste the full VALIDATION_RESULT block returned by the validator for this contract type]

EXPLORE_FINDINGS:                                # v3.16.0+ — from Step 3.2.5 per-contract findings call (omit block entirely if the explorer returned status: FAILED or empty files[])
[paste the full EXPLORE_FINDINGS YAML body verbatim from findings_by_contract[<contract_type>]]
```

The generator's PHASE 3 Step 3.3 reads `phase3.required_files[]` from the domain config (always — the floor that guarantees domain coverage) plus any additional files listed in `findings.files[]`. The findings entries pre-locate evidence at line + heading granularity (`matches[].line`, `matches[].heading`, `matches[].excerpt`) — the generator uses them as starting points for placeholder extraction instead of grepping the full files itself. No metadata cross-reference is needed because the explorer already scoped findings to `phase3.key_data_points[]` via the `query` parameter. When the findings block is absent (degraded mode), the generator falls back to `phase3.required_files` only.

**Model selection for generators**: for every generator Task() call, set the `model:` parameter using `resolve_model(contract_type, "generator", model_preset)` from Step 1.5. This resolves to `sonnet` for eco/balanced/critical-opus, or `opus` for max. Example: `Task(subagent_type="sa-skills:compliance-generator", model="sonnet", prompt="...")`.

Invoke generators in **batches of 2 per message** (strict parallel barrier).

**Batching rule**: dispatch exactly **2 generator Task() calls per message**. After sending a batch, wait for BOTH generators to finish writing their contracts before sending the next batch. Do not start batch N+1 until every Task() in batch N has returned. If any generator in a batch fails, record the failure and continue with the next batch (do not retry inline; failures are collected and reported at the end). Pass the matching `VALIDATION_RESULT:` block into each generator's prompt — all validator results are already available because Step 3.3 completed before Step 3.4 began. For 10 contracts this is 5 sequential batches; for fewer contracts, round up.

**Single contract example** (preset = `balanced`):
```python
# Step 1: Spawn validator (resolve_model("development", "validator", "balanced") → "sonnet")
validator_result = Task(
    subagent_type="sa-skills:development-validator",
    model="sonnet",
    prompt="Validate Development Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]",
    description="Hephaestus — Development Architecture Validator"
)

# Step 2: Spawn universal generator (resolve_model("development", "generator", "balanced") → "sonnet")
Task(
    subagent_type="sa-skills:compliance-generator",
    model="sonnet",
    prompt="Generate compliance contract.\ncontract_type: development\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n" + validator_result,
    description="CC-004 — Development Architecture"
)
```

Swap `model="sonnet"` per the matrix in "Model Preset Selection" — e.g., for preset `critical-opus` the Hephaestus validator above becomes `model="opus"` because Development is in the critical set.

**All 10 contracts — Step 1 (validators, batched 2 at a time — 5 sequential batches). Example below shows preset = `critical-opus`: Opus on Security/SRE/Data-AI/Development, Haiku on the other 6. For `balanced` use `model="sonnet"` everywhere; for `eco` use `model="haiku"` everywhere; for `max` use `model="opus"` everywhere.**

```python
# Batch 1 of 5 — dispatch in one message, wait for both to return
Task(subagent_type="sa-skills:business-continuity-validator", model="haiku", description="Aegis — Business Continuity Validator", prompt="Validate Business Continuity compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="sa-skills:sre-validator", model="opus", description="Prometheus — SRE Architecture Validator", prompt="Validate SRE Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]")

# [BARRIER — wait for both batch-1 results]

# Batch 2 of 5
Task(subagent_type="sa-skills:cloud-validator", model="haiku", description="Atlas — Cloud Architecture Validator", prompt="Validate Cloud Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="sa-skills:data-ai-validator", model="opus", description="Mnemosyne — Data & AI Architecture Validator", prompt="Validate Data & AI Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]")

# [BARRIER]

# Batch 3 of 5
Task(subagent_type="sa-skills:development-validator", model="opus", description="Hephaestus — Development Architecture Validator", prompt="Validate Development Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="sa-skills:process-validator", model="haiku", description="Hermes — Process Transformation Validator", prompt="Validate Process Transformation compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]")

# [BARRIER]

# Batch 4 of 5
Task(subagent_type="sa-skills:security-validator", model="opus", description="Argus — Security Architecture Validator", prompt="Validate Security Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="sa-skills:platform-validator", model="haiku", description="Vulcan — Platform & IT Infrastructure Validator", prompt="Validate Platform & IT Infrastructure compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]")

# [BARRIER]

# Batch 5 of 5
Task(subagent_type="sa-skills:enterprise-validator", model="haiku", description="Athena — Enterprise Architecture Validator", prompt="Validate Enterprise Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]"),
Task(subagent_type="sa-skills:integration-validator", model="haiku", description="Iris — Integration Architecture Validator", prompt="Validate Integration Architecture compliance.\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]")
```

**All 10 contracts — Step 2 (universal generator × 10, batched 2 at a time — 5 sequential batches). Generator model is the same for every contract within a preset: `sonnet` for eco/balanced/critical-opus, `opus` for max. Example below shows preset ≠ `max` (generator on Sonnet).**

```python
# Batch 1 of 5 — dispatch in one message, wait for both to return
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-001 — Business Continuity", prompt="Generate compliance contract.\ncontract_type: business-continuity\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[BC_VALIDATION_RESULT]"),
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-010 — SRE", prompt="Generate compliance contract.\ncontract_type: sre\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[SRE_VALIDATION_RESULT]")

# [BARRIER — wait for both batch-1 results]

# Batch 2 of 5
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-002 — Cloud", prompt="Generate compliance contract.\ncontract_type: cloud\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[CLOUD_VALIDATION_RESULT]"),
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-003 — Data & AI", prompt="Generate compliance contract.\ncontract_type: data-ai\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[DATA_AI_VALIDATION_RESULT]")

# [BARRIER]

# Batch 3 of 5
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-004 — Development", prompt="Generate compliance contract.\ncontract_type: development\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[DEV_VALIDATION_RESULT]"),
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-008 — Process", prompt="Generate compliance contract.\ncontract_type: process\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[PROCESS_VALIDATION_RESULT]")

# [BARRIER]

# Batch 4 of 5
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-009 — Security", prompt="Generate compliance contract.\ncontract_type: security\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[SECURITY_VALIDATION_RESULT]"),
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-007 — Platform", prompt="Generate compliance contract.\ncontract_type: platform\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[PLATFORM_VALIDATION_RESULT]")

# [BARRIER]

# Batch 5 of 5
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-005 — Enterprise", prompt="Generate compliance contract.\ncontract_type: enterprise\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[ENTERPRISE_VALIDATION_RESULT]"),
Task(subagent_type="sa-skills:compliance-generator", model="sonnet", description="CC-006 — Integration", prompt="Generate compliance contract.\ncontract_type: integration\narchitecture_file: ./ARCHITECTURE.md\nplugin_dir: [plugin_dir]\n\n[INTEGRATION_VALIDATION_RESULT]")
```

**Step 3.5: Collect Results**

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

**Step 5.0: Verify Unfilled Placeholders**

After the pipeline runs, scan each generated contract for unfilled pipeline-owned placeholders. Use Grep tool for each contract file:

```
pattern: \[(NEXT_REVIEW_DATE|DOCUMENT_STATUS|VALIDATION_SCORE|VALIDATION_STATUS|VALIDATION_DATE|REVIEW_ACTOR|PIPELINE_POPULATED)\]|^\[List of all data points
file: [contract_path]
output_mode: content
```

If ANY unfilled placeholder is found in a contract:

```
⚠️  Pipeline placeholder replacement incomplete in [filename]:
    Still unfilled: [list of found placeholder names or sections]

    This usually means the post-generation pipeline did not run, ran before the
    contract was written, or failed silently. Re-run manually:

    bun [plugin_dir]/skills/architecture-compliance/utils/post-generation-pipeline.ts \
      --compliance-docs-dir [compliance_docs_dir] \
      --project "[PROJECT_NAME]"
```

Do NOT report success for a contract that has unfilled placeholders — report the specific fields that are still `[PLACEHOLDER]` text.

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

**After printing the completion report above, always append the following user-visible context-reclaim hint** (verbatim, as the final lines of the skill's output):

```
💡 Tip: all contracts are written to `compliance-docs/`. To reclaim context from the generator responses before your next task, run:
    /compact
```

---

## Conclusion

This skill generates compliance documentation from ARCHITECTURE.md using 10 specialized agents dispatched in batches of 2 (strict parallel barrier between batches). Each agent is self-contained and writes its contract independently. The post-generation pipeline handles scoring and manifest generation in a single pass.

For detailed mapping strategies and contract-specific guidance, refer to COMPLIANCE_GENERATION_GUIDE.md and SECTION_MAPPING_GUIDE.md.
