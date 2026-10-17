#!/usr/bin/env bun
// scripts/setup-permissions.ts
// Usage: bun scripts/setup-permissions.ts <example_path> <user_settings_path>
//
// Merges `permissions.allow`, `enabledPlugins`, `extraKnownMarketplaces`,
// and `hooks` from the plugin's settings.json.example into the user's
// .claude/settings.json. Non-destructive: existing user entries are
// preserved; only missing entries are added. `//`-prefixed comment keys
// in the example are stripped.
//
// The routing hook is the plugin's (8.100.1): hooks/hooks.json declares it with ${CLAUDE_PLUGIN_ROOT},
// which Claude Code resolves to the installed version on every load. Up to 8.100.0 this script wrote
// the absolute path of <plugin-root>/hooks/route-architecture-docs.sh into the project's settings —
// a versioned cache directory — and recognized any command naming the wrapper as "already present",
// so every plugin update left the project on a stale path that /setup never corrected. Every
// sa-skills routing hook in the user's settings is now swept (see the removal markers below); the
// example carries no hooks. Users may keep unrelated hooks; those are preserved verbatim.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";

// --- Windows without Git Bash: the PowerShell hook (8.100.1) ----------------------------------------
//
// The plugin's hook runs `sh`, which exists on Linux, macOS, WSL and Windows with Git Bash — the shell
// Claude Code runs hooks through there. Git for Windows is optional, though: without it hooks run in
// PowerShell, where there is no `sh`. On that machine alone /setup writes the .ps1 wrapper with
// `"shell": "powershell"`, by the path of the marketplace clone — which `claude plugin marketplace update`
// refreshes in place, so it never names a version that an update removed. `SA_HOOK_SHELL=powershell|sh`
// overrides the detection (tests, or a machine the detection gets wrong).
const MARKETPLACE = "shadowx4fox-solution-architect-marketplace";
function hasGitBash(): boolean {
  const env = process.env.CLAUDE_CODE_GIT_BASH_PATH;
  if (env && existsSync(env)) return true;
  const git = Bun.which("git");
  if (git && existsSync(join(dirname(dirname(git)), "bin", "bash.exe"))) return true;
  const pf = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Programs")];
  return pf.some((d) => !!d && existsSync(join(d, "Git", "bin", "bash.exe")));
}
const HOOK_SHELL = process.env.SA_HOOK_SHELL === "powershell" || process.env.SA_HOOK_SHELL === "sh"
  ? process.env.SA_HOOK_SHELL
  : process.platform === "win32" && !hasGitBash() ? "powershell" : "sh";
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
const PS1_PATH = join(CLAUDE_DIR, "plugins", "marketplaces", MARKETPLACE, "hooks", "route-architecture-docs.ps1");
const PS1_HOOK = HOOK_SHELL === "powershell"
  ? { type: "command", shell: "powershell", command: `& '${PS1_PATH.replace(/'/g, "''")}'` }
  : null;

function describePlatform(): string {
  if (HOOK_SHELL === "powershell") return `${process.platform === "win32" ? "Windows without Git Bash" : process.platform} (PowerShell wrapper)`;
  if (process.platform === "win32") return "Windows (sh wrapper via Git Bash)";
  if (process.platform === "darwin") return "macOS (sh wrapper)";
  if (process.platform === "linux") return "Linux (sh wrapper)";
  return `${process.platform} (sh wrapper — POSIX fallback)`;
}

const [examplePath, userPath] = process.argv.slice(2);

if (!examplePath || !userPath) {
  console.error("Usage: bun scripts/setup-permissions.ts <example_path> <user_settings_path>");
  process.exit(2);
}

if (!existsSync(examplePath)) {
  console.error(`❌ Example file not found: ${examplePath}`);
  process.exit(1);
}

function stripComments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripComments);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith("//")) continue;
      out[k] = stripComments(v);
    }
    return out;
  }
  return value;
}

type HookCommand = { type?: string; command?: string; [k: string]: unknown };
type HookEntry = {
  matcher?: string;
  if?: string;
  hooks?: HookCommand[];
  [k: string]: unknown;
};
type HooksBlock = { [event: string]: HookEntry[] | undefined };

