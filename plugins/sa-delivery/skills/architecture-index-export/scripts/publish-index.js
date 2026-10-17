#!/usr/bin/env bun
// publish-index.js — load the architecture being written into an architecture index server to test it: export the
// bundle as a draft, check it, publish it to the server's draft slot, wait until search is ready.
//
//   bun publish-index.js <project> [--server <url>] [--project-key <key>] [--up] [--no-wait] [--timeout <seconds>]
//
// --up starts the local server first (local/compose.yaml: the MCP server with its file engine, in Docker, embedding
// through the host's Ollama — the GPU — or, when the host has none a container can reach, an Ollama container on the CPU)
// when nothing answers at the server URL. A laptop only ever publishes the draft: the released version on a
// server is CI's (ci/publish-index.sh). The server and the project key come from the flags, then SA_INDEX_SERVER /
// SA_INDEX_PROJECT_KEY, then the project's .sa-skills/index.json — written on the first publish so the key stays the
// same for every run and for CI — then http://localhost:8080 and the architecture's name. SA_INDEX_TOKEN, when set,
// is sent as a bearer token. Exit: 0 published and searchable (or published, with --no-wait) · 1 the bundle failed
// its check or the server refused it · 2 usage · 3 no server · 4 still indexing at the timeout.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { exportIndex, checkBundle } = require('./export-index.js');

const COMPOSE = path.join(__dirname, '..', 'local', 'compose.yaml');
// the server built from its repository instead of the published image, when SA_INDEX_SERVER_REF names a branch or commit
const COMPOSE_SOURCE = path.join(__dirname, '..', 'local', 'compose.source.yaml');
const CONFIG = path.join('.sa-skills', 'index.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function settings(root, opts) {
  let cfg = {}; const file = path.join(root, CONFIG);
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* none yet */ }
  return {
    server: String(opts.server || process.env.SA_INDEX_SERVER || cfg.server || 'http://localhost:8080').replace(/\/+$/, ''),
    key: opts.projectKey || process.env.SA_INDEX_PROJECT_KEY || cfg.project_key || null,
    configFile: file, hasConfig: fs.existsSync(file),
  };
}

const headers = (extra = {}) => ({ ...(process.env.SA_INDEX_TOKEN ? { Authorization: `Bearer ${process.env.SA_INDEX_TOKEN}` } : {}), ...extra });

async function healthy(server) {
  try { const r = await fetch(`${server}/actuator/health`, { signal: AbortSignal.timeout(3000) }); return r.ok; } catch { return false; }
}

const isLocal = (server) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(server);

