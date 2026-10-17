---
description: Migrate existing architecture docs to the prose style contract (sa-skills:architecture-docs Workflow 12 — removes template boilerplate, filler, meta-narration and marketing register from ARCHITECTURE.md and docs/, then stamps the PROSE_STYLE marker so the gate switches from report-only to enforcing).
---

Invoke the `sa-skills:architecture-docs` skill, passing through any arguments as
`restyle architecture $ARGUMENTS`. Supported arguments:

- `/restyle-architecture` → scan `ARCHITECTURE.md` + `docs/**`, report every prose-style finding, then apply fixes in safest-first order with confirmation before the reshaping step.
- `/restyle-architecture --dry-run` → list what would change, write nothing. Safe to run repeatedly.
- `/restyle-architecture --file <glob>` → restrict to a subset (e.g. `docs/04-*.md` or `docs/components/**`).
- `/restyle-architecture --force` → apply the fix stages without per-stage confirmation (stage 6 hands ADRs and TDRs to their own skills). Destructive on stage 5 (form conversions reshape content) — use only after a `--dry-run`.

The skill's Workflow 12 handles routing itself: baseline → `prose-check.js --scope release`, `docs-stats.js --enforce`,
`principle-check.js` and `superseded-claims.js` → apply stages in order (mechanical deletions, banned words and history,
size budgets before splits, splits, form conversions, then ADRs and TDRs through their owning skills) → qualifier and retired-claim review → stamp
`<!-- PROSE_STYLE: v1 -->` in `ARCHITECTURE.md`.

Until that marker is stamped, the Content Hygiene Gate runs this project in `report-only` mode:
findings print, nothing blocks. That is deliberate — a legacy architecture must never be forced
into a rewrite by an unrelated one-line edit.

**Plan mode**: a restyle is update intent under the project's plan-first rule. In plan mode, run the
`--dry-run` report and present it through `ExitPlanMode`; the approval replaces the skill's Step 2 prompt.
`--dry-run` by itself is read-only and needs no plan.
