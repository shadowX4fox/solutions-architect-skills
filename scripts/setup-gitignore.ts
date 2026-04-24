#!/usr/bin/env bun
// scripts/setup-gitignore.ts
// Usage: bun scripts/setup-gitignore.ts <project_cwd>
//
// Ensures the project's .gitignore contains the sa-skills baseline entries
// (exports/, /tmp/, CLAUDE.md). Line-level merge — existing entries and user
// additions are preserved; only missing entries are appended under a
// "# sa-skills" header. Idempotent.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const [projectCwd] = process.argv.slice(2);

if (!projectCwd) {
  console.error("Usage: bun scripts/setup-gitignore.ts <project_cwd>");
  process.exit(2);
}

const gitignorePath = join(projectCwd, ".gitignore");
const HEADER = "# sa-skills";
const MANAGED_ENTRIES = ["exports/", "/tmp/", "CLAUDE.md"];

function lineMatches(line: string, entry: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  return trimmed === entry || trimmed === `/${entry}` || `/${trimmed}` === entry;
}

const existed = existsSync(gitignorePath);
const current = existed ? readFileSync(gitignorePath, "utf8") : "";
const lines = current.length > 0 ? current.split("\n") : [];

const missing = MANAGED_ENTRIES.filter(
  (entry) => !lines.some((line) => lineMatches(line, entry))
);
const alreadyPresent = MANAGED_ENTRIES.filter(
  (entry) => lines.some((line) => lineMatches(line, entry))
);

let outcome: "Created" | "Appended" | "Unchanged";
if (missing.length === 0) {
  outcome = "Unchanged";
} else {
  const headerAlreadyPresent = lines.some((line) => line.trim() === HEADER);
  const appendedLines: string[] = [];
  if (!headerAlreadyPresent) appendedLines.push(HEADER);
  appendedLines.push(...missing);

  let next: string;
  if (!existed || current.length === 0) {
    next = appendedLines.join("\n") + "\n";
    outcome = "Created";
  } else {
    const separator = current.endsWith("\n") ? "\n" : "\n\n";
    next = current + separator + appendedLines.join("\n") + "\n";
    outcome = "Appended";
  }
  writeFileSync(gitignorePath, next, "utf8");
}

console.log(`✅ .gitignore: ${outcome}`);
console.log(`   Path: ${gitignorePath}`);
console.log(
  `   Entries: added ${missing.length}  ·  already present ${alreadyPresent.length}`
);
if (missing.length > 0) {
  for (const e of missing) console.log(`     + ${e}`);
}