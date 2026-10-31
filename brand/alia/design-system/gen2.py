"""Alia Guide v2 — every colour taken from Alia: night, silver, aqua, white. Writes out2/project/."""
import json, os, datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out2")
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

BLOB = {
    "alia-cover.webp": ("e680ad016f59e56d9acef75fa130eacc", 47702, "image/webp"),
    "alia-explaining.webp": ("16d2aef9b3e8f5b0afc9e944748fd8ab", 51154, "image/webp"),
    "alia-thinking.webp": ("d39ea42ac715681742808dec3df76697", 47180, "image/webp"),
    "alia-happy.webp": ("c692ceca8c028f696caeba787496181b", 53766, "image/webp"),
    "alia-warning.webp": ("b53f9843bee2f044d6f9a14d3dba4f5c", 52026, "image/webp"),
    "alia-avatar.webp": ("9a4c887469526efc6ce62959cae07ffb", 26588, "image/webp"),
    "alia-sparkle-aqua.svg": ("ef4c42a6f7a47647a4731b3cbb74b173", 166, "image/svg+xml"),
    "alia-sparkle-yellow.svg": ("baaa52ad2f81851417ccc605fad59f4a", 166, "image/svg+xml"),
    "alia-sparkle-navy.svg": ("9773eaf5a67a77b19effb0ea790d6d7a", 166, "image/svg+xml"),
    "face-calm.webp": ("77c60efcf240e5e21bcfb47d53ec9dbc", 12378, "image/webp"),
    "face-thinking.webp": ("2dc85977bee7cd7d93621a4ad6feb30c", 12142, "image/webp"),
    "face-pleased.webp": ("88355b339bfbb20887ec7e75bf49c660", 14292, "image/webp"),
    "face-warn.webp": ("b91e973839cc9037fc4f1803b42e5e13", 13828, "image/webp"),
    "alia-blazon.png": ("c06ceb1df51a0fc23cca3dfa2b2353b3", 26694, "image/png"),
    "alia-blazon.svg": ("fa167016ff52a93b43a4eb247d5e05fe", 2776, "image/svg+xml"),
    "alia-point-left.webp": ("934f2a8f4a6d7930bb1234d3587c282a", 46592, "image/webp"),
    "alia-point-up.webp": ("6a108dc9a5ae9813379225b85768c522", 47990, "image/webp"),
    "alia-perched.webp": ("78fd1f68291f2bb6d433cbc625ee4ca2", 39168, "image/webp"),
    "alia-stern.webp": ("bc0f9fb5c628b9c0d5914e307aa53bd5", 44092, "image/webp"),
    "alia-talk-closed.webp": ("e587215ade0467194271a6bcf7d06b5d", 44082, "image/webp"),
    "alia-talk-open.webp": ("07baecc424f351029c9d700b82efe1f1", 43526, "image/webp"),
    "face-stern.webp": ("39ebf78c7f41d021fb820c52a9cc054c", 13520, "image/webp"),
    "face-talk-closed.webp": ("f6a0aa87977e434c90a631ff3ccbc48d", 13494, "image/webp"),
    "face-talk-open.webp": ("b0fc8c7b825da7d9d4ab27d60af104ad", 13584, "image/webp"),
    "alia-blazon-mono.png": ("43464a3b1f0d8c9b4d79a6956e9b195d", 18309, "image/png"),
    "alia-blazon-mono-reverse.png": ("26c7ecda8dcfe557ba899c3967e08560", 16613, "image/png"),
}
def b(name): return "/_blob/" + BLOB[name][0]
def w(path, text):
    p = os.path.join(ROOT, "project", path); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(text)

# ------------------------------------------------------------------ tokens
def c(name, value, usage): return {"name": name, "value": value, "usage": usage}
colors = [
    # her four colours
    c("alia-aqua", "#2ee6e6", "Her eyes, hair tips and holograms — the signature. The glow, the stage ring, the sparkle, kickers and «Alia» on `night` (12.0:1). Never text on light grounds (1.5:1)."),
    c("alia-silver", "#c9d1d9", "Her hair. Body text on `night` (12.0:1), a palette chip, a cover block."),
    c("alia-white", "#ffffff", "Her sweater. Cards on inner pages, titles on `night` (18.6:1)."),
    c("alia-black", "#1b1f24", "Her shorts, tights and boots. The ink of every title and bold word (15.4:1 on `surface-page`)."),
    # night: the cover and her voice
    c("night", "#0d1418", "The cover ground and the AliaNote: the dark she glows against."),
    c("night-2", "#15222a", "Raised shapes on `night`: hologram panels, the stage disc."),
    c("night-line", "#2b4a55", "Outlines on `night`: fact tiles, hologram panels, palette chips. Never text."),
    c("night-text", "{alia-silver}", "Ledes, fact bodies and note text on `night` (12.0:1)."),
    c("night-muted", "#8ea3ad", "Header, footer and palette labels on `night` (7.1:1)."),
    # light pages
    c("surface-page", "#f3f7f9", "Ground of every inner page: a cool silver-white."),
    c("surface-card", "{alia-white}", "Role cards and the limits list."),
    c("surface-soft", "#e8f0f3", "Inline code chips."),
    c("border", "#d5e0e5", "The 1.2px outline of a card. Never text."),
    c("ink", "{alia-black}", "Titles, card titles, bold words (15.4:1 on `surface-page`)."),
    c("ink-2", "#44515c", "Ledes and card bodies (7.6:1 on `surface-page`, 8.2:1 on white)."),
    c("ink-3", "#66757f", "Header and footer lines, uppercase mono only (4.4:1 on `surface-page`)."),
    c("aqua-mark", "#0c9da3", "`alia-aqua` deepened for marks on light grounds: the title bar, the footer bar, the stage ring (3.1:1 on `surface-page`). Never text."),
    c("aqua-soft", "#dcfafa", "The halo behind Alia on an inner page."),
    c("aqua-ink", "#0a7177", "Kicker of an `aqua` card and identifiers that name her surfaces (5.8:1 on white)."),
    # roles, tuned to her palette
    c("sky", "#3b82c4", "Card role: answering, exact data, the IDE."),
    c("sky-ink", "#1f5f99", "Kicker text of a `sky` card (6.7:1 on white)."),
    c("coral", "#f0644b", "Card role: findings she points out. The ✗ of a limit is `coral-ink`."),
    c("coral-ink", "#a8361f", "Kicker of a `coral` card and the ✗ in `LimitsList` (6.5:1 on white)."),
    c("violet", "#7d6bd6", "Card role: simulation and computed results."),
    c("violet-ink", "#5443b0", "Kicker text of a `violet` card (7.5:1 on white)."),
    c("mint", "#2fae74", "Card role: what gets built, a result."),
    c("mint-ink", "#1b7148", "Kicker text of a `mint` card (6.0:1 on white)."),
    c("amber", "#e0a100", "Card role: what changed, what to escalate."),
    c("amber-ink", "#7a5600", "Kicker text of an `amber` card (6.7:1 on white)."),
    # her moods, on night only (the codec's ring, outline, glow and name); calm and thinking are `alia-aqua`
    c("mood-pleased", "#4dffa0", "AliaCodec, mood `pleased`: all clear, a good move (12.9:1 on `night-2`)."),
    c("mood-worried", "#ffd23f", "AliaCodec, mood `worried`: something saturates or drifts (12.0:1 on `night-2`)."),
    c("mood-stern", "#ff3b4e", "AliaCodec, mood `stern`: something is down or blocks (5.0:1 on `night-2`)."),
    # light and shadow on her
    c("alia-glow", "rgba(46,230,230,0.38)", "The 30px drop-shadow glow around her on `night`."),
    c("figure-shade", "rgba(13,20,24,0.16)", "The drop shadow under her on light grounds."),
    c("holo-grid", "rgba(46,230,230,0.07)", "The 32px hologram grid on the cover ground."),
]
def st(name, size, lh, wt, sample, usage, **k):
    d = {"name": name, "fontSize": size, "lineHeight": lh, "fontWeight": wt, "sample": sample, "usage": usage}; d.update(k); return d
