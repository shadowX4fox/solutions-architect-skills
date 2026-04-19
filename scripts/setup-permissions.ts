#!/usr/bin/env bun
// scripts/setup-permissions.ts
// Usage: bun scripts/setup-permissions.ts <example_path> <user_settings_path>
//
// Merges `permissions.allow`, `enabledPlugins`, and `extraKnownMarketplaces`
// from the plugin's settings.json.example into the user's .claude/settings.json.
// Non-destructive: existing user entries are preserved; only missing entries
// are added. `//`-prefixed comment keys in the example are stripped.

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

type Settings = {
  permissions?: { allow?: string[]; deny?: string[]; [k: string]: unknown };
  enabledPlugins?: Record<string, unknown>;
  extraKnownMarketplaces?: Record<string, unknown>;
  [k: string]: unknown;
};

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

// --- assemble merged object, preserving user's other top-level keys ---
const merged: Settings = { ...user };
if (Object.keys(mergedMarketplaces).length > 0) {
  merged.extraKnownMarketplaces = mergedMarketplaces;
}
if (Object.keys(mergedPlugins).length > 0) {
  merged.enabledPlugins = mergedPlugins;
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
