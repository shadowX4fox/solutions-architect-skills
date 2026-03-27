# Architecture Onboarding Concept Map Template

Use this template when the playground generates the interactive architecture onboarding explorer. It produces a canvas-based concept map with draggable nodes representing architecture sections, components, compliance contracts, lifecycle phases, principles, and skills — connected by dependency, workflow, and validation edges. Users cycle knowledge levels per node (Know / Fuzzy / Unknown) and generate a targeted learning prompt shaped by their gaps.

## Layout

```
+------------------------------------------------------------+
|                                                            |
|   Canvas (draggable nodes, edges, tooltips on hover)       |
|   Nodes colored by group. Drag to rearrange.               |
|   Click node to select. Click two nodes to draw edge.      |
|                                                            |
+--------------------------------+---------------------------+
| Sidebar                        | Prompt Output             |
|                                |                           |
| [ Preset ▼ ]  [ Auto-layout ]  | I'm onboarding to the    |
|                                | [PROJECT] architecture.   |
| Group toggles:                 | I already know: ...       |
| ■ Lifecycle   ■ Sections       | I'm fuzzy on: ...         |
| ■ Components  ■ Compliance     | I don't know: ...         |
| ■ Principles  ■ Skills         |                           |
|                                | [ Copy Learning Prompt ]  |
| Node list (scrollable):        |                           |
| ○ Know  ● Fuzzy  ◌ Unknown    |                           |
| [Phase 1: Readiness] ●         |                           |
| [S1+S2: System Overview] ●     |                           |
| [S3: Principles] ●             |                           |
| ...                            |                           |
|                                |                           |
| [ Reset Knowledge ]            |                           |
+--------------------------------+---------------------------+
```

## Key Components

### Canvas Panel (top, ~60% height)

The main interaction surface. Renders nodes and edges on a `<canvas>` element.

**Node rendering:**
- Shape: Rounded rectangle (padding 10px, radius 6px)
- Width: auto-sized to label (min 120px, max 200px), height: 40px
- Fill: group color at 20% opacity for ghost nodes (`status: "missing"`), 90% opacity for present nodes
- Border: 2px solid group color; dashed for ghost nodes
- Knowledge indicator: left border accent color — green (Know `#3fb950`), amber (Fuzzy `#d29922`), red (Unknown `#cf222e`)
- Label: centered text, 13px system font, white for present nodes, 50% opacity for ghost nodes
- Status badge: small circle top-right — green dot (complete/present), amber (in-progress), grey (not-started/missing)

**Edge rendering:**
- `depends-on`: solid line `#58a6ff` blue, arrowhead at target
- `produces`: dashed line `#3fb950` green, arrowhead at target
- `validates`: dotted line `#d29922` amber, arrowhead at target
- `uses-skill`: thin solid `#8b949e` grey, arrowhead at target
- `implements`: solid line `#3fb950` green, small diamond at source
- Edge labels: 11px grey text centered on edge midpoint

**Tooltip on hover:**
- Absolutely positioned `<div>` over canvas
- Shows: node label (bold), group, description, detail lines, status badge
- Dark background `#21262d`, 1px border `#30363d`, 8px radius
- Max width 280px

**Interaction:**
- **Drag**: mousedown on node → track offset → mousemove updates position → mouseup releases
- **Select**: click without drag → highlights node, shows info in sidebar detail area
- **Edge mode**: when "Draw Edge" is active, click source then target node
- **Force-directed layout** (Auto-layout button): spring simulation — repulsion between all node pairs, attraction along edges, 150 iterations with 0.85 damping factor

### Sidebar Panel (bottom-left)

**Preset selector**: Dropdown with named presets controlling which groups are visible:

| Preset | Visible Groups |
|--------|---------------|
| Full Map | All 6 groups |
| Lifecycle Flow | lifecycle, skills |
| Section Dependencies | sections |
| Component Map | sections, components |
| Compliance Coverage | sections, compliance |
| Principles View | sections, principles |

**Group toggles**: Checkboxes for each group — toggles node and edge visibility for that group.

**Node list**: Scrollable list of all nodes. Each row:
- Node label (truncated at 28 chars)
- Knowledge cycle button: `● Fuzzy` → click cycles Know → Fuzzy → Unknown → Know
- Color matches group color

**Actions:**
- `Auto-layout` button: triggers force-directed layout
- `Reset Knowledge` button: sets all nodes back to "fuzzy"

### Prompt Output Panel (bottom-right)

Generates a targeted learning prompt in real-time as user adjusts knowledge levels.

