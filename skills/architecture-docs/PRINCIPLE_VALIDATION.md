# Principle Validation — Layer 1 Checklist

> **Source of truth for Section 3 (Architecture Principles) validation.**
>
> This file is **executed by the model**, not by code. Each rule has an exact `grep` (or `rg`) command and a pass criterion. Run rules in order. Halt on the first BLOCKING failure, regenerate the offending content, and re-run from the first rule. Maximum 3 rounds, then escalate to the user with all reports side by side.
>
> Optimized for **reliability**, not token cost. Run every rule on every write to `docs/02-architecture-principles.md` — first-write, edit, migration, or release. Do not short-circuit. Do not self-attest "passed" without producing the grep output below the rule.

## Related Documentation

- **SKILL.md** → "Section 3 Enforcement Gate" — the orchestration that calls this file.
- **VALIDATIONS.md** → "Architecture Principles Enforcement (Section 3)" — the human-readable summary of what these rules enforce.
- **ARCHITECTURE_DOCUMENTATION_GUIDE.md** → Section 3 — the canonical principle template.
- **ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md** → Step 5 — first-write trigger for this checklist.
- **agents/reviewers/principle-quality-reviewer.md** — Layer 2 semantic review, runs after Layer 1 passes.

---

## Required Reads (load before running any rule)

| Path | Why |
|---|---|
| `docs/02-architecture-principles.md` | Target file under validation |
| `docs/01-system-overview.md` | Source of truth for Key Metrics + system identity (used by `P-STRUCT-04`, `P-SPECIFIC-01`, `P-QA-CONFLATION-01`) |
| `docs/03-architecture-layers.md` | Reads `<!-- ARCHITECTURE_TYPE: -->` for `P-TYPE-MATRIX-01` |
| `docs/06-technology-stack.md` | Source of truth for system-specific tech tokens (`P-SPECIFIC-01`) |
| `docs/components/**/*.md` | Source of truth for system-specific tech in components (`P-STRUCT-04`, `P-SPECIFIC-01`) |
| `adr/` directory listing | Validates ADR references in `P-ADR-REF-01`. Use `ls adr/` |

If any required file is missing for a *first-write* run, the missing file makes that rule INDETERMINATE — record it as such in the report and treat as BLOCKING (orchestrator must create the file or escalate). Do NOT silently skip.

---

## Run Procedure

```text
1. Read each required file. If a required file is missing → emit INDETERMINATE finding for the affected rules; treat as BLOCKING.
2. Detect arch_type from `<!-- ARCHITECTURE_TYPE: -->` in `docs/03-architecture-layers.md`. If absent → arch_type = "unknown" and skip P-TYPE-MATRIX-01 with a WARNING.
3. Extract per-principle blocks from the principles file. A "principle block" runs from one `### N. <Name>` heading up to the next `### ` heading or end of file.
4. Run rules in the order documented below. For each rule:
   - Execute the documented `grep`/`rg` command via Bash exactly as written.
   - Quote the command output (or "no output" if empty) directly under the rule in the report. Findings without quoted output are treated as FAIL by the orchestrator.
   - Apply the pass criterion. Emit a finding (BLOCKING or WARNING) when the criterion is not met.
5. Emit the final `PRINCIPLE_VALIDATION_REPORT` block (schema below).
6. Hand the report to the orchestrator. The orchestrator decides PASS/FAIL/REVISE based on `blockingFindings`.
```

**Anti-self-attestation rule**: Each rule's section in the report MUST include the literal grep output (or "no output"). The orchestrator's gate text in `SKILL.md` says: *if a rule's report is missing the grep output excerpt, treat the rule as FAIL*.

---

## Rule Reference

Run order is the order below. Halt on the first BLOCKING failure, regenerate, re-run from rule 1. Cap: 3 rounds.

### Group 1 — Structural (BLOCKING)

#### `P-STRUCT-01` — All 9 (or 10) principles in exact order

**Detection** (accepts both canonical `### 1.` and legacy `### 3.1` numbering — pick one form per file, do not mix):
```bash
grep -nE '^### (3\.[0-9]+|[0-9]+\.)[[:space:]]+(Separation of Concerns|High Availability|Scalability First|Security by Design|Observability|Resilience|Simplicity|Cloud-Native|Open Standards|Decouple Through Events)' docs/02-architecture-principles.md
```