tokens = {
    "name": "Alia Guide", "version": 2,
    "color": {"themes": [{"id": "alia", "name": "Alia"}], "tokens": colors},
    "type": {
        "fonts": [],
        "families": {"rounded": "\"Nunito\", \"Nunito Sans\", system-ui, sans-serif",
                     "mono": "\"IBM Plex Mono\", ui-monospace, Menlo, monospace"},
        "groups": [
            {"name": "Display", "family": "rounded", "styles": [
                st("cover-title", "50px", 1.05, 900, "Conoce a Alia", "The cover title, white, «Alia» in `alia-aqua`."),
                st("page-title", "30px", 1.1, 800, "Te guía por el modelo", "One per inner page, `ink`, a claim, after the aqua bar."),
            ]},
            {"name": "Text", "family": "rounded", "styles": [
                st("cover-lede", "16.5px", 1.45, 400, "La navegadora de la arquitectura.", "Under the cover title, `night-text`, three lines at most."),
                st("lede", "14px", 1.45, 400, "Abre el centro de mando y pulsa a.", "Under every page title, `ink-2`, two lines at most."),
                st("card-title", "19px", 1.2, 800, "Casos de uso, fase por fase", "A role card's title, `ink`."),
                st("card-body", "13.5px", 1.45, 400, "Ilumina cada fase en orden con su presupuesto.", "A role card's sentence or two, `ink-2`."),
                st("limit-item", "14.5px", 1.4, 400, "Inventar un dato — responde que no consta.", "One line of `LimitsList`."),
                st("note", "13px", 1.45, 400, "si no puedo responder bien, encontraste un hueco.", "Alia speaking: `night-text`, her name in `alia-aqua` 900."),
                st("fact-title", "14px", 1.2, 800, "Dos lugares", "A fact tile's title on the cover, white."),
                st("fact-body", "11.5px", 1.4, 400, "El centro de mando 3D y el servidor MCP.", "A fact tile's sentence, `night-text`."),
            ]},
            {"name": "Mono", "family": "mono", "styles": [
                st("page-header", "10px", 1.2, 600, "02 · EN EL CENTRO DE MANDO", "The header line, uppercase, `ink-3`, the number in `aqua-ink`.", letterSpacing="0.14em"),
                st("card-kicker", "10px", 1.2, 600, "RESPONDER", "A card's kicker in the role's `-ink`.", letterSpacing="0.14em"),
                st("fact-kicker", "8.5px", 1.2, 600, "DÓNDE VIVE", "A fact tile's kicker, `alia-aqua`.", letterSpacing="0.14em"),
                st("stage-label", "9px", 1.2, 600, "ALIA · PENSANDO", "The label on her stage, `aqua-ink`.", letterSpacing="0.16em"),
                st("footer", "10px", 1.2, 400, "sa-skills 10.25.2 · servidor Alia 0.6.0", "Footer: number 600, the aqua bar, versions right in `ink-3`."),
            ]},
        ],
    },
    "spacing": {"tokens": [
        {"name": "page-pad-y", "value": "34px", "usage": "Top and bottom padding of an A4 landscape page."},
        {"name": "page-pad-x", "value": "42px", "usage": "Left and right padding."},
        {"name": "page-gap", "value": "15px", "usage": "Gap between header, title, lede, body and footer."},
        {"name": "split-gap", "value": "20px", "usage": "Gap between the content column and her stage."},
        {"name": "grid-gap", "value": "12px", "usage": "Gap between role cards."},
        {"name": "card-pad-y", "value": "20px", "usage": "Card padding, top and bottom."},
        {"name": "card-pad-x", "value": "24px", "usage": "Card padding, left and right."},
        {"name": "holo-pitch", "value": "32px", "usage": "Pitch of the hologram grid on the cover."},
    ]},
    "radius": {"tokens": [
        {"name": "radius-card", "value": "14px", "usage": "Role cards, the limits list, the note, fact tiles — rounder, like her."},
        {"name": "radius-panel", "value": "10px", "usage": "Hologram panels on the cover."},
        {"name": "radius-chip", "value": "5px", "usage": "Palette chips and inline code."},
        {"name": "radius-round", "value": "999px", "usage": "The avatar and the stage ring."},
    ]},
    "shadow": {"tokens": [
        {"name": "glow-figure", "value": "0 0 30px rgba(46,230,230,0.38)", "usage": "Reference of the glow around her on `night` (applied as `filter: drop-shadow`, so it follows her outline)."},
        {"name": "shadow-figure", "value": "0 10px 18px rgba(13,20,24,0.16)", "usage": "Reference of her shadow on light grounds (`filter: drop-shadow`)."},
    ]},
    "size": {"tokens": [
        {"name": "page-width", "value": "297mm", "usage": "A4 landscape width."},
        {"name": "page-height", "value": "210mm", "usage": "A4 landscape height."},
        {"name": "stage-col", "value": "380px", "usage": "Width of her stage on an inner page — a third of the content width."},
        {"name": "cover-stage-col", "value": "470px", "usage": "Width of her stage on the cover."},
        {"name": "title-bar", "value": "6px", "usage": "The `aqua-mark` bar left of every title."},
        {"name": "footer-bar", "value": "83px", "usage": "Length of the 3px `aqua-mark` footer bar."},
        {"name": "card-top", "value": "4px", "usage": "The role-colour top border of a card."},
        {"name": "avatar", "value": "44px", "usage": "Her avatar in a note."},
    ]},
}
w("tokens.json", json.dumps(tokens, ensure_ascii=False, indent=2))

