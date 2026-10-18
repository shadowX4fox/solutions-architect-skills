---
description: Set up the sa-skills plugin in the current project — merges required permissions, enabledPlugins, and extraKnownMarketplaces from the plugin's settings.json.example into your project's .claude/settings.json (non-destructive).
---

Set up the sa-skills plugin for this project by merging the plugin's bundled `settings.json.example` into the project's `.claude/settings.json`. Non-destructive: existing user entries are preserved; only missing entries are added.

## Step 1 — Locate the plugin's `settings.json.example`

Try each path in order and use the first one that exists:

1. `$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts)/.claude/settings.json.example` — the install registry's answer (project scope, else user scope, else the marketplace clone itself)
2. `~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/.claude/settings.json.example` (the marketplace clone, when the script is not there)
3. Glob `**/{sa-skills,solutions-architect-skills}/.claude/settings.json.example` relative to CWD, **outside `~/.claude/plugins/cache/`** (dev-mode clone)

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
  - `permissions.allow` — grants for retired or moved agents are removed first (the helper holds the list and reports each one), then array union, deduplicated, user entries first, then any new entries from the example in their original order.
  - `enabledPlugins` — object-level merge; if a key already exists in the user file, the user's value wins.
  - `extraKnownMarketplaces` — same object-level merge.
  - `hooks` — the routing hook is declared by the plugin (`hooks/hooks.json`, `${CLAUDE_PLUGIN_ROOT}`), so nothing is added — except on Windows without Git Bash, where hooks run in PowerShell and the plugin's `sh` hook cannot start: there the `.ps1` wrapper is written with `"shell": "powershell"`, by the marketplace clone's path (refreshed in place by `claude plugin marketplace update`, never stale). Every other sa-skills routing hook in the user file — the absolute cache path written up to 8.100.0, which went stale on each plugin update, the marketplace-clone path, a hand-wired `.cmd` / `.ps1`, and the retired `cmd /c`, `sh ~` and `bun ~` forms — is removed and reported under the "retired" counter. Unrelated hooks are kept verbatim. Re-runs are idempotent.
- Leaves every other user-specific top-level key (`model`, `theme`, custom keys) untouched.
- Writes the merged object back with 2-space indentation and a trailing newline.
- Prints a structured summary to stdout (Platform and Hook lines, then Permissions / Marketplaces / Plugins / Hooks).

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
- `.cache/sa-skills/` — project-local scratch dir for generated payloads, the facts ledger, judge worksheets and IcePanel JSON snapshots (inside the project, so it works the same on every OS)
- `CLAUDE.md` — the per-project Claude Code instructions file (managed by Step 5)
- `.claude/settings.json` — the per-project Claude Code settings file (managed by Step 3). Gitignored because it carries each developer's own settings (permissions, the judge engine, local paths). Each developer runs `/setup` locally.

Behavior:

- If `.gitignore` does not exist → creates it with a `# sa-skills` header + the four entries.
- If it exists and the entries are missing → appends them under a `# sa-skills` header (only if the header is not already there).
- Existing entries (exact line match, ignoring comments and leading slash normalization) are counted under "already present" and left alone.
- User's existing `.gitignore` entries are never reordered or removed.
- For file-style entries (`CLAUDE.md` and `.claude/settings.json`), if the file is **already tracked by git**, the helper prints a one-line warning with the `git rm --cached <path>` command needed to stop tracking it. `.gitignore` alone does not untrack files that git already knows about.

Display the helper's stdout verbatim. If it exits non-zero, print the stderr verbatim — the earlier steps remain successful and independent.

## Step 7 — Check the export toolchain

Execute:

```bash
bun "$plugin_dir/scripts/setup-docgen.ts"
```

The helper reports the four pieces behind `tools/docgen/generate-doc.js` and, for each one missing,
what breaks and the command that fixes it:

| Piece | Required | Without it |
|---|---|---|
| `docx` | ✅ | no `.docx` export at all |
| `pdfmake` | ⬜ | `--format pdf` fails; the PO Spec distribution PDF is skipped with a warning |
| `mermaid-cli` (`mmdc`) | ⬜ | every Mermaid diagram exports as monospace source instead of a picture |
| a browser for Puppeteer | ⬜ | `mmdc` resolves but cannot render — diagrams still export as source |

All four install with **`bun install` from the plugin directory** — `pdfmake` and
`@mermaid-js/mermaid-cli` are `optionalDependencies` of `tools/docgen`, so a machine that cannot
build one still gets a working Word path. The browser is the exception: **Bun does not run
Puppeteer's post-install browser download**, so a machine with no Chrome needs
`bunx puppeteer browsers install chrome` or `PUPPETEER_EXECUTABLE_PATH` pointing at one.

The last check **renders a real diagram** rather than testing for the binary — an `mmdc` that
resolves and cannot reach a browser passes a presence check and fails on the first export. Add
`--no-smoke` to skip it (it takes a few seconds), `--strict` to make any missing optional piece a
non-zero exit for CI, `--json` for the structured form.

