<!-- BIAN_ALIGNMENT_VERSION: 3.0 -->
<!-- BIAN_RELEASE: 14.0.0 -->
<!-- BIAN_SOURCE: bundled (sa-requirements v[plugin-version]) -->
<!-- DESIGN_LANGUAGE_CODES: [present | absent] -->
<!-- PO_SPEC_SOURCE: [filename] -->
<!-- GENERATED: YYYY-MM-DD -->

# BIAN Capability Alignment <!-- SECTION: BIAN Capability Alignment -->

> This is BIAN's report shape. Another capability framework (`--framework`) uses the same sections with its own level names, titled `# Capability Alignment`, without Diagram ID Segments and API Surface (BIAN only).

**PO Spec**: [filename]
**Capability model**: BIAN Service Landscape v14.0.0, as published — 8 Business Areas · 43 Business Domains · 341 Service Domains
**Generated**: YYYY-MM-DD
**Status**: Generated — review with the architecture team before design begins.

> BIAN is reproduced unadapted: nothing renamed, merged, added or dropped. Every role definition below is quoted from the published landscape.

---

## Summary <!-- SECTION: Summary -->

**Business Areas**: 8 · **🟢**: N · **🟡**: N · **⚪**: N · **Business Domains impacted**: M of 43 · **Service Domains impacted**: K of 341

| # | Business Area | `DOM` | Status | Business Domains Impacted | Service Domains Impacted |
|---|---|---|---|---|---|
| 1 | Business Management | `BMG` | ⚪ Not Applicable | 0/3 | 0 |
| 2 | Resource Management | `RSM` | ⚪ Not Applicable | 0/4 | 0 |
| 3 | Finance And Risk Management | `FRM` | 🟡 Partial | 1/6 | 2 |
| 4 | Operations | `OPS` | 🟢 Impacted | 2/5 | 6 |
| 5 | Products | `PRD` | 🟢 Impacted | 1/9 | 3 |
| 6 | Customers | `CUS` | 🟡 Partial | 1/5 | 1 |
| 7 | Channels | `CNL` | 🟢 Impacted | 2/5 | 4 |
| 8 | Business Development | `BDV` | ⚪ Not Applicable | 0/6 | 0 |

> Business Domain totals per area are fixed by BIAN: 3 · 4 · 6 · 5 · 9 · 5 · 5 · 6 = 43.
> Omit the `DOM` column entirely when `DESIGN_LANGUAGE_CODES: absent`.

---

## Diagram ID Segments <!-- SECTION: Diagram ID Segments -->

> Emit this section **only** when the SA Design Language Standard is bundled. Omit it entirely — heading included — when `DESIGN_LANGUAGE_CODES: absent`. Never fill a cell with a guess.

For each impacted Business Domain, the `DOM` and `CAP` segments a C4 view will carry under the SA Design Language Standard — `<LSC>-<DOM>-<CAP>-<SUBJ>-<LVL>-<NNN>`:

| Business Area | `DOM` | Business Domain | `CAP` | BIAN id | Status |
|---|---|---|---|---|---|
| Operations | `OPS` | Clearing And Settlement | `CLSE` | `146476` | 🟢 |
| Operations | `OPS` | Operational Services | `OPSV` | `146497` | 🟢 |
| Products | `PRD` | Consumer Banking | `CNSB` | `146478` | 🟢 |
| Channels | `CNL` | Cross Channel | `XCHN` | `146482` | 🟢 |
| Channels | `CNL` | Servicing | `SERV` | `39477` | 🟡 |

Every value is looked up in `bian-registry.json`, never composed. A `CAP` is four letters; a `DOM` is three.

**Service Domains do not appear here.** Below the Business Domain, BIAN defines 341 Service Domains, and a Service Domain is a tag and a register column, **never an ID segment** — the ID stays at six segments (`llms-rules.txt` §1.3). The impacted Service Domains are enumerated per area below and carried as capability tags on the modelled elements.

`LSC` (owning legal entity), `SUBJ` (system subject code) and `NNN` are **assigned by the diagram register, never chosen here** — `SUBJ` is minted only when the CMDB business-application record is created. This block supplies the two segments the alignment can determine, and nothing more.

---

## Per-Area Analysis <!-- SECTION: Per-Area Analysis -->

> One sub-section per Business Area, all 8 present regardless of status. The pattern below is shown once in full for a 🟢 area and once for a ⚪ area; repeat it for the remaining six.

### 1. Business Management — ⚪ Not Applicable

**Rationale**: [one sentence — why this status]

**Impacted Business Domains**: _None._

_(not impacted: Business Direction, Corporate Relations, Corporate Services)_

---

### 4. Operations — 🟢 Impacted

**Rationale**: [one sentence — why this status]

**Impacted Business Domains** (2 of 5):

- 🟢 **Clearing And Settlement** `CLSE` — [one-line rationale] (PO Spec § 4.2)
- 🟡 **Operational Services** `OPSV` — [one-line rationale] (PO Spec § 4.5)

