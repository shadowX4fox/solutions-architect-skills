# Workflow 11 — Layout Migration Gate (Legacy → Current)

> Loaded by `architecture-docs` as a preflight for Workflows 2 / 3 / 8 / 10 and any informational query on an existing multi-file project, or explicitly on "migrate layout", "backfill missing section", "create the risks section". Detection in `SKILL.md` → "Workflow 11"; the procedure is here.

**Purpose**: Migrate older multi-file `docs/` layouts to the current numbering convention. Older versions of this skill placed References at `docs/10-references.md` (with no Risks & Technical Debt section). The current convention puts Risks & Technical Debt (S13) at `docs/10-risks-and-technical-debt.md` and shifts References to `docs/11-references.md` so the cross-cutting References file remains the highest-numbered file by convention.

**Auto-trigger preflight**: Every workflow that operates on an existing multi-file project (Workflows 2 / 3 / 8 / 10 and any informational query against `docs/*.md`) MUST run the detection check below before proceeding. New-project creation (Workflow 1) and the single-file → multi-file restructure (Workflow 9) emit the current layout directly and skip this gate.

**When to invoke explicitly**: User says "migrate layout", "upgrade architecture file numbering", "fix references file position", "backfill missing section", "create the risks section", or any other workflow auto-fires the preflight. It is also where the Missing Section Remediation contract sends a user whose downstream skill stopped on an absent section.

**Detection** — two independent cases. Test **Case A first**; if it does not match, test Case B.

**Case A — legacy layout signature.** Both conditions must hold:

- `docs/10-references.md` exists, AND
- `docs/10-risks-and-technical-debt.md` does NOT exist

→ legacy layout. Run Steps 1–7 (rename + scaffold + rewrite + navigation).

**Case B — missing section backfill.** The layout numbering is already current, but one or more
section files are absent:

```bash
for f in 01-system-overview 02-architecture-principles 03-architecture-layers \
         04-data-flow-patterns 05-integration-points 06-technology-stack \
         07-security-architecture 08-scalability-and-performance \
         09-operational-considerations 10-risks-and-technical-debt 11-references; do
  [ -f "docs/$f.md" ] || echo "MISSING: docs/$f.md"
done
```

Case B fires when **both** hold:

- `docs/10-references.md` does NOT exist — the numbering is already current, so nothing is waiting to be renamed, AND
- the loop above emitted at least one `MISSING:` line

→ Run **Step 3 only** (create each missing file from its template) followed by Steps 5–7
(navigation table, report, resume). Skip Steps 2 and 4 — there is nothing to rename and no
cross-references to rewrite.

The first condition is a **guard, not a formality**. A half-migrated project can hold both
`docs/10-references.md` and `docs/10-risks-and-technical-debt.md`: Case A rejects it (S13 already
exists), and without the guard Case B would see `docs/11-references.md` missing and create an empty
one while the real reference content sat in `docs/10-references.md`, unlinked. Such a project needs
Case A's rename path, so report it and stop:

```
⚠️  Half-migrated layout: docs/10-references.md and
    docs/10-risks-and-technical-debt.md both exist.

    Neither migration case applies cleanly. Move the References content to
    docs/11-references.md manually, delete docs/10-references.md, then re-run.
```

Neither case matches → exit with `ℹ️ Layout already current — nothing to migrate.`

**Case B** covers architectures missing any section file, including S13, that Case A cannot see
because their `docs/11-references.md` already exists and the `docs/10-references.md` precondition
never holds. It is also the backfill path the Missing Section Remediation contract points every
downstream consumer at, so it must handle any absent section file, not only S13.

**Steps**:

1. **Confirm with user** before any rename:
   ```
   ⚠️  Legacy layout detected: docs/10-references.md occupies the cross-cutting
       "last file" slot, but the current convention reserves docs/10-* for
       Risks & Technical Debt (S13) and shifts References to docs/11-*.

       Migrate now? [Y/n]
   ```
   If `n` → halt and emit a one-line skip note. The calling workflow does NOT proceed; the user must either re-run and accept, or invoke Workflow 11 explicitly later.

2. **Rename References file**: `docs/10-references.md` → `docs/11-references.md`.
   - Under git: `git mv docs/10-references.md docs/11-references.md`
   - Otherwise: `mv docs/10-references.md docs/11-references.md`

3. **Create the missing section file(s)** from their templates in `ARCHITECTURE_DOCUMENTATION_GUIDE.md`. In Case A this is always exactly `docs/10-risks-and-technical-debt.md` (empty 13.1 Risks and 13.2 Technical Debt tables, plus the conventions block). In Case B it is every file the detector reported.

   Each file is created as a **scaffold, not as content**: headings with their English `SECTION:` / `LABEL:` anchors, table headers with no rows, and nothing invented. Authored in the project's `doc_language` (run Language Resolution first). Do not populate a backfilled section by inferring from neighbouring files — an empty S13 states "nothing recorded", which is honest; an S13 reverse-derived from ADR consequences states something no one decided.

   `docs/components/README.md` is never written here — delegate to `architecture-component-guardian`, its only sanctioned writer.

4. **Rewrite internal cross-references**: locate every link to `docs/10-references.md` across `docs/`, `docs/components/`, `adr/`, and `ARCHITECTURE.md`, then rewrite to `docs/11-references.md`.
   ```bash
   rg -l "docs/10-references" docs/ adr/ ARCHITECTURE.md 2>/dev/null \
     | xargs -r sed -i 's|docs/10-references|docs/11-references|g'
   ```

5. **Update the navigation table in `ARCHITECTURE.md`**: locate the Documentation table (rows of the form `| NN | <Section Name> | [docs/...](docs/...) | ... |`) and:
   - Update the References row to point at `docs/11-references.md` *(Case A only)*
   - Insert a row for every section file created in Step 3 that is not yet listed — for S13, `| 13 | Risks and Technical Debt | [docs/10-risks-and-technical-debt.md](docs/10-risks-and-technical-debt.md) | Known risks, accepted debt, TDR summary |`

6. **Report** — Case A:
   ```
   ✅ Layout migrated:
       - References:               docs/10-references.md → docs/11-references.md
       - Risks & Technical Debt:   created docs/10-risks-and-technical-debt.md (empty Section 13 template)
       - Internal links updated:   {N} cross-references rewritten across {M} files
       - Navigation table:         updated in ARCHITECTURE.md

       The calling workflow can now proceed.
   ```

   Case B:
   ```
   ✅ Missing sections backfilled:
       - Created:                  {list of docs/NN-*.md created, one per line}
       - Navigation table:         {N} row(s) added in ARCHITECTURE.md
       - Numbering:                already current, nothing renamed

       Each file is an empty scaffold. Populate it before relying on it
       downstream — an empty section reports as empty, not as absent.

       The calling workflow can now proceed.
   ```

7. **Resume the original workflow** (the one whose preflight detected the legacy layout or the missing section). The user does NOT re-issue the original command — Workflow 11 hands control back automatically.

**Idempotency**: Workflow 11 is safe to re-run. After a successful migration or backfill both detection cases return false and the workflow exits with `ℹ️ Layout already current — nothing to migrate.`

**Out of scope**: this workflow does NOT alter section content, ADRs, component files, or version metadata. It is purely a file-renumber + S13 scaffold + cross-reference rewrite + navigation-table update.

