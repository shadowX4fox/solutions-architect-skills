> Part of **Workflow 1 — Create** (`architecture-docs`). Read this file at Step 0.1 instead of `00-gates.md`
> (8.87.0). `00-gates.md` is the full specification of every gate; it is read **by line range**, only for
> a gate this file sends you to.

#### Steps 0.1–0.65 — the entry gates, by code

**1. Check every gate at once:**

```bash
bun [plugin_dir]/skills/architecture-docs/scripts/gates-check.js <project_root> [--lang en|es] [--hld <file>]
```

It prints one line per gate — `PASS`, `ASK`, `WARN`, `MISSING` or `BLOCK` — and a `read:` line with a
`00-gates.md` line range only where the receipt cannot carry the handling. Resolve the lines in gate
order:

| Line | Do |
|---|---|
| `PASS` | Display it as `✅ …` and move on. Nothing to read |
| `0.1 language ASK` | Ask **English (en) / Español (es)** with `AskUserQuestion` — the `default` the receipt names is pre-selected, never adopted silently. No skip. The answer is `doc_language` for the rest of the run: document text in that language, every structural heading with its English anchor comment, the machine layer (codes, markers, column headers, filenames) always English |
| `0.2 po_spec ASK` | Several specs: ask which one applies |
| `0.2 po_spec MISSING` | Read the named range — the four-option menu (elicit, intake, inline, `SKIP PO SPEC`) and its branches. A skip cascades: the alignment and the HLD are skipped too |
| `0.2 po_spec BLOCK` | The spec was drafted in chat mode (`READINESS_CHECK: draft`) or edited after its evaluation (stale stamp). Show the note and **stop**: the Product Owner or the architect runs `evaluate PO spec` (sa-requirements:architecture-readiness workflow 4), which stamps it when the checks pass; then re-run the check |
| `0.2 po_spec WARN` | `not evaluated`: the spec has no `READINESS_CHECK` stamp (written before 10.24.0, or never evaluated) — show the note, ask *evaluate it first?*; on yes run workflow 4, else continue. Architecture references: the spec carries architecture references (ADR / TDR / `I-nn` ids, links into the architecture). Show the note and continue: the PO Spec is business only, so no section cites those ids as decisions, no ADR takes a number or a meaning from them, and the final report points the Product Owner to `po-spec-delta.js <root> --check` (optional — sa-requirements Workflow 6; without it the gate never warns) to rewrite them in business words |
| `0.3 align ASK` | No framework declared: ask once among the frameworks the note lists and **none**, record it with `frameworks.js --declare`, re-run the check |
| `0.3 align WARN` | Show the note, ask *continue anyway?*; on no, stop and point to `/sa-requirements:architecture-capability-alignment` |
| `0.3 align BLOCK` | Read the named range, display its message, **stop** |
| `0.4 hld ASK` | One candidate → take it, say so in one line, re-run with `--hld <file>` (a question needs two options; the 8.92.7 run asked one and the tool refused the whole call). Two or more → ask among them. None → ask for the path. No skip. Re-run with `--hld <file>` until the line passes |
| `0.4 hld PASS (mermaid)` | Nothing to read: every section payload carries the Mermaid verbatim |
| `0.4 hld TRANSCRIBE (pdf · svg · png)` | Read the named range, items 2–2b: read the picture once and write the `<name>.hld.mmd` the receipt names — every box, grouping and arrow verbatim — then re-run with `--hld <file>` |
| `0.4 hld PASS (pdf · svg · png)` | The transcription exists and states its edges: nothing to read — the payloads carry it; never read the picture again |
| `0.65 catalog WARN` | Ask once whether the organization keeps an institutional ADR catalog; if yes, `architecture-definition-record` Workflow 6 imports it |
| `0.65 catalog BLOCK` | Read the named range and import the catalog before going on |

Re-run the check after resolving an `ASK`, a `MISSING` or a `BLOCK`; go on when every line is `PASS` or
an acknowledged `WARN`.

**2. Step 0.5 — supplementary context (optional).** Ask once whether there are other design documents
(ADRs, tech radar, API specs, data models, NFRs, IaC). **skip** → go on. Files given → read the
`00-gates.md` range of Step 0.5 for how to classify and attribute them.

**3. Step 0.6 — the ADR Context Block.** Read the `00-gates.md` range of Step 0.6 (the one range every
run reads). Its inputs are PO Spec sections 1, 3, 4 and 7: read **those sections by heading range**
(`rg -n '^## ' <spec>` for the offsets), never the whole spec — from Step 5 on, each section payload
carries what it needs of it. Write the confirmed block to `.cache/sa-skills/adr-context.md`; it is the
copy every payload and a resumed session read.

**4. Record the traceability** the gates produced (`DOC_LANGUAGE_GATE`, `PO_SPEC_SOURCE`,
`BIAN_ALIGNMENT_GATE` or `ALIGNMENT_GATE`, `HLD_GATE` / `HLD_SOURCE` / `HLD_FORMAT`) for `docs/01-system-overview.md` — the
exact marker lines are in each step's range, and `collect-save.js` at Step 4.9 keeps the values.

Then Step 1 (`workflow1/01-type-selection.md`).
