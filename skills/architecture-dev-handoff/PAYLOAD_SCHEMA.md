# Handoff Payload Schema

This document defines the contract between the `architecture-dev-handoff` skill orchestrator (main context) and the `handoff-generator` sub-agent (isolated context).

The orchestrator builds one payload file per selected component and writes it to `/tmp/handoff-payloads/<component-slug>.md`. Each payload is a self-contained, pre-sliced projection of the architecture documentation onto a single component. The sub-agent reads the payload in full and uses it as its sole source of architecture content — it does NOT re-read the project's `docs/` or `adr/` directories.

## Why a payload-based contract

- **Main context stays flat**: the orchestrator reads shared docs once, slices them N times, and spawns N sub-agents. Shared-doc reads do not scale with component count.
- **Sub-agent context stays small**: each sub-agent window carries ~25–40 KB (component file + slice + template + asset section) regardless of project size.
- **Losslessness**: every value the template requires must be present in the payload. If a value is absent from the architecture docs entirely, the orchestrator includes a literal `[NOT DOCUMENTED — add to <file>]` marker in the relevant payload section so the sub-agent can surface it in section D1 (Open Questions and Assumptions) without re-reading anything.

## File format

Payloads are markdown with YAML frontmatter. The orchestrator writes one per component to `/tmp/handoff-payloads/<component-slug>.md`.

### Frontmatter (required)

```yaml
---
component_slug: inbox-hub
component_file: docs/components/notification-inbox-platform/04-inbox-hub.md
component_type: api-service
component_index_position: "04"
asset_types: [openapi, deployment, c4-descriptor]
architecture_version: "2.9.1"
architecture_md_path: /abs/path/to/ARCHITECTURE.md
project_name: Notification Inbox
architect: shadowX4fox
generation_date: "2026-04-18"
doc_language: en
---
```

Field reference:

| Field | Required | Source |
|-------|----------|--------|
| `component_slug` | yes | kebab-case derived from filename (e.g., `04-inbox-hub.md` → `inbox-hub`) |
| `component_file` | yes | repo-relative path to the component doc |
| `component_type` | yes | normalized type token (see type detection table below) |
| `component_index_position` | yes | `NN` prefix from filename, string-quoted to preserve leading zero |
| `asset_types` | yes | array of asset type tokens to generate for this component (`[]` if none) |
| `architecture_version` | yes | value from `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` in `ARCHITECTURE.md`; `unversioned` if absent |
| `architecture_md_path` | yes | absolute path to `ARCHITECTURE.md` (sub-agent may read for navigation if needed — rare) |
| `project_name` | yes | first H1 in `ARCHITECTURE.md` |
| `architect` | no | from `ARCHITECTURE.md` metadata; `Not specified` if absent |
| `generation_date` | yes | ISO date (YYYY-MM-DD) from `date +%Y-%m-%d` |
| `doc_language` | yes | `en` or `es` — set once per session by the orchestrator from architecture-doc language detection (see SKILL.md). Default `en` when ambiguous. Drives template-variant selection for the `c4-descriptor` asset. |
| `shared_refs` | no | optional list of paths (relative to the payload file) that the sub-agent must Read alongside this payload to resolve `> See: <path> § <header>` markers. Currently always `[_shared.md]` when shared excerpts are present, omitted otherwise. Added in v3.13.0 (Item 8 — dedupe). |

### Component type → asset type mapping

The orchestrator scans **multiple component fields** to derive both `component_type` and `asset_types`:

1. **`**Type:**`** — primary signal; first match in the keyword table wins for `component_type` token assignment.
2. **`**Technology:**`, `**Description:**`, `**Communicates via:**`, `**Deploys as:**`** — secondary signals; keyword hits in any of these contribute additional `asset_types` entries (the union semantics below). Real-world docs put the deployment target ("Docker container on AKS") in `**Deploys as:**` and the messaging fabric ("Kafka — outbound") in `**Communicates via:**`, so reading **only** `**Type:**` would miss the deployment.yaml + asyncapi.yaml that those components clearly need.
3. **`<!-- EXPLORER_HEADER … -->` block** (v3.14.0+ headers) — the `technologies:` line is treated as an additional Technology source. Architects often list the wire format (Avro, Protobuf) alongside the runtime stack here even when `**Technology:**` only carries the framework names.
4. **Inline subsection tables under H2/H3 headers `Subscriptions`, `Subscribes To`, `Produces`, `Consumes`, `Topics`, `Streams`, `Events`** — the "Notes" / "Format" / "Envelope" cells frequently encode the serialization format ("Same Avro envelope as …", "Avro / schema-registry validated", "Protobuf"). Scan every row of those tables.
5. **`**Asset Hints:**`** (optional, v3.14.9+) — explicit per-component override. Format: `**Asset Hints:** [openapi, deployment, asyncapi]` or `**Asset Hints:** skip`. When present, this list **replaces** the resolver's output entirely (still augmented with `c4-descriptor` unless the value is `skip`). Use this when the keyword resolver miscategorizes a component or when the architect knows better — the lowest-effort escape hatch from a resolver miss.

