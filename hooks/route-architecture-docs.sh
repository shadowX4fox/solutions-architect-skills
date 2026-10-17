#!/usr/bin/env sh
# hooks/route-architecture-docs.sh
#
# UserPromptSubmit hook — POSIX sh implementation (Linux, macOS, WSL,
# Git Bash on Windows). If <project_dir>/ARCHITECTURE.md exists, emit
# the static JSON payload at hooks/route-architecture-docs.payload.json.
# Otherwise exit 0 silently.
#
# No bun, no node, no JS runtime. The only requirements are POSIX `sh`,
# `[` (test), and `cat` — all available by default on every POSIX system
# and on Git Bash / WSL on Windows. Cold start is sub-millisecond.
#
# This is the wrapper scripts/setup-permissions.ts writes on every OS,
# Windows included (v6.9.1+): Claude Code runs command hooks through Git
# Bash there whenever it is installed, and `cmd /c` breaks under MSYS path
# conversion. Companion wrappers (hand-wired only; same payload.json):
#   - route-architecture-docs.cmd  (Windows native cmd.exe — needs `cmd //c`)
#   - route-architecture-docs.ps1  (Windows PowerShell / pwsh, `"shell": "powershell"`)
#
# Payload source of truth: hooks/route-architecture-docs.payload.json
# (single-line valid JSON; edit there, not in this script).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# Fast path: no ARCHITECTURE.md → exit silently with no output.
[ -f "$PROJECT_DIR/ARCHITECTURE.md" ] || exit 0

# Only a prompt the user typed (8.91.0). Claude Code fires UserPromptSubmit for the turns a sub-agent's hand-back
# or a background task's notification opens as well, and each one carried this 1.6 KB payload into the session
# for good: 55 times on the 8.90.0 control run, whose 32 sub-agents each reported back. The hook's stdin is the
# event as JSON; a prompt that is a hand-back or a notification gets nothing.
input="$(cat 2>/dev/null || true)"
case "$input" in
  *'<task-notification>'*|*'\u003ctask-notification'*|*'<agent-message'*|*'\u003cagent-message'*|*'Another Claude session sent a message'*) exit 0 ;;
esac

cat "$SCRIPT_DIR/route-architecture-docs.payload.json"
