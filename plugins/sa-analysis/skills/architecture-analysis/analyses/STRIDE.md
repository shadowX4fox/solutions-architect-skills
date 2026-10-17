# STRIDE Threat Model Analysis Spec — Per-Trust-Boundary Security Threats

## Purpose

This spec defines how the `architecture-analysis-agent` performs a STRIDE Threat Model analysis. It extracts trust boundaries from the security architecture, applies the six STRIDE categories to each boundary, generates a threat matrix, and produces prioritized mitigation recommendations.

**Output file**: `analysis/STRIDE-<YYYY-MM-DD>.md`

---

## STRIDE Framework

STRIDE is a structured threat-modeling methodology where each letter represents a threat category:

| Letter | Threat | Definition | Typical Violation |
|--------|--------|-----------|------------------|
| **S** | Spoofing | Impersonating another user, component, or system | Missing authentication, weak tokens, no mTLS |
| **T** | Tampering | Modifying data in transit or at rest | Missing integrity checks, no encryption at rest, writable storage |
| **R** | Repudiation | Denying having performed an action | Missing audit logs, no non-repudiation mechanism |
| **I** | Information Disclosure | Exposing information to unauthorized parties | Verbose error messages, missing TLS, over-broad access |
| **D** | DoS | Making a service unavailable | No rate limiting, no circuit breaker, no resource quotas |
| **E** | Elevation of Privilege | Gaining capabilities beyond authorization | Missing RBAC, container runs as root, no least-privilege |

---

## Trust Boundary Identification

Trust boundaries are points where data crosses from one security domain to another. Extract them from:

### Primary source: `docs/07-security-architecture.md` (or ARCHITECTURE.md Section 7)

Look for:
- Network zones (public internet → DMZ → internal → data)
- Authentication boundaries (JWT validation points, API gateway, service mesh)
- Data classification crossings (sensitive data entering or leaving a zone)
- External integrations (SaaS dependencies, external IdPs, third-party APIs)
- Service-to-service trust (mTLS zones, internal JWT, API keys)

### Secondary source: `docs/05-integration-points.md` and `docs/04-data-flow-patterns.md`

Look for:
- Each integration where a different auth mechanism is used
- Each data flow that crosses a network boundary
- Each flow involving PII, financial, or health data

### Trust Boundary Inventory

Create a list of trust boundaries. For each boundary, define:
- `boundary_id` — TB-01, TB-02, …
- `name` — short name (e.g., "Internet → API Gateway", "API Gateway → Internal Services", "Services → PostgreSQL")
- `from_zone` — source trust zone
- `to_zone` — destination trust zone
- `auth_mechanism` — documented authentication method (e.g., "OAuth2 JWT", "mTLS", "API key", "None", "[NOT DOCUMENTED]")
- `data_classification` — highest sensitivity of data that crosses this boundary (e.g., PII, Financial, Public, Internal)
- `source_file` — where this boundary was found in the architecture docs

### Design Language tag vocabularies (conditional)

If `[design_language_dir]/llms-rules.txt` exists, read its §6 tag taxonomy and record each boundary's zones and auth using the standard's closed vocabularies **in addition to** the free-text values above. If the file is absent, skip this subsection.

- `from_zone` / `to_zone` → **`Trust Zone`**: `Public` · `DMZ` · `Internal` · `Restricted` · `CDE` · `Mgmt-OOB`. Note `CDE` (cardholder data environment) and `Mgmt-OOB` (out-of-band management) have no equivalent in the free-text zone naming and are frequently the boundaries that matter most for PCI scope.
- `auth_mechanism` → **`Authentication`**: `mTLS` · `OAuth2` · `mTLS+OAuth2` · `APIKey` · `SAML` · `none`. The standard requires this tag on every zone-crossing connection, every `[Transaction]` / `[File]` / `[Replication]`, and anything reaching `Scope: External` — a boundary with no documented auth is `none`, which is a legal recorded value, not a blank.
- `data_classification` → **`Data Classification`**: `Public` · `Internal` · `Confidential` · `Restricted` (see the DATA_SENSITIVITY spec for the S-tier mapping). `PII` / `Financial` are `Data Category` values, a different group — do not mix the two in one field.
- A boundary whose endpoints sit in different **`Jurisdiction`** values additionally carries `Cross-border: Yes`.

