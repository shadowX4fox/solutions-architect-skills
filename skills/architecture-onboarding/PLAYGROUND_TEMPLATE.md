# Architecture Onboarding Concept Map Template

Use this template when the playground generates the interactive architecture onboarding explorer. It produces a **self-contained single HTML file** with all CSS and JS inlined — no external dependencies. The file contains a canvas-based concept map with draggable nodes representing architecture sections, components, compliance contracts, lifecycle phases, principles, and skills — connected by dependency, workflow, and validation edges. Users cycle knowledge levels per node (Know / Fuzzy / Unknown) and generate a targeted learning prompt shaped by their gaps.

**CRITICAL**: The playground must generate a **complete, working HTML file**. Every JavaScript function listed in the "Complete JavaScript Implementation" section must be included verbatim in the output with no elisions, no `// ...` placeholders, and no missing function bodies. The rendered page must display all nodes on the canvas immediately on load.

## Layout

```
+------------------------------------------------------------+
|  Header bar: project name + metadata chips                  |
+------------------------------------------------------------+
|                                                            |
|   Canvas (draggable nodes, edges, tooltips on hover)       |
|   ~60% viewport height                                     |
|                                                            |
+--------------------------------+---------------------------+
| Sidebar (bottom-left ~40% w)   | Prompt Panel (right ~60%w)|
|                                |                           |
| [ Preset ▼ ]  [ Auto-layout ]  | I'm onboarding to the    |
| [ Reset ]                      | [PROJECT] architecture.  |
|                                | I already know: ...       |
| Group toggles:                 | I'm fuzzy on: ...         |
| ■ Lifecycle   ■ Sections       | I don't know: ...         |
| ■ Components  ■ Compliance     |                           |
| ■ Principles  ■ Skills         | [ Copy Learning Prompt ]  |
|                                |                           |
| Node list (scrollable):        |                           |
| ● [Phase 1: Readiness]  Fuzzy |                           |
| ● [S1+S2: System Overv] Fuzzy |                           |
| ...                            |                           |
+--------------------------------+---------------------------+
```

## State Schema

The skill populates this object and the playground embeds it in the HTML as-is:

