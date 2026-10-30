# Command center skins

Every look of the command center is a folder here. The template (`VIEWER_TEMPLATE.html`) holds no
colour, token block or skin id of its own: `render.js` reads the skins (`scripts/skins.js`), checks them
against `schema.json` and inlines them. A skin changes colour, type, chrome and how the 3D scene is lit,
never geometry, layout or what a colour means.

| Skin | Look | Modes |
|------|------|-------|
| `alia` (default) | Alia's hologram on night: aqua for what the organization owns, silver for what it consumes, Nunito, round frosted panels, her face in the codec by mood, game ranks (`LV S · A …`) | dark |
| `holo` | Retro sci-fi hologram: self-lit cyan blocks over an indigo grid, CRT scanlines, game ranks | dark |
| `atlas` | Neutral and formal, IBM Plex, priorities (`P1 … P5`) | light, dark |
| `corporate` | Neutral business palette, slate and teal, rounded cards | light |

## A skin folder

```
skins/<id>/
  skin.json   the palette, fonts, engine flags, look, name   (required)
  skin.css    what a token cannot say: shapes, glow, stripes  (optional)
```

`skin.json`:

| Field | What it holds |
|-------|---------------|
| `id` | The folder name: lowercase letters, digits, hyphens |
| `order` | Its place in the Theme menu; the lowest is the default when no `--theme` is given |
| `name`, `hint` | `{ "en": …, "es": … }` — the Theme menu's entry |
| `look` | `neon` (game ranks, banner words, a typed codec) or `flat` (priorities, plain captions) |
| `fonts` | Stylesheet links, on `https://fonts.googleapis.com/` only |
| `engine` | How the 3D scene draws: `blockOpacity`, `selfLit`, `outlines`, `grid`, `floorOpacity`, `floorEdgeOpacity`, `scan`, `flicker`, `additive`, `projector`, `select` (`aura` · `soul`), `light` (`hemi`, `sun`: `[light, dark]` intensities); optional `gridOpacity`, `parallelGrid`, `floorOpacityPhysical` |
| `modes` | `{ "light": { tokens }, "dark": { tokens } }` — one or both. A skin with both follows the viewer's light / dark preference |

**Every mode defines every token in `schema.json`** (about 70, in groups: fonts, surface, ink, floor,
block, zones and groups, severity, routes, simulation, paths, light, elevation). A mode may add the
optional tokens listed there (`--label-plate`, `--select`, `--floor-line`, `--accent-2`, `--bg-core`,
`--bg-mid` — the last two are required when `engine.projector` is on) and private tokens its own
`skin.css` uses. A value is any CSS value with no `{`, `}`, `;`, `<` or comment.

`skin.css`: every selector carries `[data-skin="<id>"]` (inside an `@media` too); no `@import`, nothing
that closes the page's `<style>`. Shared rules for the two looks live in the template under
`[data-look="flat"]` and `[data-look="neon"]`.

## A project's own skins

An architecture project adds a skin, or replaces a plugin skin of the same id, with a folder beside its
scene: `visualizations/skins/<id>/` (or `render.js … --skins <dir>`). An organization's brand belongs
there, with its architectures, not in the plugin. A project skin that does not pass the schema stops the
render with the reason.

```
bun <skill_dir>/scripts/skins.js --check [<project>/visualizations/skins]   # validate
bun <skill_dir>/scripts/render.js <scene.json> <out.html> --theme <id>      # open in it
```

To start one, copy the closest plugin skin, rename the folder and the `id`, and change the values.