Two structural rules worth a finding when violated:

- **Trust Zone is inherited by containment.** A container instance inside a Deployment node inherits that node's zone; an element may raise its own zone, **never lower it** below its parent's. CDE scope is therefore derived from the containment structure — if the docs place a lower-zone element inside a higher-zone parent, that is a finding, not a modelling choice.
- **Zone crossings route through a declared gateway** named in `Via`, and that gateway carries the `Authentication` tag. A crossing with no named gateway is an unmitigated Spoofing/Tampering surface — raise it under **S** or **T**.

Every group is a closed vocabulary. Record `[NOT DOCUMENTED]` rather than inventing a zone or auth value.

---

## STRIDE Evaluation Model

For each trust boundary, apply all six STRIDE categories. For each category:

**PASS** — a documented control adequately addresses the threat. Do NOT create a finding.

**FINDING** — the threat is unmitigated or only partially mitigated. Create a finding:

```
boundary_id | stride_category | severity | threat_description | current_control | mitigation_recommendation | adr_reference
```

### Severity Scoring

| Severity | Criteria |
|----------|---------|
| **High** | Exploitable without authentication, can affect multiple users or cause data loss |
| **Medium** | Requires some access or expertise; impact is bounded or recoverable |
| **Low** | Defense-in-depth gap; mitigated elsewhere; low exploitability in practice |

### Controls That Count as Mitigations

| STRIDE category | Controls that count as PASS |
|----------------|---------------------------|
| Spoofing (S) | JWT validation at API gateway, mTLS between services, OAuth2 with short-lived tokens, client certificates |
| Tampering (T) | TLS 1.2+ in transit, AES-256 encryption at rest, HMAC/signature on messages, input validation |
| Repudiation (R) | Centralized structured audit log, non-repudiation fields (user ID, timestamp, action, resource) in all write operations |
| Info Disclosure (I) | TLS everywhere, error responses that don't expose stack traces or internal IDs, field-level encryption for PII |
| DoS (D) | Rate limiting at API gateway (documented RPS limit), HPA with autoscaling, circuit breaker with backpressure |
| Elevation (E) | RBAC with least privilege documented, containers run as non-root, network policies limiting lateral movement, secrets in vault not env vars |

---

## Evidence Extraction

| Data needed | Primary source | Fallback |
|-------------|---------------|---------|
| Trust boundaries | `docs/07-security-architecture.md` | ARCHITECTURE.md Section 7 |
| Authentication mechanisms | `docs/07-security-architecture.md` + `docs/05-integration-points.md` | ARCHITECTURE.md Section 7 |
| Encryption (in transit / at rest) | `docs/07-security-architecture.md` | Per-component `.md` files |
| RBAC / authorization model | `docs/07-security-architecture.md` | ARCHITECTURE.md Section 7 |
| Audit logging | `docs/09-operational-considerations.md` + `docs/07-security-architecture.md` | |
| Rate limiting / DoS controls | `docs/08-scalability-and-performance.md` + `docs/07-security-architecture.md` | |
| Container security (root vs. non-root) | Per-component `.md` files, `docs/09-operational-considerations.md` | |
| Secret management | `docs/07-security-architecture.md` | ADRs referencing "secrets", "vault", "key management" |

---

## Report Sections (in order)

1. **Executive Summary** — number of trust boundaries identified, total STRIDE findings by severity (High / Medium / Low), highest-severity finding, one-line verdict on security posture

2. **Trust Boundary Inventory** — one row per boundary:

   ```
   ID | Name | From Zone | To Zone | Auth Mechanism | Data Classification | Source
   ```
   - `ID` = TB-01, TB-02 …
   Boundaries with `[NOT DOCUMENTED]` auth are automatically flagged as STRIDE-S finding candidates.

