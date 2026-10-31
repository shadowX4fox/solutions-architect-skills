# Prose Style Validation — Layer 1 Prescriptive Checklist

**The one implementation is `scripts/prose-check.js`** (2026-09-21):

```bash
bun [plugin_dir]/skills/architecture-docs/scripts/prose-check.js <project_root> [--scope first-write|edit|release] [--file <path> …] [--judge agent|typesafe|clef] [--deep] [--json] [--warn-only]
```

It runs every rule below — the five BLOCKING blocklists as the regexes this file prints, both
language branches always; the mechanical WARNINGs by count; the proper-noun guard of `S-BAN-03` and
the noun exclusions of `S-VOICE-01`'s pro-drop rule from the ledger and a list, by code — and hands
the **judgement** rules (`S-DENSITY-01`, `S-DENSITY-02`, `S-VOICE-02`, `S-VOICE-03`, the pro-drop
verb check) to the plugin's judge (`scripts/judge.js`): one yes/no question per candidate the regex
found (`--judge`, else `SA_JUDGE`, else the agent worksheet), every dismissal printed with its
probability. A candidate no judge has answered is **undecided** — neither a finding nor dismissed —
and the report lists it under `judge.undecided` with the worksheet to answer before the re-run; the
regex's reading never stands in for the answer (8.119.0). Mode, scope, the report shape and the exit code are the ones this file
defines. On the reference corpus the regexes raised 145 judgement candidates; Jev kept 58 and
dismissed 87 in two seconds — ten of them the noun *extremos* behind the pro-drop ending, now on the
list. `--deep` sends every prose paragraph to `S-DENSITY-02`, not only the listed phrases.

The scope map of Appendix A is the script's too: `--scope first-write` and `--scope release` run all
eight groups over `ARCHITECTURE.md` + `docs/**`, `--scope edit --file <path>` runs Groups 1, 2, 6 and 8
over the file named, and `release` is enforcing whatever the marker says — exempted only by
`<!-- PROSE_STYLE_WAIVED: <reason> -->`, which the report line prints. Every judged rule runs on the
same judge in every scope.

This file documents what the script enforces and stays the reference for the fix text; a run
transcribes nothing. Do not self-attest "passed" without the script's report.

**What this file enforces**: the contract in
[`references/PROSE_STYLE.md`](references/PROSE_STYLE.md) — minimal prose, direct, technical.
**What it does not enforce**: file length. There is no line-count rule here and there must never be
one. See `PROSE_STYLE.md` § "No file-length cap".

---

## Related Documentation

| File | Relationship |
|---|---|
| `references/PROSE_STYLE.md` | **Canonical contract.** This file is its executable form |
| `references/LANGUAGE_POLICY.md` | Decides which language the prose is in. Every blocklist here carries both branches |
| `PRINCIPLE_VALIDATION.md` | Sibling Layer-1 checklist for Section 3 semantics. `P-PLATITUDE-01` is the ancestor of `S-BAN-03`; `S-DENSITY-01` reuses the `P-SPECIFIC-01` token definition verbatim |
| `VALIDATIONS.md` | Human-readable mirror table. This file is canonical |
| `ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md` Step 5.7 · `EDIT_WORKFLOW.md` Check F · `architecture-lifecycle` (`lifecycle.js check`) · `PROSE_RETROFIT_WORKFLOW.md` | The orchestrator contracts that run this file, one per scope |

---

## Load map

| Scope | Read |
|---|---|
| `first-write`, `release` | § Text Normalization, § Run Procedure, § Rule Reference (all 8 groups), § Output Format, § Failure Semantics, the matching § Appendix A block |
| `edit` (Post-Write Check F) | § Text Normalization, § Run Procedure, **Groups 1, 2 and 6 only**, § Output Format, the `edit` block of § Appendix A |

`rg -n '^##' PROSE_VALIDATION.md` gives the offsets; read the ranges the scope names rather than the whole file.

## Required Reads (load before running any rule)

**Read once.** A file below already in the orchestrator's context this run is reused; re-read only after this run has written to it.

| File | Why | If missing |
|---|---|---|
| `ARCHITECTURE.md` | Marker resolution (`PROSE_STYLE: v1`, `DOC_LANGUAGE`) and scope | Treat as `report-only`, `doc_language: en` |
| `docs/06-technology-stack.md` | Proper-noun allowlist for `S-BAN-03`; density tokens for `S-DENSITY-01` | Skip the allowlist cross-check, record in `fallbacks[]` |
| `docs/components/README.md` | Canonical component names as density tokens | Skip that token class, record in `fallbacks[]` |

