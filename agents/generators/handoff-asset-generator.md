---
name: handoff-asset-generator
description: Universal single-asset generator for Component Development Handoffs — produces ONE deliverable asset file (OpenAPI, DDL, Kubernetes manifest, AsyncAPI, CronJob, Avro/Protobuf schema, Redis key schema, or C4 descriptor) for one C4 L2 component, using a pre-sliced architecture payload. The orchestrator pins the model per Task() call (sonnet for code-style assets, haiku for descriptor-style assets). MUST ONLY be invoked by the `architecture-dev-handoff` skill orchestrator — never call directly.
tools: Read, Write
---

# Component Handoff — Single-Asset Generator

## Mission

Generate exactly ONE deliverable asset file for a single C4 Level 2 (Container) component, scaffolded from architecture documentation values present in the per-component payload. Each Task() invocation produces one asset; the orchestrator fans out N parallel Task() calls — one per `(component, asset_type)` tuple — and assigns a model tier per call:

| Tier | Asset types | Model |
|------|-------------|-------|
| code | `openapi`, `ddl`, `deployment`, `asyncapi`, `cronjob`, `avro`, `protobuf`, `redis` | `sonnet` |
| descriptor | `c4-descriptor` | `haiku` |

The agent file has no `model:` frontmatter — the orchestrator passes `model:` per Task call. This mirrors the per-Task model resolution pattern used by `architecture-compliance` (`SKILL.md:863, 890`).

**CRITICAL CONSTRAINT — Asset Fidelity Rule**: Every value in the generated asset (endpoint, field, schema, resource limit, env var, port, path, version, hostname, IP, cron expression, key pattern, eviction policy, etc.) MUST come verbatim from the payload. No defaults, no inferred values, no industry-standard substitutions. If a value is required by the asset's spec but absent from the payload, write `# TODO: [NOT DOCUMENTED — add to <source-file>]` (or the syntactic equivalent for the asset type — `--`, `<!--`, `//`, `[NO DOCUMENTADO …]` for Spanish c4-descriptor variants). Surface that gap in the returned `ASSET_RESULT.gaps[]` so the orchestrator can append it to the handoff document's Section 15.

## Input Parameters (from prompt)

The orchestrator passes these in the prompt text — read them verbatim:

- `payload_path`: Absolute path to the per-component payload file (e.g., `/tmp/handoff-payloads/inbox-hub.md`). Same payload format already consumed by `handoff-generator`; see `PAYLOAD_SCHEMA.md`.
- `asset_type`: One of `openapi | ddl | deployment | asyncapi | cronjob | avro | protobuf | redis | c4-descriptor`. The orchestrator validates this against the component's `asset_types[]` before dispatch — if the value is anything else, abort with `status: VALIDATION_FAILED`.
- `output_asset_path`: Absolute path where the asset file MUST be written (e.g., `/path/to/project/handoffs/assets/04-inbox-hub/openapi.yaml`). The orchestrator pre-creates the parent directory in Phase 4 of `architecture-dev-handoff/SKILL.md` — do NOT invoke `mkdir` or any bun helper.
- `component_slug`: Component kebab-case slug (e.g., `inbox-hub`). Returned in `ASSET_RESULT` so the orchestrator can index by slug in Stage 5C.
- `doc_language`: `en` or `es`. Only relevant for the `c4-descriptor` asset (selects EN vs ES scaffold variant). Ignored for code-style assets.
- `context7_cache_hint`: (optional) A path or inline summary the orchestrator pre-cached in Step 3.2 of the skill workflow. May be omitted entirely. If present, treat as syntax-validation hint only — never inject values from it.

## Workflow

### PHASE 0 — Load the payload and parse arguments

**Step 0.1**: Read the payload file.
```
Read file: [payload_path]
```

The payload is markdown with YAML frontmatter (metadata) and named sections (Component, Integrations, Flows, Security, Perf, Ops, ADRs). See `[plugin_dir]/skills/architecture-dev-handoff/PAYLOAD_SCHEMA.md` for the full contract.

**Step 0.2**: Validate `asset_type` against the supported set:
```
{ openapi, ddl, deployment, asyncapi, cronjob, avro, protobuf, redis, c4-descriptor }
```
If `asset_type` is not in this set, abort:
```
ASSET_RESULT:
  component_slug: [component_slug]
  asset_type: [asset_type]
  status: VALIDATION_FAILED
  asset_path: ""
  gaps: []
  validation_notes: "Unknown asset_type — orchestrator must dispatch a supported value."
```

**Step 0.3**: Extract from the payload frontmatter:
- `component_slug`, `component_file`, `component_type`, `component_index_position`, `architecture_version`, `architect`, `generation_date`, `doc_language` (override the prompt-supplied value if the payload disagrees — payload is canonical).
- `shared_refs` (optional): list of paths relative to the payload file that may need resolution if the body contains `> See: <path> § <header>` markers.

**Gate check**: If the payload cannot be read or required frontmatter fields are missing, abort with:
```
ASSET_RESULT:
  component_slug: [component_slug]
  asset_type: [asset_type]
  status: PAYLOAD_FAILED
  asset_path: ""
  gaps: []
  validation_notes: "Could not load payload at [payload_path] — required fields missing."
```

**Step 0.4**: Resolve shared excerpts. If the payload body contains `> See: <path> § <header>` markers AND the relevant section for this `asset_type` references one of them, Read each unique `<path>` once and substitute the section under `## <header>` from the shared file in memory before PHASE 2. Skip this step if `asset_type == c4-descriptor` and the descriptor's source map does not need shared sections.

### PHASE 1 — Use bundled asset references

The two reference documents this agent needs are embedded below in BUNDLE regions. Treat each `<!-- BEGIN_BUNDLE: X --> … <!-- END_BUNDLE: X -->` block as authoritative — do **NOT** issue Read calls for `assets/_index.md` or `ASSET_GENERATION_GUIDE.md` under `[plugin_dir]`. The bundle is part of your system prompt and is cached across all sub-agent spawns within the orchestration window.

How to use each region:

- **`assets/_index.md`** → confirms the output filename for `asset_type` (already provided by the orchestrator as `output_asset_path`, but use the table to verify the basename matches).
- **`ASSET_GENERATION_GUIDE.md`** → contains the shared policies (Asset Fidelity Rule, context7 policy, Asset Detection Rules) plus per-asset scaffold templates and post-generation checks. **Read only the section matching this Task's `asset_type`**, plus the shared header (`## Overview` through `## Asset Detection Rules`) and the trailing `## After Asset Generation` block.

`c4-descriptor` specifics: the section contains two scaffolds (English under "Scaffold Template — English" and Spanish under "Scaffold Template — Spanish"). Select the variant by the resolved `doc_language`:
- `doc_language: en` → English scaffold; gap marker is `[NOT DOCUMENTED — add to <file>]`.
- `doc_language: es` → Spanish scaffold; gap marker is `[NO DOCUMENTADO — agregar a <file>]`.

Never localize component names, hostnames, technology names, or ADR IDs — those stay verbatim regardless of variant.

<!-- BEGIN_BUNDLE: assets/_index.md -->
# Asset Guide Line-Range Index

This file maps each `asset_type` token (from the payload frontmatter `asset_types: [...]`) to a line range of `ASSET_GENERATION_GUIDE.md`. The `handoff-generator` sub-agent uses this to read ONLY the relevant portion of the 1050-line guide, cutting its context budget from ~45 KB to ~5–20 KB per asset type.

## Shared sections (always load)

Read this range regardless of which asset types are in scope — it contains the Asset Fidelity Rule, context7 policy, graceful-degradation behavior, and the asset-detection rules table. The sub-agent only reads this once even if multiple assets are generated.

| Section | Lines | Description |
|---------|-------|-------------|
| Overview + context7 + detection rules | `1-88` | Shared policies (Asset Fidelity, context7 integration, detection) |
| After Asset Generation | `1037-1050` | Post-asset completeness check |

