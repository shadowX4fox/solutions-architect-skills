# Validation Outcome Examples

This document provides example scenarios for each of the 4 validation outcome tiers. These examples illustrate how the validation system scores compliance documents and determines approval status.

---

## Tier 1: AUTO_APPROVE (Score 8.0-10.0)

### Example: Development Architecture - Perfect Compliance

**Scenario**: A Development Architecture contract with comprehensive ARCHITECTURE.md documentation and full stack compliance.

**Validation Results**:
```json
{
  "final_score": 9.7,
  "outcome": {
    "overall_status": "PASS",
    "document_status": "Approved",
    "review_actor": "System (Auto-Approved)",
    "action": "AUTO_APPROVE",
    "message": "High confidence validation. Contract automatically approved."
  },
  "validation_date": "2025-12-07",
  "validation_evaluator": "Claude Code (Automated Validation Engine)",
  "scores": {
    "completeness": 9.5,
    "compliance": 10.0,
    "quality": 9.0
  }
}
```

**Score Breakdown**:
- **Completeness (9.5/10)**: 19 of 20 required data points present in ARCHITECTURE.md (95%)
- **Compliance (10.0/10)**: 25 PASS, 1 N/A, 0 FAIL, 0 UNKNOWN out of 26 items
  - Calculation: (25 PASS + 1 N/A) / 26 = 26/26 = 10.0/10 (N/A counted as fully compliant)
- **Quality (9.0/10)**: All data points have source traceability with section and line numbers

**Final Calculation**:
```
Final Score = (9.5 × 0.4) + (10.0 × 0.5) + (9.0 × 0.1)
            = 3.8 + 5.0 + 0.9
            = 9.7/10
```

**Document Control Output**:
```markdown
| Status | Approved |
| Validation Score | 9.7/10 |
| Validation Status | PASS |
| Validation Date | 2025-12-07 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | System (Auto-Approved) |
| Approval Authority | Technical Architecture Review Board |
```

**Outcome**: Contract is automatically approved without human review. Ready for implementation.

---

### Example: Cloud Architecture - Custom Weights (35%/55%/10%)

**Scenario**: A Cloud Architecture contract demonstrating template-specific weights that emphasize compliance over completeness.

**Validation Results**:
```json
{
  "final_score": 8.9,
  "outcome": {
    "overall_status": "PASS",
    "document_status": "Approved",
    "review_actor": "System (Auto-Approved)",
    "action": "AUTO_APPROVE",
    "message": "High confidence validation. Contract automatically approved."
  },
  "validation_date": "2025-12-13",
  "validation_evaluator": "Claude Code (Automated Validation Engine)",
  "scores": {
    "completeness": 9.3,
    "compliance": 8.6,
    "quality": 9.0
  },
  "weights": {
    "completeness": 0.35,
    "compliance": 0.55,
    "quality": 0.10
  }
}
```

**Score Breakdown**:
- **Completeness (9.3/10)**: 26 of 28 required data points present in ARCHITECTURE.md (93%)
  - Missing: Cost tracking/monitoring strategy, Cost optimization strategies
- **Compliance (8.6/10)**: 22 PASS, 2 N/A, 2 FAIL, 2 UNKNOWN out of 28 items
  - Calculation: (22 PASS + 2 N/A) / 28 = 24/28 × 10 = 8.57 ≈ 8.6/10
  - Non-Compliant: Cost tracking not documented, Cost optimization strategies missing
  - Unknown: Well-Architected Framework mapping incomplete, Organizational cloud standards need validation
- **Quality (9.0/10)**: Excellent source traceability with section and line numbers for all data points

**Final Calculation with Cloud-Specific Weights**:
```
Weights from cloud_architecture_validation.json:
- W_completeness = 0.35 (35%)
- W_compliance = 0.55 (55%) [higher emphasis on compliance]
- W_quality = 0.10 (10%)

Final Score = (Completeness × W_completeness) + (Compliance × W_compliance) + (Quality × W_quality)
            = (9.3 × 0.35) + (8.6 × 0.55) + (9.0 × 0.10)
            = 3.255 + 4.73 + 0.9
            = 8.885
            = 8.9/10 (rounded to 1 decimal)
```

**Key Insight**: Despite having 2 non-compliant items and slightly lower completeness than the Development Architecture example (9.3 vs 9.5), this Cloud Architecture contract still achieves a high score (8.9) because:
1. The compliance weight is higher (55% vs 50%)
2. The compliance score is strong (8.6/10 with 79% compliant items)
3. Cloud Architecture prioritizes compliance adherence over documentation completeness

