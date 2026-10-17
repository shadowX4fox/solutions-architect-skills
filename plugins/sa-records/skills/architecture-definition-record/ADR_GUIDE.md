# Architecture Decision Records (ADR) Guide

> A comprehensive guide for creating and managing Architecture Decision Records

## Purpose

This guide provides a structured approach to documenting architectural decisions using ADRs (Architecture Decision Records). ADRs help teams track why certain architectural choices were made, providing context for future decisions and team members.

**Use this guide when:**
- Making significant architectural decisions
- Selecting technologies or frameworks
- Choosing architectural patterns
- Making security or compliance decisions
- Planning major refactoring efforts

---

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision along with its context and consequences.

**Key Characteristics:**
- **Immutable**: Once accepted, ADRs are not modified (new ADRs supersede old ones)
- **Numbered**: Sequential numbering for easy reference
- **Version Controlled**: Stored in Git with the codebase
- **Concise**: Focused on the decision, not implementation details

---

## ADR Scope

Every ADR carries a **Scope** field that determines which number range it occupies:

| Scope | Number Range | Who Authors It | Coverage |
|-------|-------------|----------------|----------|
| **Institutional** | 001–100 | Architecture Team | Organization-wide; applies to all projects |
| **User / Project** | 101+ | Project team | Local to a single project/product |

**Institutional ADRs** capture organization-wide standards that are reused across projects — mandatory security baselines (e.g., mTLS for all internal traffic), approved cloud regions, logging standards, required authentication protocols. They are owned by the Architecture Team and approved through a formal governance process. Numbers 001–100 are reserved exclusively for this scope.

**User / Project ADRs** capture decisions local to one product — chosen database engine, preferred message broker, caching strategy, API style. Numbers 101 and above are used for this scope.

> **Why encode scope in the number?**
> The number range is the fastest human signal. An architect reading a citation like `per [ADR-005]` immediately knows it is an org-wide standard, while `per [ADR-143]` is project-local — without opening the file.

---

## ADR ID Format Rules

Every ADR ID must match the canonical pattern **`ADR-NNN`** where `NNN` is:

- A 3+ digit decimal integer
- Zero-padded for values 001–999 (e.g., `ADR-007`, `ADR-099`, `ADR-101`)
- Unpadded for values ≥ 1000 (e.g., `ADR-1024`)

**Regex** (enforced by the ADR ID Format Gate in `SKILL.md`):

```
^ADR-\d{3,}$
```

**Why so strict** — the number range is the entire scope signal (001–100 institutional, 101+ project). Any embellishment (phase tag, version tag, variant letter) defeats that convention and forces every downstream reader to re-parse the ID. Phase / version information, when relevant at all, lives in the **Context** or **Decision** body of the ADR — never in the ID. In particular, project-phase tracking is **not** encoded in the ID: the 101+ range already says "this is a project decision".

### Invalid examples (rejected by the Format Gate)

| Invalid ID | Why rejected | Use instead |
|-----------|--------------|-------------|
| `ADR-P1-001` | Phase prefix in ID | `ADR-101` (project-scope number already signals "project") |
| `ADR-P2-002` | Phase prefix in ID | `ADR-102` |
| `ADR-Phase1-001` | Spelled-out phase prefix | `ADR-101` |
| `ADR-001-P1` | Phase suffix in ID | `ADR-001` (no phase needed) |
| `ADR-101-v2` | Version suffix | Supersede via Workflow 4 → next sequential ID |
| `ADR-101a` | Variant letter | Supersede or split into two ADRs |
| `ADR-1` | Not zero-padded | `ADR-001` |
| `adr-101` | Lowercase prefix | `ADR-101` |
| `ADR101` | Missing hyphen | `ADR-101` |

### Filename pattern

`adr/ADR-NNN-{slug}.md` — slug is lowercase kebab-case, max 50 chars, no special characters. Full filename regex:

```
^adr/ADR-\d{3,}-[a-z0-9][a-z0-9-]*\.md$
```

---

## Institutional ADR Content Discipline

Institutional ADRs (001–100) are organization-wide standards reused across **all** projects. To stay reusable, they MUST be project-agnostic.

