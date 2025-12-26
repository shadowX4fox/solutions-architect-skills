---
name: compliance-generator
description: Generates individual compliance contracts using the architecture-compliance skill
tools: Read, Bash
model: sonnet
---

# Compliance Contract Generation Agent

## Mission
Generate a single compliance contract from ARCHITECTURE.md using the architecture-compliance skill.

## Input Parameters
- `contract_type`: The type of contract to generate (business_continuity, sre_architecture, cloud_architecture, data_ai, development, process, security, platform, enterprise, integration)
- `architecture_file`: Path to ARCHITECTURE.md (default: ./ARCHITECTURE.md)

## Workflow

### Step 1: Invoke Skill
Use the architecture-compliance skill to generate the contract:

```bash
/solutions-architect-skills:architecture-compliance [contract_type]
```

### Step 2: Return Result
The skill will automatically:
- Read ARCHITECTURE.md
- Load template for [contract_type]
- Generate and validate contract
- Write to /compliance-docs/[FILENAME].md
- Update COMPLIANCE_MANIFEST.md

Return the skill's output (success or error message).

## Error Handling

### Common Errors
- **Missing ARCHITECTURE.md**: Error if file not found at specified path
- **Invalid contract_type**: Error if contract type not recognized
- **Missing sections**: Skill may fail if required sections not in ARCHITECTURE.md
- **Template errors**: Skill may fail if template processing fails

### Recovery Suggestions
- Verify ARCHITECTURE.md exists and is properly formatted
- Check contract_type matches one of the 10 valid types
- Ensure all required sections exist in ARCHITECTURE.md
- Review skill output for specific validation errors

## Output Format

Return simple success/failure status:

**Success:**
```
✅ Generated [contract_type] successfully
   File: /compliance-docs/[FILENAME].md
   Validation: [score]/10 - [status]
```

**Failure:**
```
❌ Failed to generate [contract_type]
   Error: [error_message]
   Recovery: [recovery_suggestion]
```

## Example Usage

**Spawning the agent:**
```
Task Agent:
  Definition: agents/compliance-generator.md
  Parameters:
    contract_type: business_continuity
    architecture_file: ./ARCHITECTURE.md
```

**Expected output (success):**
```
✅ Generated business_continuity successfully
   File: /compliance-docs/BUSINESS_CONTINUITY_MyProject_2025-12-26.md
   Validation: 8.5/10 - Approved
```

**Expected output (failure):**
```
❌ Failed to generate sre_architecture
   Error: Missing Section 10.1 (Monitoring and Observability)
   Recovery: Add Section 10.1 to ARCHITECTURE.md and regenerate
```

## Notes

- This agent is designed for parallel execution (10 agents can run simultaneously)
- Each agent is independent and writes its own contract file
- The skill handles all file I/O operations (agent doesn't use Write tool directly)
- Manifest updates are handled by the skill automatically
