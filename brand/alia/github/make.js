// Alia's GitHub images (11.3.0, light variants 11.3.1): the five codecs a CI comment heads with — her face in the
// outcome's ring, 144 px (64 px shown, sharp at 2x) — in two editions, codec-<mood>.png on her night disc and codec-<mood>-light.png on silver
// (ci-text.js picks one by the reader's theme through <picture>). Run from the repository root:
//   bun brand/alia/github/make.js [<chrome-headless-shell>]
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const A = 'plugins/sa-alia/assets/alia/', OUT = 'brand/alia/github';
const face = { calm: 'face-calm.webp', thinking: 'face-thinking.webp', pleased: 'face-pleased.webp', worried: 'face-warn.webp', stern: 'face-stern.webp' };
const theme = {
  dark: { disc: '#15222a', ring: { calm: '#2ee6e6', thinking: '#2ee6e6', pleased: '#4dffa0', worried: '#ffd23f', stern: '#ff3b4e' } },
  light: { disc: '#e8eef1', ring: { calm: '#0c9da3', thinking: '#0c9da3', pleased: '#13a35a', worried: '#c98a00', stern: '#d9263a' } },
};
const chrome = process.argv[2] || (() => {
  const base = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell');
  const v = fs.readdirSync(base).sort().pop();
  return path.join(base, v, 'chrome-headless-shell-linux64/chrome-headless-shell');
})();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alia-codec-'));
for (const [t, { disc, ring }] of Object.entries(theme)) for (const m of Object.keys(face)) {
  const b64 = fs.readFileSync(A + face[m]).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><defs><clipPath id="d"><circle cx="36" cy="36" r="32"/></clipPath></defs><circle cx="36" cy="36" r="32" fill="${disc}"/><image href="data:image/webp;base64,${b64}" x="4" y="4" width="64" height="64" clip-path="url(#d)"/><circle cx="36" cy="36" r="34" fill="none" stroke="${ring[m]}" stroke-width="3"/></svg>`;
  const html = path.join(tmp, `${m}-${t}.html`);
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  const r = spawnSync(chrome, ['--headless', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', '--force-device-scale-factor=2',
    '--window-size=72,72', `--screenshot=${path.resolve(OUT, t === 'dark' ? `codec-${m}.png` : `codec-${m}-${t}.png`)}`, `file://${html}`], { stdio: 'ignore' });
  if (r.status !== 0) { console.error(`chrome failed on ${m}-${t}`); process.exit(1); }
  console.log(t === 'dark' ? `codec-${m}.png` : `codec-${m}-${t}.png`);
}