# ------------------------------------------------------------------ bundle.css
w("components/bundle.css", """@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=IBM+Plex+Mono:wght@400;600&display=swap");
/* Alia Guide v2 — every value from tokens.css; every colour from Alia. */
.ag-page { width: var(--page-width); height: var(--page-height); padding: var(--page-pad-y) var(--page-pad-x); background: var(--surface-page); color: var(--ink); font-family: var(--font-rounded); display: flex; flex-direction: column; gap: var(--page-gap); box-sizing: border-box; overflow: hidden; position: relative; }
.ag-head { display: flex; justify-content: space-between; font: 600 10px/1.2 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); position: relative; }
.ag-head b { color: var(--aqua-ink); font-weight: 600; }
.ag-title { margin: 0; display: flex; align-items: center; gap: 12px; font: 800 30px/1.1 var(--font-rounded); color: var(--ink); }
.ag-title::before { content: ""; width: var(--title-bar); align-self: stretch; min-height: 30px; border-radius: 3px; background: var(--aqua-mark); flex: none; }
.ag-title em { font-style: normal; color: var(--alia-aqua); }
.ag-lede { margin: 0; font: 400 14px/1.45 var(--font-rounded); color: var(--ink-2); max-width: 820px; }
.ag-code { white-space: nowrap; font: 600 .9em var(--font-mono); color: var(--aqua-ink); background: var(--surface-soft); border-radius: var(--radius-chip); padding: 0 5px; }
.ag-foot { display: flex; align-items: center; gap: 12px; font: 400 10px var(--font-mono); color: var(--ink-3); letter-spacing: .04em; position: relative; }
.ag-foot .n { color: var(--ink); font-weight: 600; } .ag-foot .bar { width: var(--footer-bar); height: 3px; border-radius: 2px; background: var(--aqua-mark); } .ag-foot .tk { margin-left: auto; }
/* Cover: night, a hologram grid, Alia on her stage */
.ag-page--cover { background-color: var(--night); background-image: linear-gradient(var(--holo-grid) 1px, transparent 1px), linear-gradient(90deg, var(--holo-grid) 1px, transparent 1px); background-size: var(--holo-pitch) var(--holo-pitch); }
.ag-page--cover .ag-head { color: var(--night-muted); } .ag-page--cover .ag-head b { color: var(--alia-aqua); }
.ag-page--cover .ag-title { font: 900 50px/1.05 var(--font-rounded); color: var(--alia-white); }
.ag-page--cover .ag-title::before { background: var(--alia-aqua); min-height: 50px; }
.ag-page--cover .ag-lede { font-size: 16.5px; color: var(--night-text); max-width: 600px; }
.ag-page--cover .ag-foot { color: var(--night-muted); } .ag-page--cover .ag-foot .n { color: var(--alia-aqua); } .ag-page--cover .ag-foot .bar { background: var(--alia-aqua); }
.ag-cover-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr var(--cover-stage-col); gap: var(--split-gap); align-items: center; }
.ag-cover-text { display: flex; flex-direction: column; gap: 20px; }
.ag-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ag-fact { padding: 13px 15px; background: var(--night-2); border: 1.2px solid var(--night-line); border-radius: var(--radius-card); font: 400 11.5px/1.4 var(--font-rounded); color: var(--night-text); }
.ag-fact .k { display: block; margin-bottom: 6px; font: 600 8.5px var(--font-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--alia-aqua); }
.ag-fact b { display: block; margin-bottom: 4px; font: 800 14px var(--font-rounded); color: var(--alia-white); }
.ag-palette { display: flex; gap: 14px; }
.ag-palette span { display: flex; align-items: center; gap: 6px; font: 600 9px var(--font-mono); letter-spacing: .08em; color: var(--night-muted); }
.ag-palette i { width: 16px; height: 16px; border-radius: var(--radius-chip); border: 1px solid var(--night-line); display: inline-block; }
/* Her stage: the column she stands in */
.ag-stage { position: relative; min-height: 0; height: 100%; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 26px; }
.ag-stage::before { content: ""; position: absolute; inset: 6% 4% 10%; border-radius: 50%; background: radial-gradient(closest-side, var(--aqua-soft), transparent); }
.ag-stage::after { content: ""; position: absolute; left: 22%; right: 22%; bottom: 14px; height: 26px; border-radius: 50%; border: 2px solid var(--aqua-mark); }
.ag-stage img { position: relative; z-index: 1; width: 100%; height: calc(100% - 20px); object-fit: contain; object-position: bottom; filter: drop-shadow(0 10px 18px var(--figure-shade)); }
.ag-stage .tag { position: absolute; z-index: 1; top: 4px; right: 4px; font: 600 9px var(--font-mono); letter-spacing: .16em; text-transform: uppercase; color: var(--aqua-ink); }
.ag-stage--night::before { background: radial-gradient(closest-side, rgba(46,230,230,.16), transparent); }
.ag-stage--night::after { border-color: var(--alia-aqua); box-shadow: 0 0 18px var(--alia-glow); }
.ag-stage--night img { filter: drop-shadow(0 0 30px var(--alia-glow)); }
.ag-stage--night .tag { color: var(--alia-aqua); }
.ag-holo { position: absolute; z-index: 0; border: 1.4px solid var(--night-line); border-radius: var(--radius-panel); background: var(--night-2); }
.ag-holo::before { content: ""; position: absolute; left: 12%; right: 30%; top: 18%; height: 3px; border-radius: 2px; background: var(--alia-aqua); opacity: .55; box-shadow: 0 9px 0 rgba(46,230,230,.35), 0 18px 0 rgba(46,230,230,.25); }
/* Inner page: content left, her stage right */
.ag-split { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr var(--stage-col); gap: var(--split-gap); }
.ag-grid { display: grid; gap: var(--grid-gap); min-height: 0; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.ag-grid--note { grid-template-rows: 1fr auto; } .ag-grid--note .ag-note { grid-column: 1 / span 2; }
.ag-grid--stack { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
.ag-card { display: flex; flex-direction: column; justify-content: center; gap: 10px; min-height: 0; padding: var(--card-pad-y) var(--card-pad-x); background: var(--surface-card); border: 1.2px solid var(--border); border-top: var(--card-top) solid var(--c, var(--aqua-mark)); border-radius: var(--radius-card); }
.ag-card .k { font: 600 10px/1.2 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--ci, var(--aqua-ink)); }
.ag-card h3 { margin: 0; font: 800 19px/1.2 var(--font-rounded); color: var(--ink); }
.ag-card p { margin: 0; font: 400 13.5px/1.45 var(--font-rounded); color: var(--ink-2); } .ag-card p b { color: var(--ink); }
.ag-card--aqua { --c: var(--aqua-mark); --ci: var(--aqua-ink); } .ag-card--sky { --c: var(--sky); --ci: var(--sky-ink); }
.ag-card--coral { --c: var(--coral); --ci: var(--coral-ink); } .ag-card--violet { --c: var(--violet); --ci: var(--violet-ink); }
.ag-card--mint { --c: var(--mint); --ci: var(--mint-ink); } .ag-card--amber { --c: var(--amber); --ci: var(--amber-ink); }
/* Alia speaking */
.ag-note { display: flex; gap: 14px; align-items: center; padding: 12px 18px 12px 12px; background: var(--night); border-radius: var(--radius-card); font: 400 13px/1.45 var(--font-rounded); color: var(--night-text); }
.ag-note b { color: var(--alia-aqua); font-weight: 900; }
.ag-avatar { width: var(--avatar); height: var(--avatar); flex: none; border-radius: var(--radius-round); background: var(--night-2); border: 2px solid var(--alia-aqua); box-shadow: 0 0 12px var(--alia-glow); overflow: hidden; }
.ag-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* What she never does */
.ag-limits { display: flex; flex-direction: column; justify-content: center; padding: 20px 24px; background: var(--surface-card); border: 1.2px solid var(--border); border-radius: var(--radius-card); }
.ag-limits ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 18px; }
.ag-limits li { display: flex; gap: 8px; font: 400 14.5px/1.4 var(--font-rounded); color: var(--ink-2); } .ag-limits li b { color: var(--ink); font-weight: 800; }
.ag-limits .mk { flex: none; width: 14px; text-align: center; font: 600 14px var(--font-mono); color: var(--coral-ink); }
/* AliaTip: chibi Alia pops in on her ring with a short tip — over footage, slides or a page corner */
.ag-tip { position: relative; display: flex; align-items: flex-end; gap: 22px; }
.ag-tip-alia { position: relative; flex: none; width: 150px; height: 170px; }
.ag-tip-alia img { position: absolute; left: -20%; bottom: 9px; width: 140%; height: 100%; object-fit: contain; object-position: bottom; filter: drop-shadow(0 0 14px var(--alia-glow)) drop-shadow(0 6px 10px rgba(0,0,0,.35)); }
.ag-tip-ring { position: absolute; left: 18%; right: 18%; bottom: 2px; height: 18px; border-radius: 50%; border: 2px solid var(--alia-aqua); box-shadow: 0 0 12px var(--alia-glow); }
.ag-tip-bubble { position: relative; order: -1; max-width: 360px; margin: 0 0 70px; padding: 14px 18px; background: var(--night-2); border: 1.6px solid var(--alia-aqua); border-radius: 18px; box-shadow: 0 0 18px rgba(46,230,230,.28); font: 700 15px/1.38 var(--font-rounded); color: var(--alia-white); }
.ag-tip-bubble b { display: block; margin-bottom: 4px; font: 600 10.5px var(--font-mono); letter-spacing: .2em; text-transform: uppercase; color: var(--alia-aqua); }
.ag-tip-bubble::after { content: ""; position: absolute; right: -19px; bottom: 22px; border-top: 9px solid transparent; border-bottom: 9px solid transparent; border-left: 18px solid var(--alia-aqua); }
.ag-tip--light .ag-tip-ring { border-color: var(--aqua-mark); box-shadow: none; }
.ag-tip--light .ag-tip-alia img { filter: drop-shadow(0 6px 10px var(--figure-shade)); }
/* AliaCodec: her call on a live surface — her face by mood on a ring, the channel, one typed line and the ways in */
.ag-codec { --m: var(--alia-aqua); display: flex; gap: 14px; align-items: flex-start; box-sizing: border-box; min-width: 300px; max-width: 460px; padding: 12px 14px 12px 12px; background: var(--night-2); border: 1.5px solid color-mix(in srgb, var(--m) 75%, transparent); border-radius: 20px; box-shadow: 0 0 22px color-mix(in srgb, var(--m) 28%, transparent), 0 10px 26px rgba(0,0,0,.4); font-family: var(--font-rounded); }
.ag-codec[data-mood="pleased"] { --m: var(--mood-pleased); } .ag-codec[data-mood="worried"] { --m: var(--mood-worried); } .ag-codec[data-mood="stern"] { --m: var(--mood-stern); }
.ag-codec-face { flex: none; width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--m); box-shadow: 0 0 14px color-mix(in srgb, var(--m) 55%, transparent); background: var(--night-2); overflow: hidden; }
.ag-codec-face img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ag-codec-body { flex: 1; min-width: 0; }
.ag-codec-head { display: flex; align-items: baseline; gap: 8px; font: 600 10.5px var(--font-mono); letter-spacing: .16em; text-transform: uppercase; color: var(--alia-silver); }
.ag-codec-head b { color: var(--m); text-shadow: 0 0 8px var(--m); }
.ag-codec-head .ch { font-size: 10px; font-weight: 500; color: var(--m); opacity: .8; }
.ag-codec-head .ck { color: var(--night-muted); font-weight: 500; }
.ag-codec-head .x { margin-left: auto; font: 400 16px/1 var(--font-rounded); letter-spacing: 0; color: var(--night-muted); }
.ag-codec-line { margin: 4px 0 8px; font: 700 14px/1.4 var(--font-rounded); color: var(--alia-white); }
.ag-codec-act { display: flex; flex-wrap: wrap; gap: 6px; }
.ag-codec-act span { font: 700 11.5px var(--font-rounded); color: var(--alia-white); background: rgba(46,230,230,.10); border: 1px solid rgba(143,230,230,.24); border-radius: 999px; padding: 3px 11px; }
.ag-codec-act .pri { border-color: var(--m); background: color-mix(in srgb, var(--m) 18%, transparent); }
@media (prefers-reduced-motion: no-preference) {
  .ag-codec.is-open { animation: ag-codec-in .5s cubic-bezier(.2,.9,.3,1.25) both; }
  .ag-codec.is-open .ag-codec-face { animation: ag-codec-rise .6s cubic-bezier(.2,.9,.3,1.35) both; }
  .ag-codec.is-talking .ag-codec-face { animation: ag-codec-talk .5s ease-in-out infinite alternate; }
}
@keyframes ag-codec-in { from { opacity: 0; transform: translateY(14px) scale(.96); } }
@keyframes ag-codec-rise { from { opacity: 0; transform: translateY(18px) scale(.8); } }
/* AliaBlazon: her escudo — the mark of a document in her theme, as drawn, at one of two sizes */
.ag-blazon { display: block; flex: none; aspect-ratio: 1; object-fit: contain; }
.ag-codec--video .ag-codec-face { width: 160px; height: 160px; border-width: 4px; }
.ag-codec--video .ag-codec-line { font-size: 36px; line-height: 1.4; }
.ag-blazon--cover { width: 64px; } .ag-blazon--head { width: 14px; display: inline-block; vertical-align: -2px; }
@keyframes ag-codec-talk { from { transform: translateY(0); } to { transform: translateY(-2px) scale(1.04); filter: brightness(1.12); } }
""")

