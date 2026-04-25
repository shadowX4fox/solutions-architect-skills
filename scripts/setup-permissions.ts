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
// Hook merging (v3.14.1+): the plugin's settings.json.example carries a
// real `hooks.PostToolUse[Write|Edit]` block that records every doc
// edit into the session editlog. The merge is idempotent: an existing
// PostToolUse entry whose `hooks[].command` already contains the
// substring `header-cli.ts session-log add` is recognized as already
// present and skipped. Users may add unrelated hooks under the same
// matcher; those are preserved verbatim.

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

const SA_SKILLS_HOOK_MARKER = "header-cli.ts session-log add";

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

// --- merge enabledPlugins (object merge, user wins) ---
const userPlugins = user.enabledPlugins ?? {};
const examplePlugins = example.enabledPlugins ?? {};
const mergedPlugins: Record<string, unknown> = { ...userPlugins };
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

// --- merge hooks (event-keyed, idempotent on sa-skills marker) ---
function entryContainsSaSkillsCommand(entry: HookEntry): boolean {
  return (entry.hooks ?? []).some(
    (h) => typeof h.command === "string" && h.command.includes(SA_SKILLS_HOOK_MARKER),
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
        if (cmd.command.includes(SA_SKILLS_HOOK_MARKER) &&
            (target.hooks ?? []).some((h) => typeof h.command === "string" && h.command.includes(SA_SKILLS_HOOK_MARKER))) {
          continue;
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
  `Hooks:        added ${hooksAdded}  ·  already present ${hooksKept}`
);

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
