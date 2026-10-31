# Changelog — sa-alia

Alia in Claude Code — the suite's optional plugin, released on its own cadence (tags `sa-alia-v<version>`; `sa-ux-v<version>` up to 0.11.0, when it was named sa-ux). Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.1]

### Fixed

- **Her face sits at the start of a reply**, beside her name: the desktop app centred it on the reply's height, so on a long reply it floated down the middle (seen live, 2026-10-31). Every codec — a reply, `/alia`, the radar, the explorer, a card, a confirmation — aligns its mark to the top.



### Changed

- **sa-ux is now sa-alia.** It began as a few drawings of the architecture's state; it is Alia in Claude Code — her codec over every reply, the confirmations, the milestone cards, the verdicts, the notifications — so the plugin takes her name (`plugins/sa-alia/`, marketplace entry `sa-alia`, tags `sa-alia-v*`). Everything 0.11.0 does is unchanged.

### Upgrade

- A plugin's name is its identity in Claude Code, so `claude plugin update` does not carry an install over: `claude plugin install sa-alia@shadowx4fox-solution-architect-marketplace --scope user`, then `claude plugin uninstall sa-ux --scope user`, then `/reload-plugins`. The options (`voice`, `notifyAfterMinutes`, `replyCodec`) return to their defaults, and the remembered findings trend starts over: both were kept under the old name.

## [0.11.0]

### Added

- **Every reply in her codec**, inside an architecture: her mark (her calm face on the desktop app, the ringed sparkle in the terminal) and «Alia» beside a reply's first block, the blocks after it aligned under it, so a reply reads as one codec. The text is the engine's own drawing and the stored message is untouched (ctrl+o shows it as it was); summaries between tool calls stay plain. Her face is the calm one: a reply is her voice, the mood ring stays for her judgements. Option `replyCodec` (default on) turns it off.



### Changed

