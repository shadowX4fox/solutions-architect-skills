#!/usr/bin/env bun
/**
 * plugin-root.ts — the one answer to "where is this plugin installed", for every skill.
 *
 *   bun scripts/plugin-root.ts [--plugin <sa-skills|sa-records|sa-requirements|sa-analysis|sa-delivery|sa-visualization>] [--project <dir>] [--registry <installed_plugins.json>] [--json] [--quiet]
 *
 * Every skill used to locate itself with `Glob **\/{sa-skills,…}/skills/<skill>/SKILL.md`. That glob
 * also matches `~/.claude/plugins/cache/<marketplace>/sa-skills/<version>/…` — and the cache keeps
 * every version ever installed (sixty on one machine), so the hit was whichever came first: on
 * 2026-09-13 an 8.46.0 copy rendered a command center for a project pinned to 8.49.0. This script
 * answers from Claude Code's own install registry instead, first hit wins:
 *
 *   1. $CLAUDE_PLUGIN_ROOT, when the shell has it and it holds this plugin's manifest
 *   2. ~/.claude/plugins/installed_plugins.json — the entry for this project (scope `project` or
 *      `local` whose projectPath is the project dir or an ancestor), else the `user` scope entry;
 *      an entry whose installPath is gone is skipped
 *   3. the copy this script runs from (the marketplace clone, or a dev clone)
 *
 * It prints the directory on stdout and, on stderr, a warning when the resolved copy is older than
 * the newest one on the machine — a running session keeps the version it loaded at startup, so the
 * fix is `claude plugin update … --scope <scope>` and then `/reload-plugins`. Exit 1 when nothing
 * resolves. `--json` gives the structured form.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve, sep } from "path";

const MARKETPLACE = "shadowx4fox-solution-architect-marketplace";

const args = process.argv.slice(2);
const opt = (f: string): string | undefined => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
// which plugin of the marketplace: sa-skills (default) or one it depends on, e.g. sa-records — a skill shipped by that
// plugin runs from that plugin's own install, never from sa-skills'
const NAME = opt("--plugin") ?? "sa-skills";
const PLUGIN_KEY = `${NAME}@${MARKETPLACE}`;
const json = args.includes("--json"), quiet = args.includes("--quiet");
const project = resolve(opt("--project") ?? process.cwd());
// Claude Code's config dir: CLAUDE_CONFIG_DIR when set (a custom or isolated config), else ~/.claude
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR ? resolve(process.env.CLAUDE_CONFIG_DIR) : join(homedir(), ".claude");
const registryPath = resolve(opt("--registry") ?? join(CLAUDE_DIR, "plugins", "installed_plugins.json"));
const SELF = resolve(import.meta.dir, "..");

type Entry = { scope?: string; projectPath?: string; installPath?: string; version?: string };
type Hit = { pluginDir: string; version: string | null; source: string };

/** The version a copy declares, or null when the directory is not this plugin. */
function versionOf(dir: string): string | null {
  const manifest = join(dir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifest)) return null;
  try {
    const m = JSON.parse(readFileSync(manifest, "utf8"));
    return m && m.name === NAME ? String(m.version ?? "") : null;
  } catch { return null; }
}
const semver = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
const newer = (a: string, b: string) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) { if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0); } return false; };
const within = (dir: string, root: string) => { const d = resolve(dir), r = resolve(root); return d === r || d.startsWith(r.endsWith(sep) ? r : r + sep); };

function fromEnv(): Hit | null {
  const dir = process.env.CLAUDE_PLUGIN_ROOT; if (!dir) return null;
  const v = versionOf(dir); return v === null ? null : { pluginDir: resolve(dir), version: v, source: "env:CLAUDE_PLUGIN_ROOT" };
}
function fromRegistry(): Hit | null {
  if (!existsSync(registryPath)) return null;
  let entries: Entry[] = [];
  try { const r = JSON.parse(readFileSync(registryPath, "utf8")); entries = (r.plugins ?? r)[PLUGIN_KEY] ?? []; } catch { return null; }
  const live = entries.filter((e) => e.installPath && versionOf(e.installPath) !== null);
  const scoped = live.filter((e) => (e.scope === "project" || e.scope === "local") && e.projectPath && within(project, e.projectPath))
    .sort((a, b) => (b.projectPath!.length - a.projectPath!.length));   // the nearest ancestor wins
  const hit = scoped[0] ?? live.find((e) => e.scope === "user");
  return hit ? { pluginDir: resolve(hit.installPath!), version: versionOf(hit.installPath!), source: `registry:${hit.scope}` } : null;
}
// the copy the script runs from: the repo root is sa-skills, and a plugin it ships lives under plugins/<name>
const SELF_DIR = NAME === "sa-skills" ? SELF : join(SELF, "plugins", NAME);
function fromSelf(): Hit | null {
  const v = versionOf(SELF_DIR); return v === null ? null : { pluginDir: SELF_DIR, version: v, source: "self" };
}

const hit = fromEnv() ?? fromRegistry() ?? fromSelf();
if (!hit) {
  console.error(`plugin-root: no ${NAME} install found — registry ${registryPath} has no live entry, $CLAUDE_PLUGIN_ROOT is unset, and ${SELF_DIR} is not the plugin. Install it: claude plugin install ${PLUGIN_KEY}`);
  process.exit(1);
}

// the newest copy on the machine, to warn when the resolved one lags it
const candidates: Array<{ version: string; path: string }> = [];
const push = (dir: string) => { const v = versionOf(dir); if (v) candidates.push({ version: v, path: dir }); };
push(SELF_DIR);
const clone = join(CLAUDE_DIR, "plugins", "marketplaces", MARKETPLACE);
push(NAME === "sa-skills" ? clone : join(clone, "plugins", NAME));
const cache = join(CLAUDE_DIR, "plugins", "cache", MARKETPLACE, NAME);
if (existsSync(cache)) { try { readdirSync(cache).forEach((d) => push(join(cache, d))); } catch { /* unreadable cache: nothing to compare */ } }
const newest = candidates.reduce<{ version: string; path: string } | null>((m, c) => (!m || newer(c.version, m.version) ? c : m), null);
const stale = !!(newest && hit.version && newer(newest.version, hit.version));

if (json) {
  console.log(JSON.stringify({ ...hit, project, newest, stale }, null, 2));
} else {
  console.log(hit.pluginDir);
  if (stale && !quiet) {
    const scope = hit.source.startsWith("registry:") ? hit.source.slice("registry:".length) : "project";
    console.error(`plugin-root: resolved ${NAME} ${hit.version} (${hit.source}) but ${newest!.version} is on this machine — run \`claude plugin update ${PLUGIN_KEY} --scope ${scope}\` and then /reload-plugins (a running session keeps the version it loaded at startup).`);
  }
}
