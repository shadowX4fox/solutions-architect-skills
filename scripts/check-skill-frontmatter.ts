/**
 * Frontmatter gate for skills/<name>/SKILL.md.
 *
 * Checks, per skill:
 *  1. `name` present and equal to the directory name.
 *  2. `description` present and <= MAX_DESCRIPTION_CHARS. Skill routing reads
 *     the description; an over-long one is truncated, and the tail — which is
 *     where negative-routing clauses live — silently stops existing.
 *  3. Every trigger phrase CLAUDE.md's routing table assigns to the skill
 *     appears somewhere in the frontmatter (description or `triggers:`).
 *
 * Usage: bun scripts/check-skill-frontmatter.ts        # exits 1 on any error
 *        bun scripts/check-skill-frontmatter.ts --list # print lengths only
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const CLAUDE_MD = join(REPO_ROOT, "CLAUDE.md");

/**
 * Claude Code truncates a skill description past this length. Kept slightly
 * under the hard 1024 so an edit does not silently land on the boundary.
 */
const MAX_DESCRIPTION_CHARS = 1024;
const WARN_DESCRIPTION_CHARS = 950;

type Frontmatter = { name?: string; description?: string; triggers: string[]; raw: string };

function parseFrontmatter(text: string): Frontmatter | null {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const raw = m[1];
  const lines = raw.split(/\r?\n/);

  const scalar = (key: string): string | undefined => {
    const startIdx = lines.findIndex(l => new RegExp(`^${key}:`).test(l));
    if (startIdx === -1) return undefined;
    const first = lines[startIdx].slice(key.length + 1).trim();
    // Block scalar (`>` / `|`, with optional chomping indicator): the value is
    // the indented run that follows.
    if (/^[>|][-+]?$/.test(first)) {
      const body: string[] = [];
      for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].trim() === "") { body.push(""); continue; }
        if (!/^\s+/.test(lines[i])) break;
        body.push(lines[i].trim());
      }
      return body.join(" ").replace(/\s+/g, " ").trim();
    }
    return first.replace(/^["']|["']$/g, "");
  };

  const triggers: string[] = [];
  const tIdx = lines.findIndex(l => /^triggers:/.test(l));
  if (tIdx !== -1) {
    for (let i = tIdx + 1; i < lines.length; i++) {
      const item = lines[i].match(/^\s+-\s+(.*)$/);
      if (!item) { if (lines[i].trim() !== "" && !/^\s/.test(lines[i])) break; continue; }
      triggers.push(item[1].trim().replace(/^["']|["']$/g, ""));
    }
  }

  return { name: scalar("name"), description: scalar("description"), triggers, raw };
}

/**
 * Pull the trigger phrases out of CLAUDE.md's routing table. Rows look like:
 *   | `phrase a` · `phrase b` | `sa-skills:skill-name` | ... |
 */
function routingTablePhrases(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  if (!existsSync(CLAUDE_MD)) return out;
  for (const line of readFileSync(CLAUDE_MD, "utf-8").split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map(c => c.trim());
    if (cells.length < 4) continue;
    const skillCell = cells[2] ?? "";
    const skillMatch = skillCell.match(/`sa-[a-z]+:([a-z-]+)`/);   // sa-skills:<skill>, or a plugin it depends on (sa-records:<skill>)
    if (!skillMatch) continue;
    const phrases = [...(cells[1] ?? "").matchAll(/`([^`]+)`/g)].map(m => m[1]);
    if (phrases.length === 0) continue;
    const prev = out.get(skillMatch[1]) ?? [];
    out.set(skillMatch[1], [...prev, ...phrases]);
  }
  return out;
}

/** Trigger phrases carrying a placeholder cannot be matched literally. */
function isMatchable(phrase: string): boolean {
  return !phrase.includes("<") && !phrase.startsWith("--");
}

function main(): void {
  const listOnly = process.argv.includes("--list");
  const routing = routingTablePhrases();
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: Array<[number, string, number]> = [];

  // skills/<name> (sa-skills) and plugins/<plugin>/skills/<name> (a plugin sa-skills depends on)
  const pluginsDir = join(REPO_ROOT, "plugins");
  const skillDirs = [SKILLS_DIR, ...(existsSync(pluginsDir) ? readdirSync(pluginsDir).map(p => join(pluginsDir, p, "skills")).filter(d => existsSync(d)) : [])];
  for (const [base, entry] of skillDirs.flatMap(d => readdirSync(d, { withFileTypes: true }).map(e => [d, e] as const))) {
    if (!entry.isDirectory()) continue;
    const skillMd = join(base, entry.name, "SKILL.md");
    if (!existsSync(skillMd)) {
      errors.push(`${entry.name}: SKILL.md missing`);
      continue;
    }
    const fm = parseFrontmatter(readFileSync(skillMd, "utf-8"));
    if (!fm) {
      errors.push(`${entry.name}: no YAML frontmatter block`);
      continue;
    }

    if (!fm.name) errors.push(`${entry.name}: frontmatter has no 'name'`);
    else if (fm.name !== entry.name) {
      errors.push(`${entry.name}: frontmatter name '${fm.name}' != directory name`);
    }

    const desc = fm.description ?? "";
    if (!desc) errors.push(`${entry.name}: frontmatter has no 'description'`);
    if (desc.length > MAX_DESCRIPTION_CHARS) {
      errors.push(
        `${entry.name}: description is ${desc.length} chars (max ${MAX_DESCRIPTION_CHARS}) — ` +
        `it will be truncated at routing time, dropping the tail`
      );
    } else if (desc.length > WARN_DESCRIPTION_CHARS) {
      warnings.push(`${entry.name}: description is ${desc.length} chars (approaching ${MAX_DESCRIPTION_CHARS})`);
    }
    rows.push([desc.length, entry.name, fm.triggers.length]);

    // Routing-table phrases must be reachable from the frontmatter.
    const expected = (routing.get(entry.name) ?? []).filter(isMatchable);
    if (expected.length > 0) {
      const haystack = `${desc}\n${fm.triggers.join("\n")}`.toLowerCase();
      const missing = expected.filter(p => !haystack.includes(p.toLowerCase()));
      if (missing.length > 0) {
        errors.push(
          `${entry.name}: routing-table phrase(s) absent from frontmatter: ` +
          missing.map(p => `"${p}"`).join(", ")
        );
      }
    }
  }

  rows.sort((a, b) => b[0] - a[0]);
  console.log("description chars | triggers | skill");
  for (const [len, name, tCount] of rows) {
    const flag = len > MAX_DESCRIPTION_CHARS ? " OVER" : len > WARN_DESCRIPTION_CHARS ? " warn" : "     ";
    console.log(`${String(len).padStart(17)}${flag} | ${String(tCount).padStart(8)} | ${name}`);
  }

  if (warnings.length > 0) {
    console.log("");
    for (const w of warnings) console.warn(`⚠️  ${w}`);
  }

  if (listOnly) return;

  if (errors.length > 0) {
    console.error("");
    for (const e of errors) console.error(`❌ ${e}`);
    console.error(`\n${errors.length} frontmatter error(s).`);
    process.exit(1);
  }
  console.log("\n✅ All skill frontmatter valid.");
}

main();
