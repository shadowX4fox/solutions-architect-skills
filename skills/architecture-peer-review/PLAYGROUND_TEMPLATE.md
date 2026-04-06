# Architecture Peer Review Template

Use this template when the playground generates an interactive peer review tool for ARCHITECTURE.md documents. Extends the `document-critique` template with architecture-specific categories, depth-level controls, a review scorecard, and multi-file document support.

## Layout

```
+---------------------------+--------------------+
|                           |  Scorecard panel   |
|                           |  Overall: 7.2/10   |
|                           |  ■■■■■■■□□□ STRUCT |
|                           |  ■■■■■■■■■□ NAMING |
|                           +-+------------------+
|  Architecture document    |  Findings panel    |
|  with line numbers and    |  [All▼][Severity▼] |
|  finding highlights       |  [Category▼]       |
|                           |                    |
|  --- docs/02-arch.md ---  |  🔴 SECURITY-01    |
|  45  ┃ ...content...      |  Lines 45-52       |
|  46  ┃ ...content...      |  [Approve][Reject] |
|                           |  [Comment]         |
+---------------------------+--------------------+
|  Prompt output (approved findings grouped)     |
|  [ Copy Fix Prompt ]   [ Copy Scorecard ]      |
+------------------------------------------------+
```

## Key Components

### Scorecard panel (top-right)

Display a compact summary:
- **Overall score** — large number (e.g., "7.2") with `/10`, color-coded by rating band
- **Rating label** — "Production-ready" / "Minor improvements recommended" / "Significant gaps" / "Major rework needed"
- **Depth badge** — colored pill: `LIGHT` (green), `MEDIUM` (amber), `HARD` (red)
- **Per-category score bars** — horizontal progress bars, width proportional to `score / 10`
  - Green if score >= 8.0
  - Amber if score >= 5.0
  - Red if score < 5.0
- **Finding count by severity** — compact row: 🔴 N critical · 🟠 N major · 🟡 N minor · 🔵 N suggestion

### Document panel (left)

**Building `docContent`**: The playground generator receives `doc_files` (an ordered list of absolute paths). Read each file using the Read tool, then concatenate with `--- <filename> ---` separator lines between files. Store as the `docContent` string embedded in the HTML. Do NOT ask the orchestrator to pre-read these files — the generator reads them once here.

- Full document content with line numbers
- File separator headers when document spans multiple files: `--- docs/02-architecture-principles.md ---` styled as a sticky banner
- Highlight lines with findings using a colored left border (color matches severity)
- Status-based coloring: pending (amber), approved (green), rejected (red with opacity)
- Click a finding card in the right panel to scroll to and highlight the relevant lines
- Finding indicator icon on the left gutter for lines with findings

### Findings panel (right, below scorecard)

- Filter bar with three controls:
  - **Status tabs**: All / Pending / Approved / Rejected (with count badges)
  - **Severity filter**: dropdown `All | Critical | Major | Minor | Suggestion`
  - **Category filter**: dropdown listing all category codes present in the findings
- Stats row showing visible count vs total count
- Each **finding card**:
  - Severity icon and color-coded left border
  - Category badge (e.g., `SECURITY`, `SCALE`) + Depth badge (`LIGHT`/`MEDIUM`/`HARD`)
  - File path + line reference (e.g., `docs/09-security.md · Lines 45–52`)
  - **Title** (bold, truncated at 60 chars with expand)
  - **Finding** text (the current state, 2-3 lines, collapsible)
  - **Recommendation** text (what to do instead, collapsible)
  - **Rationale** (why it matters architecturally, collapsed by default)
  - Action buttons: **Approve** / **Reject** / **Comment** (or **Reset** if already decided)
  - Optional `<textarea>` for user comment, shown when Comment clicked

### Prompt output (bottom)

- Generates from approved findings + findings with user comments
- Two buttons: **Copy Fix Prompt** and **Copy Scorecard**
- "Copied!" flash feedback on each button

---

## State Structure

