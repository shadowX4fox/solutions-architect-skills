# Institution packs

The base plugin is generic: it works for any architecture, in any organization. What belongs to one organization
— its design language standard, its licensed copy of the BIAN Service Landscape, its brand, its reference architecture types, its compliance contracts, its forms, its defaults — ships
in an **institution pack**: a separate Claude Code plugin the organization keeps in its own (usually private)
marketplace. Install the base, then the pack; the base finds the pack, never the other way round.

## What the base carries without a pack

- **No design language standard.** Every skill runs in fallback mode until a pack provides one.
- **The open BIAN corpus**: the full taxonomy (8 Business Areas, 43 Business Domains, 341 Service Domains, ids, API links),
  each Service Domain described by its published API's own description (Apache License 2.0, BIAN's semantic API repository) —
  257 of them; the Service Landscape's role definitions and examples of use are © BIAN and are not bundled. A pack
  whose `frameworks` folder carries a `BIAN` framework — the organization's licensed landscape — replaces it, and BIAN
  alignment then judges every Service Domain.
- **Four skins** (`alia`, the default, `holo`, `atlas`, a neutral `corporate`).
- **Two capability frameworks** for the alignment gate — `BIAN` (banking) and `CROSS-INDUSTRY` (the Turbo EA cross-industry
  map, CC BY 4.0). The gate is mandatory only once a framework is declared (`.sa-skills/project.json`, or a pack's
  `defaults.framework`); a project may declare `none`.
- **Five architecture types** — `ENTERPRISE` (the default: Channels, Experience, Process, Domain Services, Systems of Record),
  `MICROSERVICES`, `3-TIER`, `N-LAYER`, `BIAN`.
- **No compliance contracts and no ADR coverage map.** An organization's compliance questions are its own: a pack ships
  them as a plugin of its marketplace (the skill, its readers and its requirement registry); the ADR skill imports a
  catalog's `COVERAGE_MAP.json` as data either way.

## What a pack is

A plugin whose root carries `sa-pack.json`:

```json
{
  "name": "sa-pack-acme",
  "version": "1.0.0",
  "base": ">=10.2.0 <11.0.0",
  "provides": {
    "designLanguage": "design-language",
    "skins": "skins",
    "architectureTypes": "architecture-types",
    "frameworks": "frameworks",
    "docTheme": "doc-theme"
  },
  "defaults": {
    "docLanguage": "es",
    "theme": "acme",
    "architectureType": "ACME",
    "framework": "BIAN",
    "adrCatalog": { "url": "https://git.acme.example/architecture/adr-catalog.git", "ref": "main" }
  }
}
```

| Field | Meaning |
|-------|---------|
| `name`, `version` | The pack's own; `version` moves on the pack's cadence |
| `base` | The base versions it works with: space-separated comparators (`>=9.1.0 <10.0.0`), `^9.1`, `9.x` or `*`. A base outside the range skips the pack, with a warning in `/setup` |
| `provides` | Folders inside the pack, each optional — see below |
| `defaults` | Values a skill uses when the project states none: `docLanguage`, `theme` (a skin id), `architectureType` (a type id, the one Workflow 1 offers first), `framework` (the capability framework the organization aligns to — the project's own declaration wins), `adrCatalog` |

`provides`:

| Key | The folder holds | Proof it is that folder |
|-----|------------------|-------------------------|
| `designLanguage` | The design language standard in the layout `architecture-docs` reads (`llms-rules.txt`, `llms-mermaid.txt`, `llms-full.txt`, `rules-registry.json`, `bian-registry.json`, `es/`, `bian/`) | `llms-rules.txt` |
| `architectureTypes` | Architecture types, one folder each: `type.json` (`id`, `name`, `summary`, `files` — `section4`, `section5` (or null), `reference`, `c4` — and `matrix`, the principle gate's rows: principle number → phrases one of which its Implementation or Trade-offs must name) and the four Markdown files it names. A type with a built-in's id replaces it. `bun <sa_skills_dir>/scripts/shared/arch-types.js` lists what is in force | each `type.json` and its files |
| `frameworks` | Capability frameworks, one folder each: `framework.json` (`id`, `name`, `industry`, `index`, `files` — the area files' pattern —, `levels` / `headings` — the names of its three levels —, `id_label`, `noun`, `report`, `license`, `attribution`) and the corpus it describes, in the shape of the base's `references/bian-v14/`. A framework with a built-in's id replaces it: an organization's licensed BIAN Service Landscape is a `BIAN` folder here, its `framework.json` the base's with the pack's `license`. `bun <sa_skills_dir>/scripts/shared/frameworks.js` lists what is in force | each `framework.json` and its index file |
| `skins` | Command center skins, one folder each (`skin.json`, `skin.css`) — see `plugins/sa-visualization/skills/architecture-command-center/skins/README.md` | each `skin.json` |
| `docTheme` | The Word and PDF exports' look: `theme.json` — `colors`, `docTypes`, `cover` (`style` `night` or `light`, `image`, the night colours), `blazon` (a square PNG: the cover and every page header), `fonts.heading` (TTF files for PDF headings) — beside the files it names. It replaces the base's `alia` theme; a key it leaves out comes from `alia`, but no cover image, blazon or font is borrowed. `bun <sa_skills_dir>/tools/docgen/theme.js` names the theme in force; `tools/docgen/themes/alia/theme.json` is the reference | `theme.json` |

## How the base finds packs

`scripts/shared/packs.js` is the one resolver; every skill and script asks it. A pack is found:

1. from `SA_PACKS` — directories, separated like `PATH` (development and tests);
2. from Claude Code's install registry (`~/.claude/plugins/installed_plugins.json`) — any installed plugin, from any
   marketplace, whose root carries `sa-pack.json`: the user-scope install, and a project- or local-scope install whose
   project is the working directory or an ancestor.

**A project chooses its packs** (10.6.0). A user-scope pack applies to every project on the machine, including one
outside its organization (an open-source project, a client's, a demo), where its brand skin, design language,
architecture type and defaults do not belong. `.sa-skills/project.json` — the nearest one at or above the working
directory — narrows it: `"packs": []`, no pack; `"packs": ["<name>", …]`, only those; the key absent, every pack found.
The resolver applies it before anything else, so every reader sees the same set, and reports the packs it left out.

```bash
bun <sa_skills_dir>/scripts/shared/packs.js --declare none         # this project uses no institution pack
bun <sa_skills_dir>/scripts/shared/packs.js --declare sa-pack-acme # only this one
bun <sa_skills_dir>/scripts/shared/packs.js --declare all          # the key removed: every pack found
```

**Precedence, most specific first**: the project, then a pack, then the base's own copy. For skins it is additive —
the plugin's, then each pack's, then the project's `visualizations/skins/`, a later one replacing an earlier one of
the same id. Two packs providing the same folder: the first found is used, and `/setup` says so.

```bash
bun <sa_skills_dir>/scripts/shared/packs.js                      # what is found, and what is in force
bun <sa_skills_dir>/scripts/shared/packs.js --path design-language   # the folder in force, or nothing (exit 1)
```

Skill instructions name these folders `[design_language_dir]` (`packs.js --path design-language`) and `[bian_dir]` (`frameworks.js --dir BIAN`); with neither a pack nor
a base copy, the skills run in fallback mode, as they always have when the standard is absent.

## Installing

```bash
claude plugin marketplace add <the organization's marketplace repository>
claude plugin install sa-pack-acme@<marketplace> --scope user      # or --scope project, in one architecture repo
```

Then `/setup` in a project shows the pack in its last step.