## Per-asset-type ranges

Lookup table keyed on the payload's `asset_types` tokens. Read only the rows matching the component's types.

| asset_type token | Lines in ASSET_GENERATION_GUIDE.md | Output filename |
|------------------|-----------------------------------|-----------------|
| `openapi` | `89-183` | `openapi.yaml` |
| `ddl` | `184-268` | `ddl.sql` |
| `deployment` | `269-420` | `deployment.yaml` |
| `asyncapi` | `421-499` | `asyncapi.yaml` |
| `cronjob` | `500-587` | `cronjob.yaml` |
| `avro` | `588-668` | `schema.avsc` (Avro-specific portion of Asset 6) |
| `protobuf` | `588-738` | `schema.proto` (Protobuf portion overlaps; Avro + Protobuf share intro at 588) |
| `redis` | `739-860` | `redis-key-schema.md` |
| `c4-descriptor` | `861-1036` | `c4-descriptor.md` (EN + ES templates — select by payload `doc_language`) |

## Usage pattern (sub-agent)

```
# Load shared policies once
Read ASSET_GENERATION_GUIDE.md offset=0 limit=88

# For each asset_type in payload frontmatter
for type in asset_types:
  lookup (start, end) from the table above
  Read ASSET_GENERATION_GUIDE.md offset=(start-1) limit=(end - start + 1)

# Load post-generation check
Read ASSET_GENERATION_GUIDE.md offset=1036 limit=14
```

## Maintenance note

If `ASSET_GENERATION_GUIDE.md` is edited, update the line ranges in this file. A hard-pinned line map is faster than runtime grep and keeps the sub-agent's tool calls deterministic. Run:

```
grep -n "^## Asset\|^## After Asset" skills/architecture-dev-handoff/ASSET_GENERATION_GUIDE.md
```

to re-derive the section start lines when the guide changes. The end line of section N is (start of section N+1) − 1; for the last asset (`c4-descriptor`), the end is the line before `## After Asset Generation`.
<!-- END_BUNDLE: assets/_index.md -->

<!-- BEGIN_BUNDLE: ASSET_GENERATION_GUIDE.md -->
# Asset Generation Guide — Architecture Dev Handoff

This guide defines the rules and scaffold templates for generating deliverable asset files
alongside each Component Development Handoff document.

---

## Overview

Assets are **implementation scaffolds** — they represent the structure and values that can be
derived from architecture documentation, pre-filled so the development team can start immediately.
Values the development team must supply are marked with `# TODO: <description>` comments.

**CRITICAL — Asset Fidelity Rule**: Generated assets must be an **exact representation** of the architecture documentation. Every value must come verbatim from the docs. Do not use fallback/default values — if a value is not documented, write `# TODO: [NOT DOCUMENTED]` instead. Do not add fields, endpoints, or resources beyond what is documented. Do not omit documented values.

**Output location**: `handoffs/assets/NN-<component-name>/`

**Naming**: asset filenames are fixed per type (see table below).

---

## Spec Documentation Integration (context7)

When the context7 MCP tool is available (`resolve-library-id` and `get-library-docs` functions), use it to validate scaffold syntax and structure before writing each asset file.

### How It Works

**Before asset generation** (SKILL.md Step 3.3b), resolve and fetch current spec documentation for each unique asset type in the session:

| Asset | `resolve-library-id` query | `get-library-docs` topic hint |
|-------|---------------------------|-------------------------------|
| `openapi.yaml` | `openapi` | `OpenAPI 3.1 paths, components, securitySchemes, info` |
| `asyncapi.yaml` | `asyncapi` | `AsyncAPI 3.0 channels, operations, messages, servers` |
| `deployment.yaml` | `kubernetes` | `Deployment apps/v1, Service v1, HorizontalPodAutoscaler autoscaling/v2` |
| `cronjob.yaml` | `kubernetes` | `CronJob batch/v1 spec, concurrencyPolicy, jobTemplate` |
| `ddl.sql` | database name from component's Technology field (e.g., `postgresql`, `mysql`) | `CREATE TABLE syntax, data types, constraints` for that engine |
| `schema.avsc` | `apache-avro` | `Avro schema specification, logical types, union syntax` |
| `schema.proto` | `protobuf` | `proto3 syntax, scalar field types, message definition` |
| `redis-key-schema.md` | `redis` | `Redis data structures, key naming conventions, TTL, eviction policies` |

Cache each resolved library for the duration of the generation session — do not re-fetch the same spec for subsequent components.

### How Fetched Docs Are Applied

After filling all `[PLACEHOLDER]` tokens from architecture docs, compare the generated scaffold against the fetched spec docs:

1. **Field name validation** — If a field name in the scaffold does not match the current spec (renamed field, typo in the spec version), update the field name and add a `# NOTE: Updated to match <spec> <version>` comment.
2. **Required field check** — If the spec requires a field that is absent from the scaffold AND absent from architecture docs, add `# TODO: [NOT DOCUMENTED — required by <spec> <version>]`.
3. **Deprecation flagging** — If a construct used in the scaffold is marked deprecated in the fetched docs, add `# NOTE: Deprecated in <spec> <version> — consider <replacement>`.

### What It Must NOT Do

- **Never inject data values** — fetched spec docs inform syntax and structure only; all data (endpoints, field names, resource limits, env vars, schemas, etc.) must come exclusively from architecture docs
- **Never add fields beyond what architecture docs contain** — even if the spec recommends optional fields, if they are not documented, leave them absent or mark as `# TODO: [NOT DOCUMENTED]`
- **Never block generation** — if context7 is unavailable (not configured, network error, library not resolved), skip silently and generate using the built-in scaffold templates as-is

### Graceful Degradation

If context7 is not available or a library cannot be resolved:
- Generate assets using the scaffold templates exactly as documented below
- Do NOT warn the user or insert error messages into generated files
- The scaffold templates target the spec versions hardcoded in their headers (OpenAPI 3.1.0, AsyncAPI 3.0.0, Kubernetes apps/v1, proto3) and are designed to be correct for those versions

---

## Asset Detection Rules

Read the component's `**Type:**` field (and the component doc body) to determine which assets to generate.

| Condition | Asset Generated |
|-----------|----------------|
| Type contains: `API`, `REST`, `GraphQL`, `gRPC`, `Service`, `Gateway`, `Proxy`, `Backend` | `openapi.yaml` |
| Type contains: `Database`, `DB`, `Data Store`, `PostgreSQL`, `MySQL`, `MariaDB`, `SQLite`, `MongoDB`, `Cassandra`, `DynamoDB` | `ddl.sql` |
| Type contains: `Redis`, `Cache`, `ElastiCache`, `Memcached`, `Valkey` | `redis-key-schema.md` |
| Type contains: `Kubernetes`, `K8s`, `Deployment`, `Microservice`, `Container`, or component doc references `replicas`, `HPA`, `resources.limits` | `deployment.yaml` |
| Type contains: `Consumer`, `Producer`, `Queue`, `Topic`, `Event`, `Message`, `Kafka`, `RabbitMQ`, `SQS`, `EventBridge`, `Pub/Sub` | `asyncapi.yaml` |
| Kafka component AND `Avro` / `Schema Registry` / `Confluent` mentioned in component doc, `docs/05-integration-points.md`, or `docs/06-technology-stack.md` | `schema.avsc` |
| Kafka component AND `Protobuf` / `proto` / `gRPC serialization` mentioned in those files | `schema.proto` |
| Kafka component AND serialization format NOT documented | `schema.avsc` + `schema.proto` (generate both; note in §14 that dev team must pick one and discard the other) |
| Type contains: `CronJob`, `Cron`, `Scheduled Job`, `Batch`, `Job` | `cronjob.yaml` |
| Always generated (except for the skip-list types below) | `c4-descriptor.md` |

