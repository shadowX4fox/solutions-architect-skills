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

The orchestrator (SKILL.md Step 3.2) resolves and fetches spec documentation through the context7 MCP tool when it is configured, and passes the cache location to the asset generator as `context7_cache_hint`. The asset generator has no MCP tools: it never resolves or fetches. When the hint is present it Reads the pre-cached docs and validates scaffold syntax and structure against them; when it is absent it generates from the built-in scaffolds.

### How It Works

**Before asset generation** (SKILL.md Step 3.2, orchestrator-side), resolve and fetch current spec documentation for each unique asset type in the session:

| Asset | `resolve-library-id` query | `get-library-docs` topic hint |
|-------|---------------------------|-------------------------------|
| `openapi.yaml` | `openapi` | `OpenAPI 3.1 paths, components, securitySchemes, info` |
| `asyncapi.yaml` | `asyncapi` | `AsyncAPI 3.0 channels, operations, messages, servers` |
| `ddl.sql` | the payload's `sql_engine` (e.g., `postgresql`, `mysql`) | `CREATE TABLE syntax, data types, constraints` for that engine |
| `<RecordName>.avsc` | `apache-avro` | `Avro schema specification, logical types, union syntax` |
| `schema.proto` | `protobuf` | `proto3 syntax, scalar field types, message and service definition` |
| `redis-key-schema.md` | `redis` | `Redis data structures, TTL, eviction policies` |

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

Use the component's `type` from `component-facts.ts list` (and the component doc body) to determine
which assets to generate. That value is the parsed `**Type:**` field — do not re-grep the file.

