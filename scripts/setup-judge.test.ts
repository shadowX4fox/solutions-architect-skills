/**
 * setup-judge.ts — the judge engine in force, the key, the probe. Rules under test: no SA_JUDGE means
 * agent, written to the project settings (never over a value any scope sets), and every check passes without a key; an unknown SA_JUDGE is a failing check; the
 * typesafe engine without a key fails the key check and --strict exits 1; a key inside the project
 * settings is refused; with a key the probe sends one item and reports the model that answered;
 * --no-probe skips it; the value of the key never appears in the report.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "setup-judge.ts");
type Check = { id: string; ok: boolean; detail: string; fix?: string };
type Report = { engine: string; keySet: boolean; leaked: boolean; canAnswer: boolean; probe: any; checks: Check[] };

let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "setup-judge-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

/** A clean environment: the machine's own SA_JUDGE / key never leak into a test. */
const clean = (env: Record<string, string> = {}) => {
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !/^(SA_JUDGE|SA_JUDGE_MODEL|TYPESAFE_API_KEY|CLOUDFLARE_.*|CLEF_ENDPOINT)$/.test(k)) base[k] = v;
  return { ...base, ...env };
};
const run = (args: string[], env: Record<string, string> = {}) => {
  const r = Bun.spawnSync([process.execPath, SCRIPT, dir, "--user-settings", join(dir, "no-user-settings.json"), ...args], { stdout: "pipe", stderr: "pipe", env: clean(env) });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};
const report = (args: string[], env: Record<string, string> = {}): Report => JSON.parse(run(["--json", ...args], env).out);
/** The probe tests serve a fake API from this process, so the child must run while the event loop is free: spawn, never spawnSync. */
const runAsync = async (args: string[], env: Record<string, string> = {}) => {
  const p = Bun.spawn([process.execPath, SCRIPT, dir, "--user-settings", join(dir, "no-user-settings.json"), ...args], { stdout: "pipe", stderr: "pipe", env: clean(env) });
  const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  return { code, out, err };
};
const reportAsync = async (args: string[], env: Record<string, string> = {}): Promise<Report> => JSON.parse((await runAsync(["--json", ...args], env)).out);
const by = (r: Report, id: string) => r.checks.find((c) => c.id === id)!;

