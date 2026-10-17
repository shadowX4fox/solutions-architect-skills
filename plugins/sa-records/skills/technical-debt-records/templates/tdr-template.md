---
status: Open          # Open | Planned | In Progress | Resolved | Won't Fix — one, same as ## Status
target-date: ""       # YYYY-MM-DD, only when Planned
date: YYYY-MM-DD
related-adrs: []
affected-components: []
tags: []
bian-capability: ""   # only with BIAN_ALIGNMENT.md — the ## Capability value on one line
driver: Architecture   # Strategy | Architecture | Talent | Process — same as the **Driver** line
---

# TDR-NNN: <the compromise, present tense — not the fix>

## Status

`Open`

**Initiative**: <architecture name> (architecture v<version>)
**Driver**: <Strategy | Architecture | Talent | Process> — <the signal, a few words>

## Description

What was done, what is missing, what needs improvement. Name the system, component, interface, protocol, version. ≤ 200 words, the compromise as it stands today.

## Impact

Consequences of leaving it: security exposure (C / I / A), operational risk, maintainability cost, scalability ceiling (the threshold), compliance or contractual risk (the clause). Quantify where possible. ≤ 150 words.

## Possible Solutions

Directional, one or two sentences each, ≤ 150 words together; the chosen path may become an ADR.

- Option A: ...
- Option B: ...

## Capability

<!-- Only with BIAN_ALIGNMENT.md; omit the section and the frontmatter key otherwise. One capability, the most significant the initiative realizes among those the affected components serve; values verbatim from the alignment. -->

| Level | Name | Code / BIAN id |
|---|---|---|
| Business Area | <area> | `<DOM>` |
| Business Domain | <business domain> | `<CAP>` · `<bian id>` |
| Service Domain | <service domain the affected components serve> | `<bian id>` |

One sentence: why this one (which affected component serves it). Others go in `tags`.

## Owner

- **Technical**: <person or team who resolves it — never "TBD">
- **Business (P&L)**: <unit, journey or product whose results pay the interest>

---

## History

- YYYY-MM-DD: Created. Status: `Open`.

<!-- One line per note (≤ 30 words): what changed, and the link. The substance goes into the sections above, rewritten in place. -->
