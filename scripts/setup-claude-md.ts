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

### Routing doc reads through \`architecture-explorer\` (v3.16.0+)

The plugin ships a universal \`sa-skills:architecture-explorer\` sub-agent (Haiku-tier) that is the canonical front door for **any** workflow that consumes more than two architecture files. It has **two mutually exclusive modes** — pick one based on what you need:

- **Manifest mode** — invoke with \`project_root: <abs path>\` and **no \`query\`**. The agent walks the canonical layout (\`ARCHITECTURE.md\` + \`docs/\` + \`adr/\`), extracts \`<!-- EXPLORER_HEADER -->\` metadata, and emits an \`EXPLORE_MANIFEST\` listing every file in the corpus with its \`key_concepts\`, \`technologies\`, \`related_adrs\`, etc. Use this when you want to drive your own selection across the whole corpus.
- **Findings mode** — invoke with \`project_root: <abs path>\` AND \`query: <topic or question>\`. The agent runs Explore-agent-style content discovery — parallel \`Grep\` across the canonical surface for each search term, parallel \`Read\` for surrounding heading context on each match, and emits an \`EXPLORE_FINDINGS\` block listing the matched files, line numbers, headings, and 3–5-line excerpts. **No manifest enumeration in this mode** — the output focuses entirely on what was asked. The explorer **does not answer the question** — it surfaces evidence; you synthesize.

**When to use which mode:**

- **Compliance / analysis / dev-handoff** — the corresponding sa-skills skill invokes the explorer in **findings mode** automatically (per-contract / per-analysis / per-component fan-out, each call keyed on a hardcoded vocabulary \`query\`). You don't need to call it directly; just trust the skill's flow.
- **Peer-review / ADR creation** — these skills invoke the explorer in **manifest mode** for corpus overview before drilling in. Same hands-off contract.
- **Free-form architecture Q&A** ("what does our architecture say about X?", "how does Y work?", "where do we discuss Z?") — invoke in **findings mode** with the user's question as \`query\`. Read the findings to answer; if findings are sparse, re-run in manifest mode for a corpus overview and pick further files.
- **Bulk doc work spanning ≥3 files with no specific question** — manifest mode, then drive your own selection from \`key_concepts\` / \`technologies\` / \`related_adrs\` per file.

#### When to (re-)trigger \`architecture-explorer\` — decision tree

Once the explorer has run in a conversation, the resulting \`EXPLORE_MANIFEST\` or \`EXPLORE_FINDINGS\` block and the files it pointed to are still in context — re-running it on every follow-up turn is wasteful. Use this decision tree before answering any architecture Q&A:

1. **No prior explorer output in this conversation** → spawn the explorer. Always. Pick the mode that fits the request: findings mode for question-shaped requests, manifest mode for plain enumeration.
2. **Prior \`EXPLORE_MANIFEST\` exists, new request asks a specific question** → re-trigger in findings mode. Manifest mode does not surface line-level evidence; findings mode does.
3. **Prior \`EXPLORE_FINDINGS\` exists, new question is the same scope or a narrower subset** ("give me a brief version") → skip the explorer, answer from already-loaded files.
4. **Prior \`EXPLORE_FINDINGS\` exists, new question is adjacent or shifted scope** → re-trigger in findings mode with the new \`query\`.
5. **Prior \`EXPLORE_FINDINGS\` exists but the user now wants a corpus overview (no specific question)** → re-trigger in manifest mode.
6. **You've Edited or Written any \`docs/**/*.md\` or \`adr/**/*.md\` since the prior run** → re-trigger to refresh.
7. **In doubt** → trigger. The Haiku-tier walk is cheap insurance against grounding an answer in stale or wrongly-scoped docs.

**Permanent exceptions** (never trigger the explorer):

- Another sa-skills skill is already running (compliance, analysis, peer-review, dev-handoff, ADR creation, etc.) — it invokes the explorer itself; do not double-call.
- The user names a single specific file path to read.
- The question is about a fact already stated in the current conversation, not a doc lookup.

**EXPLORER_HEADER blocks** — each \`docs/NN-*.md\` and \`docs/components/**/*.md\` file should carry a 5–10 line \`<!-- EXPLORER_HEADER ... -->\` block right after the H1 listing key concepts, technologies, components, scope, and related ADRs. These are the metadata the explorer surfaces in the manifest. If your docs predate v3.14.0 or look stale, run \`/regenerate-explorer-headers\` (or \`--dry-run\` first) to backfill them. \`ARCHITECTURE.md\` is exempt — it's a navigation index, no header needed.

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