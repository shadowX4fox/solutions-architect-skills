/**
 * setup-permissions.ts — the merge is non-destructive and sweeps what the plugin retired: since 8.31.0 the
 * `section-generator` grant goes and, since 8.100.3, the `section-writer` one with it; the example's grants come in.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "setup-permissions.ts");
const EXAMPLE = join(import.meta.dir, "..", ".claude", "settings.json.example");
const TMP = join(import.meta.dir, ".temp-setup-permissions");
const USER = join(TMP, ".claude", "settings.json");

beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); mkdirSync(join(TMP, ".claude"), { recursive: true });
  writeFileSync(USER, JSON.stringify({ model: "opus", permissions: { allow: ["Bash(bun *)", "Agent(sa-skills:generators:section-generator)", "Agent(sa-skills:generators:section-writer)", "Read(mine/*)", "Write(mine/*)", "Glob(docs/**)", "Edit(analysis/*)", "Write"] } }, null, 2)); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("setup-permissions", () => {
  test("sweeps the retired section-generator and section-writer grants, adds the example's, keeps the user's own entries", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const out = r.stdout.toString();
    expect(out).toMatch(/Permissions: {2}added \d+ {2}· {2}already present 2 {2}· {2}retired 2 {2}· {2}rewritten 2/);
    expect(out).toMatch(/- Write\(mine\/\*\) → Edit\(mine\/\*\)\n\s+- Glob\(docs\/\*\*\) → Read\(docs\/\*\*\)/);
    expect(out).toMatch(/Swept 2 retired permission grants:\n\s+- Agent\(sa-skills:generators:section-generator\)\n\s+- Agent\(sa-skills:generators:section-writer\)/);
    const s = JSON.parse(readFileSync(USER, "utf-8"));
    expect(s.model).toBe("opus");                                                         // untouched
    expect(s.permissions.allow).toContain("Read(mine/*)");                               // the user's, kept
    expect(s.permissions.allow).toContain("Edit(mine/*)");                               // Write(path) → Edit(path)
    expect(s.permissions.allow).toContain("Read(docs/**)");                              // Glob(path) → Read(path)
    expect(s.permissions.allow).toContain("Write");                                      // the bare tool grant is valid
    expect(s.permissions.allow.filter((x: string) => /^(Write|Glob)\(/.test(x))).toEqual([]);
    expect(s.permissions.allow.filter((x: string) => x === "Edit(analysis/*)").length).toBe(1); // the example's dedupes
    expect(s.permissions.allow).toContain("Agent(sa-skills:generators:segment-runner)");
    expect(s.permissions.allow).not.toContain("Agent(sa-skills:generators:section-writer)");
    expect(s.permissions.allow).not.toContain("Agent(sa-skills:generators:section-generator)");
    expect(s.permissions.allow.filter((x: string) => x === "Bash(bun *)").length).toBe(1);   // no duplicate
  });
  test("the routing hook is the plugin's: a stale settings path is swept, the user's own hook is kept, none is added", () => {
    const u = JSON.parse(readFileSync(USER, "utf-8"));
    u.hooks = { UserPromptSubmit: [{ hooks: [
      { type: "command", command: "sh /home/x/.claude/plugins/cache/shadowx4fox-solution-architect-marketplace/sa-skills/8.99.0/hooks/route-architecture-docs.sh" },
      { type: "command", command: "echo mine" },
    ] }] };
    writeFileSync(USER, JSON.stringify(u, null, 2));
    const r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toMatch(/Hooks: {8}added 0 {2}· {2}already present 0 {2}· {2}retired 1/);
    const cmds = JSON.parse(readFileSync(USER, "utf-8")).hooks.UserPromptSubmit.flatMap((e: any) => e.hooks.map((h: any) => h.command));
    expect(cmds).toEqual(["echo mine"]);
  });
  test("a second run is idempotent: nothing added, nothing retired", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe" });
    expect(r.stdout.toString()).toMatch(/Permissions: {2}added 0 {2}· {2}already present \d+ {2}· {2}retired 0 {2}· {2}rewritten 0/);
    expect(r.stdout.toString()).toMatch(/Hooks: {8}added 0 {2}· {2}already present 0 {2}· {2}retired 0/);
  });
  test("Windows without Git Bash: the PowerShell wrapper by the marketplace-clone path, written once, and removed where sh runs", () => {
    const env = { ...process.env, SA_HOOK_SHELL: "powershell", CLAUDE_CONFIG_DIR: join(TMP, "cfg") };
    const ps1 = (u: any) => (u.hooks?.UserPromptSubmit ?? []).flatMap((e: any) => e.hooks).filter((h: any) => h.shell === "powershell");
    let r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe", env });
    expect(r.stdout.toString()).toMatch(/Hooks: {8}added 1 {2}· {2}already present 0 {2}· {2}retired 0/);
    let h = ps1(JSON.parse(readFileSync(USER, "utf-8")));
    expect(h).toEqual([{ type: "command", shell: "powershell", command: `& '${join(TMP, "cfg", "plugins", "marketplaces", "shadowx4fox-solution-architect-marketplace", "hooks", "route-architecture-docs.ps1")}'` }]);
    r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe", env });
    expect(r.stdout.toString()).toMatch(/Hooks: {8}added 0 {2}· {2}already present 1 {2}· {2}retired 0/);
    expect(ps1(JSON.parse(readFileSync(USER, "utf-8"))).length).toBe(1);
    r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe", env: { ...env, SA_HOOK_SHELL: "sh" } });
    expect(r.stdout.toString()).toMatch(/Hooks: {8}added 0 {2}· {2}already present 0 {2}· {2}retired 1/);
    expect(ps1(JSON.parse(readFileSync(USER, "utf-8")))).toEqual([]);
  });
  test("when the routing hook was the only one, the whole hooks block goes (8.100.1 reported it retired and kept it)", () => {
    const u = JSON.parse(readFileSync(USER, "utf-8"));
    u.hooks = { UserPromptSubmit: [{ hooks: [{ type: "command", command: "sh /home/x/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/hooks/route-architecture-docs.sh" }] }] };
    writeFileSync(USER, JSON.stringify(u, null, 2));
    const r = Bun.spawnSync(["bun", SCRIPT, EXAMPLE, USER], { stdout: "pipe", stderr: "pipe", env: { ...process.env, SA_HOOK_SHELL: "sh" } });
    expect(r.stdout.toString()).toMatch(/retired 1/);
    expect(JSON.parse(readFileSync(USER, "utf-8")).hooks).toBeUndefined();
  });
});
