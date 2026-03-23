# Compliance Gap Explorer Template

Use this template when the playground generates the interactive compliance review tool. It provides a three-panel compliance portfolio dashboard: a contract health panel showing all 10 contracts with scores and status, a concept cluster gap explorer for navigating required ARCHITECTURE.md fixes, and a fix prompt generator for copying actionable remediation prompts back into Claude.

## Layout

```
+-----------------------------+-----------------------------------+
|  Portfolio Panel (left)     |  Concept Gap Explorer (right)     |
|                             |                                   |
|  Coverage: 8/10 valid       |  [Contract ▼] [Priority ▼]       |
|  ──────────────────         |  [Effort ▼]   [Status ▼]         |
|                             |                                   |
|  ✅ SRE         7.69/10 🟡  |  🔴 Load Testing Strategy        |
|  ❌ Biz. Cont.  MISSING     |  SRE Architecture · Development   |
|  ✅ Cloud       8.50/10 🟢  |  4 gaps · 2 Blocker · 2 Desired  |
|  ✅ Data & AI   6.20/10 🔴  |  Impact: High · Section 10.3     |
|  ✅ Development 7.80/10 🟡  |  ─────────────────────────────── |
|  ⚠️ Process     EXPIRED     |  🟠 Incident Management           |
|  ✅ Security    5.40/10 🔴  |  SRE · Security · Platform        |
|  ✅ Platform    7.10/10 🟡  |  3 gaps · 3 Blocker              |
|  ✅ Enterprise  8.30/10 🟢  |  Impact: High · Section 11.4     |
|  ✅ Integration 7.00/10 🟡  |  ─────────────────────────────── |
|  ──────────────────         |  🟡 API Documentation             |
|  3/10 above threshold ≥8.0  |  Integration · Development        |
|  5/10 below threshold       |  2 gaps · 1 Blocker · 1 Desired  |
|  2/10 not reviewed          |  Impact: Medium · Section 6.2    |
+-----------------------------+-----------------------------------+
|  Fix Prompt Output                                              |
|  Generating prompt for selected concepts...                     |
|                                                                 |
|  [ Copy Fix Prompt ]    [ Copy Portfolio Summary ]             |
+-----------------------------------------------------------------+
```

## Key Components

### Portfolio Panel (left)

Display all 10 contract type slots, always in fixed order, whether reviewed or not:

1. SRE Architecture
2. Business Continuity
3. Cloud Architecture
4. Data & AI Architecture
5. Development Architecture
6. Process Transformation & Automation
7. Security Architecture
8. Platform & IT Infrastructure
9. Enterprise Architecture
10. Integration Architecture

Each contract row shows:
- **Status icon**: ✅ (valid) | ❌ (missing) | ⚠️ (expired)
- **Short name**: abbreviated contract type
- **Score**: `N.NN/10` for valid contracts, `MISSING` or `EXPIRED` for others
- **Score pill**: color-coded round badge
  - Green if score ≥ 8.0 (above threshold)
  - Amber if score 6.0–7.9 (below threshold, reachable)
  - Red if score < 6.0 (significant gaps)
  - Grey for missing/expired
- **Click behavior**: clicking a contract row filters the Gap Explorer to show only that contract's gaps

Below the contract list, display a compact summary row:
```
N/10 above threshold ≥8.0  ·  N/10 below  ·  N/10 not reviewed
```

**Selected contract state**: When a contract is selected, highlight its row and show its requirement breakdown summary below the portfolio list:
```
SRE Architecture — 7.69/10
Blocker: 26 ✓ · 4 N/A · 6 Unknown · 0 ✗ (of 36)
Desired: 5 ✓ · 8 N/A · 8 Unknown · 0 ✗ (of 21)
Projected after fix: 8.86/10
```

### Concept Gap Explorer (right)

The main interaction surface. Shows concept clusters sorted by `impactScore` descending.

**Filter bar** (four controls):
- **Contract filter**: `All Contracts | <each contract type>` — filters to clusters affecting the selected contract
- **Priority filter**: `All | Blocker only | Desired only`
- **Effort filter**: `All | High | Medium | Low`
- **Status filter**: `All | Unknown only | Non-Compliant only`

**Stats row** below filters:
```
N concepts shown · N total gaps · N Blocker · N Desired
```

