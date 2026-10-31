# Documentation Language Policy

**Status**: Normative. Owned by `sa-skills:architecture-docs`.
**Applies to**: every skill and agent in this plugin that writes a file into the user's project.

---

## 0. The rule in three sentences

Skill files, agent files, templates and every internal instruction in this plugin are written in
**English and stay English, permanently**. The **documents the plugin writes into the user's
project** are authored in the language the architect selected when the architecture was created.
A fixed machine layer — codes, status values, column headers, filenames, marker names — stays
English in every language so cross-skill parsing keeps working.

Supported values: `en` (English), `es` (Español). The registry is closed — see §6.

---

## 1. The marker

The selected language is recorded once, as an HTML comment at the top of `ARCHITECTURE.md`,
immediately after `ARCHITECTURE_RELEASED`:

```markdown
<!-- ARCHITECTURE_VERSION: 1.0.0 -->
<!-- ARCHITECTURE_STATUS: Draft -->
<!-- ARCHITECTURE_RELEASED: -->
<!-- DOC_LANGUAGE: es -->
```

A matching gate record goes into `docs/01-system-overview.md` alongside the other gate records:

```markdown
<!-- DOC_LANGUAGE_GATE: PASSED (es, YYYY-MM-DD) -->
```

`ARCHITECTURE.md` is the authoritative location. Nothing else may hold a competing value.

**Legacy alias**: `<!-- LANGUAGE: es -->` / `<!-- LANGUAGE: en -->` was the pre-v4.4.0 spelling
emitted by the `architecture-dev-handoff` convention. It is still **read** (see §3) but is never
**written** again. `DOC_LANGUAGE` is the canonical name because bare `LANGUAGE` collides with two
other live senses in this plugin — programming language (tech-stack tables) and the *SA Design
Language Standard* — and because it matches the `doc_language` payload field that already exists
in `PAYLOAD_SCHEMA.md`, the handoff skill's `utils/manifest.ts` and every handoff
agent.

---

## 2. Heading anchors

Every **structural** heading carries a trailing English anchor comment. Anchors are emitted in
**all languages, including `en`** — uniform emission means validators and gates have exactly one
code path and never branch on language, and it means English runs exercise the same path daily.

```markdown
## 1. Resumen Ejecutivo <!-- SECTION: Executive Summary -->
### 1. Separación de Responsabilidades <!-- PRINCIPLE: Separation of Concerns -->
**Descripción** <!-- LABEL: Description -->
## Catálogo de Fases <!-- SECTION: Phase Catalog -->
```

The English text inside the anchor is drawn from the registry in §5 and is itself part of the
machine layer — it is never translated, abbreviated or reworded.

| Anchor kind | Applies to |
|---|---|
| `SECTION:` | The 13 top-level architecture sections, and the Section 6 mode headings (`Phase Catalog`, `Flow Inventory`, `Use Case Resolutions`, `End-to-End Wire Sequences`) |
| `PRINCIPLE:` | The 9 (or 10) core architecture principles |
| `LABEL:` | Recurring subsection labels that gates read — see §5.3 |

**Not anchored** (because the visible text is itself machine-matched and stays English): the four
standard diagram headings, Mermaid content, and anything else in §4.

`tools/docgen/generate-doc.js` strips HTML comments from rendered body text, so anchors never
appear in a `.docx`.

---

## 3. Resolution protocol

Every skill that authors project files resolves the language with this exact procedure, stopping
at the first match:

1. **`<!-- DOC_LANGUAGE: xx -->` in `ARCHITECTURE.md`** → use it. **Stop.**
2. **Legacy `<!-- LANGUAGE: xx -->`** → use it, and silently rewrite it as `DOC_LANGUAGE` in
   place. **Stop.**
3. **No marker** → run the heading-inference heuristic (§5.5), display the inferred language,
   ask the user to confirm **once**, then stamp `DOC_LANGUAGE`. Never infer again for this
   project.
4. **No `ARCHITECTURE.md` at all** → the invoking skill's own creation gate asks
   (`architecture-docs` Workflow 1 Step 0.1).

The step-3 confirmation prompt (print it verbatim; wait for the answer before proceeding):

```
🌐 No documentation language recorded for this architecture.
   Inferred from existing headings: Español (es)

   Confirm? [1 = yes, keep es / 2 = no, use English (en)]
```

