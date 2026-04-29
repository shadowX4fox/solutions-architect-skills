#!/usr/bin/env bun
// scripts/today.ts
// Usage: bun [plugin_dir]/scripts/today.ts
//
// Prints today's date as YYYY-MM-DD in the local timezone, identical to
// `date +%Y-%m-%d` on POSIX. Replaces shell-out invocations across the
// plugin so date capture works on Linux, macOS, Windows native (cmd /
// PowerShell), WSL, and Git Bash without requiring a POSIX `date` binary.
//
// Backed by `getLocalDateString()` from architecture-compliance/utils/date-utils
// to keep timezone behavior consistent with the existing compliance pipeline
// (avoids the UTC shift that `new Date().toISOString().split('T')[0]` causes
// for UTC- timezones after midnight UTC).

import { getLocalDateString } from "../skills/architecture-compliance/utils/date-utils";

console.log(getLocalDateString());