Each **concept cluster card** displays:
- **Severity icon and colored left border**:
  - 🔴 Red border: High impact (impactScore ≥ 8)
  - 🟠 Orange border: Medium impact (4–7)
  - 🟡 Amber border: Low impact (1–3)
- **Concept name** (bold)
- **Affected contracts** — compact pill tags, one per contract (e.g., `SRE` · `Development`)
- **Gap count row**: `N gaps · N Blocker · N Desired`
- **Effort badge**: `High` / `Medium` / `Low` pill
- **Architecture section**: `Section X.Y` reference
- **Description**: one-line explanation of what documentation is needed (collapsed by default, expandable)
- **Fix guidance**: specific actionable guidance for what to write in ARCHITECTURE.md (collapsed by default, expandable)
- **Gap detail list** (collapsed by default, expandable): shows individual requirement rows:
  ```
  ├─ [SRE-B-023] Unknown · Blocker · Performance Testing
  │   "Load testing methodology documented with scenarios and thresholds"
  ├─ [DEV-B-011] Unknown · Blocker · Testing Strategy
  │   "Performance benchmark baselines defined"
  ```
- **Select checkbox**: user can select concepts to include in the fix prompt

### Fix Prompt Output (bottom)

- **Generates from** selected concept cluster cards (those with checkbox checked)
- If no concepts selected: shows *"Select concept clusters above to generate a fix prompt."*
- Two buttons: **Copy Fix Prompt** and **Copy Portfolio Summary**
- "Copied!" flash feedback on each button

---

## State Structure

```javascript
const reviewData = {
  project: "Project Name",
  reviewDate: "2026-03-22",
  autoApproveThreshold: 8.0,
  coverage: {
    valid: 8,
    missing: 1,
    expired: 1,
    total: 10
  },
  contracts: [
    {
      id: "sre",
      type: "SRE Architecture",
      filename: "SRE_ARCHITECTURE_Project_2025-12-27.md",
      generationDate: "2025-12-27",
      ageMonths: 2.8,
      contractStatus: "valid",          // "valid" | "missing" | "expired"
      score: 7.69,
      aboveThreshold: false,
      gapToThreshold: 0.31,
      projectedScoreAfterFix: 8.86,
      requirements: {
        blocker: { total: 36, compliant: 26, notApplicable: 4, unknown: 6, nonCompliant: 0 },
        desired:  { total: 21, compliant: 5,  notApplicable: 8, unknown: 8, nonCompliant: 0 }
      },
      gaps: [
        {
          id: "sre-gap-1",
          code: "SRE-B-023",
          requirement: "Load testing methodology documented with scenarios and thresholds",
          category: "Performance Testing",
          priority: "blocker",
          status: "Unknown",
          sourceSection: "Section 10.3",
          conceptTags: ["load-testing", "performance"]
        }
        // ... more gaps
      ]
    }
    // ... more contracts (always 10 slots, missing/expired have null scores and empty gaps)
  ],
  conceptClusters: [
    {
      id: "load-testing",
      concept: "Load Testing Strategy",
      description: "Document load testing approach: tools, scenarios, thresholds, and execution pipeline.",
      affectedContracts: ["SRE Architecture", "Development Architecture"],
      totalGaps: 4,
      blockerGaps: 2,
      desiredGaps: 2,
      impactScore: 8,
      estimatedEffort: "High",
      architectureSection: "Section 10.3 (Performance Testing) and Section 7.4 (Testing Strategy)",
      fixGuidance: "Add a load testing subsection specifying: (1) tooling choice (k6, JMeter, or Gatling), (2) test scenarios (ramp-up, spike, soak), (3) acceptance thresholds (e.g., p95 < 500ms at 1000 RPS), (4) CI/CD integration point, (5) baseline comparison strategy."
    }
    // ... more concept clusters, sorted by impactScore desc
  ],

  // UI state
  selectedContractId: null,             // null | contract.id
  activeContractFilter: "all",          // "all" | contract.id
  activePriorityFilter: "all",          // "all" | "blocker" | "desired"
  activeEffortFilter: "all",            // "all" | "High" | "Medium" | "Low"
  activeStatusFilter: "all",            // "all" | "Unknown" | "Non-Compliant"
  selectedConceptIds: []                // array of concept.id values (for fix prompt)
};
```

---

## Portfolio Panel Rendering