An unrecognised marker value is not an error — treat it as absent and fall through to step 3.

---

## 4. Do-NOT-localize registry (the machine layer)

These stay literal English in every language. Translating any of them breaks a parser, a gate or
a round-trip.

**Identifiers and codes**
- Compliance requirement code prefixes: `BC*`, `CLD*`, `DAI*`, `DEV*`, `ENT*`, `INT*`, `PLT*`, `PRC*`,
  `SEC*`, `SRE*` (and the retired 1.x codes `LA*`, which an older document may still carry).
- `ADR-NNN`, `TDR-NNN`, `UC1`/`UC2`… use-case ids, `C-01`…`C-19` conformance check ids.

**Code identifiers of the system being documented** — every name a developer types in code, written in a code
span: API paths and path parameters (`/v1/customers/{customerId}`), operation ids, request and response fields
(`deviceId`, `lastReplicationAt`), schema, message and event names, enum and status values (`enabled`), topics and
queues, tables and columns, cache key patterns and prefixes. The handoff assets copy each one verbatim from the docs and
their contract check fails a name the docs do not state, so the language of a generated contract is the language the
docs wrote these in. Under `es` the prose around them is Spanish; the identifier is not — "el campo `deviceId` del
alta", never `idDispositivo`. A data value the architecture defines as data (a product code such as `AHO`, a naming
pattern an ADR prescribes) keeps the form its ADR gives it. Checked by `scripts/shared/identifier-check.js` (a WARNING:
code finds the code spans and JSON keys, the judge decides which are Spanish).

**Enum values** (round-tripped by `manifest-generator.ts` and `field-updater.ts`)
- `Compliant` / `Non-Compliant` / `Not Applicable` / `Unknown`
- `Approved` / `In Review` / `Draft` / `Rejected`
- `Critical` / `High` / `Medium` / `Low`
- `Draft` / `Released` / `Deprecated`
- `Covered` / `Partial` / `Not Covered`
- The literal `Not documented` (matched by `Source Section.pattern` `^(\d+\.\d+|Not documented)$`)

**Table column headers**
- Compliance contracts, when an institution pack writes them: their table headers as its code writes them
- Document Control: `| Field | Value |` with fields `Document Owner`, `Last Review Date`,
  `Status`, `Validation Score`, `Approval Authority`
- The component index's fixed 5 columns: `#`, `Component`, `File`, `Type`, `Technology`
- Analysis reports: every table header as its spec spells it — `| # | Component | Failure
  Scenario | Impact | Current Mitigation |`, `| # | Component | Tier | Direct Consumers | … |`,
  `| # | Threat | Category | Severity | Status | Control / Gap |` — from
  `plugins/sa-analysis/skills/architecture-analysis/analyses/*.md`; the `#` finding-id column above all

Cell **contents** localize; the header row does not.

**Structure**
- All filenames and directory names — `docs/01-system-overview.md`, `ARCHITECTURE.md`,
  `SYSTEM_RUNTIME_VIEW.md`, `CROSS_CUTTING_STANDARDS.md`, `handoffs/components/NN-<slug>.md`, `COMPLIANCE_MANIFEST.md`,
  and the `handoffs/interfaces/<upstream>→<downstream>.md` Unicode arrow.
- Every HTML-comment marker **name and value** (`ARCHITECTURE_TYPE: ENTERPRISE`, `DIAGRAM_THEME: dark`,
  `PO_SPEC_GATE: SKIPPED`, `DOC_LANGUAGE: es`, …).
- Every `EXPLORER_HEADER` **field key** — `key_concepts`, `technologies`, `scope`, `components`,
  `component_self`, `component_type`, `related_adrs`. The **values** localize.
- The document title `# Component Details` in `docs/components/README.md` (guardian-owned).
- `COMPLIANCE_MANIFEST.md` in its entirety — it is a machine index, not a reader-facing document.
- Keep a Changelog section keywords: `Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`,
  `Security`.

**Records (`adr/`, `tdr/`)** — the structure is English in every language, with no anchor comment;
only prose translates (§7 says which).
- ADR section headings as `adr/ADR-000-template.md` writes them: `Context`, `Problem Statement`,
  `Requirements`, `Business Drivers`, `Decision`, `Summary`, `Detailed Decision`, `Scope`,
  `Rationale`, `Primary Drivers`, `Comparison Summary`, `Consequences`, `Positive Consequences`,
  `Negative Consequences`, `Trade-offs`, `Alternatives Considered`, `Implementation Plan`, `Phases`,
  `Dependencies`, `Risks`, `Success Metrics`, `References`, `Review History`, `Notes`, and the inline
  labels `**Severity**`, `**Mitigation**`.
