/**
 * One-shot repair: lift the `## Prose Style` section out of the ```markdown
 * fence it was bulk-inserted into.
 *
 * The "Documentation Language" section opens a fence to show ONE example
 * heading. A later insertion dropped the whole Prose Style contract between the
 * fence open and that example, so every agent reads the contract as sample data
 * rather than as an instruction. This moves the section out of the fence and
 * places it after the Documentation Language section, leaving the fence holding
 * only the example it was written for.
 *
 * Refuses to modify any file that does not match the expected shape.
 *
 * Usage: bun scripts/fix-prose-style-fence.ts [--dry-run]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const AGENTS_DIR = resolve(import.meta.dir, "..", "agents");
const dryRun = process.argv.includes("--dry-run");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith(".md")) out.push(p);
  }
  return out;
}

type Outcome = { file: string; status: "fixed" | "already-ok" | "skipped"; reason?: string };

function repair(raw: string): { text: string; status: Outcome["status"]; reason?: string } {
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);

  // Locate "## Prose Style" and decide whether it sits inside a fence.
  let proseIdx = -1;
  let insideFence = false;
  let fenceOpen = -1;
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      depth ^= 1;
      if (depth === 1) fenceOpen = i;
      continue;
    }
    if (/^## Prose Style\s*$/.test(lines[i])) {
      proseIdx = i;
      insideFence = depth === 1;
      break;
    }
  }

  if (proseIdx === -1) return { text: raw, status: "skipped", reason: "no '## Prose Style' heading" };
  if (!insideFence) return { text: raw, status: "already-ok" };
  if (fenceOpen === -1) return { text: raw, status: "skipped", reason: "could not locate fence open" };

  // Closing fence for that block.
  let fenceClose = -1;
  for (let i = proseIdx + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) { fenceClose = i; break; }
  }
  if (fenceClose === -1) return { text: raw, status: "skipped", reason: "unterminated fence" };

  // Fence body = [prose style section] '---' [the example the fence is for].
  const body = lines.slice(fenceOpen + 1, fenceClose);
  const sepRel = body.map(l => l.trim()).lastIndexOf("---");
  if (sepRel === -1) {
    return { text: raw, status: "skipped", reason: "no '---' separating contract from example" };
  }
  const proseRel = proseIdx - (fenceOpen + 1);
  if (sepRel < proseRel) {
    return { text: raw, status: "skipped", reason: "'---' precedes the Prose Style heading" };
  }

  const proseBlock = trimBlank(body.slice(proseRel, sepRel));
  const example = trimBlank(body.slice(sepRel + 1));
  if (example.length === 0) return { text: raw, status: "skipped", reason: "fence has no example content" };
  if (proseBlock.length === 0) return { text: raw, status: "skipped", reason: "empty Prose Style block" };

  // Anything before the Prose Style heading inside the fence belongs to the
  // example too (defensive: expected to be empty).
  const preface = trimBlank(body.slice(0, proseRel));

  const rebuiltFence = [lines[fenceOpen], ...preface, ...example, lines[fenceClose]];

  // Insertion point: the first '---' after the fence closes, which ends the
  // Documentation Language section.
  let sectionEnd = -1;
  for (let i = fenceClose + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") { sectionEnd = i; break; }
  }
  if (sectionEnd === -1) {
    return { text: raw, status: "skipped", reason: "no section separator after the fence" };
  }

  const out = [
    ...lines.slice(0, fenceOpen),
    ...rebuiltFence,
    ...lines.slice(fenceClose + 1, sectionEnd + 1),
    "",
    ...proseBlock,
    "",
    "---",
    ...lines.slice(sectionEnd + 1),
  ];

  return { text: out.join(eol), status: "fixed" };
}

function trimBlank(arr: string[]): string[] {
  let s = 0;
  let e = arr.length;
  while (s < e && arr[s].trim() === "") s++;
  while (e > s && arr[e - 1].trim() === "") e--;
  return arr.slice(s, e);
}

function main(): void {
  const results: Outcome[] = [];
  for (const file of walk(AGENTS_DIR).sort()) {
    const rel = file.replace(AGENTS_DIR, "agents").replace(/\\/g, "/");
    const raw = readFileSync(file, "utf-8");
    const { text, status, reason } = repair(raw);
    if (status === "fixed" && !dryRun) writeFileSync(file, text);
    results.push({ file: rel, status, reason });
  }

  for (const r of results) {
    const label = r.status === "fixed" ? (dryRun ? "WOULD FIX" : "FIXED    ") : r.status.toUpperCase().padEnd(9);
    console.log(`${label} ${r.file}${r.reason ? `  (${r.reason})` : ""}`);
  }

  const fixed = results.filter(r => r.status === "fixed").length;
  const skipped = results.filter(r => r.status === "skipped").length;
  console.log(`\n${fixed} ${dryRun ? "would be fixed" : "fixed"}, ${skipped} skipped, ${results.length} total.`);
  if (skipped > 0) process.exit(1);
}

main();
