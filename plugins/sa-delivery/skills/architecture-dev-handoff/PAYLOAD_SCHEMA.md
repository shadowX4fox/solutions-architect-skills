# Handoff Payload Schema (v4 — handoff kit)

This document defines the contract between the `architecture-dev-handoff`
skill orchestrator (main context), `scripts/handoff-prepare.js` (payload
assembly by code — since 8.23.0 the sole writer of all three shapes; the
`handoff-context-builder` agent it replaced stays one release as the no-`bun`
fallback), and the four generator sub-agents that consume payloads:

- `ekonte-generator` — reads the run-level payload
- `settei-generator` — reads the run-level payload
- `seam-generator` — reads one per-edge payload per invocation
- `cutsheet-generator` — reads one per-component payload per invocation

`handoff-prepare.js` writes payloads to `.cache/sa-skills/handoff-payloads/`.
Every section is verbatim or a rule — a table lifted whole under its heading,
a block sliced by heading or label, an id matched by regex; nothing is
composed. An absent source renders as `[NOT DOCUMENTED — …]` naming the
command that produces it.
Each payload is a self-contained, pre-sliced projection of the
architecture documentation onto one of the three payload scopes:
run-level, per-edge, or per-component.

## Why three payload shapes

The four-part handoff kit has three distinct data scopes:

- **Run-level** — flows, edges, latency budgets, blast-radius rows,
  institutional ADRs. Shared across the entire run;
  Runtime View and Cross-Cutting Standards both read it.
- **Per-edge** — the integration row from docs/05, boundary rows from
  each endpoint's component file, cascade class from blast-radius,
  coupling row, related ADRs. Distinct per adjacent-service pair.
- **Per-component** — the trimmed v2 payload plus per-component budget
  rows lifted from the run's latency-budget block and the list of seam
  files incident on this component.

Merging them into one payload would either explode small tasks (a
seam-generator would carry the whole corpus) or duplicate reads across
sub-agent boundaries. Three payloads keep each generator's prompt tight.

---

## File layout

```
.cache/sa-skills/handoff-payloads/
├── _run.md                       ← shared run payload
├── _shared.md                    ← optional excerpt dedup (unchanged from v2)
├── seams/
│   └── <upstream>→<downstream>.md
├── <slug-1>.md                   ← per-component payload
├── <slug-2>.md
└── ...
```

The `seams/` subdirectory is created by `handoff-prepare.js`. `_shared.md`
is not produced by the script (the excerpts are short enough to stay inline);
the generators' marker resolution stays for older payload sets.

---

## 1. Run-level payload — `_run.md`

Consumed by ekonte-generator AND settei-generator (single file, two
consumers, one hash — see `Skip-check` below).

### Frontmatter

```yaml
---
project_name: <first H1 of ARCHITECTURE.md>
architect: <from ARCHITECTURE.md metadata, or "Not specified">
architecture_version: <from <!-- ARCHITECTURE_VERSION: X.Y.Z -->>
architecture_md_path: <absolute path>
doc_language: en|es
generation_date: YYYY-MM-DD
---
```

### Body sections (in order)

```markdown
## Scope
- In scope:
  - <component-a>
  - <component-b>
- Out of scope:
  - <named component or service outside the boundary>

## Flows
### F-01 — <flow name>
- Trigger: <the Flow Inventory's Trigger cell>
- Path: <the owner chains of the flow's phases, joined, consecutive duplicates dropped>
- Phases: 1 (<name>) → 2 (<name>)
- Sequence: [docs/04-data-flow-patterns.md#anchor](../../../docs/04-data-flow-patterns.md#anchor)
- Global budget: <the Flow Inventory's Latency Target cell>
- Governed by: ADR-101, ADR-113
- Failure posture: phase 1: <Phase Catalog's Failure mode cell> · phase 2: <…>
- Delta: <the flow block's Delta line, when present>

### F-02 — ...

## Phase Catalog

```markdown
## Phase Catalog <!-- SECTION: Phase Catalog -->

### Phase 1 — <phase name>
- Used by: F-01, F-02, F-05

