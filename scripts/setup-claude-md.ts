#!/usr/bin/env bun
// scripts/setup-claude-md.ts
// Usage: bun scripts/setup-claude-md.ts <project_cwd>
//
// Manages a marker-delimited "sa-skills architecture pointer" block in the
// project's ./CLAUDE.md. Non-destructive: only the content between the markers
// is ever written. On re-run, the block is replaced in place; surrounding
// content is preserved byte-for-byte.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const [projectCwd] = process.argv.slice(2);

if (!projectCwd) {
  console.error("Usage: bun scripts/setup-claude-md.ts <project_cwd>");
  process.exit(2);
}

const claudeMdPath = join(projectCwd, "CLAUDE.md");

const BEGIN = "<!-- sa-skills:architecture-pointer:begin -->";
const END = "<!-- sa-skills:architecture-pointer:end -->";

const blockBody = `## Architecture Documentation (sa-skills)

This project uses the [sa-skills](https://github.com/shadowX4fox/solutions-architect-skills) plugin for architecture documentation. When answering architecture questions, reading this project's context, or generating architecture-adjacent content, treat the following as authoritative sources:

- **\`ARCHITECTURE.md\`** (project root) — the **entry point**. A navigation index (~130 lines) that lists every architecture section and its file under \`docs/\`. Always start here. (The plugin's \`architecture-explorer\` reads this file in full; you should too.)
- **\`docs/\`** — the architecture split into section files (\`docs/01-system-overview.md\`, \`docs/02-context.md\`, \`docs/03-architecture-layers.md\`, …). Resolve a section by reading the navigation table in \`ARCHITECTURE.md\`, then opening the referenced \`docs/NN-name.md\`.
- **\`docs/components/\`** — per-component descriptors (C4 Level 2). \`docs/components/README.md\` is the component index.
- **\`adr/\`** — Architecture Decision Records. Read the relevant ADR before proposing changes that touch a recorded decision.
- **\`handoffs/\`** — Component Development Handoffs (implementation specs for dev teams).

When referencing an architecture section, quote its **internal section number** (e.g., "Section 7"), not the file prefix number.

### Routing doc reads through \`architecture-explorer\` (v3.14.0+)

The plugin ships a universal \`sa-skills:architecture-explorer\` sub-agent (Haiku-tier classifier) that is the canonical front door for **any** workflow that consumes more than two architecture files. It reads \`agents/configs/explorer/<task_type>.json\`, scans the first 60 lines + headings of every candidate doc (with \`ARCHITECTURE.md\` read in full as the navigation index), and returns an \`EXPLORE_RESULT\` allowlist of relevant files plus detected gaps. Cache hits cost zero Haiku tokens.

**When to use it:**

- **Compliance / analysis / peer-review / dev-handoff / ADR creation** — the corresponding sa-skills skill invokes the explorer automatically. You don't need to call it directly; just trust the skill's flow.
- **Free-form architecture Q&A** — when the user asks "what does our architecture say about X?" or "how does Y work?", prefer spawning \`sa-skills:architecture-explorer\` with \`task_type: architecture-question\` (config: \`agents/configs/explorer/architecture-question.json\`) and the user's question terms passed as \`extra_terms\`. Read only the files listed in \`EXPLORE_RESULT.relevant_files[]\`. Avoid bulk-reading the whole \`docs/\` tree by hand — that's the redundant-read pattern the explorer was designed to eliminate.
- **Bulk doc work spanning ≥3 files** — same pattern. The explorer keeps your context window flat regardless of project size.

**EXPLORER_HEADER blocks** — each \`docs/NN-*.md\` and \`docs/components/**/*.md\` file should carry a 5–10 line \`<!-- EXPLORER_HEADER ... -->\` block right after the H1 listing key concepts, technologies, components, scope, and related ADRs. These are what the classifier scores against in the first 60 lines. If your docs predate v3.14.0 or look stale, run \`/regenerate-explorer-headers\` (or \`--dry-run\` first) to backfill them. \`ARCHITECTURE.md\` is exempt — it's a navigation index, no header needed.

To bootstrap or update these documents, invoke the appropriate sa-skills skill (see the plugin's \`docs/WORKFLOW_GUIDE.md\`).`;

const managedBlock = `${BEGIN}\n${blockBody}\n${END}`;

type Outcome = "Created" | "Appended" | "Updated" | "Unchanged";
let outcome: Outcome;

if (!existsSync(claudeMdPath)) {
  const initial = `# CLAUDE.md\n\nThis file provides project-level guidance to Claude Code.\n\n${managedBlock}\n`;
  writeFileSync(claudeMdPath, initial, "utf8");
  outcome = "Created";
} else {
  const current = readFileSync(claudeMdPath, "utf8");
  const beginIdx = current.indexOf(BEGIN);
  const endIdx = current.indexOf(END);

  if (beginIdx === -1 || endIdx === -1) {
    const separator = current.endsWith("\n") ? "\n" : "\n\n";
    const next = current + separator + managedBlock + "\n";
    writeFileSync(claudeMdPath, next, "utf8");
    outcome = "Appended";
  } else if (endIdx < beginIdx) {
    console.error(
      `❌ CLAUDE.md has sa-skills markers in the wrong order (end before begin). Fix the file manually and rerun /setup.`
    );
    process.exit(1);
  } else {
    const before = current.slice(0, beginIdx);
    const after = current.slice(endIdx + END.length);
    const next = before + managedBlock + after;
    if (next === current) {
      outcome = "Unchanged";
    } else {
      writeFileSync(claudeMdPath, next, "utf8");
      outcome = "Updated";
    }
  }
}

const icon = outcome === "Unchanged" ? "✅" : "✅";
console.log(`${icon} CLAUDE.md architecture pointer: ${outcome}`);
console.log(`   Path: ${claudeMdPath}`);
if (outcome === "Created") {
  console.log(`   Wrote new CLAUDE.md with the managed block.`);
} else if (outcome === "Appended") {
  console.log(`   Appended the managed block to your existing CLAUDE.md.`);
} else if (outcome === "Updated") {
  console.log(`   Replaced the existing managed block in place. Surrounding content preserved.`);
} else {
  console.log(`   Managed block already up to date — no changes written.`);
}