**Document Control Output**:
```markdown
| Status | Approved |
| Validation Score | 8.9/10 |
| Validation Status | PASS |
| Validation Date | 2025-12-13 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | System (Auto-Approved) |
| Approval Authority | Cloud Architecture Review Board |
```

**Outcome**: Contract is automatically approved without human review. Ready for implementation.

**Threshold Analysis**:
- Score 8.9 falls in 8.0-10.0 range → AUTO_APPROVE (✓)
- If score were 7.9 → Would require MANUAL_REVIEW
- If score were 8.0 exactly → AUTO_APPROVE (inclusive lower bound)

---

## Tier 2: MANUAL_REVIEW (Score 7.0-7.9)

### Example: SRE Architecture - Good Compliance with Minor Gaps

**Scenario**: An SRE Architecture contract with solid ARCHITECTURE.md documentation but missing a few optional monitoring details.

**Validation Results**:
```json
{
  "final_score": 7.8,
  "outcome": {
    "overall_status": "PASS",
    "document_status": "In Review",
    "review_actor": "SRE Leadership/Operations",
    "action": "MANUAL_REVIEW",
    "message": "Validation passed with small gaps. Ready for human review."
  },
  "validation_date": "2025-12-07",
  "validation_evaluator": "Claude Code (Automated Validation Engine)",
  "scores": {
    "completeness": 8.0,
    "compliance": 7.5,
    "quality": 8.0
  }
}
```

**Score Breakdown**:
- **Completeness (8.0/10)**: 16 of 20 required data points present (80%)
  - Missing: Error budget calculation, On-call rotation schedule, Incident escalation matrix, Runbook repository
- **Compliance (7.5/10)**: 12 PASS, 3 N/A, 0 FAIL, 1 UNKNOWN out of 16 items
  - UNKNOWN: Monitoring dashboard URL not specified
- **Quality (8.0/10)**: Most data points have source traceability, a few missing line numbers

**Final Calculation**:
```
Final Score = (8.0 × 0.4) + (7.5 × 0.5) + (8.0 × 0.1)
            = 3.2 + 3.75 + 0.85
            = 7.8/10
```

**Document Control Output**:
```markdown
| Status | In Review |
| Validation Score | 7.8/10 |
| Validation Status | PASS |
| Validation Date | 2025-12-07 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | SRE Leadership/Operations |
| Approval Authority | SRE Leadership/Operations |
```

**Outcome**: Contract validation passed, but requires manual review by SRE Leadership. Small gaps are acceptable pending human review and approval.

**Recommendations**:
1. Add missing error budget calculation to ARCHITECTURE.md Section 10.2
2. Define on-call rotation in Section 11.2
3. Specify monitoring dashboard URL in Section 11.1
4. Document incident escalation matrix in Section 11.2

---

## Tier 3: NEEDS_WORK (Score 5.0-6.9)

### Example: Security Architecture - Incomplete Documentation

**Scenario**: A Security Architecture contract with significant gaps in ARCHITECTURE.md Section 9 (Security & Compliance).

**Validation Results**:
```json
{
  "final_score": 6.2,
  "outcome": {
    "overall_status": "CONDITIONAL",
    "document_status": "Draft",
    "review_actor": "Architecture Team",
    "action": "NEEDS_WORK",
    "message": "Validation incomplete. Address missing data before approval.",
    "blockers": [
      "Must resolve UNKNOWN items",
      "Must address FAIL items or register exceptions"
    ]
  },
  "validation_date": "2025-12-07",
  "validation_evaluator": "Claude Code (Automated Validation Engine)",
  "scores": {
    "completeness": 6.0,
    "compliance": 6.5,
    "quality": 6.0
  }
}
```

**Score Breakdown**:
- **Completeness (6.0/10)**: 12 of 20 required data points present (60%)
  - Missing: Authentication method, Authorization model, Encryption standards (data at rest), Key rotation policy, Security monitoring tools, Compliance certifications, Vulnerability scanning frequency, Security incident response plan
- **Compliance (6.5/10)**: 8 PASS, 5 N/A, 1 FAIL, 6 UNKNOWN out of 20 items
  - Calculation: (8 PASS + 5 N/A) / 20 = 13/20 = 6.5/10 (N/A counted as fully compliant)
  - FAIL: Using deprecated TLS 1.1 for legacy systems
  - UNKNOWN: No OAuth 2.0 configuration documented, no encryption key management details, no security audit logs defined, no penetration testing schedule, no data classification policy, no access control matrix
