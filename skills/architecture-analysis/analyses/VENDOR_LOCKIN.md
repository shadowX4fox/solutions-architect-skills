# Vendor Lock-in / Portability Analysis Spec

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Vendor Lock-in and Portability analysis. It classifies every component and capability by lock severity, computes per-vendor concentration, ranks exit costs, and generates prioritized portability recommendations.

**Output file**: `analysis/VENDOR-LOCKIN-<YYYY-MM-DD>.md`

---

## Classification Model

Evaluate every component (from `docs/components/README.md`, `docs/components/**/*.md`) and every external service / SaaS dependency (from `docs/05-integration-points.md` and ADRs) against the lock tiers below.

### Tier L1 — Locked (Vendor-Proprietary)

A component or capability is **Locked** when:
- It uses a **vendor-proprietary API or runtime** with no open-standard equivalent (e.g., AWS Lambda invocation model, Azure Cosmos DB wire protocol, Auth0 Rules engine, GCP BigQuery ML)
- Replacing it requires **application code changes** beyond configuration
- The vendor's **data export path is proprietary or incomplete** (e.g., vendor-specific serialization, no standard dump format)

**Evidence to look for:**
- `docs/06-technology-stack.md` — proprietary managed services listed as primary components
- ADRs citing vendor-specific features as the decision rationale (e.g., "chose Cosmos DB for multi-master replication")
- `docs/05-integration-points.md` — external SaaS where the integration surface is a vendor SDK (not REST/gRPC/AMQP)
- Component `.md` files whose Technology field names a vendor product (not an open standard)

**Table columns** (one row per L1 item):
```
# | Component / Capability | Vendor | Proprietary Surface | Exit Path | Exit Cost
```
- `#` = L1-01, L1-02 … (sequential within tier)
- `Proprietary Surface` = the specific API, feature, or behavior that is vendor-proprietary
- `Exit Path` = alternative standard or competitor — "None identified" if absent
- `Exit Cost` = High / Medium / Low (see scoring below)

### Tier L2 — Lock-Prone (Open Standard + Vendor Extensions)

A component is **Lock-prone** when:
- Its **primary interface is an open standard** (SQL, AMQP, OCI, OpenTelemetry) but the architecture actively uses **vendor-specific extensions** that would break on migration
- Examples: Confluent ksqlDB on top of Kafka, Azure PostgreSQL with `pg_trgm` + `pg_cron` extensions, Datadog distributed tracing via vendor agent rather than OTel

**Evidence to look for:**
- ADRs that mention vendor-specific features as a primary benefit
- `docs/06-technology-stack.md` — tech listed as open standard but noted with vendor-specific capabilities
- `docs/components/**/*.md` — "Technology" field contains a managed vendor product built on an open-source base

**Table columns** (one row per L2 item):
```
# | Component / Capability | Vendor | Open Standard Used | Vendor Extension | Migration Risk
```
- `#` = L2-01, L2-02 …
- `Migration Risk` = High / Medium / Low

### Tier L3 — Portable (Open Standard, Drop-in Replacement Available)

A component is **Portable** when:
- It uses an **open standard interface** with no vendor extensions in active use
- A drop-in replacement from another vendor requires only **configuration changes** (not code changes)
- Examples: S3-compatible object storage, OCI container registry, vanilla PostgreSQL without extensions, Kafka with no Confluent-specific features

**Portability table** (summary only — not a findings list):
```
Component | Standard | Alternative Provider(s)
```

Do not list every portable component — only include components where portability is architecturally notable (e.g., key data stores, primary message brokers).

---

## Vendor Concentration

Compute per-vendor concentration across all classified components (L1 + L2 + L3):

**Concentration table:**
```
Vendor | Component Count | % of Architecture | Lock Tier Distribution
```
- `Lock Tier Distribution` = e.g., "3 L1, 2 L2, 1 L3"

**Concentration risk flag**: if any single vendor accounts for ≥ 60% of components or ≥ 60% of documented monthly cost (`docs/06-technology-stack.md`), flag as **HIGH CONCENTRATION RISK**.

Check ADRs for explicit multi-cloud or multi-vendor strategy decisions — cite them in the Executive Summary.

---

## Exit Cost Scoring

Rate each L1 and L2 item:

| Factor | High | Medium | Low |
|--------|------|--------|-----|
| **Proprietary surface area** | Vendor-only API used deeply in core flows | Vendor-specific features used in non-critical paths | Thin wrapper over open standard |
| **Replacement effort** | Full re-architecture required | Service swap + config changes | Config change only |
| **Data export feasibility** | No standard export; vendor-specific format | Export available but requires transformation | Standard format (JSON, CSV, Parquet) |

Overall exit cost = worst of the three factors (highest wins).

**Exit Cost Ranking table** (L1 + L2 items, sorted by exit cost descending):
```
# | Component | Vendor | Exit Cost | Blocking Factor
```

---

## Heat Map

Build a **3×3 ASCII heat map**:
- **Y-axis (vertical)**: Lock Severity — L3 (bottom) to L1 (top)
- **X-axis (horizontal)**: Strategic Importance — LOW (left) to HIGH (right)

**Strategic Importance scoring:**
- HIGH = component is on the critical user-facing path (core flows, primary data store, ingress)
- MEDIUM = component supports key capabilities but has a fallback or alternative
- LOW = tooling, observability, or dev-time component

Plot finding IDs at their coordinates.

```
              HIGH SEVERITY (L1)
                   │
  [...]  ──────────┼───────────── [...]
                   │
  [...]  ──────────┼───────────── [...]
                   │
  [...]  ──────────┼───────────── [...]
                   │
              LOW SEVERITY (L3)
       LOW ─────────┼──────────── HIGH
              STRATEGIC IMPORTANCE
```

---

## Report Sections (in order)

1. **Executive Summary** — total L1/L2/L3 count, highest-concentration vendor, one-line portability verdict
2. **Vendor Concentration** — per-vendor table + concentration risk flag
3. **Locked Capabilities (L1)** — full table with exit paths and exit cost
4. **Lock-prone Capabilities (L2)** — full table with migration risk
5. **Portable Components (L3)** — summary table (notable items only)
6. **Exit Cost Ranking** — all L1+L2 sorted by exit cost descending
7. **Vendor Lock-in Heat Map** — ASCII grid (severity × strategic importance)
8. **Top 5 Portability Recommendations** — ordered by (exit cost × strategic importance); each cites the finding ID + source file
9. **Summary Verdict** — overall portability posture: what is locked-in, what the exit strategy is (if any), what ADRs govern this
10. **Documentation Gaps** — components where vendor details, exit paths, or ADR rationale were absent from docs

---

## Evidence Extraction Priority

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Component list + technology | `docs/components/README.md` → each component `.md` | ARCHITECTURE.md Section 5 |
| External SaaS dependencies | `docs/05-integration-points.md` | ARCHITECTURE.md Section 5 |
| Technology stack details | `docs/06-technology-stack.md` | ARCHITECTURE.md Section 6 |
| Vendor choice rationale | `adr/ADR-*.md` — look for vendor names, "chose X because" | ARCHITECTURE.md Section 12 |
| Cost per component / vendor | `docs/06-technology-stack.md` cost mentions, `docs/09-operational-considerations.md` | ARCHITECTURE.md cost notes |
| Multi-cloud / portability strategy | ADRs referencing cloud-agnostic, multi-cloud, vendor-neutral | ARCHITECTURE.md Section 11 |
| Data export / migration story | `docs/09-operational-considerations.md`, DR sections | ADRs on data strategy |
