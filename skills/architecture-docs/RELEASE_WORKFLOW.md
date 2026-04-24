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

## Release Channels

Releases publish through one of two channels. Pick at invocation time via argument; the workflow detects the argument in Step 6.5.

| Channel | When to use | How to invoke |
|---------|-------------|---------------|
| **PR (default)** | Normal releases — let CI, required reviewers, and branch-protection rules gate the release before it lands on `main`. | `release my architecture` (no flag); or `/release-architecture`; or any trigger phrase without `--direct`. |
| **Direct** | Local-only repos, emergency hotfixes, or workflows with no PR review layer. | Append `--direct`: `release my architecture --direct`; or `/release-architecture --direct`. |

In **PR mode** the workflow itself creates a `release/architecture-v{version}` branch, commits the metadata edits on it, tags the commit, pushes branch and tag, and prints host-agnostic instructions for opening the pull request. The user never needs to commit manually. Tag timing is **before-PR** — the tag lives on the release-branch commit, so downstream consumers can fetch `architecture-v{version}` as soon as the branch is pushed (the PR gates what lands on `main`, not the tag). If the PR is later squash-merged, the tag stays on the pre-squash commit; Step 8 reports the one-liner to move it onto the merge commit if desired.

In **Direct mode** the workflow preserves the classic flow: Step 7 preconditions require a clean working tree (the user commits the metadata changes themselves between Step 6 and Step 7), then the tag is created on `HEAD` and pushed.

**Recovery (Step 1.5)** runs in direct mode regardless of channel choice — it tags an already-committed release that lacks a tag, so no PR is needed.

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

### Step 1.5 — Tag/Version Sync Check (Recovery Path)

**Run when**: Step 1 detected `<!-- ARCHITECTURE_STATUS: Released -->` AND the repo is under git (`git rev-parse --is-inside-work-tree` succeeds).
**Skip when**: Status is `Draft` (no tag is expected yet) or the repo is not under git.

This step detects the most common release-failure mode: the architecture doc was bumped and committed, but the `architecture-v{version}` tag was never created (or never pushed) — leaving the project in a "claims released, not actually published" state. Without this check, the Re-release edge case below would abort the workflow with a misleading "already released" message.

**1.5a — Check local tag presence**:

```bash
git rev-parse --verify architecture-v{current-version} 2>/dev/null
```

**1.5b — Check remote tag presence** (only if a remote named `origin` exists):

```bash
git ls-remote --tags origin "refs/tags/architecture-v{current-version}" 2>/dev/null
```

**1.5c — Classify and route**:

| Local tag | Remote tag | Action |
|-----------|-----------|--------|
| Present | Present (or no remote) | Sync OK → continue to Step 2 (normal flow — user is releasing a NEW version on top of current) |
| Present | Missing | **Push-only recovery** → execute Step 1.5f directly (push existing local tag). Skip Steps 2–7, skip 7.5 (archive). |
| Missing | Present | Fetch the tag locally (`git fetch origin tag architecture-v{current-version}`) → then continue to Step 2 (normal flow) |
| Missing | Missing | **Tag-and-push recovery** → confirm with user (1.5d), then create annotated tag (1.5e) and push (1.5f). Skip Steps 2–6, skip 7.5 (archive — already produced on the original release attempt or was deliberately skipped). |

**1.5d — Recovery confirmation prompt** (only for "Tag-and-push recovery" — Missing/Missing case):

```
⚠️  Architecture v{current-version} is marked Released in ARCHITECTURE.md (released {released-date}),
    but the git tag `architecture-v{current-version}` is missing locally and on origin.

    This usually means a previous release run created the commit and metadata
    but the tag step did not complete (clean-tree precondition failed, push failed,
    or the workflow was interrupted).

    HEAD commit: {short-sha} — {commit-subject}
    {if HEAD subject does not match a release commit for this version, add:
     "⚠️  HEAD does not appear to be the v{current-version} release commit.
      The tag will be created at HEAD (current state). If you want the tag on
      a different commit, abort and run `git tag` manually."}

    Recovery will:
      1. Create annotated tag `architecture-v{current-version}` at HEAD
      2. Push the tag to origin
      3. NOT modify any files, NOT bump version, NOT generate changelog

    Proceed?
      1. Yes — recover and push (recommended)
      2. Abort — I'll fix this manually
```

For "Push-only recovery" (Present/Missing case), proceed without prompting and emit:

```
ℹ️  Local tag `architecture-v{current-version}` exists but is not on origin.
    Pushing now…
```

**1.5e — Create annotated tag** (Tag-and-push recovery only):

Reconstruct the tag message from `docs/CHANGELOG.md` if a `## [{current-version}] - ...` entry exists; otherwise use a generic recovery message:

```bash
git tag -a architecture-v{current-version} -m "Architecture v{current-version} — Released {released-date}

{CHANGELOG body for [{current-version}], if available}

(Tag created via Workflow 10 recovery on {today}; original release commit metadata preserved in {short-sha}.)"
```

**1.5f — Push the tag (mandatory in recovery mode)**:

Recovery mode is incomplete without publishing. Confirm a remote named `origin` exists:

```bash
git remote get-url origin 2>/dev/null
```

**If a remote exists**, push:

```bash
git push origin architecture-v{current-version}
```

Possible outcomes:

- **Push succeeds** → emit:
  ```
  ✅ Pushed `architecture-v{current-version}` → origin
  ```

- **Push fails** (network, auth, non-fast-forward, etc.) — retry up to twice, then escalate:
  ```
  ⚠️  Push of `architecture-v{current-version}` to origin failed:
      {error message}

      Recovery is incomplete — the tag exists locally but is not on origin.
      Diagnose the failure (auth, network, branch protection rules), then run:
        git push origin architecture-v{current-version}

      Do NOT delete the local tag — it is the only copy of the recovered baseline.
  ```
  Do NOT proceed to Step 8 with a "success" report when push has failed. Surface the failure clearly so the user knows publication is pending.

**If no remote is configured** (local-only repo) — recovery still completes locally, but emit a prominent warning:
```
⚠️  No `origin` remote configured. Local tag `architecture-v{current-version}` created
    but cannot be published. Configure a remote and run:
      git push origin architecture-v{current-version}
    This must be done before downstream consumers can pull the architecture baseline.
```

**1.5g — Recovery exit**: After 1.5f completes (push succeeded, push failed, or no-remote), skip directly to Step 8 (Report) with a recovery-specific report:

```
{✅ if push succeeded, ⚠️ if push failed/no-remote} Architecture v{current-version} tag recovery {complete | partial}

Recovered:
  - Git tag: architecture-v{current-version} on {short-sha}
    [push status: pushed to origin | local only — push failed/pending | local only — no remote]

No version bump performed (recovery mode — doc was already at v{current-version} Released).
```

**Important**: Recovery mode does NOT bump the version, does NOT modify any files, does NOT generate a CHANGELOG entry, does NOT update component metadata. It only creates and publishes the missing tag.

---

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

### Step 6.5 — Detect Release Channel

Parse the original invocation arguments to select the channel:

- If the arguments contain the token `--direct` → `{release_channel} = direct`.
- Else → `{release_channel} = pr` (default).

`--pr` is accepted as an explicit no-op (same as omitting it). Any other token is passed through untouched — do not guess.

**Fallback when no remote is configured**: if `{release_channel} = pr` but `git remote get-url origin` fails (local-only repo), override silently to `direct` and emit:

```
ℹ️  No `origin` remote configured — falling back to direct mode (PR mode requires a remote).
```

The variable `{release_channel}` drives the routing in Step 7 (and determines whether Step 7.5 runs before or after branching).

### Step 7.5 — Archive Snapshot (git-aware)

**Runs before Step 7 in both channels.** In PR mode the archive directory lands in the release-branch commit so reviewers see the frozen snapshot; in direct mode the archive is created alongside the other uncommitted metadata edits and is staged with them by the user.

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
- If user declines, continue to Step 7.

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
5. **Do NOT copy**: `compliance-docs/`, `handoffs/`, `exports/` — these are downstream artifacts that are regenerated against the archive on demand, not part of the baseline itself.

**Post-snapshot verification**:
- Verify `archive/v{new-version}/ARCHITECTURE.md` is present and has `**Status**: Released` in its header
- Verify `archive/v{new-version}/docs/CHANGELOG.md` contains the `## [{version}]` entry
- Report file count: `Archive created: archive/v{new-version}/ ({N} files, {M} KB)`

**Immutability convention**:
- Archived files MUST NOT be edited after creation. Corrections to a released version require a new PATCH release.
- Tools and skills reading from `archive/v{version}/` treat the content as read-only. This is convention, not enforcement (filesystem permissions are NOT changed).

---

### Step 7 — Git Tag (MANDATORY when repo is under git)

Route on `{release_channel}` from Step 6.5:

- `direct` → **Step 7 (Direct mode)** below.
- `pr` → **Step 7 (PR mode)** below.

---

### Step 7 (Direct mode) — Git Tag on HEAD

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
>
> Alternative: re-run with `--pr` (or omit `--direct`) to have the workflow branch, commit, tag, and push for you on `release/architecture-v{new-version}` — no manual commit needed.

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

**7.4 Push the tag to origin**:

