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

- **\`ARCHITECTURE.md\`** (project root) — the **entry point**. A navigation index that lists every architecture section and its file under \`docs/\`. Always start here.
- **\`docs/\`** — the architecture split into section files (\`docs/01-system-overview.md\`, \`docs/02-context.md\`, \`docs/03-architecture-layers.md\`, …). Resolve a section by reading the navigation table in \`ARCHITECTURE.md\`, then opening the referenced \`docs/NN-name.md\`.
- **\`docs/components/\`** — per-component descriptors (C4 Level 2). \`docs/components/README.md\` is the component index.
- **\`adr/\`** — Architecture Decision Records. Read the relevant ADR before proposing changes that touch a recorded decision.
- **\`handoffs/\`** — Component Development Handoffs (implementation specs for dev teams).
- **\`.cache/sa-skills/\`** — scratch, gitignored: section payloads, the facts ledger (\`facts.json\`), and \`collect.json\` — the record of what a create collected (\`architecture-docs\` Workflow 1 Step 4.9). A create stops at checkpoints to free the context: when \`create-progress.json\` beside it says the create is unfinished, say \"continue the architecture\" — \`/sa-skills:architecture-docs\` resumes at the next section without asking again.

When referencing an architecture section, quote its **internal section number** (e.g., "Section 7"), not the file prefix number.

### Architecture doc updates → confirm first, never plan mode

Direct edits to architecture documentation are non-trivial — a single change can ripple through component versions, ADRs, downstream handoffs, and diagrams. They run without plan mode, and **nothing is written to \`ARCHITECTURE.md\`, \`docs/**/*.md\`, \`docs/components/**/*.md\`, \`adr/**/*.md\`, \`tdr/**/*.md\` or \`handoffs/**/*.md\` before the user has confirmed the change** — except the Tier 0 writes of a RUN-team project, below:

1. **Ask every doubt first.** Which file, which section, which value, which component, how far the change reaches — anything the request leaves open is a question to the user (\`AskUserQuestion\`), never a guess. Several doubts go in one call.
2. **Show the change set and wait for the yes.** The files that change, and for each the lines before → after (or, for a new block, the block), the downstream files the edit will touch or offer, and the ADRs or principles it bears on — then one approval question. A "no" or an "Other" answer is a revision: show the revised set and ask again.
3. **Write only what was approved.** A gate finding on the approved lines is fixed at its line and reported when the fix keeps their meaning; any other change found while writing — a different value, another line, a downstream file — is asked before it is made.

This holds for typo fixes, metric updates, section additions, ADR edits and component-descriptor changes alike — there is no "trivial" carve-out for architecture content. \`sa-skills:architecture-docs\` with **update** intent (Workflow 2) runs this inside the skill (\`EDIT_WORKFLOW.md\` § Confirm the change); a prose restyle (Workflow 12, \`/restyle-architecture\`) confirms through its \`--dry-run\` report and Step 2.

**RUN teams — a policy for the components, never for this repository.** \`"support": "run"\` in \`.sa-skills/project.json\` (\`bun [plugin_dir]/scripts/shared/support.js <project_root> --declare run\`) declares that the components built from this architecture are maintained by RUN teams. It governs their repositories: once the architecture has a release (an \`architecture-v*\` tag), each build pack's \`BUILD.md\` tells the IDE agent to escalate a question that needs an architect (\`preview_escalation\`) and to request — never make — the four Tier 0 writes (a workaround recorded as a TDR · a TDR status move · a project ADR in \`Proposed\` · a doc fix that changes no fact) through \`preview_tier0\`, which \`ci/architecture-tier0.yml\` applies here; the architecture review holds a service pull request on an open escalation. **This repository is the architect's**: the declaration changes nothing about an edit here — every write above is confirmed first, and no request becomes an escalation on its own. What this repository does with escalations:
- **They arrive from the components.** An issue filed from a service's IDE comes as \`[ESC-?] <title>\`: \`bun [plugin_dir]/scripts/shared/escalate.js import <project_root> <issue number or URL>\` writes its record with the next ESC number; retitling the issue is a write on the host — \`escalate.js retitle <project_root> ESC-NNN\` shows it, \`--apply\` after the user's yes.
- **The architect answers them.** \`escalate.js list <project_root>\` is the open queue; \`escalate.js close <project_root> ESC-NNN --by <ADR-NNN|TDR-NNN|architecture-vX.Y.Z>\` (or \`--rejected "<reason>"\`) closes one, and a release names the ones it answers (\`lifecycle.js plan --resolves ESC-NNN\`).
- **One is opened here only when the user asks** ("escalate this", to hand a decision to a design authority): write the request as JSON (\`title\`, \`request\` verbatim, \`triggers\` by id, \`evidence\` — file and line per trigger —, \`proposal\`, \`questions\`, \`components\` by canonical name, \`integrations\`, \`adrs\`, \`tdrs\`, \`requested_by\`, \`route\`) to \`.cache/sa-skills/escalations/request.json\`, run \`escalate.js new <project_root> --from .cache/sa-skills/escalations/request.json\`, then \`escalate.js issue <project_root> ESC-NNN\` — it prints the issue it would open on the git host; only on a yes run it again with \`--create\`.

Exemptions (no change-set confirmation of their own — the skill's workflow asks what it needs):

- **Skill-routed invocations other than updates** — when the request maps to a \`sa-skills:architecture-*\` skill (each skill's description carries its trigger phrasing), invoke the skill directly. Initial creation (Workflow 1 from scratch), diagram regeneration (Workflow 8), multi-file migration (Workflow 9) and the release (\`architecture-lifecycle\`) are *not* update intent.
- **Read-only Q&A and discovery** — answering "what does our architecture say about X?" (\`sa-skills:architecture-docs\` Workflow 7, Informational Query), running \`explorer-cli.ts findings\`, or quoting from existing docs needs no confirmation.
- **Files outside the architecture surface** — code, tests, configs, and other non-architecture files follow the session's normal rules, not this one.

### Edits are surgical

The number of tokens used to edit files is best minimized, all else being equal. Therefore, when it will not affect the end result, surgically edit a file rather than rewrite the entire thing — one \`Edit\` at the line a gate or a review names, never a \`Write\` of the whole document for a phrase, a citation, a metric or a bullet. A whole-file rewrite is for a file that does not exist yet or whose greater part changes; it also regresses what already passed (a rewritten principle lost the one cost noun its gate had accepted). This holds for every file listed above and for the plugin's own scratch under \`.cache/sa-skills/\`.

### Judge worksheets go to the worksheet-judge subagent

When a plugin script stops on a judge worksheet (\`.cache/sa-skills/judge/<spec>.worksheet.md\` — "worksheet pending", "undecided", exit 10), do not answer it in this session: dispatch the \`sa-skills:reviewers:worksheet-judge\` subagent (Haiku) once per worksheet, several in one message, giving each its worksheet path; then run the same command again. It writes the answers file the worksheet names; the script applies it on the re-run.

### Component naming — always use the canonical full name

When referencing a documented component by name in any output (analysis reports, summaries, prose, tables, diagrams, citations, commit messages, chat answers, ad-hoc edits), use the **canonical full name** exactly as the component file's H1 gives it (\`bun <plugin>/skills/architecture-component-guardian/utils/component-cli.ts list\` prints it as \`name\`). \`docs/components/README.md\` Column 2 is derived from those files and can lag; when the two disagree, the file wins. Do **not** abbreviate, truncate, or alias even when source \`docs/**/*.md\` files use a shortened form inline — source-doc shortening is for inline readability only, not for downstream propagation. Example: if the index lists \`payments-ledger-service\`, write \`payments-ledger-service\` every time — never \`ledger\` or \`payments-ledger\` standalone.

### Reading the architecture by code (no model tokens)

The plugin reads the architecture surface with scripts, and so should you — open a document only to edit it or to quote its prose. \`[plugin_dir]\` is the installed plugin directory: \`bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts\` prints it — never a glob over \`~/.claude/plugins/cache/\`, which keeps every version ever installed.

- **Where is X discussed?** — \`bun [plugin_dir]/skills/architecture-explorer-headers/utils/explorer-cli.ts findings <project_root> --query "<3–8 terms>"\` prints the files, lines, headings and excerpts where the terms appear (\`manifest <project_root>\` prints every doc and ADR with its header fields). Use it before reading anything for a question; read only the files it names, by heading range.
- **A name, an id, a status, a catalog** — \`bun [plugin_dir]/skills/architecture-docs/scripts/arch-facts.js <project_root> --section <components|adrs|tdrs|integrations|phases|flows|layers|releases|docs>\` prints that part of the facts ledger (\`.cache/sa-skills/facts.json\`). Never reopen a document to remember a canonical name or an ADR status; the document wins over a stale ledger, so re-run the script after a write.
- **The headers** — \`bun [plugin_dir]/skills/architecture-explorer-headers/utils/explorer-cli.ts check <project_root>\` holds every \`EXPLORER_HEADER\` to its contract; run it after any header you write.
- **The PO Spec follows the architecture, never silently** — "update the PO spec" runs \`sa-requirements:architecture-readiness\` Workflow 6: the delta is collected by \`po-spec-delta.js\`, proposals are placed by a fixed section mapping, and the Product Owner approves item by item.

**EXPLORER_HEADER blocks** — each \`docs/NN-*.md\` and \`docs/components/**/*.md\` file should carry a 5–10 line \`<!-- EXPLORER_HEADER ... -->\` block right after the H1 listing key concepts, technologies, components, scope, and related ADRs. These are the metadata the explorer surfaces in the manifest. If a doc is missing its header or the header looks stale, run \`/regenerate-explorer-headers\` (or \`--dry-run\` first) to backfill it. \`ARCHITECTURE.md\` is exempt — it's a navigation index, no header needed.

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