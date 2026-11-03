# Screenshots for the docs

The images in `docs/images/command-center/` are captured from a synthetic showcase: the Order Desk test fixture, plus
Capacity tables, a demand row and three small analysis reports so that Analysis and Simulation have something to show.

```bash
SKILL=plugins/sa-visualization/skills/architecture-command-center
OUT=$(mktemp -d)
bun scripts/docs-screenshots/build-showcase.ts $PWD/$SKILL $OUT/proj
bun scripts/shared/packs.js --declare none --project $OUT/proj   # the plugin's own skins, whatever packs this machine has
SCENE=$OUT/proj/visualizations/architecture-command-center.scene.json
bun $SKILL/scripts/scene-from-docs.js $OUT/proj --base $SCENE --out $SCENE
bun $SKILL/scripts/dossier.js $OUT/proj $SCENE --write
bun $SKILL/scripts/render.js $SCENE $OUT/showcase.html
bun $SKILL/scripts/render.js $SCENE $OUT/showcase-holo.html --theme holo
bun $SKILL/scripts/render.js $SCENE $OUT/showcase-atlas.html --theme atlas
bun $SKILL/scripts/render.js $SCENE $OUT/showcase-corporate.html --theme corporate
# a Chrome binary, e.g. Puppeteer's: bunx puppeteer browsers install chrome
bun scripts/docs-screenshots/capture.ts <chrome> docs/images/command-center \
  "$OUT/showcase.html::logical=;physical=v;analysis=v;simulation=v" "$OUT/showcase.html::alia=a" \
  "$OUT/showcase-holo.html::holo=" "$OUT/showcase-atlas.html::atlas=" "$OUT/showcase-corporate.html::corporate="
```

`capture.ts` drives headless Chrome over the DevTools protocol with real key presses (`v` cycles the views, `a` opens
Alia) and writes one WebP per step: `<page>::<name>=<keys>;<name>=<keys>`.

## The MCP console shot

`mcp-console.webp` is a real `claude -p` session against a local Alia server holding the same showcase as a draft:

```bash
# an isolated server (its own compose project and volume), then the draft
SA_INDEX_PORT=8091 docker compose -p sa-demo -f plugins/sa-delivery/skills/architecture-index-export/local/compose.yaml up -d
bun plugins/sa-delivery/skills/architecture-index-export/scripts/publish-index.js $OUT/proj --server http://localhost:8091 --project-key order-desk
# the session, from an empty folder
echo '{"mcpServers":{"alia":{"type":"http","url":"http://localhost:8091/mcp"}}}' > mcp.json
claude -p "<question>" --mcp-config mcp.json --strict-mcp-config --allowedTools mcp__alia --output-format stream-json --verbose > run.jsonl
bun scripts/docs-screenshots/console-html.ts run.jsonl "<question>" console.html
bun scripts/docs-screenshots/capture-page.ts <chrome> console.html docs/images/command-center/mcp-console.webp 1200
docker compose -p sa-demo -f plugins/sa-delivery/skills/architecture-index-export/local/compose.yaml down -v
```

## The analysis pictures

`docs/images/analysis/` holds `analysis-chart.js`'s pictures of the same showcase. `analysis-fills.js` writes a SPOF and a
latency fill in Order Desk's names; the renderer turns them into reports, and a second latency fill with one hop raised
gives the verdict picture against a commit of the first:

```bash
A=plugins/sa-analysis/skills/architecture-analysis/scripts
bun scripts/docs-screenshots/analysis-fills.js $OUT
bun $A/render-analysis.js $OUT/spof.fill.json --project $OUT/proj
bun $A/render-analysis.js $OUT/latency.fill.json --project $OUT/proj
bun $A/analysis-chart.js $OUT/proj --lens spof --out $OUT/spof-heatmap.png
bun $A/analysis-chart.js $OUT/proj --lens latency-budget --focus 1 --out $OUT/latency-waterfall.png
(cd $OUT/proj && git init -q && git add -A && git commit -qm base)
bun $A/render-analysis.js $OUT/latency-raised.fill.json --project $OUT/proj
bun $A/analysis-chart.js $OUT/proj --base HEAD --lenses latency-budget --out $OUT/verdict.png
bun $A/analysis-chart.js $OUT/proj --out $OUT/state.png
# each PNG to a 1200 px WebP: a page holding it at full width, then capture-page.ts
for n in state spof-heatmap latency-waterfall verdict; do
  echo "<body style='margin:0'><img src='$n.png' style='width:100%;display:block'></body>" > $OUT/$n.html
  bun scripts/docs-screenshots/capture-page.ts <chrome> $OUT/$n.html docs/images/analysis/$n.webp 1200
done
```

`state.webp` and `verdict.webp` are both taken after the raised fill; the heat map and the waterfall before it.