```javascript
const reviewData = {
  depthLevel: "hard",         // "light" | "medium" | "hard"
  docContent: "",             // Full document text (multi-file concatenated with separators)
  scorecard: {
    overall: 7.2,
    rating: "Significant gaps — address before implementation",
    categories: [
      // One entry per active category: { code, name, score, weight }
      // Category codes, names, and weights: see Scoring Weights table in PEER_REVIEW_CRITERIA.md
    ]
  },
  findings: [
    {
      id: 1,
      file: "docs/09-security-architecture.md",
      lineRef: "Lines 45–52",
      checkId: "SECURITY-04",
      category: "SECURITY",
      categoryName: "Security Posture",
      severity: "critical",      // "critical" | "major" | "minor" | "suggestion"
      depthLevel: "hard",        // "light" | "medium" | "hard"
      title: "No TLS specification for service-to-service communication",
      finding: "The security architecture documents TLS for the public API gateway but does not specify encryption in transit for internal service-to-service communication.",
      recommendation: "Add a section specifying TLS 1.3 for all internal service mesh communication. If using mTLS, document the certificate management approach (e.g., cert-manager with Let's Encrypt or Vault PKI).",
      rationale: "Internal traffic is not inherently safe in cloud environments. Compromised infrastructure (supply chain attack, misconfigured security group) can expose plaintext internal traffic.",
      status: "pending",         // "pending" | "approved" | "rejected"
      userComment: ""
    }
    // ... more findings embedded here by the skill
  ],
  // UI state
  activeFilter: "all",           // "all" | "pending" | "approved" | "rejected"
  activeSeverityFilter: "all",   // "all" | "critical" | "major" | "minor" | "suggestion"
  activeCategoryFilter: "all",   // "all" | <category code>
  activeFindingId: null
};
```

---

## Document Rendering

Render the document panel with file separators for multi-file architectures:

```javascript
// IMPORTANT: Do NOT use nested template literals (backticks inside ${} expressions).
// Use string concatenation or single-quoted strings inside ${} ternaries instead.
function renderDocument() {
  const lines = reviewData.docContent.split('\n');
  let html = '';
  let lineNum = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    // File separator lines (--- path/to/file.md ---)
    if (line.startsWith('--- ') && line.endsWith(' ---')) {
      html += `<div class="file-separator">${line}</div>`;
      continue;
    }

    lineNum++;
    const finding = findingForLine(lineNum);
    const statusClass = finding ? finding.status : '';
    const severityClass = finding ? 'sev-' + finding.severity : '';
    const onclickAttr = finding ? 'highlightFinding(' + finding.id + ')' : '';
    const gutterHtml = finding ? '<span class="finding-gutter">●</span>' : '<span class="finding-gutter-empty"></span>';

    html += `<div class="doc-line ${finding ? 'has-finding' : ''} ${statusClass} ${severityClass}"
                  data-line="${lineNum}"
                  onclick="${onclickAttr}">
      <span class="line-num">${lineNum}</span>
      ${gutterHtml}
      <span class="line-content">${escapeHtml(renderInlineMarkdown(line))}</span>
    </div>`;
  }
  return html;
}
```

---

## Finding-to-Line Matching

```javascript
function findingForLine(lineNum) {
  return reviewData.findings.find(f => {
    // Parse "Lines 45–52" or "Line 45"
    const range = f.lineRef.match(/Lines?\s*(\d+)(?:[–-](\d+))?/i);
    if (!range) return false;
    const start = parseInt(range[1]);
    const end = range[2] ? parseInt(range[2]) : start;
    return lineNum >= start && lineNum <= end;
  });
}
```

---

## Scorecard Rendering

```javascript
function renderScorecard() {
  const { scorecard, depthLevel } = reviewData;
  const ratingColors = {
    "Production-ready": "#1a7f37",
    "Minor improvements recommended": "#0969da",
    "Significant gaps — address before implementation": "#bf5700",
    "Major rework needed": "#cf222e"
  };

  const severityCounts = {
    critical: reviewData.findings.filter(f => f.severity === 'critical').length,
    major:    reviewData.findings.filter(f => f.severity === 'major').length,
    minor:    reviewData.findings.filter(f => f.severity === 'minor').length,
    suggestion: reviewData.findings.filter(f => f.severity === 'suggestion').length
  };

  // Render: overall score, rating, depth badge, category bars, severity counts
  // Category bars: width = (score / 10) * 100 + '%'
  // Bar color: score >= 8 ? green : score >= 5 ? amber : red
}
```

