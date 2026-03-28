# Migration Guide: Refactoring Templates to Use Shared Content

## Purpose

This guide provides step-by-step instructions for refactoring the remaining 9 compliance templates to use the shared content system.

**Current Status**:
- ✅ **Business Continuity** - COMPLETED (proof-of-concept, 87 lines saved)
- ⏳ **Remaining 9 templates** - TO BE MIGRATED

---

## Prerequisites

Before migrating a template, ensure:

1. ✅ Shared infrastructure exists (`shared/sections/`, `shared/fragments/`, `shared/config/`)
2. ✅ Shared files are created and tested
3. ✅ SKILL.md documents include processing (Phase 4, Step 4.1)
4. ✅ COMPLIANCE_GENERATION_GUIDE.md explains shared system

---

## Migration Process (Per Template)

### Step 1: Identify Domain Name

Determine the domain identifier from template filename:

| Template File | Domain Name | Config File |
|--------------|-------------|-------------|
| cc-002-cloud-architecture.template.md | cloud-architecture | cloud-architecture.json |
| cc-010-sre-architecture.template.md | sre-architecture | sre-architecture.json |
| cc-009-security-architecture.template.md | security-architecture | security-architecture.json |
| cc-003-data-ai-architecture.template.md | data-ai-architecture | data-ai-architecture.json |
| cc-004-development-architecture.template.md | development-architecture | development-architecture.json |
| cc-007-platform-it-infrastructure.template.md | platform-it-infrastructure | platform-it-infrastructure.json |
| cc-005-enterprise-architecture.template.md | enterprise-architecture | enterprise-architecture.json |
| cc-006-integration-architecture.template.md | integration-architecture | integration-architecture.json |
| cc-008-process-transformation.template.md | process-transformation | process-transformation.json |

### Step 2: Create Domain Config

Create `shared/config/<domain-name>.json` with required variables:

```json
{
  "domain_name": "Cloud Architecture",
  "compliance_prefix": "LAC",
  "review_board": "Cloud Architecture Review Board",
  "approval_authority": "Cloud Architecture Review Board",
  "validation_config_path": "/skills/architecture-compliance/validation/cc-002-cloud-architecture-validation.json"
}
```

**Variable Mapping Table**:

| Domain | compliance_prefix | review_board | validation_config_path |
|--------|------------------|--------------|------------------------|
| Cloud Architecture | LAC | Cloud Architecture Review Board | validation/cc-002-cloud-architecture-validation.json |
| SRE Architecture | LASRE | SRE Review Board | validation/cc-010-sre-architecture-validation.json |
| Security Architecture | LAS | Security Review Board | validation/cc-009-security-architecture-validation.json |
| Data & AI Architecture | LAD / LAIA | Data & AI Architecture Review Board | validation/cc-003-data-ai-architecture-validation.json |
| Development Architecture | LADES | Development Architecture Review Board | validation/cc-004-development-architecture-validation.json |
| Platform IT Infrastructure | LAPI | Infrastructure Review Board | validation/cc-007-platform-it-infrastructure-validation.json |
| Enterprise Architecture | LAE | Enterprise Architecture Review Board | validation/cc-005-enterprise-architecture-validation.json |
| Integration Architecture | LAI | Integration Architecture Review Board | validation/cc-006-integration-architecture-validation.json |
| Process Transformation | LAP | Process Transformation Review Board | validation/cc-008-process-transformation-validation.json |

### Step 3: Backup Original Template

Always create a backup before making changes:

```bash
cp cc-NNN-<name>.template.md cc-NNN-<name>.template.md.backup
```

Example:
```bash
cp cc-002-cloud-architecture.template.md cc-002-cloud-architecture.template.md.backup
```

### Step 4: Identify Sections to Replace

Open the template and locate these sections:

#### 4A. Document Control (Lines ~10-26)

**Look for**:
```markdown
## Document Control

| Field | Value |
|-------|-------|
| Document Owner | [SOLUTION_ARCHITECT or N/A] |
...
```

**Replace with**:
```markdown
<!-- @include-with-config shared/sections/document-control.md config=<domain-name> -->
```

#### 4B. Dynamic Field Instructions (Lines ~27-60)