```mermaid
<the phase's sequenceDiagram from docs/04, verbatim>
```
```

(one per phase that carries a fence, each once; `Used by` lists the flows whose `**Phases**:` line declares it.
Each flow's block in `## Flows` ends with `- Main image:` and a fence — the flow's end-to-end sequence
that `flow-compose.js` derived in docs/04 from these same panels, steps labelled `N.M`. The kit therefore
draws every phase once, here, and every flow once, there; `kit-check` refuses a repeated phase heading.)

## Edges
| # | Upstream | Downstream | Style | Protocol | Purpose | Related ADRs |
|--:|----------|------------|-------|----------|---------|--------------|
| E-01 | <up> | <down> | sync | HTTPS | <the `**I-nn — title**` of the docs/05 block (a compound `**I-19 e I-20 — title**` gives both ids its title), else the Pattern cell> (I-nn) | ADR-018 |
| E-02 | ... |

Style is `async` when the protocol or pattern names an event, topic, queue, stream, CDC or
batch transport, `sync` otherwise. An endpoint that is no documented component keeps its
docs/05 text and the edge stays here (reported as unresolved); no seam is written for it.
Retired rows (`~~I-nn~~`) are listed in one note under the table.

## Latency Budget
### F-01
| Hop | Component | Role | p95 (ms) | p99 (ms) | % of SLO |
|----:|-----------|------|---------:|---------:|---------:|
| 1 | <c-a> | ... | ... | ... | ... |
...
(verbatim from analysis/LATENCY_BUDGET-*.md)

### F-02
...

## Blast Radius
(verbatim excerpts from analysis/BLAST_RADIUS-*.md — High-Blast Components table, per-component cascade rows)

## Coupling
(verbatim from analysis/COUPLING-*.md — fan-in / fan-out / instability per component; optional)

## Institutional ADRs
- ADR-001 — <title> — <status> — [adr/ADR-001-slug.md](../../../adr/ADR-001-slug.md)
  <the prose paragraphs under the Decision heading — sub-headings, tables and comments skipped — capped at 900 characters>
- ADR-002 — ...
```

### Skip-check

Hash the file once via `manifest-cli.ts hash _run.md 4.3.1`. Pass the
same hash to two `check-run` invocations:
- `check-run <manifest> ekonte <hash> 4.3.1 4 <handoffs>/SYSTEM_RUNTIME_VIEW.md`
- `check-run <manifest> settei <hash> 4.3.1 4 <handoffs>/CROSS_CUTTING_STANDARDS.md`

The two parts have independent SKIP/REGEN decisions because the
manifest tracks their template versions and generated dates separately.

---

## 2. Per-edge payload — `seams/<upstream>→<downstream>.md`

Consumed by one seam-generator invocation. Edge keys use the Unicode `→`
arrow and both sides are the canonical `slug` from `component-facts.ts list`.

### Frontmatter

```yaml
---
upstream: <canonical slug>
downstream: <canonical slug>
upstream_name: "<canonical name>"          # 8.112.0 — the H1 and every visible mention; the slug is for file names and links
downstream_name: "<canonical name>"
edge_id_in_ekonte: E-<index>
doc_language: en|es
generation_date: YYYY-MM-DD
design_language: governed|fallback        # 8.110.0 — the Design Language Standard in the plugin, present or absent
interaction_label: "<PROTOCOL>/<STYLE> [Action Type]"   # governed only: the container diagram's label on upstream → downstream, verbatim, or a [NOT DOCUMENTED — …] marker
---
```

`doc_language` carries the same value as the run payload. The seam generator
authors its output in it; without the field a Spanish project gets Spanish
Runtime View and Component Specifications alongside English Interface Contracts.

### Body sections

```markdown
## Integration Row
<the docs/05-integration-points.md row for this edge, verbatim including the table header, followed by its `**I-nn — title**` block when docs/05 carries one>

## Panel
<the two endpoints on the docs/03 container diagram (C4 Level 2, else the Detailed View) with the edges between them — or the shortest route through intermediaries when none is drawn — parsed and re-emitted with the diagram's own head, classDefs, subgraphs and class lines, linted by mermaid-check.js; [NOT DOCUMENTED] when there is no such diagram or no node carries the endpoint's canonical name>

