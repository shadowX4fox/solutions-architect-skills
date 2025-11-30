---
name: architecture-compliance
description: Generate compliance documents (Contratos de Adherencia and Risk Management) from ARCHITECTURE.md files
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

**NOT Activated For:**
- Automatic triggers when ARCHITECTURE.md changes
- General architecture documentation tasks (use `architecture-docs` skill)
- Business requirements documentation (use `architecture-readiness` skill)

## Purpose

This skill generates compliance documents from ARCHITECTURE.md, producing 11 separate documents:

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

**Plus:**
11. Risk Management (custom organizational format)

## Files in This Skill

- **SKILL.md**: This file - activation triggers and workflows
- **COMPLIANCE_GENERATION_GUIDE.md**: Comprehensive guide for all 11 contract types with generation methodology
- **SECTION_MAPPING_GUIDE.md**: Detailed mapping between ARCHITECTURE.md sections and compliance documents
- **templates/**: 11 template files (one per compliance document type)
- **contracts/CONTRACT_TYPES_REFERENCE.md**: Reference documentation for all contract types

## File Naming Convention

**Output Directory:** `/compliance-docs/` (relative to ARCHITECTURE.md location)

**File Naming Pattern:**
```
[CONTRACT_TYPE]_[PROJECT_NAME]_[DATE].md
```

**Examples:**
- `SRE_ARCHITECTURE_JobScheduler_2025-11-26.md`
- `BUSINESS_CONTINUITY_PaymentGateway_2025-11-26.md`
- `RISK_MANAGEMENT_JobScheduler_2025-11-26.md`

**Handling Existing Files:**
- If file exists, append timestamp: `_HHMM`
- Example: `SRE_ARCHITECTURE_JobScheduler_2025-11-26_1430.md`

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

**Step 2.1: Contract Selection**
```
Based on user intent:
- All: Generate all 11 contracts
- Specific: Parse contract name from request
- Category: Map category to relevant contracts
  Examples:
  - "security" → Security Architecture, Risk Management
  - "cloud" → Cloud Architecture, Platform & IT Infrastructure
  - "SRE" → SRE Architecture, Business Continuity
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

**Step 3.5: Automatic Stack Validation** (Development Architecture only)
```
For Development Architecture contract generation:
- Input: Cached Section 8 content (technology stack)
- Process: LLM-assisted validation against 26 checklist items
  - Detect stack type (Java, .NET, both, neither)
  - Detect frontend presence (React, Angular, Vue, none)
  - Evaluate each of 26 items: PASS, FAIL, N/A, UNKNOWN
  - Collect evidence with source references
  - Handle edge cases (backend-only, polyglot, deprecated versions, unapproved tech)
- Output: ValidationResults object → cache for Phase 4
- Overhead: ~5,500 tokens (3K prompt + 2K response)
- Result: PASS (approval unblocked) or FAIL (detailed failure report)
```

### Phase 4: Document Generation

**Step 4.1: Load Template**
```
Load template file for contract type from templates/
Example: templates/TEMPLATE_SRE_ARCHITECTURE.md
```

**Step 4.2: Apply Extracted Data to Placeholders**
```
Replace placeholders:
- [PROJECT_NAME] → from Document Index
- [GENERATION_DATE] → current date (YYYY-MM-DD)
- [EXTRACTED_VALUE] → from cached data
- [SOURCE_REFERENCE] → section and line numbers
```

**Step 4.3: Calculate Derived Values**
```
Examples:
- Error Budget from SLA (99.99% → 43.2 min/month)
- Business Criticality from uptime (99.99% → Tier 1)
- Integration Count from Section 7
```

**Step 4.4: Format and Validate**
```
- Ensure proper markdown formatting
- Check all sections present
- Validate tables and lists
- Add source traceability
```

**Step 4.5: Flag Missing Data**
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
If exists: append _HHMM timestamp
```

**Step 5.2: Save to Output Directory**
```
Write file to /compliance-docs/
Preserve formatting and markdown structure
```

**Step 5.3: Generate Manifest**
```
Create/update COMPLIANCE_MANIFEST.md with:
- List of all generated documents
- Generation date and time
- Source ARCHITECTURE.md reference
- Summary of completeness (% placeholders)
```

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

### 11. Risk Management
**Primary Sections:** 9 (Security), 10 (Performance), 11 (Operational), 12 (ADRs)
**Secondary Sections:** 1 (System Overview), 5 (System Components)
**Key Extractions:** Risks, likelihood, impact, mitigation strategies

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

## Data Extraction Strategies

### 1. Direct Mapping (1:1)
```
ARCHITECTURE.md Input:
"RTO: 4 hours, RPO: 1 hour"

Contract Output:
**RTO**: 4 hours
**RPO**: 1 hour
**Source**: ARCHITECTURE.md Section 11.3, line 1823
```

### 2. Aggregation (Multiple Sources)
```
ARCHITECTURE.md Input:
Section 7.1: "Integration: User Management (REST API)"
Section 7.2: "Integration: Payment Gateway (SOAP)"

Contract Output:
## Integration Catalog
| System | Protocol | Source |
|--------|----------|--------|
| User Management | REST API | Section 7.1, line 1005 |
| Payment Gateway | SOAP | Section 7.2, line 1020 |
```

### 3. Transformation (Reformatting)
```
ARCHITECTURE.md Input:
"SLA: 99.99% uptime"

Contract Output:
**Availability SLO**: 99.99%
**Error Budget**: 43.2 minutes/month
**Calculation**: (100% - 99.99%) × 43,200 min = 43.2 min
**Source**: Section 10.2, line 1576
```

### 4. Inference (Derived Values)
```
ARCHITECTURE.md Input:
"SLA: 99.99% uptime"

Contract Output:
**Business Criticality**: Tier 1 (Mission Critical)
**Rationale**: 99.99% SLA indicates high-availability requirement
**Source**: Inferred from Section 10.2, line 1576
```

## Missing Data Handling

### When Data Cannot Be Extracted

**Option 1: Flag with [PLACEHOLDER]**
```markdown
**RTO**: [PLACEHOLDER: Not specified in ARCHITECTURE.md]
```

**Option 2: Provide Guidance**
```markdown
[PLACEHOLDER: Define RTO based on business criticality.
Recommended: Tier 1 = 4 hours, Tier 2 = 8 hours, Tier 3 = 24 hours]
```

**Option 3: Reference Source Section**
```markdown
[PLACEHOLDER: See ARCHITECTURE.md Section 11.3 for backup strategy details.
Add RTO/RPO values to complete this section.]
```

**Option 4: Suggest Inferred Value**
```markdown
[INFERRED: Based on 99.99% SLA, recommended RTO is 4 hours.
Validate with stakeholders and update ARCHITECTURE.md.]
```

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
4. Generates 11 compliance documents
```

### With architecture-readiness Skill

**Dependencies:**
- Product Owner Specifications provide business context
- Business requirements feed into Risk Management contract
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
   → Creates: 11 compliance contracts in /compliance-docs/
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
4. Confirm: "Generate all 11 compliance contracts?"
5. User confirms
6. For each of 11 contracts:
   - Identify required sections
   - Load sections incrementally
   - Extract data
   - Apply template
   - Generate document
7. Save to /compliance-docs/
8. Generate COMPLIANCE_MANIFEST.md
9. Report: "11 contracts generated. 23 placeholders require review."
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
3. Map to contracts: Security Architecture, Risk Management
4. Confirm: "Generate Security and Risk Management contracts?"
5. User confirms
6. Generate Security Architecture:
   - Load Section 9 (Security Considerations)
   - Extract: API security, authentication, encryption
   - Apply template
7. Generate Risk Management:
   - Load Sections 9, 10, 11, 12
   - Extract: Risks, mitigations
   - Apply template
8. Save both to /compliance-docs/
9. Report: "2 security contracts generated."
```

## Template Placeholder Conventions

### Standard Placeholders

**Project Information:**
- `[PROJECT_NAME]` - Extracted from ARCHITECTURE.md title (Section 1)
- `[GENERATION_DATE]` - Current date in YYYY-MM-DD format
- `[DOCUMENT_OWNER]` - Extracted from ARCHITECTURE.md metadata or [PLACEHOLDER]

**Extracted Values:**
- `[EXTRACTED_VALUE]` - Actual data from ARCHITECTURE.md with source reference
- `[SOURCE_REFERENCE]` - Format: "Section X, line Y" or "Sections X-Y, lines A-B"

**Missing Data:**
- `[PLACEHOLDER: description]` - Data not found, needs manual input
- `[PLACEHOLDER: guidance]` - Missing data with recommendation

**Derived Values:**
- `[INFERRED: explanation]` - Calculated or inferred from other data
- Shows calculation or reasoning

### Example Template Excerpt

```markdown
# Contrato de Adherencia: SRE Architecture

**Project**: [PROJECT_NAME]
**Generated**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 10, 11)
**Version**: 1.0

---

## 1. Service Level Objectives

### 1.1 Availability SLO
**Target**: [EXTRACTED_VALUE from Section 10.2, line 1576]
**Error Budget**: [INFERRED: Calculated from SLA]
**Monitoring**: [EXTRACTED_VALUE from Section 11.1, line 1780]

### 1.2 Latency SLOs
**p95**: [EXTRACTED_VALUE from Section 10.1, line 1558]
**p99**: [EXTRACTED_VALUE from Section 10.1, line 1559]

[If missing]
**p95**: [PLACEHOLDER: Define p95 latency target. Recommended: < 100ms for user-facing APIs]
```

## Automatic Stack Validation (Development Architecture)

### Overview

The Development Architecture contract includes **automatic stack validation** that evaluates the technology stack against a 26-item checklist during document generation. This eliminates manual validation and provides immediate feedback on stack compliance.

### Validation Checklist

**File**: `STACK_VALIDATION_CHECKLIST.md` (26 items across 5 sections)

1. **Java Backend** (6 items): Version, Spring Boot, tools, containers, libraries, naming
2. **.NET Backend** (6 items): C# version, ASP.NET Core, tools, containers, libraries, naming
3. **Frontend** (6 items): Framework, TypeScript/JavaScript, tools, architecture, libraries, naming
4. **Other Stacks** (5 items): Automation, IaC, databases, APIs, CI/CD
5. **Exceptions** (3 items): Deviations exist?, Documented?, Plans approved?

### Validation States

- **PASS**: Item complies with authorized technology catalog
- **FAIL**: Item does not comply (deprecated version, unapproved technology, missing documentation)
- **N/A**: Item not applicable to this architecture (e.g., frontend in backend-only system)
- **UNKNOWN**: Insufficient data in ARCHITECTURE.md Section 8 to determine compliance

### Validation Process

**Step 1: Detection**
- Analyze Section 8 to detect stack type (Java, .NET, both, neither)
- Detect frontend presence (React, Angular, Vue, none)
- Identify technologies, versions, tools

**Step 2: Evaluation** (LLM-assisted)
- Evaluate each of 26 checklist items against Section 8 content
- Collect evidence with source references (line numbers)
- Determine status: PASS, FAIL, N/A, or UNKNOWN
- Identify deviations from authorized catalog

**Step 3: Results**
- Overall status: PASS (if all applicable items PASS or N/A) or FAIL (if any FAIL or UNKNOWN)
- Detailed per-item results with evidence
- Failure report with remediation recommendations
- Stack deviation report with exception guidance

### Template Integration

Validation results populate 3 locations in the generated compliance document:

**1. Document Control Table**
```markdown
| **Stack Validation Status** | PASS/FAIL |
| **Validation Date** | 2025-11-27 |
| **Validation Evaluator** | Claude Code (Automated) |
```

**2. LADES1.6 Subsection**
- **PASS**: Clean summary with statistics (X PASS, Y N/A)
- **FAIL**: Detailed failure report including:
  - Validation Failures section (FAIL items with recommendations)
  - Items Requiring Documentation (UNKNOWN items)
  - Stack Deviations Detected (unauthorized technologies)

**3. Compliance Summary**
```markdown
**Stack Validation**: PASS (Automated: 2025-11-27)
```

### Edge Cases Handled

1. **Backend-only**: Frontend items marked N/A
2. **Full-stack**: Both backend and frontend evaluated
3. **Polyglot backend**: Both Java and .NET sections evaluated
4. **Section 8 missing**: Overall FAIL, all items UNKNOWN
5. **Partial documentation**: PASS for documented, UNKNOWN for missing
6. **Deprecated versions**: FAIL with upgrade recommendations
7. **Unapproved technology**: FAIL with exception process guidance

### Performance

- **Context overhead**: ~5,500 tokens (3K prompt + 2K response)
- **Leverages cached data**: Uses Section 8 already extracted in Step 3.4
- **No additional loading**: Zero incremental ARCHITECTURE.md reads

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