- TDR section headings: `Status`, `Description`, `Impact`, `Possible Solutions`, `Capability`,
  `Owner`, `History`; the labels `**Initiative**`, `**Driver**`, `**Technical**`,
  `**Business (P&L)**`; the Capability table header `| Level | Name | Code / BIAN id |` and its level
  names `Business Area`, `Business Domain`, `Service Domain`.
- Checked by code, one vocabulary (`scripts/shared/record-structure.js`): a localized heading, label, table
  header row or Capability level name, or an anchor comment on a heading, is reported with the English form —
  `S-STRUCT-01` for a project ADR (`prose-check.js --scope records`), `structure-localized` for a TDR (`tdr-check.js`).
  WARNING, BLOCKING once `PROSE_STYLE: v1` is stamped.
- Exception: an imported institutional ADR (001–100) keeps the headings its catalog edition ships
  (a Spanish edition carries `## Decisión <!-- SECTION: Decision -->`); it is a copy, never
  hand-edited, and `catalog-diff.ts` reads either form.

**Diagrams**
- The four standard diagram headings, verbatim including the em dashes:
  `#### Diagram: Logical View`, `#### Diagram: C4 Level 1 — System Context`,
  `#### Diagram: C4 Level 2 — Container`, `#### Diagram: Detailed View`.
  Their container heading `## Architecture Diagrams` **is** anchored and localizes.
  Sequence-diagram *flow names* localize; these four headings do not.
- All Mermaid keywords, and the four fixed `classDef` role names `zone` / `unit` / `store` /
  `ext`.

**SA Design Language Standard**
Everything the standard governs stays English in every edition, by the standard's own design —
Diagram ID segments, the 8 `DOM` and 43 `CAP` codes, every BIAN Business Area / Business Domain /
Service Domain name and BIAN id, the 15 Action Types, tag-group names **and their
values**, export profile names, CI class and table names, BIAN capability names.
`[design_language_dir]/llms-HOWTO.md` §"Language" is explicit that a Spanish agent translating
`Data Classification` to `Clasificación de datos` as a tag value is **wrong**.

> **Do not bundle the Spanish mirror.** The standard ships an `es/` mirror upstream; the
> "one language per agent" rule in `[design_language_dir]/README.md` forbids adding it
> alongside the English edition. A Spanish authoring run still loads the English
> `llms-rules.txt`. That is correct and is not a bug to fix — the standard's vocabularies are
> English in both editions anyway.

---

## 5. The EN ↔ ES registry

### 5.1 The 13 architecture sections

| # | Anchor (English — never translated) | `en` visible | `es` visible |
|---|---|---|---|
| 1 | `Executive Summary` | Executive Summary | Resumen Ejecutivo |
| 2 | `System Overview` | System Overview | Descripción del Sistema |
| 3 | `Architecture Principles` | Architecture Principles | Principios de Arquitectura |
| 4 | `Architecture Layers` | Architecture Layers | Capas de Arquitectura |
| 5 | `Component Details` | Component Details | Detalle de Componentes |
| 6 | `Data Flow Patterns` | Data Flow Patterns | Patrones de Flujo de Datos |
| 7 | `Integration Points` | Integration Points | Puntos de Integración |
| 8 | `Technology Stack` | Technology Stack | Stack Tecnológico |
| 9 | `Security Architecture` | Security Architecture | Arquitectura de Seguridad |
| 10 | `Scalability & Performance` | Scalability & Performance | Escalabilidad y Rendimiento |
| 11 | `Operational Considerations` | Operational Considerations | Consideraciones Operativas |
| 12 | `Architecture Decision Records (ADRs)` | Architecture Decision Records (ADRs) | Registros de Decisiones de Arquitectura (ADRs) |
| 13 | `Risks and Technical Debt` | Risks and Technical Debt | Riesgos y Deuda Técnica |

Header format, both languages:

```markdown
## [NUMBER]. [LOCALIZED NAME] <!-- SECTION: [English Name] -->
```