type Settings = {
  permissions?: { allow?: string[]; deny?: string[]; [k: string]: unknown };
  enabledPlugins?: Record<string, unknown>;
  extraKnownMarketplaces?: Record<string, unknown>;
  hooks?: HooksBlock;
  [k: string]: unknown;
};

// Install markers — substring (or substring-array AND-match) that
// identifies the *currently shipped* sa-skills hook. Used to decide
// "already present" during the install pass so re-running /setup does
// not duplicate the entry. Each entry is either a single substring or
// an array of substrings that must all appear in the command.
//
// v3.22.0+: any of the three native wrappers (.sh, .cmd, .ps1) counts
// as installed, but dedup is *per marker*: a user carrying only the
// .ps1 wrapper still gets the .sh command added. The one form that is
// swept rather than kept is the v3.22.0–v6.9.0 Windows `cmd /c "...cmd"`
// command (see the removal markers below), because it never worked
// under Git Bash. A hand-wired `cmd //c "...cmd"` is left alone.
type Marker = string | ReadonlyArray<string>;

const SA_SKILLS_HOOK_INSTALL_MARKERS: ReadonlyArray<Marker> = [
  "route-architecture-docs.sh",   // POSIX wrapper (Linux/macOS/WSL/Git Bash)
  "route-architecture-docs.cmd",  // Windows cmd wrapper
  "route-architecture-docs.ps1",  // PowerShell wrapper
];

// Removal markers — hooks shipped in earlier sa-skills versions that
// have been retired. On every /setup run, any user-side hook entry
// whose `command` matches one of these markers is stripped from
// settings.json (idempotent; removed entries are reported as cleaned).
//
// Each marker is either a single substring or an array of substrings
// that ALL must appear in the command (compound AND-match). Compound
// markers let us sweep the v3.19.0 / v3.21.0 `~`-prefixed forms without
// false-matching the v3.22.0+ absolute-path wrapper, which still ends
// in `route-architecture-docs.sh` on POSIX.
//
// v3.19.1: the v3.14.1 PostToolUse editlog tracker
// (`header-cli.ts session-log add`) silently no-op'd because it relied
// on `$TOOL_INPUT_FILE_PATH`, which Claude Code does not export. The
// hook and the editlog feature are gone; this entry sweeps stale
// installs.
//
// v3.22.0: the v3.19.0 POSIX shell hook (invoked as
// `sh ~/.claude/plugins/.../route-architecture-docs.sh`) and the
// v3.21.0 Bun-direct hook (invoked as
// `bun ~/.claude/plugins/.../route-architecture-docs.ts`) are both
// retired. They depended on `~` expansion, which is a POSIX-shell
// feature with no equivalent on Windows native (cmd / PowerShell).
// The new wrappers receive an absolute path with no leading `~` and
// no leading `sh ` / `bun ` prefix referencing the script directly,
// so the compound markers below distinguish the legacy forms cleanly.
//
// v6.9.1: the v3.22.0–v6.9.0 Windows form `cmd /c "<abs>\...\.cmd"` is
// retired. Claude Code runs hooks through Git Bash on Windows, whose
// MSYS layer rewrites `/c` to `C:\`, so cmd.exe started interactively
// and echoed the hook's stdin JSON into the model's context instead of
// the payload. `cmd //c` (the MSYS escape) is not matched and survives.
const SA_SKILLS_HOOK_REMOVAL_MARKERS: ReadonlyArray<Marker> = [
  "header-cli.ts session-log add",                    // v3.14.1 PostToolUse editlog (retired v3.19.1)
  ["sh ~", "route-architecture-docs.sh"],             // v3.19.0 .sh+tilde form (retired v3.22.0)
  ["bun ~", "route-architecture-docs.ts"],            // v3.21.0 .ts+tilde form (retired v3.22.0)
  ["cmd /c", "route-architecture-docs.cmd"],          // v3.22.0–v6.9.0 win32 cmd form (retired v6.9.1)
  // 8.100.1 — the routing hook is declared by the plugin (hooks/hooks.json, ${CLAUDE_PLUGIN_ROOT}). Any
  // settings entry naming a wrapper — the absolute cache path /setup wrote, the marketplace-clone path,
  // a hand-wired .cmd / .ps1 — would run it a second time, or from a stale version.
  "route-architecture-docs.sh",
  "route-architecture-docs.cmd",
  "route-architecture-docs.ps1",
];

