// capture the command center for the docs: headless Chrome over CDP, real keys, a WebP per shot
// bun capture.ts <chrome> <out dir> "<page.html>::<name>=<key,key>;<name>=<keys>" …  (see README.md)
export {};
const [chrome, outDir, ...pages] = process.argv.slice(2);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = Bun.spawn([chrome, "--headless=new", `--remote-debugging-port=${port}`, "--window-size=1600,900", "--hide-scrollbars", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--no-first-run", "--user-data-dir=" + outDir + "/.chrome", "about:blank"], { stdout: "ignore", stderr: "ignore" });
let ws: WebSocket | null = null, id = 0; const pending = new Map<number, (v: any) => void>();
const send = (method: string, params: any = {}) => new Promise<any>((res) => { const i = ++id; pending.set(i, res); ws!.send(JSON.stringify({ id: i, method, params })); });
const KEY: Record<string, number> = { v: 86, s: 83, t: 84, a: 65, l: 76, Escape: 27, "1": 49, "2": 50, "3": 51, "4": 52 };
const key = async (k: string) => { const code = KEY[k]; for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: k, code: k.length === 1 ? "Key" + k.toUpperCase() : k, windowsVirtualKeyCode: code, text: type === "keyDown" && k.length === 1 ? k : undefined }); };
const shot = async (name: string) => { const r = await send("Page.captureScreenshot", { format: "webp", quality: 88 }); await Bun.write(`${outDir}/${name}.webp`, Buffer.from(r.data, "base64")); console.log("shot", name); };
for (let i = 0; i < 50; i++) { try { const t: any = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = t.find((x: any) => x.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => ws!.addEventListener("open", r));
ws!.addEventListener("message", (e) => { const m = JSON.parse(String(e.data)); if (m.id && pending.has(m.id)) { pending.get(m.id)!(m.result); pending.delete(m.id); } });
await send("Page.enable"); await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
for (const spec of pages) {
  const [file, steps] = spec.split("::");   // steps: name=key,key,...;name=...
  await send("Page.navigate", { url: "file://" + file }); await sleep(4000);
  for (const step of steps.split(";")) { const [name, keys] = step.split("="); for (const k of (keys || "").split(",").filter(Boolean)) { if (k.startsWith("wait")) await sleep(Number(k.slice(4))); else { await key(k); await sleep(900); } } await sleep(1800); await shot(name); }
}
proc.kill();