### 5.2 The 9 core principles

| # | Anchor (English) | `es` visible |
|---|---|---|
| 1 | `Separation of Concerns` | Separación de Responsabilidades |
| 2 | `High Availability` | Alta Disponibilidad |
| 3 | `Scalability First` | Escalabilidad Primero |
| 4 | `Security by Design` | Seguridad por Diseño |
| 5 | `Observability` | Observabilidad |
| 6 | `Resilience` | Resiliencia |
| 7 | `Simplicity` | Simplicidad |
| 8 | `Cloud-Native` | Nativo en la Nube |
| 9 | `Open Standards` | Estándares Abiertos |
| 10 (optional) | `Decouple Through Events` | Desacoplamiento mediante Eventos |

Document header: `## Architecture Principles (9 Core Principles)` →
`## Principios de Arquitectura (9 Principios Fundamentales)`, anchored
`<!-- SECTION: Architecture Principles -->`.

### 5.3 Recurring labels (`LABEL:` anchors)

| Anchor (English) | `es` visible |
|---|---|
| `Description` | Descripción |
| `Implementation` | Implementación |
| `Trade-offs` | Compensaciones |
| `Purpose` | Propósito |
| `Components` | Componentes |
| `Technologies` | Tecnologías |
| `Key Responsibilities` | Responsabilidades Clave |
| `Communication Patterns` | Patrones de Comunicación |
| `Non-Functional Requirements` | Requisitos No Funcionales |
| `Capacity` | Capacidad |
| `Demand by Use Case` | Demanda por Caso de Uso |
| `Delivery Increments` | Incrementos de Entrega |
| `Inbound` | Entrante |
| `Outbound` | Saliente |
| `Protocols` | Protocolos |
| `Key Metrics` | Métricas Clave |
| `Problem Statement` | Planteamiento del Problema |
| `Business Value` | Valor de Negocio |
| `Solution` | Solución |
| `Risks` | Riesgos |
| `Technical Debt` | Deuda Técnica |
| `Conventions` | Convenciones |

### 5.4 Section 6 mode headings

Mode detection greps the **anchor**, never the visible text.

| Anchor (English) | `es` visible |
|---|---|
| `Phase Catalog` | Catálogo de Fases |
| `Flow Inventory` | Inventario de Flujos |
| `Use Case Resolutions` | Resolución de Casos de Uso |
| `End-to-End Wire Sequences` | Secuencias Extremo a Extremo |

H4 forms: `#### Phase [N] — …` → `#### Fase [N] — …`,
`#### Flow [N] — …` → `#### Flujo [N] — …`. The H3 single-flow form
`### [Flow Name] Flow` → `### Flujo [Nombre]`. All three carry `SECTION:` anchors on their
parent H2 only; the H4/H3 forms are counted structurally, not by name.

### 5.5 Heading-inference heuristic (fallback only — protocol step 3)

Scan the first 30 lines of `docs/01-system-overview.md`, or `ARCHITECTURE.md` if that file is
absent.

- **English indicators**: `Executive Summary`, `System Overview`, `Problem Statement`,
  `Business Value`, `Architecture Principles`, `Key Metrics`, `Solution`
- **Spanish indicators**: `Resumen Ejecutivo`, `Descripción del Sistema`,
  `Planteamiento del Problema`, `Valor de Negocio`, `Principios de Arquitectura`,
  `Métricas Clave`, `Solución`

3 or more hits in one language decides it. Fewer than 3 in either → ambiguous; present `en` as
the inferred default in the §3 confirmation prompt.

This is the single home for these keyword lists. An institution pack's skills and
`skills/architecture-explorer-headers/utils/explorer.ts` reference this section rather than carrying their own
copies, so detection and authoring cannot drift apart.

### 5.6 Gap markers and placeholders

| `en` | `es` |
|---|---|
| `[NOT DOCUMENTED — add to <file>]` | `[NO DOCUMENTADO — agregar a <file>]` |
| `[To be defined]` | `[Por definir]` |
| `[TBD]` | `[Pendiente]` |

The Placeholder Elimination Gate greps for both sets. Placeholder tokens matched by the gate:
`to be defined`, `tbd`, `placeholder`, `fixme`, `your …`, `describe …`, `por definir`,
`pendiente`, `marcador`, `describa …`, `su …`, plus `<TODO>`, `TODO:` and `XXX` in any language.

