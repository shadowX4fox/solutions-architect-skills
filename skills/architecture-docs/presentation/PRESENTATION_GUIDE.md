# Architecture Presentation Generation Guide

## Overview

The presentation generation feature automatically creates professional PowerPoint presentations from your ARCHITECTURE.md files. Generate stakeholder-specific presentations in English or Spanish with a single command.

**Version**: 1.0
**Last Updated**: 2025-12-21

## Features

- **3 Stakeholder Types**: Business, Architecture, Compliance
- **Bilingual Support**: English and Spanish
- **Context-Efficient**: Loads only required sections (50-80% reduction)
- **Automated Slide Generation**: 10-12 slides per presentation
- **Professional Design**: Corporate color scheme with consistent branding
- **Template-Based**: Predefined slide structures for each stakeholder type

## Quick Start

### Prerequisites

1. **ARCHITECTURE.md file** exists and is complete
2. **Document Index** is present (lines 1-50)
3. **Python 3.8+** with python-pptx library installed
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
python utils/presentation_generator.py ARCHITECTURE.md \
  --stakeholder business \
  --language en

# Architecture presentation in Spanish
python utils/presentation_generator.py ARCHITECTURE.md \
  --stakeholder architecture \
  --language es

# Compliance presentation with custom output
python utils/presentation_generator.py ARCHITECTURE.md \
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

### Business Stakeholders (10 slides)

**Target Audience**: Executives, Product Owners, Business Analysts

**Focus**: Business value, ROI, metrics, use cases

**Slide Structure**:
1. Title Slide
2. Agenda
3. Executive Summary - Key metrics, business value
4. Problem & Solution - Problem statement, solution overview
5. Use Cases - Primary use cases with success metrics
6. Business Value - ROI, efficiency gains, revenue impact
7. System Availability & Performance - SLA commitments
8. Operational Support - Monitoring, support model
9. Architecture Principles - Top 5 principles
10. Summary & Q&A

**Data Sources**: Sections 1, 2, 10, 11 (~400 lines, 80% context reduction)

### Architecture Team (12 slides)

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
4. Update `presentation_generator.py` to support new language code

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
python utils/presentation_generator.py /full/path/to/ARCHITECTURE.md \
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
python utils/presentation_generator.py ARCHITECTURE.md --stakeholder business
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
python utils/presentation_generator.py ARCHITECTURE.md \
  --stakeholder business \
  --language en

# Overwrites existing file
# Backup old version if needed: mv presentation.pptx presentation_backup.pptx
```

### Versioning Presentations

**Option 1: Date Suffix**
```bash
python utils/presentation_generator.py ARCHITECTURE.md \
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
python utils/presentation_generator.py ./ARCHITECTURE.md \
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
python utils/presentation_generator.py ./ARCHITECTURE.md \
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
python utils/presentation_generator.py $ARCH_FILE \
  --stakeholder business --language en

# Architecture (English)
python utils/presentation_generator.py $ARCH_FILE \
  --stakeholder architecture --language en

# Compliance (Spanish)
python utils/presentation_generator.py $ARCH_FILE \
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

**A**: Create a new language_{code}.json file with translations, then modify `presentation_generator.py` to accept the new language code in the validation.

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
    python utils/presentation_generator.py ./docs/ARCHITECTURE.md \
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