---

## Rule Authoring Rules

These bind anyone editing this file. Violating them produces a gate that fails forever or passes
silently — both worse than no gate.

1. **Every blocklist pattern MUST carry a Spanish branch.** A pattern without one **may not be
   BLOCKING**. An English-only rule silently passes a Spanish document, which is precisely the
   failure mode heading anchors were introduced to prevent.
2. **Every rg MUST be path-scoped** to `ARCHITECTURE.md docs/` (or the scope's file list). Never
   `rg` over the repo root. The blocklist strings appear literally in this file and in
   `PROSE_STYLE.md` — an unscoped rg matches the gate's own definition and fails permanently.
3. **`examples/ARCHITECTURE_example_3tier.md` is permanently excluded.** It is a deliberate
   historical artifact whose register predates this contract.
4. **No rule may count lines in a file.** Sentences, paragraphs and named per-field slots only.

---

## Text Normalization

Defined once. Every length and density rule counts against normalized text so all rules agree.

Before counting words or sentences, remove:

1. Fenced code blocks and Mermaid blocks
2. HTML comments — including `SECTION:` / `PRINCIPLE:` / `LABEL:` anchors and all markers. A comment that spans
   lines (an `EXPLORER_HEADER` block, an authoring note) is blanked whole, so no rule counts it as prose
3. Table rows (any line beginning `|`)
4. The **target** of a Markdown link — `[text](target)` counts as `text` only
5. Frontmatter

Backticked spans count as one token, and no blocklist matches inside one — a code span is a name. Headings, bullets
and blockquotes count as prose only when they contain ≥2 sentences or ≥25 words. A sentence ends at `.` `!` `?` followed by a space or the
end — closing emphasis or a closing quote after the mark (`**`, `*`, `_`, `` ` ``, `»`, `"`, `”`) belongs to the boundary,
so a bold lead sentence `**El control no es el borrado.** Dejar de…` is two sentences; a leading section number (`9.5.1 La Interfaz`, `9. Seguridad`) and a dot inside a number (`2.3`, `500.000`) are
not boundaries.

**Changelogs are history.** In `docs/CHANGELOG*.md` and any `*ARCHIVE*.md`, only the `## [Unreleased]` block is
checked, and only by Groups 1, 2, 6 and 8 — a released entry is a record, and length, form and density never apply.

Normalization helper (stdout is the normalized text, prefixed `file:line:`):

```bash
awk '/^```/{f=!f; next} f{next} /^\|/{next} /^<!--/{next}
     {gsub(/<!--[^>]*-->/,""); gsub(/\]\([^)]*\)/,"]"); gsub(/`[^`]*`/,"X");
      if ($0 !~ /^[[:space:]]*$/) print FILENAME":"FNR": "$0}' \
  ARCHITECTURE.md docs/*.md docs/components/**/*.md
```

---

## At the moment of writing — the hook (8.115.0)

The plugin's `PreToolUse` / `PostToolUse` hooks on `Write | Edit` run these rules on the **new lines** of a call to
`ARCHITECTURE.md`, `docs/**`, a project ADR (101+) or a TDR, through `scripts/prose-hook.js` — the same `prose-check.js`,
nothing transcribed. **Before** the call: Groups 1, 2 and 9 — a BLOCKING finding denies it under an enforcing project
(`PROSE_STYLE: v1`), the reason listing each rule, line and fix; rewrite those lines and retry. **After** the call:
the WARNING findings of Groups 1–4 on the lines just written come back as context — fix them now, while the text is in
hand. The judgement rules (Groups 5–6, 8's `S-HIST-01`) need the judge and run at the gates only. A report-only project
is never denied; the gates below still run, and they now find what the hook missed rather than everything.

## Run Procedure

1. Resolve **mode**: `enforcing` when `<!-- PROSE_STYLE: v1 -->` is present in `ARCHITECTURE.md`,
   otherwise `report-only` (§ Retrofit). In `report-only`, every finding is a WARNING and nothing
   blocks.
2. Resolve **scope**: `first-write` | `edit` | `release` (Appendix A).
3. Resolve `doc_language` per `LANGUAGE_POLICY.md` §3. **Run both language branches regardless** —
   a mixed-language document is itself a defect.
4. Run rules in document order. Quote each rule's command output (or `no output`) directly under
   the rule in the report.
5. Halt on the first BLOCKING failure, regenerate, re-run from rule 1, increment the round counter.
6. Emit `PROSE_VALIDATION_REPORT` at the end, on PASS as well as FAIL.

**Anti-self-attestation rule**: each rule's section in the report MUST include the literal command
output. A rule reported as passing without its output is a FAIL.

---

## Rule Reference

### Group 1 — Boilerplate residue (BLOCKING)

Cheapest and highest-signal: these are literal strings the plugin's own templates used to emit.
Zero false positives by construction.

#### `S-BOILER-01` — Template boilerplate copied into user documents

**Detection**:
```bash
rg -ni 'this section provides a visual representation|how to read this file|a uc is resolved by composing phases|design drivers can be automatically calculated|the diagrams below are the canonical wire-level|esta secci[óo]n (proporciona|presenta) una representaci[óo]n visual|c[óo]mo leer este archivo' \
  ARCHITECTURE.md docs/
```

**Pass criterion**: 0 matches.

**Fail message**: `Template boilerplate '<phrase>' at <file>:<line>. This sentence is authoring instruction, not architecture content — delete it. The heading above it already carries the meaning.`

---

### Group 2 — Banned constructions (BLOCKING)

#### `S-BAN-01` — Filler openers and meta-narration

**Detection**:
```bash
rg -ni '\b(it is important to note|it should be noted|this (section|document) (provides|describes|covers|presents)|in order to|as mentioned (above|previously)|the following table (shows|illustrates)|this document aims to|in this section we will|the remainder of this document|as we will see|deliberately at the end|read these only when)\b|\b(cabe destacar|es importante mencionar|esta secci[óo]n (proporciona|describe|presenta)|a continuaci[óo]n se (muestra|presenta)|con el fin de|en esta secci[óo]n veremos|el resto de este documento)\b' \
  ARCHITECTURE.md docs/
```

**Pass criterion**: 0 matches.

**Fail message**: `Filler or meta-narration '<phrase>' at <file>:<line>. The document must not describe its own layout or reading order — section anchors already do. Delete the clause; keep any fact it carried.`

#### `S-BAN-02` — Hedges and unquantified intensifiers

**Detection**:
```bash
rg -ni '\b(may potentially|could possibly|generally speaking|in general|typically|somewhat|fairly|quite|arguably|we believe|very|extremely|highly|dramatically)\b|\b(generalmente|en general|posiblemente|podr[íi]a llegar a|bastante|muy|altamente|considerablemente)\b' \
  ARCHITECTURE.md docs/
```

**Pass criterion**: 0 matches.

**Fail message**: `Hedge '<phrase>' at <file>:<line>. Either the claim holds or it does not. Replace with the measured value, or delete the qualifier.`

**Sub-check `S-BAN-02a` (WARNING)** — `significantly` / `significativamente`:
```bash
rg -ni '\bsignificantly\b|\bsignificativamente\b' ARCHITECTURE.md docs/
```
A match passes only when a number or `%` appears in the same sentence — quote the sentence in the
report. Otherwise WARNING: `'significantly' at <file>:<line> carries no number. State the measured change, e.g. 'reduces p95 latency by 40%'.`

#### `S-BAN-03` — Marketing register

Extends `P-PLATITUDE-01` from `docs/02-architecture-principles.md` to the whole corpus.

**Detection**:
```bash
rg -ni 'industry best practice|industry standard|we follow best practices|enterprise-grade|world-class|state of the art|where applicable|as appropriate|robust solution|cutting edge|battle[- ]tested|future[- ]proof|seamless|\brobust\b|\bpowerful\b|holistic|best-in-class|next-generation|\bunlock\b|\bempower\b|ensure a smooth|\bleverag(e|es|ing)\b|de clase mundial|sin fisuras|\brobusto\b|\bpotente\b|de [úu]ltima generaci[óo]n|garantizar una experiencia fluida|\baprovechar\b' \
  ARCHITECTURE.md docs/
```

**Pass criterion**: 0 matches, after removing proper-noun false positives.

**Proper-noun guard**: a match that is part of a product or component name is not a finding. Verify
before flagging:
```bash
rg -ni '<matched-token>' docs/06-technology-stack.md docs/components/README.md
```
If the token appears there as a named product (e.g. a tool literally called `Robusta`), record it in
the report as a suppressed match with the cross-check output, and do not count it.

**Fail message**: `Marketing register '<phrase>' at <file>:<line>. Replace with the concrete mechanism, protocol, or measurement it is standing in for.`

#### `S-VOICE-01` — No first or second person in `docs/**`

**Detection** — the pronouns of the document's language only (`DOC_LANGUAGE`), case-sensitively, outside code spans
and quoted text (`"…"`, `“…”`, `«…»`):
```bash
rg -n '\b([Ww]e|[Oo]urs?|us|[Yy]ou|[Yy]ours?)\b' docs/                         # en
rg -n '\b([Nn]osotr[oa]s|[Nn]uestr[oa]s?|[Uu]stedes|[Uu]sted)\b' docs/          # es
rg -ni '\b[a-záéíóúñ]{2,}(amos|emos|imos)\b' docs/                              # es — pro-drop verb
```

> **Why language-scoped and case-sensitive.** An English pronoun in a Spanish document is always quoted text or a
> name, and an all-caps `US` is a country (`East US`, `us-east-1`). The bilingual, case-blind list raised 76 false
> blocks of 77 on the reference corpus, which made `PROSE_STYLE` impossible to stamp.
>
> **Spanish is pro-drop — the pronoun check alone is not enough.** `aprovechamos las mejores prácticas` is first
> person with no pronoun in sight. The third pattern catches first-person-plural endings; code dismisses the nouns:
> a word on the noun list (`tramos`, `ramos`, `extremos` …) and any **accented** word outside the verb endings that
> carry an accent (`-ábamos`, `-íamos`, `-éramos`, `-áramos`, `-ásemos` …) — `préstamos`, `últimos`, `legítimos` are
> nouns and adjectives. The judge reads what remains; suppressed matches go to `suppressed[]`.

**Pass criterion**: 0 matches in `docs/**` after noun suppression. `adr/` is exempt — ADR
*Consequences* may use first-person plural for a decision the team owns.

**Fail message**: `First/second person '<word>' at <file>:<line>. Architecture documentation describes the system, not its authors. Rewrite with the system or component as subject.`

---

### Group 3 — Length (WARNING)

Never blocking. A dense technical sentence that runs long is better than two that lose a constraint
between them. **Every fail message below carries the split-don't-delete clause.**

#### `S-LEN-01` — Sentence ≤25 normalized words

**Detection**: run the § Text Normalization helper, split on sentence boundaries, count words per
sentence. Report each offender with its count.

**Pass criterion**: 0 sentences >25 normalized words outside a `<!-- PROSE_OK: -->` block.

**Fail message**: `Sentence at <file>:<line> is <N> words (target ≤25). Split it or convert to a table. Do NOT shorten by dropping a fact — a 20-word sentence missing a constraint is worse than a 30-word one that keeps it.`

#### `S-LEN-02` — Paragraph ≤70 words and ≤4 sentences

**Detection**: same normalization; a paragraph is a run of non-blank normalized lines.

**Pass criterion**: 0 paragraphs over either bound outside a `<!-- PROSE_OK: -->` block.

**Fail message**: `Paragraph at <file>:<line> is <N> words / <M> sentences (target ≤70 / ≤4). Convert to a table or bullets if it enumerates; split it if it argues. Do NOT drop facts to fit.`

#### `S-LEN-03` — Bounded per-field slots

These caps already exist in the guide; this rule enforces them.

**Detection**:
```bash
rg -n '^scope: .{121,}' docs/ | head -20
bun [plugin_dir]/skills/architecture-component-guardian/utils/component-cli.ts check <project_root> 2>&1 | rg 'description-|missing-field: \*\*Description'
awk '/^> /{c+=NF-1; next} c>0 && /^[[:space:]]*$/{if(c>60) print FILENAME": 30-second summary = "c" words"; c=0}' docs/*.md
```

**Pass criterion**: `scope` ≤120 chars; component `**Description:**` present on every L2 container,
≤120 characters **and opening with the canonical name** (the H1, plain text) — `component-cli.ts check`
is the one reader of that field and reports `missing-field: **Description:**`, `description-too-long` and
`description-name-prefix`, each an edit at the line it names; 30-second summary ≤60 words.

**Fail message**: `<field> at <file>:<line> exceeds its cap (<actual> vs <cap>). This is a fixed-width slot — move the detail to the body.`

---

### Group 4 — Form (WARNING)

#### `S-FORM-01` — Sections whose template mandates a table contain one

**Detection** — anchored on the English `SECTION:` anchor, never on visible heading text, because
visible headings are localized. The section runs to the next heading of the **same or a higher** level, so the
tables of its subsections count (the check used to stop at the first `###` and reported a Technology Stack that is
60% tables as having none):
```bash
for s in "Flow Inventory" "Phase Catalog" "Use Case Resolutions" "Technology Stack" "Key Metrics"; do
  echo "--- $s ---"
  awk -v s="$s" 'index($0, "<!-- SECTION: " s " -->"){f=1; n=0; next}
                 f && /^#{2,3} /{ if(n==0) print FILENAME": no table rows under "s; f=0 }   # the script compares levels
                 f && /^\|/{n++}
                 END{ if(f && n==0) print FILENAME": no table rows under "s }' docs/*.md
done
```

**Pass criterion**: each anchored section contains ≥2 table rows.

**Fail message**: `Section '<name>' at <file> has no table. Its content is ≥2 items with ≥2 attributes — that is a table by the form ladder (PROSE_STYLE.md §2).`

#### `S-FORM-02` — At most one prose paragraph between structural elements

**Detection**: over normalized text, count consecutive prose paragraphs between two structural
elements (heading, table, fence, list, thematic break `---`). Structure, never counted as prose: a block whose every
line is a `**Label:** value` field (a descriptor's `**Component Version:**` block, a single `**Deployment:**` line), a
pointer line opening with an arrow (`→ Secuencia completa: ver […]`), an integration block's head (`scripts/integration-head.js`, the reading
`docs-stats.js` and `handoff-prepare.js` share): a title line `**I-04 — Consulta de saldos**` or a compound
`**I-19 e I-20 — …**` resets the run like a heading and never merges into the paragraph above or under it; a head with its
body inline (`**I-11 — retirada**, per [ADR-120] …`) opens a new block — one line is no run, several start one — and a lead-in ending in `:` — it belongs to the
list or table it introduces, and resets the run. A heading, list, table, fence or break resets the run **whether or
not its own text counts as prose** for `S-LEN` — a list of long items is still the structure between two paragraphs.

**Pass criterion**: ≤1. This rule has the widest legitimate exception surface — it is a WARNING and
`<!-- PROSE_OK: -->` clears it.

**Fail message**: `<N> consecutive prose paragraphs at <file>:<line>. Convert the enumerable part to a table or bullets, or mark the block '<!-- PROSE_OK: reason -->' if the argument genuinely needs continuous prose.`

---

### Group 5 — Density (WARNING)

#### `S-DENSITY-01` — Every claim carries a concrete token

Applies to prose paragraphs in `docs/03-*` through `docs/09-*`. A "density token" is the
`P-SPECIFIC-01` definition, extended with token 5:

1. A number with a unit or `%` — `\b\d+(\.\d+)?\s*(%|ms|s|min|hr|GB|TB|MB|KB|RPS|TPS|QPS|node|core|pod|replica|MAU|DAU)\b` —
   or, in any language, a number and the noun it counts (`12 meses`, `500.000 usuarios`, `3 réplicas`) or a spelled count
   of a time unit (`una semana`, `two days`)
2. A tech name that also appears in `docs/06-technology-stack.md` (the first column and any technology / product column
   of its tables) or as a component's name or technology in the ledger; a multi-word name also counts by its first word
   (`Azure Front Door` → `Azure`), generic words excepted
3. An acronym `\b[A-Z]{3,}\b` not in the platitude blocklist
4. A backticked path or config key
5. **A Markdown cross-reference link** — added here
6. **A section or phase reference** — `§ 9.11`, `la fase 14`, `Phase 3`, `sección 4`: the in-file form of a
   cross-reference, naming its source as a link does
7. **An identifier** — `I-04`, `UC-02`, `ADR-122`, `LAC4` (`\b[A-Z]{1,6}-\d{1,4}\b`, `\bLA[A-Z]*\d+\b`). A paragraph led by
   `**I-04 — …**` names its subject; the judge dismissed 47 such paragraphs on the reference before this token existed

**Detection**:
```bash
rg -n '\b[0-9]+(\.[0-9]+)?\s*(%|ms|s|min|hr|GB|TB|MB|KB|RPS|TPS|QPS|node|core|pod|replica|MAU|DAU)\b|\b[A-Z]{3,}\b|`[^`]+`|\]\([^)]+\)' \
  docs/03-*.md docs/04-*.md docs/05-*.md docs/06-*.md docs/07-*.md docs/08-*.md docs/09-*.md
```
Then, per prose paragraph, confirm ≥1 match falls inside it.

**Not a candidate**: a lead-in — a paragraph ending in `:` that introduces the list or table after it.

**Pass criterion**: ≥1 density token per prose paragraph making a behavior, capacity, cost or risk
claim.

**Fail message**: `Paragraph at <file>:<line> makes a claim with no number, component name, technology, identifier, or cross-reference. Add the measurement or link the source section — a cross-reference satisfies this rule and is not counted against sentence length.`

> **Note for the model**: token 5 exists so the Source Attribution Rule *helps* a sentence pass
> rather than fighting it. Never resolve a `S-LEN-01` finding by deleting a cross-reference.

#### `S-DENSITY-02` — Mannered prose (judgement)

Metaphor or flourish where a literal phrase exists — `PROSE_STYLE.md` §4.5. Not detectable by
rg beyond the examples listed there; the model reads each prose paragraph of the scoped files
and flags a sentence whose meaning is carried by a figure of speech rather than a literal claim.
A named pattern (`circuit breaker`, `dead-letter queue`, `bulkhead`, `saga`) is a literal name.

**Detection** (the listed examples only — the rest is judgement):
```bash
rg -ni 'dial worth turning|earns its keep|beating heart|north star|heavy lifting|the glue between|lives and breathes|at the end of the day|palanca que vale|se gana su lugar|corazón que late|estrella polar|pegamento entre|a fin de cuentas|vive y respira' docs/
```

**Pass criterion**: no sentence whose only content is a figure of speech.

**Fail message**: `Mannered prose at <file>:<line>: "<excerpt>". Say what you mean — replace the figure of speech with the literal phrase (the number, the component, the decision).`

---

### Group 6 — Voice and tense (WARNING)

#### `S-VOICE-02` — Future tense for designed behavior

**Detection**:
```bash
rg -n '\b[Ww]ill [a-z]+\b|\b(?:[Vv]oy|[Vv]as|[Vv]a|[Vv]amos|[Vv]an) a [a-záéíóúñ]+(?:[aá]r|[eé]r|[ií]r)(?:se|me|te|nos)?(?:lo|la|los|las|le|les)?\b|\b[Ss]er[áa]n? [a-z]+|\b[Ss]e implementar[áa]' ARCHITECTURE.md docs/
```

The Spanish periphrastic future is *ir a* + an infinitive, in every person of *ir* (`va a validar`, `se van a llenar`).
*Ir a* + a noun or an article is motion in the present — `ningún token va a log`, `la entrega va a Confluent Kafka`,
`va a la autoevaluación` — and never a candidate: the match is case-sensitive, so a capitalized product is not an
infinitive, and `prose-check.js` names the tech nouns that end like one (`cluster`, `broker`, `server` …).

**Pass criterion**: every match sits in a sentence carrying a version or a date token; otherwise
WARNING.

**Fail message**: `Future tense at <file>:<line> describes designed behavior. Use present tense — 'validates', not 'will validate'. Future tense is reserved for deferred work and must carry a version or date.`

#### `S-VOICE-03` — Agentless passive and impersonal `se`

**Detection**:
```bash
rg -nPi '\b(is|are|was|were|be|been)\s+(validated|processed|handled|stored|sent|received|encrypted|routed|cached|logged|persisted)\b(?!\s+by\b)' docs/
rg -ni '\bse (valida|procesa|maneja|almacena|env[íi]a|recibe|cifra|enruta|registra|persiste)\b' docs/
```

**Pass criterion**: 0 matches where an actor exists in the architecture.

**Fail message**: `Agentless passive at <file>:<line>. Name the component that acts: 'the gateway validates the token', not 'the token is validated'. Spanish: 'el gateway valida el token', not 'se valida el token'.`

---

### Group 7 — Waiver accounting (WARNING)

#### `S-WAIVER-01` — Waivers are justified and rare

**Detection**:
```bash
rg -n 'PROSE_OK:' ARCHITECTURE.md docs/
rg -n '<!--\s*PROSE_OK:\s*-->' ARCHITECTURE.md docs/          # empty reason
rg -c 'PROSE_OK:' docs/*.md | rg -v ':[0-3]$'                # >3 in one file
```

**Pass criterion**: every waiver carries a non-empty reason; ≤3 per file.

**Fail message**: `<N> prose waivers in <file> (or a waiver with no reason at <line>). More than three is a signal the template is wrong, not the author — raise it rather than waiving it.`

---

## Output Format

```
PROSE_VALIDATION_REPORT:
  status: PASS | FAIL
  scope: first-write | edit | release
  mode: enforcing | report-only
  contractVersion: v1
  docLanguage: en | es
  bilingualPatternsRun: true
  filesChecked: <int>
  totalChecks: <int>
  blockingFindings: <int>
  warningFindings: <int>
  waivers: <int>
  round: <1 | 2 | 3>
  findings:
    - ruleId: S-BOILER-01
      severity: BLOCKING
      file: docs/04-data-flow-patterns.md
      lineRef: Lines 19-21
      grepCommand: |
        rg -ni 'this section provides a visual representation|how to read this file|...' ARCHITECTURE.md docs/
      grepOutput: |
        docs/04-data-flow-patterns.md:19:> **How to read this file**: the Phase Catalog describes each phase...
      excerpt: "**How to read this file**: the Phase Catalog describes each phase..."
      expected: "no template boilerplate in generated output"
      fix: "Delete the blockquote. Section anchors already convey reading order."
  suppressed:
    - ruleId: S-BAN-03
      token: robust
      reason: "proper noun — 'Robusta' listed in docs/06-technology-stack.md:41"
  fallbacks:
    - <checks that could not run: missing file, tool error. Empty list otherwise.>
```

**Field rules**:
- `status: PASS` only when `blockingFindings == 0`. Warnings never flip status.
- `mode: report-only` forces `status: PASS` regardless of findings.
- The block is the script's output (`--json` for this shape as data). `grepCommand` + `grepOutput` are what the rule reference prints per rule and what a hand run had to quote; the script's `file:line` + `excerpt` per finding replaces them, and a judged finding carries `judged: { by, p }`. `judge.undecided` lists the candidates no judge has answered (`ruleId`, `file`, `line`, `excerpt`) and `judge.pending` the worksheets to answer; they never count as findings.
- `bilingualPatternsRun` must be `true`. If any blocklist ran English-only, the report is invalid.
- Emit the block even on PASS, to confirm the validation ran.

---

## Failure Semantics

| Outcome | Orchestrator action |
|---|---|
| `status: PASS`, `blockingFindings: 0`, `warningFindings: 0` | Gate check passes. Proceed |
| `status: PASS`, `blockingFindings: 0`, `warningFindings: ≥1` | Surface warnings in the user-facing summary, proceed. Do **not** loop on warnings |
| `status: FAIL`, `blockingFindings: ≥1` | Show findings, regenerate the offending content only, re-run from rule 1. Increment round |
| `round == 3 AND status: FAIL` | Escalate with all 3 rounds side by side. User picks: (a) edit manually, (b) hand-override with explicit acknowledgment, (c) abort |
| `mode: report-only` | Never blocks. Print one summary line and proceed |
| `grep` unavailable | **Fail-closed** — escalate immediately. The user fixes the environment or overrides |

### Group 8 — History (runs in every scope)

A document states the design as it is. What it used to say, and when that changed, belongs in `docs/CHANGELOG.md`
and in the decision's ADR (its `## Review History`). On the reference corpus this was the most visible source of
verbosity, and no other rule saw it.

#### `S-HIST-01` — Dated narration (WARNING, judgement)

**Candidates**: strong markers — `dejó de`, `ya no`, `pasó de`, `antes era`, `originalmente`, `no longer`, `used to`,
`previously`, `formerly`, `originally`; weak markers — `desde el/la`, `hasta el/la`, `a partir de`, `since`,
`until`, `as of`. A weak marker is also a range or an origin in the current design (`desde el dispositivo hasta el
gateway`), so it is a strong candidate only when a date, a version, an amendment or a release follows within three words
(`desde la enmienda del 2026-09-03`); the judge reads every candidate, and a dismissal is printed only for a strong one. Quoted text is skipped.

**Fail message**: `Dated narration '<marker>'. State the design as it is now; the history belongs in docs/CHANGELOG.md and the decision's ADR (its Review History).`

#### `S-HIST-02` — Edit-marker comments (BLOCKING, Group 1 — mechanical)

**Detection**: an HTML comment that opens with an edit verb — `añadido`, `precisado`, `corregido`, `partido`,
`actualizado`, `cambiado`, `movido`, `eliminado`, `revisado` …, `added`, `clarified`, `corrected`, `split`, `updated`,
`changed`, `moved`, `removed`, `fixed`, `revised`, `was:`, `antes:`. Structural markers (`SECTION:`, `LABEL:`,
`EXPLORER_HEADER`, `DERIVED:` …) never match.

**Fail message**: `Edit-marker comment '<comment>'. A note about the edit is history, not architecture: delete it. The change belongs in docs/CHANGELOG.md, the decision in its ADR.`

### Group 9 — Record structure (`--scope records` only)

#### `S-STRUCT-01` — A project ADR's structure stays English (BLOCKING, mechanical)

**Detection**: `[plugin_dir]/scripts/shared/record-structure.js` over a project ADR (101+), the vocabulary `LANGUAGE_POLICY.md` §4 *Records*
lists — a localized heading at any level (`## Contexto`, `### Consecuencias Negativas`, `## Historial de Revisión`), a
localized label with its colon (`**Estado**:`, `**Severidad**:`), a localized table **header row** (`| Riesgo |
Probabilidad | … |`, `| Fecha | Revisor | Acción | Notas |`), or an anchor comment on a heading (`<!-- SECTION: … -->`).
Accents and case are ignored; body cells, bold prose words and fenced blocks are never read. An institutional ADR
(001–100) keeps its catalog edition's headings and is never checked. TDRs are held to the same module by `tdr-check.js`
(`structure-localized`).

**Fail message**: `` `## Contexto <!-- SECTION: Context -->` — headings stay English: `## Context`; records carry no anchor comment: drop it ``

---

## Appendix A — Scope Map

### Scope: `first-write` (Step 5 → before Step 6)

Files: `ARCHITECTURE.md`, every `docs/*.md`, every `docs/components/**/*.md`.
All 8 groups run. This is the primary invocation, and the files are already in context from Step 5.

### Scope: `edit` (default for incremental edits)

Files: only the file just written. Runs as **Check F** of the Post-Write Alignment audit. Silent on
pass; reports only on findings. Groups 1, 2, 6 and 8 only — length, form and density are not
re-litigated for an untouched document; history (Group 8) is checked because an edit is where it is left behind.

### Scope: `release` (the release check, `architecture-lifecycle` — additive over `first-write`)

Files: the whole corpus, in `enforcing` mode **regardless of the `PROSE_STYLE` marker**. This is
where a legacy architecture finally pays the cost. The only exemption is an explicit
`<!-- PROSE_STYLE_WAIVED: <reason> -->` in `ARCHITECTURE.md`, which must name the reason and is
surfaced in the release notes.

### Scope: `records` (8.68.0 — Workflow 12 Stage 6, the ADR and TDR skills after every write)

Files: project ADRs (`adr/ADR-101`+) and `tdr/TDR-*.md`; institutional ADRs never. Groups 1, 2, 3, 6, 8 and 9 — no form or
density (a record has its own template). Each record's own log — `## Review History`, `## History`, `## Notes` — is
skipped: history belongs there. `S-VOICE-01` does not run on records (an ADR Consequences section may speak for the team
that owns the decision). Enforcing once `PROSE_STYLE: v1` is stamped. Size budgets are `docs-stats.js`'s.

### Tier map (from `PROSE_STYLE.md` §9)

| Tier | Files | Groups that run |
|---|---|---|
| A | `ARCHITECTURE.md`, `docs/**` | All 8 (changelogs: `[Unreleased]` only, Groups 1, 2, 6, 8) |
| B | project `adr/` (101+) and `tdr/` | Groups 1, 2, 3, 6, 8 under `--scope records`, logs skipped; Group 9 (`S-STRUCT-01`) on ADRs, `tdr-check.js` on TDRs |
| B | `handoffs/**`, `analysis/**`, `BIAN_ALIGNMENT.md`, `TRACEABILITY_REPORT.md` | None — contract applies at authoring time only; the `PROSE` peer-review category that used to surface residue post-hoc has been retired |
| C | `compliance-docs/**`, template-driven outputs of an institution pack's skills | Groups 1 and 2 only. Form, length and density would fight a structure code writes |
| Exempt | `COMPLIANCE_MANIFEST.md`, `examples/ARCHITECTURE_example_3tier.md` | None |
