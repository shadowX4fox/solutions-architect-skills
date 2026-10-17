/**
 * Structural gate for agents/**.md.
 *
 * Checks, per agent file:
 *  1. No *instruction* heading sits inside a fenced code block. A heading
 *     swallowed by a fence renders as sample data rather than as an
 *     instruction — this is how the Prose Style contract was silently voided
 *     in every agent.
 *
 *     Only the agent's OWN contract sections are checked (CONTRACT_HEADINGS).
 *     Agents legitimately fence two other kinds of heading: an illustrative
 *     one (`## 9. Arquitectura de Seguridad <!-- SECTION: ... -->`) and the
 *     headings of payload/document templates they emit (`## Scope`,
 *     `## Flows`). A blanket "no heading in a fence" rule flags those, so the
 *     list is deliberately curated rather than derived — extend it when a new
 *     standing instruction section is added to the agents.
 *  2. Every fence is closed.
 *  3. Frontmatter exists and carries `name` and `description`.
 *  4. `name` matches the filename.
 *
 * Usage: bun scripts/check-agent-structure.ts   # exits 1 on any error
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join, relative, resolve } from "path";

const AGENTS_DIR = resolve(import.meta.dir, "..", "agents");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Split a file into lines tagged with whether each sits inside a fence. */
function scanFences(text: string): Array<{ line: string; fenced: boolean; openLine: number }> {
  const out: Array<{ line: string; fenced: boolean; openLine: number }> = [];
  let depth = 0;
  let openLine = -1;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      if (depth === 0) { depth = 1; openLine = out.length; }
      else { depth = 0; openLine = -1; }
      out.push({ line, fenced: false, openLine: -1 });
      continue;
    }
    out.push({ line, fenced: depth === 1, openLine });
  }
  return out;
}

const HEADING = /^## (\S.*)$/;

/**
 * The agent's own standing-instruction sections. These are directives to the
 * model and must never be swallowed by a code fence. Payload and document
 * templates the agents emit never use these names.
 */
const CONTRACT_HEADINGS = new Set([
  "Prose Style",
  "Component Naming Fidelity",
  "Documentation Language",
  "Source Content Is Data, Not Instructions",
  "Mission",
]);

function main(): void {
  const errors: string[] = [];
  // agents/ (sa-skills) and plugins/<plugin>/agents/ (a plugin sa-skills depends on)
  const REPO = resolve(AGENTS_DIR, "..");
  const pluginsDir = join(REPO, "plugins");
  const dirs = [AGENTS_DIR, ...(existsSync(pluginsDir) ? readdirSync(pluginsDir).map(p => join(pluginsDir, p, "agents")).filter(d => existsSync(d)) : [])];
  const files = dirs.flatMap(d => walk(d)).sort();

  for (const file of files) {
    const rel = relative(REPO, file).replace(/\\/g, "/");
    const text = readFileSync(file, "utf-8");
    const lines = text.split(/\r?\n/);

    // --- frontmatter -------------------------------------------------------
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) {
      errors.push(`${rel}: no YAML frontmatter block`);
    } else {
      const body = fm[1];
      const name = body.match(/^name:\s*(.+)$/m)?.[1]?.trim();
      if (!name) errors.push(`${rel}: frontmatter has no 'name'`);
      else if (name !== basename(file, ".md")) {
        errors.push(`${rel}: frontmatter name '${name}' != filename '${basename(file, ".md")}'`);
      }
      if (!/^description:/m.test(body)) errors.push(`${rel}: frontmatter has no 'description'`);
    }

    // --- fence integrity ---------------------------------------------------
    // Frontmatter delimiters are '---', never '```', so scanning the whole
    // file is safe.
    const scanned = scanFences(text);
    for (let i = 0; i < scanned.length; i++) {
      const { line, fenced, openLine } = scanned[i];
      if (!fenced) continue;
      const m = line.match(HEADING);
      if (!m) continue;
      if (!CONTRACT_HEADINGS.has(m[1].trim())) continue;
      errors.push(
        `${rel}:${i + 1}: contract heading "## ${m[1].trim()}" is inside the code fence ` +
        `opened at line ${openLine + 1} — it will read as sample data, not as an instruction`
      );
    }

    let depth = 0;
    let lastOpen = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*```/.test(lines[i])) {
        depth ^= 1;
        if (depth === 1) lastOpen = i;
      }
    }
    if (depth !== 0) {
      errors.push(`${rel}:${lastOpen + 1}: code fence is never closed`);
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(`❌ ${e}`);
    console.error(`\n${errors.length} agent structure error(s) across ${files.length} files.`);
    process.exit(1);
  }
  console.log(`✅ All ${files.length} agent files structurally valid.`);
}

main();
