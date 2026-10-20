# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

10.1.0 is the first public release. Earlier versions were developed privately and their history is not published.

## [10.10.4]

### Fixed
- **`what_changed` reports what the developer must act on, not what a release restamped.** Parts were compared by their bytes, so a release that only moved the version stamp, relinked a part inside the pack (10.10.3) or wrote the specification's debt table by code (10.10.2) marked contracts, interfaces and documents as changed, turned the component `action_required` and listed every open question as both new and resolved.
  - A part is now compared by its substance: link targets and the architecture's own version masked, the specification's technical debt table left out (it is reported as `technical_debt`). A part whose bytes moved and whose substance did not is listed under `restamped`, never an action. Open questions are keyed the same way.
  - Read from the bundles on disk; a bundle held in memory still compares bytes.
- **`BUILD.md` rule 10:** a workaround marked in a file that must not change once applied (a database migration) is marked in the code that keeps it instead, when the TDR's id replaces the issue's URL.

## [10.10.3]

### Added
- **The build pack carries the component's technical debt.**
  - Each TDR the container's descriptor names on its `**Technical Debt:**` line is a `tdr:TDR-NNN` part under `tdrs/`. It belongs to the plan's specification step, since the specification's § 7 lists it. `pack.json` gains `tdrs`.
  - Before this, the pack named the debt but did not carry it, so the builder saw only an id.

### Fixed
- **Links inside a build pack resolve.** A Markdown part linked the documents relative to its place in the architecture repository, so `../../adr/…` and `../../tdr/…` led nowhere inside the pack.
  - A link whose target travels in the same pack (an ADR, a TDR, an interface, a shared document) is now rewritten to the part's path in the pack, with its `#anchor` kept, and the part's `sha256` is taken afterwards.
  - Any other link, such as one to `docs/`, stays as written.

## [10.10.2]

### Fixed
- **A component's specification names its technical debt.**
  - **The defect:** the descriptor's `**Technical Debt:**` line reached the generator inside the raw descriptor, but no template slot or rule asked for it. The demo project's v1.3.0 kit, edited in place, showed the result: one specification gained a sentence on TDR-002 in its § 6, while the other, with the same line, named neither TDR-001 nor TDR-002.
  - **`scripts/kit-debt.js` (Step 5.3b)** now writes `### Technical debt <!-- LABEL: Technical Debt -->` at the end of § 7 Constraints, by code and for every component of the kit. It has one row per TDR the line names, with the linked id, title and status. The table is replaced on every run and removed when the line names none.
  - **`handoff-prepare.js` leaves the line out of the payload.** A release that only records debt therefore keeps the specification and sends nothing to the model. The generator is told debt is code's, and never names a TDR.

## [10.10.1]

### Changed
- **The local index server is pinned to Alia 0.3.0** (`local/compose.yaml`, `SA_INDEX_SERVER_TAG`). `preview_tier0` and `preview_escalation` now accept `supervision: "unattended"`. Unattended, `preview_tier0` renders `tier0.js`'s issue: only the `tier0:<kind>` label, the unattended footer, and no `architecture-tier0` in `file_with`. Closes #9.
  - `BUILD.md` rule 10 keeps its fallback ("drop that label from `file_with.steps` if the server still lists it"). A team that pins an older server, or reads a shared one that has not upgraded, still needs it.

## [10.10.0]

### Added
- **Unattended builds.** The build packs and the MCP server were already readable by any MCP client, but their rules assumed a person: someone who answers, says yes, and files with their own access. Now a build that no person attends declares itself in the service repository's binding: `"supervision": "unattended"` in `.architecture.json`.
  - **What changes in `BUILD.md`:**
    - **Rules 3 and 5:** a gap, or a choice the standards leave open, becomes a `TODO(architecture)` at once. Rule 5 previously had no fallback when nobody answered.
    - **Rule 9:** an escalation is filed with the build's own identity, since an escalation writes nothing.
    - **Rule 10:** a Tier 0 request goes through `preview_tier0(…, supervision: "unattended")` and is filed **without** `architecture-tier0`. A person applies that label, and that is the approval.
    - **The pull request:** the work ends in a PR that lists every TODO and every filed issue under *Architecture requests*.
  - **`tier0.js`:** an unattended request carries only the `tier0:<kind>` label, and its footer says a person applies the key. The attended issue is byte-for-byte unchanged.
  - **`docs/RUN_TEAMS.md` § Who consumes the index:** the three consumers (an IDE, an unattended build agent, a deterministic pipeline that reads `download_url` pinned by `pack_revision`) and the unattended flow.

