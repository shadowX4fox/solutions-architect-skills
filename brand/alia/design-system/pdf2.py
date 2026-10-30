"""«Conoce a Alia» from the Alia Guide design system: gen2.py's tokens, bundle.css and markup helpers, every image
embedded (a printed PDF cannot fetch /_blob/). Writes ~/Downloads/conoce-a-alia-ds.html; print it with headless Chrome."""
import base64, json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(D, "..", "..", ".."))
OUT = os.path.expanduser("~/Downloads/conoce-a-alia-ds.html")
SA_VERSION = json.load(open(os.path.join(REPO, ".claude-plugin", "plugin.json")))["version"]

# gen2.py builds the design system; run it with writes switched off to get its helpers, then point b() at data URIs
src = open(os.path.join(D, "gen2.py")).read()
g = {"__file__": os.path.join(D, "gen2.py"), "__name__": "gen2"}
argv, sys.argv = sys.argv, [sys.argv[0]]
WROTE = {}
g["WROTE"] = WROTE
exec(src.replace('def w(path, text):', 'def w(path, text):\n    WROTE[path] = text; return\n'), g)
sys.argv = argv
A = os.path.join(D, "assets")
FILES = {n: os.path.join(A, n) for n in os.listdir(A) if n.endswith((".webp", ".svg"))}
FILES.update({"face-calm.webp": f"{A}/faces/face-cover.webp", "face-thinking.webp": f"{A}/faces/face-thinking.webp",
              "face-pleased.webp": f"{A}/faces/face-happy.webp", "face-warn.webp": f"{A}/faces/face-warning.webp",
              "face-stern.webp": f"{A}/faces/face-stern.webp",
              "alia-blazon.png": os.path.join(REPO, "tools", "docgen", "themes", "alia", "blazon.png")})
MIME = {".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png"}
DATA = {n: f"data:{MIME[os.path.splitext(n)[1]]};base64," + base64.b64encode(open(p, "rb").read()).decode() for n, p in FILES.items()}
g["b"] = lambda n: DATA[n]
g["BZ"] = DATA["alia-blazon.png"]
g["AV"] = f'<span class="ag-avatar"><img src="{DATA["alia-avatar.webp"]}" alt="Alia"></span>'
card, note, stage, head, codec, tip, mini = (g[k] for k in ("card", "note", "stage", "head", "codec", "tip", "mini"))
VER = f"sa-skills {SA_VERSION} · servidor Alia 0.6.0"
def foot(n): return f'<div class="ag-foot"><span class="n">{n}</span><span class="bar"></span><span>Conoce a Alia</span><span class="tk">{VER}</span></div>'
def code(t): return f'<span class="ag-code">{t}</span>'
def page(n, topic, title, lede, left, pose, tag, alt):
    return f'<section class="ag-page">{head(n, topic)}<h1 class="ag-title">{title}</h1><p class="ag-lede">{lede}</p><div class="ag-split">{left}{stage(pose, tag, alt)}</div>{foot(n)}</section>'
def wide(n, topic, title, lede, body):   # a page without her stage: she is already on it, in her components
    return f'<section class="ag-page">{head(n, topic)}<h1 class="ag-title">{title}</h1><p class="ag-lede">{lede}</p>{body}{foot(n)}</section>'

# the cover: her escudo once, above the title (AliaBlazon), the versions in force
cover = g["cover_html"](DATA["alia-cover.webp"])
cover = cover.replace('<h1 class="ag-title">', f'<img class="ag-blazon ag-blazon--cover" src="{DATA["alia-blazon.png"]}" alt="Escudo de Alia" style="margin-bottom:14px"><h1 class="ag-title">', 1)
cover = cover.replace("sa-skills 10.25.2", f"sa-skills {SA_VERSION}")

p1 = page("01", "quién es", "Una guía, dos lugares", "Alia es la misma en los dos: lee solo lo que la arquitectura documenta y no escribe en ningún documento.",
  '<div class="ag-grid ag-grid--note">' + card("aqua", "Centro de mando", "El modelo 3D de la arquitectura", "Un piso por capa, un bloque por contenedor, conexiones y casos de uso. Un solo HTML que se abre en el navegador.<br><br><b>Para</b> arquitectos, product owners, revisores y quien llega nuevo al equipo.")
  + card("sky", "Servidor MCP", "La arquitectura en tu IDE", "Búsqueda, hechos exactos y un paquete de construcción por componente, servidos a VS Code, JetBrains o Claude Code.<br><br><b>Para</b> desarrolladores, sus agentes y los agentes de construcción desatendidos.")
  + note("me llamo así por la navegadora de Mega Man X. Mi trabajo es que nadie se pierda en la arquitectura.") + "</div>", "explaining", "explicando", "Alia explicando")