```javascript
const onboardingData = {
  // ── Project metadata ──────────────────────────────────────
  project: "Project Name",
  architectureType: "META",        // "META" | "3-Tier" | "Microservices" | "N-Layer" | "BIAN" | "unknown"
  structureType: "multi-file",     // "multi-file" | "monolithic"
  generatedDate: "2026-03-27",

  // ── Node definitions ──────────────────────────────────────
  // Each node MUST have id, label, group, description, status, knowledge, detail.
  // x, y, w, h are assigned by initializePositions() on load — do NOT pre-set them.
  // status: "complete" | "present" | "in-progress" | "not-started" | "missing"
  // knowledge: "know" | "fuzzy" | "unknown"   (user-adjustable, starts as "fuzzy")
  nodes: [
    // ── Lifecycle Phase nodes (always 5) ──
    {
      id: "phase-1",
      label: "Phase 1: Readiness",
      group: "lifecycle",
      description: "Business requirements — PO Spec before architecture design begins",
      status: "complete",          // "complete" if PRODUCT_OWNER_SPEC.md exists, else "not-started"
      knowledge: "fuzzy",
      detail: "Owner: Product Owner\nSkill: /skill architecture-readiness\nOutput: PRODUCT_OWNER_SPEC.md"
    },
    {
      id: "phase-2",
      label: "Phase 2: Docs",
      group: "lifecycle",
      description: "Architecture design — creates the 12-section ARCHITECTURE.md suite",
      status: "complete",          // "complete" if docs/ has all sections, "in-progress" if partial
      knowledge: "fuzzy",
      detail: "Owner: Architecture Team\nSkill: /skill architecture-docs\nOutput: ARCHITECTURE.md + docs/"
    },
    {
      id: "phase-3",
      label: "Phase 3: Compliance",
      group: "lifecycle",
      description: "Compliance contracts — 10 adherence contracts generated from ARCHITECTURE.md",
      status: "not-started",
      knowledge: "fuzzy",
      detail: "Owner: Compliance Team\nSkill: /skill architecture-compliance\nOutput: compliance-docs/ (10 contracts)"
    },
    {
      id: "phase-4",
      label: "Phase 4: Review",
      group: "lifecycle",
      description: "Quality review — peer review and compliance gap analysis playgrounds",
      status: "not-started",
      knowledge: "fuzzy",
      detail: "Owner: Architecture Team\nSkills: /skill architecture-peer-review\n        /skill architecture-compliance-review"
    },
    {
      id: "phase-5",
      label: "Phase 5: Dev Handoff",
      group: "lifecycle",
      description: "Per-component 16-section handoff documents for development teams",
      status: "not-started",
      knowledge: "fuzzy",
      detail: "Owner: Architecture Team\nSkills: /skill architecture-dev-handoff\n        /skill architecture-docs-export"
    },

    // ── Architecture Section nodes (S1-S12, up to 11 slots) ──
    {
      id: "s1-s2",
      label: "S1+S2: System Overview",
      group: "sections",
      description: "Executive summary, system description, key metrics, design drivers",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/01-system-overview.md\nTier: 0 — Foundation\nNo upstream dependencies"
    },
    {
      id: "s3",
      label: "S3: Principles",
      group: "sections",
      description: "9 required architecture principles with trade-offs and CAP theorem positioning",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/02-architecture-principles.md\nTier: 0 — Foundation"
    },
    {
      id: "s4",
      label: "S4: Architecture Layers",
      group: "sections",
      description: "Layer structure for the detected architecture type (META, 3-Tier, Microservices...)",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/03-architecture-layers.md\nTier: 1 — Structure\nDerives from S1+S2 and S3"
    },
    {
      id: "s5",
      label: "S5: Components",
      group: "sections",
      description: "Detailed component specifications — one file per component in docs/components/",
      status: "present",
      knowledge: "fuzzy",
      detail: "Directory: docs/components/\nTier: 2 — Components\nDerives from S1+S2, S3, S4"
    },
    {
      id: "s6",
      label: "S6: Data Flow",
      group: "sections",
      description: "Data flow patterns, message routing, async processing, event flows",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/04-data-flow-patterns.md\nTier: 3 — Flows & Integration\nDerives from S5"
    },
    {
      id: "s7",
      label: "S7: Integration",
      group: "sections",
      description: "Integration points — external systems, APIs, messaging, event contracts",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/05-integration-points.md\nTier: 3 — Flows & Integration\nDerives from S5"
    },
    {
      id: "s8",
      label: "S8: Technology Stack",
      group: "sections",
      description: "Approved technology catalog — languages, frameworks, libraries with versions",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/06-technology-stack.md\nTier: 3 — Flows & Integration\nDerives from S5"
    },
    {
      id: "s9",
      label: "S9: Security",
      group: "sections",
      description: "Security architecture — auth, encryption, data classification, threat model",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/07-security-architecture.md\nTier: 4 — Cross-cutting\nDerives from S5, S7, S8"
    },
    {
      id: "s10",
      label: "S10: Scalability",
      group: "sections",
      description: "Scalability and performance — SLOs, capacity planning, load characteristics",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/08-scalability-and-performance.md\nTier: 4 — Cross-cutting\nDerives from S5, S8"
    },
    {
      id: "s11",
      label: "S11: Operations",
      group: "sections",
      description: "Operational considerations — monitoring, deployment, DR, backup, incidents",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/09-operational-considerations.md\nTier: 5 — Operations\nDerives from S5, S8, S10"
    },
    {
      id: "s12",
      label: "S12: ADRs",
      group: "sections",
      description: "Architecture Decision Records — documented decisions with context and rationale",
      status: "present",
      knowledge: "fuzzy",
      detail: "Directory: adr/\nTier: 0 — Foundation\nCreated throughout the lifecycle"
    },

    // ── Component nodes (variable, injected by the skill — up to 15) ──
    // { id: "comp-<slug>", label: "<Component Name>", group: "components",
    //   description: "<short description>", status: "present", knowledge: "fuzzy",
    //   detail: "File: docs/components/<file>\nType: <type>\nPublishes: <topics>" }

    // ── Compliance Contract nodes (always 10 slots) ──
    {
      id: "compliance-sre",
      label: "SRE Contract",
      group: "compliance",
      description: "SRE Architecture compliance — operational practices, observability, automation",
      status: "missing",           // "valid" | "expired" | "missing"
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S11 (Operational)"
    },
    {
      id: "compliance-bc",
      label: "Business Continuity",
      group: "compliance",
      description: "Business Continuity compliance — DR, backup, RTO/RPO, resilience patterns",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S11 (Operational)"
    },
    {
      id: "compliance-cloud",
      label: "Cloud Contract",
      group: "compliance",
      description: "Cloud Architecture compliance — deployment model, HA, network, cost",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S4 (Layers)"
    },
    {
      id: "compliance-data",
      label: "Data & AI Contract",
      group: "compliance",
      description: "Data & AI Architecture compliance — data quality, governance, AI lifecycle",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S6 (Data Flow)"
    },
    {
      id: "compliance-dev",
      label: "Development Contract",
      group: "compliance",
      description: "Development Architecture compliance — tech stack, code standards, CI/CD",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S8 (Tech Stack)"
    },
    {
      id: "compliance-process",
      label: "Process Contract",
      group: "compliance",
      description: "Process Transformation compliance — automation, workflow modernization",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S7 (Integration)"
    },
    {
      id: "compliance-security",
      label: "Security Contract",
      group: "compliance",
      description: "Security Architecture compliance — auth, encryption, data classification",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S9 (Security)"
    },
    {
      id: "compliance-platform",
      label: "Platform Contract",
      group: "compliance",
      description: "Platform & IT Infrastructure compliance — environments, K8s, IaC, networking",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S4 (Layers)"
    },
    {
      id: "compliance-enterprise",
      label: "Enterprise Contract",
      group: "compliance",
      description: "Enterprise Architecture compliance — modularity, reusability, strategic alignment",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S1+S2 (Overview)"
    },
    {
      id: "compliance-integration",
      label: "Integration Contract",
      group: "compliance",
      description: "Integration Architecture compliance — API standards, event patterns, data contracts",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S7 (Integration)"
    },

    // ── Principle nodes (9 required) ──
    { id: "p-soc",   label: "Separation of Concerns", group: "principles", description: "Each component has a single, well-defined responsibility", status: "present", knowledge: "fuzzy", detail: "Required principle #1\nFile: docs/02-architecture-principles.md" },
    { id: "p-ha",    label: "High Availability",       group: "principles", description: "System designed for continuous operation and fault tolerance", status: "present", knowledge: "fuzzy", detail: "Required principle #2" },
    { id: "p-scale", label: "Scalability First",       group: "principles", description: "Architecture designed to scale horizontally from the start", status: "present", knowledge: "fuzzy", detail: "Required principle #3" },
    { id: "p-sec",   label: "Security by Design",      group: "principles", description: "Security controls built in at every layer, not bolted on", status: "present", knowledge: "fuzzy", detail: "Required principle #4" },
    { id: "p-obs",   label: "Observability",           group: "principles", description: "System state always inferable from logs, metrics, and traces", status: "present", knowledge: "fuzzy", detail: "Required principle #5" },
    { id: "p-res",   label: "Resilience",              group: "principles", description: "Graceful degradation and recovery from failures", status: "present", knowledge: "fuzzy", detail: "Required principle #6" },
    { id: "p-sim",   label: "Simplicity",              group: "principles", description: "Prefer the simplest solution that meets requirements", status: "present", knowledge: "fuzzy", detail: "Required principle #7" },
    { id: "p-cn",    label: "Cloud-Native",            group: "principles", description: "Designed for cloud deployment: containers, managed services, IaC", status: "present", knowledge: "fuzzy", detail: "Required principle #8" },
    { id: "p-os",    label: "Open Standards",          group: "principles", description: "Avoid vendor lock-in through open protocols and formats", status: "present", knowledge: "fuzzy", detail: "Required principle #9" },

    // ── Skill nodes (always 9) ──
    { id: "skill-readiness",          label: "architecture-readiness",          group: "skills", description: "Requirements elicitation — PO Spec creation and scoring", status: "present", knowledge: "fuzzy", detail: "Phase: 1\nUse: /skill architecture-readiness" },
    { id: "skill-docs",               label: "architecture-docs",               group: "skills", description: "Create and maintain ARCHITECTURE.md — 12-section docs", status: "present", knowledge: "fuzzy", detail: "Phase: 2\nUse: /skill architecture-docs" },
    { id: "skill-compliance",         label: "architecture-compliance",         group: "skills", description: "Generate 10 compliance contracts from ARCHITECTURE.md", status: "present", knowledge: "fuzzy", detail: "Phase: 3\nUse: /skill architecture-compliance" },
    { id: "skill-peer-review",        label: "architecture-peer-review",        group: "skills", description: "Scored peer review (Light/Medium/Hard) with findings playground", status: "present", knowledge: "fuzzy", detail: "Phase: 4\nUse: /skill architecture-peer-review" },
    { id: "skill-compliance-review",  label: "architecture-compliance-review",  group: "skills", description: "Compliance portfolio health and gap analysis playground", status: "present", knowledge: "fuzzy", detail: "Phase: 4\nUse: /skill architecture-compliance-review" },
    { id: "skill-dev-handoff",        label: "architecture-dev-handoff",        group: "skills", description: "Per-component 16-section handoff docs with deliverable assets", status: "present", knowledge: "fuzzy", detail: "Phase: 5\nUse: /skill architecture-dev-handoff" },
    { id: "skill-doc-export",         label: "architecture-docs-export",        group: "skills", description: "Export architecture docs and handoffs to Word (.docx) files", status: "present", knowledge: "fuzzy", detail: "Phase: 5\nUse: /skill architecture-docs-export" },
    { id: "skill-component-guardian", label: "architecture-component-guardian", group: "skills", description: "Manage docs/components/README.md component index table", status: "present", knowledge: "fuzzy", detail: "Cross-cutting\nUse: /skill architecture-component-guardian" },
    { id: "skill-blueprint",          label: "architecture-blueprint",          group: "skills", description: "Generate Business and Application blueprint markdown", status: "present", knowledge: "fuzzy", detail: "Cross-cutting\nUse: /skill architecture-blueprint" }
  ],

  // ── Edge definitions ──────────────────────────────────────
  edges: [
    // Section tier dependencies
    { from: "s4",  to: "s1-s2", type: "depends-on", label: "derives from" },
    { from: "s4",  to: "s3",    type: "depends-on", label: "guided by" },
    { from: "s5",  to: "s1-s2", type: "depends-on", label: "derives from" },
    { from: "s5",  to: "s4",    type: "depends-on", label: "structured by" },
    { from: "s6",  to: "s5",    type: "depends-on", label: "describes flow of" },
    { from: "s7",  to: "s5",    type: "depends-on", label: "integrates" },
    { from: "s8",  to: "s5",    type: "depends-on", label: "implements" },
    { from: "s9",  to: "s5",    type: "depends-on", label: "secures" },
    { from: "s9",  to: "s7",    type: "depends-on", label: "secures channel" },
    { from: "s9",  to: "s8",    type: "depends-on", label: "constrains" },
    { from: "s10", to: "s5",    type: "depends-on", label: "scales" },
    { from: "s10", to: "s8",    type: "depends-on", label: "benchmarks" },
    { from: "s11", to: "s5",    type: "depends-on", label: "operates" },
    { from: "s11", to: "s8",    type: "depends-on", label: "runs" },
    { from: "s11", to: "s10",   type: "depends-on", label: "monitors" },

    // Lifecycle → outputs
    { from: "phase-1", to: "s1-s2",            type: "produces",   label: "informs" },
    { from: "phase-2", to: "s1-s2",            type: "produces",   label: "creates" },
    { from: "phase-2", to: "s4",               type: "produces",   label: "creates" },
    { from: "phase-2", to: "s5",               type: "produces",   label: "creates" },
    { from: "phase-3", to: "compliance-sre",   type: "produces",   label: "generates" },
    { from: "phase-3", to: "compliance-security", type: "produces", label: "generates" },
    { from: "phase-3", to: "compliance-dev",   type: "produces",   label: "generates" },

    // Lifecycle → skills
    { from: "phase-1", to: "skill-readiness",         type: "uses-skill", label: "uses" },
    { from: "phase-2", to: "skill-docs",              type: "uses-skill", label: "uses" },
    { from: "phase-3", to: "skill-compliance",        type: "uses-skill", label: "uses" },
    { from: "phase-4", to: "skill-peer-review",       type: "uses-skill", label: "uses" },
    { from: "phase-4", to: "skill-compliance-review", type: "uses-skill", label: "uses" },
    { from: "phase-5", to: "skill-dev-handoff",       type: "uses-skill", label: "uses" },
    { from: "phase-5", to: "skill-doc-export",        type: "uses-skill", label: "uses" },

    // Compliance → sections
    { from: "compliance-sre",         to: "s11",  type: "validates", label: "audits" },
    { from: "compliance-bc",          to: "s11",  type: "validates", label: "audits" },
    { from: "compliance-cloud",       to: "s4",   type: "validates", label: "audits" },
    { from: "compliance-data",        to: "s6",   type: "validates", label: "audits" },
    { from: "compliance-dev",         to: "s8",   type: "validates", label: "audits" },
    { from: "compliance-process",     to: "s7",   type: "validates", label: "audits" },
    { from: "compliance-security",    to: "s9",   type: "validates", label: "audits" },
    { from: "compliance-platform",    to: "s4",   type: "validates", label: "audits" },
    { from: "compliance-enterprise",  to: "s1-s2",type: "validates", label: "audits" },
    { from: "compliance-integration", to: "s7",   type: "validates", label: "audits" },

    // Component edges injected here by skill (one per component):
    // { from: "comp-<slug>", to: "s5", type: "implements", label: "part of" }
  ],

  // ── Group definitions ─────────────────────────────────────
  groups: [
    { id: "lifecycle",   label: "Lifecycle Phases",       color: "#8957e5", visible: true },
    { id: "sections",    label: "Architecture Sections",   color: "#58a6ff", visible: true },
    { id: "components",  label: "Components",              color: "#3fb950", visible: true },
    { id: "compliance",  label: "Compliance Contracts",    color: "#d29922", visible: true },
    { id: "principles",  label: "Principles",              color: "#79c0ff", visible: true },
    { id: "skills",      label: "Available Skills",        color: "#f0883e", visible: true }
  ],

  // ── Preset views ──────────────────────────────────────────
  presets: [
    { name: "Full Map",             visibleGroups: ["lifecycle","sections","components","compliance","principles","skills"] },
    { name: "Lifecycle Flow",       visibleGroups: ["lifecycle","skills"] },
    { name: "Section Dependencies", visibleGroups: ["sections"] },
    { name: "Component Map",        visibleGroups: ["sections","components"] },
    { name: "Compliance Coverage",  visibleGroups: ["sections","compliance"] },
    { name: "Principles View",      visibleGroups: ["sections","principles"] }
  ]
};
```

