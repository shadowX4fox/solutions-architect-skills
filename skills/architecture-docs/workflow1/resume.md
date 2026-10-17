> Part of **Workflow 1 — Create** (`architecture-docs`, 8.87.0; one receipt since 8.88.0). Read this file
> instead of the router's Step 0.1 when a create is being **continued** — the user said "continue the
> architecture" / "continúa la arquitectura", or a create request finds `.cache/sa-skills/collect.json` with
> the create unfinished.

#### Resume a create after a checkpoint

A create stops at four checkpoints so that the next segment starts in a clear session instead of carrying
every document written so far. Everything the next segment needs is on disk, and one command prints it:

```bash
bun [plugin_dir]/skills/architecture-docs/scripts/resume-prepare.js <project_root> --plugin-dir [plugin_dir]
```

The receipt carries the progress (done, next, anything written but not marked), the collection (language,
type, PO Spec / capability alignment / HLD, the systems and their containers), the ADR Context Block whole, the facts in
counts, every file written with its size, and the next step as commands — the part of `workflow1/` to read
and, for a section, the exact `section-prepare.js` line.

**The receipt is the project's state.** Do not `ls`, `grep`, `sed` or `cat` the project, the ADRs, the PO
Spec or the documents already written to find out what exists or what was decided: the 8.87.0 control run
spent about twenty such commands and 80 KB per segment rediscovering what this receipt prints. What a
section needs from the spec, the ADRs and its parents is in its payload; a passage the payload does not
carry is read by heading range, once. Read instruction files with the `Read` tool, never `cat` — a `cat` of
a file over 30 KB is saved aside and read a second time.

Then:

1. **Complete** → there is nothing to resume. **Written but not marked** → run that item's gates (the
   `05-sections.md` loop, item 3) and mark it; write it again only if they fail.
2. If the user asked to create an architecture (not to continue) and the create is unfinished, ask once:
   continue it, or start over (`create-progress.js <project_root> --reset`, then Step 0.1).
3. Read the part the receipt names and go on at the `next` item. Never re-run Steps 0.1–4.9 and never ask
   what the collection answers.
4. After each item passes its gates: `create-progress.js <project_root> --done <item>`. When the receipt
   prints a `CHECKPOINT`, display it and stop.
