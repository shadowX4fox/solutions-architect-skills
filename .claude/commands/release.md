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
3. **Update version** in both files:
   - `.claude-plugin/plugin.json` → `"version": "NEW_VERSION"`
   - `.claude-plugin/marketplace.json` → `"version": "NEW_VERSION"`
4. **Show git status** to review all pending changes (staged and unstaged)
5. **Stage all modified files** (agent files, plugin.json, marketplace.json, and any other changed files)
6. **Ask the user for a commit message** before committing. Suggest a default message based on the changes detected.
7. **Commit** with the user-approved message. Append the version tag (e.g., `v2.2.2`) to the end of the first line.
8. **Create git tag** `vNEW_VERSION` (e.g., `v2.3.2`) on the release commit.
9. **Push** to the current remote branch, including tags (`git push && git push --tags`).
10. **Report** the result: old version → new version, commit hash, tag, files changed.
