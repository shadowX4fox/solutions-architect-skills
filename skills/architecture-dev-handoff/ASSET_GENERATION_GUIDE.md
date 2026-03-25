# Asset Generation Guide — Architecture Dev Handoff

This guide defines the rules and scaffold templates for generating deliverable asset files
alongside each Component Development Handoff document.

---

## Overview

Assets are **implementation scaffolds** — they represent the structure and values that can be
derived from architecture documentation, pre-filled so the development team can start immediately.
Values the development team must supply are marked with `# TODO: <description>` comments.

**Output location**: `docs/handoffs/assets/NN-<component-name>/`

**Naming**: asset filenames are fixed per type (see table below).

---

## Asset Detection Rules

Read the component's `**Type:**` field (and the component doc body) to determine which assets to generate.

| Condition | Asset Generated |
|-----------|----------------|
| Type contains: `API`, `REST`, `GraphQL`, `gRPC`, `Service`, `Gateway`, `Proxy`, `Backend` | `openapi.yaml` |
| Type contains: `Database`, `DB`, `Data Store`, `PostgreSQL`, `MySQL`, `MariaDB`, `SQLite`, `MongoDB`, `Cassandra`, `DynamoDB`, `Redis` (with data persistence) | `ddl.sql` |
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
  version: "[API_VERSION or 1.0.0]"
  description: |
    [COMPONENT_PURPOSE — from Section 1 of the handoff]
  contact:
    name: "[ARCHITECT_NAME or Architecture Team]"
  # TODO: Add license if required by your organization

servers:
  - url: "[BASE_URL or http://localhost:8080]"
    description: "[Development or NOT DOCUMENTED — add server URLs to docs/05-integration-points.md]"
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
  # [ENDPOINT_1_PATH or /example]:
  #   [METHOD]:
  #     summary: "[ENDPOINT_1_DESCRIPTION or NOT DOCUMENTED]"
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
5. Leave `# TODO:` comments for any values not found in the architecture docs.

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
-- Database: [DATABASE_TYPE or TODO: specify — PostgreSQL, MySQL, etc.]
-- =============================================================================

-- TODO: Set your schema/database name
-- CREATE SCHEMA IF NOT EXISTS [schema_name];
-- USE [schema_name];

