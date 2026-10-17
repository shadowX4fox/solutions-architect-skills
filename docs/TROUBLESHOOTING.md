# Troubleshooting Guide

Common issues and solutions for Solutions Architect Skills plugin.

## Table of Contents

1. [Marketplace & Plugin Issues](#marketplace--plugin-issues)
2. [Installation Issues](#installation-issues)
3. [Skill Activation Issues](#skill-activation-issues)
4. [Generation Issues](#generation-issues)
5. [Performance Issues](#performance-issues)
6. [FAQ](#frequently-asked-questions)

---

## Marketplace & Plugin Issues

### Q: Plugin Not Appearing After Marketplace Installation

**Symptoms:**
- Ran `/plugin install sa-skills@shadowx4fox-solution-architect-marketplace` but the plugin doesn't appear in `claude plugin list`
- No error messages shown

**Diagnosis:**
```bash
# Check if marketplace is added
/plugin marketplace list

# Check what is installed — sa-skills and its five dependencies (sa-records, sa-requirements, sa-analysis, sa-delivery, sa-visualization)
claude plugin list
```

**Solutions:**

**Solution 1: Verify Marketplace Added**
```bash
# Add marketplace if missing (the marketplace lives in the plugin's repository)
/plugin marketplace add shadowX4fox/solutions-architect-skills

# Refresh marketplace catalog
claude plugin marketplace update shadowx4fox-solution-architect-marketplace
```

**Solution 2: Restart Claude Code**
```bash
# Completely close and restart Claude Code (or run /reload-plugins)
claude plugin list
```

**Solution 3: Check Claude Code Logs**
```bash
# Check for installation errors
tail -f ~/.claude/logs/plugin-install.log
```

**Reference:** [Claude Code Marketplace Troubleshooting](https://docs.anthropic.com/claude/docs/claude-code-troubleshooting)

---

### Q: Skills Not Available After Installation

**Symptoms:**
- Plugin installed successfully (`claude plugin list` shows it)
- But `/skill sa-skills:architecture-docs` shows "skill not found"

**Diagnosis:**
```bash
# What the plugin ships (component inventory), and where each plugin is installed
claude plugin details sa-skills@shadowx4fox-solution-architect-marketplace
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements

# Check SKILL.md files have YAML frontmatter
head -n 5 "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts)/skills/architecture-docs/SKILL.md"
```

Skill names are qualified by the plugin that ships them: `sa-skills:architecture-docs`,
`sa-requirements:architecture-readiness`, `sa-records:architecture-definition-record`,
`sa-records:technical-debt-records`.

**Expected Output:**
```yaml
---
name: architecture-docs
description: Use this skill when creating, updating, or maintaining ARCHITECTURE.md files, when users ask about "my architecture documentation" or "architecture", or when answering questions about documented components, data structures, integrations, security, performance, deployment, technology stack, or architectural decisions
---
```

**Solutions:**

**Solution 1: Verify SKILL.md Frontmatter**
All SKILL.md files must have YAML frontmatter (lines 1-4). If missing:
```bash
# Reinstall plugin
/plugin uninstall sa-skills@shadowx4fox-solution-architect-marketplace
/plugin install sa-skills@shadowx4fox-solution-architect-marketplace
```

**Solution 2: Restart Claude Code**
```bash
# Skills are loaded at startup — restart, or run /reload-plugins
claude plugin list  # Verify plugin present after reload
```

**Solution 3: Check File Permissions**
```bash
PLUGIN_DIR="$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --quiet)"
chmod -R 755 "$PLUGIN_DIR"
find "$PLUGIN_DIR/skills" -name "SKILL.md" -exec chmod 644 {} \;
```

---

### Q: Marketplace URL Issues

**Symptoms:**
- `/plugin marketplace add` fails with URL error
- Error: "Invalid marketplace repository"

**Diagnosis:**
```bash
# Test marketplace URL accessibility
curl -I https://github.com/shadowX4fox/solutions-architect-skills
```

**Solutions:**

**Solution 1: Verify Correct URL**
```bash
# Correct source (the repository carries the marketplace)
/plugin marketplace add shadowX4fox/solutions-architect-skills

# The marketplace it registers is named shadowx4fox-solution-architect-marketplace;
# the plugins are sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery and sa-visualization
```

**Solution 2: Check Network Connectivity**
```bash
# Test GitHub connectivity
ping github.com

# Test with different network (e.g., switch from VPN to direct)
```

**Solution 3: Refresh Marketplace Cache**
```bash
claude plugin marketplace update shadowx4fox-solution-architect-marketplace
/plugin marketplace list
```

**Reference:** [Plugin Installation Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins#installation)

---

## Installation Issues

### Q: Plugin not appearing in `claude plugin list`

**Symptoms:**
- Run `claude plugin list` but `sa-skills` doesn't appear
- No errors shown

**Diagnosis:**
```bash
# The plugin's inventory, and where it is installed per Claude Code's install registry
claude plugin details sa-skills@shadowx4fox-solution-architect-marketplace
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --json
```

**Solutions:**

**Solution 1: Verify Installation Location**

A marketplace install copies each plugin to its own versioned directory:

```bash
~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/<plugin>/<version>/
    .claude-plugin/plugin.json
    skills/
    ...
```

`plugin-root.ts [--plugin <name>]` prints the directory in use (it honours `CLAUDE_CONFIG_DIR`). The cache keeps
every version ever installed, so never pick one by listing or globbing it. The old
`~/.claude/plugins/solutions-architect-skills/` direct-clone layout is legacy — reinstall from the marketplace.

**Solution 2: Check plugin.json Validity**
```bash
# Validate JSON syntax
jq . "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --quiet)/.claude-plugin/plugin.json"
```

If error appears, JSON is malformed. Reinstall plugin.

**Solution 3: Restart Claude Code**
- Close **all** Claude Code windows
- Wait 10 seconds
- Reopen Claude Code
- Run `claude plugin list` again

**Solution 4: Check Permissions**
```bash
# Fix permissions
PLUGIN_DIR="$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --quiet)"
chmod -R 755 "$PLUGIN_DIR"
chmod 644 "$PLUGIN_DIR/.claude-plugin/plugin.json"
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
- Updated the plugin but `claude plugin list` still shows the old version
- Old templates still being used

**Solutions:**

**Solution 1: Update every plugin by name**

`claude plugin update` updates only the plugin it names — never its installed dependencies. `sa-skills`,
`sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery` and `sa-visualization` move together.

```bash
claude plugin marketplace update shadowx4fox-solution-architect-marketplace
claude plugin update sa-skills@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-records@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-requirements@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-analysis@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-delivery@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-visualization@shadowx4fox-solution-architect-marketplace --scope user
```

Use the scope the plugin was installed with (`--scope project` for a project install). Then run `/reload-plugins`:
a running session keeps the version it loaded at startup.

**Solution 2: Verify the version in use**
```bash
claude plugin list
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts            # warns on stderr when a newer copy is installed
jq '.version' "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --quiet)/.claude-plugin/plugin.json"
```

---

### Q: `✘ failed to load — Dependency "<name>@shadowx4fox-solution-architect-marketplace" is not installed`

**Symptoms:**
- After `claude plugin update sa-skills@…`, `claude plugin list` shows sa-skills as
  `✘ failed to load — Dependency "<name>@shadowx4fox-solution-architect-marketplace" is not installed`
- sa-skills skills and commands are missing from the session

**Cause:** `sa-skills` declares `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery` and `sa-visualization` as dependencies. A fresh
`claude plugin install sa-skills@…` installs all six, but `claude plugin update` updates only the plugin named: it
does not install a dependency the new version adds (`sa-records` since 8.97.0, `sa-requirements` since 8.98.0,
`sa-analysis` since 8.125.0, `sa-delivery` since 8.128.0, `sa-visualization` since 8.129.0).

**Fix:**
```bash
# 1. Install the dependency the message names, with the same scope as sa-skills
claude plugin install <name>@shadowx4fox-solution-architect-marketplace --scope user

# 2. Update each plugin by name (see "Wrong version showing after update")

# 3. From 8.96.0 only: sa-adr was renamed sa-records — remove the old one
claude plugin uninstall sa-adr@shadowx4fox-solution-architect-marketplace
```

Then `/reload-plugins`, and `/setup` — it updates the agent permission grants
(`sa-records:generators:*`).

---

## Skill Activation Issues

### Q: `/skill architecture-readiness` doesn't work

**Symptoms:**
- Command not recognized
- "Skill not found" error
- No response from Claude Code

**Diagnosis:**
```bash
# architecture-readiness ships in the sa-requirements plugin — is it installed?
claude plugin list

# Check if SKILL.md exists
ls -lh "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements --quiet)"/skills/architecture-readiness/SKILL.md
```

**Solutions:**

**Solution 1: Use the Fully Qualified Skill Name**

The skill ships in the `sa-requirements` plugin (not `sa-skills`), and the separator is a colon:

```
/skill sa-requirements:architecture-readiness
```

If this works, plugin is installed but skill name collision exists.

**Solution 2: Verify the Plugin Is Installed**

`sa-requirements` is a dependency of `sa-skills`, but an update of `sa-skills` does not install it (see
"`✘ failed to load — Dependency … is not installed`" above). Install it alone for a Product Owner with no architecture:

```bash
claude plugin install sa-requirements@shadowx4fox-solution-architect-marketplace --scope user
```

**Solution 3: Check SKILL.md Format**
```bash
# First few lines should have YAML frontmatter
head -5 "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements --quiet)"/skills/architecture-readiness/SKILL.md
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
ls "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements --quiet)"/skills/architecture-readiness/
```

Should show:
- SKILL.md
- PRODUCT_OWNER_SPEC_GUIDE.md
- PO_SPEC_SCORING_GUIDE.md
- templates/PO_SPEC_TEMPLATE.md

**Solutions:**

**Solution 1: Verify All Files Present**
```bash
# List the skill's markdown files and compare with the list above
rg --files "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements --quiet)"/skills/architecture-readiness -g '*.md'
```

If any is missing, reinstall the plugin (`/plugin uninstall sa-requirements@shadowx4fox-solution-architect-marketplace`, then install it again).

**Solution 2: Check File Permissions**
```bash
# Make guides readable
find "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements --quiet)"/skills -name "*.md" -exec chmod 644 {} \;
```

---

### Q: Multiple skills with same name conflict

**Symptoms:**
- Wrong skill activates
- Unexpected behavior from skill commands

**Solutions:**

**Solution 1: Use the Fully Qualified Skill Name**

The plugin id is `sa-skills` (the repository is `solutions-architect-skills`), and the
separator is a colon. Skills shipped by the other plugins of the marketplace carry their plugin's id:

```
/skill sa-skills:architecture-docs
/skill sa-requirements:architecture-readiness
/skill sa-records:architecture-definition-record
/skill sa-records:technical-debt-records
```

**Solution 2: Rename Other Conflicting Plugin**

If another plugin has `architecture-docs` skill:
```bash
# List all plugins
claude plugin list

# Disable conflicting plugin temporarily
claude plugin disable other-plugin@<marketplace>

# Reload
/reload-plugins
```

---

## Generation Issues

### Q: ARCHITECTURE.md creation stopped before it finished

**Symptoms:**
- Workflow 1 wrote some of the `docs/` files and stopped
- The session ran out of context, or you closed it at a checkpoint

**Cause:** A create stops at four checkpoints by design (after the collection, and after each group of sections) so each segment starts in a clear session. Everything the next segment needs is on disk (`.cache/sa-skills/collect.json` and the progress file).

**Solution: continue it — never restart**

In a fresh session, in the project directory:
```
continue the architecture
```
(or `continúa la arquitectura`). The skill prints one receipt — progress, the collection, the files written — and resumes at the next item. It does not re-run the gates or ask the collection questions again.

With **automatic checkpoints** (chosen at the end of the collection) segments 2–4 run in sub-agents and the create does not stop between them.

---

### Q: The architecture index has no build packs

**Symptom**: `export-index.js` prints `build packs: 0` and `skipped <component>: kit-version <old>`, or CI publishes a release with search but no packs.

**Cause**: a build pack needs a handoff kit of exactly the architecture's version. `lifecycle.js apply` tags the release before a kit can carry that version, so at the tag no component has one.

**Fix**: regenerate the kit (`generate dev handoff`) and commit `handoffs/` on the release's branch without changing the architecture. CI exports the same version again, with its packs. `skipped <component>: kit-check fails on …` names the kit file that fails `kit-check.js`; `not in the kit` means the kit was generated for other components.

### Q: The index bundle is a draft

**Symptom**: `index: <project> <version> (draft)`; CI prints `is a draft here — … Not published.`

**Cause**: the bundle is released only while `ARCHITECTURE.md`, `docs/`, `adr/` and `tdr/` equal the tag `architecture-v<version>` and nothing there or in `handoffs/` is uncommitted. An edit after the release, a missing tag or `ARCHITECTURE_STATUS` other than Released makes it a draft.

**Fix**: release the edit (`/release-architecture`), or commit what is uncommitted. To publish a draft on purpose, run the pipeline with the draft option (`SA_INDEX_ALLOW_DRAFT=true`).

### Q: File encoding issues (special characters)

**Symptoms:**
- Spanish characters (á, é, í, ñ) display as �
- File names garbled

**Solutions:**

**Solution 1: Ensure UTF-8 Encoding**
```bash
# Check current encoding
file -i docs/*.md

# Convert to UTF-8 if needed
for f in docs/*.md; do
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

## Performance Issues

### Q: Skills are slow to activate (>10 seconds)

**Symptoms:**
- Long delay after `/skill sa-skills:architecture-docs`

**Solutions:**

**Solution 1: Start long workflows in a fresh session.** Creation and the handoff kit each carry a large working set; a session that already holds other work re-sends it on every call.

**Solution 2: Split a single-file architecture.** An old `ARCHITECTURE.md` that holds every section in one file is loaded whole. Migrate it to the `docs/` layout: `migrate my architecture` (Workflow 9).

**Solution 3: Check System Resources**
```bash
free -h
top
```

---

## Frequently Asked Questions

### General Questions

#### Q: Can I customize the templates?

**A:** The templates ship inside the plugins and are replaced on every update, so do not edit the installed copy. Organization-wide changes (a design language, compliance contracts, brand skins) ship as an [institution pack](INSTITUTION_PACKS.md); the architecture templates are `sa-skills`'. A single project's documents are yours to edit after generation — through the skills, so the gates run.

---

#### Q: Can I use this for non-enterprise projects?

**A:** Yes! The workflow scales:
- **Small projects:** Skip Phase 1 (PO Spec), create minimal ARCHITECTURE.md
- **Personal projects:** Use only architecture-docs skill
- **Open source:** Run the analyses that matter (STRIDE, Coupling)

---

#### Q: How do I handle multiple projects?

**A:** Each project should have its own directory:
```
projects/
├── project-a/
│   ├── PRODUCT_OWNER_SPEC.md
│   ├── BIAN_ALIGNMENT.md
│   ├── ARCHITECTURE.md
│   ├── docs/
│   └── adr/
├── project-b/
│   └── ...
```

Run the skills from each project directory, and run `/sa-skills:setup` once in each.

---

#### Q: What if my architecture uses unapproved technology?

**A:** Two paths:

**Path 1: Formal Exception** (recommended)
1. Record the decision as a project ADR (`adr/`, ADR-101+) with `sa-records:architecture-definition-record`
2. Submit it to the Architecture Review Board

**Path 2: Migration Plan**
1. Record the debt as a TDR with `sa-records:technical-debt-records` — its status moves `Open` → `Planned` → `In Progress` → `Resolved`
2. Document interim risks in `docs/10-risks-and-technical-debt.md`, linking the TDR

---

#### Q: Can I version control the architecture?

**A:** Yes (recommended). Release the architecture with `release my architecture` (`architecture-lifecycle`): it bumps the version, writes `docs/CHANGELOG.md` and tags `architecture-v<version>`. Generated artifacts carry the `Architecture Version` they were generated against, so commit them with the release:
```bash
git add handoffs/
git commit -m "docs: regenerate the handoff kit for architecture v2.1.0"
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

1. **Weak Use Cases (Section 4, highest weight: 2.5 pts)** — ensure primary flows, alternative flows, edge cases, and success metrics are documented; use case count should reflect the full architectural complexity
2. **Missing Business Constraints (Section 7, weight: 2.0 pts)** — document all budget, timeline, compliance, and integration constraints
3. **Thin Business Objectives (Section 3, weight: 1.5 pts)** — define measurable goals with quantified targets and ROI expectations
4. **Gaps in Medium-weight sections (Sections 1, 6, 8 — 1.0 pt each)** — Business Context, UX Requirements, and Success Metrics each contribute 1 point; partial coverage here commonly pushes scores below 7.5

For the full weighted rubric, section weights, and tier descriptors see `plugins/sa-requirements/skills/architecture-readiness/PO_SPEC_SCORING_GUIDE.md` (canonical rubric).

---

#### Q: What's the difference between SKILL.md and guide files?

**A:**
- **SKILL.md**: Activation triggers, skill metadata (required for Claude Code to recognize skill)
- **Guide files**: Templates and reference documentation (e.g., PRODUCT_OWNER_SPEC_GUIDE.md, ARCHITECTURE_DOCUMENTATION_GUIDE.md)

Both are necessary for full skill functionality.

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

#### Q: Where do compliance contracts come from?

**A:** Compliance contracts are organization-specific. They come from the compliance plugin an [institution pack](INSTITUTION_PACKS.md) installs, when the organization has one; the base ships none.

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

1. **Plugin version:** From `claude plugin list` (all six plugins move together on one version)
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

**Error:** A gate reports a section as missing

**Steps:**
1. /skill sa-skills:architecture-docs
2. Edit Section 8
3. Read the gate results

**Expected:** The gate passes
**Actual:** The gate names Section 8 as missing

**`docs/06-technology-stack.md` (Section 8):** (paste relevant lines)
```

---

**Still stuck?** Check [GitHub Issues](https://github.com/shadowx4fox/solutions-architect-skills/issues) or open a new issue with detailed information.