### Open with Scope only

Every institutional ADR opens with exactly:

```
**Scope**: Institutional
```

No "Institutional Inheritance Note" header, no project tag, no parent-project metadata.

### What an Institutional ADR MUST NOT contain

| Forbidden pattern | Use instead |
|-------------------|-------------|
| "Institutional Inheritance Note" header tying the ADR to a specific project | (omit entirely) |
| "Section 3 — Project Application" table | (omit entirely) |
| "Project Application — \<Feature\>" subsections | (omit entirely) |
| Specific component names (e.g., Inbox Hub, Alert Feed Builder, omn-mfa, omn-bs, sda-msa-payments-gateway, bmo-msa-gk-action-balance) | "platform", "service team", "the workload namespace", "platform-specific component" |
| Specific operator / carrier / brand names (e.g., Claro, Movistar, Tuenti, CNT) | Generic phrasing — "the operator", "the partner", or omit |
| Specific feature names (e.g., "Recargas y Combos", specific topic names) | Generic capability description |
| Project budget figures (e.g., "$276,411 budget") | "platform delivery budget" or omit |
| Project deadlines (e.g., "MVP deadline of June 30, 2026") | "platform delivery timelines" or omit |
| Project user counts (e.g., "7M mobile users / 300K web users") | "the bank's customer base", "millions of customers" |
| Cross-references to project ADRs (ADR-101+) | Cross-reference only other institutional ADRs (ADR-001..100) |

### Why this matters

Institutional ADRs are inherited by every project. If ADR-005 says "applies to omn-mfa", every team that doesn't run omn-mfa has to mentally translate the rule — and translation drift creates compliance gaps. Generic phrasing keeps the standard reusable verbatim.

### When project specifics belong in an ADR

If a decision is genuinely project-local — bound to a specific component, operator, budget, or deadline — it is a **User/Project ADR** (ADR-101+), not an institutional one. Move it to the project range and write project-specific content freely there.

---

## Institutional Catalog Lifecycle

Institutional ADRs are not authored in a project. They are published by the Architecture Team in a **git repository** — the catalog — and every project holds a *copy* of one language edition under `adr/`, imported by `SKILL.md` Workflow 6 and kept current by Workflow 9. The catalog repository itself is maintained with this skill in **catalog mode** (`workflows/catalog-mode.md`): there an accepted ADR is amended in place.

### Amend or supersede — never delete

A published institutional decision changes in exactly two ways:

| Change | How the catalog expresses it | What a consuming project does |
|---|---|---|
| **Amendment** | The same `ADR-NNN` file is edited — Context, Decision or Consequences change; the id and the citations to it survive | Passages that restate the decision are rewritten; `per [ADR-NNN]` citations stay |
| **Supersede** | The old file's status becomes `Superseded by [ADR-new]`; a new file `ADR-new` opens with `**Related**: Supersedes [ADR-NNN]` | Every `per [ADR-NNN]` citation migrates to `[ADR-new]`, and derived facts follow the new Decision |

A status change alone (`Accepted → Deprecated`) is an amendment of the header only. Deleting a file is not a sanctioned change; a project that finds one marks its citations `withdrawn from catalog` and raises it with the Architecture Team rather than deleting the copy.

### The copy is read-only

Nothing in `adr/ADR-001..100` is edited in a project. The sync records the SHA-256 of every imported file in `adr/.institutional-catalog.json` (the **pin**) and blocks the next sync on any file whose hash moved — a local edit forks the standard, and the fork is invisible until an auditor compares two projects. Project-specific consequences of an institutional decision belong in a project ADR (101+) that cites it.

### The pin

`adr/.institutional-catalog.json` is committed with `adr/`. It carries:

- `remote`, `ref` — the git URL and branch/tag the catalog is pulled from. **This is the only place the URL lives.** To point a project at a different catalog, tell the skill ("change the ADR catalog URL to …") or edit `remote` directly; the next sync re-clones from the new remote.
- `edition` — `en` (catalog root) or `es` (the `es/` subdirectory). Chosen once from `DOC_LANGUAGE` at first import; a project never mixes editions.
- `commit` — the catalog commit the copy reflects. The next sync is a diff from this commit, not a guess.
- `files`, `coverage_map` — the hash of every imported file as written, for drift detection.

