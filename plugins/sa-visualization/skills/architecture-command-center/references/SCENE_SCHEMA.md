# Scene JSON contract for `architecture-command-center`

One JSON object. `scripts/render.js` validates the cross-references listed under *Validation*
and substitutes the object into `VIEWER_TEMPLATE.html`. See
`examples/order-desk.scene.json` for a complete instance.

## Top level

| Field | Type | Required | Notes |
|---|---|---|---|
| `project` | string | yes | Page title and header. Use the H1 of `ARCHITECTURE.md` without the " — Arquitectura" suffix |
| `version`, `status` | string | no | From the `ARCHITECTURE_VERSION` / `ARCHITECTURE_STATUS` markers |
| `architectureType` | string | no | `ENTERPRISE`, `3-Tier`, `Microservices`, … shown in the meta line |
| `language` | `"en"` \| `"es"` | no | Default for the viewer chrome; `--lang` overrides |
| `theme` | `"holo"` \| `"atlas"` | no | Theme the rendered file opens with (default `holo`, the retro sci-fi hologram; `atlas` is the neutral corporate look); `--theme` overrides. The viewer can switch at runtime either way |
| `view` | `"logical"` \| `"physical"` | no | View the rendered file opens with (default `logical`); `--view` overrides. `physical` needs `deployment`. The viewer switches at runtime either way |
| `sources` | string | no | Info dialog: the files the scene was built from |
| `thesis` | string | no | Info dialog, first row: the one sentence the model is built to show (usually the layering exception) |
| `allDescription` | string | no | Description shown for the "full view" route |
| `layers` | Layer[] | yes | Top to bottom |
| `systems` | System[] | yes | Internal system(s) first, then external |
| `nodes` | Node[] | yes | |
| `edges` | Edge[] | yes | |
| `routes` | Route[] | no | The "Routes" tab. A "full view" entry is added automatically |
| `phases` | map<string, Phase> | no | Keyed by phase number as a string |
| `useCases` | UseCase[] | no | The "Use cases" tab; hidden when empty |
| `dossier` | Dossier | no | Alia's dossier — `adrs`, `tdrs`, `compliance`, `components`, `integrations`, `findings`, `sections` (the `docs/NN-*.md` files: title, header fields, summary, outline), written by `scripts/dossier.js`, never by hand. Absent → Alia says the scene carries no dossier |
| `deployment` | Deployment | no | The physical view — tiers, deployment nodes, container instances and undirected paths. Absent → the **Physical** button is hidden and the file is the logical view alone |
| `capacity` | Capacity | no | What the load simulation reads (8.33.0) — demand per use case, capacity per container normalized to rps, the gaps, the project's scenarios. Written by `scripts/scene-from-docs.js` from the descriptors' `## Capacity` tables and `docs/08` § Demand by Use Case; `scenarios` come from the overrides file. Absent → every instance is pending in the simulation, honestly |
| `increments` | Increment[] | no | Delivery increments (8.141.0), written by `scripts/scene-from-docs.js` from sa-skills' `scripts/shared/increments.js`, never by hand: `id`, `target`, `useCases` (its own), `cumulative`, `nodes` (every node id in the slice, earlier increments' included), `newNodes`, `integrations` (docs/05 ids), `temporary` (`{ node \| integration, until, tdr }`), `retired` (names and ids leaving with it), `gaps` (count). `render.js` rejects a node id the scene lacks. Absent → the increment row is hidden |

## Layer

```json
{ "n": 1, "name": "Canales", "owned": true }
```

`n` is the floor index from the top (1 = highest floor). `owned` marks floors inside the
system boundary; the boundary box spans the contiguous owned floors and the legend ranges
(`L1–L4`) are derived from it.

## System

```json
{ "id": "tienda-movil-2-0", "name": "Tienda Movil 2.0", "owned": true }
```

`owned: false` systems get a tinted zone on every floor where they have nodes, labelled once on
the topmost floor. Up to five external systems get distinct zone tints; more cycle.

## Node

