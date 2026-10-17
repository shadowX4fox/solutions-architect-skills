/**
 * Skill catalog gate — scripts/skill-catalog.json against the tree.
 *
 * Checks:
 *  1. Every skills/<name>/ is in the catalog exactly once, and every catalog entry is a skill.
 *  2. Every entry names a known category and carries `standalone`, `needs`, `depends_on`.
 *  3. `depends_on` equals the cross-skill edges found in the tree — both ways, so a new
 *     coupling fails until it is declared and a removed one fails until it is dropped.
 *     An edge is either
 *       - a load: a non-test .js/.ts line under skills/<name>/ that requires, imports or
 *         path.joins a file of another skill, or
 *       - an invocation: a skills/<other>/<file>.(js|ts|json) path in the skill's Markdown.
 *  4. `optional_depends_on` lists edges the skill runs without: a load from code only on a line marked
 *     `optional:` (a lazy require inside a try, so a missing skill is a message), and every Markdown line
 *     that invokes one says "optional" — so a missing skill is a skipped step, never a crash. An edge is
 *     declared in one list or the other, never both.
 *  5. Every Markdown file under agents/ has an owner in the catalog's `agents` map, and the scripts its instructions invoke
 *     count as its owner's edges — an agent ships with the skill that dispatches it.
 *  6. README.md § Skill Categories names every skill.
 *  7. Every plugins/<name>/ is a plugin of the marketplace: its own .claude-plugin/plugin.json named <name>,
 *     a marketplace entry with source ./plugins/<name> at the same version, and a place in sa-skills'
 *     `dependencies`. Its version is sa-skills' unless the catalog's `plugins.<name>.cadence` is
 *     `independent` (sa-ux: released on its own cadence) — a release that bumps one
 *     and not the other fails here.
 *
 * Usage: bun scripts/check-skill-catalog.ts            # exits 1 on any error
 *        bun scripts/check-skill-catalog.ts --report   # the edges with their files, per category
 *        bun scripts/check-skill-catalog.ts --json     # the scan as JSON
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, resolve, relative } from "path";

export type Entry = {
  category: string;
  standalone: boolean;
  needs: string[];
  depends_on: string[];
  optional_depends_on?: string[];
  /** The plugin that ships the skill: sa-skills (skills/<name>, the default) or one under plugins/<plugin>/. */
  plugin?: string;
  internal?: boolean;
  suspended?: boolean;
  note?: string;
};
export type Catalog = { categories: Record<string, string>; skills: Record<string, Entry>; agents?: Record<string, string>; plugins?: Record<string, { cadence?: "independent" | "sa-skills"; optional?: boolean; why?: string }> };
/** skill → other skill → the files of `other` it reaches, each tagged load | invoke. */
export type Edges = Record<string, Record<string, Set<string>>>;

