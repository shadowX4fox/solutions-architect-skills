# Solutions Architect Skills

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/shadowx4fox/solutions-architect-skills/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-purple.svg)](https://claude.com/claude-code)

Professional architecture documentation workflow for Claude Code: Transform business requirements into technical architecture and compliance documents.

## Overview

This Claude Code plugin provides a complete three-phase workflow for enterprise architecture documentation:

```
Phase 1: Business Requirements (PO Spec)
    ↓
Phase 2: Technical Architecture (ARCHITECTURE.md)
    ↓
Phase 3: Compliance Documents (11 contracts)
```

## Claude Code Marketplace & Plugin System

This project is distributed as a **Claude Code Plugin** via the **shadowX4fox Marketplace**:

- **Marketplace**: A catalog of available plugins ([Learn more](https://docs.anthropic.com/claude/docs/claude-code-plugins))
- **Plugin**: This repository, installable from the marketplace
- **Skills**: Three specialized tools within the plugin

For detailed information about Claude Code's plugin system, see the [official Claude Code documentation](https://docs.anthropic.com/claude/docs/claude-code).

---

### What's Included

- **3 Integrated Skills**
  - `architecture-readiness`: Product Owner Specifications
  - `architecture-docs`: ARCHITECTURE.md creation and maintenance
  - `architecture-compliance`: Generate 11 compliance contracts

- **11 Compliance Templates**
  - Business Continuity, SRE, Cloud, Security, Enterprise Architecture, and more

- **Automatic Validation**
  - 26-item stack validation checklist
  - Metric consistency checking
  - Design Drivers calculation

- **Complete Documentation**
  - Installation guide, Quick Start tutorial, Workflow guide, Troubleshooting

## Quick Start

### Installation

**Method 1: Using Claude Code Marketplace (Recommended)**

```bash
# Add the shadowX4fox marketplace
/plugin marketplace add https://github.com/shadowX4fox/shadowx4fox-marketplace

# Install the plugin
/plugin install solutions-architect-skills

# Verify installation
/plugin list
```

**Note:** The marketplace repository (`shadowx4fox-marketplace`) contains a catalog of plugins. You add the marketplace once, then can install any plugin listed in it.

**Method 2: Direct Git Clone**

```bash
# Clone directly to plugins directory
git clone https://github.com/shadowX4fox/solutions-architect-skills.git ~/.claude/plugins/solutions-architect-skills

# Restart Claude Code and verify
/plugin list
```

You should see `solutions-architect-skills v1.2.0` in the list.

### First Workflow

```bash
# Phase 1: Create Product Owner Spec
/skill architecture-readiness

# Phase 2: Create ARCHITECTURE.md
/skill architecture-docs

# Phase 3: Generate compliance documents
/skill architecture-compliance
```

## Features

### Phase 1: Architecture Readiness (Product Owner)

Create comprehensive Product Owner Specifications before technical design begins.

**Key Features:**
- 8-section template (Business Context, User Personas, Use Cases, Success Criteria, etc.)
- Weighted scoring methodology (0-10 scale)
- Readiness threshold: ≥7.5 for architecture handoff
- Focus: Business requirements, no technical implementation

**Output:** `PRODUCT_OWNER_SPEC.md`

### Phase 2: Architecture Documentation

Create and maintain technical architecture documentation following enterprise standards.

**Key Features:**
- 12-section standardized structure (Executive Summary → ADRs)
- Automatic Document Index (lines 1-50)
- 4 architecture type templates (META, 3-Tier, Microservices, N-Layer)
- Interactive Mermaid diagrams in Section 4
- Metric consistency validation across document
- Design Drivers calculation (Value Delivery %, Scale, Impacts)
- 9 mandatory Architecture Principles + 1 optional
- ADR (Architecture Decision Record) templates

**Output:** `ARCHITECTURE.md` (2,000-3,000 lines typically)

### Phase 3: Compliance Documentation

Generate compliance contracts from ARCHITECTURE.md with full traceability.

**Key Features:**
- Context-efficient generation (70-80% reduction in loaded content)
- **v1.2.0**: 4 ready-to-use contracts (Cloud, Development, IT Infrastructure, Data & AI)
- Automatic stack validation (Development Architecture - 26 items)
- **NEW**: Enhanced Data & AI Architecture compliance (Version 2.0)
- Source traceability (section + line number references)
- [PLACEHOLDER] markers for missing data with completion guidance
- Compliance manifest (index of all generated documents)

**Output:** `/compliance-docs/` directory with 4 contracts + manifest (v1.2.0)

#### Compliance Contract Types

**✅ Ready to Use (v1.2.0)** - 4 contracts:

1. **Cloud Architecture** - Deployment model, cloud provider, connectivity, security
2. **Development Architecture** - Technology stack, coding standards, technical debt, **automatic 26-item validation**
3. **IT Platforms & Infrastructure** - Environments, databases, capacity, naming conventions
4. **Data & Analytics/AI Architecture (NEW)** - **Version 2.0 template** with 11 comprehensive requirements:
   - **Data Requirements (LAD1-LAD8)**: Quality, reuse, recovery, decoupling, scalability, integration, compliance, standards
   - **AI Requirements (LAIA1-LAIA3)**: Model governance, security & reputation, hallucination control
   - **48 granular data points** with 4-status compliance tracking (Compliant/Non-Compliant/Not Applicable/Unknown)
   - **Full source traceability** to ARCHITECTURE.md sections with line numbers
   - **Advanced features**: Evaluation metrics (F1, BLEU, ROUGE, perplexity), RAG architecture, guardrail implementation

**🚧 In Development (Planned for future releases)** - 7 contracts:

5. **Business Continuity** (Continuidad de Negocio) - RTO/RPO, disaster recovery, backup strategy
6. **SRE** (Arquitectura SRE) - SLOs, error budgets, monitoring, incident management
7. **Process Transformation** - Automation, efficiency, ROI analysis
8. **Security Architecture** - API security, authentication, encryption, compliance
9. **Enterprise Architecture** - Strategic alignment, modularity, cloud-first, API-first
10. **Integration Architecture** - Integration catalog, patterns, security, standards
11. **Risk Management** - Risk identification, assessment, mitigation, monitoring

**Note**: v1.2.0 delivers the 4 most commonly used compliance contracts with enhanced Data & AI Architecture compliance featuring Version 2.0 template aligned with Cloud Architecture format.

## Architecture Types & Visualization

### 4 Supported Architecture Types

Choose the architecture type that best fits your system:

**1. META (6-Layer Enterprise)** - Large enterprise systems with complex integrations
- Layers: Channels → UX → Business Scenarios → Business → Domain → Core
- Best for: Financial services, regulated industries, enterprise platforms
- Template: Section 4 META with [BIAN V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) alignment (default version)
- **BIAN Standard**: Uses [BIAN Service Landscape V12.0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html) for Layer 5 Domain service domains

**2. 3-Tier (Classic Web Application)** - Standard web applications and REST APIs
- Tiers: Presentation → Application/Business Logic → Data
- Best for: Web apps, line-of-business applications, standard CRUD systems
- Template: Section 4 3-Tier with tier separation enforcement

**3. Microservices (Cloud-Native)** - Distributed systems with independent services
- Components: API Gateway, Service Mesh, Event Bus, independent services
- Best for: Cloud-native systems, event-driven architectures, polyglot environments
- Template: Section 4 Microservices with service catalog

**4. N-Layer (DDD/Clean Architecture)** - Flexible custom patterns
- Patterns: Classic DDD (4-Layer), Extended (5-Layer), Clean Architecture
- Best for: Domain-Driven Design, Hexagonal Architecture, testable systems
- Template: Section 4 N-Layer with dependency inversion

**How to Choose**: See [ARCHITECTURE_TYPE_SELECTOR.md](skills/architecture-docs/templates/ARCHITECTURE_TYPE_SELECTOR.md) for decision tree and comparison matrix.

### Interactive Mermaid Diagrams

All ARCHITECTURE.md documents include **Mermaid architecture diagrams** integrated into Section 4:

**Capabilities**:
- ✅ Interactive visualization (zoom, pan, clickable components)
- ✅ Color-coded components (Blue=Orchestrators, Orange=Workers, Green=Query, Purple=Events)
- ✅ Data flow patterns (solid arrows=synchronous, dashed arrows=asynchronous)
- ✅ Security protocol visualization (OAuth 2.0, JWT, mTLS, TLS 1.2+, SASL)
- ✅ GitHub/GitLab native rendering (no plugins required)
- ✅ Professional, maintainable, version-control-friendly

**Comprehensive Guide**: See [MERMAID_DIAGRAMS_GUIDE.md](skills/architecture-docs/MERMAID_DIAGRAMS_GUIDE.md) for templates, color schemes, and examples.

## Documentation

- **[Installation Guide](docs/INSTALLATION.md)** - Detailed installation instructions
- **[Quick Start](docs/QUICK_START.md)** - 5-minute getting started tutorial
- **[Workflow Guide](docs/WORKFLOW_GUIDE.md)** - Complete end-to-end workflow
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - FAQ and common issues

## Examples

> **Note**: Example repositories demonstrating real-world usage will be added here. Check back soon or see [Issues](https://github.com/shadowx4fox/solutions-architect-skills/issues) for updates.

**Planned Examples:**
- Enterprise architecture documentation workflow
- Multi-project compliance generation
- Integration with existing documentation systems

To request specific examples, [open an issue](https://github.com/shadowx4fox/solutions-architect-skills/issues/new).

**Current Examples in Repository:**

The `examples/` directory contains basic demonstrations:

- **PRODUCT_OWNER_SPEC_example.md** - Complete PO Spec (Job Scheduling Platform)
- **ARCHITECTURE_example.md** - Full ARCHITECTURE.md based on PO Spec
- **compliance-docs/** - All 11 generated compliance contracts

## Requirements

- **Claude Code** (latest version)
- **Platform:** macOS, Linux, or Windows
- **No dependencies** - Pure markdown-based plugin

## Use Cases

Perfect for:
- Enterprise architects documenting solution designs
- Product Owners preparing requirements for architecture teams
- Compliance teams generating organizational contracts
- Technical leads maintaining architecture documentation
- Teams needing standardized architecture workflows

## Workflow Integration

```mermaid
graph LR
    A[Product Owner] -->|Creates| B[PO Spec]
    B -->|Input to| C[Architecture Team]
    C -->|Creates| D[ARCHITECTURE.md]
    D -->|Generates| E[11 Compliance Contracts]
    E -->|Review by| F[Compliance Team]
```

## Technology Stack Validation

The Development Architecture contract includes **automatic validation** against a 26-item checklist:

- **Java Backend** (6 items): Version, framework, tools, containers, libraries, naming
- **.NET Backend** (6 items): Version, framework, tools, containers, libraries, naming
- **Frontend** (6 items): Framework, language, tools, architecture, libraries, naming
- **Other Stacks** (5 items): Automation, IaC, databases, APIs, CI/CD
- **Exceptions** (3 items): Deviations, documentation, action plans

**Validation States:**
- ✅ **PASS**: Complies with authorized catalog → Approval unblocked
- ❌ **FAIL**: Non-compliant or deprecated → Approval blocked with remediation guidance
- ❓ **UNKNOWN**: Insufficient data → Requires documentation completion
- ⚪ **N/A**: Not applicable to architecture

## Roadmap

### v1.2.0 (Current Release) ✅
- ✅ 3 integrated skills (architecture-readiness, architecture-docs, architecture-compliance)
- ✅ 4 architecture types with Mermaid diagrams (META, 3-Tier, Microservices, N-Layer)
- ✅ BIAN V12.0 integration for META architecture
- ✅ 4 ready-to-use compliance contracts:
  - Cloud Architecture
  - Development Architecture (with 26-item auto validation)
  - IT Platforms & Infrastructure
  - **Data & Analytics/AI Architecture (Version 2.0)** ⭐ NEW
- ✅ Enhanced Data & AI Architecture compliance:
  - 11 comprehensive requirements (8 Data + 3 AI)
  - 48 granular data points with 4-status tracking
  - Category labels (Data vs AI requirements)
  - Advanced AI compliance: Guardrails, hallucination control, evaluation metrics
- ✅ Complete ARCHITECTURE.md generation workflow
- ✅ Product Owner Specification workflow

### v1.1.0 (Previous Release)
- ✅ Initial release with 3 compliance contracts
- ✅ Foundation for architecture documentation workflow

### Future Releases 🚀
- 🔄 Additional compliance contracts (7 remaining):
  - Business Continuity
  - SRE Architecture
  - Process Transformation
  - Security Architecture
  - Enterprise Architecture
  - Integration Architecture
  - Risk Management
- 🔄 Enhanced validation rules
- 🔄 Additional architecture patterns
- 🔄 Improved traceability reporting

### v2.0.0 (Future)
- Multi-project support
- Custom compliance contract templates
- Integration with CI/CD pipelines
- Advanced reporting and dashboards

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Reporting Issues

If you encounter problems:
1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Search [existing issues](https://github.com/shadowx4fox/solutions-architect-skills/issues)
3. Open a new issue with detailed description

### Feature Requests

Have an idea for improvement? Open an issue with the `enhancement` label.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**shadowx4fox**
- GitHub: [@shadowx4fox](https://github.com/shadowx4fox)
- Repository: [solutions-architect-skills](https://github.com/shadowx4fox/solutions-architect-skills)

## Acknowledgments

- Built for [Claude Code](https://claude.com/claude-code) by Anthropic
- Follows enterprise architecture best practices
- Inspired by organizational compliance frameworks

---

**Get Started:** Download the [latest release](https://github.com/shadowx4fox/solutions-architect-skills/releases) and transform your architecture workflow today!