import base64, json, os, re, importlib.util
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(D, "out2", "project")
OUT = os.path.expanduser("~/Downloads/conoce-a-alia-ds.html")
tok = json.load(open(os.path.join(P, "tokens.json")))
var = []
for t in tok["color"]["tokens"]:
    v = t["value"]; v = "var(--%s)" % v[1:-1] if v.startswith("{") else v; var.append(f"--{t['name']}:{v};")
for fam in ("spacing", "radius", "size"): var += [f"--{t['name']}:{t['value']};" for t in tok[fam]["tokens"]]
var += [f"--font-{k}:{v};" for k, v in tok["type"]["families"].items()]
bundle = open(os.path.join(P, "components", "bundle.css")).read().split("\n", 1)[1]
fonts = open(os.path.join(D, "fonts", "fonts-embedded.css")).read()
def data(n, m): return f"data:{m};base64," + base64.b64encode(open(os.path.join(D, "assets", n), "rb").read()).decode()
spec = importlib.util.spec_from_file_location("g", os.path.join(D, "gen2.py"))
src = open(os.path.join(D, "gen2.py")).read()
# reuse gen2's markup helpers with data URIs in place of /_blob/ urls
blobs = {k: v[0] for k, v in json.loads(json.dumps({}) or "{}").items()}
g = {"__file__": os.path.join(D, "gen2.py")}
exec(src.split("# ------------------------------------------------------------------ snippets")[0].split("# ------------------------------------------------------------------ tokens")[0], g)
MIME = {".webp": "image/webp", ".svg": "image/svg+xml"}
DATA = {n: data(n, MIME[os.path.splitext(n)[1]]) for n in os.listdir(os.path.join(D, "assets")) if os.path.splitext(n)[1] in MIME}
g["b"] = lambda n: DATA[n]
snip = src.split("# ------------------------------------------------------------------ snippets")[1].split("# ------------------------------------------------------------------ components")[0]
exec(snip, g)
card, note, stage, head, foot = g["card"], g["note"], g["stage"], g["head"], g["foot"]
def code(t): return f'<span class="ag-code">{t}</span>'
def page(n, topic, title, lede, left, pose, tag, alt):
    return f'<section class="ag-page">{head(n, topic)}<h1 class="ag-title">{title}</h1><p class="ag-lede">{lede}</p><div class="ag-split">{left}{stage(pose, tag, alt)}</div>{foot(n)}</section>'
cover = g["cover_html"](DATA["alia-cover.webp"])
p1 = page("01", "quién es", "Una guía, dos lugares", "Alia es la misma en los dos: lee solo lo que la arquitectura documenta y no escribe en ningún documento.",
  '<div class="ag-grid ag-grid--note">' + card("aqua", "Centro de mando", "El modelo 3D de la arquitectura", "Un piso por capa, un bloque por contenedor, conexiones y casos de uso. Un solo HTML que se abre en el navegador.<br><br><b>Para</b> arquitectos, product owners, revisores y quien llega nuevo al equipo.")
  + card("sky", "Servidor MCP", "La arquitectura en tu IDE", "Búsqueda, hechos exactos y un paquete de construcción por componente, servidos a VS Code, JetBrains o Claude Code.<br><br><b>Para</b> desarrolladores, sus agentes y los agentes de construcción desatendidos.")
  + note("me llamo así por la navegadora de Mega Man X. Mi trabajo es que nadie se pierda en la arquitectura.") + "</div>", "explaining", "explicando", "Alia explicando")
p2 = page("02", "en el centro de mando", "Te guía por el modelo", f"Abre el centro de mando y pulsa {code('a')}: Alia responde desde el dossier que el modelo lleva dentro, también sin conexión.",
  '<div class="ag-grid">' + card("aqua", "Recorrer", "Casos de uso, fase por fase", "Ilumina cada fase en orden con su presupuesto de latencia p95, y atenúa todo lo que no participa.")
  + card("sky", "Responder", "Con la página que lo dice", f"ADRs, TDRs, descriptores, integraciones {code('I-nn')} y hallazgos. Si no está en el dossier, dice que no consta.")
  + card("coral", "Señalar", "Los hallazgos en escena", "Pinta cada hallazgo de los análisis sobre su componente, por severidad residual: abierto o mitigado.")
  + card("violet", "Simular", "Qué se rompe primero", "Carga documentada contra capacidad documentada. Violeta es pendiente: recibe carga sin capacidad documentada y nunca se juzga.") + "</div>", "thinking", "pensando", "Alia pensando")
p3 = page("03", "en tu IDE", "Te da lo que necesitas para construir", "El servidor MCP sirve la versión publicada de la arquitectura. Tu agente le pregunta a Alia en lugar de adivinar.",
  '<div class="ag-grid">' + card("aqua", "Buscar", "Respuestas con su fuente", f"{code('search_architecture')} encuentra la sección, el ADR o la integración, y {code('get_document')} la muestra entera.")
  + card("sky", "Datos exactos", "Del registro de hechos", "Componentes, integraciones, flujos y decisiones, tal como están documentados en esa versión.")
  + card("mint", "Construir", "Un paquete por componente", "Especificación, contratos, interfaces, presupuestos, ADRs vigentes, preguntas abiertas y un plan ordenado.")
  + card("amber", "Avisar", "Qué cambió y qué escalar", f"{code('what_changed')} dice qué mover entre versiones. Una duda que bloquea se escala al arquitecto, no se resuelve a ciegas.") + "</div>", "happy", "contenta", "Alia contenta")
never = [("Inventar un dato", "si la arquitectura no lo dice, responde que no consta."), ("Editar la arquitectura", f"el centro de mando solo escribe en {code('visualizations/')}."),
         ("Publicar sin que lo pidas", "el modelo se abre en tu equipo; publicar es tu decisión."), ("Abrir el canal a Claude por su cuenta", "solo en una copia publicada, y la primera pregunta pide tu consentimiento."),
         ("Cambiar de versión sola", "sirve la versión que pides; sin versión, la última publicada."), ("Tratar la seguridad como un hueco", "una interfaz sin autenticación documentada se cierra por defecto.")]
p4 = page("04", "sus límites", "Lo que Alia nunca hace", "Sus límites son parte de su trabajo: una respuesta honesta de «no consta» vale más que una adivinada.",
  '<div class="ag-grid ag-grid--stack"><div class="ag-limits"><ul>' + "".join(f'<li><span class="mk">✗</span><span><b>{a}</b> — {r}</span></li>' for a, r in never) + "</ul></div>"
  + note("si no puedo responder bien, encontraste un hueco en la arquitectura. Mejor encontrarlo ahora que en producción.") + "</div>", "warning", "advirtiendo", "Alia advirtiendo")
pc = "@page{size:297mm 210mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#c9d1d9;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ag-page{break-after:page;page-break-after:always;margin:0 auto 12px}.ag-page:last-child{break-after:auto}@media print{.ag-page{margin:0}}"
html = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Conoce a Alia — Alia Guide</title><style>{fonts}</style><style>:root{{{"".join(var)}}}</style><style>{bundle}</style><style>{pc}</style></head><body>{cover}{p1}{p2}{p3}{p4}</body></html>'
open(OUT, "w", encoding="utf-8").write(html); print(OUT, len(html)//1024, "KB")
