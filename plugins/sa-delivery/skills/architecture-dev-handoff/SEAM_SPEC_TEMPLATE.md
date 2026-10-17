# Interface Contract: [UPSTREAM_COMPONENT] → [DOWNSTREAM_COMPONENT]

<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->
<!-- TEMPLATE_VERSION: 4.3.1 -->
| Field | Value |
|-------|-------|
| Related edge | [EDGE_ID_FROM_EKONTE] |
| Runtime View Version | [EKONTE_VERSION] |
| Standards Version | [SETTEI_VERSION] |
| Decision | [ADR-NNN link or NOT DOCUMENTED] |
| Generated | [GENERATION_DATE] |

### Role Quick Index <!-- SECTION: Role Quick Index -->

| Audience | Read first in this document |
|----------|-----------------------------|
| **Dev** | Interaction → Entry state → Exit state → Mutual assumptions → Ownership |
| **QA** | Failure semantics → Entry state → Exit state → Mutual assumptions |
| **Ops / SRE** | Failure semantics → Observability at the interface → Change log |

Full-kit reading order across the four handoff documents is in `../README.md`.

Continuity contract between two adjacent services. This is where most
integration defects originate — every mutual assumption is binding.
Changing one is an interface change, not a local change.

---

## Interaction <!-- SECTION: Interaction -->

| Aspect | Value |
|--------|-------|
| Style | [sync / async / batch / stream] |
| Transport | [PROTOCOL — HTTP/1.1, HTTP/2, gRPC, Kafka, SQS, ...] |
| Interaction label | [INTERACTION_LABEL — payload `interaction_label`, governed mode only; otherwise omit this row] |
| Contract | [SCHEMA_REFERENCE_AND_VERSION or NOT DOCUMENTED] |
| Compatibility | [back/forward compatibility rules, deprecation window or NOT DOCUMENTED — link to CROSS_CUTTING_STANDARDS § Versioning] |

> **Design Language governed mode**: the payload's frontmatter decides — never look for the standard yourself (it ships in the plugin, never in the project). `design_language: governed` → add the row, its value the payload's `interaction_label` **verbatim** (the label the container diagram draws on this edge, already held to the standard's §5.3–§5.4 by `label-check.js`; a `[NOT DOCUMENTED — …]` value is carried as it stands), and its label localized under `doc_language: es` as `Etiqueta de interacción`. `design_language: fallback` → omit the row entirely. `kit-check.js` holds the row to the payload: missing, different from `interaction_label`, or present in fallback mode fails the kit.

**Panel** — the pair on the container diagram, cut from `docs/03` (generated, never hand-edited):

[INTERFACE_PANEL]

---

## Entry state <!-- SECTION: Entry state -->

What the downstream may assume is already true when it is invoked:

[ENTRY_STATE_LIST]

<!--
Bullet template — one line per precondition:
- [precondition]
- [auth context propagated / not propagated]
- [ordering guarantee, if any]
- [idempotency-key handling per CROSS_CUTTING_STANDARDS § Idempotency]
-->

---

## Exit state <!-- SECTION: Exit state -->

What the downstream guarantees when it returns or emits:

[EXIT_STATE_LIST]

<!--
Bullet template:
- [postcondition]
- [side effects that are visible to others]
- [emitted event names / topics, if any]
-->

---

## Mutual assumptions (binding) <!-- SECTION: Mutual assumptions -->

Assumptions listed here are binding. Changing one is an interface change, not
a local change.

**Upstream assumes:**

[UPSTREAM_ASSUMPTIONS_LIST]

**Downstream assumes:**

[DOWNSTREAM_ASSUMPTIONS_LIST]

<!--
Examples:
Upstream assumes:
  - Downstream is idempotent on `Idempotency-Key` header
  - Downstream tolerates duplicate delivery within a 24h window
  - Downstream returns 409 on business-rule conflict, never 500

Downstream assumes:
  - Caller retries with exponential backoff (see CROSS_CUTTING_STANDARDS § Resilience)
  - Caller does not require message ordering
  - Caller supplies a stable correlation-id per CROSS_CUTTING_STANDARDS § Observability
-->

---

## Failure semantics <!-- SECTION: Failure semantics -->

Row-for-row responsibilities under each failure condition. The upstream
and downstream cells together define the recovery contract.

| Condition | Upstream behaviour | Downstream behaviour |
|-----------|--------------------|----------------------|
| timeout | [retry policy, budget] | [must be idempotent on key] |
| downstream unavailable | [circuit break / queue / fail fast] | — |
| poison message | — | [DLQ, alert, replay path] |
| partial failure | [compensating action] | [compensation contract] |
| version mismatch | [reject / degrade / migrate] | [reject / degrade / migrate] |

Cascade classification (from `analysis/BLAST_RADIUS-*.md`): [CASCADE_CLASSIFICATION or NOT DOCUMENTED — run /sa-analysis:architecture-analysis blast-radius]

---

## Ownership <!-- SECTION: Ownership -->

Data owned by the upstream and reads-only-through-contract from the
downstream side. No shared mutable ownership anywhere in the system.

| Direction | Fields / entities |
|-----------|-------------------|
| Owned by upstream | [FIELDS_OWNED_UPSTREAM] |
| Owned by downstream | [FIELDS_OWNED_DOWNSTREAM] |
| Reads-only (via this interface) | [READS_ONLY_FIELDS] |

---

## Observability at the interface <!-- SECTION: Observability at the interface -->

The interface must be debuggable from either end without joining logs across
teams.

| Signal | Requirement |
|--------|-------------|
| Correlation | [TRACE_PROPAGATION_REQUIREMENT — per CROSS_CUTTING_STANDARDS § Observability] |
| Required metrics (both sides) | [METRIC_NAMES_LIST] |
| Log fields | [LOG_FIELDS_LIST] |

---

## Change log <!-- SECTION: Change log -->

Interface changes require a new ADR — see [Return Path](../SYSTEM_RUNTIME_VIEW.md#return-path).

| Date | Change | ADR |
|------|--------|----:|
| [GENERATION_DATE] | Initial interface contract | [ADR-NNN link or NOT DOCUMENTED] |

---

*Generated by `sa-skills:architecture-dev-handoff` on [GENERATION_DATE]*
*Sources: `docs/05-integration-points.md`, `analysis/BLAST_RADIUS-*.md`, `adr/`*
