> Part of **Workflow 1 — Create** (`architecture-docs`), split out of `05-sections.md` (8.88.0). Read it when the run reaches **item `index` (`ARCHITECTURE.md`)** — never before, and never at a resume that does not start there. `05-sections.md` is the loop every section follows; this file is only the index, the type metadata and the end-of-writing checks.

#### Step 5 — `ARCHITECTURE.md`, type metadata and the closing checks of Step 5

5. Write `ARCHITECTURE.md` as the navigation index using the template from RESTRUCTURING_GUIDE.md. **Include architecture version metadata** at the very top of the file:

   ```markdown
   <!-- ARCHITECTURE_VERSION: 1.0.0 -->
   <!-- ARCHITECTURE_STATUS: Draft -->
   <!-- ARCHITECTURE_RELEASED: -->
   <!-- DOC_LANGUAGE: [en | es — the value resolved at Step 0.1] -->
   <!-- PROSE_STYLE: v1 -->

   # [System Name] - [Tagline]

   > [≤35 words: what the system does, for whom, and the one constraint that shapes it.]

   **Version**: 1.0.0
   **Status**: Draft
   **Released**: — (set when Status transitions to Released)
   **Architect**: [Name or Team from Step 4 metadata]
   **Supersedes**: —

   ## Documentation

   | # | Title | File | Description |
   |---|-------|------|-------------|
   | S1+S2 | Executive Summary + System Overview | [docs/01-system-overview.md](docs/01-system-overview.md) | ... |
   | S3 | Architecture Principles | [docs/02-architecture-principles.md](docs/02-architecture-principles.md) | ... |
   | ... | ... | ... | ... |

   (See RESTRUCTURING_GUIDE.md for the full Navigation Index Template.)
   ```

   New architectures start at **v1.0.0** with **Status: Draft**. The `Released` date and `Supersedes` fields are populated later by the release (`architecture-lifecycle`).

   **`PROSE_STYLE: v1`** records that this architecture was written under the prose contract
   (`references/PROSE_STYLE.md`). New architectures always carry it — Step 5.7 runs in `enforcing`
   mode. Its absence marks a pre-contract document, which the gate runs in `report-only` mode until
   `/restyle-architecture` (Workflow 12) or a release migrates it.

   **`DOC_LANGUAGE` is mandatory** and carries the value resolved at Step 0.1. It is the authoritative record of the documentation language for this project — `ARCHITECTURE.md` is the only place it may live, and every downstream skill reads it from here (`references/LANGUAGE_POLICY.md` §1). Also record the gate outcome at the top of `docs/01-system-overview.md`, alongside the `PO_SPEC_GATE` / `BIAN_ALIGNMENT_GATE` / `HLD_GATE` records:

   ```
   <!-- DOC_LANGUAGE_GATE: PASSED (es, YYYY-MM-DD) -->
   ```

   The navigation index's own visible text — the `# [System Name] - [Tagline]` heading, the mission statement, the `## Documentation` heading and the Title/Description columns of the index table — is authored in `doc_language`. The metadata **comment names and values**, the `**Version**` / `**Status**` / `**Released**` / `**Architect**` / `**Supersedes**` field labels, the `Status` value `Draft`, the `| # | Title | File | Description |` column headers and every filename stay English (`references/LANGUAGE_POLICY.md` §4).

5.5. Create `docs/CHANGELOG.md` with the initial entry. The title and preamble are authored in `doc_language` (registry: `references/LANGUAGE_POLICY.md` §5.7); the `## [1.0.0] - YYYY-MM-DD (Draft)` line and the `### Added` keyword stay English — they are Keep a Changelog spec terms. **The initial entry lists what was created — one line per section file and per component file, one line per ADR candidate — and nothing of the architecture's content**; the sections carry the content. An entry over 6 KB is reported by `scripts/docs-stats.js`.

   ```markdown
   # Architecture Changelog

   All notable changes to this architecture are documented here.
   Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
   This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

   ## [1.0.0] - YYYY-MM-DD (Draft)

   ### Added
   - Initial architecture: [brief summary from PO Spec / user input]
   - [N] systems, [M] components (see `docs/components/README.md`)
   - [K] Architecture Decision Records (see `adr/`)
   - Architecture type: [ENTERPRISE | BIAN | 3-Tier | N-Layer | Microservices | a pack's type]
   ```

   Spanish equivalent of the title and preamble:

   ```markdown
   # Changelog de Arquitectura

   Todos los cambios relevantes de esta arquitectura se documentan aquí.
   Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
   Este proyecto sigue [Versionado Semántico](https://semver.org/spec/v2.0.0.html).
   ```

6. Add the `<!-- ARCHITECTURE_TYPE: TYPE -->` metadata comment at the top of `docs/03-architecture-layers.md`

> **Note — Context Anchor on Subsequent Edits**: The dependency write order (S1+2 → S13 → S4 → S5 → S8 → S3 → S6 → S7 → S9 → S10 → S11 → docs/11) inherently satisfies the context anchor during initial documentation creation, since each section is written with prior sections fresh in context. However, the **Foundational Context Anchor Protocol MUST be followed for all subsequent edits** to any downstream section (S4–S11), as the original creation context will no longer be available.

**Include:**
- All template content from the type-specific templates, properly formatted
- Placeholder values in each file for the user to customize
- Breadcrumbs in all `docs/components/<system-name>/NN-name.md` files
- Cross-references as relative Markdown links (never bare `Section X.Y`)
- At least one `docs/components/NN-name.md` file per identified component
- `docs/components/README.md` with 5-column index matching all component files
- Each component file has: breadcrumb, `# Heading`, `**Type:**`, `**Technology:**` and `**Description:**` fields — the tagline opening with the H1 within 120 characters

Verify the last two mechanically rather than by eye — `bun [plugin_dir]/skills/architecture-component-guardian/utils/component-cli.ts check <project_root>` returns exit 0 when the index matches the files, every component carries its required fields and every tagline opens with its canonical name within 120 characters. Report any findings; drift means the component write went wrong, and a `description-*` finding is fixed at the line it names before Step 5.7.
