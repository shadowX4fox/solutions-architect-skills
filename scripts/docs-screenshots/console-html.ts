export {};
// a terminal-style page from a `claude -p --output-format stream-json` log: the prompt, each MCP tool call, the answer
const [log, prompt, out] = process.argv.slice(2);
const L = require("fs").readFileSync(log, "utf8").trim().split("\n").map((l: string) => JSON.parse(l));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const md = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
const rows: string[] = [];
rows.push(`<div class="p"><span class="g">~/order-desk</span> <span class="d">$</span> claude -p <span class="s">"${esc(prompt)}"</span></div>`);
for (const m of L) if (m.type === "assistant") for (const c of m.message.content) {
  if (c.type === "tool_use" && c.name.startsWith("mcp__")) { const [, srv, tool] = c.name.split("__"); const args = Object.entries(c.input).map(([k, v]) => `${k}: ${esc(JSON.stringify(v))}`).join(", "); rows.push(`<div class="t"><span class="dot">⏺</span> <b>${srv} - ${tool}</b> <span class="d">(MCP)</span>(${args})</div>`); }
  if (c.type === "text") { rows.push(`<div class="a"><span class="dot w">⏺</span><div>${c.text.split("\n").map((l: string) => l.trim() === "" ? "<br>" : l.startsWith("- ") ? `<div class="li">• ${md(l.slice(2))}</div>` : `<div>${md(l)}</div>`).join("")}</div></div>`); }
}
require("fs").writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#0b1020;font:15px/1.55 "JetBrains Mono","DejaVu Sans Mono",ui-monospace,monospace;color:#d6deeb}
.win{margin:28px;border-radius:12px;background:#0f1629;box-shadow:0 20px 60px #0008;overflow:hidden;border:1px solid #1d2a4a}
.bar{height:34px;background:#141d36;display:flex;align-items:center;gap:8px;padding:0 14px;color:#7f8db0;font-size:13px}
.bar i{width:12px;height:12px;border-radius:50%;display:inline-block}.bar span{margin-left:12px}
.c{padding:18px 22px 24px}.p{margin-bottom:14px}.g{color:#7fdbca}.d{color:#637777}.s{color:#ecc48d}
.t{margin:6px 0;color:#c5e4fd}.t b{color:#82aaff}.dot{color:#7fdbca}.dot.w{color:#e6e6e6;margin-right:10px}
.a{display:flex;margin-top:14px}.a b{color:#fff}.li{padding-left:6px}code{color:#c792ea}
</style><div class="win"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>claude — Alia architecture MCP server</span></div><div class="c">${rows.join("")}</div></div>`);
