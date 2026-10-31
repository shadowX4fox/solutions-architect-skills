# Installation

This guide takes you from nothing to a project ready for its first architecture: requirements, the install, the
one-time setup per project, institution packs, the judge, updates and a final check. For a first architecture after
that, see [QUICK_START.md](QUICK_START.md). If something goes wrong, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 1. Requirements

| Tool | Needed for | Required |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | Running the skills | Yes |
| [Bun](https://bun.sh) ≥ 1.0 | Every script the skills run (Node.js is not supported) | Yes |
| [ripgrep](https://github.com/BurntSushi/ripgrep) (`rg`) | Every search the skills run through Bash | Yes |
| git | Releasing an architecture (a release is a git tag) and importing an ADR catalog | For those workflows |
| A Chrome / Chromium browser | Mermaid diagrams rendered as pictures in Word and PDF exports | Optional |
| Docker and Ollama | Running the architecture MCP server locally | Optional |

### Install Bun

**macOS and Linux** (also inside WSL2 or Git Bash on Windows):

```bash
curl -fsSL https://bun.sh/install | bash
bun --version          # 1.0.0 or later
```

Homebrew: `brew install oven-sh/bun/bun`.

**Windows (PowerShell or cmd).** With Node.js installed, the npm route avoids execution-policy and proxy issues:

```powershell
npm install -g bun
```

Without Node.js, use the official installer (needs the `RemoteSigned` or `Unrestricted` execution policy):

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

If `bun` is not found afterwards, open a new terminal (on Windows, sign out and back in) so the updated `PATH` applies.

### Install ripgrep

`brew install ripgrep` · `sudo apt-get install ripgrep` · `sudo dnf install ripgrep` · `winget install BurntSushi.ripgrep.MSVC`.
`/sa-skills:setup` checks for it and prints the right command for your machine.

## 2. Install the plugins

```bash
claude plugin marketplace add shadowX4fox/solutions-architect-skills
claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user
```

Then, in a running Claude Code session, run `/reload-plugins` (or restart Claude Code).

Installing `sa-skills` installs the five plugins it depends on. The suite is six plugins from one marketplace:

| Plugin | What it does |
|---|---|
| `sa-skills` | Writes and maintains `ARCHITECTURE.md` and `docs/`, the component index, explorer headers and releases |
| `sa-records` | Architecture Decision Records (ADRs) and Technical Debt Records (TDRs) |
| `sa-requirements` | The Product Owner Specification (PO Spec) and its capability alignment (BIAN, cross-industry or your own) |
| `sa-analysis` | Ten risk and design analyses (SPOF, STRIDE, latency …) and PO Spec coverage |
| `sa-delivery` | The developer handoff kit, Word exports and the MCP index |
| `sa-visualization` | The 3D Architecture Command Center |

You can install part of the suite on its own: `sa-records` for a repository that maintains an institutional ADR
catalog, `sa-requirements` for a Product Owner.

### User scope or project scope

| Scope | Flag | Use it when |
|---|---|---|
| User | `--scope user` | You work on architectures in many projects. One install serves all of them. |
| Project | `--scope project` | One repository should pin the plugins for everyone who clones it. The choice is written into that project's `.claude/settings.json`. |

A project-scope install takes precedence over the user-scope one inside that project. Use the same scope for every
plugin of the suite, and pass the same flag when you update or uninstall.

### Optional: sa-ux

`sa-ux` is a small UX layer drawn inside Claude Code: next-step prompts computed from the project's files, shown above
the prompt box. It reads what the skills write and never edits a document. It needs a Claude Code build with
function-hook mods.

```bash
claude plugin install sa-ux@shadowx4fox-solution-architect-marketplace --scope user
```

### Install the npm packages

Claude Code's plugin install does not run `bun install`. The Word / PDF export and the handoff kit's contract checks
need the plugin's npm packages, so install them once in the plugin directory (and again after each update):

```bash
cd "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --quiet)"
bun install
```

`plugin-root.ts` prints the directory of the installed `sa-skills` (see [§ 8](#8-verify-the-install)). Packages load
only at the version the plugin pins. A missing one is refused with this same command, never fetched at another version.

For Mermaid pictures in exports, `bun install` also brings mermaid-cli. It still needs a browser. Install one with
`bunx puppeteer browsers install chrome`, or point `PUPPETEER_EXECUTABLE_PATH` at a Chrome already on the machine.

### Install from another Claude Code instance

Paste this into Claude Code. It installs, repairs what is missing and verifies:

```text
Install the Solutions Architect Skills suite for me, from a shell (the `claude` CLI):
1. If `claude plugin marketplace list` does not show shadowx4fox-solution-architect-marketplace, run
   `claude plugin marketplace add shadowX4fox/solutions-architect-skills`; if it does, run
   `claude plugin marketplace update shadowx4fox-solution-architect-marketplace`.
2. If `claude plugin list` does not show sa-skills@shadowx4fox-solution-architect-marketplace, run
   `claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user`. If it does, run
   `claude plugin update <name>@shadowx4fox-solution-architect-marketplace --scope user` for each of sa-skills,
   sa-records, sa-requirements, sa-analysis, sa-delivery and sa-visualization (an update touches only the plugin it names).
3. Run `claude plugin list`. For every "Dependency <name>@… is not installed", run
   `claude plugin install <name>@shadowx4fox-solution-architect-marketplace --scope user`.
   Repeat until all six plugins show as enabled.
4. Run `bun --version` and `rg --version`. If either is missing, tell me the install command for my OS and stop.
5. Run `cd "$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --quiet)" && bun install`.
6. Report the six plugins with their versions, then tell me to run /reload-plugins and, in each project, /sa-skills:setup.
```

## 3. Set up each project

Open Claude Code in the project directory and run once:

```text
/sa-skills:setup
```

The command is safe to re-run: it adds what is missing and never removes your own entries. Its steps:

| Step | What it does |
|---|---|
| 1–4. Permissions | Merges the plugin's `.claude/settings.json.example` into the project's `.claude/settings.json`: permission grants, the enabled plugins and the marketplace. Grants for retired agents are removed and reported. |
| 5. `CLAUDE.md` | Writes a marked block into `CLAUDE.md` telling Claude where the architecture lives (`docs/`, `docs/components/`, `adr/`, `handoffs/`). Re-runs replace only that block. |
| 6. `.gitignore` | Adds `exports/`, `.cache/sa-skills/`, `CLAUDE.md` and `.claude/settings.json`. If one of those files is already tracked, it prints the `git rm --cached` command. |
| 7. Export toolchain | Reports `docx`, `pdfmake`, mermaid-cli and the browser, and renders one test diagram. A report, not a gate: only a missing `docx` fails. |
| 8. ripgrep | Reports `rg` and PCRE2 support. When a system `rg` exists, sets `USE_BUILTIN_RIPGREP=0` in the project settings so Claude Code's Grep tool uses it too. |
| 9. The judge | Writes `SA_JUDGE=agent` into the project settings when no scope sets it, and reports the engine in force (see [§ 5](#5-the-judge)). |
| 10. Contract validators | Validates a sample OpenAPI, AsyncAPI, GraphQL, Avro, DDL and Protobuf contract. **Required** for the handoff kit; the fix is `bun install` in the plugin directory. |
| 11. Institution packs | Lists the packs found and what each provides (see [§ 4](#4-institution-packs)). Informational. |
| 12. Restart | Reminds you to restart Claude Code so the settings load. |

`.claude/settings.json` is gitignored on purpose: it holds each developer's own settings. Every developer runs
`/sa-skills:setup` on their own machine.

### The permissions it grants

Plugin agents cannot raise their own permissions, so the grants live in the project settings:

| Group | Grants | Why |
|---|---|---|
| Shell | `Bash(bun *)`, `Bash(rg *)` | Every script is a `bun` command; every search is `rg` |
| git | `Bash(git clone *)`, `Bash(git -C .cache/sa-skills/adr-catalog *)` | Importing and refreshing an institutional ADR catalog, in one fixed folder |
| Plugin files | `Read(~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/**)` and the matching `cache/**` path | Skills read their own templates and guides |
| Scratch | `Read` / `Edit` on `.cache/sa-skills/**` | Payloads, the facts ledger, judge worksheets |
| Outputs | `Read` / `Edit` on `exports/*`, `analysis/*`, `visualizations/*`, `handoffs/**`, `BIAN_ALIGNMENT.md` | Where the skills write |
| Agents | `Agent(…)` for the ten sub-agents the skills dispatch | Section writers, reviewers, handoff generators, the export translator |
| Web | `WebSearch` | Looking up facts such as end-of-life dates |

Anything else asks you first, as Claude Code normally does.

## 4. Institution packs

The base plugins are generic. What belongs to one organization ships as an **institution pack**: a separate plugin,
usually from that organization's private marketplace, with an `sa-pack.json` at its root. A pack can add a design
language standard for diagrams, a licensed reference model, capability frameworks, architecture types, brand skins
for the command center and default settings. The base finds installed packs on its own.

Install a pack like any plugin:

```bash
claude plugin marketplace add <your organization's marketplace repository>
claude plugin install <pack-name>@<marketplace> --scope user     # or --scope project, in one repository
```

To see what is in force, run these from the project directory, where `<sa_skills_dir>` is the output of `plugin-root.ts`:

```bash
bun <sa_skills_dir>/scripts/shared/packs.js         # the packs found and what each provides
bun <sa_skills_dir>/scripts/shared/frameworks.js    # the capability frameworks available and the one declared
bun <sa_skills_dir>/scripts/shared/arch-types.js    # the architecture types available, the default marked
```

With no pack installed, `packs.js` prints something like:

```text
sa-skills 10.4.4 · no institution pack
  design language: none (fallback mode)
  BIAN landscape:  base — …/architecture-capability-alignment/references/bian-v14
```

No pack is a normal, fully working setup. "Fallback mode" means diagrams use the standard Mermaid and C4 formats with
no organization-specific labelling rules. The base ships two capability frameworks (BIAN and CROSS-INDUSTRY) and five
architecture types (Enterprise, Microservices, 3-Tier, N-Layer, BIAN). A project declares its framework once:

```bash
bun <sa_skills_dir>/scripts/shared/frameworks.js --declare <id|none> --project .
```

Writing a pack, and the full contract: [INSTITUTION_PACKS.md](INSTITUTION_PACKS.md).

## 5. The judge

Some checks need a judgement that code cannot make, for example which component a name in a sentence refers to.
Each such question goes through one judge, `scripts/judge.js`. The engine is set with `SA_JUDGE`:

| Engine | How it answers | Needs |
|---|---|---|
| `agent` (default) | Writes a worksheet under `.cache/sa-skills/judge/`. The session hands it to a small sub-agent and re-runs the command. Nothing leaves the machine. | Nothing |
| `typesafe` | Jev, over the TypeSafe API | `TYPESAFE_API_KEY` |
| `clef` | Cloudflare's Clef on Workers AI | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |

An item no judge has answered is reported as **undecided**, never guessed. The two API engines send the judged items
off the machine, so choosing one is your decision. Keep API keys in your shell profile (`~/.bashrc`, `~/.zshrc`),
above any "not interactive" guard, and **never** in a versioned file such as `.claude/settings.json`.
`/sa-skills:setup` (Step 9) reports what is in force; `bun <sa_skills_dir>/scripts/setup-judge.ts .` runs that report alone.

## 6. Update and uninstall

### Update

`claude plugin update` updates **only the plugin it names**. Update the marketplace, then each plugin, with the scope
you installed at:

```bash
claude plugin marketplace update shadowx4fox-solution-architect-marketplace
for p in sa-skills sa-records sa-requirements sa-analysis sa-delivery sa-visualization; do
  claude plugin update "$p@shadowx4fox-solution-architect-marketplace" --scope user
done
claude plugin list
```

Then:

1. **Install any new dependency.** An update does not install a dependency that a new version adds. If
   `claude plugin list` shows `Dependency "<name>@…" is not installed`, run
   `claude plugin install <name>@shadowx4fox-solution-architect-marketplace` with the same scope.
2. **Re-run `bun install`** in the plugin directory ([§ 2](#install-the-npm-packages)). Each version is a new directory.
3. **Reload.** A running session keeps the version it loaded at startup. Run `/reload-plugins` or restart Claude Code.
4. **Re-run `/sa-skills:setup`** in each project, so the permission grants match the new version.

What changed in each release: [CHANGELOG.md](../CHANGELOG.md).

### Uninstall

Uninstall `sa-skills` first, since it depends on the others:

```bash
for p in sa-skills sa-analysis sa-delivery sa-visualization sa-requirements sa-records; do
  claude plugin uninstall "$p@shadowx4fox-solution-architect-marketplace"
done
```

Uninstall `sa-ux` the same way if you installed it. Add `--scope project` for a project-scope install. Your architecture documents are never touched. The `CLAUDE.md` block,
the `.gitignore` entries and the grants in `.claude/settings.json` stay until you remove them by hand.

## 7. Optional extras

### context7

[context7](https://context7.com) supplies current library documentation. When it is configured, `architecture-docs`
uses it for the technologies in new component files, and `architecture-dev-handoff` uses it to check the syntax of the
contracts it generates (OpenAPI, AsyncAPI, Protobuf, Avro, DDL). It informs syntax only: every value still comes from
your architecture documents. Without it, every skill works the same, with no warning.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

### VS Code

| Extension | Why |
|---|---|
| [Claude Code for VS Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) | Run the skills from the editor |
| [Mermaid Chart](https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart) | Live preview of the Mermaid diagrams in `docs/*.md` (the plugin targets Mermaid v11.4.1) |

## 8. Verify the install

```bash
claude plugin list
```

All six `sa-*` plugins from `shadowx4fox-solution-architect-marketplace` show as enabled, at the same version.

```bash
bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts
```

This prints the `sa-skills` directory the skills use, read from Claude Code's install registry (a project-scope
install first, then user scope). Add `--plugin <name>` for another plugin of the suite, or `--json` for the details. On
stderr it warns when a newer version is installed than the one in use. Run the `claude plugin update` it suggests, then
`/reload-plugins`.

In Claude Code, `/sa-skills:setup` in a project is the full check: every missing piece it reports names the command that fixes it.
Then try a first request, such as *"Elicit the requirements for a parcel-tracking service"*, and continue with
[QUICK_START.md](QUICK_START.md).