Every non-skip component also gets `c4-descriptor` appended to its `asset_types` (it is always-on except for the skip list).

| Keyword match (in any of the scanned fields above) | `component_type` | `asset_types` |
|----------------------------------------------------|------------------|---------------|
| API, REST, GraphQL, gRPC, Service, Endpoint, Backend, BFF | `api-service` | `[openapi, c4-descriptor]` |
| Gateway, API Gateway, Edge, Ingress, Reverse Proxy | `api-service` (also implies deployable — see note) | `[openapi, deployment, c4-descriptor]` |
| Database, DB, Data Store, PostgreSQL, MySQL, MongoDB, Cassandra, DynamoDB | `database` | `[ddl, c4-descriptor]` |
| Redis, Cache, ElastiCache, Memcached, Valkey, KeyDB | `cache` | `[redis, c4-descriptor]` |
| Kubernetes, K8s, Deployment, Pod, AKS, EKS, GKE, OpenShift, ECS, Fargate, Container, Docker, containerized | `k8s-workload` | `[deployment, c4-descriptor]` |
| Consumer, Producer, Queue, Topic, Event, Message, Kafka, RabbitMQ, SQS, SNS, EventBridge, Pub/Sub, NATS | `message-consumer` or `message-producer` | `[asyncapi, c4-descriptor]` + `[avro]` if any scanned field contains case-insensitive `avro`, `*.avsc`, or `Schema Registry` (Confluent Avro) + `[protobuf]` if any scanned field contains `protobuf`, `proto3`, `*.proto`, or `gRPC` |
| CronJob, Cron, Scheduled, Batch, Scheduler | `scheduled-job` | `[cronjob, c4-descriptor]` |
| (combined — e.g., API service deployed on K8s with a DB, or Gateway publishing to Kafka) | compound (use the primary `**Type:**`-row token) | multiple entries (e.g., `[openapi, deployment, ddl, c4-descriptor]` or `[openapi, deployment, asyncapi, c4-descriptor]`) |
| Library, SDK, Utility, Config, Documentation, Schema-only | `skip` | `[]` (no assets; no `c4-descriptor` either) |

**Gateway/Edge note** (v3.14.9+): "Gateway/BFF/Edge/Ingress/Reverse Proxy" archetypes are first-class deployables — they always need `deployment.yaml` alongside `openapi.yaml` because they always run as containers/pods. The Gateway row encodes this directly so the resolver does not depend on the architect also writing "K8s" or "Pod" in the same component file.

**Union semantics**: a component may match multiple rows; `asset_types` is the deduplicated union of all matched rows' outputs. `c4-descriptor` is deduplicated like any other token. Example: a "GraphQL Gateway on AKS publishing to Kafka" matches three rows (Gateway → `[openapi, deployment]`, K8s → `[deployment]`, Kafka → `[asyncapi]`) and `c4-descriptor`, producing `[openapi, deployment, asyncapi, c4-descriptor]`.

**Asset Hints override** (v3.14.9+): when `**Asset Hints:**` is present in the component file, parse it as a flow sequence (`[openapi, deployment]`) or the literal `skip`. Replace the resolver's output with the parsed list (`asset_types = parsed_hints + [c4-descriptor]` deduplicated; or `asset_types = []` and `component_type = skip` for the literal `skip`). Log `asset_hints_override = true` for the component in `CONTEXT_RESULT` so the orchestrator's Phase 7 report can surface which components used the override.

### Body sections (required in this order)

Each section is a heading + body. The sub-agent uses section names verbatim to locate content — do NOT rename.