# ------------------------------------------------------------------ snippets
AV = f'<span class="ag-avatar"><img src="{b("alia-avatar.webp")}" alt="Alia"></span>'
def head(n, topic): return f'<div class="ag-head"><span><b>{n}</b> · {topic}</span><span>Conoce a Alia · guía visual</span></div>'
def foot(n): return f'<div class="ag-foot"><span class="n">{n}</span><span class="bar"></span><span>Conoce a Alia</span><span class="tk">sa-skills 10.25.2 · servidor Alia 0.6.0</span></div>'
def card(role, k, h, p): return f'<div class="ag-card ag-card--{role}"><span class="k">{k}</span><h3>{h}</h3><p>{p}</p></div>'
def note(t): return f'<div class="ag-note">{AV}<span><b>Alia:</b> {t}</span></div>'
def stage(p, tag, alt): return f'<div class="ag-stage"><span class="tag">Alia · {tag}</span><img src="{b(f"alia-{p}.webp")}" alt="{alt}"></div>'
def SCALE(inner, s=0.62): return f'<div style="width:{int(1123*s)}px;height:{int(794*s)}px;overflow:hidden"><div class="ag-scale" style="transform:scale({s})">{inner}</div></div>'
def preview(comp, group, height, body, bg="var(--surface-page)"):
    w(f"components/{comp}/preview.html", f'<!-- @dsCard group="{group}" height={height} -->\n<div style="padding:16px;background:{bg};font-family:var(--font-rounded)">\n{body}\n</div>\n')

def cover_html(img):
    return f'''<section class="ag-page ag-page--cover">
<div class="ag-head"><span><b>Conoce a Alia</b> · guía visual</span><span>sa-visualization · sa-delivery</span></div>
<div class="ag-cover-body"><div class="ag-cover-text">
<h1 class="ag-title"><span>Conoce a <em>Alia</em></span></h1>
<p class="ag-lede">La navegadora de la arquitectura. Te guía por lo que los arquitectos documentaron, responde con su fuente y dice cuando algo no consta.</p>
<div class="ag-facts">
<div class="ag-fact"><span class="k">Qué es</span><b>Una guía</b>Recorre la arquitectura documentada contigo.</div>
<div class="ag-fact"><span class="k">Dónde vive</span><b>Dos lugares</b>El centro de mando 3D y el servidor MCP de tu IDE.</div>
<div class="ag-fact"><span class="k">Su regla</span><b>Solo lo documentado</b>Lee la arquitectura; no la edita ni la inventa.</div></div>
<div class="ag-palette"><span><i style="background:var(--alia-silver)"></i>PLATA</span><span><i style="background:var(--alia-aqua)"></i>AQUA</span><span><i style="background:var(--alia-white)"></i>BLANCO</span><span><i style="background:var(--alia-black)"></i>NEGRO</span></div>
</div>
<div class="ag-stage ag-stage--night">
<span class="ag-holo" style="left:2%;top:16%;width:34%;height:30%"></span>
<span class="ag-holo" style="right:0;top:6%;width:30%;height:24%"></span>
<span class="ag-holo" style="right:6%;top:52%;width:24%;height:20%"></span>
<span class="tag">Alia · navegadora</span><img src="{img}" alt="Alia saludando"></div></div>
<div class="ag-foot"><span class="n">sa-skills 10.25.2</span><span class="bar"></span><span>servidor Alia 0.6.0 · octubre 2026</span><span class="tk">Para arquitectos, producto, revisión y desarrollo</span></div>
</section>'''

# ------------------------------------------------------------------ components
preview("CoverPage", "Pages", 520, SCALE(cover_html(b("alia-cover.webp"))))
w("components/CoverPage/README.md", """# CoverPage

The cover of an Alia guide: night ground with a faint hologram grid, the title with «Alia» in `alia-aqua`, three fact tiles, her palette, and Alia on her glowing stage among hologram panels.

- **Provide**: the title in one `<span>` (her name wrapped in `<em>`), a lede of three lines at most, three `FactTile`s, the footer versions.
- **Stage**: `.ag-stage.ag-stage--night` in the `cover-stage-col` (470px) column, the `cover` pose, a tag «Alia · navegadora», two or three `.ag-holo` panels placed behind her, never over her face.
- **Palette row**: on a guide about Alia herself only.
- Classes: `.ag-page.ag-page--cover`, `.ag-cover-body`, `.ag-cover-text`, `.ag-facts`, `.ag-palette`, `.ag-stage--night`, `.ag-holo`.
""")

guide_page = f'''<section class="ag-page">{head("02", "en el centro de mando")}
<h1 class="ag-title">Te guía por el modelo</h1>
<p class="ag-lede">Abre el centro de mando y pulsa <span class="ag-code">a</span>: Alia responde desde el dossier que el modelo lleva dentro, también sin conexión.</p>
<div class="ag-split"><div class="ag-grid">
{card("aqua", "Recorrer", "Casos de uso, fase por fase", "Ilumina cada fase en orden con su presupuesto de latencia p95.")}
{card("sky", "Responder", "Con la página que lo dice", "ADRs, TDRs, descriptores e integraciones <span class='ag-code'>I-nn</span>. Si no está, dice que no consta.")}
{card("coral", "Señalar", "Los hallazgos en escena", "Pinta cada hallazgo sobre su componente, por severidad residual.")}
{card("violet", "Simular", "Qué se rompe primero", "Carga documentada contra capacidad documentada.")}
</div>{stage("thinking", "pensando", "Alia pensando")}</div>{foot("02")}</section>'''
preview("GuidePage", "Pages", 520, SCALE(guide_page))
w("components/GuidePage/README.md", """# GuidePage

An inner page of an Alia guide: header, a claim as title after the aqua bar, a lede, the content column on the left and Alia on her stage on the right, then the footer.

- **Provide**: number and topic, the title, the lede, the content (four `RoleCard`s; two over an `AliaNote`; or a `LimitsList` over an `AliaNote`), the pose and its stage tag (her verb: «pensando», «explicando»).
- **Her stage is a third of the page** (`stage-col`, 380px): an `aqua-soft` halo, an `aqua-mark` ring under her feet, her soft shadow. She is the largest thing on the page.
- Classes: `.ag-page`, `.ag-head`, `.ag-title`, `.ag-lede`, `.ag-split`, `.ag-grid`, `.ag-grid--note`, `.ag-grid--stack`, `.ag-stage`, `.ag-foot`.
""")

never = ["<li><span class='mk'>✗</span><span><b>Inventar un dato</b> — si la arquitectura no lo dice, responde que no consta.</span></li>",
         "<li><span class='mk'>✗</span><span><b>Editar la arquitectura</b> — solo escribe en <span class='ag-code'>visualizations/</span>.</span></li>",
         "<li><span class='mk'>✗</span><span><b>Publicar sin que lo pidas</b> — publicar es tu decisión.</span></li>"]
