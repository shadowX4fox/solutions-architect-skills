---
description: Release architecture version (architecture-docs Workflow 10 — Draft→Released, CHANGELOG, architecture-v{version} git tag)
---

Invoke the `sa-skills:architecture-docs` skill with args `release my architecture`.

The skill's Workflow 10 (`RELEASE_WORKFLOW.md`) is the single authoritative handler for the Draft → Released lifecycle, CHANGELOG generation, per-component Architecture Version updates, the annotated `architecture-v{version}` git tag, and the optional `archive/v{version}/` snapshot.

Do NOT plan, explore, or ask clarifying questions before invoking. Workflow 10 handles detection and routing itself:
- Step 1 reads the current version from `ARCHITECTURE.md` metadata.
- Step 1.5 checks tag sync (local + origin) and runs a recovery path if the tag is missing.
- Step 2 detects changes since the last release (ADRs, components, section files).
- Step 3 presents the change list and asks for the bump type.
- Steps 4–8 compute the new version, update metadata, create the tag, and report.

If the working tree has uncommitted changes, Step 7.2 aborts with a clear instruction to commit the release metadata first. If the doc is already at `Released` with no new changes, the Re-release edge case aborts with "already released — bump version first".