### Fixed
- **The Tier 0 key was a role check only.** An automation account with write access, such as a machine user with a PAT, could label its own request and start a write. `architecture-tier0.yml` now refuses a labeller whose type is `Bot`, and the accounts listed in the new variable `SA_TIER0_AGENTS`, before it reads the role.

### Upgrade
- **Architecture repositories with the CI workflows:** copy `ci/architecture-tier0.yml` again, pin `SA_PLUGIN_REF: v10.10.0`, and set `SA_TIER0_AGENTS` to the accounts your build agents use. Republish the index so the build packs carry the new rules.
- **The MCP server** needs `preview_tier0` and `preview_escalation` to accept `supervision`. Until then, an unattended agent drops `architecture-tier0` from `file_with.steps` itself, as `BUILD.md` says.

## [10.9.3]

### Changed
- **The local index server is pinned to Alia 0.2.2** (`local/compose.yaml`, `SA_INDEX_SERVER_TAG`). Its `what_changed` reports each container's technical debt, ported from 10.9.2: TDRs added, status moves, and TDRs no longer named. Closes #8.

## [10.9.2]

### Fixed
- **What changed now reports a container's technical debt.** `export-index.js --diff`, and `changes.json` with it, compares each container's `**Technical Debt:**` TDRs in the two ledgers. It reports TDRs added (with title and status), status moves, and TDRs no longer named: `- technical debt: added TDR-001 — … (Open)`.
  - This counts as a change, but never as `action_required`.
  - Before this, a release whose only change was a new TDR on a container did not report it. An IDE moving the demo project from 1.1.0 to 1.2.0 never learned of TDR-001.
  - A bundle written before 10.8.0 reads as having no debt.
  - The architecture MCP server computes `what_changed` with its own port of this diff, so it needs the same change.

## [10.9.1]

### Changed
- **The local index server is pinned to Alia 0.2.1** (`local/compose.yaml`, `SA_INDEX_SERVER_TAG`). Its `preview_tier0` reads the TDR statuses and drivers from the bundle (`support.tdr_statuses`, `support.tdr_drivers`) and no longer keeps its own copy. Closes #7.

## [10.9.0]

### Added
- **Edit mode for the handoff kit.** A part whose sources changed is edited in place instead of being rewritten in other words.
  - `handoff-prepare.js` handles each REGEN part that exists and whose payload hash moved. It cuts the payload again from the tree of the release the part was written at (`architecture-v<version>` from the manifest, via `git archive`, with the same plugin and the same judge answers) and compares the two cuts without their stamps.
  - If they are equal, the part is kept and its version row is restamped. A manifest hashed in an older form therefore costs no regeneration.
  - If they differ, the part carries `edit_path`: the delta, plus a copy of the previous text under `.cache/sa-skills/handoff-payloads/edit/`.
  - The generators (Runtime View, Cross-Cutting Standards, Interface Contract, Component Specification, asset) gain `Edit` and an *Edit mode* section. They change only the sections the delta reaches and return `edited_sections` (an asset returns `edited: yes | no`).
  - `kit-edit.js check --restore` (Step 5.2a) compares each edited part with its previous text section by section, masking dates and the version row, and puts back every section that changed without being declared.
  - A part is still written whole when there is no tag, no previous file, the template changed, or the delta reaches more than half the payload.
  - Measured on the demo project's v1.1.1 → v1.2.0 release, which added one TDR: before this release, 14 files rewritten. With it, 6 of 7 parts kept and one Component Specification edited. Its delta is one line, the descriptor's `**Technical Debt:**` link.

### Fixed
- **A seam payload linked the documents by absolute path.** `link()` switched to an absolute path once the relative one climbed four levels, and the seams' folder sits one level deeper than the other payloads. The seam's hash therefore held the checkout path. Links are now relative whenever the payload is inside the project.
- `CONTEXT_RESULT` omits a list field that a part does not carry.

### Upgrade
- No action beyond the usual `SA_PLUGIN_REF` pin. The handoff CI keeps the 10.8.2 prompt (no `--force`).

## [10.8.2]