The clone itself sits at `.cache/sa-skills/adr-catalog/` — gitignored, disposable, recreated from the pin at any time.

### One coverage map per edition

`COVERAGE_MAP.json` (derived by a compliance plugin, when the organization installs one) is derived against one edition's text and lives beside that edition's ADRs — `<root>/COVERAGE_MAP.json` for `en`, `<root>/es/COVERAGE_MAP.json` for `es`. A project imports the map of the edition it holds and no other. Ratification stamps travel with the map; the project never adds them.

---

## Title and Problem Statement Length Constraints

Every ADR — Institutional or User/Project — must satisfy two length rules. Both are enforced in `SKILL.md` Workflow 1 Step 1.5 (generation from `ARCHITECTURE.md`) and Workflow 2 Step 2.4 (interactive create); a violation BLOCKS the write until the field is shortened.

### Rule 1 — Title ≤ 50 characters

The text after `# ADR-NNN: ` must be **50 characters or fewer**.

| | Title text | Length | Verdict |
|---|---|---|---|
| ✅ Pass | `Dynatrace as Mandatory Observability Platform` | 45 | OK |
| ✅ Pass | `PostgreSQL as Primary Relational Datastore` | 42 | OK |
| ❌ Fail | `Adopt Dynatrace SaaS as the Mandatory Observability Platform for All Production Workloads` | 90 | exceeds 50 |
| ❌ Fail | `Use PostgreSQL 15 as the System-of-Record Relational Database for Customer-Facing Services` | 92 | exceeds 50 |

Why 50: titles appear in tables, navigation indexes, breadcrumbs, and the architecture-explorer manifest. Anything longer wraps unpredictably and forces every consumer to truncate.

**Detection** (the workflow gate runs this):

