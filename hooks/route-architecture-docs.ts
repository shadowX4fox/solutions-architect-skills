#!/usr/bin/env bun
// hooks/route-architecture-docs.ts
//
// UserPromptSubmit hook (sa-skills v3.21.0+; ports v3.19.0 POSIX shell version).
// When the project has ARCHITECTURE.md, inject a system-reminder telling
// Claude that any architecture-related action MUST route through the
// matching sa-skills:architecture-* skill instead of direct file edits.
//
// Cost: one stat() + Bun startup (~10–20 ms cold). No LLM call. Never blocks
// the user's prompt — only ever appends additionalContext.
//
// Cross-platform replacement for the v3.19.0 `.sh` version. Works on Linux,
// macOS, Windows native (cmd / PowerShell), WSL, and Git Bash without a
// POSIX shell or `cat`/heredoc dependency. The only requirement is that
// `bun` is on PATH, which is already a hard dep for the plugin (Bash(bun *)).

import { existsSync } from "fs";
import { resolve } from "path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const archMd = resolve(projectDir, "ARCHITECTURE.md");

// Fast path: no ARCHITECTURE.md → exit silently with no output.
if (!existsSync(archMd)) {
  process.exit(0);
}

// Architecture is governed by sa-skills. Emit additionalContext via the
// documented UserPromptSubmit JSON shape so Claude Code injects it
// verbatim ahead of the user's prompt.
const payload = {
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext:
      "ARCHITECTURE-GOVERNED PROJECT — this project has ARCHITECTURE.md at the project root, which means architecture is governed by the sa-skills plugin. ALL architecture-related actions MUST route through the matching sa-skills:architecture-* skill: editing ARCHITECTURE.md / docs/**/*.md / docs/components/**/*.md / adr/**/*.md → architecture-docs (or architecture-component-guardian for docs/components/README.md, architecture-definition-record for adr/*.md); answering questions about the documented architecture → architecture-docs; generating diagrams → architecture-docs Workflow 8; releasing or bumping the architecture version → architecture-docs Workflow 10; compliance contracts → architecture-compliance; peer review → architecture-peer-review; dev handoff → architecture-dev-handoff. Do NOT make raw Edit/Write calls on those files without invoking the relevant skill first; the skills enforce validation gates (Section 3 enforcement, downstream propagation, source attribution, semver bump, drift detection) that direct edits silently skip. The project's CLAUDE.md and the SKILL.md descriptions list which user phrasing routes to which skill.",
  },
};

console.log(JSON.stringify(payload));
