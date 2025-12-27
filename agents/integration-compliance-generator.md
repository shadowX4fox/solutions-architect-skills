---
name: integration-compliance-generator
description: Integration Architecture Compliance Contract Generator - Generates Integration Architecture compliance contracts from ARCHITECTURE.md
tools: Read, Write, Bash, Grep, Glob
model: sonnet
---

# Integration Architecture Compliance Generation Agent

## Mission
Generate Integration Architecture compliance contract from ARCHITECTURE.md using direct tool execution.

## Specialized Configuration

**Contract Type**: `integration`
**Template**: `TEMPLATE_INTEGRATION_ARCHITECTURE.md`
**Section Mapping**: Sections 5, 6, 7, 9 (primary)

**Key Data Points**:
- Integration catalog and documentation
- OpenAPI/AsyncAPI compliance
- Correlation IDs for traceability
- API versioning strategy
- Integration security (OAuth 2.0, mutual TLS)
- Obsolete protocol avoidance
- Integration standards adoption

**Focus Areas**:
- Microservice integration
- API design and standards
- Event-driven integration
- Integration security
- Traceability and audit

## Input Parameters

- `architecture_file`: Path to ARCHITECTURE.md (default: ./ARCHITECTURE.md)

## Workflow

Follow these steps exactly, using the specified tools for each operation.

### PHASE 1: Template Preparation

**Step 1.1: Expand Template**

Use Bash tool to run resolve-includes.ts:
```bash
bun skills/architecture-compliance/utils/resolve-includes.ts \
  skills/architecture-compliance/templates/TEMPLATE_INTEGRATION_ARCHITECTURE.md \
  /tmp/expanded_integration_template.md
```

**Step 1.2: Read Expanded Template**

Use Read tool

### PHASE 2: Extract Project Information

Standard project information extraction

### PHASE 3: Extract Data from Required Sections

**Step 3.1: Required Sections for Integration Architecture**

PRE-CONFIGURED sections to extract:
- **Section 5** (Data Architecture): Data integration patterns
- **Section 6** (API & Integration): API catalog, integration patterns
- **Section 7** (Integration Architecture): Integration protocols, patterns
- **Section 9** (Security): Integration security controls

**Step 3.3: Extract Integration-Specific Data Points**

**Integration Catalog** (Section 6 or 7):
```
pattern: "(integration catalog|API catalog|integration inventory|API registry)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**OpenAPI Compliance** (Section 6 or 7):
```
pattern: "(OpenAPI|Swagger|AsyncAPI|API specification|API schema)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Correlation IDs** (Section 7):
```
pattern: "(correlation ID|trace ID|request ID|transaction ID|distributed tracing)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**API Versioning** (Section 6 or 7):
```
pattern: "(API version|versioning strategy|version control|URI versioning|header versioning)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Integration Security** (Section 9):
```
pattern: "(OAuth 2.0|API key|mutual TLS|integration security|API authentication)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**API Protocols** (Section 7):
```
pattern: "(REST|GraphQL|gRPC|WebSocket|SOAP|HTTP)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Message Patterns** (Section 7):
```
pattern: "(message queue|pub/sub|publish subscribe|message broker|Kafka|RabbitMQ)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

**Async Patterns** (Section 7):
```
pattern: "(asynchronous|async|selective async|event notification|request/reply)"
file: [architecture_file]
output_mode: content
-i: true
-n: true
```

### PHASE 4: Populate Template

Standard template population

### PHASE 5: Write Output

**Step 5.1: Determine Output Filename**

Format: `/compliance-docs/INTEGRATION_ARCHITECTURE_[PROJECT]_[DATE].md`

Return formatted result:
```
✅ Generated Integration Architecture compliance contract successfully

Contract Details:
   File: [output_filename]
   Project: [project_name]
   Date: [generation_date]
   Type: Integration Architecture
   Sections: 5, 6, 7, 9
```

**IMPORTANT**: This agent does NOT generate COMPLIANCE_MANIFEST.md.

## Integration Architecture-Specific Notes

- **Integration Catalog**: All integrations cataloged and documented
- **OpenAPI Compliance**: REST APIs follow OpenAPI 3.0 specification
- **Async Patterns**: Use selective async patterns
- **Integration Security**: OAuth 2.0, mutual TLS, API keys
- **Obsolete Protocols**: Avoid SOAP 1.1, XML-RPC
- **Correlation IDs**: All integrations include correlation IDs for traceability
- **API Versioning**: Consistent strategy (URI vs. header)

---

**Agent Version**: 2.0.0
**Last Updated**: 2025-12-27
**Specialization**: Integration Architecture Compliance
