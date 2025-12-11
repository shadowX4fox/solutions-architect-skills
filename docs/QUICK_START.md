# Quick Start Guide

Get started with Solutions Architect Skills in 5 minutes. This tutorial walks you through creating your first complete architecture documentation workflow.

> **Prerequisites**: This guide assumes you have already installed the plugin. If not, see [Installation Guide](INSTALLATION.md).

This plugin is distributed via the Claude Code marketplace system. See [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code) for general information.

---

## Prerequisites

- Solutions Architect Skills plugin installed ([Installation Guide](INSTALLATION.md))
- Claude Code running
- A project or system to document

## 5-Minute Workflow

### Phase 1: Create Product Owner Specification (2 minutes)

The Product Owner (PO) documents business requirements before technical design begins.

#### Step 1: Activate Architecture Readiness Skill

```
/skill architecture-readiness
```

#### Step 2: Create PO Spec

When prompted, provide:
- **Project Name:** E.g., "Job Scheduling Platform"
- **Business Context:** What problem does this solve?
- **Target Users:** Who will use this system?

The skill will guide you through the 8-section template:

1. **Business Context** - Why this project exists
2. **User Personas** - Who are the users
3. **Use Cases** - What users need to do
4. **User Stories** - Specific requirements (As a... I want... So that...)
5. **Success Criteria** - How to measure success
6. **Constraints & Assumptions** - Limitations and dependencies
7. **Risks** - Potential issues
8. **Next Steps** - Handoff to architecture team

#### Step 3: Review Readiness Score

The skill calculates a weighted score (0-10):
- **≥7.5:** Ready for architecture team handoff ✅
- **<7.5:** Needs more detail before handoff ⚠️

**Output:** `PRODUCT_OWNER_SPEC.md` in your current directory

---

### Phase 2: Create Technical Architecture (2 minutes)

The Architecture Team translates PO requirements into technical design.

#### Step 1: Activate Architecture Docs Skill

```
/skill architecture-docs
```

#### Step 1.5: Choose Architecture Type

Before creating ARCHITECTURE.md, determine which architecture type fits your system:

**Quick Decision**:
- **Large enterprise with 5+ integrations?** → META (6-Layer)
- **Cloud-native with independent services?** → Microservices
- **Domain-Driven Design approach?** → N-Layer (DDD)
- **Standard web application?** → 3-Tier

**Architecture Types**:
1. **META (6-Layer Enterprise)**: Financial services, complex integrations, regulatory compliance
2. **3-Tier (Classic Web)**: Web apps, REST APIs, line-of-business applications
3. **Microservices (Cloud-Native)**: Distributed systems, event-driven, independent deployability
4. **N-Layer (DDD/Clean Arch)**: Domain-Driven Design, Hexagonal Architecture, testable design

See [Architecture Type Selector](../skills/architecture-docs/templates/ARCHITECTURE_TYPE_SELECTOR.md) for detailed comparison and decision tree.

#### Step 2: Create ARCHITECTURE.md

The skill will prompt for:
- **Use PO Spec as input?** → Yes (if you have PRODUCT_OWNER_SPEC.md)
- **Project Name:** Same as PO Spec
- **Architecture Type:** Choose one: META, 3-Tier, Microservices, or N-Layer (from Step 1.5)

The skill creates a 12-section ARCHITECTURE.md:

1. **Executive Summary** - High-level overview
2. **System Overview** - Purpose, scope, stakeholders
3. **Architecture Principles** - 9 core principles
4. **Meta Architecture** - Layers, deployment model
   - **Note**: Includes interactive Mermaid diagram with color-coded components
5. **System Components** - Detailed components
6. **Data Flow** - How data moves through system
7. **Integration Points** - External systems
8. **Technology Stack** - Languages, frameworks, tools
9. **Security** - Authentication, encryption, compliance
10. **Performance** - SLAs, scalability, capacity
11. **Operations** - Monitoring, backup, disaster recovery
12. **ADRs** - Architecture Decision Records

#### Step 3: Fill in Technical Details

The skill provides:
- **Document Index** (lines 1-50) for easy navigation
- **Placeholder guidance** for each section
- **Automatic validation** for metrics consistency

**Output:** `ARCHITECTURE.md` (2,000-3,000 lines typically)

---

### Phase 3: Generate Compliance Documents (1 minute)

The Compliance Team generates organizational contracts from ARCHITECTURE.md.

#### Step 1: Activate Architecture Compliance Skill

```
/skill architecture-compliance
```

#### Step 2: Generate Compliance Contracts

When prompted:
- **Which contracts?** → "All" (generates all 11)
- **ARCHITECTURE.md location:** → "./" or specify path

The skill generates 10 contracts:

1. Business Continuity
2. SRE (Site Reliability Engineering)
3. Cloud Architecture
4. Data & Analytics/AI
5. **Development Architecture** (includes automatic 26-item stack validation)
6. Process Transformation
7. Security Architecture
8. IT Platforms & Infrastructure
9. Enterprise Architecture
10. Integration Architecture

#### Step 3: Review Generated Documents

```bash
ls compliance-docs/
```

