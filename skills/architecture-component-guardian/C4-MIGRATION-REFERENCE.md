# C4 Component Migration Reference

> Captured from a live migration session. Used by the `migrate` workflow to automate C4 multi-system conversion.

---

## Type Mapping Table

Auto-map non-canonical types to C4 L2 canonical values:

| Non-Canonical Type | Canonical C4 L2 Type | Category |
|--------------------|---------------------|----------|
| Microservice | API Service | App |
| Microservice (Clustered) | API Service | App |
| Microservice (Event Consumer + Query API) | API Service | App |
| Microservice (Stateless Event Consumer) | Worker/Consumer | App |
| Service | API Service | App |
| REST Service | API Service | App |
| REST API | API Service | App |
| gRPC Service | API Service | App |
| Background Service | Worker/Consumer | App |
| Scheduler | Worker/Consumer | App |
| Consumer | Worker/Consumer | App |
| Event Consumer | Worker/Consumer | App |
| Frontend | Web Application | App |
| Frontend Application (Single-Page Application) | Web Application | App |
| SPA | Web Application | App |
| Relational Database | Database | Store |
| Database (Managed PaaS) | Database | Store |
| NoSQL Database | Database | Store |
| Queue | Message Broker | Store |
| Event Bus | Message Broker | Store |
| Distributed Event Streaming Platform | Message Broker | Store |
| Blob Storage | Object Storage | Store |
| File Storage | Object Storage | Store |
| In-Memory Cache | Cache | Store |
| Cache (Managed PaaS) | Cache | Store |
| Reverse Proxy | Gateway | App |
| Load Balancer | Gateway | App |
| API Gateway | Gateway | App |

Types not in this table require user confirmation.

---

## Ownership Heuristics (System Classification)

Priority order for determining if a component is internal or external:

| Signal | Field | Interpretation |
|--------|-------|---------------|
| Local source path | `**Location:** services/...` | Internal — owned by this team |
| "Managed by" language | `**Technology:**` contains "managed by domain service team" | External — not owned |
| Version with local path | `**Version:** v1.0.0` + `**Location:** services/...` | Internal |
| No Location field | Missing `**Location:**` | Likely external |
| No Version field | Missing `**Version:**` | Likely external |
| Multi-component file | File groups multiple components (e.g., `09-bian-domain-services.md`) | Often external services grouped as integration references |
| External URL | `**Location:** https://...` | External |
| SaaS/Cloud keyword | Technology contains "SaaS", "AWS Managed", "Azure Managed" | External (managed service) |

---

## Cross-Reference Impact Map

When files move from `docs/components/NN-name.md` to `docs/components/system-name/NN-name.md`, these paths break:

### Within component files (breadcrumbs + links)

| Reference Type | Old Path | New Path |
|---------------|----------|----------|
| Breadcrumb to ARCHITECTURE.md | `../../ARCHITECTURE.md` | `../../../ARCHITECTURE.md` |
| Breadcrumb to README.md | `README.md` | `../README.md` |
| ADR references | `../../adr/ADR-XXX.md` | `../../../adr/ADR-XXX.md` |
| Sibling doc references | `../07-security-architecture.md` | `../../07-security-architecture.md` |

### External files referencing components

| File Location | Old Pattern | New Pattern |
|--------------|-------------|-------------|
| `docs/*.md` | `components/XX-name.md` | `components/system-name/XX-name.md` |
| `adr/*.md` | `../docs/components/XX-name.md` | `../docs/components/system-name/XX-name.md` |
| `docs/handoffs/*.md` | `../components/XX-name.md` | `../components/system-name/XX-name.md` |
| `compliance-docs/*.md` | `docs/components/XX-name.md` | `docs/components/system-name/XX-name.md` |

### Cross-system component references

Files in different system folders reference each other via `../other-system/NN-name.md`.

### Same-system references

Files within the same subfolder still reference each other as siblings — no path change needed.

---

## C4 L1 System Descriptor Files

During migration, create a system descriptor file at `docs/components/` root for each identified system:

| System Type | File | Content |
|-------------|------|---------|
| Internal | `docs/components/task-scheduling-system.md` | C4 Level: System (L1), Type: Internal System, containers table, boundaries, communication |
| External | `docs/components/bian-domain-services.md` | C4 Level: System (L1), Type: External System, containers table, boundaries |

**Rules**:
- File name = kebab-case system name (matches the folder name)
- NOT indexed as rows in README.md — linked from `### [System Name](system-name.md)` headers
- Contains a Containers table linking to all L2 files in the system folder
- Single-system architectures do NOT create a system file

---

## Heading Migration Rules

| Before | After | Rule |
|--------|-------|------|
| `## 5.1 Job Scheduler Service` | `# Job Scheduler Service` | Strip section number prefix, enforce H1 |
| `## 5.8 Confluent Kafka (Event Publisher)` | `# Confluent Kafka` | Drop parenthetical suffixes that duplicate Type |
| `# Already Clean Heading` | `# Already Clean Heading` | No change needed |

The first `# Heading` in the file = the `Component` column value in README.md.

---

## Technology Formatting Rules

IcePanel bracket convention is defined in `references/ICEPANEL-C4-MODEL.md`. During migration, apply these additional **stripping rules**:

| Strip what | Before | After |
|-----------|--------|-------|
| Tier/SKU/pricing details | `Azure Database for PostgreSQL (General Purpose tier)` | `[Azure PostgreSQL 16]` |
| SDK/library details (keep in file body) | `Angular 19, Angular Material, Auth0 Angular SDK` | `[Angular 19, TypeScript]` |
| Redundant product prefixes | `Apache Kafka Enterprise 3.5` | `[Apache Kafka 3.5]` |

---

## Edge Cases

1. **Multi-component files**: Files with multiple H1/H2 components (e.g., `09-bian-domain-services.md` with 3 services). README anchor links must target specific H2 anchors. Warn user; do NOT auto-split.

2. **Plain-text references**: Non-link mentions like `Source: docs/components/XX.md` don't break navigation but are stale. Log but don't auto-update.

3. **File numbering gaps**: After system grouping, files may have non-contiguous numbers. Renumber within each system folder (01, 02, 03...).

4. **Partially migrated**: Some files already in subfolders, some flat. Detect and offer to complete migration.

5. **Anchor slug changes**: Heading changes affect anchor slugs (`#51-job-scheduler-service` → `#job-scheduler-service`). Track and update all references.