```javascript
const CONTRACT_ORDER = [
  "sre", "business-continuity", "cloud", "data-ai",
  "development", "process", "security", "platform",
  "enterprise", "integration"
];

const SHORT_NAMES = {
  "sre": "SRE Architecture",
  "business-continuity": "Biz. Continuity",
  "cloud": "Cloud Architecture",
  "data-ai": "Data & AI",
  "development": "Development",
  "process": "Process Transform.",
  "security": "Security Arch.",
  "platform": "Platform & Infra.",
  "enterprise": "Enterprise Arch.",
  "integration": "Integration Arch."
};

function renderPortfolioRow(contract) {
  const statusIcon = {
    valid: "✅", missing: "❌", expired: "⚠️"
  }[contract.contractStatus];

  const scoreDisplay = contract.score !== null
    ? `${contract.score.toFixed(2)}/10`
    : contract.contractStatus.toUpperCase();

  const pillClass = contract.score === null ? "pill-grey"
    : contract.score >= 8.0 ? "pill-green"
    : contract.score >= 6.0 ? "pill-amber"
    : "pill-red";

  const isSelected = reviewData.selectedContractId === contract.id;

  return `<div class="contract-row ${isSelected ? 'selected' : ''}"
               onclick="selectContract('${contract.id}')">
    <span class="status-icon">${statusIcon}</span>
    <span class="contract-short-name">${SHORT_NAMES[contract.id]}</span>
    <span class="score-pill ${pillClass}">${scoreDisplay}</span>
  </div>`;
}
```

---

## Concept Cluster Card Rendering

```javascript
function renderClusterCard(cluster) {
  const impactClass = cluster.impactScore >= 8 ? 'impact-high'
    : cluster.impactScore >= 4 ? 'impact-medium'
    : 'impact-low';

  const impactIcon = cluster.impactScore >= 8 ? '🔴'
    : cluster.impactScore >= 4 ? '🟠'
    : '🟡';

  const effortColors = { High: '#cf222e', Medium: '#bf5700', Low: '#1a7f37' };
  const isSelected = reviewData.selectedConceptIds.includes(cluster.id);

  const contractPills = cluster.affectedContracts
    .map(ct => `<span class="contract-pill">${ct.split(' ')[0]}</span>`)
    .join(' ');

  const gapRows = cluster.id in expandedClusters
    ? getGapsForCluster(cluster.id)
        .map(g => `<div class="gap-row">
          <span class="gap-code">[${g.code}]</span>
          <span class="gap-status ${g.status === 'Non-Compliant' ? 'status-nc' : 'status-unk'}">${g.status}</span>
          <span class="gap-priority priority-${g.priority}">${g.priority}</span>
          <span class="gap-text">${g.requirement}</span>
        </div>`).join('')
    : '';

  return `<div class="cluster-card ${impactClass} ${isSelected ? 'cluster-selected' : ''}">
    <div class="cluster-header" onclick="toggleCluster('${cluster.id}')">
      <input type="checkbox" class="cluster-check"
             ${isSelected ? 'checked' : ''}
             onclick="event.stopPropagation(); toggleConceptSelection('${cluster.id}')">
      <span class="impact-icon">${impactIcon}</span>
      <span class="cluster-name">${cluster.concept}</span>
      <div class="cluster-meta">
        ${contractPills}
        <span class="gap-count">${cluster.totalGaps} gaps · ${cluster.blockerGaps} Blocker · ${cluster.desiredGaps} Desired</span>
        <span class="effort-badge" style="color: ${effortColors[cluster.estimatedEffort]}">${cluster.estimatedEffort}</span>
        <span class="arch-section">📍 ${cluster.architectureSection}</span>
      </div>
    </div>
    <div class="cluster-body" id="body-${cluster.id}">
      <div class="cluster-description">${cluster.description}</div>
      <div class="cluster-guidance"><strong>Fix Guidance:</strong> ${cluster.fixGuidance}</div>
      <div class="gap-list">${gapRows}</div>
    </div>
  </div>`;
}

function getGapsForCluster(clusterId) {
  const cluster = reviewData.conceptClusters.find(c => c.id === clusterId);
  if (!cluster) return [];
  return reviewData.contracts.flatMap(c => c.gaps || [])
    .filter(g => g.conceptTags.some(tag =>
      reviewData.conceptClusters.find(cl => cl.id === clusterId)
        && cluster.concept.toLowerCase().includes(tag.split('-')[0])
    ));
}
```

---

## Fix Prompt Generation

