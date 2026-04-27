---
name: architecture-explorer-headers
description: Backfill `<!-- EXPLORER_HEADER ... -->` blocks into existing `docs/NN-*.md` and `docs/components/**/*.md` files that predate v3.14.0. The header (5–10 lines after the H1) surfaces key concepts, technologies, components, scope, and related ADRs in the first 60 lines so the architecture-explorer agent classifies the file accurately. Invoke when a doc was created before v3.14.0, when bulk-backfilling a legacy project, or whenever the explorer is misclassifying files.
triggers:
  - regenerate explorer headers
  - regenerate explorer header
  - add explorer headers
  - add explorer header
  - backfill explorer headers
  - backfill explorer header
  - explorer headers
  - update explorer headers
  - sync explorer headers
---

# Architecture Explorer Headers — Backfill Skill

## When This Skill Is Invoked

Manually activated when users want to add or refresh `<!-- EXPLORER_HEADER -->` blocks across architecture docs. This is a maintenance workflow, not part of the normal authoring loop. Use it:

- After upgrading to v3.14.0+ on a project whose docs were authored under earlier versions.
- When the `architecture-explorer` agent is routing files to `irrelevant_files[]` despite the file being clearly relevant — usually a missing or stale header.
- After a major refactor that renamed components or added technologies, where existing headers have drifted.

NOT activated for:
- Routine architecture authoring (use `architecture-docs`).
- Component index changes (use `architecture-component-guardian`).
- ADR creation (use `architecture-definition-record`).

`ARCHITECTURE.md` at the project root is **never touched by this skill** — it is a navigation index and the explorer reads it in full.

---

## Activation Forms

- `/skill architecture-explorer-headers` — interactive: scan, present plan, ask before writing.
- `/regenerate-explorer-headers` — slash-command alias.
- `/regenerate-explorer-headers --force` — overwrite existing headers (default behaviour skips files that already have one).
- `/regenerate-explorer-headers --dry-run` — list what would change, write nothing.
- `/regenerate-explorer-headers <path-glob>` — restrict to a subset (e.g. `docs/components/payment-service/**`).
- `/regenerate-explorer-headers --session` — **(v3.14.1+)** refresh only files edited in the current Claude session, as recorded by the PostToolUse `session-log add` tracker. Implies `--force` for those files. Clears the editlog on success; retains it on partial failure. Combine with `--dry-run` to preview without LLM calls or log mutation.

---

## Workflow

### Phase 0 — Resolve Plugin and Project Roots

1. **Resolve `plugin_dir`**: `Glob` for `**/skills/architecture-explorer-headers/SKILL.md` and strip the suffix; or read `.claude/settings.json` for `extraKnownMarketplaces`. Same approach as `architecture-compliance`.
2. **Confirm `project_root`**: the current working directory. Verify `ARCHITECTURE.md` exists at the root — if not, abort with `ARCHITECTURE.md not found at project root. This skill operates on architecture documentation.`

### Phase 1 — Inventory

#### `--session` mode (v3.14.1+)

If the user passed `--session`, run an alternate inventory instead of the disk scan:

```bash
bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts session-log list --project-root <project_root>
```

This prints deduped relative paths from `/tmp/architecture-explorer/sessions/<projectHash>-<sessionId>.editlog` — one path per line. If the output is empty, print `✓ Session editlog is empty — no headers to refresh, no action needed.` and stop. Otherwise, treat every listed path as `needs_header` with implicit `--force` semantics (the file may already have an out-of-date header), then proceed to Phase 2.

After Phase 3 completes successfully, clear the editlog:

```bash
bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts session-log clear --project-root <project_root>
```

On `--dry-run` skip the clear. On partial failure (some files regenerated, some failed validation), leave the editlog intact so the next pre-flight warning persists and the user can re-run `--session` after fixing.

#### Disk-scan mode (default)

```bash
bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts list <project_root>
```

The CLI emits a JSON array, one entry per candidate file:

```json
[
  { "path": "docs/01-system-overview.md", "has_header": false, "h1": "System Overview", "byte_size": 14820 },
  { "path": "docs/08-scalability-and-performance.md", "has_header": true, "h1": "Scalability & Performance", "byte_size": 18234 },
  { "path": "docs/components/payment-service.md", "has_header": false, "h1": "Payment Service", "byte_size": 9120 }
]
```

Parse it. Bucket files into:

- **needs_header** — `has_header === false` and the path is in scope (matches the `<path-glob>` argument if provided).
- **already_has_header** — `has_header === true`. With `--force`, treat these as needs_header too. Without `--force`, skip.
- **skipped** — outside scope, or `ARCHITECTURE.md` (excluded by the CLI).

If the inventory is empty, report `No docs need explorer headers.` and exit.

### Phase 2 — Present Plan

Show the user a one-screen plan:

