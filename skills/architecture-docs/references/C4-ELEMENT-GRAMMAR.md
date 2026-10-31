# C4 Element Grammar — reading a Mermaid C4 block

The single source of truth for what each element of a Mermaid `C4Context` / `C4Container` block means when the plugin
reads one: the HLD Intake Gate (`workflow1/00-gates.md` Step 0.4), and any reader that extracts systems, containers and
connections from a diagram. It reads; it never sets the conventions a diagram is written to (`DIAGRAM-GENERATION-GUIDE.md`).

## `C4Context` blocks

- `Person(id, "name", "description")` → a person (an actor — reported, not a model element)
- `Person_Ext(id, "name", "description")` → an external person
- `System(id, "name", "description")` → an internal system
- `System_Ext(id, "name", "description")` → an external system
- `Rel(from, to, "description", "protocol")` → a connection. The 3rd parameter carries the verb plus any via-hop, topic,
  queue or async context; the 4th follows the canonical `<PROTOCOL>/<STYLE> [Action Type]` normal form — governed by
  `[design_language_dir]/llms-rules.txt` §5 when a design language is in force, otherwise by the Connection Naming Rule in
  `DIAGRAM-GENERATION-GUIDE.md`. Keep the 4th parameter verbatim.

## `C4Container` blocks

- `Container_Boundary(id, "name")` → the system boundary: its id and name
- `Container(id, "name", "technology", "description")` → an app container
- `ContainerDb(id, "name", "technology", "description")` → a store container
- `ContainerQueue(id, "name", "technology", "description")` → a store container, subtype message broker. Exceptional: by the
  Infrastructure-as-via Rule a transit broker is edge encoding (description + protocol on `Rel()`), not a node
- `Rel(from, to, "description", "protocol")` → a connection; merge with the L1 connections and deduplicate. The same
  normal form applies to the 4th parameter.

**Skip**: `%%{init: ...}%%` directives, `title` lines, comment lines starting with `%%`.

## Governed notation — no `C4Context` / `C4Container` fence

An architecture written in governed mode (`DIAGRAM-GENERATION-GUIDE.md` § Design Language Governance) carries Diagrams 2 and 3
as `flowchart TB` blocks. Read them instead of failing on "zero systems":

- **Systems and containers** — from the component facts (`component-facts.ts list`): C4 L1 descriptors → systems, C4 L2
  components → containers, canonical name, type and technology from the tuple. External systems and persons → the
  `ext`-classed nodes of Diagram 2.
- **Boundary** — the `subgraph` classed `zone` of Diagram 3 → the system boundary's id and name.
- **Connections** — the directed edges of Diagram 3: `A -->|"<label>"| B` is a connection from `A` to `B`, its quoted label in
  the same `<PROTOCOL>/<STYLE> [Action Type]` normal form, kept verbatim; merge with Diagram 2's edges and deduplicate.

Store-shaped nodes (`[( )]`, classed `store`) are store containers; the Infrastructure-as-via Rule applies unchanged — a broker
that appears only in edge labels is edge encoding, not an element.
