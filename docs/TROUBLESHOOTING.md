# Troubleshooting Guide

Common issues and solutions for Solutions Architect Skills plugin.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Skill Activation Issues](#skill-activation-issues)
3. [Generation Issues](#generation-issues)
4. [Validation Issues](#validation-issues)
5. [Performance Issues](#performance-issues)
6. [FAQ](#frequently-asked-questions)

---

## Installation Issues

### Q: Plugin not appearing in `/plugin list`

**Symptoms:**
- Run `/plugin list` but `solutions-architect-skills` doesn't appear
- No errors shown

**Diagnosis:**
```bash
# Check if plugin directory exists
ls ~/.claude/plugins/solutions-architect-skills/

# Check if plugin.json exists
cat ~/.claude/plugins/solutions-architect-skills/.claude-plugin/plugin.json
```

**Solutions:**

**Solution 1: Verify Installation Location**
```bash
# Correct location
~/.claude/plugins/solutions-architect-skills/
    .claude-plugin/plugin.json
    skills/
    docs/
    ...

# Incorrect (missing .claude-plugin/)
~/.claude/plugins/solutions-architect-skills/
    plugin.json  # ❌ Wrong location
```

**Fix:**
```bash
mkdir -p ~/.claude/plugins/solutions-architect-skills/.claude-plugin
mv ~/.claude/plugins/solutions-architect-skills/plugin.json \
   ~/.claude/plugins/solutions-architect-skills/.claude-plugin/
```

**Solution 2: Check plugin.json Validity**
```bash
# Validate JSON syntax
jq . ~/.claude/plugins/solutions-architect-skills/.claude-plugin/plugin.json
```

If error appears, JSON is malformed. Reinstall plugin.

**Solution 3: Restart Claude Code**
- Close **all** Claude Code windows
- Wait 10 seconds
- Reopen Claude Code
- Run `/plugin list` again

**Solution 4: Check Permissions**
```bash
# Fix permissions
chmod -R 755 ~/.claude/plugins/solutions-architect-skills
chmod 644 ~/.claude/plugins/solutions-architect-skills/.claude-plugin/plugin.json
```

---

### Q: Downloaded ZIP won't extract

**Symptoms:**
- `unzip` command fails
- Corrupted archive errors

**Solutions:**

**Solution 1: Install `unzip`**
```bash
# Ubuntu/Debian
sudo apt install unzip

# macOS (usually pre-installed)
brew install unzip

# Fedora/RHEL
sudo dnf install unzip
```

**Solution 2: Verify Download Integrity**
```bash
# Check file size (should be ~600-700 KB)
ls -lh solutions-architect-skills-v1.0.0.zip

# Try extracting with verbose output
unzip -v solutions-architect-skills-v1.0.0.zip
```

If file is corrupted, re-download from GitHub releases.

**Solution 3: Use Alternative Extraction**
```bash
# macOS: Use built-in Archive Utility (double-click ZIP)
open solutions-architect-skills-v1.0.0.zip

# Linux: Use GUI archive manager
file-roller solutions-architect-skills-v1.0.0.zip
```

---

### Q: Wrong version showing after update

**Symptoms:**
- Updated to v1.1.0 but `/plugin list` shows v1.0.0
- Old templates still being used

**Solutions:**

**Solution 1: Complete Removal and Reinstall**
```bash
# Remove old version
rm -rf ~/.claude/plugins/solutions-architect-skills

# Clear Claude cache (if applicable)
rm -rf ~/.claude/cache/*

# Install new version
unzip solutions-architect-skills-v1.1.0.zip
mv solutions-architect-skills ~/.claude/plugins/

# Restart Claude Code
```

**Solution 2: Verify Version in plugin.json**
```bash
jq '.version' ~/.claude/plugins/solutions-architect-skills/.claude-plugin/plugin.json
```

Should show `"1.1.0"`. If not, re-download correct release.

---

## Skill Activation Issues

### Q: `/skill architecture-readiness` doesn't work

**Symptoms:**
- Command not recognized
- "Skill not found" error
- No response from Claude Code

**Diagnosis:**
```bash
# Check if SKILL.md exists
ls ~/.claude/plugins/solutions-architect-skills/skills/architecture-readiness/SKILL.md

# Check file size (should be ~1-2 KB)
ls -lh ~/.claude/plugins/solutions-architect-skills/skills/architecture-readiness/SKILL.md
```

**Solutions:**

**Solution 1: Use Full Skill Path**
```
/skill solutions-architect-skills/architecture-readiness
```

If this works, plugin is installed but skill name collision exists.

**Solution 2: Verify Skill Files Exist**
```bash
# All three skills should have SKILL.md
find ~/.claude/plugins/solutions-architect-skills/skills -name "SKILL.md"
```

Should return 3 files. If not, reinstall plugin.

**Solution 3: Check SKILL.md Format**
```bash
# First few lines should have YAML frontmatter
head -5 ~/.claude/plugins/solutions-architect-skills/skills/architecture-readiness/SKILL.md
```

Expected:
```
---
name: architecture-readiness
description: ...
---
```

If missing, file is corrupted. Reinstall plugin.

**Solution 4: Restart Claude Code**

Close and reopen to reload skills.

---

### Q: Skill activates but doesn't load guides

**Symptoms:**
- Skill starts but says "Template not found"
- Missing PRODUCT_OWNER_SPEC_GUIDE.md errors

**Diagnosis:**
```bash
# Check if guide files exist
ls ~/.claude/plugins/solutions-architect-skills/skills/architecture-readiness/
```

Should show:
- SKILL.md
- PRODUCT_OWNER_SPEC_GUIDE.md
- PO_SPEC_SCORING_GUIDE.md
- templates/PO_SPEC_TEMPLATE.md

**Solutions:**

**Solution 1: Verify All Files Present**
```bash
# Count markdown files (should be 24)
find ~/.claude/plugins/solutions-architect-skills/skills -name "*.md" | wc -l
```

If count ≠ 24, reinstall plugin.

**Solution 2: Check File Permissions**
```bash
# Make guides readable
find ~/.claude/plugins/solutions-architect-skills/skills -name "*.md" -exec chmod 644 {} \;
```

---

### Q: Multiple skills with same name conflict

**Symptoms:**
- Wrong skill activates
- Unexpected behavior from skill commands

**Solutions:**

**Solution 1: Use Fully Qualified Skill Name**
```
/skill solutions-architect-skills/architecture-docs
```

**Solution 2: Rename Other Conflicting Plugin**

If another plugin has `architecture-docs` skill:
```bash
# List all plugins
/plugin list

# Disable conflicting plugin temporarily
mv ~/.claude/plugins/other-plugin ~/.claude/plugins/other-plugin.disabled

# Restart Claude Code
```

---

## Generation Issues

### Q: ARCHITECTURE.md generation fails mid-process

**Symptoms:**
- Skill starts creating document
- Stops at Section 5 or 8
- Partial ARCHITECTURE.md created

**Solutions:**

**Solution 1: Resume from Partial Document**

If ARCHITECTURE.md exists but incomplete:
1. Open ARCHITECTURE.md
2. Find last completed section
3. Manually fill remaining sections using ARCHITECTURE_DOCUMENTATION_GUIDE.md as reference

**Solution 2: Delete Partial and Restart**
```bash
# Backup partial document
mv ARCHITECTURE.md ARCHITECTURE.md.partial

# Start fresh
/skill architecture-docs
```

**Solution 3: Generate Section-by-Section**

Instead of full document:
1. Create minimal ARCHITECTURE.md with Document Index
2. Add sections incrementally
3. Update Document Index after each section

---

### Q: Compliance generation produces empty contracts

**Symptoms:**
- Contracts generated but mostly [PLACEHOLDER] markers
- <10% completeness
- "Section not found" warnings

**Diagnosis:**
```bash
# Check if ARCHITECTURE.md exists
ls -lh ARCHITECTURE.md

# Verify it's not empty
wc -l ARCHITECTURE.md
```

Should be 2,000+ lines for complete architecture.

**Solutions:**

**Solution 1: Complete ARCHITECTURE.md First**

Ensure ARCHITECTURE.md has all 12 sections documented before generating compliance docs.

**Solution 2: Verify Document Index**

Check lines 1-50 of ARCHITECTURE.md:
```markdown
## Section 1: Executive Summary (lines 51-150)
## Section 2: System Overview (lines 151-300)
...
```

If missing, recreate Document Index:
```
/skill architecture-docs
> Maintain existing ARCHITECTURE.md
> Update Document Index
```

**Solution 3: Generate Specific Sections**

If only Section 8 is complete:
```
/skill architecture-compliance
> Which contracts? Development Architecture

# Only generates contracts that rely on Section 8
```

---

### Q: Compliance Manifest not created

**Symptoms:**
- 11 contracts generated
- COMPLIANCE_MANIFEST.md missing from /compliance-docs/

**Solutions:**

**Solution 1: Manually Create Manifest**

Create `/compliance-docs/COMPLIANCE_MANIFEST.md`:
```markdown
# Compliance Documentation Manifest

**Project:** [Project Name]
**Source:** ARCHITECTURE.md
**Generated:** 2025-11-28

## Generated Documents

| Contract Type | Filename | Status |
|---------------|----------|--------|
| ... | ... | ... |

```

**Solution 2: Regenerate All Contracts**
```
/skill architecture-compliance
> Which contracts? All
> Overwrite existing? Yes
```

This recreates manifest.

---

### Q: File encoding issues (special characters)

**Symptoms:**
- Spanish characters (á, é, í, ñ) display as �
- Contract names garbled

**Solutions:**

**Solution 1: Ensure UTF-8 Encoding**
```bash
# Check current encoding
file -i compliance-docs/*.md

# Convert to UTF-8 if needed
for f in compliance-docs/*.md; do
  iconv -f ISO-8859-1 -t UTF-8 "$f" > "$f.utf8"
  mv "$f.utf8" "$f"
done
```

**Solution 2: Set Terminal to UTF-8**
```bash
# Add to ~/.bashrc or ~/.zshrc
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

---

## Validation Issues

### Q: Stack validation shows all UNKNOWN

**Symptoms:**
- Development Architecture contract generated
- All 26 items marked as UNKNOWN
- No PASS or FAIL results

**Diagnosis:**
```bash
# Check if Section 8 exists in ARCHITECTURE.md
grep "## Section 8: Technology Stack" ARCHITECTURE.md
```

**Solutions:**

**Solution 1: Add Technology Stack Section**

If Section 8 is missing or empty, add it to ARCHITECTURE.md:

```markdown
## Section 8: Technology Stack

### 8.1 Backend
- **Language:** Java 17 (LTS)
- **Framework:** Spring Boot 3.2.0
- **Build Tool:** Maven 3.9.5

### 8.2 Data Layer
- **Database:** PostgreSQL 15.4
- **Caching:** Redis 7.2

### 8.3 Infrastructure
- **Containers:** Docker 24+
- **Orchestration:** Azure Kubernetes Service (AKS) 1.28

### 8.4 CI/CD
- **Source Control:** Git, GitHub
- **CI/CD:** GitHub Actions, Azure DevOps Pipelines
```

**Solution 2: Add Version Numbers**

Ensure all technologies have version numbers:
- ❌ "Java" → ✅ "Java 17"
- ❌ "PostgreSQL" → ✅ "PostgreSQL 15.4"
- ❌ "Docker" → ✅ "Docker 24+"

**Solution 3: Regenerate Development Architecture**
```
/skill architecture-compliance
> Which contracts? Arquitectura Desarrollo
```

---

### Q: Stack validation fails with FAIL status

**Symptoms:**
- Validation Status: FAIL
- Items marked with ❌
- Approval blocked

**Diagnosis:**

Review LADES1.6 section in Development Architecture contract:
```markdown
### Java Backend (6 items): 1 FAIL
- ❌ Is Java in a supported version? (Java 8 detected - DEPRECATED)
```

**Solutions:**

**Solution 1: Upgrade Deprecated Technologies**

Update ARCHITECTURE.md Section 8:
- Java 8 → Java 17 LTS
- .NET Core 2.x → .NET 6 or 7
- Angular 11 → Angular 12+

**Solution 2: Document Exception (if upgrade not feasible)**

If stuck with deprecated tech temporarily:

1. Create ADR in Section 12:
```markdown
### ADR-005: Temporary Use of Java 8

**Status:** Accepted (temporary exception)
**Date:** 2025-11-28

**Context:**
Legacy codebase requires Java 8 for compatibility with third-party library.

**Decision:**
Continue using Java 8 until library migrates to Java 11+ (Q2 2026).

**Mitigation:**
- Security patches applied monthly
- Migration plan documented with timeline
- New services use Java 17
```

2. Reference ADR in Development Architecture contract LADES2 section

**Solution 3: Request Formal Exception**

For unapproved technologies:
1. Document business justification in ADR
2. Submit to Architecture Review Board
3. If approved, document in LADES2.2

---

### Q: Naming conventions validation UNKNOWN

**Symptoms:**
- Item: "Does naming follow standards?" → ❓ UNKNOWN
- Recommendation: "Document naming conventions"

**Solutions:**

**Solution 1: Add Naming Conventions to Section 8**

```markdown
### 8.6 Naming Conventions

**Repositories:**
- Pattern: `<domain>-<service>-<component>`
- Example: `scheduling-executor-service`

**Kubernetes Resources:**
- Pattern: `<env>-<service>-<resource-type>`
- Example: `prod-scheduler-deployment`

**Databases:**
- Tables: `snake_case` (e.g., `job_executions`)
- Columns: `snake_case` (e.g., `created_at`)
```

**Solution 2: Reference Organizational Standards**

```markdown
### 8.6 Naming Conventions

All naming follows organizational standards documented in:
- Repository naming: [Internal Wiki - Repo Standards]
- Kubernetes naming: [K8s Governance Doc v2.3]
- Database naming: [DBA Guidelines - PostgreSQL]
```

---

## Performance Issues

### Q: Skills are slow to activate (>10 seconds)

**Symptoms:**
- Long delay after `/skill architecture-docs`
- "Loading..." message for extended time

**Solutions:**

**Solution 1: Reduce Document Size**

For large ARCHITECTURE.md files (>5,000 lines):
- Split into multiple files per section
- Use Document Index for targeted loading
- Load sections incrementally

**Solution 2: Clear Claude Cache**
```bash
rm -rf ~/.claude/cache/*
```

**Solution 3: Check System Resources**
```bash
# Check available memory
free -h

# Check CPU usage
top
```

If resources constrained, close other applications.

---

### Q: Compliance generation takes >5 minutes

**Symptoms:**
- Generating 11 contracts takes very long
- High CPU usage
- System becomes unresponsive

**Solutions:**

**Solution 1: Generate Contracts Individually**

Instead of all 11 at once:
```
/skill architecture-compliance
> Which contracts? Arquitectura SRE

# Wait for completion, then generate next
/skill architecture-compliance
> Which contracts? Cloud Architecture
```

**Solution 2: Simplify ARCHITECTURE.md**

If document is extremely large (>10,000 lines):
- Remove excessive detail from sections
- Focus on essential information
- Use references to external docs instead of inline content

**Solution 3: Check Document Index**

Verify Document Index is up to date:
```bash
# Lines 1-50 should show all 12 sections
head -50 ARCHITECTURE.md
```

If outdated, regenerate:
```
/skill architecture-docs
> Update Document Index only
```

---

## Frequently Asked Questions

### General Questions

#### Q: Can I customize the templates?

**A:** v1.0.0 uses templates as-is. Template customization will be available in v1.1.0.

**Workaround:** After generation, manually edit compliance documents to match your organization's specific format.

---

#### Q: Can I use this for non-enterprise projects?

**A:** Yes! The workflow scales:
- **Small projects:** Skip Phase 1 (PO Spec), create minimal ARCHITECTURE.md
- **Personal projects:** Use only architecture-docs skill
- **Open source:** Generate relevant compliance contracts (Security, Integration)

---

#### Q: How do I handle multiple projects?

**A:** Each project should have its own directory:
```
projects/
├── project-a/
│   ├── PRODUCT_OWNER_SPEC.md
│   ├── ARCHITECTURE.md
│   └── compliance-docs/
├── project-b/
│   ├── PRODUCT_OWNER_SPEC.md
│   ├── ARCHITECTURE.md
│   └── compliance-docs/
```

Run skills from each project directory.

---

#### Q: What if my architecture uses unapproved technology?

**A:** Two paths:

**Path 1: Formal Exception** (recommended)
1. Document justification in ADR (Section 12)
2. Include in Development Architecture contract LADES2
3. Submit to Architecture Review Board
4. If approved, document exception and timeline

**Path 2: Migration Plan**
1. Create ADR with migration timeline
2. Document interim risks and mitigations
3. Track migration progress in LADES2

---

#### Q: Can I version control compliance documents?

**A:** Yes (recommended):
```bash
git add ARCHITECTURE.md compliance-docs/
git commit -m "docs: Update architecture and regenerate compliance v2.1"
git tag v2.1-architecture
```

Benefits:
- Audit trail
- Version history
- Rollback capability
- Team collaboration

---

### Technical Questions

#### Q: Why is my PO Spec score low (<7.5)?

**A:** Common reasons:

1. **Missing Success Criteria** (Weight: 15%)
   - Add quantitative metrics
   - Define acceptance criteria

2. **Incomplete User Stories** (Weight: 20%)
   - Add more Priority 1 stories
   - Use proper format: "As a..., I want..., so that..."

3. **Vague Business Context** (Weight: 20%)
   - Quantify problem statement
   - Document current vs desired state

Review scoring in `PO_SPEC_SCORING_GUIDE.md` for details.

---

#### Q: What's the difference between SKILL.md and guide files?

**A:**
- **SKILL.md**: Activation triggers, skill metadata (required for Claude Code to recognize skill)
- **Guide files**: Templates and reference documentation (e.g., PRODUCT_OWNER_SPEC_GUIDE.md, ARCHITECTURE_DOCUMENTATION_GUIDE.md)

Both are necessary for full skill functionality.

---

#### Q: How do I know which sections to update for higher completeness?

**A:** Check the completion report in COMPLIANCE_MANIFEST.md:

```markdown
## Summary
Total Placeholders: 37

Top Missing Data Points:
1. RTO/RPO (appears in 5 contracts) → Add to Section 11.3
2. Security controls (appears in 3 contracts) → Add to Section 9
3. Integration auth methods (appears in 2 contracts) → Add to Section 7
```

Prioritize fixing data points that appear in multiple contracts.

---

#### Q: Can I generate compliance docs before ARCHITECTURE.md is complete?

**A:** Yes, but with caveats:

**Partial generation possible if:**
- Document Index exists (lines 1-50)
- Specific sections complete (e.g., Section 8 for Development Architecture)

**Expect:**
- Lower completeness (50-70%)
- Many [PLACEHOLDER] markers
- Need to regenerate after completing ARCHITECTURE.md

**Best practice:** Complete ARCHITECTURE.md to 80%+ before generating compliance docs.

---

### Workflow Questions

#### Q: Can I skip the PO Spec phase?

**A:** Yes, for:
- Small features
- Internal tools
- Proof of concepts
- Well-understood requirements

**Recommendation:** Even for small projects, create a minimal PO Spec (2-3 pages) to document context.

---

#### Q: What if I only need specific compliance contracts?

**A:** Generate selectively:
```
/skill architecture-compliance
> Which contracts? Security

# Or by contract name
> Which contracts? Arquitectura Seguridad
```

Available categories: security, cloud, SRE, development, data, integration, enterprise

---

#### Q: How often should I regenerate compliance documents?

**A:** Regenerate when:
- ARCHITECTURE.md changes significantly (new components, tech stack changes)
- Before compliance reviews or audits
- After addressing validation failures
- Quarterly (best practice for active projects)

**Automation:** Set up CI/CD to regenerate on ARCHITECTURE.md commits.

---

## Getting More Help

### Documentation Resources

- **[Installation Guide](INSTALLATION.md):** Setup and installation issues
- **[Quick Start](QUICK_START.md):** First-time usage tutorial
- **[Workflow Guide](WORKFLOW_GUIDE.md):** Complete workflow documentation
- **Examples:** `/examples/` directory for sample outputs

### Community Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/shadowx4fox/solutions-architect-skills/issues)
- **Discussions:** Ask questions in [GitHub Discussions](https://github.com/shadowx4fox/solutions-architect-skills/discussions)

### Reporting Bugs

When opening an issue, include:

1. **Plugin version:** From `/plugin list`
2. **Claude Code version:** From Help → About
3. **Operating system:** macOS, Linux, Windows (WSL)
4. **Error message:** Full error text or screenshot
5. **Steps to reproduce:** Minimal commands to trigger issue
6. **Expected behavior:** What should happen
7. **Actual behavior:** What actually happens

**Example:**
```
**Plugin version:** 1.0.0
**Claude Code version:** 1.5.3
**OS:** macOS 14.1

**Error:** Stack validation shows all UNKNOWN

**Steps:**
1. /skill architecture-compliance
2. Select "Development Architecture"
3. Generate contract

**Expected:** PASS/FAIL statuses for stack items
**Actual:** All items show UNKNOWN

**ARCHITECTURE.md Section 8:** (paste relevant lines)
```

---

**Still stuck?** Check [GitHub Issues](https://github.com/shadowx4fox/solutions-architect-skills/issues) or open a new issue with detailed information.