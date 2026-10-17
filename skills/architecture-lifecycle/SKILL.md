---
name: architecture-lifecycle
description: "The lifecycle of an architecture — where it stands, whether it can be released, what changed since the last release, and the release itself. Invoke first, without planning, for any request to release, publish, ship, tag, freeze, bump or finalize the architecture version, to check release readiness, to ask the architecture's status or which downstream artifacts are stale, to recover a missing architecture tag, or to deprecate an architecture. Not for Word export (architecture-docs-export). A release is a git tag: the project must be in a git repository."
triggers:
  - release my architecture
  - release architecture
  - release architecture version
  - publish architecture
  - ship architecture
  - tag architecture version
  - freeze architecture
  - bump architecture version
  - finalize architecture
  - architecture status
  - architecture lifecycle
  - is my architecture ready to release
  - release readiness
  - recover architecture tag
  - deprecate architecture
---

# Architecture Lifecycle

```
intake ─► create ─► v1.0.0 Draft ─► release ─► Released vN ─► edits / ADRs / TDRs ─► release ─► vN+1 … ─► deprecate
```

One script runs it: `scripts/lifecycle.js`. The state is **derived, never stored** — the version in `ARCHITECTURE.md`
is the last released one, its baseline is the annotated tag `architecture-v{version}`, and the change list is the
facts ledger of the tag's tree against the working tree. Edits write no marker.

| State | Meaning | Next |
|---|---|---|
| `draft` | no release yet | first release keeps v1.0.0 |
| `changed` | the docs differ from the tag, or `[Unreleased]` has lines | release |
| `released` | the docs match the tag | refresh stale downstream artifacts |
| `untagged` | `Released` in the document, tag missing | `recover` |
| `deprecated` | `ARCHITECTURE_STATUS: Deprecated` | — |
| `no-git` | not a git repository | nothing can be released |

## Resolve `plugin_dir`

`plugin_dir=$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts)` —
show its stderr warning when a newer version is on the machine. `L` below is
`bun [plugin_dir]/skills/architecture-lifecycle/scripts/lifecycle.js`.

## Status — "architecture status", "what is stale"

`L status <project_root>`. Quote the receipt: state, version, tag, the change list with its recommended bump, the
downstream artifacts (PO Spec, handoff kit, traceability, analysis reports, command center, Word export) each with the
version it was built from and the prompt that refreshes it. Compliance contracts are never read — the receipt reminds
to re-run them after a release.

## Delivered in pieces — "release increment 2", "what does increment 2 need"

One target design; `docs/01` § Delivery Increments (`<!-- LABEL: Delivery Increments -->`, `Increment | Use Cases |
Target`) assigns its use cases to increments. `bun [plugin_dir]/scripts/shared/increments.js <project_root>
[--increment <id>]` derives each slice — flows, phases, containers and integrations, cumulative, with what is new —
and names the gaps (a use case no flow serves, a flow without phases). Status lists the increments with the release
that carried each. Never assign a container to an increment by hand: move a use case.

A **temporary** element (one a later increment replaces) carries its window and TDR — `**Delivery Increments:** 1–2 ·
TDR-NNN` in a descriptor, the `Increments` column in docs/05. Releasing the increment after its window blocks
(`retire-pending`) until it is retired: strike the docs/05 row, remove the container (architecture-component-guardian),
resolve the TDR (technical-debt-records). Guide: `ARCHITECTURE_DOCUMENTATION_GUIDE.md` § Delivery Increments.

## Check — "is my architecture ready"

`L check <project_root> [--no-render]` runs every gate the architecture already has, once: principles (Layer 1), the
Layer 2 review stamp, prose at release scope, explorer headers, components, derived sequences, flows, Mermaid,
connection labels, integrations, shape budgets, TDRs, ADR index. Exit 1 names the blocking gates, each with its fix. A
gate that stops on a judge worksheet (`judge worksheet pending`) — dispatch `worksheet-judge`, one per worksheet, then
re-run.

**The Layer 2 stamp**: `docs/02` ends with `<!-- PRINCIPLE_REVIEW: PASS|WARNING <date> sha256:<hash> -->`, written by
`principle-check.js --stamp-review` after the Section 3 Enforcement Gate (`architecture-docs` `EDIT_WORKFLOW.md`). Any
edit of the principles voids it; a missing or stale stamp blocks the release — run the gate, never hand-write the stamp.

## Release — "release my architecture", `/release-architecture`

1. `L plan <project_root> [--increment <id>]` — refuses on `no-git`, `untagged`, `deprecated`, or nothing changed. Otherwise: the gates,
   the change list (each line with its bump), the recommended bump, and `.cache/sa-skills/lifecycle/entry.md` — the
   changelog entry: the `[Unreleased]` lines written by hand first, then the change list by code (a first release keeps
   its Draft entry). With `--increment` (asked when the project declares increments and the user did not name one):
   the `increment` gate, and the entry opens on the delivery scope line, which the tag carries too.
   The other gates block on what the increment ships: a prose, header, component, flow, integration or budget finding
   located in a component, a docs/05 row or a docs/04 flow or phase outside the slice is printed and does not block
   (`N in increment … (M outside it, not blocking)`, or `warn` when none is inside). Section files, principles, ADRs and
   TDRs are the whole design's and block every increment.
2. A blocking gate → show it with its fix and stop. The user fixes it, or waives it explicitly with a reason
   (`--waive <gate>:<reason>`, written into the entry). Never waive on your own.
3. Show the change list and ask **one** question: the bump — recommended first (`MAJOR` something was removed or the
   structure changed · `MINOR` something added or a decision moved · `PATCH` text only). A first release asks nothing.
4. Optional: polish `entry.md` — one short description per line where the code wrote only "content", duplicates of a
   hand-written line removed; one line per change, Keep a Changelog keywords English, prose in `doc_language`. Edit it
   at the lines, never rewrite it.
5. `L apply <project_root> [--bump major|minor|patch] [--direct] [--waive <gate>:<reason>]` — refuses if the
   architecture changed after the plan. Writes the `ARCHITECTURE.md` metadata, `**Architecture Version:**` in every
   component file, the changelog entry (rotated past five), refreshes the command center when a scene exists (optional:
   architecture-command-center), commits **only** `ARCHITECTURE.md`, `docs/`, `adr/`, `tdr/`, tags and pushes.
   **PR** (default): `release/architecture-v{version}` branch, pushed with the tag, compare link printed. **`--direct`**:
   commit and tag on the current branch. No `origin` → direct, local.
6. Quote the receipt: version, commit, branch, tag and push state, waivers, the downstream now stale. A failed push
   is reported with the command to retry — never as success.

## Recover — `untagged`

`L recover <project_root>` — the tag exists locally but not on origin: push it; on origin only: fetch it; nowhere:
confirm with the user, then tag `HEAD` with the version's changelog entry and push (refused while the architecture has
uncommitted changes).

## Deprecate

`L deprecate <project_root> --by "<note>"` — `ARCHITECTURE_STATUS: Deprecated` and a `**Deprecation Note**`. No tag.

## Rules

- Every write is the script's: never edit the version markers, the changelog entry heading or a tag by hand.
- Run git only through the script; it never force-pushes, amends or skips hooks. A failing hook stops the release with
  the files written and nothing tagged.
- A released version is the tag; a correction is a new PATCH release.