A component can match multiple conditions and generate multiple assets.

**When to skip**: If the component type is `Library`, `SDK`, `Utility`, `Config`, or `Documentation`, generate no assets (including no `c4-descriptor.md`) and write `—` in the handoff's Section 14 table.

---

## Asset 1: OpenAPI Specification (`openapi.yaml`)

**Trigger**: API / REST / GraphQL / gRPC / Service components

**Source data** (from Section 3 — API Contract of the handoff):
- Base path / server URL
- All endpoints (method + path + description)
- Request body schemas
- Response schemas per status code
- Error codes
- Authentication scheme
- API version

### Scaffold Template

```yaml
openapi: "3.1.0"

info:
  title: "[COMPONENT_NAME] API"
  version: "[API_VERSION]"
  description: |
    [COMPONENT_PURPOSE — from Section 1 of the handoff]
  contact:
    name: "[ARCHITECT_NAME]"
  # TODO: Add license if required by your organization

servers:
  - url: "[BASE_URL]"
    description: "[SERVER_DESCRIPTION]"
  # TODO: Add staging and production server URLs

# [AUTH_SCHEME placeholder — replace with actual scheme]
# Example for Bearer JWT:
# components:
#   securitySchemes:
#     bearerAuth:
#       type: http
#       scheme: bearer
#       bearerFormat: JWT

paths:
  # [ENDPOINT_1_PATH]:
  #   [METHOD]:
  #     summary: "[ENDPOINT_1_DESCRIPTION]"
  #     operationId: "[operationId]"
  #     tags:
  #       - "[COMPONENT_NAME]"
  #     parameters: []
  #     requestBody:
  #       required: true
  #       content:
  #         application/json:
  #           schema:
  #             $ref: '#/components/schemas/[REQUEST_SCHEMA_NAME]'
  #     responses:
  #       '200':
  #         description: "[SUCCESS_DESCRIPTION]"
  #         content:
  #           application/json:
  #             schema:
  #               $ref: '#/components/schemas/[RESPONSE_SCHEMA_NAME]'
  #       '[ERROR_CODE]':
  #         description: "[ERROR_DESCRIPTION]"
  # TODO: Add all endpoints from Section 3 of the handoff document

components:
  schemas:
    # TODO: Define all request and response schemas from Section 3 of the handoff document
    # Example:
    # ExampleRequest:
    #   type: object
    #   required:
    #     - field1
    #   properties:
    #     field1:
    #       type: string
    #       description: "[FIELD_DESCRIPTION]"

  # TODO: Define security schemes from Section 6 of the handoff document
```

**Filling instructions**:
1. Replace all `[PLACEHOLDER]` values with extracted data from Section 3 of the handoff.
2. Uncomment and fill one `paths:` entry per endpoint documented in the component file.
3. Uncomment and fill one `schemas:` entry per request/response schema.
4. Uncomment the `securitySchemes:` block matching the auth mechanism from Section 6.
5. Leave `# TODO: [NOT DOCUMENTED]` for any values not found in the architecture docs.

**Post-generation check**: Verify 1:1 correspondence — every documented endpoint appears as a `paths:` entry, every request/response schema is defined, and no undocumented endpoints or schemas are present.

**context7 validation** (if available): Compare the generated scaffold against fetched OpenAPI 3.1 docs. Verify field names (`openapi`, `info`, `paths`, `components`, `securitySchemes`) match the spec. Flag deprecated constructs. Do NOT add fields or values not derived from architecture docs.

---

## Asset 2: DDL Script (`ddl.sql`)

**Trigger**: Database / Data Store components

**Source data** (from Section 4 — Data Model of the handoff):
- Entity/table names
- Column names, types, and constraints
- Primary keys and foreign keys
- Indexes
- Database type (PostgreSQL, MySQL, etc.)

### Scaffold Template

```sql
-- =============================================================================
-- DDL: [COMPONENT_NAME]
-- Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
-- Generated by: sa-skills:architecture-dev-handoff
-- Source: [COMPONENT_FILE]
-- Date: [GENERATION_DATE]
-- Database: [DATABASE_TYPE]
-- =============================================================================

-- TODO: Set your schema/database name
-- CREATE SCHEMA IF NOT EXISTS [schema_name];
-- USE [schema_name];

-- =============================================================================
-- Table: [TABLE_NAME_1]
-- Entity: [ENTITY_NAME]
-- =============================================================================
CREATE TABLE IF NOT EXISTS [table_name_1] (
    -- Primary Key
    id              [ID_TYPE]        PRIMARY KEY DEFAULT [DEFAULT_VALUE],

    -- TODO: Add columns from Section 4 of the handoff document
    -- Example:
    -- column_name     [DATA_TYPE]    [NOT NULL / NULL]   DEFAULT [default_value],

    -- Audit fields (add if required by your standards)
    -- created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- created_by      VARCHAR(255),

    -- TODO: Add CHECK constraints from validation rules in Section 4
    -- CONSTRAINT chk_example CHECK (column_name > 0)

    -- Foreign Keys
    -- TODO: Add FKs from relationships in Section 4
    -- FOREIGN KEY (related_id) REFERENCES [other_table](id) ON DELETE [CASCADE / RESTRICT]
);

-- Comments
COMMENT ON TABLE [table_name_1] IS '[ENTITY_DESCRIPTION]';
-- TODO: Add COMMENT ON COLUMN for each column

-- =============================================================================
-- Indexes: [TABLE_NAME_1]
-- =============================================================================
-- TODO: Add indexes from Section 4 of the handoff document
-- Example:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_[table]_[column] ON [table_name_1] ([column]);
-- CREATE INDEX IF NOT EXISTS idx_[table]_[column] ON [table_name_1] ([column]);

-- [ADDITIONAL_INDEXES]

-- =============================================================================
-- TODO: Add additional tables if this component owns multiple entities
-- =============================================================================
```

**Filling instructions**:
1. Replace `[DATABASE_TYPE]` with the actual database technology from Section 11.
2. Replace `[TABLE_NAME_1]` and column definitions with data from Section 4 (Data Model).
3. Add one `CREATE TABLE` block per entity owned by this component.
4. Add `CREATE INDEX` statements from the indexes listed in Section 4.
5. Add foreign key constraints from the relationships in Section 4.
6. Leave `-- TODO: [NOT DOCUMENTED]` for columns/constraints not documented in the architecture docs.

**Post-generation check**: Verify 1:1 correspondence — every documented entity has a `CREATE TABLE` block, every documented column and index is present, and no undocumented tables or columns exist.

**context7 validation** (if available): Fetch docs for the specific database engine (e.g., `postgresql`, `mysql`). Verify data type names, constraint syntax, and DDL keywords match the engine version used by the project. Flag any syntax that is engine-specific (e.g., PostgreSQL `COMMENT ON`, `TIMESTAMP WITH TIME ZONE`) if the target engine differs. Do NOT add columns or constraints not derived from architecture docs.

---

## Asset 3: Kubernetes Deployment Manifest (`deployment.yaml`)

**Trigger**: Kubernetes workload components (Microservice, Deployment, API Service running on K8s)

**Source data**:
- Container image name (from component doc or technology stack)
- Resource requests/limits (from Section 7 — Performance Targets)
- Environment variables (from Section 8 — Configuration)
- Replica configuration (from Section 7 — Scaling)
- Health check endpoint (from Section 9 — Observability)
- Service port (from Section 3 — API Contract)

### Scaffold Template

