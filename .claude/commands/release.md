# Release: Bump Version, Commit, and Push

Perform a version bump release for the solutions-architect-skills plugin.

## Arguments

$ARGUMENTS

If no argument is provided, default to `patch`.

## Steps

1. **Read current version** from `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `package.json`
2. **Calculate new version** using semver bump:
   - `patch` (default): 2.2.1 → 2.2.2
   - `minor`: 2.2.1 → 2.3.0
   - `major`: 2.2.1 → 3.0.0
   - Or accept an explicit version string like `2.5.0`
3. **Update README.md** (do this before touching any other file):
   - Version badge: `version-OLD_VERSION-blue` → `version-NEW_VERSION-blue`
   - Installation verification line: `v OLD_VERSION` → `v NEW_VERSION`
   - § Releases holds **one** entry: replace it with `### vNEW_VERSION (Current Release) ✅` and a short summary of this release (infer from git log / staged changes). The README never accumulates releases
   - Add `## [NEW_VERSION]` at the top of `CHANGELOG.md` (Keep a Changelog: `### Added` / `### Changed` / `### Fixed`, one line per change, plus upgrade steps when a plugin or dependency is added)
4. **Update version** in the version files (sa-skills and the plugins under `plugins/` move together, except sa-ux, which versions itself — `check:catalog` fails on drift):
   - `.claude-plugin/plugin.json`, `package.json` → `"version": "NEW_VERSION"`
   - `.claude-plugin/marketplace.json` → the `sa-skills`, `sa-records` and `sa-requirements` entries
   - `plugins/sa-records/.claude-plugin/plugin.json`, `plugins/sa-requirements/.claude-plugin/plugin.json`
   - the CI templates' pin, `SA_PLUGIN_REF: vOLD_VERSION` → `vNEW_VERSION` (`skills/architecture-lifecycle/ci/*.yml`, `plugins/sa-delivery/skills/architecture-index-export/ci/*.yml`, `plugins/sa-delivery/skills/architecture-index-export/ci/service/*.yml`): a project copies these files on an upgrade, and a stale pin there runs the old plugin
5. **Run the full check suite**: `bun run check` (typecheck, frontmatter, agent structure, validator configs, lazy-load sizes, text encoding, bundle, tests). **If it fails, STOP the release** — report the failures and fix them before any commit. Nothing ships that the check chain has not passed.
6. **Show git status** to review all pending changes (staged and unstaged)
7. **Stage all modified files** (README.md, CHANGELOG.md, the plugin.json files, marketplace.json, package.json, and any other changed files)
8. **Ask the user for a commit message** before committing. Suggest a default message based on the changes detected.
9. **Commit** with the user-approved message. Append the version tag (e.g., `v2.2.2`) to the end of the first line.
10. **Create git tag** `vNEW_VERSION` (e.g., `v2.3.2`) on the release commit.
11. **Push** to the current remote branch, including tags (`git push && git push --tags`).
12. **Report** the result: old version → new version, commit hash, tag, files changed.