- **Quality (6.0/10)**: Some source references missing or incomplete

**Final Calculation**:
```
Final Score = (6.0 × 0.4) + (6.5 × 0.5) + (6.0 × 0.1)
            = 2.4 + 3.25 + 0.6
            = 6.2/10
```

**Document Control Output**:
```markdown
| Status | Draft |
| Validation Score | 6.2/10 |
| Validation Status | CONDITIONAL |
| Validation Date | 2025-12-07 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | Architecture Team |
| Approval Authority | Security Review Board |
```

**Outcome**: Contract cannot proceed to review. Architecture team must address missing data and compliance failures before resubmission.

**Critical Actions Required**:
1. **Address FAIL Items**:
   - Upgrade TLS 1.1 to TLS 1.2+ or register exception via LADES2

2. **Resolve UNKNOWN Items** (add to ARCHITECTURE.md Section 9):
   - OAuth 2.0 configuration (flows, scopes, client types)
   - Encryption key management (KMS, rotation policy)
   - Security audit logs (tools, retention, alerts)
   - Penetration testing schedule (frequency, scope)
   - Data classification policy (levels, handling requirements)
   - Access control matrix (roles, permissions)

3. **Improve Documentation Quality**:
   - Add section and line number references for all data points
   - Ensure all security controls are documented with evidence

**Next Steps**: Update ARCHITECTURE.md Section 9, then regenerate Security Architecture contract for re-validation.

---

## Tier 4: REJECT (Score 0.0-4.9)

### Example: Cloud Architecture - Insufficient Data

**Scenario**: A Cloud Architecture contract generated from minimal ARCHITECTURE.md with almost no Section 4 (Cloud & Deployment) content.

**Validation Results**:
```json
{
  "final_score": 3.5,
  "outcome": {
    "overall_status": "FAIL",
    "document_status": "Rejected",
    "review_actor": "N/A (Blocked)",
    "action": "REJECT",
    "message": "Insufficient information or critical compliance failures. Cannot proceed.",
    "blockers": [
      "Critical data missing",
      "Non-compliant technology stack",
      "No exception documentation"
    ]
  },
  "validation_date": "2025-12-07",
  "validation_evaluator": "Claude Code (Automated Validation Engine)",
  "scores": {
    "completeness": 2.5,
    "compliance": 4.0,
    "quality": 3.0
  }
}
```

**Score Breakdown**:
- **Completeness (2.5/10)**: 5 of 20 required data points present (25%)
  - Missing: Cloud provider, Regions/AZs, Deployment model, Infrastructure as Code tools, Container orchestration, Service mesh, Auto-scaling policies, Cost optimization strategy, Cloud security controls, Disaster recovery setup, Multi-region strategy, Cloud monitoring, Resource tagging, IAM policies, Network architecture
- **Compliance (4.0/10)**: 3 PASS, 2 N/A, 2 FAIL, 13 UNKNOWN out of 20 items
  - FAIL: Using non-approved cloud region (single-AZ deployment for production)
  - FAIL: No Infrastructure as Code - manual provisioning detected
  - UNKNOWN: 13 critical cloud best practices not documented
- **Quality (3.0/10)**: Minimal source references, poor traceability

**Final Calculation**:
```
Final Score = (2.5 × 0.4) + (4.0 × 0.5) + (3.0 × 0.1)
            = 1.0 + 2.0 + 0.3
            = 3.5/10
```

**Document Control Output**:
```markdown
| Status | Rejected |
| Validation Score | 3.5/10 |
| Validation Status | FAIL |
| Validation Date | 2025-12-07 |
| Validation Evaluator | Claude Code (Automated Validation Engine) |
| Review Actor | N/A (Blocked) |
| Approval Authority | Cloud Architecture Review Board |
```

**Outcome**: Contract is rejected. Cannot proceed to any review. ARCHITECTURE.md Section 4 is critically incomplete.

**Critical Blockers**:
1. **Insufficient Documentation**: Only 25% of required cloud architecture information is documented
2. **Non-Compliant Deployment**: Single-AZ production deployment violates high-availability requirements
3. **Missing IaC**: Manual infrastructure provisioning is not acceptable for production environments

**Required Actions**:
1. **Complete ARCHITECTURE.md Section 4** with all required cloud architecture details:
   - Cloud provider selection and justification
   - Multi-AZ/multi-region deployment architecture
   - Infrastructure as Code tooling (Terraform, CloudFormation, etc.)
   - Container orchestration platform (EKS, AKS, GKE)
   - Auto-scaling policies and thresholds
   - Cloud security controls and IAM policies
   - Disaster recovery and backup strategy
   - Cost optimization and resource tagging strategy
   - Network architecture (VPC, subnets, routing)
   - Monitoring and observability setup

