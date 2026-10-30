# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

10.1.0 is the first public release. Earlier versions were developed privately and their history is not published.

## [10.28.0]

### Added

- **A blazon in the Word and PDF exports.** The Alia document theme carries her escudo — a heraldic shield, night field, silver bordure, her hair clip as an aqua chevron, her sparkle in chief, a hologram grid in base (`brand/alia/blazon/escudo.svg`, rendered to `tools/docgen/themes/alia/blazon.png`): on the cover above the document type (Word on white, PDF on night) and at 14 px at the start of every page header.
- **`blazon` in a `theme.json`.** A square PNG beside the theme, resolved by `theme.js` like the cover image; an institution pack's docTheme shows its own blazon or none — never Alia's — and `--theme classic` has none. A blazon that is named but missing is a warning.
- **`AliaCodec` in the Alia Guide design system** — her call from the command center's `alia` skin, face by mood, three mood colours (`mood-pleased`, `mood-worried`, `mood-stern`) and the `Faces` assets (`brand/alia/design-system/gen2.py`).

### Changed

- `scripts/build-release.sh` requires `tools/docgen/themes/alia/blazon.png`.

## [10.27.0]

### Added

- **The command center's `alia` skin, now the default.** Alia's hologram on night (`#0d1418`): aqua blocks for what the organization owns, silver for what it consumes, pink for an actor, warm colours left to severity; Nunito, round frosted panels, pill controls, an aqua and silver stripe; no scanlines or flicker. Holo's lessons are kept: frosted panels, labels legible by a tight dark halo on thin plates, no glyph shadow on a badge, the game voice (ranks, banners, the typed codec).
- **Alia in person in the viewer.** In `alia` the codec is her tip — her face on an aqua ring beside a round bubble, rising in and bobbing while she talks — and her face opens the Alia dialog. The face follows her mood (calm, thinking, pleased, worried, stern), the codec's own mood first, so a warning shows her worried face. Five faces cut from her approved poses, each embedded once (`brand/alia/design-system/assets/faces/`).

### Changed

- **`holo` is no longer the default**; it stays as `--theme holo` (or `"theme": "holo"` in a scene). A scene or an institution pack that names `holo` keeps opening in it.

## [10.26.0]

### Added

- **Alia is the default look of the Word and PDF exports.** `tools/docgen/theme.js` resolves the document theme — `--theme <id|folder>`, else an institution pack's `provides.docTheme` (`packs.js --path doc-theme`), else the base's `themes/alia`: Alia's palette, her figure on the cover (the whole PDF cover night, the Word cover on white), Nunito headings in PDF (embedded, OFL; body text stays Roboto, which the glyph sanitizer is verified against), one colour per document type from her palette (architecture `#0A7177`, ADR `#7A5600`, handoff `#5443B0`, PO Spec `#1B7148`). Status and priority fills are unchanged. The PO Spec distribution PDF takes it too.
- **`--theme classic`** keeps the corporate blue of the exports before this release.
- **Institution packs get a document theme slot**: `provides.docTheme`, a folder with `theme.json` (`colors`, `docTypes`, `cover`, `fonts.heading`). A key it leaves out comes from `alia`; a theme that states no cover or font gets a light cover and the body font — an organization's brand never borrows Alia (`docs/INSTITUTION_PACKS.md`).
- **`brand/alia/`**: Alia's character — the identity sheet, the approved poses (anchors, cover, explaining, thinking, happy, warning), the ComfyUI workflows that made them (Animagine XL 4.0 Opt through IP-Adapter, local) and the generator of the Alia Guide design system (`design-system/`). Drafts and third-party style references stay local (`.gitignore`).

### Changed

- The Word renderer's code colours (inline code, code blocks) come from the palette instead of fixed values.

## [10.25.2]

### Added

- **A Claude Project's instructions ship with the chat package.** `templates/PROJECT_INSTRUCTIONS_TEMPLATE.md` — the split of work between chat and Claude Code, no score and never `verified` in chat, technology ideas to Implementation Suggestions, what to do at the start of a chat by the files it finds, language, the end-of-session handoff block — with `{{PRODUCT}}`, `{{PO_NAME}}`, `{{REPO_FOLDER}}` and an optional `{{LEGACY_FOLDER}}`, two optional sections (product context as hypotheses, domain defaults) and two ways to keep the files: a folder shared with Claude Code, or files the Product Owner downloads and commits. `CHAT_MODE.md` § A Claude Project points to it.

## [10.25.1]

### Fixed

- **Chat mode is detected by the skill's folder, not by Bun.** A Claude chat's sandbox has Bun and Node, so `bun --version` answered there and the skill ran the Claude Code workflows against scripts the chat package does not carry; the chat then wrote checks of its own. The package has no `scripts/`, and that now decides: `SKILL.md` § Execution mode, `CHAT_MODE.md`.

### Added

- **The chat's pre-check starts from the evaluation's code.** `scripts/po-spec-precheck.js` prints the use-case parts missing, the statements whose words suggest a failing test and the ones naming a technology, with the tests' criteria — checkability's first stage, no judge, no score, no stamp. `build-chat-skill.ts` bundles it into the package as `precheck/po-spec-precheck.cjs` (Node or Bun); the chat reads each candidate against the criteria and writes no checking code of its own.

## [10.25.0]

### Added

- **Implementation suggestions in the PO Spec**: a new Appendix table, `Implementation Suggestions`, for a product, technology or design someone proposes. Its columns are `# | Suggestion | Need | Proposed by | Status | Answer`, and Status is `Open`, `Adopted` or `Not adopted`. A suggestion is not a requirement and is not scored. The interview asks what the suggestion gives the business, writes that need as the requirement, and keeps the suggestion verbatim (*Need behind the means*, in the elicitation guide and in chat mode). A technology the organization imposes stays a Business Constraint.
- **`po-spec-checkability.js` reports a requirement that prescribes the means.** A requirement that names a technology word or a product gets one judge question: does it say how the system is built rather than what it must do? A yes is reported with its fix: move the statement and keep the need. It never moves a multiplier or the Ready cap. Measured on 20 labelled statements, the Haiku worksheet judge placed all 20 correctly, the imposed platforms and existing systems included (`docs/DESIGN_NOTES.md` § Requirements).
- **The architecture sees them and answers them.** The Section 4, 5 and 8 payloads carry the table, marked as input the architecture decides. `lifecycle.js status` lists the open suggestions and never gates on them. The PO Spec sync lists every suggestion in its delta and writes each answer in business words, with the architecture version and no ADR id.