---

## Complete JavaScript Implementation

**CRITICAL**: The playground must embed EVERY function below verbatim in the generated HTML, with all bodies fully implemented. Do NOT elide any function body. Do NOT replace any code with `// ...` comments.

### Canvas Setup

```javascript
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);
```

### Helper Functions

```javascript
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function measureLabel(label) {
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  const w = ctx.measureText(truncate(label, 20)).width + 28;
  return Math.max(130, Math.min(200, w));
}
```

### Node Initialization

```javascript
// Called once on load to assign x, y, w, h to every node.
// Groups are placed in horizontal bands; nodes within each band are spaced evenly.
function initializePositions() {
  const W = canvas.width || 1200;
  const H = canvas.height || 600;

  // Group band configuration: { y center, x start, x end, reserved for right side }
  const bands = {
    lifecycle:   { y: 80,  xStart: 20,       xEnd: W * 0.48 },
    sections:    { y: 240, xStart: 20,       xEnd: W * 0.55 },
    components:  { y: 390, xStart: 20,       xEnd: W * 0.55 },
    compliance:  { y: 240, xStart: W * 0.60, xEnd: W - 20   },
    principles:  { y: 500, xStart: 20,       xEnd: W * 0.55 },
    skills:      { y: 80,  xStart: W * 0.52, xEnd: W - 20   }
  };

  // Group nodes by group id
  const byGroup = {};
  onboardingData.groups.forEach(g => { byGroup[g.id] = []; });
  onboardingData.nodes.forEach(n => {
    if (byGroup[n.group]) byGroup[n.group].push(n);
  });

  // Assign positions for each group
  onboardingData.groups.forEach(g => {
    const nodes = byGroup[g.id];
    if (!nodes || nodes.length === 0) return;
    const band = bands[g.id];
    if (!band) return;

    const totalW = band.xEnd - band.xStart;
    const nodeH = 44;

    // Lay out in rows of up to 5 nodes
    const cols = Math.min(nodes.length, 5);
    const rows = Math.ceil(nodes.length / cols);
    const cellW = totalW / cols;

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const w = measureLabel(node.label);
      const cellCenterX = band.xStart + cellW * col + cellW / 2;
      const rowY = band.y + row * 60;
      node.x = cellCenterX - w / 2;
      node.y = rowY - nodeH / 2;
      node.w = w;
      node.h = nodeH;
    });
  });
}
```

