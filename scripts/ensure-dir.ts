#!/usr/bin/env bun
// scripts/ensure-dir.ts
// Usage: bun [plugin_dir]/scripts/ensure-dir.ts <path> [<path>...]
//
// Idempotently creates one or more directories (recursive, identical to
// POSIX `mkdir -p`) using Node's `mkdirSync(..., { recursive: true })`.
// Cross-platform: works on Linux, macOS, Windows native (cmd / PowerShell),
// WSL, and Git Bash. Replaces shell-out `mkdir -p` invocations across skill
// prose so the only required permission grant is `Bash(bun *)`.
//
// Exits 0 on success, 1 if any path could not be created.

import { mkdirSync } from "fs";
import { resolve } from "path";

const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error("usage: ensure-dir.ts <path> [<path>...]");
  process.exit(1);
}

let failed = 0;
for (const target of targets) {
  try {
    mkdirSync(resolve(target), { recursive: true });
  } catch (err) {
    console.error(`✘ ${target}: ${(err as Error).message}`);
    failed++;
  }
}

if (failed > 0) process.exit(1);
