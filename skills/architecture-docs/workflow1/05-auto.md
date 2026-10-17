> Part of **Workflow 1 — Create** (`architecture-docs`, 8.89.0). Read it after Step 4.9 when the collection chose
> **automatic checkpoints** (`collect.json` → `checkpoints: auto`). Manual checkpoints stop and resume instead
> (`workflow1/resume.md`).

#### Step 5 with automatic checkpoints — one segment-runner per segment, in series

Segments 2–4 are written by `sa-skills:generators:segment-runner`, one sub-agent per segment, each in its own
context. This session keeps only the receipts and the runners' `SEGMENT_RESULT` blocks, and does what a
sub-agent cannot: the Layer 2 review of Section 3 and any question for the user (the component index is the guardian's CLI,
which the runner calls — 8.90.0). Never read the documents a runner wrote; its result and `create-progress.js` are the state.

**For segment 2, then 3, then 4:**

1. `bun [plugin_dir]/skills/architecture-docs/scripts/create-progress.js <project_root>` — the `next` item, and
   `segment … (<name>: <items>)`.
2. Dispatch the runner:

   ```
   Agent(subagent_type: "sa-skills:generators:segment-runner", model: <opus for segments 2 and 3 — they hold
         Sections 4, 3 and 6 — sonnet for segment 4>,
         prompt: "project_root: <root> · plugin_dir: <plugin_dir> · segment: <n> · items: <the segment's items, in order>")
   ```

3. Parse `SEGMENT_RESULT`. Carry `decisions` (they are already in `.cache/sa-skills/adr-context.md`) and
   `names_introduced`. An `escalations` line → ask the user, then dispatch the runner again for that one item
   with the answer as `feedback`.
4. What the runner leaves to this session:
   - **Segment 3 — `s3-layer2`**: `principle-gate-prepare.js <project_root> --mode first-write --round 1` and one
     `Agent(sa-skills:reviewers:principle-quality-reviewer, model: opus)` with `.cache/sa-skills/payloads/principle-gate.md`
     as its prompt. `PASS` → `principle-check.js <project_root> --stamp-review PASS` (the release reads the stamp), then
     `create-progress.js <project_root> --done s3`. A BLOCKING finding → `Write` the
     review's `PRINCIPLE_REVIEW_RESULT` block to `.cache/sa-skills/payloads/principle-review-round<n>.md`, dispatch the
     runner with `items: s3` and the review as `feedback` (it fixes the BLOCKING findings only — warnings stay as they
     are), then review once more as a **repair round** (8.118.7): `principle-gate-prepare.js <project_root> --mode
     edit-delta --round <n+1> --prior .cache/sa-skills/payloads/principle-review-round<n>.md` — the script diffs the
     principles against what the last round reviewed, and the reviewer judges the changes and whether the blocking
     findings were resolved, not the whole file again. Two rounds at most; what is still open goes to the user with
     the findings. Segment 4 does not start while `s3` is open.
5. `create-progress.js <project_root>` must show every item of the segment done before the next dispatch. An
   item the runner did not mark → dispatch it again alone, once; then escalate.

A `⏩ CHECKPOINT` line is not a stop: go on to the next segment. After segment 4 (`index` done), the closing
runs in two more dispatches and one step here, **without loading the closing files into this session**:

- **Step 5.7** → a runner with `items: 5.7` (model sonnet): it reads `05.7-hygiene-gate.md` itself, runs the
  checks, fixes by line, answers a judge worksheet and marks `5.7`. An `escalations` line is the gate's round-4
  question: ask the user (proceed with the listed findings, or fix them how), then re-dispatch with the answer as
  `feedback`. The 8.89.0 run did this step here at ~190K context per call.
- **Step 6** → `06-adrs.md` here (the ADR skill's own workflow).
- **Step 7.1** → a runner with `items: diagrams` (model opus): it writes them from `diagram-prepare.js`'s payload and
runs the checks; this session then asks Step 7.2's question, runs the Step 7.3 audit and Step 7.3b's pending-TDR check and marks `7`. Never hand
the diagrams to a general-purpose sub-agent: without the payload it reads the guides whole (8.89.0: 37 calls). The completion
block's route line reads `in-session with segment runners (automatic checkpoints) — <n> dispatches, <r> repair rounds`.
