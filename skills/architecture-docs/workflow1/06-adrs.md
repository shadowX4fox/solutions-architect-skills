> Part of **Workflow 1 — Create** (`architecture-docs`). The router is `../ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md`: read this file when the run reaches its step, not before, and read the sibling files from the router's load map when the run reaches theirs. Step numbers are global across the parts.

#### Step 6: ADR Generation — the ADR skill's own workflow, without loading the skill (8.90.0)

**Trigger**: after Step 5.7 passes.

**Action**: read and follow `[plugin_dir]/plugins/sa-records/skills/architecture-definition-record/workflows/generate-from-context.md` (the ADR skill ships in sa-records; sa-skills carries it at its own version — in that file `[plugin_dir]` is `[plugin_dir]/plugins/sa-records` and `[sa_skills_dir]` is this `[plugin_dir]`)
— the ADR skill's workflow for materializing the ADR Context Block. **Do not invoke `/skill
architecture-definition-record`** for this step: its `SKILL.md` is 85 KB, and on the 8.89.0 control run it stayed in
this session's context from Step 6 to the end (146K price-weighted to load it, 373K to orchestrate at ~250K context
per call). The workflow file is the skill's own and keeps it the only writer of `adr/`:

1. `adr-prepare.js --list` — the candidates of `.cache/sa-skills/adr-context.md`, the ids they take (101+, the ID
   format gate by code); the statuses come from `collect.json` → `adr` (asked at Step 4.9, 8.118.6) — the question
   to the user is asked here only when the collection recorded none.
2. `adr-prepare.js --candidate <n> --id ADR-NNN --status …` — one payload per ADR (~20–25 KB): the template, the
   budgets, the candidate's row, the passages of the section that resolved it, the PO Spec as its driver names
   it, the related ADRs' decisions.
3. `Agent(sa-records:generators:adr-writer)` per ADR (Read and Write only), in waves of 4. The 8.89.0 run gave each
   batch of six ADRs to a general-purpose sub-agent that read ~190 KB with `sed` and `grep`: 1.58M for 17 ADRs.
4. `record-budgets.js` for the ADR size budgets; a finding re-dispatches that one writer.
5. `adr-link.js --write` — every `ADR Candidate N` in `docs/**` becomes a link to its ADR, `related_adrs` updated, the
   Context Block marked; then `adr-index.js --write` — `adr/README.md` by code (Workflow 7).

`adr-prepare.js --list` gives an id to every `DECIDED` candidate and to every `PENDING` one the documents cite
(resolved by a section whose writer did not update the block); only a candidate cited nowhere gets none. Every
candidate with an id is generated (8.91.0 — the 8.90.0 run generated 4 of 16 and the user had to ask for the rest). The template's ten sections, English structure, prose in `DOC_LANGUAGE`.

After the ADRs are written and `adr/README.md` regenerated: `create-progress.js <project_root> --done 6`, then Step 7.
