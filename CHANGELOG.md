# Changelog

All notable changes to the Solutions Architect Skills plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-04

### Added
- 3 ready-to-use compliance contracts:
  - Cloud Architecture contract
  - Development Architecture contract (with 26-item stack validation)
  - IT Platforms & Infrastructure contract
- Roadmap section in README documenting v1.1.0, v1.2.0, and v2.0.0 milestones
- Clear status indicators for ready vs in-development compliance contracts
- 4 architecture types with Mermaid diagram support (META, 3-Tier, Microservices, N-Layer)
- Interactive Mermaid diagrams in ARCHITECTURE.md Section 4
- MERMAID_DIAGRAMS_GUIDE.md with comprehensive diagram creation instructions

### Changed
- Updated README to clarify compliance contract availability (3 ready, 8 in development)
- BIAN compliance now exclusively for Layer 5 (Domain) - removed Layer 4 BIAN N2 references
- BIAN validation focus shifted to capability names instead of IDs
- BIAN V12.0 set as explicit default version with official landscape URLs
- BIAN IDs (SD-XXX) clarified as internal document tracking only

### Improved
- Compliance contract documentation structure
- Version information clarity across all documentation
- BIAN Service Landscape integration with official URLs
- Architecture type selection guidance

### Planned for v1.2.0
- Remaining 8 compliance contracts (Business Continuity, SRE, Data & Analytics/AI, Process Transformation, Security, Enterprise Architecture, Integration, Risk Management)
- Enhanced validation rules
- Additional architecture patterns

---

## [1.0.0] - 2025-11-28

### Added
- Initial release of Solutions Architect Skills plugin
- **architecture-readiness** skill: Product Owner Specification workflow
  - 8-section PO Spec template
  - Weighted scoring methodology (0-10 scale)
  - Readiness assessment for architecture team handoff
- **architecture-docs** skill: ARCHITECTURE.md creation and maintenance
  - 12-section standardized structure
  - Automatic metric consistency validation
  - Design Drivers calculation
  - ADR (Architecture Decision Record) support
  - Document Index for context-efficient editing
- **architecture-compliance** skill: Generate 11 compliance contracts
  - Business Continuity (Continuidad de Negocio)
  - Site Reliability Engineering (Arquitectura SRE)
  - Cloud Architecture
  - Data & Analytics/AI (Arquitectura Datos y Analítica - IA)
  - Development Architecture (Arquitectura Desarrollo)
  - Process Transformation (Transformación de Procesos y Automatización)
  - Security Architecture (Arquitectura Seguridad)
  - IT Platforms & Infrastructure (Plataformas e Infraestructura TI)
  - Enterprise Architecture (Arquitectura Empresarial)
  - Integration Architecture (Arquitectura de Integración)
  - Risk Management
- Automatic stack validation (26-item checklist) for Development Architecture
- Context-efficient document generation (70-80% reduction in loaded content)
- Complete documentation suite (Installation, Quick Start, Workflow Guide, Troubleshooting)
- Example outputs demonstrating full workflow

### Features
- Three-phase workflow: Readiness → Documentation → Compliance
- 11 compliance contract templates with full traceability
- Automatic validation and quality checks
- Pure markdown-based configuration (no build dependencies)
- MIT License for open distribution

---

## Version Strategy

- **MAJOR** (X.0.0): Breaking changes (template structure, SKILL.md format changes)
- **MINOR** (1.X.0): New features (new templates, new skills, enhancements)
- **PATCH** (1.0.X): Bug fixes (template corrections, documentation improvements)