Confirm a remote named `origin` exists:
```bash
git remote get-url origin 2>/dev/null
```

If a remote exists, push the tag:
```bash
git push origin architecture-v{new-version}
```

Report:
```
✅ Created and pushed git tag `architecture-v{new-version}` → origin
```

**If no remote is configured** (e.g., local-only repo), skip the push and report:
```
✅ Created local git tag `architecture-v{new-version}` on HEAD
   No `origin` remote configured — tag exists locally only. Configure a remote
   and run `git push origin architecture-v{new-version}` when ready.
```

**If the push fails** (network error, auth failure, non-fast-forward, etc.):
```
⚠️  Created local git tag `architecture-v{new-version}` on HEAD, but push to origin failed:
    {error message}
    Resolve the issue and run `git push origin architecture-v{new-version}` manually.
```
Do NOT delete the local tag on push failure — the release is still valid locally and can be published later.

---

### Step 7 (PR mode) — Release Branch, Commit, Tag, and PR Instructions

**7-PR.1 Detect git and remote**:
```bash
git rev-parse --is-inside-work-tree
git remote get-url origin 2>/dev/null
```

Both must succeed. If either fails, follow the Step 6.5 fallback (override to direct mode with the `ℹ️` message) — the workflow does NOT reach this point when that fallback fires.

**7-PR.2 Verify target branch does not exist on origin**:
```bash
git ls-remote --exit-code --heads origin "release/architecture-v{new-version}"
```

If the command succeeds (exit 0, branch present), abort:
> ⚠️ Remote branch `release/architecture-v{new-version}` already exists on origin. Either delete it (`git push origin --delete release/architecture-v{new-version}`) or bump to a different version.

**7-PR.3 Create the release branch** off the user's current branch:
```bash
git checkout -b release/architecture-v{new-version}
```

The user's originating branch (typically `main`) is remembered implicitly — it is the merge target of the PR.

**7-PR.4 Stage release artifacts**:
```bash
git add ARCHITECTURE.md docs/CHANGELOG.md docs/components/
```

Plus `git add archive/v{new-version}/` if Step 7.5 created an archive.

Use explicit paths — never `git add -A` — so unrelated dirty files in the working tree are not included. If the user had uncommitted work in-flight elsewhere, it stays on the feature branch.

**7-PR.5 Commit** with the standard release message:
```bash
git commit -m "Architecture v{new-version} — Released {today}

{CHANGELOG body for [{new-version}], verbatim, without the heading line}

See docs/CHANGELOG.md for the full entry."
```

Never `--amend`, never `--no-verify`. If a pre-commit hook fails, surface the error and stop — do NOT retry with bypass flags.

**7-PR.6 Create annotated tag** (same message format as direct Step 7.3):
```bash
git tag -a architecture-v{new-version} -m "Architecture v{new-version} — Released {today}

{CHANGELOG entry body — Added / Changed / Deprecated / Superseded sections}

See docs/CHANGELOG.md for full details."
```

**7-PR.7 Push branch and tag** — in this order:
```bash
git push -u origin release/architecture-v{new-version}
git push origin architecture-v{new-version}
```

Retry the tag push up to twice on transient failure (matches Step 1.5f semantics). If either push fails definitively:
```
⚠️  PR-mode release incomplete: {branch or tag} push failed:
    {error message}

    Branch: release/architecture-v{new-version}  [pushed: yes|no]
    Tag:    architecture-v{new-version}          [pushed: yes|no]

    Diagnose the failure (auth, network, branch protection, non-fast-forward),
    then re-push manually:
      git push -u origin release/architecture-v{new-version}
      git push origin architecture-v{new-version}

    Do NOT delete the local branch or tag — they are the only copy of the release.
```

Do NOT proceed to Step 8 with a "success" report when either push has failed.

**7-PR.8 Print PR instructions** — detect origin host and emit appropriate guidance.

Read origin URL: `git remote get-url origin`.

If the URL matches a GitHub pattern (`github.com[:/]<owner>/<repo>(\.git)?`), extract `{owner}` and `{repo}` and emit:

```
✅ Release branch and tag pushed

Branch: release/architecture-v{new-version}  →  origin
Tag:    architecture-v{new-version}           →  origin

Open the pull request:
  https://github.com/{owner}/{repo}/compare/main...release/architecture-v{new-version}?expand=1

Suggested PR title:
  Architecture v{new-version} — Released {today}

Suggested PR body: copy the CHANGELOG entry (without the `## [version] - date` heading line)
from docs/CHANGELOG.md, or use the tag annotation as-is:
  git show architecture-v{new-version}