```yaml
# =============================================================================
# Kubernetes Deployment: [COMPONENT_NAME]
# Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
# Generated by: sa-skills:architecture-dev-handoff
# Source: [COMPONENT_FILE]
# Date: [GENERATION_DATE]
# =============================================================================

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [component-name-kebab]
  namespace: [NAMESPACE]  # TODO: Set your target namespace if not documented
  labels:
    app: [component-name-kebab]
    version: "[VERSION]"
    component: "[COMPONENT_NUMBER]"
spec:
  replicas: [MIN_REPLICAS]  # Min replicas from Section 7
  selector:
    matchLabels:
      app: [component-name-kebab]
  template:
    metadata:
      labels:
        app: [component-name-kebab]
        version: "[VERSION]"
    spec:
      containers:
        - name: [component-name-kebab]
          image: "[IMAGE_NAME]:[IMAGE_TAG]"
          imagePullPolicy: IfNotPresent  # TODO: Set to Always in production

          ports:
            - name: http
              containerPort: [SERVICE_PORT]  # From Section 3 — API Contract
              protocol: TCP

          resources:
            requests:
              cpu: "[CPU_REQUEST]"        # From Section 7 — Performance Targets
              memory: "[MEMORY_REQUEST]"  # From Section 7 — Performance Targets
            limits:
              cpu: "[CPU_LIMIT]"           # From Section 7 — Performance Targets
              memory: "[MEMORY_LIMIT]"    # From Section 7 — Performance Targets

          env:
            # Environment variables from Section 8 — Configuration
            # [ENV_VAR_1]:
            - name: "[ENV_VAR_NAME]"
              value: "[ENV_VAR_VALUE]"
            # TODO: For sensitive values, use valueFrom.secretKeyRef instead:
            # - name: DATABASE_PASSWORD
            #   valueFrom:
            #     secretKeyRef:
            #       name: [secret-name]
            #       key: password

          livenessProbe:
            httpGet:
              path: "[HEALTH_CHECK_PATH]"  # From Section 9 — Observability
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: "[HEALTH_CHECK_PATH]"  # From Section 9 — Observability
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3

      # TODO: Add imagePullSecrets if using a private registry
      # imagePullSecrets:
      #   - name: registry-credentials

---
apiVersion: v1
kind: Service
metadata:
  name: [component-name-kebab]
  namespace: [NAMESPACE]
  labels:
    app: [component-name-kebab]
spec:
  selector:
    app: [component-name-kebab]
  ports:
    - name: http
      port: [SERVICE_PORT]
      targetPort: http
      protocol: TCP
  type: [SERVICE_TYPE]  # From Section 3 — API Contract

---
# Horizontal Pod Autoscaler
# From Section 7 — Performance Targets (Scaling Configuration)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: [component-name-kebab]-hpa
  namespace: [NAMESPACE]
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: [component-name-kebab]
  minReplicas: [MIN_REPLICAS]   # From Section 7
  maxReplicas: [MAX_REPLICAS]   # From Section 7
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: [CPU_SCALE_TARGET]  # From Section 7 — Scale Trigger
```

**Filling instructions**:
1. Replace all `[PLACEHOLDER]` values with data from the handoff sections referenced in each comment.
2. Replace `[component-name-kebab]` with the component name in kebab-case throughout.
3. Populate the `env:` block with all variables from Section 8 (Configuration & Environment).
4. Update resource requests/limits from Section 7 (Performance Targets).
5. Set the health check path from Section 9 (Observability).
6. Leave `# TODO: [NOT DOCUMENTED]` for values not found in the architecture docs.

**Post-generation check**: Verify 1:1 correspondence — every documented env var, resource limit, replica count, port, and health check path is present, and no undocumented values have been added.

**context7 validation** (if available): Fetch Kubernetes docs for `apps/v1` Deployment, `v1` Service, and `autoscaling/v2` HPA. Verify `apiVersion` values are current, probe field names (`livenessProbe`, `readinessProbe`, `httpGet`, `initialDelaySeconds`) match the API spec, and HPA `metrics[].resource.target` structure is correct. Do NOT add fields not derived from architecture docs.

---

## Asset 4: AsyncAPI Specification (`asyncapi.yaml`)

**Trigger**: Message Consumer / Producer / Event-driven components

**Source data** (from Section 5 — Integration Requirements, async subsection):
- Broker type (Kafka, RabbitMQ, SQS, etc.)
- Topic/queue names
- Role: producer or consumer (or both)
- Message format
- Schema definitions

### Scaffold Template

```yaml
asyncapi: "3.0.0"

info:
  title: "[COMPONENT_NAME] — Async Interface"
  version: "[VERSION]"
  description: |
    [COMPONENT_PURPOSE — from Section 1 of the handoff]
    Role: [PRODUCER / CONSUMER / BOTH]

servers:
  [broker-name]:
    host: "[BROKER_HOST]"
    protocol: "[PROTOCOL]"  # kafka, amqp, sqs, googlepubsub, etc.
    description: "[BROKER_DESCRIPTION]"
    # TODO: Add security if required

channels:
  # [TOPIC_OR_QUEUE_NAME]:
  #   address: "[TOPIC_OR_QUEUE_NAME]"
  #   messages:
  #     [MessageName]:
  #       $ref: '#/components/messages/[MessageName]'
  # TODO: Add all topics/queues from Section 5 — Integration Requirements (async subsection)

operations:
  # [OPERATION_NAME]:
  #   action: [send / receive]   # send = producer, receive = consumer
  #   channel:
  #     $ref: '#/channels/[TOPIC_OR_QUEUE_NAME]'
  #   summary: "[OPERATION_DESCRIPTION]"
  # TODO: Add one operation per topic/queue this component interacts with

components:
  messages:
    # [MessageName]:
    #   name: "[MessageName]"
    #   payload:
    #     $ref: '#/components/schemas/[SchemaName]'
    # TODO: Define all message types from Section 5

  schemas:
    # [SchemaName]:
    #   type: object
    #   required:
    #     - field1
    #   properties:
    #     field1:
    #       type: string
    #       description: "[FIELD_DESCRIPTION]"
    # TODO: Define all message schemas from Section 5
```

**Filling instructions**:
1. Replace broker details from the technology stack (Section 11) and integration requirements (Section 5).
2. Add one `channels:` entry per topic/queue listed in Section 5 (async integrations).
3. Set `action: send` for producer roles, `action: receive` for consumer roles.
4. Define message schemas from the message format descriptions in Section 5.
5. Leave `# TODO: [NOT DOCUMENTED]` for values not documented.

**Post-generation check**: Verify 1:1 correspondence — every documented topic/queue has a `channels:` entry and a corresponding `operations:` entry, and no undocumented channels are present.

**context7 validation** (if available): Fetch AsyncAPI 3.0 docs. AsyncAPI 3.0 changed significantly from v2 — verify that `channels`, `operations`, and `messages` structure matches v3 spec (operations are now top-level, `action: send|receive` replaces `publish|subscribe`). Flag any v2 patterns that may have carried over. Do NOT add channels or operations not derived from architecture docs.

---

## Asset 5: CronJob Manifest (`cronjob.yaml`)

**Trigger**: Scheduled job / Batch / CronJob components

**Source data**:
- Schedule expression (from component doc or configuration)
- Job command (from component doc)
- Resource limits (from Section 7)
- Environment variables (from Section 8)

### Scaffold Template

```yaml
# =============================================================================
# Kubernetes CronJob: [COMPONENT_NAME]
# Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
# Generated by: sa-skills:architecture-dev-handoff
# Source: [COMPONENT_FILE]
# Date: [GENERATION_DATE]
# =============================================================================

---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: [component-name-kebab]
  namespace: [NAMESPACE]  # TODO: Set your target namespace if not documented
  labels:
    app: [component-name-kebab]
    component: "[COMPONENT_NUMBER]"
spec:
  schedule: "[CRON_SCHEDULE]"
  # From component doc or Section 8 — Configuration

  concurrencyPolicy: Forbid  # TODO: Change to Allow or Replace if needed
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1

  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app: [component-name-kebab]
        spec:
          restartPolicy: OnFailure  # TODO: Change to Never if idempotency cannot be guaranteed

          containers:
            - name: [component-name-kebab]
              image: "[IMAGE_NAME]:[IMAGE_TAG]"
              imagePullPolicy: IfNotPresent

              command:
                - "[COMMAND]"
              args:
                - "[ARG_1]"

              resources:
                requests:
                  cpu: "[CPU_REQUEST]"        # From Section 7
                  memory: "[MEMORY_REQUEST]"  # From Section 7
                limits:
                  cpu: "[CPU_LIMIT]"           # From Section 7
                  memory: "[MEMORY_LIMIT]"    # From Section 7

              env:
                # Environment variables from Section 8 — Configuration
                - name: "[ENV_VAR_NAME]"
                  value: "[ENV_VAR_VALUE]"
                # TODO: For sensitive values use secretKeyRef

          # TODO: Add imagePullSecrets if using a private registry
```

