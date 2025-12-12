### A.2 Validation Methodology

**Validation Process**:

1. **Completeness Check (40% weight)**:
   - Counts filled data points across all {{compliance_prefix}} requirements
   - Formula: (Filled fields / Total required fields) × 10
   - Example: 8 out of 10 fields = 8.0/10 completeness

2. **Compliance Check (50% weight)**:
   - Evaluates each validation item as PASS/FAIL/N/A/UNKNOWN
   - Formula: (PASS + N/A + EXCEPTION items) / Total items × 10
   - **CRITICAL**: N/A items MUST be included in numerator
   - Example: 6 PASS + 2 N/A + 0 EXCEPTION out of 10 items = (6+2)/10 × 10 = 8.0/10

3. **Quality Check (10% weight)**:
   - Assesses source traceability (ARCHITECTURE.md section references)
   - Verifies explanation quality and actionable notes
   - Formula: (Items with valid sources / Total items) × 10

4. **Final Score Calculation**:
   ```
   Final Score = (Completeness × 0.4) + (Compliance × 0.5) + (Quality × 0.1)
   ```

**Outcome Determination**:
| Score Range | Document Status | Review Actor | Action |
|-------------|----------------|--------------|--------|
| 8.0-10.0 | Approved | System (Auto-Approved) | Ready for implementation |
| 7.0-7.9 | In Review | {{review_board}} | Manual review required |
| 5.0-6.9 | Draft | Architecture Team | Address gaps before review |
| 0.0-4.9 | Rejected | N/A (Blocked) | Cannot proceed - critical {{domain_name}} gaps |
