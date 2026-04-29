#!/usr/bin/env sh
# hooks/route-architecture-docs.sh
#
# UserPromptSubmit hook (sa-skills v3.19.0+).
# When the project has ARCHITECTURE.md, inject a system-reminder telling
# Claude that any architecture-related action MUST route through the
# matching sa-skills:architecture-* skill instead of direct file edits.
#
# Cost: one stat() + ~3-5 ms shell startup. No LLM call. Never blocks the
# user's prompt -- only ever appends additionalContext.

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# Fast path: no ARCHITECTURE.md -> exit silently with no output.
[ -f "$PROJECT_DIR/ARCHITECTURE.md" ] || exit 0

# Architecture is governed by sa-skills. Emit additionalContext via the
# documented UserPromptSubmit JSON shape so Claude Code injects it
# verbatim ahead of the user's prompt.
cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "ARCHITECTURE-GOVERNED PROJECT — this project has ARCHITECTURE.md at the project root, which means architecture is governed by the sa-skills plugin. ALL architecture-related actions MUST route through the matching sa-skills:architecture-* skill: editing ARCHITECTURE.md / docs/**/*.md / docs/components/**/*.md / adr/**/*.md → architecture-docs (or architecture-component-guardian for docs/components/README.md, architecture-definition-record for adr/*.md); answering questions about the documented architecture → architecture-docs; generating diagrams → architecture-docs Workflow 8; releasing or bumping the architecture version → architecture-docs Workflow 10; compliance contracts → architecture-compliance; peer review → architecture-peer-review; dev handoff → architecture-dev-handoff. Do NOT make raw Edit/Write calls on those files without invoking the relevant skill first; the skills enforce validation gates (Section 3 enforcement, downstream propagation, source attribution, semver bump, drift detection) that direct edits silently skip. The project's CLAUDE.md and the SKILL.md descriptions list which user phrasing routes to which skill."
  }
}
JSON
