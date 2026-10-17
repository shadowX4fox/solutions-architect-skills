# Quick Start Guide

This tutorial walks you through your first complete architecture documentation workflow — the steps, the commands and what each produces.

> **Prerequisites**: Step 1 below installs the suite; the [Installation Guide](INSTALLATION.md) covers it in detail.

This plugin is distributed via the Claude Code marketplace system. See [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code) for general information.

---

## Step 1 — Install the full suite

The suite is six plugins from one marketplace: **sa-skills** (architecture, component index),
**sa-records** (ADRs, TDRs), **sa-requirements** (the PO Spec and its capability alignment — BIAN for banking, a cross-industry map, or a pack's framework), **sa-analysis** (risk analyses, traceability),
**sa-delivery** (handoff kit, Word export, IcePanel) and **sa-visualization** (the 3D command center).
Installing sa-skills installs the other five. What belongs to one organization ships separately as an
[institution pack](INSTITUTION_PACKS.md). Requires [Bun](INSTALLATION.md#installing-bun).

**From a terminal:**

```bash
claude plugin marketplace add shadowX4fox/solutions-architect-skills
claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user
claude plugin list   # sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery, sa-visualization — all ✔ enabled
```

Then, in Claude Code: `/reload-plugins`, and `/sa-skills:setup` once in each project (permissions, `.gitignore`,
`CLAUDE.md` pointers, docgen and judge checks).

**Or paste this into another Claude Code instance** — it installs, repairs what is missing and verifies:

```text
Install the Solutions Architect Skills suite for me, from a shell (the `claude` CLI):
1. If `claude plugin marketplace list` does not show shadowx4fox-solution-architect-marketplace, run
   `claude plugin marketplace add shadowX4fox/solutions-architect-skills`; if it does, run
   `claude plugin marketplace update shadowx4fox-solution-architect-marketplace`.
2. If `claude plugin list` does not show sa-skills@shadowx4fox-solution-architect-marketplace, run
   `claude plugin install sa-skills@shadowx4fox-solution-architect-marketplace --scope user` (it brings sa-records,
   sa-requirements, sa-analysis, sa-delivery and sa-visualization). If it does, run `claude plugin update <name>@shadowx4fox-solution-architect-marketplace --scope user`
   for each of sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery and sa-visualization — an update touches only the plugin it names.
3. Run `claude plugin list`. For any "Dependency <name>@… is not installed", run
   `claude plugin install <name>@shadowx4fox-solution-architect-marketplace --scope user`; if sa-adr is listed, run
   `claude plugin uninstall sa-adr@shadowx4fox-solution-architect-marketplace` (it was renamed sa-records).
   Repeat until all six show ✔ enabled.
4. Run `bun --version`; if Bun is missing, tell me the install command for my OS and stop.
5. Report the six plugins with their versions, then tell me to run /reload-plugins and, in each project, /sa-skills:setup.
```

Only part of the suite: `sa-records` alone for an institutional ADR catalog repository, `sa-requirements` alone for a
Product Owner — `claude plugin install <plugin>@shadowx4fox-solution-architect-marketplace --scope user`.

---

## Prerequisites

- Solutions Architect Skills plugins installed ([Installation Guide](INSTALLATION.md)) — `claude plugin list` shows six: `sa-skills`, `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery`, `sa-visualization`. A Product Owner who only writes the PO Spec (Phase 1) can install `sa-requirements` alone
- Claude Code running
- A project or system to document

## The Workflow

### Phase 1: Create Product Owner Specification

The Product Owner (PO) documents business requirements before technical design begins.

#### Step 1: Activate Architecture Readiness Skill

```
/skill sa-requirements:architecture-readiness
```

The skill ships in the `sa-requirements` plugin.

#### Step 2: Create PO Spec

When prompted, provide:
- **Project Name:** E.g., "Job Scheduling Platform"
- **Business Context:** What problem does this solve?
- **Target Users:** Who will use this system?

The skill will guide you through the 8-section template:

1. **Business Context** - Why this project exists and the problem being solved
2. **Stakeholders & Users** - Who are affected by and who will use the system
3. **Business Objectives** - Measurable goals, ROI expectations, and success criteria
4. **Use Cases** - What users need to do (primary flows, alternatives, edge cases)
5. **User Stories** - Specific requirements (As a... I want... So that...)
6. **UX Requirements** - Performance expectations, usability, accessibility standards
7. **Business Constraints** - Budget, timeline, compliance, and integration limitations
8. **Success Metrics & KPIs** - How to measure success post-launch

#### Step 3: Review Readiness Score

The skill calculates a weighted score (0-10):
- **≥7.5:** Ready for architecture team handoff ✅
- **<7.5:** Needs more detail before handoff ⚠️

**Output:** `PRODUCT_OWNER_SPEC.md` in your current directory

---

### Phase 1.5: Capability Alignment Gate

`architecture-docs` will not create a new `ARCHITECTURE.md` until the PO Spec has been
mapped onto the capability framework the project declares (BIAN for banking, the
cross-industry map, or a framework an institution pack provides). Once a framework is
declared there is **no skip override** — the gate is bypassed only when the PO Spec gate
itself was skipped, and a project that declares `none` is not gated.

```
/skill sa-requirements:architecture-capability-alignment [--framework <id>]
```

**Output:** `BIAN_ALIGNMENT.md` at the project root, mapping the initiative onto the
BIAN Service Landscape v14.0.0 as published — 8 Business Areas, 43 Business Domains,
341 Service Domains (another framework writes `CAPABILITY_ALIGNMENT.md` with its own levels). Its Summary, impacted Business Domains and Service Domains, the
`DOM`/`CAP` Diagram ID Segments and the API Surface are lifted into
`docs/01-system-overview.md` § 1.5 during architecture creation.

---

### Phase 2: Create Technical Architecture

The Architecture Team translates PO requirements into technical design.

#### Step 1: Activate Architecture Docs Skill

```
/skill sa-skills:architecture-docs
```

#### Step 1.1: The four creation gates

Creating a new `ARCHITECTURE.md` runs four gates in order. Have their inputs ready or
the workflow stops:

| # | Gate | What it asks | Skippable |
|---|------|--------------|-----------|
| 0.1 | **Documentation Language** | `en` or `es` — stamped as `<!-- DOC_LANGUAGE: xx -->` and governing every artifact produced in Phases 2–4 | No |
| 0.2 | **PO Spec** | `PRODUCT_OWNER_SPEC.md`, or inline context scored against the rubric | Yes — `SKIP PO SPEC` |
| 0.3 | **Capability Alignment** | the declared framework's report (`BIAN_ALIGNMENT.md` or `CAPABILITY_ALIGNMENT.md`, Phase 1.5 above) | Required once a framework is declared (`none` passes); cascades-skip only if the PO Spec gate was skipped |
| 0.4 | **HLD Intake** | A High-Level Design file — **Mermaid** (`.mmd`, `.mermaid`, or a `.md` with ```mermaid fences) preferred, else PDF, SVG or PNG | No override; same cascade rule |

The HLD anchors Sections 4, 5 and 6 so they reflect upstream design intent rather than
being reverse-derived from the PO Spec. An inbound HLD is **not** held to the plugin's own
diagram conventions — hand-drawn node-to-node edges and ad-hoc ids are valid input;
normalization happens later during diagram generation. A PDF, PNG or SVG is transcribed at the
gate into `<name>.hld.mmd` beside it — every box, grouping and arrow verbatim — before the
workflow continues.

#### Step 1.5: Choose Architecture Type

Before creating ARCHITECTURE.md, determine which architecture type fits your system:

**Quick Decision**:
- **Large enterprise with 5+ integrations?** → ENTERPRISE (5-Layer, default)
- **Cloud-native with independent services?** → Microservices
- **Domain-Driven Design approach?** → N-Layer (DDD)
- **Standard web application?** → 3-Tier
- **Bank requiring full BIAN certification?** → BIAN

**Architecture Types**:
1. **ENTERPRISE (5-Layer Enterprise, default)**: Enterprise platforms, complex integrations, orchestrated processes over systems of record
2. **3-Tier (Classic Web)**: Web apps, REST APIs, line-of-business applications
3. **Microservices (Cloud-Native)**: Distributed systems, event-driven, independent deployability
4. **N-Layer (DDD/Clean Arch)**: Domain-Driven Design, Hexagonal Architecture, testable design
5. **BIAN (Full BIAN v14.0.0)**: Banking systems built on the BIAN Service Landscape

See [Architecture Type Selector](../skills/architecture-docs/templates/ARCHITECTURE_TYPE_SELECTOR.md) for detailed comparison and decision tree.

#### Step 2: Create ARCHITECTURE.md

The skill asks for the architecture type (from Step 1.5) and the systems the HLD names, then
writes the 13 sections as one file each under `docs/`, with `ARCHITECTURE.md` as the index:

| # | Section | File |
|---|---------|------|
| 1–2 | Executive Summary, System Overview | `docs/01-system-overview.md` |
| 3 | Architecture Principles (9 core principles) | `docs/02-architecture-principles.md` |
| 4 | Architecture Layers + the four standard diagrams | `docs/03-architecture-layers.md` |
| 5 | Components — one file each | `docs/components/` |
| 6 | Data Flow Patterns — phases, flows, sequence diagrams | `docs/04-data-flow-patterns.md` |
| 7 | Integration Points | `docs/05-integration-points.md` |
| 8 | Technology Stack | `docs/06-technology-stack.md` |
| 9 | Security Architecture | `docs/07-security-architecture.md` |
| 10 | Scalability & Performance | `docs/08-scalability-and-performance.md` |
| 11 | Operational Considerations | `docs/09-operational-considerations.md` |
| 12 | ADRs — written by `sa-records:architecture-definition-record` | `adr/` |
| 13 | Risks and Technical Debt — TDRs via `sa-records:technical-debt-records` | `docs/10-risks-and-technical-debt.md` |

Every section runs its gates by code after it is written (explorer headers, prose, principles,
Mermaid, connection labels, flows).

#### Step 3: Continue after a checkpoint

Creation stops at four checkpoints so each segment starts in a clear session. In a fresh
session, type `continue the architecture` — the skill resumes from its receipt without asking
the collection questions again. Choose **automatic checkpoints** at the end of the collection
to run the remaining segments in sub-agents without stopping.

**Output:** `ARCHITECTURE.md` + `docs/` + `adr/`, version `1.0.0` Draft. `release my architecture`
(`architecture-lifecycle`) releases it and tags `architecture-v1.0.0`.

---

### Phase 3: Compliance Documentation

Compliance contracts are organization-specific: they come from the compliance plugin an [institution pack](INSTITUTION_PACKS.md) installs, when the organization has one. The base ships none, so this phase has no command here.

---

## Example: Job Scheduling Platform

Let's walk through a real example.

### Example Phase 1: PO Spec

```
/skill sa-requirements:architecture-readiness
```

**Input:**
- Project: Job Scheduling Platform
- Context: Automate recurring batch jobs for 500 internal users
- Users: DevOps engineers, System administrators
- Use Case: Schedule Python/shell scripts to run at specific times
- Success: 99.9% job execution reliability, <5 min setup time

**Output:** `PRODUCT_OWNER_SPEC.md` with score 8.5/10 (Ready for handoff)

### Example Phase 2: ARCHITECTURE.md

```
/skill sa-skills:architecture-docs
```

**Key Sections:**
- **Executive Summary:** Job scheduling platform for 450 TPS, 99.9% SLA
- **Technology Stack:** Java 17, Spring Boot 3.2, PostgreSQL, Redis, AKS
- **Components:** Scheduler Service, Executor Service, Job Store, Notification Service
- **Integration:** Active Directory (LDAP), SMTP, Monitoring (Prometheus)

**Output:** `ARCHITECTURE.md` + `docs/` (13 sections) + `adr/`

---

## Workflow Tips

### Best Practices

1. **Start with PO Spec:** Always begin with business requirements
2. **Navigate from `ARCHITECTURE.md`:** it indexes the `docs/` section files and the components
3. **Validate Early:** Read the gate results after every write
4. **Iterate:** Edit through the skill (Workflow 2) so the gates run, then regenerate the affected downstream artifacts

### Common Commands

```bash
# Activate specific skill (plugin:skill)
/skill sa-requirements:architecture-readiness
/skill sa-skills:architecture-docs

# List installed plugins (sa-skills, sa-records, sa-requirements, sa-analysis, sa-delivery, sa-visualization)
claude plugin list

# Get help
/help
```

### Architecture Visualization

**Mermaid Diagrams** (`docs/03-architecture-layers.md` and `docs/04-data-flow-patterns.md`):
- Four standard diagrams — Logical View, C4 L1 System Context, C4 L2 Container, Detailed View — plus one sequence diagram per phase and one wire sequence per use case
- The Logical and Detailed views use one fixed four-role palette: `zone` (bands), `unit` (containers), `store` (data stores), `ext` (external systems)
- Render in GitHub/GitLab and VS Code with no extra tooling; `generate my architecture diagrams` regenerates them
- See [DIAGRAM-GENERATION-GUIDE.md](../skills/architecture-docs/references/DIAGRAM-GENERATION-GUIDE.md)

**Interactive model**: `command center` builds a 3D model of the architecture (`visualizations/*.html`) — a floor per layer, use-case walkthroughs, analysis findings and a load simulation.

### File Organization

Recommended project structure:

```
my-project/
├── PRODUCT_OWNER_SPEC.md          # Business requirements
├── BIAN_ALIGNMENT.md               # BIAN capability mapping
├── ARCHITECTURE.md                 # Index + version
├── docs/                           # The 13 sections + components/
├── adr/                            # Architecture decision records
└── tdr/                            # Technical debt records
```

### Time Estimates

- **PO Spec:** an interactive elicitation — its length depends on how much context you bring
- **Architecture creation:** several sessions; run each segment in a fresh session, or choose automatic checkpoints

---

## Quick Reference

### Phase 1: Architecture Readiness
- **Command:** `/skill sa-requirements:architecture-readiness`
- **Plugin:** `sa-requirements` (installable alone)
- **Output:** `PRODUCT_OWNER_SPEC.md`
- **Owner:** Product Owner
- **Focus:** Business requirements only (no technical details)

### Phase 2: Architecture Docs
- **Command:** `/skill sa-skills:architecture-docs`
- **Plugin:** `sa-skills`
- **Output:** `ARCHITECTURE.md` + `docs/` + `adr/`
- **Owner:** Architecture Team
- **Focus:** Technical design, components, decisions
- **Architecture Types:** ENTERPRISE (5-Layer), 3-Tier, Microservices, N-Layer (DDD), BIAN, plus any an institution pack adds (`scripts/shared/arch-types.js` lists them)
- **Diagrams:** four standard Mermaid diagrams in Section 4 (`docs/03`), sequence diagrams in Section 6 (`docs/04`)

### Phase 3: Compliance Documentation
- **Command:** none in the base — the compliance plugin an [institution pack](INSTITUTION_PACKS.md) installs, when the organization has one
- **Owner:** Compliance Team
- **Focus:** Organizational standards adherence

---

## Next Steps

Now that you've completed your first workflow:

1. **Customize:** Tailor templates to your organization's standards
2. **Learn More:** Read [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) for advanced usage
3. **Explore Examples:** Check `/examples/` directory for realistic samples
4. **Share:** Distribute the handoff kit and the Word exports to stakeholders

---

## Troubleshooting

### Skills Not Working?

1. Verify the plugins are installed: `claude plugin list` shows `sa-skills`, `sa-records`, `sa-requirements`, `sa-analysis`, `sa-delivery` and `sa-visualization`, each `✔ enabled`; a `✘ failed to load — Dependency … is not installed` line names a plugin to install
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Restart Claude Code

### Need Help?

- [Installation Guide](INSTALLATION.md) - Setup issues
- [Workflow Guide](WORKFLOW_GUIDE.md) - Detailed usage
- [Troubleshooting](TROUBLESHOOTING.md) - Common problems
- [GitHub Issues](https://github.com/shadowx4fox/solutions-architect-skills/issues) - Report bugs

---

**Congratulations!** You've completed your first architecture documentation workflow. You're now ready to document production systems with professional architecture documentation.