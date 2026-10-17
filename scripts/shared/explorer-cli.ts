#!/usr/bin/env bun
// The architecture explorer as a CLI (in scripts/shared/; the old path under architecture-explorer-headers/utils/ still runs it) — replaces the `architecture-explorer` sub-agent (8.3.0).
//
//   bun explorer-cli.ts manifest <project_root> [--component-file <path>] [--json]
//   bun explorer-cli.ts findings <project_root> --query "<terms>" [--surface all|docs]
//                                [--component-file <path>] [--caller <name>] [--json]
//   bun explorer-cli.ts check <project_root> [--file <path>] [--json] [--warnings-as-errors]
//
// `check` holds every docs/NN-*.md and docs/components/**/*.md to the EXPLORER_HEADER contract —
// the closed key set the parser reads, required fields, position after the H1, one block, the
// file's own slug in component_self, components and related_adrs that exist on disk. Exit 1 on
// any error (or any warning with --warnings-as-errors): it is the gate every header writer runs.
//
// Output is the agent's fenced block — `EXPLORE_MANIFEST:` / `EXPLORE_FINDINGS:` followed by a
// ```yaml fence — so an orchestrator that trimmed and pasted the agent's reply keeps doing the
// same with this command's stdout. `--json` prints the object instead. `--caller` is accepted
// and ignored, as the agent documented it.
//
// Exit codes: 0 on any result including `status: FAILED` (consumers fail open on the status,
// not on the exit code); 1 when `check` finds an error; 2 on a bad invocation.
import { existsSync } from "fs";
import { checkHeaders, fence, findings, manifest, renderCheck, Surface } from "./explorer";

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`explorer-cli: ${msg}`);
  process.exit(2);
}
const flag = (name: string): string | undefined => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
const has = (name: string) => rest.includes(name);
const root = rest.find((a) => !a.startsWith("--") && rest[rest.indexOf(a) - 1]?.startsWith("--") !== true);

switch (subcommand) {
  case "manifest": {
    if (!root) fail("usage: manifest <project_root> [--component-file <path>] [--json]");
    if (!existsSync(root)) fail(`project_root does not exist: ${root}`);
    const out = manifest(root, { componentFile: flag("--component-file") });
    console.log(has("--json") ? JSON.stringify(out, null, 2) : fence("EXPLORE_MANIFEST", out));
    break;
  }
  case "findings": {
    if (!root) fail("usage: findings <project_root> --query \"<terms>\" [--surface all|docs] [--component-file <path>] [--json]");
    if (!existsSync(root)) fail(`project_root does not exist: ${root}`);
    const query = flag("--query");
    if (!query) fail("findings needs --query");
    const surface = (flag("--surface") || "all") as Surface;
    if (surface !== "all" && surface !== "docs") fail(`--surface must be all or docs (got ${surface})`);
    const out = findings(root, { query, surface, componentFile: flag("--component-file") });
    console.log(has("--json") ? JSON.stringify(out, null, 2) : fence("EXPLORE_FINDINGS", out));
    break;
  }
  case "check": {
    if (!root) fail("usage: check <project_root> [--file <path>] [--json] [--warnings-as-errors]");
    if (!existsSync(root)) fail(`project_root does not exist: ${root}`);
    const out = checkHeaders(root, { file: flag("--file") });
    console.log(has("--json") ? JSON.stringify(out, null, 2) : renderCheck(out));
    if (out.errors || (has("--warnings-as-errors") && out.warnings)) process.exit(1);
    break;
  }
  default:
    fail(`unknown subcommand "${subcommand ?? ""}". Expected: manifest, findings, check.`);
}