Display the helper's stdout verbatim. **It is a report, not a gate**: it exits non-zero only when
`docx` is missing, so a `⬜` line never blocks `/setup`. Tell the user which exports are degraded
and let them decide.

> The Solution Architecture briefing opens on a single C4 Level 1 picture, and a stakeholder
> reading `flowchart TB` in Courier New is reading nothing. On a machine that produces briefings,
> treat the `mermaid-cli` and browser lines as required even though this helper does not.

## Step 8 — Detect ripgrep and point the Grep tool at it

Execute:

```bash
bun "$plugin_dir/scripts/setup-ripgrep.ts" "$user_settings_path"
```

Two readers depend on ripgrep. Every search instruction the plugin hands the model is an `rg`
command run through Bash (8.48.0), so without `rg` on PATH each one fails with
`rg: command not found`. Claude Code's built-in Grep tool ships its own ripgrep and uses it unless
`USE_BUILTIN_RIPGREP=0`, which points the tool at the `rg` on PATH instead. The helper reports both
and configures the second from the first:

| Line | Meaning |
|---|---|
| `ripgrep on PATH` | path and version; when missing, the install command for this machine's package manager |
| `PCRE2 in ripgrep` | the prose gate's passive-voice rule runs `rg -P`; every other rule is plain regex |
| `Grep tool binary` | `USE_BUILTIN_RIPGREP=0` written into `env` of the **project** settings when a system ripgrep exists and neither scope sets the key; a value at user scope, or a foreign project value, is reported and left alone; with no ripgrep nothing is written, because a Grep tool pointed at a missing binary would break the one reader that worked |
| `Bash(rg *) in project permissions` | the grant Step 3 merges; absent means every search prompts and the friction pushes the model back to `grep` |

Display the helper's stdout verbatim. **It is a report, not a gate**: it always exits 0 (`--strict`
makes a missing ripgrep a non-zero exit for CI; `--dry-run` reports without writing; `--json` is the
structured form). When ripgrep is missing, tell the user the install command and that the skills'
searches fail until it is there — the built-in Grep tool keeps working either way.

> The setting is honoured by the Grep tool in the next session, and a known Claude Code issue has it
> ignored at times. The confirmation is the process: while a search runs, `ps aux | rg '[r]g '` shows
> `/usr/bin/rg` (or the platform's path) rather than a path under `vendor/ripgrep/`.

## Step 9 — Apply and report the judge in force

Run the judge helper against the project directory:

```bash
bun "$plugin_dir/scripts/setup-judge.ts" "$project_cwd"
```

`scripts/judge.js` is the plugin's one judge: every semantic verdict a script asks — which component
a name refers to, whether a passage asserts a claim — goes through it, and the engine that answers
is chosen once through `SA_JUDGE`: `agent`, the default, writes a worksheet that the session hands to the `worksheet-judge` subagent (Haiku) and
sends nothing anywhere (an item whose worksheet is not yet answered is undecided — reported, never guessed);
`typesafe` asks Jev over the TypeSafe API and needs
`TYPESAFE_API_KEY`; `clef` asks Cloudflare's Clef on Workers AI and needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (`CLOUDFLARE_AI_GATEWAY_ID` routes it through an AI Gateway).
**The helper applies the default**: when no scope sets `SA_JUDGE` — the user settings, the project
settings, the shell — it writes `env.SA_JUDGE = "agent"` into the project's `.claude/settings.json`
(the rest of the file untouched); a value set anywhere is left as it is (`--dry-run` shows the write
without making it). Then it reports what is in force:

| Line | Meaning |
|---|---|
| `judge engine (SA_JUDGE)` | the engine every site uses when a command names none, and where it came from (`written to` the project settings on this run, `set in` them, or set at user scope / in the shell and left alone); an unknown value fails every judge call |
| `TYPESAFE_API_KEY in this shell` | set or unset — never the value; a fix only when the engine in force is `typesafe` |
| `key kept out of versioned files` | the key must not sit under `env` in `.claude/settings.json`; the profile is its place, above any "not interactive" guard so non-interactive shells get it too |
| `TypeSafe model (SA_JUDGE_MODEL)` | `jev-latest` unless overridden |
| `one item answered by the API` | with a key set, one real item goes to the API and the line names the model that answered and the latency — a key that resolves and cannot reach the API passes a presence check and fails on the first run |
| `answer cache` | `.cache/sa-skills/judge/` — answers cached by content, so a re-run over unchanged items costs nothing |

Display the helper's stdout verbatim. **It is a report, not a gate**: it always exits 0 (`--strict`
makes an engine that cannot answer a non-zero exit for CI; `--no-probe` skips the API call; `--json`
is the structured form). Its one write is the default above. When the engine in force is `typesafe`
and the key is missing, tell the user where the key comes from and that `SA_JUDGE=agent` works
meanwhile without one. Never offer the `typesafe` engine unprompted: it sends the judged items off the machine, and
that is the user's decision.

## Step 10 — Check the API contract validator

Execute:

```bash
bun "$plugin_dir/scripts/setup-contracts.ts"
```

`architecture-dev-handoff` validates every generated `openapi.yaml` (OpenAPI 3.1), `asyncapi.yaml`
(AsyncAPI 3.0), `schema.graphql` (GraphQL SDL), `*.avsc` (Avro), `ddl.sql` and `schema.proto` with
`contract-check.js`, whose layers are **`@redocly/openapi-core`**, **`graphql`** (graphql-js), **`avsc`**,
**`libpg-query`** (PostgreSQL's own parser), **`node-sql-parser`** (MySQL, SQL Server, …) and **`protobufjs`** —
dependencies of the plugin, run in-process (no binary, no account). Claude Code's plugin install and update do not
run `bun install`, so they can be missing on a fresh or updated install. The helper reports thirteen lines:

| Line | What it proves |
|---|---|
| `@redocly/openapi-core` | the package loads from the plugin directory |
| `graphql` · `avsc` · `libpg-query` · `node-sql-parser` · `protobufjs` | the same for each |
| OpenAPI 3.1 sample | a throwaway valid contract passes `contract-check.js` end to end |
| AsyncAPI 3.0 sample | the same for AsyncAPI |
| GraphQL SDL · Avro · PostgreSQL DDL · SQL Server DDL · Protobuf samples | the same for each |

The samples are validated for real because a package that resolves is not a validator that runs. `--json`
gives the structured form.

Display the helper's stdout verbatim. **This check is required**: it exits non-zero when any line fails,
and its `Fix:` line names the command — `bun install` in the plugin directory. Without it the handoff
skill refuses to start (its Step 1.2 runs the same probe), so tell the user to run the fix before
generating a handoff kit. The earlier steps remain successful and independent.

## Step 11 — Report the institution packs

Execute:

```bash
bun "$plugin_dir/scripts/shared/packs.js" --project "$PWD"
```

An **institution pack** is a separate plugin an organization installs from its own (usually private) marketplace: its
design language standard, its full BIAN Service Landscape, its capability frameworks, its brand skins and its defaults (including the default framework) (`sa-pack.json` at its root,
see `docs/INSTITUTION_PACKS.md`). The helper lists every pack found for this project, what
each provides, the design language and BIAN landscape in force (a pack's, else the base's own copy, else **fallback
mode**), the pack skins, and why any pack was skipped (a `base` range that excludes this version, a pack installed
twice, two packs providing the same thing). When the project's `.sa-skills/project.json` carries `"packs"`, a
`project packs:` line names the ones it keeps and the ones it leaves out.

A project outside the organization a user-scope pack belongs to (open source, a client's, a demo) opts out with
`bun "$plugin_dir/scripts/shared/packs.js" --declare none --project "$PWD"` — run it only when the user
asks for it.

Display its stdout verbatim. **This step is informational** — no pack is a normal, fully working setup. A `⚠` line
names what to do: update the pack (`claude plugin update <pack>`), or the base, until the ranges meet.

## Step 12 — Final reminder

Print:

```

Restart Claude Code to reload settings.
```

## Notes

- This command does not delete or overwrite any existing user entry. If a permission grant is already present, it is counted under "already present" and left as-is.
- The CLAUDE.md block is idempotent — re-running `/setup` replaces only the content between the `sa-skills:architecture-pointer` markers. Content above, below, or between other user sections is preserved byte-for-byte.
- The `.gitignore` merge is append-only and line-exact. Existing entries are never rewritten; re-runs report `Unchanged` once all three sa-skills entries are present.
- The command is idempotent end-to-end — re-running it on an already-configured project reports 0 added / N already present for permissions, `Unchanged` for the CLAUDE.md block, `Unchanged` for `.gitignore`, and the same toolchain report.
- Step 7 writes nothing. It reads the installed packages and renders one throwaway diagram into a temporary directory that it deletes.
- Step 8 writes at most one key, `env.USE_BUILTIN_RIPGREP`, into the project settings, and only when a system ripgrep exists and neither scope already sets it. It never edits `~/.claude/settings.json`.
- Step 10 writes nothing. It validates seven throwaway contracts in a temporary directory that it deletes.
- Step 9 writes one key — `env.SA_JUDGE = "agent"` in the project settings, only when no scope sets `SA_JUDGE` — and prints no secret. With `TYPESAFE_API_KEY` set it sends one fixed item ("Hello there.") to the TypeSafe API and nothing from the project.
- Required permission for the command itself: `Bash(bun *)`. First-time users will see a single Claude Code permission prompt when the helper runs; approve once and the prompt does not repeat.
- **Agent grant namespace**: sub-agents are addressed by role — `Agent(sa-skills:reviewers:principle-quality-reviewer)`, `Agent(sa-delivery:generators:seam-generator)`. The authoritative list is `permissions.allow` in `.claude/settings.json.example`, which is what this command merges. Retired sa-skills grants are swept on every run and reported; a flat `Agent(sa-skills:<agent>)` grant for a still-shipped agent is inert and safe to remove by hand.
