# Contributing

Pull requests are welcome. Questions, ideas and show-and-tell go to
[Discussions](https://github.com/shadowX4fox/solutions-architect-skills/discussions); bugs go to
[Issues](https://github.com/shadowX4fox/solutions-architect-skills/issues).

## Setup

```bash
bun install          # root + tools/docgen
bun run check        # typecheck, structure checks, the whole test suite — must pass before a PR
```

Runtime is [Bun](https://bun.sh) only.

## Rules a change is held to

- **Generic by construction.** The plugin documents any architecture, in any industry and organization. A defect seen in one
  project is fixed as a rule about every architecture, never as a special case for that project.
- **Synthetic examples and fixtures.** Tests and examples invent their components (`Order Desk`, `Hub API`); they never reuse
  names, ids or text from a real organization's architecture.
- **Organization-specific material belongs in an institution pack, not here** — a design language standard, a licensed
  reference model, brand skins, compliance questions, internal forms (`docs/INSTITUTION_PACKS.md`). The base never names a pack.
- **Deterministic work is code.** Anything that can be computed — a payload, a gate, a count, a check — is a script with
  tests; the skills' Markdown instructs the model only for judgement.
- **Third-party content** comes with its licence and attribution (`NOTICE`), pinned to the version bundled.

`CLAUDE.md` carries the maintainer's full conventions (commits, versioning, the per-skill contracts).

## Commits

Scoped Conventional Commits — `<type>(<scope>): <description>`, `!` for a breaking change.
