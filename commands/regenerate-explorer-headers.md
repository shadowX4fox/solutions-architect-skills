---
description: Backfill EXPLORER_HEADER blocks into existing docs/NN-*.md and docs/components/**/*.md files (sa-skills:architecture-explorer-headers — surfaces key_concepts, technologies, components, scope, related_adrs in the first 60 lines so the architecture-explorer agent classifies legacy docs accurately).
---

Invoke the `sa-skills:architecture-explorer-headers` skill, passing through any arguments as `regenerate explorer headers $ARGUMENTS`. Supported arguments:

- `/regenerate-explorer-headers` → scan docs/ and docs/components/, add headers to files that don't have one. Skip files that already have a header. Confirm before writing.
- `/regenerate-explorer-headers --force` → overwrite existing headers. Use after a major refactor that renamed components or technologies. Destructive — confirm carefully.
- `/regenerate-explorer-headers --dry-run` → list what would change, write nothing. Safe to run repeatedly.
- `/regenerate-explorer-headers <path-glob>` → restrict to a subset (e.g. `docs/components/payment-service/**` or `docs/0[6-9]-*.md`). Glob is evaluated against the inventory output.

The skill's workflow (Phase 1 inventory → Phase 2 plan + confirmation → Phase 3 generate-and-insert per file → Phase 4 report) handles routing itself. `ARCHITECTURE.md` at the project root is excluded by the inventory CLI — the explorer reads it in full as the project's navigation index, and a header would collide with the existing nav table.

Do NOT plan, explore, or ask clarifying questions before invoking. The skill's Phase 2 confirmation prompt is where the user steers scope.
