# Asset Generation Guide — Architecture Dev Handoff

This guide defines the rules and scaffold templates for generating deliverable asset files
alongside each Component Development Handoff document.

---

## Overview

Assets are **implementation scaffolds** — they represent the structure and values that can be
derived from architecture documentation, pre-filled so the development team can start immediately.
Values the development team must supply are marked with `# TODO: <description>` comments.

**CRITICAL — Asset Fidelity Rule**: Generated assets must be an **exact representation** of the architecture documentation. Every value must come verbatim from the docs. Do not use fallback/default values — if a value is not documented, write `# TODO: [NOT DOCUMENTED]` instead. Do not add fields, endpoints, or resources beyond what is documented. Do not omit documented values.

**Output location**: `docs/handoffs/assets/NN-<component-name>/`

**Naming**: asset filenames are fixed per type (see table below).

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

A component can match multiple conditions and generate multiple assets.

**When to skip**: If the component type is `Library`, `SDK`, `Utility`, `Config`, or `Documentation`, generate no assets and write `—` in the handoff's Section 14 table.

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
-- Generated by: solutions-architect-skills:architecture-dev-handoff
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
# Generated by: solutions-architect-skills:architecture-dev-handoff
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
# Generated by: solutions-architect-skills:architecture-dev-handoff
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
// Generated by: solutions-architect-skills:architecture-dev-handoff
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

---

### Protobuf Schema Scaffold (`*.proto`)

Generate one `.proto` file per message type the component produces or consumes.

```protobuf
// =============================================================================
// Protobuf Schema: [MESSAGE_NAME] — [COMPONENT_NAME]
// Topic: [TOPIC_NAME]
// Role: [producer / consumer / both]
// Component: [COMPONENT_NUMBER] — [COMPONENT_NAME]
// Generated by: solutions-architect-skills:architecture-dev-handoff
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
  Generated by: solutions-architect-skills:architecture-dev-handoff
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
