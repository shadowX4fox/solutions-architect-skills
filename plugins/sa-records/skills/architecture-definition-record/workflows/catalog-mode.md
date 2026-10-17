# Catalog mode — the side that publishes the institutional catalog

Loaded by `SKILL.md` § *Mode* when the repository carries `.sa-skills/adr-catalog.json`. The rest of the skill is
written from a **consuming project** — one that holds a read-only copy of the catalog under `adr/`. A catalog
repository is the other side: it authors and amends the originals. No `ARCHITECTURE.md` is read or required here.

**Precedence**: the catalog's own rules (its `PROJECT_INSTRUCTIONS.md` or equivalent, named in the marker's
`instructions`) → this file → `SKILL.md` and `ADR_GUIDE.md` for everything this file does not override.

## The marker

`.sa-skills/adr-catalog.json`, committed at the catalog root:

```json
{
  "schema": "adr-catalog/1",
  "role": "institutional-catalog",
  "instructions": "PROJECT_INSTRUCTIONS.md",
  "editions": [
    { "lang": "en", "dir": ".",  "normative": true, "index": "llms-adr-index.md" },
    { "lang": "es", "dir": "es", "index": "llms-adr-index.md" }
  ],
  "conventions": { "header": "table", "numbered_sections": true },
  "coverage": { "map": "COVERAGE_MAP.json", "editions": { "es": "es/COVERAGE_MAP.json" } },
  "size": { "pending": [], "exceptions": { "ADR-0NN": { "ceilings": { "decision": 620 }, "reason": "…" } } }
}
```

- `editions` — exactly one `normative`; every other edition is a translation kept in full sync, same filenames.
- `conventions` — `header: table` is a `| Field | Value |` header; `numbered_sections` writes `## 1. Context`. House
  conventions, never defects.
- `size` — read by `scripts/catalog-check.js`: ADRs over budget when the rule was adopted (`pending`), and compacted
  sections that stay over because what remains is normative (`exceptions`, a ceiling and a reason each).

## What inverts

| The skill says (consuming project) | In the catalog |
|---|---|
| ADRs 001–100 are a read-only copy; never edited | They are the **originals**, authored and amended here |
| Supersede to change a decision (Workflows 3.2, 4; `ADR_GUIDE.md` § Updating ADR Status) | **Amend in place** (below). Supersede only a real repeal |
| Workflow 6 imports the catalog; Workflow 9 syncs it; the pin guards the copy | **Refused**: the catalog would import itself. No pin; integrity is the catalog's own verification |
| `adr/README.md` by Workflow 7 | Each edition's `index` from the marker, in that edition's language. Workflow 7 is refused |
| Language from `DOC_LANGUAGE` in `ARCHITECTURE.md`; one language authored | The editions from the marker; the normative one is authored first, every other one in the same change |
| Size Rule and Workflow 10 for 101+ only; `docs-stats.js` measures them | **Every ADR.** `catalog-check.js` measures the normative edition, reports the others |
| Workflow 1 generates from `ARCHITECTURE.md` | Refused: there is no architecture here |
| The coverage map is imported as data | The coverage map is derived here, by the compliance plugin's coverage skill (§ Coverage map) |

## Change, amend or add? — five outcomes

Most updates are the first two. Go through the table before opening a file.

| The change… | Outcome |
|---|---|
| Rewords, illustrates or exemplifies a decision already taken | **None** — update the guideline or diagram only |
| Changes a **value** inside a decision in force — a version, threshold, region, tier, deadline | **Amend** the ADR that states it |
| Decides something **no ADR decides** today | **New ADR** |
| **Closes discretion** an ADR left open on purpose, for one scope | **New ADR that narrows** — the original stays correct for everyone else |
| **Reverses** a decision in force | **New ADR**, and the old one moves to `Superseded` |

If unsure between amending and narrowing: would the original still be right, as written, for every other case? Yes →
a new ADR that narrows.

## Workflow 11 — Amend an ADR

The catalog stays small because an accepted ADR is reopened and changed, not stacked on.

1. **Measure** — `bun [plugin_dir]/skills/architecture-definition-record/scripts/catalog-check.js <root> -v`; record
   `git rev-parse HEAD` as the baseline.
