#!/usr/bin/env sh
# hooks/prose-hook.sh — PreToolUse / PostToolUse on Write | Edit: the prose contract at the moment of writing (8.115.0).
#
# Hands the hook input on stdin to skills/architecture-docs/scripts/prose-hook.js with the event (`pre` | `post`).
# The script decides whether the file is an architecture document (ARCHITECTURE.md, docs/**, project ADRs and TDRs
# of a directory holding ARCHITECTURE.md) and is silent otherwise. No bun on PATH: exit 0 — a missing runtime never
# blocks a write; the gates still run the same rules afterwards.
command -v bun >/dev/null 2>&1 || exit 0
exec bun "$(dirname "$0")/../skills/architecture-docs/scripts/prose-hook.js" "$1"
