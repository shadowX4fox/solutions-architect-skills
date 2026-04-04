# IcePanel Import Reference

> Reference for generating IcePanel-compatible YAML import files from architecture documentation.
> Schema: `https://api.icepanel.io/v1/schemas/LandscapeImportData`

---

## LandscapeImportData YAML Schema

```yaml
# yaml-language-server: $schema=https://api.icepanel.io/v1/schemas/LandscapeImportData

namespace: "architecture-docs"       # Groups imports by source — use fixed value

modelObjects:                        # Systems, apps, stores
  - id: "kebab-case-id"             # Unique, kebab-case, derived from element name
    name: "Display Name"             # Human-readable name
    type: system | app | store       # IcePanel object type
    parentId: "parent-id"            # null for top-level systems, system-id for containers
    groupIds: []                     # Optional domain group references
    tagIds: ["tag-id-1"]             # References to tags defined below

modelConnections:                    # Relationships between objects
  - id: "conn-kebab-id"             # Unique connection ID
    name: "Protocol / Description"   # e.g. "REST/HTTPS", "Kafka async"
    direction: outgoing              # outgoing | bidirectional
    originId: "source-object-id"     # Must reference a modelObject id
    targetId: "target-object-id"     # Must reference a modelObject id

tagGroups:                           # Organize tags into categories
  - id: "group-id"
    name: "Group Name"
    icon: ""                         # Optional icon

tags:                                # Labels attached to objects
  - id: "tag-id"
    name: "Tag Display Name"
    color: ""                        # Optional hex color
    groupId: "group-id"              # Reference to tagGroup
```

**Rules:**
- `additionalProperties: false` — no extra fields allowed
- All `id` fields must be unique within their collection
- `parentId` in modelObjects must reference another modelObject id (or null for root)
- `originId` / `targetId` in connections must reference existing modelObject ids
- `tagIds` must reference existing tag ids
- `groupId` in tags must reference existing tagGroup ids

---

## Mermaid C4 → IcePanel Type Mapping

| Mermaid C4 Function | IcePanel `type` | Notes |
|---------------------|-----------------|-------|
| `Person(id, "name", "desc")` | — | Not a model object; represent as a tag or note on connections |
| `System(id, "name", "desc")` | `system` | Internal system — `parentId: null` |
| `System_Ext(id, "name", "desc")` | `system` | External system — tag with `external: true` |
| `Container(id, "name", "tech", "desc")` | `app` | `parentId` = enclosing system id |
| `ContainerDb(id, "name", "tech", "desc")` | `store` | `parentId` = enclosing system id |
| `ContainerQueue(id, "name", "tech", "desc")` | `store` | `parentId` = enclosing system id; tag as `message-broker` |
| `Container_Boundary(id, "name")` | — | Maps to the parent system boundary — not a separate object |
| `Rel(from, to, "desc", "protocol")` | `modelConnection` | `originId`=from, `targetId`=to, `name`=protocol |

---

## ID Generation Rules

Generate IcePanel IDs from element names using these rules:

1. Take the Mermaid element ID (first parameter of C4 functions) as the base
2. Convert to kebab-case: lowercase, replace spaces/underscores with hyphens
3. Strip special characters (keep alphanumeric + hyphens only)
4. For connections: `conn-{originId}-to-{targetId}` (deduplicate with suffix `-N` if needed)
5. For tags: `tech-{technology-name}` or `type-{c4-type}`

**Examples:**
- `System(paymentSystem, ...)` → `id: "payment-system"`
- `Container(apiGateway, ...)` → `id: "api-gateway"`
- `Rel(apiGateway, paymentService, ...)` → `id: "conn-api-gateway-to-payment-service"`

---

## Tag Conventions

### Tag Groups

Always create these two tag groups:

| Tag Group ID | Name | Purpose |
|-------------|------|---------|
| `technology` | Technology | Technology stack labels from component `**Technology:**` field |
| `c4-type` | C4 Type | The 8 canonical C4 L2 types from component `**Type:**` field |

### Technology Tags

Extract from `docs/components/README.md` Technology column. Strip IcePanel bracket notation `[...]`:

| Component Technology | Tag ID | Tag Name |
|---------------------|--------|----------|
| `[Spring Boot 3.2]` | `tech-spring-boot-3-2` | Spring Boot 3.2 |
| `[PostgreSQL 16]` | `tech-postgresql-16` | PostgreSQL 16 |
| `[React 18, Vite 5]` | `tech-react-18`, `tech-vite-5` | React 18, Vite 5 |

### C4 Type Tags

One tag per canonical type:

| C4 Type | Tag ID | Tag Name |
|---------|--------|----------|
| API Service | `type-api-service` | API Service |
| Web Application | `type-web-application` | Web Application |
| Worker/Consumer | `type-worker-consumer` | Worker/Consumer |
| Gateway | `type-gateway` | Gateway |
| Database | `type-database` | Database |
| Cache | `type-cache` | Cache |
| Message Broker | `type-message-broker` | Message Broker |
| Object Storage | `type-object-storage` | Object Storage |

---

## Source File → YAML Mapping

| YAML Field | Primary Source | Fallback |
|-----------|---------------|----------|
| System name | `C4Context` `System()` name param | `docs/01-system-overview.md` title |
| System description | `C4Context` `System()` desc param | `docs/01-system-overview.md` overview |
| Container name | `C4Container` `Container()` name param | `docs/components/README.md` Component column |
| Container type (app/store) | Mermaid function (`Container` vs `ContainerDb` vs `ContainerQueue`) | `docs/components/README.md` Type column |
| Container technology | `C4Container` technology param | `docs/components/README.md` Technology column |
| Connection protocol | `Rel()` 4th param | `docs/05-integration-points.md` Protocol column |
| Connection description | `Rel()` 3rd param | `docs/05-integration-points.md` Integration column |
| External systems | `C4Context` `System_Ext()` | `docs/05-integration-points.md` external entries |

---

## IcePanel API Quick Reference

### Authentication
```
Authorization: ApiKey {key_id}:{key_secret}
```

### Base URL
```
https://api.icepanel.io/v1/
```

### Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/model/objects` | List all model objects in landscape |
| GET | `/model/connections` | List all connections |
| GET | `/diagrams` | List all diagrams |
| POST | `/landscapes/{id}/import` | Import YAML data |
| GET | `/landscapes/{id}/import/{importId}` | Check import status |

### Import via API

```bash
curl -X POST "https://api.icepanel.io/v1/landscapes/${ICEPANEL_LANDSCAPE_ID}/import" \
  -H "Authorization: ApiKey ${ICEPANEL_API_KEY}" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @icepanel-sync/c4-model.yaml
```

### Manual Import via UI

1. Open your IcePanel landscape
2. Go to workspace settings
3. Select "Import Model"
4. Upload `icepanel-sync/c4-model.yaml`
5. Review and confirm the import

> **Note**: Only workspace Admins can import data into IcePanel.
> Imports add model objects and connections. Diagrams (layout views) are NOT auto-created — create them manually in IcePanel after import.
