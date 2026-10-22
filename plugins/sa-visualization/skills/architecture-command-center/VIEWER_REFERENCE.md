# Command Center Viewer — Reference

What the rendered `VIEWER_TEMPLATE.html` does: Alia (her dossier and the channel to the brain), the
Simulation mode, findings on the stage, the HUD cues, every capability handed to the user, and the two
themes. `SKILL.md` Step 4 reads § Viewer capabilities to hand the file over; the rest is read when a user
asks how the viewer behaves or a change to the viewer is being made. The workflow (Steps 0–5) does not
depend on it.

## Alia — the Navigator

**Alia** is the command center's voice: the navigator who briefs on whatever the user is
looking at (the name is the Mega Man X navigator's, the same lineage as the `holo` theme).
Her mark is a four-pointed star — a navigator's star, a compass needle — drawn as one inline
SVG so both themes render it alike: focus amber with a glow in `holo`, flat in `atlas`. It sits
before her name in the header button and in her dialog's eyebrow, and before every answer of
the brain's, where it pulses while she thinks. It never appears on the stage: everything on
the floors is a documented element, and she is the voice over the model, not part of it.

**Her presence** (8.127.0). The star is her face, and it carries a **mood** read from the scene —
*calm*; *worried* (a chokepoint in Simulation, a High finding as the open lens's worst); *stern* (a
Critical one, an interrupted use case); *pleased* for a few seconds when every chokepoint clears;
*thinking* while the brain answers. The mood is `data-alia-mood` on the root, so every star of hers
reads it: colour (focus · Medium amber · Critical red · the local-route green) and motion (a breath,
a wobble and flicker, a heartbeat, a quarter turn with sparks, a spin); reduced motion keeps the
colour only. She interrupts through a **codec call**: a frame at the foot of the stage column (above
the transport bar in Simulation) with her star in the call's mood, her name, the kind of call and one
line, and the ways in as buttons. In `holo` it opens on a burst of static with the `NAV-LINK` channel
and types its line; a `flat` skin (`atlas`, `corporate`) shows a plain caption with a stripe in the mood's colour.
One call at a time, a newer one replacing it; it closes after twelve seconds, holds while the pointer
is on it, and takes no part of the stage the labels need (it is reserved like the HUD strip). The calls:
the **worst finding** when a lens opens (Show me · Isolate · Read; the brackets stay on the block until
the call closes or the stage is clicked); the **Simulation** reading when the mode opens (what breaks
first, the findings count, Show me · *Ver la lectura*), a **chokepoint** that appears as the load
changes, **all clear** when the last one goes, an **interrupted** use case. **Tips**: one when the
model opens and one after each minute without input (four at most a session), each shown once and
each a way in — the worst finding on file (High or Critical), an open debt record, a decision's
summary, the busiest block (three connections or more), the longest walkthrough, then the wheel, photo
mode and Simulation. Never over an open dialog, photo mode or Simulation. *No more tips* on a tip
turns them off for the browser; **Settings** switches them back on.

She has two speeds, and she always says which one answered:

1. **Dossier** — baked into the scene at render time by `scripts/dossier.js`. Seven kinds of
   page, each a chip on the model or in her index: **decisions** (ADRs, with the Decision
   summary and consequences), **technical debt** (TDRs, with status, impact, owner and the
   containers they touch), **compliance** (each contract's score and status, and its requirement
   rows colored by status), **descriptors** (a container's own file, section by section:
   purpose, responsibilities, communication tables, deployment, NFRs, constraints) and
   **integrations** (the `I-nn` rows of the inventory) and **findings** (every `analysis/` report:
   the finding's columns as written, its severity, and what it names). The inspector offers a
   container's findings, debt records, descriptor and integration rows under its ADR chips. She answers with what the file
   states and says plainly when something is not on file. Header button **Alia**, or the `a`
   key, opens her index. Nothing in the dossier is authored by the skill: it is extraction, not
   prose. **Display names**: the values the files keep canonical by the language policy — the
   manifest's contract types, the status enums (`Compliant`, `Draft`, `Accepted`, …), the
   analysis slugs (`SPOF`, `COUPLING`) and the data keys of the HTML reports (`fanin`,
   `headroom_pct`, `eol_date`) — are read in the viewer's language through a display layer in
   `VIEWER_TEMPLATE.html` (`T.names`): the dossier is never changed, only how it reads, and a
   value the layer does not know is shown as written. Requirement names, owners and evidence
   are shown as the contract states them, in whatever language it was generated.
2. **Channel to the brain** — a question box at the foot of her dialog, lit only when the file
   is hosted as a Claude artifact that declares the `sample` capability (Step 4b). A saved HTML
   file has no way to reach Claude, and her index says so; a hosted copy resolves
   `claude.use("sample")` and the box appears. Each question goes to Claude on the **viewer's**
   own account (consent is asked on the first one) with a **context pack** the viewer builds at
   that moment: standing rules (answer only from the material, cite ids and full names, say
   plainly what is not on file, answer in the scene's language), the **scene as text** (layers,
   systems, containers with technology and ADRs, connections, routes, phases, use cases and the
   deployment block), the **dossier index** (one line per decision, debt record, contract,
   descriptor, integration and analysis), and the **focus** — the page Alia is open on, the block
   selected on the model and the active highlight — carried on the new question's turn, not
   ahead of the history, so earlier answers keep the focus they were given; the history keeps
   the last eight turns, dropping a question with its answer. Where the viewer allows page tools, the brain
   may call `open_page` (one dossier page, the same text a chip shows, cut at 12 KB) and
   `search_dossier` (where a term appears), and the dialog names each page it reads while it
   thinks. The pack is cut to the runtime's byte cap in a fixed order — focus, index, scene —
   never the rules. The answer streams into the dialog; every `ADR-NNN`, `TDR-NNN` and container
   name it mentions that is on file becomes a chip back to the dossier, so the two speeds are
   interlinked and visibly distinct: the eyebrow reads *Brain*, the voice line is hers — she is
   thinking rather than quoting, from the scene and the dossier, never the project files — and
   the standing rules tell the brain to speak as Alia in the first person. The viewer's Claude
   account is named in the consent hint, because the usage is theirs, and by the brain only when
   the viewer asks what is answering. The
   transcript stays in the dialog
   for follow-up questions; every dossier page and the index carry a *Back to the conversation*
   button in the footer while one exists; entering the conversation lands at its end, the view
   follows a streaming answer only while the reader is at the end, and a *Latest* button in
   the footer jumps there when the history is long. Every dossier page opens at its top. On a
   hosted copy an **Ask me** bar also spans the foot of the stage, between the rail and the
   inspector (the camera dock moved to the top of the stage to make room), so a question has
   the full width to be typed in; it also sits under
   the inspector on the stage, so the channel is reachable without opening her first; a question
   from there carries the block selected on the model. Stop aborts a running answer; a
   decline, a rate limit, a refusal or a dropped connection each get their own plain sentence,
   and the page never retries on its own. Nothing the brain says is written anywhere.

**She plays her answer on the stage** (8.131.0). A question about where something sits, how a request or
a use case flows, or what a component touches can come back as a **storyboard** as well as text: the brain
calls the `stage` tool once with two to six steps, each one short sentence and one action of eight. A tool call
runs before the answer streams, so actions issued one by one would move the stage ahead of the words; the
storyboard is queued instead and plays after the written answer appears. Actions:

| Action | Fields | On the stage |
|---|---|---|
| `block` | `target` — a container's or actor's full name | the camera flies to it and selects it |
| `use_case` | `uc` — a use case id; `phase` optional | the use case lights up, on that phase, and the camera frames its blocks (8.132.1) |
| `path` | `from`, `to` — full names | the documented connections between them, fewest hops first (along their direction, else either way), bracketed `hop 1…n` with Focus on, and her pulses running the hops in order in her colour (8.131.1) |
| `isolate` | `blocks` — 1 to 8 full names | those blocks bracketed, everything else dimmed (Focus) |
| `view` | `view` — `logical` or `physical` | the view switches and the camera returns to the whole model (8.132.1) |
| `layer` | `layer` — `L<n>`, `T<n>` or a layer's name | the camera frames that floor, as its floor button does (8.132.0) |
| `route` | `route` — a route id or name | that kind of connection lights up, as in the rail, and the camera frames the blocks it joins (8.132.1) |
| `finding` | `id` — a finding id; `analysis` when the id is in more than one | the analysis opens on that finding and the camera flies to the block it is named after (8.132.0) |

Every name is held to the scene before anything moves; an unknown one goes back to the brain as an error
naming the step, so it corrects the step instead of the stage guessing. The player owns the codec frame
while a board is up (`Walkthrough · Step i of n`, the sentence, ⏮ ⏸ ⏭ and **Back to where I was**);
other calls (tips, a lens's worst finding) wait until it closes. It advances on its own — 3.8 to 8 s a
step by the sentence's length, plus the camera's flight — and pauses on any input on the stage (a click,
a drag, the wheel, Esc). Every step but `use_case`, `route` and `finding` plays on the full view (Routes · All), a floor focus leaves with its `layer` step: a lit use case or route dims every block
off it, hops of a path included; **Back** restores the highlight the board found. A path's pulses run at a pace per
hop (about 1.3 s), and `path` / `isolate` frame from far enough that the blocks read whole. **Back to where I was** restores the view, the highlight, the selection,
Alia's marks and the camera as they were when the board started; the frame's × leaves the stage as it is.
The answer keeps a **▶ Replay on the stage** button in the conversation.

**She speaks each step** (8.131.1) through the browser's speech synthesis, in the scene's language — in Chrome and Edge always, and in any other browser (Firefox, Brave, Safari, Opera) only when it offers a natural-class voice in that language (a name with Natural, Neural, Online, Google, Premium, Enhanced, Siri or Piper; 8.132.2). Firefox speaks through the operating system, robotic by default; it is fixed on the machine, not the page: Piper as Speech Dispatcher's engine on Linux (the Pied app installs it; restart Firefox after), NaturalVoiceSAPIAdapter on Windows (Edge's Natural voices through SAPI), the Premium / Enhanced voices on macOS (System Settings → Accessibility → Spoken Content). Without such a voice the browser keeps the timer and shows no switch (`es-419`
first for `es`, then any Spanish voice; `en-US` for `en`). With her voice on, a step lasts as long as its sentence
plus a beat, rather than the timer; her star breathes while she talks. **Her voice is off until switched on in Settings**
(`acc-voice`, kept in this browser); while it is on, 🔊 in the frame mutes her, which switches the setting off. Voices are ranked natural first — Edge's *Online (Natural)*, Google's, Apple's
*Premium* / *Enhanced* — over system synthesizers (eSpeak, Festival, Pico); when the browser has more than one in
the scene's language, Settings lists them, remembers the pick and plays a sample (*Try it*). No artifact capability speaks, so
the voice is the browser's: Edge's natural voices sound best. A browser without speech synthesis says so in Settings and keeps the timer;
pausing, stepping, closing and **Back** silence her at once. Not in the load simulation or
photo mode (the tool answers the brain with an error there). Read-only, like every tool of hers.

### Alia simulates load

Her one function that is not a reading: the **Simulation mode**, opened from her index chip
*Simulación de carga* or the `s` key, painted over the Physical view, and opens on the whole model
(load runs everywhere; a use case's route is never framed while it runs), or on the plan's page when
the plan is being read. The model is
`scripts/simulation.js` (pure; `render.js` inlines it; `tests/simulation.test.ts` holds it):
the demand of each use case — docs/08 § Demand by Use Case, in rps, sessions as a gauge — walks
the phases' hops onto the receiving containers and splits over the live instances of
`deployment.instances`; **ρ = λ ÷ (replicas × capacity per replica)** from the descriptors'
`## Capacity` tables (the scene's `capacity` block, `scene-from-docs.js --capacity-check`).

- **The stage reads at a glance** (8.156.0):
  - **Height is the load, in both projections**: 0.3 + 1.4ρ, and a **limit frame** at the height ρ 1 over every sized block — the block a level, the frame its brim (amber; red when the block is over it).
  - **A path is as thick as what it carries**, on a log scale (1× to 3.4×): the main route reads from the entry down.
  - **One figure per block**: the share of capacity in use (`95 %`, `×4,8 cap.` past twice); the full lines on hover or selection; an unsized block keeps its `?` glyph, an emitter what it sends.
  - **The fix on the stage**: a container the model can fix carries `▸ 3 → 15 réplicas · 68 %` under its name — replicas per instance from → to, and the load after in the block's own figure; amber with `(máx. n)` when the fix needs more than the documented maximum. A click applies it to the scenario (raising the maximum if it must) — the next breakpoint then shows. Saturated labels rank by overload, the worst first.
  - **A selection frames the block with its neighbours**, never the block alone (Zoom still flies in).
- **Use cases — which breaks first** (8.156.0), at the top of the rail: the active use cases grouped by where they break — the container whose instance first crosses ρ 1 on their phases' hops, and the scale (`breakAt`); a group is the container, the scale, a log track ×1…×20 with the scale now, the phases, and a chip per use case. Red once the scale passes it, amber within 1.5×. Hovering a group or a chip spotlights those use cases' routes (the rest steps back, the breaking container pulses); a click pins it and frames the route. On a reference architecture, 7 of 11 use cases broke in one container — one row, not seven.
- **The rail is shorter** (8.156.0): a finding names its instance count, the list on hover; two breakpoint chips carry a label under the slider (the first and the next ahead of the scale), the others are marks.
- **Heat**: every instance block takes its ρ — green under the threshold (0.7), amber at the
  limit, red at a chokepoint, **violet when it receives load and its capacity is `Not documented`**
  (8.43.1 — *pending*: a container still waiting for its tps or resources; it shows the load it
  receives, carries `? sin dimensionar` under its name and is never judged — nothing is assumed),
  **faint grey only when it receives nothing** in the scenario, dimmed when the scenario marks it
  down. The model's status for the violet case stays `grey`; the paint, the legend, the findings'
  swatches and Alia's words say *pending*.
- **The rail becomes the Simulation card** (8.36.0) while the mode is on — the Explore card yields
  its place, so the map stays visible while the controls move: the project's and saved scenarios,
  global scale, a slider and a typed value per use case, capacity per container, every instance
  up / down, the top findings and a chip to Alia. **Her page** carries the interpretation: the
  deterministic reading in `doc_language`, every finding — *Cuello de botella* / *Al límite* with the
  replicas that balance it and whether `max_replicas` allows it, *Not documented* with the row that
  would close it, use cases without a demand row — the latency estimate, save / reset, and
  **Proponer filas**: the scenario's assumptions as the Markdown rows they would become, copied for
  the architect. The viewer never writes a document.
- **The flow is visible** (8.36.0): every hop a loaded use case takes is carried by its chain of
  paths; each path takes the heat of the container that receives it, its opacity and glow follow
  the load it carries, and particles and pulses run it (speed with the load) — unloaded paths
  recede. That is how the load gets from a use case to a red block.
- **The node lights with its traffic** (8.47.0): a deployment node — a namespace, a cluster, a VM,
  a region — whose instances receive or send takes the heat of the worst instance it hosts (down,
  chokepoint, at-limit, ok, pending; the emitter colour when its instances only send) on its fill,
  kept quiet under the blocks, on its frame whole and on its name; every node around it lights with
  it, a loaded path that ends on a node lights that node, and a node hosting nothing loaded gives up
  its zone tint and recedes. With every use case active a whole floor may take colour — switch use
  cases off or isolate one and only the nodes on that path stay lit.
- **On the physical model, traffic beside the name** (8.37.0; 8.85.0): the mode runs on the Physical
  view — leaving it through the view ring (`v`, or a Vista segment) or with `s` returns to the other
  views — and every instance label carries what it receives and sends — `↓ 760 ↑ 760 rps`, `↓ 3.333
  ↑ 0 ses` — in the receiver's heat colour; the model counts a hop as the receiver's inbound (what ρ
  is judged on) and the sender's outbound.
- **The card's controls** (8.38.0): a scenario **select** (documented base, the project's `·`
  scenarios, the user's saved ones) with *Guardar como…* and reset; scale as **steps** `×1 ×2 ×5 ×10
  ×20` plus the fine slider and a **ramp** ▶ (×1 → ×20 over 8 s — blocks turn in breakpoint order;
  reduced motion gets the table instead); a **threshold** slider; **Comparar con la base** (every ρ
  as `base → now`); **demand as a table** — switch, id, typed value, share bar and ◎ *aislar* (only
  that use case loads the model, its path lights); **Puntos de ruptura** — every sized container with
  load by the scale that saturates it (capacity ÷ load), the order the system fails in; a row click
  selects that container on the stage. **The rail is global, the Component panel is specific**
  (8.41.0): everything about one container — its ↓ ↑ traffic, ρ, *rompe a*, the use cases that load
  it, its capacity inputs, *bajar / levantar* for the instance and its node — lives only in the
  Component panel, under the selected name.
- **The Component panel joins in** (8.39.0): while the mode runs, clicking an instance, a slab or a
  node puts a *En la simulación* block right under its name — ↓ ↑ traffic per metric, ρ (`base →
  now` when comparing), *rompe a*, the use cases that load it with ◎ *aislar* each, its capacity
  inputs, and *bajar / levantar* for the instance and for the whole node. Every scenario change
  re-renders it; ending the mode removes it.
- **An interruption is visible** (8.40.0): a downed instance is a faint body inside a red outline
  with `✕ caída` under its name; when every instance of a container is down, the use cases that
  reach it are **interrupted** there — the model carries nothing beyond that hop, the chain into
  it is painted red with no particles and labelled `✕ interrumpido · UC-…`, the finding *Interrumpido*
  outranks every chokepoint and names the use cases and the phase, the reading says how many use
  cases stop and where, and the legend gains the row. The sender still shows what it sends.
- **Bytes on the wire** (8.54.0): a descriptor's Capacity table may state `request_size` and
  `response_size` (bytes per request received / returned) and `session_transfer` (bytes per second per
  held session); `simulation.js` multiplies the rate on every hop by them — `bytesIn` / `bytesOut` per
  instance, `hopBytes` per hop — and `transit()` folds the hops over the viewer's carrier: every path
  carries its bytes under the protocol (`3,14 MB/s`, in the unit that keeps the figure legible), every
  deployment node on the chain reads `⇅` what crosses it, and a node whose provider bills the traffic
  (`metered` on the deployment node — Akamai, Front Door, an egress gateway) carries a `$` and a
  **Nodo facturado por tráfico** finding: bytes per second in the direction it counts, the GB a month at
  the scenario's scale and, when `capacity.pricing` prices it, the cost a month, always named an
  assumption. A receiver that states no size makes every path it loads **pending** (`? MB/s`) and one
  *Bytes pendientes* finding lists them — never zero. The Component panel shows a clicked node's transit
  and a container's size inputs (KB); `set_capacity` takes `requestSize` / `responseSize` /
  `sessionTransfer` with a unit; the brief carries `BYTES` and `TRANSIT`; `propose_rows` emits the rows.
- **The Simulation view reads the system first** (8.69.0, from a QA drive of the reference). The rules this release introduces:
  - **Entry.** `s` opens on the stage, and Alia's page waits behind her codec call (8.127.0; a toast until then — *Primera ruptura ×1,05 — … · 8 hallazgos · Ver la lectura →*). It no longer opens as a modal over a blurred stage.
  - **Heat.** In Holo a saturated block nearly fills in its heat, and an at-limit one doubles. Only the node that hosts an instance takes the heat on its fill; the nodes around it keep only their frame. A washed-red region had hidden which container was failing.
  - **Labels.** Each label has two versions: the full one while hovered or selected; otherwise the name only for a healthy container, and name + one line in its sizing unit + ρ bar for a hot or pending one. Sibling instances share one label (`×3`), and hot labels win the collision pass. A click on a label selects its block through a hit-test against the drawn labels, so labels stay transparent to drags.
  - **Rail.** Order is *Primera ruptura* (red *Roto desde* once the scale passes it) → breakpoints → assumptions → demand, folded to one line.
  - **Transport bar.** One row (scenario · metrics · *más* · *apagar*), the scale on its own line, and save / delete / reset / export / compare / threshold in a drawer. A heat key rides above the bar. Coincident breakpoints share a chip; chips are measured in their font and shifted, never stacked.
  - **Language.** *Sin dimensionar* is the finding heading; the literal `Not documented` stays where it quotes the documents.
  - **Empty panel.** With nothing selected, the Component panel lists the three hottest containers as cards.
  - **Component panel for a container**, in this order:
    1. a ρ gauge with its status word and the values before the last change;
    2. the replicas that bring it under the threshold, with *aplicar* (or *aplicar y subir el máximo*);
    3. *Contenedor · n instancia(s)*: each field with its unit, `doc:` value, **S** and ↺ when changed, ± on replicas and max, applied as you type with the caret kept;
    4. *Esta instancia · <node>*, with the node named;
    5. the use cases with their share of the load in the sizing unit, and the switch and isolate toggles.
  - **Nodes.** A node lists every instance in its subtree; a zone read *sin instancias* above the containers it hosts. *bajar · <node>* takes down the subtree.
  - **Escape.** With no dialog open, it clears the selection.
  - **Findings of a selected component** (Analysis):
    - On the stage, one card over the block: the count, ranks, the three worst as rows, and "+n in the panel". A finding that names one of the block's paths rides in that path's own label (up to three): the protocol line, a solid badge per finding (id · rank, severity colour, a chip to Alia), and a one-line summary when the path carries one finding; the label stays lit and is placed first.
    - In the panel, the findings are grouped by lens, worst first, under a severity summary. Each row carries its id, rank, a two-line description and `via`.
    - `dossier.js` lights a row that names nothing drawn through its section (a STRIDE boundary and its `I-nn`, or a crossing's deployment nodes), or through the containers its ADR governs, and lists what still lights nothing.
- **The pin** (8.71.5): the block being talked about is marked on the stage — a **beacon** (Alia's star over the block in the finding's
  severity colour, pulsing, a dashed beam to the roof; a click opens the finding), **lock-on brackets** that tighten onto the block over
  half a second, and, for Alia's pointer when a lens opens, a **tether** from the star on her note to the beacon, so the note can sit
  wherever there is room. A finding isolated in the rail gets the beacon and the brackets on the block it is named after. The pointer's
  pin leaves with the note (12 s or a stage click); the isolation's with the isolation. Drawn as a screen overlay from projected points,
  so it follows every orbit, pan and zoom; hidden in the simulation and when the block is off screen.
- **Focus** (8.71.9): while Alia's marks are on, they are the most prominent thing on the stage — every block, path and label that is
  not marked drops to about a fifth of its strength, and so do the floors, the grid, the ownership boundary and every zone holding no
  mark (a path between two marked blocks stays lit, for context), marked blocks keep
  their own colour (the simulation's heat, a severity), and an amber vignette darkens the stage with soft openings around the marks.
  It comes on with the first mark and ends when they are cleared; the marks chip in the HUD strip carries an **Enfoque** switch (`f`)
  to see the whole scene with the marks still in place. The panels and the HUD never dim.
- **Alia points at what she answers about, in every view** (8.71.8): when an answer ends, the components it names get a pointed mark
  (dashed brackets, a dashed `mencionado` tag), after the targets her tools acted on (solid, as in the simulation); the answer then
  ends with a **✦ En la escena** row, one chip per target — acted on (solid border) or named (dashed) — and a chip flies the camera to
  that block and locks on again, restoring the mark if it was cleared. A tool that opens the simulation mid-answer keeps her
  conversation on screen, so the answer and its row land where the question was asked.
- **Alia docks beside the stage for her answers** (8.71.6): her conversation opens as a non-modal panel over the Component
  panel's column, with no backdrop, so the stage and the marks her tools leave stay in view; dossier pages keep the centred modal.
  The footer's *Centrar* / *Acoplar* button swaps the current panel and the browser remembers the choice for answers and for pages
  separately. **Peek**: holding `Space` over the centred panel fades it and its backdrop to show the stage behind it. `Esc` closes
  the docked panel too.
- **Alia's marks** (8.71.6): every scene action of her tools leaves a mark on what it touched — `set_capacity` on the container
  (`replicas = 4`), `set_instance` on that instance (`instancia caída` / `instancia arriba`), `open_page` on a component (`leyendo`) —
  lock-on brackets and a tag in her colour (the focus amber, never a severity's), the newest locking on. Two actions on one target
  share one tag (`replicas = 4 · leyendo`); every instance of a marked container is bracketed and the first carries the tag. Marks
  follow the camera in both views and in the simulation, and accumulate (twelve at most) until cleared: the
  `✦ n marcas de Alia · Limpiar` chip in the HUD strip, or `x` (also while her panel is open).
- **Severity has its own colour scale** (8.71.4): `--sev-critical` red · `--sev-high` orange · `--sev-medium` amber · `--sev-low` blue ·
  `--sev-info` grey, defined per theme (light, dark, hologram) and used by everything that paints a severity — blocks, plots and
  paths on the stage, the rail's bubbles and ranks, badges, cards, the WARNING banner and the legend, which lists all five. It
  borrowed the route colours before, which made Critical and High the same red.
- **On Analysis a warm colour is a severity** (8.83.9): an endpoint or a zone no finding names is lit in one steel (`--sev-context`), not in its external amber or system cyan. In the hologram the scale is retuned for navy — High `#ff6b1a` and Medium `#ffe03a` pulled away from the skin's amber, Low lavender `#a18bff` apart from the cyan — and the rail's pressed lens and "all" filters take cyan. A block's tag carries the id and rank on a badge in the severity colour (outlined when mitigated) with the words in ink. An open critical finding's blocks breathe (still under reduced motion). A key above the lenses reads colour · rank letter · word: S Crítico · A Alto · B Medio · C Bajo.
- **Each lens is drawn by the kind of question it asks** (8.155.0, `LENS_KIND`): the rail states how the stage reads under the lens tiles (two lines, whole on hover).
  - **cascade** (Blast radius, SPOF): the source in its severity; what it takes down outlined by hop over the finding's own connections — the first ring in the finding's colour, the second fading, the rest steel; particles flow away from the source; an isolated finding tags each reached block `↳ n`.
  - **deps** (Coupling): the coupled block in its severity; particles leave it toward its dependencies; tags give fan-out and instability.
  - **choke** (Bottlenecks, Latency): the limiting block in its severity; particles flow into it; tags give `800 rps`, `fan-in n` or `p95 / share ms`.
  - **boundary** (STRIDE, Data): the findings sit on their connections — each lit path carries a chip row (the STRIDE letter or the data class, its worst colour, ×n; ◆ for an inventory row with neither), a chip opens the finding; on the Logical view a button offers the Physical view, where trust zones are tiers.
  - **weight** (Cost, Tech debt, Vendor lock-in): each subject raised by its rank (1.15 info … 2.6 critical), a skyline; no connection lights; tags give runway, exit cost or waste.
  - Every fact on a tag is read from the report row's own column (`LENS_FACT`), never computed; the row in the rail carries the same fact under its label.
- **All analyses** (8.155.0, the default tile): every component a finding is about, in its worst severity across the lenses, raised by how many lenses flag it (`n análisis` under its name). The rail is a components × lenses grid, worst first — a cell per lens in its worst finding's colour with ×n, a cell opens that lens with the finding isolated, a name selects the block, hovering a name brackets the block. Alia's context carries the same rows.
- **A finding's subject and its reach** (8.155.0): a finding is painted on its **subject** — the component it is named after (`findingNode`), or the physical node it is named after (SPOF's *Azure East US*), in its residual colour; the other components it names are its **reach**, lit in the neutral steel and outlined, their names ranked under the subjects'. A finding named after neither that names connections is about them (the paths light, their ends are reach); one with neither is about every component it names. Painting every component a finding names lit 24 of 28 containers for Blast radius on a 28-container architecture.
- **The stage carries no sentence** (8.155.0): a block's tag is `B2 · S  afecta 5  mitigado  +3` — the badge, how many components the finding reaches besides its subject, *mitigado* in words, and its other findings counted; the isolated finding alone adds what it is about. On a plan page the tag is the badge alone, the words on hover; tagged names keep to two lines. An unlit path's label is hidden. Choosing a lens, a filter or an isolated finding frames the camera on what it lights (never in the plan).
- **The list and the stage point at each other** (8.155.0): a row hovered brackets its subject on the stage; a block hovered marks the rows of the findings that name it. Rows wrap to two lines. *Por hallazgo · Por componente* (remembered, `acc-ana-group`) groups the rows under their subject, the worst component first — a finding with no subject under the first component it names.
- **Open or mitigated reads from the stage** (8.71.2): what a finding touches is painted by its **residual** severity; a block, plot or path with at least one open finding (no mitigation documented) is drawn **filled** — in the hologram its fill doubles — and one every finding on which is mitigated is drawn **hollow**: its outline in the residual colour, its fill all but gone, a path at half strength without glow. The rail adds an `Abiertos · Mitigados` filter under the severity bubbles (counts, click again for all, combined with a severity), and the legend states filled against hollow. Chips follow the same rule: solid for an open finding, outlined and dashed for a mitigated one.
- **A finding reads on the stage, and a documented mitigation lowers its rank** (8.63.0): the tag under a block is `C1 · S→A · El plano de entrega de llave no responde…` — id, rank (`S→A`, the report's rank then the residual, when the report documents a mitigation; its text is the tooltip), and what the finding is about, cut at 34 characters (72 for the isolated finding): the finding's label unless the label is the block itself (SPOF, Blast Radius, Bottleneck … name the component), then the lens's "what" column (`Failure Scenario`, `Cascade Risk`, `Bottleneck Reason` …). The rank, the colour, the order, the severity bubbles' counts and the worst-finding pointer follow the **residual severity** the findings contract computes — one step below the report's when the lens's mitigation column (`Current Mitigation`, `Bulkhead Present`, `Backpressure Mechanism`, STRIDE `Status`, `Replacement Implemented?`, `Exit Path`) reads present; the rail row keeps the report's severity word beside `LV S→A` and adds the "what" after the label; the finding page opens on *Mitigación documentada* with the residual rank. Registries and rules: `architecture-analysis/SKILL.md` § Mitigation, residual severity and the "what" column; `dossier.js` carries `what`, `mitigation`, `residual`.
- **A saved scenario can be deleted** (8.62.0): a browser-saved scenario — the ones without `·`, which live in this browser's `localStorage` and therefore survive every republish of the artifact — has a `✕` beside its name on Alia's page and one on the bar next to *Guardar como…* (live only when the loaded scenario is one of them), and the brain has `delete_scenario`; a project scenario (`·`) lives in the overrides file and is refused with that reason. The button asks twice on itself (*¿Borrar?* for four seconds, in the severity colour) instead of `confirm()`, which a published copy's sandbox answers `false` silently; deleting the loaded scenario puts the stage back on the documented base.
- **The workbook's assumptions table reads across** (8.61.2): under *Supuestos de este escenario* one row per container and one column per figure the scenario assumes somewhere — capacity per replica (rps / sessions), replicas, max replicas, request and response size (KB), transfer per session (KB/s) — plus *Caída en* with the nodes it is down on; a column no container assumes is not drawn. It was one row per container × field with a *Qué se supuso* column and a bare value: 150 rows to read the 30 containers of one scenario.
- **One save for every route** (8.61.1): the bar's *Guardar como…*, the page's save and the brain's `save_scenario` share `saveScenario` — the copy drops `fromScene`, the bar and Alia's page are rebuilt, and a name that belongs to a project scenario saves as `<name> (editado)` beside it (the tool answers with the name it used). The brain's save persisted and repainted Alia's page only, so the dropdown never listed a scenario the export already carried, and it kept `fromScene`, so a save over a project scenario's name was shadowed by the file's copy on the next load.
- **The transport bar is a console** (8.61.0): two rows on the ask bar's own width, edge to edge with it — the scenario on the first (select, *Guardar como…*, reset, `⬇ xlsx`, *Comparar con la base* with the full sentence as its tooltip, *apagar* at the right edge) and how it runs on the second (threshold, metrics, then the scale — ramp, steps, a slider that takes what the row leaves, and the breakpoint chips beneath it). The scale is the bar's **last** item, so when a narrower window wraps the row the scale alone drops to the bottom line and its chips still hang into the bar's foot; the chips are placed by measure (`placeTicks`: left to right, a chip that would overlap the one before it drops a row, three rows at most, the foot grows with them) instead of alternating blindly. **A toggle that is on is filled** with the accent (steps, ramp, metrics) and a metric carries `●` / `○` as well, since more than one can be on — 8.55.0's metric buttons had no pressed style at all. 8.58.2's card let the controls flow and centred it: on a wide screen it measured the one-line sum and painted two rows adrift inside it, on a laptop it broke into three rows in no order, and its edges never met the ask bar's.
- **Routes, Trayectos and Analysis read like the simulation too** (8.60.0, both views): a chosen route filter (a Route in the Logical view, a Path Class in the Physical one) puts its blocks and hops on plates; under *Vista completa* nothing changes. In Analysis every block a finding names sits on a plate and carries the findings that name it under its name — id and rank letter in the severity colour, worst first, three at most and the rest counted (`+18`) — and an isolated finding draws its tag large; lit integrations keep their label on a plate. The same label pass and its name-first fallback apply (`tagBlockLabel`, `findTag`).
- **The walkthrough reads like the simulation** (8.59.0, both views): every block on the chosen use case's route sits on a plate and, where a phase lands on it — the far end of the hop, the container in the Logical view, its instance in the Physical one — carries `F1 · ≤ 200 ms` under its name in the phase's colour (`phaseTag`: `P{p}` in English, `F{p}` in Spanish); an isolated phase draws its tag large; every hop on the route keeps its protocol on a padding-free plate. The label pass keeps the name and drops the tags when only the tags would overlap a placed label (`notag`), so no name visible before the tags is lost. Switching to Routes, Analysis or the simulation clears the plates.
- **The pill and the tick chips hold their place** (8.58.2): the simulation pill is capped and its scenario name is the part that shrinks (ellipsis; the full line is its tooltip), so a long name never wraps the title or pushes the header buttons off; the tick chips under the scale slider painted on a spacer line of their own (`tick-strip`, as tall as the chip rows in use), never over the metrics row — replaced in 8.61.0 by the measured placement and the scale-last order.
- **A loaded scenario shows what it carries** (8.58.1): the rail card lists, under the demand,
  *Supuestos de este escenario* — the scenario's note, one row per container with the capacity and
  sizes it assumes (`10.000 × 5 rps · máx 10.000`, `0,6 / 0,6 KB`, `0,3 KB/s por sesión`), the
  instances it takes down; a row click opens the container and its inputs. Without it, a project
  scenario whose demand equals the documented one changed nothing visible when selected.
- **The metrics a scenario shows** (8.55.0): the transport bar carries three toggles — `rps` · `ses` ·
  `MB/s` — and the choice is the scenario's (`metrics` on the scenario, saved with it, `null` for all
  three), so a load scenario opens on requests and sessions and a traffic scenario on bytes alone.
  Every figure on the stage sits on a plate and is drawn larger than before; one metric alone is the
  **focus** and is drawn large. The ρ bar, the `? sin dimensionar` tag and the `?` glyph follow the
  load metrics, `? MB/s` and the node transit follow bytes. Clicking the only metric on restores all
  three; `show_metrics` is the brain's tool for it and the brief names what the stage shows.
- **The scenarios as one Excel workbook** (8.56.0; 8.56.2 — a published copy saves through the
  platform's `downloads` capability, declared at publish, with the viewer's confirmation; a saved
  file downloads by link; a page published without it explains that under the button): `⬇ xlsx` on
  the transport bar and *Exportar a Excel* on Alia's page write one `.xlsx` in the page — `scripts/sim-export.js`, pure and inlined like
  the model: a stored ZIP (CRC-32, no library), inline-string XLSX parts, a bold heading style — and
  hand it to the browser as a download named `<project slug>-simulacion-<date>.xlsx`. **Written for a reader** (8.57.0; 8.58.0 — every scenario sheet opens on a *De un vistazo* block: overall state, load entering, most loaded container, first to break, traffic through each billed edge, containers not yet sized; paragraphs merged across the table with a stated height; state cells painted green · amber · red · violet; load and traffic as words with their unit), never as data to feed back: a *Lectura* sheet first with a paragraph per scenario
  and every finding as a sentence with what to do; a summary with counts and money; a comparison
  with utilization as a percentage and traffic in MB/s; the documented data with figures beside
  their unit, replicas as a range, sizes in KB, the metered nodes and prices; then one sheet per
  scenario — demand as figures, assumptions with labels, instances with status words (*Saturado*,
  *Al límite*, *Holgado*, *Pendiente de dimensionar*), capacity as `3 × 250 rps`, findings as
  *Qué pasa · Dónde · Cifra · Qué hacer*, the traffic through the infrastructure with GB a month
  and cost, latency with the phase by its name. Every scenario is run once more and folded over the physical
  carrier: the documented base, the project's, the ones saved in the browser, and the current one
  when it is unsaved (`name *`). Headers in the document's language; ids, units and status words
  never localize. Tests: `tests/sim-export.test.ts` (the ZIP verifies with `unzip -t`, the parts,
  the sheet names, the composition's figures).
- **She builds the scenarios** through the brain: `get_model`, `set_load`, `set_scale`,
  `set_capacity`, `set_instance` (a zone falls, the survivors take its load), `run_simulation`,
  `save_scenario`, `delete_scenario`, `compare`, `propose_rows`. Her rules: build the scenario with the tools instead
  of estimating, derive a demand from the documented dimensioning and state the formula, mark every
  figure a scenario input, ask for a grey container's number or label an assumption — never fill
  it silently. A saved file keeps the heat and the controls; only the narration by the brain
  needs the artifact copy.
- A project with no Capacity tables opens the mode with every instance grey: honest, and the list
  of rows to write. Fill the descriptors, regenerate the scene, and the map colors.
- **Project scenarios** (8.35.0): the overrides file may carry `capacity.scenarios[]` — `{ name,
  scale, demand, down, overrides, source }` — the assumptions the architect wants on the page (a
  pending capacity to test the scene, a contingency, a zone loss). `scene-from-docs.js` carries them
  into `scene.capacity.scenarios`, `render.js` validates their containers and instance ids, and the
  page lists them as loadable scenarios marked `·` with the note that their figures are assumptions,
  not documentation. A session is a connection: a container holds a use case's sessions once,
  however many phases cross it (rps count per hop).
- **The transport bar** (8.43.0): the controls that apply to the whole scenario — scenario select,
  *Guardar como…*, reset, the ramp ▶, the scale steps and slider, the threshold, *Comparar con la base*,
  *apagar* — sit in a media-player bar at the stage's foot, above Alia's ask bar; the rail card keeps
  the demand table, the breakpoints and the top findings, its title pinned while the card scrolls
  inside (the rail no longer scrolls as a whole while the mode runs). **The paths carry their
  transmission**: under a path's protocol label, what it carries in this scenario (`152 rps ·
  40.000 ses`), in the receiver's heat — a path with no protocol label gets one for the duration.
  **The Component panel's block is compact**: traffic, ρ, *rompe a* and the take-down buttons stay in
  view; the use cases that load it and the capacity inputs fold under one line.
- **A phase in its own unit** (8.42.0): a flow has one unit and one of its phases may run in the
  other — the request-shaped read inside a session-shaped sync, the session a request-shaped flow
  opens. A demand row qualified by the phase (`UC-02 · F3` in docs/08; key `UC-02/3` in a scenario,
  `set_load` with `phase`) gives that phase its own figure and unit; the other phases keep the
  flow's. The rail's demand table shows it as a sub-row under its use case, the Component panel
  lists what each use case lands per unit, and a container **sized in one unit that receives load
  only in the other is grey with a *Unidad distinta* finding** naming the two rows that close it —
  never green at ρ = 0, which is what a sessions-only crossing of an rps-sized store used to read.

### Findings on the stage, zoom to the selection

- **The Component panel lists a component's findings only under the Analysis tab**, each chip
  carrying the finding's **id** (`B1`, `C2 S→A`) and its lens, in the order the lenses give them
  (8.63.1 — they were numbered `F1`, `F2`…, a handle nothing else on the page used); under Use
  cases and Routes the panel carries the ADRs, debt, descriptor and integrations only.
- **The findings are on the stage**: under Analysis the selected block carries its findings as
  flags stacked over it, each reading the finding's id as the rail row and the panel chip do —
  the same list and order as the panel, coloured by severity —
  each a chip that opens the finding in Alia; a finding that names an edge of the block is flagged
  on the path that carries it. At most eight, then a `+N` flag to the component's page. The flags
  leave with the selection, the tab or the view.
- **Selecting a block zooms the camera onto it** (a stage click, a breakpoint row, an instance named
  in a panel); ⤢ *Acercar* / ↩ *Volver* sit under the selected name, and `z` toggles them — Back
  returns to where the camera was before the first zoom, presets and rotation included; a drag
  after the zoom keeps the way back, a view switch forgets it. Reduced motion jumps instead of flying.

### HUD cues after Mega Man X DiVE

Ten cues the user chose from the game's stage HUD, all in the viewer's own chrome and both languages:

- **The banner** (8.45.0) — the same hazard-striped banner across the stage's top for everything
  the rail isolates: a finding as **WARNING** in its severity colour (the five-step `--sev-*` scale:
  red Critical, orange High, amber Medium, blue Low, grey Info), the chosen use case as **MISIÓN** in the accent (with
  its target, its phase count or the phase in focus), the chosen route as **RUTA** in its family
  colour. It folds to a pill after six seconds or on click; the one shown at boot starts folded.
- **Analysis** — every finding
  carries a **rank** `LV S / A / B / C / D` by severity, and the selected block shows its worst rank
  beside its name; the **lenses are round buttons** whose ring is the renewal clock — it empties over the six
  months a report stays current, green under three, amber under five, red from five on and when
  due; the accent marks the chosen lens — the lens chips are the only picker (8.92.2: the folded list past ten lenses is gone), and each lens is its latest report only — `dossier.js` bakes the newest dated file per lens and names the older ones it left out, and the viewer keeps the newest per lens of a dossier baked before; a finding whose report row cites no
  ADR or TDR carries an **orange dot** on its chip; **Alia points** at the worst finding when a lens
  opens — brackets on that block and her codec call (8.127.0; a card on the stage until then) with
  Show me · Isolate · Read, gone on the next stage click or after twelve seconds.
- **Simulation, where the traffic starts** (8.46.0) — every loaded path carries a **cone at its
  sending end**, pointing the way the load travels, in the emitter colour (`--sim-emit`, the view's
  info blue / holo cyan — free of the ok · warn · crit · pending · grey palette); a container that
  **sends without receiving** is an origin, not an idle block: it keeps full opacity, takes that
  colour as its outline and traffic lines, and carries a `↑` glyph beside its name. Only a container
  that neither receives nor sends recedes.
- **Simulation, the node that hosts the traffic lights with it** (8.47.0) — a deployment node — a
  namespace, a cluster, a VM, a region — whose instances receive or send takes the **heat of the worst
  instance it hosts** (down, then chokepoint, at-limit, ok, pending; the emitter colour when its
  instances only send) on its fill, kept quiet under the blocks, on its frame whole, and on its name;
  every node around it lights with it (the cluster around a loaded namespace), a loaded path that ends
  on a node lights that node, and a node hosting nothing loaded gives up its zone tint and recedes —
  so the path of the load reads on the infrastructure, not only on the blocks. Legend row in both
  languages. The same release fixed the pending tag: its span carried the class `mark`, which the page
  also uses for its SVG icon (`width: .95em`), so `? sin dimensionar` wrapped a word per line and
  overflowed the label's box beneath the collision pass, overprinting the path chips around it;
  the ρ figure beside the HP bar stays inside the box for the same reason.
- **Simulation** — an **HP bar** under every sized instance name fills with its ρ in its heat, the
  figure beside it; **buff glyphs** beside the name: `S` a capacity assumed in this scenario, `✕n`
  sibling instances down, `?` capacity pending; the transport bar's scale carries **breakpoint
  ticks** (where each sized container breaks, in its heat, red once the scale is past it); the card
  opens on the **recommended power** — the scale at which the first sized container saturates; a
  **HUD density** slider (`acc-hud`, per viewer) fades the traffic lines, bars and glyphs.

## Viewer capabilities (what you are handing the user)

- **The HUD strip at the top of the stage** (8.71.3): one bevelled bar, a caption over each part — **Vista** — the view ring
  (8.85.0): Lógica · Física · Análisis · Simulación, keycap `V` forward and Shift+`V` back, a segment hidden when the scene
  cannot show it (no deployment, no findings, no capacity). Lógica and Física are the Explore tabs over each model; Análisis
  keeps the model it was entered from, and an `L | F` sub-switch beside it (keycap `W`) flips it; Simulación runs on the
  physical model. The rail's tabs, `s` and Alia's chip stay as ways in, and the ring shows where they landed. Leaving
  Análisis returns to the Explore tab last used. Under 1400 px the segments read three letters, the name as the tooltip, **Pisos** (Cristal · Ocultos) as a switch that
  change on one click, the lit state glowing, and **Cámara** as a chip naming the preset (keycap `C`) whose toolbar — presets,
  the floor to centre on, drag mode, rotation — hangs centred under the whole strip in the same style. The rail starts with
  Explorar.
- **Theme** (8.92.1): a header button beside Alia, Legend and Info (`◐ Tema`, a half-filled circle drawn in CSS) opens a menu of the three skins — Holo, Atlas, Corporativo — each with one line on what it is; a pick applies it and closes the menu, as do Esc, a click elsewhere and `t`, which also opens it. It left the HUD strip, which three skins widened.
- **Docked Alia covers the Component panel's column** (8.92.1): while she is docked the Component panel is hidden (kept in the layout, so the stage framing does not move) and comes back when she closes or is centred — a short answer used to show the panel below her.
- **One path thickness** (8.92.1): every path — logical edge, cross-floor jump, physical path, co-location link, dashed batch or failover — is one tube radius (`LINK_R`, 0.04) with one arrowhead and one particle size. The route is told by its colour and a jump by its straight vertical run; three radii (0.13 · 0.055 · 0.035) made a jump dominate the stage and read as importance.
- **The banner per skin** (8.92.3): MISIÓN · RUTA · WARNING, hazard stripes and glow are holo's game voice. Atlas and corporate show the same banner as a caption — *Caso de uso* · *Ruta* · *Hallazgo* (EN *Use case* · *Route* · *Finding*) in sentence case, a bar of the banner's colour at its left edge, no stripes, glow or entry animation — and a theme switch re-words a banner already on screen.
- **Ranks per skin** (8.92.4): holo ranks a finding `LV S · A · B · C · D`; atlas and corporate state a priority `P1 … P5` (critical → info) on the lens tiles, the severity key, the finding chips, the selected block's badge and the residual `P1→P2`, and the hints read *prioridad* for *rango*. Alia's pointer card reads *Alia · mayor riesgo* (EN *highest risk*) in place of *peor hallazgo*. A theme switch re-words them in place.
- **A finding's tag under another component** (8.92.5): when a finding's label is another block's name (a coupling row names its component and lists the dependencies), the tag under each dependency reads *vía <name>* (EN *via*), followed by the lens's *what* when there is one — printed bare it read as the block's own name. The words beside the id badge are the UI face, regular weight, second ink; the mono bold competed with the name.
- **Delivery increments** (8.141.0): when the architecture declares `Delivery Increments` (docs/01), a row under the
  Explore tabs — *Objetivo* · *Inc 1* · *Inc 2* … (EN *Target*) — picks one increment. It is an overlay on every mode but the
  simulation, in both views: what the increment does not ship fades out, blocks and links alike (a logical link by the docs/05
  id its label carries, any other by its two ends); the line under the row names its use cases, blocks, what it adds,
  its temporary elements and what it retires. In the Routes overview the blocks a later increment adds carry *nuevo en N*
  (EN *new in N*) and a temporary block *hasta N · TDR-NNN* (EN *until N*). The slices come from sa-skills'
  `scripts/shared/increments.js` through the scene's `increments` block — the viewer computes none.
- **Simulation** (`s`, or Alia's *Simulación de carga* chip): the Physical view painted by
  utilization for the scenario Alia's page holds — see § Alia simulates load.
- **Alia** (header button or the `a` key): the navigator. Click any chip — an ADR, a TDR, a
  contract, a descriptor or an integration row — to get what is on file: for an ADR the
  decision, consequences and related decisions; for a TDR its status, impact, owner and the
  containers it affects; for a contract its score and every requirement's status; for a
  container its descriptor section by section; for an integration its endpoints and protocol.
  Chips with a border are on file; the others get an honest "not on file in this scene".
  The set of chips the click came from is her **book**: ‹ › in the footer, or the ← → keys, turn
  to the previous and next decision of that component, use case, node or related list, with a
  page counter. On a hosted copy (Step 4b) the footer also carries her question box: anything
  the chips do not answer goes to the **brain**, which reads the scene, the dossier index and the
  page she is open on, and answers in the dialog with chips back to the dossier. In a local file
  the box is absent and her index says the channel is closed.

- **View → Logical / Physical**: one switch, first card of the rail. *Logical* is the C4 model —
  containers on layers, connections by route and phase. *Physical* is the deployment — instances
  on nodes stacked by tier, nested boxes for region › cluster › namespace, slabs for appliances,
  paths undirected and labelled in transport form. Use cases, camera, floors, theme and the
  inspector all follow the active view; the physical inspector shows node chain, replicas,
  resilience role, trust zone and jurisdiction (inherited ones say so), and the logical
  inspector gains a *Runs on* line. Hidden when the scene has no `deployment` block.
- **Highlight → Analysis**: one entry per report in `analysis/` (present only when the dossier
  carries findings). Selecting one tints every block and box a finding names with the finding's
  severity — red for critical and high, amber for medium, grey for low — and dims the rest; the
  list under it shows every finding with its id, label and severity, and clicking one isolates
  its targets. Findings that name no container (a process, a tool, a missing control) stay in
  the list marked with a dash, so nothing the report says disappears. Each finding is a chip
  to Alia, who shows the row as written and what it affects.
- **Highlight → Paths** (physical): the same scene by Path Class — one entry per class in use,
  plus *Failover paths*, *Co-located calls* and *No declared path* when present. The last one is
  the audit: every dashed link is a documented connection the deployment does not realize.
- **Highlight → Use cases**: one button per use case; the scene dims everything outside it,
  colors each hop by its phase kind, and three pulses travel the phases in order. The phase list
  under the description shows each phase's budget; clicking one isolates it.
- **Highlight → Routes**: the same scene by connection kind (full view, plus one entry per route).
- **Camera** (a dock at the top of the stage, under the header, **folded by default** to one
  strip naming the active preset — click it or press `c` to unfold the toolbar in place; it
  folds again after a preset is chosen or on a click outside, and the viewer remembers the
  choice in the browser; keys `1`–`4` pick a preset without unfolding): isometric / front / side / plan presets; drag mode Orbit or Pan; right-click,
  middle button, Shift-drag, two fingers and arrow keys all pan, with vertical drag moving
  straight up and down in world space. The slow idle rotation stops on any drag, wheel, arrow
  key or preset; the **Rotate** toggle in the dock, or the `r` key, resumes it from where the
  camera is (and stops it again).
- **Projection** (experiment/isometric-views): **Parallel** in the dock, or `o`, switches between
  perspective (to look around) and parallel (to read and compare), gliding between them in 650 ms.
  Perspective is the default, and the viewer's own switch is remembered in the browser
  (`acc-projection`). It is a dolly zoom of the one camera
  (field of view 38° → 1.2°, the camera backing off by the same factor), so projection, picking and
  framing work unchanged, and every block keeps its size at any depth. Under parallel:
  - **True isometric**: the isometric preset sits a quarter turn off an axis with the eye 35.26° up. An
    orbit drag settles on the nearest isometric heading on release, `r` (or Rotate) turns a quarter, and
    the slow rotation stays off.
  - **Orthogonal paths** (in both projections): every path runs along the three axes. It rises from its block, runs along x then
    z in its own lane, and drops into the other end. On a floor the lanes sit over the block tops; between
    floors they sit in the gap under the higher floor. Each block spreads the paths it carries across its
    top, so paths that share a corridor run side by side, metro-style. Perspective draws them
    the same way.
  - **Plan** (`4`) is a floor plan, read as pages: always parallel, straight down, north up, one floor per
    page, starting at the focused floor or else the top one. A page is a slice between two clipping planes:
    the near one just over the floor's tallest block and its own lanes, the far one just under its slab, so
    neither the floors above nor the ones below (ghosts through the glass) cover it. Only that floor's
    names show, and its cell grid is the plan's grid.
    - A page frames its own floor's blocks (with room for their ports) to fill the stage, not the whole
      model, and writes each block's name inside it, wrapped to its grid cell, like a room on a floor plan.
    - The plan works the same in every view (Logical, Physical, Simulation, Analysis), and switching views
      keeps it, on the new view's top page. In the physical view a path that ends at a node or zone gets
      its port under that zone.
    - A path that leaves the page shows no protocol label on it; its ports carry it.
    - Selecting a block keeps the page: a block on another floor (a neighbour picked in the panel) turns
      the page to its floor. Zoom (the button, `z`) still flies to it and leaves the plan.
    - A **page bar** on the stage, under the HUD and centred over the stage column, turns the pages:
      the floor above and the floor below by name, the current floor with "Page i of n", one dot per
      floor to jump to it, and the key hint.
    - PgUp / PgDn and ↑ / ↓ turn a page, and Home / End go to the first or last floor. The layer
      buttons do the same.
    - A page larger than the stage moves without leaving the plan: any drag (or ← / →) slides it under the
      pointer, held to its floor, and the wheel (or + / −) zooms it about the point under the cursor.
      Turning the page frames the next floor again.
    - Labels give the bar its room, and leaving the plan, or entering photo mode, hides it.
    - **Ports**: a path to another floor leaves the page, so a tag hangs under each block that has
      one — compact, the floors it reaches (`▲L3 ▼L6×2`); hovered or selected, whole: ▲ for a floor
      above, ▼ for one below, "from" or "to" by the path's direction (↔ for a two-way path), the floor
      and the other end's name, the arrow in the path's route colour. Shown on the plan's page only;
      the path itself shows as a stub rising off its block.
    - Leaving the plan (another preset, a drag, a zoom) returns to the projection in use before it;
      the plan's own switch to parallel is not stored.
- **Circuit** (experiment/isometric-views; `k`, or **Circuit** in the dock, the default; remembered in
  the browser, `acc-routes`): each floor is a circuit board.
  - A block is a chip. Each path leaves it from a pin on the side facing where the path goes, and the pins
    of a side spread along it in the order their paths leave, so they do not cross at the chip.
  - A path is a copper trace on the board, routed around the chips, never over them: straight runs with
    45° corners (A* on a 0.25 grid, eight directions, a 90° turn costing more than two 45° ones, sharper
    turns barred, a diagonal never cutting a chip's corner). A cell a trace holds costs the next one 1.5
    and a cell beside it 0.5: running along another trace adds up cell by cell, so traces sharing a
    channel run side by side as a bus, while one crossing costs less than a long way round. The board is
    an inspiration for order, not a real board: no crossing bridges, no board colours. Short traces route
    first, and traces float 0.16 over the board so they read from the side too.
  - A path to another floor goes through a via: a free cell on every floor it passes, near the midpoint of
    its ends, drawn as a ring on each board, with the pin dropping straight between them.
  - Pads mark the pins, in the trace's own paint. A path ending at a zone meets the zone's edge.
  - On a plan page each via is labelled where the trace leaves the page — ▲ a floor above, ▼ one below,
    "to" or "from" by the path's direction, the floor and the block at the other end — beside its ring on
    the side away from its trace, dimmed with its path. With the circuit on, these replace the ports under
    the blocks; with it off (no vias) the ports stay.
  - A world routes once, all its paths together (about 20–45 ms for 30 blocks); a path the router cannot
    lay keeps the orthogonal route. Off, the paths are the orthogonal routes over the blocks.
- **Groups (nodes and zones) read from the stage** (8.157.0): every group — a region, a cluster, a namespace, an availability zone — stands a **rim** on its edge, taller and stronger the outer it sits (0.22 / 0.14 / 0.08 high), so nesting reads at a glance where a flat tint on the glass vanished. Its name is a **tab** under its front edge in the group's own colour, outside the box where no block covers it, one per floor it spans; tabs outrank a dimmed block's name and slide aside rather than vanish, and keep off the title bar. Hovering a group lights its fill, rim and tab.
  - **The colour says where a group lives** (8.158.0), from its top-level group's node, carried by every group inside: **the bank's cloud** (owned, kind `region`) in blues, **the bank's own datacenters** (owned, any other kind) in sea greens, **a third party** (not owned) in sand and stone, outlined **dashed** with a lower rim. Two tones per family (`--grp-cloud-1/2`, `--grp-prem-1/2`, `--grp-ext-1/2`), muted in every theme so blocks, paths and status colours lead; never a status hue (violet is unsized and low, red / amber / green heat). A key under *By group* names the families. One cyan for every owned group (the floors' colour) and then a hue by position (violet for the largest) were both arbitrary.
  - **The tab names the kind** from the deployment node (`REGIÓN · Azure East US`, `CLÚSTER`, `NS`, `ZONA`, `HOST`, `SaaS` …); inner groups' tabs (depth 2) wait for the zoom, the plan or the pointer unless their content is lit.
  - **By group** in the panel: the groups as a tree — swatch, kind, name, `ext` for one not owned, the instances inside; roots open. Hovering a row lights the group on the stage; a click frames it.
- **Drawing rules** (experiment/isometric-views), in every projection:
  - **Shading**: in atlas and corporate one sun rides over the viewer's left shoulder, so the top face is
    lightest, the left face middle and the right face darkest at any heading.
  - **Contact shadows**: each block casts a soft shadow on its floor. The shadow fades with its block,
    and none is drawn in holo or the plan.
  - **Block names** stand above their block. A name that would overprint another moves up or aside,
    tied to its block by a dotted leader line, and is hidden only when no spot is free. Zoomed out
    (radius > 0.75 × R0), a dimmed block's name gives way.
  - **Lattice per floor**: every floor lays its blocks on one cell grid, sharing an origin and a pitch,
    so a column is the same column on every floor. The pitch is 4.5 between columns and 3.5 between rows.
    - **Rows**: a floor's blocks, grouped by depth, one row apart; an empty row separates two systems.
    - **Columns**: a block the layout places moves toward the mean column of the blocks it links to. The
      floors around it count fully and its own floor at half weight, in six sweeps down and up the floors
      (the barycentre heuristic of layered drawing). Connected blocks end up stacked, so risers drop
      straight and paths cross less.
    - **Systems**: a system's blocks stay together, and an empty column separates two systems in a row.
    - **Anchors**: a block with explicit coordinates keeps its order and its column on the lattice.
    - The overlap separation runs once more after the lattice.
    - **The cell grid**: each floor draws its cell borders, with every placed block centred in a cell.
      Holo draws it in both projections. Atlas (opacity 0.6) and corporate (0.9, over its pale floors)
      draw it under parallel only, where the lattice is what the drawing is read by, and in the plan,
      where it is the floor plan's grid. Switching the projection shows or hides it.
  - **Floor gap**: at least 3, the room the orthogonal lanes need.
  - **Fresh camera matrices**: the camera's matrices refresh as soon as it moves. The label pass and
    picking read them before the render, and under the dolly a frame-old matrix threw every label
    off-screen on every other frame.
- **Cutaway** (experiment/isometric-views): with a block selected, any block nearer the camera whose
  drawing overlaps the selection's turns to glass, keeping a faint outline and its label. It is
  recomputed when the camera or the selection moves, and the plan view has none.
- **Height is load** (experiment/isometric-views): in Simulation under the parallel projection, an
  instance stands as tall as it is loaded. It keeps its drawn height at ρ 0.5, stands 1.7× at ρ 1, and is
  capped between 0.3× and 2.5×. Unsized, idle, down and infrastructure instances keep their height, and
  so does every block under perspective, which would shrink the far ones. The paths re-route onto the new
  tops, and the legend states the encoding.
- **Save SVG** (photo mode, experiment/isometric-views): the frame as vectors, projected through the
  camera as it stands. Under parallel it is a true isometric drawing for slides and printed guides:
  - each floor's outline;
  - every block's visible faces, shaded by the same sun, drawn far to near;
  - the paths, with their arrowheads;
  - the labels on screen, as text, and the caption.
- **Accessibility** (experiment/isometric-views):
  - The canvas is named with a summary of the model.
  - A skip link, the first stop of Tab, leads to the same model as a list: floor by floor, each block
    with its kind and technology as a button that selects it and flies the camera there, then every
    connection. The list stays hidden until it takes the focus.
  - The system's *more contrast* setting turns labels into opaque, outlined plates in bold, makes leader
    lines solid and lifts the third ink. Forced colours draw labels in the system colours.
- **The stage column is the frame** (8.84.0): the camera draws into the column between the rail and
  the Component panel, under the HUD strip — measured from the isometric heading ±30° with the layer
  labels' width, scaled down to fit (never up, floor 0.7) and centred — so floors and labels do not run
  under the panels. It refits on resize, when a panel changes size and on a view switch; the banner is
  not part of the frame, so the model holds still when a use case is chosen.
- **Center layer** (`L1`…`Ln`, `T1`…`Tn` on the physical view) frames one floor **and focuses
  it**: the other floors' grids hide, their blocks, edges, particles, node boxes and labels recede
  to a ghost (8.49.2 — 12 % of their opacity and the outline halved again; at 30 % a holo wireframe
  still read as a full drawing), and the focused floor stays legible even when the active use case
  does not touch it. The focused floor carries the same cue as a selected grouping — the force field
  in `holo`, the glass curtain in `atlas` — standing on the floor's perimeter with the floor face
  included and no ceiling, at 60 % strength with a quiet floor face, so the frame marks the floor and
  the content stays the loudest thing on it; the pressed layer button carries no glow. Click
  the same button again, or any camera preset, to release. This is how a stakeholder reads a
  crowded floor (a data layer with a dozen containers).
- **Labels never overprint.** Every frame the viewer places labels by rank — hovered or selected
  block, highlighted blocks, highlighted edges, zone and layer names, then the dimmed ones — and
  hides any label that would overlap one already placed; hovering a block always surfaces its
  name. Long names wrap. Floors space themselves further apart the deeper they are, so a deep
  floor is not read through the floors above it.
- **Inspector**: click a block for layer, technology, system, boundary badge, the descriptor's
  note and its ADR chips. The selected block carries a breathing cue in the block's own shape —
  in `holo` a **soul**, a light burning inside the hologram; in `atlas` an **aura**, an
  accent-colored shell and lit outline around the opaque block. Static under reduced motion.
- **Selecting a grouping** (an external-system zone on the logical view, a deployment node box
  on the physical one) lights **every box of that grouping on every floor it spans** — a region
  that holds nodes on three tiers flares on all three — and its label wins collisions. In `holo`
  it is a **force field**: a shimmering hexagonal energy wall on the box perimeter, with a
  Fresnel rim, an energy band sweeping upward and a lit baseline; in `atlas` a **glass
  curtain**, an accent-colored gradient wall standing on the box edge, breathing. Reduced
  motion freezes both. The inspector lists what the node hosts, its parent chain and its tags.
- **View card** also holds the view settings: **Floors** (glass or hidden) and **Theme**
  (`Holo` or `Atlas`; keyboard focus states and reduced motion respected in both).
- **Camera dock**: a floating bar at the bottom of the stage, centered between the rail and the
  inspector, with the presets, the center-layer buttons and the drag mode. It never scrolls away,
  however long the use-case list gets.
- **Legend** (button at the top right, or the `l` key): a dialog with the floor ranges, the
  shapes and the color families in use for the active view.
- **Info** (button at the top right, or the `i` key): a dialog with the thesis, the sources the
  scene was built from, on the physical view its *Derived from* line, and the controls and
  keyboard shortcuts. The stage keeps its full height — nothing is printed along the bottom
  edge, and the header's height sets where the panels start, so a two-line title never sits
  under a card.
- **Settings** (⚙ at the top right, or the `g` key): the viewer's preferences, kept in this browser —
  Alia's voice (off by default; on, a voice picker and *Try it*), her tips, where her panel opens
  for pages and for answers (centred or docked — the panel's own Dock button sets the same thing),
  the label badges' strength in the load simulation (the HUD density slider, also in the
  simulation's rail), **rotate on open** (`acc-rotate`; `r` still toggles it live) and **reduce
  motion** (`acc-motion`): on, or following the system's `prefers-reduced-motion`. Reduced, the
  scene builds no particles or pulses, the camera jumps instead of flying and every CSS animation
  stops; since particles and pulses are built at load, a change applies on reload (*Reload now*).
  Also there: **voice speed** (0.8–1.25×, `acc-rate`), **walkthrough pace** (slow · normal · fast,
  `acc-pace` — a storyboard step's dwell and the use-case phase player's interval, ×1.4 / ×1 / ×0.7),
  **label size** (the block names, `acc-lbl`), **camera dock on open** (as last left · open · folded,
  `acc-dock-start`), **theme on open** (`acc-skin`, overriding the theme the file was rendered with;
  the Theme menu changes it for the visit only) and **Reset preferences**, which asks twice on itself,
  clears every key above and reloads — saved simulation scenarios (`acc-sim`) are kept.
- **Off-screen markers** (8.126.0): what the viewer is following — the selected block, the finding Alia
  points at, her marks, the blocks of an isolated finding — gets an arrow on the stage column's edge when the
  camera leaves it behind, in the target's colour, with its name or finding id; a click flies back to it. Six at
  most; two in the same direction stack along the edge. Hidden in photo mode and while the action wheel is open.
- **Action wheel** (8.126.0): a right click on a block (a click — a right drag still pans), or `m` on the
  selection, opens a wheel of the actions the panels already hold, only those that apply: Focus, Dossier (Alia's
  page, when the dossier carries the component), Isolate floor / All floors, Findings (n) into Análisis, Take down
  / Bring up (an instance, in Simulation), Copy name, Photo. Keys `1`–`9` pick, arrows and Tab move, Esc or a
  click outside closes.
- **Photo mode** (8.126.0): `p`, the header's **Photo** button or the wheel. The chrome leaves, the camera frames
  into the whole window or a 16:9 / 4:3 / 1:1 frame (the frame is the stage rectangle while the mode is on), with
  an optional rule-of-thirds grid and a caption (project · version · view · date). **Save PNG** / **Copy** render
  at 1×, 2× or 3× the screen's pixels (capped at 8192 px a side), cropped to the frame, the HTML labels drawn into
  the picture run by run with each skin's case and spacing; the grid is a guide and never exported. The bar fades
  after 2.6 s without a pointer move; `l` labels, `g` grid, `p` or Esc leaves. Clipboard copy depends on the
  browser — a refusal is a toast, never a silent failure. The selection's cue is in the picture: Esc first for a
  clean shot.

---

## Themes

**The skin engine** (8.159.0): every theme is a folder, `skins/<id>/` — `skin.json` (the palette in each mode it
declares, fonts, 3D engine flags, look, name) and an optional `skin.css` scoped to `[data-skin="<id>"]`.
`scripts/skins.js` reads and checks them against `skins/schema.json` (the closed palette: every mode defines
every core token); `render.js` inlines them; the template holds no colour, token block or skin id of its own.
The full guide: `skins/README.md`.

| Theme | Look | When |
|-------|------|------|
| `holo` (**default**) | **Retro sci-fi hologram** — the *Mega Man X* capsule hologram over a holodeck grid, in the *Mega Man DO* palette (cyan fading to indigo on deep navy): self-lit translucent cyan blocks with glowing outlines, game ranks. Dark only | Demos, walkthroughs, anything shown on a screen |
| `atlas` | Neutral and formal: opaque lit blocks, translucent floors, IBM Plex type, priorities. Follows the viewer's light / dark preference | Committees, formal reviews, anything printed or projected in a bright room, or when the user asks for a "corporate", "neutral" or "formal" look |
| `corporate` | A neutral business palette — slate and teal, white rounded cards, Nunito Sans. Light only | Business audiences; the base to copy for an organization's brand |
| *a project skin* | An organization's own look (its brand), from `visualizations/skins/<id>/` beside the scene | When the project carries one |

**Selecting**: `--theme <id>` on `render.js`, or `"theme"` in the scene JSON (the flag wins); otherwise the
skin with the lowest `order`. The **Theme** menu lists every skin the page carries (the plugin's and the
project's) and switches at runtime without a re-render. Ask for the theme only when the user's phrasing hints
at one; otherwise render `holo` and mention the switch in the report.

**Adding a theme**: a folder under `skins/` (the plugin's) or under the project's `visualizations/skins/`,
checked with `bun scripts/skins.js --check [<dir>]` — no template edit. A project skin with a plugin id
replaces it. `[data-look="flat"]` and `[data-look="neon"]` carry the rules the two looks share.

---