// Retired permission grants — exact `permissions.allow` entries that named
// something the plugin no longer ships. Swept from the user's settings on
// every /setup run, before the merge, and reported under "retired". A grant
// that Claude Code cannot match is inert, so removal changes nothing at
// runtime; it only keeps settings.json honest.
//
// - The nine per-domain checklist validators were folded into one
//   config-driven `domain-validator` (development-validator stays). Both the
//   role-scoped form and the pre-role flat form are swept.
// - `//tmp/architecture-explorer/**` covered the v3.14.1 editlog, which is
//   gone.
const RETIRED_VALIDATOR_STEMS = [
  "business-continuity", "cloud", "data-ai", "enterprise", "integration",
  "platform", "process", "security", "sre",
] as const;
const SA_SKILLS_PERMISSION_REMOVALS: ReadonlySet<string> = new Set([
  ...RETIRED_VALIDATOR_STEMS.map((s) => `Agent(sa-skills:validators:${s}-validator)`),
  ...RETIRED_VALIDATOR_STEMS.map((s) => `Agent(sa-skills:${s}-validator)`),
  "Read(//tmp/architecture-explorer/**)",
  "Write(//tmp/architecture-explorer/**)",
  // 8.31.0 — `section-generator` is retired (architecture-docs Step 5 writes in-session again).
  "Agent(sa-skills:generators:section-generator)",
  // 8.100.3 — `architecture-editor` and its `section-writer` are removed (suspended since 8.86.0; Workflow 1 writes in
  // session or through `segment-runner`).
  "Agent(sa-skills:generators:section-writer)",
  // 8.71.0 — the two builders are deleted: the explorer is `explorer-cli.ts` (8.3.0) and the handoff
  // payloads are `handoff-prepare.js` (8.23.0); the plugin is Bun-only, so no fallback is needed.
  "Agent(sa-skills:builders:architecture-explorer)",
  "Agent(sa-skills:builders:handoff-context-builder)",
  // 8.125.0 — the analysis agent ships in the sa-analysis plugin (a dependency of sa-skills); the grant is
  // sa-analysis-scoped in the example.
  "Agent(sa-skills:reviewers:architecture-analysis-agent)",
  // 8.128.0 — the delivery skills and their six agents ship in the sa-delivery plugin (a dependency of sa-skills); the
  // grants are sa-delivery-scoped in the example.
  "Agent(sa-skills:generators:ekonte-generator)",
  "Agent(sa-skills:generators:settei-generator)",
  "Agent(sa-skills:generators:seam-generator)",
  "Agent(sa-skills:generators:cutsheet-generator)",
  "Agent(sa-skills:generators:handoff-asset-generator)",
  "Agent(sa-skills:generators:docs-export-generator)",
  // 8.96.0 — the ADR skill and its three agents ship in the sa-records plugin (a dependency of sa-skills): the grants
  // are sa-records-scoped in the example, and the sa-skills-scoped ones name agents sa-skills no longer carries.
  "Agent(sa-skills:generators:adr-writer)",
  "Agent(sa-skills:generators:adr-coverage-generator)",
  "Agent(sa-skills:generators:coverage-renderer)",
  // 8.97.0 — the plugin was renamed sa-adr → sa-records when TDR joined it.
  "Agent(sa-adr:generators:adr-writer)",
  "Agent(sa-adr:generators:adr-coverage-generator)",
  "Agent(sa-adr:generators:coverage-renderer)",
  // 8.99.0 — compliance ships in the sa-compliance plugin (its own cadence): its agents are sa-compliance-scoped.
  "Agent(sa-skills:generators:compliance-generator)",
  "Agent(sa-skills:validators:domain-validator)",
  "Agent(sa-skills:validators:development-validator)",
  // sa-compliance 2.0.0 — the contract is written by code from the judge's verdicts; the generator agent is gone.
  "Agent(sa-compliance:generators:compliance-generator)",
]);