2. **Rewrite the normative edition in place**, one `Edit` per passage: the body states the decision **in force** —
   never "originally…", "since the amendment…", a struck value or an `Amended:` paragraph. One Review History row: date ·
   actor · `Amended` · what changed, ≤ 30 words.
3. **Broadening amendments** — the scope widens or the title changes — are whole-document jobs: Decision and Scope
   first, then Requirements, Rationale, Comparison, Risks, Alternatives and Implementation Notes, which carry the old
   vocabulary a reader uses to decide whether the ADR is about them. Vocabulary kept on purpose is declared in the
   row, quoting the text: `Retained vocabulary: "…" (where).` A retitle names the old title in the row
   (`retitled from *…*`). Neither is counted against the row's length.
4. **Title changed** → rename the file in every edition and fix every inbound link.
5. **Every other edition, in the same change** — retranslate the amended passages, move the sync stamp, name the old
   translated title in its row. A translation is part of the amendment, never a follow-up.
6. **Qualifiers** — every status, severity and threshold the rewrite dropped goes back. Without `architecture-docs`,
   compare them by hand; with it (optional): `bun [sa_skills_dir]/skills/architecture-docs/scripts/qualifier-check.js <root> --base <baseline> --file <normative> --file <edition>`
   — the default engine writes a worksheet and exits 0; its qualifiers are undecided until the `sa-skills:reviewers:worksheet-judge`
   subagent answers it and the command runs again.
7. **Coverage** — if the Decision, Consequences or a passage quoted as `evidence` changed, re-derive that ADR's entry
   (§ Coverage map), return it to the board, re-render every edition.
8. **Indexes** — regenerate each edition's `index`.
9. **Verify** — `catalog-check.js` and the catalog's own verification; commit.

A status change alone (`Accepted → Deprecated`) is an amendment of the header plus one row.

## Adding an ADR

Next free number in 001–100 → the canonical template (`adr/ADR-000-template.md`) in the marker's `conventions`, born
within budget → the blocking gates (`ADR_GUIDE.md`: title ≤ 50, Problem Statement ≤ 200, ID format, slug) → `Related`
both ways → every edition in the same change → coverage (§ Coverage map) → indexes → verify.

## Compacting an ADR (Workflow 10 here)

Workflow 10 as written, one ADR per change, with four differences: the scope is every ADR; the measure is
`catalog-check.js -v`; every edition is rewritten in the same change and the coverage quotes it held are re-rendered, keeping verbatim every sentence either map quotes; and the ADR leaves `size.pending` in that change, or
takes its compacted size as a ceiling in `size.exceptions` with the reason when what remains is normative. The Review
History row: `Compacted to the decision in force; no decision changed.` Never drop a decision, a constraint or a
qualifier to fit — a table row that binds stays.

## Coverage map

Derived and rendered by the coverage skill of the compliance plugin the organization installs — this skill never derives
it; without one, the map is left as it is and an amendment that touches a quoted passage is reported. In the catalog: `catalog_dir` = the root; the map and its editions from the marker's `coverage`; the writes are
local and version-controlled. The four invariants: the root map governs; an edition is **rendered, never derived**;
ratification lives at the root and is copied; only an `Accepted` ADR is ratified — any other status takes
`skipped_reason`, no `satisfies`, and a place in `pending_ratification`.

| Event | Coverage action |
|---|---|
| New ADR accepted | Derive, ratify, render |
| Amended — Decision, Consequences or a quoted passage | Re-derive that entry; ratify again; render |
| Amended — wording outside what is quoted | None, unless a quote stopped being verbatim |
| `Proposed → Accepted` | Leaves the gate: derive, ratify |
| → `Superseded` / `Deprecated` | Enters the gate: `skipped_reason`, ratification withdrawn |
| Any change to the root map | Re-render every edition, then the coverage skill's edition check |
| Compliance questions changed (a new registry) | The coverage skill's registry check → re-derive the entries it names, re-ratify, render |

## Verification

`catalog-check.js` holds the size rule. The catalog keeps its own checks for what is its alone — edition parity and
sync stamps, links, indexes, knowledge-source files — and runs `catalog-check.js` beside them.
