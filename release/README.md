# Release Directory

Build output for the Solutions Architect Skills plugin. `scripts/build-release.sh` writes the
ZIP and its SHA256 checksum here.

The build artifacts themselves are **not** committed — only this README and any checksum a past
release left behind. Nothing in this directory is a source of truth for the current version:
that is `.claude-plugin/plugin.json`, which the build script reads.

## Building

```bash
bash scripts/build-release.sh
```

The script derives `VERSION` from `.claude-plugin/plugin.json` and writes:

- `solutions-architect-skills-v${VERSION}.zip` — distribution package
- `solutions-architect-skills-v${VERSION}.sha256` — checksum for verification

Before packaging it runs the full gate set — required files and directories, the Ekonte bundle
sync check, unit tests, skill frontmatter, agent structure, validator/config coverage, the
Lazy-Load Contract line counts, and typecheck — then asserts that `agents/`, `commands/`,
`hooks/`, `tools/docgen/` and `.claude-plugin/plugin.json` are actually present in the built
artifact.

## Verification

```bash
VERSION=$(grep -m1 '"version"' .claude-plugin/plugin.json | sed -E 's/.*"([^"]+)".*/\1/')
sha256sum -c "release/solutions-architect-skills-v${VERSION}.sha256"
```

Expected output:

```
./release/solutions-architect-skills-v${VERSION}.zip: OK
```

## Installation from a package

```bash
unzip solutions-architect-skills-v${VERSION}.zip
mv solutions-architect-skills ~/.claude/plugins/
# Restart Claude Code
```

## GitHub release checklist

- [ ] `bash scripts/build-release.sh` completes clean
- [ ] Create Git tag `v${VERSION}` (plugin releases; architecture-doc releases use `architecture-v*`)
- [ ] Release title: `Solutions Architect Skills v${VERSION}`
- [ ] Description: the matching `## [${VERSION}]` section of `CHANGELOG.md`
- [ ] Upload the `.zip` and the `.sha256`
- [ ] Mark as "Latest release" and publish

Download URL after publishing:

```
https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v${VERSION}/solutions-architect-skills-v${VERSION}.zip
```
