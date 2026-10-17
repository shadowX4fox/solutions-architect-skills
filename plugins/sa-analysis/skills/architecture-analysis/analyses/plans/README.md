# Plans and fills — the two contracts of the mechanical analysis pipeline (8.50.0)

Since 8.50.0 an analysis report is not typed by the agent. Three things meet:

| Piece | Who writes it | What it holds |
|---|---|---|
| `plans/<lens>.json` | the plugin (this folder) | the **shape** of the lens's report — every section in order, its anchor, its visible titles in both languages, its columns spelled as the spec spells them, its id scheme, whether it is an inventory, a heat map, a chart, a block list |
| `.cache/sa-skills/analysis/<lens>.fill.json` | the analysis agent, once, from one payload | the **judgement** — rows per section, heat-map coordinates, cascade blocks, recommendations, verdict, gaps, citations |
| `analysis/<LENS>-<date>.md` / `.html` | `scripts/render-analysis.js` | the report: plan × fill, then `check-report.js` |

`scripts/analysis-prepare.js` writes the payload the agent reads (plan, spec, ledger facts, derived
metrics, explorer excerpts, the lens's prose documents). The agent never opens the corpus to build a
table the ledger already holds, and never writes a heading, an anchor or a heat map — the renderer
owns the format, so a report cannot drift from its spec.

## Plan schema (`plans/<lens>.json`)

```jsonc
{
  "lens": "spof",                      // the analysis_type slug
  "slug": "SPOF",                      // the report filename stem: analysis/SPOF-<date>.md
  "specFile": "SPOF.md",               // analyses/<specFile>
  "title": { "en": "Single Point of Failure Analysis", "es": "Análisis de Puntos Únicos de Falla" },
  "typeLabel": "Single Point of Failure",           // {{ANALYSIS_TYPE_LABEL}} in HTML
  "vizTitle": "Risk Heat Map (Impact × Likelihood)", // {{VIZ_TITLE}} in HTML
  "topN": 5,
  "idForms": "C1, D1, O1",             // printed in the payload for the agent
  "docs": ["docs/09-operational-considerations.md", "docs/05-integration-points.md"],  // prose the judgement needs, bundled whole; ARCHITECTURE.md is always added
  "sections": [ /* in report order */ ]
}
```

Every section:

```jsonc
{
  "key": "Critical SPOFs",             // the English anchor: `<!-- SECTION: Critical SPOFs -->` — never localized
  "level": 3,                          // 2 or 3 (3 = under the `Findings` H2 the renderer opens when the first level-3 table comes)
  "title": { "en": "Critical SPOFs — Full Outage", "es": "SPOF Críticos — Interrupción Total" },
  "kind": "table",                     // summary | table | inventory | matrix | blocks | heatmap | chart | text | recommendations | strengths | verdict | gaps
  "columns": ["#", "Component", "Failure Scenario", "Impact", "Mitigation", "Source"],   // English, spelled as the spec spells them; the first is `#` (or `ID` for the STRIDE inventory) unless kind is inventory (then the renderer numbers rows 1, 2, 3)
  "id": "^C\\d{1,3}$",                 // the id regex rows of this table must satisfy (table / matrix kinds)
  "omitWhenEmpty": true,               // the spec says "omit section if …"
  "htmlOmit": false,                   // true for the ASCII artifacts the d3 viz replaces in HTML mode
  "note": "one line for the agent: what rows belong here and how they are ordered",
  // kind-specific:
  "axes": { "x": { "label": "LIKELIHOOD", "lo": "LOW", "hi": "HIGH", "n": 3 }, "y": { "label": "IMPACT", "lo": "LOW", "hi": "HIGH", "n": 3 } },   // heatmap
  "chart": { "label": "Component", "value": "Headroom %", "unit": "%", "title": "Capacity Headroom by Component (estimated)" },                    // chart: ASCII bars from the rows of `from`
  "from": "Capacity Headroom Summary", // chart: the table section whose rows it draws
  "matrixHeader": ["Auth Mechanism", "Data"]   // matrix (STRIDE): the two fields printed as the one-row table under each boundary heading
}
```

Kinds the renderer knows:

| kind | fill carries | renders as |
|---|---|---|
| `summary` | `summary: string[]` | the Executive Summary paragraphs |
| `table` | `sections[key].rows: [{ id, marker?, cells: { <column>: text } }]` | a `#` table; the id is the first token of the cell, the marker follows it |
| `inventory` | `sections[key].rows: [{ cells }]` | a table numbered 1, 2, 3 (never findings) |
| `matrix` | `sections[key].groups: [{ id, title, header: { <matrixHeader>: text }, rows: [{ id \| "—", cells }] }]` | one H3 per group (the STRIDE boundary), its one-row header table, its findings table |
| `blocks` | `sections[key].blocks: [{ title, text?, mermaid?, table?: { columns, rows } }]` | one H4 per block with its prose, Mermaid fence and table |
| `heatmap` | `heatmap: [{ id, x, y }]` (1-based cells, x rightwards, y upwards) | the ASCII grid of the plan's axes with the ids at their cells |
| `chart` | nothing (drawn from `from`) | ASCII bars: `label ████░░░░ 32%`; a non-numeric value prints as its text |
| `text` | `sections[key].text: string` | paragraphs |
| `recommendations` | `recommendations: [{ id, title, body, source }]` | `**1. title (id)**` + body + source |
| `strengths` | `sections[key].items: string[]` | a bullet list |
| `verdict` | `verdict: string` | one paragraph |
| `gaps` | `gaps: [{ subject, missing, where }]` | the `- [ ]` checklist; omitted when empty |