const CODE = /\.(m?js|ts)$/;
// `fromSaSkills(…)` is how a plugin split off sa-skills reaches a file of sa-skills (plugins/<name>/scripts/sa-skills.js)
const LOAD_CALL = /\b(require|import)\s*\(|\bfrom\s+['"]|path\.join\s*\(|\bfromSaSkills\s*\(/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "tests") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The file of `other` a code line reaches: the quoted path.join arguments after it, or the string's tail. */
function loadTarget(line: string, other: string): string | null {
  const joined = line.match(new RegExp(`['"]${escape(other)}['"]((?:\\s*,\\s*['"][^'"]+['"])*)`));
  if (joined) {
    const parts = [...joined[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
    return parts.join("/") || "(directory)";
  }
  const inString = line.match(new RegExp(`['"][^'"]*\\/${escape(other)}\\/([^'"]+)['"]`));
  return inString ? inString[1] : null;
}

// the invocations of one Markdown text, as `owner`'s edges; `where` names the file in a required-invoke finding
function scanMarkdown(text: string, owner: string, skills: string[], where: string, add: (f: string, t: string, file: string) => void) {
  const lines = text.split("\n");
  for (const x of skills) {
    if (x === owner) continue;
    const rx = new RegExp(`skills/${escape(x)}/([A-Za-z0-9_./-]+?\\.(?:json|js|ts))\\b`, "g");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(rx)) {
        add(owner, x, `invoke ${m[1]}`);
        if (!/\boptional\b/i.test(line)) add(owner, x, `required-invoke ${where}:${i + 1}`);
      }
    });
  }
}

/**
 * Every skill directory of the marketplace: skills/<name> (sa-skills) and plugins/<plugin>/skills/<name> (a plugin
 * sa-skills depends on). Name → absolute directory, plus the plugin that ships it.
 */
export function skillMap(root: string): Record<string, { dir: string; plugin: string }> {
  const out: Record<string, { dir: string; plugin: string }> = {};
  const addFrom = (dir: string, plugin: string) => {
    if (!existsSync(dir)) return;
    for (const n of readdirSync(dir)) if (statSync(join(dir, n)).isDirectory() && existsSync(join(dir, n, "SKILL.md"))) out[n] = { dir: join(dir, n), plugin };
  };
  addFrom(join(root, "skills"), "sa-skills");
  const plugins = join(root, "plugins");
  if (existsSync(plugins)) for (const p of readdirSync(plugins).sort()) addFrom(join(plugins, p, "skills"), p);
  return out;
}

export function scan(skillsDirOrRoot: string, agents: Record<string, string> = {}, fromRoot = false): Edges {
  // a skills directory (the tests' fixtures), or the repository root with its plugins/
  const map: Record<string, string> = fromRoot
    ? Object.fromEntries(Object.entries(skillMap(skillsDirOrRoot)).map(([n, v]) => [n, v.dir]))
    : Object.fromEntries(readdirSync(skillsDirOrRoot).filter(n => statSync(join(skillsDirOrRoot, n)).isDirectory()).map(n => [n, join(skillsDirOrRoot, n)]));
  const skills = Object.keys(map).sort();
  const edges: Edges = {};
  const add = (from: string, to: string, file: string) => {
    ((edges[from] ??= {})[to] ??= new Set()).add(file);
  };
  for (const s of skills) {
    for (const f of walk(map[s])) {
      if (/\.test\.[jt]s$/.test(f)) continue;
      const text = readFileSync(f, "utf-8").replace(/\r\n?/g, "\n");
      if (CODE.test(f)) {
        for (const line of text.split("\n")) {
          const t = line.trim();
          if (t.startsWith("//") || t.startsWith("*") || !LOAD_CALL.test(line)) continue;
          for (const x of skills) {
            if (x === s) continue;
            const target = loadTarget(line, x);
            if (target) add(s, x, /\boptional:/.test(line) ? `load-optional ${target}` : `load ${target}`);
          }
        }
      } else if (f.endsWith(".md")) {
        scanMarkdown(text, s, skills, relative(map[s], f), add);
      }
    }
  }
  const root = fromRoot ? skillsDirOrRoot : join(skillsDirOrRoot, "..");
  for (const [file, owner] of Object.entries(agents)) {
    const p = join(root, file);
    if (existsSync(p) && skills.includes(owner)) scanMarkdown(readFileSync(p, "utf-8").replace(/\r\n?/g, "\n"), owner, skills, file, add);
  }
  return edges;
}

export function check(root: string): { errors: string[]; catalog: Catalog; edges: Edges } {
  const catalog: Catalog = JSON.parse(readFileSync(join(root, "scripts", "skill-catalog.json"), "utf-8"));
  const errors: string[] = [];
  const found = skillMap(root);
  const onDisk = Object.keys(found).sort();
  const listed = Object.keys(catalog.skills);

  for (const s of onDisk) if (!catalog.skills[s]) errors.push(`${s}: skill on disk, missing from scripts/skill-catalog.json`);
  for (const s of listed) {
    const plugin = catalog.skills[s].plugin ?? "sa-skills";
    if (!found[s]) errors.push(`${s}: in the catalog, no SKILL.md under ${plugin === "sa-skills" ? "skills/" : `plugins/${plugin}/skills/`}${s}`);
    else if (found[s].plugin !== plugin) errors.push(`${s}: the catalog says plugin ${plugin}, the tree ships it in ${found[s].plugin}`);
  }

  // agents: agents/ (sa-skills) and plugins/<plugin>/agents/
  const agentDirs = [join(root, "agents"), ...(existsSync(join(root, "plugins")) ? readdirSync(join(root, "plugins")).map(p => join(root, "plugins", p, "agents")) : [])];
  const agentFiles = agentDirs.filter(d => existsSync(d)).flatMap(d => walk(d)).filter(f => f.endsWith(".md")).map(f => relative(root, f).split("\\").join("/")).sort();
  const owners = catalog.agents ?? {};
  for (const a of agentFiles) if (!owners[a]) errors.push(`${a}: agent with no owner in scripts/skill-catalog.json \`agents\``);
  for (const [a, o] of Object.entries(owners)) {
    if (!agentFiles.includes(a)) errors.push(`${a}: in the catalog's agents, no such file`);
    if (!catalog.skills[o]) errors.push(`${a}: owner ${o} is not a skill in the catalog`);
  }
  const edges = scan(root, owners, true);
  for (const s of listed) {
    const e = catalog.skills[s];
    if (!catalog.categories[e.category]) errors.push(`${s}: unknown category "${e.category}"`);
    if (typeof e.standalone !== "boolean") errors.push(`${s}: \`standalone\` must be true or false`);
    if (!Array.isArray(e.needs)) errors.push(`${s}: \`needs\` must be a list`);
    if (!Array.isArray(e.depends_on)) { errors.push(`${s}: \`depends_on\` must be a list`); continue; }
    if (e.standalone === true && e.needs?.includes("ARCHITECTURE.md")) errors.push(`${s}: standalone but needs ARCHITECTURE.md`);
    const optional = e.optional_depends_on ?? [];
    if (!Array.isArray(optional)) { errors.push(`${s}: \`optional_depends_on\` must be a list`); continue; }
    const found = Object.keys(edges[s] ?? {}).sort();
    for (const x of found) {
      const files = [...edges[s][x]];
      if (optional.includes(x)) {
        for (const f of files.filter(f => f.startsWith("load "))) errors.push(`${s}: optional_depends_on ${x}, but code loads ${f.slice(5)} — an optional skill is loaded lazily, on a line marked \`optional:\``);
        for (const f of files.filter(f => f.startsWith("required-invoke "))) errors.push(`${s}: optional_depends_on ${x}, but ${f.slice(16)} invokes it without saying "optional" — state what happens when it is not installed`);
      } else if (!e.depends_on.includes(x)) {
        errors.push(`${s}: reaches ${x} (${files.filter(f => !f.startsWith("required-")).slice(0, 3).join(", ")}) — declare it in depends_on or optional_depends_on, or remove the coupling`);
      }
    }
    for (const x of [...e.depends_on, ...optional]) if (!found.includes(x)) errors.push(`${s}: declares ${x}, but nothing in the tree reaches it — drop it`);
    for (const x of optional) if (e.depends_on.includes(x)) errors.push(`${s}: ${x} is in depends_on and optional_depends_on — one or the other`);
  }

  const plugins = join(root, "plugins");
  if (existsSync(plugins)) {
    const read = (f: string) => { try { return JSON.parse(readFileSync(f, "utf-8")); } catch { return null; } };
    const main = read(join(root, ".claude-plugin", "plugin.json")) ?? {};
    const market = read(join(root, ".claude-plugin", "marketplace.json")) ?? { plugins: [] };
    for (const name of readdirSync(plugins).filter(n => statSync(join(plugins, n)).isDirectory()).sort()) {
      const m = read(join(plugins, name, ".claude-plugin", "plugin.json"));
      if (!m) { errors.push(`plugins/${name}: no .claude-plugin/plugin.json`); continue; }
      if (m.name !== name) errors.push(`plugins/${name}: plugin.json names "${m.name}"`);
      // a plugin on its own cadence (the catalog's `plugins.<name>.cadence: independent`) versions itself; every other
      // one moves with sa-skills
      const independent = catalog.plugins?.[name]?.cadence === "independent";
      if (!independent && m.version !== main.version) errors.push(`plugins/${name}: version ${m.version}, sa-skills is ${main.version} — bump both`);
      const entry = (market.plugins ?? []).find((e: any) => e.name === name);
      if (!entry) errors.push(`plugins/${name}: no entry in .claude-plugin/marketplace.json`);
      else {
        if (entry.source !== `./plugins/${name}`) errors.push(`plugins/${name}: marketplace source is ${JSON.stringify(entry.source)}, expected "./plugins/${name}"`);
        const want = independent ? m.version : main.version;
        if (entry.version !== want) errors.push(`plugins/${name}: marketplace version ${entry.version}, ${independent ? "its plugin.json" : "sa-skills"} is ${want}`);
      }
      // an optional plugin (the catalog's `plugins.<name>.optional: true` — sa-ux, a UX layer) is installed on its own and
      // must not be forced on every sa-skills user; every other one is a dependency of sa-skills
      const isDep = (main.dependencies ?? []).some((d: any) => (typeof d === "string" ? d.split("@")[0] : d?.name) === name);
      if (catalog.plugins?.[name]?.optional) { if (isDep) errors.push(`plugins/${name}: optional, yet in sa-skills' dependencies — remove it there, or drop \`optional\``); }
      else if (!isDep) errors.push(`plugins/${name}: not in sa-skills' dependencies`);
    }
  }

  const readme = join(root, "README.md");
  if (existsSync(readme)) {
    const text = readFileSync(readme, "utf-8").replace(/\r\n?/g, "\n");
    const at = text.search(/^## Skill Categories\b/m);
    if (at === -1) errors.push("README.md: no `## Skill Categories` section");
    else {
      const rest = text.slice(at + 1);
      const end = rest.search(/^## /m);
      const section = end === -1 ? rest : rest.slice(0, end);
      for (const s of listed) if (!new RegExp(`\`${escape(s)}\``).test(section)) errors.push(`README.md § Skill Categories: \`${s}\` not named`);
    }
  }
  return { errors, catalog, edges };
}

function report(catalog: Catalog, edges: Edges): string {
  const out: string[] = [];
  for (const [cat, what] of Object.entries(catalog.categories)) {
    const members = Object.entries(catalog.skills).filter(([, e]) => e.category === cat).map(([s]) => s);
    out.push(`## ${cat} — ${what}`, "");
    for (const s of members) {
      const e = catalog.skills[s];
      const flags = [e.standalone ? "standalone" : null, e.internal ? "internal" : null, e.suspended ? "suspended" : null].filter(Boolean).join(", ");
      out.push(`### ${s}${flags ? ` (${flags})` : ""}`, `needs: ${e.needs.length ? e.needs.join(", ") : "nothing"}`);
      for (const [x, files] of Object.entries(edges[s] ?? {}).sort()) {
        const outside = catalog.skills[x]?.category !== cat ? " ← outside the category" : "";
        const optional = (e.optional_depends_on ?? []).includes(x) ? " (optional)" : "";
        out.push(`- ${x}${optional}${outside}`);
        for (const f of [...files].filter(f => !f.startsWith("required-")).sort()) out.push(`    ${f}`);
      }
      out.push("");
    }
  }
  return out.join("\n");
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, "..");
  const { errors, catalog, edges } = check(root);
  const args = process.argv.slice(2);
  if (args.includes("--json")) {
    console.log(JSON.stringify(Object.fromEntries(Object.entries(edges).map(([s, m]) => [s, Object.fromEntries(Object.entries(m).map(([x, f]) => [x, [...f].filter(v => !v.startsWith("required-")).sort()]))])), null, 2));
  } else if (args.includes("--report")) {
    console.log(report(catalog, edges));
  }
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    console.error(`\n${errors.length} error(s) — ${relative(process.cwd(), join(root, "scripts", "skill-catalog.json"))}`);
    process.exit(1);
  }
  if (!args.includes("--json") && !args.includes("--report")) {
    console.log(`✓ skill catalog: ${Object.keys(catalog.skills).length} skills, ${Object.keys(catalog.categories).length} categories, edges match the tree`);
  }
}