- **The next-steps band carries her blazon, not her face**: her face in a ring is her voice — the codec of `/alia`, the radar, the explorer, a milestone card, a confirmation — so the band, which offers steps rather than speaking, is marked by her escudo on the desktop app (`assets/alia/escudo.png`, at the codec's size, no ring) and by the bare sparkle `✦` in the terminal, where the codec's is ringed. Her line and the steps are unchanged.



### Fixed

- **Her face in the `/alia` pane on the desktop app**: the pane drew nothing where her face goes — it was the one picture asked for as interactive (for a talking moment), and the desktop app draws an interactive picture as nothing inside a pane (seen live, 2026-10-31). Her face is a still picture everywhere now, as in the transcript and the band, which drew it; the talking moment is gone.
- **The neighbourhood diagram (`/arch`) and the findings trend (`/radar`) on the desktop app** are still pictures for the same reason — both sit inside a pane. Their hover tooltips go with it; the `I-nn` and protocol stay drawn on each link, and the dates and counts stay in the radar's columns.



### Added

- **Today's confirmations, in Alia's look** (`hooks/confirm/`) — asked exactly when they are asked today, deciding exactly what they decide:
  - **A write to the architecture that Claude Code would put to the person** (`Write`, `Edit` or `MultiEdit` on `ARCHITECTURE.md`, `docs/`, `adr/`, `tdr/`) is asked in her dialog: the file, a preview of the lines the write removes and adds (`+2 −1 líneas`, then the lines), `Apply` / `Don't apply`. `Apply` runs it; `Don't apply`, or dismissing it, refuses it with a reason the model reads — as the engine's dialog would. She asks only where the engine would ask the person: its verdict `ask`, a person to answer (`approver`), the main loop, the session in `default` mode — in `auto` an ask is the classifier's, and an unknown mode leaves the engine's dialog standing. The mode is read from the session's own hook events (`classic.SessionStart`, `classic.UserPromptSubmit`). Her dialog has no "don't ask again".
  - **The questions the skills already ask** (the change set before → after, approved before any write) get her codec on top of the engine's own dialog — its options and its answer untouched — inside an architecture.
  - On the terminal the dialog's surroundings are held to its 12 rows (counted at 40 columns): one header row `✦ Alia · confirmar · <file>`, the summary and six lines; on the desktop app her codec with her face and up to twelve lines. A test holds the worst case, so the dialog is never dropped for overflow.



### Added

- **A notification when a long turn ends**: a turn in an architecture that ran at least `notifyAfterMinutes` (a new option, default 3; 0 turns it off) sends one, titled Alia — what the turn moved, from its milestone cards (`Liberada v1.10.2 · tag architecture-v1.10.2`), else her line. A shorter turn never notifies; the cards stay in the transcript either way.
- **`/alia`'s line in the transcript is her codec** — her mark in her mood, the architecture's name, version and status, her line. What the model reads is the text the command answered, unchanged.
- **The findings trend on the desktop radar**: a sparkline per lens — critical in red, high in amber, a tooltip per reading — beside each lens's row. sa-skills keeps one report per lens in `analysis/` and moves the rest to `archive/`, so the history is what this plugin remembers per project (`$.store`, at most twelve readings a lens) as new reports appear, seeded by the archive's newest at first sight; a lens with one reading shows a dash. The terminal keeps its meter.

### Fixed

- **A store that cannot answer no longer stops the radar**: the trend's read is guarded, so the radar, her line and the cards are read whatever the store does.



### Added

- **Readable rows for the suite's scripts** (`hooks/rows/`): a Bash row that runs one of the suite's scripts — recognized by its file name under a sa-* plugin, the checkout or the marketplace's cache, about seventy of them, a `lifecycle.js` subcommand and a `*-prepare.js` payload cutter by their own names — is drawn as `✦ <what it is> <verdict> <the script's own summary line>` (`✦ Gate de principios ✓ LAYER1: PASS — 0 blocking finding(s)`), the warnings it printed counted, the first three findings of a failure kept in view, the raw result folded under it. The verdict is the exit status and the script's own line, picked by code, never reworded. ctrl+o (or `--verbose`) shows the engine's row and result untouched; any other command is the engine's.
- **Milestone cards in the transcript** (`hooks/milestones/`): at the end of each turn the project is read as the skills left it — the version and status, the release tag, each lens's newest report and its critical and high findings, the handoff kit's manifest — and compared with the last reading; each move becomes Alia's card at that point in the conversation: a release (the version, its tag or that it comes after the merge, the changelog entry), the analyses re-run (each lens's deltas; stern when critical findings grew, pleased when every lens improved), the handoff kit regenerated (the components whose payload moved; worried when it was cut at another version). The session's first reading is the baseline. Display only: the model and the transcript file never read them.
- **A container's neighbourhood on the desktop app**: its card in `/arch` draws the container between what calls it and what it calls, each link its `I-nn` and protocol, a tooltip on every element, on Alia's night ground (`hooks/explorer/diagram.ts`). The terminal keeps its lists.
- **The architecture in the prompt footer**: `✦ v1.10.2 Released` beside the engine's mode labels, on the terminal and the desktop app.



### Added

- **Alia speaks in Claude Code**: one line on where the architecture stands, composed by code from what the mods already read (`hooks/alia/voice.ts`) — never by a model — with AliaCodec's mood: stern for critical findings (naming the lens with the most), worried for stale analyses or high findings, thinking when a next step waits, calm with open debt, pleased when all is clear. Recomputed after each turn (`alia` in the state contract).
- **AliaCodec** (`hooks/alia/codec.tsx`): her mark, «Alia» in `aqua-mark`, her line in the mood's theme tone. Where the surface draws pictures (`Svg`: the desktop app, the editor, mobile) the mark is her face — the video's set, at the Alia Guide's 64 px — clipped to a disc inside the mood's ring (`hooks/alia/palette.ts`, `assets/alia/`). In the terminal a face at cell resolution is a blur, so the mark is the codec's sign instead: her sparkle `✦` in a ring that takes the mood's colour.
- **`/alia`**: a pane with her codec over the architecture — its H1, version and status — and the way to every view (release status, the radar, the explorer, the command center, the explainer video), each a draft in the prompt or a pane of this plugin. On the desktop her face talks for a moment when it opens (SMIL in the codec SVG), then holds her mood.
- **Her words on the spinner** inside an architecture: `Tracing seams`, `Weighing trade-offs`, `Reading the ledger` (`Trazando costuras`, `Sopesando trade-offs` … in a Spanish one), a stable pick per engine word; English turns close with her past tense (`Traced for 3s`). Option `voice` (default on) turns them off.
- The escudo as the plugin's icon.

### Changed

- **The next-steps band is her codec**: her mark and line head it, each step opens with `▸`; the mark is left out under 60 columns.
- **The radar pane opens with her codec**; the status line opens with her sparkle (`✦ risk: …`), the brand glyph of every mod (was `◆`).
- **The explorer (`/arch`) opens with her codec**, her line by code (`aliaOnExplorer`): what the open tab comes to (containers outside the architecture, integrations crossing the boundary, ADRs still Proposed, debt still open) or the open card's state (a container's links and the ADRs that govern it, an ADR waiting for its yes, a TDR not yet planned), with her mood.
- **On the desktop app the tables are columns**: the radar's lens table and a card's fields line up as columns, each as wide as its widest cell — padding with spaces aligns only in the terminal's monospaced grid. The terminal keeps its padded rows.

### Fixed

- The picture is chosen by surface, not by the element table: the terminal's table also answers `Svg` (an empty box), so her ringed sparkle came out as nothing there. The tests now hold the terminal to the sparkle and no picture.

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
