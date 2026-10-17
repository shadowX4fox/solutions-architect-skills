> Part of **Workflow 1 — Create** (`architecture-docs`), split out of `05-sections.md` (8.88.0). Read it when the run reaches **item `s5` (Section 5, the component files)** — never before, and never at a resume that does not start there. `05-sections.md` is the loop every section follows; this file is only what Section 5 adds to it.

#### Step 5 — Section 5: component files (C4)

4. **Section 5 — Create Individual Component Files (C4 Model)** (MANDATORY)

   Every component identified during architecture design MUST get its own file. Do NOT write Section 5 content into a single monolithic file. Components follow the **C4 model**: systems (L1) organize into folders, containers (L2) become component files.

   > **Automatic checkpoints** (`collect.json` → `checkpoints: auto`): 4a and 4b were confirmed at Step 4.9 and the
   > systems are in `collect.json` — do not ask again; write from them.

   **4a. C4 Level 1 — Identify and Confirm Systems**

   From the architecture discussion, identify all systems. A system is a logical group of applications and data stores, typically owned by a single development team. Present to the user for confirmation:

   ```
   🔍 C4 Level 1 — Systems Identified

   Based on the architecture discussion, I've identified these systems:

     1. [System Name] — [brief description]
     2. [System Name] — [brief description]
     3. [System Name] (external) — [provider, not owned by us]

   Internal systems (1, 2) will get component documentation.
   External systems (3) are referenced as dependencies only.

   Please confirm or adjust this list before we proceed.
   ```

   Wait for user confirmation. Adjust if needed.

   **4b. C4 Level 2 — Confirm Focus System**

   If multiple internal systems detected, ask which is the **main system of concern**:

   ```
   🔎 C4 Level 2 — Confirm Focus System

   Which system is the main focus of this architecture?
   (All systems get full documentation. The focus system is listed first and centers the C2 diagram.)

     1. [System Name] ← (main system of concern)
     2. [System Name]

   Enter the number of your main system:
   ```

   Single system → skip this prompt (it is the focus by default), but still create the system folder and system descriptor file.

   All identified internal systems get **full detailed component documentation** — same depth for every system. The focus system designation only affects:
   - Priority in the README.md index (focus system listed first)
   - Architecture diagram scope (C2 diagram centers on the focus system)

   **4c. C4 Level 2 — Identify Containers per System**

   For each system, identify all containers (C4 Level 2). Each MUST pass the **boundary test**:
   - "Can this be deployed independently?" → YES = valid container
   - "Does this run as its own process/container?" → YES = valid container
   - Code module inside a deployable → NOT a container (C3 level — document within parent)
   - External system you don't own → NOT a container (reference in integration docs)

   Classify each container as **App** or **Store**:

   | Type | C4 Category | Examples |
   |------|------------|---------|
   | API Service | App | REST API, GraphQL server, gRPC service |
   | Web Application | App | SPA, SSR frontend, admin portal |
   | Worker/Consumer | App | Message consumer, background processor, scheduler |
   | Database | Store | PostgreSQL, MongoDB, SQL Server |
   | Cache | Store | Redis, Memcached |
   | Message Broker | Store | Kafka, RabbitMQ, Azure Service Bus |
   | Object Storage | Store | S3, Azure Blob, MinIO |
   | Gateway | App | API Gateway, reverse proxy, load balancer |

   **4d. Create System Files and Component Files**

   **Multi-system only — Create C4 L1 system descriptor files first:**

   For each identified system (internal and external), create `docs/components/<system-name>.md` at the root of `docs/components/`:

   ```markdown
   [Architecture](../../ARCHITECTURE.md) > [Components](README.md) > {System Name}

   # {System Name}

   **C4 Level:** System (L1)
   **Type:** {Internal System | External System}
   **Owner:** {team or organization}
   **Containers:** {count} ({N} Apps, {M} Stores)

   ## Description

   {1-2 paragraph description of the system's business purpose and scope}

   ## Containers

   | Component | Type | Technology | Internal Name |
   |-----------|------|------------|---------------|
   | [Component Name](<system-name>/01-component.md) | {C4 type} | [{technology}] | `{internal identifier, or empty}` |

   For an **external system** — no folder, no container files — this table is the containers' only
   record: `component-cli.ts list` emits one fact per row (`file_backed: false`), so the row carries the
   canonical name, the C4 type, the technology and the **internal identifier** (the portfolio, workload or
   product id the owning team uses) in its own column. An identifier stated only in prose is not read by
   any tool. For an internal system the rows link its container files and the identifier lives in each
   file's `**Internal Name:**` row; the column may stay empty here.

   ## System Boundaries

   **Owns:** {what data/capabilities this system is responsible for}
   **Depends on:** {other systems it calls}
   **Consumed by:** {other systems that call it}

   ## Communication

   | From | To | Protocol | Description |
   |------|----|----------|-------------|
   ```

   File name = kebab-case system name (same as the folder name). ALL architectures — including single-system — create a system descriptor file and a system folder for their containers.

   **Then create C4 L2 container files:**

   For each container identified in 4c, create a component file:
   - Path: `docs/components/<system-name>/NN-<component-name>.md` (always nested in system folder)
   - `NN` = two-digit zero-padded index (01, 02, 03, ...) — resets per system folder
   - Name = lowercase kebab-case (e.g., `01-payment-api.md`, `02-payment-db.md`)
   - Breadcrumb: `[Architecture](../../../ARCHITECTURE.md) > [Components](../README.md) > [System Name](.) > <Component Name>`
   - Add `# <Component Name>` heading
   - Add C4 metadata header:
     ```
     **Type:** <C4 type from table above>
     **Technology:** [<technology with version>]
     **C4 Level:** Container (L2)
     **Deploys as:** <Docker container | serverless function | managed service | VM>
     **Communicates via:** <HTTPS | gRPC | AMQP | TCP | ...>
     **Description:** <Component Name> <what it does — one line, 120 characters at most, name included>

     **Component Version:** 1.0.0
     **Architecture Version:** 1.0.0
     **Last Updated:** <today ISO date>
     ```
   - Fill in component details using the type-specific Section 5 template (loaded in Step 3)
   - Use placeholder values (e.g., `[To be defined]`) ONLY for **non-mandatory** fields the user hasn't specified yet. **Mandatory fields with placeholders BLOCK Step 6 (ADR generation)** — see the Placeholder Elimination Gate below and `PRINCIPLE_VALIDATION.md` → Appendix A for the mandatory-field map.
   - **Description field**: mandatory; a one-line tagline that **opens with the canonical name** — the H1, verbatim and plain, never in backticks — and runs **120 characters at most, name included**. `component-cli.ts check` holds both (`description-name-prefix`, `description-too-long`, `missing-field: **Description:**`); a finding there is an edit at that line. Longer prose belongs in the **Purpose** section.
   - **Version fields**: all new components start at `Component Version: 1.0.0` with `Architecture Version` matching the parent architecture version (initially `1.0.0`). `Last Updated` = today's date in ISO format.

   **4d-VERIFY. Structural Validation (before guardian sync)**

   Before invoking the guardian, verify the C4 folder structure:
   - [ ] At least one system folder exists: `docs/components/<system-name>/`
   - [ ] Each system folder contains at least one `NN-*.md` component file
   - [ ] A system descriptor file exists for each system folder: `docs/components/<system-name>.md`
   - [ ] No component files exist at `docs/components/` root (only system descriptors and README.md belong there)

   If any check fails, go back to Step 4d and create the missing structure. Do NOT invoke the guardian on a broken layout.

   **4e. Create README.md Component Index — the guardian's code (8.90.0)**

   `docs/components/README.md` is written only by `architecture-component-guardian` — by its code, not by a
   model and not by loading the skill (its `SKILL.md` is 57 KB and stayed in the session's context for the rest of
   the 8.89.0 control run):

   ```bash
   bun [plugin_dir]/skills/architecture-component-guardian/utils/component-cli.ts readme <project_root> --write
   bun [plugin_dir]/skills/architecture-component-guardian/utils/component-cli.ts check <project_root>
   ```

   `readme` renders the whole file per the guardian's Format Specification — the managed-by line, the
   breadcrumb, `# Component Details`, one intro line, a `## <System> Components` section per internal system with
   its 5-column table (`#` as `5.N`, `Component` from the H1, `File` link, `Type`, `Technology` in brackets), the
   external systems as links to their L1 descriptors, `## Key Relationships` from docs/05's integrations and
   `## Related Documentation` from the section files' H1 — in the document language. `check` must exit 0. Never
   write or edit the README by hand.

   **4f. Verify Counts**

   Count of component files created must match count of rows in README.md table (across all system groups).

   **4g. Summary**

   Report all systems and components created:
   ```
   ✅ C4 Component Documentation Complete

   Focus System: [name]
   Systems: [count] internal, [count] external (dependencies only)

   [System Name] ([count] containers):
     - 01-component-name.md (API Service) [Spring Boot 3.2]
     - 02-component-name.md (Database) [PostgreSQL 16]
     ...
   ```

   > **HARD GATE**: Do NOT proceed to Step 5 (ARCHITECTURE.md index) until at least one component file exists in `docs/components/`. If no components were identified, ask the user to define at least the primary containers before continuing.