## [10.24.0]

### Added

- **Chat mode for architecture-readiness** (`CHAT_MODE.md`). Where the skill finds no shell or no Bun (a Claude chat, the desktop or mobile app), it helps the Product Owner write the spec: the elicitation interview, drafting from the template, and a pre-check before sending. The pre-check covers the five checkability tests and the coherence that reading shows: a label no use case exercises, an objective no use case delivers or no metric measures. It reports findings, never a score. The Discovery Summary is saved as `DISCOVERY_SUMMARY.md`, so an interview can span several chats, and Claude Code's elicitation resumes from it. Evaluation, async intake, the PDF and the sync stay in Claude Code. A chat writes the spec with `<!-- READINESS_CHECK: draft -->` as its last line.
- **The evaluation stamps the spec** (`scripts/readiness-stamp.js`, workflow 4 step 7). The script re-runs the checkability rule and the coherence gate on the answers already given. When no Ready cap and no blocking coherence finding stands, it writes `<!-- READINESS_CHECK: verified <date> sha256:… -->`. The hash covers the spec without the stamp, so any edit voids it. The score is not stamped.
- **`scripts/build-chat-skill.ts`** writes the zip to upload to a Claude chat: the skill without `scripts/` and `tests/`, its frontmatter reduced to `name` and `description`.

### Changed

- **The PO Spec gate reads the stamp** (`gates-check.js` 0.2). A `draft` spec, or one edited after its evaluation, is BLOCK until `evaluate PO spec` runs in Claude Code. A spec with no stamp is WARN (`not evaluated`), and the architect is asked whether to evaluate it first. Before this, the gate checked only that the spec existed, so a spec scored by a reading passed unchecked.

### Upgrade

- A spec written before 10.24.0 has no stamp, and Workflow 1 now warns on it. Run `evaluate PO spec` once to stamp it.

## [10.23.1]

### Changed

- **The local server runs Alia 0.6.0** (`local/compose.yaml`, `SA_INDEX_SERVER_TAG`), closing #22. `get_build_pack` now passes each ADR part's `scope` and `via`, the fields added in 10.23.0, and its tool description explains them. A client that reads only the index no longer treats the other side's decisions as gaps.

### Upgrade

- A running local server keeps its image: `docker compose … pull` and `up -d` with the same files and variables it was started with (`compose.escalation.yaml` included). Its bundles stay in their volume.

## [10.23.0]

### Added

- **Each ADR of a build pack says why it is there.** The ADR parts of `pack.json` carry `scope` and `via`. `own` means the component's descriptor names the ADR and this code carries it out. `context` means the ADR reaches the pack only through an interface contract, a flow or the security section: it describes what the other side does. `via` lists every origin (`component`, `security`, `interface:<key>`, `flow:<code>`). The plan in `BUILD.md` marks each ADR, and rule 5 holds the code to the `own` ones only: a `context` ADR is never reported missing from the code. An IDE agent that compared every ADR of the pack with its code kept reporting the other side's decisions as gaps for the architect. `pack.adrs` keeps its shape.

## [10.22.0]

### Changed

