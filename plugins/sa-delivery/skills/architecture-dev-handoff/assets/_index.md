# Asset Type → Output Filename

Maps each `asset_type` token (from the payload frontmatter `asset_types: [...]`) to the file the
`handoff-asset-generator` writes. The generation rules for every type live in
`ASSET_GENERATION_GUIDE.md`, which is bundled into the agent's system prompt by
`tools/bundle-handoff-agent.ts` — the agent reads neither file at runtime.

| asset_type token | Output filename |
|------------------|-----------------|
| `openapi` | `openapi.yaml` |
| `ddl` | `ddl.sql` |
| `graphql-sdl` | `schema.graphql` |
| `asyncapi` | `asyncapi.yaml` |
| `avro` | `<RecordName>.avsc` — one file per message, in the asset directory |
| `protobuf` | `schema.proto` |
| `redis` | `redis-key-schema.md` |
| `c4-descriptor` | `c4-descriptor.md` — rendered by `scripts/c4-descriptor.js`; never an agent task |