describe("setup-judge", () => {
  test("no SA_JUDGE means agent, written to the project settings; a value any scope sets is left alone", () => {
    const dry = report(["--no-probe", "--dry-run"]);
    expect(dry.engine).toBe("agent"); expect(existsSync(join(dir, ".claude", "settings.json"))).toBe(false);
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ permissions: { allow: ["Bash(rg *)"] } }));
    const r = report(["--no-probe"]);
    const written = JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8"));
    expect(written.env.SA_JUDGE).toBe("agent"); expect(written.permissions.allow).toEqual(["Bash(rg *)"]);
    expect(by(r, "engine").detail).toContain("written to");
    expect(by(report(["--no-probe"]), "engine").detail).toContain("set in");
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ env: { SA_JUDGE: "clef" } }));
    const c = report(["--no-probe"]);
    expect(c.engine).toBe("clef"); expect(c.canAnswer).toBe(false);                       // no Cloudflare credentials in the child's env
    expect(by(c, "clef-cred").ok).toBe(false); expect(by(c, "clef-cred").fix).toContain("CLOUDFLARE_API_TOKEN");
    expect(JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8")).env.SA_JUDGE).toBe("clef");
    const ready = report(["--no-probe"], { CLOUDFLARE_ACCOUNT_ID: "acct", CLOUDFLARE_API_TOKEN: "tok", CLOUDFLARE_AI_GATEWAY_ID: "lab-gw" });
    expect(by(ready, "clef-cred").ok).toBe(true); expect(by(ready, "clef-gateway").detail).toContain("lab-gw"); expect(ready.canAnswer).toBe(true);
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ env: { SA_JUDGE: "claude" } }));
    expect(by(report(["--no-probe"]), "engine").ok).toBe(false);                             // replaced by clef in 8.120.0
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ env: { SA_JUDGE: "clef" } }));
    expect(report(["--no-probe"], { SA_JUDGE: "typesafe" }).engine).toBe("typesafe");
    expect(r.engine).toBe("agent"); expect(r.canAnswer).toBe(true);
    expect(by(r, "engine").ok).toBe(true); expect(by(r, "key").ok).toBe(true);
    expect(by(r, "key").detail).toContain("only the typesafe engine");
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ env: { SA_JUDGE: "agent" } }));
    expect(run(["--no-probe", "--strict"]).code).toBe(0);
  });
  test("SA_JUDGE=heuristic in the settings is an error that names the removal and the fix, never offered", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ env: { SA_JUDGE: "heuristic" } }));
    const r = report(["--no-probe"]);
    expect(by(r, "engine").ok).toBe(false); expect(r.canAnswer).toBe(false);
    expect(by(r, "engine").detail).toContain("removed in 8.119.0");
    expect(by(r, "engine").fix).toContain("SA_JUDGE=agent"); expect(by(r, "engine").fix).not.toContain("heuristic");
    expect(JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8")).env.SA_JUDGE).toBe("heuristic");   // reported, never rewritten
    expect(run(["--no-probe", "--strict"]).code).toBe(1);
  });
  test("an unknown SA_JUDGE is a failing check", () => {
    const r = report(["--no-probe"], { SA_JUDGE: "oracle" });
    expect(by(r, "engine").ok).toBe(false); expect(by(r, "engine").fix).toContain("SA_JUDGE");
    expect(run(["--no-probe", "--strict"], { SA_JUDGE: "oracle" }).code).toBe(1);
  });
  test("the typesafe engine without a key cannot answer, and --strict says so", () => {
    const r = report(["--no-probe"], { SA_JUDGE: "typesafe" });
    expect(r.keySet).toBe(false); expect(by(r, "key").ok).toBe(false); expect(by(r, "key").fix).toContain("console.typesafe.ai");
    expect(r.canAnswer).toBe(false);
    expect(run(["--no-probe", "--strict"], { SA_JUDGE: "typesafe" }).code).toBe(1);
    expect(run(["--no-probe"], { SA_JUDGE: "typesafe" }).code).toBe(0);
  });
  test("a key inside the project settings is refused, and its value never prints", () => {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude", "settings.json"), JSON.stringify({ env: { TYPESAFE_API_KEY: "apikey_should_not_print" } }));
    const { out } = run(["--json", "--no-probe"], { TYPESAFE_API_KEY: "apikey_should_not_print" });
    const r: Report = JSON.parse(out);
    expect(r.leaked).toBe(true); expect(by(r, "key-place").ok).toBe(false);
    expect(out).not.toContain("apikey_should_not_print");
    expect(run(["--no-probe"], { TYPESAFE_API_KEY: "apikey_should_not_print" }).out).not.toContain("apikey_should_not_print");
  });
  test("with a key the probe sends one item and reports the model that answered", async () => {
    const seen: any[] = [];
    const server = Bun.serve({ port: 0, fetch: async (req) => { seen.push(await req.json()); return Response.json({ model: "jev-test", answers: { p1: { type: "noul", noul: 0.97 } }, usage: { input_tokens: 5, output_tokens: 1 } }); } });
    try {
      const r = await reportAsync(["--endpoint", `http://127.0.0.1:${server.port}/`], { SA_JUDGE: "typesafe", TYPESAFE_API_KEY: "k" });
      expect(seen.length).toBe(1); expect(Object.keys(seen[0].questions)).toEqual(["p1"]);
      expect(r.probe.ok).toBe(true); expect(by(r, "probe").detail).toContain("jev-test"); expect(r.canAnswer).toBe(true);
      const skipped = await reportAsync(["--no-probe"], { SA_JUDGE: "typesafe", TYPESAFE_API_KEY: "k" });
      expect(by(skipped, "probe").detail).toContain("skipped"); expect(seen.length).toBe(1);
    } finally { server.stop(true); }
  });
  test("a probe the API refuses is a failing check and a strict exit", async () => {
    const server = Bun.serve({ port: 0, fetch: () => new Response("bad key", { status: 401 }) });
    try {
      const r = await reportAsync(["--endpoint", `http://127.0.0.1:${server.port}/`], { SA_JUDGE: "typesafe", TYPESAFE_API_KEY: "k" });
      expect(r.probe.ok).toBe(false); expect(by(r, "probe").detail).toContain("401"); expect(r.canAnswer).toBe(false);
      expect((await runAsync(["--endpoint", `http://127.0.0.1:${server.port}/`, "--strict"], { SA_JUDGE: "typesafe", TYPESAFE_API_KEY: "k" })).code).toBe(1);
    } finally { server.stop(true); }
  });
});