### Fixed
- **A release no longer rewrites the whole handoff kit.**
  - Each payload carries its architecture version, generation date and checkout path, and the hash covered them. Every release, every run on another day, and every other checkout therefore made every part REGEN.
  - The release CI then added `--force`. A release that only added one TDR rewrote 14 files of the kit (about 870 lines), and almost all of it was the same content in other words.
  - `hashPayload` now leaves those stamps out.
  - A part whose payload has not changed is kept. `handoff-prepare.js` moves its Architecture Version row and its manifest entry by code (`restampVersion`, both languages), so `kit-check`'s `version-stale` still passes.
  - `ci/architecture-handoff.yml` no longer asks for `--force`. Measured on a version-only release of the demo project: 0 REGEN out of 7 parts, one line changed per document.
- **The manifest lists `security.md`** with each component's assets, beside `c4-descriptor.md`. Both are rendered by code, and the Step 6.0 filter dropped `security.md`.

### Upgrade
- **Hashes in an existing `handoffs/.manifest.json` are in the old form.** The first handoff after this upgrade regenerates every part once. Every later run keeps what did not change.
- **Projects with the CI workflows:** copy `ci/architecture-handoff.yml` again (its prompt dropped `--force`) and pin `SA_PLUGIN_REF: v10.8.2`.

## [10.8.1]

### Fixed
- A TDR's title in the facts ledger carried its id (`TDR-001: …`, from the H1), where an ADR's does not: every reader that prints the id beside the title doubled it — the release's change line and changelog entry (`TDR: TDR-001 — TDR-001: …`), the PO Spec delta, the analysis payload, the Section 13 payload. `arch-facts.js` drops the `TDR-NNN:` prefix, as for ADRs.
- The CI examples pin `v10.8.1`.

## [10.8.0]