limits_page = f'''<section class="ag-page">{head("04", "sus límites")}
<h1 class="ag-title">Lo que Alia nunca hace</h1>
<p class="ag-lede">Sus límites son parte de su trabajo: una respuesta honesta de «no consta» vale más que una adivinada.</p>
<div class="ag-split"><div class="ag-grid ag-grid--stack"><div class="ag-limits"><ul>{"".join(never)}</ul></div>
{note("si no puedo responder bien, encontraste un hueco en la arquitectura.")}</div>
{stage("warning", "advirtiendo", "Alia advirtiendo")}</div>{foot("04")}</section>'''
preview("LimitsPage", "Pages", 520, SCALE(limits_page))
w("components/LimitsPage/README.md", """# LimitsPage

The page that closes an Alia guide: what she never does, a note in her voice under it, and the `warning` pose on her stage.

- **Provide**: three to six limits, each «**the limit** — why, in one line», and one note that turns the limits into advice.
- Always the last inner page of a guide about Alia or one of her surfaces.
- Classes: `.ag-grid.ag-grid--stack`, `.ag-limits`, `.ag-note`, `.ag-stage`.
""")

preview("RoleCard", "Content", 300, '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">'
        + card("aqua", "Recorrer", "Casos de uso", "Ilumina cada fase en orden.")
        + card("sky", "Responder", "Con su fuente", "Si no está, dice que no consta.")
        + card("coral", "Señalar", "Los hallazgos", "Por severidad residual.")
        + card("violet", "Simular", "Qué se rompe", "Carga contra capacidad.")
        + card("mint", "Construir", "Un paquete", "Contratos, presupuestos y plan.")
        + card("amber", "Avisar", "Qué cambió", "Una duda que bloquea se escala.") + "</div>")
w("components/RoleCard/README.md", """# RoleCard

One of Alia's responsibilities: a white card, rounded like her, with a 4px top border in a role colour, a verb as kicker, a title and one or two sentences.

- **Provide**: the kicker (one verb), a title of about five words, a body of one or two sentences; identifiers in `.ag-code`.
- **Roles, all tuned to her palette**: `aqua` navigate (her own colour, the first card of a page), `sky` answer and exact data, `coral` findings, `violet` simulation, `mint` build and results, `amber` change and escalation. Kicker in the role's `-ink`, body `ink-2`; never write in the role hue itself.
- Four per page at most. Class: `.ag-card.ag-card--<role>`.
""")

preview("AliaStage", "Alia", 340, '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">'
        + "".join(f'<div style="height:230px;display:flex;flex-direction:column;gap:6px"><div class="ag-stage" style="flex:1"><span class="tag">{tag}</span><img src="{b(f"alia-{p}.webp")}" alt="Alia {tag}"></div>'
                  f'<span style="font:400 11px/1.3 var(--font-rounded);color:var(--ink-2);text-align:center">{use}</span></div>'
                  for p, tag, use in [("cover", "navegadora", "Portada"), ("explaining", "explicando", "Introducción"),
                                      ("thinking", "pensando", "Cómo funciona"), ("happy", "contenta", "Lo que entrega"), ("warning", "advirtiendo", "Límites")])
        + '</div>')
w("components/AliaStage/README.md", """# AliaStage

Alia on her stage: an approved pose standing on an aqua ring, inside a soft aqua halo, with a small mono tag naming what she is doing. The spotlight of every page.

| Pose | File | Tag | Page |
|---|---|---|---|
| Cover | `alia-cover.webp` | navegadora | The cover only, on `.ag-stage--night` |
| Explaining | `alia-explaining.webp` | explicando | An introduction, «quién es» |
| Thinking | `alia-thinking.webp` | pensando | How something works, an analysis |
| Happy | `alia-happy.webp` | contenta | What she delivers, results |
| Warning | `alia-warning.webp` | advirtiendo | Limits, risks |
| Stern | `alia-stern.webp` | firme | What blocks, a rule that is not negotiable |

- **Light grounds** `.ag-stage`: `aqua-soft` halo, `aqua-mark` ring, `figure-shade` shadow. **Night** `.ag-stage--night`: a fainter halo, an `alia-aqua` ring that glows, the `alia-glow` around her.
- She fills her stage's height and stands on the ring (`object-position: bottom`); never cropped, mirrored, recoloured or redrawn. One stage per page.
- Not stage poses: `point-left`, `point-up` and `perched` belong to `AliaTip`, and the talking pair to her talking frames (`AliaCodec`).
- A new pose comes from her anchors (`brand/alia/` in the plugin repository), is approved, then uploaded here.
""")

preview("AliaNote", "Alia", 110, note("me llamo así por la navegadora de Mega Man X. Mi trabajo es que nadie se pierda en la arquitectura."))
w("components/AliaNote/README.md", """# AliaNote

Alia speaking: a `night` card with her avatar in a glowing aqua ring, «**Alia:**» in `alia-aqua` 900 and one or two sentences in `night-text`.

- **Provide**: one or two sentences in her first person — advice, never a repetition of the lede.
- At most one per page. The avatar is `alia-avatar.webp` in `.ag-avatar` (44px), never another crop.
- Classes: `.ag-note`, `.ag-avatar`.
""")

preview("LimitsList", "Content", 200, '<div class="ag-limits"><ul>' + "".join(never) + "</ul></div>")
w("components/LimitsList/README.md", """# LimitsList

What Alia never does, one line each: a `coral-ink` ✗, the limit in bold `ink`, an em dash, the reason in `ink-2`.

- **Provide**: three to six limits the documentation states; each reason fits one line.
- Class: `.ag-limits`.
""")

preview("FactTile", "Content", 150, '<div class="ag-facts">'
        '<div class="ag-fact"><span class="k">Qué es</span><b>Una guía</b>Recorre la arquitectura documentada contigo.</div>'
        '<div class="ag-fact"><span class="k">Dónde vive</span><b>Dos lugares</b>El centro de mando 3D y el servidor MCP de tu IDE.</div>'
        '<div class="ag-fact"><span class="k">Su regla</span><b>Solo lo documentado</b>Lee la arquitectura; no la edita ni la inventa.</div></div>', bg="var(--night)")
w("components/FactTile/README.md", """# FactTile

A cover fact: a raised `night-2` tile outlined in `night-line`, an aqua mono kicker, a white title, one `night-text` sentence.

- **Provide**: exactly three — what it is, where it lives, its rule. Classes: `.ag-facts`, `.ag-fact`.
""")

preview("AliaPalette", "Alia", 80, '<div class="ag-palette"><span><i style="background:var(--alia-silver)"></i>PLATA</span><span><i style="background:var(--alia-aqua)"></i>AQUA</span><span><i style="background:var(--alia-white)"></i>BLANCO</span><span><i style="background:var(--alia-black)"></i>NEGRO</span></div>', bg="var(--night)")
w("components/AliaPalette/README.md", """# AliaPalette

Her four colours as chips: `alia-silver` hair, `alia-aqua` eyes and holograms, `alia-white` sweater, `alia-black` outfit. They are the whole system's palette; the chips appear on the cover of a guide about her. Class: `.ag-palette`.
""")

def tip(pose, text, light=False):
    return (f'<div class="ag-tip{" ag-tip--light" if light else ""}"><div class="ag-tip-alia"><div class="ag-tip-ring"></div>'
            f'<img src="{b(f"alia-{pose}.webp")}" alt="Alia"></div><p class="ag-tip-bubble"><b>Tip de Alia</b>{text}</p></div>')
preview("AliaTip", "Alia", 330, '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
        '<div style="position:relative;height:290px;border-radius:var(--radius-card);overflow:hidden;background:#0b1013;border:1px solid var(--night-line)">'
        '<div style="position:absolute;inset:16px;font:400 11px/1.6 var(--font-mono);color:#5d7380">$ git push origin feat/arquitectura-1.10.1<br>Architecture review · running…<br>■ contracts 1.10.1 · pack_revision e566ddf</div>'
        '<div style="position:absolute;right:12px;bottom:6px">' + tip("point-left", "Los contratos se comitean solos, para que su diff se lea sin ruido.") + '</div></div>'
        '<div style="position:relative;height:290px;border-radius:var(--radius-card);background:var(--surface-page);border:1px solid var(--border)">'
        '<div style="position:absolute;right:12px;bottom:6px">' + tip("happy", "Pregúntame qué cambió con <span class=\'ag-code\'>what_changed</span> antes de tocar código.", light=True) + '</div></div>'
        '</div>')