**Look for**:
```markdown
**Dynamic Field Instructions for Document Generation**:

- `[DOCUMENT_STATUS]`: Determined by validation_results.outcome.document_status
...
```

**Replace with**:
```markdown
<!-- @include-with-config shared/sections/dynamic-field-instructions.md config=<domain-name> -->
```

#### 4C. Compliance Score Calculation (Lines ~61-66)

**Look for**:
```markdown
**CRITICAL - Compliance Score Calculation**:
When calculating the Compliance Score in validation_results, N/A items MUST be included in the numerator:
...
```

**Replace with**:
```markdown
<!-- @include shared/fragments/compliance-score-calculation.md -->
```

#### 4D. Status Codes in Appendix A.1 (Lines ~145-150)

**Look for** (in Appendix A.1):
```markdown
**Status Codes**:
- **Compliant**: Requirement fully satisfied with documented evidence
- **Non-Compliant**: Requirement not met or missing from ARCHITECTURE.md
- **Not Applicable**: Requirement does not apply to this solution
- **Unknown**: Partial information exists but insufficient to determine compliance
```

**Replace with**:
```markdown
<!-- @include shared/fragments/status-codes.md -->
```

#### 4E. Validation Methodology in Appendix A.2 (Lines ~160-192)

**Look for**:
```markdown
### A.2 Validation Methodology

**Validation Process**:

1. **Completeness Check (40% weight)**:
...
```

**Replace with**:
```markdown
<!-- @include-with-config shared/sections/validation-methodology.md config=<domain-name> -->
```

### Step 5: Apply Replacements

Use the Edit tool or text editor to make the replacements identified in Step 4.

**Important**:
- Preserve domain-specific content (A.1 domain terms, A.3 completion guide, A.4 change history)
- Only replace the 5 common sections
- Maintain line spacing and formatting

### Step 6: Verify Line Count

Check lines saved:

```bash
wc -l cc-NNN-<name>.template.md*
echo "Lines saved:" && echo "$(($(wc -l < cc-NNN-<name>.template.md.backup) - $(wc -l < cc-NNN-<name>.template.md)))"
```

**Expected savings**: 60-90 lines per template

### Step 7: Test Generation (Manual Verification)

Since include processing isn't yet implemented, manually verify:

1. Read the template file
2. For each `@include` directive:
   - Read the shared file
   - If `@include-with-config`, replace `{{variables}}` with values from config
   - Verify expanded content matches original template
3. Compare expanded template with original backup

### Step 8: Document Changes

Update the template's A.4 Change History:

```markdown
**Version 2.1 (Current)**:
- Migrated to shared content system
- Replaced 5 common sections with @include directives
- Lines reduced from XXX to YYY (-ZZ lines)
- Maintains identical output through include resolution
```

### Step 9: Commit Changes

```bash
git add shared/config/<domain-name>.json
git add templates/cc-NNN-<name>.template.md
git commit -m "refactor: Migrate <Domain Name> template to shared content system

- Create domain config: shared/config/<domain-name>.json
- Replace 5 common sections with include directives
- Lines saved: XX (-YY%)
- Backward compatible with include resolution

Related: Business Continuity proof-of-concept (87 lines saved)"
```

---

## Migration Order (Recommended)

### Phase 1: Simple Templates (Week 1)

1. **Cloud Architecture** - Simple structure, good test case
2. **Enterprise Architecture** - Already has complete A.1-A.4 structure
3. **Process Transformation** - Well-structured, similar to Cloud

**Reason**: These templates closely match Business Continuity in structure.

### Phase 2: Complex Templates (Week 2)

4. **Security Architecture** - Has A.1-A.4 but longer
5. **Data & AI Architecture** - Dual prefix (LAD/LAIA), good complexity test
6. **Integration Architecture** - Has A.1-A.4, needs data sections added

**Reason**: Slightly more complex but still manageable.

### Phase 3: Specialized Templates (Week 3)

7. **Development Architecture** - Has Stack Validation Checklist integration
8. **Platform IT Infrastructure** - Has source mapping (LAPI01-LAPI09)
9. **SRE Architecture** - Largest template (1636 lines), two-tier scoring

**Reason**: Most complex, benefit from learnings from earlier migrations.

---

## Template-Specific Notes

### SRE Architecture (cc-010-sre-architecture.template.md)

