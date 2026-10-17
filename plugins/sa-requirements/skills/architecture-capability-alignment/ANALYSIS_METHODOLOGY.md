# BIAN Alignment — Analysis Methodology

How to turn a Product Owner Specification into a three-level BIAN classification. Read this when running `architecture-capability-alignment` Steps 3–6.

The capability model is **BIAN Service Landscape v14.0.0 as published**. There are no governance rules to trigger, no owner counterparts to derive, and no cross-cutting mandatory domains — those belonged to the withdrawn internal enterprise model (RFC-028). What replaces them is a third level of precision and a published role definition behind every claim.

---

## 1. Extraction Filter — "What vs. How"

The PO Spec is written by a Product Owner and mixes business intent with implementation guesses. Record the **what**; discard the **how**.

| PO Spec says | Record | Discard |
|---|---|---|
| "integrate with the interbank settlement network via SOAP" | inter-bank payment settlement | SOAP, the specific network |
| "store customer consent in DynamoDB" | customer consent capture | DynamoDB |
| "expose a REST API for balance enquiry" | account balance enquiry | REST, API |
| "run nightly reconciliation in Airflow" | account reconciliation | Airflow, nightly, the scheduler |

The "how" belongs to the architecture team. An alignment that names technologies has mapped the wrong thing.

**The exception**: a *channel* is a business fact, not an implementation. "Mobile app" and "branch" belong in the record — they drive the Channels Business Area.

---

## 2. Capability Schema

Every extracted capability carries its evidence. A claim without a citation cannot be reviewed.

```yaml
capabilities:
  - text: "<short business-capability statement>"
    source: "§ <section number> — <heading>"
    evidence_quote: "<verbatim excerpt, max 200 chars>"
    actors: ["<actor>", ...]
    channels: ["<channel>", ...]
    money_flow: true|false
    data_touched: ["<entity>", ...]
```

`money_flow: true` is a strong signal for **Operations**. `channels` populated is a strong signal for **Channels**. `actors` naming employees rather than customers points at **Resource Management**.

---

## 3. BIAN Altitude Judgement

BIAN has three levels and a PO Spec statement lands on exactly one of them. Getting the altitude wrong is the most common defect in an alignment.

| Level | Count | What a statement at this altitude sounds like |
|---|---|---|
| **Business Area** | 8 | "we are building a payments product" — names a whole region of the bank |
| **Business Domain** | 43 | "we are doing clearing and settlement" — names a coherent group of capabilities |
| **Service Domain** | 341 | "we orchestrate a payment across rails" — names one atomic, non-overlapping capability |

Work **top-down**: classify all 8 areas, then decompose only the 🟢 / 🟡 ones. This is what keeps the run from reading all eight area files (~120K tokens).

### The claim test

**A Service Domain is claimed only when the PO Spec evidence matches BIAN's published role definition — not merely its name.**

BIAN names are short and suggestive, and the suggestion is often wrong:

- `Customer Case` is case *handling* — a complaint or issue lifecycle. It is not "anything involving a customer".
- `Customer Agreement` is the product-holding relationship record. It is not a legal contracts repository.
- `Payment Rail` is the rail *itself* as a consumable capability, not your payment service.
- `Product Directory` is the catalogue of product definitions, not a product database you happen to build.

Open the area file, read the `**What it does.**` paragraph, and check the evidence against *that*. When the two do not match, the Service Domain is ⚪ — and if no Service Domain in the Business Domain matches, the Business Domain itself is ⚪.

### Realizes vs. Consumes

Every claimed Service Domain is one or the other, and the distinction drives downstream design:

- **Realizes** — the initiative builds or owns this capability. It will appear in the architecture as a component.
- **Consumes** — the initiative calls this capability, owned elsewhere. It will appear as an integration point.

A Business Domain whose Service Domains are all *Consumes* is **🟡 Partial**, not 🟢.

---

## 4. Multi-Area Capabilities

Most real capabilities span areas. Do not force a single home — fan the capability out and cite the same evidence in each place it genuinely lands.

**Worked example** — PO Spec § 4.2: *"A customer requests a credit-limit increase from the mobile app; the decision is automated and the new limit is active immediately."*

| Business Area | Status | Business Domain | Service Domains | Realizes / Consumes |
|---|---|---|---|---|
| Channels | 🟢 | Cross Channel | Session Dialogue, Transaction Authorization | Realizes |
| Products | 🟢 | Cards | Credit Card | Realizes |
| Finance And Risk Management | 🟡 | Credit Risk | Credit Management | Consumes |
| Customers | 🟡 | Relationship Management | Customer Credit Rating | Consumes |

