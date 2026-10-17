// Usage: bun check-dir.ts <dir>
// Prints "Directory <dir>/ exists." if the path is a directory, otherwise prints nothing.
import { existsSync, statSync } from "fs";

const dir = process.argv[2];
if (!dir) process.exit(1);
if (existsSync(dir) && statSync(dir).isDirectory()) {
  console.log(`Directory ${dir}/ exists.`);
}