```
Architecture Explorer Headers — Backfill Plan

Project: <project_root>
Scope:   <path-glob or "all docs">
Mode:    <add-missing | --force | --dry-run>

Files to update (N):
  - docs/01-system-overview.md     (no header)
  - docs/03-architecture-layers.md (no header)
  - docs/components/payment-service.md (no header)
  ...

Files skipped (M):
  - docs/08-scalability-and-performance.md (already has header — pass --force to overwrite)
  - ARCHITECTURE.md (project root index — exempt by design)

Proceed? (yes / no / edit-scope)
```

Wait for confirmation. On `--dry-run` skip the prompt and end after this report.

### Phase 3 — Generate and Insert Headers

For each file in `needs_header`:

**Step 3.1 — Read the full file.** You need the body to extract accurate metadata; do NOT cap reads here. (This skill is the inverse of the explorer — you are *creating* the metadata the explorer will later sample.)

**Step 3.2 — Extract metadata.** Build the EXPLORER_HEADER content from the file's actual content:

- `key_concepts` — 5–15 domain terms that recur in the doc. Pull from H2/H3 headings, bold terms, table headers, and frequently-occurring capitalized phrases. Avoid generic words ("system", "approach", "data"); favor specific ones ("SLO", "MTTR", "idempotency", "circuit breaker"). Downstream skills (compliance, analysis, dev-handoff) filter the explorer's manifest by these terms when deciding which files to read — concrete, domain-specific vocabulary surfaces relevant docs; generic vocabulary surfaces nothing.
- `technologies` — concrete tools/products named in the doc (Prometheus, AWS, PostgreSQL 16, Spring Boot 3.3, etc.). Skip generic terms ("database", "API"). Preserve version numbers.
- `components` — kebab-case component names referenced in the doc. Match `docs/components/<NN>-<slug>.md` filenames. For component files themselves, use `component_self: <slug>` instead.
- `scope` — one short sentence (≤120 chars) describing what the doc covers and what it does NOT. Read the doc's intro paragraph to source this.
- `related_adrs` — ADR identifiers (`ADR-NNN`) referenced in the doc body or footer.
- `component_self` (component files only) — the component's kebab-case slug, derived from filename.
- `component_type` (component files only) — extract from `**Type:**` field in the file. If absent, omit the field.

**Step 3.3 — Compose the 30-second summary blockquote.** One paragraph (≤300 chars) that complements the machine-readable header. Read for a reader who has 30 seconds to decide whether to read the full doc.

**Step 3.4 — Insert via Edit.**

Find the H1 line (`^# `) in the file. The insertion goes immediately after the H1 and the blank line that should follow it.

```markdown
# <existing H1>

<!-- EXPLORER_HEADER
key_concepts: <comma-separated>
technologies: <comma-separated>
components: <comma-separated>     # OR `component_self:` + `component_type:` for component files
scope: <one sentence>
related_adrs: <ADR-NNN, ADR-NNN>
-->

> <30-second summary paragraph>

<existing body>
```

Use the Edit tool (not Write) so you preserve the rest of the file byte-for-byte.

**Step 3.5 — Validate.**

```bash
bun [plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts validate <abs_path>
```

Exit code 0 = header parses cleanly and includes all required fields. Exit code 1 = malformed; revert the Edit, log the error, continue with the next file.

### Phase 4 — Report

Print a summary table:

```
Architecture Explorer Headers — Backfill Complete

Updated:   N files
Skipped:   M files (already had headers; pass --force to overwrite)
Failed:    K files (malformed header — Edit reverted)

Updated files:
  ✅ docs/01-system-overview.md
  ✅ docs/03-architecture-layers.md
  ✅ docs/components/payment-service.md
  ...

Failed files:
  ❌ docs/components/legacy-thing.md — header validation: missing 'scope' field
```

Suggest a follow-up: `Want me to /schedule an agent to re-run this monthly? Stale headers degrade explorer accuracy over time.`

---

## Anti-Patterns

1. **Don't generate headers from imagination.** Every field MUST come from the file's actual content. If a technology isn't named in the doc, don't list it. The explorer's classification is only as accurate as the header's truthfulness.
2. **Don't touch `ARCHITECTURE.md`.** It's a navigation index, exempt by design. The CLI's `list` subcommand excludes it.
3. **Don't run with `--force` on a freshly-tuned project.** Operators may have hand-curated headers; `--force` wipes that work. Default mode (skip-existing) is safe.
4. **Don't skip the validation step.** A malformed header (missing field, broken comment fence) is worse than no header — it actively misleads the parser. Always run `header-cli.ts validate` and revert on failure.
5. **Don't widen the scope past `docs/` and `docs/components/`.** Headers are not for ADRs (ADRs have their own structure that the explorer reads natively) or for `archive/v*/` snapshots (those are immutable).

---

## Permissions

This skill needs the same `Read`, `Edit`, and `Bash([plugin_dir]/skills/architecture-explorer-headers/utils/header-cli.ts list/validate)` permissions as `architecture-docs`. The pre-configured `.claude/settings.json.example` already covers them.

---

**Skill Version**: 1.1.0 (v3.14.1 — adds `--session` mode + session editlog integration)
**Specialization**: Backfill EXPLORER_HEADER blocks into legacy architecture docs