```json
{ "id": "sgw", "name": "Sync Gateway", "layer": 4, "system": "tienda-movil-2-0",
  "kind": "service", "tech": "Couchbase Sync Gateway", "code": "BIAN Current Account · 36217", "internal": "shp-rgw-replication-gateway",
  "note": "…", "adrs": ["ADR-104"], "x": -7, "z": 0 }
```

`code` and `internal` are never the same value: `code` is what BIAN calls the capability, `internal` is what the organization calls the container. A value that fits the `internal` rule below does not go in `code`.

| Field | Notes |
|---|---|
| `id` | Short slug, unique. Used by edges and phases |
| `name` | **Canonical full name** as the container file's H1 gives it. Never abbreviate |
| `layer` | Must exist in `layers` |
| `system` | Must exist in `systems`, or the literal `"actor"` for `kind: "actor"` |
| `kind` | `app` (box) · `service` (box) · `gateway` (box with outline) · `worker` (box) · `store` (cylinder) · `broker` (hexagonal prism) · `actor` (octahedron, italic label, "phase actor" badge) |
| `tech` | Technology column of the component index |
| `code` | Optional **BIAN eyebrow** shown in the inspector: the Service Domain name and id the container realizes or consumes, as `BIAN <Service Domain> · <id>` (`BIAN Current Account · 36217`). **Never an internal identifier** — a portfolio application id (`COR0009 - Books`), a workload slug (`onb-msa-dm-cura-…`), a schema, topic or product code (`BDD_OMNI_TRANS`, `WSProductos0223`, `Kong-CAS`): those are `internal`, derived from the descriptor, and `render.js` rejects them here (`scripts/identifier.js` is the rule). `scene-from-docs.js` carries a base scene's `code` minus any identifier segment and reports what it dropped |
| `internal` | Optional **internal name** — the repository / workload / product identifier when it differs from the canonical name (`shp-spa-order-history`), taken from `component-cli.ts list` → `internal_name`. Shown beside the canonical name in the inspector and in Alia's pages, given to the brain as a second identifier, and the natural id for the container's deployment instance. Never a substitute for `name` |
| `note` | Two or three sentences from the descriptor: responsibility, the rule it enforces, the constraint it imposes on others. Authored in `doc_language` |
| `adrs` | Related ADR ids, from the descriptor's `EXPLORER_HEADER` |
| `x`, `z` | Optional. Floor coordinates; `x` runs left–right, `z` front (+) to back (−). Omit both to auto-place |

Component `Type` column → `kind`: Web Application → `app`; API Service → `service`;
Gateway → `gateway`; Worker/Consumer → `worker`; Database → `store`; Message Broker → `broker`.

### Auto-layout

For each floor, nodes without coordinates are grouped by system in `systems` order; each system
becomes one row (front to back), nodes spaced 4.2 units apart and centred. Floors size themselves
to the furthest node. Give explicit `x` to nodes that should stack vertically across floors
(a request cascade), and keep the same `z` for them.

## Edge

```json
{ "a": "sgw", "b": "app", "routes": ["repl", "control"], "label": "WSS · salta L3 y L2", "jump": true }
```

| Field | Notes |
|---|---|
| `a`, `b` | Source and target node ids. Drawn `a → b` with an arrowhead at `b` |
| `routes` | Route ids this edge belongs to. The **first** one sets the resting color |
| `label` | Protocol or rule shown at mid-edge |
| `jump` | Thick tube, arrowheads at both ends, straight line through the floors it skips. For the documented layering exception only |
| `bidirectional` | Arrowheads at both ends without the thick treatment |
| `dashed` | Dashed line, never highlighted. Use with a route whose `color` is `batch` |

Edges are undirected for highlighting and phase animation: a phase hop `[b, a]` reuses the
edge `a → b` with the pulse running backwards. Do not add mirrored edges.

## Route

```json
{ "id": "repl", "name": "Ingesta y replicación", "budget": "≤ 30 s", "color": "async", "desc": "…" }
```

`color` is one of the five families and drives both the tube color and the legend entry:

