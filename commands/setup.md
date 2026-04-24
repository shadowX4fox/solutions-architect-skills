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
- Merges three top-level sections into the user file:
  - `permissions.allow` — array union, deduplicated, user entries first, then any new entries from the example in their original order.
  - `enabledPlugins` — object-level merge; if a key already exists in the user file, the user's value wins.
  - `extraKnownMarketplaces` — same object-level merge.
- Leaves every other user-specific top-level key (`model`, `theme`, `hooks`, custom keys) untouched.
- Writes the merged object back with 2-space indentation and a trailing newline.
- Prints a structured summary to stdout.

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

## Step 6 — Final reminder

Print:

```

Restart Claude Code (or press Ctrl+R) to reload settings.
```

## Notes

- This command does not delete or overwrite any existing user entry. If a permission grant is already present, it is counted under "already present" and left as-is.
- The CLAUDE.md block is idempotent — re-running `/setup` replaces only the content between the `sa-skills:architecture-pointer` markers. Content above, below, or between other user sections is preserved byte-for-byte.
- The command is idempotent end-to-end — re-running it on an already-configured project reports 0 added / N already present for permissions and `Unchanged` for the CLAUDE.md block.
- Required permission for the command itself: `Bash(bun *)`. First-time users will see a single Claude Code permission prompt when the helper runs; approve once and the prompt does not repeat.