### 5.7 `docs/CHANGELOG.md` preamble

```markdown
# Architecture Changelog                      →  # Changelog de Arquitectura

All notable changes to this architecture are documented here.
→ Todos los cambios relevantes de esta arquitectura se documentan aquí.

Format based on [Keep a Changelog](…).
→ Formato basado en [Keep a Changelog](…).

This project adheres to [Semantic Versioning](…).
→ Este proyecto sigue [Versionado Semántico](…).
```

The `## [1.0.0] - YYYY-MM-DD (Draft)` line and the `### Added` / `### Changed` / `### Fixed`
keywords stay English — they are Keep a Changelog spec terms (§4).

---

### 5.8 `es` means LATAM-neutral Spanish

There is one Spanish in this registry and it is **Latin American neutral** — the shared register
understood across the region, not Peninsular Spanish and not any single country's variety. A
deliverable for a Latin American organization that reads as Madrid or as Mexico City reads as foreign
everywhere else in the region.

**Concretely**: `ustedes`, never `vosotros`. No voseo (`vos tenés`) and no Peninsular `os`/`-áis`
forms. Regionally neutral vocabulary — `computadora` not `ordenador`, `celular` not `móvil`,
`enlace` not `vínculo`, `correo` not `mail`. Standard technical register, no colloquialism from
any one country. Where two neutral options exist, prefer the one a reader in another LATAM country
would not stumble on.

**Dates**: `es-419`, the BCP-47 region code for Latin America. `tools/docgen/generate-doc.js`
sets `dateLocale: 'es-419'`; it was `es-ES` through v5.0.0, which formatted stakeholder deliverables
in the Peninsular convention. Verified that `Intl` resolves `es-419` exactly rather than falling
back.

**Aliases**: callers type region codes. `generate-doc.js` folds `es-419`, `es-la`, `es-latam`,
`es-mx`, `es-co`, `es-ar`, `es-cl`, `es-pe`, `es-ec` and `es-es` onto `es`, and `en-us` / `en-gb`
onto `en`. The registry itself stays two values — aliases are an input convenience, never a third
language.

---

### 5.9 Export language — rendering a document in a language it was not authored in

Everything above governs the language a project's documents are **authored** in. Exports are
different: a deliverable often has to reach an audience that does not read the authoring language.
An architecture written in Spanish still needs an English briefing for a regional stakeholder.

**Two modes, and the distinction is load-bearing.**

| Mode | When | Body |
|---|---|---|
| **Native** (default) | Export language == `doc_language` | Verbatim. Untouched. The fidelity rule applies unchanged |
| **Translation** | Export language != `doc_language` | Rendered into the target language under the contract below |

Native mode is the default everywhere and must stay the default. Translation is opt-in per export.

**The translation contract** — a translation is a *rendering*, never an edit:

1. **Structure is preserved exactly.** Same sections, same order, same tables, same rows, same
   number of rows. Never merge, split, reorder, summarize or omit. A translated table has the same
   shape as its source.
2. **The machine layer is preserved literally** — everything in §4, plus the export-specific
   additions in §5.10 below. When in doubt, leave it in English.
3. **Nothing is added.** No translator's notes, no clarifications, no expansion of an acronym the
   source left unexpanded.
4. **Meaning is preserved over fluency.** Where a faithful rendering is awkward, keep the meaning
   and accept the awkwardness. A smooth sentence that shifts a commitment is a defect; an
   ungainly one that holds it is not.
5. **The document says it is a translation.** `generate-doc.js --translated-from <lang>` stamps a
   `Translation` row on the cover naming the source language and stating that the source-language
   document remains authoritative. A translated deliverable that does not say so invites a reader
   to cite a rendering as the record.
6. **The filename carries the target language** — `SA-<slug>-en.docx`, never overwriting the
   native `SA-<slug>.docx`. Both can exist; only one is authoritative.

**Translation never runs against the source `.md` files.** It renders into the export only. The
project's documents stay in `doc_language`, `DOC_LANGUAGE` never changes, and no downstream gate
sees translated content. An export is a leaf.

---

### 5.10 Do-NOT-translate registry (exports)

Additional to §4, which applies in full. These are the values a translator's instinct will reach
for and must not.

