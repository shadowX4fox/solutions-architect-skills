/**
 * session-cost.ts — a run's cost from its transcript: one API call is one turn even when Claude Code
 * writes it as several records sharing a requestId and the same usage; main and sidechain split; re-reads.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "session-cost.ts");
const TMP = join(import.meta.dir, ".temp-session-cost");

const rec = (o: any) => JSON.stringify({ type: "assistant", cwd: "/p/desk", version: "2.1.263", sessionId: "s1", ...o });
const usage = (input: number, write: number, read: number, output: number, thinking = 0) => ({ input_tokens: input, cache_creation_input_tokens: write, cache_read_input_tokens: read, output_tokens: output, output_tokens_details: { thinking_tokens: thinking } });
const msg = (model: string, content: any[], u: any) => ({ model, usage: u, content });

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
  const lines = [
    JSON.stringify({ type: "user", message: { content: "go" } }),
    // one API call written as two records — thinking, then tool_use — SAME usage: counted once
    rec({ requestId: "r1", timestamp: "2026-09-08T10:00:00Z", isSidechain: false, message: msg("claude-opus-5", [{ type: "thinking" }], usage(10, 20000, 100000, 500, 200)) }),
    rec({ requestId: "r1", timestamp: "2026-09-08T10:00:01Z", isSidechain: false, message: msg("claude-opus-5", [{ type: "tool_use", name: "Read", input: { file_path: "/p/desk/docs/01.md" } }], usage(10, 20000, 100000, 500, 200)) }),
    // a second main call that reads the same file again
    rec({ requestId: "r2", timestamp: "2026-09-08T10:01:00Z", isSidechain: false, message: msg("claude-opus-5", [{ type: "tool_use", name: "Read", input: { file_path: "/p/desk/docs/01.md" } }, { type: "tool_use", name: "Agent", input: { subagent_type: "section-generator" } }], usage(5, 1000, 130000, 300)) }),
    // the sub-agent's own turns
    rec({ requestId: "r3", timestamp: "2026-09-08T10:02:00Z", isSidechain: true, message: msg("claude-sonnet-5", [{ type: "tool_use", name: "Write", input: { file_path: "/p/desk/docs/02.md" } }], usage(0, 30000, 0, 4000, 100)) }),
    rec({ requestId: "r4", timestamp: "2026-09-08T10:03:00Z", isSidechain: true, message: msg("claude-sonnet-5", [{ type: "text", text: "done" }], usage(0, 0, 30000, 200)) }),
    // noise the reader must skip
    JSON.stringify({ type: "attachment" }), "not json at all", "",
  ];
  writeFileSync(join(TMP, "s1.jsonl"), lines.join("\n") + "\n");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const run = (...a: string[]) => { const r = Bun.spawnSync(["bun", SCRIPT, join(TMP, "s1.jsonl"), ...a], { stdout: "pipe", stderr: "pipe" }); return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() }; };

describe("session-cost", () => {
  test("records sharing a requestId are one API call: usage once, tool calls merged", () => {
    const j = JSON.parse(run("--json").out);
    expect(j.records).toBe(5); expect(j.requests).toBe(4); expect(j.split_requests).toBe(1);
    expect(j.totals.output).toBe(500 + 300 + 4000 + 200);                 // r1 counted once, not twice
    expect(j.totals.write).toBe(20000 + 1000 + 30000);
    expect(j.totals.paid).toBe(j.totals.input + j.totals.write + j.totals.output);
    expect(j.tools).toEqual({ Read: 2, Agent: 1, Write: 1 });
  });

  test("main session and sidechains are split — the delegation ratio — with the context each carried per turn", () => {
    const j = JSON.parse(run("--json").out);
    expect(j.main).toMatchObject({ turns: 2, output: 800, peak_context: 131005 });
    expect(j.main.avg_context_per_turn).toBe(Math.round((120010 + 131005) / 2));
    expect(j.sidechain).toMatchObject({ turns: 2, output: 4200, peak_context: 30000 });
    expect(Object.keys(j.by_model).sort()).toEqual(["claude-opus-5", "claude-sonnet-5 (sidechain)"]);
  });

  test("a path Read more than once is named — the payload should have carried it", () => {
    const j = JSON.parse(run("--json").out);
    expect(j.reread).toEqual([["/p/desk/docs/01.md", 2]]);
    expect(run().out).toMatch(/re-read \(1 path\(s\)[\s\S]*2×  \/p\/desk\/docs\/01\.md/);
  });

  test("the human report leads with the deduplicated call count and the paid / attended split", () => {
    const r = run("--top", "2");
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^Session cost — desk .* 4 API calls from 5 records \(1 split — usage counted once\)/);
    expect(r.out).toMatch(/PAID \(input \+ cache write \+ output\)\s+56\.0K\s+ATTENDED/);
    expect(r.out).toMatch(/sidechains \(sub-agents\)\s+2 turns/);
    expect(r.out.match(/^\s+[\d.]+K? paid/gm)!.length).toBe(2);
  });

  test("--since / --until cut a run out of a longer session", () => {
    const j = JSON.parse(run("--json", "--since", "2026-09-08T10:01:30Z").out);
    expect(j.requests).toBe(2); expect(j.main.turns).toBe(0); expect(j.sidechain.turns).toBe(2);
  });
});