_(not impacted: External Agency, Custody, Collateral And Documents, Accounting Services)_

**Impacted Service Domains** (6):

| Service Domain | BIAN id | Realizes / Consumes | PO Spec § | Role definition (BIAN, verbatim) |
|---|---|---|---|---|
| Payment Orchestration | `48782` | Realizes | § 4.2 | [quoted verbatim from the area file's **What it does.** paragraph] |
| Transaction Engine | `35970` | Realizes | § 4.2 | [quoted verbatim] |
| Payment Rail | `47741` | Consumes | § 4.3 | [quoted verbatim] |

> Under `Business Domain: Clearing And Settlement` above; repeat the table per impacted Business Domain, or add a Business Domain column when the area has several.

**Evidence from PO Spec**:

- § 4.2 — "[verbatim excerpt, max 200 chars]"
- § 7.1 — "[verbatim excerpt, max 200 chars]"

---

### 2. Resource Management — [status]
### 3. Finance And Risk Management — [status]
### 5. Products — [status]
### 6. Customers — [status]
### 7. Channels — [status]
### 8. Business Development — [status]

> Same structure as § 4 above. Business Domain rosters, verbatim from BIAN:
>
> - **Business Management** (3): Business Direction · Corporate Relations · Corporate Services
> - **Resource Management** (4): Unit Management · Buildings And Equipment · Human Resources · Platform Operations
> - **Finance And Risk Management** (6): Market Risk · Compliance · Financial Control · Credit Risk · Operational Risk · Group Treasury
> - **Operations** (5): External Agency · Operational Services · Custody, Collateral And Documents · Clearing And Settlement · Accounting Services
> - **Products** (9): Market Operations · Consumer Banking · Advisory Services · Market Trading · Corporate Banking · Cards · Trade Banking · Corporate Finance · Loans and Deposits
> - **Customers** (5): Sales · Relationship Management · Customer Care · Party Reference · Investment Services
> - **Channels** (5): Information Providers · Cross Channel · Channel Specific · Distribution · Servicing
> - **Business Development** (6): Marketing And Development · Product Management · Solution Development · Channel Management · Intelectual Property And Knowledge · Models And Analytics
>
> `Intelectual Property And Knowledge` is spelled that way by BIAN. Reproduce it; do not correct it.

---

## API Surface <!-- SECTION: API Surface -->

BIAN publishes an OpenAPI 3 semantic specification for 258 of its 341 Service Domains. Of the impacted Service Domains above, these carry one — they are the industry-specified contracts the architecture can start from rather than design from scratch:

| Service Domain | BIAN id | Specification |
|---|---|---|
| Transaction Engine | `35970` | [TransactionEngine.yaml](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TransactionEngine.yaml) |
| Payment Rail | `47741` | [PaymentRail.yaml](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PaymentRail.yaml) |

An AsyncAPI 3 specification of the same name sits alongside each, under `release14.0.0/semantic-apis/asyncapi-3.x/yamls/`.

Specification URLs are **copied from `llms-bian.txt`, never constructed** — the path segment `oas3%20` carries a literal encoded space that a hand-built URL will get wrong.

**Impacted Service Domains with no published API** (BIAN models them but publishes no specification in release 14.0.0): Payment Orchestration — [or `None`].

> Name them rather than omitting them — an absent specification is a design decision the architecture must make, and a silently shortened table reads as "everything is specified".

---

## Next Steps <!-- SECTION: Next Steps -->

1. Review the impacted Service Domains with the architecture team — confirm each claim matches the initiative's actual scope.
2. Retrieve the published specifications listed in § API Surface before designing equivalent contracts.
3. Run `/sa-skills:architecture-docs` to begin architecture design. Workflow 1 Step 0.3 (BIAN Alignment Gate) will pass, and this report's Summary and impacted-capability lists are lifted into `docs/01-system-overview.md` § 1.5 BIAN Capability Alignment.

Gate comment `architecture-docs` will embed:

```markdown
<!-- BIAN_ALIGNMENT_GATE: PASSED (ref: BIAN_ALIGNMENT.md, YYYY-MM-DD) -->
<!-- BIAN_ALIGNMENT_SOURCE: BIAN_ALIGNMENT.md -->
```

---

## How this Report Was Generated <!-- SECTION: How this Report Was Generated -->

| Input | Source |
|---|---|
| Business requirements | `[PO Spec filename]` |
| Capability model | BIAN Service Landscape v14.0.0, bundled at `[bian_dir]/` (an institution pack's, else the copy the base carries) |
| Role definitions, examples of use, API links | The same corpus, quoted verbatim |
| `DOM` / `CAP` codes | `[design_language_dir]/bian-registry.json` — the SA Design Language Standard's closed registry (optional: absent, the block is omitted) |

No governance rules, cross-cutting findings or owner counterparts are reported: **BIAN publishes none**, and this skill does not invent any. Regenerate with `/sa-requirements:architecture-capability-alignment` after any PO Spec change.