| Category | Rule |
|---|---|
| **Canonical component names** | Never. `shp-bs-gift-cards-and-bundles` stays exactly that — the Component Naming Fidelity rule binds translated output identically |
| **Technology and product names** | Never. `PostgreSQL`, `Kafka`, `Spring Boot`, `Kubernetes` — including version strings |
| **Numbers, units, metrics** | The value never changes; the separators follow the export language — a number is written as a reader of that language reads it. `es` groups thousands with `.` and marks decimals with `,` (`4.000.000`, `0,1 %`); `en` groups with `,` and marks decimals with `.` (`4,000,000`, `0.1%`). Left in the source convention, `4.000.000` reads as four in English. Units and metric names (`TPS`, `p99`, `ms`) never translate. What is not a quantity keeps its dots: version strings (`7.1.0`), section numbers (`§ 11.3`), identifiers, and any number inside a code span or a quoted evidence string. `translation-check.js` compares values, so a number left in the source convention fails it |
| **Compliance `Code` / `Category` / `Status` cells** | Never. `validators.ts` matches these with `case_sensitive: true`, and a reader must be able to line the export up against the register |
| **Traceability status values** | Never. `Covered`, `Partial`, `Not Covered` |
| **Quoted evidence strings** | Never. A traceability or compliance row quoting source text is citing it; translate the citation and it stops being evidence. Leave the quote, translate the surrounding prose |
| **ADR / TDR identifiers** | Never. `ADR-001` stays; the ADR's *title prose* translates |
| **Filenames, paths, anchors, markers** | Never — §4 already covers this and it holds in exports |
| **Design Language Standard vocabulary** | Never, including tag **values**. The standard's own one-language rule makes `Data Classification` wrong as `Clasificación de datos` |

---

## 6. Adding a language

The value set is a closed registry, not a free-text field. To add one:

1. Add a visible-text column to every table in §5.
2. Add the indicator keyword list to §5.5.
3. Add the option to the `architecture-docs` Workflow 1 Step 0.1 prompt.
4. Add the label set to `tools/docgen/generate-doc.js` `LABELS`, and verify the matching
   `toLocaleDateString` locale resolves on the target runtime (full-ICU required).
5. Add the `UI_STRINGS` entry to `architecture-command-center/VIEWER_TEMPLATE.html`.

Nothing in §4 changes — a new language adds visible text only.

---

## 7. Consumers

| Skill / agent | Role |
|---|---|
| `architecture-docs` | **Owner.** Asks at Workflow 1 Step 0.1, writes the marker, authors `ARCHITECTURE.md` + `docs/**` with anchors |
| `architecture-readiness` | Stamps `DOC_LANGUAGE` into `PRODUCT_OWNER_SPEC.md` so Step 0.1 can pre-select |
| `architecture-component-guardian` | Localizes component prose; index columns and `# Component Details` stay English |
| `architecture-definition-record` / `technical-debt-records` | Localize the prose: the H1 title after `ADR-NNN:` / `TDR-NNN:`, the text under each heading, table **cells** that are prose, and each Review History / History note. Structure stays English (§4 *Records*): headings, labels, table headers, level names, ids, `Status` values, frontmatter keys and values |
| `architecture-analysis` | Localizes report and viz visible strings; classification codes stay English |
| `architecture-traceability` | Localizes prose; coverage status values stay English |
| `architecture-capability-alignment` | Localizes prose; domain/capability names and `DOM`/`CAP` codes stay English |
| `architecture-dev-handoff` | Marker is authoritative; the 4 kit templates localize via anchors; row labels come from the handoff skill's closed EN↔ES row-label list (technical terms kept English, registered as themselves), held by its kit check |
| A compliance skill an institution pack ships | Localizes narrative and section titles; the whole machine layer in §4 stays English |
| `architecture-command-center` | Viewer chrome via `UI_STRINGS` (`en` / `es`, selected by `--lang`); scene notes, phase and use-case text authored in `doc_language`; node ids, component names, ADR and `UC-nn` ids stay as the docs write them |
| an institution pack's template skills | Use §3 instead of their own detection; select `*_EN` / `*_ES` templates |
| `architecture-docs-export` | Passes `--lang` to docgen |
| `architecture-explorer-headers` | No change — field keys English, values localize |
| Every agent under `agents/**` | Carry the `## Documentation Language` block and honour the `doc_language` input; `coverage-renderer` writes the target edition's language and quotes only that edition's ADR |
