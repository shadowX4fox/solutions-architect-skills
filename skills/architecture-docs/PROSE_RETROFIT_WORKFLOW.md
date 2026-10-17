# Workflow 12 — Prose Style Retrofit

**Trigger**: `/restyle-architecture`, or the user says "restyle architecture", "fix documentation
prose", "apply prose style", "migrate to prose contract".

**Purpose**: bring an architecture written before the prose contract into compliance, make it
shorter where the corpus already states a fact elsewhere, then stamp `<!-- PROSE_STYLE: v1 -->` so
the Content Hygiene Gate switches from `report-only` to `enforcing` for that project.

**Why this is opt-in.** An architecture with no marker runs `report-only`: `scripts/prose-check.js`
prints its findings and blocks nothing. Without that, the first one-line edit to a legacy document
would trigger a rewrite the user never asked for. Migration happens when the user chooses it, or at
release (`architecture-lifecycle`), and not before.

**Confirmation, no plan mode.** A restyle rewrites existing content in every file, so it **is update
intent** under the consumer project's confirm-first rule (`/setup`'s CLAUDE.md block). The change set is
Steps 1–2 — the dry-run report — and Step 2's confirmation prompt is the approval; any doubt the report
leaves (a fact with no kept link, a split's target) is asked there. `--dry-run` alone writes nothing.

**The fact rule: never drop a fact from the corpus.** A sentence may be deleted from one document when
the fact it carries is stated where the kept link points — and a script confirms it
(`scripts/fact-locate.js`), never a reading. Otherwise the fact moves (to the ADR it cites, through
`architecture-definition-record`, or to the section that owns it) or the sentence is split. A document
that got shorter by losing a constraint is a worse outcome than the finding it resolved.

**Steps**:

1. **Baseline and report.** Record the baseline the review compares against: `git rev-parse HEAD` with the
   architecture surface committed (ask the user to commit or stash unrelated doc changes first). Then run, in
   one message:
   - `bun [plugin_dir]/skills/architecture-docs/scripts/prose-check.js <project_root> --scope release` — add
     `--judge typesafe` where a key is set (a dismissed candidate is a rewrite you do not make), `--file <path>`
     per file of a `--file <glob>` subset, `--json` for the findings as data.
   - `bun [plugin_dir]/skills/architecture-docs/scripts/docs-stats.js <project_root> --enforce` — the shape budgets.
   - `bun [plugin_dir]/skills/architecture-docs/scripts/principle-check.js <project_root>` — `P-BUDGET-01` among them.
   - `bun [plugin_dir]/skills/architecture-docs/scripts/superseded-claims.js <project_root>` (with the judge where set).
   - `bun [plugin_dir]/skills/architecture-docs/scripts/prose-check.js <project_root> --scope records` — project ADRs and
     TDRs, their own logs skipped; `docs-stats.js` above already carries their size findings.
2. **Report the counts and stop for confirmation**, unless `--force` (or the plan was approved):

   ```
   🖊️  Prose style retrofit — <N> findings across <M> files

     Stage 1  mechanical deletions           <n>   boilerplate, edit-marker comments — no judgement
     Stage 2  banned words and history       <n>   rewrites the clause to the current state, keeps the fact
     Stage 3  size budgets                   <n>   moves the argument to the cited ADR / owning section, or deletes a located fact
     Stage 4  sentence / paragraph splits    <n>   restructures, never drops a fact
     Stage 5  form conversions               <n>   reshapes content into tables — review each
     Stage 6  ADRs and TDRs                  <n>   compacted by their owning skills — the decision / compromise in force
     Review   qualifiers · retired claims    —     after the stages, before the stamp

   Apply stages 1-4 now and confirm each stage-5 conversion? [y/n]
   ```
3. **Apply in that order — safest first, size before splits.** Each stage re-runs its script before the next begins.
   - **Stage 1** — delete `S-BOILER-01` sentences and `S-HIST-02` edit-marker comments.
   - **Stage 2** — `S-BAN-*` and `S-VOICE-01` rewrites; `S-HIST-01` dated narration becomes the current state
     (the history stays in `docs/CHANGELOG.md` and the ADR's `## Review History` — add it there only when it is
     not already recorded).
   - **Stage 3** — the budgets of `docs-stats.js --enforce` and `P-BUDGET-01`, whose fix is "move to the cited ADR".
     A deletion is allowed only for a fact `fact-locate.js` reports `located`:
     `bun [plugin_dir]/skills/architecture-docs/scripts/fact-locate.js <project_root> --removed "<text>" --target <path#section>`
     (or `--pairs <file.json>` for a batch, or `--base <baseline>` for every removal whose kept neighbour carries a
     link). The judge decides `located` (8.119.0 — token coverage is printed as evidence, never the verdict); `missing` means the fact moves or stays, and `undecided` means its worksheet waits: answer it and re-run before deleting. Budgets run **before** splits:
     splitting a long bullet first adds bullets and pushes a principle over its bullet budget.
   - **Stage 4** — `S-LEN-*` splits, then re-run `principle-check.js`; a split that breaks a budget is undone.
   - **Stage 5** — form conversions, per-block confirmation even under `--force` when the block carries a
     `<!-- PROSE_OK: -->` waiver.
   - **Stage 6** — the records. This workflow never writes `adr/` or `tdr/`: it hands the project ADRs (101+) over
     budget to `architecture-definition-record` Workflow 10 (Compact ADRs) and the TDRs over budget to
     `technical-debt-records` (Compact), with the same baseline. Each rewrites the body to the decision or the
     compromise in force and moves history to one log row each. Institutional ADRs (001–100) are never touched.
4. **Review, every section — before any stamp.**
   - `bun [plugin_dir]/skills/architecture-docs/scripts/qualifier-check.js <project_root> --base <baseline>` (covers
     `docs/`, `adr/` and `tdr/`) — a
     qualifier the rewrite dropped: a `Proposed` decision stated as in force, `no verificado` dropped, a severity
     dropped, an unmeasured threshold stated as working, a cost softened. Grep-checked ledgers missed every one of
     these on the reference corpus (12 in the principles, ~25 elsewhere); each finding is restored, never argued.
   - `superseded-claims.js` again — a shortlist, not a gate (on the reference the judge put the four ADR-122 survivors
     in its review band, none above the cut): read each passage it lists and rewrite the ones that assert a retired
     decision to the one in force.
   - `flow-check.js` — the `**Phases**:` line carries the list and a short mode, nothing after it.
   - Any of these reporting `UNDECIDED` has a judge worksheet waiting under `.cache/sa-skills/judge/`: dispatch the `sa-skills:reviewers:worksheet-judge` subagent (Haiku) once per worksheet,
     then re-run the same command, which applies the answers (8.119.0 — no check stands in for the judge any more).
5. **Stamp.** Re-run `prose-check.js --scope release`; on exit 0 (0 BLOCKING findings) stamp
   `<!-- PROSE_STYLE: v1 -->` into `ARCHITECTURE.md` immediately after `<!-- DOC_LANGUAGE: -->`.
6. **Report** what changed — bytes before and after per file (`docs-stats.js`), the facts moved and where, the
   qualifiers restored — and list any WARNING left standing with the reason (usually a deliberate `<!-- PROSE_OK: -->`).

`--dry-run` performs steps 1–2 and stops.

**Out of scope**: `handoffs/`, `analysis/` and `compliance-docs/` — Tier B/C in `references/PROSE_STYLE.md` §9,
no gate.
