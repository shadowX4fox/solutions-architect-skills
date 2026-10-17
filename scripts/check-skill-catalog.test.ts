import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { check, scan } from "./check-skill-catalog";

function tree(files: Record<string, string>, catalog: object, readme = "## Skill Categories\n`a` `b`\n"): string {
  const root = mkdtempSync(join(tmpdir(), "skill-catalog-"));
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(join(root, p, ".."), { recursive: true });
    writeFileSync(join(root, p), body);
  }
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "skill-catalog.json"), JSON.stringify(catalog));
  writeFileSync(join(root, "README.md"), readme);
  return root;
}

const entry = (depends_on: string[]) => ({ category: "c", standalone: true, needs: [], depends_on });
const base = {
  "skills/a/SKILL.md": "---\nname: a\n---\n",
  "skills/b/SKILL.md": "---\nname: b\n---\n",
};

describe("scan", () => {
  test("a path.join load, a relative import and a Markdown invocation are edges; comments and tests are not", () => {
    const root = tree({
      ...base,
      "skills/a/scripts/x.js": "const d = require(path.join(__dirname, '..', '..', 'b', 'scripts', 'd.js'));\n// require(path.join('b', 'no.js'))\n",
      "skills/a/utils/y.ts": 'import { z } from "../../b/utils/z";\n',
      "skills/a/tests/t.test.ts": "require(path.join('b', 'test-only.js'));\n",
      "skills/b/SKILL.md": "Run `bun [plugin_dir]/skills/a/scripts/x.js`.\n",
    }, { categories: {}, skills: {} });
    const edges = scan(join(root, "skills"));
    expect([...edges.a.b].sort()).toEqual(["load scripts/d.js", "load utils/z"]);
    expect([...edges.b.a]).toEqual(["invoke scripts/x.js", "required-invoke SKILL.md:1"]);   // the line does not say optional
  });
});

describe("check", () => {
  const catalog = (a: string[], b: string[] = []) => ({ categories: { c: "C" }, skills: { a: entry(a), b: entry(b) } });
  const coupled = { ...base, "skills/a/x.js": "require(path.join(__dirname, '..', 'b', 'd.js'));\n" };

  test("declared edges that match the tree pass", () => {
    expect(check(tree(coupled, catalog(["b"]))).errors).toEqual([]);
  });
  test("an undeclared coupling fails", () => {
    expect(check(tree(coupled, catalog([]))).errors.join()).toContain("a: reaches b");
  });
  test("a declared edge the tree no longer has fails", () => {
    expect(check(tree(base, catalog(["b"]))).errors.join()).toContain("nothing in the tree reaches it");
  });
  test("a skill missing from the catalog or the README fails", () => {
    const errors = check(tree(base, { categories: { c: "C" }, skills: { a: entry([]) } }, "## Skill Categories\n`a`\n")).errors.join();
    expect(errors).toContain("b: skill on disk, missing");
  });
  test("a plugin under plugins/ is a dependency of sa-skills, unless the catalog marks it optional — then it must not be one", () => {
    const files = (deps: string[]) => ({ ...base,
      ".claude-plugin/plugin.json": JSON.stringify({ name: "sa-skills", version: "1.0.0", dependencies: deps }),
      ".claude-plugin/marketplace.json": JSON.stringify({ plugins: [{ name: "ux", source: "./plugins/ux", version: "0.1.0" }] }),
      "plugins/ux/.claude-plugin/plugin.json": JSON.stringify({ name: "ux", version: "0.1.0" }) });
    const cat = (optional: boolean) => ({ ...catalog([]), plugins: { ux: { cadence: "independent", ...(optional ? { optional: true } : {}) } } });
    expect(check(tree(files([]), cat(false))).errors.join()).toContain("plugins/ux: not in sa-skills' dependencies");
    expect(check(tree(files([]), cat(true))).errors).toEqual([]);
    expect(check(tree(files(["ux"]), cat(true))).errors.join()).toContain("plugins/ux: optional, yet in sa-skills' dependencies");
  });
  test("standalone with ARCHITECTURE.md in needs fails", () => {
    const c = catalog([]);
    c.skills.a.needs = ["ARCHITECTURE.md"] as never;
    expect(check(tree(base, c)).errors.join()).toContain("standalone but needs ARCHITECTURE.md");
  });
  describe("optional_depends_on", () => {
    const optional = () => ({ categories: { c: "C" }, skills: { a: { ...entry([]), optional_depends_on: ["b"] }, b: entry([]) } });
    test("an invocation that says optional passes", () => {
      const files = { ...base, "skills/a/SKILL.md": "Run `skills/b/scripts/x.js` — optional: skipped when b is not installed.\n" };
      expect(check(tree(files, optional())).errors).toEqual([]);
    });
    test("an invocation that does not say optional fails, naming the line", () => {
      const files = { ...base, "skills/a/SKILL.md": "intro\nRun `skills/b/scripts/x.js`.\n" };
      expect(check(tree(files, optional())).errors.join()).toContain('SKILL.md:2 invokes it without saying "optional"');
    });
    test("code that loads an optional skill fails", () => {
      const files = { ...base, "skills/a/x.js": "require(path.join(__dirname, '..', 'b', 'd.js'));\n" };
      expect(check(tree(files, optional())).errors.join()).toContain("loaded lazily");
    });
    test("a lazy load marked optional: passes", () => {
      const files = { ...base, "skills/a/x.js": "try { m = require(path.join(__dirname, '..', 'b', 'd.js')); }  // optional: b\n" };
      expect(check(tree(files, optional())).errors).toEqual([]);
    });
    test("a skill in both lists fails", () => {
      const c = optional();
      c.skills.a.depends_on = ["b"];
      const files = { ...base, "skills/a/SKILL.md": "`skills/b/x.js` optional\n" };
      expect(check(tree(files, c)).errors.join()).toContain("one or the other");
    });
  });
  describe("agents", () => {
    const withAgents = (agents: object, a: string[] = []) => ({ categories: { c: "C" }, skills: { a: entry(a), b: entry([]) }, agents });
    test("an agent's invocations are its owner's edges", () => {
      const files = { ...base, "agents/gen/w.md": "Run `skills/b/scripts/x.js`.\n" };
      expect(check(tree(files, withAgents({ "agents/gen/w.md": "a" }))).errors.join()).toContain("a: reaches b");
      expect(check(tree(files, withAgents({ "agents/gen/w.md": "a" }, ["b"]))).errors).toEqual([]);
    });
    test("an agent without an owner fails", () => {
      const files = { ...base, "agents/gen/w.md": "no invocations\n" };
      expect(check(tree(files, withAgents({}))).errors.join()).toContain("agents/gen/w.md: agent with no owner");
    });
  });
  test("the repository's catalog matches its tree", () => {
    expect(check(resolve(import.meta.dir, "..")).errors).toEqual([]);
  });
});
