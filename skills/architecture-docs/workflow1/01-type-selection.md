> Part of **Workflow 1 — Create** (`architecture-docs`). The router is `../ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md`: read this file when the run reaches its step, not before, and read the sibling files from the router's load map when the run reaches theirs. Step numbers are global across the parts.

#### Step 1: Present Architecture Type Options

The types on offer are code's — the base's five and any an institution pack adds — so list them, never from memory:

```bash
bun [plugin_dir]/scripts/shared/arch-types.js --project <project_root>
```

It prints one numbered line per type, `id (default) — name: summary [pack]`, the default first: **ENTERPRISE**
unless an institution pack's `defaults.architectureType` names one of its own. Present that list as printed and ask:

```markdown
📐 **Architecture Type Selection**

<the numbered list arch-types.js printed>

**Which architecture type best describes your system? (a number, or the type id)**
```

The base's types, for orientation (`templates/ARCHITECTURE_TYPE_SELECTOR.md` is the decision guide):

| Type | When |
|---|---|
| `ENTERPRISE` (default) | An enterprise platform: several channels, orchestrated business processes, domain services over systems of record — any industry |
| `MICROSERVICES` | Independently deployable services, each owning its data, behind a gateway and an event backbone |
| `3-TIER` | A web application with one database — maximum simplicity |
| `N-LAYER` | One deployable organized as DDD / clean / hexagonal layers |
| `BIAN` | Banking services modelled on BIAN v14 Service Domains throughout |

#### Step 2: Capture User Selection

Accept a number from the list or a type id in any case or spacing (`enterprise`, `3tier`, `n layer`) —
`collect-save.js --type` resolves it and refuses one that is not on the list.

**If user is unsure:** offer `templates/ARCHITECTURE_TYPE_SELECTOR.md`; otherwise take the default the list marks.

**ADR Context Block update**: After the user selects an architecture type, update the ADR Context Block — mark the "Select architecture pattern" ADR as `DECIDED: [selected type] — [rationale from user input]`.

#### Step 3: The type's templates

Each type is four files — the Section 4 template, the Section 5 template (N-Layer has none: the generic template
applies), the architecture reference and the C4 translation. The base's live under `templates/` and `references/`
(`SECTION_4_<TYPE>.md`, `<TYPE>-ARCHITECTURE.md` …); a pack type's live in its pack, named by its `type.json`.
They reach the writer inside the section payload (Step 5, *Payload per section*): `section-prepare.js --section 4`
carries the Section 4 template and the reference, `--section 5` the Section 5 template and the C4 translation, each
stripped of its metadata comments. Do not read them here.

**GATE CHECK**: `arch-types.js` lists only a type whose files are all on disk — a pack type missing one is skipped
with a warning on stderr. Show any warning it printed.

#### Step 4: Add Architecture Type Metadata

Section 4 (`docs/03-architecture-layers.md`) opens with the selected type's id:

```html
<!-- ARCHITECTURE_TYPE: ENTERPRISE -->
```

The value is a type id from the list (`ENTERPRISE`, `MICROSERVICES`, `3-TIER`, `N-LAYER`, `BIAN`, or a pack's).
It drives type detection on later edits, the principle gate's type matrix (`principle-check.js`) and the Design
Drivers calculation.

#### Step 4.9: Persist the collection and choose the checkpoints (8.31.0; one route since 8.86.0; automatic checkpoints since 8.89.0)

Everything the run has collected so far — the language (0.1), the PO Spec and its score (0.2), the
capability alignment (0.3: the framework and its report), the HLD and its format (0.4), the supplementary context (0.5), the ADR Context
Block (0.6, already at `.cache/sa-skills/adr-context.md`), the architecture type (1–4) and the systems
the user named as internal or external — lives in this session's context. Write it down before
anything is authored, so a script can read it (flow-compose.js could not find the language on the
8.30.0 run because `ARCHITECTURE.md` is written last) and so a fresh session can continue.

**Checkpoints — ask once** (`AskUserQuestion`): **manual** — the create stops four times; the user runs
`/clear` and says "continue the architecture" — or **automatic** — segments 2–4 are written by a
`segment-runner` sub-agent each, in series, with no stop. Automatic needs the C4 systems **now**, because a
sub-agent cannot ask: run the confirmations of `workflow1/05-components.md` 4a (the systems, internal and
external, with their containers) and 4b (the focus system) here, and pass them as `--systems`.

**The project ADRs — ask in the same call** (8.118.6): the status Step 6 gives the ADRs it writes from the Context
Block — **all `Proposed`** (default) · **`Accepted` for the `DECIDED` candidates**, `Proposed` for the rest · **all
`Accepted`** — and whether a candidate no section resolves is written too, as `Proposed` (default: leave it out).
Pass them as `--adr-status proposed|decided-accepted|accepted` and `--adr-optional write|skip`. Step 6 then asks
nothing: on the 2026-10-01 run its question came 30 minutes in and the run waited 10 minutes for an answer.

**The optional diagrams — ask now too** (8.118.8): the two multi-select questions of Step 7.2 (`07-diagrams.md`,
each opening with *None*), passed as `--diagrams none|<letters A–E>`. `AskUserQuestion` takes four questions per call:
when the call above already carries four, ask these two in a second call right after it. Step 7.2 then generates what
was chosen without asking, and the run needs no answer after the collection.

```bash
bun [plugin_dir]/skills/architecture-docs/scripts/collect-save.js <project_root> --lang <en|es> --type <TYPE> \
    --po-spec PRODUCT_OWNER_SPEC.md --po-score <n> --framework <id|none> --alignment <report> --hld "<hld file>" \
    --systems '<json: [{"name","role":"internal|external","containers":[…]}]>' --architect "<name>" \
    --plugin-version <version from .claude-plugin/plugin.json> --checkpoints <manual|auto> \
    --adr-status <proposed|decided-accepted|accepted> --adr-optional <write|skip> --diagrams <none|A,C,…>
```

It writes `.cache/sa-skills/collect.json` (`schema: collect/1`) and refuses a value it cannot verify
(a path that does not exist, a type `arch-types.js` does not list). Then mark the collection and take the first
checkpoint — **do not ask for a route**:

```bash
bun [plugin_dir]/skills/architecture-docs/scripts/create-progress.js <project_root> --done collect
```

**Manual**: it prints `⏸ CHECKPOINT 1 of 4` — display it and stop. The gates, the PO Spec extracts and the type
templates read so far are not needed to write the sections — the payloads carry what each one takes —
and the next session starts from `workflow1/resume.md`. **Automatic**: it prints `⏩ CHECKPOINT 1 of 4` —
go on with `workflow1/05-auto.md`.

**One route: in session.** Workflow 1 writes every document in this session (Step 5), or through
`segment-runner` sub-agents with automatic checkpoints; the record matters because the scripts read the
language and the type from it before `ARCHITECTURE.md` exists.