**Prompt template:**
```
I'm onboarding to the [PROJECT] architecture ([ARCH_TYPE] pattern).

I already understand:
[• node label — node detail summary (one per "know" node)]

I'm fuzzy on:
[• node label — node description (one per "fuzzy" node)]

I don't yet know:
[• node label (one per "unknown" node)]

Key relationships I want to understand (from the concept map):
[• source → target (edge label)]

Please explain the fuzzy and unknown concepts in order of dependency (foundational concepts first). Build on what I already know. Where relevant, reference specific docs/ files. Use concrete examples.
```

Only includes nodes from visible groups. If all nodes are "fuzzy" (initial state), prompt intro says "I'm starting from scratch on all of these."

**[ Copy Learning Prompt ]** button: copies prompt text with "Copied!" flash.

---

## State Schema

```javascript
const onboardingData = {
  // ── Project metadata ──────────────────────────────────────
  project: "Project Name",
  architectureType: "META",        // "META" | "3-Tier" | "Microservices" | "N-Layer" | "BIAN" | "unknown"
  structureType: "multi-file",     // "multi-file" | "monolithic"
  generatedDate: "2026-03-27",

  // ── Node definitions ──────────────────────────────────────
  // Each node is a concept in the map.
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
      label: "Phase 2: Documentation",
      group: "lifecycle",
      description: "Architecture design — creates the 12-section ARCHITECTURE.md suite",
      status: "complete",          // "complete" if docs/ has all sections, "in-progress" if partial, "not-started"
      knowledge: "fuzzy",
      detail: "Owner: Architecture Team\nSkill: /skill architecture-docs\nOutput: ARCHITECTURE.md + docs/"
    },
    {
      id: "phase-3",
      label: "Phase 3: Compliance",
      group: "lifecycle",
      description: "Compliance contracts — 10 adherence contracts generated from ARCHITECTURE.md",
      status: "not-started",       // "complete" if all 10 valid, "in-progress" if partial, "not-started"
      knowledge: "fuzzy",
      detail: "Owner: Compliance Team\nSkill: /skill architecture-compliance\nOutput: compliance-docs/ (10 contracts)"
    },
    {
      id: "phase-4",
      label: "Phase 4: Review",
      group: "lifecycle",
      description: "Quality review — peer review and compliance gap analysis",
      status: "not-started",
      knowledge: "fuzzy",
      detail: "Owner: Architecture Team\nSkills: /skill architecture-peer-review\n        /skill architecture-compliance-review"
    },
    {
      id: "phase-5",
      label: "Phase 5: Dev Handoff",
      group: "lifecycle",
      description: "Per-component 16-section handoff documents for development teams",
      status: "not-started",       // "complete" if docs/handoffs/ has files, else "not-started"
      knowledge: "fuzzy",
      detail: "Owner: Architecture Team\nSkills: /skill architecture-dev-handoff\n        /skill architecture-docs-export"
    },

    // ── Architecture Section nodes (S1-S12, up to 11 slots) ──
    {
      id: "s1-s2",
      label: "S1+S2: System Overview",
      group: "sections",
      description: "Executive summary, system description, key metrics, design drivers",
      status: "present",           // "present" if docs/01-system-overview.md exists, else "missing"
      knowledge: "fuzzy",
      detail: "File: docs/01-system-overview.md\nTier: 0 — Foundation\nNo upstream dependencies"
    },
    {
      id: "s3",
      label: "S3: Principles",
      group: "sections",
      description: "9 required architecture principles: Separation of Concerns, HA, Scalability, Security by Design, Observability, Resilience, Simplicity, Cloud-Native, Open Standards",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/02-architecture-principles.md\nTier: 0 — Foundation\nNo upstream dependencies"
    },
    {
      id: "s4",
      label: "S4: Architecture Layers",
      group: "sections",
      description: "Layer structure for the detected architecture type (META 6-layer, 3-Tier, Microservices, etc.)",
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
      description: "Approved technology catalog — languages, frameworks, libraries, tools with versions",
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
      description: "Operational considerations — monitoring, deployment, DR, backup, incident management",
      status: "present",
      knowledge: "fuzzy",
      detail: "File: docs/09-operational-considerations.md\nTier: 5 — Operations\nDerives from S5, S8, S10"
    },
    {
      id: "s12",
      label: "S12: ADRs",
      group: "sections",
      description: "Architecture Decision Records — documented decisions with context, rationale, and trade-offs",
      status: "present",           // "present" if adr/ directory exists with files
      knowledge: "fuzzy",
      detail: "Directory: adr/\nTier: 0 — Foundation\nCreated throughout the lifecycle"
    },

    // ── Component nodes (variable, up to 15 from docs/components/README.md) ──
    // EXAMPLE — replace with actual extracted components:
    // {
    //   id: "comp-api-gateway",
    //   label: "API Gateway",
    //   group: "components",
    //   description: "Entry point for all API traffic",
    //   status: "present",
    //   knowledge: "fuzzy",
    //   detail: "File: docs/components/01-api-gateway.md\nType: API"
    // },

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
      description: "Data & AI Architecture compliance — data quality, governance, AI model lifecycle",
      status: "missing",
      knowledge: "fuzzy",
      detail: "Score: —\nValidates: S6 (Data Flow)"
    },
    {
      id: "compliance-dev",
      label: "Development Contract",
      group: "compliance",
      description: "Development Architecture compliance — tech stack alignment, code standards, CI/CD",
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
    { id: "p-soc", label: "Separation of Concerns", group: "principles", description: "Each component has a single, well-defined responsibility", status: "present", knowledge: "fuzzy", detail: "Required principle #1\nCheck: docs/02-architecture-principles.md" },
    { id: "p-ha", label: "High Availability", group: "principles", description: "System designed for continuous operation and fault tolerance", status: "present", knowledge: "fuzzy", detail: "Required principle #2" },
    { id: "p-scale", label: "Scalability First", group: "principles", description: "Architecture designed to scale horizontally from the start", status: "present", knowledge: "fuzzy", detail: "Required principle #3" },
    { id: "p-sec", label: "Security by Design", group: "principles", description: "Security controls built in at every layer, not bolted on", status: "present", knowledge: "fuzzy", detail: "Required principle #4" },
    { id: "p-obs", label: "Observability", group: "principles", description: "System state always inferable from logs, metrics, and traces", status: "present", knowledge: "fuzzy", detail: "Required principle #5" },
    { id: "p-res", label: "Resilience", group: "principles", description: "Graceful degradation and recovery from failures", status: "present", knowledge: "fuzzy", detail: "Required principle #6" },
    { id: "p-sim", label: "Simplicity", group: "principles", description: "Prefer the simplest solution that meets requirements", status: "present", knowledge: "fuzzy", detail: "Required principle #7" },
    { id: "p-cn", label: "Cloud-Native", group: "principles", description: "Designed for cloud deployment: containers, managed services, IaC", status: "present", knowledge: "fuzzy", detail: "Required principle #8" },
    { id: "p-os", label: "Open Standards", group: "principles", description: "Avoid vendor lock-in through open protocols and formats", status: "present", knowledge: "fuzzy", detail: "Required principle #9" },

    // ── Skill nodes (always 9) ──
    { id: "skill-readiness", label: "/skill architecture-readiness", group: "skills", description: "Requirements elicitation — PO Spec creation and evaluation", status: "present", knowledge: "fuzzy", detail: "Phase: 1\nTriggers: requirements elicitation, PO spec, business requirements" },
    { id: "skill-docs", label: "/skill architecture-docs", group: "skills", description: "Create and maintain ARCHITECTURE.md — 12-section documentation", status: "present", knowledge: "fuzzy", detail: "Phase: 2\nTriggers: architecture docs, create ARCHITECTURE.md" },
    { id: "skill-compliance", label: "/skill architecture-compliance", group: "skills", description: "Generate 10 compliance contracts from ARCHITECTURE.md", status: "present", knowledge: "fuzzy", detail: "Phase: 3\nTriggers: compliance contracts, architecture compliance" },
    { id: "skill-peer-review", label: "/skill architecture-peer-review", group: "skills", description: "Scored peer review (Light/Medium/Hard) with interactive findings playground", status: "present", knowledge: "fuzzy", detail: "Phase: 4\nTriggers: peer review, architecture review, architecture quality" },
    { id: "skill-compliance-review", label: "/skill architecture-compliance-review", group: "skills", description: "Compliance portfolio health dashboard and gap analysis playground", status: "present", knowledge: "fuzzy", detail: "Phase: 4\nTriggers: review compliance, compliance health, compliance gaps" },
    { id: "skill-dev-handoff", label: "/skill architecture-dev-handoff", group: "skills", description: "Per-component 16-section handoff documents with deliverable assets", status: "present", knowledge: "fuzzy", detail: "Phase: 5\nTriggers: dev handoff, component handoff" },
    { id: "skill-doc-export", label: "/skill architecture-docs-export", group: "skills", description: "Export architecture docs and handoffs to Word (.docx) files", status: "present", knowledge: "fuzzy", detail: "Phase: 5\nTriggers: export, Word export, docx" },
    { id: "skill-component-guardian", label: "/skill architecture-component-guardian", group: "skills", description: "Manage docs/components/README.md component index table", status: "present", knowledge: "fuzzy", detail: "Phase: Cross-cutting\nTriggers: component index, add component" },
    { id: "skill-blueprint", label: "/skill architecture-blueprint", group: "skills", description: "Generate Business and Application blueprint markdown from ARCHITECTURE.md", status: "present", knowledge: "fuzzy", detail: "Phase: Cross-cutting\nTriggers: blueprint, initiative data, datos de iniciativa" }
  ],

  // ── Edge definitions ──────────────────────────────────────
  // type: "depends-on" | "produces" | "validates" | "uses-skill" | "implements"
  edges: [
    // Section tier dependencies (always present)
    { from: "s4", to: "s1-s2", type: "depends-on", label: "derives from" },
    { from: "s4", to: "s3", type: "depends-on", label: "guided by" },
    { from: "s5", to: "s1-s2", type: "depends-on", label: "derives from" },
    { from: "s5", to: "s4", type: "depends-on", label: "structured by" },
    { from: "s6", to: "s5", type: "depends-on", label: "describes flow of" },
    { from: "s7", to: "s5", type: "depends-on", label: "integrates" },
    { from: "s8", to: "s5", type: "depends-on", label: "implements" },
    { from: "s9", to: "s5", type: "depends-on", label: "secures" },
    { from: "s9", to: "s7", type: "depends-on", label: "secures channel" },
    { from: "s9", to: "s8", type: "depends-on", label: "constrains" },
    { from: "s10", to: "s5", type: "depends-on", label: "scales" },
    { from: "s10", to: "s8", type: "depends-on", label: "benchmarks" },
    { from: "s11", to: "s5", type: "depends-on", label: "operates" },
    { from: "s11", to: "s8", type: "depends-on", label: "runs" },
    { from: "s11", to: "s10", type: "depends-on", label: "monitors" },

    // Lifecycle phases → outputs (produces)
    { from: "phase-1", to: "s1-s2", type: "produces", label: "informs" },
    { from: "phase-2", to: "s1-s2", type: "produces", label: "creates" },
    { from: "phase-2", to: "s4", type: "produces", label: "creates" },
    { from: "phase-2", to: "s5", type: "produces", label: "creates" },
    { from: "phase-3", to: "compliance-sre", type: "produces", label: "generates" },
    { from: "phase-3", to: "compliance-security", type: "produces", label: "generates" },
    { from: "phase-3", to: "compliance-dev", type: "produces", label: "generates" },

    // Lifecycle phases → skills (uses-skill)
    { from: "phase-1", to: "skill-readiness", type: "uses-skill", label: "uses" },
    { from: "phase-2", to: "skill-docs", type: "uses-skill", label: "uses" },
    { from: "phase-3", to: "skill-compliance", type: "uses-skill", label: "uses" },
    { from: "phase-4", to: "skill-peer-review", type: "uses-skill", label: "uses" },
    { from: "phase-4", to: "skill-compliance-review", type: "uses-skill", label: "uses" },
    { from: "phase-5", to: "skill-dev-handoff", type: "uses-skill", label: "uses" },
    { from: "phase-5", to: "skill-doc-export", type: "uses-skill", label: "uses" },

    // Compliance contracts → sections they validate (validates)
    { from: "compliance-sre", to: "s11", type: "validates", label: "audits" },
    { from: "compliance-bc", to: "s11", type: "validates", label: "audits" },
    { from: "compliance-cloud", to: "s4", type: "validates", label: "audits" },
    { from: "compliance-data", to: "s6", type: "validates", label: "audits" },
    { from: "compliance-dev", to: "s8", type: "validates", label: "audits" },
    { from: "compliance-process", to: "s7", type: "validates", label: "audits" },
    { from: "compliance-security", to: "s9", type: "validates", label: "audits" },
    { from: "compliance-platform", to: "s4", type: "validates", label: "audits" },
    { from: "compliance-enterprise", to: "s1-s2", type: "validates", label: "audits" },
    { from: "compliance-integration", to: "s7", type: "validates", label: "audits" },

    // Component → section edges are injected here by the skill workflow:
    // { from: "comp-<id>", to: "s5", type: "implements", label: "part of" }
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

## Rendering Functions

The playground generates these rendering functions in JavaScript:

```javascript
// Main render loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  getVisibleEdges().forEach(drawEdge);
  getVisibleNodes().forEach(drawNode);
}

