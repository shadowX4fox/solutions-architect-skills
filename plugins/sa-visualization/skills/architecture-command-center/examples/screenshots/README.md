# Screenshots for the docs

The images in `docs/images/command-center/` are captured from a synthetic showcase: the Order Desk test fixture, plus
Capacity tables, a demand row and three small analysis reports so that Analysis and Simulation have something to show.

```bash
SKILL=plugins/sa-visualization/skills/architecture-command-center
OUT=$(mktemp -d)
bun $SKILL/examples/screenshots/build-showcase.ts $PWD/$SKILL $OUT/proj
SCENE=$OUT/proj/visualizations/architecture-command-center.scene.json
bun $SKILL/scripts/scene-from-docs.js $OUT/proj --base $SCENE --out $SCENE
bun $SKILL/scripts/dossier.js $OUT/proj $SCENE --write
bun $SKILL/scripts/render.js $SCENE $OUT/showcase.html
bun $SKILL/scripts/render.js $SCENE $OUT/showcase-atlas.html --theme atlas
bun $SKILL/scripts/render.js $SCENE $OUT/showcase-corporate.html --theme corporate
# a Chrome binary, e.g. Puppeteer's: bunx puppeteer browsers install chrome
bun $SKILL/examples/screenshots/capture.ts <chrome> docs/images/command-center \
  "$OUT/showcase.html::logical=;physical=v;analysis=v;simulation=v" "$OUT/showcase.html::alia=a" \
  "$OUT/showcase-atlas.html::atlas=" "$OUT/showcase-corporate.html::corporate="
```

`capture.ts` drives headless Chrome over the DevTools protocol with real key presses (`v` cycles the views, `a` opens
Alia) and writes one WebP per step: `<page>::<name>=<keys>;<name>=<keys>`.
