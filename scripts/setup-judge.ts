#!/usr/bin/env bun
/**
 * setup-judge.ts — report which judge is in force on this machine and whether it can answer.
 *
 *   bun scripts/setup-judge.ts [<project root>] [--json] [--no-probe] [--strict] [--endpoint <url>]
 *                              [--dry-run] [--user-settings <path>]   (default ~/.claude/settings.json; read only)
 *
 * `scripts/judge.js` is the plugin's one judge: every semantic verdict a script asks — which
 * component a name refers to, whether a passage asserts a claim — goes through it, and the engine
 * that answers is picked once for the machine:
 *
 *   SA_JUDGE            agent (default since 8.71.0) · typesafe · clef — the engine every site uses when the command
 *                       names none; `heuristic` (8.119.0) and `claude` (8.120.0) were removed and are reported as an
 *                       error with their fix
 *   TYPESAFE_API_KEY    the key the typesafe engine needs; lives in the shell, never in a versioned file
 *   SA_JUDGE_MODEL      the TypeSafe model, jev-latest when unset
 *   clef engine         Cloudflare's Clef: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the shell (never in a
 *                       versioned file), SA_JUDGE_CLEF_MODEL (clef, the one Workers AI serves), and
 *                       CLOUDFLARE_AI_GATEWAY_ID when the calls go through an AI Gateway
 *
 * The helper reports the three, refuses a key found inside the project's settings (a versioned
 * file), and — when the key is set — sends one item to the API and reports the model that answered
 * and how long it took, because a key that resolves and cannot reach the API passes a presence
 * check and fails on the first real run. It writes one thing: when no scope sets SA_JUDGE (the user
 * settings, the project settings, this shell), `env.SA_JUDGE = "agent"` goes into the project
 * settings, so the default is visible where the project keeps its configuration; a value set anywhere
 * is left as it is. Exit code is 0 unless `--strict` (for CI) and the engine in force cannot answer:
 * a report, not a gate.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";

type Check = { id: string; label: string; ok: boolean; detail: string; fix?: string; cost?: string };

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string): string | undefined => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--endpoint" && args[i - 1] !== "--user-settings");
const root = resolve(positional[0] ?? process.cwd());
const json = flag("--json"), noProbe = flag("--no-probe"), strict = flag("--strict"), endpoint = opt("--endpoint"), dryRun = flag("--dry-run");
const userPath = resolve(opt("--user-settings") ?? join(homedir(), ".claude", "settings.json"));

const J = require(join(import.meta.dir, "judge.js"));
const { ENGINES, ENV, DEFAULTS } = J;

const checks: Check[] = [];
const push = (c: Check) => { checks.push(c); return c; };

// 0. apply the default: SA_JUDGE=agent in the project settings when no scope sets it
const settingsPath = join(root, ".claude", "settings.json");
const readSettings = (p: string): any => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; } catch { return null; } };
const userValue = readSettings(userPath)?.env?.[ENV.engine];
const projectSettings = readSettings(settingsPath) ?? {};
const projectValue = projectSettings?.env?.[ENV.engine];
const shellValue = process.env[ENV.engine];
const applied: "set" | "already" | "project" | "user" | "shell" =
  shellValue !== undefined ? "shell" : userValue !== undefined ? "user" : projectValue === DEFAULTS.engine ? "already" : projectValue !== undefined ? "project" : "set";
if (applied === "set" && !dryRun) {
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify({ ...projectSettings, env: { ...(projectSettings.env ?? {}), [ENV.engine]: DEFAULTS.engine } }, null, 2) + "\n");
}

// 1. the engine in force — the shell wins, then the user scope, then the project scope, then the default
const rawEngine: string | undefined = shellValue ?? userValue ?? projectValue;
const engineOk = !rawEngine || ENGINES.includes(rawEngine);
const engine: string = engineOk ? (rawEngine || DEFAULTS.engine) : DEFAULTS.engine;
const where = applied === "set" ? (dryRun ? `would write ${ENV.engine}=${DEFAULTS.engine} to ${settingsPath} (--dry-run)` : `${ENV.engine}=${DEFAULTS.engine} written to ${settingsPath}`)
  : applied === "already" ? `set in ${settingsPath}` : applied === "project" ? `set in ${settingsPath} — left as it is` : applied === "user" ? `set at user scope (${userPath}) — left as it is` : "set in this shell — left as it is";
push({
  id: "engine", label: "judge engine (SA_JUDGE)", ok: engineOk,
  detail: engineOk ? `${engine} — ${where}${engine === "agent" ? " (the session answers each worksheet; nothing leaves the machine)" : ""}`
    : rawEngine === "heuristic" ? `"heuristic" (${where}) — the heuristic engine was removed in 8.119.0: an item no judge answered is undecided, never guessed; every judge call fails until it is one of ${ENGINES.join(" | ")}`
    : `${JSON.stringify(rawEngine)} is not an engine (${where}) — every judge call fails until it is one of ${ENGINES.join(" | ")}`,
  ...(engineOk ? {} : { fix: `set ${ENV.engine}=agent where it is set now   # or typesafe, clef`, cost: "every script that asks the judge exits with an engine error" }),
});

// 2. the key — set or not, never its value; and never inside the project's settings
const keySet = !!process.env[ENV.key];
let leaked = false;
if (existsSync(settingsPath)) {
  try { const s = JSON.parse(readFileSync(settingsPath, "utf8")); leaked = !!(s?.env && Object.prototype.hasOwnProperty.call(s.env, ENV.key)); } catch { /* unreadable settings are Step 3's problem */ }
}
push({
  id: "key", label: `${ENV.key} in this shell`, ok: engine !== "typesafe" || keySet,
  detail: keySet ? "set" : engine === "typesafe" ? "unset — the engine in force cannot answer" : "unset (only the typesafe engine needs it)",
  ...(keySet || engine !== "typesafe" ? {} : { fix: `create a key at https://console.typesafe.ai/keys, then export ${ENV.key}=… in your shell profile above any "not interactive" guard`, cost: "every judge call on the typesafe engine exits 3; use SA_JUDGE=agent meanwhile" }),
});
push({
  id: "key-place", label: "key kept out of versioned files", ok: !leaked,
  detail: leaked ? `${ENV.key} found under env in ${settingsPath}` : `not in ${settingsPath}`,
  ...(leaked ? { fix: `remove env.${ENV.key} from ${settingsPath} and export it from the shell profile instead`, cost: "the key ships with the repository to everyone who clones it" } : {}),
});