**Pass criterion**:
- Output has 9 lines (principles 1–9 only) OR 10 lines (1–9 + 10 Decouple Through Events).
- Names appear in this exact order: Separation of Concerns → High Availability → Scalability First → Security by Design → Observability → Resilience → Simplicity → Cloud-Native → Open Standards → (optional) Decouple Through Events.
- Numbering form is consistent throughout the file: every principle uses canonical `### N.` prefix OR every principle uses legacy `### 3.N` prefix (no mixing).

> **Canonical form (preferred)**: `### 1. Separation of Concerns` — matches `ARCHITECTURE_DOCUMENTATION_GUIDE.md` Section 3 template.
> **Legacy form (accepted for migration support)**: `### 3.1 Separation of Concerns` — older convention used in some pre-v3.17.0 architectures and the `examples/ARCHITECTURE_example_3tier.md` reference. Do not adopt for new architectures.

**Fail message**: `Missing or out-of-order principle(s): <list>. Expected order: 1. Separation of Concerns ... 9. Open Standards [, 10. Decouple Through Events]. Mixing canonical (### N.) and legacy (### 3.N) numbering is also a fail — pick one and apply consistently.`

#### `P-STRUCT-02` — Each principle has Description / Implementation / Trade-offs subsections

**Detection** (per principle block):
```bash
awk '/^### [0-9]+\. /{p=$0; next} /^### [0-9]+\. /{exit} {print}' docs/02-architecture-principles.md \
  | grep -nE '^\*\*(Description|Implementation|Trade-offs):\*\*'
```

For each principle block (extracted in step 3 of the run procedure), run:
```bash
grep -cE '^\*\*Description:\*\*' <principle-block>
grep -cE '^\*\*Implementation:\*\*' <principle-block>
grep -cE '^\*\*Trade-offs:\*\*' <principle-block>
```

**Pass criterion**: each of the three counts is exactly 1 in every principle block.

**Fail message**: `Principle <N> (<Name>) is missing subsection: <Description|Implementation|Trade-offs>`.

#### `P-STRUCT-03` — Section header reflects principle count

**Detection** (accepts both canonical and legacy header forms):
```bash
# Canonical form (preferred): "## Architecture Principles (9 Core Principles)" or "(10 Core Principles)"
grep -nE '^## Architecture Principles \((9|10) Core Principles\)' docs/02-architecture-principles.md

# Legacy form (accepted for migration support): "## 3. Architecture Principles" — used in some pre-v3.17.0 docs
grep -nE '^## 3\. Architecture Principles[[:space:]]*$' docs/02-architecture-principles.md
```

**Pass criterion**:
- At least one match across the two greps.
- **Canonical form**: count in header matches principle count detected by P-STRUCT-01 (9 ↔ "(9 Core Principles)" or 10 ↔ "(10 Core Principles)").
- **Legacy form**: no count assertion possible from the header — count check is delegated to P-STRUCT-01. Emit a WARNING ("Legacy header format detected; consider migrating to canonical form for explicit count enforcement").

**Fail message** (canonical mismatch): `Header count mismatch. Found <N> principles but header says <M>. Update header to '## Architecture Principles (<N> Core Principles)'`.
**Fail message** (no recognized header): `No Section 3 header found. Use the canonical form '## Architecture Principles (<N> Core Principles)' (preferred) or the legacy form '## 3. Architecture Principles'.`

#### `P-STRUCT-04` — P10 only when async patterns are documented

**Detection**:
```bash
# Step 1: does P10 exist?
grep -E '^### 10\. Decouple Through Events' docs/02-architecture-principles.md

# Step 2: do async patterns appear in S1 or components?
grep -irE '(kafka|rabbitmq|sqs|sns|eventbridge|pulsar|nats|kinesis|\bevent[- ]driven\b|\bqueue\b|\btopic\b|\bpubsub\b|\basync\b|\bsaga\b)' \
  docs/01-system-overview.md docs/components/ 2>/dev/null
```

**Pass criterion**:
- If P10 exists, step 2 must return ≥1 match.
- If P10 does not exist, no constraint on step 2.

**Fail message (P10 present but no async)**: `Principle 10 (Decouple Through Events) is included but no async patterns are documented in docs/01-system-overview.md or docs/components/. Either remove P10 or document the async pattern that justifies it.`