| `color` | Meaning | Use for |
|---|---|---|
| `local` | Synchronous read that stays at the edge | Device-local reads, in-process calls |
| `online` | Request–response descending the layers | REST, GraphQL, gateway calls |
| `async` | Events, CDC, replication, streaming | Kafka, CDC, sync sessions, queues |
| `control` | Lifecycle and governance of the data | Integrity checks, session setup, revocation, restoration |
| `batch` | Off the critical path | Nightly jobs, consolidation; pair with `dashed` edges |

Use `neutral` when nothing fits; it is grey and carries no meaning.

## Phase

```json
"7": { "name": "Replicación incremental al dispositivo", "budget": "≤ 10 s", "kind": "async",
       "path": [["cache", "sgw"], ["sgw", "app"], ["app", "ldb"]], "extra": [["ad", "app"]] }
```

`path` is the ordered list of hops the pulse travels; every hop must match an existing edge in
either direction. `extra` hops are highlighted but not travelled (parallel branches). `kind`
uses the same five families as routes and colors the hops of this phase inside a use case.

## UseCase

```json
{ "id": "UC-03", "code": "3", "name": "Movimiento nuevo en tiempo casi real", "target": "≤ 30 s",
  "phases": [6, 7, 4], "desc": "…", "adrs": ["ADR-111", "ADR-113"] }
```

`phases` is the ordered list as the docs state it. `code` is the short marker shown before the
name (`1`, `7b`); `target` is the flow-level latency objective. Flows that are not use cases of
their own (contingency, fallback) belong here too with a distinct `id` and `code`.

## Deployment (the physical view)

The logical view answers *where a container sits in the design*; the physical view answers *where
it runs*. Both are drawn by the same engine from the same shapes — floors, tinted boxes, blocks,
links — so the switch in the viewer is a swap, not a second model. The physical view follows the
Deployment-altitude rules of the SA Design Language Standard where the docs give the material
(`llms-rules.txt` §5.7, §6.2–6.4 and the per-altitude whitelist): infrastructure appears **only**
here, connections are **undirected** and labelled in **transport form**, containment is nesting and
never a line, and every path carries a **Path Class**.

```json
"deployment": {
  "description": "Producción en Azure East US con la cadena de ingreso de ADR-115.",
  "derivedFrom": "docs/03-architecture-layers.md § Diagram 3 · Container",
  "tiers": [ { "n": 1, "name": "Público", "owned": false }, { "n": 2, "name": "DMZ" }, { "n": 3, "name": "Interno" }, { "n": 4, "name": "Restringido" } ],
  "nodes": [ … ], "instances": [ … ], "paths": [ … ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `description` | string | no | Shown as the description of the physical "full view" entry. Authored in `doc_language` |
| `derivedFrom` | string | no | Provenance line under the view switch and in the Info dialog — the Container view this deployment is derived from (a Diagram ID when the design language is in force, otherwise the doc and heading) |
| `tiers` | Tier[] | yes | Floors, top to bottom. Same shape as `layers`; `owned` defaults to `true` |
| `nodes` | DeploymentNode[] | yes | Infrastructure. Nested through `parent` |
| `instances` | Instance[] | yes | Which container runs on which node |
| `paths` | Path[] | no | Declared connectivity between nodes or instances |

### Tier

`{ "n": 1, "name": "DMZ", "owned": true }`. `n` is the floor index from the top. **Stratify by
trust zone** when the docs declare zones (Section 9, or the `Trust Zone` tag of the design language:
`Public` → `DMZ` → `Internal` → `Restricted` → `CDE`, top to bottom); when they do not, use whatever
Section 11 groups the infrastructure by — edge / compute / data, or the environment split — and say
so in the report. `owned: false` marks tiers outside the organization's operation (the public
internet, the customer's device); the boundary box spans the contiguous owned tiers and is drawn
only when some tier is outside it.

### DeploymentNode

```json
{ "id": "aks", "name": "AKS Tienda Móvil", "kind": "cluster", "tier": 3, "parent": "azure",
  "trustZone": "Internal", "jurisdiction": "US", "resilience": "Active", "tech": "AKS · Istio · Helm",
  "note": "…", "adrs": ["ADR-044", "ADR-012"] }
