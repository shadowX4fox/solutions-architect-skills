# Release Architecture Version Workflow

This guide defines the operational workflow for releasing a new architecture version — from bumping the version number, generating the changelog entry, updating all metadata, to creating an annotated git tag.

**When to invoke**: Triggered by Workflow 10 in `SKILL.md` when the user asks to "release architecture", "bump architecture version", "freeze architecture", or similar.

**Prerequisite**: `ARCHITECTURE.md` must exist with a `<!-- ARCHITECTURE_VERSION: -->` metadata block (created by the Architecture Type Selection Workflow Step 5).

---

## Overview

An architecture release is a formal transition of the `ARCHITECTURE.md` from `Draft` to `Released` (for v1.0.0) or from one `Released` baseline to the next (v1.1.0, v2.0.0, etc.). Every release produces:

1. Updated version metadata in `ARCHITECTURE.md` header
2. Updated `Architecture Version` field in every component file
3. New entry in `docs/CHANGELOG.md`
4. Annotated git tag `architecture-v{version}` (if repo is under git)

---

## Semver Rules for Architecture Docs

| Bump | When to use | Examples |
|------|-------------|----------|
| **MAJOR** (1.0.0 → 2.0.0) | Breaking structural changes | New system added, architecture type changed, core principles changed, major ADR superseded |
| **MINOR** (1.0.0 → 1.1.0) | New capabilities | New components added, new sections, new integrations, new ADRs accepted |
| **PATCH** (1.0.0 → 1.0.1) | Clarifications / fixes | Metric corrections, typo fixes, documentation clarifications |

**Rule of thumb**: If a consumer (compliance, dev team) needs to re-read the architecture, bump MINOR or MAJOR. If it's only clarifying existing content, bump PATCH.

---

## Workflow Steps

### Step 1 — Read Current Version

Read `ARCHITECTURE.md` and extract:
- `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` — current version
- `<!-- ARCHITECTURE_STATUS: ... -->` — current status (Draft / Released / Deprecated)
- `<!-- ARCHITECTURE_RELEASED: YYYY-MM-DD -->` — previous release date (empty if never released)

If any of these comments are missing, abort with:
> ⚠️ Architecture version metadata missing. This architecture predates the versioning convention. Run the migration to add version metadata before releasing.

### Step 2 — Detect Changes Since Last Release

Gather changes since the previous release date:

1. **ADR changes**:
   - List ADRs in `adr/` with status `Accepted` and dates after the previous release date
   - List ADRs whose status changed to `Deprecated` or `Superseded by ...` since the previous release
2. **Component changes**:
   - Read every `docs/components/**/*.md` file's `**Last Updated:**` field
   - Components with `Last Updated` after the previous release date are changed
   - New components (no previous release reference) are added
3. **Section file changes**:
   - Use `git log --name-only --since="{previous-release-date}"` to find modified `docs/*.md` files
   - If no git, ask the user what sections changed

### Step 3 — Ask Bump Type

Present the detected changes to the user and ask for the bump type:

```
Changes since v{previous} (released {previous-date}):

Added:
  - New components: [list]
  - New ADRs: [list of ADR-NNN with titles]

Changed:
  - Components modified: [list]
  - Sections modified: [list]

Superseded:
  - ADR-XXX superseded by ADR-YYY

Deprecated:
  - [list]

Recommended bump: MAJOR | MINOR | PATCH
Reason: [one-line justification based on the change list]

Accept recommendation, or choose manually?
  1. MAJOR — breaking changes
  2. MINOR — new capabilities (recommended based on changes)
  3. PATCH — clarifications only
```

Wait for user response. The recommendation logic:
- Any breaking change (new system, architecture type change, core principle change, major ADR superseded) → MAJOR
- Any new component, section, integration, or accepted ADR → MINOR
- Only clarifications / typos / metric corrections → PATCH

### Step 4 — Compute New Version

Apply the bump to the current version:
- MAJOR: `X.Y.Z` → `(X+1).0.0`
- MINOR: `X.Y.Z` → `X.(Y+1).0`
- PATCH: `X.Y.Z` → `X.Y.(Z+1)`

### Step 5 — Generate CHANGELOG Entry

Prepend a new entry to `docs/CHANGELOG.md` at the top (after the header). Format:

```markdown
## [{new-version}] - YYYY-MM-DD (Released)

### Added
- [New component name] (Component v1.0.0) — [one-line description]
- ADR-NNN: [title]

### Changed
- [Component name] (v{old} → v{new}) — [one-line description, ref ADR if applicable]
- [Section name]: [one-line description]

### Deprecated
- [item] — scheduled for removal in v{next-major}

### Superseded ADRs
- ADR-NNN supersedes ADR-MMM ([reason])
```

Only include sections (Added / Changed / Deprecated / Superseded) that have items. Omit empty sections.

### Step 6 — Update Metadata Everywhere

**6.1 Update `ARCHITECTURE.md`**:
- `<!-- ARCHITECTURE_VERSION: {new-version} -->`
- `<!-- ARCHITECTURE_STATUS: Released -->`
- `<!-- ARCHITECTURE_RELEASED: {today} -->`
- `**Version**: {new-version}`
- `**Status**: Released`
- `**Released**: {today}`
- `**Supersedes**: v{previous-version}` (or `—` if this is v1.0.0 initial release)

**6.2 Update every `docs/components/**/*.md`**:
- Set `**Architecture Version:** {new-version}` (match the new arch version)
- Keep `**Component Version:**` as-is unless the component itself changed (the Component Guardian manages per-component bumps during edits)

**6.3 Verify `docs/CHANGELOG.md`** contains the new entry at the top.

### Step 7 — Git Tag (MANDATORY when repo is under git)

**7.1 Detect git**:
```bash
git rev-parse --is-inside-work-tree
```
If not a git repo, skip this step with note: `ℹ️ Not a git repo — skipping tag creation. Consider initializing git for traceability.`

**7.2 Preconditions** (refuse to tag if violated):

**Clean working tree**:
```bash
git status --porcelain
```
If output is non-empty, abort with:
> ⚠️ Working tree has uncommitted changes. Commit the release metadata first:
>   git add -A
>   git commit -m "Architecture v{new-version} — Released {today}"
> Then re-run the release workflow.

**Tag does not already exist**:
```bash
git rev-parse --verify architecture-v{new-version} 2>/dev/null
```
If it exists, abort with:
> ⚠️ Tag `architecture-v{new-version}` already exists. Bump to a different version or delete the tag manually.

**7.3 Create annotated tag**:
```bash
git tag -a architecture-v{new-version} -m "Architecture v{new-version} — Released {today}

{CHANGELOG entry body — Added / Changed / Deprecated / Superseded sections}

See docs/CHANGELOG.md for full details."
```

The tag message includes the changelog entry verbatim (without the `## [version] - date` heading line).

**7.4 Report** (do NOT push automatically):
```
✅ Created local git tag `architecture-v{new-version}` on HEAD
   Run `git push origin architecture-v{new-version}` to publish it.
```

### Step 7.5 — Archive Snapshot (git-aware)

An **immutable archive snapshot** freezes the released version as a read-only copy under `archive/v{version}/`. The behavior depends on whether the project is under git:

**If repo is NOT under git** (detected in Step 7.1):
- Archive is the **only** snapshot mechanism → **create automatically, do NOT prompt**
- This is the canonical way to preserve a point-in-time record when git history is unavailable

**If repo IS under git**:
- The git tag from Step 7 IS the primary snapshot mechanism (`git checkout architecture-v{version}` retrieves the exact baseline)
- Archive is **optional** → prompt the user:
  ```
  Also create an immutable archive snapshot at archive/v{version}/?
  (Recommended for regulated industries, audit compliance, or when consumers need a filesystem-level baseline without using git)
    1. Yes, create archive
    2. No, skip (git tag is sufficient)
  ```
- If user declines, skip to Step 8

**Snapshot procedure** (when creating archive):

1. Create directory: `archive/v{new-version}/`
2. Copy these directories/files into it (preserve structure):
   - `ARCHITECTURE.md`
   - `docs/` (entire tree including `components/`, `CHANGELOG.md`)
   - `adr/` (entire tree)
3. Write `archive/v{new-version}/RELEASE_NOTES.md` containing the CHANGELOG entry for this version verbatim (copied from `docs/CHANGELOG.md` section `## [{version}] - {date}`)
4. Write `archive/v{new-version}/.immutable` marker file with content:
   ```
   This archive is a frozen snapshot of architecture v{version} released on {date}.
   Do NOT edit files inside this directory — corrections are a new release.
   ```