### Visibility Helpers

```javascript
function getVisibleNodes() {
  const visibleGroupIds = new Set(
    onboardingData.groups.filter(g => g.visible).map(g => g.id)
  );
  return onboardingData.nodes.filter(n => visibleGroupIds.has(n.group));
}

function getVisibleEdges() {
  const visibleIds = new Set(getVisibleNodes().map(n => n.id));
  return onboardingData.edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));
}

function getNodeById(id) {
  return onboardingData.nodes.find(n => n.id === id);
}

function getGroupColor(groupId) {
  const g = onboardingData.groups.find(g => g.id === groupId);
  return g ? g.color : '#8b949e';
}
```

### Rendering Functions

```javascript
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  getVisibleEdges().forEach(drawEdge);
  getVisibleNodes().forEach(drawNode);
}

function drawNode(node) {
  if (node.x === undefined) return;
  const color = getGroupColor(node.group);
  const isMissing = node.status === 'missing' || node.status === 'not-started';
  const alpha = isMissing ? 0.4 : 1.0;
  const knowledgeColor = { know: '#3fb950', fuzzy: '#d29922', unknown: '#cf222e' }[node.knowledge] || '#d29922';

  ctx.save();
  ctx.globalAlpha = alpha;

  // Fill
  ctx.fillStyle = hexToRgba(color, 0.18);
  roundRect(ctx, node.x, node.y, node.w, node.h, 6);
  ctx.fill();

  // Border (dashed if missing)
  ctx.setLineDash(isMissing ? [5, 3] : []);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, node.x, node.y, node.w, node.h, 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // Knowledge accent bar (left edge, 4px wide)
  ctx.globalAlpha = alpha;
  ctx.fillStyle = knowledgeColor;
  ctx.fillRect(node.x, node.y + 6, 4, node.h - 12);

  // Label
  ctx.globalAlpha = isMissing ? 0.5 : 1.0;
  ctx.fillStyle = '#e6edf3';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(node.label, 20), node.x + node.w / 2, node.y + node.h / 2);

  ctx.restore();
}

function drawEdge(edge) {
  const src = getNodeById(edge.from);
  const tgt = getNodeById(edge.to);
  if (!src || !tgt || src.x === undefined || tgt.x === undefined) return;

  const styles = {
    'depends-on': { color: '#58a6ff', dash: [],       width: 1.5 },
    'produces':   { color: '#3fb950', dash: [6, 3],   width: 1.5 },
    'validates':  { color: '#d29922', dash: [3, 3],   width: 1.5 },
    'uses-skill': { color: '#8b949e', dash: [],       width: 1.0 },
    'implements': { color: '#3fb950', dash: [],       width: 1.5 }
  };
  const style = styles[edge.type] || styles['depends-on'];

  // Source and target centers
  const sx = src.x + src.w / 2;
  const sy = src.y + src.h / 2;
  const tx = tgt.x + tgt.w / 2;
  const ty = tgt.y + tgt.h / 2;

  // Angle and arrowhead
  const angle = Math.atan2(ty - sy, tx - sx);
  const arrowLen = 8;
  const arrowAngle = 0.4;

  // Shorten line to node edge (approximate)
  const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
  if (dist < 1) return;
  const endX = tx - Math.cos(angle) * (tgt.w / 2 + 4);
  const endY = ty - Math.sin(angle) * (tgt.h / 2 + 4);
  const startX = sx + Math.cos(angle) * (src.w / 2 + 4);
  const startY = sy + Math.sin(angle) * (src.h / 2 + 4);

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.setLineDash(style.dash);

  // Line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Arrowhead
  ctx.setLineDash([]);
  ctx.fillStyle = style.color;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - arrowLen * Math.cos(angle - arrowAngle), endY - arrowLen * Math.sin(angle - arrowAngle));
  ctx.lineTo(endX - arrowLen * Math.cos(angle + arrowAngle), endY - arrowLen * Math.sin(angle + arrowAngle));
  ctx.closePath();
  ctx.fill();

  // Edge label at midpoint
  if (edge.label) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(edge.label, midX, midY - 6);
  }

  ctx.restore();
}
```

