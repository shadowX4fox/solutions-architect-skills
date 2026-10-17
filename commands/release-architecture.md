---
description: Release the architecture version (architecture-lifecycle — gates, change list since the last tag, one bump question, CHANGELOG, architecture-v{version} git tag; PR by default, --direct opts out)
---

Invoke the `sa-skills:architecture-lifecycle` skill with `release my architecture $ARGUMENTS`, and follow its § Release.

- `/release-architecture` → PR mode (default): `release/architecture-v{version}` branch, commit, tag, both pushed, compare link printed.
- `/release-architecture --direct` → commit and tag on the current branch.

Do NOT plan, explore, or ask clarifying questions before invoking: `lifecycle.js plan` detects the state, runs the gates and computes the change list; the skill asks one question, the bump. A release needs a git repository.
