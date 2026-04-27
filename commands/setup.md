---
description: Set up the sa-skills plugin in the current project — merges required permissions, enabledPlugins, and extraKnownMarketplaces from the plugin's settings.json.example into your project's .claude/settings.json (non-destructive).
---

Set up the sa-skills plugin for this project by merging the plugin's bundled `settings.json.example` into the project's `.claude/settings.json`. Non-destructive: existing user entries are preserved; only missing entries are added.

## Step 1 — Locate the plugin's `settings.json.example`

Try each path in order and use the first one that exists:

1. `~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/.claude/settings.json.example` (marketplace manifest install)
2. `~/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/plugins/sa-skills/.claude/settings.json.example` (marketplace cache install)
3. Glob `**/{sa-skills,solutions-architect-skills}/.claude/settings.json.example` relative to CWD (dev-mode clone)

If none are readable:

```
❌ Cannot locate the sa-skills settings.json.example.
   Ensure the plugin is installed — run `/plugin list` to verify.
   If installed, rerun `/setup` from a project directory (not $HOME).
```

Stop without writing anything.

Store the resolved absolute path as `example_path`. Derive `plugin_dir` by stripping `/.claude/settings.json.example` from the end.

## Step 2 — Resolve the project settings path

`user_settings_path = <project-cwd>/.claude/settings.json`

The helper creates the `.claude/` directory if it does not exist — no manual `mkdir` needed here.

## Step 3 — Run the merge helper

Execute:

```bash
bun "$plugin_dir/scripts/setup-permissions.ts" "$example_path" "$user_settings_path"
```

The helper:
- Reads both JSON files.
- Strips every `//`-prefixed comment key from the example (documentation-only keys).
- Merges four top-level sections into the user file:
  - `permissions.allow` — array union, deduplicated, user entries first, then any new entries from the example in their original order.
  - `enabledPlugins` — object-level merge; if a key already exists in the user file, the user's value wins.
  - `extraKnownMarketplaces` — same object-level merge.
  - `hooks` — **(v3.14.1+)** event-keyed merge with idempotent recognition of the sa-skills marker `header-cli.ts session-log add`. Existing user hooks under any matcher are preserved verbatim; if the user already has a `Write|Edit` matcher with our session-log command in its `hooks[]` array, it is recognized as already present and not duplicated. If the user has a `Write|Edit` matcher with unrelated hooks, the sa-skills hook command is appended into the same matcher entry without disturbing the user's existing commands.
- Leaves every other user-specific top-level key (`model`, `theme`, custom keys) untouched.
- Writes the merged object back with 2-space indentation and a trailing newline.
- Prints a structured summary to stdout (now four lines: Permissions / Marketplaces / Plugins / Hooks).

If the helper exits non-zero, display the stderr verbatim and do NOT claim success — the user's `settings.json` has not been modified.

## Step 4 — Report permissions merge

Display the helper's stdout verbatim to the user.

If the helper reports any legacy grants referencing `solutions-architect-skills:` (the pre-v3.8.5 namespace), remind the user that those are safe to leave but can be removed manually for cleanliness.

## Step 5 — Generate CLAUDE.md architecture pointer

Execute:

```bash
bun "$plugin_dir/scripts/setup-claude-md.ts" "$project_cwd"
```

where `$project_cwd` is the same project directory used to derive `user_settings_path` in Step 2.

The helper writes a marker-delimited block into `$project_cwd/CLAUDE.md` that tells Claude where to find architecture context (`docs/`, `docs/components/`, `adr/`, `handoffs/`):

- If `CLAUDE.md` does not exist → creates it with a minimal top-level heading plus the managed block.
- If it exists without the markers → appends the block to the end.
- If it exists with the markers → replaces only the content between them (idempotent re-runs).
- If the content is already byte-identical → reports `Unchanged` and writes nothing.

Display the helper's stdout verbatim. If it exits non-zero, print the stderr verbatim and note that `.claude/settings.json` was still updated successfully — Step 3 and Step 5 are independent.

## Step 6 — Merge sa-skills entries into `.gitignore`

Execute:

```bash
bun "$plugin_dir/scripts/setup-gitignore.ts" "$project_cwd"
```

The helper ensures `$project_cwd/.gitignore` contains the sa-skills baseline entries:

- `exports/` — generated Word `.docx` deliverables (`architecture-docs-export` output)
- `/tmp/` — local scratch output
- `CLAUDE.md` — the per-project Claude Code instructions file (managed by Step 5)

Behavior:

- If `.gitignore` does not exist → creates it with a `# sa-skills` header + the three entries.
- If it exists and the entries are missing → appends them under a `# sa-skills` header (only if the header is not already there).
- Existing entries (exact line match, ignoring comments and leading slash normalization) are counted under "already present" and left alone.
- User's existing `.gitignore` entries are never reordered or removed.

Display the helper's stdout verbatim. If it exits non-zero, print the stderr verbatim — the earlier steps remain successful and independent.

## Step 7 — Final reminder

Print:

```

Restart Claude Code (or press Ctrl+R) to reload settings.
```

## Notes

- This command does not delete or overwrite any existing user entry. If a permission grant is already present, it is counted under "already present" and left as-is.
- The CLAUDE.md block is idempotent — re-running `/setup` replaces only the content between the `sa-skills:architecture-pointer` markers. Content above, below, or between other user sections is preserved byte-for-byte.
- The `.gitignore` merge is append-only and line-exact. Existing entries are never rewritten; re-runs report `Unchanged` once all three sa-skills entries are present.
- The command is idempotent end-to-end — re-running it on an already-configured project reports 0 added / N already present for permissions, `Unchanged` for the CLAUDE.md block, and `Unchanged` for `.gitignore`.
- Required permission for the command itself: `Bash(bun *)`. First-time users will see a single Claude Code permission prompt when the helper runs; approve once and the prompt does not repeat.

## v3.14.0 — what's new in this setup

Existing projects re-running `/setup` after upgrading to v3.14.0 will see one new permission added:

- `Agent(sa-skills:architecture-explorer)` — the universal Haiku-tier doc navigator (front door for compliance / analysis / peer-review / handoff / Q&A / ADR workflows). Pre-existing `Agent(sa-skills:*)` grants are preserved; the new line is appended.

(The v3.14.0 explorer cache permissions for `/tmp/architecture-explorer/**` were removed in v3.16.0 — the cache and per-task config files are gone. The `/tmp/architecture-explorer/sessions/**` write permission is owned by the unrelated `architecture-explorer-headers` skill and is added separately under the v3.14.1 hook entry.)

No marketplace re-registration is needed. The new `architecture-explorer-headers` skill (and its `/regenerate-explorer-headers` slash command) inherit existing `Bash(bun *)` and `Read/Write` doc-tree permissions — no extra grants required to run them.

If a project's `settings.json` was committed with the v3.13.x permissions list and you want the upgrade visible in version control, run `/setup` and then commit the resulting one-line addition to `permissions.allow`.

## v3.14.1 — what's new in this setup

Existing projects re-running `/setup` after upgrading to v3.14.1 will see one additional change:

- `hooks.PostToolUse[Write|Edit]` — a session-scoped editlog tracker is merged into your `.claude/settings.json`. After every Write or Edit to any file under `docs/**/*.md`, the hook silently appends one JSONL line to `/tmp/architecture-explorer/sessions/<projectHash>-<sessionId>.editlog`. Cost per edit: ~10 ms (bun startup + JSONL append). The hook never blocks the user's edit and never invokes an LLM.
- The Step 5 `CLAUDE.md` managed block grows a new subsection — *Session edit tracker — keep EXPLORER_HEADERs honest* — that instructs Claude (the orchestrator) to keep one and only one task on the user-visible task list (`Regenerate EXPLORER_HEADERs for N session-edited docs (run /regenerate-explorer-headers --session)`) whenever the editlog is non-empty. The orchestrator never auto-runs the slash command — the user decides when to spend the LLM-heavy refresh.

