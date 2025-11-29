# Release Directory

This directory contains the distributable release packages for the Solutions Architect Skills plugin.

## Current Release

**Version:** 1.0.0
**Release Date:** 2025-01-20
**Package Size:** 249 KB

### Files

- `solutions-architect-skills-v1.0.0.zip` - Main distribution package
- `solutions-architect-skills-v1.0.0.sha256` - SHA256 checksum for verification

## Verification

Verify package integrity before installation:

```bash
sha256sum -c solutions-architect-skills-v1.0.0.sha256
```

Expected output:
```
solutions-architect-skills-v1.0.0.zip: OK
```

## Installation

```bash
# Extract the package
unzip solutions-architect-skills-v1.0.0.zip

# Move to Claude Code plugins directory
mv solutions-architect-skills ~/.claude/plugins/

# Restart Claude Code
```

## GitHub Release Checklist

When creating a GitHub release:

- [ ] Create Git tag: `v1.0.0`
- [ ] Release title: "Solutions Architect Skills v1.0.0"
- [ ] Description: Copy from `RELEASE_NOTES_v1.0.0.md`
- [ ] Upload `solutions-architect-skills-v1.0.0.zip`
- [ ] Upload `solutions-architect-skills-v1.0.0.sha256`
- [ ] Mark as "Latest release"
- [ ] Publish release

## Download URL (After GitHub Release)

```
https://github.com/shadowx4fox/solutions-architect-skills/releases/download/v1.0.0/solutions-architect-skills-v1.0.0.zip
```

## Build Script

To rebuild the package, run:

```bash
../scripts/build-release.sh
```

This will regenerate the ZIP and SHA256 files in this directory.