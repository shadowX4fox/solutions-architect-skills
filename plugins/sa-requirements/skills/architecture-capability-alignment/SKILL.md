---
name: architecture-capability-alignment
description: Map a Product Owner Specification onto the capability framework the project declares — BIAN Service Landscape v14.0.0 as published for banking (8 Business Areas, 43 Business Domains, 341 Service Domains), the Turbo EA cross-industry capability map (9 Domains, 41 Capability Groups, 223 Capabilities), or a framework an institution pack provides. Produces BIAN_ALIGNMENT.md (BIAN: Service Domains realized, published semantic APIs, DOM/CAP Diagram ID segments) or CAPABILITY_ALIGNMENT.md (any other framework). Gate before architecture-docs Workflow 1 (new ARCHITECTURE.md creation) when a framework is declared.
triggers:
  - enterprise alignment
  - enterprise architecture alignment
  - align with enterprise
  - align with enterprise architecture
  - enterprise domain mapping
  - load enterprise context
  - map to enterprise domains
  - enterprise architecture context
  - check enterprise alignment
  - BIAN alignment
  - map to BIAN
  - BIAN service domain mapping
  - capability alignment
  - align to a capability framework
  - cross-industry capability map
---

# Architecture Capability Alignment Skill (BIAN and other frameworks)

## Purpose

This skill maps a **Product Owner Specification** (Phase 1 artifact) onto the **capability framework** the project declares (§ Frameworks) to produce the framework's report at the project root. The rest of this file describes BIAN, the default; another framework follows the same steps with its own corpus and level names.

The report identifies — **before** the architecture team begins design — which banking capabilities the initiative touches, at all three BIAN levels, and which published BIAN semantic APIs are therefore in scope.

It answers: *"Which parts of the banking capability model does this initiative realize, and what has the industry already specified for them?"*

**Output**: `BIAN_ALIGNMENT.md` at the project root — a single markdown file for tickets, emails, Architecture Review Boards, and stakeholder kickoffs.

**Gate**: `architecture-docs` Workflow 1 (Step 0.3, Capability Alignment Gate) BLOCKS new ARCHITECTURE.md creation until the declared framework's report exists. A project that declares `none` is not gated.

### Frameworks

`bun [plugin_dir]/scripts/shared/frameworks.js --project <root>` lists them; `--declare <id|none> --project <root>` writes the choice to `.sa-skills/project.json`.

| Framework | Corpus | Report |
|---|---|---|
| `BIAN` (banking) | BIAN Service Landscape v14.0.0 — Business Areas › Business Domains › Service Domains | `BIAN_ALIGNMENT.md` (v3.0) |
| `CROSS-INDUSTRY` | Turbo EA Capabilities — 9 Domains › 41 Capability Groups › 223 Capabilities, CC BY 4.0 (`references/cross-industry/`, with NOTICE and LICENSE-TURBO-EA; rebuilt by `scripts/build-turbo-ea-corpus.js` from a Turbo EA checkout) | `CAPABILITY_ALIGNMENT.md` |
| a pack's | `provides.frameworks` of an institution pack, which may also set `defaults.framework` | `CAPABILITY_ALIGNMENT.md` |