// 8.118.3 — file permission rules are `Read(path)` and `Edit(path)` only: Claude Code ignores `Write(path)` and
// `Glob(path)` and warns at startup (`Read` covers Read, Glob and Grep; `Edit` covers Edit and Write). Up to 8.118.2
// the example shipped eleven of them, so the writes they named prompted. Every such rule in the user's settings is
// rewritten — the plugin's and the user's own alike, since none of them works — before the merge, so the example's
// converted entries dedupe against it. A bare `Write` or `Glob` (the whole tool) is a valid grant and is left alone.
const FILE_RULE_MIGRATION: Readonly<Record<string, string>> = { Write: "Edit", Glob: "Read" };
function migrateFileRule(entry: string): string {
  const m = /^(Write|Glob)\((.+)\)$/.exec(entry);
  return m ? `${FILE_RULE_MIGRATION[m[1]]}(${m[2]})` : entry;
}

function commandMatchesMarker(command: string, marker: Marker): boolean {
  if (typeof marker === "string") return command.includes(marker);
  return marker.every((part) => command.includes(part));
}

function findMarkerForCommand(command: string): Marker | null {
  for (const m of SA_SKILLS_HOOK_INSTALL_MARKERS) {
    if (commandMatchesMarker(command, m)) return m;
  }
  return null;
}

function commandMatchesRemovalMarker(command: string): boolean {
  for (const m of SA_SKILLS_HOOK_REMOVAL_MARKERS) {
    if (commandMatchesMarker(command, m)) return true;
  }
  return false;
}

let rawExample: unknown;
try {
  rawExample = JSON.parse(readFileSync(examplePath, "utf8"));
} catch (err) {
  console.error(`❌ Failed to parse ${examplePath} as JSON: ${(err as Error).message}`);
  process.exit(1);
}
const example = stripComments(rawExample) as Settings;

let user: Settings = {};
const userExistedBefore = existsSync(userPath);
if (userExistedBefore) {
  try {
    user = JSON.parse(readFileSync(userPath, "utf8")) as Settings;
  } catch (err) {
    console.error(`❌ Failed to parse ${userPath} as JSON: ${(err as Error).message}`);
    console.error(`   Fix the syntax error or remove the file and rerun /setup.`);
    process.exit(1);
  }
} else {
  mkdirSync(dirname(userPath), { recursive: true });
}

// --- sweep retired grants, then merge permissions.allow (array union, dedup, user entries first) ---
const rawUserAllow: string[] = user.permissions?.allow ?? [];
const removedPermissions: string[] = rawUserAllow.filter((entry) => SA_SKILLS_PERMISSION_REMOVALS.has(entry));
const migratedPermissions: Array<{ from: string; to: string }> = [];
const userAllow: string[] = [];
for (const entry of rawUserAllow) {
  if (SA_SKILLS_PERMISSION_REMOVALS.has(entry)) continue;
  const to = migrateFileRule(entry);
  if (to !== entry) migratedPermissions.push({ from: entry, to });
  if (!userAllow.includes(to)) userAllow.push(to);
}
const exampleAllow: string[] = example.permissions?.allow ?? [];

const allowSet = new Set(userAllow);
const permissionsAdded: string[] = [];
const permissionsKept: string[] = [];
for (const entry of exampleAllow) {
  if (allowSet.has(entry)) {
    permissionsKept.push(entry);
  } else {
    permissionsAdded.push(entry);
    allowSet.add(entry);
  }
}
const mergedAllow = [...userAllow, ...permissionsAdded];