2. **Address Critical Compliance Failures**:
   - Implement multi-AZ deployment or register exception with business justification
   - Implement Infrastructure as Code for all infrastructure provisioning
   - Document exception process if deviations are required

3. **Do Not Proceed Until Score ≥ 5.0**: This contract cannot be reviewed or approved until fundamental cloud architecture requirements are documented.

**Next Steps**:
1. Work with cloud architecture team to complete ARCHITECTURE.md Section 4
2. Implement multi-AZ deployment design
3. Adopt Infrastructure as Code tooling
4. Regenerate Cloud Architecture contract after documentation is complete

---

## Summary Comparison

| Tier | Score Range | Status | Review Actor | Example | Key Characteristics |
|------|-------------|--------|--------------|---------|---------------------|
| **Tier 1** | 8.0-10.0 | Approved | System (Auto-Approved) | Development Architecture (9.2/10) | Perfect/near-perfect compliance, comprehensive documentation, automatic approval |
| **Tier 2** | 7.0-7.9 | In Review | Approval Authority | SRE Architecture (7.8/10) | Good compliance, minor gaps, requires manual review |
| **Tier 3** | 5.0-6.9 | Draft | Architecture Team | Security Architecture (6.2/10) | Incomplete documentation, must address gaps before review |
| **Tier 4** | 0.0-4.9 | Rejected | N/A (Blocked) | Cloud Architecture (3.5/10) | Critical failures, insufficient data, cannot proceed |

---

## How to Improve Your Score

### From REJECT (0-4.9) to NEEDS_WORK (5.0-6.9)
- Focus on **Completeness**: Document all required sections in ARCHITECTURE.md
- Address **Critical FAIL items**: Fix non-compliant technologies or register exceptions
- Achieve at least 50% completeness and resolve critical blockers

### From NEEDS_WORK (5.0-6.9) to MANUAL_REVIEW (7.0-7.9)
- Resolve **UNKNOWN items**: Add missing data to ARCHITECTURE.md
- Reduce **FAIL items**: Upgrade deprecated technologies or document exceptions
- Improve **Quality**: Add source traceability (section and line numbers)
- Target 70-80% completeness and minimize UNKNOWN/FAIL items

### From MANUAL_REVIEW (7.0-7.9) to AUTO_APPROVE (8.0-10.0)
- Achieve **95%+ completeness**: Fill remaining data gaps
- Resolve **all UNKNOWN items**: Ensure all required data is documented
- Perfect **Quality**: Full source traceability for all data points
- Address any remaining minor FAIL items with exceptions or upgrades

---

## Remediation Workflow Example

### Scenario: Cloud Architecture - Gap Remediation to AUTO_APPROVE

**Initial State**: Cloud Architecture contract with score 6.8/10 (NEEDS_WORK tier) due to 5 UNKNOWN items.

**Before Remediation**:
```json
{
  "final_score": 6.8,
  "outcome": {
    "overall_status": "CONDITIONAL",
    "document_status": "Draft",
    "review_actor": "Architecture Team",
    "action": "NEEDS_WORK",
    "message": "Validation incomplete. Address missing data before approval."
  },
  "scores": {
    "completeness": 7.5,
    "compliance": 6.4,
    "quality": 8.0
  },
  "weights": {
    "completeness": 0.35,
    "compliance": 0.55,
    "quality": 0.10
  },
  "gaps": [
    "LAC4: Missing cost monitoring configuration - Section 11",
    "LAC3: No resource tagging strategy - Section 4",
    "LAC6: Infrastructure as Code not documented - Section 11",
    "LAC2: Multi-region strategy undefined - Section 4",
    "LAC5: Backup/recovery policies missing - Section 11"
  ]
}
```

**Calculation (Before)**:
```
Final Score = (7.5 × 0.35) + (6.4 × 0.55) + (8.0 × 0.10)
            = 2.625 + 3.52 + 0.8
            = 6.945
            = 6.8/10 (rounded)
```

---

**Remediation Steps** (following Section A.3.2 workflow):

**Step 1: Activate architecture-docs skill**
```
/skill architecture-docs
```

**Step 2: Remediate highest-impact gap (LAC2 - Multi-region)**
```
"Add multi-region deployment to Section 4:
 primary us-east-1, secondary us-west-2, RTO 15 minutes,
 automated failover with Route 53"
```
- **Result**: Section 4 updated with multi-region strategy
- **Impact**: LAC2 UNKNOWN → PASS (+0.4 compliance points)

