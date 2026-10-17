# Data Sensitivity & Flow Analysis Spec

## Purpose

This spec defines how the `architecture-analysis-agent` performs a Data Sensitivity and Flow analysis. It classifies every data store, queue, and cache by sensitivity tier, traces data flows involving sensitive data, identifies encryption and retention gaps, and generates data protection recommendations.

**Output file**: `analysis/DATA-SENSITIVITY-<YYYY-MM-DD>.md`

---

## Classification Model

### Data Sensitivity Tiers

Apply to every data store, queue, cache, and log target documented in the architecture.

| Tier | Label | Examples | Controls Required |
|------|-------|---------|-------------------|
| **S1** | Restricted | PII, PHI, payment card data, credentials, API keys, signing keys, PII-adjacent (user IDs linkable to individuals) | Encryption in transit (TLS 1.2+), encryption at rest (envelope/TDE), access logging, data masking in logs, retention limit per the documented policy, deletion guarantee |
| **S2** | Confidential | Internal business data (contracts, pricing, internal metrics), session tokens, non-PII user preferences | Encryption in transit required, encryption at rest recommended, access control required |
| **S3** | Internal | Operational metadata, aggregate/anonymized metrics, deployment state, non-sensitive config | Access control recommended; encryption best-effort |
| **S4** | Public | Publicly served content, open API responses, documentation | No special controls required |
| **Unknown** | Undocumented sensitivity | Store/flow exists in docs but no data classification is stated | Must appear in Documentation Gaps |

### Design Language tag vocabularies (conditional)

If `[design_language_dir]/llms-rules.txt` exists, read its §6 tag taxonomy and **emit the standard's tag values alongside the S-tiers** — in the Data Inventory table, add a `Tags` column carrying `Data Classification` and `Data Category`. If the file is absent, skip this subsection and report S-tiers only.

The S-tier labels are the same four words as the standard's `Data Classification` group, so the mapping is 1:1 and requires no judgment:

| S-tier | `Data Classification` |
|---|---|
| S1 | `Restricted` |
| S2 | `Confidential` |
| S3 | `Internal` |
| S4 | `Public` |
| Unknown | *(no tag — a Documentation Gap, never a guessed value)* |

`Data Category` is a **separate, multi-valued** group and does not derive from the tier: `PII` · `SPI` · `CHD` · `KYC-AML` · `Financial` · `None`. Assign only categories the architecture documents explicitly — a store described as holding "customer records" is `PII` only if the docs say so.

Two rules from the standard that change findings, not just labels:

- **High-watermark on connections.** A connection's `Data Classification` is the highest classification of anything crossing it, and can never be lower than the classification of the element at *either* end. A `Restricted` store read by an `Internal` service emits Restricted data the moment the read succeeds. Flag any flow in the Data Flow Trace whose stated classification is below either endpoint's — that is what check `C-13` reports.
- **`Criticality` is a separate closed group** (`Tier1`…`Tier4`) and is intrinsic to the element, not derived from sensitivity. Do not infer one from the other.

All four groups are closed vocabularies. Write the value or record a gap; never coin one.

---

## Data Inventory

Enumerate all data stores, queues, and caches from:
- `docs/components/**/*.md` — "Stores", "Data Model", "DDL", or "Redis Key Schema" sections
- `docs/04-data-flow-patterns.md` — entity movement, data stores referenced in flows
- `docs/07-security-architecture.md` — data classification table (if present)
- ADRs mentioning specific data stores or their data content

**Data Inventory table:**
```
Store / Queue / Cache | Type | Sensitivity Tier | Contains (examples) | Encryption at Rest | Encryption in Transit | Retention Policy | Source
```

- `Type` = relational DB / document store / object store / message queue / cache / log / search index
- `Contains (examples)` = 2–3 representative data field types (e.g., "user_id, email, notification_text")
- Encryption = Documented / Not Documented / None (if explicitly stated as unencrypted)
- `Retention Policy` = documented period (e.g., "90 days") or "[NOT DOCUMENTED]"

---

## Sensitive Data Flow Map

Identify and trace every data flow that **touches an S1 or S2 data store**.

For each sensitive flow:
1. Extract the flow path from `docs/04-data-flow-patterns.md` (or ARCHITECTURE.md Section 4)
2. Trace only the portion of the flow that carries sensitive data
3. Classify each hop's transport security

**Per-flow analysis table:**
```
Step | From | To | Protocol | Carries Sensitive Data? | Encryption in Transit | Gap
```
- `Protocol` = HTTPS / gRPC-TLS / mTLS / AMQP / plain HTTP / Redis protocol / internal cluster / etc.
- `Gap` = G1–G5 classification (see below) or "None"

**Render Mermaid sequence diagrams for the top 3 flows touching S1 (Restricted) data:**

> **Design Language governed mode** (when `llms-mermaid.txt` is present): the contract's syntax layer binds — operators `->>` / `-->>` only, quoting, the 200-character ceiling, one fence — and the block opens with `%% Analysis exhibit — not a registered view; no Diagram ID`. §12's Dynamic-view label regime does **not**: the per-hop protocol and encryption markers (`HTTPS`, `mTLS`, `TLS`) are the evidence this analysis exists to show, so they stay on the messages. This is an exhibit, not a registered `-DYN-` view.