### Group 2 — Hygiene (BLOCKING)

#### `P-PLACEHOLDER-01` — No placeholders in principle subsections

**Detection** (whole file):
```bash
grep -nEi '\[(to be defined|tbd|placeholder|fixme|your [a-z]+|describe [a-z]+)\]|<TODO>|TODO:|XXX' docs/02-architecture-principles.md
```

**Pass criterion**: 0 matches.

**Fail message**: `Placeholder text found at line(s) <line>: <excerpt>. Replace with concrete content before finalizing.`

#### `P-CUSTOM-01` — No custom principles beyond canonical 9–10

**Detection**:
```bash
grep -cE '^### [0-9]+\. ' docs/02-architecture-principles.md
```

Plus the names must come from this set (case-sensitive, exact spelling):
`Separation of Concerns | High Availability | Scalability First | Security by Design | Observability | Resilience | Simplicity | Cloud-Native | Open Standards | Decouple Through Events`.

**Pass criterion**:
- Count is 9 or 10.
- Every name appears in the canonical list.

**Fail message**: `Custom principle detected: '<name>' (line <N>). Map this content into one of the canonical 9–10 or remove it.`

### Group 3 — Semantic-lite (BLOCKING)

#### `P-PLATITUDE-01` — No platitude phrases in Implementation / Trade-offs

**Detection** (whole file, but only count matches inside Implementation or Trade-offs blocks):
```bash
grep -niE 'industry best practice|industry standard|we follow best practices|we will be (scalable|secure|reliable|maintainable|observable)|as needed|enterprise-grade|world-class|state of the art|where applicable|as appropriate|robust solution|cutting edge|battle[- ]tested|future[- ]proof' \
  docs/02-architecture-principles.md
```

For each match line, determine which subsection it belongs to (walk back to the nearest `**Description:**` / `**Implementation:**` / `**Trade-offs:**` marker). Count only matches in Implementation or Trade-offs.

**Pass criterion**: 0 matches in Implementation or Trade-offs blocks (Description is exempt — vague aspirational prose there is caught by `P-QA-CONFLATION-01` instead).

**Fail message**: `Platitude phrase '<phrase>' found at line <N> in <subsection> of Principle <K>. Replace with concrete protocols/tools/configuration.`

#### `P-SPECIFIC-01` — Each Implementation has ≥2 system-specific tokens