Four areas, one sentence of PO Spec. That is normal and is not double-counting: the summary counts **Business Domains** and **Service Domains**, each once, and a Service Domain belongs to exactly one Business Domain by BIAN's own construction — the levels are non-overlapping, so a fan-out across areas can never inflate a count.

**What would be double-counting**: listing the same Service Domain under two Business Domains because it "also fits". It does not. BIAN's hierarchy is a partition. If it seems to fit twice, one of the two is the wrong claim.

---

## 5. Completeness

For each 🟢 / 🟡 Business Area, take the **complete** Business Domain roster from `llms-bian.txt` and rule on every member. Close the block with:

```
_(not impacted: <comma-separated remaining Business Domain names>)_
```

That parenthetical is what tells a reviewer the classifier scanned the whole area rather than stopping at the first match. An area block without it is incomplete, even when its 🟢 list is correct.

The same applies within a Business Domain: its Service Domain roster is in `llms-bian.txt` § Business Domains. You need not enumerate all 12 in prose, but you must have considered them before claiming 3.

---

## 6. Counts and Reconciliation

The summary table's totals are checkable arithmetic, and a mismatch is a defect:

- Business Domains per area are fixed by BIAN: **3 · 4 · 6 · 5 · 9 · 5 · 5 · 6 = 43**
- The `Business Domains Impacted` column reads `N/total` and its `N` must equal the length of that area's 🟢+🟡 bullet list
- The `Service Domains Impacted` column must equal the row count of that area's Service Domain tables
- The footer's `M of 43` and `K of 341` must equal the column sums

---

## 7. Diagram ID Segments

Only when `bian-registry.json` is present (Step 2.1). One row per 🟢 / 🟡 **Business Domain** — never per Service Domain and never per Business Area alone.

- `DOM` — 3 letters, from the area's `dom` field
- `CAP` — 4 letters, from the Business Domain's `cap` field
- BIAN id — from the same record

**Every value is looked up.** The length rule is the safety net: a `CAP` is four letters and a `DOM` is three, so a three-letter `CAP` is always an error rather than a plausible alternative. Within `CAP`, no two codes differ in a single position — meaning a single-character typo can never land on another legal code.

When a value is not in the registry, write that it requires a vocabulary extension through the Architecture Governance Board and stop.

---

## 8. Anti-Patterns to Avoid

| Anti-pattern | Why it is wrong | Do instead |
|---|---|---|
| **Paraphrasing a role definition** | The definition is BIAN's published text and is the justification for the claim. Paraphrase and the reviewer cannot check it. | Quote the `**What it does.**` paragraph verbatim. |
| **Claiming by name** | `Customer Case` sounds like anything customer-related. It is not. | Read the role definition and match the evidence to it. |
| **Reading all eight area files** | ~120K tokens, and seven of them are usually ⚪. | Classify areas first; open only 🟢 / 🟡 files, one at a time. |
| **Correcting BIAN's spelling** | `Intelectual Property And Knowledge` is spelled that way upstream. A "fixed" name is not findable in the corpus. | Reproduce it exactly. |
| **Inventing a `DOM` / `CAP`** | Both registries are closed. A plausible invented code is a conformance failure raised against a named author. | Look it up, or omit the section. |
| **Putting a Service Domain in a Diagram ID** | A Service Domain is a tag and a register column, never an ID segment (`llms-rules.txt` §1.3). | Carry it as a capability tag. |
| **Constructing an API URL** | The path segment `oas3%20` carries a literal encoded space. A hand-built URL 404s. | Copy the URL from `llms-bian.txt`. |
| **Marking everything 🟢** | An alignment where 8 of 8 areas are impacted has classified nothing. | 🟢 requires the initiative to realize capability there. Most initiatives touch 2–4 areas. |
| **Omitting Service Domains without an API** | A shortened table reads as "everything is specified". | Name them under the API Surface table — the gap is a design decision. |
| **Inventing governance rules or owners** | BIAN publishes none. The internal model that did was withdrawn. | Report the capability mapping. Governance is out of scope for this artifact. |
| **Guessing when the PO Spec is silent** | A confident complete answer filled from inference is worse than an honest gap. | Mark ⚪, state what evidence would settle it. |
