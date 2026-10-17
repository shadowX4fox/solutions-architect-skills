> Part of **architecture-definition-record** (8.90.0) — the ADR skill's own workflow for materializing the ADR
> Context Block of a create (`architecture-docs` Workflow 1 Step 6). Read this file instead of loading the skill:
> `SKILL.md` is 85 KB and, invoked at Step 6 of the 8.89.0 control run, stayed in the session's context for the
> rest of the run. This skill stays the only writer of `adr/`: the writer below is its agent, and the index is its code.
> **Directories**: `[plugin_dir]` below is the sa-records plugin — from `architecture-docs` it is `<sa-skills plugin_dir>/plugins/sa-records`,
> the copy sa-skills carries at its own version; `[sa_skills_dir]` is sa-skills' plugin_dir.

#### Generate the project ADRs from the ADR Context Block

1. **The candidates and their ids**:

   ```bash
   bun [plugin_dir]/skills/architecture-definition-record/scripts/adr-prepare.js <project_root> --list --sa-skills [sa_skills_dir]
   ```

   One row per candidate: title, state, the documents that cite it, the id it takes (the next free project ids,
   101 and up — the ADR ID Format Gate by code). **Every candidate with an id in that column gets an ADR**: the
   `DECIDED` ones and the `PENDING — resolved in the documents` ones — a section resolved and cited them, but its
   writer did not update the Context Block (12 of 16 candidates on the 8.90.0 control run, which then generated
   only 4 and left the user to ask for the rest by hand). Only `PENDING — not cited` gets none.
   **The answer recorded at the collection comes first** (8.118.6; optional — without sa-skills' `architecture-docs` there is no collection record, and the question below is asked): `bun [sa_skills_dir]/skills/architecture-docs/scripts/collect-save.js <project_root> --show`
   → `adr`. When it is set, generate every listed ADR without asking: `status` `proposed` → every ADR `Proposed`;
   `accepted` → every ADR `Accepted`; `decided-accepted` → `Accepted` for a `DECIDED` candidate, `Proposed` for the
   rest; `optional` `write` → the **Optional** candidates too, as `Proposed`, `skip` → not them (name them in the
   final report). **Otherwise ask** (`AskUserQuestion`, one question, never skip it): generate these N ADRs now — listing them, and
   which are `Accepted` and which `Proposed` (default `Proposed`) — or not now. When the listing prints an
   **Optional** line (8.92.8 — candidates no section resolved), add a second question in the same call: write those too,
   as `Proposed`, with the ids shown, or leave them out. Never drop them silently and never leave them to the final
   report as the user's to decide.

2. **One payload per ADR**:

   ```bash
   bun [plugin_dir]/skills/architecture-definition-record/scripts/adr-prepare.js <project_root> --candidate <n> --id ADR-NNN --status <Accepted|Proposed> --sa-skills [sa_skills_dir]
   ```

   `.cache/sa-skills/payloads/adr-nnn.md` (~20–25 KB): the target file and header, the canonical template, the
   word budgets, the candidate's row, the passages of the resolving section by score, the PO Spec as the driver
   names it, the related ADRs' decisions. Do not read it here.

3. **One writer per ADR**, in waves of 4 (cap 8):

   ```
   Agent(subagent_type: "sa-records:generators:adr-writer", model: sonnet,
         prompt: "payload_file: .cache/sa-skills/payloads/adr-nnn.md · project_root: <root>")
   ```

   Parse `ADR_RESULT`; never read the ADR. A `findings` line that needs a decision goes to the user.

4. **Checks, by code**: `bun [plugin_dir]/scripts/shared/record-budgets.js adr/ADR-1*.md` — the ADR
   size findings (per-section budgets, body ≤ 1,500 words, one line per log entry). A finding names the ADR and
   the section: re-dispatch that ADR's writer once with the finding as `feedback`, never an edit here — except a
   section over its budget by **≤ 10%** (e.g. References at 154 of 150 words): cut those words with one `Edit` at the
   lines the finding names and re-run the check. A whole writer dispatch for four words cost ~3 calls and ~9K output
   tokens per ADR in the 2026-09-30 control run (8.102.0).

5. **The links and the index, by code**:

   ```bash
   bun [plugin_dir]/skills/architecture-definition-record/scripts/adr-link.js <project_root> --write
   bun [plugin_dir]/skills/architecture-definition-record/scripts/adr-index.js <project_root> --write
   ```

   `adr-link.js` turns every `ADR Candidate N` / `candidatos N y M` / `Candidato ADR [N]` (with a trailing `(DECIDED…)` / `(PENDING)` note) of `docs/**` into a link to the ADR the candidate
   became (the map `adr-prepare.js` recorded in `.cache/sa-skills/adr-ids.json`), adds the ids to the files'
   `related_adrs`, and marks the candidates in the Context Block. Never an edit here: on the 8.90.0 run doing it by
   hand took a Workflow 2 edit, plan mode and a second load of `architecture-docs` at ~350K context.

6. Report the ids written, their files and statuses, and any `Not documented` fields the writers named.