---

## Prompt Output Generation

```javascript
function updatePrompt() {
  const approved = reviewData.findings.filter(f => f.status === 'approved');
  const withComments = reviewData.findings.filter(f => f.userComment?.trim() && f.status !== 'approved');
  const rejected = reviewData.findings.filter(f => f.status === 'rejected');

  if (approved.length === 0 && withComments.length === 0) {
    promptEl.textContent = 'Approve findings to generate a fix prompt.';
    return;
  }

  const { scorecard, depthLevel } = reviewData;
  let prompt = `Use /skill architecture-docs to update the ARCHITECTURE.md with the following peer review findings.\n`;
  prompt += `Review depth: ${depthLevel.toUpperCase()} | Overall score: ${scorecard.overall}/10 (${scorecard.rating})\n\n`;

  if (approved.length > 0) {
    prompt += `## Approved Findings — Apply These Changes\n\n`;
    // Group by file, then severity order: critical → major → minor → suggestion
    const bySeverity = ['critical', 'major', 'minor', 'suggestion'];
    for (const sev of bySeverity) {
      const sevFindings = approved.filter(f => f.severity === sev);
      for (const f of sevFindings) {
        prompt += `### [${f.severity.toUpperCase()}] ${f.title}\n`;
        prompt += `- **Check**: ${f.checkId} (${f.categoryName})\n`;
        prompt += `- **Location**: ${f.file}, ${f.lineRef}\n`;
        prompt += `- **Finding**: ${f.finding}\n`;
        prompt += `- **Recommendation**: ${f.recommendation}\n`;
        if (f.userComment?.trim()) {
          prompt += `- **Reviewer note**: ${f.userComment.trim()}\n`;
        }
        prompt += '\n';
      }
    }
  }

  if (withComments.length > 0) {
    prompt += `## Additional Reviewer Feedback (Not Auto-Approved)\n\n`;
    for (const f of withComments) {
      prompt += `- **${f.title}** (${f.file}): ${f.userComment.trim()}\n`;
    }
    prompt += '\n';
  }

  if (rejected.length > 0) {
    prompt += `## Rejected Findings (Reviewer chose to skip)\n\n`;
    for (const f of rejected) {
      prompt += `- ${f.checkId}: ${f.title}\n`;
    }
  }

  promptEl.textContent = prompt;
}
```

---

## Scorecard Copy Output

```javascript
function copyScorecard() {
  const { scorecard, depthLevel } = reviewData;
  const total = reviewData.findings.length;
  const critical = reviewData.findings.filter(f => f.severity === 'critical').length;
  const major = reviewData.findings.filter(f => f.severity === 'major').length;

  let text = `Architecture Peer Review Scorecard\n`;
  text += `===================================\n`;
  text += `Depth: ${depthLevel.toUpperCase()} | Overall: ${scorecard.overall}/10\n`;
  text += `Rating: ${scorecard.rating}\n\n`;
  text += `Findings: ${total} total (${critical} critical, ${major} major)\n\n`;
  text += `Category Scores:\n`;
  for (const cat of scorecard.categories) {
    const bar = '■'.repeat(Math.round(cat.score)) + '□'.repeat(10 - Math.round(cat.score));
    text += `  ${bar} ${cat.score.toFixed(1)}  ${cat.name}\n`;
  }
  navigator.clipboard.writeText(text);
}
```

---

## Expected HTML Structure

The following IDs **must** be used for the structural containers so the CSS layout rules below apply correctly:

```html
<div id="app">
  <div id="main">
    <div id="doc-panel"><!-- line-numbered document content --></div>
    <div id="right-column">
      <div id="scorecard-panel"><!-- overall score, rating, category bars --></div>
      <div id="findings-panel">
        <div id="findings-filters"><!-- status tabs + severity/category dropdowns --></div>
        <div id="findings-list"><!-- finding cards --></div>
      </div>
    </div>
  </div>
  <div id="prompt-panel">
    <div class="prompt-actions"><!-- Copy Fix Prompt + Copy Scorecard buttons --></div>
    <div class="prompt-content"><!-- generated prompt text --></div>
  </div>
