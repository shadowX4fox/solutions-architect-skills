#!/usr/bin/env bun
/**
 * setup-ripgrep.ts — detect ripgrep on this machine and configure the project for it.
 *
 *   bun scripts/setup-ripgrep.ts [<project .claude/settings.json>] [--json] [--dry-run] [--strict]
 *                               [--user-settings <path>]   (default ~/.claude/settings.json; read only)
 *
 * Two things depend on ripgrep, and they fail differently:
 *
 *   the skills' searches   every search instruction the plugin hands the model is an `rg` command run
 *                          through Bash (8.48.0). Without `rg` on PATH each one fails with
 *                          `rg: command not found` and the model falls back to whatever it types first.
 *   the built-in Grep tool Claude Code ships its own ripgrep and uses it unless USE_BUILTIN_RIPGREP=0,
 *                          which points the tool at the `rg` on PATH instead. This one never breaks.
 *
 * So the helper reports `rg` (path, version, PCRE2 — the prose gate's one `-P` rule needs it), the
 * setting at user and project scope, and the `Bash(rg *)` grant; then, when a system ripgrep exists
 * and the user scope says nothing, it writes `env.USE_BUILTIN_RIPGREP = "0"` into the project
 * settings so both readers use the same binary. It never touches the user-scope file, never
 * overrides a value already set at either scope, and writes nothing when ripgrep is missing — a
 * setting that points the Grep tool at a binary that is not there would break the one reader that
 * worked. Exit code is 0 unless `--strict` (for CI) and ripgrep is missing: a report, not a gate.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir, platform } from "os";
import { dirname, join, resolve } from "path";

type Check = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  /** What the user runs to fix it. Absent when nothing is wrong. */
  fix?: string;
  /** What breaks while it is missing. */
  cost?: string;
};

type Settings = { env?: Record<string, string>; permissions?: { allow?: string[] }; [k: string]: unknown };

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string): string | undefined => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--user-settings");
const projectPath = resolve(positional[0] ?? join(process.cwd(), ".claude", "settings.json"));
const userPath = resolve(opt("--user-settings") ?? join(homedir(), ".claude", "settings.json"));
const json = flag("--json"), dryRun = flag("--dry-run"), strict = flag("--strict");

const SETTING = "USE_BUILTIN_RIPGREP";
const GRANT = "Bash(rg *)";

function readSettings(path: string): Settings | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Settings;
}

function run(cmd: string[]): { code: number; out: string } {
  try {
    const r = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" });
    return { code: r.exitCode, out: r.stdout.toString().trim() };
  } catch {
    return { code: 127, out: "" };
  }
}

/** The one install command for this machine, from the package manager that is actually on PATH. */
function installCommand(): string {
  const has = (b: string) => Bun.which(b) !== null;
  if (platform() === "win32") return has("winget") ? "winget install BurntSushi.ripgrep.MSVC" : has("choco") ? "choco install ripgrep" : "scoop install ripgrep";
  if (platform() === "darwin") return has("brew") ? "brew install ripgrep" : "port install ripgrep";
  if (has("apt-get")) return "sudo apt-get install ripgrep";
  if (has("dnf")) return "sudo dnf install ripgrep";
  if (has("pacman")) return "sudo pacman -S ripgrep";
  if (has("zypper")) return "sudo zypper install ripgrep";
  if (has("apk")) return "sudo apk add ripgrep";
  return has("cargo") ? "cargo install ripgrep" : "install ripgrep from https://github.com/BurntSushi/ripgrep#installation";
}

const checks: Check[] = [];