You'll see:
- `CONTINUIDAD_NEGOCIO_<project>_<date>.md`
- `ARQUITECTURA_SRE_<project>_<date>.md`
- `DEVELOPMENT_ARCHITECTURE_<project>_<date>.md` ← Check stack validation here
- ... (7 more contracts)
- `COMPLIANCE_MANIFEST.md` ← Index of all documents

**Output:** `/compliance-docs/` directory with 10 contracts + manifest

---

## Example: Job Scheduling Platform

Let's walk through a real example.

### Example Phase 1: PO Spec

```
/skill architecture-readiness
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
/skill architecture-docs
```

**Key Sections:**
- **Executive Summary:** Job scheduling platform for 450 TPS, 99.9% SLA
- **Technology Stack:** Java 17, Spring Boot 3.2, PostgreSQL, Redis, AKS
- **Components:** Scheduler Service, Executor Service, Job Store, Notification Service
- **Integration:** Active Directory (LDAP), SMTP, Monitoring (Prometheus)

**Output:** `ARCHITECTURE.md` (2,100 lines)

### Example Phase 3: Compliance Docs

```
/skill architecture-compliance
```

**Generated:** 10 compliance contracts including:

- **Development Architecture** with automatic validation:
  - ✅ Java 17 LTS (supported)
  - ✅ Spring Boot 3.2 (supported)
  - ✅ PostgreSQL (authorized database)
  - ✅ Docker + AKS (authorized containers)
  - Overall: **PASS** (approval unblocked)

**Output:** `/compliance-docs/` with all 10 contracts

---

## Workflow Tips

### Best Practices

1. **Start with PO Spec:** Always begin with business requirements
2. **Use Document Index:** Lines 1-50 of ARCHITECTURE.md show section boundaries
3. **Validate Early:** Check automatic stack validation results immediately
4. **Iterate:** Regenerate compliance docs after ARCHITECTURE.md updates

### Common Commands

```bash
# Activate specific skill
/skill architecture-readiness
/skill architecture-docs
/skill architecture-compliance

# List all plugins
/plugin list

# Get help
/help
```

### Architecture Visualization

**Mermaid Diagrams**:
- Section 4 includes an interactive Mermaid architecture diagram
- Color-coded components (Blue=Orchestrators, Orange=Workers, Green=Query, Purple=Events)
- Renders automatically in GitHub/GitLab (no plugins required)
- See [MERMAID_DIAGRAMS_GUIDE.md](../skills/architecture-docs/MERMAID_DIAGRAMS_GUIDE.md) for customization

**Benefits**:
- Interactive (zoom, pan, clickable)
- Maintainable (text-based, easy to update)
- Professional appearance
- Version control friendly

### File Organization

Recommended project structure:

```
my-project/
├── PRODUCT_OWNER_SPEC.md          # Business requirements
├── ARCHITECTURE.md                 # Technical architecture
└── compliance-docs/                # Compliance contracts
    ├── COMPLIANCE_MANIFEST.md
    ├── CONTINUIDAD_NEGOCIO_*.md
    ├── ARQUITECTURA_SRE_*.md
    ├── DEVELOPMENT_ARCHITECTURE_*.md
    └── ... (8 more)
```

### Time Estimates

- **PO Spec creation:** 30-60 minutes (depending on project complexity)
- **ARCHITECTURE.md creation:** 2-4 hours (initial version)
- **Compliance generation:** 5-10 minutes (all 10 contracts)
- **Total workflow:** 3-5 hours for complete documentation

---

## Quick Reference

### Phase 1: Architecture Readiness
- **Command:** `/skill architecture-readiness`
- **Output:** `PRODUCT_OWNER_SPEC.md`
- **Owner:** Product Owner
- **Focus:** Business requirements only (no technical details)

### Phase 2: Architecture Docs
- **Command:** `/skill architecture-docs`
- **Output:** `ARCHITECTURE.md`
- **Owner:** Architecture Team
- **Focus:** Technical design, components, decisions
- **Architecture Types:** META (6-Layer), 3-Tier, Microservices, N-Layer (DDD)
- **Diagrams:** Interactive Mermaid diagrams in Section 4

### Phase 3: Architecture Compliance
- **Command:** `/skill architecture-compliance`
- **Output:** `/compliance-docs/` (10 contracts)
- **Owner:** Compliance Team
- **Focus:** Organizational standards adherence

---

## Next Steps

Now that you've completed your first workflow:

1. **Customize:** Tailor templates to your organization's standards
2. **Learn More:** Read [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) for advanced usage
3. **Explore Examples:** Check `/examples/` directory for realistic samples
4. **Share:** Distribute compliance docs to stakeholders

---

## Troubleshooting

### Skills Not Working?

1. Verify plugin installed: `/plugin list`
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Restart Claude Code

### Missing Templates?

Verify installation:
```bash
ls ~/.claude/plugins/solutions-architect-skills/skills/architecture-compliance/templates/
```

Should show 11 template files.

### Need Help?

- [Installation Guide](INSTALLATION.md) - Setup issues
- [Workflow Guide](WORKFLOW_GUIDE.md) - Detailed usage
- [Troubleshooting](TROUBLESHOOTING.md) - Common problems
- [GitHub Issues](https://github.com/shadowx4fox/solutions-architect-skills/issues) - Report bugs

---

**Congratulations!** You've completed your first architecture documentation workflow. You're now ready to document production systems with professional, compliance-ready architecture documentation.