```bash
# Extract the title text (after `# ADR-NNN: `) from the first H1, count its characters.
title_text=$(head -1 adr/ADR-006-dynatrace.md | sed -E 's/^# ADR-[0-9]+:[[:space:]]+//')
title_len=${#title_text}
if [ "$title_len" -gt 50 ]; then
  echo "FAIL: title is $title_len chars (>50): $title_text"
fi
```

If the title exceeds 50 chars, **revise** — drop weak words ("the", "for", "as", "all"), prefer single concrete nouns, abbreviate qualifiers. Do NOT truncate mid-word.

### Rule 2 — Problem Statement ≤ 200 characters

The body of the `### Problem Statement` subsection (the prose between the heading and the next `###` heading or blank-line break) must be **200 characters or fewer**, including spaces and punctuation but excluding the heading itself and any HTML comments.

The compose-then-compress approach: internally answer the four scaffolding questions (what problem? who's impacted? cost of inaction? current state and why insufficient?), then write a single tight sentence (or two short ones) ≤ 200 chars. The four questions themselves are *prompts for thinking*, not the final ADR content.

| | Problem Statement text | Length | Verdict |
|---|---|---|---|
| ✅ Pass | `Production incidents take 30+ min to triage because telemetry is fragmented across three vendor tools and engineers cannot correlate traces with logs.` | 149 | OK |
| ✅ Pass | `Read latency at p99 exceeds the 200ms SLO under peak load; the current single-region Postgres replica cannot keep up with cross-region read fan-out.` | 147 | OK |
| ❌ Fail | A bulleted list of four questions copied from the template. | varies, often 250-400 | exceeds 200 |
| ❌ Fail | A multi-paragraph problem narrative. | 400+ | exceeds 200 |

Why 200: ADRs are read by humans under decision pressure. A 200-char problem statement forces the author to crystallize the issue; a 600-word one buries it.

**Detection** (the workflow gate runs this):

```bash
# Extract the Problem Statement body (between "### Problem Statement" and the next "###" or blank-line section break),
# strip HTML comments, count characters.
awk '/^### Problem Statement/{flag=1; next} /^### |^---/{flag=0} flag' adr/ADR-006-dynatrace.md \
  | sed -E 's/<!--[^>]*-->//g' \
  | tr -d '\n' \
  | awk '{ gsub(/^[[:space:]]+|[[:space:]]+$/, ""); print length }'
# Compare the result to 200.
```

If the Problem Statement exceeds 200 chars, **compress** — pick the most load-bearing sentence, drop background that belongs in `Context`, and move requirements to `### Requirements`. The four-question scaffolding stays in your draft notes.

### Why both rules are blocking

A long title or problem statement is not a stylistic preference — it's a signal that the decision has not yet been crystallized. ADRs are bound contracts; an author who cannot state the title in 50 characters or the problem in 200 has not yet decided what they're deciding. Forcing the constraint at write-time produces sharper ADRs.

### Sentinels and waivers

There is no waiver mechanism. If a decision genuinely cannot fit the constraint, split it into multiple ADRs (one per sub-decision) — that's almost always the better answer.

## Decision Body and Amendment Log

An ADR states the decision **in force**. The decision body — every section but `## Review History`
and `## Notes` — reads as if written today: no "desde la enmienda…", "ya no…", "originally…", no
struck-through text, no inline `Amended:` paragraphs.

- **The amendment log is `## Review History`**, one row per amendment, one line each: date, reviewer,
  `Amended` / `Superseded` / …, and what changed in one sentence with the ADR or section it touches.
  The history lives there and only there.
- **Amending rewrites the body in place** to the new state and adds the row. Readers who need the old
  wording read git or the log, not the decision.
- **Budgets, per section** (project ADRs, 101+) — what one decision needs when its argument lives once:

  | Section | Words | Section | Words |
  |---|---|---|---|
  | Context | 250 | Alternatives Considered | 250 (≤ 3, one table) |
  | Decision | 500 | References | 150 |
  | Rationale | 250 | Notes | 100 |
  | Consequences | 300 | **Body total** (log and Notes excluded) | **1,500** |
  | Review History row | one line, ≤ 30 words + date, author, status | | |

  The reference corpus ran 4,500 words an ADR (median Decision 1,266, Consequences 662, Rationale 589):
  amendment narration, and arguments restated from other ADRs. `docs-stats.js` and
  `prose-check.js --scope records` report them — BLOCKING once the project carries `PROSE_STYLE: v1`. The
  fix is Workflow 10 (Compact ADRs): narration to one log row each, a restated argument to a link, never a
  decision dropped.

Institutional ADRs (001–100) are read-only copies and are never measured or rewritten here.

---

## ADR Template

The template is `adr/ADR-000-template.md` — the one copy; every workflow loads it (SKILL.md § Canonical Template
Rule). Its shapes are the budget in practice: Primary Drivers one line each, Consequences one bullet per
consequence (a Negative one carries its **Severity** and **Mitigation** inline), Alternatives one table row each
(≤ 3), Review History one row per amendment.

---

## Managing ADRs in Architecture Documentation

### Linking ADRs in Your Architecture Document

In your main architecture documentation (ARCHITECTURE.md), include a simple reference section:

```markdown
## Architecture Decision Records

Key architectural decisions are documented in separate ADR files following the [ADR Guide](ADR_GUIDE.md).

### Active ADRs

| ID | Title | Status | Date | Impact |
|----|-------|--------|------|--------|
| [ADR-001](adr/ADR-001-technology-stack.md) | Technology Stack Selection | Accepted | 2024-01-15 | High |
| [ADR-002](adr/ADR-002-database-choice.md) | Database Choice | Accepted | 2024-01-20 | High |
| [ADR-003](adr/ADR-003-api-protocol.md) | API Protocol | Accepted | 2024-02-01 | Medium |

### ADR Index by Category

**Infrastructure**:
- ADR-001: Kubernetes for orchestration
- ADR-005: Multi-region deployment strategy

**Data Layer**:
- ADR-002: PostgreSQL as primary database
- ADR-006: Redis for caching

**API Design**:
- ADR-003: gRPC for inter-service communication
- ADR-007: REST for public APIs

**Security**:
- ADR-004: OAuth 2.0 for authentication
- ADR-008: mTLS for service-to-service communication
```

---

## Creating New ADRs

### When to Create an ADR

Create an ADR for decisions that:
- **Technology Selection**: Choosing databases, frameworks, languages
- **Architectural Patterns**: Microservices vs monolith, event-driven architecture
- **Major Refactoring**: Significant changes to system structure
- **Security/Compliance**: Authentication methods, data encryption approaches
- **Scalability Approaches**: Caching strategies, database sharding
- **Integration Choices**: Third-party services, APIs, message brokers

### Automatic ADR Generation

When creating a new ARCHITECTURE.md using the architecture-docs skill, you will be prompted to automatically generate ADR files from the Section 12 table. This feature:

- **Creates ADR files** with proper naming convention (`ADR-{number}-{slug}.md`)
- **Populates metadata** from Section 12 table (title, status, date, impact)
- **Uses the standard template** (ADR-000-template.md)
- **Creates the adr/ directory** if it doesn't exist
- **Handles conflicts** gracefully (never overwrites existing files)

**How it Works:**

1. After creating ARCHITECTURE.md, you'll see a prompt:
   ```
   Would you like me to generate the ADR files now?

   Options:
   1. [Yes - Generate ADRs] - Create all ADR files listed in Section 12
   2. [Preview First] - Show me which ADRs will be created
   3. [No Thanks] - I'll create them manually later
   4. [Learn More] - Tell me about ADRs and the template
   ```

2. If you choose to generate ADRs, the skill will:
   - Read Section 12 table in ARCHITECTURE.md
   - Extract ADR metadata (number, title, status, date)
   - Generate ADR files using the template
   - Report which files were created

3. You can then customize each ADR by filling in:
   - Context section (problem statement, requirements)
   - Decision section (what was decided)
   - Rationale section (why this choice)
   - Consequences section (positive/negative outcomes)
   - Alternatives section (options considered but rejected)

**To regenerate ADRs later or add new ones:**
- Update Section 12 table in ARCHITECTURE.md with new ADR entries
- Manually copy and customize ADR-000-template.md
- Use the architecture-docs skill's ADR generation feature

**Note**: Automatic generation is optional - you can skip it and create ADRs manually using the workflow below.

### Manual ADR Workflow

```bash
# 1. Copy template
cp adr/ADR-000-template.md adr/ADR-XXX-your-decision.md

# 2. Fill in sections:
#    - Context: What problem are we solving?
#    - Decision: What did we decide?
#    - Rationale: Why this decision?
#    - Consequences: What are the impacts?
#    - Alternatives: What else did we consider?

# 3. Submit for review
git checkout -b adr/XXX-your-decision
git add adr/ADR-XXX-your-decision.md
git commit -m "Add ADR-XXX: Your Decision"
git push

# 4. Create Pull Request for team review

# 5. After approval, update status to "Accepted"
```

---

## ADR Best Practices

### Writing Effective ADRs

1. **Focus on Context**
   - Explain WHY the decision was needed
   - Describe the problem clearly
   - Include constraints and requirements

2. **Be Objective**
   - Present alternatives fairly
   - Use **REAL, RESEARCHED data** to support decisions (not placeholder ratings like "Excellent/Good/Poor")
   - Include **quantitative metrics** where available: latency (ms), cost ($/month), throughput (ops/sec), SLA (%)
   - **Cite sources** for comparison data (vendor documentation, benchmarks, POC results)
   - Acknowledge trade-offs

3. **Keep it Concise**
   - Focus on the decision, not implementation
   - 1-2 pages maximum
   - Use tables for comparisons with **SPECIFIC, QUANTITATIVE data**:
     - ✅ **Good**: "$1,400/month (8 vCores)", "99.99% SLA", "<10ms p95 latency", "25K ops/sec"
     - ❌ **Bad**: "Medium cost", "Excellent performance", "High complexity", "Good reliability"
   - Replace template placeholder data with real numbers from vendor docs, benchmarks, or testing

4. **Think Long-term**
   - Consider future maintainers
   - Document assumptions
   - Note what might change

5. **Link Liberally**
   - Reference related ADRs
   - Link to documentation
   - Include relevant research

### Comparison Table Best Practices

**Always Use Real, Researched Data:**

Comparison tables must contain specific, quantitative data backed by sources. Never use generic qualitative ratings without supporting numbers.

**Examples of Good vs Bad Data:**

| Category | ✅ Good (Specific & Quantitative) | ❌ Bad (Generic & Vague) |
|----------|-----------------------------------|--------------------------|
| **Cost** | "$1,400/month (8 vCores, General Purpose tier)" | "Medium cost" |
| **Availability** | "99.99% SLA (52 min/year downtime)" | "Excellent availability" |
| **Performance** | "<10ms p95 latency (internal POC testing)" | "Good performance" |
| **Throughput** | "25,000 ops/sec (Redis benchmark)" | "High throughput" |
| **Scale** | "4-128 vCores vertical scaling" | "Good scalability" |
| **Learning Curve** | "2-4 weeks (team survey, n=5)" | "Steep" |

**Required Quantitative Metrics (When Available):**
- **Latency**: Use specific numbers with percentiles (p50, p95, p99) and units (ms, seconds)
- **Throughput**: Requests/sec, messages/sec, operations/sec, transactions/sec
- **Cost**: Actual monthly/annual costs with tier/configuration details
- **SLA**: Percentage with downtime context (e.g., "99.99% = 52 min/year")
- **Capacity**: Specific limits (vCores, memory, connections, storage)
- **Time Estimates**: Learning curve, migration effort in days/weeks (cite source: POC, team survey, etc.)

**Source Citation Requirements:**

Every data point in comparison tables should be traceable to a source. Include a References section with:

**Example References Section:**
```markdown
## References

### Comparison Data Sources
- Azure SQL Database pricing: https://azure.microsoft.com/pricing/details/azure-sql-database/
- Azure SQL SLA: https://azure.microsoft.com/support/legal/sla/azure-sql-database/
- PostgreSQL performance benchmarks: Internal POC results (`docs/postgres-benchmark-2024-01.md`)
- Cosmos DB latency: Azure documentation (global distribution, multi-region writes)
- Team expertise estimates: Survey of 5 engineers (avg 2.5 years PostgreSQL experience)
- Migration effort: Based on previous schema migration project (3 weeks actual, documented in PROJ-123)
```

**Acceptable Source Types:**
1. **Vendor Documentation**: Official pricing pages, SLA agreements, technical specs
2. **Internal Testing**: POC results, benchmark tests, load testing reports (document methodology)
3. **Third-Party Benchmarks**: Link to published reports from reputable sources
4. **Case Studies**: Published experience reports from similar implementations
5. **Team Expertise**: Survey/poll results from team members (document sample size and experience levels)
6. **Historical Data**: Previous project metrics (link to project documentation)

**What NOT to Do:**
- ❌ Generic ratings: "Excellent", "Good", "Poor", "Medium", "High", "Low"
- ❌ Unsourced numbers: Claims without citations or validation
- ❌ Assumptions presented as facts: "Should be around $500/month" → cite actual pricing
- ❌ Copying template verbatim: The template's example table is PLACEHOLDER DATA ONLY

**Real-World Example within this Guide:**

See the "Example ADR" section below (lines 409-546) for an excellent demonstration:
- 10 criteria evaluated with specific, quantitative numbers
- Real benchmarks: "<5ms p95 latency", "100K req/sec throughput", "2-3x smaller serialization"
- Learning curve data: "2-4 weeks (team survey, n=5)" with sample size documented
- Cost analysis: "Free (open-source)" with ecosystem size comparisons
- Source citations: Internal POC results, vendor docs, team surveys all documented
- Proper attribution: All 8 data points include reference numbers [1]-[8]
- References section: Comprehensive sources including URLs and internal doc paths

### Common ADR Pitfalls

❌ **Don't:**
- Modify ADRs after acceptance (create new ones instead)
- Document implementation details (those go in code)
- Write ADRs after-the-fact to justify decisions
- Skip the alternatives section
- Assume everyone has the same context
- Use placeholder or generic data in comparison tables ("Excellent/Good/Poor" ratings without numbers)
- Make up numbers without validation or sources
- Copy the template's example table verbatim into production ADRs

✅ **Do:**
- Write ADRs before or during decision-making
- Focus on architectural significance
- Include team in the ADR review process
- Keep ADRs with the codebase in version control
- Review ADRs quarterly to identify candidates for deprecation
- Use real, researched data in comparison tables with source citations
- Include quantitative metrics (latency, cost, throughput, SLA) where available
- Validate all comparison data through vendor docs, benchmarks, or POC testing

---

## ADR Status Lifecycle

```
Proposed → Accepted → Deprecated → Superseded
           ↓
        Rejected
```

**Status Definitions:**
- **Proposed**: Under review, not yet implemented
- **Accepted**: Approved and being/has been implemented
- **Rejected**: Considered but not chosen
- **Deprecated**: No longer recommended, but still in use
- **Superseded**: Replaced by a newer ADR (link to new ADR)

### Updating ADR Status

When an architectural decision changes:
1. **Do NOT modify** the original ADR
2. Create a new ADR that supersedes it
3. Update the original ADR's status to "Superseded by ADR-XXX"
4. Link between the old and new ADRs

**Example:**
```markdown
# ADR-002: PostgreSQL for Primary Database

**Status**: Superseded by [ADR-015](ADR-015-migrate-to-cockroachdb.md)
**Date**: 2024-01-20
**Superseded Date**: 2024-06-15
```

---

## ADR Tools

### Command-Line Tools
- **adr-tools**: CLI for managing ADRs
  ```bash
  # Install
  brew install adr-tools

  # Create new ADR
  adr new "Use PostgreSQL for primary database"

  # Supersede an ADR
  adr new -s 2 "Use CockroachDB for primary database"
  ```

- **log4brains**: Web UI for ADRs with search and navigation
  ```bash
  npm install -g log4brains
  log4brains init
  log4brains preview
  ```

### Documentation Platforms
- **Backstage**: Developer portal with built-in ADR support
- **Docusaurus**: Include ADRs in technical documentation site
- **MkDocs**: Generate static site from ADR markdown files

---

## Example ADR

### ADR-001: Use gRPC for Inter-Service Communication

**Status**: Accepted
**Date**: 2024-01-15
**Authors**: Platform Team
**Related**: ADR-007 (REST for Public APIs)

---

#### Context

**Problem Statement:**
Our microservices architecture requires efficient inter-service communication. Current REST/JSON approach suffers from:
- High serialization overhead
- Lack of type safety across services
- Manual client library maintenance
- No built-in load balancing or retry logic

**Requirements:**
- Low latency (<10ms p95 for internal calls)
- Type-safe contracts between services
- Support for streaming (bi-directional)
- Backward compatibility support
- Language-agnostic (Go, Java, Python services)

**Constraints:**
- Must work with Kubernetes service discovery
- Team has limited experience with alternative protocols
- Need to maintain REST for public APIs

---

#### Decision

**Summary:**
Adopt gRPC with Protocol Buffers for all inter-service communication while maintaining REST APIs for external clients via API Gateway with gRPC transcoding.

**Details:**
- Define service contracts in `.proto` files
- Auto-generate client libraries for each language
- Use gRPC-native load balancing (client-side)
- Implement gRPC health checking
- Use API Gateway (Kong) for REST↔gRPC transcoding

**Scope:**
- Included: All internal service-to-service calls
- NOT included: Public APIs (remain REST), message queue events

---

#### Rationale

**Primary Drivers:**
1. **Performance**: Binary serialization 2-3x faster than JSON, reduces latency by ~30% [1]
2. **Type Safety**: Proto schemas enforce contracts, catch errors at compile time [2]
3. **Tooling**: Auto-generated clients eliminate manual SDK maintenance [3]

**Comparison:**

| Criteria | gRPC (Selected) | REST/JSON | GraphQL |
|----------|-----------------|-----------|---------|
| **Latency** | ✅ <5ms p95 [1] | ⚠️ 10-15ms p95 [4] | ⚠️ 15-20ms p95 [5] |
| **Throughput** | ✅ 100K req/sec [1] | ⚠️ 50K req/sec [4] | ⚠️ 40K req/sec [6] |
| **Serialization** | ✅ Protobuf binary (2-3x smaller) [1] | ⚠️ JSON text | ⚠️ JSON text |
| **Type Safety** | ✅ Compile-time (Protobuf) | ❌ Runtime only | ⚠️ GraphQL schema (runtime) |
| **Streaming** | ✅ Bi-directional native | ❌ SSE/WebSocket required | ⚠️ Subscriptions (WebSocket) |
| **Learning Curve** | ⚠️ 2-4 weeks [7] | ✅ 1-2 days (team familiar) | ⚠️ 1-2 weeks [7] |
| **Browser Support** | ❌ gRPC-Web required | ✅ Native | ✅ Native |
| **Ecosystem** | ✅ 50+ languages [8] | ✅ Universal | ⚠️ Growing (7 years old) |
| **Client Generation** | ✅ Auto-generated from .proto | ❌ Manual or OpenAPI | ⚠️ GraphQL codegen |
| **Cost** | ✅ Free (open-source) | ✅ Free (open-source) | ✅ Free (open-source) |

**Decision Factors:**
- **Selected gRPC** for 40% latency reduction (measured in POC), native streaming, and type safety
- **Rejected REST/JSON** despite familiarity due to performance bottleneck and manual client maintenance
- **Rejected GraphQL** as it's optimized for client-driven queries, not inter-service communication

---

#### Consequences

**Positive:**
1. Reduced inter-service latency (measured 40% improvement in tests)
2. Eliminated entire class of serialization bugs
3. Auto-generated clients reduce boilerplate by ~60%
4. Built-in load balancing and circuit breakers

**Negative:**
1. Increased complexity: [Mitigation: Comprehensive gRPC training, shared proto repo]
2. Debugging more difficult than REST: [Mitigation: grpcurl tool, gRPC reflection]
3. Not directly callable from browsers: [Mitigation: gRPC-Web for web clients]

**Trade-offs:**
- Gained performance and type safety at the cost of debugging simplicity
- Accepted steeper learning curve for long-term productivity gains

---

#### Alternatives Considered

| Alternative | Why rejected | When it would have been the better choice |
|---|---|---|
| REST/JSON | Performance bottleneck, no type safety, clients maintained by hand | A handful of services, no latency budget |
| GraphQL | Built for client-driven queries, not service-to-service calls | A BFF layer for mobile clients |
| Apache Thrift | Smaller ecosystem, weaker Kubernetes integration | An organization already on Thrift |

---

#### References

### Comparison Data Sources
- [1] Internal POC benchmark results: `docs/poc-grpc-vs-rest-benchmark.md` (gRPC: <5ms p95 latency, 100K req/sec, Protobuf 2-3x smaller)
- [2] gRPC Core Concepts - Type Safety: https://grpc.io/docs/what-is-grpc/core-concepts/
- [3] gRPC Code Generation: https://grpc.io/docs/languages/
- [4] Baseline REST/JSON performance: Current production metrics from monitoring dashboard
- [5] GraphQL latency estimate: 50% overhead from N+1 query resolution (internal assessment)
- [6] Apollo Server performance benchmarks: https://www.apollographql.com/docs/apollo-server/performance/
- [7] Team learning curve survey: Poll of 5 engineers (avg 2-4 weeks for gRPC/GraphQL, 1-2 days for REST)
- [8] gRPC language support: https://grpc.io/docs/languages/ (50+ official implementations)

### Additional Resources
- [gRPC Performance Benchmarks](https://grpc.io/docs/guides/benchmarking/)
- [gRPC Best Practices](https://grpc.io/docs/guides/performance/)
- Internal POC Report: `docs/poc-grpc-migration.md`

---

**Last Updated**: 2024-01-15
**Status**: ✅ Accepted

---

## References

### ADR Resources
- [ADR GitHub Organization](https://adr.github.io/) - Best practices and tools
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR article by Michael Nygard
- [ADR Tools](https://github.com/npryce/adr-tools) - Command-line tools for managing ADRs

### Related Guides
- [Architecture Documentation Guide](ARCHITECTURE_DOCUMENTATION_GUIDE.md) - Main architecture documentation guide
- [C4 Model](https://c4model.com/) - Complementary architecture diagram approach

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-18
**Maintained By**: Architecture Team