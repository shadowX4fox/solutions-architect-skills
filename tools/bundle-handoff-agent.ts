#!/usr/bin/env bun
/**
 * Bundles static reference files into the architecture-dev-handoff sub-agents
 * (`agents/generators/handoff-generator.md`, `agents/builders/handoff-context-builder.md`)
 * between BEGIN_BUNDLE/END_BUNDLE markers. Bundled content lives in the
 * sub-agent system prompt and is API-prompt-cached across all spawns within
 * the orchestration window — saving ~300K tokens per 8-component run vs.
 * fresh per-spawn Reads.
 *
 * Usage:
 *   bun tools/bundle-handoff-agent.ts            # writes both agent files in place
 *   bun tools/bundle-handoff-agent.ts --check    # exits 1 if any agent file would change
 *
 * Source-of-truth files stay where they are. Maintainer workflow: edit a
 * source file, run `bun run bundle:handoff-agent`, commit both.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, join, relative } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const SKILL_DIR = join(REPO_ROOT, "skills/architecture-dev-handoff");

type BundleSource = { marker: string; path: string };
type BundleTarget = { agent: string; sources: BundleSource[] };

const BUNDLE_TARGETS: BundleTarget[] = [
  {
    agent: join(REPO_ROOT, "agents/generators/handoff-generator.md"),
    sources: [
      { marker: "HANDOFF_TEMPLATE.md", path: join(SKILL_DIR, "HANDOFF_TEMPLATE.md") },
      { marker: "SECTION_EXTRACTION_GUIDE.md", path: join(SKILL_DIR, "SECTION_EXTRACTION_GUIDE.md") },
      { marker: "assets/_index.md", path: join(SKILL_DIR, "assets/_index.md") },
      { marker: "ASSET_GENERATION_GUIDE.md", path: join(SKILL_DIR, "ASSET_GENERATION_GUIDE.md") },
    ],
  },
  {
    agent: join(REPO_ROOT, "agents/builders/handoff-context-builder.md"),
    sources: [
      { marker: "PAYLOAD_SCHEMA.md", path: join(SKILL_DIR, "PAYLOAD_SCHEMA.md") },
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

function buildBundled(target: BundleTarget): string {
  let content = readFileSync(target.agent, "utf-8");
  const agentRel = relative(REPO_ROOT, target.agent);
  for (const { marker, path } of target.sources) {
    const body = readFileSync(path, "utf-8");
    content = bundleRegion(agentRel, content, marker, body);
  }
  return content;
}

function main() {
  const checkMode = process.argv.includes("--check");
  let drift = false;
  let written = 0;

  for (const target of BUNDLE_TARGETS) {
    const agentRel = relative(REPO_ROOT, target.agent);
    const current = readFileSync(target.agent, "utf-8");
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

    writeFileSync(target.agent, bundled);
    console.log(`✅ Bundled ${target.sources.length} sources into ${agentRel}`);
    written++;
  }

  if (checkMode && drift) process.exit(1);
  if (!checkMode && written === 0) {
    // All bundles already up-to-date; final summary is the per-target line above.
  }
}

main();
