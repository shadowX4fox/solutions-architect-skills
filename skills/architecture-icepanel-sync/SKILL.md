---
name: architecture-icepanel-sync
description: >
  (Beta) Sync architecture documentation to IcePanel for C4 model visualization.
  Extracts C4 elements from architecture docs, generates IcePanel import YAML,
  checks IcePanel API for existing objects, and imports new objects or reports drift.
triggers:
  - sync to icepanel
  - icepanel sync
  - icepanel
  - update icepanel
  - icepanel import
  - check icepanel
  - icepanel drift
  - icepanel status
  - generate icepanel yaml
  - export for icepanel
---

# IcePanel Sync Skill (Beta)

Syncs architecture documentation to IcePanel by extracting C4 model elements, generating import YAML, and optionally pushing via the IcePanel REST API.

> **Two modes**: Online (API key present — check, import, drift detect) or Offline (no API key — generate YAML for manual import).

> **Output directory**: `icepanel-sync/` at project root. Always produces `c4-model.yaml` and `sync-report.md`.

---

## Workflow Detection

Detect which workflow the user wants based on their request:

| User Intent | Workflow | Requires API Key |
|-------------|----------|-----------------|
| "sync to icepanel", "icepanel import", "update icepanel" | **Full Sync** (Phase 0 → 1 → 2 → 3) | Optional (offline fallback) |
| "icepanel drift", "check icepanel", "icepanel status" | **Drift Report Only** (Phase 0 → 2 only) | Yes — stop if missing |
| "generate icepanel yaml", "export for icepanel" | **YAML Export Only** (Phase 0 → 1 only) | No |

**Drift Report Only** skips YAML generation and import — it queries IcePanel's current state, compares against architecture docs, and produces `icepanel-sync/drift-report.md`. This is useful for periodic checks without modifying IcePanel.

**YAML Export Only** skips all API interaction — just extracts and generates the import file.

> **Fidelity rule**: All data in the generated YAML comes from architecture docs. Never invent names, descriptions, technologies, or connections not present in the source files.

---

## Phase 0 — Resolve Environment

### Step 0.1 — Resolve Plugin Directory

**Step A — Glob (dev/local mode)**:

Glob for: `**/{sa-skills,solutions-architect-skills}/skills/architecture-icepanel-sync/ICEPANEL_IMPORT_REFERENCE.md`

The brace expansion matches both marketplace installs (`sa-skills/` in `~/.claude/plugins/cache/...`) and local dev clones (historical repo folder `solutions-architect-skills/`). If found, strip `/skills/architecture-icepanel-sync/ICEPANEL_IMPORT_REFERENCE.md` from the result to get `plugin_dir`.

**Step B — Marketplace fallback**:

If Glob returns nothing, run:

```bash
plugin_dir=$(bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/skills/architecture-compliance/utils/resolve-plugin-dir.ts)
```

If both steps fail, stop and report:
```
Cannot locate plugin directory. Ensure the plugin is installed correctly.
```

### Step 0.2 — Load Reference

Read `$plugin_dir/skills/architecture-icepanel-sync/ICEPANEL_IMPORT_REFERENCE.md` — this contains the YAML schema, type mapping, ID rules, and tag conventions. Keep these rules in context for the entire workflow.

### Step 0.3 — Check Prerequisites

Read these files (stop if any required file is missing):

| File | Required | Purpose |
|------|----------|---------|
| `docs/03-architecture-layers.md` | Yes | C4 diagrams (L1 Context + L2 Container) |
| `docs/components/README.md` | Yes | Component index (Type, Technology) |
| `docs/01-system-overview.md` | No | System name and description enrichment |
| `docs/05-integration-points.md` | No | Connection protocol enrichment |

If `docs/03-architecture-layers.md` is missing:
```
docs/03-architecture-layers.md not found.
Generate architecture documentation first with /skill architecture-docs.
```

If `docs/components/README.md` is missing:
```
docs/components/README.md not found.
Create component index first with /skill architecture-component-guardian sync.
```

### Step 0.4 — Detect Sync Mode

Check for IcePanel configuration:

1. Check environment variables: `ICEPANEL_API_KEY` and `ICEPANEL_LANDSCAPE_ID`
2. If not in env, check for `.env` file at project root — look for these two variables

**If both variables found** → Online mode. Confirm with user:
```
IcePanel API credentials detected. Running in online mode — will check existing objects and import/report drift.
Landscape ID: {ICEPANEL_LANDSCAPE_ID}
```