**Step 3: Remediate LAC4 (Cost monitoring)**
```
"Add cost monitoring to Section 11: CloudWatch billing alarms,
 80% budget threshold, monthly cost reviews"
```
- **Result**: Section 11 updated with cost monitoring config
- **Impact**: LAC4 UNKNOWN → PASS (+0.5 compliance points)

**Step 4: Remediate LAC6 (Infrastructure as Code)**
```
"Add Infrastructure as Code strategy to Section 11:
 Terraform for infrastructure provisioning,
 GitOps workflow with Terraform Cloud,
 state management in S3 with DynamoDB locking"
```
- **Result**: Section 11 updated with IaC strategy
- **Impact**: LAC6 UNKNOWN → PASS (+0.4 compliance points)

**Step 5: Remediate LAC3 (Resource tagging)**
```
"Add resource tagging strategy to Section 4:
 required tags (environment, application, cost-center, owner),
 tag governance policy, automation via IaC"
```
- **Result**: Section 4 updated with tagging strategy
- **Impact**: LAC3 UNKNOWN → PASS (+0.3 compliance points)

**Step 6: Remediate LAC5 (Backup/recovery)**
```
"Add backup strategy to Section 11:
 daily full backup, incremental every 6 hours,
 30-day retention, S3 cross-region replication,
 monthly restore validation"
```
- **Result**: Section 11 updated with backup policies
- **Impact**: LAC5 UNKNOWN → PASS (+0.4 compliance points)

---

**After Remediation**:
```json
{
  "final_score": 8.9,
  "outcome": {
    "overall_status": "PASS",
    "document_status": "Approved",
    "review_actor": "System (Auto-Approved)",
    "action": "AUTO_APPROVE",
    "message": "High confidence validation. Contract automatically approved."
  },
  "scores": {
    "completeness": 9.3,
    "compliance": 8.6,
    "quality": 9.0
  },
  "weights": {
    "completeness": 0.35,
    "compliance": 0.55,
    "quality": 0.10
  },
  "gaps": []
}
```

**Calculation (After)**:
```
Final Score = (9.3 × 0.35) + (8.6 × 0.55) + (9.0 × 0.10)
            = 3.255 + 4.73 + 0.9
            = 8.885
            = 8.9/10 (rounded)
```

---

**Impact Analysis**:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Completeness** | 7.5 | 9.3 | +1.8 (+24%) |
| **Compliance** | 6.4 | 8.6 | +2.2 (+34%) |
| **Quality** | 8.0 | 9.0 | +1.0 (+13%) |
| **Final Score** | 6.8 | 8.9 | +2.1 (+31%) |
| **Document Status** | Draft | Approved | ✅ |
| **Action** | NEEDS_WORK | AUTO_APPROVE | ✅ |

**Key Success Factors**:
1. **Prioritized by impact**: Addressed highest-impact gaps first (LAC2, LAC4, LAC6)
2. **Used architecture-docs skill**: Skill ensured correct section placement and formatting
3. **Complete documentation**: All gaps resolved, no partial fixes
4. **Source traceability improved**: Skill added section/line references, boosting quality score
5. **Time efficient**: Total remediation time ~35 minutes (vs 2-3 hours manual)

**Outcome**: Contract progressed from NEEDS_WORK (Tier 3) → AUTO_APPROVE (Tier 1), bypassing manual review entirely.

---

## Validation Best Practices

1. **Start with ARCHITECTURE.md completeness**: The more complete your ARCHITECTURE.md, the higher your validation score
2. **Use source traceability**: Always cite section and line numbers for auditable documentation
3. **Document exceptions properly**: Use LADES2 process for approved deviations (counts as PASS)
4. **Address UNKNOWN items first**: Missing data scores 0 points - add it to ARCHITECTURE.md
5. **Fix FAIL items strategically**: Upgrade deprecated tech or register exceptions
6. **Aim for Tier 2 minimum**: Score ≥ 7.0 opens the approval pathway
7. **Strive for Tier 1**: Score ≥ 8.0 enables automatic approval and faster delivery

---

**Generated**: 2025-12-07
**Version**: 1.0
**See Also**:
- `/skills/architecture-compliance/validation/README.md` - Validation system overview
- `/skills/architecture-compliance/validation/VALIDATION_SCHEMA.json` - Validation config schema
- `/skills/architecture-compliance/COMPLIANCE_GENERATION_GUIDE.md` - Full generation guide