w("components/AliaTip/README.md", """# AliaTip

Chibi Alia pops in at a corner on her glowing ring and gives one short tip in a bubble that points to her — the pattern of the case-7 video, for every surface where something is shown and an important part deserves a pointer.

- **When**: at an important moment of what is on screen — an approval, a rule that blocks, a command worth remembering. A tip names the *why* or the *next move* in one or two sentences (~20 words), never repeats the caption.
- **Where**: bottom-right corner, bubble to her left; on footage above the caption band. Never over a face, a table being read or the content the moment is about.
- **Pose = tone**: `explaining` a rule, `thinking` a step to weigh, `happy` a good move, `warning` a trap. Never `cover` (that pose belongs to covers).
- **Pose = where the tip points**: `point-left` when the bubble sits to her left and names what is beside it (the default corner); `point-up` when the tip sits under the thing it is about (a table, a chart); `perched` when there is no free corner — she sits on the top edge of a card, legs over the edge, and the bubble stays outside the card. A pointing pose replaces the tone pose; the bubble's words carry the tone.
- **Timing (video, slides with motion)**: she rises from below on her ring (0.6 s, a small overshoot), the bubble slides in 0.3 s later; the tip stays only while it is read — `1.5 s + words ÷ 2.2` plus 1.5 s — then both fade, so the content is clear again. The footage under a tip is slowed (down to ×0.4) until every caption and the tip have their reading time.
- **Frequency**: one tip at a time, at most one per segment or slide; about one a minute of video.
- **Static (print, a page)**: the same block in a page corner, `.ag-tip--light` on light grounds; at most one per page, and never on a page that already has an `AliaNote`.
- **Bubble**: «TIP DE ALIA» in aqua mono, the tip in white Nunito 700 on `night-2`, aqua outline and tail.
- Classes: `.ag-tip`, `.ag-tip-alia`, `.ag-tip-ring`, `.ag-tip-bubble`, `.ag-tip--light`. Sizes scale with the surface: at 1920 × 1080 Alia is 300 × 330 px and the bubble text 31 px.
""")

FACE = {"calm": "face-calm", "thinking": "face-thinking", "pleased": "face-pleased", "worried": "face-warn", "stern": "face-stern"}
def codec(mood, kind, text, acts):
    return (f'<div class="ag-codec" data-mood="{mood}"><span class="ag-codec-face"><img src="{b(FACE[mood] + ".webp")}" alt="Alia"></span>'
            f'<div class="ag-codec-body"><div class="ag-codec-head"><b>Alia</b><span class="ch">NAV-LINK</span><span class="ck">{kind}</span><span class="x">×</span></div>'
            f'<p class="ag-codec-line">{text}</p><div class="ag-codec-act">'
            + "".join(f'<span{" class=\"pri\"" if i == len(acts) - 1 else ""}>{a}</span>' for i, a in enumerate(acts)) + '</div></div></div>')
preview("AliaCodec", "Alia", 330, '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 16px;padding:8px">'
        + codec("calm", "Consejo", "Pulsa <b>a</b> y pregúntame por cualquier bloque: respondo con la página que lo dice.", ["Sin más consejos", "Leer"])
        + codec("worried", "Simulación", "Order Desk se satura — ρ 1.12 a ×1.5. 2 más sobre el límite.", ["Muéstramelo", "Leer"])
        + codec("stern", "Alerta", "Reservar está interrumpido: Hub API está caído en todas sus instancias.", ["Muéstramelo", "Leer"])
        + codec("pleased", "Todo en orden", "Nada se satura a ×1.5.", ["Leer"])
        + '</div>', bg="var(--night)")
w("components/AliaCodec/README.md", """# AliaCodec

Alia's call on a live surface — the command center's codec, as the `alia` skin draws it: her face on a ring in her mood's colour, the channel line («ALIA · NAV-LINK · <kind>»), one line she types, and the ways in as pills. It is how she interrupts a running view without a dialog: a finding worth seeing, a simulation that saturates, a walkthrough that breaks, a tip.

- **Mood = face + colour**: `calm` (`face-calm`, `alia-aqua`) a tip or a pointer; `thinking` (`face-thinking`, `alia-aqua`) a step to weigh; `pleased` (`face-pleased`, `mood-pleased`) all clear; `worried` (`face-warn`, `mood-worried`) something saturates or drifts; `stern` (`face-stern`, `mood-stern`) something is down or blocks — her own frowning face, arms crossed, never the worried one. The mood belongs to the call, not to the page: a warning call on a calm page shows her warning face.
- **Head**: «ALIA» in the mood colour with its glow, «NAV-LINK» faint, the kind in `night-muted` (Consejo · Peor hallazgo · Simulación · Alerta · Todo en orden · Recorrido), × to dismiss at the right.
- **Line**: one sentence, ~20 words, white Nunito 700; it names the component by its full name and the figure that matters. Typed two characters every 18 ms on screen; whole in print.
- **Actions**: one to three pills; the last is the primary (`.pri`, outlined in the mood colour) — usually «Leer», the page that says it. «Muéstramelo» flies to the block.
- **Where**: at the foot of the stage, left-aligned with it, above any transport bar; 300–460 px wide. One call at a time; a new one replaces it.
- **Motion**: `.is-open` — the frame rises 0.5 s with a small overshoot, her face 0.6 s; `.is-talking` while the line types — where frames can change (video, the viewer), she talks by alternating `face-talk-closed` and `face-talk-open` every 0.15 s, then rests on her mood's face — on a `calm`, `thinking` or `pleased` call only: the talking frames smile, so a `worried` or `stern` call keeps its own face and only bobs. Nothing moves under `prefers-reduced-motion`.
- **One face size per piece**: across a deck, a page set or a video every image of her face — the codec's and the `AliaNote` avatar — is the same size: **64 px** at 1920 × 1080 on slides and pages. When a bar is tight, cut its padding; never shrink her on one slide.
- **In video, 160 px**: a talking codec in a video (`.ag-codec--video`) shows her face at **160 px with a 4 px ring** at 1920 × 1080 — at 64 px her mouth cannot be seen moving. The line sits beside the face, centred on it, at 36 px; the codec spans the content column (e.g. a chapter card, 1600 px). When the codec is her voice on a card, it replaces her stage figure there: one Alia per card. Still one size within the video; a `stern` call bobs 8 px instead of talking.
- **Night only**: the codec lives on `night` grounds (the command center, footage). On a light page use `AliaNote` or `AliaTip`.
- **vs AliaTip**: the tip is chibi Alia with a bubble over content that plays by itself (video, slides); the codec is her face in a frame over a surface the reader drives, with actions.
- Classes: `.ag-codec` (`data-mood`), `.ag-codec-face`, `.ag-codec-body`, `.ag-codec-head` (`b`, `.ch`, `.ck`, `.x`), `.ag-codec-line`, `.ag-codec-act` (`.pri`), `.is-open`, `.is-talking`, `.ag-codec--video` (160 px face, for video). Faces: the `Faces` asset group.
""")

BZ = b("alia-blazon.png")
def mini(ground, kicker_c, title_c, tag):
    return (f'<div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:var(--radius-card);background:{ground};border:1px solid var(--border)">'
            f'<img class="ag-blazon ag-blazon--cover" src="{BZ}" alt="Escudo de Alia">'
            f'<span style="font:600 8.5px var(--font-mono);letter-spacing:.18em;color:{kicker_c}">SA · ARQUITECTURA DE SOLUCIÓN</span>'
            f'<b style="font:900 17px/1.15 var(--font-rounded);color:{title_c}">Order Desk — Solution Architecture</b>'
            f'<span style="margin-top:auto;font:600 9px var(--font-mono);color:var(--ink-3)">{tag}</span></div>')
def dont(style, label):
    return (f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:92px">'
            f'<div style="height:44px;display:flex;align-items:center"><img src="{BZ}" alt="" style="width:40px;height:40px;object-fit:contain;{style}"></div>'
            f'<span style="font:600 9px var(--font-mono);color:var(--coral-ink);text-align:center">✗ {label}</span></div>')