### Force-Directed Auto-Layout

```javascript
function autoLayout() {
  const REPULSION = 6000;
  const ATTRACTION = 0.04;
  const DAMPING = 0.85;
  const REST_LEN = 180;
  const W = canvas.width;
  const H = canvas.height;

  const nodes = getVisibleNodes();
  // Initialize velocities
  nodes.forEach(n => { n.vx = 0; n.vy = 0; });

  for (let iter = 0; iter < 200; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
        const bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const dx = bx - ax, dy = by - ay;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Attraction along edges
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    getVisibleEdges().forEach(edge => {
      const src = nodeMap[edge.from], tgt = nodeMap[edge.to];
      if (!src || !tgt) return;
      const sx = src.x + src.w / 2, sy = src.y + src.h / 2;
      const tx = tgt.x + tgt.w / 2, ty = tgt.y + tgt.h / 2;
      const dx = tx - sx, dy = ty - sy;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = ATTRACTION * (dist - REST_LEN);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      src.vx += fx; src.vy += fy;
      tgt.vx -= fx; tgt.vy -= fy;
    });

    // Update positions with damping, clamp to canvas bounds
    nodes.forEach(n => {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(10, Math.min(W - n.w - 10, n.x));
      n.y = Math.max(10, Math.min(H - n.h - 10, n.y));
    });
  }

  draw();
}
```

