---
status: In Progress
date: 2026-05-13
related-adrs:
  - ADR-204
affected-components:
  - order-service
tags:
  - observability
  - compliance
  - audit
bian-capability: "Products › Consumer Banking (PRD / CNSB) › Payment Order Initiation (42933)"
driver: Process
---

# TDR-001: order-service writes audit events only to local disk

## Status

`In Progress`

**Initiative**: Order Desk (architecture v1.2.0)
**Driver**: Process — unstable IT operations with minimal instrumentation and significant blind spots: the audit trail lives on ephemeral local disk.

## Description

`order-service` writes its audit events (order lifecycle, refund authorizations, manual interventions) to a per-instance file, `/var/log/order-service/audit.log`, with no forwarder; the file never leaves the host. `payment-service`, `inventory-service` and `notification-service` already ship structured logs to the central aggregator through the sidecar of ADR-204. Deferred at cut-over: the image predates the sidecar standard and checkout shipped first.

## Impact

- **Operational**: no cross-instance forensics; a pod termination destroys that instance's only copy of the trail.
- **Compliance**: SOC-2 CC7.2 needs retained, reviewable security events; none central — a likely finding at the Q3 2026 assessment.
- **Scalability**: ~12 instances × ~3 GB/day fill the 30 GB ephemeral disk in ~9 days; one page in April when rotation lagged.
- **Consistency**: the one service off the standard; recurring onboarding questions and one-off doc patches.

## Possible Solutions

- **Option A — the ADR-204 sidecar** in the deployment manifest. Lowest risk, supported tooling; 1–2 days plus a staging bake.
- **Option B — a managed log service via SDK**. Drops the sidecar, adds a second logging path to support and supersedes ADR-204 for this service.
- **Option C — accept and isolate**: persistent volume with snapshots, carve-out documented. Cheapest; the SOC-2 finding stays. Only if A is blocked.

## Capability

| Level | Name | Code / BIAN id |
|---|---|---|
| Business Area | Products | `PRD` |
| Business Domain | Consumer Banking | `CNSB` · `146478` |
| Service Domain | Payment Order Initiation | `42933` |

`order-service` serves Payment Order Initiation; Clearing And Settlement (`146476`) is only consumed and goes in `tags`.

## Owner

- **Technical**: Observability squad, Platform team (lead: M. Salazar; capacity confirmed for the September sprint). Compliance counterpart: Security Engineering.
- **Business (P&L)**: Digital Commerce — Order Management (SOC-2 attestation, refund disputes).

---

## History

- 2026-05-13: Created. Status: `Open`. Q2 observability review.
- 2026-09-08: Capability from `BIAN_ALIGNMENT.md`; Driver, lead and business owner added.
- 2026-09-15: `Open` → `In Progress`; retired tag `Ya esta, en local` → `EN CURSO`. Option A in staging (PR #412).
