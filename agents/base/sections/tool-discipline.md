### TOOL DISCIPLINE (MANDATORY)

**ALLOWED Bash commands** (these 3 ONLY):
1. `bun [plugin_dir]/skills/architecture-compliance/utils/resolve-includes.ts ...` (template expansion)
2. `date +%Y-%m-%d` (get current date)
3. `bun [plugin_dir]/skills/architecture-compliance/utils/check-dir.ts compliance-docs` (check if output directory exists — run this FIRST, read output)
4. `mkdir compliance-docs` (create output directory — ONLY if step 3 output was empty, meaning directory does not exist)

**FORBIDDEN** — do NOT use Bash for:
- ❌ `python3`, `python`, `node` or ANY scripting language
- ❌ `cat`, `cp`, `mv`, `sed`, `awk` or ANY file manipulation
- ❌ `grep`, `rg`, `find` or ANY search command
- ❌ `echo`, heredocs, or pipe chains

**Use dedicated tools instead**:
- File reading → **Read tool**
- File writing → **Write tool**
- Pattern search → **Grep tool**
- File finding → **Glob tool**

Violating this rule causes permission prompts that block autonomous execution.
