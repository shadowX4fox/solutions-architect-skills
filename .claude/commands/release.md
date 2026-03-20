# Release: Bump Version, Commit, and Push

Perform a version bump release for the solutions-architect-skills plugin.

## Arguments

$ARGUMENTS

If no argument is provided, default to `patch`.

## Steps

1. **Read current version** from both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
2. **Calculate new version** using semver bump:
   - `patch` (default): 2.2.1 → 2.2.2
   - `minor`: 2.2.1 → 2.3.0
   - `major`: 2.2.1 → 3.0.0
   - Or accept an explicit version string like `2.5.0`
3. **Update README.md** (do this before touching any other file):
   - Version badge: `version-OLD_VERSION-blue` → `version-NEW_VERSION-blue`
   - Installation verification line: `v OLD_VERSION` → `v NEW_VERSION`
   - Add a new roadmap entry `### vNEW_VERSION (Current Release) ✅` summarizing the changes in this release (infer from git log / staged changes)
   - Mark the previous current release entry as `(Previous Release)`
4. **Update version** in both plugin files:
   - `.claude-plugin/plugin.json` → `"version": "NEW_VERSION"`
   - `.claude-plugin/marketplace.json` → `"version": "NEW_VERSION"`
5. **Show git status** to review all pending changes (staged and unstaged)
6. **Stage all modified files** (README.md, plugin.json, marketplace.json, and any other changed files)
7. **Ask the user for a commit message** before committing. Suggest a default message based on the changes detected.
8. **Commit** with the user-approved message. Append the version tag (e.g., `v2.2.2`) to the end of the first line.
9. **Create git tag** `vNEW_VERSION` (e.g., `v2.3.2`) on the release commit.
10. **Push** to the current remote branch, including tags (`git push && git push --tags`).
11. **Report** the result: old version → new version, commit hash, tag, files changed.
