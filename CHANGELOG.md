# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

10.1.0 is the first public release. Earlier versions were developed privately and their history is not published.

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
