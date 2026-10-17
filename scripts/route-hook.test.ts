import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const HOOK = resolve(import.meta.dir, "..", "hooks", "route-architecture-docs.sh");
function run(dir: string, stdin: string): string {
  const p = Bun.spawnSync(["sh", HOOK], { stdin: new TextEncoder().encode(stdin), env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  return p.stdout.toString();
}

describe("route-architecture-docs hook (8.91.0)", () => {
  const dir = mkdtempSync(join(tmpdir(), "hook-"));
  writeFileSync(join(dir, "ARCHITECTURE.md"), "# A\n");
  test("a prompt the user typed gets the routing context", () => {
    expect(run(dir, '{"prompt":"genera mi arquitectura"}')).toContain("UserPromptSubmit");
  });
  test("a sub-agent hand-back or a task notification gets nothing", () => {
    expect(run(dir, '{"prompt":"Another Claude session sent a message: <agent-message from=\\"x\\">"}')).toBe("");
    expect(run(dir, '{"prompt":"<task-notification><task-id>1</task-id></task-notification>"}')).toBe("");
  });
  test("a project without ARCHITECTURE.md gets nothing", () => {
    const empty = mkdtempSync(join(tmpdir(), "hook-"));
    expect(run(empty, '{"prompt":"hola"}')).toBe("");
    rmSync(empty, { recursive: true, force: true });
  });
});

describe("the plugin declares the hook (8.100.1)", () => {
  const cfg = JSON.parse(require("fs").readFileSync(resolve(import.meta.dir, "..", "hooks", "hooks.json"), "utf8"));
  const cmd: string = cfg.hooks.UserPromptSubmit[0].hooks[0].command;
  test("hooks/hooks.json runs the wrapper through ${CLAUDE_PLUGIN_ROOT}, never an absolute path", () => {
    expect(cmd).toBe('sh "${CLAUDE_PLUGIN_ROOT}/hooks/route-architecture-docs.sh"');
  });
  test("the command, expanded as Claude Code does, emits the payload", () => {
    const dir = mkdtempSync(join(tmpdir(), "hook-"));
    writeFileSync(join(dir, "ARCHITECTURE.md"), "# A\n");
    const p = Bun.spawnSync(["sh", "-c", cmd], { stdin: new TextEncoder().encode('{"prompt":"x"}'), env: { ...process.env, CLAUDE_PLUGIN_ROOT: resolve(import.meta.dir, ".."), CLAUDE_PROJECT_DIR: dir } });
    expect(p.stdout.toString()).toContain("UserPromptSubmit");
    rmSync(dir, { recursive: true, force: true });
  });
});
