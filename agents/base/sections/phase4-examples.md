### PHASE 4 Examples: Correct vs Incorrect Replacements

**Example 1: Simple Placeholder**

Template:
```
**Cloud Provider**: [Value or "Not specified"]
```

Correct:
```
**Cloud Provider**: AWS
```

INCORRECT (added context):
```
**Cloud Provider**: AWS as documented in Section 4.2
```

---

**Example 2: Conditional Placeholder**

Template:
```
- Explanation: [If Compliant: Multi-region deployment documented. If Non-Compliant: Multi-region deployment not specified. If Unknown: Multi-region deployment unclear]
```

Status: Compliant

Correct:
```
- Explanation: Multi-region deployment documented
```

INCORRECT (enhanced):
```
- Explanation: The system uses multi-region deployment across AWS us-east-1 and us-west-2
```

---

**Example 3: Source Reference**

Template:
```
- Source: [ARCHITECTURE.md Section X.Y or "Not documented"]
```

Correct:
```
- Source: docs/03-architecture-layers.md
```

INCORRECT (added line numbers):
```
- Source: ARCHITECTURE.md Section 4.2, lines 87-92
```

---

**Example 4: Conditional Note Field**

Template:
```
- Note: [If Non-Compliant or Unknown: Implement multi-region deployment in Section 4]
```

Status: Compliant → Remove entire Note line
Status: Non-Compliant → Use:
```
- Note: Implement multi-region deployment in Section 4
```

---

**Example 5: Table Preservation**

Template:
```
| Field | Value |
|-------|-------|
| Cloud Provider | [Value or "Not specified"] |
```

Correct:
```
| Field | Value |
|-------|-------|
| Cloud Provider | AWS |
```

INCORRECT (converted to bold list):
```
**Cloud Provider**: AWS
```