```mermaid
sequenceDiagram
  participant Client
  participant Gateway as API Gateway (TLS)
  participant Service as Notification Service
  participant DB as PostgreSQL (S1 - PII)

  Client->>Gateway: POST /notifications (HTTPS)
  Gateway->>Service: Forward request (mTLS)
  Service->>DB: INSERT user_id, body (TLS)
  DB-->>Service: OK
  Service-->>Gateway: 201 Created
  Gateway-->>Client: 201 Created
```

Annotate each arrow with the transport protocol and whether it is encrypted.

---

## Gap Classification

For each S1 or S2 data store or flow, check for the following gaps:

| Gap | Definition | Severity |
|-----|-----------|---------|
| **G1** | S1 data flows over unencrypted transport (plain HTTP, unencrypted queue, etc.) | CRITICAL |
| **G2** | S1 data stored without encryption at rest (no TDE, no envelope encryption) | CRITICAL |
| **G3** | Retention period exceeds the retention limit documented in the architecture (e.g., GDPR 30-day deletion SLA, PCI 90-day log retention max) | HIGH |
| **G4** | S1 data crosses a trust boundary without an explicit ADR or security architecture decision authorizing it | HIGH |
| **G5** | Data store sensitivity is undocumented — cannot assess controls | MEDIUM |

---

## Encryption Gaps Table

Collect all G1 and G2 findings:

```
# | Gap | Data Store / Flow | Sensitivity | Protocol / Storage | Missing Control | Source
```
- `#` = G1-01, G1-02 … / G2-01, G2-02 …

---

## Retention Gaps Table

Collect all G3 findings:

```
# | Data Store | Documented Retention | Retention Limit | Overage | Source
```
- `#` = G3-01, G3-02 …- `Retention Limit` = the retention limit the architecture or its ADRs state (a regulation, a policy); "[NOT DOCUMENTED]" if the policy is not in the docs

---

## Heat Map

Build a **3×3 ASCII heat map**:
- **Y-axis (vertical)**: Sensitivity — S4/Unknown (bottom) to S1 Restricted (top)
- **X-axis (horizontal)**: Control Coverage — FULL (left) to NONE (right)

**Control Coverage scoring:**
- FULL = encryption in transit + at rest + access logging + retention policy all documented
- PARTIAL = some controls documented but not all required for the tier
- NONE = no controls documented (or explicitly absent)

Plot data store / flow IDs at their coordinates (e.g., "G1-01", "G3-02").

```
         S1 - RESTRICTED
              │
  [...]  ─────┼───── [...]
              │
  [...]  ─────┼───── [...]
              │
  [...]  ─────┼───── [...]
              │
         S4 - PUBLIC
   FULL ──────┼──────── NONE
         CONTROL COVERAGE
```

---

## Report Sections (in order)

1. **Executive Summary** — total S1/S2/S3/S4/Unknown stores, G1–G5 gap counts, highest-risk finding, one-line data protection verdict
2. **Data Inventory** — full table (all classified stores, queues, caches)
3. **Sensitive Data Flow Map** — per-flow analysis table + Mermaid diagrams for top-3 S1 flows
4. **Encryption Gaps (G1 + G2)** — critical gap table (omit section if no gaps found)
5. **Retention Gaps (G3)** — retention table (omit section if no documented retention limit)
6. **Cross-Boundary Leakage (G4)** — table of unauthorized trust-boundary crossings, `# | Flow | From Zone | To Zone | Sensitivity | Authorizing Decision | Source` with `#` = G4-01, G4-02 … and `Authorizing Decision` = the ADR or security-architecture section, or `[NOT DOCUMENTED]` (omit if none)
7. **Data Sensitivity Heat Map** — sensitivity × control coverage (3×3 ASCII)
8. **Top 5 Data Protection Recommendations** — ordered by (severity × sensitivity tier); each cites finding ID + source file
9. **Summary Verdict** — overall data protection posture: what is protected, what is exposed, where the retention limit is breached
10. **Documentation Gaps** — stores with undocumented sensitivity (G5), flows with no documented transport protocol, retention policies not stated

---

## Evidence Extraction Priority

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Data store list | `component-cli.ts list` → entries with `type` in {Database, Cache, Message Broker, Object Storage} | `docs/components/README.md`, then ARCHITECTURE.md Section 5 |
| Data classification | `docs/07-security-architecture.md` data classification table | `docs/components/**/*.md` "Security" sections |
| Data field examples | `docs/components/**/*.md` DDL / Redis key schema / data model sections | ARCHITECTURE.md Section 2 |
| Encryption at rest | Component `.md` files "Security" section | `docs/07-security-architecture.md` |
| Encryption in transit | `docs/07-security-architecture.md` trust boundary controls | `docs/05-integration-points.md` security column |
| Data flows | `docs/04-data-flow-patterns.md` | ARCHITECTURE.md Section 4 |
| Retention policy | `docs/09-operational-considerations.md` backup/retention section | Component `.md` files / ADRs |
| Retention limit | ADRs referencing GDPR, PCI, HIPAA, data retention policy | `docs/07-security-architecture.md` regulatory subsection |
| Trust boundary definitions | `docs/07-security-architecture.md` trust boundary inventory | ARCHITECTURE.md Section 7 |
