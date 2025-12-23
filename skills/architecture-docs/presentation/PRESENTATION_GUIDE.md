# Architecture Presentation Generation Guide

## Overview

The presentation generation feature automatically creates professional PowerPoint presentations from your ARCHITECTURE.md files. Generate stakeholder-specific presentations in English or Spanish with a single command.

**Version**: 1.0
**Last Updated**: 2025-12-21

## Features

- **3 Stakeholder Types**: Business (13 slides), Architecture (16 slides), Compliance (14 slides)
- **11 Slide Types**: Including section dividers, comparisons, metrics, quotes, and more
- **Dark Blue Professional Theme**: Modern color palette (#0A1E3D primary)
- **Bilingual Support**: English and Spanish
- **Context-Efficient**: Loads only required sections (50-80% reduction)
- **Automated Slide Generation**: 13-16 slides per presentation
- **Professional Design**: Corporate color scheme with consistent branding
- **Template-Based**: Predefined slide structures for each stakeholder type

## Quick Start

### Prerequisites

1. **ARCHITECTURE.md file** exists and is complete
2. **Document Index** is present (lines 1-50)
3. **Bun 1.0+** runtime installed
4. All 12 sections documented in ARCHITECTURE.md

### Basic Usage

**Option 1: Through architecture-docs skill**

```
User: "Generate architecture presentation for business stakeholders"
```

The skill will guide you through:
1. Stakeholder type selection (Business/Architecture/Compliance)
2. Language selection (English/Spanish)
3. Confirmation
4. Automated generation

**Option 2: Command-Line**

```bash
cd /home/shadowx4fox/solutions-architect-skills

# Business presentation in English
bun run utils/presentation-generator.ts ARCHITECTURE.md \
  --stakeholder business \
  --language en

# Architecture presentation in Spanish
bun run utils/presentation-generator.ts ARCHITECTURE.md \
  --stakeholder architecture \
  --language es

# Compliance presentation with custom output
bun run utils/presentation-generator.ts ARCHITECTURE.md \
  --stakeholder compliance \
  --output /custom/path/presentation.pptx
```

### Output Location

Presentations are saved to:
```
/presentations/ARCHITECTURE_{StakeholderType}_{Language}.pptx
```

**Examples**:
- `/presentations/ARCHITECTURE_Business_EN.pptx`
- `/presentations/ARCHITECTURE_Architecture_ES.pptx`
- `/presentations/ARCHITECTURE_Compliance_EN.pptx`

## Stakeholder Types

### Business Stakeholders (13 slides)

**Target Audience**: Executives, Product Owners, Business Analysts

**Focus**: Business value, ROI, metrics, use cases

**Slide Structure**:
1. Title Slide
2. Agenda
3. **Section Divider** - Business Overview (NEW)
4. Executive Summary - Key metrics, business value
5. Problem & Solution - Problem statement, solution overview
6. Use Cases - Primary use cases with success metrics
7. Business Value - ROI, efficiency gains, revenue impact
8. **Metrics Slide** - Key Performance Metrics (NEW)
9. System Availability & Performance - SLA commitments
10. Operational Support - Monitoring, support model
11. **Quote Slide** - Success Story/Testimonial (NEW)
12. Architecture Principles - Top 5 principles
13. Summary & Q&A

**Data Sources**: Sections 1, 2, 10, 11 (~400 lines, 80% context reduction)

**New Features**: Section dividers for visual breaks, large metric cards, customer testimonials

### Architecture Team (16 slides)

**Target Audience**: Software Architects, Tech Leads, Senior Engineers

**Focus**: Technical design, components, patterns, decisions

**Slide Structure**:
1. Title Slide
2. Agenda
3. Executive Summary - System purpose, technical metrics
4. Architecture Principles - All 9-10 principles
5. Architecture Layers - Layer diagram, descriptions
6. Component Overview - Component catalog
7. Technology Stack - Backend, frontend, data, infrastructure
8. Data Flow Patterns - How data moves
9. Integration Points - External APIs, dependencies
10. Security Architecture - Auth, encryption, controls
11. Key Architecture Decisions - Top 5 ADRs
12. Summary & Q&A

**Data Sources**: Sections 3, 4, 5, 6, 7, 8, 12 (~1000 lines, 50% context reduction)

### Compliance/Governance (11 slides)

**Target Audience**: Compliance Officers, Security Teams, Auditors

**Focus**: Security, governance, operational standards

**Slide Structure**:
1. Title Slide
2. Agenda
3. Executive Summary - System purpose, availability commitment
4. Security Architecture Overview - Security layers
5. Authentication & Authorization - Auth mechanisms, access controls
6. Data Protection - Encryption, data classification
7. Operational Excellence - Monitoring, incident response
8. Disaster Recovery & Business Continuity - RTO/RPO, backup
9. Integration Security - API security, external dependencies
10. Technology Compliance - Approved technologies
11. Summary & Q&A

**Data Sources**: Sections 7, 8, 9, 10, 11, 12 (~700 lines, 65% context reduction)

## Slide Type Reference

The presentation generator supports **11 slide types** with the Dark Blue Professional Theme. Each type serves a specific purpose and follows a consistent visual design.

### Color Palette

**Dark Blue Professional Theme** (Version 1.6.0+):
- **PRIMARY** (#0A1E3D): Deep navy blue - main backgrounds, headers
- **SECONDARY** (#2E5C8A): Medium blue - secondary elements
- **ACCENT** (#4A90E2): Bright blue - CTAs, highlights, metrics
- **SURFACE** (#FFFFFF): White backgrounds for contrast
- **MUTED** (#F5F7FA): Light blue-gray for cards and subtle backgrounds
- **DARK_GRAY** (#374151): Body text color

**Legacy Colors** (backward compatible):
- **BLUE** → Alias to PRIMARY
- **GREEN** (#10B981): Highlights
- **GRAY** (#6B7280): Secondary text

### 1. Title Slide

**Type**: `"title"`

**Purpose**: Opening slide with presentation title and stakeholder info

**Visual**: Full PRIMARY background (#0A1E3D) with white text

**JSON Configuration**:
```json
{
  "id": 1,
  "type": "title",
  "title_source": "system_name",
  "subtitle_key": "title_suffix.business"
}
```

**Generated From**: System name from ARCHITECTURE.md + stakeholder type

**Example**: "E-Commerce Platform - Architecture Overview for Business Stakeholders"

---

### 2. Agenda Slide

**Type**: `"agenda"`

**Purpose**: Table of contents for the presentation

**Visual**: PRIMARY header bar with bullet list of agenda items

**JSON Configuration**:
```json
{
  "id": 2,
  "type": "agenda",
  "title_key": "slide_titles.agenda",
  "items_key": "agenda_items.business"
}
```

**Generated From**: `language_{lang}.json` → `agenda_items.{stakeholder}`

**Bilingual**: Agenda items are fully translated

---

### 3. Content Slide

**Type**: `"content"` (default)

**Purpose**: Standard slide with header bar and bullet points

**Visual**: PRIMARY header bar (15% height), bullet content below

**JSON Configuration**:
```json
{
  "id": 3,
  "type": "content",
  "title_key": "slide_titles.executive_summary",
  "data_sources": [
    {
      "section": 1,
      "subsection": "Key Metrics",
      "extract_type": "bullets"
    }
  ]
}
```

**Data Sources**: Extracted from ARCHITECTURE.md sections

**Best For**: Lists, feature descriptions, technical details

---

### 4. Section Divider Slide (NEW)

**Type**: `"section_divider"`

**Purpose**: Visual break between major sections

**Visual**: Full PRIMARY background with ACCENT badge showing section number

**JSON Configuration**:
```json
{
  "id": 2.5,
  "type": "section_divider",
  "section_number": "01",
  "title_key": "slide_titles.business_overview"
}
```

**Example**: Badge shows "SECTION 01" with title "Business Overview"

**Best For**: Introducing new chapters, creating visual breaks

**Stakeholders Using**: All (Business, Architecture, Compliance)

---

### 5. Single Focus Slide (NEW)

**Type**: `"single_focus"`

**Purpose**: Emphasize one key message or takeaway

**Visual**: Minimal design with large centered text (36pt)

**JSON Configuration**:
```json
{
  "id": 5.5,
  "type": "single_focus",
  "title_key": "slide_titles.key_takeaway",
  "data_sources": [...]
}
```

**Data Mapping**:
- `content[0]` → Main key message (large, bold)
- `content[1]` → Optional sub-message (smaller text)

**Best For**: Key takeaways, mission statements, important announcements

---

### 6. Comparison Slide (NEW)

**Type**: `"comparison"`

**Purpose**: Side-by-side comparison of two concepts

**Visual**: Two columns with colored headers (SECONDARY left, ACCENT right)

**JSON Configuration**:
```json
{
  "id": 5.5,
  "type": "comparison",
  "title_key": "slide_titles.architecture_comparison",
  "left_title": "Current State",
  "right_title": "Target State",
  "data_sources": [
    {
      "section": 4,
      "subsection": "Current vs Target",
      "extract_type": "comparison",
      "fallback": {
        "left": ["Monolithic architecture", "Single database", "Manual deployment"],
        "right": ["Microservices architecture", "Distributed data", "Automated CI/CD"]
      }
    }
  ]
}
```

**Data Mapping**:
- Content split at midpoint → left/right columns
- OR use `fallback.left` and `fallback.right` if no content

**Best For**: Before/after scenarios, technology choices, preventive vs detective controls

**Stakeholders Using**: Architecture (current vs target), Compliance (preventive vs detective)

---

### 7. Process/Timeline Slide (NEW)

**Type**: `"process"`

**Purpose**: Show sequential steps or workflow

**Visual**: Horizontal flow with numbered circles (ACCENT) and arrows (→)

**JSON Configuration**:
```json
{
  "id": 7.5,
  "type": "process",
  "title_key": "slide_titles.deployment_process",
  "data_sources": [
    {
      "section": 11,
      "subsection": "Deployment Pipeline",
      "extract_type": "process_steps",
      "fallback_steps": [
        "Code Commit & PR Review",
        "Automated Testing",
        "Security Scanning",
        "Staging Deployment",
        "Production Release"
      ]
    }
  ]
}
```

**Supports**: 3-5 steps (optimal: 4-5)

**Data Mapping**: Each array item becomes a numbered step

**Best For**: Deployment pipelines, user journeys, development workflows

**Stakeholders Using**: Architecture

---

### 8. Explanation + Visual Slide (NEW)

**Type**: `"explanation_visual"`

**Purpose**: Explain concept with diagram placeholder

**Visual**: Split 50/50 - bullets (left), diagram placeholder (right)

**JSON Configuration**:
```json
{
  "id": 9.5,
  "type": "explanation_visual",
  "title_key": "slide_titles.data_architecture",
  "visual_note": "[Add data flow diagram from Section 6]",
  "data_sources": [
    {
      "section": 6,
      "subsection": "Data Architecture",
      "extract_type": "bullets"
    }
  ]
}
```

**Visual Placeholder**: Light gray box (MUTED) with italic note for diagram

**Best For**: Complex architectures, data flows, system diagrams

**Post-Processing**: Add Mermaid diagrams or screenshots manually in PowerPoint

**Stakeholders Using**: Architecture

---

### 9. Metrics Slide (NEW)

**Type**: `"metrics"`

**Purpose**: Highlight 3 key performance metrics

**Visual**: 3 cards with large ACCENT numbers (44pt) on MUTED backgrounds

**JSON Configuration**:
```json
{
  "id": 6.5,
  "type": "metrics",
  "title_key": "slide_titles.key_metrics",
  "data_sources": [
    {
      "section": 1,
      "subsection": "Key Metrics",
      "extract_type": "metrics_table",
      "metrics": [
        {"field": "Concurrent Users", "label_key": "metrics.concurrent_users"},
        {"field": "Availability", "label_key": "metrics.availability"},
        {"field": "Response Time", "label_key": "metrics.response_time"}
      ]
    }
  ]
}
```

**Data Mapping**:
- Searches content for lines containing `field` value
- Extracts value after `:` or `|` separator
- Translates label from `label_key`

**Example Output**:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   10,000+   │  │    99.9%    │  │   <200ms    │
│  Concurrent │  │   System    │  │Avg Response │
│    Users    │  │Availability │  │    Time     │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Best For**: KPIs, performance metrics, success metrics

**Stakeholders Using**: Business

---

### 10. Quote/Testimonial Slide (NEW)

**Type**: `"quote"`

**Purpose**: Feature a quote or customer testimonial

**Visual**: Full PRIMARY background with large italic quote (28pt), ACCENT quotation marks (72pt)

**JSON Configuration**:
```json
{
  "id": 8.5,
  "type": "quote",
  "title_key": "slide_titles.testimonial",
  "data_sources": [
    {
      "section": 2,
      "subsection": "Success Stories",
      "extract_type": "quote",
      "fallback_quote": "This solution has transformed our business operations and significantly improved our efficiency.",
      "fallback_attribution": "Business Stakeholder"
    }
  ]
}
```

**Data Mapping**:
- `content[0]` → Quote text
- `content[1]` → Attribution (optional)

**Best For**: Customer testimonials, stakeholder endorsements, success stories

**Stakeholders Using**: Business

---

### 11. Call to Action Slide (NEW)

**Type**: `"call_to_action"`

**Purpose**: Closing slide with contact information

**Visual**: PRIMARY background with main message (40pt) and contact info, ACCENT bottom bar

**JSON Configuration**:
```json
{
  "id": 10.5,
  "type": "call_to_action",
  "title_key": "slide_titles.compliance_contact",
  "data_sources": [
    {
      "section": 1,
      "subsection": "Contacts",
      "extract_type": "contact_info",
      "fallback_message": "Questions?",
      "fallback_contact": [
        "Security Team: security@company.com",
        "Compliance Officer: compliance@company.com",
        "Documentation: docs.company.com/compliance"
      ]
    }
  ]
}
```

**Data Mapping**:
- `content[0]` → Main CTA message
- `content[1..]` → Contact information (multi-line)

**Best For**: Final slides, contact information, next steps

**Stakeholders Using**: Compliance

---

### 12. Summary Slide

**Type**: `"summary"`

**Purpose**: Recap key points and Q&A

**Visual**: Standard content slide with summary bullets

**JSON Configuration**:
```json
{
  "id": 10,
  "type": "summary",
  "title_key": "slide_titles.summary",
  "include_next_steps": true
}
```

**Best For**: Presentation conclusion, key takeaways, Q&A

**Stakeholders Using**: All

---

## Slide Type Usage by Stakeholder

### Business Stakeholders (13 slides)

**New Slide Types Used**:
- Section Divider (id 2.5) - "Business Overview"
- Metrics (id 6.5) - "Key Performance Metrics"
- Quote (id 8.5) - "Success Story"

**Total**: 10 content + 3 new = 13 slides

---

### Architecture Team (16 slides)

**New Slide Types Used**:
- Section Divider (id 3.5) - "Technical Overview"
- Comparison (id 5.5) - "Architecture Evolution" (Current vs Target)
- Process (id 7.5) - "Deployment Process"
- Explanation + Visual (id 9.5) - "Data Architecture"

**Total**: 12 content + 4 new = 16 slides

---

### Compliance/Governance (14 slides)

**New Slide Types Used**:
- Section Divider (id 2.5) - "Security & Compliance"
- Comparison (id 4.5) - "Security Controls" (Preventive vs Detective)
- Call to Action (id 10.5) - "Compliance & Contact"

**Total**: 11 content + 3 new = 14 slides

---

## Customizing Slide Templates

### Adding a New Slide

1. **Edit Template JSON** (e.g., `slide_templates_business.json`)

2. **Add slide configuration** with decimal ID for insertion:

```json
{
  "id": 6.5,
  "type": "metrics",
  "title_key": "slide_titles.custom_metrics",
  "data_sources": [...]
}
```

3. **Add translation** in `language_en.json` and `language_es.json`:

```json
{
  "slide_titles": {
    "custom_metrics": "Custom Performance Metrics"
  }
}
```

4. **Update slide_count** in template JSON:

```json
{
  "stakeholder_type": "business",
  "slide_count": 14,  // Increment by 1
  ...
}
```

5. **Regenerate presentation**

### Supported Slide Types

| Type | Purpose | Visual | Data Required |
|------|---------|--------|---------------|
| `title` | Opening slide | Full PRIMARY bg | System name |
| `agenda` | Table of contents | Header + bullets | Agenda items |
| `content` | Standard slide | Header + bullets | Section content |
| `section_divider` | Section break | Full bg + badge | Section # + title |
| `single_focus` | Key message | Large centered text | 1-2 lines |
| `comparison` | Side-by-side | Two columns | Left/right content |
| `process` | Sequential steps | Horizontal flow | 3-5 steps |
| `explanation_visual` | Text + diagram | Split 50/50 | Bullets + note |
| `metrics` | KPI dashboard | 3 metric cards | Field/value pairs |
| `quote` | Testimonial | Full bg + quote | Quote + attribution |
| `call_to_action` | Contact info | CTA + contacts | Message + contacts |
| `summary` | Recap + Q&A | Header + bullets | Summary points |

---

## Language Support

### Supported Languages

- **English (EN)**: Default
- **Spanish (ES)**: Español

### Translation Scope

**What Gets Translated**:
- ✅ Slide titles
- ✅ Section headers
- ✅ Labels (Version, Status, Next Steps, etc.)
- ✅ UI elements (Agenda, Summary, Q&A)
- ✅ Standard messages

**What Stays in Original Language**:
- ❌ System names (extracted from ARCHITECTURE.md)
- ❌ Component names
- ❌ Technology names (Java, PostgreSQL, AWS, etc.)
- ❌ Metric values
- ❌ Code snippets
- ❌ URLs

### Example

**Spanish Business Presentation**:
- Slide title: "Resumen Ejecutivo" (translated)
- Content: "Read TPS: 500" (kept as-is from ARCHITECTURE.md)
- Label: "Versión: 1.0" (translated)

## Customization

### Modifying Slide Templates

Slide templates are defined in JSON files:
- `/presentation/slide_templates_business.json`
- `/presentation/slide_templates_architecture.json`
- `/presentation/slide_templates_compliance.json`

**Example**: Add a new slide to Business template

```json
{
  "id": 11,
  "type": "content",
  "title_key": "slide_titles.custom_slide",
  "data_sources": [
    {
      "section": 8,
      "subsection": "Technology Stack",
      "extract_type": "table"
    }
  ]
}
```

Then add translation to `language_en.json`:
```json
{
  "slide_titles": {
    "custom_slide": "Technology Overview"
  }
}
```

### Adding New Languages

1. Create language JSON file: `/presentation/language_{code}.json`
2. Copy structure from `language_en.json`
3. Translate all strings
4. Update `presentation-generator.ts` to support new language code

### Customizing Colors

Colors are defined in `create_presentation.py`:
```python
BLUE = RGBColor(30, 58, 138)   # #1E3A8A
GREEN = RGBColor(16, 185, 129)  # #10B981
GRAY = RGBColor(107, 114, 128)  # #6B7280
```

To customize, modify these constants or create new ones.

### Adding Company Branding

**After Generation**:
1. Open generated .pptx in PowerPoint
2. Add company logo to master slide
3. Update color scheme if needed
4. Modify footer with company information
5. Save as template for future use

## Troubleshooting

### Error: ARCHITECTURE.md not found

**Problem**: File doesn't exist at specified path

**Solution**:
```bash
# Verify file exists
ls -la ARCHITECTURE.md

# Check current directory
pwd

# Provide full path
bun run utils/presentation-generator.ts /full/path/to/ARCHITECTURE.md \
  --stakeholder business
```

### Warning: Document Index not found

**Problem**: Document Index missing or incomplete

**Solution**:
1. Open ARCHITECTURE.md
2. Verify Document Index exists at lines 1-50
3. Should contain all 12 sections with line ranges
4. Run Workflow 4 (Automatic Index Updates) if needed

**Example Document Index**:
```markdown
## Document Index

1. Executive Summary: Lines 25-87
2. System Overview: Lines 88-201
3. Architecture Principles: Lines 202-450
...
12. Architecture Decision Records: Lines 2601-2800
```

### Error: Missing sections

**Problem**: Required sections not found in ARCHITECTURE.md

**Solution**:
1. Complete missing sections in ARCHITECTURE.md
2. Ensure all 12 sections are present
3. Update Document Index
4. Regenerate presentation

### Slides show "[Not documented]"

**Problem**: Data not found in specified sections

**Solution**:
1. Check that subsections exist (e.g., "Key Metrics" in Section 1)
2. Verify data is formatted correctly (bullets, tables)
3. Complete missing subsections
4. Regenerate presentation

### ModuleNotFoundError: No module named 'pptx'

**Problem**: python-pptx library not installed

**Solution**:
```bash
pip install python-pptx
```

### ImportError: cannot import name 'add_title_slide'

**Problem**: create_presentation.py not found or path incorrect

**Solution**:
```bash
# Verify create_presentation.py exists
ls -la /home/shadowx4fox/solutions-architect-skills/create_presentation.py

# Run from correct directory
cd /home/shadowx4fox/solutions-architect-skills
bun run utils/presentation-generator.ts ARCHITECTURE.md --stakeholder business
```

## Best Practices

### Before Generating Presentations

1. ✅ Complete all 12 sections in ARCHITECTURE.md
2. ✅ Update Document Index (Workflow 4)
3. ✅ Verify metric consistency (Workflow 5)
4. ✅ Review content for accuracy
5. ✅ Ensure subsections exist (Key Metrics, Business Value, etc.)

### After Generating Presentations

1. ✅ Review generated slides for accuracy
2. ✅ Verify data extraction is correct
3. ✅ Add company branding/logos
4. ✅ Customize content for specific audience
5. ✅ Test presentation before delivery

### Regenerating Presentations

**When to Regenerate**:
- Architecture changes in ARCHITECTURE.md
- New ADRs added
- Metrics updated
- Security controls modified
- Technology stack changes

**How to Regenerate**:
```bash
# Same command as initial generation
bun run utils/presentation-generator.ts ARCHITECTURE.md \
  --stakeholder business \
  --language en

# Overwrites existing file
# Backup old version if needed: mv presentation.pptx presentation_backup.pptx
```

### Versioning Presentations

**Option 1: Date Suffix**
```bash
bun run utils/presentation-generator.ts ARCHITECTURE.md \
  --stakeholder business \
  --output /presentations/ARCHITECTURE_Business_EN_2025-12-21.pptx
```

**Option 2: Git Versioning**
```bash
# Commit presentations to version control
git add presentations/
git commit -m "Update architecture presentations (v1.5)"
git tag presentation-v1.5
```

## Examples

### Example 1: Generate Business Presentation

**Scenario**: Need to present system value to executives

**Command**:
```bash
bun run utils/presentation-generator.ts ./ARCHITECTURE.md \
  --stakeholder business \
  --language en
```

**Output**:
- File: `/presentations/ARCHITECTURE_Business_EN.pptx`
- Slides: 10 slides focusing on business value, ROI, use cases
- Duration: ~15 minutes

### Example 2: Generate Spanish Compliance Presentation

**Scenario**: Compliance review with Spanish-speaking auditors

**Command**:
```bash
bun run utils/presentation-generator.ts ./ARCHITECTURE.md \
  --stakeholder compliance \
  --language es
```

**Output**:
- File: `/presentations/ARCHITECTURE_Compliance_ES.pptx`
- Slides: 11 slides with Spanish UI (content in original language)
- Focus: Security, governance, operational standards

### Example 3: Batch Generate All Presentations

**Scenario**: Generate presentations for all stakeholders

**Script**:
```bash
#!/bin/bash

ARCH_FILE="./ARCHITECTURE.md"

# Business (English)
bun run utils/presentation-generator.ts $ARCH_FILE \
  --stakeholder business --language en

# Architecture (English)
bun run utils/presentation-generator.ts $ARCH_FILE \
  --stakeholder architecture --language en

# Compliance (Spanish)
bun run utils/presentation-generator.ts $ARCH_FILE \
  --stakeholder compliance --language es

echo "All presentations generated successfully!"
```

## FAQ

### Q: Can I add more than 12 slides?

**A**: Yes, modify the slide template JSON file to add more slides. Update the `slide_count` field and add new slide configurations to the `slides` array.

### Q: Can I change the slide order?

**A**: Yes, reorder slides in the template JSON file by changing the `id` field. Slides are generated in order of `id`.

### Q: Can I use this with other architecture documentation formats?

**A**: No, this tool is specifically designed for ARCHITECTURE.md files following the 12-section template. Other formats require code modifications.

### Q: How do I add support for French/German/other languages?

**A**: Create a new language_{code}.json file with translations, then modify `presentation-generator.ts` to accept the new language code in the validation.

### Q: Can I generate PDF instead of PowerPoint?

**A**: Not directly. Generate .pptx first, then convert to PDF using PowerPoint's "Save As PDF" feature or a conversion tool.

### Q: What if my ARCHITECTURE.md is very large (5000+ lines)?

**A**: No problem! The generator uses context-efficient loading and only loads relevant sections. Document size doesn't significantly impact generation time.

### Q: Can I automate presentation generation in CI/CD?

**A**: Yes! Add the command to your CI/CD pipeline:
```yaml
# .github/workflows/docs.yml
- name: Generate Architecture Presentations
  run: |
    bun run utils/presentation-generator.ts ./docs/ARCHITECTURE.md \
      --stakeholder business --language en
```

### Q: How do I customize the corporate colors?

**A**: Edit `/create_presentation.py` and modify the color constants (BLUE, GREEN, GRAY). Regenerate presentations to apply new colors.

## Support

For issues, questions, or feature requests:

1. Check this guide first
2. Review Workflow 8 in SKILL.md
3. Inspect slide template JSON files
4. Verify ARCHITECTURE.md structure
5. Report issues at: https://github.com/anthropics/claude-code/issues

## Related Documentation

- **Workflow 8**: Full workflow documentation in SKILL.md
- **ARCHITECTURE_DOCUMENTATION_GUIDE.md**: Template for ARCHITECTURE.md
- **ADR_GUIDE.md**: Architectural Decision Records format
- **language_en.json**: English translations reference
- **language_es.json**: Spanish translations reference
- **slide_templates_*.json**: Slide structure definitions

---

**Version**: 1.0
**Plugin**: Solutions Architect Skills v1.5.23
**Last Updated**: 2025-12-21