```

| Field | Notes |
|---|---|
| `id` | Short slug, unique across nodes **and** instances |
| `name` | As Section 11 / the ADRs name it. Never invent a product the docs do not name |
| `kind` | `region` · `zone` (availability zone or network segment) · `cluster` · `namespace` · `host` (VM) · `device` (load balancer, firewall, WAF, HSM) · `managed` (PaaS / SaaS service) · `client` (the customer's device) · `platform` · `network`. Drives the inspector wording only — **what a node looks like is decided by content**: a node that contains other nodes or hosts instances is drawn as a tinted **box** (nested boxes nest); a node with nothing inside is drawn as a **slab**, an appliance on the floor |
| `tier` | Required for a node that hosts instances or contains nothing; a node that only contains other nodes (a region) may omit it and is drawn on every tier where its descendants sit. A node without a tier inherits its nearest ancestor's |
| `parent` | Nesting: `namespace` → `cluster` → `region`. Containment is drawn as nesting, never as a line |
| `owned` | Default `true`. `false` = provider-managed (a SaaS, the customer's device): tinted like an external system and badged *provider-managed* |
| `trustZone` | `Public` · `DMZ` · `Internal` · `Restricted` · `CDE` · `Mgmt-OOB` — the closed vocabulary of the standard. **Inherited by containment**: a node without one takes its nearest ancestor's, and the inspector says so |
| `jurisdiction` | ISO 3166-1 alpha-2 (`EC`, `US`, …) or `Multi`; inherited like the trust zone |
| `resilience` | `Active` · `Active-Active-Peer` · `Warm-Standby` · `Cold-Standby` · `Backup-Target` |
| `tech`, `code`, `note`, `adrs` | As for a container node; `note` authored in `doc_language` |
| `metered` | Optional (8.54.0). What the node's provider bills: `{ "by": "bytes", "direction": "out", "source": "…" }` — `by` is `bytes` (the meter the simulation computes) or `requests`; `direction` is what it counts, `in` · `out` (default) · `both`. A CDN, a WAF, a front door, a NAT or egress gateway. The simulation then reports the bytes per second crossing it in that direction, the GB a month at the scenario's scale and, when `capacity.pricing` carries the node, the cost a month. Set it through `overrides.deploymentNodes` so the generated `deployment.nodes` array stays whole |
| `x`, `z` | Optional coordinates for a slab node. Boxes are computed from their content and cannot be placed by hand |

### Instance

```json
{ "container": "svc", "node": "ns-bmo", "replicas": "10–30 (HPA) · 900Mi Guaranteed", "resilience": "Active", "note": "…" }
```

| Field | Notes |
|---|---|
| `container` | A `nodes[].id` of the logical scene. **Not an actor** — actors are not deployed |
| `node` | The deployment node it runs on. The instance is drawn inside that node's box, with the container's shape and canonical name |
| `id` | Optional; defaults to `<container>@<node>`. Give one when the same container has several instances (active + standby) and a path must name one of them |
| `replicas` | As the deployment section or the component descriptor writes it — a range, an HPA bound, a device count. Free text, never computed |
| `resilience` | Same vocabulary as the node. The use-case projection prefers an `Active…` instance when a container has several |
| `trustZone` | Only to **raise** the zone above the node's; an instance never lowers it |
| `note`, `x`, `z` | Instance-specific note (falls back to the container's) and optional coordinates |

Every internal container should have at least one instance; `render.js` warns about the ones
that do not, and the viewer lists them under the view switch as *not placed on any node*.

### Path

```json
{ "a": "agw", "b": "aks", "transport": "TLS:443", "pathClass": "Peering", "role": "Active", "auth": "mTLS", "crossBorder": "No" }
```

| Field | Notes |
|---|---|
| `a`, `b` | Node ids or instance ids. **Undirected**: no arrowhead is drawn and none is implied; call direction lives on the logical view |
| `transport` | The whole label, in transport form — `<TRANSPORT>[:<port>]`: `TLS:443`, `TCP:1433`, `AMQP:5671`. No Action Type, no data-scope or composition qualifier |
| `pathClass` | `Private Link` · `Peering` · `VPN` · `Service Mesh` · `Direct Connect` · `Public Internet`. Colors the path and is the legend; `Public Internet` is stated, never left blank. An unregistered value draws grey and is warned about |
| `role` | `Active` (default) · `Failover` — a declared but dormant path is drawn dashed |
| `auth`, `crossBorder` | Optional tags carried into the inspector when the docs state them |

### How the two views meet

- **Runs on.** The logical inspector lists, for every container, the node chain of each instance
  (`Azure East US › AKS Tienda Móvil › namespace tienda-movil · 10–30`). The physical inspector shows,
  for an instance, its logical layer and system.
- **Use cases project onto the infrastructure.** Every logical edge is carried by exactly one thing
  on the physical view: a **co-located call** (both instances on one node, or inside one
  connectivity domain — a cluster, host, namespace or network — with no declared path between them;
  a thin neutral link derived from the logical edge), the **shortest chain of declared paths**
  between the two instances (climbing out of a node is free; descending is allowed only towards the
  target, and after a climb only through a connectivity domain, so a **region** never makes its
  members adjacent), or — when nothing declared connects them — a dashed **no declared path**
  warning link. A use case therefore animates through the real ingress chain
  (client → WAF → front door → firewall → gateway → cluster) rather than through one guessed link,
  and a logical connection with no physical realisation is visible as a finding, not hidden.
- **Hops without an instance** (an actor, an unplaced container) are not drawn and are counted
  under the phase list.

## Capacity (the load simulation)

The base every scenario of the Simulation mode starts from (`scripts/simulation.js`, 8.34.0+). Every
figure comes from a documented row — a descriptor's `## Capacity <!-- LABEL: Capacity -->` table or the
`docs/08` `### … <!-- LABEL: Demand by Use Case -->` table, both read by
`scripts/shared/capacity.ts` — and **a missing figure is a gap, never a
number**: the view paints the instance pending (violet, `? sin dimensionar`) when it receives load and
lists the row that would close the gap. Nothing here is authored by hand except `scenarios`, which come
from the overrides file and are marked as assumptions on the page. `scene-from-docs.js --capacity-check`
prints the block as a table.

