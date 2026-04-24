# Asset Guide Line-Range Index

This file maps each `asset_type` token (from the payload frontmatter `asset_types: [...]`) to a line range of `ASSET_GENERATION_GUIDE.md`. The `handoff-generator` sub-agent uses this to read ONLY the relevant portion of the 1050-line guide, cutting its context budget from ~45 KB to ~5–20 KB per asset type.

## Shared sections (always load)

Read this range regardless of which asset types are in scope — it contains the Asset Fidelity Rule, context7 policy, graceful-degradation behavior, and the asset-detection rules table. The sub-agent only reads this once even if multiple assets are generated.

| Section | Lines | Description |
|---------|-------|-------------|
| Overview + context7 + detection rules | `1-88` | Shared policies (Asset Fidelity, context7 integration, detection) |
| After Asset Generation | `1037-1050` | Post-asset completeness check |

## Per-asset-type ranges

Lookup table keyed on the payload's `asset_types` tokens. Read only the rows matching the component's types.

| asset_type token | Lines in ASSET_GENERATION_GUIDE.md | Output filename |
|------------------|-----------------------------------|-----------------|
| `openapi` | `89-183` | `openapi.yaml` |
| `ddl` | `184-268` | `ddl.sql` |
| `deployment` | `269-420` | `deployment.yaml` |
| `asyncapi` | `421-499` | `asyncapi.yaml` |
| `cronjob` | `500-587` | `cronjob.yaml` |
| `avro` | `588-668` | `schema.avsc` (Avro-specific portion of Asset 6) |
| `protobuf` | `588-738` | `schema.proto` (Protobuf portion overlaps; Avro + Protobuf share intro at 588) |
| `redis` | `739-860` | `redis-key-schema.md` |
| `c4-descriptor` | `861-1036` | `c4-descriptor.md` (EN + ES templates — select by payload `doc_language`) |

## Usage pattern (sub-agent)

```
# Load shared policies once
Read ASSET_GENERATION_GUIDE.md offset=0 limit=88

# For each asset_type in payload frontmatter
for type in asset_types:
  lookup (start, end) from the table above
  Read ASSET_GENERATION_GUIDE.md offset=(start-1) limit=(end - start + 1)

# Load post-generation check
Read ASSET_GENERATION_GUIDE.md offset=1036 limit=14
```

## Maintenance note

If `ASSET_GENERATION_GUIDE.md` is edited, update the line ranges in this file. A hard-pinned line map is faster than runtime grep and keeps the sub-agent's tool calls deterministic. Run:

```
grep -n "^## Asset\|^## After Asset" skills/architecture-dev-handoff/ASSET_GENERATION_GUIDE.md
```

to re-derive the section start lines when the guide changes. The end line of section N is (start of section N+1) − 1; for the last asset (`c4-descriptor`), the end is the line before `## After Asset Generation`.