```markdown
## Component (structured)

```yaml
component:
  name: Inbox Hub
  type: api-service
  technology: [Java 21, Spring Boot 3.3, R2DBC]
  description: |
    <verbatim overview prose from the component file's intro section>
  apis:
    - method: GET
      path: /v1/inbox
      request: {...}
      response: {...}
  schema:
    tables:
      - name: inbox_messages
        columns: [...]
  config:
    env_vars: [...]
    ports: [...]
  scaling:
    hpa: {min: 2, max: 10, cpu_target: 70}
    slo: {p95_latency_ms: 200, availability: 99.9}
  failure_modes: [...]
  dependencies: [...]
```

The orchestrator parses the component file (markdown header + table parser, line scan) into the YAML structure above. Verbatim sections (overview prose) go under `description: |` literal blocks so wording is preserved exactly. Every documented field maps to a typed key; nothing is invented and nothing is dropped.

**Fallback**: if any extraction step fails (unrecognized table format, missing expected header), the orchestrator emits the raw component file under a `## Component File (raw)` section instead of `## Component (structured)`. The sub-agent recognizes both and falls back to today's behaviour for the raw variant. A warning is logged so the parser can be improved over time.

## Integrations

<all entries from docs/05-integration-points.md where the component is the source OR the target, formatted as the original doc's rows/entries — do not reformat>

If no integrations involve this component, write exactly:
No integrations reference this component in docs/05-integration-points.md.

## Flows

