#!/usr/bin/env bun
// The viewer's photo mode as a file: opens a rendered command center in headless Chrome, switches to photo mode (the chrome
// leaves, the caption names the project, the version, the view and the date) and writes the window as a PNG — the picture a
// release PR or a review carries as evidence of the version it shows. No dependency: Chrome over the DevTools protocol, from Bun.
//
//   bun snapshot.js <viewer.html> <out.png> [--plan <component id>] [--width 1600] [--height 1000] [--scale 1|2|3] [--wait <ms>] [--chrome <path>]
//
// --plan: the plan page of that component's floor, the component selected (the viewer's #plan=<id>) — a release's evidence framed
// on what it changed (10.21.0); the caption then names the floor and the component. An id the scene lacks: the default view.
//
// The browser: --chrome, else SA_CHROME / PUPPETEER_EXECUTABLE_PATH / CHROME_PATH, else Puppeteer's newest download under
// ~/.cache/puppeteer, else google-chrome, chromium or chrome on PATH. The page is a local file the plugin rendered, so it runs with
// --no-sandbox (CI runners and recent Ubuntu refuse Chrome's sandbox). Prints the caption on stdout; exit 1 when the viewer did not
// start (no photo button) or the browser is missing.
const fs = require('fs');
const os = require('os');
const path = require('path');

const a = process.argv.slice(2), opt = (f, d) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : d; };
const [html, out] = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && a[i - 1].startsWith('--')));
if (!html || !out) { console.error('Usage: bun snapshot.js <viewer.html> <out.png> [--plan <component id>] [--width 1600] [--height 1000] [--scale 1|2|3] [--wait <ms>] [--chrome <path>]'); process.exit(2); }
const PLAN = opt('--plan'), W = +opt('--width', 1600), H = +opt('--height', 1000), SCALE = +opt('--scale', 1), WAIT = +opt('--wait', 6000);

function findChrome() {
  const named = [opt('--chrome'), process.env.SA_CHROME, process.env.PUPPETEER_EXECUTABLE_PATH, process.env.CHROME_PATH].filter(Boolean);
  for (const c of named) if (fs.existsSync(c)) return c;
  const cache = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(cache)) {
    const sub = { linux: 'chrome-linux64/chrome', darwin: 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', win32: 'chrome-win64/chrome.exe' }[process.platform];
    const hits = fs.readdirSync(cache).sort((x, y) => y.localeCompare(x, undefined, { numeric: true })).map((v) => path.join(cache, v, sub || '')).filter((f) => sub && fs.existsSync(f));
    if (hits.length) return hits[0];
  }
  for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) { const w = Bun.which(n); if (w) return w; }
  return null;
}

async function main() {
  const chrome = findChrome();
  if (!chrome) { console.error('No Chrome found: --chrome <path>, SA_CHROME, or `bunx puppeteer browsers install chrome`'); process.exit(1); }
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-snapshot-'));
  const proc = Bun.spawn([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
    `--window-size=${W},${H}`, '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdout: 'ignore', stderr: 'pipe' });
  const done = (code) => { try { proc.kill(); } catch (e) { /* gone */ } try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* busy */ } process.exit(code); };
  let buf = '', ws = null; const rd = proc.stderr.getReader(), dec = new TextDecoder(), t0 = Date.now();
  while (!ws) { const { value, done: end } = await rd.read(); if (end || Date.now() - t0 > 30000) { console.error('Chrome did not start:\n' + buf.slice(-800)); done(1); } buf += dec.decode(value); ws = (buf.match(/ws:\/\/\S+/) || [])[0]; }
  const sock = new WebSocket(ws); await new Promise((r) => { sock.onopen = r; });
  let id = 0; const pend = new Map();
  sock.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const evaluate = async (s, expression) => ((await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, s)).result || {}).result?.value;

  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId: s } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, s); await send('Runtime.enable', {}, s);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false }, s);
  await send('Page.navigate', { url: 'file://' + path.resolve(html) + (PLAN ? '#plan=' + encodeURIComponent(PLAN) : '') }, s);
  await Bun.sleep(WAIT);   // the scene builds and the camera settles
  const on = await evaluate(s, "(() => { const b = document.getElementById('b-photo'); if (!b) return false; b.click(); return true; })()");
  if (!on) { console.error('The viewer did not start: no photo button in ' + html); done(1); }
  await Bun.sleep(3500);   // the photo bar fades after 2.6 s idle
  const caption = await evaluate(s, "(document.querySelector('#photofx .caption') || {}).textContent || ''");
  const shot = await send('Page.captureScreenshot', { format: 'png' }, s);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log(caption.replace(/\s+·\s+/g, ' · '));
  done(0);
}
main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
