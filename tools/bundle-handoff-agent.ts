#!/usr/bin/env bun
/**
 * Bundles static reference files into the architecture-dev-handoff sub-agents
 * between BEGIN_BUNDLE/END_BUNDLE markers. Targets are the five Ekonte-kit
 * generators listed in BUNDLE_TARGETS below. Bundled content lives in the
 * sub-agent system prompt and is API-prompt-cached across all spawns within
 * the orchestration window — saving ~300K tokens per 8-component run vs.
 * fresh per-spawn Reads.
 *
 * Usage:
 *   bun tools/bundle-handoff-agent.ts            # writes every target in place
 *   bun tools/bundle-handoff-agent.ts --check    # exits 1 if any agent file would change
 *
 * Source-of-truth files stay where they are. Maintainer workflow: edit a
 * source file, run `bun run bundle:handoff-agent`, commit both.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, join, relative, sep } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const SKILL_DIR = join(REPO_ROOT, "plugins/sa-delivery/skills/architecture-dev-handoff");

/**
 * Line-ending and separator handling — why this exists.
 *
 * The repo is checked out with CRLF on Windows (git core.autocrlf) and LF on
 * Linux/macOS. This tool splices bundled content between markers, and the
 * splice inserts newlines of its own. If it inserts a literal "\n" into a CRLF
 * file, the rebuilt string differs from the file on disk by exactly the two
 * inserted bytes — so `--check` reported every target as out of sync on every
 * Windows checkout, permanently, regardless of content.
 *
 * The fix is to do all internal work in LF, compare in LF, and restore the
 * target file's own ending on write. On Linux both conversions are
 * no-ops; on Windows the file keeps its CRLF and the comparison stops being
 * a line-ending test.
 */
const toLf = (s: string): string => s.replace(/\r\n/g, "\n");
const detectEol = (s: string): "\r\n" | "\n" => (s.includes("\r\n") ? "\r\n" : "\n");
const applyEol = (s: string, eol: "\r\n" | "\n"): string =>
  eol === "\n" ? s : s.replace(/\n/g, eol);

/** Host-separator path → POSIX, so reports read the same on every platform. */
const toPosix = (p: string): string => p.split(sep).join("/");

type BundleSource = { marker: string; path: string };
type BundleTarget = { agent: string; sources: BundleSource[] };

const BUNDLE_TARGETS: BundleTarget[] = [
  {
    agent: join(REPO_ROOT, "plugins/sa-delivery/agents/generators/ekonte-generator.md"),
    sources: [
      {
        marker: "SYSTEM_EKONTE_TEMPLATE.md",
        path: join(SKILL_DIR, "SYSTEM_EKONTE_TEMPLATE.md"),
      },
    ],
  },
  {
    agent: join(REPO_ROOT, "plugins/sa-delivery/agents/generators/settei-generator.md"),
    sources: [
      { marker: "SETTEI_TEMPLATE.md", path: join(SKILL_DIR, "SETTEI_TEMPLATE.md") },
    ],
  },
  {
    agent: join(REPO_ROOT, "plugins/sa-delivery/agents/generators/seam-generator.md"),
    sources: [
      { marker: "SEAM_SPEC_TEMPLATE.md", path: join(SKILL_DIR, "SEAM_SPEC_TEMPLATE.md") },
    ],
  },
  {
    agent: join(REPO_ROOT, "plugins/sa-delivery/agents/generators/cutsheet-generator.md"),
    sources: [
      { marker: "CUT_SHEET_TEMPLATE.md", path: join(SKILL_DIR, "CUT_SHEET_TEMPLATE.md") },
    ],
  },
  {
    agent: join(REPO_ROOT, "plugins/sa-delivery/agents/generators/handoff-asset-generator.md"),
    sources: [
      { marker: "assets/_index.md", path: join(SKILL_DIR, "assets/_index.md") },
      {
        marker: "ASSET_GENERATION_GUIDE.md",
        path: join(SKILL_DIR, "ASSET_GENERATION_GUIDE.md"),
      },
    ],
  },
];

function bundleRegion(
  agentRel: string,
  content: string,
  marker: string,
  body: string,
): string {
  const begin = `<!-- BEGIN_BUNDLE: ${marker} -->`;
  const end = `<!-- END_BUNDLE: ${marker} -->`;
  const beginIdx = content.indexOf(begin);
  const endIdx = content.indexOf(end);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(
      `Missing BUNDLE markers for "${marker}" in ${agentRel}. ` +
        `Add a region:\n${begin}\n${end}`,
    );
  }
  if (endIdx < beginIdx) {
    throw new Error(
      `END_BUNDLE marker before BEGIN_BUNDLE for "${marker}" in ${agentRel}.`,
    );
  }
  const before = content.slice(0, beginIdx + begin.length);
  const after = content.slice(endIdx);
  return `${before}\n${body.trimEnd()}\n${after}`;
}

/** Returns the rebuilt agent file, normalized to LF. */
function buildBundled(target: BundleTarget): string {
  let content = toLf(readFileSync(target.agent, "utf-8"));
  const agentRel = toPosix(relative(REPO_ROOT, target.agent));
  for (const { marker, path } of target.sources) {
    const body = toLf(readFileSync(path, "utf-8"));
    content = bundleRegion(agentRel, content, marker, body);
  }
  return content;
}

function main() {
  const checkMode = process.argv.includes("--check");
  let drift = false;
  let written = 0;

  for (const target of BUNDLE_TARGETS) {
    const agentRel = toPosix(relative(REPO_ROOT, target.agent));
    const raw = readFileSync(target.agent, "utf-8");
    const eol = detectEol(raw);
    // Both sides normalized to LF: the comparison asks whether the *content*
    // drifted, not whether the checkout uses CRLF.
    const current = toLf(raw);
    const bundled = buildBundled(target);

    if (checkMode) {
      if (current !== bundled) {
        console.error(
          `❌ ${agentRel} is out of sync with bundled sources.\n` +
            `   Run: bun run bundle:handoff-agent`,
        );
        drift = true;
      } else {
        console.log(`✅ ${agentRel} bundle is in sync.`);
      }
      continue;
    }

    if (current === bundled) {
      console.log(`✅ ${agentRel} already up-to-date.`);
      continue;
    }

    // Restore the file's own ending so a Windows checkout does not
    // get silently rewritten to LF (and vice versa on Linux).
    writeFileSync(target.agent, applyEol(bundled, eol));
    console.log(`✅ Bundled ${target.sources.length} sources into ${agentRel}`);
    written++;
  }

  if (checkMode && drift) process.exit(1);
  if (!checkMode && written === 0) {
    // All bundles already up-to-date; final summary is the per-target line above.
  }
}

main();
