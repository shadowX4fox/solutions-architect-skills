# Troubleshooting

Problems are grouped by where they show up. Each entry gives the **symptom**, its **cause** and the **fix**, with the
command to run. Install steps are in [INSTALLATION.md](INSTALLATION.md).

In the commands below, `<sa_skills_dir>` is the installed `sa-skills` directory. Print it with:

```bash
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts
```

## Contents

- [Install and loading](#install-and-loading) · [Setup and permissions](#setup-and-permissions) · [Bun and npm packages](#bun-and-npm-packages)
- [Exports and diagrams](#exports-and-diagrams) · [The judge](#the-judge) · [Gates that block](#gates-that-block)
- [Handoff kit](#handoff-kit) · [Command center](#command-center) · [MCP index](#mcp-index) · [Still stuck?](#still-stuck)

## Install and loading

### `Dependency "<name>@…" is not installed`

- **Symptom:** `claude plugin list` shows `sa-skills` as failed to load, naming a missing dependency. Its skills are absent.
- **Cause:** `claude plugin update` updates only the plugin it names. It does not install a dependency a newer version adds.
- **Fix:** install the plugin the message names, with the scope `sa-skills` uses, then reload:

  ```bash
  claude plugin install <name>@shadowx4fox-solution-architect-marketplace --scope user
  ```

  Then run `/reload-plugins` in Claude Code.

### The plugins do not appear, or a skill is missing

- **Symptom:** `claude plugin list` does not list the `sa-*` plugins, or `/sa-requirements:architecture-readiness` is unknown.
- **Cause:** the marketplace is not registered, the plugin is not installed, or the session started before the install.
- **Fix:**

  ```bash
  claude plugin marketplace list        # shadowx4fox-solution-architect-marketplace must appear
  claude plugin marketplace add shadowX4fox/solutions-architect-skills
  claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user
  ```

  Then run `/reload-plugins`. Each skill is called through its plugin's name, for example `/sa-requirements:architecture-readiness`
  or `/sa-delivery:architecture-dev-handoff`. The README's [Skill Categories](../README.md#skill-categories) table lists the plugin of each skill.

### An old version keeps running after an update

- **Symptom:** `claude plugin list` shows the new version, but a skill behaves as before. Or `plugin-root.ts` warns that a newer copy is installed.
- **Cause:** a running session keeps the version it loaded at startup. A project-scope install also takes precedence over the user-scope one in that project.
- **Fix:** run `/reload-plugins` (or restart). If `plugin-root.ts` names a project-scope install, update that one with `--scope project`. Update every plugin of the suite, not only `sa-skills` ([INSTALLATION.md § 6](INSTALLATION.md#6-update-and-uninstall)).

## Setup and permissions

### Claude asks permission for every script or agent

- **Symptom:** prompts to approve `bun …`, `rg …` or an `Agent(…)` call on every step.
- **Cause:** plugin agents cannot raise their own permissions. The grants must be in the project's `.claude/settings.json`.
- **Fix:** run `/sa-skills:setup` in the project, then restart Claude Code. It merges the grants from the plugin's `.claude/settings.json.example`. Re-run it after every update so the grants match the new version.

### `/sa-skills:setup` cannot locate `settings.json.example`

- **Symptom:** `Cannot locate the sa-skills settings.json.example.`
- **Cause:** the plugin is not installed, or the command ran from your home directory.
- **Fix:** check `claude plugin list`, then run the command again from the project directory.

### `CLAUDE.md` or `.claude/settings.json` is still committed

- **Symptom:** setup's `.gitignore` step prints a `git rm --cached` command.
- **Cause:** `.gitignore` does not untrack a file git already tracks.
- **Fix:** run the command it prints, for example `git rm --cached .claude/settings.json`, and commit.

### `rg: command not found`

- **Symptom:** a skill step fails on an `rg` search.
- **Cause:** ripgrep is not installed. Every search the skills run through Bash uses `rg`.
- **Fix:** install it (`brew install ripgrep`, `sudo apt-get install ripgrep`, `winget install BurntSushi.ripgrep.MSVC`), then run `/sa-skills:setup` again: Step 8 confirms it.

## Bun and npm packages

### `bun: command not found`

- **Symptom:** every skill step that runs a script fails.
- **Cause:** Bun is not installed, or it is not on `PATH`.
- **Fix:** install Bun ([INSTALLATION.md § 1](INSTALLATION.md#install-bun)). If it is installed, add it to your shell profile and open a new terminal:

  ```bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  ```

### `<package>: … run bun install in <dir> (pinned <range>)`

- **Symptom:** an export, a contract check or a `/sa-skills:setup` line refuses to load a package such as `docx`, `graphql` or `@redocly/openapi-core`.
- **Cause:** Claude Code's plugin install and update do not run `bun install`. The plugin loads a package only from its own `node_modules`, at the version it pins, so a missing or off-pin package is refused.
- **Fix:**

  ```bash
  cd "<sa_skills_dir>" && bun install
  ```

  Repeat after each update: every version is installed in a new directory.

## Exports and diagrams

### Diagrams appear as code in Word or PDF

- **Symptom:** Mermaid diagrams export as monospace source instead of pictures.
- **Cause:** mermaid-cli is missing, or it cannot reach a browser. The export falls back to source and still succeeds.
- **Fix:** `bun install` in `<sa_skills_dir>` brings mermaid-cli. For the browser, run `bunx puppeteer browsers install chrome`, or set `PUPPETEER_EXECUTABLE_PATH` to a Chrome already installed. Confirm with:

  ```bash
  bun <sa_skills_dir>/scripts/setup-docgen.ts
  ```

  Its last line renders a real diagram. Add `--strict` to make any missing piece a failure in CI.

### `--format pdf` fails, or the PO Spec PDF is skipped

- **Symptom:** a warning after writing `PRODUCT_OWNER_SPEC.md`, and no file under `exports/`.
- **Cause:** `pdfmake` is missing. The Markdown spec is the deliverable, so the PDF is skipped with a warning.
- **Fix:** `bun install` in `<sa_skills_dir>`, then ask for the spec again or re-run the export.

## The judge

### Items reported as undecided, or a step stops on a pending worksheet

- **Symptom:** a check prints `PENDING` or lists items as undecided, naming a worksheet under `.cache/sa-skills/judge/`.
- **Cause:** with the default `agent` engine, the judgement is written as a worksheet for the session to answer. Until it is answered, no item is guessed.
- **Fix:** let the session continue. It dispatches the `worksheet-judge` sub-agent, then re-runs the same command, which applies the answers. If you ran the command yourself, ask Claude to answer the worksheet it names, then re-run the command.

### Every judged step fails with `SA_JUDGE=<value> — …`

- **Symptom:** every judged step fails, naming the `SA_JUDGE` value.
- **Cause:** `SA_JUDGE` holds a value that is not `agent`, `typesafe` or `clef`. `heuristic` and `claude` no longer exist.
- **Fix:** set `SA_JUDGE=agent` (or remove it and re-run `/sa-skills:setup`). Check what is in force with `bun <sa_skills_dir>/scripts/setup-judge.ts .`

### The `typesafe` or `clef` engine cannot answer

- **Symptom:** the setup report shows the key unset, or the live probe fails.
- **Cause:** the key is not exported in the shell Claude Code runs in, or it sits below an "if not interactive, return" guard in the profile.
- **Fix:** export `TYPESAFE_API_KEY` (or `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`) near the top of `~/.bashrc` or `~/.zshrc`, and restart Claude Code. Never put a key in `.claude/settings.json` or any versioned file. `SA_JUDGE=agent` works meanwhile with no key.

## Gates that block

Every gate is a script. A finding names a file and a line. **Fix the line it names**: rewriting a whole section to clear one finding can break a rule that already passed.

### A write to `docs/` is denied by a hook

- **Symptom:** a `Write` or `Edit` of `ARCHITECTURE.md` or `docs/**` is denied with a prose rule id.
- **Cause:** the project carries `<!-- PROSE_STYLE: v1 -->`, so the prose contract is enforced as you write. A blocking rule (template boilerplate, filler, first person …) matched a new line.
- **Fix:** rewrite that line as the message says. A project without the marker only reports. To migrate an older architecture, run `/sa-skills:restyle-architecture`.

### `prose-check.js` blocks a release

- **Symptom:** the release check lists blocking prose findings.
- **Fix:** run the check alone to see each finding with its line:

  ```bash
  bun <sa_skills_dir>/skills/architecture-docs/scripts/prose-check.js . --scope release
  ```

  A justified exception goes into `ARCHITECTURE.md` as `<!-- PROSE_STYLE_WAIVED: <reason> -->`. The release notes print the reason.

### `principle-check.js` blocks Section 3

- **Symptom:** a `P-…` finding on an architecture principle (for example, a missing trade-off or an open item in Trade-offs).
- **Fix:** edit the principle at the line given, then re-run:

  ```bash
  bun <sa_skills_dir>/skills/architecture-docs/scripts/principle-check.js .
  ```

  A Description too long or too many bullets means detail belongs in the ADR the principle cites.

### `flow-check.js` reports `phase-absent` or `flow-block-missing`

- **Symptom:** after a write of `docs/04-data-flow-patterns.md`, a flow's declared phases and its sequence disagree.
- **Cause:** `docs/04` states each flow twice, as a `**Phases**:` line and as a sequence. `phase-absent` means a declared phase is not in the sequence. `flow-block-missing` means a flow in the inventory has no block with a matching name. `phases-undeclared` means the phases are written as prose instead of on the `**Phases**:` line.
- **Fix:** correct the line or the sequence it names, then re-run both checks:

  ```bash
  bun <sa_skills_dir>/skills/architecture-docs/scripts/flow-check.js .
  bun <sa_skills_dir>/skills/architecture-docs/scripts/flow-compose.js . --check
  ```

  The end-to-end sequences are generated from the phase diagrams. Re-run `flow-compose.js .` without `--check` to regenerate them; do not edit them by hand.

### `label-check.js` prints `SKIPPED … fallback mode`

- **Symptom:** the connection-label check is skipped.
- **Cause:** no design language standard is in force. That standard comes with an institution pack.
- **Fix:** none needed: diagrams use the standard Mermaid and C4 formats. If your organization has a pack, install it and check with `bun <sa_skills_dir>/scripts/shared/packs.js`.

### The capability alignment gate asks or blocks

Creating an architecture first checks its inputs. The alignment gate (Step 0.3) has two non-passing states:

| State | Cause | Fix |
|---|---|---|
| ASK | No capability framework is declared for the project | Answer the question, or declare it: `bun <sa_skills_dir>/scripts/shared/frameworks.js --declare <id\|none> --project .` |
| BLOCK | A framework is declared but its report is missing, or its report version is too old | Run `/sa-requirements:architecture-capability-alignment` (add `--framework <ID>` for a framework other than BIAN) |

`frameworks.js` with no flags lists the available frameworks and the one declared. Declare `none` when no
capability framework applies.

### The HLD gate waits on a transcription

- **Symptom:** the HLD gate shows `TRANSCRIBE` for a PDF, PNG or SVG design.
- **Cause:** a picture is transcribed once into `<name>.hld.mmd` beside it, so later steps can read its connections.
- **Fix:** let the skill write the transcription, then continue. A Mermaid HLD needs no transcription.

### The architecture creation stopped part-way

- **Symptom:** some `docs/` files exist and the session ended, by design at a checkpoint or out of context.
- **Fix:** in a fresh session in the project, say `continue the architecture`. It resumes at the next item without asking the earlier questions again. Never start over.

### `architecture status` says `no-git`

- **Cause:** a release is a git tag (`architecture-v<version>`), so the project must be a git repository.
- **Fix:** `git init`, commit the architecture, then release with `/sa-skills:release-architecture`.

## Handoff kit

### The handoff skill refuses to start: contract validator missing

- **Symptom:** Step 1.2 stops on `contract-check.js --probe`, or `/sa-skills:setup` Step 10 fails.
- **Cause:** the validators (`@redocly/openapi-core`, `graphql`, `avsc`, `libpg-query`, `node-sql-parser`, `protobufjs`) are not installed.
- **Fix:** `cd "<sa_skills_dir>" && bun install`, then `bun <sa_skills_dir>/scripts/setup-contracts.ts`.

### The handoff stops on `docs/05-integration-points.md`

- **Cause:** the kit is built from the documented integrations, so `docs/05` must exist with `I-nn` rows.
- **Fix:** document the integrations (Section 7 of the architecture), then generate the kit again.

### `operation-undocumented`, `channel-undocumented` or `field-undocumented`

- **Symptom:** a generated `openapi.yaml`, `asyncapi.yaml` or `*.avsc` fails the kit gate.
- **Cause:** the asset contains an operation, topic or field that the architecture documents never state. Assets may carry only what is documented.
- **Fix:** if the item is real, add it to the component's documentation and regenerate the kit. If not, regenerate: the asset must not invent it. Do not hand-edit the asset.

### `version-stale`, `security-missing` or `interface-missing`

| Finding | Cause | Fix |
|---|---|---|
| `version-stale` | A kit part names an older architecture version | Regenerate the kit after the release |
| `security-missing` | A Component Specification has no `security.md` beside its assets | Regenerate that component |
| `interface-missing` | The specification's position names neither an interface its security obligations list nor the Interface Contract that carries it | Regenerate the component, or document the interface in `docs/05` |

Run the gate alone with `bun <sa_skills_dir>/plugins/sa-delivery/skills/architecture-dev-handoff/scripts/kit-check.js handoffs`.

## Command center

### The page opens blank or without the 3D model

- **Cause:** the viewer loads Three.js from a CDN (cdnjs.cloudflare.com), so it needs internet access.
- **Fix:** open it on a machine with network access, or allow that host through your proxy.

### Findings do not appear on the stage

- **Cause:** findings come from the reports in `analysis/`, baked into the scene's dossier. A scene generated before the analyses has none.
- **Fix:** run the analyses, then ask for the command center again. It regenerates the scene and its dossier.

### A component or connection is missing from the model

- **Cause:** the scene is generated from the documents. A name the generator could not resolve is left out and reported.
- **Fix:** read the report the skill prints after generating the scene. Fix the documents it names (usually a `docs/05` row or a component file), then regenerate.

## MCP index

### The bundle is a draft and CI does not publish it

- **Symptom:** `index: <project> <version> (draft)`, or CI prints `is a draft here … Not published.`
- **Cause:** a bundle is released only while `ARCHITECTURE.md`, `docs/`, `adr/` and `tdr/` match the tag `architecture-v<version>` and nothing is uncommitted.
- **Fix:** release the change (`/sa-skills:release-architecture`) or commit what is pending. To publish a draft on purpose in CI, set `SA_INDEX_ALLOW_DRAFT=true`.

### The bundle has no build packs

- **Symptom:** `build packs: 0`, with `skipped <component>: kit-version <old>`.
- **Cause:** a build pack needs a handoff kit of exactly the architecture's version. At the release tag, the kit still carries the previous version.
- **Fix:** regenerate the kit after the release and commit `handoffs/`. CI exports the same version again, with its packs.

### `publish-index.js --up` cannot start the local server

- **Cause:** the local server runs in Docker and embeds text through Ollama. Docker is not running, or the container cannot reach the host's Ollama.
- **Fix:** start Docker. If Ollama listens only on `localhost`, set `OLLAMA_HOST=0.0.0.0` for it and restart it, or set `SA_INDEX_OLLAMA` to an address the container can reach. With no reachable Ollama, the script starts a CPU-only Ollama container instead.

## Still stuck?

Open an issue at [github.com/shadowX4fox/solutions-architect-skills/issues](https://github.com/shadowX4fox/solutions-architect-skills/issues). Include:

- What you ran (the request or command) and what you expected.
- The exact error or finding, with the script's output.
- `claude plugin list` and the output of `plugin-root.ts`.
- Your OS, `bun --version` and `claude --version`.
- The output of `/sa-skills:setup`, if the problem looks like setup.

Never paste API keys, and use synthetic names rather than your organization's real architecture. Security issues
go through [SECURITY.md](../SECURITY.md), not a public issue.
