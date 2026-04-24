# Handoff Payload Schema

This document defines the contract between the `architecture-dev-handoff` skill orchestrator (main context) and the `handoff-generator` sub-agent (isolated context).

The orchestrator builds one payload file per selected component and writes it to `/tmp/handoff-payloads/<component-slug>.md`. Each payload is a self-contained, pre-sliced projection of the architecture documentation onto a single component. The sub-agent reads the payload in full and uses it as its sole source of architecture content — it does NOT re-read the project's `docs/` or `adr/` directories.

## Why a payload-based contract

- **Main context stays flat**: the orchestrator reads shared docs once, slices them N times, and spawns N sub-agents. Shared-doc reads do not scale with component count.
- **Sub-agent context stays small**: each sub-agent window carries ~25–40 KB (component file + slice + template + asset section) regardless of project size.
- **Losslessness**: every value the template requires must be present in the payload. If a value is absent from the architecture docs entirely, the orchestrator includes a literal `[NOT DOCUMENTED — add to <file>]` marker in the relevant payload section so the sub-agent can surface it in Section 15 without re-reading anything.

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

### Component type → asset type mapping

The orchestrator uses the component's `**Type:**` field from its doc to determine both `component_type` and `asset_types`. Every non-skip component also gets `c4-descriptor` appended to its `asset_types` (it is always-on except for the skip list).

| `**Type:**` keyword match | `component_type` | `asset_types` |
|----------------------------|------------------|---------------|
| API, REST, GraphQL, gRPC, Service | `api-service` | `[openapi, c4-descriptor]` |
| Database, DB, Data Store, PostgreSQL, MySQL, MongoDB | `database` | `[ddl, c4-descriptor]` |
| Redis, Cache, ElastiCache, Memcached, Valkey | `cache` | `[redis, c4-descriptor]` |
| Kubernetes, K8s, Deployment, Pod | `k8s-workload` | `[deployment, c4-descriptor]` |
| Consumer, Producer, Queue, Topic, Event, Message, Kafka, RabbitMQ | `message-consumer` or `message-producer` | `[asyncapi, c4-descriptor]` + `[avro]` or `[protobuf]` if serialization format documented |
| CronJob, Cron, Scheduled, Batch | `scheduled-job` | `[cronjob, c4-descriptor]` |
| (combined — e.g., API service deployed on K8s with a DB) | compound (e.g., `api-service`) | multiple entries (e.g., `[openapi, deployment, ddl, c4-descriptor]`) |
| Library, SDK, Utility, Config, Documentation | `skip` | `[]` (no assets; no `c4-descriptor` either) |

A component may match multiple types; `asset_types` is a union. `c4-descriptor` is deduplicated like any other token.

### Body sections (required in this order)

Each section is a heading + body. The sub-agent uses section names verbatim to locate content — do NOT rename.

```markdown
## Component File

<full, verbatim copy of `docs/components/<path>/NN-<slug>.md`>

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

## Component File

# Session Cache

**Type:** Redis Cache
**Layer:** Integration
**Technology:** Redis 7.2

... <rest of component file> ...

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

**Schema version**: 1.0.0
**Consumers**: `skills/architecture-dev-handoff/SKILL.md`, `agents/handoff-generator.md`
