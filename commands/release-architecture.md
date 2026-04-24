---
description: Release architecture version (architecture-docs Workflow 10 — Draft→Released, CHANGELOG, architecture-v{version} git tag; PR by default, --direct opts out)
---

Invoke the `sa-skills:architecture-docs` skill, passing through any arguments as `release my architecture $ARGUMENTS`. Supported arguments flow into Workflow 10's channel detection (Step 6.5):

- `/release-architecture` → PR mode (default). Workflow creates `release/architecture-v{version}` branch, commits metadata, tags, pushes branch + tag, and prints host-agnostic PR instructions.
- `/release-architecture --direct` → direct mode. User commits metadata to their current branch, workflow tags `HEAD`.
- `/release-architecture --pr` → explicit PR mode (same as default; accepted as no-op).

The skill's Workflow 10 (`RELEASE_WORKFLOW.md`) is the single authoritative handler for the Draft → Released lifecycle, CHANGELOG generation, per-component Architecture Version updates, the annotated `architecture-v{version}` git tag, the optional `archive/v{version}/` snapshot, and (in PR mode) the release-branch commit + PR instructions.

Do NOT plan, explore, or ask clarifying questions before invoking. Workflow 10 handles detection and routing itself:
- Step 1 reads the current version from `ARCHITECTURE.md` metadata.
- Step 1.5 checks tag sync (local + origin) and runs a recovery path if the tag is missing (recovery is always direct mode).
- Step 2 detects changes since the last release (ADRs, components, section files).
- Step 3 presents the change list and asks for the bump type.
- Steps 4–6 compute the new version and update metadata.
- Step 6.5 detects the release channel (`--direct` vs default PR).
- Step 7.5 creates the optional archive snapshot (before branching in PR mode, so reviewers see the frozen snapshot).
- Step 7 (Direct) requires a clean tree and tags `HEAD`. Step 7 (PR) branches, commits, tags, and pushes.
- Step 8 reports, with a PR-specific variant when the PR channel was used.

If the working tree has uncommitted changes in direct mode, Step 7.2 aborts with instructions to commit first OR switch to PR mode by omitting `--direct`. If `origin` is not configured and PR mode was requested, Step 6.5 silently falls back to direct mode. If the doc is already at `Released` with no new changes, the Re-release edge case aborts with "already released — bump version first".