**If either variable is missing** → Offline mode. Inform user:
```
No IcePanel API credentials found. Running in offline mode — will generate import YAML only.
To enable online sync, set ICEPANEL_API_KEY and ICEPANEL_LANDSCAPE_ID in your environment or .env file.
```

### Step 0.5 — Create Output Directory

```bash
mkdir -p icepanel-sync
```

---

## Phase 1 — Extract C4 Model & Generate Import YAML

### Step 1.1 — Parse C4 Diagrams

Read `docs/03-architecture-layers.md` and extract all Mermaid C4 diagram blocks.

**Extract from `C4Context` blocks:**

Find code fences containing `C4Context`. For each element:

- `Person(id, "name", "description")` → Record as person (used for report only — not imported as model object)
- `Person_Ext(id, "name", "description")` → Record as external person
- `System(id, "name", "description")` → Record as internal system
- `System_Ext(id, "name", "description")` → Record as external system
- `Rel(from, to, "description", "protocol")` → Record as connection

**Extract from `C4Container` blocks:**

Find code fences containing `C4Container`. For each element:

- `Container_Boundary(id, "name")` → Record the system boundary ID and name
- `Container(id, "name", "technology", "description")` → Record as app container
- `ContainerDb(id, "name", "technology", "description")` → Record as store container
- `ContainerQueue(id, "name", "technology", "description")` → Record as store container (subtype: message-broker)
- `Rel(from, to, "description", "protocol")` → Record as connection (merge with L1 connections, deduplicate)

**Skip**: `%%{init: ...}%%` theme directives, `title` lines, comment lines starting with `%%`.

### Step 1.2 — Enrich from Component Index

Read `docs/components/README.md` and parse the 5-column table(s).

For each row `| # | Component | File | Type | Technology |`:
- Match `Component` name to a container extracted in Step 1.1 (fuzzy match on name)
- Enrich the container with:
  - **Type** → map to C4 type tag (one of 8 canonical types)
  - **Technology** → extract each `[Tech Version]` entry as a technology tag

If the README uses grouped tables with `### System Name` headers, preserve the system grouping to validate parentId assignments.

### Step 1.3 — Enrich from Integration Points (optional)

If `docs/05-integration-points.md` exists, read the integration tables.

For each integration entry, find the matching connection from Step 1.1 and enrich:
- Protocol details → more specific connection name
- Direction (Sync/Async) → connection direction hint
- Auth method → add as tag if relevant

### Step 1.4 — Validate Extracted Model

Run these checks before generating YAML. Collect all findings.

**FAIL checks (block generation):**
- No C4 diagrams found in `docs/03-architecture-layers.md`
- Zero systems extracted
- Zero containers extracted

**WARN checks (generate but report):**
- `Rel()` references an element ID not found in any `Person()`, `System()`, or `Container()` declaration
- A component in `docs/components/README.md` has no matching container in C4 diagrams
- A container has empty technology field
- Duplicate element IDs detected

If any FAIL check triggers, stop and report:
```
Validation failed — cannot generate import YAML:
- {list of FAIL findings}

Fix the architecture documentation and retry.
```

If only WARN checks trigger, continue but include warnings in the sync report.

### Step 1.5 — Generate Import YAML

Build the `LandscapeImportData` YAML following the reference document rules.

**ID generation**: Use the Mermaid element ID as-is if it's already kebab-case. Otherwise convert: lowercase, replace spaces/underscores with hyphens, strip special characters.

**Build order:**

1. **tagGroups** — always create `technology` and `c4-type` groups
2. **tags** — one tag per unique technology + one tag per unique C4 type found
3. **modelObjects** — systems first (parentId: null), then containers (parentId: system-id)
   - Internal systems: `type: system`
   - External systems: `type: system`, tagged with `external`
   - App containers: `type: app`
   - Store containers (DB + Queue): `type: store`
4. **modelConnections** — one per unique `Rel()`, deduplicated

**Assign tagIds**: Each modelObject gets tagIds referencing its technology tags + its C4 type tag.

**Write** the YAML to `icepanel-sync/c4-model.yaml` with the schema comment at the top:
```yaml
# yaml-language-server: $schema=https://api.icepanel.io/v1/schemas/LandscapeImportData
namespace: architecture-docs
```

Report to user:
```
Generated icepanel-sync/c4-model.yaml
- {N} systems ({M} external)
- {N} containers ({M} apps, {M} stores)
- {N} connections
- {N} tags ({M} technology, {M} type)
```

**If offline mode** → skip to Phase 3 (Report).

---

## Phase 2 — Check IcePanel (Online Mode Only)

### Step 2.1 — Fetch Existing Objects

Query the IcePanel API:

```bash
# Fetch model objects
curl -s "https://api.icepanel.io/v1/model/objects" \
  -H "Authorization: ApiKey ${ICEPANEL_API_KEY}" \
  > /tmp/icepanel-objects.json

# Fetch model connections
curl -s "https://api.icepanel.io/v1/model/connections" \
  -H "Authorization: ApiKey ${ICEPANEL_API_KEY}" \
  > /tmp/icepanel-connections.json
```

If either request fails (non-200 status), report the error and fall back to offline mode:
```
IcePanel API request failed (HTTP {status}). Falling back to offline mode.
The import YAML has been generated at icepanel-sync/c4-model.yaml — import it manually.
```

### Step 2.2 — Compare Models

Compare the extracted model (Phase 1) against the IcePanel state:

**For each extracted system/container:**
- Search IcePanel objects by name (case-insensitive match)
- If found → mark as `SYNCED` (check for attribute drift: name, type, tags)
- If not found → mark as `NEW` (needs import)

**For each IcePanel object (in the `architecture-docs` namespace):**
- If no matching element in extracted model → mark as `STALE` (exists in IcePanel but not in docs)

**For each extracted connection:**
- Search IcePanel connections by originId + targetId
- If found → mark as `SYNCED` (check name/protocol drift)
- If not found → mark as `NEW`

**For each IcePanel connection (in namespace):**
- If no match in extracted model → mark as `STALE`

### Step 2.3 — Present Diff Summary

Show the user a summary:

```
IcePanel Sync Status:
  Objects:  {N} synced, {N} new, {N} stale, {N} drifted
  Connections: {N} synced, {N} new, {N} stale, {N} drifted

New (will be imported):
  - {object name} ({type})
  ...

Stale (in IcePanel but not in docs):
  - {object name} ({type})
  ...

Drifted (attribute mismatch):
  - {object name}: {field} differs (docs: "{value}" vs IcePanel: "{value}")
  ...
```

**If there are NEW objects**, ask user:
```
Import {N} new objects and {N} new connections to IcePanel?
```

**If everything is synced** with no drift:
```
IcePanel is in sync with architecture documentation. No changes needed.
```

---

## Phase 3 — Sync or Report

### Step 3.1 — Import New Objects (Online Mode, if user approves)

If user approves the import:

```bash
# Import the YAML
IMPORT_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "https://api.icepanel.io/v1/landscapes/${ICEPANEL_LANDSCAPE_ID}/import" \
  -H "Authorization: ApiKey ${ICEPANEL_API_KEY}" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @icepanel-sync/c4-model.yaml)
```

Parse the response. If the import returns an `importId`, check status:

```bash
curl -s "https://api.icepanel.io/v1/landscapes/${ICEPANEL_LANDSCAPE_ID}/import/${IMPORT_ID}" \
  -H "Authorization: ApiKey ${ICEPANEL_API_KEY}"
```

Report result:
```
Import successful. {N} objects and {N} connections added to IcePanel.
Note: Diagrams are not auto-created. Create C4 L1 and L2 diagram views manually in IcePanel.
```

If import fails, report the error and note the YAML file is available for manual import.

### Step 3.2 — Generate Sync Report

Write `icepanel-sync/sync-report.md`:

```markdown
# IcePanel Sync Report

**Generated**: {YYYY-MM-DD HH:MM}
**Mode**: Online | Offline
**Landscape ID**: {id} (or "N/A — offline mode")

## Model Summary

| Element | Count |
|---------|-------|
| Internal Systems | {N} |
| External Systems | {N} |
| App Containers | {N} |
| Store Containers | {N} |
| Connections | {N} |
| Technology Tags | {N} |
| C4 Type Tags | {N} |

## Validation Results

| Check | Status | Details |
|-------|--------|---------|
| C4 diagrams present | PASS/FAIL | ... |
| All Rel() endpoints declared | PASS/WARN | ... |
| Components match containers | PASS/WARN | ... |
| No empty technology fields | PASS/WARN | ... |
| No duplicate IDs | PASS/WARN | ... |

## Sync Status (online mode only)

| Category | Synced | New | Stale | Drifted |
|----------|--------|-----|-------|---------|
| Objects | {N} | {N} | {N} | {N} |
| Connections | {N} | {N} | {N} | {N} |

### New Objects (imported)
- ...

### Stale Objects (in IcePanel, not in docs)
- ...

### Attribute Drift
- ...

## Import File

The generated YAML import file is at: `icepanel-sync/c4-model.yaml`

To import manually:
1. Open your IcePanel landscape
2. Go to workspace settings → Import Model
3. Upload `c4-model.yaml`
4. Review and confirm

> Diagrams are not auto-created by import. After importing, create C4 L1 (System Context) and C4 L2 (Container) diagram views in IcePanel manually.
```