// 3. the model
const model = process.env[ENV.model] || DEFAULTS.model;
push({ id: "model", label: `TypeSafe model (${ENV.model})`, ok: true, detail: process.env[ENV.model] ? model : `unset — ${DEFAULTS.model}` });

// the live probe's result, whichever engine sends it
let probe: { ok: boolean; model?: string; ms?: number; error?: string } | null = null;

// 3b. the clef engine — reported whenever it is the engine in force: the account, the token, the model and one live answer
let clefReady = engine !== "clef";
if (engine === "clef") {
  const account = !!process.env[ENV.cfAccount], token = !!process.env[ENV.cfToken], endpoint = J.clefEndpointOf();
  // a local endpoint (Ollama's clef-flash) needs no token
  const local = !!endpoint && !J.isCloudflare(endpoint), credOk = !!endpoint && (token || local);
  push({ id: "clef-cred", label: `Clef credentials (${ENV.cfAccount}, ${ENV.cfToken})`, ok: credOk,
    detail: local ? `${ENV.clefEndpoint} ${endpoint} — a local server, no token` : [account ? `${ENV.cfAccount} set` : process.env[ENV.clefEndpoint] ? `${ENV.clefEndpoint} set` : `${ENV.cfAccount} missing`, token ? `${ENV.cfToken} set` : `${ENV.cfToken} missing`].join(" · "),
    ...(credOk ? {} : { fix: `export ${ENV.cfAccount}=… ${ENV.cfToken}=…   # in your shell profile, above any early return for non-interactive shells; never in a versioned file`, cost: "every judge call on the clef engine exits with a key error" }) });
  let leakedC = false; try { const st = JSON.parse(readFileSync(settingsPath, "utf8")); leakedC = !!(st?.env && Object.prototype.hasOwnProperty.call(st.env, ENV.cfToken)); } catch { /* no settings */ }
  if (leakedC) push({ id: "clef-key-place", label: "Cloudflare token kept out of versioned files", ok: false, detail: `${ENV.cfToken} found under env in ${settingsPath}`, fix: `remove env.${ENV.cfToken} from ${settingsPath}`, cost: "the token ships with the repository" });
  const gateway = process.env[ENV.cfGateway];
  push({ id: "clef-gateway", label: `AI Gateway (${ENV.cfGateway})`, ok: true, detail: gateway ? `${gateway} — every call carries cf-aig-gateway-id` : "unset — calls go straight to Workers AI" });
  const clefModel = J.modelInForce(process.env, "clef"), clefProblem = J.clefModelProblem(clefModel, J.clefEndpointOf(process.env)), modelOk = !clefProblem;
  push({ id: "clef-model", label: `Clef model (${ENV.clefModel})`, ok: modelOk, detail: modelOk ? clefModel : `${clefModel} — ${clefProblem}`, ...(modelOk ? {} : { fix: `unset ${ENV.clefModel}   # clef on Workers AI — or CLEF_ENDPOINT=http://localhost:11434/v1/systemone for clef-flash on Ollama`, cost: "every judge call on the clef engine exits with an engine error" }) });
  if (endpoint && token && modelOk && !noProbe) {
    const spec = { id: "setup-probe", type: "noul", question: "Is `item.text` a greeting?", criteria: { true: "The text greets someone.", false: "It does not." } };
    const t0 = performance.now();
    try { const res = await J.judge(spec, [{ id: "p1", state: { text: "Hello there." } }], { engine: "clef", root, cache: false }); const a = res.answers.p1; probe = { ok: !!a && typeof a.p === "number", model: a && a.by, ms: Math.round(performance.now() - t0) }; }
    catch (e: any) { probe = { ok: false, error: e.message, ms: Math.round(performance.now() - t0) }; }
    push({ id: "probe", label: "one item answered by Clef", ok: probe.ok, detail: probe.ok ? `${probe.model} answered in ${probe.ms} ms` : `failed — ${probe.error}`,
      ...(probe.ok ? {} : { fix: "check the token's Workers AI permission and the account id; the request goes to the account's /ai/run/@cf/cloudflare/clef route", cost: "every judge call on the clef engine fails the same way" }) });
  }
  clefReady = !!endpoint && token && modelOk && (probe === null || probe.ok);
}

