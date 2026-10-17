# Installation Guide

Complete guide to installing the Solutions Architect Skills plugin for Claude Code.

## Step 1 — Install the full suite

The suite is six plugins from one marketplace: **sa-skills** (architecture, component index),
**sa-records** (ADRs, TDRs), **sa-requirements** (the PO Spec and its capability alignment — BIAN for banking, a cross-industry map, or a pack's framework), **sa-analysis** (risk analyses, traceability),
**sa-delivery** (handoff kit, Word export, IcePanel) and **sa-visualization** (the 3D command center).
Installing sa-skills installs the other five. What belongs to one organization (its design language, compliance
contracts, brand) ships separately as an [institution pack](INSTITUTION_PACKS.md). Requires [Bun](#installing-bun).

**From a terminal:**

```bash
claude plugin marketplace add shadowX4fox/solutions-architect-skills
claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user
claude plugin list   # sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery, sa-visualization — all ✔ enabled
```

Then, in Claude Code: `/reload-plugins`, and `/sa-skills:setup` once in each project (permissions, `.gitignore`,
`CLAUDE.md` pointers, docgen and judge checks).

**Or paste this into another Claude Code instance** — it installs, repairs what is missing and verifies:

```text
Install the Solutions Architect Skills suite for me, from a shell (the `claude` CLI):
1. If `claude plugin marketplace list` does not show shadowx4fox-solution-architect-marketplace, run
   `claude plugin marketplace add shadowX4fox/solutions-architect-skills`; if it does, run
   `claude plugin marketplace update shadowx4fox-solution-architect-marketplace`.
2. If `claude plugin list` does not show sa-skills@shadowx4fox-solution-architect-marketplace, run
   `claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user` (it brings sa-records,
   sa-requirements, sa-analysis, sa-delivery, sa-visualization). If it does, run `claude plugin update <name>@shadowx4fox-solution-architect-marketplace --scope user`
   for each of sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery and sa-visualization — an update touches only the plugin it names.
3. Run `claude plugin list`. For any "Dependency <name>@… is not installed", run
   `claude plugin install <name>@shadowx4fox-solution-architect-marketplace --scope user`; if sa-adr is listed, run
   `claude plugin uninstall sa-adr@shadowx4fox-solution-architect-marketplace` (it was renamed sa-records).
   Repeat until all five show ✔ enabled.
4. Run `bun --version`; if Bun is missing, tell me the install command for my OS and stop.
5. Report the five plugins with their versions, then tell me to run /reload-plugins and, in each project, /sa-skills:setup.
```

Only part of the suite: `sa-records` alone for an institutional ADR catalog repository, `sa-requirements` alone for a
Product Owner — `claude plugin install <plugin>@shadowx4fox-solution-architect-marketplace --scope user`.

The rest of this guide covers each step in detail — requirements, permissions, verification, upgrades.

## System Requirements

### Supported Platforms
- **macOS** (10.15 Catalina or later)
- **Linux** (Ubuntu 20.04+, Fedora 34+, or equivalent)
- **Windows** (10/11 with WSL2 recommended)

### Prerequisites
- **Claude Code** (latest version)
- **Bun** (v1.0.0 or later) - **REQUIRED** — every script the skills run is a `bun` command
- **Terminal/Shell** access
- **Internet connection** (for downloading release)
- **~2 MB disk space** for plugin files

### Installing Bun

**Bun is required** for the skills to function properly. It powers the architecture reader, the gates, the payload cutters and renderers, and document export.

#### macOS & Linux

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

Expected output: `1.0.0` or later

#### Windows (native cmd / PowerShell)

**Recommended — npm global install** (most reliable on every Windows version):

```powershell
npm install -g bun
```

This requires Node.js. The npm global install sidesteps the PowerShell execution-policy restrictions, corporate proxy issues, and signed-script enforcement that occasionally trip the official `irm` one-liner in enterprise environments. Because npm is already trusted in your PowerShell profile if Node.js is installed, no additional permission prompts are needed.

**Alternative — official PowerShell installer:**

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Use this when Node.js is not installed and you don't want to install it just for Bun. Note: requires PowerShell execution policy `RemoteSigned` or `Unrestricted` (default in interactive PowerShell sessions, but corporate Group Policy may force `Restricted`).

**Verify** (either path):

```powershell
bun --version
```

Expected: `1.0.0` or later. If `bun` is not on PATH after install, sign out and back in so the user PATH update takes effect.

#### Windows + WSL2 or Git Bash

Use the macOS/Linux instructions above. The plugin works identically inside WSL2 or Git Bash because both expose a POSIX userland — `curl -fsSL https://bun.sh/install | bash` is the standard install command in either environment.

#### Alternative: Using Package Managers

**macOS (Homebrew):**
```bash
brew install oven-sh/bun/bun
```

**Linux (Snap):**
```bash
sudo snap install bun-js
```

**Windows (npm)** — see the recommended path above; `npm install -g bun` is the preferred Windows-native install.

**Verify Installation:**
```bash
# Check Bun is accessible
which bun
# Output: /home/username/.bun/bin/bun (or similar)

# Test Bun works
bun --version
# Output: 1.x.x
```

**Learn More:**
- [Official Bun Installation Guide](https://bun.sh/docs/installation)
- [Bun Documentation](https://bun.sh/docs)

---

### Why Bun is Required

Bun is the one runtime of every script the skills run — `node` is not supported. Most workflow steps are code, not model passes:

1. **The architecture reader** — the component facts, the facts ledger, the explorer and its header gate (`scripts/shared/`)
2. **The gates** — prose, principle, diagram (`mermaid-check.js`, `label-check.js`), flow and integration checks that run after every write
3. **The payload cutters and renderers** — section payloads for Workflow 1, analysis payloads and `render-analysis.js`, the handoff kit, the command center scene, the SA export assembler
4. **The judge** (`scripts/judge.js`) — every semantic verdict a script asks
5. **Document export** — `tools/docgen` (Word, PDF, Mermaid pictures)
6. **The cross-platform helpers** (`scripts/today.ts`, `ensure-dir.ts`, `remove-glob.ts`) — dates, directories and file operations without POSIX shell-outs

The routing hook (UserPromptSubmit) does not need Bun — it is native shell / cmd / PowerShell.

**Without Bun installed**, every skill step that runs a script fails with:
```
Error: bun command not found
```

---

## Permissions Setup

> **Required for the skills' agents.**

Claude Code plugin agents cannot use `permissionMode` frontmatter (it is silently ignored). You must grant Bash and Agent permissions in your project's `.claude/settings.json`.

**Why these permissions are needed:**
- `Bash(bun *)` — every script the skills run (date stamps, directories and file operations included) is a `bun` command
- `Bash(rg *)` — every search instruction the skills hand the model is an `rg` command
- `Bash(git clone *)`, `Bash(git -C .cache/sa-skills/adr-catalog *)` — the institutional ADR catalog import and sync clone and refresh the catalog at that fixed project-local path, and nowhere else
- `Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/**)`, `Read(~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/**)` — skills read their templates and guides from the installed plugins
- `Read(.cache/sa-skills/**)`, `Edit(.cache/sa-skills/**)` — agents stage handoff payloads, and IcePanel JSON snapshots in this project-local cache dir. Path is project-relative (no `//` prefix), so the same permission entry works identically on Linux, macOS, Windows native, WSL, and Git Bash. The dir is auto-gitignored by `setup-gitignore.ts`
- `Read`/`Edit` on `exports/*`, `analysis/*`, `visualizations/*`, `handoffs/**`, `BIAN_ALIGNMENT.md`, `CAPABILITY_ALIGNMENT.md` — the output locations of exports, analysis reports, command-center scenes, handoff kit and capability alignment
- `Read(**/skills/architecture-dev-handoff/SKILL.md)` — the skills locate each other's guides by pattern
- `Agent(<plugin>:<role>:<agent>)` — allows Claude to spawn the sub-agents without manual approval prompts. Agents are addressed by the plugin that ships them and their role (`generators`, `reviewers`): `sa-skills:…` for the architecture, handoff and export agents, `sa-records:generators:*` for the ADR agents
- `WebSearch` — the analysis agent looks up technology end-of-life dates

> **Important**: Three permission format rules:
> 1. Use `Bash(command *)` with a **space** (e.g. `Bash(bun *)`). The `*` wildcard matches across `/` path separators so absolute paths work. The `:*` colon syntax is legacy/deprecated.
> 2. Use project-relative paths whenever possible (e.g. `Read(.cache/sa-skills/**)`) — they are OS-agnostic. A single leading `/` is treated as relative to the project root; the `//` double-slash prefix is only needed for true absolute paths and is rarely required by sa-skills as of the project-local cache migration.
> 3. File rules are `Read(path)` and `Edit(path)` only. `Read` covers every file-reading tool (Read, Glob, Grep) and `Edit` every file-editing tool (Edit, Write). Claude Code ignores a `Write(path)` or `Glob(path)` rule and warns at startup; `/setup` rewrites any it finds (8.118.3).

### Add Permissions to Your Project Settings

Create or update `.claude/settings.json` in your project root:

```json
{
  "permissions": {
    "allow": [
      "Bash(bun *)",
      "Bash(rg *)",
      "Bash(git clone *)",
      "Bash(git -C .cache/sa-skills/adr-catalog *)",
      "Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/**)",
      "Read(~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/**)",
      "Read(**/skills/architecture-dev-handoff/SKILL.md)",
      "Read(.cache/sa-skills/**)",
      "Edit(.cache/sa-skills/**)",
      "Agent(sa-analysis:reviewers:architecture-analysis-agent)",
      "Agent(sa-skills:reviewers:principle-quality-reviewer)",
      "Agent(sa-delivery:generators:ekonte-generator)",
      "Agent(sa-delivery:generators:settei-generator)",
      "Agent(sa-delivery:generators:seam-generator)",
      "Agent(sa-skills:generators:segment-runner)",
      "Agent(sa-records:generators:adr-writer)",
      "Agent(sa-delivery:generators:cutsheet-generator)",
      "Agent(sa-delivery:generators:handoff-asset-generator)",
      "Agent(sa-delivery:generators:docs-export-generator)",
      "Edit(exports/*)",
      "Read(exports/*)",
      "Edit(analysis/*)",
      "Read(analysis/*)",
      "Edit(visualizations/*)",
      "Read(visualizations/*)",
      "Edit(handoffs/**)",
      "Read(handoffs/**)",
      "Edit(handoffs/.manifest.json)",
      "Read(handoffs/.manifest.json)",
      "Edit(BIAN_ALIGNMENT.md)",
      "Read(BIAN_ALIGNMENT.md)",
      "WebSearch"
    ]
  }
}
```

> The list above is kept in sync with `.claude/settings.json.example` in the plugin repo,
> which is what `/sa-skills:setup` merges for you. Prefer running that command over
> copying this block by hand.

If the file already exists, merge the `permissions.allow` array with any existing entries.

**Restart Claude Code** after saving to apply the permissions.

---

## Understanding Marketplaces & Plugins

**What is a Marketplace?**

A Claude Code Marketplace is a catalog repository containing metadata about available plugins. You add a marketplace once, then can discover and install any plugins listed in it.

**What is a Plugin?**

A Claude Code Plugin is a set of skills, agents and tools that extend Claude Code's functionality. The `shadowx4fox-solution-architect-marketplace` publishes six plugins (and the optional `sa-ux`), 15 skills and 12 sub-agents between them:

| Plugin | Version | Ships |
|---|---|---|
| `sa-skills` | 10.1.0 | Architecture authoring, the component index, explorer headers, the judge and docgen — depends on the other five |
| `sa-records` | 10.1.0 | ADRs (including catalog mode for an institutional ADR catalog) and TDRs |
| `sa-requirements` | 10.1.0 | The Product Owner Specification (`architecture-readiness`) and its BIAN alignment (`architecture-capability-alignment`: BIAN, the cross-industry map, or a pack's framework) |
| `sa-analysis` | 10.1.0 | The ten risk analyses and the Security Posture (`architecture-analysis`), and PO Spec coverage (`architecture-traceability`) — reads the architecture through sa-skills |
| `sa-delivery` | 10.1.0 | The four-part handoff kit and its validated assets (`architecture-dev-handoff`), Word exports (`architecture-docs-export`), the IcePanel sync (`architecture-icepanel-sync`) and the MCP index bundle with build packs (`architecture-index-export`) — reads the architecture through sa-skills, renders through its `tools/docgen`, validates contracts with its npm packages |
| `sa-visualization` | 10.1.0 | The 3D Architecture Command Center (`architecture-command-center`) — Alia, findings on the stage, the load simulation — reads the architecture through sa-skills |

Skills are invoked by the plugin that ships them: `sa-skills:architecture-docs`, `sa-records:architecture-definition-record`, `sa-records:technical-debt-records`, `sa-requirements:architecture-readiness`, `sa-requirements:architecture-capability-alignment`, `sa-analysis:architecture-analysis`, `sa-analysis:architecture-traceability`, `sa-delivery:architecture-dev-handoff`, `sa-delivery:architecture-docs-export`, `sa-delivery:architecture-icepanel-sync`, `sa-delivery:architecture-index-export`, `sa-visualization:architecture-command-center`.

**Learn More:**
- [Claude Code Marketplace Documentation](https://docs.anthropic.com/claude/docs/claude-code-marketplaces)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)

---

## Installation Methods

### Method 1: Using Claude Code Marketplace (Recommended)

This is the easiest and official method for installing plugins in Claude Code.

#### Step 1: Register Marketplace (One-Time Setup)

**IMPORTANT:** Marketplace registration is a manual security step. You must explicitly register the marketplace before installing plugins.

**Option A: Using Command (Quick)**

In Claude Code, run:

```
/plugin marketplace add shadowX4fox/solutions-architect-skills
```

This registers the `shadowx4fox-solution-architect-marketplace` which is hosted in this plugin repository.

**Option B: Using Settings File (Project Configuration)**

Create or update `.claude/settings.json` in your project:

```json
{
  "extraKnownMarketplaces": {
    "shadowx4fox-solution-architect-marketplace": {
      "source": {
        "source": "github",
        "repo": "shadowX4fox/solutions-architect-skills"
      }
    }
  }
}
```

Restart Claude Code after adding the marketplace.

**Verify Marketplace Registration:**

```
/plugin marketplace list
```

You should see `shadowx4fox-solution-architect-marketplace` in the list.

#### Step 2: Install Plugin

After registering the marketplace, install the plugin:

```
/plugin install sa-skills@shadowx4fox-solution-architect-marketplace
```

`sa-skills` declares `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery` and `sa-visualization` as dependencies, so this one install brings all six plugins.

**OR** enable in your project's `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "sa-skills@shadowx4fox-solution-architect-marketplace": true,
    "sa-records@shadowx4fox-solution-architect-marketplace": true,
    "sa-requirements@shadowx4fox-solution-architect-marketplace": true,
    "sa-analysis@shadowx4fox-solution-architect-marketplace": true,
    "sa-delivery@shadowx4fox-solution-architect-marketplace": true,
    "sa-visualization@shadowx4fox-solution-architect-marketplace": true
  }
}
```

Claude Code will automatically install the plugins.

**Installing one plugin alone** — two roles do not need the architecture plugin:

| Who | Install | What works |
|---|---|---|
| A Product Owner, before any architecture exists | `/plugin install sa-requirements@shadowx4fox-solution-architect-marketplace` | `sa-requirements:architecture-readiness` — elicit, score and write the PO Spec; `sa-requirements:architecture-capability-alignment` — map it onto a capability framework (BIAN, cross-industry, a pack's) |
| An institutional ADR catalog repository (no `ARCHITECTURE.md`) | `/plugin install sa-records@shadowx4fox-solution-architect-marketplace` | `sa-records:architecture-definition-record` in catalog mode, and `sa-records:technical-debt-records` |

Their optional steps that use sa-skills' tools — prose checks, the PO Spec distribution PDF (rendered by `tools/docgen`), the PO Spec sync with the architecture — warn or skip when sa-skills is absent, and capability alignment, whose judge is sa-skills', ranks by term overlap instead and says so. `sa-analysis`, `sa-delivery` and `sa-visualization` are not installed alone: they need sa-skills at runtime (the judge and the architecture reader).

#### Step 3: Verify Installation

```bash
claude plugin list
```

You should see six plugins from the marketplace, each `✔ enabled`, among them:
```
  ❯ sa-records@shadowx4fox-solution-architect-marketplace
    Version: 10.1.0
    …
  ❯ sa-requirements@shadowx4fox-solution-architect-marketplace
    Version: 10.1.0
    …
  ❯ sa-skills@shadowx4fox-solution-architect-marketplace
    Version: 10.1.0
    …
```

A plugin that shows `✘ failed to load — Dependency "<name>@…" is not installed` is missing a dependency: install the plugin it names.

`claude plugin details sa-skills@shadowx4fox-solution-architect-marketplace` lists a plugin's skills, agents and commands.

**Advantages:**
- Official Claude Code installation method
- No manual file operations needed
- Integrated with Claude Code plugin system
- Automatic update discovery
- Secure: Explicit marketplace registration required

**Note:** The marketplace is hosted within the plugin repository at `.claude-plugin/marketplace.json`. This is a security feature - users must explicitly trust and add marketplaces before installing plugins from them.

---

### Method 2: Direct Git Clone

> **Legacy layout.** A clone into `~/.claude/plugins/solutions-architect-skills/` predates the four-plugin marketplace: it is not recorded in Claude Code's install registry, so neither the dependency resolution nor `plugin-root.ts` (which every skill uses to find its plugin) sees it. Use Method 1 unless you are working on the plugin itself.

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

You should see `sa-skills` at version 10.1.0.

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

> **Legacy layout.** The ZIP installs into the same `~/.claude/plugins/solutions-architect-skills/` layout as Method 2, with the same limits. The ZIP carries the three dependency plugins under `plugins/`, but nothing installs them as plugins. Use Method 1 unless you have no access to GitHub from Claude Code.

Download and install from a release ZIP file.

#### Step 1: Download Release Package

Visit the [releases page](https://github.com/shadowx4fox/solutions-architect-skills/releases) and download the latest version:

Set `VERSION` to the tag you are installing — the current release is `10.1.0`:

```bash
VERSION=10.1.0

# Using wget
wget https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v${VERSION}/solutions-architect-skills-v${VERSION}.zip

# Or using curl
curl -LO https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v${VERSION}/solutions-architect-skills-v${VERSION}.zip
```

#### Step 2: Extract the ZIP File

```bash
unzip solutions-architect-skills-v${VERSION}.zip
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

You should see `sa-skills` at version 10.1.0.

**Advantages:**
- Familiar download and extract process
- Works without Git installed
- Official release packages
- Includes SHA256 checksum for verification

---

## Verification Checklist

After installation, verify all prerequisites and skills are available:

### 1. Verify Bun Installation

**IMPORTANT:** Check Bun is installed before using the plugin:

```bash
bun --version
```

**Expected output:**
- `1.0.0` or later

**If Bun is not installed:**
- See [Installing Bun](#installing-bun) section above
- No skill will work without Bun

### 2. Check Plugin Installation

```bash
claude plugin list
```

**Expected output:**
- Six plugins from `shadowx4fox-solution-architect-marketplace`, each `✔ enabled` at 10.1.0: `sa-skills`, `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery` and `sa-visualization` (the plugin ids are `sa-*`; the repository is `solutions-architect-skills`)
- A plugin installed alone (`sa-requirements` or `sa-records`) appears by itself

### 3. Verify Architecture Readiness Skill

```
/skill sa-requirements:architecture-readiness
```

**Expected behavior:**
- Skill activates successfully
- You see prompts about creating Product Owner Specifications

### 4. Verify Architecture Docs Skill

```
/skill sa-skills:architecture-docs
```

**Expected behavior:**
- Skill activates successfully
- You see prompts about ARCHITECTURE.md creation

### 5. Check Plugin Contents and Location

List what each plugin ships:

```bash
claude plugin details sa-skills@shadowx4fox-solution-architect-marketplace
claude plugin details sa-records@shadowx4fox-solution-architect-marketplace
```

Each plugin is installed to `~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/<plugin>/<version>/`. Print the directory in use for a plugin (read from Claude Code's install registry; honours `CLAUDE_CONFIG_DIR`):

```bash
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts                          # sa-skills
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-records
```

It warns on stderr when a newer version is on the machine than the one the session loaded.

### 6. Verify the Export Toolchain

Word and PDF export rest on four packages, and three of them fail quietly — the export succeeds and
the deliverable is degraded. Run the report from the sa-skills plugin directory:

```bash
cd "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts)"
bun install                     # installs docx, pdfmake and mermaid-cli
bun scripts/setup-docgen.ts
```

**Expected:**
```
Export toolchain (tools/docgen):

  ✓ docx (Word output) — installed
  ✓ pdfmake (PDF output) — installed
  ✓ mermaid-cli (diagrams as pictures) — …/node_modules/.bin/mmdc
  ✓ browser for Puppeteer (end-to-end render) — rendered a 244×348 PNG

  Every diagram in an export renders as a picture.
```

| Line | Meaning when it is `⬜` |
|---|---|
| `docx` | **no `.docx` export at all** — this one is required |
| `pdfmake` | `--format pdf` fails; the automatic PO Spec distribution PDF is skipped with a warning |
| `mermaid-cli` | every diagram exports as monospace source instead of a picture |
| browser | `mmdc` is installed but cannot render — diagrams still export as source |

`pdfmake` and `@mermaid-js/mermaid-cli` are `optionalDependencies`, so `bun install` fetches them and
a machine that cannot build one still gets a working Word path. **Bun does not run Puppeteer's
post-install browser download**, so the browser is the one piece `bun install` cannot supply:

```bash
bunx puppeteer browsers install chrome
# …or point at a browser already on the machine:
export PUPPETEER_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

The browser line is a **real render**, not a presence check — an `mmdc` that resolves and cannot reach
a browser passes any lookup and fails on the first export. `/setup` runs this report at Step 7.

Treat the last two lines as required on any machine that produces stakeholder briefings: the Solution
Architecture briefing opens on a single C4 Level 1 diagram, and a reader who gets `flowchart TB` in
Courier New gets nothing.

### 8. Detect ripgrep

Every search instruction the plugin hands the model is an `rg` command run through Bash, and
Claude Code's built-in Grep tool ships its own ripgrep unless `USE_BUILTIN_RIPGREP=0` points it at
the one on PATH. `/sa-skills:setup` Step 8 runs the report and configures the project from it:

```bash
bun scripts/setup-ripgrep.ts /path/to/your/project/.claude/settings.json
```

**Expected:**
```
ripgrep
  ✅ ripgrep on PATH: /usr/bin/rg — ripgrep 14.1.0
  ✅ PCRE2 in ripgrep: PCRE2 10.42 is available (JIT is available)
  ✅ Grep tool binary: USE_BUILTIN_RIPGREP=0 written to the project settings — the Grep tool uses /usr/bin/rg. Scopes — …
  ✅ Bash(rg *) in project permissions: present
```

With no ripgrep on PATH the first line carries the install command for your package manager
(`sudo apt-get install ripgrep`, `brew install ripgrep`, `winget install BurntSushi.ripgrep.MSVC`, …),
nothing is written, and the skills' searches fail with `rg: command not found` until it is there —
the built-in Grep tool keeps working on the bundled binary either way. A value already set at user
scope (`~/.claude/settings.json`) or in the project is reported and never overridden. `--dry-run`
reports without writing, `--json` is the structured form, `--strict` makes a missing ripgrep a
non-zero exit for CI.

## Troubleshooting

### Issue: Bun Not Found

**Symptom:** A skill step fails with `bun: command not found`

**Solutions:**

1. **Install Bun:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Add Bun to PATH (if installed but not found):**
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or ~/.profile
   export BUN_INSTALL="$HOME/.bun"
   export PATH="$BUN_INSTALL/bin:$PATH"

   # Reload shell configuration
   source ~/.bashrc  # or ~/.zshrc
   ```

3. **Verify Bun installation:**
   ```bash
   which bun
   bun --version
   ```

4. **Restart terminal:**
   - Close and reopen terminal
   - Verify `bun --version` works

### Issue: Bun Installed But Not Working

**Symptom:** `bun --version` shows version but a skill step fails

**Solutions:**

1. **Test Bun directly** with a one-line script:
   ```bash
   bun -e 'console.log("ok")'
   ```

2. **Check that sa-skills is installed** — the other plugins need it at runtime (the judge and the architecture reader):
   ```bash
   claude plugin list
   ```

3. **Reinstall Bun:**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

### Issue: Plugin Not Appearing in List

**Symptom:** `claude plugin list` doesn't show `sa-skills` (or one of `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery`, `sa-visualization`), or shows it `✘ failed to load`

**Solutions:**

1. **Verify the marketplace is registered:**
   ```bash
   claude plugin marketplace list
   ```
   - `shadowx4fox-solution-architect-marketplace` must appear; if not, follow Method 1 Step 1

2. **Install what is missing:**
   ```bash
   claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user
   ```
   - `✘ failed to load — Dependency "<name>@…" is not installed` names the plugin to install: `claude plugin install <name>@shadowx4fox-solution-architect-marketplace` with the same scope

3. **Reload or restart Claude Code:**
   - Run `/reload-plugins` in the running session, or close all Claude Code windows/instances and restart

### Issue: Skills Not Activating

**Symptom:** `/skill architecture-readiness` doesn't work

**Solutions:**

1. **Verify the plugin that ships the skill is installed** — `architecture-readiness` ships in `sa-requirements`:
   ```bash
   claude plugin details sa-requirements@shadowx4fox-solution-architect-marketplace
   ```

2. **Try the full skill name** (the plugin that ships it, then the skill):
   ```
   /skill sa-requirements:architecture-readiness
   ```

3. **Reinstall the plugin:**
   ```bash
   claude plugin uninstall sa-requirements@shadowx4fox-solution-architect-marketplace
   claude plugin install sa-requirements@shadowx4fox-solution-architect-marketplace
   ```
   then `/reload-plugins`

### Issue: Permission Denied Errors

**Symptom:** Errors when running skills or generating documents

**Solutions:**

1. **Check the permission grants** — a prompt or a denial on a Bash, Read, Write or Agent call means the grant is missing from `.claude/settings.json`; run `/sa-skills:setup`, which merges the grants from `.claude/settings.json.example` (see [Permissions Setup](#permissions-setup))

2. **Fix output directory permissions:**
   ```bash
   # If generating documents in the current directory
   chmod 755 .
   ```

### Issue: Agents Prompt for Permission

**Symptom:** A skill prompts you to approve Bash commands or agent spawning for each agent.

**Cause:** Plugin agents cannot use `permissionMode: bypassPermissions` in frontmatter — it is silently ignored by Claude Code. Bash and Agent permissions must be granted via `.claude/settings.json`.

**Solution:** Run `/sa-skills:setup`, or create or update `.claude/settings.json` in your project root with the full permissions block from the [Permissions Setup](#permissions-setup) section above. Then restart Claude Code.

---

### Issue: Old Version Persisting

**Symptom:** Plugin still shows old version after update

**Solutions:**

1. **Update each plugin by name** — `claude plugin update` updates only the plugin it names (see [Upgrading to New Version](#upgrading-to-new-version))

2. **Reload the session:** a running session keeps the version it loaded at startup; run `/reload-plugins` or restart Claude Code

3. **Check which copy a skill resolves:** `plugin-root.ts` (see [Verification Checklist](#verification-checklist) step 5) prints the directory in use and warns when a newer version is on the machine. A project-scope install overrides the user-scope one for that project — update it with `--scope project`

## Uninstallation

To remove the plugins, uninstall each by name (sa-skills first, since it depends on the other five):

```bash
claude plugin uninstall sa-skills@shadowx4fox-solution-architect-marketplace
claude plugin uninstall sa-analysis@shadowx4fox-solution-architect-marketplace
claude plugin uninstall sa-delivery@shadowx4fox-solution-architect-marketplace
claude plugin uninstall sa-visualization@shadowx4fox-solution-architect-marketplace
claude plugin uninstall sa-requirements@shadowx4fox-solution-architect-marketplace
claude plugin uninstall sa-records@shadowx4fox-solution-architect-marketplace
```

Pass `--scope project` for a project-scope install. For the legacy direct-clone or ZIP layout, remove `~/.claude/plugins/solutions-architect-skills` instead.

Verify removal:
```bash
claude plugin list
```

No `sa-*` plugin from `shadowx4fox-solution-architect-marketplace` should appear.

## Upgrading to New Version

### Marketplace upgrade (recommended)

`claude plugin update` updates **only the plugin it names**: it neither updates the installed dependencies nor installs a
dependency a new version adds. Update each plugin by name, with the scope it was installed at:

```bash
claude plugin marketplace update shadowx4fox-solution-architect-marketplace
claude plugin update sa-skills@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-records@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-requirements@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-analysis@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-delivery@shadowx4fox-solution-architect-marketplace --scope user
claude plugin update sa-visualization@shadowx4fox-solution-architect-marketplace --scope user
claude plugin list
```

Use `--scope project` for a project-scope install. Then:

1. **Install any dependency the list names as missing.** If `claude plugin list` shows sa-skills as
   `✘ failed to load — Dependency "<name>@shadowx4fox-solution-architect-marketplace" is not installed`, run
   `claude plugin install <name>@shadowx4fox-solution-architect-marketplace` with the same scope — `sa-records`
   (a dependency since 8.97.0), `sa-requirements` (since 8.98.0), `sa-analysis` (since 8.125.0), `sa-delivery` (since 8.128.0), `sa-visualization` (since 8.129.0).
2. **Coming from 8.96.0**, uninstall `sa-adr`, which 8.97.0 renamed `sa-records`:
   `claude plugin uninstall sa-adr@shadowx4fox-solution-architect-marketplace`.
3. **Coming from 8.99.0 or earlier**, BIAN alignment now ships in `sa-requirements` (`sa-requirements:architecture-capability-alignment`):
   the `sa-requirements` update above is what brings it — sa-skills 8.100.0 no longer carries it.
   **Coming from 8.124.0 or earlier**, the analyses and traceability ship in `sa-analysis`
   (`sa-analysis:architecture-analysis`, `sa-analysis:architecture-traceability`): install it as in step 1.
   **Coming from 8.127.0 or earlier**, the handoff kit, the Word export and the IcePanel sync ship in
   `sa-delivery` (`sa-delivery:architecture-dev-handoff`, `…:architecture-docs-export`, `…:architecture-icepanel-sync`): install it as in step 1. `bun install` stays in sa-skills' directory — the contract checks load their validators from there.
   **Coming from 8.128.0 or earlier**, the command center ships in `sa-visualization`
   (`sa-visualization:architecture-command-center`): install it as in step 1.
4. Run `/reload-plugins`, then `/setup`, which updates the agent permission grants.

### ZIP upgrade (legacy layout)

1. **Download new version:**
   ```bash
   VERSION=10.1.0   # the release you are upgrading to
   wget https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v${VERSION}/solutions-architect-skills-v${VERSION}.zip
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
   unzip solutions-architect-skills-v${VERSION}.zip
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

Installed plugins live under `~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/<plugin>/<version>/`, and the marketplace clone under `~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/` (under `$CLAUDE_CONFIG_DIR/plugins/` when that variable is set).

### macOS

- Plugin directory: `~/.claude/plugins/`
- No additional dependencies required
- Works on Apple Silicon (M1/M2) and Intel Macs

### Linux

- Plugin directory: `~/.claude/plugins/`
- Ensure `unzip` is installed for the ZIP method: `sudo apt install unzip` (Ubuntu/Debian)
- If using Snap version of Claude Code, plugin directory may differ

### Windows (WSL2)

- Use WSL2 for best compatibility
- Plugin directory: `~/.claude/plugins/` (within WSL)
- Windows native path: `\\wsl$\Ubuntu\home\<username>\.claude\plugins\`

## Advanced Configuration

### Custom Installation Location

The two subsections below apply to the legacy direct-clone / ZIP layout only; a marketplace install's location is managed by Claude Code (set `CLAUDE_CONFIG_DIR` to move the whole config directory).

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
ln -s ~/prod/solutions-architect-skills-v8.99.0 ~/.claude/plugins/solutions-architect-skills
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

1. **Read Quick Start:** [QUICK_START.md](QUICK_START.md) - the first workflow, step by step
2. **Learn Workflow:** [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - Complete guide
3. **Explore Examples:** Check `examples/` directory for sample outputs

---

**Installation complete!** You're ready to transform your architecture documentation workflow.