```json
"capacity": {
  "unit": "rps", "threshold": 0.7,
  "demand": [ { "useCase": "UC-01", "rps": 76, "sessions": null, "peakFactor": 1, "source": "docs/08 § 10.2 …" },
              { "useCase": "UC-02", "phase": "3", "rps": 12, "sessions": null, "peakFactor": 1, "source": "…" } ],
  "fanout": [],
  "instances": [ { "container": "sgw", "nodes": ["vm-sgw-z1", "vm-sgw-z2"], "replicas": 2, "maxReplicas": 3,
                   "capacityPerReplica": null, "capacityPerReplicaSessions": 3500, "requestsPerTransaction": null,
                   "documentedDemand": null, "documentedSessions": 10000, "flags": [] } ],
  "gaps": [ { "useCase": "UC-04", "field": "demand", "says": "Not documented" },
            { "container": "cache", "field": "capacity_per_replica", "says": "Not documented" } ],
  "scenarios": [ { "name": "Prueba · supuestos", "scale": 1, "demand": {}, "down": [],
                   "overrides": { "cache": { "capacityPerReplica": 2000, "maxReplicas": 3 } }, "source": "…" } ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `unit` | `"rps"` | yes | Every internal figure is requests per second: `tps × requests_per_transaction`, `tpm / 60`, `rpm / 60`. `sessions` stays a gauge beside it |
| `threshold` | number | yes | ρ from which an instance is *at the limit* (default 0.7); a scenario may carry its own |
| `demand` | DemandRow[] | yes | One row per use case from `docs/08`: `useCase`, `rps` or `sessions` (the other `null`), `peakFactor`, `source`; `notDocumented: true` when the row says so. A row with `phase` (8.42.0 — `UC-02 · F3` in the table) gives that phase its own unit and figure inside the use case; the rest keep the flow's |
| `fanout` | [] | yes | Reserved (fan-out per hop is 1); always empty today |
| `instances` | CapacityRow[] | yes | One per container (actors excluded): `container`, `nodes` (where it runs, from `deployment.instances`), `replicas`, `maxReplicas`, `capacityPerReplica` (rps) or `capacityPerReplicaSessions`, `requestsPerTransaction`, `documentedDemand`, `documentedSessions` — `null` where the table says `Not documented` or has no row — `source` (the capacity row's Source cell) and `flags`: `assumed_rpt` (a tps/tpm value converted at ×1 because the ratio is missing), `not_documented:<metric>` per grey row; `requestSize` and `responseSize` (bytes of one request the container receives / one response it returns) and `sessionTransfer` (bytes per second one held session moves toward its client), `null` when the row is absent or `Not documented` — the sizes every hop's bytes are computed from (8.54.0) |
| `gaps` | Gap[] | yes | What would make the simulation complete, one row each: `useCase` (+ `phase`) or `container`, `field` (`demand`, `capacity`, `capacity_per_replica`, `replicas`), `says` (why: `Not documented`, `no Capacity table in the descriptor`, `no row in docs/08 § Demand by Use Case`, `docs/08 not found`) |
| `pricing` | map | no | `{ <deployment node id>: { perGB, currency?, source? } }` from `overrides.capacity.pricing` (8.54.0) — a price per GB for a metered node, an assumption the `metered-transit` finding names as one; a price on a node that is not metered is warned about and never applied |
| `scenarios` | Scenario[] | no | The project's scenarios — assumptions the architect wants on the page, from `overrides.capacity.scenarios[]`, never documentation and never localStorage. `name`, `scale`, `metrics` (8.55.0 — which of `rps` · `sessions` · `bytes` the stage shows when the scenario loads: a load scenario opens on `["rps", "sessions"]`, a traffic scenario on `["bytes"]`; one alone is drawn large; absent = all three), `demand` (map keyed `UC-nn` or `UC-nn/phase` → a number in the flow's unit or `{ "value", "unit" }`), `down` (instance ids), `overrides` (per container or instance id: `replicas`, `maxReplicas`, `capacityPerReplica`, `capacityPerReplicaSessions`), optional `off` (use cases switched off), `isolate` (one use case alone), `threshold`, and `source`, the sentence the page shows as the assumption |

`--base` carries nothing of this block over: it is regenerated from the documents on every run.
`overrides.capacity` merges into it last (objects deep, arrays replaced) — that is how `scenarios` arrive, and
how a project pins a `threshold`; a merged `demand` or `instances` array would replace the documented one, so
leave those to the documents. The scene's `deployment.instances` give each row its
`nodes`; a container with no instance is modelled as one virtual instance by the simulation so its
load still lands somewhere (the physical view will not draw it — `render.js` warns).

## Generation (`scripts/scene-from-docs.js`)

The logical part of the scene — everything above `deployment` and `dossier` — is generated from
the architecture documents. One source per part, and nothing the files do not state:

| Part | Source |
|---|---|
| `project`, `version`, `status`, `architectureType`, `language` | `ARCHITECTURE.md` markers and H1 (`ARCHITECTURE_TYPE` falls back to `docs/03`) |
| `systems`, internal container nodes | `component-cli.ts list` — canonical name, `component_type` (→ `kind`), technology, `**Internal Name:**` (→ `internal`), header `related_adrs` (→ `adrs`), the first two sentences of `## Purpose` (→ `note`) |
| external container nodes | each external descriptor's `## Containers` table; a descriptor without one is a single node named after the system |
| `layers`, a node's `layer`, `owned` | `docs/03` § 4.1 table — `\| **L1 — Name** \| containers \| Yes/No \|` |
| `edges` | `docs/05` `I-nn` rows (`label` = `Protocol · I-nn`; `\`A\` y \`B\`` is two targets, `\`X\`, vía \`Y\`` two hops, a lone unresolved name an actor, a struck-through row nothing) plus every descriptor's `## Communication` table. A row whose endpoint is a **system** resolves through the containers of that system its Description names by canonical name, in order of mention — `\`MS A\` y \`MS B\` consultan el \`Gateway\`` is two parallel sources, `a \`Escritor\`, que los escribe en el \`Cache\`` is a chain. A row that cites an `I-nn` present in `docs/05`, or repeats a `docs/05` edge of the same protocol from the same container into that system, is that row's summary and adds nothing. `jump` when the endpoints are ≥ 2 layers apart |
| `phases` | `docs/04` Phase Catalog rows (`# \| Phase \| On critical path? \| Owner \| Failure mode`): the owner chain — or the phase block's `**Hops**` line — walked over the edge graph; `budget` from `**Latency budget (p95)**`; `kind` from the overrides, else the base scene, else inferred from the hops' protocols and reported |
| `routes` | the phase kinds in use, one route per family, with the base scene's `budget` / `desc` when it had them |
| `useCases` | `docs/04` Flow Inventory rows (`Flow \| Trigger \| Use Case \| Latency Target`) and each `#### Flow N —` block's `**Phases**`, `**Governed by**`, `**Delta**` lines |

