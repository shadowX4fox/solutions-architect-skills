/**
 * One-shot repair: stop telling Bash-less agents to run a Bash command.
 *
 * The shared "Component Naming Fidelity" block instructs every agent to resolve
 * canonical component names by running
 * `bun .../component-cli.ts list <project_root>`. Seventeen of the twenty-one
 * agents declare no Bash tool (the ten validators are `Read, Grep`; the four
 * Ekonte generators and handoff-asset-generator are `Read, Write`;
 * architecture-explorer is `Read, Glob, Grep`; principle-quality-reviewer is
 * `Read, Grep, Glob`), so for them the instruction is unexecutable.
 *
 * Tool minimalism is the right trade here: rather than granting 17 agents Bash,
 * point them at the authority they can already reach — the component file's H1
 * via Read — and at the name the orchestrator already resolved for them.
 *
 * Agents that DO declare Bash keep the CLI instruction unchanged.
 *
 * Idempotent. Usage: bun scripts/fix-naming-fidelity-tooling.ts [--dry-run]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const AGENTS_DIR = resolve(import.meta.dir, "..", "agents");
const dryRun = process.argv.includes("--dry-run");

/** The Bash-dependent sentence, as it appears today. */
const CLI_VARIANT = `**Where the canonical name comes from**: the component file's H1 is
authoritative. Load it with
\`bun [plugin_dir]/skills/architecture-component-guardian/utils/component-cli.ts list <project_root>\`
and read the \`name\` field of the entry whose \`path\` is that component file.`;

/** The Read-only replacement for agents without Bash. */
const READ_VARIANT = `**Where the canonical name comes from**: the component file's H1 is
authoritative. Read that file under \`docs/components/\` and take its H1
verbatim. When the component file is not among your inputs, use the canonical
name exactly as your prompt or payload supplied it — the orchestrator resolves
names through \`component-cli.ts list\` before spawning you. You have no Bash
tool; never attempt to run that CLI yourself.`;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith(".md")) out.push(p);
  }
  return out;
}

function declaresBash(text: string): boolean {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const tools = fm?.[1].match(/^tools:\s*(.+)$/m)?.[1] ?? "";
  return /\bBash\b/.test(tools);
}

type Status = "rewritten" | "kept-cli" | "already-ok" | "skipped";

function main(): void {
  const results: Array<{ file: string; status: Status; reason?: string }> = [];

  for (const file of walk(AGENTS_DIR).sort()) {
    const rel = file.replace(AGENTS_DIR, "agents").split("\\").join("/");
    const raw = readFileSync(file, "utf-8");
    const eol = raw.includes("\r\n") ? "\r\n" : "\n";
    // Compare in LF so a CRLF checkout matches the literals above.
    const lf = raw.split("\r\n").join("\n");

    if (declaresBash(lf)) {
      results.push({ file: rel, status: "kept-cli" });
      continue;
    }
    if (lf.includes(READ_VARIANT)) {
      results.push({ file: rel, status: "already-ok" });
      continue;
    }
    if (!lf.includes(CLI_VARIANT)) {
      results.push({ file: rel, status: "skipped", reason: "shared block not found in expected form" });
      continue;
    }

    const updated = lf.split(CLI_VARIANT).join(READ_VARIANT);
    if (!dryRun) writeFileSync(file, eol === "\n" ? updated : updated.split("\n").join("\r\n"));
    results.push({ file: rel, status: "rewritten" });
  }

  for (const r of results) {
    const label = r.status === "rewritten" ? (dryRun ? "WOULD FIX" : "FIXED    ") : r.status.toUpperCase().padEnd(9);
    console.log(`${label} ${r.file}${r.reason ? `  (${r.reason})` : ""}`);
  }

  const fixed = results.filter(r => r.status === "rewritten").length;
  const skipped = results.filter(r => r.status === "skipped").length;
  const kept = results.filter(r => r.status === "kept-cli").length;
  console.log(`\n${fixed} ${dryRun ? "would be rewritten" : "rewritten"}, ${kept} keep the CLI route, ${skipped} skipped.`);
  if (skipped > 0) process.exit(1);
}

main();
