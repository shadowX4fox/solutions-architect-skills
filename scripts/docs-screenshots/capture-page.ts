// one full-height WebP of a static page: bun capture-page.ts <chrome> <page.html> <out.webp> [width]
const [chrome, page, out, w] = process.argv.slice(2); const width = Number(w || 1200);
const port = 9800 + Math.floor(Math.random() * 100), sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const proc = Bun.spawn([chrome, "--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run", `--user-data-dir=${require("os").tmpdir()}/cap-${port}`, "about:blank"], { stdout: "ignore", stderr: "ignore" });
let ws: WebSocket | null = null, id = 0; const pend = new Map<number, (v: any) => void>();
const send = (method: string, params: any = {}) => new Promise<any>((res) => { const i = ++id; pend.set(i, res); ws!.send(JSON.stringify({ id: i, method, params })); });
for (let i = 0; i < 50 && !ws; i++) { try { const t: any = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = t.find((x: any) => x.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => ws!.addEventListener("open", r)); ws!.addEventListener("message", (e) => { const m = JSON.parse(String(e.data)); if (m.id && pend.has(m.id)) { pend.get(m.id)!(m.result); pend.delete(m.id); } });
await send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 1, mobile: false });
await send("Page.enable"); await send("Page.navigate", { url: "file://" + page }); await sleep(1500);
const h = (await send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true })).result.value;
await send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: 1, mobile: false }); await sleep(500);
const r = await send("Page.captureScreenshot", { format: "webp", quality: 90 }); await Bun.write(out, Buffer.from(r.data, "base64")); console.log("wrote", out, width + "x" + h); proc.kill();
export {};
