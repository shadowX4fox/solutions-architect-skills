# Missing Section Remediation — cross-skill contract

> Owned by `architecture-docs`; binding on every skill that reads a `docs/NN-*.md` section file. Referenced from `SKILL.md` → "Section Number vs File Prefix".

When any skill needs a section file that does not exist, it **guides the user to create it** and
stops. It never silently skips the section, never substitutes a default, and never reports on the
section as though it were empty-by-choice.

The distinction that matters: **absent ≠ empty**. `docs/10-risks-and-technical-debt.md` with two
empty tables is a claim — this architecture has recorded no risks and no debt. A missing file is
not that claim; it is the absence of one. Treating the second as the first is how an architecture
acquires a clean bill of health it never earned, and the failure is invisible precisely because
nothing errors.

**Required emission** — any consumer, any skill:

```
⚠️  Required section missing: {S-number} ({Section Name})
    Expected at: docs/{NN-name}.md

    {What this skill needed it for, one line.}

    To create it:
      /sa-skills:architecture-docs  →  Workflow 11 backfills a missing section
                                       from its template in
                                       ARCHITECTURE_DOCUMENTATION_GUIDE.md

    This skill has stopped rather than report on a section that does not exist.
```

**Consumer obligations**:

| Obligation | Rule |
|---|---|
| Detect before reading | Test file presence before the read, so the failure names the section rather than surfacing as an empty-read |
| Stop the affected output only | Halt the deliverable that needed the section; unaffected outputs in the same run still complete |
| Never infer | Do not derive S13 content from ADR consequences, TDR files, or analysis findings to paper over the gap |
| Distinguish in reports | A generated report cites a missing section as `[SECTION NOT DOCUMENTED]`, never as `None` or an empty list |

**Known S13 consumers**, and how each depends on it:

| Skill | Dependency | On absence |
|---|---|---|
| `technical-debt-records` | Writes the 13.2 summary row for every TDR it creates | Emits the block; the TDR file is still written and not rolled back |
| `architecture-analysis` | Tech Debt/EOL lens cross-references declared debt to mark findings `Already tracked (TDR-NNN)` | Emits the block; rows become `[SECTION NOT DOCUMENTED]`; the version/EOL half of the analysis still completes |
| `architecture-compliance` | `SECTION_MAPPING_GUIDE.md` maps S13 into contract sections | Emits the block for the affected contract only |

**No proactive check exists.** Nothing scans an existing architecture and reports the section
missing before someone needs it.

The consequence is that S13 absence is discovered **reactively**, at the moment a consumer above
reaches for it, and never before. That is the reason this contract exists and the reason its
emission is mandatory rather than advisory: the reactive path is the only path. A consumer that
silently skips the section removes the last signal the user would ever get.

Workflow 1 Check 0 still blocks creation without S13, and Workflow 11 Case B still backfills it on
request — so the gap is bounded to architectures whose `docs/` has no Section 13 file and whose
downstream artifacts have not yet been generated.