// Draw a single node
function drawNode(node) {
  const group = onboardingData.groups.find(g => g.id === node.group);
  const alpha = node.status === "missing" ? 0.35 : 0.9;
  const borderDash = node.status === "missing" ? [6, 3] : [];
  const knowledgeColor = { know: "#3fb950", fuzzy: "#d29922", unknown: "#cf222e" }[node.knowledge];

  ctx.save();
  ctx.globalAlpha = alpha;
  // Fill
  ctx.fillStyle = hexToRgba(group.color, 0.18);
  roundRect(ctx, node.x, node.y, node.w, node.h, 6);
  ctx.fill();
  // Border
  ctx.setLineDash(borderDash);
  ctx.strokeStyle = group.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Knowledge accent bar (left edge, 4px wide)
  ctx.setLineDash([]);
  ctx.fillStyle = knowledgeColor;
  ctx.fillRect(node.x, node.y + 4, 4, node.h - 8);
  // Label
  ctx.fillStyle = "#e6edf3";
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(truncate(node.label, 24), node.x + node.w / 2, node.y + node.h / 2 + 4);
  ctx.restore();
}

// Draw edge with arrow
function drawEdge(edge) {
  const styles = {
    "depends-on":  { color: "#58a6ff", dash: [], width: 1.5 },
    "produces":    { color: "#3fb950", dash: [6, 3], width: 1.5 },
    "validates":   { color: "#d29922", dash: [3, 3], width: 1.5 },
    "uses-skill":  { color: "#8b949e", dash: [], width: 1 },
    "implements":  { color: "#3fb950", dash: [], width: 1.5 }
  };
  const style = styles[edge.type];
  // ... draw line with arrowhead, edge label at midpoint
}