3. **STRIDE Matrix** — for each trust boundary, a STRIDE evaluation table:

   Repeat per boundary:
   ```
   ### TB-01 — Internet → API Gateway
   | Auth Mechanism: OAuth2 JWT | Data: PII |

   | # | Threat | Category | Severity | Status | Control / Gap |
   |---|--------|----------|---------|--------|---------------|
   | T1-S | ... | S Spoofing | High | ⚠️ Finding | ... |
   | — | ... | T Tampering | Low | ✅ Pass | TLS 1.3 in transit |
   | T2-R | ... | R Repudiation | Medium | ⚠️ Finding | ... |
   | T3-I | ... | I Info Disclosure | High | ⚠️ Finding | ... |
   | — | ... | D DoS | Medium | ✅ Pass | APIM rate limiting 1000 req/min |
   | — | ... | E Elevation | Low | ✅ Pass | OAuth2 scopes enforced |
   ```
   Every `⚠️ Finding` row carries a threat id — `T<n>-<letter>`, `n` running across all boundaries in reading order, the letter its STRIDE category (T1-S, T2-R, T3-I …); `✅ Pass` rows carry `—`.

4. **High-Priority Threats Table** — all STRIDE findings with severity=High, across all boundaries, ordered by boundary criticality:

   ```
   # | Trust Boundary | STRIDE Category | Threat Description | Recommended Mitigation | ADR Reference
   ```
   - `#` = the threat's id from the STRIDE Matrix (T1-S, T3-I …) — the same finding, listed twice, never renumbered

5. **Top 5 Mitigation Recommendations** — ordered by (severity × ease of remediation):
   - Threat ID (T1-S, etc.)
   - What to implement (specific technology, pattern, or config)
   - Trade-off (performance overhead, operational complexity, cost)

6. **Security Architecture Strengths** — 3–5 bullet points for controls that ARE well-implemented, to give the architect a balanced picture and acknowledge existing investment

7. **Summary Verdict** — overall security posture: which STRIDE categories are well-covered, which are systematically under-addressed, and the single most important security improvement

8. **Documentation Gaps** — missing security information that prevented complete STRIDE coverage:
   - Missing auth mechanism documentation for a boundary
   - Missing encryption-at-rest documentation
   - No audit logging description
   - Trust boundaries inferred (not explicitly documented)

---

## Heat Map

Build a **3×3 ASCII heat map** using axes:
- **Y-axis (vertical)**: Severity — LOW (bottom) to HIGH (top)
- **X-axis (horizontal)**: Exploitability — LOW (requires insider/high-skill, left) to HIGH (unauthenticated/public-facing, right)

Plot threat IDs (T1-S, T2-I, …) at their coordinates.

```
          HIGH SEVERITY
               │
  [low expl.]  ┼──────────── [T1-S] [T3-I]   ← highest priority
               │              (unauthenticated, high impact)
  [low expl.]  ┼──────────── [T2-R] [T5-D]
               │
  [low expl.]  ┼──────────── [T4-E]
               │
          LOW SEVERITY
   INSIDER ────┼──────────── PUBLIC
          exploitability →
```

---

## STRIDE Evaluation Heuristics

When architecture docs are sparse on security detail, use these heuristics:

| Observation | STRIDE implication |
|-------------|-------------------|
| External SaaS dependency (Auth0, Stripe, etc.) with no circuit breaker | D — DoS if SaaS is unavailable |
| API gateway is the only documented auth point | S — internal service-to-service may lack auth |
| No "encryption at rest" mentioned for a database containing PII | T + I — tampering and disclosure risk |
| Audit logging only mentioned at API gateway | R — internal service-level repudiation gap |
| Container images not scanned or base image not specified | E — elevation via vulnerable image |
| Secrets stored in environment variables (not Vault or Key Vault) | I + E — disclosure and privilege escalation |
| Admin endpoints on same network as user-facing endpoints | E — lateral movement risk |
| Rate limiting only at one layer (e.g., APIM but not at service level) | D — bypass via internal route |
| "mTLS planned" without an ADR or implementation doc | S — not yet mitigated |