| Condition | Asset Generated |
|-----------|----------------|
| Type contains: `API`, `REST`, `Service`, `Gateway`, `Proxy`, `Backend` | `openapi.yaml` |
| A relational data store — `sql_engine` set in the payload (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, DB2, SQLite, Snowflake, Redshift, BigQuery, or a generic database with no NoSQL engine named) | `ddl.sql` |
| Type contains: `Redis`, `Cache`, `ElastiCache`, `Memcached`, `Valkey` | `redis-key-schema.md` |
| Type, technology or `Communicates via` names `GraphQL` | `schema.graphql` (and no `openapi.yaml` unless the descriptor names REST / OpenAPI itself) |
| Type contains: `Consumer`, `Producer`, `Queue`, `Topic`, `Event`, `Message`, `Kafka`, `RabbitMQ`, `SQS`, `EventBridge`, `Pub/Sub` | `asyncapi.yaml` |
| Kafka component AND `Avro` / `.avsc` / `Schema Registry` named | `<RecordName>.avsc`, one per message |
| A gRPC service, or a Kafka component naming `Protobuf` / `proto3` / `.proto` | `schema.proto` (one per component; a gRPC service's `service` and `rpc`s included, and no `openapi.yaml`) |
| Kafka component AND serialization format NOT documented | `<RecordName>.avsc` — Avro by default (`serialization_default: avro`), with a gap asking the docs to confirm |
| Always generated (except for the skip-list types below) | `c4-descriptor.md` — rendered by `scripts/c4-descriptor.js`, not by this agent |

A component can match multiple conditions and generate multiple assets. No Kubernetes manifest — Deployment or CronJob — is generated (removed in 8.104.0): a manifest is the platform team's, built from the cluster's conventions; the sizing the docs state reaches the team through the Component Specification and the C4 descriptor.

**When to skip**: If the component type is `Library`, `SDK`, `Utility`, `Config`, or `Documentation`, generate no assets (including no `c4-descriptor.md`); the Component Specification's § 10 Assets table then carries its single "No assets generated" row.

---

## Asset 1: OpenAPI Specification (`openapi.yaml`)

**Trigger**: API / REST / GraphQL / gRPC / Service components

**Source data** — the payload's `## Operation Definitions` section (the docs/05 block of each synchronous integration the component receives, its inventory row, and every other docs/05 table row citing that `I-nn` — an operations table with method, path, request and response fields is the usual one) and the component's own file (from A2 — API & Data Contract of the handoff):
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
    [COMPONENT_PURPOSE — from A1 of the handoff]
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

paths: {}
  # `{}` stays until the first entry replaces it — `paths:` holding only comments is YAML null, not OpenAPI
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
  # TODO: Add all endpoints from A2 of the handoff document

components:
  schemas: {}
    # TODO: Define all request and response schemas from A2 of the handoff document — replace `{}` with the first one
    # Example:
    # ExampleRequest:
    #   type: object
    #   required:
    #     - field1
    #   properties:
    #     field1:
    #       type: string
    #       description: "[FIELD_DESCRIPTION]"

  # TODO: Define security schemes from B1 of the handoff document
```

**Filling instructions**:
1. Replace all `[PLACEHOLDER]` values with extracted data from A2 of the handoff.
2. Uncomment and fill one `paths:` entry per endpoint documented in the component file.
3. Uncomment and fill one `schemas:` entry per request/response schema.
4. Uncomment the `securitySchemes:` block matching the auth mechanism from B1.
5. Leave `# TODO: [NOT DOCUMENTED]` for any values not found in the architecture docs.
6. An operation exists only where the component file or `## Operation Definitions` states its **method and path** (a table row, a bullet, an `apis:` block). A GraphQL `POST /graphql`, a `/health` probe or a CRUD route the docs do not state is not added by convention — record it as a gap.
7. Keep `paths` and `components.schemas` at their indentation, and declare every `{param}` of a path as `in: path`, `required: true`.
8. Write OpenAPI 3.1, not 3.0: a nullable field is `type: [string, "null"]` — `nullable: true` does not exist in 3.1 — and `example` on a schema is `examples: [...]`.
9. A request or response field is a property only where the docs name it, and its `type` only where the docs state one — a field named without a type is a property with no `type` (any value) and a `# TODO: [NOT DOCUMENTED — type of <field>]` comment, never `string` by choice. A field listed with sub-fields (`accounts[]` {`accountToken`, …}) is an object (an `array` of objects for `[]`) with those properties. A reusable path parameter may be declared once under `components.parameters` and referenced with `$ref`.
10. `info.version` is the API's documented version; the Component Version is not it. Undocumented → `"NOT-DOCUMENTED"` with a `# TODO` comment and a gap.

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/openapi.yaml` at Step 5.2b — the YAML parses, the OpenAPI 3.1 structure holds (`paths` a mapping, responses with descriptions, path parameters declared, local `$ref`s resolving, unique `operationId`s, declared security schemes, no `[PLACEHOLDER]` left in a value), every operation's method and path is stated in this payload's component file (`operation-undocumented`, BLOCKING), and Redocly validates it against the OpenAPI 3.1 schema (spec conformance blocks, style warns). A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

**Spec-doc check** (only when the payload carries `context7_cache_hint`; Read the pre-cached docs, never fetch): Compare the generated scaffold against fetched OpenAPI 3.1 docs. Verify field names (`openapi`, `info`, `paths`, `components`, `securitySchemes`) match the spec. Flag deprecated constructs. Do NOT add fields or values not derived from architecture docs.

---

## Asset 2: DDL Script (`ddl.sql`)

**Trigger**: a **relational** data store — `handoff-prepare.js` sets `sql_engine` in the payload frontmatter (`postgresql`, `mysql`, `mariadb`, `transactsql`, `oracle`, `db2`, `sqlite`, `snowflake`, `redshift`, `bigquery`, or `unknown`). A non-relational store (MongoDB, Cassandra, DynamoDB, Couchbase, Cosmos DB, …) gets no DDL.

**Dialect**: the engine's own — the DDL is run by the team on that engine. Engine-specific syntax (`JSONB`, `COMMENT ON`, partitions, row-level security, `IDENTITY`, `AUTO_INCREMENT`) is used when the docs state it for that engine, never by habit.

**Source data**: the component file's data model / owned entities (payload `## Owned Entities` and `## Component File`), and wherever the docs define its tables (`docs/05`, `docs/08`, an operations or database-setup document).

### Scaffold Template

```sql
-- Engine: [ENGINE AND VERSION — from the docs]
-- Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
-- Source: [COMPONENT_FILE]

CREATE TABLE [table_name] (
    [column_name]  [TYPE]  [NOT NULL]  [DEFAULT …],
    [column_name]  [TYPE],
    PRIMARY KEY ([column_name])
);

CREATE INDEX [index_name] ON [table_name] ([column_name]);
```

**Filling instructions**:
1. The first line is `-- Engine:` with the engine and version the docs state (`PostgreSQL 16`, `SQL Server 2022`); the checker reads it when the payload has no `sql_engine`.
2. One `CREATE TABLE` per documented table; columns, types, keys, defaults, `CHECK`s, foreign keys and indexes **only** where the docs state them. No `id` the docs do not name, no audit columns "by standard", no partitions, policies or publications the docs do not describe.
3. A documented table whose columns are not documented is not a `CREATE TABLE`: write `-- TODO: [NOT DOCUMENTED — columns of <table>: add to <file>]` and a `gaps[]` entry.
4. A value the docs leave open (a length, a default) is a `-- TODO: [NOT DOCUMENTED — …]` comment on that line, not a guess; the statement stays valid SQL.

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/ddl.sql` at Step 5.2b — the engine's grammar (PostgreSQL: `libpg-query`, PostgreSQL's own parser; MySQL, MariaDB, SQL Server, DB2, SQLite, Snowflake, Redshift, BigQuery: `node-sql-parser`; Oracle: no JavaScript grammar, structure and fidelity only), a syntax error with its line, a column declared twice, a foreign key to a table the file does not create (warning), no placeholder outside a comment, and every table and column named in the architecture docs (`table-undocumented`, `column-undocumented`, BLOCKING). A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

---

## Asset 3: GraphQL Schema (`schema.graphql`)

**Trigger**: a component whose type, technology, `Communicates via` or descriptor names GraphQL — `handoff-prepare.js` routes it to `graphql-sdl` and **not** to `openapi` (through 8.27.0 the keyword `graphql` matched the REST entry and the component received an OpenAPI skeleton with empty `paths:`; a REST spec for a non-REST surface is a file nobody can use). A service that exposes both keeps both only when the descriptor names REST / OpenAPI itself.

**Source data** (the payload's `## Operation Definitions` — the docs/05 blocks and operation rows of the inbound integrations — plus A3 — Integrations, the inbound rows whose protocol is GraphQL, and the descriptor's API section):
- Operations the component exposes: queries, mutations, subscriptions — one per documented inbound operation
- Types and fields from the documented data model / owned entities (never invented; a type with no documented fields carries a `# [NOT DOCUMENTED — …]` comment)
- Errors and auth from CROSS_CUTTING_STANDARDS § Error semantics / § Identity

### GraphQL SDL Scaffold (`schema.graphql`)

```graphql
# =============================================================================
# GraphQL Schema — [COMPONENT_NAME]
# Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
# Generated by: sa-skills:architecture-dev-handoff
# Source: [COMPONENT_FILE], docs/05-integration-points.md
# Date: [GENERATION_DATE]
# =============================================================================

schema {
  query: Query
  # mutation / subscription only when a documented operation needs them
}

type Query {
  # One field per documented inbound query operation (A3 — Integrations, GraphQL rows).
  # [OPERATION_NAME]([ARGS]): [RETURN_TYPE]   # per docs/05 [I-nn]
}

# One type per documented owned entity. Fields from the documented model only.
type [ENTITY_NAME] {
  id: ID!
  # [FIELD_NAME]: [SCALAR_OR_TYPE]   # [NOT DOCUMENTED — add the field list to <component file> § Data]
}

# Errors follow CROSS_CUTTING_STANDARDS § Error semantics — carried in the response `errors[]`, never modelled as union types unless the descriptor says so.
```

**Asset Fidelity Rule applies**: every operation, type and field traces to a documented row or section; the placeholder comments are the gap markers and stay when the source has nothing. An operation exists only where the docs **name** it — a capability described in prose without an operation name stays a commented gap, and a schema with no named operation is comments only (an object type with no fields is not valid SDL).

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/schema.graphql` at Step 5.2b — graphql-js builds and validates the schema (syntax with its line, unknown or duplicate types, a `Mutation` without the required `Query` root, a type with no fields), no placeholder is left outside a comment, and every `Query` / `Mutation` / `Subscription` field is named in this payload's component file (`operation-undocumented`, BLOCKING). A comments-only schema is a warning. When a previous version exists (the file at git HEAD), breaking and dangerous changes against it are reported as warnings. A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

## Asset 4: AsyncAPI Specification (`asyncapi.yaml`)

**Trigger**: Message Consumer / Producer / Event-driven components

**Source data** (from A3 — Integrations & Failure Modes, async subsection):
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
    [COMPONENT_PURPOSE — from A1 of the handoff]
    Role: [PRODUCER / CONSUMER / BOTH]

servers:
  [broker-name]:
    host: "[BROKER_HOST]"
    protocol: "[PROTOCOL]"  # kafka, amqp, sqs, googlepubsub, etc.
    description: "[BROKER_DESCRIPTION]"
    # TODO: Add security if required

channels: {}
  # `{}` stays until the first entry replaces it — a map holding only comments is YAML null, not AsyncAPI
  # [TOPIC_OR_QUEUE_NAME]:
  #   address: "[TOPIC_OR_QUEUE_NAME]"
  #   messages:
  #     [MessageName]:
  #       $ref: '#/components/messages/[MessageName]'
  # TODO: Add all topics/queues from A3 — Integrations & Failure Modes (async subsection)

operations: {}
  # [OPERATION_NAME]:
  #   action: [send / receive]   # send = producer, receive = consumer
  #   channel:
  #     $ref: '#/channels/[TOPIC_OR_QUEUE_NAME]'
  #   summary: "[OPERATION_DESCRIPTION]"
  # TODO: Add one operation per topic/queue this component interacts with

components:
  messages: {}
    # [MessageName]:
    #   name: "[MessageName]"
    #   payload:
    #     $ref: '#/components/schemas/[SchemaName]'
    # TODO: Define all message types from A3

  schemas: {}
    # [SchemaName]:
    #   type: object
    #   required:
    #     - field1
    #   properties:
    #     field1:
    #       type: string
    #       description: "[FIELD_DESCRIPTION]"
    # TODO: Define all message schemas from A3
```

**Filling instructions**:
1. Replace broker details from the technology stack (A1) and integration requirements (A3).
2. Add one `channels:` entry per topic/queue listed in A3 (async integrations).
3. Set `action: send` for producer roles, `action: receive` for consumer roles.
4. Define message schemas from the message format descriptions in A3.
5. Leave `# TODO: [NOT DOCUMENTED]` for values not documented.
6. A channel exists only where the component file names its topic or queue; its `address` is that name verbatim (`{param}` only where the docs show a variable segment).
7. Write AsyncAPI 3.0, not 2.x: `servers.<name>.security` is a list of `$ref: '#/components/securitySchemes/<name>'` (declare the scheme there with its `type`, e.g. `scramSha512`, `userPassword`, `X509`) — never a 2.x requirement such as `saslSsl: []`; a Kafka consumer group is `operations.<op>.bindings.kafka.groupId`, a Schema object (`groupId: { type: string, enum: ["<group>"] }`), never on a channel; a binding the docs do not describe is omitted, not left as `amqp:` with comments under it.

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/asyncapi.yaml` at Step 5.2b — the YAML parses, every map is a mapping, `action` is `send` / `receive` and `channel` a `$ref`, no placeholder is left in a value, every channel address is stated in this payload's component file (`channel-undocumented`, BLOCKING), and Redocly validates it against the AsyncAPI 3.0 schema (spec conformance blocks). A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

**Spec-doc check** (only when the payload carries `context7_cache_hint`; Read the pre-cached docs, never fetch): Use the pre-cached AsyncAPI 3.0 docs. AsyncAPI 3.0 changed significantly from v2 — verify that `channels`, `operations`, and `messages` structure matches v3 spec (operations are now top-level, `action: send|receive` replaces `publish|subscribe`). Flag any v2 patterns that may have carried over. Do NOT add channels or operations not derived from architecture docs.

---

## Asset 5: Message Serialization Schemas (`<RecordName>.avsc` / `schema.proto`)

**Trigger**: Kafka components where serialization format is documented or Kafka is used without a specified format

**Why separate from `asyncapi.yaml`**: The AsyncAPI spec describes channels, operations, and message metadata. The serialization schemas (`<RecordName>.avsc`, `schema.proto`) is the artifact the dev team compiles into code or registers in a Schema Registry (e.g., Confluent Schema Registry). They serve different purposes and are consumed differently.

**Source data** — the payload's `## Message Definitions` section (the docs/05 block of each async integration; the message sections of the descriptor at the other end, and of the producers behind a broker), and the component's own file:
- Topic names and their message types
- Field names, types, and descriptions (from message format docs)
- Namespace (from component namespace or package conventions in `docs/06-technology-stack.md`)
- Serialization format (`Avro` or `Protobuf`) from integration docs or technology stack

**Format selection rules** (applied by `handoff-prepare.js`, which sets `asset_types`):
1. `Avro`, `.avsc` or `Schema Registry` named → `avro`
2. `Protobuf`, `proto3`, `.proto` or `gRPC` named → `protobuf`
3. Both named → both
4. Kafka named and **no format** → `avro` by default, and the payload frontmatter carries `serialization_default: avro`. Record one gap: field `serialization format`, where `<component file> — name Avro or Protobuf`, impact `Avro assumed by default; confirm before registering the schemas`.

---

### Avro Schema (`<RecordName>.avsc`)

**One file per message**: write one `.avsc` per record the component produces or consumes, named after the record (`JobExecutionEvent.avsc`), in the component's asset directory — the directory of `output_asset_path`. One record per file is what `avro-maven-plugin`, `avro-tools` and a Schema Registry subject consume.

**Plain JSON — no comments.** A `.avsc` is JSON: a `//` line makes the file unreadable to every tool. Topic and role live in `asyncapi.yaml`, not here. A gap is a `doc` value, `"[NOT DOCUMENTED — add to <file>]"`, on the record or the field it concerns, and a `gaps[]` entry.

```json
{
  "type": "record",
  "name": "[RecordName]",
  "namespace": "[namespace]",
  "doc": "[what the message carries — from the docs]",
  "fields": [
    { "name": "[fieldName]", "type": "string", "doc": "[from the docs]" },
    { "name": "[optionalField]", "type": ["null", "string"], "default": null, "doc": "[from the docs]" },
    { "name": "[occurredAt]", "type": { "type": "long", "logicalType": "timestamp-millis" }, "doc": "[from the docs]" }
  ]
}
```

**Filling instructions**:
1. `name`: the message or event name the docs give, as an Avro name (letters, digits, `_`; no `-`).
2. `namespace`: the one the docs state (component file, `docs/06-technology-stack.md`); none stated → omit `namespace` and record a gap.
3. `fields`: one entry per documented field, its type from the docs — the payload's `## Message Definitions` carries them: the docs/05 block of each async integration and the message sections of the producer's (or broker's) descriptor, since a consumer repeats the producer's message. **No field the docs do not name** — no `id` "to verify". A message whose fields are not documented is `"fields": []` with the gap in the record's `doc`.
4. Avro rules the tools enforce: a union's `default` matches its **first** branch (`["null", "string"]` → `"default": null`); an enum `default` is one of its symbols; `decimal` carries `precision` (and `scale`); logical types are `decimal`, `uuid`, `date`, `time-millis`, `time-micros`, `timestamp-millis`, `timestamp-micros`, `local-timestamp-millis`, `local-timestamp-micros`, `duration`.

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/*.avsc` at Step 5.2b — the file parses as JSON, `avsc` builds the schema (names, unions and their defaults, enums, duplicate fields), `decimal` has a `precision`, no placeholder is left in a value, and every field name is stated in this payload's component file (`field-undocumented`, BLOCKING). A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

---

### Protobuf Schema (`schema.proto`)

**One file per component**, `schema.proto` in its asset directory: one `package`, every message the component exchanges, and — for a **gRPC service** — its `service` with one `rpc` per documented operation. A gRPC service gets no `openapi.yaml`; this file *is* its API contract.

**Source**: the payload's `## Message Definitions` (the docs/05 blocks of its async and gRPC integrations, the message sections of the descriptor at the other end) and the component's own file (its operations, for the `service`).

```protobuf
syntax = "proto3";

package [package — from the docs];

// [what the message carries — from the docs]
message [MessageName] {
  [type] [field_name] = 1;
  [type] [field_name] = 2;
}

// gRPC services only
service [ServiceName] {
  rpc [Operation] ([Operation]Request) returns ([Operation]Response);
}
```

**Filling instructions**:
1. `package`: the one the docs state; none stated → `// TODO: [NOT DOCUMENTED — package: add to <file>]` above a `package` named after the component's slug (a `.proto` must have one) and a `gaps[]` entry.
2. One `message` per documented message, one field per documented field, its type from the docs. **No field the docs do not name** — no `id` "to verify". A message whose fields are not documented keeps its name and an empty body with a `// TODO: [NOT DOCUMENTED — …]` comment.
3. gRPC: one `rpc` per operation the docs name; its request / response messages are `<Operation>Request` / `<Operation>Response` unless the docs name them, and carry only documented fields.
4. **Field numbers are the wire contract — never renumber.** If `output_asset_path` already exists, Read it first: every field keeps the number it has there, and a new field takes the next number not used before (a removed field's number is listed in `reserved`, never reused). On a first generation, number fields 1, 2, 3 … in the order the docs list them.
5. proto3 rules the checker enforces: an enum's first value is `0` (`<ENUM>_UNSPECIFIED = 0`); field numbers start at 1 and skip 19000–19999; no `required`.

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/schema.proto` at Step 5.2b — `protobufjs` parses it and resolves every type and rpc (syntax with its line, duplicate numbers or names, unknown types), an enum starts at `0`, no field number is 0 or in 19000–19999, no placeholder outside a comment, every message, field, service and rpc is named in the architecture docs (`<Operation>Request` / `Response` wrappers of a documented rpc excepted; `name-undocumented`, BLOCKING), and against the previous version (the file at git HEAD) a field whose number changed, or a removed field's number reused, is reported as a breaking change. A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

---

## Asset 6: Redis Key Schema (`redis-key-schema.md`)

**Trigger**: Redis / Cache / ElastiCache / Memcached / Valkey components

**What it is**: the cache's contract — which keys exist, what each holds, how long it lives, who writes it, and what the callers do when the cache is down. Three tables with **fixed headers** (English, as every column header), nothing else: no example keys, no memory estimates, no client connection-pool settings (each caller's own configuration), no recommendations. Sizing and runtime live in the C4 descriptor and the Component Specification.

**Source**: the component file (payload `## Component File`) and wherever the docs state the keys — the writers' descriptors, docs/05, docs/08.

### Scaffold Template

````markdown
# Redis Key Schema — [COMPONENT_NAME]

## Keys

| Key pattern | Structure | TTL | Holds | Written by |
|---|---|---|---|---|
| `[prefix]:[entity]:{id}` | [STRUCTURE] | [TTL] | [what the value holds] | [canonical component name] |

## Settings

| Setting | Value |
|---|---|
| Engine | [engine and version] |
| Eviction policy | [policy] |
| Persistence | [none / RDB / AOF / RDB+AOF] |
| maxmemory | [size] |

## On Redis failure

| Key pattern | On Redis failure |
|---|---|
| `[prefix]:[entity]:{id}` | [fail-open / fail-closed]: [what the caller does] |
````

**Filling instructions**:
1. One `Keys` row per key pattern **the docs state**; a pattern is written as the docs write it, variable parts in `{braces}`. A cache the docs describe without its key format gets one row whose pattern is `[NOT DOCUMENTED — key format of <what>: add to <file>]` — never a pattern made up from convention.
2. `Structure`: `STRING`, `HASH`, `LIST`, `SET`, `SORTED SET`, `STREAM`, `JSON`, `BITMAP`, `HYPERLOGLOG`, `GEO` or `TIMESERIES`. `TTL`: a number and a unit (`300s`, `24h`), or `none`.
3. `Settings`: these four rows only, each value as the docs state it; `Eviction policy` is one of `noeviction`, `allkeys-lru`, `allkeys-lfu`, `allkeys-random`, `volatile-lru`, `volatile-lfu`, `volatile-random`, `volatile-ttl`.
4. `On Redis failure`: one row per key pattern; the cell opens with `fail-open` or `fail-closed`.
5. Any value the docs do not state is `[NOT DOCUMENTED — add to <file>]` in its cell, and a `gaps[]` entry.

**Post-generation check (by code)**: `kit-check.js` runs `scripts/contract-check.js` over every `assets/*/redis-key-schema.md` at Step 5.2b — the three tables with their exact headers and nothing else under H2, the closed vocabularies (structure, eviction policy, `fail-open` / `fail-closed`), the TTL form, no placeholder, and the docs: every key pattern's fixed prefix (up to its first `{`), every TTL and setting value with a unit, and every writer is stated in the architecture docs (`key-undocumented`, `value-undocumented`, BLOCKING). A failing file is `VALIDATION_FAILED` and is regenerated once with the finding quoted.

---

## Asset 7: C4 Component Descriptor (`c4-descriptor.md`) — rendered by code

Not an agent task since 8.104.0. `scripts/c4-descriptor.js` renders it from the facts ledger and the component file's metadata rows: one table — component, type, technology, versions, owner, runs on, capacity, host · IP · OS · domain, and in governed mode Business Area · Capability, CI class, Lifecycle, `u_diagram_id` — plus a link to the Component Specification, which carries everything else. A value with no structured source is `[NOT DOCUMENTED — …]` naming the file and row that would carry it. The orchestrator never sends `c4-descriptor` to `handoff-asset-generator`.

---

## After Asset Generation

Every `# TODO:` marker left in an asset is one entry in `ASSET_RESULT.gaps[]` — `field` (e.g. "Base server URL"), `recommended_location` (e.g. `docs/05-integration-points.md`), `impact` (what the dev team cannot do without it). The asset generator writes only the asset; the § 10 Assets table and the § 11 Open Questions rows are written by the Component Specification generator and `kit-gaps-merge.js`.