### Added
- **A component names its technical debt.** The TDR skill's "link both ways, TDR ↔ affected components" had no place on the component's side, so each run put the link somewhere else or nowhere. An affected component's descriptor now carries `**Technical Debt:** [TDR-NNN](…) · …` after `**Last Updated:**` — ids only, the compromise stays the record's; the TDR skill writes it with the record and drops the id when the record is `Resolved` (`ARCHITECTURE_DOCUMENTATION_GUIDE.md`, the skill's steps 5 and Update).
- The facts ledger reads it as each component's `tdrs`.
- `tdr-check.js` holds both directions — `component-link-missing` (a record in force names a component whose descriptor does not name it back), `component-link-unknown`, `component-link-resolved`, `component-link-unmatched` — as WARNINGs, so an existing project adopts the line on its next edit.
- Tier 0: a new workaround TDR is refused without the link from each affected component (`tier0.js verify`), and `architecture-tier0.yml`'s prompt names the line. The link is the record's own part of the ledger, so it never counts as another fact moving.

### Changed
- The CI examples pin `v10.8.0`.

## [10.7.4]

### Fixed
- A Tier 0 record propagates over the documentation surface, and `tier0.js verify` held it to a list of files. The TDR skill links both ways — TDR ↔ affected components, TDR ↔ ADR — and adds the Section 13 row; the ADR skill indexes and links. Verify now allows that propagation over `docs/` and the project ADRs where every changed hunk names the record's id, and refuses an unrelated change, any institutional ADR (001–100), and a fact of the ledger outside the record's own part (a name, type, technology, integration, flow, figure or another record's status — `factsHash` minus the record's section, taken at `prepare` for every kind). `architecture-tier0.yml`'s prompt states the same limits.
- The CI examples pin `v10.7.4`.

## [10.7.3]

### Fixed
- A Tier 0 request merged automatically left its issue open: a merge by `GITHUB_TOKEN` does not run the PR's `Closes #N`. `architecture-tier0.yml` closes the issue itself after the merge, naming the record and the PR.
- A workaround TDR could reach `main` without its summary row in the Risks and Technical Debt section — the TDR skill's step 6, which one of two real runs skipped. The workflow's prompt names the row, and `tier0.js verify` refuses a new TDR whose row is missing when the section exists.
- The CI examples pin `v10.7.3`.

## [10.7.2]

### Fixed
- `tier0.js verify` refused a correct workaround TDR: the TDR skill appends the record's summary row to the Risks and Technical Debt section (Section 13), and verify allowed `tdr/` only. A TDR write may now change that section — found by its anchor — on lines that carry its own id, and no other line there. The first real Tier 0 run (an issue labelled in a RUN-team repository) wrote the record and was refused for the row.
- The Tier 0 setup named two labels; the four `tier0:<kind>` labels are required too — `gh issue create --label` fails outright on a missing one, so an IDE's request would not be filed (`architecture-tier0.yml` header, `docs/RUN_TEAMS.md`).
- The CI examples pin `v10.7.2`.

## [10.7.1]

### Changed
- The local architecture index server (`local/compose.yaml`) pins Alia `0.2.0`: `preview_tier0` and `record_tier0`, the server side of Tier 0 from the IDE (`BUILD.md` rule 10, 10.7.0), its `[T0-?]` issue checked byte for byte against `tier0.js`.
- The bundle's `support` carries `tdr_statuses` and `tdr_drivers` beside `tdr_moves`, so the server reads the TDR vocabulary instead of keeping a copy of `tdr-check.js`'s.
- The CI examples pin `v10.7.1`.

## [10.7.0]

### Added
- **Tier 0 from the IDE.** A RUN team's IDE agent works in the service repository, where the four Tier 0 writes do not belong: it requests them. `scripts/shared/tier0.js` is the request's contract — the issue `[T0-?] <title>` (labels `architecture-tier0`, `tier0:<kind>`; the request, the evidence, the kind's fields as JSON) rendered and read back, `prepare` (the policy re-read in the architecture repository: Tier 0 in force, one of the four kinds, every component name canonical, a TDR move along an arrow — `Won't Fix` stays the architect's —, a doc fix's text where it says, the next TDR or ADR id), `apply` (a doc fix, by code) and `verify` (the record matches the request, nothing outside its folder changed, a doc fix leaves the facts ledger as it was).
- `ci/architecture-tier0.yml`: labelling the issue `architecture-tier0` — by someone who can triage, the key on a public repository — prepares, writes (Claude with the TDR / ADR skills from the payload, or code for a doc fix), verifies, runs the gates and opens `tier0/issue-<n>` with `Closes #<n>`, the issue retitled to the record's id; `SA_TIER0_AUTOMERGE=true` merges it when the gates pass. A refusal is commented on the issue with its reasons and labelled `tier0-refused`.
- `BUILD.md` rule 10 on a RUN-team project: a shortcut the pack does not state, or a TDR the code resolves, is requested with `preview_tier0` → the user's yes → `file_with` → `record_tier0`, the code marked with the issue's URL until the TDR's id arrives; the bundle's `support` carries `tier0_kinds`, `tdr_moves` and `tier0_label` for the server's preview.

### Changed
- The CI examples pin `v10.7.0`.

## [10.6.4]

### Changed
- The local architecture index server (`local/compose.yaml`) pins Alia `0.1.2`: `preview_escalation`'s `request` is what the developer asked to build or change, in their words, never their answer to the preview — the server side of `BUILD.md` rule 9's wording (10.6.3).
- The CI examples pin `v10.6.4`.

## [10.6.3]

### Added
- `lifecycle.js plan --resolves ESC-NNN[,…]`: an escalation the release answers is named in its entry ("resolved by this release") and `apply` closes it by the new tag in the release commit; the receipt names its issue for the PR's `Closes #N`.

### Fixed
- An escalation resolved by a release reached no changelog entry: the plan took those closed after the previous tag's date, so one closed after its release, on the tag's day, fell between two releases. The cut-off is the tag's tree: closed now, open or absent at the tag.
- `escalate.js import` dated the record on the issue's UTC day, so a record could close the day before it opened; it takes the local day, as `close` does.
- The handoff the release dispatches failed at start: `claude-code-action` refuses `github-actions[bot]`, the actor of a `workflow_dispatch` sent with `GITHUB_TOKEN`. `ci/architecture-handoff.yml` names that bot in `allowed_bots`.
- `BUILD.md` rule 9 says what `request` carries: the developer's task in their words, never their answer to the preview — the first IDE escalation filed "yes, go ahead" as its request.
- The CI examples pin `v10.6.3`.

## [10.6.2]

### Changed
- The local architecture index server (`local/compose.yaml`) pins Alia `0.1.1`: `preview_escalation` and `get_architecture` say that a question blocking the build is escalated like a change that crosses a trigger, and a project without an escalation host gets the questions back for the architects — the server side of `BUILD.md` rule 9 (10.6.1).
- The CI examples pin `v10.6.2`.

## [10.6.1]

### Fixed
- A build blocked by the architecture never became an escalation. `BUILD.md` rule 9: on a RUN-team project a question only the architect can answer — a contract with nothing to implement, an interface whose authentication is not documented, a `Proposed` decision the code depends on — goes to `preview_escalation` (the questions, the trigger each touches: `security-iam` for authentication, `low-confidence` for a gap no other trigger names, the part and line as evidence, route `tier-1`), the issue shown, filed after the user's yes with `file_with`, then `record_escalation`; on any other project the questions go to the architects through the team's channel. Rule 3 points a blocking question to it. The first IDE build on a RUN-team project stopped and wrote its questions to a local file.
- The local server could not file escalations: `local/compose.escalation.yaml` sets the server's escalation host for one project (`SA_INDEX_ESCALATION_PROJECT`, `SA_INDEX_ESCALATION_REPOSITORY`, `SA_INDEX_ESCALATION_HOST`, `SA_INDEX_ESCALATION_SERVER`), and `publish-index.js --up` adds it when the project is set.
- The CI examples pin `v10.6.1`.

## [10.6.0]

### Added
- A project chooses its institution packs: `"packs"` in `.sa-skills/project.json`, the nearest at or above the working directory — `[]` none, `["<name>", …]` only those, absent every pack found. `packs.js` applies it before anything else, so every reader (design language, skins, architecture types, frameworks, defaults) sees the same set; `--declare none|all|<names>` writes it and keeps the file's other keys; `/setup` Step 11 reports the packs kept and left out. A user-scope pack applied to every project on the machine — an open-source or demo project's command center opened in, and embedded, an organization's brand skin.
- `snapshot.js` (command center): the viewer's photo mode as a PNG from headless Chrome over the DevTools protocol, no dependency — captioned with the project, the version, the view and the date, the caption printed.
- `ci/architecture-handoff.yml`: the kit's PR carries the version's evidence — the command center regenerated from the documents and its photo-mode picture, committed on the handoff branch and embedded in the PR body at that commit. Best effort: a failure warns and the PR opens without it.

### Fixed
- The command center's header: the version (`v<version> <status>`) is its own element that never gives way — it shared the meta line, which gives way first, so a long title hid it; the header's buttons keep their width (`min-content`) — a long title pushed the last ones off-screen.
- The CI examples pin `v10.6.0`.

## [10.5.3]

### Added
- `kit-check.js` holds a kit root to completeness (`kit-incomplete`): `SYSTEM_RUNTIME_VIEW.md`, `CROSS_CUTTING_STANDARDS.md` and a `components/NN-<slug>.md` for every `assets/NN-<slug>/` code rendered. Every other rule held only the files that existed, so a run whose generators never wrote — a headless session that ended while its sub-agents ran — passed with descriptors alone.

### Fixed
- `ci/architecture-handoff.yml`, from its first runs on a real repository:
  - the kit's branch is cut from the default branch, after checking that the architecture there equals the tag's — cut from the tag, the push was refused: against the default branch it changed workflow files, which a job token cannot write;
  - `origin` is pointed back at the job's token before the push — `claude-code-action` points it at its own token and revokes it when it finishes;
  - the prompt tells Claude the run is headless — sub-agents in the foreground, every result in hand before going on — after a run ended while its eight generators were still writing;
  - `Bash` unrestricted for Claude: the skill composes shell lines (`cd …; P=…; for …`) no `Bash(<prefix> *)` rule matches, and each denial was a skipped step;
  - Chrome may start on the runner (`kernel.apparmor_restrict_unprivileged_userns=0`), so the kit gate renders the Mermaid fences instead of failing every one;
  - Claude's transcript is kept as the `handoff-transcript` artifact (7 days) — the action hides its output.
- The CI examples pin `v10.5.3`.

## [10.5.2]

### Fixed
- `ci/architecture-release.yml`'s handoff job failed at once — `claude-code-action` refuses a `push` event (`Unsupported event type: push`). The regeneration is its own workflow, `ci/architecture-handoff.yml` (`workflow_dispatch`, input `tag`), which the release job dispatches with `GITHUB_TOKEN` (a dispatch, unlike a tag push, starts a run); it also runs by hand for any tag.

### Changed
- The CI examples pin `v10.5.2`.

### Upgrade
- A repository with 10.5.0's `architecture-release.yml`: copy the new `architecture-release.yml` and `architecture-handoff.yml`.

## [10.5.1]

### Fixed
- A Workflow 1 create with project ADRs ended with the principles' Layer 2 stamp stale, so `lifecycle.js check` blocked the first release on `principle-review`: Step 6's `adr-link.js` turns `ADR Candidate N` into `[ADR-NNN](…)` in `docs/02` after the review stamped it. `adr-link.js` now keeps a stamp that was current before the relink (same outcome and date, over the relinked text) — the review read the citation under its candidate number, and the link names the ADR written for that candidate. A stale stamp stays stale.

### Changed
- The stamp is one module, `plugins/sa-records/scripts/shared/principle-stamp.js`, which `principle-check.js` and `adr-link.js` both require. The CI examples pin `v10.5.1`.

### Upgrade
- An architecture created before 10.5.1 whose stamp went stale only through the relink needs its Layer 2 review again (or, where the relink is proven the only change, `principle-check.js --stamp-review` with the review's outcome).

## [10.5.0]

### Added
- `lifecycle.js tag <project>`: after a release PR is merged, tags the commit of the base branch's first-parent history where the version became Released — the merge or the squash commit, never a later HEAD — and pushes it; an existing tag is pushed or left alone, so CI can re-run it.
- `lifecycle.js check --undecided warn`, and the same flag on `principle-check.js` and `flow-check.js`: for CI, where no one answers a judge worksheet, a finding that stands only because the judge has not answered it (a principle finding not re-read, a `phase-absent` whose every name is undecided) is a warning. A finding code decides still blocks.
- `skills/architecture-lifecycle/ci/`: `architecture-gates.yml` (every pull request touching the architecture runs the gates and gets one comment with the gates and the status) and `architecture-release.yml` (on the merge of a release PR: `tag`, the index's phase 1 on a self-hosted runner that reaches the server, and the handoff kit regenerated by `claude-code-action` into a pull request).

### Changed
- `lifecycle.js apply` in PR mode (the default) no longer tags: a tag on the release branch published the index for a release nobody had merged, and a squash merge left the tag off the base branch. `--direct` still tags at once. `status` on an `untagged` architecture now points to `lifecycle.js tag`; `recover` stays for a tag lost outside the release history.
- The index CI examples pin `SA_PLUGIN_REF: v10.5.0` (they pinned 8.149.0); `ci/github-actions.yml` notes that its `tags` trigger is phase 1 twice when `architecture-release.yml` is installed.

### Upgrade
- A release PR opened with 10.4.x already carries its tag; nothing changes for it. From 10.5.0, merge the release PR and run `lifecycle.js tag` on the base branch (or install `ci/architecture-release.yml`, which runs it).

## [10.4.4]

### Changed
- `publish-index.js --up` runs the MCP server from the image its CI publishes, `ghcr.io/shadowx4fox/alia-mcp-server`, pinned at `0.1.0` (`SA_INDEX_SERVER_TAG` picks another; `edge` is main), instead of building it from source: the first start pulls in seconds where the build took minutes, and every machine runs the same server. `SA_INDEX_SERVER_REF=<branch|commit>` still builds one from source, through `local/compose.yaml` plus the new `local/compose.source.yaml`.
- Embeddings still go through the host's Ollama, its GPU, by default; the `cpu` profile's Ollama container is pinned at `0.35.1` (`SA_INDEX_OLLAMA_TAG`) instead of `latest`.

### Upgrade
- A local server started before keeps its bundles (the `bundles` volume): the next `--up` replaces the container with the published image.

## [10.4.3]

### Fixed
- `escalate.js new` trims `requested_by`, as it already trimmed every list item: since 10.4.2 a value padded with spaces was quoted with them and reached the issue's fact row padded, so the issue body differed from 10.4.1 (#1).

## [10.4.2]

### Fixed
- An escalation record keeps the request whole when it holds a line `## Resolution`: `issueBody()` and `close` take the section from the last such heading, the one `render()` writes, instead of the first (#1).
- A front matter value with `#`, `,`, `[`, `]` or `"` is written JSON-quoted and read back unchanged: `requested_by: "team #42"` stays `team #42`, and a component named `A, B` stays one component. Records written before keep reading as they did.

### Changed
- The `/setup` CLAUDE.md block and the docs say an `[ESC-?]` issue is filed by the IDE agent from the MCP server's preview, with the developer's own access; the server holds no token.

## [10.4.1]

### Fixed
- `escalate.js import` no longer cuts a request at a line of its own that starts with `## ` or `_`: the request is written in a fence its text cannot close and read back verbatim, and every other section ends at the next marker the renderer writes, never at text the user wrote. A comment after the body (the MCP server's preview fingerprint) is not read as text.
- A proposal or question item with a line break is written as one bullet, flattened, instead of being cut at the break.
- `import` refuses an issue with neither the `architecture-escalation` label nor an `[ESC-…]` title; `--force` reads it anyway.

## [10.4.0]

Escalations filed from the IDE through the architecture MCP server come into the architecture repository.

### Added
- `escalate.js import <project> <issue number|URL>`: reads an escalation issue from GitHub, GitLab, Gitea or Azure DevOps — filed by the MCP server as `[ESC-?] <title>`, or by another clone — and writes its record with the next ESC number (or the issue's own, when free), the request, triggers, evidence, proposal and questions read back from the body; an issue already imported is refused.
- `escalate.js retitle <project> ESC-NNN`: shows the issue's new title `[ESC-NNN] …`; `--apply` changes it on the host, after the user's yes.

### Changed
- An issue body with no ESC number ends with the import instruction instead of the close command.

## [10.3.0]

Architecture edits confirm first instead of entering plan mode, a RUN team's routine writes go ahead on their own, and what needs an architect becomes an escalation on the project's git host.

### Added
- RUN-team support (Tier 0): a project declares `"support": "run"` in `.sa-skills/project.json` (`scripts/shared/support.js --declare run`). Once it has an `architecture-v*` tag, four writes go ahead without the change-set approval when nothing is in doubt: a workaround recorded as a TDR, a TDR status move, a project ADR in `Proposed`, a doc fix that changes no fact.
- Escalation triggers: a new external integration, a data classification change, cross-domain impact, a security or IAM change, regulatory or audit scope, a new technology or vendor, low AI confidence. A crossed trigger writes nothing to the architecture.
- `scripts/shared/escalate.js`: an escalation record, `escalations/ESC-NNN-<slug>.md` (status, triggers with evidence, route `tier-1` / `tier-2`, components, the change proposed and not applied, questions, resolution), and the issue it becomes on the project's git host — GitHub, GitLab, Gitea or Azure DevOps, read from `origin` — previewed first and opened only with `--create` after the user's yes; `status`, `close --by <ADR|TDR|release>`, `list`.
- `lifecycle.js plan`: the escalations closed since the last release go into the entry; open ones are reported, never blocking.
- The index bundle's `manifest.json` carries `support`: the mode, whether Tier 0 applies, the Tier 0 writes, the triggers by id, the routes and the open escalations.

### Changed
- Architecture edits run without plan mode: every doubt is asked (`AskUserQuestion`), the change set is shown before → after and approved before any write — the CLAUDE.md block `/setup` writes, `EDIT_WORKFLOW.md` step 3.5, the TDR and ADR skills, the prose restyle's Step 2. `tdr/` joins the confirmed paths. Re-run `/setup` in a project to refresh its CLAUDE.md block.

## [10.2.0]

An organization's BIAN is a capability framework like any other: one generic way for a pack to bring a reference model.

### Changed
- A pack's licensed BIAN Service Landscape is a framework with the built-in id `BIAN` under `provides.frameworks` (a `BIAN/` folder with its `framework.json` and corpus); a pack framework with a built-in's id replaces it. `capability-prepare.js` reads BIAN's folder from the framework registry, like any framework's.
- `frameworks.js --dir <id>` prints a framework's corpus folder in force; skill instructions name BIAN's `[bian_dir]` (`frameworks.js --dir BIAN`).
- `packs.js --path frameworks` lists every pack's frameworks folder.

### Removed
- `provides.bianLandscape`, `packs.js --path bian-landscape` and `bianLandscapeDir()`. A pack that used it moves its folder to `frameworks/BIAN/` with a `framework.json` (copy the base's `references/bian-v14/framework.json` and set its `license`).

## [10.1.0]

Capability alignment for any industry. BIAN is banking's reference model, not every industry's: the alignment gate before an architecture is written now aligns the PO Spec to the capability framework the project declares.

### Added
- `scripts/shared/frameworks.js`: the capability frameworks — the base's `BIAN` (banking) and `CROSS-INDUSTRY`, a pack's under `provides.frameworks` — and the one a project declares (`.sa-skills/project.json`, `--declare <id|none>`; else a pack's `defaults.framework`; else an existing `BIAN_ALIGNMENT.md` means BIAN).
- `CROSS-INDUSTRY` framework: the cross-industry layer of Turbo EA Capabilities (9 Domains › 41 Capability Groups › 223 Capabilities), converted to the corpus shape by `scripts/build-turbo-ea-corpus.js`, with its licence and NOTICE. Turbo EA Capabilities by Vincent Verdet — Turbo EA, https://github.com/vincentmakes/turbo-ea-capabilities, CC BY 4.0.
- `capability-prepare.js --framework <id>`: aligns against any framework. Another framework's report is `CAPABILITY_ALIGNMENT.md` (`ALIGNMENT_FRAMEWORK`, `ALIGNMENT_VERSION: 1.0`), with its own level names and without the BIAN-only Diagram ID Segments and API Surface.

### Changed
- `architecture-bian-alignment` is renamed **`architecture-capability-alignment`** (`/sa-requirements:architecture-capability-alignment`), and its script `bian-prepare.js` → `capability-prepare.js`. BIAN's report, questions and output are unchanged (`BIAN_ALIGNMENT.md`, report v3.0).
- Workflow 1 Step 0.3 is the Capability Alignment Gate: mandatory once a framework is declared, `none` passes and omits `docs/01` § 1.5, nothing declared asks once (`gates-check.js` line `0.3 align`). `collect-save.js` takes `--framework <id|none> --alignment <report>` (`--bian` remains an alias). `docs/01` § 1.5 is `Capability Alignment` for a framework other than BIAN.
- Synthetic names replace every example and fixture name taken from a real project.

### Removed
- The pre-public history documents (`docs/RELEASE_HISTORY.md`, `docs/CHANGELOG-v1-v7.md`, `SUGGESTIONS.md`) and the v3 eval workspace.

### Upgrading from 10.0.0
1. Update the six plugins, then `/reload-plugins`.
2. Invoke the alignment as `/sa-requirements:architecture-capability-alignment`. A project with a `BIAN_ALIGNMENT.md` keeps working as BIAN; another project declares its framework once: `bun <sa-skills>/scripts/shared/frameworks.js --declare <BIAN|CROSS-INDUSTRY|none> --project .`.

## [10.0.0]

A generic base: everything that belongs to one organization leaves the plugin for that organization's institution pack.

### Added
- `ENTERPRISE` architecture type, the new default: five domain-neutral layers (Channels, Experience, Process, Domain Services, Systems of Record & Data) and cross-cutting capabilities that are not a layer. Ships with its Section 4 / Section 5 templates, reference, C4 translation and principle-matrix rows.
- `scripts/shared/arch-types.js`: lists the architecture types — the base's five, and any a pack adds under `provides.architectureTypes` (`type.json` plus four files, principle-matrix rows); `defaults.architectureType` makes a pack's type the default. Workflow 1 Step 1 lists types by running it; `collect-save.js`, `section-prepare.js` and `principle-check.js` resolve types through it.
- Open BIAN corpus (`architecture-bian-alignment/references/bian-v14/`): the full taxonomy and each Service Domain's published API description (Apache-2.0, `LICENSE-BIAN-APIS`), 257 of 341 described, built by `scripts/build-open-landscape.js`. Service Domains with no description are reported and not judged.

### Removed
- The design language standard (`skills/architecture-docs/references/design-language/`). A pack provides it; without one every skill runs in fallback mode. `sync-design-language.ts --target` writes to a pack checkout.
- `sa-compliance` (the compliance contracts, readers, questions and requirement registry) and the ADR coverage map derivation: sa-records Workflow 8, `adr-coverage-generator`, `coverage-renderer`, the `coverage-registry` / `coverage-editions` CLIs. The ADR skill still imports a catalog's `COVERAGE_MAP.json` as data and diffs it on sync.
- `architecture-blueprint` (one organization's forms).
- The `META` architecture type (a pack ships it).
- `check:validator-configs`, `check:questions`, `check:registry`; the compliance site of the judge hard set (48 items over four sites).

### Changed
- `date-utils.ts` lives in `scripts/shared/` again.
- The suite is six plugins and 15 skills; sa-skills no longer depends on sa-compliance.

### Upgrading from 9.x
1. `claude plugin uninstall sa-compliance@shadowx4fox-solution-architect-marketplace --scope user` (the base marketplace no longer lists it).
2. `claude plugin update <name>@shadowx4fox-solution-architect-marketplace --scope user` for sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery and sa-visualization, then `/reload-plugins` and `/setup`.
3. An organization with an institution pack installs or updates the pack; it brings back the design language, the full BIAN landscape, compliance, blueprints and its own architecture type.
4. An existing architecture whose `docs/03` carries `<!-- ARCHITECTURE_TYPE: META -->` needs the pack that provides META. Without that pack, the principle gate reports the type as unknown, as a warning.