### Drag Interaction

```javascript
let dragNode = null;
let dragOffX = 0, dragOffY = 0;
let hasDragged = false;

function hitTest(mx, my) {
  const nodes = getVisibleNodes();
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.x === undefined) continue;
    if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h) return n;
  }
  return null;
}

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const node = hitTest(mx, my);
  if (node) {
    dragNode = node;
    dragOffX = mx - node.x;
    dragOffY = my - node.y;
    hasDragged = false;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (dragNode) {
    dragNode.x = mx - dragOffX;
    dragNode.y = my - dragOffY;
    hasDragged = true;
    draw();
  } else {
    // Tooltip on hover
    const node = hitTest(mx, my);
    if (node) {
      showTooltip(node, e.clientX, e.clientY);
      canvas.style.cursor = 'pointer';
    } else {
      hideTooltip();
      canvas.style.cursor = 'grab';
    }
  }
});

canvas.addEventListener('mouseup', () => {
  dragNode = null;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
  dragNode = null;
  hideTooltip();
  canvas.style.cursor = 'grab';
});
```

### Tooltip

```javascript
function showTooltip(node, clientX, clientY) {
  const color = getGroupColor(node.group);
  const groupLabel = (onboardingData.groups.find(g => g.id === node.group) || {}).label || node.group;
  const statusBadge = { complete: '✅', present: '✅', 'in-progress': '🔄', 'not-started': '⭕', missing: '👻', valid: '✅', expired: '⚠️' }[node.status] || '⭕';
  const detailLines = (node.detail || '').split('\n').map(l => `<div style="color:#8b949e;font-size:11px">${l}</div>`).join('');
  tooltip.innerHTML = `
    <div style="font-weight:600;color:${color};margin-bottom:4px">${node.label} ${statusBadge}</div>
    <div style="font-size:11px;color:#8b949e;margin-bottom:6px">${groupLabel}</div>
    <div style="font-size:12px;color:#e6edf3;margin-bottom:6px">${node.description}</div>
    ${detailLines}
  `;
  tooltip.style.display = 'block';
  tooltip.style.left = (clientX + 14) + 'px';
  tooltip.style.top = (clientY - 10) + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}
```

### Preset and Group Toggle Logic

```javascript
function applyPreset(presetName) {
  const preset = onboardingData.presets.find(p => p.name === presetName);
  if (!preset) return;
  onboardingData.groups.forEach(g => {
    g.visible = preset.visibleGroups.includes(g.id);
  });
  // Sync group toggle checkboxes
  onboardingData.groups.forEach(g => {
    const cb = document.getElementById('toggle-' + g.id);
    if (cb) cb.checked = g.visible;
  });
  draw();
  updatePrompt();
  buildNodeList();
}

function toggleGroup(groupId, visible) {
  const g = onboardingData.groups.find(g => g.id === groupId);
  if (g) g.visible = visible;
  draw();
  updatePrompt();
  buildNodeList();
}
```

### Knowledge Cycling

```javascript
const knowledgeCycle = ['fuzzy', 'know', 'unknown'];

function cycleKnowledge(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  const idx = knowledgeCycle.indexOf(node.knowledge);
  node.knowledge = knowledgeCycle[(idx + 1) % knowledgeCycle.length];
  draw();
  updatePrompt();
  // Update button label in sidebar
  const btn = document.getElementById('kb-' + nodeId);
  if (btn) {
    btn.textContent = capitalize(node.knowledge);
    btn.className = 'knowledge-btn ' + node.knowledge;
  }
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function resetKnowledge() {
  onboardingData.nodes.forEach(n => { n.knowledge = 'fuzzy'; });
  draw();
  updatePrompt();
  buildNodeList();
}
```

