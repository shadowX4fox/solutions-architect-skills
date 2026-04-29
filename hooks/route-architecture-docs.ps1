# hooks/route-architecture-docs.ps1
#
# PowerShell wrapper around route-architecture-docs.ts (Windows PowerShell 5.x
# and PowerShell Core / pwsh on any OS). Resolves its own directory via
# $PSScriptRoot so the parent settings.json entry can pass an absolute path
# that does not depend on `~` expansion.
#
# Companion wrappers:
#   - route-architecture-docs.sh   (Linux, macOS, WSL, Git Bash)
#   - route-architecture-docs.cmd  (Windows native cmd.exe)
#
# Invoked by Claude Code as: pwsh -NoProfile -File "<abs-path>\hooks\route-architecture-docs.ps1"

$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot 'route-architecture-docs.ts'
& bun $scriptPath @args
exit $LASTEXITCODE