// 4. the probe — one item, the smallest state that has an answer
if (keySet && !noProbe && engine !== "clef") {
  const spec = { id: "setup-probe", type: "noul", question: "Is `item.text` a greeting?", criteria: { true: "The text greets someone.", false: "It does not." } };
  const items = [{ id: "p1", state: { text: "Hello there." } }];
  const t0 = performance.now();
  try {
    const res = await J.judge(spec, items, { engine: "typesafe", root, cache: false, model, ...(endpoint ? { endpoint } : {}) });
    const a = res.answers.p1;
    probe = { ok: typeof a.p === "number", model: a.by, ms: Math.round(performance.now() - t0) };
  } catch (e: any) {
    probe = { ok: false, error: e.message, ms: Math.round(performance.now() - t0) };
  }
  push({
    id: "probe", label: "one item answered by the API", ok: probe.ok,
    detail: probe.ok ? `${probe.model} answered in ${probe.ms} ms` : `failed — ${probe.error}`,
    ...(probe.ok ? {} : { fix: "check the key at https://console.typesafe.ai/keys and the network; the request goes to https://api.typesafe.ai/v1/systemone", cost: "every judge call on the typesafe engine fails the same way" }),
  });
} else if (keySet && engine !== "clef") {
  push({ id: "probe", label: "one item answered by the API", ok: true, detail: "skipped (--no-probe)" });
}

// 5. the cache
const cacheDir = join(root, ".cache", "sa-skills", "judge");
let entries = 0, files = 0;
if (existsSync(cacheDir)) for (const f of readdirSync(cacheDir)) if (f.endsWith(".cache.json")) { files++; try { entries += Object.keys(JSON.parse(readFileSync(join(cacheDir, f), "utf8"))).length; } catch { /* a corrupt cache is rebuilt on the next run */ } }
push({ id: "cache", label: "answer cache", ok: true, detail: existsSync(cacheDir) ? `${cacheDir} — ${files} spec${files === 1 ? "" : "s"}, ${entries} cached answer${entries === 1 ? "" : "s"}` : `${cacheDir} — none yet (written on the first typesafe or clef run)` });

// ---- report
const canAnswer = engineOk && clefReady && (engine !== "typesafe" || (keySet && (probe === null || probe.ok)));
if (json) {
  console.log(JSON.stringify({ engine, applied, settingsPath, keySet, leaked, model, probe, cacheDir, root, canAnswer, checks }, null, 2));
} else {
  console.log("judge");
  for (const c of checks) {
    console.log(`  ${c.ok ? "✅" : "⬜"} ${c.label}: ${c.detail}`);
    if (c.cost) console.log(`       without it: ${c.cost}`);
    if (c.fix) console.log(`       fix: ${c.fix}`);
  }
}
process.exit(strict && !canAnswer ? 1 : 0);