- **OpenAPI and AsyncAPI contracts are held to the architecture docs when no cut-sheet payload exists** (#21). `contract-check.js` skipped their fidelity without a payload of the architecture's version, so a kit checked on a fresh checkout, in CI above all, never ran `operation-undocumented` or `channel-undocumented`. Without one, the source is now `ARCHITECTURE.md` and `docs/`, as it already was for DDL, Avro, Protobuf and the Redis key schema: an operation or channel they never state blocks. The `operation-missing` warnings read the component's descriptor (`component_self` in its `EXPLORER_HEADER`), never the whole corpus.

### Upgrade

- A contract that passed in CI because nothing checked it may now fail with `operation-undocumented` or `channel-undocumented`: state the operation in the component's descriptor, or drop it from the contract.

## [10.21.2]

### Fixed

- **A stale cut-sheet payload is no longer a contract's source.** `contract-check.js` held every asset to the payload it found under `.cache/sa-skills/handoff-payloads/`, whatever architecture version it was cut for. A kit regenerated elsewhere (CI) left the local payload behind, so a working copy reported a documented operation added since as `operation-undocumented` and `export-index.js` dropped that component's build pack. A payload whose `architecture_version` is not the architecture's is now ignored, as if absent.

## [10.21.1]

### Fixed

- **A build pack carries only decisions in force.** `export-index.js` packed every ADR a component, its interfaces, its flows or its security obligations cited, whatever its status, so a descriptor still naming a superseded ADR handed the builder both the decision and its replacement. A cited ADR whose status is `Superseded`, `Deprecated` or `Rejected` is now left out of the pack and named in the export's warnings, with the citation to drop.

## [10.21.0]

### Added

- **The release evidence is framed on what the release changed.** `ci/architecture-handoff.yml` takes one photo-mode picture per component whose `payload_hash` moved in the kit's manifest (the hash leaves out the version stamps), at most three: the plan page of that component's floor, it selected, named `evidence/<tag>-<component>.png`, all embedded in the kit's pull request. A release that changed no component keeps the whole-model picture.
- **`snapshot.js --plan <component id>`** and the viewer's **`#plan=<id>`** link: the plan page of that component's floor, the component selected without the inspector. An id the scene lacks opens the default view.

### Changed

- **Photo mode on a plan page**: the caption adds the floor and the selected component, the page keeps its ports and routes, the page bar leaves the picture, and entering or leaving photo mode re-frames the page to the new stage.

### Upgrade

- Architecture repositories: `ci-setup.js architecture … --write --replace architecture-handoff.yml` (the other workflows move their pin).

## [10.20.2]

### Fixed

- **`@alia` reaches the architecture MCP server.** In mention mode claude-code-action puts its own server (`github_comment`) first as inline JSON, and its merge of several `--mcp-config` values drops one given as a file path. So `architecture-mention.yml` ran with no architecture tools. The server step now writes the config as a step output, and `--mcp-config` passes it inline, which the action merges. The build workflow is unaffected: in its mode the action adds no server of its own.
- **No claim of a pack it did not read.** The standing rules now say: without the architecture server's tools, say so and change nothing, and never state the build pack was read unless `get_build_pack` answered. A run without the server had cited the version and `pack_revision` from `.architecture.json` as if it had read the pack.

### Upgrade

- A service with `--mention`: `ci-setup.js service … --mention --write --replace architecture-mention.yml`.

## [10.20.1]

### Changed

- **The mention workflow answers `@alia`, not `@claude`** (`architecture-mention.yml`, `trigger_phrase`). With its own phrase the stock `claude.yml` can stay beside it, so nothing runs twice; `ci-setup.js … --mention` now notes that workflow (`·`: `@claude` there answers without the architecture) instead of asking to remove it. Its branches are `alia/…`. Claude still does the work and replies as the Claude GitHub App.
- **`architecture-build-merge.yml` never merges an `alia/` or a `claude/` branch**: both come from a person's request.

### Upgrade

- A service set up with 10.20.0's `--mention`: `ci-setup.js service … --mention --write --replace architecture-mention.yml,architecture-build-merge.yml` (the latter with `--merge`), then mention `@alia`.

## [10.20.0]

### Added

- **@claude with the architecture** (`ci/service/architecture-mention.yml`, `ci-setup.js service … --mention`, on an attended or an unattended service): a mention in an issue, a comment or a review is answered with the architecture MCP server, from `SA_MENTION_RUNS_ON`, with Claude's own `HOME`. The action's mention mode keeps the comment as the instruction, and `--append-system-prompt` adds BUILD.md as standing rules: read the build pack first, ask in the reply, keep the contracts byte for byte, and put the escalation `preview_escalation` renders in the reply for a person to file instead of a departure. Only the owner, members and collaborators start it, tested before a runner is chosen. The work ends on a `claude/` branch that a person merges. `ci-setup` reports the stock `claude.yml` as `!`, because every mention would run twice and the second without the architecture, and never deletes it. On an unattended service nothing reviews that work against the pack; a `·` row says so.

### Fixed

- **`architecture-build-merge.yml` never merges a `claude/` branch.** It checked only who opened the pull request, so a pull request opened from @claude's branch by the `SA_BUILD_AGENT` account merged once its tests passed.

### Upgrade

- A service that wants @claude: `ci-setup.js service … --mention [--runs-on self-hosted,<label>] --write --settings`, then remove the stock `claude.yml` (`git rm`). An unattended service with `--merge` takes the new `architecture-build-merge.yml` with `--replace architecture-build-merge.yml`; the other workflows move their pin with `--write`.

## [10.19.5]

### Security

- **Bun 1.4.4 in every CI template and in the plugin's own CI**: the `bun-version` pins (`architecture-gates`, `-release`, `-handoff`, `-tier0`, the service's `architecture-review.yml`, the GitHub and Gitea index examples) and the Azure Pipelines install move from 1.4.2 to 1.4.4, which fixes CVE-2026-111497 (out-of-bounds write in the bundled brotli decoder, GHSA-663w-cv8g-jj2p), the HTTP/3 QPACK memory exhaustion (GHSA-cf8x-9m69-3gg3) and the bundled root certificates trusting compromised eMudhra intermediates (GHSA-26q8-h657-pf84).

### Upgrade

- Local: `bun upgrade` (1.4.4 or later).
- Projects: `ci-setup.js architecture|service … --write` moves the plugin pin; a workflow copied from the earlier template shows as `!` — take the new one with `--replace <file>` for each.

## [10.19.4]

### Fixed

- **Command center — a plan page larger than the stage can be moved**: in the Plan view (`4`) any drag, or ← / →, slides the page under the pointer, held to its floor, and the wheel (or + / −) zooms about the point under the cursor; a drag used to leave the plan, so the part of a wide floor outside the frame could not be reached. ↑ / ↓, PgUp / PgDn still turn the pages, and the page bar's hint names the new keys.

### Upgrade

- Re-render a project's command center (`render.js`, or the skill) to get the new viewer.

## [10.19.3]

