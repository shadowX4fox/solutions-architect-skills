---
name: architecture-ci-setup
description: >
  Set up CI/CD for an architecture and connect the service (dev) repositories built from it: in
  the architecture repository the five GitHub Actions workflows (gates, release, handoff, index,
  Tier 0) from the plugin's templates with the plugin's pin, the RUN-team policy, the labels and the
  repository's variables, secrets and settings; in a service repository the binding
  (.architecture.json), the architecture MCP server for the IDE (.mcp.json) and, for an unattended
  build, the build and merge workflows. Checks first, writes after the user's yes, never sets a
  secret itself. Use for "set up architecture CI", "connect a service repo to the architecture",
  "configure the architecture MCP in this repo", "set up the unattended build".
triggers:
  - set up architecture ci
  - set up the architecture ci/cd
  - architecture ci setup
  - check the architecture workflows
  - upgrade the architecture workflows
  - connect a service repository
  - connect this repo to the architecture
  - configure the architecture mcp
  - set up alia in this repo
  - set up the unattended build
---

# Architecture CI Setup

One script, `scripts/ci-setup.js`, checks a repository and writes what is missing. This skill runs it, asks before every write, and hands the user the commands for what only they can set. Every write follows the confirm-first rule: what changes, then the user's yes, then the write.

## Steps

1. **Resolve `plugin_dir`**: `bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-delivery`.
2. **Which side.** A directory with `ARCHITECTURE.md` is the **architecture** repository. One with `.architecture.json`, or a code repository the user names as a service, is a **service** repository. When a request covers both ("connect the service to the architecture"), do the architecture first. If it is unclear, ask.
3. **Check.** Run it read-only and show its output verbatim:
   - architecture: `bun [plugin_dir]/skills/architecture-ci-setup/scripts/ci-setup.js architecture <root> [--runner <labels>]`
   - service: `bun [plugin_dir]/skills/architecture-ci-setup/scripts/ci-setup.js service <dir> --architecture <owner/repo> [--project <key>] [--component <slug>] [--server <mcp_url>] [--attended] [--merge --tests "<name>"]`

   `✓` is done, `✗` is to do, `!` needs a decision, and `·` is optional.
4. **Ask what the report cannot know**, with `AskUserQuestion`, only for the rows that need it:
   - **Runner** (architecture): can a GitHub-hosted runner reach the MCP server? If it is on localhost or a private network, the index jobs run on a self-hosted runner: `--runner self-hosted,<label>`.
   - **RUN team** (architecture, only when the user wants Tier 0): `support.js <root> --declare run`. Then ask which kinds the repository may key for a trusted build agent, a multi-select of the four or none: `support.js <root> --declare-auto <kinds>|none`. Both write `.sa-skills/project.json`, which is a reviewed change like any other.
   - **Service binding**: the project key (the architecture's `SA_INDEX_PROJECT_KEY`), the component (its slug: `get_architecture` on the server, or `component-cli.ts list` in the architecture), and the server URL.
   - **Who builds it**: a person in an IDE (`--attended`), or an unattended build (the default). If unattended, ask whether its pull requests may merge without a person (`--merge`, the service team's policy), and which workflow runs the tests (`--tests`, its `name:`).
5. **Write.** List the files the run will write, and get the user's yes. Then run the same command with `--write`.
   - A workflow marked `!` differs from its template: it has changes of its own, or it came from an older template. Show `diff <file> <template>`, and replace it (`--replace <file>`) only for the files the user names.
   - The workflows reach the repository through a branch and a pull request, never a push to the default branch. Ask before pushing.
6. **What only the user sets.** The report prints a command for each row. Give the commands to the user, in order:
   - **Variables**: run `gh variable set …` after a yes, with the values the user gave.
   - **Secrets**: the user sets them in the prompt (`! gh secret set NAME -R <repo>`). Never ask for a secret's value in the chat.
   - **`CLAUDE_CODE_OAUTH_TOKEN`**: from `/install-github-app`, on that repository.
   - **Labels**: `escalate.js labels <root> --create`, after a yes.
   - **The workflow permission**: the `gh api -X PUT …` command, after a yes.
7. **Check again**, and report what is still open.

For a service repository with `.mcp.json` written, the developer approves the server once in Claude Code (`/mcp`). An unattended build also needs its identity, `SA_BUILD_TOKEN` (a machine user or a GitHub App), listed in the architecture's `SA_TIER0_TRUSTED_AGENTS` for every Tier 0 request it may write without a person.

## The pair, end to end

| Architecture repository | Service repository |
|---|---|
| `architecture-index.yml` publishes a release's build packs and dispatches `architecture-released` to `SA_SERVICE_REPOS` (`SA_DISPATCH_TOKEN`) | `architecture-build.yml` builds from the pack, unattended, and opens a pull request (`SA_BUILD_TOKEN`) |
| `architecture-tier0.yml` keys the build's request for a kind in `tier0.auto`, and a move to `Resolved` waits for the pull request it cites | `architecture-build-merge.yml` merges the build's pull request once the tests pass (opt in) |

Escalations stay with the architect: nothing in this pair answers one. Reference: `docs/RUN_TEAMS.md`.

## Permissions

`Bash(bun *)`, `Bash(gh *)`, `Write(.github/workflows/*)`, `Write(.architecture.json)`, `Write(.mcp.json)`.