**Filling instructions**:
1. Set the `schedule:` cron expression from the component's configuration documentation.
2. Replace `[component-name-kebab]` throughout with the component name in kebab-case.
3. Set `command:` and `args:` from the component's execution specification.
4. Populate `env:` from Section 8 (Configuration & Environment).
5. Set resource limits from Section 7 (Performance Targets).
6. Leave `# TODO: [NOT DOCUMENTED]` for undocumented values.

**Post-generation check**: Verify 1:1 correspondence — the schedule, command, args, env vars, and resource limits all match the architecture docs exactly; no defaults have been substituted.

**context7 validation** (if available): Fetch Kubernetes `batch/v1` CronJob docs. Verify `concurrencyPolicy` allowed values (`Allow`, `Forbid`, `Replace`), `restartPolicy` valid values for CronJob pods (`OnFailure`, `Never`), and `jobTemplate.spec.template.spec` structure. Do NOT add fields not derived from architecture docs.

---

## Asset 6: Message Serialization Schemas (`schema.avsc` / `schema.proto`)

**Trigger**: Kafka components where serialization format is documented or Kafka is used without a specified format

**Why separate from `asyncapi.yaml`**: The AsyncAPI spec describes channels, operations, and message metadata. The serialization schema (`schema.avsc` or `schema.proto`) is the artifact the dev team compiles into code or registers in a Schema Registry (e.g., Confluent Schema Registry). They serve different purposes and are consumed differently.

**Source data** (from Section 5 — Integration Requirements, async subsection):
- Topic names and their message types
- Field names, types, and descriptions (from message format docs)
- Namespace (from component namespace or package conventions in `docs/06-technology-stack.md`)
- Serialization format (`Avro` or `Protobuf`) from integration docs or technology stack

**Format selection rules**:
1. If `Avro` or `Schema Registry` or `Confluent` is mentioned → generate `schema.avsc` only
2. If `Protobuf` or `proto` is mentioned → generate `schema.proto` only
3. If both are mentioned → generate both
4. If Kafka is used but serialization format is NOT documented → generate both, add a note in §14 and §15 that the dev team must choose one and discard the other

**File naming**: one schema file per topic/message type → `NN-<component>-<topic-name>.avsc` or `NN-<component>-<topic-name>.proto`. If the topic is unnamed, use `schema.avsc` / `schema.proto`.

---

### Avro Schema Scaffold (`*.avsc`)

Generate one `.avsc` file per message type the component produces or consumes.

```json
// =============================================================================
// Avro Schema: [MESSAGE_NAME] — [COMPONENT_NAME]
// Topic: [TOPIC_NAME]
// Role: [producer / consumer / both]
// Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
// Generated by: sa-skills:architecture-dev-handoff
// Source: [COMPONENT_FILE]
// Date: [GENERATION_DATE]
// Schema Registry: [SCHEMA_REGISTRY_URL]
// =============================================================================

{
  "namespace": "[NAMESPACE]",
  "type": "record",
  "name": "[MESSAGE_NAME]",
  "doc": "[MESSAGE_DESCRIPTION]",
  "fields": [
    // TODO: Add fields from Section 5 — Integration Requirements (message schema)
    // Example field definitions:

    // Required string field:
    // { "name": "fieldName", "type": "string", "doc": "TODO: describe" },

    // Optional string field (nullable):
    // { "name": "fieldName", "type": ["null", "string"], "default": null, "doc": "TODO: describe" },

    // Long / timestamp:
    // { "name": "createdAt", "type": { "type": "long", "logicalType": "timestamp-millis" }, "doc": "Event creation timestamp (ms since epoch)" },

    // Nested record:
    // { "name": "nested", "type": { "type": "record", "name": "NestedType", "fields": [...] }, "doc": "TODO" },

    // Enum:
    // { "name": "status", "type": { "type": "enum", "name": "StatusType", "symbols": ["ACTIVE", "INACTIVE"] }, "doc": "TODO" }

    { "name": "id", "type": "string", "doc": "TODO: verify or replace with actual primary identifier" }
    // TODO: Add remaining fields from architecture documentation
  ]
}
```

**Filling instructions**:
1. Set `namespace` from the component's package/namespace convention in `docs/06-technology-stack.md` or the component doc.
2. Set `name` from the message type name documented in Section 5 (async integrations).
3. Add one entry in `fields` per field documented in the message schema (Section 5).
4. For fields not documented, add `// TODO: [NOT DOCUMENTED]` inline.
5. Generate one `.avsc` file per distinct message type (topic).

**Post-generation check**: Verify every documented message field is present in `fields`, no undocumented fields have been added, and `namespace` and `name` match the docs exactly.

**context7 validation** (if available): Fetch Apache Avro schema specification. Verify logical type names (`timestamp-millis`, `timestamp-micros`, `date`, `time-millis`, `uuid`), union syntax (`["null", "string"]` notation), and `default` value rules for nullable fields. Flag any non-standard logical types. Do NOT add fields not derived from architecture docs.

---

### Protobuf Schema Scaffold (`*.proto`)

Generate one `.proto` file per message type the component produces or consumes.

```protobuf
// =============================================================================
// Protobuf Schema: [MESSAGE_NAME] — [COMPONENT_NAME]
// Topic: [TOPIC_NAME]
// Role: [producer / consumer / both]
// Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
// Generated by: sa-skills:architecture-dev-handoff
// Source: [COMPONENT_FILE]
// Date: [GENERATION_DATE]
// =============================================================================

syntax = "proto3";

package [NAMESPACE];

// TODO: Set Go/Java/Python package options if required by your build toolchain
// option go_package = "github.com/yourorg/repo/gen/proto;proto";
// option java_package = "[JAVA_PACKAGE]";
// option java_outer_classname = "[MESSAGE_NAME]Proto";

// [MESSAGE_DESCRIPTION]
message [MESSAGE_NAME] {
  // TODO: Add fields from Section 5 — Integration Requirements (message schema)
  // Field numbering: start at 1, never reuse numbers (even after removing fields)
  // Types: string, int32, int64, bool, bytes, float, double, or nested message

  // Required string field:
  // string field_name = 1; // TODO: describe

  // Optional field (proto3 all fields are optional by default):
  // string optional_field = 2; // TODO: describe

  // Repeated (array):
  // repeated string tags = 3;

  // Enum:
  // StatusType status = 4;

  string id = 1; // TODO: verify or replace with actual primary identifier
  // TODO: Add remaining fields from architecture documentation
}

// TODO: Define additional message types used in the same topic/channel if needed
// message [RelatedMessageName] { ... }

// TODO: Define enums if referenced above
// enum StatusType {
//   STATUS_UNSPECIFIED = 0; // proto3 requires default value at 0
//   STATUS_ACTIVE = 1;
//   STATUS_INACTIVE = 2;
// }
```

**Filling instructions**:
1. Set `package` from the component's package convention in `docs/06-technology-stack.md`.
2. Set message `name` from the message type name documented in Section 5.
3. Add one `field` per entry documented in the message schema (Section 5), assigning sequential field numbers starting at 1.
4. For fields not documented, add `// TODO: [NOT DOCUMENTED]` inline.
5. Generate one `.proto` file per distinct message type (topic).