**The walk of a chain.** A participant is a container (exact name, unique prefix, containment,
singular form), an explicit pair (`A y B`, both travel), a name covering several containers (the
first travels, the rest go to `extra`), a system, or — none of those — an actor placed on the
layer of its neighbour. Between two containers the hop is the documented edge; with none, a
store fans out from the last visited node that reaches the target, a single documented relay is
inserted, and otherwise the edge is **synthesized** (unlabelled, `routes` of the phase) and
reported. A system is entered through the documented edge from the previous hop (a `·`
alternative may enter from any visited node, crossing only the system just left), crossed through
its own containers to the next participant, or walked to its last container; the other documented
entries light up in `extra`.

**`--base <scene.json>`** carries what the docs do not state: node ids for the same canonical
names (so `deployment.instances` and positions keep pointing at them), `x` / `z`, `code`,
`thesis`, `allDescription`, `theme`, `view`, route `budget` / `desc`, phase `kind`, and the whole
`deployment` block (an instance of a container that no longer exists is reported).

**`--overrides <json>`** is merged last, deep, and survives every regeneration:

```json
{
  "thesis": "The one sentence the model is built to show.",
  "allDescription": "…",
  "nodes":  { "cache": { "code": "K", "z": 4 }, "Base Local de Pedidos": { "x": -2 } },
  "edges":  [ { "a": "sgw", "b": "app", "label": "WSS", "jump": true } ],
  "phases": { "5": { "kind": "online" }, "12": { "kind": "batch", "budget": "≤ 15 min" } },
  "routes": [ { "id": "online", "budget": "≤ 2 s p95" } ],
  "deploymentNodes": { "akamai": { "metered": { "by": "bytes", "direction": "out", "source": "ADR-014" } } },
  "capacity": { "pricing": { "akamai": { "perGB": 0.05, "currency": "USD", "source": "assumption 2026-09-17" } } },
  "theme": "atlas", "view": "logical"
}
```