### Node List Builder

```javascript
function buildNodeList() {
  const list = document.getElementById('node-list');
  if (!list) return;
  list.innerHTML = '';
  getVisibleNodes().forEach(node => {
    const color = getGroupColor(node.group);
    const row = document.createElement('div');
    row.className = 'node-row';
    row.innerHTML = `
      <span class="group-dot" style="background:${color}"></span>
      <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${node.label}">${truncate(node.label, 26)}</span>
      <button id="kb-${node.id}" class="knowledge-btn ${node.knowledge}" onclick="cycleKnowledge('${node.id}')">${capitalize(node.knowledge)}</button>
    `;
    list.appendChild(row);
  });
}
```

### Learning Prompt Generator

```javascript
function updatePrompt() {
  const visibleNodes = getVisibleNodes();
  const knows   = visibleNodes.filter(n => n.knowledge === 'know');
  const fuzzies = visibleNodes.filter(n => n.knowledge === 'fuzzy');
  const unknowns = visibleNodes.filter(n => n.knowledge === 'unknown');
  const allFuzzy = knows.length === 0 && unknowns.length === 0;

  const projectLine = `I'm onboarding to the ${onboardingData.project} architecture (${onboardingData.architectureType} pattern, ${onboardingData.structureType} docs).`;

  let prompt = projectLine + '\n\n';

  if (allFuzzy) {
    prompt += 'I\'m starting from scratch on all of these:\n';
    fuzzies.forEach(n => { prompt += `• ${n.label} — ${n.description}\n`; });
  } else {
    if (knows.length > 0) {
      prompt += 'I already understand:\n';
      knows.forEach(n => { prompt += `• ${n.label} — ${n.detail ? n.detail.split('\n')[0] : n.description}\n`; });
      prompt += '\n';
    }
    if (fuzzies.length > 0) {
      prompt += 'I\'m fuzzy on:\n';
      fuzzies.forEach(n => { prompt += `• ${n.label} — ${n.description}\n`; });
      prompt += '\n';
    }
    if (unknowns.length > 0) {
      prompt += 'I don\'t yet know:\n';
      unknowns.forEach(n => { prompt += `• ${n.label}\n`; });
      prompt += '\n';
    }
  }

  const visibleEdges = getVisibleEdges().slice(0, 8);
  if (visibleEdges.length > 0) {
    prompt += 'Key relationships I want to understand:\n';
    visibleEdges.forEach(e => {
      const src = getNodeById(e.from), tgt = getNodeById(e.to);
      if (src && tgt) prompt += `• ${src.label} → ${tgt.label} (${e.label || e.type})\n`;
    });
    prompt += '\n';
  }

  prompt += 'Please explain the fuzzy and unknown concepts in dependency order (foundational concepts first). Build on what I already know. Where relevant, reference specific docs/ files. Use concrete examples from this architecture.';

  const el = document.getElementById('prompt-text');
  if (el) el.textContent = prompt;
}
```

### Initialization Sequence

```javascript
// Called once the DOM is ready. Order matters.
function init() {
  resizeCanvas();           // Set canvas dimensions
  initializePositions();    // Assign x, y, w, h to all nodes
  buildGroupToggles();      // Render group checkboxes in sidebar
  buildPresetSelector();    // Populate preset dropdown
  buildNodeList();          // Render scrollable node list
  updatePrompt();           // Populate learning prompt
  draw();                   // First render
}

document.addEventListener('DOMContentLoaded', init);
```

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Architecture Onboarding — [PROJECT]</title>
  <style>
    /* [All CSS inlined — see Styling section] */
  </style>
</head>
<body>
  <!-- Header -->
  <div id="header">
    <span class="header-title">Architecture Onboarding</span>
    <span class="chip chip-project">[PROJECT]</span>
    <span class="chip chip-arch">[ARCH_TYPE]</span>
    <span class="chip chip-struct">[STRUCT_TYPE]</span>
    <span class="chip">[DATE]</span>
    <!-- Stat chips: phases complete, ADR count, component count, avg score -->
    <span class="chip stat">[STATS]</span>
  </div>

  <!-- Canvas -->
  <canvas id="map-canvas"></canvas>

  <!-- Tooltip (absolutely positioned over canvas) -->
  <div id="tooltip"></div>

  <!-- Bottom panels -->
  <div id="bottom-panels">
    <!-- Sidebar -->
    <div id="sidebar">
      <div id="controls">
        <select id="preset-select" onchange="applyPreset(this.value)"></select>
        <button onclick="autoLayout()">Auto-layout</button>
        <button onclick="resetKnowledge()">Reset</button>
      </div>
      <div id="group-toggles"></div>
      <div id="node-list"></div>
    </div>

    <!-- Prompt panel -->
    <div id="prompt-panel">
      <div class="panel-label">LEARNING PROMPT</div>
      <pre id="prompt-text"></pre>
      <button id="copy-btn" onclick="copyPrompt()">Copy Learning Prompt</button>
    </div>
  </div>

  <script>
    /* [All JS inlined: onboardingData + all functions from above] */
  </script>
</body>
</html>
```