</div>
```

---

## Styling

```css
/* ===== Structural Layout ===== */

/* Full-viewport shell — no page-level scroll */
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  background: #0d1117; color: #c9d1d9;
}

/* Top-level vertical flex: main area above, prompt panel below */
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Horizontal split: document panel (left) + right column */
#main {
  display: flex;
  flex: 1;
  min-height: 0;        /* critical: allows flex children to shrink below content size */
  overflow: hidden;
}

/* Document panel — independently scrollable */
#doc-panel {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #30363d;
  min-height: 0;
}

/* Right column — fixed width, scorecard stacked above findings */
#right-column {
  width: 420px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* Scorecard — natural height, never scrolls */
#scorecard-panel {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #30363d;
  background: #161b22;
  overflow: hidden;
}

/* Findings panel — fills remaining vertical space after scorecard */
#findings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* Filter bar — always visible at top of findings panel */
#findings-filters {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 20;
  background: #161b22;
  padding: 8px 12px;
  border-bottom: 1px solid #30363d;
}

/* Scrollable findings list */
#findings-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  min-height: 0;
}

/* Prompt output — fixed height at bottom with its own scroll */
#prompt-panel {
  flex-shrink: 0;
  height: 180px;
  border-top: 1px solid #30363d;
  background: #161b22;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#prompt-panel .prompt-actions {
  flex-shrink: 0;
  padding: 8px 12px;
  display: flex;
  gap: 8px;
}

#prompt-panel .prompt-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 8px;
  font-size: 12px;
  white-space: pre-wrap;
  font-family: monospace;
  min-height: 0;
}

/* ===== Severity color scheme ===== */
.sev-critical { border-left: 3px solid #cf222e; background: rgba(207,34,46,0.06); }
.sev-major    { border-left: 3px solid #bf5700; background: rgba(191,87,0,0.06); }
.sev-minor    { border-left: 3px solid #9a6700; background: rgba(154,103,0,0.06); }
.sev-suggestion { border-left: 3px solid #0969da; background: rgba(9,105,218,0.06); }

/* Status overrides */
.doc-line.approved  { border-left-color: #1a7f37; background: rgba(26,127,55,0.08); }
.doc-line.rejected  { border-left-color: #6e7781; opacity: 0.5; }

/* Depth badges */
.depth-badge { font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 3px; }
.depth-light  { background: #1a7f37; color: #fff; }
.depth-medium { background: #bf8700; color: #fff; }
.depth-hard   { background: #cf222e; color: #fff; }

/* Category badge */
.cat-badge { font-size: 10px; padding: 2px 5px; border-radius: 3px; background: #30363d; color: #8b949e; font-family: monospace; }

/* File separator */
.file-separator {
  padding: 4px 12px;
  background: #161b22;
  color: #58a6ff;
  font-size: 11px;
  font-family: monospace;
  border-top: 1px solid #30363d;
  border-bottom: 1px solid #30363d;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Scorecard bars */
.score-bar-fill { height: 6px; border-radius: 3px; transition: width 0.3s; }
.score-green { background: #1a7f37; }
.score-amber { background: #bf8700; }
.score-red   { background: #cf222e; }

/* Finding gutter indicator */
.finding-gutter { color: inherit; font-size: 8px; width: 12px; display: inline-block; }
.finding-gutter-empty { width: 12px; display: inline-block; }
```

---

## Presets

Include 3 named presets accessible via a "Presets" dropdown:
- **All Approved** — Approves all findings (for bulk acceptance workflow)
- **Critical Only** — Auto-approves critical findings, rejects all others
- **Clear All** — Resets all findings to pending status
