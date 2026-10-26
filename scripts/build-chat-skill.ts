#!/usr/bin/env bun
// build-chat-skill.ts — architecture-readiness packaged for a Claude chat (claude.ai › Settings › Capabilities › Skills):
// the skill folder without what needs Bun (scripts/, tests/), SKILL.md's frontmatter reduced to `name` and
// `description` (the keys a chat upload reads), and the pre-check bundled into one file, `precheck/po-spec-precheck.cjs`
// (Node or Bun — a chat's sandbox has both). The missing scripts/ is how the skill knows it runs in a chat (CHAT_MODE.md).
//
//   bun scripts/build-chat-skill.ts [--out <dir>]      → <dir>/architecture-readiness-chat-v<version>.zip (default release/)
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

const ROOT = resolve(import.meta.dir, "..");
const SKILL = join(ROOT, "plugins", "sa-requirements", "skills", "architecture-readiness");
const LEAVE_OUT = new Set(["scripts", "tests"]);

/** SKILL.md with only `name` and `description` in its frontmatter (a folded `>` description kept as one line). */
export function chatFrontmatter(src: string): string {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("SKILL.md has no frontmatter");
  const lines = m[1].split("\n"), keep: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const k = lines[i].match(/^(name|description):\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    if (v === ">" || v === "|" || v === ">-") { const body: string[] = []; while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) body.push(lines[++i].trim()); v = body.join(" "); }
    keep.push(`${k[1]}: ${k[1] === "description" ? JSON.stringify(v) : v}`);
  }
  if (keep.length !== 2) throw new Error("SKILL.md frontmatter needs name and description");
  return `---\n${keep.join("\n")}\n---\n` + src.slice(m[0].length);
}

/** The pre-check and what it requires (checkability's stage 1, po-spec.js), one CommonJS file for Node or Bun. */
export const bundlePrecheck = (outdir: string) =>
  Bun.build({ entrypoints: [join(SKILL, "scripts", "po-spec-precheck.js")], outdir, target: "node", format: "cjs", naming: "[name].cjs" });

if (import.meta.main) {
  const i = process.argv.indexOf("--out");
  const out = resolve(i > 0 ? process.argv[i + 1] : join(ROOT, "release"));
  const version = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf8")).version;
  const stage = mkdtempSync(join(tmpdir(), "chat-skill-")), dir = join(stage, "architecture-readiness");
  cpSync(SKILL, dir, { recursive: true, filter: (p) => !LEAVE_OUT.has(p.slice(SKILL.length + 1).split("/")[0]) });
  writeFileSync(join(dir, "SKILL.md"), chatFrontmatter(readFileSync(join(SKILL, "SKILL.md"), "utf8")));
  const b = await bundlePrecheck(join(dir, "precheck"));
  if (!b.success) { console.error(`bundle failed: ${b.logs.join("\n")}`); process.exit(1); }
  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  const zip = join(out, `architecture-readiness-chat-v${version}.zip`);
  rmSync(zip, { force: true });
  const r = Bun.spawnSync(["zip", "-qr", zip, "architecture-readiness"], { cwd: stage });
  rmSync(stage, { recursive: true, force: true });
  if (r.exitCode !== 0) { console.error(`zip failed: ${r.stderr.toString()}`); process.exit(1); }
  console.log(zip);
}