### Step 3.3 — Final Summary

Report to user:

**Offline mode:**
```
IcePanel sync complete (offline mode).
  - icepanel-sync/c4-model.yaml — import this file into IcePanel
  - icepanel-sync/sync-report.md — validation results and model summary

To enable online sync, set ICEPANEL_API_KEY and ICEPANEL_LANDSCAPE_ID.
```

**Online mode:**
```
IcePanel sync complete.
  - {N} objects imported / {N} already synced / {N} stale / {N} drifted
  - icepanel-sync/c4-model.yaml — generated import file
  - icepanel-sync/sync-report.md — full sync report

Remember: create diagram views manually in IcePanel after import.
```

---

## Workflow: Drift Report Only

> Triggered by: "icepanel drift", "check icepanel", "icepanel status"
>
> This workflow queries IcePanel and compares against architecture docs **without generating import YAML or modifying IcePanel**. Use it for periodic health checks.

### Step D.0 — Resolve Environment

Run Phase 0 (Steps 0.1–0.5). **API key is required** — if missing, stop:

```
Drift report requires IcePanel API access.
Set ICEPANEL_API_KEY and ICEPANEL_LANDSCAPE_ID in your environment or .env file.
```

### Step D.1 — Extract Model from Docs

Run Phase 1 Steps 1.1–1.4 (parse C4 diagrams, enrich from component index and integration points, validate). **Skip Step 1.5** — do not generate YAML.

### Step D.2 — Fetch IcePanel State

Run Phase 2 Step 2.1 — fetch objects and connections from IcePanel API.

### Step D.3 — Compare and Generate Drift Report

Run Phase 2 Step 2.2 (compare models). Then write `icepanel-sync/drift-report.md`:

```markdown
# IcePanel Drift Report

**Generated**: {YYYY-MM-DD HH:MM}
**Landscape ID**: {ICEPANEL_LANDSCAPE_ID}

## Summary

| Category | Synced | Docs Only | IcePanel Only | Drifted |
|----------|--------|-----------|---------------|---------|
| Objects | {N} | {N} | {N} | {N} |
| Connections | {N} | {N} | {N} | {N} |

**Status**: {IN SYNC | DRIFT DETECTED}

## Docs Only (in architecture docs, missing from IcePanel)

| Element | Type | Source |
|---------|------|--------|
| {name} | {system/app/store} | docs/03-architecture-layers.md |
| ... | ... | ... |

**Action**: Run `/skill architecture-icepanel-sync` to import these into IcePanel.

## IcePanel Only (in IcePanel, missing from architecture docs)

| Element | Type | IcePanel ID |
|---------|------|-------------|
| {name} | {system/app/store} | {id} |
| ... | ... | ... |

**Action**: Either add these to architecture docs or remove from IcePanel if stale.

## Attribute Drift (present in both, values differ)

| Element | Field | Docs Value | IcePanel Value |
|---------|-------|-----------|----------------|
| {name} | {name/type/technology} | {docs value} | {icepanel value} |
| ... | ... | ... | ... |

**Action**: Decide which source is authoritative and update the other.

## Connections Drift

### New (in docs, not in IcePanel)
| From | To | Protocol |
|------|-----|----------|
| {origin} | {target} | {protocol} |

### Stale (in IcePanel, not in docs)
| From | To | Protocol | IcePanel ID |
|------|-----|----------|-------------|
| {origin} | {target} | {protocol} | {id} |

### Drifted (protocol/label mismatch)
| From | To | Docs Protocol | IcePanel Protocol |
|------|-----|--------------|-------------------|
| {origin} | {target} | {docs} | {icepanel} |
```

### Step D.4 — Report

```
Drift report generated: icepanel-sync/drift-report.md
  Objects:  {N} synced, {N} docs-only, {N} icepanel-only, {N} drifted
  Connections: {N} synced, {N} docs-only, {N} icepanel-only, {N} drifted

Status: {IN SYNC | DRIFT DETECTED — review drift-report.md for details}
```

Do NOT offer to import or modify IcePanel — this workflow is read-only.

---

## Workflow: YAML Export Only

> Triggered by: "generate icepanel yaml", "export for icepanel"
>
> Generates the import YAML without any API interaction. Useful when you just need the file.

Run Phase 0 (Steps 0.1–0.3, skip 0.4 API detection) → Phase 1 (all steps). Write `c4-model.yaml` and a minimal `sync-report.md` with validation results only (no sync status section).
