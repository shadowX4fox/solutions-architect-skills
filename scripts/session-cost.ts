#!/usr/bin/env bun
/**
 * session-cost.ts — what a Claude Code session cost, read from its transcript.
 *
 *   bun scripts/session-cost.ts <session.jsonl | project-transcript-dir> [--top N] [--json] [--since <ISO>] [--until <ISO>]
 *
 * The token plan's stage 4 (delegation) is judged by one number the orchestrator cannot see from inside:
 * how much context the MAIN session carried across a run, and how much the sub-agents carried instead.
 * The first controlled run (2026-09-07) was measured by hand — 488K total, 452K in messages — and the
 * number could not be re-derived. This script derives it, the same way every time, from the transcript
 * Claude Code writes under ~/.claude/projects/<cwd-slug>/<session>.jsonl:
 *
 *   totals        input · cache write · cache read · output (thinking inside it) · turns · wall time
 *   main vs side  every assistant record carries `isSidechain`: false is the orchestrator's own context,
 *                 true is a sub-agent's — the split IS the delegation ratio
 *   per model     opus / sonnet / haiku turns and tokens, so a pinned generator shows up where it should
 *   tools         tool_use counts by name; every Read of the same path more than once is listed — the
 *                 "an input the payload carries is never re-read" rule made visible
 *   top turns     the N most expensive turns by (cache write + input + output), with their tool calls,
 *                 because the shape of a cost is one or two turns, not an average
 *
 * `cache read` is billed at a fraction of input but it is still bytes the model attends to on every
 * turn; the plan's 40K target is about the context re-sent per turn, and `avg context/turn` reports it.
 * Read-only; never modifies a transcript. `--since/--until` cut a run out of a longer session.
 *
 * SUB-AGENTS LIVE NEXT DOOR. Since Claude Code 2.1.26x a sub-agent's turns are not in the session's file:
 * they are written to <session-id>/subagents/agent-<id>.jsonl beside it, every record `isSidechain: true`
 * with an `attributionAgent` naming the agent. The first measurement of a delegated run (8.30.0, 23 Agent
 * calls) read only the top-level file and reported "nothing was delegated". A session file therefore pulls
 * in its <session-id>/subagents/ directory, and a project directory pulls in every session's.
 *
 * ONE API CALL IS ONE TURN. Claude Code writes an assistant response as several JSONL records — the
 * thinking block, then the tool_use block — that share a `requestId` and carry the SAME usage object.
 * Summing records double-counts: the 2026-09-07 hand measurement reported 452K output for a run whose
 * real output was 192K (79 of 101 requests were split). Records are grouped by requestId here, the usage
 * taken once, and the tool calls of every record in the group attributed to that one turn.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

type Usage = { input_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number; output_tokens?: number; output_tokens_details?: { thinking_tokens?: number } };
type Turn = { ts: string; side: boolean; agent: string; model: string; usage: Usage; tools: { name: string; arg?: string }[]; text: number; records: number };

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
if (!target) { console.error("Usage: bun scripts/session-cost.ts <session.jsonl | dir> [--top N] [--json] [--since ISO] [--until ISO]"); process.exit(2); }

const subagentFiles = (sessionFile: string) => { const d = join(sessionFile.replace(/\.jsonl$/, ""), "subagents"); try { return readdirSync(d).filter((f) => f.endsWith(".jsonl")).map((f) => join(d, f)); } catch { return []; } };
const sessionFiles = statSync(target).isDirectory() ? readdirSync(target).filter((f) => f.endsWith(".jsonl")).map((f) => join(target, f)) : [target];
const files = sessionFiles.flatMap((f) => [f, ...subagentFiles(f)]);
const since = opt("--since"), until = opt("--until");
const TOP = parseInt(opt("--top") || "8", 10);

const byRequest = new Map<string, Turn>();
let sessionId = "", version = "", cwd = "", records = 0;
for (const f of files) {
  for (const line of readFileSync(f, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    let o: any; try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== "assistant" || !o.message || !o.message.usage) continue;
    if (since && o.timestamp < since) continue;
    if (until && o.timestamp > until) continue;
    sessionId = sessionId || o.sessionId || o.session_id || ""; version = version || o.version || ""; cwd = cwd || o.cwd || "";
    const tools: Turn["tools"] = []; let text = 0;
    for (const b of o.message.content || []) {
      if (b.type === "tool_use") {
        const inp = b.input || {};
        const arg = inp.file_path || inp.command || inp.skill || inp.subagent_type || inp.description || inp.pattern || "";
        tools.push({ name: b.name, arg: String(arg).slice(0, 90) });
      } else if (b.type === "text") text += (b.text || "").length;
    }
    records++;
    const key = o.requestId || o.message.id || `${f}:${o.uuid}`;
    const prev = byRequest.get(key);
    if (prev) { prev.tools.push(...tools); prev.text += text; prev.records++; prev.usage = o.message.usage; }   // same call, later record: same usage, more blocks
    else byRequest.set(key, { ts: o.timestamp, side: !!o.isSidechain, agent: o.isSidechain ? (o.attributionAgent || o.agentId || "sub-agent") : "main", model: o.message.model || "?", usage: o.message.usage, tools, text, records: 1 });
  }
}
const turns = [...byRequest.values()];
if (!turns.length) { console.error("session-cost: no assistant records with usage in " + target); process.exit(2); }
turns.sort((a, b) => a.ts.localeCompare(b.ts));
const splitRequests = turns.filter((t) => t.records > 1).length;

const n = (x?: number) => x || 0;
const sum = (ts: Turn[]) => ts.reduce((a, t) => ({
  input: a.input + n(t.usage.input_tokens), write: a.write + n(t.usage.cache_creation_input_tokens), read: a.read + n(t.usage.cache_read_input_tokens),
  output: a.output + n(t.usage.output_tokens), thinking: a.thinking + n(t.usage.output_tokens_details?.thinking_tokens), turns: a.turns + 1,
}), { input: 0, write: 0, read: 0, output: 0, thinking: 0, turns: 0 });
const cost = (t: Turn) => n(t.usage.input_tokens) + n(t.usage.cache_creation_input_tokens) + n(t.usage.output_tokens);   // what was newly paid for this turn
const ctx = (t: Turn) => n(t.usage.input_tokens) + n(t.usage.cache_creation_input_tokens) + n(t.usage.cache_read_input_tokens);   // the context the model attended to

const main = turns.filter((t) => !t.side), side = turns.filter((t) => t.side);
const all = sum(turns), m = sum(main), s = sum(side);
const byModel: Record<string, ReturnType<typeof sum>> = {};
for (const t of turns) { const k = `${t.model}${t.side ? " (sidechain)" : ""}`; byModel[k] = sum(turns.filter((x) => `${x.model}${x.side ? " (sidechain)" : ""}` === k)); }
const byAgent: Record<string, ReturnType<typeof sum> & { calls: number }> = {};
for (const t of side) { const k = t.agent.replace(/^sa-skills:/, ""); const cur = byAgent[k] || { input: 0, write: 0, read: 0, output: 0, thinking: 0, turns: 0, calls: 0 }; const one = sum([t]); for (const f of ["input", "write", "read", "output", "thinking", "turns"] as const) cur[f] += one[f]; byAgent[k] = cur; }
const agentIds: Record<string, Set<string>> = {}; for (const f of files) { const m = f.match(/subagents[\/\\]agent-([0-9a-f]+)\.jsonl$/); if (m) { let ag = "sub-agent"; try { const first = readFileSync(f, "utf-8").split("\n").find((l) => l.includes('"attributionAgent"')); if (first) ag = (JSON.parse(first).attributionAgent || ag).replace(/^sa-skills:/, ""); } catch {} (agentIds[ag] = agentIds[ag] || new Set()).add(m[1]); } }
for (const k of Object.keys(byAgent)) byAgent[k].calls = (agentIds[k] || new Set()).size;
const toolCounts: Record<string, number> = {}; const reads: Record<string, number> = {};
for (const t of turns) for (const u of t.tools) { toolCounts[u.name] = (toolCounts[u.name] || 0) + 1; if (u.name === "Read" && u.arg) reads[u.arg] = (reads[u.arg] || 0) + 1; }
const reread = Object.entries(reads).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
const wall = (new Date(turns[turns.length - 1].ts).getTime() - new Date(turns[0].ts).getTime()) / 60000;
const avgCtx = (ts: Turn[]) => ts.length ? Math.round(ts.reduce((a, t) => a + ctx(t), 0) / ts.length) : 0;
const peakCtx = (ts: Turn[]) => ts.length ? Math.max(...ts.map(ctx)) : 0;
const top = [...turns].sort((a, b) => cost(b) - cost(a)).slice(0, TOP);

const report = {
  session: sessionId, claude_code_version: version, cwd, files: files.length, wall_minutes: Math.round(wall),
  records, requests: turns.length, split_requests: splitRequests,
  totals: { ...all, paid: all.input + all.write + all.output, attended: all.input + all.write + all.read },
  main: { ...m, avg_context_per_turn: avgCtx(main), peak_context: peakCtx(main) },
  sidechain: { ...s, avg_context_per_turn: avgCtx(side), peak_context: peakCtx(side) },
  by_model: byModel, by_agent: byAgent, tools: toolCounts, reread,
  top_turns: top.map((t) => ({ ts: t.ts, side: t.side, model: t.model, paid: cost(t), context: ctx(t), output: n(t.usage.output_tokens), tools: t.tools.map((u) => `${u.name}${u.arg ? "(" + u.arg + ")" : ""}`) })),
};

if (args.includes("--json")) { console.log(JSON.stringify(report, null, 1)); process.exit(0); }

const K = (x: number) => (x >= 1000 ? (x / 1000).toFixed(x >= 100000 ? 0 : 1) + "K" : String(x));
const row = (label: string, r: ReturnType<typeof sum>) => `  ${label.padEnd(26)} ${String(r.turns).padStart(4)} turns   in ${K(r.input).padStart(6)}  cache-write ${K(r.write).padStart(7)}  cache-read ${K(r.read).padStart(8)}  out ${K(r.output).padStart(6)} (thinking ${K(r.thinking)})`;
console.log(`Session cost — ${cwd.split("/").slice(-1)[0] || sessionId}  ·  Claude Code ${version}  ·  ${sessionFiles.length} session file(s) + ${files.length - sessionFiles.length} sub-agent file(s)  ·  ${Math.round(wall)} min wall  ·  ${turns.length} API calls from ${records} records (${splitRequests} split — usage counted once)`);
console.log(`\n  PAID (input + cache write + output)     ${K(report.totals.paid).padStart(8)}      ATTENDED (context re-sent, all turns)  ${K(report.totals.attended)}`);
console.log(row("all turns", all));
console.log(row("main session", m) + `   avg context/turn ${K(report.main.avg_context_per_turn)}  peak ${K(report.main.peak_context)}`);
console.log(row("sidechains (sub-agents)", s) + (s.turns ? `   avg context/turn ${K(report.sidechain.avg_context_per_turn)}  peak ${K(report.sidechain.peak_context)}` : "   — none: nothing was delegated"));
if (Object.keys(byAgent).length) { console.log("\n  by agent (sidechains)"); for (const [k, v] of Object.entries(byAgent).sort((a, b) => b[1].turns - a[1].turns)) console.log(row(`  ${k}`, v) + `   ${v.calls} call(s), ${v.turns ? Math.round(v.turns / Math.max(1, v.calls)) : 0} turns/call`); }
console.log("\n  by model");
for (const [k, v] of Object.entries(byModel).sort((a, b) => b[1].turns - a[1].turns)) console.log(row("  " + k, v));
console.log("\n  tools  " + Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · "));
if (reread.length) { console.log(`\n  re-read (${reread.length} path(s) Read more than once — the payload should have carried them)`); reread.slice(0, 12).forEach(([p, c]) => console.log(`    ${String(c).padStart(2)}×  ${p}`)); }
console.log(`\n  top ${top.length} turns by what they paid`);
top.forEach((t) => console.log(`    ${K(cost(t)).padStart(6)} paid  ${K(ctx(t)).padStart(6)} ctx  out ${K(n(t.usage.output_tokens)).padStart(5)}  ${t.side ? "side" : "main"} ${t.model.replace("claude-", "")}  ${t.tools.map((u) => `${u.name}${u.arg ? "(" + u.arg.slice(0, 48) + ")" : ""}`).join(", ").slice(0, 110) || "(text)"}`));