**Unique Characteristics**:
- Two-tier scoring (Blocker vs Desired)
- 57 requirements (largest)
- Lines 1569-1632: Custom appendix format

**Migration Strategy**:
- Replace standard sections as usual
- Keep two-tier scoring logic (domain-specific)
- May need custom variables in config for "Blocker" vs "Desired" distinction

### Development Architecture (cc-004-development-architecture.template.md)

**Unique Characteristics**:
- Stack Validation Checklist integration (LADES1.6)
- External validation file reference
- Special "Unknown" status restriction for LADES1.6

**Migration Strategy**:
- Replace standard sections
- Keep Stack Validation Checklist content (domain-specific)
- Add note in config about checklist requirement

### Data & AI Architecture (cc-003-data-ai-architecture.template.md)

**Unique Characteristics**:
- Dual prefix: LAD (Data) and LAIA (AI)
- 11 distinct requirements

**Migration Strategy**:
- Use `compliance_prefix: "LAD / LAIA"` in config
- May need special handling if prefixes used separately in validation

### Integration Architecture (cc-006-integration-architecture.template.md)

**Unique Characteristics**:
- Has A.1-A.4 already
- Uses different weighting (30% / 60% / 10%)
- Has validation config reference

**Migration Strategy**:
- Already has A.1-A.4 structure
- Replace A.2 with shared version (but note weighting difference)
- May need custom validation-methodology for this domain

---

## Troubleshooting

### Issue: Variable Not Defined

**Symptom**: Missing value in config causes `{{variable}}` to appear in output

**Solution**:
1. Check `shared/config/<domain>.json` has all required variables
2. Verify variable name spelling matches shared file
3. Add missing variable to config

### Issue: Wrong Review Board Name

**Symptom**: Template shows wrong review board (e.g., "Business Continuity Review Board" in Cloud template)

**Solution**:
1. Check config file has correct `review_board` value
2. Verify using correct domain name in `config=<domain-name>` directive
3. Ensure no typos in config filename

### Issue: Template Longer After Refactoring

**Symptom**: Template has MORE lines after migration

**Solution**:
1. Check that old sections were fully replaced (not added to)
2. Verify include directives replaced content, didn't just add to it
3. Look for duplicate sections

### Issue: Different Output Format

**Symptom**: Generated contract looks different from original

**Solution**:
1. Compare shared file content with original template section
2. Check for whitespace differences (tabs vs spaces)
3. Verify all variables replaced correctly
4. Ensure no extra line breaks or formatting changes

---

## Validation Checklist

Before considering migration complete:

- [ ] Domain config created with all required variables
- [ ] Original template backed up (.backup file)
- [ ] 5 common sections replaced with include directives
- [ ] Domain-specific content preserved (A.1 terms, A.3 guide, A.4 history)
- [ ] Line count reduced (60-90 lines expected)
- [ ] Manual verification shows identical expanded content
- [ ] A.4 Change History updated with migration notes
- [ ] Changes committed to version control

---

## Post-Migration

After all 9 templates are migrated:

### Update Statistics

Update `shared/README.md` with final numbers:

```markdown
| Templates refactored | 10 (100%) |
| Total lines saved | XXX lines |
| Average savings per template | XX lines |
```

### Implement Include Processing

Once all templates use includes:
1. Implement actual include resolution in skill code
2. Test generation for all 10 contract types
3. Verify output matches original contracts
4. Update SKILL.md if processing changes

### Document Lessons Learned

Create a retrospective document:
- What worked well
- Challenges encountered
- Recommendations for future refactoring
- Performance impact

---

## Timeline Estimate

**Per Template**:
- Config creation: 10 minutes
- Backup & identify sections: 10 minutes
- Apply replacements: 15 minutes
- Verification: 15 minutes
- Documentation & commit: 10 minutes

**Total per template**: ~1 hour

**All 9 templates**: ~9 hours (spread over 2-3 weeks)

---

## Support

Questions or issues during migration:

1. Review `shared/README.md` for shared content documentation
2. Compare with Business Continuity template (completed example)
3. Check this migration guide for template-specific notes
4. Test with manual expansion before committing

---

**Last Updated**: 2025-12-11
**Version**: 1.0
**Status**: Ready for use
**Reference Template**: Business Continuity (87 lines saved)