-- =============================================================================
-- Table: [TABLE_NAME_1 or TODO: define table name from docs/components/NN-*.md]
-- Entity: [ENTITY_NAME]
-- =============================================================================
CREATE TABLE IF NOT EXISTS [table_name_1] (
    -- Primary Key
    id              [ID_TYPE or UUID]        PRIMARY KEY DEFAULT [DEFAULT_VALUE or gen_random_uuid()],

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
COMMENT ON TABLE [table_name_1] IS '[ENTITY_DESCRIPTION or TODO: add description]';
-- TODO: Add COMMENT ON COLUMN for each column

-- =============================================================================
-- Indexes: [TABLE_NAME_1]
-- =============================================================================
-- TODO: Add indexes from Section 4 of the handoff document
-- Example:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_[table]_[column] ON [table_name_1] ([column]);
-- CREATE INDEX IF NOT EXISTS idx_[table]_[column] ON [table_name_1] ([column]);

-- [ADDITIONAL_INDEXES or TODO: define from Section 4 — Indexes]

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
6. Leave `-- TODO:` comments for columns/constraints not documented in the architecture docs.

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
  namespace: [NAMESPACE or default]  # TODO: Set your target namespace
  labels:
    app: [component-name-kebab]
    version: "1.0.0"  # TODO: Update version
    component: "[COMPONENT_NUMBER]"
spec:
  replicas: [MIN_REPLICAS or 1]  # Min replicas from Section 7
  selector:
    matchLabels:
      app: [component-name-kebab]
  template:
    metadata:
      labels:
        app: [component-name-kebab]
        version: "1.0.0"
    spec:
      containers:
        - name: [component-name-kebab]
          image: "[IMAGE_NAME or TODO: define container image]:[IMAGE_TAG or latest]"
          imagePullPolicy: IfNotPresent  # TODO: Set to Always in production

          ports:
            - name: http
              containerPort: [SERVICE_PORT or 8080]  # TODO: Verify port from Section 3
              protocol: TCP

          resources:
            requests:
              cpu: "[CPU_REQUEST or 100m]"        # From Section 7 — Performance Targets
              memory: "[MEMORY_REQUEST or 128Mi]"  # From Section 7 — Performance Targets
            limits:
              cpu: "[CPU_LIMIT or 500m]"           # From Section 7 — Performance Targets
              memory: "[MEMORY_LIMIT or 512Mi]"    # From Section 7 — Performance Targets

          env:
            # Environment variables from Section 8 — Configuration
            # [ENV_VAR_1]:
            - name: "[ENV_VAR_NAME or TODO: add env vars from Section 8]"
              value: "[ENV_VAR_VALUE or TODO]"
            # TODO: For sensitive values, use valueFrom.secretKeyRef instead:
            # - name: DATABASE_PASSWORD
            #   valueFrom:
            #     secretKeyRef:
            #       name: [secret-name]
            #       key: password

          livenessProbe:
            httpGet:
              path: "[HEALTH_CHECK_PATH or /health]"  # From Section 9 — Observability
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: "[HEALTH_CHECK_PATH or /health]"  # From Section 9 — Observability
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
  namespace: [NAMESPACE or default]
  labels:
    app: [component-name-kebab]
spec:
  selector:
    app: [component-name-kebab]
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
  type: ClusterIP  # TODO: Change to LoadBalancer or NodePort if needed

---
# Horizontal Pod Autoscaler
# From Section 7 — Performance Targets (Scaling Configuration)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: [component-name-kebab]-hpa
  namespace: [NAMESPACE or default]
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: [component-name-kebab]
  minReplicas: [MIN_REPLICAS or 1]   # From Section 7
  maxReplicas: [MAX_REPLICAS or 3]   # From Section 7
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          # TODO: Set target from Section 7 — Scale Trigger
          averageUtilization: [CPU_SCALE_TARGET or 70]
```

**Filling instructions**:
1. Replace all `[PLACEHOLDER]` values with data from the handoff sections referenced in each comment.
2. Replace `[component-name-kebab]` with the component name in kebab-case throughout.
3. Populate the `env:` block with all variables from Section 8 (Configuration & Environment).
4. Update resource requests/limits from Section 7 (Performance Targets).
5. Set the health check path from Section 9 (Observability).
6. Leave `# TODO:` comments for values not found in the architecture docs.

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
  version: "[VERSION or 1.0.0]"
  description: |
    [COMPONENT_PURPOSE — from Section 1 of the handoff]
    Role: [PRODUCER / CONSUMER / BOTH]

servers:
  [broker-name]:
    host: "[BROKER_HOST or localhost:9092]"
    protocol: "[PROTOCOL or kafka]"  # kafka, amqp, sqs, googlepubsub, etc.
    description: "[BROKER_DESCRIPTION or NOT DOCUMENTED — add to docs/05-integration-points.md]"
    # TODO: Add security if required

channels:
  # [TOPIC_OR_QUEUE_NAME]:
  #   address: "[TOPIC_OR_QUEUE_NAME or TODO: define from Section 5]"
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
5. Leave `# TODO:` comments for values not documented.

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
  namespace: [NAMESPACE or default]  # TODO: Set your target namespace
  labels:
    app: [component-name-kebab]
    component: "[COMPONENT_NUMBER]"
spec:
  schedule: "[CRON_SCHEDULE or TODO: define schedule — e.g., '0 * * * *' for hourly]"
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
              image: "[IMAGE_NAME or TODO: define container image]:[IMAGE_TAG or latest]"
              imagePullPolicy: IfNotPresent

              command:
                - "[COMMAND or TODO: define the job command]"
              args:
                - "[ARG_1 or TODO: define arguments]"

              resources:
                requests:
                  cpu: "[CPU_REQUEST or 100m]"        # From Section 7
                  memory: "[MEMORY_REQUEST or 128Mi]"  # From Section 7
                limits:
                  cpu: "[CPU_LIMIT or 500m]"           # From Section 7
                  memory: "[MEMORY_LIMIT or 512Mi]"    # From Section 7

              env:
                # Environment variables from Section 8 — Configuration
                - name: "[ENV_VAR_NAME or TODO: add env vars from Section 8]"
                  value: "[ENV_VAR_VALUE or TODO]"
                # TODO: For sensitive values use secretKeyRef

          # TODO: Add imagePullSecrets if using a private registry
```

**Filling instructions**:
1. Set the `schedule:` cron expression from the component's configuration documentation.
2. Replace `[component-name-kebab]` throughout with the component name in kebab-case.
3. Set `command:` and `args:` from the component's execution specification.
4. Populate `env:` from Section 8 (Configuration & Environment).
5. Set resource limits from Section 7 (Performance Targets).
6. Leave `# TODO:` comments for undocumented values.

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
// Schema Registry: [SCHEMA_REGISTRY_URL or "TODO: set Schema Registry URL"]
// =============================================================================

{
  "namespace": "[NAMESPACE or TODO: define — e.g., com.yourorg.domain]",
  "type": "record",
  "name": "[MESSAGE_NAME or TODO: define message name from Section 5]",
  "doc": "[MESSAGE_DESCRIPTION or TODO: describe what this message represents]",
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
4. For fields not documented, add `// TODO:` inline with a description of what's needed.
5. Generate one `.avsc` file per distinct message type (topic).

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

package [NAMESPACE or TODO: define — e.g., com.yourorg.domain];

// TODO: Set Go/Java/Python package options if required by your build toolchain
// option go_package = "github.com/yourorg/repo/gen/proto;proto";
// option java_package = "com.yourorg.domain";
// option java_outer_classname = "[MESSAGE_NAME]Proto";

// [MESSAGE_DESCRIPTION or TODO: describe what this message represents]
message [MESSAGE_NAME or TODO: define message name from Section 5] {
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
4. For fields not documented, add `// TODO:` inline.
5. Generate one `.proto` file per distinct message type (topic).

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
