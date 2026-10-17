/**
 * Verify that every text source file in the repo is genuinely text.
 *
 * Added after the v6.6.0 release, where a generated TypeScript file carried
 * three literal NUL (0x00) bytes inside template-literal separators. NUL is
 * legal JavaScript, so `tsc` and every test passed — the defect surfaced only
 * as git flagging the file binary in the release diff. This check makes that
 * class of defect fail `bun run check` instead of reaching a release.
 *
 * Rule: a text file may contain any byte except C0 control characters other
 * than TAB (0x09), LF (0x0A), and CR (0x0D), and except DEL (0x7F). Escape
 * sequences in source (e.g. the string "\u0000") are fine — only raw bytes
 * are scanned.
 *
 * Usage:
 *   bun scripts/check-text-encoding.ts    # exits 1 if any file has a violation
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, resolve } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");

const TEXT_EXTENSIONS = new Set([
  ".ts", ".js", ".mjs", ".cjs", ".json", ".md", ".txt", ".yml", ".yaml",
  ".sh", ".html", ".css", ".sql", ".mmd", ".mermaid",
]);

const SKIP_DIRS = new Set([".git", "node_modules", "dist", ".bun"]);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(full);
    } else if (st.isFile() && TEXT_EXTENSIONS.has(extensionOf(name))) {
      yield full;
    }
  }
}

function isForbidden(byte: number): boolean {
  return (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) || byte === 0x7f;
}

let violations = 0;
let filesScanned = 0;

for (const file of walk(REPO_ROOT)) {
  filesScanned++;
  const data = readFileSync(file);
  let line = 1;
  let col = 1;
  const reported = new Set<number>();
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (isForbidden(byte)) {
      violations++;
      // Report each distinct byte value once per file to keep output short.
      if (!reported.has(byte)) {
        reported.add(byte);
        const rel = relative(REPO_ROOT, file).replace(/\\/g, "/");
        const hex = "0x" + byte.toString(16).padStart(2, "0").toUpperCase();
        console.error(`${rel}:${line}:${col} — forbidden control byte ${hex}`);
      }
    }
    if (byte === 0x0a) {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
}

if (violations > 0) {
  console.error(
    `\n❌ ${violations} forbidden control byte(s) found across the files listed above.\n` +
      `Raw control bytes make git treat a source file as binary and usually mean a\n` +
      `write went wrong. Replace them with the intended character or an escape\n` +
      `sequence (e.g. "\\u0000" in source code).`
  );
  process.exit(1);
}

console.log(`✅ text-encoding check passed (${filesScanned} files scanned)`);