p2 = page("02", "en el centro de mando", "Te guía por el modelo", f"Abre el centro de mando y pulsa {code('a')}: Alia responde desde el dossier que el modelo lleva dentro, también sin conexión. Abre en su tema, {code('alia')}.",
  '<div class="ag-grid">' + card("aqua", "Recorrer", "Casos de uso, fase por fase", "Ilumina cada fase en orden con su presupuesto de latencia p95, y atenúa todo lo que no participa.")
  + card("sky", "Responder", "Con la página que lo dice", f"ADRs, TDRs, descriptores, integraciones {code('I-nn')} y hallazgos. Si no está en el dossier, dice que no consta.")
  + card("coral", "Señalar", "Los hallazgos en escena", "Pinta cada hallazgo de los análisis sobre su componente, por severidad residual: abierto o mitigado.")
  + card("violet", "Simular", "Qué se rompe primero", "Carga documentada contra capacidad documentada. Violeta es pendiente: recibe carga sin capacidad documentada y nunca se juzga.") + "</div>", "thinking", "pensando", "Alia pensando")
p3 = page("03", "en tu IDE", "Te da lo que necesitas para construir", "El servidor MCP sirve la versión publicada de la arquitectura. Tu agente le pregunta a Alia en lugar de adivinar.",
  '<div class="ag-grid">' + card("aqua", "Buscar", "Respuestas con su fuente", f"{code('search_architecture')} encuentra la sección, el ADR o la integración, y {code('get_document')} la muestra entera.")
  + card("sky", "Datos exactos", "Del registro de hechos", "Componentes, integraciones, flujos y decisiones, tal como están documentados en esa versión.")
  + card("mint", "Construir", "Un paquete por componente", "Especificación, contratos, interfaces, presupuestos, ADRs vigentes, preguntas abiertas y un plan ordenado.")
  + card("amber", "Avisar", "Qué cambió y qué escalar", f"{code('what_changed')} dice qué mover entre versiones. Una duda que bloquea se escala al arquitecto, no se resuelve a ciegas.") + "</div>", "happy", "contenta", "Alia contenta")

# 04 — her three voices, as the design system draws them
K = 'font:600 10px var(--font-mono);letter-spacing:.2em;text-transform:uppercase;color:var(--aqua-ink)'
P_ = 'margin:4px 0 10px;font:400 12.5px/1.45 var(--font-rounded);color:var(--ink-2)'
voice = lambda k, h, p: f'<span style="{K}">{k}</span><h3 style="margin:4px 0 0;font:900 17px var(--font-rounded);color:var(--ink)">{h}</h3><p style="{P_}">{p}</p>'
p4 = wide("04", "cómo te habla", "Tres formas de hablarte", "Según dónde estés, Alia te habla con una nota, un tip o una llamada. Su cara y su color dicen cómo está.",
  '<div style="flex:1;min-height:0;display:grid;grid-template-columns:1fr 1.25fr;gap:18px;margin-top:14px">'
  '<div style="display:flex;flex-direction:column;gap:14px">'
  '<div style="padding:14px 18px;background:var(--surface-card);border:1.2px solid var(--border);border-radius:var(--radius-card)">'
  + voice("Nota", "Su voz en una página", "Una idea que no cabe en la tabla, junto a lo que estás leyendo.")
  + note("leo lo que los arquitectos documentaron, y digo cuando algo no consta.") + '</div>'
  '<div style="flex:1;position:relative;padding:14px 18px;background:var(--surface-card);border:1.2px solid var(--border);border-radius:var(--radius-card);overflow:hidden">'
  + voice("Tip", "En el momento importante", "En un video o una diapositiva aparece en una esquina, señala lo que importa y se va cuando lo leíste.")
  + '<div style="position:absolute;right:10px;bottom:2px;transform:scale(.82);transform-origin:right bottom">'
  + tip("point-left", f"Pregúntame qué cambió con {code('what_changed')} antes de tocar código.", light=True) + '</div></div></div>'
  '<div style="padding:14px 18px;background:var(--night);border-radius:var(--radius-card)">'
  f'<span style="{K};color:var(--alia-aqua)">Llamada</span><h3 style="margin:4px 0 0;font:900 17px var(--font-rounded);color:var(--alia-white)">En el centro de mando, cuando algo pasa</h3>'
  '<p style="margin:4px 0 12px;font:400 12.5px/1.45 var(--font-rounded);color:var(--night-text)">Te llama al pie de la escena con una línea y la forma de verlo. Habla con la boca cuando trae calma o buenas noticias.</p>'
  '<div style="display:flex;flex-direction:column;gap:10px;transform:scale(.92);transform-origin:left top">'
  + codec("calm", "Consejo", "Pulsa <b>a</b> y pregúntame por cualquier bloque.", ["Leer"])
  + codec("worried", "Simulación", "Order Desk se satura — ρ 1.12 a ×1.5.", ["Muéstramelo", "Leer"])
  + codec("stern", "Alerta", "Hub API está caído en todas sus instancias.", ["Muéstramelo", "Leer"])
  + codec("pleased", "Todo en orden", "Nada se satura a ×1.5.", ["Leer"])
  + '</div></div></div>')

