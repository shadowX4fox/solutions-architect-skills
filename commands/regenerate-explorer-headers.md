---
description: Backfill EXPLORER_HEADER blocks into existing docs/NN-*.md and docs/components/**/*.md files (sa-skills:architecture-explorer-headers — surfaces key_concepts, technologies, components, scope, related_adrs in the first 60 lines so the architecture-explorer agent classifies legacy docs accurately).
---

Invoke the `sa-skills:architecture-explorer-headers` skill, passing through any arguments as `regenerate explorer headers $ARGUMENTS`. Supported arguments:

- `/regenerate-explorer-headers` → scan docs/ and docs/components/, add headers to files that don't have one. Skip files that already have a header. Confirm before writing.
- `/regenerate-explorer-headers --force` → overwrite existing headers. Use after a major refactor that renamed components or technologies. Destructive — confirm carefully.
- `/regenerate-explorer-headers --dry-run` → list what would change, write nothing. Safe to run repeatedly.
- `/regenerate-explorer-headers <path-glob>` → restrict to a subset (e.g. `docs/components/payment-service/**` or `docs/0[6-9]-*.md`). Glob is evaluated against the inventory output.
- `/regenerate-explorer-headers --session` → **(v3.14.1+)** read the session editlog (populated by the PostToolUse Write/Edit tracker hook) and refresh headers only on the docs that were edited in the current Claude session. Always uses `--force` semantics on those files (they may already have an out-of-date header) and clears the editlog on success. Failures stay in the log so a re-run picks them up. Combine with `--dry-run` to preview without calling the LLM and without clearing the log.

### `--session` flow

When `--session` is present, the skill runs an alternate Phase 1 instead of the disk inventory:

1. Run `bun "$plugin_dir/skills/architecture-explorer-headers/utils/header-cli.ts" session-log list --project-root $PROJECT_ROOT` and capture the deduped relative paths.
2. If the list is empty, exit immediately with `✓ Session editlog is empty — no headers to refresh, no action needed.` and stop. Do not proceed to Phase 2.
3. Otherwise feed only those paths into Phase 2's confirmation table (instead of the full `docs/**` inventory). Implicitly enable `--force` because the listed files were edited and may already carry stale headers.
4. After Phase 3 completes, the skill records which files were successfully regenerated. On `--dry-run`, no editlog mutation. Otherwise: run `retain` (the regen script removes the successfully-rewritten paths and keeps any failures) by invoking `bun "$plugin_dir/skills/architecture-explorer-headers/utils/header-cli.ts" session-log clear --project-root $PROJECT_ROOT` if the entire success set equals the input list, OR by writing the residual failures via a follow-up `add` cycle if the helper supports it. (Implementation MAY simplify by clearing only when all files succeeded and leaving the log untouched on partial failure — partial failures will reappear on the next pre-flight warning so the user re-runs `--session`.)
5. Phase 4's report adds a summary line:
   - All success → `✓ Regenerated N EXPLORER_HEADERs (session edits): <list>\n✓ Session editlog cleared.`
   - Partial → `✓ Regenerated K of N (session edits): <list>\n⚠ Failed: <list>\nSession editlog retained — re-run /regenerate-explorer-headers --session after fixing.`

The skill's workflow (Phase 1 inventory → Phase 2 plan + confirmation → Phase 3 generate-and-insert per file → Phase 4 report) handles routing itself. `ARCHITECTURE.md` at the project root is excluded by the inventory CLI — the explorer reads it in full as the project's navigation index, and a header would collide with the existing nav table.

Do NOT plan, explore, or ask clarifying questions before invoking. The skill's Phase 2 confirmation prompt is where the user steers scope.