5. **Do NOT copy**: `compliance-docs/`, `docs/handoffs/`, `exports/` — these are downstream artifacts that are regenerated against the archive on demand, not part of the baseline itself.

**Post-snapshot verification**:
- Verify `archive/v{new-version}/ARCHITECTURE.md` is present and has `**Status**: Released` in its header
- Verify `archive/v{new-version}/docs/CHANGELOG.md` contains the `## [{version}]` entry
- Report file count: `Archive created: archive/v{new-version}/ ({N} files, {M} KB)`

**Immutability convention**:
- Archived files MUST NOT be edited after creation. Corrections to a released version require a new PATCH release.
- Tools and skills reading from `archive/v{version}/` treat the content as read-only. This is convention, not enforcement (filesystem permissions are NOT changed).

---

### Step 8 — Report to User

```
✅ Architecture v{new-version} released

Changes since v{previous}:
  - Added: {count} components, {count} ADRs
  - Changed: {count} components, {count} sections
  - Deprecated: {count}
  - Superseded ADRs: {count}

Updated files:
  - ARCHITECTURE.md (version block + metadata)
  - docs/CHANGELOG.md (new entry)
  - {count} component files (Architecture Version updated)
  - Git tag: architecture-v{new-version} (local only — push to publish)
    [or "⚠️ Not a git repo — no tag created" if applicable]
  - Archive snapshot: archive/v{new-version}/ ({N} files)
    [present when created in Step 7.5; omitted when skipped]

⚠️ Downstream artifacts may now be stale:
  - Compliance contracts: regenerate with `/skill architecture-compliance` if needed
  - Component handoffs: regenerate with `/skill architecture-dev-handoff` if components changed
  - Traceability report: regenerate with `/skill architecture-traceability`
```

---

## Drift Detection (on every architecture-docs invocation)

When any `architecture-docs` workflow is invoked, optionally check for version drift between the doc and the git tag:

1. Read `<!-- ARCHITECTURE_VERSION: X.Y.Z -->` from `ARCHITECTURE.md`
2. Run `git tag -l 'architecture-v*' --sort=-version:refname | head -1` to get latest tag
3. Compare:

| Scenario | Message |
|----------|---------|
| Doc version > latest tag | `ℹ️ Architecture v{doc} is not tagged in git. Run the release workflow to publish a tag.` |
| Doc version < latest tag | `⚠️ Architecture tag architecture-v{tag} exists in git but the doc shows v{doc}. Possible regression — verify before committing.` |
| Doc version == latest tag | (silent — no warning) |

Drift detection is **informational only** — it does not block other workflows.

---

## Edge Cases

### First release (v1.0.0)

- `**Supersedes**` field is `—` (no previous version)
- `**Status**: Draft` → `Released`
- CHANGELOG already has an initial `## [1.0.0] - YYYY-MM-DD (Draft)` entry from Step 5.5 of the Architecture Type Selection Workflow — update it to `(Released)` and fill the date, rather than prepending a new entry
- Git tag `architecture-v1.0.0` is the first architecture-v tag in the repo

### Re-release (same version)

If the user asks to release the same version that's already Released (e.g., v1.2.0 → v1.2.0), abort:
> ⚠️ Architecture v1.2.0 is already Released ({release-date}). To make changes, bump the version first.

### Deprecating an architecture

To deprecate a released version (e.g., when starting a full rewrite):
- Set `<!-- ARCHITECTURE_STATUS: Deprecated -->`
- Keep the previous `Released` date
- Add `**Deprecation Note**: Superseded by architecture v{new}` if applicable
- No new git tag (the deprecation is a metadata change, not a new release)

---

## Implementation Notes

- **Component Version vs Architecture Version**: Architecture Version always bumps on release. Component Version is bumped separately by the architecture-component-guardian when individual components change, NOT by this workflow.
- **CHANGELOG is append-only**: Never delete or modify old entries. Corrections to old entries should be a PATCH release with a Changelog note.
- **Git tag message is the canonical release record**: The tag's annotation is a snapshot of the changelog entry at release time, preserved in git history forever.
- **No automatic push**: The workflow creates local tags only. The user is responsible for pushing with `git push origin architecture-v{version}`. This prevents accidental publication of release tags from local testing.