// --- merge enabledPlugins (object merge, user wins, with legacy-name migration) ---
//
// v3.14.3 — the plugin's marketplace name is `sa-skills`, but pre-v3.14.3
// versions of settings.json.example registered it under the older name
// `solutions-architect-skills`. Claude Code resolves enabledPlugins keys
// against marketplace.json's `plugins[].name`, so a stale legacy key
// produces "Plugin not found in marketplace" on `/reload-plugins`.
//
// On merge, rename any `solutions-architect-skills@<marketplace>` key in
// the user's settings to `sa-skills@<marketplace>`, preserving its boolean
// value. Then run the normal object merge against the example. The
// migration is idempotent — re-running /setup on already-migrated
// settings is a no-op.
const userPlugins = user.enabledPlugins ?? {};
const LEGACY_PLUGIN_NAME = "solutions-architect-skills";
const NEW_PLUGIN_NAME = "sa-skills";
const migratedPlugins: Record<string, unknown> = {};
const pluginsMigrated: Array<{ from: string; to: string }> = [];
for (const [k, v] of Object.entries(userPlugins)) {
  const at = k.indexOf("@");
  if (at !== -1 && k.slice(0, at) === LEGACY_PLUGIN_NAME) {
    const renamed = `${NEW_PLUGIN_NAME}${k.slice(at)}`;
    if (renamed in migratedPlugins) {
      // User already had both keys — the new one wins; drop the legacy.
      pluginsMigrated.push({ from: k, to: renamed });
      continue;
    }
    migratedPlugins[renamed] = v;
    pluginsMigrated.push({ from: k, to: renamed });
  } else {
    migratedPlugins[k] = v;
  }
}

const examplePlugins = example.enabledPlugins ?? {};
const mergedPlugins: Record<string, unknown> = { ...migratedPlugins };
let pluginsAdded = 0;
let pluginsKept = 0;
for (const [k, v] of Object.entries(examplePlugins)) {
  if (k in mergedPlugins) {
    pluginsKept++;
  } else {
    mergedPlugins[k] = v;
    pluginsAdded++;
  }
}

// --- merge extraKnownMarketplaces (object merge, user wins) ---
const userMarketplaces = user.extraKnownMarketplaces ?? {};
const exampleMarketplaces = example.extraKnownMarketplaces ?? {};
const mergedMarketplaces: Record<string, unknown> = { ...userMarketplaces };
let marketplacesAdded = 0;
let marketplacesKept = 0;
for (const [k, v] of Object.entries(exampleMarketplaces)) {
  if (k in mergedMarketplaces) {
    marketplacesKept++;
  } else {
    mergedMarketplaces[k] = v;
    marketplacesAdded++;
  }
}

// --- merge hooks (event-keyed, idempotent on per-marker dedup) ---
function entryContainsSaSkillsCommand(entry: HookEntry): boolean {
  return (entry.hooks ?? []).some(
    (h) => typeof h.command === "string" && findMarkerForCommand(h.command) !== null,
  );
}

function commandAlreadyPresent(entry: HookEntry, command: string): boolean {
  return (entry.hooks ?? []).some((h) => h.command === command);
}

function entriesMatchByMatcher(a: HookEntry, b: HookEntry): boolean {
  return (a.matcher ?? "") === (b.matcher ?? "") && (a.if ?? "") === (b.if ?? "");
}

// --- sweep retired sa-skills hooks BEFORE merge (idempotent removal pass) ---
//
// The removal pass runs on the user's existing hooks first so legacy entries
// (v3.19.0 sh+tilde, v3.21.0 bun+tilde) are gone before the per-marker dedup
// in the merge would otherwise treat them as "already present" and block the
// install of the new wrapper-based command.
function sweepRetiredHooks(hooks: HooksBlock): {
  cleaned: HooksBlock;
  removed: Array<{ event: string; command: string }>;
} {
  const removed: Array<{ event: string; command: string }> = [];
  const cleaned: HooksBlock = {};
  for (const [event, entries] of Object.entries(hooks)) {
    if (!Array.isArray(entries)) continue;
    const filteredEntries: HookEntry[] = [];
    for (const entry of entries) {
      const cmds = entry.hooks ?? [];
      const keptCmds: HookCommand[] = [];
      for (const cmd of cmds) {
        if (typeof cmd.command === "string" && commandMatchesRemovalMarker(cmd.command) && !(PS1_HOOK && cmd.command === PS1_HOOK.command)) {
          removed.push({ event, command: cmd.command });
          continue;
        }
        keptCmds.push(cmd);
      }
      if (keptCmds.length === 0) continue;
      filteredEntries.push({ ...entry, hooks: keptCmds });
    }
    if (filteredEntries.length > 0) {
      cleaned[event] = filteredEntries;
    }
  }
  return { cleaned, removed };
}