**Detection** (per principle's Implementation block, model-driven scan):

A "system-specific token" is one of:
1. A tech name that also appears in `docs/06-technology-stack.md` or `docs/components/**/*.md` (verify via grep against those files).
2. A version number matching `\b\d+\.\d+(\.\d+)?\b` (e.g., `Spring Boot 3.1.5`, `TLS 1.3`).
3. A percentage matching `\b\d+(\.\d+)?\s*%\b`.
4. An integer with a unit matching `\b\d+\s*(ms|s|min|hr|GB|TB|MB|KB|RPS|TPS|QPS|node|core|pod|replica|MAU|DAU)\b`.
5. An acronym matching `\b[A-Z]{3,}\b` AND not in the platitude blocklist (TBD/TODO/N/A).
6. A backtick-quoted file path or config key (e.g., `application.yaml`, `spring.datasource.url`).

**Verification command**:
```bash
# For each principle's Implementation block:
grep -E '\b\d+(\.\d+)?\s*(%|ms|s|min|hr|GB|TB|MB|KB|RPS|TPS|QPS|node|core|pod|replica)\b|\b[A-Z]{3,}\b|`[^`]+`' <implementation-block>
# Cross-check tech names against docs/06-technology-stack.md and docs/components/
```

**Pass criterion**: ≥2 distinct qualifying tokens per Implementation block.

**Fail message**: `Principle <N> Implementation has only <K> system-specific tokens (need ≥2). Add concrete tech, version numbers, percentages, units, acronyms, or config paths from this system. Generic verbs and brand-free nouns do not count.`

#### `P-TRADEOFF-QUANT-01` — Each Trade-offs has ≥1 quantification token or cost noun

**Detection** (per principle's Trade-offs block):
```bash
# Quantification tokens:
grep -E '\b\d+(\.\d+)?\s*(%|x|ms|s|min|hr|day|week|month|year|RPS|TPS|QPS|GB|TB|MB|KB|req|node|core|pod|replica|engineer|nine|9s|FTE)\b' <tradeoffs-block>

# OR cost nouns:
grep -iE '(infrastructure cost|licensing|on[- ]call|paging|RTO|RPO|cold start|warm up|vendor lock[- ]?in|debt|maintenance burden|operational burden|migration cost|training|head[- ]?count|capex|opex|egress fee|data transfer|storage cost|compute cost)' <tradeoffs-block>
```

**Pass criterion**: at least one of the two greps returns ≥1 match.

**Fail message**: `Principle <N> Trade-offs has no quantified cost or recognized cost noun. Add a number with a unit (e.g., '3x infrastructure cost', '10-min RTO', '24/7 on-call'), or a recognized cost noun.`

#### `P-TRADEOFF-COUNT-01` — Each Trade-offs has ≥3 bullet items

**Detection** (per principle's Trade-offs block):
```bash
grep -cE '^- ' <tradeoffs-block>
# OR (alternative bullet style):
grep -cE '^[*+] ' <tradeoffs-block>
```

**Pass criterion**: bullet count ≥3 per principle.

**Fail message**: `Principle <N> Trade-offs has only <K> bullet(s) (need ≥3). Honest trade-off lists run cost / complexity / operational burden / migration risk — pick at least three.`

#### `P-TRADEOFF-NEG-01` — Trade-offs is not "None" / "Minimal" / "N/A"

**Detection** (per principle's Trade-offs block):
```bash
grep -iE '^(\*\*Trade-offs:\*\*[[:space:]]*$|\*\*Trade-offs:\*\*[[:space:]]+(none|minimal|n/?a|no significant|negligible)\b)|^[- *+]+[[:space:]]*(none|minimal|n/?a|no significant|negligible|not applicable)\b' <tradeoffs-block>
```

**Pass criterion**: 0 matches.

**Fail message**: `Principle <N> Trade-offs claims 'None' or 'Minimal' or 'N/A'. Every architectural choice has a cost. Surface at least one real one.`

#### `P-QA-CONFLATION-01` — Description is a decision rule, not a quality attribute

**Detection** (per principle's Description block):

A Description is a *quality-attribute conflation* when it:
1. Contains a numeric outcome `\b\d+(\.\d+)?\s*(%|nines?|9s|ms|s|RPS|TPS|QPS|RTO|RPO|SLA|SLO)\b`, AND
2. Does NOT contain a decision verb: `accept|prefer|prioritize|trade|choose|defer|delegate|refuse|favor|reject|require|enforce|mandate`.

```bash
# Per-Description grep:
grep -nE '\b[0-9]+(\.[0-9]+)?\s*(%|nines?|9s|ms|RPS|TPS|QPS|RTO|RPO|SLA|SLO)\b' <description-block>
grep -niE '\b(accept|prefer|prioritize|trade|choose|defer|delegate|refuse|favor|reject|require|enforce|mandate)\b' <description-block>
```

**Pass criterion**: if grep #1 has ≥1 match, grep #2 must also have ≥1 match. If grep #1 has 0 matches, this rule passes.

**Fail message**: `Principle <N> Description states an outcome ("<excerpt>") with no decision verb. Quality attributes (e.g. "99.9% availability") belong in Section 1, not Section 3. Restate as a decision rule, e.g. "We accept 3x infrastructure cost to achieve our HA SLA."`

> See `ARCHITECTURE_DOCUMENTATION_GUIDE.md` → "Quality Attribute vs. Principle — disambiguation" for the full distinction and worked examples.

### Group 4 — Cross-reference (BLOCKING)

#### `P-ADR-REF-01` — Each principle references an ADR or carries the no-ADR sentinel

**Detection** (per principle block):
```bash
grep -nE '\[ADR-[0-9]{3}|\(\.\.\/adr\/ADR-|per [Aa]DR-[0-9]|<!-- NO_ADR_GOVERNS -->|^> No ADR governs this aspect yet' <principle-block>
```

The Implementation block OR the Trade-offs block must contain at least one match.

**Pass criterion**: ≥1 match per principle (in Implementation or Trade-offs combined).

**Fail message**: `Principle <N> (<Name>) has no ADR reference. Add a link to the governing ADR (e.g., 'per [ADR-007](../adr/ADR-007-multi-region.md)') OR insert the explicit sentinel '<!-- NO_ADR_GOVERNS -->' to acknowledge that no ADR currently governs this aspect.`

**Hallucination guard**: For each `[ADR-NNN]` link the model cites, verify the file exists:
```bash
ls adr/ADR-NNN*.md
```
If the file does not exist, that match does NOT count toward the per-principle threshold and emits a separate BLOCKING finding (rule alias: `P-ADR-REF-01a — broken ADR reference`).

### Group 5 — Cross-principle (WARNING)

#### `P-CROSS-CONTRA-01` — Curated keyword-pair contradictions across principles

**Detection** (whole file):

| Pair | Detection |
|---|---|
| Simplicity ↔ Scalability First | Principle 7 (Simplicity) Implementation contains `monolith\|single binary\|single service\|single deployable` AND Principle 3 (Scalability First) Implementation contains `horizontal scaling per service\|microservice\|service-per\|database-per-service` |
| Simplicity ↔ Cloud-Native | Principle 7 contains `single binary\|single deployment unit` AND Principle 8 (Cloud-Native) contains `serverless\|FaaS\|Lambda\|Cloud Functions\|microservices` |
| Open Standards ↔ Cloud-Native | Principle 9 (Open Standards) contains `vendor[- ]neutral\|portable\|cloud[- ]agnostic` AND Principle 8 (Cloud-Native) contains `proprietary\|vendor[- ]specific\|managed-only` |

```bash
# Example (Simplicity vs Scalability):
awk '/^### 7\. /,/^### [0-9]+\. /' docs/02-architecture-principles.md | grep -iE 'monolith|single binary|single service|single deployable'
awk '/^### 3\. /,/^### [0-9]+\. /' docs/02-architecture-principles.md | grep -iE 'horizontal scaling per service|microservice|service-per|database-per-service'
```

**Pass criterion**: WARNING-only when a pair fires. Layer 2 reviewer escalates to BLOCKING when context confirms the contradiction is real.

**Fail message** (WARNING): `Potential contradiction: Principle 7 (Simplicity) says '<excerpt>' but Principle 3 (Scalability First) says '<excerpt>'. Layer 2 review will assess whether these are actually compatible.`

### Group 6 — Type-specific (BLOCKING when arch_type is known)

#### `P-TYPE-MATRIX-01` — Architecture-type-specific concept expectations

Skipped (with WARNING noting "type unknown") when `<!-- ARCHITECTURE_TYPE: -->` is absent from `docs/03-architecture-layers.md`.

When `arch_type` is known, the rule consumes the **Architecture-Type Matrix** below. For each row in the matrix that matches `arch_type`, the principle's Implementation OR Trade-offs block must contain at least one phrase from `requiredAnyOf`.

**Detection** (per matched row):
```bash
awk '/^### <principleNumber>\. /,/^### [0-9]+\. /' docs/02-architecture-principles.md \
  | grep -iE '<requiredAnyOf joined by |>'
```

**Pass criterion**: ≥1 match per row.

**Fail message**: `Architecture type is <ARCH_TYPE>. Principle <N> (<Name>) Implementation/Trade-offs is expected to mention any of: <requiredAnyOf list>. None found. Add at least one or document why this principle does not apply via the '<!-- TYPE_MATRIX_WAIVED: P-N: <reason> -->' sentinel.`

> The waiver sentinel `<!-- TYPE_MATRIX_WAIVED: P-<principleNumber>: <reason> -->` is the only escape from a type-matrix rule. Layer 2 reviewer flags every waiver for explicit user confirmation.

---

## Architecture-Type Matrix

> **Maintenance note**: keep this matrix aligned with the corresponding `references/<TYPE>-ARCHITECTURE.md` reference doc. When an architecture type's reference doc evolves (new layer, new pattern), update the matching row here. Future work: a meta-validator that diffs this table against the reference docs.

### MICROSERVICES

| Principle | Required-any-of (Implementation OR Trade-offs must mention one) |
|---|---|
| 1. Separation of Concerns | `bounded context`, `service boundary`, `database-per-service`, `domain-driven`, `single responsibility per service` |
| 3. Scalability First | `horizontal scaling per service`, `auto-scaling`, `Kubernetes HPA`, `KEDA`, `service replicas`, `stateless service` |
| 5. Observability | `distributed trace`, `correlation id`, `OpenTelemetry`, `Jaeger`, `Zipkin`, `Tempo`, `service mesh telemetry` |
| 6. Resilience | `circuit breaker`, `bulkhead`, `retry with backoff`, `timeout`, `dead-letter`, `DLQ`, `Resilience4j`, `Polly`, `Hystrix`, `Istio retry policy` |
| 8. Cloud-Native | `Kubernetes`, `service mesh`, `Istio`, `Linkerd`, `container`, `Helm`, `Ingress` |

### BIAN

| Principle | Required-any-of |
|---|---|
| 1. Separation of Concerns | `service domain`, `BIAN`, `control record`, `service operation`, `business area`, `business domain` |
| 4. Security by Design | `regulatory`, `compliance`, `audit log`, `PCI`, `SOX`, `GDPR`, `AML`, `KYC`, `PSD2` |
| 5. Observability | `regulatory reporting`, `audit trail`, `transaction log`, `compliance log` |
| 9. Open Standards | `BIAN V12.0`, `BIAN service landscape`, `ISO 20022`, `SWIFT`, `OpenAPI`, `Swagger` |

### 3-TIER

| Principle | Required-any-of |
|---|---|
| 1. Separation of Concerns | `presentation tier`, `application tier`, `data tier`, `no direct database access from presentation`, `tier boundary` |
| 3. Scalability First | `stateless`, `session externalized`, `load balancer`, `tier independence`, `horizontal scaling` |
| 6. Resilience | `database failover`, `session affinity`, `connection pool`, `health check`, `tier-level circuit breaker` |

### N-LAYER

| Principle | Required-any-of |
|---|---|
| 1. Separation of Concerns | `domain layer`, `application layer`, `infrastructure layer`, `ports and adapters`, `dependency inversion`, `clean architecture`, `hexagonal` |
| 7. Simplicity | `framework-free domain`, `pure domain`, `no infrastructure leak`, `single layer responsibility` |
| 9. Open Standards | `dependency injection`, `interface segregation`, `solid principles`, `aggregate boundary` |

### META

| Principle | Required-any-of |
|---|---|
| 1. Separation of Concerns | `channel layer`, `UX layer`, `business scenario layer`, `integration layer`, `domain layer`, `core layer`, `BIAN` |
| 4. Security by Design | `regulatory`, `compliance`, `audit log`, `AML`, `KYC`, `PSD2`, `regulator-facing` |
| 9. Open Standards | `BIAN`, `ISO 20022`, `OpenAPI`, `Swagger`, `OAuth 2.0`, `SAML` |

---

## Output Format

The model emits exactly this block at the end of the validation pass. The orchestrator parses it.

```
PRINCIPLE_VALIDATION_REPORT:
  status: PASS | FAIL
  archType: MICROSERVICES | META | BIAN | 3-TIER | N-LAYER | unknown
  principlesFound: <int 9 or 10>
  totalChecks: <int>
  blockingFindings: <int>
  warningFindings: <int>
  round: <1 | 2 | 3>
  findings:
    - ruleId: P-PLATITUDE-01
      severity: BLOCKING
      principle: 4
      principleName: Security by Design
      subsection: Implementation
      lineRef: Lines 142-145
      grepCommand: |
        grep -niE 'industry best practice|industry standard|...' docs/02-architecture-principles.md
      grepOutput: |
        144:- We follow industry best practices for encryption
      excerpt: "We follow industry best practices for encryption..."
      expected: "system-specific implementation, no blocklisted phrases"
      fix: "Replace with specific protocols, e.g., 'TLS 1.3, AES-256-GCM, AWS KMS HSM-backed keys per ADR-007'"
    - ruleId: P-ADR-REF-01
      severity: BLOCKING
      principle: 7
      principleName: Simplicity
      subsection: Implementation+Trade-offs (combined)
      lineRef: Lines 280-310
      grepCommand: |
        awk '/^### 7\. /,/^### [0-9]+\. /' docs/02-architecture-principles.md | grep -nE '\[ADR-[0-9]{3}|...'
      grepOutput: |
        no output
      excerpt: "(no ADR link or sentinel found)"
      expected: "ADR link or `<!-- NO_ADR_GOVERNS -->` sentinel"
      fix: "Add 'per [ADR-NNN](...)' OR `<!-- NO_ADR_GOVERNS -->`"
```

**Field rules**:
- `status: PASS` only when `blockingFindings == 0`. Warnings do not flip status to FAIL.
- `grepCommand` and `grepOutput` are MANDATORY for every finding. A finding without them is treated as FAIL by the orchestrator (anti-self-attestation).
- `lineRef` references the offending line range in `docs/02-architecture-principles.md`.
- `findings[]` is empty when status is PASS — but the orchestrator still requires the report block to confirm the validation ran.

---

## Failure Semantics

| Outcome | Orchestrator action |
|---|---|
| `status: PASS`, `blockingFindings: 0`, `warningFindings: 0` | Layer 1 done. Proceed to Layer 2 (`principle-quality-reviewer`). |
| `status: PASS`, `blockingFindings: 0`, `warningFindings: ≥1` | Layer 1 done with warnings. Surface warnings in the user-facing summary, proceed to Layer 2. |
| `status: FAIL`, `blockingFindings: ≥1` | Show findings to the model, regenerate `docs/02-architecture-principles.md`, re-run from Layer 1 rule 1. Increment round counter. |
| `round == 3 AND status: FAIL` | Escalate to user with all 3 rounds' reports side by side. Do NOT silently accept. The user picks: (a) edit manually, (b) hand-override (with explicit acknowledgment), or (c) abort the workflow. |

---

## Appendix A — Mandatory-Field Placeholder Map

Used by Step 5 of `ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md` and any release-time placeholder gate. The fields below MUST NOT contain placeholders (`[To be defined]`, `[TBD]`, `[PLACEHOLDER]`, `<TODO>`, `TODO:`, `XXX`, `[FIXME]`, `[your ...]`, `[describe ...]`).

### Scope: `first-write` (Step 5 → before Step 6)

| File | Mandatory fields |
|---|---|
| `docs/01-system-overview.md` | System Name, Purpose, Business Value, every Key Metric row (Read TPS, Write TPS, Latency p95/p99, SLA, Concurrent Users) |
| `docs/02-architecture-principles.md` | Every Description / Implementation / Trade-offs subsection of every principle (also enforced by `P-PLACEHOLDER-01`) |
| `docs/03-architecture-layers.md` | `<!-- ARCHITECTURE_TYPE: -->` value, every layer name, every layer description |
| `docs/06-technology-stack.md` | Languages, Frameworks, Databases, Infrastructure tables — no placeholder cell |
| `docs/07-security-architecture.md` | Authentication mechanism, Authorization model, Encryption-in-transit, Encryption-at-rest |
| `docs/components/<system>/NN-*.md` | Type, Technology, C4 Level, Description (≤120 char tagline), Purpose |
| `docs/components/<system>.md` | Owner, Containers count, Description |

### Scope: `release` (Workflow 10 — additive over `first-write`)

All `first-write` fields PLUS:
- Every cell in every `docs/**/*.md` file may contain placeholders only when accompanied by a tracked TODO comment of the form `<!-- DEFERRED: <reason> (planned for v<X.Y.Z>) -->`. Any unmarked placeholder fails release.

### Scope: `edit` (default for incremental edits)

Permissive — only the field being edited is checked. Allows in-progress drafts to ship placeholders elsewhere.

### Detection

```bash
# Scope first-write — run after Step 5 completes and before Step 6 delegates ADRs:
grep -rnE '\[(to be defined|tbd|placeholder|fixme|your [a-z]+|describe [a-z]+)\]|<TODO>|TODO:|XXX' \
  docs/01-system-overview.md docs/02-architecture-principles.md docs/03-architecture-layers.md \
  docs/06-technology-stack.md docs/07-security-architecture.md docs/components/

# Scope release — additionally include all docs/, but allow tracked deferrals:
grep -rnE '\[(to be defined|tbd|placeholder|fixme)\]|<TODO>|TODO:|XXX' docs/ \
  | grep -v 'DEFERRED:' \
  || true  # 0 matches = pass
```

**Pass criterion**: 0 unaccounted matches in the scoped fields.

**Fail message**: `Mandatory field placeholder found at <file>:<line>: <excerpt>. Replace with concrete content before <first-write step 6 | release>.`