The renderer also prints the header block (title, date, source, analyst) and the closing
`**Source Citations**` line from `fill.citations`.

## Fill schema (`.cache/sa-skills/analysis/<lens>.fill.json`)

```jsonc
{
  "lens": "spof", "language": "es", "today": "2026-09-13",
  "project": { "name": "…", "version": "3.0.0", "status": "Released", "source": "ARCHITECTURE.md" },   // copied from the payload header
  "summary": ["…", "…"],
  "sections": {
    "Critical SPOFs": { "rows": [ { "id": "C1", "cells": { "Component": "`Servicio de Replicación de Pedidos`", "Failure Scenario": "…", "Impact": "…", "Mitigation": "…", "Source": "docs/09 § 11.1" } } ] },
    "Cascade Paths": { "blocks": [ { "title": "Escenario 1 — …", "text": "…", "mermaid": "flowchart TB\n  A[…] --> B[…]" } ] },
    "Retention Gaps": { "omit": true }                // an omitWhenEmpty section with nothing to say
  },
  "heatmap": [ { "id": "C1", "x": 3, "y": 3 } ],
  "recommendations": [ { "id": "C1", "title": "…", "body": "…", "source": "docs/09-operational-considerations.md § 11.1" } ],
  "verdict": "…",
  "gaps": [ { "subject": "`Cache de Pedidos`", "missing": "RTO", "where": "docs/09-operational-considerations.md § 11.5" } ],
  "citations": ["ARCHITECTURE.md", "docs/05-integration-points.md"],
  "viz": { /* HTML mode only: the per-lens `data` object the d3 snippet reads, when the renderer cannot derive it from the rows (blast-radius graph, data-sensitivity sankey) */ }
}
```

Rules the renderer enforces before it writes (each violation names the section and row):

- every row id matches the section's `id` regex; ids are unique across the report except where the
  spec lists a finding twice (STRIDE High-Priority, Bottleneck Convergence) — then the id must
  already exist in an earlier table
- every row carries every column of its section (`Not documented` or `[NOT DOCUMENTED]` is a value;
  an absent key is a defect)
- a `heatmap` entry names an id that exists and cells within the axes
- a recommendation names an existing id
- a section the plan does not declare is refused; a declared section that is absent from the fill
  renders empty (`omitWhenEmpty` sections vanish; the others print an italic *No findings* line)

Then `check-report.js` runs on the written file; its violations fail the render the same way.
