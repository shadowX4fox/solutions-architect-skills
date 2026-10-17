# Technology Context Enrichment (context7) — Component Documentation

> Loaded by `ARCHITECTURE_TYPE_SELECTION_WORKFLOW.md` Step 5 when writing `docs/components/**` files and context7 is configured. Advisory only.

When creating NEW component documentation (Workflow 1, Section 5), and the component's **Technology** field references specific frameworks, libraries, or tools, use the context7 MCP tool to fetch current documentation for those technologies.

**Prerequisite**: The context7 MCP tool must be available (`resolve-library-id` and `get-library-docs` functions). If not available, skip silently — component doc generation proceeds normally.

**When to use**:
- During Workflow 1 (new ARCHITECTURE.md creation) when populating Section 5 component files
- When a user explicitly asks to "enrich" or "validate" technology references in an existing component doc
- NOT during routine section edits, NOT during compliance generation, NOT during handoff generation

**Procedure**:
1. Extract technology names from the component's Technology field (e.g., "Java 17, Spring Boot 3.1.5, PostgreSQL 15").
2. For each distinct technology, call `resolve-library-id` (e.g., `spring-boot`, `postgresql`, `nestjs`).
3. For each resolved library, call `get-library-docs` with a topic hint scoped to configuration patterns and version features for the documented version (e.g., "Spring Boot 3.1 actuator endpoints and configuration properties").
4. Present a **Technology Context Brief** to the user as an advisory checklist — do NOT auto-fill any document fields:

   ```
   Technology Context Brief — [Component Name]

   Spring Boot 3.1.5:
   - Key config patterns: application.yml (spring.datasource.*, management.endpoints.*)
   - Health check endpoints: /actuator/health (liveness), /actuator/health/readiness
   - Suggested fields to document: connection pool settings, JPA dialect, security filter chain

   PostgreSQL 15:
   - Notable in v15: MERGE statement, improved JSON path, pg_walinspect
   - Suggested fields to document: connection pool strategy (PgBouncer?), vacuum/autovacuum, extensions used
   ```

5. The architect decides which items to include in the component doc. The skill does NOT auto-populate any fields from this brief.

**What this is NOT**:
- Not a replacement for the architect's knowledge or documentation decisions
- Not auto-filled content (the "no invention" policy still applies)
- Not blocking — generation proceeds with or without it