**Post-generation check**: Verify every documented message field is present with the correct type and field number, no undocumented fields have been added, and `package` and message name match the docs exactly.

**context7 validation** (if available): Fetch Protobuf (proto3) syntax docs. Verify scalar field type names (`string`, `int32`, `int64`, `bool`, `bytes`, `float`, `double`, `sint32`, `sfixed64`, etc.), that field numbers start at 1 and 19000–19999 are reserved, and `syntax = "proto3"` is at the top. Do NOT add fields not derived from architecture docs.

---

## Asset 7: Redis Key Schema (`redis-key-schema.md`)

**Trigger**: Redis / Cache / ElastiCache / Memcached / Valkey components

**Source data**:
- Key patterns and naming conventions (from Section 4 — Data Model or component doc)
- Data structures per key (from Section 4 — Data Model)
- TTL configuration per key pattern (from Section 4 or Section 8 — Configuration)
- Eviction policy (from Section 8 — Configuration or `docs/06-technology-stack.md`)
- Memory sizing / maxmemory (from Section 7 — Performance Targets)
- Fail-open behavior (from Section 10 — Error Handling or component doc)
- Connection pooling configuration (from Section 8 — Configuration)

### Scaffold Template

````markdown
<!-- =============================================================================
  Redis Key Schema: [COMPONENT_NAME]
  Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
  Generated by: sa-skills:architecture-dev-handoff
  Source: [COMPONENT_FILE]
  Date: [GENERATION_DATE]
  Engine: [REDIS_VERSION_OR_SERVICE]
============================================================================= -->

# Redis Key Schema — [COMPONENT_NAME]

## Instance Configuration

| Setting | Value |
|---------|-------|
| Engine / Version | [REDIS_VERSION_OR_SERVICE] |
| Deployment mode | [STANDALONE / SENTINEL / CLUSTER] |
| maxmemory | [MAXMEMORY] |
| maxmemory-policy | [EVICTION_POLICY] |
| Persistence | [NONE / RDB / AOF / RDB+AOF] |

<!-- TODO: [NOT DOCUMENTED] — fill from Section 8 (Configuration) or docs/06-technology-stack.md -->

## Connection Pooling

| Setting | Value |
|---------|-------|
| Pool size (min / max) | [MIN_POOL_SIZE] / [MAX_POOL_SIZE] |
| Connection timeout | [CONNECT_TIMEOUT_MS] ms |
| Socket timeout | [SOCKET_TIMEOUT_MS] ms |
| Retry attempts | [RETRY_COUNT] |
| Retry backoff | [RETRY_BACKOFF_MS] ms |

<!-- TODO: [NOT DOCUMENTED] — fill from Section 8 (Configuration) or component doc -->

## Key Patterns

<!-- Add one row per key pattern documented in Section 4 (Data Model) or the component doc.
     Key format: use ':' as namespace separator per Redis convention.
     Example: `service:entity:{id}:field` -->

| # | Key Pattern | Data Structure | TTL | Description |
|---|-------------|---------------|-----|-------------|
| 1 | [NAMESPACE]:[ENTITY]:{id} | [STRING / HASH / SET / SORTED SET / LIST / STREAM] | [TTL_SECONDS]s | [KEY_DESCRIPTION] |

<!-- TODO: Add all key patterns from Section 4 of the handoff document -->
<!-- TODO: [NOT DOCUMENTED] — if key patterns are absent from architecture docs, add them to docs/components/NN-component.md -->

## TTL Strategy

| Key Pattern | TTL | Rationale |
|-------------|-----|-----------|
| [KEY_PATTERN_1] | [TTL_SECONDS]s | [WHY_THIS_TTL] |

<!-- TODO: Add TTL rationale for each key pattern from architecture docs -->
<!-- TODO: [NOT DOCUMENTED] — if TTL values are not documented, flag in §15 -->

## Eviction Policy

- **Policy**: `[EVICTION_POLICY]`  <!-- allkeys-lru, volatile-lru, allkeys-lfu, volatile-lfu, volatile-ttl, noeviction, etc. -->
- **Rationale**: [EVICTION_RATIONALE]

<!-- TODO: [NOT DOCUMENTED] — fill from Section 8 (Configuration) or docs/06-technology-stack.md -->

## Memory Sizing

| Metric | Value |
|--------|-------|
| Estimated working set | [WORKING_SET_SIZE] |
| maxmemory | [MAXMEMORY] |
| Headroom (recommended ≥ 25%) | [HEADROOM_PERCENTAGE]% |
| Peak expected memory | [PEAK_MEMORY] |

<!-- TODO: [NOT DOCUMENTED] — fill from Section 7 (Performance Targets) or capacity planning docs -->

## Fail-Open Behavior

Defines application behavior when the Redis instance is unavailable (network partition, crash, eviction storm).

| Scenario | Behavior | Fallback |
|----------|----------|----------|
| Connection failure | [FAIL_OPEN / FAIL_CLOSED] | [FALLBACK_DESCRIPTION] |
| Read timeout | [FAIL_OPEN / FAIL_CLOSED] | [FALLBACK_DESCRIPTION] |
| Write timeout | [FAIL_OPEN / FAIL_CLOSED] | [FALLBACK_DESCRIPTION] |
| Eviction storm (hit rate drops) | [ALERT / CIRCUIT_BREAK / IGNORE] | [FALLBACK_DESCRIPTION] |

<!-- TODO: [NOT DOCUMENTED] — fill from Section 10 (Error Handling) or component doc -->
<!-- NOTE: If fail-open behavior is not documented, this is a critical gap — add to §15 with HIGH priority -->
````

**Filling instructions**:
1. Replace `[REDIS_VERSION_OR_SERVICE]` with the engine/version from Section 11 (Technology Constraints) or `docs/06-technology-stack.md`.
2. Fill the Instance Configuration table from Section 8 (Configuration) and the technology stack docs.
3. Add one row per key pattern from Section 4 (Data Model) or the component doc to the Key Patterns table.
4. Fill TTL Strategy with rationale for each key pattern's TTL from architecture docs.
5. Set the eviction policy and rationale from Section 8 (Configuration) or infrastructure docs.
6. Fill the Memory Sizing table from Section 7 (Performance Targets) or capacity planning documentation.
7. Fill the Fail-Open Behavior table from Section 10 (Error Handling) or the component doc.
8. Leave `<!-- TODO: [NOT DOCUMENTED] -->` for any values not found in the architecture docs.

**Post-generation check**: Verify 1:1 correspondence — every documented key pattern appears in the Key Patterns table, every documented TTL is listed in the TTL Strategy, eviction policy and memory limits match the docs exactly, and no undocumented key patterns or configuration values have been added.

**context7 validation** (if available): Fetch Redis documentation. Verify eviction policy names match current Redis naming (`allkeys-lru`, `volatile-lru`, `allkeys-lfu`, `volatile-lfu`, `volatile-ttl`, `volatile-random`, `allkeys-random`, `noeviction`), data structure names are correct (`STRING`, `HASH`, `SET`, `SORTED SET`, `LIST`, `STREAM`, `JSON`), and deployment mode terminology matches the Redis version documented. Do NOT add key patterns or configuration values not derived from architecture docs.

---

## Asset 8: C4 Component Descriptor (`c4-descriptor.md`)

**Trigger**: Every C4 L2 component except the skip-list types (`Library`, `SDK`, `Utility`, `Config`, `Documentation`). This asset is a human-readable operational one-pager — the single page you hand to SRE, infra, or network teams when a component lands in production.

**Language variant selection**: Read the payload frontmatter `doc_language` field (set by the orchestrator from `ARCHITECTURE.md` language detection). `en` → English template. `es` → Spanish template. Any other value → default to English.

**Source data map** (every field traces back to one architecture source — Asset Fidelity Rule applies):

