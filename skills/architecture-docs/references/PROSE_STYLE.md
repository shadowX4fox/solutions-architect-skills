# Prose Style Contract

**Status**: Normative. Owned by `sa-skills:architecture-docs`.
**Applies to**: every document this plugin writes into the user's project. Tiered — see §9.
**Enforced by**: `skills/architecture-docs/PROSE_VALIDATION.md` (Layer 1, executable). The
post-hoc semantic layer — the `PROSE` peer-review category — was retired with
`architecture-peer-review`; Layer 1 is now the only enforcement.

---

## 1. The rule in three sentences

Write the shortest form that carries the fact. Prose is the fallback form, never the default.
Every sentence that survives carries a number, a named thing, or a link.

This contract governs the **documents produced for the user**. It does not govern the skill and
agent files in this plugin, which are instructional and may explain themselves at length.

---

## 2. Form ladder

Pick the first form that fits the content. Dropping to a lower row when a higher one fits is a
defect.

| Content shape | Required form |
|---|---|
| ≥2 items with ≥2 attributes each | Markdown table |
| ≥2 items with 1 attribute each | Bullet list, or `**Label**: value.` triplets |
| Ordered interaction between ≥2 participants | Mermaid `sequenceDiagram` |
| Structure or containment | Mermaid `flowchart` / `graph` |
| A single fact with a label | `**Label**: value.` — one line, no sentence wrapper |
| Rationale that cannot be tabulated | Prose, in a designated slot only (§8) |

**Worked reference**: `examples/04-data-flow-patterns.example.md` is the canonical demonstration of
this ladder — dense tables, `**Label**: value.` triplets per phase, near-zero connective tissue.
Read it before authoring Section 6.

**Counter-reference**: `examples/ARCHITECTURE_example_3tier.md` predates this contract. Its prose
register is not a model. It is excluded from every enforcement path and must not be imitated.

### The wrapper test

If a sentence can be deleted without losing a fact, it was a wrapper. Delete it.

```markdown
❌ The system uses PostgreSQL 16 as its primary datastore, which provides strong
   consistency guarantees for the order ledger.
✅ **Primary datastore**: PostgreSQL 16 — strong consistency, required by the order ledger.
```

---

## 3. Length targets

| Unit | Target |
|---|---|
| Sentence | ≤25 words. Median across a file ≤18 |
| Paragraph | ≤4 sentences **and** ≤70 words |
| Prose slot | ≤1 paragraph unless the slot's template says otherwise |

All three are **WARNING**, never blocking — a dense technical sentence that runs to 27 words is
better than two that lose a constraint between them.

### Split, don't delete

Dropping a fact to meet a cap is a contract violation, not compliance. A 30-word sentence becomes
two sentences or a two-row table — never a 20-word sentence missing a constraint. Every length
fail message repeats this clause.

### No file-length cap

This contract caps sentences and paragraphs. It **never** counts lines in a file. A long document
built from dense tables is correct output; a short one padded with narrative is not.

The `~400 lines` and `~130 lines` figures that appeared in `RESTRUCTURING_GUIDE.md` were stale
leftovers from an older layout and have been removed. Do not reintroduce them here, in
`PROSE_VALIDATION.md`, or in any template. Figures elsewhere in the corpus that read
"files are 50–400 lines, read in full, no offset needed" are **load-strategy rationale** for
context budgeting, not authoring constraints, and carry no obligation.

---

## 4. Banned constructions

Bilingual. Each Spanish branch is normative, not a courtesy translation — a rule that only matches
English silently passes a Spanish document, which is the exact failure mode heading anchors were
introduced to prevent (`LANGUAGE_POLICY.md` §2).

### 4.1 Filler openers

`it is important to note` · `it should be noted` · `this section provides/describes/covers/presents`
· `in order to` · `as mentioned above` · `as mentioned previously` · `the following table
shows/illustrates` · `this document aims to`

**ES**: `cabe destacar` · `es importante mencionar` · `esta sección proporciona/describe/presenta` ·
`a continuación se muestra` · `a continuación se presenta` · `con el fin de`

### 4.2 Hedges and unquantified intensifiers

`may potentially` · `could possibly` · `generally speaking` · `in general` · `typically` ·
`somewhat` · `fairly` · `quite` · `arguably` · `we believe` · `very` · `extremely` · `highly` ·
`dramatically`

**ES**: `generalmente` · `en general` · `posiblemente` · `podría llegar a` · `bastante` · `muy` ·
`altamente` · `considerablemente`

`significantly` / `significativamente` is permitted **only** when a number appears in the same
sentence. "Significantly reduces latency" is banned; "reduces p95 latency by 40%" does not need the
word at all.

### 4.3 Meta-narration about the document

The document must not describe its own layout, reading order, or authoring rationale. Section
anchors and headings already carry that.

A legend after a Mermaid fence (`**Legend:**`, stating what bands, node classes and edges denote)
is diagram content, not meta-narration, and is exempt.

`how to read this file` · `in this section we will` · `the remainder of this document` ·
`as we will see` · `deliberately at the end` · `so they don't crowd out` · `read these only when`