// Force-directed auto-layout
function autoLayout() {
  const REPULSION = 8000, ATTRACTION = 0.05, DAMPING = 0.85;
  for (let iter = 0; iter < 150; iter++) {
    // Apply repulsion between all node pairs
    // Apply spring attraction along edges
    // Update positions with damping
  }
  draw();
}
```

## Styling

Dark theme matching the existing playground suite:

```css
:root {
  --bg:        #0d1117;
  --surface:   #161b22;
  --border:    #30363d;
  --text:      #e6edf3;
  --muted:     #8b949e;
  --accent:    #58a6ff;

  /* Knowledge level colors */
  --know:      #3fb950;
  --fuzzy:     #d29922;
  --unknown:   #cf222e;

  /* Group colors */
  --lifecycle:   #8957e5;
  --sections:    #58a6ff;
  --components:  #3fb950;
  --compliance:  #d29922;
  --principles:  #79c0ff;
  --skills:      #f0883e;
}

body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; }
canvas { display: block; background: var(--bg); cursor: grab; }
.sidebar { background: var(--surface); border-top: 1px solid var(--border); padding: 12px; overflow-y: auto; }
.prompt-panel { background: var(--surface); border-top: 1px solid var(--border); border-left: 1px solid var(--border); padding: 12px; }
.node-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.knowledge-btn { padding: 2px 8px; border-radius: 12px; border: 1px solid; cursor: pointer; font-size: 12px; }
.knowledge-btn.know    { color: var(--know);    border-color: var(--know); }
.knowledge-btn.fuzzy   { color: var(--fuzzy);   border-color: var(--fuzzy); }
.knowledge-btn.unknown { color: var(--unknown); border-color: var(--unknown); }
.group-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.copy-btn { padding: 6px 14px; background: var(--accent); color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
```

## Pre-Populating from the Skill

The skill workflow (Step 5) modifies the state schema above before passing to the playground:

1. **Replace status values** on lifecycle, section, and compliance nodes based on extracted data
2. **Inject component nodes** into `onboardingData.nodes` for each found component (up to 15)
3. **Inject component edges** into `onboardingData.edges` — `{ from: "comp-<id>", to: "s5", type: "implements", label: "part of" }`
4. **Update compliance nodes** with actual scores and dates from manifest
5. **Update principle nodes** with `status: "missing"` for any of the 9 not found in S3
6. **Update phase statuses** based on artifact presence (PO Spec, compliance manifest, handoffs)

## Initial Node Positions

On first load, use a grouped layout before triggering auto-layout:
- Lifecycle phases: top row (horizontal band y=100)
- Sections S1-S12: center cluster (y=280, arranged in tier order left-to-right)
- Components: below sections (y=460)
- Compliance contracts: right cluster (y=280, x=right side)
- Principles: bottom-left (y=600)
- Skills: top-right row (y=100, x=right side)

Auto-layout button triggers force-directed refinement from these seed positions.