preview("AliaBlazon", "Alia", 390, '<div style="display:flex;flex-direction:column;gap:14px">'
        '<div style="display:flex;gap:14px;height:196px">'
        + mini("var(--night)", "var(--alia-aqua)", "var(--alia-white)", "PDF · portada night · 64 px")
        + mini("var(--alia-white)", "var(--aqua-ink)", "var(--ink)", "Word · portada blanca · 64 px")
        + '<div style="flex:1.3;display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:var(--radius-card);background:var(--alia-white);border:1px solid var(--border)">'
        f'<div style="display:flex;align-items:center;gap:6px;padding-bottom:5px;border-bottom:1px solid var(--border);font:400 9.5px var(--font-rounded);color:var(--ink-2)"><img class="ag-blazon ag-blazon--head" src="{BZ}" alt="Escudo de Alia"><b style="color:var(--aqua-ink)">SA</b> Order Desk — Solution Architecture</div>'
        '<span style="font:400 10px/1.5 var(--font-rounded);color:var(--ink-3)">Cada página después de la portada abre con el escudo a 14 px, antes del tipo de documento.</span>'
        '<span style="margin-top:auto;font:600 9px var(--font-mono);color:var(--ink-3)">Encabezado · 14 px · desde la página 2</span></div></div>'
        '<div style="display:flex;gap:6px;align-items:flex-start;justify-content:space-between;padding:12px 16px;border-radius:var(--radius-card);background:var(--alia-white);border:1px solid var(--border)">'
        + dont("filter:hue-rotate(150deg)", "recolorear") + dont("transform:rotate(-14deg)", "girar")
        + dont("filter:drop-shadow(0 0 8px #2ee6e6)", "brillo o sombra") + dont("width:58px;height:34px;object-fit:fill", "estirar")
        + dont("clip-path:inset(0 0 40% 0)", "recortar") + dont("opacity:.4", "atenuar")
        + '</div></div>')
w("components/AliaBlazon/README.md", """# AliaBlazon

Alia's escudo: the mark of a document written in her theme. A heraldic shield — `night` field, `alia-silver` bordure with an `alia-aqua` inner line, her hair clip as an aqua chevron (`alia-aqua` over `aqua-mark`), her sparkle in chief with a small silver one beside it, a faint hologram grid in base. Source: `brand/alia/blazon/escudo.svg`; the documents carry the 512 px PNG rendered from it (`tools/docgen/themes/alia/blazon.png`). Assets: the `Blazon` group.

- **What it marks**: a document in the Alia theme — the Word and PDF exports, a printed guide. It says *this document is Alia's look*; it is not a logo for a product, a team or a system, and it never stands for an organization.
- **Where, and only there**:
  - **The cover**: above the document-type label, left-aligned with the title, at **64 px** on screen (48 pt in PDF, 64 px in Word) — on the night cover (PDF) and on the white cover (Word) alike, as drawn.
  - **The running header**: at the start of every page after the cover, before the document type, at **14 px** (11 pt in PDF).
  - **A deck or a guide's cover** may carry it once, at the cover size. Never on inner slides, in the body of a page, beside a table or in the command center.
- **Two sizes only**: 64 px and 14 px (scale them together for another canvas: at 1920 × 1080 the cover size is 128 px). Below 14 px the chevron closes up — never smaller.
- **Clear space**: a quarter of its width on every side; nothing — text, a rule, her figure — inside it.
- **One per page**: never repeated as a pattern, a watermark or a bullet.
- **As drawn, on any ground**: it carries its own night field and silver bordure, so it reads on white, on `surface-page` and on `night` without a plate behind it. Never recolour, rotate, stretch, crop, fade, outline, or add a glow or a shadow; never put her face or another sparkle inside it; never rebuild it from parts.
- **With her figure**: the cover may show both — the escudo on the left above the title, Alia on the right. The escudo never sits on her stage or in a note, a tip or a codec.
- **Another organization's theme**: an institution pack's document theme uses its own blazon or none; Alia's escudo never marks an organization-branded document.
- **One colour**: where colour cannot print — grayscale, a stamp, a fax, an engraving — use `alia-blazon-mono.png` (ink shield, the bordure line, chevrons and sparkles knocked out to the paper) on light grounds and `alia-blazon-mono-reverse.png` on dark ones. Never convert the colour escudo to gray: its silver bordure and grid wash out. Same sizes, same rules.
- **Changing it**: edit the SVG, re-render the PNG (512 px, transparent), then upload it here. A new design is approved first, like a new pose.
- Classes: `.ag-blazon` with `.ag-blazon--cover` (64 px) or `.ag-blazon--head` (14 px, inline).
""")

w("components/Cover/preview.html", '''<!-- @dsCard height=320 -->
<div style="position:relative;width:960px;height:320px;background:var(--surface-page);overflow:hidden;font-family:var(--font-rounded)">
<svg width="960" height="320" viewBox="0 0 960 320" style="position:absolute;inset:0">
<!-- blocks: night 300×336 slab, alia-aqua 120×120, alia-silver 120×184, alia-black 34×64, aqua-mark 34×120; rx radius-card (14) -->
<!-- arrangement: a tall night slab bleeding off three edges, her colours stacked to its left, all right of x = 480 -->
<!-- pattern: a literal motif, her four-point sparkle, twelve units in alia-aqua and alia-silver on the night slab, over the holo-grid pitch (32): the README names the sparkle and the holograms as hers -->
<!-- steps and radii: gaps grid-gap (12) and page-gap (15), rx radius-card, grid holo-pitch -->
<style>.night{fill:var(--night)}.aqua{fill:var(--alia-aqua)}.silver{fill:var(--alia-silver)}.black{fill:var(--alia-black)}.mark{fill:var(--aqua-mark)}.box{rx:14px}.grid{stroke:var(--holo-grid);stroke-width:1}</style>
<rect class="night" x="660" y="-8" width="308" height="336"/>
<g class="grid"><path d="M660 32H960M660 64H960M660 96H960M660 128H960M660 160H960M660 192H960M660 224H960M660 256H960M660 288H960M692 0V320M724 0V320M756 0V320M788 0V320M820 0V320M852 0V320M884 0V320M916 0V320M948 0V320"/></g>
<rect class="aqua box" x="526" y="30" width="122" height="122"/>
<rect class="silver box" x="526" y="164" width="122" height="184"/>
<rect class="mark box" x="480" y="30" width="34" height="122"/>
<rect class="black box" x="480" y="164" width="34" height="64"/>
<defs><path id="sp" d="M12 1.5 14.6 9.4 22.5 12 14.6 14.6 12 22.5 9.4 14.6 1.5 12 9.4 9.4Z"/></defs>
<use href="#sp" class="aqua" transform="translate(700 40) scale(1.5)"/><use href="#sp" class="silver" transform="translate(780 90) scale(.75)"/>
<use href="#sp" class="aqua" transform="translate(860 30) scale(.75)"/><use href="#sp" class="silver" transform="translate(900 120) scale(1.5)"/>
<use href="#sp" class="aqua" transform="translate(720 150) scale(.75)"/><use href="#sp" class="aqua" transform="translate(800 190) scale(1.5)"/>
<use href="#sp" class="silver" transform="translate(880 230) scale(.75)"/><use href="#sp" class="aqua" transform="translate(690 250) scale(.75)"/>
<use href="#sp" class="silver" transform="translate(760 270) scale(1)"/><use href="#sp" class="aqua" transform="translate(910 280) scale(.75)"/>
<use href="#sp" class="silver" transform="translate(840 150) scale(.5)"/><use href="#sp" class="aqua" transform="translate(740 100) scale(.5)"/>
</svg>
<div style="position:absolute;left:40px;bottom:36px;width:420px">
<div style="font:900 112px/.95 var(--font-rounded);color:var(--ink);letter-spacing:-.02em">Alia<br>Guide</div>
<div style="margin-top:12px;font:400 14px/1.4 var(--font-rounded);color:var(--ink-2)">Las guías donde Alia explica la arquitectura.</div>
</div></div>
''')

w("assets/Alia/README.md", """Alia's approved poses and her avatar — the five tone poses (`cover`, `explaining`, `thinking`, `happy`, `warning`), the three placing poses for tips (`point-left`, `point-up`, `perched`), `stern`, and the talking pair (`talk-closed`, `talk-open`, the source of her talking frames) — cut out on transparency (WebP with alpha; poses 640 px, avatar 320 px). Generated locally with Animagine XL 4.0 Opt (CreativeML Open RAIL++-M, commercial use allowed) through IP-Adapter from two anchor images; sources and workflows live in the plugin repository under `brand/alia/`. Use the poses only through `AliaStage` and the avatar only through `AliaNote`: never crop again, mirror, recolour or redraw.
""")
w("assets/Faces/README.md", """Her face cut from each approved pose, 192 px WebP, for `AliaCodec` only: `face-calm` (cover pose), `face-thinking`, `face-pleased` (happy pose), `face-warn` (warning pose — worried), `face-stern` (stern pose — stern), and the talking pair `face-talk-closed` / `face-talk-open` (alternated while she talks). One size per piece (64 px on slides, 160 px in a video codec). Shown round, on a ring in the mood colour; never crop again, mirror or recolour. Sources in the plugin repository under `brand/alia/design-system/assets/faces/`.
""")
w("assets/Blazon/README.md", """Alia's escudo, the mark of a document in her theme: `alia-blazon.png` (512 px, transparent — what documents embed) and `alia-blazon.svg` (the source, from `brand/alia/blazon/escudo.svg`); `alia-blazon-mono.png` and `alia-blazon-mono-reverse.png`, the one-colour escudo for grayscale print, stamps and fax (sources `escudo-mono.svg`, `escudo-mono-reverse.svg`). Use it only as `AliaBlazon` says: the cover at 64 px, the running header at 14 px, as drawn — never recoloured, rotated, cropped or glowing.
""")
w("assets/Motifs/README.md", """Her sparkle, a four-point star in one ink. `alia-sparkle-aqua.svg` (`alia-aqua`) is the one in use. The yellow and navy sparkles are from v1 and are kept only for history: do not use them.
""")