The tag is already pushed and independent of the PR merge. Downstream consumers
can fetch it immediately. The PR gates what lands on `main`.
```

For any other origin URL (GitLab, Bitbucket, Azure DevOps, self-hosted, SSH-only, etc.) emit the generic variant:

```
✅ Release branch and tag pushed

Branch: release/architecture-v{new-version}  →  origin
Tag:    architecture-v{new-version}           →  origin
Origin: {origin-url}

Open a pull request (or merge request) from `release/architecture-v{new-version}`
into your default branch via your git host's web UI. Use this as the PR body:

  git show architecture-v{new-version}

The tag is already pushed and independent of the PR merge. Downstream consumers
can fetch it immediately. The PR gates what lands on your default branch.
```

Detection is best-effort. If URL parsing is ambiguous (e.g., a GitHub Enterprise URL or a custom SSH host), fall through to the generic variant rather than guessing — the user can always see the origin URL printed in the block.

---

### Step 8 — Report to User

The report shape depends on the channel selected in Step 6.5.

**Step 8 (Direct mode)**:

```
✅ Architecture v{new-version} released (direct mode)

Changes since v{previous}:
  - Added: {count} components, {count} ADRs
  - Changed: {count} components, {count} sections
  - Deprecated: {count}
  - Superseded ADRs: {count}

Updated files:
  - ARCHITECTURE.md (version block + metadata)
  - docs/CHANGELOG.md (new entry)
  - {count} component files (Architecture Version updated)
  - Git tag: architecture-v{new-version} (pushed to origin | local only — no remote)
    [or "⚠️ Not a git repo — no tag created" if applicable]
  - Archive snapshot: archive/v{new-version}/ ({N} files)
    [present when created in Step 7.5; omitted when skipped]

⚠️ Downstream artifacts may now be stale:
  - Compliance contracts: regenerate with `/skill architecture-compliance` if needed
  - Component handoffs: regenerate with `/skill architecture-dev-handoff` if components changed
  - Traceability report: regenerate with `/skill architecture-traceability`
```

**Step 8 (PR mode)** — appended after the Step 7-PR.8 instructions block:

```
Architecture v{new-version} — release branch ready for review

Changes since v{previous}:
  - Added: {count} components, {count} ADRs
  - Changed: {count} components, {count} sections
  - Deprecated: {count}
  - Superseded ADRs: {count}

Release artifacts (committed on release/architecture-v{new-version}):
  - ARCHITECTURE.md (version block + metadata)
  - docs/CHANGELOG.md (new entry)
  - {count} component files (Architecture Version updated)
  - Archive snapshot: archive/v{new-version}/ ({N} files)
    [present when created in Step 7.5; omitted when skipped]

Published to origin:
  - Branch: release/architecture-v{new-version}
  - Tag:    architecture-v{new-version}

After the PR is merged:
  - The tag already exists on the release-branch commit and does NOT move automatically.
  - If your team prefers the tag on the merge commit (e.g., squash-merge history),
    move it manually after merge:
      git checkout main && git pull
      git tag -f architecture-v{new-version} HEAD
      git push --force origin architecture-v{new-version}
    Otherwise leave the tag where it is — it is still fetchable and semantically valid.

⚠️ Downstream artifacts may now be stale (regenerate after the PR merges):
  - Compliance contracts: `/skill architecture-compliance`
  - Component handoffs: `/skill architecture-dev-handoff`
  - Traceability report: `/skill architecture-traceability`
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

Step 1.5 (Tag/Version Sync Check) runs before this edge case is reached. If Step 1.5 detected a missing tag (locally, on origin, or both), the recovery path is taken — see Step 1.5. The Re-release abort below does NOT apply during recovery.

If Step 1.5 confirmed the tag is present locally and on origin (or no remote is configured) — meaning the architecture is genuinely fully published — and the user explicitly requests to re-release the same version (e.g., v1.2.0 → v1.2.0), abort:
> ⚠️ Architecture v1.2.0 is already Released ({release-date}) and `architecture-v1.2.0` is published. To make changes, bump the version first.

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
- **Push behavior by channel**:
  - **Direct mode** (Step 7): the workflow pushes the tag to `origin` automatically in Step 7.4. Local-only if no remote is configured.
  - **PR mode** (Step 7-PR): the workflow pushes both the release branch and the tag automatically in Step 7-PR.7. PR mode requires a remote — Step 6.5 falls back to direct mode if `origin` is not configured.
  - In both channels, tag push is a definite step — failure surfaces an error and stops the workflow. The workflow never silently swallows a push failure.
- **Standard git only**: PR mode uses `git push` + host-detection to print PR instructions. It does NOT depend on `gh`, `glab`, or any other host-specific CLI. If detection misclassifies a URL (GitHub Enterprise, custom SSH host), the generic variant is safe to follow on any web UI.
