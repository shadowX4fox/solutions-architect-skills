# Release: Bump Version, Commit, and Push

Perform a version bump release for the solutions-architect-skills plugin.

## Arguments

`$ARGUMENTS`

Two positional slots (order-insensitive):

- **Bump**: `patch` (default) · `minor` · `major` · an explicit version string like `3.11.0`
- **Mode**: `--pr` (default, explicit) · `--direct` (opt out to direct push)

Examples:

- `/release` → patch bump, opens PR (new default)
- `/release minor` → minor bump, opens PR
- `/release 4.0.0` → explicit version, opens PR
- `/release --direct` → patch bump, pushes directly to the current branch (old behavior)
- `/release minor --direct` → minor bump, pushes directly

**Default mode is now `--pr`.** The previous direct-to-main behavior is opt-in via `--direct`. This lets GitHub Actions, required status checks, or any other CI/CD configured on the repo gate the release before it lands on `main`.

## Steps (both modes)

1. **Read current version** from `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `package.json`. Confirm all three agree; abort with a clear error if they drift.
2. **Calculate new version** using semver bump:
   - `patch` (default): 3.10.1 → 3.10.2
   - `minor`: 3.10.1 → 3.11.0
   - `major`: 3.10.1 → 4.0.0
   - Explicit version string: use as-is, but validate it is strictly greater than the current version.
3. **Preflight checks**:
   - Working tree must be clean (`git status --porcelain` empty). Abort otherwise.
   - Current branch must be `main`. If on another branch, abort (direct mode) or prompt to rebase onto `main` (PR mode).
   - In PR mode: `gh` CLI must be installed and authenticated; run `gh auth status` and fail early if not. The remote branch `release/v<NEW_VERSION>` must not already exist — check with `git ls-remote --exit-code --heads origin release/v<NEW_VERSION>` and abort if it does.
4. **Update README.md** (do this before touching any other file):
   - Version badge: `version-OLD_VERSION-blue` → `version-NEW_VERSION-blue`
   - Installation verification line: `v OLD_VERSION` → `v NEW_VERSION`
   - Add a new roadmap entry `### vNEW_VERSION (Current Release) ✅` summarizing the changes in this release (infer from git log since the last tag, or from the currently staged diff if called mid-flow).
   - Mark the previous current release entry as `(Previous Release)`.
5. **Update version** in all three version files:
   - `.claude-plugin/plugin.json` → `"version": "NEW_VERSION"`
   - `.claude-plugin/marketplace.json` → `"version": "NEW_VERSION"`
   - `package.json` → `"version": "NEW_VERSION"`
6. **Show `git status`** so the user can review everything that will land in this release.
7. **Stage** all modified files (README.md, plugin.json, marketplace.json, package.json, plus any other files the user touched as part of this release).
8. **Ask the user for a commit message.** Suggest a default inferred from the staged diff. The message will be appended with `v<NEW_VERSION>` on the first line automatically — do not have the user type it twice.

## Steps (PR mode, default) — steps 9 onward

9. **Create the release branch** off the current `HEAD`:
   ```bash
   git checkout -b release/v<NEW_VERSION>
   ```
10. **Commit** on the branch with the user-approved message (subject line suffixed with ` v<NEW_VERSION>`).
11. **Tag** the commit: `git tag v<NEW_VERSION>`. The tag lives on the release branch. If the PR is later squash-merged, the tag sits on the pre-squash commit (still fetchable, still valid as a release marker — if this matters to you, move the tag to the merge commit after `gh pr merge`).
12. **Push** branch and tag in one shot:
    ```bash
    git push -u origin release/v<NEW_VERSION>
    git push origin v<NEW_VERSION>
    ```
13. **Open the PR** with `gh pr create`:
    - **Title**: the commit subject without the trailing `v<NEW_VERSION>` (GitHub will show the tag inline).
    - **Body**: the new roadmap entry body, verbatim, plus a short "Pre-merge checklist" (CI green; manual smoke on new behavior if applicable; tag will move to merge commit if squash-merged — optional).
    - **Base**: `main`. **Head**: `release/v<NEW_VERSION>`.
    ```bash
    gh pr create --base main --head release/v<NEW_VERSION> \
      --title "<commit subject without version suffix>" \
      --body "<roadmap entry + checklist>"
    ```
    Use a HEREDOC for the body to preserve formatting.
14. **Report** — old version → new version, commit hash, tag, branch name, PR URL. Remind the user:
    - CI will run automatically on the PR (if configured).
    - Merge with `gh pr merge --squash` (or UI) once checks pass.
    - After merge: the tag already exists on the release-branch commit; no further tagging needed unless they want the tag on the squash/merge commit (they can `git tag -f v<NEW_VERSION> <merge-sha> && git push --force origin v<NEW_VERSION>`).

## Steps (`--direct` mode) — steps 9 onward

9. **Commit** on the current branch with the user-approved message (subject suffixed with ` v<NEW_VERSION>`).
10. **Tag**: `git tag v<NEW_VERSION>`.
11. **Push** current branch and tags: `git push && git push --tags`.
12. **Report** — old version → new version, commit hash, tag, files changed.

## Notes

- **Why PR is the new default**: the plugin repo is adding CI/CD validation. Releases land on `main` via PRs so GitHub Actions, required reviewers, or status checks can gate them. For local experiments or emergency hotfixes where the PR overhead isn't worth it, pass `--direct`.
- **Never skip hooks** — this command never uses `--no-verify`, `--no-gpg-sign`, or other bypass flags. If a hook fails, surface the error and stop.
- **Idempotency**: if the command is aborted after the version files are edited but before commit, the unstaged changes remain on disk. Re-running `/release` will detect the dirty working tree in the preflight check and abort; the user must either commit/revert manually or run `git restore .` to reset before retrying.
- **Required tools**: `git`, `gh` (PR mode only), `bun` (for any pre-release typecheck the user wants to run manually — the command does not invoke build/test automatically).