// 1. ripgrep on PATH
const rgPath = Bun.which("rg");
const version = rgPath ? run([rgPath, "--version"]).out.split("\n")[0] : "";
const pcre2 = rgPath ? run([rgPath, "--pcre2-version"]).code === 0 : false;
checks.push({
  id: "rg", label: "ripgrep on PATH", ok: !!rgPath,
  detail: rgPath ? `${rgPath} — ${version}` : "not found",
  ...(rgPath ? {} : { fix: installCommand(), cost: "every `rg` search the skills run through Bash fails with `rg: command not found`; the built-in Grep tool keeps working on the bundled binary" }),
});
if (rgPath) checks.push({
  id: "pcre2", label: "PCRE2 in ripgrep", ok: pcre2,
  detail: pcre2 ? run([rgPath, "--pcre2-version"]).out.split("\n")[0] : "not compiled in",
  ...(pcre2 ? {} : { fix: "install a ripgrep build with PCRE2 (the distribution packages and the GitHub release binaries carry it)", cost: "the prose gate's passive-voice rule (`rg -P` with a lookahead) cannot run; every other rule is plain regex" }),
});

// 2. the setting at each scope
const userSettings = readSettings(userPath);
const project = readSettings(projectPath) ?? {};
const userValue = userSettings?.env?.[SETTING];
const projectValue = project.env?.[SETTING];
const envValue = process.env[SETTING];
const scopeLine = [
  `user (${userPath}): ${userValue === undefined ? "unset" : JSON.stringify(userValue)}`,
  `project (${projectPath}): ${projectValue === undefined ? "unset" : JSON.stringify(projectValue)}`,
  `this shell: ${envValue === undefined ? "unset" : JSON.stringify(envValue)}`,
].join("; ");

// 3. what to write
let action: "set" | "already" | "user-scope" | "skip-no-rg" | "project-other" = "skip-no-rg";
if (rgPath) {
  if (userValue !== undefined) action = "user-scope";
  else if (projectValue === "0") action = "already";
  else if (projectValue !== undefined) action = "project-other";
  else action = "set";
}
const grepToolDetail =
  action === "set" ? (dryRun ? `would set ${SETTING}=0 in the project settings (--dry-run)` : `${SETTING}=0 written to the project settings — the Grep tool uses ${rgPath}`)
  : action === "already" ? `${SETTING}=0 already set in the project settings — the Grep tool uses ${rgPath}`
  : action === "user-scope" ? `${SETTING}=${JSON.stringify(userValue)} set at user scope — left as it is (the user scope wins; edit ${userPath} to change it)`
  : action === "project-other" ? `${SETTING}=${JSON.stringify(projectValue)} set in the project settings — left as it is (remove the key to let /setup manage it)`
  : "left unset — the Grep tool keeps the bundled ripgrep, since there is no system ripgrep to point it at";
checks.push({ id: "grep-tool", label: "Grep tool binary", ok: rgPath ? action !== "project-other" : true, detail: `${grepToolDetail}. Scopes — ${scopeLine}` });

if (action === "set" && !dryRun) {
  const next: Settings = { ...project, env: { ...(project.env ?? {}), [SETTING]: "0" } };
  mkdirSync(dirname(projectPath), { recursive: true });
  writeFileSync(projectPath, JSON.stringify(next, null, 2) + "\n");
}

// 4. the Bash grant the searches need — setup-permissions.ts merges it from the example; report only
const allow = (readSettings(projectPath)?.permissions?.allow ?? []);
const granted = allow.includes(GRANT) || allow.includes("Bash(rg:*)");
checks.push({
  id: "grant", label: `${GRANT} in project permissions`, ok: granted,
  detail: granted ? "present" : "absent",
  ...(granted ? {} : { fix: "run /sa-skills:setup (setup-permissions.ts merges it from settings.json.example)", cost: "every `rg` search the skills run prompts for permission, and the friction pushes the model back to grep" }),
});

// ---- report
if (json) {
  console.log(JSON.stringify({ rg: rgPath, version, pcre2, action, projectPath, userPath, checks }, null, 2));
} else {
  console.log("ripgrep");
  for (const c of checks) {
    console.log(`  ${c.ok ? "✅" : "⬜"} ${c.label}: ${c.detail}`);
    if (c.cost) console.log(`       without it: ${c.cost}`);
    if (c.fix) console.log(`       fix: ${c.fix}`);
  }
}
process.exit(strict && !rgPath ? 1 : 0);