```javascript
function updateFixPrompt() {
  const selectedClusters = reviewData.conceptClusters
    .filter(c => reviewData.selectedConceptIds.includes(c.id));

  if (selectedClusters.length === 0) {
    promptEl.textContent = 'Select concept clusters above to generate a fix prompt.';
    return;
  }

  let prompt = `Please update the ARCHITECTURE.md to address the following compliance gaps.\n`;
  prompt += `Compliance Review Date: ${reviewData.reviewDate} | Project: ${reviewData.project}\n`;
  prompt += `Auto-Approve Threshold: ≥${reviewData.autoApproveThreshold}/10 per contract\n\n`;

  const highImpact = selectedClusters.filter(c => c.estimatedEffort === 'High');
  const medImpact  = selectedClusters.filter(c => c.estimatedEffort === 'Medium');
  const lowImpact  = selectedClusters.filter(c => c.estimatedEffort === 'Low');

  for (const [label, clusters] of [['High Impact', highImpact], ['Medium Impact', medImpact], ['Low Impact', lowImpact]]) {
    if (clusters.length === 0) continue;
    prompt += `## ${label} Fixes\n\n`;
    for (const cluster of clusters) {
      prompt += `### ${cluster.concept}\n`;
      prompt += `- **Architecture Section**: ${cluster.architectureSection}\n`;
      prompt += `- **Affected Contracts**: ${cluster.affectedContracts.join(', ')}\n`;
      prompt += `- **Gaps**: ${cluster.blockerGaps} Blocker + ${cluster.desiredGaps} Desired (${cluster.totalGaps} total)\n`;
      prompt += `- **What to Document**: ${cluster.fixGuidance}\n\n`;
    }
  }

  const allGaps = reviewData.contracts.flatMap(c => c.gaps || [])
    .filter(g => selectedClusters.some(cl =>
      g.conceptTags.some(tag => cl.id.includes(tag.split('-')[0]))
    ));

  if (allGaps.length > 0) {
    prompt += `## Requirement Codes to Resolve\n\n`;
    for (const contract of reviewData.contracts.filter(c => c.contractStatus === 'valid')) {
      const contractGaps = allGaps.filter(g => contract.gaps?.some(cg => cg.id === g.id));
      if (contractGaps.length === 0) continue;
      prompt += `**${contract.type}** (current: ${contract.score}/10, target: ≥${reviewData.autoApproveThreshold})\n`;
      for (const g of contractGaps) {
        prompt += `- ${g.code}: [${g.priority.toUpperCase()}][${g.status}] ${g.requirement}\n`;
      }
      prompt += '\n';
    }
  }

  promptEl.textContent = prompt;
}
```

---

## Portfolio Summary Copy

```javascript
function copyPortfolioSummary() {
  const aboveCount = reviewData.contracts.filter(c => c.aboveThreshold).length;
  const belowCount  = reviewData.contracts.filter(c => c.contractStatus === 'valid' && !c.aboveThreshold).length;
  const notReviewed = reviewData.contracts.filter(c => c.contractStatus !== 'valid').length;

  let text = `Compliance Portfolio Summary\n`;
  text += `===========================\n`;
  text += `Project: ${reviewData.project} | Review Date: ${reviewData.reviewDate}\n`;
  text += `Auto-Approve Threshold: ≥${reviewData.autoApproveThreshold}/10\n\n`;
  text += `Coverage: ${reviewData.coverage.valid}/10 contracts valid\n`;
  text += `Above threshold: ${aboveCount}/10\n`;
  text += `Below threshold: ${belowCount}/10\n`;
  text += `Not reviewed: ${notReviewed}/10\n\n`;
  text += `Contract Scores:\n`;

  for (const c of reviewData.contracts) {
    const scoreStr = c.score !== null ? `${c.score.toFixed(2)}/10` : c.contractStatus.toUpperCase();
    const marker = c.aboveThreshold ? '✅' : (c.contractStatus === 'valid' ? '⚠️' : '❌');
    text += `  ${marker} ${c.type.padEnd(35)} ${scoreStr}\n`;
  }

  text += `\nTop Concept Clusters to Fix:\n`;
  for (const cluster of reviewData.conceptClusters.slice(0, 5)) {
    text += `  • ${cluster.concept} (Impact: ${cluster.estimatedEffort}, ${cluster.affectedContracts.length} contracts)\n`;
  }

  navigator.clipboard.writeText(text);
}
```

---

## Styling

```css
/* Contract status colors */
.pill-green { background: #1a7f37; color: #fff; }
.pill-amber { background: #bf8700; color: #fff; }
.pill-red   { background: #cf222e; color: #fff; }
.pill-grey  { background: #6e7781; color: #fff; }

/* Score pill */
.score-pill { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 10px; }

/* Portfolio row */
.contract-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; cursor: pointer; border-radius: 4px;
  border-left: 3px solid transparent;
}
.contract-row:hover  { background: #161b22; }
.contract-row.selected { background: #0d1117; border-left-color: #58a6ff; }
.contract-short-name { flex: 1; font-size: 12px; color: #c9d1d9; }

/* Impact classes */
.impact-high   { border-left: 3px solid #cf222e; }
.impact-medium { border-left: 3px solid #bf5700; }
.impact-low    { border-left: 3px solid #9a6700; }

/* Cluster card */
.cluster-card {
  background: #161b22; border-radius: 6px; margin-bottom: 8px;
  overflow: hidden; border: 1px solid #30363d;
}
.cluster-card.cluster-selected { border-color: #58a6ff; }
.cluster-header {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px; cursor: pointer;
}
.cluster-header:hover { background: #1c2128; }
.cluster-name { font-weight: 600; font-size: 13px; color: #e6edf3; flex: 1; }
.cluster-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; font-size: 11px; color: #8b949e; }
.cluster-body { padding: 10px 12px; border-top: 1px solid #30363d; display: none; }
.cluster-body.expanded { display: block; }
.cluster-description { color: #8b949e; font-size: 12px; margin-bottom: 8px; }
.cluster-guidance { color: #c9d1d9; font-size: 12px; line-height: 1.5; }

/* Gap list */
.gap-list { margin-top: 10px; font-size: 11px; font-family: monospace; }
.gap-row { padding: 3px 0; display: flex; gap: 8px; align-items: baseline; }
.gap-code { color: #58a6ff; white-space: nowrap; }
.gap-text { color: #8b949e; }
.status-nc  { color: #cf222e; }
.status-unk { color: #bf8700; }
.priority-blocker { color: #cf222e; font-weight: 600; }
.priority-desired { color: #0969da; }

/* Contract pills */
.contract-pill {
  font-size: 10px; padding: 1px 5px; border-radius: 3px;
  background: #30363d; color: #8b949e; font-family: monospace;
}

/* Effort badge */
.effort-badge { font-weight: 600; }

/* Arch section */
.arch-section { color: #58a6ff; font-size: 11px; }

/* Fix prompt area */
.fix-prompt-area {
  background: #0d1117; border: 1px solid #30363d; border-radius: 4px;
  padding: 12px; font-family: monospace; font-size: 12px;
  color: #c9d1d9; white-space: pre-wrap; min-height: 80px;
  max-height: 200px; overflow-y: auto;
}

/* Coverage summary */
.coverage-summary { font-size: 11px; color: #8b949e; padding: 6px 10px; border-top: 1px solid #30363d; }

/* Requirement breakdown (selected contract detail) */
.req-breakdown {
  background: #0d1117; border: 1px solid #30363d; border-radius: 4px;
  padding: 8px 10px; font-size: 11px; font-family: monospace;
  color: #8b949e; margin-top: 8px;
}
.req-breakdown .proj-score { color: #58a6ff; font-weight: 600; }
```

---

## Presets

Include 3 named presets accessible via a "Presets" dropdown in the Gap Explorer toolbar:
- **Select All Clusters** — checks all concept cluster cards (for bulk fix prompt)
- **Blocker Only** — auto-selects only clusters with `blockerGaps > 0`, unchecks the rest
- **Clear Selection** — unchecks all selected concept clusters, resets fix prompt

---

## Pre-Populating from the Skill

When the `architecture-compliance-review` skill builds this playground:

1. Compute all data in Steps 1–5 of the skill workflow
2. Embed `reviewData` JSON (contracts + conceptClusters + coverage) directly in the HTML `<script>` block as `const reviewData = { … };`
3. Contracts array must always contain all 10 slots — missing/expired contracts have `score: null`, `gaps: []`, and correct `contractStatus`
4. Concept clusters must be pre-sorted by `impactScore` descending
5. Run `open compliance-review-<YYYY-MM-DD>.html` to launch in browser after writing the file
