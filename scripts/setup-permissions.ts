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
// Hook merging (v3.14.1+): the plugin's settings.json.example carries
// real hook entries that the merger installs idempotently into the
// user's settings.json. Each sa-skills hook is identified by a marker
// substring inside its `command` field (see SA_SKILLS_HOOK_MARKERS
// below). The merge is per-marker idempotent: an existing entry whose
// `hooks[].command` already contains the matching marker is recognized
// as already present and skipped, even when the user has multiple
// sa-skills hooks installed (v3.19.0+). Users may add unrelated hooks
// under the same matcher; those are preserved verbatim.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve, join } from "path";

// --- Platform-aware hook command resolution (v3.22.0+) -------------------
//
// The plugin ships three native wrappers under `hooks/`:
//   - route-architecture-docs.sh   (Linux, macOS, WSL, Git Bash)
//   - route-architecture-docs.cmd  (Windows native cmd.exe)
//   - route-architecture-docs.ps1  (PowerShell / pwsh on any OS)
//
// Each wrapper resolves its own directory and invokes
// `bun route-architecture-docs.ts`, so we sidestep `~` expansion entirely
// (cmd.exe and PowerShell do NOT expand `~`; only POSIX shells do). Setup
// detects the runtime OS and writes the absolute path to the matching
// wrapper into the user's settings.json. No `~`, no `sh` prefix on
// Windows, no environment-variable acrobatics.
//
// Plugin root detection: this script lives at
// `<plugin-root>/scripts/setup-permissions.ts`. `import.meta.dir` resolves
// to `<plugin-root>/scripts/`; one `dirname()` up gets the plugin root,
// and the wrappers live at `<plugin-root>/hooks/`.
const SCRIPT_DIR = import.meta.dir;
const PLUGIN_ROOT = dirname(SCRIPT_DIR);
const HOOKS_DIR = resolve(PLUGIN_ROOT, "hooks");

function resolveHookCommand(): string {
  if (process.platform === "win32") {
    // cmd.exe wrapper — universally available on Windows. Quoting the
    // path with double-quotes lets the absolute path contain spaces (e.g.
    // `C:\Users\Some Name\.claude\plugins\...`).
    const cmdPath = join(HOOKS_DIR, "route-architecture-docs.cmd");
    return `cmd /c "${cmdPath}"`;
  }
  // POSIX path. The wrapper carries an exec bit and a `#!/usr/bin/env sh`
  // shebang, but we prefix `sh` explicitly to be robust against harnesses
  // that strip the exec bit on copy or that invoke the command via
  // `child_process.spawn` without a shell.
  const shPath = join(HOOKS_DIR, "route-architecture-docs.sh");
  return `sh ${shPath}`;
}

const RESOLVED_HOOK_COMMAND = resolveHookCommand();

function describePlatform(): string {
  if (process.platform === "win32") return "Windows (cmd.exe wrapper)";
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
// as installed — a Linux user who has the .sh wrapper does not need
// the .cmd added (and the converse on Windows). Cross-platform users
// who switch OSes are handled by the removal pass below: their stale
// wrapper for the other OS gets swept and the current-OS wrapper is
// installed in the same run.
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
const SA_SKILLS_HOOK_REMOVAL_MARKERS: ReadonlyArray<Marker> = [
  "header-cli.ts session-log add",                    // v3.14.1 PostToolUse editlog (retired v3.19.1)
  ["sh ~", "route-architecture-docs.sh"],             // v3.19.0 .sh+tilde form (retired v3.22.0)
  ["bun ~", "route-architecture-docs.ts"],            // v3.21.0 .ts+tilde form (retired v3.22.0)
];

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

// --- Rewrite sa-skills hook commands to the platform-resolved form ------
//
// The example file carries the canonical Linux/macOS form for documentation
// (`bun ~/.claude/plugins/.../hooks/route-architecture-docs.ts`). For the
// actual install on the current OS, swap that for the platform-specific
// wrapper command with an absolute path — no `~` expansion required.
//
// Any sa-skills hook command in the example (current or any legacy form)
// is rewritten. Non-sa-skills hooks under the same matcher pass through
// unchanged.
function rewriteSaSkillsHookCommands(s: Settings): { rewritten: number } {
  let rewritten = 0;
  if (!s.hooks) return { rewritten };
  const SA_SKILLS_FILE_TOKENS = [
    "route-architecture-docs.ts",
    "route-architecture-docs.sh",
    "route-architecture-docs.cmd",
    "route-architecture-docs.ps1",
  ];
  for (const event of Object.keys(s.hooks)) {
    const entries = s.hooks[event];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const cmds = entry.hooks ?? [];
      for (const cmd of cmds) {
        if (typeof cmd.command !== "string") continue;
        if (SA_SKILLS_FILE_TOKENS.some((tok) => cmd.command!.includes(tok))) {
          if (cmd.command !== RESOLVED_HOOK_COMMAND) {
            cmd.command = RESOLVED_HOOK_COMMAND;
            rewritten++;
          }
        }
      }
    }
  }
  return { rewritten };
}

rewriteSaSkillsHookCommands(example);

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

// --- merge permissions.allow (array union, dedup, user entries first) ---
const userAllow: string[] = user.permissions?.allow ?? [];
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
        if (typeof cmd.command === "string" && commandMatchesRemovalMarker(cmd.command)) {
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

// --- assemble merged object, preserving user's other top-level keys ---
const merged: Settings = { ...user };
if (Object.keys(mergedMarketplaces).length > 0) {
  merged.extraKnownMarketplaces = mergedMarketplaces;
}
if (Object.keys(mergedPlugins).length > 0) {
  merged.enabledPlugins = mergedPlugins;
}
if (Object.keys(mergedHooks).length > 0) {
  merged.hooks = mergedHooks;
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
console.log(`Hook command: ${RESOLVED_HOOK_COMMAND}`);
console.log("");
console.log(
  `Permissions:  added ${permissionsAdded.length}  ·  already present ${permissionsKept.length}`
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
    "   These hooks shipped in an earlier sa-skills version and have been retired. They were a no-op in practice (see v3.19.1 release notes); the removal is safe."
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