## Boundaries Upstream
<the Outbound table of <upstream>'s Communication Patterns section — the rows naming <downstream>, or the whole table with a note when none does>

## Boundaries Downstream
<the Inbound table of <downstream>'s Communication Patterns section, same rule>

## Blast Radius Row
<the row(s) whose Component cell is <upstream> or <downstream>, from analysis/BLAST_RADIUS-*.md, verbatim under their table header>
<if missing: `[NOT DOCUMENTED — run /sa-analysis:architecture-analysis blast-radius]`>

## Coupling Row
<fan-in/out/instability row(s) for either endpoint from analysis/COUPLING-*.md>
<omit section entirely if the coupling analysis is not present>

## Related ADRs

Every entry is tagged with its provenance — `- ADR-120 (edge) — …` for an ADR the docs/05 row or a boundary
row cites (the ones that govern this interface, in the row's order), `(endpoint)` for one that only the
descriptors' headers cite (context, filling a list under three, sorted by number). The Interface Contract's
Decision cell is the first `(edge)` entry; through 8.27.0 the list was sorted by number and an interface
created by ADR-120 cited ADR-004.
<the ADRs cited by the docs/05 row, its block and the boundary rows; when fewer than three, the two descriptors' `related_adrs` complete the list — Decision excerpts capped at 500 characters>
```

### Skip-check

Hash the file via `manifest-cli.ts hash <path> 4.3.1`, then
`check-seam <manifest> <edge_key> <hash> 4.3.1 4 <handoffs>/interfaces/<edge_key>.md`.

---

## 3. Per-component payload — `<slug>.md`

Consumed by one cutsheet-generator invocation. Trimmed from v2: no
verbatim OpenAPI/DDL schemas, no global security/perf/ops paragraphs.
Adds three v3-only sections listed below.

### Frontmatter

```yaml
---
component_slug: <slug>
component_file: <repo-relative path>
component_type: <normalized token>
component_index_position: "NN"
component_version: <from **Component Version:** field, or 1.0.0>
component_owner: <from **Owner:** field, or "Not specified">
asset_types: [<token>, ...]
architecture_version: X.Y.Z
architecture_md_path: <absolute path>
project_name: <name>
architect: <name or "Not specified">
generation_date: YYYY-MM-DD
doc_language: en|es
shared_refs: [_shared.md]        # optional — only when dedup applied
---
```

### Body sections (in this exact order — cut-sheet-generator uses names to locate content)

```markdown
## Component File (raw)
<the descriptor verbatim, explorer header removed — the form handoff-prepare.js writes; the
generator reads the same fields it read from the structured YAML (`## Component (structured)`,
the agent's form, is still accepted)>

## Owned Entities
<the descriptor's data-ownership / entities / data-model section verbatim, else [NOT DOCUMENTED]>

## Budgets (from Runtime View)
<the rows naming this component in the latency-budget analysis tables — or, without the analysis,
in docs/04's latency-budget section — verbatim under their table header and heading>

## Seams incident on this component
- ../interfaces/<upstream>→<slug>.md   ← inbound
- ../interfaces/<slug>→<downstream>.md ← outbound

## Panel
<the component and its neighbours on the docs/03 container diagram, same cutter>

## Message Definitions
<only when asset_types has asyncapi, avro or protobuf (8.105.0; gRPC integrations too since 8.107.0): the docs/05 block of each async integration of the
component; the H2+ sections of the descriptor at the other end whose heading names an event / message / schema /
payload / record and that carry a code block, a table or a `**…Fields**` line — and, when that end is a broker (a
topic, a bus), the same sections of the producers and consumers behind it. Each part capped at 4,000 characters,
the section at 20,000. Without any: a pointer to the component's own message sections, or the NOT DOCUMENTED marker>

## Operation Definitions
<only when asset_types has openapi or graphql-sdl (8.109.0): for each synchronous docs/05 integration the component
receives (protocol and pattern not async), its docs/05 `I-nn` block and its inventory row; then every other docs/05 table
row citing one of those ids, under its heading, after the prose that opens its section (≤ 1,500 characters). Block
capped at 3,000 characters, the section at 20,000. Without any: the NOT DOCUMENTED marker>

## Flows referencing this component
- F-01 phase 2 (<phase name>)
- phase 13 (<phase name>) — in no catalogued flow

## Applicable Cross-Cutting Standards Rules
- ADR-101, ADR-113
<the ADRs this descriptor cites — § 7 cites them as constraint reasons>

## Relevant ADRs
<Decision excerpts (500 characters) of the ADRs in the descriptor's `related_adrs` header and body>
```

### Skip-check

`check-cut-sheet <manifest> <slug> <hash> 4.3.1 4 <handoffs>/components/NN-<slug>.md`.

---

## Component type → asset type mapping (unchanged from v2)

The type-detection table is unchanged from v2. Kept here verbatim for
reference.

Match keywords against `type` and `technology[]` from `component-facts.ts list` first — those are the
parsed `**Type:**` and `**Technology:**` fields — then against the remaining unparsed signals in the
component doc.

| Keyword match (in `type` / `technology[]` / **Description:** / **Communicates via:** / **Deploys as:** / EXPLORER_HEADER / topic-tables) | `component_type` | `asset_types` |
|---|---|---|
| API, REST, GraphQL, gRPC, Service, Endpoint, Backend, BFF | `api-service` | `[openapi, c4-descriptor]` |
| Gateway, API Gateway, Edge, Ingress, Reverse Proxy | `api-service` | `[openapi, c4-descriptor]` |
| Database, DB, Data Store, PostgreSQL, MySQL, MongoDB, Cassandra, DynamoDB | `database` | `[ddl, c4-descriptor]` + `sql_engine: <engine>` when relational (8.106.0); a NoSQL engine named (MongoDB, Cassandra, DynamoDB, Couchbase, Cosmos DB, …) with no SQL engine → `[c4-descriptor]` |
| Redis, Cache, ElastiCache, Memcached, Valkey, KeyDB | `cache` | `[redis, c4-descriptor]` |
| Kubernetes, K8s, Deployment, Pod, AKS, EKS, GKE, OpenShift, ECS, Fargate, Container, Docker, containerized | `k8s-workload` | `[c4-descriptor]` — no manifest asset (removed in 8.104.0; an `**Asset Hints:**` naming `deployment` or `cronjob` is ignored with a warning) |
| Consumer, Producer, Queue, Topic, Event, Message, Kafka, RabbitMQ, SQS, SNS, EventBridge, Pub/Sub, NATS | `message-consumer` / `message-producer` | `[asyncapi, c4-descriptor]` + `[avro]` if avro/*.avsc/Schema Registry + `[protobuf]` if protobuf/proto3/*.proto/gRPC |
| CronJob, Cron, Scheduled, Batch, Scheduler | `scheduled-job` | `[c4-descriptor]` — no manifest asset (removed in 8.104.0) |
| Library, SDK, Utility, Config, Documentation, Schema-only | `skip` | `[]` |

**`**Asset Hints:**` override**: when present in the component file,
parses to either a bracketed list (`[openapi, ddl]`) or the
literal `skip`. Replaces the resolver output; `c4-descriptor` is still
appended (unless `skip`).

**`component_type`** is the family the `**Type:**` / `**Technology:**` fields match in this table;
when none matches, the descriptor's own `**Type:**` normalized (`web-application`). The asset
union still reads the Deployment section and the `**Deploys as:**` / `**Communicates via:**` fields.

**Union semantics**: multi-row matches produce the deduped union of
`asset_types`.

**The API contracts follow docs/05** (8.113.0): for each synchronous integration the component **receives**, the
Protocol cell names the contract — GraphQL → `graphql-sdl`, gRPC / Protobuf → `protobuf`, any other HTTP surface
(REST, HTTPS/JSON, OpenAPI, Swagger) → `openapi`; a data-store protocol (JDBC, an SDK, TLS) names none. When at least one
does, those are the component's API contracts and a keyword one none of them names is dropped; `asset_basis` in the
payload frontmatter says so (`"docs/05 inbound I-20 → openapi, I-27 → openapi"`, else `"descriptor keywords"`).
Keywords decide only without such an edge. Another component's canonical name is removed from the signals first
(a gateway named after GraphQL in a deployment section is not this component's GraphQL), and a `database` or `cache`
gets no API contract from keywords at all. `**Asset Hints:**` still overrides everything.

---

## Shared excerpts (`_shared.md`) — carried over from v2

For runs with 3+ components sharing a verbatim excerpt (typically
org-wide ADR paragraphs or shared docs/07/08/10 blocks), the
context-builder writes the excerpt once to
`.cache/sa-skills/handoff-payloads/_shared.md` under a stable
`## Shared: <header>`, and replaces the excerpt in each per-component
payload with a single-line marker:

```markdown
> See: _shared.md § Shared: ADR-012
```

Each per-component payload's frontmatter carries `shared_refs: [_shared.md]`.
The cutsheet-generator resolves markers in PHASE 0.

Threshold: 3 components. Below that, keep the excerpt inline.

---

## Manifest schema

Version `"3"`. See `utils/manifest.ts` for the TypeScript shape:

```json
{
  "version": "4",
  "generator": "sa-skills:architecture-dev-handoff",
  "generator_version": "4.3.1",
  "run": {
    "ekonte_hash": "sha256:...",
    "ekonte_template_version": "4.3.1",
    "settei_hash": "sha256:...",
    "settei_template_version": "4.3.1",
    "schema_version": "3",
    "architecture_version": "X.Y.Z",
    "generated": "2026-08-03T14:00:00Z"
  },
  "seams": {
    "api-gateway→auth-service": {
      "payload_hash": "sha256:...",
      "template_version": "4.3.1",
      "schema_version": "3",
      "seam_file": "interfaces/api-gateway→auth-service.md",
      "related_adrs": ["ADR-018"],
      "generated": "..."
    }
  },
  "cut_sheets": {
    "api-gateway": {
      "payload_hash": "sha256:...",
      "template_version": "4.3.1",
      "schema_version": "3",
      "architecture_version": "X.Y.Z",
      "cut_sheet_file": "components/01-api-gateway.md",
      "assets": ["openapi.yaml", "c4-descriptor.md"],
      "doc_language": "en",
      "generated": "..."
    }
  }
}
```

Older manifests auto-migrate on load. A **v3** manifest (the 3.x kit,
Ekonte-named files) keeps its three sections but every `seam_file` moves
from `seams/` to `interfaces/`, every `cut_sheet_file` from `cut-sheets/`
to `components/`, and every hash — `run.ekonte_hash`, `run.settei_hash`,
each `payload_hash` — is prefixed with `stale:`, so the whole kit
regenerates into the 4.3.1 layout and the orchestrator's Phase 3.6 removes
the old files once their counterparts exist. A **v1/v2** manifest's
`components: {}` map moves to `cut_sheets: {}`, also stale (v2→v3 changed
the layout to a subdirectory, so old cache entries can never be reused).

---

**Schema version**: 4.3.1 (handoff kit — panels — three payload shapes, v4
manifest with `run` / `seams` / `cut_sheets` sections, prerequisite
gates)

**Consumers**: `skills/architecture-dev-handoff/SKILL.md`,
`skills/architecture-dev-handoff/scripts/handoff-prepare.js` (the writer),
`agents/generators/ekonte-generator.md`,
`agents/generators/settei-generator.md`,
`agents/generators/seam-generator.md`,
`agents/generators/cutsheet-generator.md`.

## Row Labels (every payload, 8.111.0)

Under a non-English `doc_language` the run payload (`_run.md` — the System Runtime View and Cross-Cutting Standards
labels), each seam payload and each component payload end with `## Row Labels <!-- SECTION: Row Labels -->`: a
`| English (template) | <lang> |` table of every label the template's label tables carry, from `ROW_LABELS.json`. The
generator copies the value verbatim; `kit-check.js` holds the written part to it (`row-label-unregistered`, `--fix`).
Under `en` there is no section.
