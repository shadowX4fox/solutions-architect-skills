'use strict';
// Where a Chrome to drive headless is, on any OS — the one answer for every script that photographs a page (the analyses'
// chart, the command center's snapshot). In order: an explicit path (--chrome, SA_CHROME, PUPPETEER_EXECUTABLE_PATH,
// CHROME_PATH); Puppeteer's newest download (`bunx puppeteer browsers install chrome`) in this platform's folder; the
// browsers on PATH; then where an installer puts one — Linux distributions name it on PATH, macOS in /Applications,
// Windows under Program Files or the user's LocalAppData, with Edge (Chromium) as the last resort there. null: none.
const fs = require('fs');
const os = require('os');
const path = require('path');

const CACHE_SUB = {
  linux: ['chrome-linux64/chrome'],
  darwin: process.arch === 'arm64'
    ? ['chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing']
    : ['chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'],
  win32: ['chrome-win64/chrome.exe', 'chrome-win32/chrome.exe'],
};

function installed(platform = process.platform, env = process.env) {
  if (platform === 'darwin') {
    const apps = ['/Applications', path.join(os.homedir(), 'Applications')];
    return apps.flatMap((a) => [`${a}/Google Chrome.app/Contents/MacOS/Google Chrome`, `${a}/Chromium.app/Contents/MacOS/Chromium`, `${a}/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`]);
  }
  if (platform === 'win32') {
    const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter(Boolean);
    return [...roots.map((r) => path.join(r, 'Google', 'Chrome', 'Application', 'chrome.exe')),
      ...roots.map((r) => path.join(r, 'Chromium', 'Application', 'chrome.exe')),
      ...roots.map((r) => path.join(r, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))];
  }
  return [];
}

/** The Chrome to drive, or null. `given` is an explicit path (a --chrome flag). */
function findChrome(given, { platform = process.platform, env = process.env, exists = fs.existsSync, which = (n) => (typeof Bun !== 'undefined' ? Bun.which(n) : null) } = {}) {
  for (const c of [given, env.SA_CHROME, env.PUPPETEER_EXECUTABLE_PATH, env.CHROME_PATH].filter(Boolean)) if (exists(c)) return c;
  const cache = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (exists(cache)) {
    let versions = [];
    try { versions = fs.readdirSync(cache).sort((x, y) => y.localeCompare(x, undefined, { numeric: true })); } catch { versions = []; }
    for (const v of versions) for (const sub of CACHE_SUB[platform] || []) { const f = path.join(cache, v, sub); if (exists(f)) return f; }
  }
  for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome', 'msedge']) { const w = which(n); if (w) return w; }
  for (const f of installed(platform, env)) if (exists(f)) return f;
  return null;
}

module.exports = { findChrome, installed, CACHE_SUB };
