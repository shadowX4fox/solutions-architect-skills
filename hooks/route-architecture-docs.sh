#!/usr/bin/env sh
# hooks/route-architecture-docs.sh
#
# POSIX shell wrapper around route-architecture-docs.ts (Linux, macOS, WSL,
# Git Bash on Windows). Resolves its own directory so the parent settings.json
# entry can pass an absolute path that does not depend on `~` expansion.
#
# Companion wrappers:
#   - route-architecture-docs.cmd  (Windows native cmd.exe)
#   - route-architecture-docs.ps1  (Windows PowerShell / pwsh on any OS)
#
# All three wrappers invoke the same TypeScript implementation; only the
# path-resolution dance differs per shell.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun "$SCRIPT_DIR/route-architecture-docs.ts" "$@"
