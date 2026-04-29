#!/usr/bin/env bun
// scripts/remove-glob.ts
// Usage: bun [plugin_dir]/scripts/remove-glob.ts <glob-pattern> [<glob-pattern>...]
//
// Deletes files matching one or more glob patterns. Equivalent to POSIX
// `rm -f <glob>` with shell glob expansion, but cross-platform: works on
// Linux, macOS, Windows native (cmd / PowerShell), WSL, and Git Bash.
// Missing files are ignored silently (idempotent, like `rm -f`).
//
// Used by architecture-compliance Step 3.2.1 to clean up old contract files
// before regenerating, and by any other skill that needs glob-based file
// deletion without depending on a POSIX shell. The only required permission
// grant is `Bash(bun *)`.
//
// Globs are evaluated relative to the current working directory by Bun's
// built-in `Glob.scanSync()` (no extra dependency required). Patterns
// support standard glob syntax (`*`, `**`, `?`, `[abc]`).
//
// Reports a one-line summary to stdout: "removed N file(s) (K patterns)".
// Exits 0 on success even when zero files match (idempotent). Exits 1 only
// when an unlinkSync raises a non-ENOENT error (e.g. permission denied).

import { unlinkSync } from "fs";
import { Glob } from "bun";

const patterns = process.argv.slice(2);

if (patterns.length === 0) {
  console.error("usage: remove-glob.ts <glob-pattern> [<glob-pattern>...]");
  process.exit(1);
}

let removed = 0;
let errors = 0;

for (const pattern of patterns) {
  const glob = new Glob(pattern);
  for (const match of glob.scanSync(".")) {
    try {
      unlinkSync(match);
      removed++;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") continue; // race / already gone — fine
      console.error(`✘ ${match}: ${e.message}`);
      errors++;
    }
  }
}

console.log(`removed ${removed} file(s) (${patterns.length} pattern${patterns.length === 1 ? "" : "s"})`);
if (errors > 0) process.exit(1);