| Descriptor field | Primary source | Fallback |
|------------------|----------------|----------|
| Component name, number | Component file filename + `# Heading` | — |
| Type | `**Type:**` field in component file | — |
| Technology | `**Technology:**` in component file | `docs/06-technology-stack.md` |
| Architecture Version | `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` in `ARCHITECTURE.md` | — |
| Component Version | `**Component Version:**` in component file | — |
| Purpose (prose) | Handoff §1 (Component Overview) | Component file Overview |
| Hostname / IP / OS / Domain / Middleware | Payload `## Ops Config` section (sourced from `docs/09-operational-considerations.md`) | Component file body |
| Upstream consumers | Handoff §2.3 | Payload `## Integrations` |
| Downstream dependencies | Handoff §2.4 | Payload `## Integrations` |
| Data ownership | Handoff §4 (Data Model) | `docs/05-data-model.md` |
| ADR references | Handoff §13 | `adr/*.md` front-matter |
| TPS sustained/peak | Handoff §7 / Payload `## Perf Targets` | `docs/07-performance-targets.md` |
| CPU cores | Handoff §8 (Configuration) / Payload `## Ops Config` | `deployment.yaml` if generated |
| Memory (RAM GB) | Handoff §8 / Payload `## Ops Config` | `deployment.yaml` if generated |
| Storage (GB) | Handoff §4 (sizing) / Payload `## Ops Config` | `deployment.yaml` if generated |
| Latency P99 | Handoff §7 | — |
| Availability target | Handoff §7 (SLOs) | — |
| Health check | Handoff §9 (Observability) | — |
| Escalation owner | Component file `**Team Owner:**` | — |

**Fidelity policy for operational fields** (hostname, IP, OS, domain, middleware): most projects do not yet capture these in architecture docs. Write `[NOT DOCUMENTED — add to docs/09-operational-considerations.md]` (EN) or `[NO DOCUMENTADO — agregar a docs/09-operational-considerations.md]` (ES) rather than inferring. The marker doubles as the reviewer's checklist.

### Scaffold Template — English (`doc_language: en`)

````markdown
# [COMPONENT_NAME] ([HOSTNAME or NOT DOCUMENTED])

**Component**: [NN]. [Name]
**Type**: [Type]
**Technology**: [Technology]
**Architecture Version**: v[X.Y.Z]
**Component Version**: v[X.Y.Z]
**Generated**: [YYYY-MM-DD]

## Description

**Purpose**: [1–3 sentences from handoff §1 or component Overview]

**Infrastructure**:
- **Hostname**: `[VALUE or NOT DOCUMENTED — add to docs/09-operational-considerations.md]`
- **IP Address**: `[VALUE or NOT DOCUMENTED — add to docs/09-operational-considerations.md]`
- **Operating System**: `[VALUE or NOT DOCUMENTED — add to docs/09-operational-considerations.md]`
- **Domain**: `[VALUE or NOT DOCUMENTED — add to docs/09-operational-considerations.md]`
- **Middleware / Runtime Stack**:
  - [Stack entry — e.g., IIS]
    - [Sub-entry — e.g., ASP.NET]
    - [Sub-entry — e.g., .NET Framework 4.8]
  - [Stack entry 2 if present]

## Responsibilities

[Prose from handoff §1 / component Overview — 1–3 sentences describing the business-facing purpose and why this component exists]

**Upstream consumers**: [Comma-separated list from §2.3, or NOT DOCUMENTED]
**Downstream dependencies**: [From §2.4, or NOT DOCUMENTED]
**Data ownership**: [Entities/tables from §4, or NOT DOCUMENTED]

## Technical Decisions

**Architecture Decision Records**:
- [ADR-NNN — title] → `adr/ADR-NNN-<slug>.md`
- [ADR-MMM — title] → `adr/ADR-MMM-<slug>.md`

(Omit the list entirely if no ADRs apply; write `— No applicable ADRs` instead.)

**Resource allocation**:

| Resource | Target | Source |
|----------|--------|--------|
| TPS (sustained) | [VALUE] | §7 Performance Targets |
| TPS (peak) | [VALUE] | §7 |
| CPU cores | [VALUE] | §8 Configuration |
| Memory RAM (GB) | [VALUE] | §8 |
| Storage (GB) | [VALUE] | §4 / §8 |
| Latency P99 (ms) | [VALUE] | §7 |

**Availability target**: [SLO / uptime% from §7, or NOT DOCUMENTED]
**Health check endpoint**: [URL/path from §9, or NOT DOCUMENTED]
**Escalation owner**: [Team from component file `**Team Owner:**`, or NOT DOCUMENTED]

---

> **Editing note**: This file is regenerated on every handoff run.
> `[NOT DOCUMENTED]` markers are the canonical signal for "add this to architecture docs".
> Fill the value in the referenced architecture source file, then re-run the handoff — do NOT edit this file directly (your changes will be overwritten).
````

### Scaffold Template — Spanish (`doc_language: es`)

````markdown
# [COMPONENT_NAME] ([HOSTNAME or NO DOCUMENTADO])

**Componente**: [NN]. [Name]
**Tipo**: [Type]
**Tecnología**: [Technology]
**Versión de arquitectura**: v[X.Y.Z]
**Versión del componente**: v[X.Y.Z]
**Generado**: [YYYY-MM-DD]

## Descripción

**Propósito**: [1–3 oraciones desde §1 del handoff o el Overview del componente]

**Infraestructura**:
- **Hostname**: `[VALOR o NO DOCUMENTADO — agregar a docs/09-operational-considerations.md]`
- **Dirección IP**: `[VALOR o NO DOCUMENTADO — agregar a docs/09-operational-considerations.md]`
- **Sistema Operativo (SO)**: `[VALOR o NO DOCUMENTADO — agregar a docs/09-operational-considerations.md]`
- **Dominio**: `[VALOR o NO DOCUMENTADO — agregar a docs/09-operational-considerations.md]`
- **Pila de ejecución (middleware)**:
  - [Entrada — ej., IIS]
    - [Sub-entrada — ej., ASP.NET]
    - [Sub-entrada — ej., .NET Framework 4.8]
  - [Entrada 2 si aplica]

## Responsabilidades

[Prosa desde §1 del handoff / Overview del componente — 1–3 oraciones describiendo el propósito de negocio y por qué existe este componente]

**Consumidores upstream**: [Lista separada por comas desde §2.3, o NO DOCUMENTADO]
**Dependencias downstream**: [Desde §2.4, o NO DOCUMENTADO]
**Propiedad de datos**: [Entidades/tablas desde §4, o NO DOCUMENTADO]

## Decisiones técnicas

**Registros de decisiones de arquitectura (ADRs)**:
- [ADR-NNN — título] → `adr/ADR-NNN-<slug>.md`
- [ADR-MMM — título] → `adr/ADR-MMM-<slug>.md`

(Omita la lista por completo si no aplican ADRs; escriba `— Sin ADRs aplicables` en su lugar.)

**Asignación de recursos**:

| Recurso | Objetivo | Fuente |
|---------|----------|--------|
| TPS (sostenido) | [VALOR] | §7 Performance Targets |
| TPS (pico) | [VALOR] | §7 |
| Núcleos CPU | [VALOR] | §8 Configuration |
| Memoria RAM (GB) | [VALOR] | §8 |
| Almacenamiento (GB) | [VALOR] | §4 / §8 |
| Latencia P99 (ms) | [VALOR] | §7 |

**Objetivo de disponibilidad**: [SLO / % uptime desde §7, o NO DOCUMENTADO]
**Endpoint de health check**: [URL/ruta desde §9, o NO DOCUMENTADO]
**Responsable de escalamiento**: [Equipo desde `**Team Owner:**` del archivo de componente, o NO DOCUMENTADO]

---