---

## Styling

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0d1117;
  --surface:   #161b22;
  --border:    #30363d;
  --text:      #e6edf3;
  --muted:     #8b949e;
  --accent:    #58a6ff;
  --know:      #3fb950;
  --fuzzy:     #d29922;
  --unknown:   #cf222e;
}

body { display: flex; flex-direction: column; height: 100vh; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }

#header { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--surface); border-bottom: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap; }
.header-title { font-weight: 700; font-size: 14px; color: var(--text); margin-right: 4px; }
.chip { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: var(--border); color: var(--muted); }
.chip-project { background: #1f2d3d; color: var(--accent); }
.chip-arch    { background: #2d1f3d; color: #8957e5; }
.chip-struct  { background: #1f2d1f; color: #3fb950; }
.chip.stat    { background: #1f2820; color: var(--text); }

#map-canvas { display: block; flex: 1; background: var(--bg); cursor: grab; min-height: 0; }

#tooltip { position: fixed; display: none; background: #21262d; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; max-width: 280px; z-index: 100; pointer-events: none; font-size: 12px; line-height: 1.5; }

#bottom-panels { display: flex; height: 220px; flex-shrink: 0; border-top: 1px solid var(--border); }

#sidebar { width: 40%; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
#controls { display: flex; gap: 6px; padding: 8px 10px; flex-shrink: 0; }
#controls select { flex: 1; background: var(--bg); color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 4px 6px; font-size: 12px; }
#controls button { padding: 4px 10px; background: var(--bg); color: var(--muted); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; font-size: 12px; }
#controls button:hover { color: var(--text); border-color: var(--muted); }

#group-toggles { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 10px; flex-shrink: 0; }
.group-toggle { display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; }
.group-toggle input { accent-color: var(--accent); }

#node-list { flex: 1; overflow-y: auto; padding: 4px 10px; }
.node-row { display: flex; align-items: center; gap: 6px; padding: 3px 0; }
.group-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.knowledge-btn { padding: 1px 7px; border-radius: 10px; border: 1px solid; cursor: pointer; font-size: 11px; background: transparent; }
.knowledge-btn.know    { color: var(--know);    border-color: var(--know); }
.knowledge-btn.fuzzy   { color: var(--fuzzy);   border-color: var(--fuzzy); }
.knowledge-btn.unknown { color: var(--unknown); border-color: var(--unknown); }

#prompt-panel { flex: 1; background: var(--surface); display: flex; flex-direction: column; overflow: hidden; padding: 8px 12px; gap: 6px; }
.panel-label { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: 0.08em; flex-shrink: 0; }
#prompt-text { flex: 1; overflow-y: auto; font-size: 11px; line-height: 1.5; color: var(--text); white-space: pre-wrap; font-family: inherit; }
#copy-btn { align-self: flex-end; padding: 5px 14px; background: var(--accent); color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; flex-shrink: 0; }
```

### Copy Button Handler

```javascript
function copyPrompt() {
  const text = document.getElementById('prompt-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Learning Prompt'; }, 2000);
  });
}
```

### Group Toggle Builder

```javascript
function buildGroupToggles() {
  const container = document.getElementById('group-toggles');
  if (!container) return;
  container.innerHTML = '';
  onboardingData.groups.forEach(g => {
    const label = document.createElement('label');
    label.className = 'group-toggle';
    label.innerHTML = `
      <input type="checkbox" id="toggle-${g.id}" ${g.visible ? 'checked' : ''}
             onchange="toggleGroup('${g.id}', this.checked)">
      <span class="group-dot" style="background:${g.color}"></span>
      <span>${g.label}</span>
    `;
    container.appendChild(label);
  });
}
```

### Preset Selector Builder

```javascript
function buildPresetSelector() {
  const sel = document.getElementById('preset-select');
  if (!sel) return;
  onboardingData.presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}
```

---

## Pre-Populating from the Skill

The skill workflow (Step 5 in SKILL.md) produces a fully populated `onboardingData` object and passes it to the playground. The playground embeds the object as the literal `const onboardingData = { ... }` in the script tag, replacing the schema above.

Modifications the skill makes before passing to the playground:

1. **Replace status values** on lifecycle, section, and compliance nodes based on extracted data
2. **Inject component nodes** — one node per entry in `docs/components/README.md` (up to 15), using id `comp-<slug>`
3. **Inject component edges** — `{ from: "comp-<slug>", to: "s5", type: "implements", label: "part of" }`
4. **Update compliance nodes** with actual score and date from `COMPLIANCE_MANIFEST.md`
5. **Update principle nodes** with `status: "missing"` for any of the 9 not present in S3
6. **Update phase statuses** based on artifact presence (PO Spec, compliance manifest, handoffs)
7. **Update header chips** — stat chips show: phases complete count, ADR count, component count, avg compliance score

The playground does NOT modify `onboardingData` — it embeds it as-is and renders from it.