w("README.md", """Alia Guide is the look of the guides where Alia, the architecture's navigator, is the protagonist — «Conoce a Alia» first. **Every colour in it comes from her**: the night she glows against, her silver hair, her aqua eyes and holograms, her white sweater, her black outfit. She stands on a stage on every page, and her name is aqua wherever it is written. For process guides where she is not the subject, use Alia Corporate.

## Content fundamentals

- **Spanish (es-LatAm)** for the teams; identifiers stay as they are (`search_architecture`, `I-nn`, `visualizations/`).
- **Every page title is a claim** in sentence case: «Te guía por el modelo», «Lo que Alia nunca hace». The guide title is «Conoce a Alia» or «Alia y <surface>», her name in `<em>`.
- **One lede, two lines at most.** Card kickers are verbs: Recorrer, Responder, Señalar, Simular, Buscar, Construir, Avisar.
- **She speaks only in her note**, first person, one or two sentences, her avatar beside it: «**Alia:** si no puedo responder bien, encontraste un hueco en la arquitectura.» Everywhere else she is described in the third person.
- **Only what the documentation states**: every responsibility and limit comes from `docs/ALIA.md` or the surface's own docs.
- **No emoji.** Marks are typographic (✓ ✗); her sparkle is her signature.

## Visual foundations

**Palette.** Four colours are hers and the system's: `alia-aqua` #2ee6e6, `alia-silver` #c9d1d9, `alia-white` #ffffff, `alia-black` #1b1f24. Around them: `night` #0d1418 (the cover and her voice), `surface-page` #f3f7f9 (a cool silver-white for inner pages), `ink` = `alia-black`, `ink-2` #44515c. Aqua is a light colour: on light grounds it draws through `aqua-mark` #0c9da3 (bars, rings) and writes through `aqua-ink` #0a7177; on `night` it is used as is, for her name, kickers and the glow.

**Roles.** Cards sort her responsibilities with six hues tuned to her palette — `aqua` navigate, `sky` answer, `coral` findings, `violet` simulation, `mint` build, `amber` change — each with an `-ink` twin for its kicker. They never colour her or her stage.

**Type.** Nunito, the rounded face, for every word (titles 800, the cover title 900, bodies 400) — round like a chibi character; IBM Plex Mono for headers, kickers, tags, footer and identifiers.

**Shape.** Rounder than Alia Corporate: `radius-card` 14px on cards, notes and tiles; `radius-round` on the avatar and her ring.

**The spotlight.** Alia is the largest thing on every page:
- **Inner pages** (`GuidePage`): the content on the left, her **stage** on the right — a third of the page (`stage-col`), a soft `aqua-soft` halo, an `aqua-mark` ring under her feet, a tag with her verb («Alia · pensando»).
- **The cover** (`CoverPage`): `night` with a faint 32px hologram grid (`holo-grid`), her name in aqua, three fact tiles, her palette, and Alia on a glowing ring among hologram panels.
- **Her voice** (`AliaNote`): a `night` card with her avatar in a glowing aqua ring.
- **Her escudo** (`AliaBlazon`): the mark of a document in her theme — on the cover above the document type at 64 px and at the start of every running header at 14 px, as drawn, one per page. It marks the look, never an organization: a pack's theme carries its own blazon or none.
- **Her call** (`AliaCodec`): on a live surface she interrupts in a frame at the foot of the stage — her face by mood on a ring in the mood colour (`mood-pleased`, `mood-worried`, `mood-stern`; calm in aqua), one typed line, the ways in. The command center's `alia` skin draws it.

**Depth.** Only Alia has light: her shadow on light pages, her glow on night. Cards are flat.

## Alia, the character

| Trait | Value |
|---|---|
| Hair | Short silver bob over one eye, aqua at the tips |
| Eyes | Aqua, softly glowing |
| Outfit | Oversized white ribbed zip sweater with black trim, zipped to a high collar; black shorts over tights; black platform boots with aqua soles and laces |
| Accents | Aqua geometric hair clip, small earring |
| Prop | Aqua holograms: the architecture she navigates |
| Style | Chibi, clean line art |

**Poses**: `cover` on the cover only; `explaining` for an introduction; `thinking` for how something works; `happy` for what she delivers; `warning` for limits; `stern` for what blocks. For tips: `point-left`, `point-up` and `perched` (sitting on a card's top edge where there is no free corner). The talking pair (`talk-closed`, `talk-open`) feeds her talking frames only. **Avatar**: in her note only.

**Her tips** (`AliaTip`): on footage, slides and pages, a small chibi Alia pops in at a corner on her ring with a one-line «TIP DE ALIA» at an important moment — the pose matches the tone, the tip stays only while it is read, then the content is clear again. It is how she teaches without taking the screen.

Rules:
- **One Alia per page, on her stage**, never between cards or over text.
- **Approved images only**: never crop, mirror, recolour or redraw; a new pose comes from her anchors (`brand/alia/`), is approved, then uploaded.
- **Work-appropriate always**: the outfit stays closed.
- **A tip is the exception to «one Alia per page»** only on footage and slides, where her stage is not shown; on a printed page with a stage, there is no tip.

## Iconography

None beyond her sparkle and the typographic marks. A guide that needs icons borrows Alia Corporate's `GuideKit` line icons, drawn in `ink` or a role `-ink`.

## Printing

Author each page as a `page-width` × `page-height` section with `break-after: page`, `@page { size: 297mm 210mm; margin: 0 }` and `print-color-adjust: exact`; embed the images as data URIs and the Nunito and IBM Plex Mono faces as `@font-face` data (a printed PDF cannot fetch `/_blob/` or Google Fonts reliably). Print with headless Chrome (`--headless=new --no-pdf-header-footer --virtual-time-budget=4000 --print-to-pdf=<out.pdf> <page.html>`) and check every page as an image.
""")

groups = {
    "Alia": ["alia-cover.webp", "alia-explaining.webp", "alia-thinking.webp", "alia-happy.webp", "alia-warning.webp", "alia-stern.webp",
             "alia-point-left.webp", "alia-point-up.webp", "alia-perched.webp", "alia-talk-closed.webp", "alia-talk-open.webp", "alia-avatar.webp"],
    "Blazon": ["alia-blazon.png", "alia-blazon.svg", "alia-blazon-mono.png", "alia-blazon-mono-reverse.png"],
    "Faces": ["face-calm.webp", "face-thinking.webp", "face-pleased.webp", "face-warn.webp", "face-stern.webp", "face-talk-closed.webp", "face-talk-open.webp"],
    "Motifs": ["alia-sparkle-aqua.svg", "alia-sparkle-yellow.svg", "alia-sparkle-navy.svg"],
}
def index(created_at):
    return {
        "v": 3, "layout": "files", "createdOnFiles": {"v": 1, "at": created_at}, "title": "Alia Guide", "namespace": "AliaGuide",
        "libraries": [], "sections": {}, "groups": ["Alia", "Motifs"],
        "assetGroups": {g: {"name": g, "tile": "l" if g == "Alia" else "s", "order": fs,
                            "files": {f: {"name": f, "blob": BLOB[f][0], "size": BLOB[f][1], "type": BLOB[f][2]} for f in fs}}
                        for g, fs in groups.items()},
        "blobs": {}, "docs": {"readme": "project/README.md", "sections": []},
        "lastChange": {"by": "Claude", "at": NOW, "via": "Claude Code", "note": "AliaCodec: the video size — a talking codec in video shows her face at 160 px so her mouth reads; it replaces her stage figure on that card"},
    }
import sys
w("design-system.json", json.dumps(index(sys.argv[1] if len(sys.argv) > 1 else NOW), ensure_ascii=False))
print("ok")
