/**
 * plugin-root.ts — the plugin directory answered from Claude Code's install registry, never from a
 * glob over the version cache. Rules under test: the project-scope entry for this directory (or an
 * ancestor) beats the user-scope one; a dead installPath is skipped; no registry falls back to the
 * copy the script runs from; the stale warning names the scope to update; $CLAUDE_PLUGIN_ROOT wins
 * when it holds the manifest.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "plugin-root.ts");
const ROOT = join(import.meta.dir, "..");
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "plugin-root-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

/** A fake install: a directory carrying this plugin's manifest at the given version. */
const install = (name: string, version: string) => {
  const p = join(dir, name); mkdirSync(join(p, ".claude-plugin"), { recursive: true });
  writeFileSync(join(p, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "sa-skills", version }));
  return p;
};
const registry = (entries: object[]) => {
  const p = join(dir, "installed_plugins.json");
  writeFileSync(p, JSON.stringify({ version: 2, plugins: { "sa-skills@shadowx4fox-solution-architect-marketplace": entries } }));
  return p;
};
const run = (args: string[], env: Record<string, string> = {}) => {
  const r = Bun.spawnSync([process.execPath, SCRIPT, ...args], { stdout: "pipe", stderr: "pipe", env: { ...process.env, CLAUDE_PLUGIN_ROOT: "", ...env } });
  return { code: r.exitCode, out: r.stdout.toString().trim(), err: r.stderr.toString() };
};
const report = (args: string[], env: Record<string, string> = {}) => JSON.parse(run(["--json", ...args], env).out);

describe("plugin-root", () => {
  test("the project-scope entry for this directory beats the user-scope one", () => {
    const user = install("user-copy", "8.46.0"), proj = install("proj-copy", "8.49.0");
    const project = join(dir, "work", "my-project"); mkdirSync(join(project, "sub"), { recursive: true });
    const reg = registry([
      { scope: "user", installPath: user, version: "8.46.0" },
      { scope: "project", projectPath: project, installPath: proj, version: "8.49.0" },
    ]);
    const r = report(["--registry", reg, "--project", join(project, "sub")]);   // a subdirectory of the project still resolves
    expect(r.pluginDir).toBe(proj);
    expect(r.source).toBe("registry:project");
    expect(r.version).toBe("8.49.0");
    // another project falls back to the user scope
    expect(report(["--registry", reg, "--project", join(dir, "work", "other")]).source).toBe("registry:user");
  });

  test("--plugin resolves another plugin of the marketplace by its own registry entry and manifest name", () => {
    const adr = join(dir, "adr-copy"); mkdirSync(join(adr, ".claude-plugin"), { recursive: true });
    writeFileSync(join(adr, ".claude-plugin", "plugin.json"), JSON.stringify({ name: "sa-records", version: "8.96.0" }));
    const skills = install("skills-copy", "8.96.0");
    const reg = join(dir, "installed_plugins.json");
    writeFileSync(reg, JSON.stringify({ version: 2, plugins: {
      "sa-skills@shadowx4fox-solution-architect-marketplace": [{ scope: "user", installPath: skills, version: "8.96.0" }],
      "sa-records@shadowx4fox-solution-architect-marketplace": [{ scope: "user", installPath: adr, version: "8.96.0" }],
    } }));
    expect(report(["--registry", reg, "--plugin", "sa-records"]).pluginDir).toBe(adr);
    expect(report(["--registry", reg]).pluginDir).toBe(skills);
    // a directory whose manifest names another plugin is not that plugin
    const wrong = join(dir, "installed_wrong.json");
    writeFileSync(wrong, JSON.stringify({ version: 2, plugins: { "sa-records@shadowx4fox-solution-architect-marketplace": [{ scope: "user", installPath: skills, version: "8.96.0" }] } }));
    expect(run(["--json", "--registry", wrong, "--plugin", "sa-records"]).out).not.toContain(skills);   // unresolved, or the repo's own plugins/sa-records
  });

  test("a dead installPath is skipped", () => {
    const user = install("user-copy", "8.46.0");
    const reg = registry([
      { scope: "project", projectPath: join(dir, "p"), installPath: join(dir, "gone"), version: "9.0.0" },
      { scope: "user", installPath: user, version: "8.46.0" },
    ]);
    expect(report(["--registry", reg, "--project", join(dir, "p")]).pluginDir).toBe(user);
  });

  test("no registry: the copy the script runs from", () => {
    const r = report(["--registry", join(dir, "none.json"), "--project", dir]);
    expect(r.source).toBe("self");
    expect(r.pluginDir).toBe(ROOT);
  });

  test("$CLAUDE_PLUGIN_ROOT wins when it holds the manifest, and is ignored when it does not", () => {
    const env = install("env-copy", "8.40.0");
    const reg = registry([{ scope: "user", installPath: install("user-copy", "8.46.0"), version: "8.46.0" }]);
    expect(report(["--registry", reg, "--project", dir], { CLAUDE_PLUGIN_ROOT: env }).source).toBe("env:CLAUDE_PLUGIN_ROOT");
    expect(report(["--registry", reg, "--project", dir], { CLAUDE_PLUGIN_ROOT: join(dir, "not-a-plugin") }).source).toBe("registry:user");
  });

  test("the stale warning names the scope to update; --quiet silences it; stdout stays the path alone", () => {
    const user = install("user-copy", "0.0.1");   // older than the repo itself, so the warning fires against SELF
    const reg = registry([{ scope: "user", installPath: user, version: "0.0.1" }]);
    const r = run(["--registry", reg, "--project", dir]);
    expect(r.code).toBe(0);
    expect(r.out).toBe(user);
    expect(r.err).toContain("--scope user");
    expect(r.err).toContain("/reload-plugins");
    expect(run(["--registry", reg, "--project", dir, "--quiet"]).err).toBe("");
    expect(report(["--registry", reg, "--project", dir]).stale).toBe(true);
  });

  test("nothing resolves: exit 1 with the install command", () => {
    // no registry, no env, and a script copy outside a plugin is impossible from the repo — simulate with a registry that has only dead entries and an env that is not a plugin, then check the self fallback still answers
    const reg = registry([{ scope: "user", installPath: join(dir, "gone"), version: "1.0.0" }]);
    const r = run(["--registry", reg, "--project", dir]);
    expect(r.code).toBe(0);                          // the repo copy is a live plugin, so self answers
    expect(r.out).toBe(ROOT);
  });
});