Idempotency: re-running `/setup` is safe. The hook-merge logic in Step 3 detects the sa-skills marker `header-cli.ts session-log add` and refuses to duplicate the entry. Unrelated user hooks under the same `Write|Edit` matcher are preserved verbatim — only the sa-skills command is added.

If you previously edited your `.claude/settings.json` to add other hooks under `PostToolUse`, those are kept as-is. If you'd rather opt out of the tracker entirely, delete the corresponding entry from `hooks.PostToolUse` after `/setup` runs; the rest of the plugin works without it (you'll lose the edit-tracking TODO and skill pre-flight warnings about session edits, but the explorer cache and slash commands continue to function).

## v3.14.7 — what's new in this setup

Existing projects re-running `/setup` after upgrading to v3.14.7 will see one new permission added:

- `Agent(sa-skills:handoff-asset-generator)` — the parallel asset generator for `architecture-dev-handoff`. Stage 5B of the dev-handoff workflow now fans out one Task per `(component, asset_type)` tuple to this agent, with model tier pinned per call (sonnet for code-style assets — OpenAPI, DDL, Kubernetes, AsyncAPI, CronJob, Avro, Protobuf, Redis; haiku for the descriptor-style `c4-descriptor.md`). Pre-existing `Agent(sa-skills:handoff-generator)` and `Agent(sa-skills:handoff-context-builder)` grants are preserved; the new line is appended.

No other permission, hook, marketplace, or `.gitignore` change is needed for v3.14.7. If you skip running `/setup` after the upgrade, dev-handoff invocations will hit a one-time permission prompt for `Agent(sa-skills:handoff-asset-generator)` on the first run — approve once and it will not repeat.

The new `--asset-parallelism N` flag (default 4, capped at 8) is parsed by the orchestrator and requires no permission changes.

## v3.16.0 — what's new in this setup

Existing projects re-running `/setup` after upgrading to v3.16.0 will see one user-visible change and one quiet refresh:

1. **CLAUDE.md managed block rewrite** — Step 5 replaces the v3.14.0 manifest-only explorer guidance with the v3.16.0 two-mode model:
   - Manifest mode (no `query`) — corpus enumeration with EXPLORER_HEADER metadata.
   - Findings mode (with `query`) — Explore-agent-style content discovery with line-level matches and headings.

   The injected block also documents that compliance / analysis / dev-handoff now invoke the explorer in **findings mode** internally (per-contract / per-analysis / per-component fan-out keyed on hardcoded vocabularies), while peer-review and ADR creation invoke it in **manifest mode**. Free-form architecture Q&A from the main session uses findings mode with the user's question as the `query`. The decision tree for re-triggering the explorer (now keyed on whether the prior block in conversation is `EXPLORE_MANIFEST` vs `EXPLORE_FINDINGS`) replaces the v3.14.0 cache-aware tree.

   The replacement is transparent — the helper script swaps only the content between the `<!-- sa-skills:architecture-pointer:begin -->` / `:end -->` markers. Any user content above or below those markers is preserved byte-for-byte.

2. **Permissions** — no new grants are added in v3.16.0. The broad `Write(//tmp/architecture-explorer/**)` / `Read(//tmp/architecture-explorer/**)` entries from v3.14.0 are **retained** in `settings.json.example` because `/tmp/architecture-explorer/sessions/<projectHash>-<sessionId>.editlog` (the unrelated `architecture-explorer-headers` session-edit tracker, v3.14.1+) lives under that prefix. The per-task ranking cache files those grants originally covered no longer exist (the cache and per-task config files were removed in v3.16.0), but the same grant naturally covers the surviving `sessions/` editlog — so the line stays. The `Agent(sa-skills:architecture-explorer)` permission added in v3.14.0 is unchanged; v3.16.0 only renamed the agent's output block (`EXPLORE_RESULT` → `EXPLORE_MANIFEST`/`EXPLORE_FINDINGS`), which is invisible to the permission system.

No marketplace re-registration, no hook change, no `.gitignore` change is required. If you skip `/setup` after upgrading to v3.16.0, the plugin still runs — you simply keep the v3.14.0 CLAUDE.md guidance pointing at the old manifest-only model, which slightly under-describes how the explorer behaves now.
