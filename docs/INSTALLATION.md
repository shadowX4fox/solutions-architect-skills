# Installation Guide

Complete guide to installing the Solutions Architect Skills plugin for Claude Code.

## System Requirements

### Supported Platforms
- **macOS** (10.15 Catalina or later)
- **Linux** (Ubuntu 20.04+, Fedora 34+, or equivalent)
- **Windows** (10/11 with WSL2 recommended)

### Prerequisites
- **Claude Code** (latest version)
- **Terminal/Shell** access
- **Internet connection** (for downloading release)
- **~2 MB disk space** for plugin files

## Understanding Marketplaces & Plugins

**What is a Marketplace?**

A Claude Code Marketplace is a catalog repository containing metadata about available plugins. You add a marketplace once, then can discover and install any plugins listed in it.

**What is a Plugin?**

A Claude Code Plugin is a repository containing skills and tools that extend Claude Code's functionality. This plugin contains 3 architecture documentation skills.

**Learn More:**
- [Claude Code Marketplace Documentation](https://docs.anthropic.com/claude/docs/claude-code-marketplaces)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)

---

## Installation Methods

### Method 1: Using Claude Code Marketplace (Recommended)

This is the easiest and official method for installing plugins in Claude Code.

#### Step 1: Add Marketplace

In Claude Code, run:

```
/plugin marketplace add https://github.com/shadowX4fox/shadowx4fox-marketplace
```

This adds the shadowX4fox marketplace which contains a catalog of available plugins.

#### Step 2: Install Plugin

```
/plugin install solutions-architect-skills
```

Claude Code will automatically clone and install the plugin.

#### Step 3: Verify Installation

```
/plugin list
```

You should see:
```
solutions-architect-skills v1.0.0
```

**Advantages:**
- Official Claude Code installation method
- No manual file operations needed
- Integrated with Claude Code plugin system
- Automatic updates available

**Note:** The marketplace repository (`shadowx4fox-marketplace`) contains a catalog of plugins. You add the marketplace once, then can install any plugin listed in it.

---

### Method 2: Direct Git Clone

Clone the repository directly to your plugins directory.

#### Step 1: Clone Repository

```bash
git clone https://github.com/shadowX4fox/solutions-architect-skills.git ~/.claude/plugins/solutions-architect-skills
```

This clones the repository directly to the correct location.

#### Step 2: Restart Claude Code

Completely restart Claude Code to load the new plugin.

#### Step 3: Verify Installation

In Claude Code, run:

```
/plugin list
```

You should see:
```
solutions-architect-skills v1.0.0
```

**To Update Later:**
```bash
cd ~/.claude/plugins/solutions-architect-skills
git pull origin main
# Restart Claude Code
```

**Advantages:**
- No ZIP download or extraction needed
- Easy to update with `git pull`
- Maintains Git connection for contributors

---

### Method 3: Download from GitHub Releases

Download and install from a release ZIP file.

#### Step 1: Download Release Package

Visit the [releases page](https://github.com/shadowx4fox/solutions-architect-skills/releases) and download the latest version:

```bash
# Using wget
wget https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v1.0.0/solutions-architect-skills-v1.0.0.zip

# Or using curl
curl -LO https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v1.0.0/solutions-architect-skills-v1.0.0.zip
```

#### Step 2: Extract the ZIP File

```bash
unzip solutions-architect-skills-v1.0.0.zip
```

This creates a `solutions-architect-skills/` directory with all plugin files.

#### Step 3: Install to Claude Code Plugins Directory

```bash
# Create plugins directory if it doesn't exist
mkdir -p ~/.claude/plugins

# Move plugin to Claude plugins directory
mv solutions-architect-skills ~/.claude/plugins/
```

#### Step 4: Restart Claude Code

Completely restart Claude Code to load the new plugin.

#### Step 5: Verify Installation

In Claude Code, run:

```
/plugin list
```

You should see:
```
solutions-architect-skills v1.0.0
```

**Advantages:**
- Familiar download and extract process
- Works without Git installed
- Official release packages
- Includes SHA256 checksum for verification

---

## Verification Checklist

After installation, verify all skills are available:

### 1. Check Plugin Installation

```
/plugin list
```

**Expected output:**
- `solutions-architect-skills v1.0.0` appears in the list

### 2. Verify Architecture Readiness Skill

```
/skill architecture-readiness
```

**Expected behavior:**
- Skill activates successfully
- You see prompts about creating Product Owner Specifications

### 3. Verify Architecture Docs Skill

```
/skill architecture-docs
```

**Expected behavior:**
- Skill activates successfully
- You see prompts about ARCHITECTURE.md creation

### 4. Verify Architecture Compliance Skill

```
/skill architecture-compliance
```

**Expected behavior:**
- Skill activates successfully
- You see prompts about generating compliance documents

### 5. Check File Structure

Verify plugin files are in place:

```bash
ls -la ~/.claude/plugins/solutions-architect-skills/
```

**Expected structure:**
```
.claude-plugin/
skills/
  architecture-readiness/
  architecture-docs/
  architecture-compliance/
docs/
examples/
README.md
LICENSE
CHANGELOG.md
```

## Troubleshooting

### Issue: Plugin Not Appearing in List

**Symptom:** `/plugin list` doesn't show `solutions-architect-skills`

**Solutions:**

1. **Verify plugin location:**
   ```bash
   ls ~/.claude/plugins/solutions-architect-skills/.claude-plugin/plugin.json
   ```
   - If file doesn't exist, plugin is not installed correctly
   - Reinstall following Method 1

2. **Check plugin.json validity:**
   ```bash
   cat ~/.claude/plugins/solutions-architect-skills/.claude-plugin/plugin.json
   ```
   - Verify JSON is valid (no syntax errors)

3. **Restart Claude Code completely:**
   - Close all Claude Code windows/instances
   - Restart application
   - Wait 10 seconds before checking `/plugin list`

4. **Check permissions:**
   ```bash
   chmod -R 755 ~/.claude/plugins/solutions-architect-skills
   ```

### Issue: Skills Not Activating

**Symptom:** `/skill architecture-readiness` doesn't work

**Solutions:**

1. **Verify skill files exist:**
   ```bash
   ls ~/.claude/plugins/solutions-architect-skills/skills/architecture-readiness/SKILL.md
   ```

2. **Check file permissions:**
   ```bash
   chmod 644 ~/.claude/plugins/solutions-architect-skills/skills/*/SKILL.md
   ```

3. **Try full skill path:**
   ```
   /skill solutions-architect-skills/architecture-readiness
   ```

4. **Reinstall plugin:**
   - Remove: `rm -rf ~/.claude/plugins/solutions-architect-skills`
   - Reinstall following Method 1

### Issue: Templates Not Loading

**Symptom:** Compliance generation fails or templates missing

**Solutions:**

1. **Verify template files:**
   ```bash
   ls ~/.claude/plugins/solutions-architect-skills/skills/architecture-compliance/templates/
   ```
   - Should show 11 `TEMPLATE_*.md` files

2. **Check file integrity:**
   ```bash
   find ~/.claude/plugins/solutions-architect-skills/skills -name "*.md" | wc -l
   ```
   - Should return `24`

3. **Reinstall if count incorrect:**
   - Download fresh release
   - Extract and reinstall

### Issue: Permission Denied Errors

**Symptom:** Errors when running skills or generating documents

**Solutions:**

1. **Fix plugin permissions:**
   ```bash
   chmod -R 755 ~/.claude/plugins/solutions-architect-skills
   find ~/.claude/plugins/solutions-architect-skills -type f -exec chmod 644 {} \;
   ```

2. **Fix output directory permissions:**
   ```bash
   # If generating compliance docs in current directory
   chmod 755 .
   ```

### Issue: Old Version Persisting

**Symptom:** Plugin still shows old version after update

**Solutions:**

1. **Remove old version completely:**
   ```bash
   rm -rf ~/.claude/plugins/solutions-architect-skills
   ```

2. **Clear Claude Code cache (if applicable):**
   ```bash
   rm -rf ~/.claude/cache/*
   ```

3. **Reinstall latest version:**
   - Download latest release
   - Extract and install
   - Restart Claude Code

## Uninstallation

To remove the plugin:

```bash
# Remove plugin directory
rm -rf ~/.claude/plugins/solutions-architect-skills

# Restart Claude Code
```

Verify removal:
```
/plugin list
```

`solutions-architect-skills` should no longer appear.

## Upgrading to New Version

### Upgrade Process

1. **Download new version:**
   ```bash
   wget https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v1.1.0/solutions-architect-skills-v1.1.0.zip
   ```

2. **Backup current configuration (optional):**
   ```bash
   cp -r ~/.claude/plugins/solutions-architect-skills ~/.claude/plugins/solutions-architect-skills-backup
   ```

3. **Remove old version:**
   ```bash
   rm -rf ~/.claude/plugins/solutions-architect-skills
   ```

4. **Install new version:**
   ```bash
   unzip solutions-architect-skills-v1.1.0.zip
   mv solutions-architect-skills ~/.claude/plugins/
   ```

5. **Restart Claude Code**

6. **Verify new version:**
   ```
   /plugin list
   ```

### Version-Specific Upgrade Notes

Check [CHANGELOG.md](../CHANGELOG.md) for version-specific upgrade instructions and breaking changes.

## Platform-Specific Notes

### macOS

- Plugin directory: `~/.claude/plugins/`
- No additional dependencies required
- Works on Apple Silicon (M1/M2) and Intel Macs

### Linux

- Plugin directory: `~/.claude/plugins/`
- Ensure `unzip` is installed: `sudo apt install unzip` (Ubuntu/Debian)
- If using Snap version of Claude Code, plugin directory may differ

### Windows (WSL2)

- Use WSL2 for best compatibility
- Plugin directory: `~/.claude/plugins/` (within WSL)
- Windows native path: `\\wsl$\Ubuntu\home\<username>\.claude\plugins\`

## Advanced Configuration

### Custom Installation Location

If you need to install to a custom location:

1. **Install to custom directory:**
   ```bash
   mkdir -p /path/to/custom/location
   mv solutions-architect-skills /path/to/custom/location/
   ```

2. **Create symlink:**
   ```bash
   ln -s /path/to/custom/location/solutions-architect-skills ~/.claude/plugins/solutions-architect-skills
   ```

3. **Restart Claude Code**

### Multiple Environments

To use different versions in different environments:

```bash
# Development environment
ln -s ~/dev/solutions-architect-skills-dev ~/.claude/plugins/solutions-architect-skills

# Production environment
ln -s ~/prod/solutions-architect-skills-v1.0.0 ~/.claude/plugins/solutions-architect-skills
```

Switch by changing the symlink and restarting Claude Code.

## Getting Help

If you encounter issues not covered here:

1. **Check Troubleshooting Guide:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **Review Examples:** [examples/](../examples/) directory
3. **Search Issues:** [GitHub Issues](https://github.com/shadowx4fox/solutions-architect-skills/issues)
4. **Open New Issue:** Provide detailed error messages and system info

## Next Steps

After successful installation:

1. **Read Quick Start:** [QUICK_START.md](QUICK_START.md) - 5-minute tutorial
2. **Learn Workflow:** [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - Complete guide
3. **Explore Examples:** Check `examples/` directory for sample outputs

---

**Installation complete!** You're ready to transform your architecture documentation workflow.