> **Nota de edición**: Este archivo se regenera en cada ejecución del handoff.
> Los marcadores `[NO DOCUMENTADO]` son la señal canónica para "agregar esto a la documentación de arquitectura".
> Complete el valor en el archivo fuente de arquitectura referenciado, luego vuelva a ejecutar el handoff — NO edite este archivo directamente (sus cambios se sobrescribirán).
````

**Filling instructions**:
1. Select the template variant by payload `doc_language` (default `en` if missing or not `es`).
2. For each `[VALUE]` token, look up the value using the Source data map above — check the primary source first, then the fallback.
3. If a value is not in any source, write `[NOT DOCUMENTED — add to <file>]` / `[NO DOCUMENTADO — agregar a <file>]` with the specific file that should own the gap.
4. For Middleware / Runtime Stack: preserve the nesting depth from the source (sub-bullets indent two spaces). If the source is prose ("runs IIS with ASP.NET on .NET Framework 4.8"), split into a nested list as shown in the example.
5. For the ADR list: populate from handoff §13. If §13 is empty or shows `—`, render `— No applicable ADRs` / `— Sin ADRs aplicables` and do NOT invent decisions.
6. Never localize component names, hostnames, technology names, or ADR IDs — those stay verbatim regardless of language variant.

**Post-generation check**: Verify the file has exactly three top-level headings (`## Description` / `## Responsibilities` / `## Technical Decisions` or the Spanish equivalents). Verify every `[NOT DOCUMENTED]` marker names a specific source file (no bare `[NOT DOCUMENTED]` without a file hint). Verify the `Generated` date matches the handoff generation date.

**context7 validation**: not applicable — this asset is free-form markdown, not a typed schema.

---

## After Asset Generation

Once all assets are written:

1. List the generated assets in **Section 14** of the handoff document.
2. For each asset, provide: asset type, relative path from the handoff file, and one-line description.
3. If any `# TODO:` comments remain in an asset, add a corresponding entry to **Section 15** (Open Questions) referencing the asset file and the specific field.

```
Example Section 15 entry for asset gaps:
- **Asset — openapi.yaml**: Base server URL not documented
  → Recommended location: docs/05-integration-points.md
  → Impact: Dev team cannot configure API client base URL without architecture guidance
```
<!-- END_BUNDLE: ASSET_GENERATION_GUIDE.md -->

### PHASE 2 — Generate the asset

**Step 2.1**: Look up the scaffold template for `asset_type` in the bundled `ASSET_GENERATION_GUIDE.md` above. Use the line ranges in `assets/_index.md` to navigate within the bundle:
- `openapi` → "Asset 1: OpenAPI Specification"
- `ddl` → "Asset 2: DDL Script"
- `deployment` → "Asset 3: Kubernetes Deployment Manifest"
- `asyncapi` → "Asset 4: AsyncAPI Specification"
- `cronjob` → "Asset 5: CronJob Manifest"
- `avro` → "Asset 6: Message Serialization Schemas" (Avro Schema subsection)
- `protobuf` → "Asset 6: Message Serialization Schemas" (Protobuf Schema subsection)
- `redis` → "Asset 7: Redis Key Schema"
- `c4-descriptor` → "Asset 8: C4 Component Descriptor" (select EN/ES variant by `doc_language`)

Always also apply the shared sections at the top of the bundle (Overview, Asset Fidelity Rule, context7 policy, Asset Detection Rules) — they govern every asset.

**Step 2.2**: Compute the filled scaffold IN MEMORY. Walk every `[PLACEHOLDER]` token, substitute it with the corresponding value from the payload, and emit a `gap` entry for any value the spec needs but the payload does not supply. Use the comment style appropriate to the asset's syntax for `# TODO:` markers:

| Asset format | Comment style | Marker |
|--------------|---------------|--------|
| YAML (openapi, deployment, asyncapi, cronjob) | `# …` | `# TODO: [NOT DOCUMENTED — add to <file>]` |
| SQL (ddl) | `-- …` | `-- TODO: [NOT DOCUMENTED — add to <file>]` |
| JSON-with-comments (avro `.avsc`) | `// …` | `// TODO: [NOT DOCUMENTED — add to <file>]` |
| Protobuf | `// …` | `// TODO: [NOT DOCUMENTED — add to <file>]` |
| Markdown (redis, c4-descriptor) | `<!-- … -->` or inline `[NOT DOCUMENTED]` | `<!-- TODO: [NOT DOCUMENTED — add to <file>] -->` or `[NOT DOCUMENTED — add to <file>]` |

For the Spanish c4-descriptor variant, use `[NO DOCUMENTADO — agregar a <file>]`.

**Step 2.3**: Write the asset file. Single-Write rule (same as `handoff-generator`): one `Write` call. Do not use `Edit`-per-placeholder.

```
Write file: [output_asset_path]
content: [filled scaffold]
```

**Step 2.4**: Re-Read the just-written file (one final `Read` call) and run the per-asset post-generation check from the bundled section. If the check fails (missing required structure, unreplaced non-gap placeholders), record the failure in `validation_notes` and return `status: VALIDATION_FAILED` — do NOT delete the file (the orchestrator inspects it).

**Tool-call budget**: 1 Read (payload) + 1 Write (asset) + 1 Read (post-generation re-Read) = 3 calls per spawn. If `shared_refs` resolution is needed in Step 0.4, add 1 Read per unique referenced shared file (typically 0 or 1).

### PHASE 3 — Return results to the orchestrator

Return a concise structured block for the orchestrator to aggregate in Stage 5C:

```
ASSET_RESULT:
  component_slug: [component_slug]
  asset_type: [asset_type]
  status: [OK | VALIDATION_FAILED | PAYLOAD_FAILED]
  asset_path: [output_asset_path]
  gaps:
    - field: "[short label]"
      recommended_location: "[docs/XX-file.md]"
      impact: "[one-line note]"
    - field: "..."
      recommended_location: "..."
      impact: "..."
  validation_notes: "[one-line summary or empty]"
```

If no gaps were emitted, write `gaps: []`.

Always return `ASSET_RESULT` — never exit silently. The orchestrator's Stage 5C iterates over every `gaps[]` entry and appends it to the handoff document's Section 15.

## Tool Discipline

This sub-agent does NOT have access to Bash, Grep, or Glob — only Read and Write. Asset directories are pre-created by the orchestrator (Phase 4 of `architecture-dev-handoff/SKILL.md`); reference content is bundled in this system prompt; the post-generation re-Read uses the standard Read tool.

**FORBIDDEN** (would fail anyway because Bash is not in `tools:`):
- ❌ `mkdir`, `mkdir -p` — orchestrator pre-creates the parent directory of `[output_asset_path]`
- ❌ `date`, `date +%Y-%m-%d` — read `generation_date` from the payload frontmatter
- ❌ `bun`, `python`, `node`, or any scripting language
- ❌ `cat`, `cp`, `mv`, `sed`, `awk` — file manipulation belongs in dedicated tools
- ❌ `grep`, `rg`, `find` — Grep/Glob are not granted; rely on the bundled guide

Use only:
- File reading → **Read tool**
- File writing → **Write tool**

## Error Handling

- Payload not readable → `status: PAYLOAD_FAILED`, no asset written
- `asset_type` outside the supported set → `status: VALIDATION_FAILED`, no asset written
- Post-generation check fails (e.g., unreplaced non-gap placeholders, missing required structure) → `status: VALIDATION_FAILED`, asset file LEFT IN PLACE for orchestrator inspection
- Write fails (disk error, permission denied) → `status: VALIDATION_FAILED`, `validation_notes` describes the failure

The orchestrator never retries inline; it collects all `ASSET_RESULT` blocks across the batch and reports failures at Phase 7.

---

**Agent Version**: 1.0.0 (introduced in v3.14.7 — split from `handoff-generator` for parallel asset generation with per-tier model pinning)
**Specialization**: Per-asset deliverable generation for C4 L2 component handoffs (one asset per Task() invocation)
