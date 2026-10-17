## Architecture Type Selection Workflow

**PURPOSE**: When creating a new ARCHITECTURE.md, prompt the user to select their architecture type. This determines the structure and content of Section 4 (Meta Architecture) and Section 5 (Component Details).

### When to Trigger

**Activate this workflow when:**
- ✅ User asks to create a NEW ARCHITECTURE.md document
- ✅ User explicitly requests to "change architecture type" or "select architecture type"
- ✅ User is updating an existing ARCHITECTURE.md and mentions changing from one architecture type to another

**Prerequisite**: Step 0.1 (documentation language) runs first, then Step 0.2 (PO Spec check), for all new document creation triggers

**Skip this workflow when:**
- ❌ Editing an existing ARCHITECTURE.md (type already selected)
- ❌ User is only updating specific sections unrelated to architecture type
- ❌ Document type is already clear from context

### Available Architecture Types

The types on offer are listed by code (`bun [plugin_dir]/scripts/shared/arch-types.js`): the base's five — **ENTERPRISE** (the default: Channels → Experience → Process → Domain Services → Systems of Record, any industry), **MICROSERVICES**, **3-TIER**, **N-LAYER** and **BIAN** — and any an institution pack adds, which may also set the default.

### Workflow Steps

### Workflow Steps — load map

Workflow 1 is **partitioned by step** (8.13.0+). This file is the router: read it whole (it is
short), then read each part **when the run reaches its step** and never before — the parts are
long because they are complete, and a run that loads them all at once spends the context the
delegation was built to save. Step numbers are global across the parts.

| Read when the run reaches | File | Carries |
|---|---|---|
| A create is being **continued** ("continue the architecture", or `collect.json` with the create unfinished) | `workflow1/resume.md` | One receipt (`resume-prepare.js`, 8.88.0): progress, collection, ADR Context Block, facts, files written and the next command — no exploration; Steps 0.1–4.9 never run again |
| Step 0.1 (the first thing a create does) | `workflow1/00-gates-run.md` | Steps 0.1–0.65 on the common path: `gates-check.js` checks every entry gate from disk and names the `00-gates.md` line range to read for a gate that does not pass (8.87.0) |
| A range `gates-check.js` names | `workflow1/00-gates.md` | The full specification of Steps 0.1–0.65 — **read by line range only**, never whole |
| Step 1 | `workflow1/01-type-selection.md` | Steps 1–4.9 — the type options, the selection, the templates gate (the payloads carry the templates), the type metadata, and Step 4.9: `collect-save.js` writes `.cache/sa-skills/collect.json` and the run goes on to Step 5 |
| Step 5 | `workflow1/05-sections.md` | Step 5 — payload per section, written **in this session** from the payload, the creation order and the loop every section follows (15 KB since 8.88.0) |
| After Step 4.9, when the collection chose **automatic** checkpoints | `workflow1/05-auto.md` | Segments 2–4 by one `segment-runner` sub-agent each, in series; this session does the Layer 2 review, the guardian's index and the user's questions (8.89.0) |
| Item `s5` (Section 5) | `workflow1/05-components.md` | Steps 4a–4g — the C4 systems and containers, one file per component, the guardian's index |
| Item `index` | `workflow1/05-index.md` | `ARCHITECTURE.md`, the type metadata, the closing checks of Step 5 |
| Step 5.7 (after every `docs/` file is written) | `workflow1/05.7-hygiene-gate.md` | The Content Hygiene Gate — BLOCKING before Step 6 |
| Step 6 | `workflow1/06-adrs.md` | ADR delegation to `architecture-definition-record` |
| Step 7 | `workflow1/07-diagrams.md` | Mandatory diagram generation (Workflow 8 in creation) and the closing checks |

**Read once per run.** A part already in context is not re-read; a step that points at another
step (`see Step 5.7`) means that step's part, loaded when the run gets there. Guides the parts name
(`ARCHITECTURE_DOCUMENTATION_GUIDE.md`, `PRINCIPLE_VALIDATION.md`, the diagram guides) keep their
own load maps — and for the sections, the payload replaces the guide entirely.