`nodes` is keyed by id or canonical name, and so is `deploymentNodes` (8.54.0) for a field of a deployment node — `metered`, a `note` — merged into the node the base carries instead of replacing the `deployment.nodes` array; an `edges` entry that names no existing pair creates
the edge (both ids must exist); `routes`, `useCases`, `layers`, `systems` given as arrays
replace the generated list.

**The report** (stderr) is the review: the counts, the actors created, the edges synthesized,
the phase kinds inferred, and the warnings — a row whose system endpoint names no container, a
layer naming an unknown container, a flow without phases, a base instance of an unknown
container, a chain that starts at a system.

## Dossier (Alia's first speed)

```json
"dossier": { "generated": "2026-09-04", "adrs": {
  "ADR-113": { "id": "ADR-113", "title": "Cascada de lectura con conmutación por lag", "status": "Proposed", "date": "2026-08-30",
    "scope": "User", "summary": "…", "consequences": { "positive": ["…"], "negative": ["…"] }, "related": ["ADR-101", "ADR-104"],
    "file": "adr/ADR-113-cascada-con-conmutacion-por-lag.md" } } }
```

Written by `scripts/dossier.js` from the ADR files the scene cites (`nodes[].adrs`,
`useCases[].adrs`, `deployment.nodes[].adrs`). Every field is an extract of the file — the H1
title, the `Status` / `Estado`, `Date` / `Fecha`, `Scope` / `Alcance` and `Amended` / `Enmendado`
fields in either the line or the table layout, the first paragraph of `## Decision` › `### Summary`
(or of the Decision, or of the Context), up to three positive and three negative consequence
bullets (or four general ones), and the `ADR-NNN` ids of the `Related` line. A field the file
does not state is omitted. `render.js` validates the keys and warns about cited ids with no entry.