`--framework <id>` selects one (default: the project's declared framework, else BIAN). Another framework's report carries `<!-- ALIGNMENT_FRAMEWORK: <id> -->` and `<!-- ALIGNMENT_VERSION: 1.0 -->`, the title `# Capability Alignment` and the framework's own level names. **BIAN only**: Diagram ID Segments (they need an institution pack's design language) and API Surface (BIAN's published semantic APIs).

### Pure BIAN, unadapted

The capability model is **BIAN as published**. Nothing is renamed, merged, added or dropped, and no institutional overlay is applied.

The report emits no governance rules, cross-cutting findings or owner engagement plan, because BIAN publishes none; there is no project-local override path.

What it emits: a third classification level (Service Domain), BIAN's own published role definition behind every claim, an **API Surface** table of the semantic specifications already published for the impacted Service Domains, and `DOM`/`CAP` codes that are real closed-registry values rather than a local invention.

---

## When to Invoke This Skill

- User asks to "align with enterprise architecture", "map to enterprise domains", "map to BIAN", or "load enterprise context"
- User asks to "check enterprise alignment", "run enterprise domain mapping", "capability alignment" or to align to a capability framework or the cross-industry capability map
- User has just accepted the PO Spec and needs to proceed to architecture design
- `architecture-docs` Workflow 1 Step 0.3 directs the user here because the declared framework's report (`BIAN_ALIGNMENT.md` or `CAPABILITY_ALIGNMENT.md`) is missing
- User uses `/skill architecture-capability-alignment`

**Do NOT invoke for:**
- Creating or editing the PO Spec → use `architecture-readiness` skill
- Creating or editing ARCHITECTURE.md → use `architecture-docs` skill
- PO Spec coverage analysis → use `architecture-traceability` skill
- Compliance contracts → use `architecture-compliance` skill

---

## Plugin directories

This skill ships in the **sa-requirements** plugin, with the PO Spec it reads (`sa-skills` depends on it and installs
it). `[plugin_dir]` is its install: `bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts --plugin sa-requirements`.
`[sa_skills_dir]` is sa-skills' (the same command without `--plugin`). `[bian_landscape_dir]` is the BIAN Service Landscape in force — `bun [sa_skills_dir]/scripts/shared/packs.js --path bian-landscape` (an institution pack's, else the copy the base carries); without sa-skills, `[plugin_dir]/references/bian-v14`. `[design_language_dir]` is the Design Language Standard in force — `bun [sa_skills_dir]/scripts/shared/packs.js --path design-language` prints it (an institution pack's — the base carries none) or prints nothing and exits 1: **fallback mode**. Two pieces of this workflow are sa-skills': the
judge (`scripts/judge.js`) that decides every claim, and the Design Language Standard's `bian-registry.json` (the
`DOM` / `CAP` codes). `capability-prepare.js` finds sa-skills itself (`--sa-skills`, `SA_SKILLS_DIR`, the install registry).
Without it the report is still written — every claim undecided, nothing ranked in its place, and it says no judge was
available — and carries no Diagram ID Segments.

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — entry point and workflow |
| `BIAN_ALIGNMENT_TEMPLATE.md` | Output template (BIAN's report shape; another framework uses the same sections with its own level names, without Diagram ID Segments and API Surface) — Summary, Diagram ID Segments, per-Area analysis (8 sub-sections), API Surface, Next Steps |
| `ANALYSIS_METHODOLOGY.md` | How to extract business capabilities from the PO Spec and classify at each of the three BIAN levels — the "What vs. How" rule, altitude judgement, evidence citation |
| `[bian_landscape_dir]/` | The bundled BIAN Service Landscape v14.0.0, byte-for-byte as published. `llms-bian.txt` is the index and the default load; the 8 area files are read on demand, one at a time. See its `README.md` for the load contract. |

---

## Workflow

### Step 1 — Locate PO Spec File

Search for the Product Owner Specification:

```
Search order:
1. PRODUCT_OWNER_SPEC.md at project root
2. PO_SPEC.md at project root
3. Glob **/PRODUCT_OWNER_SPEC.md, **/PO_SPEC.md
4. Glob **/po-spec*, **/product-owner*
5. Ask user for path
```

If no PO Spec found, abort with: *"No Product Owner Specification found. Use `/sa-requirements:architecture-readiness` to create one first — enterprise alignment requires accepted business context."*

If multiple matches, list them and ask the user to select one.

---

### Step 2 — Load the BIAN Index

Read `[bian_landscape_dir]/llms-bian.txt` — 431 lines carrying every Business Area, every Business Domain with its complete Service Domain list, and every Service Domain with its path, BIAN id and API specification URL.

There is **no model-resolution step and no override path**. The corpus is bundled, always present, and identical for every project. If `llms-bian.txt` is missing the plugin install is corrupted: abort with *"Bundled BIAN corpus missing from plugin. Reinstall sa-requirements."*

**Do not read the area files yet.** They are opened in Step 6, only for Business Areas already classified 🟢 or 🟡. Reading all eight is a defect — see `[bian_landscape_dir]/README.md` § Load contract.

**Step 2.2 — The shortlist by code (2026-09-21).** After Step 3 has produced the capability list, save it as
`.cache/sa-skills/bian/brief.json` — `{ problem, objectives, use_cases: [{ id, name, description, actors }], regulatory_and_integration_constraints, out_of_scope }`, **written in English whatever `doc_language` is** (it is an internal artifact, never delivered; the report keeps `doc_language` and quotes BIAN verbatim as before) — and run

```bash
bun [plugin_dir]/skills/architecture-capability-alignment/scripts/capability-prepare.js <project_root> --brief .cache/sa-skills/bian/brief.json [--judge agent|typesafe|clef] [--framework BIAN|CROSS-INDUSTRY|<pack id>] --out .cache/sa-skills/bian/BIAN_ALIGNMENT.draft.md [--verify BIAN_ALIGNMENT.md]
```

It parses the whole corpus by code (341 definitions — code reads all eight files; the load contract binds the model, not the script), and asks sa-skills' judge (`scripts/judge.js`) one yes/no per (use case, Service Domain) pair, the objectives and the constraints as two more units — 3 410 questions on the reference, 6–22 s on Jev, cached — then a realizes / consumes Choice for every claimed Service Domain, and derives the Business Domain and Business Area statuses from the registry bottom-up. **What it is good for is the shortlist, not the verdict.** Measured with `--verify` against the reviewed `BIAN_ALIGNMENT.md` of the reference (7 Service Domains claimed):

| Brief | cut 0.5: candidates · gold reached · precision | top three pairs |
|---|---|---|
| cut from the Spanish spec by code | 29 of 341 · 5 of 7 · 0.17 | Channel Activity History · Customer Product and Service Directory · Session Dialogue |
| the Step 3 list, in English | 12 of 341 · 5 of 7 · 0.42 | Party Authentication 0.82 · Customer Access Entitlement 0.74 · Customer Workbench 0.73 |

The script reads the brief's language from its function words and, under a judge, prints a warning when it is not English — the spec-cut brief of a Spanish project always is, so `--brief` is the rule there, not an option. Jev's primary language is English (docs.typesafe.ai § State), and BIAN's definitions are English: with both sides in English the gold's three Channels findings become the top three pairs and the shortlist is a 28× narrower read for Step 6. The two gold domains never reached (Regulatory Compliance from the retention obligation, Payee Management from the contact list) are the session's synthesis, which is what Steps 4–6 keep: open the area files the candidates point at, apply the claim test against each definition, write the report. A pair the judge scored ≥ 0.75 is a claim to confirm, not to repeat. Without `--brief` the script cuts a brief from the spec in the spec's language, and a pair or role the judge has not answered (the agent worksheet pending, no sa-skills) is **undecided** — never a claim, never a dismissal — counted under § Undecided with the worksheet to answer before re-running; the draft says which.

**Step 2.1 — Detect the Design Language Standard**

Test for `[design_language_dir]/bian-registry.json` (optional — the Design Language Standard ships with sa-skills' `architecture-docs`).

- **Present** → set `codes_available = true`. Read it (762 lines of JSON). It is the closed crosswalk: Business Area → `DOM`, Business Domain → `CAP` + BIAN id. The report gains its **Diagram ID Segments** section.
- **Absent** → set `codes_available = false`. Produce the report without that section and without `DOM`/`CAP` columns. Say so in the report header. **Never mint a code from a name.**

The registry is the standard's only addition to BIAN. Everything else in the report comes from the BIAN corpus and does not depend on the standard being installed.

---

### Step 3 — Extract Business Capabilities from PO Spec

Read the PO Spec and extract business-capability evidence from these sections (matching the structure in `plugins/sa-requirements/skills/architecture-readiness/templates/PO_SPEC_TEMPLATE.md`):

| PO Spec Section | What to extract | Feeds which Business Areas |
|-----------------|-----------------|---------------------------|
| § 1 Business Context | Problem statement, target market, strategic alignment, timing | Customers, Business Management |
| § 2 Stakeholders & Users | User personas (employees vs customers vs prospects), stakeholder roles | Customers, Resource Management (if employees are users) |
| § 3 Business Objectives | Goals, KPIs, monetary impact, customer impact | Products, Customers, Finance And Risk Management |
| § 4 Use Cases | Actors, primary/alternative flows, edge cases | All 8 (most evidence-rich section) |
| § 5 User Stories | Acceptance criteria, role-based capabilities | Customers, Channels |
| § 6 UX Requirements | Channels mentioned, performance, accessibility | Channels |
| § 7 Business Constraints | Regulatory, integration, budget, operational | Finance And Risk Management, Operations, Resource Management |
| § 8 Success Metrics | Adoption, KPIs, leading/lagging indicators | Business Development, Business Management |

**Extraction filter — "What vs. How"**: When the PO Spec mentions specific technologies, vendors, or implementation paths (e.g., "integrate with the interbank settlement network via SOAP"), record the **business capability** ("inter-bank payment settlement") not the implementation. The "how" belongs to the architecture team; the alignment maps "what" against the banking capability model.

Produce a structured capability list:

```yaml
capabilities:
  - text: "<short business-capability statement>"
    source: "§ <section number> — <heading>"
    evidence_quote: "<verbatim excerpt, max 200 chars>"
    actors: ["<actor>", ...]      # if mentioned
    channels: ["<channel>", ...]  # if mentioned
    money_flow: true|false        # does it move money?
    data_touched: ["<entity>", ...] # customer, product, transaction, etc.
```

Capabilities are the unit of analysis for Steps 4–6.

---

### Step 4 — Classify at Business Area Level (8)

For each of the 8 BIAN Business Areas — Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, Business Development — assign a status:

- **🟢 Impacted** — At least one PO Spec capability falls squarely inside this Business Area. The initiative realizes capability here.
- **🟡 Partial** — The initiative touches the edges of this area (e.g., consumes a Service Domain from it) but does not realize capability inside it.
- **⚪ Not Applicable** — No PO Spec capability touches this area.

Capture a one-sentence **rationale** per area. This is the coarse pass; it decides which area files Step 6 opens.

---

### Step 5 — Classify at Business Domain Level (43)

For every 🟢 / 🟡 Business Area, classify each of its Business Domains using the same 🟢 / 🟡 / ⚪ taxonomy, taking the complete list from `llms-bian.txt` § Business Domains.

Per impacted Business Domain, capture: **status**, **one-line rationale**, **PO Spec § citation**. Close each area's block with `(not impacted: <comma-separated remaining Business Domain names>)` so the reader can verify the classifier scanned the full area.

**This level yields the `CAP` code.** A Business Domain is the unit that carries a Diagram ID's `CAP` segment and names its diagram folder.

⚪ Business Areas produce `_None._` and are not decomposed.

---

### Step 6 — Classify at Service Domain Level (341)

For each 🟢 / 🟡 Business Domain, identify the Service Domains the initiative realizes or consumes.

**Read the area file now** — `[bian_landscape_dir]/BIAN-v14-N-<area>.md` — **one at a time, only for 🟢 / 🟡 areas.** Never read all eight.

Per impacted Service Domain, capture:

1. **Name** — exactly as BIAN gives it
2. **BIAN id** — from the file's `**BIAN id:**` line
3. **Role definition** — BIAN's `**What it does.**` paragraph, **quoted verbatim**
4. **Realizes | Consumes** — does the initiative build this capability, or call it?
5. **PO Spec § citation** — the evidence
6. **API** — the specification URL where one is published

**The claim test**: a Service Domain is claimed only when the PO Spec's evidence matches BIAN's **published role definition** — not merely its name. `Customer Case` is about case handling, not about any capability with the word "customer" in it. When the evidence does not settle it, mark the Service Domain ⚪ and say so. See `ANALYSIS_METHODOLOGY.md` § BIAN Altitude Judgement.

---

### Step 7 — Resolve Diagram ID Segments

Skip entirely when `codes_available` is false.

For each 🟢 / 🟡 **Business Domain**, look up in `bian-registry.json`:

- its Business Area's `dom` (3 letters)
- its own `cap` (4 letters) and `bian_id`

**Every value is looked up, never composed.** A `CAP` is four letters and a `DOM` is three — that length difference is what keeps the two registries structurally separate (RFC-029), so a three-letter `CAP` is always an error. Within `CAP`, no two codes differ in a single position.

Service Domains do **not** appear here. They are a tag and a register column, never an ID segment (`llms-rules.txt` §1.3).

`LSC`, `SUBJ` and `NNN` are **assigned by the diagram register, never chosen here** — `SUBJ` is minted only when the CMDB business-application record is created. This block supplies the two segments the alignment can determine, and nothing more.

When a needed value is not in the registry, write that it requires a vocabulary extension through the Architecture Governance Board (AGB) and stop. Never guess.

---

### Step 8 — Generate `BIAN_ALIGNMENT.md`

Load `BIAN_ALIGNMENT_TEMPLATE.md` and fill it. Sections, in order:

1. **Header** — PO Spec filename, BIAN release, generation date, plugin version, and the marker block
2. **Summary** — 8 rows, one per Business Area
3. **Diagram ID Segments** — one row per 🟢 / 🟡 Business Domain (omit the whole section when `codes_available` is false)
4. **Per-Area Analysis** — 8 sub-sections
5. **API Surface** — every 🟢 Service Domain carrying a published semantic API, plus a named list of those without one
6. **Next Steps**

Header marker block:

```markdown
<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->
<!-- BIAN_RELEASE: 14.0.0 -->
<!-- BIAN_SOURCE: bundled (sa-requirements v{plugin-version}) -->
<!-- DESIGN_LANGUAGE_CODES: [present | absent] -->
<!-- PO_SPEC_SOURCE: [filename] -->
<!-- GENERATED: YYYY-MM-DD -->
```

Write to `BIAN_ALIGNMENT.md` at the project root — the filename and location the Step 0.3 gate globs for. Regenerated fresh on each run (not date-stamped). If the user wants history, they archive previous versions in `archive/` themselves.

---

### Step 9 — Report to User

```
✅ BIAN Alignment generated.

PO Spec:               [filename]
BIAN release:          14.0.0 (bundled, as published)
Business Areas:        N of 8 impacted (🟢 N · 🟡 N · ⚪ N)
Business Domains:      M of 43
Service Domains:       K of 341
Published APIs:        P of K impacted Service Domains
Diagram ID segments:   [N Business Domains resolved | not emitted — design-language folder absent]

Report: BIAN_ALIGNMENT.md

Next step:
  Run /sa-skills:architecture-docs to begin architecture design.
  Workflow 1 Step 0.3 (Capability Alignment Gate) will now pass.
```

---

## No Invention

Every name, BIAN id, role definition, example of use and API URL in the report is **quoted from the bundled BIAN corpus**. Every `DOM` and `CAP` code is **looked up in `bian-registry.json`**.

- Do not paraphrase a BIAN role definition. Quote it.
- Do not correct BIAN's spelling. `Intelectual Property And Knowledge` is spelled that way upstream; reproduce it.
- Do not claim a Service Domain because its name is suggestive. Match the evidence against the published role definition.
- Do not mint a `DOM` or `CAP` from a name. Both registries are closed; a plausible invented code is a conformance failure that a nightly check raises against a named author.
- When the PO Spec does not settle a classification, mark it ⚪ and say why. A partial answer that names its gap is correct; a confident complete answer filled from inference is a defect.

This is the same discipline as the plugin's **Asset Fidelity Rule** and **Component Naming Fidelity** rule: values come from a named source, never from the model's memory.

---

## Integration with Other Skills

| Skill | Relationship |
|-------|-------------|
| `architecture-readiness` | **Prerequisite**: PO Spec must exist. If missing, redirect to that skill. |
| `architecture-docs` | **Consumer**: Workflow 1 Step 0.3 BLOCKS until the declared framework's report exists, and only when a framework is declared. Embeds `<!-- BIAN_ALIGNMENT_GATE: PASSED -->` (BIAN) or `<!-- ALIGNMENT_GATE: PASSED -->` (another framework) in `docs/01-system-overview.md` and lifts the Summary and impacted-capability lists into Section 1.5 ("BIAN Capability Alignment" or "Capability Alignment"). |
| `architecture-dev-handoff` | **Downstream consumer**: the `c4-descriptor` asset's **Model Identity** block sources its `Business Domain` and `Capability` tags from this report's § Diagram ID Segments. |
| `architecture-docs-export` | **Downstream consumer**: the Technical Owner briefing section reads § Diagram ID Segments and § API Surface. |
| `architecture-traceability` | **Complementary**: traceability measures architecture coverage of PO Spec requirements; this measures which banking capabilities the initiative realizes. Different lenses on the same PO Spec. |
| `architecture-compliance` | **Downstream consumer**: compliance contracts can reference the impacted Business Areas as scope. |

---

## Example Invocations

```
/skill architecture-capability-alignment
→ Maps the PO Spec onto BIAN v14.0.0, writes BIAN_ALIGNMENT.md

"align with enterprise architecture"
→ Same as above

"map to BIAN"
→ Same as above

"check enterprise alignment"
→ Same as above (also detects if BIAN_ALIGNMENT.md is stale relative to the PO Spec)
```

---

## Component Naming Fidelity

When this skill references a documented component (e.g., when the PO Spec mentions a system that already exists in `docs/components/README.md`), use the **canonical full name** exactly as the component file's H1 gives it (`name` from `component-cli.ts list`; the README index is derived and can lag). Do not abbreviate or alias.

For BIAN vocabulary the same rule binds harder, because these are registry values: cite the **verbatim** Business Area, Business Domain and Service Domain name from the bundled corpus. Write `Finance And Risk Management` — not `Finance & Risk`, `F&R`, or `Risk Management`. Write `Custody, Collateral And Documents` — comma included. Write `Customer Agreement`, not `Customer Agreements`. The short label may be used in a summary-table cell where width demands it, but the full name MUST appear in every per-area section heading and every Service Domain citation.

---

## Documentation Language

Resolve the project's documentation language **before writing anything**, using the protocol in
`skills/architecture-docs/references/LANGUAGE_POLICY.md` §3: `<!-- DOC_LANGUAGE: -->` in
`ARCHITECTURE.md` → legacy `<!-- LANGUAGE: -->` → one-time confirmed heading inference, then
stamp. Messages this skill displays to the user stay English; only authored file content follows
`doc_language`.

**In this skill**: the `BIAN_ALIGNMENT.md` narrative, rationale lines, evidence framing and the *Realizes | Consumes* determination are authored in `doc_language`.

**Never localized** — the 8 Business Area names, the 43 Business Domain names, the 341 Service Domain names, all BIAN ids, every quoted BIAN role definition and example of use, the `DOM` / `CAP` codes, every API specification URL, the 🟢/🟡/⚪ glyphs, the **Diagram ID Segments** block, table column headers, and every header comment marker. BIAN publishes in English and the SA Design Language Standard mandates English for these vocabularies in every edition. A translated Service Domain name is not findable in the corpus and breaks the registry lookup.

A quoted role definition stays in BIAN's English **inside a Spanish report**. That is correct, not an oversight — it is a citation.

Structural headings this skill writes carry their English anchor comment in both languages
(`## Heading <!-- SECTION: English Name -->`). Full do-not-localize registry:
`LANGUAGE_POLICY.md` §4.

This report is usually written **before** `ARCHITECTURE.md` exists. When it does not, resolve from
`<!-- DOC_LANGUAGE: -->` in `PRODUCT_OWNER_SPEC.md`; if that is absent too, default to `en` and do
**not** prompt — `architecture-docs` Workflow 1 Step 0.1 is where the architect makes the choice,
and this skill must not pre-empt it.

---

## Success Criteria

A successful alignment report produces:

- [ ] All 8 Business Areas classified with a status (🟢 / 🟡 / ⚪) and a one-sentence rationale
- [ ] Every 🟢 / 🟡 Business Area enumerates its impacted Business Domains verbatim, each with status, rationale and PO Spec § citation
- [ ] Each per-area Business Domain block closes with `(not impacted: <remaining names>)`
- [ ] Every 🟢 / 🟡 Business Domain lists its impacted Service Domains with BIAN id, **verbatim** role definition, Realizes/Consumes, and PO Spec § citation
- [ ] Summary table counts reconcile: Business Domains sum to the per-area lists, and totals read `M of 43` and `K of 341`
- [ ] **Diagram ID Segments** present with a `DOM` and `CAP` for every 🟢 / 🟡 Business Domain — or the section absent with `DESIGN_LANGUAGE_CODES: absent` recorded, never present-but-guessed
- [ ] Every `CAP` is 4 letters, every `DOM` 3, and both appear in `bian-registry.json`
- [ ] **API Surface** table lists every published specification for 🟢 Service Domains, and names those without one rather than omitting them
- [ ] No governance rule, cross-cutting finding or owner counterpart appears anywhere — BIAN publishes none
- [ ] Header comments (`BIAN_ALIGNMENT_VERSION: 3.0`, `BIAN_RELEASE`, `PO_SPEC_SOURCE`, `GENERATED`) present and parseable by `architecture-docs` Step 0.3
- [ ] `BIAN_ALIGNMENT.md` renders correctly in GitHub / external markdown viewers
- [ ] `architecture-docs` Workflow 1 Step 0.3 passes when re-run after this skill completes
