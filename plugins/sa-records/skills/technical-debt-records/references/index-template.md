# Technical Debt Records

Technical Debt Records (TDRs), lean format after https://www.workingsoftware.dev/technical-debt-records/. ADRs capture *why a decision was made*; TDRs capture *what was deferred or accepted as suboptimal, and what it will cost later*.

**Add a TDR** for an intentional architectural compromise — a shortcut under pressure, a missing control, a workaround for an upstream constraint, a deprecated path still live, a ceiling already hit. **Not** for bugs, feature requests or plain backlog.

**Format**: Status (with the Initiative and Driver lines), Description, Impact, Possible Solutions, Capability (only with `BIAN_ALIGNMENT.md`; the index then carries a `Capability` column before Owner), Owner, History. Frontmatter `status:` matches `## Status`; `target-date:` when `Planned`. Copy an existing record.

**IDs**: global, zero-padded (`TDR-001`), never reused.

## Status

One per record. The file carries the English word; the *Deuda Arquitectónica* Jira board the tag.

| Status | Jira tag | Meaning | Rule |
|---|---|---|---|
| `Open` | `ACEPTADA` | In production; the team lives with it. | Default. |
| `Planned` | `PROYECTADA` | Decided, not executed. | `target-date:`. |
| `In Progress` | `EN CURSO` | Being paid, capacity assigned. | Named technical owner. |
| `Resolved` | `PAGADA` | Remediated and verified. | History links the commit / PR / ADR. |
| `Won't Fix` | `BANCA ROTA` | Interest exceeds what can be paid; an investment decision. | Description and Impact justify it; History records who decided, when. |

Moves: `Open` / `Planned` → `In Progress` → `Resolved`; `Open` → `Won't Fix`; `Planned` → `Open`. Never straight to `Resolved`. Every move: `## Status` and `status:` together, a dated `## History` note, nothing else rewritten. Retired tags migrate on sight, noted in History: `Deuda Pendiente`, `TRANSITORIA` → `Open`; `Ya esta, en local` → `In Progress`; `REALIZADA`, `Terminado`, `DEPRECADO` → `Resolved`.

## Index

| ID      | Title                                       | Status | Driver       | Owner    |
|---------|---------------------------------------------|--------|--------------|----------|
| TDR-001 | <example — replace or remove>               | Open   | Architecture | <team>   |
| TDR-002 | <example — replace or remove>               | In Progress | Process | <team>   |

## Cross-reference

The architecture's Risks and Technical Debt section (Section 13; arc42 Section 11) carries a summary table pointing here.