The other four sections, same rules (extraction only, absent when the source is absent):

| Section | Source | Shape |
|---|---|---|
| `tdrs` | `tdr/TDR-*.md` | keyed by id: `title`, `status` (the frontmatter `status:` key, else the backticked word of `## Status`), `date`, `components: [{ slug, node? }]` (frontmatter `affected-components`, resolved to scene nodes by name or through the descriptor filename), `adrs`, `tags`, `summary` (first paragraph of Description), `impact`, `owner`, `file` |
| `compliance` | `compliance-docs/COMPLIANCE_MANIFEST.md` + each contract | `contracts: [{ type, file, score, status, completeness, generated, requirements: [{ code, name, category?, status, evidence?, owner? }], missing? }]` — the manifest table row, then the contract's requirement tables (those whose header names a Requirement column are preferred) |
| `components` | `docs/components/**/*.md` | keyed by scene node id, matched on the descriptor's H1: the meta fields (`type`, `technology`, `c4`, `deploysAs`, `communicatesVia`, `description`, `componentVersion`, `lastUpdated`) and `sections: [{ title, label?, paragraphs?, bullets?, tables?: [{ label?, headers, rows }] }]`, one per H2 |
| `integrations` | `docs/05-*.md` | `[{ id, from, to, fromNodes, toNodes, protocol?, style?, owner? }]` from every table whose rows start with `I-nn` |
| `findings` | `analysis/*.md`, `analysis/*.html` | `[{ analysis, file, date?, items: [{ id, label, severity?, tier?, fields: { column: value }, nodes: [scene node ids], phys: [deployment node ids] }] }]` — Markdown: every table whose first column is `#` / `ID` and whose rows open with a finding id in the analysis skill's grammar (`C1`, `B1 ⚡`, `K2-01`, `T1-S`, `TB-01`, `T1-01`, `OB-01` … — the first token of the cell; a marker after it is kept under the `#` key of `fields`), the heading giving the tier, rows numbered `1`, `2`, `3` skipped as inventories, a finding listed twice merged into one; HTML: every labelled object in the report's `const data` literal. Severity is normalised to `critical` · `high` · `medium` · `low` · `info` from an explicit Severity / Risk column, else the Tier column, else the id's prefix through the registry in `architecture-analysis/SKILL.md` § Finding IDs, else the section title or impact; labels are resolved to containers by canonical name or descriptor filename slug, and to deployment nodes by name |

## Validation performed by `render.js`

- `layers` and `nodes` non-empty
- every node's `layer` exists; every non-actor node's `system` exists
- every edge references existing nodes
- every phase hop (`path` and `extra`) matches an edge in either direction
- every use-case phase is defined
- with `dossier`: `adrs` is an object keyed by `ADR-NNN` ids and every entry has a title; cited ids with no entry are warned about
- with `deployment`: every node's `tier` and `parent` exist; a node without a tier has an ancestor with one or only contains other nodes; every instance names an existing non-actor container and an existing node; every path endpoint is a node or an instance; `--view physical` needs `deployment`. **Warnings** (not failures): a transport that is not `<TRANSPORT>[:<port>]`, a missing or unregistered `pathClass`, internal containers with no instance

Anything else — names, classification, order — is on the author, and the docs are the check.