**ES**: `cómo leer este archivo` · `en esta sección veremos` · `el resto de este documento`

### 4.4 Marketing register

The full `P-PLATITUDE-01` blocklist — `industry best practice` · `industry standard` ·
`we follow best practices` · `enterprise-grade` · `world-class` · `state of the art` ·
`where applicable` · `as appropriate` · `robust solution` · `cutting edge` · `battle-tested` ·
`future-proof` — extended with:

`seamless` · `robust` · `powerful` · `holistic` · `best-in-class` · `next-generation` · `unlock` ·
`empower` · `ensure a smooth` · `leverage` (as a verb)

**ES**: `sin fisuras` · `robusto` · `potente` · `de clase mundial` · `de última generación` ·
`aprovechar` (as a verb) · `garantizar una experiencia fluida`

Proper nouns are exempt: a product literally named `Robusta` does not trip `robust`. Cross-check
against `docs/06-technology-stack.md` before flagging.

---

### 4.5 Mannered prose

Mannered prose substitutes metaphor and flourish for direct statement. Instead of *a parameter worth
varying* it writes *a dial worth turning*; instead of *this constraint still applies*, *this
constraint earns its keep*. The phrase exists to display the writer, not to convey the idea, and it
is imprecise: a metaphor drags in connotations the source did not state and the writer cannot
control. When a literal phrase is available, use it. (The definition is the one Anthropic's
prompting guide for Claude Fable 5.1 gives under *Writing density*; every agent's Prose Style block
carries its short form.)

Not a lexicon — a judgement rule (`S-DENSITY-02`, WARNING): a sentence whose only content is a
figure of speech carries no density token and reads as flourish. A named pattern is not a metaphor
(*circuit breaker*, *dead-letter queue*, *saga* are the literal names).

**EN**: *a dial worth turning* · *earns its keep* · *the beating heart of* · *a north star* ·
*heavy lifting* · *the glue between* · *lives and breathes* · *at the end of the day*

**ES**: *una palanca que vale la pena mover* · *se gana su lugar* · *el corazón que late* · *la
estrella polar* · *el pegamento entre* · *a fin de cuentas* · *vive y respira*

## 5. Density

Every prose sentence making a claim about behavior, capacity, cost, or risk carries **≥1** of:

1. A number with a unit or `%` — `\b\d+(\.\d+)?\s*(%|ms|s|min|hr|GB|TB|MB|KB|RPS|TPS|QPS|node|core|pod|replica|MAU|DAU)\b`
2. A component name (canonical full name from the component file's H1 — never abbreviated)
3. A technology name from `docs/06-technology-stack.md`
4. A backticked identifier, config key, or path
5. A Markdown cross-reference link

Tokens 1–4 are the `P-SPECIFIC-01` definition, reused verbatim so the two rules cannot drift.
Token 5 is added here.

### Reconciliation with the Source Attribution Rule

`ARCHITECTURE_DOCUMENTATION_GUIDE.md` requires every claim that originates in another section to
carry a cross-reference link. That rule lengthens sentences, and it would fight §3 if the two were
left unreconciled. They are reconciled by construction, in two places:

- **A link satisfies §5** (token 5). Attribution is therefore the *cheapest* way to pass the
  density rule.
- **§6 strips link targets before counting words.** `(see [Key Metrics](01-system-overview.md#key-metrics))`
  costs 4 words, not 8.

Attribution and terseness are aligned, not traded off. Do not "resolve the tension" by weakening
attribution — there is no tension.

---

## 6. Text normalization

Defined once. Every length and density rule counts against normalized text, so all rules agree.

Before counting words or sentences, remove:

1. Fenced code blocks and Mermaid blocks
2. HTML comments — including `SECTION:` / `PRINCIPLE:` / `LABEL:` anchors and all markers
3. Table rows (any line starting `|`)
4. The **target** of a Markdown link — `[text](target)` counts as `text`
5. Frontmatter

Backticked spans count as one token each. Headings, bullets and blockquotes count as prose only
when they contain ≥2 sentences or ≥25 words.

---

## 7. Voice and tense

**Present indicative, active, third person about the system.**

```markdown
✅ The gateway validates the JWT and forwards the claim set to `order-bs`.
❌ We validate the JWT before forwarding.              (first person)
❌ The JWT is validated before forwarding.             (agentless passive)
❌ The gateway will validate the JWT.                  (future tense for designed behavior)
```

- **No first or second person** in `docs/**`. ADR *Consequences* may use first-person plural for a
  decision the team owns; that is the only exemption.
- **No future tense for designed behavior.** `will validate` → `validates`. Future tense is
  reserved for deferred work and must carry a version or a date.
- **Passive is permitted only when the actor is genuinely unknown or irrelevant.** If an actor
  exists, name it.

**Spanish-specific**, two rules that have no English equivalent:

1. **Impersonal `se + verbo` is banned where an actor exists.** `se valida el token` →
   `el gateway valida el token`. This is the ES analogue of the passive-voice rule.
2. **First person is pro-drop, and still banned.** Spanish encodes person in the verb ending, so
   `aprovechamos las mejores prácticas` is first person with no pronoun present. Checking only for
   `nosotros` / `nuestro` misses it. Any `-amos` / `-emos` / `-imos` verb describing the system's
   behavior is a first-person violation: `implementamos el cache` → `el servicio implementa el
   cache`.

Together these are what give the Spanish ruleset independent teeth rather than making it a
transliteration of the English one.

---

## 8. When prose is genuinely right

Rationale, surprising deltas, and out-of-scope clauses cannot be tabulated. Prose is correct there.

**Designated prose slots** — a closed list:

| Slot | Location |
|---|---|
| Mission statement | `ARCHITECTURE.md`, `docs/01-system-overview.md` |
| Problem Statement / Solution | `docs/01-system-overview.md` |
| 30-second summary blockquote | every `docs/**` file, after the `EXPLORER_HEADER` |
| Per-UC narrative delta | `docs/04-data-flow-patterns.md` |
| Out-of-domain clause | `docs/04-data-flow-patterns.md` |
| Context / Rationale / Consequences | `adr/ADR-NNN-*.md` |
| Impact | `tdr/TDR-NNN-*.md` |
| Principle Description | `docs/02-architecture-principles.md` |

Everything outside this list defaults to a non-prose form. Within a slot, prose must still carry a
decision verb (`accept`, `prefer`, `prioritize`, `trade`, `choose`, `defer`, `delegate`, `refuse`,
`favor`, `reject`, `require`, `enforce`, `mandate` — the `P-QA-CONFLATION-01` list) or a §5 density
token.

### Escape hatch

```markdown
<!-- PROSE_OK: migration rationale spans three failure modes; a table would fragment it -->
```

On the line immediately before a block, this exempts it from the **form** (§2) and **length** (§3)
rules. It **never** exempts the banned-construction rules (§4) or the voice rules (§7) — no
rationale justifies `enterprise-grade`.

The reason is mandatory and must be specific. Modeled on the existing `<!-- TYPE_MATRIX_WAIVED: -->`
and `<!-- DEFERRED: -->` sentinels. More than three per file is a signal the template is wrong, not
the author.

---

## 9. Scope tiers

| Tier | Artifacts | What applies |
|---|---|---|
| **A — gate-enforced** | `ARCHITECTURE.md`, `docs/**` | Full contract. `PROSE_VALIDATION.md` runs at Step 5.7, on edit, and at release |
| **B — contract, no gate** | `adr/`, `tdr/`, `handoffs/**`, `analysis/**`, `BIAN_ALIGNMENT.md`, `TRACEABILITY_REPORT.md` | Full contract, applied at authoring time by the generating agent. No blocking gate — each of these has its own generator and round budget. No post-hoc scoring since the `PROSE` peer-review category was retired — authoring-time application is the only enforcement |
| **C — lexical rules only** | `compliance-docs/**`, template-driven outputs of an institution pack's skills | §4 banned constructions only. §2 form and §3 length do **not** apply: contract structure is written by code (`contract.ts` in sa-compliance — the requirement rows, verdicts and score table), never by a model. The banned-construction rules only remove words *inside cells* — they never move structure, rename a header, or touch an enum |
| **Exempt** | `COMPLIANCE_MANIFEST.md`, `examples/ARCHITECTURE_example_3tier.md` | Nothing applies. The first is a machine artifact (`LANGUAGE_POLICY.md` §4 precedent); the second is a deliberate historical reference |

### Consumers

| Skill / agent | Tier | Note |
|---|---|---|
| `architecture-docs` | A | **Owner.** Runs the gate at Step 5.7, on edit, and at release |
| `architecture-component-guardian` | A | Component prose and descriptors |
| `architecture-definition-record` / `technical-debt-records` | B | ADR/TDR body prose; ids and status values unaffected |
| `architecture-analysis` | B | Report prose; classification codes unaffected |
| `architecture-traceability` / `architecture-capability-alignment` | B | Narrative only |
| `architecture-dev-handoff` | B | All four handoff-kit documents |
| `architecture-compliance` | C | Narrative fields inside contract cells |
| an institution pack's template skills | C | Template-driven; lexical rules only |
| Every agent under `agents/**` | — | Carry the `## Prose Style` block |

---

## 10. Relationship to the other contracts

| Contract | Boundary |
|---|---|
| `LANGUAGE_POLICY.md` | Decides **which language** the prose is in. This file decides **how it is written** in that language. Every §4 blocklist carries both branches |
| `PRINCIPLE_VALIDATION.md` | Owns `docs/02-architecture-principles.md` semantics — whether a principle constrains anything. This file owns register and form everywhere. `P-PLATITUDE-01` is the Section 3 ancestor of §4.4; `S-BAN-03` extends it to `docs/**` |
| Source Attribution Rule | Reconciled in §5 — a link satisfies density and is not counted against length |
| Component Naming Fidelity | Outranks this contract. A canonical component name is never shortened to meet a length target |
| SA Design Language Standard | Outranks this contract inside its own lane. Its tag values, codes and capability names are fixed vocabulary and are never rewritten for style |
