#!/usr/bin/env bun
// Replaces the chained `mkdir -p <dir> && date +%Y-%m-%d` shell command used
// by the architecture-dev-handoff orchestrator and handoff-generator sub-agent.
// Single bun call → covered by the project-wide `Bash(bun *)` permission grant,
// so users no longer see a permission prompt for the combined mkdir/date pattern.
import { mkdirSync } from "fs";
import { resolve } from "path";
import { getLocalDateString } from "../../architecture-compliance/utils/date-utils";

const target = process.argv[2];
if (!target) {
  console.error("usage: prepare-payload-dir.ts <absolute-path>");
  process.exit(1);
}

mkdirSync(resolve(target), { recursive: true });
console.log(getLocalDateString());