const { cleaned: cleanedUserHooks, removed: removedHooks } = sweepRetiredHooks(user.hooks ?? {});
const userHooks: HooksBlock = cleanedUserHooks;
const exampleHooks: HooksBlock = example.hooks ?? {};
const mergedHooks: HooksBlock = { ...userHooks };
let hooksAdded = 0;
let hooksKept = 0;

for (const [event, exampleEntries] of Object.entries(exampleHooks)) {
  if (!Array.isArray(exampleEntries)) continue;
  const userEntries: HookEntry[] = Array.isArray(mergedHooks[event]) ? [...(mergedHooks[event] as HookEntry[])] : [];

  for (const exampleEntry of exampleEntries) {
    if (!entryContainsSaSkillsCommand(exampleEntry)) {
      // Not an sa-skills hook entry — fall back to whole-entry merge.
      const dup = userEntries.some((e) => JSON.stringify(e) === JSON.stringify(exampleEntry));
      if (dup) {
        hooksKept++;
        continue;
      }
      userEntries.push(exampleEntry);
      hooksAdded++;
      continue;
    }

    // Sa-skills hook entry — try to merge into an existing matcher.
    const target = userEntries.find((e) => entriesMatchByMatcher(e, exampleEntry));
    if (target) {
      target.hooks = target.hooks ?? [];
      let entryAdded = false;
      for (const cmd of exampleEntry.hooks ?? []) {
        if (typeof cmd.command !== "string") continue;
        if (commandAlreadyPresent(target, cmd.command)) continue;
        // Per-marker dedup: skip when this command's specific sa-skills
        // marker is already present in the target. With one marker this
        // matches the v3.14.1 behavior; with multiple markers (v3.19.0+)
        // it correctly distinguishes hooks so installing one does not
        // mask installation of the other.
        const cmdMarker = findMarkerForCommand(cmd.command);
        if (cmdMarker !== null) {
          const alreadyHasThisMarker = (target.hooks ?? []).some(
            (h) => typeof h.command === "string" && commandMatchesMarker(h.command, cmdMarker),
          );
          if (alreadyHasThisMarker) continue;
        }
        target.hooks.push(cmd);
        entryAdded = true;
      }
      if (entryAdded) hooksAdded++;
      else hooksKept++;
    } else {
      userEntries.push(exampleEntry);
      hooksAdded++;
    }
  }

  mergedHooks[event] = userEntries;
}

// Windows without Git Bash: the PowerShell hook, once (the sweep kept it when already exact).
if (PS1_HOOK) {
  const entries: HookEntry[] = Array.isArray(mergedHooks.UserPromptSubmit) ? mergedHooks.UserPromptSubmit : [];
  if (entries.some((e) => (e.hooks ?? []).some((h) => h.command === PS1_HOOK.command))) hooksKept++;
  else { entries.push({ hooks: [PS1_HOOK] }); hooksAdded++; }
  mergedHooks.UserPromptSubmit = entries;
}

// --- assemble merged object, preserving user's other top-level keys ---
const merged: Settings = { ...user };
if (Object.keys(mergedMarketplaces).length > 0) {
  merged.extraKnownMarketplaces = mergedMarketplaces;
}
if (Object.keys(mergedPlugins).length > 0) {
  merged.enabledPlugins = mergedPlugins;
}
// The sweep can empty the block (the sa-skills routing hook was the only one): drop the key then — keeping
// `...user` alone would write the swept hooks back (8.100.1 reported them retired and left them in place).
if (Object.keys(mergedHooks).length > 0) {
  merged.hooks = mergedHooks;
} else {
  delete merged.hooks;
}
merged.permissions = {
  ...(user.permissions ?? {}),
  allow: mergedAllow,
};

writeFileSync(userPath, JSON.stringify(merged, null, 2) + "\n", "utf8");