### Fixed
- **The review comment is read only from the review's own identity** (#19). The verdict step and `review-check.js --recheck` found the comment by its marker alone, so anyone could post a comment starting with `<!-- sa-architecture-review -->` ahead of the bot's. The review would then patch that comment, and the recheck would read a planted escalations record. Both now take only a comment by `github-actions[bot]`. `--recheck --author <login>` names another identity.
- **A schedule GitHub disabled is no longer silent** (#20). GitHub turns off a public repository's scheduled workflows after 60 days without activity. `ci-setup.js` now reads the state of `architecture-review.yml` (`service … --review`) and of `architecture-tier0.yml` (`architecture`, RUN team). It reports `disabled_inactivity` as a required row, and `--settings` runs `gh workflow enable`. A workflow someone disabled by hand is reported, never re-enabled. The template explains the rule beside its `schedule:`.
- **A failed escalation dispatch fails the run.** `architecture-escalations.yml` used to log a failed `architecture-escalation-closed` dispatch only as a warning. It is now an error, and the run fails after every repository was tried, because the hourly sweep is then the only re-check.

### Upgrade
- Projects: `ci-setup.js architecture|service … --write` moves the pins. A service with `--review` takes the new `architecture-review.yml` with `--replace architecture-review.yml`, and the architecture repository takes the new `architecture-escalations.yml` with `--replace architecture-escalations.yml`.

## [10.19.2]

### Fixed
- **A rejected escalation no longer invites another one.** A FAIL comment's footer always said a departure could be cleared by citing an open `[ESC-…]` issue. When a blocking finding cites an escalation the architect rejected (closed as not planned), the footer now says the departure is not accepted. Those findings are cleared only by code that keeps the architecture, not by a new escalation of the same question. A FAIL with no rejection keeps the usual footer. The review result carries the rejected escalations as `rejected`.

## [10.19.1]

### Fixed
- **A rejected escalation reads as a rejection.** When an `[ESC-…]` issue was closed, the recheck's status and comment said "cerrada: la release que la respondió es la que se construye" ("build the release that answered it"), even when the architect had refused the departure. An issue closed as not planned now reads "rechazada — la desviación no se acepta; corrija el código" ("rejected — fix the code"), and the comment says the architect rejected the departure. An issue closed as completed still points to the release that answered it.
- **The recheck's commit status is one sentence.** It no longer chains two colon-joined clauses ("…: …: vuelva a ejecutar la revisión").
- **The recheck clears the HELD paragraph.** After a recheck, the comment no longer keeps "Nada bloquea, pero…" under the `⛔ FAIL` heading.
- **`escalate.js close --rejected` writes one period.** A reason that already ended in a period came out with two.
- `escalate.js close --rejected` says to close the issue as not planned, the reason the review reads as the rejection.

## [10.19.0]

### Changed
- **A cited escalation holds a pull request instead of passing it.** Until now, an open `[ESC-…]` issue that covered every blocking finding made the review a PASS. The status was `success`, so GitHub offered the merge while the architect had not answered yet. The verdict is now **HELD**: `review-check.js` exits 3, and `architecture-review.yml` posts "Architecture review" as `pending`, described as "waiting for `owner/repo#N`". Branch protection doesn't accept `pending`, so the pull request can't merge until the escalation is answered.
- The comment's heading reads `⏸ HELD` (`⏸ EN ESPERA`) and says what the pull request waits for. A pass that rests on no escalation is `success`, as before.
- When the escalation closes, the 10.18.0 recheck fails the status and turns the heading into `⛔ FAIL`.

### Upgrade
- **Attended service repository:** `ci-setup.js service <dir> --attended --review --write --replace architecture-review.yml`. A pull request that passed under an open escalation stays green until its review runs again; to re-run it, close and reopen the pull request, because a re-run of the old run uses the old workflow.

## [10.18.0]

### Fixed
- **A pass an escalation allowed no longer outlives the escalation** (closes #18). The review read an `[ESC-…]` issue's state only when it ran, and it ran only on the pull request's own events. A pull request that passed while its escalation was open stayed green after the architect closed the escalation. With the review as the only required check, the departure could still be merged.
- `review-check.js` refuses an escalation that was transferred to another repository. GitHub answers a transferred issue from its new repository, and the check had accepted it.

### Added
- **`ci/architecture-escalations.yml`** in the architecture repository, written by `ci-setup.js architecture`. When an `[ESC-…]` issue is closed, transferred, deleted, or retitled so it no longer starts with `[ESC-…]`, it sends `architecture-escalation-closed` to `SA_SERVICE_REPOS` with `SA_DISPATCH_TOKEN`.
- **The `recheck` job of `ci/service/architecture-review.yml`**: it runs on that dispatch, every hour as a fallback, and on demand. It runs no model and checks out nothing.
- **`review-check.js --recheck <owner/repo>`**: a passing review's comment now records the escalations the pass depended on and the head commit it reviewed. For each open pull request still at that head, the recheck asks GitHub for those escalations' state. If one no longer covers the departure, the status "Architecture review" fails and the comment says why. A push, an edit of the body or a re-run of the review then decides again.
- `ci-setup.js service … --attended --review` checks that the architecture's `SA_SERVICE_REPOS` lists the service and that the architecture has `SA_DISPATCH_TOKEN`.

### Upgrade
- **Architecture repository:** `ci-setup.js architecture <root> --write` writes `architecture-escalations.yml` and moves the pins.
- **Attended service repository:** `ci-setup.js service <dir> --attended --review --write --replace architecture-review.yml --settings` writes the new review workflow and adds the service to the architecture's `SA_SERVICE_REPOS`. Without that listing, the hourly sweep still catches a closed escalation.
- A pull request that passed before 10.18.0 has no record of its escalations, so nothing re-checks it until its review runs again.

## [10.17.1]

### Changed
- **The local server pins Alia 0.5.2** (`SA_INDEX_SERVER_TAG`, closes #17). Step 4 of `file_with.steps` now names the arguments of `record_escalation` and `record_tier0`: `project`, `preview_id` and `url`. Before, an agent following it passed `file_with`'s `issue_url` and was refused (server #34).

## [10.17.0]

### Added
- **CI speaks the architecture's language.** Everything the workflows write for a person follows `DOC_LANGUAGE`: PR titles and bodies, issue and PR comments, commit statuses, commit messages and summary headings. That covers the gates comment, the handoff kit's PR, every Tier 0 comment and PR, the review's comment and status, and the unattended build's PR and issues.
- `scripts/shared/ci-text.js`: the workflows' sentences in `en` and `es`, and the language resolved from `ARCHITECTURE.md`, else `SA_DOC_LANGUAGE`, else English.
- **`SA_DOC_LANGUAGE`** on a service repository: neither the binding nor the build pack states the language. `ci-setup.js service … --settings` reads it from the architecture's `ARCHITECTURE.md` and sets it.
- `review-check.js --lang` and `--status-out`: the commit status no longer parses the English summary line.

### Changed
- `tier0.js` `prepare` and `verify` write their reasons in the architecture's language; `validate` keeps English as its default for `render`.
- The Tier 0 workflow's `key` job installs Bun and clones the pinned plugin, and reads `ARCHITECTURE.md` through the API.
- The review and build prompts ask Claude to write its findings, PR and issues in the architecture's language. Identifiers, labels, rule codes and the architecture's names stay as they are.
- The tools' own receipts, quoted in a comment, and the logs stay as the tools print them.

### Upgrade
- **Architecture repository:** copy the four `skills/architecture-lifecycle/ci/*.yml` (`ci-setup.js architecture <root> --write --replace …`).
- **Service repository:** `ci-setup.js service <dir> --architecture <owner/repo> … --write --settings` sets `SA_DOC_LANGUAGE` and replaces the review or build workflow. An attended repository's review upgrade is the file that runs on its own PR, so an admin merges it once, as in 10.16.3.

## [10.16.3]

### Fixed
- **The review runs on `pull_request_target`.** In 10.16.2, claude-code-action failed with "Invalid OIDC token": the event refuses the Claude app's token exchange. The action now works with the job's own `GITHUB_TOKEN` (`github_token`), so the job no longer needs `id-token: write`. The review posts its own comment and status with that token, and Claude has no tool that could use it.
- **The action's own pattern for `pull_request_target`.** The default branch is checked out at the workspace root, which the action expects and runs in. The PR's head goes into `pr-head/`, which Claude reads through `--add-dir`. Claude's working directory, its project configuration and `.sa-review/` are the default branch's, as is the MCP server's URL, which `review-check.js` gets as `--server`. A PR cannot point the review at another server. The PR's binding (version, component) is still the one held to its pack.

### Upgrade
- **From 10.16.2:** that file is the one that runs on the upgrade PR, and it fails, so an admin merges the upgrade once. From 10.16.0 or 10.16.1, as in 10.16.2.

## [10.16.2]

### Fixed
- **A pull request can no longer weaken its own review.** `ci/service/architecture-review.yml` ran on `pull_request`, that is, the workflow file of the PR itself. A PR could edit the verdict to exit 0 and pass the required check. claude-code-action refused to run a workflow that differs from the default branch's, so a PR that changed the review failed closed, and could never be merged. The review now runs on `pull_request_target`, always the default branch's file, so a PR that edits the review is reviewed by the review in force.
- **The PR's code is read as data, never executed:**
  - the checkout keeps no credential (`persist-credentials: false`);
  - Claude has no shell;
  - `review-check.js` comes from the pinned plugin and runs outside the checkout, because Bun reads `bunfig.toml`, `preload` included, from its working directory;
  - `.sa-review/` is made fresh, so a PR cannot bring a `findings.json` of its own. This applied to `pull_request` too.
- **The required check is the commit status "Architecture review" on the PR's head commit:** pending when the review starts, the verdict's state at the end, and a failure when the verdict never ran. A fork's PR gets a failure. The job is named `review`, so its own check run is not the required context.

### Upgrade
- **A repository on 10.16.0 or 10.16.1** moves with `ci-setup.js service … --attended --review --write --replace architecture-review.yml`. That one PR gets no "Architecture review", because the old file runs on `pull_request` and the new one on `pull_request_target`, neither for it. An admin merges it once: turn the protection's `enforce_admins` off, merge, turn it back on.

## [10.16.1]

### Fixed
- **A self-hosted runner no longer lends Claude its user's configuration.** On the Portal's runner, the review's Claude session loaded the runner user's `~/.claude`: their plugins (hooks included), MCP servers and settings. claude-code-action also wrote `enableAllProjectMcpServers: true` into that user's own `settings.json`. The Claude steps of `ci/service/architecture-review.yml` and `architecture-build.yml` now run with a `HOME` and `CLAUDE_CONFIG_DIR` of their own under `$RUNNER_TEMP`, cleared with the job. Authentication is unchanged (`CLAUDE_CODE_OAUTH_TOKEN`, from the environment). The same cause replaced the runner user's Bun. claude-code-action installs Bun 1.3.14 with `setup-bun`, which writes to `$HOME/.bun`, and it did so twice over a 1.4.2 install. The action's Bun now goes into its own home. The review's own `setup-bun` gets another home, and the verdict calls that Bun by its path (`steps.bun.outputs.bun-path`).
- **`review-check.js`:** a `TODO(architecture)` in a document (`.md`, `.mdx`, `.rst`, `.txt`) is prose that mentions the convention, not a question in code. It is no longer listed as `todo-added`.
- **`ci-setup.js`:** a branch protection applied by `--settings` reads as what it now is ("required, enforced for admins — set"), not as the gap it closed.

### Upgrade
- **A self-hosted runner that ran an earlier review or build:** check the runner user's `~/.claude/settings.json` for `enableAllProjectMcpServers` the action added, and remove it unless that person set it. Check `bun --version` too, and reinstall the version that person uses if the action's 1.3.14 replaced it.
- **The service repositories:** move to the new templates with `ci-setup.js service … --write --replace architecture-review.yml` (or `architecture-build.yml`). Each has a step of its own, so it is replaced, not re-pinned.

## [10.16.0]

### Added
- **The attended service's reviewer, `ci/service/architecture-review.yml`.** Every pull request of a service built in an IDE is held to its build pack, whoever wrote the code. "Architecture review" is a required status check:
  - **The code checks** (`scripts/review-check.js`, no model): the copies under `architecture/` are the pack's bytes (`asset-modified`, `asset-missing` block); the contracts are committed alone (`assets-mixed` blocks); commits name the version and `pack_revision` (rule 8, warning); the binding is checked against the latest release and the recorded revision (warnings); new `TODO(architecture)` lines are listed.
  - **Claude's review**, through the MCP server: the diff against BUILD.md's rules, each finding citing the pack part. Claude reads only the checkout, writes only its findings file, and runs no shell and no web tool.
  - **The verdict, by code:**
    - a blocking finding that cites no part of the pack is a warning;
    - a missing review fails closed;
    - a departure is cleared only by the open `[ESC-…]` issue of the architecture repository that the finding names and the pull request cites, then stays as a warning naming it;
    - a code finding is never cleared.

    One comment on the pull request, updated on every run. A pull request from a fork fails the check.
- **`ci-setup.js service --attended --review`:** writes the workflow with the plugin's pin. It sets `SA_ARCHITECTURE_REPO` and `SA_REVIEW_RUNS_ON` with `--settings`, and checks the self-hosted runner. It makes "Architecture review" a required check on the default branch, enforced for admins:
  - **No protection yet:** with `--settings`, a minimal protection is created.
  - **Protection with required checks:** "Architecture review" is added to them.
  - **Any other protection:** the command is printed and nothing is changed.

### Changed
- **`BUILD.md` rule 9 (RUN teams):** a pull request that departs from the pack while its escalation is open cites the issue as `owner/repo#N`.
- **`/release`:** also moves the pin of the templates under `ci/service/`.

## [10.15.0]

### Added
- **`ci-setup.js --settings`: attaching a service configures both repositories.** After the user's yes, every required variable whose value is known is set with `gh variable set`, on the service and on the architecture repository, and reported as `— set`. A secret is never set; its row stays a command for the user.
  - **On the service:** `SA_BUILD_AGENT` and `SA_BUILD_RUNS_ON`.
  - **On the architecture:** `SA_SERVICE_REPOS` extended with the service, `SA_TIER0_TRUSTED_AGENTS` extended with the agent, and `SA_HANDOFF_AUTOMERGE`.
- **`--agent <login>` and `--runs-on <label,…>`** supply the values that were placeholders.
- **`--merge` is full auto.** The service report now requires the architecture's `SA_HANDOFF_AUTOMERGE` and the agent in its `SA_TIER0_TRUSTED_AGENTS`. Without them a release, or a Tier 0 request, waits for a person.
- **The runner is checked.** A self-hosted `SA_BUILD_RUNS_ON` is held to the service repository's runners: none registered, or offline, is a required row with its fix. A server on localhost without `SA_BUILD_RUNS_ON` is now required (`✗`) instead of a warning.

### Changed
- **The skill's steps:** a service is checked with `--architecture`, the questions name the agent and the runner, the write step runs `--write --settings`, and it explains how a release finds a service (`SA_SERVICE_REPOS`; the handoff names none).

## [10.14.0]

### Added
- **`SA_HANDOFF_AUTOMERGE`: the regenerated kit merges itself.** With the variable `true`, `architecture-handoff.yml` merges the kit's pull request once `kit-check.js` and `kit-drift.js` pass, then dispatches `architecture-index.yml` on the default branch, which publishes the build packs and notifies the service repositories. The workflow dispatches the index itself because a merge made with `GITHUB_TOKEN` starts no push workflow. A blocking drift finding leaves the pull request open with a comment, and without the variable nothing changes. With it, nothing between an attended release and the service's merged build needs a person.
- **`ci-setup.js architecture`** reports `SA_HANDOFF_AUTOMERGE` as an optional row.
- **Tests:** `skills/architecture-lifecycle/tests/handoff-workflow.test.ts` runs the step from the template against shims, covering unset, merged and dispatched, drift blocking, dispatch refused, and an unchanged kit.

## [10.13.2]

### Changed
- **The local server pins Alia 0.5.1** (`SA_INDEX_SERVER_TAG`, closes #16). Its `preview_tier0` matches `tier0.js` byte for byte (checked on a live preview):
  - An unattended request carries `tier0:<kind>` only, even for a kind in `tier0.auto`, so the architecture repository keys it on `opened`.
  - A `Resolved` move may cite its pull request (`owner/repo#N`) or a commit, and the agent is told to file it now.
  - The footer is 10.13's.

  The `labeled` run 10.13.1 added for a request filed with its label stays, for a 0.5.0 server.

## [10.13.1]

### Fixed
- **A trusted agent's Tier 0 request filed with its label is keyed only for a kind in `tier0.auto`.** Alia 0.5.0's `preview_tier0` files an auto kind with `architecture-tier0`, so `architecture-tier0.yml` keys it on the `labeled` run. That run now holds the kind to `tier0.auto`, as the `opened` run does. A kind not listed is refused on the issue and the label taken off, for a person to key, instead of reaching `prepare --auto` and `tier0-refused`.
- **`BUILD.md` rule 10 no longer contradicts the server.** Unattended, the build files the issue exactly as `file_with` gives it, labels included. 10.13.0 told it to drop `architecture-tier0` when the server listed it, which is the server's own instruction against the pack, the clash that broke 10.12.0.

### Changed
- **The local server pins Alia 0.5.0** (`SA_INDEX_SERVER_TAG`, closes #15).

## [10.13.0]

### Added
- **`sa-delivery:architecture-ci-setup`**, the sixteenth skill: CI/CD for an architecture and for the service repositories built from it. `scripts/ci-setup.js` has two sides:
  - `architecture`: the five workflows from the templates, with the plugin's pin and optionally a self-hosted runner (`--runner`), plus the RUN-team policy, the labels, and the repository's variables, secrets and workflow permission, read through `gh`.
  - `service`: the binding (`.architecture.json`, whose recorded version and pack revision it never touches), the IDE's MCP server (`.mcp.json`, other servers kept) and, unattended, the build and merge workflows, with the settings both repositories need.

  `--write` writes local files only. It never overwrites a workflow that differs from its template unless the file is named in `--replace`, because a team's own changes and an older template look the same to code. It never sets a secret: it prints the command.
- **The service side of the unattended build**, under `architecture-index-export/ci/service/`:
  - `architecture-build.yml`: Claude builds from the pack on the `architecture-released` dispatch, with the build's identity (`SA_BUILD_TOKEN`), through the MCP server (`SA_INDEX_MCP_URL`, optionally on a self-hosted runner, `SA_BUILD_RUNS_ON`), and opens a pull request, or none when nothing changed.
  - `architecture-build-merge.yml`, opt in: merges that pull request once the repository's tests pass, only one opened by `SA_BUILD_AGENT` and only at the tested commit.
- **`architecture-index.yml` tells the service repositories.** After a released publish with build packs, it dispatches `architecture-released`, with the version, to each repository in `SA_SERVICE_REPOS`, using `SA_DISPATCH_TOKEN`.
- **A move to `Resolved` waits for its merge.** An agent-keyed request can cite its service pull request as `owner/repo#N`, so a squash merge no longer loses the evidence. `prepare --auto` returns `wait` (exit 3) while the pull request is open or the commit is not on the default branch. The workflow then labels the request `tier0-waiting`, comments once, re-checks it every 30 minutes (a schedule that dispatches the workflow per waiting request), and refuses it after `SA_TIER0_WAIT_DAYS` (default 7), or when the pull request was closed without a merge. `tier0-waiting` is the eighteenth label.

### Changed
- **The architecture repository keys a trusted agent's request; the agent never applies the label.** 10.12.0 had the build apply `architecture-tier0` itself, against the MCP server's own instruction ("never add the label"), and a build that read both followed the server, so the request waited. `architecture-tier0.yml` now runs on `issues: opened` too. It keys an issue an account in `SA_TIER0_TRUSTED_AGENTS` opened, when the issue carries the `sa-tier0` marker, its kind is in `tier0.auto` (read from the repository) and the daily limit holds, and adds `architecture-tier0` and `tier0-auto`. A kind outside `tier0.auto` gets a comment and waits for a person.

  The key is now a job of its own, so a request that isn't for the workflow ends the run green. `labelsOf` never puts the key on an unattended issue, and BUILD.md rule 10 says so: file a `Resolved` move with its pull request, cite it, and the architecture writes it after the merge. The server needs no change (knowledge-base #30).

### Upgrade
- An architecture repository runs `ci-setup.js architecture <root>`. It moves every workflow's pin to `v10.13.0`. `architecture-tier0.yml` changed, so it shows as differing from its template: read the diff and replace it with `--replace architecture-tier0.yml`. Then create `tier0-waiting` with `escalate.js labels <root> --create`.

## [10.12.0]

### Added
- **A trusted agent keys its own Tier 0 request.** Until now every Tier 0 write waited for a person to apply `architecture-tier0`, so an unattended build could not finish a write on its own. An architecture now lists the kinds an agent may start in `.sa-skills/project.json` — `"tier0": { "auto": [...] }`, a subset of the four or `"all"` (`support.js --declare-auto`) — and the agents it trusts in `SA_TIER0_TRUSTED_AGENTS` (a machine user's login or a GitHub App's `name[bot]`). `architecture-tier0.yml` then accepts the agent's own label on an issue the agent opened that carries the `sa-tier0` marker, at most `SA_TIER0_AUTO_DAILY` (default 10) per agent per 24 hours, labels it `tier0-auto`, and the pull request says no person read the request before the write. Each failed condition is refused on the issue, as for any other key.
- **`tier0.js prepare --auto`** holds an agent-keyed request to the architecture's `tier0.auto`, and a move to `Resolved` to merged code: every `owner/repo@sha` its evidence names must be on that repository's default branch (GitHub's compare; `SA_TIER0_EVIDENCE_TOKEN` reads a private one). A person's key is not held to it.
- **The issue format and `BUILD.md` rule 10 follow the policy.** `labelsOf` / `issueBody` (and `tier0.js render --auto <kinds>`) give an unattended request of an auto kind the key and a footer that says it was keyed by the agent; the bundle's `support.tier0_auto` carries the kinds; rule 10 names them, tells the build to key them itself and to request a `Resolved` move once its pull request is merged, and keeps every other kind a person's.
- **`tier0-auto`**, the seventeenth label `escalate.js labels` checks and creates.

### Upgrade
- An architecture repository copies `architecture-tier0.yml` again, moves every workflow's `SA_PLUGIN_REF` to `v10.12.0` and runs `escalate.js labels <project> --create` for `tier0-auto`. Nothing changes until it declares `tier0.auto` and sets `SA_TIER0_TRUSTED_AGENTS`. The MCP server renders the issue: until it carries `support.tier0_auto`, rule 10 has the build add the key after filing.

## [10.11.4]

### Fixed
- **10.11.3's refused key could not reach the issue.** The key step runs before the checkout, and `gh issue` without `-R` finds the repository from the git checkout on disk: the comment failed (`not a git repository`), the step stopped, and the label stayed on. Both calls now pass `-R "$GITHUB_REPOSITORY"`; the test's fake `gh` fails an issue command without it, as the real one does there.

### Upgrade
- An architecture repository copies `architecture-tier0.yml` again and moves every workflow's `SA_PLUGIN_REF` to `v10.11.4`.

## [10.11.3]

### Fixed
- **A refused Tier 0 key says so on the issue.** `architecture-tier0.yml` refused a label put by an automation account (a bot, or an account in `SA_TIER0_AGENTS`) or by a reader without triage only in the run's log: the label stayed on, so the request looked approved, and no comment said why nothing happened. The key step now comments who applied the label and why it does not count, and takes `architecture-tier0` off; the request stands, so it is not labelled `tier0-refused`. Found by an unattended build's request labelled by an account listed in `SA_TIER0_AGENTS`.

### Upgrade
- An architecture repository copies `architecture-tier0.yml` again (the key step changed) and moves every workflow's `SA_PLUGIN_REF` to `v10.11.3`.

## [10.11.2]

### Changed
- **The local server pins Alia 0.4.0** (`SA_INDEX_SERVER_TAG`, #14): a second publish of a released version accepts a ledger that only adds keys to the one held, at any depth, every value unchanged, stored with the publish that carries the build packs. A released version can be republished after the plugin derives a new ledger field — 1.6.0 of the demo project republished its three build packs with 10.10.14's `BUILD.md`, its ledger extended by `tdrs[].components`.

### Fixed
- **`publish-index.sh` prints a ledger extension and says what `ledger_differs` now means** (#13). On a 200 whose `ledger` is `extended` it prints `ledger extended: <paths>`; the header documents `ledger` / `ledger_added`. `ledger_differs` is a changed value — the architecture differs from its tag, or the plugin reads a fact differently — and only `chunks_differ` waits for the next architecture release.

### Upgrade
- A server below Alia 0.4.0 still refuses an extended ledger with `ledger_differs`. An architecture repository moves every workflow's `SA_PLUGIN_REF` to `v10.11.2`.

## [10.11.1]

### Fixed
- **A refused republish of a released version says what to do for its reason.** `publish-index.sh` gave one hint for every 409 — "regenerate the missing packs or fix the kit" — which fits `packs_missing` only. A version republished after the plugin moved (`SA_PLUGIN_REF`) is refused `ledger_differs` when the plugin learned to derive a ledger field since that publish, though the architecture equals its tag; no kit fix helps. The script now says so for `ledger_differs` and `chunks_differ`: what the plugin adds reaches the server with the next architecture release. Accepting a ledger that only extends the one held is asked of the server.

### Upgrade
- An architecture repository moves every workflow's `SA_PLUGIN_REF` to `v10.11.1`.

## [10.11.0]

### Added
- **`escalate.js labels <project> [--create]`: the labels a RUN-team repository needs, checked and created.** An escalation is filed without a label its repository lacks, so a missing one never showed: every escalation of a measured project went out unlabelled, because nothing created `architecture-escalation`, `tier-1`, `tier-2` or the seven `trigger:<id>`. The command reads `origin` and lists the sixteen labels escalations and Tier 0 requests carry — present or missing, exit 1 on a missing one — and `--create` adds the missing on GitHub, GitLab and Gitea; Azure DevOps creates a tag on its first use. The set is read from the escalation routes and triggers and the Tier 0 kinds, and a test holds it to `tier0.js` and the Tier 0 workflow. `/setup` Step 12 runs it on a RUN-team project and asks before creating; `support.js --declare run` names it as the next step.

### Upgrade
- A RUN-team repository runs `escalate.js labels <project>` once (or `/setup`), creates the missing labels, and moves every workflow's `SA_PLUGIN_REF` to `v10.11.0`.

## [10.10.14]

### Fixed
- **An IDE agent refiles an issue the host refuses for a missing label, by rule.** `gh issue create --label` fails outright when the repository lacks a label. `escalate.js issue --create` already refiled without it, but `BUILD.md` said nothing, and an unattended build improvised the same fallback (an escalation whose repository had no `architecture-escalation`, `tier-1` or `trigger:*`). Rules 9 and 10 now say it: file the issue again without the labels refused — the `[ESC-?]` / `[T0-?]` title identifies it — and name the missing labels beside its URL, to the user or, unattended, in the pull request; rule 10 adds that without `architecture-tier0` nobody can apply the request. `docs/RUN_TEAMS.md` § Setting up the repository says the same.

### Upgrade
- An architecture repository moves every workflow's `SA_PLUGIN_REF` to `v10.10.14` and republishes its build packs so the server serves the new `BUILD.md`.

## [10.10.13]

### Fixed
- **`what_changed` reports a TDR opened and closed between two releases.** A component's debt was read from its descriptor's `**Technical Debt:**` line, which drops a record once it is `Resolved`. A TDR recorded and resolved between two releases was in neither version's line, and the summary listed only the ADRs that link it. A TDR resolved since the release read as "no longer names" instead of a status move. The facts ledger's `tdrs` now carry `components` (the record's `affected-components`), and the diff counts a record that names the component there as well as on the line: "added TDR-NNN — … (Resolved)", or "TDR-NNN In Progress → Resolved". It is never an action. A ledger written before reads the line alone, as before.

### Upgrade
- An architecture repository moves every workflow's `SA_PLUGIN_REF` to `v10.10.13`; the next release's `changes.json` carries it.

## [10.10.12]

### Changed
- **The local server pins Alia 0.3.3** (`local/compose.yaml`). A Tier 0 status move on a TDR created since the release, which the draft index carries since 10.10.11, is previewed on the project's draft instead of refused (`no record under tdr/`). The same applies to a project ADR proposed since the release and cited by a workaround (solutions-architect-knowledge-base #26).

### Upgrade
- A local server: `docker compose … up -d server` again to pull 0.3.3. An architecture repository moves every workflow's `SA_PLUGIN_REF` to `v10.10.12`; nothing else in the workflows changed.

## [10.10.11]

### Fixed
- **A Tier 0 write reaches the IDE before the next release.** The merge is made with `GITHUB_TOKEN`, which starts no push workflow, and the index workflow publishes only on a release tag or a kit commit, so a new TDR stayed out of the MCP server until a release: the IDE could not read it, nor preview its next status move. `ci/architecture-tier0.yml` now dispatches `architecture-index.yml` with `draft=true` after an automatic merge (a `workflow_dispatch` by `GITHUB_TOKEN` runs; `actions: write` is already granted); a pull request left open says to run it after the merge.

### Upgrade
- Copy `skills/architecture-lifecycle/ci/architecture-tier0.yml` over the architecture repository's `.github/workflows/architecture-tier0.yml` again, and move every workflow's `SA_PLUGIN_REF` to `v10.10.11`.

## [10.10.10]

### Fixed
- **A TDR status move no longer leaves sentences that state the old status.** A move rewrote the record, its index row, the Section 13 row and the component's `**Technical Debt:**` line, and left prose elsewhere such as "… stays in TDR-NNN (In Progress)", so a closed record read as live debt until a person found it. `tdr-check.js` gains `status-stale`: a line of `ARCHITECTURE.md` or `docs/**` that cites a record next to a status (one of the five or its Jira tag, set off by brackets, backticks, bold or a table cell) other than the record's. It is a WARNING in the audit and the release gate. `--mentions [TDR-NNN]` lists those lines and, for a closed record, the other lines that cite it.
- **A Tier 0 `tdr-status` write edits those lines, or is refused.** `tier0.js verify` refuses a move that leaves a line stating the record's old status. The other lines that cite a record moved to `Resolved` or `Won't Fix` are listed on the pull request under *Mentions to review*: whether a sentence still calls it debt is a person's call. The TDR skill's Update step runs the same check.

### Upgrade
- Copy `skills/architecture-lifecycle/ci/architecture-tier0.yml` over the architecture repository's `.github/workflows/architecture-tier0.yml` again (the write prompt and the pull request body).

## [10.10.9]

### Fixed
- **A Tier 0 pull request no longer leaves a failed *Architecture gates* run behind.** GitHub holds the `pull_request` runs of a pull request opened with `GITHUB_TOKEN` for approval, with no job, and ends them as failures once the pull request is merged; every automerged Tier 0 write left one red run (the gates ran inside the Tier 0 job all along). `ci/architecture-tier0.yml` deletes them after the merge (`actions: write`); a pull request left open keeps them for a member of the team to approve.
- **The record's id appears once in a Tier 0 issue and pull request title.** A request titled "TDR-002: …" became "[TDR-002] TDR-002: …"; the workflow now strips a leading id before adding its own.

### Upgrade
- Copy `skills/architecture-lifecycle/ci/architecture-tier0.yml` over the architecture repository's `.github/workflows/architecture-tier0.yml` again (it gains `actions: write`).

## [10.10.8]

### Changed
- **The local server pins Alia 0.3.2** (`SA_INDEX_SERVER_TAG` default in `local/compose.yaml`). `preview_tier0` now previews a TDR status move that is valid from a status reachable since the release, saying what it assumes, instead of refusing it. A second status move on a TDR no longer waits for a release. The architecture repository's CI on main stays the authority (#11).

## [10.10.7]

### Fixed
- **A release that rotates its changelog passes its own gates.** `changelog-rotate.js` moves old entries to `docs/CHANGELOG-ARCHIVE.md`, and the `headers` gate (`explorer-cli.ts check`) exempted `docs/CHANGELOG.md` but not the archive, so the release pull request that first rotated failed with `missing-header`. The archive is exempt there and from the ADR citations the catalog diff collects, as the changelog is.

## [10.10.6]

### Fixed
- **The `adr-index` release gate no longer fails on the calendar.** It compared `adr/README.md` with a fresh render byte for byte, `**Last Synced**:` date included, so an index synced on an earlier day failed every later run with no ADR changed — and a Tier 0 pull request opened the next day was left unmerged ("a release gate blocks"). The gate now leaves that line out of the comparison.
- **`BUILD.md` rule 9 is titled for what it covers: a question that blocks the build.** Its title, "What only the architect can answer…, never kept in a local file", read as covering every `TODO(architecture)` rule 3 keeps in the code, and an IDE agent offered to escalate two dozen questions that block nothing.

## [10.10.5]

### Changed
- **The local server pins Alia 0.3.1** (`SA_INDEX_SERVER_TAG` default in `local/compose.yaml`). Its own `what_changed` compares a part's substance and lists `restamped`, as 10.10.4 does (#10).

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