**Checkpoints (8.87.0).** A create stops four times — after the collection, after Sections 1+2 · 13 · 4 · 5,
after 8 · 3 · 6, after the remaining sections and the index — when `create-progress.js --done` prints a
`CHECKPOINT`. Nothing written before it needs to stay in the session: the payloads read it from disk. The
user clears the session and says "continue the architecture"; `workflow1/resume.md` picks it up. The 8.29.0
run in one session averaged 243K tokens of context per call and ended at 479K.

### Type-Specific Validation

After selecting or detecting architecture type, apply type-specific validation rules:

**BIAN Architecture:**
- ✅ Must have all 5 layers (Channels, BIAN Business Scenarios, BIAN Business Capabilities, BIAN Service Domains, Core Systems)
- ✅ Layer 2 must map to BIAN Business Areas (8 areas)
- ✅ Layer 3 must map to BIAN Business Domains (43 domains)
- ✅ Layer 4 must implement BIAN Service Domains from [BIAN v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
- ✅ All Layer 4 service domain names validated against official [BIAN Service Landscape v14.0.0](https://bian.org/servicelandscape-14-0-0/views/view_54486.html)
- ✅ Layer 4 components must include complete BIAN metadata (Official Name, BIAN ID, Version, Business Domain, Business Area, URL)
- ✅ Control records documented per BIAN specification for all Layer 4 service domains
- ✅ All mandatory BIAN service operations implemented (Initiate, Update, Retrieve, Control)
- ✅ Behavior qualifiers documented per BIAN spec
- ✅ Functional patterns documented per BIAN spec (Managed Object, Tracked Object, etc.)
- ✅ Full BIAN v14.0.0 compliance level documented
- ✅ BIAN hierarchy traceability: Service Domain → Business Domain → Business Area
- ✅ Layers documented in correct order

**ENTERPRISE Architecture:**
- ✅ The five layers in order (Channels, Experience, Process, Domain Services, Systems of Record), each with its containers
- ✅ Cross-cutting capabilities (integration, identity, observability, shared services) documented as such, not as a layer
- ✅ A call that skips a layer names the ADR that allows it

**A pack type:** the checklist its own Section 4 template carries.


**3-Tier Architecture:**
- ✅ Must have all 3 tiers (Presentation, Application, Data)
- ✅ No direct database access from Presentation tier
- ✅ Application tier should be stateless

**Microservices Architecture:**
- ✅ Must document API Gateway and Service Mesh (or justify omission)
- ✅ Database-per-service pattern followed
- ✅ Event bus and topics documented
- ✅ Circuit breakers configured

**N-Layer Architecture:**
- ✅ Must specify which pattern (4-Layer, 5-Layer, Clean, Hexagonal)
- ✅ Dependency direction documented
- ✅ Core/domain layer is framework-free (if applicable)

**For detailed validation rules**, see: `VALIDATIONS.md` § Type-Aware Validation

### Best Practices

**DO:**
- ✅ Always prompt for architecture type when creating new ARCHITECTURE.md
- ✅ Add metadata comment to track architecture type
- ✅ Load appropriate templates based on selection
- ✅ Warn before changing architecture type of existing document
- ✅ Apply type-specific validation rules

**DON'T:**
- ❌ Assume architecture type without asking
- ❌ Mix templates from different architecture types
- ❌ Change architecture type without user confirmation
- ❌ Skip metadata comment (makes future edits harder)

### Example Workflow

**User:** "Create architecture documentation for my microservices system"

**Assistant:**
1. Detects new ARCHITECTURE.md creation
2. Presents architecture type options (1-4)
3. User selects "3" (Microservices)
4. Loads `templates/SECTION_4_MICROSERVICES.md` and `templates/SECTION_5_MICROSERVICES.md`
5. Creates ARCHITECTURE.md with:
   - Standard Sections 1-3
   - Microservices Section 4 (API Gateway, Service Mesh, Services, Event Bus)
   - Microservices Section 5 (Service catalog format)
   - Standard Sections 6-12
   - Metadata comment: `<!-- ARCHITECTURE_TYPE: MICROSERVICES -->`
6. Reports completion with architecture type confirmation

---