const CPU_OLLAMA = 'http://ollama:11434';
async function reaches(url) {
  try { const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; }
}
function dockerGateway() {
  const r = spawnSync('docker', ['network', 'inspect', 'bridge', '--format', '{{(index .IPAM.Config 0).Gateway}}'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() || null : null;
}

// Which Ollama the local server embeds through. The host's by default — it uses the machine's GPU when there is one —
// when a container can reach it: on Linux that means listening beyond localhost, which the Docker bridge's gateway
// shows; Docker Desktop forwards host.docker.internal to the host's localhost. Otherwise the cpu profile's container.
// SA_INDEX_OLLAMA, when set, is taken as given.
async function chooseOllama({ env = process.env, platform = process.platform, gateway = dockerGateway, reach = reaches } = {}) {
  if (env.SA_INDEX_OLLAMA) return { url: env.SA_INDEX_OLLAMA, cpu: env.SA_INDEX_OLLAMA === CPU_OLLAMA, note: `embeddings: SA_INDEX_OLLAMA=${env.SA_INDEX_OLLAMA}` };
  const host = { url: 'http://host.docker.internal:11434', cpu: false, note: "embeddings: the host's Ollama — the GPU when the machine has one" };
  const local = await reach('http://localhost:11434');
  if (platform !== 'linux') return local ? host : cpuRoute('no Ollama answers on this machine');
  const gw = gateway();
  if (gw && await reach(`http://${gw}:11434`)) return host;
  return cpuRoute(local ? "the host's Ollama listens only on localhost, so the container cannot reach it — set OLLAMA_HOST=0.0.0.0 for it (on Linux: sudo systemctl edit ollama, then restart) to embed on the GPU"
    : 'no Ollama on this machine — install it to embed on the GPU');
}
const cpuRoute = (why) => ({ url: CPU_OLLAMA, cpu: true, note: `embeddings: an Ollama container on the CPU, about one chunk a second (${why})` });

// docker compose up for the local server, then wait for its health: the first start pulls the image and the model
async function up(server, log, timeoutS) {
  const port = (new URL(server).port) || '8080';
  const ver = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
  if (ver.status !== 0) throw Object.assign(new Error('Docker with the compose plugin is needed to start the local server (docker compose version failed)'), { code: 3 });
  const ollama = await chooseOllama();
  log(ollama.note);
  const source = !!process.env.SA_INDEX_SERVER_REF;
  const args = ['compose', '-f', COMPOSE, ...(source ? ['-f', COMPOSE_SOURCE] : []), ...(ollama.cpu ? ['--profile', 'cpu'] : []), 'up', '-d', ...(source ? ['--build'] : [])];
  log(`starting the local server: docker ${args.join(' ')} (${source ? `built from ${process.env.SA_INDEX_SERVER_REF} — minutes` : 'the first start pulls the image and the model'})`);
  const r = spawnSync('docker', args, { stdio: 'inherit', env: { ...process.env, SA_INDEX_PORT: port, SA_INDEX_OLLAMA: ollama.url } });
  if (r.status !== 0) throw Object.assign(new Error('docker compose up failed'), { code: 3 });
  const end = Date.now() + timeoutS * 1000;
  while (Date.now() < end) { if (await healthy(server)) return; await sleep(5000); }
  throw Object.assign(new Error(`the local server did not answer at ${server} within ${timeoutS} s — docker compose -f ${COMPOSE} logs server`), { code: 3 });
}

async function waitIndexed(server, key, timeoutS, log) {
  const end = Date.now() + timeoutS * 1000; let last = '';
  while (Date.now() < end) {
    const r = await fetch(`${server}/bundles`, { headers: headers() }).catch(() => null);
    const slot = r && r.ok ? ((await r.json())[key] || {}).draft : null;
    const s = slot && typeof slot.search === 'object' ? slot.search : null;
    if (s && s.status === 'READY') return s;
    if (s && s.status === 'FAILED') throw Object.assign(new Error(`indexing failed: ${s.error}`), { code: 1 });
    const now = s ? s.status : 'waiting'; if (now !== last) { log(`  search: ${now.toLowerCase()}`); last = now; }
    await sleep(3000);
  }
  throw Object.assign(new Error(`still indexing after ${timeoutS} s — GET ${server}/bundles shows when it is ready`), { code: 4 });
}

async function publish(root, opts = {}) {
  root = path.resolve(root);
  const log = opts.log || ((m) => console.log(m));
  if (!fs.existsSync(path.join(root, 'ARCHITECTURE.md'))) throw Object.assign(new Error(`${root}: no ARCHITECTURE.md`), { code: 2 });
  const st = settings(root, opts);
  if (!(await healthy(st.server))) {
    if (opts.up && isLocal(st.server)) await up(st.server, log, opts.upTimeout || 1800);
    else throw Object.assign(new Error(`no architecture index server answers at ${st.server}. Start the local one: bun ${path.relative(process.cwd(), __filename)} ${path.relative(process.cwd(), root) || '.'} --up  (or docker compose -f ${COMPOSE} up -d)`), { code: 3 });
  }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-index-publish-'));
  try {
    const out = path.join(work, 'bundle');
    const { manifest: m } = exportIndex(root, { out, draft: true, projectKey: st.key || undefined, server: `${st.server}/mcp`, kitCheck: opts.kitCheck });
    const chk = checkBundle(out);
    if (chk.status !== 'PASS') throw Object.assign(new Error(`the bundle failed its check:\n${chk.findings.map((x) => `  ✗ ${x.where}: ${x.text}`).join('\n')}`), { code: 1 });
    const key = m.project.key; const version = m.architecture.version;
    log(`index: ${key} ${version} (draft) — ${m.counts.chunks} chunks, ${m.counts.buildpacks} build packs${m.skipped.length ? `, ${m.skipped.length} components without one` : ''}`);
    const tgz = path.join(work, 'bundle.tgz');
    const t = spawnSync('tar', ['-czf', tgz, '-C', out, '.'], { encoding: 'utf8' });
    if (t.status !== 0) throw Object.assign(new Error(`tar failed: ${t.stderr}`), { code: 1 });
    const res = await fetch(`${st.server}/bundles/${encodeURIComponent(key)}/${encodeURIComponent(version)}?channel=draft`,
      { method: 'POST', headers: headers({ 'Content-Type': 'application/gzip' }), body: fs.readFileSync(tgz) });
    const body = await res.text();
    // a server run as several instances answers 403 from a reader (archindex.role=reader): only the writer publishes
    if (res.status === 403) throw Object.assign(new Error(`${st.server} is a reader instance of the server (archindex.role=reader), which never publishes — pass the writer's URL with --server or SA_INDEX_SERVER: ${body}`), { code: 1 });
    if (res.status !== 201 && res.status !== 200) throw Object.assign(new Error(`the server answered ${res.status}: ${body}`), { code: 1 });
    log(`published to ${st.server} (${res.status})`);
    if (!st.hasConfig) {
      fs.mkdirSync(path.dirname(st.configFile), { recursive: true });
      fs.writeFileSync(st.configFile, JSON.stringify({ server: st.server, project_key: key }, null, 1) + '\n');
      log(`wrote ${CONFIG} (server, project_key) — commit it: the key must stay the same for every publish, CI's included`);
    }
    const result = { server: st.server, project: key, version, channel: 'draft', chunks: m.counts.chunks, build_packs: m.buildpacks.map((b) => b.component), skipped: m.skipped };
    if (opts.wait !== false) {
      const s = await waitIndexed(st.server, key, opts.timeout || 1800, log);
      result.search = s; log(`search ready: ${s.chunks} chunks, ${s.embedded} embedded, ${s.reused} reused`);
    }
    log(`\nTry it: claude mcp add --transport http alia ${st.server}/mcp   (once)\n  then ask Alia with project "${key}" and version "draft" — search_architecture, get_document, get_component, get_build_pack${result.build_packs.length ? ` (${result.build_packs.join(', ')})` : ''}`);
    return result;
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}

module.exports = { publish, settings, chooseOllama, COMPOSE };

if (require.main === module) {
  const args = process.argv.slice(2); const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const flagged = new Set(['--server', '--project-key', '--timeout']);
  const root = args.find((x, i) => !x.startsWith('--') && !flagged.has(args[i - 1]));
  if (!root) { console.error('Usage: bun publish-index.js <project> [--server <url>] [--project-key <key>] [--up] [--no-wait] [--timeout <seconds>]'); process.exit(2); }
  publish(root, { server: val('--server'), projectKey: val('--project-key'), up: args.includes('--up'), wait: !args.includes('--no-wait'),
    timeout: val('--timeout') ? Number(val('--timeout')) : undefined, kitCheck: args.includes('--no-kit-check') ? false : undefined })
    .then(() => process.exit(0))
    .catch((e) => { console.error(`publish-index: ${e.message}`); process.exit(e.code || 1); });
}
