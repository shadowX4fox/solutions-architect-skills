/**
 * Verify the line counts in the architecture-docs Lazy-Load Contract table.
 *
 * That table is how the orchestrator decides what it can afford to load. Six of
 * its rows had drifted by up to 31%, and one guide had grown past the range the
 * table's own preamble claims — so the budget it advertises was not the budget
 * the files impose.
 *
 * Usage:
 *   bun scripts/check-lazyload-sizes.ts          # exits 1 if any row is stale
 *   bun scripts/check-lazyload-sizes.ts --fix    # rewrite the counts in place
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const SKILL_DIR = resolve(import.meta.dir, "..", "skills", "architecture-docs");
const SKILL_MD = join(SKILL_DIR, "SKILL.md");
const fix = process.argv.includes("--fix");

/** Rows whose "Size (lines)" cell names a single real file. */
const ROW_RE = /^\| `([^`]+)` \| ~([\d,]+)([^|]*)\|/;

/** Tolerance before a row counts as stale. */
const TOLERANCE = 0.05;

function countLines(absPath: string): number {
  return readFileSync(absPath, "utf-8").split(/\r?\n/).length;
}

function main(): void {
  const original = readFileSync(SKILL_MD, "utf-8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);

  const stale: string[] = [];
  let checked = 0;
  let maxActual = 0;

  const updated = lines.map((line) => {
    const m = line.match(ROW_RE);
    if (!m) return line;

    const [, relPath, claimedRaw, tail] = m;
    const abs = join(SKILL_DIR, relPath);
    if (!existsSync(abs)) return line;   // glob/placeholder rows

    const claimed = Number(claimedRaw.replace(/,/g, ""));
    const actual = countLines(abs);
    checked++;
    maxActual = Math.max(maxActual, actual);

    const drift = Math.abs(actual - claimed) / actual;
    if (drift <= TOLERANCE) return line;

    stale.push(
      `${relPath}: table says ~${claimed.toLocaleString()}, file is ${actual.toLocaleString()} ` +
      `(${((actual - claimed) / claimed * 100).toFixed(0)}%)`
    );
    // Preserve whatever trailing note the size cell carried.
    return line.replace(
      `| ~${claimedRaw}${tail}|`,
      `| ~${actual.toLocaleString()}${tail}|`,
    );
  });

  console.log(`checked ${checked} row(s) against real files; largest guide is ${maxActual.toLocaleString()} lines`);

  if (stale.length === 0) {
    console.log("✅ Lazy-Load Contract line counts are current.");
    return;
  }

  for (const s of stale) console.error(`❌ ${s}`);

  if (fix) {
    writeFileSync(SKILL_MD, updated.join(eol));
    console.log(`\n✅ Rewrote ${stale.length} row(s) in SKILL.md.`);
    return;
  }

  console.error(`\n${stale.length} stale row(s). Run: bun scripts/check-lazyload-sizes.ts --fix`);
  process.exit(1);
}

main();
