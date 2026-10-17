/**
 * setup-ripgrep.ts — ripgrep detection and the project setting that points the Grep tool at it.
 *
 * The rules under test: a system ripgrep sets USE_BUILTIN_RIPGREP=0 in the project settings once
 * and preserves everything else there; a value at user scope or a foreign project value is never
 * overridden; no ripgrep on PATH writes nothing and names the install command; --dry-run writes
 * nothing; --strict is the only non-zero exit and only when ripgrep is missing.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "setup-ripgrep.ts");
const HAVE_RG = Bun.which("rg") !== null;

type Check = { id: string; ok: boolean; detail: string; fix?: string; cost?: string };
type Report = { rg: string | null; action: string; checks: Check[] };

let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "setup-ripgrep-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const run = (args: string[], env: Record<string, string> = {}) => {
  const r = Bun.spawnSync([process.execPath, SCRIPT, ...args], { stdout: "pipe", stderr: "pipe", env: { ...process.env, ...env } });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};
const report = (args: string[], env: Record<string, string> = {}): Report => JSON.parse(run(["--json", ...args], env).out);
const by = (r: Report, id: string) => r.checks.find((c) => c.id === id)!;
const paths = () => ({ project: join(dir, "project", ".claude", "settings.json"), user: join(dir, "user-settings.json") });
const settings = (p: string) => JSON.parse(readFileSync(p, "utf8"));

describe("setup-ripgrep", () => {
  test.if(HAVE_RG)("a system ripgrep sets USE_BUILTIN_RIPGREP=0 in the project settings and keeps every other key", () => {
    const { project, user } = paths();
    mkdirSync(join(dir, "project", ".claude"), { recursive: true });
    writeFileSync(project, JSON.stringify({ model: "opus", env: { OTHER: "1" }, permissions: { allow: ["Bash(bun *)", "Bash(rg *)"] } }, null, 2));
    const r = report([project, "--user-settings", user]);
    expect(r.action).toBe("set");
    expect(by(r, "rg").ok).toBe(true);
    expect(by(r, "grant").ok).toBe(true);
    const s = settings(project);
    expect(s.env).toEqual({ OTHER: "1", USE_BUILTIN_RIPGREP: "0" });
    expect(s.model).toBe("opus");
    expect(s.permissions.allow).toEqual(["Bash(bun *)", "Bash(rg *)"]);
    expect(readFileSync(project, "utf8").endsWith("\n")).toBe(true);
    // idempotent: the second run reports the value and writes the same bytes
    const before = readFileSync(project, "utf8");
    expect(report([project, "--user-settings", user]).action).toBe("already");
    expect(readFileSync(project, "utf8")).toBe(before);
  });

  test.if(HAVE_RG)("creates the project settings file when there is none", () => {
    const { project, user } = paths();
    expect(existsSync(project)).toBe(false);
    expect(report([project, "--user-settings", user]).action).toBe("set");
    expect(settings(project)).toEqual({ env: { USE_BUILTIN_RIPGREP: "0" } });
  });

  test.if(HAVE_RG)("a value at user scope is respected and the project file is not written", () => {
    const { project, user } = paths();
    writeFileSync(user, JSON.stringify({ env: { USE_BUILTIN_RIPGREP: "1" } }));
    const r = report([project, "--user-settings", user]);
    expect(r.action).toBe("user-scope");
    expect(by(r, "grep-tool").detail).toContain("user scope");
    expect(existsSync(project)).toBe(false);
  });

  test.if(HAVE_RG)("a foreign project value is reported, not overridden", () => {
    const { project, user } = paths();
    mkdirSync(join(dir, "project", ".claude"), { recursive: true });
    writeFileSync(project, JSON.stringify({ env: { USE_BUILTIN_RIPGREP: "1" } }));
    const r = report([project, "--user-settings", user]);
    expect(r.action).toBe("project-other");
    expect(by(r, "grep-tool").ok).toBe(false);
    expect(settings(project).env.USE_BUILTIN_RIPGREP).toBe("1");
  });

  test.if(HAVE_RG)("--dry-run writes nothing", () => {
    const { project, user } = paths();
    const r = report([project, "--user-settings", user, "--dry-run"]);
    expect(r.action).toBe("set");
    expect(by(r, "grep-tool").detail).toContain("--dry-run");
    expect(existsSync(project)).toBe(false);
  });

  test("no ripgrep on PATH: nothing is written, the install command is named, --strict fails", () => {
    const { project, user } = paths();
    const env = { PATH: join(dir, "empty-bin") };   // no rg here; bun itself is spawned before PATH changes
    mkdirSync(env.PATH);
    const r = report([project, "--user-settings", user], env);
    expect(r.rg).toBeNull();
    expect(r.action).toBe("skip-no-rg");
    expect(by(r, "rg").ok).toBe(false);
    expect(by(r, "rg").fix).toBeTruthy();
    expect(by(r, "rg").cost).toContain("rg: command not found");
    expect(by(r, "grep-tool").ok).toBe(true);       // leaving the bundled binary in place is the right outcome
    expect(existsSync(project)).toBe(false);
    expect(run([project, "--user-settings", user], env).code).toBe(0);
    expect(run([project, "--user-settings", user, "--strict"], env).code).toBe(1);
  });

  test("the grant check reports an absent Bash(rg *) with the /setup fix", () => {
    const { project, user } = paths();
    mkdirSync(join(dir, "project", ".claude"), { recursive: true });
    writeFileSync(project, JSON.stringify({ permissions: { allow: ["Bash(bun *)"] } }));
    const r = report([project, "--user-settings", user, "--dry-run"]);
    expect(by(r, "grant").ok).toBe(false);
    expect(by(r, "grant").fix).toContain("setup");
  });

  test("the human report lists every check with a mark", () => {
    const { project, user } = paths();
    const r = run([project, "--user-settings", user, "--dry-run"]);
    expect(r.code).toBe(0);
    expect(r.out.startsWith("ripgrep\n")).toBe(true);
    expect(r.out).toMatch(/[✅⬜] ripgrep on PATH:/);
    expect(r.out).toMatch(/[✅⬜] Grep tool binary:/);
  });
});
