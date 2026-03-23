#!/usr/bin/env bun
// This file is at: [plugin_dir]/skills/architecture-compliance/utils/resolve-plugin-dir.ts
// plugin_dir is exactly 3 directories up from here.
import { resolve } from "path";

const pluginDir = resolve(import.meta.dir, "..", "..", "..");
console.log(pluginDir);
