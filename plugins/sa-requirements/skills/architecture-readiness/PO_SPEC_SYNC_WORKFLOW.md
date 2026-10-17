# Workflow 6 — PO Spec Sync (architecture → PO Spec)

> Workflow 6 of `architecture-readiness`. Loaded when the user asks to update, sync, refresh or
> align the PO Spec with the architecture (`SKILL.md` → "6. PO Spec Sync"). The architecture is
> written from the PO Spec (Workflow 1 of `architecture-docs`); once it evolves — a release, a
> propagated edit, an ADR accepted — the spec must follow, or the next traceability report, the
> next compliance run and the next handoff read requirements the business no longer holds.

**Runs on**: an existing `PRODUCT_OWNER_SPEC.md` and an architecture under `docs/` with a
`docs/CHANGELOG.md`. Without a spec, this is Workflow 2 or 3 (create), not a sync. Without an
architecture, there is nothing to sync from.

**The one rule**: the PO Spec is the **Product Owner's** document, in business language. This
workflow proposes; the user approves item by item; nothing is rewritten silently, and no
container, technology or protocol enters the spec unless the constraint *is* the technology
(§ 7) or the spec already named it.

---

## Step 1 — The delta, by code

```bash
bun [plugin_dir]/skills/architecture-readiness/scripts/po-spec-delta.js <project_root> --sa-skills [sa_skills_dir] [--po-spec <file>]
```

It writes `.cache/sa-skills/po-spec-delta.md` and prints one summary line. Read the file — it is
the whole of what this step needs, and it replaces every changelog read, ADR listing and agent
dispatch that used to happen here:

| Part | What it carries |
|---|---|
| Sync state | The spec's version and date; the `<!-- ARCHITECTURE_SYNC: <version> (<date>) -->` marker (the architecture version the spec last reflected — **never synced** when absent); the architecture's version, status and release date; `behind by N release(s)`, `in sync`, or `in sync; unreleased changes pending` |
| Section mapping | The fixed table of where each kind of architecture change lands in the spec (§ 1 … § 8, Appendix) and how it is written |
| Releases since the sync | Every `docs/CHANGELOG.md` entry after the synced version, plus `[Unreleased]`, as **headlines** — each bullet's bold lead sentence (or its first sentence) and the ids it cites, so the delta stays small however long the changelog grows; `--full` for the bodies verbatim when a proposal needs the argument. Entries rotated to `docs/CHANGELOG-ARCHIVE.md` are read when the sync predates the main file |
| ADRs the changes name | Each `ADR-nnn` those bodies cite, with title, status and scope from the ledger |
| Technical debt | Every TDR, starred when the changes name it |
| Containers updated since the sync | From `**Last Updated:**` — the scope that moved |
| Use cases | The `UC-nn` ids the spec defines vs the ids the architecture's flows serve — **architecture-only** (a flow with no business use case behind it) and **spec-only** (a use case no flow serves) |
| Retired integrations | The struck-through `I-nn` rows |

`never synced` on a spec that has lived through several releases means the first sync is a
**baseline**: read every release entry, not only the latest, and expect a longer proposal list.

## Step 2 — Classify every change into a proposal

Walk the release bodies newest to oldest. For each item that has a business effect, write one
proposal row using the section mapping. Items with no business effect — a refactor, a diagram
regenerated, a renamed internal file, a validator run — produce no row; list them under
*No business effect* in the report so the user sees they were considered.

```
| # | Section | Current text (quote, or "absent") | Proposed text | Source |
|---|---|---|---|---|
| 1 | § 4 UC-09 | absent — no flow serves UC-09 | Retire UC-09, or ask the architecture team for its flow (traceability: spec-only) | delta § Use cases |
| 2 | § 8 KPI "movimiento nuevo visible" | "≤ 30 s" | "≤ 30 s en la ruta de eventos; ≤ 15 min cuando la ingesta cae al lote" | CHANGELOG [Unreleased] Changed · ADR-118 |
| 3 | § 7 | absent | "El equipo de Datos opera la purga de recuperación, con una persona en el lazo" | CHANGELOG [Unreleased] Deprecated · TDR-004 |
```

Rules for the proposed text:

- **Business only — no architecture references.** An ADR, TDR or integration id (`ADR-nnn`,
  `TDR-nnn`, `I-nn`) or a link into `adr/`, `tdr/` or `docs/` never enters the proposed text: the
  spec says what the decision means for the customer or the business, and the id stays in the
  Source column, which is for the Product Owner's review and is not applied. The spec is written
  before the architecture and read by people who never open it; an ADR number there goes stale
  when the architecture renumbers, and a new architecture reads it as a decision already taken.
- Business language. Say what the customer or the business gets, loses or must accept. A
  technology appears only in § 7, and only when the constraint is the technology (a mandated
  platform, a regulatory system) or the spec already named it.
- The **number travels**: a changed latency, freshness, window, volume or availability target is
  written with its value, and § 6 / § 8 are the only places it lands.
- A **spec-only use case** is a question, not a deletion: propose retiring it *or* raising it
  with the architecture team — the user decides which.
- An **architecture-only use case** becomes a proposed § 4 use case in the spec's own format
  (`### UC-nn: <name>` with Actor, Description, Primary Flow, Success Metrics) — drafted from the
  flow's trigger and latency target, never from the containers.
- Every row cites its source in the Source column: the changelog entry, the ADR or TDR id, the delta section.
- Quote the current text verbatim (open the spec by heading range for it — never paraphrase).

## Step 3 — Present, and let the Product Owner decide

Show the proposal table and the *No business effect* list. Ask, item by item or in one pass:
`apply all` · `apply 1, 3` · `skip 2` · `edit 2: <text>`. A declined proposal is recorded, not
lost (Step 5). Do not apply anything before the answer.

## Step 4 — Apply

For each approved row, edit the named section of the spec in place — the same structure and
format the section already uses (the spec's own UC shape, its KPI table, its constraint list).
Keep `<!-- SECTION: … -->` anchors, the `DOC_LANGUAGE` marker and the document language.
Append, never overwrite, in § 4 / § 5 when a use case is added; replace the sentence, not the
paragraph, when a number changes.

Then check, by code — blocking: a finding is an edit at the line it names (the reference
rewritten as what it means for the business), never a stamp over it:

```bash
bun [plugin_dir]/skills/architecture-readiness/scripts/po-spec-delta.js <project_root> --check
```

A spec that already carried references before this sync fails the check too: list them to the
Product Owner as proposals of their own (current text → the same sentence without the reference)
in Step 3, rather than stamping a spec that fails.

Then stamp, by code — it writes the marker, bumps the spec's `**Version**` (minor) and sets
`**Date**` to today:

```bash
bun [plugin_dir]/skills/architecture-readiness/scripts/po-spec-delta.js <project_root> --stamp --sa-skills [sa_skills_dir]
```

## Step 5 — Sync log, score, PDF

1. In the spec's Appendix, add or extend a **Sync log** table — one row per sync:
   `| Date | Spec version | Architecture version | Applied | Declined |` with the proposal
   numbers, so the next sync and the next traceability report know what the business chose.
2. Re-score the spec (Workflow 4, `PO_SPEC_SCORING_GUIDE.md`) and report the score next to the
   previous one — a sync must not lower it.
3. Render the distribution PDF (Workflow 5) — every write of the spec renders it.
4. Report:

```
PO Spec synced: v{old} → v{new}, reflects architecture v{version}
  Proposals: {n} · applied {a} · declined {d} · no business effect {x}
  Use cases: {n} in spec, {m} served by flows, spec-only [{…}], architecture-only [{…}]
  Score: {old} → {new}
  PDF: exports/PO-SPEC-{slug}.pdf
  Next: run `check requirements coverage` (architecture-traceability) to confirm the spec and the
  architecture agree on every use case.
```

## When the sync runs on its own

- **`architecture-lifecycle`** (release, status) reports the spec's sync state in its receipt and names
  this workflow when the marker lags the released version.
- **`architecture-docs` Workflow 2** (edit) names it in the Phase 4 propagation report when the
  edited file is one the spec reads (docs/01, docs/04, docs/05, docs/07, docs/08) or an ADR was
  accepted.
- Neither runs it: the Product Owner's document changes only when the Product Owner is asked.