// --- detect legacy (pre-rename) grants so the user can clean up manually ---
const legacyGrants = mergedAllow.filter(
  (entry) => entry.includes("solutions-architect-skills:")
);

console.log(
  `✅ ${userExistedBefore ? "Merged" : "Created"} sa-skills settings in ${userPath}`
);
console.log("");
console.log(`Platform:     ${describePlatform()}`);
console.log(PS1_HOOK
  ? `Hook:         Windows without Git Bash — the plugin's sh hook cannot run here; settings get the PowerShell wrapper: ${PS1_HOOK.command}`
  : "Hook:         declared by the plugin — hooks/hooks.json runs ${CLAUDE_PLUGIN_ROOT}/hooks/route-architecture-docs.sh; nothing is written to settings");
console.log("");
console.log(
  `Permissions:  added ${permissionsAdded.length}  ·  already present ${permissionsKept.length}  ·  retired ${removedPermissions.length}  ·  rewritten ${migratedPermissions.length}`
);
console.log(
  `Marketplaces: added ${marketplacesAdded}  ·  already present ${marketplacesKept}`
);
console.log(
  `Plugins:      added ${pluginsAdded}  ·  already present ${pluginsKept}`
);
console.log(
  `Hooks:        added ${hooksAdded}  ·  already present ${hooksKept}  ·  retired ${removedHooks.length}`
);

if (removedHooks.length > 0) {
  console.log("");
  console.log(
    `🧹  Swept ${removedHooks.length} retired sa-skills hook${removedHooks.length === 1 ? "" : "s"}:`
  );
  for (const r of removedHooks) {
    console.log(`   - ${r.event}: ${r.command}`);
  }
  console.log(
    "   The routing hook now comes from the plugin itself (hooks/hooks.json), always at the installed version; a settings entry would run it twice or from a stale path. The removal is safe."
  );
}

if (removedPermissions.length > 0) {
  console.log("");
  console.log(
    `🧹  Swept ${removedPermissions.length} retired permission grant${removedPermissions.length === 1 ? "" : "s"}:`
  );
  for (const p of removedPermissions) console.log(`   - ${p}`);
  console.log(
    "   Each named an agent or path the plugin no longer ships (the per-domain validators became `domain-validator`). Claude Code could not match them, so removing them changes nothing at runtime."
  );
}

if (migratedPermissions.length > 0) {
  console.log("");
  console.log(
    `🔄  Rewrote ${migratedPermissions.length} file permission rule${migratedPermissions.length === 1 ? "" : "s"} Claude Code ignores:`
  );
  for (const m of migratedPermissions) console.log(`   - ${m.from} → ${m.to}`);
  console.log(
    "   File rules are Read(path) and Edit(path) only: Read covers Read, Glob and Grep; Edit covers Edit and Write. The old form was ignored (a warning at startup), so the writes it named prompted."
  );
}

if (pluginsMigrated.length > 0) {
  console.log("");
  console.log(
    `🔄  Migrated ${pluginsMigrated.length} legacy enabledPlugins entr${pluginsMigrated.length === 1 ? "y" : "ies"} (pre-v3.14.3 plugin name):`
  );
  for (const m of pluginsMigrated) {
    console.log(`   - "${m.from}" → "${m.to}"`);
  }
  console.log(
    `   The plugin's marketplace name is now \`sa-skills\` (it was registered under \`solutions-architect-skills\` before v3.14.3). The old key triggers a "Plugin not found in marketplace" error on /reload-plugins; renaming it fixes that.`
  );
}

if (permissionsAdded.length > 0) {
  console.log("");
  console.log("New permission grants added:");
  for (const p of permissionsAdded) console.log(`  + ${p}`);
}

if (legacyGrants.length > 0) {
  console.log("");
  console.log(
    `⚠️  Detected ${legacyGrants.length} legacy grant(s) referencing the old namespace (solutions-architect-skills:)`
  );
  console.log(
    "   These are safe to leave, but you can remove them manually for cleanliness:"
  );
  for (const g of legacyGrants) console.log(`   - ${g}`);
}
