# Changelog — sa-ux

The optional UX layer of the suite, released on its own cadence (tags `sa-ux-v<version>`). Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.5.0]

### Changed

- **The release step reads the lifecycle**: it fires from the last `lifecycle.js status` (sa-skills 8.139.0, `.cache/sa-skills/lifecycle/status.json`) — the changes since the tag with the recommended bump, or *Recover the architecture tag* when the document says Released and the tag is missing; a status written for another version is ignored. Without one it still counts the `[Unreleased]` lines.

## [0.4.1]

### Fixed

- **Next steps fill the prompt on a click only**: the rows had digit hotkeys (`1`–`3`, `0` to hide), and a band Button's digit also answers from an empty prompt box — so a `2` typed to answer the model's own numbered options took next step 2 instead. The rows and *hide* now have no hotkey; a click (or Enter with the band focused, `ctrl+x tab`) fills the prompt, never sends it.
- **The radar test held the old compliance tile**: it still expected the `COMPLIANCE_MANIFEST.md` score 0.4.0 removed, and failed on both surfaces. It now asserts the opposite — the manifest is in the fixture and the radar shows nothing of it — so a compliance read coming back fails the test.

## [0.4.0]

### Changed

- **The radar reads nothing of compliance**: the compliance tile, the compliance meter and the status-line part are gone, and `COMPLIANCE_MANIFEST.md` is no longer read or watched. Compliance is isolated — its health is seen in the command center (Alia). The radar shows three tiles: critical, high, open TDRs.

## [0.3.0]

### Changed

- One visual language for the three mods (`hooks/ui.ts`): tones are theme keys (`error`, `warning`, `success`, `suggestion`), never raw colours; glyphs say what a thing is before the words do; meters, rules and aligned labels replace padded text.
- Next steps: a titled band; each row is the action (its digit fills the prompt) and, dimmed, the fact behind it — `Liberar la arquitectura   10 cambio(s) en [Unreleased] desde v7.1.0`. `Step` carries `title` and `detail`.
- Explorer: a tab bar with the open tab as a solid chip and a count per tab; rows open with a glyph in a tone (`●` in scope, `○` out, `⇄` internal, `⇥` boundary, `⋯` external, `✓` accepted, `◌` proposed, `▲` open debt); the scope filter shows its three states with counts, the active one highlighted; a card is a bordered panel with a state badge, aligned fields and its inbound / outbound integrations one a line.
- Radar: four tiles (critical, high, open TDRs, compliance) coloured by state; a meter per lens weighted by severity, lenses sorted heaviest first, a stale report flagged with its age; debt by status and a compliance meter; the rerun buttons under a single warning line.

### Added

- `hooks/ui.test.tsx`: the mods end to end on `terminal` and `desktop` — a project in memory beneath the plugin (the test answers the engine's file, clock, state and process calls), session start, each drawing mounted through the engine, buttons pressed. A tree a surface refuses fails here.

## [0.2.1]

### Fixed

- Next steps kept asking to rerun the Blast Radius analysis after it ran: the rule counted the `blast-radius stale` warnings of the last handoff's `context-result.json`, which named the report it was checked against. A warning now holds only while the report it names is still the newest Blast Radius in `analysis/`.

## [0.2.0]

### Added

- Explorer (`/arch`): a scope filter on Containers and Integrations — `s` cycles all → in scope → out of scope, each with its count. In scope is the ledger's: a container of a system the architecture owns (`owned: true`); an integration that touches one, marked `internal` (both ends inside), `boundary` (one end) or `external` (neither). In-scope containers list first; out-of-scope ones and external integrations are dimmed under "all". A container's card names its system and whether it is in scope; an integration's card its scope.

## [0.1.0]

### Added

- Next steps — up to three prompts above the prompt box, computed from the project's files; a digit fills the prompt as a draft.
- Explorer — `/arch`, a pane over the facts ledger: containers, integrations, ADRs, TDRs, a card per element, actions that fill the prompt.
- Risk radar — the status line (critical and high findings, open TDRs, compliance average, stale analyses) and `/radar` for the detail.
