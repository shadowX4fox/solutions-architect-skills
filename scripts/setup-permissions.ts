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
import { dirname } from "path";

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

// Each entry uniquely identifies one sa-skills hook by a substring of
// its installed `command` field. Order does not matter; matching is by
// substring containment.
const SA_SKILLS_HOOK_MARKERS: ReadonlyArray<string> = [
  "route-architecture-docs.sh",    // v3.19.0+ UserPromptSubmit ARCHITECTURE.md router
];

// Removal markers — hooks shipped in earlier sa-skills versions that have
// been retired. On every /setup run, any user-side hook entry whose
// `command` contains one of these substrings is stripped from
// settings.json (idempotent; removed entries are reported as cleaned).
//
// v3.19.1: the v3.14.1 PostToolUse editlog tracker
// (`header-cli.ts session-log add`) silently no-op'd because it relied on
// `$TOOL_INPUT_FILE_PATH`, which Claude Code does not export. The hook
// and the editlog feature are gone; this entry sweeps stale installs.
const SA_SKILLS_HOOK_REMOVAL_MARKERS: ReadonlyArray<string> = [
  "header-cli.ts session-log add", // v3.14.1 PostToolUse editlog tracker (retired v3.19.1)
];

function findMarkerForCommand(command: string): string | null {
  for (const m of SA_SKILLS_HOOK_MARKERS) {
    if (command.includes(m)) return m;
  }
  return null;
}

function commandMatchesRemovalMarker(command: string): boolean {
  for (const m of SA_SKILLS_HOOK_REMOVAL_MARKERS) {
    if (command.includes(m)) return true;
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

const userHooks: HooksBlock = user.hooks ?? {};
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
            (h) => typeof h.command === "string" && h.command.includes(cmdMarker),
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

// --- sweep retired sa-skills hooks (idempotent removal pass) ---
const removedHooks: Array<{ event: string; command: string }> = [];
for (const [event, entries] of Object.entries(mergedHooks)) {
  if (!Array.isArray(entries)) continue;
  const filteredEntries: HookEntry[] = [];
  for (const entry of entries) {
    const cmds = entry.hooks ?? [];
    const keptCmds: HookCommand[] = [];
    for (const cmd of cmds) {
      if (typeof cmd.command === "string" && commandMatchesRemovalMarker(cmd.command)) {
        removedHooks.push({ event, command: cmd.command });
        continue;
      }
      keptCmds.push(cmd);
    }
    if (keptCmds.length === 0) continue;
    filteredEntries.push({ ...entry, hooks: keptCmds });
  }
  if (filteredEntries.length === 0) {
    delete mergedHooks[event];
  } else {
    mergedHooks[event] = filteredEntries;
  }
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
