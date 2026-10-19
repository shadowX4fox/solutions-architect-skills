# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

10.1.0 is the first public release. Earlier versions were developed privately and their history is not published.

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