<all flows from docs/04-data-flow-patterns.md where the component appears as a participant, including the full flow description (prose + any sequence diagrams in the flow's block)>

If no flows involve this component, write:
No flows reference this component in docs/04-data-flow-patterns.md.

## Security Requirements

<all paragraphs, table rows, and bullets from docs/07-security-architecture.md that name this component OR its technology stack, preserved verbatim>

If nothing component-specific is documented, write:
No component-specific security requirements in docs/07-security-architecture.md — see global policies in that file.
Then append: [NOT DOCUMENTED — add component-specific security section to docs/07-security-architecture.md]

## Perf Targets

<HPA row, SLO row, latency targets, TPS targets, resource limits for this component from docs/08-scalability-and-performance.md>

If nothing component-specific is documented, write:
[NOT DOCUMENTED — add component-specific perf targets to docs/08-scalability-and-performance.md]

## Ops Config

<env vars, deployment stanzas, monitoring/alerting rules, dashboard specs for this component from docs/09-operational-considerations.md>

If nothing component-specific is documented, write:
[NOT DOCUMENTED — add component-specific ops config to docs/09-operational-considerations.md]

## Relevant ADRs

For each ADR in adr/*.md whose body matches the component name, its technology, or its domain keywords, include:

- ADR-NNN — <title> — <status> — <path>
  <body excerpt, up to ~30 lines, focused on the paragraphs that reference the component>

If no ADRs match, write:
No ADRs in adr/ reference this component, its technology, or its domain.
```

## Shared excerpts (`_shared.md`) — v3.13.0

For multi-component runs, the orchestrator deduplicates content that appears verbatim in three or more component payloads (typically org-wide ADRs like ADR-012 mTLS, ADR-014 WAF, plus shared paragraphs from `docs/07`/`08`/`10`). The duplicated excerpt is written once to `/tmp/handoff-payloads/_shared.md` under a stable header:

```markdown
## Shared: ADR-012

<verbatim excerpt — same as it would have appeared in the per-component payload>

## Shared: 10.1.2-sidecar-tax

<paragraph from docs/08-scalability-and-performance.md §10.1.2>
```

In each per-component payload, the orchestrator replaces the duplicated content with a one-line marker:

```markdown
> See: _shared.md § Shared: ADR-012
```

The sub-agent (PHASE 0 Step 0.3) Reads `_shared.md` once per spawn and resolves these markers inline before PHASE 2 fill. Net effect: ~30% smaller payloads when 3+ components share excerpts; the extra Read of `_shared.md` is a single ~5–15 KB file shared across the entire batch and lands inside the prompt-cache window.

If only one or two components share an excerpt, leave it inline — the deduplication overhead isn't worth it. The orchestrator's threshold is "≥3 components".

## Orchestrator construction rules

1. **Read shared docs exactly once per invocation** (not per component). The shared set:
   - `docs/01-system-overview.md`
   - `docs/04-data-flow-patterns.md`
   - `docs/05-integration-points.md`
   - `docs/06-technology-stack.md`
   - `docs/07-security-architecture.md`
   - `docs/08-scalability-and-performance.md`
   - `docs/09-operational-considerations.md`
   - all files in `adr/`

2. **Slice each shared doc per component** using grep/regex matching on the component's name, its `Type` field, and the technology names listed in its `**Technology:**` field.

3. **Write payloads** to `/tmp/handoff-payloads/<component-slug>.md`. Create the `/tmp/handoff-payloads/` directory first (`mkdir -p`).

4. **Pass payload path to sub-agent** in the prompt — do NOT inline the payload content in the prompt, as the goal is to keep the main-context / sub-agent-prompt size small.

## Sub-agent consumption rules

1. **Read the payload file in full, once.** The payload is the sub-agent's sole architecture source.
2. **Do NOT re-read** any file under `docs/` or `adr/`. If the sub-agent needs information not in the payload, treat it as `[NOT DOCUMENTED]`.
3. **Allowed plugin-internal reads** — `HANDOFF_TEMPLATE.md`, `SECTION_EXTRACTION_GUIDE.md`, `assets/_index.md`, and the line-ranged slice of `ASSET_GENERATION_GUIDE.md` for matched asset types.
4. **Forbidden broad reads** — never read the full `ASSET_GENERATION_GUIDE.md`; always use the line range from `assets/_index.md`.

## Payload lifecycle

- Created: by the orchestrator in Phase 1.5 of `SKILL.md`, one per selected component
- Consumed: by the sub-agent in PHASE 0 Step 0.1
- Retention: payloads remain in `/tmp/handoff-payloads/` for the life of the `/tmp` directory. Cleanup is not required — the next invocation overwrites them.

## Example: minimal payload for a cache component

```markdown
---
component_slug: session-cache
component_file: docs/components/api-platform/03-session-cache.md
component_type: cache
component_index_position: "03"
asset_types: [redis, c4-descriptor]
architecture_version: "1.2.0"
architecture_md_path: /home/me/proj/ARCHITECTURE.md
project_name: API Platform
architect: alice
generation_date: "2026-04-18"
doc_language: en
---

## Component (structured)

```yaml
component:
  name: Session Cache
  type: cache
  layer: Integration
  technology: [Redis 7.2]
  description: |
    Distributed Redis cache holding short-lived session tokens for the API
    Platform. TLS in transit; values are opaque tokens with no PII.
  config:
    env_vars: [REDIS_URL, REDIS_TLS_ENABLED]
    ports: [6379]
  scaling:
    slo: {p95_get_latency_ms: 1, peak_tps_read: 5000, peak_tps_write: 1000}
  dependencies: []
```

## Integrations

- Inbound: Gatekeeper (Spring Boot) — reads session tokens, protocol: RESP
- Outbound: (none)

## Flows

Flow: User login — Gatekeeper writes session to cache with 30min TTL. See docs/04-data-flow-patterns.md §3.1.

## Security Requirements

- Encryption in transit: TLS required for all Redis connections (docs/07-security-architecture.md §6.2)
- No PII stored in cache values (docs/07-security-architecture.md §6.4)

## Perf Targets

- p95 GET latency: ≤ 1 ms
- Peak TPS: 5,000 reads / 1,000 writes

## Ops Config

- REDIS_URL env var per environment
- Monitoring: redis_connected_clients, redis_memory_used_bytes (docs/09-operational-considerations.md §9.3)

## Relevant ADRs

- ADR-042 — Redis as session store — Accepted — adr/ADR-042-redis-session-store.md
  <excerpt>
```

---

**Schema version**: 2.0.0 (v3.13.0 — `## Component File` raw markdown replaced by `## Component (structured)` YAML block; added `shared_refs` frontmatter and `> See: _shared.md § ...` body marker; raw markdown still accepted as `## Component File (raw)` fallback)

**Manifest schema_version field**: `"2"` (Item 7 manifest invalidates entries created against `"1"`, forcing one-time full regen on upgrade.)

**Consumers**: `skills/architecture-dev-handoff/SKILL.md`, `agents/generators/handoff-generator.md`, `agents/builders/handoff-context-builder.md`
