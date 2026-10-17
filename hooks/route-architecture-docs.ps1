# hooks/route-architecture-docs.ps1
#
# UserPromptSubmit hook — PowerShell implementation (Windows PowerShell 5.x
# and PowerShell Core / pwsh on any OS). If <project_dir>/ARCHITECTURE.md
# exists, emit the static JSON payload at
# hooks/route-architecture-docs.payload.json. Otherwise exit 0 silently.
#
# No bun, no node, no JS runtime. The only requirements are PowerShell
# built-ins (Test-Path, Get-Content, Join-Path) — available in every
# Windows PowerShell since 5.1 and every PowerShell Core release.
# Cold start is sub-millisecond.
#
# The plugin's own hook (hooks/hooks.json) runs the .sh wrapper, through Git
# Bash on Windows. On Windows without Git Bash, scripts/setup-permissions.ts
# writes this one into the project's settings (8.100.1+) with
# `"shell": "powershell"`, by the marketplace clone's path. Companion wrappers
# (same payload.json file):
#   - route-architecture-docs.sh   (Linux, macOS, WSL, Git Bash — the plugin's hook)
#   - route-architecture-docs.cmd  (Windows native cmd.exe — needs `cmd //c`)
#
# Payload source of truth: hooks/route-architecture-docs.payload.json
# (single-line valid JSON; edit there, not in this script).
#
# Written by /setup as: { "shell": "powershell", "command": "& '<claude-dir>\plugins\marketplaces\<marketplace>\hooks\route-architecture-docs.ps1'" }

$ErrorActionPreference = 'Stop'

$projectDir = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }
$archMd = Join-Path $projectDir 'ARCHITECTURE.md'

# Fast path: no ARCHITECTURE.md → exit silently with no output.
if (-not (Test-Path -LiteralPath $archMd)) { exit 0 }

# Only a prompt the user typed (8.91.0): a sub-agent's hand-back or a task notification also fires this event.
$hookInput = try { [Console]::In.ReadToEnd() } catch { '' }
if ($hookInput -match '<task-notification>|\\u003ctask-notification|<agent-message|\\u003cagent-message|Another Claude session sent a message') { exit 0 }

$payload = Join-Path $PSScriptRoot 'route-architecture-docs.payload.json'
Get-Content -Raw -Encoding UTF8 -LiteralPath $payload
exit 0