# 05 — where her look appears
p5 = wide("05", "su sello", "Su sello en lo que entrega", "Los documentos Word y PDF y el centro de mando salen con su identidad, salvo que tu organización traiga la suya.",
  '<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:16px;margin-top:14px">'
  '<div style="display:flex;gap:14px;height:345px">'
  + mini("var(--night)", "var(--alia-aqua)", "var(--alia-white)", "PDF · portada night")
  + mini("var(--alia-white)", "var(--aqua-ink)", "var(--ink)", "Word · portada blanca")
  + '<div style="flex:1.2;display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:var(--radius-card);background:var(--alia-white);border:1px solid var(--border)">'
  f'<div style="display:flex;align-items:center;gap:6px;padding-bottom:5px;border-bottom:1px solid var(--border);font:400 10px var(--font-rounded);color:var(--ink-2)"><img class="ag-blazon ag-blazon--head" src="{DATA["alia-blazon.png"]}" alt="Escudo de Alia"><b style="color:var(--aqua-ink)">SA</b> Order Desk — Solution Architecture</div>'
  '<span style="font:400 11px/1.5 var(--font-rounded);color:var(--ink-3)">Cada página después de la portada abre con su escudo, antes del tipo de documento.</span>'
  '<span style="margin-top:auto;font:600 9px var(--font-mono);color:var(--ink-3)">Encabezado · desde la página 2</span></div></div>'
  '<div class="ag-grid" style="grid-template-columns:1fr 1fr 1fr;flex:1;min-height:0">'
  + card("aqua", "Su escudo", "En la portada y en cada página", "Un escudo con su chevrón y su chispa: arriba del título en la portada y al inicio de cada encabezado. En gris, su versión de una tinta.")
  + card("sky", "Su tema", "El centro de mando abre en «alia»", "Noche, aqua y plata, paneles redondos, y su cara en cada llamada según cómo está.")
  + card("mint", "Tu organización", "Trae su propia identidad", f"Un paquete institucional reemplaza su look ({code('docTheme')}, un skin propio) y nunca toma su escudo.")
  + '</div></div>')

never = [("Inventar un dato", "si la arquitectura no lo dice, responde que no consta."), ("Editar la arquitectura", f"el centro de mando solo escribe en {code('visualizations/')}."),
         ("Publicar sin que lo pidas", "el modelo se abre en tu equipo; publicar es tu decisión."), ("Abrir el canal a Claude por su cuenta", "solo en una copia publicada, y la primera pregunta pide tu consentimiento."),
         ("Cambiar de versión sola", "sirve la versión que pides; sin versión, la última publicada."), ("Tratar la seguridad como un hueco", "una interfaz sin autenticación documentada se cierra por defecto.")]
p6 = page("06", "sus límites", "Lo que Alia nunca hace", "Sus límites son parte de su trabajo: una respuesta honesta de «no consta» vale más que una adivinada.",
  '<div class="ag-grid ag-grid--stack"><div class="ag-limits"><ul>' + "".join(f'<li><span class="mk">✗</span><span><b>{a}</b> — {r}</span></li>' for a, r in never) + "</ul></div>"
  + note("si no puedo responder bien, encontraste un hueco en la arquitectura. Mejor encontrarlo ahora que en producción.") + "</div>", "stern", "firme", "Alia firme")

tok = json.loads(WROTE["tokens.json"])
var = []
for t in tok["color"]["tokens"]:
    v = t["value"]; v = "var(--%s)" % v[1:-1] if v.startswith("{") else v; var.append(f"--{t['name']}:{v};")
for fam in ("spacing", "radius", "size"): var += [f"--{t['name']}:{t['value']};" for t in tok[fam]["tokens"]]
var += [f"--font-{k}:{v};" for k, v in tok["type"]["families"].items()]
bundle = WROTE["components/bundle.css"].split("\n", 1)[1]   # drop the Google Fonts @import: fonts are embedded
fonts = open(os.path.join(D, "fonts", "fonts-embedded.css")).read()
pc = "@page{size:297mm 210mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#c9d1d9;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ag-page{break-after:page;page-break-after:always;margin:0 auto 12px}.ag-page:last-child{break-after:auto}@media print{.ag-page{margin:0}}"
html = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Conoce a Alia — Alia Guide</title><style>{fonts}</style><style>:root{{{"".join(var)}}}</style><style>{bundle}</style><style>{pc}</style></head><body>{cover}{p1}{p2}{p3}{p4}{p5}{p6}</body></html>'
open(OUT, "w", encoding="utf-8").write(html); print(OUT, len(html) // 1024, "KB")
